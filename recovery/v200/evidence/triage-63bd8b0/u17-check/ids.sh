#!/bin/bash
# ids.sh : read-only identities. Copies the probe's harness files and builds b63/c137 in the check dir; hashes everything.
set -e
C=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17-check
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17
BASE=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/base
REPO=/home/user/orbit-board
[ -e "$C/b63" ] || cp -a "$BASE" "$C/b63"
if [ ! -e "$C/c137" ]; then
  mkdir -p "$C/c137"
  git -C $REPO archive a8891e1 prioritization-board-grid.html tools package.json | tar -x -C "$C/c137"
  ln -sfn $REPO/node_modules "$C/c137/node_modules"
  cp "$BASE/runtime-encoding-shim.mjs" "$C/c137/"
fi
cp -n $U/u17-probe.mjs $U/src/head.mjs $U/src/w1h.mjs $U/src/body.mjs $U/src/runfile.mjs $C/probe/ 2>/dev/null || true
echo "== copies"
for d in b63 c137; do for f in prioritization-board-grid.html tools/export-audit/boot.mjs tools/export-audit/audit-import.mjs runtime-encoding-shim.mjs package.json; do
  echo "$d/$f $(git hash-object "$C/$d/$f")"; done; echo "$d/node_modules -> $(readlink $C/$d/node_modules)"; done
echo "== repo blobs (rev-parse, read-only)"
for c in 63bd8b0 a8891e1; do for f in prioritization-board-grid.html tools/export-audit/boot.mjs tools/export-audit/audit-import.mjs package.json; do
  echo "$c:$f $(git -C $REPO rev-parse $c:$f)"; done; done
echo "== base board $(git hash-object $BASE/prioritization-board-grid.html); base tools vs b63: $(diff -r $BASE/tools $C/b63/tools >/dev/null && echo identical || echo DIFFERS)"
echo "== probe's copies vs mine: b63 $(cmp -s $U/b63/prioritization-board-grid.html $C/b63/prioritization-board-grid.html && echo same || echo DIFF); c137 $(cmp -s $U/c137/prioritization-board-grid.html $C/c137/prioritization-board-grid.html && echo same || echo DIFF); tools b63 $(diff -r $U/b63/tools $C/b63/tools >/dev/null && echo same || echo DIFF); tools c137 $(diff -r $U/c137/tools $C/c137/tools >/dev/null && echo same || echo DIFF)"
echo "== probe harness"
for f in u17-probe.mjs src/head.mjs src/w1h.mjs src/body.mjs src/runfile.mjs build.sh q.sh r.sh matrix.sh; do echo "$f $(git hash-object $U/$f)"; done
cat $U/src/head.mjs $U/src/w1h.mjs $U/src/body.mjs | cmp - $U/u17-probe.mjs && echo "u17-probe.mjs == head+w1h+body"
cmp $U/src/w1h.mjs <(sed -n '3745,3813p' $C/b63/tools/export-audit/audit-import.mjs) && echo "w1h == b63 audit-import L3745-3813"
cmp $U/src/w1h.mjs <(sed -n '3745,3813p' $C/c137/tools/export-audit/audit-import.mjs) && echo "w1h == c137 audit-import L3745-3813"
cmp $U/src/w1h.mjs /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L2/u13codex/w1h-block.txt && echo "w1h == u13codex w1h-block.txt"
echo "== orbit-board working board vs HEAD blob (no git status; hash-object only)"
echo "HEAD $(git -C $REPO rev-parse --short HEAD); HEAD:board $(git -C $REPO rev-parse HEAD:prioritization-board-grid.html); worktree board $(git hash-object $REPO/prioritization-board-grid.html)"
echo "ui HEAD $(git -C /home/user/orbit-ui rev-parse --short HEAD 2>/dev/null || echo n/a)"
