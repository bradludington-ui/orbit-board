# edit-probe-clean.py <u24probe.mjs> : adds path A's clean-start variants (text edit, anchors asserted once)
import sys
p = sys.argv[1]; t = open(p, encoding='utf-8').read()
def rep(old, new):
    global t
    assert t.count(old) == 1, ('anchor', t.count(old), old[:70]); t = t.replace(old, new)
rep("  'SHc-fold-W': 1, 'SHc-fold-C1': 1, 'SHc-fold-C2': 1, 'SHc-file-W': 1, 'SHc-file-C1': 1, 'SHc-file-C2': 1,\n",
    "  'SHc-fold-W': 1, 'SHc-fold-C1': 1, 'SHc-fold-C2': 1, 'SHc-file-W': 1, 'SHc-file-C1': 1, 'SHc-file-C2': 1,\n"
    "  // path A from a CLEAN record (nothing unsaved after BRAD-1): the link is the 'your local changes are newer' one; the answer auto-loads\n"
    "  'SHc-fold-Wclean': 1, 'SHc-fold-C1clean': 1, 'SHc-file-C1clean': 1, 'SHa-fold-Wclean': 1, 'SHa-fold-C1clean': 1, 'SHa-file-C1clean': 1,\n")
# SHc: BRAD-2 typed only when not clean; markers follow
rep("  const ctx = { A, sc, sharedText, markers: ['BRAD-2', 'SHARED'], prog: F0 };",
    "  const clean = /clean$/.test(KIND);\n  const ctx = { A, sc, sharedText, markers: [clean ? 'BRAD-1' : 'BRAD-2', 'SHARED'], prog: F0 };")
rep("  type(A.ev, 'BRAD-2', 720);\n  sc.open(); R.arrived = await until(() => A.ev('!!SHARED')); await pause(10);\n  R.setup = snap(A, ctx, 'the shared state file arrived after brad typed BRAD-2');",
    "  if (!clean) type(A.ev, 'BRAD-2', 720);\n  sc.open(); R.arrived = await until(() => A.ev('!!SHARED')); await pause(10);\n"
    "  R.setup = snap(A, ctx, clean ? 'the shared state file arrived; brad clean at BRAD-1' : 'the shared state file arrived after brad typed BRAD-2');")
# SHa
rep("  const ctx = { markers: ['BRAD-2', 'SHARED'] };\n  if (MODE === 'fold') { ctx.fold = folder(); connect(A1.ev, A1.w, ctx.fold, 'A1'); ctx.prog = F0; }",
    "  const clean = /clean$/.test(KIND);\n  const ctx = { markers: [clean ? 'BRAD-1' : 'BRAD-2', 'SHARED'] };\n  if (MODE === 'fold') { ctx.fold = folder(); connect(A1.ev, A1.w, ctx.fold, 'A1'); ctx.prog = F0; }")
rep("  type(A1.ev, 'BRAD-2', 720); await pause(5);\n  R.session1 = snap(A1, ctx, 'session 1 closing: BRAD-2 unsaved');",
    "  if (!clean) type(A1.ev, 'BRAD-2', 720); await pause(5);\n  R.session1 = snap(A1, ctx, clean ? 'session 1 closing: clean at BRAD-1' : 'session 1 closing: BRAD-2 unsaved');")
open(p, 'w', encoding='utf-8').write(t); print('ok')
