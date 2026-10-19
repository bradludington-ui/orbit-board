#!/bin/bash
# appendruns.sh : appends logs/runs.txt (as of now) to README.md in a code block; text only
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17
{ echo '```'; cat $U/logs/runs.txt; echo "(this list was appended by appendruns.sh, itself the run 'appendruns' that starts $(TZ=America/New_York date '+%FT%T%Z'); its own line is in logs/runs.txt)"; echo '```'; } >> $U/README.md
echo "README lines: $(wc -l < $U/README.md)"
