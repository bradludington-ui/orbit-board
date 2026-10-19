// FOCUSED harness: VERBATIM from /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/ef1548c/after/tools/export-audit/audit-import.mjs -- imports, failure list, keepBoards, SEEN/chk, the selected blocks
// (suite lines 5831-5895, 5898-5985, 6151-6228, 6530-6588, 6590-6700, 6860-6912, 6919-6971, 6981-7015, 7023-7063, 7070-7127), the top-level helpers they reference (closure: MINE, V197W2, W1H, W2FX, W2_KEYS, W2_MINE, W2_SC, W3FILES, W3RE, W3_THEIRS, W3_UNTOUCHED, base, d, it, w2Ap, w2Fx, w2Gen, w2Import, w2LsOf, w2it, w3Batch, w3Err, w3Files, w3Hist, w3Hook, w3Perm, w3Theirs, w3Untouched, w3WithPub), the guard. Not the full suite.
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
const V197W2 = (() => {
  const H = W1H, J = JSON.stringify;
  // Board code every case needs: a workbook built by the board's own writer, handed to an import as a picked file; the
  // reprogramming row and Full Fund's board the edits start from; the two packages.
  const prelude = `(function(){
    globalThis.__wb=function(sheets, name){ const b=buildXlsx(sheets); return {name:name, arrayBuffer: async function(){ return b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength); }}; };
    globalThis.__aceRows=function(t){ const rows=[[],[],[],[],[]]; rows[4][ACE_COL.y0]=2027; const r=[]; r[ACE_COL.appn]='O&M'; r[ACE_COL.svc]='ANG';
      r[ACE_COL.managed]='Y'; r[ACE_COL.pmo]='AIR VEHICLE'; r[ACE_COL.y0]=1.5; r[ACE_COL.ce]=t; rows.push(r);
      rows.forEach(function(x){ for(let i=0;i<x.length;i++) if(x[i]===undefined) x[i]=''; }); return rows; };
    globalThis.__ffStore=function(t){ return {base:2027, cur:2027, ts:2, dataPack:{services:SVC.slice(), items:[{id:'X', grp:'AV', ask:[1,2,3]}]},
      years:{2027:{order:['X'], alloc:{}, mc:{}, fsrc:{}, custom:[], removed:[], discSvc:[100,200,300], mandSvc:[0,0,0], asks:{X:[100,200,300]}, notes:{X:t}}}}; };
    globalThis.__ffPkg=function(t){ return {spmtPkg:PKG_VER, ap:'ff', dir:'issue', seq:1, by:'Manager', ts:Date.now(), ms:__ffStore(t)}; };
    globalThis.__omPkg=function(t){ const ms=JSON.parse(JSON.stringify(MS)); ms.years[MS.cur]=JSON.parse(JSON.stringify(S));
      ms.years[MS.cur].notes=Object.assign({}, ms.years[MS.cur].notes||{}, {A:t}); return {spmtPkg:PKG_VER, ap:'om', dir:'issue', seq:1, by:'Manager', ts:Date.now(), ms:ms}; };
    return 'ok'; })()`;
  // EACH LIST. `live` is the list in the board exactly as savedHtmlOf() writes it and `file` the same list read out of
  // the bytes written, both serialised whole, so "the file has it" is the file's list being the board's, byte for byte.
  // `mark` names what the edits changed, for a board reopened from the file. `saves`: this door also calls save(), so
  // v1.96 already marked it unsaved -- a check of a save writing at the time is a control for it.
  const LISTS = [
    { k: 'rp', what: 'the reprogramming log (a row edited)',
      setup: `RPDB.entries=(RPDB.entries||[]).concat([{id:'RPW2', ts:1, ap:'O&M', fy:2027, type:'BTR', svc:0, title:'first', amtM:0, dir:'deduct', pool:'disc', status:'Pending'}]); persistRp(); 'ok'`,
      edit: t => `rpSetField('RPW2', 'title', ${J(t)})`,
      live: 'JSON.stringify(RPDB)', file: p => J(p.rpDb),
      mark: `JSON.stringify(rpAll().map(function(r){ return r.id+':'+r.title; }))` },
    { k: 'cyc', what: 'the locked cycles (one unlocked or locked again)',
      setup: `blCyc='PB'; blYr=2027; cycLock(); 'ok'`,
      edit: () => `blLock('PB|2027', !blGet('PB|2027').locked)`,
      live: 'JSON.stringify(CYCDB)', file: p => J(((p.cycDb || {}).byAp || {}).om),
      mark: `JSON.stringify(Object.keys(CYCDB.cycles).map(function(k){ var c=CYCDB.cycles[k]; return k+':'+c.locked+':'+(c.unlocks||[]).length; }))` },
    { k: 'ace', what: 'the cost estimates (one imported)',
      edit: t => `importAce({files:[__wb([{name:'ACE', rows:__aceRows(${J(t)})}], '2025 ACE.xlsx')], value:''})`,
      live: 'JSON.stringify(ACEDB)', file: p => J(p.aceDb),
      mark: `JSON.stringify(Object.keys(ACEDB.sets||{}).map(function(k){ return k+':'+ACEDB.sets[k].fp; }))` },
    { k: 'exec', what: 'the execution data (a CCaR QPE imported)',
      edit: t => `importSrc({files:[__wb([{name:'O&M Raw Data', rows:[SRC_HDR.slice(), [2027,'2026-10','C1',${J(t)},'B1','','','PE','',12345]]}], 'QPE.xlsx')], value:''})`,
      live: 'JSON.stringify(EXDB)', file: p => J(p.execDb),
      mark: `JSON.stringify(((EXDB.all||{}).om||{}).rows||null)` },
    { k: 'bud', what: 'the BAE budget list (an extract imported)', saves: true,
      edit: t => `importBud({files:[__wb([{name:'BAE', rows:[['Budget Name'], ['USAF O&M - ANG CAM '+${J(t)}+' Discretionary AV']]}], 'BAE.xlsx')], value:''})`,
      live: 'JSON.stringify(BUDDB)', file: p => J(p.budDb),
      mark: `JSON.stringify((BUDDB.rows||[]).map(function(b){ return b.n+':'+(b.gone?1:0); }))` },
    { k: 'dest', what: 'the destination list (one renamed)', saves: true,
      edit: t => `flowSetEnt(0, 'n', ${J(t)})`,
      live: 'JSON.stringify(DESTDB)', file: p => J(p.destDb),
      mark: `JSON.stringify(DESTDB.ents.map(function(e){ return e.k+':'+e.n; }))` },
    { k: 'ff', what: 'Full Fund’s board (a package taken while O&M is open)',
      setup: `localStorage.setItem(_SLUGMAP.ff.key, JSON.stringify(__ffStore('first'))); 'ok'`,
      edit: t => `pkgApply(__ffPkg(${J(t)}), 'pkg.json')`,
      live: 'JSON.stringify(pubsFor(MS).ff)', file: p => J(p.appns.ff),
      mark: `JSON.stringify((((pubsFor(MS).ff||{}).years||{})[2027]||{}).notes||null)` },
    { k: 'om', what: 'this appropriation’s own board (a package taken for it)', board: true,
      edit: t => `pkgApply(__omPkg(${J(t)}), 'pkg.json')`,
      live: `String((S.notes||{}).A||'')`, file: p => String((((((p.appns || {}).om || {}).years || {})[2027] || {}).notes || {}).A || ''),
      mark: `String((S.notes||{}).A||'')` },
  ];
  const run = async (ev, code) => { await ev(code); };
  const header = H.header, status = H.status;
  const saved = ev => /^Saved/.test(header(ev)), unsaved = ev => /^Unsaved changes/.test(header(ev));
  // A board opened from F1 as Brad, its opening done, the list's starting point in place.
  const open = async (F1, L) => {
    const R = boot({ html: F1 }); H.wire(R.ev, 'Brad', H.KEY.brad);
    await H.pause(5);                          // the opening's own bookkeeping runs once the page has loaded
    R.ev(prelude);
    if (L && L.setup) R.ev(L.setup);
    return R;
  };
  // Reopen bytes in a browser whose storage refuses every read and write: the file alone is the record.
  const openRefused = (html) => {
    const dom = new JSDOM(html, { runScripts: 'dangerously', virtualConsole: new VirtualConsole(), url: 'https://example.invalid/board.html',
      beforeParse(w) { const no = () => { throw new w.DOMException('The quota has been exceeded.', 'QuotaExceededError'); };
        w.Storage.prototype.getItem = no; w.Storage.prototype.setItem = no; w.Storage.prototype.removeItem = no;
        w.alert = () => {}; w.confirm = () => true; w.prompt = () => null; } });
    return dom.window;
  };
  return { H, J, LISTS, run, header, status, saved, unsaved, open, openRefused, prelude };
})();
const W3RE = /(<script type="application\/json" id="pubState">)([\s\S]*?)(<\/script>)/;
const w3WithPub = (html, f) => html.replace(W3RE, (m, a, b, c) => a + JSON.stringify(f(JSON.parse(b))).replace(/</g, '\\u003c') + c);
const W3_THEIRS = ['AFRC', 'USAF', 'ANG'];      // W2_MINE, listed another way
const w3Perm = v => Array.isArray(v) ? W3_THEIRS.map(s => v[W2_MINE.indexOf(s)]) : v;
const w3Theirs = st => { const o = JSON.parse(JSON.stringify(st));
  Object.values(o.years || {}).forEach(y => { if (!y) return; y.discSvc = w3Perm(y.discSvc); y.mandSvc = w3Perm(y.mandSvc);
    if (y.bm) { y.bm.disc = w3Perm(y.bm.disc); y.bm.mand = w3Perm(y.bm.mand); (y.bm.adds || []).forEach(a => { a.vec = w3Perm(a.vec); }); } });
  // v1.97 integration: the pack too -- a board listing its services that way saves its requirements' values that way
  o.dataPack.services = W3_THEIRS.slice(); o.dataPack.budget = w3Perm(o.dataPack.budget);
  (o.dataPack.items || []).forEach(it => { if (it) { it.ask = w3Perm(it.ask); if (Array.isArray(it.fy26)) it.fy26 = w3Perm(it.fy26); } });
  return o; };
let W3FILES = null;
const w3Files = () => {
  if (W3FILES) return W3FILES;
  const { NEW } = w2Fx();
  const only = (k, f) => w3WithPub(NEW.html, p => { p.appns = { [k]: p.appns[k] }; if (f) f(p.appns[k]); return p; });
  W3FILES = {
    both: NEW.html,
    om: only('om'), ff: only('ff'),
    om2: only('om', st => { Object.values(st.years).forEach(y => { y.titles = Object.assign({}, y.titles, { A: 'SECOND O&M' }); }); }),
    theirs: w3WithPub(NEW.html, p => { p.appns.om = w3Theirs(p.appns.om); p.appns.ff = w3Theirs(p.appns.ff); return p; }),
  };
  return W3FILES;
};
const w3Batch = async (files, o = {}) => {
  const { J, status, pause } = W1H;
  const { OLD } = w2Fx();
  const T = boot({ html: OLD.html, ls: OLD.ls });
  const plan = Object.fromEntries(files.filter(f => f.plan !== undefined).map(f => [f.name, f.plan]));
  T.ev(`globalThis.__q=[]; globalThis.__al=[]; globalThis.__no=${J(o.no || 0)};
    window.confirm=function(q){ q=String(q); globalThis.__q.push(q);
      if(/DIFFERENT ORDER/.test(q)) return globalThis.__q.filter(function(x){ return /DIFFERENT ORDER/.test(x); }).length!==globalThis.__no;
      return true; };
    window.alert=function(m){ globalThis.__al.push(String(m)); };
    globalThis.__FR0=globalThis.__FR0||FileReader; globalThis.__plan=${J(plan)};
    window.FileReader=function(){ const r=new globalThis.__FR0(), real=r.readAsText.bind(r);
      r.readAsText=function(f){ const p=globalThis.__plan[f.name];
        if(p==='fail'){ setTimeout(function(){ Object.defineProperty(r, 'error', {value:new DOMException('The file could not be read.', 'NotReadableError')}); if(r.onerror) r.onerror(); }, 0); return; }
        if(typeof p==='number'){ let n=p; const go=function(){ if(--n>0) setTimeout(go, 0); else real(f); }; setTimeout(go, 0); return; }
        return real(f); };
      return r; };
    ${o.before || ''}; 'ok'`);
  const lsBefore = w2LsOf(T.ev);
  const plan0 = `JSON.stringify({pubs:PUBS, ms:(CYCVIEW && _cycStash)? _cycStash.MS : MS})`;
  const memBefore = T.ev(plan0);
  T.ev(`document.getElementById('shareStat').textContent='';
    importBoards({ files:[${files.map(f => `new File([${J(f.html)}], ${J(f.name)})`).join(',')}], value:'x' }); ${o.during || ''}; 'ok'`);
  // files are read on the timer, not on the next turn: wait for the outcome (20 seconds at most -- the batch that waits
  // forever for a file it cannot read says nothing at all)
  const done = /Imported:|Nothing was imported|is off while|Nothing imported/;
  for (let i = 0; i < 4000 && !done.test(status(T.ev)); i++) await pause(5);
  const lsAfter = w2LsOf(T.ev);
  const keys = [...new Set(Object.keys(lsBefore).concat(Object.keys(lsAfter)))];
  return { T, lsAfter, stat: status(T.ev),
    changed: keys.filter(k => lsBefore[k] !== lsAfter[k]).sort(),        // every key whose bytes moved, added or removed
    memSame: T.ev(plan0) === memBefore,
    qs: JSON.parse(T.ev('JSON.stringify(globalThis.__q)')), svcQs: JSON.parse(T.ev('JSON.stringify(globalThis.__q)')).filter(q => /DIFFERENT ORDER/.test(q)).length };
};
const w3Untouched = r => JSON.stringify([r.changed, r.memSame, /Imported:/.test(r.stat)]);
const W3_UNTOUCHED = JSON.stringify([[], true, false]);
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
const w3Err = (w, name) => w.eval(`new DOMException('refused', ${JSON.stringify(name)})`);
await (async () => {
  const __bm = bootMark();
  const name = 'v1.97 — a folder save never acknowledges a list it does not write';
  const V = V197W2, H = V.H;
  try {
    const F1 = H.baseFile('Brad', H.KEY.brad);
    const SIDE = ['destDb', 'execDb', 'aceDb', 'rpDb', 'cycDb', 'budDb', 'appns'];
    for (const L of V.LISTS.filter(x => !x.board)) {
      const mk = bootMark();
      const fold = H.folder();
      const R = await V.open(F1, L); H.connect(R.ev, R.w, fold);
      await R.ev('driveStorePush(false)');
      await V.run(R.ev, L.edit('W2 FOLDER'));
      const ok = await R.ev('driveStorePush(false)');
      const copy = fold.copy(2027) || {};
      chk(name, L.k, 'the folder save ran and its copy carries the board alone, none of the lists (a control)',
        String(ok) + '|' + SIDE.filter(k => k in copy || k in (copy.store || {})).join(','), 'true|');
      chk(name, L.k, 'the board it wrote is saved there (a control)', R.ev('String(DIRTY)'), 'false');
      // Saving to the file again: the save in use now writes the lists, and this one has not been written anywhere.
      R.ev(`_liveCfg.store=false; syncBtns(); 'ok'`);
      chk(name, L.k, L.what + ': with Save writing the file again, the board reads unsaved — the folder save did not acknowledge it', V.unsaved(R.ev), true);
      const f = H.disk(R.w, F1);
      await R.ev('saveInPlaceFile()');
      chk(name, L.k, 'the file save writes it, and the board reads saved (a control)', (L.file(H.pubOf(f.content)) === R.ev(L.live)) + '|' + V.saved(R.ev), 'true|true');
      bootRelease(mk, keepBoards());
    }
    // THIS APPROPRIATION'S OWN BOARD, taken from a package while working out of the folder: that IS what the folder
    // save writes, so the board reads unsaved there, and the folder save writes it and acknowledges it.
    {
      const L = V.LISTS.find(x => x.board);
      const fold = H.folder();
      const R = await V.open(F1, L); H.connect(R.ev, R.w, fold);
      await R.ev('driveStorePush(false)');
      await V.run(R.ev, L.edit('W2 OWN BOARD'));
      chk(name, L.k, L.what + ': working out of the folder, the board reads unsaved — the folder save owes it', R.ev('String(DIRTY)') + '|' + V.unsaved(R.ev), 'true|true');
      await R.ev('driveStorePush(false)');
      chk(name, L.k, 'the folder save writes it and the board reads saved (a control)', fold.note(2027, 'A') + '|' + V.saved(R.ev), 'W2 OWN BOARD|true');
    }
    // AN EDIT TO A LIST AT EACH WAIT OF THE FOLDER SAVE -- the history copy, the copy itself, the lock: the board it wrote
    // is saved there, with no "not in the folder yet" (the list never goes to the folder) and no autosave owed; the list
    // is still owed to the file.
    for (const kind of ['hist', 'main', 'lock']) {
      const L = V.LISTS[0];
      const fold = H.folder();
      const R = await V.open(F1, L); H.connect(R.ev, R.w, fold);
      R.ev(`setNote('A','W2 FIRST'); 'ok'`); await R.ev('driveStorePush(false)');
      fold.root.dirs.history = undefined;   // let this save keep a history copy now, not ten minutes later
      R.ev(`setNote('A','W2 BOARD'); 'ok'`);
      fold.hold[kind] = H.gate(); const g = fold.hold[kind];
      const p = R.ev('driveStorePush(false)');
      await H.until(() => (fold.hits[kind] || 0) >= (kind === 'hist' ? 1 : 2));
      await V.run(R.ev, L.edit('W2 DURING THE FOLDER ' + kind.toUpperCase()));
      g.open(); await p;
      const at = 'during the folder ' + kind + ' write', copy = fold.copy(2027) || {};
      chk(name, at, 'the board is saved in the folder, with no change said to be missing from it, nothing owed to the autosave, and no list in the copy (a control)',
        fold.note(2027, 'A') + '|' + R.ev('String(DIRTY)') + '|' + /not in the folder yet/.test(V.status(R.ev)) + '|' + ('rpDb' in copy || 'rpDb' in (copy.store || {})), 'W2 BOARD|false|false|false');
      R.ev(`_liveCfg.store=false; syncBtns(); 'ok'`);
      chk(name, at, 'and with Save writing the file again, the reprogramming log is still owed: the board reads unsaved', V.unsaved(R.ev), true);
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
await (async () => {
  const __bm = bootMark();
  const name = 'v1.97 — a refused browser write never reads as saved';
  const V = V197W2, H = V.H;
  try {
    const F1 = H.baseFile('Brad', H.KEY.brad);
    const L = V.LISTS[0];
    const fold = H.folder();
    const R = await V.open(F1, L);
    const f = H.disk(R.w, F1);
    await R.ev('saveInPlaceFile()');
    R.ev(`globalThis.__si=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(k==='prio27reprog') throw new DOMException('The quota has been exceeded.','QuotaExceededError'); return globalThis.__si.call(this,k,v); }; 'ok'`);
    await V.run(R.ev, L.edit('W2 REFUSED'));
    chk(name, 'refused', 'the reprogramming log is refused by storage (the fixture, a control)', /could not be kept in browser storage/.test(V.status(R.ev)) + '|' + R.ev(`String((localStorage.getItem('prio27reprog')||'').indexOf('W2 REFUSED')>=0)`), 'true|false');
    chk(name, 'refused', 'the board reads unsaved', V.unsaved(R.ev), true);
    // Working out of the shared folder, whose copy does not carry the log: still unsaved, and still after a folder save.
    const refuse = () => R.ev(`Storage.prototype.setItem=function(k,v){ if(k==='prio27reprog') throw new DOMException('The quota has been exceeded.','QuotaExceededError'); return globalThis.__si.call(this,k,v); }; 'ok'`);
    H.connect(R.ev, R.w, fold); R.ev(`syncBtns(); 'ok'`);
    chk(name, 'refused, the folder in use', 'the log is held only on this page, so the board reads unsaved whichever save is in use', V.unsaved(R.ev), true);
    await V.run(R.ev, L.edit('W2 REFUSED IN THE FOLDER'));
    chk(name, 'refused, the folder in use', 'refused there, the message says the folder’s copy does not carry it and offers a file, not the Save that writes the board alone',
      /does not carry it/.test(V.status(R.ev)) + '|' + /Save a copy/.test(V.status(R.ev)) + '|' + /Use 💾 Save/.test(V.status(R.ev)), 'true|true|false');
    await R.ev('driveStorePush(false)');
    chk(name, 'refused, the folder in use', 'and still after the folder save, which wrote the board alone', R.ev('String(DIRTY)') + '|' + V.unsaved(R.ev), 'false|true');
    // STORAGE TAKES IT AGAIN: the next edit lands in storage, and working out of the folder the board reads as the folder
    // save left it -- the folder save is not owed the log.
    R.ev(`Storage.prototype.setItem=globalThis.__si; 'ok'`);
    await V.run(R.ev, L.edit('W2 TAKEN'));
    chk(name, 'storage takes it again', 'the log is in storage again, and the board, its folder copy written, reads saved (a control)',
      R.ev(`String((localStorage.getItem('prio27reprog')||'').indexOf('W2 TAKEN')>=0)`) + '|' + V.saved(R.ev), 'true|true');
    // Refused again, saving to the file: the file save writes it -- saved, and the file alone carries it, reopened with no
    // storage or with storage refusing.
    R.ev(`_liveCfg.store=false; 'ok'`); refuse();
    await V.run(R.ev, L.edit('W2 REFUSED AGAIN'));
    chk(name, 'refused, then the file save', 'refused again, the board reads unsaved', V.unsaved(R.ev), true);
    await R.ev('saveInPlaceFile()');
    chk(name, 'refused, then the file save', 'the file has the log and the board reads saved (a control)', (L.file(H.pubOf(f.content)) === R.ev(L.live)) + '|' + V.saved(R.ev), 'true|true');
    const want = R.ev(L.mark);
    chk(name, 'refused, then the file save', 'reopened with no storage, the edit storage refused is there (a control)', boot({ html: f.content }).ev(L.mark), want);
    const w = V.openRefused(f.content); let got = '(did not open)'; try { got = w.eval(L.mark); } catch (e) { got = 'threw: ' + e.message; }
    chk(name, 'refused, then the file save', 'and reopened with storage refusing every read and write (a control)', got, want);
    try { w.close(); } catch (e) {}
    // A REFUSED EDIT WHILE THE FILE IS BEING WRITTEN: not in the bytes, not in storage -- held on this page alone.
    {
      f.hold.write = H.gate(); const g = f.hold.write; const h0 = f.hits.write || 0;
      const p = R.ev('saveInPlaceFile()');
      await H.until(() => (f.hits.write || 0) > h0);
      await V.run(R.ev, L.edit('W2 REFUSED DURING THE WRITE'));
      g.open(); await p;
      chk(name, 'refused during the write', 'an edit storage refused while the file was being written is in neither: the board reads unsaved and says so',
        String(H.pubOf(f.content).rpDb.entries.some(r => r.title === 'W2 REFUSED DURING THE WRITE')) + '|' + V.unsaved(R.ev) + '|' + /not in the file yet/.test(V.status(R.ev)), 'false|true|true');
      await R.ev('saveInPlaceFile()');
      chk(name, 'refused during the write', 'the next Save writes it, and the board reads saved (a control)', (L.file(H.pubOf(f.content)) === R.ev(L.live)) + '|' + V.saved(R.ev), 'true|true');
    }
    R.ev(`Storage.prototype.setItem=globalThis.__si; 'ok'`);
    // A DOWNLOAD IS NOT THE FILE: what follows it is unsaved, not "downloaded".
    {
      const D = await V.open(F1, L); H.disk(D.w, F1);
      await D.ev('saveInPlaceFile()');
      D.ev(`publishState(); 'ok'`);
      chk(name, 'a download', 'after a download the header says so (a control)', /downloaded — not on the shared file yet/.test(V.header(D.ev)), true);
      await V.run(D.ev, L.edit('W2 AFTER THE DOWNLOAD'));
      chk(name, 'a download', 'an edit to the log after it is not in the copy downloaded: the header says unsaved, not downloaded', V.unsaved(D.ev), true);
    }
    // WHAT OPENING THE BOARD WRITES IS NOBODY'S CHANGE: a file saved before v1.85 with one-year baselines folds them into
    // the cycle store as it opens, and writes it -- the board still opens saved.
    {
      const P = H.pubOf(F1);
      P.appns.om.baselines = { 'PB|2026': { fy: 2026, ts: 5, by: 'Old', svc: H.SVC, disc: [1, 2, 3], mand: [0, 0, 0], reqs: [], pmo: {} } };
      delete P.cycDb;
      const F0 = F1.replace(/(<script type="application\/json" id="pubState">)[\s\S]*?(<\/script>)/, (m, a, b) => a + JSON.stringify(P).replace(/</g, '\\u003c') + b);
      const O = boot({ html: F0 }); await H.pause(5);
      chk(name, 'opening', 'a file whose opening folds old baselines into the cycle store opens saved (a control)',
        O.ev(`Object.keys(CYCDB.cycles).join(',')`) + '|' + V.saved(O.ev), 'PB|2026|true');
    }
    // A SETTING IS NOT THE FILE'S: the colour, the workspace mode and the log's own filter leave a saved board saved.
    {
      const C = await V.open(F1, null); H.disk(C.w, F1);
      await C.ev('saveInPlaceFile()');
      C.ev(`themeSet('light'); uiSetMode('fund'); rpSetFy('ALL'); render(); 'ok'`);
      chk(name, 'settings', 'the colour, the mode and a filter change no list the file carries: still saved (a control)', V.saved(C.ev), true);
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.99 — a batch that cannot be put back says so, and holds the board (item 86)';
  try {
  const { J, wire, KEY, status, lsOf, disk, folder, connect } = W1H;
  const F = w3Files();
  const { OLD } = w2Fx();
  // the board refuses its appropriation once, after the write (as item 77's last case)
  const REFUSE = `globalThis.__as0=applyStore; applyStore=function(raw){ if(raw && raw.years && raw!==MS && globalThis.__asNo){ globalThis.__asNo=false; return false; } return globalThis.__as0(raw); }; globalThis.__asNo=true;`;
  // ... and then storage refuses putting these keys back (every write of them once the board has refused)
  const STUCK = keys => `globalThis.__si0=globalThis.__si0||Storage.prototype.setItem; globalThis.__stuck=${J(keys)};
    Storage.prototype.setItem=function(k, v){ if(globalThis.__asNo===false && globalThis.__stuck.indexOf(k)>=0) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      return globalThis.__si0.call(this, k, v); };`;
  const mark = r => { try { return JSON.parse(r.lsAfter.prio27impMixed || 'null'); } catch (e) { return 'unreadable'; } };
  // the batch writes Full Fund, then O&M (the file's own order), and puts them back the other way round: v1.98 stopped
  // at Full Fund when it would not go back, and never tried O&M
  // the last: Full Fund held nothing in storage before the batch, so putting it back is removing what the batch wrote
  for (const [what, keys, want, pre] of [['O&M, written last', ['prio27om'], ['prio27impMixed', 'prio27om'], ''],
                                    ['Full Fund, written first', ['prio27ff'], ['prio27ff', 'prio27impMixed'], ''],
                                    ['both', ['prio27om', 'prio27ff'], ['prio27ff', 'prio27impMixed', 'prio27om'], ''],
                                    ['O&M (Full Fund held nothing before)', ['prio27om'], ['prio27impMixed', 'prio27om'], `localStorage.removeItem('prio27ff');`]]) {
    const r = await w3Batch([{ name: 'new-board.html', html: F.both }], { before: pre + REFUSE + STUCK(keys) });
    const m = mark(r);
    chk(name, 'the board refuses, and ' + what + ' will not go back', 'every other list is put back: only the stuck ones still hold the import, and the mix is marked',
      J(r.changed), J(want));
    chk(name, 'the board refuses, and ' + what + ' will not go back', 'the mark names exactly the lists not as they were, and says it was this batch',
      J([m && m.keys && m.keys.slice().sort(), m && m.kind]), J([keys.slice().sort(), 'batch']));
    chk(name, 'the board refuses, and ' + what + ' will not go back', 'it says it stopped part-way and names what each list holds -- never "exactly as it was", never "Imported"',
      J([/stopped part-way/.test(r.stat), /from the imported files/.test(r.stat), /exactly as it was/.test(r.stat), /Imported:/.test(r.stat)]), J([true, true, false, false]));
    chk(name, 'the board refuses, and ' + what + ' will not go back', 'the board as it was and the file it took are offered to save, and memory is as it was',
      J([r.T.ev('!!(_impRescue && _impRescue.pre && _impRescue.mixed)'), r.T.ev('(_impRescue && _impRescue.incs || []).map(function(f){ return f.name; }).join()'), r.memSame]),
      J([true, 'new-board.html', true]));
  }
  // WHAT STORAGE HELD COULD NOT BE READ: v1.98 read it a second time itself, and when that read failed it wrote anyway and
  // put nothing back. It is lsAll's own reading now, and lsAll writes nothing when it cannot read.
  { const r = await w3Batch([{ name: 'new-board.html', html: F.both }], { before: REFUSE + `globalThis.__gi0=Storage.prototype.getItem;
      Storage.prototype.getItem=function(k){ if(globalThis.__giArm && k==='prio27om'){ globalThis.__giArm=0; throw new DOMException('The operation is insecure.', 'SecurityError'); } return globalThis.__gi0.call(this, k); };`,
      during: `globalThis.__giArm=1` });
    chk(name, 'storage cannot be read before the write', 'nothing is written: storage and memory are as they were, and it says nothing was imported',
      J([w3Untouched(r), /Nothing was imported/.test(r.stat)]), J([W3_UNTOUCHED, true])); }
  // applyStore() THROWS PART-WAY, having replaced the board in memory: the board on screen is put back as well
  { const r = await w3Batch([{ name: 'new-board.html', html: F.both }], { before: `globalThis.__as0=applyStore; globalThis.__jo0=_jrnlOff;
      applyStore=function(raw){ if(raw && raw.years && raw!==MS && globalThis.__asNo){ globalThis.__asNo=false; _jrnlOff++;
        MS=JSON.parse(JSON.stringify(raw)); MS.__half=1; S=MS.years[MS.cur]||S; throw new Error('stopped part-way'); } return globalThis.__as0(raw); }; globalThis.__asNo=true;` });
    chk(name, 'the board throws part-way through taking its appropriation', 'storage and memory are as they were (the board on screen included), and it says nothing was imported',
      J([w3Untouched(r), /Nothing was imported/.test(r.stat), r.T.ev('MS.__half===undefined && S===MS.years[MS.cur]')]), J([W3_UNTOUCHED, true, true]));
    chk(name, 'the board throws part-way through taking its appropriation', 'and the journal records edits again', r.T.ev('_jrnlOff===globalThis.__jo0'), true); }
  // THE HOLD: while the mix stands, 💾 Save, the shared folder and the autosave are refused; ⬇ Save a copy is not; a reload
  // keeps it, and says which import it was
  { const r = await w3Batch([{ name: 'new-board.html', html: F.both }], { before: REFUSE + STUCK(['prio27om']) });
    const T = r.T;
    T.ev(`Storage.prototype.setItem=globalThis.__si0; 'ok'`);
    wire(T.ev, 'brad', KEY.brad);
    const f = disk(T.w, OLD.html);
    await T.ev('saveInPlaceFile()');
    chk(name, 'held: 💾 Save to the board file', 'refused: the file is not written, and the message offers the copies',
      J([f.writes, /Saving to the board file is refused/.test(status(T.ev)), /Import several boards stopped part-way/.test(status(T.ev)), /new-board\.html/.test(status(T.ev))]),
      J([0, true, true, true]));
    const fold = folder(); connect(T.ev, T.w, fold);
    await T.ev('saveInPlace()');
    await T.ev('driveStorePush(true)');
    chk(name, 'held: 💾 Save to the shared folder', 'refused, the autosave included: nothing is written in the folder',
      J([Object.keys(fold.root.files).length, /Writing to the shared folder is refused/.test(status(T.ev))]), J([0, true]));
    T.ev(`_liveCfg=Object.assign(liveCfg(), {store:false}); 'ok'`);
    const dl0 = +T.ev('globalThis.__dl'); T.ev('publishState()');
    chk(name, 'held: ⬇ Save a copy', 'CONTROL — is never refused', +T.ev('globalThis.__dl') - dl0, 1);
    const R = boot({ html: OLD.html, ls: lsOf(T.ev) });
    wire(R.ev, 'brad', KEY.brad);
    const f2 = disk(R.w, OLD.html);
    await R.ev('saveInPlaceFile()');
    chk(name, 'held, then reloaded', 'the mark is kept, the message names the batch, and 💾 Save is still refused',
      J([/Import several boards stopped part-way/.test(status(R.ev)), f2.writes]), J([true, 0])); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.97 — ↶ Put this back pins its appropriation and year before its first wait (item 78)';
  try {
  const { J, wire, KEY, status, baseFile, folder, connect, gate, until } = W1H;
  const F1 = baseFile('Alice', KEY.alice);
  // FY28 is on the board; FY27's folder history holds HISTORY, and its folder copy is CURRENT, saved -- the board clean.
  const fresh = async () => {
    const fold = folder(); const A = boot({ html: F1 }); wire(A.ev, 'Alice', KEY.alice); connect(A.ev, A.w, fold);
    A.ev(`switchYear(2028); setNote('A','FY28 OWN'); switchYear(2027); setNote('A','HISTORY'); 'ok'`); await A.ev('driveStorePush(false)');
    fold.root.dirs.history = undefined;
    A.ev(`setNote('A','CURRENT'); 'ok'`); await A.ev('driveStorePush(false)');
    await A.ev('driveHistShow()');
    return { A, fold, K: w3Hook(fold) };
  };
  const view = (A, fold, h0) => J([A.ev(`String(((MS.years[2027]||{}).notes||{}).A||'')`), A.ev(`String(((MS.years[2028]||{}).notes||{}).A||'')`),
    /nothing was put back/i.test(status(A.ev)), Object.keys(w3Hist(fold)).filter(n => !(n in h0)).map(n => n.slice(0, 10) + (w3Hist(fold)[n] === fold.raw(2027) ? ' CURRENT' : ' OTHER'))]);
  const MOVES = { away: `switchYear(2028)`, 'away and back': `switchYear(2028); switchYear(2027)` };
  for (const s of ['perm', 'histRead', 'mainRead', 'histClose']) for (const mv of Object.keys(MOVES)) {
    const { A, fold, K } = await fresh();
    const h0 = w3Hist(fold), n0 = K.hits[s] || 0;
    K.hold[s] = gate(); const g = K.hold[s];
    const p = A.ev('driveRestore(0)');
    await until(() => (K.hits[s] || 0) > n0);
    A.ev(MOVES[mv] + `; 'ok'`); g.open(); await p;
    // the restore's own copy of FY27 is already being written at the history close; nothing else is ever kept
    const kept = s === 'histClose' ? ['spmt-2027- CURRENT'] : [];
    chk(name, 'moved ' + mv + ' at ' + s + (s === 'histClose' && mv === 'away' ? ' (a CONTROL)' : ''),
      'nothing is put back: FY27 and FY28 hold what they held, it says why, and the history holds nothing else',
      view(A, fold, h0), J(['CURRENT', 'FY28 OWN', true, kept]));
  }
  // A LIST OF EARLIER COPIES READ FOR FY27, used on FY28.
  { const { A, fold } = await fresh(); const h0 = w3Hist(fold);
    A.ev(`switchYear(2028); 'ok'`); await A.ev('driveRestore(0)');
    chk(name, 'a list read for FY27, used on FY28', 'nothing is put back, and it says the list is not for this year',
      J([view(A, fold, h0), /is not for/.test(status(A.ev))]), J([J(['CURRENT', 'FY28 OWN', true, []]), true])); }
  // A COPY WHOSE NAME SAYS FY27 BUT WHICH HOLDS FY28 (renamed by hand in the folder).
  { const { A, fold } = await fresh(); const H = fold.root.dirs.history.files;
    const j = JSON.parse(Object.values(H)[0]); j.fy = 2028; j.store.cur = 2028;
    H['spmt-2027-om-29991231-235959.json'] = JSON.stringify(j);
    await A.ev('driveHistShow()'); const h0 = w3Hist(fold);
    await A.ev('driveRestore(0)');
    chk(name, 'a copy named for FY27 that holds FY28', 'nothing is put back, and it says what the copy holds',
      J([view(A, fold, h0), A.ev('MS.cur'), /holds O&M FY28/.test(status(A.ev))]), J([J(['CURRENT', 'FY28 OWN', true, []]), 2027, true])); }
  // THE HISTORY REFUSING TO BE LISTED when the copy standing now is kept: that is not an empty history.
  { const { A, fold, K } = await fresh(); const h0 = w3Hist(fold);
    K.fail.histOpen = { e: w3Err(A.w, 'NotAllowedError'), skip: 1 };     // the read of the copy opens it first
    await A.ev('driveRestore(0)');
    chk(name, 'the history cannot be listed to keep the copy standing now', 'nothing is put back, and nothing is kept blind',
      view(A, fold, h0), J(['CURRENT', 'FY28 OWN', true, []])); }
  // CONTROL: nothing moved, nothing refused -- the copy is put back.
  { const { A, fold } = await fresh(); await A.ev('driveRestore(0)');
    chk(name, 'nothing moved (a CONTROL)', 'the earlier copy is put back', A.ev(`String(S.notes.A)`), 'HISTORY'); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.97 — a folder save keeps the copy it replaces, or writes nothing (item 79)';
  try {
  const { J, wire, KEY, status, baseFile, folder, connect, gate, until, flags } = W1H;
  const F1 = baseFile('Alice', KEY.alice);
  // FIRST saved to the folder, then SECOND -- which kept FIRST in the history, under a minute ago -- and THIRD on screen.
  const fresh = async () => {
    const fold = folder(); const A = boot({ html: F1 }); wire(A.ev, 'Alice', KEY.alice); connect(A.ev, A.w, fold);
    A.ev(`setNote('A','FIRST'); 'ok'`); await A.ev('driveStorePush(false)');
    A.ev(`setNote('A','SECOND'); 'ok'`); await A.ev('driveStorePush(false)');
    A.ev(`setNote('A','THIRD'); 'ok'`);
    return { A, fold, K: w3Hook(fold) };
  };
  const auto = A => A.ev(`_liveCfg.auto=true; _driveLive=true; 'ok'`);
  // A SAVE WITHIN TEN MINUTES OF THE LAST COPY keeps the copy it replaces, byte for byte.
  { const { A, fold } = await fresh(); const was = fold.raw(2027);
    const ok = await A.ev('driveStorePush(false)');
    chk(name, 'a save within ten minutes of the last copy', 'it saves, and the history holds the exact bytes it replaced',
      J([ok, fold.note(2027, 'A'), Object.values(w3Hist(fold)).filter(t => t === was).length]), J([true, 'THIRD', 1])); }
  // ... byte for byte even when the folder's copy was not written the way this board writes it.
  { const { A, fold } = await fresh(); const t = JSON.stringify(JSON.parse(fold.raw(2027)), null, 1); fold.root.files['spmt-2027-om.json'] = t;
    await A.ev('driveStorePush(false)');
    chk(name, 'a folder copy laid out differently', 'the history holds it exactly as it was read', Object.values(w3Hist(fold)).includes(t), true); }
  // EACH STEP OF THE HISTORY FAILING: nothing is written, the folder's copy keeps its bytes, the history is as it was,
  // the work stays on screen and unsaved, and the board says why.
  const FAILS = [['histOpen', 'NotAllowedError', 'the history cannot be opened (a refusal, not absence)'], ['histList', 'NotReadableError', 'listing'],
    ['histCreate', 'NoModificationAllowedError', 'creating the copy'], ['histWrite', 'QuotaExceededError', 'writing it'], ['histClose', 'InvalidStateError', 'closing it']];
  for (const [s, e, what] of FAILS) {
    const { A, fold, K } = await fresh(); const was = fold.raw(2027), h0 = J(w3Hist(fold));
    K.fail[s] = { e: w3Err(A.w, e) };
    const ok = await A.ev('driveStorePush(false)');
    const fl = flags(A.ev);
    chk(name, 'the history fails at ' + s + ' (' + what + ')', 'nothing is written, the history is as it was, the work stays unsaved, and it says so',
      J([ok, fold.raw(2027) === was, J(w3Hist(fold)) === h0, A.ev(`String(S.notes.A)`), fl.DIRTY, fl.base.dirty, /could not be kept in the folder’s history/.test(status(A.ev)) && /nothing was written/.test(status(A.ev))]),
      J([false, true, true, 'THIRD', true, true, true]));
  }
  // ... with no history at all yet (genuine absence): the copy is kept, and the save goes in (a CONTROL).
  { const { A, fold } = await fresh(); fold.root.dirs.history = undefined; const was = fold.raw(2027);
    const ok = await A.ev('driveStorePush(false)');
    chk(name, 'no history yet (a CONTROL)', 'genuine absence is not a failure: the copy is kept and the save goes in',
      J([ok, Object.values(w3Hist(fold)).includes(was), fold.note(2027, 'A')]), J([true, true, 'THIRD'])); }
  // THE AUTOMATIC SAVE: the refusal stays on screen, never replaced by "Saved automatically".
  { const { A, fold, K } = await fresh(); const was = fold.raw(2027); auto(A);
    K.fail.histClose = { e: w3Err(A.w, 'InvalidStateError') };
    await A.ev('liveTick()');
    chk(name, 'the automatic save, the history failing', 'nothing is written, the work stays unsaved, and the refusal is still what the board says',
      J([fold.raw(2027) === was, A.ev('String(DIRTY)'), /could not be kept/.test(status(A.ev)), /automatically/.test(status(A.ev))]), J([true, 'true', true, false])); }
  // ... and a warning from a save that did go in -- a change made while it wrote -- is not replaced either.
  { const { A, fold } = await fresh(); auto(A);
    const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
    const p = A.ev('liveTick()');
    await until(() => (fold.hits.main || 0) > n0);
    A.ev(`setNote('A','FOURTH'); 'ok'`); g.open(); await p;
    chk(name, 'the automatic save, a change made while it wrote', 'the board still says that change is not in the folder yet',
      J([fold.note(2027, 'A'), A.ev('String(DIRTY)'), /not in the folder yet/.test(status(A.ev)), /automatically/.test(status(A.ev))]), J(['THIRD', 'true', true, false])); }
  // CONTROL: an automatic save with nothing to say still says it saved.
  { const { A, fold } = await fresh(); auto(A); await A.ev('liveTick()');
    chk(name, 'the automatic save, nothing to say (a CONTROL)', 'it saves and says so', J([fold.note(2027, 'A'), /Saved to the shared folder automatically/.test(status(A.ev))]), J(['THIRD', true])); }
  // HOW FAR BACK THE HISTORY REACHES. The clock is set: saves at 0, 1, 2, 3, 5, 15 and 16 minutes, and a copy kept by
  // force at 4 (somebody else's work, or the copy standing before a put-back). What stays is what the ten-minute spacing
  // always kept -- 1, the forced 4, and 15, the first ten minutes after it -- and the newest; the forced copy is never thinned.
  { const fold = folder(); const A = boot({ html: F1 }); wire(A.ev, 'Alice', KEY.alice); connect(A.ev, A.w, fold);
    A.ev(`globalThis.__t0=Date.UTC(2026,9,5,12,0,0); globalThis.__t=globalThis.__t0; Date.now=function(){ return globalThis.__t; }; 'ok'`);
    const at = async (m, note) => { A.ev(`globalThis.__t=globalThis.__t0+${m}*60000; setNote('A',${J(note)}); 'ok'`); return await A.ev('driveStorePush(false)'); };
    // a copy's time read off its name, as the board writes it (local time, to the second)
    const t0 = JSON.parse(A.ev('globalThis.__t0'));
    const stamps = () => Object.keys(w3Hist(fold)).map(n => /-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})(-recent)?\.json$/.exec(n)).filter(Boolean)
      .map(m => [Math.round((new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime() - t0) / 60000), !!m[7]]).sort((a, b) => a[0] - b[0]);
    await at(0, 'M0'); await at(1, 'M1'); await at(2, 'M2'); await at(3, 'M3');
    A.ev(`globalThis.__t=globalThis.__t0+4*60000; 'ok'`);
    await A.ev(`(async function(){ return await snapKeep(_driveDir, 2027, 'om', 'SOMEBODY ELSE', true); })()`);
    await at(5, 'M5'); await at(15, 'M15'); const last = fold.raw(2027); await at(16, 'M16');
    chk(name, 'saves at 0, 1, 2, 3, 5, 15 and 16 minutes, and one kept by force at 4', 'the history holds the spaced copies, the forced one, and the newest',
      J(stamps()), J([[1, false], [4, false], [15, false], [16, true]]));
    chk(name, 'the newest', 'is exactly what the last save replaced', w3Hist(fold)[Object.keys(w3Hist(fold)).find(n => /-recent\.json$/.test(n))] === last, true); }
  // ... and keeping every save takes nothing from it: 24 spaced copies stay, the newest beside them.
  { const { A, fold } = await fresh(); const H = fold.root.dirs.history.files;
    Object.keys(H).forEach(n => delete H[n]);
    const t0 = JSON.parse(A.ev('Date.now()'));
    for (let i = 1; i <= 24; i++) H[A.ev(`snapName(2027, 'om', ${t0 - 5 * 60000 - (i - 1) * 11 * 60000})`)] = 'SPACED ' + i;
    await A.ev('driveStorePush(false)');
    chk(name, '24 spaced copies, and a save five minutes after the newest', 'all 24 stay, and the copy it replaced is kept beside them',
      J([Object.values(w3Hist(fold)).filter(t => /^SPACED /.test(t)).length, Object.keys(w3Hist(fold)).length]), J([24, 25])); }
  // "SAVE YOURS OVER THEIRS" KEEPS THEIRS FOR GOOD, whatever the saves after it within ten minutes thin (a CONTROL on
  // v1.96, which kept nothing within ten minutes and so thinned nothing; it holds the forced copy under the new thinning).
  { const { A, fold } = await fresh(); await A.ev('driveStorePush(false)');
    const j = JSON.parse(fold.raw(2027)); j.store.ts = j.store.ts + 1000; j.ts = j.store.ts; j.by = 'Bob';
    j.store.years[j.store.cur].notes = Object.assign({}, j.store.years[j.store.cur].notes, { A: 'COLLEAGUE' });
    fold.root.files['spmt-2027-om.json'] = JSON.stringify(j);
    A.ev(`setNote('A','ALICE ONE'); 'ok'`);
    const refused = await A.ev('driveStorePush(false)');
    await A.ev(`driveResolve('mine')`);
    A.ev(`setNote('A','ALICE TWO'); 'ok'`); await A.ev('driveStorePush(false)');
    A.ev(`setNote('A','ALICE THREE'); 'ok'`); await A.ev('driveStorePush(false)');
    const theirs = Object.values(w3Hist(fold)).filter(t => { try { const x = JSON.parse(t); return x.store.years[x.store.cur].notes.A === 'COLLEAGUE'; } catch (e) { return false; } });
    chk(name, 'Save yours over theirs, then two more saves (a CONTROL)', 'their copy is still in the history, and the folder holds the last save',
      J([refused, theirs.length >= 1, fold.note(2027, 'A')]), J([false, true, 'ALICE THREE'])); }
  // NOTHING IS THINNED BEFORE BOTH THE COPY AND THE SAVE HAVE LANDED: a save whose own write fails leaves every copy.
  { const { A, fold } = await fresh(); await A.ev('driveStorePush(false)');      // keeps SECOND as the newest copy
    A.ev(`setNote('A','FOURTH'); 'ok'`); const h0 = Object.keys(w3Hist(fold));
    fold.failNext.main = new Error('the share went away');
    try { await A.ev('driveStorePush(false)'); } catch (e) {}
    chk(name, 'a save whose own write fails', 'every copy the history held is still there, and the work stays unsaved',
      J([h0.length, h0.every(n => n in w3Hist(fold)), A.ev('String(DIRTY)')]), J([2, true, 'true'])); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
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
