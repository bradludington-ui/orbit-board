#!/bin/bash
# verify/run.sh <label> -- <cmd...> : one bounded run (600 s cap, 10 s grace) in its own process group; timeout PID and
# node child to verify/pids.txt with the command; exit code and wall time to verify/logs/runs.txt. BOARD is unset.
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L2/u13codex/verify
N=$1; shift 2; unset BOARD MUT_FIRST_FAIL
S=$(date +%s.%N); T0=$(TZ=America/New_York date '+%FT%T%Z')
setsid -w timeout -k 10 600 "$@" > "$U/logs/$N.log" 2>&1 &
P=$!
C=; for i in $(seq 1 400); do C=$(pgrep -P $P); [ -n "$C" ] && break; done
for p in $P $C; do echo "$p $T0 $(ps -o comm= -p $p 2>/dev/null || echo gone) $N :: $*" >> $U/pids.txt; done
wait $P; RC=$?
echo "$N start=$T0 exit=$RC wall_s=$(echo "$(date +%s.%N) - $S" | bc) $( [ $RC = 124 -o $RC = 137 ] && echo 'TIMED OUT = incomplete')" | tee -a $U/logs/runs.txt
