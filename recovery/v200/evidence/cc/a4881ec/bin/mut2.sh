#!/bin/bash
# mut2.sh <id1> [id2] : mutrun.sh for id1, then for id2 only if id1's run took under 250 s (so the pair stays well inside one
# 600 s tool call; each run is itself bounded by run.sh's setsid -w timeout -k 10 600).
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/a4881ec
t0=$(date +%s); $F/bin/mutrun.sh $1; t1=$(date +%s)
if [ -n "$2" ]; then if [ $((t1-t0)) -lt 250 ]; then $F/bin/mutrun.sh $2; else echo "SKIPPED $2 (first took $((t1-t0)) s): run it next"; fi; fi
