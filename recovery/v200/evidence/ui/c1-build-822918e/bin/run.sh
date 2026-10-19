#!/bin/bash
# run.sh <label> <logfile> [cap=600] -- <command...>
# Waits for the AUDIT_IMPORT lock (poll 20 s, up to 30 min; still there -> SKIPPED, exit 99), then runs
#   setsid -w timeout -k 10 <cap> <command...>
# records the timeout's PID and its children (with command lines) in c1/pids.txt, and writes start (ET),
# end (ET), exit code and wall seconds into the log and into c1/runs.txt.
C=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1
LOCK=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/AUDIT_IMPORT_RUNNING
LABEL=$1; LOG=$2; shift 2; CAP=600; case "$1" in cap=*) CAP=${1#cap=}; shift;; esac
[ "$1" = "--" ] && shift
W=0; while [ -e "$LOCK" ]; do
  [ $W -ge 1800 ] && { echo "$LABEL SKIPPED: lock still present after 30 min ($(TZ=America/New_York date '+%F %T %Z'))" | tee -a "$LOG" "$C/runs.txt"; exit 99; }
  [ $W -eq 0 ] && echo "# $LABEL: lock present at $(TZ=America/New_York date '+%T %Z'), waiting" >> "$C/lockwaits.txt"
  sleep 20; W=$((W+20)); done
[ $W -gt 0 ] && echo "# $LABEL: lock cleared after ${W}s at $(TZ=America/New_York date '+%T %Z')" >> "$C/lockwaits.txt"
ST=$(TZ=America/New_York date '+%F %T %Z')
{ echo "# label: $LABEL"; echo "# cmd: $*"; echo "# cwd: $PWD"; echo "# HEAD: $(git rev-parse --short HEAD 2>/dev/null) board $(git rev-parse HEAD:prioritization-board-grid.html 2>/dev/null) worktree-board $(git hash-object prioritization-board-grid.html 2>/dev/null)"; echo "# BOARD=${BOARD-<unset>}"; echo "# start: $ST"; echo "# cap: ${CAP}s"; } > "$LOG"
S=$(date +%s.%N)
setsid -w timeout -k 10 "$CAP" "$@" >> "$LOG" 2>&1 &
P=$!
sleep 0.3
KIDS=$(cat /proc/$P/task/*/children 2>/dev/null)
GK=""; for k in $KIDS; do GK="$GK $(cat /proc/$k/task/*/children 2>/dev/null)"; done
{ echo "$P [$(tr '\0' ' ' < /proc/$P/cmdline 2>/dev/null)] label=$LABEL start=$ST"
  for k in $KIDS $GK; do echo "  child $k [$(tr '\0' ' ' < /proc/$k/cmdline 2>/dev/null)]"; done; } >> "$C/pids.txt"
wait $P; X=$?
D=$(python3 -I -c "import time;print(round(time.time()-$S,1))")
ET=$(TZ=America/New_York date '+%F %T %Z')
{ echo; echo "# end: $ET"; echo "# exit: $X  wall_s: $D"; { [ $X -eq 124 ] || [ $X -eq 137 ]; } && echo "# TIMED OUT (incomplete)"; } >> "$LOG"
echo "$LABEL | start $ST | exit $X | wall ${D}s | $LOG" | tee -a "$C/runs.txt"
exit $X
