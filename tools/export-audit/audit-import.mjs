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
    // v1.95: the WBS lines and the CLIN grid's own figures, which svcRemapState did not reorder
    wbs: { A: [{ w: '1.1', v: ident.slice() }, { w: '1.2', v: ident.slice() }] },
    clinWbs: { A: { b0: [{ w: '2.1', v: ident.slice() }, { w: '2.2', v: ident.slice() }] } },
    clinAlloc: { A: { b0: ident.slice(), n1: ident.slice() }, B: [ident.slice(), ident.slice()] },
    clinMeta: { A: { b0: { ask: ident.slice() } } },
    clinNew: { A: [{ key: 'n1', clin: '3001', desc: '', ccar: '', ask: ident.slice() }] },
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
  // v1.89: the list is REQ_MAPS, the one list of what a year keeps per requirement, which yearCopy()
  // normalises from and delete and move-to-year purge by.
  const listM = /const REQ_MAPS=(\[[^\]]*\]);/.exec(src);
  const KEYS = listM ? listM[1].match(/'([a-zA-Z]+)'/g).map(x => x.slice(1, -1)) : [];
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
  // v1.95 (item 51): it names its services, as every submittal a copy writes does -- one with per-service figures
  // and no list is refused now, which the 'no list' check below holds
  const pkg = { spmtPkg: 1, dir: 'submit', ap: '', fy: 2027, ts: Date.now(), by: 'PMO Lead', svc: MINE,
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
  // v1.95 (item 51): REFUSED, where it used to ask "Review it anyway?" -- a yes read every figure by position
  N.ev(`window.__q=''; window.alert=function(m){ window.__q=String(m); };
    window.confirm=function(m){ window.__q=m; return true; };
    pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
      items:{A:{asks:[1,2,3,4,5,6]}}, base:{A:{asks:[0,0,0,0,0,0]}}},'s.json'); 'ok'`);
  chk(name, 'no list', 'a listless submittal with per-service figures is refused, and says why',
    N.ev(`/does not say which services/.test(window.__q) && /Nothing was loaded/.test(window.__q)`) ? 'refused' : 'read it anyway', 'refused');
  chk(name, 'no list', 'nothing is held for review', N.ev('PMOSUBS.length===0'), true);
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
// v1.91 (item 35): A BUDGET CHOSEN IN A COPY'S RECORD PANEL, ON A LINE WITH NO MONEY YET, TRAVELS. The
// office picks through the rendered picker -- not by writing S -- the package carries the choice under the
// lane its name carries, and at the board it lands and is used once that lane pays the requirement.
// v1.92, revised before merge: a line with no money carries UNFUNDED dollars, which go on a discretionary or
// lane-less budget -- so the copy's picker offers no mandatory name there, and the office picks a discretionary one.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.91 — a BAE budget chosen in a copy’s RECORD panel travels';
  try {
  const MAND = 'USAF O&M - ANG CAM OBBBA Mandatory AV', DISC = 'USAF O&M - ANG CAM Discretionary AV';
  const sc = { services: MINE, items: [it('A', 'AV', [900, 200, 100]), it('B', 'AV', [0, 60, 0])],
    disc: [2000, 200, 300], mand: [500, 0, 80], order: ['A', 'B'] };
  const B = boot(); seed(B.ev, sc); asBooted(B.ev, sc);
  B.ev(`applyState(S);
    BUDDB={ts:1700000000021, files:[], rows:['USAF O&M - ANG CAM Discretionary AV', ${JSON.stringify(MAND)},
      'USAF O&M- CAM Discretionary AV', 'USAF O&M - CAM OBBBA Mandatory AV'].map(budParseName).filter(Boolean)};
    _budRegCache=null; save(); 'ok'`);
  chk(name, 'board', 'B asks ANG money no lane has left', B.ev(`JSON.stringify(budLines('B'))`), JSON.stringify([{ svc: 'ANG', lane: '' }]));
  const P = boot({ html: v184Publish(B.ev) });
  const pick = n => P.ev(`(function(){ setCur('B');
    var s=document.querySelector('#inspector select[aria-label="BAE budget, ANG not funded yet"]');
    if(!s) return 'no picker'; s.value=${JSON.stringify(n)}; if(s.value!==${JSON.stringify(n)}) return 'not offered';
    s.dispatchEvent(new Event('change')); return 'ok'; })()`);
  chk(name, 'copy', 'the copy’s not-funded-yet line offers no mandatory name', pick(MAND), 'not offered');
  chk(name, 'copy', 'the office picks a discretionary one on it', pick(DISC), 'ok');
  const sub = v184Submit(P, 'AV');
  chk(name, 'copy', 'the submittal carries it, under the lane the name carries',
    JSON.stringify(((sub.pkg || { items: {} }).items.B || {}).budgetAsg), JSON.stringify({ 'ANG|disc': DISC }));
  B.ev(`window.alert=function(){}; window.confirm=function(){ return true }; PMOSUBS=[]; PMOPICK={};
    pmoTake(${JSON.stringify(sub.pkg)}, 'av.json'); subPickAll(true); pmoApply(); 'ok'`);
  chk(name, 'board', 'it lands on the board', B.ev(`JSON.stringify((S.budgetAsg||{}).B||null)`), JSON.stringify({ 'ANG|disc': DISC }));
  B.ev(`S.discSvc[1]=260; render(); 'ok'`);
  chk(name, 'board', 'and once discretionary pays B, its line is on that budget', B.ev(`budForRow('B','ANG','disc')`), DISC);
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
  chk(name, 'board', 'the live board still offers Save', ev(`syncBtns(); document.getElementById('saveBtn').textContent`), 'Save');
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
// and lands in the months like discretionary. One rule places every dollar on every surface; the ◨
// switch moves them all together; the 1A9A adopts the rule; the deck gets a chart that ties to the
// forecast. v1.93 (item 40) CHANGED THE RULE, and these figures with it: an award is the whole award,
// both lanes, discretionary filling forward from the first and mandatory backward from the last, and
// what the awards do not cover is UNSCHEDULED in either lane. The fixture is built so each case the rule
// decides is present once: a mandatory-only service with no award of its own (A's ANG -- it rode A's
// dates until v1.93, and is UNSCHEDULED now), a single date (B, both lanes in its month), an award
// smaller than the discretionary (C's USN: the $300 award is all discretionary, the rest of it and all
// the mandatory UNSCHEDULED), no date at all (D), and a date in the next year (E).
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
const V10FC = { m: [300, 500, 600, 0, 400, 0, 0, 0, 0, 0, 0, 0], u: 1950 };
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
  chk(name, 'mandatory', 'a service paid only from mandatory, with no award of its own, is UNSCHEDULED until an award covers it (A’s ANG, v1.93)',
    ev(`JSON.stringify((function(){ const s=monSpreadOf('A', tiers().A); return [s.m[1][1], s.m[1][4], s.unsch[1]].map(function(v){ return Math.round(v*100)/100; }); })())`),
    JSON.stringify([0, 0, 300]));
  chk(name, 'mandatory', 'UNSCHEDULED holds only money the awards do not cover: A’s ANG, C’s undated discretionary and its mandatory, D, and E’s next-year date',
    ev(`JSON.stringify(['A','B','C','D','E'].map(function(id){ const s=monSpreadOf(id, tiers()[id]); return Math.round(s.unsch.reduce(function(a,b){ return a+b; },0)); }))`),
    JSON.stringify([300, 0, 900, 500, 250]));
  chk(name, 'mandatory', 'C’s $300 award is all discretionary: mandatory finds no room in it', ev(`Math.round(monSpreadOf('C', tiers().C).m[5][0])`), 300);
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
  chk(name, 'CR', 'USN: only what is dated is a cash need; what the award does not cover is No date', JSON.stringify([cr[5].win[0], cr[5].nd, cr[5].tot]), JSON.stringify([300, 900, 300]));
  // THE 1A9A ADOPTS THE RULE: C's undated $700 is not spread into October, nor (v1.93) its mandatory
  const x = JSON.parse(ev(`JSON.stringify(crExportRows().map(function(r){ return [r.id, r.wins.map(Math.round)]; }))`));
  chk(name, '1A9A', 'the return carries B in December and C in October at what is dated',
    JSON.stringify(x.map(r => [r[0], r[1].reduce((a, b) => a + b, 0), r[1].findIndex(v => v > 0)])), JSON.stringify([['B', 600, 4], ['C', 300, 0]]));
  // BY PMO, the same rule, and TOTAL IN WINDOW is what lands in the windows
  ev(`crBy='pmo'; 'ok'`);
  const bp = JSON.parse(ev(`JSON.stringify((function(){ const R=crRows(); return R.keys.map(function(k,i){ const b=R.data[i]; return [k, Math.round(b.win.reduce(function(a,c){return a+c;},0)), Math.round(b.nodate), Math.round(b.tot)]; }); })())`));
  chk(name, 'CR by PMO', 'each office’s windows, No date and TOTAL IN WINDOW', JSON.stringify(bp), JSON.stringify([['PSM', 300, 1400, 300], ['AV', 1500, 300, 1500], ['TSS', 0, 250, 0]]));
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
  // v1.93 (item 40): an award is the whole award, so the block counts both lanes and seeds both.
  try {
  const { ev } = v10Board();
  ev(`toggleAwdInc('B', 0); 'ok'`);
  chk(name, 'seed', 'switching to increments seeds the whole funded amount, both lanes, which is what an award is', ev(`JSON.stringify(S.awards.B.inc[0].sv)`), JSON.stringify([0, 0, 0, 600, 0, 0]));
  const h = ev(`awardBlockHtml(itemById('B'))`);
  chk(name, 'block', 'the balance, both lanes, is clear the moment it is switched', /Balance to schedule — discretionary \+ mandatory[\s\S]*?✓ \$0/.test(h), true);
  chk(name, 'block', 'and the one award says how it splits', /class="awdsplit"[^>]*>\$400 disc \+ \$200 mand</.test(h), true);
  chk(name, 'block', 'nothing moved: B still lands whole in December', ev(`JSON.stringify(monSpreadOf('B', tiers().B).m[3].map(Math.round))`), JSON.stringify([0, 0, 600, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
  ev(`S.awards.A.inc[1].sv[0]=100; save(); 'ok'`);
  ev(`fillLastAwd('A'); 'ok'`);
  chk(name, 'put on last', 'clears the balance in both lanes, per service: USAF’s discretionary and ANG’s mandatory, so every funded dollar has a date',
    ev(`JSON.stringify([S.awards.A.inc[1].sv[0], S.awards.A.inc[1].sv[1], Math.round(monSpreadOf('A', tiers().A).unsch.reduce(function(a,b){ return a+b; },0))])`), JSON.stringify([400, 300, 0]));
  chk(name, 'put on last', 'and ANG’s mandatory lands on the latest award, February', ev(`Math.round(monSpreadOf('A', tiers().A).m[1][4])`), 300);
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
    JSON.stringify([[300, 0], [500, 0], [400, 200], [400, 0]]));
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
  // v1.90: the row's flag is a status now; the fix list opens from Needs attention, and the hover says so
  chk(name, 'B · flag', 'its hover names each service and lane, typed, drawn and why',
    ev(`(function(){ const c=[...document.querySelectorAll('#row-B .exc')].find(function(x){ return /not drawn/.test(x.textContent); }); return c? c.getAttribute('title') : ''; })()`),
    'USAF Disc: typed $400, drew $200 \u2014 USAF discretionary ran out above this rank\nANG Disc: typed $200, drew $150 \u2014 ANG discretionary ran out above this rank\nANG Mand: typed $100, drew $60 \u2014 ANG mandatory ran out above this rank\nThe fix list is under Needs attention, at the top.');
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
  chk(name, 'all', 'nothing is flagged, listed or counted', ev(`JSON.stringify([ndData().n, ndData().list.length, [...document.querySelectorAll('#list .exc')].filter(function(c){ return /not drawn/.test(c.textContent); }).length])`), '[0,0,0]');
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
// the card build until v1.87 (retired in v1.88, so it lives only in the history); pass the file for another
const v14Old = (rev, file = 'prioritization-board.html') => execFileSync('git', ['show', rev + ':' + file], { cwd: new URL('../..', import.meta.url).pathname, maxBuffer: 1 << 28 }).toString();
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
  const name = 'v1.86 — a full board comes across whole, from files written by v1.80, v1.83, v1.85 and v1.87 (both builds)';
  try {
  const O = v14Rich();
  const L86 = O.ev('buildSavedHtml()');
  V14 = { O, L86 };
  // v1.88: the card build is retired, so the last file it could ever write -- v1.87's -- has to come across
  // whole into the grid, and so does the v1.87 grid file every board in use today was saved by.
  for (const [ver, rev, file] of [['v1.80', '68b02e9'], ['v1.83', '84dcaf9'], ['v1.85', '77882d9'],
                                   ['v1.87 card', '1589749'], ['v1.87 grid', '1589749', 'prioritization-board-grid.html']]) {
    // THE OLD VERSION WRITES ITS OWN FILE: its program, given the state, saves it the way it saved
    const old = boot({ html: v14With(v14Old(rev, file), v14Pub(L86)) });
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
    const r=fullImportText(${JSON.stringify(L86.replace(/const BUILD='v\d+\.\d+/, "const BUILD='v1.79"))}, 'old.html'); return JSON.stringify([r, /v1\\.80 onward/.test(a)]); })()`));
  chk(name, 'version', 'a file older than v1.80 is refused, and the message says why', JSON.stringify(old), '[false,true]');
  // v1.99: THE STAMP IS FOUND WHATEVER THE MAJOR NUMBER. The pattern above read v1.x only, so from v2.00 it would leave the
  // file unchanged and the check would pass for the wrong reason; it is checked to have replaced the stamp.
  chk(name, 'version', 'the test’s own pattern finds the stamp (it is replaced, not left as it was)',
    /const BUILD='v1\.79/.test(L86.replace(/const BUILD='v\d+\.\d+/, "const BUILD='v1.79")), true);
  // AND THE BOARD READS A VERSION AS (major, minor), never as a decimal: v1.100 is after v1.99, v1.9 is before v1.80
  const ver = JSON.parse(B.ev(`JSON.stringify(${JSON.stringify(["v1.99 (6 Oct 2026)", "v2.00 (1 Nov 2026)", "v2.10", "v1.100", "v1.9", "vX.Y", "v2'", "1.99", "v.99", ""])}.map(function(v){
      return fullBuildOf("const BUILD='"+v+"';"); }))`));
  chk(name, 'version', 'v1.99, v2.00, v2.10, v1.100 and v1.9 read as (major, minor); vX.Y, v2, 1.99, v.99 and none read as no version',
    JSON.stringify(ver), JSON.stringify([[1, 99], [2, 0], [2, 10], [1, 100], [1, 9], null, null, null, null, null]));
  const gate = JSON.parse(B.ev(`(function(){ const said=[]; window.alert=function(m){ said.push(String(m)); }; window.confirm=function(){ return false; };
      return JSON.stringify(${JSON.stringify(["v2.00", "v1.100", "v1.9", "vX.Y"])}.map(function(v){ said.length=0;
        fullImportText(${JSON.stringify(L86)}.replace(/const BUILD='v\\d+\\.\\d+/, "const BUILD='"+v), 'v.html');
        return said.some(function(m){ return /onward/.test(m); }); })); })()`));
  chk(name, 'version', 'the v1.80 floor: v2.00 and v1.100 pass it; v1.9 (before v1.80, though 1.9 > 1.8 as decimals) and vX.Y are refused',
    JSON.stringify(gate), JSON.stringify([false, false, true, true]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
// v1.92, revised before merge: NOTHING ABOUT AN IDS EXPORT IS RECORDED, and the one setting kept is the ORG. A board
// saved by v1.91 holds more under MS.ids -- a typed sequence, an action, a comment -- and an unreleased build could
// hold a record of batches. A full import carries all of it across untouched (nothing is migrated, nothing deleted),
// and the new board uses the ORG alone: the box opens on Add with an empty reason and a time-of-day file ID,
// whatever the old settings said.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.92 — an older board’s IDS settings cross a full import untouched, and only the ORG is used';
  try {
  const B = boot({ html: V14.L86 });
  const OLD = { org: 21, seq: 3, action: 'Update', cmt: 'Updated requirement', issued: ['20260930-0001'],
    sent: [{ fid: '20260930-0001', ts: 1790000000000, by: 'BLL', fy: 2027, lines: [{ bud: 'USAF O&M- CAM Discretionary AV', ctl: '1001', amt: 140, app: 100, act: 'Add' }] }] };
  B.ev(`MS.ids=${JSON.stringify(OLD)}; save(); 'ok'`);
  const html = B.ev('buildSavedHtml()');
  const N = boot();
  const ok = N.ev(`(function(){ window.confirm=function(){ return true; }; window.alert=function(){};
    return fullImportText(${JSON.stringify(html)}, 'board.html'); })()`);
  chk(name, 'import', 'the import runs', ok, true);
  const N2 = boot({ ls: v14Ls(N.ev) });
  chk(name, 'import', 'every field under MS.ids arrives exactly as it was saved', N2.ev(`JSON.stringify(MS.ids)`), JSON.stringify(OLD));
  chk(name, 'import', 'the box opens on Add, an empty reason and a time-of-day file ID; the ORG is the saved one',
    N2.ev(`(function(){ toggleIds(); var f=JSON.stringify([idsForm.action, idsForm.reason, /^\\d{8}-\\d{4}$/.test(idsForm.fid), idsForm.org]); toggleIds(); return f; })()`),
    JSON.stringify(['Add', '', true, '21']));
  chk(name, 'import', 'and opening it wrote nothing', N2.ev(`JSON.stringify(MS.ids)`), JSON.stringify(OLD));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
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
  // v1.96 (item 65): Save on top, then three folded groups by the job; Save diagnostics at the foot. The v1.86 groups
  // (Save, Import, Export, Team, Support) put Review submittals under Export and spread one job over three groups.
  const lab = JSON.parse(B.ev(`JSON.stringify([...document.querySelectorAll('#dd_share .gh')].map(function(n){ return n.querySelector('span:nth-child(2)').textContent; }))`));
  chk(name, 'File', 'Program offices, Writer and team, Boards and appropriations', lab.join(' | '), 'Program offices | Writer and team | Boards and appropriations');
  const items = B.ev(`document.getElementById('dd_share').textContent`);
  const order = ['Save', 'Save a copy', 'Publish PMO copy', 'Review submittals', 'Take the pen', 'My editor name', 'Live view', 'Change journal', 'Save history',
    'Import a full board (new version)', 'Export one appropriation', 'Import one appropriation', 'Import several boards at once', 'Appropriation packages',
    'Save diagnostics'].map(t => items.indexOf(t));
  chk(name, 'File', 'every entry is there, in that order', order.every((v, i) => v >= 0 && (i === 0 || v > order[i - 1])), true);
  // v1.90: Budget year became Reports & exports, Data, Setup and the mode tools -- the copy is in none of them
  chk(name, 'one home', 'the PMO copy is under File and nowhere else', /Publish PMO copy|Review submittals|Submit input/.test(B.ev(`['dd_reports','dd_data','dd_setup','dd_fy','dd_modetools','t_review','t_rank','t_fund','t_compare','t_brief'].map(function(k){ const e=document.getElementById(k); return e? e.textContent : ''; }).join(' ')`)), false);
  const P = boot({ html: v184Publish(B.ev) });
  chk(name, 'copy', 'in a copy, ✉ Submit input is under File, and the bar button stays',
    /Submit input/.test(P.ev(`document.getElementById('dd_share').textContent`)) + ' ' + /Submit input/.test(P.ev(`document.getElementById('subBanner').textContent`)), 'true true');
  // v1.96 (item 65): in a copy it is the one way out, so it is unfolded on top, and a copy has no Program offices group
  chk(name, 'copy', 'in a copy, ✉ Submit input is on top of File, not in a folded group, and there is no Program offices group',
    P.ev(`(function(){ const e=[].slice.call(document.querySelectorAll('#dd_share .mi')).filter(function(x){ return /Submit input/.test(x.textContent); })[0];
      return JSON.stringify([!!e && !e.closest('.gbody'), !document.getElementById('mg_share_offices')]); })()`), '[true,true]');
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

// v1.89, ITEM 23: SAVING NEVER SILENTLY OVERWRITES SOMEBODY'S WORK.
// Reproduced on v1.88, all of it silent: a board reopened while this browser held edits never saved to
// the file showed the browser's copy, and treated the FILE's time as the point it had loaded from -- so
// a colleague's save made in between was written over by the next Save, unasked (no clock difference
// needed); when the file was the newer one, the browser's own work was replaced with no message; a file
// that could not be read skipped the check and was overwritten; the shared folder, reopened, did the
// same with a colleague's folder copy, and treated a copy it could not read as no copy at all.
// Every case here is driven through the board's own paths -- open, Save, the folder's pull and push --
// against a stand-in for the file on disk and one for the shared folder, and every one either keeps
// both sides or asks.
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

// v1.89, ITEM 26: THE CHANGE JOURNAL SAYS WHEN IT COULD NOT RECORD EVERYTHING.
// One save recorded at most 200 changes and dropped the rest with no mark -- 240 edits left 200 entries
// -- while a PMO apply of more than 200 fields promised "Each one is recorded in the change journal, so
// it can be found and undone later". A walk that failed dropped every entry of its save, silently. And
// a RECORD panel that failed to redraw kept the previous figures, the error swallowed.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.89 — the change journal says when it could not record everything';
  try {
  const SVC = ['USAF', 'ANG', 'AFRC'], N = 70;
  const items = Array.from({ length: N }, (_, k) => ({ id: 'R' + k, grp: 'PSM', team: 'PSM', sect: '', custom: false,
    title: 'Req ' + k, event: 'E' + k, ccar: '', fy26: [0, 0, 0], ask: [1000, 500, 250], alloc: null }));
  const sc = { services: SVC, items, disc: [40000, 20000, 9000], mand: [5000, 2000, 1000], order: items.map(i => i.id) };
  const mkB = () => { const b = boot(); seed(b.ev, sc);
    b.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save();
      jrnlSync(); window.alert=function(){}; globalThis.__q=[]; window.confirm=function(q){ globalThis.__q.push(String(q)); return true; }; 'ok'`); return b; };
  const { ev } = mkB();
  // 240 EDITS IN ONE SAVE
  const before = ev('JSON.stringify(MS)');
  const n0 = +ev('(MS.jrnl||[]).length');
  ev(`(function(){ for(var k=0;k<60;k++){ S.notes['R'+k]='note '+k; S.desc['R'+k]='d '+k; S.cons['R'+k]='c '+k; S.pid['R'+k]='P'+k; } save(); return 'ok'; })()`);
  const added = JSON.parse(ev(`JSON.stringify((MS.jrnl||[]).slice(${n0}))`));
  const summary = added.filter(e => e.p && e.p[0] === '(more)');
  chk(name, '240 edits in one save', 'the first 200 are recorded one by one, and one line says how many more',
    `${added.filter(e => e.p && e.p[0] !== '(more)').length} + ${summary.length}: ${summary.length ? summary[0].b.split(' ')[0] : '-'}`, '200 + 1: 40');
  chk(name, '240 edits in one save', 'that line is not offered as something to undo', ev(`String(jrnlUndoable((MS.jrnl||[])[(MS.jrnl||[]).length-1]))`), 'false');
  chk(name, '240 edits in one save', 'and the journal shows it as what it is', /40 more changes/.test(ev(`jrnlLabel((MS.jrnl||[])[(MS.jrnl||[]).length-1])`)), true);
  chk(name, '240 edits in one save', 'a package import still sees the changes made here since',
    ev(`String(pkgMineSince(MS, ${before}).length>0)`), 'true');
  // A WALK THAT FAILS is recorded as such, never dropped in silence.
  ev(`globalThis.__jw=jrnlWalk; jrnlWalk=function(){ throw new Error('walk failed'); }; S.notes.R1='after'; save(); jrnlWalk=globalThis.__jw; 'ok'`);
  chk(name, 'recording fails', 'the journal gets a line saying this save could not all be recorded',
    ev(`String(((MS.jrnl||[])[(MS.jrnl||[]).length-1]||{}).p[0])`) + '|' + /walk failed/.test(ev(`String(((MS.jrnl||[])[(MS.jrnl||[]).length-1]||{}).b)`)), '(unrecorded)|true');
  // A PMO APPLY OF MORE THAN 200 FIELDS: the question says where the journal stops, and the result says what it holds.
  const O = mkB();
  const html = O.ev(String.raw`(function(){ const mode={sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, base:pmoBaseline()};
    return buildSavedHtml().replace(/(<script type="application\/json" id="pubMode">)[\s\S]*?(<\/script>)/,
      function(m,a,b){ return a + JSON.stringify(mode).replace(/</g,'\\u003c') + b; }); })()`);
  const P = boot({ html });
  P.ev(`localStorage.setItem('prio27who','PMO'); localStorage.setItem('prio27pmo','PSM');
    for(var k=0;k<${N};k++){ S.desc['R'+k]='office desc '+k; S.cons['R'+k]='office impact '+k; S.notes['R'+k]='office note '+k; } save(); 'ok'`);
  const wire = P.ev(`(function(){ var cap=null; var _B=window.Blob; window.Blob=function(parts,opts){ cap=parts&&parts[0]; return new _B(parts,opts); };
    try{ pmoSubmit(); }catch(e){} window.Blob=_B; return cap; })()`);
  O.ev(`pmoTake(${JSON.stringify(JSON.parse(wire))}, 's.json'); PMOPICK={}; pmoRows().forEach(function(r){ PMOPICK[pickKey(r)]=true; });
    globalThis.__q=[]; pmoApply(); 'ok'`);
  const q = JSON.parse(O.ev('JSON.stringify(globalThis.__q)'));
  chk(name, 'a PMO apply of 210 fields', 'the question says the journal records the first 200 one by one',
    q.length === 1 && /the first 200 one by one/.test(q[0]), true);
  chk(name, 'a PMO apply of 210 fields', 'and the result says what it recorded past them',
    /recorded there as one line/.test(O.ev(`(document.getElementById('shareStat')||{}).textContent`)), true);
  // THE RECORD PANEL, when it cannot be drawn, is emptied and says so.
  ev(`globalThis.__ib=inspectorBody; inspectorBody=function(){ throw new Error('panel broke'); }; render(); inspectorBody=globalThis.__ib; 'ok'`);
  chk(name, 'the RECORD panel', 'a panel that cannot be drawn is emptied, not left showing old figures',
    /could not be drawn/.test(ev(`document.getElementById('inspector').textContent`)) && !/\$/.test(ev(`document.getElementById('inspector').textContent`)), true);
  chk(name, 'the RECORD panel', 'and the board says so', /RECORD panel could not be drawn/.test(ev(`(document.getElementById('shareStat')||{}).textContent`)), true);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();

// ==== v1.95 W1: saving, kept-aside work, one writer (items 47, 50, 58) ====
// v1.95, ITEMS 47, 50 AND 58 (the pre-launch review's R01 and R07, and its concurrent-writer finding).
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

// ---- 47, the file: Save acknowledges exactly the bytes it wrote ------------------------------------------
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

// ---- 47, the shared folder: the save acknowledges what it wrote, under the year it captured --------------
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

// ---- 50: work kept aside is never replaced without asking ------------------------------------------------
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

// ---- 58: one writer per board file ---------------------------------------------------------------------
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
// ==== end W1 ====

// ==== v1.95 W2: full import, cost-estimate sharing (items 48, 49) ====
// v1.95, ITEM 48 (review R02): A FULL IMPORT IS ALL OR NOTHING. ⬅ Import a full board writes ten keys to browser
// storage -- each appropriation's plan, its locked cycles, the BAE list, execution data, cost estimates, the
// reprogramming log, the destination list and the report it says on reopening -- and v1.94 looked at none of the
// writes: a browser that refused one (storage full) was told "Full board imported" and reopened on a mix, which the
// next Save wrote into the file. Every write is refused in turn here, once and from there on, and each time the
// board must say what was refused, stay open, and leave every key byte-identical; reopened, it is the old board, and
// its next Save writes the old board. Two generations of one board, OLD and NEW, are told apart by what they hold.
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
// the keys whose bytes differ, added or gone included
const w2Diff = (a, b) => Object.keys(Object.assign({}, a, b)).filter(k => a[k] !== b[k]).sort().join(',');
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.95 — a full import is all or nothing: a refused write leaves every key as it was';
  try {
  const { NEW, OLD } = w2Fx();
  const base = boot({ html: OLD.html, ls: OLD.ls });
  const VIEW0 = JSON.stringify(w2View(base.ev)), SAVE0 = w2Saved(base.ev);
  chk(name, 'the fixture', 'the old board is OLD throughout, and holds no cost estimates in browser storage (a control)',
    VIEW0.includes('NEW') + '|' + ('prio27acedb' in w2LsOf(boot({ html: OLD.html, ls: OLD.ls }).ev)), 'false|false');
  // A CONTROL (v1.94 does this too): refused nothing, the import writes its ten keys and reopens.
  const T0 = boot({ html: OLD.html, ls: OLD.ls });
  const r0 = w2Import(T0, NEW.html, 'none', 0);
  chk(name, 'nothing refused (a control)', 'the ten writes, in order; it returns true and reopens',
    r0.writes.map(w => w[0]).join(',') + '|' + r0.ret + '|' + r0.nav, W2_KEYS.join(',') + '|true|true');
  for (const mode of ['once', 'full']) for (let n = 1; n <= 10; n++) {
    const at = `write ${n} (${W2_KEYS[n - 1]}) refused ${mode === 'once' ? 'once' : 'and every new write after it'}`;
    const mk = bootMark();
    const T = boot({ html: OLD.html, ls: OLD.ls });
    const r = w2Import(T, NEW.html, mode, n);
    const after = w2LsOf(T.ev);
    // CONTROLS WHERE THE REFUSAL ITSELF HIDES THE DEFECT: refused from the first write on, storage takes nothing on any
    // board; and the report is the last write, so wherever it is refused no board can leave it behind.
    const ctlAll = mode === 'full' && n === 1, ctlRep = mode === 'full' || n === 10;
    chk(name, at, 'it returns false and does not reopen', `${r.ret}|${r.nav}|${r.threw}`, 'false|false|');
    chk(name, at, 'the board says nothing was imported, which list browser storage refused, and that the board is as it was',
      /^⛔ Nothing was imported — browser storage refused /.test(r.stat) && r.stat.includes('refused ' + W2_SAY[n - 1] + ' (QuotaExceededError)')
      && /this board is exactly as it was\.$/.test(r.stat), true);
    chk(name, at, 'every key in browser storage is byte-identical to before (the keys that differ)' + (ctlAll ? ' (a control here)' : ''), w2Diff(r.held, after), '');
    chk(name, at, 'no import report is left for the next opening' + (ctlRep ? ' (a control here)' : ''), 'prio27impRep' in after, false);
    chk(name, at, 'the same browser, reopened, opens the old board' + (ctlAll ? ' (a control here)' : ''), JSON.stringify(w2View(boot({ html: OLD.html, ls: after }).ev)), VIEW0);
    chk(name, at, 'and the next 💾 Save writes the old board', w2Saved(T.ev), SAVE0);
    bootRelease(mk, keepBoards());   // this round's boards
  }
  // A BROWSER WHOSE STORAGE IS FULL, as a quota measures it. The O&M plan is written smaller, the Full Fund plan
  // bigger, and the BAE list does not fit. Put back oldest first, the O&M plan would no longer fit either; most
  // recent first, every step returns storage to a size it already held.
  {
    const T = boot({ html: OLD.html, ls: OLD.ls });
    const held = w2LsOf(T.ev);
    let t = Object.keys(held).reduce((s, k) => s + k.length + held[k].length, 0);
    const d = r0.writes.map(([k, len]) => held[k] == null ? k.length + len : len - held[k].length);
    const tot = d.map(x => (t += x));
    const LIMIT = Math.max(...tot.slice(0, 4)) + Math.floor(d[4] / 2);
    chk(name, 'storage full', 'the fixture: the BAE list does not fit, and the O&M plan put back first would not either (a control)',
      (tot[3] + d[4] > LIMIT) + '|' + (tot[3] - d[0] > LIMIT), 'true|true');
    const r = w2Import(T, NEW.html, 'quota', 0, LIMIT);
    const after = w2LsOf(T.ev);
    chk(name, 'storage full', 'refused at the BAE list; nothing was imported, and it does not reopen',
      r.writes.findIndex(w => w[2]) + '|' + r.ret + '|' + r.nav + '|' + r.stat.includes('refused the BAE list'), '4|false|false|true');
    chk(name, 'storage full', 'every key is put back, byte-identical (the keys that differ)', w2Diff(r.held, after), '');
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// v1.95, ITEM 48, THE OTHER OUTCOME: STORAGE KEEPS REFUSING, SO NOT EVERY KEY CAN BE PUT BACK. The board says which
// list holds what, does not reopen, and offers two files to save -- the board as it was before the import, and the
// file being imported -- so neither depends on this browser. Here browser storage refuses the reprogramming log and
// every write after it, putting back included: the six lists already written stay the import's, the cost estimates
// (a key that held nothing) are removed, and the rest never changed.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.95 — a full import that cannot be put back says what is where, and keeps both boards';
  try {
  const { NEW, OLD } = w2Fx();
  const VIEW0 = JSON.stringify(w2View(boot({ html: OLD.html, ls: OLD.ls }).ev));
  const T = boot({ html: OLD.html, ls: OLD.ls });
  const r = w2Import(T, NEW.html, 'stuck', 8);
  const after = w2LsOf(T.ev);
  chk(name, 'refused from the reprogramming log on', 'it returns false and does not reopen', `${r.ret}|${r.nav}|${r.threw}`, 'false|false|');
  // what storage really holds, key by key
  const gen = (k) => { const v = after[k]; if (v == null) return 'absent'; if (v === r.held[k]) return 'was';
    return (/NEW|"PB\|2027"|JSF1/.test(v) && !/OLD|"POM\|2027"|JSF2/.test(v)) ? 'new' : '?'; };
  chk(name, 'refused from the reprogramming log on', 'storage: the six lists written before it hold the import’s, the rest are as they were',
    W2_KEYS.map(gen).join(','), 'new,new,new,new,new,new,absent,was,was,absent');
  const isNew = W2_KEYS.map((k, i) => gen(k) === 'new' ? W2_SAY[i] : '').filter(Boolean).join(', ');
  const isWas = W2_KEYS.map((k, i) => gen(k) !== 'new' ? W2_SAY[i] : '').filter(Boolean).join(', ');
  chk(name, 'the message', 'it says the import stopped part-way and could not be put back, and names what was refused',
    /^⛔ The import stopped part-way, and this browser could not be put back as it was\. Browser storage refused the reprogramming log \(QuotaExceededError\)/.test(r.stat), true);
  chk(name, 'the message', 'it lists exactly the lists that hold the import’s, and exactly those as they were',
    r.stat.includes('In this browser now, from the imported file: ' + isNew + '. As it was: ' + isWas + '.'), true);
  chk(name, 'the message', 'the alert says the same', r.alerts.length === 1 && r.alerts[0].includes('from the imported file: ' + isNew) && r.alerts[0].includes('as it was: ' + isWas), true);
  chk(name, 'the message', 'no import report is left for the next opening (a control: its own write is refused here)', 'prio27impRep' in after, false);
  // THE TWO FILES, each offered by a button in the message
  const got = JSON.parse(T.ev(`(function(){
    const out=[]; const _B=window.Blob, _c=HTMLAnchorElement.prototype.click; let cap='';
    window.Blob=function(parts, o){ cap=String(parts&&parts[0]); return new _B(parts, o); };
    HTMLAnchorElement.prototype.click=function(){ out.push({name:this.download, text:cap}); };
    try{ [].slice.call(document.querySelectorAll('#shareStat button')).forEach(function(b){ b.click(); }); }
    finally{ window.Blob=_B; HTMLAnchorElement.prototype.click=_c; }
    return JSON.stringify(out); })()`));
  chk(name, 'the two files', 'the message offers two files to save', got.map(g => g.name).join(' | '),
    'FY27 Consolidated Prioritization Board — as it was before the import.html | new-board.html');
  chk(name, 'the two files', 'the file being imported, byte for byte', got[1] && got[1].text === NEW.html, true);
  chk(name, 'the two files', 'the board as it was, opened in a browser of its own, is the old board',
    got[0] ? JSON.stringify(w2View(boot({ html: got[0].text }).ev)) : 'none', VIEW0);
  // on screen: the open appropriation and every list, all held in memory, which a failed import never touches
  const mem = (v) => JSON.stringify(Object.assign({}, v, { imported: 0, ff: 0, ffCycles: 0 }));
  chk(name, 'the two files', 'and the board on screen is still the old one', mem(w2View(T.ev)), mem(JSON.parse(VIEW0)));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// v1.95, ITEM 48: WHILE THAT MIX STANDS, NOTHING WRITES OVER THE BOARD FILE. Browser storage holds some lists from
// the imported file and some as they were, and 💾 Save builds the file from it: before this, the next Save wrote the
// mix over the board file, which -- once the page is reloaded and the two files offered are gone -- is the one whole
// copy of the board as it was. Saving in place and to the shared folder is refused until the person allows it, a
// reload included; ⬇ Save a copy never is.
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
// v1.95, ITEM 48, ALSO FOUND: the cost estimates and the reprogramming log were written past lsSet(), so a refusal
// never reached 🩺 Save diagnostics. They go through it like every other list.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.95 — a refused write of the cost estimates or the reprogramming log is in Save diagnostics';
  try {
  const { ev } = boot();
  const r = JSON.parse(ev(`(function(){ const _si=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k, v){ if(k==='prio27acedb'||k==='prio27reprog') throw new DOMException('q', 'QuotaExceededError'); return _si.call(this, k, v); };
    const n0=DIAG.refused.length; let a, b; try{ a=persistAce(); b=persistRp(); } finally{ Storage.prototype.setItem=_si; }
    return JSON.stringify([a, b, DIAG.refused.slice(n0).map(function(x){ return x.what+': '+x.why; })]); })()`));
  chk(name, 'refused', 'each says it was not kept, and each is recorded', JSON.stringify(r),
    JSON.stringify([false, false, ['The cost estimates: QuotaExceededError', 'The reprogramming log: QuotaExceededError']]));
  chk(name, 'refused', 'Save diagnostics count them', /Writes refused:\s+2 this session/.test(ev('diagReport()')), true);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// v1.95, ITEM 49 (review R06): SHARING A COST ESTIMATE NEVER WRITES OVER ONE IT COULD NOT READ, OR A DIFFERENT ONE.
// Cost estimate · share mine took every folder copy it could not read -- locked by the sync client, no permission,
// half-synced, refused at the door -- for no copy at all, and wrote over a readable copy of a DIFFERENT approved
// estimate under the same name, keeping no history. One stand-in shared folder per case (the v1.89 block's, with a
// read that fails by a chosen DOMException name and a history folder that can refuse); it holds a colleague's
// approved 2025ACE, and Brad's board holds a different one under the same name.
const W2_ACE = 'spmt-ace-2025ACE.json';
const w2Folder = () => {
  const root = { files: {}, dirs: {}, fail: {}, writes: [] };
  const dirOf = st => ({ kind: 'directory', name: 'shared', queryPermission: async () => (root.deny ? 'denied' : 'granted'), requestPermission: async () => 'granted',
    getFileHandle: async (n, o) => { if (!(n in st.files)) { if (o && o.create) st.files[n] = ''; else { const e = new Error('A requested file or directory could not be found'); e.name = 'NotFoundError'; throw e; } }
      return { kind: 'file', name: n,
        getFile: async () => { const f = st.fail[n]; if (f) { const e = new Error(f.msg); e.name = f.name; throw e; } return { text: async () => st.files[n] }; },
        createWritable: async () => { let buf = ''; return { write: async x => { buf += String(x); }, close: async () => { st.files[n] = buf; root.writes.push(n); } }; } }; },
    getDirectoryHandle: async (n, o) => { if (st.fail['dir:' + n]) throw new Error('cannot make ' + n);
      if (!st.dirs[n]) { if (o && o.create) st.dirs[n] = { files: {}, dirs: {}, fail: {} }; else { const e = new Error('not found'); e.name = 'NotFoundError'; throw e; } }
      return dirOf(st.dirs[n]); },
    removeEntry: async n => { delete st.files[n]; },
    values: async function* () { for (const n of Object.keys(st.files)) yield { kind: 'file', name: n }; } });
  return { root, folder: dirOf(root) };
};
// a board connected to the folder as WHO, holding one approved, locked 2025ACE (MINE or THEIRS), or none
const w2AceBoard = (folder, who, tag) => {
  const B = boot();
  B.w.__fold = folder;
  B.ev(`localStorage.setItem('prio27who', ${JSON.stringify(who)}); globalThis.__asked=[]; globalThis.__yes=true;
    window.confirm=function(m){ globalThis.__asked.push(String(m)); if(globalThis.__during) globalThis.__during(); return globalThis.__yes; }; window.alert=function(){};
    _liveCfg=Object.assign(liveCfg(), {store:true, mode:'drive', on:false}); _driveDir=globalThis.__fold; 'ok'`);
  if (tag) B.ev(`(function(){ const set={appn:{om:{pmo:{AV:{2027:${tag === 'MINE' ? 900 : 450}}}}}, lines:[{n:'${tag} line 1'},{n:'${tag} line 2'}],
      years:[2027], skip:{}, locked:true, by:${JSON.stringify(who)}, file:'2025 ACE ${tag}.xlsx', ts:Date.now()};
    set.fp=aceFingerprint(set); ACEDB={ts:Date.now(), sets:{'2025ACE':set}}; persistAce(); return 'ok'; })()`);
  return B;
};
// the colleague's estimate, as their own board shared it -- built once
let W2THEIRS = null;
const w2Theirs = async () => {
  if (!W2THEIRS) { const F = w2Folder(); const C = w2AceBoard(F.folder, 'Colleague', 'THEIRS'); await C.ev('driveAcePush(false)'); W2THEIRS = F.root.files[W2_ACE]; }
  return W2THEIRS;
};
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.95 — sharing a cost estimate writes only where the folder has none, or the same one';
  try {
  const THEIRS = await w2Theirs();
  const T = JSON.parse(THEIRS);
  chk(name, 'the fixture', 'the folder holds the colleague’s approved 2025ACE (a control)', T.key + '|' + T.by + '|' + T.set.lines.length, '2025ACE|Colleague|2');
  const fpBy = (s) => { try { const j = JSON.parse(s); return j.set.fp + ' by ' + j.by; } catch { return s == null ? 'absent' : 'unreadable'; } };
  const cases = [
    ['S1: no copy in the folder (NotFoundError)', null],
    ['S2: the same estimate', 'same'],
    ['S3: a different approved estimate', r => { r.files[W2_ACE] = THEIRS; }, 'the folder holds a different 2025ACE, imported by Colleague'],
    ['S4: it cannot be read (NotReadableError: locked by the sync client)', r => { r.files[W2_ACE] = THEIRS; r.fail[W2_ACE] = { name: 'NotReadableError', msg: 'The requested file could not be read' }; }, 'it could not be read (NotReadableError)'],
    ['S5: it cannot be read (NotAllowedError: no permission on the file)', r => { r.files[W2_ACE] = THEIRS; r.fail[W2_ACE] = { name: 'NotAllowedError', msg: 'The request is not allowed' }; }, 'it could not be read (NotAllowedError)'],
    ['S6: it cannot be read (a plain error)', r => { r.files[W2_ACE] = THEIRS; r.fail[W2_ACE] = { name: 'Error', msg: 'locked while it syncs' }; }, 'it could not be read (locked while it syncs)'],
    ['S7: half of it has synced', r => { r.files[W2_ACE] = THEIRS.slice(0, Math.floor(THEIRS.length / 2)); }, 'it is not whole'],
    ['S7b: whole, but with no estimate in it yet', r => { r.files[W2_ACE] = JSON.stringify({ v: 1, key: '2025ACE', by: 'Colleague', ts: T.ts }); }, 'it is not a whole estimate'],
    ['S8: refused at the door (a figure out of range)', r => { const j = JSON.parse(THEIRS); j.set.appn.om.pmo.AV['2027'] = 1e16; r.files[W2_ACE] = JSON.stringify(j); }, 'it was refused: the figure at'],
    ['S9: its figures do not match its fingerprint (it claims to be the same as mine)', 'claims', 'its figures do not match its fingerprint'],
  ];
  let MINEFP = '';
  for (const [at, setup, why] of cases) {
    const mk = bootMark();
    const F = w2Folder();
    if (typeof setup === 'function') setup(F.root);
    const B = w2AceBoard(F.folder, 'Brad', 'MINE');
    MINEFP = B.ev(`ACEDB.sets['2025ACE'].fp`);
    if (setup === 'same') { await B.ev('driveAcePush(false)'); F.root.writes.length = 0; }
    if (setup === 'claims') { const j = JSON.parse(THEIRS); j.fp = j.set.fp = MINEFP; F.root.files[W2_ACE] = JSON.stringify(j); }
    const before = F.root.files[W2_ACE];
    const ret = await B.ev('driveAcePush(false)');
    const after = F.root.files[W2_ACE], wrote = F.root.writes.filter(n => n === W2_ACE).length, st = w2Status(B.ev);
    if (!setup) {
      chk(name, at, 'it is written: share mine returns true, and the folder holds mine (a control)', ret + '|' + fpBy(after) + '|' + wrote, 'true|' + MINEFP + ' by Brad|1');
    } else if (setup === 'same') {
      chk(name, at, 'nothing is written, and the board says the folder already holds it (a control)', ret + '|' + wrote + '|' + (after === before) + '|' + /identical to yours/.test(st), 'true|0|true|true');
    } else {
      chk(name, at, 'share mine returns false: not everything was shared', String(ret), 'false');
      // S9 claims my fingerprint, so v1.94 took it for the same estimate and wrote nothing either: a control there
      chk(name, at, 'the folder’s file is byte-identical, and nothing was written to it' + (setup === 'claims' ? ' (a control here)' : ''), (after === before) + '|' + wrote, 'true|0');
      chk(name, at, 'the board names the estimate and says nothing was written over it',
        /⛔ 2025ACE was not shared/.test(st) && /Nothing was written over it/.test(st) && !/identical to yours|shared to the folder/.test(st), true);
      chk(name, at, 'and says why', st.includes(why), true);
    }
    if (setup && setup !== 'same' && !/S4|S5|S6/.test(at))
      chk(name, at, 'and offers the replace as a choice of its own', B.ev(`!!document.querySelector('#shareStat button[onclick^="driveAceReplace("]')`), true);
    bootRelease(mk, keepBoards());
  }
  // AFTER "CHECK THE FOLDER" HAS REPORTED THE CLASH, share mine still leaves the colleague's copy alone.
  {
    const F = w2Folder(); F.root.files[W2_ACE] = THEIRS;
    const B = w2AceBoard(F.folder, 'Brad', 'MINE');
    await B.ev('driveAcePull(false)');
    chk(name, 'check the folder first', 'the clash is reported (a control)', /DIFFERENT 2025ACE/.test(w2Status(B.ev)), true);
    const ret = await B.ev('driveAcePush(false)');
    chk(name, 'check the folder first', 'then share mine writes nothing over it', ret + '|' + (F.root.files[W2_ACE] === THEIRS) + '|' + F.root.writes.length, 'false|true|0');
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// v1.95, ITEM 49: REPLACING THE FOLDER'S ESTIMATE IS A SEPARATE, EXPLICIT CHOICE. It names whose copy it is and when it
// was shared, keeps that copy in the folder's history first, and writes nothing on a No, when the history copy
// cannot be kept, when the copy cannot be read (so cannot be kept), or when it changed while the question was open.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.95 — replacing the folder’s cost estimate is asked for by name, and keeps theirs first';
  try {
  const THEIRS = await w2Theirs();
  const T = JSON.parse(THEIRS);
  const F = w2Folder(); F.root.files[W2_ACE] = THEIRS;
  const B = w2AceBoard(F.folder, 'Brad', 'MINE');
  const MINEFP = B.ev(`ACEDB.sets['2025ACE'].fp`);
  await B.ev('driveAcePush(false)');
  const hist = () => Object.values((F.root.dirs.history || { files: {} }).files);
  // No
  B.ev(`globalThis.__yes=false; globalThis.__asked=[]; 'ok'`);
  const r1 = await B.ev(`driveAceReplace('2025ACE')`);
  const asked = JSON.parse(B.ev('JSON.stringify(globalThis.__asked)'));
  chk(name, 'asked', 'the question names the estimate, whose copy it is and when it was shared',
    asked.length === 1 && asked[0].includes('2025ACE') && asked[0].includes('imported by Colleague') && asked[0].includes(B.ev(`fmtTs(${T.ts})`)), true);
  chk(name, 'answered No', 'nothing is written, and no history is kept', r1 + '|' + (F.root.files[W2_ACE] === THEIRS) + '|' + F.root.writes.length, 'false|true|0');
  // Yes, but the history folder refuses
  B.ev(`globalThis.__yes=true; 'ok'`);
  F.root.fail['dir:history'] = true;
  const r2 = await B.ev(`driveAceReplace('2025ACE')`);
  chk(name, 'the history cannot be kept', 'nothing is written, and the board says so',
    r2 + '|' + (F.root.files[W2_ACE] === THEIRS) + '|' + F.root.writes.length + '|' + /could not be kept in the shared folder’s history, so nothing was written/.test(w2Status(B.ev)), 'false|true|0|true');
  F.root.fail['dir:history'] = false;
  // Yes, and the folder's copy changes while the question is open
  B.w.__during = () => { F.root.files[W2_ACE] = THEIRS.replace('"Colleague"', '"Someone"'); };
  const r3 = await B.ev(`driveAceReplace('2025ACE')`);
  B.w.__during = null;
  chk(name, 'it changed while the question was open', 'nothing is written over the new copy', r3 + '|' + F.root.writes.length + '|' + /changed while you were deciding/.test(w2Status(B.ev)), 'false|0|true');
  F.root.files[W2_ACE] = THEIRS;
  // Yes
  const r4 = await B.ev(`driveAceReplace('2025ACE')`);
  chk(name, 'answered Yes', 'theirs is kept in the history first, byte for byte, and then mine is written',
    r4 + '|' + F.root.writes.map(n => n === W2_ACE ? 'folder' : (/^spmt-ace-2025ACE-\d{8}-\d{6}\.json$/.test(n) ? 'history' : n)).join(',') + '|' + (hist()[0] === THEIRS),
    'true|history,folder|true');
  chk(name, 'answered Yes', 'the folder now holds mine', (() => { const j = JSON.parse(F.root.files[W2_ACE]); return j.set.fp + ' by ' + j.by; })(), MINEFP + ' by Brad');
  chk(name, 'answered Yes', 'and the board says whose it replaced, and that theirs is in the history',
    /Your 2025ACE replaced the shared folder’s \(imported by Colleague/.test(w2Status(B.ev)) && /kept in the folder’s history/.test(w2Status(B.ev)), true);
  // A COPY THAT CANNOT BE READ cannot be kept in the history, so it is never replaced.
  {
    const G = w2Folder(); G.root.files[W2_ACE] = THEIRS; G.root.fail[W2_ACE] = { name: 'NotReadableError', msg: 'The requested file could not be read' };
    const D = w2AceBoard(G.folder, 'Brad', 'MINE');
    const r = await D.ev(`driveAceReplace('2025ACE')`);
    chk(name, 'a copy that cannot be read', 'it is not replaced, and the board says why',
      r + '|' + (G.root.files[W2_ACE] === THEIRS) + '|' + G.root.writes.length + '|' + /cannot be kept in the history first\. Nothing was written/.test(w2Status(D.ev)), 'false|true|0|true');
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// v1.95, ITEM 49, ALSO FOUND: "check the folder" took a folder estimate without checking its fingerprint, and said
// nothing about a file it could not read, or about a folder it could not reach.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.95 — check the folder checks each estimate’s fingerprint and says what it could not read';
  try {
  const THEIRS = await w2Theirs();
  const F = w2Folder();
  const one = (key, amt) => { const j = JSON.parse(THEIRS); j.key = key; j.set.appn.om.pmo.AV['2027'] = amt; return j; };
  const B0 = w2AceBoard(F.folder, 'Colleague', null);
  const good = one('GOOD', 450); good.fp = good.set.fp = B0.ev(`aceFingerprint(${JSON.stringify(good.set)})`);
  const tampered = one('TAMPERED', 999);    // its figures changed, its fingerprint did not
  F.root.files['spmt-ace-GOOD.json'] = JSON.stringify(good);
  F.root.files['spmt-ace-TAMPERED.json'] = JSON.stringify(tampered);
  F.root.files['spmt-ace-LOCKED.json'] = JSON.stringify(one('LOCKED', 450)); F.root.fail['spmt-ace-LOCKED.json'] = { name: 'NotReadableError', msg: 'The requested file could not be read' };
  F.root.files['spmt-ace-HALF.json'] = THEIRS.slice(0, 100);
  const N = w2AceBoard(F.folder, 'Newcomer', null);
  const took = await N.ev('driveAcePull(false)');
  chk(name, 'a newcomer checks the folder', 'it takes the whole, intact estimate (a control) and nothing else', took + '|' + N.ev(`Object.keys(ACEDB.sets).sort().join(',')`), 'true|GOOD');
  const st = w2Status(N.ev);
  chk(name, 'a newcomer checks the folder', 'it names the one whose figures do not match its fingerprint', /spmt-ace-TAMPERED\.json: its figures do not match its fingerprint/.test(st), true);
  chk(name, 'a newcomer checks the folder', 'it names the one it could not read, and why', /spmt-ace-LOCKED\.json: it could not be read \(NotReadableError\)/.test(st), true);
  chk(name, 'a newcomer checks the folder', 'it names the half-written one', /spmt-ace-HALF\.json: it is not whole/.test(st), true);
  chk(name, 'a newcomer checks the folder', 'and says nothing was taken from them', /Nothing was taken from them/.test(st), true);
  // a folder it cannot reach is said, not swallowed
  F.root.deny = true;
  const R = w2AceBoard(F.folder, 'Newcomer', null);
  const r = await R.ev('driveAcePull(false)');
  chk(name, 'the folder cannot be reached', 'it says so', r + '|' + /Could not check the folder for cost estimates/.test(w2Status(R.ev)), 'false|true');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ── v1.95, THE REVIEW BEFORE MERGE: four ways round what items 48, 50 and 58 promise, each proved on the board ──────
// An independent review of v1.95 found older doors that bypassed the new rules: ⬆ Publish now wrote the folder's copy
// with none of the folder save's checks; the ordinary ⬅ Import of a board file wrote one appropriation at a time and
// never looked at a write; ↶ Put this back replaced unsaved work unasked; and an import that landed whole did not lift
// the hold a stopped one had set.
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
  const name = 'v1.95 — the ordinary ⬅ Import of a board file is all or nothing';
  try {
  const { J, wire, KEY, status, baseFile, lsOf, pubOf } = W1H;
  const F1 = baseFile('Brad', KEY.brad);
  const P = pubOf(F1), om = P.appns.om, yr = Object.keys(om.years)[0];
  const tagged = (tag) => { const o = JSON.parse(J(om)); o.years[yr].notes = Object.assign({}, o.years[yr].notes || {}, { A: tag }); o.ts = Date.now() + 5000; return o; };
  const Q = JSON.parse(J(P)); Q.appns = { om: tagged('IMPORTED OM'), ff: tagged('IMPORTED FF') };
  const txt = F1.replace(/(<script type="application\/json" id="pubState">)[\s\S]*?(<\/script>)/, (m, a, b) => a + J(Q).replace(/</g, '\\u003c') + b);
  const noteOf = (ls, key) => { try { return JSON.parse(ls[key]).years[yr].notes.A; } catch { return '(none)'; } };
  // storage refuses Full Fund: nothing is taken, every key as it was, memory as it was, and the board says so
  const R = boot({ html: F1 }); wire(R.ev, 'Brad', KEY.brad);
  const ls0 = lsOf(R.ev), mem0 = R.ev('JSON.stringify([PUBS, CYCDB, EXDB, ACEDB, RPDB])');
  R.ev(`(function(){ var set=Storage.prototype.setItem; window.__set=set;
    Storage.prototype.setItem=function(k,v){ if(k==='prio27ff'){ var e=new Error('full'); e.name='QuotaExceededError'; throw e; } return set.call(this,k,v); }; })(); 'ok'`);
  R.ev(`consTakeApply(${J(Q)}, ${J(txt)}, 'two.html', ['om','ff'], true); 'ok'`);
  R.ev(`Storage.prototype.setItem=window.__set; 'ok'`);
  const ls1 = lsOf(R.ev);
  chk(name, 'refused', 'Full Fund refused: the board says nothing was imported and names it, and every key is byte-identical',
    J([/Nothing was imported/.test(status(R.ev)) && /Full Fund/.test(status(R.ev)), w2Diff(ls0, ls1)]), J([true, '']));
  chk(name, 'refused', 'and what the import changed in memory is put back', R.ev('JSON.stringify([PUBS, CYCDB, EXDB, ACEDB, RPDB])') === mem0, true);
  // nothing refused: both taken, as before
  const S2 = boot({ html: F1 }); wire(S2.ev, 'Brad', KEY.brad);
  S2.ev(`consTakeApply(${J(Q)}, ${J(txt)}, 'two.html', ['om','ff'], true); 'ok'`);
  const ls2 = lsOf(S2.ev);
  chk(name, 'taken', 'CONTROL — nothing refused: both appropriations are taken, and the board says so',
    J([noteOf(ls2, 'prio27om'), noteOf(ls2, 'prio27ff'), /Took O&M, Full Fund/.test(status(S2.ev))]), J(['IMPORTED OM', 'IMPORTED FF', true]));
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
  const name = 'v1.95 — an import that lands whole lifts the hold a stopped one set';
  try {
  const { J, wire, KEY, status, lsOf, pubOf } = W1H;
  const { NEW, OLD } = w2Fx();
  // a stopped import, its hold kept in storage (storage refuses only the ten lists)
  const T = boot({ html: OLD.html, ls: OLD.ls });
  w2Import(T, NEW.html, 'stuckKeys', 8);
  const mark = JSON.parse(T.ev(`localStorage.getItem(IMP_MIXED_KEY)||'null'`));
  chk(name, 'the hold', 'the hold names the lists the stopped import left mixed', J(!!(mark && Array.isArray(mark.keys) && mark.keys.indexOf('prio27ff') >= 0)), 'true');
  // taking back O&M alone rewrites O&M alone: the hold stays
  const R = boot({ html: OLD.html, ls: lsOf(T.ev) }); wire(R.ev, 'Brad', KEY.brad);
  R.ev(`consTakeApply(${J(pubOf(NEW.html))}, ${J(NEW.html)}, 'new-board.html', ['om'], false); 'ok'`);
  chk(name, 'part of it', 'an import that rewrites only some of those lists leaves the hold in place', R.ev('String(impMixedOn())'), 'true');
  // the whole file again: every list rewritten, all or nothing -- the hold is lifted, and the next opening says what was imported
  R.ev(`fullImportText(${J(NEW.html)}, 'new-board.html'); 'ok'`);
  chk(name, 'the whole of it', 'importing the whole file again lifts the hold', R.ev(`localStorage.getItem(IMP_MIXED_KEY)===null`), true);
  const R2 = boot({ html: OLD.html, ls: lsOf(R.ev) }); wire(R2.ev, 'Brad', KEY.brad);
  chk(name, 'the whole of it', 'reopened: 💾 Save is allowed, and the opening says what was imported',
    J([R2.ev('String(impMixedOn())'), /Full board imported/.test(status(R2.ev))]), J(['false', true]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== v1.96: the 4 Oct 2026 review of v1.95, NR01-NR05 (items 66-70) ====
// Each scenario reproduces the review's own probe against the real program; every check but those labelled CONTROL fails
// on v1.95 (main 64f0319 / 5e4736c).
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
  const name = 'v1.96 — ⇊ Import several boards at once is all or nothing (NR02)';
  try {
  const { J, until, pubOf } = W1H;
  const { NEW, OLD } = w2Fx();
  const slugs = Object.keys(pubOf(NEW.html).appns);
  const run = async refuse => {
    const T = boot({ html: OLD.html, ls: OLD.ls });
    const keyOf = JSON.parse(T.ev(`JSON.stringify(Object.fromEntries(Object.keys(_SLUGMAP).map(function(k){ return [k, _SLUGMAP[k].key]; })))`));
    const lsBefore = w2LsOf(T.ev), pubBefore = T.ev('JSON.stringify(PUBS)');
    T.ev(`window.confirm=function(){ return true; }; window.alert=function(){}; globalThis.__si=Storage.prototype.setItem; globalThis.__no=${J(refuse ? keyOf[refuse] : '')};
      Storage.prototype.setItem=function(k,v){ if(k===globalThis.__no){ globalThis.__no=''; throw new DOMException('The quota has been exceeded.','QuotaExceededError'); } return globalThis.__si.call(this,k,v); };
      document.getElementById('shareStat').textContent=''; importBoards({ files:[new File([${J(NEW.html)}], 'new-board.html')], value:'x' }); 'ok'`);
    await until(() => T.ev(`(document.getElementById('shareStat')||{}).textContent||''`) !== '');
    T.ev(`Storage.prototype.setItem=globalThis.__si; 'ok'`);
    const lsAfter = w2LsOf(T.ev);
    const slots = slugs.map(k => keyOf[k]).filter(Boolean);
    return { changed: slots.filter(k => lsAfter[k] !== lsBefore[k]).length, n: slots.length, pubs: T.ev('JSON.stringify(PUBS)') === pubBefore,
      stat: T.ev(`(document.getElementById('shareStat')||{}).textContent||''`), mixed: T.ev(`localStorage.getItem(IMP_MIXED_KEY)`) };
  };
  const c = await run('');
  chk(name, 'nothing refused (a CONTROL)', 'every appropriation the file carries is written, memory follows, and it says so',
    J([c.changed === c.n && c.n >= 2, c.pubs, /Imported/.test(c.stat)]), J([true, false, true]));
  for (const k of slugs) {
    const r = await run(k);
    chk(name, 'refused at ' + k, 'nothing is imported: every appropriation in storage and in memory is as it was, and the board says so, not "Imported"',
      J([r.changed, r.pubs, /Nothing was imported/.test(r.stat), /Imported:/.test(r.stat), r.mixed]), J([0, true, true, false, null]));
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.96 — the reprogramming log is never shared over a folder log that could not be read (NR03)';
  try {
  const { J, wire, KEY, status, baseFile, folder, connect } = W1H;
  const F1 = baseFile('Alice', KEY.alice);
  const PEER = J({ v: 1, by: 'Peer', ts: 5, entries: [{ id: 'peer-1', ts: 5, type: 'ATR', note: 'PEER ONLY ACTION' }], gone: {} });
  const setup = () => { const fold = folder(); const A = boot({ html: F1 }); wire(A.ev, 'Alice', KEY.alice); connect(A.ev, A.w, fold);
    A.ev(`RPDB.entries=[{id:'mine-1', ts:7, type:'BTR', note:'MINE'}]; 'ok'`); return { fold, A }; };
  { const { fold, A } = setup(); fold.root.files['spmt-reprog.json'] = PEER;
    const e = 'new DOMException("The request is not allowed.", "NotAllowedError")';
    A.w.eval(`globalThis.__fr=${e}`); fold.failRead['spmt-reprog.json'] = A.w.__fr;
    const ok = await A.ev('driveRpPush(false)');
    chk(name, 'an unreadable log', 'nothing is written over it: the peer’s action is still in the folder, the share returns false and says why',
      J([ok, fold.root.files['spmt-reprog.json'] === PEER, /not shared/.test(status(A.ev))]), J([false, true, true])); }
  { const { fold, A } = setup(); fold.root.files['spmt-reprog.json'] = PEER.slice(0, 40);
    const ok = await A.ev('driveRpPush(false)');
    chk(name, 'a log half-synced', 'a log that is not whole is not written over either',
      J([ok, fold.root.files['spmt-reprog.json'] === PEER.slice(0, 40), /not a whole log/.test(status(A.ev))]), J([false, true, true])); }
  { const { fold, A } = setup(); fold.root.files['spmt-reprog.json'] = PEER;
    const ok = await A.ev('driveRpPush(false)');
    const now = JSON.parse(fold.root.files['spmt-reprog.json']), hist = fold.hist();
    chk(name, 'a readable log', 'both actions are in the shared log, and the folder’s copy was kept in its history first',
      J([ok, now.entries.map(x => x.id).sort(), hist.some(n => hist.length && fold.root.dirs.history.files[n] === PEER)]), J([true, ['mine-1', 'peer-1'], true])); }
  { const { fold, A } = setup();
    const ok = await A.ev('driveRpPush(false)');
    chk(name, 'no log yet (a CONTROL)', 'with no log in the folder, ours is written',
      J([ok, JSON.parse(fold.root.files['spmt-reprog.json'] || '{"entries":[]}').entries.map(x => x.id)]), J([true, ['mine-1']])); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.96 — a shared state file that answers late never replaces work (NR05)';
  try {
  const { J, wire, KEY, status, baseFile } = W1H;
  const F1 = baseFile('Alice', KEY.alice);
  const sidecar = ev => JSON.parse(ev(`(function(){ const st=JSON.parse(JSON.stringify(MS)); st.ts=Date.now()+3600000; st.by='Peer';
      ((st.years[st.cur]||{}).notes||(st.years[st.cur].notes={})).A='SIDECAR'; return JSON.stringify(st); })()`));
  const kept = ev => ev(`(function(){ var k=keptCopy(); return k? k.raw : ''; })()`);
  { const A = boot({ html: F1 }); wire(A.ev, 'Alice', KEY.alice);
    const st = sidecar(A.ev);
    A.ev(`setNote('A','TYPED AFTER OPENING'); 'ok'`);
    A.ev(`sharedArrived(${J(st)}); 'ok'`);
    chk(name, 'typed, then a later answer', 'nothing is replaced: the note typed stays on screen and in this browser, and the board says what arrived',
      J([A.ev('S.notes.A'), /TYPED AFTER OPENING/.test(A.ev(`localStorage.getItem(_AP.key)||''`)), /nothing was replaced/.test(status(A.ev))]), J(['TYPED AFTER OPENING', true, true]));
    A.ev(`adoptShared(); 'ok'`);
    chk(name, 'and then loaded by choice', 'loading it then keeps the typed work aside first', J([A.ev('S.notes.A'), /TYPED AFTER OPENING/.test(kept(A.ev))]), J(['SIDECAR', true])); }
  { // work from an earlier session, never saved: reopened, then the answer arrives
    const A0 = boot({ html: F1 }); wire(A0.ev, 'Alice', KEY.alice);
    A0.ev(`setNote('A','EARLIER SESSION'); 'ok'`);
    const ls = W1H.lsOf(A0.ev);
    const A = boot({ html: F1, ls }); wire(A.ev, 'Alice', KEY.alice);
    A.ev(`DIRTY=false; 'ok'`);
    A.ev(`sharedArrived(${J(sidecar(A.ev))}); 'ok'`);
    chk(name, 'a reopened draft', 'the shared copy is loaded only once the earlier session’s work is kept aside',
      J([A.ev('S.notes.A'), /EARLIER SESSION/.test(kept(A.ev))]), J(['SIDECAR', true])); }
  { const A0 = boot({ html: F1 }); wire(A0.ev, 'Alice', KEY.alice);
    A0.ev(`setNote('A','EARLIER TWO'); 'ok'`);
    const A = boot({ html: F1, ls: W1H.lsOf(A0.ev) }); wire(A.ev, 'Alice', KEY.alice);
    A.ev(`DIRTY=false; localStorage.setItem(_AP.key+'.kept', JSON.stringify({t:1, why:'folder', by:'X', ts:0, base:{}})+'\\n'+JSON.stringify({other:'KEPT BEFORE'})); 'ok'`);
    A.ev(`sharedArrived(${J(sidecar(A.ev))}); 'ok'`);
    chk(name, 'other work already kept', 'nothing is loaded: the earlier session’s work stays on screen, and what was kept stays kept',
      J([A.ev('S.notes.A'), /KEPT BEFORE/.test(kept(A.ev))]), J(['EARLIER TWO', true])); }
  { const A = boot({ html: F1 }); wire(A.ev, 'Alice', KEY.alice); A.ev(`DIRTY=false; 'ok'`);
    A.ev(`sharedArrived(${J(sidecar(A.ev))}); 'ok'`);
    chk(name, 'nothing unsaved (a CONTROL)', 'a newer shared file is loaded on opening, as before', A.ev('S.notes.A'), 'SIDECAR'); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.96 — a repaired award keeps its original whole, however long (NR04)';
  try {
  const { J, wire, KEY, baseFile } = W1H;
  const F1 = baseFile('Alice', KEY.alice);
  const A = boot({ html: F1 }); wire(A.ev, 'Alice', KEY.alice);
  for (const n of [10, 2600, 4000]) {
    const r = JSON.parse(A.ev(`(function(){ const aw={mode:'inc', inc:[]}; for(let i=0;i<${n};i++) aw.inc.push({d:'2027-'+(13+(i%5)), day:5, sv:[100,200,300]});
      const want=JSON.stringify(aw), o=awdNorm(aw, {n:SVC.length, ask:[1000,1000,1000]}), f=o.aw.fix, got=Array.isArray(f.orig)? f.orig.join('') : String(f.orig);
      const parts=Array.isArray(f.orig)? f.orig : [f.orig];
      const door=awdNorm(o.aw, {door:true, n:SVC.length});
      return JSON.stringify({len:want.length, whole:got===want, maxPart:Math.max.apply(null, parts.map(function(p){ return p.length; })), door:door.why||''}); })()`));
    chk(name, n + ' malformed increments (' + r.len + ' characters)', 'the original is kept whole, in pieces the import door takes, and the door accepts it',
      J([r.whole, r.maxPart <= 100000, r.door]), J([true, true, '']));
  }
  // through Save and reopening, and back in through the full import door
  A.ev(`(function(){ const aw={mode:'inc', inc:[]}; for(let i=0;i<4000;i++) aw.inc.push({d:'2027-13', day:5, sv:[100,200,300]});
    globalThis.__orig=JSON.stringify(aw); S.awards.A=awdNorm(aw, {n:SVC.length, ask:[1000,1000,1000]}).aw; save(); })(); 'ok'`);
  const OT = `(function(o){ return Array.isArray(o)? o.join('') : String(o); })`;
  const want = A.ev(`${OT}(S.awards.A.fix.orig)`);
  const saved = A.ev('buildSavedHtml()');
  const B = boot({ html: saved }); wire(B.ev, 'Alice', KEY.alice);
  chk(name, 'saved and reopened', 'the reopened board holds the original, every character of it, and the saved file passes the import door',
    J([B.ev(`${OT}(((S.awards||{}).A||{fix:{}}).fix.orig)`) === want, want === A.ev('globalThis.__orig'), B.ev(`inboundCheck(${J(saved)})`)]), J([true, true, '']));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v1.96 review ====
// ==== end W2 ====

// ==== v1.95 W3: PMO packages and incoming awards (items 51, 52, 53) ====
// The review's R03, R04 and R09, driven through the board's own paths the way the reproductions drove them: a
// real board file, a real PMO copy published from it, the office's edits through the award block's own editors,
// the real pmoSubmit(), and the receiving board's pmoTake(), tick and pmoApply(); and every way an award comes in.
const w3it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Req ' + id,
  event: 'Event ' + id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
// A real saved board file: seeded, its items made the baseline, saved, and read back as its HTML.
const w3file = (sc, extra = '') => { const b = boot(); seed(b.ev, sc);
  b.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    applyState(S); ${extra}; save(); 'ok'`);
  return b.ev('buildSavedHtml()'); };
// publishPmoCopy() as the File menu runs it, capturing the copy it would have downloaded
const w3publish = (html) => boot({ html }).ev(`(function(){ var cap=null, _B=window.Blob;
  window.Blob=function(pt,o){ if(!cap && o && o.type==='text/html') cap=String(pt[0]); return new _B(pt,o); };
  try{ localStorage.setItem('prio27who','Portfolio Lead'); }catch(e){}
  window.confirm=function(){ return true; }; try{ publishPmoCopy(); }catch(e){} window.Blob=_B; return cap||''; })()`);
// pmoSubmit() in a copy, capturing the package and what it said
const w3submit = (P, pmo) => JSON.parse(P.ev(`(function(){
  try{ localStorage.setItem('prio27who','${pmo} Lead'); localStorage.setItem('prio27pmo','${pmo}'); }catch(e){}
  var cap=null, _B=window.Blob; window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
  var al=[], _a=window.alert; window.alert=function(m){ al.push(String(m)); };
  try{ pmoSubmit(); }catch(e){ al.push('THREW '+e.message); } window.Blob=_B; window.alert=_a;
  return JSON.stringify({pkg: cap? JSON.parse(cap) : null, alerts: al}); })()`));
// every alert and question, recorded; each question answered from a queue (yes once it runs dry)
const w3dlg = (ev, ans = []) => ev(`window.__dlg=[]; window.__ans=${JSON.stringify(ans)};
  window.alert=function(m){ window.__dlg.push(['alert', String(m)]); };
  window.confirm=function(m){ var a=window.__ans.length? window.__ans.shift() : true; window.__dlg.push(['confirm', String(m), a]); return a; };
  window.prompt=function(){ return '1'; }; 'ok'`);
const w3said = (ev) => JSON.parse(ev(`JSON.stringify(window.__dlg.splice(0))`));
// The board's cash by service: CR Cash Needs by half-month window and its UNSCHEDULED (crData), and the spend plan
// by month and its UNSCHEDULED (monSpreadOf, the rule every month sheet uses). Whole dollars; empty windows left out.
const w3cash = (ev) => JSON.parse(ev(`JSON.stringify((function(){
  var r=function(x){ return Math.round(x); }, W=crWins().map(function(w){ return w.lbl; }), o={};
  crData(null).forEach(function(b,i){ var c={}; b.win.forEach(function(v,k){ if(r(v)) c[W[k]]=r(v); }); c.UNSCHEDULED=r(b.nodate); o['CR '+SVC[i]]=c; });
  var T=tiers(null, scenOpt());
  SVC.forEach(function(s,i){ var m={}, u=0;
    S.order.forEach(function(id){ var p=T[id]; if(!p) return; var ms=monSpreadOf(id,p);
      ms.m[i].forEach(function(v,k){ if(v) m[FYMON[k][0]]=(m[FYMON[k][0]]||0)+v; }); u+=ms.unsch[i]; });
    Object.keys(m).forEach(function(k){ m[k]=r(m[k]); }); m.UNSCHEDULED=r(u); o['plan '+s]=m; });
  return o; })())`));
// A file door, driven the way its file input drives it: a real File, and done when it clears the input.
const w3drive = (ev, fn, name, txt) => ev(`new Promise(function(res){
  var inp={files:[new File([${JSON.stringify(txt)}], ${JSON.stringify(name)})], value:'x'};
  try{ ${fn}(inp); }catch(e){ window.__dlg.push(['THREW', String(e.message)]); }
  (function wait(n){ if(inp.value==='' || n>600) return res('done'); setTimeout(function(){ wait(n+1); }, 5); })(0); })`);
const w3ls = (ev) => JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));

// ── item 51: a submittal's awards follow the service NAMES, and so does every list in it ─────────────────────
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.95 W3 — a submittal’s awards are matched to its services by name (item 51)';
  try {
  // Two boards with the same requirements and the same money BY NAME, their services listed in opposite orders.
  // A has one award on 1 Dec for its whole value; B one award date, 10 Feb.
  const SND = { services: ['USN', 'USAF'], items: [w3it('A', 'AV', [2000000, 1000000]), w3it('B', 'AV', [600000, 400000])],
    disc: [5000000, 5000000], mand: [0, 0], order: ['A', 'B'] };
  const RCV = { services: ['USAF', 'USN'], items: [w3it('A', 'AV', [1000000, 2000000]), w3it('B', 'AV', [400000, 600000])],
    disc: [5000000, 5000000], mand: [0, 0], order: ['A', 'B'] };
  const sndHtml = w3file(SND, `S.awards.A={mode:'inc', d:'2026-12', day:1, inc:[{d:'2026-12', day:1, sv:[2000000,1000000]}]}; S.awards.B={mode:'single', d:'2027-02', day:10}`);
  const rcvHtml = w3file(RCV, `S.awards.A={mode:'inc', d:'2026-12', day:1, inc:[{d:'2026-12', day:1, sv:[1000000,2000000]}]}; S.awards.B={mode:'single', d:'2027-02', day:10}`);
  const copy = w3publish(sndHtml);
  const P = boot({ html: copy });
  // THE OFFICE'S EDITS, in the copy's order (USN, USAF), through the editors the award block uses: A's one award
  // becomes USN $2,000,000 on 5 Oct and USAF $1,000,000 on 20 Nov; B's USN value becomes $700,000; and a new
  // requirement is proposed, USN $300,000 / USAF $100,000, with an award for each.
  P.ev(`(function(){
    var addAt=function(id, v){ var e=document.getElementById('awdM-'+id); if(!e){ e=document.createElement('input'); e.id='awdM-'+id; document.body.appendChild(e); } e.value=v; addAwd(id); };
    var at=function(id, d, day){ return S.awards[id].inc.findIndex(function(x){ return x.d===d && x.day===day; }); };
    setAwdIncDate('A',0,'2026-10-05'); setAwdIncSvc('A',at('A','2026-10',5),1,'0');
    addAt('A','2026-11-20'); setAwdIncSvc('A',at('A','2026-11',20),1,'1000000');
    setAsk('B',0,'700000');
    syncAddPanel(); syncNaGrp(); document.getElementById('naGrp').value='AV';
    document.getElementById('naTitle').value='New fixture'; document.getElementById('naEvent').value='fixture buy';
    document.getElementById('naSvc0').value='300000'; document.getElementById('naSvc1').value='100000'; addReq();
    var n=S.custom[S.custom.length-1].id;
    setDesc(n,'Made-up.'); setCons(n,'Made-up.'); setObCat(n, OB_CATS[0]); S.ptype[n]='PRIME'; setDest(n,'to', flowEnts()[0].k);
    wbsStore('req',n,null,[{w:'9.9.9', v:[]}]);
    addAt(n,'2026-10-05'); addAt(n,'2026-11-20');
    setAwdIncSvc(n,at(n,'2026-10',5),0,'300000'); setAwdIncSvc(n,at(n,'2026-11',20),1,'100000');
    return 'ok'; })()`);
  const pkg = w3submit(P, 'AV').pkg;
  chk(name, 'fixture', 'control — the copy sends A’s awards, B’s value and the new requirement, in the copy’s order',
    JSON.stringify(pkg && [pkg.svc, pkg.items.A.awards.inc.map(x => x.sv), pkg.items.B.asks, pkg.added.length]),
    JSON.stringify([['USN', 'USAF'], [[2000000, 0], [0, 1000000]], [700000, 400000], 1]));

  // ── TAKEN on the board whose services run USAF, USN ──
  const R = boot({ html: rcvHtml }); w3dlg(R.ev);
  R.ev(`pmoTake(${JSON.stringify(pkg)}, 'av.json'); 'ok'`);
  chk(name, 'take', 'control — it is held, with no question and no refusal', R.ev('PMOSUBS.length') + ' held, ' + w3said(R.ev).length + ' said', '1 held, 0 said');
  const held = JSON.parse(R.ev('JSON.stringify(PMOSUBS[0])'));
  chk(name, 'held', 'A’s proposed awards are held by name: USN $2,000,000 on 5 Oct, USAF $1,000,000 on 20 Nov',
    JSON.stringify(held.items.A.awards.inc.map(x => [x.d, x.day, x.sv])), JSON.stringify([['2026-10', 5, [0, 2000000]], ['2026-11', 20, [1000000, 0]]]));
  chk(name, 'held', 'the baseline it was written against is held by name too',
    JSON.stringify(held.baseSeen.A.awards.inc.map(x => x.sv)), JSON.stringify([[1000000, 2000000]]));
  chk(name, 'held', 'the new requirement’s value and awards are held by name',
    JSON.stringify([held.added[0].ask, held.added[0].awards.inc.map(x => x.sv)]), JSON.stringify([[100000, 300000], [[0, 300000], [100000, 0]]]));
  // ── THE REVIEW: no false conflict, and every award's date and dollars by service, before and after ──
  const rows = JSON.parse(R.ev(`JSON.stringify(pmoRows().map(function(r){ return {id:r.id, key:r.key, conflict:r.conflict,
    now:String(pmoFmtVal(r.key,r.now)), prop:String(pmoFmtVal(r.key,r.prop))}; }))`));
  const aw = rows.find(r => r.id === 'A' && r.key === 'awards') || {};
  chk(name, 'review', 'no field is flagged as a conflict: this board changed nothing since the copy went out',
    rows.filter(r => r.conflict).map(r => r.id + '|' + r.key).join(',') || 'none', 'none');
  chk(name, 'review', 'the proposed awards read by date, with dollars by service',
    aw.prop, 'incremental — 2 awards: 5 OCT 26: USAF $0 · USN $2,000,000; 20 NOV 26: USAF $1,000,000 · USN $0');
  chk(name, 'review', 'and so do the board’s own, beside them', aw.now, 'incremental — 1 award: 1 DEC 26: USAF $1,000,000 · USN $2,000,000');
  chk(name, 'review', 'the new requirement’s row shows its awards by service too',
    /incremental — 2 awards: 5 OCT 26: USAF \$0 · USN \$300,000; 20 NOV 26: USAF \$100,000 · USN \$0/.test((rows.find(r => r.key === '__new') || {}).prop || ''), true);
  // the change report, read back with the board's own workbook reader: the Proposed cell says the same
  const book = JSON.parse(await R.w.eval(`(async function(){
    var cap=null, _B=window.Blob;
    window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
    try{ pmoReport(); }catch(e){ return JSON.stringify({err:String((e&&e.message)||e)}); }
    window.Blob=_B; if(!cap) return JSON.stringify({err:'no workbook'});
    var sh=await xlsxRead(cap.buffer.slice(cap.byteOffset, cap.byteOffset+cap.byteLength));
    return JSON.stringify({rows:sh[Object.keys(sh)[0]]}); })()`));
  const brows = book.rows || [], H = (brows[3] || []).map(String);
  const bA = brows.find(r => r[H.indexOf('Field')] === 'Award / obligation date') || [];
  chk(name, 'change report', 'the award row’s Proposed cell gives each award’s date and dollars by service',
    String(bA[H.indexOf('Proposed')]), 'incremental — 2 awards: 5 OCT 26: USAF $0 · USN $2,000,000; 20 NOV 26: USAF $1,000,000 · USN $0');
  chk(name, 'change report', 'and its On the board now cell the board’s own', String(bA[H.indexOf('On the board now')]),
    'incremental — 1 award: 1 DEC 26: USAF $1,000,000 · USN $2,000,000');
  chk(name, 'change report', 'and the header says the year the submittal is held for', /AV by AV Lead .* — for FY27/.test(String((brows[1] || [])[0])), true);
  // ── APPLIED: stored by name, and every service's cash in its own half-month, nothing UNSCHEDULED ──
  R.ev(`subPickAll(true); pmoApply(); 'ok'`);
  const ap = w3said(R.ev);
  chk(name, 'apply', 'the apply question names the year and warns of no overwrite',
    ap.length === 1 && /to FY27\?/.test(ap[0][1]) && !/THIS BOARD changed/.test(ap[0][1]), true);
  const nid = R.ev(`(S.custom.filter(function(c){ return c.from; })[0]||{}).id||''`);
  chk(name, 'stored', 'A’s awards are stored by name (USAF, USN)', R.ev(`JSON.stringify(S.awards.A.inc.map(function(x){ return [x.d, x.day, x.sv]; }))`),
    JSON.stringify([['2026-10', 5, [0, 2000000]], ['2026-11', 20, [1000000, 0]]]));
  chk(name, 'stored', 'control (v1.94 did this already) — B’s value is stored by name', R.ev(`JSON.stringify(itemById('B').ask)`), JSON.stringify([400000, 700000]));
  chk(name, 'stored', 'the new requirement is stored by name, its value and its awards',
    R.ev(`JSON.stringify([itemById(${JSON.stringify(nid)}).ask, S.awards[${JSON.stringify(nid)}].inc.map(function(x){ return x.sv; })])`),
    JSON.stringify([[100000, 300000], [[0, 300000], [100000, 0]]]));
  const c = w3cash(R.ev);
  const want = { 'CR USAF': { '16–30 NOV': 1100000, '1–15 FEB': 400000, UNSCHEDULED: 0 }, 'CR USN': { '1–15 OCT': 2300000, '1–15 FEB': 700000, UNSCHEDULED: 0 },
    'plan USAF': { '2026-11': 1100000, '2027-02': 400000, UNSCHEDULED: 0 }, 'plan USN': { '2026-10': 2300000, '2027-02': 700000, UNSCHEDULED: 0 } };
  chk(name, 'cash', 'CR Cash Needs, USN: 1–15 OCT $2,300,000 (A $2,000,000 + new $300,000), 1–15 FEB $700,000 (B), nothing UNSCHEDULED',
    JSON.stringify(c['CR USN']), JSON.stringify(want['CR USN']));
  chk(name, 'cash', 'CR Cash Needs, USAF: 16–30 NOV $1,100,000 (A $1,000,000 + new $100,000), 1–15 FEB $400,000, nothing UNSCHEDULED',
    JSON.stringify(c['CR USAF']), JSON.stringify(want['CR USAF']));
  chk(name, 'cash', 'the spend plan by month, USN', JSON.stringify(c['plan USN']), JSON.stringify(want['plan USN']));
  chk(name, 'cash', 'the spend plan by month, USAF', JSON.stringify(c['plan USAF']), JSON.stringify(want['plan USAF']));
  const R2 = boot({ html: R.ev('buildSavedHtml()') });
  chk(name, 'cash', 'and the same after a save and a reopen', JSON.stringify(w3cash(R2.ev)), JSON.stringify(want));

  // ── A WALK OVER THE HELD PACKAGE, sharing nothing with the board's list of what to reorder ──
  // Every list of two figures anywhere in the package -- values, WBS lines, awards; proposals, baseline and the new
  // requirement -- is painted with its service's place in the COPY's order (USN 1, USAF 2). Once taken, every one
  // must read in THIS board's order (2, 1), and none may be missing.
  const mark = JSON.parse(JSON.stringify(pkg));
  mark.items.A.wbs = [{ w: '9.1', v: [0, 0] }]; mark.base.A.wbs = [{ w: '9.1', v: [0, 0] }]; mark.added[0].wbs = [{ w: '9.9.9', v: [0, 0] }];
  let painted = 0;
  const paint = o => { if (Array.isArray(o)) { if (o.length === 2 && o.every(x => typeof x === 'number')) { o[0] = 1; o[1] = 2; painted++; } else o.forEach(paint); }
    else if (o && typeof o === 'object') Object.values(o).forEach(paint); };
  paint(mark.items); paint(mark.base); paint(mark.added);
  const W = boot({ html: rcvHtml }); w3dlg(W.ev);
  W.ev(`pmoTake(${JSON.stringify(mark)}, 'av.json'); 'ok'`);
  const walked = JSON.parse(W.ev(`JSON.stringify((function(){ var t={moved:0, left:0}, pk=PMOSUBS[0]||{};
    var go=function(o){ if(Array.isArray(o)){ if(o.length===2 && o.every(function(x){ return typeof x==='number'; })){
      if(o[0]===2 && o[1]===1) t.moved++; else if(o[0]===1 && o[1]===2) t.left++; } else o.forEach(go); }
      else if(o && typeof o==='object') Object.keys(o).forEach(function(k){ go(o[k]); }); };
    go(pk.items); go(pk.baseSeen); go(pk.added); return t; })())`));
  chk(name, 'walk', `every one of the ${painted} service-width lists in the held package is in this board’s order`,
    `${walked.moved} reordered, ${walked.left} left in the copy’s order`, `${painted} reordered, 0 left in the copy’s order`);

  // ── A LIST OF THE WRONG WIDTH IS REFUSED AND NAMED: never padded, cut or zeroed ──
  const vary = f => { const p = JSON.parse(JSON.stringify(pkg)); f(p); return p; };
  const was = (ev) => ev(`JSON.stringify(S.awards.A)`);
  // a proposed award for three services, in a submittal whose services are merely reordered
  const Wa = boot({ html: rcvHtml }); w3dlg(Wa.ev); const wa0 = was(Wa.ev);
  Wa.ev(`pmoTake(${JSON.stringify(vary(p => { p.items.A.awards.inc[0].sv.push(50000); }))}, 'av.json'); subPickAll(true); pmoApply(); 'ok'`);
  const saidA = w3said(Wa.ev).map(d => d[1]).join('\n');
  chk(name, 'wrong width', 'a proposed award for three services is left out of the review, and named',
    /Req A — Award \/ obligation date: it has an award 1 \(5 OCT 26\) with dollars for 3 services, and this board has 2/.test(saidA), true);
  chk(name, 'wrong width', 'and the board’s award is untouched', was(Wa.ev), wa0);
  // the same list, in a submittal whose services are listed in this board's own order
  const Wm = boot({ html: rcvHtml }); w3dlg(Wm.ev); const wm0 = was(Wm.ev);
  Wm.ev(`pmoTake(${JSON.stringify(vary(p => { p.svc = ['USAF', 'USN']; p.items.A.awards.inc[1].sv.push(50000); }))}, 'av.json'); subPickAll(true); pmoApply(); 'ok'`);
  chk(name, 'wrong width', 'one in a submittal in this board’s own order is left out and named too',
    /award 2 \(20 NOV 26\) with dollars for 3 services/.test(w3said(Wm.ev).map(d => d[1]).join('\n')) && was(Wm.ev) === wm0, true);
  // a baseline of the wrong width: the package is damaged, and nothing is loaded
  const Wb = boot({ html: rcvHtml }); w3dlg(Wb.ev);
  Wb.ev(`pmoTake(${JSON.stringify(vary(p => { p.base.A.awards.inc[0].sv.push(0); }))}, 'av.json'); 'ok'`);
  chk(name, 'wrong width', 'a baseline award for three services refuses the package, naming it',
    Wb.ev('PMOSUBS.length') + ' held; ' + (/the baseline it was written against\) — award 1 \(1 DEC 26\) \(3 figures\)/.test(w3said(Wb.ev).map(d => d[1]).join('\n')) ? 'named' : 'silent'),
    '0 held; named');
  // a new requirement's award of the wrong width: left out and named, the rest of it still offered
  const Wn = boot({ html: rcvHtml }); w3dlg(Wn.ev);
  Wn.ev(`pmoTake(${JSON.stringify(vary(p => { p.added[0].awards.inc[0].sv.pop(); }))}, 'av.json'); 'ok'`);
  chk(name, 'wrong width', 'a new requirement’s award for one service is left out, named, and the rest offered',
    JSON.stringify([Wn.ev('JSON.stringify(PMOSUBS[0].added[0].awards)'),
      /New fixture \(proposed new\) — Award \/ obligation date: it has an award 1 \(5 OCT 26\) with dollars for 1 service/.test(w3said(Wn.ev).map(d => d[1]).join('\n'))]),
    JSON.stringify(['null', true]));
  // ── NO SERVICE LIST: refused whenever it carries a service-width figure -- an award as much as a value ──
  const Wl = boot({ html: rcvHtml }); w3dlg(Wl.ev); const wl0 = was(Wl.ev);
  Wl.ev(`pmoTake(${JSON.stringify(vary(p => { delete p.svc; delete p.items.B; delete p.base.B; p.added = []; }))}, 'av.json'); 'ok'`);
  const saidL = w3said(Wl.ev).map(d => d[1]).join('\n');
  Wl.ev(`subPickAll(true); pmoApply(); 'ok'`);
  chk(name, 'no list', 'a package carrying only awards and no service list is refused, naming each award',
    Wl.ev('PMOSUBS.length') + ' held; ' + (/does not say which services/.test(saidL) && /Req A — award 1 \(5 OCT 26\)/.test(saidL) && /Req A — award 2 \(20 NOV 26\)/.test(saidL) ? 'named' : 'silent'),
    '0 held; named');
  chk(name, 'no list', 'and the board is untouched', was(Wl.ev), wl0);
  // CONTROL (holds on v1.94 too): the same package on a board in the copy's own order lands exactly as it was sent
  const Cn = boot({ html: w3file(SND, `S.awards.A={mode:'inc', d:'2026-12', day:1, inc:[{d:'2026-12', day:1, sv:[2000000,1000000]}]}; S.awards.B={mode:'single', d:'2027-02', day:10}`) });
  w3dlg(Cn.ev); Cn.ev(`pmoTake(${JSON.stringify(pkg)}, 'av.json'); subPickAll(true); pmoApply(); 'ok'`);
  chk(name, 'control', 'control — on a board in the copy’s own order, the awards land as sent',
    Cn.ev(`JSON.stringify(S.awards.A.inc.map(function(x){ return x.sv; }))`), JSON.stringify([[2000000, 0], [0, 1000000]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();

// ── item 52: a held submittal applies only to the year it was written for ─────────────────────────────────────
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.95 W3 — held proposals apply only to the year they were written for (item 52)';
  try {
  const SC = { services: ['USAF', 'USN'], items: [w3it('A', 'AV', [1000000, 2000000]), w3it('C', 'PSM', [500000, 500000])],
    disc: [5000000, 5000000], mand: [0, 0], order: ['A', 'C'] };
  const FY27 = w3file(SC);                                  // a board holding FY27 only
  const roll = (on27) => { const b = boot({ html: FY27 });   // and one rolled forward to FY28 by switchYear's own roll
    b.ev(`window.confirm=function(){ return true; }; switchYear(2028); ${on27 ? 'switchYear(2027);' : ''} save(); 'ok'`); return b.ev('buildSavedHtml()'); };
  const FY28on28 = roll(false), FY28on27 = roll(true);
  const sub = (copyHtml, pmo, edits) => { const P = boot({ html: copyHtml }); P.ev(`${edits}; 'ok'`); return w3submit(P, pmo).pkg; };
  const c28 = w3publish(FY28on28), c27 = w3publish(FY27);
  // FY28: a value, a description and an award on 5 Oct 2027 (FY28's first month); FY27: the same, 20 Nov 2026
  const av28 = sub(c28, 'AV', `setDesc('A','FY28 scope (AV)'); setAsk('A',0,'1500000'); setAwdDateFull('A','2027-10-05')`);
  const av27 = sub(c27, 'AV', `setDesc('A','FY27 scope (AV)'); setAsk('A',0,'1200000'); setAwdDateFull('A','2026-11-20')`);
  const psm28 = sub(c28, 'PSM', `setDesc('C','FY28 scope (PSM)'); setAwdDateFull('C','2027-12-05')`);
  chk(name, 'fixture', 'control — each package says the year it was written for', [av28.fy, av27.fy, psm28.fy].join(','), '2028,2027,2028');
  // what each year holds for A and C
  const where = (ev) => ev(`JSON.stringify(Object.keys(MS.years).sort().map(function(y){ var s=MS.years[y];
    return 'FY'+(y%100)+' '+[((s.desc||{}).A||'-'), JSON.stringify(((s.asks||{}).A)||null), JSON.stringify(((s.awards||{}).A)||null), ((s.desc||{}).C||'-'), JSON.stringify(((s.awards||{}).C)||null)].join('|'); }))`);
  const say = (ev) => w3said(ev).map(d => d[0] + ': ' + d[1]).join('\n');

  // (a) an FY28 package on a board that has no FY28, on FY27
  const A = boot({ html: FY27 }); w3dlg(A.ev);
  const a0 = where(A.ev);
  A.ev(`pmoTake(${JSON.stringify(av28)}, 'av28.json'); 'ok'`);
  const aTake = say(A.ev);
  chk(name, 'no FY28 on the board', 'taking it names both years, and that this board has no FY28 yet',
    /written for FY28, and this board is on FY27/.test(aTake) && /has no FY28 yet/.test(aTake), true);
  chk(name, 'no FY28 on the board', 'it is held for FY28', A.ev('PMOSUBS[0].forFy'), 2028);
  A.ev(`subPickAll(true); pmoApply(); 'ok'`);
  const aApply = say(A.ev);
  chk(name, 'no FY28 on the board', 'applying on FY27 is refused, naming the office’s year', /Nothing was applied/.test(aApply) && /AV — for FY28/.test(aApply), true);
  chk(name, 'no FY28 on the board', 'and nothing is written to FY27', where(A.ev), a0);
  // switching to FY28 (rolled forward) is what lets it apply -- and there its award date is in the year
  A.ev(`switchYear(2028); subPickAll(true); pmoApply(); 'ok'`); say(A.ev);
  chk(name, 'no FY28 on the board', 'on FY28 it applies to FY28 alone',
    JSON.parse(where(A.ev)).join(' / '),
    'FY27 -|null|null|-|null / FY28 FY28 scope (AV)|[1500000,2000000]|{"mode":"single","d":"2027-10","day":5}|-|null');
  const aCash = w3cash(A.ev);
  chk(name, 'no FY28 on the board', 'control (v1.94 reached it by the wrong road) — A’s cash lands in 1–15 OCT of FY28, by service',
    JSON.stringify([aCash['CR USAF']['1–15 OCT'], aCash['CR USN']['1–15 OCT']]), JSON.stringify([1500000, 2000000]));

  // (b) an FY27 package held through a switch to FY28 -- on a board without FY28, and on one that has it
  for (const [lbl, html] of [['rolled forward', FY27], ['already holding FY28', FY28on27]]) {
    const B = boot({ html }); w3dlg(B.ev);
    B.ev(`pmoTake(${JSON.stringify(av27)}, 'av27.json'); switchYear(2028); 'ok'`); say(B.ev);
    const b0 = where(B.ev);
    B.ev(`subPickAll(true); pmoApply(); 'ok'`);
    const bApply = say(B.ev);
    chk(name, 'switched to FY28 (' + lbl + ')', 'applying on FY28 is refused, naming FY27', /Nothing was applied/.test(bApply) && /AV — for FY27/.test(bApply), true);
    chk(name, 'switched to FY28 (' + lbl + ')', 'and nothing is written to either year', where(B.ev), b0);
    B.ev(`switchYear(2027); subPickAll(true); pmoApply(); 'ok'`); say(B.ev);
    chk(name, 'switched to FY28 (' + lbl + ')', 'control (v1.94 applied it here as well) — back on FY27 it applies to FY27',
      JSON.parse(where(B.ev))[0], 'FY27 FY27 scope (AV)|[1200000,2000000]|{"mode":"single","d":"2026-11","day":20}|-|null');
  }

  // (c) two offices' packages for different years, held together
  const C = boot({ html: FY28on27 }); w3dlg(C.ev);
  C.ev(`pmoTake(${JSON.stringify(av27)}, 'av27.json'); pmoTake(${JSON.stringify(psm28)}, 'psm28.json'); 'ok'`); say(C.ev);
  chk(name, 'mixed years', 'each is held for its own year', C.ev(`JSON.stringify(PMOSUBS.map(function(p){ return p.pmo+':'+p.forFy; }))`), JSON.stringify(['AV:2027', 'PSM:2028']));
  C.ev(`switchYear(2028); subPickAll(true); 'ok'`);
  const c0 = where(C.ev);
  C.ev(`pmoApply(); 'ok'`);
  const cApply = say(C.ev);
  chk(name, 'mixed years', 'applying both on FY28 is refused, naming each office’s year',
    /Nothing was applied/.test(cApply) && /AV — for FY27\n/.test(cApply) && /PSM — for FY28 \(the year on screen\)/.test(cApply), true);
  chk(name, 'mixed years', 'and nothing is written to either year', where(C.ev), c0);
  C.ev(`subPickAll(false, PMOSUBS.findIndex(function(p){ return p.pmo==='AV'; })); pmoApply(); 'ok'`); say(C.ev);
  chk(name, 'mixed years', 'with AV’s unticked, PSM’s applies to FY28 and only there',
    JSON.parse(where(C.ev)).join(' / '),
    'FY27 -|null|null|-|null / FY28 -|null|null|FY28 scope (PSM)|{"mode":"single","d":"2027-12","day":5}');

  // (d) a package that names no year: asked about, and held for the year on screen only if the reviewer says so
  const noFy = JSON.parse(JSON.stringify(av27)); delete noFy.fy;
  const D = boot({ html: FY28on27 }); w3dlg(D.ev, [false]);
  D.ev(`pmoTake(${JSON.stringify(noFy)}, 'nofy.json'); 'ok'`);
  chk(name, 'no year', 'a package with no year is asked about, and declining loads nothing',
    /does not say which fiscal year/.test(say(D.ev)) + ' ' + D.ev('PMOSUBS.length'), 'true 0');
  w3dlg(D.ev, [true]); D.ev(`pmoTake(${JSON.stringify(noFy)}, 'nofy.json'); 'ok'`); say(D.ev);
  chk(name, 'no year', 'saying yes holds it for the year on screen, FY27', D.ev('PMOSUBS[0].forFy'), 2027);
  // (e) applying to another year is an explicit choice that names it
  const E = boot({ html: FY27 }); w3dlg(E.ev, [false, true]);
  E.ev(`pmoTake(${JSON.stringify(av28)}, 'av28.json'); 'ok'`);
  const eTake = w3said(E.ev);
  chk(name, 'another year', 'declining FY28 asks, naming FY27, whether to hold it for FY27 instead',
    eTake.length === 2 && /Hold it for FY27 instead/.test(eTake[1][1]) && /written for FY28/.test(eTake[1][1]), true);
  E.ev(`subPickAll(true); pmoApply(); 'ok'`);
  const eApply = w3said(E.ev);
  chk(name, 'another year', 'held for FY27 by that choice, it applies to FY27, and the question says so',
    (eApply.length === 1 && /to FY27\?/.test(eApply[0][1])) + ' ' + JSON.parse(where(E.ev))[0],
    'true FY27 FY28 scope (AV)|[1500000,2000000]|{"mode":"single","d":"2027-10","day":5}|-|null');
  // (f) a year that cannot be read is refused
  const F = boot({ html: FY27 }); w3dlg(F.ev);
  F.ev(`pmoTake(${JSON.stringify(Object.assign({}, av27, { fy: 'FY27' }))}, 'bad.json'); 'ok'`);
  chk(name, 'unreadable year', 'a package naming a year the board cannot read is refused',
    /fiscal year this board cannot read/.test(say(F.ev)) + ' ' + F.ev('PMOSUBS.length'), 'true 0');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();

// ── item 53: an award is checked at every door it can come in by ──────────────────────────────────────────────
// The review's variants (r09), at each import door: a full board, one appropriation, a submittal, a proposed
// requirement and an appropriation package. (Opening a saved board -- the sixth -- is in audit-board.mjs, beside
// the cash it repairs.) What a door must not take it refuses, naming the award; what a legacy file wrote as text it
// converts; and a stored award figure is never anything but a whole number.
const W3_AW = (sv, d = '2026-10', day = 5) => ({ mode: 'inc', inc: [{ d, day, sv }] });
const W3_VARIANTS = [
  ['good', W3_AW([1000000, 2000000]), 'take', [1000000, 2000000]],
  ['numeric strings ["1000000","2000000"]', W3_AW(['1000000', '2000000']), 'take', [1000000, 2000000]],
  ['fractional [1000000.75,1999999.25]', W3_AW([1000000.75, 1999999.25]), 'take', [1000001, 1999999]],
  ['"1,234" and "abc"', W3_AW(['1,234', 'abc']), /figure is not a figure \(“1,234”\)/],
  ['comma-written ["1,000,000","2,000,000"]', W3_AW(['1,000,000', '2,000,000']), /figure is not a figure \(“1,000,000”\)/],
  ['negative [-500000,2000000]', W3_AW([-500000, 2000000]), /figure is negative \(“-500000”\)/],
  ['"Infinity"', W3_AW(['Infinity', 2000000]), /figure is not a figure \(“Infinity”\)/],
  ['"NaN"', W3_AW(['NaN', 2000000]), /figure is not a figure \(“NaN”\)/],
  ['1e400 in the file', W3_AW([7777777777, 2000000]), /not a real (figure|number) \(“Infinity”\)/, 'control', t => t.replace('7777777777', '1e400')],
  ['one figure for two services', W3_AW([3000000]), /with dollars for 1 service, and this board has 2/],
  ['three figures for two services', W3_AW([1000000, 2000000, 500000]), /with dollars for 3 services, and this board has 2/],
  ['dollars not a list', { mode: 'inc', inc: [{ d: '2026-10', day: 5, sv: '3000000' }] }, /dollars by service are not a list/],
  ['date "2027-13"', W3_AW([1000000, 2000000], '2027-13'), /date “2027-13” is not a month/],
  ['date "abc"', W3_AW([1000000, 2000000], 'abc'), /date “abc” is not a month/],
  ['day 45', W3_AW([1000000, 2000000], '2026-10', 45), /day “45” is not a day of the month/],
  ['single award, date "2027-13"', { mode: 'single', d: '2027-13', day: 5 }, /has a date, “2027-13”, that is not a month/],
  ['mode "bogus"', { mode: 'bogus', d: '2026-12', inc: [{ d: '2026-10', day: 5, sv: [1000000, 2000000] }] }, /neither a single award nor incremental awards \(its mode is “bogus”\)/],
  ['no mode', { inc: [{ d: '2026-10', day: 5, sv: [1000000, 2000000] }] }, /neither a single award nor incremental awards \(it carries no mode\)/],
  ['a list of awards that is an object', { mode: 'inc', inc: { 0: { d: '2026-10', day: 5, sv: [1000000, 2000000] } } }, /list of awards that is not a list/],
  ['a list of awards that is text', { mode: 'inc', inc: 'x' }, /list of awards that is not a list/],
];
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.95 W3 — incoming awards are checked at every import door (item 53)';
  try {
  const SC = { services: ['USAF', 'USN'], items: [w3it('A', 'AV', [1000000, 2000000])], disc: [5000000, 5000000], mand: [0, 0], order: ['A'] };
  const plain = w3file(SC);                               // A has no award: every door brings one in
  const RE = /(<script type="application\/json" id="pubState">)([\s\S]*?)(<\/script>)/;
  const fileWith = (aw, tx) => { const t = plain.replace(RE, (m, a, b, c) => { const J = JSON.parse(b); (J.appns ? J.appns.om : J).years['2027'].awards = { A: aw };
    return a + JSON.stringify(J).replace(/</g, '\\u003c') + c; }); return tx ? tx(t) : t; };
  // the real packages the other doors carry: a submittal from a real copy (an award on A, and a proposed new
  // requirement with an award of its own), and the appropriation's own return package
  const S0 = boot({ html: plain });
  const P = boot({ html: w3publish(plain) });
  P.ev(`setAwdDateFull('A','2026-10-05'); syncAddPanel(); syncNaGrp(); document.getElementById('naGrp').value='AV';
    document.getElementById('naTitle').value='Proposed fixture'; document.getElementById('naEvent').value='fixture';
    document.getElementById('naSvc0').value='1000000'; document.getElementById('naSvc1').value='2000000'; addReq();
    var n=S.custom[S.custom.length-1].id; setDesc(n,'Made-up.'); setCons(n,'Made-up.'); setObCat(n, OB_CATS[0]); S.ptype[n]='PRIME';
    setDest(n,'to', flowEnts()[0].k); wbsStore('req',n,null,[{w:'9.9', v:[]}]); setAwdDateFull(n,'2026-10-05'); 'ok'`);
  const sub0 = w3submit(P, 'AV').pkg;
  const ret0 = JSON.parse(S0.ev(`(function(){ var cap=null, _B=window.Blob;
    window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
    window.alert=function(){}; try{ pkgSendBack('om'); }catch(e){} window.Blob=_B; return cap; })()`));
  chk(name, 'fixture', 'control — a real submittal (an award, and a new requirement with one) and a real return package',
    !!(sub0 && sub0.items.A.awards && sub0.added.length === 1 && sub0.added[0].awards && ret0 && ret0.ms && ret0.ms.years['2027']), true);
  const DOORS = {
    'full board': { text: (aw, tx) => fileWith(aw, tx), run: async (ev, txt) => ev(`String(fullImportText(${JSON.stringify(txt)}, 'board.html'))`) },
    'one appropriation': { text: (aw, tx) => fileWith(aw, tx), run: async (ev, txt) => w3drive(ev, 'importState', 'om-only.html', txt) },
    'submittal': { text: (aw, tx) => { const p = JSON.parse(JSON.stringify(sub0)); p.items.A.awards = aw; const t = JSON.stringify(p); return tx ? tx(t) : t; },
      run: async (ev, txt) => w3drive(ev, 'importState', 'ORBIT SUBMITTAL - AV.json', txt) },
    'proposed requirement': { text: (aw, tx) => { const p = JSON.parse(JSON.stringify(sub0)); delete p.items.A; delete p.base.A; p.added[0].awards = aw; const t = JSON.stringify(p); return tx ? tx(t) : t; },
      run: async (ev, txt) => w3drive(ev, 'importState', 'ORBIT SUBMITTAL - AV.json', txt) },
    'appropriation package': { text: (aw, tx) => { const p = JSON.parse(JSON.stringify(ret0)); p.ms.years['2027'].awards = { A: aw }; const t = JSON.stringify(p); return tx ? tx(t) : t; },
      run: async (ev, txt) => w3drive(ev, 'importState', 'ORBIT PACKAGE - O&M.json', txt) },
  };
  // where an accepted award ends up, read the way a reopen reads it: the requirement it is on, its award, its cash
  const landed = async (door, B) => {
    if (door === 'submittal' || door === 'proposed requirement') {
      B.ev(`PMOPICK={}; pmoRows().forEach(function(r){ PMOPICK[pickKey(r)]=true; }); pmoApply(); 'ok'`);
      return boot({ html: B.ev('buildSavedHtml()') });
    }
    return door === 'full board' ? boot({ ls: w3ls(B.ev) }) : boot({ ls: w3ls(B.ev), html: plain });
  };
  for (const door of Object.keys(DOORS)) {
    const D = DOORS[door];
    // ONE BOARD TAKES EVERY FILE IT MUST REFUSE: a refusal changes nothing, so the next one meets the same board
    const N = door === 'full board' ? boot() : boot({ html: plain });
    for (const [lbl, aw, want, ctl, tx] of W3_VARIANTS) {
      if (want === 'take') continue;
      w3dlg(N.ev);
      await D.run(N.ev, D.text(aw, tx));
      const said = w3said(N.ev).map(d => d[0] + ': ' + d[1]).join('\n');
      const kept = N.ev(`String(JSON.stringify(((MS.years[2027]||{}).awards||{}).A||null))+' '+PMOSUBS.length+' '+(S.custom||[]).length`);
      chk(name, door, (ctl ? 'control (v1.94 refused this one too) — ' : '') + `${lbl}: refused, naming the award and what is wrong with it, and nothing reaches the board`,
        (/was not imported: the (award|figure) at [^\n]*awards/.test(said) && want.test(said) && kept === 'null 0 0') ? 'refused, named'
          : (kept + ' | ' + said).slice(0, 200), 'refused, named');
    }
    // WHAT IT TAKES, it takes whole: converted figures are numbers, whole dollars, and nothing is UNSCHEDULED
    for (const [lbl, aw, want, sv] of W3_VARIANTS) {
      if (want !== 'take') continue;
      const B = door === 'full board' ? boot() : boot({ html: plain }); w3dlg(B.ev);
      await D.run(B.ev, D.text(aw));
      const said = w3said(B.ev).map(d => d[0] + ': ' + d[1]).join('\n');
      const O = await landed(door, B);
      const id = door === 'proposed requirement' ? O.ev(`(S.custom.filter(function(c){ return c.from; })[0]||{}).id||'NONE'`) : 'A';
      const got = JSON.parse(O.ev(`JSON.stringify(((S.awards||{})[${JSON.stringify(id)}]||{inc:[{}]}).inc[0].sv)`) || 'null');
      chk(name, door, (lbl === 'good' ? 'control — ' : '') + `${lbl}: taken, stored as whole-dollar numbers, and nothing threw`,
        // (a full import and a taken appropriation end by reloading the page, which jsdom does not do: that note is not the board's)
        JSON.stringify(got) + ' ' + JSON.stringify(B.errors.concat(O.errors).filter(e => !/Not implemented: navigation/.test(e))), JSON.stringify(sv) + ' []');
      if (lbl !== 'good') chk(name, door, `${lbl}: and the conversion is reported`,
        /written as text|fractions of a dollar|written the old way/.test(said) || O.ev(`JSON.stringify((attLists().awfix||[]).map(function(x){ return x.how; }))`) === '["conv"]', true);
      const cr = JSON.parse(O.ev(`JSON.stringify(crData(null).map(function(b){ return Math.round(b.nodate); }))`));
      if (lbl === 'good' && door !== 'proposed requirement') chk(name, door, 'control — a valid award leaves nothing UNSCHEDULED', JSON.stringify(cr), '[0,0]');
    }
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// v1.95 (integration), ITEM 53: AN ACCEPTED AWARD KEEPS A REPAIRED ONE'S ORIGINAL. The board opens A's award repaired
// (saved for three services on a board of two: its total kept, spread, the record as found in aw.fix). An office's
// copy proposes a new date for A's award. Accepting it wrote the office's award over the board's, and the record as
// found went with it -- every hand edit keeps it (awdKeepFix), this did not. And the review compared the repair
// bookkeeping as part of the award, so a repaired award would stay listed after it was accepted.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.95 — accepting an office’s award over a repaired one keeps the original';
  try {
  const SC = { services: ['USAF', 'USN'], items: [w3it('A', 'AV', [1000000, 2000000])], disc: [5000000, 5000000], mand: [0, 0], order: ['A'] };
  const good = w3file(SC, `S.awards.A={mode:'inc', d:'2026-12', day:1, inc:[{d:'2026-12', day:1, sv:[1000000,2000000]}]}`);
  const P = boot({ html: w3publish(good) });
  P.ev(`setAwdIncDate('A',0,'2026-10-05'); 'ok'`);
  const pkg = w3submit(P, 'AV').pkg;
  const bad = w3file(SC, `S.awards.A={mode:'inc', d:'2026-12', day:1, inc:[{d:'2026-12', day:1, sv:[1000000,2000000,500000]}]}`);
  const R = boot({ html: bad }); w3dlg(R.ev);
  const orig = R.ev(`String(((S.awards.A||{}).fix||{}).orig||'')`);
  chk(name, 'fixture', 'CONTROL — the board opens A’s award repaired, the record as found kept', /500000/.test(orig), true);
  R.ev(`pmoTake(${JSON.stringify(pkg)}, 'av.json'); subPickAll(true); pmoApply(); 'ok'`);
  const A = JSON.parse(R.ev(`JSON.stringify(S.awards.A)`));
  chk(name, 'accepted', 'CONTROL — the office’s award is on the board: its date, 5 October', JSON.stringify((A.inc || []).map(x => x.d + '-' + x.day)), JSON.stringify(['2026-10-5']));
  chk(name, 'accepted', 'the record as it was found stays with it', String((A.fix || {}).orig || '') === orig && orig.length > 0, true);
  chk(name, 'accepted', 'and the award drops off the review: nothing about A is left to take', R.ev(`pmoRows().filter(function(r){ return r.id==='A' && r.key==='awards'; }).length`), 0);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end W3 ====

// ==== v1.95 W4: journal by year, PMO drill and PMO by year (items 54, 55) ====
// v1.95, ITEM 54 (review R08): THE JOURNAL KEEPS FISCAL YEARS APART.
// The journal joined a person's edits to one field inside a minute and never asked which YEAR. An FY27
// note edit and the same note in FY28 became one FY27 line holding FY28's text; Put back on it undid
// FY27 and kept FY28, and FY27's text then existed nowhere. Edits in two years that cancelled left no
// line at all; an edit just after a put-back rewrote the put-back line; a clock set back still counted
// as inside the minute; two loads inside a minute became one; and a new year's line read "undefined".
// Driven through the real editors: the Description & note box (openFld → fldSave), switchYear, and the
// journal's own Put back (jrnlUndo). The clock is held still and moved by hand, so "inside a minute"
// is a fact of the test rather than of how quickly the machine ran it.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.95 — the journal keeps fiscal years apart';
  try {
  const J = JSON.stringify;
  const mkJ = () => {
    const B = boot({ ls: { prio27who: 'alice' } });
    seed(B.ev, { services: ['USAF', 'ANG'], items: [it('A', 'AV', [10, 10]), it('B', 'AV', [5, 5])],
      disc: [100, 100], mand: [100, 100], order: ['A', 'B'] });
    B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); MS.years[MS.cur]=S; save();
      globalThis.__T=Date.now(); Date.now=function(){ return globalThis.__T; }; 'ok'`);
    B.later = ms => B.ev(`globalThis.__T+=${ms}; 'ok'`);
    B.note = (id, v) => B.ev(`openFld(${J(id)},'dn'); document.getElementById('fld-note').value=${J(v)}; fldSave(); 'ok'`);
    B.year = y => B.ev(`switchYear(${y}); 'ok'`);
    B.n = () => +B.ev('(MS.jrnl||[]).length');
    B.lines = from => JSON.parse(B.ev(`JSON.stringify((MS.jrnl||[]).slice(${from}).map(function(e){ return [e.fy, (e.p||[]).join('.'), e.a, e.b, e.f? 1 : 0]; }))`));
    B.undo = i => B.ev(`jrnlUndo(${i}); 'ok'`);
    B.notes = id => JSON.parse(B.ev(`JSON.stringify(Object.keys(MS.years).sort().map(function(y){ var v=(MS.years[y].notes||{})[${J(id)}]; return v===undefined? null : v; }))`));
    return B;
  };
  // ── 1. an edit in each of two years, then Put back, each year in turn ──
  const B = mkJ();
  const cur = +B.ev('MS.cur');
  B.note('A', 'orig');
  B.year(cur + 1); B.year(cur);                 // FY+1 rolled forward from this year: both read 'orig'
  const yl = B.ev(`(function(){ var e=(MS.jrnl||[]).filter(function(x){ return Array.isArray(x.p) && !x.p.length; })[0];
      return e? String(jrnlLabel(e)).replace(/<[^>]+>/g,'') : '(no line)'; })()`);
  chk(name, 'a new year', 'the line a new year writes names the year', yl, 'the FY' + ((cur + 1) % 100) + ' plan — created');
  B.ev(`jrnlOpen=true; jrnlBody(); 'ok'`);
  chk(name, 'a new year', 'and nothing in the journal panel reads "undefined"', /undefined/.test(B.ev(`document.getElementById('jrnlBody').textContent`)), false);
  B.ev(`jrnlOpen=false; jrnlBody(); 'ok'`);
  B.later(120000);
  const n0 = B.n();
  B.note('A', 'FY27 edit'); B.year(cur + 1); B.note('A', 'FY28 edit');     // the same person, the same note, the same second
  chk(name, 'two years', 'an edit in each year is a line for each year, each with its own text',
    J(B.lines(n0)), J([[cur, 'notes.A', 'orig', 'FY27 edit', 0], [cur + 1, 'notes.A', 'orig', 'FY28 edit', 0]]));
  B.undo(n0 + 1);
  chk(name, 'put back', 'putting back the FY+1 line puts back FY+1 and leaves this year as edited', J(B.notes('A')), J(['FY27 edit', 'orig']));
  B.undo(n0);
  chk(name, 'put back', 'putting back this year’s line, from FY+1, puts back this year alone', J(B.notes('A')), J(['orig', 'orig']));
  const byYear = y => B.lines(n0).filter(l => l[0] === y).map(l => [l[2], l[3], l[4]]);
  chk(name, 'history', 'each year keeps its own history: its edit and its put-back',
    J([byYear(cur), byYear(cur + 1)]), J([[['orig', 'FY27 edit', 0], ['FY27 edit', 'orig', 1]], [['orig', 'FY28 edit', 0], ['FY28 edit', 'orig', 1]]]));
  B.undo(B.n() - 1);                            // the newest line: this year's put-back
  chk(name, 'put back', 'putting back the put-back brings this year’s own text back, and FY+1 is untouched', J(B.notes('A')), J(['FY27 edit', 'orig']));
  // ── 2. edits in two years that cancel: both recorded ──
  const C = mkJ();
  C.note('A', 'alpha'); C.year(cur + 1); C.note('A', 'beta'); C.year(cur);
  C.later(120000);
  const m0 = C.n();
  C.note('A', 'beta'); C.year(cur + 1); C.note('A', 'alpha');                // alpha→beta here, beta→alpha there
  chk(name, 'cancelling edits', 'this year alpha → beta and FY+1 beta → alpha are both recorded',
    J(C.lines(m0)), J([[cur, 'notes.A', 'alpha', 'beta', 0], [cur + 1, 'notes.A', 'beta', 'alpha', 0]]));
  // ── 3. a put-back line stays as written ──
  C.year(cur); C.later(120000);
  const k0 = C.n();
  C.note('B', 'v1'); C.later(120000);
  C.undo(C.n() - 1);                            // put back: v1 → not set
  C.later(5000); C.note('B', 'v2');             // five seconds later, the same note
  chk(name, 'a put-back line', 'stays as written, and the edit just after it is a line of its own',
    J(C.lines(k0)), J([[cur, 'notes.B', null, 'v1', 0], [cur, 'notes.B', 'v1', null, 1], [cur, 'notes.B', null, 'v2', 0]]));
  // ── 4. a clock set back never joins ──
  C.later(120000);
  const q0 = C.n();
  C.note('A', 'morning'); C.later(-3 * 3600 * 1000); C.note('A', 'afternoon');
  chk(name, 'a clock set back', 'an edit stamped before the line above it is a line of its own',
    J(C.lines(q0).map(l => [l[2], l[3]])), J([['beta', 'morning'], ['morning', 'afternoon']]));
  // ── 5. a load stands on its own line ──
  const l0 = C.n();
  C.ev(`jrnlSync('restored the copy from one'); jrnlSync('restored the copy from two'); 'ok'`);
  chk(name, 'loads', 'two loads inside a minute are two forced lines, each as written',
    J(C.lines(l0).map(l => [l[1], l[3], l[4]])), J([['(load)', 'restored the copy from one', 1], ['(load)', 'restored the copy from two', 1]]));
  // CONTROL (passes on v1.94 too): one field, one year, inside the minute is still one line
  C.later(120000);
  const c0 = C.n();
  C.note('A', 'one'); C.later(10000); C.note('A', 'two');
  chk(name, 'control', 'CONTROL — two edits to one note in one year inside a minute are still one line (passes on v1.94)',
    J(C.lines(c0).map(l => [l[2], l[3]])), J([['afternoon', 'two']]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end W4 ====
// ==== v1.97 W1: money entry and the engine (items 72, 73, 74, 75) ====
// The 5 Oct review of v1.96, R01, R03 and R04, at the file boundary: what an older file carries, and what a typed figure
// does on its way through a save, an export and an import. Every check fails on v1.96 (SP/v197w/board196.html) unless it
// says CONTROL. Each read goes through w1ev, so a function an older board lacks fails its own checks, not the block.
const w1ev = (ev, code) => { try { return ev(code); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 120); } };
const w1json = (ev, code) => { const r = w1ev(ev, code); try { return JSON.parse(r); } catch { return r; } };
const w1sum = a => (Array.isArray(a) ? a : []).reduce((x, y) => x + y, 0);
const W1SC = { services: ['USAF', 'ANG'], items: [it('X', 'AV', [1, 1]), it('Y', 'PSM', [30, 50]), it('W', 'TSS', [500, 700])],
  disc: [100, 100], mand: [100, 100], order: ['X', 'Y', 'W'] };
// a board as a file, its requirements part of the board's own data, after EXTRA has run
const w1file = (extra = '') => { const b = boot(); seed(b.ev, W1SC);
  b.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`);
  if (extra) b.ev(`(function(){ ${extra}; })(); save(); 'ok'`);
  return b.ev('buildSavedHtml()'); };
// ⬅ Import, through the door, a file named NAME holding TXT; every question answered yes, every alert recorded
const w1import = (ev, name, txt) => ev(`new Promise(function(res){ window.__w1al=[]; window.alert=function(m){ window.__w1al.push(String(m)); };
  window.confirm=function(){ return true; }; window.prompt=function(){ return '1'; };   // the one appropriation the file carries
  var inp={files:[new File([${JSON.stringify(txt)}], ${JSON.stringify(name)})], value:'x'};
  try{ importState(inp); }catch(e){ window.__w1al.push('THREW '+e.message); }
  (function wait(n){ if(inp.value==='' || n>600) return res('done'); setTimeout(function(){ wait(n+1); }, 5); })(0); })`);
// what the browser holds afterwards: the import writes it and reopens, so the board it made is booted from it
const w1ls = ev => JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));

// v1.97 W1, ITEM 74 (review R03): A NEGATIVE ALLOCATION IN AN OLDER FILE IS KEPT AS IT WAS, COUNTS AS ZERO, AND IS LISTED FOR
// REPAIR. A board before v1.97 took -2 typed as an allocation and saved it. Opened, or imported, that file must neither
// lose the figure nor let it into the arithmetic: on v1.96 the basis went below zero and d + m + u stopped adding up.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.97 — an older file’s negative allocation is kept, listed and counts as zero (item 74)';
  try {
  const J = JSON.stringify;
  const html = w1file(`S.alloc.X={m:'t', v:-2}; S.alloc.Y={m:'s', v:[-7,20]}`);
  const read = ev => w1json(ev, `JSON.stringify((function(){ const T=tiers(), o={};
      ['X','Y'].forEach(function(id){ const x=itemById(id), t=T[id];
        o[id]={alloc:S.alloc[id], basis:basisSvcOf(x), dmu:t.d.map(function(v,i){ return v+t.m[i]+t.u[i]; }), d:t.d, unf:unfSvcOf(x,t),
               bt:beyondSvcOf(x,t).map(function(v,i){ return v+trimSvcOf(x)[i]; })}; });
      o.neg=((attLists()||{}).neg||[]).map(function(r){ return [r.id, r.n]; });
      return o; })())`);
  // by hand: X's -2 counts as 0 -> basis [0,0], its [1,1] all unfunded; Y's USAF -7 counts as 0 -> basis [0,20], ANG draws 20
  const want = { X: { alloc: { m: 't', v: -2 }, basis: [0, 0], d: [0, 0], unf: [1, 1] }, Y: { alloc: { m: 's', v: [-7, 20] }, basis: [0, 20], d: [0, 20], unf: [30, 30] },
                 neg: [['X', ['allocation −$2']], ['Y', ['USAF allocation −$7']]] };
  chk(name, 'the door', 'CONTROL — the import door takes the file: a negative within the bound is a figure, not a refusal (passes on v1.96)',
    w1ev(boot().ev, `inboundCheck(${J(html)})`), '');
  // OPENED
  const O = boot({ html });
  const o = read(O.ev);
  chk(name, 'opened', 'CONTROL — each allocation is kept exactly as the file had it (passes on v1.96)', J([o.X && o.X.alloc, o.Y && o.Y.alloc]), J([want.X.alloc, want.Y.alloc]));
  chk(name, 'opened', 'the basis is never below zero: X [0,0], Y [0,20]', J([o.X && o.X.basis, o.Y && o.Y.basis]), J([want.X.basis, want.Y.basis]));
  chk(name, 'opened', 'd + m + u is the basis on every service', J([o.X && o.X.dmu, o.Y && o.Y.dmu]), J([o.X && o.X.basis, o.Y && o.Y.basis]));
  chk(name, 'opened', 'X draws nothing and is $1 + $1 short; Y draws $20 of ANG and is $30 + $30 short; and beyond + trim is that shortfall on every service',
    J([o.X && [o.X.d, o.X.unf, o.X.bt], o.Y && [o.Y.d, o.Y.unf, o.Y.bt]]), J([[want.X.d, want.X.unf, want.X.unf], [want.Y.d, want.Y.unf, want.Y.unf]]));
  chk(name, 'opened', 'Needs attention lists both, each with what was saved', J(o.neg), J(want.neg));
  // SAVED AGAIN after an unrelated edit, the figures go back into the file as they came
  w1ev(O.ev, `setAsk('W',0,'600'); 'ok'`);
  const again = read(boot({ html: w1ev(O.ev, 'buildSavedHtml()') }).ev);
  chk(name, 'saved again', 'CONTROL — saved again and reopened, both are still as the older file had them (passes on v1.96)',
    J([again.X && again.X.alloc, again.Y && again.Y.alloc]), J([want.X.alloc, want.Y.alloc]));
  // IMPORTED through ⬅ Import into another board with the same services
  const rcv = w1file(), I0 = boot({ html: rcv });
  await w1import(I0.ev, 'older board.html', html);
  const I = boot({ ls: w1ls(I0.ev), html: rcv });
  const im = read(I.ev);
  chk(name, 'imported', 'imported: kept as the file had them, the basis [0,0] and [0,20], and both listed for repair',
    J([im.X && im.X.alloc, im.Y && im.Y.alloc, im.X && im.X.basis, im.Y && im.Y.basis, im.neg]),
    J([want.X.alloc, want.Y.alloc, want.X.basis, want.Y.basis, want.neg]));
  // REPAIRED: typed again, the figure replaces the one the file carried, and the line leaves the list
  const n0 = w1ev(I.ev, `((attLists()||{}).neg||[]).length`);
  w1ev(I.ev, `setAlloc('X','2'); setSvc('Y',0,'10'); 'ok'`);
  chk(name, 'repaired', 'X set to $2 and Y’s USAF to $10: the two to repair become none, and the basis is [1,1] and [10,20]',
    w1ev(I.ev, `JSON.stringify([${n0}, ((attLists()||{}).neg||[]).length, basisSvcOf(itemById('X')), basisSvcOf(itemById('Y'))])`), J([2, 0, [1, 1], [10, 20]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();

// v1.97 W1, ITEM 72 (review R01): A BUDGET BASE SAVED WITH FRACTIONS KEEPS THE TOTAL THAT WAS TYPED. Before v1.97, typing a
// budget total stored each service as a fraction ($1 over three services as a third each), and opening the file rounded
// each service on its own -- $1 came back as $0, $7 as $6. Opened now, the base is apportioned back to whole dollars that
// add up to the total; the funding sources are added on top as always.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.97 — a budget base saved with fractions keeps the total that was typed (item 72)';
  try {
  const J = JSON.stringify;
  // three services; the base as setBATot before v1.97 left it for $1 (discretionary) and $7 (mandatory), a source of [0,5,0]
  const SC3 = { services: ['USAF', 'ANG', 'STOVL'], items: [it('X', 'AV', [1, 2, 3])], disc: [0, 0, 0], mand: [0, 0, 0], order: ['X'] };
  const file3 = extra => { const b = boot(); seed(b.ev, SC3);
    b.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); ${extra}; save(); 'ok'`);
    return b.ev('buildSavedHtml()'); };
  const html = file3(`S.bm={disc:[1/3,1/3,1/3], mand:[7/3,7/3,7/3], adds:[{name:'Add', pool:'disc', vec:[0,5,0]}]}`);
  const o = w1json(boot({ html }).ev, `JSON.stringify({disc:S.bm.disc, mand:S.bm.mand, dl:S.discSvc, ml:S.mandSvc})`);
  chk(name, 'opened', 'the base comes back in whole dollars adding up to the $1 and $7 typed',
    J([[].concat(o.disc || [], o.mand || []).every(Number.isSafeInteger), w1sum(o.disc), w1sum(o.mand)]), J([true, 1, 7]));
  chk(name, 'opened', 'the lanes are the base plus the source: $6 discretionary and $7 mandatory, each service its base plus its source',
    J([w1sum(o.dl), w1sum(o.ml), (o.dl || []).every((v, i) => v === o.disc[i] + [0, 5, 0][i]), J(o.ml) === J(o.mand)]), J([6, 7, true, true]));
  // CONTROL: a base already in whole dollars opens exactly as saved, and so does one with a figure below zero (rounded
  // service by service as before -- a negative base is not a total that was typed)
  const plain = w1json(boot({ html: file3(`S.bm={disc:[4,0,9], mand:[1,2,3], adds:[]}`) }).ev, `JSON.stringify([S.bm.disc, S.bm.mand])`);
  const neg = w1json(boot({ html: file3(`S.bm={disc:[-1.4,2.6,0], mand:[0,0,0], adds:[]}`) }).ev, `JSON.stringify(S.bm.disc)`);
  chk(name, 'control', 'CONTROL — a whole-dollar base opens as saved; one holding a figure below zero is rounded service by service as before (passes on v1.96)',
    J([plain, neg]), J([[[4, 0, 9], [1, 2, 3]], [-1, 3, 0]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();

// v1.97 W1, ITEM 75 (review R04): A TYPED FIGURE IS HELD TO THE BOUND THE IMPORT DOOR USES, and goes through a save, an
// export and an import unchanged. Before v1.97 a figure typed over $10 trillion was taken -- and the board's own saved
// file was then refused by its own import door.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.97 — typed money is held to the import door’s bound, through save, export and import (item 75)';
  try {
  const J = JSON.stringify;
  const B = boot({ html: w1file() });
  // the same figure, typed and in a file: is it taken? (the file's own door, inboundCheck, decides the second)
  const door = n => w1ev(B.ev, `String(inboundCheck(${J(w1file(`S.asks.W=[${n},700]`))})==='')`);
  const typed = s => w1ev(B.ev, `(function(){ itemById('W').ask=[500,700]; S.asks.W=[500,700]; setAsk('W',0,${J(s)}); return String(itemById('W').ask[0]!==500); })()`);
  chk(name, 'one bound', '$10,000,000,000,000 is taken typed and in a file; $10,000,000,000,001 is refused both ways',
    J([[typed('$10,000,000,000,000'), door(10000000000000)], [typed('$10,000,000,000,001'), door(10000000000001)]]),
    J([['true', 'true'], ['false', 'false']]));
  // what the board saves after a figure over the bound was typed is a file its own door takes
  w1ev(B.ev, `itemById('W').ask=[500,700]; S.asks.W=[500,700]; setAsk('W',0,'$10,000,000,000,001'); setAlloc('Y','$99,000,000,000,000'); 'ok'`);
  chk(name, 'one bound', 'after $10,000,000,000,001 and $99 trillion are typed, the board’s saved file still passes its own import door',
    w1ev(B.ev, `inboundCheck(buildSavedHtml())`), '');
  // CONTROL: figures typed in each supported way go through a save, the workbook and an import exactly
  w1ev(B.ev, `setAsk('W',0,'$1,234'); setAsk('W',1,'2.5M'); setAlloc('Y','750K'); setAsk('X',1,'$10,000,000,000,000'); 'ok'`);
  const saved = w1ev(B.ev, 'buildSavedHtml()');
  const R = boot({ html: saved });
  const back = w1ev(R.ev, `JSON.stringify([itemById('W').ask, S.alloc.Y, itemById('X').ask])`);
  const sheets = (() => { try { return JSON.parse(capture(B.ev)); } catch (e) { return []; } })();
  const cells = new Set(); (sheets || []).forEach(sh => (sh.rows || []).forEach(r => (r || []).forEach(c => { const v = cv(c); if (typeof v === 'number') cells.add(v); })));
  const rcv = w1file(), I0 = boot({ html: rcv });
  await w1import(I0.ev, 'typed.html', saved);
  const I = boot({ ls: w1ls(I0.ev), html: rcv });
  const imp = w1ev(I.ev, `JSON.stringify([itemById('W').ask, S.alloc.Y, itemById('X').ask])`);
  const want = J([[1234, 2500000], { m: 't', v: 750000 }, [1, 10000000000000]]);
  chk(name, 'round trip', 'CONTROL — $1,234, 2.5M, 750K and $10,000,000,000,000 typed are exact after a save and after an import, and the workbook’s requirement values are $2,501,234 and $10,000,000,000,001 (passes on v1.96)',
    J([back, [2501234, 10000000000001].every(v => cells.has(v)), imp]), J([want, true, want]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v1.97 W1 ====
// ==== v1.97 W2: every edit the saved file carries marks the board unsaved (item 76) ====
// v1.97, ITEM 76 (the 5 Oct review's R05). Every list a board file carries -- the reprogramming log, the locked cycles,
// the cost estimates, the execution data, the BAE list, the destination list, another appropriation's board and this
// one's -- marks the board unsaved when it changes, through the board's own door for it, and a save acknowledges only
// what its bytes hold. Reproduced on v1.96: an edit to the reprogramming log left DIRTY false and the save generation
// unmoved while the saved file carried the log, and an edit made while the file was being written was called saved.
// The stand-in file and folder are v1.95 item 47's (W1H), whose writes can be HELD so a change lands at each wait.
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

// ---- 76: an edit to each list at each wait of the file save; the bytes written; reopened without storage ----------
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

// ---- 76: the folder save writes the open board alone, so it acknowledges nothing else ------------------------------
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

// ---- 76: a list browser storage refused never reads as saved; a download, and a setting, change nothing ------------
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
// ==== end v1.97 W2 ====
// ==== v1.97 W3: batch import, Put this back, folder save history (items 77, 78, 79) ====
// v1.97, ITEMS 77-79 (the 5 Oct 2026 review of v1.96: R06, R07, R08). Each drives the board's own path -- the batch
// import with real files, ↶ Put this back and the folder save against the stand-in shared folder (W1H) -- with a hook
// on that folder that can HOLD or FAIL any one step: opening, listing, creating, writing or closing the history, and
// reading the folder's copy. Every check fails on v1.96 (board196) except those labelled CONTROL.
const W3RE = /(<script type="application\/json" id="pubState">)([\s\S]*?)(<\/script>)/;
const w3Pub = html => JSON.parse(html.match(W3RE)[2]);
const w3WithPub = (html, f) => html.replace(W3RE, (m, a, b, c) => a + JSON.stringify(f(JSON.parse(b))).replace(/</g, '\\u003c') + c);
const W3_THEIRS = ['AFRC', 'USAF', 'ANG'];      // W2_MINE, listed another way
// A per-service list in W2_MINE's order, written in W3_THEIRS's -- as a board listing its services that way saved it.
const w3Perm = v => Array.isArray(v) ? W3_THEIRS.map(s => v[W2_MINE.indexOf(s)]) : v;
// Every input of the lanes is written that way: the lanes, and the budget components applyBudget() rebuilds them from.
const w3Theirs = st => { const o = JSON.parse(JSON.stringify(st));
  Object.values(o.years || {}).forEach(y => { if (!y) return; y.discSvc = w3Perm(y.discSvc); y.mandSvc = w3Perm(y.mandSvc);
    if (y.bm) { y.bm.disc = w3Perm(y.bm.disc); y.bm.mand = w3Perm(y.bm.mand); (y.bm.adds || []).forEach(a => { a.vec = w3Perm(a.vec); }); } });
  // v1.97 integration: the pack too -- a board listing its services that way saves its requirements' values that way
  o.dataPack.services = W3_THEIRS.slice(); o.dataPack.budget = w3Perm(o.dataPack.budget);
  (o.dataPack.items || []).forEach(it => { if (it) { it.ask = w3Perm(it.ask); if (Array.isArray(it.fy26)) it.fy26 = w3Perm(it.fy26); } });
  return o; };
// The pack's requirement values, by requirement and service NAME (v1.97 integration).
const w3PackAsks = pk => Object.fromEntries((pk.items || []).map(it => [it.id, Object.fromEntries(pk.services.map((s, i) => [s, (it.ask || [])[i]]))]));
// The lanes of every year of one appropriation's store, by service NAME, read from the store and its own list.
const w3Lanes = (st, names) => Object.fromEntries(Object.keys(st.years || {}).sort().map(y => [y,
  Object.fromEntries((names || st.dataPack.services).map((s, i) => [s, [(st.years[y].discSvc || [])[i], (st.years[y].mandSvc || [])[i]]]))]));
// The files the batch tests pick, built once from W2's NEW board (O&M and Full Fund, services W2_MINE).
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
// One batch import into a fresh OLD board. `files`: [{name, html, plan}] -- plan 'fail' makes that file's read fail,
// a number holds its read back that many turns. `no`: answer No to the n-th service question. `before`/`during`: code
// run before the import, and right after it is started (while the files are read).
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
// What a refused batch must leave: no key's bytes moved, memory as it was, a message saying so, and never "Imported".
const w3Untouched = r => JSON.stringify([r.changed, r.memSame, /Imported:/.test(r.stat)]);
const W3_UNTOUCHED = JSON.stringify([[], true, false]);

await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.97 — ⇊ Import several boards at once decides before it writes (item 77)';
  try {
  const { J } = W1H;
  const F = w3Files();
  // CONTROL: two files, one per appropriation, taken whole.
  { const r = await w3Batch([{ name: 'a-om.html', html: F.om }, { name: 'b-ff.html', html: F.ff }]);
    chk(name, 'two files (a CONTROL)', 'both appropriations are written and the board says so',
      J([r.changed.filter(k => /^prio27(om|ff)$/.test(k)), /Imported:/.test(r.stat)]), J([['prio27ff', 'prio27om'], true])); }
  // A LOCKED CYCLE ON SCREEN: refused at once, before the question and before any file is read.
  { const r = await w3Batch([{ name: 'new-board.html', html: F.both }], { before: `cycView('POM|2027')` });
    chk(name, 'a locked cycle on screen', 'nothing is imported or asked: storage and memory are as they were, and it says why, not "Imported"',
      J([w3Untouched(r), r.qs.length, /is off while/.test(r.stat)]), J([W3_UNTOUCHED, 0, true])); }
  // ... and one put on screen while the files are read: the batch still decides before it writes.
  { const r = await w3Batch([{ name: 'new-board.html', html: F.both }], { during: `cycView('POM|2027')` });
    chk(name, 'a locked cycle put on screen meanwhile', 'nothing is imported: storage and memory are as they were, and it says why',
      J([w3Untouched(r), /is off while/.test(r.stat)]), J([W3_UNTOUCHED, true])); }
  // THE SERVICE QUESTION, ANSWERED NO -- for the appropriation on screen (the first question) or another (the second).
  for (const n of [1, 2]) {
    const r = await w3Batch([{ name: 'theirs.html', html: F.theirs }], { no: n });
    chk(name, 'the services question answered No (question ' + n + ')', 'nothing is imported: storage and memory are as they were, and it says so',
      J([w3Untouched(r), r.svcQs, /Nothing was imported/.test(r.stat)]), J([W3_UNTOUCHED, n, true]));
  }
  // ... AND ANSWERED YES: each appropriation is asked about against its own list, and what is stored is remapped and says
  // so -- every lane of every year on its own service, by name, read against the fixture's own figures -- and reopening
  // asks nothing again.
  { const r = await w3Batch([{ name: 'theirs.html', html: F.theirs }]);
    const want = { om: w3Lanes(w3Pub(F.both).appns.om), ff: w3Lanes(w3Pub(F.both).appns.ff) };
    const stored = k => JSON.parse(r.lsAfter['prio27' + k]);
    const pub = k => JSON.parse(r.T.ev(`JSON.stringify(PUBS[${J(k)}])`));
    chk(name, 'the services question answered Yes', 'both appropriations are asked about, once each, and the board says Imported',
      J([r.svcQs, /Imported:/.test(r.stat)]), J([2, true]));
    for (const k of ['om', 'ff']) {
      chk(name, 'answered Yes: ' + k + ' as stored', 'its list reads this board’s order, and every lane of every year sits on its own service',
        J([stored(k).dataPack.services, w3Lanes(stored(k))]), J([W2_MINE, want[k]]));
      chk(name, 'answered Yes: ' + k + ' in memory (PUBS)', 'the same', J([pub(k).dataPack.services, w3Lanes(pub(k))]), J([W2_MINE, want[k]]));
      // v1.97 integration: the pack's own figures follow its names -- it names the services and the requirements' values
      // when that appropriation is next opened; relabelled alone, every untouched value sat on another service
      chk(name, 'answered Yes: ' + k + ' pack as stored', 'each requirement’s value in the pack sits on its own service, by name',
        J(w3PackAsks(stored(k).dataPack)), J(w3PackAsks(w3Pub(F.both).appns[k].dataPack)));
    }
    // reopened, the board reads what was stored (a question asked while it opens is refused there, and it would open empty)
    const R = boot({ html: w2Fx().OLD.html, ls: r.lsAfter });
    const svcNow = JSON.parse(R.ev('JSON.stringify(SVC)')), lanes = JSON.parse(R.ev(`JSON.stringify(MS.years[MS.cur])`));
    chk(name, 'answered Yes, then reopened', 'each lane on screen is its own service’s',
      J(Object.fromEntries(svcNow.map((s, i) => [s, [lanes.discSvc[i], lanes.mandSvc[i]]]))), J(want.om[String(JSON.parse(R.ev('MS.cur')))])); }
  // TWO FILES FOR ONE APPROPRIATION: refused, whichever finishes reading first.
  for (const hold of [0, 1]) {
    const fs = [{ name: 'first.html', html: F.om }, { name: 'second.html', html: F.om2 }];
    fs[hold].plan = 20;
    const r = await w3Batch(fs);
    chk(name, 'two files for O&M, ' + fs[hold].name + ' read last', 'nothing is imported, and it names both files',
      J([w3Untouched(r), /first\.html.*second\.html.*both O&M/.test(r.stat)]), J([W3_UNTOUCHED, true]));
  }
  // FILES FINISHING IN EITHER ORDER: the same result, said the same way, in the order they were picked.
  { const run = async hold => { const fs = [{ name: 'a-om.html', html: F.om }, { name: 'b-ff.html', html: F.ff }]; fs[hold].plan = 20;
      const r = await w3Batch(fs); return { stat: r.stat, om: r.lsAfter.prio27om, ff: r.lsAfter.prio27ff }; };
    const x = await run(0), y = await run(1);
    chk(name, 'files finishing in either order', 'the message lists them in the order picked, and is the same either way',
      J([/O&M ← a-om\.html \[O&M\] · Full Fund ← b-ff\.html \[Full Fund\]/.test(x.stat), x.stat === y.stat]), J([true, true]));
    chk(name, 'files finishing in either order (a CONTROL)', 'and what is stored is the same either way', J([x.om === y.om, x.ff === y.ff]), J([true, true])); }
  // A FILE THAT CANNOT BE READ: the batch stops and says so; it waited for that file forever, silently.
  { const r = await w3Batch([{ name: 'new-board.html', html: F.both }, { name: 'broken.html', html: F.ff, plan: 'fail' }]);
    chk(name, 'the second file cannot be read', 'nothing is imported: storage and memory are as they were, and it names the file',
      J([w3Untouched(r), /Nothing was imported/.test(r.stat) && /broken\.html/.test(r.stat) && /could not be read/.test(r.stat)]), J([W3_UNTOUCHED, true])); }
  // THE BOARD REFUSES AFTER ALL, once the bytes are written (every refusal is settled first, so this takes a board that
  // refuses for a reason nothing foresaw): the whole batch is put back.
  { const r = await w3Batch([{ name: 'new-board.html', html: F.both }],
      { before: `globalThis.__as0=applyStore; applyStore=function(raw){ if(raw && raw.years && raw!==MS && globalThis.__asNo){ globalThis.__asNo=false; return false; } return globalThis.__as0(raw); }; globalThis.__asNo=true` });
    chk(name, 'the board on screen refuses after the write', 'every appropriation is put back in storage and memory, and it says nothing was imported',
      J([w3Untouched(r), /Nothing was imported/.test(r.stat)]), J([W3_UNTOUCHED, true])); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();

// v1.99 (item 86, review N02): A BATCH THAT CANNOT BE PUT BACK SAYS SO, AND HOLDS THE BOARD. When the board on screen
// refused its appropriation after the write, v1.98 put storage back with every(): it stopped at the first list that would
// not go back, so the lists after it were never tried; when its own reading of storage before the write failed, it put
// nothing back at all; it set no hold on Save and offered no file to save; and it said "This board is exactly as it was".
// An applyStore() that threw part-way left the board on screen half-changed. Faults are injected; no natural cause of the
// late refusal is known -- this is the recovery path.
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

// v1.99 (item 96, from item 63): EARLIER COPIES OF A COST ESTIMATE. Replacing the folder's estimate kept the one it
// replaced in the folder's history, and nothing offered it back: putting one back was a rename by hand. The Live view
// lists them (🕓 Cost estimates kept) and puts one back into the folder: the copy is pinned before the first wait, Replace's
// checks run on it, the folder's copy standing now is kept first exactly as it stands and read back (nothing is written
// when it cannot be), the folder is read again before the write, and the board itself is not changed. On v1.98 there is
// no such list (every check but the controls fails there); the pattern check fails there on its own.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.99 — a cost estimate the folder kept can be put back, keeping what is there first (item 96)';
  try {
  const THEIRS = await w2Theirs();
  const J = JSON.stringify;
  const hist = F => (F.root.dirs.history || { files: {} }).files;
  const fpBy = s => { try { const j = JSON.parse(s); return j.set.fp + ' by ' + j.by; } catch { return s == null ? 'absent' : 'unreadable'; } };
  // Brad replaced the colleague's 2025ACE with his: the folder holds his, its history the colleague's
  const setup = async () => {
    const F = w2Folder(); F.root.files[W2_ACE] = THEIRS;
    const B = w2AceBoard(F.folder, 'Brad', 'MINE');
    await B.ev(`driveAceReplace('2025ACE')`);
    const MINE = F.root.files[W2_ACE];
    B.ev(`document.body.insertAdjacentHTML('beforeend','<div id="aceHist"></div>'); globalThis.__asked=[]; 'ok'`);
    F.root.writes.length = 0;
    return { F, B, MINE, MINEFP: B.ev(`ACEDB.sets['2025ACE'].fp`), ACE0: B.ev(`localStorage.getItem('prio27acedb')`) };
  };
  const listed = async B => { await B.ev('aceHistShow()'); return B.ev(`JSON.stringify({n:_aceHist.length, part:(_aceHist[0]||{}).part, gen:_aceHistGen, btn:!!document.querySelector('#aceHist button[onclick^="aceRestore("]')})`); };
  {
    const { F, B, MINE } = await setup();
    chk(name, 'the fixture', 'the folder holds Brad’s 2025ACE and its history the colleague’s (a control)',
      J([fpBy(MINE).endsWith('by Brad'), Object.values(hist(F)).filter(t => t === THEIRS).length]), J([true, 1]));
    let L = null; try { L = JSON.parse(await listed(B)); } catch { L = null; }
    chk(name, 'listed', 'the Live view lists the kept copy under its estimate, with a button to put it back',
      L ? J([L.n, L.part, L.btn, /2025ACE/.test(B.ev(`document.getElementById('aceHist').textContent`))]) : 'no list', J([1, '2025ACE', true, true]));
    // No
    B.ev(`globalThis.__yes=false; 'ok'`);
    let r0; try { r0 = await B.ev(`aceRestore(0, _aceHistGen)`); } catch (e) { r0 = 'threw'; }
    chk(name, 'answered No', 'nothing is written', J([r0, F.root.files[W2_ACE] === MINE, F.root.writes.length]), J([false, true, 0]));
    // Yes
    B.ev(`globalThis.__yes=true; globalThis.__asked=[]; 'ok'`);
    let r1; try { r1 = await B.ev(`aceRestore(0, _aceHistGen)`); } catch (e) { r1 = 'threw'; }
    const asked = JSON.parse(B.ev('JSON.stringify(globalThis.__asked||[])'));
    chk(name, 'answered Yes', 'the question names the estimate and says the folder’s copy is kept first', asked.length === 1 && /2025ACE/.test(asked[0]) && /kept in its history first/.test(asked[0]), true);
    chk(name, 'answered Yes', 'the copy standing in the folder is kept first, byte for byte, then the kept copy is written back exactly',
      J([r1, F.root.writes.map(n => n === W2_ACE ? 'folder' : (/^spmt-ace-2025ACE-\d{8}-\d{6}\.json$/.test(n) ? 'history' : n)).join(','),
         F.root.files[W2_ACE] === THEIRS, Object.values(hist(F)).filter(t => t === MINE).length]), J([true, 'history,folder', true, 1]));
    chk(name, 'answered Yes', 'the board itself is unchanged: its estimate and browser storage (a control on the board)',
      J([B.ev(`ACEDB.sets['2025ACE'].fp`), B.ev(`String(unsavedNow())`)]), J([B.ev(`aceFingerprint(ACEDB.sets['2025ACE'])`), 'false']));
    chk(name, 'answered Yes', 'and says so', /is the copy kept at .* again; the one it held is kept in the history/.test(w2Status(B.ev)) && /own copy is unchanged/.test(w2Status(B.ev)), true);
  }
  // THE FOLDER'S COPY CANNOT BE KEPT: the history refuses, or what was kept does not read back as it was
  for (const [at, arm, why] of [
    ['the history folder cannot be opened at all', (F, B) => { F.root.fail['dir:history'] = true; }, 'Nothing was put back'],
    ['the history refuses to keep the folder’s copy', (F, B) => { B.ev(`snapKeep=async function(){ return 'failed'; }; 'ok'`); }, 'could not be kept in its history first'],
    ['the kept copy does not read back as it was', (F, B) => { B.ev(`(function(){ const sr=snapRead; let n=0; snapRead=async function(d, nm){ const t=await sr(d, nm); return (++n===2)? t.slice(0, -1) : t; }; })(); 'ok'`); }, 'could not be kept in its history first'],
  ]) {
    const mk = bootMark();
    const { F, B, MINE } = await setup();
    try { await B.ev('aceHistShow()'); } catch {}
    arm(F, B);
    let r; try { r = await B.ev(`aceRestore(0, _aceHistGen)`); } catch (e) { r = 'threw'; }
    chk(name, at, 'nothing is put back: the folder still holds Brad’s, byte for byte, and the board says why',
      J([r, F.root.files[W2_ACE] === MINE, F.root.writes.includes(W2_ACE), w2Status(B.ev).includes(why)]), J([false, true, false, true]));
    bootRelease(mk, keepBoards());
  }
  // A LATE EDIT: the folder's copy changes while the one standing is being kept
  {
    const mk = bootMark();
    const { F, B, MINE } = await setup();
    try { await B.ev('aceHistShow()'); } catch {}
    const LATE = MINE.replace('"Brad"', '"Someone"');
    B.w.__late = () => { F.root.files[W2_ACE] = LATE; };
    B.ev(`(function(){ const sk=snapKeep; snapKeep=async function(){ const r=await sk.apply(this, arguments); if(globalThis.__late) globalThis.__late(); return r; }; })(); 'ok'`);
    let r; try { r = await B.ev(`aceRestore(0, _aceHistGen)`); } catch (e) { r = 'threw'; }
    chk(name, 'a late edit to the folder’s copy', 'nothing is written over the new copy; the one that stood is in the history; the board says so',
      J([r, F.root.files[W2_ACE] === LATE, Object.values(hist(F)).includes(MINE), /changed while it was being kept/.test(w2Status(B.ev))]), J([false, true, true, true]));
    bootRelease(mk, keepBoards());
  }
  // THE SELECTION CHANGES WHILE IT RUNS: the list is read again (another estimate's copy now first) and the board's
  // chosen estimate changes, during the question. The copy pinned when it was asked for is the one put back.
  {
    const mk = bootMark();
    const { F, B, MINE } = await setup();
    const OTHER = (() => { const j = JSON.parse(THEIRS); j.key = '2024ACE'; return JSON.stringify(j); })();
    hist(F)['spmt-ace-2024ACE-20260101-000000.json'] = OTHER;
    try { await B.ev('aceHistShow()'); } catch {}
    let pick = '-1'; try { pick = B.ev(`String(_aceHist.findIndex(function(x){ return x.part==='2025ACE'; }))`); } catch {}
    B.w.__during = () => { try { B.ev(`_aceHist=_aceHist.slice().reverse(); _aceHistGen++; spAce='board'; 'ok'`); } catch {} };
    let r; try { r = await B.ev(`aceRestore(${pick}, _aceHistGen)`); } catch (e) { r = 'threw'; }
    B.w.__during = null;
    chk(name, 'the list read again, and the board’s estimate changed, while it ran', 'the pinned 2025ACE copy is put back; nothing is written for 2024ACE',
      J([r, F.root.files[W2_ACE] === THEIRS, 'spmt-ace-2024ACE.json' in F.root.files]), J([true, true, false]));
    // a button from the list as it was before the re-read puts nothing back
    let r2; try { r2 = await B.ev(`aceRestore(0, _aceHistGen-1)`); } catch (e) { r2 = 'threw'; }
    chk(name, 'a button from a list read again since', 'puts nothing back, and says so', J([r2, /has been read again since/.test(w2Status(B.ev))]), J([false, true]));
    bootRelease(mk, keepBoards());
  }
  // REPLACE'S CHECKS ON THE KEPT COPY: whole, its own estimate, its fingerprint
  for (const [at, bad, why] of [
    ['a kept copy that is not whole', t => t.slice(0, Math.floor(t.length / 2)), 'not a whole estimate'],
    ['a kept copy holding another estimate', t => { const j = JSON.parse(t); j.key = '2024ACE'; return JSON.stringify(j); }, 'holds 2024ACE'],
    ['a kept copy whose figures do not match its fingerprint', t => { const j = JSON.parse(t); j.set.appn.om.pmo.AV['2027'] = 451; return JSON.stringify(j); }, 'do not match its fingerprint'],
  ]) {
    const mk = bootMark();
    const { F, B, MINE } = await setup();
    const H = hist(F); const nm = Object.keys(H)[0]; H[nm] = bad(H[nm]);
    try { await B.ev('aceHistShow()'); } catch {}
    let r; try { r = await B.ev(`aceRestore(0, _aceHistGen)`); } catch (e) { r = 'threw'; }
    chk(name, at, 'nothing is put back, and the board says why', J([r, F.root.files[W2_ACE] === MINE, F.root.writes.length, w2Status(B.ev).includes(why)]), J([false, true, 0, true]));
    bootRelease(mk, keepBoards());
  }
  // THE FOLDER HOLDS NO COPY NOW: written, with nothing to keep first
  {
    const mk = bootMark();
    const { F, B } = await setup();
    delete F.root.files[W2_ACE];
    try { await B.ev('aceHistShow()'); } catch {}
    let r; try { r = await B.ev(`aceRestore(0, _aceHistGen)`); } catch (e) { r = 'threw'; }
    chk(name, 'the folder holds no copy now', 'the kept copy is written, and nothing is added to the history',
      J([r, F.root.files[W2_ACE] === THEIRS, F.root.writes.join(',')]), J([true, true, W2_ACE]));
    bootRelease(mk, keepBoards());
  }
  // A NAME IS MATCHED AS WRITTEN: an estimate named 2025.ACE lists its own copies and no other's
  {
    const B = boot();
    let m; try { m = B.ev(`(function(){ const re=snapMatch('ace','2025.ACE'); return JSON.stringify([re.test('spmt-ace-2025.ACE-20261006-120000.json'), re.test('spmt-ace-2025xACE-20261006-120000.json'), snapMatch(2027,'om').test('spmt-2027-om-20261006-120000.json')]); })()`); } catch (e) { m = 'threw'; }
    chk(name, 'a name with a dot', 'its own copies match, another estimate’s do not, and a board’s still match (the last a control)', m, J([true, false, true]));
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();

// v1.99 (item 95, from item 82): SIDE LISTS -- STAGED IMPORTS, A FAILED SHARE KEPT AND SAID, AND UNSAVED SURVIVES A RELOAD.
// (a) An execution import that fails on a later tab takes nothing: it wrote each tab into the board as it went, so the
//     tabs before the failure were replaced in memory, never stored and not counted unsaved.
// (b) A cost-estimate check of the folder that fails part-way takes nothing: it took each estimate as it read it.
// (c) A reprogramming-log share whose folder write fails keeps the merged log in browser storage and says "kept in this
//     browser, not shared"; when storage refuses it too, it is unsaved and the message says so.
// (d) A destination list folded from an older plan that only joins a name (no key moved) is stored and counted unsaved.
// (e) Reopened, a list browser storage holds that the board file does not reads unsaved -- the board's own lists, another
//     appropriation's plan and its locked cycles -- until 💾 Save writes it; a list the file holds the same, or a newer
//     copy, or what a blank board writes for itself, does not.
// FAILS ON v1.98 except the checks marked CONTROL.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.99 — side lists: imports staged, a failed share kept and said, unsaved survives a reload (item 95)';
  try {
  const { J, wire, KEY, status, baseFile, folder, connect, lsOf } = W1H;
  const ev0 = (B, c) => { try { return B.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
  // (a) THE EXECUTION IMPORT: three tabs; the second cannot be read
  {
    const B = boot();
    const was = ev0(B, `EXDB.all={om:{asOf:'2026-01', hdr:[], read:1, noFy:0, rows:{2026:[['2026','2026-01','JSF1','Old row','USAF O&M',0,0,'',0,111]]}}}; EXDB.ts=1; persistExdb(); JSON.stringify(EXDB.all)`);
    const out = await B.ev(`(async function(){
      const tabs=Object.keys(SRC_TABS), sheets={};
      tabs.forEach(function(s){ sheets[SRC_TABS[s]]=[['FY','Month'],['2026','2026-02','JSF9','New '+s,'USAF',0,0,'',0,999]]; });
      const xr=xlsxRead; xlsxRead=async function(){ return sheets; };
      const be=buildExec; let n=0; buildExec=function(r){ if(++n===2) throw new Error('a tab could not be read'); return be(r); };
      try{ await importSrc({files:[{name:'QPE.xlsx', arrayBuffer:async function(){ return new ArrayBuffer(8); }}], value:'x'}); }
      finally{ xlsxRead=xr; buildExec=be; }
      return JSON.stringify([JSON.stringify(EXDB.all), localStorage.getItem('prio27execdb')? JSON.stringify(JSON.parse(localStorage.getItem('prio27execdb')).all) : null,
        /Import failed/.test(document.getElementById('shareStat').textContent)]); })()`);
    let o; try { o = JSON.parse(out); } catch { o = [out]; }
    chk(name, '(a) an execution import whose second tab fails', 'nothing is taken: the board and browser storage hold the execution data as it was, and it says the import failed',
      J([o[0] === was, o[1] === was, o[2]]), J([true, true, true]));
  }
  // (b) CHECKING THE FOLDER FOR COST ESTIMATES: the folder stops answering after the first
  {
    const THEIRS = await w2Theirs();
    const F = w2Folder(); F.root.files[W2_ACE] = THEIRS; F.root.files['spmt-ace-2024ACE.json'] = THEIRS.replace(/"2025ACE"/g, '"2024ACE"');
    const B = w2AceBoard(F.folder, 'Brad', null);
    const v = F.folder.values;
    F.folder.values = async function* () { let n = 0; for await (const e of v.call(this)) { if (++n === 2) throw new Error('the sync client locked the folder'); yield e; } };
    let r; try { r = await B.ev('driveAcePull(false)'); } catch (e) { r = 'threw'; }
    chk(name, '(b) the folder fails after one estimate is read', 'nothing is taken: the board holds no estimate, and it says nothing was taken',
      J([r, ev0(B, `JSON.stringify(Object.keys(ACEDB.sets||{}))`), /Nothing was taken/.test(w2Status(B.ev))]), J([false, '[]', true]));
  }
  // (c) SHARING THE LOG: the folder write fails
  {
    const F1 = baseFile('Alice', KEY.alice);
    const PEER = J({ v: 1, by: 'Peer', ts: 5, entries: [{ id: 'peer-1', ts: 5, type: 'ATR', note: 'PEER ONLY ACTION' }], gone: {} });
    for (const refuse of [false, true]) {
      const mk = bootMark();
      const fold = folder(); fold.root.files['spmt-reprog.json'] = PEER;
      const A = boot({ html: F1 }); wire(A.ev, 'Alice', KEY.alice); connect(A.ev, A.w, fold);
      A.ev(`RPDB.entries=[{id:'mine-1', ts:7, type:'BTR', note:'MINE'}]; 'ok'`);
      fold.failNext.main = new Error('the folder refused the write');
      if (refuse) A.ev(`globalThis.__si=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(k==='prio27reprog') throw new DOMException('The quota has been exceeded.','QuotaExceededError'); return globalThis.__si.call(this,k,v); }; 'ok'`);
      let ok; try { ok = await A.ev('driveRpPush(false)'); } catch (e) { ok = 'threw'; }
      if (refuse) A.ev(`Storage.prototype.setItem=globalThis.__si; 'ok'`);
      const held = (() => { try { return JSON.parse(lsOf(A.ev)['prio27reprog'] || 'null'); } catch { return null; } })();
      const ids = held && Array.isArray(held.entries) ? held.entries.map(e => e.id).sort() : [];
      const st = status(A.ev);
      const at = refuse ? '(c) the share’s folder write fails, and browser storage refuses the log too' : '(c) the share’s folder write fails';
      chk(name, at, 'CONTROL — the share returns false, and the folder’s log is untouched (so did v1.98)', J([ok, fold.root.files['spmt-reprog.json'] === PEER]), J([false, true]));
      chk(name, at, 'CONTROL — the merged log, both actions, is on the board (in memory on v1.98 too)', ev0(A, `JSON.stringify(rpAll().map(function(e){ return e.id; }).sort())`), J(['mine-1', 'peer-1']));
      if (!refuse) chk(name, at, 'and kept in browser storage, before the write was tried', J(ids), J(['mine-1', 'peer-1']));
      else chk(name, at, 'and the board reads unsaved: 💾 Save is the way left to keep it', ev0(A, 'String(sideUnsaved())'), 'true');
      chk(name, at, 'the message says it is kept in this browser and not shared' + (refuse ? ', and that storage refused it' : ''),
        J([/not shared/.test(st), /kept in this browser/.test(st), refuse ? /Browser storage refused it as well/.test(st) : true]), J([true, true, true]));
      bootRelease(mk, keepBoards());
    }
  }
  // (d) A DESTINATION LIST FOLDED FROM AN OLDER PLAN, WHICH ONLY JOINS A NAME
  {
    const B = boot();
    const out = ev0(B, `(function(){ flowEnts(); _sideSaved=_sideGen; _lsRefused={};
      MS.flow={ents:[{k:'lm', n:'Lockheed Martin', kind:'prime', t:'LMCO'}]}; destMigrate();
      const held=JSON.parse(localStorage.getItem(DEST_KEY)||'null');
      return JSON.stringify([/LMCO/.test(destHas('lm').t), !!(held && JSON.stringify(held).indexOf('LMCO')>=0), sideUnsaved()]); })()`);
    chk(name, '(d) an older plan’s list that only adds a match term to Lockheed Martin', 'the list takes it, stores it, and the board reads unsaved', out, J([true, true, true]));
  }
  // (e) REOPENED
  {
    const st = R => ev0(R, `JSON.stringify([unsavedNow(), (document.getElementById('saveState')||{}).textContent||'', (document.getElementById('saveState')||{}).title||''])`);
    const A = boot();
    const blank = lsOf(A.ev);
    const R0 = boot({ ls: blank });
    chk(name, '(e) a blank board reopened with what it wrote for itself', 'CONTROL — not unsaved', J(JSON.parse(st(R0))[0]), 'false');
    A.ev(`RPDB.entries.push({id:'rp1', ts:Date.now(), note:'probe'}); RPDB.ts=Date.now(); persistRp(); 'ok'`);
    const R1 = boot({ ls: lsOf(A.ev) });
    const s1 = JSON.parse(st(R1));
    chk(name, '(e) a log edited and never saved, the board reopened', 'it reads Unsaved changes, and says which list the file does not have',
      J([s1[0], /Unsaved changes/.test(s1[1]), /reprogramming log/.test(s1[2])]), J([true, true, true]));
    const html = A.ev('buildSavedHtml()');
    const R2 = boot({ html, ls: lsOf(A.ev) });
    chk(name, '(e) saved, then reopened', 'CONTROL — Saved: the file holds every list as browser storage does', J(JSON.parse(st(R2))[0]), 'false');
    R2.ev(`RPDB.entries.push({id:'rp2', ts:Date.now(), note:'after the save'}); RPDB.ts=Date.now()+5; persistRp(); 'ok'`);
    const R3 = boot({ html, ls: lsOf(R2.ev) });
    chk(name, '(e) edited after the save, reopened', 'unsaved again', J(JSON.parse(st(R3))[0]), 'true');
    const R4 = boot({ html: R3.ev('buildSavedHtml()'), ls: lsOf(R3.ev) });
    chk(name, '(e) saved once more, reopened', 'CONTROL — Saved', J(JSON.parse(st(R4))[0]), 'false');
    // another appropriation's plan, and its locked cycles
    const h1 = A.ev('buildSavedHtml()');
    const FF = boot({ html: h1, appn: 'FULL FUND', ls: lsOf(A.ev) });
    const h2 = FF.ev('buildSavedHtml()');
    FF.ev(`MS.probeNote='ff edit'; save(); 'ok'`);
    const lsF = lsOf(FF.ev); lsF['prio27appn'] = 'O&M';
    const R5 = boot({ html: h2, ls: lsF, appn: 'O&M' });
    const s5 = JSON.parse(st(R5));
    chk(name, '(e) Full Fund edited and not saved, the board reopened on O&M', 'unsaved, naming the Full Fund plan', J([s5[0], /Full Fund plan/.test(s5[2])]), J([true, true]));
    const h3 = R5.ev('buildSavedHtml()');
    const R6 = boot({ html: h3, ls: lsOf(R5.ev), appn: 'O&M' });
    chk(name, '(e) saved from O&M, reopened', 'CONTROL — Saved: the save packed Full Fund’s plan from browser storage', J(JSON.parse(st(R6))[0]), 'false');
    const ls7 = lsOf(R6.ev); ls7['prio27ff-cyc'] = J({ ts: Date.now(), cycles: { 'PB|2027': { cyc: 'PB', cycYr: 2027, years: {}, proj: {} } } });
    const s7 = JSON.parse(st(boot({ html: h3, ls: ls7, appn: 'O&M' })));
    chk(name, '(e) a Full Fund cycle locked in this browser and not in the file', 'unsaved, naming Full Fund’s locked cycles', J([s7[0], /Full Fund’s locked PPBE cycles/.test(s7[2])]), J([true, true]));
    const ls8 = lsOf(R6.ev); const ffs = JSON.parse(ls8['prio27ff']); ffs.ts = 1; ffs.probeNote = 'stale'; ls8['prio27ff'] = J(ffs);
    chk(name, '(e) this browser’s Full Fund older than the file’s', 'CONTROL — not unsaved: the file’s is the newer, and a save writes it', J(JSON.parse(st(boot({ html: h3, ls: ls8, appn: 'O&M' })))[0]), 'false');
    // WHAT OPENING AN OLDER FILE WRITES IS NOBODY'S CHANGE (v1.97, item 76) -- on this opening and the next. A file saved
    // before v1.85 folds its one-year baselines into the cycle store as it opens, and stores it.
    const F1 = baseFile('Alice', KEY.alice), P = W1H.pubOf(F1);
    P.appns.om.baselines = { 'PB|2026': { fy: 2026, ts: 5, by: 'Old', svc: W1H.SVC, disc: [1, 2, 3], mand: [0, 0, 0], reqs: [], pmo: {} } };
    delete P.cycDb;
    const F0 = F1.replace(/(<script type="application\/json" id="pubState">)[\s\S]*?(<\/script>)/, (m, a, b) => a + JSON.stringify(P).replace(/</g, '\\u003c') + b);
    const O1 = boot({ html: F0 });
    chk(name, '(e) an older file, opened', 'CONTROL — it folds its baselines into the cycle store and reads saved', ev0(O1, `Object.keys(CYCDB.cycles).join(',')+'|'+unsavedNow()`), 'PB|2026|false');
    const O2 = boot({ html: F0, ls: lsOf(O1.ev) });
    chk(name, '(e) the same older file, reopened in that browser', 'CONTROL — still saved: what opening wrote is not counted on the next opening either', ev0(O2, 'String(unsavedNow())'), 'false');
    O2.ev(`CYCDB.cycles['PB|2026'].note='changed after opening'; persistCyc(); 'ok'`);
    const O3 = boot({ html: F0, ls: lsOf(O2.ev) });
    chk(name, '(e) a cycle changed after that, and the board reopened', 'unsaved, naming this appropriation’s locked cycles',
      ev0(O3, `JSON.stringify([unsavedNow(), /locked PPBE cycles/.test((document.getElementById('saveState')||{}).title||'')])`), J([true, true]));
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
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
// ==== end v1.97 W3 ====
// ==== v1.97 W4: a board’s own service list moves dollars with it (item 80) ====
// ==== end v1.97 W4 ====
// ==== v1.97 W5: the reprogramming log by service and in whole dollars, and its money-map cells (items 81, 62) ====
// A log saved or shared by an older version holds each row's service only as a position. Opened here it is read
// against EACH ROW'S OWN appropriation's list -- from the file's own slot for that appropriation -- marked as read by
// position, counted, and never rewritten. Shared through the folder, a row keeps its service by name, an older list
// still merges, and a change an older version made to a row's position is read from that position, not ignored.
// The ATR/BTR log, read back from its bytes: each row by column name, and the summary's lines and TOTAL.
const w5iLog = async (W, ap, fy) => {
  const txt = await W.eval(`(async function(){
    rpAp=${JSON.stringify(ap)}; rpFy=${JSON.stringify(fy)};
    var cap=null,_B=window.Blob;
    window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
    try{ exportReprog(); }catch(e){ window.Blob=_B; return JSON.stringify({__err:'threw '+String((e&&e.message)||e)}); }
    window.Blob=_B;
    if(!cap) return JSON.stringify({__err:'no file'});
    return JSON.stringify(await xlsxRead(cap.buffer.slice(cap.byteOffset, cap.byteOffset+cap.byteLength))); })()`);
  const bk = JSON.parse(txt), lg = bk['ATR-BTR Log'] || [];
  const out = { err: bk.__err || (lg.length ? '' : 'no ATR-BTR Log sheet'), rows: [], sum: [], total: null };
  let hdr = null, inSum = false;
  lg.forEach(r => {
    const l = String((r || [])[0] ?? '').trim();
    if (/^(BTR|ATR)s\s+\(\d+\)$/.test(l)) { hdr = null; return; }
    if (l === 'Appropriation') { hdr = r.map(c => String(c ?? '').trim()); return; }
    if (/^Subtotal — /.test(l)) { hdr = null; return; }
    if (hdr) { if (l) { const o = {}; hdr.forEach((h, j) => { o[h] = r[j]; }); out.rows.push(o); } return; }
    if (l === 'Service' && String((r || [])[1] ?? '') === 'BTR net') { inSum = true; return; }
    if (inSum && l === 'TOTAL') { out.total = [r[1], r[2], r[3]]; inSum = false; return; }
    if (inSum && l) out.sum.push([l, r[1], r[2], r[3]]);
  });
  return out;
};
// What the Check column claims: '' | 'position N' | 'unresolved', and '+ fraction' when the amount is not whole dollars
const w5iMark = t => { t = String(t ?? ''); const out = [];
  if (/unresolved/i.test(t)) out.push('unresolved'); else { const p = /position (\d+) of/.exec(t); if (p) out.push('position ' + p[1]); }
  if (/not a whole number of dollars/i.test(t)) out.push('fraction');
  return out.join(' + '); };
const W5I_FF = ['USN', 'USAF', 'STOVL', 'ANG'];    // Full Fund's own services: the same names as O&M's, in another order, and more

// ══ v1.97 W5.6 — A SAVED BOARD'S LOG FROM BEFORE v1.97, REOPENED ══════════════════════════════════════════════════════
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.97 W5 — a saved board’s older log reopens with each row read from its own appropriation, marked, and nothing rewritten';
  try {
  // THE FILE: an O&M board (USAF, ANG, AFRC) carrying Full Fund's board in its slot, and a log as v1.96 wrote it --
  // positions only, one position Full Fund's list does not have, and an amount saved with half a dollar in it
  const A = boot();
  seed(A.ev, { services: MINE, items: [it('A', 'PSM', [300, 200, 100])], disc: [600, 400, 200], mand: [0, 0, 0], order: ['A'] });
  A.ev(`PUBS.ff={ts:5, years:{}, dataPack:{services:${JSON.stringify(W5I_FF)}, items:[{id:'F1', ask:[1,2,3,4]}], budget:[]}};
    RPDB={ts:7, entries:[
      {id:'L1', ts:1, ap:'FULL FUND', fy:2027, type:'BTR', svc:1, title:'ff at 2', amtM:1, dir:'add', pool:'disc', status:'Pending'},
      {id:'L2', ts:2, ap:'O&M', fy:2027, type:'ATR', svc:2, title:'om at 3', amtM:0.250001, dir:'deduct', pool:'disc', status:'Pending'},
      {id:'L3', ts:3, ap:'FULL FUND', fy:2026, type:'BTR', svc:7, title:'ff at 8', amtM:0.123457, dir:'add', pool:'disc', status:'Pending'},
      {id:'L4', ts:4, ap:'O&M', fy:2027, type:'BTR', svc:0, title:'om half a dollar', amtM:0.0000005, dir:'add', pool:'disc', status:'Pending'}]}; 'ok'`);
  const html = A.ev('buildSavedHtml()');
  const fileLog = JSON.stringify(JSON.parse(html.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/)[1]).rpDb.entries);
  const R = boot({ html });
  chk(name, 'opened', 'control: opening it rewrites no entry (the log is the file’s, byte for byte)', R.ev(`JSON.stringify(RPDB.entries)`), fileLog);
  const g = await w5iLog(R.w, 'ALL', 'ALL');
  chk(name, 'export', 'each row’s service from its OWN appropriation’s list -- Full Fund’s position 2 is USAF, not O&M’s ANG -- one Unresolved, each marked',
    JSON.stringify(g.rows.map(o => [o['Requirement Short Title'], o['Service'], w5iMark(o['Check'])])),
    JSON.stringify([['ff at 2', 'USAF', 'position 2'], ['ff at 8', 'Unresolved', 'unresolved'], ['om half a dollar', 'USAF', 'position 1 + fraction'], ['om at 3', 'AFRC', 'position 3']]));
  // every dollar is in the summary: USAF $1,000,000 + $0.5, AFRC -$250,001, Unresolved $123,457, exactly
  const X = s => Number(s);
  chk(name, 'export', 'the summary carries every row, the half dollar and the Unresolved row included, and TOTAL is the detail’s, exactly',
    JSON.stringify([g.sum.filter(l => l[3] !== 0).map(l => [l[0], l[1], l[2], l[3]]), g.total]),
    JSON.stringify([[['USAF', X('1.0000005'), 0, X('1.0000005')], ['AFRC', 0, X('-0.250001'), X('-0.250001')], ['Unresolved', X('0.123457'), 0, X('0.123457')]],
      [X('1.1234575'), X('-0.250001'), X('0.8734565')]]));
  // THE TRACKER: the Full Fund row's picker is Full Fund's, opening on the service it was read as
  const pk = JSON.parse(R.ev(`(function(){ rpAp='ALL'; rpFy='ALL'; rpOpen=true; rpView='log'; render();
    var tr=[...document.querySelectorAll('#rpBody tr')].find(function(t){ return [...t.querySelectorAll('input')].some(function(i){ return i.value==='ff at 2'; }); });
    var s=tr? tr.children[3].querySelector('select') : null;
    return JSON.stringify(s? [[...s.options].map(function(o){ return o.value; }).filter(Boolean), s.options[s.selectedIndex].textContent] : null); })()`));
  chk(name, 'tracker', 'the Full Fund row offers Full Fund’s services and shows USAF as read by position', JSON.stringify(pk), JSON.stringify([W5I_FF, '⚠ USAF (by position)']));
  // SAVED AGAIN, the half dollar is still there as it was: kept until someone corrects it
  const again = R.ev('buildSavedHtml()');
  chk(name, 'saved again', 'control: the log saved again is the log it opened, the half dollar included',
    JSON.stringify(JSON.parse(again.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/)[1]).rpDb.entries.map(e => [e.id, e.svc, e.amtM])),
    JSON.stringify([['L1', 1, 1], ['L2', 2, 0.250001], ['L3', 7, 0.123457], ['L4', 0, 0.0000005]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();

// ══ v1.97 W5.7 — THE SHARED LOG: by name through the folder, older lists merged, an older peer's change read ══════════
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.97 W5 — the shared log carries each row’s service by name; an older list merges, and an older peer’s change is read from its position';
  try {
  const { J, wire, KEY, baseFile, folder, connect } = W1H;
  const F1 = baseFile('Alice', KEY.alice);
  const fold = folder(); const A = boot({ html: F1 }); wire(A.ev, 'Alice', KEY.alice); connect(A.ev, A.w, fold);
  A.ev(`PUBS.ff={ts:5, years:{}, dataPack:{services:${J(W5I_FF)}, items:[{id:'F1', ask:[1,2,3,4]}], budget:[]}};
    RPDB.entries=[{id:'A1', ts:1, ap:'FULL FUND', fy:2027, type:'BTR', svc:0, title:'a1', amtM:0, dir:'add', pool:'disc', status:'Pending'},
                  {id:'A2', ts:2, ap:'FULL FUND', fy:2027, type:'ATR', svc:0, title:'a2', amtM:0, dir:'deduct', pool:'disc', status:'Pending'},
                  {id:'A3', ts:3, ap:'O&M', fy:2027, type:'BTR', svc:0, title:'a3', amtM:0, dir:'add', pool:'disc', status:'Pending'}];
    rpSetField('A1','svc','STOVL'); rpSetField('A1','amtM','0.300001');
    rpSetField('A2','svc','ANG'); rpSetField('A2','amtM','0.040002');
    rpSetField('A3','svc','AFRC'); rpSetField('A3','amtM','5.000005'); 'ok'`);
  const ok = await A.ev('driveRpPush(true)');
  const pushed = JSON.parse(fold.root.files['spmt-reprog.json'] || '{"entries":[]}');
  chk(name, 'shared', 'the folder’s log names each row’s service, with the position it sits at in its own appropriation’s list',
    J([ok, pushed.entries.map(e => [e.id, e.svc, e.svcName, e.svcPos, e.svcBy])]),
    J([true, [['A1', 2, 'STOVL', 2, 'pick'], ['A2', 3, 'ANG', 3, 'pick'], ['A3', 2, 'AFRC', 2, 'pick']]]));
  // AN OLDER VERSION WORKS ON THE FOLDER'S LOG: it adds a row with a position only, moves A1 to position 1 (keeping the
  // fields it does not know, as v1.96's merge and edit do), and retitles A2 without touching its service
  const later = Date.now() + 60000;
  const older = JSON.parse(J(pushed));
  older.entries.forEach(e => { if (e.id === 'A1') { e.svc = 0; e.ts = later; } if (e.id === 'A2') { e.title = 'a2 retitled'; e.ts = later; } });
  older.entries.push({ id: 'P1', ts: later, ap: 'FULL FUND', fy: 2027, type: 'BTR', svc: 1, title: 'p1 older', amtM: 0.7, dir: 'add', pool: 'disc', status: 'Pending' });
  older.ts = later; fold.root.files['spmt-reprog.json'] = J(older);
  await A.ev('driveRpPull(true)');
  const g = await w5iLog(A.w, 'ALL', 'ALL');
  chk(name, 'merged', 'the older list merges: its new row is read from Full Fund’s position 2 (USAF); A1 from the position the older version set (USN, not the STOVL it no longer is); A2 keeps ANG, picked',
    J(g.rows.map(o => [o['Requirement Short Title'], o['Service'], w5iMark(o['Check'])])),
    J([['a1', 'USN', 'position 1'], ['a3', 'AFRC', ''], ['p1 older', 'USAF', 'position 2'], ['a2 retitled', 'ANG', '']]));
  chk(name, 'merged', 'and every row is in the summary, to the dollar: TOTAL BTR | ATR | net',
    J((g.total || []).map(v => Math.round(v * 1e6))), J([300001 + 5000005 + 700000, -40002, 300001 + 5000005 + 700000 - 40002]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v1.97 W5 ====
// ==== v1.97 W6: the money map’s nine open cells, except the reprogramming log (item 62) ====
// v1.97 INTEGRATION: AN APPROPRIATION TAKEN FROM A CONSOLIDATED FILE, REMAPPED, BRINGS ITS PACK IN THIS ORDER, FIGURES
// AND ALL. consTakeApply relabelled the pack's services after a remap and left its requirement values in the file's order;
// the pack names the services and the values when that appropriation is next opened, so every untouched value sat on
// another service. Full Fund is taken from W3's file whose services are listed [AFRC, USAF, ANG]; the remap is accepted.
// FAILS ON v1.96 (the pack's values came back in the file's order under this board's names).
await (async () => {
  const __bm = bootMark();
  const name = 'v1.97 integration — an appropriation taken from a consolidated file brings its pack in this order';
  try {
    const J = JSON.stringify, F = w3Files(), { OLD } = w2Fx();
    const T = boot({ html: OLD.html, ls: OLD.ls });
    T.ev(`globalThis.__q=[]; window.confirm=function(q){ globalThis.__q.push(String(q)); return true; }; window.alert=function(){}; 'ok'`);
    T.ev(`consTakeApply(${J(w3Pub(F.theirs))}, ${J(F.theirs)}, 'theirs.html', ['ff'], false); 'ok'`);
    const asked = JSON.parse(T.ev('JSON.stringify(globalThis.__q)')).filter(q => /DIFFERENT ORDER/.test(q)).length;
    const st = JSON.parse(T.ev(`localStorage.getItem('prio27ff')`) || 'null');
    chk(name, 'the services question', 'it is asked once, for Full Fund, and answered Yes', J(asked), J(1));
    chk(name, 'Full Fund as stored', 'its pack names this board’s order, and each requirement’s value sits on its own service, by name',
      J([st && st.dataPack && st.dataPack.services, st && st.dataPack ? w3PackAsks(st.dataPack) : null]),
      J([W2_MINE, w3PackAsks(w3Pub(F.both).appns.ff.dataPack)]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v1.97 W6 ====
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
// ==== v2.00 (U2): work put back during a save stays unsaved ====
// ↶ Put back (the work kept aside) marked the board unsaved but did not count as a change. A save still writing when the work
// was put back -- the folder's or the board file's -- found nothing changed while it wrote and marked the board saved: the
// work put back on screen, the save's own copy in the folder or file, and this browser's record saying saved. The folder's
// next refresh then loaded its copy over the work put back, and a reopen opened the saved copy: the work was in no copy at
// all. The put-back now counts as a change, so that save leaves the board unsaved and says so, and the next Save writes it.
// ONCE ↶ PUT BACK WAITS FOR A SAVE (the block after this one), the put-back below is refused and the race cannot happen.
// Each check here is therefore written for the two outcomes the board may give -- the work put back and counted, or the
// put-back refused -- both written out below, and never the one this block is about: put back, then marked saved. (d)
// checks the count itself, with no save running, so the count stays tested when the race cannot be reached.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v2.00 (U2) — work put back during a save stays unsaved';
  try {
  const { J, wire, KEY, status, qs, baseFile, disk, folder, connect, gate, until, flags, pause, lsOf, fileNote } = W1H;
  const F1 = baseFile('Alice', KEY.alice);
  const scr = ev => ev('String(S.notes.A)');
  const keptNote = ev => { const s = ev(`localStorage.getItem(_AP.key+'.kept')`); if (s == null) return null;
    try { const st = JSON.parse(s.slice(s.indexOf('\n') + 1)); return String(((st.years || {})[st.cur] || { notes: {} }).notes.A || ''); } catch (e) { return '(unreadable)'; } };
  const hist = fold => Object.values((fold.root.dirs.history || { files: {} }).files).map(t => { try { return JSON.parse(t).store.years['2027'].notes.A; } catch (e) { return '?'; } });
  const saysSaved = ev => { const fl = flags(ev); return !fl.DIRTY && !ev('_baseDirty') && !fl.base.dirty; };
  const notYet = ev => /not in the (folder|file) yet/.test(status(ev));
  const live = ev => ev(`_liveCfg.on=true; _liveCfg.auto=true; _driveLive=true; 'ok'`);   // working out of the folder turns these on
  // THE FOLDER. Alice saves F0 and types K, unsaved. Her other browser saves N to the folder. Her 💾 Save is refused (N was
  // saved after the copy K came from) and she loads theirs: K is kept aside, N is on screen. She types S1, unsaved.
  const inFolder = async () => {
    const fold = folder(); const A = boot({ html: F1 }); await pause(80);
    wire(A.ev, 'Alice', KEY.alice); connect(A.ev, A.w, fold);
    A.ev(`setNote('A','F0'); 'ok'`); await pause(5); await A.ev('driveStorePush(false)'); await pause(5);
    A.ev(`setNote('A','K'); 'ok'`); await pause(5);
    const A2 = boot({ html: F1 }); await pause(80); wire(A2.ev, 'Alice', KEY.alice); connect(A2.ev, A2.w, fold);
    await A2.ev('driveStorePull(false)'); await pause(5);
    A2.ev(`setNote('A','N'); 'ok'`); await pause(5); await A2.ev('driveStorePush(false)'); await pause(5);
    await A.ev('saveInPlace()'); await A.ev(`driveResolve('theirs')`); await pause(5);
    A.ev(`setNote('A','S1'); 'ok'`); await pause(5);
    return { A, A2, fold };
  };
  // THE BOARD FILE. Alice types K, unsaved. Her other browser saves N into the file. She reopens the file: the opening keeps
  // K aside and opens N. She types S1, unsaved.
  const inFile = async () => {
    const A0 = boot({ html: F1 }); await pause(80); wire(A0.ev, 'Alice', KEY.alice);
    A0.ev(`setNote('A','K'); 'ok'`); await pause(5);
    const A2 = boot({ html: F1 }); await pause(80); wire(A2.ev, 'Alice', KEY.alice); const f2 = disk(A2.w, F1);
    A2.ev(`setNote('A','N'); 'ok'`); await pause(5); await A2.ev('saveInPlaceFile()'); await pause(5);
    const A = boot({ html: f2.content, ls: lsOf(A0.ev) }); await pause(80); wire(A.ev, 'Alice', KEY.alice); const f = disk(A.w, f2.content);
    A.ev(`setNote('A','S1'); 'ok'`); await pause(5);
    return { A, f };
  };
  // S1's save, held at the close of its write of the folder's copy (or at its write of the file); K is put back there.
  const raceFolder = async (A, fold) => {
    const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
    const p = A.ev('driveStorePush(false)');
    const reached = await until(() => (fold.hits.main || 0) > n0);
    A.ev('keptPutBack()'); g.open(); const ret = await p; await pause(5);
    return [reached, ret];
  };
  const raceFile = async (A, f) => {
    const n0 = f.hits.write || 0; f.hold.write = gate(); const g = f.hold.write;
    const p = A.ev('saveInPlaceFile()');
    const reached = await until(() => (f.hits.write || 0) > n0);
    A.ev('keptPutBack()'); g.open(); await p; await pause(5);
    return [reached, f.writes];
  };
  // After the save lands: on screen; in the folder (file); unsaved as the screen, this browser and its record say; said.
  // PUT BACK AND COUNTED: K on screen, S1 written, unsaved, and the board says the change is not in the folder (file) yet.
  // REFUSED: S1 on screen, written and saved; K still kept aside.
  const MADE = ['K', 'S1', true, true, true, true, 'S1'], REFUSED = ['S1', 'S1', false, false, false, false, 'K'];
  const landed = (A, head) => { const fl = flags(A.ev); return [scr(A.ev), head, fl.DIRTY, A.ev('_baseDirty'), !!fl.base.dirty, notYet(A.ev), keptNote(A.ev)]; };
  // (a) THE FOLDER: the save lands, then the folder's refresh runs (live view on, as working out of the folder has it), then Save.
  { const { A, fold } = await inFolder();
    chk(name, '(a) the folder: K kept aside, S1 typed (a CONTROL)', 'S1 on screen, K kept aside, N in the folder',
      J([scr(A.ev), keptNote(A.ev), fold.note(2027, 'A')]), J(['S1', 'K', 'N']));
    const r = await raceFolder(A, fold);
    const v = landed(A, fold.note(2027, 'A')); const made = v[0] === 'K';
    chk(name, '(a) the folder: K put back while S1’s save writes', 'the save waited at its write, then went in (a CONTROL)', J(r), J([true, true]));
    chk(name, '(a) the folder: K put back while S1’s save writes', 'once it lands: K on screen, S1 in the folder, unsaved (DIRTY, _baseDirty, the record) and said; S1 kept aside — or, refused, S1 on screen and saved, K still kept',
      J(v), J(made ? MADE : REFUSED));
    live(A.ev); await A.ev('liveTick()'); await pause(5);
    chk(name, '(a) the folder: then the refresh', 'what is on screen is not replaced (K; refused: S1), and K and S1 are each still in a copy here or in the folder',
      J([scr(A.ev), [scr(A.ev), keptNote(A.ev), fold.note(2027, 'A'), ...hist(fold)].includes('K'), [scr(A.ev), keptNote(A.ev), fold.note(2027, 'A'), ...hist(fold)].includes('S1')]),
      J([made ? 'K' : 'S1', true, true]));
    chk(name, '(a) the folder: then the refresh', 'the board says saved only when the folder holds what is on screen',
      !saysSaved(A.ev) || scr(A.ev) === fold.note(2027, 'A'), true);
    if (!made) A.ev('keptPutBack()');   // refused during the save: put back now, with no save running
    await A.ev('saveInPlace()');
    if (/Save yours over theirs/.test(status(A.ev))) await A.ev(`driveResolve('mine')`);
    const fl = flags(A.ev);
    chk(name, '(a) the folder: then 💾 Save', 'it writes K: K on screen and in the folder, and saved',
      J([scr(A.ev), fold.note(2027, 'A'), fl.DIRTY, !!fl.base.dirty]), J(['K', 'K', false, false])); }
  // (b) THE FOLDER, REOPENED as soon as the save lands: this browser's storage and the same folder, and the refresh runs.
  { const { A, fold } = await inFolder();
    await raceFolder(A, fold); const made = scr(A.ev) === 'K';
    const B = boot({ html: F1, ls: lsOf(A.ev) }); await pause(80);
    wire(B.ev, 'Alice', KEY.alice); connect(B.ev, B.w, fold); live(B.ev); await B.ev('liveTick()'); await pause(5);
    chk(name, '(b) the folder: reopened once the save lands, and refreshed', 'K stays on screen, unsaved by the record, with S1 kept aside — or, refused, S1 on screen and K kept aside',
      J([scr(B.ev), keptNote(B.ev), !!flags(B.ev).base.dirty]), J(made ? ['K', 'S1', true] : ['S1', 'K', false]));
    chk(name, '(b) the folder: reopened once the save lands, and refreshed', 'K and S1 are each still in a copy here or in the folder',
      J(['K', 'S1'].map(n => [scr(B.ev), keptNote(B.ev), fold.note(2027, 'A'), ...hist(fold)].includes(n))), J([true, true])); }
  // (c) THE BOARD FILE: the save lands; the file reopened from this browser's storage and the file on disk; then Save.
  { const { A, f } = await inFile();
    chk(name, '(c) the board file: K kept aside, S1 typed (a CONTROL)', 'S1 on screen, K kept aside, N in the file',
      J([scr(A.ev), keptNote(A.ev), fileNote(f.content, 'A')]), J(['S1', 'K', 'N']));
    const r = await raceFile(A, f);
    const v = landed(A, fileNote(f.content, 'A')); const made = v[0] === 'K';
    chk(name, '(c) the board file: K put back while S1’s save writes', 'the save waited at its write, then wrote once (a CONTROL)', J(r), J([true, 1]));
    chk(name, '(c) the board file: K put back while S1’s save writes', 'once it lands: K on screen, S1 in the file, unsaved (DIRTY, _baseDirty, the record) and said; S1 kept aside — or, refused, S1 on screen and saved, K still kept',
      J(v), J(made ? MADE : REFUSED));
    const B = boot({ html: f.content, ls: lsOf(A.ev) }); await pause(80); wire(B.ev, 'Alice', KEY.alice);
    chk(name, '(c) the board file: reopened once the save lands', 'K stays on screen, unsaved by the record, with S1 kept aside — or, refused, S1 on screen and K kept aside',
      J([scr(B.ev), keptNote(B.ev), !!flags(B.ev).base.dirty]), J(made ? ['K', 'S1', true] : ['S1', 'K', false]));
    chk(name, '(c) the board file: reopened once the save lands', 'K and S1 are each still in a copy here or in the file',
      J(['K', 'S1'].map(n => [scr(B.ev), keptNote(B.ev), fileNote(f.content, 'A')].includes(n))), J([true, true]));
    if (!made) A.ev('keptPutBack()');   // refused during the save: put back now, with no save running
    await A.ev('saveInPlaceFile()'); const fl = flags(A.ev);
    chk(name, '(c) the board file: then 💾 Save', 'it writes K: K on screen and in the file, and saved',
      J([scr(A.ev), fileNote(f.content, 'A'), fl.DIRTY, !!fl.base.dirty]), J(['K', 'K', false, false])); }
  // (d) WITH NO SAVE RUNNING, the put-back is a change: the count every save checks moves by one (read from the board's
  // state, _saveGen), and the work put back is on screen, unsaved, with what was on screen kept aside in its place.
  { const { A } = await inFolder();
    const g0 = A.ev('_saveGen'), busy = A.ev('_saveBusy'), q0 = qs(A.ev).length;
    A.ev('keptPutBack()'); const fl = flags(A.ev);
    chk(name, '(d) K put back with no save running', 'no save was running, and the put-back moved the change count by exactly one (read from _saveGen)',
      J([busy, A.ev('_saveGen') - g0]), J([0, 1]));
    chk(name, '(d) K put back with no save running', 'it asked once; K on screen, unsaved (DIRTY, _baseDirty, the record), S1 kept aside, and the board says it was put back (a CONTROL)',
      J([qs(A.ev).length - q0, scr(A.ev), fl.DIRTY, A.ev('_baseDirty'), !!fl.base.dirty, keptNote(A.ev), /Put back/.test(status(A.ev))]),
      J([1, 'K', true, true, true, 'S1', true])); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (U2) ====
// ==== v2.00 (U2): ↶ Put back waits for a save to finish ====
// A save that lands records the copy it wrote as the one the work on screen came from, over the checkpoint the kept work
// brings back with it. So after a put-back during a save, the next Save -- or the folder's autosave -- wrote over that copy
// without asking, though the put-back had just said Save would ask. ↶ Put back is now refused while a save is under way, and
// changes nothing: what is on screen and the work kept aside stay exactly as they were, and the board says so -- in words
// that stay true once the save has finished. Once the save has finished -- saved, failed, canceled or thrown -- putting the
// work back works, and the work put back survives the folder's refresh and a reopen.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v2.00 (U2) — put back waits for a save to finish';
  try {
  const { J, wire, KEY, status, header, qs, baseFile, disk, folder, connect, gate, until, flags, pause, lsOf, fileNote } = W1H;
  const F1 = baseFile('Alice', KEY.alice);
  const scr = ev => ev('String(S.notes.A)');
  const keptRaw = ev => ev(`localStorage.getItem(_AP.key+'.kept')`);
  const keptNote = ev => { const s = keptRaw(ev); if (s == null) return null;
    try { const st = JSON.parse(s.slice(s.indexOf('\n') + 1)); return String(((st.years || {})[st.cur] || { notes: {} }).notes.A || ''); } catch (e) { return '(unreadable)'; } };
  const hist = fold => Object.values((fold.root.dirs.history || { files: {} }).files).map(t => { try { return JSON.parse(t).store.years['2027'].notes.A; } catch (e) { return '?'; } });
  const unsaved = ev => { const fl = flags(ev); return [fl.DIRTY, ev('_baseDirty'), !!fl.base.dirty]; };
  const live = ev => ev(`_liveCfg.on=true; _liveCfg.auto=true; _driveLive=true; 'ok'`);   // working out of the folder turns these on
  // THE FOLDER. Alice saves F0 and types K, unsaved. Her other browser saves N to the folder. Her 💾 Save is refused (N was
  // saved after the copy K came from) and she loads theirs: K is kept aside, N is on screen. She types S1, unsaved.
  const inFolder = async () => {
    const fold = folder(); const A = boot({ html: F1 }); await pause(80);
    wire(A.ev, 'Alice', KEY.alice); connect(A.ev, A.w, fold);
    A.ev(`setNote('A','F0'); 'ok'`); await pause(5); await A.ev('driveStorePush(false)'); await pause(5);
    A.ev(`setNote('A','K'); 'ok'`); await pause(5);
    const A2 = boot({ html: F1 }); await pause(80); wire(A2.ev, 'Alice', KEY.alice); connect(A2.ev, A2.w, fold);
    await A2.ev('driveStorePull(false)'); await pause(5);
    A2.ev(`setNote('A','N'); 'ok'`); await pause(5); await A2.ev('driveStorePush(false)'); await pause(5);
    await A.ev('saveInPlace()'); await A.ev(`driveResolve('theirs')`); await pause(5);
    A.ev(`setNote('A','S1'); 'ok'`); await pause(5);
    return { A, A2, fold };
  };
  // THE BOARD FILE. Alice types K, unsaved. Her other browser saves N into the file. She reopens the file: the opening keeps
  // K aside and opens N. She types S1, unsaved.
  const inFile = async () => {
    const A0 = boot({ html: F1 }); await pause(80); wire(A0.ev, 'Alice', KEY.alice);
    A0.ev(`setNote('A','K'); 'ok'`); await pause(5);
    const A2 = boot({ html: F1 }); await pause(80); wire(A2.ev, 'Alice', KEY.alice); const f2 = disk(A2.w, F1);
    A2.ev(`setNote('A','N'); 'ok'`); await pause(5); await A2.ev('saveInPlaceFile()'); await pause(5);
    const A = boot({ html: f2.content, ls: lsOf(A0.ev) }); await pause(80); wire(A.ev, 'Alice', KEY.alice); const f = disk(A.w, f2.content);
    A.ev(`setNote('A','S1'); 'ok'`); await pause(5);
    return { A, f };
  };
  // THE FOLDER'S COPY READ SLOWLY: the save's read of it is held once, as the folder's writes are (a stand-in for a slow sync).
  const holdRead = fold => { const gh = fold.dir.getFileHandle, g = gate(); let hit = 0;
    fold.dir.getFileHandle = async (n, o) => { if (!hit && n === 'spmt-2027-om.json' && !(o && o.create)) { hit = 1; await g.p; } return gh(n, o); };
    return { g, hit: () => hit }; };
  // ↶ Put back pressed while S1's save is held (`reached`): what is on screen (MS) and the kept work, byte for byte, before
  // and after, what it asked, and what it said. Then the save is let go.
  const refused = async (A, reached, g, p) => {
    const ok = await until(reached);
    const ms = A.ev('JSON.stringify(MS)'), kr = keptRaw(A.ev), q0 = qs(A.ev).length, busy = A.ev('_saveBusy');
    A.ev('keptPutBack()');
    const st = status(A.ev);
    const v = [ok, busy > 0, A.ev('JSON.stringify(MS)') === ms, keptRaw(A.ev) === kr, qs(A.ev).length - q0, scr(A.ev),
      /a save was under way/.test(st) && /Nothing was changed/.test(st) && /still kept/.test(st) && /on screen is unchanged/.test(st)];
    g.open(); let ret; try { ret = await p; } catch (e) { ret = 'threw: ' + ((e && e.message) || e); } await pause(5);
    return { v, ret, kr };
  };
  const REFUSED = [true, true, true, true, 0, 'S1', true];
  const RQ = 'during the save: refused; what is on screen and the kept work are byte for byte as they were; nothing asked; the board says so';
  // ↶ Put back once the save has finished: one question, K on screen and unsaved, and what was on screen kept in its place if
  // no saved copy has it (`was`: null when S1 is saved).
  const retry = A => { const q0 = qs(A.ev).length; A.ev('keptPutBack()'); return [qs(A.ev).length - q0, scr(A.ev), ...unsaved(A.ev), keptNote(A.ev)]; };
  const inFold = fold => n => [hist(fold).includes(n), fold.note(2027, 'A') === n];
  // THE FOLDER, after the retry: the refresh runs (live view on, as working out of the folder has it): K stays on screen and
  // nothing is written over the folder's copy unasked; then the board reopened from this browser's storage and the same folder,
  // refreshed: K and S1 each still in a copy.
  const afterFolder = async (A, fold, sc, head, reopened) => {
    live(A.ev); await A.ev('liveTick()'); await pause(5);
    chk(name, sc, 'then the refresh: K stays on screen, unsaved, and the folder copy is not written over',
      J([scr(A.ev), fold.note(2027, 'A'), ...unsaved(A.ev)]), J(['K', head, true, true, true]));
    const B = boot({ html: F1, ls: lsOf(A.ev) }); await pause(80);
    wire(B.ev, 'Alice', KEY.alice); connect(B.ev, B.w, fold); live(B.ev); await B.ev('liveTick()'); await pause(5);
    chk(name, sc, 'then reopened and refreshed: on screen and kept aside; K and S1 each still in a copy',
      J([scr(B.ev), keptNote(B.ev), ...['K', 'S1'].map(n => [scr(B.ev), keptNote(B.ev), fold.note(2027, 'A'), ...hist(fold)].includes(n))]),
      J([...reopened, true, true]));
  };
  // THE BOARD FILE, after the retry: reopened from this browser's storage and the file on disk.
  const afterFile = async (A, f, sc, reopened) => {
    const B = boot({ html: f.content, ls: lsOf(A.ev) }); await pause(80); wire(B.ev, 'Alice', KEY.alice);
    chk(name, sc, 'then reopened: on screen and kept aside; K and S1 each still in a copy',
      J([scr(B.ev), keptNote(B.ev), ...['K', 'S1'].map(n => [scr(B.ev), keptNote(B.ev), fileNote(f.content, 'A')].includes(n))]),
      J([...reopened, true, true]));
  };
  // (a) THE FOLDER, THE SAVE GOES IN: held at the close of its write of the folder's copy.
  { const sc = '(a) the folder: put back while S1’s save writes; the save goes in';
    const { A, fold } = await inFolder();
    chk(name, sc, 'S1 on screen and unsaved, K kept aside, N in the folder (a CONTROL)',
      J([scr(A.ev), A.ev('DIRTY'), keptNote(A.ev), fold.note(2027, 'A')]), J(['S1', true, 'K', 'N']));
    const n0 = fold.hits.main || 0; fold.hold.main = gate();
    const r = await refused(A, () => (fold.hits.main || 0) > n0, fold.hold.main, A.ev('driveStorePush(false)'));
    chk(name, sc, RQ, J(r.v), J(REFUSED));
    chk(name, sc, 'once it lands: S1 on screen and in the folder, saved; the kept work byte for byte as it was',
      J([r.ret, scr(A.ev), fold.note(2027, 'A'), ...unsaved(A.ev), keptRaw(A.ev) === r.kr]), J([true, 'S1', 'S1', false, false, false, true]));
    chk(name, sc, 'put back again: one question; K on screen, unsaved; nothing kept in its place (S1 is saved)',
      J(retry(A)), J([1, 'K', true, true, true, null]));
    await afterFolder(A, fold, sc, 'S1', ['S1', 'K']); }
  // (b) THE FOLDER, THE SAVE FAILS: the copy it replaces cannot be kept in the folder's history, so nothing is written.
  { const sc = '(b) the folder: put back while S1’s save writes; the save fails';
    const { A, fold } = await inFolder();
    const n0 = fold.hits.hist || 0; fold.hold.hist = gate(); fold.failNext.hist = new Error('the history folder is read-only');
    const r = await refused(A, () => (fold.hits.hist || 0) > n0, fold.hold.hist, A.ev('driveStorePush(false)'));
    chk(name, sc, RQ, J(r.v), J(REFUSED));
    chk(name, sc, 'once it fails: S1 on screen and unsaved, N still in the folder, the board says not saved; the kept work byte for byte as it was',
      J([r.ret, scr(A.ev), fold.note(2027, 'A'), ...unsaved(A.ev), /Not saved/.test(status(A.ev)), keptRaw(A.ev) === r.kr]), J([false, 'S1', 'N', true, true, true, true, true]));
    chk(name, sc, 'put back again: one question; K on screen, unsaved; S1 kept aside in its place',
      J(retry(A)), J([1, 'K', true, true, true, 'S1']));
    await afterFolder(A, fold, sc, 'N', ['K', 'S1']); }
  // (c) THE FOLDER, THE SAVE IS REFUSED: N2 is saved from Alice's other browser before S1's save starts, and S1's save is held
  // at its read of the folder. N2 is newer than the copy S1 came from, so nothing is written and she is offered the choice.
  { const sc = '(c) the folder: put back while S1’s save reads the folder; the save is refused';
    const { A, A2, fold } = await inFolder();
    A2.ev(`setNote('A','N2'); 'ok'`); await pause(5); await A2.ev('driveStorePush(false)'); await pause(5);
    const h = holdRead(fold);
    const r = await refused(A, () => h.hit(), h.g, A.ev('driveStorePush(false)'));
    chk(name, sc, RQ, J(r.v), J(REFUSED));
    chk(name, sc, 'once it is refused: S1 on screen and unsaved, N2 in the folder, nothing written; the kept work byte for byte as it was',
      J([r.ret, scr(A.ev), fold.note(2027, 'A'), ...unsaved(A.ev), /Nothing was written/.test(status(A.ev)), keptRaw(A.ev) === r.kr]), J([false, 'S1', 'N2', true, true, true, true, true]));
    chk(name, sc, 'put back again: one question; K on screen, unsaved; S1 kept aside in its place',
      J(retry(A)), J([1, 'K', true, true, true, 'S1']));
    await afterFolder(A, fold, sc, 'N2', ['K', 'S1']); }
  // (d) THE BOARD FILE, THE SAVE GOES IN: held at its write.
  { const sc = '(d) the board file: put back while S1’s save writes; the save goes in';
    const { A, f } = await inFile();
    chk(name, sc, 'S1 on screen and unsaved, K kept aside, N in the file (a CONTROL)',
      J([scr(A.ev), A.ev('DIRTY'), keptNote(A.ev), fileNote(f.content, 'A')]), J(['S1', true, 'K', 'N']));
    const n0 = f.hits.write || 0; f.hold.write = gate();
    const r = await refused(A, () => (f.hits.write || 0) > n0, f.hold.write, A.ev('saveInPlaceFile()'));
    chk(name, sc, RQ, J(r.v), J(REFUSED));
    chk(name, sc, 'once it lands: S1 on screen and in the file, saved; the kept work byte for byte as it was',
      J([scr(A.ev), fileNote(f.content, 'A'), ...unsaved(A.ev), keptRaw(A.ev) === r.kr]), J(['S1', 'S1', false, false, false, true]));
    chk(name, sc, 'put back again: one question; K on screen, unsaved; nothing kept in its place (S1 is saved)',
      J(retry(A)), J([1, 'K', true, true, true, null]));
    await afterFile(A, f, sc, ['S1', 'K']); }
  // (e) THE BOARD FILE, THE SAVE FAILS: the write cannot be finished.
  { const sc = '(e) the board file: put back while S1’s save writes; the save fails';
    const { A, f } = await inFile();
    const n0 = f.hits.close || 0; f.hold.close = gate(); f.failClose = new Error('The disk is full');
    const r = await refused(A, () => (f.hits.close || 0) > n0, f.hold.close, A.ev('saveInPlaceFile()'));
    chk(name, sc, RQ, J(r.v), J(REFUSED));
    // (the failed save downloads a copy instead, and the header says so: that copy is not on the shared file yet)
    chk(name, sc, 'once it fails: S1 on screen and unsaved, N still in the file, the header says not on the shared file yet; the kept work byte for byte as it was',
      J([scr(A.ev), fileNote(f.content, 'A'), ...unsaved(A.ev), /not on the shared file yet/.test(header(A.ev)), keptRaw(A.ev) === r.kr]), J(['S1', 'N', true, true, true, true, true]));
    chk(name, sc, 'put back again: one question; K on screen, unsaved; S1 kept aside in its place',
      J(retry(A)), J([1, 'K', true, true, true, 'S1']));
    await afterFile(A, f, sc, ['K', 'S1']); }
  // (f) THE BOARD FILE, THE SAVE IS CANCELED while it writes: nothing is written.
  { const sc = '(f) the board file: put back while S1’s save writes; the save is canceled';
    const { A, f } = await inFile();
    const n0 = f.hits.close || 0; f.hold.close = gate(); f.failClose = Object.assign(new Error('The user aborted a request.'), { name: 'AbortError' });
    const r = await refused(A, () => (f.hits.close || 0) > n0, f.hold.close, A.ev('saveInPlaceFile()'));
    chk(name, sc, RQ, J(r.v), J(REFUSED));
    chk(name, sc, 'once it is canceled: S1 on screen and unsaved, N still in the file, the board says nothing was written; the kept work byte for byte as it was',
      J([scr(A.ev), fileNote(f.content, 'A'), ...unsaved(A.ev), /Save canceled — nothing written/.test(status(A.ev)), keptRaw(A.ev) === r.kr]), J(['S1', 'N', true, true, true, true, true]));
    chk(name, sc, 'put back again: one question; K on screen, unsaved; S1 kept aside in its place',
      J(retry(A)), J([1, 'K', true, true, true, 'S1']));
    await afterFile(A, f, sc, ['K', 'S1']); }
  // (g) THE FOLDER, THE AUTOSAVE THROWS: Live on; the refresh's autosave is held at the close of its write of the folder's
  // copy, which then fails. That error goes through the save queue as a thrown error, not a returned false, and the count
  // of saves under way must still come back down, or every later put-back would be refused.
  { const sc = '(g) the folder: put back while the autosave writes; the write throws';
    const { A, fold } = await inFolder();
    live(A.ev);
    const n0 = fold.hits.main || 0; fold.hold.main = gate(); fold.failNext.main = new Error('The shared folder is read-only');
    const r = await refused(A, () => (fold.hits.main || 0) > n0, fold.hold.main, A.ev('liveTick()'));
    chk(name, sc, RQ, J(r.v), J(REFUSED));
    chk(name, sc, 'after the refusal, the header still offers the kept work (↶ work kept aside), so the retry can be reached', /work kept aside/.test(header(A.ev)), true);
    chk(name, sc, 'once it throws: S1 on screen and unsaved, N still in the folder, the board says the automatic save failed, no save under way (read from _saveBusy); the kept work byte for byte as it was',
      J([scr(A.ev), fold.note(2027, 'A'), ...unsaved(A.ev), /Automatic save to the shared folder failed/.test(status(A.ev)), A.ev('_saveBusy'), keptRaw(A.ev) === r.kr]),
      J(['S1', 'N', true, true, true, true, 0, true]));
    chk(name, sc, 'put back again: one question; K on screen, unsaved; S1 kept aside in its place',
      J(retry(A)), J([1, 'K', true, true, true, 'S1']));
    await afterFolder(A, fold, sc, 'N', ['K', 'S1']); }
  // (h) THE FOLDER, THE AUTOSAVE LANDS AFTER THE REFUSAL: a quiet autosave says nothing when it lands, so the refusal's own
  // line is what stays on screen -- it must not claim that a save is still under way. The refresh and a reopen follow.
  { const sc = '(h) the folder: put back while the autosave writes; the autosave goes in';
    const { A, fold } = await inFolder();
    live(A.ev);
    const n0 = fold.hits.main || 0; fold.hold.main = gate();
    const r = await refused(A, () => (fold.hits.main || 0) > n0, fold.hold.main, A.ev('liveTick()'));
    chk(name, sc, RQ, J(r.v), J(REFUSED));
    const st = status(A.ev);
    chk(name, sc, 'once the autosave has landed: S1 in the folder and saved, no save under way (read from _saveBusy), the kept work byte for byte as it was',
      J([scr(A.ev), fold.note(2027, 'A'), ...unsaved(A.ev), A.ev('_saveBusy'), keptRaw(A.ev) === r.kr]), J(['S1', 'S1', false, false, false, 0, true]));
    chk(name, sc, 'once the autosave has landed, the status line does not say a save IS under way',
      /save is under way/i.test(st), false);
    chk(name, sc, 'put back again: one question; K on screen, unsaved; nothing kept in its place (S1 is saved)',
      J(retry(A)), J([1, 'K', true, true, true, null]));
    await afterFolder(A, fold, sc, 'S1', ['S1', 'K']); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (U2) put back waits ====
// ==== v2.00 (U13): a refresh during a save loads nothing ====
// The folder's refresh -- the Live timer's, the bar's Connect, the opening's own connect -- loaded a newer folder copy while
// a save was still writing. The save, landing, found nothing changed while it wrote, marked the board saved and recorded
// the copy IT wrote as the one the work on screen came from: the copy loaded stayed on screen recorded as saved, the save's
// copy was in the folder, and the next refresh and a reopen said nothing. No second writer is needed: a copy already in the
// folder, stamped ahead of this machine's clock (Brad's other machine, its clock an hour fast), is "newer" than the save's
// own copy. Now the refresh loads nothing while a save is under way -- checked after its last wait, just before it would
// change anything -- and changes nothing: what is on screen and in browser storage, the record, the change count and the
// work kept aside stay byte for byte as they were. A Connect says so, of the board's own copy only: the same Connect goes on
// to load the execution data and the reprogramming log from the folder. The Live timer says nothing. Once the save has
// finished -- saved, failed, refused or canceled -- the next refresh is an ordinary one again.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v2.00 (U13) — a refresh during a save loads nothing';
  try {
  const { J, wire, KEY, status, qs, baseFile, folder, connect, gate, until, pause, lsOf } = W1H;
  const F1 = baseFile('Brad', KEY.brad);
  const NM = 'spmt-2027-om.json', HOUR = 3600000;
  // Requirement A -- its note and its allocation, in dollars -- on screen, in a copy's text, in browser storage, kept aside.
  const scr = ev => JSON.parse(ev(`JSON.stringify([String(S.notes.A||''), (S.alloc.A&&typeof S.alloc.A==='object')? S.alloc.A.v : (S.alloc.A==null? null : S.alloc.A)])`));
  const inCopy = txt => { try { const j = JSON.parse(txt), st = j.store || j, y = (st.years || {})[st.cur] || {}, a = (y.alloc || {}).A;
    return [String((y.notes || {}).A || ''), (a && typeof a === 'object') ? a.v : (a == null ? null : a)]; } catch (e) { return ['(unreadable)', null]; } };
  const stored = ev => inCopy(ev('localStorage.getItem(_AP.key)'));
  const kept = ev => { const s = ev(`localStorage.getItem(_AP.key+'.kept')`); return s == null ? null : inCopy(s.slice(s.indexOf('\n') + 1)); };
  // The folder's copy, its time, and its history.
  const head = fold => fold.raw(2027) == null ? ['(no copy)', null] : inCopy(fold.raw(2027));
  const headTs = fold => { const j = fold.copy(2027); return j ? +((j.store && j.store.ts) || j.ts || 0) : 0; };
  const inHist = (fold, c) => Object.values((fold.root.dirs.history || { files: {} }).files).some(t => J(inCopy(t)) === J(c));
  // Saved, by all three -- this session (DIRTY), _baseDirty and this browser's record -- and the record names the folder's copy.
  const saved = ev => JSON.parse(ev('JSON.stringify([DIRTY, _baseDirty, !!baseGet().dirty])')).every(x => !x);
  const onHead = (ev, fold) => headTs(fold) > 0 && +ev('driveBaseOf(mySlug())') === headTs(fold);
  // EVERYTHING A REFUSED REFRESH LEAVES AS IT WAS, byte for byte: what is on screen (MS), DIRTY, _baseDirty, the folder's time
  // the work came from and this browser's record of it, the change count every save checks (_saveGen), the work kept aside,
  // and what browser storage holds.
  const state = ev => ev(`JSON.stringify([JSON.stringify(MS), DIRTY, _baseDirty, JSON.stringify(_driveBase), localStorage.getItem(_AP.key+'.base'), _saveGen, localStorage.getItem(_AP.key+'.kept'), localStorage.getItem(_AP.key)])`);
  const writes = fold => fold.log.filter(x => /^(main|hist):/.test(x)).length;   // the folder's copy and its history (not the lock)
  const live = ev => ev(`_liveCfg.on=true; _liveCfg.auto=true; _driveLive=true; 'ok'`);   // working out of the folder turns these on
  // WHAT A CONNECT SAYS WHEN IT LOADS NOTHING DURING A SAVE, word for word. It names the board's copy and nothing wider (6a),
  // and Load theirs as well as a save: Load theirs runs in the save's queue and is counted the same way (6b).
  const SAID = '⏳ The shared folder’s copy of O&M FY27 was not loaded: a save or Load theirs was under way, so this board kept its own copy of O&M FY27. '
    + 'The folder’s copy is checked again on the next refresh once that has finished (📡 Live view → ↻ Refresh now, or on its own while Live view is on).';
  const said = st => st === SAID;
  // REMOTE: requirement A's note REMOTE, $650, saved into an empty folder through the product by Brad's other machine, whose
  // clock runs `ahead` (its own window's Date.now). Its bytes are what each case's own folder starts with.
  const writeRemote = async ahead => {
    const f0 = folder(), R = boot({ html: F1 }); await pause(80); wire(R.ev, 'Brad', KEY.brad); connect(R.ev, R.w, f0);
    if (ahead) R.ev(`(function(){ var real=Date.now; Date.now=function(){ return real.call(Date)+${ahead}; }; return 'ok'; })()`);
    R.ev(`setNote('A','REMOTE'); setAlloc('A','650'); 'ok'`); await R.ev('saveInPlace()'); await pause(5);
    return f0.raw(2027);
  };
  const withCopy = txt => { const fold = folder(); fold.root.files[NM] = txt; return fold; };
  const tsOf = txt => { const j = JSON.parse(txt); return +((j.store && j.store.ts) || j.ts || 0); };
  const REMOTE = await writeRemote(HOUR);
  chk(name, 'the fixture', 'REMOTE is the folder’s copy: REMOTE, $650, saved by Brad, stamped more than 59 minutes ahead of this clock (a CONTROL)',
    J([...inCopy(REMOTE), JSON.parse(REMOTE).by, tsOf(REMOTE) - Date.now() > 59 * 60000]), J(['REMOTE', 650, 'Brad', true]));
  // BRAD opens the board with REMOTE in the folder, and his opening loads it. He types WORKING, $700, and closes it unsaved.
  const brad = async txt => {
    const fold = withCopy(txt), A = boot({ html: F1 }); await pause(80); wire(A.ev, 'Brad', KEY.brad); connect(A.ev, A.w, fold);
    await A.ev('driveAutoConnect()'); await pause(5);
    const v = [...scr(A.ev), saved(A.ev), onHead(A.ev, fold)];
    A.ev(`setNote('A','WORKING'); setAlloc('A','700'); 'ok'`); await pause(5);
    return { v, LS: lsOf(A.ev), A, fold };
  };
  const b1 = await brad(REMOTE);
  chk(name, 'the fixture', 'Brad’s opening loads REMOTE: on screen, saved, recorded against the folder’s copy (a CONTROL)', J(b1.v), J(['REMOTE', 650, true, true]));
  // BRAD REOPENS the board: his browser (WORKING unsaved in it, recorded against REMOTE) and a folder holding REMOTE, connected
  // by the harness (no opening pull) -- or, `perm`, with the folder's edit permission not kept: the opening's own connect
  // stops at one click, and 💾 Save asks for the permission itself.
  const reopen = async (fold, perm, ls) => {
    const B = boot({ html: F1, ls: { ...(ls || b1.LS) } }); await pause(80); wire(B.ev, 'Brad', KEY.brad);
    if (perm) { fold.perm = 'prompt'; fold.dir.queryPermission = async () => fold.perm; fold.dir.requestPermission = async () => (fold.perm = 'granted'); }
    connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);   // the folder's name, as its pick stored it (a Connect needs it)
    const c = perm ? await B.ev('driveAutoConnect()') : null; await pause(5);
    return { B, c };
  };
  // 💾 Save, held at the close of its write of the folder's copy: by then it has read the folder, kept the copy it replaces
  // in the history and built its bytes.
  const held = async (B, fold) => {
    const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
    const p = B.ev('saveInPlace()'); const ok = await until(() => (fold.hits.main || 0) > n0);
    return { g, p, ok };
  };
  // The save, or a refresh, held at its read of the folder's copy (the first read after this), or at its first wait -- the
  // folder asked what this page may do (the first ask after this).
  const holdRead = fold => { const gh = fold.dir.getFileHandle, g = gate(); let hit = 0;
    fold.dir.getFileHandle = async (n, o) => { if (!hit && n === NM && !(o && o.create)) { hit = 1; await g.p; } return gh(n, o); };
    return { g, hit: () => hit }; };
  const holdAsk = fold => { const q = fold.dir.queryPermission, g = gate(); let hit = 0;
    fold.dir.queryPermission = async m => { if (!hit) { hit = 1; await g.p; } return q(m); };
    return { g, hit: () => hit }; };
  // ONE REFRESH WHILE A SAVE IS UNDER WAY: what it returned, that a save was under way, that nothing changed (against `s0`,
  // read once the save was held), what it wrote to the folder's copy or its history, and what it said -- a quiet refresh
  // nothing, a Connect that nothing was loaded and why.
  const REFRESH = { pull: 'driveStorePull(true)', connect: 'driveConnectNow()', auto: 'driveAutoConnect()', tick: 'liveTick()' };
  const refresh = async (B, fold, how, s0) => {
    if (how === 'tick') live(B.ev);
    const st0 = status(B.ev), w0 = writes(fold);
    const r = await B.ev(REFRESH[how]); await pause(5);
    const st = status(B.ev), quiet = how === 'pull' || how === 'tick';
    return [r === undefined ? '(nothing)' : r, B.ev('_saveBusy') > 0, state(B.ev) === s0, writes(fold) - w0, quiet ? st === st0 : said(st)];
  };
  const RQ = ': loads nothing -- [returned, a save under way, nothing changed byte for byte, writes to the folder’s copy or history, said]';
  const EXPECT = { pull: [false, true, true, 0, true], connect: [true, true, true, 0, true], auto: [true, true, true, 0, true], tick: ['(nothing)', true, true, 0, true] };
  // ONCE THE SAVE HAS LANDED: a later refresh changes nothing, and a reopen (this browser, the same folder, the opening's own
  // connect, then a refresh) opens `want`, which the folder's copy holds, saved and recorded against it.
  const landedThen = async (B, fold, sc, want) => {
    const s1 = state(B.ev); const pulled = await B.ev('driveStorePull(true)'); live(B.ev); await B.ev('liveTick()'); await pause(5);
    chk(name, sc, 'then a refresh (driveStorePull, the Live tick): nothing loaded, nothing changed', J([pulled, state(B.ev) === s1]), J([false, true]));
    const C = boot({ html: F1, ls: lsOf(B.ev) }); await pause(80); wire(C.ev, 'Brad', KEY.brad); connect(C.ev, C.w, fold);
    await C.ev('driveAutoConnect()'); const again = await C.ev('driveStorePull(true)'); await pause(5);
    chk(name, sc, 'then reopened (the opening’s connect, then a refresh): on screen, in the folder’s copy, saved and recorded against it; nothing kept aside',
      J([again, ...scr(C.ev), ...head(fold), saved(C.ev), onHead(C.ev, fold), kept(C.ev)]), J([false, ...want, ...want, true, true, null]));
  };
  // (1) NO SECOND WRITER. Brad reopens with WORKING unsaved; 💾 Save is held at its write; while it is held every refresh runs
  // in turn -- driveStorePull(true), the bar's Connect, the opening's own connect, the Live timer's tick -- and each loads
  // nothing. The save then lands. Reopened by the harness, and with the folder's edit permission not kept.
  for (const perm of [false, true]) {
    const sc = '(1) no second writer; reopened ' + (perm ? 'with the folder’s edit permission not kept' : 'by the harness');
    const fold = withCopy(REMOTE); const { B, c } = await reopen(fold, perm);
    chk(name, sc, 'WORKING on screen, unsaved by this browser’s record (not this session), recorded against REMOTE, nothing kept aside; REMOTE the folder’s copy'
      + (perm ? '; the opening stopped at one click' : '') + ' (a CONTROL)',
      J([...scr(B.ev), B.ev('DIRTY'), !!B.ev('baseGet().dirty'), +B.ev('driveBaseOf(mySlug())') === tsOf(REMOTE), kept(B.ev), ...head(fold), ...(perm ? [c, B.ev('_driveNeed')] : [])]),
      J(['WORKING', 700, false, true, true, null, 'REMOTE', 650, ...(perm ? [false, 'click'] : [])]));
    const h = await held(B, fold); const s0 = state(B.ev);
    chk(name, sc, 'the save is held at its write; REMOTE is still the folder’s copy, stamped after the save’s own (a CONTROL)',
      J([h.ok, B.ev('_saveBusy'), ...head(fold), headTs(fold) > +B.ev('MS.ts')]), J([true, 1, 'REMOTE', 650, true]));
    for (const how of ['pull', 'connect', 'auto', 'tick'])
      chk(name, sc, 'while the save is held, ' + REFRESH[how] + RQ, J(await refresh(B, fold, how, s0)), J(EXPECT[how]));
    h.g.open(); await h.p; await pause(5);
    chk(name, sc, 'once the save lands: WORKING on screen, in browser storage and the folder’s copy; saved, recorded against it; REMOTE in the folder’s history; nothing kept aside',
      J([...scr(B.ev), ...stored(B.ev), ...head(fold), saved(B.ev), onHead(B.ev, fold), inHist(fold, ['REMOTE', 650]), kept(B.ev)]),
      J(['WORKING', 700, 'WORKING', 700, 'WORKING', 700, true, true, true, null]));
    chk(name, sc, 'once the save lands, the status line says how it ended -- [it saved, the refused Connect’s words gone]',
      J([/^✅ Saved O&M FY27 to the shared folder/.test(status(B.ev)), status(B.ev).includes('was not loaded')]), J([true, false]));
    await landedThen(B, fold, sc, ['WORKING', 700]);
  }
  // (2) A SECOND WRITER SAVES DURING BRAD'S SAVE. Brad has saved BRAD-1, $700; Bob loads it and types BOB-2, $650. Brad presses
  // 💾 Save with nothing unsaved and it is held at its write; Bob takes the pen, which saves BOB-2 into the folder at once.
  // Brad's refresh loads nothing, and his save lands. It writes BRAD-1 over BOB-2, which is then in no copy in the folder
  // (U18, open; not this block's) -- Bob's own board still holds it.
  { const sc = '(2) a second writer saves during the save';
    const fold = folder(), A = boot({ html: F1 }); await pause(80); wire(A.ev, 'Brad', KEY.brad); connect(A.ev, A.w, fold);
    A.ev(`_liveCfg.folder='shared'; setNote('A','BRAD-1'); setAlloc('A','700'); 'ok'`); await A.ev('saveInPlace()'); await pause(5);
    const Bb = boot({ html: F1 }); await pause(80); wire(Bb.ev, 'Bob', KEY.bob); connect(Bb.ev, Bb.w, fold);
    await Bb.ev('driveStorePull(false)'); Bb.ev(`setNote('A','BOB-2'); setAlloc('A','650'); 'ok'`); await pause(5);
    chk(name, sc, 'Brad: BRAD-1 saved, the folder’s copy; Bob loaded it and typed BOB-2 (a CONTROL)',
      J([...scr(A.ev), saved(A.ev), ...head(fold), ...scr(Bb.ev)]), J(['BRAD-1', 700, true, 'BRAD-1', 700, 'BOB-2', 650]));
    const h = await held(A, fold); const s0 = state(A.ev); await pause(5);   // Bob's copy is stamped after Brad's
    await Bb.ev('takePen()'); await pause(5);
    chk(name, sc, 'while Brad’s save is held, Bob takes the pen: BOB-2 is the folder’s copy, saved by Bob, stamped after Brad’s save built its own (a CONTROL)',
      J([h.ok, ...head(fold), fold.copy(2027).by, headTs(fold) > +A.ev('MS.ts')]), J([true, 'BOB-2', 650, 'Bob', true]));
    for (const how of ['pull', 'connect', 'tick'])
      chk(name, sc, 'while the save is held, ' + REFRESH[how] + RQ, J(await refresh(A, fold, how, s0)), J(EXPECT[how]));
    h.g.open(); await h.p; await pause(5);
    chk(name, sc, 'once Brad’s save lands: BRAD-1 on screen, in browser storage and the folder’s copy; saved, recorded against it; nothing kept aside',
      J([...scr(A.ev), ...stored(A.ev), ...head(fold), saved(A.ev), onHead(A.ev, fold), kept(A.ev)]), J(['BRAD-1', 700, 'BRAD-1', 700, 'BRAD-1', 700, true, true, null]));
    await landedThen(A, fold, sc, ['BRAD-1', 700]);
    chk(name, sc, 'Bob’s own board still holds BOB-2, on screen and in its browser storage', J([...scr(Bb.ev), ...stored(Bb.ev)]), J(['BOB-2', 650, 'BOB-2', 650]));
  }
  // (3) THE CHECK IS MADE AFTER THE REFRESH'S WAITS. The refresh starts with no save under way and is held -- (a) at its read
  // of the folder's copy, (b) at its first wait, the folder asked what this page may do; 💾 Save starts meanwhile and is held
  // at its write; then the refresh is let go. A refresh that checked only when it started would load REMOTE here.
  for (const [k, how, holdOf, at] of [['a', 'driveStorePull(false)', holdRead, 'its read of the folder’s copy'], ['b', 'driveStorePull(true)', holdAsk, 'its first wait (the folder’s permission)']]) {
    const sc = '(3' + k + ') the refresh held at ' + at + '; a save starts meanwhile';
    const fold = withCopy(REMOTE); const { B } = await reopen(fold, false);
    const busy0 = B.ev('_saveBusy'), st0 = status(B.ev), hr = holdOf(fold);
    const pr = B.ev(how); const reached = await until(() => hr.hit());
    const h = await held(B, fold); const s0 = state(B.ev);
    hr.g.open(); const r = await pr; await pause(5);
    chk(name, sc, 'no save under way when the refresh started; it waited; the save started and is held at its write (a CONTROL)',
      J([busy0, reached, h.ok, B.ev('_saveBusy')]), J([0, true, true, 1]));
    chk(name, sc, 'the refresh, let go, loads nothing -- [returned, nothing changed byte for byte, ' + (k === 'a' ? 'said' : 'nothing said') + ']',
      J([r, state(B.ev) === s0, k === 'a' ? said(status(B.ev)) : status(B.ev) === st0]), J([false, true, true]));
    h.g.open(); await h.p; await pause(5);
    chk(name, sc, 'once the save lands: WORKING on screen and the folder’s copy, saved, recorded against it; REMOTE in the folder’s history; nothing kept aside',
      J([...scr(B.ev), ...head(fold), saved(B.ev), onHead(B.ev, fold), inHist(fold, ['REMOTE', 650]), kept(B.ev)]), J(['WORKING', 700, 'WORKING', 700, true, true, true, null]));
  }
  // (3c) NOTHING RECORDED FOR THE FOLDER (a browser that has not loaded from it): a refresh takes a copy that is not newer
  // than the screen as the one the work came from -- but not while a save is under way, or a save still to read the folder
  // finds it recorded and writes over it without asking. Brad's other browser has saved X, $600; this browser types MINE,
  // $720; 💾 Save waits at its read of the folder while the opening's own connect runs. The save then asks, as it does when
  // nothing is recorded.
  { const sc = '(3c) nothing recorded for the folder; the opening’s connect while a save waits at its read';
    const fold = folder(), X = boot({ html: F1 }); await pause(80); wire(X.ev, 'Brad', KEY.brad); connect(X.ev, X.w, fold);
    X.ev(`setNote('A','X'); setAlloc('A','600'); 'ok'`); await X.ev('saveInPlace()'); await pause(5);
    const C = boot({ html: F1 }); await pause(80); wire(C.ev, 'Brad', KEY.brad); connect(C.ev, C.w, fold);
    C.ev(`setNote('A','MINE'); setAlloc('A','720'); 'ok'`); await pause(5);
    chk(name, sc, 'nothing recorded for the folder; MINE on screen, unsaved; X the folder’s copy, stamped before MINE was typed (a CONTROL)',
      J([+C.ev('driveBaseOf(mySlug())'), ...scr(C.ev), C.ev('DIRTY'), ...head(fold), headTs(fold) < +C.ev('MS.ts')]), J([0, 'MINE', 720, true, 'X', 600, true]));
    const hr = holdRead(fold); const p = C.ev('saveInPlace()'); const reached = await until(() => hr.hit());
    const s0 = state(C.ev), st0 = status(C.ev); await C.ev('driveAutoConnect()'); await pause(5);
    chk(name, sc, 'the opening’s connect while the save waits at its read -- [the save waits, a save under way, nothing changed byte for byte: nothing recorded]',
      J([reached, C.ev('_saveBusy'), state(C.ev) === s0]), J([true, 1, true]));
    // With nothing recorded there is no telling whether anybody saved after this work: no clash is said, during a save or not.
    chk(name, sc, 'and it says nothing -- [the status line as it was, a clash said]',
      J([status(C.ev) === st0, /after the copy you are working from/.test(status(C.ev))]), J([true, false]));
    hr.g.open(); await p; await pause(5);
    chk(name, sc, 'then the save, finding nothing recorded, asks: nothing written, X still the folder’s copy, MINE on screen and unsaved, the choice offered',
      J([...head(fold), ...scr(C.ev), C.ev('DIRTY'), /Nothing was written/.test(status(C.ev)), /Save yours over theirs/.test(status(C.ev))]), J(['X', 600, 'MINE', 720, true, true, true]));
  }
  // (4) ONCE THE SAVE HAS FINISHED, THE NEXT REFRESH IS AN ORDINARY ONE. A refresh loads nothing while the save runs; the save
  // then (a) lands, and Brad's other browser saves NEWER, $750, after it; (b) fails, the folder refusing its write; (c) is
  // refused, NEWER having been saved before it read the folder; (d) is canceled, the folder's copy having no writer recorded.
  // The next refresh loads the newer copy, keeping aside work no saved copy has, and the record names what is on screen.
  const other = async (fold, note, amt) => {   // Brad's other browser: loads the folder's copy, types, saves
    const N = boot({ html: F1 }); await pause(80); wire(N.ev, 'Brad', KEY.brad); connect(N.ev, N.w, fold);
    await N.ev('driveStorePull(false)'); N.ev(`setNote('A',${J(note)}); setAlloc('A',${J(String(amt))}); 'ok'`); await N.ev('saveInPlace()'); await pause(5);
  };
  { const sc = '(4a) the save lands; a newer copy is saved after it';
    const fold = withCopy(REMOTE); const { B } = await reopen(fold, false);
    const h = await held(B, fold); const s0 = state(B.ev);
    chk(name, sc, 'while the save is held, ' + REFRESH.tick + RQ, J(await refresh(B, fold, 'tick', s0)), J(EXPECT.tick));
    h.g.open(); await h.p; await pause(5);
    await other(fold, 'NEWER', 750);
    chk(name, sc, 'the save landed (WORKING, saved); then Brad’s other browser loaded WORKING and saved NEWER over it (a precondition, not a control: before U13 the refresh during the save has already loaded the folder’s copy)',
      J([...scr(B.ev), saved(B.ev), B.ev('_saveBusy'), ...head(fold), inHist(fold, ['WORKING', 700])]), J(['WORKING', 700, true, 0, 'NEWER', 750, true]));
    const r = await B.ev('driveStorePull(true)'); await pause(5);
    chk(name, sc, 'the next refresh loads NEWER: on screen and in browser storage, saved, recorded against the folder’s copy; nothing kept aside (WORKING is saved, in the history)',
      J([r, ...scr(B.ev), ...stored(B.ev), saved(B.ev), onHead(B.ev, fold), kept(B.ev)]), J([true, 'NEWER', 750, 'NEWER', 750, true, true, null]));
  }
  { const sc = '(4b) the save fails: the folder refuses its write';
    const fold = withCopy(REMOTE); const { B } = await reopen(fold, false);
    const h = await held(B, fold); const s0 = state(B.ev);
    chk(name, sc, 'while the save is held, ' + REFRESH.pull + RQ, J(await refresh(B, fold, 'pull', s0)), J(EXPECT.pull));
    fold.failNext.main = new Error('The shared folder is read-only'); h.g.open(); await h.p; await pause(5);
    chk(name, sc, 'the save failed and says so: REMOTE still the folder’s copy; WORKING on screen, unsaved; no save under way (read from _saveBusy) (a precondition, not a control: before U13 the refresh during the save has already loaded the folder’s copy)',
      J([/Could not save to the shared folder/.test(status(B.ev)), ...head(fold), ...scr(B.ev), saved(B.ev), B.ev('_saveBusy')]), J([true, 'REMOTE', 650, 'WORKING', 700, false, 0]));
    const r = await B.ev('driveStorePull(true)'); await pause(5);
    chk(name, sc, 'the next refresh is an ordinary one: REMOTE, later than what is on screen, is loaded, saved and recorded against the folder’s copy; WORKING, in no saved copy, kept aside',
      J([r, ...scr(B.ev), saved(B.ev), onHead(B.ev, fold), kept(B.ev)]), J([true, 'REMOTE', 650, true, true, ['WORKING', 700]]));
  }
  { const sc = '(4c) the save is refused: a newer copy was saved before it read the folder';
    const fold = withCopy(REMOTE); const { B } = await reopen(fold, false);
    await other(fold, 'NEWER', 750);
    chk(name, sc, 'Brad’s other browser loaded REMOTE and saved NEWER over it; REMOTE in the folder’s history (a CONTROL)',
      J([...head(fold), inHist(fold, ['REMOTE', 650])]), J(['NEWER', 750, true]));
    const hr = holdRead(fold); const p = B.ev('saveInPlace()'); await until(() => hr.hit()); const s0 = state(B.ev);
    chk(name, sc, 'while the save waits at its read, ' + REFRESH.tick + RQ, J(await refresh(B, fold, 'tick', s0)), J(EXPECT.tick));
    hr.g.open(); await p; await pause(5);
    chk(name, sc, 'the save is refused and says so: nothing written, NEWER still the folder’s copy; WORKING on screen, unsaved; no save under way (a precondition, not a control: before U13 the refresh during the save has already loaded the folder’s copy)',
      J([/Nothing was written/.test(status(B.ev)), ...head(fold), ...scr(B.ev), saved(B.ev), B.ev('_saveBusy')]), J([true, 'NEWER', 750, 'WORKING', 700, false, 0]));
    await B.ev('liveTick()'); await pause(5);
    chk(name, sc, 'the next refresh (the Live tick) is an ordinary one: NEWER is loaded, saved and recorded against the folder’s copy; WORKING, in no saved copy, kept aside',
      J([...scr(B.ev), saved(B.ev), onHead(B.ev, fold), kept(B.ev)]), J(['NEWER', 750, true, true, ['WORKING', 700]]));
  }
  { const sc = '(4d) the save is canceled: the folder’s copy has no writer recorded, and Brad answers Cancel';
    const j = JSON.parse(REMOTE); delete j.writer;   // REMOTE as a board before v1.95 wrote it: no writer recorded
    const fold = withCopy(JSON.stringify(j)); const { B } = await reopen(fold, false);
    const hr = holdRead(fold); const p = B.ev('globalThis.__yes=false; saveInPlace()'); await until(() => hr.hit()); const s0 = state(B.ev);
    chk(name, sc, 'while the save waits at its read, ' + REFRESH.connect + RQ, J(await refresh(B, fold, 'connect', s0)), J(EXPECT.connect));
    const q0 = qs(B.ev).length; hr.g.open(); await p; await pause(5);
    chk(name, sc, 'the save asked once and was canceled: nothing written, REMOTE still the folder’s copy; WORKING on screen, unsaved; no save under way (a precondition, not a control: before U13 the refresh during the save has already loaded the folder’s copy)',
      J([qs(B.ev).length - q0, /Save canceled — nothing written/.test(status(B.ev)), ...head(fold), ...scr(B.ev), saved(B.ev), B.ev('_saveBusy')]),
      J([1, true, 'REMOTE', 650, 'WORKING', 700, false, 0]));
    B.ev(`globalThis.__yes=true; 'ok'`); const r = await B.ev('driveStorePull(true)'); await pause(5);
    chk(name, sc, 'the next refresh is an ordinary one: REMOTE, later than what is on screen, is loaded, saved and recorded against the folder’s copy; WORKING, in no saved copy, kept aside',
      J([r, ...scr(B.ev), saved(B.ev), onHead(B.ev, fold), kept(B.ev)]), J([true, 'REMOTE', 650, true, true, ['WORKING', 700]]));
  }
  // (5) CONTROLS. (Cc) No save under way: the refresh loads REMOTE as it always has, keeping WORKING aside. (Cb) Work typed in
  // this session: the refresh during the save gives the unsaved-changes message as it always has. (Ca) REMOTE not stamped
  // ahead: nothing to load, during the save or after.
  { const sc = '(5) Cc: no save under way';
    const fold = withCopy(REMOTE); const { B } = await reopen(fold, false);
    const r = await B.ev('driveStorePull(true)'); await pause(5);
    chk(name, sc, 'the refresh loads REMOTE as before: on screen and in browser storage, saved, recorded against the folder’s copy; WORKING kept aside, and said',
      J([r, B.ev('_saveBusy'), ...scr(B.ev), ...stored(B.ev), saved(B.ev), onHead(B.ev, fold), kept(B.ev), /kept aside/.test(status(B.ev))]),
      J([true, 0, 'REMOTE', 650, 'REMOTE', 650, true, true, ['WORKING', 700], true]));
  }
  { const sc = '(5) Cb: work typed in this session; a refresh during the save';
    const { A, fold } = b1; A.ev(`_liveCfg.folder='shared'; 'ok'`);
    chk(name, sc, 'WORKING typed in this session, unsaved (DIRTY) (a CONTROL)', J([...scr(A.ev), A.ev('DIRTY')]), J(['WORKING', 700, true]));
    const h = await held(A, fold); const s0 = state(A.ev);
    const r = await A.ev('driveStorePull(true)'); await pause(5); const st = status(A.ev);
    chk(name, sc, 'while the save is held, the refresh gives the unsaved-changes message as before, and changes nothing',
      J([r, state(A.ev) === s0, /and you have unsaved changes\. Nothing was replaced\. Save yours, or reload to take theirs\./.test(st), /was not loaded|Nothing was loaded/.test(st)]),
      J([false, true, true, false]));
    h.g.open(); await h.p; await pause(5);
    chk(name, sc, 'once the save lands: WORKING on screen and the folder’s copy, saved, recorded against it',
      J([...scr(A.ev), ...head(fold), saved(A.ev), onHead(A.ev, fold)]), J(['WORKING', 700, 'WORKING', 700, true, true]));
  }
  { const sc = '(5) Ca: REMOTE not stamped ahead';
    const REMOTE0 = await writeRemote(0), b0 = await brad(REMOTE0);
    const fold = withCopy(REMOTE0); const { B } = await reopen(fold, false, b0.LS);
    chk(name, sc, 'Brad’s opening loaded REMOTE (saved, recorded against it); reopened with WORKING unsaved (a CONTROL)',
      J([...b0.v, ...scr(B.ev), !!B.ev('baseGet().dirty')]), J(['REMOTE', 650, true, true, 'WORKING', 700, true]));
    const h = await held(B, fold); const s0 = state(B.ev);
    chk(name, sc, 'while the save is held, REMOTE is not later than the save’s own copy, and the refresh loads nothing, as before',
      J([headTs(fold) < +B.ev('MS.ts'), await B.ev('driveStorePull(true)'), state(B.ev) === s0]), J([true, false, true]));
    h.g.open(); await h.p; await pause(5);
    chk(name, sc, 'once the save lands: WORKING on screen and the folder’s copy, saved, recorded against it; REMOTE in the folder’s history; nothing kept aside',
      J([...scr(B.ev), ...head(fold), saved(B.ev), onHead(B.ev, fold), inHist(fold, ['REMOTE', 650]), kept(B.ev)]), J(['WORKING', 700, 'WORKING', 700, true, true, true, null]));
  }
  // (6) THE WORDS ARE TRUE WHERE THE CONNECT GOES ON TO LOAD OTHER THINGS. (a) The folder also holds newer execution data and a
  // reprogramming log, shared through the product by Alice's board (EXDB and RPDB set as the v1.95 W2 block's fixture sets
  // them). During a held save Brad presses the bar's Connect (the folder's edit permission not kept), or his opening's own
  // connect runs. The board's copy is not loaded; the same Connect loads the execution data and the log. So the words name
  // the board's copy alone, and never say that nothing was loaded from the folder. (b) Load theirs runs in the save's queue:
  // a Connect while it waits at its read is refused in the same words, and Load theirs then loads REMOTE, keeping WORKING aside.
  for (const [how, perm] of [['connect', true], ['auto', false]]) {
    const sc = '(6a) ' + REFRESH[how] + ' during a save, with newer execution data and a reprogramming log in the folder';
    const fold = withCopy(REMOTE);
    const X = boot({ html: F1 }); await pause(80); wire(X.ev, 'Alice', KEY.alice); connect(X.ev, X.w, fold);
    X.ev(`(function(){ const t=Date.now();
      EXDB={ts:t, all:{om:{fy:2027, rows:[['EXEC-1', 5000]]}}}; persistExdb();
      RPDB={ts:t, entries:[{id:'rp-1', ts:t, ap:'om', amt:25000, what:'a reprogramming'}]}; persistRp(); return 'ok'; })()`);
    const shared = [await X.ev('driveExecPush(true)'), await X.ev('driveRpPush(true)')]; await pause(5);
    const { B } = await reopen(fold, perm);
    const extra = ev => JSON.parse(ev(`JSON.stringify([Object.keys(EXDB.all||{}), rpAll().map(function(r){ return r.id; })])`));
    chk(name, sc, 'Alice shared both; Brad’s board holds neither; WORKING on screen; REMOTE the folder’s copy (a CONTROL)',
      J([...shared, ...extra(B.ev), ...scr(B.ev), ...head(fold)]), J([true, true, [], [], 'WORKING', 700, 'REMOTE', 650]));
    const h = await held(B, fold); const s0 = state(B.ev);
    const r = await B.ev(REFRESH[how]); await pause(5); const st = status(B.ev);
    chk(name, sc, 'while the save is held, the Connect loads the execution data and the log but not the board’s copy -- [returned, a save under way, nothing changed byte for byte, execution data, the log]',
      J([r, B.ev('_saveBusy') > 0, state(B.ev) === s0, ...extra(B.ev)]), J([true, true, true, ['om'], ['rp-1']]));
    chk(name, sc, 'and it says so of the board’s copy alone -- [word for word, says nothing was loaded, says nothing was changed]',
      J([st, /Nothing was loaded/i.test(st), /Nothing was changed/i.test(st)]), J([SAID, false, false]));
    h.g.open(); await h.p; await pause(5);
    chk(name, sc, 'once the save lands: WORKING on screen and the folder’s copy, saved, recorded against it; the status line says it saved, the Connect’s words gone',
      J([...scr(B.ev), ...head(fold), saved(B.ev), onHead(B.ev, fold), /^✅ Saved O&M FY27 to the shared folder/.test(status(B.ev)), status(B.ev).includes('was not loaded')]),
      J(['WORKING', 700, 'WORKING', 700, true, true, true, false]));
  }
  { const sc = '(6b) a Connect while Load theirs waits at its read';
    const fold = withCopy(REMOTE); const { B } = await reopen(fold, false);
    const hr = holdRead(fold); const pr = B.ev(`driveResolve('theirs')`); const reached = await until(() => hr.hit()); const s0 = state(B.ev);
    const r = await B.ev('driveConnectNow()'); await pause(5);
    chk(name, sc, 'Load theirs waits at its read, counted as a save is; the Connect loads nothing -- [Load theirs waits, returned, counted, nothing changed byte for byte, said word for word]',
      J([reached, r, B.ev('_saveBusy') > 0, state(B.ev) === s0, status(B.ev)]), J([true, true, true, true, SAID]));
    hr.g.open(); await pr; await pause(5);
    chk(name, sc, 'then Load theirs loads REMOTE, saved and recorded against the folder’s copy; WORKING kept aside, and said',
      J([...scr(B.ev), saved(B.ev), onHead(B.ev, fold), kept(B.ev), /^⬇ Loaded Brad’s copy of O&M FY27\. Your work is kept aside/.test(status(B.ev))]),
      J(['REMOTE', 650, true, true, ['WORKING', 700], true]));
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (U13) ====
// ==== v2.00 (U20): a save waiting for another tab's save is under way ====
// A save waits for the 'orbit-save' Web Lock, so that one save runs at a time across this browser's tabs. It was counted as
// under way (_saveBusy) only once it held the lock: while it waited for another tab's save it was no save at all to ↶ Put
// back (U2) and to the folder's refresh (U13). Put back went ahead under it, a refresh loaded a newer copy under it, and a
// refresh that took the folder's copy as the one the work came from (nothing recorded yet, that copy not newer than the
// screen) let the waiting save write over that copy without asking -- with a history copy kept less than ten minutes
// before, the copy written over was in no copy the board could reach after one more Save. A save is now counted from the
// moment it is asked for until it has finished, however it ends. jsdom has no Web Locks: webLocks() stands in for one
// browser's lock manager, shared by every tab of that browser (each tab is a board of its own), and is itself checked
// against the API's rules first, in the scenario after it.
//
// THE STAND-IN (the U20 probe's locks-mock.mjs, rec/L4/u20, whose own tests were checked against real Chromium tabs). It
// models request(name, callback) and request(name, options, callback); 'exclusive' (the default) and 'shared'; ifAvailable;
// one queue per name, first come first served (a request is granted only at the head of its queue); the callback run in a
// later task of the asking window, never inside request(); the lock held until the callback's result settles, then let
// go, and only then request()'s promise settled, made in the asking window; query(); a closing tab's requests dropped and
// its locks let go; and the argument errors the API defines. NOT modelled: steal and signal (refused and counted, never
// ignored -- the board uses neither), separate processes (every tab here shares one event loop), workers and storage
// partitioning. At every grant it checks that no two holders of a name are held where either is exclusive.
const webLocks = label => {
  const held = [], queues = new Map(), log = [];
  const stats = { requests: 0, grants: 0, invokes: 0, releases: 0, dropped: 0, violations: [], maxHeld: {}, unmodeled: [], label };
  let seq = 0;
  const q = name => { if (!queues.has(name)) queues.set(name, []); return queues.get(name); };
  const note = (ev, r, extra = {}) => log.push({ n: log.length, ev, name: r.name, mode: r.mode, client: r.client, id: r.id, ...extra });
  const grantable = r => { const qq = q(r.name);
    if (qq.length && qq[0] !== r) return false;
    if (r.mode === 'exclusive') return !held.some(l => l.name === r.name);
    return !held.some(l => l.name === r.name && l.mode === 'exclusive'); };
  const lockObj = r => { const o = new r.win.Object(); o.name = r.name; o.mode = r.mode; return o; };
  const release = lock => { const i = held.indexOf(lock); if (i < 0) return;
    held.splice(i, 1); stats.releases++; note('release', lock); processQueue(lock.name); };
  const invoke = (r, lock) => {
    if (!held.includes(lock)) { note('invoke-skipped', r); return; }   // let go by closeClient before its task ran
    stats.invokes++; note('invoke', r);
    let waiting;
    try { waiting = Promise.resolve(r.callback(lockObj(r))); } catch (e) { waiting = Promise.reject(e); }
    waiting.then(v => { release(lock); r.resolve(v); }, e => { release(lock); r.reject(e); }); };
  const grant = r => {
    if (held.some(l => l.name === r.name && (r.mode === 'exclusive' || l.mode === 'exclusive')))
      stats.violations.push({ at: log.length, name: r.name, client: r.client, holders: held.filter(l => l.name === r.name).map(l => l.client) });
    const lock = { name: r.name, mode: r.mode, client: r.client, id: r.id };
    held.push(lock); stats.grants++;
    const n = held.filter(l => l.name === r.name).length;
    stats.maxHeld[r.name] = Math.max(stats.maxHeld[r.name] || 0, n);
    note('grant', r, { holdersNow: n });
    r.win.setTimeout(() => invoke(r, lock), 0); };
  function processQueue(name) { const qq = q(name);
    while (qq.length) { const r = qq[0]; if (!grantable(r)) return; qq.shift(); grant(r); } }
  const request = (win, client, name, a, b) => {
    const options = (typeof a === 'function') ? {} : (a || {});
    const callback = (typeof a === 'function') ? a : b;
    return new win.Promise((resolve, reject) => {
      name = String(name);
      const mode = options.mode === undefined ? 'exclusive' : String(options.mode);
      const r = { id: ++seq, name, mode, client, win, callback, resolve, reject, ifAvailable: !!options.ifAvailable };
      stats.requests++;
      if (options.steal || options.signal) { stats.unmodeled.push({ client, name, steal: !!options.steal, signal: !!options.signal });
        note('reject-unmodeled', r); reject(new win.Error('NotSupportedError: steal/signal are not modelled by this stand-in')); return; }
      if (mode !== 'exclusive' && mode !== 'shared') { note('reject-mode', r); reject(new win.TypeError('mode')); return; }
      if (typeof callback !== 'function') { note('reject-callback', r); reject(new win.TypeError('callback is not a function')); return; }
      if (name.startsWith('-')) { note('reject-name', r); reject(new win.Error('NotSupportedError: name starts with -')); return; }
      note('request', r, { queued: q(name).length, heldNow: held.filter(l => l.name === name).map(l => l.client) });
      if (r.ifAvailable && !(q(name).length === 0 && grantable(r))) {
        note('not-available', r);
        win.setTimeout(() => { let v; try { v = Promise.resolve(callback(null)); } catch (e) { v = Promise.reject(e); } v.then(resolve, reject); }, 0);
        return;
      }
      q(name).push(r); processQueue(name);
    }); };
  const snapshot = () => ({ held: held.map(l => ({ name: l.name, mode: l.mode, clientId: l.client })),
    pending: [...queues.entries()].flatMap(([, rs]) => rs.map(r => ({ name: r.name, mode: r.mode, clientId: r.client }))) });
  return { label, log, stats, snapshot,
    heldBy: name => held.filter(l => l.name === name).map(l => l.client),
    pendingOf: name => q(name).map(r => r.client),
    grantOrder: (name, fromN = 0) => log.filter(e => e.ev === 'grant' && e.name === name && e.n >= fromN).map(e => e.client),
    mark: () => log.length,
    // One tab's navigator.locks (jsdom has none; `had` says whether it had one).
    install(w, client) { const had = 'locks' in w.navigator;
      const api = { request: (name, a, b) => request(w, client, name, a, b), query: () => new w.Promise(res => res(JSON.parse(JSON.stringify(snapshot())))) };
      Object.defineProperty(w.navigator, 'locks', { value: api, configurable: true, enumerable: true });
      return { had, client }; },
    closeClient(client) {
      for (const [, rs] of queues) for (let i = rs.length - 1; i >= 0; i--) if (rs[i].client === client) { note('drop', rs[i]); rs.splice(i, 1); stats.dropped++; }
      for (const l of held.slice()) if (l.client === client) release(l);
      for (const name of queues.keys()) processQueue(name); } };
};
// THE STAND-IN'S OWN TESTS (the probe's locktest.mjs, T1-T10, 19 checks), in bare windows sharing one manager. Every
// expected value is written by hand; every wait has a deadline.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v2.00 (U20) — the Web Locks stand-in behaves as the API does';
  const wins = [];
  try {
  const J = JSON.stringify, tick = () => new Promise(r => setImmediate(r));
  const until = async (cond, ms = 5000) => { const end = Date.now() + ms; while (Date.now() < end) { if (cond()) return true; await tick(); } return !!cond(); };
  const within = (p, ms = 5000) => Promise.race([p.then(v => ({ ok: true, v }), e => ({ ok: false, e: String(e) })), new Promise(r => setTimeout(() => r({ timedOut: true }), ms))]);
  const gate = () => { let res, rej; const p = new Promise((a, b) => { res = a; rej = b; }); return { p, open: v => res(v), fail: e => rej(e) }; };
  const win = () => { const w = new JSDOM('<!doctype html><p>tab', { url: 'https://example.invalid/board.html', runScripts: 'outside-only' }).window; wins.push(w); return w; };
  // T1 EXCLUSIVE, FIRST COME FIRST SERVED, ACROSS TABS: A holds; B, C and A again ask in that order; each is granted only
  // after the one before lets go, in the order asked; never two holders; the callback runs later, not inside request().
  {
    const M = webLocks('T1'); const [wa, wb, wc] = [win(), win(), win()]; M.install(wa, 'A'); M.install(wb, 'B'); M.install(wc, 'C');
    const order = []; const gs = { A: gate(), B: gate(), C: gate(), A2: gate() }; let inside = 0, maxInside = 0;
    const cb = tag => () => { order.push(tag); inside++; maxInside = Math.max(maxInside, inside); return gs[tag].p.then(v => { inside--; return tag + ':' + v; }); };
    const pA = wa.navigator.locks.request('orbit-save', { mode: 'exclusive' }, cb('A'));
    const syncCall = order.length > 0;
    const pB = wb.navigator.locks.request('orbit-save', { mode: 'exclusive' }, cb('B'));
    const pC = wc.navigator.locks.request('orbit-save', { mode: 'exclusive' }, cb('C'));
    const pA2 = wa.navigator.locks.request('orbit-save', cb('A2'));             // the two-argument form: exclusive by default
    await until(() => order.length >= 1);
    const s1 = [order.slice(), M.heldBy('orbit-save'), M.pendingOf('orbit-save')];
    for (let i = 0; i < 50; i++) await tick();
    const s2 = [order.slice(), M.heldBy('orbit-save')];                        // still only A, however long A holds it
    gs.A.open(1); const rA = await pA;
    await until(() => order.length >= 2); const s3 = [order.slice(), M.heldBy('orbit-save'), M.pendingOf('orbit-save')];
    gs.B.open(2); gs.C.open(3); gs.A2.open(4);
    const all = await Promise.all([pB, pC, pA2]);
    chk(name, 'T1', 'the callback is not called inside request()', J(syncCall), J(false));
    chk(name, 'T1', 'first: A runs and holds; B, C, A pending in order', J(s1), J([['A'], ['A'], ['B', 'C', 'A']]));
    chk(name, 'T1', 'B does not run while A holds (50 turns)', J(s2), J([['A'], ['A']]));
    chk(name, 'T1', 'A resolves with its callback’s value', J(rA), J('A:1'));
    chk(name, 'T1', 'once A lets go: B runs and holds; C, A pending', J(s3), J([['A', 'B'], ['B'], ['C', 'A']]));
    chk(name, 'T1', 'grant order and results', J([order, all]), J([['A', 'B', 'C', 'A2'], ['B:2', 'C:3', 'A2:4']]));
    chk(name, 'T1', 'never two inside; no violation; most held at once', J([maxInside, M.stats.violations.length, M.stats.maxHeld['orbit-save']]), J([1, 0, 1]));
    chk(name, 'T1', 'the promise is made in the asking window', J(pA instanceof wa.Promise && pB instanceof wb.Promise), J(true));
  }
  // T2 LET GO ON A REJECTED PROMISE AND ON A THROW; T3 A PLAIN VALUE.
  {
    const M = webLocks('T2'); const [wa, wb] = [win(), win()]; M.install(wa, 'A'); M.install(wb, 'B');
    const p1 = wa.navigator.locks.request('L', () => Promise.reject(new Error('rejected')));
    const p2 = wb.navigator.locks.request('L', () => { throw new Error('thrown'); });
    const p3 = wa.navigator.locks.request('L', () => 7);
    const r = [];
    for (const p of [p1, p2, p3]) { try { r.push(['ok', await p]); } catch (e) { r.push(['err', e.message]); } }
    chk(name, 'T2', 'a rejection and a throw reject request(); a value resolves it; each lets go', J([r, M.heldBy('L'), M.stats.releases]), J([[['err', 'rejected'], ['err', 'thrown'], ['ok', 7]], [], 3]));
  }
  // T4 THE LOCK IS LET GO BEFORE request() SETTLES: the next waiter is granted before the first's promise is seen settled.
  {
    const M = webLocks('T4'); const [wa, wb] = [win(), win()]; M.install(wa, 'A'); M.install(wb, 'B');
    const seen = [];
    const pA = wa.navigator.locks.request('L', () => Promise.resolve('a'));
    pA.then(() => seen.push('A settled, held by ' + J(M.heldBy('L'))));
    const pB = wb.navigator.locks.request('L', () => { seen.push('B invoked'); return 'b'; });
    await pA; await pB;
    chk(name, 'T4', 'A’s promise settles after it lets go (B already granted then)', J(seen[0]), J('A settled, held by ["B"]'));
  }
  // T5 NAMES ARE INDEPENDENT.
  {
    const M = webLocks('T5'); const [wa, wb] = [win(), win()]; M.install(wa, 'A'); M.install(wb, 'B');
    const g = gate(); let both = false;
    const pA = wa.navigator.locks.request('L', () => g.p);
    const pB = wb.navigator.locks.request('M', () => { both = M.heldBy('L').length === 1; return 1; });
    await pB; g.open(); await pA;
    chk(name, 'T5', 'M is granted while L is held', J(both), J(true));
  }
  // T6 ifAvailable: held -> callback(null) at once, nothing queued; free -> granted.
  {
    const M = webLocks('T6'); const [wa, wb] = [win(), win()]; M.install(wa, 'A'); M.install(wb, 'B');
    const g = gate();
    const pA = wa.navigator.locks.request('L', () => g.p);
    await until(() => M.heldBy('L').length === 1);
    const r1 = await wb.navigator.locks.request('L', { ifAvailable: true }, l => l === null ? 'null' : 'lock');
    const pend = M.pendingOf('L').length;
    g.open(); await pA;
    const r2 = await wb.navigator.locks.request('L', { ifAvailable: true }, l => l === null ? 'null' : l.name + '/' + l.mode);
    chk(name, 'T6', 'ifAvailable: [while held, queued, when free]', J([r1, pend, r2]), J(['null', 0, 'L/exclusive']));
  }
  // T7 SHARED: two shared at once; an exclusive queued behind them waits; a shared asked after that exclusive waits too.
  {
    const M = webLocks('T7'); const [wa, wb, wc] = [win(), win(), win()]; M.install(wa, 'A'); M.install(wb, 'B'); M.install(wc, 'C');
    const gA = gate(), gB = gate(), gX = gate(); const ran = [];
    const pA = wa.navigator.locks.request('L', { mode: 'shared' }, () => { ran.push('A'); return gA.p; });
    const pB = wb.navigator.locks.request('L', { mode: 'shared' }, () => { ran.push('B'); return gB.p; });
    const pX = wc.navigator.locks.request('L', { mode: 'exclusive' }, () => { ran.push('X'); return gX.p; });
    const pS = wa.navigator.locks.request('L', { mode: 'shared' }, () => { ran.push('S'); return 's'; });
    await until(() => ran.length >= 2); for (let i = 0; i < 30; i++) await tick();
    const s1 = [ran.slice(), M.heldBy('L'), M.pendingOf('L')];
    gA.open(); gB.open(); await until(() => ran.length >= 3); for (let i = 0; i < 30; i++) await tick();
    const s2 = [ran.slice(), M.heldBy('L')];
    gX.open(); await Promise.all([pA, pB, pX, pS]);
    chk(name, 'T7', 'shared A and B together; X, then S, wait', J(s1), J([['A', 'B'], ['A', 'B'], ['C', 'A']]));
    chk(name, 'T7', 'X alone; S still waits', J(s2), J([['A', 'B', 'X'], ['C']]));
    chk(name, 'T7', 'then S; no violation', J([ran, M.stats.violations.length]), J([['A', 'B', 'X', 'S'], 0]));
  }
  // T8 query() and a tab going away: it lets go of what it holds and its waiting requests are dropped.
  {
    const M = webLocks('T8'); const [wa, wb, wc] = [win(), win(), win()]; M.install(wa, 'A'); M.install(wb, 'B'); M.install(wc, 'C');
    const g = gate(); let cRan = false;
    wa.navigator.locks.request('L', () => g.p);
    wb.navigator.locks.request('L', () => 'b');
    const pC = wc.navigator.locks.request('L', () => { cRan = true; return 'c'; });
    await until(() => M.heldBy('L').length === 1);
    const qy = await wc.navigator.locks.query();
    M.closeClient('B'); M.closeClient('A');
    const rC = await pC;
    chk(name, 'T8', 'query: held by A; B and C pending', J([qy.held.map(x => x.clientId), qy.pending.map(x => x.clientId)]), J([['A'], ['B', 'C']]));
    chk(name, 'T8', 'once B and A close: C granted; one dropped', J([rC, cRan, M.stats.dropped]), J(['c', true, 1]));
  }
  // T9 WHAT IS NOT MODELLED IS REFUSED, NOT IGNORED; bad arguments reject.
  {
    const M = webLocks('T9'); const wa = win(); M.install(wa, 'A');
    const r = [];
    for (const [n, o, c] of [['L', { steal: true }, () => 1], ['L', { signal: {} }, () => 1], ['-L', {}, () => 1], ['L', {}, null], ['L', { mode: 'x' }, () => 1]]) {
      try { await wa.navigator.locks.request(n, o, c); r.push('ok'); } catch (e) { r.push('rejected'); } }
    chk(name, 'T9', 'steal, signal, a name starting with -, no callback, a bad mode: each rejected; the unmodelled counted', J([r, M.stats.unmodeled.length]), J([['rejected', 'rejected', 'rejected', 'rejected', 'rejected'], 2]));
  }
  // T10 STRESS: 300 requests from three tabs on one name, random hold lengths (0-5 turns, seeded): granted in the order
  // asked, never two holders, every request settled.
  {
    const M = webLocks('T10'); const ws = [win(), win(), win()]; ws.forEach((w, i) => M.install(w, 'T' + i));
    let s = 12345; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    const asked = [], ran = []; let inside = 0, maxInside = 0; const ps = [];
    for (let i = 0; i < 300; i++) {
      const w = ws[Math.floor(rnd() * 3)], hold = Math.floor(rnd() * 6);
      asked.push(i);
      ps.push(w.navigator.locks.request('orbit-save', { mode: 'exclusive' }, async () => { inside++; maxInside = Math.max(maxInside, inside); ran.push(i);
        for (let k = 0; k < hold; k++) await tick(); inside--; return i; }));
      if (rnd() < 0.3) await tick();
    }
    const done = await until(() => ran.length === 300 && M.heldBy('orbit-save').length === 0, 20000);
    const all = await within(Promise.allSettled(ps), 5000);
    const settled = all.ok ? all.v.filter(x => x.status === 'fulfilled').length : 'not settled';
    chk(name, 'T10', '[finished, granted in the order asked, most inside at once, violations, settled]', J([done, J(ran) === J(asked), maxInside, M.stats.violations.length, settled]), J([true, true, 1, 0, 300]));
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  wins.forEach(w => { try { w.close(); } catch (e) {} });
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// THE BOARD: Alice's browser, O&M FY27 in tab B, FULL FUND in tab A -- one lock manager between them, each tab a board of its
// own (its own storage: A's keys and its folder copy are FULL FUND's, apart from B's). A's 💾 Save is held at the close of its
// write of FULL FUND's folder copy, so it holds 'orbit-save'; B's 💾 Save, asked then, waits for it. Alice's other machine (X,
// another browser, so not this lock) writes the folder copies the cases need. Save and ↶ Put back are the board's own
// saveInPlace() and keptPutBack() -- what the toolbar's 💾 and the top bar's ↶ work kept aside call. Every expected value is
// written by hand.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v2.00 (U20) — a save waiting for another tab’s save is under way';
  try {
  const { J, mk, SVC, wire, KEY, status, qs, baseFile, folder, connect, gate, until, pause, lsOf } = W1H;
  const F1 = baseFile('Alice', KEY.alice);
  const scr = ev => ev(`String(S.notes.A||'')`);
  const keptRaw = ev => ev(`localStorage.getItem(_AP.key+'.kept')`);
  const keptNote = ev => { const s = keptRaw(ev); if (s == null) return null;
    try { const st = JSON.parse(s.slice(s.indexOf('\n') + 1)); return String(((st.years || {})[st.cur] || { notes: {} }).notes.A || ''); } catch (e) { return '(unreadable)'; } };
  const unsaved = ev => JSON.parse(ev('JSON.stringify([DIRTY, _baseDirty, !!baseGet().dirty])'));
  const based = ev => +ev('driveBaseOf(mySlug())');
  const headTs = fold => { const j = fold.copy(2027); return j ? +((j.store && j.store.ts) || j.ts || 0) : 0; };
  // The folder's history for O&M FY27, oldest first: [requirement A's note, kept as a recent copy].
  const hist = fold => { const h = (fold.root.dirs.history || { files: {} }).files;
    return Object.keys(h).filter(n => /^spmt-2027-om-/.test(n)).sort().map(n => { let v = '?'; try { v = String(JSON.parse(h[n]).store.years['2027'].notes.A || ''); } catch (e) {} return [v, /-recent\.json$/.test(n)]; }); };
  const spaced = (fold, v) => hist(fold).some(([n, r]) => n === v && !r);
  const omWrites = fold => fold.log.filter(x => x === 'main:spmt-2027-om.json').length;   // writes of O&M's folder copy
  const asks = ev => /Nothing was written/.test(status(ev)) && /Load theirs/.test(status(ev)) && /Save yours over theirs/.test(status(ev));
  // EVERYTHING A REFUSED STEP LEAVES AS IT WAS, byte for byte (as the U13 block reads it).
  const state = ev => ev(`JSON.stringify([JSON.stringify(MS), DIRTY, _baseDirty, JSON.stringify(_driveBase), localStorage.getItem(_AP.key+'.base'), _saveGen, localStorage.getItem(_AP.key+'.kept'), localStorage.getItem(_AP.key)])`);
  const SAID = '⏳ The shared folder’s copy of O&M FY27 was not loaded: a save or Load theirs was under way, so this board kept its own copy of O&M FY27. '
    + 'The folder’s copy is checked again on the next refresh once that has finished (📡 Live view → ↻ Refresh now, or on its own while Live view is on).';
  // A TAB of Alice's browser (`LM` its lock manager), or a board of another browser (no LM).
  const open = async (LM, client, opts) => { const T = boot(opts || { html: F1 }); await pause(80);
    if (LM) LM.install(T.w, client); wire(T.ev, 'Alice', KEY.alice); return T; };
  // ALICE'S OTHER MACHINE saves `note` to the folder: it loads the folder's copy first (if any), types, saves.
  const other = async (fold, notes) => { const X = await open(null, 'X'); connect(X.ev, X.w, fold);
    for (const n of notes) { await X.ev('driveStorePull(false)'); X.ev(`setNote('A',${J(n)}); 'ok'`); await pause(5); await X.ev('driveStorePush(false)'); await pause(5); }
    return X; };
  // TAB A: FULL FUND, with one requirement typed; its 💾 Save held at the close of its write, holding 'orbit-save'.
  const tabA = async (LM, fold) => { const A = await open(LM, 'A', { html: F1, appn: 'FULL FUND' });
    seed(A.ev, { services: SVC, items: [mk('X', [300, 100, 50])], disc: [2000, 600, 300], mand: [500, 150, 80], order: ['X'] });
    A.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); setNote('X','FF-WORK'); 'ok'`);
    connect(A.ev, A.w, fold); return A; };
  const holdA = async (A, LM, fold) => { const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
    const p = A.ev('saveInPlace()'); const ok = await until(() => (fold.hits.main || 0) > n0);
    return { g, p, ok, slug: A.ev('mySlug()'), held: LM.heldBy('orbit-save') }; };
  // B's 💾 Save asked while A holds the lock: it waits for it.
  const waitB = async (B, LM, how) => { const p = B.ev(how || 'saveInPlace()'); const ok = await until(() => LM.pendingOf('orbit-save').includes('B')); return { p, ok }; };
  const WAITS = 'tab A’s save holds the lock and B’s Save waits for it -- [A held at its write, A’s appropriation, the lock held by, waiting] (a CONTROL)';
  const waits = (h, LM, w) => J([h.ok, h.slug, h.held, w.ok ? LM.pendingOf('orbit-save') : 'not waiting']);
  const WAITW = J([true, 'ff', ['A'], ['B']]);
  const COUNTED = 'B counts its waiting Save as under way (_saveBusy 1)';
  // THE STAND-IN, at the end of each case: the lock granted in the order asked, never to two at once, nothing asked of it
  // that it does not model, and every lock let go.
  // A GUARD passes on the board before this change too: it holds the stand-in, or how a save ends, to what it must be, so
  // that a wrong form of the change is caught. Every other check that is not a CONTROL fails on the board before it.
  const GUARD = ' (a GUARD: it passes before this change too)';
  const SANE = 'the lock was granted as asked and never held by two -- [grant order from the case’s first save, violations, most held at once, unmodelled, every grant let go, held now, waiting now]' + GUARD;
  const sane = (LM, m0) => J([LM.grantOrder('orbit-save', m0), LM.stats.violations.length, LM.stats.maxHeld['orbit-save'] || 0, LM.stats.unmodeled.length, LM.stats.grants === LM.stats.releases, LM.heldBy('orbit-save'), LM.pendingOf('orbit-save')]);
  const SANEW = order => J([order, 0, 1, 0, true, [], []]);
  // THE PUT-BACK FIXTURE (the U2 block's, in tab B). Alice saves F0 and types K, unsaved; her other machine saves N; her 💾 Save
  // is refused (N was saved after the copy K came from) and she loads theirs: K kept aside, N on screen. She types S1.
  const putBackFixture = async LM => { const fold = folder(); const B = await open(LM, 'B'); connect(B.ev, B.w, fold);
    B.ev(`setNote('A','F0'); 'ok'`); await pause(5); await B.ev('driveStorePush(false)'); await pause(5);
    B.ev(`setNote('A','K'); 'ok'`); await pause(5);
    await other(fold, ['N']);
    await B.ev('saveInPlace()'); await B.ev(`driveResolve('theirs')`); await pause(5);
    B.ev(`setNote('A','S1'); 'ok'`); await pause(5);
    return { B, fold }; };
  // ↶ Put back pressed now: [refused (what is on screen and the kept work byte for byte as they were), questions asked, on
  // screen, said that a save was under way].
  const putBack = B => { const ms = B.ev('JSON.stringify(MS)'), kr = keptRaw(B.ev), q0 = qs(B.ev).length;
    B.ev('keptPutBack()'); const st = status(B.ev);
    return [B.ev('JSON.stringify(MS)') === ms && keptRaw(B.ev) === kr, qs(B.ev).length - q0, scr(B.ev), /Not put back/.test(st) && /a save was under way/.test(st)]; };
  // NOTHING RECORDED, THE PRODUCT'S OWN WAY: tab B opens and its opening's own connect finds no O&M copy in the folder, so
  // nothing is recorded; then Alice's other machine saves F0 (F00 first, a moment before, with `h`: a spaced history copy
  // kept minutes before the next); then B-EDIT is typed in B, unsaved -- so the folder's copy is not newer than the screen.
  const unrecorded = async (LM, h) => { const fold = folder(); const B = await open(LM, 'B'); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    const c = await B.ev('driveAutoConnect()'); await pause(5);
    await other(fold, h ? ['F00', 'F0'] : ['F0']);
    B.ev(`setNote('A','B-EDIT'); 'ok'`); await pause(5);
    return { B, fold, c }; };
  const UNREC = h => 'the opening connected and recorded nothing (the folder held no O&M copy); Alice’s other machine then saved F0'
    + (h ? ' (F00 a moment before, now a spaced copy in the folder’s history)' : '') + '; B-EDIT typed after it, unsaved (a CONTROL)';
  const unrec = (x, h) => J([x.c, based(x.B.ev), scr(x.B.ev), x.B.ev('DIRTY'), x.fold.note(2027, 'A'), headTs(x.fold) < +x.B.ev('MS.ts'), hist(x.fold)]);
  const UNRECW = h => J([true, 0, 'B-EDIT', true, 'F0', true, h ? [['F00', false]] : []]);

  // (1) ↶ PUT BACK WHILE THE SAVE WAITS. B's Save is asked with S1 on screen and waits for tab A's save. ↶ Put back is
  // refused, as it is while a save runs (U2): putting K back now would let that save, landing, record S1's copy as the one
  // K came from. Once A's save lands, B's save runs and writes S1; then ↶ Put back works.
  { const sc = '(1) ↶ Put back while the Save waits for another tab’s save';
    const LM = webLocks(sc); const { B, fold } = await putBackFixture(LM); const A = await tabA(LM, fold);
    chk(name, sc, 'S1 on screen, unsaved; K kept aside; N the folder’s copy (a CONTROL)',
      J([scr(B.ev), B.ev('DIRTY'), keptNote(B.ev), fold.note(2027, 'A')]), J(['S1', true, 'K', 'N']));
    const m0 = LM.mark(); const h = await holdA(A, LM, fold); const w = await waitB(B, LM);
    chk(name, sc, WAITS, waits(h, LM, w), WAITW);
    chk(name, sc, COUNTED, B.ev('_saveBusy'), 1);
    chk(name, sc, '↶ Put back while the Save waits is refused and says so -- [what is on screen and the kept work byte for byte as they were, questions, on screen, said]',
      J(putBack(B)), J([true, 0, 'S1', true]));
    h.g.open(); await h.p; await w.p; await pause(5);
    chk(name, sc, 'once tab A’s save lands, B’s Save runs: S1 on screen and the folder’s copy, saved; K still kept aside; nothing under way',
      J([scr(B.ev), fold.note(2027, 'A'), unsaved(B.ev), keptNote(B.ev), B.ev('_saveBusy')]), J(['S1', 'S1', [false, false, false], 'K', 0]));
    chk(name, sc, SANE, sane(LM, m0), SANEW(['A', 'B']));
    const q0 = qs(B.ev).length; B.ev('keptPutBack()');
    chk(name, sc, '↶ Put back now: one question; K on screen, unsaved; nothing kept in its place (S1 is saved)',
      J([qs(B.ev).length - q0, scr(B.ev), unsaved(B.ev), keptNote(B.ev)]), J([1, 'K', [true, true, true], null]));
  }
  // (2) A REFRESH WHILE THE SAVE WAITS DOES NOT LOAD A NEWER COPY. B reopens with WORKING unsaved (recorded against F0); its
  // Save waits; Alice's other machine saves N2 over F0; a refresh loads nothing, as during a save (U13), and says so. The
  // Save, run, finds N2 saved after the copy WORKING came from and asks. The next refresh is an ordinary one.
  { const sc = '(2) a refresh while the Save waits for another tab’s save';
    const LM = webLocks(sc), fold = folder();
    const B0 = await open(null, 'B0'); connect(B0.ev, B0.w, fold);
    B0.ev(`setNote('A','F0'); 'ok'`); await pause(5); await B0.ev('driveStorePush(false)'); await pause(5);
    B0.ev(`setNote('A','WORKING'); 'ok'`); await pause(5);
    const B = await open(LM, 'B', { html: F1, ls: lsOf(B0.ev) }); connect(B.ev, B.w, fold);
    const A = await tabA(LM, fold);
    chk(name, sc, 'reopened: WORKING on screen, unsaved by this browser’s record, recorded against F0, the folder’s copy (a CONTROL)',
      J([scr(B.ev), unsaved(B.ev)[2], based(B.ev) === headTs(fold), fold.note(2027, 'A')]), J(['WORKING', true, true, 'F0']));
    const m0 = LM.mark(); const h = await holdA(A, LM, fold); const w = await waitB(B, LM);
    chk(name, sc, WAITS, waits(h, LM, w), WAITW);
    chk(name, sc, COUNTED, B.ev('_saveBusy'), 1);
    await other(fold, ['N2']);
    chk(name, sc, 'Alice’s other machine saved N2 over F0: newer than what is on screen (a CONTROL)',
      J([fold.note(2027, 'A'), headTs(fold) > +B.ev('MS.ts')]), J(['N2', true]));
    const s0 = state(B.ev); const r = await B.ev('driveStorePull(false)'); await pause(5);
    chk(name, sc, 'the refresh while the Save waits loads nothing -- [returned, nothing changed byte for byte, said word for word]',
      J([r, state(B.ev) === s0, status(B.ev)]), J([false, true, SAID]));
    h.g.open(); await h.p; await w.p; await pause(5);
    chk(name, sc, 'then B’s Save runs and asks: nothing written, N2 still the folder’s copy; WORKING on screen, unsaved; the choice offered; nothing under way',
      J([fold.note(2027, 'A'), scr(B.ev), unsaved(B.ev)[2], asks(B.ev), B.ev('_saveBusy')]), J(['N2', 'WORKING', true, true, 0]));
    chk(name, sc, SANE, sane(LM, m0), SANEW(['A', 'B']));
    const r2 = await B.ev('driveStorePull(true)'); await pause(5);
    chk(name, sc, 'the next refresh is an ordinary one: N2 loaded, recorded against the folder’s copy; WORKING kept aside',
      J([r2, scr(B.ev), based(B.ev) === headTs(fold), keptNote(B.ev)]), J([true, 'N2', true, 'WORKING']));
  }
  // (3) NOTHING RECORDED; LIVE VIEW'S ↻ REFRESH NOW WHILE THE SAVE WAITS. The refresh does not take F0 as the one B-EDIT came
  // from (U13: not while a save is under way), so the Save, run, asks rather than writing B-EDIT over F0. Alice then chooses
  // Save yours over theirs: F0 is kept in the folder's history as a spaced copy, and stays there through one more Save. (3h):
  // a spaced history copy, F00, kept minutes before -- where F0, written over unasked, was kept only as a recent copy and
  // was gone after one more Save.
  for (const h0 of [false, true]) {
    const sc = '(3' + (h0 ? 'h' : '') + ') nothing recorded; ↻ Refresh now while the Save waits for another tab’s save' + (h0 ? '; a history copy kept minutes before' : '');
    const LM = webLocks(sc); const x = await unrecorded(LM, h0); const { B, fold } = x; const A = await tabA(LM, fold);
    chk(name, sc, UNREC(h0), unrec(x, h0), UNRECW(h0));
    const m0 = LM.mark(); const h = await holdA(A, LM, fold); const w = await waitB(B, LM);
    chk(name, sc, WAITS, waits(h, LM, w), WAITW);
    chk(name, sc, COUNTED, B.ev('_saveBusy'), 1);
    await B.ev('livePoll(false)'); await pause(5);
    chk(name, sc, 'Live view’s ↻ Refresh now while the Save waits records nothing: F0 is not taken as the copy B-EDIT came from', based(B.ev), 0);
    const w0 = omWrites(fold);
    h.g.open(); await h.p; await w.p; await pause(5);
    chk(name, sc, 'then B’s Save asks: nothing written, F0 still the folder’s copy; B-EDIT on screen, unsaved; the choice offered; nothing under way',
      J([omWrites(fold) - w0, fold.note(2027, 'A'), scr(B.ev), B.ev('DIRTY'), asks(B.ev), B.ev('_saveBusy')]), J([0, 'F0', 'B-EDIT', true, true, 0]));
    chk(name, sc, SANE, sane(LM, m0), SANEW(['A', 'B']));
    const q0 = qs(B.ev).length; await B.ev(`driveResolve('mine')`); await pause(5);
    chk(name, sc, '“Save yours over theirs”, asked and answered OK: B-EDIT the folder’s copy, saved; F0 kept in the folder’s history as a spaced copy' + (h0 ? '' : GUARD),
      J([qs(B.ev).length - q0, fold.note(2027, 'A'), unsaved(B.ev), spaced(fold, 'F0')]), J([1, 'B-EDIT', [false, false, false], true]));
    B.ev(`setNote('A','B-EDIT2'); 'ok'`); await pause(5); const q1 = qs(B.ev).length; await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'one more 💾 Save writes B-EDIT2 with no question; F0 still in the folder’s history as a spaced copy' + (h0 ? ', and F00' : GUARD),
      J([fold.note(2027, 'A'), qs(B.ev).length - q1, spaced(fold, 'F0'), h0 ? spaced(fold, 'F00') : null]), J(['B-EDIT2', 0, true, h0 ? true : null]));
  }
  // (4) THE SCREEN EXACTLY THE FOLDER'S COPY, NOTHING RECORDED (a browser that last saved to the folder before v1.89, when no
  // record was kept: Alice's other browser's storage, its record removed). Where a refresh would take F0 as the base, it does
  // not while B's Save waits, as while a save runs (U13); the Save, run, finds nothing recorded and asks.
  { const sc = '(4) the screen exactly the folder’s copy, nothing recorded; a refresh while the Save waits';
    const LM = webLocks(sc), fold = folder();
    const X = await other(fold, ['F0']); const ls = lsOf(X.ev); delete ls[X.ev('_AP.key') + '.base'];
    const B = await open(LM, 'B', { html: F1, ls }); connect(B.ev, B.w, fold); const A = await tabA(LM, fold);
    chk(name, sc, 'F0 on screen, stamped as the folder’s copy is; nothing recorded; nothing changed in this session (a CONTROL)',
      J([scr(B.ev), +B.ev('MS.ts') === headTs(fold), based(B.ev), B.ev('DIRTY')]), J(['F0', true, 0, false]));
    const m0 = LM.mark(); const h = await holdA(A, LM, fold); const w = await waitB(B, LM);
    chk(name, sc, WAITS, waits(h, LM, w), WAITW);
    chk(name, sc, COUNTED, B.ev('_saveBusy'), 1);
    const s0 = state(B.ev), st0 = status(B.ev); const r = await B.ev('driveStorePull(true)'); await pause(5);
    chk(name, sc, 'a refresh while the Save waits records nothing and says nothing -- [returned, nothing changed byte for byte, the status line as it was]',
      J([r, state(B.ev) === s0, status(B.ev) === st0]), J([false, true, true]));
    const w0 = omWrites(fold);
    h.g.open(); await h.p; await w.p; await pause(5);
    chk(name, sc, 'then B’s Save, finding nothing recorded, asks: nothing written, F0 still the folder’s copy, the choice offered',
      J([omWrites(fold) - w0, fold.note(2027, 'A'), asks(B.ev)]), J([0, 'F0', true]));
    chk(name, sc, SANE, sane(LM, m0), SANEW(['A', 'B']));
  }
  // (5) CONTROLS: waits that were always counted. (5a) B's own save writing and a second Save waiting behind it in this tab:
  // the second is told it waits, ↶ Put back is refused and a refresh loads nothing; both saves then land, one at a time.
  // (5b) Case (3) with B's waiting Save counted by the harness itself (its lock request wrapped: up when asked, down when
  // settled): the refresh records nothing and the Save asks, on a board with or without this change -- the uncounted wait
  // alone was the cause.
  { const sc = '(5a) CONTROL: a second Save waiting behind this tab’s own save';
    const LM = webLocks(sc); const { B, fold } = await putBackFixture(LM);
    const m0 = LM.mark(); const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
    const p1 = B.ev('saveInPlace()'); const ok = await until(() => (fold.hits.main || 0) > n0);
    const p2 = B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'the first Save holds the lock, held at its write; the second, asked now, is told it runs once the first has finished',
      J([ok, LM.heldBy('orbit-save'), B.ev('_saveBusy') > 0, status(B.ev)]), J([true, ['B'], true, '⏳ A save is already under way — this one runs as soon as it finishes.']));
    chk(name, sc, '↶ Put back is refused and says so -- [byte for byte as it was, questions, on screen, said]', J(putBack(B)), J([true, 0, 'S1', true]));
    const s0 = state(B.ev); const r = await B.ev('driveStorePull(true)'); await pause(5);
    chk(name, sc, 'a refresh loads nothing -- [returned, nothing changed byte for byte]', J([r, state(B.ev) === s0]), J([false, true]));
    g.open(); await p1; await p2; await pause(5);
    chk(name, sc, 'both land, one at a time: S1 the folder’s copy, saved; K still kept; nothing under way',
      J([fold.note(2027, 'A'), unsaved(B.ev), keptNote(B.ev), B.ev('_saveBusy')]), J(['S1', [false, false, false], 'K', 0]));
    chk(name, sc, SANE, sane(LM, m0), SANEW(['B', 'B']));
  }
  { const sc = '(5b) CONTROL: case (3) with the waiting Save counted by the harness';
    const LM = webLocks(sc); const x = await unrecorded(LM, false); const { B, fold } = x; const A = await tabA(LM, fold);
    const api = B.w.navigator.locks, real = api.request;
    Object.defineProperty(B.w.navigator, 'locks', { configurable: true, enumerable: true, value: { query: api.query,
      request: (n, a, b) => { B.ev('_saveBusy++; 0'); const p = real(n, a, b); const down = () => { B.ev('_saveBusy--; 0'); }; p.then(down, down); return p; } } });
    chk(name, sc, UNREC(false), unrec(x, false), UNRECW(false));
    const m0 = LM.mark(); const h = await holdA(A, LM, fold); const w = await waitB(B, LM);
    chk(name, sc, WAITS, waits(h, LM, w), WAITW);
    chk(name, sc, 'the waiting Save is counted', B.ev('_saveBusy') > 0, true);
    await B.ev('livePoll(false)'); await pause(5);
    chk(name, sc, '↻ Refresh now while the counted Save waits records nothing', based(B.ev), 0);
    const w0 = omWrites(fold);
    h.g.open(); await h.p; await w.p; await pause(5);
    chk(name, sc, 'then B’s Save asks: nothing written, F0 still the folder’s copy; B-EDIT on screen, unsaved; the choice offered; nothing under way',
      J([omWrites(fold) - w0, fold.note(2027, 'A'), scr(B.ev), B.ev('DIRTY'), asks(B.ev), B.ev('_saveBusy')]), J([0, 'F0', 'B-EDIT', true, true, 0]));
    chk(name, sc, SANE, sane(LM, m0), SANEW(['A', 'B']));
  }
  // (6) THE COUNT COMES BACK DOWN HOWEVER A SAVE ENDS, and counts every save asked for. B has saved F0 (recorded) and typed S1.
  // (6a) the Live timer's autosave, holding the lock, throws (the folder refuses its write); (6b) the lock request itself is
  // refused (a tab no longer fully active); (6c) asking for the lock throws at once (the save runs without it); (6d) two
  // Saves asked while tab A holds the lock: both counted, the second told it waits, then both run, one at a time.
  const saved1 = async LM => { const fold = folder(); const B = await open(LM, 'B'); connect(B.ev, B.w, fold);
    B.ev(`setNote('A','F0'); 'ok'`); await pause(5); await B.ev('saveInPlace()'); await pause(5);
    B.ev(`setNote('A','S1'); 'ok'`); await pause(5); return { B, fold }; };
  const SAVED1 = 'F0 saved, the folder’s copy and recorded; S1 on screen, unsaved (a CONTROL)';
  const saved1v = (B, fold) => J([fold.note(2027, 'A'), based(B.ev) === headTs(fold), scr(B.ev), B.ev('DIRTY')]);
  { const sc = '(6a) the autosave throws while it holds the lock';
    const LM = webLocks(sc); const { B, fold } = await saved1(LM);
    chk(name, sc, SAVED1, saved1v(B, fold), J(['F0', true, 'S1', true]));
    B.ev(`_liveCfg.on=true; _liveCfg.auto=true; _driveLive=true; 'ok'`);
    fold.failNext.main = new Error('The shared folder is read-only');
    await B.ev('liveTick()'); await pause(5);
    chk(name, sc, 'the autosave failed and says so; F0 still the folder’s copy; S1 unsaved; nothing under way, and the lock let go' + GUARD,
      J([/Automatic save to the shared folder failed/.test(status(B.ev)), fold.note(2027, 'A'), B.ev('DIRTY'), B.ev('_saveBusy'), LM.heldBy('orbit-save'), LM.stats.grants === LM.stats.releases]),
      J([true, 'F0', true, 0, [], true]));
  }
  { const sc = '(6b) the lock request is refused';
    const LM = webLocks(sc); const { B, fold } = await saved1(LM);
    chk(name, sc, SAVED1, saved1v(B, fold), J(['F0', true, 'S1', true]));
    Object.defineProperty(B.w.navigator, 'locks', { configurable: true, enumerable: true, value: {
      request: () => B.w.Promise.reject(new B.w.Error('InvalidStateError: the document is not fully active')) } });
    let ret; try { ret = await B.ev('saveInPlace()'); } catch (e) { ret = 'threw: ' + ((e && e.message) || e); } await pause(5);
    chk(name, sc, 'the Save fails with the refusal; nothing written, F0 still the folder’s copy; S1 unsaved; nothing under way' + GUARD,
      J([ret, fold.note(2027, 'A'), B.ev('DIRTY'), B.ev('_saveBusy')]), J(['threw: InvalidStateError: the document is not fully active', 'F0', true, 0]));
  }
  { const sc = '(6c) asking for the lock throws at once';
    const LM = webLocks(sc); const { B, fold } = await saved1(LM);
    chk(name, sc, SAVED1, saved1v(B, fold), J(['F0', true, 'S1', true]));
    Object.defineProperty(B.w.navigator, 'locks', { configurable: true, enumerable: true, value: { request: () => { throw new B.w.Error('SecurityError'); } } });
    await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'the Save runs without the lock: S1 the folder’s copy, saved; nothing under way' + GUARD,
      J([fold.note(2027, 'A'), unsaved(B.ev), B.ev('_saveBusy')]), J(['S1', [false, false, false], 0]));
  }
  { const sc = '(6d) two Saves asked while another tab’s save holds the lock';
    const LM = webLocks(sc); const { B, fold } = await saved1(LM); const A = await tabA(LM, fold);
    chk(name, sc, SAVED1, saved1v(B, fold), J(['F0', true, 'S1', true]));
    const m0 = LM.mark(); const h = await holdA(A, LM, fold); const w = await waitB(B, LM);
    chk(name, sc, WAITS, waits(h, LM, w), WAITW);
    const st1 = status(B.ev); const p2 = B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'both waiting Saves are counted (_saveBusy 2), and the second is told it runs once the first has finished',
      J([B.ev('_saveBusy'), status(B.ev) !== st1 && status(B.ev)]), J([2, '⏳ A save is already under way — this one runs as soon as it finishes.']));
    h.g.open(); await h.p; await w.p; await p2; await pause(5);
    chk(name, sc, 'once A’s save lands both run: S1 the folder’s copy, saved; nothing under way' + GUARD,
      J([fold.note(2027, 'A'), unsaved(B.ev), B.ev('_saveBusy')]), J(['S1', [false, false, false], 0]));
    chk(name, sc, SANE, sane(LM, m0), SANEW(['A', 'B', 'B']));
  }
  // (7) LOAD THEIRS WAITS AS A SAVE DOES. B saved F0; Alice's other machine saved N over it; B typed B-EDIT and its 💾 Save
  // asked. B presses Load theirs while tab A's save holds the lock: it waits, and is under way as a waiting save is, so ↶ Put
  // back is refused meanwhile (other work, kept aside here by the harness, stays kept). The harness then empties the kept
  // slot, so that Load theirs, once A's save lands, has room to keep B-EDIT aside: N on screen and recorded, B-EDIT kept.
  { const sc = '(7) Load theirs while another tab’s save holds the lock';
    const LM = webLocks(sc), fold = folder(); const B = await open(LM, 'B'); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    await B.ev('driveAutoConnect()'); await pause(5);
    B.ev(`setNote('A','F0'); 'ok'`); await pause(5); await B.ev('saveInPlace()'); await pause(5);
    await other(fold, ['N']);
    B.ev(`setNote('A','B-EDIT'); 'ok'`); await pause(5); await B.ev('saveInPlace()'); await pause(5);
    const A = await tabA(LM, fold);
    chk(name, sc, 'F0 saved and recorded; Alice’s other machine saved N over it; B-EDIT typed after, unsaved; B’s 💾 Save asked; nothing kept aside (a CONTROL)',
      J([fold.note(2027, 'A'), scr(B.ev), B.ev('DIRTY'), asks(B.ev), keptNote(B.ev)]), J(['N', 'B-EDIT', true, true, null]));
    const m0 = LM.mark(); const h = await holdA(A, LM, fold); const w = await waitB(B, LM, `driveResolve('theirs')`);
    chk(name, sc, 'tab A’s save holds the lock and B’s Load theirs waits for it -- [A held at its write, A’s appropriation, the lock held by, waiting] (a CONTROL)',
      waits(h, LM, w), WAITW);
    chk(name, sc, 'B counts its waiting Load theirs as under way (_saveBusy 1)', B.ev('_saveBusy'), 1);
    B.ev(`(function(){ var o=JSON.parse(JSON.stringify(MS)); o.years['2027'].notes.A='OTHER-KEPT'; return keepAside(o, {why:'file', by:'Bob', ts:1}, baseGet()); })()`);
    chk(name, sc, '↶ Put back while Load theirs waits is refused and says so -- [what is on screen and the kept work byte for byte as they were, questions, on screen, said]',
      J(putBack(B)), J([true, 0, 'B-EDIT', true]));
    B.ev(`localStorage.removeItem(_AP.key+'.kept'); _keptMeta=null; 'ok'`);
    h.g.open(); await h.p; await w.p; await pause(5);
    chk(name, sc, 'once tab A’s save lands, Load theirs runs: N on screen, recorded against the folder’s copy; B-EDIT kept aside; nothing under way',
      J([scr(B.ev), based(B.ev) === headTs(fold), keptNote(B.ev), B.ev('_saveBusy'), fold.note(2027, 'A')]), J(['N', true, 'B-EDIT', 0, 'N']));
    chk(name, sc, SANE, sane(LM, m0), SANEW(['A', 'B']));
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (U20) ====
// ==== v2.00 (U30): a refresh takes the folder's copy as the one the work came from only when it is what is on screen ====
// With nothing recorded for the folder (this browser has not loaded from it or saved to it yet -- an opening that found no
// copy there, then a colleague's or another machine's save), a refresh that found the folder's copy not newer than the
// screen took that copy as the one the work on screen came from, "as it always was" (v1.89) -- whatever was on screen. The
// next 💾 Save, or the Live timer's next autosave one tick after it had said "Nothing was written" and offered the choice,
// then wrote the work on screen over that copy without asking. With a spaced history copy kept less than ten minutes
// before, the copy written over was kept only as a recent copy, and one more Save removed it: it was in no copy the board
// could reach. No second tab was needed; U20 was its two-tab form. Now the refresh takes the folder's copy as the base only
// when it is what is on screen (the same stamp: every change stamps the board anew); otherwise nothing is recorded and
// nothing is said, and 💾 Save asks -- Load theirs (yours kept aside), or Save yours over theirs (theirs kept in the folder's
// history as a spaced copy, whatever the spacing). It asks saying there is no record of which copy the work came from: it
// used to say that theirs was saved after that copy, which nothing recorded can tell. Controls: the screen exactly the folder's copy (recorded, and Save writes
// with no question; while a save is under way, U13's rule still holds), the first save of a new board into an empty folder,
// and an ordinary refresh with nothing unsaved. The rule is the stamp, so it is run through every way a refresh comes with
// nothing recorded: the Live timer, ↻ Refresh now, a reopen's own connect with unsaved work, a board saved to its own file,
// a board file handed over newer than the folder's copy, and another year. The two lines that follow the question -- ↶ Put
// back, and Load theirs refused for work already kept -- no longer say theirs was saved after, or is newer, when nothing
// recorded can tell (with a copy recorded they say it as before). Every expected value is written by hand.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v2.00 (U30) — a refresh takes the folder’s copy as the base only when it is on screen';
  try {
  const { J, mk, SVC, wire, KEY, status, qs, baseFile, folder, connect, gate, until, pause, lsOf } = W1H;
  const F1 = baseFile('Alice', KEY.alice);
  const scr = ev => ev(`String(S.notes.A||'')`);
  const unsaved = ev => JSON.parse(ev('JSON.stringify([DIRTY, _baseDirty, !!baseGet().dirty])'));
  const based = ev => +ev('driveBaseOf(mySlug())');
  const headTs = fold => { const j = fold.copy(2027); return j ? +((j.store && j.store.ts) || j.ts || 0) : 0; };
  const hist = fold => { const h = (fold.root.dirs.history || { files: {} }).files;
    return Object.keys(h).filter(n => /^spmt-2027-om-/.test(n)).sort().map(n => { let v = '?'; try { v = String(JSON.parse(h[n]).store.years['2027'].notes.A || ''); } catch (e) {} return [v, /-recent\.json$/.test(n)]; }); };
  const spaced = (fold, v) => hist(fold).some(([n, r]) => n === v && !r);
  const anywhere = (fold, v) => fold.note(2027, 'A') === v || hist(fold).some(([n]) => n === v);   // the folder's copy or its history
  const omWrites = fold => fold.log.filter(x => x === 'main:spmt-2027-om.json').length;
  const asks = ev => /Nothing was written/.test(status(ev)) && /Load theirs/.test(status(ev)) && /Save yours over theirs/.test(status(ev));
  // WHAT A SAVE SAYS WHEN IT ASKS WITH NOTHING RECORDED, word for word but for the copy's age ("just now", "2 minutes ago"):
  // there is no telling which copy the work came from, so it does not say that theirs was saved after it.
  const UNSAID = /^⛔ Alice saved O&M FY27 to the shared folder [^,]+, and this browser has no record of which copy in the folder, if any, the work on screen came from\. Nothing was written\. Load theirs \(your work is kept aside, and one click puts it back\) · Save yours over theirs \(theirs is kept in the folder’s history\)\.$/;
  // A GUARD passes on the board before this change too: it holds what must not change (the save's question, the stand-in,
  // a choice's outcome) so that a wrong form of the change is caught. Every other check that is not a CONTROL fails there.
  const GUARD = ' (a GUARD: it passes before this change too)';
  const state = ev => ev(`JSON.stringify([JSON.stringify(MS), DIRTY, _baseDirty, JSON.stringify(_driveBase), localStorage.getItem(_AP.key+'.base'), _saveGen, localStorage.getItem(_AP.key+'.kept'), localStorage.getItem(_AP.key)])`);
  const live = ev => ev(`_liveCfg.on=true; _liveCfg.auto=true; _driveLive=true; 'ok'`);   // Live view and its autosave on
  const open = async (LM, client, opts) => { const T = boot(opts || { html: F1 }); await pause(80);
    if (LM) LM.install(T.w, client); wire(T.ev, 'Alice', KEY.alice); return T; };
  const other = async (fold, notes) => { const X = await open(null, 'X'); connect(X.ev, X.w, fold);
    for (const n of notes) { await X.ev('driveStorePull(false)'); X.ev(`setNote('A',${J(n)}); 'ok'`); await pause(5); await X.ev('driveStorePush(false)'); await pause(5); }
    return X; };
  // NOTHING RECORDED, THE PRODUCT'S OWN WAY (as in the U20 block): B opens, and its opening's own connect finds no O&M copy;
  // then Alice's other machine saves F0 (F00 a moment before, with `h`); then B-EDIT is typed in B, unsaved.
  const unrecorded = async (LM, h) => { const fold = folder(); const B = await open(LM, 'B'); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    const c = await B.ev('driveAutoConnect()'); await pause(5);
    await other(fold, h ? ['F00', 'F0'] : ['F0']);
    B.ev(`setNote('A','B-EDIT'); 'ok'`); await pause(5);
    return { B, fold, c }; };
  const UNREC = h => 'the opening connected and recorded nothing (the folder held no O&M copy); Alice’s other machine then saved F0'
    + (h ? ' (F00 a moment before, now a spaced copy in the folder’s history)' : '') + '; B-EDIT typed after it, unsaved (a CONTROL)';
  const unrec = x => J([x.c, based(x.B.ev), scr(x.B.ev), x.B.ev('DIRTY'), x.fold.note(2027, 'A'), headTs(x.fold) < +x.B.ev('MS.ts'), hist(x.fold)]);
  const UNRECW = h => J([true, 0, 'B-EDIT', true, 'F0', true, h ? [['F00', false]] : []]);
  // ALICE CHOOSES, once the board has asked: Save yours over theirs (asked, and answered OK), then one more 💾 Save -- F0 stays
  // in the folder's history as a spaced copy throughout, and so does F00. Then reopened (this browser, the same folder, the
  // opening's own connect): B-EDIT2 on screen and the folder's copy, F0 in its history.
  const chooseMine = async (B, fold, sc, h) => {
    const q0 = qs(B.ev).length; await B.ev(`driveResolve('mine')`); await pause(5);
    chk(name, sc, '“Save yours over theirs”, asked and answered OK: B-EDIT the folder’s copy, saved; F0 kept in the folder’s history as a spaced copy' + (h ? '' : GUARD),
      J([qs(B.ev).length - q0, fold.note(2027, 'A'), unsaved(B.ev), spaced(fold, 'F0')]), J([1, 'B-EDIT', [false, false, false], true]));
    B.ev(`setNote('A','B-EDIT2'); 'ok'`); await pause(5); const q1 = qs(B.ev).length; await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'one more 💾 Save writes B-EDIT2 with no question; F0 still in the folder’s history as a spaced copy' + (h ? ', and F00' : GUARD),
      J([fold.note(2027, 'A'), qs(B.ev).length - q1, spaced(fold, 'F0'), h ? spaced(fold, 'F00') : null]), J(['B-EDIT2', 0, true, h ? true : null]));
    const C = await open(null, 'C', { html: F1, ls: lsOf(B.ev) }); connect(C.ev, C.w, fold); C.ev(`_liveCfg.folder='shared'; 'ok'`);
    await C.ev('driveAutoConnect()'); await pause(5);
    chk(name, sc, 'reopened: B-EDIT2 on screen and the folder’s copy, recorded against it; F0' + (h ? ' and F00' : '') + ' still in the folder’s history' + (h ? '' : GUARD),
      J([scr(C.ev), fold.note(2027, 'A'), based(C.ev) === headTs(fold), spaced(fold, 'F0'), h ? spaced(fold, 'F00') : null]), J(['B-EDIT2', 'B-EDIT2', true, true, h ? true : null]));
  };

  // (1) THE LIVE TIMER ALONE, ONE TAB. Live view and its autosave on. Tick 1: the autosave asks (nothing recorded, so there
  // is no telling: "Nothing was written", and the choice); the same tick's refresh does not take F0 as the base. Tick 2: the
  // autosave asks again and writes nothing -- it used to write B-EDIT over F0 and say "Saved automatically". 💾 Save asks
  // too. (1h): with F00 kept minutes before, F0 used to be kept only as a recent copy, and the next Save removed it.
  for (const h0 of [false, true]) {
    const sc = '(1' + (h0 ? 'h' : '') + ') the Live timer, one tab: nothing recorded, B-EDIT unsaved, F0 in the folder' + (h0 ? '; a history copy kept minutes before' : '');
    const x = await unrecorded(null, h0); const { B, fold } = x;
    chk(name, sc, UNREC(h0), unrec(x), UNRECW(h0));
    live(B.ev);
    const w0 = omWrites(fold), hs0 = J(hist(fold)); await B.ev('liveTick()'); await pause(5);
    chk(name, sc, 'tick 1: the autosave asks -- nothing written, F0 still the folder’s copy, the choice offered -- and the tick’s refresh records nothing',
      J([omWrites(fold) - w0, fold.note(2027, 'A'), asks(B.ev), based(B.ev)]), J([0, 'F0', true, 0]));
    chk(name, sc, 'and it says there is no record of the copy the work came from -- never that theirs was saved after it -- [the words, said after]',
      J([UNSAID.test(status(B.ev)), /after the copy you are working from/.test(status(B.ev))]), J([true, false]));
    await B.ev('liveTick()'); await pause(5);
    chk(name, sc, 'tick 2: the autosave asks again -- nothing written, F0 still the folder’s copy and its history as it was, B-EDIT unsaved, the choice still offered, nothing said to have saved',
      J([omWrites(fold) - w0, fold.note(2027, 'A'), J(hist(fold)) === hs0, B.ev('DIRTY'), asks(B.ev), /Saved to the shared folder automatically/.test(status(B.ev))]),
      J([0, 'F0', true, true, true, false]));
    const q0 = qs(B.ev).length; await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, '💾 Save asks as well: nothing written, nothing asked in a dialog, F0 still the folder’s copy, B-EDIT on screen, the choice offered',
      J([omWrites(fold) - w0, qs(B.ev).length - q0, fold.note(2027, 'A'), scr(B.ev), asks(B.ev)]), J([0, 0, 'F0', 'B-EDIT', true]));
    chk(name, sc, 'F0 and B-EDIT each still in a copy the board reaches -- [F0 in the folder or its history, B-EDIT on screen]' + (h0 ? '' : GUARD),
      J([anywhere(fold, 'F0'), scr(B.ev)]), J([true, 'B-EDIT']));
    await chooseMine(B, fold, sc, h0);
  }
  // (2) A REFRESH, THEN 💾 SAVE (one tab, no timer): Live view's ↻ Refresh now records nothing and says nothing new; the Save
  // asks. (3) 💾 SAVE FIRST: it asks; then the refresh; then 💾 Save asks again -- it used to write over F0 the second time.
  { const sc = '(2) ↻ Refresh now, then 💾 Save';
    const x = await unrecorded(null, true); const { B, fold } = x;
    chk(name, sc, UNREC(true), unrec(x), UNRECW(true));
    const st0 = status(B.ev); await B.ev('livePoll(false)'); await pause(5);
    chk(name, sc, '↻ Refresh now records nothing and says no clash -- [recorded, a clash said]',
      J([based(B.ev), /after the copy you are working from/.test(status(B.ev))]), J([0, false]));
    const w0 = omWrites(fold); await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'then 💾 Save asks: nothing written, F0 still the folder’s copy, B-EDIT on screen and unsaved, the choice offered',
      J([omWrites(fold) - w0, fold.note(2027, 'A'), scr(B.ev), B.ev('DIRTY'), asks(B.ev)]), J([0, 'F0', 'B-EDIT', true, true]));
    await chooseMine(B, fold, sc, true);
  }
  { const sc = '(3) 💾 Save, then ↻ Refresh now, then 💾 Save again';
    const x = await unrecorded(null, true); const { B, fold } = x;
    chk(name, sc, UNREC(true), unrec(x), UNRECW(true));
    const w0 = omWrites(fold); await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'the first 💾 Save asks: nothing written, the choice offered' + GUARD, J([omWrites(fold) - w0, asks(B.ev)]), J([0, true]));
    await B.ev('livePoll(false)'); await pause(5);
    chk(name, sc, '↻ Refresh now records nothing', based(B.ev), 0);
    await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'the second 💾 Save asks again: nothing written, F0 still the folder’s copy and kept as it was in the history, B-EDIT unsaved',
      J([omWrites(fold) - w0, fold.note(2027, 'A'), J(hist(fold)), B.ev('DIRTY'), asks(B.ev)]), J([0, 'F0', J([['F00', false]]), true, true]));
  }
  // (4) THE SECOND TAB, ONCE A WAITING SAVE IS COUNTED (U20): B's 💾 Save waits for tab A's save; the Live timer's tick 1
  // queues its autosave behind it and waits; tick 2 refreshes during the wait (nothing recorded, U20). Tab A's save lands:
  // B's Save asks, tick 1's autosave asks -- and tick 1's own refresh, running then with nothing under way, records nothing
  // either. The next 💾 Save asks. Before this change that last refresh took F0 as the base and the next Save wrote over it.
  { const sc = '(4) a second tab: the Save waits, the Live timer ticks twice';
    const LM = webLocks(sc); const x = await unrecorded(LM, false); const { B, fold } = x;
    const A = await open(LM, 'A', { html: F1, appn: 'FULL FUND' });
    seed(A.ev, { services: SVC, items: [mk('X', [300, 100, 50])], disc: [2000, 600, 300], mand: [500, 150, 80], order: ['X'] });
    A.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); setNote('X','FF-WORK'); 'ok'`);
    connect(A.ev, A.w, fold);
    chk(name, sc, UNREC(false), unrec(x), UNRECW(false));
    const m0 = LM.mark(); const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
    const pA = A.ev('saveInPlace()'); const okA = await until(() => (fold.hits.main || 0) > n0);
    const pB = B.ev('saveInPlace()'); const okB = await until(() => LM.pendingOf('orbit-save').includes('B'));
    live(B.ev); const t1 = B.ev('liveTick()'); await pause(5);
    chk(name, sc, 'tab A’s save holds the lock; B’s Save waits for it, and tick 1’s autosave waits behind that (a CONTROL)',
      J([okA, LM.heldBy('orbit-save'), okB && LM.pendingOf('orbit-save')]), J([true, ['A'], ['B']]));
    chk(name, sc, 'B counts both as under way (U20): its Save and the autosave queued behind it', B.ev('_saveBusy'), 2);
    await B.ev('liveTick()'); await pause(5);
    chk(name, sc, 'tick 2’s refresh during the wait records nothing', based(B.ev), 0);
    const w0 = omWrites(fold);
    g.open(); await pA; await pB; await t1; await pause(5);
    chk(name, sc, 'once A’s save lands: B’s Save and tick 1’s autosave asked; nothing written; and tick 1’s own refresh, nothing under way, recorded nothing',
      J([omWrites(fold) - w0, fold.note(2027, 'A'), asks(B.ev), B.ev('_saveBusy'), based(B.ev)]), J([0, 'F0', true, 0, 0]));
    await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'the next 💾 Save asks: nothing written, F0 still the folder’s copy, B-EDIT on screen', J([omWrites(fold) - w0, fold.note(2027, 'A'), scr(B.ev), asks(B.ev)]), J([0, 'F0', 'B-EDIT', true]));
    chk(name, sc, 'the lock was granted as asked and never held by two -- [grant order from tab A’s save, violations, most held at once, unmodelled, every grant let go, held now]' + GUARD,
      J([LM.grantOrder('orbit-save', m0), LM.stats.violations.length, LM.stats.maxHeld['orbit-save'], LM.stats.unmodeled.length, LM.stats.grants === LM.stats.releases, LM.heldBy('orbit-save')]),
      J([['A', 'B', 'B', 'B'], 0, 1, 0, true, []]));
  }
  // (5) CONTROLS. (5a) The screen exactly the folder's copy, nothing recorded (a browser that last saved to the folder before
  // v1.89, when no record was kept: Alice's other browser's storage, its record removed): the opening's own connect takes F0
  // as the base, as it always did; L-EDIT typed then; 💾 Save writes it with no question, F0 kept in the history. (5b) The
  // same, but the refresh comes while a save waits at its read of the folder: U13's rule holds -- nothing recorded, nothing
  // said -- and the save asks. (5c) The first save of a new board into an empty folder writes with no question, and records
  // it. (5d) An ordinary refresh with nothing unsaved loads a newer folder copy and records it; then a Save writes with no
  // question. (5e) With a copy recorded and a later one saved over it, Save asks in the words it always used.
  const legacy = async () => { const fold = folder(); const X = await other(fold, ['F0']); const ls = lsOf(X.ev); delete ls[X.ev('_AP.key') + '.base'];
    const B = await open(null, 'B', { html: F1, ls }); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`); return { B, fold }; };
  const LEGACY = 'F0 on screen, stamped as the folder’s copy is; nothing recorded; nothing changed in this session (a CONTROL)';
  const legacyv = (B, fold) => J([scr(B.ev), +B.ev('MS.ts') === headTs(fold), based(B.ev), B.ev('DIRTY')]);
  { const sc = '(5a) CONTROL: the screen exactly the folder’s copy, nothing recorded';
    const { B, fold } = await legacy();
    chk(name, sc, LEGACY, legacyv(B, fold), J(['F0', true, 0, false]));
    await B.ev('driveAutoConnect()'); await pause(5);
    chk(name, sc, 'the opening’s own connect takes F0 as the copy the work came from', based(B.ev) === headTs(fold) && headTs(fold) > 0, true);
    B.ev(`setNote('A','L-EDIT'); 'ok'`); await pause(5); const q0 = qs(B.ev).length; await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'L-EDIT typed; 💾 Save writes it with no question: the folder’s copy, saved, recorded against it; F0 in the folder’s history',
      J([qs(B.ev).length - q0, fold.note(2027, 'A'), unsaved(B.ev), based(B.ev) === headTs(fold), anywhere(fold, 'F0')]), J([0, 'L-EDIT', [false, false, false], true, true]));
  }
  { const sc = '(5b) CONTROL: the screen exactly the folder’s copy, nothing recorded; a refresh while a save waits at its read';
    const { B, fold } = await legacy();
    chk(name, sc, LEGACY, legacyv(B, fold), J(['F0', true, 0, false]));
    const gh = fold.dir.getFileHandle, g = gate(); let hit = 0;
    fold.dir.getFileHandle = async (n, o) => { if (!hit && n === 'spmt-2027-om.json' && !(o && o.create)) { hit = 1; await g.p; } return gh(n, o); };
    const p = B.ev('saveInPlace()'); const reached = await until(() => hit);
    const s0 = state(B.ev), st0 = status(B.ev); const r = await B.ev('driveStorePull(true)'); await pause(5);
    chk(name, sc, 'the refresh while the save waits at its read records nothing and says nothing -- [the save waits, a save under way, returned, nothing changed byte for byte, the status line as it was]',
      J([reached, B.ev('_saveBusy') > 0, r, state(B.ev) === s0, status(B.ev) === st0]), J([true, true, false, true, true]));
    const w0 = omWrites(fold); g.open(); await p; await pause(5);
    chk(name, sc, 'then the save, finding nothing recorded, asks: nothing written, F0 still the folder’s copy, the choice offered',
      J([omWrites(fold) - w0, fold.note(2027, 'A'), asks(B.ev)]), J([0, 'F0', true]));
  }
  { const sc = '(5c) CONTROL: the first save of a new board into an empty folder';
    const fold = folder(); const B = await open(null, 'B'); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    const c = await B.ev('driveAutoConnect()'); await pause(5);
    B.ev(`setNote('A','FIRST'); 'ok'`); await pause(5); const q0 = qs(B.ev).length; await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'the opening connected to an empty folder; 💾 Save writes FIRST with no question: the folder’s copy, saved, recorded against it',
      J([c, qs(B.ev).length - q0, fold.note(2027, 'A'), unsaved(B.ev), based(B.ev) === headTs(fold) && headTs(fold) > 0]), J([true, 0, 'FIRST', [false, false, false], true]));
    B.ev(`setNote('A','SECOND'); 'ok'`); await pause(5); await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'and the next 💾 Save writes SECOND with no question; FIRST in the folder’s history',
      J([qs(B.ev).length - q0, fold.note(2027, 'A'), anywhere(fold, 'FIRST')]), J([0, 'SECOND', true]));
  }
  { const sc = '(5d) CONTROL: an ordinary refresh with nothing unsaved';
    const fold = folder(); const B = await open(null, 'B'); connect(B.ev, B.w, fold);
    await other(fold, ['N']);
    chk(name, sc, 'N, saved by Alice’s other machine, newer than what is on screen; nothing unsaved, nothing recorded (a CONTROL)',
      J([fold.note(2027, 'A'), headTs(fold) > +B.ev('MS.ts'), B.ev('DIRTY'), based(B.ev)]), J(['N', true, false, 0]));
    const r = await B.ev('driveStorePull(true)'); await pause(5);
    chk(name, sc, 'the refresh loads N and records it; nothing kept aside', J([r, scr(B.ev), based(B.ev) === headTs(fold), B.ev(`localStorage.getItem(_AP.key+'.kept')`)]), J([true, 'N', true, null]));
    B.ev(`setNote('A','N-EDIT'); 'ok'`); await pause(5); const q0 = qs(B.ev).length; await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'N-EDIT typed; 💾 Save writes it with no question; N in the folder’s history', J([qs(B.ev).length - q0, fold.note(2027, 'A'), unsaved(B.ev), anywhere(fold, 'N')]), J([0, 'N-EDIT', [false, false, false], true]));
  }
  { const sc = '(5e) CONTROL: a copy recorded, and a later one saved over it by Alice’s other machine';
    const fold = folder(); const B = await open(null, 'B'); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    B.ev(`setNote('A','F0'); 'ok'`); await pause(5); await B.ev('saveInPlace()'); await pause(5);
    const f0 = based(B.ev); await other(fold, ['N']);
    B.ev(`setNote('A','B-EDIT'); 'ok'`); await pause(5);
    chk(name, sc, 'F0 saved and recorded; Alice’s other machine loaded it and saved N over it; B-EDIT typed after, unsaved (a CONTROL)',
      J([f0 > 0, based(B.ev) === f0, headTs(fold) > f0, fold.note(2027, 'A'), scr(B.ev), B.ev('DIRTY')]), J([true, true, true, 'N', 'B-EDIT', true]));
    const w0 = omWrites(fold); await B.ev('saveInPlace()'); await pause(5); const st = status(B.ev);
    chk(name, sc, '💾 Save asks, saying as before that theirs was saved after the copy the work came from -- [writes, the folder’s copy, the choice offered, after said, no record said]',
      J([omWrites(fold) - w0, fold.note(2027, 'A'), asks(B.ev), /^⛔ Alice saved O&M FY27 to the shared folder [^,]+, after the copy you are working from\. Nothing was written\. /.test(st), /no record/.test(st)]),
      J([0, 'N', true, true, false]));
  }
  // (6) A REOPEN WITH UNSAVED WORK, NO TIMER AND NO SECOND TAB: as (1), but the page is reopened first, so this session has
  // nothing unsaved (DIRTY false) and only this browser's record says so; the refresh is the opening's own connect, which
  // is not quiet. It used to take F0 as the copy B-EDIT came from, and the next Save wrote B-EDIT over it unasked; (6h), with
  // F00 kept minutes before, F0 was then kept only as a recent copy and the next Save removed it.
  for (const h0 of [false, true]) {
    const sc = '(6' + (h0 ? 'h' : '') + ') reopened with unsaved work: the opening’s own connect, then 💾 Save' + (h0 ? '; a history copy kept minutes before' : '');
    const x = await unrecorded(null, h0); const { fold } = x;
    chk(name, sc, UNREC(h0), unrec(x), UNRECW(h0));
    const C = await open(null, 'C', { html: F1, ls: lsOf(x.B.ev) }); connect(C.ev, C.w, fold); C.ev(`_liveCfg.folder='shared'; 'ok'`);
    await C.ev('driveAutoConnect()'); await pause(5);
    chk(name, sc, 'reopened: B-EDIT on screen, unsaved by this browser’s record, not by this session (a CONTROL) -- [on screen, DIRTY, the record]',
      J([scr(C.ev), C.ev('DIRTY'), unsaved(C.ev)[2]]), J(['B-EDIT', false, true]));
    chk(name, sc, 'the opening’s own connect records nothing', based(C.ev), 0);
    const w0 = omWrites(fold), q0 = qs(C.ev).length; await C.ev('saveInPlace()'); await pause(5);
    chk(name, sc, '💾 Save asks: nothing written, nothing asked in a dialog, F0 still the folder’s copy, the choice offered in the words for nothing recorded',
      J([omWrites(fold) - w0, qs(C.ev).length - q0, fold.note(2027, 'A'), asks(C.ev), UNSAID.test(status(C.ev))]), J([0, 0, 'F0', true, true]));
    await chooseMine(C, fold, sc, h0);
  }
  // (7) A BOARD SAVED TO ITS OWN FILE, SO NOTHING IS UNSAVED, THAT IS NOT THE FOLDER'S COPY: Alice's other machine saved F00
  // and F0 to the shared folder; B-EDIT was then typed and saved to the board file; the board then works out of the folder
  // and ↻ Refresh now finds F0, older than the screen. F0 was never on screen: it used to be taken as the copy B-EDIT came
  // from, and the next Save wrote B-EDIT over it unasked, F0 kept only as a recent copy.
  { const sc = '(7) a board saved to its own file, not the folder’s copy: ↻ Refresh now, then 💾 Save';
    const fold = folder(); await other(fold, ['F00', 'F0']);
    const B = await open(null, 'B'); const dk = W1H.disk(B.w, F1);
    B.ev(`setNote('A','B-EDIT'); 'ok'`); await pause(5); await B.ev('saveInPlaceFile()'); await pause(5);
    connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    chk(name, sc, 'B-EDIT saved to the board file, nothing unsaved; F0 the folder’s copy, older than the screen; F00 a spaced copy; nothing recorded (a CONTROL)',
      J([dk.writes, unsaved(B.ev), scr(B.ev), fold.note(2027, 'A'), headTs(fold) < +B.ev('MS.ts'), hist(fold), based(B.ev)]),
      J([1, [false, false, false], 'B-EDIT', 'F0', true, [['F00', false]], 0]));
    await B.ev('livePoll(false)'); await pause(5);
    chk(name, sc, '↻ Refresh now records nothing', based(B.ev), 0);
    const w0 = omWrites(fold); await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, '💾 Save asks: nothing written, F0 still the folder’s copy, the choice offered', J([omWrites(fold) - w0, fold.note(2027, 'A'), asks(B.ev)]), J([0, 'F0', true]));
    await chooseMine(B, fold, sc, true);
  }
  // (8) A BOARD FILE HANDED OVER, NEWER THAN THE FOLDER'S COPY. Alice's other machine saved F0 to the folder; a board file was
  // built after it and handed over. B opens that file in a browser with nothing recorded; the opening's own connect finds F0,
  // older than the screen, and records nothing (it is not what is on screen). B types B-EDIT: 💾 Save asks; B loads theirs
  // (B-EDIT kept aside), then ↶ Put back. The put-back line used to say Alice saved the folder's copy "after it" -- F0 was
  // saved before the file the work came from, and nothing recorded can tell either way; now it says so. (8c) CONTROL: with a
  // copy recorded (F0 saved by B, N saved over it by Alice's other machine), it says "saved after it", as it always did; and
  // (8d) CONTROL: work kept aside from a board file is put back with the words it always had, whatever the folder's record.
  // (9) The same as (8), with other work already kept aside: Load theirs is refused. It used to call F0 "a newer copy";
  // now "a copy", and "their copy was not loaded". (9c) CONTROL: with a copy recorded, "a newer copy", as it always did.
  const PUT_UNREC = /^↶ Put back the work kept aside on .+?\. 💾 Save will ask before it writes over the shared folder, which Alice saved; this browser has no record of which copy there, if any, this work came from\.$/;
  const PUT_REC = /^↶ Put back the work kept aside on .+?\. 💾 Save will ask before it writes over the shared folder, which Alice saved after it\.$/;
  const PUT_FILE = /^↶ Put back the work kept aside on .+?\. 💾 Save will ask before it writes over the saved file, which Bob saved after it\. What was on screen is kept aside in its place: put that back\.$/;
  const OCC = (a, b) => new RegExp('^⚠ Alice saved ' + a + ' to the shared folder \\(.+?\\), but this browser already keeps earlier work aside \\(kept .+?\\) and holds new work besides\\. '
    + 'Kept work is never replaced, so ' + b + ' copy was not loaded and nothing was lost\\. Deal with the kept work first: put it back · save it as a file · discard it\\.$');
  const OCC_UNREC = OCC('a copy', 'their'), OCC_REC = OCC('a newer copy', 'the newer');
  const keptA = ev => ev(`(function(){ var k=keptCopy(); if(!k) return '(none)'; try{ var s=JSON.parse(k.raw); return String(((s.years||{})['2027']||{}).notes.A||''); }catch(e){ return '?'; } })()`);
  const keepOther = ev => ev(`(function(){ var o=JSON.parse(JSON.stringify(MS)); o.years['2027'].notes.A='OLDER-KEPT'; return keepAside(o, {why:'file', by:'Bob', ts:1}, baseGet()); })()`);
  const handed = async () => { const fold = folder(); await other(fold, ['F0']); await pause(20);
    const FN = baseFile('Alice', KEY.alice);
    const B = await open(null, 'B', { html: FN }); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    const c = await B.ev('driveAutoConnect()'); await pause(5);
    const tF0 = headTs(fold), tN = +B.ev('MS.ts');
    B.ev(`setNote('A','B-EDIT'); 'ok'`); await pause(5);
    return { B, fold, c, tF0, tN }; };
  const HANDED = 'connected; F0 the folder’s copy, saved before the file B opened was stamped; B-EDIT on screen; nothing kept aside (a CONTROL)';
  const handedv = x => J([x.c, x.fold.note(2027, 'A'), x.tF0 > 0 && x.tF0 < x.tN, scr(x.B.ev), keptA(x.B.ev)]);
  const HANDEDW = J([true, 'F0', true, 'B-EDIT', '(none)']);
  const recorded = async () => { const fold = folder(); const B = await open(null, 'B'); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    B.ev(`setNote('A','F0'); 'ok'`); await pause(5); await B.ev('saveInPlace()'); await pause(5);
    const f0 = based(B.ev); await other(fold, ['N']);
    B.ev(`setNote('A','B-EDIT'); 'ok'`); await pause(5); return { B, fold, f0 }; };
  const RECORDED = 'F0 saved and recorded; Alice’s other machine saved N over it; B-EDIT typed after, unsaved (a CONTROL)';
  const recordedv = x => J([x.f0 > 0, based(x.B.ev) === x.f0, headTs(x.fold) > x.f0, x.fold.note(2027, 'A'), scr(x.B.ev), x.B.ev('DIRTY')]);
  const RECORDEDW = J([true, true, true, 'N', 'B-EDIT', true]);
  { const sc = '(8) a board file handed over, newer than the folder’s copy: 💾 Save; Load theirs; ↶ Put back';
    const x = await handed(); const { B, fold } = x;
    chk(name, sc, HANDED, handedv(x), HANDEDW);
    chk(name, sc, 'the opening’s own connect records nothing (the file is not the folder’s copy)', based(B.ev), 0);
    const w0 = omWrites(fold), q0 = qs(B.ev).length; await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, '💾 Save asks: nothing written, nothing asked in a dialog, F0 still the folder’s copy, the choice offered in the words for nothing recorded',
      J([omWrites(fold) - w0, qs(B.ev).length - q0, fold.note(2027, 'A'), asks(B.ev), UNSAID.test(status(B.ev))]), J([0, 0, 'F0', true, true]));
    await B.ev(`driveResolve('theirs')`); await pause(5);
    chk(name, sc, 'Load theirs: F0 on screen, B-EDIT kept aside', J([scr(B.ev), keptA(B.ev)]), J(['F0', 'B-EDIT']));
    const q1 = qs(B.ev).length; B.ev('keptPutBack()'); await pause(5); const said = status(B.ev);
    chk(name, sc, '↶ Put back, asked: B-EDIT on screen, nothing kept, nothing recorded -- [questions, on screen, kept, recorded]',
      J([qs(B.ev).length - q1, scr(B.ev), keptA(B.ev), based(B.ev)]), J([1, 'B-EDIT', '(none)', 0]));
    chk(name, sc, 'and it says Alice saved the folder’s copy, with no record of which copy the work came from -- never that she saved it after -- [the words, “saved after it” said]',
      J([PUT_UNREC.test(said), /saved after it/.test(said)]), J([true, false]));
    const w1 = omWrites(fold); await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'then 💾 Save asks again: nothing written; F0 the folder’s copy, B-EDIT on screen',
      J([omWrites(fold) - w1, asks(B.ev), fold.note(2027, 'A'), scr(B.ev)]), J([0, true, 'F0', 'B-EDIT']));
  }
  { const sc = '(8c) CONTROL: a copy recorded: 💾 Save; Load theirs; ↶ Put back';
    const x = await recorded(); const { B, fold } = x;
    chk(name, sc, RECORDED, recordedv(x), RECORDEDW);
    await B.ev('saveInPlace()'); await pause(5); await B.ev(`driveResolve('theirs')`); await pause(5);
    chk(name, sc, '💾 Save asked; Load theirs: N on screen, B-EDIT kept aside', J([scr(B.ev), keptA(B.ev)]), J(['N', 'B-EDIT']));
    B.ev('keptPutBack()'); await pause(5); const said = status(B.ev);
    chk(name, sc, '↶ Put back: B-EDIT on screen, recorded against F0 again; it says Alice saved the folder’s copy after it -- [on screen, recorded, the words]',
      J([scr(B.ev), based(B.ev) === x.f0, PUT_REC.test(said)]), J(['B-EDIT', true, true]));
  }
  { const sc = '(8d) CONTROL: work kept aside from a board file, nothing recorded for the folder: ↶ Put back';
    const fold = folder(); const B = await open(null, 'B'); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    B.ev(`setNote('A','B-EDIT'); 'ok'`); await pause(5); keepOther(B.ev);
    chk(name, sc, 'OLDER-KEPT kept aside from a board file Bob saved; B-EDIT on screen, unsaved; nothing recorded for the folder (a CONTROL)',
      J([keptA(B.ev), scr(B.ev), B.ev('DIRTY'), based(B.ev)]), J(['OLDER-KEPT', 'B-EDIT', true, 0]));
    B.ev('keptPutBack()'); await pause(5); const said = status(B.ev);
    chk(name, sc, '↶ Put back: OLDER-KEPT on screen, B-EDIT kept in its place; it says Bob saved the board file after it, as it always did -- [on screen, kept, the words]',
      J([scr(B.ev), keptA(B.ev), PUT_FILE.test(said)]), J(['OLDER-KEPT', 'B-EDIT', true]));
  }
  { const sc = '(9) the same, with other work already kept aside: Load theirs is refused';
    const x = await handed(); const { B, fold } = x;
    chk(name, sc, HANDED, handedv(x), HANDEDW);
    keepOther(B.ev); await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, 'other work kept aside; 💾 Save asks, nothing written -- [kept, asked, the folder’s copy]', J([keptA(B.ev), asks(B.ev), fold.note(2027, 'A')]), J(['OLDER-KEPT', true, 'F0']));
    await B.ev(`driveResolve('theirs')`); await pause(5); const said = status(B.ev);
    chk(name, sc, 'Load theirs refused: B-EDIT on screen, OLDER-KEPT still kept, F0 the folder’s copy', J([scr(B.ev), keptA(B.ev), fold.note(2027, 'A')]), J(['B-EDIT', 'OLDER-KEPT', 'F0']));
    chk(name, sc, 'and it calls F0 “a copy”, not “a newer copy” -- it was saved before the file the work came from -- [the words, “newer” said]',
      J([OCC_UNREC.test(said), /newer/.test(said)]), J([true, false]));
  }
  { const sc = '(9c) CONTROL: a copy recorded, other work already kept aside: Load theirs is refused';
    const x = await recorded(); const { B, fold } = x;
    chk(name, sc, RECORDED, recordedv(x), RECORDEDW);
    keepOther(B.ev); await B.ev('saveInPlace()'); await pause(5); await B.ev(`driveResolve('theirs')`); await pause(5); const said = status(B.ev);
    chk(name, sc, 'Load theirs refused: B-EDIT on screen, OLDER-KEPT still kept, N the folder’s copy; it calls N “a newer copy”, as it always did -- [on screen, kept, the folder’s copy, the words]',
      J([scr(B.ev), keptA(B.ev), fold.note(2027, 'A'), OCC_REC.test(said)]), J(['B-EDIT', 'OLDER-KEPT', 'N', true]));
  }
  // (10) ANOTHER YEAR. B's FY27 is saved and recorded; Alice's other machine saves FY28 (A28), which B never loaded. B types in
  // FY27 (unsaved), switches to FY28 -- rolled forward from what is on screen, so not A28 -- and presses ↻ Refresh now: A28
  // is older than the screen, and nothing is recorded for FY28. It used to be taken as the copy FY28 came from, and 💾 Save
  // wrote B's FY28 over A28 without asking. Now nothing is recorded, and 💾 Save asks.
  { const sc = '(10) another year: FY28 saved by Alice’s other machine, never loaded here; ↻ Refresh now on FY28, then 💾 Save';
    const fold = folder(); const B = await open(null, 'B'); connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);
    await B.ev('driveAutoConnect()'); await pause(5);
    B.ev(`setNote('A','B27'); 'ok'`); await pause(5); await B.ev('saveInPlace()'); await pause(5);
    const X = await open(null, 'X'); connect(X.ev, X.w, fold);
    X.ev(`switchYear(2028); setNote('A','A28'); 'ok'`); await pause(5); await X.ev('driveStorePush(false)'); await pause(5);
    B.ev(`setNote('A','B27-2'); 'ok'`); await pause(5); B.ev(`switchYear(2028); 'ok'`); await pause(5);
    const ts28 = () => { const j = fold.copy(2028); return j ? +((j.store && j.store.ts) || j.ts || 0) : 0; };
    const w28 = () => fold.log.filter(v => v === 'main:spmt-2028-om.json').length;
    chk(name, sc, 'FY27: B27 the folder’s copy and recorded; FY28: A28 the folder’s copy, older than B’s screen; B on FY28, not showing A28; nothing recorded for FY28 (a CONTROL)',
      J([fold.note(2027, 'A'), +B.ev('driveBaseOf(mySlug(), 2027)') === headTs(fold), fold.note(2028, 'A'), ts28() > 0 && ts28() < +B.ev('MS.ts'), +B.ev('MS.cur'), scr(B.ev) !== 'A28', based(B.ev)]),
      J(['B27', true, 'A28', true, 2028, true, 0]));
    await B.ev('livePoll(false)'); await pause(5);
    chk(name, sc, '↻ Refresh now on FY28 records nothing (A28 is not what is on screen)', based(B.ev), 0);
    const w0 = w28(), q0 = qs(B.ev).length; await B.ev('saveInPlace()'); await pause(5);
    chk(name, sc, '💾 Save on FY28 asks: nothing written to FY28, A28 still its copy, nothing asked in a dialog, the choice offered',
      J([w28() - w0, fold.note(2028, 'A'), qs(B.ev).length - q0, asks(B.ev)]), J([0, 'A28', 0, true]));
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (U30) ====

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
