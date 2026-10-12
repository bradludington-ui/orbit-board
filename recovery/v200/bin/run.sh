#!/bin/bash
# run.sh <logfile> <cap-seconds> [grace=<seconds>] <env-assignments...> -- <command...>
# Runs in its own process group (setsid), records the PID, caps with timeout (TERM at the cap, KILL after the grace),
# and records start/end/exit/duration. Exit 124 (or 137 after KILL) = timed out = incomplete, never a pass.
# Policy (Brad, 11 Oct 2026 ~4:04 PM ET): audit-import alone 900 s with 20 s grace, run alone; everything else 600 s.
LOG=$1; CAP=$2; shift 2; GRACE=10; case "$1" in grace=*) GRACE=${1#grace=}; shift;; esac
ENVS=(); while [ "$1" != "--" ]; do ENVS+=("$1"); shift; done; shift
{ echo "# cmd: ${ENVS[*]} $*"; echo "# cwd: $PWD"; echo "# git: $(git rev-parse HEAD 2>/dev/null)"; echo "# node: $(node --version)  jsdom: $(node -e "console.log(require('jsdom/package.json').version)" 2>/dev/null)"; echo "# start: $(date -u +%FT%TZ) / $(TZ=America/New_York date '+%H:%M:%S %Z')"; echo "# cap: ${CAP}s  grace: ${GRACE}s"; } > "$LOG"
S=$(date +%s.%N)
setsid env "${ENVS[@]}" timeout --kill-after="$GRACE" "$CAP" "$@" >> "$LOG" 2>&1 &
P=$!; echo "$P $(date -u +%FT%TZ) $LOG" >> "${RUNNER_PIDS:-$(dirname "$0")/pids.txt}"   # RUNNER_PIDS: the snapshot is immutable
wait $P; X=$?
D=$(python3 -c "import time;print(round(time.time()-$S,1))")
{ echo; echo "# end: $(date -u +%FT%TZ) / $(TZ=America/New_York date '+%H:%M:%S %Z')"; echo "# exit: $X  duration_s: $D"; { [ $X -eq 124 ] || [ $X -eq 137 ]; } && echo "# TIMED OUT (incomplete)"; } >> "$LOG"
echo "$LOG exit=$X dur=${D}s"
