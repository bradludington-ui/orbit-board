# tally.py <checks.jsonl> [reference.jsonl] : per scenario: checks, pass, fail; CONTROL checks (CONTROL in where or what) and how many fail;
# failing checks listed. With a reference stream (the builder's): the same (scenario, where, what) set? verdicts equal? values equal?
import json, sys, collections
def load(p): return [json.loads(l) for l in open(p, encoding='utf-8') if l.strip()]
a = load(sys.argv[1]); per = collections.OrderedDict()
for s, w, what, ok, got in a:
    k = per.setdefault(s, dict(n=0, p=0, f=0, ctl=0, ctl_f=0, nonctl_f=0, nonctl=0))
    c = 'CONTROL' in w or 'CONTROL' in what
    k['n'] += 1; k['p' if ok else 'f'] += 1
    if c: k['ctl'] += 1; k['ctl_f'] += (not ok)
    else: k['nonctl'] += 1; k['nonctl_f'] += (not ok)
tot = dict(n=len(a), p=sum(1 for r in a if r[3]), f=sum(1 for r in a if not r[3]))
print('TOTAL', json.dumps(tot))
for s, k in per.items(): print(f"{k['n']:3d} checks {k['p']:3d} pass {k['f']:3d} fail | controls {k['ctl']} ({k['ctl_f']} fail) | non-controls {k['nonctl']} ({k['nonctl_f']} fail) | {s[:90]}")
for s, w, what, ok, got in a:
    if not ok: print('  FAIL |', s[:28], '|', w[:100], '|', what[:70])
if len(sys.argv) > 2:
    b = load(sys.argv[2]); key = lambda r: (r[0], r[1], r[2])
    da = {key(r): r for r in a}; db = {key(r): r for r in b}
    sa, sb = set(da), set(db)
    print('REF compare: only-here', len(sa - sb), 'only-in-ref', len(sb - sa), 'verdict-differs', sum(1 for k in sa & sb if da[k][3] != db[k][3]),
          'value-differs', sum(1 for k in sa & sb if da[k][4] != db[k][4]), 'order-equal', [key(r) for r in a] == [key(r) for r in b])
    for k in sorted(sa & sb):
        if da[k][3] != db[k][3]: print('  VERDICT DIFFERS |', k[1][:90], '|', k[2][:60], '| here', da[k][3], 'ref', db[k][3])
    for k in sorted(sa ^ sb): print('  ONLY', 'here' if k in sa else 'ref', '|', k[0][:30], '|', k[1][:80], '|', k[2][:60])
