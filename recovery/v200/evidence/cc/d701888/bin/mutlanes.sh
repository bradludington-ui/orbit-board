#!/bin/bash
# mutlanes.sh : the 12 committed U30 mutants through G-u30 (built from the committed suite), BOARD set to each mutant (runner asserts it), two lanes.
D=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/d701888
mapfile -t IDS < $D/out/new-ids.txt
lane(){ for ((i=$1; i<${#IDS[@]}; i+=2)); do id=${IDS[$i]}; $D/bin/frun.sh m-$id after G-u30.mjs $D/mut/$id.html; done; }
echo "# mutant lanes launched $(TZ=America/New_York date '+%F %H:%M:%S %Z')" >> $D/logs/runs.txt
lane 0 & lane 1 & wait
echo "# mutant lanes done $(TZ=America/New_York date '+%F %H:%M:%S %Z')" >> $D/logs/runs.txt
