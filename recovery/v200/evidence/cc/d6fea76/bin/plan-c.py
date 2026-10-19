# plan-c.py : text only. For each of the commit's 78 earlier v200-cycreg entries, the part (h-p1 / h-p2) that holds the check the builder
# recorded failing first for it (round 6's first-failure runs, fr6/mutant-failures-fx11.txt; round 7's full runs, fr7/out/mutant-failures-fx12.txt),
# located by its "where | what" in the builder's fr8 runs of h-p1 (H8-P1-fr8) and h-p2 (H8-P2-fr8-b), with its position in that part.
import json, sys, re
Y, F = sys.argv[1], sys.argv[2]
def load(p): return [json.loads(l) for l in open(p, encoding='utf-8') if l.strip()]
P = {'h-p1.mjs': load(Y + '/fr8/out/H8-P1-fr8.checks.jsonl'), 'h-p2.mjs': load(Y + '/fr8/out/H8-P2-fr8-b.checks.jsonl')}
pos = {}
for part, rows in P.items():
    for i, r in enumerate(rows): pos.setdefault(r[1] + ' | ' + r[2], (part, i, len(rows)))
first = {}
for fn in (Y + '/fr6/mutant-failures-fx11.txt', Y + '/fr7/out/mutant-failures-fx12.txt'):
    cur = None
    for l in open(fn, encoding='utf-8'):
        m = re.match(r'== (?:FX12-mut-)?(v200-cycreg-[a-z0-9-]+?)(?:-b)? \(', l)
        if m: cur = m.group(1); continue
        m = re.match(r'\s+(?:- |FAIL )(.*)$', l)
        if m and cur and cur not in first: first[cur] = m.group(1).strip()
ids = [l.strip() for l in open(F + '/out/new-ids.txt') if l.strip()]
new8 = {'v200-cycreg-cycle-unchangeable', 'v200-cycreg-lock-nt-unsaid', 'v200-cycreg-lock-reserved-unsaid'}
out = []
for i in ids:
    if i in new8: continue
    f = first.get(i); p = pos.get(f) if f else None
    out.append((i, p[0] if p else '?', p[1] if p else -1, p[2] if p else -1, (f or 'NO RECORD')[:150]))
for o in out: print('\t'.join(map(str, o)))
print('#', len(out), 'entries;', sum(o[1] == 'h-p1.mjs' for o in out), 'in h-p1;', sum(o[1] == 'h-p2.mjs' for o in out), 'in h-p2;', sum(o[1] == '?' for o in out), 'unlocated', file=sys.stderr)
