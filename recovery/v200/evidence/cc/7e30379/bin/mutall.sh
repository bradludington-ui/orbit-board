#!/bin/bash
# mutall.sh : every new entry of the commit (out/new-ids.txt), one after another
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/7e30379
for i in $(cat $F/out/new-ids.txt); do $F/bin/mutrun.sh $i; done
echo "mutall done $(TZ=America/New_York date '+%F %H:%M:%S %Z')"
