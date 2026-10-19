#!/bin/bash
# bx.sh <label> -- <cmd...> : one bounded NON-node command (git reads, text helpers, diffs, hashes, copies): setsid -w timeout -k 10 600,
# its own process group; the timeout PID and its child go to pids.txt with the command. Output passes through.
# (Same as rec/L8/cc/c82ea62/bin/bx.sh; only the folder differs.)
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/ef2792e
N=$1; shift; [ "$1" = "--" ] && shift
setsid -w timeout -k 10 600 "$@" &
P=$!
C=; for i in $(seq 1 200); do C=$(pgrep -P $P); [ -n "$C" ] && break; done
for p in $P $C; do echo "$p $(TZ=America/New_York date '+%F %H:%M:%S %Z') $(ps -o comm= -p $p 2>/dev/null || echo gone) bx:$N :: $*" >> $F/pids.txt; done
wait $P; exit $?
