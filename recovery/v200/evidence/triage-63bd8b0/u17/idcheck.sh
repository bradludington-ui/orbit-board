#!/bin/bash
# idcheck.sh : read-only identity checks (text only).
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17
R=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec
echo "== board diff c137 -> b63 (expected: the U13 commit's two guards in driveStorePull only)"
diff -u "$U/c137/prioritization-board-grid.html" "$U/b63/prioritization-board-grid.html" > "$U/board-1375-to-98eed.diff"
echo "diff blob $(git hash-object "$U/board-1375-to-98eed.diff") lines $(wc -l < "$U/board-1375-to-98eed.diff")"
grep -n '^@@' "$U/board-1375-to-98eed.diff"
echo "== compare with rec/L3/u13/diffs/board.diff (blob $(git hash-object $R/L3/u13/diffs/board.diff))"
diff <(grep '^[-+][^-+]' "$U/board-1375-to-98eed.diff") <(grep '^[-+][^-+]' $R/L3/u13/diffs/board.diff) && echo "changed lines identical"
echo "== W1H block: the copy used by u13codex (w1h-block.txt) vs b63 and c137 audit-import"
W=$R/L2/u13codex/w1h-block.txt; echo "w1h-block.txt blob $(git hash-object $W) lines $(wc -l < $W)"
first=$(head -1 $W)
for d in b63 c137; do
  A="$U/$d/tools/export-audit/audit-import.mjs"
  n=$(grep -nF -- "$first" "$A" | head -1 | cut -d: -f1)
  echo "$d: first W1H line at $n"
  if [ -n "$n" ]; then sed -n "${n},$((n+$(wc -l < $W)-1))p" "$A" | diff -q - $W >/dev/null && echo "$d: W1H block identical" || echo "$d: W1H block DIFFERS"; fi
done
echo "== refute probe composition (u13codex/verify)"
git hash-object $R/L2/u13codex/verify/u13codex-refute.mjs $R/L2/u13codex/u13codex-probe.mjs $R/L2/u13probe/u13-probe.mjs
