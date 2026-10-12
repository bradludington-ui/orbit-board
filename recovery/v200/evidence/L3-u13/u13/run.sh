#!/bin/bash
# run.sh <label> <copyRoot> <harness> [variantBoard] : ONE bounded focused run (600 s cap, 10 s grace) in its own process
# group, adapted from rec/L2/u2impl/run.sh (paths; the lock wait; ET times). Before it starts: if the lead's
# AUDIT_IMPORT_RUNNING lock exists, wait (poll every 20 s, up to 30 min); still there after 30 min -> the run is SKIPPED and
# says so. The timeout PID and its node child go to pids.txt with the command; "<label> exit=<code> wall_s=<s>" to logs/runs.txt.
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L3/u13
LOCK=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/AUDIT_IMPORT_RUNNING
N=$1; shift; unset BOARD MUT_FIRST_FAIL
W=0; while [ -e "$LOCK" ]; do
  if [ $W -ge 1800 ]; then echo "$N SKIPPED: $LOCK still present after 30 min ($(TZ=America/New_York date '+%F %T %Z'))" | tee -a $U/logs/runs.txt; exit 99; fi
  [ $W = 0 ] && echo "$N waiting for $LOCK from $(TZ=America/New_York date '+%T %Z')" | tee -a $U/logs/runs.txt
  sleep 20; W=$((W+20)); done
rm -f "$U/out/$N.checks.jsonl"; export SUITE_CHECKS="$U/out/$N.checks.jsonl"
T0=$(TZ=America/New_York date '+%F %T %Z'); S=$(date +%s.%N)
setsid -w timeout -k 10 600 node $U/runner.mjs "$@" > "$U/logs/$N.log" 2>&1 &
P=$!
C=; for i in $(seq 1 400); do C=$(pgrep -P $P); [ -n "$C" ] && break; done
for p in $P $C; do echo "$p $(TZ=America/New_York date '+%FT%T%Z') $(ps -o comm= -p $p 2>/dev/null || echo gone) $N :: node runner.mjs $*" >> $U/pids.txt; done
wait $P; RC=$?
echo "$N start=\"$T0\" exit=$RC wall_s=$(echo "$(date +%s.%N) - $S" | bc) log=logs/$N.log $( [ $RC = 124 -o $RC = 137 ] && echo 'TIMED OUT = incomplete')" | tee -a $U/logs/runs.txt
