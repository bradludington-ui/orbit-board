# valdiff.py <a.jsonl> <b.jsonl> : the checks (scenario, where, what) whose recorded value differs, with both values.
import json, sys
L = lambda p: [json.loads(l) for l in open(p, encoding='utf-8') if l.strip()]
a, b = L(sys.argv[1]), L(sys.argv[2]); k = lambda r: (r[0], r[1], r[2]); db = {k(r): r for r in b}
for r in a:
    o = db.get(k(r))
    if o and o[4] != r[4]: print('VALUE DIFFERS |', r[0][:30], '|', r[1][:90], '| verdict here', r[3], 'ref', o[3], '\n   here:', str(r[4])[:400], '\n   ref :', str(o[4])[:400])
