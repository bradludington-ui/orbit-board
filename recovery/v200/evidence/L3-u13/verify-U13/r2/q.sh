#!/bin/bash
# q.sh <label> <cmd...> : ONE bounded SMALL command for the U13 verifier, round 2 (setsid -w timeout -k 10 600), output
# printed. Same rules as run.sh: for node (or anything naming chromium) the AUDIT_IMPORT_RUNNING lock is waited for first
# (20 s polls, 30 min, then SKIPPED). The timeout PID and its child go to ../pids.txt with the command; "<label> start= exit=
# wall_s=" to logs/runs-small.txt.
V=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L3/verify-U13
R=$V/r2
LOCK=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/AUDIT_IMPORT_RUNNING
N=$1; shift
case "$*" in *node*|*chromium*) W=0; while [ -e "$LOCK" ]; do
  if [ $W -ge 1800 ]; then echo "$N SKIPPED: $LOCK still present after 30 min" | tee -a $R/logs/runs-small.txt; exit 99; fi
  [ $W = 0 ] && echo "$N waiting for $LOCK from $(TZ=America/New_York date '+%T %Z')" | tee -a $R/logs/runs-small.txt
  sleep 20; W=$((W+20)); done;; esac
T0=$(TZ=America/New_York date '+%F %T %Z'); S=$(date +%s.%N)
TMPO=$(mktemp -p $R/logs .q.XXXXXX)
setsid -w timeout -k 10 600 "$@" > "$TMPO" 2>&1 &
P=$!
C=; for i in $(seq 1 400); do C=$(pgrep -P $P); [ -n "$C" ] && break; done
for p in $P $C; do echo "$p $(TZ=America/New_York date '+%FT%T%Z') $(ps -o comm= -p $p 2>/dev/null || echo gone) r2q:$N :: $*" >> $V/pids.txt; done
wait $P; RC=$?
cat "$TMPO"; rm -f "$TMPO"
echo "$N start=\"$T0\" exit=$RC wall_s=$(echo "$(date +%s.%N) - $S" | bc) $( [ $RC = 124 -o $RC = 137 ] && echo 'TIMED OUT = incomplete')" >> $R/logs/runs-small.txt
exit $RC
