# tally.py <checks.jsonl> [compare.jsonl] : counts checks, passes, fails; CONTROL checks (where name starts with CONTROL) and their verdicts;
# lists failing check names. With a second stream: same set of (scenario, where, what) and verdicts compared.
import json, sys
def load(p):
    out=[]
    for l in open(p, encoding='utf-8'):
        l=l.strip()
        if l: out.append(json.loads(l))
    return out
a=load(sys.argv[1])
ctl=[r for r in a if 'CONTROL' in r[1] or 'CONTROL' in r[2]]
fails=[r for r in a if r[3] is not True]
print(json.dumps({'checks':len(a),'pass':len(a)-len(fails),'fail':len(fails),'controls':len(ctl),'controls_failing':[r[1] for r in ctl if r[3] is not True]}, ensure_ascii=False))
for r in fails: print('  FAIL:', r[1], '|', r[2][:110])
if len(sys.argv)>2:
    b=load(sys.argv[2]); key=lambda r:(r[0],r[1],r[2])
    da={key(r):r for r in a}; db={key(r):r for r in b}
    print('only in first',len(set(da)-set(db)),'only in second',len(set(db)-set(da)), 'verdict differs',sum(1 for k in set(da)&set(db) if da[k][3]!=db[k][3]), 'value differs', sum(1 for k in set(da)&set(db) if da[k][4]!=db[k][4]))
