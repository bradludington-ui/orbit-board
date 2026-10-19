#!/bin/bash
# pass.sh <pass> : the builder's locktest and all 26 scenarios of the builder's probe (byte-identical copies in rerun/),
# each node run ONE bounded q.sh call (setsid -w timeout -k 10 600, lock checked first), one at a time, against
# u20-check/b63 (a cp -a of ../base). Outputs: rerun/out/<sc>.<pass>.json, rerun/out/locktest.<pass>.json.
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u20-check
P=$1
SC="PB-W PB-Wtick PB-C1 PB-C2a PB-C2b PB-NL AD-W AD-Wtick AD-C1 AD-C2a AD-C2b BR-W BR-Wtick BR-C1 BR-C2a BR-C2b BR-Wperm BR-C1perm BR-Wh BR-C1h BR-Wpermh BR-C2ah BR-C2bh PF-W PF-C1 PF-C2a"
bash $U/q.sh locktest-$P node $U/rerun/locktest.mjs $U/b63 $U/rerun/out/locktest.$P.json > /dev/null
for s in $SC; do bash $U/q.sh $P-$s node $U/rerun/u20probe.mjs $U/b63 $s $U/rerun/out/$s.$P.json > /dev/null; done
echo "pass $P done $(TZ=America/New_York date '+%T %Z')"
