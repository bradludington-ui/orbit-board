#!/bin/bash
# mkdiffs2.sh : (fix round) the three exact diffs against the base (1375b72b / ed9a3437 / 9f9168fa), and the fix-round
# deltas against the superseded first round (a88a1e5b / a4b6970f / 60d70a54), each as git-style unified diffs; then blobs.
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L3/u13
D=$U/diffs; R=$U/superseded-r1
diff -u --label a/prioritization-board-grid.html --label b/prioritization-board-grid.html $U/before/prioritization-board-grid.html $U/after/prioritization-board-grid.html > $D/board.diff
diff -u --label a/tools/export-audit/audit-import.mjs --label b/tools/export-audit/audit-import.mjs $U/before/tools/export-audit/audit-import.mjs $U/after/tools/export-audit/audit-import.mjs > $D/audit-import.diff
diff -u --label a/tools/export-audit/mutate.mjs --label b/tools/export-audit/mutate.mjs $U/mutate.before.mjs.txt $U/mutate.after.mjs.txt > $D/mutate.diff
diff -u --label r1/prioritization-board-grid.html --label fix/prioritization-board-grid.html $R/board.after.html $U/after/prioritization-board-grid.html > $D/fixround-board.diff
diff -u --label r1/tools/export-audit/audit-import.mjs --label fix/tools/export-audit/audit-import.mjs $R/audit-import.after.mjs $U/after/tools/export-audit/audit-import.mjs > $D/fixround-audit-import.diff
diff -u --label r1/tools/export-audit/mutate.mjs --label fix/tools/export-audit/mutate.mjs $R/mutate.after.mjs.txt $U/mutate.after.mjs.txt > $D/fixround-mutate.diff
# the block alone (the added lines of audit-import.diff)
grep '^+' $D/audit-import.diff | grep -v '^+++' | sed 's/^+//' > $U/src/u13-block.mjs.txt
cd $U && for f in diffs/*.diff src/u13-block.mjs.txt after/prioritization-board-grid.html after/tools/export-audit/audit-import.mjs mutate.after.mjs.txt h/focused-u13.mjs; do echo "$(git hash-object $f) $f $(wc -l < $f)"; done
for f in board audit-import mutate; do echo "$f: +$(grep -c '^+[^+]' $D/$f.diff) -$(grep -c '^-[^-]' $D/$f.diff)"; done
