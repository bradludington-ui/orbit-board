#!/bin/bash
# alone-run.sh <clone> <outdir> <dest-under-recovery/v200/evidence> <label> <id>... : full audit-import runs ONE AT A TIME and
# ALONE (BASELINE = unmutated; any other id = that mutation, made from the clone's own mutate.mjs as TEXT by sens-import.sh).
# The same rules as alone-u2b.sh: before each attempt the lock is cleared and the driver waits for 30 s in a row with no
# node/Chromium process outside the clone; then the lock is set and the run starts with the record-only overlap watcher. An
# attempt with anything seen alongside is kept as <id>-OVERLAPPED-<n>.log and repeated (at most 3 attempts; then it stops
# with exit 4). Every finished attempt is backed up at once. The lock is cleared when it ends. 900 s cap + 20 s grace.
E=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec; SP=$(dirname $E); B=$E/bin; LOCK=$SP/AUDIT_IMPORT_RUNNING
C=$1; O=$2; D=$3; LBL=$4; shift 4; mkdir -p "$O"
et() { TZ=America/New_York date '+%I:%M:%S %p ET'; }
foreign() { local CC=$(readlink -f "$C") p cwd; for p in $(pgrep -x node; pgrep -f '^/opt/pw-browsers'; pgrep -x chrome; pgrep -x chromium); do
    cwd=$(readlink -f /proc/$p/cwd 2>/dev/null) || continue; [ "$cwd" = "$CC" ] && continue; case "$cwd" in "$CC"/*) continue;; esac; echo $p; done; }
quiet() { local n=0; while [ $n -lt 30 ]; do if [ -n "$(foreign)" ]; then n=0; else n=$((n+1)); fi; sleep 1; done; }
for id in "$@"; do
  ok=0
  for a in 1 2 3; do
    rm -f $LOCK; echo "$id attempt $a: waiting for 30 quiet seconds from $(et)"; quiet; touch $LOCK; echo "$id attempt $a: lock set, start $(et)"
    $B/overlap-watch.sh "$O" "$C" "$id#$a" & W=$!
    $B/sens-import.sh "$C" "$O" "$id"; sleep 4; kill $W 2>/dev/null; wait $W 2>/dev/null   # the watcher is this script's own child
    if grep -q "^$id#$a OVERLAP" "$O/OVERLAP.txt" 2>/dev/null; then
      [ -f "$O/$id.log" ] && mv "$O/$id.log" "$O/$id-OVERLAPPED-$a.log"
      echo "  ^ $id attempt $a OVERLAPPED (see OVERLAP.txt; log kept as $id-OVERLAPPED-$a.log); repeated" >> "$O/summary.txt"
      $B/backup-run.sh "$O" "$D" "$LBL"; continue
    fi
    $B/backup-run.sh "$O" "$D" "$LBL"; grep -v '^DONE' "$O/summary.txt" | tail -1 | cut -c1-240; ok=1; break
  done
  [ $ok = 1 ] || { echo "$id: three attempts all overlapped; stopping here"; rm -f $LOCK; exit 4; }
done
rm -f $LOCK; echo "lock cleared $(et)"
