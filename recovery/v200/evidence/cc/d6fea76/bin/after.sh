#!/bin/bash
# after.sh <pid> <jobfile> : waits (poll 10 s) until <pid> (a lane of mine, recorded in pids.txt) has exited, then runs lane2.sh <jobfile>.
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/d6fea76
echo "$$ $(TZ=America/New_York date '+%F %H:%M:%S %Z') bash after:$(basename $2) :: $0 $*" >> $F/pids.txt
while kill -0 $1 2>/dev/null; do sleep 10; done
exec $F/bin/lane2.sh $2
