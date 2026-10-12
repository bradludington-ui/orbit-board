#!/bin/bash -p
# alone-run.sh <clone> <outdir> <dest-under-recovery/v200/evidence> <label> <id>... : full audit-import runs ONE AT A TIME and
# ALONE (BASELINE = unmutated; any other id = that mutation, made from the clone's own mutate.mjs as TEXT by sens-import.sh).
# The same rules as alone-u2b.sh: before each attempt the lock is cleared and the driver waits for 30 s in a row with no
# node/Chromium process outside the clone; then the lock is set and the run starts with the record-only overlap watcher. An
# attempt with anything seen alongside is kept as <id>-OVERLAPPED-<n>.log (with its .exit) and repeated (at most 3 attempts;
# then it stops with exit 4). Every finished attempt is backed up at once. The lock is cleared when it ends. 900 s + 20 s.
# Helpers come from this script's OWN directory (the frozen snapshot), never from a fixed path (runner correction).
# Runner correction 2: the shared preamble; sens-import.sh's exit status is checked, so a refused helper or run stops this
# script (exit 3) instead of passing silently (review S5); backup-run.sh is checked immediately before each call, and a
# failed push is recorded; RUNNER_LOCK may name a scratch lock (the self-test's; the queue never sets it, review S8); the lock
# is cleared on any exit once this script has set it. Runner correction 2b (review of 0c189f0, S10): the wait for 30 quiet
# seconds is bounded at one hour per attempt and recorded; past that it stops with exit 5.
# ---- runner preamble v5 begin: byte-identical in every runner shell script (runner-selftest case A18 checks it) ----
# Runner correction 2 (after the independent review of 40f7979, S1): a FIXED environment, whatever this was launched with.
# bash -p ignores BASH_ENV, ENV, SHELLOPTS, BASHOPTS and inherited functions. The first pass re-executes this script under
# env -i (same PID), keeping only the runner's own variables and the network proxy; every other value is set here. The
# second pass then REFUSES if anything else is in its environment, so presetting the marker cannot skip the clean-up
# (runner correction 2b, after the review of 0c189f0, S1).
[[ $- == *p* ]] || { echo "REFUSED: $(basename "$0") must run as its own program (#!/bin/bash -p), not through another shell"; exit 2; }
if [ "${RUNNER_ENV_CLEAN:-}" != "$$" ]; then
  _k=(); for _v in RUNNER_SHA SNAP SNAPROOT RUNNER_PIDS RUNNER_REFUSALS RUNNER_LOCK FIRSTFAIL; do [[ -v $_v ]] && _k+=("$_v=${!_v}"); done
  _p=${RUNNER_NET_PROXY:-${HTTPS_PROXY:-${https_proxy:-}}}; _n=${RUNNER_NET_NOPROXY:-${NO_PROXY:-${no_proxy:-}}}
  exec /usr/bin/env -i RUNNER_ENV_CLEAN=$$ RUNNER_NET_PROXY="$_p" RUNNER_NET_NOPROXY="$_n" "${_k[@]}" /bin/bash -p "$0" "$@"
fi
_x=$(/usr/bin/env -0 | /usr/bin/tr '\0\n' '\n ' | /usr/bin/sed -n 's/=.*//p' | /usr/bin/grep -v -x -E 'RUNNER_ENV_CLEAN|RUNNER_NET_PROXY|RUNNER_NET_NOPROXY|RUNNER_SHA|SNAP|SNAPROOT|RUNNER_PIDS|RUNNER_REFUSALS|RUNNER_LOCK|FIRSTFAIL|PWD|OLDPWD|SHLVL|_' | /usr/bin/tr '\n' ' ')
[ -z "$_x" ] || { echo "REFUSED: $(basename "$0") was started with an environment it did not clean (unexpected: $_x)"; exit 2; }
export PATH=/opt/node22/bin:/usr/local/bin:/usr/bin:/bin HOME=/root LANG=C.UTF-8 GIT_TERMINAL_PROMPT=0 GIT_NO_REPLACE_OBJECTS=1 \
  HTTPS_PROXY="$RUNNER_NET_PROXY" https_proxy="$RUNNER_NET_PROXY" NO_PROXY="$RUNNER_NET_NOPROXY" no_proxy="$RUNNER_NET_NOPROXY" \
  GIT_SSL_CAINFO=/root/.ccr/ca-bundle.crt NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt NODE_OPTIONS=--max-old-space-size=8192 \
  NODE_PATH=/usr/local/lib/node_modules_global PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
  NPM_CONFIG_UPDATE_NOTIFIER=false PYTHONDONTWRITEBYTECODE=1
umask 022; set +m; unset _k _v _p _n _x
REPO=/home/user/orbit-board
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
# backedup : RUNNER_SHA is on origin's claude/v200-fixes-wip as it is NOW; a failed read or fetch refuses (review S2). Prints the tip.
backedup(){ local tip
  tip=$(pg ls-remote origin refs/heads/claude/v200-fixes-wip 2>/dev/null | awk '{print $1}')
  [[ "$tip" =~ ^[0-9a-f]{40}$ ]] || refuse "could not read origin's claude/v200-fixes-wip (ls-remote failed), so the runner commit's backup cannot be checked"
  pg cat-file -e "$tip^{commit}" 2>/dev/null || pg fetch -q origin refs/heads/claude/v200-fixes-wip 2>/dev/null || refuse "could not fetch origin's claude/v200-fixes-wip ($tip)"
  pg merge-base --is-ancestor "$RUNNER_SHA" "$tip" 2>/dev/null || refuse "$RUNNER_SHA is not on origin's claude/v200-fixes-wip (now $tip): not a backed-up commit"
  echo "$tip"; }
# ---- runner preamble v5 end ----
B=$(cd "$(dirname "$0")" && pwd -P); SP=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad
LOCK=${RUNNER_LOCK:-$SP/AUDIT_IMPORT_RUNNING}; HAVE_LOCK=0; trap '[ $HAVE_LOCK = 1 ] && rm -f "$LOCK"' EXIT
vh "$0" "$B/overlap-watch.sh" "$B/sens-import.sh" "$B/backup-run.sh"   # before anything else, the lock included
C=$1; O=$2; D=$3; LBL=$4; shift 4; mkdir -p "$O"
et() { TZ=America/New_York date '+%I:%M:%S %p ET'; }
foreign() { local CC=$(readlink -f "$C") p cwd; for p in $(pgrep -x node; pgrep -f '^/opt/pw-browsers'; pgrep -x chrome; pgrep -x chromium); do
    cwd=$(readlink -f /proc/$p/cwd 2>/dev/null) || continue; [ "$cwd" = "$CC" ] && continue; case "$cwd" in "$CC"/*) continue;; esac; echo $p; done; }
quiet() { local n=0 t0=$SECONDS; while [ $n -lt 30 ]; do if [ -n "$(foreign)" ]; then n=0; else n=$((n+1)); fi; sleep 1
    [ $((SECONDS-t0)) -lt 3600 ] || { echo "never 30 quiet seconds within an hour (from $(et)); stopped" | tee -a "$O/summary.txt"; exit 5; }; done; }
bk() { local x; vh "$B/backup-run.sh"; "$B/backup-run.sh" "$O" "$D" "$LBL"; x=$?; [ $x = 2 ] && refuse "backup-run.sh refused (see above)"
  [ $x = 0 ] || echo "  ^ backup FAILED (backup-run.sh exit $x) at $(et); the logs stay in $O and go up with the next backup" >> "$O/summary.txt"; }
for id in "$@"; do
  ok=0
  for a in 1 2 3; do
    rm -f "$LOCK"; HAVE_LOCK=0; echo "$id attempt $a: waiting for 30 quiet seconds from $(et)"; quiet; touch "$LOCK"; HAVE_LOCK=1; echo "$id attempt $a: lock set, start $(et)"
    vh "$B/overlap-watch.sh"; "$B/overlap-watch.sh" "$O" "$C" "$id#$a" & W=$!
    vh "$B/sens-import.sh"; "$B/sens-import.sh" "$C" "$O" "$id"; SX=$?; sleep 4; kill $W 2>/dev/null; wait $W 2>/dev/null   # the watcher is this script's own child
    [ $SX = 0 ] || { echo "$id: sens-import.sh exited $SX (a refused helper or run); stopped $(et)" | tee -a "$O/summary.txt"; exit 3; }
    if grep -q "^$id#$a OVERLAP" "$O/OVERLAP.txt" 2>/dev/null; then
      for x in "" .exit; do [ -f "$O/$id.log$x" ] && mv "$O/$id.log$x" "$O/$id-OVERLAPPED-$a.log$x"; done
      echo "  ^ $id attempt $a OVERLAPPED (see OVERLAP.txt; log kept as $id-OVERLAPPED-$a.log); repeated" >> "$O/summary.txt"
      bk; continue
    fi
    bk; grep -v '^DONE' "$O/summary.txt" | tail -1 | cut -c1-240; ok=1; break
  done
  [ $ok = 1 ] || { echo "$id: three attempts all overlapped; stopping here"; exit 4; }
done
rm -f "$LOCK"; HAVE_LOCK=0; echo "lock cleared $(et)"
