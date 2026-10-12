#!/bin/bash
# final-tree-v3.sh <clone> <outdir> <dest-under-recovery/v200/evidence> <pinned-sha> <manifest.tsv> : the final-tree queue,
# ONCE, at the pinned integration commit (Brad, 12 Oct). It refuses to start unless the clone's HEAD is <pinned-sha> with no
# tracked change, and unless the manifest was generated from that clone (its ids are re-read from the clone's mutate.mjs as
# TEXT; mutate.mjs is never run). Order (Brad, 12 Oct, 6:59 AM ET: "Produce the pinned baseline and new/affected-protection
# evidence matrix first"):
#  0. npm run check FIRST, MANDATORY (Brad, 12 Oct, 7:12 AM ET): if it does not pass, the queue STOPS here -- no suite,
#     no sensitivity -- and its failures are resolved before anything expensive starts.
#  1. THE PINNED BASELINE: audit-import ALONE (alone-run.sh: quiet gap, lock, record-only watcher, repeat if overlapped;
#     900 s + 20 s); then every other audit:suites suite and audit-ui (600 s caps, two lanes, never beside audit-import);
#     then npm run verify:grid and npm run standards (600 s each); mutation applicability for every manifest id.
#  2. SENSITIVITY, manifest order: category "new", then "affected", then "reimpl"; full runs recording every failing check
#     (audit-import's alone; the others one at a time). A suite's mutations run ONLY IF THAT SUITE'S UNMUTATED BASELINE
#     PASSED at this tree; otherwise each is recorded INCOMPLETE (baseline failed) and none runs (Brad, 12 Oct).
#  3. HELD, never run here: category "held" (the 135 pre-reset v2.00 hardening mutations) and the informational lane.
# Every finished run is backed up at once to recovery/v200/evidence/<dest>/ on claude/v200-fixes-wip.
C=$1; O=$2; D=$3; PIN=$4; MAN=$5; B=$(dirname "$0"); mkdir -p "$O/import" "$O/suites" "$O/sens"
et() { TZ=America/New_York date '+%I:%M:%S %p ET'; }
H=$(git -C "$C" rev-parse HEAD); [ "$H" = "$(git -C "$C" rev-parse "$PIN")" ] && [ -z "$(git -C "$C" status --porcelain --untracked-files=no)" ] || { echo "REFUSED: clone HEAD $H is not the pinned $PIN, or it has tracked changes"; exit 2; }
python3 -I "$B/mkmanifest.py" "$C/tools/export-audit/mutate.mjs" "$C/prioritization-board-grid.html" "$(dirname "$MAN")/affected.txt" > "$O/manifest.check.tsv" 2>/dev/null || python3 -I "$B/mkmanifest.py" "$C/tools/export-audit/mutate.mjs" "$C/prioritization-board-grid.html" > "$O/manifest.check.tsv"
cmp -s "$MAN" "$O/manifest.check.tsv" || { echo "REFUSED: $MAN is not the manifest of this clone (see $O/manifest.check.tsv)"; exit 2; }
cp "$MAN" "$O/suites/manifest.tsv"
# PROVENANCE: every script this queue runs must equal its backed-up copy in recovery/v200/bin on claude/v200-fixes-wip.
RB=/home/user/orbit-board/recovery/v200/bin; : > "$O/suites/scripts.txt"
for f in final-tree-v3.sh mkmanifest.py alone-run.sh sens-import.sh overlap-watch.sh backup-run.sh sens.sh run.sh mkmut.py mcread.py mcount.py; do
  echo "$(git hash-object "$B/$f")  $f" >> "$O/suites/scripts.txt"
  cmp -s "$B/$f" "$RB/$f" || { echo "REFUSED: $f differs from its backed-up copy in $RB"; exit 2; }; done
echo "scripts: equal to recovery/v200/bin at $(git -C /home/user/orbit-board rev-parse --short HEAD) (blobs in suites/scripts.txt)" >> "$O/summary.txt"
echo "start $(et) pinned $H tree $(git -C "$C" rev-parse HEAD^{tree})" >> "$O/summary.txt"
git -C "$C" ls-tree -r HEAD prioritization-board-grid.html tools package.json > "$O/blobs.txt"; cp "$O/blobs.txt" "$O/suites/blobs.txt"
# 0. npm run check, first and mandatory
(cd "$C" && "$B/run.sh" "$O/suites/check.log" 600 X=1 -- npm run check --silent >/dev/null)
echo "check | $(grep -E '^# exit' "$O/suites/check.log") | $(grep -m1 -o -E 'all checks passed|[0-9]+ check\(s\) failed|[0-9]+ failed' "$O/suites/check.log")" >> "$O/suites/summary.txt"
if ! grep -q 'all checks passed' "$O/suites/check.log" || ! grep -q '^# exit: 0' "$O/suites/check.log"; then
  echo "STOPPED $(et): npm run check did not pass at the pinned tree; nothing else runs until its failures are resolved" >> "$O/summary.txt"
  $B/backup-run.sh "$O/suites" "$D/suites" "final tree: npm run check failed, queue stopped"; exit 5; fi
# 1. baseline
$B/alone-run.sh "$C" "$O/import" "$D/import" "final tree audit-import baseline" BASELINE || { echo "audit-import baseline could not run alone; stopped $(et)" >> "$O/summary.txt"; exit 4; }
grep -v '^DONE' "$O/import/summary.txt" | tail -1 | sed 's/^/baseline audit-import: /' >> "$O/summary.txt"
v(){ echo "$1 | $(grep -E '^# exit' "$O/suites/$1.log") | $(grep -m1 -o -E '[0-9]+ FAILING CHECK\(S\)|ALL CHECKS PASSED|identical either way|every legacy Force setting computes exactly as before|^same' "$O/suites/$1.log")$(grep -q 'TIMED OUT' "$O/suites/$1.log" && echo ' | TIMED OUT = incomplete')" >> "$O/suites/summary.txt"; }
L1="audit-board audit-hostile audit-ppt legacy-fsrc boot-same"; L2="audit-recon audit-inject audit-other audit audit-ui"
( for s in $L1; do (cd "$C" && "$B/run.sh" "$O/suites/$s.log" 600 X=1 -- node tools/export-audit/$s.mjs >/dev/null); v $s; done ) &
( for s in $L2; do (cd "$C" && "$B/run.sh" "$O/suites/$s.log" 600 X=1 -- node tools/export-audit/$s.mjs >/dev/null); v $s; done ) &
wait
(cd "$C" && "$B/run.sh" "$O/suites/verify-grid.log" 600 X=1 -- npm run verify:grid --silent >/dev/null); echo "verify:grid | $(grep -E '^# exit' "$O/suites/verify-grid.log")$(grep -q 'TIMED OUT' "$O/suites/verify-grid.log" && echo ' | TIMED OUT = incomplete')" >> "$O/suites/summary.txt"
(cd "$C" && "$B/run.sh" "$O/suites/standards.log" 600 X=1 -- npm run standards --silent >/dev/null); echo "standards | $(grep -E '^# exit' "$O/suites/standards.log")$(grep -q 'TIMED OUT' "$O/suites/standards.log" && echo ' | TIMED OUT = incomplete')" >> "$O/suites/summary.txt"
python3 -I "$B/mcount.py" "$C/tools/export-audit/mutate.mjs" "$C/prioritization-board-grid.html" > "$O/suites/applicability.json"
sed 's/^/baseline: /' "$O/suites/summary.txt" >> "$O/summary.txt"; $B/backup-run.sh "$O/suites" "$D/suites" "final tree baseline"
passed(){ [ "$1" = audit-import ] && { grep -q 'ALL CHECKS PASSED' "$O/import/BASELINE.log" 2>/dev/null; return; }; grep -q 'ALL CHECKS PASSED' "$O/suites/$1.log" 2>/dev/null && ! grep -q 'TIMED OUT' "$O/suites/$1.log"; }
# 2. sensitivity, by category then suite
for cat in new affected reimpl; do
  for s in audit-import audit-recon audit-board audit-ui; do
    IDS=$(awk -F'\t' -v c=$cat -v s=$s 'NR>1 && $4==c && $3==s && $5=="yes"{print $1}' "$MAN" | tr '\n' ' ')
    [ -z "$IDS" ] && continue
    if ! passed $s; then for id in $IDS; do echo "$cat | $s | $id | INCOMPLETE: $s's unmutated baseline did not pass at this tree; not run" >> "$O/summary.txt"; done; continue; fi
    echo "sensitivity $cat $s ($(echo $IDS | wc -w)) start $(et)" >> "$O/summary.txt"
    if [ $s = audit-import ]; then $B/alone-run.sh "$C" "$O/sens/$cat-import" "$D/sens-$cat-import" "final tree $cat audit-import sensitivity" $IDS || echo "$cat audit-import sensitivity stopped (overlaps) $(et)" >> "$O/summary.txt"
    else "$B/sens.sh" "$C" "$O/sens/$cat-${s#audit-}" "$s.mjs" $IDS > /dev/null; $B/backup-run.sh "$O/sens/$cat-${s#audit-}" "$D/sens-$cat-${s#audit-}" "final tree $cat $s sensitivity"; fi
  done
done
awk -F'\t' 'NR>1 && $5!="yes"{print "NOT APPLICABLE at this tree: "$1" ("$2", "$3")"}' "$MAN" >> "$O/summary.txt"
echo "held, not run: $(awk -F'\t' 'NR>1 && $4=="held"' "$MAN" | wc -l) pre-reset v2.00 mutations; the informational lane" >> "$O/summary.txt"
echo "DONE $(et)" >> "$O/summary.txt"; cp "$O/summary.txt" "$O/suites/summary-all.txt"; $B/backup-run.sh "$O/suites" "$D/suites" "final tree summary"
