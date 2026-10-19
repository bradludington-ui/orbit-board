#!/bin/bash
# lane2.sh (lane.sh with the jobs read on fd 3) <jobfile> : runs the jobs of <jobfile> ONE AT A TIME (memory is tight: one heavy process of mine at a time). Each line:
#   fr <label> <before|after> <harness basename> [variantBoard]   -> bin/fr.sh (focused harness through run.sh: lock, setsid -w timeout -k 10 600, PIDs)
#   mut <id> <part harness basename> [label]                       -> bin/mutrun.sh (mkmut.py from the COMMITTED mutate.mjs text, then fr.sh on it)
#   run <label> <cwd> <cmd...>                                     -> bin/run.sh directly
# An exit 137 (OOM kill) is re-run ONCE with label suffix -b. This lane's own bash PID goes to pids.txt.
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/d6fea76
echo "$$ $(TZ=America/New_York date '+%F %H:%M:%S %Z') bash lane:$(basename $1) :: $0 $*" >> $F/pids.txt
while read -r K A B C D <&3; do
  [ -z "$K" ] && continue; case "$K" in \#*) continue;; esac
  for try in a b; do
    L=$A; [ $try = b ] && L=$A-b
    case "$K" in
      fr) $F/bin/fr.sh $L $B $C $D; RC=$?;;
      mutff) RUNNER=runner-ff.mjs $F/bin/mutrun.sh $A $B ${C:-MF-$A}$( [ $try = b ] && echo -b ); RC=$?;;
      mut) $F/bin/mutrun.sh $A $B ${C:-M-$A}$( [ $try = b ] && echo -b ); RC=$?;;
      run) $F/bin/run.sh $L $B -- $C $D; RC=$?;;
    esac
    [ $RC = 137 ] && { echo "$L exit 137 (OOM kill): re-running once" | tee -a $F/logs/runs.txt; continue; }
    break
  done
done 3< $1
echo "lane $(basename $1) done $(TZ=America/New_York date '+%F %H:%M:%S %Z')" >> $F/logs/runs.txt
