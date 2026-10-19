// u13-observe PROBE (not a suite; prints observations only): its head is focused-u13.mjs up to the block --: VERBATIM from the suite given -- imports, failure list, keepBoards, SEEN/chk, the
// v2.00 block(s) '// ==== v2.00 (U13): a refresh during a save loads nothing ====' .. '// ==== end v2.00 (U13) ====', the top-level helpers they reference (closure: MINE, W1H, base, d, it), the guard. Not the full suite.
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
// ==== u13-observe: OBSERVATIONS ONLY (no checks, no expected values) for the README's findings. Read-only probe. ====
{
  const { J, wire, KEY, status, baseFile, folder, connect, gate, until, pause, lsOf } = W1H;
  const out = (k, v) => console.log('OBS ' + J([k, v]));
  const F1 = baseFile('Brad', KEY.brad);
  const NM = 'spmt-2027-om.json', HOUR = 3600000;
  const inCopy = txt => { try { const j = JSON.parse(txt), st = j.store || j, y = (st.years || {})[st.cur] || {}, a = (y.alloc || {}).A;
    return [String((y.notes || {}).A || ''), (a && typeof a === 'object') ? a.v : (a == null ? null : a)]; } catch (e) { return ['(unreadable)', null]; } };
  const scr = ev => JSON.parse(ev(`JSON.stringify([String(S.notes.A||''), (S.alloc.A&&typeof S.alloc.A==='object')? S.alloc.A.v : null])`));
  const folderView = fold => ({ head: fold.raw(2027) == null ? null : [...inCopy(fold.raw(2027)), (fold.copy(2027) || {}).by, ((fold.copy(2027) || {}).writer || {}).by],
    history: Object.entries((fold.root.dirs.history || { files: {} }).files).map(([n, t]) => [n.replace(/^spmt-2027-om-/, ''), ...inCopy(t)]) });
  const withCopy = txt => { const fold = folder(); fold.root.files[NM] = txt; return fold; };
  const R = boot({ html: F1 }); await pause(80); const f0 = folder(); wire(R.ev, 'Brad', KEY.brad); connect(R.ev, R.w, f0);
  R.ev(`(function(){ var real=Date.now; Date.now=function(){ return real.call(Date)+${HOUR}; }; return 'ok'; })()`);
  R.ev(`setNote('A','REMOTE'); setAlloc('A','650'); 'ok'`); await R.ev('saveInPlace()'); await pause(5);
  const REMOTE = f0.raw(2027);
  const fA = withCopy(REMOTE), A = boot({ html: F1 }); await pause(80); wire(A.ev, 'Brad', KEY.brad); connect(A.ev, A.w, fA);
  await A.ev('driveAutoConnect()'); A.ev(`setNote('A','WORKING'); setAlloc('A','700'); 'ok'`); await pause(5);
  const LS = lsOf(A.ev);
  const reopen = async fold => { const B = boot({ html: F1, ls: { ...LS } }); await pause(80); wire(B.ev, 'Brad', KEY.brad); connect(B.ev, B.w, fold);
    B.ev(`_liveCfg.folder='shared'; _liveCfg.on=true; _liveCfg.auto=true; _driveLive=true; 'ok'`); return B; };
  const held = async (B, fold) => { const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
    const p = B.ev('saveInPlace()'); await until(() => (fold.hits.main || 0) > n0); return { g, p }; };
  const lv = ev => JSON.parse(ev(`JSON.stringify({last:LIVEDB.last, err:LIVEDB.err, pub:LIVEDB.pub||0, lastAge:liveAge(LIVEDB.last)})`));
  // O1: the bar's Connect during the save: the words, and the words once the save has landed.
  { const fold = withCopy(REMOTE), B = await reopen(fold); const h = await held(B, fold);
    await B.ev('driveConnectNow()'); out('O1 Connect during the save: status', status(B.ev));
    h.g.open(); await h.p; await pause(5); out('O1 once the save landed: status', status(B.ev)); out('O1 screen/head', [scr(B.ev), folderView(fold).head]); }
  // O2: the Live tick and ↻ Refresh now during the save: LIVEDB before and after, and what the status says.
  { const fold = withCopy(REMOTE), B = await reopen(fold); const h = await held(B, fold);
    const l0 = lv(B.ev); await new Promise(r => setTimeout(r, 30)); await B.ev('liveTick()'); await pause(5); const l1 = lv(B.ev);
    out('O2 liveTick during the save: LIVEDB.last moved; err; status', [l1.last > l0.last, l1.lastAge, l1.err, status(B.ev)]);
    await new Promise(r => setTimeout(r, 30)); const r = await B.ev('livePoll(false)'); await pause(5); const l2 = lv(B.ev);
    out('O2 ↻ Refresh now (livePoll(false)) during the save: returned; LIVEDB.last moved; status; screen', [r, l2.last > l1.last, status(B.ev), scr(B.ev)]);
    h.g.open(); await h.p; await pause(5); out('O2 once the save landed: status; screen; head', [status(B.ev), scr(B.ev), folderView(fold).head]); }
  // O3: the second writer: where Bob's copy is once Brad's save has landed, and what Bob's next refresh says.
  { const fold = folder(), A2 = boot({ html: F1 }); await pause(80); wire(A2.ev, 'Brad', KEY.brad); connect(A2.ev, A2.w, fold);
    A2.ev(`setNote('A','BRAD-1'); setAlloc('A','700'); 'ok'`); await A2.ev('saveInPlace()'); await pause(5);
    const Bb = boot({ html: F1 }); await pause(80); wire(Bb.ev, 'Bob', KEY.bob); connect(Bb.ev, Bb.w, fold);
    await Bb.ev('driveStorePull(false)'); Bb.ev(`setNote('A','BOB-2'); setAlloc('A','650'); 'ok'`); await pause(5);
    const h = await held(A2, fold); await Bb.ev('takePen()'); await pause(5);
    out('O3 during Brad’s held save, after Bob took the pen: folder', folderView(fold));
    await A2.ev('driveStorePull(true)'); h.g.open(); await h.p; await pause(5);
    out('O3 once Brad’s save landed: folder (head and history)', folderView(fold));
    out('O3 Brad: screen; status', [scr(A2.ev), status(A2.ev)]);
    out('O3 Bob before his refresh: screen; stored', [scr(Bb.ev), inCopy(Bb.ev('localStorage.getItem(_AP.key)'))]);
    const r = await Bb.ev('driveStorePull(true)'); await pause(5);
    out('O3 Bob’s next refresh: returned; status; screen', [r, status(Bb.ev), scr(Bb.ev)]); }
  // O4: a Connect during an AUTOSAVE (work typed this session, DIRTY true): the existing unsaved-changes guard answers, not U13's.
  { const fold = withCopy(REMOTE), D = boot({ html: F1 }); await pause(80); wire(D.ev, 'Brad', KEY.brad); connect(D.ev, D.w, fold);
    await D.ev('driveAutoConnect()'); D.ev(`_liveCfg.folder='shared'; _liveCfg.on=true; _liveCfg.auto=true; _driveLive=true; 'ok'`);
    D.ev(`setNote('A','WORKING'); setAlloc('A','700'); 'ok'`); await pause(5);
    const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main; const p = D.ev('liveTick()'); await until(() => (fold.hits.main || 0) > n0);
    await D.ev('driveConnectNow()'); out('O4 Connect during the autosave: status', status(D.ev));
    g.open(); await p; await pause(5); out('O4 once the autosave landed: status; DIRTY; screen; head', [status(D.ev), D.ev('DIRTY'), scr(D.ev), folderView(fold).head]); }
  // O5: a refresh in the save's last window -- its copy written, the lock heartbeat held, the record not yet moved to it.
  { const fold = withCopy(REMOTE), B = boot({ html: F1, ls: { ...LS } }); await pause(80); wire(B.ev, 'Brad', KEY.brad); connect(B.ev, B.w, fold);
    const n0 = fold.hits.lock || 0; fold.hold.lock = gate(); const g = fold.hold.lock; const p = B.ev('saveInPlace()'); await until(() => (fold.hits.lock || 0) > n0);
    const r = await B.ev('driveStorePull(true)'); await pause(5);
    out('O5a 💾 Save held at its heartbeat (copy written): head; base = head ts; _saveBusy; refresh returned; status', [folderView(fold).head, +B.ev('driveBaseOf(mySlug())') === +JSON.parse(fold.raw(2027)).store.ts, B.ev('_saveBusy'), r, status(B.ev)]);
    g.open(); await p; await pause(5); out('O5a once it landed: status', status(B.ev)); }
  { const fold = withCopy(REMOTE), D = boot({ html: F1 }); await pause(80); wire(D.ev, 'Brad', KEY.brad); connect(D.ev, D.w, fold);
    await D.ev('driveAutoConnect()'); D.ev(`_liveCfg.on=true; _liveCfg.auto=true; _driveLive=true; setNote('A','WORKING'); setAlloc('A','700'); 'ok'`); await pause(5);
    const n0 = fold.hits.lock || 0; fold.hold.lock = gate(); const g = fold.hold.lock; const p = D.ev('liveTick()'); await until(() => (fold.hits.lock || 0) > n0);
    const r = await D.ev('driveStorePull(true)'); await pause(5);
    out('O5b the autosave held at its heartbeat: refresh returned; status', [r, status(D.ev)]);
    g.open(); await p; await pause(5); out('O5b once the autosave landed: status; DIRTY; saved record; screen; head', [status(D.ev), D.ev('DIRTY'), D.ev('!!baseGet().dirty'), scr(D.ev), folderView(fold).head]); }
  process.exit(0);
}
