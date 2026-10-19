#!/bin/bash
# q.sh <tag> <job>... : a queue of bounded runs, at most 2 at once (and a new one only while MemAvailable > 4 GB). A job is
# "recon" (audit-recon in full on after/), "recon4096" (the same with NODE_OPTIONS=--max-old-space-size=4096), "check"
# (npm run check in clone/repo at the commit), or a catalog id (its mutant mut/<id>.html, already made by mkmut.py from the
# COMMITTED mutate.mjs text and board, run through the focused harness with BOARD set to it). Each run is its own run.sh call.
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/b9e9837
T=$1; shift
echo "$$ $(TZ=America/New_York date '+%F %H:%M:%S %Z') bash q-$T :: $0 $T $* (the queue wrapper itself)" >> $F/pids.txt
gate() { while [ $(jobs -rp | wc -l) -ge 2 ] || [ $(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo) -lt 4096 ]; do sleep 5; done; }
for j in "$@"; do
  gate
  case "$j" in
    recon) $F/bin/run.sh R-audit-recon-after $F/after -- env SUITE_CHECKS=$F/out/R-audit-recon-after.checks.jsonl node tools/export-audit/audit-recon.mjs > /dev/null & ;;
    recon4096) $F/bin/run.sh R2-audit-recon-after-4096 $F/after -- env NODE_OPTIONS=--max-old-space-size=4096 SUITE_CHECKS=$F/out/R2-audit-recon-after-4096.checks.jsonl node tools/export-audit/audit-recon.mjs > /dev/null & ;;
    check) $F/bin/run.sh C-npm-check $F/clone/repo -- npm run check > /dev/null & ;;
    *) [ -f $F/mut/$j.html ] || { echo "$j: no mutant" >> $F/out/q-missing.txt; continue; }
       $F/bin/frun.sh M-$j after $F/mut/$j.html > /dev/null & ;;
  esac
  sleep 3
done
wait
