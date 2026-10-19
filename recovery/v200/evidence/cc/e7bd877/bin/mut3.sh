#!/bin/bash
# mut3.sh <id>... : mutrun.sh for each id in turn, starting the next only while under 330 s have passed (so the set stays inside one
# 600 s tool call; each run is itself bounded by run.sh's setsid -w timeout -k 10 600). Mutants stay in mut/ (blobs in out/mutants.txt).
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/e7bd877
t0=$(date +%s)
for I in "$@"; do
  if [ $(( $(date +%s) - t0 )) -ge 330 ]; then echo "SKIPPED $I ($(( $(date +%s) - t0 )) s gone): run it next"; continue; fi
  $F/bin/mutrun.sh $I
done
