// u20probe.mjs -- U20 on the committed head 63bd8b0 (board 98eed7e8): a bounded lock-wait probe with healthy controls.
//   usage: node u20probe.mjs <boardRoot> <scenario> <outJson>
// U20 (ledger): saveSerial counts _saveBusy only inside navigator.locks.request's callback, so a save WAITING for another
// tab's Web Lock is not counted as under way, and U2's put-back refusal and U13's refusals (the late adoption refusal and
// the base-record guard in driveStorePull) cannot see it. jsdom has no Web Locks: ./locks-mock.mjs is a shared in-process
// LockManager, installed as navigator.locks on every board that plays a tab of the one browser (A and B, later C); another
// machine (X) gets a manager of its own. Tabs A and B also share ONE localStorage area, live (jsdom's Storage impl `_items`
// pointed at one Map; the board has no 'storage' event listener, so no events are needed), and one folder mock.
//
// THE TABS (Alice, one browser profile, writer key a000...2):
//   A  -- a second tab on FULL FUND (storage key prio27ff, folder copy spmt-2027-ff.json): its 💾 Save is HELD at the close of
//         its write, so it holds 'orbit-save'. It shares only the lock, the storage area (disjoint keys but for the global
//         prefs) and the folder (another file) with B: whatever B sees from A is the lock.
//   B  -- the O&M tab under test (prio27om, spmt-2027-om.json).
//   X  -- Alice's other machine (own storage, own lock manager): writes the folder copies that make the fixtures.
//   C  -- the reopen at the end: this browser's storage as B left it, the same folder.
// ROUTES (each: W = the U20 trigger; C1 = counted control; C2a/C2b = no lock contention, ordinary behaviour):
//   PB  ↶ Put back of kept work (folder; the u19/u2variants R-folder fixture: K kept aside, N loaded, S1 typed)
//       PB-W     A holds; B 💾 Save waits on the lock (_saveBusy 0); ↶ Put back; A released; B's save runs
//       PB-Wtick as PB-W, but B's waiting save is the Live autosave (liveTick with Live view and autosave on)
//       PB-C1    no contention; B's 💾 Save running, held at its read of the folder's copy (_saveBusy 1); ↶ Put back
//       PB-C2a   no contention; ↶ Put back, then 💾 Save (runs at once)
//       PB-C2b   no contention; 💾 Save (lands), then ↶ Put back
//       PB-NL    harness check: PB-W with NO navigator.locks on A and B (the board's fallback): B's save does not wait
//   AD  a refresh that would ADOPT a newer folder copy (B reopened with WORKING unsaved: DIRTY false, the record dirty)
//       AD-W     A holds; B 💾 Save waits; X saves N2-NEWER; B's refresh driveStorePull(false); A released; B's save runs
//       AD-Wtick as AD-W, the refresh being liveTick() with Live view and autosave on
//       AD-C1    no contention; B's 💾 Save held at its read (_saveBusy 1); X saves N2; refresh; released
//       AD-C2a   no contention; X saves N2; refresh; then 💾 Save
//       AD-C2b   no contention; 💾 Save (lands WORKING); X tries to save N2; refresh
//   BR  a refresh that would RECORD the folder's copy as the one the work came from (U13's other guard: nothing recorded yet,
//       the folder's copy not newer than the screen). B: a browser with no record for O&M FY27, B-EDIT typed; F0 by X.
//       BR-W, BR-Wtick (a second Live tick while the first tick's autosave waits), BR-C1, BR-C2a (refresh then Save),
//       BR-C2b (Save then refresh); BR-Wperm / BR-C1perm (the folder's edit permission not kept: the opening's own connect
//       stops at one click, and the bar's Connect is the refresh); BR-Wh / BR-C1h / BR-Wpermh (the folder already has a
//       history copy kept less than ten minutes before: X saved F00-FIRST, then F0-BASE)
//   PF  ↶ Put back, the board FILE (the u19 R-file fixture; A's held save is still its folder save of FULL FUND)
//       PF-W, PF-C1 (B's file save held at its read), PF-C2a (put back, then Save); the HOLD ON question answered Cancel
// Reproduction and measurement only: nothing in any board or tool is changed. Expected values are not computed here: the
// probe records OBSERVED values (board code is read for them only); check.mjs holds the hand-written expected literals.
// BOUNDED: every wait is until() (a deadline) or within() (a timer); a watchdog ends the run at 120 s, writing what it has.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { makeLockManager } from './locks-mock.mjs';

const root = resolve(process.argv[2]);
const scenario = process.argv[3];
const outPath = resolve(process.argv[4]);
const SCEN = ['PB-W', 'PB-Wtick', 'PB-C1', 'PB-C2a', 'PB-C2b', 'PB-NL', 'AD-W', 'AD-Wtick', 'AD-C1', 'AD-C2a', 'AD-C2b',
  'BR-W', 'BR-Wtick', 'BR-C1', 'BR-C2a', 'BR-C2b', 'BR-Wperm', 'BR-C1perm', 'BR-Wh', 'BR-C1h', 'BR-Wpermh', 'BR-C2ah', 'BR-C2bh', 'PF-W', 'PF-C1', 'PF-C2a'];
if (!SCEN.includes(scenario)) throw new Error('unknown scenario ' + scenario);
delete process.env.BOARD;
delete process.env.MUT_FIRST_FAIL;
await import(pathToFileURL(root + '/runtime-encoding-shim.mjs').href);
const { boot, seed, bootMark, bootRelease, settleBoards, BOARD } = await import(pathToFileURL(root + '/tools/export-audit/boot.mjs').href);
const req = createRequire(root + '/package.json');
const jsdomUtils = req('jsdom/lib/jsdom/living/generated/utils.js');
const blobOf = buf => createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
const boardPath = root + '/prioritization-board-grid.html';
if (resolve(BOARD) !== boardPath) throw new Error(`boot.mjs BOARD is ${BOARD}, not ${boardPath}`);
const IDS = {
  board: blobOf(readFileSync(boardPath)), bootMjs: blobOf(readFileSync(root + '/tools/export-audit/boot.mjs')),
  shim: blobOf(readFileSync(root + '/runtime-encoding-shim.mjs')), probe: blobOf(readFileSync(new URL(import.meta.url))),
  mock: blobOf(readFileSync(new URL('./locks-mock.mjs', import.meta.url))), jsdomUtils: req.resolve('jsdom/lib/jsdom/living/generated/utils.js'),
  BOARD: resolve(BOARD), started: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET', scenario,
};
console.log('IDS', JSON.stringify(IDS));
const OUT = { IDS, scenario, steps: {}, notes: [], errors: [] };
const finish = (code, why) => {
  OUT.lock = { browser: { stats: LM.stats, log: LM.log }, other: { stats: LMx.stats } };
  OUT.folderLog = FOLD ? FOLD.log : null; OUT.folderWrites = FOLD ? FOLD.writes.map(w => w.tag + ':' + w.path) : null;
  OUT.finished = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET';
  if (why) OUT.incomplete = why;
  writeFileSync(outPath, JSON.stringify(OUT, null, 1));
  console.log(scenario, why || 'done', 'errors', OUT.errors.length, 'wrote', outPath);
  process.exit(code);
};
setTimeout(() => finish(3, 'WATCHDOG: incomplete at 120 s'), 120000).unref();

// ---- W1H helpers (as in rec/L4/u19/u19probe.mjs and tools/export-audit/audit-import.mjs's W1H) ----
const J = JSON.stringify;
const SVC = ['USAF', 'ANG', 'AFRC'];
const mk = (id, ask) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Req ' + id, event: 'E' + id, ccar: '', fy26: [0, 0, 0], ask, alloc: null });
const tick = () => new Promise(r => setImmediate(r));
// BOUNDED WAITS: until() polls to a deadline; within() races a timer. Neither can hang.
const until = async (cond, ms = 5000) => { const end = Date.now() + ms; while (Date.now() < end) { if (cond()) return true; await tick(); } return !!cond(); };
const within = (p, ms = 8000) => Promise.race([Promise.resolve(p).then(v => ({ ok: true, v: v === undefined ? '(undefined)' : v }), e => ({ ok: false, e: String((e && e.message) || e) })),
  new Promise(r => setTimeout(() => r({ timedOut: true }), ms))]);
const gate = () => { let res, rej; const p = new Promise((a, b) => { res = a; rej = b; }); return { p, open: () => res(), fail: e => rej(e) }; };
const pause = ms => new Promise(r => setTimeout(r, ms));
const lsOf = ev => JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
const KEY = { alice: 'a0000000000000000000000000000002' };
const wire = (ev, name, key) => ev(`localStorage.setItem('prio27who', ${J(name)}); localStorage.setItem('prio27writerKey', ${J(key)});
    globalThis.__q=[]; globalThis.__yes=true; globalThis.__dl=0;
    window.confirm=function(q){ globalThis.__q.push(String(q)); return globalThis.__yes; }; window.alert=function(){};
    URL.createObjectURL=function(){ globalThis.__dl++; return 'blob:x'; }; URL.revokeObjectURL=function(){}; 'ok'`);
const qs = ev => JSON.parse(ev('JSON.stringify(globalThis.__q)'));
const status = ev => ev(`(document.getElementById('shareStat')||{}).textContent||''`);
const header = ev => ev(`(document.getElementById('saveState')||{}).textContent||''`);
const pubOf = html => { const m = html.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/); return m ? JSON.parse(m[1]) : null; };
const fileTs = html => { const p = pubOf(html); let t = 0; Object.keys(p.appns).forEach(k => { const s = p.appns[k]; if (s && s.ts > t) t = s.ts; }); return t; };
const fileNote = (html, id, yr) => { const st = pubOf(html).appns.om; return String((((st.years || {})[yr || st.cur] || {}).notes || {})[id] || ''); };
const baseFile = (by, key) => {
  const A = boot(); seed(A.ev, { services: SVC, items: [mk('A', [900, 200, 100]), mk('B', [400, 100, 50])], disc: [2000, 600, 300], mand: [500, 150, 80], order: ['A', 'B'] });
  A.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`);
  A.ev(`localStorage.setItem('prio27writerKey', ${J(key)}); if(typeof writerFp==='function') WRITER={by:${J(by)}, fp:writerFp(), t:1}; 'ok'`);
  const h = A.ev('buildSavedHtml()'); try { A.w.close(); } catch {} return h;
};
// THE FILE ON DISK (u19's disk: each phase held once; `versions` stands in for the Teams version history, outside the board).
const disk = (w, content) => {
  const f = { content, writes: 0, hits: {}, hold: {}, versions: [content] };
  const wait = async ph => { f.hits[ph] = (f.hits[ph] || 0) + 1; const g = f.hold[ph]; if (g) { delete f.hold[ph]; await g.p; } };
  w.__disk = { name: 'Board.html', requestPermission: async () => 'granted',
    getFile: async () => { await wait('read'); const c = f.content; return { text: async () => c }; },
    createWritable: async () => { await wait('open');
      let buf = ''; return { write: async x => { buf += String(x); await wait('write'); },
        close: async () => { await wait('close'); f.content = buf; f.writes++; f.versions.push(buf); } }; } };
  w.eval(`FH=globalThis.__disk; window.showSaveFilePicker=function(){ throw new Error('the picker was opened'); }; 'ok'`);
  return f;
};
// THE SHARED FOLDER: W1H's folder mock, with every operation TAGGED by the tab that made it (each tab is handed its own
// handle onto the one folder) and one-shot holds by {tag, op ('read' at getFile, 'close' at a write's close), path}.
const NM = 'spmt-2027-om.json', NMFF = 'spmt-2027-ff.json';
let FOLD = null;
const folder = () => {
  const rootD = { files: {}, dirs: {} };
  const fold = { root: rootD, holds: [], log: [], writes: [] };
  const at = async (tag, op, p) => { fold.log.push(tag + ':' + op + ':' + p);
    const h = fold.holds.find(x => !x.hit && (!x.tag || x.tag === tag) && x.op === op && x.path === p); if (h) { h.hit = 1; await h.g.p; } };
  const nf = () => { const e = new Error('not found'); e.name = 'NotFoundError'; return e; };
  const dirOf = (st, tag, path) => ({ kind: 'directory', name: path || 'shared',
    // PERMISSION: granted, unless `fold.perm` is set ('prompt'): then this browser's tabs (every tag but X, the other machine)
    // share one state, as a folder handle's permission is the origin's, and a request (a user gesture) grants it.
    queryPermission: async () => { fold.log.push(tag + ':perm:' + (path || '/')); return (tag === 'X' || fold.perm == null) ? 'granted' : fold.perm; },
    requestPermission: async () => { fold.log.push(tag + ':ask:' + (path || '/')); if (tag !== 'X' && fold.perm != null) fold.perm = 'granted'; return 'granted'; },
    getFileHandle: async (n, o) => { const p = (path ? path + '/' : '') + n;
      if (!(n in st.files)) { if (o && o.create) st.files[n] = ''; else { fold.log.push(tag + ':miss:' + p); throw nf(); } }
      return { kind: 'file', name: n,
        getFile: async () => { await at(tag, 'read', p); const c = st.files[n]; return { text: async () => c }; },
        createWritable: async () => { let buf = ''; return { write: async x => { buf += String(x); },
          close: async () => { await at(tag, 'close', p); st.files[n] = buf; fold.writes.push({ tag, path: p, n: fold.log.length }); } }; } }; },
    getDirectoryHandle: async (n, o) => { if (!st.dirs[n]) { if (o && o.create) st.dirs[n] = { files: {}, dirs: {} }; else throw nf(); } return dirOf(st.dirs[n], tag, (path ? path + '/' : '') + n); },
    removeEntry: async n => { fold.log.push(tag + ':remove:' + (path ? path + '/' : '') + n); delete st.files[n]; },
    values: async function* () { for (const n of Object.keys(st.files)) yield { kind: 'file', name: n, getFile: async () => ({ text: async () => st.files[n] }) }; } });
  fold.dirFor = tag => dirOf(rootD, tag, '');
  fold.holdOnce = spec => { const h = { ...spec, g: gate(), hit: 0 }; fold.holds.push(h); return h; };
  FOLD = fold;
  return fold;
};
const connect = (ev, w, fold, tag) => { w.__fold = fold.dirFor(tag); ev(`_liveCfg=Object.assign(liveCfg(), {store:true, mode:'drive', on:false}); _driveDir=globalThis.__fold; 'ok'`); };
const live = ev => ev(`_liveCfg.on=true; _liveCfg.auto=true; _driveLive=true; 'ok'`);   // Live view and autosave on (audit-import's live())

// ---- THE BROWSER: one lock manager, one storage area ----
const LM = makeLockManager('browser (tabs A, B, C)');
const LMx = makeLockManager('other machine (X)');
// B is the first tab; `second` opened later from the same storage: what its boot wrote goes into the shared area (it happened
// last), and from then on both read and write one Map. Returns the keys the second tab's boot added or changed.
const shareStorage = (first, second) => {
  const a = jsdomUtils.implForWrapper(first.w.localStorage), b = jsdomUtils.implForWrapper(second.w.localStorage);
  const changed = [];
  for (const [k, v] of b._items) { if (a._items.get(k) !== v) changed.push(k); a._items.set(k, v); }
  b._items = a._items;
  return changed.sort();
};
const TABS = [];
const openTab = async (opts, client, lm) => {
  const T = boot(opts); await pause(80);
  T.client = client; T.lm = lm;
  T.lockInstall = lm ? lm.install(T.w, client) : { had: 'locks' in T.w.navigator, client, none: true };
  wire(T.ev, 'Alice', KEY.alice);
  TABS.push(T); return T;
};
const closeTab = T => { if (T.lm) T.lm.closeClient(T.client); try { T.w.close(); } catch {} };

// ---- the page's own buttons (u19) ----
const clickSave = ev => ev(`(function(){ var b=document.getElementById('saveBtn'); if(!b) return null; b.click(); return _saveChain; })()`);
const clickPutBack = ev => ev(`(function(){ var b=document.querySelector('#saveState .keptbtn'); if(!b) return 'NO BUTTON'; b.click(); return 'clicked'; })()`);
const clickStatus = (ev, call) => ev(`(function(){ var bs=[].slice.call(document.querySelectorAll('#shareStat button')).filter(function(b){ return (b.getAttribute('onclick')||'')===${J(call)}; });
  if(bs.length!==1) return 'BUTTONS:'+bs.length; bs[0].click(); return _saveChain; })()`);

// ---- observation (read only) ----
const noteOf = txt => { try { const j = JSON.parse(txt), st = j.store || j, y = (st.years || {})[st.cur] || {}; return String((y.notes || {}).A || ''); } catch (e) { return '(unreadable)'; } };
const headOf = fold => { const t = fold.root.files[NM]; if (t == null) return { note: '(no copy)', ts: 0, by: '' };
  const j = JSON.parse(t); return { note: noteOf(t), ts: +((j.store && j.store.ts) || j.ts || 0), by: j.by || '', writer: (j.writer || {}).by || '' }; };
const histOf = fold => { const h = (fold.root.dirs.history || { files: {} }).files;
  return Object.keys(h).sort().filter(n => /-om-/.test(n)).map(n => ({ name: n.replace(/^spmt-2027-om-/, ''), note: noteOf(h[n]) })); };
const keptOf = ev => { const s = ev(`localStorage.getItem(_AP.key+'.kept')`); if (s == null) return null;
  const i = s.indexOf('\n'); const m = JSON.parse(s.slice(0, i)); return { note: noteOf(s.slice(i + 1)), why: m.why, baseFolder: (m.base && m.base.folder) || null, baseFile: (m.base && m.base.file) || null }; };
const board = ev => JSON.parse(ev(`JSON.stringify({screen:String(S.notes.A||''), DIRTY:DIRTY, _baseDirty:_baseDirty, base:baseGet(),
  driveBase:driveBaseOf(mySlug()), LASTKNOWN:LASTKNOWN, gen:_saveGen, busy:_saveBusy, MSts:MS.ts, cur:MS.cur, slug:mySlug(), key:_AP.key,
  storageMain:(function(){ try{ var st=JSON.parse(localStorage.getItem(_AP.key)); var y=(st.years||{})[st.cur]||{}; return String((y.notes||{}).A||''); }catch(e){ return '(unreadable)'; } })(),
  hasPutBack:!!document.querySelector('#saveState .keptbtn')})`));
// One observation of tab T: the board's own state, what it says, what it asked since `q0`, and the folder (or file).
const snap = (T, ctx, q0 = 0, extra = {}) => {
  const b = board(T.ev);
  const o = { ...b, saved: !b.DIRTY && !b._baseDirty && !(b.base && b.base.dirty), kept: keptOf(T.ev), status: status(T.ev), header: header(T.ev),
    prompts: qs(T.ev).slice(q0), lock: LM.snapshot(), ...extra };
  if (ctx.fold) { o.head = headOf(ctx.fold); o.hist = histOf(ctx.fold);
    // FALSELY CLEAN: recorded saved, but the folder's copy is not what is on screen, or the record names another copy.
    o.falselyClean = o.saved && !(o.screen === o.head.note && b.driveBase === o.head.ts); }
  if (ctx.f) { o.file = { note: fileNote(ctx.f.content, 'A'), ts: fileTs(ctx.f.content), writes: ctx.f.writes };
    o.falselyClean = o.saved && !(o.screen === o.file.note && b.LASTKNOWN === o.file.ts); }
  if (ctx.markers) o.reach = reach(o, ctx);
  return o;
};
// WHERE EACH COPY IS: the places this board offers (screen, this browser's storage, the kept slot, the folder's copy and its
// history, or the file), and outside it (the file mock's version log, a stand-in for Teams version history).
const reach = (o, ctx) => { const r = {};
  for (const m of ctx.markers) { const p = [];
    if (o.screen === m) p.push('screen'); if (o.storageMain === m) p.push('storage'); if (o.kept && o.kept.note === m) p.push('kept');
    if (o.head && o.head.note === m) p.push('folder'); if (o.hist && o.hist.some(h => h.note === m)) p.push('history');
    if (o.file && o.file.note === m) p.push('file');
    if (ctx.f && ctx.f.versions.some(v => { try { return fileNote(v, 'A') === m; } catch (e) { return false; } }) && !p.includes('file')) p.push('outside:versionHistory');
    r[m] = p; }
  return r; };
// The save step's own record (raw): did B write the folder's copy (or the file), what it replaced with what, and what was
// asked. Whether a replacement needed asking is decided in check.mjs from the fixture's hand-written lineage.
const saveRecord = (ctx, before, q0, T, w0) => {
  const qsNow = qs(T.ev).slice(q0);
  if (ctx.fold) { const wrote = ctx.fold.writes.slice(w0).filter(w => w.tag === T.client && w.path === NM).length; const after = headOf(ctx.fold);
    return { wrote, before: before.note, after: after.note, headBefore: before, headAfter: after, asked: qsNow,
      replacedInHistory: before.note === '(no copy)' ? null : histOf(ctx.fold).some(h => h.note === before.note) }; }
  const wrote = ctx.f.writes - w0, afterNote = fileNote(ctx.f.content, 'A');
  return { wrote, before, after: afterNote, asked: qsNow };
};
const T = {};   // stamps (observed)
const R = OUT.steps;

// ---- TAB A: a second tab of this browser, on FULL FUND, opened from the same storage; its 💾 Save held at the close of
// its write of spmt-2027-ff.json, so it holds 'orbit-save'.
const F1 = baseFile('Alice', KEY.alice);
T.F1 = fileTs(F1);
async function openTabA(B, fold, lm) {
  const A = boot({ html: F1, appn: 'FULL FUND', ls: lsOf(B.ev) }); await pause(80);
  A.client = 'A'; A.lm = lm;
  const changed = shareStorage(B, A);
  A.lockInstall = lm ? lm.install(A.w, 'A') : { had: 'locks' in A.w.navigator, client: 'A', none: true };
  wire(A.ev, 'Alice', KEY.alice);
  seed(A.ev, { services: SVC, items: [mk('X', [300, 100, 50])], disc: [2000, 600, 300], mand: [500, 150, 80], order: ['X'] });
  A.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); setNote('X','FF-WORK'); 'ok'`);
  connect(A.ev, A.w, fold, 'A');
  // the one storage area, both ways
  A.ev(`localStorage.setItem('u20-share-check','from A'); 'ok'`); const seenByB = B.ev(`localStorage.getItem('u20-share-check')`);
  B.ev(`localStorage.removeItem('u20-share-check'); 'ok'`); const seenByAafter = A.ev(`localStorage.getItem('u20-share-check')`);
  TABS.push(A);
  OUT.tabA = { slug: A.ev('mySlug()'), key: A.ev('_AP.key'), bootChangedKeys: changed, share: [seenByB, seenByAafter], lockInstall: A.lockInstall };
  return A;
}
async function holdA(A, fold) {
  const h = fold.holdOnce({ tag: 'A', op: 'close', path: NMFF });
  const pA = clickSave(A.ev);
  const reached = await until(() => h.hit === 1);
  return { h, pA, reached, heldBy: LM.heldBy('orbit-save'), Abusy: A.ev('_saveBusy') };
}
// U20's PREMISE, read at the moment of the action: B's save is waiting on A's lock and B does not count it.
const premise = (A, B, fold, w0Log) => ({ Bbusy: B.ev('_saveBusy'), Abusy: A ? A.ev('_saveBusy') : null, heldBy: LM.heldBy('orbit-save'),
  pendingOf: LM.pendingOf('orbit-save'), BfolderOpsSinceSave: fold ? fold.log.slice(w0Log).filter(x => x.startsWith(B.client + ':')) : null,
  Bstatus: status(B.ev), Bheader: header(B.ev) });

// ====================================================================================== PB: ↶ Put back (folder)
async function setupPB(fold, lm) {
  const B = await openTab({ html: F1 }, 'B', lm); connect(B.ev, B.w, fold, 'B');
  B.ev(`setNote('A','F0-BASE'); 'ok'`); await pause(5);
  R.F0push = await within(B.ev('driveStorePush(false)')); T.F0 = headOf(fold).ts; await pause(5);
  B.ev(`setNote('A','K-KEPTWORK'); 'ok'`); await pause(5);
  const X = await openTab({ html: F1 }, 'X', lm ? LMx : null); connect(X.ev, X.w, fold, 'X');
  R.Xpull = await within(X.ev('driveStorePull(false)')); await pause(5);
  X.ev(`setNote('A','N-NEWER'); 'ok'`); await pause(5);
  R.Npush = await within(X.ev('driveStorePush(false)')); T.N = headOf(fold).ts; closeTab(X); await pause(5);
  const q0 = qs(B.ev).length;
  R.clashSave = await within(clickSave(B.ev)); R.clashStatus = status(B.ev);
  R.loadTheirs = await within(clickStatus(B.ev, "driveResolve('theirs')")); await pause(5);
  B.ev(`setNote('A','S1-ONSCREEN'); 'ok'`); await pause(5);
  const A = await openTabA(B, fold, lm);
  const ctx = { fold, markers: ['K-KEPTWORK', 'S1-ONSCREEN', 'N-NEWER', 'F0-BASE'] };
  R.setup = snap(B, ctx, q0);
  return { A, B, ctx };
}
async function runPB(kind) {
  const fold = folder();
  const lm = kind === 'NL' ? null : LM;
  const { A, B, ctx } = await setupPB(fold, lm);
  const q0 = qs(B.ev).length, w0 = fold.writes.length, l0 = fold.log.length, m0 = LM.mark();
  let pB = null, before = null, qSave = 0, wSave = 0, hA = null, hB = null, tick1 = null;
  if (kind === 'W' || kind === 'Wtick' || kind === 'NL') {
    hA = await holdA(A, fold); R.Aheld = { reached: hA.reached, heldBy: hA.heldBy, Abusy: hA.Abusy };
    if (kind === 'Wtick') { live(B.ev); tick1 = B.ev('liveTick()'); }      // the Live timer's tick: autosave first (B has unsaved work)
    else pB = clickSave(B.ev);
    R.waiting = await until(() => kind === 'NL' ? fold.log.slice(l0).some(x => x === 'B:read:' + NM) : LM.pendingOf('orbit-save').includes('B'));
    await pause(20);
    R.premise = premise(A, B, fold, l0);
  } else if (kind === 'C1') {
    hB = fold.holdOnce({ tag: 'B', op: 'read', path: NM });
    pB = clickSave(B.ev); R.waiting = await until(() => hB.hit === 1);
    R.premise = premise(A, B, fold, l0);
  } else if (kind === 'C2b') {
    before = headOf(fold); qSave = qs(B.ev).length; wSave = fold.writes.length;
    R.saveRet = await within(clickSave(B.ev)); await pause(20);
    R.save = { ...snap(B, ctx, qSave), rec: saveRecord(ctx, before, qSave, B, wSave) };
  }
  // ↶ PUT BACK (the header's button), its confirm answered OK
  { const qa = qs(B.ev).length; const ms0 = B.ev('JSON.stringify(MS)'), kept0 = B.ev(`localStorage.getItem(_AP.key+'.kept')`);
    R.putBackClick = clickPutBack(B.ev); await pause(5);
    R.during = { ...snap(B, ctx, qa), msUnchanged: B.ev('JSON.stringify(MS)') === ms0, keptUnchanged: B.ev(`localStorage.getItem(_AP.key+'.kept')`) === kept0 }; }
  // THE SAVE RUNS: A released (W, NL), B's hold released (C1), or 💾 Save pressed now (C2a)
  if (kind !== 'C2b') {
    before = headOf(fold); qSave = qs(B.ev).length; wSave = fold.writes.length;
    if (hA) { hA.h.g.open(); R.Aret = await within(hA.pA); }
    if (hB) hB.g.open();
    if (kind === 'C2a') pB = clickSave(B.ev);
    R.saveRet = pB ? await within(pB) : null;
    if (tick1) R.tick1Ret = await within(tick1, 10000);
    await pause(20);
    R.save = { ...snap(B, ctx, qSave), rec: saveRecord(ctx, before, qSave, B, wSave) };
  }
  R.grantOrder = LM.grantOrder('orbit-save', m0);
  // THE NEXT 💾 SAVE (no contention): does it write over a copy without asking?
  { const b2 = headOf(fold), q2 = qs(B.ev).length, w2 = fold.writes.length;
    R.nextRet = await within(clickSave(B.ev)); await pause(20);
    R.next = { ...snap(B, ctx, q2), rec: saveRecord(ctx, b2, q2, B, w2) }; }
  await reopen(B, A, ctx);
}

// ====================================================================================== AD: a refresh that would adopt
async function setupAD(fold) {
  const B0 = await openTab({ html: F1 }, 'B0', LM); connect(B0.ev, B0.w, fold, 'B0');
  B0.ev(`setNote('A','F0-BASE'); 'ok'`); await pause(5);
  R.F0push = await within(B0.ev('driveStorePush(false)')); T.F0 = headOf(fold).ts; await pause(5);
  B0.ev(`setNote('A','WORKING'); 'ok'`); await pause(5);
  const ls = lsOf(B0.ev); closeTab(B0); await pause(5);
  // B: this browser reopened (WORKING unsaved by its record, DIRTY false in the new session); the harness connect, no pull.
  const B = await openTab({ html: F1, ls }, 'B', LM); connect(B.ev, B.w, fold, 'B');
  const X = await openTab({ html: F1 }, 'X', LMx); connect(X.ev, X.w, fold, 'X');
  R.Xpull = await within(X.ev('driveStorePull(false)')); await pause(5);
  const A = await openTabA(B, fold, LM);
  const ctx = { fold, markers: ['WORKING', 'N2-NEWER', 'F0-BASE'] };
  R.setup = snap(B, ctx, 0);
  return { A, B, X, ctx };
}
const xSave = async (X, fold) => { X.ev(`setNote('A','N2-NEWER'); 'ok'`); await pause(5); const r = await within(X.ev('driveStorePush(false)')); await pause(5);
  return { ret: r, status: status(X.ev), head: headOf(fold) }; };
const refreshB = async (B, how) => { if (how === 'tick') { live(B.ev); return await within(B.ev('liveTick()'), 10000); } return await within(B.ev('driveStorePull(false)')); };
async function runAD(kind) {
  const fold = folder();
  const { A, B, X, ctx } = await setupAD(fold);
  const l0 = fold.log.length, m0 = LM.mark();
  let pB = null, before = null, qSave = 0, wSave = 0, hA = null, hB = null;
  if (kind === 'W' || kind === 'Wtick') {
    hA = await holdA(A, fold); R.Aheld = { reached: hA.reached, heldBy: hA.heldBy, Abusy: hA.Abusy };
    pB = clickSave(B.ev); R.waiting = await until(() => LM.pendingOf('orbit-save').includes('B')); await pause(20);
    R.premise = premise(A, B, fold, l0);
  } else if (kind === 'C1') {
    hB = fold.holdOnce({ tag: 'B', op: 'read', path: NM });
    pB = clickSave(B.ev); R.waiting = await until(() => hB.hit === 1);
    R.premise = premise(A, B, fold, l0);
  } else if (kind === 'C2b') {
    before = headOf(fold); qSave = qs(B.ev).length; wSave = fold.writes.length;
    R.saveRet = await within(clickSave(B.ev)); await pause(20);
    R.save = { ...snap(B, ctx, qSave), rec: saveRecord(ctx, before, qSave, B, wSave) };
  }
  R.xSave = await xSave(X, fold);
  { const qa = qs(B.ev).length; const s0 = B.ev(`JSON.stringify([JSON.stringify(MS), DIRTY, _baseDirty, JSON.stringify(_driveBase), localStorage.getItem(_AP.key+'.base'), _saveGen, localStorage.getItem(_AP.key+'.kept')])`);
    R.refreshRet = await refreshB(B, kind === 'Wtick' ? 'tick' : 'pull'); await pause(5);
    R.during = { ...snap(B, ctx, qa), unchanged: B.ev(`JSON.stringify([JSON.stringify(MS), DIRTY, _baseDirty, JSON.stringify(_driveBase), localStorage.getItem(_AP.key+'.base'), _saveGen, localStorage.getItem(_AP.key+'.kept')])`) === s0 }; }
  if (kind !== 'C2b') {
    before = headOf(fold); qSave = qs(B.ev).length; wSave = fold.writes.length;
    if (hA) { hA.h.g.open(); R.Aret = await within(hA.pA); }
    if (hB) hB.g.open();
    if (kind === 'C2a') pB = clickSave(B.ev);
    R.saveRet = await within(pB); await pause(20);
    R.save = { ...snap(B, ctx, qSave), rec: saveRecord(ctx, before, qSave, B, wSave) };
  }
  R.grantOrder = LM.grantOrder('orbit-save', m0);
  { const b2 = headOf(fold), q2 = qs(B.ev).length, w2 = fold.writes.length;
    R.nextRet = await within(clickSave(B.ev)); await pause(20);
    R.next = { ...snap(B, ctx, q2), rec: saveRecord(ctx, b2, q2, B, w2) }; }
  closeTab(X);
  await reopen(B, A, ctx);
}

// ====================================================================================== BR: a refresh that would record the base
async function setupBR(fold, perm, hist) {
  const X = await openTab({ html: F1 }, 'X', LMx); connect(X.ev, X.w, fold, 'X');
  // `hist` (BR-Wh, BR-C1h, BR-Wpermh): the folder already has a history: X saved F00-FIRST, then F0-BASE over it a moment
  // later, so F00-FIRST is the newest spaced history copy (kept less than ten minutes before the next keep).
  if (hist) { X.ev(`setNote('A','F00-FIRST'); 'ok'`); await pause(5); R.F00push = await within(X.ev('driveStorePush(false)')); T.F00 = headOf(fold).ts; await pause(5); }
  X.ev(`setNote('A','F0-BASE'); 'ok'`); await pause(5);
  R.F0push = await within(X.ev('driveStorePush(false)')); T.F0 = headOf(fold).ts; closeTab(X); await pause(5);
  // B: this browser has no record of the folder for O&M FY27; it opens the board file and types B-EDIT; the harness connect.
  // `perm` (BR-Wperm, BR-C1perm): the folder's edit permission is not kept, so the opening's own connect (driveAutoConnect)
  // stops at one click (_driveNeed 'click') and records nothing -- the bar's Connect (driveConnectNow) is the refresh.
  if (perm) fold.perm = 'prompt';
  const B = await openTab({ html: F1 }, 'B', LM); connect(B.ev, B.w, fold, 'B');
  let opening = null;
  if (perm) { B.ev(`_liveCfg.folder='shared'; 'ok'`); opening = await within(B.ev('driveAutoConnect()')); opening = { ret: opening, need: B.ev('_driveNeed'), driveBase: B.ev('driveBaseOf(mySlug())') }; }
  B.ev(`setNote('A','B-EDIT'); 'ok'`); await pause(5);
  const A = await openTabA(B, fold, LM);
  const ctx = { fold, markers: hist ? ['B-EDIT', 'F0-BASE', 'F00-FIRST'] : ['B-EDIT', 'F0-BASE'] };
  R.setup = snap(B, ctx, 0, { theirsNotNewer: headOf(fold).ts <= +B.ev('MS.ts'), opening, perm: fold.perm || 'granted' });
  return { A, B, ctx };
}
async function runBR(kind0) {
  const fold = folder();
  const perm = /perm/.test(kind0), hist = /h$/.test(kind0), kind = kind0.replace(/perm/, '').replace(/h$/, '');
  const { A, B, ctx } = await setupBR(fold, perm, hist);
  const l0 = fold.log.length, m0 = LM.mark();
  let pB = null, before = null, qSave = 0, wSave = 0, hA = null, hB = null, tick1 = null;
  if (kind === 'W' || kind === 'Wtick') {
    hA = await holdA(A, fold); R.Aheld = { reached: hA.reached, heldBy: hA.heldBy, Abusy: hA.Abusy };
    pB = clickSave(B.ev); R.waiting = await until(() => LM.pendingOf('orbit-save').includes('B')); await pause(20);
    R.premise = premise(A, B, fold, l0);
  } else if (kind === 'C1') {
    hB = fold.holdOnce({ tag: 'B', op: 'read', path: NM });
    pB = clickSave(B.ev); R.waiting = await until(() => hB.hit === 1);
    R.premise = premise(A, B, fold, l0);
  } else if (kind === 'C2b') {
    before = headOf(fold); qSave = qs(B.ev).length; wSave = fold.writes.length;
    R.saveRet = await within(clickSave(B.ev)); await pause(20);
    R.save = { ...snap(B, ctx, qSave), rec: saveRecord(ctx, before, qSave, B, wSave) };
  }
  { const qa = qs(B.ev).length;
    if (kind === 'Wtick') {
      // Live view and autosave on: the first tick queues its autosave (B has unsaved work) behind the waiting Save and waits
      // for it, so its own refresh cannot run now; the NEXT tick (the timer does not wait for the first) skips the autosave
      // (_autoBusy) and refreshes.
      live(B.ev); tick1 = B.ev('liveTick()'); await pause(5);
      R.tick1Pending = LM.pendingOf('orbit-save');
      R.refreshRet = await within(B.ev('liveTick()'), 10000);
    } else if (perm) R.refreshRet = await within(B.ev('driveConnectNow()'));     // the bar's Connect: one click, then its pull
    else R.refreshRet = await refreshB(B, 'pull');
    await pause(5);
    R.during = snap(B, ctx, qa, { need: B.ev('_driveNeed'), perm: fold.perm || 'granted' }); }
  if (kind !== 'C2b') {
    before = headOf(fold); qSave = qs(B.ev).length; wSave = fold.writes.length;
    if (hA) { hA.h.g.open(); R.Aret = await within(hA.pA); }
    if (hB) hB.g.open();
    if (kind === 'C2a') pB = clickSave(B.ev);
    R.saveRet = await within(pB);
    if (tick1) R.tick1Ret = await within(tick1, 10000);
    await pause(20);
    R.save = { ...snap(B, ctx, qSave), rec: saveRecord(ctx, before, qSave, B, wSave) };
  }
  R.grantOrder = LM.grantOrder('orbit-save', m0);
  { const b2 = headOf(fold), q2 = qs(B.ev).length, w2 = fold.writes.length;
    R.nextRet = await within(clickSave(B.ev)); await pause(20);
    R.next = { ...snap(B, ctx, q2), rec: saveRecord(ctx, b2, q2, B, w2) }; }
  await reopen(B, A, ctx);
}

// ====================================================================================== PF: ↶ Put back (the board file)
async function setupPF(fold) {
  const B0 = await openTab({ html: F1 }, 'B0', LM); disk(B0.w, F1);
  B0.ev(`setNote('A','K-KEPTWORK'); 'ok'`); await pause(5);
  const X = await openTab({ html: F1 }, 'X', LMx); const f2 = disk(X.w, F1);
  X.ev(`setNote('A','N-NEWER'); 'ok'`); await pause(5);
  R.Nsave = await within(X.ev('saveInPlaceFile()')); const newer = f2.content; T.N = fileTs(newer); closeTab(X);
  const ls = lsOf(B0.ev); closeTab(B0); await pause(5);
  const B = await openTab({ html: newer, ls }, 'B', LM); const f = disk(B.w, newer);
  f.versions = [F1, newer];
  B.ev(`setNote('A','S1-ONSCREEN'); 'ok'`); await pause(5);
  const A = await openTabA(B, fold, LM);
  const ctx = { f, markers: ['K-KEPTWORK', 'S1-ONSCREEN', 'N-NEWER'] };
  R.setup = snap(B, ctx, 0);
  return { A, B, f, ctx };
}
async function runPF(kind) {
  const fold = folder();      // A's folder only (A's held save); B saves to the board file
  const { A, B, f, ctx } = await setupPF(fold);
  const m0 = LM.mark();
  let pB = null, before = null, qSave = 0, wSave = 0, hA = null, gB = null;
  if (kind === 'W') {
    hA = await holdA(A, fold); R.Aheld = { reached: hA.reached, heldBy: hA.heldBy, Abusy: hA.Abusy };
    const r0 = f.hits.read || 0;
    pB = clickSave(B.ev); R.waiting = await until(() => LM.pendingOf('orbit-save').includes('B')); await pause(20);
    R.premise = { ...premise(A, B, null, 0), BfileReadsSinceSave: (f.hits.read || 0) - r0 };
  } else if (kind === 'C1') {
    const r0 = f.hits.read || 0; f.hold.read = gate(); gB = f.hold.read;
    pB = clickSave(B.ev); R.waiting = await until(() => (f.hits.read || 0) > r0);
    R.premise = premise(A, B, null, 0);
  }
  { const qa = qs(B.ev).length; const ms0 = B.ev('JSON.stringify(MS)'), kept0 = B.ev(`localStorage.getItem(_AP.key+'.kept')`);
    R.putBackClick = clickPutBack(B.ev); await pause(5);
    R.during = { ...snap(B, ctx, qa), msUnchanged: B.ev('JSON.stringify(MS)') === ms0, keptUnchanged: B.ev(`localStorage.getItem(_AP.key+'.kept')`) === kept0 }; }
  before = fileNote(f.content, 'A'); qSave = qs(B.ev).length; wSave = f.writes;
  B.ev('globalThis.__yes=false; 0');          // the HOLD ON question, if asked, is answered Cancel
  if (hA) { hA.h.g.open(); R.Aret = await within(hA.pA); }
  if (gB) gB.open();
  if (kind === 'C2a') pB = clickSave(B.ev);
  R.saveRet = await within(pB); await pause(20);
  B.ev('globalThis.__yes=true; 0');
  R.save = { ...snap(B, ctx, qSave), rec: saveRecord(ctx, before, qSave, B, wSave) };
  R.grantOrder = LM.grantOrder('orbit-save', m0);
  // reopen: this browser's storage and the board file as it is now
  const ls = lsOf(B.ev); closeTab(A); closeTab(B);
  const C = await openTab({ html: f.content, ls, appn: 'O&M' }, 'C', LM); disk(C.w, f.content);
  R.reopen = snap(C, { f: { content: f.content, writes: f.writes, versions: f.versions }, markers: ctx.markers }, 0);
  closeTab(C);
}

// THE REOPEN (folder routes): this browser's storage as the tabs left it (both closed), the same folder; the harness connect,
// then a refresh. The appropriation is chosen as O&M (tab A had set the browser's last choice to FULL FUND).
async function reopen(B, A, ctx) {
  const ls = lsOf(B.ev); R.lastAppnChoice = ls.prio27appn || null;
  closeTab(A); closeTab(B); await pause(5);
  const C = await openTab({ html: F1, ls, appn: 'O&M' }, 'C', LM); connect(C.ev, C.w, ctx.fold, 'C');
  R.reopenOpened = snap(C, ctx, 0);
  R.reopenPull = await within(C.ev('driveStorePull(true)')); await pause(5);
  R.reopen = snap(C, ctx, 0);
  closeTab(C);
}

const t0 = Date.now();
const mark = bootMark();
try {
  const [route, kind] = scenario.split('-');
  if (route === 'PB') await runPB(kind);
  else if (route === 'AD') await runAD(kind);
  else if (route === 'BR') await runBR(kind);
  else await runPF(kind);
} catch (e) { OUT.errors.push(String((e && e.stack) || e).slice(0, 1500)); console.log('THREW', String((e && e.stack) || e).slice(0, 1500)); }
OUT.T = T;
OUT.wall_s = ((Date.now() - t0) / 1000).toFixed(1);
try { bootRelease(mark); await within(settleBoards(), 5000); } catch {}
finish(OUT.errors.length ? 2 : 0);
