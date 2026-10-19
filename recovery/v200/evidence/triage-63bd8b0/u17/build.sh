#!/bin/bash
# build.sh : u17-probe.mjs = src/head.mjs + the W1H block (verbatim from b63's audit-import.mjs L3745-3813, checked identical
# to c137's and to rec/L2/u13codex/w1h-block.txt) + src/body.mjs; then `node --check` of the result. Text only otherwise.
set -e
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17
W=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L2/u13codex/w1h-block.txt
sed -n '3745,3813p' $U/b63/tools/export-audit/audit-import.mjs > $U/src/w1h.mjs
cmp $U/src/w1h.mjs $W && echo "W1H block (b63 L3745-3813) identical to u13codex/w1h-block.txt"
sed -n '3745,3813p' $U/c137/tools/export-audit/audit-import.mjs | cmp - $W && echo "c137 L3745-3813 identical too"
cat $U/src/head.mjs $U/src/w1h.mjs $U/src/body.mjs > $U/u17-probe.mjs
node --check $U/u17-probe.mjs && echo "node --check ok"
for f in src/head.mjs src/w1h.mjs src/body.mjs u17-probe.mjs q.sh build.sh; do echo "$f $(git hash-object $U/$f)"; done
