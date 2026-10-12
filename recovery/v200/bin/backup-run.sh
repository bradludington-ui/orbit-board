#!/bin/bash -p
# backup-run.sh <srcdir> <dest-under-recovery/v200/evidence> <label> : copies every COMPLETED run log in <srcdir> -- one with
# run.sh's exit record <log>.exit -- and that record into <dest>/completed/, its mutant diff/json into <dest>/mutants/, and
# summary.txt, OVERLAP.txt and REFUSALS.txt; commits and pushes to claude/v200-fixes-wip only when something changed. A log
# without an exit record is never put in completed/. Refuses (exit 2) if orbit-board is not on claude/v200-fixes-wip or any
# product file is staged. Runner correction 2: the shared preamble; the push is retried four times and a push that still
# fails exits 3 (before, the retry loop always stopped after the first try and a failed push passed silently); the commit
# then stays local and goes up with the next push.
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
S=$1; D=$REPO/recovery/v200/evidence/${2:-}; L=$3; new=()
[ -n "${2:-}" ] && [[ "$2" != *..* ]] && [[ "$2" != /* ]] || refuse "backup-run.sh: bad destination '${2:-}'"
[ "$(git -C "$REPO" symbolic-ref -q --short HEAD)" = claude/v200-fixes-wip ] || refuse "backup-run.sh: orbit-board is not on claude/v200-fixes-wip"
mkdir -p "$D/completed" "$D/mutants"
for f in "$S"/*.log; do
  [ -f "$f" ] && [ -f "$f.exit" ] || continue; b=$(basename "$f")
  if ! cmp -s "$f" "$D/completed/$b" || ! cmp -s "$f.exit" "$D/completed/$b.exit"; then cp "$f" "$f.exit" "$D/completed/"; id=${b%.log}; cp "$S/mut-$id.diff" "$S/mut-$id.json" "$D/mutants/" 2>/dev/null || true; new+=("$id"); fi
done
for f in summary.txt OVERLAP.txt REFUSALS.txt; do [ -f "$S/$f" ] && cp "$S/$f" "$D/$f"; done
cd "$REPO" || refuse "backup-run.sh: no repository"; git add "$D"
if ! git diff --cached --quiet; then
  [ -z "$(git diff --cached --name-only -- prioritization-board-grid.html tools package.json NEXT-VERSION.md)" ] || refuse "backup-run.sh: product files staged"
  git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q -m "recovery/v200: $L, run(s) backed up: ${new[*]:-records} (no product change)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01MqCBDiYHPZfnyapxhXKxBm" || refuse "backup-run.sh: the commit failed"
  ok=0; for i in 1 2 3 4; do timeout 120 git push -q origin claude/v200-fixes-wip && { ok=1; break; }; sleep $((2**i)); done
  [ $ok = 1 ] || { echo "PUSH FAILED after four tries: $(git rev-parse --short HEAD) is committed locally only"; exit 3; }
  echo "backed up: ${new[*]:-records} at $(git rev-parse --short HEAD)"; else echo "nothing new"; fi
