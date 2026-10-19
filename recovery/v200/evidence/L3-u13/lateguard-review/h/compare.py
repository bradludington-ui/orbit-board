# compare.py <outdir> <runA> <runB> <mode> [part]: cell-by-cell comparison of two runs' normalized observations
# (returned value, change codes, changed field names, storage keys written, folder writes, lock writes, IndexedDB ops,
# board functions called, status text with digits and ages masked, and the landing).
import sys, json
sys.path.insert(0, sys.argv[0].rsplit('/', 1)[0])
from summarize import load, compare
D, A, Bn, mode = sys.argv[1:5]; part = sys.argv[5] if len(sys.argv) > 5 else 'win'
ma, ca = load(A); mb, cb = load(Bn)
same, diffs = compare(ca, cb, mode, part)
print(f'{A} vs {Bn}, mode {mode} ({part}): {same} cells identical, {len(diffs)} differ')
for k, a, b in diffs:
    print('---', k)
    ja, jb = json.loads(a) if a else {}, json.loads(b) if b else {}
    for f in sorted(set(ja) | set(jb)):
        if ja.get(f) != jb.get(f): print(f'   {f}:\n      {A}: {json.dumps(ja.get(f), ensure_ascii=False)[:400]}\n      {Bn}: {json.dumps(jb.get(f), ensure_ascii=False)[:400]}')
