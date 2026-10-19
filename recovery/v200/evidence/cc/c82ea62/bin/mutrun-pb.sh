#!/bin/bash
# mutrun-pb.sh <id> : the same mutant as mutrun.sh (rec/bin/mkmut.py, text only, from the COMMITTED mutate.mjs and board), then the PARENT's
# own U10 blocks (harness/parentown-c) on it -- to read the entry's claim "passes every check before this commit".
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/c82ea62
MK=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/bin/mkmut.py
I=$1; O=$F/mut/$I.html
$F/bin/bx.sh mkmut-pb-$I -- python3 -I $MK $F/after/tools/export-audit/mutate.mjs $F/after/prioritization-board-grid.html $I $O > $F/out/mkmut-pb-$I.json; R=$?
if [ $R != 0 ]; then echo "$I mkmut FAILED rc=$R" | tee -a $F/out/mutants.txt; exit 2; fi
echo "$I (pb) mutant=$(git hash-object $O)" >> $F/out/mutants.txt
$F/bin/fr2.sh MPB-$I after parentown-c $O
rm -f $O
