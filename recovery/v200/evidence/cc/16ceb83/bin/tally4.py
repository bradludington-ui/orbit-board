# tally4.py <checks.jsonl> [compare.jsonl ...] : counts checks / pass / fail, classifies each check as a control ("control" in its
# label, any case), kept behaviour ("kept behaviour" in its label) or a defect check (the rest); lists failing checks; with more
# streams, compares the (scenario, case, check) set, verdicts and values with each.
import json, sys
def load(p): return [json.loads(l) for l in open(p, encoding='utf-8') if l.strip()]
def kind(r):
    t=(r[1]+' '+r[2]).lower()
    return 'control' if 'control' in t else ('kept' if 'kept behaviour' in t else 'defect')
a=load(sys.argv[1])
by={}
for r in a:
    k=kind(r); d=by.setdefault(k,[0,0]); d[0]+=1; d[1]+= (r[3] is True)
print(json.dumps({'checks':len(a),'pass':sum(r[3] is True for r in a),'fail':sum(r[3] is not True for r in a),
  'by_kind_total_pass':by}, ensure_ascii=False))
for r in a:
    if r[3] is not True: print('  FAIL [%s] %s — %s | got %s' % (kind(r), r[1][:70], r[2][:90], str(r[4])[:80]))
for p in sys.argv[2:]:
    b=load(p); key=lambda r:(r[0],r[1],r[2])
    da={key(r):r for r in a}; db={key(r):r for r in b}
    sh=set(da)&set(db)
    print('vs', p.split('/')[-1], ': only here', len(set(da)-set(db)), 'only there', len(set(db)-set(da)), 'verdict differs', sum(da[k][3]!=db[k][3] for k in sh),
          'value differs', sum(da[k][4]!=db[k][4] for k in sh), 'dup keys here', len(a)-len(da))
