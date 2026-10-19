#!/bin/bash
# run-focused.sh : FOCUSED reruns (not the full suite) of the v2.00 R3-R5 blocks, verbatim from each commit's suite, against
# that commit's unmutated board and each of its 12 mutants. One run at a time, 600 s cap, PIDs recorded by run.sh.
E=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec; RU=$E/L2/reuse; O=$RU/focused
IDS="v200-r3-cycblock-gone v200-r3-cycblock-falls-through v200-r3-cycblock-says-saved v200-r3-landed-view-unsaid v200-r3-landed-view-prefix v200-r4-no-recheck v200-r4-held-quietly v200-r4-said-not-held v200-r5-restore-gen v200-r5-restore-basedirty unsaved-flag-never-set impmixed-file-unguarded"
for c in 4a6f7c7 af892cb; do
  [ $c = 4a6f7c7 ] && CP=$RU/copy || CP=$RU/copy-af892cb
  (cd $CP && $E/bin/run.sh $O/logs/$c-BASE.log 600 X=1 -- node tools/export-audit/focused-r3r5.mjs > /dev/null)
  echo "$c BASE | $(grep -E '^# exit' $O/logs/$c-BASE.log) | $(grep -m1 -o -E '[0-9]+ FAILING CHECK\(S\)|ALL CHECKS PASSED' $O/logs/$c-BASE.log)" >> $O/summary.txt
  for id in $IDS; do
    (cd $CP && $E/bin/run.sh $O/logs/$c-$id.log 600 X=1 BOARD=$RU/mut-$c/$id.html -- node tools/export-audit/focused-r3r5.mjs > /dev/null)
    SC=$(python3 -c "
import re,collections; t=open('$O/logs/$c-$id.log',encoding='utf-8').read(); print(dict(collections.Counter(re.findall(r'^--- (.+?) \| (.+)$',t,re.M))))")
    echo "$c $id | blob $(git hash-object $RU/mut-$c/$id.html) | $(grep -E '^# exit' $O/logs/$c-$id.log) | $(grep -m1 -o -E '[0-9]+ FAILING CHECK\(S\)|ALL CHECKS PASSED' $O/logs/$c-$id.log) | $SC" >> $O/summary.txt
  done
done
echo "DONE $(date -u +%FT%TZ)" >> $O/summary.txt
