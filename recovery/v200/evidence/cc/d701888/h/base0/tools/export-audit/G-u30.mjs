// FOCUSED harness: VERBATIM from /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/d701888/after/tools/export-audit/audit-import.mjs -- imports, failure list, keepBoards, SEEN/chk, the selected blocks
// (suite lines 8332-8701), the top-level helpers they reference (closure: MINE, W1H, base, it, webLocks), the guard. Not the full suite.
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
const webLocks = label => {
  const held = [], queues = new Map(), log = [];
  const stats = { requests: 0, grants: 0, invokes: 0, releases: 0, dropped: 0, violations: [], maxHeld: {}, unmodeled: [], label };
  let seq = 0;
  const q = name => { if (!queues.has(name)) queues.set(name, []); return queues.get(name); };
  const note = (ev, r, extra = {}) => log.push({ n: log.length, ev, name: r.name, mode: r.mode, client: r.client, id: r.id, ...extra });
  const grantable = r => { const qq = q(r.name);
    if (qq.length && qq[0] !== r) return false;
    if (r.mode === 'exclusive') return !held.some(l => l.name === r.name);
    return !held.some(l => l.name === r.name && l.mode === 'exclusive'); };
  const lockObj = r => { const o = new r.win.Object(); o.name = r.name; o.mode = r.mode; return o; };
  const release = lock => { const i = held.indexOf(lock); if (i < 0) return;
    held.splice(i, 1); stats.releases++; note('release', lock); processQueue(lock.name); };
  const invoke = (r, lock) => {
    if (!held.includes(lock)) { note('invoke-skipped', r); return; }   // let go by closeClient before its task ran
    stats.invokes++; note('invoke', r);
    let waiting;
    try { waiting = Promise.resolve(r.callback(lockObj(r))); } catch (e) { waiting = Promise.reject(e); }
    waiting.then(v => { release(lock); r.resolve(v); }, e => { release(lock); r.reject(e); }); };
  const grant = r => {
    if (held.some(l => l.name === r.name && (r.mode === 'exclusive' || l.mode === 'exclusive')))
      stats.violations.push({ at: log.length, name: r.name, client: r.client, holders: held.filter(l => l.name === r.name).map(l => l.client) });
    const lock = { name: r.name, mode: r.mode, client: r.client, id: r.id };
    held.push(lock); stats.grants++;
    const n = held.filter(l => l.name === r.name).length;
    stats.maxHeld[r.name] = Math.max(stats.maxHeld[r.name] || 0, n);
    note('grant', r, { holdersNow: n });
    r.win.setTimeout(() => invoke(r, lock), 0); };
  function processQueue(name) { const qq = q(name);
    while (qq.length) { const r = qq[0]; if (!grantable(r)) return; qq.shift(); grant(r); } }
  const request = (win, client, name, a, b) => {
    const options = (typeof a === 'function') ? {} : (a || {});
    const callback = (typeof a === 'function') ? a : b;
    return new win.Promise((resolve, reject) => {
      name = String(name);
      const mode = options.mode === undefined ? 'exclusive' : String(options.mode);
      const r = { id: ++seq, name, mode, client, win, callback, resolve, reject, ifAvailable: !!options.ifAvailable };
      stats.requests++;
      if (options.steal || options.signal) { stats.unmodeled.push({ client, name, steal: !!options.steal, signal: !!options.signal });
        note('reject-unmodeled', r); reject(new win.Error('NotSupportedError: steal/signal are not modelled by this stand-in')); return; }
      if (mode !== 'exclusive' && mode !== 'shared') { note('reject-mode', r); reject(new win.TypeError('mode')); return; }
      if (typeof callback !== 'function') { note('reject-callback', r); reject(new win.TypeError('callback is not a function')); return; }
      if (name.startsWith('-')) { note('reject-name', r); reject(new win.Error('NotSupportedError: name starts with -')); return; }
      note('request', r, { queued: q(name).length, heldNow: held.filter(l => l.name === name).map(l => l.client) });
      if (r.ifAvailable && !(q(name).length === 0 && grantable(r))) {
        note('not-available', r);
        win.setTimeout(() => { let v; try { v = Promise.resolve(callback(null)); } catch (e) { v = Promise.reject(e); } v.then(resolve, reject); }, 0);
        return;
      }
      q(name).push(r); processQueue(name);
    }); };
  const snapshot = () => ({ held: held.map(l => ({ name: l.name, mode: l.mode, clientId: l.client })),
    pending: [...queues.entries()].flatMap(([, rs]) => rs.map(r => ({ name: r.name, mode: r.mode, clientId: r.client }))) });
  return { label, log, stats, snapshot,
    heldBy: name => held.filter(l => l.name === name).map(l => l.client),
    pendingOf: name => q(name).map(r => r.client),
    grantOrder: (name, fromN = 0) => log.filter(e => e.ev === 'grant' && e.name === name && e.n >= fromN).map(e => e.client),
    mark: () => log.length,
    // One tab's navigator.locks (jsdom has none; `had` says whether it had one).
    install(w, client) { const had = 'locks' in w.navigator;
      const api = { request: (name, a, b) => request(w, client, name, a, b), query: () => new w.Promise(res => res(JSON.parse(JSON.stringify(snapshot())))) };
      Object.defineProperty(w.navigator, 'locks', { value: api, configurable: true, enumerable: true });
      return { had, client }; },
    closeClient(client) {
      for (const [, rs] of queues) for (let i = rs.length - 1; i >= 0; i--) if (rs[i].client === client) { note('drop', rs[i]); rs.splice(i, 1); stats.dropped++; }
      for (const l of held.slice()) if (l.client === client) release(l);
      for (const name of queues.keys()) processQueue(name); } };
};
// ==== v2.00 (U30): a refresh takes the folder's copy as the one the work came from only when it is what is on screen ====
// With nothing recorded for the folder (this browser has not loaded from it or saved to it yet -- an opening that found no
// copy there, then a colleague's or another machine's save), a refresh that found the folder's copy not newer than the
// screen took that copy as the one the work on screen came from, "as it always was" (v1.89) -- whatever was on screen. The
// next 💾 Save, or the Live timer's next autosave one tick after it had said "Nothing was written" and offered the choice,
// then wrote the work on screen over that copy without asking. With a spaced history copy kept less than ten minutes
// before, the copy written over was kept only as a recent copy, and one more Save removed it: it was in no copy the board
// could reach. No second tab was needed; U20 was its two-tab form. Now the refresh takes the folder's copy as the base only
// when it is what is on screen (the same stamp: every change stamps the board anew); otherwise nothing is recorded and
// nothing is said, and 💾 Save asks -- Load theirs (yours kept aside), or Save yours over theirs (theirs kept in the folder's
// history as a spaced copy, whatever the spacing). It asks saying there is no record of which copy the work came from: it
// used to say that theirs was saved after that copy, which nothing recorded can tell. Controls: the screen exactly the folder's copy (recorded, and Save writes
// with no question; while a save is under way, U13's rule still holds), the first save of a new board into an empty folder,
// and an ordinary refresh with nothing unsaved. The rule is the stamp, so it is run through every way a refresh comes with
// nothing recorded: the Live timer, ↻ Refresh now, a reopen's own connect with unsaved work, a board saved to its own file,
// a board file handed over newer than the folder's copy, and another year. The two lines that follow the question -- ↶ Put
// back, and Load theirs refused for work already kept -- no longer say theirs was saved after, or is newer, when nothing
// recorded can tell (with a copy recorded they say it as before). Every expected value is written by hand.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v2.00 (U30) — a refresh takes the folder’s copy as the base only when it is on screen';
  try {
  const { J, mk, SVC, wire, KEY, status, qs, baseFile, folder, connect, gate, until, pause, lsOf } = W1H;
  const F1 = baseFile('Alice', KEY.alice);
  const scr = ev => ev(`String(S.notes.A||'')`);
  const unsaved = ev => JSON.parse(ev('JSON.stringify([DIRTY, _baseDirty, !!baseGet().dirty])'));
  const based = ev => +ev('driveBaseOf(mySlug())');
  const headTs = fold => { const j = fold.copy(2027); return j ? +((j.store && j.store.ts) || j.ts || 0) : 0; };
  const hist = fold => { const h = (fold.root.dirs.history || { files: {} }).files;
    return Object.keys(h).filter(n => /^spmt-2027-om-/.test(n)).sort().map(n => { let v = '?'; try { v = String(JSON.parse(h[n]).store.years['2027'].notes.A || ''); } catch (e) {} return [v, /-recent\.json$/.test(n)]; }); };
  const spaced = (fold, v) => hist(fold).some(([n, r]) => n === v && !r);
  const anywhere = (fold, v) => fold.note(2027, 'A') === v || hist(fold).some(([n]) => n === v);   // the folder's copy or its history
  const omWrites = fold => fold.log.filter(x => x === 'main:spmt-2027-om.json').length;
  const asks = ev => /Nothing was written/.test(status(ev)) && /Load theirs/.test(status(ev)) && /Save yours over theirs/.test(status(ev));
  // WHAT A SAVE SAYS WHEN IT ASKS WITH NOTHING RECORDED, word for word but for the copy's age ("just now", "2 minutes ago"):
  // there is no telling which copy the work came from, so it does not say that theirs was saved after it.
  const UNSAID = /^⛔ Alice saved O&M FY27 to the shared folder [^,]+, and this browser has no record of which copy in the folder, if any, the work on screen came from\. Nothing was written\. Load theirs \(your work is kept aside, and one click puts it back\) · Save yours over theirs \(theirs is kept in the folder’s history\)\.$/;
  // A GUARD passes on the board before this change too: it holds what must not change (the save's question, the stand-in,
  // a choice's outcome) so that a wrong form of the change is caught. Every other check that is not a CONTROL fails there.
  const GUARD = ' (a GUARD: it passes before this change too)';
  const state = ev => ev(`JSON.stringify([JSON.stringify(MS), DIRTY, _baseDirty, JSON.stringify(_driveBase), localStorage.getItem(_AP.key+'.base'), _saveGen, localStorage.getItem(_AP.key+'.kept'), localStorage.getItem(_AP.key)])`);
  const live = ev => ev(`_liveCfg.on=true; _liveCfg.auto=true; _driveLive=true; 'ok'`);   // Live view and its autosave on
  const open = async (LM, client, opts) => { const T = boot(opts || { html: F1 }); await pause(80);
    if (LM) LM.install(T.w, client); wire(T.ev, 'Alice', KEY.alice); return T; };
  const other = async (fold, notes) => { const X = await open(null, 'X'); connect(X.ev, X.w, fold);
    for (const n of notes) { await X.ev('driveStorePull(false)'); X.ev(`setNote('A',${J(n)}); 'ok'`); await pause(5); await X.ev('driveStorePush(false)'); await pause(5); }
    return X; };
  // NOTHING RECORDED, THE PRODUCT'S OWN WAY (as in the U20 block): B opens, and its opening's own connect finds no O&M copy;
  // then Alice's other machine saves F0 (F00 a moment before, with `h`); then B-EDIT is typed in B, unsaved.
  const unrecorded = async (LM, h) => { const fold = folder(); const B = await open(LM, 'B'); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    const c = await B.ev('driveAutoConnect()'); await pause(5);
    await other(fold, h ? ['F00', 'F0'] : ['F0']);
    B.ev(`setNote('A','B-EDIT'); 'ok'`); await pause(5);
    return { B, fold, c }; };
  const UNREC = h => 'the opening connected and recorded nothing (the folder held no O&M copy); Alice’s other machine then saved F0'
    + (h ? ' (F00 a moment before, now a spaced copy in the folder’s history)' : '') + '; B-EDIT typed after it, unsaved (a CONTROL)';
  const unrec = x => J([x.c, based(x.B.ev), scr(x.B.ev), x.B.ev('DIRTY'), x.fold.note(2027, 'A'), headTs(x.fold) < +x.B.ev('MS.ts'), hist(x.fold)]);
  const UNRECW = h => J([true, 0, 'B-EDIT', true, 'F0', true, h ? [['F00', false]] : []]);
  // ALICE CHOOSES, once the board has asked: Save yours over theirs (asked, and answered OK), then one more 💾 Save -- F0 stays
  // in the folder's history as a spaced copy throughout, and so does F00. Then reopened (this browser, the same folder, the
  // opening's own connect): B-EDIT2 on screen and the folder's copy, F0 in its history.
  const chooseMine = async (B, fold, sc, h) => {
    const q0 = qs(B.ev).length; await B.ev(`driveResolve('mine')`); await pause(5);
    chk(name, sc, '“Save yours over theirs”, asked and answered OK: B-EDIT the folder’s copy, saved; F0 kept in the folder’s history as a spaced copy' + (h ? '' : GUARD),
      J([qs(B.ev).length - q0, fold.note(2027, 'A'), unsaved(B.ev), spaced(fold, 'F0')]), J([1, 'B-EDIT', [false, false, false], true]));
    B.ev(`setNote('A','B-EDIT2'); 'ok'`); await pause(5); const q1 = qs(B.ev).length; await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'one more 💾 Save writes B-EDIT2 with no question; F0 still in the folder’s history as a spaced copy' + (h ? ', and F00' : GUARD),
      J([fold.note(2027, 'A'), qs(B.ev).length - q1, spaced(fold, 'F0'), h ? spaced(fold, 'F00') : null]), J(['B-EDIT2', 0, true, h ? true : null]));
    const C = await open(null, 'C', { html: F1, ls: lsOf(B.ev) }); connect(C.ev, C.w, fold); C.ev(`_liveCfg.folder='shared'; 'ok'`);
    await C.ev('driveAutoConnect()'); await pause(5);
    chk(name, sc, 'reopened: B-EDIT2 on screen and the folder’s copy, recorded against it; F0' + (h ? ' and F00' : '') + ' still in the folder’s history' + (h ? '' : GUARD),
      J([scr(C.ev), fold.note(2027, 'A'), based(C.ev) === headTs(fold), spaced(fold, 'F0'), h ? spaced(fold, 'F00') : null]), J(['B-EDIT2', 'B-EDIT2', true, true, h ? true : null]));
  };

  // (1) THE LIVE TIMER ALONE, ONE TAB. Live view and its autosave on. Tick 1: the autosave asks (nothing recorded, so there
  // is no telling: "Nothing was written", and the choice); the same tick's refresh does not take F0 as the base. Tick 2: the
  // autosave asks again and writes nothing -- it used to write B-EDIT over F0 and say "Saved automatically". 💾 Save asks
  // too. (1h): with F00 kept minutes before, F0 used to be kept only as a recent copy, and the next Save removed it.
  for (const h0 of [false, true]) {
    const sc = '(1' + (h0 ? 'h' : '') + ') the Live timer, one tab: nothing recorded, B-EDIT unsaved, F0 in the folder' + (h0 ? '; a history copy kept minutes before' : '');
    const x = await unrecorded(null, h0); const { B, fold } = x;
    chk(name, sc, UNREC(h0), unrec(x), UNRECW(h0));
    live(B.ev);
    const w0 = omWrites(fold), hs0 = J(hist(fold)); await B.ev('liveTick()'); await pause(5);
    chk(name, sc, 'tick 1: the autosave asks -- nothing written, F0 still the folder’s copy, the choice offered -- and the tick’s refresh records nothing',
      J([omWrites(fold) - w0, fold.note(2027, 'A'), asks(B.ev), based(B.ev)]), J([0, 'F0', true, 0]));
    chk(name, sc, 'and it says there is no record of the copy the work came from -- never that theirs was saved after it -- [the words, said after]',
      J([UNSAID.test(status(B.ev)), /after the copy you are working from/.test(status(B.ev))]), J([true, false]));
    await B.ev('liveTick()'); await pause(5);
    chk(name, sc, 'tick 2: the autosave asks again -- nothing written, F0 still the folder’s copy and its history as it was, B-EDIT unsaved, the choice still offered, nothing said to have saved',
      J([omWrites(fold) - w0, fold.note(2027, 'A'), J(hist(fold)) === hs0, B.ev('DIRTY'), asks(B.ev), /Saved to the shared folder automatically/.test(status(B.ev))]),
      J([0, 'F0', true, true, true, false]));
    const q0 = qs(B.ev).length; await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, '💾 Save asks as well: nothing written, nothing asked in a dialog, F0 still the folder’s copy, B-EDIT on screen, the choice offered',
      J([omWrites(fold) - w0, qs(B.ev).length - q0, fold.note(2027, 'A'), scr(B.ev), asks(B.ev)]), J([0, 0, 'F0', 'B-EDIT', true]));
    chk(name, sc, 'F0 and B-EDIT each still in a copy the board reaches -- [F0 in the folder or its history, B-EDIT on screen]' + (h0 ? '' : GUARD),
      J([anywhere(fold, 'F0'), scr(B.ev)]), J([true, 'B-EDIT']));
    await chooseMine(B, fold, sc, h0);
  }
  // (2) A REFRESH, THEN 💾 SAVE (one tab, no timer): Live view's ↻ Refresh now records nothing and says nothing new; the Save
  // asks. (3) 💾 SAVE FIRST: it asks; then the refresh; then 💾 Save asks again -- it used to write over F0 the second time.
  { const sc = '(2) ↻ Refresh now, then 💾 Save';
    const x = await unrecorded(null, true); const { B, fold } = x;
    chk(name, sc, UNREC(true), unrec(x), UNRECW(true));
    const st0 = status(B.ev); await B.ev('livePoll(false)'); await pause(5);
    chk(name, sc, '↻ Refresh now records nothing and says no clash -- [recorded, a clash said]',
      J([based(B.ev), /after the copy you are working from/.test(status(B.ev))]), J([0, false]));
    const w0 = omWrites(fold); await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'then 💾 Save asks: nothing written, F0 still the folder’s copy, B-EDIT on screen and unsaved, the choice offered',
      J([omWrites(fold) - w0, fold.note(2027, 'A'), scr(B.ev), B.ev('DIRTY'), asks(B.ev)]), J([0, 'F0', 'B-EDIT', true, true]));
    await chooseMine(B, fold, sc, true);
  }
  { const sc = '(3) 💾 Save, then ↻ Refresh now, then 💾 Save again';
    const x = await unrecorded(null, true); const { B, fold } = x;
    chk(name, sc, UNREC(true), unrec(x), UNRECW(true));
    const w0 = omWrites(fold); await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'the first 💾 Save asks: nothing written, the choice offered' + GUARD, J([omWrites(fold) - w0, asks(B.ev)]), J([0, true]));
    await B.ev('livePoll(false)'); await pause(5);
    chk(name, sc, '↻ Refresh now records nothing', based(B.ev), 0);
    await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'the second 💾 Save asks again: nothing written, F0 still the folder’s copy and kept as it was in the history, B-EDIT unsaved',
      J([omWrites(fold) - w0, fold.note(2027, 'A'), J(hist(fold)), B.ev('DIRTY'), asks(B.ev)]), J([0, 'F0', J([['F00', false]]), true, true]));
  }
  // (4) THE SECOND TAB, ONCE A WAITING SAVE IS COUNTED (U20): B's 💾 Save waits for tab A's save; the Live timer's tick 1
  // queues its autosave behind it and waits; tick 2 refreshes during the wait (nothing recorded, U20). Tab A's save lands:
  // B's Save asks, tick 1's autosave asks -- and tick 1's own refresh, running then with nothing under way, records nothing
  // either. The next 💾 Save asks. Before this change that last refresh took F0 as the base and the next Save wrote over it.
  { const sc = '(4) a second tab: the Save waits, the Live timer ticks twice';
    const LM = webLocks(sc); const x = await unrecorded(LM, false); const { B, fold } = x;
    const A = await open(LM, 'A', { html: F1, appn: 'FULL FUND' });
    seed(A.ev, { services: SVC, items: [mk('X', [300, 100, 50])], disc: [2000, 600, 300], mand: [500, 150, 80], order: ['X'] });
    A.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); setNote('X','FF-WORK'); 'ok'`);
    connect(A.ev, A.w, fold);
    chk(name, sc, UNREC(false), unrec(x), UNRECW(false));
    const m0 = LM.mark(); const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
    const pA = A.ev('saveInPlace()'); const okA = await until(() => (fold.hits.main || 0) > n0);
    const pB = B.ev('saveInPlace()'); const okB = await until(() => LM.pendingOf('orbit-save').includes('B'));
    live(B.ev); const t1 = B.ev('liveTick()'); await pause(5);
    chk(name, sc, 'tab A’s save holds the lock; B’s Save waits for it, and tick 1’s autosave waits behind that (a CONTROL)',
      J([okA, LM.heldBy('orbit-save'), okB && LM.pendingOf('orbit-save')]), J([true, ['A'], ['B']]));
    chk(name, sc, 'B counts both as under way (U20): its Save and the autosave queued behind it', B.ev('_saveBusy'), 2);
    await B.ev('liveTick()'); await pause(5);
    chk(name, sc, 'tick 2’s refresh during the wait records nothing', based(B.ev), 0);
    const w0 = omWrites(fold);
    g.open(); await pA; await pB; await t1; await pause(5);
    chk(name, sc, 'once A’s save lands: B’s Save and tick 1’s autosave asked; nothing written; and tick 1’s own refresh, nothing under way, recorded nothing',
      J([omWrites(fold) - w0, fold.note(2027, 'A'), asks(B.ev), B.ev('_saveBusy'), based(B.ev)]), J([0, 'F0', true, 0, 0]));
    await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'the next 💾 Save asks: nothing written, F0 still the folder’s copy, B-EDIT on screen', J([omWrites(fold) - w0, fold.note(2027, 'A'), scr(B.ev), asks(B.ev)]), J([0, 'F0', 'B-EDIT', true]));
    chk(name, sc, 'the lock was granted as asked and never held by two -- [grant order from tab A’s save, violations, most held at once, unmodelled, every grant let go, held now]' + GUARD,
      J([LM.grantOrder('orbit-save', m0), LM.stats.violations.length, LM.stats.maxHeld['orbit-save'], LM.stats.unmodeled.length, LM.stats.grants === LM.stats.releases, LM.heldBy('orbit-save')]),
      J([['A', 'B', 'B', 'B'], 0, 1, 0, true, []]));
  }
  // (5) CONTROLS. (5a) The screen exactly the folder's copy, nothing recorded (a browser that last saved to the folder before
  // v1.89, when no record was kept: Alice's other browser's storage, its record removed): the opening's own connect takes F0
  // as the base, as it always did; L-EDIT typed then; 💾 Save writes it with no question, F0 kept in the history. (5b) The
  // same, but the refresh comes while a save waits at its read of the folder: U13's rule holds -- nothing recorded, nothing
  // said -- and the save asks. (5c) The first save of a new board into an empty folder writes with no question, and records
  // it. (5d) An ordinary refresh with nothing unsaved loads a newer folder copy and records it; then a Save writes with no
  // question. (5e) With a copy recorded and a later one saved over it, Save asks in the words it always used.
  const legacy = async () => { const fold = folder(); const X = await other(fold, ['F0']); const ls = lsOf(X.ev); delete ls[X.ev('_AP.key') + '.base'];
    const B = await open(null, 'B', { html: F1, ls }); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`); return { B, fold }; };
  const LEGACY = 'F0 on screen, stamped as the folder’s copy is; nothing recorded; nothing changed in this session (a CONTROL)';
  const legacyv = (B, fold) => J([scr(B.ev), +B.ev('MS.ts') === headTs(fold), based(B.ev), B.ev('DIRTY')]);
  { const sc = '(5a) CONTROL: the screen exactly the folder’s copy, nothing recorded';
    const { B, fold } = await legacy();
    chk(name, sc, LEGACY, legacyv(B, fold), J(['F0', true, 0, false]));
    await B.ev('driveAutoConnect()'); await pause(5);
    chk(name, sc, 'the opening’s own connect takes F0 as the copy the work came from', based(B.ev) === headTs(fold) && headTs(fold) > 0, true);
    B.ev(`setNote('A','L-EDIT'); 'ok'`); await pause(5); const q0 = qs(B.ev).length; await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'L-EDIT typed; 💾 Save writes it with no question: the folder’s copy, saved, recorded against it; F0 in the folder’s history',
      J([qs(B.ev).length - q0, fold.note(2027, 'A'), unsaved(B.ev), based(B.ev) === headTs(fold), anywhere(fold, 'F0')]), J([0, 'L-EDIT', [false, false, false], true, true]));
  }
  { const sc = '(5b) CONTROL: the screen exactly the folder’s copy, nothing recorded; a refresh while a save waits at its read';
    const { B, fold } = await legacy();
    chk(name, sc, LEGACY, legacyv(B, fold), J(['F0', true, 0, false]));
    const gh = fold.dir.getFileHandle, g = gate(); let hit = 0;
    fold.dir.getFileHandle = async (n, o) => { if (!hit && n === 'spmt-2027-om.json' && !(o && o.create)) { hit = 1; await g.p; } return gh(n, o); };
    const p = B.ev('saveInPlace()'); const reached = await until(() => hit);
    const s0 = state(B.ev), st0 = status(B.ev); const r = await B.ev('driveStorePull(true)'); await pause(5);
    chk(name, sc, 'the refresh while the save waits at its read records nothing and says nothing -- [the save waits, a save under way, returned, nothing changed byte for byte, the status line as it was]',
      J([reached, B.ev('_saveBusy') > 0, r, state(B.ev) === s0, status(B.ev) === st0]), J([true, true, false, true, true]));
    const w0 = omWrites(fold); g.open(); await p; await pause(5);
    chk(name, sc, 'then the save, finding nothing recorded, asks: nothing written, F0 still the folder’s copy, the choice offered',
      J([omWrites(fold) - w0, fold.note(2027, 'A'), asks(B.ev)]), J([0, 'F0', true]));
  }
  { const sc = '(5c) CONTROL: the first save of a new board into an empty folder';
    const fold = folder(); const B = await open(null, 'B'); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    const c = await B.ev('driveAutoConnect()'); await pause(5);
    B.ev(`setNote('A','FIRST'); 'ok'`); await pause(5); const q0 = qs(B.ev).length; await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'the opening connected to an empty folder; 💾 Save writes FIRST with no question: the folder’s copy, saved, recorded against it',
      J([c, qs(B.ev).length - q0, fold.note(2027, 'A'), unsaved(B.ev), based(B.ev) === headTs(fold) && headTs(fold) > 0]), J([true, 0, 'FIRST', [false, false, false], true]));
    B.ev(`setNote('A','SECOND'); 'ok'`); await pause(5); await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'and the next 💾 Save writes SECOND with no question; FIRST in the folder’s history',
      J([qs(B.ev).length - q0, fold.note(2027, 'A'), anywhere(fold, 'FIRST')]), J([0, 'SECOND', true]));
  }
  { const sc = '(5d) CONTROL: an ordinary refresh with nothing unsaved';
    const fold = folder(); const B = await open(null, 'B'); connect(B.ev, B.w, fold);
    await other(fold, ['N']);
    chk(name, sc, 'N, saved by Alice’s other machine, newer than what is on screen; nothing unsaved, nothing recorded (a CONTROL)',
      J([fold.note(2027, 'A'), headTs(fold) > +B.ev('MS.ts'), B.ev('DIRTY'), based(B.ev)]), J(['N', true, false, 0]));
    const r = await B.ev('driveStorePull(true)'); await pause(5);
    chk(name, sc, 'the refresh loads N and records it; nothing kept aside', J([r, scr(B.ev), based(B.ev) === headTs(fold), B.ev(`localStorage.getItem(_AP.key+'.kept')`)]), J([true, 'N', true, null]));
    B.ev(`setNote('A','N-EDIT'); 'ok'`); await pause(5); const q0 = qs(B.ev).length; await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'N-EDIT typed; 💾 Save writes it with no question; N in the folder’s history', J([qs(B.ev).length - q0, fold.note(2027, 'A'), unsaved(B.ev), anywhere(fold, 'N')]), J([0, 'N-EDIT', [false, false, false], true]));
  }
  { const sc = '(5e) CONTROL: a copy recorded, and a later one saved over it by Alice’s other machine';
    const fold = folder(); const B = await open(null, 'B'); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    B.ev(`setNote('A','F0'); 'ok'`); await pause(5); await B.ev('saveInPlace()'); await pause(5);
    const f0 = based(B.ev); await other(fold, ['N']);
    B.ev(`setNote('A','B-EDIT'); 'ok'`); await pause(5);
    chk(name, sc, 'F0 saved and recorded; Alice’s other machine loaded it and saved N over it; B-EDIT typed after, unsaved (a CONTROL)',
      J([f0 > 0, based(B.ev) === f0, headTs(fold) > f0, fold.note(2027, 'A'), scr(B.ev), B.ev('DIRTY')]), J([true, true, true, 'N', 'B-EDIT', true]));
    const w0 = omWrites(fold); await B.ev('saveInPlace()'); await pause(5); const st = status(B.ev);
    chk(name, sc, '💾 Save asks, saying as before that theirs was saved after the copy the work came from -- [writes, the folder’s copy, the choice offered, after said, no record said]',
      J([omWrites(fold) - w0, fold.note(2027, 'A'), asks(B.ev), /^⛔ Alice saved O&M FY27 to the shared folder [^,]+, after the copy you are working from\. Nothing was written\. /.test(st), /no record/.test(st)]),
      J([0, 'N', true, true, false]));
  }
  // (6) A REOPEN WITH UNSAVED WORK, NO TIMER AND NO SECOND TAB: as (1), but the page is reopened first, so this session has
  // nothing unsaved (DIRTY false) and only this browser's record says so; the refresh is the opening's own connect, which
  // is not quiet. It used to take F0 as the copy B-EDIT came from, and the next Save wrote B-EDIT over it unasked; (6h), with
  // F00 kept minutes before, F0 was then kept only as a recent copy and the next Save removed it.
  for (const h0 of [false, true]) {
    const sc = '(6' + (h0 ? 'h' : '') + ') reopened with unsaved work: the opening’s own connect, then 💾 Save' + (h0 ? '; a history copy kept minutes before' : '');
    const x = await unrecorded(null, h0); const { fold } = x;
    chk(name, sc, UNREC(h0), unrec(x), UNRECW(h0));
    const C = await open(null, 'C', { html: F1, ls: lsOf(x.B.ev) }); connect(C.ev, C.w, fold); C.ev(`_liveCfg.folder='shared'; 'ok'`);
    await C.ev('driveAutoConnect()'); await pause(5);
    chk(name, sc, 'reopened: B-EDIT on screen, unsaved by this browser’s record, not by this session (a CONTROL) -- [on screen, DIRTY, the record]',
      J([scr(C.ev), C.ev('DIRTY'), unsaved(C.ev)[2]]), J(['B-EDIT', false, true]));
    chk(name, sc, 'the opening’s own connect records nothing', based(C.ev), 0);
    const w0 = omWrites(fold), q0 = qs(C.ev).length; await C.ev('saveInPlace()'); await pause(5);
    chk(name, sc, '💾 Save asks: nothing written, nothing asked in a dialog, F0 still the folder’s copy, the choice offered in the words for nothing recorded',
      J([omWrites(fold) - w0, qs(C.ev).length - q0, fold.note(2027, 'A'), asks(C.ev), UNSAID.test(status(C.ev))]), J([0, 0, 'F0', true, true]));
    await chooseMine(C, fold, sc, h0);
  }
  // (7) A BOARD SAVED TO ITS OWN FILE, SO NOTHING IS UNSAVED, THAT IS NOT THE FOLDER'S COPY: Alice's other machine saved F00
  // and F0 to the shared folder; B-EDIT was then typed and saved to the board file; the board then works out of the folder
  // and ↻ Refresh now finds F0, older than the screen. F0 was never on screen: it used to be taken as the copy B-EDIT came
  // from, and the next Save wrote B-EDIT over it unasked, F0 kept only as a recent copy.
  { const sc = '(7) a board saved to its own file, not the folder’s copy: ↻ Refresh now, then 💾 Save';
    const fold = folder(); await other(fold, ['F00', 'F0']);
    const B = await open(null, 'B'); const dk = W1H.disk(B.w, F1);
    B.ev(`setNote('A','B-EDIT'); 'ok'`); await pause(5); await B.ev('saveInPlaceFile()'); await pause(5);
    connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    chk(name, sc, 'B-EDIT saved to the board file, nothing unsaved; F0 the folder’s copy, older than the screen; F00 a spaced copy; nothing recorded (a CONTROL)',
      J([dk.writes, unsaved(B.ev), scr(B.ev), fold.note(2027, 'A'), headTs(fold) < +B.ev('MS.ts'), hist(fold), based(B.ev)]),
      J([1, [false, false, false], 'B-EDIT', 'F0', true, [['F00', false]], 0]));
    await B.ev('livePoll(false)'); await pause(5);
    chk(name, sc, '↻ Refresh now records nothing', based(B.ev), 0);
    const w0 = omWrites(fold); await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, '💾 Save asks: nothing written, F0 still the folder’s copy, the choice offered', J([omWrites(fold) - w0, fold.note(2027, 'A'), asks(B.ev)]), J([0, 'F0', true]));
    await chooseMine(B, fold, sc, true);
  }
  // (8) A BOARD FILE HANDED OVER, NEWER THAN THE FOLDER'S COPY. Alice's other machine saved F0 to the folder; a board file was
  // built after it and handed over. B opens that file in a browser with nothing recorded; the opening's own connect finds F0,
  // older than the screen, and records nothing (it is not what is on screen). B types B-EDIT: 💾 Save asks; B loads theirs
  // (B-EDIT kept aside), then ↶ Put back. The put-back line used to say Alice saved the folder's copy "after it" -- F0 was
  // saved before the file the work came from, and nothing recorded can tell either way; now it says so. (8c) CONTROL: with a
  // copy recorded (F0 saved by B, N saved over it by Alice's other machine), it says "saved after it", as it always did; and
  // (8d) CONTROL: work kept aside from a board file is put back with the words it always had, whatever the folder's record.
  // (9) The same as (8), with other work already kept aside: Load theirs is refused. It used to call F0 "a newer copy";
  // now "a copy", and "their copy was not loaded". (9c) CONTROL: with a copy recorded, "a newer copy", as it always did.
  const PUT_UNREC = /^↶ Put back the work kept aside on .+?\. 💾 Save will ask before it writes over the shared folder, which Alice saved; this browser has no record of which copy there, if any, this work came from\.$/;
  const PUT_REC = /^↶ Put back the work kept aside on .+?\. 💾 Save will ask before it writes over the shared folder, which Alice saved after it\.$/;
  const PUT_FILE = /^↶ Put back the work kept aside on .+?\. 💾 Save will ask before it writes over the saved file, which Bob saved after it\. What was on screen is kept aside in its place: put that back\.$/;
  const OCC = (a, b) => new RegExp('^⚠ Alice saved ' + a + ' to the shared folder \\(.+?\\), but this browser already keeps earlier work aside \\(kept .+?\\) and holds new work besides\\. '
    + 'Kept work is never replaced, so ' + b + ' copy was not loaded and nothing was lost\\. Deal with the kept work first: put it back · save it as a file · discard it\\.$');
  const OCC_UNREC = OCC('a copy', 'their'), OCC_REC = OCC('a newer copy', 'the newer');
  const keptA = ev => ev(`(function(){ var k=keptCopy(); if(!k) return '(none)'; try{ var s=JSON.parse(k.raw); return String(((s.years||{})['2027']||{}).notes.A||''); }catch(e){ return '?'; } })()`);
  const keepOther = ev => ev(`(function(){ var o=JSON.parse(JSON.stringify(MS)); o.years['2027'].notes.A='OLDER-KEPT'; return keepAside(o, {why:'file', by:'Bob', ts:1}, baseGet()); })()`);
  const handed = async () => { const fold = folder(); await other(fold, ['F0']); await pause(20);
    const FN = baseFile('Alice', KEY.alice);
    const B = await open(null, 'B', { html: FN }); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    const c = await B.ev('driveAutoConnect()'); await pause(5);
    const tF0 = headTs(fold), tN = +B.ev('MS.ts');
    B.ev(`setNote('A','B-EDIT'); 'ok'`); await pause(5);
    return { B, fold, c, tF0, tN }; };
  const HANDED = 'connected; F0 the folder’s copy, saved before the file B opened was stamped; B-EDIT on screen; nothing kept aside (a CONTROL)';
  const handedv = x => J([x.c, x.fold.note(2027, 'A'), x.tF0 > 0 && x.tF0 < x.tN, scr(x.B.ev), keptA(x.B.ev)]);
  const HANDEDW = J([true, 'F0', true, 'B-EDIT', '(none)']);
  const recorded = async () => { const fold = folder(); const B = await open(null, 'B'); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    B.ev(`setNote('A','F0'); 'ok'`); await pause(5); await B.ev('saveInPlace()'); await pause(5);
    const f0 = based(B.ev); await other(fold, ['N']);
    B.ev(`setNote('A','B-EDIT'); 'ok'`); await pause(5); return { B, fold, f0 }; };
  const RECORDED = 'F0 saved and recorded; Alice’s other machine saved N over it; B-EDIT typed after, unsaved (a CONTROL)';
  const recordedv = x => J([x.f0 > 0, based(x.B.ev) === x.f0, headTs(x.fold) > x.f0, x.fold.note(2027, 'A'), scr(x.B.ev), x.B.ev('DIRTY')]);
  const RECORDEDW = J([true, true, true, 'N', 'B-EDIT', true]);
  { const sc = '(8) a board file handed over, newer than the folder’s copy: 💾 Save; Load theirs; ↶ Put back';
    const x = await handed(); const { B, fold } = x;
    chk(name, sc, HANDED, handedv(x), HANDEDW);
    chk(name, sc, 'the opening’s own connect records nothing (the file is not the folder’s copy)', based(B.ev), 0);
    const w0 = omWrites(fold), q0 = qs(B.ev).length; await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, '💾 Save asks: nothing written, nothing asked in a dialog, F0 still the folder’s copy, the choice offered in the words for nothing recorded',
      J([omWrites(fold) - w0, qs(B.ev).length - q0, fold.note(2027, 'A'), asks(B.ev), UNSAID.test(status(B.ev))]), J([0, 0, 'F0', true, true]));
    await B.ev(`driveResolve('theirs')`); await pause(5);
    chk(name, sc, 'Load theirs: F0 on screen, B-EDIT kept aside', J([scr(B.ev), keptA(B.ev)]), J(['F0', 'B-EDIT']));
    const q1 = qs(B.ev).length; B.ev('keptPutBack()'); await pause(5); const said = status(B.ev);
    chk(name, sc, '↶ Put back, asked: B-EDIT on screen, nothing kept, nothing recorded -- [questions, on screen, kept, recorded]',
      J([qs(B.ev).length - q1, scr(B.ev), keptA(B.ev), based(B.ev)]), J([1, 'B-EDIT', '(none)', 0]));
    chk(name, sc, 'and it says Alice saved the folder’s copy, with no record of which copy the work came from -- never that she saved it after -- [the words, “saved after it” said]',
      J([PUT_UNREC.test(said), /saved after it/.test(said)]), J([true, false]));
    const w1 = omWrites(fold); await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'then 💾 Save asks again: nothing written; F0 the folder’s copy, B-EDIT on screen',
      J([omWrites(fold) - w1, asks(B.ev), fold.note(2027, 'A'), scr(B.ev)]), J([0, true, 'F0', 'B-EDIT']));
  }
  { const sc = '(8c) CONTROL: a copy recorded: 💾 Save; Load theirs; ↶ Put back';
    const x = await recorded(); const { B, fold } = x;
    chk(name, sc, RECORDED, recordedv(x), RECORDEDW);
    await B.ev('saveInPlace()'); await pause(5); await B.ev(`driveResolve('theirs')`); await pause(5);
    chk(name, sc, '💾 Save asked; Load theirs: N on screen, B-EDIT kept aside', J([scr(B.ev), keptA(B.ev)]), J(['N', 'B-EDIT']));
    B.ev('keptPutBack()'); await pause(5); const said = status(B.ev);
    chk(name, sc, '↶ Put back: B-EDIT on screen, recorded against F0 again; it says Alice saved the folder’s copy after it -- [on screen, recorded, the words]',
      J([scr(B.ev), based(B.ev) === x.f0, PUT_REC.test(said)]), J(['B-EDIT', true, true]));
  }
  { const sc = '(8d) CONTROL: work kept aside from a board file, nothing recorded for the folder: ↶ Put back';
    const fold = folder(); const B = await open(null, 'B'); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    B.ev(`setNote('A','B-EDIT'); 'ok'`); await pause(5); keepOther(B.ev);
    chk(name, sc, 'OLDER-KEPT kept aside from a board file Bob saved; B-EDIT on screen, unsaved; nothing recorded for the folder (a CONTROL)',
      J([keptA(B.ev), scr(B.ev), B.ev('DIRTY'), based(B.ev)]), J(['OLDER-KEPT', 'B-EDIT', true, 0]));
    B.ev('keptPutBack()'); await pause(5); const said = status(B.ev);
    chk(name, sc, '↶ Put back: OLDER-KEPT on screen, B-EDIT kept in its place; it says Bob saved the board file after it, as it always did -- [on screen, kept, the words]',
      J([scr(B.ev), keptA(B.ev), PUT_FILE.test(said)]), J(['OLDER-KEPT', 'B-EDIT', true]));
  }
  { const sc = '(9) the same, with other work already kept aside: Load theirs is refused';
    const x = await handed(); const { B, fold } = x;
    chk(name, sc, HANDED, handedv(x), HANDEDW);
    keepOther(B.ev); await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'other work kept aside; 💾 Save asks, nothing written -- [kept, asked, the folder’s copy]', J([keptA(B.ev), asks(B.ev), fold.note(2027, 'A')]), J(['OLDER-KEPT', true, 'F0']));
    await B.ev(`driveResolve('theirs')`); await pause(5); const said = status(B.ev);
    chk(name, sc, 'Load theirs refused: B-EDIT on screen, OLDER-KEPT still kept, F0 the folder’s copy', J([scr(B.ev), keptA(B.ev), fold.note(2027, 'A')]), J(['B-EDIT', 'OLDER-KEPT', 'F0']));
    chk(name, sc, 'and it calls F0 “a copy”, not “a newer copy” -- it was saved before the file the work came from -- [the words, “newer” said]',
      J([OCC_UNREC.test(said), /newer/.test(said)]), J([true, false]));
  }
  { const sc = '(9c) CONTROL: a copy recorded, other work already kept aside: Load theirs is refused';
    const x = await recorded(); const { B, fold } = x;
    chk(name, sc, RECORDED, recordedv(x), RECORDEDW);
    keepOther(B.ev); await B.ev('saveInPlace()'); await pause(5); await B.ev(`driveResolve('theirs')`); await pause(5); const said = status(B.ev);
    chk(name, sc, 'Load theirs refused: B-EDIT on screen, OLDER-KEPT still kept, N the folder’s copy; it calls N “a newer copy”, as it always did -- [on screen, kept, the folder’s copy, the words]',
      J([scr(B.ev), keptA(B.ev), fold.note(2027, 'A'), OCC_REC.test(said)]), J(['B-EDIT', 'OLDER-KEPT', 'N', true]));
  }
  // (10) ANOTHER YEAR. B's FY27 is saved and recorded; Alice's other machine saves FY28 (A28), which B never loaded. B types in
  // FY27 (unsaved), switches to FY28 -- rolled forward from what is on screen, so not A28 -- and presses ↻ Refresh now: A28
  // is older than the screen, and nothing is recorded for FY28. It used to be taken as the copy FY28 came from, and 💾 Save
  // wrote B's FY28 over A28 without asking. Now nothing is recorded, and 💾 Save asks.
  { const sc = '(10) another year: FY28 saved by Alice’s other machine, never loaded here; ↻ Refresh now on FY28, then 💾 Save';
    const fold = folder(); const B = await open(null, 'B'); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    await B.ev('driveAutoConnect()'); await pause(5);
    B.ev(`setNote('A','B27'); 'ok'`); await pause(5); await B.ev('saveInPlace()'); await pause(5);
    const X = await open(null, 'X'); connect(X.ev, X.w, fold);
    X.ev(`switchYear(2028); setNote('A','A28'); 'ok'`); await pause(5); await X.ev('driveStorePush(false)'); await pause(5);
    B.ev(`setNote('A','B27-2'); 'ok'`); await pause(5); B.ev(`switchYear(2028); 'ok'`); await pause(5);
    const ts28 = () => { const j = fold.copy(2028); return j ? +((j.store && j.store.ts) || j.ts || 0) : 0; };
    const w28 = () => fold.log.filter(v => v === 'main:spmt-2028-om.json').length;
    chk(name, sc, 'FY27: B27 the folder’s copy and recorded; FY28: A28 the folder’s copy, older than B’s screen; B on FY28, not showing A28; nothing recorded for FY28 (a CONTROL)',
      J([fold.note(2027, 'A'), +B.ev('driveBaseOf(mySlug(), 2027)') === headTs(fold), fold.note(2028, 'A'), ts28() > 0 && ts28() < +B.ev('MS.ts'), +B.ev('MS.cur'), scr(B.ev) !== 'A28', based(B.ev)]),
      J(['B27', true, 'A28', true, 2028, true, 0]));
    await B.ev('livePoll(false)'); await pause(5);
    chk(name, sc, '↻ Refresh now on FY28 records nothing (A28 is not what is on screen)', based(B.ev), 0);
    const w0 = w28(), q0 = qs(B.ev).length; await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, '💾 Save on FY28 asks: nothing written to FY28, A28 still its copy, nothing asked in a dialog, the choice offered',
      J([w28() - w0, fold.note(2028, 'A'), qs(B.ev).length - q0, asks(B.ev)]), J([0, 'A28', 0, true]));
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (U30) ====
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
