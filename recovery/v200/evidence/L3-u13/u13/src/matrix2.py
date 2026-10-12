# matrix2.py <outdir> <label>... : (fix round) per run: board blob (from its log's IDS line), checks, failing, and the cases
# the failing checks are in (by the case's leading tag); then a verdict row per check across the runs.
import json, sys, os, re
od = sys.argv[1]; labels = sys.argv[2:]
rows = {}; order = []
for lb in labels:
    ids = next((json.loads(l[4:]) for l in open(os.path.join(od, '..', 'logs', lb + '.log'), encoding='utf-8') if l.startswith('IDS ')), {})
    n = f = 0; cases = []
    for l in open(os.path.join(od, lb + '.checks.jsonl'), encoding='utf-8'):
        s, w, what, ok, got = json.loads(l); n += 1
        k = (w, what)
        if k not in rows: rows[k] = {}; order.append(k)
        rows[k][lb] = 'P' if ok else 'F'
        if not ok:
            f += 1; m = re.match(r'\((\w+)\)( C\w)?', w); t = (m.group(0) if m else w[:12])
            if t not in cases: cases.append(t)
    print(f'{lb:42s} board {ids.get("board","?")[:8]} harness {ids.get("harnessBlob","?")[:8]} checks {n:3d} failing {f:3d}  {" ".join(cases)}')
print()
print('verdict per check (columns in the order given):')
for k in order:
    print(' '.join(rows[k].get(lb, '-') for lb in labels), '|', k[0][:44], '|', k[1][:100])
