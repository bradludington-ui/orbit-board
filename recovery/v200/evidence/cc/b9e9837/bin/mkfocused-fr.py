# mkfocused-fr.py <suite audit-recon.mjs> <out> <start-marker>... : rec/L3/u14's mkfocused.py (the suite's own preamble helpers,
# the named blocks and the scenario-ran guard, VERBATIM), plus the suite's own XLSX package reader w7Pkg and w7Ok -- top-level
# helpers the fix round's U34 block uses -- copied VERBATIM as well.
import sys
src = open(sys.argv[1], encoding='utf-8').read(); L = src.split('\n'); out_p = sys.argv[2]; starts = sys.argv[3:]
def lines(a, b): return '\n'.join(L[a-1:b])
def between(start, end):
    i = src.index(start); j = src.index(end, i) + len(end); return src[i:j]
def one(prefix):
    hits = [l for l in L if l.startswith(prefix)]; assert len(hits) == 1, (prefix, len(hits)); return hits[0]
assert L[15].startswith("import { boot, seed, stopAtFirstFailure, capture } from './boot.mjs';"), L[15]
assert L[36].startswith("const it = (id, grp, ask) =>"), L[36]
pre = [lines(16, 36), lines(37, 38),
       '\n'.join(L[L.index(one('const num = v =>')): L.index(one('const num = v =>')) + 2]),
       between('const w6Book = (W, fn) =>', "return JSON.stringify(await xlsxRead(ab)); })()`);"),
       one('const w6Lbl = r =>'),
       between("import { appendFileSync as _w5Append } from 'node:fs';", "  chk(scenario, where, String(what), String(got), String(want));\n};"),
       between('const w7Pkg = (W, fn) =>', "return JSON.stringify({bad:bad, nf:nf, xfs:xfs, fills:fills, counts:counts, sheets:sheets}); })()`));"),
       between('const w7Ok = pk =>', ".join(' · ');")]
blocks = []
for st in starts:
    i = src.index('// ==== ' + st); j = src.index('\n// ==== end ', i); k = src.index('\n', j + 1)
    blocks.append(src[i:k])
tail = src[src.index("{\n  const src = _selfRead(_selfPath(import.meta.url), 'utf8');"):]
out = ('// FOCUSED HARNESS: audit-recon preamble helpers, w7Pkg/w7Ok, the blocks ' + ' | '.join(starts) + ' and the guard, VERBATIM from ' + sys.argv[1] + '\n'
       + '\n'.join(pre) + '\n' + '\n'.join(blocks) + '\n' + tail)
open(out_p, 'w', encoding='utf-8').write(out); print('written', out_p, len(out.split('\n')), 'lines;', len(blocks), 'blocks')
