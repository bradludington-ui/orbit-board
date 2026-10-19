#!/bin/bash
# xpass.sh <pass> [scenarios...] : the CHECKER'S added scenarios (x/u20x.mjs), each node run ONE bounded q.sh call
# (setsid -w timeout -k 10 600, lock checked first), one at a time, against u20-check/b63. Outputs x/out/<sc>.<pass>.json.
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u20-check
P=$1; shift
SC="${*:-PB-Wcount AD-Wcount BR-Wcount BR-Wreal BR-Wrealtick BR-C1real BR-Wrealcount BR-Wrealh O4-tick O4-tickh BR-Wrealtickcount}"
for s in $SC; do bash $U/q.sh x$P-$s node $U/x/u20x.mjs $U/b63 $s $U/x/out/$s.$P.json > /dev/null; done
echo "xpass $P done $(TZ=America/New_York date '+%T %Z')"
