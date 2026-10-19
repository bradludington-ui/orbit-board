#!/bin/bash
# mutrun.sh <id> : one mutant of the COMMITTED board, written by rec/bin/mkmut.py (python3 -I, text only) from the COMMITTED
# mutate.mjs (after/tools/export-audit/mutate.mjs = e7bd877's; read as text, never imported or run), its blob recorded in
# out/mutants.txt, then the focused harness (focused.mjs: U41, U56/U57, U58/U59, cut from the committed audit-recon) on it:
# root after/, BOARD = the mutant. (After rec/L8/cc/a4881ec/bin/mutrun.sh; folder and harness differ.)
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/e7bd877
MK=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/bin/mkmut.py
I=$1; O=$F/mut/$I.html; L=${2:-M-$I}
if [ ! -e $O ]; then
  $F/bin/bx.sh mkmut-$I -- python3 -I $MK $F/after/tools/export-audit/mutate.mjs $F/after/prioritization-board-grid.html $I $O > $F/out/mkmut-$I.json; R=$?
  if [ $R != 0 ]; then echo "$I mkmut FAILED rc=$R $(cut -c1-200 $F/out/mkmut-$I.json)" | tee -a $F/out/mutants.txt; exit 2; fi
  echo "$I mutant=$(git hash-object $O) matches=$(python3 -I -c "import json,sys;print(json.load(open(sys.argv[1]))['matches'])" $F/out/mkmut-$I.json) difflines=$(diff $F/after/prioritization-board-grid.html $O | grep -c '^[<>]')" >> $F/out/mutants.txt
fi
$F/bin/fr.sh $L after focused.mjs $O
