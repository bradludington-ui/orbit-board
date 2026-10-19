import { boot, seed, BOARD, capture, cv, bootMark, bootRelease, settleBoards, stopAtFirstFailure } from '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L2/commits/R4-a0a9a6f/run/copy/tools/export-audit/boot.mjs';
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
const w2Status = (ev) => ev(`(document.getElementById('shareStat')||{}).textContent||''`);
// One appropriation's board of generation GEN, its cycle locked as CYC|2027. The notes are padded so that the
// sizes differ the way a byte quota can be set between them: OLD's O&M plan is the bigger, NEW's Full Fund plan
// and NEW's BAE list are.
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
// Built once. The OLD board's browser holds no cost estimates (it reads the file's), so a key the import adds has to
// be put back by removing it.
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
const W2_SAY = ['the O&M plan', 'the Full Fund plan', 'the locked cycles for O&M', 'the locked cycles for Full Fund', 'the BAE list',
  'the execution data', 'the cost estimates', 'the reprogramming log', 'the destination list', 'the import’s report'];
// What a board shows of each generation's work, read the way a person would see it.
const w2View = (ev) => JSON.parse(ev(`JSON.stringify((function(){
  const g=function(o){ const s=JSON.stringify(o||{}); return /NEW/.test(s)&&/OLD/.test(s)? 'BOTH' : /NEW/.test(s)? 'NEW' : /OLD/.test(s)? 'OLD' : 'none'; };
  const ff=pkgStoreOf('ff'), ffc=cycStoreOf('ff').c;
  return { imported:/Full board imported/.test((document.getElementById('shareStat')||{}).textContent||''),
    omTitle:(S.titles||{}).A||'', omAllocA:JSON.stringify((S.alloc||{}).A||null), omCycles:Object.keys(CYCDB.cycles||{}).sort().join(','),
    ff:g(ff&&ff.years), ffCycles:ffc? Object.keys(ffc.cycles||{}).sort().join(',') : 'none',
    bae:(BUDDB.rows||[]).map(function(r){ return r.name.slice(0,12); }).join('|'), exec:JSON.stringify(EXDB.all),
    ace:Object.keys(ACEDB.sets||{}).join(','), reprog:(RPDB.entries||[]).map(function(e){ return e.what; }).join('|'),
    dest:flowEnts().map(function(e){ return e.n; }).filter(function(n){ return /Depot/.test(n); }).join('|'),
    destA:(function(){ const d=((S.dest||{}).A||{}).to; const e=d&&flowEnt(d); return e? e.n : (d||''); })() };
})())`));
// What the next 💾 Save writes, each container read as OLD, NEW or both.
const w2Saved = (ev) => {
  const J = JSON.parse(ev('buildSavedHtml()').match(/id="pubState">([\s\S]*?)<\/script>/)[1]);
  const g = (o) => { const s = JSON.stringify(o || {}); return /NEW/.test(s) && /OLD/.test(s) ? 'BOTH' : /NEW/.test(s) ? 'NEW' : /OLD/.test(s) ? 'OLD' : 'none'; };
  const cy = (k) => Object.keys((((J.cycDb || {}).byAp || {})[k] || {}).cycles || {}).sort().join(',');
  return JSON.stringify({ om: g(((J.appns || {}).om || {}).years), omCyc: cy('om'), ff: g(((J.appns || {}).ff || {}).years), ffCyc: cy('ff'),
    bae: g(J.budDb), exec: /JSF1/.test(JSON.stringify(J.execDb)) ? 'NEW' : 'OLD', ace: g(J.aceDb), rp: g(J.rpDb), dest: g(J.destDb) });
};
// One full import into board T, with browser storage refusing writes by `mode`:
//   'once'  -- write n only;
//   'full'  -- write n, and every later write of anything a key did not hold before the import: a browser whose
//              storage stays full, where what the import adds never fits and what each key held before fits again;
//   'stuck' -- write n and every write after it, putting back included;
//   'quota' -- any write that would take storage past `limit` characters (keys and values, as a quota counts);
//   'stuckKeys' -- write n and every later write of one of the ten keys, putting back included; anything else (a
//              small mark) still fits;
//   'none'  -- nothing.
// `held` is what storage held just before the import; `nav` whether the board went to reopen (jsdom reports a
// navigation it does not implement, which is how location.reload() shows here).
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
                                         ['hold on, read held and the hold cleared during it', true, true]]) {
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
