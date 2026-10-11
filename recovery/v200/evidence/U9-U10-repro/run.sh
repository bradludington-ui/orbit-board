#!/bin/bash
# One bounded probe run: setsid timeout -k 10 600 node <probe> <copy root> <results json> <tree>
# The PID of the setsid'd process is appended to pids.txt; exit code and wall time go to logs/<tag>.meta.
W=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L2/u9u10
tag="$1"; probe="$2"; root="$3"; out="$4"; tree="$5"
log="$W/logs/$tag.log"; meta="$W/logs/$tag.meta"
t0=$(date +%s.%N)
env -u BOARD -u MUT_FIRST_FAIL -u BOOT_PARSE setsid timeout -k 10 600 node "$probe" "$root" "$out" "$tree" >"$log" 2>&1 &
pid=$!
echo "$pid $tag $(date -u +%FT%TZ)" >> "$W/pids.txt"
wait $pid; rc=$?
t1=$(date +%s.%N)
dur=$(echo "$t1 - $t0" | bc)
echo "{\"tag\":\"$tag\",\"pid\":$pid,\"exit\":$rc,\"seconds\":$dur,\"cmd\":\"setsid timeout -k 10 600 node $probe $root $out $tree\"}" > "$meta"
cat "$meta"
