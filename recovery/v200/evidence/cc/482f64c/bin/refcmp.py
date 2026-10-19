# refcmp.py <here.jsonl> <ref.jsonl> : for the (scenario, where, what) keys present HERE, are they in the reference (the builder's run),
# with the same verdict and the same recorded value? Keys only in the reference are counted (the builder's harness had more blocks).
import json, sys
def load(p):
    d = {}
    for l in open(p, encoding='utf-8'):
        if l.strip():
            r = json.loads(l); d.setdefault((r[0], r[1], r[2]), []).append(r)
    return d
a, b = load(sys.argv[1]), load(sys.argv[2])
miss = [k for k in a if k not in b]; v = [k for k in a if k in b and [r[3] for r in a[k]] != [r[3] for r in b[k]]]
g = [k for k in a if k in b and [r[4] for r in a[k]] != [r[4] for r in b[k]]]
print(f'here {sum(map(len,a.values()))} checks ({len(a)} keys); ref {sum(map(len,b.values()))} ({len(b)} keys); here-not-in-ref {len(miss)}; ref-not-here {len([k for k in b if k not in a])}; verdict differs {len(v)}; value differs {len(g)}')
for k in miss: print('  NOT IN REF |', k[0][:40], '|', k[1][:70], '|', k[2][:60])
for k in v: print('  VERDICT |', k[0][:40], '|', k[1][:70], '| here', [r[3] for r in a[k]], 'ref', [r[3] for r in b[k]])
for k in g: print('  VALUE |', k[0][:40], '|', k[1][:70], '|', k[2][:50], '\n     here', str([r[4] for r in a[k]])[:300], '\n     ref ', str([r[4] for r in b[k]])[:300])
