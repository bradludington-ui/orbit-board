# ctl.py <checks.jsonl> : (fix round) every check labelled "(a CONTROL)" or "(a precondition" -- its verdict, place and claim.
import json, sys
c = p = cf = pf = 0
for l in open(sys.argv[1], encoding='utf-8'):
    s, w, what, ok, got = json.loads(l)
    if '(a CONTROL)' in what: c += 1; cf += (not ok); print('CONTROL', 'PASS' if ok else 'FAIL', '|', w[:70], '|', what[:80])
    if '(a precondition' in what: p += 1; pf += (not ok); print('PRECOND', 'PASS' if ok else 'FAIL', '|', w[:70], '|', what[:80])
print('controls', c, 'failing', cf, '; preconditions', p, 'failing', pf)
