# show.py <checks.jsonl> [only-fail] : one line per recorded check (verdict | place | claim | observed)
import json, sys
n = f = 0
only = len(sys.argv) > 2
for l in open(sys.argv[1], encoding='utf-8'):
    s, w, what, ok, got = json.loads(l)
    n += 1; f += (not ok)
    if only and ok: continue
    print('PASS' if ok else 'FAIL', '|', w[:70], '|', what[:110], '|', str(got)[:200])
print('checks', n, 'failing', f)
