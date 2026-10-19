#!/bin/bash
# batchM.sh : check 3. Each added entry's mutant of the COMMITTED board, made by rec/bin/mkmut.py from the COMMITTED mutate.mjs (text only),
# run through the focused harness of the committed blocks (harness/after, via mutrun.sh -> fr.sh -> run.sh), two at a time; then the same
# mutant boards through the PARENT's own blocks (harness/parentown, U10 1-8's), to see whether anything before this commit catches them.
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/d01b3ba
$F/bin/mutrun.sh v200-u10-reapply-keeps-appn-pick & $F/bin/mutrun.sh v200-u10-reapply-keeps-pseudo & wait
$F/bin/mutrun.sh v200-u10-reapply-keeps-rules & $F/bin/mutrun.sh v200-u10-reapply-keeps-cats & wait
$F/bin/fr.sh M8-v200-u10-reapply-keeps-appn-pick parentown before $F/mut/v200-u10-reapply-keeps-appn-pick.html & $F/bin/fr.sh M8-v200-u10-reapply-keeps-pseudo parentown before $F/mut/v200-u10-reapply-keeps-pseudo.html & wait
$F/bin/fr.sh M8-v200-u10-reapply-keeps-rules parentown before $F/mut/v200-u10-reapply-keeps-rules.html & $F/bin/fr.sh M8-v200-u10-reapply-keeps-cats parentown before $F/mut/v200-u10-reapply-keeps-cats.html & wait
echo BATCH-M-DONE $(TZ=America/New_York date '+%F %H:%M:%S %Z')
