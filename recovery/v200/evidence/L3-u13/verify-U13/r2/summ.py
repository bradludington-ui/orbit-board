# summ.py <checks.jsonl>... : per run, total checks, failing checks, harness throws, CONTROL failures, and the cases failing.
import json, sys, os, re
for p in sys.argv[1:]:
    rows = [json.loads(l) for l in open(p, encoding='utf-8')]
    f = [r for r in rows if not r[3]]
    thr = sum(1 for r in f if r[1] == 'harness')
    ctl = sum(1 for r in f if '(a CONTROL)' in r[2] or r[1].startswith('(5)') and 'CONTROL' in r[2])
    cases = {}
    for r in f:
        k = re.match(r'\((\d[a-d]?)\)|the fixture', r[1]); k = k.group(1) if k and k.group(1) else r[1][:12]
        cases[k] = cases.get(k, 0) + 1
    print(os.path.basename(p).replace('.checks.jsonl', ''), '|', len(rows), 'checks |', len(f), 'fail | throws', thr, '| CONTROL fails', ctl, '|', ' '.join(f'{k}:{v}' for k, v in cases.items()))
