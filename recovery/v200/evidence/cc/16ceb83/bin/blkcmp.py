# blkcmp.py <commit.jsonl> <parent.jsonl> [builder.jsonl] : per scenario, checks and passes on the commit and the parent; failing records;
# for records outside the U4 scenario, whether checks, verdicts and values are the same on both; optionally the same against a builder record.
import json, sys, collections
def load(p): return [json.loads(l) for l in open(p, encoding='utf-8') if l.strip()]
c,p=load(sys.argv[1]),load(sys.argv[2])
U4='v2.00 (U4)'
for nm,x in (('commit',c),('parent',p)):
    print(nm, 'records', len(x), 'failing', sum(r[3] is not True for r in x), 'failing outside U4', sum(r[3] is not True for r in x if not r[0].startswith(U4)))
sc=collections.OrderedDict()
for r in c: sc.setdefault(r[0],[0,0,0,0]); sc[r[0]][0]+=1; sc[r[0]][1]+=(r[3] is True)
for r in p: sc.setdefault(r[0],[0,0,0,0]); sc[r[0]][2]+=1; sc[r[0]][3]+=(r[3] is True)
for s,v in sc.items(): print('  %-95s commit %d/%d pass, parent %d/%d pass' % (s[:95], v[1], v[0], v[3], v[2]))
key=lambda r:(r[0],r[1],r[2])
def same(a,b,excl):
    da={key(r):(r[3],r[4]) for r in a if not (excl and r[0].startswith(U4))}; db={key(r):(r[3],r[4]) for r in b if not (excl and r[0].startswith(U4))}
    return len(da), len(db), da==db, sum(da[k]!=db[k] for k in set(da)&set(db))
print('outside U4, commit vs parent: n=%d/%d, identical checks/verdicts/values: %s (differing %d)' % same(c,p,True))
if len(sys.argv)>3:
    b=load(sys.argv[3]); print('commit vs builder record %s, all records: n=%d/%d, identical: %s (differing %d)' % ((sys.argv[3].split('/')[-1],)+same(c,b,False)))
