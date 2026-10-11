// FOCUSED HARNESS for the v2.00 (R3) block. Helpers copied verbatim from audit-import.mjs; the block is the committed text.
import { boot, seed, bootMark, bootRelease, settleBoards } from '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L2/commits/R3-d4a241a/run/copy/tools/export-audit/boot.mjs';
let failures = [];
// The boards a later block reuses: V185W, V186L and V14 are built once and read by the blocks after.
// Each is read through a guard -- a block above its `let` line runs while it is still uninitialised.
const keepBoards = () => [() => V185W, () => V186L, () => V14]
  .map(f => { try { return f(); } catch { return null; } })
  .flatMap(v => (!v || typeof v !== 'object') ? [] : [v, ...Object.values(v)])   // never a string: V186L is a whole board file, and spreading one made 3.2 million entries a block
  .filter(x => x && typeof x === 'object' && x.w).map(x => x.w);
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

// Every case drives the board's own Save, Take the pen, folder push and pull, put back and keep-aside,
// against a stand-in file and a stand-in shared folder whose writes the test can HOLD open, so an edit,
// a year switch or a second Save lands exactly while a save is writing. Reproduced on v1.94 first: an edit
// made during the write was not in the copy yet the board said Saved; a year switch wrote one year's board
// into another year's copy; a second kept-aside copy erased the first; any browser could save over anyone.
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

// THE FOLDER, WITH A HAND ON EVERY STEP. Wraps W1H's stand-in folder: K.hold[step]=gate() holds the next time that step
// is reached, K.fail[step]={e, skip} throws e there (after `skip` more passes), K.hits counts each. Steps: 'perm' (asking
// the folder's permission), 'mainRead' (reading a folder copy), and the history's 'histOpen' (opening it to list or
// read), 'histList', 'histDir' (creating it), 'histCreate' (a new copy's file), 'histRead', 'histWrite', 'histClose'.
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

console.log('\n' + '='.repeat(96));
console.log('scenarios heard: ' + JSON.stringify([...SEEN]));
if (!SEEN.size) failures.push({ scenario: '(harness)', where: 'harness', what: 'no scenario ran', got: 'none', want: 'ran' });
if (!failures.length) { console.log('ALL CHECKS PASSED'); process.exit(0); }
console.log(`${failures.length} FAILING CHECK(S)\n`);
failures.forEach(f => console.log(`--- ${f.scenario} | ${f.where}\n    ${f.what}\n        got ${String(f.got)}   want ${String(f.want)}`));
process.exit(1);
