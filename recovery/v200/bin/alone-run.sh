#!/bin/bash
# alone-run.sh <clone> <outdir> <dest-under-recovery/v200/evidence> <label> <id>... : full audit-import runs ONE AT A TIME and
# ALONE (BASELINE = unmutated; any other id = that mutation, made from the clone's own mutate.mjs as TEXT by sens-import.sh).
# The same rules as alone-u2b.sh: before each attempt the lock is cleared and the driver waits for 30 s in a row with no
# node/Chromium process outside the clone; then the lock is set and the run starts with the record-only overlap watcher. An
# attempt with anything seen alongside is kept as <id>-OVERLAPPED-<n>.log and repeated (at most 3 attempts; then it stops
# with exit 4). Every finished attempt is backed up at once. The lock is cleared when it ends. 900 s cap + 20 s grace.
# Helpers come from this script's OWN directory (the frozen snapshot), never from a fixed path (runner correction).
B=$(cd "$(dirname "$0")" && pwd -P); SP=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad; LOCK=$SP/AUDIT_IMPORT_RUNNING
# PROVENANCE (runner correction, Brad, 12 Oct): every helper runs from the frozen snapshot $SNAP of the pinned backup
# commit $RUNNER_SHA, and is checked against that commit immediately before it is executed.
REPO=/home/user/orbit-board
vh(){ local f n want got d
  [[ "$RUNNER_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo "REFUSED: RUNNER_SHA must be a full 40-hex commit"; exit 2; }
  [ -n "$SNAP" ] || { echo "REFUSED: SNAP (the frozen snapshot) is not set"; exit 2; }
  for f in "$@"; do n=$(basename "$f"); d=$(cd "$(dirname "$f")" 2>/dev/null && pwd -P)
    [ "$d" = "$SNAP" ] || { echo "REFUSED: $n is not in the frozen snapshot $SNAP (it is in $d)"; exit 2; }
    want=$(git -C "$REPO" rev-parse --verify -q "$RUNNER_SHA:recovery/v200/bin/$n") || { echo "REFUSED: $n is not in runner commit $RUNNER_SHA"; exit 2; }
    got=$(git hash-object "$f")
    [ "$want" = "$got" ] || { echo "REFUSED: $n is $got, not runner commit $RUNNER_SHA's $want"; exit 2; }
  done; }

vh "$0" "$B/overlap-watch.sh" "$B/sens-import.sh" "$B/backup-run.sh"   # before anything else, the lock included
C=$1; O=$2; D=$3; LBL=$4; shift 4; mkdir -p "$O"
et() { TZ=America/New_York date '+%I:%M:%S %p ET'; }
foreign() { local CC=$(readlink -f "$C") p cwd; for p in $(pgrep -x node; pgrep -f '^/opt/pw-browsers'; pgrep -x chrome; pgrep -x chromium); do
    cwd=$(readlink -f /proc/$p/cwd 2>/dev/null) || continue; [ "$cwd" = "$CC" ] && continue; case "$cwd" in "$CC"/*) continue;; esac; echo $p; done; }
quiet() { local n=0; while [ $n -lt 30 ]; do if [ -n "$(foreign)" ]; then n=0; else n=$((n+1)); fi; sleep 1; done; }
for id in "$@"; do
  ok=0
  for a in 1 2 3; do
    rm -f $LOCK; echo "$id attempt $a: waiting for 30 quiet seconds from $(et)"; quiet; touch $LOCK; echo "$id attempt $a: lock set, start $(et)"
    vh "$B/overlap-watch.sh" "$B/sens-import.sh"; $B/overlap-watch.sh "$O" "$C" "$id#$a" & W=$!
    $B/sens-import.sh "$C" "$O" "$id"; sleep 4; kill $W 2>/dev/null; wait $W 2>/dev/null   # the watcher is this script's own child
    if grep -q "^$id#$a OVERLAP" "$O/OVERLAP.txt" 2>/dev/null; then
      [ -f "$O/$id.log" ] && mv "$O/$id.log" "$O/$id-OVERLAPPED-$a.log"
      echo "  ^ $id attempt $a OVERLAPPED (see OVERLAP.txt; log kept as $id-OVERLAPPED-$a.log); repeated" >> "$O/summary.txt"
      vh "$B/backup-run.sh"; $B/backup-run.sh "$O" "$D" "$LBL"; continue
    fi
    vh "$B/backup-run.sh"; $B/backup-run.sh "$O" "$D" "$LBL"; grep -v '^DONE' "$O/summary.txt" | tail -1 | cut -c1-240; ok=1; break
  done
  [ $ok = 1 ] || { echo "$id: three attempts all overlapped; stopping here"; rm -f $LOCK; exit 4; }
done
rm -f $LOCK; echo "lock cleared $(et)"
