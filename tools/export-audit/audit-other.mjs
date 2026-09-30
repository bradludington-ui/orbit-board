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
import { boot, seed, cv, stopAtFirstFailure } from './boot.mjs';

const failures = [];
stopAtFirstFailure(failures);   // in the mutation sweep only: see boot.mjs
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

// ═══ THE BAE BUDGET IN THE RECORD PANEL (v1.91, item 35) ══════════════════════════════════════════
// Driven the way a person drives it: the rendered selects are changed and the rendered buttons are
// clicked. After every step EVERY line of the Spend Plan Source is held against what the panel says that
// line prints -- a panel showing one budget while the file carries another would be believed. The lines
// are told apart by their amounts, which are all distinct. The fixture is the owner's-rule block's, plus
// F: 16 of USAF asked after every USAF dollar is spent, so it starts unfunded and the steps below fund it
// by moving the USAF lanes -- discretionary, mandatory, or both.
{
  const name = 'v1.91 — the BAE budget in the RECORD panel';
  try {
  const J = JSON.stringify;
  const SV = ['USAF', 'ANG', 'STOVL'];
  const mkI = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false,
    title: id + ' title', event: id + ' event', ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
  const sc = { services: SV,
    items: [mkI('A', 'AV', [101, 80, 50]), mkI('B', 'MxS', [0, 17, 0]), mkI('C', 'CDS', [0, 29, 0]),
            mkI('D', 'PP', [11, 0, 0]), mkI('E', 'AV', [5, 0, 0]), mkI('F', 'AV', [16, 0, 0])],
    disc: [117, 57, 37], mand: [0, 69, 13], order: ['A', 'B', 'C', 'D', 'E', 'F'] };
  const OM = ['USAF O&M - ANG', 'USAF O&M - ANG CAM', 'USAF O&M - ANG CAM Discretionary AV',
    'USAF O&M - ANG CAM OBBBA Mandatory AV', 'USAF O&M - ANG CAM Discretionary MxS',
    'USAF O&M - ANG CAM OBBBA Mandatory MxS', 'USAF O&M - ANG CAM CDS', 'USAF O&M - ANG CAM CONG CDS', 'USAF O&M NON AFRC NON ANG',
    'USAF O&M- BOS', 'USAF O&M- CAM', 'USAF O&M- CAM Discretionary AV', 'USAF O&M - CAM OBBBA Mandatory AV',
    'USAF O&M- CAM CONG AV', 'USAF O&M- CAM Discretionary PP', 'USMC STOVL O&M -1A9A',
    'USMC STOVL O&M -1A9A FL Discretionary AV', 'USMC STOVL O&M -1A9A AV', 'USMC STOVL O&M -1A9B AV',
    'USMC STOVL O&M - 1A9A (OCO) AV', 'USMC STOVL O&M -1A9A CDS'];
  const DISC_AV = 'USAF O&M- CAM Discretionary AV', MAND_AV = 'USAF O&M - CAM OBBBA Mandatory AV',
    CONG_AV = 'USAF O&M- CAM CONG AV';
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  ev(`BUDDB={ts:1700000000011, files:[], rows:${J(OM)}.map(budParseName).filter(Boolean)};
      _budRegCache=null; S.budgetAsg={}; S.ccar={}; save(); render(); 'ok'`);
  const lanes = (d, m) => ev(`S.discSvc[0]=${d}; S.mandSvc[0]=${m}; render(); 'ok'`);
  const asg = id => ev(`JSON.stringify((S.budgetAsg||{})[${J(id)}]||null)`);
  // THE PANEL, as drawn: one entry per line
  const panel = id => JSON.parse(ev(`(function(){ setCur(${J(id)});
    var ins=document.getElementById('inspector');
    var rows=[].slice.call(ins.querySelectorAll('table.budtab tr')).map(function(tr){
      var th=tr.querySelector('th'), sel=tr.querySelector('select'), how=tr.querySelector('.budhow');
      return {svc:th.firstChild.textContent, lane:th.querySelector('.budlane').textContent, value:sel.value,
        title:sel.getAttribute('title')||'', first:sel.options[0].textContent,
        how:how.className.replace('budhow','').trim(), clear:!!tr.querySelector('button')}; });
    var all=ins.querySelector('.budfoot button'), fam=ins.querySelector('#budfam');
    return JSON.stringify({rows:rows, clearAll:all? all.textContent : '', fam:fam? fam.value : null,
      famOpts:fam? [].slice.call(fam.options).map(function(o){ return {v:o.value, t:o.textContent}; }) : [],
      none:[].slice.call(ins.querySelectorAll('.budnone')).map(function(e){ return e.textContent; }).join(' | ')}); })()`));
  const said = p => p.rows.map(r => r.lane + ':' + r.how + ':' + r.value).join(', ');
  // A PERSON'S HANDS: change a rendered select, click a rendered button
  const choose = (id, sel, value) => ev(`(function(){ setCur(${J(id)});
    var s=document.querySelector(${J(sel)}); if(!s) return 'no such picker';
    s.value=${J(value)}; if(s.value!==${J(value)}) return 'not offered';
    s.dispatchEvent(new Event('change')); return 'ok'; })()`);
  const line = label => '#inspector select[aria-label=' + J('BAE budget, ' + label) + ']';
  const click = (id, sel) => ev(`(function(){ setCur(${J(id)});
    var b=document.querySelector(${J(sel)}); if(!b) return 'no such button'; b.click(); return 'ok'; })()`);
  const clearBtn = label => '#inspector button[aria-label=' + J('Clear the ' + label + ' budget') + ']';
  // THE FILE, as exported
  const fileLines = () => {
    const pack = JSON.parse(ev(`(function(){ var got='[]';
      if(!globalThis.__ob7) globalThis.__ob7=buildXlsx;
      buildXlsx=function(sheets){ got=JSON.stringify(sheets); return new Uint8Array(0); };
      try{ exportSrc(); }catch(e){ got='[]'; }
      buildXlsx=globalThis.__ob7; return got; })()`));
    return ((pack[0] || {}).rows || []).slice(1).map(r => ({ t: txt(r[3]), amt: numOf(r[9]), bud: txt(r[4]) }));
  };
  const onFile = amt => { const l = fileLines().filter(x => Math.abs(x.amt - amt) < 0.005);
    return l.length === 1 ? l[0].bud : `${l.length} lines`; };
  // THE PANEL AND THE FILE AGREE, line for line: every funded line the panel draws for every requirement,
  // at the amount the lane walk paid it and on the budget its picker says the file prints.
  const agree = at => {
    const file = fileLines();
    const pan = JSON.parse(ev(`(function(){ var T=tiers(), out=[];
      S.order.forEach(function(id){ setCur(id); var p=T[id]||{};
        [].slice.call(document.querySelectorAll('#inspector table.budtab tr')).forEach(function(tr){
          var lane=tr.querySelector('.budlane').textContent, i=SVC.indexOf(tr.querySelector('th').firstChild.textContent);
          if(lane==='not funded yet') return;
          var t=tr.querySelector('select').getAttribute('title')||'';
          out.push({t:dispTitle(itemById(id)), amt:+(((lane==='mandatory')? p.m : p.d)||[])[i]||0,
            bud:t.indexOf('The file prints: ')===0? t.slice(17) : ''}); }); });
      return JSON.stringify(out); })()`));
    const key = l => l.t + ' $' + Math.round(l.amt) + ' ' + (l.bud || '(blank)');
    chk(name, at, 'every Spend Plan Source line is on the budget the panel names for it',
      file.map(key).sort().join(' | '), pan.map(key).sort().join(' | '));
  };

  // THE LINES
  let a = panel('A'), f = panel('F');
  chk(name, 'lines', 'a requirement drawing both lanes shows a line per service per lane',
    a.rows.map(r => r.svc + ' ' + r.lane).join(', '),
    'USAF discretionary, ANG discretionary, ANG mandatory, STOVL discretionary, STOVL mandatory');
  chk(name, 'lines', 'an unfunded requirement still shows its service, not funded yet',
    f.rows.map(r => r.svc + ' ' + r.lane).join(', '), 'USAF not funded yet');
  chk(name, 'lines', 'with nothing chosen, nothing to clear', f.rows[0].clear + ' · ' + (f.clearAll || 'no Clear all'), 'false · no Clear all');
  const ud = a.rows.find(r => r.svc === 'USAF' && r.lane === 'discretionary') || {};
  chk(name, 'rule', 'a line the rule settles says so, naming the budget the file prints', ud.how + ' · ' + ud.first,
    'rule · — the rule: ' + DISC_AV + ' —');
  const sm = a.rows.find(r => r.svc === 'STOVL' && r.lane === 'mandatory') || {};
  chk(name, 'not set', 'two lane-less names fit STOVL mandatory and no CCaR settles it: not set', sm.how, 'unset');
  chk(name, 'not set', 'and the file leaves that $13 line blank', onFile(13), '');
  agree('start');
  // FROM CCaR, AND A LEGACY CHOICE LEFT BY AN OLDER BOARD: the panel says what the file does in both
  ev(`S.ccar.A='JSF1'; globalThis.__dcs7=divCcarSide;
      divCcarSide=function(){ return {by:{'JSF1':{buds:{'USMC STOVL O&M -1A9B AV':1}}}, rows:1}; };
      _budCcMemo=null; S.budgetAsg.D={'USAF|disc':'USAF O&M- CAM'}; save(); render(); 'ok'`);
  const sc2 = panel('A').rows.find(r => r.svc === 'STOVL' && r.lane === 'mandatory') || {};
  chk(name, 'from CCaR', 'the CCaR pull settles STOVL mandatory, and the panel says so', sc2.how + ' · ' + onFile(13),
    'ccar · USMC STOVL O&M -1A9B AV');
  const dl = panel('D').rows[0] || {};
  chk(name, 'legacy', 'a legacy choice: the panel says pick again, and the file leaves the line blank', dl.how + ' · ' + onFile(11), 'legacy · ');
  agree('from CCaR, and a legacy choice');
  ev(`divCcarSide=globalThis.__dcs7; _budCcMemo=null; S.ccar={}; delete S.budgetAsg.D; save(); render(); 'ok'`);

  // A CHOICE WITH NO MONEY YET, then the money
  chk(name, 'unfunded', 'the unfunded line takes a budget from its picker', choose('F', line('USAF not funded yet'), CONG_AV), 'ok');
  chk(name, 'unfunded', 'kept under the service alone: the name carries no lane', asg('F'), J({ USAF: CONG_AV }));
  f = panel('F');
  chk(name, 'unfunded', 'the panel shows it chosen, with a clear and a Clear all',
    [f.rows[0].value, f.rows[0].how, f.rows[0].clear, f.clearAll].join(' · '), CONG_AV + ' · chosen · true · Clear all (1)');
  agree('an unfunded choice');
  lanes(133, 0);
  chk(name, 'funded', 'funded in discretionary, the line uses the choice', said(panel('F')), 'discretionary:chosen:' + CONG_AV);
  chk(name, 'funded', 'and the file prints it on F’s $16 line', onFile(16), CONG_AV);
  agree('funded after the choice');

  // A NAME CARRIES ITS OWN LANE
  lanes(117, 0);
  chk(name, 'lane', 'a mandatory name picked with no money yet', choose('F', line('USAF not funded yet'), MAND_AV), 'ok');
  chk(name, 'lane', 'is kept for the mandatory lane, replacing the earlier choice', asg('F'), J({ 'USAF|mand': MAND_AV }));
  chk(name, 'lane', 'and the unfunded line shows it chosen', said(panel('F')), 'not funded yet:chosen:' + MAND_AV);
  lanes(133, 0);
  f = panel('F');
  chk(name, 'lane', 'funded in discretionary instead, the line follows the rule: never a mandatory name on it',
    said(f) + ' · ' + onFile(16), 'discretionary:rule: · ' + DISC_AV);
  chk(name, 'lane', 'and the choice waits, unseen on any line but counted', f.clearAll, 'Clear all (1)');
  agree('the other lane');
  lanes(117, 16);
  chk(name, 'lane', 'funded in mandatory, the choice is used', said(panel('F')) + ' · ' + onFile(16), 'mandatory:chosen:' + MAND_AV + ' · ' + MAND_AV);
  agree('mandatory after the choice');
  lanes(133, 0);
  chk(name, 'clear all', '“Clear all” clears the choice no line shows', click('F', '#inspector .budfoot button') + ' · ' + asg('F'), 'ok · null');
  agree('cleared unseen');

  // ONE CHOICE, BOTH LANES; CLEAR ONE LINE
  lanes(117, 0);
  choose('F', line('USAF not funded yet'), CONG_AV);
  lanes(126, 7);
  chk(name, 'both lanes', 'a lane-less choice answers both of the lanes that pay F', said(panel('F')),
    'discretionary:chosen:' + CONG_AV + ', mandatory:chosen:' + CONG_AV);
  chk(name, 'both lanes', 'on the $9 and the $7 line alike', onFile(9) + ' · ' + onFile(7), CONG_AV + ' · ' + CONG_AV);
  agree('both lanes, one choice');
  chk(name, 'clear one line', 'the discretionary line’s clear', click('F', clearBtn('USAF discretionary')), 'ok');
  chk(name, 'clear one line', 'returns that line to the rule and leaves the mandatory line its choice',
    said(panel('F')) + ' · ' + asg('F'), 'discretionary:rule:, mandatory:chosen:' + CONG_AV + ' · ' + J({ 'USAF|mand': CONG_AV }));
  chk(name, 'clear one line', 'the file agrees on both', onFile(9) + ' · ' + onFile(7), DISC_AV + ' · ' + CONG_AV);
  agree('one line cleared');
  click('F', '#inspector .budfoot button');
  // THE PICKER'S OWN "back to the rule" does what the line's clear does, the lane-less choice included
  lanes(117, 0);
  choose('F', line('USAF not funded yet'), CONG_AV);
  lanes(126, 7);
  const back = (panel('F').rows.find(r => r.lane === 'mandatory') || {}).first || '';
  chk(name, 'back to the rule', 'a chosen line’s empty choice says it goes back to the rule, and to what',
    back, '— back to the rule: ' + MAND_AV + ' —');
  chk(name, 'back to the rule', 'chosen on the mandatory line', choose('F', line('USAF mandatory'), ''), 'ok');
  chk(name, 'back to the rule', 'the line follows the rule; the discretionary line keeps the choice',
    said(panel('F')) + ' · ' + asg('F'), 'discretionary:chosen:' + CONG_AV + ', mandatory:rule: · ' + J({ 'USAF|disc': CONG_AV }));
  agree('back to the rule from the picker');
  click('F', '#inspector .budfoot button');

  // THE FAMILY, THEN ONE LINE CHANGED, ONE CLEARED, ALL CLEARED
  a = panel('A');
  const fam = a.famOpts.find(o => /CAM Discretionary AV/.test(o.t)) || { v: '', t: 'none offered' };
  chk(name, 'family', 'the family picker offers the discretionary AV family, and says which services it covers',
    /2 of 3: USAF, ANG/.test(fam.t), true);
  chk(name, 'family', 'chosen', choose('A', '#inspector #budfam', fam.v), 'ok');
  chk(name, 'family', 'it sets each line it covers, in its own lane, and only those', asg('A'),
    J({ 'USAF|disc': DISC_AV, 'ANG|disc': 'USAF O&M - ANG CAM Discretionary AV' }));
  chk(name, 'family', 'and says which lines it could not set', /Not for ANG mand, STOVL, STOVL mand/.test(ev(`document.getElementById('shareStat').textContent`)), true);
  agree('a family');
  chk(name, 'change one line', 'one line changed from its own picker', choose('A', line('USAF discretionary'), CONG_AV), 'ok');
  chk(name, 'change one line', 'the $101 line moves with it', onFile(101), CONG_AV);
  agree('one line changed');
  chk(name, 'clear one line', 'its clear', click('A', clearBtn('USAF discretionary')), 'ok');
  chk(name, 'clear one line', 'returns it to the rule and leaves the other line alone',
    asg('A') + ' · ' + onFile(101), J({ 'ANG|disc': 'USAF O&M - ANG CAM Discretionary AV' }) + ' · ' + DISC_AV);
  agree('A line cleared');
  chk(name, 'clear all', '“— none —” on the family picker', choose('A', '#inspector #budfam', ''), 'ok');
  chk(name, 'clear all', 'clears every choice on the requirement', asg('A'), 'null');
  choose('A', '#inspector #budfam', fam.v);
  chk(name, 'clear all', 'and so does “Clear all”', panel('A').clearAll + ' · ' + click('A', '#inspector .budfoot button') + ' · ' + asg('A'),
    'Clear all (2) · ok · null');
  agree('all cleared');
  lanes(117, 0);
  const famF = panel('F').famOpts.find(o => /CAM Discretionary AV/.test(o.t)) || { v: '' };
  chk(name, 'family', 'on a requirement with no money yet, the family is kept in its own lane',
    choose('F', '#inspector #budfam', famF.v) + ' · ' + asg('F'), 'ok · ' + J({ 'USAF|disc': DISC_AV }));
  lanes(133, 0);
  chk(name, 'family', 'and used once the money arrives there', said(panel('F')), 'discretionary:chosen:' + DISC_AV);
  agree('a family chosen before the money');
  click('F', '#inspector .budfoot button');

  // SAVE AND REOPEN
  lanes(117, 0);
  choose('F', line('USAF not funded yet'), CONG_AV);
  choose('A', line('USAF discretionary'), CONG_AV);
  const kept = ev(`JSON.stringify(S.budgetAsg)`);
  const R = boot({ html: ev('buildSavedHtml()') });
  chk(name, 'reopen', 'every choice comes back from the saved file, the unfunded line’s included', R.ev(`JSON.stringify(S.budgetAsg)`), kept);
  // the fixture's requirements are seeded, not imported, so the reopened board is given them again --
  // without applyState(), which would start the plan over
  R.ev(`SVC.length=0; ${J(SV)}.forEach(function(s){ SVC.push(s); }); DATA.services=SVC;
    DATA.items.length=0; ${J(sc.items)}.forEach(function(i){ DATA.items.push(i); }); S.order=${J(sc.order)}; render(); 'ok'`);
  chk(name, 'reopen', 'and the reopened panel shows it', R.ev(`(function(){ setCur('F');
    var s=document.querySelector('#inspector table.budtab select'); return s? s.value : 'no picker'; })()`), CONG_AV);

  // ONE EDITOR FOR THE FIELD
  chk(name, 'one editor', 'Requirement edit no longer carries a budget field',
    ev(`JSON.stringify(recFields('A', itemById('A')).filter(function(f){ return f.l && /budget/i.test(f.l); }).map(function(f){ return f.l; }))`), '[]');
  chk(name, 'one editor', 'every budget picker in the RECORD panel is in its BAE budget section',
    ev(`(function(){ setCur('A'); return [].slice.call(document.querySelectorAll('#inspector select')).filter(function(s){
      return /setBudAsg|budUnfSet|setBudFam/.test(s.getAttribute('onchange')||'') && !s.closest('table.budtab') && s.id!=='budfam'; }).length; })()`), 0);

  // NO BAE LIST
  ev(`BUDDB={ts:1700000000012, files:[], rows:[]}; _budRegCache=null; render(); 'ok'`);
  a = panel('A');
  chk(name, 'no BAE', 'with no BAE list the panel says so, draws no picker, and offers the import',
    /No BAE list is loaded/.test(a.none) && a.rows.length === 0 && ev(`(function(){ setCur('A');
      var b=document.querySelector('#inspector .budnone button');
      return !!b && /budFile/.test(b.getAttribute('onclick')||'') && !!document.getElementById('budFile'); })()`) === true, true);
  } catch (e) {
    const msg = String((e && e.message) || e).split('\n')[0].slice(0, 140);
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + msg, got: 'threw', want: 'ran' });
  }
}

// ═══ THE IDS BATCH: BOTH LANES, AND A RECORD OF WHAT WAS SENT (v1.92, item 37) ═════════════════════
// Every line the file carries is written here from the scenario, never read back from the board. The
// walk (order A B D C F H): USAF disc 120 = A 100 + B 20; USAF mand 60 all to B; C's 40 and H's 10 find
// nothing. ANG disc 30 to A; ANG mand 40 = A 20 + D 20, D short 10. STOVL disc 10 to F, F short 15.
// So: A USAF discretionary only; A ANG and B USAF both lanes; D ANG mandatory only; C unfunded, sharing A's
// control number; F discretionary and partly unfunded; H unfunded with no CCaR number at all; E unfunded
// on its own control number, so its line is named only by its "not funded yet" line in the RECORD panel.
{
  const name = 'v1.92 — the IDS batch: both lanes, and a record of what was sent';
  try {
  const J = JSON.stringify;
  const SV = ['USAF', 'ANG', 'STOVL'];
  const mkI = (id, ask, ccar) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false,
    title: id + ' title', event: id + ' event', ccar, fy26: ask.map(() => 0), ask, alloc: null });
  const sc = { services: SV,
    items: [mkI('A', [100, 50, 0], 'JSF1'), mkI('B', [80, 0, 0], 'JSF2'), mkI('D', [0, 30, 0], 'JSF3'),
            mkI('C', [40, 0, 0], 'JSF1'), mkI('F', [0, 0, 25], 'JSF5'), mkI('H', [10, 0, 0], ''),
            mkI('E', [0, 20, 0], 'JSF4')],
    disc: [120, 30, 10], mand: [60, 40, 0], order: ['A', 'B', 'D', 'C', 'F', 'H', 'E'] };
  const UD = 'USAF O&M- CAM Discretionary AV', UM = 'USAF O&M - CAM OBBBA Mandatory AV',
    AD = 'USAF O&M - ANG CAM Discretionary AV', AM = 'USAF O&M - ANG CAM OBBBA Mandatory AV',
    SD = 'USMC STOVL O&M -1A9A FL Discretionary AV', CONG = 'USAF O&M- CAM CONG AV';
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  const REC = n => ({ t: 'Record ' + n, o: 'OPR', p: 'AV', d: 1, k: String(1000 + n) });
  ev(`MS.ccarIdx={rows:{JSF1:${J(REC(1))}, JSF2:${J(REC(2))}, JSF3:${J(REC(3))}, JSF4:${J(REC(4))}, JSF5:${J(REC(5))}, JSF6:${J(REC(6))}}};
      BUDDB={ts:1700000000031, files:[], rows:${J([UD, UM, AD, AM, SD, CONG])}.map(budParseName).filter(Boolean)};
      _budRegCache=null; S.budgetAsg={}; S.ccar={}; MS.ids={org:21}; save(); render(); 'ok'`);
  const DAY = ev('idsDay()');
  // THE FILE, as exported (and the export's side effects on the record)
  const exportIt = () => JSON.parse(ev(`(function(){ var got=null, o=buildXlsx;
    buildXlsx=function(s){ got=s; return new Uint8Array(0); };
    try{ exportIdsReq(); }catch(e){ got=[{name:'THREW '+e.message, rows:[]}]; } buildXlsx=o; return JSON.stringify(got); })()`));
  const linesOf = sheets => (((sheets || [])[0] || {}).rows || []).slice(1).map(r => r.map(c => c && typeof c === 'object' ? c.v : c));
  const show = L => L.map(r => `${r[4]} · ${r[5]} · ${r[6]}/${r[7]} · ${r[1]} · ${r[8]}`).join(' | ');
  const rowsNow = () => JSON.parse(ev(`JSON.stringify(idsReqRows())`));

  // BOTH LANES, EACH ON ITS OWN BUDGET
  const WANT = [
    [AD, 1001, 30, 30],     // A ANG discretionary: 50 asked, 20 of it paid by mandatory -> 30/30
    [AD, 1004, 20, 0],      // E ANG, no money: its not-funded-yet line, the discretionary rule's budget
    [AM, 1001, 20, 20],     // A ANG mandatory: Amount = Approved = the mandatory draw
    [AM, 1003, 30, 20],     // D ANG mandatory only: the whole requirement rides its one line, 10 short
    [UM, 1002, 60, 60],     // B USAF mandatory
    [UD, 1001, 140, 100],   // A USAF discretionary 100/100 + C unfunded 40/0 on the same control number
    [UD, 1002, 20, 20],     // B USAF discretionary: 80 asked, 60 of it paid by mandatory
    [SD, 1005, 25, 10],     // F STOVL discretionary: the unfunded 15 rides the discretionary line
  ];
  let R = rowsNow();
  chk(name, 'lines', 'a line per service per lane, each on its own budget, Amounts and Approveds as written',
    R.rows.map(r => `${r.bud} · ${r.ctl} · ${r.amt}/${r.app}`).join(' | '),
    WANT.map(w => `${w[0]} · ${w[1]} · ${w[2]}/${w[3]}`).join(' | '));
  chk(name, 'lines', 'the mandatory draws are in the file: every dollar the board funds, less none',
    R.rows.reduce((t, r) => t + r.app, 0), 260);
  chk(name, 'lines', 'the file’s Amounts plus what is held back add to every requirement on the board',
    R.rows.reduce((t, r) => t + r.amt, 0) + R.skip.reduce((t, k) => t + k.ask, 0), 355);
  chk(name, 'lines', 'and its Approveds plus what is held back to what the board funds',
    R.rows.reduce((t, r) => t + r.app, 0) + R.skip.reduce((t, k) => t + k.app, 0),
    +ev(`(function(){ var T=tiers(), n=0; S.order.forEach(function(id){ var t=T[id]; if(!t) return;
      (t.d||[]).forEach(function(v){ n+=v; }); (t.m||[]).forEach(function(v){ n+=v; }); }); return n; })()`));
  chk(name, 'lines', 'no Amount below its Approved', R.rows.filter(r => r.amt + 0.005 < r.app).length, 0);
  chk(name, 'held back', 'a requirement with no CCaR number is held back, named with its lane',
    R.skip.map(k => `${k.id} ${k.svc} ${k.lane || 'unfunded'} ${k.ask}/${k.app} · ${k.why}`).join(' | '),
    'H USAF unfunded 10/0 · no CCaR number on the requirement');
  // EVERY LINE IS ONE THE RECORD PANEL NAMES: its budget, from the panel as drawn
  const panelSays = JSON.parse(ev(`(function(){ var out=[];
    S.order.forEach(function(id){ setCur(id); var ctl=ccarCtlOf(itemById(id)).v; if(!ctl) return;
      [].slice.call(document.querySelectorAll('#inspector table.budtab select')).forEach(function(s){
        var t=s.getAttribute('title')||'', m=/(?:The file prints|the IDS batch files it under): (.+)$/.exec(t);
        if(m) out.push(m[1]+' · '+ctl); }); });
    return JSON.stringify(out.filter(function(v,i,a){ return a.indexOf(v)===i; }).sort()); })()`));
  chk(name, 'panel', 'every line’s budget is the one the RECORD panel names for it',
    J(R.rows.map(r => `${r.bud} · ${r.ctl}`).sort()), J(panelSays));
  // A LANE-LESS BUDGET SERVING BOTH LANES folds them into one line: IDS takes a control number once per budget
  ev(`S.budgetAsg.B={USAF:${J(CONG)}}; save(); render(); 'ok'`);
  R = rowsNow();
  chk(name, 'one budget', 'B’s two lanes on one lane-less budget are one line, both lanes’ money in it',
    R.rows.filter(r => r.ctl === '1002').map(r => `${r.bud} ${r.amt}/${r.app}`).join(' | '), CONG + ' 80/80');
  ev(`delete S.budgetAsg.B; save(); render(); 'ok'`);
  // A BUDGET CHOSEN ON A "NOT FUNDED YET" LINE is the one its IDS line goes under -- chosen in the panel
  chk(name, 'unfunded', 'E’s not-funded-yet line takes a mandatory budget from its picker', ev(`(function(){ setCur('E');
    var s=document.querySelector('#inspector select[aria-label="BAE budget, ANG not funded yet"]'); if(!s) return 'no picker';
    s.value=${J(AM)}; if(s.value!==${J(AM)}) return 'not offered'; s.dispatchEvent(new Event('change')); return 'ok'; })()`), 'ok');
  chk(name, 'unfunded', 'and E’s line goes under it', rowsNow().rows.filter(r => r.ctl === '1004').map(r => `${r.bud} ${r.amt}/${r.app}`).join(' | '), AM + ' 20/0');
  ev(`delete S.budgetAsg.E; save(); render(); 'ok'`);

  // THE FIRST EXPORT: ALL ADD, AND RECORDED
  let F1 = linesOf(exportIt());
  chk(name, 'first', 'the first batch: every line Add, “New Requirement”, ORG 21, the working year',
    F1.map(r => r[1] + '/' + r[8] + '/' + r[2] + '/' + r[3]).filter((v, i, a) => a.indexOf(v) === i).join(', '),
    'Add/New Requirement/21/2027');
  chk(name, 'first', 'Ref No runs 1..N', F1.map(r => r[0]).join(','), WANT.map((_, i) => i + 1).join(','));
  chk(name, 'first', 'the file id is today’s first', ev(`idsCfg().issued.join(',')`), DAY + '-0001');
  chk(name, 'first', 'and the batch is recorded, line by line',
    ev(`JSON.stringify(idsCfg().sent.map(function(b){ return b.fid+':'+b.lines.length; }))`), J([DAY + '-0001:8']));
  // THE SAME LINES AGAIN: ALL UPDATE, AND THE ID MOVES ON BY ITSELF
  chk(name, 'again', 'the next file id is taken by itself', ev('idsFileId()'), DAY + '-0002');
  let F2 = linesOf(exportIt());
  chk(name, 'again', 'the same lines again: every one Update, “Updated requirement”',
    F2.map(r => r[1] + '/' + r[8]).filter((v, i, a) => a.indexOf(v) === i).join(', '), 'Update/Updated requirement');
  // A NEW REQUIREMENT IS ADD; A LINE THAT VANISHED IS LISTED, NOT DELETED
  ev(`DATA.items.push(${J(mkI('G', [0, 0, 5], 'JSF6'))}); S.order.push('G');
      itemById('F').ccar=''; save(); render(); 'ok'`);
  const S3 = exportIt(), F3 = linesOf(S3);
  chk(name, 'third', 'a new requirement goes as Add, the rest as Update',
    F3.map(r => `${r[5]}:${r[1]}`).sort().join(' '), ['1001:Update', '1001:Update', '1001:Update', '1002:Update', '1002:Update', '1003:Update', '1004:Update', '1006:Add'].join(' '));
  const notEx = ((S3[1] || {}).rows || []).map(r => r.map(c => c && typeof c === 'object' ? c.v : c).join(' | ')).join(' || ');
  chk(name, 'third', 'a line sent before and missing now is listed on Not exported, for a Delete by hand',
    /SENT BEFORE, NOT IN THIS BATCH[\s\S]*USMC STOVL O&M -1A9A FL Discretionary AV \| 1005 \| 25 \| 10 \| \d{8}-0002/.test(notEx), true);
  // FORGET A BATCH THAT WAS NEVER UPLOADED: ITS LINES GO BACK TO ADD
  ev(`window.confirm=function(){ return true; }; idsForget(${J(DAY + '-0003')}); 'ok'`);
  R = rowsNow();
  chk(name, 'forget', 'the forgotten batch’s only line goes back to Add; the others stay Update',
    R.rows.map(r => `${r.ctl}:${r.act}`).sort().join(' '), ['1001:Update', '1001:Update', '1001:Update', '1002:Update', '1002:Update', '1003:Update', '1004:Update', '1006:Add'].join(' '));
  chk(name, 'forget', 'and its file id stays used', ev(`idsCfg().issued.join(',')`), [1, 2, 3].map(n => DAY + '-000' + n).join(','));
  // A TYPED SEQUENCE WINS FOR THE DAY; ONE ALREADY ISSUED IS REFUSED
  ev(`idsSet('seq','7'); 'ok'`);
  chk(name, 'file id', 'a typed sequence is used', ev('idsFileId()'), DAY + '-0007');
  exportIt();
  chk(name, 'file id', 'and after it the next is taken by itself again', ev('idsFileId()'), DAY + '-0008');
  const refused = JSON.parse(ev(`(function(){ var n=idsCfg().issued.length, msg=''; idsSet('seq','2');
    var oa=window.alert; window.alert=function(m){ msg=String(m); };
    var o=buildXlsx, built=false; buildXlsx=function(){ built=true; return new Uint8Array(0); };
    try{ exportIdsReq(); }catch(e){} buildXlsx=o; window.alert=oa;
    return JSON.stringify({built:built, issued:idsCfg().issued.length-n, said:/already been issued/.test(msg)}); })()`));
  chk(name, 'file id', 'an id this board already issued is refused, and nothing is written or recorded', J(refused), J({ built: false, issued: 0, said: true }));
  ev(`idsSet('seq',''); 'ok'`);
  // ANOTHER APPROPRIATION'S IDS COUNT: A1 IS UNIQUE ACROSS EVERY FILE
  ev(`(function(){ var k=Object.keys(_SLUGMAP).filter(function(x){ return x!==_AP.slug; })[0];
    localStorage.setItem(_SLUGMAP[k].key, JSON.stringify({years:{}, ids:{issued:[${J(DAY + '-0020')}]}})); })(); 'ok'`);
  chk(name, 'file id', 'an id issued in another appropriation is never handed out again', ev('idsFileId()'), DAY + '-0021');
  // THE RECORD TRAVELS WITH THE BOARD, AND NOT INTO A PMO COPY
  const kept = ev(`JSON.stringify({i:idsCfg().issued, s:idsCfg().sent.map(function(b){ return b.fid; })})`);
  const RB = boot({ html: ev('buildSavedHtml()') });
  chk(name, 'saved', 'the record and the issued ids come back from a saved file',
    RB.ev(`JSON.stringify({i:idsCfg().issued, s:idsCfg().sent.map(function(b){ return b.fid; })})`), kept);
  const copy = ev(`(function(){ var h=buildSavedHtml({refOnly:true}); var m=/<script type="application\\/json" id="pubState">([\\s\\S]*?)<\\/script>/.exec(h);
    var st=JSON.parse(m[1]).appns[_AP.slug]; return JSON.stringify({sent:!!(st.ids&&st.ids.sent), issued:((st.ids||{}).issued||[]).length}); })()`);
  chk(name, 'copy', 'a PMO copy carries the ids issued (-0001, -0002, -0003, -0007) but not the record of batches', copy, J({ sent: false, issued: 4 }));
  } catch (e) {
    const msg = String((e && e.message) || e).split('\n')[0].slice(0, 140);
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + msg, got: 'threw', want: 'ran' });
  }
}

// ═══ SAVE DIAGNOSTICS HOLDS NO FIGURE, TITLE OR NAME (v1.92, item 18) ═══════════════════════════════
// A board filled with values nobody could mistake -- two titles, one of them made only of words the program
// itself uses, plan events, a CCaR record, a PID, a budget name, two people, a figure -- is driven through
// real warnings that name them (a budget choice cleared, a store the browser refused, a store unreadable on
// opening, a RECORD panel that failed to draw) and a planted script error, and one message names everything at
// once along with a file and a person the board never held. None of those values may reach the file, and
// none the board holds may stay in the list it keeps in memory. The version and the counts must be there.
// The file is exactly what the box showed; Cancel and Esc write nothing; a PMO copy says what it is and
// whose, and keeps the same values out; a one-appropriation file says so.
{
  const name = 'v1.92 — Save diagnostics holds no figure, title or name';
  try {
  const J = JSON.stringify;
  const SV = ['USAF', 'ANG', 'STOVL'];
  const T1 = 'Zanzibar Widget Retrofit', T2 = 'Quokka Harness Overhaul', T3 = 'Engine Sustainment Support', EVT = 'Kestrel Plan Event';
  const BUD = 'USAF O&M- CAM Discretionary AV', P1 = 'Brunhilde Okonkwo', P2 = 'Thaddeus Moonbeam';
  const mkI = (id, title, ask, ccar) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title, event: EVT + ' ' + id, ccar,
    fy26: ask.map(() => 0), ask, alloc: null });
  const sc = { services: SV, items: [mkI('A', T1, [7654321, 50, 0], 'JSF77341'), mkI('B', T2, [80, 0, 0], 'JSF2'), mkI('C', T3, [30, 0, 0], 'JSF3')],
    disc: [120, 30, 10], mand: [60, 40, 0], order: ['A', 'B', 'C'] };
  // what must never be in the file, and the part of each that would give it away
  const NEVER = [T1, T2, T3, 'Zanzibar', 'Quokka', 'Kestrel', 'JSF77341', '77341', 'PIDQX4471', 'QX4471', '7,654,321', '7654321',
    BUD, P1, 'Okonkwo', P2, 'Moonbeam', 'Vellichor', 'Grindlewald', 'Program Support Office', 'Contracting Office Lambda'];
  // what the board holds, or quoted, or a figure: none of it may stay even in the list kept in memory
  const NEVER_KEPT = [T1, T2, T3, EVT, 'JSF77341', 'PIDQX4471', '7,654,321', BUD, P1, P2, 'Program Support Office', 'Contracting Office Lambda'];
  const leaks = (txt, list) => list.filter(v => String(txt).toLowerCase().indexOf(v.toLowerCase()) >= 0).join(', ') || 'none';
  const { ev } = boot({ ls: { prio27execdb: '{not json', prio27who: P1 } });
  seed(ev, sc);
  ev(`S.pid={A:'PIDQX4471'}; MS.jrnl=(MS.jrnl||[]).concat([{t:1, by:${J(P2)}, id:'A', f:'title', a:'x', b:'y'}]);
      BUDDB={ts:1, files:[], rows:[budParseName(${J(BUD)})].filter(Boolean)}; _budRegCache=null;
      S.budgetAsg={A:{'USAF|d':${J(BUD)}}}; save(); render(); 'ok'`);
  // execution data holds strings of its own (its POC column): a name made only of the program's own words
  ev(`EXDB.all={om:{asOf:'2027-03', hdr:[], read:1, noFy:0, rows:{2027:[(function(){ var r=[]; for(var c=0;c<32;c++) r.push('');
      r[0]=2027; r[1]='2027-03'; r[2]='JSF77341'; r[9]=7654321; r[14]='Contracting Office Lambda'; return r; })()]}}}; _diagSec=null; 'ok'`);
  // the real warnings
  ev(`budClearAll('A'); 'ok'`);
  ev(`(function(){ var o=Storage.prototype.setItem; Storage.prototype.setItem=function(){ var e=new Error('full'); e.name='QuotaExceededError'; throw e; };
      try{ persistExdb(); }finally{ Storage.prototype.setItem=o; } })(); 'ok'`);
  ev(`(function(){ var o=inspectorBody; inspectorBody=function(){ throw new Error('cannot draw '+dispTitle(itemById('A'))+' at $7,654,321'); };
      try{ render(); }finally{ inspectorBody=o; } })(); 'ok'`);
  chk(name, 'record', 'a RECORD panel that failed to draw points to Save diagnostics, not Save a copy',
    ev(`(function(){ var t=document.getElementById('inspector').textContent; return /Save diagnostics/.test(t) && !/Save a copy/.test(t); })()`), true);
  // one message naming everything, and a script error nothing caught
  ev(`setStat('⚠ Could not read <b>Vellichor Budget Export.xlsx</b> — the shared folder holds a newer save by Ophelia Grindlewald (10:42). '
      +'$7,654,321 for Zanzibar Widget Retrofit (Kestrel Plan Event A) and Engine Sustainment Support, "Program Support Office", '
      +'CCaR JSF77341, PID PIDQX4471, budget USAF O&M- CAM Discretionary AV, by Brunhilde Okonkwo and Thaddeus Moonbeam, '
      +'POC Contracting Office Lambda'); 'ok'`);
  ev(`window.dispatchEvent(new ErrorEvent('error', {message:'TypeError: Zanzibar Widget Retrofit has 7654321', lineno:12345, colno:67})); 'ok'`);
  const kept = ev(`JSON.stringify(DIAG.log)`);
  chk(name, 'kept', 'the list kept in memory holds no title, record, PID, budget, person, quoted value or figure the board holds', leaks(kept, NEVER_KEPT), 'none');
  // THE BOX, AND THE FILE IT WRITES
  ev(`window.__saved=[]; window.__dl=[]; (function(){ var B0=Blob; window.Blob=function(p, o){ window.__saved.push(p.map(String).join('')); return new B0(p, o); };
      HTMLAnchorElement.prototype.click=function(){ window.__dl.push(this.download||''); }; })(); toggleDiag(); 'ok'`);
  const shown = ev(`document.getElementById('diagPre').textContent`);
  chk(name, 'file', 'none of the values reaches the file', leaks(shown, NEVER), 'none');
  const has = w => shown.indexOf(w) >= 0;
  chk(name, 'file', 'the version, the board and the counts are there',
    J([has(ev('BUILD')), has('This file:          the live board'), has('FY27 3 on the board, 0 removed'), has('CCaR records:       3 of 3'),
       has('Writes refused:     1 this session'), has('The imported execution data — QuotaExceededError'),
       has('Unread on opening:  the imported CCaR execution data held in browser storage'), has('Journal entries:'),
       has('Execution data:     O&M 1 plan events in 1 month(s)')]),
    J([true, true, true, true, true, true, true, true, true]));
  chk(name, 'file', 'each warning is there, cleaned, and the script error with where it happened',
    J([/budget choice cleared on … — every line follows the rule again/.test(shown), /The RECORD panel could not be drawn/.test(shown),
       /\$# for …/.test(shown), /ERROR {4}TypeError: … has #  \[line 12345:67\]/.test(shown), /1 script error/.test(shown)]),
    J([true, true, true, true, true]));
  ev(`setStat('⚠ Something that happened after the box was opened'); 'ok'`);
  ev(`document.getElementById('diagSave').click(); 'ok'`);
  const saved = JSON.parse(ev(`JSON.stringify(window.__saved)`)), dl = JSON.parse(ev(`JSON.stringify(window.__dl)`));
  chk(name, 'file', 'Save writes one file, named for the day, and it is exactly what the box showed',
    J([saved.length, /^ORBIT diagnostics - \d{4}-\d{2}-\d{2}\.txt$/.test(dl[0] || ''), saved[0] === shown]), J([1, true, true]));
  ev(`toggleDiag(); document.querySelector('#diagPanel .btn:not(#diagSave)').click();
      toggleDiag(); document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true})); 'ok'`);
  chk(name, 'cancel', 'Cancel and Esc close the box and write nothing',
    ev(`JSON.stringify([window.__saved.length, window.__dl.length, diagOpen, document.getElementById('diagPanel').className])`), J([1, 1, false, 'modal-bg']));
  // A PMO COPY: it says so, and whose; its own warnings are cleaned the same way
  const copyHtml = ev(`pmoCopyHtml({sandbox:true, by:${J(P1)}, ts:1790000000000, fy:MS.cur, ap:APPN, base:pmoBaseline(), pv:PMO_PV, ord:{}})`);
  const C = boot({ html: copyHtml, ls: { prio27pmo: 'AV' } });
  C.ev(`setStat('⚠ Could not submit Zanzibar Widget Retrofit for Brunhilde Okonkwo: $7,654,321'); toggleDiag(); 'ok'`);
  const cs = C.ev(`document.getElementById('diagPre').textContent`);
  chk(name, 'copy', 'a PMO copy says it is one, when it was published and whose it is -- the office code stays',
    /This file: {10}a PMO copy, published \d{4}-\d{2}-\d{2}, office AV/.test(cs), true);
  chk(name, 'copy', 'and none of the values reaches its file', leaks(cs, NEVER), 'none');
  // A ONE-APPROPRIATION FILE
  const O = boot({ html: ev(`oneAppnHtml('om')`) });
  chk(name, 'one', 'a one-appropriation file says so', /This file: {10}a one-appropriation file \(O&M\)/.test(O.ev(`diagReport()`)), true);
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
