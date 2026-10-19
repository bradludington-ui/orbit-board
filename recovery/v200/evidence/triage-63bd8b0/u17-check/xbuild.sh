#!/bin/bash
# xbuild.sh : x-probe.mjs = a one-line header + the builder's head.mjs + the W1H block (both verbatim, cmp'd) + src/x-body.mjs; node --check.
set -e
C=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17-check
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17
cmp $C/probe/head.mjs $U/src/head.mjs && cmp $C/probe/w1h.mjs $U/src/w1h.mjs && echo "head + w1h verbatim from the builder"
{ echo "// x-probe.mjs -- the U17 CHECKER's adversarial routes (rec/L4/u17-check); the header below is the builder's, verbatim."; cat $C/probe/head.mjs $C/probe/w1h.mjs $C/src/x-body.mjs; } > $C/x-probe.mjs
node --check $C/x-probe.mjs && echo "node --check ok"
for f in src/x-body.mjs x-probe.mjs q.sh rr.sh mm.sh xbuild.sh; do echo "$f $(git hash-object $C/$f)"; done
