# fails.py <checks.jsonl>... : per file, the number of checks recorded, passing and failing, and each failing check as
# "<scenario> | <case> | <check> | got <value>" (SUITE_CHECKS rows: [scenario, case, check, passed, got]).
import json, sys
for f in sys.argv[1:]:
    rows = [json.loads(l) for l in open(f, encoding='utf-8') if l.strip()]
    bad = [r for r in rows if not r[3]]
    print('%s: %d checks, %d pass, %d fail' % (f.split('/')[-1], len(rows), len(rows) - len(bad), len(bad)))
    for r in bad: print('  FAIL', r[0].split(' — ')[0], '|', r[1][:90], '|', r[2][:140], '| got', str(r[4])[:160])
