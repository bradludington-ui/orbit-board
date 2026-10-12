#!/bin/bash
# brun.sh <label> <cmd...> : one bounded command (setsid -w timeout -k 10 600) for anything that is not a focused harness
# (node --check, the python3 -I text helpers). For node (and any command naming chromium) the AUDIT_IMPORT_RUNNING lock is
# waited for first (20 s polls, 30 min, then SKIPPED). The timeout PID and its child go to pids.txt with the command; stdout
# and stderr to logs/<label>.log (and echoed); "<label> start= exit= wall_s= log=" to logs/runs.txt.
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L3/u13
LOCK=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/AUDIT_IMPORT_RUNNING
N=$1; shift
case "$1 $*" in node*|*chromium*) W=0; while [ -e "$LOCK" ]; do
  if [ $W -ge 1800 ]; then echo "$N SKIPPED: $LOCK still present after 30 min" | tee -a $U/logs/runs.txt; exit 99; fi
  [ $W = 0 ] && echo "$N waiting for $LOCK from $(TZ=America/New_York date '+%T %Z')" | tee -a $U/logs/runs.txt
  sleep 20; W=$((W+20)); done;; esac
T0=$(TZ=America/New_York date '+%F %T %Z'); S=$(date +%s.%N)
setsid -w timeout -k 10 600 "$@" > "$U/logs/$N.log" 2>&1 &
P=$!
C=; for i in $(seq 1 400); do C=$(pgrep -P $P); [ -n "$C" ] && break; done
for p in $P $C; do echo "$p $(TZ=America/New_York date '+%FT%T%Z') $(ps -o comm= -p $p 2>/dev/null || echo gone) $N :: $*" >> $U/pids.txt; done
wait $P; RC=$?
cat "$U/logs/$N.log"
echo "$N start=\"$T0\" exit=$RC wall_s=$(echo "$(date +%s.%N) - $S" | bc) log=logs/$N.log $( [ $RC = 124 -o $RC = 137 ] && echo 'TIMED OUT = incomplete')" | tee -a $U/logs/runs.txt
