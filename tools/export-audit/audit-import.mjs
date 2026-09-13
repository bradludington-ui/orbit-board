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
import { boot, seed } from './boot.mjs';

let failures = [];
const chk = (scenario, where, what, got, want) => {
  const ok = (typeof got === 'number' && typeof want === 'number')
    ? Math.abs(got - want) <= 0.005 : String(got) === String(want);
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
{
  const name = 'reorder';
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
}

// ── 2. a DIFFERENT SET of services: refused, and the board is untouched ─────────────────────────
{
  const name = 'different services';
  const { ev } = boot(); seed(ev, base());
  const before = JSON.stringify(dvec(ev));
  const st = theirState(['STOVL', 'USMC-C', 'USN'], [5000000, 4000000, 3000000]);
  const ok = ev(`applyStore(${JSON.stringify(st)}) !== false`);
  chk(name, 'guard', 'the import is refused', String(ok), 'false');
  chk(name, 'money', 'the board is exactly as it was', JSON.stringify(dvec(ev)), before);
}

// ── 3. no service list at all: caught on ARITY, which is the only tell left ─────────────────────
{
  const name = 'no service list';
  const { ev } = boot(); seed(ev, base());
  const before = JSON.stringify(dvec(ev));
  const st = { order: ['A'], alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [],
               discSvc: [1, 2, 3, 4, 5], mandSvc: [0, 0, 0, 0, 0] };   // five, not three
  const ok = ev(`applyStore(${JSON.stringify(st)}) !== false`);
  chk(name, 'guard', 'a differently-shaped state is refused', String(ok), 'false');
  chk(name, 'money', 'the board is exactly as it was', JSON.stringify(dvec(ev)), before);
}

// ── 4. the board's OWN state: silent, always ────────────────────────────────────────────────────
{
  const name = 'own state';
  const { ev } = boot(); seed(ev, base());
  const before = JSON.stringify(dvec(ev));
  const ok = ev(`applyStore(JSON.parse(JSON.stringify(MS))) !== false`);
  chk(name, 'guard', 'reloading this board’s own state is accepted', String(ok), 'true');
  chk(name, 'money', 'and changes nothing', JSON.stringify(dvec(ev)), before);
}

// ── 5. EXHAUSTIVENESS: no per-service vector may be left in the file's order ────────────────────
// Every vector is filled with the FILE's own service indices [0,1,2]. After a remap by name each
// one must read back as the map. A vector svcRemapState() forgot stays [0,1,2] and fails here --
// the oracle walks the state generically, so it does not share svcRemapState's list of what to fix.
{
  const name = 'exhaustive remap';
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
}

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
{
  const name = 'refusal is clean';
  const { ev } = boot(); seed(ev, base());
  const before = ev('JSON.stringify(MS)');
  const st = theirState(['STOVL', 'USMC-C', 'USN'], [5000000, 4000000, 3000000]);
  const r = ev(`applyStore(${JSON.stringify(st)})`);
  chk(name, 'guard', 'applyStore reports the refusal to its caller', String(r), 'false');
  chk(name, 'state', 'the store is byte-identical to before', ev('JSON.stringify(MS)'), before);
  chk(name, 'state', 'and the board still renders', ev('(render(), "ok")'), 'ok');
}

// ── 7. the service list hiding under a year ───────────────────────────────────────
// A teammate sends a STATE file, not a store. normalizeStore() nests it under years.<fy>, taking
// its dataPack down with it -- so a guard reading only raw.dataPack found nothing to compare and
// waved the file through. That is the commonest shape there is, and it was the shape that got past
// the first version of this guard.
{
  const name = 'pack under a year';
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
}


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
{
  const name = 'save → reopen';
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
}

// ══ the values most likely to be quietly mangled ════════════════════════════════════
// A whole-store comparison passes the moment both sides are equally wrong, so name the fields that
// would cost real money or real meaning and check them one at a time on the REOPENED board.
{
  const name = 'what survives';
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
}

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
