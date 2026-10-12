
// =============================================================================================== U17 probe body
const { J, wire, KEY, status, header, baseFile, folder, connect, gate, until, pause, lsOf, qs } = W1H;
// WHICH BOARD (identity read from the bytes; the expectations below are literal per board)
const BK = { '98eed7e801af20270f755eadffb2fa72355c30e5': 'u13', '1375b72b6707faa57c50d528e01ce9611f194998': 'pre' }[IDS.board];
if (!BK) throw new Error('unknown board blob ' + IDS.board + ' (expected 98eed7e8 = 63bd8b0, or 1375b72b = a8891e1)');
const FY = '2027';                                   // seed() puts the board on FY27 (MS.cur = 2027)
const HOUR = 3600000;                                // REMOTE's clock is this far ahead of real time (the skew fixture)
const MAIN = 'spmt-' + FY + '-om.json';
// The U13 commit's refusal, word for word (status line text, whitespace collapsed), as committed in 63bd8b0 (L26743-26745).
const U13_WORDS = '⏳ The shared folder’s copy of O&M FY27 was not loaded: a save or Load theirs was under way, so this board kept '
  + 'its own copy of O&M FY27. The folder’s copy is checked again on the next refresh once that has finished (📡 Live view → '
  + '↻ Refresh now, or on its own while Live view is on).';
// ---- THE FIXTURES (literal): requirement A's note and its allocation total, whole dollars.
//  skew   (u13codex):  REMOTE/$650 already in the folder, stamped an hour ahead; WORKING/$700 Brad's unsaved edit on it
//  pen    (u13probe):  BRAD-1/$700 Brad's saved copy; BOB-2/$650 Bob's copy, saved with ✍ Take the pen during Brad's save
//  adopt  (U24 paths): BRAD-1/$700 Brad's saved copy; BRAD-2/$720 his edit; SHARED/$600 the shared state file (Carol's);
//                      IMPORT/$610 a board file imported with ⬅ Import several boards; F1 = the board file's own state
const KNOWN = [['REMOTE', 650], ['WORKING', 700], ['BOB-2', 650], ['BRAD-1', 700], ['BRAD-2', 720], ['SHARED', 600], ['IMPORT', 610]];
const whose = c => { if (!c || c.err) return c ? 'unreadable' : null;
  for (const [n, a] of KNOWN) if (c.note === n && c.alloc === a) return n;
  if (c.note === '' && (c.alloc == null || c.alloc === 0)) return 'F1';
  return 'other:' + c.note + '/' + c.alloc; };
const et = t => t ? new Date(+t).toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false }) + ' ET' : null;
// ---- OBSERVED values (read only)
const rawContent = txt => { try { const j = JSON.parse(txt); const st = j.store || j; const y = (st.years || {})[FY] || {};
  return { note: String((y.notes || {}).A || ''), alloc: (y.alloc && y.alloc.A && typeof y.alloc.A === 'object') ? y.alloc.A.v : (y.alloc ? y.alloc.A : undefined),
           ts: +((j.store && j.store.ts) || j.ts || 0), payloadTs: +(j.ts || 0), by: j.by || st.by || '', writer: (j.writer && j.writer.by) || '' }; }
  catch (e) { return { err: String(e.message) }; } };
const headOf = fold => { const t = fold.raw(FY); if (t == null) return null; const c = rawContent(t); c.whose = whose(c); c.tsET = et(c.ts); return c; };
const histOf = fold => Object.entries((fold.root.dirs.history || { files: {} }).files)
  .filter(([n]) => /^spmt-2027-om-/.test(n)).map(([n, t]) => { const c = rawContent(t); return { name: n, ...c, whose: whose(c), tsET: et(c.ts) }; });
const view = (ev, label) => {
  const o = JSON.parse(ev(`(function(){
    var y=String(MS.cur), a=(S.alloc||{}).A, st=null, kept=null;
    try{ var s=JSON.parse(localStorage.getItem(_AP.key)||'null'); var ys=s&&s.years&&s.years[y]; var sa=ys&&ys.alloc&&ys.alloc.A;
         st={note:String(((ys&&ys.notes)||{}).A||''), alloc:(sa&&typeof sa==='object')? sa.v : sa, ts:+(s&&s.ts||0)}; }catch(e){ st={err:String(e.message)}; }
    try{ var k=localStorage.getItem(_AP.key+'.kept'); if(k){ var i=k.indexOf('\\n'); var m=JSON.parse(k.slice(0,i)); var r=JSON.parse(k.slice(i+1)); var ry=(r.years||{})[y]||{}; var ra=(ry.alloc||{}).A;
         kept={meta:{why:m.why, by:m.by, ts:m.ts, base:m.base}, note:String((ry.notes||{}).A||''), alloc:(ra&&typeof ra==='object')? ra.v : ra}; } }catch(e){ kept={err:String(e.message)}; }
    return JSON.stringify({ screen:{note:String((S.notes||{}).A||''), alloc:(a&&typeof a==='object')? a.v : a, ts:+(MS.ts||0), by:MS.by||'', cur:MS.cur},
      DIRTY:DIRTY, _baseDirty:_baseDirty, baseGet:baseGet(), driveBaseOf:driveBaseOf(mySlug()), _saveGen:_saveGen, _saveBusy:_saveBusy,
      _driveLive:_driveLive, _driveNeed:_driveNeed, stored:st, kept:kept });
  })()`));
  o.label = label; o.screen.whose = whose(o.screen); o.screen.tsET = et(o.screen.ts); o.stored.whose = whose(o.stored); if (o.kept) o.kept.whose = whose(o.kept);
  o.baseFolder = +(((o.baseGet || {}).folder || {})['om|' + FY]) || 0;
  o.status = status(ev).replace(/\s+/g, ' ').trim(); o.header = header(ev).replace(/\s+/g, ' ').trim();
  o.at = et(Date.now());
  return o;
};
const fview = (fold, label) => ({ label, head: headOf(fold), history: histOf(fold), log: fold.log.slice(), reads: fold.reads, at: et(Date.now()) });
const cleanOf = v => !v.DIRTY && !v._baseDirty && !v.baseGet.dirty;
// ---- checks. kind 'fixture' = the route's preconditions; 'predict' = a literal written per board from reading its code
// (a failure means the reading was wrong); 'contract' = the property (K1-K3, reach, U17.V3, U17.V4): on 63bd8b0 it is
// expected to hold on the measured routes, and on 1375b72b (the control board) the measured routes must still break it.
const checks = [];
const ck = (id, what, got, want, kind = 'predict') => { const ok = J(got) === J(want); checks.push({ id, kind, what, expected: want, observed: got, pass: ok }); return ok; };
const ckAny = (id, what, got, wants, kind = 'contract') => { const ok = wants.some(w => J(w) === J(got)); checks.push({ id, kind, what, expected: wants, observed: got, pass: ok }); return ok; };
const ckNot = (id, what, got, forbidden, kind = 'contract') => { const ok = J(got) !== J(forbidden); checks.push({ id, kind, what, expected: { not: forbidden }, observed: got, pass: ok }); return ok; };
const rec = { scenario: SCN, next: NEXT, board: BK, ids: IDS, startedET: et(Date.now()), steps: [] };
const step = (name, o) => { rec.steps.push({ step: name, ...o }); };
rec.contract = 'the board must never be recorded clean (saved) while what is on screen differs from the copy its record names as base; '
  + 'each content must remain in some reachable copy; and from such a record (U17) 💾 Save must not write the screen copy over a different '
  + 'head without asking, nor ↶ Put back claim the screen copy is still in the folder when it is not and then keep nothing aside';

// ---- SCENARIOS
const CFG = {
  // the routes that reached U13's end state before (rec/L2/u13codex builder: S1*; its verifier: V1same, V1sameperm, V2live)
  S1harness:  { fam: 'skew', ahead: HOUR, reopen: 'harness', held: true, pull: 'pull', measured: true },
  S1tick:     { fam: 'skew', ahead: HOUR, reopen: 'harness', held: true, pull: 'tick', measured: true },
  S1perm:     { fam: 'skew', ahead: HOUR, reopen: 'perm',    held: true, pull: 'connect', measured: true },
  S1open:     { fam: 'skew', ahead: HOUR, reopen: 'harness', held: true, pull: 'auto', measured: true },
  S1pen:      { fam: 'skew', ahead: HOUR, reopen: 'harness', held: true, pull: 'pull', remoteBy: 'Bob', via: 'pen', measured: true },
  V1same:     { fam: 'skew', ahead: HOUR, reopen: 'harness', held: true, pull: 'pull', same: true, measured: true },
  V1sameperm: { fam: 'skew', ahead: HOUR, reopen: 'perm',    held: true, pull: 'connect', same: true, measured: true },
  V2live:     { fam: 'skew', ahead: HOUR, reopen: 'livefail', held: true, pull: 'timer', measured: true },
  // the second-writer route (rec/L2/u13probe S1pull / S1tick)
  W2pull:     { fam: 'pen', held: true, bob: true, pull: 'pull', measured: true },
  W2tick:     { fam: 'pen', held: true, bob: true, pull: 'tick', measured: true },
  // controls (u13codex Ca/Cb/Cc; u13probe C1/C3): no save under way, or nothing newer, or DIRTY this session
  Ca:         { fam: 'skew', ahead: 0,    reopen: 'harness', held: true,  pull: 'pull' },
  Cb:         { fam: 'skew', ahead: HOUR, reopen: 'none',    held: true,  pull: 'pull' },
  Cc:         { fam: 'skew', ahead: HOUR, reopen: 'harness', held: false, pull: 'pull' },
  C1:         { fam: 'pen', held: false, bob: true,  pull: 'pull' },
  C3:         { fam: 'pen', held: true,  bob: false, pull: 'pull' },
  // searched for: U25's save-during-read boundary -- the refresh is held at its read (S1harness state), and a save runs then
  U25ws:      { fam: 'skew', ahead: HOUR, reopen: 'harness', u25: 'after',  pull: 'pull' },   // its bytes (REMOTE) taken; a WHOLE save lands meanwhile
  U25wf:      { fam: 'skew', ahead: HOUR, reopen: 'harness', u25: 'before', pull: 'pull' },   // held before its bytes are taken; a whole save lands
  U25mid:     { fam: 'skew', ahead: HOUR, reopen: 'harness', u25: 'mid',    pull: 'pull' },   // its bytes taken; a save STARTS and is held at its write
  // searched for: U20 -- a save waiting for another tab's Web Lock (navigator.locks mocked: another tab holds 'orbit-save')
  L20:        { fam: 'skew', ahead: HOUR, reopen: 'harness', lock: true, pull: 'pull' },
  // searched for: U24's adoption paths (each with its no-save control)
  SHd:        { fam: 'adopt', mode: 'click',  held: true },   // "load the shared one" (adoptShared) pressed while a 💾 Save is writing
  SHdC:       { fam: 'adopt', mode: 'click',  held: false },
  SHdk:       { fam: 'adopt', mode: 'click',  held: true,  ahead: HOUR },   // as SHd, the shared state file stamped an hour ahead (Carol's clock fast)
  SHdkC:      { fam: 'adopt', mode: 'click',  held: false, ahead: HOUR },
  SHa:        { fam: 'adopt', mode: 'auto',   held: true },   // the shared state file arrives (sharedArrived) while a 💾 Save is writing
  SHaC:       { fam: 'adopt', mode: 'auto',   held: false },
  BT:         { fam: 'adopt', mode: 'take',   held: true },   // "open the file's version" (bootTakeFile) while a 💾 Save is writing
  BTC:        { fam: 'adopt', mode: 'take',   held: false },
  IB:         { fam: 'adopt', mode: 'import', held: true },   // ⬅ Import several boards (importBoards) while a 💾 Save is writing
  IBC:        { fam: 'adopt', mode: 'import', held: false },
}[SCN];
if (!CFG) throw new Error('unknown scenario ' + SCN);
rec.cfg = CFG;
const FAM = {
  skew: { X: 'REMOTE', Y: 'WORKING' }, pen: { X: 'BOB-2', Y: 'BRAD-1' },
  adopt: { X: { click: 'SHARED', auto: 'SHARED', take: 'F1', import: 'IMPORT' }[CFG.mode], Y: (CFG.mode === 'auto') ? 'BRAD-1' : 'BRAD-2' },
}[CFG.fam];

// ---- EXPECTED (hand-written literals, per board, by code reading of 98eed7e8 and 1375b72b; the boards differ only by U13's two guards)
// refresh: [returned, _saveBusy, screen, record dirty, _saveGen unchanged, kept slot, the folder copy was read during it,
//           folder writes other than the lock during it, U13's refusal words said]
// adopt (U24 paths): [screen, _saveBusy, _saveGen unchanged, kept slot, the path's own "loaded" words said]
// u17: the record is falsely clean once the route has settled (K1's tuple: recorded clean, screen != base copy)
// v3 (next=save):    [questions asked, screen before, head before, head after, what the status says, recorded clean after, record names the head]
// v4 (next=putback): [kept before, the put-back question's claim, screen before, head before, what put back says, kept after,
//                     screen after put back, head after the Save, what the Save says]
const both = o => ({ u13: o, pre: o });
const per = (u13, pre) => ({ u13, pre });
// the measured skew routes: U13's state on pre; refused on u13
const sk = (ret13, retPre, said13) => ({
  refresh: per([ret13, 1, 'WORKING', true, true, null, true, 0, said13], [retPre, 1, 'REMOTE', false, true, 'WORKING', true, 0, false]),
  u17: per(false, true),
  v3: per([0, 'WORKING', 'WORKING', 'WORKING', 'saved', true, true], [0, 'REMOTE', 'WORKING', 'REMOTE', 'saved', true, true]),
  v4: per([null, 'none', 'WORKING', 'WORKING', 'nothing kept', null, 'WORKING', 'WORKING', 'saved'],
          ['WORKING', 'in-folder', 'REMOTE', 'WORKING', 'put back', null, 'WORKING', 'WORKING', 'clash']) });
const pn = r => ({
  refresh: per([r, 1, 'BRAD-1', false, true, null, true, 0, false], [r === false ? true : r, 1, 'BOB-2', false, true, null, true, 0, false]),
  u17: per(false, true),
  v3: per([0, 'BRAD-1', 'BRAD-1', 'BRAD-1', 'saved', true, true], [0, 'BOB-2', 'BRAD-1', 'BOB-2', 'saved', true, true]),
  v4: per([null, 'none', 'BRAD-1', 'BRAD-1', 'nothing kept', null, 'BRAD-1', 'BRAD-1', 'saved'],
          [null, 'none', 'BOB-2', 'BRAD-1', 'nothing kept', null, 'BOB-2', 'BOB-2', 'saved']) });
const TICK = '(liveTick returns nothing)';
const V3W = [0, 'WORKING', 'WORKING', 'WORKING', 'saved', true, true];
const V4W = [null, 'none', 'WORKING', 'WORKING', 'nothing kept', null, 'WORKING', 'WORKING', 'saved'];
const EXP0 = {
  S1harness: sk(false, true, false), S1pen: sk(false, true, false), V1same: sk(false, true, false),
  S1tick: sk(TICK, TICK, false),
  S1perm: sk(true, true, true), V1sameperm: sk(true, true, true), S1open: sk(true, true, true),
  V2live: sk('(no adoption within 15 s)', 'adopted by the Live timer', false),
  W2pull: pn(false), W2tick: pn(TICK),
  Ca: { refresh: both([false, 1, 'WORKING', true, true, null, true, 0, false]), u17: both(false), v3: both(V3W), v4: both(V4W) },
  Cb: { refresh: both([false, 1, 'WORKING', true, true, null, true, 0, false]), u17: both(false), v3: both(V3W), v4: both(V4W) },
  Cc: { refresh: both([true, 0, 'REMOTE', false, true, 'WORKING', true, 0, false]), u17: both(false),
        v3: both([0, 'REMOTE', 'REMOTE', 'REMOTE', 'saved', true, true]),
        v4: both(['WORKING', 'in-folder', 'REMOTE', 'REMOTE', 'put back', null, 'WORKING', 'WORKING', 'saved']) },
  C1: { refresh: both([true, 0, 'BOB-2', false, true, null, true, 0, false]), u17: both(false),
        v3: both([0, 'BOB-2', 'BOB-2', 'BOB-2', 'pen', true, true]),
        v4: both([null, 'none', 'BOB-2', 'BOB-2', 'nothing kept', null, 'BOB-2', 'BOB-2', 'pen']) },
  C3: { refresh: both([false, 1, 'BRAD-1', false, true, null, true, 0, false]), u17: both(false),
        v3: both([0, 'BRAD-1', 'BRAD-1', 'BRAD-1', 'saved', true, true]),
        v4: both([null, 'none', 'BRAD-1', 'BRAD-1', 'nothing kept', null, 'BRAD-1', 'BRAD-1', 'saved']) },
  // U25: no save under way at the guard -> identical on both boards; the record stays consistent (not U17)
  U25ws: { refresh: both([true, 0, 'REMOTE', false, true, null, true, 2, false]), u17: both(false),
           v3: both([0, 'REMOTE', 'WORKING', 'WORKING', 'clash', true, false]),
           v4: both([null, 'none', 'REMOTE', 'WORKING', 'nothing kept', null, 'REMOTE', 'WORKING', 'clash']) },
  U25wf: { refresh: both([false, 0, 'WORKING', false, true, null, true, 2, false]), u17: both(false), v3: both(V3W), v4: both(V4W) },
  // U25mid: the save is under way at the guard -> refused on u13 (U13's late guard), adopted on pre (U13's state). The save
  // starts inside the refresh's window, so its history copy and its (held) main write fall in it: 2 writes (corrected after
  // the trial run, which counted them; the 0 first written here was the held-save routes' count, where the save starts first).
  U25mid: { refresh: per([false, 1, 'WORKING', true, true, null, true, 2, false], [true, 1, 'REMOTE', false, true, 'WORKING', true, 2, false]),
            u17: per(false, true),
            v3: per(V3W, [0, 'REMOTE', 'WORKING', 'REMOTE', 'saved', true, true]),
            v4: per(V4W, ['WORKING', 'in-folder', 'REMOTE', 'WORKING', 'put back', null, 'WORKING', 'WORKING', 'clash']) },
  // U20: the save waits for the lock, not counted -> the refresh adopts (as Cc); the save then writes what is on screen
  L20: { refresh: both([true, 0, 'REMOTE', false, true, 'WORKING', true, 0, false]), u17: both(false),
         v3: both([0, 'REMOTE', 'REMOTE', 'REMOTE', 'saved', true, true]),
         v4: both(['WORKING', 'in-folder', 'REMOTE', 'REMOTE', 'put back', null, 'WORKING', 'REMOTE', 'clash']) },
  // U24 paths: not touched by the U13 commit -> identical on both boards
  SHd:  { adopt: both(['SHARED', 1, true, 'BRAD-2', true]), u17: both(true),
          v3: both([0, 'SHARED', 'BRAD-2', 'SHARED', 'saved', true, true]),
          v4: both(['BRAD-2', 'in-file', 'SHARED', 'BRAD-2', 'put back', null, 'BRAD-2', 'BRAD-2', 'clash']) },
  SHdC: { adopt: both(['SHARED', 0, true, 'BRAD-2', true]), u17: both(false),
          v3: both([0, 'SHARED', 'BRAD-1', 'SHARED', 'saved', true, true]),
          v4: both(['BRAD-2', 'in-place', 'SHARED', 'BRAD-1', 'put back', 'SHARED', 'BRAD-2', 'BRAD-2', 'saved']) },
  SHdk: { adopt: both(['SHARED', 1, true, 'BRAD-2', true]), u17: both(true),
          v3: both([0, 'SHARED', 'BRAD-2', 'SHARED', 'saved', true, true]),
          v4: both(['BRAD-2', 'in-file', 'SHARED', 'BRAD-2', 'put back', null, 'BRAD-2', 'BRAD-2', 'clash']) },
  SHdkC: { adopt: both(['SHARED', 0, true, 'BRAD-2', true]), u17: both(false),
          v3: both([0, 'SHARED', 'BRAD-1', 'SHARED', 'saved', true, true]),
          v4: both(['BRAD-2', 'in-place', 'SHARED', 'BRAD-1', 'put back', 'SHARED', 'BRAD-2', 'BRAD-2', 'saved']) },
  SHa:  { adopt: both(['SHARED', 1, true, null, true]), u17: both(true),
          v3: both([0, 'SHARED', 'BRAD-1', 'SHARED', 'saved', true, true]),
          v4: both([null, 'none', 'SHARED', 'BRAD-1', 'nothing kept', null, 'SHARED', 'SHARED', 'saved']) },
  SHaC: { adopt: both(['SHARED', 0, true, null, true]), u17: both(true),
          v3: both([0, 'SHARED', 'BRAD-1', 'SHARED', 'saved', true, true]),
          v4: both([null, 'none', 'SHARED', 'BRAD-1', 'nothing kept', null, 'SHARED', 'SHARED', 'saved']) },
  BT:   { adopt: both(['F1', 1, true, null, true]), u17: both(true),
          v3: both([0, 'F1', 'BRAD-2', 'F1', 'saved', true, true]),
          v4: both([null, 'none', 'F1', 'BRAD-2', 'nothing kept', null, 'F1', 'F1', 'saved']) },
  BTC:  { adopt: both(['F1', 0, true, null, true]), u17: both(true),
          v3: both([0, 'F1', 'BRAD-1', 'F1', 'saved', true, true]),
          v4: both([null, 'none', 'F1', 'BRAD-1', 'nothing kept', null, 'F1', 'F1', 'saved']) },
  IB:   { adopt: both(['IMPORT', 1, false, null, true]), u17: both(false),
          v3: both([0, 'IMPORT', 'BRAD-2', 'IMPORT', 'saved', true, true]),
          v4: both([null, 'none', 'IMPORT', 'BRAD-2', 'nothing kept', null, 'IMPORT', 'IMPORT', 'saved']) },
  IBC:  { adopt: both(['IMPORT', 0, false, null, true]), u17: both(false),
          v3: both([0, 'IMPORT', 'BRAD-1', 'IMPORT', 'saved', true, true]),
          v4: both([null, 'none', 'IMPORT', 'BRAD-1', 'nothing kept', null, 'IMPORT', 'IMPORT', 'saved']) },
}[SCN];
const EXP = Object.fromEntries(Object.entries(EXP0).map(([k, v]) => [k, v[BK]]));
rec.expected = EXP;

// ---- the folder, instrumented (observation only): reads of the copy itself are counted, and one read can be held once,
// either before its bytes are taken ('before') or after ('after': the bytes it returns were read before the hold).
const instrument = fold => {
  fold.reads = 0; fold.readLog = []; fold.readHold = null;
  const orig = fold.dir.getFileHandle;
  fold.dir.getFileHandle = async (n, o) => {
    const h = await orig(n, o);
    if (n !== MAIN) return h;
    const g0 = h.getFile;
    return Object.assign({}, h, { getFile: async () => {
      const rh = fold.readHold;
      if (rh && rh.when === 'before') { fold.readHold = null; rh.reached = true; await rh.g.p; }
      const f = await g0(); const t = await f.text();
      fold.reads++; fold.readLog.push((rawContent(t).note || '?') + ' @ ' + et(Date.now()));
      if (rh && rh.when === 'after') { fold.readHold = null; rh.got = rawContent(t); rh.reached = true; await rh.g.p; }
      return { text: async () => t };
    } });
  };
  return fold;
};
// REMOTE (skew): written through the product by a board whose Date.now() runs `ahead` ms fast, then disconnected for good.
let R0keep = null;
const writeRemote = async (F1, fold, ahead, by) => {
  const R0 = boot({ html: F1 }); await pause(80); R0keep = R0;
  wire(R0.ev, by, by === 'Bob' ? KEY.bob : KEY.brad); connect(R0.ev, R0.w, fold);
  if (ahead) R0.ev(`(function(){ var real=Date.now; Date.now=function(){ return real.call(Date)+${ahead}; }; return 'ok'; })()`);
  R0.ev(`setNote('A', 'REMOTE'); setAlloc('A', '650'); 'ok'`);
  await R0.ev('saveInPlace()');
  const realAfter = Date.now();
  const h = headOf(fold);
  R0.ev(`_driveDir=null; _liveCfg.store=false; 'ok'`);
  return { head: h, realAfter, realAfterET: et(realAfter), tsMinusRealAfter: h ? h.ts - realAfter : null,
    payloadTsMinusRealAfter: h ? h.payloadTs - realAfter : null, history: histOf(fold).map(x => x.name) };
};
const permMock = fold => {
  fold.perm = { state: 'prompt', queries: 0, requests: 0 };
  fold.dir.queryPermission = async () => { fold.perm.queries++; return fold.perm.state; };
  fold.dir.requestPermission = async () => { fold.perm.requests++; fold.perm.state = 'granted'; return 'granted'; };
};
const heldSave = async (B, fold, via) => {
  const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
  B.ev(`globalThis.__q=[]; 'ok'`);
  const p = B.ev(via === 'pen' ? 'takePen()' : 'saveInPlace()');
  const reached = await until(() => (fold.hits.main || 0) > n0);
  const mid = view(B.ev, 'brad, save held at the close of its write');
  return { g, p, reached, mid };
};
const settle = async B => { await B.ev('_saveChain'); for (let i = 0; i < 5; i++) await pause(20); };
const pullNow = async (ev, how) => how === 'timer' ? await (async () => { const t0 = Date.now(); for (let i = 0; i < 300; i++) { if (ev(`String(S.notes.A||'')`) === 'REMOTE') return 'adopted by the Live timer after ' + Math.round((Date.now() - t0) / 1000) + ' s'; await pause(50); } return '(no adoption within 15 s)'; })()
  : how === 'tick' ? await ev('liveTick()') : how === 'connect' ? await ev('driveConnectNow()') : how === 'auto' ? await ev('driveAutoConnect()') : await ev('driveStorePull(true)');
const retOf = (how, r) => how === 'tick' ? (r === undefined ? TICK : r) : (how === 'timer' && /^adopted by the Live timer/.test(String(r))) ? 'adopted by the Live timer' : r;
const contentOfTs = (fold, ts, extra) => { const all = [headOf(fold), ...histOf(fold), ...(extra || [])].filter(Boolean); const c = all.find(x => x.ts === ts);
  return c ? whose(c) : '(no copy with that ts)'; };
// THE CONTRACT TUPLE: [screen, recorded clean, the copy the record names as base] (contents by name: literal note/$ pairs above)
const Kt = (v, fold, extra) => [v.screen.whose, cleanOf(v), contentOfTs(fold, v.baseFolder, extra)];
const falselyCleanOf = t => t[1] === true && t[0] !== t[2];
// the contract, literal alternatives: recorded clean only against a base copy holding what is on screen; unclean is allowed.
const K = (id, what, v, fold, extra) => {
  const t = Kt(v, fold, extra);
  return ckAny(id, what + ' [screen, recorded clean, base copy]', t,
    [[FAM.X, true, FAM.X], [FAM.Y, true, FAM.Y], [t[0], false, t[2]]], 'contract');
};
const U17state = (v, fold, extra) => {   // the prediction, literal per board: is the settled record falsely clean?
  const t = Kt(v, fold, extra);
  rec.u17state = { tuple: t, falselyClean: falselyCleanOf(t) };
  ck(SCN + '.U17state', 'U17 STATE once the route has settled: recorded clean while the screen differs from the copy the record names as base ' + J(t),
    falselyCleanOf(t), EXP.u17, 'predict');
};
const said = s => /after the copy you are working from|does not have their changes/.test(s);
const sayKind = s => /^✅ Saved/.test(s) ? 'saved' : (/after the copy you are working from/.test(s) && /Nothing was written/.test(s)) ? 'clash'
  : /holds the pen/.test(s) ? 'pen' : 'other: ' + s.slice(0, 80);
const qKind = q => !q ? 'none' : /kept aside in its place/.test(q) ? 'in-place' : /still in the shared folder it came from/.test(q) ? 'in-folder'
  : /still in the saved file it came from/.test(q) ? 'in-file' : 'other: ' + q.slice(0, 80);
const pbKind = s => /Nothing is kept aside in this browser/.test(s) ? 'nothing kept' : /^↶ Put back the work kept aside/.test(s) ? 'put back'
  : /Not put back/.test(s) ? 'refused' : 'other: ' + s.slice(0, 80);
const whereIs = (c, fold, v) => { const h = headOf(fold);
  return { folderHead: !!(h && h.whose === c), folderHistory: histOf(fold).filter(x => x.whose === c).map(x => x.name), screen: v.screen.whose === c,
    storage: v.stored.whose === c, keptSlot: !!(v.kept && v.kept.whose === c) }; };
const anyWhere = w => w.folderHead || w.folderHistory.length > 0 || w.screen || w.storage || w.keptSlot;

// ---- V3next / V4putback from wherever the route ended (board E)
const doNext = async (E, fold, extra) => {
  const before = view(E.ev, 'the end of the route, before ' + NEXT);
  const hb = headOf(fold);
  const kt = Kt(before, fold, extra);
  const falselyClean = falselyCleanOf(kt);
  rec.nextFrom = { K: kt, falselyClean, head: hb && hb.whose, history: histOf(fold).map(h => h.name + ' ' + h.whose) };
  if (NEXT === 'save') {
    E.ev(`globalThis.__q=[]; 'ok'`);
    await E.ev('saveInPlace()'); await settle(E);
    const asked = qs(E.ev); const af = view(E.ev, "after Brad's next 💾 Save"); const ha = headOf(fold);
    const t = [asked.length, before.screen.whose, hb && hb.whose, ha && ha.whose, sayKind(af.status), cleanOf(af), !!ha && af.baseFolder === ha.ts];
    step('V3next', { asked: asked.map(q => q.slice(0, 300)), before, after: af, folder: fview(fold, 'after the next save'),
      where: { X: whereIs(FAM.X, fold, af), Y: whereIs(FAM.Y, fold, af) } });
    ck(SCN + '.V3next', "Brad's next 💾 Save from where the route ended " + J(['questions asked', 'screen before', 'head before', 'head after', 'status says', 'recorded clean after', 'record names the head']), t, EXP.v3, 'predict');
    const wroteOver = before.screen.whose !== (hb && hb.whose) && asked.length === 0 && sayKind(af.status) === 'saved' && !!ha && ha.whose === before.screen.whose;
    rec.v3parts = { falselyClean, wroteOver, overwritten: hb && hb.whose, overwrittenNowIn: hb ? whereIs(hb.whose, fold, af) : null };
    ckNot(SCN + '.U17.V3', 'U17 (V3next): from a record that says saved while the screen differs from the copy it names, 💾 Save writes the screen copy over a folder head holding different content and asks nothing ([record falsely clean before, wrote over a different head without asking])',
      [falselyClean, wroteOver], [true, true], 'contract');
  }
  if (NEXT === 'putback') {
    E.ev(`globalThis.__q=[]; keptPutBack(); 'ok'`);
    const q1 = qs(E.ev).find(q => /Put back the work this browser kept aside/.test(q)) || null;
    const pv = view(E.ev, 'after ↶ put it back');
    E.ev(`globalThis.__q=[]; 'ok'`);
    await E.ev('saveInPlace()'); await settle(E);
    const asked2 = qs(E.ev); const af = view(E.ev, 'after put back, then 💾 Save'); const ha = headOf(fold);
    const t = [before.kept ? before.kept.whose : null, qKind(q1), before.screen.whose, hb && hb.whose, pbKind(pv.status), pv.kept ? pv.kept.whose : null,
      pv.screen.whose, ha && ha.whose, sayKind(af.status)];
    step('V4putback', { question: q1, afterPutBack: pv, saveAsked: asked2.map(q => q.slice(0, 300)), afterSave: af, folder: fview(fold, 'after put back + save'),
      where: { X: whereIs(FAM.X, fold, af), Y: whereIs(FAM.Y, fold, af) } });
    ck(SCN + '.V4putback', '↶ put it back, then 💾 Save ' + J(['kept before', "the question's claim", 'screen before', 'head before', 'put back says', 'kept after', 'screen after put back', 'head after Save', 'Save says']), t, EXP.v4, 'predict');
    // the claim "What is on screen now is still in the shared folder it came from": false when the folder head holds other content
    const falseClaim = qKind(q1) === 'in-folder' && before.screen.whose !== (hb && hb.whose);
    const sc = before.screen.whose;
    const notKept = !(pv.kept && pv.kept.whose === sc) && pv.stored.whose !== sc && pv.screen.whose !== sc && !(ha && ha.whose === sc);
    rec.v4parts = { falselyClean, claim: qKind(q1), falseClaim, notKept, screenCopyIn: whereIs(sc, fold, af), saveAfterPutBackAsked: asked2.length, saveAfterPutBackSays: sayKind(af.status) };
    ckNot(SCN + '.U17.V4', "U17 (V4putback): from a record that says saved while the screen differs from the copy it names, ↶ Put back's question says the screen copy is still in the shared folder (the folder head holds other content) and the screen copy is then kept nowhere but history ([record falsely clean before, the claim false, the screen copy kept nowhere but history])",
      [falselyClean, falseClaim, notKept], [true, true, true], 'contract');
  }
};

// =============================================================================================== the skew routes (u13codex)
const runSkew = async () => {
  const F1 = baseFile('Brad', KEY.brad);
  const fold = instrument(folder());
  const RBY = CFG.remoteBy || 'Brad';
  const RM = await writeRemote(F1, fold, CFG.ahead, RBY);
  step('remote', RM);
  ck('fixture.remote', "the folder's pre-existing copy is REMOTE/$650, by " + RBY + ', writer ' + RBY + ', no history',
    [RM.head && RM.head.whose, RM.head && RM.head.by, RM.head && RM.head.writer, RM.history.length], ['REMOTE', RBY, RBY, 0], 'fixture');
  ck('fixture.remoteClock', CFG.ahead ? 'PREREQUISITE: REMOTE store.ts and payload ts are ONE HOUR AHEAD of real time (each minus real time after its write, within 59:55 to 60:00 min)'
                                      : 'REMOTE store.ts is NOT ahead: at or before real time after its write',
    CFG.ahead ? [RM.tsMinusRealAfter > HOUR - 5000 && RM.tsMinusRealAfter <= HOUR, RM.payloadTsMinusRealAfter > HOUR - 5000 && RM.payloadTsMinusRealAfter <= HOUR]
              : [RM.tsMinusRealAfter <= 0, RM.payloadTsMinusRealAfter <= 0], [true, true], 'fixture');
  const REM = RM.head;
  const A = CFG.same ? boot({ html: F1, ls: lsOf(R0keep.ev) }) : boot({ html: F1 }); await pause(80);
  wire(A.ev, 'Brad', KEY.brad); connect(A.ev, A.w, fold);
  const ac = await A.ev('driveAutoConnect()');
  const a0 = view(A.ev, "brad after the opening's connect adopted REMOTE");
  step('adopt', { connect: ac, brad: a0, folder: fview(fold, 'after adopt') });
  ck('fixture.adopt', "Brad's board adopted REMOTE: [connect returned, screen, DIRTY, _baseDirty, record dirty, record base = REMOTE ts, driveBaseOf = REMOTE ts, MS.ts = REMOTE ts, kept slot]",
    [ac, a0.screen.whose, a0.DIRTY, a0._baseDirty, !!a0.baseGet.dirty, a0.baseFolder === REM.ts, a0.driveBaseOf === REM.ts, a0.screen.ts === REM.ts, a0.kept],
    [true, 'REMOTE', false, false, false, true, true, true, null], 'fixture');
  A.ev(`setNote('A', 'WORKING'); setAlloc('A', '700'); 'ok'`);
  const a1 = view(A.ev, 'brad after editing WORKING');
  step('edit', { brad: a1 });
  ck('fixture.edit', "WORKING on screen and unsaved: [screen, DIRTY, record dirty, base still REMOTE ts, the edit's MS.ts is earlier than REMOTE ts]",
    [a1.screen.whose, a1.DIRTY, !!a1.baseGet.dirty, a1.baseFolder === REM.ts, a1.screen.ts < REM.ts], ['WORKING', true, true, true, !!CFG.ahead], 'fixture');
  let B = A;
  if (CFG.reopen !== 'none') {
    const R = boot({ html: F1, ls: lsOf(A.ev) }); await pause(80);
    wire(R.ev, 'Brad', KEY.brad);
    if (CFG.reopen === 'perm') permMock(fold);
    connect(R.ev, R.w, fold);
    if (CFG.reopen === 'perm') R.ev(`_liveCfg.folder='shared'; 'ok'`);
    let rc = '(not run: the harness connect only -- no opening pull)', R0v;
    if (CFG.reopen === 'livefail') {
      R.ev(`_liveCfg.on=true; _liveCfg.every=10; 'ok'`);
      let left = 2; const err = new Error('the file is being synced'); fold.failReads = [];
      fold.failRead = new Proxy({}, { get: (t, k) => (k === MAIN && left > 0) ? err : undefined,
        deleteProperty: (t, k) => { if (k === MAIN && left > 0) { left--; fold.failReads.push(et(Date.now())); } return true; } });
      rc = await R.ev('driveAutoConnect()');
      for (let i = 0; i < 40 && left > 0; i++) await pause(50);
      await pause(300);
      R0v = view(R.ev, 'reopened: livefail');
      ck('V2live.reopened', "the opening's own connect ran with Live on, both its read and Live's immediate tick failed; WORKING still unsaved ([connect returned, _driveLive, failed reads, screen, DIRTY, record dirty, base = REMOTE ts, kept slot])",
        [rc, R0v._driveLive, fold.failReads.length, R0v.screen.whose, R0v.DIRTY, !!R0v.baseGet.dirty, R0v.baseFolder === REM.ts, R0v.kept], [true, true, 2, 'WORKING', false, true, true, null], 'fixture');
    }
    if (CFG.reopen === 'perm') rc = await R.ev('driveAutoConnect()');
    R0v = view(R.ev, 'reopened: ' + CFG.reopen);
    step('reopen', { how: CFG.reopen, connect: rc, perm: fold.perm ? { ...fold.perm } : null, brad: R0v, folder: fview(fold, 'after reopen') });
    if (CFG.reopen !== 'livefail')
      ck(SCN + '.reopened', 'reopened with WORKING unsaved in browser storage: [screen, DIRTY (session), record dirty, base = REMOTE ts, kept slot' + (CFG.reopen === 'perm' ? ', connect returned, _driveNeed, permission state' : '') + ']',
        CFG.reopen === 'perm' ? [R0v.screen.whose, R0v.DIRTY, !!R0v.baseGet.dirty, R0v.baseFolder === REM.ts, R0v.kept, rc, R0v._driveNeed, fold.perm.state]
                              : [R0v.screen.whose, R0v.DIRTY, !!R0v.baseGet.dirty, R0v.baseFolder === REM.ts, R0v.kept],
        CFG.reopen === 'perm' ? ['WORKING', false, true, true, null, false, 'click', 'prompt'] : ['WORKING', false, true, true, null], 'fixture');
    B = R;
  }
  const gen0 = B.ev('_saveGen');
  let H = null, r1, logBefore, readsBefore, lockG = null, lockP = null;
  if (CFG.u25) {
    // the refresh is held at its read; 'after'/'before': a WHOLE save runs meanwhile; 'mid': a save starts and is held at its write
    const rh = { when: CFG.u25 === 'before' ? 'before' : 'after', g: gate(), reached: false, got: null };
    fold.readHold = rh;
    logBefore = fold.log.length; readsBefore = fold.reads;
    const rp = B.ev('driveStorePull(true)');
    const ok = await until(() => rh.reached);
    const vHold = view(B.ev, 'the refresh held at its read');
    B.ev(`globalThis.__q=[]; 'ok'`);
    if (CFG.u25 === 'mid') {
      H = await heldSave(B, fold);
      const fH = fview(fold, 'refresh held at its read; save held at its write');
      step('u25', { reached: ok, bytesTaken: rh.got, atHold: vHold, saveHeld: H.mid, folder: fH });
      ck(SCN + '.boundary', 'BOUNDARY: the refresh is held at its read, its bytes (REMOTE) already taken; a 💾 Save then starts and is held at the close of its write ([refresh held, bytes taken, save reached its write, _saveBusy, head still REMOTE])',
        [ok, rh.got ? whose(rh.got) : null, H.reached, H.mid._saveBusy, fH.head.whose], [true, 'REMOTE', true, 1, 'REMOTE'], 'fixture');
    } else {
      await B.ev('saveInPlace()'); await settle(B);
      const vSaved = view(B.ev, 'a whole 💾 Save has landed; the refresh is still held'); const fS = fview(fold, 'save landed, refresh held');
      step('u25', { reached: ok, bytesTaken: rh.got, atHold: vHold, saved: vSaved, asked: qs(B.ev), folder: fS });
      ck(SCN + '.boundary', 'BOUNDARY: the refresh is held at its read (' + (CFG.u25 === 'after' ? 'its bytes, REMOTE, already taken' : 'before its bytes are taken')
        + '); a whole 💾 Save starts and lands meanwhile ([held, bytes taken, head after the save, recorded clean against the head, _saveBusy])',
        [ok, rh.got ? whose(rh.got) : null, fS.head.whose, cleanOf(vSaved) && vSaved.baseFolder === fS.head.ts, vSaved._saveBusy],
        [true, CFG.u25 === 'after' ? 'REMOTE' : null, 'WORKING', true, 0], 'fixture');
    }
    rh.g.open(); r1 = await rp;
  } else {
    if (CFG.held) {
      H = await heldSave(B, fold, CFG.via);
      const fH = fview(fold, 'save held');
      step('held', { reached: H.reached, via: CFG.via || 'saveInPlace', asked: qs(B.ev).map(q => q.slice(0, 200)), brad: H.mid, folder: fH, perm: fold.perm ? { ...fold.perm } : null });
      ck(SCN + '.held', "the save reached the close of its write and is held; the folder head is still the pre-existing REMOTE; [reached, DIRTY, record dirty, _saveBusy, head ts = REMOTE ts, head, the save's built MS.ts earlier than REMOTE ts]",
        [H.reached, H.mid.DIRTY, !!H.mid.baseGet.dirty, H.mid._saveBusy, fH.head.ts === REM.ts, fH.head.whose, H.mid.screen.ts < REM.ts],
        [true, CFG.reopen === 'none', true, 1, true, 'REMOTE', !!CFG.ahead], 'fixture');
    }
    if (CFG.lock) {
      // ANOTHER TAB HOLDS THE SAVE LOCK: navigator.locks is mocked in this board's window (jsdom has none); 'orbit-save' is
      // granted only when the gate opens. The save asked for here waits, uncounted (_saveBusy is raised only once granted).
      lockG = gate(); B.w.__lockP = lockG.p; B.w.__lockAsked = 0;
      B.ev(`Object.defineProperty(navigator, 'locks', { configurable:true, value:{ request:function(n, o, cb){ globalThis.__lockAsked++; return globalThis.__lockP.then(function(){ return cb(); }); } } }); 'ok'`);
      B.ev(`globalThis.__q=[]; 'ok'`);
      const logAtAsk = fold.log.length;
      lockP = B.ev('saveInPlace()');
      const asked = await until(() => B.ev('globalThis.__lockAsked') > 0);
      const vW = view(B.ev, 'the save is waiting for the lock another tab holds');
      step('lockWait', { asked, brad: vW, folder: fview(fold, 'save waiting for the lock') });
      ck(SCN + '.lockWait', "the save waits for another tab's lock: [asked for the lock, _saveBusy, folder writes since Save was pressed, head still REMOTE, screen]",
        [asked, vW._saveBusy, fold.log.slice(logAtAsk).length, headOf(fold).whose, vW.screen.whose], [true, 0, 0, 'REMOTE', 'WORKING'], 'fixture');
    }
    logBefore = fold.log.length; readsBefore = fold.reads;
    r1 = await pullNow(B.ev, CFG.pull);
  }
  const m1 = view(B.ev, 'brad after the refresh' + (H ? ', save still held' : ''));
  const fP = fview(fold, 'after the refresh');
  const writesDuring = fold.log.slice(logBefore).filter(x => !/^lock:/.test(x));
  step('refresh', { how: CFG.pull, returned: r1 === undefined ? '(undefined)' : r1, saveGenBefore: gen0, brad: m1, folder: fP, readsDuring: fold.reads - readsBefore, readLog: fold.readLog.slice(), writesDuring, lockWritesDuring: fold.log.slice(logBefore).filter(x => /^lock:/.test(x)) });
  ck(SCN + '.refresh', 'the refresh ' + (H ? 'during the held save' : CFG.u25 ? 'held at its read while a whole save ran' : CFG.lock ? 'while a save waits for the lock' : 'with no save under way')
    + ' ([returned, _saveBusy, screen, record dirty, _saveGen unchanged, kept slot, the folder copy was read, folder writes other than the lock, U13 refusal words said])',
    [retOf(CFG.pull, r1), m1._saveBusy, m1.screen.whose, !!m1.baseGet.dirty, m1._saveGen === gen0, m1.kept ? m1.kept.whose : null, fold.reads > readsBefore, writesDuring.length, m1.status.includes(U13_WORDS)],
    EXP.refresh, 'predict');
  if (SCN === 'Cb') ck('Cb.said', "no reopen (DIRTY true): the refresh refuses with the unsaved-changes words ([says 'Nothing was replaced'])", [/Nothing was replaced/.test(m1.status)], [true], 'predict');
  if (H) { H.g.open(); await H.p; await settle(B); }
  if (lockG) { lockG.open(); await lockP; await settle(B); }
  const aft = view(B.ev, H || lockG ? 'brad after the save landed' : 'brad after the refresh');
  const fAft = fview(fold, H || lockG ? 'after the save landed' : 'after the refresh');
  step('landed', { brad: aft, folder: fAft, folderWritesSinceRefresh: fold.log.slice(logBefore) });
  if (H || CFG.u25) ck(SCN + '.head', "the folder head after the save landed: the bytes the save built ([content, by, writer, head ts != REMOTE ts])",
    [fAft.head.whose, fAft.head.by, fAft.head.writer, fAft.head.ts !== REM.ts], ['WORKING', 'Brad', 'Brad', true], 'fixture');
  if (lockG) ck(SCN + '.head', "the folder head after the waiting save ran: what was on screen when it started (REMOTE, adopted while it waited) ([content, by, writer, head ts != REMOTE ts, status])",
    [fAft.head.whose, fAft.head.by, fAft.head.writer, fAft.head.ts !== REM.ts, sayKind(aft.status)], ['REMOTE', 'Brad', 'Brad', true, 'saved'], 'predict');
  K(SCN + '.K1', 'CONTRACT once settled', aft, fold, [REM]);
  U17state(aft, fold, [REM]);
  if (CFG.pull === 'timer') B.ev(`liveStop(); 'ok'`);
  const r2 = await pullNow(B.ev, CFG.pull === 'tick' ? 'tick' : 'pull');
  const lat = view(B.ev, 'brad after a later refresh');
  step('laterRefresh', { returned: r2 === undefined ? '(undefined)' : r2, brad: lat, folder: fview(fold, 'later refresh') });
  if (!said(lat.status)) K(SCN + '.K2', 'CONTRACT after a later refresh (or the board says the copies differ)', lat, fold, [REM]);
  else ck(SCN + '.K2', 'CONTRACT after a later refresh: the board says the copies differ', 'said', 'said', 'contract');
  const Z = boot({ html: F1, ls: lsOf(B.ev) }); await pause(80);
  wire(Z.ev, 'Brad', KEY.brad); if (fold.perm) fold.perm.state = 'granted'; connect(Z.ev, Z.w, fold);
  const zc = await Z.ev('driveAutoConnect()');
  const z0 = view(Z.ev, "reopened again, after the opening's connect");
  const zr = await Z.ev('driveStorePull(true)');
  const z1 = view(Z.ev, 'reopened again, after a refresh');
  const FF = fview(fold, 'final (before next)');
  step('reopenAgain', { connect: zc, afterConnect: z0, refresh: zr, afterRefresh: z1, folder: FF });
  if (!said(z0.status + ' ' + z1.status)) K(SCN + '.K3', 'CONTRACT after a reopen (opening connect + refresh) (or it says the copies differ)', z1, fold, [REM]);
  else ck(SCN + '.K3', 'CONTRACT after a reopen: the board says the copies differ', 'said', 'said', 'contract');
  rec.whereNow = { REMOTE: whereIs('REMOTE', fold, z1), WORKING: whereIs('WORKING', fold, z1) };
  ck(SCN + '.reach', 'CONTRACT: REMOTE/$650 and WORKING/$700 each remain in some reachable copy ([REMOTE reachable, WORKING reachable])',
    [anyWhere(rec.whereNow.REMOTE), anyWhere(rec.whereNow.WORKING)], [true, true], 'contract');
  if (NEXT !== 'none') await doNext(Z, fold, [REM]);
};

// =============================================================================================== the second-writer route (u13probe)
const runPen = async () => {
  const F1 = baseFile('Brad', KEY.brad);
  const fold = instrument(folder());
  const A = boot({ html: F1 }); await pause(80);
  wire(A.ev, 'Brad', KEY.brad); connect(A.ev, A.w, fold);
  A.ev(`setNote('A', 'BRAD-1'); setAlloc('A', '700'); 'ok'`);
  await A.ev('saveInPlace()');
  const v1 = headOf(fold);
  const a0 = view(A.ev, 'brad after his first 💾 Save');
  const Bb = boot({ html: F1 }); await pause(80);
  wire(Bb.ev, 'Bob', KEY.bob); connect(Bb.ev, Bb.w, fold);
  const bobLoad = await Bb.ev('driveStorePull(false)');
  const b0 = view(Bb.ev, 'bob after loading the folder copy');
  step('start', { v1, brad: a0, bobLoad, bob: b0, folder: fview(fold, 'after the first save') });
  ck('fixture.v1', "the folder's first copy is BRAD-1/$700, written by Brad (writer Brad)", [v1 && v1.whose, v1 && v1.by, v1 && v1.writer], ['BRAD-1', 'Brad', 'Brad'], 'fixture');
  ck('fixture.bradClean', 'brad is clean and recorded against that copy: [screen, DIRTY, _baseDirty, record dirty, base = v1 ts]',
    [a0.screen.whose, a0.DIRTY, a0._baseDirty, !!a0.baseGet.dirty, a0.baseFolder === v1.ts], ['BRAD-1', false, false, false, true], 'fixture');
  ck('fixture.bobBase', "bob loaded brad's copy: [returned, screen, his base = v1 ts]", [bobLoad, b0.screen.whose, b0.baseFolder === v1.ts], [true, 'BRAD-1', true], 'fixture');
  let H = null;
  if (CFG.held) {
    H = await heldSave(A, fold);
    const fH = fview(fold, 'brad save held');
    step('held', { reached: H.reached, brad: H.mid, folder: fH });
    ck(SCN + '.held', "brad's 💾 Save with nothing unsaved reached its write and is held: [reached, DIRTY, record dirty, _saveBusy, head ts = v1 ts]",
      [H.reached, H.mid.DIRTY, !!H.mid.baseGet.dirty, H.mid._saveBusy, fH.head.ts === v1.ts], [true, false, false, 1, true], 'fixture');
  }
  let bobHead = null;
  if (CFG.bob) {
    await pause(5);
    Bb.ev(`setNote('A', 'BOB-2'); setAlloc('A', '650'); globalThis.__q=[]; 'ok'`);
    await Bb.ev('takePen()');
    bobHead = headOf(fold);
    const bv = view(Bb.ev, 'bob after taking the pen and saving');
    step('bob', { bobHead, bobAsked: qs(Bb.ev).map(q => q.slice(0, 160)), bob: bv, folder: fview(fold, 'bob saved') });
    ck(SCN + '.bobCopy', "bob's copy is the folder's current copy: [content, by, writer, bob DIRTY, bob record dirty]",
      [bobHead && bobHead.whose, bobHead && bobHead.by, bobHead && bobHead.writer, bv.DIRTY, !!bv.baseGet.dirty], ['BOB-2', 'Bob', 'Bob', false, false], 'fixture');
    if (H) ck(SCN + '.bobNewer', "bob's copy is newer than the MS.ts brad's held save built", [bobHead.ts > H.mid.screen.ts], [true], 'fixture');
  }
  const gen0 = A.ev('_saveGen');
  const logBefore = fold.log.length, readsBefore = fold.reads;
  const r1 = await pullNow(A.ev, CFG.pull);
  const m1 = view(A.ev, 'brad after the refresh' + (H ? ', save still held' : ''));
  const writesDuring = fold.log.slice(logBefore).filter(x => !/^lock:/.test(x));
  step('refresh', { how: CFG.pull, returned: r1 === undefined ? '(undefined)' : r1, brad: m1, folder: fview(fold, 'after the refresh'), readsDuring: fold.reads - readsBefore, writesDuring });
  ck(SCN + '.refresh', 'the refresh ' + (H ? 'during the held save' : 'with no save under way')
    + ' ([returned, _saveBusy, screen, record dirty, _saveGen unchanged, kept slot, the folder copy was read, folder writes other than the lock, U13 refusal words said])',
    [retOf(CFG.pull, r1), m1._saveBusy, m1.screen.whose, !!m1.baseGet.dirty, m1._saveGen === gen0, m1.kept ? m1.kept.whose : null, fold.reads > readsBefore, writesDuring.length, m1.status.includes(U13_WORDS)],
    EXP.refresh, 'predict');
  if (H) { H.g.open(); await H.p; await settle(A); }
  const aft = view(A.ev, H ? 'brad after the save landed' : 'brad after the refresh');
  const fAft = fview(fold, 'landed');
  step('landed', { brad: aft, folder: fAft });
  if (H) ck(SCN + '.head', "the folder head after brad's save lands: the bytes it built ([content, by, writer])",
    [fAft.head.whose, fAft.head.by, fAft.head.writer], ['BRAD-1', 'Brad', 'Brad'], 'fixture');
  const extra = [v1, bobHead].filter(Boolean);
  K(SCN + '.K1', 'CONTRACT once settled', aft, fold, extra);
  U17state(aft, fold, extra);
  const r2 = await pullNow(A.ev, CFG.pull === 'tick' ? 'tick' : 'pull');
  const lat = view(A.ev, 'brad after a later refresh');
  step('laterRefresh', { returned: r2 === undefined ? '(undefined)' : r2, brad: lat });
  if (!said(lat.status)) K(SCN + '.K2', 'CONTRACT after a later refresh (or the board says the copies differ)', lat, fold, extra);
  else ck(SCN + '.K2', 'CONTRACT after a later refresh: the board says the copies differ', 'said', 'said', 'contract');
  const Z = boot({ html: F1, ls: lsOf(A.ev) }); await pause(80);
  wire(Z.ev, 'Brad', KEY.brad); connect(Z.ev, Z.w, fold);
  const zc = await Z.ev('driveAutoConnect()');
  const z0 = view(Z.ev, "reopened, after the opening's connect");
  const zr = await Z.ev('driveStorePull(true)');
  const z1 = view(Z.ev, 'reopened, after a refresh');
  step('reopen', { connect: zc, afterConnect: z0, refresh: zr, afterRefresh: z1, folder: fview(fold, 'reopen') });
  if (!said(z0.status + ' ' + z1.status)) K(SCN + '.K3', 'CONTRACT after a reopen (opening connect + refresh) (or it says the copies differ)', z1, fold, extra);
  else ck(SCN + '.K3', 'CONTRACT after a reopen: the board says the copies differ', 'said', 'said', 'contract');
  const bv2 = view(Bb.ev, "bob's board, untouched since his save");
  const w = c => ({ ...whereIs(c, fold, z1), bobScreen: bv2.screen.whose === c, bobStorage: bv2.stored.whose === c });
  rec.whereNow = { 'BOB-2': w('BOB-2'), 'BRAD-1': w('BRAD-1') };
  if (CFG.bob) {
    const wb = rec.whereNow['BOB-2'];
    ck(SCN + '.reach', "CONTRACT: BOB-2/$650 and BRAD-1/$700 each remain in some reachable copy (BOB-2 counting bob's own board) ([BOB-2 reachable, BRAD-1 reachable])",
      [anyWhere(wb) || wb.bobScreen || wb.bobStorage, anyWhere(rec.whereNow['BRAD-1'])], [true, true], 'contract');
    checks.push({ id: SCN + '.U18', kind: 'related (U18, not U17)', what: "bob's copy BOB-2/$650 is in the shared folder (head or history)", expected: '(observed only)',
      observed: wb.folderHead || wb.folderHistory.length > 0, pass: true });
  }
  if (NEXT !== 'none') await doNext(Z, fold, extra);
};

// =============================================================================================== U24 search: the other adoption paths
const runAdopt = async () => {
  const F1 = baseFile('Brad', KEY.brad);
  const fold = instrument(folder());
  const A = boot({ html: F1 }); await pause(80);
  wire(A.ev, 'Brad', KEY.brad); connect(A.ev, A.w, fold);
  A.ev(`setNote('A', 'BRAD-1'); setAlloc('A', '700'); 'ok'`);
  await A.ev('saveInPlace()');
  const v1 = headOf(fold);
  const a0 = view(A.ev, 'brad after his first 💾 Save');
  ck('fixture.v1', "the folder's first copy is BRAD-1/$700, written by Brad (writer Brad)", [v1 && v1.whose, v1 && v1.by, v1 && v1.writer], ['BRAD-1', 'Brad', 'Brad'], 'fixture');
  ck('fixture.bradClean', 'brad is clean and recorded against that copy: [screen, DIRTY, _baseDirty, record dirty, base = v1 ts]',
    [a0.screen.whose, a0.DIRTY, a0._baseDirty, !!a0.baseGet.dirty, a0.baseFolder === v1.ts], ['BRAD-1', false, false, false, true], 'fixture');
  // the shared state file (the sidecar publishJson writes): Carol's board, opened from the same file, with SHARED/$600 typed
  const mkShared = async () => { const R0 = boot({ html: F1 }); await pause(80); wire(R0.ev, 'Carol', KEY.carol);
    if (CFG.ahead) R0.ev(`(function(){ var real=Date.now; Date.now=function(){ return real.call(Date)+${CFG.ahead}; }; return 'ok'; })()`);
    R0.ev(`setNote('A', 'SHARED'); setAlloc('A', '600'); 'ok'`); return JSON.parse(R0.ev('JSON.stringify(MS)')); };
  // a board file to import: Carol's board, opened from the same file, IMPORT/$610 typed, its saved file built (buildSavedHtml)
  const mkImport = async () => { const R0 = boot({ html: F1 }); await pause(80); wire(R0.ev, 'Carol', KEY.carol);
    R0.ev(`setNote('A', 'IMPORT'); setAlloc('A', '610'); 'ok'`); return R0.ev('buildSavedHtml()'); };
  let st = null, H = null, imp = null;
  if (CFG.mode === 'click') st = await mkShared();           // published earlier: older than Brad's edit, as it arrives at opening
  if (st) { const d = st.ts - Date.now(); step('sharedFile', { ts: st.ts, tsET: et(st.ts), minusRealNow: d });
    ck('fixture.sharedClock', CFG.ahead ? 'PREREQUISITE: the shared state file is stamped about an hour ahead of real time (59:55 to 60:00 min)' : 'the shared state file is stamped at or before real time',
      CFG.ahead ? (d > HOUR - 5000 && d <= HOUR) : d <= 0, true, 'fixture'); }
  if (CFG.mode !== 'auto') {
    A.ev(`setNote('A', 'BRAD-2'); setAlloc('A', '720'); 'ok'`);
    const a1 = view(A.ev, 'brad typed BRAD-2');
    ck('fixture.typed', 'brad typed BRAD-2/$720, unsaved ([screen, DIRTY, record dirty])', [a1.screen.whose, a1.DIRTY, !!a1.baseGet.dirty], ['BRAD-2', true, true], 'fixture');
  }
  if (CFG.mode === 'click') {
    A.ev(`sharedArrived(${J(st)}); 'ok'`);
    const a1 = view(A.ev, 'the shared state file arrived after brad started typing');
    step('arrived', { brad: a1, sharedTs: st.ts });
    ck('fixture.arrived', "the shared state file arrives after brad typed BRAD-2/$720: nothing is replaced and 'load the shared one' is offered ([screen, DIRTY, record dirty, SHARED held, said])",
      [a1.screen.whose, a1.DIRTY, !!a1.baseGet.dirty, A.ev('!!SHARED && SHARED.ts') === st.ts, /arrived after you started working/.test(a1.status) && /nothing was replaced/.test(a1.status)],
      ['BRAD-2', true, true, true, true], 'fixture');
  }
  if (CFG.held) {
    H = await heldSave(A, fold);
    const fH = fview(fold, 'save held');
    step('held', { reached: H.reached, brad: H.mid, folder: fH });
    ck(SCN + '.held', 'brad presses 💾 Save; it is held at the close of its write ([reached, DIRTY, record dirty, _saveBusy, head still BRAD-1])',
      [H.reached, H.mid.DIRTY, !!H.mid.baseGet.dirty, H.mid._saveBusy, fH.head.whose], [true, CFG.mode !== 'auto', CFG.mode !== 'auto', 1, 'BRAD-1'], 'fixture');
  }
  if (CFG.mode === 'auto') {
    st = await mkShared();
    const onScreenTs = +A.ev('MS.ts');
    ck('fixture.sharedNewer', "the shared state file is newer than what is on screen, as its automatic load requires ([SHARED ts > MS.ts])", [st.ts > onScreenTs], [true], 'fixture');
  }
  if (CFG.mode === 'import') imp = await mkImport();
  const gen0 = A.ev('_saveGen');
  let r1;
  if (CFG.mode === 'click') { A.ev(`globalThis.__q=[]; adoptShared(); 'ok'`); r1 = 'adoptShared()'; }
  else if (CFG.mode === 'auto') { A.ev(`sharedArrived(${J(st)}); 'ok'`); r1 = 'sharedArrived()'; }
  else if (CFG.mode === 'take') { A.ev(`globalThis.__q=[]; bootTakeFile(); 'ok'`); r1 = 'bootTakeFile(): asked ' + J(qs(A.ev).map(q => q.slice(0, 120))); }
  else {
    A.w.__impHtml = imp;
    A.ev(`globalThis.__q=[]; globalThis.__imp={ files:[ new File([globalThis.__impHtml], 'ORBIT O&M - Carol.html', {type:'text/html'}) ], value:'x' }; importBoards(globalThis.__imp); 'ok'`);
    let done = false; for (let i = 0; i < 400 && !done; i++) { await pause(25); done = A.ev(`globalThis.__imp.value===''`); }
    r1 = 'importBoards(): finished ' + done + '; asked ' + J(qs(A.ev).map(q => q.slice(0, 120)));
  }
  const m1 = view(A.ev, 'after the adoption' + (H ? ', save still held' : ''));
  step('adoption', { how: r1, brad: m1, folder: fview(fold, 'after the adoption') });
  const saidRe = { click: /Shared state loaded/, auto: /Shared state loaded/, take: /Opened the saved file/, import: /Imported:/ }[CFG.mode];
  ck(SCN + '.adopt', 'the other copy is put on screen ' + (H ? 'during the held save' : 'with no save under way') + ' ([screen, _saveBusy, _saveGen unchanged, kept slot, its own words said])',
    [m1.screen.whose, m1._saveBusy, m1._saveGen === gen0, m1.kept ? m1.kept.whose : null, saidRe.test(m1.status)], EXP.adopt, 'predict');
  if (H) { H.g.open(); await H.p; await settle(A); }
  const aft = view(A.ev, H ? 'brad after the save landed' : 'brad after the adoption');
  const fAft = fview(fold, 'landed');
  step('landed', { brad: aft, folder: fAft });
  if (H) ck(SCN + '.head', "the folder head after the save landed: the bytes it built ([content, by])", [fAft.head.whose, fAft.head.by], [FAM.Y, 'Brad'], 'fixture');
  const extra = [v1];
  K(SCN + '.K1', 'CONTRACT once settled', aft, fold, extra);
  U17state(aft, fold, extra);
  // V3next / V4putback straight from where the route ends (the save has landed; nothing else has run)
  if (NEXT !== 'none') { await doNext(A, fold, extra); return; }
  const r2 = await A.ev('driveStorePull(true)');
  const lat = view(A.ev, 'brad after a later refresh');
  step('laterRefresh', { returned: r2, brad: lat, folder: fview(fold, 'later refresh') });
  if (!said(lat.status)) K(SCN + '.K2', 'CONTRACT after a later refresh (or the board says the copies differ)', lat, fold, extra);
  else ck(SCN + '.K2', 'CONTRACT after a later refresh: the board says the copies differ', 'said', 'said', 'contract');
  const Z = boot({ html: F1, ls: lsOf(A.ev) }); await pause(80);
  wire(Z.ev, 'Brad', KEY.brad); connect(Z.ev, Z.w, fold);
  const zc = await Z.ev('driveAutoConnect()');
  const z0 = view(Z.ev, "reopened, after the opening's connect");
  const zr = await Z.ev('driveStorePull(true)');
  const z1 = view(Z.ev, 'reopened, after a refresh');
  step('reopen', { connect: zc, afterConnect: z0, refresh: zr, afterRefresh: z1, folder: fview(fold, 'reopen') });
  if (!said(z0.status + ' ' + z1.status)) K(SCN + '.K3', 'CONTRACT after a reopen (opening connect + refresh) (or it says the copies differ)', z1, fold, extra);
  else ck(SCN + '.K3', 'CONTRACT after a reopen: the board says the copies differ', 'said', 'said', 'contract');
  rec.whereNow = { [FAM.X]: whereIs(FAM.X, fold, z1), [FAM.Y]: whereIs(FAM.Y, fold, z1),
    note: FAM.X === 'SHARED' ? 'SHARED also stays in the shared state file itself (outside this mock)' : FAM.X === 'F1' ? 'F1 is the board file itself' : 'IMPORT is the imported file itself' };
};

try {
  if (CFG.fam === 'skew') await runSkew();
  else if (CFG.fam === 'pen') await runPen();
  else await runAdopt();
} catch (e) {
  checks.push({ id: SCN + '.harness', kind: 'harness', what: 'the scenario threw', expected: 'ran', observed: String((e && e.stack) || e).slice(0, 800), pass: false });
}
rec.endedET = et(Date.now());
rec.checks = checks;
writeFileSync(outPath, JSON.stringify(rec, null, 1));
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} [${c.kind}] ${c.id}: ${c.what}\n     expected ${J(c.expected)}\n     observed ${J(c.observed)}`);
if (rec.whereNow) console.log('whereNow ' + J(rec.whereNow));
if (rec.u17state) console.log('u17state ' + J(rec.u17state));
if (rec.nextFrom) console.log('nextFrom ' + J(rec.nextFrom));
if (rec.v3parts) console.log('v3parts ' + J(rec.v3parts));
if (rec.v4parts) console.log('v4parts ' + J(rec.v4parts));
console.log(`ids ${J(IDS)}`);
const byKind = k => { const c = checks.filter(x => x.kind === k); return `${k} ${c.filter(x => x.pass).length}/${c.length}`; };
console.log(`SUMMARY ${SCN} ${NEXT} board=${BK}: ${checks.filter(c => c.pass).length} pass, ${checks.filter(c => !c.pass).length} fail | ${['fixture', 'predict', 'contract', 'harness'].map(byKind).join(' | ')}`);
process.exit(0);
