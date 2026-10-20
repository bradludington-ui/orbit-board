#!/usr/bin/env python3
"""focus-block.py <suite.mjs> <out.mjs> <header-prefix> : a FOCUSED copy of one suite that runs only the block whose header
comment starts with <header-prefix> (the "// ==== ..." line above its `await (async () => {`). Every other top-level
`await (async () => {` becomes `false && (async () => {`, so it is defined but never called; helpers and imports stay as
written. Write <out.mjs> beside the suite (same folder, so its relative imports resolve). Run it with BOARD=<board> and
SUITE_CHECKS=<file.jsonl>; read the verdicts from that file (one JSON line per check: [scenario, where, what, pass, got]).
The run exits 1 because the other blocks' "this scenario never ran" guards fire; that is expected. Used for F4 (20 Oct):
the U10 file/ladder block in 30 s instead of the whole audit-recon. Run with python3 -I."""
import sys
src, out, hdr = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(src, encoding='utf-8').read().split('\n')
h = [i for i, l in enumerate(s) if l.startswith(hdr)]
assert len(h) == 1, ('header must match exactly one line', len(h))
h = h[0]; kept = off = 0
for i, l in enumerate(s):
    if l.startswith('await (async () => {'):
        if h < i < h + 20: kept += 1
        else: s[i] = l.replace('await (async () => {', 'false && (async () => {', 1); off += 1
assert kept == 1, ('no block starts within 20 lines of the header', kept)
open(out, 'w', encoding='utf-8').write('\n'.join(s)); print('kept', kept, 'off', off)
