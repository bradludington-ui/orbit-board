#!/bin/bash
# smoke.sh : the v5 run.sh and gate.sh (scratch working copy, before commit) on real suites at 592d629 -- does the fixed
# environment run them, and does the stricter gate accept each real passing output? Sequential; each capped by run.sh.
SM=$(cd "$(dirname "$0")" && pwd -P); RB=$SM/../../bin; C=$SM/clone; L=$SM/logs; mkdir -p $L; export RUNNER_PIDS=$SM/pids.txt
H=$(git -C $C rev-parse HEAD)
r(){ (cd $C && $RB/run.sh "$L/$1.log" 600 X=1 -- "${@:2}" > /dev/null) ; }
r check npm run check --silent
r legacy-fsrc node tools/export-audit/legacy-fsrc.mjs
r boot-same node tools/export-audit/boot-same.mjs
r standards npm run standards --silent
r audit-recon node tools/export-audit/audit-recon.mjs
r audit-other node tools/export-audit/audit-other.mjs
r verify-grid npm run verify:grid --silent
{ echo "check | $($RB/gate.sh $L/check.log $H 'all checks passed')"
  echo "legacy-fsrc | $($RB/gate.sh $L/legacy-fsrc.log $H '  every legacy Force setting computes exactly as before')"
  echo "boot-same | $($RB/gate.sh $L/boot-same.log $H 'every page, source, save and error list is identical either way')"
  echo "standards | $($RB/gate.sh $L/standards.log $H 'These are DEBT, not a pass\. They are printed every run until they are closed\.' 'CONFORMANCE HOLDS AGAINST THE BASELINE — [0-9]+ known finding\(s\), [0-9]+ instance\(s\), nothing new')"
  echo "audit-recon | $($RB/gate.sh $L/audit-recon.log $H 'ALL CHECKS PASSED')"
  echo "audit-other | $($RB/gate.sh $L/audit-other.log $H 'ALL CHECKS PASSED')"
  echo "verify:grid | $($RB/gate.sh $L/verify-grid.log $H --exit-only)"; } | tee $SM/gate-results.txt
echo "smoke done $(TZ=America/New_York date '+%I:%M:%S %p ET')"
