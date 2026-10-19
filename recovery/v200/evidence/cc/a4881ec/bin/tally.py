# tally.py <run.checks.jsonl> [reference.checks.jsonl] : text only. Each line of a SUITE_CHECKS record is
# [suite, scenario, label, verdict, value]. A check is a CONTROL when its label says "(a CONTROL)" or its scenario "(a CONTROL"
# (the convention the round-5 tests review used, bin/ctl.py); "(14)" scenarios are the declared guard.
# Prints: totals, fails among controls / non-controls / guard, fails per scenario (by its "(n)" tag), and the failing labels.
# With a reference record: the same checks in the same order, verdicts compared (and values counted where they differ).
import json, sys, re
def load(p):
    return [json.loads(l) for l in open(p, encoding='utf-8') if l.strip()]
R = load(sys.argv[1])
def tag(sc):
    m = re.match(r'\((\w+)\)', sc or ''); return m.group(1) if m else (sc or '')[:30]
ctl = lambda r: '(a CONTROL)' in (r[2] or '') or '(a CONTROL' in (r[1] or '')   # a scenario may say "(a CONTROL: ...)"
fails = [r for r in R if r[3] is not True]
c = [r for r in R if ctl(r)]; n = [r for r in R if not ctl(r)]
g = [r for r in n if tag(r[1]) == '14']
print('checks', len(R), 'pass', len(R) - len(fails), 'fail', len(fails))
print('controls', len(c), 'failing', sum(r[3] is not True for r in c), '| non-controls', len(n), 'failing', sum(r[3] is not True for r in n),
      '| guard (14) non-controls', len(g), 'failing', sum(r[3] is not True for r in g))
per = {}
for r in R:
    t = tag(r[1]); a = per.setdefault(t, [0, 0]); a[1] += 1; a[0] += r[3] is not True
print('per scenario (fail/total):', ', '.join('(%s) %d/%d' % (t, a[0], a[1]) for t, a in per.items()))
for r in fails:
    print('  FAIL', ('[CONTROL] ' if ctl(r) else '') + r[1][:70], '::', r[2][:150])
if len(sys.argv) > 2:
    Q = load(sys.argv[2])
    key = lambda r: (r[1], r[2])
    same_order = [key(r) for r in R] == [key(r) for r in Q]
    dv = [(a, b) for a, b in zip(R, Q) if a[3] != b[3]]
    dval = [(a, b) for a, b in zip(R, Q) if a[3] == b[3] and a[4] != b[4]]
    print('vs', sys.argv[2].split('/')[-1], ': same checks in same order:', same_order, '| verdicts differing:', len(dv), '| values differing (same verdict):', len(dval))
    for a, b in dv: print('  VERDICT DIFF', a[1][:60], '::', a[2][:100], a[3], b[3])
    for a, b in dval: print('  value diff', a[1][:50], '::', a[2][:80], '|', str(a[4])[:90], '|', str(b[4])[:90])
