#!/bin/bash
# lane.sh <lane name> <file of lines "label|copy|harness|variant"> : runs them one after another through frun.sh; records its own PID.
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/ef1548c
echo "$$ $(TZ=America/New_York date '+%F %H:%M:%S %Z') bash lane:$1 :: $0 $*" >> $F/pids.txt
while IFS='|' read -r L C H V; do [ -z "$L" ] && continue; $F/bin/frun.sh "$L" "$C" "$H" $V; done < "$2"
echo "lane $1 done $(TZ=America/New_York date '+%F %H:%M:%S %Z')" >> $F/logs/runs.txt
