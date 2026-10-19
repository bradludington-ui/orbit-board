#!/bin/bash
# lane2.sh <lane> <file> : lines "F|label|copy|harness|variant" (frun.sh) or "S|label|dir|cmd args" (run.sh); one after another.
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/ef1548c
echo "$$ $(TZ=America/New_York date '+%F %H:%M:%S %Z') bash lane:$1 :: $0 $*" >> $F/pids.txt
while IFS='|' read -r K L A B V; do
  [ -z "$K" ] && continue
  if [ "$K" = F ]; then $F/bin/frun.sh "$L" "$A" "$B" $V; else $F/bin/run.sh "$L" "$A" -- $B > /dev/null; fi
done < "$2"
echo "lane $1 done $(TZ=America/New_York date '+%F %H:%M:%S %Z')" >> $F/logs/runs.txt
