#!/bin/bash
# fx.sh <label> <before|after> <harness basename> : a focused harness (harness/<copy>/<h>, built verbatim from the COMMITTED audit-import by
# the track's bin/mkfocused-multi.py) through run.sh, root <copy>/ (its own board), checks to out/<label>.checks.jsonl.
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/16ceb83
L=$1; C=$2; X=$3
rm -f $F/out/$L.checks.jsonl
$F/bin/run.sh $L $F -- env SUITE_CHECKS=$F/out/$L.checks.jsonl node $F/bin/runner.mjs $F/$C $F/harness/$C/$X > /dev/null
RC=$?
echo "$L exit=$RC | $(grep -m1 -o -E '[0-9]+ FAILING CHECK\(S\)|ALL CHECKS PASSED' $F/logs/$L.log) | $(grep -o 'wall_s: [0-9.]*' $F/logs/$L.log | tail -1)" | tee -a $F/out/focused-summary.txt
exit $RC
