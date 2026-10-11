#!/bin/bash
# run.sh <probe.mjs> <copyDir> <outJson> <label> <logName> -- one bounded probe run; PIDs (timeout and its node child) to pids.txt
W=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L2/carry-verify
S=$(date +%s.%N)
setsid -w timeout -k 10 600 node "$1" "$2" "$3" "$4" > "$W/logs/$5.log" 2>&1 &
P=$!
C=; for i in $(seq 1 400); do C=$(pgrep -P $P); [ -n "$C" ] && break; done
for p in $P $C; do echo "$p $(date -u +%FT%TZ) $(ps -o comm= -p $p 2>/dev/null || echo gone) $5" >> $W/pids.txt; done
wait $P; RC=$?
E=$(date +%s.%N)
echo "$5 exit=$RC wall_s=$(echo "$E - $S" | bc)" | tee -a $W/logs/runs.txt
