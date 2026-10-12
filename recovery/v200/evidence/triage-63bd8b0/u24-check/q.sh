#!/bin/bash
# q.sh <label> <cmd...> : ONE bounded command for the U24 checker -- setsid -w timeout -k 10 600 <cmd> -- in its own session.
# Adapted (rewritten, not copied) from rec/L4/u24/q.sh. If the command line names node, python or chromium anywhere, the
# AUDIT_IMPORT_RUNNING lock is waited for first (20 s polls, up to 30 min, then SKIPPED, exit 99).
# The timeout PID and its direct child go to pids.txt with the command and the ET clock; "<label> start= exit= wall_s=" to
# logs/runs.txt. Output goes to logs/<label>.log and is also printed.
C=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u24-check
LOCK=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/AUDIT_IMPORT_RUNNING
mkdir -p $C/logs
N=$1; shift; unset BOARD MUT_FIRST_FAIL; export TZ=America/New_York
case " $* " in *node*|*python*|*chromium*|*run.sh*|*matrix*) W=0; while [ -e "$LOCK" ]; do
  if [ $W -ge 1800 ]; then echo "$N SKIPPED: lock still present after 30 min ($(date '+%F %T %Z'))" | tee -a $C/logs/runs.txt; exit 99; fi
  [ $W = 0 ] && echo "$N waiting for lock from $(date '+%T %Z')" | tee -a $C/logs/runs.txt
  sleep 20; W=$((W+20)); done;; esac
T0=$(date '+%F %T %Z'); S=$(date +%s.%N)
setsid -w timeout -k 10 600 "$@" > "$C/logs/$N.log" 2>&1 &
P=$!
K=; for i in $(seq 1 400); do K=$(ps -o pid= --ppid $P 2>/dev/null | tr -d ' ' | head -1); [ -n "$K" ] && break; kill -0 $P 2>/dev/null || break; done
for p in $P $K; do echo "$p $(date '+%FT%T%Z') $(ps -o comm= -p $p 2>/dev/null || echo gone) $N :: setsid -w timeout -k 10 600 $*" >> $C/pids.txt; done
wait $P; RC=$?
cat "$C/logs/$N.log"
echo "$N start=\"$T0\" exit=$RC wall_s=$(echo "$(date +%s.%N) - $S" | bc) log=logs/$N.log $( [ $RC = 124 -o $RC = 137 ] && echo 'TIMED OUT = incomplete')" | tee -a $C/logs/runs.txt
exit $RC
