#!/bin/bash
# final-tree-v2.sh <clone> <outdir> <dest-under-recovery/v200/evidence> <pinned-sha> <ui-suite.mjs|-> <ui-mutation-prefix|-> : the final-tree
# queue, ONCE, at the pinned integrated tree (Brad, 12 Oct, 6:00 AM ET). Suites run with BOARD unset in the git clone.
#  1. audit-import, alone (alone-run.sh: quiet gap, lock, record-only overlap watcher, repeat if overlapped), 900 s + 20 s.
#  2. every other suite, 600 s caps, in two lanes, after audit-import and never beside it.
#  3. committed-suite sensitivity for EVERY v2.00 mutation at this tree: audit-import's alone (R3, R4, R4b, R5, U2, U13 and
#     unsaved-flag-never-set), then audit-recon (R1, U1, U14), audit-board (R2) and the UI suite (UI chunk 3), one at a time.
#     Mutants are made from the clone's own mutate.mjs as TEXT (mkmut.py); mutate.mjs is never run.
#  3b. the 135 pre-reset v2.00 hardening mutations: first-catch chain (sens-chain.sh), audit-import alone for the rest.
#  4. npm run verify:grid and npm run standards (600 s each); 5. mutation applicability (text only).
#  6. INFORMATIONAL, after the gates (600 s each): check.mjs, math-defects, money-coverage, trace-matrix, money-map,
#     roundtrip-fuzz. NOT run: validate-math (it executes mutate.mjs, which is never run), export-delta and verify-file
#     (each needs a second board or a saved working file).
# It refuses to start unless the clone's HEAD is <pinned-sha> with no tracked change.
# Every finished run is backed up at once to recovery/v200/evidence/<dest>/ on claude/v200-fixes-wip.
C=$1; O=$2; D=$3; PIN=$4; UIS=$5; UIP=$6; B=$(dirname "$0"); mkdir -p "$O/import" "$O/suites" "$O/sens" "$O/extra"
H=$(git -C "$C" rev-parse HEAD); [ "$H" = "$(git -C "$C" rev-parse "$PIN")" ] && [ -z "$(git -C "$C" status --porcelain --untracked-files=no)" ] || { echo "REFUSED: clone HEAD $H is not the pinned $PIN, or it has tracked changes"; exit 2; }
et() { TZ=America/New_York date '+%I:%M:%S %p ET'; }
echo "start $(et) pinned $H tree $(git -C "$C" rev-parse HEAD^{tree})" >> "$O/summary.txt"
git -C "$C" ls-tree -r HEAD prioritization-board-grid.html tools package.json > "$O/blobs.txt"; cp "$O/blobs.txt" "$O/suites/blobs.txt"
ids() { python3 -I -c "
import importlib.util,re,sys; s=importlib.util.spec_from_file_location('mc','$B/mcread.py'); m=importlib.util.module_from_spec(s); s.loader.exec_module(m)
ks=list(m.entries(open('$C/tools/export-audit/mutate.mjs',encoding='utf-8').read())); pats=sys.argv[1:]
print(' '.join(k for k in ks if any(re.fullmatch(p,k) for p in pats)))" "$@"; }
# 1. audit-import, alone
$B/alone-run.sh "$C" "$O/import" "$D/import" "final tree audit-import" BASELINE || { echo "audit-import could not run alone; stopped $(et)" >> "$O/summary.txt"; exit 4; }
grep -v '^DONE' "$O/import/summary.txt" | tail -1 | sed 's/^/audit-import: /' >> "$O/summary.txt"
# 2. the other suites
v(){ echo "$1 | $(grep -E '^# exit' "$O/suites/$1.log") | $(grep -m1 -o -E '[0-9]+ FAILING CHECK\(S\)|ALL CHECKS PASSED|identical either way|every legacy Force setting computes exactly as before|^same' "$O/suites/$1.log")$(grep -q 'TIMED OUT' "$O/suites/$1.log" && echo ' | TIMED OUT = incomplete')" >> "$O/suites/summary.txt"; }
L1="audit-board audit-hostile audit-ppt legacy-fsrc boot-same"; L2="audit-recon audit-inject audit-other audit"; [ "$UIS" != "-" ] && L2="$L2 ${UIS%.mjs}"
( for s in $L1; do (cd "$C" && "$B/run.sh" "$O/suites/$s.log" 600 X=1 -- node tools/export-audit/$s.mjs >/dev/null); v $s; done ) &
( for s in $L2; do (cd "$C" && "$B/run.sh" "$O/suites/$s.log" 600 X=1 -- node tools/export-audit/$s.mjs >/dev/null); v $s; done ) &
wait; cat "$O/suites/summary.txt" >> "$O/summary.txt"; $B/backup-run.sh "$O/suites" "$D/suites" "final tree suites"
# 3. sensitivity
IMP=$(ids 'v200-r3-.*' 'v200-r4-.*' 'v200-r5-.*' 'v200-u2-.*' 'v200-u13-.*' 'unsaved-flag-never-set' 'impmixed-file-unguarded')
echo "audit-import sensitivity ids: $IMP" >> "$O/summary.txt"
$B/alone-run.sh "$C" "$O/sens/import" "$D/sens-import" "final tree audit-import sensitivity" $IMP || echo "audit-import sensitivity stopped (overlaps) $(et)" >> "$O/summary.txt"
REC=$(ids 'v200-r1-.*' 'v200-u1-.*' 'v200-u14-.*'); BRD=$(ids 'v200-r2-.*'); echo "audit-recon ids: $REC | audit-board ids: $BRD" >> "$O/summary.txt"
"$B/sens.sh" "$C" "$O/sens/recon" audit-recon.mjs $REC > /dev/null; $B/backup-run.sh "$O/sens/recon" "$D/sens-recon" "final tree audit-recon sensitivity"
"$B/sens.sh" "$C" "$O/sens/board" audit-board.mjs $BRD > /dev/null; $B/backup-run.sh "$O/sens/board" "$D/sens-board" "final tree audit-board sensitivity"
if [ "$UIS" != "-" ] && [ "$UIP" != "-" ]; then UI=$(ids "$UIP.*"); echo "UI suite ids: $UI" >> "$O/summary.txt"
  "$B/sens.sh" "$C" "$O/sens/ui" "$UIS" $UI > /dev/null; $B/backup-run.sh "$O/sens/ui" "$D/sens-ui" "final tree UI sensitivity"; fi
# 3b. the pre-reset v2.00 hardening mutations (every v200-* id outside R1-R5, U-items and UI chunk 3): first-catch chain,
#     then a full audit-import ALONE for any none of the cheaper suites catches.
PRE=$(python3 -I -c "
import importlib.util,re; s=importlib.util.spec_from_file_location('mc','$B/mcread.py'); m=importlib.util.module_from_spec(s); s.loader.exec_module(m)
ks=list(m.entries(open('$C/tools/export-audit/mutate.mjs',encoding='utf-8').read()))
print(' '.join(k for k in ks if k.startswith('v200-') and not re.match(r'v200-(r\\d+|r4b|u\\d+|ui3)-',k)))")
echo "pre-reset v2.00 ids ($(echo $PRE | wc -w)): first-catch chain" >> "$O/summary.txt"
"$B/sens-chain.sh" "$C" "$O/sens/chain" $PRE; $B/backup-run.sh "$O/sens/chain" "$D/sens-chain" "final tree pre-reset v2.00 chain"
NI=$(cat "$O/sens/chain/needs-import.txt"); [ -n "$NI" ] && { FIRSTFAIL=1 $B/alone-run.sh "$C" "$O/sens/chain-import" "$D/sens-chain-import" "final tree chain audit-import" $NI || echo "chain audit-import stopped (overlaps) $(et)" >> "$O/summary.txt"; }
# 4. the gates that are not suites
(cd "$C" && "$B/run.sh" "$O/suites/verify-grid.log" 600 X=1 -- npm run verify:grid --silent >/dev/null); echo "verify:grid | $(grep -E '^# exit' "$O/suites/verify-grid.log")$(grep -q 'TIMED OUT' "$O/suites/verify-grid.log" && echo ' | TIMED OUT = incomplete')" >> "$O/summary.txt"
(cd "$C" && "$B/run.sh" "$O/suites/standards.log" 600 X=1 -- npm run standards --silent >/dev/null); echo "standards | $(grep -E '^# exit' "$O/suites/standards.log")" >> "$O/summary.txt"
# 5. applicability
python3 -I "$B/mcount.py" "$C/tools/export-audit/mutate.mjs" "$C/prioritization-board-grid.html" > "$O/suites/applicability.json"
cp "$O/summary.txt" "$O/suites/summary-all.txt"; $B/backup-run.sh "$O/suites" "$D/suites" "final tree gates and applicability"
# 6. informational lane
x(){ echo "$1 | $(grep -E '^# exit' "$O/extra/$1.log")$(grep -q 'TIMED OUT' "$O/extra/$1.log" && echo ' | TIMED OUT = incomplete')" >> "$O/extra/summary.txt"; }
(cd "$C" && "$B/run.sh" "$O/extra/check.log" 600 X=1 -- node tools/check.mjs prioritization-board-grid.html >/dev/null); x check
for t in math-defects money-coverage trace-matrix money-map roundtrip-fuzz; do (cd "$C" && "$B/run.sh" "$O/extra/$t.log" 600 X=1 -- node tools/$t.mjs >/dev/null); x $t; done
cat "$O/extra/summary.txt" | sed 's/^/informational: /' >> "$O/summary.txt"; $B/backup-run.sh "$O/extra" "$D/extra" "final tree informational tools"
echo "DONE $(et)" >> "$O/summary.txt"; cp "$O/summary.txt" "$O/suites/summary-all.txt"; $B/backup-run.sh "$O/suites" "$D/suites" "final tree summary"
