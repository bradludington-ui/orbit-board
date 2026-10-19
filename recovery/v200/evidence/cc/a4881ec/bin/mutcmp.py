# mutcmp.py <ids.txt> : text only. For each U18 mutation id, this check's run out/M-<id>.checks.jsonl: exit (logs/runs.txt), the
# number of failing checks of 112, the scenarios they are in, each failing check; and its verdicts compared check by check with
# the builder's run of the same entry (rec/L6/u18/out/x4-<short> on fr4; x4e-<short> on c1e where it exists) and the round-5
# tests review's (verify-tests-r5/out/x5-<short>, on c1e). Writes out/mutant-table.txt and out/mutant-failing-checks.txt.
import json, sys, re, os
F = '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/a4881ec'
U = '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L6/u18'
README = {'recheck-gone': 57, 'first-copy-unchecked': 3, 'gone-written-in-place': 5, 'unreadable-written': 3, 'said-nothing-written': 8,
          'pen-line-kept': 6, 'stamp-moved': 13, 'other-year-choices': 1, 'autosave-unchecked': 3, 'stamp-name-moved': 3, 'stamp-on-view': 2,
          'pen-line-on-view': 1, 'other-year-unnamed': 1, 'stamp-compare': 2, 'view-says-saved': 3, 'view-pen-line': 1, 'autosave-silent': 1,
          'other-year-when-of-read': 1, 'read-again-first-copy': 1, 'other-year-advice': 1, 'storage-pen-line': 2, 'view-silent': 2,
          'view-stamp-name': 1, 'stamp-over-typed': 1, 'hold-before-reread': 3, 'late-for-every-clash': 1, 'hold-unsaid': 2,
          'pen-line-only-on-clash': 2, 'stamp-only-on-clash': 2}
def load(p):
    return [json.loads(l) for l in open(p, encoding='utf-8') if l.strip()] if os.path.exists(p) else None
runs = {}
for l in open(F + '/logs/runs.txt', encoding='utf-8'):
    m = re.match(r'(\S+) start_et="([^"]+)" exit=(\d+) wall_s=([\d.]+)', l)
    if m: runs[m.group(1)] = (m.group(2), int(m.group(3)), float(m.group(4)))
tab = []; det = []; allok = True
for mid in [l.strip() for l in open(sys.argv[1]) if l.strip()]:
    s = mid.replace('v200-u18-', ''); R = load(F + '/out/M-' + mid + '.checks.jsonl')
    st, ex, wall = runs.get('M-' + mid, ('?', -1, 0))
    fl = [r for r in R if r[3] is not True]
    scs = []
    for r in fl:
        t = re.match(r'\((\w+)\)', r[1]); t = '(' + t.group(1) + ')' if t else r[1][:20]
        if t not in scs: scs.append(t)
    cmp = []
    for tag, p in (('x4', U + '/out/x4-' + s + '.checks.jsonl'), ('x4e', U + '/out/x4e-' + s + '.checks.jsonl'), ('x5', U + '/verify-tests-r5/out/x5-' + s + '.checks.jsonl')):
        Q = load(p)
        if Q is None: continue
        same = len(Q) == len(R) and all((a[1], a[2], a[3]) == (b[1], b[2], b[3]) for a, b in zip(R, Q))
        cmp.append(tag + ('=' if same else '!=')); allok &= same
    caught = ex == 1 and len(fl) > 0 and len(R) == 112
    ok = caught and len(fl) == README[s]; allok &= ok
    tab.append('%-36s start %s exit %d wall %5.1f s | %d of %d fail | README %d %s | %s | %s' % (mid, st, ex, wall, len(fl), len(R), README[s], 'OK' if len(fl) == README[s] else 'DIFF', ' '.join(scs), ' '.join(cmp)))
    det.append(mid + ':'); det += ['    ' + r[1][:80] + ' :: ' + r[2][:160] for r in fl]
open(F + '/out/mutant-table.txt', 'w').write('\n'.join(tab) + '\n'); open(F + '/out/mutant-failing-checks.txt', 'w').write('\n'.join(det) + '\n')
print('\n'.join(tab)); print('ALL CAUGHT, counts = README, verdicts = builder/reviewer:', allok)
