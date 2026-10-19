// FOCUSED harness (reuse review): VERBATIM from the suite given -- imports, failure list, keepBoards, SEEN/chk, the
// v2.00 R3-R5 blocks, the top-level helpers they reference (closure: MINE, W1H, W2FX, W2_KEYS, W2_MINE, W2_SC, base, d, it, w2Ap, w2Fx, w2Gen, w2Import, w2LsOf, w2it, w3Hist, w3Hook), the guard. Not the full suite.
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
const W2_MINE = ['USAF', 'ANG', 'AFRC'];
const w2it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Req ' + id,
  event: 'Req ' + id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
const W2_SC = {
  om: { services: W2_MINE, items: [w2it('A', 'AV', [900, 200, 100]), w2it('B', 'PSM', [400, 100, 50])],
        disc: [1200, 300, 150], mand: [100, 20, 10], order: ['A', 'B'] },
  ff: { services: W2_MINE, items: [w2it('F', 'AV', [700, 100, 60]), w2it('G', 'TSS', [500, 90, 30])],
        disc: [900, 150, 60], mand: [200, 40, 20], order: ['F', 'G'] },
};
const w2LsOf = (ev) => JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
const w2Ap = (html, appn, sc, gen, cyc, first, pad) => {
  const B = boot({ html, appn }); seed(B.ev, sc);
  B.ev(`(function(){ BASE_ITEMS.length=0; ${JSON.stringify(sc.items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    applyState(S); S.titles=S.titles||{}; S.titles[${JSON.stringify(first)}]=${JSON.stringify(gen + ' ' + appn)};
    S.notes[${JSON.stringify(first)}]='p'.repeat(${pad});
    S.alloc[${JSON.stringify(first)}]={m:'t', v:${gen === 'NEW' ? 777 : 333}}; MS.years[MS.cur]=S; save();
    blCyc=${JSON.stringify(cyc)}; blYr=MS.cur; cycLock(); return 'ok'; })()`);
  return B;
};
const w2Gen = (gen, cyc) => {
  const F = w2Ap(null, 'FULL FUND', W2_SC.ff, gen, cyc, 'F', gen === 'NEW' ? 20000 : 0);
  const lsF = w2LsOf(F.ev);
  const O = w2Ap(F.ev('buildSavedHtml()'), 'O&M', W2_SC.om, gen, cyc, 'A', gen === 'OLD' ? 15000 : 0);
  O.ev(`(function(){ const t=Date.now();
    BUDDB={ts:t, rows:[{ap:'om', svc:'USAF', name:'${gen} BAE row'+'b'.repeat(${gen === 'NEW' ? 5000 : 0}), amt:${gen === 'NEW' ? 1111 : 2222}}], files:['${gen}.xlsx']}; persistBud();
    EXDB={ts:t, all:{om:{fy:2027, rows:[['JSF${gen === 'NEW' ? 1 : 2}', 5000]]}}}; persistExdb();
    ACEDB={ts:t, sets:{'ACE-${gen}':{fp:'fp-${gen}', locked:true, appn:{om:{pmo:{AV:{2027:900}}}}, lines:[{n:'${gen}'}]}}}; persistAce();
    RPDB={ts:t, entries:[{id:'rp-${gen}', ts:t, ap:'om', amt:25000, what:'${gen} reprog'}]}; persistRp();
    flowAddEnt(); flowSetEnt(flowEnts().length-1,'n','${gen} Depot'); setDest('A','to',destByName('${gen} Depot').k);
    save(); return 'ok'; })()`);
  const html = O.ev('buildSavedHtml()');
  const ls = Object.assign({}, lsF, w2LsOf(O.ev)); ls.prio27appn = 'O&M';
  return { html, ls };
};
let W2FX = null;
const w2Fx = () => {
  if (!W2FX) {
    const NEW = w2Gen('NEW', 'PB'), OLD = w2Gen('OLD', 'POM');
    const ls = Object.assign({}, OLD.ls); delete ls.prio27acedb;
    W2FX = { NEW, OLD: { html: OLD.html, ls } };
  }
  return W2FX;
};
const W2_KEYS = ['prio27om', 'prio27ff', 'prio27om-cyc', 'prio27ff-cyc', 'prio27buddb', 'prio27execdb', 'prio27acedb', 'prio27reprog', 'prio27destdb', 'prio27impRep'];
const w2Import = (T, html, mode, n, limit) => {
  const e0 = T.errors.length;
  const r = JSON.parse(T.ev(`(function(){
    window.confirm=function(){ return true; }; const alerts=[]; window.alert=function(m){ alerts.push(String(m)); };
    const held={}; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); held[k]=localStorage.getItem(k); }
    const size=function(){ let t=0; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); t+=k.length+localStorage.getItem(k).length; } return t; };
    const mode=${JSON.stringify(mode)}, N=${n | 0}, LIMIT=${limit | 0};
    const writes=[]; const _si=Storage.prototype.setItem; let c=0;
    Storage.prototype.setItem=function(k, v){ c++; v=String(v); const was=localStorage.getItem(k);
      const no= mode==='once'? c===N : mode==='full'? (c>=N && v!==held[k]) : mode==='stuck'? c>=N
              : mode==='quota'? (size()-(was===null? 0 : k.length+was.length)+k.length+v.length>LIMIT)
              : mode==='stuckKeys'? (c>=N && ${JSON.stringify(W2_KEYS)}.indexOf(k)>=0) : false;
      writes.push([k, v.length, no]);
      if(no) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      return _si.call(this, k, v); };
    let ret, threw='';
    try{ ret=fullImportText(${JSON.stringify(html)}, 'new-board.html'); }catch(e){ threw=String((e&&e.message)||e); }
    finally{ Storage.prototype.setItem=_si; }
    return JSON.stringify({ret:ret, threw:threw, writes:writes, alerts:alerts, held:held, stat:(document.getElementById('shareStat')||{}).textContent||''});
  })()`));
  r.nav = T.errors.slice(e0).some(e => /navigation/i.test(e));
  return r;
};
const w3Hook = fold => {
  const K = { hold: {}, fail: {}, hits: {} };
  const step = async k => { K.hits[k] = (K.hits[k] || 0) + 1;
    const g = K.hold[k]; if (g) { delete K.hold[k]; await g.p; }
    const f = K.fail[k]; if (f) { if (f.skip) f.skip--; else { delete K.fail[k]; throw f.e; } } };
  const root = fold.dir, qp = root.queryPermission, gfh = root.getFileHandle, gdh = root.getDirectoryHandle;
  root.queryPermission = async o => { await step('perm'); return qp(o); };
  root.getFileHandle = async (n, o) => { const h = await gfh(n, o);
    return /^spmt-\d{4}-[a-z]+\.json$/.test(n) ? { ...h, getFile: async () => { await step('mainRead'); return h.getFile(); } } : h; };
  root.getDirectoryHandle = async (n, o) => {
    if (n === 'history') await step(o && o.create ? 'histDir' : 'histOpen');
    const d = await gdh(n, o); if (n !== 'history') return d;
    return { ...d,
      values: async function* () { await step('histList'); yield* d.values(); },
      getFileHandle: async (fn, fo) => { if (fo && fo.create) await step('histCreate'); const h = await d.getFileHandle(fn, fo);
        return { ...h, getFile: async () => { await step('histRead'); return h.getFile(); },
          createWritable: async () => { const wr = await h.createWritable();
            return { write: async x => { await step('histWrite'); return wr.write(x); }, close: async () => { await step('histClose'); return wr.close(); } }; } }; } };
  };
  return K;
};
const w3Hist = fold => Object.assign({}, (fold.root.dirs.history || { files: {} }).files);
// ==== v2.00 (R3): a locked view is never written to the working folder ====
// A folder save checked for a locked cycle on screen only before its first wait. Put on screen while the save read the
// folder's copy, the locked plan was built into the bytes, written over the working plan's copy with that copy kept as
// history, and the board said "Saved". The save now asks again once the copy is read.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v2.00 (R3) — a locked view is never written to the working folder';
  try {
  const { J, wire, KEY, status, baseFile, folder, connect, gate, until, pause } = W1H;
  const F1 = baseFile('Alice', KEY.alice);
  // PB27 is locked holding LOCKED; the folder's copy holds WORKING, saved; WORKING TWO is on screen, unsaved.
  const fresh = async () => {
    const fold = folder(); const A = boot({ html: F1 }); await pause(5);     // the opening's own bookkeeping runs once the page has loaded
    wire(A.ev, 'Alice', KEY.alice); connect(A.ev, A.w, fold);
    A.ev(`setNote('A','LOCKED'); blCyc='PB'; blYr=2027; cycLock(); setNote('A','WORKING'); 'ok'`); await A.ev('driveStorePush(false)');
    A.ev(`setNote('A','WORKING TWO'); 'ok'`);
    return { A, fold, K: w3Hook(fold) };
  };
  // The call is held at its read of the folder's copy; `during` runs there. What it wrote is every close the folder saw.
  const held = async (A, fold, K, call, during) => {
    const raw = fold.raw(2027), h0 = J(w3Hist(fold)), l0 = fold.log.length, n0 = K.hits.mainRead || 0;
    K.hold.mainRead = gate(); const g = K.hold.mainRead;
    const p = A.ev(call);
    const reached = await until(() => (K.hits.mainRead || 0) > n0);
    if (during) A.ev(during + `; 'ok'`);
    g.open(); const ret = await p;
    return { raw, reached, ret, same: fold.raw(2027) === raw && J(w3Hist(fold)) === h0, wrote: fold.log.slice(l0) };
  };
  // (a) SAVE, AND PB27 PUT ON SCREEN WHILE THE FOLDER'S COPY IS READ: nothing is written -- not the copy, not its
  // history, not the lock -- the folder keeps its bytes, the save does not report success, and the board says why.
  { const { A, fold, K } = await fresh();
    const r = await held(A, fold, K, 'driveStorePush(false)', `cycView('PB|2027')`), st = status(A.ev);
    chk(name, '(a) PB27 put on screen during the read', 'the save reached the read and waited there; PB27 is then on screen', J([r.reached, A.ev('CYCVIEW')]), J([true, 'PB|2027']));
    chk(name, '(a) PB27 put on screen during the read', 'nothing is written to the folder (no copy, no history, no lock), and it is byte-identical', J([r.wrote, r.same]), J([[], true]));
    chk(name, '(a) PB27 put on screen during the read', 'the save does not tell its caller it saved', !!r.ret, false);
    chk(name, '(a) PB27 put on screen during the read', 'the board does not say saved, and says writing to the folder is off', J([/Saved/.test(st), /Writing to the shared folder is off while/.test(st)]), J([false, true]));
    A.ev(`cycLeave(); 'ok'`);
    chk(name, '(a) then the view left', 'the working plan is back, still unsaved', J([A.ev('String(S.notes.A)'), A.ev('String(DIRTY)')]), J(['WORKING TWO', 'true']));
    await A.ev('driveStorePush(false)');
    chk(name, '(a) then the view left', 'the next Save writes the working plan (a CONTROL)', J([fold.note(2027, 'A'), A.ev('String(DIRTY)')]), J(['WORKING TWO', 'false'])); }
  // (b) ⬆ PUBLISH NOW IS THE FOLDER SAVE: the same, and no publish is recorded.
  { const { A, fold, K } = await fresh(); A.ev(`LIVEDB.pub=1; 'ok'`);
    const r = await held(A, fold, K, 'livePublish(false)', `cycView('PB|2027')`);
    chk(name, '(b) ⬆ Publish now, PB27 put on screen during the read', 'nothing is written, it reports failure, and no publish is recorded',
      J([r.reached, r.wrote, r.same, r.ret, A.ev('LIVEDB.pub')]), J([true, [], true, false, 1])); }
  // (c) CONTROL: the same save held at the same read, the working plan left on screen, writes it and says so.
  { const { A, fold, K } = await fresh();
    const r = await held(A, fold, K, 'driveStorePush(false)', '');
    chk(name, '(c) nothing put on screen during the read (a CONTROL)', 'the delayed save writes the working plan, keeps the copy it replaced, and says saved',
      J([r.reached, r.ret, fold.note(2027, 'A'), Object.values(w3Hist(fold)).includes(r.raw), /✅ Saved/.test(status(A.ev)), A.ev('String(DIRTY)')]),
      J([true, true, 'WORKING TWO', true, true, 'false'])); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (R3) ====
// ==== v2.00 (R3, Brad 11 Oct): a save that lands under a locked view says it saved the working plan ====
// The later window R3 does not refuse: PB27 put on screen AFTER the save built its bytes, while its copy is being written. The
// folder rightly gets the working plan; the board said "🔒 Not kept — PB27 is a locked view. ✅ Saved O&M FY27 …" (persist()'s
// own refusal in the view put the prefix there), which read as a refusal and named no plan. It now says the working plan was
// saved and the locked view was not. Nothing written or flagged changes. FAILS ON 7e0764d except the CONTROLs.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v2.00 (R3) — a save that lands under a locked view says it saved the working plan';
  try {
  const { J, wire, KEY, status, baseFile, folder, connect, gate, until, flags, pause } = W1H;
  const F1 = baseFile('Alice', KEY.alice);
  // PB27 is locked holding LOCKED; the folder's copy holds WORKING, saved; WORKING TWO is on screen, unsaved.
  const fresh = async () => {
    const fold = folder(); const A = boot({ html: F1 }); await pause(5);     // the opening's own bookkeeping runs once the page has loaded
    wire(A.ev, 'Alice', KEY.alice); connect(A.ev, A.w, fold);
    A.ev(`setNote('A','LOCKED'); blCyc='PB'; blYr=2027; cycLock(); setNote('A','WORKING'); 'ok'`); await A.ev('driveStorePush(false)');
    A.ev(`setNote('A','WORKING TWO'); 'ok'`);
    return { A, fold };
  };
  // A folder save held at the close of its write of the copy itself -- its bytes already built; `during` runs there.
  const held = async (A, fold, call, during) => {
    const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
    const p = A.ev(call);
    const reached = await until(() => (fold.hits.main || 0) > n0);
    if (during) A.ev(during + `; 'ok'`);
    g.open(); const ret = await p; const fl = flags(A.ev);
    return { reached, ret, view: A.ev('String(CYCVIEW)'), folder: fold.note(2027, 'A'), unsaved: [fl.DIRTY, A.ev('_baseDirty'), !!fl.base.dirty] };
  };
  const kept = (fold, note) => Object.values((fold.root.dirs.history || { files: {} }).files).some(t => { try { return JSON.parse(t).store.years['2027'].notes.A === note; } catch (e) { return false; } });
  const SAID = /^✅ Saved the working plan of O&M FY27 to the shared folder — \d+ KB, built before PB27 was put on screen\. PB27 is a locked view: nothing in it is saved\. Everyone sees the working plan on their next refresh\.$/;
  // (a) SAVE, AND PB27 PUT ON SCREEN WHILE THE COPY IS BEING WRITTEN: the folder gets the working plan, the copy it replaced is kept,
  // the board reads saved, and the message says the working plan was saved and the locked view was not -- no "Not kept".
  { const { A, fold } = await fresh();
    const r = await held(A, fold, 'driveStorePush(false)', `cycView('PB|2027')`), st = status(A.ev);
    chk(name, '(a) PB27 put on screen during the write', 'the save waited at its write, then landed: WORKING TWO in the folder, WORKING kept in history, saved (a CONTROL)',
      J([r.reached, r.ret, r.view, r.folder, kept(fold, 'WORKING'), ...r.unsaved]), J([true, true, 'PB|2027', 'WORKING TWO', true, false, false, false]));
    chk(name, '(a) PB27 put on screen during the write', 'the board says it saved the working plan, built before PB27 was put on screen, and that nothing in PB27 is saved',
      J([SAID.test(st), /Not kept/.test(st)]), J([true, false])); }
  // Not checked here: after leaving the view the screen reads unsaved (cycLeave puts back the flag cycView kept) though the
  // folder and this browser's record hold the working plan -- tracked and proposed to Brad separately; a message change only.
  // (b) THE QUIET AUTOSAVE: it said nothing on success, so persist()'s refusal ("Writing to browser storage is off … not kept") was
  // left on screen. It says the same as (a).
  { const { A, fold } = await fresh();
    const r = await held(A, fold, 'driveStorePush(true)', `cycView('PB|2027')`), st = status(A.ev);
    chk(name, '(b) the quiet autosave, PB27 put on screen during the write', 'the working plan saved, and the board says so, with no "not kept"',
      J([r.ret, r.folder, SAID.test(st), /not kept/i.test(st)]), J([true, 'WORKING TWO', true, false])); }
  // (c) CONTROL: the same held save with nothing put on screen says Saved as before.
  { const { A, fold } = await fresh();
    const r = await held(A, fold, 'driveStorePush(false)', ''), st = status(A.ev);
    chk(name, '(c) nothing put on screen during the write (a CONTROL)', 'the save writes the working plan and says Saved O&M FY27 as before',
      J([r.ret, r.folder, /^✅ Saved O&M FY27 to the shared folder — \d+ KB\. Everyone sees it on their next refresh\./.test(st), SAID.test(st)]),
      J([true, 'WORKING TWO', true, false])); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (R3) message ====

// ==== v2.00 R4: Save and the mixed-import hold (R4, R4b) ====
// v2.00 (R4): A SAVE ALREADY WAITING DOES NOT WRITE PAST A MIXED-IMPORT HOLD. _saveInPlaceFileRun checked the hold once,
// before it waited for the board file's read. A full import that stopped part-way during that wait, and could not be put
// back, set the hold; the Save then built its bytes from the mix and wrote them over the board file -- the one whole copy
// of the board as it was. Here the read is held, the import fails while it waits (browser storage refuses the
// reprogramming log and every write after it, putting back included), and then the read is let go.
// FAILS ON 1c94537 (the file is opened and written, and the board says it saved).
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v2.00 (R4) — a save already waiting does not write past a mixed-import hold';
  try {
    const { NEW, OLD } = w2Fx();
    const { J, wire, KEY, status, disk, gate, until } = W1H;
    for (const withImport of [false, true]) {
      const at = withImport ? 'the import stops part-way during the read' : 'CONTROL — nothing happens during the read';
      const T = boot({ html: OLD.html, ls: OLD.ls });
      wire(T.ev, 'brad', KEY.brad);
      const f = disk(T.w, OLD.html), g = gate(); f.hold.read = g;
      const p = T.ev('saveInPlaceFile()');
      const reached = await until(() => (f.hits.read || 0) >= 1);
      chk(name, at, 'the save reached the file’s read and waits there (a control)', J([reached, f.hits.open || 0, f.writes]), J([true, 0, 0]));
      if (withImport) {
        const r = w2Import(T, NEW.html, 'stuck', 8);
        chk(name, at, 'the import stopped part-way, could not be put back, and the hold is on (a control)',
          J([r.ret, /could not be put back as it was/.test(r.stat), T.ev('String(impMixedOn())')]), J([false, true, 'true']));
      }
      g.open(); await p;
      if (!withImport) {
        chk(name, at, 'the save opens and writes the board file once', J([f.hits.open || 0, f.writes]), J([1, 1]));
        continue;
      }
      chk(name, at, 'nothing is written: the file is never opened for writing', J([f.hits.open || 0, f.writes]), J([0, 0]));
      chk(name, at, 'the board file keeps its bytes', f.content === OLD.html, true);
      chk(name, at, 'the board says the save is refused, and that nothing writes over the board file',
        /Saving to the board file is refused/.test(status(T.ev)) && /nothing writes over it/.test(status(T.ev)), true);
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// v2.00 (R4b): A SAVE ASKED FOR WHILE THE HOLD IS ALREADY ON IS REFUSED BEFORE THE FILE IS TOUCHED. Brad's contract
// (11 Oct): "a Save requested while the mixed-import hold is already active must refuse immediately, before file access.
// Clearing the hold later must not resume that refused request." Since R4 checks the hold again after the read, a Save
// that skipped the first check is still refused -- after asking for permission and reading the file -- so the v1.95
// block above no longer sees that check go. The file here counts every permission request, read and open. A Save starts a
// turn after it is asked for (saveSerial), so the hold is cleared only once the request has been decided: refused,
// finished, or arrived at the file's read.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v2.00 (R4b) — a Save asked for during the mixed-import hold is refused before the file is touched';
  try {
    const { NEW, OLD } = w2Fx();
    const { J, wire, KEY, status, disk, gate, until, tick } = W1H;
    for (const [at, hold, delayRead] of [['CONTROL — no hold', false, false], ['hold on, read not held', true, false],
                                         ['hold on, cleared after the refusal (a held read is reached only if the first check is gone)', true, true]]) {
      const T = boot({ html: OLD.html, ls: OLD.ls });
      if (hold) w2Import(T, NEW.html, 'stuck', 8);
      wire(T.ev, 'brad', KEY.brad);
      chk(name, at, 'the hold is ' + (hold ? 'on' : 'off') + ' before the Save is asked for (a control)', T.ev('String(impMixedOn())'), String(hold));
      const f = disk(T.w, OLD.html), g = gate(); if (delayRead) f.hold.read = g;
      T.w.__disk.requestPermission = async () => { f.hits.perm = (f.hits.perm || 0) + 1; return 'granted'; };
      const touched = () => `perm ${f.hits.perm || 0} · read ${f.hits.read || 0} · open ${f.hits.open || 0}`;
      let decided = false;
      Promise.resolve(T.ev('saveInPlaceFile()')).then(() => { decided = true; });
      await until(() => decided || (f.hits.read || 0) >= 1);
      if (!hold) {
        await until(() => decided);
        chk(name, at, 'the Save asks for permission, reads, opens and writes the board file once', touched() + ' · writes ' + f.writes, 'perm 1 · read 1 · open 1 · writes 1');
        continue;
      }
      chk(name, at, 'refused before the file is touched: no permission request, no read, no open', touched(), 'perm 0 · read 0 · open 0');
      chk(name, at, 'Save is refused at once: the request is over, and the board says so', J([decided, /Saving to the board file is refused/.test(status(T.ev))]), J([true, true]));
      if (delayRead) {
        T.ev(`globalThis.__yes=true; impMixedClear(); 'ok'`);    // allowed again (confirm answered yes), while a read would be held
        chk(name, at, 'the hold is cleared (a control)', T.ev('String(impMixedOn())'), 'false');
        for (let i = 0; i < 200; i++) await tick();
        g.open();
      }
      await until(() => decided);
      chk(name, at, (delayRead ? 'clearing the hold does not bring the refused Save back: ' : '') + 'nothing is written', J([f.hits.open || 0, f.writes]), J([0, 0]));
      chk(name, at, 'the board file keeps its bytes', f.content === OLD.html, true);
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 R4 ====
// ==== v2.00 (R5): a restore during a save stays unsaved ====
// ↶ Put this back marked the board unsaved but did not count as a change. A folder save still writing when the copy was
// put back found nothing changed while it wrote and marked the board saved: the earlier copy on screen, the save's copy in
// the folder, and nothing on screen or in this browser's record saying they differ. The restore now counts as a change, and
// records unsaved work as an edit does, so that save leaves the board unsaved and the next Save writes the copy put back.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v2.00 (R5) — a restore during a save stays unsaved';
  try {
  const { J, wire, KEY, status, baseFile, folder, connect, gate, until, flags, pause } = W1H;
  const F1 = baseFile('Alice', KEY.alice);
  // FY27's folder history holds HISTORY, and its folder copy is CURRENT, saved: the board clean, the earlier copies listed.
  // The folder is connected once the opening's own timers have run, the one that connects to the folder at 60 ms included.
  const fresh = async () => {
    const fold = folder(); const A = boot({ html: F1 }); await pause(80);
    wire(A.ev, 'Alice', KEY.alice); connect(A.ev, A.w, fold);
    A.ev(`setNote('A','HISTORY'); 'ok'`); await A.ev('driveStorePush(false)');
    A.ev(`setNote('A','CURRENT'); 'ok'`); await A.ev('driveStorePush(false)');
    await A.ev('driveHistShow()');
    return { A, fold };
  };
  // A folder save held at the close of its write of the copy itself; `during` runs there, then the write lands. `view`: what
  // is on screen, what the folder holds, and unsaved work as the screen (DIRTY), this browser (_baseDirty) and its record say.
  const held = async (A, fold, during) => {
    const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
    const p = A.ev('driveStorePush(false)');
    const reached = await until(() => (fold.hits.main || 0) > n0);
    if (during) await A.ev(during);
    g.open(); const ret = await p; const fl = flags(A.ev);
    return { reached, ret, view: [A.ev('String(S.notes.A)'), fold.note(2027, 'A'), fl.DIRTY, A.ev('_baseDirty'), !!fl.base.dirty] };
  };
  const kept = (fold, note) => Object.values((fold.root.dirs.history || { files: {} }).files).some(t => { try { return JSON.parse(t).store.years['2027'].notes.A === note; } catch (e) { return false; } });
  // (a) WORKING SAVED, AND THE EARLIER COPY PUT BACK WHILE THAT SAVE WRITES: HISTORY is on screen, the folder keeps WORKING --
  // what that save wrote -- and the board stays unsaved, on screen and in this browser's record, and says it is not in the folder.
  { const { A, fold } = await fresh();
    A.ev(`setNote('A','WORKING'); 'ok'`);
    const r = await held(A, fold, 'driveRestore(0)');
    chk(name, '(a) WORKING saved, HISTORY put back during its write', 'the save waited at its write, then went in (a CONTROL)', J([r.reached, r.ret]), J([true, true]));
    chk(name, '(a) WORKING saved, HISTORY put back during its write', 'HISTORY on screen, WORKING in the folder, and unsaved: DIRTY, _baseDirty, the stored record',
      J(r.view), J(['HISTORY', 'WORKING', true, true, true]));
    chk(name, '(a) WORKING saved, HISTORY put back during its write', 'the board says the change is not in the folder yet', /not in the folder yet/.test(status(A.ev)), true);
    const ok = await A.ev('driveStorePush(false)'); const fl = flags(A.ev);
    chk(name, '(a) then Save', 'it writes HISTORY with no clash and ends saved, and WORKING is kept in the history (a CONTROL)',
      J([ok, fold.note(2027, 'A'), fl.DIRTY, !!fl.base.dirty, kept(fold, 'WORKING')]), J([true, 'HISTORY', false, false, true])); }
  // (b) A SAVE WITH NOTHING NEW (⬆ Publish now, or Save again), HISTORY PUT BACK WHILE IT WRITES: the board was clean, so this
  // browser's record said saved before the restore; it says unsaved after it, and so does the screen.
  { const { A, fold } = await fresh();
    const r = await held(A, fold, 'driveRestore(0)');
    chk(name, '(b) a clean board saved, HISTORY put back during its write', 'HISTORY on screen, CURRENT in the folder, and unsaved: DIRTY, _baseDirty, the stored record',
      J([r.reached, r.ret, ...r.view]), J([true, true, 'HISTORY', 'CURRENT', true, true, true]));
    chk(name, '(b) a clean board saved, HISTORY put back during its write', 'the board says the change is not in the folder yet', /not in the folder yet/.test(status(A.ev)), true); }
  // (c) CONTROL: the same held save with nothing put back ends saved, and says so.
  { const { A, fold } = await fresh();
    A.ev(`setNote('A','WORKING'); 'ok'`);
    const r = await held(A, fold, '');
    chk(name, '(c) WORKING saved, nothing put back (a CONTROL)', 'WORKING on screen and in the folder, and saved: DIRTY, _baseDirty, the stored record; the board says Saved',
      J([r.reached, r.ret, ...r.view, /✅ Saved/.test(status(A.ev)), /not in the folder yet/.test(status(A.ev))]), J([true, true, 'WORKING', 'WORKING', false, false, false, true, false])); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (R5) ====
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
