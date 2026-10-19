#!/bin/bash
# alone-u2.sh : U2's full audit-import runs, ONE AT A TIME and ALONE. Commit 1 (4e90af4): BASELINE, v200-u2-putback-gen.
# Commit 2 (a8891e1): BASELINE, v200-u2-putback-while-saving, v200-u2-putback-gen. 900 s cap + 20 s grace (sens-import.sh).
# Before each run: the lock is cleared and the driver waits for 30 s in a row with no node/Chromium process outside the run's
# clone (so the UI workflow's suites can use the gaps); then the lock is set and the run starts, with a record-only watcher.
# A run the watcher saw anything alongside is kept, renamed <id>-OVERLAPPED-<n>.log, and repeated (at most 3 attempts).
# Every finished attempt is backed up immediately. Nothing is ever killed except this script's own watcher child.
E=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec; SP=$(dirname $E); B=$E/bin; LOCK=$SP/AUDIT_IMPORT_RUNNING
et() { TZ=America/New_York date '+%I:%M:%S %p ET'; }
foreign() { local C=$(readlink -f "$1") p cwd; for p in $(pgrep -x node; pgrep -f '^/opt/pw-browsers'; pgrep -x chrome; pgrep -x chromium); do
    cwd=$(readlink -f /proc/$p/cwd 2>/dev/null) || continue; [ "$cwd" = "$C" ] && continue; case "$cwd" in "$C"/*) continue;; esac; echo $p; done; }
quiet() { local n=0; while [ $n -lt 30 ]; do if [ -n "$(foreign "$1")" ]; then n=0; else n=$((n+1)); fi; sleep 1; done; }
run() { # <clone> <outdir> <dest> <label> <id>
  local a
  for a in 1 2 3; do
    rm -f $LOCK; echo "$5 attempt $a: waiting for 30 quiet seconds from $(et)"; quiet "$1"; touch $LOCK; echo "$5 attempt $a: lock set, start $(et)"
    $B/overlap-watch.sh "$2" "$1" "$5#$a" & W=$!
    $B/sens-import.sh "$1" "$2" "$5"; sleep 4; kill $W 2>/dev/null; wait $W 2>/dev/null   # the watcher is this script's own child
    if grep -q "^$5#$a OVERLAP" "$2/OVERLAP.txt" 2>/dev/null; then
      [ -f "$2/$5.log" ] && mv "$2/$5.log" "$2/$5-OVERLAPPED-$a.log"
      echo "  ^ $5 attempt $a OVERLAPPED (see OVERLAP.txt; log kept as $5-OVERLAPPED-$a.log); repeated" >> "$2/summary.txt"
      $B/backup-run.sh "$2" "$3" "$4"; grep "^$5#$a OVERLAP" "$2/OVERLAP.txt" | head -3 | cut -c1-200; continue
    fi
    $B/backup-run.sh "$2" "$3" "$4"; grep -v '^DONE' "$2/summary.txt" | tail -1 | cut -c1-240; return 0
  done
  echo "$5: three attempts all overlapped; stopping here"; rm -f $LOCK; exit 4; }
C1=$E/L2/wt-u2c1; O1=$E/L2/sens-import-u2c1-alone; C2=$E/L2/wt-u2c2; O2=$E/L2/sens-import-u2c2; mkdir -p $O1 $O2
for id in BASELINE v200-u2-putback-gen; do run $C1 $O1 L2-u2/sens-import-u2c1-alone "U2 commit 1 alone" $id; done
for id in BASELINE v200-u2-putback-while-saving v200-u2-putback-gen; do run $C2 $O2 L2-u2/sens-import-u2c2 "U2 commit 2 alone" $id; done
rm -f $LOCK; echo "lock cleared $(et)"; echo ALL-DONE
