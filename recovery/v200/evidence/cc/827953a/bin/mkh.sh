#!/bin/bash
# mkh.sh : builds the focused harnesses with the track's own builder (bin/mkfocused-u10.py, copied unchanged from rec/L6/u10/bin, blob 76abf73c), text only.
#  harness/after       : from the COMMITTED audit-recon, the twelve blocks (item 83, item 88, U10 1-4's five blocks, U49 (the funds flow's money),
#                        Load theirs, the change journal, the funds flow's settings, the unfunded list's place) + guard
#  harness/before      : the same text (built from the committed audit-recon), beside the parent's boot.mjs, for runs on the parent board
#  harness/builder-c10 : from the BUILDER's c10 audit-recon (rec/L6/u10/c10), the same twelve blocks, for comparison only (never run)
#  harness/parentown   : from the PARENT's audit-recon, the eleven blocks it holds (U10 1-9's), for the parent's own before-side run and for the
#                        mutants through the blocks before this commit
set -e
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/827953a
T=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L6/u10
M=$F/bin/mkfocused-u10.py
B11=("v1.98 item 83" "v1.99 item 88" "v2.00 (U10): a refused edit" "v2.00 (U10, beside the codes)" "v2.00 (U10, the shared lists)" "v2.00 (U10, the spend plan's choices)" "v2.00 (U10, the files, packages, ladder and shared copies)" "v2.00 (U10, the funds flow's money)" "v2.00 (U10, Load theirs)" "v2.00 (U10, the change journal)" "v2.00 (U10, the funds flow's settings)")
B12=("${B11[@]}" "v2.00 (U10, the unfunded list's place)")
mkdir -p $F/harness/after $F/harness/before $F/harness/builder-c10 $F/harness/parentown
python3 -I $M $F/after/tools/export-audit/audit-recon.mjs $F/harness/after/focused-u10.mjs "${B12[@]}"
cp $F/harness/after/focused-u10.mjs $F/harness/before/focused-u10.mjs
python3 -I $M $T/c10/tools/export-audit/audit-recon.mjs $F/harness/builder-c10/focused-u10.mjs "${B12[@]}"
python3 -I $M $F/before/tools/export-audit/audit-recon.mjs $F/harness/parentown/focused-u10.mjs "${B11[@]}"
ln -sfn $F/after/tools/export-audit/boot.mjs $F/harness/after/boot.mjs
ln -sfn $F/before/tools/export-audit/boot.mjs $F/harness/before/boot.mjs
ln -sfn $F/before/tools/export-audit/boot.mjs $F/harness/parentown/boot.mjs
ln -sfn /home/user/orbit-board/node_modules $F/harness/node_modules
