#!/bin/bash
# xr.sh <b63|c137> <scenario> <none|save|putback> [prefix] : one x-probe run through q.sh
C=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17-check
L=${4:-x}-$1-$2-$3
cd $C && QTAIL=${QTAIL:-60} ./q.sh $L -- node $C/x-probe.mjs $C/$1 $C/out/$L.json $2 $3
