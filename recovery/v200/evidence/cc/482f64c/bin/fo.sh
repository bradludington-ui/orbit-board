#!/bin/bash
# fo.sh <label> <harness .mjs path> <copy root> [variantBoard] : one focused harness (any suite's, built verbatim) through run.sh
# (lock check, setsid -w timeout -k 10 600, PIDs recorded), via bin/runner.mjs, every check recorded to out/<label>.checks.jsonl.
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/482f64c
L=$1; H=$2; C=$3; V=$4
rm -f $F/out/$L.checks.jsonl
$F/bin/run.sh $L $F -- env SUITE_CHECKS=$F/out/$L.checks.jsonl node $F/bin/runner.mjs $F/$C $H $V > /dev/null
RC=$?
echo "$L exit=$RC | $(grep -m1 -o -E '[0-9]+ FAILING CHECK\(S\)|ALL CHECKS PASSED' $F/logs/$L.log) | $(grep -o 'wall_s: [0-9.]*' $F/logs/$L.log | tail -1)" | tee -a $F/out/focused-summary.txt
exit $RC
