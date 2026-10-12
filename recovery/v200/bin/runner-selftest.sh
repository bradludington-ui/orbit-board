#!/bin/bash
# runner-selftest.sh <outdir> : BOUNDED refusal checks for the runner correction (Brad, 12 Oct). Run it from a frozen snapshot
# of the runner commit, with RUNNER_SHA (full) and SNAP (that snapshot's bin directory) set -- the same bootstrap as the queue.
# Every case runs under a timeout; expected outcomes are literal. Exit 0 only if every case matches.
#  A. PROVENANCE: the queue run from a snapshot with one helper altered (mkmanifest.py) refuses before running anything;
#     alone-run from a snapshot with sens-import.sh altered refuses before touching the lock; sens.sh with mkmut.py altered
#     refuses before building a mutant; a helper outside the snapshot is refused; a short or missing RUNNER_SHA is refused;
#     and, as the healthy control, the queue from the unaltered snapshot passes its snapshot checks and stops only at the
#     (deliberately missing) clone.
#  G. THE GATE (gate.sh on logs written by run.sh itself, from fake suites): a success banner then exit 1 -> REFUSE; a banner
#     then a timeout -> REFUSE; a banner then the runner interrupted (no end line) -> REFUSE; a failing-check line with exit 0
#     -> REFUSE; exit 0 without the verdict -> REFUSE; the banner with exit 0 -> ACCEPT (the healthy control).
T=$1; B=$(cd "$(dirname "$0")" && pwd -P); REPO=/home/user/orbit-board; mkdir -p "$T"; : > "$T/results.tsv"; fails=0
[[ "$RUNNER_SHA" =~ ^[0-9a-f]{40}$ ]] && [ "$SNAP" = "$B" ] || { echo "REFUSED: run from the frozen snapshot with RUNNER_SHA and SNAP set"; exit 2; }
export RUNNER_PIDS="$T/pids.txt"
row(){ local c=$1 want=$2 got=$3; local ok=FAIL; [ "$want" = "$got" ] && ok=PASS; [ $ok = PASS ] || fails=$((fails+1)); printf '%s\t%s\t%s\t%s\n' "$c" "$want" "$got" "$ok" | tee -a "$T/results.tsv"; }
snap(){ local d=$1; mkdir -p "$d"; git -C "$REPO" archive "$RUNNER_SHA" recovery/v200/bin | tar -x -C "$d"; }
frz(){ chattr -R +i "$1/recovery"; }
unfrz(){ chattr -R -i "$1/recovery" 2>/dev/null; }
# --- A. provenance ---
G=$T/good; snap "$G"; frz "$G"; GB=$G/recovery/v200/bin
X=$T/alt-manifest; snap "$X"; echo "# altered" >> "$X/recovery/v200/bin/mkmanifest.py"; frz "$X"
out=$(timeout 120 "$X/recovery/v200/bin/final-tree-v4.sh" "$RUNNER_SHA" /nonexistent "$T/outA1" x "$RUNNER_SHA" /nonexistent 2>&1); rc=$?
row "A1 queue, mkmanifest.py altered" "exit 2; refused; outdir not created" "exit $rc; $(echo "$out" | grep -q 'REFUSED: the snapshot' && echo refused || echo not-refused); outdir $([ -e "$T/outA1" ] && echo created || echo not created)"
X2=$T/alt-sensimport; snap "$X2"; echo "# altered" >> "$X2/recovery/v200/bin/sens-import.sh"; frz "$X2"
LOCK=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/AUDIT_IMPORT_RUNNING; L0=$([ -e $LOCK ] && echo present || echo absent)
out=$(SNAP=$X2/recovery/v200/bin timeout 60 "$X2/recovery/v200/bin/alone-run.sh" /nonexistent "$T/outA2" x x BASELINE 2>&1); rc=$?
row "A2 alone-run, sens-import.sh altered" "exit 2; names sens-import.sh; lock $L0" "exit $rc; $(echo "$out" | grep -q 'REFUSED: sens-import.sh' && echo names sens-import.sh || echo "said: $(echo "$out" | head -1)"); lock $([ -e $LOCK ] && echo present || echo absent)"
X3=$T/alt-mkmut; snap "$X3"; echo "# altered" >> "$X3/recovery/v200/bin/mkmut.py"; frz "$X3"
out=$(SNAP=$X3/recovery/v200/bin timeout 60 "$X3/recovery/v200/bin/sens.sh" /nonexistent "$T/outA3" audit.mjs some-id 2>&1); rc=$?
row "A3 sens.sh, mkmut.py altered" "exit 2; names mkmut.py; no mutant" "exit $rc; $(echo "$out" | grep -q 'REFUSED: mkmut.py' && echo names mkmut.py || echo "said: $(echo "$out" | head -1)"); $([ -e "$T/outA3/mut-some-id.html" ] && echo mutant || echo no mutant)"
SC=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/bin
out=$(SNAP=$GB timeout 60 bash -c "source <(sed -n '/^vh(){/,/^  done; }/p' '$GB/sens.sh'); REPO=$REPO; vh '$SC/run.sh'" 2>&1); rc=$?
row "A4 a helper outside the snapshot" "exit 2; not in the frozen snapshot" "exit $rc; $(echo "$out" | grep -q 'not in the frozen snapshot' && echo 'not in the frozen snapshot' || echo "said: $out")"
out=$(RUNNER_SHA=${RUNNER_SHA:0:7} SNAP=$GB timeout 60 "$GB/sens.sh" /nonexistent "$T/outA5" audit.mjs x 2>&1); rc=$?
row "A5 a short RUNNER_SHA" "exit 2; full 40-hex" "exit $rc; $(echo "$out" | grep -q 'full 40-hex' && echo 'full 40-hex' || echo "said: $out")"
out=$(timeout 120 "$GB/final-tree-v4.sh" "$RUNNER_SHA" /nonexistent "$T/outA6" x "$RUNNER_SHA" /nonexistent 2>&1); rc=$?
row "A6 CONTROL: unaltered snapshot" "exit 2; snapshot verified; stopped at the clone" "exit $rc; $(grep -q 'snapshot .* verified' "$T/outA6/summary.txt" 2>/dev/null && echo 'snapshot verified' || echo 'snapshot NOT verified'); $(echo "$out" | grep -q 'REFUSED: clone HEAD' && echo 'stopped at the clone' || echo "said: $(echo "$out" | head -1)")"
X7=$T/unfrozen; snap "$X7"
out=$(timeout 120 "$X7/recovery/v200/bin/final-tree-v4.sh" "$RUNNER_SHA" /nonexistent "$T/outA7" x "$RUNNER_SHA" /nonexistent 2>&1); rc=$?
row "A7 an unfrozen snapshot" "exit 2; not immutable" "exit $rc; $(echo "$out" | grep -q 'not immutable' && echo 'not immutable' || echo "said: $(echo "$out" | head -1)")"
# --- G. the gate, on logs written by run.sh ---
F=$T/fake; mkdir -p "$F"
printf '#!/bin/bash\necho "ALL CHECKS PASSED"\nexit 1\n' > "$F/banner-exit1.sh"
printf '#!/bin/bash\necho "ALL CHECKS PASSED"\nsleep 30\n' > "$F/banner-timeout.sh"
printf '#!/bin/bash\necho "ALL CHECKS PASSED"\nsleep 20\n' > "$F/banner-interrupted.sh"
printf '#!/bin/bash\necho "3 FAILING CHECK(S)"\necho "ALL CHECKS PASSED"\nexit 0\n' > "$F/failing-exit0.sh"
printf '#!/bin/bash\necho "done"\nexit 0\n' > "$F/noverdict-exit0.sh"
printf '#!/bin/bash\necho "ALL CHECKS PASSED"\nexit 0\n' > "$F/pass.sh"
chmod +x "$F"/*.sh
for k in banner-exit1 failing-exit0 noverdict-exit0 pass; do timeout 60 "$GB/run.sh" "$F/$k.log" 10 -- "$F/$k.sh" >/dev/null; done
timeout 60 "$GB/run.sh" "$F/banner-timeout.log" 2 grace=1 -- "$F/banner-timeout.sh" >/dev/null
# interrupt the runner itself: TERM to OUR OWN timeout process (its PID from $!), which passes it to run.sh, so run.sh never
# writes its end lines; then end the fake suite by the process group run.sh recorded. No process is found by name.
timeout 60 "$GB/run.sh" "$F/banner-interrupted.log" 30 -- "$F/banner-interrupted.sh" >/dev/null & TP=$!; sleep 2
kill -TERM $TP 2>/dev/null; wait $TP 2>/dev/null
CP=$(grep "banner-interrupted.log" "$T/pids.txt" | tail -1 | awk '{print $1}'); [ -n "$CP" ] && kill -TERM -- -$CP 2>/dev/null; true
g(){ "$GB/gate.sh" "$F/$1.log" 'ALL CHECKS PASSED' | awk '{print $1}'; }
row "G1 banner then exit 1" REFUSE "$(g banner-exit1)"
row "G2 banner then timeout" REFUSE "$(g banner-timeout)"
row "G3 banner then interrupted (no end line)" REFUSE "$(g banner-interrupted)"
row "G4 failing-check line with exit 0" REFUSE "$(g failing-exit0)"
row "G5 exit 0 without the verdict" REFUSE "$(g noverdict-exit0)"
row "G6 CONTROL: banner and exit 0" ACCEPT "$(g pass)"
for d in "$G" "$X" "$X2" "$X3"; do unfrz "$d"; done
echo "selftest done $(TZ=America/New_York date '+%I:%M:%S %p ET'): $fails failing case(s)" | tee -a "$T/results.tsv"
[ $fails = 0 ]
