#!/bin/bash
# q.sh <label> -- <cmd...> : ONE bounded run for the U17 re-measurement (rec/L4/u17).
#  - Lock first: while scratchpad/AUDIT_IMPORT_RUNNING exists, wait (poll 20 s, up to 30 min); still there -> not run (exit 99).
#  - Then: setsid -w timeout -k 10 600 <cmd>, in the background of this script so its PIDs can be recorded:
#    timeout's PID and each child of it (pgrep -P <timeout pid>, by parent PID only) go to pids.txt with the command.
#  - start (ET), exit code and wall seconds go to logs/runs.txt; the output to logs/<label>.log (printed, or its tail).
#  - BOARD and MUT_FIRST_FAIL are unset. Nothing is ever killed by this script.
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17
LOCK=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/AUDIT_IMPORT_RUNNING
N=$1; shift; [ "$1" = "--" ] && shift
unset BOARD MUT_FIRST_FAIL
mkdir -p "$U/logs"
w=0
while [ -e "$LOCK" ]; do
  [ $w = 0 ] && echo "$N lock-wait from $(TZ=America/New_York date '+%FT%T%Z')" | tee -a "$U/logs/runs.txt"
  w=$((w+1))
  if [ $w -gt 90 ]; then echo "$N NOT RUN: lock still present at $(TZ=America/New_York date '+%FT%T%Z')" | tee -a "$U/logs/runs.txt"; exit 99; fi
  sleep 20
done
T0=$(TZ=America/New_York date '+%FT%T%Z'); S=$(date +%s.%N)
cd "$U" || exit 98
setsid -w timeout -k 10 600 "$@" > "$U/logs/$N.log" 2>&1 &
P=$!
C=; for i in $(seq 1 400); do C=$(pgrep -P $P | tr '\n' ' '); [ -n "$C" ] && break; done
for p in $P $C; do echo "$p $T0 $(ps -o comm= -p $p 2>/dev/null || echo exited) $N :: $*" >> "$U/pids.txt"; done
[ -z "$C" ] && echo "-     $T0 (child exited before it was seen) $N :: $*" >> "$U/pids.txt"
wait $P; RC=$?
E=$(date +%s.%N)
L="$N start=$T0 exit=$RC wall_s=$(awk "BEGIN{printf \"%.1f\", $E-$S}") $( [ $RC = 124 -o $RC = 137 ] && echo 'TIMED OUT = incomplete')"
echo "$L" >> "$U/logs/runs.txt"
if [ "${QTAIL:-}" = "none" ]; then :; elif [ $(wc -l < "$U/logs/$N.log") -gt ${QTAIL:-80} ]; then tail -n ${QTAIL:-80} "$U/logs/$N.log"; else cat "$U/logs/$N.log"; fi
echo "$L"
exit $RC
