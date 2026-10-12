#!/bin/bash
# mk.sh : the two board copies for U17 (read-only sources; nothing written in /home/user/orbit-board).
#  b63  = cp -a of rec/L4/base (git archive of orbit-board 63bd8b0, U13 committed; board 98eed7e8) incl. its shim and node_modules link
#  c137 = git archive of orbit-board a8891e1 (board 1375b72b, before U13) + the same shim + node_modules link
set -e
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17
BASE=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/base
REPO=/home/user/orbit-board
[ -e "$U/b63" ] || cp -a "$BASE" "$U/b63"
if [ ! -e "$U/c137" ]; then
  mkdir -p "$U/c137"
  git -C $REPO archive a8891e1 prioritization-board-grid.html tools package.json | tar -x -C "$U/c137"
  ln -sfn $REPO/node_modules "$U/c137/node_modules"
  cp "$BASE/runtime-encoding-shim.mjs" "$U/c137/"
fi
for d in b63 c137; do
  echo "== $d"
  for f in prioritization-board-grid.html tools/export-audit/boot.mjs tools/export-audit/audit-import.mjs runtime-encoding-shim.mjs package.json; do
    echo "$f $(git hash-object "$U/$d/$f")"; done
  echo "node_modules -> $(readlink "$U/$d/node_modules")"
done
echo "== expected from the repo (read-only rev-parse)"
for c in 63bd8b0 a8891e1; do for f in prioritization-board-grid.html tools/export-audit/boot.mjs tools/export-audit/audit-import.mjs package.json; do
  echo "$c:$f $(git -C $REPO rev-parse $c:$f)"; done; done
echo "tools tree b63 vs base: $(diff -r "$BASE/tools" "$U/b63/tools" >/dev/null && echo identical || echo DIFFERS)"
echo "orbit-board status (read-only): $(git -C $REPO status --short | wc -l) changed paths; HEAD $(git -C $REPO rev-parse --short HEAD)"
