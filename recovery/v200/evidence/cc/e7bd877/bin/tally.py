# tally.py <run.checks.jsonl> [reference.checks.jsonl] : text only. Each SUITE_CHECKS line is [scenario, where, label, verdict, value].
# Per block (its "v2.00 (<tag>)"): checks, pass, fail, and controls (label holds "CONTROL", the block's own convention) pass/fail.
# Each failing check is listed. With a reference: the same checks in the same order, verdicts and values compared.
import json, sys, re
def load(p): return [json.loads(l) for l in open(p, encoding='utf-8') if l.strip()]
R = load(sys.argv[1]); by = {}
for r in R:
    m = re.match(r'v2\.00 \(([^)]*)\)', r[0]); k = m.group(1) if m else r[0][:20]
    b = by.setdefault(k, [0, 0, 0, 0, 0, 0]); ctl = 'CONTROL' in r[2]; ok = r[3] is True
    b[0] += 1; b[1 if ok else 2] += 1
    if ctl: b[3] += 1; b[4 if ok else 5] += 1
print(sys.argv[1].split('/')[-1], len(R), 'checks;', '; '.join('%s %d: %d pass %d fail (controls %d: %d pass %d fail)' % (k, *v) for k, v in by.items()))
for r in R:
    if r[3] is not True: print('   FAIL', '[CONTROL]' if 'CONTROL' in r[2] else '', r[0][:14], '|', r[1][:40], '|', r[2][:110], '|| got', str(r[4])[:140])
if len(sys.argv) > 2:
    Q = load(sys.argv[2]); key = lambda r: (r[0], r[1], r[2])
    print('  vs', sys.argv[2].split('/')[-1], '(%d checks): same checks, same order: %s | verdicts differing: %d | values differing: %d' % (
        len(Q), [key(r) for r in R] == [key(r) for r in Q], sum(a[3] != b[3] for a, b in zip(R, Q)), sum(a[4] != b[4] for a, b in zip(R, Q))))
    for a, b in zip(R, Q):
        if a[3] != b[3] or a[4] != b[4]: print('   DIFF', a[1][:40], '|', a[2][:80], '|', a[3], str(a[4])[:80], '<>', b[3], str(b[4])[:80])
