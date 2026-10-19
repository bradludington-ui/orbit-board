#!/bin/bash
# xmm.sh <b63|c137> : the CHECKER's final adversarial runs (x-probe.mjs), prefix x-, one board.
C=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17-check
B=$1
for sn in XSHd:save XSHe:save XSHdL:save XSHn:save XFBT:save XFBTC:save XFBTL:save XFSHd:save XFSHd:putback XFSHn:save XFSHn:putback XFSHdL:save XFSHdL:putback; do
  s=${sn%%:*}; n=${sn##*:}
  QTAIL=none $C/xr.sh $B $s $n x >/dev/null
  echo "$(tail -1 $C/logs/runs.txt) | $(grep -h '^SUMMARY' $C/logs/x-$B-$s-$n.log)"
done
