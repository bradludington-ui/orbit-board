#!/bin/bash
# batchS.sh : check 6. The one other suite file this commit changes, audit-recon.mjs, run in full on the commit (after/) and, for the count
# of checks before it, on the parent (before/); each through run.sh (lock check, setsid -w timeout -k 10 600, PIDs recorded), every check
# recorded to out/<label>.checks.jsonl.
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/d01b3ba
rm -f $F/out/S-audit-recon-commit.checks.jsonl $F/out/S-audit-recon-parent.checks.jsonl
$F/bin/run.sh S-audit-recon-commit $F/after -- env SUITE_CHECKS=$F/out/S-audit-recon-commit.checks.jsonl node tools/export-audit/audit-recon.mjs > /dev/null &
$F/bin/run.sh S-audit-recon-parent $F/before -- env SUITE_CHECKS=$F/out/S-audit-recon-parent.checks.jsonl node tools/export-audit/audit-recon.mjs > /dev/null &
wait
echo BATCH-S-DONE $(TZ=America/New_York date '+%F %H:%M:%S %Z')
