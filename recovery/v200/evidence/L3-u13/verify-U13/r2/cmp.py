# cmp.py <mine.jsonl> <builder.jsonl> : compare two runs' recorded checks (verdict and observed value), in order.
# Prints: count, failing count for each, and every check whose verdict or observed value differs (times masked).
import json, re, sys
def load(p):
    return [json.loads(l) for l in open(p, encoding='utf-8')]
mask = lambda s: re.sub(r'\d{10,}', '<T>', re.sub(r'\d+ (second|minute|hour)s? (ago|from now)', '<AGE>', str(s)))
a, b = load(sys.argv[1]), load(sys.argv[2])
fa = sum(1 for x in a if not x[3]); fb = sum(1 for x in b if not x[3])
print('mine', len(a), 'checks,', fa, 'fail | builder', len(b), 'checks,', fb, 'fail')
d = 0
for i in range(max(len(a), len(b))):
    x = a[i] if i < len(a) else None; y = b[i] if i < len(b) else None
    if x is None or y is None or x[1:3] != y[1:3] or x[3] != y[3] or mask(x[4]) != mask(y[4]):
        d += 1; print('DIFF', i, (x or [None]*5)[1:4], '|', mask((x or [None]*5)[4])[:160], '||', (y or [None]*5)[3], mask((y or [None]*5)[4])[:160])
print('differences', d)
# failing places
pl = {}
for x in a:
    if not x[3]: pl[x[1]] = pl.get(x[1], 0) + 1
for k, v in pl.items(): print('  fail', v, '|', k)
