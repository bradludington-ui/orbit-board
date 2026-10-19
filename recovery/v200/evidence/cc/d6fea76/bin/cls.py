# cls.py <p1.checks.jsonl> <p2.checks.jsonl> : text only. Classifies each check of the block as fixture (where ends " · fixture"),
# CONTROL (the word in its where or label, not a fixture), GUARD (the word in its where or label, not a control) or a defect check,
# and counts pass / fail in each class.
import json, sys
R = [json.loads(l) for p in sys.argv[1:3] for l in open(p, encoding='utf-8') if l.strip()]
def k(r):
    if r[1].endswith(' · fixture'): return 'fixture'
    if 'CONTROL' in r[1] or 'CONTROL' in r[2]: return 'control'
    if 'GUARD' in r[1] or 'GUARD' in r[2]: return 'guard'
    return 'defect'
c = {}
for r in R: x = c.setdefault(k(r), [0, 0]); x[0 if r[3] is True else 1] += 1
print(len(R), 'checks;', '; '.join('%s %d (pass %d, fail %d)' % (a, b[0] + b[1], b[0], b[1]) for a, b in sorted(c.items())),
      '| failing in all:', sum(b[1] for b in c.values()))
