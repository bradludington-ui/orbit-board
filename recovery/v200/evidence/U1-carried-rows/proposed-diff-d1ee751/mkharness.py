# mkharness.py <audit-recon.mjs> <u1-block> <out> : a FOCUSED audit-recon harness -- the suite's own preamble helpers, the
# committed R1 and R1-follow-up blocks and the scenario-ran guard copied VERBATIM from the suite, plus the draft U1 block.
import sys
src=open(sys.argv[1],encoding='utf-8').read(); L=src.split('\n'); blk=open(sys.argv[2],encoding='utf-8').read()
def lines(a,b): return '\n'.join(L[a-1:b])
def between(start, end):
    i=src.index(start); j=src.index(end, i)+len(end); return src[i:j]
def one(prefix):
    hits=[l for l in L if l.startswith(prefix)]; assert len(hits)==1,(prefix,len(hits)); return hits[0]
pre=[lines(16,36), lines(37,38),
     '\n'.join(L[L.index(one('const num = v =>'))-0: L.index(one('const num = v =>'))+2]),
     between('const w6Book = (W, fn) =>', "return JSON.stringify(await xlsxRead(ab)); })()`);"),
     one('const w6Lbl = r =>'),
     between("import { appendFileSync as _w5Append } from 'node:fs';", "  chk(scenario, where, String(what), String(got), String(want));\n};")]
r1=between('// ==== v2.00 (R1): funds flow', '// ==== end v2.00 (R1) ====')
r1b=between("// ==== v2.00 (R1, Brad's decisions of 11 Oct)", "// ==== end v2.00 (R1, Brad's decisions of 11 Oct) ====")
tail=src[src.index("{\n  const src = _selfRead(_selfPath(import.meta.url), 'utf8');"):]
out='// FOCUSED HARNESS (U1 draft): audit-recon preamble helpers, the R1 and R1-follow-up blocks and the guard, VERBATIM from the suite; then the draft U1 block.\n'+'\n'.join(pre)+'\n'+r1+'\n'+r1b+'\n'+blk+'\n'+tail
open(sys.argv[3],'w',encoding='utf-8').write(out); print('written', sys.argv[3], len(out.split('\n')), 'lines')
