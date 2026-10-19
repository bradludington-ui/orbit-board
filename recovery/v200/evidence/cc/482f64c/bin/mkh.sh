#!/bin/bash
# mkh.sh : builds the focused harnesses with the track's own builder (bin/mkfocused-u10.py, copied unchanged from rec/L6/u10/bin), text only.
#  harness/after      : from the COMMITTED audit-recon, the ten blocks (item 83, item 88, U10 1-4's five blocks, U49, Load theirs, the change journal) + guard
#  harness/before     : the same text (built from the committed audit-recon), beside the parent's boot.mjs, for runs on the parent board
#  harness/parentown  : from the PARENT's audit-recon, its nine blocks (no change journal), for the parent's own earlier U10 blocks
#  harness/parentown-c: the same text as parentown, beside the commit's boot.mjs (the parent's blocks on the committed board)
#  harness/builder-c7 : from the BUILDER's c7 audit-recon (rec/L6/u10/c7), the same ten blocks, for comparison only (never run)
set -e
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/482f64c
T=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L6/u10
M=$F/bin/mkfocused-u10.py
B9=("v1.98 item 83" "v1.99 item 88" "v2.00 (U10): a refused edit" "v2.00 (U10, beside the codes)" "v2.00 (U10, the shared lists)" "v2.00 (U10, the spend plan's choices)" "v2.00 (U10, the files, packages, ladder and shared copies)" "v2.00 (U10, the funds flow's money)" "v2.00 (U10, Load theirs)")
mkdir -p $F/harness/builder-c7
python3 -I $M $F/after/tools/export-audit/audit-recon.mjs $F/harness/after/focused-u10.mjs "${B9[@]}" "v2.00 (U10, the change journal)"
cp $F/harness/after/focused-u10.mjs $F/harness/before/focused-u10.mjs
python3 -I $M $F/before/tools/export-audit/audit-recon.mjs $F/harness/parentown/focused-u10.mjs "${B9[@]}"
cp $F/harness/parentown/focused-u10.mjs $F/harness/parentown-c/focused-u10.mjs
python3 -I $M $T/c7/tools/export-audit/audit-recon.mjs $F/harness/builder-c7/focused-u10.mjs "${B9[@]}" "v2.00 (U10, the change journal)"
ln -sfn $F/after/tools/export-audit/boot.mjs $F/harness/after/boot.mjs
ln -sfn $F/before/tools/export-audit/boot.mjs $F/harness/before/boot.mjs
ln -sfn $F/before/tools/export-audit/boot.mjs $F/harness/parentown/boot.mjs
ln -sfn $F/after/tools/export-audit/boot.mjs $F/harness/parentown-c/boot.mjs
