#!/bin/bash
# mm.sh <chunk> : one chunk of the builder's final matrix (same 10 chunks, same order), re-run here with prefix r-.
C=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17-check
MEAS="S1harness S1tick S1perm S1open S1pen V1same V1sameperm V2live W2pull W2tick"
CTRL="Ca Cb Cc C1 C3 U25ws U25wf U25mid L20"
ADA="SHd SHdC SHdk SHdkC SHa"
ADB="SHaC BT BTC IB IBC"
case $1 in
  M63)   B=b63;  S=$MEAS; N="save putback";;
  M137)  B=c137; S=$MEAS; N="save putback";;
  K63)   B=b63;  S=$CTRL; N="save putback";;
  K137)  B=c137; S=$CTRL; N="save putback";;
  A63a)  B=b63;  S=$ADA;  N="none save putback";;
  A63b)  B=b63;  S=$ADB;  N="none save putback";;
  A137a) B=c137; S=$ADA;  N="none save putback";;
  A137b) B=c137; S=$ADB;  N="none save putback";;
  F63)   B=b63;  S="FBT FBTC FSHd FSHdC"; N="none save putback";;
  F137)  B=c137; S="FBT FBTC FSHd FSHdC"; N="none save putback";;
  *) echo "unknown chunk $1"; exit 2;;
esac
for s in $S; do for n in $N; do
  QTAIL=none $C/rr.sh $B $s $n r >/dev/null
  echo "$(tail -1 $C/logs/runs.txt) | $(grep -h '^SUMMARY' $C/logs/r-$B-$s-$n.log)"
done; done
