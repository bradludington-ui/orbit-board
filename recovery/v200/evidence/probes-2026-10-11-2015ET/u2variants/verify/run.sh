#!/bin/bash
# usage: run.sh <label> <node args...>  -- one bounded run (verifier); records PIDs, log, exit and wall time under verify/.
V=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L2/u2variants/verify
label=$1; shift
s=$(date +%s.%N)
setsid -w timeout -k 10 600 node "$@" > $V/logs/$label.log 2>&1 &
tpid=$!
child=""; for i in $(seq 1 20000); do child=$(ps -o pid= --ppid $tpid 2>/dev/null | tr -d ' '); [ -n "$child" ] && break; done
echo "$(TZ=America/New_York date '+%F %T %Z') label=$label timeout_pid=$tpid node_pid=$child pgid=$tpid cmd=setsid -w timeout -k 10 600 node $*" >> $V/pids.txt
wait $tpid; code=$?
e=$(date +%s.%N)
echo "$label exit=$code wall_s=$(echo "$e - $s" | bc) ended=$(TZ=America/New_York date '+%F %T %Z')" >> $V/logs/runs.txt
echo "$label exit=$code"
