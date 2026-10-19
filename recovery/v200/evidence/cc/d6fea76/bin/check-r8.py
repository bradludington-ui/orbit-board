# check-r8.py <fr7 c1> <fr8 c1> <committed after/> <verify-tests-r8> <verify-money-r8> : TEXT ONLY (mutate.mjs is read as text, never
# imported or run). Is round 8's change, as COMMITTED, exactly: the clause dropped on the board; the block's two literals CYCLE /
# CYCLE_ONLY; the tests reviewer's section byte for byte; the new unlock section; three mutation entries (the money reviewer's one and
# the tests reviewer's two, byte for byte)? The committed block is rebuilt from round 7's block by those changes (plus the header's
# comment lines, which are listed) and compared byte for byte.
import sys, difflib, re
R7, R8, C, VT, VM = sys.argv[1:6]
rd = lambda p: open(p, encoding='utf-8').read()
CL = ', and no board changes it'
ok = {}
# --- the board
b7 = rd(R7 + '/prioritization-board-grid.html'); b8 = rd(R8 + '/prioritization-board-grid.html'); bc = rd(C + '/prioritization-board-grid.html')
ok['board: fr7 has the clause once'] = b7.count(CL) == 1
ok['board: fr7 with the clause removed once == fr8, byte for byte'] = b7.replace(CL, '', 1) == b8
ok['board: the committed board carries no "no board changes it"'] = bc.count('no board changes it') == 0
NEWL = "  cycle:'A locked cycle’s list stays as it was locked, so ⬅ Import one appropriation and ⇊ Import several '\n    +'boards refuse every file that carries that cycle.',\n"
ok['board: the committed board carries the new cycle words once'] = bc.count(NEWL) == 1
ok['board: the sketch board (verify-money-r8/copies/sk) == fr8 board'] = rd(VM + '/copies/sk/prioritization-board-grid.html') == b8
# --- the block
def blk(s):
    a = '// ==== v2.00 (U32, U33)'; b = '// ==== end v2.00 (U32, U33) ====\n'
    assert s.count(a) == 1 and s.count(b) == 1, (s.count(a), s.count(b)); i = s.index(a); return s[i:s.index(b) + len(b)]
B7 = blk(rd(R7 + '/tools/export-audit/audit-recon.mjs')); B8 = blk(rd(R8 + '/tools/export-audit/audit-recon.mjs'))
BC = blk(rd(C + '/tools/export-audit/audit-recon.mjs'))
ok['block: committed == fr8/c1 block, byte for byte'] = BC == B8
TESTS = rd(VT + '/sk/section.mjs.txt'); UNLOCK = rd(sys.argv[6])
X = B7
# (1) the header: the comment lines the builder added or changed (shown below; comment only)
hdr_anchor = '// not for false or "", but for 5 and [] (✕ clicked in the panel); a null entry among three files.\n'
hdr_new = ''.join(l + '\n' for l in BC.split('\n') if l.startswith("// The eighth round:") or False)
i = BC.index(hdr_anchor) + len(hdr_anchor); j = BC.index('// CONTROLS: the same money on ordinary distinct keys', i); HDR = BC[i:j]
ok['header: the inserted paragraph is comment lines only'] = all(l.startswith('// ') for l in HDR.rstrip('\n').split('\n'))
assert X.count(hdr_anchor) == 1; X = X.replace(hdr_anchor, hdr_anchor + HDR, 1)
for o, n in [('// FAILS ON d66dd60 (U14, the board of 7ee498a), 171 of its 277 checks:', '// FAILS ON d66dd60 (U14, the board of 7ee498a), 177 of its 288 checks:'),
             ('// Its 106 passes are the fixtures,', '// Its 111 passes are the fixtures,')]:
    assert X.count(o) == 1, o; X = X.replace(o, n, 1)
# (2) the two literals
for nm in ('CYCLE', 'CYCLE_ONLY'):
    pat = "    const " + nm + " = 'A locked cycle’s list stays as it was locked, and no board changes it, so"
    assert X.count(pat) == 1, nm; X = X.replace(pat, pat.replace(CL, ''), 1)
# (3) the tests reviewer's section, byte for byte, at its own anchor (its bin/mksk8.py)
anc = "J([[Q + QEND], true, [K1, K2]]));\n        bootRelease(mk, []); await settleBoards();\n      }\n"
assert X.count(anc) == 1; X = X.replace(anc, anc + TESTS, 1)
# (4) the unlock section, before "WHO SAVED THE FILE"
w = '    // WHO SAVED THE FILE, AS THE FILE SAYS IT'
assert X.count(w) == 1; X = X.replace(w, UNLOCK + w, 1)
ok['block: round 7 block + header comments + 2 count comments + CYCLE/CYCLE_ONLY clause drop + tests section (verbatim) + unlock section == committed block, byte for byte'] = X == BC
ok['block: the tests reviewer section is in the committed block exactly once'] = BC.count(TESTS) == 1
ok['block: the unlock section is in the committed block exactly once'] = BC.count(UNLOCK) == 1
ok['block: no "no board changes it" left in any expected literal'] = not re.search(r"const [A-Z_]+ = '[^\n]*no board changes it", BC)
# --- mutate
m7 = rd(R7 + '/tools/export-audit/mutate.mjs.txt'); mc = rd(C + '/tools/export-audit/mutate.mjs')
ENT_T = rd(VT + '/sk/entries.mjs.txt')
mk8 = rd(VM + '/bin/mkentry8.py'); ns = {}
ent_src = mk8[mk8.index('ent = ('):mk8.index("open(p, 'w'")]; exec(ent_src, ns); ENT_M = ns['ent']
r3 = "  // v2.00 (R3, Brad 11 Oct): a save that lands under a locked view says it saved the working plan.\n"
ok['mutate: the money entry + the tests entries sit together, right before the R3 line, byte for byte'] = mc.count(ENT_M + ENT_T + r3) == 1
ids = re.findall(r'id: "(v200-cycreg-[^"]+)"', mc); ids7 = re.findall(r'id: "(v200-cycreg-[^"]+)"', m7)
new = [i for i in ids if i not in ids7]
ok['mutate: exactly three v200-cycreg ids are new against round 7'] = new == ['v200-cycreg-cycle-unchangeable', 'v200-cycreg-lock-nt-unsaid', 'v200-cycreg-lock-reserved-unsaid']
ok['mutate: every round-7 v200-cycreg id is in the commit'] = all(i in ids for i in ids7)
print('v200-cycreg ids: round 7', len(ids7), '| commit', len(ids), '| new', new)
print('HEADER inserted (comment):'); print(HDR, end='')
for k, v in ok.items(): print(('TRUE  ' if v else 'FALSE ') + k)
sys.exit(0 if all(ok.values()) else 1)
