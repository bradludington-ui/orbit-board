// FOCUSED harness: VERBATIM from /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/ef1548c/after/tools/export-audit/audit-import.mjs -- imports, failure list, keepBoards, SEEN/chk, the selected blocks
// (suite lines 659-762, 3444-3674, 3816-3909, 3912-4007, 4010-4060, 4063-4142, 4373-4424, 4643-4684, 4719-4746, 4777-4832, 5768-5828), the top-level helpers they reference (closure: MINE, V197W2, W1H, W2FX, W2_KEYS, W2_MINE, W2_SC, asBooted, base, d, it, w2Ap, w2Fx, w2Gen, w2Import, w2LsOf, w2it), the guard. Not the full suite.
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

const asBooted = (ev, sc) => ev(`(function(){
  BASE_ITEMS.length=0;
  ${JSON.stringify(sc.items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
  return 'ok'; })()`);

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
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'PMO copy';
  try {
  // TWO REAL REQUIREMENTS. This block corrects a record number on B, and B has to be a requirement
  // the board actually has for that to mean anything: a bag key for an id not in S.order gets no
  // baseline when the copy is published, so it is not a field a programme office can propose --
  // it is a stray key, and the package is right to leave it behind.
  const sc = base();
  sc.items.push(it('B', 'ATL', [3000000, 500000, 250000]));
  sc.order.push('B');
  const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);

  chk(name, 'flag', 'the portfolio board is not a sandbox', String(ev('SANDBOX')), 'false');

  // String.raw: a plain template literal eats the backslashes out of the regex and the \u003c
  // escape, and the page then throws "Invalid regular expression flags" from inside eval.
  const html = ev(String.raw`(function(){
    const mode={sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, base:pmoBaseline()};
    return buildSavedHtml().replace(/(<script type="application\/json" id="pubMode">)[\s\S]*?(<\/script>)/,
      function(m,a,b){ return a + JSON.stringify(mode).replace(/</g,'\\u003c') + b; }); })()`);
  const P = boot({ html });
  chk(name, 'flag', 'the published copy knows it is one', String(P.ev('SANDBOX')), 'true');
  chk(name, 'flag', 'and who published it', P.ev('PMODE.by'), 'BLL');

  // OUTBOUND IS SHUT. Each of the four is checked by driving it and watching for the refusal --
  // a button that is merely hidden is still reachable from the console or a stale menu.
  const blocked = (call) => P.ev(`(function(){ var hit=false; var _a=window.alert;
    window.alert=function(){ hit=true; }; try{ ${call}; }catch(e){} window.alert=_a;
    return hit? 'refused' : 'ALLOWED'; })()`);
  chk(name, 'outbound', 'saving to a file is refused',       blocked('saveInPlaceFile()'), 'refused');
  chk(name, 'outbound', 'saving in place is refused',        blocked('saveInPlace()'),     'refused');
  chk(name, 'outbound', 'downloading a board copy is refused', blocked('publishState()'),  'refused');
  chk(name, 'outbound', 'publishing another PMO copy is refused', blocked('publishPmoCopy()'), 'refused');
  // ...but their own work must survive a refresh, or an afternoon of impact statements is lost.
  chk(name, 'outbound', 'their own browser storage still accepts changes', String(P.ev('persist()')), 'true');

  // WHAT TRAVELS BACK. Only the invited fields, only where they differ from the baseline shipped
  // with the copy, and never the priority order -- the ranking stays the portfolio team's.
  // A is PSM's and B is ATL's. The office is PSM, so B's correction must not travel however
  // thoroughly it was typed -- that is the scope, checked here as well as in its own scenario
  // because this is the scenario that proves WHAT a package carries.
  P.ev(`try{ localStorage.setItem('prio27who','PMO Lead');
              localStorage.setItem('prio27pmo','PSM'); }catch(e){}
    S.cons['A'] = 'Depot line stops in March; forty aircraft unsupported. '.repeat(12);
    S.desc['A'] = 'Sustainment of the depot line.';
    S.asks['A'] = [9500000, 2000000, 1000000];
    S.ccar['A'] = 'JSF7777';
    S.ccar['B'] = 'JSF8888';
    S.order = ['B','A'];
    S.mc['A'] = true; S.band['A'] = 'pdm';
    S.alloc['A'] = {m:'t', v:1};
    save(); 'ok'`);
  // pmoSubmitBuild() collects what CHANGED; the scope is applied when the package is built, so
  // this still sees both and the wire package below is where B must disappear.
  const sub = JSON.parse(P.ev('JSON.stringify(pmoSubmitBuild())'));
  chk(name, 'submittal', 'it carries the requirements that changed',
    Object.keys(sub).sort().join(','), 'A,B');
  chk(name, 'submittal', 'A carries exactly the invited fields it changed',
    Object.keys(sub.A || {}).sort().join(','), 'asks,ccar,cons,desc');
  chk(name, 'submittal', 'B carries only its record correction',
    Object.keys(sub.B || {}).sort().join(','), 'ccar');
  // The star, the band and the allocation are the portfolio team's calls. A package that could
  // carry them would turn a review into an argument about who decides what.
  ['mc', 'band', 'alloc', 'fsrc', 'awards', 'minInc'].forEach(k =>
    chk(name, 'submittal', `${k} is NOT something a PMO can propose`,
      JSON.stringify(sub).includes('"' + k + '"') ? 'carried' : 'withheld', 'withheld'));
  chk(name, 'submittal', 'the priority order is not sent',
    JSON.stringify(sub).includes('"order"') ? 'sent' : 'theirs to explore', 'theirs to explore');
  // JRNL_BIG caps a journalled value at 300 characters; an impact statement runs well past it.
  // This is why the package carries values rather than journal entries.
  chk(name, 'submittal', 'a long impact statement survives whole',
    (sub.A && sub.A.cons || '').length > 300 ? 'whole' : 'truncated', 'whole');

  // THE PACKAGE ITSELF, built the way the button builds it. Testing pmoSubmitBuild() alone leaves
  // the packaging untested -- and the baseline, which is the only thing that makes a conflict
  // knowable on the other end, is added during packaging.
  const wire = JSON.parse(P.ev(`(function(){ var cap=null; var _B=window.Blob;
    window.Blob=function(parts,opts){ cap=parts&&parts[0]; return new _B(parts,opts); };
    try{ pmoSubmit(); }catch(e){} window.Blob=_B; return cap; })()`));
  chk(name, 'submittal', 'the package says what it is', wire.dir, 'submit');
  chk(name, 'submittal', 'it is attributed to the sender', wire.by, 'PMO Lead');
  chk(name, 'submittal', 'and to the office it is from', wire.pmo, 'PSM');
  // THE SCOPE BITES HERE, between what changed and what is sent.
  chk(name, 'submittal', 'another office\u2019s requirement does not travel',
    Object.keys(wire.items || {}).sort().join(','), 'A');
  chk(name, 'submittal', 'it says which copy it came from',
    wire.fromTs > 0 ? 'dated' : 'undated', 'dated');
  // Without this the reviewing board has nothing to compare against and every field reads as
  // uncontested, however much has changed since the copy went out.
  chk(name, 'submittal', 'it carries the baseline it was published with',
    Object.keys(wire.base || {}).sort().join(','), 'A');
  chk(name, 'submittal', 'and the baseline holds the value each field started from',
    JSON.stringify((wire.base || {}).A && wire.base.A.asks),
    JSON.stringify([9000000, 2000000, 1000000]));
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.89 — saving never silently overwrites somebody’s work';
  try {
  const SVC = ['USAF', 'ANG', 'AFRC'];
  const mk = (id, ask) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Req ' + id, event: 'E' + id, ccar: '', fy26: [0, 0, 0], ask, alloc: null });
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const lsOf = ev => JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
  // Every question the board asks is recorded, and answered as the test says.
  // v1.95 (item 58): one writer per board file. These cases test the collision checks and work kept aside,
  // which still matter for one writer working from several browsers -- so every browser here holds the same
  // writer key, and the shared file records that writer. Two DIFFERENT writers are v1.95's own block.
  const WKEY = '0123456789abcdef0123456789abcdef';
  const wire = (ev, name) => ev(`localStorage.setItem('prio27writerKey', '${WKEY}'); localStorage.setItem('prio27who', ${JSON.stringify(name)}); globalThis.__q=[]; globalThis.__yes=false;
    window.confirm=function(q){ globalThis.__q.push(String(q)); return globalThis.__yes; }; window.alert=function(){};
    URL.createObjectURL=function(){ return 'blob:x'; }; URL.revokeObjectURL=function(){}; 'ok'`);
  const status = ev => ev(`(document.getElementById('shareStat')||{}).textContent||''`);
  const header = ev => ev(`(document.getElementById('saveState')||{}).textContent||''`);
  // THE FILE ON DISK: what Save reads, then writes. `fail` makes reading it throw, as a file mid-sync does.
  const disk = (w, content) => { const f = { name: 'Board.html', content, writes: 0, fail: false };
    w.__disk = { name: f.name, requestPermission: async () => 'granted',
      getFile: async () => { if (f.fail) throw new Error('the file is being synced'); return { text: async () => f.content }; },
      createWritable: async () => { let buf = ''; return { write: async x => { buf += String(x); }, close: async () => { f.content = buf; f.writes++; } }; } };
    w.eval(`FH=globalThis.__disk; window.showSaveFilePicker=function(){ throw new Error('the picker was opened'); }; 'ok'`);
    return f; };
  const saveNow = async (ev, yes) => { ev(`globalThis.__q=[]; globalThis.__yes=${!!yes}; 'ok'`); await ev('saveInPlaceFile()'); return JSON.parse(ev('JSON.stringify(globalThis.__q)')); };
  const note = (ev, id) => ev(`String(S.notes[${JSON.stringify(id)}]||'')`);
  // The file everyone shares, saved once.
  const A = boot(); seed(A.ev, { services: SVC, items: [mk('A', [900, 200, 100]), mk('B', [400, 100, 50])], disc: [2000, 600, 300], mand: [500, 150, 80], order: ['A', 'B'] });
  A.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`);
  A.ev(`localStorage.setItem('prio27writerKey', '${WKEY}'); if(typeof writerFp==='function') WRITER={by:'Brad', fp:writerFp(), t:1}; 'ok'`);
  const F1 = A.ev('buildSavedHtml()');
  await pause(20);
  // Brad opens it and saves it in place, so this browser knows which save its work came from.
  const brad = () => { const B = boot({ html: F1 }); wire(B.ev, 'Brad'); return B; };
  const colleague = (skew) => { const C = boot({ html: F1 }); wire(C.ev, 'Colleague');
    return C.ev(`(function(){ var real=Date.now; Date.now=function(){ return real()+(${skew || 0}); };
      S.notes.B='COLLEAGUE NOTE'; save(); var h=buildSavedHtml(); Date.now=real; return h; })()`); };

  // 1. THE COLLEAGUE SAVED FIRST; BRAD'S BROWSER HOLDS LATER EDITS, NEVER SAVED TO THE FILE.
  {
    const F2 = colleague(0); await pause(20);
    const B = brad(); B.ev(`S.notes.A='BRAD NOTE'; save(); 'ok'`);
    const R = boot({ html: F2, ls: lsOf(B.ev) }); wire(R.ev, 'Brad');
    const at = 'colleague saved first';
    chk(name, at, 'the board opens this browser’s copy, the newer one', note(R.ev, 'A') + '|' + note(R.ev, 'B'), 'BRAD NOTE|');
    chk(name, at, 'and says the file was saved by somebody since', /saved since then as well/.test(status(R.ev)) && /Colleague/.test(status(R.ev)), true);
    const f = disk(R.w, F2);
    const q = await saveNow(R.ev, false);
    chk(name, at, 'Save asks before it writes over their save', q.length === 1 && /HOLD ON/.test(q[0]) && /Colleague/.test(q[0]), true);
    chk(name, at, 'and, told no, writes nothing', f.writes + '|' + (f.content === F2), '0|true');
    const q2 = await saveNow(R.ev, true);
    chk(name, at, 'told yes, it writes', f.writes + '|' + /BRAD NOTE/.test(f.content), '1|true');
    const q3 = await saveNow(R.ev, false);
    chk(name, at, 'and its own save is the one the next Save checks against: no question', q3.length + '|' + f.writes, '0|2');
  }
  // 2. THE FILE IS NEWER: the colleague saved AFTER Brad's browser-only edits.
  {
    const B = brad(); B.ev(`S.notes.A='BRAD NOTE'; save(); 'ok'`); const lsB = lsOf(B.ev); await pause(20);
    const F2 = colleague(0);
    const R = boot({ html: F2, ls: lsB }); wire(R.ev, 'Brad');
    const at = 'the file is newer';
    chk(name, at, 'the board opens the file, the newer one', note(R.ev, 'A') + '|' + note(R.ev, 'B'), '|COLLEAGUE NOTE');
    chk(name, at, 'Brad’s work is kept aside, not lost', /BRAD NOTE/.test(R.ev(`localStorage.getItem(_AP.key+'.kept')||''`)), true);
    chk(name, at, 'and the board says so', /kept aside, not lost/.test(status(R.ev)), true);
    chk(name, at, 'the header says so for as long as it is kept', /work kept aside/.test(header(R.ev)), true);
    chk(name, at, 'and 📁 File offers to put it back', /Put back work kept aside/.test(R.ev(`document.getElementById('dd_share')? document.getElementById('dd_share').textContent : ''`)), true);
    R.ev(`globalThis.__yes=true; keptPutBack(); 'ok'`);
    chk(name, at, 'one click puts it back', note(R.ev, 'A') + '|' + note(R.ev, 'B') + '|' + R.ev(`String(localStorage.getItem(_AP.key+'.kept')===null)`), 'BRAD NOTE||true');
    const f = disk(R.w, F2);
    const q = await saveNow(R.ev, false);
    chk(name, at, 'and Save, put back, asks before writing over the colleague’s file', q.length === 1 && /HOLD ON/.test(q[0]) && f.writes === 0, true);
  }
  // 3. THE COLLEAGUE'S CLOCK IS AN HOUR SLOW: their later save carries an earlier time.
  {
    const B = brad(); B.ev(`S.notes.A='BRAD NOTE'; save(); 'ok'`); await pause(20);
    const F2 = colleague(-3600e3);
    const R = boot({ html: F2, ls: lsOf(B.ev) }); wire(R.ev, 'Brad');
    const at = 'a clock an hour slow';
    chk(name, at, 'the board shows this browser’s copy, and says the file was saved since', note(R.ev, 'A') + '|' + /saved since then as well/.test(status(R.ev)), 'BRAD NOTE|true');
    const f = disk(R.w, F2);
    const q = await saveNow(R.ev, false);
    chk(name, at, 'Save still asks: a save that is not the one this work came from, earlier or later', q.length === 1 && f.writes === 0, true);
  }
  // 4. NOBODY ELSE SAVED: Save writes, and asks nothing.
  {
    const R = boot({ html: F1 }); wire(R.ev, 'Brad');
    R.ev(`S.notes.A='mine'; save(); 'ok'`);
    const f = disk(R.w, F1);
    const q = await saveNow(R.ev, false);
    chk(name, 'nobody else saved', 'Save writes without asking', q.length + '|' + f.writes, '0|1');
    chk(name, 'nobody else saved', 'and the header says saved', /unsaved|downloaded/.test(header(R.ev)), false);
    // A FILE THAT CANNOT BE READ is never written over.
    f.fail = true; R.ev(`S.notes.A='again'; save(); 'ok'`);
    const q2 = await saveNow(R.ev, true);
    chk(name, 'a file that cannot be read', 'is not written over, and nothing is asked', q2.length + '|' + f.writes, '0|1');
    chk(name, 'a file that cannot be read', 'and the board says why', /Not saved/.test(status(R.ev)) && /could not be read/.test(status(R.ev)), true);
    // A FILE THAT IS NOT A BOARD is never written over either, and the next Save asks which file.
    f.fail = false; f.content = '<html><body>somebody else’s page</body></html>';
    await saveNow(R.ev, true);
    chk(name, 'a file that is not a board', 'is not written over', f.writes + '|' + /somebody else/.test(f.content), '1|true');
    chk(name, 'a file that is not a board', 'the board says so, and forgets that file', /not a board ORBIT can read/.test(status(R.ev)) + '|' + R.ev('String(FH===null)'), 'true|true');
    // AN EMPTY FILE is one the picker just made: nothing in it to lose.
    const g = disk(R.w, '');
    await saveNow(R.ev, false);
    chk(name, 'a new, empty file', 'is written', g.writes, 1);
  }
  // 5. A BROWSER COPY LAST OPENED BEFORE v1.89 recorded nothing; the journal decides.
  {
    const B = brad(); B.ev(`S.notes.A='BRAD NOTE'; save(); 'ok'`); const lsB = lsOf(B.ev); await pause(20);
    const F2 = colleague(0);
    Object.keys(lsB).filter(k => /\.base$/.test(k)).forEach(k => delete lsB[k]);
    const R = boot({ html: F2, ls: lsB }); wire(R.ev, 'Brad');
    chk(name, 'before v1.89, with work', 'work the file’s journal does not have is kept aside', /BRAD NOTE/.test(R.ev(`localStorage.getItem(_AP.key+'.kept')||''`)), true);
    const C = boot({ html: F1 }); wire(C.ev, 'Brad'); const lsC = lsOf(C.ev);
    Object.keys(lsC).filter(k => /\.base$/.test(k)).forEach(k => delete lsC[k]);
    lsC[C.ev('_AP.key')] = C.ev('JSON.stringify(MS)');
    const R2 = boot({ html: F2, ls: lsC });
    chk(name, 'before v1.89, nothing unsaved', 'a copy the file already holds opens the file, keeping nothing', R2.ev(`String(localStorage.getItem(_AP.key+'.kept')===null)`) + '|' + note(R2.ev, 'B'), 'true|COLLEAGUE NOTE');
  }
  // 6. NO ROOM TO KEEP IT: the newer file is NOT opened; the browser's work stays on screen.
  {
    const B = brad(); B.ev(`S.notes.A='BRAD NOTE'; save(); 'ok'`); const lsB = lsOf(B.ev); await pause(20);
    const F2 = colleague(0);
    const dom = new JSDOM(F2, { runScripts: 'dangerously', virtualConsole: new VirtualConsole(), url: 'https://example.invalid/board.html',
      beforeParse(w) { Object.keys(lsB).forEach(k => { try { w.localStorage.setItem(k, lsB[k]); } catch (e) {} });
        const orig = w.Storage.prototype.setItem;
        w.Storage.prototype.setItem = function (k, v) { if (/\.kept$/.test(k)) throw new w.DOMException('full', 'QuotaExceededError'); return orig.call(this, k, v); }; } });
    const ev = code => dom.window.eval(code);
    chk(name, 'no room to keep it', 'the file is not opened: this browser’s work stays on screen', note(ev, 'A') + '|' + note(ev, 'B'), 'BRAD NOTE|');
    chk(name, 'no room to keep it', 'and the board says why', /no room to keep it aside/.test(ev(`(document.getElementById('shareStat')||{}).textContent||''`)), true);
    try { dom.window.close(); } catch (e) {}
  }
  // 7. A DOWNLOAD IS NOT THE SHARED FILE.
  {
    const R = boot({ html: F1 }); wire(R.ev, 'Brad');
    R.ev(`S.notes.A='mine'; save(); publishState(); 'ok'`);
    chk(name, 'a download', 'the header says it is downloaded, not on the shared file yet', /downloaded — not on the shared file yet/.test(header(R.ev)), true);
    chk(name, 'a download', 'and the work still counts as unsaved', R.ev('String(DIRTY)'), 'true');
  }
  // 8. THE SHARED FOLDER. One stand-in folder, shared by two browsers.
  {
    const root = { files: {}, dirs: {}, fail: {} };
    const dirOf = st => ({ kind: 'directory', name: 'shared', queryPermission: async () => 'granted', requestPermission: async () => 'granted',
      getFileHandle: async (n, o) => { if (!(n in st.files)) { if (o && o.create) st.files[n] = ''; else { const e = new Error('not found'); e.name = 'NotFoundError'; throw e; } }
        return { kind: 'file', name: n,
          getFile: async () => { if (st.fail[n]) throw new Error('locked while it syncs'); return { text: async () => st.files[n] }; },
          createWritable: async () => { let buf = ''; return { write: async x => { buf += String(x); }, close: async () => { st.files[n] = buf; } }; } }; },
      getDirectoryHandle: async (n, o) => { if (st.fail['dir:' + n]) throw new Error('cannot make ' + n);
        if (!st.dirs[n]) { if (o && o.create) st.dirs[n] = { files: {}, dirs: {}, fail: {} }; else { const e = new Error('not found'); e.name = 'NotFoundError'; throw e; } }
        return dirOf(st.dirs[n]); },
      removeEntry: async n => { delete st.files[n]; },
      values: async function* () { for (const n of Object.keys(st.files)) yield { kind: 'file', name: n }; } });
    const folder = dirOf(root);
    const connect = (ev, w) => { w.__fold = folder;
      ev(`_liveCfg=Object.assign(liveCfg(), {store:true, mode:'drive', on:false}); _driveDir=globalThis.__fold; 'ok'`); };
    const push = async ev => { ev(`globalThis.__q=[]; 'ok'`); return await ev('driveStorePush(false)'); };
    const copyNote = (id) => { const k = Object.keys(root.files).find(n => /^spmt-\d+-.+\.json$/.test(n) && !/lock/.test(n)); const j = k ? JSON.parse(root.files[k]) : null;
      return j ? String((((j.store || {}).years || {})[j.store.cur] || {}).notes?.[id] || '') : ''; };
    const hist = () => Object.keys((root.dirs.history || { files: {} }).files).length;
    // Brad saves to the folder, then keeps working in his browser; the colleague saves after that.
    const P = boot({ html: F1 }); wire(P.ev, 'Brad'); connect(P.ev, P.w);
    P.ev(`S.notes.A='BRAD PUSHED'; save(); 'ok'`);
    chk(name, 'folder', 'Brad’s first save to the folder goes in', String(await push(P.ev)), 'true');
    await pause(20);
    const Q = boot({ html: F1 }); wire(Q.ev, 'Colleague'); connect(Q.ev, Q.w);
    await Q.ev('driveStorePull(true)');
    Q.ev(`S.notes.B='COLLEAGUE PUSHED'; save(); 'ok'`);
    chk(name, 'folder', 'the colleague loads it, and saves after it', String(await push(Q.ev)) + '|' + copyNote('B'), 'true|COLLEAGUE PUSHED');
    await pause(20);
    P.ev(`S.notes.A='BRAD LATER'; save(); 'ok'`);
    const R = boot({ html: F1, ls: lsOf(P.ev) }); wire(R.ev, 'Brad'); connect(R.ev, R.w);
    await R.ev('driveStorePull(false)');
    chk(name, 'folder, reopened', 'a colleague saved after the copy this work came from: the board says so on opening',
      /after the copy you are working from/.test(status(R.ev)) && note(R.ev, 'A') === 'BRAD LATER', true);
    const pushed = await push(R.ev);
    chk(name, 'folder, reopened', 'and Save does not write over their copy unasked', String(pushed) + '|' + copyNote('B'), 'false|COLLEAGUE PUSHED');
    // CHOICE ONE: save mine over theirs -- theirs goes into the folder's history first.
    const h0 = hist();
    R.ev(`globalThis.__yes=true; 'ok'`); await R.ev(`driveResolve('mine')`);
    chk(name, 'folder, reopened', '“Save yours over theirs” keeps theirs in the history, then writes', (hist() > h0) + '|' + copyNote('A'), 'true|BRAD LATER');
    // CHOICE TWO, on the colleague's side now: load theirs, with this browser's work kept aside.
    Q.ev(`S.notes.B='COLLEAGUE AGAIN'; save(); 'ok'`);
    const qp = await push(Q.ev);
    chk(name, 'folder, the other side', 'the colleague’s next Save is stopped the same way', String(qp), 'false');
    Q.ev(`globalThis.__yes=true; 'ok'`); await Q.ev(`driveResolve('theirs')`);
    chk(name, 'folder, the other side', '“Load theirs” loads Brad’s copy and keeps the colleague’s work aside',
      note(Q.ev, 'A') + '|' + /COLLEAGUE AGAIN/.test(Q.ev(`localStorage.getItem(_AP.key+'.kept')||''`)), 'BRAD LATER|true');
    // A FOLDER COPY THAT CANNOT BE READ is never written over.
    const nm = Object.keys(root.files).find(n => /^spmt-\d+-.+\.json$/.test(n) && !/lock/.test(n));
    const before = root.files[nm]; root.fail[nm] = true;
    R.ev(`S.notes.A='WHILE LOCKED'; save(); 'ok'`);
    const pl = await push(R.ev);
    chk(name, 'folder, unreadable', 'a copy that cannot be read is not written over', String(pl) + '|' + (root.files[nm] === before), 'false|true');
    chk(name, 'folder, unreadable', 'and the board says so', /could not be read/.test(status(R.ev)) && /Nothing was written/.test(status(R.ev)), true);
    root.fail[nm] = false;
    // A HISTORY COPY THAT COULD NOT BE KEPT is said. (An ordinary save; the one it replaces is Brad's own.)
    // v1.97 (item 79, Brad 5 Oct 2026): and nothing is written -- it saved all the same until then.
    await R.ev('driveStorePull(true)');
    root.dirs.history.files = {};                    // no recent copy, so this save would keep one
    root.fail['dir:history'] = true;
    R.ev(`S.notes.A='NO HISTORY'; save(); 'ok'`);
    const ph = await push(R.ev);
    chk(name, 'folder, history', 'a save whose history copy fails writes nothing, and says the copy was not kept',
      String(ph) + '|' + /could not be kept in the folder/.test(status(R.ev)), 'false|true');
    root.fail['dir:history'] = false;
    // PUTTING AN EARLIER COPY BACK, THEN SAVING. The copy standing now goes into the history whatever
    // the spacing, and Save then writes: on v1.88 the base was the old copy's own time, so Save found a
    // "newer" copy in the folder and refused, every time.
    // THE CLOCK STANDS STILL across the save and the put-back (v1.92), so the history copy each keeps
    // lands in the SAME second -- the case a reused name loses a copy in. Left to the wall clock, the two
    // fell in one second only when the machine was quick, and the math gate, running four suites at once,
    // let the reused-name mutation through.
    await pause(20);
    R.ev(`globalThis.__now0=Date.now; globalThis.__t0=Date.now(); Date.now=function(){ return globalThis.__t0; }; 'ok'`);
    R.ev(`S.notes.A='BEFORE RESTORE'; save(); 'ok'`); await push(R.ev);
    await R.ev('driveHistShow()');
    const h1 = hist(), standing = copyNote('A');
    R.ev(`globalThis.__yes=true; 'ok'`); await R.ev('driveRestore(0)');
    R.ev(`Date.now=globalThis.__now0; 'ok'`);
    chk(name, 'folder, restore', 'the copy standing now is kept in the history first, under a name of its own, in the same second',
      (hist() > h1) + '|' + standing, 'true|BEFORE RESTORE');
    const rp = await push(R.ev);
    chk(name, 'folder, restore', 'and Save then writes the copy put back', String(rp) + '|' + (copyNote('A') !== 'BEFORE RESTORE'), 'true|true');
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.95 — Save acknowledges exactly what it wrote (the file)';
  const H = W1H;
  try {
    const F1 = H.baseFile('Brad', H.KEY.brad);
    // 1. AN EDIT WHILE THE FILE IS BEING WRITTEN is not in the file -- and the board says it is not saved.
    {
      const R = boot({ html: F1 }); H.wire(R.ev, 'Brad', H.KEY.brad);
      R.ev(`setNote('A','BEFORE'); 'ok'`);
      const f = H.disk(R.w, F1); f.hold.write = H.gate(); const g = f.hold.write;
      const p = R.ev('saveInPlaceFile()');
      await H.until(() => f.hits.write >= 1);
      R.ev(`setNote('A','LATE'); 'ok'`);
      g.open(); await p;
      const fl = H.flags(R.ev);
      chk(name, 'edit during the write', 'the file holds what was built, the screen the later edit', H.fileNote(f.content, 'A') + '|' + H.note(R.ev, 'A'), 'BEFORE|LATE');
      chk(name, 'edit during the write', 'and the later edit is still marked unsaved, here and in this browser’s record', fl.DIRTY + '|' + fl.base.dirty, 'true|true');
      chk(name, 'edit during the write', 'the copy this work came from is the one it wrote', fl.LASTKNOWN === H.fileTs(f.content), true);
      chk(name, 'edit during the write', 'and the board says the change is not in the file yet', /not in the file yet/.test(H.status(R.ev)), true);
      R.ev('globalThis.__q=[]; 0');
      await R.ev('saveInPlaceFile()');
      chk(name, 'edit during the write', 'the next Save asks nothing and writes the later edit', H.qs(R.ev).length + '|' + H.fileNote(f.content, 'A') + '|' + R.ev('String(DIRTY)'), '0|LATE|false');
    }
    // 2. AN EDIT WHILE THE FILE IS BEING CLOSED: the same.
    {
      const R = boot({ html: F1 }); H.wire(R.ev, 'Brad', H.KEY.brad);
      R.ev(`setNote('A','BEFORE'); 'ok'`);
      const f = H.disk(R.w, F1); f.hold.close = H.gate(); const g = f.hold.close;
      const p = R.ev('saveInPlaceFile()');
      await H.until(() => f.hits.close >= 1);
      R.ev(`setAlloc('A','777'); 'ok'`);
      g.open(); await p;
      const st = H.fileStore(f.content), al = (((st.years || {})[st.cur] || {}).alloc || {}).A;
      chk(name, 'edit during the close', 'the allocation typed during the close is not in the file, and stays unsaved', String(!!al) + '|' + R.ev('String(DIRTY)'), 'false|true');
    }
    // 3. A YEAR SWITCH AND AN EDIT IN THE OTHER YEAR while the file is being written.
    {
      const R = boot({ html: F1 }); H.wire(R.ev, 'Brad', H.KEY.brad);
      R.ev(`switchYear(2028); switchYear(2027); 'ok'`);
      const f0 = H.disk(R.w, F1); await R.ev('saveInPlaceFile()');
      const f = H.disk(R.w, f0.content); f.hold.write = H.gate(); const g = f.hold.write;
      const p = R.ev('saveInPlaceFile()');
      await H.until(() => f.hits.write >= 1);
      R.ev(`switchYear(2028); setNote('A','FY28 EDIT'); 'ok'`);
      g.open(); await p;
      chk(name, 'year switch during the write', 'the FY28 edit is not in the file, and stays unsaved', H.fileNote(f.content, 'A', 2028) + '|' + R.ev('String(DIRTY)'), '|true');
      await R.ev('saveInPlaceFile()');
      chk(name, 'year switch during the write', 'the next Save writes it', H.fileNote(f.content, 'A', 2028), 'FY28 EDIT');
    }
    // 4. TWO SAVES AT ONCE: the second waits for the first, then writes the latest state.
    {
      const R = boot({ html: F1 }); H.wire(R.ev, 'Brad', H.KEY.brad);
      R.ev(`setNote('A','ONE'); 'ok'`);
      const f = H.disk(R.w, F1); f.hold.write = H.gate(); const g = f.hold.write;
      const p1 = R.ev('saveInPlace()');
      await H.until(() => f.hits.write >= 1);
      R.ev(`setNote('A','TWO'); 'ok'`);
      const p2 = R.ev('saveInPlace()');
      for (let i = 0; i < 200; i++) await H.tick();
      chk(name, 'two saves', 'the second does not start while the first is writing', String(f.hits.open || 0), '1');
      g.open(); await p1; await p2;
      const fl = H.flags(R.ev);
      chk(name, 'two saves', 'the file ends with the latest state, saved, and records the copy it wrote',
        H.fileNote(f.content, 'A') + '|' + fl.DIRTY + '|' + (fl.LASTKNOWN === H.fileTs(f.content)) + '|' + f.writes, 'TWO|false|true|2');
    }
    // 5. A FILE HOLDING SEVERAL APPROPRIATIONS, one saved by a colleague whose clock is an hour ahead:
    // the copy this work came from is the FILE's time, so the next Save asks nothing.
    {
      const P = H.pubOf(F1), ff = JSON.parse(JSON.stringify(P.appns.om)); ff.ts = Date.now() + 3600e3; ff.by = 'Colleague'; P.appns.ff = ff;
      const F2 = F1.replace(/(<script type="application\/json" id="pubState">)[\s\S]*?(<\/script>)/, (m, a, b) => a + JSON.stringify(P).replace(/</g, '\\u003c') + b);
      const R = boot({ html: F2 }); H.wire(R.ev, 'Brad', H.KEY.brad);
      R.ev(`setNote('A','MINE'); 'ok'`);
      const f = H.disk(R.w, F2);
      await R.ev('saveInPlaceFile()');
      R.ev(`setNote('A','MINE AGAIN'); globalThis.__q=[]; 'ok'`);
      await R.ev('saveInPlaceFile()');
      chk(name, 'several appropriations', 'nobody else saved: the second Save asks nothing and writes', H.qs(R.ev).length + '|' + H.fileNote(f.content, 'A'), '0|MINE AGAIN');
    }
    // 6. CONTROL: a write that fails leaves everything unsaved, as before.
    {
      const R = boot({ html: F1 }); H.wire(R.ev, 'Brad', H.KEY.brad);
      R.ev(`setNote('A','X'); 'ok'`);
      const f = H.disk(R.w, F1); f.failClose = new Error('disk full');
      await R.ev('saveInPlaceFile()');
      const fl = H.flags(R.ev);
      chk(name, 'a failed write', 'nothing is marked saved', f.writes + '|' + fl.DIRTY + '|' + fl.base.dirty, '0|true|true');
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
await (async () => {
  const __bm = bootMark();
  const name = 'v1.95 — Save acknowledges exactly what it wrote (the shared folder)';
  const H = W1H;
  try {
    const F1 = H.baseFile('Brad', H.KEY.brad);
    // 1. AN EDIT WHILE EACH WRITE IS HELD -- the history copy, the copy itself, the lock.
    for (const kind of ['hist', 'main', 'lock']) {
      const fold = H.folder();
      const R = boot({ html: F1 }); H.wire(R.ev, 'Brad', H.KEY.brad); H.connect(R.ev, R.w, fold);
      R.ev(`setNote('A','FIRST'); 'ok'`); await R.ev('driveStorePush(false)');
      fold.root.dirs.history = undefined;   // let the next save keep a history copy now, not ten minutes later
      R.ev(`setNote('A','BEFORE'); 'ok'`);
      fold.hold[kind] = H.gate(); const g = fold.hold[kind];
      const p = R.ev('driveStorePush(false)');
      await H.until(() => (fold.hits[kind] || 0) >= (kind === 'hist' ? 1 : 2));
      R.ev(`setNote('A','LATE'); 'ok'`);
      g.open(); await p;
      const fl = H.flags(R.ev), copy = fold.copy(2027);
      chk(name, 'edit during the ' + kind + ' write', 'the folder copy holds what was built; the later edit stays unsaved',
        fold.note(2027, 'A') + '|' + fl.DIRTY + '|' + fl.base.dirty, 'BEFORE|true|true');
      chk(name, 'edit during the ' + kind + ' write', 'the copy this work came from is the one it wrote', fl.driveBase['om|2027'] === copy.store.ts, true);
      await R.ev('driveStorePull(false)');
      chk(name, 'edit during the ' + kind + ' write', 'the next refresh raises no false clash', /after the copy you are working from/.test(H.status(R.ev)), false);
      await R.ev('driveStorePush(false)');
      chk(name, 'edit during the ' + kind + ' write', 'and the next save writes the later edit', fold.note(2027, 'A') + '|' + R.ev('String(DIRTY)'), 'LATE|false');
    }
    // 2. A YEAR SWITCH WHILE THE HISTORY COPY IS WRITTEN: the save stays with FY27, and FY28's copy is untouched.
    {
      const fold = H.folder();
      const R = boot({ html: F1 }); H.wire(R.ev, 'Brad', H.KEY.brad); H.connect(R.ev, R.w, fold);
      R.ev(`switchYear(2028); setNote('A','FY28 COPY'); 'ok'`); await R.ev('driveStorePush(false)');
      R.ev(`switchYear(2027); setNote('A','FY27 FIRST'); 'ok'`); await R.ev('driveStorePush(false)');
      fold.root.dirs.history = undefined;
      const fy28Before = fold.raw(2028);
      R.ev(`setNote('A','FY27 SECOND'); 'ok'`);
      fold.hold.hist = H.gate(); const g = fold.hold.hist;
      const p = R.ev('driveStorePush(false)');
      await H.until(() => (fold.hits.hist || 0) >= 1);
      R.ev(`switchYear(2028); 'ok'`);
      const logFrom = fold.log.length;
      g.open(); await p;
      chk(name, 'year switch during the write', 'FY28’s copy is byte-identical; FY27’s carries the FY27 save', String(fold.raw(2028) === fy28Before) + '|' + fold.note(2027, 'A'), 'true|FY27 SECOND');
      chk(name, 'year switch during the write', 'its lock and its record are FY27’s', fold.log.slice(logFrom).filter(x => /^lock:/.test(x)).join(',') + '|' + (H.flags(R.ev).driveBase['om|2027'] === fold.copy(2027).store.ts),
        'lock:spmt-2027-om.lock.json|true');
    }
    // 3. A SAVE QUEUED BEHIND ANOTHER keeps the year it was asked for: switched away, it does not run.
    {
      const fold = H.folder();
      const R = boot({ html: F1 }); H.wire(R.ev, 'Brad', H.KEY.brad); H.connect(R.ev, R.w, fold);
      R.ev(`switchYear(2028); setNote('A','FY28 COPY'); 'ok'`); await R.ev('driveStorePush(false)');
      R.ev(`switchYear(2027); setNote('A','FY27 ONE'); 'ok'`);
      fold.hold.main = H.gate(); const g = fold.hold.main;
      const p1 = R.ev('saveInPlace()');
      await H.until(() => (fold.hits.main || 0) >= 2);
      R.ev(`setNote('A','FY27 TWO'); 'ok'`);
      const p2 = R.ev('saveInPlace()');           // asked for FY27
      R.ev(`switchYear(2028); 'ok'`);
      const fy28Before = fold.raw(2028);
      g.open(); await p1; await p2;
      chk(name, 'a queued save', 'it never runs for FY28: FY28’s copy is untouched, and the board says so',
        String(fold.raw(2028) === fy28Before) + '|' + /did not run/.test(H.status(R.ev)), 'true|true');
    }
    // 4. THE AUTOSAVE AND THE SAVE BUTTON AT ONCE: one after the other; the folder ends with the latest state.
    {
      const fold = H.folder();
      const R = boot({ html: F1 }); H.wire(R.ev, 'Brad', H.KEY.brad); H.connect(R.ev, R.w, fold);
      R.ev(`setNote('A','FIRST'); 'ok'`); await R.ev('driveStorePush(false)');
      R.ev(`setNote('A','ONE'); 'ok'`);
      fold.hold.main = H.gate(); const g = fold.hold.main;
      const p1 = R.ev('driveStorePush(true)');
      await H.until(() => (fold.hits.main || 0) >= 2);
      R.ev(`setNote('A','TWO'); 'ok'`);
      const p2 = R.ev('saveInPlace()');
      for (let i = 0; i < 200; i++) await H.tick();
      chk(name, 'autosave and Save', 'the Save waits for the autosave', String(fold.hits.main), '2');
      g.open(); await p1; await p2;
      chk(name, 'autosave and Save', 'the folder ends with the latest state, saved', fold.note(2027, 'A') + '|' + R.ev('String(DIRTY)'), 'TWO|false');
    }
    // 5. CONTROL: a write that fails leaves the work unsaved and the record unchanged.
    {
      const fold = H.folder();
      const R = boot({ html: F1 }); H.wire(R.ev, 'Brad', H.KEY.brad); H.connect(R.ev, R.w, fold);
      R.ev(`setNote('A','FIRST'); 'ok'`); await R.ev('driveStorePush(false)');
      const b0 = H.flags(R.ev).driveBase['om|2027'];
      R.ev(`setNote('A','SECOND'); 'ok'`); fold.failNext.main = new Error('the share went away');
      try { await R.ev('driveStorePush(false)'); } catch (e) {}
      const fl = H.flags(R.ev);
      chk(name, 'a failed write', 'nothing is marked saved, and the record is unchanged', fl.DIRTY + '|' + fl.base.dirty + '|' + (fl.driveBase['om|2027'] === b0) + '|' + fold.note(2027, 'A'), 'true|true|true|FIRST');
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
await (async () => {
  const __bm = bootMark();
  const name = 'v1.95 — work kept aside is never replaced without asking';
  const H = W1H;
  try {
    const F1 = H.baseFile('Brad', H.KEY.brad);
    const colleague = (html, text) => { const C = boot({ html }); H.wire(C.ev, 'Colleague', H.KEY.brad);
      return C.ev(`(function(){ setNote('B', ${H.J(text)}); return buildSavedHtml(); })()`); };
    const kept = ev => ev(`localStorage.getItem(_AP.key+'.kept')||''`);
    const anywhere = (ls, text) => Object.values(ls).some(v => String(v).includes(text));
    // 1. THE BOOT PATH, TWICE: earlier kept work is not replaced; the newer file is not opened.
    const B = boot({ html: F1 }); H.wire(B.ev, 'Brad', H.KEY.brad); B.ev(`setNote('A','BRAD ONE'); 'ok'`); const lsB = H.lsOf(B.ev);
    await H.pause(15); const F2 = colleague(F1, 'COLLEAGUE ONE');
    const R = boot({ html: F2, ls: lsB }); H.wire(R.ev, 'Brad', H.KEY.brad);
    chk(name, 'boot, twice', 'the first newer file keeps BRAD ONE aside', /BRAD ONE/.test(kept(R.ev)), true);
    R.ev(`setNote('A','BRAD TWO'); 'ok'`); const lsR = H.lsOf(R.ev);
    await H.pause(15); const F3 = colleague(F2, 'COLLEAGUE TWO');
    const R2 = boot({ html: F3, ls: lsR }); H.wire(R2.ev, 'Brad', H.KEY.brad);
    const ls2 = H.lsOf(R2.ev);
    chk(name, 'boot, twice', 'the second newer file is not opened: BRAD TWO stays on screen, BRAD ONE stays kept',
      H.note(R2.ev, 'A') + '|' + H.note(R2.ev, 'B') + '|' + /BRAD ONE/.test(kept(R2.ev)), 'BRAD TWO|COLLEAGUE ONE|true');
    chk(name, 'boot, twice', 'both works are in this browser', anywhere(ls2, 'BRAD ONE') + '|' + anywhere(ls2, 'BRAD TWO'), 'true|true');
    chk(name, 'boot, twice', 'and the board says why, offering what to do with the kept work', /never replaced/.test(H.status(R2.ev)) && /save it as a file/.test(H.status(R2.ev)), true);
    // 2. SAVE IT AS A FILE: downloaded, and still kept.
    R2.ev('globalThis.__dl=0; keptSaveFile(); 0');
    chk(name, 'save it as a file', 'a file is downloaded and the work stays kept', R2.ev('String(globalThis.__dl)') + '|' + /BRAD ONE/.test(kept(R2.ev)), '1|true');
    // 3. PUT IT BACK: what is on screen, unsaved, takes its place in the slot.
    R2.ev('keptPutBack(); 0');
    chk(name, 'put back', 'BRAD ONE is back on screen, and BRAD TWO is kept aside in its place', H.note(R2.ev, 'A') + '|' + /BRAD TWO/.test(kept(R2.ev)), 'BRAD ONE|true');
    // 4. THE FOLDER'S REFRESH, and "Load theirs": earlier kept work blocks both.
    for (const how of ['pull', 'theirs']) {
      const fold = H.folder();
      const P = boot({ html: F1 }); H.wire(P.ev, 'Brad', H.KEY.brad); H.connect(P.ev, P.w, fold);
      P.ev(`setNote('A','FOLDER BASE'); 'ok'`); await P.ev('driveStorePush(false)');
      P.ev(`keepAside({kept:'EARLIER WORK'}, {why:'file', by:'x', ts:1}); setNote('A','NEW WORK'); 'ok'`);
      const lsP = H.lsOf(P.ev);
      await H.pause(15);
      const C = boot({ html: F1 }); H.wire(C.ev, 'Colleague', H.KEY.brad); H.connect(C.ev, C.w, fold);
      await C.ev('driveStorePull(true)'); C.ev(`setNote('B','COLLEAGUE FOLDER'); 'ok'`); await C.ev('driveStorePush(false)');
      const Q = boot({ html: F1, ls: lsP }); H.wire(Q.ev, 'Brad', H.KEY.brad); H.connect(Q.ev, Q.w, fold);
      if (how === 'pull') await Q.ev('driveStorePull(false)'); else await Q.ev(`driveResolve('theirs')`);
      chk(name, 'folder ' + how, 'the newer copy is not loaded; the new work stays on screen and the earlier work stays kept',
        H.note(Q.ev, 'A') + '|' + /EARLIER WORK/.test(kept(Q.ev)), 'NEW WORK|true');
      chk(name, 'folder ' + how, 'and the board says the kept work is never replaced', /never replaced/.test(H.status(Q.ev)), true);
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
await (async () => {
  const __bm = bootMark();
  const name = 'v1.95 — one writer per board file';
  const H = W1H;
  try {
    const F0 = H.baseFile('nobody', H.KEY.carol, false);    // saved before v1.95: no writer recorded
    // 1. THE FIRST v1.95 SAVE asks to claim the file, then records the writer, and journals it.
    const A = boot({ html: F0 }); H.wire(A.ev, 'Alice', H.KEY.alice);
    A.ev(`setNote('A','ALICE'); 'ok'`);
    const f = H.disk(A.w, F0);
    await A.ev('saveInPlaceFile()');
    const q = H.qs(A.ev);
    chk(name, 'claim', 'a file with no writer asks once, then records Alice as its writer', q.length + '|' + /No writer is recorded/.test(q[0] || '') + '|' + H.fileWriter(f.content), '1|true|Alice');
    chk(name, 'claim', 'and the journal has one forced line for it', A.ev(`JSON.stringify((MS.jrnl||[]).filter(function(e){ return e.p && e.p[0]==='(writer)'; }).map(function(e){ return [e.b, e.f]; }))`), '[["Alice",1]]');
    // 2. ANOTHER BROWSER IS REFUSED, naming the writer; nothing is asked, written or downloaded.
    const B = boot({ html: f.content }); H.wire(B.ev, 'Bob', H.KEY.bob);
    B.ev(`setNote('A','BOB'); 'ok'`);
    const before = f.content; f.content = before; const fb = H.disk(B.w, before);
    await B.ev('saveInPlaceFile()');
    chk(name, 'not the writer', 'Bob’s Save is refused: the file is untouched, nothing asked or downloaded, his work unsaved',
      String(fb.content === before) + '|' + H.qs(B.ev).length + '|' + B.ev('String(globalThis.__dl)') + '|' + B.ev('String(DIRTY)'), 'true|0|0|true');
    chk(name, 'not the writer', 'and the board says Alice holds the pen', /Alice/.test(H.status(B.ev)) && /holds the pen/.test(H.status(B.ev)), true);
    // 3. A STALE HAND-OVER: Bob decided to take the pen from Alice, but Carol took it first -- refused.
    {
      const P = H.pubOf(fb.content); P.writer = { by: 'Carol', fp: 'zz-carol-fingerprint', t: 2 };
      const Fc = fb.content.replace(/(<script type="application\/json" id="pubState">)[\s\S]*?(<\/script>)/, (m, x, y) => x + JSON.stringify(P).replace(/</g, '\\u003c') + y);
      const fc = H.disk(B.w, Fc);
      B.ev(`_takePen={from:${H.J((H.pubOf(before).writer || {}).fp || '')}}; 'ok'`);
      await B.ev('saveInPlaceFile()');
      B.ev('_takePen=null; 0');
      chk(name, 'stale hand-over', 'taking the pen from Alice does not overwrite Carol’s', String(fc.content === Fc) + '|' + /Carol/.test(H.status(B.ev)), 'true|true');
    }
    // 4. TAKE THE PEN: asked first, saved, recorded; Alice's next Save is then refused, naming Bob.
    H.disk(B.w, before);
    const fb2 = H.disk(B.w, before);
    B.ev('globalThis.__q=[]; 0');
    await B.ev('takePen()');
    const tq = H.qs(B.ev);
    chk(name, 'take the pen', 'it asks first, naming Alice and the permission hand-over, then saves with Bob as writer',
      tq.length + '|' + /from Alice/.test(tq[0] || '') + '|' + /write access/.test(tq[0] || '') + '|' + H.fileWriter(fb2.content) + '|' + H.fileNote(fb2.content, 'A'), '1|true|true|Bob|BOB');
    chk(name, 'take the pen', 'the journal records the pen moving from Alice to Bob', B.ev(`JSON.stringify((MS.jrnl||[]).filter(function(e){ return e.p && e.p[0]==='(writer)'; }).slice(-1).map(function(e){ return [e.a, e.b, e.f]; }))`), '[["Alice","Bob",1]]');
    A.ev(`setNote('A','ALICE LATER'); 'ok'`);
    const fa = H.disk(A.w, fb2.content);
    await A.ev('saveInPlaceFile()');
    chk(name, 'take the pen', 'Alice’s next Save is refused, naming Bob; her work stays on her screen, unsaved',
      String(fa.content === fb2.content) + '|' + /Bob/.test(H.status(A.ev)) + '|' + H.note(A.ev, 'A') + '|' + A.ev('String(DIRTY)'), 'true|true|ALICE LATER|true');
    // 5. A FILE THIS PERSON MAY NOT WRITE: said plainly; nothing downloaded; the work stays unsaved.
    {
      const fr = H.disk(B.w, fb2.content); fr.failOpen = Object.assign(new Error('write access denied'), { name: 'NotAllowedError' });
      B.ev(`setNote('A','BOB AGAIN'); globalThis.__dl=0; 'ok'`);
      await B.ev('saveInPlaceFile()');
      chk(name, 'read-only', 'the board says the file is read-only for you; nothing written or downloaded',
        /read-only for you/.test(H.status(B.ev)) + '|' + fr.writes + '|' + B.ev('String(globalThis.__dl)') + '|' + B.ev('String(DIRTY)'), 'true|0|0|true');
    }
    // 6. THE SHARED FOLDER: the first copy makes its writer; another browser is refused; both edits survive.
    {
      const fold = H.folder();
      const Al = boot({ html: F0 }); H.wire(Al.ev, 'Alice', H.KEY.alice); H.connect(Al.ev, Al.w, fold);
      Al.ev(`setNote('A','ALICE FOLDER'); 'ok'`); await Al.ev('driveStorePush(false)');
      chk(name, 'folder', 'the folder’s first copy is written without a question, Alice its writer', H.qs(Al.ev).length + '|' + ((fold.copy(2027) || {}).writer || {}).by, '0|Alice');
      const Bo = boot({ html: F0 }); H.wire(Bo.ev, 'Bob', H.KEY.bob); H.connect(Bo.ev, Bo.w, fold);
      await Bo.ev('driveStorePull(true)');
      Bo.ev(`setNote('B','BOB FOLDER'); 'ok'`);
      const raw0 = fold.raw(2027);
      const ok = await Bo.ev('driveStorePush(false)');
      chk(name, 'folder', 'Bob’s push is refused: the copy is untouched, his edit stays on his screen, unsaved',
        String(ok) + '|' + String(fold.raw(2027) === raw0) + '|' + H.note(Bo.ev, 'B') + '|' + Bo.ev('String(DIRTY)'), 'false|true|BOB FOLDER|true');
      chk(name, 'folder', 'both edits are retrievable: Alice’s in the folder, Bob’s in his browser', fold.note(2027, 'A') + '|' + H.note(Bo.ev, 'B'), 'ALICE FOLDER|BOB FOLDER');
      // A copy saved before v1.95 has no writer: the autosave never claims it without asking.
      const j = fold.copy(2027); delete j.writer; fold.root.files['spmt-2027-om.json'] = JSON.stringify(j);
      const raw1 = fold.raw(2027);
      const quiet = await Al.ev('driveStorePush(true)');
      chk(name, 'folder', 'the autosave does not claim a copy with no writer', String(quiet) + '|' + String(fold.raw(2027) === raw1), 'false|true');
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.95 — after an import that cannot be put back, nothing writes over the board file until asked';
  try {
  const { NEW, OLD } = w2Fx();
  const { J, wire, KEY, status, qs, lsOf, disk, folder, connect } = W1H;
  // IN THE SAME PAGE: storage refuses everything from the reprogramming log on, so the mark lives in this page only
  const T = boot({ html: OLD.html, ls: OLD.ls });
  const r = w2Import(T, NEW.html, 'stuck', 8);
  chk(name, 'fixture', 'CONTROL — the import stopped part-way and could not be put back', /could not be put back as it was/.test(r.stat), true);
  wire(T.ev, 'brad', KEY.brad);
  const f = disk(T.w, OLD.html);
  await T.ev('saveInPlaceFile()');
  chk(name, '💾 Save to the board file', 'refused: the file is not written, and the message says why and offers both copies',
    J([f.writes, f.content === OLD.html, /Saving to the board file is refused/.test(status(T.ev)), /this board as it was/.test(status(T.ev)) && /the file you imported/.test(status(T.ev))]),
    J([0, true, true, true]));
  const fold = folder(); connect(T.ev, T.w, fold);
  await T.ev('saveInPlace()');
  await T.ev('driveStorePush(true)');
  chk(name, '💾 Save to the shared folder', 'refused, the autosave included: nothing is written in the folder',
    J([Object.keys(fold.root.files).length, /Writing to the shared folder is refused/.test(status(T.ev))]), J([0, true]));
  T.ev(`_liveCfg=Object.assign(liveCfg(), {store:false}); 'ok'`);
  const dl0 = +T.ev('globalThis.__dl'); T.ev('publishState()');
  chk(name, '⬇ Save a copy', 'is never refused', +T.ev('globalThis.__dl') - dl0, 1);
  // A RELOAD: storage refuses only the ten lists, so the mark fits and is kept
  const T2 = boot({ html: OLD.html, ls: OLD.ls });
  w2Import(T2, NEW.html, 'stuckKeys', 8);
  const ls2 = lsOf(T2.ev);
  chk(name, 'reloaded', 'the mark is kept in browser storage', 'prio27impMixed' in ls2, true);
  const R = boot({ html: OLD.html, ls: ls2 });
  wire(R.ev, 'brad', KEY.brad);
  chk(name, 'reloaded', 'the opening message says what happened and that nothing writes over the board file',
    /A full import stopped part-way in this browser and could not be put back/.test(status(R.ev)) && /nothing writes over it/.test(status(R.ev)), true);
  const f2 = disk(R.w, OLD.html);
  await R.ev('saveInPlaceFile()');
  chk(name, 'reloaded', '💾 Save is still refused; the board file is not written', J([f2.writes, f2.content === OLD.html]), J([0, true]));
  // ALLOWING SAVE AGAIN is asked for by name; declined, nothing changes
  R.ev(`globalThis.__yes=false; impMixedClear(); 'ok'`);
  await R.ev('saveInPlaceFile()');
  chk(name, 'allow saving again', 'declined: still refused, the mark kept', J([f2.writes, 'prio27impMixed' in lsOf(R.ev)]), J([0, true]));
  chk(name, 'allow saving again', 'the question says the next save writes the mix over the board file',
    qs(R.ev).some(q => /^Allow 💾 Save again\?/.test(q) && /over the board file/.test(q)), true);
  R.ev(`globalThis.__yes=true; globalThis.__q=[]; impMixedClear(); 'ok'`);
  chk(name, 'allow saving again', 'allowed: the mark is gone', 'prio27impMixed' in lsOf(R.ev), false);
  await R.ev('saveInPlaceFile()');
  chk(name, 'allow saving again', 'and 💾 Save writes the board file', f2.writes, 1);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.95 — ⬆ Publish now in the shared folder is the folder save, with its checks';
  try {
  const { J, wire, KEY, status, baseFile, folder, connect } = W1H;
  const F1 = baseFile('Alice', KEY.alice);
  const fold = folder();
  const A = boot({ html: F1 }); wire(A.ev, 'Alice', KEY.alice); connect(A.ev, A.w, fold);
  A.ev(`setNote('A','ALICE WORK'); 'ok'`); await A.ev('driveStorePush(false)');
  chk(name, 'fixture', 'CONTROL — Alice, the writer, saved to the folder', J([fold.note(2027, 'A'), (fold.copy(2027).writer || {}).by || null]), J(['ALICE WORK', 'Alice']));
  // another browser: its Save is refused (item 58), and so is its Publish now
  const B = boot({ html: F1 }); wire(B.ev, 'Bob', KEY.bob); connect(B.ev, B.w, fold);
  B.ev(`setNote('A','BOB WORK'); 'ok'`);
  const raw0 = fold.raw(2027);
  const rb = await B.ev('livePublish(false)');
  chk(name, 'another writer', 'Bob’s Publish now is refused: the folder’s copy stays Alice’s, byte for byte', J([rb, fold.raw(2027) === raw0]), J([false, true]));
  // the writer: Publish now is her folder save -- her work, her writer record, the copy before it kept in the history
  A.ev(`setNote('A','ALICE AGAIN'); 'ok'`);
  const h0 = fold.hist().length;
  const ra = await A.ev('livePublish(false)');
  chk(name, 'the writer', 'Alice’s Publish now saves: her work, her writer record, the copy before it kept in the folder’s history',
    J([ra, fold.note(2027, 'A'), (fold.copy(2027).writer || {}).by || null, fold.hist().length > h0]), J([true, 'ALICE AGAIN', 'Alice', true]));
  // someone only watching: not offered, and refused with the reason if it is called
  const C = boot({ html: F1 }); wire(C.ev, 'Carol', KEY.carol); connect(C.ev, C.w, fold); C.ev(`_liveCfg.store=false; 'ok'`);
  const raw1 = fold.raw(2027);
  const offeredTo = (X) => X.ev(`(function(){ liveOpen=true; try{ liveBody(); }catch(e){} return /Publish now/.test((document.getElementById('liveBody')||{}).innerHTML||''); })()`);
  chk(name, 'a watcher', 'CONTROL — the writer, working out of the folder, is offered Publish now', offeredTo(A), true);
  const offered = offeredTo(C);
  const rc = await C.ev('livePublish(false)');
  chk(name, 'a watcher', 'someone only watching is not offered Publish now, is refused and told why, and the folder is untouched',
    J([offered, rc, /Not published/.test(status(C.ev)) && /watching this folder/.test(status(C.ev)), fold.raw(2027) === raw1]), J([false, false, true, true]));
  // a failed import's mix is never published
  A.ev(`localStorage.setItem(IMP_MIXED_KEY, JSON.stringify({t:1, file:'x.html'})); setNote('A','MIXED'); 'ok'`);
  const raw2 = fold.raw(2027);
  const rm = await A.ev('livePublish(false)');
  chk(name, 'a failed import', 'while a failed import’s mix stands, Publish now writes nothing', J([rm, fold.raw(2027) === raw2]), J([false, true]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.95 — ↶ Put this back keeps unsaved work aside first';
  try {
  const { J, wire, KEY, status, baseFile, folder, connect } = W1H;
  const F1 = baseFile('Alice', KEY.alice);
  const fold = folder();
  const A = boot({ html: F1 }); wire(A.ev, 'Alice', KEY.alice); connect(A.ev, A.w, fold);
  A.ev(`setNote('A','FIRST'); 'ok'`); await A.ev('driveStorePush(false)');
  fold.root.dirs.history = undefined;
  A.ev(`setNote('A','SECOND'); 'ok'`); await A.ev('driveStorePush(false)');
  chk(name, 'fixture', 'CONTROL — the folder’s history holds the earlier copy', fold.hist().length, 1);
  const kept = () => A.ev(`(function(){ var k=keptCopy(); return k? k.raw : ''; })()`);
  A.ev(`setNote('A','UNSAVED WORK'); 'ok'`);
  await A.ev('driveHistShow()'); await A.ev('driveRestore(0)');
  chk(name, 'put back', 'the earlier copy is on screen, and the unsaved work is kept aside, with a way to put it back',
    J([A.ev('S.notes.A'), /UNSAVED WORK/.test(kept()), /kept aside/.test(status(A.ev))]), J(['FIRST', true, true]));
  // other work already kept aside: nothing is put back, and both survive
  A.ev(`setNote('A','MORE WORK'); 'ok'`);
  await A.ev('driveHistShow()'); await A.ev('driveRestore(0)');
  chk(name, 'work already kept', 'with other work already kept aside, nothing is put back: the screen and the kept work both survive',
    J([A.ev('S.notes.A'), /UNSAVED WORK/.test(kept())]), J(['MORE WORK', true]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.96 — ↶ Put this back never drops an edit typed while the folder is written (NR01)';
  try {
  const { J, wire, KEY, status, baseFile, folder, connect, gate, until } = W1H;
  const F1 = baseFile('Alice', KEY.alice);
  // a board whose folder history holds the copy noted HISTORY, and whose folder copy now is CURRENT -- saved, so clean
  const fresh = async () => {
    const fold = folder(); const A = boot({ html: F1 }); wire(A.ev, 'Alice', KEY.alice); connect(A.ev, A.w, fold);
    A.ev(`setNote('A','HISTORY'); 'ok'`); await A.ev('driveStorePush(false)');
    fold.root.dirs.history = undefined;
    A.ev(`setNote('A','CURRENT'); 'ok'`); await A.ev('driveStorePush(false)');
    await A.ev('driveHistShow()');
    return { A, fold };
  };
  const kept = ev => ev(`(function(){ var k=keptCopy(); return k? k.raw : ''; })()`);
  const restoreWith = async (A, fold, during) => {
    // the restore's own history write, not one made while the board was set up
    const h0 = fold.hits.hist || 0;
    fold.hold.hist = gate(); const g = fold.hold.hist;
    const p = A.ev('driveRestore(0)');
    await until(() => (fold.hits.hist || 0) > h0);
    A.ev(during + `; 'ok'`);
    g.open(); await p;
  };
  { const { A, fold } = await fresh();
    chk(name, 'fixture', 'CONTROL — the history holds the earlier copy and the board starts clean', J([fold.hist().length, A.ev('String(DIRTY)')]), J([1, 'false']));
    await restoreWith(A, fold, `setNote('A','LATE NOTE')`);
    chk(name, 'clean start, late edit', 'the earlier copy is put back and the note typed meanwhile is kept aside, with the board saying so',
      J([A.ev('S.notes.A'), /LATE NOTE/.test(kept(A.ev)), /kept aside/.test(status(A.ev))]), J(['HISTORY', true, true])); }
  { const { A, fold } = await fresh();
    A.ev(`setNote('A','DIRTY ONE'); 'ok'`);
    await restoreWith(A, fold, `setNote('A','DIRTY TWO')`);
    chk(name, 'already unsaved, late edit', 'what is kept aside is the work as it stood when the copy was put back, the later edit included',
      J([A.ev('S.notes.A'), /DIRTY TWO/.test(kept(A.ev))]), J(['HISTORY', true])); }
  { const { A, fold } = await fresh();
    await restoreWith(A, fold, `switchYear(2028)`);
    chk(name, 'a year switch meanwhile', 'nothing is put back: FY27 still holds the current copy, the board is on FY28, and it says why',
      J([A.ev('MS.cur'), A.ev(`String(((MS.years[2027]||{}).notes||{}).A||'')`), /another appropriation or year/.test(status(A.ev))]), J([2028, 'CURRENT', true])); }
  { const { A, fold } = await fresh();
    A.ev(`localStorage.setItem(_AP.key+'.kept', JSON.stringify({t:1, why:'folder', by:'X', ts:0, base:{}})+'\\n'+JSON.stringify({other:'KEPT BEFORE'})); _keptMeta=keptCopy().meta; 'ok'`);
    await restoreWith(A, fold, `setNote('A','LATE TWO')`);
    chk(name, 'other work already kept', 'nothing is put back: the note typed meanwhile stays on screen, and the earlier kept work is untouched',
      J([A.ev('S.notes.A'), /KEPT BEFORE/.test(kept(A.ev))]), J(['LATE TWO', true])); }
  { const { A, fold } = await fresh();
    A.ev(`globalThis.__si=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(/\.kept$/.test(k)) throw new DOMException('The quota has been exceeded.','QuotaExceededError'); return globalThis.__si.call(this,k,v); }; 'ok'`);
    await restoreWith(A, fold, `setNote('A','LATE THREE')`);
    A.ev(`Storage.prototype.setItem=globalThis.__si; 'ok'`);
    chk(name, 'storage refuses to keep it', 'nothing is put back, and the note typed meanwhile stays on screen and in this browser',
      J([A.ev('S.notes.A'), /LATE THREE/.test(A.ev(`localStorage.getItem(_AP.key)||''`)), /Nothing was put back/.test(status(A.ev))]), J(['LATE THREE', true, true])); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.97 — every list the file carries marks the board unsaved, at each wait of the file save';
  const V = V197W2, H = V.H;
  try {
    const F1 = H.baseFile('Brad', H.KEY.brad);
    for (const L of V.LISTS) {
      const mk = bootMark();
      const R = await V.open(F1, L);
      const f = H.disk(R.w, F1);
      await R.ev('saveInPlaceFile()');
      chk(name, L.k + ' — the start', 'a saved board reads Saved, its list in the file (a control)', V.saved(R.ev) + '|' + (L.file(H.pubOf(f.content)) === R.ev(L.live)), 'true|true');
      // AN EDIT WHILE NOTHING IS BEING SAVED marks the board unsaved: the review's reproduction.
      await V.run(R.ev, L.edit('W2 IDLE'));
      chk(name, L.k + ' — an edit', L.what + ': the board reads unsaved' + (L.saves ? ' (a control: this door also calls save())' : ''), V.unsaved(R.ev), true);
      await R.ev('saveInPlaceFile()');
      chk(name, L.k + ' — an edit', 'Save writes it and the board reads saved again (a control)', (L.file(H.pubOf(f.content)) === R.ev(L.live)) + '|' + V.saved(R.ev), 'true|true');
      // AT EACH WAIT. Before the bytes are built (the read), the edit is in them; after (open, write, close), it is not,
      // and the board says so -- then the next Save writes it.
      let n = 0;
      for (const ph of ['read', 'open', 'write', 'close']) {
        n++;
        const tag = 'W2 ' + ph.toUpperCase() + ' ' + n;
        const h0 = f.hits[ph] || 0;
        f.hold[ph] = H.gate(); const g = f.hold[ph];
        const p = R.ev('saveInPlaceFile()');
        await H.until(() => (f.hits[ph] || 0) > h0);
        const before = R.ev(L.live);
        await V.run(R.ev, L.edit(tag));
        const after = R.ev(L.live);
        g.open(); await p;
        const inFile = L.file(H.pubOf(f.content));
        chk(name, L.k + ' — edit during the ' + ph, 'the edit changed the list (the fixture, a control)', after !== before, true);
        if (ph === 'read') {
          chk(name, L.k + ' — edit during the ' + ph, 'it landed before the bytes were built: the file has it and the board reads saved (a control)',
            (inFile === after) + '|' + V.saved(R.ev) + '|' + /not in the file yet/.test(V.status(R.ev)), 'true|true|false');
          continue;
        }
        chk(name, L.k + ' — edit during the ' + ph, 'the bytes written hold the list as it was when they were built (a control)', inFile === before, true);
        chk(name, L.k + ' — edit during the ' + ph, L.what + ': the edit is not in the file, so the board reads unsaved and says so' + (L.saves ? ' (a control: this door also calls save())' : ''),
          V.unsaved(R.ev) + '|' + /not in the file yet/.test(V.status(R.ev)), 'true|true');
        await R.ev('saveInPlaceFile()');
        chk(name, L.k + ' — edit during the ' + ph, 'the next Save writes it, and only then the board reads saved (a control)',
          (L.file(H.pubOf(f.content)) === R.ev(L.live)) + '|' + V.saved(R.ev), 'true|true');
      }
      // REOPENED with no browser storage, and with storage refusing every read and write: the file alone carries it.
      const want = R.ev(L.mark);
      const A = boot({ html: f.content });
      chk(name, L.k + ' — reopened', 'from the file in a browser with no storage, the list is as it was saved (a control)', A.ev(L.mark), want);
      const w = V.openRefused(f.content);
      let got = '(did not open)'; try { got = w.eval(L.mark); } catch (e) { got = 'threw: ' + e.message; }
      chk(name, L.k + ' — reopened', 'and in a browser whose storage refuses every read and write (a control)', got, want);
      try { w.close(); } catch (e) {}
      bootRelease(mk, keepBoards());
    }
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
