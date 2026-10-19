#!/bin/bash
# mkh.sh : builds the focused harnesses with the track's own builder (bin/mkfocused-u10.py, copied unchanged from rec/L6/u10/bin, blob 76abf73c), text only.
#  harness/after      : from the COMMITTED audit-recon, the ten blocks (item 83, item 88, U10 1-4's five blocks, U49, Load theirs, the change journal) + guard
#  harness/before     : the same text (built from the committed audit-recon), beside the parent's boot.mjs, for runs on the parent board
#  harness/builder-c8 : from the BUILDER's c8 audit-recon (rec/L6/u10/c8), the same ten blocks, for comparison only (never run)
#  harness/parentown  : from the PARENT's audit-recon, the same ten blocks, for comparison only (text)
set -e
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/ef2792e
T=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L6/u10
M=$F/bin/mkfocused-u10.py
B10=("v1.98 item 83" "v1.99 item 88" "v2.00 (U10): a refused edit" "v2.00 (U10, beside the codes)" "v2.00 (U10, the shared lists)" "v2.00 (U10, the spend plan's choices)" "v2.00 (U10, the files, packages, ladder and shared copies)" "v2.00 (U10, the funds flow's money)" "v2.00 (U10, Load theirs)" "v2.00 (U10, the change journal)")
mkdir -p $F/harness/after $F/harness/before $F/harness/builder-c8 $F/harness/parentown
python3 -I $M $F/after/tools/export-audit/audit-recon.mjs $F/harness/after/focused-u10.mjs "${B10[@]}"
cp $F/harness/after/focused-u10.mjs $F/harness/before/focused-u10.mjs
python3 -I $M $T/c8/tools/export-audit/audit-recon.mjs $F/harness/builder-c8/focused-u10.mjs "${B10[@]}"
python3 -I $M $F/before/tools/export-audit/audit-recon.mjs $F/harness/parentown/focused-u10.mjs "${B10[@]}"
ln -sfn $F/after/tools/export-audit/boot.mjs $F/harness/after/boot.mjs
ln -sfn $F/before/tools/export-audit/boot.mjs $F/harness/before/boot.mjs
ln -sfn /home/user/orbit-board/node_modules $F/harness/node_modules
