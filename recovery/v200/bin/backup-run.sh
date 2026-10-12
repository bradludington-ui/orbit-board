#!/bin/bash
# backup-run.sh <srcdir> <dest-under-recovery/v200/evidence> <label> : copies every COMPLETED run log in <srcdir> (one with an
# "# exit:" line) into <dest>/completed/, its mutant diff/json into <dest>/mutants/, and summary.txt and OVERLAP.txt; commits
# and pushes to claude/v200-fixes-wip only when something changed. A log without an exit line is never put in completed/.
# Refuses if any product file is staged.
S=$1; R=/home/user/orbit-board; D=$R/recovery/v200/evidence/$2; L=$3; new=()
mkdir -p $D/completed $D/mutants
for f in $S/*.log; do
  [ -f "$f" ] || continue; b=$(basename $f); grep -q '^# exit:' "$f" || continue
  if ! cmp -s "$f" "$D/completed/$b"; then cp "$f" "$D/completed/$b"; id=${b%.log}; cp $S/mut-$id.diff $S/mut-$id.json $D/mutants/ 2>/dev/null || true; new+=("$id"); fi
done
for f in summary.txt OVERLAP.txt; do [ -f $S/$f ] && cp $S/$f $D/$f; done
cd $R; git add $D
if ! git diff --cached --quiet; then
  [ -z "$(git diff --cached --name-only -- prioritization-board-grid.html tools package.json NEXT-VERSION.md)" ] || { echo "REFUSED: product files staged"; exit 2; }
  git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q -m "recovery/v200: $L, run(s) backed up: ${new[*]:-records} (no product change)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01MqCBDiYHPZfnyapxhXKxBm"
  for i in 1 2 3 4; do timeout 120 git push -q origin claude/v200-fixes-wip 2>&1 | tail -1 && break; sleep $((2**i)); done
  echo "backed up: ${new[*]:-records} at $(git rev-parse --short HEAD)"; else echo "nothing new"; fi
