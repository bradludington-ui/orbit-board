#!/bin/bash
# cc.sh <commit> <parent> <tag> <harness-name> <markers...> : focused before/after on the COMMITTED content (lead's commit check).
# before/after = git archive of <parent>/<commit> (board, tools, package.json) + the builder's shim + node_modules link; the
# focused harness is built by the builder's mkfocused.py from the COMMITTED audit-recon.mjs; runs use the builder's runner.mjs
# (BOARD unset = the copy's own board; or a variant board). Each run bounded (setsid -w timeout -k 10 600), lock checked, PID
# recorded. mutate.mjs is read as TEXT only (mkmut.py), never imported or run.
K=$(cd "$(dirname "$0")" && pwd -P); U=$K/../u14; RB=$K/../../bin; REPO=/home/user/orbit-board
LOCK=$K/../../../AUDIT_IMPORT_RUNNING
C=$1; P=$2; T=$3; HN=$4; shift 4
mkd(){ mkdir -p $K/$T/$1 && git -C $REPO archive $2 prioritization-board-grid.html tools package.json | tar -x -C $K/$T/$1 && cp $U/h/runtime-encoding-shim.mjs $K/$T/$1/ && ln -sfn $REPO/node_modules $K/$T/$1/node_modules; }
mkd before $P; mkd after $C; mkdir -p $K/$T/h $K/$T/mut $K/$T/out $K/$T/logs
ln -sfn $K/$T/after/tools/export-audit/boot.mjs $K/$T/h/boot.mjs
python3 -I $U/mkfocused.py $K/$T/after/tools/export-audit/audit-recon.mjs $K/$T/h/$HN "$@"
{ echo "commit $C parent $P"; for d in before after; do echo "$d board $(git hash-object $K/$T/$d/prioritization-board-grid.html) recon $(git hash-object $K/$T/$d/tools/export-audit/audit-recon.mjs) mutate $(git hash-object $K/$T/$d/tools/export-audit/mutate.mjs)"; done
  echo "harness $(git hash-object $K/$T/h/$HN) runner $(git hash-object $U/runner.mjs) mkfocused $(git hash-object $U/mkfocused.py) shim $(git hash-object $U/h/runtime-encoding-shim.mjs)"; } > $K/$T/ids.txt
r(){ local n=$1; shift; [ -e "$LOCK" ] && { echo "$n SKIPPED: lock set" >> $K/$T/summary.txt; return; }
  (cd $K/$T/after && SUITE_CHECKS=$K/$T/out/$n.checks.jsonl setsid -w timeout -k 10 600 node $U/runner.mjs $K/$T/after $K/$T/h/$HN "$@" > $K/$T/logs/$n.log 2>&1 & echo "$! $n" >> $K/pids.txt; wait $!; echo "exit $?" >> $K/$T/logs/$n.log)
  echo "$n | $(tail -1 $K/$T/logs/$n.log) | $(grep -m1 -o -E '[0-9]+ FAILING CHECK\(S\)|ALL CHECKS PASSED' $K/$T/logs/$n.log) | $(python3 -I $U/tally.py $K/$T/out/$n.checks.jsonl > $K/$T/out/$n.tally.txt; awk '{p+=$1; f+=$3} END{print p" pass, "f" fail"}' $K/$T/out/$n.tally.txt)" >> $K/$T/summary.txt; }
echo "start $(TZ=America/New_York date '+%-I:%M:%S %p ET')" >> $K/$T/summary.txt
r after-own
r before-board $K/$T/before/prioritization-board-grid.html
[ -n "${GRAND:-}" ] && { mkdir -p $K/$T/grand && git -C $REPO show $GRAND:prioritization-board-grid.html > $K/$T/grand/board.html; echo "grandparent $GRAND board $(git hash-object $K/$T/grand/board.html)" >> $K/$T/ids.txt; r grandparent-board $K/$T/grand/board.html; }
for id in $MUTS; do if python3 -I $RB/mkmut.py $K/$T/after/tools/export-audit/mutate.mjs $K/$T/after/prioritization-board-grid.html $id $K/$T/mut/$id.html > $K/$T/mut/$id.json; then r mut-$id $K/$T/mut/$id.html; else echo "mut-$id NOT APPLICABLE" >> $K/$T/summary.txt; fi; done
echo "done $(TZ=America/New_York date '+%-I:%M:%S %p ET')" >> $K/$T/summary.txt
