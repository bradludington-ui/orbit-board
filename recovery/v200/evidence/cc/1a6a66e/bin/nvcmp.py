# nvcmp.py <committed NEXT-VERSION.md> <parent NEXT-VERSION.md> <drafts/NEXT-VERSION-entries.md> <drafts/UNRESOLVED-line.md>
# Compares, word by word (whitespace-normalized), the committed U42 entry and the two replaced sub-bullets with the drafts.
import sys, re
cm, pa, dr, un = [open(p, encoding='utf-8').read() for p in sys.argv[1:5]]
W = lambda s: s.split()
def block(src, start, stop):
    i = src.index(start); j = src.index(stop, i); return src[i:j]
# 1. the U42 entry
c_ent = block(cm, '- **U42 — a funds-flow sheet name', '- **Unresolved after R1–R5')
d_ent = dr[dr.index('- **U42 — a funds-flow sheet name'):].rstrip()
print('entry words committed', len(W(c_ent)), 'draft', len(W(d_ent)), 'same words:', W(c_ent) == W(d_ent))
print('entry lines committed', len(c_ent.rstrip().split('\n')), 'draft', len(d_ent.split('\n')))
print('entry exact text equal:', c_ent.rstrip() == d_ent)
# long lines
for nm, s in (('committed', c_ent), ('draft', d_ent)):
    print(nm, 'max line len', max(len(l) for l in s.split('\n')), [len(l) for l in s.split('\n') if len(l) > 125])
# placement: after U41's entry
k = cm.index('- **U42 — a funds-flow sheet name'); prev = cm.rfind('\n- **', 0, k); print('entry before U42:', cm[prev+1:prev+70].replace('\n', ' '))
# 2. case (b) replacement texts
reps = re.findall(r'-->\n(    - \*\*U4[12].*?)(?=\n<!--)', un, re.S)
for r in reps:
    head = r.strip().split('\n')[0][:60]
    print('draft sub-bullet', repr(head), 'in committed (exact):', r in cm, 'in parent:', r in pa)
# 3. what the parent had and the commit replaced
for pre in ('    - **U42 (P2; the same fix track as U41).**', '    - **U42 (P2; the same fix track).**'):
    print(repr(pre), 'parent count', pa.count(pre), 'committed count', cm.count(pre))
print('U41 (P2; fix track u41u42 under way' , 'parent', pa.count('**U41 (P2; fix track u41u42 under way'), 'committed', cm.count('**U41 (P2; fix track u41u42 under way'))
