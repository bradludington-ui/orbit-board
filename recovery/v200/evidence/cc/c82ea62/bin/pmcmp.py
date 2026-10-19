# pmcmp.py <diffA> <diffB> : compare the added (+) and removed (-) lines, in order, of two unified diffs (headers skipped).
import sys
def pm(p):
    out=[]
    for l in open(p,encoding='utf-8',errors='surrogateescape').read().split('\n'):
        if l.startswith('+++') or l.startswith('---'): continue
        if l[:1] in '+-' and l: out.append(l)
    return out
a,b=pm(sys.argv[1]),pm(sys.argv[2])
print('A +%d -%d | B +%d -%d | equal=%s' % (sum(1 for x in a if x[0]=='+'),sum(1 for x in a if x[0]=='-'),sum(1 for x in b if x[0]=='+'),sum(1 for x in b if x[0]=='-'),a==b))
if a!=b:
    for i,(x,y) in enumerate(zip(a,b)):
        if x!=y: print('first difference at', i, repr(x[:160]), repr(y[:160])); break
    else: print('length differs', len(a), len(b))
