#!/bin/bash
# run.sh <label> <copyRoot> <harness> [variantBoard] : ONE bounded focused run (600 s cap, 10 s grace) in its own process
# group; the timeout PID and its node child go to pids.txt with the command; "<label> exit=<code> wall_s=<s>" to logs/runs.txt.
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L2/u2impl
N=$1; shift; unset BOARD MUT_FIRST_FAIL; rm -f "$U/out/$N.checks.jsonl"; export SUITE_CHECKS="$U/out/$N.checks.jsonl"
S=$(date +%s.%N)
setsid -w timeout -k 10 600 node $U/runner.mjs "$@" > "$U/logs/$N.log" 2>&1 &
P=$!
C=; for i in $(seq 1 400); do C=$(pgrep -P $P); [ -n "$C" ] && break; done
for p in $P $C; do echo "$p $(date -u +%FT%TZ) $(ps -o comm= -p $p 2>/dev/null || echo gone) $N :: node runner.mjs $*" >> $U/pids.txt; done
wait $P; RC=$?
echo "$N exit=$RC wall_s=$(echo "$(date +%s.%N) - $S" | bc) $( [ $RC = 124 -o $RC = 137 ] && echo 'TIMED OUT = incomplete')" | tee -a $U/logs/runs.txt
