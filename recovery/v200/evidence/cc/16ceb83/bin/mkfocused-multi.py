# mkfocused-multi.py <audit-import.mjs> <out.mjs> <spec>... : ADAPTED from rec/L2/u2impl/mkfocused-u2.py (the closure and the
# copied parts are the same; only the block selection changed): a FOCUSED audit-import harness, everything copied VERBATIM from
# the suite given -- its imports, the failure list, keepBoards, SEEN/chk, the selected blocks (in suite order), the scenario-ran
# guard and summary, and, by closure, every TOP-LEVEL helper those reference, transitively, in source order. The three
# whole-board fixtures keepBoards names (V185W, V186L, V14) are left out, as in mkfocused-u2.py (keepBoards guards them).
# A <spec> is either  marker:<exact first line>|<exact last line>  (a "// ==== ..." block and its "// ==== end ..." line), or
# name:<scenario name>  (the "await (async" line before that scenario's "  const name = '...';" line, through the first
# "})();" line after it).
import sys, re
src=open(sys.argv[1],encoding='utf-8').read(); L=src.split('\n')
DEF=re.compile(r'^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\b|^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(')
def extent(s):
    if L[s].rstrip().endswith(';') and not L[s].rstrip().endswith('{'):
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
ranges=[]
for spec in sys.argv[3:]:
    kind,_,v=spec.partition(':')
    if kind=='marker':
        s,e=v.split('|',1)
        bs=[i for i,l in enumerate(L) if l==s]; assert len(bs)==1,(s,len(bs)); bs=bs[0]
        be=next(i for i,l in enumerate(L) if i>bs and l==e)
    else:
        nl=[i for i,l in enumerate(L) if l=="  const name = '"+v+"';"]; assert len(nl)==1,(v,len(nl)); nl=nl[0]
        bs=max(i for i in range(nl) if L[i].startswith('await (async'))
        be=next(i for i in range(nl,len(L)) if L[i]=='})();')
    ranges.append((bs,be))
ranges.sort()
for (x0,x1),(y0,y1) in zip(ranges,ranges[1:]): assert x1<y0,'overlapping ranges'
blocks='\n'.join(lines(x,y) for x,y in ranges)
gi=next(i for i,l in enumerate(L) if l=="  const src = _selfRead(_selfPath(import.meta.url), 'utf8');"); gs=gi-2
assert L[gs].startswith('await (async () => {') and L[gs+1]=='  const __bm = bootMark();'
tail='\n'.join(L[gs:])
have=set(); inside=set(range(a,c+1))|set(range(gs,len(L)))
for x,y in ranges: inside|=set(range(x,y+1))
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
out=('// FOCUSED harness: VERBATIM from '+sys.argv[1]+' -- imports, failure list, keepBoards, SEEN/chk, the selected blocks\n'
     '// (suite lines '+', '.join('%d-%d'%(x+1,y+1) for x,y in ranges)+'), the top-level helpers they reference (closure: '+', '.join(sorted(need))+'), the guard. Not the full suite.\n'
     +'\n'.join(imports)+'\n'+head+'\n'+helpers+'\n'+blocks+'\n'+tail)
open(sys.argv[2],'w',encoding='utf-8').write(out); print('written', sys.argv[2], out.count('\n'),'lines; ranges', ranges, '; helpers:', ' '.join(sorted(need)))
