#!/bin/bash
# mutlane.sh <id>... : each mutant (mut/<id>.html) through the focused harness, one after another (fr.sh: lock check, 600 s cap, PIDs).
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/8b39373
for id in "$@"; do $F/bin/fr.sh M-$id $F/mut/$id.html; done
