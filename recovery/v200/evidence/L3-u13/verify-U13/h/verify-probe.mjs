// verify-U13 PROBE: the focused harness head (verbatim, up to the U13 block) + probe-body.mjs.txt (observations only)
// FOCUSED harness (reuse review): VERBATIM from the suite given -- imports, failure list, keepBoards, SEEN/chk, the
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
// ==== verify-U13 probe: OBSERVATIONS ONLY (no checks, no expected values). Synthetic data at run time; nothing written. ====
{
  const { J, wire, KEY, status, baseFile, folder, connect, gate, until, pause, lsOf } = W1H;
  const out = (k, v) => console.log('OBS ' + J([k, v]));
  const F1 = baseFile('Brad', KEY.brad);
  const NM = 'spmt-2027-om.json', HOUR = 3600000;
  const inCopy = txt => { try { const j = JSON.parse(txt), st = j.store || j, y = (st.years || {})[st.cur] || {}, a = (y.alloc || {}).A;
    return [String((y.notes || {}).A || ''), (a && typeof a === 'object') ? a.v : (a == null ? null : a)]; } catch (e) { return ['(unreadable)', null]; } };
  const scr = ev => JSON.parse(ev(`JSON.stringify([String(S.notes.A||''), (S.alloc.A&&typeof S.alloc.A==='object')? S.alloc.A.v : null])`));
  const head = fold => fold.raw(2027) == null ? null : inCopy(fold.raw(2027));
  const withCopy = txt => { const fold = folder(); fold.root.files[NM] = txt; return fold; };
  const flags = ev => JSON.parse(ev(`JSON.stringify({DIRTY:DIRTY, bd:_baseDirty, rec:!!baseGet().dirty, base:driveBaseOf(mySlug()), gen:_saveGen, busy:_saveBusy, kept:localStorage.getItem(_AP.key+'.kept')!=null})`));
  // REMOTE, an hour ahead, written through the product.
  const R = boot({ html: F1 }); await pause(80); const f0 = folder(); wire(R.ev, 'Brad', KEY.brad); connect(R.ev, R.w, f0);
  R.ev(`(function(){ var real=Date.now; Date.now=function(){ return real.call(Date)+${HOUR}; }; return 'ok'; })()`);
  R.ev(`setNote('A','REMOTE'); setAlloc('A','650'); 'ok'`); await R.ev('saveInPlace()'); await pause(5);
  const REMOTE = f0.raw(2027);
  const fA = withCopy(REMOTE), A = boot({ html: F1 }); await pause(80); wire(A.ev, 'Brad', KEY.brad); connect(A.ev, A.w, fA);
  await A.ev('driveAutoConnect()'); A.ev(`setNote('A','WORKING'); setAlloc('A','700'); 'ok'`); await pause(5);
  const LS = lsOf(A.ev);
  const reopen = async (fold, perm) => { const B = boot({ html: F1, ls: { ...LS } }); await pause(80); wire(B.ev, 'Brad', KEY.brad);
    if (perm) { fold.perm = 'prompt'; fold.dir.queryPermission = async () => fold.perm; fold.dir.requestPermission = async () => (fold.perm = 'granted'); }
    connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`); if (perm) await B.ev('driveAutoConnect()'); await pause(5); return B; };
  const held = async (B, fold) => { const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
    const p = B.ev('saveInPlace()'); await until(() => (fold.hits.main || 0) > n0); return { g, p }; };
  const holdRead = fold => { const gh = fold.dir.getFileHandle, g = gate(); let hit = 0;
    fold.dir.getFileHandle = async (n, o) => { if (!hit && n === NM && !(o && o.create)) { hit = 1; await g.p; } return gh(n, o); };
    return { g, hit: () => hit }; };
  // P1: the folder holds NEWER EXECUTION DATA (shared through the product by Alice's board) and Brad presses the bar's Connect
  // during a held save (permission not kept: the bar is showing). What the words say, and what the same Connect loaded.
  for (const how of ['driveConnectNow()', 'driveAutoConnect()']) {
    const fold = withCopy(REMOTE);
    const X = boot({ html: F1 }); await pause(80); wire(X.ev, 'Alice', KEY.alice); connect(X.ev, X.w, fold);
    X.ev(`EXDB={ts:Date.now(), all:{om:{rows:{2026:{}}, by:'Alice'}}}; 'ok'`); await X.ev('driveExecPush(true)'); await pause(5);
    const B = await reopen(fold, how === 'driveConnectNow()');
    const ex0 = B.ev('JSON.stringify([+(EXDB.ts||0), Object.keys(EXDB.all||{}), localStorage.getItem("prio27execdb")])');
    const h = await held(B, fold); const f1 = flags(B.ev);
    const r = await B.ev(how); await pause(5);
    const ex1 = B.ev('JSON.stringify([+(EXDB.ts||0), Object.keys(EXDB.all||{}), localStorage.getItem("prio27execdb")])');
    out('P1 ' + how + ' during a held save: returned; status', [r, status(B.ev)]);
    out('P1 ' + how + ': execution data before -> after the same Connect (EXDB.ts, keys, stored)', [JSON.parse(ex0).slice(0, 2), JSON.parse(ex1).slice(0, 2), JSON.parse(ex0)[2] !== JSON.parse(ex1)[2]]);
    out('P1 ' + how + ': board flags before -> after; screen', [f1, flags(B.ev), scr(B.ev), B.ev('_driveLive'), B.ev('_driveNeed')]);
    h.g.open(); await h.p; await pause(5);
    out('P1 ' + how + ': once the save landed: status; screen; head; flags', [status(B.ev), scr(B.ev), head(fold), flags(B.ev)]);
  }
  // P2: A REFRESH WHOSE READ SPANS A WHOLE SAVE. The refresh (driveStorePull(false), a Connect's) is held at its read with no
  // save under way; 💾 Save then runs from start to landing; the refresh is let go after. No save is under way at its check.
  { const fold = withCopy(REMOTE); const B = await reopen(fold, false);
    const hr = holdRead(fold); const pr = B.ev('driveStorePull(false)'); await until(() => hr.hit());
    await B.ev('saveInPlace()'); await pause(5);
    out('P2 the save ran to the end while the refresh waited at its read: status; screen; head; flags', [status(B.ev), scr(B.ev), head(fold), flags(B.ev)]);
    hr.g.open(); const r = await pr; await pause(5);
    out('P2 the refresh let go after the save landed: returned; status; screen; head; flags', [r, status(B.ev), scr(B.ev), head(fold), flags(B.ev)]);
    const r2 = await B.ev('driveStorePull(false)'); await pause(5);
    out('P2 the next refresh: returned; status; screen; head; flags', [r2, status(B.ev), scr(B.ev), head(fold), flags(B.ev)]);
    const C = boot({ html: F1, ls: lsOf(B.ev) }); await pause(80); wire(C.ev, 'Brad', KEY.brad); connect(C.ev, C.w, fold);
    await C.ev('driveAutoConnect()'); await pause(5);
    out('P2 reopened (the opening connect): status; screen; head; flags', [status(C.ev), scr(C.ev), head(fold), flags(C.ev)]);
  }
  // P3: "LOAD THEIRS" (driveResolve('theirs'), run in saveSerial and so counted in _saveBusy) held at its read; a Connect
  // meanwhile. What the Connect says (it names "a save"), and the end state.
  { const fold = withCopy(REMOTE); const B = await reopen(fold, false);
    const hr = holdRead(fold); const pr = B.ev(`driveResolve('theirs')`); await until(() => hr.hit());
    const r = await B.ev('driveConnectNow()'); await pause(5);
    out('P3 Connect while Load theirs waits at its read: returned; _saveBusy; status; screen', [r, B.ev('_saveBusy'), status(B.ev), scr(B.ev)]);
    hr.g.open(); await pr; await pause(5);
    out('P3 Load theirs finished: status; screen; flags', [status(B.ev), scr(B.ev), flags(B.ev)]);
  }
  // P4: the autosave path (work typed this session) held at its write while the Live tick refreshes: which guard answers.
  { const fold = withCopy(REMOTE), D = boot({ html: F1 }); await pause(80); wire(D.ev, 'Brad', KEY.brad); connect(D.ev, D.w, fold);
    await D.ev('driveAutoConnect()'); D.ev(`_liveCfg.folder='shared'; _liveCfg.on=true; _liveCfg.auto=true; _driveLive=true; setNote('A','WORKING'); setAlloc('A','700'); 'ok'`); await pause(5);
    const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main; const p = D.ev('liveTick()'); await until(() => (fold.hits.main || 0) > n0);
    const st0 = status(D.ev); const r = await D.ev('driveStorePull(true)'); await pause(5);
    out('P4 quiet refresh during an autosave: returned; status changed; flags', [r, status(D.ev) !== st0, flags(D.ev)]);
    g.open(); await p; await pause(5);
    out('P4 the autosave landed: status; screen; head; flags', [status(D.ev), scr(D.ev), head(fold), flags(D.ev)]);
  }
  process.exit(0);
}
