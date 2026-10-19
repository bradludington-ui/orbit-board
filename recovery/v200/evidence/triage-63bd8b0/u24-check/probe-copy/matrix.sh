#!/bin/bash
# matrix.sh <pass> [scenario...] : runs u24probe.mjs once per scenario, in order, each through run.sh (bounded: 600 s cap,
# own process group, PIDs to pids.txt, the AUDIT_IMPORT_RUNNING lock waited for before each). Output: out/<pass>-<scenario>.json.
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u24
P=$1; shift
ALL="SHc-fold-W SHc-fold-C1 SHc-fold-C2 SHc-file-W SHc-file-C1 SHc-file-C2 SHc-fold-Wclean SHc-fold-C1clean SHc-file-C1clean SHa-fold-Wclean SHa-fold-C1clean SHa-file-C1clean SHa-fold-W SHa-fold-Wnow SHa-fold-C1 SHa-fold-C2 SHa-file-W SHa-file-Wread SHa-file-C1 SHa-file-C2 BT-file-W BT-file-C1 BT-file-C2 BT-file-C3 BT-fold-W BT-fold-C1 BT-fold-C2 BT-fold-C3 IB-fold-W IB-fold-C1 IB-fold-C2 IB-fold-Wclean IB-fold-C1clean IB-file-W IB-file-C1 IB-file-C2 IB-file-Wclean IB-file-C1clean"
SC="$*"; [ -z "$SC" ] && SC="$ALL"
for s in $SC; do $U/run.sh $P-$s $U/u24probe.mjs $U/b63 $s $U/out/$P-$s.json; done
