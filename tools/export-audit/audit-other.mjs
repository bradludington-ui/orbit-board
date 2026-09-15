// Audit the two remaining exports that do lane / Mission Critical math:
//   exportCSV      — the Priority Drill workbook (1-N by band, plus a tab per PMO)
//   execSynopsis   — the Executive Funding Synopsis (CSV)
//
//   exportSrc      — the Spend Plan Source workbook, whose Amount column IS lane arithmetic
//
// The remaining Excel exports (ACE Tie-Out, Chart of Accounts, ATR/BTR Log, CR Cash Return) carry no
// lane, MC or unfunded arithmetic — they reconcile against imported sources — so they are not
// covered here. The Spend Plan Source used to be on that list and no longer belongs on it: its
// Amount column is now what DISCRETIONARY paid, straight out of the lane walk. While it was listed
// there it had no money check at all, and changing its basis moved a fixture total from 285 to 150
// with all twelve suites still green.
import { boot, seed, cv } from './boot.mjs';

const failures = [];
const chk = (scenario, where, what, got, want) => {
  const ok = typeof got === 'number' && typeof want === 'number'
    ? Math.abs(got - want) <= 0.005 : String(got) === String(want);
  if (!ok) failures.push({ scenario, where, what, got, want });
};
const sum = a => a.reduce((x, y) => x + y, 0);
const txt = c => String((c && typeof c === 'object' && 'v' in c ? c.v : c) ?? '');
const numOf = c => { const v = (c && typeof c === 'object' && 'v' in c) ? c.v : c; return typeof v === 'number' ? v : NaN; };

function captureDrill(ev) {
  ev(`globalThis.__s=null;
      if(!globalThis.__ob) globalThis.__ob=buildXlsx;
      buildXlsx=function(sheets){ globalThis.__s=sheets; return new Uint8Array(0); };
      exportCSV();
      buildXlsx=globalThis.__ob; 'ok'`);
  return JSON.parse(ev('JSON.stringify(globalThis.__s)'));
}

// execSynopsis writes a CSV into a Blob; record the text instead of downloading it.
function captureSynopsis(ev) {
  ev(`globalThis.__csv=null;
      if(!globalThis.__oB) globalThis.__oB=Blob;
      Blob=function(parts){ globalThis.__csv=String(parts&&parts[0]||''); return new globalThis.__oB(parts); };
      execSynopsis();
      Blob=globalThis.__oB; 'ok'`);
  const raw = ev('globalThis.__csv') || '';
  // the writer quotes every cell and escapes " as ""
  return raw.replace(/^﻿/, '').split('\r\n').map(line => {
    const out = []; let cur = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',') { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur); return out;
  });
}

const SVC3 = ['STOVL', 'USMC CV', 'CTOL'];
const mk = (id, grp, ask, extra = {}) => ({
  id, grp, team: grp, sect: '', custom: false, title: id + ' title', event: id + ' event',
  ccar: '', fy26: ask.map(() => 0), ask, alloc: null, ...extra,
});

const SCENARIOS = {
  'auto lanes': {
    services: SVC3,
    items: [mk('A', 'ATL', [50, 20, 10]), mk('B', 'PSM', [40, 30, 5]), mk('C', 'AV', [30, 10, 20])],
    disc: [60, 25, 12], mand: [40, 20, 10],
    order: ['A', 'B', 'C'], mc: { C: true },
  },
  // PRIMES is NOT on the configured GROUPS list: its requirement must still get a tab and its
  // dollars must still be in the by-PMO summary.
  'pmo off the configured list': {
    services: SVC3,
    items: [mk('PRIME-3', 'PRIMES', [90, 10, 20]), mk('A', 'ATL', [40, 20, 10])],
    disc: [70, 15, 12], mand: [40, 20, 10],
    order: ['PRIME-3', 'A'], mc: { 'PRIME-3': true },
  },
  // starred and short, starred and fully covered, and a trim
  'mc mixed': {
    services: SVC3,
    items: [mk('A', 'ATL', [30, 10, 5]), mk('B', 'PSM', [40, 30, 5]), mk('C', 'AV', [20, 10, 10])],
    disc: [35, 15, 8], mand: [20, 10, 5],
    order: ['A', 'B', 'C'], mc: { A: true, C: true },
    alloc: { C: { m: 's', v: [15, 6, 6] } },
  },
  // over-allocated in one service, short in another
  'over-allocated one service': {
    services: ['STOVL', 'USMC CV'],
    items: [mk('A', 'ATL', [40, 30])],
    disc: [100, 50], mand: [0, 0],
    order: ['A'], mc: { A: true },
    alloc: { A: { m: 's', v: [60, 5] } },
  },
};

for (const [name, sc] of Object.entries(SCENARIOS)) {
  const { ev, errors } = boot();
  seed(ev, sc);
  const T = JSON.parse(ev('JSON.stringify(tiers())'));
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  const SVC = sc.services, ids = sc.order;
  const askArr = id => sc.items.find(x => x.id === id).ask;
  const askOf = id => sum(askArr(id));
  const unfOf = id => sum(SVC.map((s, i) => Math.max(0, askArr(id)[i] - T[id].d[i] - T[id].m[i])));
  const mcShortOf = id => sum(SVC.map((s, i) => Math.max(0, askArr(id)[i] - T[id].d[i])));
  const mcIds = ids.filter(id => sc.mc && sc.mc[id]);
  const discBA = sum(sc.disc);

  // ---------------- the Priority Drill ----------------
  const sheets = captureDrill(ev);
  const summary = sheets[0];

  // every office on the board gets a tab, including one not on the configured GROUPS list
  const grps = [...new Set(ids.map(id => sc.items.find(x => x.id === id).grp))];
  grps.forEach(g => {
    if (!sheets.some(sh => sh.name === g.slice(0, 31)))
      failures.push({ scenario: name, where: 'Priority Drill', what: `no tab for PMO ${g}`, got: 'absent', want: 'a tab' });
  });

  // the by-PMO summary must add to its own TOTAL row
  {
    const hdr = summary.rows.findIndex(r => txt(r[0]) === 'FUNDED BY PMO AND BAND');
    if (hdr < 0) failures.push({ scenario: name, where: 'Priority Drill', what: 'by-PMO block missing', got: 'absent', want: 'present' });
    else {
      const after = summary.rows.slice(hdr + 2);
      const totIdx = after.findIndex(r => txt(r[0]) === 'TOTAL');
      const pmoRows = after.slice(0, totIdx);
      const totRow = after[totIdx];
      const last = r => numOf(r[r.length - 1]);
      chk(name, 'Priority Drill', 'by-PMO rows add to the TOTAL row',
        sum(pmoRows.map(last)), last(totRow));
      chk(name, 'Priority Drill', 'by-PMO TOTAL == funded on the board',
        last(totRow), ids.reduce((a, id) => a + T[id].dT + T[id].mT, 0));
    }
  }

  // The whole-order tab's TWO unfunded columns, each floored per service, each read BY NAME.
  //
  // This used to ask only whether the floored value appeared SOMEWHERE among the row's numbers
  // (`cells.some(...)`). That is satisfiable by any other cell that happens to carry the same
  // figure -- and when the second unfunded reading was added as a column, it carried exactly that
  // figure on every row where mandatory drew nothing. So a mutation that netted the Unfunded column
  // ACROSS services went on passing: the value it was looking for had simply moved next door.
  // "Somewhere on the row" is not a column check.
  {
    const whole = sheets[1];
    const wh = whole.rows.find(r => txt(r[0]).trim() === 'Rank') || [];
    const wcol = h => {
      const i = wh.findIndex(c => txt(c).trim() === h);
      if (i < 0) failures.push({ scenario: name, where: 'Priority Drill',
        what: `no column headed "${h}" on the whole-order tab`, got: 'missing', want: 'present' });
      return i;
    };
    const cU = wcol('Unfunded'), cU1 = wcol('Unfunded vs DISC');
    ids.forEach(id => {
      const grp = sc.items.find(x => x.id === id).grp;
      const r = whole.rows.find(x => txt(x[1]) === grp || txt(x[2]) === grp);
      if (!r) return;
      // READING #2, floored per service. Netting it across services instead cancels a service
      // funded past its ask against another that is short -- which is the whole reason it is
      // floored -- so an over-allocated scenario is what makes this check bite.
      if (cU >= 0) chk(name, 'Priority Drill', `${id}: Unfunded column floored per service`,
        numOf(r[cU]), unfOf(id));
      // READING #1, the same flooring one lane earlier.
      if (cU1 >= 0) chk(name, 'Priority Drill', `${id}: Unfunded vs DISC column floored per service`,
        numOf(r[cU1]), sum(SVC.map((s, i) =>
          Math.max(0, (sc.items.find(x => x.id === id).ask[i] || 0) - T[id].d[i]))));
    });
  }

  // ---------------- the Executive Synopsis ----------------
  const csv = captureSynopsis(ev);
  const row = label => csv.find(r => r.some(c => c.includes(label)));
  const money = t => { const x = String(t).replace(/[$,]/g, '').trim(); return x ? parseFloat(x) : NaN; };
  {
    const mcRow = row('★ MC requirements');
    if (!mcRow) failures.push({ scenario: name, where: 'Exec Synopsis', what: 'MC block missing', got: 'absent', want: 'present' });
    else {
      chk(name, 'Exec Synopsis', '★ MC count == starred requirements on the board',
        Number(mcRow[2]), mcIds.length);
      chk(name, 'Exec Synopsis', '★ MC requirement value == sum of MC ask values',
        money(mcRow[5]), mcIds.reduce((a, id) => a + askOf(id), 0));
    }
    const shRow = row('short of the discretionary lane');
    if (shRow) chk(name, 'Exec Synopsis', '★ MC short == ask - discretionary allocated',
      money(shRow[5]), mcIds.reduce((a, id) => a + mcShortOf(id), 0));
    const pf = row('PROGRAM FLOOR');
    if (pf) chk(name, 'Exec Synopsis', 'PROGRAM FLOOR == Disc BA + MC short',
      money(pf[3]), discBA + mcIds.reduce((a, id) => a + mcShortOf(id), 0));
    const uf = row('Requirements with unfunded portions');
    if (uf) chk(name, 'Exec Synopsis', 'unfunded total floored per service',
      money(uf[5]), ids.reduce((a, id) => a + unfOf(id), 0));
  }
}

// ══ THE SPEND PLAN SOURCE SENDS WHAT DISCRETIONARY PAID, AND NOTHING ELSE ═══════════════
// Every expectation here is computed from the SCENARIO's own numbers, never read back out of the
// board: a lane walk this suite performs itself. An oracle that asks the code under test will
// agree with it.
{
  const name = 'spend plan source';
  const mkI = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false,
    title: id + ' title', event: id + ' event', ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
  // Lanes that BIND: R1 is covered by discretionary, R2 straddles into mandatory, R3 gets nothing.
  const SV = ['A', 'B'], DISC = [100, 50], MAND = [40, 20];
  const ITEMS = [mkI('R1', 'PSM', [80, 30]), mkI('R2', 'AV', [60, 40]), mkI('R3', 'MxS', [50, 25])];
  const sc = { services: SV, items: ITEMS, disc: DISC, mand: MAND, order: ['R1', 'R2', 'R3'] };

  // the oracle: a greedy per-service walk, written out here rather than imported from the board
  const dRem = DISC.slice(), mRem = MAND.slice();
  const discOf = {}, fundedOf = {};
  ITEMS.forEach(it => {
    let d = 0, m = 0;
    it.ask.forEach((v, i) => {
      const dd = Math.min(v, Math.max(0, dRem[i])); dRem[i] -= dd;
      const mm = Math.min(v - dd, Math.max(0, mRem[i])); mRem[i] -= mm;
      d += dd; m += mm;
    });
    discOf[it.id] = d; fundedOf[it.id] = d + m;
  });
  const discTotal = sum(Object.values(discOf));          // 150
  const fundedTotal = sum(Object.values(fundedOf));      // 210

  const { ev } = boot();
  seed(ev, sc);
  ev(`S.awards['R1']={mode:'single',d:FYMON[0][0],day:9};
      S.awards['R2']={mode:'single',d:FYMON[2][0],day:9};
      S.awards['R3']={mode:'single',d:FYMON[3][0],day:9}; 'ok'`);

  const srcAmounts = view => JSON.parse(ev(`(function(){
    scenView=${JSON.stringify(view)};
    var got='[]';
    if(!globalThis.__ob2) globalThis.__ob2=buildXlsx;
    buildXlsx=function(sheets){ got=JSON.stringify(sheets); return new Uint8Array(0); };
    try{ exportSrc(); }catch(e){ got='[]'; }
    buildXlsx=globalThis.__ob2; scenView='';
    return got; })()`));
  const totalsOf = pack => {
    const sh = pack[0] || {}, rows = (sh.rows || sh.data || []).slice(1);
    let t = 0; const by = {};
    rows.forEach(r => { const a = numOf(r[9]), k = txt(r[3]);
      if (!isNaN(a)) { t += a; by[k] = (by[k] || 0) + a; } });
    return { t, by };
  };
  const N = totalsOf(srcAmounts('')), D = totalsOf(srcAmounts('disc'));

  chk(name, 'amount', 'the Amount column totals what DISCRETIONARY paid', N.t, discTotal);
  // The two numbers that must NOT come out, each a real defect this replaced:
  chk(name, 'amount', 'it is not the allocation basis, which carries unfunded dollars',
    N.t === sum(ITEMS.map(it => sum(it.ask))) ? 'allocation basis (unfunded money exported)' : 'no', 'no');
  chk(name, 'amount', 'and it is not disc+mand either', N.t === fundedTotal ? 'disc+mand' : 'no', 'no');
  chk(name, 'amount', 'a wholly unfunded requirement contributes no money at all',
    N.by['R3 event'] || 0, 0);
  chk(name, 'amount', 'a straddling requirement sends only its discretionary draw',
    N.by['R2 event'] || 0, discOf.R2);
  // p.d cannot move with the view -- tiers() draws discretionary before it touches mandatory -- so
  // this export needs no [DISC-ONLY] marker. That is a property to hold, not a coincidence.
  chk(name, 'view', 'identical under the discretionary-only view', D.t, N.t);
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
