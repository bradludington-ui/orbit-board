// Audit the PowerPoint export against tiers() and the stated Mission Critical rules.
//
//   MC Total    = sum of MC-designated requirement/ask values
//   MC shortage = requirement/ask value - discretionary allocated  (per service, mandatory ignored)
//
// Slide cells are pre-formatted money strings, so every expectation is formatted with the page's
// own fSM() and compared as text — which is exactly what a reader sees on the slide.
import { boot, seed } from './boot.mjs';

const EPS = 0.005;
const failures = [];
const chk = (scenario, slide, what, got, want) => {
  if (String(got) !== String(want)) failures.push({ scenario, slide, what, got, want });
};

const sum = a => a.reduce((x, y) => x + y, 0);

// Capture the table rows exportPPT builds, instead of the XML they turn into.
function capturePpt(ev) {
  ev(`
    globalThis.__tbls = [];
    globalThis.__titles = [];
    if (!globalThis.__origTbl) globalThis.__origTbl = _pTbl;
    if (!globalThis.__origTitle) globalThis.__origTitle = _pTitle;
    _pTbl = function(){ var a=arguments; globalThis.__tbls.push(a[a.length-1]); return ''; };
    _pTitle = function(t){ globalThis.__titles.push(t); return globalThis.__origTitle.apply(null, arguments); };
    if (!globalThis.__origBuildPptx) globalThis.__origBuildPptx = buildPptx;
    buildPptx = function(){ return new Uint8Array(0); };
    exportPPT();
    _pTbl = globalThis.__origTbl; _pTitle = globalThis.__origTitle;
    'ok';
  `);
  return {
    tables: JSON.parse(ev('JSON.stringify(globalThis.__tbls)')),
    titles: JSON.parse(ev('JSON.stringify(globalThis.__titles)')),
  };
}

const SVC3 = ['STOVL', 'CV', 'CTOL'];
const mk = (id, grp, ask, extra = {}) => ({
  id, grp, team: grp, sect: '', custom: false, title: id + ' title', event: id + ' event',
  ccar: '', fy26: ask.map(() => 0), ask, alloc: null, ...extra,
});

const SCENARIOS = {
  // Plain board: discretionary runs dry, spill to mandatory, some unfunded. No trims.
  'auto lanes': {
    services: SVC3,
    items: [mk('A', 'ATL', [50, 20, 10]), mk('B', 'PSM', [40, 30, 5]), mk('C', 'AV', [30, 10, 20])],
    disc: [60, 25, 12], mand: [40, 20, 10],
    order: ['A', 'B', 'C'], mc: { C: true },
  },
  // A starred requirement TRIMMED on the board. Its ask and its allocation differ, which is
  // where a total built on the allocation parts company with the stated rule.
  'mc trimmed': {
    services: SVC3,
    items: [mk('A', 'ATL', [50, 20, 10]), mk('B', 'PSM', [40, 30, 5])],
    disc: [60, 25, 12], mand: [40, 20, 10],
    order: ['A', 'B'], mc: { B: true },
    alloc: { B: { m: 's', v: [20, 10, 2] } },
  },
  // A starred requirement carried entirely by the mandatory lane.
  'mc on mandatory': {
    services: SVC3,
    items: [mk('A', 'ATL', [60, 25, 12]), mk('B', 'PSM', [40, 30, 5])],
    disc: [60, 25, 12], mand: [50, 40, 10],
    order: ['A', 'B'], mc: { B: true },
  },
  // Over-allocated in one service, short in another: the only shape where flooring the MC
  // shortage per service differs from flooring it once on the totals.
  'mc over-allocated one service': {
    services: ['STOVL', 'CV'],
    items: [mk('A', 'ATL', [40, 30])],
    disc: [100, 50], mand: [0, 0],
    order: ['A'], mc: { A: true },
    alloc: { A: { m: 's', v: [60, 5] } },
  },
  // A starred requirement zeroed out on the board. Its allocation is nothing, but it is still
  // must-pay and its full ask belongs in the total — so it has to stay on the slide.
  'mc zeroed out': {
    services: SVC3,
    items: [mk('A', 'ATL', [50, 20, 10]), mk('B', 'PSM', [40, 30, 5])],
    disc: [60, 25, 12], mand: [40, 20, 10],
    order: ['A', 'B'], mc: { B: true },
    alloc: { B: { m: 't', v: 0 } },
  },
  'cost elements': {
    services: SVC3,
    items: [mk('A', 'ATL', [50, 20, 10]), mk('B', 'PSM', [40, 30, 5]), mk('C', 'AV', [30, 10, 20])],
    disc: [60, 25, 12], mand: [40, 20, 10],
    order: ['A', 'B', 'C'], mc: { C: true },
    alloc: { C: { m: 's', v: [25, 8, 15] } },
    costElems: true, costElem: { A: 'Airframe PGSE', B: 'Engine PGSE', C: 'Airframe PGSE' },
  },
};

for (const [name, sc] of Object.entries(SCENARIOS)) {
  const { ev, errors } = boot();
  if (sc.costElems) ev(`DATA.costElems = true;`);
  seed(ev, sc);
  if (sc.costElem) ev(`S.costElem = ${JSON.stringify(sc.costElem)};`);

  const T = JSON.parse(ev('JSON.stringify(tiers())'));
  const { tables, titles } = capturePpt(ev);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  const SVC = sc.services, ids = sc.order;
  const askArr = id => sc.items.find(x => x.id === id).ask;
  const askOf = id => sum(askArr(id));
  const fSM = v => ev(`fSM(${v})`);            // the page's own money formatter
  const vecSum = f => { const v = SVC.map(() => 0); ids.forEach(id => f(T[id]).forEach((x, i) => v[i] += x)); return v; };
  const allD = vecSum(p => p.d), allM = vecSum(p => p.m), allU = vecSum(p => p.u);
  const allAsk = SVC.map((s, i) => ids.reduce((a, id) => a + askArr(id)[i], 0));

  const mcIds = ids.filter(id => sc.mc && sc.mc[id]);
  const mcTotalRule = mcIds.reduce((a, id) => a + askOf(id), 0);
  const mcShortRule = mcIds.reduce((a, id) => a + sum(SVC.map((s, i) =>
    Math.max(0, askArr(id)[i] - T[id].d[i]))), 0);

  const cellText = c => (c && typeof c === 'object' ? c.t : c);
  const findRow = (tbl, label) => tbl && tbl.find(r => r.some(c => String(cellText(c)).includes(label)));

  // ---- slide 1: the KPI table ----
  const kpi = tables.find(t => t && t.some(r => r.some(c => String(cellText(c)).includes('Discretionary BA'))));
  if (kpi) {
    const val = label => { const r = findRow(kpi, label); return r ? cellText(r[1]) : null; };
    chk(name, 'KPI', 'Discretionary funded', val('Discretionary funded'), fSM(sum(allD)));
    chk(name, 'KPI', 'Mandatory drawn', val('Mandatory drawn'), fSM(sum(allM)));
    chk(name, 'KPI', '★ Mission Critical total == sum of MC ask values',
      val('Mission Critical total'), fSM(mcTotalRule));
    // the headline gap, and the program floor built on it
    chk(name, 'KPI', '★ MC short == ask - discretionary allocated (mandatory NOT netted off)',
      val('MC short vs discretionary'), mcShortRule > 0.5 ? fSM(mcShortRule) : 'none');
    chk(name, 'KPI', 'PROGRAM FLOOR == Disc BA + MC short',
      val('PROGRAM FLOOR'), fSM(sum(sc.disc) + mcShortRule));
  }

  // ---- slide 2: funding by stream and service ----
  const fs = tables.find(t => t && t.some(r => String(cellText(r[0])) === 'Service'));
  if (fs) {
    SVC.forEach((s, i) => {
      const r = fs.find(x => String(cellText(x[0])) === s); if (!r) return;
      chk(name, 'Funding by Stream', `${s} Ask`, cellText(r[1]), fSM(allAsk[i]));
      chk(name, 'Funding by Stream', `${s} Disc Funded`, cellText(r[3]), fSM(allD[i]));
      chk(name, 'Funding by Stream', `${s} Mand Drawn`, cellText(r[5]), fSM(allM[i]));
    });
  }

  // ---- the Mission Critical slide ----
  const mcTbl = tables.find(t => t && t.some(r => r.some(c => String(cellText(c)).includes('TOTAL ★ MISSION CRITICAL'))));
  if (mcTbl) {
    const tr = findRow(mcTbl, 'TOTAL ★ MISSION CRITICAL');
    chk(name, 'Mission Critical', 'TOTAL == sum of MC ask values', cellText(tr[4]), fSM(mcTotalRule));
    chk(name, 'Mission Critical', 'TOTAL row short == ask - discretionary allocated',
      cellText(tr[5]), mcShortRule > 0.5 ? fSM(mcShortRule) : '—');
    const sr = findRow(mcTbl, 'MC SHORT of the discretionary lane');
    if (sr) chk(name, 'Mission Critical', 'short summary row == the same figure',
      cellText(sr[5]), mcShortRule > 0.5 ? fSM(mcShortRule) : 'none');
    // each listed row carries that requirement's ask value, and its gap against discretionary
    mcIds.forEach(id => {
      const grp = sc.items.find(x => x.id === id).grp;
      const r = mcTbl.find(x => String(cellText(x[1])) === grp);
      if (!r) {
        failures.push({ scenario: name, slide: 'Mission Critical', what: `${id} is starred but has no row`, got: 'absent', want: 'listed' });
        return;
      }
      chk(name, 'Mission Critical', `${id} row == its ask value`, cellText(r[4]), fSM(askOf(id)));
      const short = sum(SVC.map((s2, i) => Math.max(0, askArr(id)[i] - T[id].d[i])));
      chk(name, 'Mission Critical', `${id} row short == ask - discretionary allocated`,
        cellText(r[5]), short > 0.5 ? fSM(short) : '—');
    });
  } else if (mcIds.length) {
    failures.push({ scenario: name, slide: 'Mission Critical', what: 'slide missing entirely', got: 'none', want: 'a slide' });
  }

  // ---- the Unfunded slide ----
  const uTbl = tables.find(t => t && t.some(r => r.some(c => String(cellText(c)).includes('TOTAL UNFUNDED'))));
  if (uTbl) {
    const tr = findRow(uTbl, 'TOTAL UNFUNDED');
    const unfRule = ids.reduce((a, id) => {
      const askT = askOf(id), fundedT = T[id].dT + T[id].mT;
      return a + T[id].uT + Math.max(0, askT - sum(SVC.map((s, i) => T[id].d[i] + T[id].m[i] + T[id].u[i])));
    }, 0);
    chk(name, 'Unfunded', 'TOTAL == sum of (ask - disc - mand)', cellText(tr[5]), fSM(unfRule));
  }

  // ---- the Cost Element rollup slide ----
  if (sc.costElems) {
    const ce = tables.find(t => t && t.some(r => String(cellText(r[0])) === 'Cost Element'));
    if (!ce) {
      failures.push({ scenario: name, slide: 'CE rollup', what: 'slide missing', got: 'none', want: 'a slide' });
    } else {
      const rows = ce.filter(r => String(cellText(r[0])) !== 'Cost Element');
      // cells are already fSM strings in the board's own units; parse the suffix, don't rescale
      const parse = t => {
        const x = String(t).replace(/[$,]/g, '').trim();
        if (x === '—' || x === '') return 0;
        const mul = /M$/i.test(x) ? 1e6 : /K$/i.test(x) ? 1e3 : 1;
        return parseFloat(x) * mul;
      };
      chk(name, 'CE rollup', 'discretionary column == board discretionary',
        fSM(sum(rows.map(r => parse(cellText(r[2]))))), fSM(sum(allD)));
      chk(name, 'CE rollup', 'mandatory column == board mandatory',
        fSM(sum(rows.map(r => parse(cellText(r[3]))))), fSM(sum(allM)));
      chk(name, 'CE rollup', 'requirement count == requirements on the board',
        sum(rows.map(r => Number(cellText(r[1])))), ids.length);
    }
  }

  // NOTE: exportPPT carries a '---- 3: PMO rollup ----' comment with no code beneath it, so the
  // deck ships no PMO slide. That is a missing slide, not wrong arithmetic, and is raised with the
  // user rather than failed here -- a permanently red check teaches people to ignore the suite.
}

console.log('\n' + '='.repeat(96));
if (!failures.length) { console.log('ALL CHECKS PASSED'); process.exit(0); }
const by = {};
failures.forEach(f => { const k = f.scenario + ' | ' + f.slide; (by[k] ||= []).push(f); });
console.log(`${failures.length} FAILING CHECK(S)\n`);
for (const [k, fs] of Object.entries(by)) {
  console.log(`--- ${k}`);
  fs.forEach(f => console.log(`    ${f.what}\n        slide shows ${f.got}   should be ${f.want}`));
}
process.exit(1);
