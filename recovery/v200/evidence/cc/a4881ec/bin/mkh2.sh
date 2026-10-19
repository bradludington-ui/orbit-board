#!/bin/bash
# mkh2.sh : the U20/U30 focused harness (the two other v2.00 blocks of audit-import that mkh.sh's three harnesses do not hold),
# cut VERBATIM by bin/mkfocused-multi.py (the U18 builder's, byte for byte) with the builder's spec, from the COMMITTED suite.
set -e
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/a4881ec
python3 -I $F/bin/mkfocused-multi.py $F/after/tools/export-audit/audit-import.mjs $F/harness/after/h-u20u30.mjs \
  "marker:// ==== v2.00 (U20): a save waiting for another tab's save is under way ====|// ==== end v2.00 (U20) ====" \
  "marker:// ==== v2.00 (U30): a refresh takes the folder's copy as the one the work came from only when it is what is on screen ====|// ==== end v2.00 (U30) ===="
cp $F/harness/after/h-u20u30.mjs $F/h/after/tools/export-audit/
git hash-object $F/harness/after/h-u20u30.mjs
