#!/bin/bash -p
# gate.sh <log> <git-sha|-> <last-line-regex> [<line-before-regex>]     or     gate.sh <log> <git-sha|-> --exit-only
# The baseline acceptance gate (runner correction, Brad, 12 Oct; hardened by runner correction 2 after review S3, S6, S7).
# Prints "ACCEPT <log>" and exits 0 ONLY IF run.sh recorded the run in <log> as FINISHED and SUCCEEDED:
#  - run.sh's own exit record <log>.exit exists, holds exactly one exit, and it is 0 (the suite neither knows nor writes it);
#  - the log is byte for byte what run.sh recorded at the end (nothing was written after the exit, e.g. by an orphan);
#  - the log starts with run.sh's header, ends with run.sh's trailer, has exactly one "# end:" and one "# exit:" line, and
#    no "# TIMED OUT" line;
#  - the header names the expected commit <git-sha> ("-" skips this, for fake suites only);
#  - no "N FAILING CHECK(S)" line anywhere;
#  - the LAST non-empty line the suite printed matches <last-line-regex> as a WHOLE line (and, if given, the one before it
#    matches <line-before-regex>). A banner from a sub-step, a banner followed by more output, or "NOT ALL CHECKS PASSED"
#    is refused.
# --exit-only (verify:grid: an && chain with no single verdict line) checks everything except the verdict and prints
# "ACCEPT-EXIT-ONLY <log>". Anything else -- including a success banner followed by a nonzero exit, a timeout or an
# interruption -- prints "REFUSE <log>: <why>" and exits 1. grep -a throughout, so a NUL byte cannot hide a line (S7).
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
L=${1:-}; GS=${2:-}; V=${3:-}; V2=${4:-}
r(){ echo "REFUSE $(basename "$L"): $1"; exit 1; }
[ -n "$V" ] && [ -n "$GS" ] || r "usage: gate.sh <log> <git-sha|-> <last-line-regex|--exit-only> [<line-before-regex>]"
[ -f "$L" ] && [ ! -L "$L" ] || r "no log"
E=$L.exit; [ -f "$E" ] && [ ! -L "$E" ] || r "no exit record from run.sh (interrupted, or still running)"
[ "$(grep -ac '^exit ' "$E")" = 1 ] || r "not exactly one recorded exit"
X=$(awk '$1=="exit"{print $2}' "$E"); NB=$(awk '$1=="log_bytes"{print $2}' "$E"); LB=$(awk '$1=="log_blob"{print $2}' "$E")
[ "$X" = 0 ] || r "recorded exit $X"
[ "$(stat -c %s "$L")" = "$NB" ] && [ "$(blob "$L")" = "$LB" ] || r "the log is not what run.sh recorded at the end (written to after the exit)"
[ "$(grep -ac '^# end: ' "$L")" = 1 ] && [ "$(grep -ac '^# exit: ' "$L")" = 1 ] || r "more than one end or exit line (the suite printed a look-alike)"
! grep -aq '^# TIMED OUT' "$L" || r "timed out"
N=$(grep -ac '' "$L")
tail -n 2 "$L" | head -n 1 | grep -aq '^# end: ' && tail -n 1 "$L" | grep -aqE '^# exit: 0  duration_s: [0-9.]+$' || r "the log does not end with run.sh's trailer"
sed -n 1p "$L" | grep -aq '^# cmd: ' && sed -n 6p "$L" | grep -aq '^# cap: ' || r "the log does not start with run.sh's header"
[ "$GS" = - ] || sed -n 3p "$L" | grep -aqx "# git: $GS" || r "the header names commit '$(sed -n 3p "$L" | cut -c8-)', not $GS"
! grep -aqE '[0-9]+ FAILING CHECK' "$L" || r "a failing-check line"
if [ "$V" = --exit-only ]; then echo "ACCEPT-EXIT-ONLY $(basename "$L") (exit 0; no verdict line is checked)"; exit 0; fi
BODY=$(sed -n "7,$((N-2))p" "$L" | grep -av '^[[:space:]]*$')
printf '%s\n' "$BODY" | tail -n 1 | grep -aqxE -- "$V" || r "the last line the suite printed is not the completion verdict /$V/"
[ -z "$V2" ] || printf '%s\n' "$BODY" | tail -n 2 | head -n 1 | grep -aqxE -- "$V2" || r "the line before the verdict is not /$V2/"
echo "ACCEPT $(basename "$L")"
