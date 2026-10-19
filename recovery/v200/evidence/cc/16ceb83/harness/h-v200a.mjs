// FOCUSED harness: VERBATIM from /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/16ceb83/after/tools/export-audit/audit-import.mjs -- imports, failure list, keepBoards, SEEN/chk, the selected blocks
// (suite lines 6856-6913, 6914-6972, 6974-7064, 7065-7253, 7254-7463, 7464-7527), the top-level helpers they reference (closure: MINE, W1H, W2FX, W2_KEYS, W2_MINE, W2_SC, base, d, it, w2Ap, w2Fx, w2Gen, w2Import, w2LsOf, w2it, w3Hist, w3Hook), the guard. Not the full suite.
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
// ==== v2.00 (U3): a Save asked for during the mixed-import hold is refused at once, never queued ====
// v2.00 (U3): R4b's contract (Brad, 11 Oct): "a Save requested while the mixed-import hold is already active must refuse
// immediately, before file access. Clearing the hold later must not resume that refused request." With another save under
// way, such a Save was queued instead ("⏳ A save is already under way — this one runs as soon as it finishes") and checked
// only when its turn came. If saving was allowed again first, it ran and wrote: for the board file, the mix -- the imported
// Full Fund plan -- over the one whole copy of the board as it was. Here save A is held at the close of its write, the import
// stops part-way and cannot be put back, request B is asked for, saving is allowed again ("allow saving again…", answered
// yes), and A is let go. B is each way a save is asked for: the board file's Save, 💾 Save and Take the pen on the board
// file; 💾 Save, ⬆ Publish now, Save yours over theirs and Load theirs working out of the shared folder; and the quiet
// autosave, which is over at once and says nothing. With nothing else saving, Take the pen is refused before it reads the
// board file or the folder's copy, or asks. The controls: asked for again once saving is allowed, it writes; with no hold,
// B waits its turn and writes after A; and a Save asked for BEFORE the hold, still waiting its turn when the hold comes, is
// refused when its turn comes while the hold still stands, before the file or the folder's copy is read (kept behaviour).
// If saving is allowed again before its turn, that Save runs and writes, as the question that allows it warns ("The next
// save writes the board on screen, and that mix ... over the board file"); that case is not checked here.
// FAILS ON 7ee498a (board fce8a391): B waits its turn and writes after A -- perm 2 · read 2 · open 2 · writes 2, the board
// file holding the imported Full Fund plan; in the folder, a second write and a second history copy, and Load theirs reads
// the folder's copy again; the autosave says it waits its turn, over the import's message, then writes the folder's copy;
// Take the pen with nothing else saving reads the board file or the folder's copy and asks first.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v2.00 (U3) — a Save asked for during the mixed-import hold is refused at once, never queued';
  try {
    const { NEW, OLD } = w2Fx();
    const { J, wire, KEY, status, qs, disk, folder, connect, gate, until, tick, pause } = W1H;
    const turns = async n => { for (let i = 0; i < n; i++) await tick(); };
    const QUEUED = /A save is already under way/;
    // Which generation of the Full Fund plan a board file holds, read from its text.
    const fileFF = html => { const m = String(html).match(/id="pubState">([\s\S]*?)<\/script>/);
      const s = JSON.stringify(((JSON.parse(m[1]).appns || {}).ff || {}).years || {});
      return /NEW/.test(s) && /OLD/.test(s) ? 'BOTH' : /NEW/.test(s) ? 'NEW' : /OLD/.test(s) ? 'OLD' : 'none'; };
    // THE BOARD FILE: save A held at the close of its write; every permission request, read and open counted.
    const inFile = async () => {
      const T = boot({ html: OLD.html, ls: OLD.ls }); await pause(80);
      wire(T.ev, 'brad', KEY.brad);
      const f = disk(T.w, OLD.html);
      T.w.__disk.requestPermission = async () => { f.hits.perm = (f.hits.perm || 0) + 1; return 'granted'; };
      const touched = () => `perm ${f.hits.perm || 0} · read ${f.hits.read || 0} · open ${f.hits.open || 0} · writes ${f.writes}`;
      const g = gate(); f.hold.close = g;
      const pA = T.ev('saveInPlaceFile()');
      const held = await until(() => (f.hits.close || 0) >= 1);
      return { T, f, touched, g, pA, held };
    };
    // THE SHARED FOLDER: the board's first copy saved, a note typed, save A held at the close of its write of the copy;
    // every read of the folder's copy counted.
    const inFolder = async () => {
      const T = boot({ html: OLD.html, ls: OLD.ls }); await pause(80);
      wire(T.ev, 'brad', KEY.brad);
      const fold = folder(); connect(T.ev, T.w, fold);
      const NM = 'spmt-' + T.ev('MS.cur') + '-om.json', gh = fold.dir.getFileHandle; let reads = 0;
      fold.dir.getFileHandle = async (n, o) => { if (n === NM && !(o && o.create)) reads++; return gh(n, o); };
      await T.ev('saveInPlace()');
      T.ev(`setNote('A','EDIT-1'); 'ok'`); await pause(5);
      const g = gate(); fold.hold.main = g;
      const pA = T.ev('saveInPlace()');
      const held = await until(() => (fold.hits.main || 0) >= 2);
      return { T, fold, reads: () => reads, g, pA, held };
    };
    const stop = (T) => { const r = w2Import(T, NEW.html, 'stuck', 8); wire(T.ev, 'brad', KEY.brad);   // w2Import answers yes to everything; this records the questions again
      return J([r.ret, /could not be put back as it was/.test(r.stat), T.ev('String(impMixedOn())')]); };
    const ask = async (T, how) => { const o = { decided: false, q0: qs(T.ev).length }; o.p = Promise.resolve(T.ev(how)).then(() => { o.decided = true; }); await turns(60); return o; };
    for (const [how, words, label] of [['saveInPlaceFile()', 'Saving to the board file', 'the board file’s Save'],
                                        ['saveInPlace()', 'Saving to the board file', '💾 Save'],
                                        ['takePen()', 'Taking the pen', 'Take the pen']]) {
      const at = label + ' on the board file, with a save under way';
      const { T, f, touched, g, pA, held } = await inFile();
      chk(name, at, 'save A is held at the close of its write (a control)', J([held, touched()]), J([true, 'perm 1 · read 1 · open 1 · writes 0']));
      chk(name, at, 'the import stopped part-way, could not be put back, and the hold is on (a control)', stop(T), J([false, true, 'true']));
      const b = await ask(T, how);
      chk(name, at, 'refused at once: the request is over, nothing more is touched or asked, and it is not queued',
        J([b.decided, touched(), qs(T.ev).length - b.q0, QUEUED.test(status(T.ev))]), J([true, 'perm 1 · read 1 · open 1 · writes 0', 0, false]));
      chk(name, at, 'the board says ' + words.toLowerCase() + ' is refused, and that nothing writes over the board file',
        new RegExp(words + ' is refused').test(status(T.ev)) && /nothing writes over it/.test(status(T.ev)), true);
      T.ev(`globalThis.__yes=true; impMixedClear(); 'ok'`);
      chk(name, at, 'saving is allowed again (a control)', T.ev('String(impMixedOn())'), 'false');
      g.open(); await pA; await until(() => b.decided); await turns(60);
      chk(name, at, 'allowing saving again does not bring it back: A alone wrote, and the board file holds no imported plan',
        J([touched(), fileFF(f.content)]), J(['perm 1 · read 1 · open 1 · writes 1', 'OLD']));
      const w0 = f.writes; await T.ev('saveInPlaceFile()');
      chk(name, at, 'CONTROL — asked for again now saving is allowed, Save writes', J([f.writes - w0, /Saved in place/.test(status(T.ev))]), J([1, true]));
    }
    for (const [how, words, label] of [['saveInPlace()', 'Writing to the shared folder', '💾 Save'],
                                        ['driveStorePush(false)', 'Writing to the shared folder', '⬆ Publish now'],
                                        [`driveResolve('mine')`, 'Choosing between the copies', 'Save yours over theirs'],
                                        [`driveResolve('theirs')`, 'Choosing between the copies', 'Load theirs']]) {
      const at = label + ' working out of the shared folder, with a save under way';
      const { T, fold, reads, g, pA, held } = await inFolder();
      const r0 = reads(), h0 = fold.hist().length;
      chk(name, at, 'save A is held at the close of its write (a control)', held, true);
      chk(name, at, 'the import stopped part-way, could not be put back, and the hold is on (a control)', stop(T), J([false, true, 'true']));
      const b = await ask(T, how);
      chk(name, at, 'refused at once: the request is over, the folder’s copy is not read again, nothing is asked, and it is not queued',
        J([b.decided, reads() - r0, qs(T.ev).length - b.q0, QUEUED.test(status(T.ev))]), J([true, 0, 0, false]));
      chk(name, at, 'the board says ' + words.toLowerCase() + ' is refused', new RegExp(words + ' is refused').test(status(T.ev)), true);
      T.ev(`globalThis.__yes=true; impMixedClear(); 'ok'`);
      g.open(); await pA; await until(() => b.decided); await turns(60);
      chk(name, at, 'allowing saving again does not bring it back: A alone wrote the folder’s copy, nothing more was read, nothing more kept in its history',
        J([fold.hits.main || 0, reads() - r0, fold.hist().length - h0]), J([2, 0, 0]));
      const m0 = fold.hits.main || 0; await T.ev('saveInPlace()');
      chk(name, at, 'CONTROL — asked for again now saving is allowed, 💾 Save writes', J([(fold.hits.main || 0) - m0, /✅ Saved O&M FY27 to the shared folder/.test(status(T.ev))]), J([1, true]));
    }
    // THE QUIET AUTOSAVE, asked for under the hold behind a 💾 Save of the folder under way: over at once and quiet. Not
    // queued, it reports no save, and the import's own message, with its buttons, stays on the message line.
    {
      const at = 'the autosave working out of the shared folder, with a save under way';
      const { T, fold, g, pA, held } = await inFolder();
      chk(name, at, 'save A is held at the close of its write, the import stopped part-way, could not be put back, and the hold is on (a control)',
        J([held, stop(T)]), J([true, J([false, true, 'true'])]));
      const s1 = status(T.ev), h0 = fold.hist().length;
      const o = { decided: false }; o.p = Promise.resolve(T.ev('driveStorePush(true)')).then(v => { o.decided = true; o.v = v; });
      await turns(60);
      chk(name, at, 'refused at once and quietly: over, not queued, it reports no save, and the message line is the import’s own, unchanged',
        J([o.decided, o.v, QUEUED.test(status(T.ev)), status(T.ev) === s1]), J([true, false, false, true]));
      T.ev(`globalThis.__yes=true; impMixedClear(); 'ok'`);
      g.open(); await pA; await until(() => o.decided); await turns(60);
      chk(name, at, 'allowing saving again does not bring it back: A alone wrote the folder’s copy, nothing more kept in its history',
        J([fold.hits.main || 0, fold.hist().length - h0]), J([2, 0]));
    }
    // TAKE THE PEN WITH NOTHING ELSE SAVING, under the hold: refused before it reads the board file, or the folder's copy,
    // and before it asks.
    {
      const at = 'Take the pen on the board file, with nothing else saving';
      const T = boot({ html: OLD.html, ls: OLD.ls }); await pause(80);
      wire(T.ev, 'brad', KEY.brad);
      const f = disk(T.w, OLD.html);
      T.w.__disk.requestPermission = async () => { f.hits.perm = (f.hits.perm || 0) + 1; return 'granted'; };
      chk(name, at, 'the import stopped part-way, could not be put back, and the hold is on (a control)', stop(T), J([false, true, 'true']));
      const q0 = qs(T.ev).length;
      await T.ev('takePen()'); await turns(30);
      chk(name, at, 'nothing is read, opened or written, and nothing is asked',
        J([`perm ${f.hits.perm || 0} · read ${f.hits.read || 0} · open ${f.hits.open || 0} · writes ${f.writes}`, qs(T.ev).length - q0]), J(['perm 0 · read 0 · open 0 · writes 0', 0]));
      chk(name, at, 'the board says taking the pen is refused', /Taking the pen is refused/.test(status(T.ev)), true);
    }
    {
      const at = 'Take the pen from Alice working out of the shared folder, with nothing else saving';
      const fold = folder();
      const A = boot({ html: OLD.html, ls: OLD.ls }); await pause(80); wire(A.ev, 'Alice', KEY.alice); connect(A.ev, A.w, fold);
      A.ev(`setNote('A','ALICE-1'); 'ok'`); await pause(5); await A.ev('saveInPlace()');
      const T = boot({ html: OLD.html, ls: OLD.ls }); await pause(80); wire(T.ev, 'brad', KEY.brad); connect(T.ev, T.w, fold);
      await T.ev('driveStorePull(false)');
      const fy = +T.ev('MS.cur'), NM = 'spmt-' + fy + '-om.json', gh = fold.dir.getFileHandle; let reads = 0;
      fold.dir.getFileHandle = async (n, o) => { if (n === NM && !(o && o.create)) reads++; return gh(n, o); };
      chk(name, at, 'Brad’s board loaded Alice’s copy, the import stopped part-way, could not be put back, and the hold is on (a control)',
        J([T.ev(`String(S.notes.A||'')`), stop(T)]), J(['ALICE-1', J([false, true, 'true'])]));
      const q0 = qs(T.ev).length, m0 = fold.hits.main || 0;
      await T.ev('takePen()'); await turns(30);
      chk(name, at, 'the folder’s copy is not read or written, and nothing is asked', J([reads, (fold.hits.main || 0) - m0, qs(T.ev).length - q0]), J([0, 0, 0]));
      chk(name, at, 'the board says taking the pen is refused', /Taking the pen is refused/.test(status(T.ev)), true);
    }
    // CONTROL -- NO HOLD: B waits its turn behind A, as it always has, and writes after it.
    {
      const at = 'CONTROL — no hold: the board file’s Save, with a save under way';
      const { T, f, touched, g, pA } = await inFile();
      const b = await ask(T, 'saveInPlaceFile()');
      chk(name, at, 'B waits its turn, and the board says so', J([b.decided, QUEUED.test(status(T.ev)), touched()]), J([false, true, 'perm 1 · read 1 · open 1 · writes 0']));
      g.open(); await pA; await until(() => b.decided);
      chk(name, at, 'then B writes, after A', J([touched(), fileFF(f.content)]), J(['perm 2 · read 2 · open 2 · writes 2', 'OLD']));
    }
    // A SAVE ASKED FOR BEFORE THE HOLD, still waiting its turn when the hold comes: refused when its turn comes while the
    // hold still stands, before the file or the folder's copy is read (the check at the start of its turn; R4's after the
    // read is the one behind it). Kept behaviour: these pass before the change too.
    {
      const at = 'the board file’s Save asked for before the hold, waiting its turn';
      const { T, f, touched, g, pA } = await inFile();
      const b = await ask(T, 'saveInPlaceFile()');
      chk(name, at, 'B waits its turn (a control)', J([b.decided, QUEUED.test(status(T.ev))]), J([false, true]));
      chk(name, at, 'the import stopped part-way, could not be put back, and the hold is on (a control)', stop(T), J([false, true, 'true']));
      g.open(); await pA; await until(() => b.decided);
      chk(name, at, 'refused when its turn comes, before the file is touched: A alone asked, read, opened and wrote (kept behaviour)',
        J([touched(), /Saving to the board file is refused/.test(status(T.ev))]), J(['perm 1 · read 1 · open 1 · writes 1', true]));
    }
    {
      const at = '💾 Save working out of the shared folder, asked for before the hold, waiting its turn';
      const { T, fold, reads, g, pA } = await inFolder();
      const r0 = reads();
      const b = await ask(T, 'saveInPlace()');
      chk(name, at, 'B waits its turn (a control)', J([b.decided, QUEUED.test(status(T.ev))]), J([false, true]));
      chk(name, at, 'the import stopped part-way, could not be put back, and the hold is on (a control)', stop(T), J([false, true, 'true']));
      g.open(); await pA; await until(() => b.decided);
      chk(name, at, 'refused when its turn comes, before the folder’s copy is read: A alone wrote it (kept behaviour)',
        J([fold.hits.main || 0, reads() - r0, /Writing to the shared folder is refused/.test(status(T.ev))]), J([2, 0, true]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (U3) ====
// ==== v2.00 (U4): the folder save checks the mixed-import hold after its read and before its write ====
// v2.00 (U4): _driveStorePushRun checked the hold once, before it read the folder's copy. A full import that stopped part-way
// during that read, or while the copy it read was being kept in the folder's history, set the hold, and the save went on: it
// wrote over the folder's copy and said "✅ Saved" with the hold on. The hold is now checked again after the read and after
// the history copy, the last wait before the write. Here the board's first copy is saved and a note is typed; 💾 Save is held
// at its read of the folder's copy, or at the close of its history copy; the import stops part-way there; the save is let
// go. Take the pen from Alice is held the same way; so is the quiet autosave, which is refused and says nothing; a note
// typed while the history copy is kept keeps its own stamp; the header's saved time stays what it was. Save yours over
// theirs and Load theirs (_driveResolveRun) read the folder's copy too: an import that stopped part-way during that read,
// or while their copy was being kept in the history, let Save yours over theirs ask, keep their copy and record it as the
// one being replaced, so that once saving was allowed again the autosave wrote over their copy without asking; Load theirs
// loaded it. They check the hold again after the read and after keeping their copy. The controls: the same holds with
// nothing happening there write and say Saved, and once saving is allowed again 💾 Save writes the note.
// FAILS ON 7ee498a (board fce8a391): every held save writes the folder's copy and says "✅ Saved" with the hold on (the
// autosave says nothing and reports a save); Take the pen leaves Brad the writer and a line in the journal saying he took
// the pen; the note typed meanwhile is written; Save yours over theirs records their copy, and the autosave then writes over
// it; Load theirs loads their copy over the board.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v2.00 (U4) — the folder save checks the mixed-import hold after its read and before its write';
  try {
    const { NEW, OLD } = w2Fx();
    const { J, wire, KEY, status, qs, folder, connect, gate, until, tick, pause } = W1H;
    const turns = async n => { for (let i = 0; i < n; i++) await tick(); };
    const stamp = ev => ev('JSON.stringify([MS.ts, MS.by])');      // the board's own stamp: the header's "Saved" time, and by whom
    const pens = ev => +ev(`(MS.jrnl||[]).filter(function(e){ return e.p && e.p[0]==='(writer)'; }).length`);
    const histNew = (fold, h0) => Object.keys((fold.root.dirs.history || { files: {} }).files).filter(n => !(n in h0)).map(n => fold.root.dirs.history.files[n]);
    const hist0 = fold => Object.assign({}, (fold.root.dirs.history || { files: {} }).files);
    // `at` 'read': the save's read of the folder's copy is held; 'hist': the close of its history copy.
    const holdAt = (fold, NM, at) => { const g = gate(); let hit = () => (fold.hits.hist || 0) >= 1;
      if (at === 'read') { const gh = fold.dir.getFileHandle; let n = 0;
        fold.dir.getFileHandle = async (nm, o) => { if (!n && nm === NM && !(o && o.create)) { n = 1; await g.p; } return gh(nm, o); };
        hit = () => n === 1; }
      else fold.hold.hist = g;
      return { g, hit }; };
    const stop = (T) => { const r = w2Import(T, NEW.html, 'stuck', 8); wire(T.ev, 'brad', KEY.brad);   // w2Import answers yes to everything; this records the questions again
      return J([r.ret, /could not be put back as it was/.test(r.stat), T.ev('String(impMixedOn())')]); };
    for (const [at, withImport] of [['read', true], ['hist', true], ['read', false], ['hist', false]]) {
      const where = (at === 'read' ? '💾 Save held at its read of the folder’s copy' : '💾 Save held at the close of its history copy')
        + (withImport ? ', the import stops part-way there' : ' (a CONTROL: nothing happens there)');
      const T = boot({ html: OLD.html, ls: OLD.ls }); await pause(80);
      wire(T.ev, 'brad', KEY.brad);
      const fold = folder(); connect(T.ev, T.w, fold);
      const fy = +T.ev('MS.cur'), NM = 'spmt-' + fy + '-om.json';
      await T.ev('saveInPlace()');
      const v1 = fold.raw(fy);
      T.ev(`setNote('A','EDIT-1'); 'ok'`); await pause(5);
      const s0 = stamp(T.ev), h0 = hist0(fold), m0 = fold.hits.main || 0;
      const { g, hit } = holdAt(fold, NM, at);
      const p = T.ev('saveInPlace()');
      const reached = await until(hit);
      if (withImport) chk(name, where, 'the import stopped part-way, could not be put back, and the hold is on (a control)', stop(T), J([false, true, 'true']));
      g.open(); await p; await turns(30);
      if (!withImport) {
        chk(name, where, 'the save writes the folder’s copy once, with the note, and says Saved',
          J([reached, (fold.hits.main || 0) - m0, fold.note(fy, 'A'), /✅ Saved O&M FY27 to the shared folder/.test(status(T.ev))]), J([true, 1, 'EDIT-1', true]));
        continue;
      }
      chk(name, where, 'nothing is written over the folder’s copy: it keeps its bytes', J([reached, (fold.hits.main || 0) - m0, fold.raw(fy) === v1]), J([true, 0, true]));
      chk(name, where, at === 'read' ? 'nothing is kept in the history either: the save stopped before it' : 'the history keeps the folder’s copy as it was read, once (kept behaviour)',
        J(histNew(fold, h0).map(t => t === v1)), J(at === 'read' ? [] : [true]));
      chk(name, where, 'the board says writing to the shared folder is refused, and does not say Saved',
        J([/Writing to the shared folder is refused/.test(status(T.ev)), /✅ Saved/.test(status(T.ev))]), J([true, false]));
      chk(name, where, 'the note typed stays unsaved, and the board’s stamp is what it was before the save', J([T.ev('String(DIRTY)'), stamp(T.ev) === s0]), J(['true', true]));
      if (at === 'read') {
        T.ev(`globalThis.__yes=true; impMixedClear(); 'ok'`);
        const m1 = fold.hits.main || 0; await T.ev('saveInPlace()');
        chk(name, where, 'CONTROL — once saving is allowed again, 💾 Save writes the note and says Saved',
          J([T.ev('String(impMixedOn())'), (fold.hits.main || 0) - m1, fold.note(fy, 'A'), /✅ Saved O&M FY27 to the shared folder/.test(status(T.ev))]), J(['false', 1, 'EDIT-1', true]));
      }
    }
    // TAKE THE PEN FROM ALICE, held at the close of its history copy, the import stopping part-way there. Alice saves the
    // folder's first copy (its writer); Brad's board loads it and takes the pen.
    {
      const where = 'Take the pen from Alice, held at the close of its history copy, the import stops part-way there';
      const fold = folder();
      const A = boot({ html: OLD.html, ls: OLD.ls }); await pause(80); wire(A.ev, 'Alice', KEY.alice); connect(A.ev, A.w, fold);
      const fy = +A.ev('MS.cur');
      A.ev(`setNote('A','ALICE-1'); 'ok'`); await pause(5); await A.ev('saveInPlace()');
      const v1 = fold.raw(fy), writer = () => ((fold.copy(fy) || {}).writer || {}).by || '';
      const T = boot({ html: OLD.html, ls: OLD.ls }); await pause(80); wire(T.ev, 'brad', KEY.brad); connect(T.ev, T.w, fold);
      await T.ev('driveStorePull(false)');
      chk(name, where, 'Alice holds the pen, and Brad’s board loaded her copy (a control)', J([writer(), T.ev(`String(S.notes.A||'')`)]), J(['Alice', 'ALICE-1']));
      const s0 = stamp(T.ev), j0 = pens(T.ev), h0 = hist0(fold), m0 = fold.hits.main || 0;
      const g = gate(); fold.hold.hist = g;
      const p = T.ev('takePen()');
      const reached = await until(() => (fold.hits.hist || 0) >= 1);
      chk(name, where, 'the import stopped part-way, could not be put back, and the hold is on (a control)', stop(T), J([false, true, 'true']));
      g.open(); await p; await turns(30);
      chk(name, where, 'nothing is written: the folder’s copy keeps its bytes, and Alice still holds the pen',
        J([reached, (fold.hits.main || 0) - m0, fold.raw(fy) === v1, writer()]), J([true, 0, true, 'Alice']));
      chk(name, where, 'the journal does not say Brad took the pen, and the board’s stamp is what it was', J([pens(T.ev) - j0, stamp(T.ev) === s0]), J([0, true]));
      chk(name, where, 'the board says writing to the shared folder is refused, and does not say Saved',
        J([/Writing to the shared folder is refused/.test(status(T.ev)), /✅ Saved/.test(status(T.ev)), histNew(fold, h0).map(t => t === v1)]), J([true, false, [true]]));
    }
    // THE SAME WAITS, MORE CLOSELY: the save, or the quiet autosave, held at `hold`, the import stopping part-way there.
    // `between` runs at the wait, before the import stops; `before`, before the save is asked for.
    const tip = ev => { const t = ev(`(document.getElementById('saveState')||{}).title||''`); return t.slice(0, t.indexOf('. ')); };
    const folderAt = async (hold, how, between, before) => {
      const T = boot({ html: OLD.html, ls: OLD.ls }); await pause(80);
      wire(T.ev, 'brad', KEY.brad);
      const fold = folder(); connect(T.ev, T.w, fold);
      const fy = +T.ev('MS.cur'), NM = 'spmt-' + fy + '-om.json';
      await T.ev('saveInPlace()');
      const v1 = fold.raw(fy);
      T.ev(`setNote('A','EDIT-1'); 'ok'`); await pause(5);
      if (before) before(T);
      const t0 = tip(T.ev), h0 = hist0(fold), m0 = fold.hits.main || 0;
      const { g, hit } = holdAt(fold, NM, hold);
      const p = T.ev(how);
      const reached = await until(hit);
      if (between) await between(T);
      const ctl = stop(T), s1 = status(T.ev);
      g.open(); const ret = await p; await turns(30);
      return { T, fold, fy, v1, h0, m0, reached, ctl, s1, ret, t0 };
    };
    // A NOTE TYPED while the save's history copy is being kept: the hold stops the save, and the note keeps its own stamp.
    {
      const where = '💾 Save held at the close of its history copy, a note typed there, then the import stops part-way';
      let se = null;
      const r = await folderAt('hist', 'saveInPlace()', async T => { await pause(5); T.ev(`setNote('B','EDIT-2'); 'ok'`); se = stamp(T.ev); });
      chk(name, where, 'reached, and the hold is on (a control)', J([r.reached, r.ctl]), J([true, J([false, true, 'true'])]));
      chk(name, where, 'nothing is written over the folder’s copy, and the board says writing to the shared folder is refused',
        J([(r.fold.hits.main || 0) - r.m0, r.fold.raw(r.fy) === r.v1, /Writing to the shared folder is refused/.test(status(r.T.ev))]), J([0, true, true]));
      chk(name, where, 'the note typed during the save keeps its stamp, and the board stays unsaved (kept behaviour: before the change the save wrote it, stamp and all)',
        J([stamp(r.T.ev) === se, r.T.ev('String(DIRTY)')]), J([true, 'true']));
    }
    // THE QUIET AUTOSAVE held at its read, and at the close of its history copy: refused, and quietly.
    for (const at of ['read', 'hist']) {
      const where = 'the autosave held ' + (at === 'read' ? 'at its read of the folder’s copy' : 'at the close of its history copy') + ', the import stops part-way there';
      const r = await folderAt(at, 'driveStorePush(true)');
      chk(name, where, 'reached, and the hold is on (a control)', J([r.reached, r.ctl]), J([true, J([false, true, 'true'])]));
      chk(name, where, 'nothing is written, it reports no save, and the message line is the import’s own, unchanged',
        J([(r.fold.hits.main || 0) - r.m0, r.fold.raw(r.fy) === r.v1, r.ret, status(r.T.ev) === r.s1]), J([0, true, false, true]));
      chk(name, where, at === 'read' ? 'nothing is kept in the history either: the autosave stopped before it' : 'the history keeps the folder’s copy as it was read, once (kept behaviour)',
        J(histNew(r.fold, r.h0).map(t => t === r.v1)), J(at === 'read' ? [] : [true]));
    }
    // THE HEADER'S "Saved <time> by <who>" (its tooltip, from the board's stamp) after a save the hold stopped at its history
    // copy: what it said before that save. The stamp is set to a day long past first, so a save made now cannot read the same.
    {
      const where = '💾 Save held at the close of its history copy, the import stops part-way there: the header';
      const r = await folderAt('hist', 'saveInPlace()', null, T => T.ev(`MS.ts=Date.UTC(2026,0,5,15,0,0); render(); 'ok'`));
      chk(name, where, 'reached, and the hold is on (a control)', J([r.reached, r.ctl]), J([true, J([false, true, 'true'])]));
      chk(name, where, 'the header’s saved time and name are what they were before the save', J([tip(r.T.ev) === r.t0, /Jan/.test(tip(r.T.ev))]), J([true, true]));
    }
    // SAVE YOURS OVER THEIRS AND LOAD THEIRS (driveResolve), held at the read of the folder's copy, or (Save yours over
    // theirs) at the close of the copy of theirs it keeps in the history, the import stopping part-way there. Bob saved the
    // folder's copy after Brad's board read it (a newer time, and a note of his), so Brad's 💾 Save offered the choice.
    const resolveAt = async (at, which, withImport) => {
      const T = boot({ html: OLD.html, ls: OLD.ls }); await pause(80);
      wire(T.ev, 'brad', KEY.brad);
      const fold = folder(); connect(T.ev, T.w, fold);
      const fy = +T.ev('MS.cur'), NM = 'spmt-' + fy + '-om.json';
      await T.ev('saveInPlace()'); await turns(10);
      T.ev(`setNote('A','EDIT-1'); 'ok'`); await pause(5);
      const j = fold.copy(fy), t1 = +((j.store && j.store.ts) || j.ts) + 5000;
      j.ts = t1; j.store.ts = t1; j.by = 'Bob'; j.store.years[fy].notes = Object.assign({}, j.store.years[fy].notes, { B: 'BOB-1' });
      fold.root.files[NM] = JSON.stringify(j);
      const theirs = fold.raw(fy), m0 = fold.hits.main || 0;
      await T.ev('saveInPlace()'); await turns(10);
      const clash = J([(fold.hits.main || 0) - m0, /Bob saved O&M FY27 to the shared folder/.test(status(T.ev))]);
      const { g, hit } = holdAt(fold, NM, at);
      const q0 = qs(T.ev).length;
      const p = T.ev(`driveResolve(${J(which)})`);
      const reached = await until(hit);
      const qa = qs(T.ev).length - q0;      // asked before the import: stop() starts the record of questions afresh
      const ctl = withImport ? stop(T) : '';
      g.open(); await p; await turns(30);
      const asked = withImport ? qa + qs(T.ev).length : qs(T.ev).length - q0;
      const bob = () => Object.values((fold.root.dirs.history || { files: {} }).files).filter(t => /BOB-1/.test(t)).length;
      const based = () => +T.ev('driveBaseOf(mySlug(), MS.cur)') === t1;
      const screen = () => J([T.ev(`String(S.notes.A||'')`), T.ev(`String(S.notes.B||'')`)]);
      return { T, fold, fy, theirs, m0, clash, reached, ctl, asked, bob, based, screen };
    };
    for (const [at, which] of [['read', 'mine'], ['hist', 'mine'], ['read', 'theirs']]) {
      const where = (which === 'mine' ? 'Save yours over theirs' : 'Load theirs') + ' held '
        + (at === 'read' ? 'at its read of the folder’s copy' : 'at the close of the copy of theirs it keeps in the history') + ', the import stops part-way there';
      const r = await resolveAt(at, which, true);
      chk(name, where, 'Brad’s 💾 Save met Bob’s newer copy and wrote nothing, the wait was reached, and the hold is on (a control)',
        J([r.clash, r.reached, r.ctl]), J([J([0, true]), true, J([false, true, 'true'])]));
      if (which === 'theirs')
        chk(name, where, 'refused before it loads anything: nothing asked or written, their copy not recorded, and the board on screen keeps Brad’s note and not Bob’s',
          J([r.asked, (r.fold.hits.main || 0) - r.m0, r.based(), r.screen()]), J([0, 0, false, J(['EDIT-1', ''])]));
      else
        chk(name, where, at === 'read' ? 'refused before it asks: nothing asked, nothing kept in the history, nothing written, and their copy not recorded as the one being replaced'
                                       : 'asked before the hold came, and their copy stays kept in the history; nothing is written, and their copy is not recorded as the one being replaced',
          J([r.asked, r.bob(), (r.fold.hits.main || 0) - r.m0, r.fold.raw(r.fy) === r.theirs, r.based()]), J(at === 'read' ? [0, 0, 0, true, false] : [1, 1, 0, true, false]));
      chk(name, where, 'the board says choosing between the copies is refused, and does not say Saved or Loaded',
        J([/Choosing between the copies is refused/.test(status(r.T.ev)), /✅ Saved|Loaded/.test(status(r.T.ev))]), J([true, false]));
      r.T.ev(`globalThis.__yes=true; impMixedClear(); 'ok'`);
      const m1 = r.fold.hits.main || 0, q1 = qs(r.T.ev).length;
      const ret = await r.T.ev('driveStorePush(true)'); await turns(10);
      chk(name, where, 'once saving is allowed again, the autosave does not write over their copy: nothing asked or written, Bob’s note stays, and the choice is offered again',
        J([String(ret), qs(r.T.ev).length - q1, (r.fold.hits.main || 0) - m1, r.fold.note(r.fy, 'B'), /Bob saved O&M FY27 to the shared folder/.test(status(r.T.ev))]),
        J(['false', 0, 0, 'BOB-1', true]));
    }
    {
      const where = 'CONTROL — Save yours over theirs held at the close of the copy of theirs it keeps in the history, nothing happens there';
      const r = await resolveAt('hist', 'mine', false);
      chk(name, where, 'Brad’s 💾 Save met Bob’s newer copy and wrote nothing, and the wait was reached (a control)', J([r.clash, r.reached]), J([J([0, true]), true]));
      chk(name, where, 'asked once; theirs is kept in the history, yours is written over it, and the board says Saved',
        J([r.asked, r.bob() >= 1, (r.fold.hits.main || 0) - r.m0, r.fold.note(r.fy, 'A'), /✅ Saved O&M FY27 to the shared folder/.test(status(r.T.ev))]), J([1, true, 1, 'EDIT-1', true]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (U4) ====
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
