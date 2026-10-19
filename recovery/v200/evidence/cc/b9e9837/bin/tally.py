# tally.py <checks.jsonl>... : per block (U14 / U34) total, pass, fail; and the failing checks' "where" labels
import json,sys
for p in sys.argv[1:]:
    rows=[json.loads(l) for l in open(p, encoding='utf-8')]
    by={}
    for r in rows:
        blk='U14' if '(U14)' in r[0] else ('U34' if '(U34)' in r[0] else r[0][:30])
        by.setdefault(blk,[]).append(r)
    print('==', p.split('/')[-1], 'records', len(rows))
    for b,rs in by.items():
        f=[r for r in rs if r[3] is not True]
        print('  %s: %d checks, %d pass, %d FAIL' % (b, len(rs), len(rs)-len(f), len(f)))
        for r in f: print('     FAIL:', r[1])
