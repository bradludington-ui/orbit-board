// FOCUSED harness: VERBATIM from /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/16ceb83/after/tools/export-audit/audit-import.mjs -- imports, failure list, keepBoards, SEEN/chk, the selected blocks
// (suite lines 7254-7463), the top-level helpers they reference (closure: MINE, W1H, W2FX, W2_KEYS, W2_MINE, W2_SC, base, it, w2Ap, w2Fx, w2Gen, w2Import, w2LsOf, w2it), the guard. Not the full suite.
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
