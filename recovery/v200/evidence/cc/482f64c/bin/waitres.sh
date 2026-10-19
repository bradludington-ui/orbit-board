#!/bin/bash
# waitres.sh <minAvailMB> <maxLoad1> <maxSeconds> : polls every 20 s (read-only: /proc/meminfo, /proc/loadavg) until MemAvailable >= minAvailMB
# and the 1-minute load <= maxLoad1, or maxSeconds pass. Prints each poll; exit 0 when met, 1 when not. Run under bx.sh (600 s cap).
need=$1; maxl=$2; lim=$3; t=0
while :; do
  av=$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo); l1=$(cut -d' ' -f1 /proc/loadavg)
  ok=$(python3 -I -c "print(1 if $av>=$need and $l1<=$maxl else 0)")
  echo "$(TZ=America/New_York date '+%H:%M:%S %Z') avail=${av}MB load1=$l1 ok=$ok"
  [ $ok = 1 ] && exit 0
  [ $t -ge $lim ] && exit 1
  sleep 20; t=$((t+20))
done
