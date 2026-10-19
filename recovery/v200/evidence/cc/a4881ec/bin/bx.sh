#!/bin/bash
# bx.sh <label> -- <cmd...> : one bounded NON-node command (git reads, text helpers, diffs, hashes, copies): setsid -w timeout -k 10 600,
# its own process group; the timeout PID and its child go to pids.txt with the command. Output passes through.
# "<label> start_et exit wall_s" is appended to logs/bx.txt.
# (From rec/L8/cc/16ceb83/bin/bx.sh; the folder differs and the logs/bx.txt line is added.)
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/a4881ec
N=$1; shift; [ "$1" = "--" ] && shift
ST=$(TZ=America/New_York date '+%F %H:%M:%S %Z'); S0=$(date +%s.%N)
setsid -w timeout -k 10 600 "$@" &
P=$!
C=; for i in $(seq 1 200); do C=$(pgrep -P $P); [ -n "$C" ] && break; done
for p in $P $C; do echo "$p $(TZ=America/New_York date '+%F %H:%M:%S %Z') $(ps -o comm= -p $p 2>/dev/null || echo gone) bx:$N :: $*" >> $F/pids.txt; done
wait $P; RC=$?
WALL=$(python3 -I -c "import time;print(round(time.time()-$S0,1))")
echo "$N start_et=\"$ST\" exit=$RC wall_s=$WALL" >> $F/logs/bx.txt
exit $RC
