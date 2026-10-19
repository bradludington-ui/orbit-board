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
# Runner correction 2b (after the review of 0c189f0): every baseline is gated on its suite's real ending, from ONE table,
# verdicts.tsv (audit-inject ends with a rule line after its banner, M1); a second-pass environment check that a preset
# marker cannot skip, and no grafts (S1); run.sh ends the recorded group before its record (S2); FIRSTFAIL and RUNNER_LOCK
# from the launch shell are cleared and said (S3); backup-run commits only its destination and a failed backup is recorded,
# not a stop (S4); a lane stops at its next suite after a refusal, and a stop or a signal is recorded and backed up (S6).
# Runner correction 2c (after the review of 60c984c): the queue's own records reach the backup (MF1, in backup-run); a stop --
# by refusal, by signal, or by a failed step -- ends both lanes and the foreground step, ends every recorded run that has no
# exit record yet (by its recorded group), writes STOPPED, and backs up suites, import and the sensitivity stage in progress
# (SF1, SF5); a refusal in this script's own shell goes through stop() too (SF2); long steps run in the background and are
# waited for, so a signal is handled at once; the queue exits 6 if any backup failed (SF4); origin is read at its fixed URL
# (SF6, in the preamble).
# Runner correction 2d (after the review of cccb714): stop() backs up ONLY once the queue has started (the pinned clone and
# manifest accepted), so a stop at the clone check -- the self-test's A6 and A21 -- never writes to orbit-board (MF1; 2c's
# self-test pushed two records commits to evidence/x, removed); a failed npm run check stops through stop() and is backed up
# (MF2); alone-run's failed backups count toward exit 6 (SF1); a stop ends runs that registered just after it began (SF2);
# check, verify:grid, standards and every backup are waited for in the background, so a signal is handled at once (SF3);
# a failed stop backup is recorded (SF6); the local branch must hold origin's tip at launch (SF5, in the preamble).
# Runner correction 2e (after the review of e42cfb6, which approved 2d): a stop signals a recorded group only if it is still
# that run's (SF-A, endruns_in in the preamble), and looks for late-registering runs after its wait, not before (SF-B).
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
# env -i (same PID), keeping only the runner's own variables and the network proxy; every other value is set here. The
# second pass then REFUSES if anything else is in its environment, so presetting the marker cannot skip the clean-up
# (runner correction 2b, after the review of 0c189f0, S1).
[[ $- == *p* ]] || { echo "REFUSED: $(basename "$0") must run as its own program (#!/bin/bash -p), not through another shell"; [ -n "${RUNNER_REFUSALS:-}" ] && echo "$(date -u +%FT%TZ) $(basename "$0"): not run as its own program" >> "$RUNNER_REFUSALS"; exit 2; }
if [ "${RUNNER_ENV_CLEAN:-}" != "$$" ]; then
  _k=(); for _v in RUNNER_SHA SNAP SNAPROOT RUNNER_PIDS RUNNER_REFUSALS RUNNER_LOCK FIRSTFAIL; do [[ -v $_v ]] && _k+=("$_v=${!_v}"); done
  _p=${RUNNER_NET_PROXY:-${HTTPS_PROXY:-${https_proxy:-}}}; _n=${RUNNER_NET_NOPROXY:-${NO_PROXY:-${no_proxy:-}}}
  exec /usr/bin/env -i RUNNER_ENV_CLEAN=$$ RUNNER_NET_PROXY="$_p" RUNNER_NET_NOPROXY="$_n" "${_k[@]}" /bin/bash -p "$0" "$@"
fi
_x=$(/usr/bin/env -0 | /usr/bin/tr '\0\n' '\n ' | /usr/bin/sed -n 's/=.*//p' | /usr/bin/grep -v -x -E 'RUNNER_ENV_CLEAN|RUNNER_NET_PROXY|RUNNER_NET_NOPROXY|RUNNER_SHA|SNAP|SNAPROOT|RUNNER_PIDS|RUNNER_REFUSALS|RUNNER_LOCK|FIRSTFAIL|PWD|OLDPWD|SHLVL|_' | /usr/bin/tr '\n' ' ')
[ -z "$_x" ] || { echo "REFUSED: $(basename "$0") was started with an environment it did not clean (unexpected: $_x)"; [ -n "${RUNNER_REFUSALS:-}" ] && echo "$(date -u +%FT%TZ) $(basename "$0"): an environment it did not clean ($_x)" >> "$RUNNER_REFUSALS"; exit 2; }
export PATH=/opt/node22/bin:/usr/local/bin:/usr/bin:/bin HOME=/root LANG=C.UTF-8 GIT_TERMINAL_PROMPT=0 GIT_NO_REPLACE_OBJECTS=1 \
  HTTPS_PROXY="$RUNNER_NET_PROXY" https_proxy="$RUNNER_NET_PROXY" NO_PROXY="$RUNNER_NET_NOPROXY" no_proxy="$RUNNER_NET_NOPROXY" \
  GIT_SSL_CAINFO=/root/.ccr/ca-bundle.crt NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt NODE_OPTIONS=--max-old-space-size=8192 \
  NODE_PATH=/usr/local/lib/node_modules_global PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
  NPM_CONFIG_UPDATE_NOTIFIER=false PYTHONDONTWRITEBYTECODE=1
umask 022; set +m; unset _k _v _p _n _x
REPO=/home/user/orbit-board; ORIGIN=https://github.com/bradludington-ui/orbit-board
# A refusal prints REFUSED and, when the queue set RUNNER_REFUSALS, records it there too, so a refusal inside $( ) or in a
# background lane (which ends only that subshell) still stops the queue at its next check (review S5).
refuse(){ echo "REFUSED: $1"; [ -n "${RUNNER_REFUSALS:-}" ] && echo "$(date -u +%FT%TZ) $(basename "$0"): $1" >> "$RUNNER_REFUSALS"; exit 2; }
# provenance git: no system or global config, no replace refs, no grafts, the one repository (reviews S1)
pg(){ GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null GIT_GRAFT_FILE=/dev/null git --no-replace-objects -c advice.graftFileDeprecated=false -C "$REPO" "$@"; }
# a file's git blob id, computed directly: no git config, filter or line-ending conversion can change it (review S1)
blob(){ python3 -I -S -c 'import hashlib,sys;d=open(sys.argv[1],"rb").read();print(hashlib.sha1(b"blob %d\0"%len(d)+d).hexdigest())' "$1"; }
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
  frozen "$SNAPROOT" || refuse "$SNAPROOT in the snapshot is not immutable (chattr +i)"
  while IFS= read -r -d '' p; do frozen "$p" || refuse "$p in the snapshot is not immutable (chattr +i)"; done < <(find "$SNAPROOT" -mindepth 1 -print0)
  echo "$want" | grep -c '^f '; }
# backedup : RUNNER_SHA is on origin's claude/v200-fixes-wip as it is NOW; a failed read refuses (review S2). Origin is read
# at its FIXED URL from outside any repository, with no config at all, so no repo-local insteadOf or remote URL can redirect it
# (runner correction 2c, review of 60c984c, SF6). It never fetches: if the tip is not in the local repository it refuses and
# says to fetch. Ancestry is then read from the local objects (content-addressed; no replace refs, no grafts). Runner correction
# 2d (review of cccb714, SF5): the local branch must already hold origin's tip, or every backup push would be refused. Prints the tip.
backedup(){ local tip
  [ ! -e /.git ] || refuse "/.git exists, so the fixed-URL read would not be outside every repository"
  tip=$(GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null git -C / ls-remote "$ORIGIN" refs/heads/claude/v200-fixes-wip 2>/dev/null | awk '{print $1}')
  [[ "$tip" =~ ^[0-9a-f]{40}$ ]] || refuse "could not read origin's claude/v200-fixes-wip at $ORIGIN (ls-remote failed), so the runner commit's backup cannot be checked"
  pg cat-file -e "$tip^{commit}" 2>/dev/null || refuse "origin's claude/v200-fixes-wip is at $tip, which $REPO does not have yet: bring its claude/v200-fixes-wip up to date (git -C $REPO pull --ff-only origin claude/v200-fixes-wip) and launch again"
  pg merge-base --is-ancestor "$RUNNER_SHA" "$tip" 2>/dev/null || refuse "$RUNNER_SHA is not on origin's claude/v200-fixes-wip (now $tip): not a backed-up commit"
  pg merge-base --is-ancestor "$tip" refs/heads/claude/v200-fixes-wip 2>/dev/null || refuse "$REPO's claude/v200-fixes-wip does not hold origin's tip $tip, so every backup push would be refused: bring it up to date (git -C $REPO pull --ff-only origin claude/v200-fixes-wip) and launch again"
  echo "$tip"; }
# endruns_in <dir|""> : TERM the recorded process group of every run (under <dir>, or any) whose log has no exit record yet --
# but ONLY if that group's leader still carries the run's own RUNNER_RUNLOG in its environment, so a PID reused by another
# process, or the stale record of a renamed attempt, is never signalled (runner correction 2e, review of e42cfb6, SF-A).
endruns_in(){ local p t l; [ -f "${RUNNER_PIDS:-}" ] || return 0
  while read -r p t l; do [ -n "$l" ] || continue; [ -z "$1" ] || case "$l" in "$1"/*) ;; *) continue;; esac; [ -f "$l.exit" ] && continue
    [[ "$p" =~ ^[0-9]+$ ]] && tr '\0' '\n' 2>/dev/null < "/proc/$p/environ" | grep -qxF "RUNNER_RUNLOG=$l" && kill -TERM -- "-$p" 2>/dev/null
  done < "$RUNNER_PIDS"; }
# ---- runner preamble v5 end ----
RUNNER_SHA=${1:-}; C=${2:-}; O=${3:-}; D=${4:-}; PIN=${5:-}; MAN=${6:-}
CLEARED=; for _v in FIRSTFAIL RUNNER_LOCK; do [[ -v $_v ]] && CLEARED="$CLEARED $_v=${!_v}"; unset $_v; done   # the queue uses neither (S3)
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
LANES=; FG=; CURBK=; BKF=; STARTED=
endruns() { endruns_in ""; }   # every recorded run with no exit record yet, verified as still that run (preamble)
stop() { local e x n p; trap '' TERM INT HUP; echo "STOPPED $(et): $1" | tee -a "$O/summary.txt"; touch "$O/STOP"
  kill $LANES $FG 2>/dev/null; endruns
  for n in 1 2 3 4 5 6 7 8 9 10; do sleep 1; endruns; x=0; for p in $LANES $FG; do kill -0 "$p" 2>/dev/null && x=1; done; [ $x = 0 ] && break; done
  for n in 1 2 3; do sleep 1; endruns; done   # a run that registered after the stop began is ended too
  cp "$O/summary.txt" "$O/suites/summary-all.txt" 2>/dev/null; [ -f "$RUNNER_REFUSALS" ] && cp "$RUNNER_REFUSALS" "$O/suites/REFUSALS.txt"
  if [ -z "$STARTED" ]; then echo "(stopped before the queue started: nothing backed up, orbit-board untouched)" >> "$O/summary.txt"
  elif ( vh "$B/backup-run.sh" ) > /dev/null 2>&1; then for e in "$O/suites::$D/suites" "$O/import::$D/import" ${CURBK:+"$CURBK"}; do   # best effort
    [ -d "${e%%::*}" ] || continue; "$B/backup-run.sh" "${e%%::*}" "${e#*::}" "final tree STOPPED" > /dev/null 2>&1; x=$?
    [ $x = 0 ] || echo "stop backup FAILED (backup-run.sh exit $x) $(et): ${e%%::*}" | tee -a "$O/summary.txt" >&2; done
  else echo "stop backup NOT RUN: backup-run.sh was refused" | tee -a "$O/summary.txt" >&2; fi
  exit "${2:-2}"; }
trap 'stop "the queue received a signal" 3' TERM INT HUP
chk() { [ ! -s "$RUNNER_REFUSALS" ] || stop "a helper was refused: $(tail -1 "$RUNNER_REFUSALS")"; }
# from here on a refusal in this script's own shell stops through stop(); one in a subshell is recorded and caught by chk
refuse() { echo "REFUSED: $1"; echo "$(date -u +%FT%TZ) $(basename "$0"): $1" >> "$RUNNER_REFUSALS"; [ "$BASHPID" = "$$" ] && stop "refused: $1"; exit 2; }
fgw() { "$@" & FG=$!; wait $FG; local x=$?; FG=; return $x; }   # a long step, waited for, so a signal is handled at once
{ echo "runner $RUNNER_SHA (on origin's claude/v200-fixes-wip, now $TIP) snapshot $SNAPROOT verified $(et): $NF files, nothing else, every blob equal, every entry immutable"
  echo "invocation: $0 $*"; echo "pid $$, cwd $PWD; environment fixed by the runner preamble (env -i, bash -p); proxy ${RUNNER_NET_PROXY:-none}"
  [ -z "$CLEARED" ] || echo "launched with$CLEARED; cleared (the queue uses neither)"; } >> "$O/summary.txt"
pg ls-tree -r "$RUNNER_SHA" recovery/v200/bin/ > "$O/suites/runner-blobs.txt"
H=$(git -C "$C" rev-parse --verify -q HEAD 2>/dev/null); P=$(git -C "$C" rev-parse --verify -q "$PIN^{commit}" 2>/dev/null)
[[ "$H" =~ ^[0-9a-f]{40}$ ]] && [ "$H" = "$P" ] && [ -z "$(git -C "$C" status --porcelain --untracked-files=no 2>&1)" ] || refuse "clone HEAD '$H' is not the pinned '$PIN' (or the clone is missing, or it has tracked changes)"
AFF="$(dirname "$MAN")/affected.txt"; vh "$B/mkmanifest.py" "$B/mcread.py"
if [ -f "$AFF" ]; then python3 -I "$B/mkmanifest.py" "$C/tools/export-audit/mutate.mjs" "$C/prioritization-board-grid.html" "$AFF" > "$O/manifest.check.tsv"
else python3 -I "$B/mkmanifest.py" "$C/tools/export-audit/mutate.mjs" "$C/prioritization-board-grid.html" > "$O/manifest.check.tsv"; fi || stop "mkmanifest.py failed"
cmp -s "$MAN" "$O/manifest.check.tsv" || refuse "$MAN is not the manifest of this clone (see $O/manifest.check.tsv)"
cp "$MAN" "$O/suites/manifest.tsv"
echo "start $(et) pinned tree $H ($(git -C "$C" rev-parse HEAD^{tree}))" >> "$O/summary.txt"; STARTED=1
git -C "$C" ls-tree -r HEAD prioritization-board-grid.html tools package.json > "$O/blobs.txt"; cp "$O/blobs.txt" "$O/suites/blobs.txt"
gate() { vh "$B/gate.sh"; "$B/gate.sh" "$@"; }
vd() { vh "$B/verdicts.tsv"; awk -F'\t' -v s="$1" -v k="$2" '$1==s{print $k; n++} END{exit n!=1}' "$B/verdicts.tsv" || refuse "verdicts.tsv has no single row for $1"; }
gv() { local a b; a=$(vd "$2" 2) || exit 2; b=$(vd "$2" 3) || exit 2; gate "$1" "$H" "$a" ${b:+"$b"}; }   # gv <log> <suite>: the gate on that suite's own verdict
runs() { local lg=$1 cap=$2; shift 2; vh "$B/run.sh"; (cd "$C" && "$B/run.sh" "$lg" "$cap" "$@" > /dev/null) || refuse "run.sh did not record $(basename "$lg")"; }
bk() { local x; vh "$B/backup-run.sh"; fgw "$B/backup-run.sh" "$@"; x=$?; chk; [ $x = 0 ] || { BKF=1; echo "backup FAILED (backup-run.sh exit $x) $(et): $3; the logs stay in $1" >> "$O/summary.txt"; }; }
# 0. npm run check, first and mandatory
fgw runs "$O/suites/check.log" 600 X=1 -- npm run check --silent; chk
G=$(gv "$O/suites/check.log" check); chk; echo "check | $G" >> "$O/suites/summary.txt"
[ "${G%% *}" = ACCEPT ] || stop "npm run check did not pass at the pinned tree ($G); nothing else runs until its failures are resolved" 5
# 1. baseline
vh "$B/alone-run.sh"; fgw "$B/alone-run.sh" "$C" "$O/import" "$D/import" "final tree audit-import baseline" BASELINE; AX=$?; chk
[ $AX = 6 ] && { BKF=1; AX=0; }   # completed, but one of alone-run's backups failed
[ $AX = 0 ] || stop "the audit-import baseline did not complete alone (alone-run exit $AX: 3 = a refused helper or run, 4 = three overlapped attempts, 5 = never quiet within an hour)" 4
GI=$(gv "$O/import/BASELINE.log" audit-import); chk; echo "baseline audit-import: $GI" >> "$O/summary.txt"
v() { local g; g=$(gv "$O/suites/$1.log" "$1"); g=${g:-REFUSED (see REFUSALS.txt)}; echo "$1 | $(grep -a -E '^# exit' "$O/suites/$1.log") | $g" >> "$O/suites/summary.txt"; }
L1=(audit-board audit-hostile audit-ppt legacy-fsrc boot-same); L2=(audit-recon audit-inject audit-other audit audit-ui)
( for s in "${L1[@]}"; do { [ -s "$RUNNER_REFUSALS" ] || [ -e "$O/STOP" ]; } && break; runs "$O/suites/$s.log" 600 X=1 -- node tools/export-audit/$s.mjs; v "$s"; done ) &
LANES=$!
( for s in "${L2[@]}"; do { [ -s "$RUNNER_REFUSALS" ] || [ -e "$O/STOP" ]; } && break; runs "$O/suites/$s.log" 600 X=1 -- node tools/export-audit/$s.mjs; v "$s"; done ) &
LANES="$LANES $!"; wait; LANES=; chk
fgw runs "$O/suites/verify-grid.log" 600 X=1 -- npm run verify:grid --silent; chk
G=$(gv "$O/suites/verify-grid.log" verify-grid); chk; echo "verify:grid | $G" >> "$O/suites/summary.txt"
fgw runs "$O/suites/standards.log" 600 X=1 -- npm run standards --silent; chk
G=$(gv "$O/suites/standards.log" standards); chk; echo "standards | $G" >> "$O/suites/summary.txt"
vh "$B/mcount.py" "$B/mcread.py"; python3 -I "$B/mcount.py" "$C/tools/export-audit/mutate.mjs" "$C/prioritization-board-grid.html" > "$O/suites/applicability.json.txt" || stop "mcount.py failed"
sed 's/^/baseline: /' "$O/suites/summary.txt" >> "$O/summary.txt"; bk "$O/suites" "$D/suites" "final tree baseline"
passed() { local G; if [ "$1" = audit-import ]; then G=$(gv "$O/import/BASELINE.log" audit-import); else G=$(gv "$O/suites/$1.log" "$1"); fi; chk; [ "${G%% *}" = ACCEPT ]; }
# 2. sensitivity, by category then suite; only through the gate
for cat in new affected reimpl; do
  for s in audit-import audit-recon audit-board audit-ui; do
    IDS=$(awk -F'\t' -v c=$cat -v s=$s 'NR>1 && $4==c && $3==s && $5=="yes"{print $1}' "$MAN" | tr '\n' ' ')
    [ -z "$IDS" ] && continue
    if ! passed $s; then for id in $IDS; do echo "$cat | $s | $id | INCOMPLETE: $s's unmutated baseline was not accepted by gate.sh at this tree; not run" >> "$O/summary.txt"; done; continue; fi
    echo "sensitivity $cat $s ($(echo $IDS | wc -w)) start $(et)" >> "$O/summary.txt"
    if [ $s = audit-import ]; then
      CURBK="$O/sens/$cat-import::$D/sens-$cat-import"; vh "$B/alone-run.sh"; fgw "$B/alone-run.sh" "$C" "$O/sens/$cat-import" "$D/sens-$cat-import" "final tree $cat audit-import sensitivity" $IDS; AX=$?; chk; [ $AX = 6 ] && { BKF=1; AX=0; }
      [ $AX = 0 ] || echo "$cat audit-import sensitivity stopped (alone-run exit $AX: 3 = a refused helper or run, 4 = three overlapped attempts, 5 = never quiet within an hour) $(et)" >> "$O/summary.txt"
    else
      CURBK="$O/sens/$cat-${s#audit-}::$D/sens-$cat-${s#audit-}"; vh "$B/sens.sh"; fgw "$B/sens.sh" "$C" "$O/sens/$cat-${s#audit-}" "$s.mjs" $IDS > /dev/null; SX=$?; chk; [ $SX = 0 ] || stop "sens.sh exited $SX ($cat $s)"
      bk "$O/sens/$cat-${s#audit-}" "$D/sens-$cat-${s#audit-}" "final tree $cat $s sensitivity"
    fi
  done
done
awk -F'\t' 'NR>1 && $5!="yes"{print "NOT APPLICABLE at this tree: "$1" ("$2", "$3")"}' "$MAN" >> "$O/summary.txt"
echo "held, not run: $(awk -F'\t' 'NR>1 && $4=="held"' "$MAN" | wc -l) pre-reset v2.00 mutations; the informational lane" >> "$O/summary.txt"
CURBK=; echo "DONE $(et)$([ -n "$BKF" ] && echo ' -- with at least one FAILED backup (see above); exit 6')" >> "$O/summary.txt"; cp "$O/summary.txt" "$O/suites/summary-all.txt"; bk "$O/suites" "$D/suites" "final tree summary"
[ -z "$BKF" ] || exit 6
