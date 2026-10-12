#!/bin/bash -p
# final-tree-v5.sh <runner-sha> <clone> <outdir> <dest-under-recovery/v200/evidence> <pinned-tree-sha> <manifest.tsv>
# The final-tree queue, ONCE, at the pinned integration commit. v5 = v4 (the runner correction, Brad, 12 Oct) plus RUNNER
# CORRECTION 2, after the independent review of 40f7979:
#  - every runner script starts with the same preamble: bash -p and a re-exec under env -i, so BASH_ENV, SHELLOPTS,
#    inherited functions, GIT_* and PYTHON* settings from the launch cannot reach it; provenance git runs with no system or
#    global config and no replace refs; blob ids are computed directly (S1);
#  - the runner commit must be on origin's claude/v200-fixes-wip as it is NOW (ls-remote); a failed read refuses (S2);
#  - run.sh uses setsid -w (M2) and writes <log>.exit; gate.sh accepts only that record, an unchanged log, run.sh's own
#    trailer, the expected commit, and the verdict as the suite's LAST line (S3); standards is gated on its real verdict,
#    verify:grid is labelled "exit 0, no verdict line" (S6); grep -a and an anchored TIMED OUT (S7);
#  - the snapshot is checked entry for entry with find, links refused, and the WHOLE snapshot root frozen and re-checked at
#    every call (S4); the outdir must be new (only the snapshot in it);
#  - every helper is checked immediately before it runs (backup-run included); a refusal anywhere -- inside $( ) or a
#    background lane too -- is recorded in REFUSALS.txt and stops the queue at its next check; every helper's exit status is
#    checked (S5); python3 -I everywhere (M1).
# BOOTSTRAP (the only commands run outside the snapshot; the summary records this script's own invocation):
#   O=<new outdir>; mkdir "$O" "$O/runner" && git -C /home/user/orbit-board archive <runner-sha> recovery/v200/bin \
#     | tar -x -C "$O/runner" && chattr -R +i "$O/runner" && \
#     "$O/runner/recovery/v200/bin/final-tree-v5.sh" <runner-sha> <clone> "$O" <dest> <tree-sha> <manifest>
# Steps, as v4: 0. npm run check, mandatory (a failure stops the queue, exit 5); 1. the pinned baseline (audit-import ALONE;
# the other suites and audit-ui in two lanes; verify:grid; standards; applicability); 2. sensitivity in manifest order new,
# affected, reimpl, each suite's only through gate.sh on its baseline; 3. HELD, never run here: the 135 pre-reset mutations,
# the informational lane.
# ---- runner preamble v5 begin: byte-identical in every runner shell script (runner-selftest case A18 checks it) ----
# Runner correction 2 (after the independent review of 40f7979, S1): a FIXED environment, whatever this was launched with.
# bash -p ignores BASH_ENV, ENV, SHELLOPTS, BASHOPTS and inherited functions. The first pass re-executes this script under
# env -i (same PID), keeping only the runner's own variables and the network proxy; every other value is set here.
[[ $- == *p* ]] || { echo "REFUSED: $(basename "$0") must run as its own program (#!/bin/bash -p), not through another shell"; exit 2; }
if [ "${RUNNER_ENV_CLEAN:-}" != "$$" ]; then
  _k=(); for _v in RUNNER_SHA SNAP SNAPROOT RUNNER_PIDS RUNNER_REFUSALS RUNNER_LOCK FIRSTFAIL; do [[ -v $_v ]] && _k+=("$_v=${!_v}"); done
  _p=${RUNNER_NET_PROXY:-${HTTPS_PROXY:-${https_proxy:-}}}; _n=${RUNNER_NET_NOPROXY:-${NO_PROXY:-${no_proxy:-}}}
  exec /usr/bin/env -i RUNNER_ENV_CLEAN=$$ RUNNER_NET_PROXY="$_p" RUNNER_NET_NOPROXY="$_n" "${_k[@]}" /bin/bash -p "$0" "$@"
fi
export PATH=/opt/node22/bin:/usr/local/bin:/usr/bin:/bin HOME=/root LANG=C.UTF-8 GIT_TERMINAL_PROMPT=0 GIT_NO_REPLACE_OBJECTS=1 \
  HTTPS_PROXY="$RUNNER_NET_PROXY" https_proxy="$RUNNER_NET_PROXY" NO_PROXY="$RUNNER_NET_NOPROXY" no_proxy="$RUNNER_NET_NOPROXY" \
  GIT_SSL_CAINFO=/root/.ccr/ca-bundle.crt NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt NODE_OPTIONS=--max-old-space-size=8192 \
  NODE_PATH=/usr/local/lib/node_modules_global PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
  NPM_CONFIG_UPDATE_NOTIFIER=false PYTHONDONTWRITEBYTECODE=1
umask 022; set +m; unset _k _v _p _n
REPO=/home/user/orbit-board
# A refusal prints REFUSED and, when the queue set RUNNER_REFUSALS, records it there too, so a refusal inside $( ) or in a
# background lane (which ends only that subshell) still stops the queue at its next check (review S5).
refuse(){ echo "REFUSED: $1"; [ -n "${RUNNER_REFUSALS:-}" ] && echo "$(date -u +%FT%TZ) $(basename "$0"): $1" >> "$RUNNER_REFUSALS"; exit 2; }
# provenance git: no system or global config, no replace refs, the one repository (review S1)
pg(){ GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null git --no-replace-objects -C "$REPO" "$@"; }
# a file's git blob id, computed directly: no git config, filter or line-ending conversion can change it (review S1)
blob(){ python3 -I -c 'import hashlib,sys;d=open(sys.argv[1],"rb").read();print(hashlib.sha1(b"blob %d\0"%len(d)+d).hexdigest())' "$1"; }
frozen(){ [ ! -L "$1" ] && lsattr -d "$1" 2>/dev/null | awk '{print $1}' | grep -q i; }
# vh <file>... : each helper, immediately before it runs: in the snapshot, a regular immutable file, its directories frozen
# up to the snapshot root, and byte for byte the runner commit's blob.
vh(){ local f n want got d p
  [[ "${RUNNER_SHA:-}" =~ ^[0-9a-f]{40}$ ]] || refuse "RUNNER_SHA must be a full 40-hex commit"
  [ -n "${SNAPROOT:-}" ] && [ "${SNAP:-}" = "$SNAPROOT/recovery/v200/bin" ] || refuse "SNAP and SNAPROOT (the frozen snapshot) are not set"
  for p in "$SNAPROOT" "$SNAPROOT/recovery" "$SNAPROOT/recovery/v200" "$SNAP"; do [ -d "$p" ] && frozen "$p" || refuse "$p is not a frozen directory of the snapshot"; done
  for f in "$@"; do n=$(basename "$f"); d=$(cd "$(dirname "$f")" 2>/dev/null && pwd -P)
    [ "$d" = "$SNAP" ] || refuse "$n is not in the frozen snapshot $SNAP (it is in $d)"
    [ -f "$f" ] && [ ! -L "$f" ] || refuse "$n is not a regular file in the snapshot"
    frozen "$f" || refuse "$n in the snapshot is not immutable (chattr +i)"
    want=$(pg rev-parse --verify -q "$RUNNER_SHA:recovery/v200/bin/$n") || refuse "$n is not in runner commit $RUNNER_SHA"
    got=$(blob "$f"); [ "$want" = "$got" ] || refuse "$n is $got, not runner commit $RUNNER_SHA's $want"
  done; }
# snapcheck : the snapshot is EXACTLY recovery/v200/bin at RUNNER_SHA -- every entry (find, so no name can hide), every blob,
# nothing extra, no link -- and every entry and the snapshot root are immutable (review S4). Prints the file count.
snapcheck(){ local want got p
  want=$( { printf 'd recovery\nd recovery/v200\nd recovery/v200/bin\n'; pg ls-tree -r "$RUNNER_SHA" recovery/v200/bin/ | awk -F'\t' '{split($1,a," "); print (a[2]=="blob" ? "f "$2" "a[3] : "x "$2)}'; } | sort)
  got=$(cd "$SNAPROOT" && find . -mindepth 1 -printf '%y %P\n' | while IFS=' ' read -r t p; do if [ "$t" = f ]; then echo "f $p $(blob "$p")"; else echo "$t $p"; fi; done | sort)
  [ "$want" = "$got" ] || { diff <(echo "$want") <(echo "$got") | head -20; refuse "the snapshot $SNAPROOT is not exactly recovery/v200/bin at $RUNNER_SHA"; }
  for p in "$SNAPROOT" $(cd "$SNAPROOT" && find . -mindepth 1 -printf "$SNAPROOT/%P\n"); do frozen "$p" || refuse "$p in the snapshot is not immutable (chattr +i)"; done
  echo "$want" | grep -c '^f '; }
# backedup : RUNNER_SHA is on origin's claude/v200-fixes-wip as it is NOW; a failed read or fetch refuses (review S2). Prints the tip.
backedup(){ local tip
  tip=$(pg ls-remote origin refs/heads/claude/v200-fixes-wip 2>/dev/null | awk '{print $1}')
  [[ "$tip" =~ ^[0-9a-f]{40}$ ]] || refuse "could not read origin's claude/v200-fixes-wip (ls-remote failed), so the runner commit's backup cannot be checked"
  pg cat-file -e "$tip^{commit}" 2>/dev/null || pg fetch -q origin refs/heads/claude/v200-fixes-wip 2>/dev/null || refuse "could not fetch origin's claude/v200-fixes-wip ($tip)"
  pg merge-base --is-ancestor "$RUNNER_SHA" "$tip" 2>/dev/null || refuse "$RUNNER_SHA is not on origin's claude/v200-fixes-wip (now $tip): not a backed-up commit"
  echo "$tip"; }
# ---- runner preamble v5 end ----
RUNNER_SHA=${1:-}; C=${2:-}; O=${3:-}; D=${4:-}; PIN=${5:-}; MAN=${6:-}
[[ "$RUNNER_SHA" =~ ^[0-9a-f]{40}$ ]] || refuse "<runner-sha> must be a full 40-hex commit, got '$RUNNER_SHA'"
B=$(cd "$(dirname "$0")" && pwd -P); SNAPROOT=$(cd "$B/../../.." && pwd -P); SNAP=$B; export RUNNER_SHA SNAP SNAPROOT
OD=$(cd "$O" 2>/dev/null && pwd -P) || refuse "the outdir '$O' does not exist (the bootstrap makes it, with the snapshot in <outdir>/runner)"
[ "$SNAPROOT" = "$OD/runner" ] || refuse "this script is not in the snapshot <outdir>/runner (it is under $SNAPROOT)"
[ -z "$(find "$OD" -mindepth 1 -maxdepth 1 ! -name runner -print -quit)" ] || refuse "the outdir $OD already holds results; the queue runs once, into a new outdir"
TIP=$(backedup) || { echo "$TIP"; exit 2; }
NF=$(snapcheck) || { echo "$NF"; exit 2; }
vh "$0"
O=$OD; export RUNNER_PIDS="$O/pids.txt" RUNNER_REFUSALS="$O/REFUSALS.txt"
mkdir -p "$O/import" "$O/suites" "$O/sens"
et() { TZ=America/New_York date '+%I:%M:%S %p ET'; }
stop() { echo "STOPPED $(et): $1" | tee -a "$O/summary.txt"; exit "${2:-2}"; }
chk() { [ ! -s "$RUNNER_REFUSALS" ] || stop "a helper was refused: $(tail -1 "$RUNNER_REFUSALS")"; }
{ echo "runner $RUNNER_SHA (on origin's claude/v200-fixes-wip, now $TIP) snapshot $SNAPROOT verified $(et): $NF files, nothing else, every blob equal, every entry immutable"
  echo "invocation: $0 $*"; echo "pid $$, cwd $PWD; environment fixed by the runner preamble (env -i, bash -p)"; } >> "$O/summary.txt"
pg ls-tree -r "$RUNNER_SHA" recovery/v200/bin/ > "$O/suites/runner-blobs.txt"
H=$(git -C "$C" rev-parse --verify -q HEAD 2>/dev/null); P=$(git -C "$C" rev-parse --verify -q "$PIN^{commit}" 2>/dev/null)
[[ "$H" =~ ^[0-9a-f]{40}$ ]] && [ "$H" = "$P" ] && [ -z "$(git -C "$C" status --porcelain --untracked-files=no 2>&1)" ] || refuse "clone HEAD '$H' is not the pinned '$PIN' (or the clone is missing, or it has tracked changes)"
AFF="$(dirname "$MAN")/affected.txt"; vh "$B/mkmanifest.py" "$B/mcread.py"
if [ -f "$AFF" ]; then python3 -I "$B/mkmanifest.py" "$C/tools/export-audit/mutate.mjs" "$C/prioritization-board-grid.html" "$AFF" > "$O/manifest.check.tsv"
else python3 -I "$B/mkmanifest.py" "$C/tools/export-audit/mutate.mjs" "$C/prioritization-board-grid.html" > "$O/manifest.check.tsv"; fi || stop "mkmanifest.py failed"
cmp -s "$MAN" "$O/manifest.check.tsv" || refuse "$MAN is not the manifest of this clone (see $O/manifest.check.tsv)"
cp "$MAN" "$O/suites/manifest.tsv"
echo "start $(et) pinned tree $H ($(git -C "$C" rev-parse HEAD^{tree}))" >> "$O/summary.txt"
git -C "$C" ls-tree -r HEAD prioritization-board-grid.html tools package.json > "$O/blobs.txt"; cp "$O/blobs.txt" "$O/suites/blobs.txt"
gate() { vh "$B/gate.sh"; "$B/gate.sh" "$@"; }
runs() { local lg=$1 cap=$2; shift 2; vh "$B/run.sh"; (cd "$C" && "$B/run.sh" "$lg" "$cap" "$@" > /dev/null) || refuse "run.sh did not record $(basename "$lg")"; }
bk() { local x; vh "$B/backup-run.sh"; "$B/backup-run.sh" "$@"; x=$?; chk; [ $x = 0 ] || echo "backup FAILED (backup-run.sh exit $x) $(et): $3; the logs stay in $1" >> "$O/summary.txt"; }
# 0. npm run check, first and mandatory
runs "$O/suites/check.log" 600 X=1 -- npm run check --silent
G=$(gate "$O/suites/check.log" "$H" 'all checks passed'); chk; echo "check | $G" >> "$O/suites/summary.txt"
if [ "${G%% *}" != ACCEPT ]; then echo "STOPPED $(et): npm run check did not pass at the pinned tree ($G); nothing else runs until its failures are resolved" >> "$O/summary.txt"
  bk "$O/suites" "$D/suites" "final tree: npm run check failed, queue stopped"; exit 5; fi
# 1. baseline
vh "$B/alone-run.sh"; "$B/alone-run.sh" "$C" "$O/import" "$D/import" "final tree audit-import baseline" BASELINE; AX=$?; chk
[ $AX = 0 ] || stop "the audit-import baseline did not complete alone (alone-run exit $AX: 3 = a refused helper or run, 4 = three overlapped attempts)" 4
GI=$(gate "$O/import/BASELINE.log" "$H" 'ALL CHECKS PASSED'); chk; echo "baseline audit-import: $GI" >> "$O/summary.txt"
v() { local g; g=$(gate "$O/suites/$1.log" "$H" "$2"); echo "$1 | $(grep -a -E '^# exit' "$O/suites/$1.log") | $g" >> "$O/suites/summary.txt"; }
L1=("audit-board::ALL CHECKS PASSED" "audit-hostile::ALL CHECKS PASSED" "audit-ppt::ALL CHECKS PASSED" "legacy-fsrc::  every legacy Force setting computes exactly as before" "boot-same::every page, source, save and error list is identical either way")
L2=("audit-recon::ALL CHECKS PASSED" "audit-inject::ALL CHECKS PASSED" "audit-other::ALL CHECKS PASSED" "audit::ALL CHECKS PASSED" "audit-ui::ALL CHECKS PASSED")
( for e in "${L1[@]}"; do s=${e%%::*}; runs "$O/suites/$s.log" 600 X=1 -- node tools/export-audit/$s.mjs; v "$s" "${e#*::}"; done ) &
( for e in "${L2[@]}"; do s=${e%%::*}; runs "$O/suites/$s.log" 600 X=1 -- node tools/export-audit/$s.mjs; v "$s" "${e#*::}"; done ) &
wait; chk
runs "$O/suites/verify-grid.log" 600 X=1 -- npm run verify:grid --silent
G=$(gate "$O/suites/verify-grid.log" "$H" --exit-only); chk; echo "verify:grid | $G" >> "$O/suites/summary.txt"
runs "$O/suites/standards.log" 600 X=1 -- npm run standards --silent
G=$(gate "$O/suites/standards.log" "$H" 'These are DEBT, not a pass\. They are printed every run until they are closed\.' 'CONFORMANCE HOLDS AGAINST THE BASELINE — [0-9]+ known finding\(s\), [0-9]+ instance\(s\), nothing new'); chk; echo "standards | $G" >> "$O/suites/summary.txt"
vh "$B/mcount.py" "$B/mcread.py"; python3 -I "$B/mcount.py" "$C/tools/export-audit/mutate.mjs" "$C/prioritization-board-grid.html" > "$O/suites/applicability.json" || stop "mcount.py failed"
sed 's/^/baseline: /' "$O/suites/summary.txt" >> "$O/summary.txt"; bk "$O/suites" "$D/suites" "final tree baseline"
passed() { local G; if [ "$1" = audit-import ]; then G=$(gate "$O/import/BASELINE.log" "$H" 'ALL CHECKS PASSED'); else G=$(gate "$O/suites/$1.log" "$H" 'ALL CHECKS PASSED'); fi; chk; [ "${G%% *}" = ACCEPT ]; }
# 2. sensitivity, by category then suite; only through the gate
for cat in new affected reimpl; do
  for s in audit-import audit-recon audit-board audit-ui; do
    IDS=$(awk -F'\t' -v c=$cat -v s=$s 'NR>1 && $4==c && $3==s && $5=="yes"{print $1}' "$MAN" | tr '\n' ' ')
    [ -z "$IDS" ] && continue
    if ! passed $s; then for id in $IDS; do echo "$cat | $s | $id | INCOMPLETE: $s's unmutated baseline was not accepted by gate.sh at this tree; not run" >> "$O/summary.txt"; done; continue; fi
    echo "sensitivity $cat $s ($(echo $IDS | wc -w)) start $(et)" >> "$O/summary.txt"
    if [ $s = audit-import ]; then
      vh "$B/alone-run.sh"; "$B/alone-run.sh" "$C" "$O/sens/$cat-import" "$D/sens-$cat-import" "final tree $cat audit-import sensitivity" $IDS; AX=$?; chk
      [ $AX = 0 ] || echo "$cat audit-import sensitivity stopped (alone-run exit $AX: 3 = a refused helper or run, 4 = three overlapped attempts) $(et)" >> "$O/summary.txt"
    else
      vh "$B/sens.sh"; "$B/sens.sh" "$C" "$O/sens/$cat-${s#audit-}" "$s.mjs" $IDS > /dev/null; SX=$?; chk; [ $SX = 0 ] || stop "sens.sh exited $SX ($cat $s)"
      bk "$O/sens/$cat-${s#audit-}" "$D/sens-$cat-${s#audit-}" "final tree $cat $s sensitivity"
    fi
  done
done
awk -F'\t' 'NR>1 && $5!="yes"{print "NOT APPLICABLE at this tree: "$1" ("$2", "$3")"}' "$MAN" >> "$O/summary.txt"
echo "held, not run: $(awk -F'\t' 'NR>1 && $4=="held"' "$MAN" | wc -l) pre-reset v2.00 mutations; the informational lane" >> "$O/summary.txt"
echo "DONE $(et)" >> "$O/summary.txt"; cp "$O/summary.txt" "$O/suites/summary-all.txt"; bk "$O/suites" "$D/suites" "final tree summary"
