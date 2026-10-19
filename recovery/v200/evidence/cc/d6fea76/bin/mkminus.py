# mkminus.py <committed audit-recon.mjs> <parent audit-recon.mjs> <out> : text only. The committed suite with its U32/U33 block cut out
# whole (from "// ==== v2.00 (U32, U33)" through its "// ==== end v2.00 (U32, U33) ====" line), every other line verbatim. Asserted: it
# equals the parent's audit-recon byte for byte (the commit's suite change is that block alone), and the block plus this part hold every
# "  const name = '" line of the committed suite once.
import sys, re
s = open(sys.argv[1], encoding='utf-8').read(); p = open(sys.argv[2], encoding='utf-8').read()
a = '// ==== v2.00 (U32, U33)'; b = '// ==== end v2.00 (U32, U33) ====\n'
assert s.count(a) == 1 and s.count(b) == 1; i = s.index(a); j = s.index(b) + len(b)
m = s[:i] + s[j:]; assert m == p, 'not the parent suite'
nm = lambda t: re.findall(r"^  const name = '.*$", t, re.M)
assert sorted(nm(s)) == sorted(nm(m) + nm(s[i:j])) and len(nm(s[i:j])) == 1
open(sys.argv[3], 'w', encoding='utf-8').write(m); print('written', sys.argv[3], '== parent audit-recon; const name lines', len(nm(m)), '+ 1 =', len(nm(s)))
