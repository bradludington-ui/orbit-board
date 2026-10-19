#!/bin/bash
# mx.sh <pass> <probe.mjs> <scenario...> : runs the probe once per scenario, in order, EACH through q.sh (setsid -w timeout
# -k 10 600, own session, PIDs to pids.txt, the AUDIT_IMPORT_RUNNING lock waited for before each node run).
# Output JSON: probe-copy/out/<pass>-<scenario>.json (check.mjs reads probe-copy/out/).
C=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u24-check
P=$1; PR=$2; shift 2
mkdir -p $C/probe-copy/out
for s in "$@"; do bash $C/q.sh $P-$s node $PR $C/b63 $s $C/probe-copy/out/$P-$s.json > /dev/null; tail -1 $C/logs/runs.txt; done
