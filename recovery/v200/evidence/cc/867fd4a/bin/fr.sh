#!/bin/bash
# fr.sh <label> [variantBoard] : the focused U41 harness (harness/h-u41.mjs, built verbatim from the COMMITTED audit-recon by
# rec/L3/u14/mkfocused.py) through run.sh (lock check, setsid -w timeout -k 10 600, PIDs recorded), root after/ (the commit),
# every check recorded to out/<label>.checks.jsonl (SUITE_CHECKS).
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/867fd4a
L=$1; V=$2
$F/bin/run.sh $L $F -- env SUITE_CHECKS=$F/out/$L.checks.jsonl node $F/bin/runner.mjs $F/after $F/harness/h-u41.mjs $V > /dev/null
RC=$?
echo "$L exit=$RC | $(grep -m1 -o -E '[0-9]+ FAILING CHECK\(S\)|ALL CHECKS PASSED' $F/logs/$L.log) | $(grep -o 'wall_s: [0-9.]*' $F/logs/$L.log | tail -1)" | tee -a $F/out/focused-summary.txt
exit $RC
