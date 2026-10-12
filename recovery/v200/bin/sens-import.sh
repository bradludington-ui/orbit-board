#!/bin/bash -p
# sens-import.sh <copy-root> <outdir> <id>... : committed-suite sensitivity in audit-import, ONE RUN AT A TIME (Brad: audit-import
# alone, 900 s + 20 s grace; a timeout is incomplete). Mutants made from the copy's own mutate.mjs as text (applies once or
# skipped). Between runs it waits while <outdir>/PAUSE exists, so no other suite of the lead's runs alongside an audit-import.
# <copy-root> must be a git clone at the commit: the v1.86 block reads an old board with `git show 68b02e9:…`. The id
# BASELINE runs the unmutated board first.
# Runner correction 2: the shared preamble; every python call is python3 -I and reads the log path from argv, so nothing is
# imported from the launch directory (review M1); a refused run.sh stops it (exit 2); grep -a.
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
C=$1; O=$2; shift 2; B=$(cd "$(dirname "$0")" && pwd -P); mkdir -p "$O"
vh "$0" "$B/run.sh" "$B/mkmut.py" "$B/mcread.py"
for id in "$@"; do
  while [ -e "$O/PAUSE" ]; do sleep 5; done; touch "$O/RUNNING"
  if [ "$id" = BASELINE ]; then
    vh "$B/run.sh"; (cd "$C" && "$B/run.sh" "$O/BASELINE.log" 900 grace=20 X=1 -- node tools/export-audit/audit-import.mjs > /dev/null) || { rm -f "$O/RUNNING"; refuse "run.sh did not record BASELINE"; }
    echo "BASELINE (unmutated) | audit-import | $(grep -a -E '^# exit' "$O/BASELINE.log") | $(grep -a -m1 -o -E '[0-9]+ FAILING CHECK\(S\)|ALL CHECKS PASSED' "$O/BASELINE.log")" | tee -a "$O/summary.txt"
    rm -f "$O/RUNNING"; continue; fi
  M="$O/mut-$id.html"
  vh "$B/mkmut.py" "$B/mcread.py"; if ! python3 -I "$B/mkmut.py" "$C/tools/export-audit/mutate.mjs" "$C/prioritization-board-grid.html" "$id" "$M" > "$O/mut-$id.json"; then
    echo "$id NOT APPLICABLE" | tee -a "$O/summary.txt"; rm -f "$O/RUNNING"; continue; fi
  diff "$C/prioritization-board-grid.html" "$M" > "$O/mut-$id.diff"
  FF=; [ "${FIRSTFAIL:-}" = 1 ] && FF="MUT_FIRST_FAIL=1"   # first-catch mode (pre-reset chain fallback only): the suite stops at its first failed check
  vh "$B/run.sh"; (cd "$C" && "$B/run.sh" "$O/$id.log" 900 grace=20 BOARD="$M" $FF -- node tools/export-audit/audit-import.mjs > /dev/null) || { rm -f "$O/RUNNING"; refuse "run.sh did not record $id"; }
  X=$(grep -a -E '^# exit' "$O/$id.log"); V=$(grep -a -m1 -o -E '[0-9]+ FAILING CHECK\(S\)|ALL CHECKS PASSED' "$O/$id.log"); T=$(grep -a -c '^# TIMED OUT' "$O/$id.log")
  SC=$(python3 -I -c 'import re,collections,sys;t=open(sys.argv[1],encoding="utf-8",errors="replace").read();print(dict(collections.Counter(re.findall(r"^--- (.+?) \| ",t,re.M))))' "$O/$id.log")
  echo "$id | applies once | audit-import | $X | ${V:-no verdict line}$([ "$T" -gt 0 ] && echo ' | TIMED OUT = incomplete') | blob $(blob "$M") | scenarios $SC" | tee -a "$O/summary.txt"
  rm -f "$O/RUNNING"
done
echo DONE >> "$O/summary.txt"
