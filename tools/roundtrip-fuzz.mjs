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
// WHICH CONTAINERS EXIST IS READ FROM THE BOARD, NOT LISTED HERE. The first version of this file
// carried a hand-written list of fourteen containers under a comment saying "if a field exists, it
// gets written here". By the time anyone looked, the board wrote fifty-two -- the PMO reassignment
// overlay, the typed record fields, the six CLIN containers, the accounting keys -- and the fuzz had
// been passing for days while a value lost from any of them would have gone unnoticed. So the set
// of containers is scanned out of the board's own source, every one of them has to be non-empty
// after the populate step, and a container that is not is a FAILURE of this tool, not a pass. A
// container that genuinely cannot be filled is excused by name, with the reason, in EXCUSED below --
// and an excuse for a container the board no longer writes fails too, so the list cannot rot.
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
const BOARD = process.env.BOARD || join(ROOT, 'prioritization-board-grid.html');
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

// ── WHAT THE BOARD WRITES ──────────────────────────────────────────────────────────────────────
// Every `S.<key> =`, `S.<key>[…]`, `S.<key>.push(` and `S.<key>.splice(` in the board, scanned from
// its source with comment lines skipped (one comment says `if(!S.x) S.x={}` by way of example, and
// `x` is not a container). The applyState() normalise list is NOT the source of truth: mipr, obCat,
// aceMap, whatif, upl, rcnAsg, budgetAsg and all six clin* containers are created lazily inside their
// own setters and never appear there, which is exactly how they were missed the first time.
const WRITTEN = (() => {
  const out = new Set();
  const re = /(?:^|[^A-Za-z0-9_$.])S\.([a-zA-Z][a-zA-Z0-9]*)\s*(?:=[^=]|\[|\.push\(|\.splice\()/g;
  for (const line of SRC.split('\n')) {
    if (/^\s*\/\//.test(line)) continue;
    let m; while ((m = re.exec(line))) out.add(m[1]);
  }
  return out;
})();

// Containers the fuzz does not fill, each with the reason. An entry here for a key the board no
// longer writes is itself a failure -- the same rule money-coverage applies to its recorded gaps.
const EXCUSED = {
  pmoOrder: 'rebuilt from the requirement list on every load and dropped by settled(); a value put here would be discarded by design, not lost',
};

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
    // A PRIME- id is what marks a prime contract on this board (applyState seeds ptype from it), and
    // the CLIN grid, the what-if model and the prime-only record fields only exist for one. Without a
    // prime on the board those containers have nothing to hang off and could never be filled.
    const id = (i % 3 === 0 ? 'PRIME-' : 'R') + String(i).padStart(3, '0');
    items.push({ id, grp: pick(PMOS), team: pick(PMOS), sect: '',
      custom: false, title: pick(NASTY).slice(0, 80) + ' #' + i, event: pick(NASTY).slice(0, 60),
      ccar: rnd() < 0.7 ? 'JSF' + int(1000, 9999) : '', fy26: SVCN.map(() => 0), ask, alloc: null });
  }
  // The two buy lines. With DATA.buys set, applyState seats BUY-AC and BUY-ENG at the top of the
  // order on first load; without items behind those ids the reopen's order filter would strip them
  // and the fuzz would report a loss the board did not commit.
  ['BUY-AC', 'BUY-ENG'].forEach(id => items.push({ id, grp: 'BOP', team: 'BOP', sect: '', custom: false,
    title: id + ' buy line', event: 'buy', ccar: '', fy26: SVCN.map(() => 0), ask: SVCN.map(() => 0), alloc: null }));
  return { services: SVCN, items,
    disc: SVCN.map(() => money()), mand: SVCN.map(() => money()),
    order: items.map(x => x.id),
    mc: Object.fromEntries(items.filter(() => rnd() < 0.3).map(x => [x.id, true])) };
}

// Fill every container the board holds, with awkward values. This is the part that finds the
// container nobody thought about -- and the check after it is what makes "every" mean every.
const populate = (ev, sc) => ev(`(function(){
  var R=${JSON.stringify(sc.order)};
  var NASTY=${JSON.stringify(NASTY)};
  var i=0;
  // Containers the board creates lazily do not exist on a bare store, so writing straight into them
  // throws. Create any that are missing first -- the point of this tool is to fill every container,
  // and one that is absent until a user happens to touch it is exactly the kind that gets dropped.
  ['band','alloc','minInc','awards','cons','desc','notes','pid','mipr','obCat','costElem','fsrc','mc',
   'dest','grp','asks','ccar','recNames','titles','wbs','ptype','rcnAsg','rcnSvc','clinRcn','clinRcnSvc','si',
   'budgetAsg','crHalf','clinAlloc','clinMeta','clinNew','clinRm','clinWbs','aceMap','upl','buys']
    .forEach(function(k){ if(!S[k] || typeof S[k]!=='object' || Array.isArray(S[k])) S[k]={}; });
  if(!S.custom) S.custom=[];
  if(!S.removed) S.removed=[];
  if(!Array.isArray(S.reprog)) S.reprog=[];
  if(!S.whatif || typeof S.whatif!=='object') S.whatif={a:{}, b:{}};
  if(!S.bm) S.bm={disc:S.discSvc.slice(), mand:S.mandSvc.slice(), adds:[]};
  if(!Array.isArray(S.bm.adds)) S.bm.adds=[];
  var vec=function(seed){ return SVC.map(function(_,j){ return (j*1000)+seed; }); };
  R.forEach(function(id){
    i++;
    var it=itemById(id);
    if(i%2===0) S.band[id]= i%4===0? 'pdm':'ktlo';
    if(i===1) S.mc[id]=true;                       // the fixture stars at random and may star nobody
    if(i%3===0) S.alloc[id]={m:'t', v:${money()} };
    if(i%5===0) S.alloc[id]={m:'s', v:vec(${int(0, 9999)})};
    if(i%4===0) try{ seedSplit(id); }catch(e){}
    // Cadenced writes miss entirely on a small board (a 5-requirement round never reaches i%7),
    // and an empty container is a container whose loss cannot be seen -- so the first requirement
    // takes every field, and the cadence only decides who else does.
    if(i%6===0 || i===1) S.minInc[id]=${int(1, 999999)};
    if(i%7===0 || i===1) S.awards[id]={mode:'single', d:FYMON[i%12][0], day:(i%28)+1};
    if(i%9===0) S.awards[id]={mode:'inc', inc:[{d:FYMON[i%12][0], day:3, sv:SVC.map(function(){return ${int(0, 50000)};})}]};
    // v1.95 (item 53): an award repaired on opening carries the record as it was saved (fix) and its marks (fx);
    // both are data, and every trip below must carry them
    if(i===2) S.awards[id]={mode:'inc', inc:[{d:FYMON[1][0], day:4, sv:SVC.map(function(_,j){ return 1000*(j+1); }), fx:'split'}],
      fix:{orig:JSON.stringify({mode:'inc', inc:[{d:FYMON[1][0], day:4, sv:[SVC.length*1000]}]}), how:'split', n:[NASTY[2]+' — an inferred split'], at:1700000000000}};
    S.cons[id]=NASTY[i%NASTY.length];
    S.desc[id]=NASTY[(i+3)%NASTY.length];
    S.notes[id]=NASTY[(i+5)%NASTY.length];
    S.pid[id]='PID'+(9000+i);
    if(i%3===1) S.mipr[id]= i%2? 'direct':'reimb';
    if(i%4===1) S.obCat[id]=OB_CATS[i%OB_CATS.length];
    if(i%5===1) S.costElem[id]='CE'+i;
    if(i%6===1) try{ setDest(id,'to',flowEnts()[i%flowEnts().length].k); }catch(e){}
    // the second hop as well as the first: the ultimate recipient of an OGC
    if(i%6===1 && S.dest[id]) S.dest[id].end=NASTY[(i+1)%NASTY.length].slice(0,40);
    if(i%8===1) S.fsrc[id]={m:'disc'};
    if(i%8===3) S.fsrc[id]={m:'mand'};
    if(i%8===5) S.fsrc[id]={m:'ufr'};
    // THE PMO REASSIGNMENT OVERLAY. An office the configured list does not hold is dropped on load
    // by design, so pick from GROUPS -- and pick one the requirement is NOT homed to, or the write
    // is the identity and proves nothing.
    if(i%2===1 && it && GROUPS.length>1){
      var g=GROUPS[(GROUPS.indexOf(it.grp)+1)%GROUPS.length]; if(g!==it.grp) S.grp[id]=g; }
    // the typed record fields
    if(i%2===0) S.asks[id]=vec(${int(1, 99999)});
    if(i%3===2) S.ccar[id]='JSF'+(1000+i);
    if(i%3===0) S.recNames[id]=NASTY[(i+7)%NASTY.length];
    if(i%4===2) S.titles[id]=NASTY[(i+9)%NASTY.length];
    if(i%2===0) S.wbs[id]=[{w:'1.2.'+i, v:[]}];
    if(i%5===2) S.ptype[id]= i%2? 'PRIME':'OGC';
    // A Navy SI code outside the board's own list is DROPPED on load by applyState, by design; the
    // fuzz writes a real one, because a discarded invalid value is normalisation, not loss.
    if(i%3===1) S.si[id]=['LA','EN','OT','FL','AT'][i%5];
    // the accounting keys: which RCN/EEIC funds it, per service, and per CLIN
    if(i%4===3) S.rcnAsg[id]='RCN-'+i;
    if(i%5===3){ S.rcnSvc[id]={}; S.rcnSvc[id][SVC[i%SVC.length]]='RCN-S'+i; }
    if(i%6===3){ S.clinRcn[id]={}; S.clinRcn[id]['n'+i]='RCN-C'+i; }
    // v1.98 (item 83): a service on a CLIN that differs, filed by the service's name
    if(i%6===4){ S.clinRcnSvc[id]={}; S.clinRcnSvc[id]['n'+i]={}; S.clinRcnSvc[id]['n'+i][SVC[i%SVC.length]]='RCN-CS'+i; }
    if(i%4===1){ S.budgetAsg[id]={}; S.budgetAsg[id][SVC[i%SVC.length]]='BAE FY'+(27+i%3); }
    if(i%3===2){ S.crHalf[id]={}; S.crHalf[id][FYMON[i%12][0]]=1; }
    // the confirmed tie to the cost estimate, and the UPL mark (keyed 'r|<id>', not the bare id)
    if(i%5===4) S.aceMap[id]={w:['1.1.'+i], ok:i%2===0};
    if(i%7===2) S.upl['r|'+id]=1;
    // THE CLIN GRID, six containers, all keyed by the prime's id
    if(it && /^PRIME/.test(id)){
      S.clinAlloc[id]={}; S.clinAlloc[id]['n'+i]=vec(${int(0, 9999)});
      S.clinMeta[id]={}; S.clinMeta[id]['n'+i]={ask:vec(${int(1, 9999)}), desc:NASTY[i%NASTY.length]};
      S.clinNew[id]=[{key:'n'+i, clin:'30'+(10+i), desc:NASTY[(i+2)%NASTY.length].slice(0,140), ccar:'', ask:vec(${int(1, 9999)})}];
      S.clinRm[id]=['0001'];
      S.clinWbs[id]={}; S.clinWbs[id]['n'+i]=[{w:'4.5.'+i, v:[]}];
      // the what-if model: a level per prime, in each of the two plans
      S.whatif.a[id]=${int(0, 400)}; S.whatif.b[id]=${int(0, 400)};
    }
  });
  // board-level state: the nominated absorber and its floor, the ATR/BTR log, a buy line, an added
  // funding source on the budget
  S.absorb=R[R.length-1]; S.absorbFloor=${int(1, 999999)};
  S.reprog.push({ts:1, kind:'ATR', from:R[0], to:R[1]||R[0], v:${int(1, 99999)}, note:NASTY[${int(0, 13)}]});
  // The buy lines are keyed ac/eng on the board and normalised to that shape on load.
  S.buys.ac={base:vec(1), adj:vec(2), cost:vec(3), locked:true};
  S.buys.eng={base:vec(4), adj:vec(5), cost:vec(6), locked:false};
  // THE ONE-TIME SEEDS. applyState sets bopSeeded, zeroSeeded, ceSeeded and buysSeeded only when the
  // payload carries the feature, so the fixture carries all four; the flags are then real state that
  // a save has to bring back, and a reopen that lost one would re-run its seed and move the order.
  DATA.bopFirst=true; DATA.zeroBottom=true; DATA.costElems=true; DATA.buys=true;
  S.bm.adds.push({name:NASTY[${int(0, 13)}].slice(0,40), pool:'disc', vec:vec(${int(1, 9999)})});
  // a custom requirement and a removed one: both are state the reopened board must still hold
  try{ S.custom.push({id:'CUSTOM-1', grp:'PSM', team:'PSM', sect:'', custom:true,
        title:NASTY[2], event:'custom event', ccar:'', fy26:SVC.map(function(){return 0;}),
        ask:SVC.map(function(){return ${int(1, 99999)};}), alloc:null}); }catch(e){}
  try{ S.removed.push('GONE-1','GONE-2'); }catch(e){}
  applyState(S); save();
  return 'ok'; })()`);

// ── IS EVERYTHING FILLED? ──────────────────────────────────────────────────────────────────────
// Read the store after populate() and applyState() have run, and name every container the board
// writes that is still empty. Absent counts as empty: a lazily-created container the fuzz never
// touched is not there at all, which is the case that slipped through before.
const emptyContainers = ev => {
  const filled = new Set(JSON.parse(ev(`JSON.stringify(Object.keys(S).filter(function(k){
    var v=S[k];
    if(v===null||v===undefined) return false;
    if(Array.isArray(v)) return v.length>0;
    if(typeof v==='object') return Object.keys(v).length>0;
    if(typeof v==='string') return v.length>0;
    if(typeof v==='number') return v!==0;
    return true; }))`)));
  return [...WRITTEN].filter(k => !filled.has(k) && !EXCUSED[k]).sort();
};

// The year-copy normalise list, read from the board rather than repeated here. Its own comment says
// that list and the cp() payload must stay in step; TRIP 3 checks every container on it, so a
// container added there without a cp() fails here the first night. Since v1.89 it is REQ_MAPS, the
// one list of what a year keeps per requirement, which delete and move-to-year purge as well.
const YEAR_CONTAINERS = (() => {
  const m = /const REQ_MAPS=(\[[^\]]*\]);/.exec(SRC);
  if (!m) throw new Error('could not find REQ_MAPS, the per-requirement container list, in the board — its shape changed');
  return JSON.parse(m[1].replace(/'/g, '"').replace(/,\s*\]/, ']'));
})();

console.log(`ROUND-TRIP FUZZ — seed ${SEED0}, ${ROUNDS} round(s), board ${BOARD.split('/').pop()}`);
console.log('='.repeat(100));
console.log('replay any failure with:  node tools/roundtrip-fuzz.mjs --seed ' + SEED0);
console.log(`the board writes ${WRITTEN.size} state container(s); ${Object.keys(EXCUSED).length} excused by name; yearCopy carries ${YEAR_CONTAINERS.length}\n`);

// An excuse for a container the board no longer writes is stale, and stale excuses are how a list
// like this rots. Fail before any round runs.
for (const k of Object.keys(EXCUSED))
  if (!WRITTEN.has(k)) fail(0, 'excuses', `"${k}" is excused but the board no longer writes it`, 'strike it from EXCUSED');

for (let round = 1; round <= ROUNDS; round++) {
  const sc = makeBoard();
  const { ev } = boot({ html: SRC });
  ev(`URL.createObjectURL=function(){ return 'blob:x'; }; URL.revokeObjectURL=function(){}; 'ok'`);
  seedBoard(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); 'ok'`);
  populate(ev, sc);

  // ---- TRIP 0: is every container the board writes actually filled? A container this tool does
  // not fill is a container whose loss it can never see, so an empty one fails the run.
  const empty = emptyContainers(ev);
  if (empty.length) fail(round, 'populate', `${empty.length} container(s) the board writes are never filled by this fuzz`,
    empty.join(', ') + '\n          fill each in populate(), or excuse it by name in EXCUSED with the reason');

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

  // ---- TRIP 1b: the saved file passes the import door (v1.88). Every container filled with awkward
  // values -- quotes, markup, a literal </script>, a long string -- is exactly what a genuine board can
  // write, and inboundCheck() must never refuse what a board writes: a file it refused would be a board
  // that cannot come back in. The same holds for the PMO copy made from it.
  try {
    const why = ev('inboundCheck(buildSavedHtml())');
    trips++;
    if (why) fail(round, 'import door', 'the board\'s own saved file was refused at the door', why);
    const copy = ev(`(function(){ try{ return pmoCopyHtml({sandbox:true, pmo:'PSM'}); }catch(e){ return ''; } })()`);
    if (copy) { const w2 = ev(`inboundCheck(${JSON.stringify(copy)})`); if (w2) fail(round, 'import door', 'a PMO copy of it was refused at the door', w2); }
  } catch (e) { fail(round, 'import door', 'threw', String(e.message).slice(0, 150)); }

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
    // nobody filled in. So copy every requirement, then compare container by container -- every
    // container on yearCopy's own list, not a subset chosen here.
    const got = JSON.parse(ev(`(function(){
      var from=MS.cur, to=from+1;
      var S0=MS.years[String(from)];
      try{ S.order.forEach(function(id){ yearCopy(id, to, 'copy', {skipExisting:false}); }); }
      catch(e){ return JSON.stringify({err:String(e.message)}); }
      var T=MS.years[String(to)]; if(!T) return JSON.stringify({err:'no target year was created'});
      var out={};
      ${JSON.stringify(YEAR_CONTAINERS)}.forEach(function(k){
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

  // ---- TRIP 4: publish a PMO copy, edit every contributable field on it, submit, and take the
  // submittal on the portfolio board. What the office typed must be what the reviewer is shown.
  // The first version of this trip called a function that did not exist and took the 'not on this
  // build' branch every time -- it had never scored anything. This one edits, packages the way the
  // button packages, takes the way the import takes, and reads the review rows back.
  try {
    // The copy is built exactly as publishPmoCopy() builds it: the whole board with pubMode set.
    // String.raw, because a plain template literal eats the regex's backslashes.
    const copyHtml = ev(String.raw`(function(){
      const mode={sandbox:true, by:'FUZZ', ts:Date.now(), fy:MS.cur, ap:APPN, base:pmoBaseline()};
      return buildSavedHtml().replace(/(<script type="application\/json" id="pubMode">)[\s\S]*?(<\/script>)/,
        function(m,a,b){ return a + JSON.stringify(mode).replace(/</g,'\\u003c') + b; }); })()`);
    const P = boot({ html: copyHtml });
    P.ev(`URL.createObjectURL=function(){ return 'blob:x'; }; URL.revokeObjectURL=function(){}; 'ok'`);
    if (P.ev('String(SANDBOX)') !== 'true') throw new Error('the published copy did not boot as a sandbox');
    // The office: whichever one owns the most requirements on the copy, read through grpOf() so
    // the reassignment overlay from populate() is what decides ownership -- scope and overlay are
    // exercised together, which is how they meet on a real board.
    const office = P.ev(`(function(){ var c={}; S.order.forEach(function(id){ var it=itemById(id);
      if(it){ var g=grpOf(it); c[g]=(c[g]||0)+1; } });
      return Object.keys(c).sort(function(a,b){ return c[b]-c[a]; })[0]||''; })()`);
    if (!office) throw new Error('no office owns a requirement on the copy');
    // Type into every contributable field of every requirement that office owns. The values are
    // read back from the copy through pmoVal() -- what the copy HOLDS is the contract, not the raw
    // literal, because the board's own normalisation (whole dollars, strings) is applied on the
    // way in and the same rule on the other end must agree with it.
    const typed = JSON.parse(P.ev(`(function(){
      try{ localStorage.setItem('prio27who','Fuzz Lead'); localStorage.setItem('prio27pmo',${JSON.stringify(office)}); }catch(e){}
      var NASTY=${JSON.stringify(NASTY)}; var out={}; var i=0;
      S.order.forEach(function(id){ var it=itemById(id); if(!it || grpOf(it)!==${JSON.stringify(office)}) return;
        i++;
        S.desc[id]=NASTY[(i+1)%NASTY.length]+' edited';
        S.cons[id]=NASTY[(i+4)%NASTY.length]+' edited';
        S.notes[id]=NASTY[(i+6)%NASTY.length]+' edited';
        S.asks[id]=SVC.map(function(_,j){ return 1000*(j+1)+i; });
        S.ccar[id]='JSF'+(5000+i);
        S.pid[id]='PID'+(7000+i);
        S.recNames[id]=NASTY[(i+8)%NASTY.length]+' edited';
        // flipped against the baseline, or a requirement already 'direct' would be retyped as
        // 'direct' and correctly not sent -- which the first run of this trip mistook for loss
        var was=((PMODE&&PMODE.base)||{})[id]||{};
        S.mipr[id]= was.mipr==='direct'? 'reimb':'direct';
        out[id]={};
        PMO_KEYS.forEach(function(k){ out[id][k]=pmoVal(S,k,id); });
      });
      save(); return JSON.stringify(out); })()`));
    const edited = Object.keys(typed);
    // The baseline the copy was published with: the package carries a field only where the copy's
    // value differs from it. That is the contract -- a package that re-sent unchanged fields would
    // overwrite the portfolio board's own later edits on apply.
    const baseline = JSON.parse(P.ev(`JSON.stringify((PMODE&&PMODE.base)||{})`));
    const changed = (id, k) => {
      const b = (baseline[id] || {})[k];
      return JSON.stringify(typed[id][k]) !== JSON.stringify(b === undefined ? null : b);
    };
    if (!edited.length) throw new Error(`office ${office} owns no requirement on the copy`);
    // Package the way the button packages: pmoSubmit() writes a Blob; capture it.
    const wire = JSON.parse(P.ev(`(function(){ var cap=null; var _B=window.Blob;
      window.Blob=function(parts,opts){ cap=parts&&parts[0]; return new _B(parts,opts); };
      try{ pmoSubmit(); }catch(e){ return JSON.stringify({err:String(e.message)}); }
      window.Blob=_B; return cap||'null'; })()`));
    if (!wire || wire.err) throw new Error('pmoSubmit did not build a package' + (wire && wire.err ? ': ' + wire.err : ''));
    trips++;
    // Every field the copy CHANGED is in the package with the value the copy held; a field it did
    // not change is not, because the package is deltas and re-sending would overwrite later edits.
    for (const id of edited) for (const k of Object.keys(typed[id])) {
      const sent = (wire.items[id] || {})[k];
      if (changed(id, k)) {
        if (JSON.stringify(sent) !== JSON.stringify(typed[id][k]))
          fail(round, 'PMO copy → submit', `${id}.${k} changed on the copy is not what the package carries`,
            `copy held ${JSON.stringify(typed[id][k])?.slice(0, 70)}\n          package  ${JSON.stringify(sent)?.slice(0, 70)}`);
      } else if (sent !== undefined)
        fail(round, 'PMO copy → submit', `${id}.${k} was not changed on the copy and is in the package anyway`,
          `baseline ${JSON.stringify((baseline[id] || {})[k])?.slice(0, 70)}\n          package  ${JSON.stringify(sent)?.slice(0, 70)}`);
    }
    // Take it on the portfolio board and read the review rows: every field that differs from the
    // board must be offered, with the proposed value the copy held.
    const rows = JSON.parse(ev(`(function(){ PMOSUBS.length=0; window.alert=function(){}; window.confirm=function(){ return true; };
      pmoTake(${JSON.stringify(wire)}, 'fuzz.json');
      return JSON.stringify(pmoRows().map(function(r){ return {id:r.id, key:r.key, prop:r.prop, gone:r.gone}; })); })()`));
    const offered = {};
    rows.forEach(r => { (offered[r.id] ||= {})[r.key] = r.prop; });
    for (const id of edited) for (const k of Object.keys(typed[id])) {
      if (!changed(id, k)) continue;                             // never sent, so never offered
      const same = ev(`pmoSame(pmoNow(${JSON.stringify(id)}, ${JSON.stringify(k)}), ${JSON.stringify(typed[id][k])})`);
      if (same === true || same === 'true') continue;          // the board already says it; no row is right
      if (!offered[id] || !(k in offered[id]))
        fail(round, 'submit → take → review', `${id}.${k} was sent and is not offered for review`,
          `package carries ${JSON.stringify(typed[id][k])?.slice(0, 70)}`);
      else if (JSON.stringify(offered[id][k]) !== JSON.stringify(typed[id][k]))
        fail(round, 'submit → take → review', `${id}.${k} is offered with a value the copy never held`,
          `copy held ${JSON.stringify(typed[id][k])?.slice(0, 70)}\n          offered  ${JSON.stringify(offered[id][k])?.slice(0, 70)}`);
    }
  } catch (e) { fail(round, 'PMO copy', 'threw', String(e.message).slice(0, 150)); }

  // ---- TRIP 5 (v1.89): an added requirement deleted, another added. Everything this board holds
  // under ANY requirement is copied onto an added one -- every container populate() filled, found by
  // looking, not from a list -- then it is deleted and another is added. Nothing of it may be left
  // anywhere, the new one may not share its number or inherit a field, and every container it held
  // must be on REQ_MAPS: one that is not is a kind of data deleting an added requirement leaves
  // behind, which is exactly how nine of the thirty-four were purged and the rest inherited.
  try {
    const r = JSON.parse(ev(`(function(){
      window.confirm=function(){ return true; }; window.alert=function(){};
      var add=function(t){ _addPanelSvc=null; syncAddPanel(); var n0=S.custom.length;
        document.getElementById('naTitle').value=t; document.getElementById('naTot').value='1000';
        SVC.forEach(function(s,i){ document.getElementById('naSvc'+i).value=''; });
        document.getElementById('naGrp').value=GROUPS[0]; addReq();
        return S.custom.length>n0? S.custom[S.custom.length-1].id : ''; };
      var held=function(id){ var out=[];
        Object.keys(S).forEach(function(k){ var bag=S[k]; if(!bag || typeof bag!=='object' || Array.isArray(bag)) return;
          if(Object.prototype.hasOwnProperty.call(bag, id) || (k==='upl' && Object.prototype.hasOwnProperty.call(bag, 'r|'+id))) out.push(k); });
        if(S.whatif) ['a','b'].forEach(function(p){ if((S.whatif[p]||{})[id]!==undefined) out.push('whatif.'+p); });
        return out; };
      var D=add('Doomed'); if(!D) return JSON.stringify({err:'the form added nothing'});
      var others=S.order.filter(function(x){ return x!==D; }).concat(S.removed||[]);
      Object.keys(S).forEach(function(k){ var bag=S[k]; if(!bag || typeof bag!=='object' || Array.isArray(bag)) return;
        var from=others.filter(function(x){ return Object.prototype.hasOwnProperty.call(bag, x); })[0];
        if(from!==undefined) bag[D]=JSON.parse(JSON.stringify(bag[from]));
        if(k==='upl'){ var u=others.filter(function(x){ return bag['r|'+x]!==undefined; })[0]; if(u!==undefined) bag['r|'+D]=bag['r|'+u]; } });
      if(S.whatif) ['a','b'].forEach(function(p){ var b=S.whatif[p]||{}; var w=others.filter(function(x){ return b[x]!==undefined; })[0]; if(w!==undefined) b[D]=b[w]; });
      applyState(S); save();
      var before=held(D);
      var offList=before.filter(function(k){ return k.indexOf('whatif.')!==0 && REQ_MAPS.indexOf(k)<0; });
      removeReq(D);
      var left=held(D);
      var N=add('Fresh');
      return JSON.stringify({D:D, N:N, before:before, offList:offList, left:left, inherits:held(N).filter(function(k){ return k!=='fsrc'; })}); })()`));
    trips++;
    if (r.err) fail(round, 'delete → add', 'the trip could not run', r.err);
    else {
      if (r.before.length < 20) fail(round, 'delete → add', 'too little was copied onto the added requirement to prove anything', r.before.join(', '));
      if (r.offList.length) fail(round, 'delete → add', `${r.offList.length} container(s) hold data per requirement and are not on REQ_MAPS`,
        r.offList.join(', ') + '\n          deleting an added requirement leaves these behind; add each to REQ_MAPS in the board');
      if (r.left.length) fail(round, 'delete → add', `deleting ${r.D} left data behind`, r.left.join(', '));
      if (r.N === r.D) fail(round, 'delete → add', 'the next requirement added reused the deleted number', r.N);
      if (r.inherits.length) fail(round, 'delete → add', `${r.N} inherited data it was never given`, r.inherits.join(', '));
    }
  } catch (e) { fail(round, 'delete → add', 'threw', String(e.message).slice(0, 150)); }

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
failures.forEach(f => { const k = f.round ? `round ${f.round} · ${f.trip}` : f.trip; (by[k] ||= []).push(f); });
for (const [k, fs] of Object.entries(by)) {
  console.log(`--- ${k}`);
  fs.slice(0, 8).forEach(f => console.log(`    ${f.what}\n          ${f.detail}`));
  if (fs.length > 8) console.log(`    … and ${fs.length - 8} more in this trip`);
}
console.log(`\nreplay:  node tools/roundtrip-fuzz.mjs --seed ${SEED0}`);
process.exit(1);
