
// =============================================================================================== U17 CHECKER: x-probe body
// The CHECKER's own adversarial routes (rec/L4/u17-check). READ-ONLY reproduction; nothing is fixed. Built on the builder's
// head.mjs + the verbatim W1H block; the helpers below are copied from the builder's body.mjs (observation only).
// What these routes test that the builder's did not:
//   XSHd   SHd, but the link is pressed by a DOM click on the button the status line shows during the held save
//   XSHe   SHd reached the ordinary way: the board opens clean and newer than the shared state file, which offers
//          "load the shared one (yours is kept aside first)"; Brad types, presses Save, clicks the link while it writes
//   XSHdL  ORDER CONTROL for SHd: the same steps, but the save LANDS before the load (the link is then gone from the status
//          line, so the load is a direct adoptShared() call: a labelled shortcut)
//   XSHn   NO SAVE AT ALL near the load: BRAD-2 saved and landed, the board reopened, the shared state file (older) arrives,
//          the board offers "load the shared one (yours is kept aside first)", Brad clicks it (DOM)
//   XFBT   FBT reached the way the board offers it: the file is newer at opening and this browser's work cannot be kept
//          aside (kept slot occupied), so "open the file's version" is on the status line; Brad presses 💾 Save (HOLD ON,
//          answered OK), and clicks the link (DOM) while the save is writing
//   XFBTC  XFBT with no save: the link clicked at opening
//   XFBTL  XFBT with the save landed first (link gone; direct bootTakeFile() call: a labelled shortcut)
//   XFSHd  FSHd with a DOM click
//   XFSHn  (added at the resume, 12 Oct ~15:10 ET) the FILE-mode XSHn: NO SAVE near the load. BRAD-2 saved into the file and
//          landed; the board reopened from that file with this browser's storage; the older shared state file arrives; the
//          board offers "load the shared one (yours is kept aside first)"; Brad clicks it (DOM)
//   XFSHdL (added at the resume) the FILE-mode XSHdL: FSHd's steps with the save LANDED before the load (link gone; direct
//          adoptShared() call: a labelled shortcut)
//   At the resume XFSHd also got its v3 literal (it had only v4), and the reach check was generalised (reachC names the
//   content). The literals of XSHd, XSHe, XSHdL, XSHn, XFBT, XFBTC, XFBTL were not changed.
// EVERY EXPECTED VALUE IS A HAND-WRITTEN LITERAL (EXPX below), written from reading 98eed7e8/1375b72b before the run.
const { J, wire, KEY, status, header, baseFile, folder, connect, gate, until, pause, lsOf, qs, disk, fileTs, fileStore } = W1H;
const BK = { '98eed7e801af20270f755eadffb2fa72355c30e5': 'u13', '1375b72b6707faa57c50d528e01ce9611f194998': 'pre' }[IDS.board];
if (!BK) throw new Error('unknown board blob ' + IDS.board);
const FY = '2027';
const MAIN = 'spmt-' + FY + '-om.json';
const KNOWN = [['REMOTE', 650], ['WORKING', 700], ['BOB-2', 650], ['BRAD-1', 700], ['BRAD-2', 720], ['SHARED', 600], ['IMPORT', 610],
  ['X-1', 730], ['X-2', 740], ['BRAD-3', 750]];
const whose = c => { if (!c || c.err) return c ? 'unreadable' : null;
  for (const [n, a] of KNOWN) if (c.note === n && c.alloc === a) return n;
  if (c.note === '' && (c.alloc == null || c.alloc === 0)) return 'F1';
  return 'other:' + c.note + '/' + c.alloc; };
const et = t => t ? new Date(+t).toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false }) + ' ET' : null;
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
    var el=document.getElementById('shareStat'), bt=[];
    if(el) Array.prototype.forEach.call(el.querySelectorAll('button'), function(b){ bt.push(String(b.getAttribute('onclick')||'')); });
    return JSON.stringify({ screen:{note:String((S.notes||{}).A||''), alloc:(a&&typeof a==='object')? a.v : a, ts:+(MS.ts||0), by:MS.by||'', cur:MS.cur},
      DIRTY:DIRTY, _baseDirty:_baseDirty, baseGet:baseGet(), driveBaseOf:driveBaseOf(mySlug()), _saveGen:_saveGen, _saveBusy:_saveBusy,
      LASTKNOWN:LASTKNOWN, stored:st, kept:kept, buttons:bt });
  })()`));
  o.label = label; o.screen.whose = whose(o.screen); o.stored.whose = whose(o.stored); if (o.kept) o.kept.whose = whose(o.kept);
  o.baseFolder = +(((o.baseGet || {}).folder || {})['om|' + FY]) || 0;
  o.status = status(ev).replace(/\s+/g, ' ').trim(); o.header = header(ev).replace(/\s+/g, ' ').trim();
  o.at = et(Date.now());
  return o;
};
const fview = (fold, label) => ({ label, head: headOf(fold), history: histOf(fold), log: fold.log.slice(), at: et(Date.now()) });
const cleanOf = v => !v.DIRTY && !v._baseDirty && !v.baseGet.dirty;
const checks = [];
const ck = (id, what, got, want, kind = 'predict') => { const ok = J(got) === J(want); checks.push({ id, kind, what, expected: want, observed: got, pass: ok }); return ok; };
const rec = { scenario: SCN, next: NEXT, board: BK, ids: IDS, startedET: et(Date.now()), steps: [] };
const step = (name, o) => { rec.steps.push({ step: name, ...o }); };
const sayKind = s => /^💾 Saved in place/.test(s) ? 'saved-file' : /^✅ Saved/.test(s) ? 'saved' : (/after the copy you are working from/.test(s) && /Nothing was written/.test(s)) ? 'clash'
  : /holds the pen/.test(s) ? 'pen' : 'other: ' + s.slice(0, 80);
const qKind = q => !q ? 'none' : /kept aside in its place/.test(q) ? 'in-place' : /still in the shared folder it came from/.test(q) ? 'in-folder'
  : /still in the saved file it came from/.test(q) ? 'in-file' : 'other: ' + q.slice(0, 80);
const pbKind = s => /Nothing is kept aside in this browser/.test(s) ? 'nothing kept' : /^↶ Put back the work kept aside/.test(s) ? 'put back'
  : /Not put back/.test(s) ? 'refused' : 'other: ' + s.slice(0, 80);
const settle = async B => { await B.ev('_saveChain'); for (let i = 0; i < 5; i++) await pause(20); };
const hasBtn = (v, fn) => v.buttons.includes(fn + '()');
// THE CLICK: the button the status line shows, found in the DOM and clicked (its inline onclick runs, as a person's click would)
const clickBtn = (ev, fn) => ev(`(function(){ var b=document.querySelector('#shareStat button[onclick="${fn}()"]'); if(!b) return 'no button'; b.click(); return 'clicked'; })()`);
const contentOfTs = (fold, ts, extra) => { const all = [headOf(fold), ...histOf(fold), ...(extra || [])].filter(Boolean); const c = all.find(x => x.ts === ts);
  return c ? whose(c) : '(no copy with that ts)'; };
const falselyCleanOf = t => t[1] === true && t[0] !== t[2];

// ---- EXPECTED, hand-written literals (identical on both boards: U13's commit touches driveStorePull only)
// folder: adopt = [screen, _saveBusy, _saveGen unchanged, kept slot, "Shared state loaded" said]; K1 = [screen, clean, base copy];
//         v3 = [questions, screen before, head before, head after, status, clean after, record names head]
// file:   adopt = [screen, _saveBusy, _saveGen unchanged, kept slot, "Opened the saved file's version"/"Shared state loaded" said];
//         K1 = [screen, clean, the file version the record names]; v3 = [questions, screen before, file before, file after, status, clean after, record names file]
const EXPX = {
  XSHd:  { linkHeld: true, adopt: ['SHARED', 1, true, 'BRAD-2', true], K1: ['SHARED', true, 'BRAD-2'], v3: [0, 'SHARED', 'BRAD-2', 'SHARED', 'saved', true, true] },
  XSHe:  { linkElse: true, linkHeld: true, adopt: ['SHARED', 1, true, 'BRAD-2', true], K1: ['SHARED', true, 'BRAD-2'], v3: [0, 'SHARED', 'BRAD-2', 'SHARED', 'saved', true, true] },
  XSHdL: { linkAfterLanding: false, adopt: ['SHARED', 0, true, null, true], K1: ['SHARED', true, 'BRAD-2'], v3: [0, 'SHARED', 'BRAD-2', 'SHARED', 'saved', true, true] },
  XSHn:  { linkElse: true, adopt: ['SHARED', 0, true, null, true], K1: ['SHARED', true, 'BRAD-2'], v3: [0, 'SHARED', 'BRAD-2', 'SHARED', 'saved', true, true] },
  XFBT:  { boot: ['BRAD-3', 'BRAD-2', true, 'X-2'], heldAsked: 1, linkHeld: true, adopt: ['X-2', 1, true, 'BRAD-2', true], file: 'BRAD-3',
           K1: ['X-2', true, 'BRAD-3'], v3: [0, 'X-2', 'BRAD-3', 'X-2', 'saved-file', true, true], reach3: false },
  XFBTC: { boot: ['BRAD-3', 'BRAD-2', true, 'X-2'], adopt: ['X-2', 0, true, 'BRAD-2', true], file: 'X-2',
           K1: ['X-2', true, 'X-2'], v3: [0, 'X-2', 'X-2', 'X-2', 'saved-file', true, true], reach3: false },
  XFBTL: { boot: ['BRAD-3', 'BRAD-2', true, 'X-2'], heldAsked: 1, linkAfterLanding: false, adopt: ['X-2', 0, true, 'BRAD-2', true], file: 'BRAD-3',
           K1: ['X-2', true, 'X-2'], v3: [1, 'X-2', 'BRAD-3', 'X-2', 'saved-file', true, true], reach3: false },
  XFSHd: { linkHeld: true, adopt: ['SHARED', 1, true, 'BRAD-2', true], K1: ['SHARED', true, 'BRAD-2'],
           v3: [0, 'SHARED', 'BRAD-2', 'SHARED', 'saved-file', true, true], reachC: 'BRAD-2', reach: true,
           v4: ['BRAD-2', 'in-file', 'SHARED', 'BRAD-2', 'put back', null, 'BRAD-2', 'BRAD-2', 'saved-file', 1] },
  // XFSHn: reopened clean on BRAD-2 (the file); the older shared state file -> the else branch (link, "yours is kept aside
  // first"); adoptShared: ownUnsaved = base.dirty = false -> nothing kept; applyStore + persist only (nothing counted);
  // LASTKNOWN unchanged -> clean against the BRAD-2 file; Save: fts === LASTKNOWN -> no HOLD ON; BRAD-2 then in no copy the
  // board can reach (earlier file version only). Put back: nothing kept -> "Nothing is kept aside", Save asks nothing.
  XFSHn: { reopen: ['BRAD-2', true, 'BRAD-2'], linkElse: true, adopt: ['SHARED', 0, true, null, true], file: 'BRAD-2',
           K1: ['SHARED', true, 'BRAD-2'], v3: [0, 'SHARED', 'BRAD-2', 'SHARED', 'saved-file', true, true], reachC: 'BRAD-2', reach: false,
           v4: [null, 'none', 'SHARED', 'BRAD-2', 'nothing kept', null, 'SHARED', 'SHARED', 'saved-file', 0] },
  // XFSHdL: as XFSHn, reached in one session: the save of BRAD-2 lands (clean) before the load; the link is gone after the landing
  XFSHdL: { linkAfterLanding: false, adopt: ['SHARED', 0, true, null, true], file: 'BRAD-2',
           K1: ['SHARED', true, 'BRAD-2'], v3: [0, 'SHARED', 'BRAD-2', 'SHARED', 'saved-file', true, true], reachC: 'BRAD-2', reach: false,
           v4: [null, 'none', 'SHARED', 'BRAD-2', 'nothing kept', null, 'SHARED', 'SHARED', 'saved-file', 0] },
}[SCN];
if (!EXPX) throw new Error('unknown scenario ' + SCN);
rec.expected = EXPX;

// =============================================================================================== folder routes
const runFolder = async () => {
  const F1 = baseFile('Brad', KEY.brad);
  const fold = folder();
  // Carol's shared state file, made FIRST: older than everything Brad types (the stamp the board compares)
  const R0 = boot({ html: F1 }); await pause(80); wire(R0.ev, 'Carol', KEY.carol);
  R0.ev(`setNote('A', 'SHARED'); setAlloc('A', '600'); 'ok'`); const st = JSON.parse(R0.ev('JSON.stringify(MS)'));
  await pause(5);
  const A = boot({ html: F1 }); await pause(80);
  wire(A.ev, 'Brad', KEY.brad); connect(A.ev, A.w, fold);
  A.ev(`setNote('A', 'BRAD-1'); setAlloc('A', '700'); 'ok'`);
  await A.ev('saveInPlace()'); await settle(A);
  const v1 = headOf(fold);
  ck('fixture.v1', 'the folder copy is BRAD-1, Brad clean against it ([head, DIRTY, record dirty, base = head ts, shared file older than MS.ts])',
    [v1 && v1.whose, view(A.ev, 'x').DIRTY, !!view(A.ev, 'x').baseGet.dirty, view(A.ev, 'x').baseFolder === (v1 && v1.ts), st.ts < +A.ev('MS.ts')], ['BRAD-1', false, false, true, true], 'fixture');
  let E = A, H = null;
  if (SCN === 'XSHe') {
    A.ev(`sharedArrived(${J(st)}); 'ok'`);
    const a = view(A.ev, 'clean board, older shared state file arrived');
    step('arrivedElse', { brad: a });
    ck('XSHe.linkElse', 'the board is clean and newer: it offers "load the shared one (yours is kept aside first)" ([button adoptShared() on the status line, words])',
      [hasBtn(a, 'adoptShared') && /local changes are newer than the shared state/.test(a.status)], [EXPX.linkElse], 'predict');
  }
  if (SCN === 'XSHd') {
    A.ev(`setNote('A', 'BRAD-2'); setAlloc('A', '720'); 'ok'`);
    A.ev(`sharedArrived(${J(st)}); 'ok'`);
    const a = view(A.ev, 'typed BRAD-2; shared file arrived');
    ck('fixture.arrived', 'BRAD-2 typed; the shared file arrived: nothing replaced, the link offered ([screen, DIRTY, button])', [a.screen.whose, a.DIRTY, hasBtn(a, 'adoptShared')], ['BRAD-2', true, true], 'fixture');
  }
  if (SCN === 'XSHe') A.ev(`setNote('A', 'BRAD-2'); setAlloc('A', '720'); 'ok'`);
  if (SCN === 'XSHdL' || SCN === 'XSHn') {
    A.ev(`setNote('A', 'BRAD-2'); setAlloc('A', '720'); 'ok'`);
    if (SCN === 'XSHdL') A.ev(`sharedArrived(${J(st)}); 'ok'`);
    const aL = view(A.ev, 'before the landed save');
    ck('fixture.typed', 'BRAD-2 typed, unsaved ([screen, DIRTY, link offered])', [aL.screen.whose, aL.DIRTY, hasBtn(aL, 'adoptShared')], ['BRAD-2', true, SCN === 'XSHdL'], 'fixture');
    A.ev(`globalThis.__q=[]; 'ok'`);
    await A.ev('saveInPlace()'); await settle(A);
    const aS = view(A.ev, 'the save landed');
    const h2 = headOf(fold);
    step('landedFirst', { brad: aS, head: h2 });
    ck('fixture.landed', 'the save landed BEFORE any load: head BRAD-2, clean against it, nothing asked ([head, clean, base = head ts, questions])',
      [h2.whose, cleanOf(aS), aS.baseFolder === h2.ts, qs(A.ev).length], ['BRAD-2', true, true, 0], 'fixture');
    if (SCN === 'XSHdL') ck('XSHdL.linkAfterLanding', 'after the save lands the status line no longer offers "load the shared one" ([button present])', hasBtn(aS, 'adoptShared'), EXPX.linkAfterLanding, 'predict');
  }
  if (SCN === 'XSHn') {
    // the board reopened (this browser's storage, the same file), the opening's connect; then the shared file's answer arrives
    const Z = boot({ html: F1, ls: lsOf(A.ev) }); await pause(80);
    wire(Z.ev, 'Brad', KEY.brad); connect(Z.ev, Z.w, fold);
    const zc = await Z.ev('driveAutoConnect()');
    const z0 = view(Z.ev, 'reopened, after the opening connect');
    Z.ev(`sharedArrived(${J(st)}); 'ok'`);
    const z1 = view(Z.ev, 'the older shared state file arrived');
    step('reopenArrived', { connect: zc, afterConnect: z0, afterArrived: z1 });
    ck('fixture.reopen', 'reopened clean on BRAD-2 = the folder head ([screen, clean, base = head ts])', [z0.screen.whose, cleanOf(z0), z0.baseFolder === headOf(fold).ts], ['BRAD-2', true, true], 'fixture');
    ck('XSHn.linkElse', 'the opening offers "load the shared one (yours is kept aside first)" ([button, words])', [hasBtn(z1, 'adoptShared') && /local changes are newer than the shared state/.test(z1.status)], [EXPX.linkElse], 'predict');
    E = Z;
  }
  if (SCN === 'XSHd' || SCN === 'XSHe') {
    const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
    A.ev(`globalThis.__q=[]; 'ok'`);
    const p = A.ev('saveInPlace()');
    const reached = await until(() => (fold.hits.main || 0) > n0);
    const mid = view(A.ev, 'save held at the close of its write');
    step('held', { reached, brad: mid, asked: qs(A.ev) });
    ck('fixture.held', 'the 💾 Save is held at the close of its main write ([reached, _saveBusy, head still BRAD-1, questions])', [reached, mid._saveBusy, headOf(fold).whose, qs(A.ev).length], [true, 1, 'BRAD-1', 0], 'fixture');
    ck(SCN + '.linkHeld', 'while the save is writing, the status line still shows the "load the shared one" button ([button adoptShared() present])', hasBtn(mid, 'adoptShared'), EXPX.linkHeld, 'predict');
    H = { g, p };
  }
  const gen0 = E.ev('_saveGen');
  let how;
  if (SCN === 'XSHdL') { E.ev(`globalThis.__q=[]; adoptShared(); 'ok'`); how = 'adoptShared() called directly (SHORTCUT: the link is gone once the save has landed)'; }
  else { E.ev(`globalThis.__q=[]; 'ok'`); how = 'DOM click: ' + clickBtn(E.ev, 'adoptShared'); }
  const m1 = view(E.ev, 'after the load');
  step('adoption', { how, brad: m1 });
  ck(SCN + '.adopt', 'the shared state file is put on screen (' + how + ') ([screen, _saveBusy, _saveGen unchanged, kept slot, said])',
    [m1.screen.whose, m1._saveBusy, m1._saveGen === gen0, m1.kept ? m1.kept.whose : null, /Shared state loaded/.test(m1.status)], EXPX.adopt, 'predict');
  if (H) { H.g.open(); await H.p; await settle(E); }
  const aft = view(E.ev, 'settled');
  const fa = fview(fold, 'settled');
  const extra = [v1];
  const t = [aft.screen.whose, cleanOf(aft), contentOfTs(fold, aft.baseFolder, extra)];
  step('settled', { brad: aft, folder: fa });
  rec.u17state = { tuple: t, falselyClean: falselyCleanOf(t) };
  ck(SCN + '.K1', 'once settled [screen, recorded clean, base copy]', t, EXPX.K1, 'predict');
  checks.push({ id: SCN + '.contractK1', kind: 'contract', what: 'recorded clean only against a copy holding what is on screen', expected: 'not falsely clean', observed: t, pass: !falselyCleanOf(t) });
  if (NEXT === 'save') {
    const hb = headOf(fold);
    E.ev(`globalThis.__q=[]; 'ok'`);
    await E.ev('saveInPlace()'); await settle(E);
    const asked = qs(E.ev); const af = view(E.ev, 'after the next Save'); const ha = headOf(fold);
    const t3 = [asked.length, aft.screen.whose, hb && hb.whose, ha && ha.whose, sayKind(af.status), cleanOf(af), !!ha && af.baseFolder === ha.ts];
    step('V3next', { asked, after: af, folder: fview(fold, 'after next save') });
    ck(SCN + '.V3next', "the next 💾 Save " + J(['questions', 'screen before', 'head before', 'head after', 'status', 'clean after', 'record names head']), t3, EXPX.v3, 'predict');
    const prev = hb && hb.whose;
    rec.v3where = { overwritten: prev, inHistory: histOf(fold).filter(x => x.whose === prev).map(x => x.name), keptSlot: !!(af.kept && af.kept.whose === prev) };
  }
};

// =============================================================================================== file routes
const runFile = async () => {
  const F1 = baseFile('Brad', KEY.brad);
  const verOf = html => { const c = rawContent(JSON.stringify(fileStore(html))); return { ts: fileTs(html), whose: whose(c) }; };
  const versions = [];
  const seen = html => { const v = verOf(html); if (!versions.some(x => x.ts === v.ts && x.whose === v.whose)) versions.push({ ...v, tsET: et(v.ts) }); return v; };
  seen(F1);
  const A = boot({ html: F1 }); await pause(80);
  wire(A.ev, 'Brad', KEY.brad); const f = disk(A.w, F1);
  const share = B => { B.w.__disk = A.w.__disk; B.ev(`FH=globalThis.__disk; window.showSaveFilePicker=function(){ throw new Error('the picker was opened'); }; 'ok'`); };
  const fileWhose = () => verOf(f.content).whose;
  const baseCopy = v => { const b = +((v.baseGet || {}).file || 0); const x = versions.find(y => y.ts === b); return x ? x.whose : '(no version with that time)'; };
  A.ev(`setNote('A', 'BRAD-1'); setAlloc('A', '700'); 'ok'`);
  await A.ev('saveInPlace()'); await settle(A); seen(f.content);
  ck('fixture.v1', 'BRAD-1 saved into the board file', [fileWhose(), f.writes], ['BRAD-1', 1], 'fixture');
  let E = A, H = null, st = null;
  if (SCN === 'XFSHd') {
    const R0 = boot({ html: F1 }); await pause(80); wire(R0.ev, 'Carol', KEY.carol);
    R0.ev(`setNote('A', 'SHARED'); setAlloc('A', '600'); 'ok'`); st = JSON.parse(R0.ev('JSON.stringify(MS)'));
    A.ev(`setNote('A', 'BRAD-2'); setAlloc('A', '720'); 'ok'`);
    A.ev(`sharedArrived(${J(st)}); 'ok'`);
    const a = view(A.ev, 'arrived');
    ck('fixture.arrived', 'BRAD-2 typed; the shared file arrived; link offered ([screen, DIRTY, button])', [a.screen.whose, a.DIRTY, hasBtn(a, 'adoptShared')], ['BRAD-2', true, true], 'fixture');
  } else if (SCN === 'XFSHn' || SCN === 'XFSHdL') {
    // Carol's shared state file, made BEFORE Brad types BRAD-2 (so it is older than the copy on screen)
    const R0 = boot({ html: F1 }); await pause(80); wire(R0.ev, 'Carol', KEY.carol);
    R0.ev(`setNote('A', 'SHARED'); setAlloc('A', '600'); 'ok'`); st = JSON.parse(R0.ev('JSON.stringify(MS)'));
    await pause(5);
    A.ev(`setNote('A', 'BRAD-2'); setAlloc('A', '720'); 'ok'`);
    if (SCN === 'XFSHdL') {
      A.ev(`sharedArrived(${J(st)}); 'ok'`);
      const a = view(A.ev, 'arrived');
      ck('fixture.arrived', 'BRAD-2 typed; the shared file arrived; link offered ([screen, DIRTY, button])', [a.screen.whose, a.DIRTY, hasBtn(a, 'adoptShared')], ['BRAD-2', true, true], 'fixture');
    }
    A.ev(`globalThis.__q=[]; 'ok'`);
    await A.ev('saveInPlace()'); await settle(A); seen(f.content);
    const aS = view(A.ev, 'the save of BRAD-2 landed');
    step('landedFirst', { brad: aS, asked: qs(A.ev) });
    ck('fixture.landed', 'the save landed BEFORE any load: BRAD-2 in the file, clean against it, nothing asked ([file, clean, record names, questions])',
      [fileWhose(), cleanOf(aS), baseCopy(aS), qs(A.ev).length], ['BRAD-2', true, 'BRAD-2', 0], 'fixture');
    if (SCN === 'XFSHdL') ck('XFSHdL.linkAfterLanding', 'after the save lands, the status line no longer offers "load the shared one"', hasBtn(aS, 'adoptShared'), EXPX.linkAfterLanding, 'predict');
    if (SCN === 'XFSHn') {
      const Z = boot({ html: f.content, ls: lsOf(A.ev) }); await pause(80); wire(Z.ev, 'Brad', KEY.brad); share(Z);
      const z0 = view(Z.ev, 'reopened from the BRAD-2 file');
      Z.ev(`sharedArrived(${J(st)}); 'ok'`);
      const z1 = view(Z.ev, 'the older shared state file arrived');
      step('reopenArrived', { afterOpen: z0, afterArrived: z1 });
      ck('XFSHn.reopen', 'reopened from the file: [screen, clean, the file version the record names]', [z0.screen.whose, cleanOf(z0), baseCopy(z0)], EXPX.reopen, 'predict');
      ck('XFSHn.linkElse', 'the opening offers "load the shared one (yours is kept aside first)" ([button, words])', [hasBtn(z1, 'adoptShared') && /local changes are newer than the shared state/.test(z1.status)], [EXPX.linkElse], 'predict');
      E = Z;
    }
  } else {
    // XFBT*: the opening that offers "open the file's version" (v1.89 _bootHeld, kept slot occupied)
    A.ev(`setNote('A', 'BRAD-2'); setAlloc('A', '720'); 'ok'`);                 // BRAD-2 typed, unsaved, in this browser's storage
    await pause(5);
    const X = boot({ html: f.content }); await pause(80); wire(X.ev, 'Brad', KEY.brad); share(X);   // Brad's other machine (same writer key)
    X.ev(`setNote('A', 'X-1'); setAlloc('A', '730'); 'ok'`);
    X.ev(`globalThis.__q=[]; 'ok'`); await X.ev('saveInPlace()'); await settle(X); seen(f.content);
    ck('fixture.x1', 'the other machine saved X-1 into the file, asking nothing ([file, questions])', [fileWhose(), qs(X.ev).length], ['X-1', 0], 'fixture');
    const A2 = boot({ html: f.content, ls: lsOf(A.ev) }); await pause(80); wire(A2.ev, 'Brad', KEY.brad); share(A2);
    const a2 = view(A2.ev, 'reopened: the file is newer; BRAD-2 kept aside');
    ck('fixture.reopen1', 'reopening: the newer file X-1 opens and BRAD-2 is kept aside ([screen, kept, clean, record names X-1, put-back link])',
      [a2.screen.whose, a2.kept && a2.kept.whose, cleanOf(a2), baseCopy(a2), hasBtn(a2, 'keptPutBack')], ['X-1', 'BRAD-2', true, 'X-1', true], 'fixture');
    A2.ev(`setNote('A', 'BRAD-3'); setAlloc('A', '750'); 'ok'`);               // BRAD-3 typed, unsaved
    await pause(5);
    X.ev(`setNote('A', 'X-2'); setAlloc('A', '740'); globalThis.__q=[]; 'ok'`); await X.ev('saveInPlace()'); await settle(X); seen(f.content);
    ck('fixture.x2', 'the other machine saved X-2 ([file, questions])', [fileWhose(), qs(X.ev).length], ['X-2', 0], 'fixture');
    const A3 = boot({ html: f.content, ls: lsOf(A2.ev) }); await pause(80); wire(A3.ev, 'Brad', KEY.brad); share(A3);
    const a3 = view(A3.ev, 'reopened: file newer, kept slot occupied');
    step('bootHeld', { brad: a3, versions: versions.slice() });
    ck(SCN + '.boot', 'the opening: newer file, work cannot be kept aside (kept slot occupied), "open the file\'s version" offered ([screen, kept, button bootTakeFile(), file])',
      [a3.screen.whose, a3.kept && a3.kept.whose, hasBtn(a3, 'bootTakeFile'), fileWhose()], EXPX.boot, 'predict');
    E = A3;
  }
  if (SCN === 'XFBT' || SCN === 'XFSHd') {
    const n0 = f.hits.close || 0; f.hold.close = gate(); const g = f.hold.close;
    E.ev(`globalThis.__q=[]; 'ok'`);
    const p = E.ev('saveInPlace()');
    const reached = await until(() => (f.hits.close || 0) > n0);
    const mid = view(E.ev, 'file save held at its close');
    const asked = qs(E.ev);
    step('held', { reached, brad: mid, asked });
    ck('fixture.held', 'the 💾 Save into the file reached its close and is held ([reached, _saveBusy])', [reached, mid._saveBusy], [true, 1], 'fixture');
    if (SCN === 'XFBT') ck('XFBT.heldAsked', 'the save asked HOLD ON (the file is newer than the copy on screen came from), answered OK ([questions])', asked.length, EXPX.heldAsked, 'predict');
    ck(SCN + '.linkHeld', 'while the save writes, the status line still shows the button (' + (SCN === 'XFBT' ? 'bootTakeFile' : 'adoptShared') + ')',
      hasBtn(mid, SCN === 'XFBT' ? 'bootTakeFile' : 'adoptShared'), EXPX.linkHeld, 'predict');
    H = { g, p };
  }
  if (SCN === 'XFBTL') {
    E.ev(`globalThis.__q=[]; 'ok'`);
    await E.ev('saveInPlace()'); await settle(E); seen(f.content);
    const asked = qs(E.ev); const aS = view(E.ev, 'the save landed');
    step('landedFirst', { brad: aS, asked });
    ck('XFBTL.heldAsked', 'the save asked HOLD ON, answered OK', asked.length, EXPX.heldAsked, 'predict');
    ck('fixture.landed', 'the save landed: BRAD-3 in the file, clean against it', [fileWhose(), cleanOf(aS), baseCopy(aS)], ['BRAD-3', true, 'BRAD-3'], 'fixture');
    ck('XFBTL.linkAfterLanding', 'after the save lands, the status line no longer offers "open the file\'s version"', hasBtn(aS, 'bootTakeFile'), EXPX.linkAfterLanding, 'predict');
  }
  const gen0 = E.ev('_saveGen');
  let how;
  E.ev(`globalThis.__q=[]; 'ok'`);
  if (SCN === 'XFBTL') { E.ev(`bootTakeFile(); 'ok'`); how = 'bootTakeFile() called directly (SHORTCUT: the link is gone once the save has landed)'; }
  else if (SCN === 'XFSHdL') { E.ev(`adoptShared(); 'ok'`); how = 'adoptShared() called directly (SHORTCUT: the link is gone once the save has landed)'; }
  else how = 'DOM click: ' + clickBtn(E.ev, /^XFSH/.test(SCN) ? 'adoptShared' : 'bootTakeFile');
  const askedAtLoad = qs(E.ev);
  const m1 = view(E.ev, 'after the load');
  step('adoption', { how, asked: askedAtLoad, brad: m1 });
  ck(SCN + '.adopt', 'the other copy is put on screen (' + how + ') ([screen, _saveBusy, _saveGen unchanged, kept slot, said])',
    [m1.screen.whose, m1._saveBusy, m1._saveGen === gen0, m1.kept ? m1.kept.whose : null, (/^XFSH/.test(SCN) ? /Shared state loaded/ : /Opened the saved file/).test(m1.status)], EXPX.adopt, 'predict');
  if (H) { H.g.open(); await H.p; await settle(E); seen(f.content); }
  const aft = view(E.ev, 'settled');
  const t = [aft.screen.whose, cleanOf(aft), baseCopy(aft)];
  step('settled', { brad: aft, file: fileWhose(), versions: versions.slice() });
  ck(SCN + '.file', 'the file once settled', fileWhose(), EXPX.file || 'BRAD-2', 'predict');
  rec.u17state = { tuple: t, falselyClean: falselyCleanOf(t) };
  ck(SCN + '.K1', 'once settled [screen, recorded clean, the file version the record names]', t, EXPX.K1, 'predict');
  checks.push({ id: SCN + '.contractK1', kind: 'contract', what: 'recorded clean only against a file version holding what is on screen', expected: 'not falsely clean', observed: t, pass: !falselyCleanOf(t) });
  const whereF = (c, v) => ({ file: fileWhose() === c, screen: v.screen.whose === c, storage: v.stored.whose === c, keptSlot: !!(v.kept && v.kept.whose === c),
    earlierFileVersionsOnly: versions.filter(x => x.whose === c && x.ts !== fileTs(f.content)).map(x => x.tsET) });
  if (NEXT === 'save') {
    const fb = fileWhose();
    E.ev(`globalThis.__q=[]; 'ok'`);
    await E.ev('saveInPlace()'); await settle(E); seen(f.content);
    const asked = qs(E.ev); const af = view(E.ev, 'after the next Save'); const fa2 = fileWhose();
    const t3 = [asked.length, aft.screen.whose, fb, fa2, sayKind(af.status), cleanOf(af), +af.baseGet.file === fileTs(f.content)];
    const w3 = whereF('BRAD-3', af);
    step('V3next', { asked: asked.map(q => q.slice(0, 300)), after: af, versions: versions.slice(), whereBRAD3: w3, whereBRAD2: whereF('BRAD-2', af), whereX2: whereF('X-2', af) });
    ck(SCN + '.V3next', 'the next 💾 Save ' + J(['questions', 'screen before', 'file before', 'file after', 'status', 'clean after', 'record names file']), t3, EXPX.v3, 'predict');
    if (!/^XFSH/.test(SCN)) {
      const reach = w3.file || w3.screen || w3.storage || w3.keptSlot;
      ck(SCN + '.reachBRAD3', 'BRAD-3 in a copy this board can reach after the next Save (file, screen, storage, kept slot)', reach, EXPX.reach3, 'predict');
      rec.whereBRAD3 = w3;
    } else {
      const wc = whereF(EXPX.reachC, af);
      ck(SCN + '.reach' + EXPX.reachC, EXPX.reachC + ' in a copy this board can reach after the next Save (file, screen, storage, kept slot)', wc.file || wc.screen || wc.storage || wc.keptSlot, EXPX.reach, 'predict');
      rec.whereBRAD3 = wc; rec.whereC = EXPX.reachC;
    }
  }
  if (NEXT === 'putback') {
    const fb = fileWhose();
    E.ev(`globalThis.__q=[]; keptPutBack(); 'ok'`);
    const q1 = qs(E.ev).find(q => /Put back the work this browser kept aside/.test(q)) || null;
    const pv = view(E.ev, 'after put back');
    E.ev(`globalThis.__q=[]; 'ok'`);
    await E.ev('saveInPlace()'); await settle(E); seen(f.content);
    const asked2 = qs(E.ev); const af = view(E.ev, 'after put back + Save');
    const t4 = [aft.kept ? aft.kept.whose : null, qKind(q1), aft.screen.whose, fb, pbKind(pv.status), pv.kept ? pv.kept.whose : null, pv.screen.whose, fileWhose(), sayKind(af.status), asked2.length];
    step('V4putback', { question: q1, afterPutBack: pv, saveAsked: asked2.map(q => q.slice(0, 300)), afterSave: af, whereSHARED: whereF('SHARED', af) });
    ck(SCN + '.V4putback', 'put back then Save', t4, EXPX.v4, 'predict');
  }
};

try {
  if (/^XF/.test(SCN)) await runFile(); else await runFolder();
} catch (e) {
  checks.push({ id: SCN + '.harness', kind: 'harness', what: 'the scenario threw', expected: 'ran', observed: String((e && e.stack) || e).slice(0, 800), pass: false });
}
rec.endedET = et(Date.now());
rec.checks = checks;
writeFileSync(outPath, JSON.stringify(rec, null, 1));
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} [${c.kind}] ${c.id}: ${c.what}\n     expected ${J(c.expected)}\n     observed ${J(c.observed)}`);
if (rec.u17state) console.log('u17state ' + J(rec.u17state));
if (rec.v3where) console.log('v3where ' + J(rec.v3where));
if (rec.whereBRAD3) console.log('whereBRAD3 ' + J(rec.whereBRAD3));
console.log(`ids ${J(IDS)}`);
const byKind = k => { const c = checks.filter(x => x.kind === k); return `${k} ${c.filter(x => x.pass).length}/${c.length}`; };
console.log(`SUMMARY ${SCN} ${NEXT} board=${BK}: ${checks.filter(c => c.pass).length} pass, ${checks.filter(c => !c.pass).length} fail | ${['fixture', 'predict', 'contract', 'harness'].map(byKind).join(' | ')}`);
process.exit(0);
