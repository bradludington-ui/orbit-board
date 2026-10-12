#!/bin/bash
# vrun.sh <label> -- <cmd...> : one bounded run (600 s cap, 10 s grace) in its own process group; timeout PID and node child
# go to verify/pids.txt with the command; exit code and wall time to verify/logs/runs.txt. BOARD unset.
V=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L2/u13probe/verify
N=$1; shift 2; unset BOARD MUT_FIRST_FAIL
S=$(date +%s.%N)
setsid -w timeout -k 10 600 "$@" > "$V/logs/$N.log" 2>&1 &
P=$!
C=; for i in $(seq 1 400); do C=$(pgrep -P $P); [ -n "$C" ] && break; done
for p in $P $C; do echo "$p $(TZ=America/New_York date '+%FT%T%Z') $(ps -o comm= -p $p 2>/dev/null || echo gone) $N :: $*" >> $V/pids.txt; done
wait $P; RC=$?
echo "$N exit=$RC wall_s=$(echo "$(date +%s.%N) - $S" | bc) $( [ $RC = 124 -o $RC = 137 ] && echo 'TIMED OUT = incomplete')" | tee -a $V/logs/runs.txt
