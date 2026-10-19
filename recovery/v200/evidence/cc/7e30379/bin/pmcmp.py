# pmcmp.py <diffA> <diffB> : compare the +/- lines (in order, headers excluded) of two unified diffs; also hunk-wise (- and + per hunk).
import sys
def hunks(p):
    H=[]; cur=None
    for l in open(p, encoding='utf-8', errors='surrogateescape').read().split('\n'):
        if l.startswith('--- ') or l.startswith('+++ ') or l.startswith('diff ') or l.startswith('index '): continue
        if l.startswith('@@'): cur=[]; H.append(cur); continue
        if cur is not None and (l.startswith('+') or l.startswith('-')): cur.append(l)
    return H
a, b = hunks(sys.argv[1]), hunks(sys.argv[2])
fa=[l for h in a for l in h]; fb=[l for h in b for l in h]
print('A hunks', len(a), '+', sum(1 for l in fa if l[0]=='+'), '-', sum(1 for l in fa if l[0]=='-'))
print('B hunks', len(b), '+', sum(1 for l in fb if l[0]=='+'), '-', sum(1 for l in fb if l[0]=='-'))
print('changed lines equal, in order:', fa==fb)
print('hunk-wise equal:', a==b)
if fa!=fb:
    for i,(x,y) in enumerate(zip(fa,fb)):
        if x!=y: print('first difference at changed line', i, repr(x[:200]), repr(y[:200])); break
