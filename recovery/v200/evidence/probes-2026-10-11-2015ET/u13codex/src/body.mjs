
// =============================================================================================== U13 (Codex's case) probe body
const { J, wire, KEY, status, header, baseFile, folder, connect, gate, until, pause, lsOf } = W1H;
const FY = '2027';                                   // seed() puts the board on FY27 (MS.cur = 2027)
const HOUR = 3600000;                                // REMOTE's clock is this far ahead of real time (fixture prerequisite)
// ---- THE FIXTURE (literal). Requirement A's note and its allocation total, whole dollars.
const FX = {
  remote:  { note: 'REMOTE',  alloc: 650 },          // the copy already in the folder (future-dated in S1*, Cb, Cc; not in Ca)
  working: { note: 'WORKING', alloc: 700 },          // Brad's edit after adopting REMOTE: unsaved in browser storage
};
const whose = c => (c && c.note === FX.remote.note && c.alloc === FX.remote.alloc) ? 'remote'
  : (c && c.note === FX.working.note && c.alloc === FX.working.alloc) ? 'working'
  : (c && c.note === '' && (c.alloc == null || c.alloc === 0)) ? 'f1' : 'other';
const et = t => t ? new Date(+t).toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false }) + ' ET' : null;
// ---- OBSERVED values (read only)
const rawContent = txt => { try { const j = JSON.parse(txt); const st = j.store || j; const y = (st.years || {})[FY] || {};
  return { note: String((y.notes || {}).A || ''), alloc: (y.alloc && y.alloc.A && typeof y.alloc.A === 'object') ? y.alloc.A.v : (y.alloc ? y.alloc.A : undefined),
           ts: +((j.store && j.store.ts) || j.ts || 0), payloadTs: +(j.ts || 0), by: j.by || st.by || '', writer: (j.writer && j.writer.by) || '' }; }
  catch (e) { return { err: String(e.message) }; } };
const headOf = fold => { const t = fold.raw(FY); if (t == null) return null; const c = rawContent(t); c.whose = whose(c); c.tsET = et(c.ts); return c; };
const histOf = fold => Object.entries((fold.root.dirs.history || { files: {} }).files)
  .filter(([n]) => /^spmt-2027-om-/.test(n)).map(([n, t]) => { const c = rawContent(t); return { name: n, ...c, whose: whose(c), tsET: et(c.ts) }; });
const view = (ev, label) => {
  const o = JSON.parse(ev(`(function(){
    var y=String(MS.cur), a=(S.alloc||{}).A, st=null, kept=null;
    try{ var s=JSON.parse(localStorage.getItem(_AP.key)||'null'); var ys=s&&s.years&&s.years[y]; var sa=ys&&ys.alloc&&ys.alloc.A;
         st={note:String(((ys&&ys.notes)||{}).A||''), alloc:(sa&&typeof sa==='object')? sa.v : sa, ts:+(s&&s.ts||0)}; }catch(e){ st={err:String(e.message)}; }
    try{ var k=localStorage.getItem(_AP.key+'.kept'); if(k){ var i=k.indexOf('\\n'); var m=JSON.parse(k.slice(0,i)); var r=JSON.parse(k.slice(i+1)); var ry=(r.years||{})[y]||{}; var ra=(ry.alloc||{}).A;
         kept={meta:{why:m.why, by:m.by, ts:m.ts, base:m.base}, note:String((ry.notes||{}).A||''), alloc:(ra&&typeof ra==='object')? ra.v : ra}; } }catch(e){ kept={err:String(e.message)}; }
    var html=document.body?document.body.innerHTML:'';
    return JSON.stringify({ screen:{note:String((S.notes||{}).A||''), alloc:(a&&typeof a==='object')? a.v : a, ts:+(MS.ts||0), by:MS.by||'', cur:MS.cur},
      domHas:{remote:html.indexOf(${J(FX.remote.note)})>=0, working:html.indexOf(${J(FX.working.note)})>=0},
      DIRTY:DIRTY, _baseDirty:_baseDirty, baseGet:baseGet(), driveBaseOf:driveBaseOf(mySlug()), _saveGen:_saveGen, _saveBusy:_saveBusy,
      _driveLive:_driveLive, _driveNeed:_driveNeed, stored:st, kept:kept });
  })()`));
  o.label = label; o.screen.whose = whose(o.screen); o.screen.tsET = et(o.screen.ts); o.stored.whose = whose(o.stored); if (o.kept) o.kept.whose = whose(o.kept);
  o.baseFolder = +(((o.baseGet || {}).folder || {})['om|' + FY]) || 0;
  o.status = status(ev).replace(/\s+/g, ' ').trim(); o.header = header(ev).replace(/\s+/g, ' ').trim();
  o.at = et(Date.now());
  return o;
};
const fview = (fold, label) => ({ label, head: headOf(fold), history: histOf(fold), log: fold.log.slice(), at: et(Date.now()) });
// ---- checks: expected values literal
const checks = [];
const ck = (id, what, got, want, kind = 'contract') => { const ok = J(got) === J(want); checks.push({ id, kind, what, expected: want, observed: got, pass: ok }); return ok; };
const ckAny = (id, what, got, wants, kind = 'contract') => { const ok = wants.some(w => J(w) === J(got)); checks.push({ id, kind, what, expected: wants, observed: got, pass: ok }); return ok; };
const rec = { scenario: SCN, ids: IDS, startedET: et(Date.now()), steps: [] };
const step = (name, o) => { rec.steps.push({ step: name, ...o }); };
rec.contract = 'the board must never be recorded clean (saved) while what is on screen differs from the copy its record names as base; '
  + 'and REMOTE/WORKING content must each remain in some reachable copy';

// ---- SCENARIOS
//  S1auto    the task's literal sequence: reopen through the opening's own connect (driveAutoConnect, permission kept)
//  S1harness Codex's shape: reopen with the harness connect only (_liveCfg/_driveDir assigned, NO opening pull); pull = driveStorePull(true)
//  S1tick    as S1harness; the refreshes are liveTick() (the Live timer's function)
//  S1perm    product route with no opening pull: the browser did not keep the folder's edit permission (queryPermission 'prompt'
//            until requested), so the opening's connect stops at "one click"; 💾 Save requests it; the pull during the save is
//            the bar's one-click Connect (driveConnectNow)
//  S1open    as S1harness, but the pull during the held save IS the opening's own connect (driveAutoConnect) -- a save pressed
//            before the opening's connect has read the folder
//  S1pen     as S1harness, but REMOTE was written (before Brad opened) by BOB's board, clock one hour fast, Bob its writer; Brad's
//            held save is ✍ Take the pen (takePen, its confirm answered OK), which saves at once. Bob never writes again.
//  Ca        control: REMOTE written at REAL time (not ahead), earlier than the save's build; S1harness shape
//  Cb        control: no reopen (DIRTY true this session); held save; pull
//  Cc        control: no held save; S1harness reopen; pull
const CFG = {
  S1auto:    { ahead: HOUR, reopen: 'auto',    held: true,  pull: 'pull' },
  S1harness: { ahead: HOUR, reopen: 'harness', held: true,  pull: 'pull' },
  S1tick:    { ahead: HOUR, reopen: 'harness', held: true,  pull: 'tick' },
  S1perm:    { ahead: HOUR, reopen: 'perm',    held: true,  pull: 'connect' },
  S1open:    { ahead: HOUR, reopen: 'harness', held: true,  pull: 'auto' },
  S1pen:     { ahead: HOUR, reopen: 'harness', held: true,  pull: 'pull', remoteBy: 'Bob', via: 'pen' },
  Ca:        { ahead: 0,    reopen: 'harness', held: true,  pull: 'pull' },
  Cb:        { ahead: HOUR, reopen: 'none',    held: true,  pull: 'pull' },
  Cc:        { ahead: HOUR, reopen: 'harness', held: false, pull: 'pull' },
}[SCN];
if (!CFG) throw new Error('unknown scenario ' + SCN);
rec.cfg = CFG;

// REMOTE: written through the product by Brad's OTHER machine (same writer key, name Brad) whose clock is `ahead` ms fast:
// that board's Date.now() is replaced in its own window (jsdom gives each window its own Date), then it 💾 Saves into the empty
// folder (the folder's first copy: no history, Brad its writer). It is then disconnected and never touches the folder again.
const writeRemote = async (F1, fold, ahead, by) => {
  const R0 = boot({ html: F1 }); await pause(80);
  wire(R0.ev, by, by === 'Bob' ? KEY.bob : KEY.brad); connect(R0.ev, R0.w, fold);
  if (ahead) R0.ev(`(function(){ var real=Date.now; Date.now=function(){ return real.call(Date)+${ahead}; }; return 'ok'; })()`);
  const realBefore = Date.now();
  R0.ev(`setNote('A', ${J(FX.remote.note)}); setAlloc('A', '650'); 'ok'`);
  await R0.ev('saveInPlace()');
  const realAfter = Date.now();
  const h = headOf(fold);
  const st = status(R0.ev).replace(/\s+/g, ' ').trim();
  R0.ev(`_driveDir=null; _liveCfg.store=false; 'ok'`);
  return { head: h, realBefore, realAfter, realBeforeET: et(realBefore), realAfterET: et(realAfter), tsMinusRealAfter: h ? h.ts - realAfter : null,
    payloadTsMinusRealAfter: h ? h.payloadTs - realAfter : null, writerStatus: st, history: histOf(fold).map(x => x.name) };
};
const permMock = fold => {
  fold.perm = { state: 'prompt', queries: 0, requests: 0 };
  fold.dir.queryPermission = async () => { fold.perm.queries++; return fold.perm.state; };
  fold.dir.requestPermission = async () => { fold.perm.requests++; fold.perm.state = 'granted'; return 'granted'; };
};
const heldSave = async (B, fold, via) => {
  const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
  B.ev(`globalThis.__q=[]; 'ok'`);
  const p = B.ev(via === 'pen' ? 'takePen()' : 'saveInPlace()');
  const reached = await until(() => (fold.hits.main || 0) > n0);
  const mid = view(B.ev, 'brad, save held at the close of its write');
  return { g, p, reached, mid };
};
const settle = async B => { await B.ev('_saveChain'); for (let i = 0; i < 5; i++) await pause(20); };
const pullNow = async (ev, how) => how === 'tick' ? await ev('liveTick()') : how === 'connect' ? await ev('driveConnectNow()') : how === 'auto' ? await ev('driveAutoConnect()') : await ev('driveStorePull(true)');
const contentOfTs = (fold, ts, extra) => { const all = [headOf(fold), ...histOf(fold), ...(extra || [])].filter(Boolean); const c = all.find(x => x.ts === ts);
  return c ? [c.note, c.alloc] : ['(no copy with that ts)', null]; };
// the contract, literal: recorded clean => the base copy holds what is on screen. Either content may be on screen; unclean is allowed.
const K = (id, what, v, fold, extra) => {
  const clean = !v.DIRTY && !v._baseDirty && !v.baseGet.dirty;
  const b = contentOfTs(fold, v.baseFolder, extra);
  return ckAny(id, what + ' [screen note, screen $, recorded clean, base-copy note, base-copy $]',
    [v.screen.note, v.screen.alloc, clean, b[0], b[1]],
    [['REMOTE', 650, true, 'REMOTE', 650], ['WORKING', 700, true, 'WORKING', 700],
     [v.screen.note, v.screen.alloc, false, b[0], b[1]]]);
};

try {
  // (1) the folder already holds REMOTE; Brad's board opens F1, connects (the opening's own connect) and adopts it
  const F1 = baseFile('Brad', KEY.brad);
  const fold = folder();
  const RBY = CFG.remoteBy || 'Brad';
  const RM = await writeRemote(F1, fold, CFG.ahead, RBY);
  step('remote', RM);
  ck('fixture.remote', "the folder's pre-existing copy is REMOTE/$650, by " + RBY + ', writer ' + RBY + ', no history',
    [RM.head && RM.head.note, RM.head && RM.head.alloc, RM.head && RM.head.by, RM.head && RM.head.writer, RM.history.length], ['REMOTE', 650, RBY === 'Bob' ? 'Bob' : 'Brad', RBY === 'Bob' ? 'Bob' : 'Brad', 0], 'fixture');
  ck('fixture.remoteClock', CFG.ahead ? 'PREREQUISITE: REMOTE store.ts and payload ts are ONE HOUR AHEAD of real time (each minus real time after its write, within 59:55 to 60:00 min)'
                                      : 'REMOTE store.ts is NOT ahead: at or before real time after its write',
    CFG.ahead ? [RM.tsMinusRealAfter > HOUR - 5000 && RM.tsMinusRealAfter <= HOUR, RM.payloadTsMinusRealAfter > HOUR - 5000 && RM.payloadTsMinusRealAfter <= HOUR]
              : [RM.tsMinusRealAfter <= 0, RM.payloadTsMinusRealAfter <= 0], [true, true], 'fixture');
  const REM = RM.head;
  const A = boot({ html: F1 }); await pause(80);
  wire(A.ev, 'Brad', KEY.brad); connect(A.ev, A.w, fold);
  const ac = await A.ev('driveAutoConnect()');
  const a0 = view(A.ev, "brad after the opening's connect (driveAutoConnect) adopted REMOTE");
  step('adopt', { connect: ac, brad: a0, folder: fview(fold, 'after adopt') });
  ck('fixture.adopt', "Brad's board adopted REMOTE: [connect returned, screen, DIRTY, _baseDirty, record dirty, record base = REMOTE ts, driveBaseOf = REMOTE ts, MS.ts = REMOTE ts, kept slot]",
    [ac, a0.screen.whose, a0.DIRTY, a0._baseDirty, !!a0.baseGet.dirty, a0.baseFolder === REM.ts, a0.driveBaseOf === REM.ts, a0.screen.ts === REM.ts, a0.kept],
    [true, 'remote', false, false, false, true, true, true, null], 'fixture');
  // (2) edit -> WORKING (unsaved)
  A.ev(`setNote('A', ${J(FX.working.note)}); setAlloc('A', '700'); 'ok'`);
  const a1 = view(A.ev, 'brad after editing WORKING');
  step('edit', { brad: a1 });
  ck('fixture.edit', "WORKING on screen and unsaved: [screen, DIRTY, record dirty, base still REMOTE ts, the edit's MS.ts is earlier than REMOTE ts]",
    [a1.screen.whose, a1.DIRTY, !!a1.baseGet.dirty, a1.baseFolder === REM.ts, a1.screen.ts < REM.ts], ['working', true, true, true, !!CFG.ahead], 'fixture');
  // (3) reopen (or not)
  let B = A, R0v = null;
  if (CFG.reopen !== 'none') {
    const R = boot({ html: F1, ls: lsOf(A.ev) }); await pause(80);
    wire(R.ev, 'Brad', KEY.brad);
    if (CFG.reopen === 'perm') permMock(fold);
    connect(R.ev, R.w, fold);
    if (CFG.reopen === 'perm') R.ev(`_liveCfg.folder='shared'; 'ok'`);   // the folder's name, as the original pick stored it (needed by driveConnectNow)
    let rc = '(not run: the harness connect only -- no opening pull)';
    if (CFG.reopen === 'auto' || CFG.reopen === 'perm') rc = await R.ev('driveAutoConnect()');
    R0v = view(R.ev, 'reopened: ' + CFG.reopen);
    step('reopen', { how: CFG.reopen, connect: rc, perm: fold.perm ? { ...fold.perm } : null, brad: R0v, folder: fview(fold, 'after reopen') });
    if (CFG.reopen === 'auto')
      ck('S1auto.premise', "TASK STEP 3 AS WRITTEN: after the opening's own connect, WORKING is still on screen, unsaved in browser storage only ([connect returned, screen, DIRTY (session), record dirty, kept slot])",
        [rc, R0v.screen.whose, R0v.DIRTY, !!R0v.baseGet.dirty, R0v.kept && R0v.kept.whose], [true, 'working', false, true, null], 'premise');
    else
      ck(SCN + '.reopened', "reopened with WORKING unsaved in browser storage: [screen, DIRTY (session), record dirty, base = REMOTE ts, kept slot" + (CFG.reopen === 'perm' ? ', connect returned, _driveNeed, permission state' : '') + ']',
        CFG.reopen === 'perm' ? [R0v.screen.whose, R0v.DIRTY, !!R0v.baseGet.dirty, R0v.baseFolder === REM.ts, R0v.kept, rc, R0v._driveNeed, fold.perm.state]
                              : [R0v.screen.whose, R0v.DIRTY, !!R0v.baseGet.dirty, R0v.baseFolder === REM.ts, R0v.kept],
        CFG.reopen === 'perm' ? ['working', false, true, true, null, false, 'click', 'prompt'] : ['working', false, true, true, null], 'fixture');
    B = R;
  }
  // (4) hold a 💾 Save at its close, (5) refresh while held, (6) release
  let H = null, mid = null, r1, m1, aft, fAft;
  const gen0 = B.ev('_saveGen');
  if (CFG.held) {
    H = await heldSave(B, fold, CFG.via); mid = H.mid;
    const fH = fview(fold, 'save held');
    step('held', { reached: H.reached, via: CFG.via || 'saveInPlace', asked: JSON.parse(B.ev('JSON.stringify(globalThis.__q)')).map(q => q.slice(0, 200)), brad: mid, folder: fH, perm: fold.perm ? { ...fold.perm } : null });
    ck(SCN + '.held', "the save reached the close of its write and is held; the folder head is still the pre-existing REMOTE; [reached, DIRTY, record dirty, _saveBusy, head ts = REMOTE ts, head REMOTE, the save's built MS.ts earlier than REMOTE ts]",
      [H.reached, mid.DIRTY, !!mid.baseGet.dirty, mid._saveBusy, fH.head.ts === REM.ts, fH.head.whose, mid.screen.ts < REM.ts],
      [true, CFG.reopen === 'none', CFG.reopen !== 'auto', 1, true, 'remote', !!CFG.ahead], CFG.reopen === 'auto' ? 'observed' : 'fixture');
  }
  const logBefore = fold.log.length;
  r1 = await pullNow(B.ev, CFG.pull);
  m1 = view(B.ev, 'brad after the refresh' + (CFG.held ? ', save still held' : ''));
  const fP = fview(fold, 'after the refresh');
  step('refresh', { how: CFG.pull, returned: r1, saveGenBefore: gen0, brad: m1, folder: fP, folderWritesDuringRefresh: fold.log.slice(logBefore) });
  if (CFG.held) {
    H.g.open(); await H.p; await settle(B);
  }
  aft = view(B.ev, CFG.held ? 'brad after the save landed' : 'brad after the refresh (no save)');
  fAft = fview(fold, CFG.held ? 'after the save landed' : 'after the refresh');
  step('landed', { brad: aft, folder: fAft, folderWritesSinceRefresh: fold.log.slice(logBefore) });
  // scenario-specific observations, literal
  if (SCN === 'S1harness' || SCN === 'S1tick' || SCN === 'S1perm' || SCN === 'S1open' || SCN === 'S1pen')
    ck(SCN + '.adopt', "mechanism (Codex's case): the refresh during the held save adopts the PRE-EXISTING REMOTE and keeps WORKING aside; no folder write by anyone during it ([returned, _saveBusy, screen, base = REMOTE ts, _saveGen unchanged, kept slot, folder writes during the refresh])",
      [CFG.pull === 'tick' ? (r1 === undefined ? '(liveTick returns nothing)' : r1) : !!r1, m1._saveBusy, m1.screen.whose, m1.baseFolder === REM.ts, m1._saveGen === gen0, m1.kept && m1.kept.whose, fP.log.length - logBefore],
      [CFG.pull === 'tick' ? '(liveTick returns nothing)' : true, 1, 'remote', true, true, 'working', 0], 'mechanism');
  if (SCN === 'Ca')
    ck('Ca.pull', 'REMOTE not ahead: the refresh during the held save adopts nothing ([returned, screen, base = REMOTE ts, kept slot])', [r1, m1.screen.whose, m1.baseFolder === REM.ts, m1.kept], [false, 'working', true, null], 'control');
  if (SCN === 'Cb')
    ck('Cb.pull', "no reopen (DIRTY true): the refresh refuses and replaces nothing ([returned, screen, DIRTY, says 'Nothing was replaced'])", [r1, m1.screen.whose, m1.DIRTY, /Nothing was replaced/.test(m1.status)], [false, 'working', true, true], 'control');
  if (SCN === 'Cc')
    ck('Cc.pull', "no save running: the refresh adopts REMOTE as today and keeps WORKING aside ([returned, screen note, $, base = REMOTE ts, DIRTY, record dirty, kept note, kept $, says kept aside])",
      [r1, aft.screen.note, aft.screen.alloc, aft.baseFolder === REM.ts, aft.DIRTY, !!aft.baseGet.dirty, aft.kept && aft.kept.note, aft.kept && aft.kept.alloc, /kept aside/.test(aft.status)],
      [true, 'REMOTE', 650, true, false, false, 'WORKING', 700, true], 'control');
  if (SCN === 'Ca' || SCN === 'Cb')
    ck(SCN + '.landed', 'the save lands as today: [screen note, $, head note, $, head by, recorded clean, base = head ts, says "✅ Saved", says "not in the folder yet"]',
      [aft.screen.note, aft.screen.alloc, fAft.head.note, fAft.head.alloc, fAft.head.by, !aft.DIRTY && !aft._baseDirty && !aft.baseGet.dirty, aft.baseFolder === fAft.head.ts, /✅ Saved/.test(aft.status), /not in the folder yet/.test(aft.status)],
      ['WORKING', 700, 'WORKING', 700, 'Brad', true, true, true, false], 'control');
  if (CFG.held && SCN !== 'Ca' && SCN !== 'Cb')
    ck(SCN + '.head', "the folder head after the save lands: the bytes the save built ([note, $, by, writer, head ts != REMOTE ts])",
      [fAft.head.note, fAft.head.alloc, fAft.head.by, fAft.head.writer, fAft.head.ts !== REM.ts], SCN === 'S1auto' ? ['REMOTE', 650, 'Brad', 'Brad', true] : ['WORKING', 700, 'Brad', 'Brad', true], 'record');
  // THE CONTRACT
  K(SCN + '.K1', 'CONTRACT once settled: recorded clean only against a base copy holding what is on screen', aft, fold, [REM]);
  const said = s => /after the copy you are working from|does not have their changes/.test(s);
  // a later refresh
  const r2 = await pullNow(B.ev, CFG.pull === 'tick' ? 'tick' : 'pull');
  const lat = view(B.ev, 'brad after a later refresh');
  step('laterRefresh', { returned: r2, brad: lat, folder: fview(fold, 'later refresh') });
  if (!said(lat.status)) K(SCN + '.K2', 'CONTRACT after a later refresh (or the board says the copies differ)', lat, fold, [REM]);
  else ck(SCN + '.K2', 'CONTRACT after a later refresh: the board says the copies differ', 'said', 'said');
  // a reopen: a fresh board from this browser storage, the opening's own connect, then a refresh
  const Z = boot({ html: F1, ls: lsOf(B.ev) }); await pause(80);
  wire(Z.ev, 'Brad', KEY.brad); if (fold.perm) fold.perm.state = 'granted'; connect(Z.ev, Z.w, fold);
  const zc = await Z.ev('driveAutoConnect()');
  const z0 = view(Z.ev, "reopened again, after the opening's connect");
  const zr = await Z.ev('driveStorePull(true)');
  const z1 = view(Z.ev, 'reopened again, after a refresh');
  const FF = fview(fold, 'final');
  step('reopenAgain', { connect: zc, afterConnect: z0, refresh: zr, afterRefresh: z1, folder: FF });
  if (!said(z0.status + ' ' + z1.status)) K(SCN + '.K3', 'CONTRACT after a reopen (opening connect + refresh) (or it says the copies differ)', z1, fold, [REM]);
  else ck(SCN + '.K3', 'CONTRACT after a reopen: the board says the copies differ', 'said', 'said');
  // WHERE EACH CONTENT LIVES NOW (reachable: folder head or history; the reopened board's screen, browser storage or kept slot)
  const where = c => ({ folderHead: FF.head.whose === c, folderHistory: FF.history.filter(h => h.whose === c).map(h => h.name + ' (ts ' + h.ts + ')'),
    screen: z1.screen.whose === c, storage: z1.stored.whose === c, keptSlot: !!(z1.kept && z1.kept.whose === c) });
  rec.whereNow = { remote: where('remote'), working: where('working') };
  const any = w => w.folderHead || w.folderHistory.length > 0 || w.screen || w.storage || w.keptSlot;
  ck(SCN + '.reach', 'CONTRACT: REMOTE/$650 and WORKING/$700 each remain in some reachable copy ([REMOTE reachable, WORKING reachable])',
    [any(rec.whereNow.remote), any(rec.whereNow.working)], [true, true]);
} catch (e) {
  checks.push({ id: SCN + '.harness', kind: 'harness', what: 'the scenario threw', expected: 'ran', observed: String((e && e.stack) || e).slice(0, 800), pass: false });
}
rec.endedET = et(Date.now());
rec.checks = checks;
writeFileSync(outPath, JSON.stringify(rec, null, 1));
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} [${c.kind}] ${c.id}: ${c.what}\n     expected ${J(c.expected)}\n     observed ${J(c.observed)}`);
if (rec.whereNow) console.log('whereNow ' + J(rec.whereNow));
console.log(`ids ${J(IDS)}`);
console.log(`${SCN}: ${checks.filter(c => c.pass).length} pass, ${checks.filter(c => !c.pass).length} fail`);
process.exit(0);
