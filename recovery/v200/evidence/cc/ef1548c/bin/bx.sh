#!/bin/bash
# bx.sh <label> -- <cmd...> : a bounded text/hash/build command (setsid -w timeout -k 10 600); PID + command to pids.txt;
# "<label> start_et=.. exit=.. wall_s=.." to logs/bx.txt; output to logs/<label>.log (and echoed).
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/ef1548c
N=$1; shift; [ "$1" = "--" ] && shift
export TZ=America/New_York
ST=$(date '+%Y-%m-%d %H:%M:%S %Z'); S0=$(date +%s.%N)
setsid -w timeout -k 10 600 "$@" > $F/logs/$N.log 2>&1 &
P=$!
C=; for i in $(seq 1 200); do C=$(pgrep -P $P); [ -n "$C" ] && break; done
for p in $P $C; do echo "$p $(date '+%F %H:%M:%S %Z') $(ps -o comm= -p $p 2>/dev/null || echo gone) bx:$N :: $*" >> $F/pids.txt; done
wait $P; RC=$?
WALL=$(python3 -I -c "import time;print(round(time.time()-$S0,2))")
echo "$N start_et=\"$ST\" exit=$RC wall_s=$WALL" >> $F/logs/bx.txt
cat $F/logs/$N.log; echo "[$N exit=$RC wall_s=$WALL start=$ST]"
exit $RC
