# mkfocused-u2.py <audit-import.mjs> <out.mjs> <first block marker> <end marker> : ADAPTED from reuse/mkfocused-import.py (only the block range
# and the header text changed): a FOCUSED audit-import harness, everything copied VERBATIM from the suite:
# its imports, the failure list, keepBoards, SEEN/chk, the four v2.00 blocks (R3, R3 message, R4/R4b, R5), the scenario-ran
# guard and summary, and -- by closure -- every TOP-LEVEL helper those reference, transitively (in source order). The three
# whole-board fixtures keepBoards names (V185W, V186L, V14) are deliberately left out: keepBoards guards them with try/catch.
import sys, re
src=open(sys.argv[1],encoding='utf-8').read(); L=src.split('\n')
DEF=re.compile(r'^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\b|^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(')
def extent(s):
    if L[s].rstrip().endswith(';') and not L[s].rstrip().endswith('{'):
        # one-liner unless the following line is an indented continuation
        if s+1>=len(L) or not (L[s+1].startswith(' ') or L[s+1].startswith('\t')): return s
    for i in range(s+1,len(L)):
        t=L[i]
        if not t: continue
        if t[0] in '})': return i
        if not t[0].isspace(): return i-1
    return len(L)-1
top={}
for i,l in enumerate(L):
    m=DEF.match(l)
    if m:
        n=m.group(1) or m.group(2)
        if n not in top: top[n]=(i,extent(i))
SKIP={'V185W','V186L','V14'}
def lines(a,b): return '\n'.join(L[a:b+1])
a=L.index('let failures = [];'); c=next(i for i in range(a,len(L)) if L[i].startswith('const chk = (scenario')); c=extent(c)
imports=[l for i,l in enumerate(L[:a]) if l.startswith('import ')]
head=lines(a,c)
bs=next(i for i,l in enumerate(L) if l==sys.argv[3])
be=next(i for i,l in enumerate(L) if i>bs and l==sys.argv[4])
blocks=lines(bs,be)
gi=next(i for i,l in enumerate(L) if l=="  const src = _selfRead(_selfPath(import.meta.url), 'utf8');"); gs=gi-2
assert L[gs].startswith('await (async () => {') and L[gs+1]=='  const __bm = bootMark();'
tail='\n'.join(L[gs:])
have=set(); inside=set(range(a,c+1))|set(range(bs,be+1))|set(range(gs,len(L)))
for n,(s,e) in top.items():
    if s in inside: have.add(n)
need=[]; text=head+'\n'+blocks
changed=True
while changed:
    changed=False
    for n,(s,e) in sorted(top.items(), key=lambda kv: kv[1][0]):
        if n in have or n in SKIP: continue
        if re.search(r'(?<![\w$.])'+re.escape(n)+r'(?![\w$])', text):
            have.add(n); need.append(n); text+='\n'+lines(s,e); changed=True
helpers='\n'.join(lines(*top[n]) for n in sorted(need, key=lambda n: top[n][0]))
out=('// FOCUSED harness (reuse review): VERBATIM from the suite given -- imports, failure list, keepBoards, SEEN/chk, the\n'
     '// v2.00 (U2) block(s) '+repr(sys.argv[3])+' .. '+repr(sys.argv[4])+', the top-level helpers they reference (closure: '+', '.join(sorted(need))+'), the guard. Not the full suite.\n'
     +'\n'.join(imports)+'\n'+head+'\n'+helpers+'\n'+blocks+'\n'+tail)
open(sys.argv[2],'w',encoding='utf-8').write(out); print('written', sys.argv[2], out.count('\n'),'lines; helpers:', ' '.join(sorted(need)))
