#!/bin/bash
# mkreadme.sh : assembles README.md from the hand-written parts and tables generated now from logs/runs.txt, pids.txt and the
# check outputs. Read-only on everything except README.md and the regenerated logs/*-table.md files.
C=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u24-check
P=$C/logs/readme-parts
awk '{lbl=$1; st=""; ex=""; ws=""; for(i=2;i<=NF;i++){ if($i ~ /^start=/){ st=$i" "$(i+1)" "$(i+2); gsub(/start=|"/,"",st) } if($i ~ /^exit=/){ ex=$i; sub(/exit=/,"",ex) } if($i ~ /^wall_s=/){ ws=$i; sub(/wall_s=/,"",ws); ws=sprintf("%.1f", ws) } } if(ex!="") printf "| %s | %s | %s | %s |\n", lbl, st, ex, ws }' $C/logs/runs.txt > $C/logs/runs-table.md
awk '{lbl=$4; s=$1"("$3")"; if(!(lbl in m)){o[++n]=lbl; m[lbl]=s} else m[lbl]=m[lbl]", "s} END{for(i=1;i<=n;i++) printf "| %s | %s |\n", o[i], m[o[i]]}' $C/pids.txt > $C/logs/pids-table.md
{
  cat $P/1-head.md
  cat $P/2-runs.md; cat $C/logs/runs-table.md
  echo; echo "(This README's own assembly, \`mkreadme\`, and anything after it, are in \`logs/runs.txt\` and \`pids.txt\`, not in the tables above or below.)"
  cat $P/3-mid.md
  head -2 $C/logs/table-x1.md; grep '≠' $C/logs/table-x1.md
  cat $P/5-mid.md
  cat $C/logs/xtable-y4.md
  cat $P/7-pids.md; cat $C/logs/pids-table.md
  cat $P/8-tail.md
  echo; echo "README assembled at $(TZ=America/New_York date '+%-I:%M %p ET on %a %-d %b %Y') (by \`TZ=America/New_York date\`)."
} > $C/README.md
wc -l < $C/README.md
