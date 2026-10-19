# cmpchecks.py <mine.jsonl> <theirs.jsonl> : the same checks in the same order? verdict and value (all fields) equal?
import json,sys
a=[json.loads(l) for l in open(sys.argv[1],encoding='utf-8')]; b=[json.loads(l) for l in open(sys.argv[2],encoding='utf-8')]
print('records', len(a), len(b))
ka=[(r[0],r[1]) for r in a]; kb=[(r[0],r[1]) for r in b]
print('same keys in same order:', ka==kb)
dv=[k for k,x,y in zip(ka,a,b) if x[3]!=y[3]]; dd=[k for k,x,y in zip(ka,a,b) if x!=y]
print('verdict differs:', len(dv), dv[:5]); print('any field differs:', len(dd))
for k,x,y in zip(ka,a,b):
    if x!=y: print('  DIFF', k[1], '\n    mine  ', json.dumps(x[2:])[:300], '\n    theirs', json.dumps(y[2:])[:300])
