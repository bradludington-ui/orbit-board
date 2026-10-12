# ctl.py <before.jsonl> <after.jsonl> : the checks labelled "(a CONTROL)", the (5) controls, and the relabelled
# "(a precondition ...)" checks -- how many, and how many fail on each board.
import json, sys
def load(p): return [json.loads(l) for l in open(p, encoding='utf-8')]
b, a = load(sys.argv[1]), load(sys.argv[2])
assert [x[1:3] for x in b] == [x[1:3] for x in a], 'the two runs do not hold the same checks'
def grp(x):
    if '(a CONTROL)' in x[2]: return 'labelled (a CONTROL)'
    if x[1].startswith('(5)'): return '(5) controls Cc/Cb/Ca (all checks in them)'
    if '(a precondition' in x[2]: return 'relabelled (a precondition ...)'
    return None
out = {}
for xb, xa in zip(b, a):
    g = grp(xb)
    if not g: continue
    o = out.setdefault(g, [0, 0, 0]); o[0] += 1; o[1] += (not xb[3]); o[2] += (not xa[3])
for g, (n, fb, fa) in out.items(): print(f'{g}: {n} checks; fail on before {fb}; fail on after {fa}')
