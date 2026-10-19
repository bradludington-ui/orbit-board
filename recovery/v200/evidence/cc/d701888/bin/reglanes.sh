#!/bin/bash
# reglanes.sh : earlier v2.00 / save-and-refresh audit-import blocks, focused harnesses built verbatim from the COMMITTED suite, on the committed board; two lanes.
D=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/d701888
echo "# regression lanes launched $(TZ=America/New_York date '+%F %H:%M:%S %Z')" >> $D/logs/runs.txt
( $D/bin/frun.sh G-u20-after after G-u20.mjs; $D/bin/frun.sh F-folderA-after after F-folderA.mjs ) &
( $D/bin/frun.sh G-u2u13-after after G-u2u13.mjs; $D/bin/frun.sh F-folderB-after after F-folderB.mjs ) &
wait
echo "# regression lanes done $(TZ=America/New_York date '+%F %H:%M:%S %Z')" >> $D/logs/runs.txt
