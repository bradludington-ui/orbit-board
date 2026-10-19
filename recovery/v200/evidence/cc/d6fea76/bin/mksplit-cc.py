# mksplit-cc.py <audit-recon.mjs> <outdir> <mkfocused.py> : fr3/bin/mksplit.py (the builder's, 3f87704b) for the COMMITTED suite, which now
# carries more v2.00 blocks between R1 and U32/U33. Text only; every line kept is verbatim.
#  hr-minus-v200.mjs : the suite, byte for byte, with ALL its v2.00 blocks cut out whole -- from the line "// ==== v2.00 (R1): funds flow"
#                      to the line "// ==== end v2.00 (U32, U33) ====" (they sit together; asserted: nothing but v2.00 blocks between)
#  hr-v200-other.mjs : every v2.00 block in that run EXCEPT U32/U33, through rec/L3/u14/mkfocused.py (preamble helpers, blocks verbatim, guard)
#  (the U32/U33 block itself runs as harness/h-p1.mjs + h-p2.mjs, mkfocused.py + fr8/bin/mksplit8.py)
# Asserted: every "  const name = '" line of the suite is in exactly one of the three parts.
import sys, subprocess, re
src = open(sys.argv[1], encoding='utf-8').read(); out = sys.argv[2]
a = '// ==== v2.00 (R1): funds flow'; b = '// ==== end v2.00 (U32, U33) ====\n'
assert src.count(a) == 1 and src.count(b) == 1
i = src.index(a); j = src.index(b) + len(b); assert src[i-1] == '\n'
cut = src[i:j]
# the cut is a run of whole blocks: each "// ==== v2.00 ..." start line is followed by its own "// ==== end ..." line, and between an end and
# the next start nothing but empty lines
starts = []; k = 0
while k < len(cut):
    assert cut.startswith('// ==== v2.00', k), ('not a block start at', cut[k:k+80])
    e = cut.index('\n', k); line = cut[k:e]; starts.append(line[len('// ==== '):])
    m = cut.index('\n// ==== end ', e); n = cut.index('\n', m + 1) + 1
    assert '\n// ==== v2.00' not in cut[e:m], ('nested start in', line[:80])
    k = n
    while k < len(cut) and cut[k] == '\n': k += 1
print(len(starts), 'v2.00 blocks in the cut')
open(out + '/hr-minus-v200.mjs', 'w', encoding='utf-8').write(src[:i] + src[j:])
other = [s for s in starts if not s.startswith('v2.00 (U32, U33)')]; assert len(other) == len(starts) - 1
for s in other: assert src.count('// ==== ' + s + '\n') == 1, s
r = subprocess.run([sys.executable, '-I', sys.argv[3], sys.argv[1], out + '/hr-v200-other.mjs'] + other, capture_output=True, text=True)
print(r.stdout.strip(), r.stderr.strip())
if r.returncode: sys.exit(r.returncode)
nm = lambda t: re.findall(r"^  const name = '.*$", t, re.M)
whole = nm(src); p1 = nm(open(out + '/hr-minus-v200.mjs', encoding='utf-8').read()); p2 = nm(open(out + '/hr-v200-other.mjs', encoding='utf-8').read())
p3 = nm(src[src.index('// ==== v2.00 (U32, U33)'):src.index('// ==== end v2.00 (U32, U33) ====')])
print('const name lines: suite', len(whole), '= minus-v200', len(p1), '+ v200-other', len(p2), '+ U32/U33', len(p3), '->', sorted(whole) == sorted(p1 + p2 + p3))
for s in starts: print('  block:', s[:110])
sys.exit(0 if sorted(whole) == sorted(p1 + p2 + p3) else 1)
