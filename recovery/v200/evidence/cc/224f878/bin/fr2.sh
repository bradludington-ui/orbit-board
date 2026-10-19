#!/bin/bash
# fr2.sh <label> <root copy> <harness dir> [variantBoard] : fr.sh with the harness folder named apart from the root copy (harness/<dir>/focused-u10.mjs),
# through run.sh (lock check, setsid -w timeout -k 10 600, PIDs recorded), every check recorded to out/<label>.checks.jsonl.
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/224f878
L=$1; C=$2; H=$3; V=$4
rm -f $F/out/$L.checks.jsonl
$F/bin/run.sh $L $F -- env SUITE_CHECKS=$F/out/$L.checks.jsonl node $F/bin/runner.mjs $F/$C $F/harness/$H/focused-u10.mjs $V > /dev/null
RC=$?
echo "$L exit=$RC | $(grep -m1 -o -E '[0-9]+ FAILING CHECK\(S\)|ALL CHECKS PASSED' $F/logs/$L.log) | $(grep -o 'wall_s: [0-9.]*' $F/logs/$L.log | tail -1)" | tee -a $F/out/focused-summary.txt
exit $RC
