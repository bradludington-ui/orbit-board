# labels.py <base checks.jsonl>... : the labelling rule, checked on the board BEFORE the change. A check whose case or label says
# "CONTROL" must pass there; one whose label says "(a GUARD" must pass there; every other check must FAIL there. The Web Locks
# stand-in's own self-tests (scenario "... stand-in behaves as the API does") are a CONTROL of the stand-in. Prints each breach.
import json, sys
for f in sys.argv[1:]:
    rows = [json.loads(l) for l in open(f, encoding='utf-8') if l.strip()]
    n = {'control': [0, 0], 'guard': [0, 0], 'defect': [0, 0]}; bad = []
    for r in rows:
        k = 'control' if ('CONTROL' in r[1] or 'CONTROL' in r[2] or 'stand-in behaves' in r[0]) else 'guard' if '(a GUARD' in r[2] else 'defect'
        n[k][0 if r[3] else 1] += 1
        if (k in ('control', 'guard')) != bool(r[3]): bad.append((k, r))
    print('%s: %d checks | control pass %d fail %d | guard pass %d fail %d | defect pass %d fail %d | breaches %d' % (
        f.split('/')[-1], len(rows), *n['control'], *n['guard'], *n['defect'], len(bad)))
    for k, r in bad: print('  BREACH', k, '|', r[1][:80], '|', r[2][:110], '| passed', r[3], '| got', str(r[4])[:80])
