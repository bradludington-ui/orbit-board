#!/bin/bash
# fr.sh <label> <before|after> [variantBoard] : the focused U10 harness (harness/<copy>/focused-u10.mjs, built verbatim from the COMMITTED
# audit-recon by the track's bin/mkfocused-u10.py; beside a link to that copy's own boot.mjs) through run.sh (lock check,
# setsid -w timeout -k 10 600, PIDs recorded), root <copy>/, every check recorded to out/<label>.checks.jsonl.
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/224f878
L=$1; C=$2; V=$3
rm -f $F/out/$L.checks.jsonl
$F/bin/run.sh $L $F -- env SUITE_CHECKS=$F/out/$L.checks.jsonl node $F/bin/runner.mjs $F/$C $F/harness/$C/focused-u10.mjs $V > /dev/null
RC=$?
echo "$L exit=$RC | $(grep -m1 -o -E '[0-9]+ FAILING CHECK\(S\)|ALL CHECKS PASSED' $F/logs/$L.log) | $(grep -o 'wall_s: [0-9.]*' $F/logs/$L.log | tail -1)" | tee -a $F/out/focused-summary.txt
exit $RC
