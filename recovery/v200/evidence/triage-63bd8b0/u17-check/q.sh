#!/bin/bash
# q.sh <label> -- <cmd...> : ONE bounded run for the U17 CHECK (rec/L4/u17-check).
#  - Lock first: while scratchpad/AUDIT_IMPORT_RUNNING exists, wait (poll 20 s, up to 30 min); still there -> not run (exit 99).
#  - setsid -w timeout -k 10 600 <cmd> in the background of this script; timeout's PID and its children (pgrep -P, by parent
#    PID only) go to pids.txt with the command. start (ET), exit, wall s -> logs/runs.txt; output -> logs/<label>.log.
#  - BOARD and MUT_FIRST_FAIL unset. Nothing is ever killed by this script.
C=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17-check
LOCK=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/AUDIT_IMPORT_RUNNING
N=$1; shift; [ "$1" = "--" ] && shift
unset BOARD MUT_FIRST_FAIL
mkdir -p "$C/logs"
w=0
while [ -e "$LOCK" ]; do
  [ $w = 0 ] && echo "$N lock-wait from $(TZ=America/New_York date '+%FT%T%Z')" | tee -a "$C/logs/runs.txt"
  w=$((w+1))
  if [ $w -gt 90 ]; then echo "$N NOT RUN: lock still present at $(TZ=America/New_York date '+%FT%T%Z')" | tee -a "$C/logs/runs.txt"; exit 99; fi
  sleep 20
done
[ $w -gt 0 ] && echo "$N lock-wait ended $(TZ=America/New_York date '+%FT%T%Z') after $w polls" >> "$C/logs/runs.txt"
T0=$(TZ=America/New_York date '+%FT%T%Z'); S=$(date +%s.%N)
cd "$C" || exit 98
setsid -w timeout -k 10 600 "$@" > "$C/logs/$N.log" 2>&1 &
P=$!
CH=; for i in $(seq 1 400); do CH=$(pgrep -P $P | tr '\n' ' '); [ -n "$CH" ] && break; done
for p in $P $CH; do echo "$p $T0 $(ps -o comm= -p $p 2>/dev/null || echo exited) $N :: $*" >> "$C/pids.txt"; done
[ -z "$CH" ] && echo "-     $T0 (child exited before it was seen) $N :: $*" >> "$C/pids.txt"
wait $P; RC=$?
E=$(date +%s.%N)
L="$N start=$T0 exit=$RC wall_s=$(awk "BEGIN{printf \"%.1f\", $E-$S}") $( [ $RC = 124 -o $RC = 137 ] && echo 'TIMED OUT = incomplete')"
echo "$L" >> "$C/logs/runs.txt"
if [ "${QTAIL:-}" = "none" ]; then :; elif [ $(wc -l < "$C/logs/$N.log") -gt ${QTAIL:-80} ]; then tail -n ${QTAIL:-80} "$C/logs/$N.log"; else cat "$C/logs/$N.log"; fi
echo "$L"
exit $RC
