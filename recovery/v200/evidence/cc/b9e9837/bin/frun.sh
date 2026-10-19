#!/bin/bash
# frun.sh <label> <copy: before|after> [variantBoard] : one focused harness run via run.sh (bounded, lock-checked, PIDs recorded),
# from h/<copy>/tools/export-audit (the harness beside a link to the copy's own boot.mjs), SUITE_CHECKS=out/<label>.checks.jsonl.
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/b9e9837
N=$1; C=$2; V=$3
rm -f $F/out/$N.checks.jsonl
$F/bin/run.sh $N $F/h/$C/tools/export-audit -- env SUITE_CHECKS=$F/out/$N.checks.jsonl node $F/bin/runner.mjs $F/$C $F/h/$C/tools/export-audit/focused-u34.mjs $V
