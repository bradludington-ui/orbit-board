# mutsum.py <out dir> <ids file> : per mutant: exit (from logs/runs.txt), checks recorded, failing checks (scenario | where | what).
import json, sys, re, os
out, ids = sys.argv[1], [l.strip() for l in open(sys.argv[2]) if l.strip()]
runs = {}
for l in open(os.path.join(out, '..', 'logs', 'runs.txt'), encoding='utf-8'):
    m = re.match(r'(\S+) start_et="([^"]+)" exit=(\S+) wall_s=(\S+)', l)
    if m: runs[m.group(1)] = m.groups()[1:]
for i in ids:
    p = os.path.join(out, f'M-{i}.checks.jsonl')
    if not os.path.exists(p): print(f'{i}: NOT RUN'); continue
    a = [json.loads(l) for l in open(p, encoding='utf-8') if l.strip()]
    f = [r for r in a if not r[3]]
    st, ex, wall = runs.get('M-' + i, ('?', '?', '?'))
    print(f'{i}: start {st} exit {ex} wall {wall}s | {len(a)} checks, {len(f)} fail -> {"CAUGHT" if f and ex == "1" else "NOT CAUGHT"}')
    for r in f: print('    FAIL |', r[0][:40], '|', r[1][:110], '|', r[2][:70])
