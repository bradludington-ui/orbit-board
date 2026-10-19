#!/bin/bash
# waitfor.sh <pattern> [max_s] : read-only wait, up to max_s (default 540) seconds, until logs/runs.txt holds a line matching <pattern>
# (grep -E); 5 s pauses by "read -t 5 <> /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/d6fea76/out/pause.fifo". Prints the matching lines and the time ET. Its PID goes to pids.txt.
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/d6fea76
echo "$$ $(TZ=America/New_York date '+%F %H:%M:%S %Z') bash waitfor :: $0 $*" >> $F/pids.txt
M=${2:-540}; t0=$(date +%s)
until grep -qE "$1" $F/logs/runs.txt; do [ $(( $(date +%s) - t0 )) -ge $M ] && { echo "not yet ($(TZ=America/New_York date '+%H:%M:%S %Z'))"; exit 1; }; read -t 5 <> /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/d6fea76/out/pause.fifo; done
grep -E "$1" $F/logs/runs.txt; TZ=America/New_York date '+%F %H:%M:%S %Z'
