#!/bin/bash
# q.sh <label> <cmd...> : ONE bounded command -- setsid -w timeout -k 10 600 -- for the U20 CHECKER (adapted from
# rec/L4/u20/q.sh). For node, python, bash running node, or anything naming chromium, the AUDIT_IMPORT_RUNNING lock is
# waited for first (20 s polls, up to 30 min, then SKIPPED). The timeout PID and its child go to pids.txt with the command;
# "<label> start= exit= wall_s=" to logs/runs.txt. Output to logs/<label>.log and printed.
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u20-check
LOCK=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/AUDIT_IMPORT_RUNNING
mkdir -p $U/logs
N=$1; shift; unset BOARD MUT_FIRST_FAIL; export TZ=America/New_York
case "$*" in *node*|*python*|*chromium*) W=0; while [ -e "$LOCK" ]; do
  if [ $W -ge 1800 ]; then echo "$N SKIPPED: $LOCK still present after 30 min ($(date '+%F %T %Z'))" | tee -a $U/logs/runs.txt; exit 99; fi
  [ $W = 0 ] && echo "$N waiting for $LOCK from $(date '+%T %Z')" | tee -a $U/logs/runs.txt
  sleep 20; W=$((W+20)); done;; esac
T0=$(date '+%F %T %Z'); S=$(date +%s.%N)
setsid -w timeout -k 10 600 "$@" > "$U/logs/$N.log" 2>&1 &
P=$!
C=; for i in $(seq 1 400); do C=$(ps -o pid= --ppid $P 2>/dev/null | tr -d ' '); [ -n "$C" ] && break; done
for p in $P $C; do echo "$p $(date '+%FT%T%Z') $(ps -o comm= -p $p 2>/dev/null || echo gone) $N :: setsid -w timeout -k 10 600 $*" >> $U/pids.txt; done
wait $P; RC=$?
cat "$U/logs/$N.log"
echo "$N start=\"$T0\" exit=$RC wall_s=$(echo "$(date +%s.%N) - $S" | bc) log=logs/$N.log $( [ $RC = 124 -o $RC = 137 ] && echo 'TIMED OUT = incomplete')" | tee -a $U/logs/runs.txt
exit $RC
