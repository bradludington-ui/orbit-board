# matrix.py <verify dir> : one line per run of the focused U13 block: label | checks | failing | the cases that fail.
import json, os, re, sys
V = sys.argv[1]
rows = []
for f in sorted(os.listdir(os.path.join(V, 'out'))):
    if not f.endswith('.checks.jsonl'): continue
    lab = f[:-len('.checks.jsonl')]
    R = [json.loads(l) for l in open(os.path.join(V, 'out', f), encoding='utf-8')]
    if not R or not R[0][0].startswith('v2.00 (U13)'):
        rows.append((lab, len(R), sum(1 for r in R if not r[3]), '(not the U13 block)')); continue
    bad = [r for r in R if not r[3]]
    cases = []
    for r in bad:
        m = re.match(r'\((\w+)\)', r[1]); c = m.group(1) if m else r[1][:12]
        if r[1].startswith('(5)'): c = r[1][4:6]
        if c not in cases: cases.append(c)
    rows.append((lab, len(R), len(bad), ' '.join(cases)))
for r in rows: print('%-40s checks %3d  failing %3d  %s' % r)
