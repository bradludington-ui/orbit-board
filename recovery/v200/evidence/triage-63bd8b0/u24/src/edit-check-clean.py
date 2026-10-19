# edit-check-clean.py <check.mjs> : adds the clean-start variants of path A to check.mjs (text edit, anchors asserted once)
import sys
p = sys.argv[1]; t = open(p, encoding='utf-8').read()
def rep(old, new):
    global t
    assert t.count(old) == 1, ('anchor', t.count(old), old[:70]); t = t.replace(old, new)
rep("  'SHa-fold-W':  { hold:",
"""  // path A from a CLEAN record (nothing unsaved; added at 11:36 AM ET after reading rec/L4/u17's observation 2): by code the
  // sidecar's loads never mark the record, so the NO-SAVE controls are falsely clean too -- not attributable to a save
  'SHc-fold-Wclean':  { hold: [1, 'BRAD-1', false, 0], act: ['SHARED', 1, false, false, false, null, 'shared-loaded'], end: ['SHARED', true, 'BRAD-1', 'BRAD-1', true],
                   reopen: ['BRAD-1', true, 'BRAD-1', false], refresh: ['BRAD-1', true, false] },
  'SHc-fold-C1clean': { act: ['SHARED', 0, false, false, false, null, 'shared-loaded'], end: ['SHARED', true, 'BRAD-1', 'BRAD-1', true],
                   reopen: ['BRAD-1', true, 'BRAD-1', false], refresh: ['BRAD-1', true, false] },
  'SHc-file-C1clean': { act: ['SHARED', 0, false, false, false, null, 'shared-loaded'], end: ['SHARED', true, 'BRAD-1', 'BRAD-1', true],
                   reopen: ['BRAD-1', true, 'BRAD-1', false] },
  'SHa-fold-Wclean':  { hold: [1, 'BRAD-1', false, 0], act: ['SHARED', 1, false, false, false, null, 'shared-auto'], end: ['SHARED', true, 'BRAD-1', 'BRAD-1', true],
                   reopen: ['SHARED', true, 'BRAD-1', true], refresh: ['SHARED', true, true] },
  'SHa-fold-C1clean': { act: ['SHARED', 0, false, false, false, null, 'shared-auto'], end: ['SHARED', true, 'BRAD-1', 'BRAD-1', true],
                   reopen: ['SHARED', true, 'BRAD-1', true], refresh: ['SHARED', true, true] },
  'SHa-file-C1clean': { act: ['SHARED', 0, false, false, false, null, 'shared-auto'], end: ['SHARED', true, 'BRAD-1', 'BRAD-1', true],
                   reopen: ['SHARED', true, 'BRAD-1', true] },
  'SHa-fold-W':  { hold:""")
rep("  if (p === 'SHc' || p === 'SHa') return ['BRAD-2', 'SHARED'];",
    "  if (p === 'SHc' || p === 'SHa') return [/clean$/.test(k) ? 'BRAD-1' : 'BRAD-2', 'SHARED'];")
rep("""    chk(sc, 'FIX', "REACH: the state file arrived after BRAD-2 was typed; nothing replaced; 'load the shared one' offered in the status line [screen, DIRTY, record dirty, buttons, words]",
      [S0.screen.whose, S0.DIRTY, !!S0.base.dirty, S0.statusBtns, words(S0.status)], ['BRAD-2', true, true, ['adoptShared()'], 'shared-refused']);""",
"""    if (/clean$/.test(kind)) chk(sc, 'FIX', "REACH: the state file (published before BRAD-1 was saved) arrived; 'load the shared one (yours is kept aside first)' offered in the status line [screen, DIRTY, record dirty, buttons, words]",
      [S0.screen.whose, S0.DIRTY, !!S0.base.dirty, S0.statusBtns, words(S0.status)], ['BRAD-1', false, false, ['adoptShared()'], 'shared-newer-local']);
    else chk(sc, 'FIX', "REACH: the state file arrived after BRAD-2 was typed; nothing replaced; 'load the shared one' offered in the status line [screen, DIRTY, record dirty, buttons, words]",
      [S0.screen.whose, S0.DIRTY, !!S0.base.dirty, S0.statusBtns, words(S0.status)], ['BRAD-2', true, true, ['adoptShared()'], 'shared-refused']);""")
rep("""    chk(sc, 'FIX', 'session 1 closed with BRAD-2 unsaved [screen, DIRTY, record dirty]', [R.session1.screen.whose, R.session1.DIRTY, !!R.session1.base.dirty], ['BRAD-2', true, true]);
    chk(sc, 'FIX', 'reopened: BRAD-2 on screen, DIRTY false, the record dirty, nothing kept, the state file not answered yet [.., SHARED]',
      [S0.screen.whose, S0.DIRTY, !!S0.base.dirty, S0.kept, S0.shared], ['BRAD-2', false, true, null, null]);""",
"""    const cl = /clean$/.test(kind);
    chk(sc, 'FIX', cl ? 'session 1 closed clean at BRAD-1 [screen, DIRTY, record dirty]' : 'session 1 closed with BRAD-2 unsaved [screen, DIRTY, record dirty]',
      [R.session1.screen.whose, R.session1.DIRTY, !!R.session1.base.dirty], cl ? ['BRAD-1', false, false] : ['BRAD-2', true, true]);
    chk(sc, 'FIX', 'reopened: ' + (cl ? 'BRAD-1, the record clean' : 'BRAD-2 on screen, DIRTY false, the record dirty') + ', nothing kept, the state file not answered yet [.., SHARED]',
      [S0.screen.whose, S0.DIRTY, !!S0.base.dirty, S0.kept, S0.shared], cl ? ['BRAD-1', false, false, null, null] : ['BRAD-2', false, true, null, null]);""")
open(p, 'w', encoding='utf-8').write(t); print('ok')
