#!/bin/bash
# runw.sh <label> <ROOT> <MODES> [BOARD] [BRANCHES] [CALLS]: one bounded harness run (setsid -w timeout -k 10 600) after the
# AUDIT_IMPORT_RUNNING lock check (20 s polls, 30 min). PIDs to pids.txt; a summary line to logs/runs.txt. Times ET.
V=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L3/verify-U13-lateguard
LOCK=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/AUDIT_IMPORT_RUNNING
N=$1; R=$2; M=$3; BD=${4:-}; BRS=${5:-}; CS=${6:-}
W=0; while [ -e "$LOCK" ]; do
  if [ $W -ge 1800 ]; then echo "$N SKIPPED: lock still present after 30 min ($(TZ=America/New_York date '+%F %T %Z'))" | tee -a $V/logs/runs.txt; exit 99; fi
  [ $W = 0 ] && echo "$N waiting for lock from $(TZ=America/New_York date '+%T %Z')" | tee -a $V/logs/runs.txt
  sleep 20; W=$((W+20)); done
T0=$(TZ=America/New_York date '+%F %T %Z'); S=$(date +%s.%N)
XV=${XV:-} ROOT=$R MODES=$M BOARD=$BD BRANCHES=$BRS CALLS=$CS OUT=$V/out/$N.jsonl setsid -w timeout -k 10 600 node $V/h/${HARNESS:-lateguard.mjs} > $V/logs/$N.log 2>&1 &
P=$!
C=; for i in $(seq 1 400); do C=$(pgrep -P $P); [ -n "$C" ] && break; done
for p in $P $C; do echo "$p $(TZ=America/New_York date '+%FT%T%Z') $(ps -o comm= -p $p 2>/dev/null || echo gone) $N :: XV=${XV:-} ROOT=$R MODES=$M BOARD=$BD node h/${HARNESS:-lateguard.mjs}" >> $V/pids.txt; done
wait $P; RC=$?
echo "$N start=\"$T0\" end=\"$(TZ=America/New_York date '+%T %Z')\" exit=$RC wall_s=$(echo "$(date +%s.%N) - $S" | bc) log=logs/$N.log $( [ $RC = 124 -o $RC = 137 ] && echo 'TIMED OUT = incomplete')" | tee -a $V/logs/runs.txt
