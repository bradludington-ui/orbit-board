# ordcmp.py <here.jsonl> <ref.jsonl> : the ref stream restricted to the (scenario, where, what) keys found here -- same order? verdicts and values equal?
import json, sys
a = [json.loads(l) for l in open(sys.argv[1], encoding='utf-8') if l.strip()]
b = [json.loads(l) for l in open(sys.argv[2], encoding='utf-8') if l.strip()]
k = lambda r: (r[0], r[1], r[2]); ka = set(map(k, a))
b2 = [r for r in b if k(r) in ka]
print('here', len(a), 'ref', len(b), 'ref∩here', len(b2), 'order-equal', [k(r) for r in a] == [k(r) for r in b2],
      'verdicts-equal', [r[3] for r in a] == [r[3] for r in b2], 'values-equal', [r[4] for r in a] == [r[4] for r in b2])
