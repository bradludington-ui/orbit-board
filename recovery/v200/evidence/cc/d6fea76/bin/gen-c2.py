# gen-c2.py : text only. Writes out/laneC2.jobs: for each of the 78 earlier v200-cycreg entries, ONE first-failure run (runner-ff.mjs) of
# the cut that holds the check the builder recorded failing first for it -- P1: the case cut whose case label begins that check's
# "where" (out/p1-map.tsv); P2: the section cut whose control run on the committed board (C-p2-sNN) recorded that check.
# v200-cycreg-clin-by-name (caught by audit-recon's own v1.98 item 83 / v1.99 item 88 checks): hr-minus-v200.mjs in first-failure mode.
import json, sys, os
F = sys.argv[1]
def load(p): return [json.loads(l) for l in open(p, encoding='utf-8') if l.strip()]
d = json.load(open(F + '/cuts/cuts.json'))
sec = {}
for k in sorted(d):
    if not k.startswith('p2-'): continue
    p = F + '/out/C-' + k[:-4] + '.checks.jsonl'
    for r in load(p): sec.setdefault(r[1] + ' | ' + r[2], k)
p1 = dict(l.rstrip('\n').split('\t') for l in open(F + '/out/p1-map.tsv', encoding='utf-8'))
jobs, miss = [], []
for l in open(F + '/out/plan-c.tsv', encoding='utf-8'):
    i, part, _, _, f = l.rstrip('\n').split('\t')
    if part == 'h-p1.mjs': jobs.append('mutff %s %s MF-%s' % (i, p1[i], i[len('v200-cycreg-'):])); continue
    if part == 'h-p2.mjs':
        m = [k for lab, k in sec.items() if lab.startswith(f)]
        if len(set(m)) == 1: jobs.append('mutff %s %s MF-%s' % (i, m[0], i[len('v200-cycreg-'):])); continue
        miss.append((i, f, sorted(set(m)))); continue
    miss.append((i, f, []))
open(F + '/out/laneC2.jobs', 'w').write('\n'.join(jobs) + '\n')
print(len(jobs), 'jobs;', len(miss), 'not placed:'); [print('  ', x) for x in miss]
