#!/bin/bash
# brun.sh <label> <cmd...>: one bounded command (setsid -w timeout -k 10 600); for node the AUDIT_IMPORT_RUNNING lock is
# waited for first (20 s polls, 30 min). PIDs to pids.txt; output to logs/<label>.log (echoed); a line to logs/runs.txt.
V=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L3/verify-U13-lateguard
LOCK=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/AUDIT_IMPORT_RUNNING
N=$1; shift
case "$1" in node*) W=0; while [ -e "$LOCK" ]; do
  if [ $W -ge 1800 ]; then echo "$N SKIPPED: lock still present after 30 min" | tee -a $V/logs/runs.txt; exit 99; fi
  [ $W = 0 ] && echo "$N waiting for lock from $(TZ=America/New_York date '+%T %Z')" | tee -a $V/logs/runs.txt
  sleep 20; W=$((W+20)); done;; esac
T0=$(TZ=America/New_York date '+%F %T %Z'); S=$(date +%s.%N)
setsid -w timeout -k 10 600 "$@" > "$V/logs/$N.log" 2>&1 &
P=$!
C=; for i in $(seq 1 400); do C=$(pgrep -P $P); [ -n "$C" ] && break; done
for p in $P $C; do echo "$p $(TZ=America/New_York date '+%FT%T%Z') $(ps -o comm= -p $p 2>/dev/null || echo gone) $N :: $*" >> $V/pids.txt; done
wait $P; RC=$?
cat "$V/logs/$N.log"
echo "$N start=\"$T0\" exit=$RC wall_s=$(echo "$(date +%s.%N) - $S" | bc) log=logs/$N.log" | tee -a $V/logs/runs.txt
