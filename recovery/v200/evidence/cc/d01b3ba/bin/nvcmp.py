# nvcmp.py <parent NV> <commit NV> <draft> : the commit's NEXT-VERSION.md must equal the parent's with draft piece (9) (placeholders filled
# U<n>->U51 .. U<n+5>->U55, as rec/L8/u10/nv.py fills them) inserted immediately before "- **Unresolved after R1–R5 (11 Oct).**", after
# U10 (8 of 12)'s entry. Text only. (After rec/L8/cc/ef2792e/bin/nvcmp.py; the piece number differs.)
import re, sys
p, c, d = (open(x, encoding='utf-8').read() for x in sys.argv[1:4])
NUM = (('U<n+5>', 'U55'), ('U<n+3>', 'U54'), ('U<n+2>', 'U53'), ('U<n+1>', 'U52'), ('U<n>', 'U51'))
heads = list(re.finditer(r'^\((\d+)\) [^\n]*\n', d, re.M)); assert [int(m.group(1)) for m in heads] == list(range(1, 14))
e = d[heads[8].end():heads[9].start()].strip('\n') + '\n'
assert e.startswith('- **U10 (9 of 12) — '), e[:60]
placeholders = [a for a, _ in NUM if a in e]
for a, b in NUM: e = e.replace(a, b)
assert 'U<' not in e
UN = '- **Unresolved after R1–R5 (11 Oct).**'
assert p.count(UN) == 1 and c.count(UN) == 1
head = p[:p.index(UN)]; last = re.findall(r'^- \*\*(U[^\n]*)', head, re.M)[-1]
print('entry before (parent):', last[:70])
print('placeholders in piece 9:', placeholders)
print('U10 (9 of 12) in parent:', '- **U10 (9 of 12) — ' in p, '| in commit:', c.count('- **U10 (9 of 12) — '))
exp = p.replace(UN, e + UN)
print('commit == parent + piece (9) before Unresolved:', exp == c, '| piece lines', e.count('\n'))
open(sys.argv[2] + '.piece9', 'w', encoding='utf-8').write(e)
