// FOCUSED harness: VERBATIM from /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/ef1548c/after/tools/export-audit/audit-import.mjs -- imports, failure list, keepBoards, SEEN/chk, the selected blocks
// (suite lines 7129-7460, 7461-7799), the top-level helpers they reference (closure: MINE, W1H, base, d, it), the guard. Not the full suite.
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
// ==== v2.00 (U2): work put back during a save stays unsaved ====
// ↶ Put back (the work kept aside) marked the board unsaved but did not count as a change. A save still writing when the work
// was put back -- the folder's or the board file's -- found nothing changed while it wrote and marked the board saved: the
// work put back on screen, the save's own copy in the folder or file, and this browser's record saying saved. The folder's
// next refresh then loaded its copy over the work put back, and a reopen opened the saved copy: the work was in no copy at
// all. The put-back now counts as a change, so that save leaves the board unsaved and says so, and the next Save writes it.
// ONCE ↶ PUT BACK WAITS FOR A SAVE (the block after this one), the put-back below is refused and the race cannot happen.
// Each check here is therefore written for the two outcomes the board may give -- the work put back and counted, or the
// put-back refused -- both written out below, and never the one this block is about: put back, then marked saved. (d)
// checks the count itself, with no save running, so the count stays tested when the race cannot be reached.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v2.00 (U2) — work put back during a save stays unsaved';
  try {
  const { J, wire, KEY, status, qs, baseFile, disk, folder, connect, gate, until, flags, pause, lsOf, fileNote } = W1H;
  const F1 = baseFile('Alice', KEY.alice);
  const scr = ev => ev('String(S.notes.A)');
  const keptNote = ev => { const s = ev(`localStorage.getItem(_AP.key+'.kept')`); if (s == null) return null;
    try { const st = JSON.parse(s.slice(s.indexOf('\n') + 1)); return String(((st.years || {})[st.cur] || { notes: {} }).notes.A || ''); } catch (e) { return '(unreadable)'; } };
  const hist = fold => Object.values((fold.root.dirs.history || { files: {} }).files).map(t => { try { return JSON.parse(t).store.years['2027'].notes.A; } catch (e) { return '?'; } });
  const saysSaved = ev => { const fl = flags(ev); return !fl.DIRTY && !ev('_baseDirty') && !fl.base.dirty; };
  const notYet = ev => /not in the (folder|file) yet/.test(status(ev));
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
  // S1's save, held at the close of its write of the folder's copy (or at its write of the file); K is put back there.
  const raceFolder = async (A, fold) => {
    const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
    const p = A.ev('driveStorePush(false)');
    const reached = await until(() => (fold.hits.main || 0) > n0);
    A.ev('keptPutBack()'); g.open(); const ret = await p; await pause(5);
    return [reached, ret];
  };
  const raceFile = async (A, f) => {
    const n0 = f.hits.write || 0; f.hold.write = gate(); const g = f.hold.write;
    const p = A.ev('saveInPlaceFile()');
    const reached = await until(() => (f.hits.write || 0) > n0);
    A.ev('keptPutBack()'); g.open(); await p; await pause(5);
    return [reached, f.writes];
  };
  // After the save lands: on screen; in the folder (file); unsaved as the screen, this browser and its record say; said.
  // PUT BACK AND COUNTED: K on screen, S1 written, unsaved, and the board says the change is not in the folder (file) yet.
  // REFUSED: S1 on screen, written and saved; K still kept aside.
  const MADE = ['K', 'S1', true, true, true, true, 'S1'], REFUSED = ['S1', 'S1', false, false, false, false, 'K'];
  const landed = (A, head) => { const fl = flags(A.ev); return [scr(A.ev), head, fl.DIRTY, A.ev('_baseDirty'), !!fl.base.dirty, notYet(A.ev), keptNote(A.ev)]; };
  // (a) THE FOLDER: the save lands, then the folder's refresh runs (live view on, as working out of the folder has it), then Save.
  { const { A, fold } = await inFolder();
    chk(name, '(a) the folder: K kept aside, S1 typed (a CONTROL)', 'S1 on screen, K kept aside, N in the folder',
      J([scr(A.ev), keptNote(A.ev), fold.note(2027, 'A')]), J(['S1', 'K', 'N']));
    const r = await raceFolder(A, fold);
    const v = landed(A, fold.note(2027, 'A')); const made = v[0] === 'K';
    chk(name, '(a) the folder: K put back while S1’s save writes', 'the save waited at its write, then went in (a CONTROL)', J(r), J([true, true]));
    chk(name, '(a) the folder: K put back while S1’s save writes', 'once it lands: K on screen, S1 in the folder, unsaved (DIRTY, _baseDirty, the record) and said; S1 kept aside — or, refused, S1 on screen and saved, K still kept',
      J(v), J(made ? MADE : REFUSED));
    live(A.ev); await A.ev('liveTick()'); await pause(5);
    chk(name, '(a) the folder: then the refresh', 'what is on screen is not replaced (K; refused: S1), and K and S1 are each still in a copy here or in the folder',
      J([scr(A.ev), [scr(A.ev), keptNote(A.ev), fold.note(2027, 'A'), ...hist(fold)].includes('K'), [scr(A.ev), keptNote(A.ev), fold.note(2027, 'A'), ...hist(fold)].includes('S1')]),
      J([made ? 'K' : 'S1', true, true]));
    chk(name, '(a) the folder: then the refresh', 'the board says saved only when the folder holds what is on screen',
      !saysSaved(A.ev) || scr(A.ev) === fold.note(2027, 'A'), true);
    if (!made) A.ev('keptPutBack()');   // refused during the save: put back now, with no save running
    await A.ev('saveInPlace()');
    if (/Save yours over theirs/.test(status(A.ev))) await A.ev(`driveResolve('mine')`);
    const fl = flags(A.ev);
    chk(name, '(a) the folder: then 💾 Save', 'it writes K: K on screen and in the folder, and saved',
      J([scr(A.ev), fold.note(2027, 'A'), fl.DIRTY, !!fl.base.dirty]), J(['K', 'K', false, false])); }
  // (b) THE FOLDER, REOPENED as soon as the save lands: this browser's storage and the same folder, and the refresh runs.
  { const { A, fold } = await inFolder();
    await raceFolder(A, fold); const made = scr(A.ev) === 'K';
    const B = boot({ html: F1, ls: lsOf(A.ev) }); await pause(80);
    wire(B.ev, 'Alice', KEY.alice); connect(B.ev, B.w, fold); live(B.ev); await B.ev('liveTick()'); await pause(5);
    chk(name, '(b) the folder: reopened once the save lands, and refreshed', 'K stays on screen, unsaved by the record, with S1 kept aside — or, refused, S1 on screen and K kept aside',
      J([scr(B.ev), keptNote(B.ev), !!flags(B.ev).base.dirty]), J(made ? ['K', 'S1', true] : ['S1', 'K', false]));
    chk(name, '(b) the folder: reopened once the save lands, and refreshed', 'K and S1 are each still in a copy here or in the folder',
      J(['K', 'S1'].map(n => [scr(B.ev), keptNote(B.ev), fold.note(2027, 'A'), ...hist(fold)].includes(n))), J([true, true])); }
  // (c) THE BOARD FILE: the save lands; the file reopened from this browser's storage and the file on disk; then Save.
  { const { A, f } = await inFile();
    chk(name, '(c) the board file: K kept aside, S1 typed (a CONTROL)', 'S1 on screen, K kept aside, N in the file',
      J([scr(A.ev), keptNote(A.ev), fileNote(f.content, 'A')]), J(['S1', 'K', 'N']));
    const r = await raceFile(A, f);
    const v = landed(A, fileNote(f.content, 'A')); const made = v[0] === 'K';
    chk(name, '(c) the board file: K put back while S1’s save writes', 'the save waited at its write, then wrote once (a CONTROL)', J(r), J([true, 1]));
    chk(name, '(c) the board file: K put back while S1’s save writes', 'once it lands: K on screen, S1 in the file, unsaved (DIRTY, _baseDirty, the record) and said; S1 kept aside — or, refused, S1 on screen and saved, K still kept',
      J(v), J(made ? MADE : REFUSED));
    const B = boot({ html: f.content, ls: lsOf(A.ev) }); await pause(80); wire(B.ev, 'Alice', KEY.alice);
    chk(name, '(c) the board file: reopened once the save lands', 'K stays on screen, unsaved by the record, with S1 kept aside — or, refused, S1 on screen and K kept aside',
      J([scr(B.ev), keptNote(B.ev), !!flags(B.ev).base.dirty]), J(made ? ['K', 'S1', true] : ['S1', 'K', false]));
    chk(name, '(c) the board file: reopened once the save lands', 'K and S1 are each still in a copy here or in the file',
      J(['K', 'S1'].map(n => [scr(B.ev), keptNote(B.ev), fileNote(f.content, 'A')].includes(n))), J([true, true]));
    if (!made) A.ev('keptPutBack()');   // refused during the save: put back now, with no save running
    await A.ev('saveInPlaceFile()'); const fl = flags(A.ev);
    chk(name, '(c) the board file: then 💾 Save', 'it writes K: K on screen and in the file, and saved',
      J([scr(A.ev), fileNote(f.content, 'A'), fl.DIRTY, !!fl.base.dirty]), J(['K', 'K', false, false])); }
  // (d) WITH NO SAVE RUNNING, the put-back is a change: the count every save checks moves by one (read from the board's
  // state, _saveGen), and the work put back is on screen, unsaved, with what was on screen kept aside in its place.
  { const { A } = await inFolder();
    const g0 = A.ev('_saveGen'), busy = A.ev('_saveBusy'), q0 = qs(A.ev).length;
    A.ev('keptPutBack()'); const fl = flags(A.ev);
    chk(name, '(d) K put back with no save running', 'no save was running, and the put-back moved the change count by exactly one (read from _saveGen)',
      J([busy, A.ev('_saveGen') - g0]), J([0, 1]));
    chk(name, '(d) K put back with no save running', 'it asked once; K on screen, unsaved (DIRTY, _baseDirty, the record), S1 kept aside, and the board says it was put back (a CONTROL)',
      J([qs(A.ev).length - q0, scr(A.ev), fl.DIRTY, A.ev('_baseDirty'), !!fl.base.dirty, keptNote(A.ev), /Put back/.test(status(A.ev))]),
      J([1, 'K', true, true, true, 'S1', true])); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (U2) ====
// ==== v2.00 (U2): ↶ Put back waits for a save to finish ====
// A save that lands records the copy it wrote as the one the work on screen came from, over the checkpoint the kept work
// brings back with it. So after a put-back during a save, the next Save -- or the folder's autosave -- wrote over that copy
// without asking, though the put-back had just said Save would ask. ↶ Put back is now refused while a save is under way, and
// changes nothing: what is on screen and the work kept aside stay exactly as they were, and the board says so -- in words
// that stay true once the save has finished. Once the save has finished -- saved, failed, canceled or thrown -- putting the
// work back works, and the work put back survives the folder's refresh and a reopen.
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
      /a save was under way/.test(st) && /Nothing was changed/.test(st) && /still kept/.test(st) && /on screen is unchanged/.test(st)];
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
  // (c) THE FOLDER, THE SAVE IS REFUSED: N2 is saved from Alice's other browser before S1's save starts, and S1's save is held
  // at its read of the folder. N2 is newer than the copy S1 came from, so nothing is written and she is offered the choice.
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
  // (g) THE FOLDER, THE AUTOSAVE THROWS: Live on; the refresh's autosave is held at the close of its write of the folder's
  // copy, which then fails. That error goes through the save queue as a thrown error, not a returned false, and the count
  // of saves under way must still come back down, or every later put-back would be refused.
  { const sc = '(g) the folder: put back while the autosave writes; the write throws';
    const { A, fold } = await inFolder();
    live(A.ev);
    const n0 = fold.hits.main || 0; fold.hold.main = gate(); fold.failNext.main = new Error('The shared folder is read-only');
    const r = await refused(A, () => (fold.hits.main || 0) > n0, fold.hold.main, A.ev('liveTick()'));
    chk(name, sc, RQ, J(r.v), J(REFUSED));
    chk(name, sc, 'after the refusal, the header still offers the kept work (↶ work kept aside), so the retry can be reached', /work kept aside/.test(header(A.ev)), true);
    chk(name, sc, 'once it throws: S1 on screen and unsaved, N still in the folder, the board says the automatic save failed, no save under way (read from _saveBusy); the kept work byte for byte as it was',
      J([scr(A.ev), fold.note(2027, 'A'), ...unsaved(A.ev), /Automatic save to the shared folder failed/.test(status(A.ev)), A.ev('_saveBusy'), keptRaw(A.ev) === r.kr]),
      J(['S1', 'N', true, true, true, true, 0, true]));
    chk(name, sc, 'put back again: one question; K on screen, unsaved; S1 kept aside in its place',
      J(retry(A)), J([1, 'K', true, true, true, 'S1']));
    await afterFolder(A, fold, sc, 'N', ['K', 'S1']); }
  // (h) THE FOLDER, THE AUTOSAVE LANDS AFTER THE REFUSAL: a quiet autosave says nothing when it lands, so the refusal's own
  // line is what stays on screen -- it must not claim that a save is still under way. The refresh and a reopen follow.
  { const sc = '(h) the folder: put back while the autosave writes; the autosave goes in';
    const { A, fold } = await inFolder();
    live(A.ev);
    const n0 = fold.hits.main || 0; fold.hold.main = gate();
    const r = await refused(A, () => (fold.hits.main || 0) > n0, fold.hold.main, A.ev('liveTick()'));
    chk(name, sc, RQ, J(r.v), J(REFUSED));
    const st = status(A.ev);
    chk(name, sc, 'once the autosave has landed: S1 in the folder and saved, no save under way (read from _saveBusy), the kept work byte for byte as it was',
      J([scr(A.ev), fold.note(2027, 'A'), ...unsaved(A.ev), A.ev('_saveBusy'), keptRaw(A.ev) === r.kr]), J(['S1', 'S1', false, false, false, 0, true]));
    chk(name, sc, 'once the autosave has landed, the status line does not say a save IS under way',
      /save is under way/i.test(st), false);
    chk(name, sc, 'put back again: one question; K on screen, unsaved; nothing kept in its place (S1 is saved)',
      J(retry(A)), J([1, 'K', true, true, true, null]));
    await afterFolder(A, fold, sc, 'S1', ['S1', 'K']); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (U2) put back waits ====
// ==== v2.00 (U13): a refresh during a save loads nothing ====
// The folder's refresh -- the Live timer's, the bar's Connect, the opening's own connect -- loaded a newer folder copy while
// a save was still writing. The save, landing, found nothing changed while it wrote, marked the board saved and recorded
// the copy IT wrote as the one the work on screen came from: the copy loaded stayed on screen recorded as saved, the save's
// copy was in the folder, and the next refresh and a reopen said nothing. No second writer is needed: a copy already in the
// folder, stamped ahead of this machine's clock (Brad's other machine, its clock an hour fast), is "newer" than the save's
// own copy. Now the refresh loads nothing while a save is under way -- checked after its last wait, just before it would
// change anything -- and changes nothing: what is on screen and in browser storage, the record, the change count and the
// work kept aside stay byte for byte as they were. A Connect says so, of the board's own copy only: the same Connect goes on
// to load the execution data and the reprogramming log from the folder. The Live timer says nothing. Once the save has
// finished -- saved, failed, refused or canceled -- the next refresh is an ordinary one again.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v2.00 (U13) — a refresh during a save loads nothing';
  try {
  const { J, wire, KEY, status, qs, baseFile, folder, connect, gate, until, pause, lsOf } = W1H;
  const F1 = baseFile('Brad', KEY.brad);
  const NM = 'spmt-2027-om.json', HOUR = 3600000;
  // Requirement A -- its note and its allocation, in dollars -- on screen, in a copy's text, in browser storage, kept aside.
  const scr = ev => JSON.parse(ev(`JSON.stringify([String(S.notes.A||''), (S.alloc.A&&typeof S.alloc.A==='object')? S.alloc.A.v : (S.alloc.A==null? null : S.alloc.A)])`));
  const inCopy = txt => { try { const j = JSON.parse(txt), st = j.store || j, y = (st.years || {})[st.cur] || {}, a = (y.alloc || {}).A;
    return [String((y.notes || {}).A || ''), (a && typeof a === 'object') ? a.v : (a == null ? null : a)]; } catch (e) { return ['(unreadable)', null]; } };
  const stored = ev => inCopy(ev('localStorage.getItem(_AP.key)'));
  const kept = ev => { const s = ev(`localStorage.getItem(_AP.key+'.kept')`); return s == null ? null : inCopy(s.slice(s.indexOf('\n') + 1)); };
  // The folder's copy, its time, and its history.
  const head = fold => fold.raw(2027) == null ? ['(no copy)', null] : inCopy(fold.raw(2027));
  const headTs = fold => { const j = fold.copy(2027); return j ? +((j.store && j.store.ts) || j.ts || 0) : 0; };
  const inHist = (fold, c) => Object.values((fold.root.dirs.history || { files: {} }).files).some(t => J(inCopy(t)) === J(c));
  // Saved, by all three -- this session (DIRTY), _baseDirty and this browser's record -- and the record names the folder's copy.
  const saved = ev => JSON.parse(ev('JSON.stringify([DIRTY, _baseDirty, !!baseGet().dirty])')).every(x => !x);
  const onHead = (ev, fold) => headTs(fold) > 0 && +ev('driveBaseOf(mySlug())') === headTs(fold);
  // EVERYTHING A REFUSED REFRESH LEAVES AS IT WAS, byte for byte: what is on screen (MS), DIRTY, _baseDirty, the folder's time
  // the work came from and this browser's record of it, the change count every save checks (_saveGen), the work kept aside,
  // and what browser storage holds.
  const state = ev => ev(`JSON.stringify([JSON.stringify(MS), DIRTY, _baseDirty, JSON.stringify(_driveBase), localStorage.getItem(_AP.key+'.base'), _saveGen, localStorage.getItem(_AP.key+'.kept'), localStorage.getItem(_AP.key)])`);
  const writes = fold => fold.log.filter(x => /^(main|hist):/.test(x)).length;   // the folder's copy and its history (not the lock)
  const live = ev => ev(`_liveCfg.on=true; _liveCfg.auto=true; _driveLive=true; 'ok'`);   // working out of the folder turns these on
  // WHAT A CONNECT SAYS WHEN IT LOADS NOTHING DURING A SAVE, word for word. It names the board's copy and nothing wider (6a),
  // and Load theirs as well as a save: Load theirs runs in the save's queue and is counted the same way (6b).
  const SAID = '⏳ The shared folder’s copy of O&M FY27 was not loaded: a save or Load theirs was under way, so this board kept its own copy of O&M FY27. '
    + 'The folder’s copy is checked again on the next refresh once that has finished (📡 Live view → ↻ Refresh now, or on its own while Live view is on).';
  const said = st => st === SAID;
  // REMOTE: requirement A's note REMOTE, $650, saved into an empty folder through the product by Brad's other machine, whose
  // clock runs `ahead` (its own window's Date.now). Its bytes are what each case's own folder starts with.
  const writeRemote = async ahead => {
    const f0 = folder(), R = boot({ html: F1 }); await pause(80); wire(R.ev, 'Brad', KEY.brad); connect(R.ev, R.w, f0);
    if (ahead) R.ev(`(function(){ var real=Date.now; Date.now=function(){ return real.call(Date)+${ahead}; }; return 'ok'; })()`);
    R.ev(`setNote('A','REMOTE'); setAlloc('A','650'); 'ok'`); await R.ev('saveInPlace()'); await pause(5);
    return f0.raw(2027);
  };
  const withCopy = txt => { const fold = folder(); fold.root.files[NM] = txt; return fold; };
  const tsOf = txt => { const j = JSON.parse(txt); return +((j.store && j.store.ts) || j.ts || 0); };
  const REMOTE = await writeRemote(HOUR);
  chk(name, 'the fixture', 'REMOTE is the folder’s copy: REMOTE, $650, saved by Brad, stamped more than 59 minutes ahead of this clock (a CONTROL)',
    J([...inCopy(REMOTE), JSON.parse(REMOTE).by, tsOf(REMOTE) - Date.now() > 59 * 60000]), J(['REMOTE', 650, 'Brad', true]));
  // BRAD opens the board with REMOTE in the folder, and his opening loads it. He types WORKING, $700, and closes it unsaved.
  const brad = async txt => {
    const fold = withCopy(txt), A = boot({ html: F1 }); await pause(80); wire(A.ev, 'Brad', KEY.brad); connect(A.ev, A.w, fold);
    await A.ev('driveAutoConnect()'); await pause(5);
    const v = [...scr(A.ev), saved(A.ev), onHead(A.ev, fold)];
    A.ev(`setNote('A','WORKING'); setAlloc('A','700'); 'ok'`); await pause(5);
    return { v, LS: lsOf(A.ev), A, fold };
  };
  const b1 = await brad(REMOTE);
  chk(name, 'the fixture', 'Brad’s opening loads REMOTE: on screen, saved, recorded against the folder’s copy (a CONTROL)', J(b1.v), J(['REMOTE', 650, true, true]));
  // BRAD REOPENS the board: his browser (WORKING unsaved in it, recorded against REMOTE) and a folder holding REMOTE, connected
  // by the harness (no opening pull) -- or, `perm`, with the folder's edit permission not kept: the opening's own connect
  // stops at one click, and 💾 Save asks for the permission itself.
  const reopen = async (fold, perm, ls) => {
    const B = boot({ html: F1, ls: { ...(ls || b1.LS) } }); await pause(80); wire(B.ev, 'Brad', KEY.brad);
    if (perm) { fold.perm = 'prompt'; fold.dir.queryPermission = async () => fold.perm; fold.dir.requestPermission = async () => (fold.perm = 'granted'); }
    connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);   // the folder's name, as its pick stored it (a Connect needs it)
    const c = perm ? await B.ev('driveAutoConnect()') : null; await pause(5);
    return { B, c };
  };
  // 💾 Save, held at the close of its write of the folder's copy: by then it has read the folder, kept the copy it replaces
  // in the history and built its bytes.
  const held = async (B, fold) => {
    const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
    const p = B.ev('saveInPlace()'); const ok = await until(() => (fold.hits.main || 0) > n0);
    return { g, p, ok };
  };
  // The save, or a refresh, held at its read of the folder's copy (the first read after this), or at its first wait -- the
  // folder asked what this page may do (the first ask after this).
  const holdRead = fold => { const gh = fold.dir.getFileHandle, g = gate(); let hit = 0;
    fold.dir.getFileHandle = async (n, o) => { if (!hit && n === NM && !(o && o.create)) { hit = 1; await g.p; } return gh(n, o); };
    return { g, hit: () => hit }; };
  const holdAsk = fold => { const q = fold.dir.queryPermission, g = gate(); let hit = 0;
    fold.dir.queryPermission = async m => { if (!hit) { hit = 1; await g.p; } return q(m); };
    return { g, hit: () => hit }; };
  // ONE REFRESH WHILE A SAVE IS UNDER WAY: what it returned, that a save was under way, that nothing changed (against `s0`,
  // read once the save was held), what it wrote to the folder's copy or its history, and what it said -- a quiet refresh
  // nothing, a Connect that nothing was loaded and why.
  const REFRESH = { pull: 'driveStorePull(true)', connect: 'driveConnectNow()', auto: 'driveAutoConnect()', tick: 'liveTick()' };
  const refresh = async (B, fold, how, s0) => {
    if (how === 'tick') live(B.ev);
    const st0 = status(B.ev), w0 = writes(fold);
    const r = await B.ev(REFRESH[how]); await pause(5);
    const st = status(B.ev), quiet = how === 'pull' || how === 'tick';
    return [r === undefined ? '(nothing)' : r, B.ev('_saveBusy') > 0, state(B.ev) === s0, writes(fold) - w0, quiet ? st === st0 : said(st)];
  };
  const RQ = ': loads nothing -- [returned, a save under way, nothing changed byte for byte, writes to the folder’s copy or history, said]';
  const EXPECT = { pull: [false, true, true, 0, true], connect: [true, true, true, 0, true], auto: [true, true, true, 0, true], tick: ['(nothing)', true, true, 0, true] };
  // ONCE THE SAVE HAS LANDED: a later refresh changes nothing, and a reopen (this browser, the same folder, the opening's own
  // connect, then a refresh) opens `want`, which the folder's copy holds, saved and recorded against it.
  const landedThen = async (B, fold, sc, want) => {
    const s1 = state(B.ev); const pulled = await B.ev('driveStorePull(true)'); live(B.ev); await B.ev('liveTick()'); await pause(5);
    chk(name, sc, 'then a refresh (driveStorePull, the Live tick): nothing loaded, nothing changed', J([pulled, state(B.ev) === s1]), J([false, true]));
    const C = boot({ html: F1, ls: lsOf(B.ev) }); await pause(80); wire(C.ev, 'Brad', KEY.brad); connect(C.ev, C.w, fold);
    await C.ev('driveAutoConnect()'); const again = await C.ev('driveStorePull(true)'); await pause(5);
    chk(name, sc, 'then reopened (the opening’s connect, then a refresh): on screen, in the folder’s copy, saved and recorded against it; nothing kept aside',
      J([again, ...scr(C.ev), ...head(fold), saved(C.ev), onHead(C.ev, fold), kept(C.ev)]), J([false, ...want, ...want, true, true, null]));
  };
  // (1) NO SECOND WRITER. Brad reopens with WORKING unsaved; 💾 Save is held at its write; while it is held every refresh runs
  // in turn -- driveStorePull(true), the bar's Connect, the opening's own connect, the Live timer's tick -- and each loads
  // nothing. The save then lands. Reopened by the harness, and with the folder's edit permission not kept.
  for (const perm of [false, true]) {
    const sc = '(1) no second writer; reopened ' + (perm ? 'with the folder’s edit permission not kept' : 'by the harness');
    const fold = withCopy(REMOTE); const { B, c } = await reopen(fold, perm);
    chk(name, sc, 'WORKING on screen, unsaved by this browser’s record (not this session), recorded against REMOTE, nothing kept aside; REMOTE the folder’s copy'
      + (perm ? '; the opening stopped at one click' : '') + ' (a CONTROL)',
      J([...scr(B.ev), B.ev('DIRTY'), !!B.ev('baseGet().dirty'), +B.ev('driveBaseOf(mySlug())') === tsOf(REMOTE), kept(B.ev), ...head(fold), ...(perm ? [c, B.ev('_driveNeed')] : [])]),
      J(['WORKING', 700, false, true, true, null, 'REMOTE', 650, ...(perm ? [false, 'click'] : [])]));
    const h = await held(B, fold); const s0 = state(B.ev);
    chk(name, sc, 'the save is held at its write; REMOTE is still the folder’s copy, stamped after the save’s own (a CONTROL)',
      J([h.ok, B.ev('_saveBusy'), ...head(fold), headTs(fold) > +B.ev('MS.ts')]), J([true, 1, 'REMOTE', 650, true]));
    for (const how of ['pull', 'connect', 'auto', 'tick'])
      chk(name, sc, 'while the save is held, ' + REFRESH[how] + RQ, J(await refresh(B, fold, how, s0)), J(EXPECT[how]));
    h.g.open(); await h.p; await pause(5);
    chk(name, sc, 'once the save lands: WORKING on screen, in browser storage and the folder’s copy; saved, recorded against it; REMOTE in the folder’s history; nothing kept aside',
      J([...scr(B.ev), ...stored(B.ev), ...head(fold), saved(B.ev), onHead(B.ev, fold), inHist(fold, ['REMOTE', 650]), kept(B.ev)]),
      J(['WORKING', 700, 'WORKING', 700, 'WORKING', 700, true, true, true, null]));
    chk(name, sc, 'once the save lands, the status line says how it ended -- [it saved, the refused Connect’s words gone]',
      J([/^✅ Saved O&M FY27 to the shared folder/.test(status(B.ev)), status(B.ev).includes('was not loaded')]), J([true, false]));
    await landedThen(B, fold, sc, ['WORKING', 700]);
  }
  // (2) A SECOND WRITER SAVES DURING BRAD'S SAVE. Brad has saved BRAD-1, $700; Bob loads it and types BOB-2, $650. Brad presses
  // 💾 Save with nothing unsaved and it is held at its write; Bob takes the pen, which saves BOB-2 into the folder at once.
  // Brad's refresh loads nothing, and his save lands. It writes BRAD-1 over BOB-2, which is then in no copy in the folder
  // (U18, open; not this block's) -- Bob's own board still holds it.
  { const sc = '(2) a second writer saves during the save';
    const fold = folder(), A = boot({ html: F1 }); await pause(80); wire(A.ev, 'Brad', KEY.brad); connect(A.ev, A.w, fold);
    A.ev(`_liveCfg.folder='shared'; setNote('A','BRAD-1'); setAlloc('A','700'); 'ok'`); await A.ev('saveInPlace()'); await pause(5);
    const Bb = boot({ html: F1 }); await pause(80); wire(Bb.ev, 'Bob', KEY.bob); connect(Bb.ev, Bb.w, fold);
    await Bb.ev('driveStorePull(false)'); Bb.ev(`setNote('A','BOB-2'); setAlloc('A','650'); 'ok'`); await pause(5);
    chk(name, sc, 'Brad: BRAD-1 saved, the folder’s copy; Bob loaded it and typed BOB-2 (a CONTROL)',
      J([...scr(A.ev), saved(A.ev), ...head(fold), ...scr(Bb.ev)]), J(['BRAD-1', 700, true, 'BRAD-1', 700, 'BOB-2', 650]));
    const h = await held(A, fold); const s0 = state(A.ev); await pause(5);   // Bob's copy is stamped after Brad's
    await Bb.ev('takePen()'); await pause(5);
    chk(name, sc, 'while Brad’s save is held, Bob takes the pen: BOB-2 is the folder’s copy, saved by Bob, stamped after Brad’s save built its own (a CONTROL)',
      J([h.ok, ...head(fold), fold.copy(2027).by, headTs(fold) > +A.ev('MS.ts')]), J([true, 'BOB-2', 650, 'Bob', true]));
    for (const how of ['pull', 'connect', 'tick'])
      chk(name, sc, 'while the save is held, ' + REFRESH[how] + RQ, J(await refresh(A, fold, how, s0)), J(EXPECT[how]));
    h.g.open(); await h.p; await pause(5);
    chk(name, sc, 'once Brad’s save lands: BRAD-1 on screen, in browser storage and the folder’s copy; saved, recorded against it; nothing kept aside',
      J([...scr(A.ev), ...stored(A.ev), ...head(fold), saved(A.ev), onHead(A.ev, fold), kept(A.ev)]), J(['BRAD-1', 700, 'BRAD-1', 700, 'BRAD-1', 700, true, true, null]));
    await landedThen(A, fold, sc, ['BRAD-1', 700]);
    chk(name, sc, 'Bob’s own board still holds BOB-2, on screen and in its browser storage', J([...scr(Bb.ev), ...stored(Bb.ev)]), J(['BOB-2', 650, 'BOB-2', 650]));
  }
  // (3) THE CHECK IS MADE AFTER THE REFRESH'S WAITS. The refresh starts with no save under way and is held -- (a) at its read
  // of the folder's copy, (b) at its first wait, the folder asked what this page may do; 💾 Save starts meanwhile and is held
  // at its write; then the refresh is let go. A refresh that checked only when it started would load REMOTE here.
  for (const [k, how, holdOf, at] of [['a', 'driveStorePull(false)', holdRead, 'its read of the folder’s copy'], ['b', 'driveStorePull(true)', holdAsk, 'its first wait (the folder’s permission)']]) {
    const sc = '(3' + k + ') the refresh held at ' + at + '; a save starts meanwhile';
    const fold = withCopy(REMOTE); const { B } = await reopen(fold, false);
    const busy0 = B.ev('_saveBusy'), st0 = status(B.ev), hr = holdOf(fold);
    const pr = B.ev(how); const reached = await until(() => hr.hit());
    const h = await held(B, fold); const s0 = state(B.ev);
    hr.g.open(); const r = await pr; await pause(5);
    chk(name, sc, 'no save under way when the refresh started; it waited; the save started and is held at its write (a CONTROL)',
      J([busy0, reached, h.ok, B.ev('_saveBusy')]), J([0, true, true, 1]));
    chk(name, sc, 'the refresh, let go, loads nothing -- [returned, nothing changed byte for byte, ' + (k === 'a' ? 'said' : 'nothing said') + ']',
      J([r, state(B.ev) === s0, k === 'a' ? said(status(B.ev)) : status(B.ev) === st0]), J([false, true, true]));
    h.g.open(); await h.p; await pause(5);
    chk(name, sc, 'once the save lands: WORKING on screen and the folder’s copy, saved, recorded against it; REMOTE in the folder’s history; nothing kept aside',
      J([...scr(B.ev), ...head(fold), saved(B.ev), onHead(B.ev, fold), inHist(fold, ['REMOTE', 650]), kept(B.ev)]), J(['WORKING', 700, 'WORKING', 700, true, true, true, null]));
  }
  // (3c) NOTHING RECORDED FOR THE FOLDER (a browser that has not loaded from it): a refresh takes a copy that is not newer
  // than the screen as the one the work came from -- but not while a save is under way, or a save still to read the folder
  // finds it recorded and writes over it without asking. Brad's other browser has saved X, $600; this browser types MINE,
  // $720; 💾 Save waits at its read of the folder while the opening's own connect runs. The save then asks, as it does when
  // nothing is recorded.
  { const sc = '(3c) nothing recorded for the folder; the opening’s connect while a save waits at its read';
    const fold = folder(), X = boot({ html: F1 }); await pause(80); wire(X.ev, 'Brad', KEY.brad); connect(X.ev, X.w, fold);
    X.ev(`setNote('A','X'); setAlloc('A','600'); 'ok'`); await X.ev('saveInPlace()'); await pause(5);
    const C = boot({ html: F1 }); await pause(80); wire(C.ev, 'Brad', KEY.brad); connect(C.ev, C.w, fold);
    C.ev(`setNote('A','MINE'); setAlloc('A','720'); 'ok'`); await pause(5);
    chk(name, sc, 'nothing recorded for the folder; MINE on screen, unsaved; X the folder’s copy, stamped before MINE was typed (a CONTROL)',
      J([+C.ev('driveBaseOf(mySlug())'), ...scr(C.ev), C.ev('DIRTY'), ...head(fold), headTs(fold) < +C.ev('MS.ts')]), J([0, 'MINE', 720, true, 'X', 600, true]));
    const hr = holdRead(fold); const p = C.ev('saveInPlace()'); const reached = await until(() => hr.hit());
    const s0 = state(C.ev), st0 = status(C.ev); await C.ev('driveAutoConnect()'); await pause(5);
    chk(name, sc, 'the opening’s connect while the save waits at its read -- [the save waits, a save under way, nothing changed byte for byte: nothing recorded]',
      J([reached, C.ev('_saveBusy'), state(C.ev) === s0]), J([true, 1, true]));
    // With nothing recorded there is no telling whether anybody saved after this work: no clash is said, during a save or not.
    chk(name, sc, 'and it says nothing -- [the status line as it was, a clash said]',
      J([status(C.ev) === st0, /after the copy you are working from/.test(status(C.ev))]), J([true, false]));
    hr.g.open(); await p; await pause(5);
    chk(name, sc, 'then the save, finding nothing recorded, asks: nothing written, X still the folder’s copy, MINE on screen and unsaved, the choice offered',
      J([...head(fold), ...scr(C.ev), C.ev('DIRTY'), /Nothing was written/.test(status(C.ev)), /Save yours over theirs/.test(status(C.ev))]), J(['X', 600, 'MINE', 720, true, true, true]));
  }
  // (4) ONCE THE SAVE HAS FINISHED, THE NEXT REFRESH IS AN ORDINARY ONE. A refresh loads nothing while the save runs; the save
  // then (a) lands, and Brad's other browser saves NEWER, $750, after it; (b) fails, the folder refusing its write; (c) is
  // refused, NEWER having been saved before it read the folder; (d) is canceled, the folder's copy having no writer recorded.
  // The next refresh loads the newer copy, keeping aside work no saved copy has, and the record names what is on screen.
  const other = async (fold, note, amt) => {   // Brad's other browser: loads the folder's copy, types, saves
    const N = boot({ html: F1 }); await pause(80); wire(N.ev, 'Brad', KEY.brad); connect(N.ev, N.w, fold);
    await N.ev('driveStorePull(false)'); N.ev(`setNote('A',${J(note)}); setAlloc('A',${J(String(amt))}); 'ok'`); await N.ev('saveInPlace()'); await pause(5);
  };
  { const sc = '(4a) the save lands; a newer copy is saved after it';
    const fold = withCopy(REMOTE); const { B } = await reopen(fold, false);
    const h = await held(B, fold); const s0 = state(B.ev);
    chk(name, sc, 'while the save is held, ' + REFRESH.tick + RQ, J(await refresh(B, fold, 'tick', s0)), J(EXPECT.tick));
    h.g.open(); await h.p; await pause(5);
    await other(fold, 'NEWER', 750);
    chk(name, sc, 'the save landed (WORKING, saved); then Brad’s other browser loaded WORKING and saved NEWER over it (a precondition, not a control: before U13 the refresh during the save has already loaded the folder’s copy)',
      J([...scr(B.ev), saved(B.ev), B.ev('_saveBusy'), ...head(fold), inHist(fold, ['WORKING', 700])]), J(['WORKING', 700, true, 0, 'NEWER', 750, true]));
    const r = await B.ev('driveStorePull(true)'); await pause(5);
    chk(name, sc, 'the next refresh loads NEWER: on screen and in browser storage, saved, recorded against the folder’s copy; nothing kept aside (WORKING is saved, in the history)',
      J([r, ...scr(B.ev), ...stored(B.ev), saved(B.ev), onHead(B.ev, fold), kept(B.ev)]), J([true, 'NEWER', 750, 'NEWER', 750, true, true, null]));
  }
  { const sc = '(4b) the save fails: the folder refuses its write';
    const fold = withCopy(REMOTE); const { B } = await reopen(fold, false);
    const h = await held(B, fold); const s0 = state(B.ev);
    chk(name, sc, 'while the save is held, ' + REFRESH.pull + RQ, J(await refresh(B, fold, 'pull', s0)), J(EXPECT.pull));
    fold.failNext.main = new Error('The shared folder is read-only'); h.g.open(); await h.p; await pause(5);
    chk(name, sc, 'the save failed and says so: REMOTE still the folder’s copy; WORKING on screen, unsaved; no save under way (read from _saveBusy) (a precondition, not a control: before U13 the refresh during the save has already loaded the folder’s copy)',
      J([/Could not save to the shared folder/.test(status(B.ev)), ...head(fold), ...scr(B.ev), saved(B.ev), B.ev('_saveBusy')]), J([true, 'REMOTE', 650, 'WORKING', 700, false, 0]));
    const r = await B.ev('driveStorePull(true)'); await pause(5);
    chk(name, sc, 'the next refresh is an ordinary one: REMOTE, later than what is on screen, is loaded, saved and recorded against the folder’s copy; WORKING, in no saved copy, kept aside',
      J([r, ...scr(B.ev), saved(B.ev), onHead(B.ev, fold), kept(B.ev)]), J([true, 'REMOTE', 650, true, true, ['WORKING', 700]]));
  }
  { const sc = '(4c) the save is refused: a newer copy was saved before it read the folder';
    const fold = withCopy(REMOTE); const { B } = await reopen(fold, false);
    await other(fold, 'NEWER', 750);
    chk(name, sc, 'Brad’s other browser loaded REMOTE and saved NEWER over it; REMOTE in the folder’s history (a CONTROL)',
      J([...head(fold), inHist(fold, ['REMOTE', 650])]), J(['NEWER', 750, true]));
    const hr = holdRead(fold); const p = B.ev('saveInPlace()'); await until(() => hr.hit()); const s0 = state(B.ev);
    chk(name, sc, 'while the save waits at its read, ' + REFRESH.tick + RQ, J(await refresh(B, fold, 'tick', s0)), J(EXPECT.tick));
    hr.g.open(); await p; await pause(5);
    chk(name, sc, 'the save is refused and says so: nothing written, NEWER still the folder’s copy; WORKING on screen, unsaved; no save under way (a precondition, not a control: before U13 the refresh during the save has already loaded the folder’s copy)',
      J([/Nothing was written/.test(status(B.ev)), ...head(fold), ...scr(B.ev), saved(B.ev), B.ev('_saveBusy')]), J([true, 'NEWER', 750, 'WORKING', 700, false, 0]));
    await B.ev('liveTick()'); await pause(5);
    chk(name, sc, 'the next refresh (the Live tick) is an ordinary one: NEWER is loaded, saved and recorded against the folder’s copy; WORKING, in no saved copy, kept aside',
      J([...scr(B.ev), saved(B.ev), onHead(B.ev, fold), kept(B.ev)]), J(['NEWER', 750, true, true, ['WORKING', 700]]));
  }
  { const sc = '(4d) the save is canceled: the folder’s copy has no writer recorded, and Brad answers Cancel';
    const j = JSON.parse(REMOTE); delete j.writer;   // REMOTE as a board before v1.95 wrote it: no writer recorded
    const fold = withCopy(JSON.stringify(j)); const { B } = await reopen(fold, false);
    const hr = holdRead(fold); const p = B.ev('globalThis.__yes=false; saveInPlace()'); await until(() => hr.hit()); const s0 = state(B.ev);
    chk(name, sc, 'while the save waits at its read, ' + REFRESH.connect + RQ, J(await refresh(B, fold, 'connect', s0)), J(EXPECT.connect));
    const q0 = qs(B.ev).length; hr.g.open(); await p; await pause(5);
    chk(name, sc, 'the save asked once and was canceled: nothing written, REMOTE still the folder’s copy; WORKING on screen, unsaved; no save under way (a precondition, not a control: before U13 the refresh during the save has already loaded the folder’s copy)',
      J([qs(B.ev).length - q0, /Save canceled — nothing written/.test(status(B.ev)), ...head(fold), ...scr(B.ev), saved(B.ev), B.ev('_saveBusy')]),
      J([1, true, 'REMOTE', 650, 'WORKING', 700, false, 0]));
    B.ev(`globalThis.__yes=true; 'ok'`); const r = await B.ev('driveStorePull(true)'); await pause(5);
    chk(name, sc, 'the next refresh is an ordinary one: REMOTE, later than what is on screen, is loaded, saved and recorded against the folder’s copy; WORKING, in no saved copy, kept aside',
      J([r, ...scr(B.ev), saved(B.ev), onHead(B.ev, fold), kept(B.ev)]), J([true, 'REMOTE', 650, true, true, ['WORKING', 700]]));
  }
  // (5) CONTROLS. (Cc) No save under way: the refresh loads REMOTE as it always has, keeping WORKING aside. (Cb) Work typed in
  // this session: the refresh during the save gives the unsaved-changes message as it always has. (Ca) REMOTE not stamped
  // ahead: nothing to load, during the save or after.
  { const sc = '(5) Cc: no save under way';
    const fold = withCopy(REMOTE); const { B } = await reopen(fold, false);
    const r = await B.ev('driveStorePull(true)'); await pause(5);
    chk(name, sc, 'the refresh loads REMOTE as before: on screen and in browser storage, saved, recorded against the folder’s copy; WORKING kept aside, and said',
      J([r, B.ev('_saveBusy'), ...scr(B.ev), ...stored(B.ev), saved(B.ev), onHead(B.ev, fold), kept(B.ev), /kept aside/.test(status(B.ev))]),
      J([true, 0, 'REMOTE', 650, 'REMOTE', 650, true, true, ['WORKING', 700], true]));
  }
  { const sc = '(5) Cb: work typed in this session; a refresh during the save';
    const { A, fold } = b1; A.ev(`_liveCfg.folder='shared'; 'ok'`);
    chk(name, sc, 'WORKING typed in this session, unsaved (DIRTY) (a CONTROL)', J([...scr(A.ev), A.ev('DIRTY')]), J(['WORKING', 700, true]));
    const h = await held(A, fold); const s0 = state(A.ev);
    const r = await A.ev('driveStorePull(true)'); await pause(5); const st = status(A.ev);
    chk(name, sc, 'while the save is held, the refresh gives the unsaved-changes message as before, and changes nothing',
      J([r, state(A.ev) === s0, /and you have unsaved changes\. Nothing was replaced\. Save yours, or reload to take theirs\./.test(st), /was not loaded|Nothing was loaded/.test(st)]),
      J([false, true, true, false]));
    h.g.open(); await h.p; await pause(5);
    chk(name, sc, 'once the save lands: WORKING on screen and the folder’s copy, saved, recorded against it',
      J([...scr(A.ev), ...head(fold), saved(A.ev), onHead(A.ev, fold)]), J(['WORKING', 700, 'WORKING', 700, true, true]));
  }
  { const sc = '(5) Ca: REMOTE not stamped ahead';
    const REMOTE0 = await writeRemote(0), b0 = await brad(REMOTE0);
    const fold = withCopy(REMOTE0); const { B } = await reopen(fold, false, b0.LS);
    chk(name, sc, 'Brad’s opening loaded REMOTE (saved, recorded against it); reopened with WORKING unsaved (a CONTROL)',
      J([...b0.v, ...scr(B.ev), !!B.ev('baseGet().dirty')]), J(['REMOTE', 650, true, true, 'WORKING', 700, true]));
    const h = await held(B, fold); const s0 = state(B.ev);
    chk(name, sc, 'while the save is held, REMOTE is not later than the save’s own copy, and the refresh loads nothing, as before',
      J([headTs(fold) < +B.ev('MS.ts'), await B.ev('driveStorePull(true)'), state(B.ev) === s0]), J([true, false, true]));
    h.g.open(); await h.p; await pause(5);
    chk(name, sc, 'once the save lands: WORKING on screen and the folder’s copy, saved, recorded against it; REMOTE in the folder’s history; nothing kept aside',
      J([...scr(B.ev), ...head(fold), saved(B.ev), onHead(B.ev, fold), inHist(fold, ['REMOTE', 650]), kept(B.ev)]), J(['WORKING', 700, 'WORKING', 700, true, true, true, null]));
  }
  // (6) THE WORDS ARE TRUE WHERE THE CONNECT GOES ON TO LOAD OTHER THINGS. (a) The folder also holds newer execution data and a
  // reprogramming log, shared through the product by Alice's board (EXDB and RPDB set as the v1.95 W2 block's fixture sets
  // them). During a held save Brad presses the bar's Connect (the folder's edit permission not kept), or his opening's own
  // connect runs. The board's copy is not loaded; the same Connect loads the execution data and the log. So the words name
  // the board's copy alone, and never say that nothing was loaded from the folder. (b) Load theirs runs in the save's queue:
  // a Connect while it waits at its read is refused in the same words, and Load theirs then loads REMOTE, keeping WORKING aside.
  for (const [how, perm] of [['connect', true], ['auto', false]]) {
    const sc = '(6a) ' + REFRESH[how] + ' during a save, with newer execution data and a reprogramming log in the folder';
    const fold = withCopy(REMOTE);
    const X = boot({ html: F1 }); await pause(80); wire(X.ev, 'Alice', KEY.alice); connect(X.ev, X.w, fold);
    X.ev(`(function(){ const t=Date.now();
      EXDB={ts:t, all:{om:{fy:2027, rows:[['EXEC-1', 5000]]}}}; persistExdb();
      RPDB={ts:t, entries:[{id:'rp-1', ts:t, ap:'om', amt:25000, what:'a reprogramming'}]}; persistRp(); return 'ok'; })()`);
    const shared = [await X.ev('driveExecPush(true)'), await X.ev('driveRpPush(true)')]; await pause(5);
    const { B } = await reopen(fold, perm);
    const extra = ev => JSON.parse(ev(`JSON.stringify([Object.keys(EXDB.all||{}), rpAll().map(function(r){ return r.id; })])`));
    chk(name, sc, 'Alice shared both; Brad’s board holds neither; WORKING on screen; REMOTE the folder’s copy (a CONTROL)',
      J([...shared, ...extra(B.ev), ...scr(B.ev), ...head(fold)]), J([true, true, [], [], 'WORKING', 700, 'REMOTE', 650]));
    const h = await held(B, fold); const s0 = state(B.ev);
    const r = await B.ev(REFRESH[how]); await pause(5); const st = status(B.ev);
    chk(name, sc, 'while the save is held, the Connect loads the execution data and the log but not the board’s copy -- [returned, a save under way, nothing changed byte for byte, execution data, the log]',
      J([r, B.ev('_saveBusy') > 0, state(B.ev) === s0, ...extra(B.ev)]), J([true, true, true, ['om'], ['rp-1']]));
    chk(name, sc, 'and it says so of the board’s copy alone -- [word for word, says nothing was loaded, says nothing was changed]',
      J([st, /Nothing was loaded/i.test(st), /Nothing was changed/i.test(st)]), J([SAID, false, false]));
    h.g.open(); await h.p; await pause(5);
    chk(name, sc, 'once the save lands: WORKING on screen and the folder’s copy, saved, recorded against it; the status line says it saved, the Connect’s words gone',
      J([...scr(B.ev), ...head(fold), saved(B.ev), onHead(B.ev, fold), /^✅ Saved O&M FY27 to the shared folder/.test(status(B.ev)), status(B.ev).includes('was not loaded')]),
      J(['WORKING', 700, 'WORKING', 700, true, true, true, false]));
  }
  { const sc = '(6b) a Connect while Load theirs waits at its read';
    const fold = withCopy(REMOTE); const { B } = await reopen(fold, false);
    const hr = holdRead(fold); const pr = B.ev(`driveResolve('theirs')`); const reached = await until(() => hr.hit()); const s0 = state(B.ev);
    const r = await B.ev('driveConnectNow()'); await pause(5);
    chk(name, sc, 'Load theirs waits at its read, counted as a save is; the Connect loads nothing -- [Load theirs waits, returned, counted, nothing changed byte for byte, said word for word]',
      J([reached, r, B.ev('_saveBusy') > 0, state(B.ev) === s0, status(B.ev)]), J([true, true, true, true, SAID]));
    hr.g.open(); await pr; await pause(5);
    chk(name, sc, 'then Load theirs loads REMOTE, saved and recorded against the folder’s copy; WORKING kept aside, and said',
      J([...scr(B.ev), saved(B.ev), onHead(B.ev, fold), kept(B.ev), /^⬇ Loaded Brad’s copy of O&M FY27\. Your work is kept aside/.test(status(B.ev))]),
      J(['REMOTE', 650, true, true, ['WORKING', 700], true]));
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (U13) ====
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
