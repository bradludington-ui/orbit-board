// STATE CROSSING THE FILE BOUNDARY, in both directions.
//
// OUT and back: the board saves by rewriting its own HTML -- buildSavedHtml() replaces the pubState
// script tag inside SRC0 -- and reopening that file is how every save is ever read back. If a value
// does not survive the trip it is gone, silently, and the only evidence is a board that looks
// slightly different from the one that was saved.
//
// IN: importing a state file is the one place the board takes numbers it did not compute. Every
// per-service figure it holds is an array indexed by SVC POSITION, so a file from a board whose
// service list differs lands each of them on the wrong service -- and because the same dollars are
// all still present, every total reconciles and nothing on the board looks wrong.
//
// This suite drives the real adoption path, applyStore(), the way an import does.
import { boot, seed, BOARD, capture, cv, bootMark, bootRelease, settleBoards, stopAtFirstFailure } from './boot.mjs';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { JSDOM, VirtualConsole } from 'jsdom';

// boot.mjs cannot help here: the board reads browser storage DURING its own boot script, so the
// storage has to be in place before the page parses. That is what beforeParse is for.
const openWith = (html, store) => {
  const dom = new JSDOM(html, { runScripts: 'dangerously', virtualConsole: new VirtualConsole(),
    url: 'https://example.invalid/board.html',
    beforeParse(w) { Object.keys(store || {}).forEach(k => { try { w.localStorage.setItem(k, store[k]); } catch (e) {} }); } });
  const w = dom.window;
  w.URL.createObjectURL = () => 'blob:stub'; w.URL.revokeObjectURL = () => {};
  w.HTMLAnchorElement.prototype.click = function () {};
  w.alert = () => {}; w.confirm = () => true; w.prompt = () => null;
  for (const g of ['Blob','Response','Request','Headers','ReadableStream','WritableStream',
                   'TransformStream','DecompressionStream','CompressionStream'])
    if (typeof globalThis[g] === 'function') w[g] = globalThis[g];
  return w;
};
const dumpLs = (w) => { const o = {}; const ls = w.localStorage;
  for (let i = 0; i < ls.length; i++) { const k = ls.key(i); o[k] = ls.getItem(k); } return o; };

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

// One board, three services, in this order.
const MINE = ['USAF', 'ANG', 'AFRC'];
const base = () => ({ services: MINE,
  items: [it('A', 'PSM', [9000000, 2000000, 1000000])],
  disc: [9000000, 2000000, 1000000], mand: [0, 0, 0], order: ['A'] });

// A state as another board would have written it: same three services, listed in a different order,
// with its per-service dollars in THAT order.
const theirState = (services, disc) => ({
  order: ['A'], alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [],
  discSvc: disc, mandSvc: disc.map(() => 0),
  dataPack: { services },
});

// Read the per-service vector ITSELF, by position, rather than zipping it against SVC. On a real
// board SVC is baked into the file and fixed (SVC_FROM_DATA), which is the case this guard exists
// for; in this harness it is rebuilt from the store, so zipping through it would be testing the
// harness instead. Position i must hold service i's money either way -- that is the whole claim.
const dvec = (ev) => JSON.parse(ev('JSON.stringify((S.discSvc||[]).map(Math.round))'));

// ── 1. same services, different ORDER: accepted, and every dollar follows its NAME ──────────────
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'reorder';
  try {
  const { ev } = boot(); seed(ev, base());
  // AFRC 1M, USAF 9M, ANG 2M — the same money, written in that board's order.
  const st = theirState(['AFRC', 'USAF', 'ANG'], [1000000, 9000000, 2000000]);
  const ok = ev(`applyStore(${JSON.stringify(st)}) !== false`);
  chk(name, 'guard', 'the import is accepted', String(ok), 'true');
  // This board is USAF, ANG, AFRC. The file wrote AFRC 1M, USAF 9M, ANG 2M in ITS order, so a
  // correct remap puts 9M, 2M, 1M here. Placed by position it would read 1M, 9M, 2M -- the
  // same total, every dollar on the wrong service.
  chk(name, 'money', 'each dollar follows its service NAME, not its position',
    dvec(ev).join(','), [9000000, 2000000, 1000000].join(','));
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ── 2. a DIFFERENT SET of services: refused, and the board is untouched ─────────────────────────
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'different services';
  try {
  const { ev } = boot(); seed(ev, base());
  const before = JSON.stringify(dvec(ev));
  const st = theirState(['STOVL', 'USMC-C', 'USN'], [5000000, 4000000, 3000000]);
  const ok = ev(`applyStore(${JSON.stringify(st)}) !== false`);
  chk(name, 'guard', 'the import is refused', String(ok), 'false');
  chk(name, 'money', 'the board is exactly as it was', JSON.stringify(dvec(ev)), before);
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ── 3. no service list at all: caught on ARITY, which is the only tell left ─────────────────────
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'no service list';
  try {
  const { ev } = boot(); seed(ev, base());
  const before = JSON.stringify(dvec(ev));
  const st = { order: ['A'], alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [],
               discSvc: [1, 2, 3, 4, 5], mandSvc: [0, 0, 0, 0, 0] };   // five, not three
  const ok = ev(`applyStore(${JSON.stringify(st)}) !== false`);
  chk(name, 'guard', 'a differently-shaped state is refused', String(ok), 'false');
  chk(name, 'money', 'the board is exactly as it was', JSON.stringify(dvec(ev)), before);
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ── 4. the board's OWN state: silent, always ────────────────────────────────────────────────────
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'own state';
  try {
  const { ev } = boot(); seed(ev, base());
  const before = JSON.stringify(dvec(ev));
  const ok = ev(`applyStore(JSON.parse(JSON.stringify(MS))) !== false`);
  chk(name, 'guard', 'reloading this board’s own state is accepted', String(ok), 'true');
  chk(name, 'money', 'and changes nothing', JSON.stringify(dvec(ev)), before);
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ── 5. EXHAUSTIVENESS: no per-service vector may be left in the file's order ────────────────────
// Every vector is filled with the FILE's own service indices [0,1,2]. After a remap by name each
// one must read back as the map. A vector svcRemapState() forgot stays [0,1,2] and fails here --
// the oracle walks the state generically, so it does not share svcRemapState's list of what to fix.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'exhaustive remap';
  try {
  const { ev } = boot(); seed(ev, base());
  const N = MINE.length, ident = [0, 1, 2];
  const st = {
    order: ['A'], removed: [], mc: {},
    discSvc: ident.slice(), mandSvc: ident.slice(),
    bm: { disc: ident.slice(), mand: ident.slice(), adds: [{ vec: ident.slice() }] },
    custom: [{ id: 'X', grp: 'PSM', custom: true, title: 'X', event: 'X', ccar: '',
               ask: ident.slice(), fy26: ident.slice(), alloc: null }],
    asks: { A: ident.slice() },
    alloc: { A: { m: 's', v: ident.slice() } },
    fsrc: { A: { m: 'split', dv: ident.slice(), mv: ident.slice() } },
    clins: { A: [{ ask: ident.slice() }] },
    awards: { A: { mode: 'inc', inc: [{ d: '2026-11', day: 1, sv: ident.slice() }] } },
    years: { 2028: { order: ['A'], discSvc: ident.slice(), mandSvc: ident.slice() } },
    dataPack: { services: ['AFRC', 'USAF', 'ANG'] },
  };
  const out = JSON.parse(ev(`(function(){
    var c = svcCheckPack(${JSON.stringify(st.dataPack)}, null);
    var s = ${JSON.stringify(st)};
    svcRemapState(s, c.map);
    return JSON.stringify({ map: c.map, st: s });
  })()`));
  chk(name, 'guard', 'the reorder is recognised', out.map.join(','), [1, 2, 0].join(','));

  // Generic walk: ANY array of service length made of the file's indices must now be the map.
  const bad = [];
  (function walk(node, path) {
    if (Array.isArray(node)) {
      const numeric = node.length === N && node.every(v => typeof v === 'number');
      if (numeric) {
        if (node.join(',') !== out.map.join(',')) bad.push(path + ' = [' + node.join(',') + ']');
        return;
      }
      node.forEach((v, i) => walk(v, path + '[' + i + ']'));
      return;
    }
    if (node && typeof node === 'object')
      Object.keys(node).forEach(k => { if (k !== 'dataPack') walk(node[k], path + '.' + k); });
  })(out.st, '');
  chk(name, 'exhaustive', 'every per-service vector was remapped'
    + (bad.length ? ' — left in file order: ' + bad.join(', ') : ''), bad.length, 0);
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ── 6. a refusal leaves the store byte-identical ─────────────────────────────────────
// Refusing is only useful if it refuses CLEANLY: a guard that rejects the file after half-writing
// it would be worse than no guard, because the board would then be neither the old one nor the new.
//
// LIMIT, STATED RATHER THAN PAPERED OVER: this drives applyStore(), which is the path a POPULATED
// board takes. importState()'s own branch for that case cannot be reached from here -- IS_SHELL is
// a boot-time const off the shipped DATA, and the committed program carries none, by the same rule
// that forbids committing a populated board. So the callers' `if(applyStore(...)===false) return;`
// lines are reviewed, not covered. What they protect is a misleading status line; what the guard
// itself protects is the money, and that is covered above.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'refusal is clean';
  try {
  const { ev } = boot(); seed(ev, base());
  const before = ev('JSON.stringify(MS)');
  const st = theirState(['STOVL', 'USMC-C', 'USN'], [5000000, 4000000, 3000000]);
  const r = ev(`applyStore(${JSON.stringify(st)})`);
  chk(name, 'guard', 'applyStore reports the refusal to its caller', String(r), 'false');
  chk(name, 'state', 'the store is byte-identical to before', ev('JSON.stringify(MS)'), before);
  chk(name, 'state', 'and the board still renders', ev('(render(), "ok")'), 'ok');
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ── 7. the service list hiding under a year ───────────────────────────────────────
// A teammate sends a STATE file, not a store. normalizeStore() nests it under years.<fy>, taking
// its dataPack down with it -- so a guard reading only raw.dataPack found nothing to compare and
// waved the file through. That is the commonest shape there is, and it was the shape that got past
// the first version of this guard.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'pack under a year';
  try {
  const { ev } = boot(); seed(ev, base());
  const before = ev('JSON.stringify(MS)');
  const store = { base: 2027, cur: 2027, years: { 2027: {
    order: ['A'], alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [],
    discSvc: [5000000, 4000000, 3000000], mandSvc: [0, 0, 0],
    dataPack: { services: ['STOVL', 'USMC-C', 'USN'] } } } };
  const r = ev(`applyStore(${JSON.stringify(store)})`);
  chk(name, 'guard', 'a pack nested under a year is still found and refused', String(r), 'false');
  chk(name, 'state', 'the store is byte-identical to before', ev('JSON.stringify(MS)'), before);
  // The same shape, with THIS board's services, must still load.
  const mineStore = JSON.parse(JSON.stringify(store));
  mineStore.years[2027].dataPack.services = MINE;
  mineStore.years[2027].discSvc = [9000000, 2000000, 1000000];
  chk(name, 'guard', 'the same shape with this board\u2019s services loads',
    String(ev(`applyStore(${JSON.stringify(mineStore)}) !== false`)), 'true');
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();


// A real board has its requirements in DATA when BASE_ITEMS is captured at boot, so dataPackOf()
// carries them into the saved file. seed() runs AFTER boot, so the fixture has to fill BASE_ITEMS
// itself -- without this the file saves items:[] and the reopened board drops every non-custom row.
const asBooted = (ev, sc) => ev(`(function(){
  BASE_ITEMS.length=0;
  ${JSON.stringify(sc.items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
  return 'ok'; })()`);

// pmoOrder is REBUILT from the requirement list on load, so it is derived state rather than saved
// state and is excluded from the whole-store comparison. Everything else has to match exactly.
// SAVE CLOCKS ARE MEANT TO MOVE: buildSavedHtml() calls save(), which stamps a fresh MS.ts, so a
// byte comparison would fail on a millisecond and say nothing about the data. Only the three
// timestamps are zeroed -- by name, not by walking for every key called "t", because `t` elsewhere
// in the store is a title (rcn) and a match string (flow.ents).
const settled = (ev) => { const m = JSON.parse(ev('JSON.stringify(MS)'));
  Object.keys(m.years || {}).forEach(y => { delete m.years[y].pmoOrder; });
  m.ts = 0;
  (m.log || []).forEach(e => { e.ts = 0; });
  (m.jrnl || []).forEach(e => { e.t = 0; });
  return JSON.stringify(m); };

// ══ SAVE → REOPEN ═════════════════════════════════════════════════════════════
// The board persists by rewriting its own HTML. buildSavedHtml() drops the whole store into the
// pubState script tag of SRC0; reopening that file is the ONLY way a save is ever read back. So the
// invariant is simply: what comes back is what went in. Nothing tested this before -- the saved
// file was built, downloaded and trusted.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'save → reopen';
  try {
  const sc = base();
  const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);

  // A board with something in every store worth losing: renames, notes, a per-service split, a
  // trimmed allocation, an award schedule with increments, an MC star, a band, a custom row.
  ev(`
    S.mc['A']=true;
    S.titles['A']='Renamed \u2014 with an em dash, a "quote" and an apostrophe\u2019s tail';
    S.notes['A']='note with <b>markup</b> and a literal <\/script> in it';
    S.desc['A']='description \u2713 with unicode \u00e9\u00e5\u5b57 and an emoji \ud83d\ude80';
    S.ccar['A']='JSF9911'; S.pid['A']='PID-4242';
    S.alloc['A']={m:'t', v:7500001};
    seedSplit('A'); S.fsrc['A'].dv[1]=123456;
    S.awards['A']={mode:'inc', inc:[{d:FYMON[1][0], day:3, sv:[10,20,30]},
                                    {d:FYMON[4][0], day:17, sv:[40,50,60]}]};
    S.minInc['A']=250000; S.absorb='A'; S.absorbFloor=1000;
    S.custom.push({id:'NEW-1',grp:'PSM',sect:'new',custom:true,title:'added row',event:'e',
                   ccar:'',fy26:[0,0,0],ask:[11,22,33],alloc:null});
    S.order.push('NEW-1');
    save(); 'ok'`);

  const before = settled(ev);
  const html   = ev('buildSavedHtml()');
  chk(name, 'file', 'the saved file carries a pubState payload',
    /<script type="application\/json" id="pubState">.+?<\/script>/s.test(html) ? 'yes' : 'no', 'yes');
  // A literal </script> inside a note would end the tag early and truncate the whole store. The
  // writer escapes "<"; this is what proves the escape is load-bearing rather than decorative.
  chk(name, 'file', 'no stray </script> inside the payload',
    (html.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/) || [,''])[1]
      .indexOf('</script>') < 0 ? 'clean' : 'truncated', 'clean');

  // Reopen the saved file exactly as a browser would, and read its store back.
  const re = boot({ html });
  chk(name, 'store', 'the reopened board is the board that was saved', settled(re.ev), before);
  chk(name, 'store', 'and it rendered without throwing',
    re.errors.length ? re.errors[0].slice(0, 120) : 'ok', 'ok');
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ══ the values most likely to be quietly mangled ════════════════════════════════════
// A whole-store comparison passes the moment both sides are equally wrong, so name the fields that
// would cost real money or real meaning and check them one at a time on the REOPENED board.
// ═══ BUY LINES REOPEN ONCE ══════════════════════════════════════════════════════════════════════════
// A board with buy lines seats BUY-AC and BUY-ENG in DATA.items at boot when the payload says so.
// The first save wrote those two rows into the data pack, the next open rehydrated DATA from that
// pack and seated them AGAIN: one more of each on every reopen, x1, x2, x3, measured. S.order held
// each id once, so the priority list looked right; every surface that walks DATA.items counted the
// buy lines twice, then three times. Found by the round-trip fuzz the day it learned to fill every
// container the board writes -- nothing here had ever opened a saved board with buy lines.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'buy lines reopen once';
  try {
  const sc = base();
  const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
  // The payload says the board has buy lines, the way a real board's baked template does. This
  // boot happened before the flag was set, so it seated none; the next boot is the board's own path.
  ev(`DATA.buys=true; BASE_ITEMS.length=0;
      DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      applyState(S); save(); 'ok'`);
  const count = h => Number(h.ev(`DATA.items.filter(function(i){ return i.id==='BUY-AC'; }).length`));
  const b1 = boot({ html: ev('buildSavedHtml()') });
  chk(name, 'first open', 'the board seats one aircraft buy line', count(b1), 1);
  const n1 = Number(b1.ev('DATA.items.length'));
  const b2 = boot({ html: b1.ev('buildSavedHtml()') });
  chk(name, 'reopen', 'a reopen still holds exactly one', count(b2), 1);
  chk(name, 'reopen', 'and the requirement count does not grow', Number(b2.ev('DATA.items.length')), n1);
  const b3 = boot({ html: b2.ev('buildSavedHtml()') });
  chk(name, 'reopen', 'nor on the open after that', count(b3), 1);
  chk(name, 'reopen', 'and the pack the next save would write carries it once',
    Number(b3.ev(`dataPackOf().items.filter(function(i){ return i.id==='BUY-AC'; }).length`)), 1);
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
  const name = 'what survives';
  try {
  const sc2 = base();
  const { ev } = boot(); seed(ev, sc2); asBooted(ev, sc2);
  ev(`
    S.alloc['A']={m:'t', v:7500001};
    seedSplit('A'); S.fsrc['A'].dv[1]=123456;
    S.awards['A']={mode:'inc', inc:[{d:FYMON[1][0], day:3, sv:[10,20,30]}]};
    S.titles['A']='a "quoted" \u2014 title'; S.notes['A']='</script> & <b>&amp;</b>';
    S.minInc['A']=250000; save(); 'ok'`);
  const re = boot({ html: ev('buildSavedHtml()') });
  const got = k => re.ev(k);
  chk(name, 'money', 'the trimmed allocation keeps its exact dollars', Number(got("S.alloc['A'].v")), 7500001);
  chk(name, 'money', 'a hand-typed split value survives', Number(got("S.fsrc['A'].dv[1]")), 123456);
  chk(name, 'money', 'and it is still a NUMBER, not a string', got("typeof S.fsrc['A'].dv[1]"), 'number');
  chk(name, 'money', 'the minimum useful increment survives', Number(got("S.minInc['A']")), 250000);
  chk(name, 'schedule', 'the increment day survives', Number(got("S.awards['A'].inc[0].day")), 3);
  chk(name, 'schedule', 'its per-service dollars survive',
    got("JSON.stringify(S.awards['A'].inc[0].sv)"), '[10,20,30]');
  chk(name, 'text', 'a title with quotes and an em dash survives',
    got("S.titles['A']"), 'a "quoted" \u2014 title');
  chk(name, 'text', 'a note containing </script> and entities survives',
    got("S.notes['A']"), '</script> & <b>&amp;</b>');
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ══ READING A WORKBOOK ══════════════════════════════════════════════════════════════════════════
// xlsxRead() is a hand-rolled ZIP+XLSX parser, and every offset it follows comes out of the file
// itself. A CCaR pull that did not finish downloading points those offsets anywhere. Unchecked they
// threw "Offset is outside the bounds of the DataView" -- true, and no help at all to someone who
// just wants to know whether to download it again.
//
// The fixture is built by the board's OWN writer, so a workbook that round-trips proves reader and
// writer agree, and damaging that buffer gives realistically-corrupt files rather than invented ones.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'workbook reader';
  try {
  const { w } = boot();
  const r = JSON.parse(await w.eval(`(async function(){
    const mk = () => { const b = buildXlsx([{name:'Pull', cols:[20,12], rows:[
        [{v:'Requirement'},{v:'Amount'}],
        [{v:'O&M <ampersand> "quoted"'},{v:1234567.89}],
        [{v:'second row'},{v:0}]]}]);
      return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };
    const full = mk();
    const out = { ok:null, errs:{} };
    try { const sh = await xlsxRead(full);
          out.ok = { sheets:Object.keys(sh), rows:sh[Object.keys(sh)[0]] }; }
    catch(e){ out.ok = 'THREW: ' + ((e&&e.message)||e); }
    const eat = async (label, buf) => {
      try { await xlsxRead(buf); out.errs[label] = 'NO ERROR'; }
      catch(e){ out.errs[label] = ((e&&e.message)||String(e)); } };
    await eat('empty', new ArrayBuffer(0));
    await eat('noise', new Uint8Array([1,2,3,4,5,6,7,8,9,10]).buffer);
    await eat('truncated', full.slice(0, Math.floor(full.byteLength*0.6)));
    const at = (b) => { const dv=new DataView(b);
      for(let i=b.byteLength-22;i>=0;i--) if(dv.getUint32(i,true)===0x06054b50) return [dv,i];
      return [dv,-1]; };
    const bad = full.slice(0);   { const [dv,e]=at(bad);  dv.setUint32(e+16, 0x7fffff00, true); }
    await eat('cdOffset', bad);
    // A perfectly valid ZIP that simply is not a workbook -- what you get if someone picks the
    // wrong file, or a .zip of the pull rather than the pull.
    const notBook = _zipStore([['hello.txt', _utf8('this is not a workbook')]]);
    await eat('zipNotWorkbook', notBook.buffer.slice(notBook.byteOffset, notBook.byteOffset+notBook.byteLength));
    // A workbook whose sheet points at shared text that is not there. Handed back unchecked this
    // is undefined, which lands as a blank cell and reads as missing data, not a broken file.
    const P = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    const dangling = _zipStore([
      ['xl/workbook.xml', _utf8(P+'<workbook xmlns:r="r"><sheets><sheet name="Pull" sheetId="1" r:id="rId1"/></sheets></workbook>')],
      ['xl/_rels/workbook.xml.rels', _utf8(P+'<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>')],
      ['xl/worksheets/sheet1.xml', _utf8(P+'<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>99</v></c></row></sheetData></worksheet>')]]);
    await eat('danglingString', dangling.buffer.slice(dangling.byteOffset, dangling.byteOffset+dangling.byteLength));
    const many = full.slice(0);  { const [dv,e]=at(many); dv.setUint16(e+10, 60000, true); }
    await eat('entryCount', many);
    return JSON.stringify(out);
  })()`));

  // The round trip first: a workbook this app wrote, read back by this app.
  chk(name, 'round trip', 'a workbook the board wrote reads back',
    typeof r.ok === 'string' ? r.ok : 'read', 'read');
  if (typeof r.ok !== 'string') {
    chk(name, 'round trip', 'the sheet name survives', r.ok.sheets.join(','), 'Pull');
    // "O&M" is in nearly every budget line, and it is written as an escaped inline string.
    chk(name, 'round trip', 'ampersands and quotes come back unescaped',
      r.ok.rows[1][0], 'O&M <ampersand> "quoted"');
    chk(name, 'round trip', 'a number comes back as a NUMBER', typeof r.ok.rows[1][1], 'number');
    chk(name, 'round trip', 'and keeps its cents', r.ok.rows[1][1], 1234567.89);
    chk(name, 'round trip', 'a zero is kept, not dropped', r.ok.rows[2][1], 0);
  }

  // Then the damaged ones. Each must NAME what is wrong -- never a bare RangeError, and never
  // silence, which would let a half-read pull land on the board as real data.
  const says = (label, must) => {
    const m = r.errs[label] || '(missing)';
    chk(name, 'damaged', `${label}: is rejected`, m === 'NO ERROR' ? 'accepted' : 'rejected', 'rejected');
    chk(name, 'damaged', `${label}: says what is wrong, not "${m.slice(0, 28)}…"`,
      must.test(m) ? 'explains' : m.slice(0, 70), 'explains');
    chk(name, 'damaged', `${label}: is not a raw JS error`,
      /outside the bounds|is not a function|of undefined|Cannot read/.test(m) ? m.slice(0, 60) : 'clean', 'clean');
  };
  says('empty',      /empty/i);
  says('noise',      /not an \.xlsx|end-of-directory/i);
  says('truncated',  /not an \.xlsx|end-of-directory|truncated/i);
  says('cdOffset',   /directory starts at byte \d+/i);
  says('entryCount', /claims \d+ entries/i);
  says('zipNotWorkbook', /no workbook part/i);
  says('danglingString', /shared-string table|points at text/i);
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ══ MOVING A REQUIREMENT BETWEEN FISCAL YEARS ═══════════════════════════════════════════════════
// yearCopy() carries a requirement and everything attached to it into another year. Its own comment
// warns that the container list it normalises and the cp() payload below it "MUST STAY IN STEP, IN
// BOTH DIRECTIONS": a container normalised with no cp() arrives on the target EMPTY and the data
// stays behind, which looks exactly like a year nobody has filled in yet. That warning had no test.
//
// The key list is read out of the BOARD'S OWN SOURCE, not restated here, so a container added to
// the normalise list and forgotten in the payload fails this check the day it is added.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'copy / move between years';
  try {
  const src = readFileSync(BOARD, 'utf8');
  const listM = /\n  \['alloc','mc',([\s\S]*?)\]\n    \.forEach\(k=>\{ if\(!T\[k\]\) T\[k\]=\{\}; \}\);/.exec(src);
  const KEYS = listM ? ("['alloc','mc'," + listM[1] + "]").match(/'([a-zA-Z]+)'/g).map(x => x.slice(1, -1)) : [];
  chk(name, 'oracle', 'the container list was read from the board', KEYS.length > 25 ? 'read' : KEYS.length, 'read');

  const { ev } = boot(); seed(ev, base());
  // A marker in every container, shaped the way each one really holds its value.
  const out = JSON.parse(ev(`(function(){
    const KEYS = ${JSON.stringify(KEYS)};
    KEYS.forEach(function(k){ if(!S[k]) S[k]={}; });
    KEYS.forEach(function(k){ S[k]['A'] = 'MK-' + k; });
    S.alloc['A']   = {m:'t', v:7500001};
    S.mc['A']      = true;
    S.minInc['A']  = 42;
    S.fsrc['A']    = {m:'split', dv:[1,2,3], mv:[0,0,0]};
    S.awards['A']  = {mode:'inc', inc:[{d:'2026-11', day:9, sv:[1,2,3]}], d:'2026-11'};
    S.crHalf['A']  = {'2026-11': 1};
    S.upl = S.upl || {}; S.upl['r|A'] = 1;
    save();
    const beforeSrc = JSON.stringify(MS.years[MS.cur]);
    const r = yearCopy('A', 2029, 'c');
    const T = MS.years[2029] || {};
    const got = {};
    KEYS.forEach(function(k){ got[k] = (T[k] && T[k]['A'] !== undefined) ? 'carried' : 'LOST'; });
    return JSON.stringify({
      ok: r && r.ok, tid: r && r.tid,
      got: got,
      order: (T.order||[]).slice(),
      awd: T.awards && T.awards['A'],
      crHalf: T.crHalf && T.crHalf['A'],
      asks: T.asks && T.asks['A'],
      uplTarget: !!(T.upl && T.upl['r|A']),
      srcUnchanged: JSON.stringify(MS.years[MS.cur]) === beforeSrc
    });
  })()`));

  chk(name, 'copy', 'the copy reports success', String(out.ok), 'true');
  chk(name, 'copy', 'the requirement is on the target year’s order',
    out.order.includes('A') ? 'present' : 'missing', 'present');
  // THE CHECK THE WARNING ASKS FOR: every normalised container actually carried something.
  // ONE NAMED EXCEPTION. upl is keyed 'r|<id>', not by the bare id -- the board says so, and
  // cp(T.upl, S.upl[id]) would have copied undefined and looked like it worked. It carries under
  // its real key, which the uplTarget check below proves; it is excluded here by name so the
  // exception is on the record rather than absorbed by a looser sweep.
  const KEYED_DIFFERENTLY = { upl: "keyed 'r|<id>', checked separately below" };
  const lost = KEYS.filter(k => out.got[k] === 'LOST' && !KEYED_DIFFERENTLY[k]);
  chk(name, 'copy', 'every container the target normalises also receives its data'
    + (lost.length ? ' — arrived empty: ' + lost.join(', ') : ''), lost.length, 0);
  // Dates move with the year; a copy two years out must not still say 2026.
  chk(name, 'copy', 'the award date shifts with the year', out.awd && out.awd.d, '2028-11');
  chk(name, 'copy', 'an increment date shifts too',
    out.awd && out.awd.inc && out.awd.inc[0].d, '2028-11');
  chk(name, 'copy', 'the increment keeps its day', out.awd && out.awd.inc && out.awd.inc[0].day, 9);
  chk(name, 'copy', 'the CR half-month key shifts too',
    Object.keys(out.crHalf || {}).join(','), '2028-11');
  chk(name, 'copy', 'the requirement value travels',
    JSON.stringify(out.asks), JSON.stringify([9000000, 2000000, 1000000]));
  chk(name, 'copy', 'the UPL mark travels under its r| key',
    String(out.uplTarget), 'true');
  chk(name, 'copy', 'a COPY leaves this year untouched', String(out.srcUnchanged), 'true');

  // A MOVE takes it out of this year. Anything less leaves the same money in two years at once.
  const mv = JSON.parse(ev(`(function(){
    const r = yearCopy('A', 2030, 'm');
    return JSON.stringify({ ok:r&&r.ok,
      stillHere: S.order.indexOf('A') >= 0,
      removed: (S.removed||[]).indexOf('A') >= 0,
      inTarget: ((MS.years[2030]||{}).order||[]).indexOf('A') >= 0,
      inPmoOrder: Object.keys(S.pmoOrder||{}).some(function(g){
        return (S.pmoOrder[g]||[]).indexOf('A') >= 0; }) });
  })()`));
  chk(name, 'move', 'the move reports success', String(mv.ok), 'true');
  chk(name, 'move', 'it is gone from this year’s order', String(mv.stillHere), 'false');
  chk(name, 'move', 'and recorded as removed, so it is restorable', String(mv.removed), 'true');
  chk(name, 'move', 'it is on the target year', String(mv.inTarget), 'true');
  chk(name, 'move', 'and off every PMO ordering here', String(mv.inPmoOrder), 'false');
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ══ THE PMO COPY, AND WHAT COMES BACK FROM IT ═══════════════════════════════════════════════════
// A copy published for a programme office: everything works on screen, nothing reaches the team's
// board, and the one artifact it produces is a submittal the team reviews field by field.
//
// The guardrail is honest about being a guardrail -- the data is in the file and anyone who opens
// it can read all of it. What these checks protect is the part that IS enforceable: that the copy
// cannot write outward, that a submittal carries only what a PMO is invited to propose, and that
// nothing lands on the board without being ticked.
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

// ── review: nothing lands without a tick, and a clash is visible ────────────────────────────────
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'submittal review';
  try {
  const sc = base();
  const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
  // The board moved on after the copy went out: it rewrote the SAME impact statement.
  ev(`S.cons['A']='Our own earlier wording.'; save(); 'ok'`);
  const pkg = { spmtPkg: 1, dir: 'submit', ap: '', fy: 2027, ts: Date.now(), by: 'PMO Lead',
    fromTs: Date.now() - 86400000,
    items: { A: { cons: 'Theirs: the depot line stops in March.', asks: [9500000, 2000000, 1000000] },
             B: { ccar: 'JSF7777' } },
    base:  { A: { cons: null, asks: [9000000, 2000000, 1000000] }, B: { ccar: null } } };
  ev(`window.alert=function(){}; pmoTake(${JSON.stringify(pkg)}, 'sub.json'); 'ok'`);

  const rows = JSON.parse(ev('JSON.stringify(pmoRows().map(function(r){ return {id:r.id,key:r.key,conflict:r.conflict}; }))'));
  chk(name, 'diff', 'it holds three proposed changes', rows.length, 3);
  // THE CONFLICT IS THE POINT. The baseline travels in the package, so "changed here since" is
  // knowable; diffing against the board's own current values would compare it with itself and
  // every field would look uncontested.
  chk(name, 'diff', 'the field this board also changed is flagged',
    rows.filter(r => r.conflict).map(r => r.id + '|' + r.key).join(','), 'A|cons');
  chk(name, 'diff', 'and the untouched ones are not',
    rows.filter(r => !r.conflict).length, 2);
  chk(name, 'review', 'nothing is ticked to begin with', ev('Object.keys(PMOPICK).length'), 0);
  chk(name, 'review', 'so applying now does nothing',
    ev(`(function(){ var h=false; var _a=window.alert; window.alert=function(){h=true;};
        pmoApply(); window.alert=_a; return h? 'refused':'APPLIED'; })()`), 'refused');
  chk(name, 'review', 'the board is untouched while it is only proposed',
    ev("S.cons['A']"), 'Our own earlier wording.');
  chk(name, 'report', 'a change report builds before anything is applied',
    ev(`(function(){ var n=0; var _c=URL.createObjectURL;
        URL.createObjectURL=function(b){ n=(b&&(b.size||b.length))||1; return 'blob:x'; };
        pmoReport(); URL.createObjectURL=_c; return n>500? 'built':'empty'; })()`), 'built');

  // Tick two of the three; the third must stay where it was.
  ev(`PMOPICK={}; pmoRows().forEach(function(r){ if(r.id==='A'&&(r.key==='cons'||r.key==='asks')) PMOPICK[pickKey(r)]=true; });
    window.confirm=function(){return true;};
      window.alert=function(){}; pmoApply(); 'ok'`);
  chk(name, 'apply', 'the ticked impact statement is applied',
    ev("S.cons['A']"), 'Theirs: the depot line stops in March.');
  chk(name, 'apply', 'the ticked requirement value is applied',
    ev("JSON.stringify(S.asks['A'])"), JSON.stringify([9500000, 2000000, 1000000]));
  chk(name, 'apply', 'the unticked record correction is NOT applied',
    ev("S.ccar['B'] || '(none)'"), '(none)');
  chk(name, 'apply', 'every applied change is in the change journal',
    ev("MS.jrnl.filter(function(e){ return e.p && e.p[0]==='cons'; }).length > 0") ? 'journalled' : 'silent',
    'journalled');
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ══ THE HANDOFF, HELD TO "NOTHING IS LOST AND NOTHING IS INVENTED" ══════════════════════════════
// Two directions, one standard: the copy a programme office receives must compute exactly what this
// board computes, and an accepted change must leave the board exactly as if it had been typed here
// by hand. Anything less is a number briefed to leadership that nobody typed.
const fpOf = (ev) => ev(`(function(){ const T=tiers(); const o={};
  S.order.forEach(function(id){ const p=T[id]; if(!p) return;
    o[id]={d:p.d.map(Math.round), m:p.m.map(Math.round), u:p.u.map(Math.round),
           cum:Math.round(p.cum), tier:p.tier, natM:Math.round(p.natM), natU:Math.round(p.natU)}; });
  const TT=tierTotals(T), MC=mcCalc(T);
  o.__tot={dUsed:Math.round(TT.dUsed), mUsed:Math.round(TT.mUsed), uAmt:Math.round(TT.uAmt)};
  o.__mc={tot:MC.tot.map(Math.round), need:MC.need.map(Math.round)};
  o.__ask=S.order.map(function(id){ var x=itemById(id); return x? JSON.stringify(x.ask):'?'; });
  return JSON.stringify(o); })()`);

// A board with the awkward cases on it: six services, a scalar trim, a split, an award, a star,
// and a CUSTOM requirement -- the one whose value does not live where every other one's does.
const handoffSc = () => ({
  services: ['USAF','ANG','AFRC','STOVL','USMC-C','USN'],
  // ONE OFFICE OWNS ALL THREE. This scenario is about what KIND of field survives the trip -- long
  // prose, a per-service vector, a custom requirement -- not about who owns what. A submittal is
  // scoped to its own office now, so a fixture spanning three would quietly shrink to one row and
  // stop testing the thing it exists for. Scoping is proved in 'scoped submittals'.
  items: [it('A','PSM',[9000000,2000000,1000000,4000000,1500000,2500000]),
          it('B','PSM',[3000000,500000,250000,1000000,0,750000]),
          it('C','PSM',[1200000,0,0,300000,200000,100000])],
  disc:[8000000,1500000,600000,3000000,1400000,1600000],
  mand:[4000000,600000,400000,1500000,800000,900000],
  order:['A','B','C'], mc:{A:true},
});
const handoffSeed = (ev, sc) => { asBooted(ev, sc); ev(`
  // THE SIDE DATABASES RIDE ALONGSIDE THE STORE, not inside it: execution data, the ACE cost
  // estimate and the reprogramming log are their own globals and buildSavedHtml() packs each one
  // separately. Left empty in the fixture, a copy that dropped them looked identical to one that
  // carried them -- so seed all three with something recognisable.
  EXDB={ts:1700000000001, all:{'A':{oblig:1234567, comm:7654321}}};
  ACEDB={ts:1700000000002, sets:{'FY27':{'A':{pt:42}}}};
  RPDB={ts:1700000000003, entries:[{id:'r1', k:'ATR', fy:2027, amt:2500000, note:'depot line'}]};
  // the BAE budget list, board-wide since v1.83 -- it rides beside the stores, not inside one
  BUDDB={ts:1700000000004, files:[{dept:'USAF', file:'USAF BAE.xlsx', ts:1700000000004, n:2}],
         rows:['USAF O&M - ANG CAM Discretionary AV','USMC STOVL APN Full Fund SUPT OTHER ILS Discretionary PSM'].map(budParseName)};
  _budRegCache=null;
  S.alloc['B']={m:'t',v:3900001}; S.band['A']='pdm'; seedSplit('C');
  S.awards['A']={mode:'single',d:FYMON[2][0],day:7};
  S.custom.push({id:'NEW-1',grp:'PSM',sect:'new',custom:true,title:'Added here',event:'e',
                 ccar:'',fy26:SVC.map(function(){return 0;}), ask:[500000,0,0,0,0,0], alloc:null});
  S.order.push('NEW-1'); applyState(S); save(); 'ok'`); };

await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'handoff — out';
  try {
  const sc = handoffSc();
  const { ev } = boot(); seed(ev, sc); handoffSeed(ev, sc);
  // a locked cycle, so the store below has something to lose
  ev(`blCyc='PB'; blYr=MS.cur; cycLock(); 'ok'`);
  const boardFp = fpOf(ev);
  const html = ev(String.raw`(function(){
    const mode={sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, base:pmoBaseline()};
    return buildSavedHtml().replace(/(<script type="application\/json" id="pubMode">)[\s\S]*?(<\/script>)/,
      function(m,a,b){ return a + JSON.stringify(mode).replace(/</g,'\\u003c') + b; }); })()`);
  const P = boot({ html });

  // IF THE COPY COMPUTES ANYTHING DIFFERENT, every conversation downstream is about a different
  // board. This compares each requirement's lane vectors, its cumulative, its tier, both cutline
  // figures, the portfolio totals, Mission Critical, and every requirement value.
  chk(name, 'figures', 'the copy computes exactly what this board computes', fpOf(P.ev), boardFp);
  chk(name, 'content', 'it carries every requirement', P.ev('S.order.length'), ev('S.order.length'));
  chk(name, 'content', 'including the one added here', P.ev(`S.order.indexOf('NEW-1')>=0`), true);
  chk(name, 'content', 'the baseline covers every requirement',
    P.ev('Object.keys(PMODE.base).length'), ev('S.order.length'));
  // Every per-requirement store, compared whole. A store that failed to travel would look like a
  // programme office that simply had not written anything.
  ['alloc','mc','band','fsrc','awards','asks','notes','desc','cons','ccar','pid','recNames',
   'minInc','rcnAsg','si','wbs','ptype','obCat'].forEach(k =>
    chk(name, 'content', `${k} travelled intact`,
      P.ev(`JSON.stringify(S['${k}']||{})`), ev(`JSON.stringify(S['${k}']||{})`)));
  ['bands','rcn','snaps','ppbe','pmos','cycle','cycleRef'].forEach(k =>
    chk(name, 'content', `${k} travelled intact`,
      P.ev(`JSON.stringify(MS['${k}']||null)`), ev(`JSON.stringify(MS['${k}']||null)`)));
  // The three side databases are their own globals, packed separately by buildSavedHtml(). A copy
  // that dropped one is a copy whose execution read-outs, cost estimate or reprogramming tracker
  // are simply EMPTY -- which reads as a programme with nothing in it rather than as a broken file.
  ['EXDB','ACEDB','RPDB','CYCDB','BUDDB'].forEach(k =>
    chk(name, 'content', `${k} travelled intact`,
      P.ev(`JSON.stringify(${k}||null)`), ev(`JSON.stringify(${k}||null)`)));
  chk(name, 'content', 'and the reprogramming log is not merely present but populated',
    P.ev(`(RPDB.entries||[]).length`), 1);
  chk(name, 'content', 'and the locked cycle is not merely present but populated',
    P.ev(`Object.keys(CYCDB.cycles).length`), 1);
  chk(name, 'content', 'and the BAE budget list is not merely present but read',
    P.ev(`budReg().length`), 2);

  // AN INVARIANT, ASSERTED SO AN EQUIVALENCE CLAIM CANNOT ROT. applyState() rebuilds DATA.items
  // from BASE_ITEMS plus the S.custom objects THEMSELVES, so itemById() on a custom requirement
  // returns the store's own object -- which is why applyAskVec()'s `c.ask=` line is belt and braces
  // rather than the only writer, and why the mutation against it is equivalent. If this ever stops
  // holding, that line becomes load-bearing and this check fails first.
  chk(name, 'aliasing', 'itemById() on a custom requirement IS the stored object',
    ev(`itemById('NEW-1')===S.custom.filter(function(c){ return c.id==='NEW-1'; })[0]`), true);
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
  const name = 'handoff — back';
  try {
  const sc = handoffSc();
  // The office changes four things, including the value on the CUSTOM requirement.
  const { ev: pe } = (() => { const b = boot(); seed(b.ev, sc); handoffSeed(b.ev, sc); return b; })();
  const html = pe(String.raw`(function(){
    const mode={sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, base:pmoBaseline()};
    return buildSavedHtml().replace(/(<script type="application\/json" id="pubMode">)[\s\S]*?(<\/script>)/,
      function(m,a,b){ return a + JSON.stringify(mode).replace(/</g,'\\u003c') + b; }); })()`);
  const P = boot({ html });
  const LONG = 'Depot line stops in March 26; forty aircraft unsupported. '.repeat(9);
  P.ev(`try{ localStorage.setItem('prio27who','PMO');
              localStorage.setItem('prio27pmo','PSM'); }catch(e){}
    S.cons['A']=${JSON.stringify(LONG)};
    [3100000,500000,250000,1000000,0,750000].forEach(function(v,i){ setAsk('B',i,String(v)); });
    [777000,0,0,0,0,0].forEach(function(v,i){ setAsk('NEW-1',i,String(v)); });
    S.ccar['C']='JSF4242'; save(); 'ok'`);
  const wire = JSON.parse(P.ev(`(function(){ var cap=null; var _B=window.Blob;
    window.Blob=function(parts,opts){ cap=parts&&parts[0]; return new _B(parts,opts); };
    try{ pmoSubmit(); }catch(e){} window.Blob=_B; return cap; })()`));
  chk(name, 'package', 'it carries the service list it was written against',
    (wire.svc || []).join(','), sc.services.join(','));
  chk(name, 'package', 'the custom requirement’s value is in it',
    JSON.stringify((wire.items || {})['NEW-1']), JSON.stringify({ asks: [777000,0,0,0,0,0] }));

  // PATH 1 — accept every proposed change on a fresh board.
  const X = boot(); seed(X.ev, sc); handoffSeed(X.ev, sc);
  X.ev(`window.alert=function(){}; window.confirm=function(){return true;};
    pmoTake(${JSON.stringify(wire)}, 's.json');
    PMOPICK={}; pmoRows().forEach(function(r){ PMOPICK[pickKey(r)]=true; }); pmoApply(); 'ok'`);
  // PATH 2 — type the same values here, by hand, the way the team would have.
  const Y = boot(); seed(Y.ev, sc); handoffSeed(Y.ev, sc);
  Y.ev(`S.cons['A']=${JSON.stringify(LONG)};
    [3100000,500000,250000,1000000,0,750000].forEach(function(v,i){ setAsk('B',i,String(v)); });
    [777000,0,0,0,0,0].forEach(function(v,i){ setAsk('NEW-1',i,String(v)); });
    S.ccar['C']='JSF4242'; applyState(S); save(); 'ok'`);

  // THE STANDARD. Not "the fields look right" -- the whole board, recomputed, identical.
  chk(name, 'equivalence', 'applying the submittal leaves the board exactly as typing would',
    fpOf(X.ev), fpOf(Y.ev));
  // A CUSTOM requirement keeps its value on its own object and applyState ignores S.asks for it.
  // Writing S.asks alone lost the change in silence while the review reported it applied.
  chk(name, 'custom', 'a custom requirement’s value actually moves',
    X.ev(`JSON.stringify(itemById('NEW-1').ask)`), JSON.stringify([777000,0,0,0,0,0]));
  chk(name, 'custom', 'and it is stored where a reload will find it',
    X.ev(`JSON.stringify(S.custom.filter(function(c){return c.id==='NEW-1';})[0].ask)`),
    JSON.stringify([777000,0,0,0,0,0]));
  chk(name, 'custom', 'with no stale S.asks entry applyState would ignore',
    X.ev(`(S.asks||{})['NEW-1']===undefined`), true);
  chk(name, 'fidelity', 'the impact statement is char-for-char',
    X.ev(`S.cons['A']`), LONG);
  chk(name, 'fidelity', 'the requirement value keeps every dollar',
    X.ev(`JSON.stringify(itemById('B').ask)`), JSON.stringify([3100000,500000,250000,1000000,0,750000]));
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
  const name = 'handoff — service alignment';
  try {
  const sc = handoffSc();
  // Same services, listed in a different order: remap by NAME, never by position.
  const R = boot(); seed(R.ev, sc); handoffSeed(R.ev, sc);
  R.ev(`window.alert=function(){}; window.confirm=function(){return true;};
    pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
      svc:['USN','USAF','ANG','AFRC','STOVL','USMC-C'],
      items:{A:{asks:[2500000,9500000,2000000,1000000,4000000,1500000]}},
      base:{A:{asks:[2500000,9000000,2000000,1000000,4000000,1500000]}}},'s.json');
    PMOPICK={}; pmoRows().forEach(function(r){ if(r.id==='A'&&r.key==='asks') PMOPICK[pickKey(r)]=true; });
    pmoApply(); 'ok'`);
  chk(name, 'reorder', 'each figure lands on the service it was written for',
    R.ev(`JSON.stringify(itemById('A').ask)`),
    JSON.stringify([9500000,2000000,1000000,4000000,1500000,2500000]));

  // A different SET of services cannot be placed at all. Guessing would be a misallocation that
  // every row total still reconciles -- the exact failure the state-import guard exists for.
  const W = boot(); seed(W.ev, sc); handoffSeed(W.ev, sc);
  const before = W.ev(`JSON.stringify(itemById('A').ask)`);
  W.ev(`window.__a=''; window.alert=function(m){ window.__a=m; };
    pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
      svc:['ARMY','USMC','USCG'], items:{A:{asks:[1,2,3]}}, base:{A:{asks:[0,0,0]}}},'s.json'); 'ok'`);
  chk(name, 'mismatch', 'a submittal for other services is refused',
    W.ev(`/different set of services/.test(window.__a)`) ? 'refused' : 'ACCEPTED', 'refused');
  chk(name, 'mismatch', 'nothing is held for review', W.ev('PMOSUBS.length===0'), true);
  chk(name, 'mismatch', 'and the board is untouched', W.ev(`JSON.stringify(itemById('A').ask)`), before);
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
  const name = 'handoff — the review controls';
  try {
  const sc = handoffSc();

  // ── THE PER-ROW TICK MUST ACTUALLY TICK ─────────────────────────────────────────────────────
  // "Nothing is applied until you tick it" is the whole promise of the review, and it is made by a
  // checkbox. `pmoPick` was renamed `subPick` in a collision rename and this call site was missed:
  // the box drew, the click raised a ReferenceError into a console nobody reads, and the reviewer's
  // only working control was "Tick all". Drive the RENDERED control, not the function behind it --
  // calling subPick() directly is exactly what missed this for a whole release.
  const T = boot(); seed(T.ev, sc); handoffSeed(T.ev, sc);
  T.ev(`window.alert=function(){}; window.confirm=function(){return true;};
    pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
      svc:SVC.slice(), items:{A:{cons:'Depot line stops.'}}, base:{A:{cons:null}}},'s.json');
    subOpenReview(); 'ok'`);
  chk(name, 'tick', 'the review renders a tick box for the proposed change',
    T.ev(`document.querySelectorAll('#subBody input[type=checkbox]').length`), 1);
  const ticked = T.ev(`(function(){
    var b=document.querySelector('#subBody input[type=checkbox]'); if(!b) return 'no box';
    b.checked=true; b.dispatchEvent(new Event('change'));
    return JSON.stringify(Object.keys(PMOPICK).filter(function(k){ return PMOPICK[k]; }));
  })()`);
  // The key carries the submittal it came from, so a tick can never mean two different things
  // once several are held side by side.
  chk(name, 'tick', 'clicking it records the pick', ticked, JSON.stringify(['0|A|cons']));
  T.ev(`pmoApply(); 'ok'`);
  chk(name, 'tick', 'and applying writes only what was ticked',
    T.ev(`S.cons['A']||''`), 'Depot line stops.');

  // ── A REQUIREMENT ADDED IN THE COPY IS NOT SENT, AND THE OFFICE IS TOLD ──────────────────────
  // The package carries FIELDS of requirements the portfolio board already has. One added after the
  // copy was published has no id there, so it could only ever arrive as a row nobody can tick --
  // while the office believed it had submitted it.
  const A = boot(); seed(A.ev, sc); handoffSeed(A.ev, sc);
  const ahtml = A.ev(String.raw`(function(){
    const mode={sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, base:pmoBaseline()};
    return buildSavedHtml().replace(/(<script type="application\/json" id="pubMode">)[\s\S]*?(<\/script>)/,
      function(m,a,b){ return a + JSON.stringify(mode).replace(/</g,'\\u003c') + b; }); })()`);
  const PA = boot({ html: ahtml });
  PA.ev(`try{ localStorage.setItem('prio27who','PMO');
               localStorage.setItem('prio27pmo','PSM'); }catch(e){}
    S.custom.push({id:'PMO-NEW',grp:'PSM',sect:'new',custom:true,title:'Raised by the office',
      event:'e',ccar:'',fy26:SVC.map(function(){return 0;}),
      ask:[250000,0,0,0,0,0],alloc:null});
    S.order.push('PMO-NEW'); S.desc['A']='Rewritten by the office.'; applyState(S); save(); 'ok'`);
  const sent = JSON.parse(PA.ev(`(function(){ var cap=null, msg=''; var _B=window.Blob;
    window.alert=function(m){ msg+=m; };
    window.Blob=function(parts,opts){ cap=parts&&parts[0]; return new _B(parts,opts); };
    try{ pmoSubmit(); }catch(e){} window.Blob=_B;
    return JSON.stringify({pkg:cap, msg:msg}); })()`));
  const pkgA = JSON.parse(sent.pkg || '{}');
  chk(name, 'added', 'a requirement added in the copy is kept out of the package',
    (pkgA.items || {})['PMO-NEW'] === undefined, true);
  chk(name, 'added', 'and the office is told, by name',
    /Raised by the office/.test(sent.msg || '') ? 'named' : 'silent', 'named');
  chk(name, 'added', 'while everything else it edited still goes',
    ((pkgA.items || {})['A'] || {}).desc, 'Rewritten by the office.');

  // ── A PACKAGE WITH NO SERVICE LIST IS NOT READ SILENTLY ──────────────────────────────────────
  // Every submittal this board publishes carries one. A package without it is damaged or hand-made,
  // and its per-service figures would land by position against whatever this board's services are --
  // with every row total still reconciling.
  const N = boot(); seed(N.ev, sc); handoffSeed(N.ev, sc);
  const was = N.ev(`JSON.stringify(itemById('A').ask)`);
  N.ev(`window.__q=''; window.alert=function(){};
    window.confirm=function(m){ window.__q=m; return false; };
    pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
      items:{A:{asks:[1,2,3,4,5,6]}}, base:{A:{asks:[0,0,0,0,0,0]}}},'s.json'); 'ok'`);
  chk(name, 'no list', 'a listless submittal with per-service figures asks first',
    N.ev(`/does not say which services/.test(window.__q)`) ? 'asked' : 'read it anyway', 'asked');
  chk(name, 'no list', 'declining holds nothing for review', N.ev('PMOSUBS.length===0'), true);
  chk(name, 'no list', 'and leaves the board untouched', N.ev(`JSON.stringify(itemById('A').ask)`), was);
  // A listless package that proposes only PROSE has no positional hazard and must not nag. It is
  // scoped, so the only question it could raise is the service one -- which is the point.
  const Q = boot(); seed(Q.ev, sc); handoffSeed(Q.ev, sc);
  Q.ev(`window.__n=0; window.alert=function(){};
    window.confirm=function(){ window.__n++; return true; };
    pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',pmo:'PSM',fromTs:1,
      items:{A:{desc:'Prose only.'}}, base:{A:{desc:null}}},'s.json'); 'ok'`);
  chk(name, 'no list', 'but a prose-only one is not questioned', Q.ev('window.__n'), 0);
  chk(name, 'no list', 'and is held for review', Q.ev('PMOSUBS.length===1'), true);

  // ── A PACKAGE THAT NAMES NO OFFICE IS SAID OUT LOUD ──────────────────────────────────────────
  // Written before submittals carried a scope. Refusing would strand work already done, so it is
  // taken -- but it can reach ANY office's requirements, which makes it the one package that can
  // still collide with another, so it is never taken quietly.
  const U = boot(); seed(U.ev, sc); handoffSeed(U.ev, sc);
  U.ev(`window.__q=''; window.alert=function(){};
    window.confirm=function(m){ window.__q=String(m); return true; };
    pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
      svc:SVC.slice(), items:{A:{desc:'Prose only.'}}, base:{A:{desc:null}}},'s.json'); 'ok'`);
  chk(name, 'unscoped', 'a submittal naming no office asks before it is reviewed',
    U.ev(`/does not say which programme office/.test(window.__q)`) ? 'asked' : 'taken quietly', 'asked');
  chk(name, 'unscoped', 'and saying yes holds it', U.ev('PMOSUBS.length===1'), true);
  const V = boot(); seed(V.ev, sc); handoffSeed(V.ev, sc);
  V.ev(`window.alert=function(){}; window.confirm=function(){ return false; };
    pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
      svc:SVC.slice(), items:{A:{desc:'Prose only.'}}, base:{A:{desc:null}}},'s.json'); 'ok'`);
  chk(name, 'unscoped', 'saying no holds nothing', V.ev('PMOSUBS.length===0'), true);
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
  const name = 'handoff — the copy has its own storage';
  try {
  const sc = handoffSc();
  const { ev } = boot(); seed(ev, sc); handoffSeed(ev, sc);
  ev(`S.cons['A']='PORTFOLIO-V2 — what the copy should show.'; save(); 'ok'`);
  const pub = (ts) => ev(String.raw`(function(){
    const mode={sandbox:true, by:'BLL', ts:` + ts + String.raw`, fy:MS.cur, ap:APPN, base:pmoBaseline()};
    return buildSavedHtml().replace(/(<script type="application\/json" id="pubMode">)[\s\S]*?(<\/script>)/,
      function(m,a,b){ return a + JSON.stringify(mode).replace(/</g,'\\u003c') + b; }); })()`);
  const html = pub('1700000000000');

  // ── STALE STORAGE MUST NOT WIN ───────────────────────────────────────────────────────────────
  // Every copy used to share prio27om with the portfolio board and with every other copy, and the
  // boot restore takes browser storage over the file whenever storage's clock is later. Copies are
  // published days before they are distributed, so an office that had worked in ANY earlier copy
  // opened the new one and saw THAT board's numbers under this copy's banner -- silently, because
  // every total still reconciled -- and would then have submitted the old board's text back as new
  // input, against a baseline it never matched. This is the check that would have caught it.
  const { ev: oe } = boot(); seed(oe, sc); handoffSeed(oe, sc);
  oe(`S.cons['A']='STALE — from a copy they had before.'; MS.ts=Date.now()+86400000; 'ok'`);
  const stale = { [ev('_AP.key')]: oe('JSON.stringify(MS)') };
  const X = openWith(html, stale);
  chk(name, 'stale', 'the copy keeps a separate storage key',
    X.eval('_AP.key') === ev('_AP.key') ? 'SHARED' : 'its own', 'its own');
  chk(name, 'stale', 'and shows what was published, not what the browser had',
    X.eval(`(S.cons||{})['A']`), 'PORTFOLIO-V2 — what the copy should show.');
  chk(name, 'stale', 'so it proposes nothing nobody typed',
    X.eval('JSON.stringify(pmoSubmitBuild())'), '{}');

  // ── THEIR OWN WORK STILL SURVIVES A CLOSED TAB ───────────────────────────────────────────────
  // Isolating the key must not cost the office its afternoon: an impact statement is written over
  // days, not in one sitting, and the copy cannot save to a file.
  const d1 = openWith(html, {});
  d1.eval(`S.cons['A']='Written by the office on day one.'; save(); 'ok'`);
  const d2 = openWith(html, dumpLs(d1));
  chk(name, 'their work', 'reopening restores what they wrote',
    d2.eval(`(S.cons||{})['A']`), 'Written by the office on day one.');
  chk(name, 'their work', 'the published baseline is still the one they started from',
    d2.eval(`(PMODE.base['A']||{}).cons||''`), 'PORTFOLIO-V2 — what the copy should show.');
  chk(name, 'their work', 'and the submittal is exactly what they changed',
    d2.eval('JSON.stringify(pmoSubmitBuild())'),
    JSON.stringify({ A: { cons: 'Written by the office on day one.' } }));

  // Two copies of the same board cannot reach each other's storage either.
  const other = openWith(pub('1800000000000'), dumpLs(d1));
  chk(name, 'their work', 'a different copy does not inherit it',
    other.eval(`(S.cons||{})['A']`), 'PORTFOLIO-V2 — what the copy should show.');
  // ── THE COPY OPENS AS THE BOARD IT WAS PUBLISHED FROM ────────────────────────────────────────
  // The appropriation was read from the reader's OWN browser (prio27appn) before the file had any
  // say, so a copy opened on a machine where somebody had once looked at another drill came up as
  // that appropriation -- an empty board under a full banner, with no error anywhere.
  const drift = openWith(html, Object.assign({ prio27appn: 'OPN' }, {}));
  chk(name, 'appropriation', 'a copy opens as the board it was published from',
    drift.eval('APPN'), ev('APPN'));
  chk(name, 'appropriation', 'with the requirements it was published with',
    drift.eval('S.order.length'), ev('S.order.length'));
  chk(name, 'appropriation', 'and switching inside a copy is refused rather than reloading empty',
    drift.eval(`(function(){ var hit=false; window.alert=function(){ hit=true; };
      try{ switchAppn('opn'); }catch(e){} return hit? 'refused' : 'ALLOWED'; })()`), 'refused');

  // ...and neither does the portfolio board sitting on the same machine.
  const pb = openWith(ev('SRC0'), dumpLs(d1));
  chk(name, 'their work', 'the portfolio board keeps its own key', pb.eval('_AP.key'), ev('_AP.key'));
  chk(name, 'their work', 'and is not a sandbox', String(pb.eval('SANDBOX')), 'false');
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ══ anything that leaves a PMO copy says so ════════════════════════════════════════════════════
// The amber banner is on SCREEN. A workbook mailed on from a copy carried none of it: an 11-sheet
// export off a November copy was indistinguishable from one off the live board this morning -- same
// filename, same title row -- so a superseded cutline could be briefed onward under this board's own
// name. Read the artefact the office would actually circulate, with the board's own reader.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'handoff — an export from a copy says it is one';
  try {
  const sc = base();
  const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
  const html = ev(String.raw`(function(){
    const mode={sandbox:true, by:'BLL', ts:1763078400000, fy:MS.cur, ap:APPN, base:pmoBaseline()};
    return buildSavedHtml().replace(/(<script type="application\/json" id="pubMode">)[\s\S]*?(<\/script>)/,
      function(m,a,b){ return a + JSON.stringify(mode).replace(/</g,'\\u003c') + b; }); })()`);

  // Drive the real export and read what comes out -- the name the file lands under and the title
  // row a reader sees first. Recomputing what the mark "should" say would test the restatement.
  const shot = (w) => w.eval(`(async function(){
    var cap=null,_B=window.Blob,name='';
    window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
    var _c=document.createElement.bind(document);
    document.createElement=function(t){ var e=_c(t);
      if(t==='a') Object.defineProperty(e,'download',{set:function(v){ name=v; },get:function(){ return name; }});
      return e; };
    try{ exportExcel(); }catch(e){ return JSON.stringify({err:String((e&&e.message)||e)}); }
    window.Blob=_B; document.createElement=_c;
    var ab=cap.buffer.slice(cap.byteOffset, cap.byteOffset+cap.byteLength);
    var sh=await xlsxRead(ab); var f=Object.keys(sh)[0];
    return JSON.stringify({name:name, title:String((sh[f][0]||[])[0]||''), sheets:Object.keys(sh).length});
  })()`);

  const L = boot(); seed(L.ev, sc); asBooted(L.ev, sc);
  const live = JSON.parse(await shot(L.w));
  const copy = JSON.parse(await shot(boot({ html }).w));

  chk(name, 'live', 'the live board exports the whole workbook', live.sheets > 1 ? 'full' : 'thin', 'full');
  chk(name, 'live', 'and is NOT marked as a copy',
    /PMO COPY/.test(live.name + live.title) ? 'MARKED' : 'clean', 'clean');

  chk(name, 'copy', 'a copy exports the same workbook', copy.sheets, live.sheets);
  // The filename is what a person sees in Teams and in the mail that forwards it.
  chk(name, 'copy', 'its filename says it came from a copy',
    /\[PMO COPY /.test(copy.name) ? 'marked' : 'bare', 'marked');
  chk(name, 'copy', 'and carries the date it was published',
    /\[PMO COPY 2025-11-14\]/.test(copy.name) ? 'dated' : 'undated', 'dated');
  chk(name, 'copy', 'the extension survives the mark',
    /\.xlsx$/.test(copy.name) ? 'xlsx' : copy.name.slice(-12), 'xlsx');
  // The title row is what a person sees on opening it, and on the printout.
  chk(name, 'copy', 'the title row says it is a snapshot',
    /PMO COPY \(snapshot of 2025-11-14, NOT the current plan\)/.test(copy.title) ? 'said' : 'silent', 'said');
  // THE CAVEAT COMES FIRST. Callers append their own sheet name after the title, so a mark tacked
  // on the end lands mid-line and reads like part of that sheet's name.
  chk(name, 'copy', 'and leads with it rather than burying it',
    copy.title.indexOf('PMO COPY') < 4 ? 'leads' : 'buried at ' + copy.title.indexOf('PMO COPY'), 'leads');
  chk(name, 'copy', 'the board and sheet are still named after it',
    /Prioritization Board/.test(copy.title) && copy.title.length > 60 ? 'named' : 'lost', 'named');

  // A file that already says what it is must not say it twice.
  chk(name, 'no double mark', 'a submittal built in a copy is not re-marked',
    boot({ html }).ev(`expName('ORBIT SUBMITTAL - J Smith - 2026-09-13.json')`),
    'ORBIT SUBMITTAL - J Smith - 2026-09-13.json');
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ══ what is reviewed is what would land ════════════════════════════════════════════════════════
// The review, the spreadsheet and pmoApply() all read the same package, but only pmoApply() put a
// requirement value through the board's rule for one. A package is a JSON file -- a hand edit or a
// damaged transfer is all it takes -- and one carrying a negative and a NaN was REPORTED as
// "USAF $-5,000,000 · AFRC $NaN" and APPLIED as zeroes. The team would have signed off a
// spreadsheet that did not describe the board it produced.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'handoff — the review cannot promise what applying will not do';
  try {
  const sc = base();
  const seedOne = () => { const b = boot(); seed(b.ev, sc); asBooted(b.ev, sc);
    b.ev(`window.__a=''; window.alert=function(m){ window.__a=m; };
          window.confirm=function(){ return true; }; 'ok'`); return b; };

  const { ev } = seedOne();
  ev(`pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
    svc:SVC.slice(), items:{A:{asks:[-5000000, 2000000, 'abc'], ccar:{x:1}}},
    base:{A:{asks:[9000000,2000000,1000000]}}},'s.json'); 'ok'`);
  const shown = ev(`pmoFmtVal('asks', pmoRows().filter(function(r){ return r.key==='asks'; })[0].prop)`);
  chk(name, 'values', 'the review shows the value the board would store',
    shown, 'USAF $0 · ANG $2,000,000 · AFRC $0');
  chk(name, 'values', 'and nothing that is not a number',
    /NaN|-\$/.test(shown) ? 'promised a number it cannot store' : 'clean', 'clean');
  chk(name, 'values', 'a record number arriving as an object is shown as text, not as a shape',
    typeof ev(`pmoRows().filter(function(r){ return r.key==='ccar'; })[0].prop`), 'string');
  ev(`PMOPICK={}; pmoRows().forEach(function(r){ if(r.id==='A'&&r.key==='asks') PMOPICK[pickKey(r)]=true; });
    pmoApply(); 'ok'`);
  chk(name, 'values', 'and applying lands exactly that',
    ev(`JSON.stringify(itemById('A').ask)`), JSON.stringify([0, 2000000, 0]));

  // A vector of the wrong WIDTH is not a value to tidy up -- padding it zeroes a service in silence,
  // which is the positional hazard again wearing a different hat.
  const W = seedOne();
  const before = W.ev(`JSON.stringify(itemById('A').ask)`);
  W.ev(`pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
    svc:SVC.slice(), items:{A:{asks:[1,2]}}, base:{A:{asks:[9000000,2000000,1000000]}}},'s.json'); 'ok'`);
  chk(name, 'width', 'a value with the wrong number of services is refused',
    W.ev(`/wrong number of services/.test(window.__a)`) ? 'refused' : 'ACCEPTED', 'refused');
  chk(name, 'width', 'nothing is held for review', W.ev('PMOSUBS.length===0'), true);
  chk(name, 'width', 'and the board is untouched', W.ev(`JSON.stringify(itemById('A').ask)`), before);
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ══ the change report is the record the team argues from ═══════════════════════════════════════
// "A pre-audit change report ... so that my team and I fully understand and know what updates have
// been made." A byte count proves it downloaded, not that it says anything true. Read it back with
// the board's OWN workbook reader and compare every cell against the review it claims to describe.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'handoff — the change report';
  try {
  const sc = base();
  sc.items.push(it('B', 'ATL', [3000000, 500000, 250000]));
  sc.order.push('B');
  const { ev, w } = boot(); seed(ev, sc); asBooted(ev, sc);
  ev(`S.cons['A']='Our own earlier wording.'; save(); 'ok'`);
  // Three live rows and one for a requirement this board no longer has, one of them ticked, one of
  // them a conflict -- every state the Status and Conflict columns are supposed to tell apart.
  ev(`window.alert=function(){}; window.confirm=function(){return true;};
    pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO Lead',fromTs:1,
      svc:SVC.slice(),
      items:{A:{cons:'Theirs: the depot line stops in March.', asks:[9500000,2000000,1000000]},
             B:{ccar:'JSF7777'}, ZZ:{desc:'from a requirement since removed'}},
      base:{A:{cons:null, asks:[9000000,2000000,1000000]}, B:{ccar:null}, ZZ:{desc:null}}},'s.json');
    PMOPICK={}; pmoRows().forEach(function(r){ if(r.id==='A'&&r.key==='cons') PMOPICK[pickKey(r)]=true; });
    'ok'`);
  const want = JSON.parse(ev(`JSON.stringify(pmoRows().map(function(r){ return [
    (PMO_LBL[r.key]||r.key), String(pmoFmtVal(r.key,r.now)), String(pmoFmtVal(r.key,r.prop)),
    (r.conflict? 'YES — this board changed too':''),
    (r.gone? 'requirement missing' : (PMOPICK[pickKey(r)]? 'ticked to apply':'not applied')),
    r.from + (r.by && r.by!==r.from? ' ('+r.by+')' : '')]; }))`));
  const before = ev(`JSON.stringify({cons:S.cons, asks:S.asks, ccar:S.ccar, desc:S.desc})`);
  const book = JSON.parse(await w.eval(`(async function(){
    var cap=null, _B=window.Blob;
    window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
    try{ pmoReport(); }catch(e){ return JSON.stringify({err:String((e&&e.message)||e)}); }
    window.Blob=_B;
    if(!cap) return JSON.stringify({err:'no workbook bytes'});
    var ab=cap.buffer.slice(cap.byteOffset, cap.byteOffset+cap.byteLength);
    var sh=await xlsxRead(ab);
    return JSON.stringify({sheets:Object.keys(sh), rows:sh[Object.keys(sh)[0]]}); })()`));
  chk(name, 'reads back', 'the report is a workbook this board can read',
    book.err ? 'THREW: ' + book.err : 'read', 'read');
  const rows = book.rows || [];
  chk(name, 'reads back', 'on one named sheet', (book.sheets || []).join(','), 'Proposed changes');
  chk(name, 'says so', 'the title says nothing has been applied',
    /NOTHING BELOW HAS BEEN APPLIED/.test(String(rows[0] && rows[0][0])) ? 'said' : 'silent', 'said');
  chk(name, 'says so', 'and names who sent it',
    /SUBMITTAL FROM PMO Lead/.test(String(rows[0] && rows[0][0])) ? 'named' : 'anonymous', 'named');
  chk(name, 'columns', 'the header is the one the team reads',
    (rows[3] || []).join('|'),
    'Submitted by|Rank|PMO|Requirement|CCaR|Field|On the board now|Proposed|Conflict|Status|Decision / notes');
  // BY NAME, NOT BY POSITION. These read fixed indices until a column was inserted in the middle of
  // the report, and then every one of them failed for the same uninformative reason. A cell is
  // found the way a reader finds it -- under its heading.
  const HDR = (rows[3] || []).map(String);
  const col = h => HDR.indexOf(h);
  ['Submitted by','Rank','PMO','Requirement','CCaR','Field','On the board now','Proposed',
   'Conflict','Status','Decision / notes'].forEach(h =>
    chk(name, 'columns', `it has a "${h}" column`, col(h) >= 0, true));
  // ONE ROW PER PROPOSED CHANGE, in the review's own order. A report that drops or reorders a row
  // is worse than none: the team signs off a list that is not the list.
  const body = rows.slice(4).filter(r => r.length > 1);
  chk(name, 'rows', 'one row per proposed change', body.length, want.length);
  want.forEach((exp, i) => {
    const got = body[i] || [];
    chk(name, 'rows', `row ${i + 1}: the field it is about`, got[col('Field')], exp[0]);
    chk(name, 'rows', `row ${i + 1}: what the board says now`, got[col('On the board now')], exp[1]);
    chk(name, 'rows', `row ${i + 1}: what the office proposes`, got[col('Proposed')], exp[2]);
    chk(name, 'rows', `row ${i + 1}: the conflict column`, got[col('Conflict')] || '', exp[3]);
    chk(name, 'rows', `row ${i + 1}: the status column`, got[col('Status')], exp[4]);
    // WHO SENT IT is the column that makes several submittals reviewable as one list.
    chk(name, 'rows', `row ${i + 1}: who it came from`, got[col('Submitted by')], exp[5]);
  });
  chk(name, 'rows', 'the requirement this board no longer has is labelled',
    /no longer on this board/.test(String((body[body.length - 1] || [])[col('Requirement')]))
      ? 'labelled' : 'unmarked', 'labelled');
  // Left blank on purpose: it is the reviewer's column, and the report is the record they keep.
  chk(name, 'rows', 'the decision column arrives empty for them to fill in',
    body.every(r => String(r[col('Decision / notes')] || '') === '') ? 'empty' : 'pre-filled', 'empty');
  // PRE-audit. A report that changed anything on the way out would be describing a board that no
  // longer exists by the time it is read.
  chk(name, 'pre-audit', 'exporting it applies nothing',
    ev(`JSON.stringify({cons:S.cons, asks:S.asks, ccar:S.ccar, desc:S.desc})`), before);

  // An impact statement runs to thousands of characters. The on-screen review clips at 300 to keep
  // the table readable; the SPREADSHEET is the copy of record and must carry the whole thing.
  const LONG = 'The depot line stops in March 26 and forty aircraft go unsupported. '.repeat(40);
  const L = boot(); seed(L.ev, sc); asBooted(L.ev, sc);
  L.ev(`window.alert=function(){}; window.confirm=function(){return true;};
    pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
      svc:SVC.slice(), items:{A:{cons:${JSON.stringify(LONG)}}}, base:{A:{cons:null}}},'s.json'); 'ok'`);
  const cell = await L.w.eval(`(async function(){
    var cap=null,_B=window.Blob;
    window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
    try{ pmoReport(); }catch(e){ return 'THREW'; } window.Blob=_B;
    var ab=cap.buffer.slice(cap.byteOffset, cap.byteOffset+cap.byteLength);
    var sh=await xlsxRead(ab), rr=sh[Object.keys(sh)[0]];
    var c=(rr[3]||[]).map(String).indexOf('Proposed');
    return String(rr[4][c]||''); })()`);
  chk(name, 'fidelity', 'a long impact statement reaches the spreadsheet whole', cell.length, LONG.length);
  chk(name, 'fidelity', 'char for char', cell === LONG ? 'exact' : 'altered', 'exact');
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ══ appropriation packages: the OTHER path that takes numbers this board did not compute ═══════
// applyStore() is where the service-alignment guard lives, and pkgApply() calls it ONLY for the
// appropriation you are currently viewing. A package for any other one was written straight into
// that appropriation's storage key and its PUBS slot -- the same positional hazard the guard exists
// for, through a door it never watched. Nothing covered pkgApply at all.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'appropriation package — services';
  try {
  const OTHER = 'ff';                                  // a different appropriation on the same board
  const THEIRS = ['USAF', 'ANG', 'AFRC'];              // the services THAT appropriation holds
  // THE BOARD ON SCREEN CARRIES DIFFERENT SERVICES. That is the point of the distinction: two
  // appropriations may legitimately hold different lists, so a package must be checked against the
  // one it is FOR. With both lists the same, checking the wrong one looks identical and the
  // mutation that does so survives -- which is exactly what happened the first time round.
  const ONSCREEN = ['STOVL', 'USMC-C', 'USN'];
  const myBoard = () => ({ services: ONSCREEN,
    items: [it('A', 'PSM', [9000000, 2000000, 1000000])],
    disc: [9000000, 2000000, 1000000], mand: [0, 0, 0], order: ['A'] });

  // A store as the OTHER appropriation already has it, sitting in its own storage key.
  const seedOther = (ev, services) => ev(`(function(){
    const st={base:2027, cur:2027, ts:1,
      dataPack:{services:${JSON.stringify(services)}, items:[{id:'X',grp:'PSM',ask:[1,1,1]}]},
      years:{2027:{order:['X'], alloc:{}, mc:{}, fsrc:{}, custom:[], removed:[],
        discSvc:[100,200,300], mandSvc:[0,0,0], asks:{X:[100,200,300]}}}};
    localStorage.setItem(_SLUGMAP['${OTHER}'].key, JSON.stringify(st));
    return 'ok'; })()`);

  // A package for that appropriation, written against a DIFFERENT ORDER of the same services.
  const pkgFor = (services, vec) => ({
    spmtPkg: 1, ap: OTHER, dir: 'issue', seq: 1, by: 'Manager', ts: Date.now(),
    ms: { base: 2027, cur: 2027, ts: 2,
      dataPack: { services, items: [{ id: 'X', grp: 'PSM', ask: vec }] },
      years: { 2027: { order: ['X'], alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [],
        discSvc: vec.slice(), mandSvc: [0, 0, 0], asks: { X: vec.slice() } } } } });

  const readOther = (ev) => JSON.parse(ev(`(function(){
    const st=JSON.parse(localStorage.getItem(_SLUGMAP['${OTHER}'].key)||'null');
    if(!st) return JSON.stringify(null);
    const y=st.years&&st.years[2027];
    return JSON.stringify({svc:(st.dataPack||{}).services||null,
                           disc:(y||{}).discSvc||null, ask:((y||{}).asks||{}).X||null}); })()`));

  // ── a REORDER must be matched up by name, not taken at face value ────────────────────────────
  {
    const sc = myBoard();
    const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
    chk(name, 'fixture', 'this board is a consolidated one', ev('pkgIsCons()'), true);
    chk(name, 'fixture', 'and carries different services from the one the package is for',
      ev('SVC.join(",")'), ONSCREEN.join(','));
    chk(name, 'fixture', 'and is NOT the appropriation the package is for',
      ev(`mySlug()!=='${OTHER}'`), true);
    seedOther(ev, THEIRS);
    const mine = ev(`JSON.stringify(itemById('A').ask)`);
    // Their list reordered; the figures are in THAT order, so 7 belongs to AFRC and 9 to USAF.
    const pkg = pkgFor(['AFRC', 'USAF', 'ANG'], [7, 9, 8]);
    ev(`window.alert=function(){}; window.confirm=function(){return true;};
        pkgApply(${JSON.stringify(pkg)}, 'pkg.json'); 'ok'`);
    const got = readOther(ev);
    chk(name, 'reorder', 'the package was taken', got ? 'taken' : 'refused', 'taken');
    chk(name, 'reorder', 'its figures land on the services they were written for',
      JSON.stringify((got || {}).disc), JSON.stringify([9, 8, 7]));
    chk(name, 'reorder', 'the requirement value is remapped too',
      JSON.stringify((got || {}).ask), JSON.stringify([9, 8, 7]));
    // The stored state carries its own service list, and that is what names the services when this
    // appropriation is next opened. Left in the sender's order it would undo the remap on reload.
    chk(name, 'reorder', 'and the state it stores says which order it is now in',
      JSON.stringify((got || {}).svc), JSON.stringify(THEIRS));
    chk(name, 'reorder', 'the appropriation on screen is untouched',
      ev(`JSON.stringify(itemById('A').ask)`), mine);
  }

  // ── a DIFFERENT SET of services cannot be placed, and nothing may be written ─────────────────
  {
    const sc = myBoard();
    const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
    seedOther(ev, THEIRS);
    const before = JSON.stringify(readOther(ev));
    const mine = ev(`JSON.stringify(itemById('A').ask)`);
    const pkg = pkgFor(['ARMY', 'USMC', 'USCG'], [1, 2, 3]);
    const said = ev(`(function(){ var m=''; window.alert=function(x){ m+=x; };
      window.confirm=function(){ return true; };
      pkgApply(${JSON.stringify(pkg)}, 'pkg.json'); return m; })()`);
    chk(name, 'mismatch', 'a package for other services is refused',
      /different set of services/.test(said) ? 'refused' : 'ACCEPTED: ' + said.slice(0, 70), 'refused');
    chk(name, 'mismatch', 'and that appropriation is left exactly as it was',
      JSON.stringify(readOther(ev)), before);
    chk(name, 'mismatch', 'the appropriation on screen is untouched too',
      ev(`JSON.stringify(itemById('A').ask)`), mine);
    chk(name, 'mismatch', 'and nothing was put in its publish slot',
      ev(`(function(){ try{ return (typeof PUBS!=='undefined' && PUBS && PUBS['${OTHER}'])? 'written' : 'empty'; }
                       catch(e){ return 'empty'; } })()`), 'empty');
  }

  // ── the same services in the same order: silent, and it lands ────────────────────────────────
  {
    const sc = myBoard();
    const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
    seedOther(ev, THEIRS);
    const pkg = pkgFor(THEIRS.slice(), [11, 22, 33]);
    const said = ev(`(function(){ var m=''; window.alert=function(x){ m+=x; };
      window.confirm=function(){ return true; };
      pkgApply(${JSON.stringify(pkg)}, 'pkg.json'); return m; })()`);
    chk(name, 'match', 'a package that matches is not questioned',
      /different set of services|DIFFERENT ORDER/.test(said) ? 'questioned' : 'silent', 'silent');
    chk(name, 'match', 'and its figures land unchanged',
      JSON.stringify((readOther(ev) || {}).disc), JSON.stringify([11, 22, 33]));
  }
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ══ the change journal is the safety net, and nothing tested it ════════════════════════════════
// pmoApply()'s confirmation says, in as many words: "Each one is recorded in the change journal, so
// it can be found and undone later." That sentence is the recourse when a programme office's
// proposal is accepted in error, and it was covered by nothing at all.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'the change journal';
  try {
  const sc = base();
  sc.items.push(it('B', 'ATL', [3000000, 500000, 250000]));
  sc.order.push('B');

  // ── A HAND EDIT IS RECORDED, AND PUTTING IT BACK RESTORES EXACTLY WHAT WAS THERE ─────────────
  {
    const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
    ev(`try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
        S.desc['A']='What the board said first.'; save(); 'ok'`);
    const before = ev(`JSON.stringify({desc:S.desc, ccar:S.ccar, asks:S.asks})`);
    const n0 = +ev('(MS.jrnl||[]).length');
    // jrnlSync() re-takes the shadow WITHOUT writing entries; jrnlCapture() is what diffs the
    // shadow against now and records. Calling sync twice records nothing at all -- which the first
    // version of this check did, and then read somebody else's entry as its own.
    ev(`jrnlSync(); S.desc['A']='Rewritten.'; jrnlCapture(); save(); 'ok'`);
    chk(name, 'record', 'the change is journalled', +ev('(MS.jrnl||[]).length') > n0 ? 'recorded' : 'silent', 'recorded');
    const e = JSON.parse(ev(`JSON.stringify((MS.jrnl||[])[(MS.jrnl||[]).length-1])`));
    chk(name, 'record', 'with the path it changed', JSON.stringify(e.p), JSON.stringify(['desc', 'A']));
    chk(name, 'record', 'the value before', e.a, 'What the board said first.');
    chk(name, 'record', 'and the value after', e.b, 'Rewritten.');
    chk(name, 'record', 'and it is marked as something that can be put back',
      ev(`jrnlUndoable((MS.jrnl||[])[(MS.jrnl||[]).length-1])`), true);

    const idx = +ev('(MS.jrnl||[]).length') - 1;
    ev(`window.confirm=function(){return true;}; jrnlUndo(${idx}); 'ok'`);
    chk(name, 'undo', 'undoing restores exactly what was there',
      ev(`JSON.stringify({desc:S.desc, ccar:S.ccar, asks:S.asks})`), before);
    // BOTH ENTRIES MUST STAND. Capturing the revert as an ordinary diff folded it into the original
    // entry and then dropped that entry as a no-op, which erased the very change being reverted.
    chk(name, 'undo', 'and the reversal is itself journalled',
      +ev('(MS.jrnl||[]).length') > idx + 1 ? 'recorded' : 'lost', 'recorded');
    chk(name, 'undo', 'the change it reversed still stands',
      ev(`JSON.stringify(((MS.jrnl||[])[${idx}]||{}).p)`), JSON.stringify(['desc', 'A']));
    chk(name, 'undo', 'and the reversal is marked as one',
      ev(`!!((MS.jrnl||[])[${idx + 1}]||{}).f`), true);
  }

  // ── A VALUE TOO LARGE TO RECORD IS NOT UNDOABLE, AND SAYS SO ─────────────────────────────────
  // JRNL_BIG caps a journalled value at 300 characters and stores a SIZE in its place. An impact
  // statement runs well past that. Restoring one from the journal would put back a placeholder --
  // silent data loss on the one field the whole PMO workflow exists to collect -- so the entry must
  // refuse to be undone rather than half-succeed.
  {
    const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
    const LONG = 'The depot line stops in March and forty aircraft go unsupported. '.repeat(9);
    chk(name, 'big values', 'the fixture is genuinely past the cap', LONG.length > 300, true);
    ev(`try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
        jrnlSync(); S.cons['A']=${JSON.stringify(LONG)}; jrnlCapture(); save(); 'ok'`);
    const last = +ev('(MS.jrnl||[]).length') - 1;
    chk(name, 'big values', 'it is journalled as a size, not as the text',
      ev(`typeof ((MS.jrnl||[])[${last}]||{}).b === 'object'`), true);
    chk(name, 'big values', 'and the entry refuses to be undone',
      ev(`jrnlUndoable((MS.jrnl||[])[${last}])`), false);
    const held = ev(`S.cons['A']`);
    const said = ev(`(function(){ var m=''; setStat=function(x){ m+=x; };
      window.confirm=function(){ return true; }; jrnlUndo(${last}); return m; })()`);
    chk(name, 'big values', 'it says why rather than putting back a placeholder',
      /cannot be put back/.test(said) ? 'said' : 'silent: ' + said.slice(0, 60), 'said');
    chk(name, 'big values', 'and the statement is still there, whole',
      ev(`S.cons['A']`), held);
  }

  // ── THE PROMISE pmoApply MAKES: an accepted proposal can be found and undone ─────────────────
  {
    const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
    ev(`try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
        S.ccar['B']='CC-ORIGINAL'; save(); 'ok'`);
    const before = ev(`JSON.stringify({ccar:S.ccar, asks:S.asks})`);
    ev(`window.alert=function(){}; window.confirm=function(){return true;};
        pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
          svc:SVC.slice(), items:{B:{ccar:'CC-FROM-PMO'}}, base:{B:{ccar:'CC-ORIGINAL'}}},'s.json');
        PMOPICK={}; pmoRows().forEach(function(r){ if(r.id==='B'&&r.key==='ccar') PMOPICK[pickKey(r)]=true; });
        pmoApply(); 'ok'`);
    chk(name, 'a PMO change', 'it applied', ev(`S.ccar['B']`), 'CC-FROM-PMO');
    const idx = +ev(`(function(){ const j=MS.jrnl||[];
      for(let i=j.length-1;i>=0;i--){ const e=j[i];
        if(e&&Array.isArray(e.p)&&e.p[0]==='ccar'&&e.p[1]==='B') return i; } return -1; })()`);
    chk(name, 'a PMO change', 'and it is in the journal, by path', idx >= 0 ? 'found' : 'NOT FOUND', 'found');
    if (idx >= 0) {
      chk(name, 'a PMO change', 'it can be put back', ev(`jrnlUndoable((MS.jrnl||[])[${idx}])`), true);
      ev(`window.confirm=function(){return true;}; jrnlUndo(${idx}); 'ok'`);
      chk(name, 'a PMO change', 'and undoing it leaves the board as it was',
        ev(`JSON.stringify({ccar:S.ccar, asks:S.asks})`), before);
    }
  }
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ══ A SUBMITTAL CARRIES ONE OFFICE'S REQUIREMENTS, AND SEVERAL ARE REVIEWED TOGETHER ══════════
// One office at a time meant a pass and a spreadsheet per office, with no view of the round. Several
// can be held side by side only because each is SCOPED: an office may propose changes to the
// requirements it OWNS (grpOf) and to nothing else, so two packages can never contest one field.
// That is the property the whole feature rests on, so it is checked from both ends -- the copy must
// refuse to SEND another office's row, and the board must refuse to REVIEW one that arrives anyway.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'scoped submittals';
  try {
  const sc = { services: MINE,
    items: [it('A', 'AV', [900, 200, 100]), it('B', 'AV', [400, 100, 50]),
            it('C', 'PSM', [300, 80, 40]),  it('D', 'MxS', [200, 50, 25])],
    disc: [2000, 600, 300], mand: [500, 150, 80], order: ['A', 'B', 'C', 'D'] };
  const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);

  const html = ev(String.raw`(function(){
    const mode={sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, base:pmoBaseline()};
    return buildSavedHtml().replace(/(<script type="application\/json" id="pubMode">)[\s\S]*?(<\/script>)/,
      function(m,a,b){ return a + JSON.stringify(mode).replace(/</g,'\\u003c') + b; }); })()`);

  // One office works in the copy and submits. The copy is re-seeded because a published file
  // carries the board's baked DATA, not this fixture's items.
  const submitAs = (pmo, who, edits) => {
    const P = boot({ html });
    seed(P.ev, sc); asBooted(P.ev, sc);
    P.ev(`PMODE.base=pmoBaseline();
          try{ localStorage.setItem('prio27who','${who}'); localStorage.setItem('prio27pmo','${pmo}'); }catch(e){}
          ${edits}; 'ok'`);
    return JSON.parse(P.ev(`(function(){
      let cap=null; const _B=window.Blob;
      window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
      globalThis.__al=[]; const _a=window.alert; window.alert=function(m){ globalThis.__al.push(String(m)); };
      try{ pmoSubmit(); }catch(e){} window.Blob=_B; window.alert=_a;
      return JSON.stringify({pkg: cap? JSON.parse(cap) : null, alerts: globalThis.__al});
    })()`));
  };

  // ── FROM THE COPY: another office's row never leaves ──────────────────────────────────────
  const av = submitAs('AV', 'J. Smith',
    `setDesc('A','AV on its own row'); setDesc('C','AV on a PSM row'); setAsk('B',0,'450')`);
  chk(name, 'submit', 'the package is built', av.pkg ? 'built' : 'nothing', 'built');
  if (av.pkg) {
    chk(name, 'submit', 'it names the office it is from', av.pkg.pmo, 'AV');
    chk(name, 'submit', 'it carries that office’s requirements',
      Object.keys(av.pkg.items).sort().join(','), 'A,B');
    chk(name, 'submit', 'and not another office’s, however hard they were edited',
      Object.keys(av.pkg.items).indexOf('C') >= 0 ? 'C went too' : 'C stayed behind', 'C stayed behind');
    // SILENTLY DROPPING IT IS THE WORSE BUG: the office would believe it had submitted something.
    const told = av.alerts.filter(a => /another programme office/.test(a))[0] || '';
    chk(name, 'submit', 'the office is told, while it is still sitting there', told ? 'told' : 'silent', 'told');
    chk(name, 'submit', 'and the message names the row it dropped', /PSM/.test(told), true);
  }
  const psm = submitAs('PSM', 'R. Jones', `setDesc('C','PSM on its own row'); setCons('C','slips a year')`);
  chk(name, 'submit', 'a second office scopes to its own rows too',
    psm.pkg ? psm.pkg.pmo + ':' + Object.keys(psm.pkg.items).join(',') : 'nothing', 'PSM:C');

  // ── AT THE BOARD: both are held at once, each row tagged with where it came from ──────────
  ev(`window.alert=function(){};
      pmoTake(${JSON.stringify(av.pkg)}, 'av.json');
      pmoTake(${JSON.stringify(psm.pkg)}, 'psm.json'); 'ok'`);
  const held = JSON.parse(ev(`(function(){
    return JSON.stringify({ n:PMOSUBS.length, from:PMOSUBS.map(subFrom),
      rows:pmoRows().map(function(r){ return r.from+'|'+r.id+'|'+r.key; }) }); })()`));
  chk(name, 'review', 'both submittals are held at once', held.n, 2);
  chk(name, 'review', 'each by its office', held.from.join(','), 'AV,PSM');
  chk(name, 'review', 'every proposed field is on the list',
    held.rows.slice().sort().join(' '), 'AV|A|desc AV|B|asks PSM|C|cons PSM|C|desc');
  chk(name, 'review', 'and no field is offered twice',
    held.rows.length, held.rows.map(r => r.split('|').slice(1).join('|'))
      .filter((v, i, a) => a.indexOf(v) === i).length);

  // ── A SECOND ROUND FROM ONE OFFICE REPLACES THE FIRST ─────────────────────────────────────
  // Two rounds from one office held side by side would offer the same field twice with different
  // answers, which is exactly the arbitration the scope exists to avoid.
  ev(`window.alert=function(){}; pmoTake(${JSON.stringify(av.pkg)}, 'av-again.json'); 'ok'`);
  chk(name, 'review', 'a second package from the same office replaces the first',
    Number(ev('PMOSUBS.length')), 2);

  // ── OUT-OF-SCOPE ROWS ARE REFUSED AT THE DOOR TOO ─────────────────────────────────────────
  // The copy drops them, but the package is a JSON file: a hand edit or an older build is all it
  // takes. The board does not trust the sender to have done it.
  const forged = JSON.parse(JSON.stringify(av.pkg));
  forged.items['C'] = { desc: 'AV reaching into PSM by hand' };
  ev(`window.alert=function(){}; PMOSUBS=[]; PMOPICK={};
      pmoTake(${JSON.stringify(forged)}, 'forged.json'); 'ok'`);
  const kept = JSON.parse(ev('JSON.stringify(Object.keys((PMOSUBS[0]||{}).items||{}).sort())'));
  chk(name, 'review', 'a row the sending office does not own is dropped on import',
    kept.join(','), 'A,B');

  // ── APPLYING ACROSS BOTH, IN ONE PASS ─────────────────────────────────────────────────────
  ev(`window.alert=function(){}; window.confirm=function(){ return true; };
      PMOSUBS=[]; PMOPICK={};
      pmoTake(${JSON.stringify(av.pkg)}, 'av.json');
      pmoTake(${JSON.stringify(psm.pkg)}, 'psm.json');
      subPickAll(true); pmoApply(); 'ok'`);
  const after = JSON.parse(ev(`(function(){ return JSON.stringify({
    descA:(S.desc||{}).A||'', descC:(S.desc||{}).C||'', consC:(S.cons||{}).C||'',
    askB:(S.asks||{}).B||null, left:pmoRows().length, stillHeld:PMOSUBS.length }); })()`));
  chk(name, 'apply', 'the first office’s change lands', after.descA, 'AV on its own row');
  chk(name, 'apply', 'the second office’s change lands', after.descC, 'PSM on its own row');
  chk(name, 'apply', 'and its impact statement too', after.consC, 'slips a year');
  chk(name, 'apply', 'a requirement value lands through the board’s own rule',
    Array.isArray(after.askB) ? after.askB[0] : 'not a vector', 450);
  // WHAT WAS APPLIED DROPS OFF; WHAT WAS NOT STAYS. Clearing the packages on apply would throw
  // away every untaken proposal the moment the first batch went in.
  chk(name, 'apply', 'nothing is left proposing what the board now says', after.left, 0);
  chk(name, 'apply', 'and the packages are still held rather than discarded', after.stillHeld, 2);
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ═══ A COPY PROPOSES A NEW REQUIREMENT ═══════════════════════════════════════════════════════
// BACKLOG entry 1. A requirement added on a PMO copy travels back WHOLE, flagged as new, for the
// portfolio team to accept or decline; the office cannot send it until every mandatory field is
// filled; on accept it is created the way addReq() creates one, at the bottom of the consolidated
// listing, with the office's own ask values; and the same submittal imported twice cannot add it
// twice. Each of those is a way to lose or double a requirement, so each is asserted.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'a copy proposes a new requirement';
  try {
  const sc = { services: MINE,
    items: [it('A', 'AV', [900, 200, 100]), it('C', 'PSM', [300, 80, 40])],
    disc: [2000, 600, 300], mand: [500, 150, 80], order: ['A', 'C'] };
  const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
  const html = ev(String.raw`(function(){
    const mode={sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, base:pmoBaseline()};
    return buildSavedHtml().replace(/(<script type="application\/json" id="pubMode">)[\s\S]*?(<\/script>)/,
      function(m,a,b){ return a + JSON.stringify(mode).replace(/</g,'\\u003c') + b; }); })()`);
  const P = boot({ html });
  seed(P.ev, sc); asBooted(P.ev, sc);
  P.ev(`PMODE.base=pmoBaseline();
        try{ localStorage.setItem('prio27who','R. Jones'); localStorage.setItem('prio27pmo','PSM'); }catch(e){}
        'ok'`);
  const submit = () => JSON.parse(P.ev(`(function(){
    let cap=null; const _B=window.Blob;
    window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
    globalThis.__al=[]; const _a=window.alert; window.alert=function(m){ globalThis.__al.push(String(m)); };
    try{ pmoSubmit(); }catch(e){ globalThis.__al.push('THREW '+e.message); } window.Blob=_B; window.alert=_a;
    return JSON.stringify({pkg: cap? JSON.parse(cap) : null, alerts: globalThis.__al});
  })()`));

  // ── ADDED ON THE COPY, THROUGH THE PANEL ─────────────────────────────────────────────────
  P.ev(`syncAddPanel(); syncNaGrp();
        document.getElementById('naGrp').value='PSM';
        document.getElementById('naTitle').value='Depot tooling for the new line';
        document.getElementById('naEvent').value='tooling buy';
        document.getElementById('naSvc0').value='250000'; document.getElementById('naSvc1').value='50000';
        document.getElementById('naSvc2').value='0';
        addReq(); 'ok'`);
  const nid = P.ev(`(S.custom[S.custom.length-1]||{}).id||''`);
  chk(name, 'add', 'the id carries the office, so two offices cannot mint the same one', nid, 'NEW-PSM-1');
  chk(name, 'add', 'and it lands at the bottom of the copy’s order', P.ev(`S.order[S.order.length-1]`), nid);
  chk(name, 'add', 'the panel says it is a proposal',
    /PROPOSAL/.test(P.ev(`document.getElementById('naProposeHint').textContent`)), true);

  // ── THE GATE: nothing goes until every mandatory field is filled ─────────────────────────
  // Something else is edited too, so the package has a reason to exist without the proposal.
  P.ev(`setDesc('C','PSM rewrote this.'); 'ok'`);
  const r1 = submit();
  chk(name, 'gate', 'an incomplete proposal is withheld',
    ((r1.pkg && r1.pkg.added) || []).length, 0);
  chk(name, 'gate', 'while everything else the office edited still goes',
    (((r1.pkg || {}).items || {}).C || {}).desc, 'PSM rewrote this.');
  const told = r1.alerts.filter(a => /missing mandatory fields/.test(a))[0] || '';
  chk(name, 'gate', 'the office is told which proposal, by name', /Depot tooling/.test(told), true);
  chk(name, 'gate', 'and what it is missing, by field', /Description/.test(told) && /Impact/.test(told), true);
  chk(name, 'gate', 'and that the rest was sent', /still being sent/.test(told), true);
  const pf = JSON.parse(P.ev(`JSON.stringify(preflight().find.filter(function(f){ return f.k==='newreq'; }))`));
  chk(name, 'gate', 'pre-flight shows the same gate', pf.length, 1);
  chk(name, 'gate', 'as a block, naming the proposal',
    pf.length ? pf[0].sev + ':' + /Depot tooling/.test(pf[0].rows[0].label) : 'no finding', 'block:true');
  // Fill the mandatory set. The OGC fields come into play the moment it routes to a government
  // activity, and a second hop is required because it is not a prime.
  P.ev(`setDesc('${nid}','Tooling the line cannot run without.');
        setCons('${nid}','No second shift until it lands.');
        setObCat('${nid}', OB_CATS[0]);
        S.ptype['${nid}']='OGC';
        setDest('${nid}','to','pax'); 'ok'`);
  const g1 = JSON.parse(P.ev(`JSON.stringify(pmoProposalGate('${nid}'))`));
  chk(name, 'gate', 'routed to a government activity, it now needs the second hop and a MIPR type',
    g1.indexOf('Which awards to') >= 0 && g1.indexOf('MIPR type') >= 0, true);
  P.ev(`setDest('${nid}','end','dla'); setMipr('${nid}','direct');
        wbsStore('req','${nid}',null,[{w:'1.2.3', v:[]}]);
        setAwdDate('${nid}', FYMON[3][0]); 'ok'`);
  chk(name, 'gate', 'with every mandatory field filled the gate is clear',
    P.ev(`JSON.stringify(pmoProposalGate('${nid}'))`), '[]');
  chk(name, 'gate', 'and pre-flight no longer blocks',
    Number(P.ev(`preflight().find.filter(function(f){ return f.k==='newreq'; }).length`)), 0);
  const ob = P.ev('OB_CATS[0]'), fm = P.ev('FYMON[3][0]');

  // ── IT TRAVELS WHOLE, IN ITS OWN SECTION ──────────────────────────────────────────────────
  // A second added row, for another office: it must not travel, however complete.
  P.ev(`document.getElementById('naGrp').value='AV';
        document.getElementById('naTitle').value='Not ours to send';
        document.getElementById('naSvc0').value='1000'; addReq(); 'ok'`);
  const r2 = submit();
  chk(name, 'travel', 'the package is built', r2.pkg ? 'built' : 'refused: ' + r2.alerts.join(' | ').slice(0, 160), 'built');
  const added = (r2.pkg && r2.pkg.added) || [];
  chk(name, 'travel', 'it carries the proposal in its own section', added.length, 1);
  chk(name, 'travel', 'whole, under its provisional id', added[0] && added[0].nid, nid);
  chk(name, 'travel', 'with the office’s ask by service', JSON.stringify(added[0] && added[0].ask), JSON.stringify([250000, 50000, 0]));
  chk(name, 'travel', 'and every field that was filled',
    added[0] && [added[0].desc, added[0].mipr, added[0].obCat, added[0].dest.to, added[0].dest.end, added[0].awards && added[0].awards.d].join('|'),
    ['Tooling the line cannot run without.', 'direct', ob, 'pax', 'dla', fm].join('|'));
  chk(name, 'travel', 'not as field deltas as well',
    Object.keys((r2.pkg && r2.pkg.items) || {}).indexOf(nid) >= 0 ? 'also in items' : 'only in added', 'only in added');
  chk(name, 'travel', 'another office’s added row stays behind', added.some(a => a.grp === 'AV') ? 'AV went too' : 'AV stayed', 'AV stayed');
  chk(name, 'travel', 'and the office is told', /another programme office/.test(r2.alerts.join(' ')), true);

  // ── AT THE BOARD: one row, accepted whole ────────────────────────────────────────────────
  ev(`window.alert=function(){}; pmoTake(${JSON.stringify(r2.pkg)}, 'psm.json'); 'ok'`);
  const rows = JSON.parse(ev(`JSON.stringify(pmoRows().map(function(r){ return {id:r.id, key:r.key, isNew:!!r.isNew, taken:r.taken||null}; }))`));
  chk(name, 'review', 'the proposal is offered as one row', rows.filter(r => r.isNew).length, 1);
  chk(name, 'review', 'not yet taken', (rows.filter(r => r.isNew)[0] || {}).taken, null);
  chk(name, 'review', 'the change report carries it',
    ev(`(function(){ var n=0; var _c=URL.createObjectURL;
        URL.createObjectURL=function(b){ n=(b&&(b.size||b.length))||1; return 'blob:x'; };
        pmoReport(); URL.createObjectURL=_c; return n>500? 'built':'empty'; })()`), 'built');
  const before = Number(ev(`S.custom.length`));
  // applyState() seeds the per-office rankings from the items, and seed() pushes the fixture's items
  // AFTER it -- so in this harness they are empty and the accepted requirement would rebuild FIRST in
  // its office. Seed them the way the board does, or the office-order check tests the harness.
  ev(`S.pmoOrder={}; GROUPS.forEach(function(g){
        S.pmoOrder[g]=S.order.filter(function(id){ const i=itemById(id); return i&&grpOf(i)===g; }); });
      subPickAll(true); pmoApply(); 'ok'`);
  const after = JSON.parse(ev(`(function(){
    var c=S.custom[S.custom.length-1]||{};
    return JSON.stringify({ n:S.custom.length, id:c.id, title:c.title, ask:c.ask, from:c.from||null,
      last:S.order[S.order.length-1], pmoLast:(S.pmoOrder.PSM||[]).slice(-1)[0],
      desc:S.desc[c.id]||'', mipr:(S.mipr||{})[c.id]||'', dest:(S.dest||{})[c.id]||null,
      award:((S.awards||{})[c.id]||{}).d||'' }); })()`));
  chk(name, 'accept', 'accepting creates the requirement', after.n, before + 1);
  chk(name, 'accept', 'under this board’s own numbering', after.id, 'NEW-1');
  chk(name, 'accept', 'with the title the office gave it', after.title, 'Depot tooling for the new line');
  chk(name, 'accept', 'and the office’s ask values, kept', JSON.stringify(after.ask), JSON.stringify([250000, 50000, 0]));
  chk(name, 'accept', 'at the bottom of the consolidated listing, for the SFWG to place', after.last, 'NEW-1');
  chk(name, 'accept', 'and last within its own office', after.pmoLast, 'NEW-1');
  chk(name, 'accept', 'every field the proposal carried is on it',
    [after.desc, after.mipr, after.dest && after.dest.to, after.dest && after.dest.end, after.award].join('|'),
    ['Tooling the line cannot run without.', 'direct', 'pax', 'dla', fm].join('|'));
  chk(name, 'accept', 'with provenance: which office proposed it, under which provisional id',
    after.from && after.from.pmo + '/' + after.from.nid, 'PSM/' + nid);
  // THE SAME SUBMITTAL, IMPORTED AGAIN, CANNOT ADD IT TWICE.
  ev(`pmoTake(${JSON.stringify(r2.pkg)}, 'psm-again.json'); 'ok'`);
  const again = JSON.parse(ev(`JSON.stringify(pmoRows().filter(function(r){ return r.isNew; }).map(function(r){ return r.taken||null; }))`));
  chk(name, 'twice', 'a re-imported proposal shows as already added', again.join(','), 'NEW-1');
  ev(`subPickAll(true); PMOPICK['0|${nid}|__new']=true; window.confirm=function(){ return true; }; pmoApply(); 'ok'`);
  chk(name, 'twice', 'and cannot be added a second time however it is ticked', Number(ev(`S.custom.length`)), before + 1);

  // ── SCOPE AT THE DOOR: a proposal for another office is dropped on import ─────────────────
  const foreignPkg = Object.assign({}, r2.pkg, { pmo: 'AV', items: {}, added: [Object.assign({}, added[0], { grp: 'PSM', nid: 'NEW-PSM-9' })] });
  const drop = ev(`(function(){ var m=''; window.alert=function(x){ m+=String(x); }; PMOSUBS.length=0;
    pmoTake(${JSON.stringify(foreignPkg)}, 'av.json'); return (PMOSUBS.length? 'held' : 'refused')+' '+(/another office owns/.test(m)? 'said' : 'silent'); })()`);
  chk(name, 'scope', 'a proposal for an office the package is not from is refused, and said', drop, 'refused said');
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ═══ THE BAE LIST IS ONE LIST FOR THE WHOLE BOARD (v1.83) ═════════════════════════════════════
// It used to sit inside the open appropriation's store, so a list imported on O&M was absent on
// Full Fund, Spares and OPN. Now it is its own store, written into the saved file beside the
// appropriations -- and a board saved the OLD way, with its list inside one appropriation's store,
// must still find it from any appropriation, without a re-import.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'the BAE list — one list, every appropriation';
  try {
  const sc = handoffSc();
  const { ev } = boot(); seed(ev, sc);
  const NAMES = ['USAF O&M - ANG CAM Discretionary AV', 'USMC STOVL APN Full Fund SUPT OTHER ILS Discretionary PSM',
                 'USMC STOVL APN Spares Initial Discretionary PP'];
  ev(`BUDDB={ts:1700000000005, files:[], rows:${JSON.stringify(NAMES)}.map(budParseName)}; _budRegCache=null; save(); 'ok'`);
  const html = ev('buildSavedHtml()');
  const pub = JSON.parse(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/.exec(html)[1]);
  chk(name, 'saved file', 'the list is written beside the appropriations', (pub.budDb && pub.budDb.rows || []).length, 3);
  chk(name, 'saved file', 'and not inside any one of them',
    Object.keys(pub.appns || {}).filter(k => pub.appns[k] && pub.appns[k].budgets).length, 0);
  const R = boot({ html });
  chk(name, 'reopened', 'the reopened board holds the whole list', R.ev('budReg().length'), 3);
  chk(name, 'reopened', 'names exactly as imported', R.ev(`JSON.stringify(budReg().map(function(b){ return b.n; }))`), JSON.stringify(NAMES));
  // THE OLD LAYOUT: no board-wide store, the list inside the FULL FUND appropriation's store --
  // opened as O&M, which is the appropriation switch that used to lose it.
  pub.budDb = { ts: 0, rows: [], files: [] };
  const om = Object.keys(pub.appns || {})[0];
  pub.appns.ff = Object.assign({}, pub.appns[om], { budgets: { ts: 1700000000006, files: [], rows: NAMES.map(n => ({ n })) } });
  const old = html.replace(/(<script type="application\/json" id="pubState">)[\s\S]*?(<\/script>)/,
    (m, a, b) => a + JSON.stringify(pub).replace(/</g, '\\u003c') + b);
  const O = boot({ html: old });
  chk(name, 'old layout', 'a list saved inside another appropriation is found from this one', O.ev('budReg().length'), 3);
  chk(name, 'old layout', 'and read by today’s rules', O.ev(`JSON.stringify(budReg().map(function(b){ return b.ap; }))`), '["om","ff","sp"]');
  } catch (e) {
    const msg = String((e && e.message) || e).split('\n')[0].slice(0, 140);
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + msg, got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ═══ v1.84 — THE COPY DOES THE LEGWORK ═══════════════════════════════════════════════════════
// Brad, 24 Sep 2026: offices add requirements, rank within their own office, and edit every field on a
// requirement except the discretionary and mandatory allocation, and send it all back. Each field is
// set in a real published copy, carried by a real submittal, reviewed and applied on the board; the
// allocation is proved untouched at every step, and an old copy is proved to send only the old set.
const v184Sc = () => ({ services: MINE,
  items: [it('A', 'AV', [900, 200, 100]), it('B', 'AV', [400, 100, 50]),
          it('C', 'PSM', [300, 80, 40]),  it('D', 'AV', [200, 50, 25])],
  disc: [2000, 600, 300], mand: [500, 150, 80], order: ['A', 'B', 'C', 'D'] });
const v184Board = () => {
  const B = boot(); seed(B.ev, v184Sc()); asBooted(B.ev, v184Sc());
  B.ev(`applyState(S); save(); 'ok'`);
  return B;
};
// publish through the real menu path, capturing the file it would have saved
const v184Publish = (ev) => ev(`(function(){ let cap=null; const _B=window.Blob;
  window.Blob=function(pt,o){ if(!cap && o && o.type==='text/html') cap=String(pt[0]); return new _B(pt,o); };
  window.confirm=function(){ return true; }; try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
  try{ publishPmoCopy(); }catch(e){} window.Blob=_B; return cap||''; })()`);
const v184Submit = (P, pmo) => JSON.parse(P.ev(`(function(){
  try{ localStorage.setItem('prio27who','J. Smith'); localStorage.setItem('prio27pmo','${pmo}'); }catch(e){}
  let cap=null; const _B=window.Blob;
  window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
  globalThis.__al=[]; const _a=window.alert; window.alert=function(m){ globalThis.__al.push(String(m)); };
  try{ pmoSubmit(); }catch(e){ globalThis.__al.push('THREW '+e.message); } window.Blob=_B; window.alert=_a;
  return JSON.stringify({pkg: cap? JSON.parse(cap) : null, alerts: globalThis.__al}); })()`));
const MONEY = `JSON.stringify({alloc:S.alloc||{}, fsrc:S.fsrc||{}, order:S.order})`;
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.84 — the copy sends every field but the allocation';
  try {
  const { ev } = v184Board();
  // THE BOARD ALREADY HOLDS VALUES IN THE NEW FIELDS. A copy that sent them back unedited would offer
  // every one of them as a proposal nobody wrote.
  const BANDS = JSON.parse(ev(`(function(){ S.band.B=BANDS_LIST()[1].id; S.awards.B={mode:'single', d:'2026-11', day:5};
    if(!S.costElem) S.costElem={}; S.costElem.C='Fixed JPO Support'; save();
    return JSON.stringify(BANDS_LIST().map(function(b){ return b.id; })); })()`));
  const html = v184Publish(ev);
  chk(name, 'publish', 'the copy is written', html.length > 1000, true);
  const P = boot({ html });
  chk(name, 'publish', 'it says which field set it was published with', P.ev('PMODE.pv'), 2);
  chk(name, 'publish', 'and carries the office rankings as they stood', P.ev(`(PMODE.ord.AV||[]).join(',')`), 'A,B,D');
  // cleared and unticked are "absent", not a change: a {} budget and a false star send nothing
  const P0 = boot({ html });
  P0.ev(`S.budgetAsg=S.budgetAsg||{}; S.budgetAsg.B={}; S.mc=S.mc||{}; S.mc.D=false; save(); 'ok'`);
  const quiet = v184Submit(P0, 'AV');
  chk(name, 'untouched copy', 'sends nothing', quiet.pkg ? 'sent' : 'nothing', 'nothing');
  chk(name, 'untouched copy', 'and says so', quiet.alerts.some(a => /Nothing to send yet/.test(a)), true);

  // EVERY FIELD, EDITED IN THE COPY THE WAY THE PANELS WRITE IT
  const moneyBefore = P.ev(MONEY);
  P.ev(`(function(){
    S.titles.A='A renamed'; S.band.A='${BANDS[2]}'; if(!S.mc) S.mc={}; S.mc.A=true;
    if(!S.ptype) S.ptype={}; S.ptype.A='OGC'; if(!S.obCat) S.obCat={}; S.obCat.A='DESA Contract';
    if(!S.wbs) S.wbs={}; S.wbs.A=[{w:'1.2.3'}]; if(!S.rcnAsg) S.rcnAsg={}; S.rcnAsg.A='r1';
    if(!S.rcnSvc) S.rcnSvc={}; S.rcnSvc.A={USAF:'r1'}; if(!S.si) S.si={}; S.si.A='LA';
    if(!S.dest) S.dest={}; S.dest.A={to:'lm', end:''}; if(!S.costElem) S.costElem={}; S.costElem.A='Airframe PGSE';
    if(!S.budgetAsg) S.budgetAsg={}; S.budgetAsg.A={'USAF|disc':'USAF O&M - CAM Discretionary AV'};
    S.awards.A={mode:'single', d:'2026-12', day:9}; if(!S.crHalf) S.crHalf={}; S.crHalf.A={'2026-12':1};
    if(!S.minInc) S.minInc={}; S.minInc.A=12345;
    setGrp('D','PSM');                                  // a hand-over to another office
    S.pmoOrder.AV=['B','A'];                            // AV's own ranking, re-ordered
    save(); return 'ok'; })()`);
  // THE ALLOCATION CANNOT BE MOVED FROM A COPY, by any door a person can reach
  const tried = JSON.parse(P.ev(`(function(){ globalThis.__al=[]; const _a=window.alert;
    window.alert=function(m){ globalThis.__al.push(String(m)); }; window.confirm=function(){ return true; };
    setFsrcSvc('A','d',0,'999'); setAlloc('A','5'); resetAlloc('B'); setFsrc('B','split');
    filter='AV'; zeroPMO(); restorePMO(); filter='ALL'; convertAllToSplit(); clinToRow('A');
    window.alert=_a; return JSON.stringify(globalThis.__al); })()`));
  chk(name, 'allocation', 'every allocation door in a copy is refused', tried.filter(a => /set by the portfolio team/.test(a)).length, 8);
  // restorePMO also resets the order, so the order is compared without the ranking edit above
  chk(name, 'allocation', 'and not a dollar or a rank moved', P.ev(MONEY), moneyBefore);
  chk(name, 'allocation', 'the copy dims those controls', P.ev(`[...document.querySelectorAll('style')].some(function(s){ return /setFsrcSvc\\(/.test(s.textContent); })`), true);

  const sub = v184Submit(P, 'AV');
  chk(name, 'submit', 'the package is built', sub.pkg ? 'built' : 'nothing', 'built');
  const pk = sub.pkg || { items: {} };
  const WANT = ['titles','band','mc','ptype','obCat','wbs','rcnAsg','rcnSvc','si','dest','costElem','budgetAsg','awards','crHalf','minInc'];
  chk(name, 'submit', 'every field edited on A travels', WANT.filter(k => (pk.items.A || {})[k] === undefined).join(',') || 'all', 'all');
  chk(name, 'submit', 'the allocation never does', Object.keys(pk.items).filter(id => pk.items[id].alloc !== undefined || pk.items[id].fsrc !== undefined).length, 0);
  chk(name, 'submit', 'the hand-over travels, not dropped as another office’s', (pk.items.D || {}).grp, 'PSM');
  chk(name, 'submit', 'nothing unedited is proposed (B and C stay home)', Object.keys(pk.items).sort().join(','), 'A,D');
  chk(name, 'submit', 'the office ranking travels', pk.rank ? pk.rank.order.join(',') : 'none', 'B,A');
  chk(name, 'submit', 'with what it was', pk.rank ? pk.rank.was.join(',') : 'none', 'A,B,D');
  chk(name, 'submit', 'the package names its field set', pk.pv, 2);

  // ── AT THE BOARD ─────────────────────────────────────────────────────────────────────────
  ev(`S.band.A='${BANDS[3]}'; save(); 'ok'`);            // this board changed A's band meanwhile
  ev(`window.alert=function(){}; window.confirm=function(){ return true }; PMOSUBS=[]; PMOPICK={};
      pmoTake(${JSON.stringify(pk)}, 'av.json'); 'ok'`);
  const rows = JSON.parse(ev(`JSON.stringify(pmoRows().map(function(r){ return r.id+'|'+r.key+(r.conflict?'!':''); }))`));
  chk(name, 'review', 'every field is a row', WANT.filter(k => !rows.some(r => r.startsWith('A|' + k))).join(',') || 'all', 'all');
  chk(name, 'review', 'the band this board also changed is a conflict', rows.indexOf('A|band!') >= 0, true);
  chk(name, 'review', 'the hand-over is a row', rows.some(r => r.startsWith('D|grp')), true);
  chk(name, 'review', 'the ranking is one row', rows.filter(r => r.startsWith('__rank|AV|__rank')).length, 1);
  chk(name, 'review', 'and not a conflict, since this board has not re-ranked AV', rows.indexOf('__rank|AV|__rank') >= 0, true);
  chk(name, 'review', 'the ranking reads as titles in order', ev(`pmoFmtVal('__rank',['B','A'])`), '1. B · 2. A');
  chk(name, 'review', 'Mission Critical reads as words', ev(`pmoFmtVal('mc',true)`), '★ Mission Critical');
  chk(name, 'review', 'a band reads as its name', ev(`pmoFmtVal('band','${BANDS[2]}')===BANDS_LIST()[2].n`), true);
  const moneyBoard = ev(`JSON.stringify({alloc:S.alloc||{}, fsrc:S.fsrc||{}, order:S.order})`);
  ev(`window.confirm=function(){ return true }; subPickAll(true); pmoApply(); 'ok'`);
  const got = JSON.parse(ev(`(function(){ return JSON.stringify({ titles:S.titles.A, band:S.band.A, mc:!!(S.mc||{}).A,
    ptype:(S.ptype||{}).A, obCat:(S.obCat||{}).A, wbs:(S.wbs||{}).A, rcnAsg:(S.rcnAsg||{}).A, rcnSvc:(S.rcnSvc||{}).A,
    si:(S.si||{}).A, dest:(S.dest||{}).A, costElem:(S.costElem||{}).A, budgetAsg:(S.budgetAsg||{}).A,
    awards:(S.awards||{}).A, crHalf:(S.crHalf||{}).A, minInc:(S.minInc||{}).A,
    grpD:grpOf(itemById('D')), av:S.pmoOrder.AV, psm:S.pmoOrder.PSM, left:pmoRows().length,
    jr:(MS.jrnl||[]).some(function(e){ return e.p && e.p[0]==='pmoOrder' && e.p[1]==='AV'; }) }); })()`));
  chk(name, 'apply', 'the plan event lands', got.titles, 'A renamed');
  chk(name, 'apply', 'the band lands over this board’s change, as ticked', got.band, BANDS[2]);
  chk(name, 'apply', 'Mission Critical lands', got.mc, true);
  chk(name, 'apply', 'the record fields land', [got.ptype, got.obCat, got.rcnAsg, got.si, got.costElem, got.minInc].join('|'),
    'OGC|DESA Contract|r1|LA|Airframe PGSE|12345');
  chk(name, 'apply', 'the structured fields land whole', JSON.stringify([got.wbs, got.rcnSvc, got.dest, got.budgetAsg, got.awards, got.crHalf]),
    JSON.stringify([[{w:'1.2.3'}], {USAF:'r1'}, {to:'lm', end:''}, {'USAF|disc':'USAF O&M - CAM Discretionary AV'},
      {mode:'single', d:'2026-12', day:9}, {'2026-12':1}]));
  chk(name, 'apply', 'the hand-over lands, and moves its office rank with it', got.grpD + ' ' + (got.psm || []).includes('D') + ' ' + (got.av || []).includes('D'), 'PSM true false');
  chk(name, 'apply', 'the office ranking lands as the office’s own order', (got.av || []).join(','), 'B,A');
  chk(name, 'apply', 'the ranking is in the change journal', got.jr, true);
  chk(name, 'apply', 'the allocation and the master list did not move', ev(`JSON.stringify({alloc:S.alloc||{}, fsrc:S.fsrc||{}, order:S.order})`), moneyBoard);
  chk(name, 'apply', 'nothing is left to review', got.left, 0);

  // AN OLD COPY SENDS THE OLD FIELD SET, AND NO RANKING
  const P1 = boot({ html });
  P1.ev(`delete PMODE.pv; delete PMODE.ord; S.titles.A='old copy rename'; S.band.A='${BANDS[2]}'; setDesc('A','old copy desc'); S.pmoOrder.AV=['B','A','D']; save(); 'ok'`);
  const old = v184Submit(P1, 'AV');
  chk(name, 'old copy', 'sends the eight fields it knows', old.pkg ? Object.keys(old.pkg.items.A || {}).join(',') : 'nothing', 'desc');
  chk(name, 'old copy', 'and no ranking', old.pkg && old.pkg.rank ? 'ranking' : 'none', 'none');
  chk(name, 'old copy', 'and says so', old.pkg ? old.pkg.pv : 'none', 1);

  // WHAT ARRIVES MALFORMED IS NAMED AND LEFT OUT, never guessed into shape
  const bad = JSON.parse(JSON.stringify(pk));
  bad.items.A = { band: 'no-such-band', wbs: [{ w: 'x', v: [1, 2] }], desc: 'kept' };
  const al = JSON.parse(ev(`(function(){ globalThis.__al=[]; window.alert=function(m){ globalThis.__al.push(String(m)); };
    PMOSUBS=[]; PMOPICK={}; pmoTake(${JSON.stringify(bad)}, 'bad.json');
    return JSON.stringify({al:globalThis.__al, keys:Object.keys((PMOSUBS[0]||{items:{}}).items.A||{}).sort()}); })()`));
  chk(name, 'door', 'a band this board does not have, and a WBS of the wrong width, are left out', al.keys.join(','), 'desc');
  chk(name, 'door', 'and named', al.al.some(a => /could\s+not be read/.test(a) && /Decision band/.test(a) && /WBS/.test(a)), true);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.84 — a copy points to Submit input, and keeps its own appropriation';
  try {
  const { ev } = v184Board();
  chk(name, 'board', 'the live board still offers Save', ev(`syncBtns(); document.getElementById('saveBtn').textContent`), '💾 Save');
  const P = boot({ html: v184Publish(ev) });
  P.ev(`syncBtns(); openMenu='share'; syncBtns(); 'ok'`);
  chk(name, 'copy', 'the header button submits', P.ev(`document.getElementById('saveBtn').textContent+'|'+document.getElementById('saveBtn').getAttribute('onclick')`), '✉ Submit input|pmoSubmit()');
  chk(name, 'copy', 'the save indicator says where the work is', /kept in this browser/.test(P.ev(`document.getElementById('saveState').innerHTML`)), true);
  chk(name, 'copy', 'File › Save says it is off here, and where to go instead', /Save<span class="sub">turned off in a PMO copy — use ✉ Submit input/.test(P.ev(`document.getElementById('dd_share').innerHTML`)), true);
  chk(name, 'copy', 'the opening line points to Submit input', /Submit input/.test(P.ev(`document.getElementById('shareStat').innerHTML`)), true);
  chk(name, 'copy', 'and never to Save', /Save to pass it on/.test(P.ev(`document.getElementById('shareStat').innerHTML`)), false);
  const box = P.ev(`(function(){ window.alert=function(){}; const s=document.getElementById('appnSel');
    const other=[...s.options].map(function(o){ return o.value; }).filter(function(v){ return v!==APPN; })[0];
    s.value=other; switchAppn(other); return s.value+'|'+APPN; })()`);
  chk(name, 'copy', 'a refused switch puts the appropriation box back', box.split('|')[0], box.split('|')[1]);
  P.ev(`filter='AV'; render(); 'ok'`);
  chk(name, 'copy', 'the office view no longer promises a control that does not exist', /Apply PMO Ranks/.test(P.ev('document.body.innerHTML')), false);
  chk(name, 'copy', 'and says the office ranking travels', /travels back with/.test(P.ev('document.body.innerHTML')), true);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.84 — a proposal carries every field';
  try {
  const { ev } = v184Board();
  const BANDS = JSON.parse(ev(`JSON.stringify(BANDS_LIST().map(function(b){ return b.id; }))`));
  const P = boot({ html: v184Publish(ev) });
  const prop = JSON.parse(P.ev(`(function(){
    const n={id:'NEW-AV-1', grp:'AV', team:'AV', sect:'new', custom:true, title:'Test cell', event:'Test cell',
      ccar:'', fy26:SVC.map(function(){ return 0; }), ask:[100,0,0], alloc:null};
    S.custom.push(n); DATA.items.push(n); S.order.push(n.id);
    S.band[n.id]='${BANDS[1]}'; if(!S.mc) S.mc={}; S.mc[n.id]=true; if(!S.costElem) S.costElem={}; S.costElem[n.id]='PES';
    if(!S.budgetAsg) S.budgetAsg={}; S.budgetAsg[n.id]={'USAF|disc':'USAF O&M - CAM Discretionary AV'};
    if(!S.si) S.si={}; S.si[n.id]='EN'; if(!S.crHalf) S.crHalf={}; S.crHalf[n.id]={'2026-12':1};
    return JSON.stringify(pmoProposalOf(n.id)); })()`));
  chk(name, 'copy', 'the proposal carries the band, the star and the record fields',
    [prop.band, prop.mc, prop.costElem, prop.si].join('|'), BANDS[1] + '|true|PES|EN');
  const pkg = { spmtPkg: 1, dir: 'submit', ap: 'om', ts: Date.now(), by: 'J. Smith', pmo: 'AV', svc: MINE, items: {}, base: {}, added: [prop] };
  ev(`window.alert=function(){}; window.confirm=function(){ return true }; PMOSUBS=[]; PMOPICK={};
      pmoTake(${JSON.stringify(pkg)}, 'p.json'); subPickAll(true); pmoApply(); 'ok'`);
  const got = JSON.parse(ev(`(function(){ const c=S.custom.filter(function(x){ return x.from && x.from.nid==='NEW-AV-1'; })[0]; if(!c) return '{}';
    return JSON.stringify({band:S.band[c.id], mc:!!(S.mc||{})[c.id], ce:(S.costElem||{})[c.id], si:(S.si||{})[c.id],
      b:(S.budgetAsg||{})[c.id], cr:(S.crHalf||{})[c.id]}); })()`));
  chk(name, 'board', 'the accepted requirement has them all',
    JSON.stringify(got), JSON.stringify({band:BANDS[1], mc:true, ce:'PES', si:'EN', b:{'USAF|disc':'USAF O&M - CAM Discretionary AV'}, cr:{'2026-12':1}}));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.84 — take one appropriation from a consolidated file';
  try {
  const sc = v184Sc();
  // YOUR board: O&M from the fixture, and a Full Fund slot of its own
  const { ev } = v184Board();
  ev(`(function(){ const ff=JSON.parse(JSON.stringify(MS)); const y=ff.years[ff.cur]; y.notes=y.notes||{};
      y.notes.A='FF as sent'; ff.ts=Date.now(); lsSet(_SLUGMAP.ff.key, JSON.stringify(ff), 'ff'); PUBS.ff=ff;
      EXDB={ts:1000, all:{om:{x:1}}}; return 'ok'; })()`);
  const sent = ev('buildSavedHtml()');
  // THE O&M LEAD works in that file, and touches Full Fund by accident
  const L = boot({ html: sent }); seed(L.ev, sc); asBooted(L.ev, sc);
  L.ev(`(function(){ applyState(S); setDesc('A','LEAD EDIT'); save();
      const ff=JSON.parse(localStorage.getItem(_SLUGMAP.ff.key)||'null')||JSON.parse(JSON.stringify(PUBS.ff));
      ff.years[ff.cur].notes.A='FF touched by the lead'; ff.ts=Date.now(); lsSet(_SLUGMAP.ff.key, JSON.stringify(ff), 'ff'); PUBS.ff=ff;
      EXDB={ts:Date.now(), all:{om:{y:2}}}; return 'ok'; })()`);
  const leadHtml = L.ev('buildSavedHtml()');
  const leadFull = JSON.parse(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/.exec(leadHtml)[1]);
  // MEANWHILE you changed Full Fund
  ev(`(function(){ const ff=JSON.parse(localStorage.getItem(_SLUGMAP.ff.key)); ff.years[ff.cur].notes.A='FF changed here later';
      ff.ts=Date.now(); lsSet(_SLUGMAP.ff.key, JSON.stringify(ff), 'ff'); PUBS.ff=ff; return 'ok'; })()`);
  const lsOM = () => JSON.parse(ev(`localStorage.getItem(_SLUGMAP.om.key)||'null'`));
  const ffNote = () => ev(`(JSON.parse(localStorage.getItem(_SLUGMAP.ff.key)).years[MS.cur].notes||{}).A`);
  const take = (answer, confirmAll) => JSON.parse(ev(`(function(){ globalThis.__cf=[]; globalThis.__al=[];
    window.prompt=function(){ return ${JSON.stringify(answer)}; };
    window.confirm=function(m){ globalThis.__cf.push(String(m)); return ${confirmAll ? 'true' : "!/^CONFLICT/.test(String(m))"}; };
    window.alert=function(m){ globalThis.__al.push(String(m)); };
    consTakePick(${JSON.stringify(leadFull)}, ${JSON.stringify(leadHtml)}, 'lead.html');
    return JSON.stringify({cf:globalThis.__cf, al:globalThis.__al}); })()`));
  const omBefore = ev(`localStorage.getItem(_SLUGMAP.om.key)`);
  let t = take('', true);
  chk(name, 'nothing named', 'nothing is taken', ev(`localStorage.getItem(_SLUGMAP.om.key)`) === omBefore, true);
  t = take('7', true);
  chk(name, 'nothing named', 'a number not on the list takes nothing, and says so', ev(`localStorage.getItem(_SLUGMAP.om.key)`) === omBefore && t.al.length > 0, true);
  t = take('1', true);
  const om1 = lsOM();
  chk(name, 'O&M only', 'the lead’s O&M is taken', ((om1.years[om1.cur] || {}).desc || {}).A, 'LEAD EDIT');
  chk(name, 'O&M only', 'Full Fund keeps the change made here', ffNote(), 'FF changed here later');
  chk(name, 'O&M only', 'the preview named what it replaced', t.cf.some(c => /REPLACES O&M/.test(c) && /descriptions/.test(c)), true);
  chk(name, 'O&M only', 'and said nothing else changes', t.cf.some(c => /Nothing else on this board changes/.test(c)), true);
  chk(name, 'O&M only', 'the board-wide stores were left as this board has them', ev('EXDB.ts'), 1000);
  // YOUR OWN O&M EDIT AFTER THE FILE LEFT IS A CONFLICT, and declining it keeps it
  const B2 = v184Board();
  B2.ev(`(function(){ const ff=JSON.parse(JSON.stringify(MS)); ff.ts=Date.now(); lsSet(_SLUGMAP.ff.key, JSON.stringify(ff), 'ff'); PUBS.ff=ff; return 'ok'; })()`);
  const sent2 = B2.ev('buildSavedHtml()');
  const L2 = boot({ html: sent2 }); seed(L2.ev, sc); asBooted(L2.ev, sc);
  L2.ev(`applyState(S); setDesc('A','LEAD EDIT'); save(); 'ok'`);
  const lead2 = L2.ev('buildSavedHtml()');
  const full2 = JSON.parse(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/.exec(lead2)[1]);
  B2.ev(`jrnlSync(); setNote('B','mine, after sending'); save(); 'ok'`);
  const c2 = JSON.parse(B2.ev(`(function(){ globalThis.__cf=[]; window.prompt=function(){ return '1'; };
    window.confirm=function(m){ globalThis.__cf.push(String(m)); return !/^CONFLICT/.test(String(m)); }; window.alert=function(){};
    consTakePick(${JSON.stringify(full2)}, ${JSON.stringify(lead2)}, 'lead.html');
    return JSON.stringify({cf:globalThis.__cf, note:(JSON.parse(localStorage.getItem(_SLUGMAP.om.key)).years[MS.cur].notes||{}).B||'',
      desc:(JSON.parse(localStorage.getItem(_SLUGMAP.om.key)).years[MS.cur].desc||{}).A||''}); })()`));
  chk(name, 'conflict', 'your edit since the file left is named', c2.cf.some(m => /^CONFLICT/.test(m) && /note/i.test(m)), true);
  chk(name, 'conflict', 'and declining keeps it', c2.note + '|' + c2.desc, 'mine, after sending|');
  // SEND BACK: the lead saves just O&M as a return package; your board takes O&M and nothing else
  const back = JSON.parse(L2.ev(`(function(){ let cap=null; const _B=window.Blob;
    window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
    try{ pkgSendBack('om'); }catch(e){} window.Blob=_B; return cap||'null'; })()`));
  chk(name, 'send back', 'the lead’s copy saves one appropriation as a return', back ? back.dir + '|' + back.ap + '|' + back.via : 'none', 'return|om|consolidated');
  const B3 = v184Board();
  const r3 = JSON.parse(B3.ev(`(function(){ globalThis.__cf=[]; window.confirm=function(m){ globalThis.__cf.push(String(m)); return true; }; window.alert=function(){};
    const ok=pkgApply(${JSON.stringify(back)}, 'back.json'); return JSON.stringify({ok:ok, desc:(S.desc||{}).A||'', cf:globalThis.__cf}); })()`));
  chk(name, 'send back', 'it merges into O&M', r3.ok + '|' + r3.desc, 'true|LEAD EDIT');
  chk(name, 'send back', 'after a preview that names the change', r3.cf.some(m => /descriptions/.test(m)), true);
  // your own O&M edit since the file left is named before a send-back replaces it
  const r4 = JSON.parse(B2.ev(`(function(){ globalThis.__cf=[]; window.confirm=function(m){ globalThis.__cf.push(String(m)); return false; }; window.alert=function(){};
    const ok=pkgApply(${JSON.stringify(back)}, 'back.json'); return JSON.stringify({ok:ok, note:(S.notes||{}).B||'', cf:globalThis.__cf}); })()`));
  chk(name, 'send back', 'a change made here since is named as a conflict', r4.cf.some(m => /^CONFLICT/.test(m) && /since that copy was saved/.test(m)), true);
  chk(name, 'send back', 'and declining keeps it', r4.ok + '|' + r4.note, 'false|mine, after sending');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ══ v1.85 — THE FIVE-YEAR SPEND PLAN BY PMO, EVERY APPROPRIATION ══════════════════════════════════
// Three appropriations in one file, each built on its OWN board: Full Fund and O&M lock PB27 and then
// change the working plan, so a lock and the working plan differ; Initial Spares locks nothing; OPN
// holds nothing. Each has a second planned year with a different trim, so Allocation is not
// Requirement and FY28 is not FY27. The O&M board exports; every other appropriation's block must be
// what THAT appropriation's own board prints, to the dollar, and nothing stored may move.
const v185It = (id, grp, ask, ccar) => ({ ...it(id, grp, ask), title: 'Req ' + id, event: 'Req ' + id, ccar });
const V185 = {
  om: { services: MINE, items: [v185It('A', 'AV', [900, 200, 100], 'JSF5594'), v185It('B', 'AV', [400, 100, 50], 'JSF5594'),
        v185It('C', 'PSM', [300, 80, 40], ''), v185It('D', 'AV', [200, 50, 25], ' jsf5594 '), v185It('E', 'TSS', [150, 40, 20], 'JSF1000')],
        disc: [1200, 300, 150], mand: [300, 80, 40], order: ['A', 'B', 'C', 'D', 'E'] },
  ff: { services: MINE, items: [v185It('F', 'AV', [700, 100, 60], 'JSF7000'), v185It('G', 'TSS', [500, 90, 30], 'JSF1000'),
        v185It('H', 'CDS', [250, 60, 20], '')],
        disc: [900, 150, 60], mand: [200, 40, 20], order: ['F', 'G', 'H'] },
  sp: { services: MINE, items: [v185It('I', 'PSM', [120, 30, 10], 'JSF3300'), v185It('J', 'AV', [80, 20, 5], 'JSF5594')],
        disc: [150, 40, 10], mand: [0, 0, 0], order: ['I', 'J'] },
};
const v185Board = (html, appn, sc, trim, trim28, lock, after) => {
  const B = boot({ html, appn }); seed(B.ev, sc); asBooted(B.ev, sc);
  B.ev(`(function(){ applyState(S); Object.assign(S.alloc, ${JSON.stringify(trim)}); MS.years[MS.cur]=S; MS.cycle='BES|2028';
    const y2=JSON.parse(JSON.stringify(S)); y2.alloc=Object.assign({}, y2.alloc, ${JSON.stringify(trim28)}); MS.years[MS.cur+1]=y2;
    save(); ${lock ? "blCyc='PB'; blYr=MS.cur; cycLock();" : ''}
    Object.assign(S.alloc, ${JSON.stringify(after)}); save(); return 'ok'; })()`);
  return B;
};
const v185Export = (B, src) => JSON.parse(B.ev(`(function(){ fydpSrc=${JSON.stringify(src)}; var got=null, _b=buildXlsx;
  buildXlsx=function(sh){ got=JSON.stringify(sh); return new Uint8Array(0); };
  try{ exportFydpPlan(); }catch(e){ got=JSON.stringify({threw:String((e&&e.message)||e)}); }
  buildXlsx=_b; return got||'null'; })()`));
const v185Cv = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c;
// the blocks of one PMO tab: {title, hdr, rows}, rows as plain values
const v185Blocks = (sh) => {
  const out = []; let cur = null;
  for (const r of sh.rows) {
    const c0 = r && r[0];
    if (c0 && typeof c0 === 'object' && c0.s === 6) { cur = { title: String(c0.v), hdr: null, rows: [] }; out.push(cur); continue; }
    if (!cur) continue;
    if (!r || !r.length) { cur = null; continue; }
    if (!cur.hdr) { cur.hdr = r.map(v185Cv); continue; }
    cur.rows.push(r.map(v185Cv));
  }
  return out;
};
const V185AP = { 'O&M': 'om', 'FULL FUND': 'ff', 'INITIAL SPARES': 'sp', 'OPN': 'opn' };
const v185ApOf = (b) => V185AP[b.title.split(' — ')[0]];
// one row of an appropriation's own sheet, by its first cell, as {header: value}
const v185Row = (sh, first, label) => {
  const rows = sh.rows.map(r => (r || []).map(v185Cv));
  const h = rows.findIndex(r => r[0] === first);
  const r = rows.slice(h + 1).find(x => x[0] === label || x[1] === label);
  if (!r) return null;
  const o = {}; rows[h].forEach((k, i) => { o[k] = r[i]; }); return o;
};
const v185Store = (ev) => ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); }
  return JSON.stringify({ls:o, pubs:PUBS, ms:MS, cyc:CYCDB}); })()`);
// A board whose other appropriations are not under test answers its frames at once, unread -- each
// real frame is a whole board booted, and the reference boards need only their own sheets.
const v185NoFrames = (B) => { B.w.fydpFrame = (h, n) => ({ then(ok) { ok({ err: 'not needed here', nonce: n }); return this; } }); };
// the same frame asked twice answers the same: key by the page it was handed, less its nonce
const v185Memo = (real0) => { const memo = new Map();
  return (h, n) => { const key = h.split(n).join('');
    if (!memo.has(key)) real0(h, n).then(r => memo.set(key, JSON.stringify(r)));
    const r = JSON.parse(memo.get(key)); r.nonce = n; return { then(ok) { ok(r); return this; } }; }; };
let V185W = null;     // the scenario, built once for the blocks below
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.85 — every appropriation, read by its own board, ties to the dollar';
  try {
  const F = v185Board(null, 'FULL FUND', V185.ff, { F: { m: 't', v: 600 } }, { G: { m: 't', v: 400 } }, true, { H: { m: 't', v: 200 } });
  const P = v185Board(F.ev('buildSavedHtml()'), 'INITIAL SPARES', V185.sp, { I: { m: 't', v: 100 } }, { J: { m: 't', v: 60 } }, false, {});
  const O = v185Board(P.ev('buildSavedHtml()'), null, V185.om, { A: { m: 't', v: 1000 } }, { B: { m: 't', v: 300 } }, true, { E: { m: 't', v: 150 } });
  chk(name, 'fixture', 'the exporting board is O&M', O.ev('APPN'), 'O&M');
  const before = v185Store(O.ev);
  const W = v185Export(O, 'working'), C = v185Export(O, 'PB|2027');
  chk(name, 'storage', 'reading the other appropriations changes nothing this browser holds, the file state, or the board', v185Store(O.ev) === before, true);
  chk(name, 'frames', 'Full Fund and Initial Spares were each opened, cleanly, for each export',
    JSON.stringify(O.w.__fydpFrames.map(f => f.err + '|' + f.errors.length)), JSON.stringify(['|0', '|0', '|0']));
  // THE REFERENCE: the same file opened as each appropriation, exporting the same source
  const file = O.ev('buildSavedHtml()');
  const own = { om: { W, C } };
  for (const [k, appn] of [['ff', 'FULL FUND'], ['sp', 'INITIAL SPARES']]) {
    const X = boot({ html: file, appn }); v185NoFrames(X);
    own[k] = { W: v185Export(X, 'working'), C: v185Export(X, 'PB|2027') };
  }
  V185W = { O, W, C, file, own, F };
  chk(name, 'sheets', 'the three sheets come first, then a tab per PMO across every appropriation',
    W.map(s => s.name).join(','), 'By Requirement,By PMO,By Service,PSM,AV,CDS,TSS');
  let blocks = 0, dash = 0, ties = 0, foot = 0;
  const seenReq = { om: [], ff: [], sp: [] };
  W.slice(3).forEach(sh => {
    const p = sh.name;
    v185Blocks(sh).forEach(b => {
      blocks++;
      const k = v185ApOf(b), mine = own[k].W;
      const yrs = b.hdr.filter(h => / Requirement$/.test(h) && !/^FYDP/.test(h)).map(h => h.split(' ')[0]);
      // THE BLOCK TOTAL IS THAT APPROPRIATION'S OWN By PMO ROW, every year and the FYDP
      const tot = b.rows.find(r => /^Total — /.test(String(r[0])));
      const bp = v185Row(mine.find(s => s.name === 'By PMO'), 'PMO', p);
      yrs.concat(['FYDP']).forEach(y => {
        const iq = b.hdr.indexOf(y + ' Requirement'), ia = b.hdr.indexOf(y + ' Allocation');
        chk(name, p + ' · ' + k, y + ' requirement is the one its own board prints', tot[iq], bp[y + ' Requirement']);
        chk(name, p + ' · ' + k, y + ' allocation is the one its own board prints', tot[ia], bp[y + ' Allocated']);
        ties += 2;
      });
      // RECORD LINES ADD THE REQUIREMENTS UNDER THEM; THE TOTAL ADDS THE RECORD LINES; EVERY ROW CROSS-FOOTS
      const num = (v) => typeof v === 'number' ? v : 0;
      let rec = null; const recs = [], under = [];
      const closeRec = () => { if (!rec) return; b.hdr.forEach((h, i) => { if (i > 1) chk(name, p + ' · ' + k, 'record ' + rec[0] + ' ' + h + ' adds its requirements', rec[i],
        under.every(r => r[i] === '—') ? '—' : under.reduce((s2, r) => s2 + num(r[i]), 0)); }); foot++; };
      b.rows.forEach(r => {
        if (/^Total — /.test(String(r[0]))) return;
        if (r[0] !== '') { closeRec(); rec = r; recs.push(r); under.length = 0; }
        else {
          under.push(r); seenReq[k].push(r[1]);
          // each requirement is its own board's By Requirement row
          const br = v185Row(mine.find(s => s.name === 'By Requirement'), 'PMO', r[1]);
          yrs.forEach(y => { chk(name, p + ' · ' + k, r[1] + ' ' + y + ' matches its By Requirement row',
            String(r[b.hdr.indexOf(y + ' Requirement')]) + '/' + String(r[b.hdr.indexOf(y + ' Allocation')]),
            String(br[y + ' Requirement']) + '/' + String(br[y + ' Allocated'])); });
        }
        const fy = b.hdr.map((h, i) => (/ Requirement$/.test(h) && !/^FYDP/.test(h)) ? num(r[i]) : 0).reduce((s, v) => s + v, 0);
        chk(name, p + ' · ' + k, String(r[0] || r[1]) + ' FYDP requirement adds its years', r[b.hdr.indexOf('FYDP Requirement')], fy);
      });
      closeRec();
      // a column no record holds is a year no plan held: — on the total too, never 0
      b.hdr.forEach((h, i) => { if (i > 1) chk(name, p + ' · ' + k, 'the block total ' + h + ' adds its record lines', tot[i],
        recs.every(r => r[i] === '—') ? '—' : recs.reduce((s2, r) => s2 + num(r[i]), 0)); });
      // A YEAR NO PLAN HELD IS AN EM DASH, never 0
      ['FY29', 'FY30', 'FY31'].forEach(y => b.rows.forEach(r => { if (r[b.hdr.indexOf(y + ' Requirement')] === '—') dash++; }));
    });
  });
  chk(name, 'coverage', 'the tabs carry the blocks the fixture holds (O&M 3 PMOs, Full Fund 3, Initial Spares 2)', blocks, 8);
  chk(name, 'coverage', 'every block was tied, every year and the FYDP, both columns', ties, 8 * 6 * 2);
  chk(name, 'coverage', 'every record line was footed', foot, 8);
  const lines = W.slice(3).reduce((n, sh) => n + v185Blocks(sh).reduce((m, b) => m + b.rows.length, 0), 0);
  chk(name, 'coverage', 'FY29–FY31, which no plan holds, print — on every line of every block', dash, lines * 3);
  // EVERY REQUIREMENT EXACTLY ONCE, per appropriation
  const reqOf = (sheets) => { const br = sheets.find(s => s.name === 'By Requirement').rows.map(r => (r || []).map(v185Cv));
    const h = br.findIndex(r => r[0] === 'PMO'); return br.slice(h + 1).filter(r => r[0] && !/^Subtotal|^TOTAL/.test(String(r[0]))).map(r => r[1]).sort(); };
  ['om', 'ff', 'sp'].forEach(k => chk(name, 'coverage', k + ': every requirement appears once across the tabs',
    seenReq[k].slice().sort().join(','), reqOf(own[k].W).join(',')));
  // THE CCaR RECORDS: one record however it is cased or spaced, and the unrecorded last
  const av = v185Blocks(W.find(s => s.name === 'AV')).find(b => v185ApOf(b) === 'om');
  chk(name, 'records', 'JSF5594 carries A, B and the requirement typed " jsf5594 "',
    av.rows.filter(r => r[0] !== '').map(r => r[0] + ':' + r[1]).join(','), 'JSF5594:3 requirements,Total — O&M:3 requirements');
  const psm = v185Blocks(W.find(s => s.name === 'PSM'));
  chk(name, 'records', 'a requirement with no CCaR record sits under "No CCaR record"', psm.find(b => v185ApOf(b) === 'om').rows[0][0], 'No CCaR record');
  const tss = v185Blocks(W.find(s => s.name === 'TSS')).find(b => v185ApOf(b) === 'ff');
  const g = tss.rows.find(r => r[1] === 'Req G');
  chk(name, 'fixture', 'Allocation is not Requirement where the plan trims (Full Fund G, FY28)', g[tss.hdr.indexOf('FY28 Allocation')] !== g[tss.hdr.indexOf('FY28 Requirement')], true);
  // THE CYCLE IS NAMED, AND THE THREE SHEETS BEFORE THE TABS DO NOT MOVE
  chk(name, 'cycle', 'every tab names the source and its cycle', W.slice(3).every(sh => /THE WORKING PLAN \(BES28\)/.test(String(v185Cv(sh.rows[0][0])))), true);
  chk(name, 'cycle', 'every block names its own', W.slice(3).every(sh => v185Blocks(sh).every(b => /the working plan \(BES28\)/.test(b.title))), true);
  const alone = (() => { const st = JSON.parse(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/.exec(file)[1]);
    st.appns = { om: st.appns.om }; st.cycDb.byAp = { om: st.cycDb.byAp.om };
    const B = boot({ html: file.replace(/(<script type="application\/json" id="pubState">)[\s\S]*?(<\/script>)/, (m, a, b2) => a + JSON.stringify(st).replace(/</g, '\\u003c') + b2) });
    const out = v185Export(B, 'working');
    chk(name, 'unchanged', 'the O&M-only board opens no frame', B.w.__fydpFrames.length, 0);
    return out; })();
  chk(name, 'unchanged', 'By Requirement, By PMO and By Service are exactly what an O&M-only board prints',
    JSON.stringify(W.slice(0, 3)), JSON.stringify(alone.slice(0, 3)));
  chk(name, 'unchanged', 'and an O&M-only board has O&M blocks alone', alone.slice(3).every(sh => v185Blocks(sh).every(b => v185ApOf(b) === 'om')), true);
  // ONE THAT HOLDS NOTHING IS SAID, NOT HIDDEN
  chk(name, 'coverage', 'OPN is named as holding no requirements', W.slice(3).every(sh => /OPN holds no requirements on this board/.test(String(v185Cv(sh.rows[2][0])))), true);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.85 — a locked cycle is read as locked, and a missing lock is said';
  try {
  const { C, W, own } = V185W;
  chk(name, 'sheets', 'the cycle report has the same tabs', C.map(s => s.name).join(','), 'By Requirement,By PMO,By Service,PSM,AV,CDS,TSS');
  // INITIAL SPARES LOCKED NOTHING: every tab says so, and no working plan stands in for it
  chk(name, 'missing lock', 'every tab says Initial Spares is not on it, and why',
    C.slice(3).every(sh => sh.rows.some(r => /^⚠ INITIAL SPARES IS NOT ON THIS TAB — has no PB27 lock/.test(String(v185Cv((r || [])[0]))))), true);
  chk(name, 'missing lock', 'and no Initial Spares figure is printed', C.slice(3).some(sh => v185Blocks(sh).some(b => v185ApOf(b) === 'sp')), false);
  // FULL FUND AND O&M TIE TO THEIR OWN PB27 REPORTS
  let n = 0;
  C.slice(3).forEach(sh => v185Blocks(sh).forEach(b => {
    const k = v185ApOf(b), bp = v185Row(own[k].C.find(s => s.name === 'By PMO'), 'PMO', sh.name);
    const tot = b.rows.find(r => /^Total — /.test(String(r[0])));
    ['FY27', 'FY28', 'FYDP'].forEach(y => { n++;
      chk(name, sh.name + ' · ' + k, y + ' is its own PB27 By PMO', tot[b.hdr.indexOf(y + ' Requirement')] + '/' + tot[b.hdr.indexOf(y + ' Allocation')],
        bp[y + ' Requirement'] + '/' + bp[y + ' Allocated']); });
    chk(name, sh.name + ' · ' + k, 'the block names the lock', /PB27 \(locked\)/.test(b.title), true);
  }));
  chk(name, 'coverage', 'the locked blocks were all checked (O&M 3, Full Fund 3)', n, 6 * 3);
  // THE LOCK, NOT THE WORKING PLAN: Full Fund trimmed H after locking
  const alloc = (sheets) => { const b = v185Blocks(sheets.find(s => s.name === 'CDS')).find(x => v185ApOf(x) === 'ff'); return b.rows.find(r => r[1] === 'Req H')[3]; };
  chk(name, 'lock', 'Full Fund’s CDS allocation is the locked one, not today’s', alloc(C) !== alloc(W), true);
  chk(name, 'lock', 'the working plan carries the later trim', alloc(W), 200);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.85 — a block that cannot be trusted is refused, never printed';
  try {
  const { O } = V185W;
  const tabsSay = (sheets, ap, why) => sheets.slice(3).every(sh => sh.rows.some(r => new RegExp('^⚠ ' + ap + ' IS NOT ON THIS TAB — ' + why).test(String(v185Cv((r || [])[0])))));
  const noBlock = (sheets, k) => !sheets.slice(3).some(sh => v185Blocks(sh).some(b => v185ApOf(b) === k));
  const real0 = O.w.fydpFrame, real = v185Memo(real0);
  // a frame that opened a different saved state
  O.w.fydpFrame = (h, n) => ({ then(ok) { real(h, n).then(r => { if (r.ap === 'ff') r.ts = r.ts + 1; ok(r); }); return this; } });
  let S1 = v185Export(O, 'working');
  chk(name, 'other state', 'Full Fund is refused on every tab', tabsSay(S1, 'FULL FUND', 'its board opened a different saved state'), true);
  chk(name, 'other state', 'with no Full Fund figure anywhere', noBlock(S1, 'ff'), true);
  chk(name, 'other state', 'and Initial Spares still read', !noBlock(S1, 'sp'), true);
  // a frame that opened the wrong appropriation, one that failed, one that answered in another shape
  O.w.fydpFrame = (h, n) => ({ then(ok) { real(h, n).then(r => { if (r.ap === 'ff') r.ap = 'om'; if (r.ap === 'sp') { r.err = 'boom'; } ok(r); }); return this; } });
  S1 = v185Export(O, 'working');
  chk(name, 'wrong board', 'the wrong appropriation is refused', tabsSay(S1, 'FULL FUND', 'the frame opened O&M instead'), true);
  chk(name, 'failed', 'a frame that failed is refused', tabsSay(S1, 'INITIAL SPARES', 'its board could not be opened \\(boom\\)'), true);
  O.w.fydpFrame = (h, n) => ({ then(ok) { real(h, n).then(r => { if (r.ap === 'ff') r.D.held.push(2031); if (r.ap === 'sp') r.build = 'v0'; ok(r); }); return this; } });
  S1 = v185Export(O, 'working');
  chk(name, 'shape', 'a year it claims but did not send is refused', tabsSay(S1, 'FULL FUND', 'its board answered in a shape'), true);
  chk(name, 'shape', 'another build is refused', tabsSay(S1, 'INITIAL SPARES', 'the frame ran a different build'), true);
  // THE NEWEST COPY IS THE ONE READ: this browser's when newer than the file's, the file's when not.
  // Full Fund's frame is real; Initial Spares' is not under test here.
  O.w.fydpFrame = (h, n) => /"prio27appn":"INITIAL SPARES"/.test(h) ? { then(ok) { ok({ err: 'not needed here', nonce: n }); return this; } } : real0(h, n);
  const ffAlloc = (sheets) => { const b = v185Blocks(sheets.find(s => s.name === 'AV')).find(x => v185ApOf(x) === 'ff'); return b.rows.find(r => r[1] === 'Req F')[3]; };
  const put = (dt, v, cyc) => O.ev(`(function(){ const ff=JSON.parse(JSON.stringify(PUBS.ff)); ff.years[ff.cur].alloc.F={m:'t', v:${v}};
    ${cyc ? "ff.cycle='" + cyc + "';" : ''} ff.ts=(+PUBS.ff.ts)+(${dt}); localStorage.setItem(_SLUGMAP.ff.key, JSON.stringify(ff)); return 'ok'; })()`);
  put(1000, 333, 'PB|2027');
  const S2 = v185Export(O, 'working');
  chk(name, 'newest', 'a newer copy in this browser is the one read', ffAlloc(S2), 333);
  // A WORKING PLAN TAGGED UNDER ANOTHER CYCLE IS SAID ON ITS BLOCK -- the tab's cycle is this board's
  const ffTitle = (sheets) => v185Blocks(sheets.find(s => s.name === 'AV')).find(x => v185ApOf(x) === 'ff').title;
  chk(name, 'cycle tag', 'Full Fund’s block says its working plan is tagged PB27, not BES28', /⚠ its working plan is tagged PB27, this one BES28$/.test(ffTitle(S2)), true);
  chk(name, 'cycle tag', 'and O&M’s, tagged as this board is, says nothing', /⚠/.test(v185Blocks(S2.find(s => s.name === 'AV')).find(x => v185ApOf(x) === 'om').title), false);
  put(-1000, 222);
  chk(name, 'newest', 'an older one is not — the file’s is newer', ffAlloc(v185Export(O, 'working')), 600);
  O.ev(`localStorage.setItem(_SLUGMAP.ff.key, '{not json'); 'ok'`);
  S1 = v185Export(O, 'working');
  chk(name, 'unreadable', 'a copy this browser cannot read is refused, not skipped', tabsSay(S1, 'FULL FUND', 'its saved state in this browser could not be read'), true);
  O.ev(`localStorage.removeItem(_SLUGMAP.ff.key); 'ok'`);
  chk(name, 'newest', 'and with it gone, the file’s is read again', ffAlloc(v185Export(O, 'working')), 600);
  O.w.fydpFrame = real0;
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.85 — the frames answer later, and the export waits for them';
  try {
  const { file, W } = V185W;
  const A = boot({ html: file });
  const real = A.w.fydpFrame;
  A.w.fydpFrame = (h, n) => new Promise(res => setTimeout(() => real(h, n).then(res), 20));
  A.ev(`window.__cap=null; window.__b=buildXlsx; buildXlsx=function(sh){ window.__cap=JSON.stringify(sh); return new Uint8Array(0); };
    fydpSrc='working'; exportFydpPlan(); 'ok'`);
  chk(name, 'waiting', 'nothing is built before the frames answer', A.ev('window.__cap===null'), true);
  chk(name, 'waiting', 'the status says which are being opened', /Opening Full Fund, Initial Spares for the PMO tabs/.test(A.ev(`document.getElementById('shareStat').textContent`)), true);
  A.ev(`exportFydpPlan(); 'ok'`);
  chk(name, 'waiting', 'a second export while waiting is turned away, and says why', /still opening the other appropriations/.test(A.ev(`document.getElementById('shareStat').textContent`)), true);
  for (let i = 0; i < 600 && A.ev('window.__cap===null'); i++) await new Promise(r => setTimeout(r, 50));
  A.ev(`buildXlsx=window.__b; 'ok'`);
  const got = JSON.parse(A.ev('window.__cap') || 'null');
  chk(name, 'answered', 'the workbook is built once they answer', !!got, true);
  chk(name, 'answered', 'and it is the same workbook', JSON.stringify(got), JSON.stringify(W));
  chk(name, 'answered', 'the board is free again', A.ev('_fydpBusy'), false);
  chk(name, 'answered', 'and the status names the tabs', /A tab for each of 4 PMOs — O&amp;M, Full Fund, Initial Spares\./.test(A.ev(`document.getElementById('shareStat').innerHTML`)), true);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.85 — a save keeps the other appropriations’ locked cycles';
  try {
  const { F } = V185W;
  const ffHtml = F.ev('buildSavedHtml()');
  const pub = (html) => JSON.parse(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/.exec(html)[1]);
  const lock = JSON.stringify(pub(ffHtml).cycDb.byAp.ff.cycles['PB|2027']);
  chk(name, 'fixture', 'the Full Fund file carries its PB27 lock', lock.length > 100, true);
  // opened on O&M in a browser that never opened Full Fund, then saved
  const X = boot({ html: ffHtml });
  chk(name, 'fixture', 'it opens as O&M, with no Full Fund cycles in this browser', X.ev(`APPN+'|'+(localStorage.getItem(_SLUGMAP.ff.key+'-cyc')===null)`), 'O&M|true');
  const out = pub(X.ev('buildSavedHtml()'));
  chk(name, 'save', 'the saved file still carries Full Fund’s PB27 lock, unchanged', JSON.stringify(((out.cycDb.byAp.ff || {}).cycles || {})['PB|2027'] || null), lock);
  // a store this browser holds is kept when newer, and the file's when that is newer
  X.ev(`(function(){ const c=JSON.parse(JSON.stringify(CYC_FILE.ff)); c.ts=(CYC_FILE.ff.ts||0)+1000; c.cycles['BES|2028']={cyc:'BES', cycYr:2028, proj:{}, years:{}};
    localStorage.setItem(_SLUGMAP.ff.key+'-cyc', JSON.stringify(c)); return 'ok'; })()`);
  chk(name, 'newest', 'a newer store in this browser is the one saved', Object.keys(pub(X.ev('buildSavedHtml()')).cycDb.byAp.ff.cycles).sort().join(','), 'BES|2028,PB|2027');
  X.ev(`(function(){ const c=JSON.parse(localStorage.getItem(_SLUGMAP.ff.key+'-cyc')); c.ts=(CYC_FILE.ff.ts||0)-1000;
    localStorage.setItem(_SLUGMAP.ff.key+'-cyc', JSON.stringify(c)); return 'ok'; })()`);
  chk(name, 'newest', 'an older one gives way to the file’s', Object.keys(pub(X.ev('buildSavedHtml()')).cycDb.byAp.ff.cycles).sort().join(','), 'PB|2027');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.85 — a PMO copy prints its own appropriation, and opens nothing';
  try {
  const { O } = V185W;
  const html = v184Publish(O.ev);
  chk(name, 'publish', 'the copy is written', html.length > 1000, true);
  const Pc = boot({ html });
  const S2 = v185Export(Pc, 'working');
  chk(name, 'copy', 'no other appropriation is opened', Pc.w.__fydpFrames.length, 0);
  chk(name, 'copy', 'only O&M blocks are printed', S2.slice(3).every(sh => v185Blocks(sh).every(b => v185ApOf(b) === 'om')) && S2.length > 3, true);
  chk(name, 'copy', 'and each tab says the copy carries O&M only', S2.slice(3).every(sh => /This PMO copy carries O&M only/.test(String(v185Cv(sh.rows[2][0])))), true);
  // EVERY SHEET SAYS IT IS A COPY, as the copy's other exports do -- the file name alone was stamped before v1.85
  chk(name, 'stamp', 'every sheet, the three and the PMO tabs, is stamped as a PMO copy snapshot',
    S2.map(sh => /^◨ PMO COPY \(snapshot of \d{4}-\d\d-\d\d, NOT the current plan\)  —  /.test(String(v185Cv(sh.rows[0][0])))).join(','), S2.map(() => 'true').join(','));
  chk(name, 'stamp', 'and the portfolio board’s are not', V185W.W.every(sh => !/PMO COPY/.test(String(v185Cv(sh.rows[0][0])))), true);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ═══ v1.86 — ONE DESTINATION LIST FOR THE WHOLE BOARD ═══════════════════════════════════════════
// Brad, 25 Sep 2026: a destination added on one appropriation has to be there on all of them, and the
// list has to read A to Z -- the main file holds about thirty. Until v1.86 each appropriation kept its
// own list inside its own plan and numbered its own keys, so x1 on O&M and x1 on Full Fund could be two
// different places. The can't-fail: merging the lists moves no requirement, in any appropriation, any
// year or any locked cycle, off its destination or onto another one. The fixture is a file exactly as
// v1.85 wrote it -- a list per plan, no board list -- built so that the merge has to re-point keys,
// including one old key that becomes ANOTHER destination's key (a second pass would move it again).
const V186DEF = JSON.parse(boot().ev('JSON.stringify(flowDefEnts())'));
const V186OM = V186DEF.map(e => e.k === 'pw' ? { ...e, n: 'Boeing', t: 'BOEING' } : e).concat([
  { k: 'x1', n: 'Raytheon', kind: 'other', t: 'RTX' }, { k: 'x2', n: '  zeta  works', kind: 'other', t: '' },
  { k: 'x3', n: 'Pratt & Whitney', kind: 'prime', t: 'PW' }, { k: 'x4', n: 'New destination', kind: 'other', t: '' }]);
const V186FF = V186DEF.map(e => e.k === 'lm' ? { ...e, n: 'Lockheed Martin Aeronautics' } : e).concat([
  { k: 'x1', n: 'RAYTHEON', kind: 'gov', t: 'RAYTHEON, RAY' }, { k: 'x2', n: 'Acme Corp', kind: 'other', t: '' },
  { k: 'x3', n: 'Zeta Works', kind: 'other', t: 'ZETA' }]);
const d = (to, end = '') => ({ to, end });
const v186Legacy = (html, appn, sc, list, d27, d28, lock, after27) => {
  const B = boot({ html, appn }); seed(B.ev, sc); asBooted(B.ev, sc);
  B.ev(`(function(){ _destReady=false; applyState(S); MS.years[MS.cur]=S;
    MS.flow={ents:${JSON.stringify(list)}}; S.dest=${JSON.stringify(d27)};
    const y2=JSON.parse(JSON.stringify(S)); y2.dest=${JSON.stringify(d28)}; MS.years[MS.cur+1]=y2;
    MS.cycle='BES|2028'; save(); ${lock ? "blCyc='PB'; blYr=MS.cur; cycLock();" : ''}
    Object.assign(S.dest, ${JSON.stringify(after27 || {})}); save(); return 'ok'; })()`);
  return B;
};
const V186RE = /(<script type="application\/json" id="pubState">)([\s\S]*?)(<\/script>)/;
const v186Pub = (html) => JSON.parse(html.match(V186RE)[2]);
// what v1.85 wrote: no board list, a list in each plan, cycles written against their plan's list
const v186AsV185 = (html) => {
  const J = v186Pub(html);
  delete J.destDb;
  Object.values(J.appns || {}).forEach(st => { if (st.flow) delete st.flow.dv; });
  Object.values((J.cycDb || {}).byAp || {}).forEach(c => { delete c.dv; delete c.ents; });
  return html.replace(V186RE, (_, a, b, c) => a + JSON.stringify(J).replace(/</g, '\\u003c') + c);
};
// every requirement's destination BY NAME, in every year the plan holds and every locked cycle
const v186Names = (ev) => JSON.parse(ev(`(function(){
  const nm=function(st){ const o={}; Object.keys((st&&st.dest)||{}).sort().forEach(function(id){ const x=st.dest[id];
    o[id]=(flowEntName(x.to)||'?'+x.to)+(x.end? ' > '+(flowEntName(x.end)||'?'+x.end) : ''); }); return o; };
  const out={};
  Object.keys(MS.years).sort().forEach(function(fy){ out['FY'+fy]=nm(+fy===+MS.cur? S : MS.years[fy]); });
  Object.keys(CYCDB.cycles||{}).sort().forEach(function(c){ Object.keys(CYCDB.cycles[c].years||{}).sort().forEach(function(fy){
    out[c+' FY'+fy]=nm(CYCDB.cycles[c].years[fy]); }); });
  return JSON.stringify(out); })()`));
const v186Ls = (ev) => JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
const v186AZ = (ev) => JSON.parse(ev('JSON.stringify(flowEntsAZ().map(function(e){ return e.n; }))'));
const V186OM_WANT = {
  FY2027: { A: 'Boeing', B: 'Boeing', C: 'NAWCAD Patuxent River > Boeing', D: 'Pratt & Whitney', E: 'zeta works' },
  FY2028: { A: 'Raytheon', D: 'Lockheed Martin' },
  'PB|2027 FY2027': { A: 'Boeing', B: 'Raytheon', C: 'NAWCAD Patuxent River > Boeing', D: 'Pratt & Whitney', E: 'zeta works' },
  'PB|2027 FY2028': { A: 'Raytheon', D: 'Lockheed Martin' } };
const V186FF_WANT = { FY2027: { F: 'Raytheon', G: 'Acme Corp', H: 'zeta works' }, FY2028: { F: 'Lockheed Martin Aeronautics' } };
const V186AZ_WANT = ['Acme Corp', 'Boeing', 'Defense Logistics Agency', 'FRC East, Cherry Point', 'Lockheed Martin',
  'Lockheed Martin Aeronautics', 'NAWCAD Lakehurst', 'NAWCAD Patuxent River', 'NAWCWD China Lake', 'OC-ALC Oklahoma City',
  'Pratt & Whitney', 'Raytheon', 'zeta works'];
// the first spelling seen is the one kept: opened from Full Fund first, its spellings lead
const v186Spell = (o) => JSON.parse(JSON.stringify(o).replace(/"Raytheon"/g, '"RAYTHEON"').replace(/zeta works/g, 'Zeta Works')
  .replace(/"(Raytheon|RAYTHEON)"/g, '"RAYTHEON"'));
let V186L = null;
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.86 — the four lists become one, and no requirement moves';
  try {
  const F = v186Legacy(null, 'FULL FUND', V185.ff, V186FF, { F: d('x1'), G: d('x2'), H: d('x3') }, { F: d('lm') }, false, {});
  const O = v186Legacy(F.ev('buildSavedHtml()'), null, V185.om, V186OM,
    { A: d('pw'), B: d('x1'), C: d('pax', 'pw'), D: d('x3'), E: d('x2') }, { A: d('x1'), D: d('lm') }, true, { B: d('pw') });
  const L = v186AsV185(O.ev('buildSavedHtml()'));
  const LJ = v186Pub(L);
  chk(name, 'fixture', 'the file is what v1.85 wrote: a list in each plan and none for the board',
    [!!LJ.destDb, !!LJ.appns.om.flow.dv, !!LJ.appns.ff.flow.dv, LJ.appns.om.flow.ents.length, LJ.appns.ff.flow.ents.length, !!LJ.cycDb.byAp.om.dv].join(','),
    'false,false,false,12,11,false');
  chk(name, 'fixture', 'and O&M holds a locked cycle', Object.keys(LJ.cycDb.byAp.om.cycles).join(','), 'PB|2027');
  V186L = L;

  // (i) O&M OPENED FIRST, in a browser that has never held this board
  const A = boot({ html: L });
  chk(name, 'O&M first', 'every requirement keeps its destination, every year and the locked cycle', JSON.stringify(v186Names(A.ev)), JSON.stringify(V186OM_WANT));
  chk(name, 'O&M first', 'the list is both appropriations’ names, each once, A to Z', JSON.stringify(v186AZ(A.ev)), JSON.stringify(V186AZ_WANT));
  chk(name, 'O&M first', 'two different names are never merged (Lockheed Martin and Lockheed Martin Aeronautics)',
    A.ev(`flowEntsAZ().filter(function(e){ return /^lockheed/i.test(e.n); }).length`), 2);
  chk(name, 'O&M first', 'a name that differs only in case or spacing is merged (Raytheon, zeta works)',
    A.ev(`flowEnts().filter(function(e){ return /^(raytheon|zeta works)$/i.test(e.n); }).length`), 2);
  chk(name, 'O&M first', 'an unnamed placeholder nobody used is not carried', A.ev(`flowEnts().some(function(e){ return e.n==='New destination'; })`), false);
  chk(name, 'O&M first', 'match terms are combined', A.ev(`[destByName('Raytheon').t, destByName('zeta works').t].join(' | ')`), 'RTX, RAYTHEON, RAY | ZETA');
  chk(name, 'O&M first', 'the kind the two disagree on is named for you to settle',
    A.ev(`JSON.stringify(DESTDB.conflicts.map(function(c){ return flowEntName(c.k)+'|'+c.from+'|'+c.kind; }))`), '["Raytheon|ff|gov"]');
  chk(name, 'O&M first', 'and the panel says so', /Named with a different kind on another appropriation: Raytheon \(Full Fund had Government activity\)/.test(A.ev('flowEntEditor()')), true);
  chk(name, 'O&M first', 'the funds flow keeps the order destinations were added, not A to Z',
    A.ev(`flowEnts().map(function(e){ return e.n; }).slice(0,3).join('|')`), 'Lockheed Martin|Boeing|NAWCAD Patuxent River');

  // (ii) FULL FUND FIRST, then O&M in the same browser: here O&M's old "pw" (renamed Boeing) is not
  // the board's Pratt & Whitney, and its x3 IS -- so x3 becomes pw while pw becomes something else.
  const Fb = boot({ html: L, appn: 'FULL FUND' });
  chk(name, 'Full Fund first', 'every Full Fund requirement keeps its destination', JSON.stringify(v186Names(Fb.ev)), JSON.stringify(v186Spell(V186FF_WANT)));
  const Ob = boot({ html: L, appn: 'O&M', ls: v186Ls(Fb.ev) });
  chk(name, 'Full Fund first', 'O&M opened after it in the same browser: every requirement keeps its destination',
    JSON.stringify(v186Names(Ob.ev)), JSON.stringify(v186Spell(V186OM_WANT)));
  chk(name, 'Full Fund first', 'where an old key is another destination’s new one', Ob.ev(`S.dest.D.to+'|'+(S.dest.A.to!=='pw')`), 'pw|true');
  chk(name, 'Full Fund first', 'the same places, A to Z, in Full Fund’s spelling', JSON.stringify(v186AZ(Ob.ev)), JSON.stringify(v186Spell(V186AZ_WANT)));
  // REOPENED BEFORE ANYTHING IS SAVED: the plan is read again from its old list; the cycles, already
  // kept re-pointed, must not be moved a second time
  const Oc = boot({ html: L, appn: 'O&M', ls: v186Ls(Ob.ev) });
  chk(name, 'reopened unsaved', 'every requirement still keeps its destination, the locked cycle included',
    JSON.stringify(v186Names(Oc.ev)), JSON.stringify(v186Spell(V186OM_WANT)));
  chk(name, 'reopened unsaved', 'on the same keys', Oc.ev(`JSON.stringify([S.dest, CYCDB.cycles['PB|2027'].years[2027].dest])`),
    Ob.ev(`JSON.stringify([S.dest, CYCDB.cycles['PB|2027'].years[2027].dest])`));
  const Fc = boot({ html: L, appn: 'FULL FUND', ls: v186Ls(Oc.ev) });
  chk(name, 'reopened unsaved', 'and Full Fund, switched back to', JSON.stringify(v186Names(Fc.ev)), JSON.stringify(v186Spell(V186FF_WANT)));
  chk(name, 'reopened unsaved', 'lands on the keys O&M uses for the same places',
    Fc.ev(`S.dest.F.to+'|'+S.dest.H.to`), Oc.ev(`destByName('raytheon').k+'|'+destByName('zeta works').k`));

  // SAVED, AND REOPENED IN ANOTHER BROWSER: the file carries the list
  const L2 = A.ev('buildSavedHtml()');
  chk(name, 'saved', 'the file carries the board list', (v186Pub(L2).destDb || { ents: [] }).ents.length, 13);
  const A2 = boot({ html: L2 });
  chk(name, 'saved', 'reopened, nothing moved', JSON.stringify(v186Names(A2.ev)), JSON.stringify(V186OM_WANT));
  chk(name, 'saved', 'on the same keys, the same list', A2.ev(`JSON.stringify([MS.years, flowEnts()])`), A.ev(`JSON.stringify([MS.years, flowEnts()])`));
  const F2 = boot({ html: L2, appn: 'FULL FUND' });
  chk(name, 'saved', 'Full Fund from that file keeps its destinations', JSON.stringify(v186Names(F2.ev)), JSON.stringify(V186FF_WANT));
  chk(name, 'saved', 'on the keys O&M uses for the same places', F2.ev(`S.dest.F.to+'|'+S.dest.G.to+'|'+S.dest.H.to`),
    A.ev(`destByName('Raytheon').k+'|'+destByName('Acme Corp').k+'|'+destByName('zeta works').k`));
  chk(name, 'saved', 'and sees the same list', JSON.stringify(v186AZ(F2.ev)), JSON.stringify(V186AZ_WANT));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.86 — added once, there on every appropriation; picked A to Z; removed only when nothing points at it';
  try {
  const A = boot({ html: boot({ html: V186L }).ev('buildSavedHtml()') });
  A.ev(`window.confirm=function(){ return true }; window.alert=function(){}; flowAddEnt(); flowSetEnt(flowEnts().length-1,'n','Aardvark Depot'); 'ok'`);
  const k = A.ev(`destByName('Aardvark Depot').k`);
  chk(name, 'add', 'a new destination gets a key of its own, not the next x', /^d[0-9a-z]{8,}$/.test(k), true);
  chk(name, 'add', 'and reads first, A to Z', v186AZ(A.ev)[0], 'Aardvark Depot');
  chk(name, 'pickers', 'the Goes to bulk list reads A to Z', A.ev(`JSON.stringify(matBulk()['Goes to'].opts.map(function(o){ return o[1].replace(/ \\(gov\\)$/,''); }))`),
    JSON.stringify(['Aardvark Depot'].concat(V186AZ_WANT)));
  chk(name, 'pickers', 'the panel reads A to Z', JSON.stringify([...A.ev('flowEntEditor()').matchAll(/<input[^>]*value="([^"]*)" onchange="flowSetEnt\(\d+,&quot;n&quot;/g)].map(m => m[1].replace(/&amp;/g, '&'))),
    JSON.stringify(['Aardvark Depot'].concat(V186AZ_WANT)));
  const L3 = A.ev('buildSavedHtml()');
  const F = boot({ html: L3, appn: 'FULL FUND' });
  chk(name, 'add', 'Full Fund, opened from the saved file, has it', F.ev(`!!destByName('Aardvark Depot')`), true);
  chk(name, 'add', 'on the same key', F.ev(`destByName('Aardvark Depot').k`), k);
  F.ev(`setDest('G','to','${k}'); 'ok'`);
  chk(name, 'add', 'and a requirement there can go to it', F.ev(`flowEntName(S.dest.G.to)`), 'Aardvark Depot');

  // REMOVING. What another appropriation or a locked cycle points at stays; what nothing points at goes,
  // and a year that is not on screen is cleared too.
  const del = (ev, n) => ev(`(function(){ globalThis.__al=[]; window.alert=function(m){ globalThis.__al.push(String(m)); };
    const i=flowEnts().indexOf(destByName(${JSON.stringify(n)})); flowDelEnt(i); return JSON.stringify([!!destByName(${JSON.stringify(n)}), globalThis.__al.join(' ')]); })()`);
  const acme = JSON.parse(del(A.ev, 'Acme Corp'));
  chk(name, 'remove', 'one Full Fund uses is not removed', acme[0], true);
  chk(name, 'remove', 'and it says where', /requirements point at it on Full Fund \(1\)/.test(acme[1]), true);
  const boe = JSON.parse(del(A.ev, 'Boeing'));
  chk(name, 'remove', 'one a locked cycle names is not removed', boe[0] + '|' + /on O&M locked PB27 \(2\)\./.test(boe[1]), 'true|true');
  A.ev(`MS.years[2028].dest.A={to:'${k}', end:''}; save(); 'ok'`);
  const aa = JSON.parse(del(A.ev, 'Aardvark Depot'));
  chk(name, 'remove', 'one only this plan uses is removed', aa[0], false);
  chk(name, 'remove', 'and cleared from a year not on screen', A.ev(`JSON.stringify(MS.years[2028].dest.A||null)`), 'null');
  const ok = JSON.parse(del(A.ev, 'OC-ALC Oklahoma City'));
  chk(name, 'remove', 'one nothing uses is removed', ok[0], false);
  const L4 = A.ev('buildSavedHtml()');
  const F4 = boot({ html: L4, appn: 'FULL FUND' });
  chk(name, 'remove', 'and does not come back from Full Fund’s old list', F4.ev(`!!destByName('OC-ALC Oklahoma City')`), false);
  chk(name, 'remove', 'while Full Fund keeps every destination it uses', JSON.stringify(v186Names(F4.ev)), JSON.stringify(V186FF_WANT));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.86 — a PMO copy reads the board list, and its submittal lands on the right place';
  try {
  const A = boot({ html: V186L });
  const html = v184Publish(A.ev);
  chk(name, 'publish', 'the copy is written', html.length > 1000, true);
  const P = boot({ html });
  chk(name, 'copy', 'it holds the whole board list, A to Z', JSON.stringify(v186AZ(P.ev)), JSON.stringify(V186AZ_WANT));
  P.ev(`window.confirm=function(){ return true }; flowAddEnt(); flowSetEnt(flowEnts().length-1,'n','Office Depot'); setDest('A','to',destByName('Office Depot').k);
        setDest('B','to',destByName('Acme Corp').k); save(); 'ok'`);
  chk(name, 'copy', 'and never writes the board’s own list in this browser', Object.keys(v186Ls(P.ev)).includes('prio27destdb'), false);
  const sub = v184Submit(P, 'AV');
  chk(name, 'submit', 'the submittal carries the copy’s list', Array.isArray((sub.pkg || {}).dest), true);
  A.ev(`window.alert=function(){}; window.confirm=function(){ return true }; PMOSUBS=[]; PMOPICK={};
        pmoTake(${JSON.stringify(sub.pkg)}, 'av.json'); subPickAll(true); pmoApply(); 'ok'`);
  chk(name, 'take', 'a destination the office added lands under its own name', A.ev(`flowEntName(S.dest.A.to)`), 'Office Depot');
  chk(name, 'take', 'and one from Full Fund’s list under its name', A.ev(`flowEntName(S.dest.B.to)`), 'Acme Corp');
  // A COPY PUBLISHED ON v1.85 sends O&M's old keys and no list: x1 was Raytheon there
  const old = JSON.parse(JSON.stringify(sub.pkg));
  delete old.dest; old.items = { D: { dest: d('x1', 'x3') } }; old.base = { D: { dest: d('x3') } }; old.added = [];
  delete old.rank;
  A.ev(`PMOSUBS=[]; PMOPICK={}; pmoTake(${JSON.stringify(old)}, 'old.json'); 'ok'`);
  chk(name, 'old copy', 'what it started from reads as what the board holds, so it is no conflict',
    A.ev(`JSON.stringify(pmoRows().map(function(r){ return r.id+'|'+r.key+(r.conflict?'!':''); }))`), '["D|dest"]');
  A.ev(`subPickAll(true); pmoApply(); 'ok'`);
  chk(name, 'old copy', 'its old keys are read through O&M’s old list', A.ev(`flowEntName(S.dest.D.to)+' > '+flowEntName(S.dest.D.end)`), 'Raytheon > Pratt & Whitney');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

// ═══ v1.86 — MANDATORY IN EVERY CONSOLIDATED SPEND PLAN ══════════════════════════════════════════
// Brad, 25-26 Sep 2026: wherever the board shows WHEN money lands, the mandatory allocation is in it
// and lands in the months like discretionary. Mandatory rides the requirement's own dates; one rule
// places every dollar on every surface; the ◨ switch moves them all together; the 1A9A adopts the
// rule; the deck gets a chart that ties to the forecast. The fixture is built so each case the rule
// decides is present once: a mandatory-only service on a dated requirement (A's ANG), a single date
// (B), discretionary not yet on a date (C's USN), no date at all (D), and a date in the next year (E).
const V10SV = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'];
const v10It = (id, grp, ask) => ({ ...it(id, grp, ask), title: 'Req ' + id, event: 'Req ' + id });
const V10 = { services: V10SV,
  items: [v10It('A', 'AV', [900, 300, 0, 0, 0, 0]), v10It('B', 'AV', [0, 0, 0, 600, 0, 0]), v10It('C', 'PSM', [0, 0, 0, 0, 0, 1200]),
          v10It('D', 'PSM', [0, 0, 0, 0, 500, 0]), v10It('E', 'TSS', [0, 0, 250, 0, 0, 0])],
  disc: [900, 0, 250, 400, 500, 1000], mand: [0, 300, 0, 200, 0, 200], order: ['A', 'B', 'C', 'D', 'E'] };
const v10Board = () => {
  const B = boot(); seed(B.ev, V10); asBooted(B.ev, V10);
  B.ev(`(function(){ applyState(S); MS.years[MS.cur]=S;
    S.awards.A={mode:'inc', inc:[{d:FYMON[1][0], sv:[500,0,0,0,0,0]}, {d:FYMON[4][0], sv:[400,0,0,0,0,0]}]};
    S.awards.B={mode:'single', d:FYMON[2][0]};
    S.awards.C={mode:'inc', inc:[{d:FYMON[0][0], sv:[0,0,0,0,0,300]}]};
    S.awards.E={mode:'inc', inc:[{d:MS.cur+'-10', sv:[0,0,250,0,0,0]}]};
    save(); return 'ok'; })()`);
  return B;
};
const r2 = v => Math.round(v * 100) / 100;
const V10FC = { m: [500, 666.67, 600, 0, 533.33, 0, 0, 0, 0, 0, 0, 0], u: 1450 };
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.86 — every funded dollar lands in a month or UNSCHEDULED, by one rule';
  try {
  const { ev } = v10Board();
  chk(name, 'fixture', 'the lanes drew what the fixture means', ev(`JSON.stringify(['A','B','C','D','E'].map(function(id){ const p=tiers()[id]; return [p.dT, p.mT]; }))`),
    JSON.stringify([[900, 300], [400, 200], [1000, 200], [500, 0], [250, 0]]));
  const F = JSON.parse(ev(`JSON.stringify((function(){ const F=forecast(); const t={m:FYMON.map(function(){return 0;}),u:0,tot:0};
    F.rollRows.forEach(function(b){ b.m.forEach(function(v,i){ t.m[i]+=v; }); t.u+=b.unsch; t.tot+=b.tot; }); return t; })())`));
  chk(name, 'forecast', 'the months and UNSCHEDULED', JSON.stringify({ m: F.m.map(r2), u: r2(F.u) }), JSON.stringify(V10FC));
  chk(name, 'forecast', 'every funded dollar is in exactly one of them', r2(F.m.reduce((a, b) => a + b, 0) + F.u), r2(F.tot));
  chk(name, 'forecast', 'and that is every dollar drawn', r2(F.tot), 3750);
  chk(name, 'mandatory', 'a service paid only from mandatory, on a dated requirement, lands on its dates (A’s ANG: Nov and Feb, 5:4)',
    ev(`JSON.stringify((function(){ const s=monSpreadOf('A', tiers().A); return [s.m[1][1], s.m[1][4], s.unsch[1]].map(function(v){ return Math.round(v*100)/100; }); })())`),
    JSON.stringify([166.67, 133.33, 0]));
  chk(name, 'mandatory', 'UNSCHEDULED holds only money with no date: C’s undated discretionary, D, and E’s next-year date',
    ev(`JSON.stringify(['A','B','C','D','E'].map(function(id){ const s=monSpreadOf(id, tiers()[id]); return Math.round(s.unsch.reduce(function(a,b){ return a+b; },0)); }))`),
    JSON.stringify([0, 0, 700, 500, 250]));
  chk(name, 'mandatory', 'C’s mandatory rides its own increment with the discretionary that is dated', ev(`Math.round(monSpreadOf('C', tiers().C).m[5][0])`), 500);
  // THE SURFACES AGREE, month by month, to the dollar
  const MS10 = JSON.parse(ev(`JSON.stringify((function(){ const m=FYMON.map(function(){return 0;}); let u=0;
    S.order.forEach(function(id){ const s=monSpreadOf(id, tiers()[id]); s.m.forEach(function(r){ r.forEach(function(v,k){ m[k]+=v; }); }); u+=s.unsch.reduce(function(a,b){return a+b;},0); });
    return {m:m, u:u}; })())`));
  chk(name, 'agree', 'the month sheets’ spread equals the forecast, every month and UNSCHEDULED',
    JSON.stringify({ m: MS10.m.map(r2), u: r2(MS10.u) }), JSON.stringify(V10FC));
  const cr = JSON.parse(ev(`JSON.stringify(crData(null).map(function(s){ return {win:s.win.map(function(v){ return Math.round(v*100)/100; }), nd:Math.round(s.nodate*100)/100, tot:Math.round(s.tot*100)/100}; }))`));
  const crMon = [0, 1, 2, 3, 4, 5].map(k => r2(cr.reduce((a, s) => a + s.win[2 * k] + s.win[2 * k + 1], 0)));
  chk(name, 'agree', 'the CR windows, folded to months, equal the forecast October to March', JSON.stringify(crMon), JSON.stringify(V10FC.m.slice(0, 6)));
  chk(name, 'agree', 'CR No date equals the forecast’s UNSCHEDULED', r2(cr.reduce((a, s) => a + s.nd, 0)), V10FC.u);
  chk(name, 'CR', 'USN: only what is dated is a cash need; the undated discretionary is No date', JSON.stringify([cr[5].win[0], cr[5].nd, cr[5].tot]), JSON.stringify([500, 700, 500]));
  // THE 1A9A ADOPTS THE RULE: C's undated $700 is no longer spread into October
  const x = JSON.parse(ev(`JSON.stringify(crExportRows().map(function(r){ return [r.id, r.wins.map(Math.round)]; }))`));
  chk(name, '1A9A', 'the return carries B in December and C in October at what is dated',
    JSON.stringify(x.map(r => [r[0], r[1].reduce((a, b) => a + b, 0), r[1].findIndex(v => v > 0)])), JSON.stringify([['B', 600, 4], ['C', 500, 0]]));
  // BY PMO, the same rule, and TOTAL IN WINDOW is what lands in the windows
  ev(`crBy='pmo'; 'ok'`);
  const bp = JSON.parse(ev(`JSON.stringify((function(){ const R=crRows(); return R.keys.map(function(k,i){ const b=R.data[i]; return [k, Math.round(b.win.reduce(function(a,c){return a+c;},0)), Math.round(b.nodate), Math.round(b.tot)]; }); })())`));
  chk(name, 'CR by PMO', 'each office’s windows, No date and TOTAL IN WINDOW', JSON.stringify(bp), JSON.stringify([['PSM', 500, 1200, 500], ['AV', 1800, 0, 1800], ['TSS', 0, 250, 0]]));
  ev(`crBy='svc'; 'ok'`);
  // THE PMO TABS' SPEND PLAN, in the workbook
  const sheets = JSON.parse(capture(ev));
  const block = n => { const sh = sheets.find(s => s.name === n); if (!sh) return null;
    const rows = sh.rows.map(r => (r || []).map(cv)); const h = rows.findIndex(r => r[0] === 'Rank' && r.includes('Unscheduled'));
    const tot = rows.slice(h + 1).find(r => /^TOTAL/.test(String(r[0])));
    return tot ? rows[h].map((k, i) => [k, tot[i]]).filter(([k]) => /^(OCT|NOV|DEC|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP) \d\d$|^Unscheduled$/.test(String(k))).map(([, v]) => r2(+v || 0)) : null; };
  const tabs = ['PMO AV', 'PMO PSM', 'PMO TSS'].map(block);
  chk(name, 'agree', 'the PMO tabs’ spend plans add to the forecast, every month and Unscheduled',
    JSON.stringify(tabs.every(Boolean) ? tabs[0].map((v, i) => r2(tabs[0][i] + tabs[1][i] + tabs[2][i])) : tabs),
    JSON.stringify(V10FC.m.concat([V10FC.u])));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.86 — the award block schedules the whole funded amount, and seeds what it counts';
  try {
  const { ev } = v10Board();
  ev(`toggleAwdInc('B', 0); 'ok'`);
  chk(name, 'seed', 'switching to increments seeds discretionary, which is what an increment is', ev(`JSON.stringify(S.awards.B.inc[0].sv)`), JSON.stringify([0, 0, 0, 400, 0, 0]));
  const h = ev(`awardBlockHtml(itemById('B'))`);
  chk(name, 'block', 'the discretionary balance is clear the moment it is switched', /Balance to schedule — discretionary[\s\S]*?✓ \$0/.test(h), true);
  chk(name, 'block', 'and the mandatory has its own row, riding the dates', /Mandatory \\u2014 rides these dates|Mandatory — rides these dates/.test(h) && />\$200</.test(h), true);
  chk(name, 'block', 'nothing moved: B still lands whole in December', ev(`JSON.stringify(monSpreadOf('B', tiers().B).m[3].map(Math.round))`), JSON.stringify([0, 0, 600, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
  ev(`S.awards.A.inc[1].sv[0]=100; save(); 'ok'`);
  ev(`fillLastAwd('A'); 'ok'`);
  chk(name, 'put on last', 'clears the discretionary balance, and with mandatory riding every funded dollar has a date',
    ev(`JSON.stringify([S.awards.A.inc[1].sv[0], Math.round(monSpreadOf('A', tiers().A).unsch.reduce(function(a,b){ return a+b; },0))])`), JSON.stringify([400, 0]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.86 — the ◨ switch moves every spend plan together, and the pot views stay put';
  try {
  const { ev } = v10Board();
  const pots = () => ev(`JSON.stringify((function(){ const P=planCompute(); const T=tiers(); return {plan:[P.aTop, P.bTop], mc:mcCalc(T).need, fit:tierTotals(T).dUsed,
    A:(function(){ const F=forecast(function(id){ const r=P.A[id]; return r? {d:(r.got||[]).slice(), m:SVC.map(function(){return 0;}), dT:(r.got||[]).reduce(function(a,b){return a+(b||0);},0), mT:0} : null; });
      return F.rollRows.reduce(function(a,b){ b.m.forEach(function(v,i){ a[i]+=Math.round(v); }); a[12]+=Math.round(b.unsch); return a; }, Array(13).fill(0)); })()}; })())`);
  const both = pots();
  ev(`setScen('disc'); 'ok'`);
  const disc = pots();
  chk(name, 'pots', 'Two Spend Plans, Plan A, the fit strip and Mission Critical do not move with the switch', disc, both);
  chk(name, 'pots', 'Plan A keeps the discretionary rule: a service with no increment of its own is UNSCH, not spread', JSON.parse(both).A.join(','),
    [1000, 500, 400, 0, 400, 0, 0, 0, 0, 0, 0, 0, 750].join(','));
  const fc = JSON.parse(ev(`JSON.stringify(forecast().rollRows.reduce(function(a,b){ b.m.forEach(function(v,i){ a[i]+=Math.round(v); }); a[12]+=Math.round(b.unsch); return a; }, Array(13).fill(0)))`));
  chk(name, 'switch', 'the forecast withholds mandatory', fc.join(','), [300, 500, 400, 0, 400, 0, 0, 0, 0, 0, 0, 0, 1450].join(','));
  ev(`crBy='pmo'; 'ok'`);
  chk(name, 'switch', 'so does the CR panel by PMO', ev(`JSON.stringify((function(){ const R=crRows(); return R.keys.map(function(k,i){ return [k, Math.round(R.data[i].tot)]; }); })())`),
    JSON.stringify([['PSM', 300], ['AV', 1300], ['TSS', 0]]));
  ev(`crBy='svc'; gsOpen=true; render(); 'ok'`);
  // the fit chart's table: TOTAL row, Mand BA and Mand drawn -- both withheld under the switch
  const fitTot = () => ev(`JSON.stringify((function(){ const t=document.querySelector('#gsBody tr.tot'); return t? [...t.children].map(function(c){ return c.textContent; }) : null; })())`);
  chk(name, 'switch', 'and the fit chart and its table: mandatory withheld, and it says so',
    ev(`/\\u25e8 DISCRETIONARY ONLY/.test(document.getElementById('gsBody').innerHTML)`) + ' ' + JSON.stringify(JSON.parse(fitTot()).slice(7, 9)),
    'true ' + JSON.stringify([ev('fM(0)'), ev('fM(0)')]));
  const sheets = JSON.parse(capture(ev));
  const av = sheets.find(s => s.name === 'PMO AV');
  const rows = av.rows.map(r => (r || []).map(cv));
  const t = rows.findIndex(r => /Requirements \(Disc\/Mand Funded Portions\)/.test(String(r[0])));
  const h = rows.findIndex((r, i) => i > t && r[0] === 'Rank');
  const tot = rows.slice(h + 1).find(r => /^TOTAL/.test(String(r[0])));
  chk(name, 'switch', 'and the PMO tab’s spend plan, marked as the what-if', /◨ DISCRETIONARY ONLY/.test(String(rows[t][0])) + ' ' + tot[rows[h].indexOf('NOV ' + String(ev('MS.cur-1')).slice(-2))], 'true 500');
  ev(`setScen(''); 'ok'`);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.86 — the deck’s spend-plan chart ties to the forecast to the dollar';
  try {
  const { ev } = v10Board();
  const deck = (on) => { ev(`setScen(${JSON.stringify(on ? 'disc' : '')}); window.__sl=null; if(!window.__bp) window.__bp=buildPptx;
    buildPptx=function(s){ window.__sl=s; return window.__bp(s); }; exportPPT(); buildPptx=window.__bp; 'ok'`);
    return JSON.parse(ev('JSON.stringify(window.__sl)')); };
  const sl = deck(false);
  const ch = sl.find(x => /Spend Plan by Month/.test(x));
  chk(name, 'chart', 'the deck carries the chart slide, third', sl.indexOf(ch), 2);
  const bars = [...ch.matchAll(/descr="([^"]+)"/g)].map(m => m[1].replace(/&amp;/g, '&'));
  const val = (lbl, pot) => { const b = bars.find(x => x.startsWith(lbl + ' — ' + pot + ' ')); return b ? +b.split(' $')[1].replace(/,/g, '') : 0; };
  const M = JSON.parse(ev('JSON.stringify(FYMON.map(function(x){ return x[1]; }))'));
  const got = M.concat(['UNSCHEDULED']).map(l => val(l, 'discretionary') + val(l, 'mandatory'));
  chk(name, 'chart', 'every month and UNSCHEDULED is the forecast’s, to the dollar', got.join(','), V10FC.m.concat([V10FC.u]).map(Math.round).join(','));
  chk(name, 'chart', 'each pot, per bar', JSON.stringify(['OCT', 'NOV', 'DEC', 'FEB'].map(p => M.find(m => m.startsWith(p))).map(l => [val(l, 'discretionary'), val(l, 'mandatory')])),
    JSON.stringify([[300, 200], [500, 167], [400, 200], [400, 133]]));
  chk(name, 'chart', 'the figures are printed beneath every bar, and the total', /<a:t>TOTAL<\/a:t>/.test(ch) && (ch.match(/<a:tr /g) || []).length === 4, true);
  chk(name, 'chart', 'no what-if marker on the funded plan', /DISCRETIONARY ONLY/.test(ch), false);
  const sl2 = deck(true);
  const ch2 = sl2.find(x => /Spend Plan by Month/.test(x));
  chk(name, 'switch', 'under the switch it says so, and carries no mandatory', /◨ DISCRETIONARY ONLY/.test(ch2) + ' ' + /mandatory \$/.test(ch2), 'true false');
  ev(`setScen(''); 'ok'`);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();


// ═══ v1.86 — SET HIGHER THAN IT DRAWS: FOUND, FLAGGED AND FIXED ══════════════════════════════════
// Brad, 26 Sep 2026: A (the counter in the fit strip, which filters), B (the flag on the row), C (the
// fix list with set to drawn), mandatory as well as discretionary. The fixture has every reason a typed
// figure goes undrawn -- a discretionary lane dry above the rank (B's USAF and ANG), a mandatory lane
// dry (B's ANG), a figure typed above the requirement value (C's AFRC) -- and two that must NOT be
// flagged: a requirement on the lane walk that is short (D) and a split that drew in full (A, E).
const V13 = { services: MINE,
  items: [it('A', 'AV', [300, 0, 0]), it('B', 'AV', [400, 300, 0]), it('C', 'PSM', [0, 0, 300]), it('D', 'PSM', [100, 0, 0]), it('E', 'TSS', [0, 0, 100])],
  disc: [500, 150, 1000], mand: [0, 60, 0], order: ['A', 'B', 'C', 'D', 'E'],
  fsrc: { A: { m: 'split', dv: [300, 0, 0], mv: [0, 0, 0] }, B: { m: 'split', dv: [400, 200, 0], mv: [0, 100, 0] },
          C: { m: 'split', dv: [0, 0, 500], mv: [0, 0, 0] }, E: { m: 'split', dv: [0, 0, 100], mv: [0, 0, 0] } } };
const v13Board = (html) => {
  const B = boot(html ? { html } : {}); seed(B.ev, V13); asBooted(B.ev, V13);
  B.ev(`applyState(S); S.fsrc=${JSON.stringify(V13.fsrc)}; MS.years[MS.cur]=S; save(); render(); 'ok'`);
  return B;
};
// every funded dollar, both unfunded readings and the shortfall, per requirement and service
const v13Money = (ev) => JSON.parse(ev(`JSON.stringify((function(){ const T=tiers(); const o={};
  S.order.forEach(function(id){ const it=itemById(id), p=T[id]; o[id]={d:p.d, m:p.m, unf:unfSvcOf(it,p), unf1:discUnfSvcOf(it,p)}; });
  return {req:o, sh:svcShort(T).map(function(x){ return x.s+' '+Math.round(x.short); })}; })())`));
const V13LINES = [['B', 'USAF', 'd', 400, 200, 'USAF discretionary ran out above this rank'],
                  ['B', 'ANG', 'd', 200, 150, 'ANG discretionary ran out above this rank'],
                  ['B', 'ANG', 'm', 100, 60, 'ANG mandatory ran out above this rank'],
                  ['C', 'AFRC', 'd', 500, 300, 'the AFRC requirement value stops at $300']];
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.86 — a typed figure higher than it draws is counted, flagged and listed, and they agree';
  try {
  const { ev } = v13Board();
  const N = JSON.parse(ev('JSON.stringify(ndData())'));
  chk(name, 'list', 'every line, in priority order, with why', JSON.stringify(N.list.map(g => [g.id, V13.services[g.i], g.lane, g.typed, g.drew, g.why])), JSON.stringify(V13LINES));
  chk(name, 'list', 'nothing that drew in full, and nothing on the lane walk', Object.keys(N.ids).sort().join(','), 'B,C');
  chk(name, 'A · counter', 'two requirements, $490 not drawn, in the fit strip', ev(`(function(){ const t=document.getElementById('fitBar').textContent; return /▲ not drawn 2 · /.test(t) && t.indexOf(fMc(490))>=0; })()`), true);
  chk(name, 'A · counter', 'and the fix list beside it', ev(`/\\ud83d\\udd27 fix list/.test(document.getElementById('fitBar').textContent)`), true);
  const flags = JSON.parse(ev(`JSON.stringify(S.order.map(function(id){ const r=document.getElementById('row-'+id); const m=r && r.textContent.match(/▲ (\\S+) not drawn/); return m? m[1] : ''; }))`));
  chk(name, 'B · flag', 'the rows that are set higher carry the flag, with the amount', JSON.stringify(flags), JSON.stringify(['', ev('fMc(290)'), ev('fMc(200)'), '', '']));
  chk(name, 'B · flag', 'its hover names each service and lane, typed, drawn and why',
    ev(`(function(){ const c=[...document.querySelectorAll('#row-B .rchip')].find(function(x){ return /not drawn/.test(x.textContent); }); return c? c.getAttribute('title') : ''; })()`),
    'USAF Disc: typed $400, drew $200 \u2014 USAF discretionary ran out above this rank\nANG Disc: typed $200, drew $150 \u2014 ANG discretionary ran out above this rank\nANG Mand: typed $100, drew $60 \u2014 ANG mandatory ran out above this rank\nClick for the fix list.');
  // THE BY SERVICE TABLE'S "drew" LINES ARE THE SAME FACT: one per line, per requirement
  // the card shows them in the row's By service table, the grid in the RECORD panel's
  chk(name, 'agree', 'each requirement shows one "drew" line per listed line in its By service table',
    ev(`JSON.stringify(S.order.map(function(id){ let h;
      if(fldHasPanel()){ setCur(id); h=document.getElementById('inspector').innerHTML; } else h=svcTable(itemById(id));
      return (h.match(/>drew \\$/g)||[]).length; }))`), JSON.stringify([0, 3, 1, 0, 0]));
  ev(`ndOpen=true; render(); 'ok'`);
  chk(name, 'C · fix list', 'one row per line, and the total', ev(`(function(){ const t=document.querySelector('#ndBody table'); if(!t) return 'none';
    return (t.querySelectorAll('tr').length-2)+' '+(t.querySelector('tr.tot').textContent.indexOf(fM(490))>=0); })()`), '4 true');
  ev(`ndOpen=false; render(); 'ok'`);
  // THE FILTER shows exactly the flagged requirements, and composes with the others
  const shown = () => ev(`JSON.stringify([...document.querySelectorAll('#list .row')].map(function(r){ return r.id.replace('row-',''); }))`);
  ev(`laneFilter='nd'; render(); 'ok'`);
  chk(name, 'filter', 'shows exactly the flagged requirements', shown(), JSON.stringify(['B', 'C']));
  ev(`svcFilter=2; render(); 'ok'`);
  chk(name, 'filter', 'and composes with a service filter', shown(), JSON.stringify(['C']));
  ev(`svcFilter=-1; laneFilter=''; render(); 'ok'`);
  // the ◨ switch is a what-if; what is not drawn is the funded plan's -- every line, what it drew and
  // why, not just how many (under the switch B's ANG mandatory would draw nothing, not $60)
  const ndFunded = ev('JSON.stringify(ndData().list)');
  ev(`setScen('disc'); 'ok'`);
  chk(name, 'switch', 'the ◨ switch does not change what is flagged, what it drew, or why', ev('JSON.stringify(ndData().list)'), ndFunded);
  ev(`setScen(''); 'ok'`);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.86 — set to drawn moves no funded dollar and neither unfunded total, only the shortfall';
  try {
  const { ev } = v13Board();
  const before = v13Money(ev);
  chk(name, 'fixture', 'the shortfall before', JSON.stringify(before.sh), JSON.stringify(['USAF 300', 'ANG 90']));
  const j0 = +ev('(MS.jrnl||[]).length');
  const g0 = JSON.parse(ev('JSON.stringify(ndData().list[0])'));
  ev(`window.confirm=function(){ return true }; ndSetDrawn(0); 'ok'`);
  const one = v13Money(ev);
  chk(name, 'one line', 'the typed figure is now what was drawn', ev('S.fsrc.B.dv[0]'), 200);
  chk(name, 'one line', 'no funded dollar moved, and neither unfunded reading, anywhere',
    JSON.stringify(Object.fromEntries(Object.entries(one.req).map(([k, v]) => [k, [v.d, v.m, v.unf, v.unf1]]))),
    JSON.stringify(Object.fromEntries(Object.entries(before.req).map(([k, v]) => [k, [v.d, v.m, v.unf, v.unf1]]))));
  chk(name, 'one line', 'the shortfall fell by exactly what the line said', JSON.stringify(one.sh) + ' ' + g0.short, JSON.stringify(['USAF 100', 'ANG 90']) + ' 200');
  chk(name, 'one line', 'the line is gone and the rest remain', ev('JSON.stringify(ndData().list.map(function(g){ return g.id+SVC[g.i]+g.lane; }))'), JSON.stringify(['BANGd', 'BANGm', 'CAFRCd']));
  chk(name, 'one line', 'and it is journalled', ev(`(MS.jrnl||[]).slice(${j0}).some(function(e){ return e.p && e.p[0]==='fsrc'; })`), true);
  // A MANDATORY LINE, on its own: the mandatory figure is the one set
  const kM = JSON.parse(ev('JSON.stringify(ndData().list.map(function(g){ return g.id+SVC[g.i]+g.lane; }))')).indexOf('BANGm');
  const gM = JSON.parse(ev(`JSON.stringify(ndData().list[${kM}])`));
  ev(`ndSetDrawn(${kM}); 'ok'`);
  chk(name, 'mandatory line', 'the mandatory figure is set, and only it', ev('JSON.stringify([S.fsrc.B.dv[1], S.fsrc.B.mv[1]])'), '[200,60]');
  chk(name, 'mandatory line', 'the shortfall fell by exactly what the line said', JSON.stringify(v13Money(ev).sh) + ' ' + gM.short, JSON.stringify(['USAF 100', 'ANG 50']) + ' 40');
  const N = JSON.parse(ev('JSON.stringify(ndData())'));
  ev(`globalThis.__cf=''; window.confirm=function(m){ globalThis.__cf=String(m); return true; }; ndSetAll(); 'ok'`);
  chk(name, 'all', 'the confirmation names the lines, the requirements and the total',
    ev('globalThis.__cf').split('\n')[0], `Set all 2 lines on 2 requirements to what they drew?`);
  chk(name, 'all', 'and what the shortfall falls by', ev('globalThis.__cf').indexOf('falls by ' + ev(`fM(${N.shortAll})`)) > 0 && N.shortAll === 50, true);
  const after = v13Money(ev);
  chk(name, 'all', 'no funded dollar moved, and neither unfunded reading, anywhere',
    JSON.stringify(Object.fromEntries(Object.entries(after.req).map(([k, v]) => [k, [v.d, v.m, v.unf, v.unf1]]))),
    JSON.stringify(Object.fromEntries(Object.entries(before.req).map(([k, v]) => [k, [v.d, v.m, v.unf, v.unf1]]))));
  chk(name, 'all', 'the shortfall is D’s alone now: typed above the requirement value was never payable', JSON.stringify(after.sh), JSON.stringify(['USAF 100']));
  chk(name, 'all', 'nothing is flagged, listed or counted', ev(`JSON.stringify([ndData().n, ndData().list.length, document.querySelectorAll('#list .rchip').length && [...document.querySelectorAll('#list .rchip')].filter(function(c){ return /not drawn/.test(c.textContent); }).length])`), '[0,0,0]');
  chk(name, 'all', 'every typed figure is what it drew', ev(`JSON.stringify([S.fsrc.B.dv, S.fsrc.B.mv, S.fsrc.C.dv])`), JSON.stringify([[200, 150, 0], [0, 60, 0], [0, 0, 300]]));
  // A PMO COPY CANNOT SET THE ALLOCATION: the list is there, the fixes are not
  const html = v184Publish(v13Board().ev);
  const P = boot({ html });
  P.ev(`ndOpen=true; render(); 'ok'`);
  chk(name, 'copy', 'a PMO copy lists them but offers no fix', P.ev(`[document.querySelectorAll('#ndBody tr').length>2, /set to drawn|set all to drawn/.test(document.getElementById('ndBody').innerHTML)].join(',')`), 'true,false');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();


// ═══ v1.86 — A FULL BOARD FOR A NEW VERSION; ONE APPROPRIATION OUT AND BACK IN ═════════════════════
// Brad, 26 Sep 2026: "I need first to be able to import a full dashboard from a previous file that way
// when the new version comes out it's seamless. I also need the ability to import or export
// appropriation specific dashboards." The can't-fail is that nothing is lost: every container in the
// previous file arrives unchanged, from files written BY the earlier versions themselves -- v1.80, v1.83
// and v1.85, taken from this project's own history -- and the figures the new board prints from the
// import are the figures it prints from that file's state opened directly.
const V14RE = /(<script type="application\/json" id="pubState">)([\s\S]*?)(<\/script>)/;
const v14Pub = (html) => JSON.parse(html.match(V14RE)[2]);
const v14With = (html, J) => html.replace(V14RE, (_, a, b, c) => a + JSON.stringify(J).replace(/</g, '\\u003c') + c);
const v14Old = (rev) => execFileSync('git', ['show', rev + ':prioritization-board.html'], { cwd: new URL('../..', import.meta.url).pathname, maxBuffer: 1 << 28 }).toString();
const v14Ls = (ev) => JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
// the rich board: three appropriations, two years each, cycles on two, and every board-wide store
const v14Rich = () => {
  const F = v185Board(null, 'FULL FUND', V185.ff, { F: { m: 't', v: 600 } }, { G: { m: 't', v: 400 } }, true, { H: { m: 't', v: 200 } });
  const P = v185Board(F.ev('buildSavedHtml()'), 'INITIAL SPARES', V185.sp, { I: { m: 't', v: 100 } }, { J: { m: 't', v: 60 } }, false, {});
  const O = v185Board(P.ev('buildSavedHtml()'), null, V185.om, { A: { m: 't', v: 1000 } }, { B: { m: 't', v: 300 } }, true, { E: { m: 't', v: 150 } });
  O.ev(`(function(){
    BUDDB={ts:Date.now(), rows:[{ap:'om', svc:'USAF', name:'USAF O&M - CAM Discretionary AV', amt:1234}, {ap:'ff', svc:'ANG', name:'ANG FF Support', amt:567}], files:['bae.xlsx']}; persistBud();
    EXDB={ts:Date.now(), all:{om:{fy:2026, rows:[['JSF5594', 812345]]}, ff:{fy:2026, rows:[['JSF7000', 43210]]}}}; persistExdb();
    ACEDB={ts:Date.now(), sets:{'ACE27':{fp:'fp-1', locked:true, appn:{om:{pmo:{AV:{2027:900}}}}, lines:[]}}}; persistAce();
    RPDB={ts:Date.now(), entries:[{id:'rp1', ts:Date.now(), ap:'om', amt:25000, what:'BTR to FF'}]}; persistRp();
    if(!MS.ppbe) MS.ppbe={}; MS.ppbe['PB|2027']={USAF:{2027:1100}};
    flowAddEnt(); flowSetEnt(flowEnts().length-1,'n','Zulu Depot'); setDest('A','to',destByName('Zulu Depot').k);
    save(); return 'ok'; })()`);
  return O;
};
// what a store says, with each destination read as its name so a re-pointed key is not a difference
const v14Plan = (ev, k) => ev(`(function(){ const st=(${JSON.stringify(k)}===mySlug())? MS : pkgStoreOf(${JSON.stringify(k)}); if(!st) return 'none';
  const L=(st.flow && Array.isArray(st.flow.ents))? st.flow.ents : flowDefEnts();
  const nm=function(key){ const e=L.filter(function(x){ return x.k===key; })[0] || flowEnt(key); return e? e.n : (key||''); };
  const Y=JSON.parse(JSON.stringify(st.years||{}));
  Object.keys(Y).forEach(function(fy){ const D=Y[fy].dest||{}; Object.keys(D).forEach(function(id){ D[id]={to:nm(D[id].to), end:nm(D[id].end)}; }); });
  return JSON.stringify({years:Y, ppbe:st.ppbe||{}, cycle:st.cycle||'', cur:st.cur, base:st.base, pack:!!st.dataPack}); })()`);
const v14Cyc = (ev, k) => ev(`(function(){ const c=(${JSON.stringify(k)}===mySlug())? CYCDB : cycStoreOf(${JSON.stringify(k)}).c; if(!c || !c.cycles) return '{}';
  const o={}; Object.keys(c.cycles).sort().forEach(function(key){ o[key]=Object.keys((c.cycles[key]||{}).years||{}).sort().join(',')+'|'+JSON.stringify((c.cycles[key]||{}).proj||{}); });
  return JSON.stringify(o); })()`);
const v14Stores = (ev) => ev(`JSON.stringify({bud:BUDDB.rows, ex:EXDB.all, ace:ACEDB.sets, rp:RPDB.entries})`);
// what the open appropriation PRINTS: its lanes, and each requirement's value, discretionary,
// mandatory and unfunded per service, from the lane walk -- the figures a brief is read from
const v14Figures = (ev) => ev(`JSON.stringify((function(){ const T=tiers(), X=tierTotals(T);
  return {ap:APPN, disc:S.discSvc, mand:S.mandSvc, tot:[X.dUsed, X.mUsed, X.uAmt, X.u1Amt, X.u2Amt, X.mcNeed].map(function(v){ return Math.round(+v||0); }),
    rows:S.order.map(function(id){ const it=itemById(id), p=T[id];
      return [id, (it.ask||[]).map(function(v){ return Math.round(+v||0); }), p.d.map(Math.round), p.m.map(Math.round), unfSvcOf(it,p).map(Math.round)]; })}; })())`);
let V14 = null;
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.86 — a full board comes across whole, from files written by v1.80, v1.83 and v1.85';
  try {
  const O = v14Rich();
  const L86 = O.ev('buildSavedHtml()');
  V14 = { O, L86 };
  for (const [ver, rev] of [['v1.80', '68b02e9'], ['v1.83', '84dcaf9'], ['v1.85', '77882d9']]) {
    // THE OLD VERSION WRITES ITS OWN FILE: its program, given the state, saves it the way it saved
    const old = boot({ html: v14With(v14Old(rev), v14Pub(L86)) });
    const Lold = old.ev('buildSavedHtml()');
    const J = v14Pub(Lold);
    chk(name, ver, 'the fixture file carries three appropriations', Object.keys(J.appns || {}).sort().join(','), 'ff,om,sp');
    // A NEW BOARD, EMPTY, TAKES IT
    const N = boot();
    const ok = N.ev(`(function(){ window.confirm=function(){ return true; }; window.alert=function(m){ globalThis.__al=String(m); };
      return fullImportText(${JSON.stringify(Lold)}, 'board ${ver}.html'); })()`);
    chk(name, ver, 'the import runs', ok, true);
    const N2 = boot({ ls: v14Ls(N.ev) });
    chk(name, ver, 'and reopens with a report of what arrived', /Full board imported/.test(N2.ev(`document.getElementById('shareStat').innerHTML`)), true);
    // EVERY CONTAINER THE FILE CARRIES, UNCHANGED
    const X = boot({ html: v14With(readFileSync(BOARD, 'utf8'), J) });   // the same state, opened directly by the new version
    for (const k of ['om', 'ff', 'sp']) {
      chk(name, ver, `${k}: its plan, every year, arrived unchanged`, v14Plan(N2.ev, k), v14Plan(X.ev, k));
      chk(name, ver, `${k}: its locked cycles arrived unchanged`, v14Cyc(N2.ev, k), JSON.stringify((() => { const c = ((J.cycDb || {}).byAp || {})[k]; const o = {};
        Object.keys((c && c.cycles) || {}).sort().forEach(key => { o[key] = Object.keys((c.cycles[key] || {}).years || {}).sort().join(',') + '|' + JSON.stringify((c.cycles[key] || {}).proj || {}); }); return o; })()));
    }
    const st = JSON.parse(v14Stores(N2.ev));
    chk(name, ver, 'the BAE list', JSON.stringify(st.bud), JSON.stringify(J.budDb ? J.budDb.rows : JSON.parse(v14Stores(X.ev)).bud));
    chk(name, ver, 'execution data', JSON.stringify(st.ex), JSON.stringify((J.execDb || {}).all || {}));
    chk(name, ver, 'cost estimates', JSON.stringify(st.ace), JSON.stringify((J.aceDb || {}).sets || {}));
    chk(name, ver, 'the reprogramming log', JSON.stringify(st.rp), JSON.stringify((J.rpDb || {}).entries || []));
    chk(name, ver, 'the destination list names every destination the plans use', N2.ev(`!!destByName('Zulu Depot')`), true);
    // THE FIGURES THE NEW BOARD PRINTS ARE THE SAME, imported or opened directly
    const nums = (ev) => JSON.stringify(JSON.parse(capture(ev)).map(sh => [sh.name, sh.rows.map(r => (r || []).map(c => { const v = cv(c); return typeof v === 'number' ? Math.round(v * 100) / 100 : null; }))]));
    chk(name, ver, 'every figure the workbook prints is the same as the file opened directly', nums(N2.ev), nums(X.ev));
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.86 — a full import replaces, after asking about work the board would lose';
  try {
  const { L86 } = V14;
  // a board with work of its own on O&M since the file was saved
  const B = boot({ html: L86 });
  B.ev(`S.titles.A='changed here'; save(); 'ok'`);
  const asked = JSON.parse(B.ev(`(function(){ const q=[]; window.confirm=function(m){ q.push(String(m).split('\\n')[0]); return false; };
    const r=fullImportText(${JSON.stringify(L86)}, 'b.html'); return JSON.stringify([r, q]); })()`));
  chk(name, 'conflict', 'it names the appropriation with work, and a No imports nothing', JSON.stringify(asked), JSON.stringify([false, ['CONFLICT — O&M']]));
  chk(name, 'conflict', 'and nothing changed', B.ev(`S.titles.A`), 'changed here');
  // too old a file is refused, saying so
  const old = JSON.parse(B.ev(`(function(){ let a=''; window.alert=function(m){ a=String(m); };
    const r=fullImportText(${JSON.stringify(L86.replace(/const BUILD='v1\.\d+/, "const BUILD='v1.79"))}, 'old.html'); return JSON.stringify([r, /v1\\.80 onward/.test(a)]); })()`));
  chk(name, 'version', 'a file older than v1.80 is refused, and the message says why', JSON.stringify(old), '[false,true]');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.86 — one appropriation out, worked on, and back in, changing only itself';
  try {
  const { O } = V14;
  const B = boot({ ls: v14Ls(O.ev), html: O.ev('buildSavedHtml()') });
  const before = { om: v14Plan(B.ev, 'om'), sp: v14Plan(B.ev, 'sp'), st: v14Stores(B.ev) };
  const F1 = B.ev(`oneAppnHtml('ff')`);
  const J1 = v14Pub(F1);
  chk(name, 'out', 'the file holds Full Fund alone', Object.keys(J1.appns).join(',') + '|' + J1.only, 'ff|FULL FUND');
  chk(name, 'out', 'its locked cycles, its execution data and its BAE rows, and no other appropriation’s',
    JSON.stringify([Object.keys(J1.cycDb.byAp), Object.keys(J1.execDb.all), J1.budDb.rows.map(r => r.ap)]), JSON.stringify([['ff'], ['ff'], ['ff']]));
  // IT OPENS ON FULL FUND, as a working board, in a browser that has never held this board
  const W = boot({ html: F1 });
  chk(name, 'open', 'it opens on Full Fund, with its plan', W.ev(`APPN+'|'+S.order.join(',')`), 'FULL FUND|F,G,H');
  // and prints exactly what the whole board prints for Full Fund, opened on it in the same browser
  const FF = boot({ ls: v14Ls(B.ev), html: O.ev('buildSavedHtml()'), appn: 'FULL FUND' });
  chk(name, 'open', 'every figure is the one the whole board prints for Full Fund', v14Figures(W.ev), v14Figures(FF.ev));
  W.ev(`S.titles.F='Renamed by the Full Fund lead'; save(); blCyc='BES'; blYr=MS.cur; cycLock(); save(); 'ok'`);
  // the lead also imports a newer CCaR pull for Full Fund: the file's execution data is newer than the
  // board's, so taking it back must merge it -- Full Fund's replaced, every other appropriation's kept
  W.ev(`EXDB.all.ff={fy:2026, rows:[['JSF7000', 55555]]}; EXDB.ts=Date.now()+5000; persistExdb(); save(); 'ok'`);
  const F2 = W.ev('buildSavedHtml()');
  // BACK IN, as one appropriation
  B.ev(`(function(){ window.confirm=function(){ return true; }; window.alert=function(){};
    const txt=${JSON.stringify(F2)}; const st=JSON.parse(txt.match(/<script type="application\\/json" id="pubState">([\\s\\S]*?)<\\/script>/)[1]);
    consTakeApply(st, txt, 'ff.html', ['ff'], true); return 'ok'; })()`);
  const B2 = boot({ ls: v14Ls(B.ev), html: O.ev('buildSavedHtml()') });
  chk(name, 'in', 'Full Fund came back with the lead’s change', B2.ev(`JSON.stringify(((pkgStoreOf('ff').years||{})[pkgStoreOf('ff').cur]||{}).titles)`).indexOf('Renamed by the Full Fund lead') >= 0, true);
  chk(name, 'in', 'and the cycle the lead locked', Object.keys(JSON.parse(v14Cyc(B2.ev, 'ff'))).some(k => /^BES\|/.test(k)), true);
  chk(name, 'in', 'O&M did not change', v14Plan(B2.ev, 'om'), before.om);
  chk(name, 'in', 'Initial Spares did not change', v14Plan(B2.ev, 'sp'), before.sp);
  const st2 = JSON.parse(v14Stores(B2.ev)), st0 = JSON.parse(before.st);
  const exBut = (x) => JSON.stringify(Object.keys(x || {}).filter(k => k !== 'ff').sort().map(k => [k, x[k]]));
  chk(name, 'in', 'the lead’s newer execution pull for Full Fund came back with it', JSON.stringify((st2.ex || {}).ff), JSON.stringify({ fy: 2026, rows: [['JSF7000', 55555]] }));
  chk(name, 'in', 'and every other appropriation’s execution data is as it was', exBut(st2.ex), exBut(st0.ex));
  chk(name, 'in', 'and O&M’s is there at all', !!(st2.ex && st2.ex.om), true);
  chk(name, 'in', 'the BAE list, the cost estimates and the log did not change', JSON.stringify([st2.bud, st2.ace, st2.rp]), JSON.stringify([st0.bud, st0.ace, st0.rp]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.86 — the File menu, grouped, and the PMO copy under it';
  try {
  const { O } = V14;
  const B = boot({ html: O.ev('buildSavedHtml()') });
  const lab = JSON.parse(B.ev(`JSON.stringify([...document.querySelectorAll('#dd_share .mlbl')].map(function(n){ return n.textContent; }))`));
  chk(name, 'File', 'Save, Import, Export, Team', lab.join(' | '), 'Save | Import | Export | Team');
  const items = B.ev(`document.getElementById('dd_share').textContent`);
  const order = ['Save', 'Save a copy', 'Import a full board (new version)', 'Import one appropriation', 'Import several boards at once', 'Appropriation packages',
    'Export one appropriation', 'Publish PMO copy', 'Live view'].map(t => items.indexOf(t));
  chk(name, 'File', 'every entry is there, in that order', order.every((v, i) => v >= 0 && (i === 0 || v > order[i - 1])), true);
  chk(name, 'Budget year', 'the PMO copy is no longer under Budget year', /Publish PMO copy|Review submittals|Submit input/.test(B.ev(`document.getElementById('dd_by').textContent`)), false);
  const P = boot({ html: v184Publish(B.ev) });
  chk(name, 'copy', 'in a copy, ✉ Submit input is under File, and the bar button stays',
    /Submit input/.test(P.ev(`document.getElementById('dd_share').textContent`)) + ' ' + /Submit input/.test(P.ev(`document.getElementById('subBanner').textContent`)), 'true true');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();


// ═══ v1.86 — THE GUIDE, INSIDE THE FILE ══════════════════════════════════════════════════════════
// Brad, 25 Sep 2026: "Can we add the help file to the tool itself so that when we push it out, everyone
// has access to it?" -- "I don't want it to automatically pop up but I want it to be available" --
// "Include both". It opens only from a 📖 button, on its contents; it carries the board's own version;
// it loads nothing from outside the file; and reading it changes nothing. (Every menu path and button
// it names is checked against both builds' real menus by tools/menu-paths.mjs, in a browser.)
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.86 — the help guide: in the file, opened only from 📖, and it changes nothing';
  try {
  const { ev } = v184Board();
  const shut = () => !/\bopen\b/.test(ev(`document.getElementById('helpPanel').className`));
  chk(name, 'never by itself', 'the board opens with the guide closed', shut(), true);
  chk(name, 'never by itself', 'and only a 📖 button opens it', ev(`JSON.stringify([...document.querySelectorAll('[onclick]')].filter(function(e){ return e.getAttribute('onclick').indexOf('openHelp(')>=0; }).map(function(e){ return e.id || e.textContent.trim(); }))`), JSON.stringify(['helpBtn']));
  const doc = ev(`document.getElementById('helpDoc').innerHTML`);
  chk(name, 'offline', 'it loads nothing from outside the file', /https?:\/\/|<img|<link|<script|<iframe|url\(/i.test(doc), false);
  chk(name, 'size', 'it adds under 60 KB to the file', doc.length < 60000, true);
  const money = () => ev(`JSON.stringify({ms:MS.years, ls:(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return o; })()})`);
  const before = money();
  ev(`openHelp(''); 'ok'`);
  chk(name, 'opens', 'on its contents, both parts', ev(`JSON.stringify([...document.querySelectorAll('#helpBody .hx-ph')].map(function(e){ return e.textContent; }))`),
    JSON.stringify(['For programme offices', 'For the portfolio team']));
  chk(name, 'opens', 'carrying the board’s own version', ev(`document.getElementById('helpVer').textContent===BUILD`), true);
  const secs = JSON.parse(ev(`JSON.stringify(helpSections().map(function(s){ return [s.part, s.id, s.t]; }))`));
  chk(name, 'opens', 'the offices’ part and the portfolio team’s part are both there', [secs.filter(s => s[0] === 'office').length > 8, secs.filter(s => s[0] === 'team').length > 8].join(','), 'true,true');
  // EVERY SECTION OPENS, under its own title, with this build's paragraphs only
  const build = ev(`fldHasPanel()? 'grid' : 'card'`);
  let bad = [];
  const other = [];
  secs.forEach(([, id, t]) => { ev(`helpGo(${JSON.stringify(id)}); 'ok'`);
    const h2 = ev(`(document.querySelector('#helpBody h2')||{}).textContent||''`);
    if (h2 !== t) bad.push(id + ': ' + h2);
    if (ev(`[...document.querySelectorAll('#helpBody [data-b]')].some(function(n){ return n.getAttribute('data-b')!==${JSON.stringify(build)}; })`)) other.push(id); });
  chk(name, 'sections', 'every section opens under its own title', bad.join('; ') || 'all', 'all');
  chk(name, 'sections', 'and no section carries a paragraph written for the other build', other.join(', ') || 'none', 'none');
  ev(`helpGo('o-find'); 'ok'`);
  chk(name, 'sections', 'a section reads this build’s way of working, not the other’s',
    /RECORD<\/b> panel on the right/.test(ev(`document.getElementById('helpBody').innerHTML`)) === (build === 'grid'), true);
  ev(`helpGo('o-what'); 'ok'`);
  ev(`(function(){ const a=document.querySelector('#helpBody a[data-go]'); if(a) a.onclick(); return 'ok'; })()`);
  chk(name, 'sections', 'a link inside the guide goes to its section', ev(`(document.querySelector('#helpBody h2')||{}).textContent`), 'Send it back');
  ev(`document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'})); 'ok'`);
  chk(name, 'closes', 'Esc closes it', shut(), true);
  chk(name, 'nothing moves', 'opening, reading and closing it changes nothing stored and no figure', money(), before);
  // A PMO COPY: the guide is there, closed, and its bar opens it on the offices' part
  const P = boot({ html: v184Publish(ev) });
  chk(name, 'copy', 'a PMO copy opens with the guide closed', /\bopen\b/.test(P.ev(`document.getElementById('helpPanel').className`)), false);
  chk(name, 'copy', 'its bar carries 📖 How this copy works', /How this copy works/.test(P.ev(`document.getElementById('subBanner').textContent`)), true);
  P.ev(`(function(){ const b=[...document.querySelectorAll('#subBanner button')].find(function(x){ return /How this copy works/.test(x.textContent); }); b.click(); return 'ok'; })()`);
  chk(name, 'copy', 'and it opens on the offices’ part', P.ev(`(document.querySelector('#helpBody .hx-part.on .hx-ph')||{}).textContent`), 'For programme offices');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
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
