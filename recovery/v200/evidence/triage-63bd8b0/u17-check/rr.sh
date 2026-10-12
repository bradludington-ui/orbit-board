#!/bin/bash
# rr.sh <b63|c137> <scenario> <none|save|putback> [prefix] : one re-run of the BUILDER'S probe (copied unchanged to probe/u17-probe.mjs)
# against the CHECKER'S board copies, through q.sh (lock, bound, PIDs, runs.txt).
C=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17-check
L=${4:-r}-$1-$2-$3
cd $C && QTAIL=${QTAIL:-3} ./q.sh $L -- node $C/probe/u17-probe.mjs $C/$1 $C/out/$L.json $2 $3
