#!/bin/bash
# backup-sens.sh : copies every COMPLETED run of the af892cb sensitivity sequence (a log with an "# exit:" line) into the
# backup folder's completed/, its mutant diff/json into mutants/, and summary.txt; commits and pushes to claude/v200-fixes-wip
# only when something new was copied. Interrupted logs are never copied into completed/.
E=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec; S=$E/L2/sens-import-af892cb
R=/home/user/orbit-board; D=$R/recovery/v200/evidence/L2-r1-r5/sensitivity-af892cb; new=()
for f in $S/BASELINE.log $S/v200-*.log $S/unsaved-flag-never-set.log $S/impmixed-file-unguarded.log; do
  [ -f "$f" ] || continue; b=$(basename $f); grep -q '^# exit:' "$f" || continue
  if ! cmp -s "$f" "$D/completed/$b"; then cp "$f" "$D/completed/$b"; id=${b%.log}; cp $S/mut-$id.diff $S/mut-$id.json $D/mutants/ 2>/dev/null || true; new+=("$id"); fi
done
cp $S/summary.txt $D/summary.txt
cd $R; git add $D; if [ ${#new[@]} -gt 0 ] && ! git diff --cached --quiet; then
  [ -z "$(git diff --cached --name-only -- prioritization-board-grid.html tools package.json)" ] || { echo "REFUSED: product files staged"; exit 2; }
  git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q -m "recovery/v200: af892cb sensitivity, completed run(s) backed up: ${new[*]} (no product change)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01MqCBDiYHPZfnyapxhXKxBm"
  for i in 1 2 3 4; do timeout 120 git push -q origin claude/v200-fixes-wip 2>&1 | tail -1 && break; sleep $((2**i)); done
  echo "backed up: ${new[*]} at $(git rev-parse --short HEAD)"; else echo "nothing new"; fi
