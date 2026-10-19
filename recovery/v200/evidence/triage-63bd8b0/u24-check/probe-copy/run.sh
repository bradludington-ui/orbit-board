#!/bin/bash
# run.sh <label> <node args...> : ONE bounded probe run (600 s cap, 10 s grace) in its own process group (adapted from
# rec/L4/u19/run.sh). Before it starts: if AUDIT_IMPORT_RUNNING exists, wait (poll every 20 s, up to 30 min); still there
# after 30 min -> SKIPPED and says so. The timeout PID and its node child go to pids.txt with the command;
# "<label> start= exit= wall_s=" to logs/runs.txt; output to logs/<label>.log.
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u24
LOCK=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/AUDIT_IMPORT_RUNNING
mkdir -p $U/logs
N=$1; shift; unset BOARD MUT_FIRST_FAIL; export TZ=America/New_York   # the board renders its own times in ET
W=0; while [ -e "$LOCK" ]; do
  if [ $W -ge 1800 ]; then echo "$N SKIPPED: $LOCK still present after 30 min ($(TZ=America/New_York date '+%F %T %Z'))" | tee -a $U/logs/runs.txt; exit 99; fi
  [ $W = 0 ] && echo "$N waiting for $LOCK from $(TZ=America/New_York date '+%T %Z')" | tee -a $U/logs/runs.txt
  sleep 20; W=$((W+20)); done
T0=$(TZ=America/New_York date '+%F %T %Z'); S=$(date +%s.%N)
setsid -w timeout -k 10 600 node "$@" > "$U/logs/$N.log" 2>&1 &
P=$!
C=; for i in $(seq 1 400); do C=$(ps -o pid= --ppid $P 2>/dev/null | tr -d ' '); [ -n "$C" ] && break; done
for p in $P $C; do echo "$p $(TZ=America/New_York date '+%FT%T%Z') $(ps -o comm= -p $p 2>/dev/null || echo gone) $N :: setsid -w timeout -k 10 600 node $*" >> $U/pids.txt; done
wait $P; RC=$?
echo "$N start=\"$T0\" exit=$RC wall_s=$(echo "$(date +%s.%N) - $S" | bc) log=logs/$N.log $( [ $RC = 124 -o $RC = 137 ] && echo 'TIMED OUT = incomplete')" | tee -a $U/logs/runs.txt
exit $RC
