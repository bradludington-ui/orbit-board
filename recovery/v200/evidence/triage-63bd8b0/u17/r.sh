#!/bin/bash
# r.sh <b63|c137> <scenario> <none|save|putback> [label-prefix] : one probe run through q.sh (lock, bound, PIDs, runs.txt)
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17
L=${4:-run}-$1-$2-$3
cd $U && QTAIL=${QTAIL:-3} ./q.sh $L -- node $U/u17-probe.mjs $U/$1 $U/out/$L.json $2 $3
