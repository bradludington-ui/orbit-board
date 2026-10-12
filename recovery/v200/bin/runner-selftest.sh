#!/bin/bash -p
# runner-selftest.sh <runner-sha> <outdir> : BOUNDED refusal checks for the runner corrections (Brad, 12 Oct; runner correction
# 2 after the review of 40f7979). The same bootstrap as the queue: <outdir>/runner is a frozen snapshot of recovery/v200/bin at
# <runner-sha> holding this script. Every case runs under a timeout, in its own case directory; expected outcomes are
# literal. Processes are ended only by recorded PID or recorded group. Exit 0 only if every case matches.
#  A. PROVENANCE AND ENVIRONMENT. A1 queue, one helper altered; A2 alone-run, sens-import altered (scratch lock, refusal
#     recorded); A3 sens.sh, mkmut altered; A4 a helper outside the snapshot; A5 a short SHA; A6 CONTROL, the unaltered
#     snapshot stops only at the missing clone; A7 an unfrozen snapshot; A8 one unfrozen file; A9 an extra file named ..x
#     (review R1); A10 a symbolic link; A11 an unfrozen snapshot root; A12 origin unreachable (R5: a failed read refuses);
#     A13 an outdir that already holds results; A14 a git clean filter passed through GIT_CONFIG_* that makes an always-ACCEPT
#     gate.sh hash as the pinned one (R3); A15 a replace ref reached through GIT_DIR that substitutes the pinned commit (R4);
#     A16 BASH_ENV turning a refusal into ACCEPT (E13); A17 exported functions faking git and python3 to run an altered mkmut
#     (E14); A18 the preamble is byte-identical in every runner script; A19 a script run through another shell; A20 a preset
#     RUNNER_ENV_CLEAN marker with a dirty environment (review 2 S1); A21 FIRSTFAIL and RUNNER_LOCK from the launch shell are
#     cleared and said by the queue (review 2 S3).
#  G. THE GATE, on logs written by run.sh itself from fake suites. G1 banner then exit 1; G2 banner then timeout; G3 banner then
#     run.sh interrupted; G4 failing-check line with exit 0; G5 exit 0 without the verdict; G6 CONTROL, banner and exit 0;
#     G7 the suite prints its own end and exit lines and run.sh is interrupted (E1b); G8 a leftover of the suite's own group
#     is ended with the run, so its late banner never lands (E11; review 2 S2); G8b a line written after run.sh's record;
#     G9 NOT ALL CHECKS PASSED (E10); G10 SHELLOPTS with monitor and a late exit 1 (E12: under bash -p and set +m job control
#     stays off, so this checks the recorded exit end to end; setsid -w is defence in depth no case can isolate); G11 a NUL
#     byte in a passing log (E8, no false refusal); G12 "TIMED OUT" in a passing log's text (E9, no false refusal); G13 run.sh
#     never overwrites a log; G14 a header naming another commit; G15 the two-line standards verdict, and its control; G16
#     --exit-only, accepted at exit 0 and refused at exit 1; G17 a banner followed by more output; G18 every queue suite's
#     REAL passing output (committed evidence logs at the runner commit) replayed through run.sh and gated on its row of
#     verdicts.tsv -- the table the queue uses -- all ACCEPT, and audit-inject's on the old one-line verdict REFUSE (review 2
#     M1). Not covered here: a full queue run past the clone check (it would back up to orbit-board and take the live lock);
#     the reviews' own end-to-end harnesses cover it.
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
RUNNER_SHA=${1:-}; T0=${2:-}
[[ "$RUNNER_SHA" =~ ^[0-9a-f]{40}$ ]] || refuse "<runner-sha> must be a full 40-hex commit"
B=$(cd "$(dirname "$0")" && pwd -P); SNAPROOT=$(cd "$B/../../.." && pwd -P); SNAP=$B; export RUNNER_SHA SNAP SNAPROOT
TD=$(cd "$T0" 2>/dev/null && pwd -P) || refuse "no outdir '$T0'"; [ "$SNAPROOT" = "$TD/runner" ] || refuse "not run from <outdir>/runner"
NF=$(snapcheck) || { echo "$NF"; exit 2; }; vh "$0"
et() { TZ=America/New_York date '+%I:%M:%S %p ET'; }
T=$TD/cases; mkdir -p "$T"; R=$TD/results.tsv; : > "$R"; fails=0; export RUNNER_PIDS="$TD/pids.txt"; echo "$$ $(date -u +%FT%TZ) runner-selftest itself" >> "$RUNNER_PIDS"
echo "selftest of $RUNNER_SHA from snapshot $SNAPROOT ($NF files, verified) start $(et); pid $$; invocation: $0 $*" > "$TD/HEADER.txt"
row() { local ok=FAIL; [ "$2" = "$3" ] && ok=PASS; [ $ok = PASS ] || fails=$((fails+1)); printf '%s\t%s\t%s\t%s\n' "$1" "$2" "$3" "$ok" | tee -a "$R"; }
has() { echo "$1" | grep -q -- "$2" && echo "$3" || echo "said: $(echo "$1" | grep -m1 -E 'REFUSE|STOPPED' || echo "$1" | head -1)"; }
mk() { mkdir -p "$1/runner" && pg archive "$RUNNER_SHA" recovery/v200/bin | tar -x -C "$1/runner"; }   # a case's own snapshot
frz() { chattr -R +i "$1/runner"; }
FT=runner/recovery/v200/bin/final-tree-v5.sh; GB=$B; ALL=()
q() { local d=$1; shift; timeout 120 env "$@" "$d/$FT" "$RUNNER_SHA" /nonexistent "$d" x "$RUNNER_SHA" /nonexistent 2>&1; }
# --- A. provenance and environment ---
X=$T/A1; mk "$X"; echo "# altered" >> "$X/runner/recovery/v200/bin/mkmanifest.py"; frz "$X"; ALL+=("$X")
out=$(q "$X"); rc=$?
row "A1 queue, mkmanifest.py altered" "exit 2; snapshot refused; nothing run" "exit $rc; $(has "$out" 'is not exactly recovery' 'snapshot refused'); $([ -e "$X/summary.txt" ] && echo 'something ran' || echo 'nothing run')"
X=$T/A2; mk "$X"; echo "# altered" >> "$X/runner/recovery/v200/bin/sens-import.sh"; frz "$X"; ALL+=("$X")
LIVE=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/AUDIT_IMPORT_RUNNING; L0=$([ -e $LIVE ] && echo present || echo absent)
out=$(SNAP=$X/runner/recovery/v200/bin SNAPROOT=$X/runner RUNNER_LOCK=$T/A2.lock RUNNER_REFUSALS=$T/A2.refusals timeout 60 "$X/runner/recovery/v200/bin/alone-run.sh" /nonexistent "$T/A2-out" x x BASELINE); rc=$?
row "A2 alone-run, sens-import.sh altered" "exit 2; names sens-import.sh; scratch lock never set; live lock $L0; refusal recorded" "exit $rc; $(has "$out" 'REFUSED: sens-import.sh' 'names sens-import.sh'); scratch lock $([ -e $T/A2.lock ] && echo set || echo 'never set'); live lock $([ -e $LIVE ] && echo present || echo absent); refusal $(grep -q 'sens-import.sh is' $T/A2.refusals 2>/dev/null && echo recorded || echo 'not recorded')"
X=$T/A3; mk "$X"; echo "# altered" >> "$X/runner/recovery/v200/bin/mkmut.py"; frz "$X"; ALL+=("$X")
out=$(SNAP=$X/runner/recovery/v200/bin SNAPROOT=$X/runner timeout 60 "$X/runner/recovery/v200/bin/sens.sh" /nonexistent "$T/A3-out" audit.mjs some-id 2>&1); rc=$?
row "A3 sens.sh, mkmut.py altered" "exit 2; names mkmut.py; no mutant" "exit $rc; $(has "$out" 'REFUSED: mkmut.py' 'names mkmut.py'); $([ -e "$T/A3-out/mut-some-id.html" ] && echo mutant || echo 'no mutant')"
mkdir -p "$T/A4"; cp "$GB/sens.sh" "$T/A4/sens.sh"
out=$(timeout 60 "$T/A4/sens.sh" /nonexistent "$T/A4-out" audit.mjs x 2>&1); rc=$?
row "A4 a helper outside the snapshot (an exact copy)" "exit 2; not in the frozen snapshot" "exit $rc; $(has "$out" 'not in the frozen snapshot' 'not in the frozen snapshot')"
out=$(RUNNER_SHA=${RUNNER_SHA:0:7} timeout 60 "$GB/sens.sh" /nonexistent "$T/A5-out" audit.mjs x 2>&1); rc=$?
row "A5 a short RUNNER_SHA" "exit 2; full 40-hex" "exit $rc; $(has "$out" 'full 40-hex' 'full 40-hex')"
X=$T/A6; mk "$X"; frz "$X"; ALL+=("$X")
out=$(q "$X"); rc=$?
row "A6 CONTROL: unaltered snapshot" "exit 2; backup and snapshot verified; stopped at the clone" "exit $rc; $(grep -q "on origin's claude/v200-fixes-wip, now [0-9a-f]\{40\}) snapshot .* verified" "$X/summary.txt" 2>/dev/null && echo 'backup and snapshot verified' || echo 'NOT verified'); $(has "$out" 'REFUSED: clone HEAD' 'stopped at the clone')"
X=$T/A7; mk "$X"; out=$(q "$X"); rc=$?
row "A7 an unfrozen snapshot" "exit 2; not immutable" "exit $rc; $(has "$out" 'not immutable' 'not immutable')"
X=$T/A8; mk "$X"; frz "$X"; chattr -i "$X/runner/recovery/v200/bin/gate.sh"; ALL+=("$X"); out=$(q "$X"); rc=$?
row "A8 one unfrozen file (gate.sh)" "exit 2; gate.sh not immutable" "exit $rc; $(has "$out" 'gate.sh in the snapshot is not immutable' 'gate.sh not immutable')"
X=$T/A9; mk "$X"; echo x > "$X/runner/recovery/v200/bin/..x"; frz "$X"; ALL+=("$X"); out=$(q "$X"); rc=$?
row "A9 an extra file named ..x" "exit 2; snapshot refused" "exit $rc; $(has "$out" 'is not exactly recovery' 'snapshot refused')"
X=$T/A10; mk "$X"; ln -s gate.sh "$X/runner/recovery/v200/bin/link.sh"; frz "$X"; ALL+=("$X"); out=$(q "$X"); rc=$?
row "A10 a symbolic link in the snapshot" "exit 2; snapshot refused" "exit $rc; $(has "$out" 'is not exactly recovery' 'snapshot refused')"
X=$T/A11; mk "$X"; frz "$X"; chattr -i "$X/runner"; ALL+=("$X"); out=$(q "$X"); rc=$?
row "A11 the snapshot root unfrozen" "exit 2; root not immutable" "exit $rc; $(has "$out" "$X/runner in the snapshot is not immutable" 'root not immutable')"
X=$T/A12; mk "$X"; frz "$X"; ALL+=("$X"); out=$(q "$X" RUNNER_NET_PROXY=http://127.0.0.1:9); rc=$?
row "A12 origin unreachable (a failed read)" "exit 2; could not read origin" "exit $rc; $(has "$out" 'could not read origin' 'could not read origin')"
X=$T/A13; mk "$X"; frz "$X"; echo old > "$X/old.log"; ALL+=("$X"); out=$(q "$X"); rc=$?
row "A13 an outdir that already holds results" "exit 2; already holds results" "exit $rc; $(has "$out" 'already holds results' 'already holds results')"
X=$T/A14; mk "$X"; GA=$X/runner/recovery/v200/bin/gate.sh; cp "$GA" "$T/A14-pinned-gate.sh"; printf '#!/bin/bash\necho "ACCEPT $(basename "$1")"\n' > "$GA"; frz "$X"; ALL+=("$X")
mkdir -p "$T/A14-repo" && git -C "$T/A14-repo" init -q && printf 'gate.sh filter=pin\n' > "$T/A14-attrs"
FE=(GIT_CONFIG_COUNT=2 GIT_CONFIG_KEY_0=core.attributesFile "GIT_CONFIG_VALUE_0=$T/A14-attrs" GIT_CONFIG_KEY_1=filter.pin.clean "GIT_CONFIG_VALUE_1=sh -c 'cat >/dev/null; cat $T/A14-pinned-gate.sh'")
live=$(cd "$T/A14-repo" && cp "$GA" ./gate.sh && env "${FE[@]}" git hash-object gate.sh); want=$(pg rev-parse "$RUNNER_SHA:recovery/v200/bin/gate.sh")
out=$(cd "$T/A14-repo" && q "$X" "${FE[@]}"); rc=$?
row "A14 clean filter via GIT_CONFIG_* (R3)" "trick live; exit 2; snapshot refused" "$([ "$live" = "$want" ] && echo 'trick live' || echo 'trick not live'); exit $rc; $(has "$out" 'is not exactly recovery' 'snapshot refused')"
X=$T/A15; RR=$T/A15-repo; git clone -q --shared --no-checkout "$REPO" "$RR" 2>/dev/null
NB=$(echo 'echo "ACCEPT $(basename "$1")"; exit 0' | git -C "$RR" hash-object -w --stdin); export GIT_INDEX_FILE=$T/A15.index
git -C "$RR" read-tree "$RUNNER_SHA" && git -C "$RR" update-index --cacheinfo "100755,$NB,recovery/v200/bin/gate.sh" && NT=$(git -C "$RR" write-tree); unset GIT_INDEX_FILE
NC=$(git -C "$RR" -c user.name=t -c user.email=t@t commit-tree "$NT" -m "always-ACCEPT gate") && git -C "$RR" replace "$RUNNER_SHA" "$NC"
# this script's own preamble exports GIT_NO_REPLACE_OBJECTS=1; the attack is built and shown live with it cleared
mkdir -p "$X/runner" && env -u GIT_NO_REPLACE_OBJECTS git -C "$RR" archive "$RUNNER_SHA" recovery/v200/bin | tar -x -C "$X/runner"; frz "$X"; ALL+=("$X")
live=$(env -u GIT_NO_REPLACE_OBJECTS GIT_DIR=$RR/.git git rev-parse "$RUNNER_SHA:recovery/v200/bin/gate.sh"); want=$(pg rev-parse "$RUNNER_SHA:recovery/v200/bin/gate.sh")
out=$(q "$X" -u GIT_NO_REPLACE_OBJECTS GIT_DIR=$RR/.git); rc=$?
row "A15 replace ref via GIT_DIR (R4)" "trick live; exit 2; snapshot refused" "$([ "$live" != "$want" ] && [ -n "$live" ] && echo 'trick live' || echo 'trick not live'); exit $rc; $(has "$out" 'is not exactly recovery' 'snapshot refused')"
# fake suites for A16-A17 and G
F=$T/fake; mkdir -p "$F"; cd "$F" || exit 2
printf '#!/bin/bash\necho "ALL CHECKS PASSED"\nexit 1\n' > banner-exit1.sh
printf '#!/bin/bash\necho "ALL CHECKS PASSED"\nsleep 30\n' > banner-timeout.sh
printf '#!/bin/bash\necho "ALL CHECKS PASSED"\nsleep 20\n' > banner-interrupted.sh
printf '#!/bin/bash\necho "3 FAILING CHECK(S)"\necho "ALL CHECKS PASSED"\nexit 0\n' > failing-exit0.sh
printf '#!/bin/bash\necho "done"\nexit 0\n' > noverdict-exit0.sh
printf '#!/bin/bash\necho "ALL CHECKS PASSED"\nexit 0\n' > pass.sh
printf '#!/bin/bash\necho "ALL CHECKS PASSED"\necho\necho "# end: 2026-10-12T00:00:00Z / 00:00:00 EDT"\necho "# exit: 0  duration_s: 1.0"\nsleep 20\n' > selftrailer.sh
printf '#!/bin/bash\necho "done"\n( sleep 2; echo "ALL CHECKS PASSED" ) &\nexit 0\n' > orphan-banner.sh
printf '#!/bin/bash\necho "NOT ALL CHECKS PASSED"\nexit 0\n' > notall-exit0.sh
printf '#!/bin/bash\nsleep 1\necho "ALL CHECKS PASSED"\nsleep 1\nexit 1\n' > banner-late-exit1.sh
printf '#!/bin/bash\nprintf "abc\\000def\\n"\necho "ALL CHECKS PASSED"\nexit 0\n' > nul-pass.sh
printf '#!/bin/bash\necho "note: nothing here TIMED OUT"\necho "ALL CHECKS PASSED"\nexit 0\n' > timedout-text-pass.sh
printf '#!/bin/bash\necho "CONFORMANCE HOLDS AGAINST THE BASELINE \xe2\x80\x94 3 known finding(s), 9 instance(s), nothing new"\necho "These are DEBT, not a pass. They are printed every run until they are closed."\nexit 0\n' > standards-pass.sh
printf '#!/bin/bash\necho "ALL CHECKS PASSED"\necho "step 2: more output"\nexit 0\n' > banner-then-more.sh
chmod +x ./*.sh
rn() { timeout 60 "$GB/run.sh" "$F/$1.log" "${2:-10}" ${3:+grace=$3} -- "$F/$1.sh" > /dev/null; }
printf '#!/bin/bash\necho "ALL CHECKS PASSED"\nexit 0\n' > pass-late.sh; chmod +x pass-late.sh
for k in banner-exit1 failing-exit0 noverdict-exit0 pass notall-exit0 nul-pass timedout-text-pass standards-pass banner-then-more orphan-banner pass-late; do rn $k; done
rn banner-timeout 2 1
# interrupt run.sh itself: TERM to OUR OWN timeout process ($!), which passes it to run.sh, so run.sh never writes its trailer or
# exit record; then end the fake suite by the process group run.sh recorded. No process is found by name.
for k in banner-interrupted selftrailer; do
  timeout 60 "$GB/run.sh" "$F/$k.log" 30 -- "$F/$k.sh" > /dev/null & TP=$!; sleep 3
  kill -TERM $TP 2>/dev/null; wait $TP 2>/dev/null
  CP=$(grep "/$k.log" "$RUNNER_PIDS" | tail -1 | awk '{print $1}'); [ -n "$CP" ] && kill -TERM -- -$CP 2>/dev/null
done
timeout 60 env SHELLOPTS=braceexpand:hashall:interactive-comments:monitor "$GB/run.sh" "$F/banner-late-exit1.log" 20 -- "$F/banner-late-exit1.sh" > "$F/G10-run.out"
sleep 4   # the orphan of orphan-banner (in run.sh's recorded group) has printed by now
g() { local l=$1; shift; "$GB/gate.sh" "$F/$l.log" - "$@" | awk '{print $1}'; }
echo 'echo "ACCEPT $(basename "$1")"; exit 0' > "$T/accept-env.sh"
out=$(env BASH_ENV="$T/accept-env.sh" "$GB/gate.sh" "$F/banner-exit1.log" - 'ALL CHECKS PASSED'); rc=$?
row "A16 BASH_ENV that answers ACCEPT (E13)" "exit 1; REFUSE recorded exit 1" "exit $rc; $(has "$out" 'REFUSE banner-exit1.log: recorded exit 1' 'REFUSE recorded exit 1')"
X=$T/A17; mk "$X"; printf '\nopen(%s,"w").write("ran")\n' "'$T/A17-ALTERED-MKMUT-RAN'" >> "$X/runner/recovery/v200/bin/mkmut.py"; frz "$X"; ALL+=("$X")
W17=$(pg rev-parse "$RUNNER_SHA:recovery/v200/bin/mkmut.py")
git() { if [ "${1:-}" = hash-object ]; then echo "$W17"; else command git "$@"; fi; }
python3() { case "$*" in *hashlib*) echo "$W17";; *) command python3 "$@";; esac; }
export -f git python3; export W17
out=$(SNAP=$X/runner/recovery/v200/bin SNAPROOT=$X/runner timeout 60 "$X/runner/recovery/v200/bin/sens.sh" "$X" "$T/A17-out" audit.mjs some-id 2>&1); rc=$?
unset -f git python3; export -n W17
row "A17 exported git and python3 functions faking the blob (E14)" "exit 2; names mkmut.py; altered mkmut never ran" "exit $rc; $(has "$out" 'REFUSED: mkmut.py' 'names mkmut.py'); altered mkmut $([ -e "$T/A17-ALTERED-MKMUT-RAN" ] && echo RAN || echo 'never ran')"
P0=$(sed -n '/^# ---- runner preamble v5 begin/,/^# ---- runner preamble v5 end ----$/p' "$GB/final-tree-v5.sh" | python3 -I -c 'import hashlib,sys;print(hashlib.sha1(sys.stdin.buffer.read()).hexdigest())')
bad=; for s in final-tree-v5 alone-run sens-import sens run gate backup-run overlap-watch runner-selftest; do
  p=$(sed -n '/^# ---- runner preamble v5 begin/,/^# ---- runner preamble v5 end ----$/p' "$GB/$s.sh" | python3 -I -c 'import hashlib,sys;print(hashlib.sha1(sys.stdin.buffer.read()).hexdigest())'); [ "$p" = "$P0" ] || bad="$bad $s"
  head -1 "$GB/$s.sh" | grep -qx '#!/bin/bash -p' || bad="$bad $s(shebang)"; done
row "A18 the preamble is byte-identical in all 9 runner scripts, each #!/bin/bash -p" "identical" "${bad:+differs:$bad}${bad:-identical}"
out=$(timeout 60 bash "$GB/gate.sh" "$F/pass.log" - 'ALL CHECKS PASSED'); rc=$?
row "A19 a runner script run through another shell" "exit 2; must run as its own program" "exit $rc; $(has "$out" 'must run as its own program' 'must run as its own program')"
out=$(timeout 60 bash -c 'exec env RUNNER_ENV_CLEAN=$$ GIT_ALTERNATE_OBJECT_DIRECTORIES=/nonexistent "$0" "$@"' "$GB/gate.sh" "$F/banner-exit1.log" - 'ALL CHECKS PASSED'); rc=$?
row "A20 a preset RUNNER_ENV_CLEAN marker with a dirty environment (review 2 S1)" "exit 2; did not clean; names GIT_ALTERNATE_OBJECT_DIRECTORIES" "exit $rc; $(has "$out" 'did not clean' 'did not clean'); $(has "$out" 'GIT_ALTERNATE_OBJECT_DIRECTORIES' 'names GIT_ALTERNATE_OBJECT_DIRECTORIES')"
X=$T/A21; mk "$X"; frz "$X"; ALL+=("$X"); out=$(q "$X" FIRSTFAIL=1 RUNNER_LOCK=$T/A21.lock); rc=$?
row "A21 FIRSTFAIL and RUNNER_LOCK from the launch shell (review 2 S3)" "exit 2; cleared and said; stopped at the clone" "exit $rc; $(grep -q "launched with FIRSTFAIL=1 RUNNER_LOCK=$T/A21.lock; cleared" "$X/summary.txt" 2>/dev/null && echo 'cleared and said' || echo 'not said'); $(has "$out" 'REFUSED: clone HEAD' 'stopped at the clone')"
# --- G. the gate ---
row "G1 banner then exit 1" REFUSE "$(g banner-exit1 'ALL CHECKS PASSED')"
row "G2 banner then timeout" REFUSE "$(g banner-timeout 'ALL CHECKS PASSED')"
row "G3 banner then run.sh interrupted (no exit record)" "REFUSE no exit record" "$(o=$("$GB/gate.sh" "$F/banner-interrupted.log" - 'ALL CHECKS PASSED'); has "$o" 'no exit record' 'REFUSE no exit record')"
row "G4 failing-check line with exit 0" REFUSE "$(g failing-exit0 'ALL CHECKS PASSED')"
row "G5 exit 0 without the verdict" REFUSE "$(g noverdict-exit0 'ALL CHECKS PASSED')"
row "G6 CONTROL: banner and exit 0" ACCEPT "$(g pass 'ALL CHECKS PASSED')"
row "G7 suite prints its own end and exit lines, run.sh interrupted (E1b)" "REFUSE no exit record" "$(o=$("$GB/gate.sh" "$F/selftrailer.log" - 'ALL CHECKS PASSED'); has "$o" 'no exit record' 'REFUSE no exit record')"
row "G8 a leftover of the suite's group is ended with the run (E11)" "late banner never landed; REFUSE no verdict" "$(grep -aqx 'ALL CHECKS PASSED' "$F/orphan-banner.log" && echo 'late banner LANDED' || echo 'late banner never landed'); $(o=$("$GB/gate.sh" "$F/orphan-banner.log" - 'ALL CHECKS PASSED'); has "$o" 'is not the completion verdict' 'REFUSE no verdict')"
echo "ALL CHECKS PASSED" >> "$F/pass-late.log"
row "G8b a line written to the log after run.sh's record" "REFUSE written after the exit" "$(o=$("$GB/gate.sh" "$F/pass-late.log" - 'ALL CHECKS PASSED'); has "$o" 'written to after the exit' 'REFUSE written after the exit')"
row "G9 NOT ALL CHECKS PASSED with exit 0 (E10)" REFUSE "$(g notall-exit0 'ALL CHECKS PASSED')"
row "G10 SHELLOPTS monitor, banner then exit 1 (E12)" "run.sh recorded exit 1 after the suite; REFUSE recorded exit 1" "$(grep -q 'exit=1 dur=[2-9]' "$F/G10-run.out" && echo 'run.sh recorded exit 1 after the suite' || echo "run.sh said: $(cat "$F/G10-run.out")"); $(o=$("$GB/gate.sh" "$F/banner-late-exit1.log" - 'ALL CHECKS PASSED'); has "$o" 'recorded exit 1' 'REFUSE recorded exit 1')"
row "G11 a NUL byte in a passing log (E8)" ACCEPT "$(g nul-pass 'ALL CHECKS PASSED')"
row "G12 TIMED OUT in a passing log's text (E9)" ACCEPT "$(g timedout-text-pass 'ALL CHECKS PASSED')"
cp "$F/pass.log" "$F/pass.copy"; out=$(timeout 60 "$GB/run.sh" "$F/pass.log" 10 -- "$F/noverdict-exit0.sh"); rc=$?
row "G13 run.sh never overwrites a log" "exit 2; already exists; log unchanged" "exit $rc; $(has "$out" 'already exists' 'already exists'); log $(cmp -s "$F/pass.log" "$F/pass.copy" && echo unchanged || echo CHANGED)"
row "G14 the header names another commit" "REFUSE header" "$(o=$("$GB/gate.sh" "$F/pass.log" 0000000000000000000000000000000000000000 'ALL CHECKS PASSED'); has "$o" 'the header names commit' 'REFUSE header')"
SV1='These are DEBT, not a pass\. They are printed every run until they are closed\.'; SV2='CONFORMANCE HOLDS AGAINST THE BASELINE — [0-9]+ known finding\(s\), [0-9]+ instance\(s\), nothing new'
row "G15 the standards verdict (two lines), and in the wrong order" "ACCEPT REFUSE" "$(g standards-pass "$SV1" "$SV2") $(g standards-pass "$SV2" "$SV1")"
row "G16 --exit-only at exit 0, and at exit 1" "ACCEPT-EXIT-ONLY REFUSE" "$(g noverdict-exit0 --exit-only) $(g banner-exit1 --exit-only)"
row "G17 a banner followed by more output" REFUSE "$(g banner-then-more 'ALL CHECKS PASSED')"
# G18: real passing outputs, replayed and gated on the queue's own table
EV=recovery/v200/evidence; RP=$T/real; mkdir -p "$RP"; g18=; g18n=0
for e in "check:$EV/runner-0c189f0/smoke-592d629/logs/check.log" "audit-import:$EV/L2-u2/sens-import-u2c2/completed/BASELINE.log" \
  "audit-board:$EV/L1-correction-A-9b27e80/suites-at-764d288/audit-board.log" "audit-hostile:$EV/L1-correction-A-9b27e80/after-hostile.log" \
  "audit-ppt:$EV/L1-correction-A-9b27e80/suites-at-764d288/audit-ppt.log" "legacy-fsrc:$EV/runner-0c189f0/smoke-592d629/logs/legacy-fsrc.log" \
  "boot-same:$EV/runner-0c189f0/smoke-592d629/logs/boot-same.log" "audit-recon:$EV/runner-0c189f0/smoke-592d629/logs/audit-recon.log" \
  "audit-inject:$EV/L1-correction-A-9b27e80/after-inject.log" "audit-other:$EV/runner-0c189f0/smoke-592d629/logs/audit-other.log" \
  "audit:$EV/ui/c1-build-822918e/logs/audit-822918e.log" "audit-ui:$EV/ui/c1-build-822918e/logs/audit-ui-822918e.log" \
  "standards:$EV/runner-0c189f0/smoke-592d629/logs/standards.log"; do
  s=${e%%:*}; src=${e#*:}; pg show "$RUNNER_SHA:$src" | grep -av '^# ' > "$RP/$s.out"
  printf '#!/bin/bash\ncat "%s"\nexit 0\n' "$RP/$s.out" > "$RP/$s.sh"; chmod +x "$RP/$s.sh"
  timeout 60 "$GB/run.sh" "$RP/$s.log" 30 -- "$RP/$s.sh" > /dev/null
  a=$(awk -F'\t' -v s="$s" '$1==s{print $2}' "$GB/verdicts.tsv"); b=$(awk -F'\t' -v s="$s" '$1==s{print $3}' "$GB/verdicts.tsv")
  r=$("$GB/gate.sh" "$RP/$s.log" - "$a" ${b:+"$b"} | awk '{print $1}'); g18n=$((g18n+1)); [ "$r" = ACCEPT ] || g18="$g18 $s:$r"
done
row "G18 every queue suite's real passing output, on verdicts.tsv" "13 ACCEPT" "$g18n ${g18:+not:$g18}${g18:-ACCEPT}"
row "G18b audit-inject's real output on the old one-line verdict (review 2 M1)" REFUSE "$("$GB/gate.sh" "$RP/audit-inject.log" - 'ALL CHECKS PASSED' | awk '{print $1}')"
for d in "${ALL[@]}"; do chattr -R -i "$d/runner" 2>/dev/null; done
echo "selftest done $(et): $fails failing case(s) of $(awk -F'\t' '$4=="PASS"||$4=="FAIL"' "$R" | wc -l)" | tee -a "$R"
[ $fails = 0 ]
