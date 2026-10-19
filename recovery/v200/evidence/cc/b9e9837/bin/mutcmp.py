# mutcmp.py <expected.json> <outdir> <ids.txt> : each mutant run's failing checks (U34 and U14) against the builder's README FR2.4
import json,sys,os
exp=json.load(open(sys.argv[1],encoding='utf-8')); od=sys.argv[2]; ids=[l.strip() for l in open(sys.argv[3]) if l.strip()]
caught=0; done=0
for i in ids:
    p=os.path.join(od,'M-%s.checks.jsonl'%i)
    if not os.path.exists(p): print('%-45s NOT RUN'%i); continue
    rows=[json.loads(l) for l in open(p,encoding='utf-8')]
    u14=[r for r in rows if '(U14)' in r[0]]; u34=[r for r in rows if '(U34)' in r[0]]
    f=[r[1] for r in u34 if r[3] is not True]; f14=[r[1] for r in u14 if r[3] is not True]
    done+=1; c=len(f)+len(f14)>0; caught+=c
    same = f==exp.get(i)
    print('%-45s records=%d U14 %d/%d U34 fail=%d %s %s%s'%(i,len(rows),len(u14)-len(f14),len(u14),len(f),'CAUGHT' if c else 'NOT CAUGHT','== builder' if same else '!= builder','' if same else ' mine=%s builder=%s'%(f,exp.get(i))))
print('run %d, caught %d'%(done,caught))
