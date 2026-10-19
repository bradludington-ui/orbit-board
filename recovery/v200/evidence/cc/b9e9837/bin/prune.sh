#!/bin/bash
# prune.sh : the disk is nearly full; remove a mutant board of mine once its run has ended with all 102 records (its blob stays in
# out/mkmut-summary.txt; mkmut.py rebuilds it byte for byte from the committed text).
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/b9e9837
for id in $(cat $F/out/ids.txt); do
  [ -f $F/mut/$id.html ] || continue
  grep -q '^# end' $F/logs/M-$id.log 2>/dev/null || continue
  [ "$(wc -l < $F/out/M-$id.checks.jsonl)" = 102 ] || continue
  rm -f $F/mut/$id.html && echo "$(TZ=America/New_York date '+%F %H:%M:%S %Z') pruned mut/$id.html" >> $F/logs/notes.txt
done
