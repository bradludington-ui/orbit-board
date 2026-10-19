#!/bin/bash
# mutbatch.sh <id>... : the given entries in two lanes (one mutant per lane at a time), each through mutrun.sh
# (mkmut.py text only via bx.sh; the focused harness via fr.sh -> run.sh: lock check, setsid -w timeout -k 10 600, PIDs recorded).
# Started itself through bx.sh, so the batch as a whole is capped at 600 s too.
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/224f878
IDS=("$@")
lane(){ local i; for ((i=$1; i<${#IDS[@]}; i+=2)); do $F/bin/mutrun.sh ${IDS[$i]}; done; }
lane 0 & lane 1 & wait
echo "batch done $(TZ=America/New_York date '+%F %H:%M:%S %Z'): $*"
