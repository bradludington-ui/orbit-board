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
// EVERY NAMED SCENARIO MUST RUN. A block appended after process.exit() never executes and reads as
// a pass -- the proposal scenario in audit-import.mjs sat there for a whole verification round and
// five mutations aimed at it survived. chk() records every scenario it hears from; at the summary,
// any `const name = '...'` in this file it never heard from is a failure, not a pass.
import { readFileSync as _selfRead } from 'node:fs';
import { fileURLToPath as _selfPath } from 'node:url';
const SEEN = new Set();
const chk = (scenario, where, what, got, want) => {
  SEEN.add(scenario);
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

// ══ THE SPEND PLAN SOURCE SENDS WHAT THE LANES PAID, EACH LANE ON ITS OWN LINE ═════════════
// Discretionary only until v1.83; the owner then ruled that a requirement funded from both pots
// carries both lines. It is still never the allocation -- that defect is in the register.
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

  chk(name, 'amount', 'the Amount column totals what the lanes PAID, discretionary + mandatory', N.t, fundedTotal);
  // The two numbers that must NOT come out, each a real defect:
  chk(name, 'amount', 'it is not the allocation basis, which carries unfunded dollars',
    N.t === sum(ITEMS.map(it => sum(it.ask))) ? 'allocation basis (unfunded money exported)' : 'no', 'no');
  chk(name, 'amount', 'and it is not discretionary alone -- the mandatory lines are there',
    N.t === discTotal ? 'discretionary only (mandatory dropped)' : 'no', 'no');
  chk(name, 'amount', 'a wholly unfunded requirement contributes no money at all',
    N.by['R3 event'] || 0, 0);
  chk(name, 'amount', 'a straddling requirement sends its discretionary AND its mandatory draw',
    N.by['R2 event'] || 0, fundedOf.R2);
  // ...ON SEPARATE LINES: R2 draws both pots on both services, so it is four lines, each carrying
  // one lane's money -- never one line per service with the two lanes summed into it.
  const r2 = (srcAmounts('')[0].rows || []).slice(1).filter(r => txt(r[3]) === 'R2 event').map(r => numOf(r[9])).sort((a, b) => a - b);
  chk(name, 'lines', 'a requirement drawing both pots on both services is four lines', r2.length, 4);
  chk(name, 'lines', 'each line is one lane on one service', JSON.stringify(r2), JSON.stringify([20, 20, 20, 40]));
  chk(name, 'budget', 'with no BAE list loaded, every Budget cell is BLANK -- never a made-up name',
    (srcAmounts('')[0].rows || []).slice(1).filter(r => txt(r[4]).trim()).length, 0);
  // p.d cannot move with the view -- tiers() draws discretionary before it touches mandatory -- so
  // this export needs no [DISC-ONLY] marker. That is a property to hold, not a coincidence.
  chk(name, 'view', 'identical under the discretionary-only view', D.t, N.t);
}

// ═══ THE TWO SPEND PLANS — what the A vs B tab STATES ═══════════════════════════════════════
// audit-recon cross-foots the money on the Plan A and Plan B tabs and skips this one, because the
// comparison tab is a summary with no TOTAL row to foot against. That left it with no checks at
// all — so when two identity columns were inserted into the middle of it, nothing in the repo
// could tell whether they landed where they were meant to or pushed every figure one column left.
//
// A column count is the whole risk here. The widths array and the header row are written in two
// different places and a workbook whose widths are one short still opens, still cross-foots, and
// simply prints the wrong headings over the money.
{
  const name = 'the two spend plans — the A vs B tab';
  const SVC3 = ['USAF', 'ANG', 'STOVL'];
  const mk = (id, ask) => ({ id, grp: 'PSM', team: 'PSM', sect: '', custom: false,
    title: id + ' title', event: id + ' event', ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
  const { ev, errors } = boot();
  seed(ev, { services: SVC3,
    items: [mk('A', [900, 200, 100]), mk('B', [400, 100, 50]), mk('C', [300, 80, 40])],
    disc: [1000, 250, 120], mand: [400, 100, 50], order: ['A', 'B', 'C'] });
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  // A carries one award date, B carries three increments STORED OUT OF ORDER, C carries neither.
  // The increments are deliberately shuffled: the editor sorts on insert, but a month changed
  // afterwards leaves the array stale, and a list of dates in the wrong order reads as a schedule.
  ev(`
    S.ccar={A:'JSF1234', B:'JSF5678'};
    S.awards={ A:{mode:'single', d:'2026-10', day:9},
               B:{mode:'inc', d:'2027-01', inc:[{d:'2027-03',day:1,sv:[0,0,0]},
                                                {d:'2026-11',day:15,sv:[0,0,0]},
                                                {d:'2027-01',day:2,sv:[0,0,0]}]} };
    globalThis.__sp=null;
    if(!globalThis.__ob) globalThis.__ob=buildXlsx;
    buildXlsx=function(sheets){ globalThis.__sp=sheets; return new Uint8Array(0); };
    exportPlans();
    buildXlsx=globalThis.__ob; 'ok'`);
  const sheets = JSON.parse(ev('JSON.stringify(globalThis.__sp)'));
  const cmp = (sheets || []).filter(x => x.name === 'A vs B')[0];
  chk(name, 'tab', 'the comparison tab is in the workbook', cmp ? 'found' : 'missing', 'found');
  if (cmp) {
    const h = cmp.rows.findIndex(r => txt((r || [])[0]) === 'Rank');
    chk(name, 'tab', 'it has a header row', h >= 0 ? 'found' : 'missing', 'found');
    const hdr = (cmp.rows[h] || []).map(txt);
    // THE COUNT. Widths and headings are authored separately; one short and every figure on the
    // tab prints under the wrong heading in a workbook that opens perfectly.
    chk(name, 'tab', 'one column width per heading', cmp.cols.length, hdr.length);

    const at = k => hdr.indexOf(k);
    chk(name, 'placement', 'the CCaR record is stated', at('CCaR') >= 0, true);
    chk(name, 'placement', 'the award dates are stated', at('Award date(s)') >= 0, true);
    chk(name, 'placement', 'both sit after the requirement',
      at('CCaR') > at('Requirement') && at('Award date(s)') > at('Requirement'), true);
    chk(name, 'placement', 'and before the money',
      at('CCaR') < at('Allocated') && at('Award date(s)') < at('Allocated'), true);

    const rowOf = rank => (cmp.rows.slice(h + 1).filter(r => txt((r || [])[0]) === String(rank))[0] || []).map(txt);
    const cell = (rank, col) => rowOf(rank)[at(col)];
    // The board is the oracle for the record number, never the neighbouring column.
    SVC3.length && ['A', 'B', 'C'].forEach((id, i) => chk(name, 'ccar',
      `${id}: the CCaR is the board's own`, cell(i + 1, 'CCaR'), ev(`ccarOf(itemById('${id}'))`)));

    chk(name, 'award', 'a single award prints its day and month', cell(1, 'Award date(s)'), '9 OCT 26');
    // EVERY increment, OLDEST FIRST, however the array happens to be stored.
    chk(name, 'award', 'incremental funding lists every increment date, in order',
      cell(2, 'Award date(s)'), '15 NOV 26; 2 JAN 27; 1 MAR 27');
    chk(name, 'award', 'and it is not a count of them',
      /×|incremental/i.test(cell(2, 'Award date(s)')), false);
    chk(name, 'award', 'a requirement with no award date states nothing', cell(3, 'Award date(s)'), '');
    chk(name, 'ccar', 'and one with no record states nothing', cell(3, 'CCaR'), '');

    // The money the inserted columns sit beside still has to add up, which nothing checked before.
    let seen = 0;
    cmp.rows.slice(h + 1).forEach(r => {
      const a = numOf(r[at('Allocated')]), d = numOf(r[at('Disc allocated')]),
            m = numOf(r[at('Mand allocated')]);
      if (isNaN(a) || isNaN(d) || isNaN(m)) return;
      seen++;
      chk(name, 'money', `rank ${txt(r[0])}: Disc allocated + Mand allocated = Allocated`, d + m, a);
    });
    chk(name, 'money', 'and there were rows to check', seen, 3);
  }
}

// ═══ THE BUDGET NAMES — verbatim, per service AND lane, by the owner's rule (v1.83) ═════════════
// The owner's rule of 23 Sep 2026, checked line by line on the Spend Plan Source: a requirement
// drawing both pots carries a line per lane per service, each on its own budget; CAM is automatic
// and CONG only ever by hand; an office's lane-less name serves both lanes; OCO is never automatic;
// a name with no PMO is a LEGACY budget and is never used, even when it was chosen. Every line's
// amount is DISTINCT, so the amount identifies the line, and the budget it must carry is written
// here from the scenario -- never read back from the board.
{
  const name = 'budget names — the owner’s rule';
  try {
  const SV = ['USAF', 'ANG', 'STOVL'];
  const mkI = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false,
    title: id + ' title', event: id + ' event', ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
  // Walk: USAF disc 117 = A 101 + D 11 + E 5. ANG disc 57 all to A; A's other 23 and all of B (17)
  // and C (29) spill to mandatory (69). STOVL disc 37 to A; A's other 13 to mandatory.
  const sc = { services: SV,
    items: [mkI('A', 'AV', [101, 80, 50]), mkI('B', 'MxS', [0, 17, 0]), mkI('C', 'CDS', [0, 29, 0]),
            mkI('D', 'PP', [11, 0, 0]), mkI('E', 'AV', [5, 0, 0])],
    disc: [117, 57, 37], mand: [0, 69, 13], order: ['A', 'B', 'C', 'D', 'E'] };
  const OM = ['USAF O&M - ANG', 'USAF O&M - ANG CAM', 'USAF O&M - ANG CAM Discretionary AV',
    'USAF O&M - ANG CAM OBBBA Mandatory AV', 'USAF O&M - ANG CAM Discretionary MxS',
    'USAF O&M - ANG CAM OBBBA Mandatory MxS', 'USAF O&M - ANG CAM CDS', 'USAF O&M - ANG CAM CONG CDS', 'USAF O&M NON AFRC NON ANG',
    'USAF O&M- BOS', 'USAF O&M- CAM', 'USAF O&M- CAM Discretionary AV', 'USAF O&M - CAM OBBBA Mandatory AV',
    'USAF O&M- CAM CONG AV', 'USAF O&M- CAM Discretionary PP', 'USMC STOVL O&M -1A9A',
    'USMC STOVL O&M -1A9A FL Discretionary AV', 'USMC STOVL O&M -1A9A AV', 'USMC STOVL O&M -1A9B AV',
    'USMC STOVL O&M - 1A9A (OCO) AV', 'USMC STOVL O&M -1A9A CDS'];
  const FF = ['USMC STOVL APN Full Fund SUPT', 'USMC STOVL APN Full Fund SUPT OTHER ILS Discretionary AV',
    'USMC STOVL APN Full Fund SUPT Depot Software Discretionary AV', 'USMC STOVL APN Full Fund SUPT Depot Standup Discretionary AV',
    'USMC STOVL APN Full Fund SUPT PES Discretionary AV', 'USMC STOVL APN Full Fund SUPT CONG AV'];
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  // D was pointed at a LEGACY name by hand; E at a CONG budget by hand. A carries CCaR JSF1, and the
  // last pull files it under 1A9B -- the one fact that settles A's STOVL mandatory line, where two
  // ordinary lane-less 1A9x names fit.
  ev(`BUDDB={ts:1700000000009, files:[], rows:${JSON.stringify(OM.concat(FF))}.map(budParseName).filter(Boolean)};
      _budRegCache=null;
      S.budgetAsg={D:{'USAF|disc':'USAF O&M- CAM'}, E:{'USAF|disc':'USAF O&M- CAM CONG AV'}};
      S.ccar={A:'JSF1'};
      globalThis.__dcs=divCcarSide; divCcarSide=function(){ return {by:{'JSF1':{buds:{'USMC STOVL O&M -1A9B AV':1}}}, rows:1}; };
      _budCcMemo=null; 'ok'`);
  const pack = JSON.parse(ev(`(function(){ var got='[]';
    if(!globalThis.__ob3) globalThis.__ob3=buildXlsx;
    buildXlsx=function(sheets){ got=JSON.stringify(sheets); return new Uint8Array(0); };
    try{ exportSrc(); }catch(e){ got='[]'; }
    buildXlsx=globalThis.__ob3; return got; })()`));
  const lines = ((pack[0] || {}).rows || []).slice(1).map(r => ({ amt: numOf(r[9]), bud: txt(r[4]) }));
  chk(name, 'lines', 'one line per service per lane that carries money', lines.length, 9);
  chk(name, 'lines', 'and together they are exactly what the lanes paid', lines.reduce((t, l) => t + l.amt, 0), 293);
  const WANT = [
    [101, 'USAF O&M- CAM Discretionary AV',       'USAF discretionary AV takes CAM Discretionary, never CONG'],
    [57,  'USAF O&M - ANG CAM Discretionary AV',   'ANG discretionary AV: the ANG Discretionary name'],
    [23,  'USAF O&M - ANG CAM OBBBA Mandatory AV', 'the same requirement’s ANG MANDATORY line: its own budget'],
    [37,  'USMC STOVL O&M -1A9A FL Discretionary AV', 'STOVL discretionary AV: the one Discretionary name'],
    [13,  'USMC STOVL O&M -1A9B AV',               'STOVL mandatory AV: two lane-less names fit, never OCO; the CCaR pull decides'],
    [17,  'USAF O&M - ANG CAM OBBBA Mandatory MxS', 'ANG mandatory MxS: the Mandatory name'],
    [29,  'USAF O&M - ANG CAM CDS',                'ANG CDS: the office’s lane-less CAM name serves the mandatory line, never CONG'],
    [11,  '',                                      'a LEGACY name chosen by hand is never used: the line is blank'],
    [5,   'USAF O&M- CAM CONG AV',                 'a CONG budget chosen by hand is honoured'],
  ];
  WANT.forEach(([amt, bud, why]) => {
    const l = lines.filter(x => Math.abs(x.amt - amt) < 0.005);
    chk(name, 'budget', `$${amt} line — ${why}`, l.length === 1 ? l[0].bud : `${l.length} lines`, bud);
  });
  // THE PARSER, on the names the owner's own extracts carry
  const P = n => JSON.parse(ev(`JSON.stringify(budParseName(${JSON.stringify(n)}))`));
  chk(name, 'parse', '“NON AFRC NON ANG” is the active Air Force, not ANG', JSON.stringify((P('USAF O&M NON AFRC NON ANG') || {}).svc), '["USAF"]');
  chk(name, 'parse', 'Spares TrngDev is a Spares budget', (P('USMC STOVL APN Spares TrngDev AV') || {}).ap, 'sp');
  chk(name, 'parse', 'and hand-pick only', (P('USMC STOVL APN Spares TrngDev AV') || {}).hand, true);
  chk(name, 'parse', 'Modifications are out entirely', P('USMC STOVL APN Modifications Discretionary AV'), null);
  chk(name, 'parse', 'the funding line is read off the name', (P('USN APN Full Fund SUPT USMC CV Full Mission Sims TSS') || {}).line, 'FULL MISSION SIMS');
  // THE PICK LIST offers the hand-pick lines the rule never chooses, and never a legacy name
  const pick = JSON.parse(ev(`JSON.stringify(budPickList('A','USAF','disc').map(function(b){ return b.n; }))`));
  chk(name, 'pick list', 'a person may still choose CONG', pick.includes('USAF O&M- CAM CONG AV'), true);
  chk(name, 'pick list', 'but never a legacy name', pick.some(n => !JSON.parse(ev(`JSON.stringify(budUsable(${JSON.stringify(n)}))`))), false);
  chk(name, 'pick list', 'and a mandatory line is never offered a Discretionary name',
    JSON.parse(ev(`JSON.stringify(budPickList('A','ANG','mand').filter(function(b){ return b.dm==='disc'; }).length)`)), 0);
  // THE WARNING COMES BEFORE THE FILE. D's line has no budget, so the export must stop and ask --
  // and when the answer is no, no workbook is built at all.
  const warned = JSON.parse(ev(`(function(){ var built=false, msg='';
    var oc=window.confirm; window.confirm=function(m){ msg=String(m); return false; };
    if(!globalThis.__ob5) globalThis.__ob5=buildXlsx;
    buildXlsx=function(){ built=true; return new Uint8Array(0); };
    try{ exportSrc(); }catch(e){}
    buildXlsx=globalThis.__ob5; window.confirm=oc;
    return JSON.stringify({built:built, msg:msg}); })()`));
  chk(name, 'warning', 'a line without a Budget stops the export and says so', /no Budget/.test(warned.msg), true);
  chk(name, 'warning', 'and naming the requirement', warned.msg.includes(ev(`dispTitle(itemById('D'))`)), true);
  chk(name, 'warning', 'declined, no file is written', warned.built, false);
  // THE PRE-FLIGHT names the legacy choice
  const pf = JSON.parse(ev(`JSON.stringify((preflight().find||[]).filter(function(f){ return f.k==='legacy'; }).map(function(f){ return f.rows.map(function(r){ return r.id; }); }))`));
  chk(name, 'pre-flight', 'the legacy choice is listed for a fresh pick', JSON.stringify(pf), '[["D"]]');
  // FULL FUND follows the COST ELEMENT, one to one
  const ff = ce => ev(`(function(){ var ms=mySlug, dc=DATA.costElems; mySlug=function(){ return 'ff'; }; DATA.costElems=true;
    S.costElem={}; if(${JSON.stringify(ce)}) S.costElem.A=${JSON.stringify(ce)};
    try{ return budForRow('A','STOVL','disc'); } finally { mySlug=ms; DATA.costElems=dc; S.costElem={}; } })()`);
  chk(name, 'full fund', 'Other ILS Production → OTHER ILS', ff('Other ILS Production'), 'USMC STOVL APN Full Fund SUPT OTHER ILS Discretionary AV');
  chk(name, 'full fund', 'Depot Standup Software → Depot Software', ff('Depot Standup Software'), 'USMC STOVL APN Full Fund SUPT Depot Software Discretionary AV');
  chk(name, 'full fund', 'Depot Standup Air Vehicle → Depot Standup', ff('Depot Standup Air Vehicle'), 'USMC STOVL APN Full Fund SUPT Depot Standup Discretionary AV');
  chk(name, 'full fund', 'Production Engineering Support → PES', ff('Production Engineering Support'), 'USMC STOVL APN Full Fund SUPT PES Discretionary AV');
  chk(name, 'full fund', 'no cost element: nothing is guessed', ff(''), '');
  chk(name, 'cost element', 'Production Engineering Support is #8, right before Fixed JPO Support',
    ev(`COST_ELEMS.indexOf('Production Engineering Support')+':'+COST_ELEMS.indexOf('Fixed JPO Support')`), '7:8');
  ev(`divCcarSide=globalThis.__dcs; 'ok'`);
  } catch (e) {
    const msg = String((e && e.message) || e).split('\n')[0].slice(0, 140);
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + msg, got: 'threw', want: 'ran' });
  }
}

// ═══ THE TWO SPEND PLANS LIST EVERY REQUIREMENT (v1.83) ═══════════════════════════════════════
// A requirement neither plan funds -- nothing allocated -- was dropped from the panel and every tab,
// and the TOTAL line called it one that "asks for nothing". The owner found a $50M requirement
// missing that way. Every requirement is now a row, in rank order, and each tab's UNFUNDED line
// ties to the board's own two readings: Plan A to "vs discretionary", Plan B to the total.
{
  const name = 'the two spend plans — every requirement listed';
  try {
  const SV = ['USAF', 'ANG', 'STOVL'];
  const mk = (id, ask) => ({ id, grp: 'PSM', team: 'PSM', sect: '', custom: false,
    title: id + ' title', event: id + ' event', ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
  const { ev, errors } = boot();
  seed(ev, { services: SV,
    items: [mk('A', [900, 200, 100]), mk('B', [400, 100, 50]), mk('C', [300, 80, 40]), mk('U', [21, 4, 25]), mk('Z', [0, 0, 0])],
    disc: [1000, 250, 120], mand: [400, 100, 50], order: ['A', 'B', 'C', 'U', 'Z'] });
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  // U: nothing allocated to either pot -- the owner's #98. Z: a requirement worth nothing.
  ev(`S.fsrc['U']={m:'split', dv:[0,0,0], mv:[0,0,0]}; 'ok'`);
  const sheets = JSON.parse(ev(`(function(){ var got='[]';
    if(!globalThis.__ob4) globalThis.__ob4=buildXlsx;
    buildXlsx=function(sh){ got=JSON.stringify(sh); return new Uint8Array(0); };
    try{ exportPlans(); }catch(e){ got='[]'; }
    buildXlsx=globalThis.__ob4; return got; })()`));
  // the oracle: the board's own two unfunded readings, per service and floored
  const board = JSON.parse(ev(`(function(){ var T=tiers(), u1=0, u2=0;
    S.order.forEach(function(id){ var it=itemById(id), p=T[id]||{d:[],m:[]};
      SVC.forEach(function(sv,i){ var a=+(it.ask||[])[i]||0, d=+(p.d||[])[i]||0, m=+(p.m||[])[i]||0;
        u1+=Math.max(0,a-d); u2+=Math.max(0,a-d-m); }); });
    return JSON.stringify({u1:u1, u2:u2}); })()`));
  chk(name, 'oracle', 'the scenario: unfunded vs discretionary', board.u1, 850);
  chk(name, 'oracle', 'the scenario: unfunded against both lanes', board.u2, 300);
  [['PLAN A', board.u1], ['PLAN B', board.u2]].forEach(([tag, want]) => {
    const sh = (sheets || []).find(x => String(x.name).startsWith(tag));
    chk(name, tag, 'the tab is in the workbook', sh ? 'found' : 'missing', 'found');
    if (!sh) return;
    const h = sh.rows.findIndex(r => txt((r || [])[0]) === 'Rank');
    const hdr = (sh.rows[h] || []).map(txt), at = k => hdr.indexOf(k);
    const body = sh.rows.slice(h + 1).filter(r => /^\d+$/.test(txt((r || [])[0])));
    chk(name, tag, 'one column width per heading', sh.cols.length >= hdr.length, true);
    chk(name, tag, 'EVERY requirement on the board is a row', body.length, 5);
    // located by RANK, the board's own order -- U is fourth, Z fifth
    const rowOf = rk => (body.find(r => txt(r[0]) === String(rk)) || []);
    const U = rowOf(4), Z = rowOf(5);
    chk(name, tag, 'the fourth row is the unallocated requirement', txt(U[3]), ev(`dispTitle(itemById('U'))`));
    chk(name, tag, 'the unallocated requirement is listed', U.length ? 'listed' : 'missing', 'listed');
    chk(name, tag, 'its FY requirement is stated', numOf(U[at('FY27 Requirement')]), 50);
    chk(name, tag, 'all of it unfunded', numOf(U[at('Unfunded')]), 50);
    chk(name, tag, 'and it says so in words', txt(U[at('Status')]), 'NOT FUNDED — either plan');
    chk(name, tag, 'a requirement worth nothing says that instead', txt(Z[at('Status')]), 'NO REQUIREMENT');
    const unfRow = sh.rows.find(r => txt((r || [])[0]) === 'UNFUNDED') || [];
    chk(name, tag, 'the UNFUNDED line ties to the board', numOf(unfRow[unfRow.length - 1]), want);
    chk(name, tag, 'and the rows add up to it', body.reduce((t, r) => t + (numOf(r[at('Unfunded')]) || 0), 0), want);
    const tot = sh.rows.find(r => /^TOTAL/.test(txt((r || [])[0]))) || [];
    chk(name, tag, 'the TOTAL line counts every requirement, and names the unfunded one correctly',
      txt(tot[0]), 'TOTAL — 5 of 5 requirements (1 funded by neither plan)');
    chk(name, tag, 'nothing calls it a requirement that asks for nothing', /ask for nothing/i.test(txt(tot[0])), false);
  });
  const cmp = (sheets || []).find(x => x.name === 'A vs B');
  if (cmp) {
    const h = cmp.rows.findIndex(r => txt((r || [])[0]) === 'Rank');
    const hdr = (cmp.rows[h] || []).map(txt), at = k => hdr.indexOf(k);
    const body = cmp.rows.slice(h + 1).filter(r => /^\d+$/.test(txt((r || [])[0])));
    chk(name, 'A vs B', 'one column width per heading', cmp.cols.length, hdr.length);
    chk(name, 'A vs B', 'every requirement is a row', body.length, 5);
    const U = body.find(r => txt(r[0]) === '4') || [];
    chk(name, 'A vs B', 'the unallocated requirement: B unfunded is its whole requirement', numOf(U[at('B unfunded')]), 50);
    chk(name, 'A vs B', 'and both statuses say NOT FUNDED — either plan', txt(U[at('A status')]) + ' | ' + txt(U[at('B status')]),
      'NOT FUNDED — either plan | NOT FUNDED — either plan');
  } else chk(name, 'A vs B', 'the comparison tab is in the workbook', 'missing', 'found');
  // THE PANEL lists them too, with a filter of their own
  const panel = ev(`(function(){ planOpen=true; planOnly=''; planBody(); var h=(document.getElementById('planBody')||{}).innerHTML||''; planOpen=false; planBody(); return h; })()`);
  chk(name, 'panel', 'the panel lists the unallocated requirement', panel.includes(ev(`esc(dispTitle(itemById('U')))`)), true);
  chk(name, 'panel', 'with a “not funded by either plan” filter counting it', /Not funded by either plan<span class="n">1<\/span>/.test(panel), true);
  } catch (e) {
    const msg = String((e && e.message) || e).split('\n')[0].slice(0, 140);
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + msg, got: 'threw', want: 'ran' });
  }
}

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
