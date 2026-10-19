#!/bin/bash
# frun.sh <label> <copy: before|after> <harness basename> [variantBoard] : one focused run through run.sh, from h/<copy>/tools/export-audit,
# runner = the builder's rec/L6/u20u30/bin/runner.mjs (copied to bin/), SUITE_CHECKS=out/<label>.checks.jsonl.
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/ef1548c
N=$1; C=$2; H=$3; V=$4
rm -f $F/out/$N.checks.jsonl
$F/bin/run.sh $N $F/h/$C/tools/export-audit -- env SUITE_CHECKS=$F/out/$N.checks.jsonl node $F/bin/runner.mjs $F/$C $F/h/$C/tools/export-audit/$H $V
