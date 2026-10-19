#!/bin/bash
# final-tree-v4.sh <runner-sha> <clone> <outdir> <dest-under-recovery/v200/evidence> <pinned-tree-sha> <manifest.tsv>
# The final-tree queue, ONCE, at the pinned integration commit. v4 = v3 plus the RUNNER CORRECTION (Brad, 12 Oct, after the
# 9:25 AM ET checkpoint): (1) <runner-sha> is a FULL backup commit SHA on origin/claude/v200-fixes-wip, and every helper runs
# from a FROZEN, TASK-LOCAL SNAPSHOT of recovery/v200/bin at that commit (this script's own directory), verified file for
# file and blob for blob against the commit, and immutable (chattr +i), before anything runs; (2) every helper -- mkmanifest
# included -- is checked against the commit again immediately before it is executed, and alone-run takes its helpers from its
# own snapshot directory; (3) a baseline authorizes sensitivity ONLY through gate.sh: a recorded exit 0, the suite's own
# completion verdict, an end line (not interrupted), no timeout and no failing-check line; (4) runner-selftest.sh holds the
# bounded refusal checks (an altered helper; a success banner followed by a nonzero exit, a timeout or an interruption).
# BOOTSTRAP (the only command run outside the snapshot; recorded in the summary):
#   S=<outdir>/runner; mkdir -p "$S" && git -C /home/user/orbit-board archive <runner-sha> recovery/v200/bin | tar -x -C "$S" \
#     && chattr -R +i "$S/recovery" && "$S/recovery/v200/bin/final-tree-v4.sh" <runner-sha> <clone> <outdir> <dest> <tree-sha> <manifest>
# Steps, as v3: 0. npm run check, mandatory (a failure stops the queue); 1. the pinned baseline (audit-import ALONE; the
# other suites and audit-ui; verify:grid; standards; applicability); 2. sensitivity in manifest order new, affected, reimpl,
# each suite's only through gate.sh on its baseline; 3. HELD, never run here: the 135 pre-reset mutations, the informational lane.
RUNNER_SHA=$1; C=$2; O=$3; D=$4; PIN=$5; MAN=$6
B=$(cd "$(dirname "$0")" && pwd -P); export SNAP=$B RUNNER_SHA
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
# --- the snapshot, verified before anything else runs ---
[[ "$RUNNER_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo "REFUSED: <runner-sha> must be a full 40-hex commit, got '$RUNNER_SHA'"; exit 2; }
git -C "$REPO" fetch -q origin claude/v200-fixes-wip 2>/dev/null
git -C "$REPO" merge-base --is-ancestor "$RUNNER_SHA" origin/claude/v200-fixes-wip 2>/dev/null || { echo "REFUSED: $RUNNER_SHA is not on origin/claude/v200-fixes-wip (not a backed-up commit)"; exit 2; }
[ "$B" != "/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/bin" ] || { echo "REFUSED: running from the scratch working copy, not a snapshot"; exit 2; }
WANT=$(git -C "$REPO" ls-tree "$RUNNER_SHA" recovery/v200/bin/ | awk '{print $3"  "substr($4, length("recovery/v200/bin/")+1)}' | sort -k2)
GOT=$(cd "$B" && for f in * .[!.]*; do [ -e "$f" ] || continue; [ -f "$f" ] || { echo "DIR $f"; continue; }; echo "$(git hash-object "$f")  $f"; done | sort -k2)
[ "$WANT" = "$GOT" ] || { echo "REFUSED: the snapshot $B is not exactly recovery/v200/bin at $RUNNER_SHA"; diff <(echo "$WANT") <(echo "$GOT") | head -20; exit 2; }
for f in "$B" "$B"/*; do lsattr -d "$f" 2>/dev/null | awk '{print $1}' | grep -q i || { echo "REFUSED: $(basename "$f") in the snapshot is not immutable (chattr +i)"; exit 2; }; done
vh "$0"
mkdir -p "$O/import" "$O/suites" "$O/sens"; export RUNNER_PIDS="$O/pids.txt" PYTHONDONTWRITEBYTECODE=1
et() { TZ=America/New_York date '+%I:%M:%S %p ET'; }
echo "runner $RUNNER_SHA snapshot $B verified $(et): $(echo "$WANT" | wc -l) files, every blob equal, immutable" >> "$O/summary.txt"
echo "$WANT" > "$O/suites/runner-blobs.txt"
H=$(git -C "$C" rev-parse --verify -q HEAD 2>/dev/null); P=$(git -C "$C" rev-parse --verify -q "$PIN^{commit}" 2>/dev/null)
[[ "$H" =~ ^[0-9a-f]{40}$ ]] && [ "$H" = "$P" ] && [ -z "$(git -C "$C" status --porcelain --untracked-files=no 2>&1)" ] || { echo "REFUSED: clone HEAD '$H' is not the pinned '$PIN' (or the clone is missing, or it has tracked changes)"; exit 2; }
vh "$B/mkmanifest.py" "$B/mcread.py"
python3 -I "$B/mkmanifest.py" "$C/tools/export-audit/mutate.mjs" "$C/prioritization-board-grid.html" "$(dirname "$MAN")/affected.txt" > "$O/manifest.check.tsv" 2>/dev/null || { vh "$B/mkmanifest.py" "$B/mcread.py"; python3 -I "$B/mkmanifest.py" "$C/tools/export-audit/mutate.mjs" "$C/prioritization-board-grid.html" > "$O/manifest.check.tsv"; }
cmp -s "$MAN" "$O/manifest.check.tsv" || { echo "REFUSED: $MAN is not the manifest of this clone (see $O/manifest.check.tsv)"; exit 2; }
cp "$MAN" "$O/suites/manifest.tsv"
echo "start $(et) pinned tree $H ($(git -C "$C" rev-parse HEAD^{tree}))" >> "$O/summary.txt"
git -C "$C" ls-tree -r HEAD prioritization-board-grid.html tools package.json > "$O/blobs.txt"; cp "$O/blobs.txt" "$O/suites/blobs.txt"
gate(){ vh "$B/gate.sh"; "$B/gate.sh" "$@"; }
# 0. npm run check, first and mandatory
vh "$B/run.sh"; (cd "$C" && "$B/run.sh" "$O/suites/check.log" 600 X=1 -- npm run check --silent >/dev/null)
G=$(gate "$O/suites/check.log" 'all checks passed') ; echo "check | $G" >> "$O/suites/summary.txt"
if [ "${G%% *}" != ACCEPT ]; then echo "STOPPED $(et): npm run check did not pass at the pinned tree ($G); nothing else runs until its failures are resolved" >> "$O/summary.txt"
  vh "$B/backup-run.sh"; "$B/backup-run.sh" "$O/suites" "$D/suites" "final tree: npm run check failed, queue stopped"; exit 5; fi
# 1. baseline
vh "$B/alone-run.sh"; "$B/alone-run.sh" "$C" "$O/import" "$D/import" "final tree audit-import baseline" BASELINE || { echo "audit-import baseline could not run alone (or a helper was refused); stopped $(et)" >> "$O/summary.txt"; exit 4; }
echo "baseline audit-import: $(gate "$O/import/BASELINE.log" 'ALL CHECKS PASSED')" >> "$O/summary.txt"
v(){ echo "$1 | $(grep -E '^# exit' "$O/suites/$1.log") | $(gate "$O/suites/$1.log" "$2")" >> "$O/suites/summary.txt"; }
L1=("audit-board::ALL CHECKS PASSED" "audit-hostile::ALL CHECKS PASSED" "audit-ppt::ALL CHECKS PASSED" "legacy-fsrc::every legacy Force setting computes exactly as before" "boot-same::is identical either way")
L2=("audit-recon::ALL CHECKS PASSED" "audit-inject::ALL CHECKS PASSED" "audit-other::ALL CHECKS PASSED" "audit::ALL CHECKS PASSED" "audit-ui::ALL CHECKS PASSED")
vh "$B/run.sh" "$B/gate.sh"
( for e in "${L1[@]}"; do s=${e%%::*}; vh "$B/run.sh"; (cd "$C" && "$B/run.sh" "$O/suites/$s.log" 600 X=1 -- node tools/export-audit/$s.mjs >/dev/null); v "$s" "${e#*::}"; done ) &
( for e in "${L2[@]}"; do s=${e%%::*}; vh "$B/run.sh"; (cd "$C" && "$B/run.sh" "$O/suites/$s.log" 600 X=1 -- node tools/export-audit/$s.mjs >/dev/null); v "$s" "${e#*::}"; done ) &
wait
vh "$B/run.sh"; (cd "$C" && "$B/run.sh" "$O/suites/verify-grid.log" 600 X=1 -- npm run verify:grid --silent >/dev/null); echo "verify:grid | $(gate "$O/suites/verify-grid.log" '.')" >> "$O/suites/summary.txt"
vh "$B/run.sh"; (cd "$C" && "$B/run.sh" "$O/suites/standards.log" 600 X=1 -- npm run standards --silent >/dev/null); echo "standards | $(gate "$O/suites/standards.log" '.')" >> "$O/suites/summary.txt"
vh "$B/mcount.py" "$B/mcread.py"; python3 -I "$B/mcount.py" "$C/tools/export-audit/mutate.mjs" "$C/prioritization-board-grid.html" > "$O/suites/applicability.json"
sed 's/^/baseline: /' "$O/suites/summary.txt" >> "$O/summary.txt"; vh "$B/backup-run.sh"; "$B/backup-run.sh" "$O/suites" "$D/suites" "final tree baseline"
passed(){ local G; if [ "$1" = audit-import ]; then G=$(gate "$O/import/BASELINE.log" 'ALL CHECKS PASSED'); else G=$(gate "$O/suites/$1.log" 'ALL CHECKS PASSED'); fi; [ "${G%% *}" = ACCEPT ]; }
# 2. sensitivity, by category then suite; only through the gate
for cat in new affected reimpl; do
  for s in audit-import audit-recon audit-board audit-ui; do
    IDS=$(awk -F'\t' -v c=$cat -v s=$s 'NR>1 && $4==c && $3==s && $5=="yes"{print $1}' "$MAN" | tr '\n' ' ')
    [ -z "$IDS" ] && continue
    if ! passed $s; then for id in $IDS; do echo "$cat | $s | $id | INCOMPLETE: $s's unmutated baseline was not accepted by gate.sh at this tree; not run" >> "$O/summary.txt"; done; continue; fi
    echo "sensitivity $cat $s ($(echo $IDS | wc -w)) start $(et)" >> "$O/summary.txt"
    if [ $s = audit-import ]; then vh "$B/alone-run.sh"; "$B/alone-run.sh" "$C" "$O/sens/$cat-import" "$D/sens-$cat-import" "final tree $cat audit-import sensitivity" $IDS || echo "$cat audit-import sensitivity stopped (overlaps or a refused helper) $(et)" >> "$O/summary.txt"
    else vh "$B/sens.sh" "$B/backup-run.sh"; "$B/sens.sh" "$C" "$O/sens/$cat-${s#audit-}" "$s.mjs" $IDS > /dev/null; "$B/backup-run.sh" "$O/sens/$cat-${s#audit-}" "$D/sens-$cat-${s#audit-}" "final tree $cat $s sensitivity"; fi
  done
done
awk -F'\t' 'NR>1 && $5!="yes"{print "NOT APPLICABLE at this tree: "$1" ("$2", "$3")"}' "$MAN" >> "$O/summary.txt"
echo "held, not run: $(awk -F'\t' 'NR>1 && $4=="held"' "$MAN" | wc -l) pre-reset v2.00 mutations; the informational lane" >> "$O/summary.txt"
echo "DONE $(et)" >> "$O/summary.txt"; cp "$O/summary.txt" "$O/suites/summary-all.txt"; vh "$B/backup-run.sh"; "$B/backup-run.sh" "$O/suites" "$D/suites" "final tree summary"
