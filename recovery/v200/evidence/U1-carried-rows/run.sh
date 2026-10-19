#!/bin/bash
# run.sh <copyDir> <outJson> <label> <logName> -- one bounded probe run; every PID it starts goes to pids.txt, labelled by
# its actual command (in this non-interactive script setsid does not fork: $! becomes timeout, and node is its child)
W=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L2/carry
S=$(date +%s.%N)
setsid -w timeout -k 10 600 node $W/carry-probe.mjs "$1" "$2" "$3" > "$W/logs/$4.log" 2>&1 &
P=$!
C=; for i in $(seq 1 200); do C=$(pgrep -P $P); [ -n "$C" ] && break; done
for p in $P $C; do echo "$p $(date -u +%FT%TZ) $(ps -o comm= -p $p 2>/dev/null || echo gone) $4" >> $W/pids.txt; done
wait $P; RC=$?
E=$(date +%s.%N)
echo "$4 exit=$RC wall_s=$(echo "$E - $S" | bc)" | tee -a $W/logs/runs.txt
