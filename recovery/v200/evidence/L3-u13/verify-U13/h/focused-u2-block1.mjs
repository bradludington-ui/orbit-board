// FOCUSED harness (reuse review): VERBATIM from the suite given -- imports, failure list, keepBoards, SEEN/chk, the
// v2.00 block(s) '// ==== v2.00 (U2): work put back during a save stays unsaved ====' .. '// ==== end v2.00 (U2) ====', the top-level helpers they reference (closure: MINE, W1H, base, d, it), the guard. Not the full suite.
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
