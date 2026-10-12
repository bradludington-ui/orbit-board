#!/bin/bash
# run.sh <label> -- <cmd...> : ONE bounded run (setsid -w timeout -k 10 600), its own process group. The timeout PID and its
# node child go to pids.txt with the command; stdout+stderr to logs/<label>.log; "<label> exit=<code> wall_s=<s>" to logs/runs.txt.
# BOARD and MUT_FIRST_FAIL are unset. Exit 124/137 = timed out = INCOMPLETE, never a pass.
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L2/u1demo
N=$1; shift 2; unset BOARD MUT_FIRST_FAIL
T0=$(date +%s.%N)
setsid -w timeout -k 10 600 "$@" > "$U/logs/$N.log" 2>&1 &
P=$!
C=; for i in $(seq 1 400); do C=$(pgrep -P $P); [ -n "$C" ] && break; done
for p in $P $C; do echo "$p $(TZ=America/New_York date +%FT%T%z) $(ps -o comm= -p $p 2>/dev/null || echo gone) $N :: $*" >> $U/pids.txt; done
wait $P; RC=$?
echo "$N exit=$RC wall_s=$(echo "$(date +%s.%N) - $T0" | bc) $( [ $RC = 124 -o $RC = 137 ] && echo 'TIMED OUT = incomplete')" | tee -a $U/logs/runs.txt
