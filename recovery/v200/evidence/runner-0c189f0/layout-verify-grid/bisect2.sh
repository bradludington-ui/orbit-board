#!/bin/bash
# layout-fits.mjs alone at each commit's own board and tools (git archive copies), sequential, each capped at 600 s.
BI=$(cd "$(dirname "$0")" && pwd -P)
for c in f9b4413 f81e954; do
  (cd $BI/$c && setsid -w timeout -k 10 600 node tools/layout-fits.mjs > $BI/$c.log 2>&1) & P=$!; echo "$P $c" >> $BI/pids.txt; wait $P
  echo "$c exit $? fails $(grep -a -c '^  FAIL' $BI/$c.log) $(TZ=America/New_York date '+%I:%M:%S %p ET')" >> $BI/exits.txt
done
