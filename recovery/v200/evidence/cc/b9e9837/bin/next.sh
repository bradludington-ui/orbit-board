#!/bin/bash
# next.sh <K> : run the next K catalog ids (from out/ids.txt) that have no M-<id> log yet, in parallel, and wait. Each is one bounded
# frun.sh run (the focused harness, BOARD set to mut/<id>.html made by mkmut.py from the COMMITTED catalog and board). I launch this
# itself under setsid -w timeout -k 10 600 and only when my other test processes leave K slots free (at most 2 of mine at a time).
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/b9e9837
K=$1; n=0
echo "$$ $(TZ=America/New_York date '+%F %H:%M:%S %Z') bash next.sh :: $0 $* (the batch wrapper itself)" >> $F/pids.txt
for id in $(cat $F/out/ids.txt); do
  [ $n -ge $K ] && break
  [ -e $F/logs/M-$id.log ] && continue
  $F/bin/frun.sh M-$id after $F/mut/$id.html > /dev/null & n=$((n+1)); sleep 2
done
wait
