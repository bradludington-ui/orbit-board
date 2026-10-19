#!/bin/bash
# commitcheck.sh <sha> <outdir> : fresh probe runs against an isolated git-archive copy of <sha> (probes unchanged),
# mutation applicability for every mutate.mjs entry (text only), and the commit's board/tool blobs.
set -e; SHA=$(git -C /home/user/orbit-board rev-parse "$1"); OD=$2; B=$(dirname "$0"); mkdir -p "$OD"
"$B/mkcopy.sh" "$SHA" "$OD/run" > /dev/null
git -C /home/user/orbit-board ls-tree -r "$SHA" prioritization-board-grid.html tools package.json > "$OD/blobs.txt"
(cd "$OD/run/copy" && "$B/run.sh" "$OD/money.log" 600 X=1 -- node money-runtime-probe.mjs) &
(cd "$OD/run/copy" && "$B/run.sh" "$OD/code.log" 600 X=1 -- node code-runtime-probe.mjs) &
(cd "$OD/run/races" && "$B/run.sh" "$OD/races.log" 600 X=1 -- node --import ../copy/runtime-encoding-shim.mjs races-probe.mjs) &
wait
python3 -I "$B/mcount.py" "$OD/run/copy/tools/export-audit/mutate.mjs" "$OD/run/copy/prioritization-board-grid.html" > "$OD/applicability.json"
cp "$OD/run/provenance.txt" "$OD/"; cp "$OD/run/money-runtime-results.json" "$OD/run/code-runtime-results.json" "$OD/" 2>/dev/null || true
cp "$OD/run/races/results.json" "$OD/races-results.json" 2>/dev/null || true
python3 - "$OD" <<'PY'
import json,sys,os
od=sys.argv[1]
def summ(p):
    try: return json.load(open(p))
    except Exception as e: return None
m=summ(od+'/money-runtime-results.json'); c=summ(od+'/code-runtime-results.json'); r=summ(od+'/races-results.json')
print('commit', open(od+'/provenance.txt').readline().strip())
if m: print('money (R1): %d passed, %d failed %s'%(m['passed'],m['failed'],[x['name'] for x in m['results'] if x['status']!='passed']))
if c: print('code  (R2): %d passed, %d failed %s'%(c['passed'],c['failed'],[x['name'] for x in c['results'] if x['status']!='passed']))
if r: print('races (R3-R5): %d passed / %d  %s'%(sum(x['status']=='passed' for x in r),len(r),[(x['name'],x['status']) for x in r if x['status']!='passed']))
a=json.load(open(od+'/applicability.json')); print('applicability:',json.dumps(a))
PY
