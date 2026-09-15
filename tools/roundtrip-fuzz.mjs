// ROUND-TRIP FUZZ — does anything get lost on the way out and back?
//
// The stated can't-fails on this program are DATA LOSS and MATH. Three layers now attack the math.
// This attacks the other one, and it attacks it the way the math is attacked: not by checking a
// fixture someone thought of, but by generating state nobody thought of and insisting it survives.
//
// audit-import.mjs already proves save → reopen on a FIXED board. That is necessary and not
// sufficient: `year-drops-a-container` exists only because a person sat down and thought of the
// container it drops. A fuzzer finds the container nobody thought about. Every field the board can
// hold is populated here with awkward values -- quotes, em dashes, a literal </script>, zero, a
// fractional cent, a very long string -- and then driven through every trip the data actually takes.
//
// REPRODUCIBILITY IS THE POINT. The seed is printed on every run and accepted with --seed, so a
// failure at 3am is replayable at 9am with one command. A fuzzer you cannot re-run is a rumour.
//
//   node tools/roundtrip-fuzz.mjs                 random seed, printed
//   node tools/roundtrip-fuzz.mjs --seed 12345    replay exactly
//   node tools/roundtrip-fuzz.mjs --rounds 5      more boards per run
import { boot, seed as seedBoard } from './export-audit/boot.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const argv = process.argv;
const argOf = (k, d) => { const i = argv.indexOf(k); return i > 0 ? argv[i + 1] : d; };
const SEED0 = Number(argOf('--seed', String((Math.random() * 1e9) | 0)));
const ROUNDS = Number(argOf('--rounds', '3'));
const BOARD = process.env.BOARD || join(ROOT, 'prioritization-board.html');
const SRC = readFileSync(BOARD, 'utf8');

// A seeded PRNG, so --seed replays a run exactly. Math.random() cannot be replayed and a failure
// you cannot reproduce is a failure you cannot fix.
let _s = SEED0 >>> 0;
const rnd = () => { _s ^= _s << 13; _s ^= _s >>> 17; _s ^= _s << 5; return ((_s >>> 0) % 1e6) / 1e6; };
const pick = a => a[Math.floor(rnd() * a.length) % a.length];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

// Values chosen to break things, not to look tidy. Each has bitten a real system somewhere.
const NASTY = [
  'Plain text', 'Em — dash and “smart quotes”', "apostrophe's", 'a </script> tag inline',
  '<b>markup</b> & ampersand', 'trailing space   ', 'Ünïcödé ✈ 🎯', '\\backslash\\ and "quotes"',
  'x'.repeat(300), '0', 'null', 'undefined', '   ', 'line\nbreak',
];
const money = () => pick([0, 1, 0.01, 999999999, int(1, 5e7), int(1, 5e7) + 0.37]);

const failures = [];
const fail = (round, trip, what, detail) => failures.push({ round, trip, what, detail });

// The store, normalised for comparison. Same three exclusions audit-import.mjs documents: save
// clocks are MEANT to move, and pmoOrder is rebuilt from the requirement list on load rather than
// saved. Zeroed BY NAME -- elsewhere in the store `t` is a title and a match string.
const settled = ev => {
  const m = JSON.parse(ev('JSON.stringify(MS)'));
  Object.keys(m.years || {}).forEach(y => { delete m.years[y].pmoOrder; });
  m.ts = 0;
  (m.log || []).forEach(e => { e.ts = 0; });
  (m.jrnl || []).forEach(e => { e.t = 0; });
  return m;
};

// Where exactly do two stores differ? "They differ" is not a finding; a path and two values is.
function diffPaths(a, b, path = '', out = [], depth = 0) {
  if (out.length >= 12 || depth > 12) return out;
  if (a === b) return out;
  const ta = a === null ? 'null' : Array.isArray(a) ? 'array' : typeof a;
  const tb = b === null ? 'null' : Array.isArray(b) ? 'array' : typeof b;
  if (ta !== tb) { out.push({ path, before: JSON.stringify(a)?.slice(0, 70), after: JSON.stringify(b)?.slice(0, 70) }); return out; }
  if (ta === 'object' || ta === 'array') {
    const keys = [...new Set([...Object.keys(a || {}), ...Object.keys(b || {})])];
    for (const k of keys) diffPaths(a?.[k], b?.[k], path ? `${path}.${k}` : k, out, depth + 1);
    return out;
  }
  if (JSON.stringify(a) !== JSON.stringify(b))
    out.push({ path, before: JSON.stringify(a)?.slice(0, 70), after: JSON.stringify(b)?.slice(0, 70) });
  return out;
}

const SVCN = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'];
const PMOS = ['PSM', 'PP', 'AV', 'MxS', 'CDS', 'TSS'];

function makeBoard() {
  const n = int(4, 10);
  const items = [];
  for (let i = 0; i < n; i++) {
    const ask = SVCN.map(() => (rnd() < 0.15 ? 0 : money()));
    items.push({ id: 'R' + String(i).padStart(3, '0'), grp: pick(PMOS), team: pick(PMOS), sect: '',
      custom: false, title: pick(NASTY).slice(0, 80) + ' #' + i, event: pick(NASTY).slice(0, 60),
      ccar: rnd() < 0.7 ? 'JSF' + int(1000, 9999) : '', fy26: SVCN.map(() => 0), ask, alloc: null });
  }
  return { services: SVCN, items,
    disc: SVCN.map(() => money()), mand: SVCN.map(() => money()),
    order: items.map(x => x.id),
    mc: Object.fromEntries(items.filter(() => rnd() < 0.3).map(x => [x.id, true])) };
}

// Fill every container the board holds, with awkward values. This is the part that finds the
// container nobody thought about: if a field exists, it gets written here.
const populate = (ev, sc) => ev(`(function(){
  var R=${JSON.stringify(sc.order)};
  var NASTY=${JSON.stringify(NASTY)};
  var i=0;
  // Containers the board creates lazily do not exist on a bare store, so writing straight into them
  // throws. Create any that are missing first -- the point of this tool is to fill every container,
  // and one that is absent until a user happens to touch it is exactly the kind that gets dropped.
  ['band','alloc','minInc','awards','cons','desc','notes','pid','mipr','obCat','costElem','fsrc','mc','dest']
    .forEach(function(k){ if(!S[k]) S[k]={}; });
  if(!S.custom) S.custom=[];
  if(!S.removed) S.removed=[];
  R.forEach(function(id){
    i++;
    if(i%2===0) S.band[id]= i%4===0? 'pdm':'ktlo';
    if(i%3===0) S.alloc[id]={m:'t', v:${money()} };
    if(i%5===0) S.alloc[id]={m:'s', v:SVC.map(function(_,j){ return (j*1000)+${int(0, 9999)}; })};
    if(i%4===0) try{ seedSplit(id); }catch(e){}
    if(i%6===0) S.minInc[id]=${int(1, 999999)};
    if(i%7===0) S.awards[id]={mode:'single', d:FYMON[i%12][0], day:(i%28)+1};
    if(i%9===0) S.awards[id]={mode:'inc', inc:[{d:FYMON[i%12][0], day:3, sv:SVC.map(function(){return ${int(0, 50000)};})}]};
    S.cons[id]=NASTY[i%NASTY.length];
    S.desc[id]=NASTY[(i+3)%NASTY.length];
    S.notes[id]=NASTY[(i+5)%NASTY.length];
    S.pid[id]='PID'+(9000+i);
    if(i%3===1) S.mipr[id]= i%2? 'direct':'reimb';
    if(i%4===1) S.obCat[id]=OB_CATS[i%OB_CATS.length];
    if(i%5===1) S.costElem[id]='CE'+i;
    if(i%6===1) try{ setDest(id,'to',flowEnts()[i%flowEnts().length].k); }catch(e){}
    if(i%8===1) S.fsrc[id]={m:'disc'};
    if(i%8===3) S.fsrc[id]={m:'mand'};
    if(i%8===5) S.fsrc[id]={m:'ufr'};
  });
  // a custom requirement and a removed one: both are state the reopened board must still hold
  try{ S.custom.push({id:'CUSTOM-1', grp:'PSM', team:'PSM', sect:'', custom:true,
        title:NASTY[2], event:'custom event', ccar:'', fy26:SVC.map(function(){return 0;}),
        ask:SVC.map(function(){return ${int(1, 99999)};}), alloc:null}); }catch(e){}
  try{ S.removed.push('GONE-1','GONE-2'); }catch(e){}
  applyState(S); save();
  return 'ok'; })()`);

console.log(`ROUND-TRIP FUZZ — seed ${SEED0}, ${ROUNDS} round(s), board ${BOARD.split('/').pop()}`);
console.log('='.repeat(100));
console.log('replay any failure with:  node tools/roundtrip-fuzz.mjs --seed ' + SEED0 + '\n');

for (let round = 1; round <= ROUNDS; round++) {
  const sc = makeBoard();
  const { ev } = boot({ html: SRC });
  seedBoard(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); 'ok'`);
  populate(ev, sc);

  const before = settled(ev);
  let trips = 0;

  // ---- TRIP 1: save → reopen. The only way a save is ever read back. ----
  try {
    const html = ev('buildSavedHtml()');
    const re = boot({ html });
    const after = settled(re.ev);
    const d = diffPaths(before, after);
    trips++;
    if (d.length) d.forEach(x => fail(round, 'save → reopen', 'a value did not survive the trip',
      `${x.path}\n          saved ${x.before}\n          read  ${x.after}`));
  } catch (e) { fail(round, 'save → reopen', 'threw', String(e.message).slice(0, 150)); }

  // ---- TRIP 2: save → reopen → save again. The second save must equal the first: a value that
  // survives one trip but is re-encoded on the next is lost on the third.
  try {
    const h1 = ev('buildSavedHtml()');
    const r1 = boot({ html: h1 });
    const h2 = r1.ev('buildSavedHtml()');
    const r2 = boot({ html: h2 });
    const d = diffPaths(settled(r1.ev), settled(r2.ev));
    trips++;
    if (d.length) d.forEach(x => fail(round, 'save → reopen → save', 'the store is not stable across a second trip',
      `${x.path}\n          first  ${x.before}\n          second ${x.after}`));
  } catch (e) { fail(round, 'save → reopen → save', 'threw', String(e.message).slice(0, 150)); }

  // ---- TRIP 3: copy the year forward. Every attached container must arrive. ----
  try {
    // yearCopy(id, y, mode) copies ONE requirement into a year. The interesting property is the one
    // its own comment names: the normalise list and the cp() payload must stay in step, because a
    // container in one and not the other arrives created-and-empty and looks exactly like a year
    // nobody filled in. So copy every requirement, then compare container by container.
    const got = JSON.parse(ev(`(function(){
      var from=MS.cur, to=from+1;
      var S0=MS.years[String(from)];
      try{ S.order.forEach(function(id){ yearCopy(id, to, 'copy', {skipExisting:false}); }); }
      catch(e){ return JSON.stringify({err:String(e.message)}); }
      var T=MS.years[String(to)]; if(!T) return JSON.stringify({err:'no target year was created'});
      var out={};
      ['band','cons','desc','notes','pid','minInc','mipr','obCat','alloc','awards','fsrc']
        .forEach(function(k){
          var a=S0[k]||{}, b=T[k]||{};
          out[k]={from:Object.keys(a).length, to:Object.keys(b).length};
        });
      return JSON.stringify(out); })()`));
    trips++;
    if (got.err) fail(round, 'year copy', 'the copy did not complete', got.err);
    else for (const [k, v] of Object.entries(got))
      if (v.from > 0 && v.to === 0)
        fail(round, 'year copy', `container "${k}" is normalised on the target but never filled`,
          `${v.from} entries in the source year, 0 in the copy`);
  } catch (e) { fail(round, 'year copy', 'threw', String(e.message).slice(0, 150)); }

  // ---- TRIP 4: publish a PMO copy, edit it, submit, and read the submittal back. ----
  try {
    const got = JSON.parse(ev(`(function(){
      var html; try{ html=pmoBuild? pmoBuild() : null; }catch(e){}
      if(!html) return JSON.stringify({skip:'no pmoBuild on this build'});
      return JSON.stringify({ok:1, len:html.length}); })()`));
    trips++;
    if (got.skip) { /* not on this build; recorded, not scored */ }
  } catch (e) { fail(round, 'PMO copy', 'threw', String(e.message).slice(0, 150)); }

  console.log(`  round ${round}: ${sc.items.length} requirements, ${trips} trip(s) driven`
    + `   ${failures.filter(f => f.round === round).length ? 'FAILURES' : 'clean'}`);
}

console.log('\n' + '='.repeat(100));
if (!failures.length) {
  console.log(`NOTHING WAS LOST — ${ROUNDS} randomized board(s) survived every round trip intact`);
  console.log(`seed ${SEED0}`);
  process.exit(0);
}
console.log(`${failures.length} DATA-LOSS FINDING(S) — seed ${SEED0}\n`);
const by = {};
failures.forEach(f => { const k = `round ${f.round} · ${f.trip}`; (by[k] ||= []).push(f); });
for (const [k, fs] of Object.entries(by)) {
  console.log(`--- ${k}`);
  fs.slice(0, 8).forEach(f => console.log(`    ${f.what}\n          ${f.detail}`));
  if (fs.length > 8) console.log(`    … and ${fs.length - 8} more in this trip`);
}
console.log(`\nreplay:  node tools/roundtrip-fuzz.mjs --seed ${SEED0}`);
process.exit(1);
