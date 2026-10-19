#!/bin/bash
# final-tree.sh <clone> <outdir> <wait-summary> : the final-tree evidence runs, after the audit-import sensitivity sequence
# (its summary.txt ends with DONE). audit-import alone at 900 s + 20 s; every other command 600 s; nothing runs beside an
# audit-import. Suites run with BOARD unset in the git clone; sensitivity mutants are made from the clone's own mutate.mjs
# as text (bin/mkmut.py), one at a time.
C=$1; O=$2; WAITF=$3; B=$(dirname "$0"); mkdir -p "$O"
until grep -q '^DONE' "$WAITF" 2>/dev/null; do sleep 15; done
echo "start $(date -u +%FT%TZ) $(git -C "$C" rev-parse HEAD)" >> "$O/summary.txt"
git -C "$C" ls-tree -r HEAD prioritization-board-grid.html tools package.json > "$O/blobs.txt"
v(){ echo "$1 | $(grep -E '^# exit' "$O/$1.log") | $(grep -m1 -o -E '[0-9]+ FAILING CHECK\(S\)|ALL CHECKS PASSED|identical either way|every legacy Force setting computes exactly as before' "$O/$1.log")$(grep -q 'TIMED OUT' "$O/$1.log" && echo ' | TIMED OUT = incomplete')" >> "$O/summary.txt"; }
(cd "$C" && "$B/run.sh" "$O/audit-import.log" 900 grace=20 X=1 -- node tools/export-audit/audit-import.mjs >/dev/null); v audit-import
( for s in audit-board audit-hostile audit-ppt legacy-fsrc boot-same; do (cd "$C" && "$B/run.sh" "$O/$s.log" 600 X=1 -- node tools/export-audit/$s.mjs >/dev/null); v $s; done ) &
( for s in audit-recon audit-inject audit-other audit; do (cd "$C" && "$B/run.sh" "$O/$s.log" 600 X=1 -- node tools/export-audit/$s.mjs >/dev/null); v $s; done ) &
wait
"$B/sens.sh" "$C" "$O/sens" audit-recon.mjs $(python3 -I -c "
import importlib.util,sys; s=importlib.util.spec_from_file_location('mc','$B/mcread.py'); m=importlib.util.module_from_spec(s); s.loader.exec_module(m)
print(' '.join(k for k in m.entries(open('$C/tools/export-audit/mutate.mjs',encoding='utf-8').read()) if k.startswith('v200-r1-')))") > /dev/null
"$B/sens.sh" "$C" "$O/sens" audit-board.mjs $(python3 -I -c "
import importlib.util,sys; s=importlib.util.spec_from_file_location('mc','$B/mcread.py'); m=importlib.util.module_from_spec(s); s.loader.exec_module(m)
print(' '.join(k for k in m.entries(open('$C/tools/export-audit/mutate.mjs',encoding='utf-8').read()) if k.startswith('v200-r2-')))") > /dev/null
(cd "$C" && "$B/run.sh" "$O/verify-grid.log" 600 X=1 -- npm run verify:grid --silent >/dev/null); echo "verify:grid | $(grep -E '^# exit' "$O/verify-grid.log")$(grep -q 'TIMED OUT' "$O/verify-grid.log" && echo ' | TIMED OUT = incomplete')" >> "$O/summary.txt"
(cd "$C" && "$B/run.sh" "$O/standards.log" 600 X=1 -- npm run standards --silent >/dev/null); echo "standards | $(grep -E '^# exit' "$O/standards.log")" >> "$O/summary.txt"
python3 -I "$B/mcount.py" "$C/tools/export-audit/mutate.mjs" "$C/prioritization-board-grid.html" > "$O/applicability.json"
echo "DONE $(date -u +%FT%TZ)" >> "$O/summary.txt"
