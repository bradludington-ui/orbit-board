#!/bin/bash
# step.sh <name> : one step of this check, up to two bounded runs at once (each through run.sh or fr.sh or mutrun.sh: lock check,
# setsid -w timeout -k 10 600, PIDs recorded). Launched itself through bx.sh (setsid -w timeout -k 10 600, PIDs recorded).
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/827953a
case "$1" in
 s1) rm -f $F/out/S-audit-recon-commit.checks.jsonl
     $F/bin/run.sh S-audit-recon-commit $F/after -- env SUITE_CHECKS=$F/out/S-audit-recon-commit.checks.jsonl node tools/export-audit/audit-recon.mjs > /dev/null &
     $F/bin/fr.sh F-commit after after & wait ;;
 s2) $F/bin/fr.sh F-parent before before & $F/bin/fr.sh F-pre-u10-16ceb83 after after $F/variants/board-16ceb83.html & wait ;;
 s3) $F/bin/fr.sh F-base-7ee498a after after $F/variants/board-7ee498a.html & $F/bin/fr.sh F-parentown-parent parentown before & wait ;;
 m1) $F/bin/mutrun.sh v200-u10-journal-gate-after-question & $F/bin/mutrun.sh v200-u10-journal-putback-sync-only & wait ;;
 m2) $F/bin/mutrun.sh v200-u10-reapply-keeps-upl-place & $F/bin/fr.sh M9-v200-u10-reapply-keeps-upl-place parentown before $F/mut/v200-u10-reapply-keeps-upl-place.html.wait & wait ;;
 *) echo "unknown step $1"; exit 2 ;;
esac
echo "STEP-$1-DONE $(TZ=America/New_York date '+%F %H:%M:%S %Z')" | tee -a $F/logs/runs.txt
