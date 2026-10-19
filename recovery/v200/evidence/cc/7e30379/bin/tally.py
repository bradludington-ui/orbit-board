# tally.py <checks.jsonl> [--list] : per scenario: recorded checks, pass, fail; controls (what starts "CONTROL") apart. --list prints failing checks.
import json, sys, collections
rows = [json.loads(l) for l in open(sys.argv[1], encoding='utf-8') if l.strip()]
T = collections.OrderedDict()
for sc, where, what, ok, got in rows:
    t = T.setdefault(sc, dict(n=0, p=0, f=0, cp=0, cf=0, np=0, nf=0))
    t['n'] += 1; ctl = str(what).startswith('CONTROL')
    t['p' if ok else 'f'] += 1
    t[('c' if ctl else 'n') + ('p' if ok else 'f')] += 1
for sc, t in T.items():
    print(f"{sc[:70]:70} | {t['n']:3} checks | pass {t['p']:3} fail {t['f']:3} | controls {t['cp']}p/{t['cf']}f | non-controls {t['np']}p/{t['nf']}f")
print('TOTAL', len(rows), 'recorded;', sum(1 for r in rows if not r[3]), 'failing')
if '--list' in sys.argv:
    for sc, where, what, ok, got in rows:
        if not ok: print('  FAIL', '[' + sc[:45] + '…]', where, '|', what)
