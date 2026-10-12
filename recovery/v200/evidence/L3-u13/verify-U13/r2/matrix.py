# matrix.py <r2 dir> : every run in logs/runs.txt -- label, start (ET), exit, wall seconds, log -- with, where the run recorded
# checks, how many and how many failed. Text only.
import json, os, re, sys
R = sys.argv[1]
for l in open(os.path.join(R, 'logs/runs.txt'), encoding='utf-8'):
    m = re.match(r'(\S+) start="([^"]+)" exit=(\d+) wall_s=([\d.]+) log=(\S+)', l)
    if not m: print('UNPARSED', l.strip()); continue
    lab, st, rc, w, log = m.groups()
    p = os.path.join(R, 'out', lab + '.checks.jsonl'); extra = ''
    if os.path.exists(p) and os.path.getsize(p):
        rows = [json.loads(x) for x in open(p, encoding='utf-8')]
        extra = f'{len(rows)} checks, {sum(1 for r in rows if not r[3])} fail'
    print(f'{lab} | {st[11:19]} ET | exit {rc} | {float(w):.1f} s | {log} | {extra}')
