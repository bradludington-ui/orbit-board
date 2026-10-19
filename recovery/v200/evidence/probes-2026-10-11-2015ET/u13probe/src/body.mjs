
// =============================================================================================== U13 probe body
const { J, wire, KEY, status, header, baseFile, folder, connect, gate, until, pause, lsOf } = W1H;
const FY = '2027';                                   // seed() puts the board on FY27 (MS.cur = 2027)
// ---- THE FIXTURE (literal). Requirement A's note and its allocation total, whole dollars.
const FX = {
  brad:        { note: 'BRAD-1',       alloc: 700 },   // brad's content: his first save, and the held save (nothing unsaved) writes it again
  bob:         { note: 'BOB-2',        alloc: 650 },   // bob's newer copy
  bradUnsaved: { note: 'BRAD-UNSAVED', alloc: 700 },   // C2 only: brad's unsaved edit (the note; the allocation stays 700)
};
const whose = c => (c && c.note === FX.brad.note && c.alloc === FX.brad.alloc) ? 'brad'
  : (c && c.note === FX.bob.note && c.alloc === FX.bob.alloc) ? 'bob'
  : (c && c.note === FX.bradUnsaved.note && c.alloc === FX.bradUnsaved.alloc) ? 'brad-unsaved' : 'other';
const et = t => t ? new Date(+t).toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false }) + ' ET' : null;
// ---- OBSERVED values (read only)
// A copy's content from its raw text: JSON.parse only.
const rawContent = txt => { try { const j = JSON.parse(txt); const st = j.store || j; const y = (st.years || {})[FY] || {};
  return { note: String((y.notes || {}).A || ''), alloc: (y.alloc && y.alloc.A && typeof y.alloc.A === 'object') ? y.alloc.A.v : (y.alloc ? y.alloc.A : undefined),
           ts: +((j.store && j.store.ts) || j.ts || 0), payloadTs: +(j.ts || 0), by: j.by || st.by || '', writer: (j.writer && j.writer.by) || '' }; }
  catch (e) { return { err: String(e.message) }; } };
const headOf = fold => { const t = fold.raw(FY); if (t == null) return null; const c = rawContent(t); c.whose = whose(c); return c; };
const histOf = fold => Object.entries((fold.root.dirs.history || { files: {} }).files)
  .filter(([n]) => /^spmt-2027-om-/.test(n)).map(([n, t]) => { const c = rawContent(t); return { name: n, ...c, whose: whose(c) }; });
// The board: what is on screen (S), and everything it records about being saved.
const view = (ev, label) => {
  const o = JSON.parse(ev(`(function(){
    var y=String(MS.cur), a=(S.alloc||{}).A, st=null, kept=null;
    try{ var s=JSON.parse(localStorage.getItem(_AP.key)||'null'); var ys=s&&s.years&&s.years[y]; var sa=ys&&ys.alloc&&ys.alloc.A;
         st={note:String(((ys&&ys.notes)||{}).A||''), alloc:(sa&&typeof sa==='object')? sa.v : sa, ts:+(s&&s.ts||0)}; }catch(e){ st={err:String(e.message)}; }
    try{ var k=localStorage.getItem(_AP.key+'.kept'); if(k){ var i=k.indexOf('\\n'); var m=JSON.parse(k.slice(0,i)); var r=JSON.parse(k.slice(i+1)); var ry=(r.years||{})[y]||{}; var ra=(ry.alloc||{}).A;
         kept={meta:{why:m.why, by:m.by, ts:m.ts}, note:String((ry.notes||{}).A||''), alloc:(ra&&typeof ra==='object')? ra.v : ra}; } }catch(e){ kept={err:String(e.message)}; }
    var html=document.body?document.body.innerHTML:'';
    return JSON.stringify({ screen:{note:String((S.notes||{}).A||''), alloc:(a&&typeof a==='object')? a.v : a, ts:+(MS.ts||0), by:MS.by||'', cur:MS.cur},
      domHas:{bob:html.indexOf(${J(FX.bob.note)})>=0, brad:html.indexOf(${J(FX.brad.note)})>=0},
      DIRTY:DIRTY, _baseDirty:_baseDirty, baseGet:baseGet(), driveBaseOf:driveBaseOf(mySlug()), _saveGen:_saveGen, _saveBusy:_saveBusy,
      stored:st, kept:kept });
  })()`));
  o.label = label; o.screen.whose = whose(o.screen); o.stored.whose = whose(o.stored); if (o.kept) o.kept.whose = whose(o.kept);
  o.baseFolder = +(((o.baseGet || {}).folder || {})['om|' + FY]) || 0;
  o.status = status(ev).replace(/\s+/g, ' ').trim(); o.header = header(ev).replace(/\s+/g, ' ').trim();
  o.at = et(Date.now());
  return o;
};
const fview = (fold, label) => ({ label, head: headOf(fold), history: histOf(fold), at: et(Date.now()) });
// ---- checks: expected values literal
const checks = [];
const ck = (id, what, got, want, kind = 'contract') => { const ok = J(got) === J(want); checks.push({ id, kind, what, expected: want, observed: got, pass: ok }); return ok; };
const rec = { scenario: SCN, ids: IDS, startedET: et(Date.now()), steps: [] };
const step = (name, o) => { rec.steps.push({ step: name, ...o }); };

// ---- the common start (every scenario, fresh boards and a fresh folder)
// F1: the board file brad opened (W1H baseFile: services USAF/ANG/AFRC, A ask 900/200/100, B ask 400/100/50; writer Brad).
// Brad's board is connected to the folder, puts his content on A (note BRAD-1, allocation 700) and presses 💾 Save
// (saveInPlace(), which with the folder as the store runs _driveStorePushRun): the folder's first copy, Brad its writer.
// Bob's board opens the same file, connects to the same folder and loads that copy (driveStorePull(false), the connect path's
// pull): his base is brad's first copy.
const start = async () => {
  const F1 = baseFile('Brad', KEY.brad);
  const fold = folder();
  const A = boot({ html: F1 }); await pause(80);
  wire(A.ev, 'Brad', KEY.brad); connect(A.ev, A.w, fold);
  A.ev(`setNote('A', ${J(FX.brad.note)}); setAlloc('A', '700'); 'ok'`);
  await A.ev('saveInPlace()');
  const v1 = headOf(fold);
  const a0 = view(A.ev, 'brad after his first 💾 Save');
  const Bb = boot({ html: F1 }); await pause(80);
  wire(Bb.ev, 'Bob', KEY.bob); connect(Bb.ev, Bb.w, fold);
  const bobLoad = await Bb.ev('driveStorePull(false)');
  const b0 = view(Bb.ev, 'bob after loading the folder copy');
  step('start', { F1bytes: F1.length, v1, brad: a0, bobLoad, bob: b0, folder: fview(fold, 'after the first save') });
  ck('fixture.v1', "the folder's first copy is brad's content, written by Brad (writer Brad)",
    [v1 && v1.whose, v1 && v1.by, v1 && v1.writer], ['brad', 'Brad', 'Brad'], 'fixture');
  ck('fixture.bradClean', 'brad is clean and recorded against that copy: screen brad, DIRTY false, _baseDirty false, record dirty false, base = v1 ts',
    [a0.screen.whose, a0.DIRTY, a0._baseDirty, !!a0.baseGet.dirty, a0.baseFolder === v1.ts, a0.driveBaseOf === v1.ts], ['brad', false, false, false, true, true], 'fixture');
  ck('fixture.bobBase', "bob loaded brad's copy: screen brad, his base = v1 ts",
    [bobLoad, b0.screen.whose, b0.baseFolder === v1.ts], [true, 'brad', true], 'fixture');
  return { F1, fold, A, Bb, v1 };
};
// Bob's newer copy, through the product: he edits A (note BOB-2, allocation 650) and takes the pen (✍ Take the pen, its
// confirm answered OK), which saves at once. Brad holds the pen, so without taking it bob's save is refused (writerMay).
const bobSaves = async (Bb, fold, label) => {
  Bb.ev(`setNote('A', ${J(FX.bob.note)}); setAlloc('A', '650'); globalThis.__q=[]; 'ok'`);
  await Bb.ev('takePen()');
  const head = headOf(fold);
  const asks = JSON.parse(Bb.ev('JSON.stringify(globalThis.__q)')).map(q => q.slice(0, 160));
  const b = view(Bb.ev, 'bob after taking the pen and saving');
  step(label, { bobHead: head, bobAsked: asks, bob: b, folder: fview(fold, label) });
  ck(label + '.bobCopy', "bob's newer copy is the folder's current copy: bob's content, by Bob, writer Bob, bob clean",
    [head && head.whose, head && head.by, head && head.writer, b.DIRTY, !!b.baseGet.dirty], ['bob', 'Bob', 'Bob', false, false], 'fixture');
  return head;
};
// A 💾 Save by brad with NOTHING unsaved, held at the close of its write of the copy itself (W1H folder: hold.main), i.e.
// after it read the folder, kept the copy it read in history and built its bytes.
const heldSave = async (A, fold) => {
  const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
  const p = A.ev('saveInPlace()');
  const reached = await until(() => (fold.hits.main || 0) > n0);
  const mid = view(A.ev, 'brad, save held at its write');
  return { g, p, reached, mid };
};
const settle = async A => { await A.ev('_saveChain'); for (let i = 0; i < 5; i++) await pause(20); };
const refresh = async (ev, how) => how === 'tick' ? await ev('liveTick()') : await ev('driveStorePull(true)');

try {
  if (SCN === 'S1pull' || SCN === 'S1tick') {
    const how = SCN === 'S1tick' ? 'tick' : 'pull';
    rec.refreshIs = how === 'tick' ? 'liveTick() -- the refresh timer\'s function: (no autosave, DIRTY false) then livePoll(true) -> drivePoll(true) -> driveStorePull(true)'
                                   : 'driveStorePull(true) -- the folder pull the refresh runs';
    const { F1, fold, A, Bb, v1 } = await start();
    // the held save
    const H = await heldSave(A, fold);
    const histDuringHold = fview(fold, 'brad save held: the folder');
    step('held', { reached: H.reached, brad: H.mid, folder: histDuringHold });
    ck('S1.held', "brad's save reached its write and is held there; brad still clean, nothing unsaved; the folder still holds v1",
      [H.reached, H.mid.DIRTY, !!H.mid.baseGet.dirty, H.mid._saveBusy, histDuringHold.head.ts === v1.ts], [true, false, false, 1, true], 'fixture');
    const bradWroteTsBuilt = H.mid.screen.ts;           // MS.ts the save set when it built its bytes (read)
    // bob's newer copy lands while brad's write is held
    await pause(5);
    const bobHead = await bobSaves(Bb, fold, 'S1.bob');
    ck('S1.bobNewer', "bob's copy is newer than the copy brad's save is building (ts read from the folder bytes vs brad's MS.ts)",
      bobHead.ts > bradWroteTsBuilt, true, 'fixture');
    // the refresh runs on brad's board, during the save
    const gen0 = A.ev('_saveGen');
    const r1 = await refresh(A.ev, how);
    const m1 = view(A.ev, 'brad after the refresh, save still held');
    step('refreshDuringSave', { returned: r1, saveGenBefore: gen0, brad: m1, folder: fview(fold, 'refresh during save') });
    ck('S1.adopt', "observed mechanism: the refresh, run while the save is held (_saveBusy 1), adopts bob's copy, base = bob's ts, and does not move _saveGen",
      [m1._saveBusy, m1.screen.whose, m1.baseFolder === bobHead.ts, m1._saveGen === gen0, m1.kept], [1, 'bob', true, true, null], 'mechanism');
    // release and settle
    H.g.open(); await H.p; await settle(A);
    const aft = view(A.ev, 'brad after the save landed');
    const fAft = fview(fold, 'after the save landed');
    step('afterSave', { brad: aft, folder: fAft });
    const wroteTs = fAft.head.ts;                        // the copy brad's save wrote (folder bytes)
    // what copy is the base the board records? identify it by ts among the copies that existed
    const copies = [{ ts: v1.ts, whose: v1.whose, what: "brad's first copy (v1)" }, { ts: bobHead.ts, whose: bobHead.whose, what: "bob's copy" },
                    { ts: wroteTs, whose: fAft.head.whose, what: "the copy brad's held save wrote" }];
    const baseCopy = copies.find(c => c.ts === aft.baseFolder) || { whose: '(none)', what: '(no copy has this ts)' };
    const clean = !aft.DIRTY && !aft._baseDirty && !aft.baseGet.dirty;
    rec.contract = 'a copy adopted during a save is never recorded as saved with a base it did not come from';
    ck('S1.K1', "CONTRACT: if the board is recorded clean, the copy its base names holds the content on screen ([clean, screen content, base copy's content, base copy is bob's])",
      [clean, aft.screen.whose, clean ? baseCopy.whose : '(not clean)', aft.baseFolder === bobHead.ts],
      clean ? [true, 'bob', 'bob', true] : [false, aft.screen.whose, '(not clean)', aft.baseFolder === bobHead.ts]);
    // the same, stated as literals: what a correct board may show after the save lands (either is allowed by the contract)
    ck('S1.K1-literal', 'CONTRACT (literal values): screen BOB-2/$650 recorded clean against a copy holding BRAD-1/$700 must not happen ([screen note, screen $, recorded clean, base-copy note, base-copy $])',
      [aft.screen.note, aft.screen.alloc, clean, baseCopy.whose === 'brad' ? FX.brad.note : baseCopy.whose === 'bob' ? FX.bob.note : '?', baseCopy.whose === 'brad' ? FX.brad.alloc : baseCopy.whose === 'bob' ? FX.bob.alloc : '?'],
      clean ? ['BOB-2', 650, true, 'BOB-2', 650] : ['BOB-2', 650, false, '?', '?']);
    ck('S1.store', "browser storage holds what is on screen (persist ran): stored content = screen content",
      aft.stored.whose, aft.screen.whose, 'record');
    ck('S1.head', "the folder's current copy after the save lands is the bytes brad's save built: brad's content BRAD-1/$700, by Brad, writer Brad",
      [fAft.head.note, fAft.head.alloc, fAft.head.by, fAft.head.writer], ['BRAD-1', 700, 'Brad', 'Brad'], 'record');
    // a later refresh
    const r2 = await refresh(A.ev, how);
    const lat = view(A.ev, 'brad after a later refresh');
    step('laterRefresh', { returned: r2, brad: lat, folder: fview(fold, 'later refresh') });
    const latClean = !lat.DIRTY && !lat.baseGet.dirty;
    const latSaid = /after the copy you are working from|does not have their changes|unsaved/i.test(lat.status);
    ck('S1.K2', 'CONTRACT after a later refresh: the screen matches the folder copy it is recorded clean against, or the board is unclean, or it says the copies differ ([screen, head, clean, said])',
      (lat.screen.whose === fAft.head.whose || !latClean || latSaid) ? 'held' : `screen ${lat.screen.note}/$${lat.screen.alloc}, head ${fold.raw(FY) ? headOf(fold).note + '/$' + headOf(fold).alloc : '-'}, clean, nothing said`, 'held');
    // reopen: a fresh board with brad's browser storage, the same folder, the opening's connect, then a refresh
    const R = boot({ html: F1, ls: lsOf(A.ev) }); await pause(80);
    wire(R.ev, 'Brad', KEY.brad); connect(R.ev, R.w, fold);
    const rc = await R.ev('driveAutoConnect()');
    const ro = view(R.ev, 'reopened, after the opening connect (driveAutoConnect)');
    const r3 = await refresh(R.ev, how);
    const ro2 = view(R.ev, 'reopened, after a refresh');
    step('reopen', { connect: rc, afterConnect: ro, refresh: r3, afterRefresh: ro2, folder: fview(fold, 'reopen') });
    const roClean = !ro2.DIRTY && !ro2.baseGet.dirty;
    const roSaid = /after the copy you are working from|does not have their changes|unsaved/i.test(ro.status + ' ' + ro2.status);
    ck('S1.K3', 'CONTRACT after the reopen: the screen matches the folder copy it is recorded clean against, or the board is unclean, or it says the copies differ',
      (ro2.screen.whose === headOf(fold).whose || !roClean || roSaid) ? 'held' : `screen ${ro2.screen.note}/$${ro2.screen.alloc}, head ${headOf(fold).note}/$${headOf(fold).alloc}, clean, nothing said`, 'held');
    // bob's own board, then its refresh (where bob's content lives, and what bob is told)
    const bv = view(Bb.ev, 'bob, after everything');
    const br = await Bb.ev('driveStorePull(true)');
    const bv2 = view(Bb.ev, 'bob after his refresh');
    step('bob', { before: bv, refresh: br, after: bv2 });
    // WHERE EVERY COPY OF EACH CONTENT LIVES NOW
    const F = fview(fold, 'final');
    const where = c => ({
      bradScreen: ro2.screen.whose === c, bradStorage: ro2.stored.whose === c, bradKeptSlot: !!(ro2.kept && ro2.kept.whose === c),
      folderHead: F.head.whose === c, folderHistory: F.history.filter(h => h.whose === c).map(h => h.name),
      bobScreen: bv2.screen.whose === c, bobStorage: bv2.stored.whose === c });
    rec.whereNow = { bob: where('bob'), brad: where('brad') };
    ck('S1.bobKeptInFolder', "RELATED (not U13's contract -- the documented concurrent-writer race): bob's copy BOB-2/$650 is in the folder, head or history",
      F.head.whose === 'bob' || F.history.some(h => h.whose === 'bob'), true, 'related');
  }
  else if (SCN === 'C1') {
    const { fold, A, Bb, v1 } = await start();
    await pause(5);
    const bobHead = await bobSaves(Bb, fold, 'C1.bob');
    const r = await refresh(A.ev, 'pull');
    const a = view(A.ev, 'brad after the refresh (no save running)');
    step('refresh', { returned: r, brad: a, folder: fview(fold, 'C1') });
    ck('C1', "no save running: the refresh adopts bob's copy as today ([returned, screen note, screen $, base = bob's ts, DIRTY, record dirty, kept slot])",
      [r, a.screen.note, a.screen.alloc, a.baseFolder === bobHead.ts, a.DIRTY, !!a.baseGet.dirty, a.kept], [true, 'BOB-2', 650, true, false, false, null], 'control');
  }
  else if (SCN === 'C2') {
    const { fold, A, Bb, v1 } = await start();
    A.ev(`setNote('A', ${J(FX.bradUnsaved.note)}); 'ok'`);
    await pause(5);
    const bobHead = await bobSaves(Bb, fold, 'C2.bob');
    const r = await refresh(A.ev, 'pull');
    const a = view(A.ev, 'brad after the refresh (unsaved edit on screen)');
    step('refresh', { returned: r, brad: a, folder: fview(fold, 'C2') });
    ck('C2', "an unsaved edit on screen: the refresh refuses and replaces nothing ([returned, screen note, screen $, DIRTY, record dirty, base = v1 ts, head is bob's, said 'Nothing was replaced'])",
      [r, a.screen.note, a.screen.alloc, a.DIRTY, !!a.baseGet.dirty, a.baseFolder === v1.ts, headOf(fold).whose, /Nothing was replaced/.test(a.status)],
      [false, 'BRAD-UNSAVED', 700, true, true, true, 'bob', true], 'control');
  }
  else if (SCN === 'C3') {
    const { fold, A, v1 } = await start();
    const H = await heldSave(A, fold);
    const r = await refresh(A.ev, 'pull');              // a refresh during the hold, with no newer copy anywhere
    const m = view(A.ev, 'brad, refresh during the held save, no newer copy');
    H.g.open(); await H.p; await settle(A);
    const a = view(A.ev, 'brad after the save landed');
    const F = fview(fold, 'C3');
    step('held', { reached: H.reached, refresh: r, mid: m, brad: a, folder: F });
    ck('C3', "the save held and released with no newer copy: it lands clean as today ([reached, refresh returned, screen note, screen $, head note, head $, head by, base = head ts, head ts != v1 ts, DIRTY, _baseDirty, record dirty, says Saved])",
      [H.reached, r, a.screen.note, a.screen.alloc, F.head.note, F.head.alloc, F.head.by, a.baseFolder === F.head.ts, F.head.ts !== v1.ts, a.DIRTY, a._baseDirty, !!a.baseGet.dirty, /✅ Saved/.test(a.status)],
      [true, false, 'BRAD-1', 700, 'BRAD-1', 700, 'Brad', true, true, false, false, false, true], 'control');
  }
  else throw new Error('unknown scenario ' + SCN);
} catch (e) {
  checks.push({ id: SCN + '.harness', kind: 'harness', what: 'the scenario threw', expected: 'ran', observed: String((e && e.stack) || e).slice(0, 600), pass: false });
}
rec.endedET = et(Date.now());
rec.checks = checks;
writeFileSync(outPath, JSON.stringify(rec, null, 1));
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} [${c.kind}] ${c.id}: ${c.what}\n     expected ${J(c.expected)}\n     observed ${J(c.observed)}`);
if (rec.whereNow) console.log('whereNow ' + J(rec.whereNow));
console.log(`ids ${J(IDS)}`);
console.log(`${SCN}: ${checks.filter(c => c.pass).length} pass, ${checks.filter(c => !c.pass).length} fail`);
process.exit(0);
