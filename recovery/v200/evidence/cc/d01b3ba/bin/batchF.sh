#!/bin/bash
# batchF.sh : check 2's focused runs, two at a time, each through fr.sh (run.sh: lock check, setsid -w timeout -k 10 600, PIDs recorded).
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/d01b3ba
$F/bin/fr.sh F-commit after after & $F/bin/fr.sh F-parent before before & wait
$F/bin/fr.sh F-pre-u10-16ceb83 after after $F/variants/board-16ceb83.html & $F/bin/fr.sh F-base-7ee498a after after $F/variants/board-7ee498a.html & wait
$F/bin/fr.sh F-parentown-parent parentown before & wait
echo BATCH-F-DONE $(TZ=America/New_York date '+%F %H:%M:%S %Z')
