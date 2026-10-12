// u2ext.mjs -- VERIFIER extension: lines 2..322 are the builder u2probe.mjs (blob 363beee7) verbatim; scenarios E1-E3 are new.
// u2probe.mjs -- bounded, synthetic draft checks for U2 (keptPutBack during a running save).
//   usage: node u2probe.mjs <boardRoot> <variant> <outJson>
// Reproduces and measures only; changes nothing in any board or tool. Every board is booted from <boardRoot>'s own
// tools/export-audit/boot.mjs with BOARD unset (asserted), the root's runtime-encoding-shim.mjs imported first.
//
// FIXTURE (literal, written by hand): requirement A's note carries which work is which.
//   'F0-BASE'      the first folder/file copy Alice saved
//   'K-KEPTWORK'   Alice's unsaved work that a newer copy displaces -> KEPT ASIDE through the product path
//   'N-NEWER'      the newer copy Alice's other browser saved (the one that displaced K)
//   'S1-ONSCREEN'  the work on screen (unsaved) when the save of it starts and K is put back
// No ORBIT helper computes any expected value; helpers are only read for observed values.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(process.argv[2]);
const variant = process.argv[3];
const outPath = resolve(process.argv[4]);
delete process.env.BOARD;
delete process.env.MUT_FIRST_FAIL;
await import(pathToFileURL(root + '/runtime-encoding-shim.mjs').href);
const { boot, seed, bootMark, bootRelease, settleBoards, BOARD } = await import(pathToFileURL(root + '/tools/export-audit/boot.mjs').href);
const sha = b => createHash('sha1').update(b).digest('hex');
const blobOf = buf => createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
const boardPath = root + '/prioritization-board-grid.html';
if (resolve(BOARD) !== boardPath) throw new Error(`boot.mjs BOARD is ${BOARD}, not ${boardPath}`);
const IDS = {
  board: blobOf(readFileSync(boardPath)), bootMjs: blobOf(readFileSync(root + '/tools/export-audit/boot.mjs')),
  shim: blobOf(readFileSync(root + '/runtime-encoding-shim.mjs')), probe: blobOf(readFileSync(new URL(import.meta.url))),
  BOARD: resolve(BOARD), started: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET', variant,
};
console.log('IDS', JSON.stringify(IDS));

// ---- W1H helpers, copied from orbit-board tools/export-audit/audit-import.mjs (via the R5-verify scratch probe) ----
const J = JSON.stringify;
const SVC = ['USAF', 'ANG', 'AFRC'];
const mk = (id, ask) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Req ' + id, event: 'E' + id, ccar: '', fy26: [0, 0, 0], ask, alloc: null });
const tick = () => new Promise(r => setImmediate(r));
const until = async (cond, max = 6000) => { for (let i = 0; i < max; i++) { if (cond()) return true; await tick(); } return false; };
const gate = () => { let res, rej; const p = new Promise((a, b) => { res = a; rej = b; }); return { p, open: () => res(), fail: e => rej(e) }; };
const lsOf = ev => JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
const KEY = { alice: 'a0000000000000000000000000000002' };
const wire = (ev, name, key) => ev(`localStorage.setItem('prio27who', ${J(name)}); localStorage.setItem('prio27writerKey', ${J(key)});
    globalThis.__q=[]; globalThis.__yes=true; globalThis.__dl=0;
    window.confirm=function(q){ globalThis.__q.push(String(q)); return globalThis.__yes; }; window.alert=function(){};
    URL.createObjectURL=function(){ globalThis.__dl++; return 'blob:x'; }; URL.revokeObjectURL=function(){}; 'ok'`);
const qs = ev => JSON.parse(ev('JSON.stringify(globalThis.__q)'));
const status = ev => ev(`(document.getElementById('shareStat')||{}).textContent||''`);
const header = ev => ev(`(document.getElementById('saveState')||{}).textContent||''`);
const pubOf = html => { const m = html.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/); return m ? JSON.parse(m[1]) : null; };
const fileTs = html => { const p = pubOf(html); let t = 0; Object.keys(p.appns).forEach(k => { const s = p.appns[k]; if (s && s.ts > t) t = s.ts; }); return t; };
const fileStore = html => pubOf(html).appns.om;
const fileNote = (html, id, yr) => { const st = fileStore(html); return String((((st.years || {})[yr || st.cur] || {}).notes || {})[id] || ''); };
const baseFile = (by, key) => {
  const A = boot(); seed(A.ev, { services: SVC, items: [mk('A', [900, 200, 100]), mk('B', [400, 100, 50])], disc: [2000, 600, 300], mand: [500, 150, 80], order: ['A', 'B'] });
  A.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`);
  A.ev(`localStorage.setItem('prio27writerKey', ${J(key)}); if(typeof writerFp==='function') WRITER={by:${J(by)}, fp:writerFp(), t:1}; 'ok'`);
  const h = A.ev('buildSavedHtml()'); close(A); return h;
};
const disk = (w, content) => {
  const f = { content, writes: 0, hits: {}, hold: {}, failClose: null, failOpen: null };
  const wait = async ph => { f.hits[ph] = (f.hits[ph] || 0) + 1; const g = f.hold[ph]; if (g) { delete f.hold[ph]; await g.p; } };
  w.__disk = { name: 'Board.html', requestPermission: async () => 'granted',
    getFile: async () => { await wait('read'); const c = f.content; return { text: async () => c }; },
    createWritable: async () => { await wait('open'); if (f.failOpen) { const e = f.failOpen; f.failOpen = null; throw e; }
      let buf = ''; return { write: async x => { buf += String(x); await wait('write'); },
        close: async () => { await wait('close'); if (f.failClose) { const e = f.failClose; f.failClose = null; throw e; } f.content = buf; f.writes++; } }; } };
  w.eval(`FH=globalThis.__disk; window.showSaveFilePicker=function(){ throw new Error('the picker was opened'); }; 'ok'`);
  return f;
};
const folder = () => {
  const rootD = { files: {}, dirs: {}, fail: {} };
  const fold = { root: rootD, hold: {}, hits: {}, failNext: {}, failRead: {}, log: [] };
  const kindOf = (st, n) => st !== rootD ? 'hist' : (/\.lock\.json$/.test(n) ? 'lock' : 'main');
  const wait = async (k, n) => { fold.hits[k] = (fold.hits[k] || 0) + 1; fold.log.push(k + ':' + n); const g = fold.hold[k]; if (g) { delete fold.hold[k]; await g.p; } };
  const dirOf = st => ({ kind: 'directory', name: 'shared', queryPermission: async () => 'granted', requestPermission: async () => 'granted',
    getFileHandle: async (n, o) => { if (!(n in st.files)) { if (o && o.create) st.files[n] = ''; else { const e = new Error('not found'); e.name = 'NotFoundError'; throw e; } }
      return { kind: 'file', name: n,
        getFile: async () => { if (fold.failRead[n]) { const e = fold.failRead[n]; delete fold.failRead[n]; throw e; } const c = st.files[n]; return { text: async () => c }; },
        createWritable: async () => { let buf = ''; return { write: async x => { buf += String(x); },
          close: async () => { const k = kindOf(st, n); await wait(k, n); if (fold.failNext[k]) { const e = fold.failNext[k]; delete fold.failNext[k]; throw e; } st.files[n] = buf; } }; } }; },
    getDirectoryHandle: async (n, o) => { if (!st.dirs[n]) { if (o && o.create) st.dirs[n] = { files: {}, dirs: {}, fail: {} }; else { const e = new Error('not found'); e.name = 'NotFoundError'; throw e; } } return dirOf(st.dirs[n]); },
    removeEntry: async n => { delete st.files[n]; },
    values: async function* () { for (const n of Object.keys(st.files)) yield { kind: 'file', name: n, getFile: async () => ({ text: async () => st.files[n] }) }; } });
  fold.dir = dirOf(rootD);
  fold.raw = fy => rootD.files['spmt-' + fy + '-om.json'];
  fold.copy = fy => { const t = fold.raw(fy); return t ? JSON.parse(t) : null; };
  fold.note = (fy, id) => { const j = fold.copy(fy); if (!j) return '(no copy)'; const st = j.store; return String((((st.years || {})[fy] || {}).notes || {})[id] || ''); };
  fold.histNotes = fy => Object.keys((rootD.dirs.history || { files: {} }).files).sort().map(n => { try { return JSON.parse(rootD.dirs.history.files[n]).store.years[fy].notes.A; } catch (e) { return '?'; } });
  return fold;
};
const connect = (ev, w, fold) => { w.__fold = fold.dir; ev(`_liveCfg=Object.assign(liveCfg(), {store:true, mode:'drive', on:false}); _driveDir=globalThis.__fold; 'ok'`); };
const pause = ms => new Promise(r => setTimeout(r, ms));
function close(B) { try { B.w.close(); } catch {} }

// ---- observation helpers (read only) ----
const noteOfStore = raw => { try { const st = JSON.parse(raw); return String(((st.years || {})[st.cur] || {}).notes ? st.years[st.cur].notes.A || '' : ''); } catch (e) { return '(unreadable)'; } };
const keptSlot = ev => {
  const s = ev(`localStorage.getItem(_AP.key+'.kept')`);
  if (s == null) return { present: false, sha1: null, len: 0, note: null, meta: null };
  const i = s.indexOf('\n'); const meta = JSON.parse(s.slice(0, i));
  return { present: true, sha1: sha(s), len: s.length, note: noteOfStore(s.slice(i + 1)), meta };
};
const keptRaw = ev => ev(`localStorage.getItem(_AP.key+'.kept')`);
const flags = ev => JSON.parse(ev(`JSON.stringify({DIRTY:DIRTY, _baseDirty:_baseDirty, base:baseGet(), LASTKNOWN:LASTKNOWN, driveBase:(typeof _driveBase!=='undefined'? _driveBase : null), _saveGen:_saveGen, _saveBusy:_saveBusy, MSts:MS.ts, cur:MS.cur})`));
const screen = ev => ev('String(S.notes.A)');
const browserMain = ev => noteOfStore(ev(`localStorage.getItem(_AP.key)`));

const OUT = { IDS, folder: {}, file: {}, errors: [] };
const T = {};   // timestamps of the fixture's copies, for the symbolic rendering only
const sym = v => {
  let s = typeof v === 'string' ? v : J(v);
  for (const [k, t] of Object.entries(T)) if (t) s = s.split(String(t)).join('<' + k + '>');
  s = s.replace(/\b1[78]\d{11}\b/g, '<T?>');
  s = s.replace(/\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2}\s?[AP]M/g, '<when>');
  s = s.replace(/\b(just now|\d+ (seconds?|minutes?) ago|a moment ago)\b/g, '<age>');
  return s;
};

// The board file every scenario opens: requirements A and B, saved once by Alice (writer).
const F1 = baseFile('Alice', KEY.alice);
T.F1 = fileTs(F1);

// ====================================================================================== R-folder
// Product path for K: Alice has K unsaved; her other browser saves N-NEWER to the folder; Alice presses Save
// (refused: somebody saved after the copy her work came from) and chooses "Load theirs" -> K is kept aside
// (keepAside why:'folder', base = the copy K came from), N-NEWER loads, clean. Then she types S1 (unsaved).
async function folderSetup(tag) {
  const fold = folder();
  const A = boot({ html: F1 }); await pause(80);
  wire(A.ev, 'Alice', KEY.alice); connect(A.ev, A.w, fold);
  const fy = A.ev('MS.cur');
  A.ev(`setNote('A','F0-BASE'); 'ok'`); await pause(5);
  const r0 = await A.ev('driveStorePush(false)'); T.t0 = (fold.copy(fy).store || {}).ts; await pause(5);
  A.ev(`setNote('A','K-KEPTWORK'); 'ok'`); T.kTs = A.ev('MS.ts'); await pause(5);
  const A2 = boot({ html: F1 }); await pause(80);
  wire(A2.ev, 'Alice', KEY.alice); connect(A2.ev, A2.w, fold);
  const p2 = await A2.ev('driveStorePull(false)'); await pause(5);
  A2.ev(`setNote('A','N-NEWER'); 'ok'`); await pause(5);
  const r2 = await A2.ev('driveStorePush(false)'); T.t1 = (fold.copy(fy).store || {}).ts; close(A2); await pause(5);
  const q0 = qs(A.ev).length;
  await A.ev('saveInPlace()');                       // 💾 Save: refused, the folder was saved after K's copy
  const clash = { status: status(A.ev), head: fold.note(fy, 'A'), prompts: qs(A.ev).slice(q0) };
  const rl = await A.ev(`driveResolve('theirs')`);   // "Load theirs": K kept aside, N-NEWER loaded
  const afterLoad = { screen: screen(A.ev), kept: keptSlot(A.ev), flags: flags(A.ev), status: status(A.ev) };
  await pause(5);
  A.ev(`setNote('A','S1-ONSCREEN'); 'ok'`); T.s1Edit = A.ev('MS.ts'); await pause(5);
  const setup = { tag, fy, r0, p2, r2, clash, rl, afterLoad,
    beforeRace: { screen: screen(A.ev), kept: keptSlot(A.ev), flags: flags(A.ev), head: fold.note(fy, 'A'), hist: fold.histNotes(fy) } };
  return { A, fold, fy, setup };
}
const where = (A, fold, fy, extra = {}) => {
  const k = keptSlot(A.ev);
  const o = { screen: screen(A.ev), browserMain: browserMain(A.ev), kept: k.note, folderHead: fold ? fold.note(fy, 'A') : undefined, folderHist: fold ? fold.histNotes(fy) : undefined, ...extra };
  const places = n => Object.entries(o).filter(([, v]) => Array.isArray(v) ? v.includes(n) : v === n).map(([p]) => p);
  return { ...o, K_in: places('K-KEPTWORK'), S1_in: places('S1-ONSCREEN') };
};

async function folderRace() {
  const mark = bootMark();
  const R = {};
  const { A, fold, fy, setup } = await folderSetup('race');
  R.setup = setup;
  // the race: a folder save of S1, held at the close of its write of the copy itself; K put back there.
  const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
  const p = A.ev('driveStorePush(false)');
  R.reached = await until(() => (fold.hits.main || 0) > n0);
  const pre = { keptRaw: keptRaw(A.ev), ms: A.ev('JSON.stringify(MS)'), busy: A.ev('_saveBusy'), gen: A.ev('_saveGen'), screen: screen(A.ev) };
  T.s1Save = A.ev('MS.ts');
  const qa = qs(A.ev).length;
  A.ev('keptPutBack()');
  const postRaw = keptRaw(A.ev), postMs = A.ev('JSON.stringify(MS)');
  R.during = { saveBusyAtCall: pre.busy, genBefore: pre.gen, genAfter: A.ev('_saveGen'), screenBefore: pre.screen, screenAfter: screen(A.ev),
    keptByteIdentical: postRaw === pre.keptRaw, msByteIdentical: postMs === pre.ms,
    keptBefore_sha1: pre.keptRaw == null ? null : sha(pre.keptRaw), keptAfter_sha1: postRaw == null ? null : sha(postRaw),
    ms_sha1_before: sha(pre.ms), ms_sha1_after: sha(postMs),
    prompts: qs(A.ev).slice(qa), status: status(A.ev), flags: flags(A.ev), kept: keptSlot(A.ev) };
  g.open(); R.ret = await p; await pause(20);
  T.t2 = (fold.copy(fy).store || {}).ts;
  R.afterLanding = { flags: flags(A.ev), where: where(A, fold, fy), kept: keptSlot(A.ev), status: status(A.ev), header: header(A.ev),
    folderHeadTs: T.t2, folderHeadBy: (fold.copy(fy) || {}).by, keptStillByteIdenticalToBeforeCall: keptRaw(A.ev) === pre.keptRaw };
  // REOPENING CONTROL (1): this browser's storage and the same folder, right after the landing; the refresh pulls.
  { const ls = lsOf(A.ev); const B = boot({ html: F1, ls }); await pause(80); wire(B.ev, 'Alice', KEY.alice); connect(B.ev, B.w, fold);
    const fB = flags(B.ev); const sB0 = screen(B.ev);
    const r = await B.ev('driveStorePull(false)');
    R.reopen1 = { openedScreen: sB0, openedFlags: fB, pull: r, flags: flags(B.ev), where: where(B, fold, fy), kept: keptSlot(B.ev), status: status(B.ev), header: header(B.ev) };
    B.ev(`setNote('B','EDIT-AFTER-REOPEN'); 'ok'`);
    R.reopen1.afterOneEdit = { where: where(B, fold, fy), kept: keptSlot(B.ev) };
    close(B); }
  // RETRY CONTROL: put back again once the save has landed (only where the first put-back did not happen), then Save.
  const putBackHappened = R.afterLanding.where.screen === 'K-KEPTWORK';
  R.retry = { applicable: !putBackHappened };
  if (!putBackHappened) {
    const q1 = qs(A.ev).length;
    A.ev('keptPutBack()');
    R.retry.putBack = { prompts: qs(A.ev).slice(q1), flags: flags(A.ev), where: where(A, fold, fy), kept: keptSlot(A.ev), status: status(A.ev) };
  }
  // ... then 💾 Save (the folder save path), recording whether it asked before writing over the folder's copy.
  { const q2 = qs(A.ev).length; const headBefore = fold.note(fy, 'A');
    await A.ev('saveInPlace()');
    const s1 = { headBefore, headAfter: fold.note(fy, 'A'), status: status(A.ev), prompts: qs(A.ev).slice(q2), flags: flags(A.ev) };
    s1.refusedWithChoice = /Nothing was written/.test(s1.status) && /Save yours over theirs/.test(s1.status);
    R.save = s1;
    if (s1.refusedWithChoice) {   // the person chooses "Save yours over theirs" (it asks, by confirm)
      const q3 = qs(A.ev).length;
      const rr = await A.ev(`driveResolve('mine')`);
      R.saveOver = { ret: rr, headAfter: fold.note(fy, 'A'), prompts: qs(A.ev).slice(q3), status: status(A.ev), flags: flags(A.ev) };
    }
    R.save.asked = s1.refusedWithChoice || s1.prompts.length > 0;
    R.afterSave = { where: where(A, fold, fy), flags: flags(A.ev), kept: keptSlot(A.ev) }; }
  // REOPENING CONTROL (2): after the retry and Save.
  { const ls = lsOf(A.ev); const B = boot({ html: F1, ls }); await pause(80); wire(B.ev, 'Alice', KEY.alice); connect(B.ev, B.w, fold);
    const r = await B.ev('driveStorePull(false)');
    R.reopen2 = { pull: r, flags: flags(B.ev), where: where(B, fold, fy), kept: keptSlot(B.ev), status: status(B.ev) };
    close(B); }
  R.T = { ...T };
  close(A);
  bootRelease(mark); await settleBoards();
  return R;
}

async function folderNoRace() {
  const mark = bootMark();
  const { A, fold, fy, setup } = await folderSetup('norace');
  const qa = qs(A.ev).length;
  const busy = A.ev('_saveBusy');
  A.ev('keptPutBack()');
  const k = keptSlot(A.ev);
  const R = { setupBeforeRace: setup.beforeRace, saveBusyAtCall: busy, prompts: qs(A.ev).slice(qa), flags: flags(A.ev), where: where(A, fold, fy),
    kept: k, status: status(A.ev), header: header(A.ev) };
  // normalized (timestamps rendered symbolically) for the cross-variant comparison
  R.cmp = sym({ screen: R.where.screen, DIRTY: R.flags.DIRTY, _baseDirty: R.flags._baseDirty, base: R.flags.base, driveBase: R.flags.driveBase,
    LASTKNOWN: R.flags.LASTKNOWN ? 'nonzero' : 0, keptNote: k.note, keptMeta: k.meta ? { why: k.meta.why, by: k.meta.by, ts: k.meta.ts, base: k.meta.base, t: '<t>' } : null,
    status: R.status, prompts: R.prompts, header: R.header, folderHead: R.where.folderHead, folderHist: R.where.folderHist });
  R.T = { ...T };
  close(A); bootRelease(mark); await settleBoards();
  return R;
}

// ====================================================================================== R-file
// Product path for K: Alice has K unsaved in this browser; her other browser saves N-NEWER into the board file;
// Alice reopens the board file -> the opening keeps K aside (keepAside why:'file', base = the save K came from)
// and opens N-NEWER. Then she types S1 (unsaved) and presses Save (the board-file save), held at its write.
async function fileSetup(tag) {
  const A = boot({ html: F1 }); await pause(80); wire(A.ev, 'Alice', KEY.alice); const f0 = disk(A.w, F1);
  const lk0 = A.ev('LASTKNOWN');
  A.ev(`setNote('A','K-KEPTWORK'); 'ok'`); T.kTs = A.ev('MS.ts'); await pause(5);
  const A2 = boot({ html: F1 }); await pause(80); wire(A2.ev, 'Alice', KEY.alice); const f2 = disk(A2.w, F1);
  A2.ev(`setNote('A','N-NEWER'); 'ok'`); await pause(5);
  await A2.ev('saveInPlaceFile()'); const newer = f2.content; T.fN = fileTs(newer); close(A2);
  const lsA = lsOf(A.ev); close(A); await pause(5);
  const A3 = boot({ html: newer, ls: lsA }); await pause(80); wire(A3.ev, 'Alice', KEY.alice); const f = disk(A3.w, newer);
  T.f1 = fileTs(F1);
  const opened = { screen: screen(A3.ev), kept: keptSlot(A3.ev), flags: flags(A3.ev), status: status(A3.ev), fileNote: fileNote(newer, 'A'), lk0 };
  A3.ev(`setNote('A','S1-ONSCREEN'); 'ok'`); T.s1EditF = A3.ev('MS.ts'); await pause(5);
  return { A: A3, f, setup: { tag, opened, beforeRace: { screen: screen(A3.ev), kept: keptSlot(A3.ev), flags: flags(A3.ev), fileHead: fileNote(f.content, 'A') } } };
}
const whereF = (A, f) => where(A, null, 0, { fileHead: fileNote(f.content, 'A') });

async function fileRace() {
  const mark = bootMark();
  const R = {};
  const { A, f, setup } = await fileSetup('race');
  R.setup = setup;
  const n0 = f.hits.write || 0; f.hold.write = gate(); const g = f.hold.write;
  const q00 = qs(A.ev).length;
  const p = A.ev('saveInPlaceFile()');
  R.reached = await until(() => (f.hits.write || 0) > n0);
  const pre = { keptRaw: keptRaw(A.ev), ms: A.ev('JSON.stringify(MS)'), busy: A.ev('_saveBusy'), gen: A.ev('_saveGen'), screen: screen(A.ev) };
  const qa = qs(A.ev).length;
  A.ev('keptPutBack()');
  const postRaw = keptRaw(A.ev), postMs = A.ev('JSON.stringify(MS)');
  R.during = { saveBusyAtCall: pre.busy, genBefore: pre.gen, genAfter: A.ev('_saveGen'), screenBefore: pre.screen, screenAfter: screen(A.ev),
    keptByteIdentical: postRaw === pre.keptRaw, msByteIdentical: postMs === pre.ms, promptsOfSave: qs(A.ev).slice(q00, qa),
    prompts: qs(A.ev).slice(qa), status: status(A.ev), flags: flags(A.ev), kept: keptSlot(A.ev) };
  g.open(); R.ret = await p; await pause(20);
  T.f2 = fileTs(f.content);
  R.afterLanding = { flags: flags(A.ev), where: whereF(A, f), kept: keptSlot(A.ev), status: status(A.ev), header: header(A.ev), fileTs: T.f2, fileWrites: f.writes,
    keptStillByteIdenticalToBeforeCall: keptRaw(A.ev) === pre.keptRaw };
  // REOPENING CONTROL (1): the same browser's storage and the board file as it is on disk now; the opening decides.
  { const ls = lsOf(A.ev); const B = boot({ html: f.content, ls }); await pause(80); wire(B.ev, 'Alice', KEY.alice);
    R.reopen1 = { flags: flags(B.ev), where: whereF(B, f), kept: keptSlot(B.ev), status: status(B.ev), header: header(B.ev),
      bootHeld: B.ev('JSON.stringify(_bootHeld)'), bootKept: B.ev('JSON.stringify(_bootKept)') };
    B.ev(`setNote('B','EDIT-AFTER-REOPEN'); 'ok'`);
    R.reopen1.afterOneEdit = { where: whereF(B, f), kept: keptSlot(B.ev) };
    close(B); }
  const putBackHappened = R.afterLanding.where.screen === 'K-KEPTWORK';
  R.retry = { applicable: !putBackHappened };
  if (!putBackHappened) {
    const q1 = qs(A.ev).length;
    A.ev('keptPutBack()');
    R.retry.putBack = { prompts: qs(A.ev).slice(q1), flags: flags(A.ev), where: whereF(A, f), kept: keptSlot(A.ev), status: status(A.ev) };
  }
  { const q2 = qs(A.ev).length; const headBefore = fileNote(f.content, 'A');
    await A.ev('saveInPlaceFile()');
    R.save = { headBefore, headAfter: fileNote(f.content, 'A'), prompts: qs(A.ev).slice(q2), status: status(A.ev), flags: flags(A.ev) };
    R.save.asked = R.save.prompts.length > 0;
    R.afterSave = { where: whereF(A, f), flags: flags(A.ev), kept: keptSlot(A.ev) }; }
  { const ls = lsOf(A.ev); const B = boot({ html: f.content, ls }); await pause(80); wire(B.ev, 'Alice', KEY.alice);
    R.reopen2 = { flags: flags(B.ev), where: whereF(B, f), kept: keptSlot(B.ev), status: status(B.ev),
      bootHeld: B.ev('JSON.stringify(_bootHeld)'), bootKept: B.ev('JSON.stringify(_bootKept)') };
    close(B); }
  R.T = { ...T };
  close(A); bootRelease(mark); await settleBoards();
  return R;
}
async function fileNoRace() {
  const mark = bootMark();
  const { A, f, setup } = await fileSetup('norace');
  const qa = qs(A.ev).length; const busy = A.ev('_saveBusy');
  A.ev('keptPutBack()');
  const k = keptSlot(A.ev);
  const R = { setupBeforeRace: setup.beforeRace, saveBusyAtCall: busy, prompts: qs(A.ev).slice(qa), flags: flags(A.ev), where: whereF(A, f), kept: k, status: status(A.ev), header: header(A.ev) };
  R.cmp = sym({ screen: R.where.screen, DIRTY: R.flags.DIRTY, _baseDirty: R.flags._baseDirty, base: R.flags.base, LASTKNOWN: R.flags.LASTKNOWN,
    keptNote: k.note, keptMeta: k.meta ? { why: k.meta.why, by: k.meta.by, ts: k.meta.ts, base: k.meta.base, t: '<t>' } : null,
    status: R.status, prompts: R.prompts, header: R.header, fileHead: R.where.fileHead });
  R.T = { ...T };
  close(A); bootRelease(mark); await settleBoards();
  return R;
}


// ====================================================================================== VERIFIER EXTENSION
// live tick as a board working out of the folder runs it: turning store mode on turns live on (c.on=true) with autosave on
// (liveCfg default auto=true) every 30 s. Set here at state level (the harness's connect() leaves on:false).
const liveOn = ev => ev(`_liveCfg.on=true; _liveCfg.auto=true; _driveLive=true; 'ok'`);
// E1: the race exactly as folderRace, then ONE live tick in the same session (no reopen).
async function E1() {
  const mark = bootMark(); const R = {};
  const { A, fold, fy, setup } = await folderSetup('E1');
  R.beforeRace = setup.beforeRace;
  const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
  const p = A.ev('driveStorePush(false)');
  R.reached = await until(() => (fold.hits.main || 0) > n0);
  R.busyAtCall = A.ev('_saveBusy');
  const qa = qs(A.ev).length; A.ev('keptPutBack()'); R.putBackPrompts = qs(A.ev).slice(qa).length;
  g.open(); R.ret = await p; await pause(20);
  T.t2 = (fold.copy(fy).store || {}).ts;
  R.afterLanding = { where: where(A, fold, fy), flags: flags(A.ev), status: status(A.ev) };
  liveOn(A.ev);
  const qb = qs(A.ev).length; const nMain = fold.hits.main || 0;
  await A.ev('liveTick()'); await pause(20);
  R.afterTick = { where: where(A, fold, fy), flags: flags(A.ev), status: status(A.ev), header: header(A.ev), prompts: qs(A.ev).slice(qb),
    folderWrites: (fold.hits.main || 0) - nMain, kept: keptSlot(A.ev) };
  R.T = { ...T }; close(A); bootRelease(mark); await settleBoards(); return R;
}
// E2: no save running; put back; ONE live tick (its autosave runs because the put-back made the board unsaved).
async function E2() {
  const mark = bootMark(); const R = {};
  const { A, fold, fy } = await folderSetup('E2');
  const qa = qs(A.ev).length; R.busyAtCall = A.ev('_saveBusy'); A.ev('keptPutBack()'); R.putBackPrompts = qs(A.ev).slice(qa).length;
  R.afterPutBack = { where: where(A, fold, fy), flags: flags(A.ev) };
  liveOn(A.ev);
  const qb = qs(A.ev).length; const nMain = fold.hits.main || 0;
  await A.ev('liveTick()'); await pause(20);
  R.afterTick = { where: where(A, fold, fy), flags: flags(A.ev), status: status(A.ev), prompts: qs(A.ev).slice(qb), folderWrites: (fold.hits.main || 0) - nMain };
  R.T = { ...T }; close(A); bootRelease(mark); await settleBoards(); return R;
}
// E3: no save running; put back; press 💾 Save once.
async function E3() {
  const mark = bootMark(); const R = {};
  const { A, fold, fy } = await folderSetup('E3');
  const qa = qs(A.ev).length; A.ev('keptPutBack()'); R.putBackPrompts = qs(A.ev).slice(qa).length;
  const qb = qs(A.ev).length; const nMain = fold.hits.main || 0;
  await A.ev('saveInPlace()');
  R.afterSave = { where: where(A, fold, fy), status: status(A.ev), prompts: qs(A.ev).slice(qb), folderWrites: (fold.hits.main || 0) - nMain };
  R.T = { ...T }; close(A); bootRelease(mark); await settleBoards(); return R;
}
const EXT = { IDS, errors: [] };
for (const [k, fn] of [['E1', E1], ['E2', E2], ['E3', E3]]) {
  const t0 = Date.now();
  try { EXT[k] = await fn(); console.log(k, 'done', ((Date.now() - t0) / 1000).toFixed(1) + 's'); }
  catch (e) { EXT.errors.push({ k, err: String((e && e.stack) || e).slice(0, 800) }); console.log(k, 'THREW', String((e && e.stack) || e).slice(0, 800)); }
}
EXT.finished = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET';
writeFileSync(outPath, JSON.stringify(EXT, null, 1));
console.log('wrote', outPath);
process.exit(EXT.errors.length ? 2 : 0);
