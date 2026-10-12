# edit2.py : additive text edits of src/body.mjs for the file-mode analogue (FBT, FBTC, FSHd, FSHdC). Folder routes unchanged.
p = '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17/src/body.mjs'
rf = '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17/src/runfile.mjs'
s = open(p).read()
def rep(old, new):
    global s
    assert s.count(old) == 1, old[:70]
    s = s.replace(old, new)
rep("""  IBC:        { fam: 'adopt', mode: 'import', held: false },
}[SCN];""", """  IBC:        { fam: 'adopt', mode: 'import', held: false },
  // the file-mode analogue: the save target is the board file (💾 Save in place), no shared folder
  FBT:        { fam: 'file', mode: 'take',  held: true },    // "open the file's version" while a 💾 Save into the file is writing
  FBTC:       { fam: 'file', mode: 'take',  held: false },
  FSHd:       { fam: 'file', mode: 'click', held: true },    // "load the shared one" while a 💾 Save into the file is writing
  FSHdC:      { fam: 'file', mode: 'click', held: false },
}[SCN];""")
rep("""  adopt: { X: { click: 'SHARED', auto: 'SHARED', take: 'F1', import: 'IMPORT' }[CFG.mode], Y: (CFG.mode === 'auto') ? 'BRAD-1' : 'BRAD-2' },
}[CFG.fam];""", """  adopt: { X: { click: 'SHARED', auto: 'SHARED', take: 'F1', import: 'IMPORT' }[CFG.mode], Y: (CFG.mode === 'auto') ? 'BRAD-1' : 'BRAD-2' },
  file: { X: { click: 'SHARED', take: 'F1' }[CFG.mode], Y: 'BRAD-2' },
}[CFG.fam];""")
rep("""          v4: both([null, 'none', 'IMPORT', 'BRAD-1', 'nothing kept', null, 'IMPORT', 'IMPORT', 'saved']) },
}[SCN];""", """          v4: both([null, 'none', 'IMPORT', 'BRAD-1', 'nothing kept', null, 'IMPORT', 'IMPORT', 'saved']) },
  // file mode -- v3: [asked, screen before, file before, file after, says, clean after, record names the file];
  //              v4: [kept before, claim, screen before, file before, put back says, kept after, screen after put back, file after Save, Save says, Save asked]
  FBT:   { adopt: both(['F1', 1, true, null, true]), u17: both(true),
           v3: both([0, 'F1', 'BRAD-2', 'F1', 'saved-file', true, true]),
           v4: both([null, 'none', 'F1', 'BRAD-2', 'nothing kept', null, 'F1', 'F1', 'saved-file', 0]) },
  FBTC:  { adopt: both(['F1', 0, true, null, true]), u17: both(false),
           v3: both([1, 'F1', 'BRAD-1', 'F1', 'saved-file', true, true]),
           v4: both([null, 'none', 'F1', 'BRAD-1', 'nothing kept', null, 'F1', 'F1', 'saved-file', 1]) },
  FSHd:  { adopt: both(['SHARED', 1, true, 'BRAD-2', true]), u17: both(true),
           v3: both([0, 'SHARED', 'BRAD-2', 'SHARED', 'saved-file', true, true]),
           v4: both(['BRAD-2', 'in-file', 'SHARED', 'BRAD-2', 'put back', null, 'BRAD-2', 'BRAD-2', 'saved-file', 1]) },
  FSHdC: { adopt: both(['SHARED', 0, true, 'BRAD-2', true]), u17: both(false),
           v3: both([0, 'SHARED', 'BRAD-1', 'SHARED', 'saved-file', true, true]),
           v4: both(['BRAD-2', 'in-place', 'SHARED', 'BRAD-1', 'put back', 'SHARED', 'BRAD-2', 'BRAD-2', 'saved-file', 0]) },
}[SCN];""")
rep("""const sayKind = s => /^✅ Saved/.test(s) ? 'saved' :""", """const sayKind = s => /^💾 Saved in place/.test(s) ? 'saved-file' : /^✅ Saved/.test(s) ? 'saved' :""")
rep("""try {
  if (CFG.fam === 'skew') await runSkew();
  else if (CFG.fam === 'pen') await runPen();
  else await runAdopt();""", open(rf).read() + """
try {
  if (CFG.fam === 'skew') await runSkew();
  else if (CFG.fam === 'pen') await runPen();
  else if (CFG.fam === 'file') await runFile();
  else await runAdopt();""")
open(p, 'w').write(s)
print('ok')
