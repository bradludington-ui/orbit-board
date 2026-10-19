#!/bin/bash
# mutrun.sh <id> : one mutant of the COMMITTED board, written by rec/bin/mkmut.py (text only) from the COMMITTED mutate.mjs
# (after/tools/export-audit/mutate.mjs), its blob recorded in out/mutants.txt, then the focused U10 harness on it (root after/, BOARD = the mutant).
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/aec3e63
MK=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/bin/mkmut.py
I=$1; O=$F/mut/$I.html
$F/bin/bx.sh mkmut-$I -- python3 -I $MK $F/after/tools/export-audit/mutate.mjs $F/after/prioritization-board-grid.html $I $O > $F/out/mkmut-$I.json; R=$?
if [ $R != 0 ]; then echo "$I mkmut FAILED rc=$R $(cat $F/out/mkmut-$I.json | cut -c1-200)" | tee -a $F/out/mutants.txt; exit 2; fi
echo "$I mutant=$(git hash-object $O) matches=$(python3 -I -c "import json,sys;print(json.load(open(sys.argv[1]))['matches'])" $F/out/mkmut-$I.json) diffstat=$(diff $F/after/prioritization-board-grid.html $O | grep -c '^[<>]')" >> $F/out/mutants.txt
$F/bin/fr.sh M-$I after $O
