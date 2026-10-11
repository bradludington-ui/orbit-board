#!/bin/bash
# sens.sh <copy-root> <outdir> <suite.mjs> <id>... : for each catalog id, build a disposable mutant of the copy's board from
# the copy's own mutate.mjs (text only, applies exactly once or is skipped), run the suite against it (BOARD=mutant, every
# failure reported, 600 s cap, own process group), and record exit, duration and the failing checks. One at a time.
C=$1; O=$2; SUITE=$3; shift 3; B=$(dirname "$0"); mkdir -p "$O"
for id in "$@"; do
  M="$O/mut-$id.html"
  if ! python3 -I "$B/mkmut.py" "$C/tools/export-audit/mutate.mjs" "$C/prioritization-board-grid.html" "$id" "$M" > "$O/mut-$id.json"; then
    echo "$id NOT APPLICABLE ($(cat "$O/mut-$id.json" | head -c 200))" | tee -a "$O/summary.txt"; continue; fi
  diff "$C/prioritization-board-grid.html" "$M" > "$O/mut-$id.diff"
  (cd "$C" && "$B/run.sh" "$O/$id.log" 600 BOARD="$M" -- node "tools/export-audit/$SUITE" > /dev/null)
  X=$(grep -E '^# exit' "$O/$id.log"); V=$(grep -m1 -o -E '[0-9]+ FAILING CHECK\(S\)|ALL CHECKS PASSED' "$O/$id.log")
  echo "$id | applies once | $SUITE | $X | ${V:-no verdict line} | blob $(git hash-object "$M")" | tee -a "$O/summary.txt"
done
