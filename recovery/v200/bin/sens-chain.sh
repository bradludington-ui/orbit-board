#!/bin/bash
# sens-chain.sh <clone> <outdir> <id>... : first-catch sensitivity for the pre-reset v2.00 hardening mutations, as the
# repo's own sweep asks it ("does ANY check fail on this mutated board?"), WITHOUT running mutate.mjs: each mutant is made
# from the clone's mutate.mjs as TEXT (mkmut.py; applies exactly once or is reported NOT APPLICABLE), then the suites run
# one at a time with MUT_FIRST_FAIL=1 (boot.mjs: a suite stops at its first failed check), cheapest likely catchers first:
# audit-inject, audit-hostile, audit-other, audit, audit-ppt, audit-recon, audit-board (600 s caps). The first suite that
# fails is recorded as the catcher. A mutation none of them catches is listed in needs-import.txt for a full audit-import
# run ALONE afterwards (alone-run.sh), never beside anything. A run that times out is incomplete, never a catch.
C=$1; O=$2; shift 2; B=$(dirname "$0"); mkdir -p "$O"; : > "$O/needs-import.txt"
CHAIN="audit-inject audit-hostile audit-other audit audit-ppt audit-recon audit-board"
for id in "$@"; do
  M="$O/mut-$id.html"
  if ! python3 -I "$B/mkmut.py" "$C/tools/export-audit/mutate.mjs" "$C/prioritization-board-grid.html" "$id" "$M" > "$O/mut-$id.json"; then
    echo "$id | NOT APPLICABLE" >> "$O/summary.txt"; continue; fi
  diff "$C/prioritization-board-grid.html" "$M" > "$O/mut-$id.diff" || true
  got=""; tried=""
  for s in $CHAIN; do
    L="$O/$id--$s.log"
    (cd "$C" && "$B/run.sh" "$L" 600 BOARD="$M" MUT_FIRST_FAIL=1 -- node tools/export-audit/$s.mjs >/dev/null)
    tried="$tried $s"
    if grep -q 'TIMED OUT' "$L"; then got="INCOMPLETE ($s timed out)"; break; fi
    if grep -q -E '[0-9]+ FAILING CHECK' "$L"; then got="caught by $s | $(grep -m1 -A2 -E '^--- ' "$L" | head -1 | cut -c1-160)"; break; fi
  done
  if [ -z "$got" ]; then echo "$id" >> "$O/needs-import.txt"; got="not caught by:$tried -> full audit-import alone"; fi
  MB=$(git hash-object "$M"); rm -f "$M"
  echo "$id | applies once | $got | mutant blob $MB" >> "$O/summary.txt"
done
echo "DONE $(TZ=America/New_York date '+%I:%M:%S %p ET')" >> "$O/summary.txt"
