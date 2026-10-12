#!/bin/bash
# mxx.sh <pass> <scenario...> : runs the CHECKER's variant x/u24probe-x.mjs once per scenario, EACH through q.sh (bounded,
# own session, PIDs to pids.txt, the lock waited for). Output: x/out/<pass>-<scenario>.json (xcheck.mjs reads x/out/).
C=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u24-check
P=$1; shift
mkdir -p $C/x/out
for s in "$@"; do bash $C/q.sh $P-$s node $C/x/u24probe-x.mjs $C/b63 $s $C/x/out/$P-$s.json > /dev/null; tail -1 $C/logs/runs.txt; done
