#!/bin/bash
# sens-import.sh <copy-root> <outdir> <id>... : committed-suite sensitivity in audit-import, ONE RUN AT A TIME (Brad: audit-import
# alone, 900 s + 20 s grace; a timeout is incomplete). Mutants made from the copy's own mutate.mjs as text (applies once or
# skipped). Between runs it waits while <outdir>/PAUSE exists, so no other suite of the lead's runs alongside an audit-import.
# <copy-root> must be a git clone at the commit: the v1.86 block reads an old board with `git show 68b02e9:…`. The id
# BASELINE runs the unmutated board first.
C=$1; O=$2; shift 2; B=$(dirname "$0"); mkdir -p "$O"
for id in "$@"; do
  while [ -e "$O/PAUSE" ]; do sleep 5; done; touch "$O/RUNNING"
  if [ "$id" = BASELINE ]; then
    (cd "$C" && "$B/run.sh" "$O/BASELINE.log" 900 grace=20 X=1 -- node tools/export-audit/audit-import.mjs > /dev/null)
    echo "BASELINE (unmutated) | audit-import | $(grep -E '^# exit' "$O/BASELINE.log") | $(grep -m1 -o -E '[0-9]+ FAILING CHECK\(S\)|ALL CHECKS PASSED' "$O/BASELINE.log")" | tee -a "$O/summary.txt"
    rm -f "$O/RUNNING"; continue; fi
  M="$O/mut-$id.html"
  if ! python3 -I "$B/mkmut.py" "$C/tools/export-audit/mutate.mjs" "$C/prioritization-board-grid.html" "$id" "$M" > "$O/mut-$id.json"; then
    echo "$id NOT APPLICABLE" | tee -a "$O/summary.txt"; rm -f "$O/RUNNING"; continue; fi
  diff "$C/prioritization-board-grid.html" "$M" > "$O/mut-$id.diff"
  (cd "$C" && "$B/run.sh" "$O/$id.log" 900 grace=20 BOARD="$M" -- node tools/export-audit/audit-import.mjs > /dev/null)
  X=$(grep -E '^# exit' "$O/$id.log"); V=$(grep -m1 -o -E '[0-9]+ FAILING CHECK\(S\)|ALL CHECKS PASSED' "$O/$id.log"); T=$(grep -c 'TIMED OUT' "$O/$id.log")
  SC=$(python3 -c "
import re,collections,sys; t=open('$O/$id.log',encoding='utf-8').read(); print(dict(collections.Counter(re.findall(r'^--- (.+?) \| ',t,re.M))))")
  echo "$id | applies once | audit-import | $X | ${V:-no verdict line}$([ $T -gt 0 ] && echo ' | TIMED OUT = incomplete') | blob $(git hash-object "$M") | scenarios $SC" | tee -a "$O/summary.txt"
  rm -f "$O/RUNNING"
done
echo DONE >> "$O/summary.txt"
