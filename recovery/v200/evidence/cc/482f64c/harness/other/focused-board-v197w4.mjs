// FOCUSED HARNESS: audit-board preamble, // ==== v1.97 W4: a board’s own service list moves dollars with it (item 80) ==== .. // ==== end v1.97 W4 ==== and the guard, VERBATIM from /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/482f64c/after/tools/export-audit/audit-board.mjs
// Audit the figures the BOARD derives and shows but never exports.
//
// The three export suites compare printed cells against the lane engine. Anything the board
// computes for the screen alone is invisible to them — a mutation sweep found exactly that: the
// cumulative column could be made to skip unfunded dollars entirely and every export suite passed,
// because no export carries it.
//
// The cumulative is not decoration. It is how the cutline banners are placed, so it is the figure
// that tells someone where the money runs out. Its oracle is derived here, from the scenario's own
// inputs, never read back from tiers() — an oracle that asks the code under test what the answer
// is will agree with it, including when it is wrong.
import { boot, seed, stopAtFirstFailure, capture, cv } from './boot.mjs';

const failures = [];
stopAtFirstFailure(failures);   // in the mutation sweep only: see boot.mjs
// EVERY NAMED SCENARIO MUST RUN. A block appended after process.exit() never executes and reads as
// a pass -- the proposal scenario in audit-import.mjs sat there for a whole verification round and
// five mutations aimed at it survived. chk() records every scenario it hears from; at the summary,
// any `const name = '...'` in this file it never heard from is a failure, not a pass.
import { readFileSync as _selfRead } from 'node:fs';
import { fileURLToPath as _selfPath } from 'node:url';
const SEEN = new Set();
// SUITE_CHECKS=<file> records every check (v1.99), as audit-import and audit-recon do, so a fail-before run can be counted
import { appendFileSync as _ckAppend } from 'node:fs';
const CHECKS = process.env.SUITE_CHECKS || '';
const chk = (scenario, where, what, got, want) => {
  SEEN.add(scenario);
  const ok = typeof got === 'number' && typeof want === 'number'
    ? Math.abs(got - want) <= 0.005 : String(got) === String(want);
  if (CHECKS) _ckAppend(CHECKS, JSON.stringify([scenario, where, what, ok, String(got).slice(0, 400)]) + '\n');
  if (!ok) failures.push({ scenario, where, what, got, want });
};
const sum = a => a.reduce((x, y) => x + y, 0);

const SVC3 = ['STOVL', 'CV', 'CTOL'];
const it = (id, grp, ask, extra = {}) => ({
  id, grp, team: grp, sect: '', custom: false, title: id + ' title', event: id + ' event',
  ccar: '', fy26: ask.map(() => 0), ask, alloc: null, ...extra,
});

// ==== v1.97 W4: a board’s own service list moves dollars with it (item 80) ====
// v1.97, ITEM 80 (review R09): A BOARD'S OWN SERVICE LIST MOVES EACH SERVICE'S DOLLARS WITH IT.
// A board with no data pack keeps its own services (MS.svc). On v1.96 ▲▼ swapped the names and left every per-service
// list where it was, and ✕ cut the award lists from the end and every other list by applyState()'s position refit:
// S1 $100 / S2 $200 moved read S2 $100 / S1 $200, and S1 removed left S2 holding S1's $100. The board is built here
// through its own doors (＋ Add service, ＋ Add requirement), then EVERY kind of per-service list is given a different
// amount on every service, every requirement and line, in two fiscal years. The oracle is the fixture's own numbers,
// read BY NAME: after each change, every list the fixture wrote must hold, at each service's new place, what that
// service held when the fixture wrote it. The walk is generic -- any numeric list of the service width, found in the
// state as written -- so it does not share the board's own list of what to remap.
const { bootMark: _v7w4Mark, bootRelease: _v7w4Release, settleBoards: _v7w4Settle } = await import('./boot.mjs');
const W4S = ['S1', 'S2', 'S3', 'S4', 'S5'];
const w4amt = (y, k, r, s) => (y + 1) * 10000000 + (k + 1) * 100000 + (r + 1) * 1000 + (s + 1) * 10;
const w4vec = (y, k, r, n = W4S.length) => Array.from({ length: n }, (_, s) => w4amt(y, k, r, s));
// k: 0 requirement value, 1 prior-year value, 2 edited value (asks), 3 allocation by service, 4/5 directed disc/mand,
// 6/7 base budget authority disc/mand, 8/9 a funding source in each pool, 10 award increments, 11 WBS lines,
// 12 added CLINs' asks, 13 CLIN allocations, 14 an edited CLIN's ask, 15 a CLIN's WBS lines
const w4year = (y, n) => ({
  ask: [0, 1, 2].map(r => w4vec(y, 0, r, n)), fy26: [0, 1, 2].map(r => w4vec(y, 1, r, n)), asks: [0, 1, 2].map(r => w4vec(y, 2, r, n)),
  alloc: w4vec(y, 3, 0, n), dv: w4vec(y, 4, 0, n), mv: w4vec(y, 5, 0, n), bmD: w4vec(y, 6, 0, n), bmM: w4vec(y, 7, 0, n),
  addD: w4vec(y, 8, 0, n), addM: w4vec(y, 9, 0, n), awd: [0, 1, 2].map(r => w4vec(y, 10, r, n)), wbs: [0, 1].map(r => w4vec(y, 11, r, n)),
  clinNew: [0, 1].map(r => w4vec(y, 12, r, n)), clinAlloc: [0, 1].map(r => w4vec(y, 13, r, n)), clinMeta: w4vec(y, 14, 0, n),
  clinWbs: [0, 1].map(r => w4vec(y, 15, r, n)) });
// R1 directs its split (fsrc), R2 is allocated by service and is a prime with CLINs, R3 takes its whole value.
const W4FILL = `(function(V, fy){
  var ids=S.custom.map(function(c){ return c.id; }), R1=ids[0], R2=ids[1], R3=ids[2];
  S.custom.forEach(function(c,i){ c.ask=V.ask[i].slice(); c.fy26=V.fy26[i].slice(); S.asks[c.id]=V.asks[i].slice(); });
  delete S.fsrc[R2]; S.alloc[R2]={m:'s', v:V.alloc.slice()};
  delete S.fsrc[R3]; delete S.alloc[R3];
  S.fsrc[R1]={m:'split', dv:V.dv.slice(), mv:V.mv.slice()};
  S.bm={disc:V.bmD.slice(), mand:V.bmM.slice(), adds:[{name:'Add D', pool:'disc', vec:V.addD.slice()},{name:'Add M', pool:'mand', vec:V.addM.slice()}]};
  S.awards[R1]={mode:'inc', inc:[{d:(fy-1)+'-11', day:3, sv:V.awd[0].slice()},{d:fy+'-02', day:9, sv:V.awd[1].slice()}]};
  S.awards[R3]={mode:'inc', inc:[{d:fy+'-03', day:12, sv:V.awd[2].slice()}]};
  delete S.awards[R2];
  S.wbs[R1]=[{w:'1.1', v:V.wbs[0].slice()},{w:'1.2', v:V.wbs[1].slice()}];
  S.ptype[R2]='PRIME';
  S.clinNew={}; S.clinNew[R2]=[{key:'n1', clin:'3001', desc:'a', ccar:'', ask:V.clinNew[0].slice()},{key:'n2', clin:'3002', desc:'b', ccar:'', ask:V.clinNew[1].slice()}];
  S.clinAlloc={}; S.clinAlloc[R2]={n1:V.clinAlloc[0].slice(), n2:V.clinAlloc[1].slice()};
  S.clinMeta={}; S.clinMeta[R2]={b0:{ask:V.clinMeta.slice()}};
  S.clinWbs={}; S.clinWbs[R2]={n1:[{w:'2.1', v:V.clinWbs[0].slice()},{w:'2.2', v:V.clinWbs[1].slice()}]};
  applyState(S); MS.years[fy]=S; save(); render(); return 'ok';
})`;
// A board with no data pack, its services and requirements added the way a person adds them.
function w4Template(names, reqs) {
  const B = boot();
  B.ev(`localStorage.setItem('prio27who','w4'); window.__al=[]; window.__cf=[]; window.__pr=0;
    alert=function(m){ window.__al.push(String(m)); }; confirm=function(m){ window.__cf.push(String(m)); return true; };`);
  for (const s of names) B.ev(`prompt=function(){ return ${JSON.stringify(s)}; }; svcAdd();`);
  for (const r of reqs) B.ev(`document.getElementById('naTitle').value=${JSON.stringify(r)};
    SVC.forEach(function(s,i){ document.getElementById('naSvc'+i).value=String(100*(i+1)); }); addReq();`);
  return B;
}
// Every numeric list of width n in a state, with its path.
function w4walk(node, path, out, n) {
  if (Array.isArray(node)) {
    if (node.length === n && node.length && node.every(v => typeof v === 'number')) { out.push([path, node]); return out; }
    node.forEach((v, i) => w4walk(v, path.concat(i), out, n)); return out;
  }
  if (node && typeof node === 'object') Object.keys(node).forEach(k => { if (k !== 'dataPack') w4walk(node[k], path.concat(k), out, n); });
  return out;
}
const w4at = (o, p) => p.reduce((x, k) => (x == null ? x : x[k]), o);
// Each list the fixture wrote, read at its services' new places, against what each service held when it was written.
// was: the original name of each service now listed (a rename is the same service).
function w4byName(years, names, orig, was = {}) {
  const bad = [];
  for (const [p, v] of orig) {
    const want = names.map(nm => v[W4S.indexOf(was[nm] || nm)]);
    const got = w4at(years, p);
    if (JSON.stringify(got) !== JSON.stringify(want)) bad.push(p.join('.') + ' = ' + JSON.stringify(got) + ', want ' + JSON.stringify(want));
  }
  return bad.length ? bad.length + ' lists hold another service’s dollars: ' + bad.slice(0, 3).join(' · ') : 'every list follows its service';
}
const w4money = v => '$' + Math.round(v).toLocaleString();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = _v7w4Mark();
  const name = 'v1.97 W4 — moving, renaming and removing a service moves its dollars with it, in every year (item 80)';
  try {
  const J = JSON.stringify;
  const B = w4Template(W4S, ['R1', 'R2', 'R3']), ev = B.ev;
  ev(`${W4FILL}(${J(w4year(0))}, 2027)`);
  ev(`switchYear(2028); ${W4FILL}(${J(w4year(1))}, 2028); switchYear(2027); 'ok'`);
  // filed under a service's NAME: a BAE budget per service and lane, an RCN/EEIC override, a PPBE position, the Spruills' service
  ev(`(function(){ var R1=S.custom[0].id; S.budgetAsg[R1]={'S3|disc':'BUD-3D','S3|mand':'BUD-3M','S1':'BUD-1'};
    S.rcnSvc[R1]={S3:'rc3'}; MS.ppbe['PB|2027']={v:2, split:false, lines:{S3:[{k:'_all', all:true}]}, val:{S3:{_all:{2027:{d:7,m:0}}}}};
    MS.spSvc='S3'; spSvc='S3'; MS.spDrillSvc='S1'; spDrillSvc='S1'; svcFilter=1; fcView='s:4'; save(); return 'ok'; })()`);
  const O = JSON.parse(ev(`JSON.stringify(MS.years)`));
  const orig = w4walk(O, [], [], W4S.length);
  const kinds = [...new Set(orig.map(([p]) => p[0] + ' ' + p.slice(1).filter(k => typeof k === 'string' && !/^NEW-/.test(k)).join('.')))].sort();
  const W4KINDS = ['alloc.v', 'asks', 'awards.inc.sv', 'bm.adds.vec', 'bm.disc', 'bm.mand', 'clinAlloc.n1', 'clinAlloc.n2', 'clinMeta.b0.ask',
    'clinNew.ask', 'clinWbs.n1.v', 'custom.ask', 'custom.fy26', 'discSvc', 'fsrc.dv', 'fsrc.mv', 'mandSvc', 'wbs.v'];
  chk(name, 'fixture (control)', 'every kind of per-service list holds a different amount on every service, in FY27 and FY28 (60 lists)',
    J(kinds) + ' ' + orig.length, J(['2027', '2028'].flatMap(y => W4KINDS.map(k => y + ' ' + k)).sort()) + ' 60');
  const svcNow = () => JSON.parse(ev(`JSON.stringify(SVC)`)), yrs = () => JSON.parse(ev(`JSON.stringify(MS.years)`));
  const jr0 = JSON.parse(ev(`JSON.stringify((MS.jrnl||[]).length)`));
  // ▼ on S2, ▲ on S5: both directions, first through last place
  ev(`svcMove(1,1)`);
  chk(name, 'move down', 'S2 moved down: every list in both years holds each service’s own dollars at its new place',
    J(svcNow()) + ' ' + w4byName(yrs(), svcNow(), orig), J(['S1', 'S3', 'S2', 'S4', 'S5']) + ' every list follows its service');
  const jr = JSON.parse(ev(`JSON.stringify((MS.jrnl||[]).slice(${jr0}).map(function(e){ return e.p[0]; }))`));
  chk(name, 'journal', 'the change is one journal line, the service list before and after, not a figure-by-figure record that would put dollars back by place',
    J(jr), J(['(services)']));
  chk(name, 'filters', 'a service filter on screen follows its service (the chip, the forecast view)',
    ev(`JSON.stringify([svcFilter, fcView])`), J([2, 's:4']));
  ev(`svcMove(4,-1)`);
  chk(name, 'move up', 'S5 moved up: every list follows its service',
    J(svcNow()) + ' ' + w4byName(yrs(), svcNow(), orig), J(['S1', 'S3', 'S2', 'S5', 'S4']) + ' every list follows its service');
  // rename: the same service -- its dollars stay where they are, what is filed under its name goes with it
  ev(`window.__al=[]; prompt=function(){ return 's2'; }; svcRen(1)`);
  chk(name, 'rename', 'renaming to a name already in the list (any case) is refused, and nothing changes',
    J(svcNow()) + ' ' + ev(`window.__al.length`), J(['S1', 'S3', 'S2', 'S5', 'S4']) + ' 1');
  ev(`prompt=function(){ return 'S3x'; }; svcRen(1)`);
  chk(name, 'rename', 'S3 renamed S3x: every list keeps its dollars where they were',
    J(svcNow()) + ' ' + w4byName(yrs(), svcNow(), orig, { S3x: 'S3' }), J(['S1', 'S3x', 'S2', 'S5', 'S4']) + ' every list follows its service');
  chk(name, 'rename', 'and what is filed under its name follows it: the BAE budget per lane, the RCN/EEIC override, the PPBE position, the Spruills’ service',
    ev(`JSON.stringify([S.budgetAsg[S.custom[0].id], S.rcnSvc[S.custom[0].id], Object.keys(MS.ppbe['PB|2027'].val), Object.keys(MS.ppbe['PB|2027'].lines), MS.spSvc, spSvc])`),
    J([{ S1: 'BUD-1', 'S3x|disc': 'BUD-3D', 'S3x|mand': 'BUD-3M' }, { S3x: 'rc3' }, ['S3x'], ['S3x'], 'S3x', 'S3x']));
  // remove the first: the confirm says what it holds, per kind, in each year -- the fixture's own sums
  const held = (s) => { const out = {}; [0, 1].forEach(y => { const V = w4year(y);
    const ask = V.ask.reduce((a, v) => a + v[s], 0), alloc = V.dv[s] + V.mv[s] + V.alloc[s] + V.ask[2][s];
    const ba = V.bmD[s] + V.bmM[s] + V.addD[s] + V.addM[s], awd = V.awd.reduce((a, v) => a + v[s], 0);
    [['ask', ask], ['alloc', alloc], ['ba', ba], ['awd', awd]].forEach(([k, v]) => { (out[k] ||= []).push(v); }); }); return out; };
  const h1 = held(0);
  const line = (lbl, v) => '  • ' + lbl + ': ' + w4money(v[0] + v[1]) + ' (FY27 ' + w4money(v[0]) + ', FY28 ' + w4money(v[1]) + ')';
  ev(`window.__cf=[]; svcDel(0)`);
  const ask1 = ev(`window.__cf[0]||''`);
  chk(name, 'delete first', 'removing S1 says first what it holds, per kind, in each year, in whole dollars',
    [line('requirement values', h1.ask), line('allocations', h1.alloc), line('budget authority', h1.ba), line('award increments', h1.awd)]
      .every(l => ask1.indexOf(l) >= 0) ? 'all four, exact' : ask1.slice(0, 300), 'all four, exact');
  chk(name, 'delete first', 'S1 removed: every other service keeps its own dollars, in every list and year',
    J(svcNow()) + ' ' + w4byName(yrs(), svcNow(), orig, { S3x: 'S3' }), J(['S3x', 'S2', 'S5', 'S4']) + ' every list follows its service');
  ev(`svcDel(1)`);
  chk(name, 'delete middle', 'S2 (a middle service) removed: every other service keeps its own dollars',
    J(svcNow()) + ' ' + w4byName(yrs(), svcNow(), orig, { S3x: 'S3' }), J(['S3x', 'S5', 'S4']) + ' every list follows its service');
  ev(`svcDel(2)`);
  chk(name, 'delete last', 'S4 (the last) removed: every other service keeps its own dollars',
    J(svcNow()) + ' ' + w4byName(yrs(), svcNow(), orig, { S3x: 'S3' }), J(['S3x', 'S5']) + ' every list follows its service');
  chk(name, 'filters', 'a filter on a service removed lets go (the chip, the PMO drill’s service); one on a service kept still names it',
    ev(`JSON.stringify([svcFilter, fcView, spDrillSvc, MS.spDrillSvc])`), J([-1, 's:1', 'ALL', 'ALL']));
  // save and reopen: the file names the services in their new order and every figure is on its own service
  const R = boot({ html: ev(`buildSavedHtml()`) });
  chk(name, 'save and reopen', 'the saved board reopens with S3x, S5 and every list, in both years, on its own service',
    R.ev(`JSON.stringify(SVC)`) + ' ' + w4byName(JSON.parse(R.ev(`JSON.stringify(MS.years)`)), JSON.parse(R.ev(`JSON.stringify(SVC)`)), orig, { S3x: 'S3' }),
    J(['S3x', 'S5']) + ' every list follows its service');
  chk(name, 'save and reopen', 'and the figures it shows are S3’s and S5’s: requirement value and budget authority, FY27',
    R.ev(`JSON.stringify([DATA.items.map(function(i){ return i.ask; }), S.discSvc, S.mandSvc])`),
    J([[0, 1, 2].map(r => [w4amt(0, 0, r, 2), w4amt(0, 0, r, 4)]), [w4amt(0, 6, 0, 2) + w4amt(0, 8, 0, 2), w4amt(0, 6, 0, 4) + w4amt(0, 8, 0, 4)],
       [w4amt(0, 7, 0, 2) + w4amt(0, 9, 0, 2), w4amt(0, 7, 0, 4) + w4amt(0, 9, 0, 4)]]));
  chk(name, 'errors (control)', 'no script error on either board', J(B.errors.concat(R.errors)), '[]');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  _v7w4Release(__bm, []);
  await _v7w4Settle();
})();
// A PPBE CYCLE IS A FIXED POINT, read by place against the list: the services it holds keep their names and places.
await (async () => {
  const __bm = _v7w4Mark();
  const name = 'v1.97 W4 — a kept PPBE cycle fixes the services it holds (item 80)';
  try {
  const J = JSON.stringify;
  const B = w4Template(['A', 'B', 'C'], ['R']), ev = B.ev;
  ev(`bmSetBase('disc',0,'1000'); bmSetBase('disc',1,'2000'); bmSetBase('disc',2,'3000'); blCyc='PB'; blYr=2027; cycLock(); 'ok'`);
  const lock0 = ev(`JSON.stringify(CYCDB.cycles)`);
  const was = ev(`JSON.stringify([SVC, S.discSvc, S.custom[0].ask])`);
  ev(`window.__al=[]; svcMove(0,1); svcMove(2,-1); prompt=function(){ return 'Ax'; }; svcRen(0); window.__cf=[]; svcDel(2)`);
  chk(name, 'refused', 'with PB27 locked over A, B, C: ▲▼, rename and ✕ each change nothing, and nothing is asked',
    ev(`JSON.stringify([SVC, S.discSvc, S.custom[0].ask])`) + ' ' + ev(`window.__cf.length`), was + ' 0');
  chk(name, 'refused', 'each says why, naming the cycle and the services it holds',
    ev(`JSON.stringify(window.__al.map(function(m){ return /PB27 \\(locked\\) holds A, B, C/.test(m) && /fixed point/.test(m); }))`), J([true, true, true, true]));
  chk(name, 'kept (control)', 'the cycle itself is untouched', ev(`JSON.stringify(CYCDB.cycles)`) === lock0, true);
  ev(`prompt=function(){ return 'D'; }; svcAdd()`);
  chk(name, 'add (control)', 'a service can still be added at the end', ev(`JSON.stringify([SVC, S.discSvc])`), J([['A', 'B', 'C', 'D'], [1000, 2000, 3000, 0]]));
  ev(`window.__al=[]; svcMove(3,-1)`);
  chk(name, 'refused', 'and moving it into the cycle’s places is refused too', ev(`JSON.stringify([SVC, window.__al.length])`), J([['A', 'B', 'C', 'D'], 1]));
  // the same lock UNLOCKED still reads by place: it fixes the list until it is deleted
  ev(`CYCDB.cycles['PB|2027'].locked=false; window.__al=[]; svcMove(0,1)`);
  chk(name, 'unlocked', 'an unlocked cycle fixes them too, and says it is unlocked',
    ev(`JSON.stringify([SVC, /PB27 \\(unlocked\\)/.test(window.__al[0]||'')])`), J([['A', 'B', 'C', 'D'], true]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  _v7w4Release(__bm, []);
  await _v7w4Settle();
})();
// THE REPROGRAMMING LOG AND A HELD SUBMITTAL read a service by its place too (this appropriation's rows only).
await (async () => {
  const __bm = _v7w4Mark();
  const name = 'v1.97 W4 — reprogramming rows and held submittals follow the list (item 80)';
  try {
  const J = JSON.stringify;
  const B = w4Template(['A', 'B', 'C', 'D'], ['R']), ev = B.ev;
  ev(`RPDB.entries=[{id:'r0',ts:1,ap:APPN,fy:2027,type:'BTR',svc:0,amtM:1},{id:'r2',ts:1,ap:APPN,fy:2027,type:'BTR',svc:2,amtM:2},
    {id:'r3',ts:1,ap:APPN,fy:2027,type:'BTR',svc:'3',amtM:4},{id:'rx',ts:1,ap:'OPN',fy:2027,type:'BTR',svc:0,amtM:3},
    {id:'rn',ts:1,ap:APPN,fy:2027,type:'BTR',svc:1,svcName:'B',svcPos:1,svcBy:'pick',amtM:5}];
    PMOSUBS=[{pmo:'PSM', svc:['A','B','C','D'], items:{}, base:{}, added:[], forFy:2027}];
    PMOSUBS[0].items[S.custom[0].id]={asks:[11,22,0,44]}; PMOSUBS[0].base[S.custom[0].id]={asks:[1,2,0,4]}; PMOSUBS[0].baseSeen=PMOSUBS[0].base;
    svcMove(0,1); 'ok'`);
  chk(name, 'move', 'A and B swapped: this appropriation’s rows follow their service, stamped; a held submittal’s figures follow theirs',
    ev(`JSON.stringify([RPDB.entries.filter(function(r){ return r.ap===APPN; }).map(function(r){ return r.id+':'+(SVC[r.svc])+':'+(r.ts>1); }),
      PMOSUBS[0].items[S.custom[0].id].asks, PMOSUBS[0].base[S.custom[0].id].asks])`),
    J([['r0:A:true', 'r2:C:false', 'r3:D:false', 'rn:B:true'], [22, 11, 0, 44], [2, 1, 0, 4]]));
  // v1.97 integration: a row named by its service (W5) keeps its name, and its seal moves with its place
  chk(name, 'move · a named row', 'rn names B: after the swap it still reads B, sealed at B’s new place',
    ev(`(function(){ const r=RPDB.entries.find(function(x){ return x.id==='rn'; }); return JSON.stringify([rpSvcOf(r).name, rpSvcOf(r).how, r.svcPos, r.svc]); })()`),
    J(['B', 'pick', 0, 0]));
  chk(name, 'other (control)', 'a row for another appropriation is not this list’s', ev(`JSON.stringify(RPDB.entries.filter(function(r){ return r.ap!==APPN; }).map(function(r){ return r.svc; }))`), J([0]));
  ev(`window.__al=[]; window.__cf=[]; svcDel(1)`);
  chk(name, 'delete refused', 'A has a reprogramming row and a held submittal’s figures: removing it is refused, saying so, before anything is asked',
    ev(`JSON.stringify([SVC, window.__cf.length, /1 reprogramming log entry/.test(window.__al[0]||''), /submittal held/.test(window.__al[0]||'')])`),
    J([['B', 'A', 'C', 'D'], 0, true, true]));
  ev(`svcDel(2)`);
  chk(name, 'delete', 'C (no submittal figure) has row r2: refused too', ev(`JSON.stringify(SVC)`), J(['B', 'A', 'C', 'D']));
  ev(`RPDB.entries=RPDB.entries.filter(function(r){ return r.id!=='r2'; }); svcDel(2)`);
  chk(name, 'delete', 'once nothing is on C it goes, and the rows past it move up with their service',
    ev(`JSON.stringify([SVC, RPDB.entries.filter(function(r){ return r.ap===APPN; }).map(function(r){ return r.id+':'+SVC[r.svc]; }), PMOSUBS[0].items[S.custom[0].id].asks])`),
    J([['B', 'A', 'D'], ['r0:A', 'r3:D', 'rn:B'], [22, 11, 44]]));
  // v1.97 integration: a rename is the same service, and the row named by it follows the new name
  ev(`svcSaveList(['Bz','A','D'], [0,1,2]); 'ok'`);
  chk(name, 'rename · a named row', 'B renamed Bz: the row named B now reads Bz, at the same place, still confirmed',
    ev(`(function(){ const r=RPDB.entries.find(function(x){ return x.id==='rn'; }); return JSON.stringify([SVC, r.svcName, rpSvcOf(r).name, rpSvcOf(r).how, rpSvcOf(r).inList]); })()`),
    J([['Bz', 'A', 'D'], 'Bz', 'Bz', 'pick', true]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  _v7w4Release(__bm, []);
  await _v7w4Settle();
})();
// ON A BOARD WHOSE DATA NAMES ITS SERVICES the list is fixed: ▲▼ and rename were offered there and did nothing.
await (async () => {
  const __bm = _v7w4Mark();
  const name = 'v1.97 W4 — a board whose data names its services offers no ▲▼ or rename (item 80)';
  try {
  const J = JSON.stringify;
  const T = w4Template(['A', 'B', 'C'], ['R']);
  const D = boot({ html: T.ev(`buildSavedHtml()`) }), ev = D.ev;   // saved with a requirement, it reopens on its data pack
  ev(`localStorage.setItem('prio27who','w4'); window.__pr=0; prompt=function(){ window.__pr++; return 'Z'; }; svcPanelOpen=true; render(); 'ok'`);
  chk(name, 'panel', 'the 🏷 Services panel lists A, B, C with no ▲, ▼, rename or ✕, and no ＋ Add',
    ev(`JSON.stringify([SVC_FROM_DATA, [].slice.call(document.querySelectorAll('#svcList b')).map(function(b){ return b.textContent; }), document.querySelectorAll('#svcList button').length])`),
    J([true, ['A', 'B', 'C'], 0]));
  const was = ev(`JSON.stringify([MS.svc, SVC, S.custom[0].ask, S.discSvc])`);
  ev(`svcMove(0,1); svcRen(0); svcSaveList(['B','A','C'], [1,0,2]); 'ok'`);
  chk(name, 'nothing', '▲▼, rename and the list itself change nothing there — not even the stored list — and rename asks nothing',
    ev(`JSON.stringify([MS.svc, SVC, S.custom[0].ask, S.discSvc])`) + ' ' + ev(`window.__pr`), was + ' 0');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  _v7w4Release(__bm, []);
  await _v7w4Settle();
})();
// THE DATA PACK THE BOARD WROTE names its services when the file is next opened. Save rewrites it only while the board
// has a requirement, so a board whose requirements were all removed kept the old list over the new figures.
await (async () => {
  const __bm = _v7w4Mark();
  const name = 'v1.97 W4 — a data pack the board wrote keeps step with its list (item 80)';
  try {
  const J = JSON.stringify;
  const B = w4Template(['A', 'B', 'C'], ['R']), ev = B.ev;
  ev(`bmSetBase('disc',0,'1000'); bmSetBase('disc',1,'2000'); bmSetBase('disc',2,'3000'); save(); removeReq(S.custom[0].id); svcDel(0); 'ok'`);
  const R = boot({ html: ev(`buildSavedHtml()`) });
  chk(name, 'reopen', 'A removed with no requirement left: the file reopens on B, C with B’s and C’s budget authority',
    R.ev(`JSON.stringify([SVC, S.discSvc])`), J([['B', 'C'], [2000, 3000]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  _v7w4Release(__bm, []);
  await _v7w4Settle();
})();
// CONTROL: an award of the wrong width (a damaged record, in a year not opened since) is not cut or padded to look whole
// by the move: applyState's award check repairs it from its total and keeps it as found.
await (async () => {
  const __bm = _v7w4Mark();
  const name = 'v1.97 W4 — an award of the wrong width is repaired from its total, not cut, when the list changes (item 80) — control';
  try {
  const J = JSON.stringify;
  const B = w4Template(['A', 'B', 'C', 'D'], ['R']), ev = B.ev;
  ev(`switchYear(2028); switchYear(2027); MS.years[2028].awards[S.custom[0].id]={mode:'inc', inc:[{d:'2027-11', day:3, sv:[10,20,30]}]}; svcMove(0,1); 'ok'`);
  chk(name, 'repaired (control)', 'the FY28 award keeps its $60, spread over the values and marked, its record kept as found',
    ev(`(function(){ var a=MS.years[2028].awards[S.custom[0].id]; return JSON.stringify([a.inc[0].sv.reduce(function(x,y){ return x+y; },0), a.inc[0].sv.length,
      !!(a.fix && a.fix.how), JSON.parse(awdOrigText(a.fix && a.fix.orig)).inc[0].sv]); })()`), J([60, 4, true, [10, 20, 30]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  _v7w4Release(__bm, []);
  await _v7w4Settle();
})();
// A DATA PACK THAT NAMES REQUIREMENTS BUT NO SERVICES leaves the board keeping its own list -- and its baseline values,
// its budget and its CLINs are read by place against that list too.
await (async () => {
  const __bm = _v7w4Mark();
  const name = 'v1.97 W4 — a board whose data names no services keeps its baseline, budget and CLINs with their service (item 80)';
  try {
  const J = JSON.stringify;
  const store = { base: 2027, cur: 2027, ts: 1, years: { 2027: { order: ['B1'], custom: [], removed: [] } }, svc: ['A', 'B', 'C'],
    dataPack: { services: [], items: [{ id: 'B1', grp: 'PSM', team: 'PSM', sect: '', title: 'Base one', event: 'E', ccar: '', fy26: [7, 8, 9], ask: [100, 200, 300] }],
      budget: [1000, 2000, 3000], clins: { B1: [{ clin: '0001', desc: 'x', ccar: '', ask: [11, 22, 33] }] } } };
  const B = boot({ ls: { prio27om: J(store), prio27who: 'w4' } }), ev = B.ev;
  ev(`confirm=function(){ return true; }; svcMove(0,1); 'ok'`);
  chk(name, 'move', 'A moved down: the baseline value, the prior-year value, the budget and the CLIN’s ask each follow their service',
    ev(`JSON.stringify([SVC, BASE_ASK.B1, itemById('B1').ask, BASE_ITEMS[0].fy26, DATA.budget, CLINS.B1[0].ask])`),
    J([['B', 'A', 'C'], [200, 100, 300], [200, 100, 300], [8, 7, 9], [2000, 1000, 3000], [22, 11, 33]]));
  const R = boot({ html: ev(`buildSavedHtml()`) });
  chk(name, 'save and reopen', 'saved and reopened, B1 asks B $200, A $100, C $300', R.ev(`JSON.stringify([SVC, itemById('B1').ask])`),
    J([['B', 'A', 'C'], [200, 100, 300]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  _v7w4Release(__bm, []);
  await _v7w4Settle();
})();
// CONTROL: with no list before, there is no service to follow. Figures a state held while the list was empty are kept
// as they came in and aligned by place against the first service added, as v1.96 did -- never zeroed by the remap.
await (async () => {
  const __bm = _v7w4Mark();
  const name = 'v1.97 W4 — the first service added takes what the board held before it had a list (item 80) — control';
  try {
  const J = JSON.stringify;
  const B = boot(), ev = B.ev;
  ev(`localStorage.setItem('prio27who','w4'); confirm=function(){ return true; };
    S.bm={disc:[500,600], mand:[50,60], adds:[]}; S.custom=[{id:'NEW-1', grp:'PSM', custom:true, title:'X', event:'', ccar:'', fy26:[0,0], ask:[100,200], alloc:null}];
    S.order=['NEW-1']; applyState(S); MS.years[MS.cur]=S; prompt=function(){ return 'A'; }; svcAdd(); 'ok'`);
  chk(name, 'first service (control)', 'A, the first service, takes the first figure of each list it found', ev(`JSON.stringify([SVC, S.discSvc, S.mandSvc, S.custom[0].ask])`),
    J([['A'], [500], [50], [100]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  _v7w4Release(__bm, []);
  await _v7w4Settle();
})();
// THE JOURNAL records a figure by its place. Put back after the list changed, it would land on whichever service holds
// that place now -- so a journalled figure from before the change is not put back; a single value (a note) still is.
await (async () => {
  const __bm = _v7w4Mark();
  const name = 'v1.97 W4 — a figure journalled before the list changed is not put back on another service (item 80)';
  try {
  const J = JSON.stringify;
  const B = w4Template(['A', 'B', 'C'], ['R']), ev = B.ev;
  ev(`S.custom[0].ask[0]=150; save(); S.notes[S.custom[0].id]='kept'; save(); 'ok'`);
  const at = JSON.parse(ev(`JSON.stringify((MS.jrnl||[]).map(function(e){ return e.p.join('.'); }))`));
  const iAsk = at.lastIndexOf('custom.0.ask.0'), iNote = at.lastIndexOf('notes.' + ev(`S.custom[0].id`));
  ev(`svcMove(0,1); window.__cf=[]; jrnlUndo(${iAsk}); 'ok'`);
  chk(name, 'by place', 'R’s value for A, typed before A moved down, is not put back onto B, now first: nothing changes and nothing is asked',
    ev(`JSON.stringify([SVC, S.custom[0].ask, window.__cf.length])`) + ' ' + (iAsk >= 0), J([['B', 'A', 'C'], [200, 150, 300], 0]) + ' true');
  ev(`jrnlUndo(${iNote}); 'ok'`);
  chk(name, 'one value (control)', 'a note typed before the change can still be put back', ev(`JSON.stringify(S.notes[S.custom[0].id]||null)`) + ' ' + (iNote >= 0), 'null true');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  _v7w4Release(__bm, []);
  await _v7w4Settle();
})();
// ==== end v1.97 W4 ====
{
  const src = _selfRead(_selfPath(import.meta.url), 'utf8');
  const named = [...src.matchAll(/^  const name = '([^']+)'/gm)].map(m => m[1]);   // a scenario's own line, never this one
  // A name built by concatenation ('convert to split — ' + label) is heard only in its finished
  // forms, so a literal that any heard scenario STARTS WITH has run. A dead block's literal has none.
  named.forEach(n => { if (![...SEEN].some(s => s === n || s.startsWith(n))) failures.push({ scenario: n, where: 'harness',
    what: 'this scenario never ran — is its block after process.exit()?', got: 'never ran', want: 'ran' }); });
}
console.log('\n' + '='.repeat(96));
if (!failures.length) { console.log('ALL CHECKS PASSED'); process.exit(0); }
const by = {};
failures.forEach(f => { const k = f.scenario + ' | ' + f.where; (by[k] ||= []).push(f); });
console.log(`${failures.length} FAILING CHECK(S)\n`);
for (const [k, fs] of Object.entries(by)) {
  console.log(`--- ${k}`);
  fs.forEach(f => console.log(`    ${f.what}\n        got ${f.got}   want ${f.want}`));
}
process.exit(1);
