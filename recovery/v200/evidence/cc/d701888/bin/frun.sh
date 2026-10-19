#!/bin/bash
# frun.sh <label> <copy: before|after> <harness basename> [variantBoard] : one focused harness run via run.sh (bounded, lock-checked, PIDs recorded),
# from h/<copy>/tools/export-audit (harness beside a link to the copy's own boot.mjs), SUITE_CHECKS=out/<label>.checks.jsonl.
D=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/d701888
N=$1; C=$2; H=$3; V=$4
rm -f $D/out/$N.checks.jsonl
$D/bin/run.sh $N $D/h/$C/tools/export-audit -- env SUITE_CHECKS=$D/out/$N.checks.jsonl node $D/bin/runner.mjs $D/$C $D/h/$C/tools/export-audit/$H $V
