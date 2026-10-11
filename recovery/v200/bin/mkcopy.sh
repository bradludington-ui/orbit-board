#!/bin/bash
# mkcopy.sh <sha> <rundir> : isolated candidate copy of <sha> at <rundir>/copy (git archive, not a worktree), the
# money/code/shim probes in its root, the races probe in the sibling <rundir>/races, node_modules linked to the one
# installation boot.mjs and the shim must share. Probe files are copied unchanged from the received set.
set -e; SHA=$1; RD=$2; REPO=/home/user/orbit-board; P=/home/user/orbit-board/recovery/v200/probes/received-2026-10-11
mkdir -p "$RD/copy" "$RD/races"
git -C $REPO archive "$SHA" prioritization-board-grid.html tools package.json | tar -x -C "$RD/copy"
ln -sfn $REPO/node_modules "$RD/copy/node_modules"
cp $P/money-runtime-probe.mjs $P/code-runtime-probe.mjs $P/runtime-encoding-shim.mjs "$RD/copy/"
cp $P/races-probe.mjs "$RD/races/"
{ echo "pinned commit: $(git -C $REPO rev-parse "$SHA")"
  for f in prioritization-board-grid.html tools/export-audit/boot.mjs; do
    echo "$f  pinned-blob $(git -C $REPO rev-parse "$SHA:$f")  copy-blob $(git hash-object "$RD/copy/$f")"; done
  (cd "$RD" && sha256sum copy/money-runtime-probe.mjs copy/code-runtime-probe.mjs copy/runtime-encoding-shim.mjs races/races-probe.mjs)
  echo "jsdom (boot.mjs):  $(cd "$RD/copy/tools/export-audit" && node -e "console.log(require('fs').realpathSync(require.resolve('jsdom')))")"
  echo "jsdom (shim):      $(cd "$RD/copy" && node -e "console.log(require('fs').realpathSync(require.resolve('jsdom')))")"
  echo "BOARD env: ${BOARD:-unset} (boot() reads copy/prioritization-board-grid.html, the file R1 reads)"
} > "$RD/provenance.txt"
cat "$RD/provenance.txt"
