#!/bin/bash
# step2.sh <name> : the later steps of this check (step.sh's s1 ran first; F-pre-u10-16ceb83 and S-audit-recon-commit-r2 were launched on their
# own through bx.sh). Up to two bounded runs at once (each through fr.sh or mutrun.sh: lock check, setsid -w timeout -k 10 600, PIDs recorded).
# Launched itself through bx.sh (setsid -w timeout -k 10 600, PIDs recorded). Rewritten 06:51 ET before any of its steps ran.
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/827953a
case "$1" in
 p1) $F/bin/fr.sh F-parent before before ;;
 s3) $F/bin/fr.sh F-base-7ee498a after after $F/variants/board-7ee498a.html & $F/bin/fr.sh F-parentown-parent parentown before & wait ;;
 m1) $F/bin/mutrun.sh v200-u10-journal-gate-after-question & $F/bin/mutrun.sh v200-u10-journal-putback-sync-only & wait ;;
 m2) $F/bin/mutrun.sh v200-u10-reapply-keeps-upl-place & $F/bin/fr.sh M9-v200-u10-journal-gate-after-question parentown before $F/mut/v200-u10-journal-gate-after-question.html & wait ;;
 m3) $F/bin/fr.sh M9-v200-u10-journal-putback-sync-only parentown before $F/mut/v200-u10-journal-putback-sync-only.html & $F/bin/fr.sh M9-v200-u10-reapply-keeps-upl-place parentown before $F/mut/v200-u10-reapply-keeps-upl-place.html & wait ;;
 *) echo "unknown step $1"; exit 2 ;;
esac
echo "STEP-$1-DONE $(TZ=America/New_York date '+%F %H:%M:%S %Z')" | tee -a $F/logs/runs.txt
