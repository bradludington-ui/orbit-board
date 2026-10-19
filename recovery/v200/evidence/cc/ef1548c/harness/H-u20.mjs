// FOCUSED harness: VERBATIM from /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/ef1548c/after/tools/export-audit/audit-import.mjs -- imports, failure list, keepBoards, SEEN/chk, the selected blocks
// (suite lines 7800-8331), the top-level helpers they reference (closure: MINE, W1H, base, it, r2, settled), the guard. Not the full suite.
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

const settled = (ev) => { const m = JSON.parse(ev('JSON.stringify(MS)'));
  Object.keys(m.years || {}).forEach(y => { delete m.years[y].pmoOrder; });
  m.ts = 0;
  (m.log || []).forEach(e => { e.ts = 0; });
  (m.jrnl || []).forEach(e => { e.t = 0; });
  return JSON.stringify(m); };

const r2 = v => Math.round(v * 100) / 100;
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
// ==== v2.00 (U20): a save waiting for another tab's save is under way ====
// A save waits for the 'orbit-save' Web Lock, so that one save runs at a time across this browser's tabs. It was counted as
// under way (_saveBusy) only once it held the lock: while it waited for another tab's save it was no save at all to ↶ Put
// back (U2) and to the folder's refresh (U13). Put back went ahead under it, a refresh loaded a newer copy under it, and a
// refresh that took the folder's copy as the one the work came from (nothing recorded yet, that copy not newer than the
// screen) let the waiting save write over that copy without asking -- with a history copy kept less than ten minutes
// before, the copy written over was in no copy the board could reach after one more Save. A save is now counted from the
// moment it is asked for until it has finished, however it ends. jsdom has no Web Locks: webLocks() stands in for one
// browser's lock manager, shared by every tab of that browser (each tab is a board of its own), and is itself checked
// against the API's rules first, in the scenario after it.
//
// THE STAND-IN (the U20 probe's locks-mock.mjs, rec/L4/u20, whose own tests were checked against real Chromium tabs). It
// models request(name, callback) and request(name, options, callback); 'exclusive' (the default) and 'shared'; ifAvailable;
// one queue per name, first come first served (a request is granted only at the head of its queue); the callback run in a
// later task of the asking window, never inside request(); the lock held until the callback's result settles, then let
// go, and only then request()'s promise settled, made in the asking window; query(); a closing tab's requests dropped and
// its locks let go; and the argument errors the API defines. NOT modelled: steal and signal (refused and counted, never
// ignored -- the board uses neither), separate processes (every tab here shares one event loop), workers and storage
// partitioning. At every grant it checks that no two holders of a name are held where either is exclusive.
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
// THE STAND-IN'S OWN TESTS (the probe's locktest.mjs, T1-T10, 19 checks), in bare windows sharing one manager. Every
// expected value is written by hand; every wait has a deadline.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v2.00 (U20) — the Web Locks stand-in behaves as the API does';
  const wins = [];
  try {
  const J = JSON.stringify, tick = () => new Promise(r => setImmediate(r));
  const until = async (cond, ms = 5000) => { const end = Date.now() + ms; while (Date.now() < end) { if (cond()) return true; await tick(); } return !!cond(); };
  const within = (p, ms = 5000) => Promise.race([p.then(v => ({ ok: true, v }), e => ({ ok: false, e: String(e) })), new Promise(r => setTimeout(() => r({ timedOut: true }), ms))]);
  const gate = () => { let res, rej; const p = new Promise((a, b) => { res = a; rej = b; }); return { p, open: v => res(v), fail: e => rej(e) }; };
  const win = () => { const w = new JSDOM('<!doctype html><p>tab', { url: 'https://example.invalid/board.html', runScripts: 'outside-only' }).window; wins.push(w); return w; };
  // T1 EXCLUSIVE, FIRST COME FIRST SERVED, ACROSS TABS: A holds; B, C and A again ask in that order; each is granted only
  // after the one before lets go, in the order asked; never two holders; the callback runs later, not inside request().
  {
    const M = webLocks('T1'); const [wa, wb, wc] = [win(), win(), win()]; M.install(wa, 'A'); M.install(wb, 'B'); M.install(wc, 'C');
    const order = []; const gs = { A: gate(), B: gate(), C: gate(), A2: gate() }; let inside = 0, maxInside = 0;
    const cb = tag => () => { order.push(tag); inside++; maxInside = Math.max(maxInside, inside); return gs[tag].p.then(v => { inside--; return tag + ':' + v; }); };
    const pA = wa.navigator.locks.request('orbit-save', { mode: 'exclusive' }, cb('A'));
    const syncCall = order.length > 0;
    const pB = wb.navigator.locks.request('orbit-save', { mode: 'exclusive' }, cb('B'));
    const pC = wc.navigator.locks.request('orbit-save', { mode: 'exclusive' }, cb('C'));
    const pA2 = wa.navigator.locks.request('orbit-save', cb('A2'));             // the two-argument form: exclusive by default
    await until(() => order.length >= 1);
    const s1 = [order.slice(), M.heldBy('orbit-save'), M.pendingOf('orbit-save')];
    for (let i = 0; i < 50; i++) await tick();
    const s2 = [order.slice(), M.heldBy('orbit-save')];                        // still only A, however long A holds it
    gs.A.open(1); const rA = await pA;
    await until(() => order.length >= 2); const s3 = [order.slice(), M.heldBy('orbit-save'), M.pendingOf('orbit-save')];
    gs.B.open(2); gs.C.open(3); gs.A2.open(4);
    const all = await Promise.all([pB, pC, pA2]);
    chk(name, 'T1', 'the callback is not called inside request()', J(syncCall), J(false));
    chk(name, 'T1', 'first: A runs and holds; B, C, A pending in order', J(s1), J([['A'], ['A'], ['B', 'C', 'A']]));
    chk(name, 'T1', 'B does not run while A holds (50 turns)', J(s2), J([['A'], ['A']]));
    chk(name, 'T1', 'A resolves with its callback’s value', J(rA), J('A:1'));
    chk(name, 'T1', 'once A lets go: B runs and holds; C, A pending', J(s3), J([['A', 'B'], ['B'], ['C', 'A']]));
    chk(name, 'T1', 'grant order and results', J([order, all]), J([['A', 'B', 'C', 'A2'], ['B:2', 'C:3', 'A2:4']]));
    chk(name, 'T1', 'never two inside; no violation; most held at once', J([maxInside, M.stats.violations.length, M.stats.maxHeld['orbit-save']]), J([1, 0, 1]));
    chk(name, 'T1', 'the promise is made in the asking window', J(pA instanceof wa.Promise && pB instanceof wb.Promise), J(true));
  }
  // T2 LET GO ON A REJECTED PROMISE AND ON A THROW; T3 A PLAIN VALUE.
  {
    const M = webLocks('T2'); const [wa, wb] = [win(), win()]; M.install(wa, 'A'); M.install(wb, 'B');
    const p1 = wa.navigator.locks.request('L', () => Promise.reject(new Error('rejected')));
    const p2 = wb.navigator.locks.request('L', () => { throw new Error('thrown'); });
    const p3 = wa.navigator.locks.request('L', () => 7);
    const r = [];
    for (const p of [p1, p2, p3]) { try { r.push(['ok', await p]); } catch (e) { r.push(['err', e.message]); } }
    chk(name, 'T2', 'a rejection and a throw reject request(); a value resolves it; each lets go', J([r, M.heldBy('L'), M.stats.releases]), J([[['err', 'rejected'], ['err', 'thrown'], ['ok', 7]], [], 3]));
  }
  // T4 THE LOCK IS LET GO BEFORE request() SETTLES: the next waiter is granted before the first's promise is seen settled.
  {
    const M = webLocks('T4'); const [wa, wb] = [win(), win()]; M.install(wa, 'A'); M.install(wb, 'B');
    const seen = [];
    const pA = wa.navigator.locks.request('L', () => Promise.resolve('a'));
    pA.then(() => seen.push('A settled, held by ' + J(M.heldBy('L'))));
    const pB = wb.navigator.locks.request('L', () => { seen.push('B invoked'); return 'b'; });
    await pA; await pB;
    chk(name, 'T4', 'A’s promise settles after it lets go (B already granted then)', J(seen[0]), J('A settled, held by ["B"]'));
  }
  // T5 NAMES ARE INDEPENDENT.
  {
    const M = webLocks('T5'); const [wa, wb] = [win(), win()]; M.install(wa, 'A'); M.install(wb, 'B');
    const g = gate(); let both = false;
    const pA = wa.navigator.locks.request('L', () => g.p);
    const pB = wb.navigator.locks.request('M', () => { both = M.heldBy('L').length === 1; return 1; });
    await pB; g.open(); await pA;
    chk(name, 'T5', 'M is granted while L is held', J(both), J(true));
  }
  // T6 ifAvailable: held -> callback(null) at once, nothing queued; free -> granted.
  {
    const M = webLocks('T6'); const [wa, wb] = [win(), win()]; M.install(wa, 'A'); M.install(wb, 'B');
    const g = gate();
    const pA = wa.navigator.locks.request('L', () => g.p);
    await until(() => M.heldBy('L').length === 1);
    const r1 = await wb.navigator.locks.request('L', { ifAvailable: true }, l => l === null ? 'null' : 'lock');
    const pend = M.pendingOf('L').length;
    g.open(); await pA;
    const r2 = await wb.navigator.locks.request('L', { ifAvailable: true }, l => l === null ? 'null' : l.name + '/' + l.mode);
    chk(name, 'T6', 'ifAvailable: [while held, queued, when free]', J([r1, pend, r2]), J(['null', 0, 'L/exclusive']));
  }
  // T7 SHARED: two shared at once; an exclusive queued behind them waits; a shared asked after that exclusive waits too.
  {
    const M = webLocks('T7'); const [wa, wb, wc] = [win(), win(), win()]; M.install(wa, 'A'); M.install(wb, 'B'); M.install(wc, 'C');
    const gA = gate(), gB = gate(), gX = gate(); const ran = [];
    const pA = wa.navigator.locks.request('L', { mode: 'shared' }, () => { ran.push('A'); return gA.p; });
    const pB = wb.navigator.locks.request('L', { mode: 'shared' }, () => { ran.push('B'); return gB.p; });
    const pX = wc.navigator.locks.request('L', { mode: 'exclusive' }, () => { ran.push('X'); return gX.p; });
    const pS = wa.navigator.locks.request('L', { mode: 'shared' }, () => { ran.push('S'); return 's'; });
    await until(() => ran.length >= 2); for (let i = 0; i < 30; i++) await tick();
    const s1 = [ran.slice(), M.heldBy('L'), M.pendingOf('L')];
    gA.open(); gB.open(); await until(() => ran.length >= 3); for (let i = 0; i < 30; i++) await tick();
    const s2 = [ran.slice(), M.heldBy('L')];
    gX.open(); await Promise.all([pA, pB, pX, pS]);
    chk(name, 'T7', 'shared A and B together; X, then S, wait', J(s1), J([['A', 'B'], ['A', 'B'], ['C', 'A']]));
    chk(name, 'T7', 'X alone; S still waits', J(s2), J([['A', 'B', 'X'], ['C']]));
    chk(name, 'T7', 'then S; no violation', J([ran, M.stats.violations.length]), J([['A', 'B', 'X', 'S'], 0]));
  }
  // T8 query() and a tab going away: it lets go of what it holds and its waiting requests are dropped.
  {
    const M = webLocks('T8'); const [wa, wb, wc] = [win(), win(), win()]; M.install(wa, 'A'); M.install(wb, 'B'); M.install(wc, 'C');
    const g = gate(); let cRan = false;
    wa.navigator.locks.request('L', () => g.p);
    wb.navigator.locks.request('L', () => 'b');
    const pC = wc.navigator.locks.request('L', () => { cRan = true; return 'c'; });
    await until(() => M.heldBy('L').length === 1);
    const qy = await wc.navigator.locks.query();
    M.closeClient('B'); M.closeClient('A');
    const rC = await pC;
    chk(name, 'T8', 'query: held by A; B and C pending', J([qy.held.map(x => x.clientId), qy.pending.map(x => x.clientId)]), J([['A'], ['B', 'C']]));
    chk(name, 'T8', 'once B and A close: C granted; one dropped', J([rC, cRan, M.stats.dropped]), J(['c', true, 1]));
  }
  // T9 WHAT IS NOT MODELLED IS REFUSED, NOT IGNORED; bad arguments reject.
  {
    const M = webLocks('T9'); const wa = win(); M.install(wa, 'A');
    const r = [];
    for (const [n, o, c] of [['L', { steal: true }, () => 1], ['L', { signal: {} }, () => 1], ['-L', {}, () => 1], ['L', {}, null], ['L', { mode: 'x' }, () => 1]]) {
      try { await wa.navigator.locks.request(n, o, c); r.push('ok'); } catch (e) { r.push('rejected'); } }
    chk(name, 'T9', 'steal, signal, a name starting with -, no callback, a bad mode: each rejected; the unmodelled counted', J([r, M.stats.unmodeled.length]), J([['rejected', 'rejected', 'rejected', 'rejected', 'rejected'], 2]));
  }
  // T10 STRESS: 300 requests from three tabs on one name, random hold lengths (0-5 turns, seeded): granted in the order
  // asked, never two holders, every request settled.
  {
    const M = webLocks('T10'); const ws = [win(), win(), win()]; ws.forEach((w, i) => M.install(w, 'T' + i));
    let s = 12345; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    const asked = [], ran = []; let inside = 0, maxInside = 0; const ps = [];
    for (let i = 0; i < 300; i++) {
      const w = ws[Math.floor(rnd() * 3)], hold = Math.floor(rnd() * 6);
      asked.push(i);
      ps.push(w.navigator.locks.request('orbit-save', { mode: 'exclusive' }, async () => { inside++; maxInside = Math.max(maxInside, inside); ran.push(i);
        for (let k = 0; k < hold; k++) await tick(); inside--; return i; }));
      if (rnd() < 0.3) await tick();
    }
    const done = await until(() => ran.length === 300 && M.heldBy('orbit-save').length === 0, 20000);
    const all = await within(Promise.allSettled(ps), 5000);
    const settled = all.ok ? all.v.filter(x => x.status === 'fulfilled').length : 'not settled';
    chk(name, 'T10', '[finished, granted in the order asked, most inside at once, violations, settled]', J([done, J(ran) === J(asked), maxInside, M.stats.violations.length, settled]), J([true, true, 1, 0, 300]));
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  wins.forEach(w => { try { w.close(); } catch (e) {} });
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// THE BOARD: Alice's browser, O&M FY27 in tab B, FULL FUND in tab A -- one lock manager between them, each tab a board of its
// own (its own storage: A's keys and its folder copy are FULL FUND's, apart from B's). A's 💾 Save is held at the close of its
// write of FULL FUND's folder copy, so it holds 'orbit-save'; B's 💾 Save, asked then, waits for it. Alice's other machine (X,
// another browser, so not this lock) writes the folder copies the cases need. Save and ↶ Put back are the board's own
// saveInPlace() and keptPutBack() -- what the toolbar's 💾 and the top bar's ↶ work kept aside call. Every expected value is
// written by hand.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v2.00 (U20) — a save waiting for another tab’s save is under way';
  try {
  const { J, mk, SVC, wire, KEY, status, qs, baseFile, folder, connect, gate, until, pause, lsOf } = W1H;
  const F1 = baseFile('Alice', KEY.alice);
  const scr = ev => ev(`String(S.notes.A||'')`);
  const keptRaw = ev => ev(`localStorage.getItem(_AP.key+'.kept')`);
  const keptNote = ev => { const s = keptRaw(ev); if (s == null) return null;
    try { const st = JSON.parse(s.slice(s.indexOf('\n') + 1)); return String(((st.years || {})[st.cur] || { notes: {} }).notes.A || ''); } catch (e) { return '(unreadable)'; } };
  const unsaved = ev => JSON.parse(ev('JSON.stringify([DIRTY, _baseDirty, !!baseGet().dirty])'));
  const based = ev => +ev('driveBaseOf(mySlug())');
  const headTs = fold => { const j = fold.copy(2027); return j ? +((j.store && j.store.ts) || j.ts || 0) : 0; };
  // The folder's history for O&M FY27, oldest first: [requirement A's note, kept as a recent copy].
  const hist = fold => { const h = (fold.root.dirs.history || { files: {} }).files;
    return Object.keys(h).filter(n => /^spmt-2027-om-/.test(n)).sort().map(n => { let v = '?'; try { v = String(JSON.parse(h[n]).store.years['2027'].notes.A || ''); } catch (e) {} return [v, /-recent\.json$/.test(n)]; }); };
  const spaced = (fold, v) => hist(fold).some(([n, r]) => n === v && !r);
  const omWrites = fold => fold.log.filter(x => x === 'main:spmt-2027-om.json').length;   // writes of O&M's folder copy
  const asks = ev => /Nothing was written/.test(status(ev)) && /Load theirs/.test(status(ev)) && /Save yours over theirs/.test(status(ev));
  // EVERYTHING A REFUSED STEP LEAVES AS IT WAS, byte for byte (as the U13 block reads it).
  const state = ev => ev(`JSON.stringify([JSON.stringify(MS), DIRTY, _baseDirty, JSON.stringify(_driveBase), localStorage.getItem(_AP.key+'.base'), _saveGen, localStorage.getItem(_AP.key+'.kept'), localStorage.getItem(_AP.key)])`);
  const SAID = '⏳ The shared folder’s copy of O&M FY27 was not loaded: a save or Load theirs was under way, so this board kept its own copy of O&M FY27. '
    + 'The folder’s copy is checked again on the next refresh once that has finished (📡 Live view → ↻ Refresh now, or on its own while Live view is on).';
  // A TAB of Alice's browser (`LM` its lock manager), or a board of another browser (no LM).
  const open = async (LM, client, opts) => { const T = boot(opts || { html: F1 }); await pause(80);
    if (LM) LM.install(T.w, client); wire(T.ev, 'Alice', KEY.alice); return T; };
  // ALICE'S OTHER MACHINE saves `note` to the folder: it loads the folder's copy first (if any), types, saves.
  const other = async (fold, notes) => { const X = await open(null, 'X'); connect(X.ev, X.w, fold);
    for (const n of notes) { await X.ev('driveStorePull(false)'); X.ev(`setNote('A',${J(n)}); 'ok'`); await pause(5); await X.ev('driveStorePush(false)'); await pause(5); }
    return X; };
  // TAB A: FULL FUND, with one requirement typed; its 💾 Save held at the close of its write, holding 'orbit-save'.
  const tabA = async (LM, fold) => { const A = await open(LM, 'A', { html: F1, appn: 'FULL FUND' });
    seed(A.ev, { services: SVC, items: [mk('X', [300, 100, 50])], disc: [2000, 600, 300], mand: [500, 150, 80], order: ['X'] });
    A.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); setNote('X','FF-WORK'); 'ok'`);
    connect(A.ev, A.w, fold); return A; };
  const holdA = async (A, LM, fold) => { const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
    const p = A.ev('saveInPlace()'); const ok = await until(() => (fold.hits.main || 0) > n0);
    return { g, p, ok, slug: A.ev('mySlug()'), held: LM.heldBy('orbit-save') }; };
  // B's 💾 Save asked while A holds the lock: it waits for it.
  const waitB = async (B, LM, how) => { const p = B.ev(how || 'saveInPlace()'); const ok = await until(() => LM.pendingOf('orbit-save').includes('B')); return { p, ok }; };
  const WAITS = 'tab A’s save holds the lock and B’s Save waits for it -- [A held at its write, A’s appropriation, the lock held by, waiting] (a CONTROL)';
  const waits = (h, LM, w) => J([h.ok, h.slug, h.held, w.ok ? LM.pendingOf('orbit-save') : 'not waiting']);
  const WAITW = J([true, 'ff', ['A'], ['B']]);
  const COUNTED = 'B counts its waiting Save as under way (_saveBusy 1)';
  // THE STAND-IN, at the end of each case: the lock granted in the order asked, never to two at once, nothing asked of it
  // that it does not model, and every lock let go.
  // A GUARD passes on the board before this change too: it holds the stand-in, or how a save ends, to what it must be, so
  // that a wrong form of the change is caught. Every other check that is not a CONTROL fails on the board before it.
  const GUARD = ' (a GUARD: it passes before this change too)';
  const SANE = 'the lock was granted as asked and never held by two -- [grant order from the case’s first save, violations, most held at once, unmodelled, every grant let go, held now, waiting now]' + GUARD;
  const sane = (LM, m0) => J([LM.grantOrder('orbit-save', m0), LM.stats.violations.length, LM.stats.maxHeld['orbit-save'] || 0, LM.stats.unmodeled.length, LM.stats.grants === LM.stats.releases, LM.heldBy('orbit-save'), LM.pendingOf('orbit-save')]);
  const SANEW = order => J([order, 0, 1, 0, true, [], []]);
  // THE PUT-BACK FIXTURE (the U2 block's, in tab B). Alice saves F0 and types K, unsaved; her other machine saves N; her 💾 Save
  // is refused (N was saved after the copy K came from) and she loads theirs: K kept aside, N on screen. She types S1.
  const putBackFixture = async LM => { const fold = folder(); const B = await open(LM, 'B'); connect(B.ev, B.w, fold);
    B.ev(`setNote('A','F0'); 'ok'`); await pause(5); await B.ev('driveStorePush(false)'); await pause(5);
    B.ev(`setNote('A','K'); 'ok'`); await pause(5);
    await other(fold, ['N']);
    await B.ev('saveInPlace()'); await B.ev(`driveResolve('theirs')`); await pause(5);
    B.ev(`setNote('A','S1'); 'ok'`); await pause(5);
    return { B, fold }; };
  // ↶ Put back pressed now: [refused (what is on screen and the kept work byte for byte as they were), questions asked, on
  // screen, said that a save was under way].
  const putBack = B => { const ms = B.ev('JSON.stringify(MS)'), kr = keptRaw(B.ev), q0 = qs(B.ev).length;
    B.ev('keptPutBack()'); const st = status(B.ev);
    return [B.ev('JSON.stringify(MS)') === ms && keptRaw(B.ev) === kr, qs(B.ev).length - q0, scr(B.ev), /Not put back/.test(st) && /a save was under way/.test(st)]; };
  // NOTHING RECORDED, THE PRODUCT'S OWN WAY: tab B opens and its opening's own connect finds no O&M copy in the folder, so
  // nothing is recorded; then Alice's other machine saves F0 (F00 first, a moment before, with `h`: a spaced history copy
  // kept minutes before the next); then B-EDIT is typed in B, unsaved -- so the folder's copy is not newer than the screen.
  const unrecorded = async (LM, h) => { const fold = folder(); const B = await open(LM, 'B'); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    const c = await B.ev('driveAutoConnect()'); await pause(5);
    await other(fold, h ? ['F00', 'F0'] : ['F0']);
    B.ev(`setNote('A','B-EDIT'); 'ok'`); await pause(5);
    return { B, fold, c }; };
  const UNREC = h => 'the opening connected and recorded nothing (the folder held no O&M copy); Alice’s other machine then saved F0'
    + (h ? ' (F00 a moment before, now a spaced copy in the folder’s history)' : '') + '; B-EDIT typed after it, unsaved (a CONTROL)';
  const unrec = (x, h) => J([x.c, based(x.B.ev), scr(x.B.ev), x.B.ev('DIRTY'), x.fold.note(2027, 'A'), headTs(x.fold) < +x.B.ev('MS.ts'), hist(x.fold)]);
  const UNRECW = h => J([true, 0, 'B-EDIT', true, 'F0', true, h ? [['F00', false]] : []]);

  // (1) ↶ PUT BACK WHILE THE SAVE WAITS. B's Save is asked with S1 on screen and waits for tab A's save. ↶ Put back is
  // refused, as it is while a save runs (U2): putting K back now would let that save, landing, record S1's copy as the one
  // K came from. Once A's save lands, B's save runs and writes S1; then ↶ Put back works.
  { const sc = '(1) ↶ Put back while the Save waits for another tab’s save';
    const LM = webLocks(sc); const { B, fold } = await putBackFixture(LM); const A = await tabA(LM, fold);
    chk(name, sc, 'S1 on screen, unsaved; K kept aside; N the folder’s copy (a CONTROL)',
      J([scr(B.ev), B.ev('DIRTY'), keptNote(B.ev), fold.note(2027, 'A')]), J(['S1', true, 'K', 'N']));
    const m0 = LM.mark(); const h = await holdA(A, LM, fold); const w = await waitB(B, LM);
    chk(name, sc, WAITS, waits(h, LM, w), WAITW);
    chk(name, sc, COUNTED, B.ev('_saveBusy'), 1);
    chk(name, sc, '↶ Put back while the Save waits is refused and says so -- [what is on screen and the kept work byte for byte as they were, questions, on screen, said]',
      J(putBack(B)), J([true, 0, 'S1', true]));
    h.g.open(); await h.p; await w.p; await pause(5);
    chk(name, sc, 'once tab A’s save lands, B’s Save runs: S1 on screen and the folder’s copy, saved; K still kept aside; nothing under way',
      J([scr(B.ev), fold.note(2027, 'A'), unsaved(B.ev), keptNote(B.ev), B.ev('_saveBusy')]), J(['S1', 'S1', [false, false, false], 'K', 0]));
    chk(name, sc, SANE, sane(LM, m0), SANEW(['A', 'B']));
    const q0 = qs(B.ev).length; B.ev('keptPutBack()');
    chk(name, sc, '↶ Put back now: one question; K on screen, unsaved; nothing kept in its place (S1 is saved)',
      J([qs(B.ev).length - q0, scr(B.ev), unsaved(B.ev), keptNote(B.ev)]), J([1, 'K', [true, true, true], null]));
  }
  // (2) A REFRESH WHILE THE SAVE WAITS DOES NOT LOAD A NEWER COPY. B reopens with WORKING unsaved (recorded against F0); its
  // Save waits; Alice's other machine saves N2 over F0; a refresh loads nothing, as during a save (U13), and says so. The
  // Save, run, finds N2 saved after the copy WORKING came from and asks. The next refresh is an ordinary one.
  { const sc = '(2) a refresh while the Save waits for another tab’s save';
    const LM = webLocks(sc), fold = folder();
    const B0 = await open(null, 'B0'); connect(B0.ev, B0.w, fold);
    B0.ev(`setNote('A','F0'); 'ok'`); await pause(5); await B0.ev('driveStorePush(false)'); await pause(5);
    B0.ev(`setNote('A','WORKING'); 'ok'`); await pause(5);
    const B = await open(LM, 'B', { html: F1, ls: lsOf(B0.ev) }); connect(B.ev, B.w, fold);
    const A = await tabA(LM, fold);
    chk(name, sc, 'reopened: WORKING on screen, unsaved by this browser’s record, recorded against F0, the folder’s copy (a CONTROL)',
      J([scr(B.ev), unsaved(B.ev)[2], based(B.ev) === headTs(fold), fold.note(2027, 'A')]), J(['WORKING', true, true, 'F0']));
    const m0 = LM.mark(); const h = await holdA(A, LM, fold); const w = await waitB(B, LM);
    chk(name, sc, WAITS, waits(h, LM, w), WAITW);
    chk(name, sc, COUNTED, B.ev('_saveBusy'), 1);
    await other(fold, ['N2']);
    chk(name, sc, 'Alice’s other machine saved N2 over F0: newer than what is on screen (a CONTROL)',
      J([fold.note(2027, 'A'), headTs(fold) > +B.ev('MS.ts')]), J(['N2', true]));
    const s0 = state(B.ev); const r = await B.ev('driveStorePull(false)'); await pause(5);
    chk(name, sc, 'the refresh while the Save waits loads nothing -- [returned, nothing changed byte for byte, said word for word]',
      J([r, state(B.ev) === s0, status(B.ev)]), J([false, true, SAID]));
    h.g.open(); await h.p; await w.p; await pause(5);
    chk(name, sc, 'then B’s Save runs and asks: nothing written, N2 still the folder’s copy; WORKING on screen, unsaved; the choice offered; nothing under way',
      J([fold.note(2027, 'A'), scr(B.ev), unsaved(B.ev)[2], asks(B.ev), B.ev('_saveBusy')]), J(['N2', 'WORKING', true, true, 0]));
    chk(name, sc, SANE, sane(LM, m0), SANEW(['A', 'B']));
    const r2 = await B.ev('driveStorePull(true)'); await pause(5);
    chk(name, sc, 'the next refresh is an ordinary one: N2 loaded, recorded against the folder’s copy; WORKING kept aside',
      J([r2, scr(B.ev), based(B.ev) === headTs(fold), keptNote(B.ev)]), J([true, 'N2', true, 'WORKING']));
  }
  // (3) NOTHING RECORDED; LIVE VIEW'S ↻ REFRESH NOW WHILE THE SAVE WAITS. The refresh does not take F0 as the one B-EDIT came
  // from (U13: not while a save is under way), so the Save, run, asks rather than writing B-EDIT over F0. Alice then chooses
  // Save yours over theirs: F0 is kept in the folder's history as a spaced copy, and stays there through one more Save. (3h):
  // a spaced history copy, F00, kept minutes before -- where F0, written over unasked, was kept only as a recent copy and
  // was gone after one more Save.
  for (const h0 of [false, true]) {
    const sc = '(3' + (h0 ? 'h' : '') + ') nothing recorded; ↻ Refresh now while the Save waits for another tab’s save' + (h0 ? '; a history copy kept minutes before' : '');
    const LM = webLocks(sc); const x = await unrecorded(LM, h0); const { B, fold } = x; const A = await tabA(LM, fold);
    chk(name, sc, UNREC(h0), unrec(x, h0), UNRECW(h0));
    const m0 = LM.mark(); const h = await holdA(A, LM, fold); const w = await waitB(B, LM);
    chk(name, sc, WAITS, waits(h, LM, w), WAITW);
    chk(name, sc, COUNTED, B.ev('_saveBusy'), 1);
    await B.ev('livePoll(false)'); await pause(5);
    chk(name, sc, 'Live view’s ↻ Refresh now while the Save waits records nothing: F0 is not taken as the copy B-EDIT came from', based(B.ev), 0);
    const w0 = omWrites(fold);
    h.g.open(); await h.p; await w.p; await pause(5);
    chk(name, sc, 'then B’s Save asks: nothing written, F0 still the folder’s copy; B-EDIT on screen, unsaved; the choice offered; nothing under way',
      J([omWrites(fold) - w0, fold.note(2027, 'A'), scr(B.ev), B.ev('DIRTY'), asks(B.ev), B.ev('_saveBusy')]), J([0, 'F0', 'B-EDIT', true, true, 0]));
    chk(name, sc, SANE, sane(LM, m0), SANEW(['A', 'B']));
    const q0 = qs(B.ev).length; await B.ev(`driveResolve('mine')`); await pause(5);
    chk(name, sc, '“Save yours over theirs”, asked and answered OK: B-EDIT the folder’s copy, saved; F0 kept in the folder’s history as a spaced copy' + (h0 ? '' : GUARD),
      J([qs(B.ev).length - q0, fold.note(2027, 'A'), unsaved(B.ev), spaced(fold, 'F0')]), J([1, 'B-EDIT', [false, false, false], true]));
    B.ev(`setNote('A','B-EDIT2'); 'ok'`); await pause(5); const q1 = qs(B.ev).length; await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'one more 💾 Save writes B-EDIT2 with no question; F0 still in the folder’s history as a spaced copy' + (h0 ? ', and F00' : GUARD),
      J([fold.note(2027, 'A'), qs(B.ev).length - q1, spaced(fold, 'F0'), h0 ? spaced(fold, 'F00') : null]), J(['B-EDIT2', 0, true, h0 ? true : null]));
  }
  // (4) THE SCREEN EXACTLY THE FOLDER'S COPY, NOTHING RECORDED (a browser that last saved to the folder before v1.89, when no
  // record was kept: Alice's other browser's storage, its record removed). Where a refresh would take F0 as the base, it does
  // not while B's Save waits, as while a save runs (U13); the Save, run, finds nothing recorded and asks.
  { const sc = '(4) the screen exactly the folder’s copy, nothing recorded; a refresh while the Save waits';
    const LM = webLocks(sc), fold = folder();
    const X = await other(fold, ['F0']); const ls = lsOf(X.ev); delete ls[X.ev('_AP.key') + '.base'];
    const B = await open(LM, 'B', { html: F1, ls }); connect(B.ev, B.w, fold); const A = await tabA(LM, fold);
    chk(name, sc, 'F0 on screen, stamped as the folder’s copy is; nothing recorded; nothing changed in this session (a CONTROL)',
      J([scr(B.ev), +B.ev('MS.ts') === headTs(fold), based(B.ev), B.ev('DIRTY')]), J(['F0', true, 0, false]));
    const m0 = LM.mark(); const h = await holdA(A, LM, fold); const w = await waitB(B, LM);
    chk(name, sc, WAITS, waits(h, LM, w), WAITW);
    chk(name, sc, COUNTED, B.ev('_saveBusy'), 1);
    const s0 = state(B.ev), st0 = status(B.ev); const r = await B.ev('driveStorePull(true)'); await pause(5);
    chk(name, sc, 'a refresh while the Save waits records nothing and says nothing -- [returned, nothing changed byte for byte, the status line as it was]',
      J([r, state(B.ev) === s0, status(B.ev) === st0]), J([false, true, true]));
    const w0 = omWrites(fold);
    h.g.open(); await h.p; await w.p; await pause(5);
    chk(name, sc, 'then B’s Save, finding nothing recorded, asks: nothing written, F0 still the folder’s copy, the choice offered',
      J([omWrites(fold) - w0, fold.note(2027, 'A'), asks(B.ev)]), J([0, 'F0', true]));
    chk(name, sc, SANE, sane(LM, m0), SANEW(['A', 'B']));
  }
  // (5) CONTROLS: waits that were always counted. (5a) B's own save writing and a second Save waiting behind it in this tab:
  // the second is told it waits, ↶ Put back is refused and a refresh loads nothing; both saves then land, one at a time.
  // (5b) Case (3) with B's waiting Save counted by the harness itself (its lock request wrapped: up when asked, down when
  // settled): the refresh records nothing and the Save asks, on a board with or without this change -- the uncounted wait
  // alone was the cause.
  { const sc = '(5a) CONTROL: a second Save waiting behind this tab’s own save';
    const LM = webLocks(sc); const { B, fold } = await putBackFixture(LM);
    const m0 = LM.mark(); const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
    const p1 = B.ev('saveInPlace()'); const ok = await until(() => (fold.hits.main || 0) > n0);
    const p2 = B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'the first Save holds the lock, held at its write; the second, asked now, is told it runs once the first has finished',
      J([ok, LM.heldBy('orbit-save'), B.ev('_saveBusy') > 0, status(B.ev)]), J([true, ['B'], true, '⏳ A save is already under way — this one runs as soon as it finishes.']));
    chk(name, sc, '↶ Put back is refused and says so -- [byte for byte as it was, questions, on screen, said]', J(putBack(B)), J([true, 0, 'S1', true]));
    const s0 = state(B.ev); const r = await B.ev('driveStorePull(true)'); await pause(5);
    chk(name, sc, 'a refresh loads nothing -- [returned, nothing changed byte for byte]', J([r, state(B.ev) === s0]), J([false, true]));
    g.open(); await p1; await p2; await pause(5);
    chk(name, sc, 'both land, one at a time: S1 the folder’s copy, saved; K still kept; nothing under way',
      J([fold.note(2027, 'A'), unsaved(B.ev), keptNote(B.ev), B.ev('_saveBusy')]), J(['S1', [false, false, false], 'K', 0]));
    chk(name, sc, SANE, sane(LM, m0), SANEW(['B', 'B']));
  }
  { const sc = '(5b) CONTROL: case (3) with the waiting Save counted by the harness';
    const LM = webLocks(sc); const x = await unrecorded(LM, false); const { B, fold } = x; const A = await tabA(LM, fold);
    const api = B.w.navigator.locks, real = api.request;
    Object.defineProperty(B.w.navigator, 'locks', { configurable: true, enumerable: true, value: { query: api.query,
      request: (n, a, b) => { B.ev('_saveBusy++; 0'); const p = real(n, a, b); const down = () => { B.ev('_saveBusy--; 0'); }; p.then(down, down); return p; } } });
    chk(name, sc, UNREC(false), unrec(x, false), UNRECW(false));
    const m0 = LM.mark(); const h = await holdA(A, LM, fold); const w = await waitB(B, LM);
    chk(name, sc, WAITS, waits(h, LM, w), WAITW);
    chk(name, sc, 'the waiting Save is counted', B.ev('_saveBusy') > 0, true);
    await B.ev('livePoll(false)'); await pause(5);
    chk(name, sc, '↻ Refresh now while the counted Save waits records nothing', based(B.ev), 0);
    const w0 = omWrites(fold);
    h.g.open(); await h.p; await w.p; await pause(5);
    chk(name, sc, 'then B’s Save asks: nothing written, F0 still the folder’s copy; B-EDIT on screen, unsaved; the choice offered; nothing under way',
      J([omWrites(fold) - w0, fold.note(2027, 'A'), scr(B.ev), B.ev('DIRTY'), asks(B.ev), B.ev('_saveBusy')]), J([0, 'F0', 'B-EDIT', true, true, 0]));
    chk(name, sc, SANE, sane(LM, m0), SANEW(['A', 'B']));
  }
  // (6) THE COUNT COMES BACK DOWN HOWEVER A SAVE ENDS, and counts every save asked for. B has saved F0 (recorded) and typed S1.
  // (6a) the Live timer's autosave, holding the lock, throws (the folder refuses its write); (6b) the lock request itself is
  // refused (a tab no longer fully active); (6c) asking for the lock throws at once (the save runs without it); (6d) two
  // Saves asked while tab A holds the lock: both counted, the second told it waits, then both run, one at a time.
  const saved1 = async LM => { const fold = folder(); const B = await open(LM, 'B'); connect(B.ev, B.w, fold);
    B.ev(`setNote('A','F0'); 'ok'`); await pause(5); await B.ev('saveInPlace()'); await pause(5);
    B.ev(`setNote('A','S1'); 'ok'`); await pause(5); return { B, fold }; };
  const SAVED1 = 'F0 saved, the folder’s copy and recorded; S1 on screen, unsaved (a CONTROL)';
  const saved1v = (B, fold) => J([fold.note(2027, 'A'), based(B.ev) === headTs(fold), scr(B.ev), B.ev('DIRTY')]);
  { const sc = '(6a) the autosave throws while it holds the lock';
    const LM = webLocks(sc); const { B, fold } = await saved1(LM);
    chk(name, sc, SAVED1, saved1v(B, fold), J(['F0', true, 'S1', true]));
    B.ev(`_liveCfg.on=true; _liveCfg.auto=true; _driveLive=true; 'ok'`);
    fold.failNext.main = new Error('The shared folder is read-only');
    await B.ev('liveTick()'); await pause(5);
    chk(name, sc, 'the autosave failed and says so; F0 still the folder’s copy; S1 unsaved; nothing under way, and the lock let go' + GUARD,
      J([/Automatic save to the shared folder failed/.test(status(B.ev)), fold.note(2027, 'A'), B.ev('DIRTY'), B.ev('_saveBusy'), LM.heldBy('orbit-save'), LM.stats.grants === LM.stats.releases]),
      J([true, 'F0', true, 0, [], true]));
  }
  { const sc = '(6b) the lock request is refused';
    const LM = webLocks(sc); const { B, fold } = await saved1(LM);
    chk(name, sc, SAVED1, saved1v(B, fold), J(['F0', true, 'S1', true]));
    Object.defineProperty(B.w.navigator, 'locks', { configurable: true, enumerable: true, value: {
      request: () => B.w.Promise.reject(new B.w.Error('InvalidStateError: the document is not fully active')) } });
    let ret; try { ret = await B.ev('saveInPlace()'); } catch (e) { ret = 'threw: ' + ((e && e.message) || e); } await pause(5);
    chk(name, sc, 'the Save fails with the refusal; nothing written, F0 still the folder’s copy; S1 unsaved; nothing under way' + GUARD,
      J([ret, fold.note(2027, 'A'), B.ev('DIRTY'), B.ev('_saveBusy')]), J(['threw: InvalidStateError: the document is not fully active', 'F0', true, 0]));
  }
  { const sc = '(6c) asking for the lock throws at once';
    const LM = webLocks(sc); const { B, fold } = await saved1(LM);
    chk(name, sc, SAVED1, saved1v(B, fold), J(['F0', true, 'S1', true]));
    Object.defineProperty(B.w.navigator, 'locks', { configurable: true, enumerable: true, value: { request: () => { throw new B.w.Error('SecurityError'); } } });
    await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'the Save runs without the lock: S1 the folder’s copy, saved; nothing under way' + GUARD,
      J([fold.note(2027, 'A'), unsaved(B.ev), B.ev('_saveBusy')]), J(['S1', [false, false, false], 0]));
  }
  { const sc = '(6d) two Saves asked while another tab’s save holds the lock';
    const LM = webLocks(sc); const { B, fold } = await saved1(LM); const A = await tabA(LM, fold);
    chk(name, sc, SAVED1, saved1v(B, fold), J(['F0', true, 'S1', true]));
    const m0 = LM.mark(); const h = await holdA(A, LM, fold); const w = await waitB(B, LM);
    chk(name, sc, WAITS, waits(h, LM, w), WAITW);
    const st1 = status(B.ev); const p2 = B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'both waiting Saves are counted (_saveBusy 2), and the second is told it runs once the first has finished',
      J([B.ev('_saveBusy'), status(B.ev) !== st1 && status(B.ev)]), J([2, '⏳ A save is already under way — this one runs as soon as it finishes.']));
    h.g.open(); await h.p; await w.p; await p2; await pause(5);
    chk(name, sc, 'once A’s save lands both run: S1 the folder’s copy, saved; nothing under way' + GUARD,
      J([fold.note(2027, 'A'), unsaved(B.ev), B.ev('_saveBusy')]), J(['S1', [false, false, false], 0]));
    chk(name, sc, SANE, sane(LM, m0), SANEW(['A', 'B', 'B']));
  }
  // (7) LOAD THEIRS WAITS AS A SAVE DOES. B saved F0; Alice's other machine saved N over it; B typed B-EDIT and its 💾 Save
  // asked. B presses Load theirs while tab A's save holds the lock: it waits, and is under way as a waiting save is, so ↶ Put
  // back is refused meanwhile (other work, kept aside here by the harness, stays kept). The harness then empties the kept
  // slot, so that Load theirs, once A's save lands, has room to keep B-EDIT aside: N on screen and recorded, B-EDIT kept.
  { const sc = '(7) Load theirs while another tab’s save holds the lock';
    const LM = webLocks(sc), fold = folder(); const B = await open(LM, 'B'); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    await B.ev('driveAutoConnect()'); await pause(5);
    B.ev(`setNote('A','F0'); 'ok'`); await pause(5); await B.ev('saveInPlace()'); await pause(5);
    await other(fold, ['N']);
    B.ev(`setNote('A','B-EDIT'); 'ok'`); await pause(5); await B.ev('saveInPlace()'); await pause(5);
    const A = await tabA(LM, fold);
    chk(name, sc, 'F0 saved and recorded; Alice’s other machine saved N over it; B-EDIT typed after, unsaved; B’s 💾 Save asked; nothing kept aside (a CONTROL)',
      J([fold.note(2027, 'A'), scr(B.ev), B.ev('DIRTY'), asks(B.ev), keptNote(B.ev)]), J(['N', 'B-EDIT', true, true, null]));
    const m0 = LM.mark(); const h = await holdA(A, LM, fold); const w = await waitB(B, LM, `driveResolve('theirs')`);
    chk(name, sc, 'tab A’s save holds the lock and B’s Load theirs waits for it -- [A held at its write, A’s appropriation, the lock held by, waiting] (a CONTROL)',
      waits(h, LM, w), WAITW);
    chk(name, sc, 'B counts its waiting Load theirs as under way (_saveBusy 1)', B.ev('_saveBusy'), 1);
    B.ev(`(function(){ var o=JSON.parse(JSON.stringify(MS)); o.years['2027'].notes.A='OTHER-KEPT'; return keepAside(o, {why:'file', by:'Bob', ts:1}, baseGet()); })()`);
    chk(name, sc, '↶ Put back while Load theirs waits is refused and says so -- [what is on screen and the kept work byte for byte as they were, questions, on screen, said]',
      J(putBack(B)), J([true, 0, 'B-EDIT', true]));
    B.ev(`localStorage.removeItem(_AP.key+'.kept'); _keptMeta=null; 'ok'`);
    h.g.open(); await h.p; await w.p; await pause(5);
    chk(name, sc, 'once tab A’s save lands, Load theirs runs: N on screen, recorded against the folder’s copy; B-EDIT kept aside; nothing under way',
      J([scr(B.ev), based(B.ev) === headTs(fold), keptNote(B.ev), B.ev('_saveBusy'), fold.note(2027, 'A')]), J(['N', true, 'B-EDIT', 0, 'N']));
    chk(name, sc, SANE, sane(LM, m0), SANEW(['A', 'B']));
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (U20) ====
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
