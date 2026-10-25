# slim.py SUITE OUT NAME_SUBSTR [NAME_SUBSTR...]
# Writes OUT: SUITE with every top-level scenario block removed except those whose `const name = '...'` contains one of the
# substrings. Prelude, top-level helpers between blocks, the self-check and the summary stay, so the "never ran" check
# hears only the kept blocks. Blocks are `await (async () => {` ... `})();` or a bare `{` ... `}` at column 0. OUT must sit
# beside SUITE (tools/export-audit/) so its relative imports resolve; delete it after. Read-only on SUITE. (v2.07 session.)
import sys, re
suite, out, keys = sys.argv[1], sys.argv[2], sys.argv[3:]
L = open(suite).read().split('\n')
end = next(i for i,l in enumerate(L) if l.startswith("console.log('\\n' + '='.repeat(96));"))
# find the self-check block (reads _selfRead / matchAll const name) to keep it
blocks=[]; i=0
while i<end:
    l=L[i]
    if l=='{' or l.startswith('await (async () =>'):
        closer = '}' if l=='{' else '})();'
        j=i+1
        while j<end and L[j]!=closer: j+=1
        blocks.append((i,j)); i=j+1
    else: i+=1
keep=set()
for (a,b) in blocks:
    body='\n'.join(L[a:b+1])
    m=re.search(r"^  const name = '([^']+)'", body, re.M)
    if m is None:
        keep.add((a,b)); continue           # helper / self-check blocks without a scenario name stay
    if any(k in m.group(1) for k in keys): keep.add((a,b))
drop=[blk for blk in blocks if blk not in keep]
outL=[]; i=0
dset=set()
for a,b in drop: dset.update(range(a,b+1))
for idx,l in enumerate(L):
    if idx in dset: continue
    outL.append(l)
open(out,'w').write('\n'.join(outL))
print('kept', len(keep), 'of', len(blocks), 'blocks; dropped', len(drop))
