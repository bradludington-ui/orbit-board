#!/bin/bash
# mkh.sh : builds the focused harnesses with the track's own builder (bin/mkfocused-u10.py, copied unchanged from rec/L6/u10/bin), text only.
#  harness/after      : from the COMMITTED audit-recon, the nine blocks (item 83, item 88, U10 1-4's five blocks, U49, Load theirs) + guard
#  harness/before     : the same text (built from the committed audit-recon), beside the parent's boot.mjs, for runs on the parent board
#  harness/parentown  : from the PARENT's audit-recon, its eight blocks (no Load theirs), for the parent's own earlier U10 blocks
#  harness/parentown-c: the same text as parentown, beside the commit's boot.mjs (the parent's blocks on the committed board)
set -e
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/c82ea62
M=$F/bin/mkfocused-u10.py
python3 -I $M $F/after/tools/export-audit/audit-recon.mjs $F/harness/after/focused-u10.mjs "v1.98 item 83" "v1.99 item 88" "v2.00 (U10): a refused edit" "v2.00 (U10, beside the codes)" "v2.00 (U10, the shared lists)" "v2.00 (U10, the spend plan's choices)" "v2.00 (U10, the files, packages, ladder and shared copies)" "v2.00 (U10, the funds flow's money)" "v2.00 (U10, Load theirs)"
cp $F/harness/after/focused-u10.mjs $F/harness/before/focused-u10.mjs
python3 -I $M $F/before/tools/export-audit/audit-recon.mjs $F/harness/parentown/focused-u10.mjs "v1.98 item 83" "v1.99 item 88" "v2.00 (U10): a refused edit" "v2.00 (U10, beside the codes)" "v2.00 (U10, the shared lists)" "v2.00 (U10, the spend plan's choices)" "v2.00 (U10, the files, packages, ladder and shared copies)" "v2.00 (U10, the funds flow's money)"
cp $F/harness/parentown/focused-u10.mjs $F/harness/parentown-c/focused-u10.mjs
ln -sfn $F/after/tools/export-audit/boot.mjs $F/harness/after/boot.mjs
ln -sfn $F/before/tools/export-audit/boot.mjs $F/harness/before/boot.mjs
ln -sfn $F/before/tools/export-audit/boot.mjs $F/harness/parentown/boot.mjs
ln -sfn $F/after/tools/export-audit/boot.mjs $F/harness/parentown-c/boot.mjs
