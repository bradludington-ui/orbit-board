#!/bin/bash
# mm2.sh : the REST of chunk M137 after the usage-limit cut (resume, same runner and order as mm.sh M137 from V1sameperm on).
C=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17-check
for s in V1sameperm V2live W2pull W2tick; do for n in save putback; do
  QTAIL=none $C/rr.sh c137 $s $n r >/dev/null
  echo "$(tail -1 $C/logs/runs.txt) | $(grep -h '^SUMMARY' $C/logs/r-c137-$s-$n.log)"
done; done
