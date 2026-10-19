#!/bin/bash
# run.sh <label> <cwd> -- <cmd...> : one bounded node/npm run (setsid -w timeout -k 10 600), lock-checked (AUDIT_IMPORT_RUNNING: poll 20 s,
# up to 30 min), BOARD and MUT_FIRST_FAIL unset, PIDs recorded in pids.txt with the command, "<label> start_et exit wall_s" to logs/runs.txt.
# (Same as rec/L8/cc/c82ea62/bin/run.sh; only the folder differs.)
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/ef2792e
LOCK=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/AUDIT_IMPORT_RUNNING
N=$1; W=$2; shift 2; [ "$1" = "--" ] && shift
unset BOARD MUT_FIRST_FAIL
w=0
while [ -e "$LOCK" ]; do
  if [ $w -ge 1800 ]; then echo "$N SKIPPED: lock still set after 30 min ($(TZ=America/New_York date '+%F %H:%M:%S %Z'))" | tee -a $F/logs/runs.txt; exit 99; fi
  [ $w = 0 ] && echo "$N waiting for the audit-import lock from $(TZ=America/New_York date '+%F %H:%M:%S %Z')" | tee -a $F/logs/runs.txt
  sleep 20; w=$((w+20))
done
LOG=$F/logs/$N.log
[ -e "$LOG" ] && { echo "$N REFUSED: $LOG exists"; exit 97; }
ST=$(TZ=America/New_York date '+%Y-%m-%d %H:%M:%S %Z')
{ echo "# label: $N"; echo "# cwd: $W"; echo "# cmd: $*"; echo "# start: $ST"; echo "# cap: 600 s, kill grace 10 s"; } > "$LOG"
S0=$(date +%s.%N)
cd "$W" || exit 98
setsid -w timeout -k 10 600 "$@" >> "$LOG" 2>&1 &
P=$!
C=; for i in $(seq 1 400); do C=$(pgrep -P $P); [ -n "$C" ] && break; done
for p in $P $C; do echo "$p $(TZ=America/New_York date '+%F %H:%M:%S %Z') $(ps -o comm= -p $p 2>/dev/null || echo gone) run:$N :: $*" >> $F/pids.txt; done
wait $P; RC=$?
WALL=$(python3 -I -c "import time;print(round(time.time()-$S0,1))")
{ echo; echo "# end: $(TZ=America/New_York date '+%Y-%m-%d %H:%M:%S %Z')  exit: $RC  wall_s: $WALL"; } >> "$LOG"
echo "$N start_et=\"$ST\" exit=$RC wall_s=$WALL log=logs/$N.log $( [ $RC = 124 -o $RC = 137 ] && echo 'TIMED OUT = incomplete')" | tee -a $F/logs/runs.txt
exit $RC
