// FOCUSED harness (reuse review): VERBATIM from the suite given -- imports, failure list, keepBoards, SEEN/chk, the
// v2.00 (U2) block(s) '// ==== v2.00 (U2): ↶ Put back waits for a save to finish ====' .. '// ==== end v2.00 (U2) put back waits ====', the top-level helpers they reference (closure: MINE, W1H, base, d, it), the guard. Not the full suite.
import { boot, seed, BOARD, capture, cv, bootMark, bootRelease, settleBoards, stopAtFirstFailure } from './boot.mjs';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { JSDOM, VirtualConsole } from 'jsdom';
let failures = [];
stopAtFirstFailure(failures);   // in the mutation sweep only: see boot.mjs
// The boards a later block reuses: V185W, V186L and V14 are built once and read by the blocks after.
// Each is read through a guard -- a block above its `let` line runs while it is still uninitialised.
const keepBoards = () => [() => V185W, () => V186L, () => V14]
  .map(f => { try { return f(); } catch { return null; } })
  .flatMap(v => (!v || typeof v !== 'object') ? [] : [v, ...Object.values(v)])   // never a string: V186L is a whole board file, and spreading one made 3.2 million entries a block
  .filter(x => x && typeof x === 'object' && x.w).map(x => x.w);
// EVERY NAMED SCENARIO MUST RUN. A block appended after process.exit() never executes and reads as
// a pass -- the proposal scenario in audit-import.mjs sat there for a whole verification round and
// five mutations aimed at it survived. chk() records every scenario it hears from; at the summary,
// any `const name = '...'` in this file it never heard from is a failure, not a pass.
import { readFileSync as _selfRead } from 'node:fs';
import { fileURLToPath as _selfPath } from 'node:url';
const SEEN = new Set();
// SUITE_CHECKS=<file> records EVERY check -- name, place, claim, verdict, and what was read -- so a
// change to the suite itself can be proved to have kept every check and its verdict (v1.87).
import { appendFileSync as _ckAppend } from 'node:fs';
const CHECKS = process.env.SUITE_CHECKS || '';
const chk = (scenario, where, what, got, want) => {
  SEEN.add(scenario);
  const ok = (typeof got === 'number' && typeof want === 'number')
    ? Math.abs(got - want) <= 0.005 : String(got) === String(want);
  if (CHECKS) _ckAppend(CHECKS, JSON.stringify([scenario, where, what, ok, String(got).slice(0, 400)]) + '\n');
  if (!ok) failures.push({ scenario, where, what, got, want });
};
const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: id,
  event: id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });

const MINE = ['USAF', 'ANG', 'AFRC'];
const base = () => ({ services: MINE,
  items: [it('A', 'PSM', [9000000, 2000000, 1000000])],
  disc: [9000000, 2000000, 1000000], mand: [0, 0, 0], order: ['A'] });

const d = (to, end = '') => ({ to, end });
const W1H = (() => {
  const SVC = ['USAF', 'ANG', 'AFRC'];
  const J = JSON.stringify;
  const mk = (id, ask) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Req ' + id, event: 'E' + id, ccar: '', fy26: [0, 0, 0], ask, alloc: null });
  const tick = () => new Promise(r => setImmediate(r));
  const until = async (cond, max = 6000) => { for (let i = 0; i < max; i++) { if (cond()) return true; await tick(); } return false; };
  const gate = () => { let res, rej; const p = new Promise((a, b) => { res = a; rej = b; }); return { p, open: () => res(), fail: e => rej(e) }; };
  const lsOf = ev => JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
  const KEY = { brad: 'b0000000000000000000000000000001', alice: 'a0000000000000000000000000000002', bob: 'c0000000000000000000000000000003', carol: 'd0000000000000000000000000000004' };
  const wire = (ev, name, key) => ev(`localStorage.setItem('prio27who', ${J(name)}); localStorage.setItem('prio27writerKey', ${J(key)});
    globalThis.__q=[]; globalThis.__yes=true; globalThis.__dl=0;
    window.confirm=function(q){ globalThis.__q.push(String(q)); return globalThis.__yes; }; window.alert=function(){};
    URL.createObjectURL=function(){ globalThis.__dl++; return 'blob:x'; }; URL.revokeObjectURL=function(){}; 'ok'`);
  const qs = ev => JSON.parse(ev('JSON.stringify(globalThis.__q)'));
  const status = ev => ev(`(document.getElementById('shareStat')||{}).textContent||''`);
  const header = ev => ev(`(document.getElementById('saveState')||{}).textContent||''`);
  const note = (ev, id) => ev(`String(S.notes[${J(id)}]||'')`);
  const pubOf = html => { const m = html.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/); return m ? JSON.parse(m[1]) : null; };
  const fileTs = html => { const p = pubOf(html); let t = 0; Object.keys(p.appns).forEach(k => { const s = p.appns[k]; if (s && s.ts > t) t = s.ts; }); return t; };
  const fileStore = html => pubOf(html).appns.om;
  const fileNote = (html, id, yr) => { const st = fileStore(html); return String((((st.years || {})[yr || st.cur] || {}).notes || {})[id] || ''); };
  const fileWriter = html => (pubOf(html).writer || {}).by || '';
  // The shared file, saved once by `by` holding `key`; `writer:false` saves it the way v1.94 did, with no writer.
  const baseFile = (by, key, writer = true) => {
    const A = boot(); seed(A.ev, { services: SVC, items: [mk('A', [900, 200, 100]), mk('B', [400, 100, 50])], disc: [2000, 600, 300], mand: [500, 150, 80], order: ['A', 'B'] });
    A.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`);
    A.ev(`localStorage.setItem('prio27writerKey', ${J(key)}); if(${writer} && typeof writerFp==='function') WRITER={by:${J(by)}, fp:writerFp(), t:1}; 'ok'`);
    return A.ev('buildSavedHtml()');
  };
  // THE FILE ON DISK. Each phase (read/open/write/close) can be held once with f.hold[phase]=gate().
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
  // THE SHARED FOLDER. A write's close can be held by kind: 'main', 'lock', 'hist' (one-shot gates).
  const folder = () => {
    const root = { files: {}, dirs: {}, fail: {} };
    const fold = { root, hold: {}, hits: {}, failNext: {}, failRead: {}, log: [] };
    const kindOf = (st, n) => st !== root ? 'hist' : (/\.lock\.json$/.test(n) ? 'lock' : 'main');
    const wait = async (k, n) => { fold.hits[k] = (fold.hits[k] || 0) + 1; fold.log.push(k + ':' + n); const g = fold.hold[k]; if (g) { delete fold.hold[k]; await g.p; } };
    const dirOf = st => ({ kind: 'directory', name: 'shared', queryPermission: async () => 'granted', requestPermission: async () => 'granted',
      getFileHandle: async (n, o) => { if (!(n in st.files)) { if (o && o.create) st.files[n] = ''; else { const e = new Error('not found'); e.name = 'NotFoundError'; throw e; } }
        return { kind: 'file', name: n,
          // v1.96: a read can be refused, once, by file name -- a permission or sync failure on a file that is there
          getFile: async () => { if (fold.failRead[n]) { const e = fold.failRead[n]; delete fold.failRead[n]; throw e; } const c = st.files[n]; return { text: async () => c }; },
          createWritable: async () => { let buf = ''; return { write: async x => { buf += String(x); },
            close: async () => { const k = kindOf(st, n); await wait(k, n); if (fold.failNext[k]) { const e = fold.failNext[k]; delete fold.failNext[k]; throw e; } st.files[n] = buf; } }; } }; },
      getDirectoryHandle: async (n, o) => { if (!st.dirs[n]) { if (o && o.create) st.dirs[n] = { files: {}, dirs: {}, fail: {} }; else { const e = new Error('not found'); e.name = 'NotFoundError'; throw e; } } return dirOf(st.dirs[n]); },
      removeEntry: async n => { delete st.files[n]; },
      values: async function* () { for (const n of Object.keys(st.files)) yield { kind: 'file', name: n, getFile: async () => ({ text: async () => st.files[n] }) }; } });
    fold.dir = dirOf(root);
    fold.raw = fy => root.files['spmt-' + fy + '-om.json'];
    fold.copy = fy => { const t = fold.raw(fy); return t ? JSON.parse(t) : null; };
    fold.note = (fy, id) => { const j = fold.copy(fy); if (!j) return '(no copy)'; const st = j.store; return String((((st.years || {})[fy] || {}).notes || {})[id] || ''); };
    fold.hist = () => Object.keys((root.dirs.history || { files: {} }).files);
    return fold;
  };
  const connect = (ev, w, fold) => { w.__fold = fold.dir; ev(`_liveCfg=Object.assign(liveCfg(), {store:true, mode:'drive', on:false}); _driveDir=globalThis.__fold; 'ok'`); };
  const flags = ev => JSON.parse(ev(`JSON.stringify({DIRTY:DIRTY, LASTKNOWN:LASTKNOWN, base:baseGet(), cur:MS.cur, driveBase:(typeof _driveBase!=='undefined'? _driveBase : null)})`));
  const pause = ms => new Promise(r => setTimeout(r, ms));
  return { SVC, J, mk, tick, until, gate, lsOf, KEY, wire, qs, status, header, note, pubOf, fileTs, fileStore, fileNote, fileWriter, baseFile, disk, folder, connect, flags, pause };
})();
// ==== v2.00 (U2): ↶ Put back waits for a save to finish ====
// A save that lands records the copy it wrote as the one the work on screen came from, over the checkpoint the kept work
// brings back with it. So after a put-back during a save, the next Save -- or the folder's autosave -- wrote over that copy
// without asking, though the put-back had just said Save would ask. ↶ Put back is now refused while a save is under way, and
// changes nothing: what is on screen and the work kept aside stay exactly as they were, and the board says so. Once the save
// has finished -- saved, failed or canceled -- putting the work back works, and the work put back survives the folder's
// refresh and a reopen.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v2.00 (U2) — put back waits for a save to finish';
  try {
  const { J, wire, KEY, status, header, qs, baseFile, disk, folder, connect, gate, until, flags, pause, lsOf, fileNote } = W1H;
  const F1 = baseFile('Alice', KEY.alice);
  const scr = ev => ev('String(S.notes.A)');
  const keptRaw = ev => ev(`localStorage.getItem(_AP.key+'.kept')`);
  const keptNote = ev => { const s = keptRaw(ev); if (s == null) return null;
    try { const st = JSON.parse(s.slice(s.indexOf('\n') + 1)); return String(((st.years || {})[st.cur] || { notes: {} }).notes.A || ''); } catch (e) { return '(unreadable)'; } };
  const hist = fold => Object.values((fold.root.dirs.history || { files: {} }).files).map(t => { try { return JSON.parse(t).store.years['2027'].notes.A; } catch (e) { return '?'; } });
  const unsaved = ev => { const fl = flags(ev); return [fl.DIRTY, ev('_baseDirty'), !!fl.base.dirty]; };
  const live = ev => ev(`_liveCfg.on=true; _liveCfg.auto=true; _driveLive=true; 'ok'`);   // working out of the folder turns these on
  // THE FOLDER. Alice saves F0 and types K, unsaved. Her other browser saves N to the folder. Her 💾 Save is refused (N was
  // saved after the copy K came from) and she loads theirs: K is kept aside, N is on screen. She types S1, unsaved.
  const inFolder = async () => {
    const fold = folder(); const A = boot({ html: F1 }); await pause(80);
    wire(A.ev, 'Alice', KEY.alice); connect(A.ev, A.w, fold);
    A.ev(`setNote('A','F0'); 'ok'`); await pause(5); await A.ev('driveStorePush(false)'); await pause(5);
    A.ev(`setNote('A','K'); 'ok'`); await pause(5);
    const A2 = boot({ html: F1 }); await pause(80); wire(A2.ev, 'Alice', KEY.alice); connect(A2.ev, A2.w, fold);
    await A2.ev('driveStorePull(false)'); await pause(5);
    A2.ev(`setNote('A','N'); 'ok'`); await pause(5); await A2.ev('driveStorePush(false)'); await pause(5);
    await A.ev('saveInPlace()'); await A.ev(`driveResolve('theirs')`); await pause(5);
    A.ev(`setNote('A','S1'); 'ok'`); await pause(5);
    return { A, A2, fold };
  };
  // THE BOARD FILE. Alice types K, unsaved. Her other browser saves N into the file. She reopens the file: the opening keeps
  // K aside and opens N. She types S1, unsaved.
  const inFile = async () => {
    const A0 = boot({ html: F1 }); await pause(80); wire(A0.ev, 'Alice', KEY.alice);
    A0.ev(`setNote('A','K'); 'ok'`); await pause(5);
    const A2 = boot({ html: F1 }); await pause(80); wire(A2.ev, 'Alice', KEY.alice); const f2 = disk(A2.w, F1);
    A2.ev(`setNote('A','N'); 'ok'`); await pause(5); await A2.ev('saveInPlaceFile()'); await pause(5);
    const A = boot({ html: f2.content, ls: lsOf(A0.ev) }); await pause(80); wire(A.ev, 'Alice', KEY.alice); const f = disk(A.w, f2.content);
    A.ev(`setNote('A','S1'); 'ok'`); await pause(5);
    return { A, f };
  };
  // THE FOLDER'S COPY READ SLOWLY: the save's read of it is held once, as the folder's writes are (a stand-in for a slow sync).
  const holdRead = fold => { const gh = fold.dir.getFileHandle, g = gate(); let hit = 0;
    fold.dir.getFileHandle = async (n, o) => { if (!hit && n === 'spmt-2027-om.json' && !(o && o.create)) { hit = 1; await g.p; } return gh(n, o); };
    return { g, hit: () => hit }; };
  // ↶ Put back pressed while S1's save is held (`reached`): what is on screen (MS) and the kept work, byte for byte, before
  // and after, what it asked, and what it said. Then the save is let go.
  const refused = async (A, reached, g, p) => {
    const ok = await until(reached);
    const ms = A.ev('JSON.stringify(MS)'), kr = keptRaw(A.ev), q0 = qs(A.ev).length, busy = A.ev('_saveBusy');
    A.ev('keptPutBack()');
    const st = status(A.ev);
    const v = [ok, busy > 0, A.ev('JSON.stringify(MS)') === ms, keptRaw(A.ev) === kr, qs(A.ev).length - q0, scr(A.ev),
      /A save is under way/.test(st) && /Nothing was changed/.test(st) && /still kept/.test(st) && /on screen is unchanged/.test(st)];
    g.open(); let ret; try { ret = await p; } catch (e) { ret = 'threw: ' + ((e && e.message) || e); } await pause(5);
    return { v, ret, kr };
  };
  const REFUSED = [true, true, true, true, 0, 'S1', true];
  const RQ = 'during the save: refused; what is on screen and the kept work are byte for byte as they were; nothing asked; the board says so';
  // ↶ Put back once the save has finished: one question, K on screen and unsaved, and what was on screen kept in its place if
  // no saved copy has it (`was`: null when S1 is saved).
  const retry = A => { const q0 = qs(A.ev).length; A.ev('keptPutBack()'); return [qs(A.ev).length - q0, scr(A.ev), ...unsaved(A.ev), keptNote(A.ev)]; };
  const inFold = fold => n => [hist(fold).includes(n), fold.note(2027, 'A') === n];
  // THE FOLDER, after the retry: the refresh runs (live view on, as working out of the folder has it): K stays on screen and
  // nothing is written over the folder's copy unasked; then the board reopened from this browser's storage and the same folder,
  // refreshed: K and S1 each still in a copy.
  const afterFolder = async (A, fold, sc, head, reopened) => {
    live(A.ev); await A.ev('liveTick()'); await pause(5);
    chk(name, sc, 'then the refresh: K stays on screen, unsaved, and the folder copy is not written over',
      J([scr(A.ev), fold.note(2027, 'A'), ...unsaved(A.ev)]), J(['K', head, true, true, true]));
    const B = boot({ html: F1, ls: lsOf(A.ev) }); await pause(80);
    wire(B.ev, 'Alice', KEY.alice); connect(B.ev, B.w, fold); live(B.ev); await B.ev('liveTick()'); await pause(5);
    chk(name, sc, 'then reopened and refreshed: on screen and kept aside; K and S1 each still in a copy',
      J([scr(B.ev), keptNote(B.ev), ...['K', 'S1'].map(n => [scr(B.ev), keptNote(B.ev), fold.note(2027, 'A'), ...hist(fold)].includes(n))]),
      J([...reopened, true, true]));
  };
  // THE BOARD FILE, after the retry: reopened from this browser's storage and the file on disk.
  const afterFile = async (A, f, sc, reopened) => {
    const B = boot({ html: f.content, ls: lsOf(A.ev) }); await pause(80); wire(B.ev, 'Alice', KEY.alice);
    chk(name, sc, 'then reopened: on screen and kept aside; K and S1 each still in a copy',
      J([scr(B.ev), keptNote(B.ev), ...['K', 'S1'].map(n => [scr(B.ev), keptNote(B.ev), fileNote(f.content, 'A')].includes(n))]),
      J([...reopened, true, true]));
  };
  // (a) THE FOLDER, THE SAVE GOES IN: held at the close of its write of the folder's copy.
  { const sc = '(a) the folder: put back while S1’s save writes; the save goes in';
    const { A, fold } = await inFolder();
    chk(name, sc, 'S1 on screen and unsaved, K kept aside, N in the folder (a CONTROL)',
      J([scr(A.ev), A.ev('DIRTY'), keptNote(A.ev), fold.note(2027, 'A')]), J(['S1', true, 'K', 'N']));
    const n0 = fold.hits.main || 0; fold.hold.main = gate();
    const r = await refused(A, () => (fold.hits.main || 0) > n0, fold.hold.main, A.ev('driveStorePush(false)'));
    chk(name, sc, RQ, J(r.v), J(REFUSED));
    chk(name, sc, 'once it lands: S1 on screen and in the folder, saved; the kept work byte for byte as it was',
      J([r.ret, scr(A.ev), fold.note(2027, 'A'), ...unsaved(A.ev), keptRaw(A.ev) === r.kr]), J([true, 'S1', 'S1', false, false, false, true]));
    chk(name, sc, 'put back again: one question; K on screen, unsaved; nothing kept in its place (S1 is saved)',
      J(retry(A)), J([1, 'K', true, true, true, null]));
    await afterFolder(A, fold, sc, 'S1', ['S1', 'K']); }
  // (b) THE FOLDER, THE SAVE FAILS: the copy it replaces cannot be kept in the folder's history, so nothing is written.
  { const sc = '(b) the folder: put back while S1’s save writes; the save fails';
    const { A, fold } = await inFolder();
    const n0 = fold.hits.hist || 0; fold.hold.hist = gate(); fold.failNext.hist = new Error('the history folder is read-only');
    const r = await refused(A, () => (fold.hits.hist || 0) > n0, fold.hold.hist, A.ev('driveStorePush(false)'));
    chk(name, sc, RQ, J(r.v), J(REFUSED));
    chk(name, sc, 'once it fails: S1 on screen and unsaved, N still in the folder, the board says not saved; the kept work byte for byte as it was',
      J([r.ret, scr(A.ev), fold.note(2027, 'A'), ...unsaved(A.ev), /Not saved/.test(status(A.ev)), keptRaw(A.ev) === r.kr]), J([false, 'S1', 'N', true, true, true, true, true]));
    chk(name, sc, 'put back again: one question; K on screen, unsaved; S1 kept aside in its place',
      J(retry(A)), J([1, 'K', true, true, true, 'S1']));
    await afterFolder(A, fold, sc, 'N', ['K', 'S1']); }
  // (c) THE FOLDER, THE SAVE IS REFUSED: N2, saved from Alice's other browser while S1's save reads the folder, is newer than
  // the copy S1 came from, so nothing is written and she is offered the choice.
  { const sc = '(c) the folder: put back while S1’s save reads the folder; the save is refused';
    const { A, A2, fold } = await inFolder();
    A2.ev(`setNote('A','N2'); 'ok'`); await pause(5); await A2.ev('driveStorePush(false)'); await pause(5);
    const h = holdRead(fold);
    const r = await refused(A, () => h.hit(), h.g, A.ev('driveStorePush(false)'));
    chk(name, sc, RQ, J(r.v), J(REFUSED));
    chk(name, sc, 'once it is refused: S1 on screen and unsaved, N2 in the folder, nothing written; the kept work byte for byte as it was',
      J([r.ret, scr(A.ev), fold.note(2027, 'A'), ...unsaved(A.ev), /Nothing was written/.test(status(A.ev)), keptRaw(A.ev) === r.kr]), J([false, 'S1', 'N2', true, true, true, true, true]));
    chk(name, sc, 'put back again: one question; K on screen, unsaved; S1 kept aside in its place',
      J(retry(A)), J([1, 'K', true, true, true, 'S1']));
    await afterFolder(A, fold, sc, 'N2', ['K', 'S1']); }
  // (d) THE BOARD FILE, THE SAVE GOES IN: held at its write.
  { const sc = '(d) the board file: put back while S1’s save writes; the save goes in';
    const { A, f } = await inFile();
    chk(name, sc, 'S1 on screen and unsaved, K kept aside, N in the file (a CONTROL)',
      J([scr(A.ev), A.ev('DIRTY'), keptNote(A.ev), fileNote(f.content, 'A')]), J(['S1', true, 'K', 'N']));
    const n0 = f.hits.write || 0; f.hold.write = gate();
    const r = await refused(A, () => (f.hits.write || 0) > n0, f.hold.write, A.ev('saveInPlaceFile()'));
    chk(name, sc, RQ, J(r.v), J(REFUSED));
    chk(name, sc, 'once it lands: S1 on screen and in the file, saved; the kept work byte for byte as it was',
      J([scr(A.ev), fileNote(f.content, 'A'), ...unsaved(A.ev), keptRaw(A.ev) === r.kr]), J(['S1', 'S1', false, false, false, true]));
    chk(name, sc, 'put back again: one question; K on screen, unsaved; nothing kept in its place (S1 is saved)',
      J(retry(A)), J([1, 'K', true, true, true, null]));
    await afterFile(A, f, sc, ['S1', 'K']); }
  // (e) THE BOARD FILE, THE SAVE FAILS: the write cannot be finished.
  { const sc = '(e) the board file: put back while S1’s save writes; the save fails';
    const { A, f } = await inFile();
    const n0 = f.hits.close || 0; f.hold.close = gate(); f.failClose = new Error('The disk is full');
    const r = await refused(A, () => (f.hits.close || 0) > n0, f.hold.close, A.ev('saveInPlaceFile()'));
    chk(name, sc, RQ, J(r.v), J(REFUSED));
    // (the failed save downloads a copy instead, and the header says so: that copy is not on the shared file yet)
    chk(name, sc, 'once it fails: S1 on screen and unsaved, N still in the file, the header says not on the shared file yet; the kept work byte for byte as it was',
      J([scr(A.ev), fileNote(f.content, 'A'), ...unsaved(A.ev), /not on the shared file yet/.test(header(A.ev)), keptRaw(A.ev) === r.kr]), J(['S1', 'N', true, true, true, true, true]));
    chk(name, sc, 'put back again: one question; K on screen, unsaved; S1 kept aside in its place',
      J(retry(A)), J([1, 'K', true, true, true, 'S1']));
    await afterFile(A, f, sc, ['K', 'S1']); }
  // (f) THE BOARD FILE, THE SAVE IS CANCELED while it writes: nothing is written.
  { const sc = '(f) the board file: put back while S1’s save writes; the save is canceled';
    const { A, f } = await inFile();
    const n0 = f.hits.close || 0; f.hold.close = gate(); f.failClose = Object.assign(new Error('The user aborted a request.'), { name: 'AbortError' });
    const r = await refused(A, () => (f.hits.close || 0) > n0, f.hold.close, A.ev('saveInPlaceFile()'));
    chk(name, sc, RQ, J(r.v), J(REFUSED));
    chk(name, sc, 'once it is canceled: S1 on screen and unsaved, N still in the file, the board says nothing was written; the kept work byte for byte as it was',
      J([scr(A.ev), fileNote(f.content, 'A'), ...unsaved(A.ev), /Save canceled — nothing written/.test(status(A.ev)), keptRaw(A.ev) === r.kr]), J(['S1', 'N', true, true, true, true, true]));
    chk(name, sc, 'put back again: one question; K on screen, unsaved; S1 kept aside in its place',
      J(retry(A)), J([1, 'K', true, true, true, 'S1']));
    await afterFile(A, f, sc, ['K', 'S1']); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (U2) put back waits ====
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const src = _selfRead(_selfPath(import.meta.url), 'utf8');
  const named = [...src.matchAll(/^  const name = '([^']+)'/gm)].map(m => m[1]);   // a scenario's own line, never this one
  // A name built by concatenation ('convert to split — ' + label) is heard only in its finished
  // forms, so a literal that any heard scenario STARTS WITH has run. A dead block's literal has none.
  named.forEach(n => { if (![...SEEN].some(s => s === n || s.startsWith(n))) failures.push({ scenario: n, where: 'harness',
    what: 'this scenario never ran — is its block after process.exit()?', got: 'never ran', want: 'ran' }); });
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
console.log('\n' + '='.repeat(96));
if (!failures.length) { console.log('ALL CHECKS PASSED'); process.exit(0); }
const by = {};
failures.forEach(f => { const k = f.scenario + ' | ' + f.where; (by[k] ||= []).push(f); });
console.log(`${failures.length} FAILING CHECK(S)\n`);
for (const [k, fs] of Object.entries(by)) {
  console.log(`--- ${k}`);
  fs.forEach(f => {
    const g = String(f.got), w = String(f.want);
    if (g.length < 160 && w.length < 160) { console.log(`    ${f.what}\n        got ${g}   want ${w}`); return; }
    // Two multi-kilobyte stores tell you nothing side by side. Point at the first difference.
    let i = 0; while (i < g.length && i < w.length && g[i] === w[i]) i++;
    const cut = Math.max(0, i - 60);
    console.log(`    ${f.what}\n        first differs at char ${i} of ${g.length}/${w.length}`
      + `\n          got  \u2026${g.slice(cut, i + 90)}\u2026`
      + `\n          want \u2026${w.slice(cut, i + 90)}\u2026`);
  });
}
process.exit(1);
