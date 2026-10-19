#!/bin/bash
# fr.sh <label> <before|after> <harness basename> [variantBoard] : one FOCUSED harness run (cut VERBATIM from a suite by rec/L3/u14/mkfocused.py,
# bin/mkfocused.py here) through run.sh (lock check, setsid -w timeout -k 10 600, PIDs recorded, start/exit/wall to logs/runs.txt), from
# h/<copy>/tools/export-audit (beside a link to that copy's own boot.mjs), root <copy>/, every check, verdict and value recorded to
# out/<label>.checks.jsonl. One summary line to out/focused-summary.txt. (After rec/L8/cc/a4881ec/bin/fr.sh; folder differs.)
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/d6fea76
L=$1; C=$2; H=$3; V=$4
rm -f $F/out/$L.checks.jsonl
$F/bin/run.sh $L $F/h/$C/tools/export-audit -- env SUITE_CHECKS=$F/out/$L.checks.jsonl node $F/bin/${RUNNER:-runner.mjs} $F/$C $F/h/$C/tools/export-audit/$H $V > /dev/null
RC=$?
echo "$L exit=$RC | $(grep -m1 -o -E '[0-9]+ FAILING CHECK\(S\)|ALL CHECKS PASSED' $F/logs/$L.log) | $(grep -o 'wall_s: [0-9.]*' $F/logs/$L.log | tail -1)" | tee -a $F/out/focused-summary.txt
exit $RC
