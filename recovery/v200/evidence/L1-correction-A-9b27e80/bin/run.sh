#!/bin/bash
# run.sh <logfile> <cap-seconds> <env-assignments...> -- <command...>
# Runs in its own process group (setsid), records the PGID, caps with timeout, and records start/end/exit/duration.
LOG=$1; CAP=$2; shift 2; ENVS=(); while [ "$1" != "--" ]; do ENVS+=("$1"); shift; done; shift
{ echo "# cmd: ${ENVS[*]} $*"; echo "# cwd: $PWD"; echo "# node: $(node --version)  jsdom: $(node -e "console.log(require('jsdom/package.json').version)")"; echo "# start: $(date -u +%FT%TZ) / $(TZ=America/New_York date '+%H:%M:%S %Z')"; echo "# cap: ${CAP}s"; } > "$LOG"
S=$(date +%s.%N)
setsid env "${ENVS[@]}" timeout --kill-after=10 "$CAP" "$@" >> "$LOG" 2>&1 &
P=$!; echo "$P $(date -u +%FT%TZ) $LOG" >> "$(dirname "$0")/pids.txt"
wait $P; X=$?
D=$(python3 -c "import time;print(round(time.time()-$S,1))")
{ echo; echo "# end: $(date -u +%FT%TZ) / $(TZ=America/New_York date '+%H:%M:%S %Z')"; echo "# exit: $X  duration_s: $D"; [ $X -eq 124 ] && echo "# TIMED OUT (incomplete)"; } >> "$LOG"
echo "$LOG exit=$X dur=${D}s"
