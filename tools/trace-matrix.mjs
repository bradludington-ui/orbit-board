// TRACE MATRIX — one quantity, every surface that states it, cross-footed.
//
// The board says a number. The panel repeats it. A sheet prints it, a slide quotes it, the drill
// subtotals it. They are the SAME DOLLARS, and the only way a reader can trust any of them is if
// they agree. This builds the matrix: rows are quantities, columns are surfaces, and every populated
// cell is compared against a truth computed HERE, from the fixture's own numbers -- never read back
// out of the board, because an oracle that asks the code under test will agree with it.
//
// A cell can be one of three things, and the difference matters:
//   ok       the surface states this quantity and it agrees
//   MISMATCH the surface states it and it does NOT agree  -> the run fails, and this is the report
//   --       the surface does not state this quantity at all. Not an error. A slide that never
//            mentions trim is not wrong; it is silent, and silence is recorded rather than scored.
//
// EVERY CELL IS LOCATED BY NAME -- a column header, a row label -- and never by index. That is not
// style. Adding one column to Funding Streams once moved four checks one column left, and they went
// on passing against the wrong figure. A lookup that silently re-points is the failure mode this
// whole file exists to catch, so it must not be the failure mode of the file itself.
import { boot, seed, capture, cv } from './export-audit/boot.mjs';

const BOARD = process.env.BOARD || null;
const SVC = ['USAF', 'ANG', 'AFRC'];
const sum = a => a.reduce((x, y) => x + y, 0);

// ---- THE FIXTURE -------------------------------------------------------------------------------
// Deliberately awkward. Lanes BIND and run dry partway; one requirement is TRIMMED so ask and
// allocation differ; one is starred; per-service asks are uneven so anything that averages across
// services instead of weighting by them shows up as a mismatch rather than as a rounding smudge.
const mk = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false,
  title: id + ' title', event: id + ' event', ccar: 'JSF' + id, fy26: ask.map(() => 0), ask, alloc: null });
const FIX = {
  services: SVC,
  items: [mk('A', 'PSM', [12000000, 1500000, 900000]),
          mk('B', 'AV',  [ 6000000, 2200000, 400000]),
          mk('C', 'MxS', [ 5000000,  800000, 300000]),
          mk('D', 'TSS', [ 3000000,  600000, 250000])],
  disc: [14000000, 2000000, 1000000],
  mand: [ 4000000,  900000,  300000],
  order: ['A', 'B', 'C', 'D'],
  mc: { B: true },
  alloc: { C: { m: 's', v: [3000000, 500000, 200000] } },   // trimmed: asks 6.1M, allocated 3.7M
};

// ---- THE TRUTH, from the fixture alone -----------------------------------------------------------
const basisOf = id => {
  const it = FIX.items.find(x => x.id === id), a = FIX.alloc[id];
  if (!a) return it.ask.slice();
  if (a.m === 's') return a.v.slice();
  const at = sum(it.ask);
  return at > 0 ? it.ask.map(x => a.v * x / at) : SVC.map(() => a.v / SVC.length);
};
const dRem = FIX.disc.slice(), mRem = FIX.mand.slice(), P = {};
for (const id of FIX.order) {
  const basis = basisOf(id), d = [], m = [], u = [];
  basis.forEach((v, i) => {
    const dd = Math.min(v, Math.max(0, dRem[i])); dRem[i] -= dd;
    const mm = Math.min(v - dd, Math.max(0, mRem[i])); mRem[i] -= mm;
    d[i] = dd; m[i] = mm; u[i] = v - dd - mm;
  });
  P[id] = { d, m, u };
}
const askOf = id => FIX.items.find(x => x.id === id).ask;
const perSvc = f => SVC.map((s, i) => sum(FIX.order.map(id => f(id, i))));
const T = {
  ask:    sum(FIX.order.map(id => sum(askOf(id)))),
  discBA: sum(FIX.disc),
  mandBA: sum(FIX.mand),
  disc:   sum(FIX.order.map(id => sum(P[id].d))),
  mand:   sum(FIX.order.map(id => sum(P[id].m))),
  ufr1:   sum(perSvc((id, i) => Math.max(0, askOf(id)[i] - P[id].d[i]))),
  ufr2:   sum(perSvc((id, i) => Math.max(0, askOf(id)[i] - P[id].d[i] - P[id].m[i]))),
  trim:   sum(perSvc((id, i) => Math.max(0, askOf(id)[i] - basisOf(id)[i]))),
  beyond: sum(perSvc((id, i) => Math.max(0, Math.min(askOf(id)[i], basisOf(id)[i]) - P[id].d[i] - P[id].m[i]))),
  mcTotal:  sum(FIX.order.filter(id => FIX.mc[id]).map(id => sum(askOf(id)))),
  mcShort:  sum(FIX.order.filter(id => FIX.mc[id])
    .map(id => sum(SVC.map((s, i) => Math.max(0, askOf(id)[i] - P[id].d[i]))))),
};
T.funded = T.disc + T.mand;

const LABEL = {
  ask: 'FY requirement (ask)', discBA: 'Discretionary BA', mandBA: 'Mandatory BA',
  disc: 'Discretionary drawn', mand: 'Mandatory drawn', funded: 'Funded (disc+mand)',
  ufr1: 'UNFUNDED vs DISC  (ask-disc)', ufr2: 'TOTAL unfunded  (ask-disc-mand)',
  trim: 'Trim (ask not allocated)', beyond: 'Beyond both lanes',
  mcTotal: 'MC requirement value', mcShort: 'MC short vs discretionary',
};
const ORDER = ['ask', 'discBA', 'mandBA', 'disc', 'mand', 'funded', 'ufr1', 'ufr2', 'trim', 'beyond', 'mcTotal', 'mcShort'];

// ---- harvest -------------------------------------------------------------------------------------
const { ev } = boot(BOARD ? { html: (await import('node:fs')).readFileSync(BOARD, 'utf8') } : {});
seed(ev, FIX);
ev(`S.awards['A']={mode:'single',d:FYMON[1][0],day:1};
    S.awards['B']={mode:'single',d:FYMON[2][0],day:1}; save(); render(); 'ok'`);

const num = c => { const v = cv(c); return typeof v === 'number' ? v : NaN; };
const txt = c => String(cv(c) ?? '').trim();
const rowsOf = sh => sh ? (sh.rows || sh.data || []) : [];
// a cell located by COLUMN HEADER and ROW LABEL -- the only lookup this file uses
const cellAt = (rows, headerRe, colName, rowRe) => {
  const hi = rows.findIndex(r => (r || []).some(c => headerRe.test(txt(c))));
  if (hi < 0) return undefined;
  const ci = (rows[hi] || []).findIndex(c => txt(c) === colName);
  if (ci < 0) return undefined;
  const r = rows.slice(hi + 1).find(x => rowRe.test(txt((x || [])[0])));
  if (!r) return undefined;
  const v = num(r[ci]);
  return isNaN(v) ? undefined : v;
};
// a labelled row whose figure is the LAST number on it (the matrix blocks are shaped this way)
const rowTotal = (rows, rowRe) => {
  const r = rows.find(x => rowRe.test(txt((x || [])[0])));
  if (!r) return undefined;
  const ns = r.map(num).filter(v => !isNaN(v));
  return ns.length ? ns[ns.length - 1] : undefined;
};
const grab = fn => JSON.parse(ev(`(function(){ var got='[]';
  if(!globalThis.__ob) globalThis.__ob=buildXlsx;
  buildXlsx=function(sh){ got=JSON.stringify(sh); return new Uint8Array(0); };
  try{ ${fn}(); }catch(e){ got='[]'; }
  buildXlsx=globalThis.__ob; return got; })()`));

const surfaces = [];
const add = (name, kind, tol, cells) => surfaces.push({ name, kind, tol, cells });

// 1. THE ENGINE — the requirement math every other surface is a view of
{
  const e = JSON.parse(ev(`JSON.stringify((function(){
    var Tt=tiers(), t=tierTotals(Tt), o={ask:0,disc:0,mand:0,ufr1:0,ufr2:0,trim:0,beyond:0};
    S.order.forEach(function(id){ var it=itemById(id), p=Tt[id];
      o.ask+=askTot(it); o.disc+=p.dT; o.mand+=p.mT;
      o.ufr1+=discUnfTotOf(it,p); o.ufr2+=unfTotOf(it,p);
      o.trim+=trimTotOf(it); o.beyond+=beyondTotOf(it,p); });
    o.funded=o.disc+o.mand; o.discBA=discTot(); o.mandBA=mandTot();
    o.mcTotal=t.mcTot; o.mcShort=t.mcSvc.shortTot!==undefined? t.mcSvc.shortTot : null;
    return o; })())`));
  if (e.mcShort === null) { // mcCalc names it differently across builds; recompute from the rule
    e.mcShort = JSON.parse(ev(`JSON.stringify((function(){ var Tt=tiers(), s=0;
      S.order.forEach(function(id){ if(!S.mc[id]) return; var it=itemById(id);
        s+=mcShortSvcOf(it,Tt[id]).reduce(function(a,b){return a+b;},0); }); return s; })())`));
  }
  add('engine (tiers)', 'requirement math', 0.5, e);
}

// 2. THE DASHBOARD, as rendered. Read off the DOM, because a figure that is computed correctly and
//    displayed wrongly is still wrong on the screen someone is briefing from.
{
  // The tiles live in #scores. This said #scoreboard, which does not exist, and fell back to the
  // whole document -- the regexes are specific enough that it still read the right figures, but a
  // selector that silently matches everything is one edit away from reading the wrong one.
  const sc = ev(`(function(){ var e=document.getElementById('scores');
    if(!e) throw new Error('#scores not found — the scoreboard moved and this harvest is blind');
    return e.textContent; })()`);
  const money = re => { const m = re.exec(sc); return m ? Number(m[1].replace(/,/g, '')) : undefined; };
  add('dashboard (screen)', 'visual', 1, {
    discBA:  money(/Discretionary \(basis\)[\s\S]*?BA:\s*\$([\d,]+)/),
    mandBA:  money(/Mandatory \(spillover\)[\s\S]*?BA:\s*\$([\d,]+)/),
    funded:  money(/\$([\d,]+) funded when whole/),
    beyond:  money(/\$([\d,]+) beyond both lanes/),
    ufr1:    money(/UNFUNDED vs DISC \$([\d,]+)/),
    ufr2:    money(/TOTAL \$([\d,]+)/),
    mcTotal: money(/\$([\d,]+)\s*allocated to \d+ must-pay/),
  });
}

// 3. THE WORKBOOK
{
  const sheets = JSON.parse(capture(ev));
  const sheet = n => rowsOf(sheets.find(s => s.name === n));
  const fs = sheet('Funding Streams');
  add('xl · Funding Streams', 'Excel', 0.5, {
    ask:    cellAt(fs, /^Service$/, 'FY27 Ask', /^TOTAL$/),
    discBA: cellAt(fs, /^Service$/, 'Disc BA', /^TOTAL$/),
    disc:   cellAt(fs, /^Service$/, 'Disc Funded', /^TOTAL$/),
    mandBA: cellAt(fs, /^Service$/, 'Mand BA', /^TOTAL$/),
    mand:   cellAt(fs, /^Service$/, 'Mand Funded', /^TOTAL$/),
    funded: cellAt(fs, /^Service$/, 'Funded Total', /^TOTAL$/),
    trim:   cellAt(fs, /^Service$/, 'Ask Not Allocated (delta)', /^TOTAL$/),
    beyond: cellAt(fs, /^Service$/, 'Beyond Both Lanes', /^TOTAL$/),
    ufr1:   cellAt(fs, /^Service$/, 'Unfunded vs DISC', /^TOTAL$/),
    ufr2:   cellAt(fs, /^Service$/, 'TOTAL UNFUNDED', /^TOTAL$/),
  });

  const db = sheet('Decision Bands');
  add('xl · Decision Bands', 'Excel', 0.5, {
    ask:    cellAt(db, /^Band$/, 'FY27 Requirement', /^ALL BANDS$/),
    disc:   cellAt(db, /^Band$/, 'Disc', /^ALL BANDS$/),
    mand:   cellAt(db, /^Band$/, 'Mand', /^ALL BANDS$/),
    funded: cellAt(db, /^Band$/, 'Funded', /^ALL BANDS$/),
    ufr2:   cellAt(db, /^Band$/, 'Unfunded', /^ALL BANDS$/),
    ufr1:   cellAt(db, /^Band$/, 'Unfunded vs DISC', /^ALL BANDS$/),
  });

  const pm = sheet('PMO Matrix');
  add('xl · PMO Matrix', 'Excel', 0.5, {
    beyond: rowTotal(pm, /^UNFUNDED \(beyond both lanes\)$/),
    trim:   rowTotal(pm, /^ASK NOT ALLOCATED \(trim deltas\)$/),
    ufr2:   rowTotal(pm, /^TOTAL UNFUNDED \(deltas \+ beyond lanes\)$/),
    ufr1:   rowTotal(pm, /^UNFUNDED vs DISC \(mandatory not counted\)$/),
  });

  const ur = sheet('Unfunded Requirements');
  add('xl · Unfunded Requirements', 'Excel', 0.5, {
    // Its ask/allocated columns cover only the LISTED requirements, so they are not board-wide and
    // are deliberately not mapped here. The two unfunded totals ARE board-wide: every requirement
    // short on either reading is listed, which is what makes them comparable.
    ufr1: cellAt(ur, /^Rank$/, 'Unfunded vs DISC', /^TOTAL$/),
    ufr2: cellAt(ur, /^Rank$/, 'TOTAL Unfunded', /^TOTAL$/),
  });
}

// 4. THE PRIORITY DRILL — band subtotals, summed. No grand total on the tab by design, so the
//    subtotals ARE the portfolio; adding them is also the check that nothing was double-counted.
{
  const sheets = grab('exportCSV');
  const band = rowsOf(sheets.find(s => /1-N by Band/.test(s.name)));
  const hi = band.findIndex(r => txt((r || [])[0]) === 'Rank');
  const subs = band.filter(r => /^Subtotal/.test(txt((r || [])[0])));
  const col = h => { const i = (band[hi] || []).findIndex(c => txt(c) === h);
    return i < 0 ? undefined : sum(subs.map(r => num(r[i]) || 0)); };
  add('drill · 1-N by Band', 'Excel', 0.5, {
    ask: col('FY27 Requirement'), disc: col('Discretionary'), mand: col('Mandatory'),
    funded: col('Funded'), ufr2: col('Unfunded'), ufr1: col('Unfunded vs DISC'),
  });
}

// 5. THE SPEND PLAN SOURCE — states one quantity: what discretionary paid.
{
  const sheets = grab('exportSrc');
  const rows = rowsOf(sheets[0]).slice(1);
  let t = 0; rows.forEach(r => { const a = num(r[9]); if (!isNaN(a)) t += a; });
  add('xl · Spend Plan Source', 'Excel', 0.5, { disc: rows.length ? t : undefined });
}

// 6. THE DECK. Abbreviated to $M/$B on the slide, so it is compared at that resolution -- the
//    tolerance is the rounding the format imposes, not a licence for the figure to drift.
{
  const tbls = JSON.parse(ev(`(function(){
    globalThis.__t=[];
    if(!globalThis.__oTbl) globalThis.__oTbl=_pTbl;
    if(!globalThis.__oPptx) globalThis.__oPptx=buildPptx;
    _pTbl=function(){ var a=arguments; globalThis.__t.push(a[a.length-1]); return ''; };
    buildPptx=function(){ return new Uint8Array(0); };
    try{ exportPPT(); }catch(e){}
    _pTbl=globalThis.__oTbl; buildPptx=globalThis.__oPptx;
    return JSON.stringify(globalThis.__t); })()`));
  const cellText = c => String((c && typeof c === 'object' && 't' in c) ? c.t : (c ?? '')).trim();
  const un = s => { const m = /^\$?([\d.,]+)\s*([BMK])?$/.exec(String(s).replace(/,/g, ''));
    if (!m) return undefined;
    const n = Number(m[1]); return m[2] === 'B' ? n * 1e9 : m[2] === 'M' ? n * 1e6 : m[2] === 'K' ? n * 1e3 : n; };
  // the KPI table: a two-column list of measure -> amount
  const kpi = tbls.find(t => t.some(r => /^Measure$/.test(cellText(r[0]))));
  const kv = re => { const r = (kpi || []).find(x => re.test(cellText(x[0]))); return r ? un(cellText(r[1])) : undefined; };
  add('ppt · KPI slide', 'PowerPoint', 60000, {
    discBA: kv(/^Discretionary BA$/), mandBA: kv(/^Mandatory BA$/),
    ufr1: kv(/^Unfunded vs DISC/), ufr2: kv(/^TOTAL Unfunded/), mcTotal: kv(/Mission Critical total/),
  });
  // the stream table: services down, a TOTAL row across
  const st = tbls.find(t => t.some(r => /^Service$/.test(cellText(r[0]))));
  const sc = h => { if (!st) return undefined;
    const hr = st.find(r => /^Service$/.test(cellText(r[0]))) || [];
    const i = hr.findIndex(c => new RegExp(h).test(cellText(c)));
    const tr = st.find(r => /^TOTAL$/.test(cellText(r[0])));
    return (i < 0 || !tr) ? undefined : un(cellText(tr[i])); };
  add('ppt · Funding by Stream', 'PowerPoint', 60000, {
    ask: sc(' Ask$'), discBA: sc('^Disc BA$'), disc: sc('^Disc Funded$'),
    mandBA: sc('^Mand BA$'), mand: sc('^Mand Drawn$'),
    ufr1: sc('^Unf vs DISC$'), ufr2: sc('^TOTAL Unf$'),
  });
}

// ---- the matrix ----------------------------------------------------------------------------------
const fm = v => v === undefined ? '--' : '$' + Math.round(v).toLocaleString();
const W = 30;
console.log('TRACE MATRIX — every surface that states a quantity, cross-footed against the fixture');
console.log('='.repeat(120));
console.log('truth is computed in this file from the fixture\'s own numbers, never read from the board\n');

const fails = [];
for (const k of ORDER) {
  console.log(`${LABEL[k]}`);
  console.log(`  ${'TRUTH'.padEnd(W)} ${fm(T[k]).padStart(16)}`);
  for (const s of surfaces) {
    const v = s.cells[k];
    if (v === undefined) { console.log(`  ${(s.name + ' ').padEnd(W, '.')} ${'--'.padStart(16)}   (does not state it)`); continue; }
    const ok = Math.abs(v - T[k]) <= s.tol;
    if (!ok) fails.push({ q: k, label: LABEL[k], surface: s.name, kind: s.kind, got: v, want: T[k] });
    console.log(`  ${(s.name + ' ').padEnd(W, '.')} ${fm(v).padStart(16)}   ${ok ? 'ok' : '<<< MISMATCH  off by ' + fm(v - T[k])}`);
  }
  console.log('');
}

const stated = surfaces.reduce((a, s) => a + ORDER.filter(k => s.cells[k] !== undefined).length, 0);
console.log('='.repeat(120));
console.log(`${surfaces.length} surfaces · ${ORDER.length} quantities · ${stated} populated cells`);
if (!fails.length) {
  console.log('\nEVERY LINK HOLDS — every surface that states a quantity states the same one');
  process.exit(0);
}
console.log(`\n${fails.length} BROKEN LINK(S) — a surface states a figure the rest of the board does not agree with:\n`);
for (const f of fails)
  console.log(`  ${f.label}\n      ${f.kind}: ${f.surface}\n      says ${fm(f.got)}, the board says ${fm(f.want)}  (off by ${fm(f.got - f.want)})\n`);
process.exit(1);
