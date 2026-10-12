
// =============================================================================================== file-mode analogue (the U2b-retry pattern)
// The board file itself is the save target (💾 Save in place, W1H disk(): the File System Access handle mocked; a phase of a
// write can be held). No shared folder. The file keeps no history in the board: an earlier version is in Teams' version
// history only, outside the board (as U19 says). Every version written is recorded here by its file time, to name the
// copy the record (baseGet().file = LASTKNOWN) points at.
const runFile = async () => {
  const { fileTs, fileStore, disk } = W1H;
  const F1 = baseFile('Brad', KEY.brad);
  const verOf = html => { const c = rawContent(JSON.stringify(fileStore(html))); return { ts: fileTs(html), whose: whose(c), note: c.note, alloc: c.alloc }; };
  const versions = [];
  const seen = html => { const v = verOf(html); if (!versions.some(x => x.ts === v.ts && x.whose === v.whose)) versions.push({ ...v, tsET: et(v.ts) }); return v; };
  seen(F1);
  const A = boot({ html: F1 }); await pause(80);
  wire(A.ev, 'Brad', KEY.brad); const f = disk(A.w, F1);
  A.ev(`setNote('A', 'BRAD-1'); setAlloc('A', '700'); 'ok'`);
  await A.ev('saveInPlace()'); await settle(A);
  const v1 = seen(f.content);
  const a0 = view(A.ev, 'brad after his first 💾 Save into the file');
  const fileWhose = () => verOf(f.content).whose;
  const baseCopy = v => { const b = +((v.baseGet || {}).file || 0); const x = versions.find(y => y.ts === b); return x ? x.whose : '(no version with that time)'; };
  const KtF = v => [v.screen.whose, cleanOf(v), baseCopy(v)];
  const KF = (id, what, v) => { const t = KtF(v); return ckAny(id, what + ' [screen, recorded clean, the file version the record names]', t,
    [[FAM.X, true, FAM.X], [FAM.Y, true, FAM.Y], [t[0], false, t[2]]], 'contract'); };
  step('start', { v1, brad: a0, fileWrites: f.writes });
  ck('fixture.v1', "brad's first 💾 Save wrote BRAD-1/$700 into the board file, recorded clean against it ([file, writes, DIRTY, record dirty, record file time = the file's])",
    [v1.whose, f.writes, a0.DIRTY, !!a0.baseGet.dirty, +a0.baseGet.file === v1.ts], ['BRAD-1', 1, false, false, true], 'fixture');
  const mkShared = async () => { const R0 = boot({ html: F1 }); await pause(80); wire(R0.ev, 'Carol', KEY.carol);
    R0.ev(`setNote('A', 'SHARED'); setAlloc('A', '600'); 'ok'`); return JSON.parse(R0.ev('JSON.stringify(MS)')); };
  let st = null, g = null, p = null;
  if (CFG.mode === 'click') st = await mkShared();
  A.ev(`setNote('A', 'BRAD-2'); setAlloc('A', '720'); 'ok'`);
  const a1 = view(A.ev, 'brad typed BRAD-2');
  ck('fixture.typed', 'brad typed BRAD-2/$720, unsaved ([screen, DIRTY, record dirty])', [a1.screen.whose, a1.DIRTY, !!a1.baseGet.dirty], ['BRAD-2', true, true], 'fixture');
  if (CFG.mode === 'click') {
    A.ev(`sharedArrived(${J(st)}); 'ok'`);
    const a2 = view(A.ev, 'the shared state file arrived after brad started typing');
    step('arrived', { brad: a2 });
    ck('fixture.arrived', "the shared state file arrives after brad typed: nothing replaced, 'load the shared one' offered ([screen, said])",
      [a2.screen.whose, /arrived after you started working/.test(a2.status)], ['BRAD-2', true], 'fixture');
  }
  if (CFG.held) {
    const n0 = f.hits.close || 0; f.hold.close = gate(); g = f.hold.close;
    A.ev(`globalThis.__q=[]; 'ok'`);
    p = A.ev('saveInPlace()');
    const reached = await until(() => (f.hits.close || 0) > n0);
    const mid = view(A.ev, 'brad, file save held at its close');
    step('held', { reached, brad: mid, asked: qs(A.ev), fileWrites: f.writes });
    ck(SCN + '.held', "brad's 💾 Save into the file reached the close of its write and is held ([reached, questions, _saveBusy, the file still BRAD-1])",
      [reached, qs(A.ev).length, mid._saveBusy, fileWhose()], [true, 0, 1, 'BRAD-1'], 'fixture');
  }
  const gen0 = A.ev('_saveGen');
  let r1;
  if (CFG.mode === 'click') { A.ev(`globalThis.__q=[]; adoptShared(); 'ok'`); r1 = 'adoptShared()'; }
  else { A.ev(`globalThis.__q=[]; bootTakeFile(); 'ok'`); r1 = 'bootTakeFile(): asked ' + J(qs(A.ev).map(q => q.slice(0, 120))); }
  const m1 = view(A.ev, 'after the adoption' + (g ? ', file save still held' : ''));
  step('adoption', { how: r1, brad: m1 });
  const saidRe = { click: /Shared state loaded/, take: /Opened the saved file/ }[CFG.mode];
  ck(SCN + '.adopt', 'the other copy is put on screen ' + (g ? 'during the held file save' : 'with no save under way') + ' ([screen, _saveBusy, _saveGen unchanged, kept slot, its own words said])',
    [m1.screen.whose, m1._saveBusy, m1._saveGen === gen0, m1.kept ? m1.kept.whose : null, saidRe.test(m1.status)], EXP.adopt, 'predict');
  if (g) { g.open(); await p; await settle(A); seen(f.content); }
  const aft = view(A.ev, g ? 'brad after the file save landed' : 'brad after the adoption');
  step('landed', { brad: aft, file: verOf(f.content), fileWrites: f.writes, versions: versions.slice() });
  if (g) ck(SCN + '.file', 'the file after the held save landed: the bytes it built ([file content, writes])', [fileWhose(), f.writes], [FAM.Y, 2], 'fixture');
  KF(SCN + '.K1', 'CONTRACT once settled', aft);
  { const t = KtF(aft); rec.u17state = { tuple: t, falselyClean: falselyCleanOf(t) };
    ck(SCN + '.U17state', 'U17 STATE (file analogue) once settled: recorded clean while the screen differs from the file version the record names ' + J(t), falselyCleanOf(t), EXP.u17, 'predict'); }
  const whereF = (c, v) => ({ file: fileWhose() === c, screen: v.screen.whose === c, storage: v.stored.whose === c, keptSlot: !!(v.kept && v.kept.whose === c),
    earlierFileVersionsOnly: versions.filter(x => x.whose === c && x.ts !== fileTs(f.content)).map(x => x.tsET) });
  const reachF = w => w.file || w.screen || w.storage || w.keptSlot;
  if (NEXT === 'none') {
    // a reopen: a fresh board from the file as it is now, with this browser's storage
    const Z = boot({ html: f.content, ls: lsOf(A.ev) }); await pause(80); wire(Z.ev, 'Brad', KEY.brad); disk(Z.w, f.content);
    const z = view(Z.ev, 'reopened from the file');
    step('reopen', { brad: z });
    KF(SCN + '.K3', 'CONTRACT after a reopen', z);
    rec.whereNow = { [FAM.X]: whereF(FAM.X, z), [FAM.Y]: whereF(FAM.Y, z) };
    return;
  }
  const before = aft; const fb = fileWhose(); const kt = KtF(before); const falselyClean = falselyCleanOf(kt);
  rec.nextFrom = { K: kt, falselyClean, file: fb, versions: versions.map(x => x.whose + '@' + x.tsET) };
  if (NEXT === 'save') {
    A.ev(`globalThis.__q=[]; 'ok'`);
    await A.ev('saveInPlace()'); await settle(A); seen(f.content);
    const asked = qs(A.ev); const af = view(A.ev, "after Brad's next 💾 Save"); const fa = fileWhose();
    const t = [asked.length, before.screen.whose, fb, fa, sayKind(af.status), cleanOf(af), +af.baseGet.file === fileTs(f.content)];
    const wY = whereF(FAM.Y, af);
    step('V3next', { asked: asked.map(q => q.slice(0, 300)), before, after: af, versions: versions.slice(), where: { X: whereF(FAM.X, af), Y: wY } });
    ck(SCN + '.V3next', "Brad's next 💾 Save from where the route ended " + J(['questions asked', 'screen before', 'file before', 'file after', 'status says', 'recorded clean after', 'record names the file']), t, EXP.v3, 'predict');
    const wroteOver = before.screen.whose !== fb && asked.length === 0 && sayKind(af.status) === 'saved-file' && fa === before.screen.whose;
    rec.v3parts = { falselyClean, wroteOver, overwritten: fb, overwrittenNowIn: whereF(fb, af) };
    ckNot(SCN + '.U17.V3', 'U17 (file analogue, V3next): from a record that says saved while the screen differs from the file version it names, 💾 Save writes the screen copy over a file holding different content and asks nothing ([record falsely clean before, wrote over without asking])',
      [falselyClean, wroteOver], [true, true], 'contract');
    if (CFG.mode === 'take' && !CFG.held)   // no save: BRAD-2 was never saved, and the person confirmed "This browser's own work is NOT kept"
      ck(SCN + '.reachY', 'BRAD-2 (typed, never saved) was discarded by the person\'s own confirm at "open the file\'s version" (This browser\'s own work is NOT kept): in no copy after the next Save',
        reachF(wY), false, 'predict');
    else
      ck(SCN + '.reachY', 'CONTRACT: ' + FAM.Y + (CFG.held ? ' (written into the file by the held save, which said "Saved in place")' : ' (typed, kept aside by the load)') + ' remains in some copy this board can reach (the file, the screen, browser storage, the kept slot) after the next Save',
        reachF(wY), true, 'contract');
  }
  if (NEXT === 'putback') {
    A.ev(`globalThis.__q=[]; keptPutBack(); 'ok'`);
    const q1 = qs(A.ev).find(q => /Put back the work this browser kept aside/.test(q)) || null;
    const pv = view(A.ev, 'after ↶ put it back');
    A.ev(`globalThis.__q=[]; 'ok'`);
    await A.ev('saveInPlace()'); await settle(A); seen(f.content);
    const asked2 = qs(A.ev); const af = view(A.ev, 'after put back, then 💾 Save'); const fa = fileWhose();
    const t = [before.kept ? before.kept.whose : null, qKind(q1), before.screen.whose, fb, pbKind(pv.status), pv.kept ? pv.kept.whose : null,
      pv.screen.whose, fa, sayKind(af.status), asked2.length];
    const sc = before.screen.whose;
    step('V4putback', { question: q1, afterPutBack: pv, saveAsked: asked2.map(q => q.slice(0, 300)), afterSave: af, versions: versions.slice(), where: { X: whereF(FAM.X, af), Y: whereF(FAM.Y, af) } });
    ck(SCN + '.V4putback', '↶ put it back, then 💾 Save ' + J(['kept before', "the question's claim", 'screen before', 'file before', 'put back says', 'kept after', 'screen after put back', 'file after Save', 'Save says', 'Save asked']), t, EXP.v4, 'predict');
    const falseClaim = qKind(q1) === 'in-file' && sc !== fb;
    const notKept = !(pv.kept && pv.kept.whose === sc) && pv.stored.whose !== sc && pv.screen.whose !== sc && fa !== sc;
    rec.v4parts = { falselyClean, claim: qKind(q1), falseClaim, notKept, screenCopyIn: whereF(sc, af), saveAfterPutBackAsked: asked2.length, saveAfterPutBackSays: sayKind(af.status) };
    ckNot(SCN + '.U17.V4', "U17 (file analogue, V4putback): from a falsely clean record, ↶ Put back's question says the screen copy is still in the saved file it came from (the file holds other content) and the screen copy is then kept in no copy of the board ([record falsely clean before, the claim false, the screen copy kept nowhere in the board])",
      [falselyClean, falseClaim, notKept], [true, true, true], 'contract');
  }
};
