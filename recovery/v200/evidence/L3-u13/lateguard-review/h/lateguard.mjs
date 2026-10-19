// lateguard.mjs -- independent probe of ONE property of U13: before driveStorePull's late `if(_saveBusy)` guard, nothing
// changes copies, storage, base records or dirty flags while a save is under way.
// env: ROOT (a board copy: its runtime-encoding-shim.mjs and tools/export-audit/boot.mjs are used), BOARD (optional: a
// variant board file; else ROOT's own), OUT (jsonl, one line per cell), MODES (N,H1,H2,WR,WA), BRANCHES, CALLS (optional).
// W1H helpers below are copied from rec/L3/u13/h/focused-u13.mjs (wire, gate, until, baseFile, connect, pause, lsOf); the
// folder mock is the W1H one with every mutation logged (create/write/remove/mkdir, by path), read/ask gates in a queue,
// and a settable permission. No product file is written; nothing in orbit-board is touched.
import { pathToFileURL } from 'node:url';
import { appendFileSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const ROOT = process.env.ROOT, OUT = process.env.OUT;
const MODES = (process.env.MODES || 'N,H1,H2,WR,WA').split(',');
const ONLY = process.env.BRANCHES ? process.env.BRANCHES.split(',') : null;
const ONLYC = process.env.CALLS ? process.env.CALLS.split(',') : null;
if (!process.env.BOARD) delete process.env.BOARD;
await import(pathToFileURL(ROOT + '/runtime-encoding-shim.mjs').href);
const { boot, seed, BOARD, bootMark, bootRelease, settleBoards } = await import(pathToFileURL(ROOT + '/tools/export-audit/boot.mjs').href);
const et = () => new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET';
const blob = p => { const b = readFileSync(p); return createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex'); };
writeFileSync(OUT, '');
const rec = o => appendFileSync(OUT, JSON.stringify(o) + '\n');
rec({ IDS: { ROOT, BOARD, board: blob(BOARD), harness: blob(new URL(import.meta.url)), started: et(), MODES, ONLY, ONLYC } });
console.log('IDS', BOARD, blob(BOARD), et());

// ---------------- W1H (copied) ----------------
const SVC = ['USAF', 'ANG', 'AFRC'];
const J = JSON.stringify;
const mk = (id, ask) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Req ' + id, event: 'E' + id, ccar: '', fy26: [0, 0, 0], ask, alloc: null });
const tick = () => new Promise(r => setImmediate(r));
const until = async (cond, max = 6000) => { for (let i = 0; i < max; i++) { if (cond()) return true; await tick(); } return false; };
const gate = () => { let res, rej; const p = new Promise((a, b) => { res = a; rej = b; }); return { p, open: () => res(), fail: e => rej(e), hit: 0 }; };
const lsOf = ev => JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
const KEY = { brad: 'b0000000000000000000000000000001', bob: 'c0000000000000000000000000000003' };
const wire = (ev, name, key) => ev(`localStorage.setItem('prio27who', ${J(name)}); localStorage.setItem('prio27writerKey', ${J(key)});
    globalThis.__q=[]; globalThis.__yes=true; globalThis.__dl=0;
    window.confirm=function(q){ globalThis.__q.push(String(q)); return globalThis.__yes; }; window.alert=function(){};
    URL.createObjectURL=function(){ globalThis.__dl++; return 'blob:x'; }; URL.revokeObjectURL=function(){}; 'ok'`);
const status = ev => ev(`(document.getElementById('shareStat')||{}).textContent||''`);
const baseFile = (by, key, writer = true) => {
  const A = boot(); seed(A.ev, { services: SVC, items: [mk('A', [900, 200, 100]), mk('B', [400, 100, 50])], disc: [2000, 600, 300], mand: [500, 150, 80], order: ['A', 'B'] });
  A.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`);
  A.ev(`localStorage.setItem('prio27writerKey', ${J(key)}); if(${writer} && typeof writerFp==='function') WRITER={by:${J(by)}, fp:writerFp(), t:1}; 'ok'`);
  return A.ev('buildSavedHtml()');
};
const connect = (ev, w, fold) => { w.__fold = fold.dir; ev(`_liveCfg=Object.assign(liveCfg(), {store:true, mode:'drive', on:false}); _driveDir=globalThis.__fold; 'ok'`); };
const pause = ms => new Promise(r => setTimeout(r, ms));

// ---------------- the instrumented folder ----------------
const NM = 'spmt-2027-om.json';
const folder = (files = {}) => {
  const root = { files: { ...files }, dirs: {} };
  const fold = { root, hold: {}, hits: {}, failNext: {}, failRead: {}, log: [], ops: [], readGates: [], askGates: [], permQ: 'granted', permR: 'granted' };
  const kindOf = (st, n) => st !== root ? 'hist' : (/\.lock\.json$/.test(n) ? 'lock' : 'main');
  const wait = async (k, n) => { fold.hits[k] = (fold.hits[k] || 0) + 1; fold.log.push(k + ':' + n); const g = fold.hold[k]; if (g) { delete fold.hold[k]; g.hit = 1; await g.p; } };
  const nf = () => { const e = new Error('not found'); e.name = 'NotFoundError'; return e; };
  const dirOf = (st, pre) => ({ kind: 'directory', name: pre ? pre.slice(0, -1) : 'shared',
    queryPermission: async m => { const mode = (m && m.mode) || 'read';
      if (st === root && mode === 'read' && fold.askGates.length) { const g = fold.askGates.shift(); g.hit = 1; await g.p; }
      return typeof fold.permQ === 'function' ? fold.permQ(mode) : fold.permQ; },
    requestPermission: async m => { fold.ops.push('prompt:' + ((m && m.mode) || 'read')); return fold.permR; },
    getFileHandle: async (n, o) => {
      const create = !!(o && o.create);
      if (!create && st === root && n === NM && fold.readGates.length) { const g = fold.readGates.shift(); g.hit = 1; await g.p; }
      if (!(n in st.files)) { if (create) { st.files[n] = ''; fold.ops.push('create:' + pre + n); } else throw nf(); }
      return { kind: 'file', name: n,
        getFile: async () => { if (fold.failRead[n]) { const e = fold.failRead[n]; delete fold.failRead[n]; throw e; } const c = st.files[n]; return { text: async () => c }; },
        createWritable: async () => { let buf = ''; return { write: async x => { buf += String(x); },
          close: async () => { const k = kindOf(st, n); await wait(k, n); if (fold.failNext[k]) { const e = fold.failNext[k]; delete fold.failNext[k]; throw e; } st.files[n] = buf; fold.ops.push('write:' + pre + n); } }; } }; },
    getDirectoryHandle: async (n, o) => { if (!st.dirs[n]) { if (o && o.create) { st.dirs[n] = { files: {}, dirs: {} }; fold.ops.push('mkdir:' + pre + n); } else throw nf(); } return dirOf(st.dirs[n], pre + n + '/'); },
    removeEntry: async n => { fold.ops.push('remove:' + pre + n); delete st.files[n]; },
    values: async function* () { for (const n of Object.keys(st.files)) yield { kind: 'file', name: n, getFile: async () => ({ text: async () => st.files[n] }) }; for (const n of Object.keys(st.dirs)) yield { kind: 'directory', name: n }; } });
  fold.dir = dirOf(root, '');
  fold.raw = () => root.files[NM];
  const flat = (st, pre, o) => { for (const [k, v] of Object.entries(st.files)) o[pre + k] = v; for (const [k, v] of Object.entries(st.dirs)) { o[pre + k + '/'] = '(dir)'; flat(v, pre + k + '/', o); } return o; };
  fold.tree = () => flat(root, '', {});
  return fold;
};
const armRead = fold => { const g = gate(); fold.readGates.push(g); return g; };
const armAsk = fold => { const g = gate(); fold.askGates.push(g); return g; };

// ---------------- in-page instrumentation ----------------
// localStorage (Storage.prototype of that window), a logging IndexedDB stand-in (jsdom has none), and the board's own
// writers and state-changers wrapped (function declarations are global bindings): each call is logged with _saveBusy at
// that moment and a short stack.
const INSTR = `(function(){
  globalThis.__lsLog=[]; globalThis.__idbLog=[]; globalThis.__fnLog=[];
  function st(){ try{ return String(new Error().stack).split('\\n').slice(3,8).map(function(x){ return x.trim().replace(/^at /,'').replace(/ \\(.*$/,''); }).join(' < '); }catch(e){ return ''; } }
  var P=Storage.prototype, s=P.setItem, r=P.removeItem, c=P.clear;
  P.setItem=function(k,v){ __lsLog.push(['set',String(k),(this.getItem(k)===String(v))?'same':'changed',st()]); return s.call(this,k,v); };
  P.removeItem=function(k){ __lsLog.push(['remove',String(k),'',st()]); return r.call(this,k); };
  P.clear=function(){ __lsLog.push(['clear','','',st()]); return c.call(this); };
  var dbs={};
  window.indexedDB={ open:function(name, ver){ __idbLog.push('open:'+name); var req={};
    setTimeout(function(){ var isNew=!dbs[name]; if(isNew){ dbs[name]={}; __idbLog.push('createDB:'+name); }
      var db={ createObjectStore:function(sn){ __idbLog.push('createStore:'+name+'/'+sn); dbs[name][sn]={}; },
        transaction:function(sn, mode){ return { objectStore:function(){ var o=dbs[name][sn]||(dbs[name][sn]={}); return {
          put:function(v,k){ __idbLog.push('put:'+name+'/'+sn+'/'+k); o[k]=v; return {}; },
          delete:function(k){ __idbLog.push('delete:'+name+'/'+sn+'/'+k); delete o[k]; return {}; },
          get:function(k){ __idbLog.push('get:'+name+'/'+sn+'/'+k); var g={}; setTimeout(function(){ g.result=o[k]; if(g.onsuccess) g.onsuccess(); },0); return g; } }; } }; } };
      req.result=db; if(isNew && req.onupgradeneeded) req.onupgradeneeded(); if(req.onsuccess) req.onsuccess(); },0);
    return req; } };
  ['driveBaseSet','baseSet','persist','applyStore','keepAside','save','lsSet','lsAll','persistExdb','persistRp','driveWrite','snapKeep','snapPrune',
   'driveHeartbeat','driveClashSay','driveStorePush','saveSerial','applyState','fileMark','keptPutBack','location_reload'].forEach(function(n){
    try{ var f=eval(n); if(typeof f!=='function') return;
      var w=function(){ __fnLog.push([n, _saveBusy, st()]); return f.apply(this, arguments); };
      eval(n+'=w'); }catch(e){} });
  return 'ok'; })()`;
const SNAP = `(function(){
  function J(x){ try{ return JSON.stringify(x); }catch(e){ return 'ERR:'+e; } }
  var ls={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); ls[k]=localStorage.getItem(k); }
  return JSON.stringify({ MS:J(MS), S:J(S), items:J(DATA.items), DIRTY:DIRTY, _baseDirty:_baseDirty, _saveGen:_saveGen, _dlOnly:_dlOnly,
    LASTKNOWN:LASTKNOWN, _sideGen:_sideGen, _keptMeta:J(_keptMeta), _driveBase:J(_driveBase), baseGet:J(baseGet()), WRITER:J(WRITER),
    EXDB:J(EXDB), ACEDB:J(ACEDB), RPDB:J(RPDB), CYCVIEW:CYCVIEW, ls:ls,
    _saveBusy:_saveBusy, _autoBusy:_autoBusy, LIVEDB:J(LIVEDB), _statN:_statN, status:(document.getElementById('shareStat')||{}).textContent||'',
    diagN:DIAG.log.length, _drivePerm:_drivePerm, _drivePermProbed:_drivePermProbed, _driveNeed:_driveNeed, _driveLive:_driveLive,
    _driveDir:(_driveDir===null? 'null' : (_driveDir===globalThis.__fold? 'fold' : 'other')), _liveCfg:J(_liveCfg), liveTimer:!!liveTimer,
    saveState:(document.getElementById('saveState')||{}).textContent||'' }); })()`;
const PROTECTED = ['MS', 'S', 'items', 'DIRTY', '_baseDirty', '_saveGen', '_dlOnly', 'LASTKNOWN', '_sideGen', '_keptMeta', '_driveBase', 'baseGet', 'WRITER', 'EXDB', 'ACEDB', 'RPDB', 'CYCVIEW'];
const snap = (B, fold) => ({ p: JSON.parse(B.ev(SNAP)), tree: fold.tree() });
const resetLogs = (B, fold) => { B.ev(`__lsLog=[]; __idbLog=[]; __fnLog=[]; 'ok'`); fold.ops.length = 0; };
const logs = (B, fold) => ({ ls: JSON.parse(B.ev('JSON.stringify(__lsLog)')), idb: JSON.parse(B.ev('JSON.stringify(__idbLog)')), fn: JSON.parse(B.ev('JSON.stringify(__fnLog)')), ops: fold.ops.slice() });
const short = v => { const s = typeof v === 'string' ? v : (v === undefined ? '(undefined)' : J(v)); return s.length > 140 ? s.slice(0, 60) + ' … ' + s.slice(-60) + ` (${s.length} ch)` : s; };
const firstDiff = (a, b) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return `@${i}: ${J(a.slice(Math.max(0, i - 30), i + 50))} -> ${J(b.slice(Math.max(0, i - 30), i + 50))}`; };
const diff = (s0, s1, L) => {
  const prot = {}, listed = {};
  for (const k of Object.keys(s1.p)) { if (k === 'ls') continue;
    if (J(s0.p[k]) !== J(s1.p[k])) {
      const a = s0.p[k], b = s1.p[k];
      const d = (typeof a === 'string' && typeof b === 'string' && (a.length > 140 || b.length > 140)) ? firstDiff(a, b) : [short(a), short(b)];
      (PROTECTED.includes(k) ? prot : listed)[k] = d; } }
  for (const k of new Set([...Object.keys(s0.p.ls), ...Object.keys(s1.p.ls)]))
    if (s0.p.ls[k] !== s1.p.ls[k]) prot['localStorage:' + k] = (s0.p.ls[k] == null || s1.p.ls[k] == null) ? [short(s0.p.ls[k]), short(s1.p.ls[k])] : firstDiff(s0.p.ls[k], s1.p.ls[k]);
  for (const k of new Set([...Object.keys(s0.tree), ...Object.keys(s1.tree)]))
    if (s0.tree[k] !== s1.tree[k]) ((/\.lock\.json$/.test(k)) ? listed : prot)['folder:' + k] = [short(s0.tree[k] == null ? '(none)' : s0.tree[k]), short(s1.tree[k] == null ? '(none)' : s1.tree[k])];
  // writes that left the bytes as they were still count as writes
  const lsW = L.ls.filter(x => x[0] !== 'get');
  const opsW = L.ops.filter(o => /^(create|write|remove|mkdir):/.test(o));
  const protOps = opsW.filter(o => !/\.lock\.json$/.test(o)), lockOps = opsW.filter(o => /\.lock\.json$/.test(o));
  const idbW = L.idb.filter(x => /^(put|delete|createDB|createStore):/.test(x));
  const WR = ['driveBaseSet', 'baseSet', 'persist', 'applyStore', 'keepAside', 'save', 'lsSet', 'lsAll', 'persistExdb', 'persistRp', 'snapKeep', 'snapPrune', 'applyState', 'fileMark', 'keptPutBack'];
  const fnW = L.fn.filter(x => WR.includes(x[0]) || (x[0] === 'driveWrite' && !/driveHeartbeat/.test(x[2])));
  const hb = L.fn.filter(x => x[0] === 'driveHeartbeat');
  return { prot, listed, lsWrites: lsW, folderWrites: protOps, lockWrites: lockOps, prompts: L.ops.filter(o => /^prompt:/.test(o)),
    idbWrites: idbW, idbAll: L.idb, fnCalls: L.fn, fnWriters: fnW, heartbeats: hb.length,
    clean: !Object.keys(prot).length && !lsW.length && !protOps.length && !idbW.filter(x => /^(put|delete)/.test(x)).length && !fnW.length };
};
const startCall = (B, expr) => { const o = { done: false, ret: undefined }; let pr;
  try { pr = B.ev(expr); } catch (e) { o.done = true; o.ret = 'threw:' + String(e && e.message || e); return o; }
  Promise.resolve(pr).then(v => { o.done = true; o.ret = v === undefined ? '(undefined)' : v; }, e => { o.done = true; o.ret = 'rejected:' + String(e && e.message || e); });
  return o; };
const settle = async (o, ms = 1500) => { for (let i = 0; i < ms / 5 && !o.done; i++) await pause(5); return o.done; };

// ---------------- fixtures (as the U13 block builds them, through the product) ----------------
const F1 = baseFile('Brad', KEY.brad);
const HOUR = 3600000;
const writeRemote = async ahead => {
  const f0 = folder(), R = boot({ html: F1 }); await pause(80); wire(R.ev, 'Brad', KEY.brad); connect(R.ev, R.w, f0);
  if (ahead) R.ev(`(function(){ var real=Date.now; Date.now=function(){ return real.call(Date)+${ahead}; }; return 'ok'; })()`);
  R.ev(`setNote('A','REMOTE'); setAlloc('A','650'); 'ok'`); await R.ev('saveInPlace()'); await pause(5);
  return f0.raw();
};
const scr = ev => JSON.parse(ev(`JSON.stringify([String(S.notes.A||''), (S.alloc.A&&typeof S.alloc.A==='object')? S.alloc.A.v : (S.alloc.A==null? null : S.alloc.A)])`));
const inCopy = txt => { try { const j = JSON.parse(txt), st = j.store || j, y = (st.years || {})[st.cur] || {}, a = (y.alloc || {}).A;
  return [String((y.notes || {}).A || ''), (a && typeof a === 'object') ? a.v : (a == null ? null : a)]; } catch (e) { return ['(unreadable)', null]; } };
const tsOf = txt => { const j = JSON.parse(txt); return +((j.store && j.store.ts) || j.ts || 0); };
const brad = async txt => {
  const fold = folder({ [NM]: txt }), A = boot({ html: F1 }); await pause(80); wire(A.ev, 'Brad', KEY.brad); connect(A.ev, A.w, fold);
  await A.ev('driveAutoConnect()'); await pause(5);
  const v = [...scr(A.ev), JSON.parse(A.ev('JSON.stringify([DIRTY,_baseDirty,!!baseGet().dirty])')), +A.ev('driveBaseOf(mySlug())') === tsOf(txt)];
  A.ev(`setNote('A','WORKING'); setAlloc('A','700'); 'ok'`); await pause(5);
  const key = A.ev('_AP.key');
  return { v, LS: lsOf(A.ev), key, msTs: +A.ev('MS.ts') };
};
const fm = bootMark();
const REMOTE = await writeRemote(HOUR), REMOTE0 = await writeRemote(0);
const bM = await brad(REMOTE), bC = await brad(REMOTE0);
const KB = bM.key + '.base';
const LS_M = bM.LS, LS_C = bC.LS;
const LS_Cn = { ...LS_C }; { const b = JSON.parse(LS_Cn[KB]); b.folder = {}; LS_Cn[KB] = J(b); }
const edit = (txt, f) => { const j = JSON.parse(txt); f(j); return J(j); };
const CLASH = edit(REMOTE0, j => { j.store.ts = tsOf(REMOTE0) + 1; j.ts = tsOf(REMOTE0) + 1; j.by = 'Bob'; });
const NOPACK = edit(REMOTE, j => { delete j.store.dataPack; });
const TOONEW = edit(REMOTE, j => { j.v = 2; j.build = 'v9.99'; });
const REFUSED = edit(REMOTE, j => { j.toString = 1; });
const NOTBOARD = J({ v: 1, ts: 1, by: 'x' });
rec({ FIXTURE: { remote: [inCopy(REMOTE), tsOf(REMOTE) - Date.now()], remote0: [inCopy(REMOTE0), tsOf(REMOTE0)], bM: bM.v, bC: bC.v, bMts: bM.msTs, bCts: bC.msTs,
  key: bM.key, baseM: JSON.parse(LS_M[KB]), baseC: JSON.parse(LS_C[KB]), baseCn: JSON.parse(LS_Cn[KB]), clashTs: tsOf(CLASH), clashLeOurs: tsOf(CLASH) <= bC.msTs } });
bootRelease(fm, []); await settleBoards();

// ---------------- branches ----------------
// ls: browser storage the board reopens with; init: the folder at connect; pre: in-session work before any save;
// env: the change that puts the refresh in this branch (H1/H2: once the save is held; N: before the call; W: before the
// call starts); wsave: where the save is held in the W modes ('main' close of its write, or 'read').
const setHead = t => (B, fold) => { fold.root.files[NM] = t; };
const BR = [
  { id: 'B01-dirfail-perm', ls: LS_M, init: { [NM]: REMOTE }, env: (B, fold) => { fold.permQ = 'denied'; }, noW: true },
  { id: 'B01b-dirfail-nohandle', ls: LS_M, init: { [NM]: REMOTE }, env: (B, fold) => { B.ev(`_driveDir=null; 'ok'`); }, noW: true },
  { id: 'B02-read-throws', ls: LS_M, init: { [NM]: REMOTE }, env: (B, fold) => { const e = new Error('the folder is syncing'); e.name = 'NotReadableError'; fold.failRead[NM] = e; }, wsave: 'mainpre' },
  { id: 'B02b-read-refused', ls: LS_M, init: { [NM]: REMOTE }, env: setHead(REFUSED), wsave: 'mainpre' },
  { id: 'B02c-not-a-board', ls: LS_M, init: { [NM]: REMOTE }, env: setHead(NOTBOARD), wsave: 'mainpre' },
  { id: 'B03-nothing', ls: LS_M, init: { [NM]: REMOTE }, env: (B, fold) => { delete fold.root.files[NM]; } },
  { id: 'B04-toonew', ls: LS_M, init: { [NM]: REMOTE }, env: setHead(TOONEW), wsave: 'mainpre' },
  { id: 'B05-notnewer-base', ls: LS_C, init: { [NM]: REMOTE0 } },
  { id: 'B06-notnewer-nobase', ls: LS_Cn, init: {}, env: setHead(REMOTE0), wsave: 'read' },
  { id: 'B07-notnewer-clash', ls: LS_C, init: { [NM]: REMOTE0 }, env: setHead(CLASH), wsave: 'read' },
  { id: 'B08-dirty', ls: LS_M, init: { [NM]: REMOTE }, pre: B => B.ev(`setNote('A','TYPED'); 'ok'`) },
  { id: 'B09-nopack', ls: LS_M, init: { [NM]: REMOTE }, env: setHead(NOPACK) },
  { id: 'B10-lateguard', ls: LS_M, init: { [NM]: REMOTE } },
];
const CALLS = { p1: 'driveStorePull(true)', p0: 'driveStorePull(false)', cn: 'driveConnectNow()', ac: 'driveAutoConnect()', tk: 'liveTick()', tkx: 'liveTick()' };
const landing = (B, fold) => { try { return { scr: scr(B.ev), head: fold.raw() == null ? '(none)' : inCopy(fold.raw()),
  flags: JSON.parse(B.ev('JSON.stringify([DIRTY,_baseDirty,!!baseGet().dirty,_saveBusy])')), onHead: fold.raw() ? (+B.ev('driveBaseOf(mySlug())') === tsOf(fold.raw())) : null,
  kept: B.ev(`localStorage.getItem(_AP.key+'.kept')!=null`), status: status(B.ev).slice(0, 110), q: JSON.parse(B.ev('JSON.stringify(globalThis.__q)')).length }; } catch (e) { return { err: String(e) }; } };

const startSave = async (B, fold, how) => {
  if (how === 'read') { const g = armRead(fold); const p = startCall(B, 'saveInPlace()'); const ok = await until(() => g.hit || p.done);
    if (!g.hit) { const i = fold.readGates.indexOf(g); if (i >= 0) fold.readGates.splice(i, 1); }
    return { p, ok: !!g.hit, release: () => g.open(), at: 'read' }; }
  const g = gate(); fold.hold.main = g; const p = startCall(B, 'saveInPlace()'); const ok = await until(() => g.hit || p.done);
  if (!g.hit) delete fold.hold.main;
  return { p, ok: !!g.hit, release: () => g.open(), at: 'main' };
};
// The read gate is armed before the save starts; each cell records saveHeld (the gate or hold was reached) and _saveBusy.

async function cell(br, mode, call) {
  const mark = bootMark();
  const out = { br: br.id, mode, call };
  try {
    const fold = folder(br.init);
    const B = boot({ html: F1, ls: { ...br.ls } }); await pause(80);
    wire(B.ev, 'Brad', KEY.brad); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    out.instr = B.ev(INSTR);
    if (br.pre) br.pre(B);
    if (call === 'tk' || call === 'tkx') B.ev(`_liveCfg.on=true; _liveCfg.auto=${call === 'tk'}; _driveLive=true; 'ok'`);
    let sv = null, pc = null;
    if (mode === 'N' || mode === 'H1' || mode === 'H2') {
      if (mode === 'H1') sv = await startSave(B, fold, 'main');
      if (mode === 'H2') sv = await startSave(B, fold, 'read');
      if (sv) { out.saveHeld = sv.ok; out.busyAtHold = B.ev('_saveBusy'); }
      if (br.env) br.env(B, fold);
      const s0 = snap(B, fold); resetLogs(B, fold);
      pc = startCall(B, CALLS[call]); out.done = await settle(pc);
      await pause(5);
      const s1 = snap(B, fold); out.ret = pc.done ? pc.ret : '(pending)';
      out.win = diff(s0, s1, logs(B, fold)); out.busyInWin = [s0.p._saveBusy, s1.p._saveBusy];
      out.statusAfter = s1.p.status.slice(0, 160);
    } else {
      // W modes: the call starts with NO save under way and is held at its read (WR) or at its first 'read' permission ask
      // (WA); a save starts and is held; the call is let go. Its part before the wait and its part after are measured apart.
      const wsave = br.wsave === 'read' ? 'read' : 'main';
      if (br.env && br.wsave !== 'mainpre') br.env(B, fold);
      const s0a = snap(B, fold); resetLogs(B, fold);
      const g1 = mode === 'WR' ? armRead(fold) : armAsk(fold);
      pc = startCall(B, CALLS[call]);
      await until(() => g1.hit || pc.done);
      out.reachedWait = !!g1.hit;
      const s0m = snap(B, fold); out.preWait = diff(s0a, s0m, logs(B, fold)); out.busyBeforeWait = s0m.p._saveBusy;
      if (g1.hit) {
        sv = await startSave(B, fold, wsave);
        out.saveHeld = sv.ok; out.busyAtHold = B.ev('_saveBusy');
        if (br.env && br.wsave === 'mainpre') br.env(B, fold);   // the branch's copy goes in once the save has read the folder
        const s0b = snap(B, fold); resetLogs(B, fold);
        g1.open(); out.done = await settle(pc); await pause(5);
        const s1 = snap(B, fold); out.ret = pc.done ? pc.ret : '(pending)';
        out.win = diff(s0b, s1, logs(B, fold)); out.busyInWin = [s0b.p._saveBusy, s1.p._saveBusy];
        out.statusAfter = s1.p.status.slice(0, 160);
      } else { out.ret = pc.ret; g1.open(); fold.askGates.length = 0; fold.readGates.length = 0; }
    }
    if (sv) { sv.release(); out.saveDone = await settle(sv.p, 3000); out.saveRet = sv.p.ret; }
    if (pc && !pc.done) { out.lateDone = await settle(pc, 3000); out.lateRet = pc.ret; }
    await pause(5);
    out.landing = landing(B, fold);
    B.ev(`try{ liveStop(); }catch(e){} 'ok'`);
  } catch (e) { out.err = String((e && e.stack) || e).slice(0, 600); }
  rec(out);
  bootRelease(mark, []); await settleBoards();
  return out;
}

const t0 = Date.now(); let n = 0, bad = 0;
for (const mode of MODES) for (const br of BR) {
  if (ONLY && !ONLY.includes(br.id)) continue;
  if ((mode === 'WR' || mode === 'WA') && br.noW) continue;
  for (const call of Object.keys(CALLS)) {
    if (ONLYC && !ONLYC.includes(call)) continue;
    if (call === 'tkx' && br.id !== 'B08-dirty') continue;
    if (call === 'tk' && br.id === 'B08-dirty' && (mode === 'WR' || mode === 'WA')) continue;   // its own autosave runs first; tkx covers it
    const o = await cell(br, mode, call); n++;
    const c = o.win ? o.win.clean : null;
    if (o.err || c === false) bad++;
    console.log(`${mode} ${br.id} ${call} ret=${J(o.ret)} held=${o.saveHeld} clean=${c}${o.err ? ' ERR ' + o.err.slice(0, 200) : ''}`);
  }
}
rec({ END: { cells: n, notClean: bad, secs: (Date.now() - t0) / 1000, ended: et() } });
console.log(`cells ${n} notClean ${bad} secs ${(Date.now() - t0) / 1000} ended ${et()}`);
process.exit(0);
