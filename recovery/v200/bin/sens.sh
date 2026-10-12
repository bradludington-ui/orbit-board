#!/bin/bash
# sens.sh <copy-root> <outdir> <suite.mjs> <id>... : for each catalog id, build a disposable mutant of the copy's board from
# the copy's own mutate.mjs (text only, applies exactly once or is skipped), run the suite against it (BOARD=mutant, every
# failure reported, 600 s cap, own process group), and record exit, duration and the failing checks. One at a time.
C=$1; O=$2; SUITE=$3; shift 3; B=$(cd "$(dirname "$0")" && pwd -P); mkdir -p "$O"
# PROVENANCE (runner correction, Brad, 12 Oct): every helper runs from the frozen snapshot $SNAP of the pinned backup
# commit $RUNNER_SHA, and is checked against that commit immediately before it is executed.
REPO=/home/user/orbit-board
vh(){ local f n want got d
  [[ "$RUNNER_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo "REFUSED: RUNNER_SHA must be a full 40-hex commit"; exit 2; }
  [ -n "$SNAP" ] || { echo "REFUSED: SNAP (the frozen snapshot) is not set"; exit 2; }
  for f in "$@"; do n=$(basename "$f"); d=$(cd "$(dirname "$f")" 2>/dev/null && pwd -P)
    [ "$d" = "$SNAP" ] || { echo "REFUSED: $n is not in the frozen snapshot $SNAP (it is in $d)"; exit 2; }
    want=$(git -C "$REPO" rev-parse --verify -q "$RUNNER_SHA:recovery/v200/bin/$n") || { echo "REFUSED: $n is not in runner commit $RUNNER_SHA"; exit 2; }
    got=$(git hash-object "$f")
    [ "$want" = "$got" ] || { echo "REFUSED: $n is $got, not runner commit $RUNNER_SHA's $want"; exit 2; }
  done; }

vh "$0" "$B/run.sh" "$B/mkmut.py" "$B/mcread.py"
for id in "$@"; do
  M="$O/mut-$id.html"
  vh "$B/mkmut.py" "$B/mcread.py"; if ! python3 -I "$B/mkmut.py" "$C/tools/export-audit/mutate.mjs" "$C/prioritization-board-grid.html" "$id" "$M" > "$O/mut-$id.json"; then
    echo "$id NOT APPLICABLE ($(cat "$O/mut-$id.json" | head -c 200))" | tee -a "$O/summary.txt"; continue; fi
  diff "$C/prioritization-board-grid.html" "$M" > "$O/mut-$id.diff"
  vh "$B/run.sh"; (cd "$C" && "$B/run.sh" "$O/$id.log" 600 BOARD="$M" -- node "tools/export-audit/$SUITE" > /dev/null)
  X=$(grep -E '^# exit' "$O/$id.log"); V=$(grep -m1 -o -E '[0-9]+ FAILING CHECK\(S\)|ALL CHECKS PASSED' "$O/$id.log")
  echo "$id | applies once | $SUITE | $X | ${V:-no verdict line} | blob $(git hash-object "$M")" | tee -a "$O/summary.txt"
done
