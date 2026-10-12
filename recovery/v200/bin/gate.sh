#!/bin/bash
# gate.sh <log> <verdict-regex> : the baseline acceptance gate (runner correction, Brad, 12 Oct). Exits 0 ONLY IF the run
# recorded in <log> (written by run.sh) FINISHED and SUCCEEDED: an "# end:" line (not interrupted), exactly one recorded
# "# exit: 0", no "TIMED OUT", no "N FAILING CHECK(S)" line anywhere, and the suite's own completion verdict (<verdict-regex>).
# Anything else -- including a success banner followed by a nonzero exit, a timeout or an interruption -- is REFUSED.
L=$1; V=$2
r(){ echo "REFUSE $(basename "$L"): $1"; exit 1; }
[ -n "$V" ] || r "no verdict pattern given"
[ -f "$L" ] || r "no log"
grep -q '^# end: ' "$L" || r "no end line (interrupted, or still running)"
[ "$(grep -c -E '^# exit: ' "$L")" = 1 ] || r "not exactly one recorded exit"
X=$(grep -E '^# exit: ' "$L" | awk '{print $3}')
[ "$X" = 0 ] || r "recorded exit $X"
! grep -q 'TIMED OUT' "$L" || r "timed out"
! grep -q -E '[0-9]+ FAILING CHECK' "$L" || r "a failing-check line"
grep -q -E "$V" "$L" || r "no completion verdict matching /$V/"
echo "ACCEPT $(basename "$L")"
