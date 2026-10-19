#!/bin/bash
# callers.sh : text only -- every applyStore( call site in the b63 board, with the enclosing function name
B=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17/b63/prioritization-board-grid.html
awk '/^(async )?function [A-Za-z0-9_$]+/{ match($0,/function [A-Za-z0-9_$]+/); fn=substr($0,RSTART+9,RLENGTH-9); fl=NR }
     /applyStore\(/{ print NR": in "fn" (from L"fl"): "substr($0,1,150) }' "$B"
echo "== driveRead / driveWrite"
grep -n "^async function driveRead\|^async function driveWrite\|^function driveRead\|^function driveWrite" "$B"
