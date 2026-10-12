#!/bin/bash
# sens-import.sh <copy-root> <outdir> <id>... : committed-suite sensitivity in audit-import, ONE RUN AT A TIME (Brad: audit-import
# alone, 900 s + 20 s grace; a timeout is incomplete). Mutants made from the copy's own mutate.mjs as text (applies once or
# skipped). Between runs it waits while <outdir>/PAUSE exists, so no other suite of the lead's runs alongside an audit-import.
# <copy-root> must be a git clone at the commit: the v1.86 block reads an old board with `git show 68b02e9:…`. The id
# BASELINE runs the unmutated board first.
C=$1; O=$2; shift 2; B=$(cd "$(dirname "$0")" && pwd -P); mkdir -p "$O"
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
  while [ -e "$O/PAUSE" ]; do sleep 5; done; touch "$O/RUNNING"
  if [ "$id" = BASELINE ]; then
    vh "$B/run.sh"; (cd "$C" && "$B/run.sh" "$O/BASELINE.log" 900 grace=20 X=1 -- node tools/export-audit/audit-import.mjs > /dev/null)
    echo "BASELINE (unmutated) | audit-import | $(grep -E '^# exit' "$O/BASELINE.log") | $(grep -m1 -o -E '[0-9]+ FAILING CHECK\(S\)|ALL CHECKS PASSED' "$O/BASELINE.log")" | tee -a "$O/summary.txt"
    rm -f "$O/RUNNING"; continue; fi
  M="$O/mut-$id.html"
  vh "$B/mkmut.py" "$B/mcread.py"; if ! python3 -I "$B/mkmut.py" "$C/tools/export-audit/mutate.mjs" "$C/prioritization-board-grid.html" "$id" "$M" > "$O/mut-$id.json"; then
    echo "$id NOT APPLICABLE" | tee -a "$O/summary.txt"; rm -f "$O/RUNNING"; continue; fi
  diff "$C/prioritization-board-grid.html" "$M" > "$O/mut-$id.diff"
  vh "$B/run.sh"; FF=; [ "$FIRSTFAIL" = 1 ] && FF="MUT_FIRST_FAIL=1"   # first-catch mode (pre-reset chain fallback only): the suite stops at its first failed check
  (cd "$C" && "$B/run.sh" "$O/$id.log" 900 grace=20 BOARD="$M" $FF -- node tools/export-audit/audit-import.mjs > /dev/null)
  X=$(grep -E '^# exit' "$O/$id.log"); V=$(grep -m1 -o -E '[0-9]+ FAILING CHECK\(S\)|ALL CHECKS PASSED' "$O/$id.log"); T=$(grep -c 'TIMED OUT' "$O/$id.log")
  SC=$(python3 -c "
import re,collections,sys; t=open('$O/$id.log',encoding='utf-8').read(); print(dict(collections.Counter(re.findall(r'^--- (.+?) \| ',t,re.M))))")
  echo "$id | applies once | audit-import | $X | ${V:-no verdict line}$([ $T -gt 0 ] && echo ' | TIMED OUT = incomplete') | blob $(git hash-object "$M") | scenarios $SC" | tee -a "$O/summary.txt"
  rm -f "$O/RUNNING"
done
echo DONE >> "$O/summary.txt"
