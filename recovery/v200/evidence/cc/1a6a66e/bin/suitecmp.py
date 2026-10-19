# suitecmp.py <commit.checks.jsonl> <parent.checks.jsonl> : full audit-recon SUITE_CHECKS records, commit vs parent.
# Counts per scenario; failing records; which scenarios are only in the commit; for shared records, verdict/value equality.
import json, sys, collections
def load(p): return [json.loads(l) for l in open(p, encoding='utf-8') if l.strip()]
c, p = load(sys.argv[1]), load(sys.argv[2])
print('commit records', len(c), 'failing', sum(1 for r in c if r[3] is not True), '| parent records', len(p), 'failing', sum(1 for r in p if r[3] is not True))
sc = collections.Counter(r[0] for r in c); sp = collections.Counter(r[0] for r in p)
for s in sc: 
    if sc[s] != sp.get(s, 0): print('  scenario count differs:', s[:90], 'commit', sc[s], 'parent', sp.get(s, 0))
for s in sp:
    if s not in sc: print('  only in parent:', s[:90])
key = lambda r: (r[0], r[1], r[2])
dc = {key(r): r for r in c}; dp = {key(r): r for r in p}
sh = set(dc) & set(dp)
print('shared records', len(sh), 'verdict differs', sum(1 for k in sh if dc[k][3] != dp[k][3]), 'value differs', sum(1 for k in sh if dc[k][4] != dp[k][4]))
for k in sorted(sh):
    if dc[k][4] != dp[k][4]: print('   value differs:', k[0][:50], '|', k[1], '|', k[2][:60])
v2 = collections.Counter(r[0][:12] for r in c if r[0].startswith('v2.00'))
print('v2.00 scenarios in commit:', len([s for s in sc if s.startswith('v2.00')]), {s[:40]: (sc[s], sum(1 for r in c if r[0]==s and r[3] is True)) for s in sc if s.startswith('v2.00')})
