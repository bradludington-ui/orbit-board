#!/bin/bash
# overlap-watch.sh <outdir> <clone> <label> : RECORDS ONLY (never kills). While <outdir>/RUNNING exists, every 3 s it lists node,
# Chromium and Playwright-browser processes whose cwd is not <clone> (the run's own copy) -- including any already running
# when the run starts -- and appends each one once to <outdir>/OVERLAP.txt with its pid, pgid, time seen (ET), cwd and
# command, between "<label> watch start" and "<label> watch end" lines. No OVERLAP line between them means nothing of that
# kind was seen alongside the run (sampled every 3 s, so a process shorter than that can be missed).
O=$1; C=$(readlink -f "$2"); N=$3; declare -A seen
while [ ! -e "$O/RUNNING" ]; do sleep 1; done
echo "$N watch start $(TZ=America/New_York date '+%I:%M:%S %p ET')" >> "$O/OVERLAP.txt"
while [ -e "$O/RUNNING" ]; do
  for p in $(pgrep -x node; pgrep -f '^/opt/pw-browsers'; pgrep -x chrome; pgrep -x chromium) ; do
    [ -n "${seen[$p]}" ] && continue; seen[$p]=1
    cwd=$(readlink -f /proc/$p/cwd 2>/dev/null); [ "$cwd" = "$C" ] && continue
    case "$cwd" in "$C"/*) continue;; esac
    echo "$N OVERLAP $(TZ=America/New_York date '+%I:%M:%S %p ET') pid=$p pgid=$(ps -o pgid= -p $p 2>/dev/null | tr -d ' ') cwd=$cwd cmd=$(tr '\0' ' ' < /proc/$p/cmdline 2>/dev/null | cut -c1-200)" >> "$O/OVERLAP.txt"
  done
  sleep 3
done
echo "$N watch end $(TZ=America/New_York date '+%I:%M:%S %p ET')" >> "$O/OVERLAP.txt"
