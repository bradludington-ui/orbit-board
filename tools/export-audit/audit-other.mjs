// Audit the two remaining exports that do lane / Mission Critical math:
//   exportCSV      — the Priority Drill workbook (1-N by band, plus a tab per PMO)
//   execSynopsis   — the Executive Funding Synopsis (CSV)
//
//   exportSrc      — the Spend Plan Source workbook, whose Amount column IS lane arithmetic
//
// The remaining Excel exports (ACE Tie-Out, Chart of Accounts, CR Cash Return) carry no
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
// a name with no PMO is a LEGACY budget and is never used, even when it was chosen -- and since v1.92 a chosen
// budget that cannot be used STOPS the Spend Plan Source, naming the line, rather than printing it blank. Every line's
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
  // v1.92: D's LEGACY CHOICE STOPS THE FILE. The resolver calls it unusable, so the Spend Plan Source refuses --
  // it neither prints the name, nor blanks the line, nor puts the rule's answer in a person's place -- and says which.
  const refused = JSON.parse(ev(`(function(){ var built=false, msg='';
    var oa=window.alert; window.alert=function(m){ msg=String(m); };
    if(!globalThis.__ob3) globalThis.__ob3=buildXlsx;
    buildXlsx=function(){ built=true; return new Uint8Array(0); };
    try{ exportSrc(); }catch(e){}
    buildXlsx=globalThis.__ob3; window.alert=oa;
    return JSON.stringify({built:built, msg:msg}); })()`));
  chk(name, 'invalid choice', 'a chosen budget that cannot be used stops the Spend Plan Source: no file',
    refused.built + ' · ' + /not exported/.test(refused.msg), 'false · true');
  chk(name, 'invalid choice', 'and the refusal names the requirement, the line, the name and why',
    [refused.msg.includes(ev(`dispTitle(itemById('D'))`)), /USAF discretionary: USAF O&M- CAM \(a legacy budget/.test(refused.msg)].join(' · '), 'true · true');
  // THE PRE-FLIGHT names it, as a block: the line has no budget until it is picked again or cleared
  const pf = JSON.parse(ev(`JSON.stringify((preflight().find||[]).filter(function(f){ return f.k==='budbad'; }).map(function(f){ return f.sev+':'+f.rows.map(function(r){ return r.id; }).join(','); }))`));
  chk(name, 'pre-flight', 'the unusable choice is a block, listed for a fresh pick', JSON.stringify(pf), '["block:D"]');
  // cleared, the rule answers D's line -- and the file is made
  ev(`delete S.budgetAsg.D; save(); 'ok'`);
  const pack = JSON.parse(ev(`(function(){ var got='[]';
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
    [11,  'USAF O&M- CAM Discretionary PP',        'once the legacy choice is cleared, the rule answers D’s line'],
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
  chk(name, 'pick list', 'but never a legacy name', pick.some(n => !JSON.parse(ev(`JSON.stringify(!!(budParseName(${JSON.stringify(n)})||{}).pmo)`))), false);
  chk(name, 'pick list', 'and a mandatory line is never offered a Discretionary name',
    JSON.parse(ev(`JSON.stringify(budPickList('A','ANG','mand').filter(function(b){ return b.dm==='disc'; }).length)`)), 0);
  // THE WARNING COMES BEFORE THE FILE. Without the CCaR pull, A's STOVL mandatory line has two lane-less names
  // and nothing to decide between them, so it has no budget: the export must stop and ask -- and when the answer
  // is no, no workbook is built at all. (A line with NO choice asks; a line whose CHOICE cannot be used refuses.)
  ev(`divCcarSide=globalThis.__dcs; _budCcMemo=null; 'ok'`);
  const warned = JSON.parse(ev(`(function(){ var built=false, msg='';
    var oc=window.confirm; window.confirm=function(m){ msg=String(m); return false; };
    if(!globalThis.__ob5) globalThis.__ob5=buildXlsx;
    buildXlsx=function(){ built=true; return new Uint8Array(0); };
    try{ exportSrc(); }catch(e){}
    buildXlsx=globalThis.__ob5; window.confirm=oc;
    return JSON.stringify({built:built, msg:msg}); })()`));
  chk(name, 'warning', 'a line without a Budget stops the export and says so', /no Budget/.test(warned.msg), true);
  chk(name, 'warning', 'and naming the requirement', warned.msg.includes(ev(`dispTitle(itemById('A'))`)), true);
  chk(name, 'warning', 'declined, no file is written', warned.built, false);
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
  // FROM CCaR: the panel says what the file does
  ev(`S.ccar.A='JSF1'; globalThis.__dcs7=divCcarSide;
      divCcarSide=function(){ return {by:{'JSF1':{buds:{'USMC STOVL O&M -1A9B AV':1}}}, rows:1}; };
      _budCcMemo=null; save(); render(); 'ok'`);
  const sc2 = panel('A').rows.find(r => r.svc === 'STOVL' && r.lane === 'mandatory') || {};
  chk(name, 'from CCaR', 'the CCaR pull settles STOVL mandatory, and the panel says so', sc2.how + ' · ' + onFile(13),
    'ccar · USMC STOVL O&M -1A9B AV');
  agree('from CCaR');
  // v1.92: CHOICES THE RESOLVER CANNOT USE -- a legacy name left by an older board, a retired name, another
  // office's budget -- stay chosen, are SHOWN for what they are (never "back to the rule" while the file printed
  // the stored name), and stop the Spend Plan Source. Nothing falls back to the rule on its own.
  const srcRefused = () => ev(`(function(){ var built=false, oa=window.alert; window.alert=function(){};
    if(!globalThis.__ob7) globalThis.__ob7=buildXlsx; buildXlsx=function(){ built=true; return new Uint8Array(0); };
    try{ exportSrc(); }catch(e){} buildXlsx=globalThis.__ob7; window.alert=oa; return built? 'made' : 'refused'; })()`);
  ev(`S.budgetAsg.D={'USAF|disc':'USAF O&M- CAM'}; save(); render(); 'ok'`);
  let dl = panel('D').rows[0] || {};
  chk(name, 'invalid', 'a legacy choice stays selected, says it is not used, and the Spend Plan Source refuses',
    [dl.how, dl.value, /not used/.test(dl.first), srcRefused()].join(' · '), 'invalid · USAF O&M- CAM · true · refused');
  ev(`BUDDB.rows.forEach(function(b){ if(b.n==='USAF O&M- CAM Discretionary PP') b.gone=1; }); _budRegCache=null;
      S.budgetAsg.D={'USAF|disc':'USAF O&M- CAM Discretionary PP'}; save(); render(); 'ok'`);
  dl = panel('D').rows[0] || {};
  chk(name, 'invalid', 'a RETIRED choice the same: shown, named retired, never printed',
    [dl.how, dl.value, /retired/.test(ev(`(function(){ setCur('D'); return document.querySelector('#inspector .budhow').textContent; })()`)), srcRefused()].join(' · '),
    'invalid · USAF O&M- CAM Discretionary PP · true · refused');
  ev(`BUDDB.rows.forEach(function(b){ b.gone=0; }); _budRegCache=null; S.budgetAsg.D={'USAF|disc':'USAF O&M- CAM Discretionary AV'}; save(); render(); 'ok'`);
  dl = panel('D').rows[0] || {};
  chk(name, 'invalid', 'ANOTHER OFFICE’S budget (AV on a PP requirement) the same: shown, and why',
    [dl.how, dl.value, /another office’s budget \(AV; this requirement is PP\)/.test(ev(`(function(){ setCur('D'); return document.querySelector('#inspector .budhow').textContent; })()`)), srcRefused()].join(' · '),
    'invalid · USAF O&M- CAM Discretionary AV · true · refused');
  chk(name, 'invalid', 'and its line is still drawn: an unusable budget never hides money',
    panel('D').rows.map(r => r.svc + ' ' + r.lane).join(', '), 'USAF discretionary');
  // EVERY REASON, read off the one resolver
  const why = (id, svc, lane, nm) => ev(`(function(){ var A=S.budgetAsg[${J(id)}]; S.budgetAsg[${J(id)}]={}; S.budgetAsg[${J(id)}][${J(svc + '|' + lane)}]=${J(nm)};
    var r=budResolve(${J(id)}, ${J(svc)}, ${J(lane)}); if(A) S.budgetAsg[${J(id)}]=A; else delete S.budgetAsg[${J(id)}];
    return r.status+': '+r.reasons.join('; '); })()`);
  chk(name, 'invalid', 'a name the BAE list does not hold', why('D', 'USAF', 'disc', 'USAF O&M- CAM OBBBA Discretionary PP'),
    'invalid: the chosen budget is not in the BAE list');
  chk(name, 'invalid', 'the other lane’s budget', why('A', 'USAF', 'disc', MAND_AV), 'invalid: the chosen budget is a mandatory budget on the discretionary line');
  chk(name, 'invalid', 'another service’s budget', why('A', 'ANG', 'disc', DISC_AV), 'invalid: the chosen budget is not a budget for ANG');
  chk(name, 'invalid', 'another appropriation’s budget', /another appropriation’s budget/.test(why('A', 'STOVL', 'disc', 'USMC STOVL APN Full Fund SUPT PES Discretionary AV')), true);
  chk(name, 'invalid', 'a valid choice in another case is the list’s own spelling', ev(`(function(){ S.budgetAsg.A={'USAF|disc':${J(DISC_AV.toUpperCase())}};
    var r=budResolve('A','USAF','disc'); delete S.budgetAsg.A; return r.status+' · '+r.effective; })()`), 'chosen · ' + DISC_AV);
  chk(name, 'invalid', '“back to the rule” clears the stored key, and the file is made with the rule’s answer',
    choose('D', line('USAF discretionary'), '') + ' · ' + asg('D') + ' · ' + srcRefused() + ' · ' + onFile(11), 'ok · null · made · USAF O&M- CAM Discretionary PP');
  agree('invalid choices cleared');
  ev(`divCcarSide=globalThis.__dcs7; _budCcMemo=null; S.ccar={}; save(); render(); 'ok'`);

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

  // v1.92: A LINE WITH NO MONEY CARRIES UNFUNDED DOLLARS, and they go on a discretionary or lane-less budget
  // (the owner, 1 Oct 2026). Its picker never offers a mandatory name; a mandatory choice made while the line was
  // funded in mandatory is KEPT -- named, not used for the unfunded dollars -- and is the mandatory line's again
  // the moment mandatory money comes back.
  click('F', '#inspector .budfoot button');
  lanes(117, 0);
  chk(name, 'lane', 'a mandatory name is not offered on a line with no money yet', choose('F', line('USAF not funded yet'), MAND_AV), 'not offered');
  chk(name, 'lane', 'and written to it directly, it is refused and nothing changes', ev(`budUnfSet('F','USAF',${J(MAND_AV)}); 'ok'`) + ' · ' + asg('F')
    + ' · ' + /is a mandatory budget/.test(ev(`document.getElementById('shareStat').textContent`)), 'ok · null · true');
  lanes(117, 16);
  chk(name, 'lane', 'funded in mandatory, a mandatory name is chosen on that line', choose('F', line('USAF mandatory'), MAND_AV) + ' · ' + asg('F'),
    'ok · ' + J({ 'USAF|mand': MAND_AV }));
  lanes(117, 0);
  f = panel('F');
  chk(name, 'lane', 'the money gone, the line resolves as discretionary -- the rule, never the mandatory name',
    said(f) + ' · ' + (f.rows[0] || {}).title, 'not funded yet:rule: · No money yet · the IDS export files it under: ' + DISC_AV);
  chk(name, 'lane', 'and the mandatory choice is kept, named, and still counted',
    /Kept for mandatory money: USAF O&M - CAM OBBBA Mandatory AV/.test(ev(`(function(){ setCur('F'); return document.getElementById('inspector').textContent; })()`))
      + ' · ' + asg('F') + ' · ' + f.clearAll, 'true · ' + J({ 'USAF|mand': MAND_AV }) + ' · Clear all (1)');
  chk(name, 'lane', 'a lane-less name picked on the not-funded line leaves the mandatory choice where it is',
    choose('F', line('USAF not funded yet'), CONG_AV) + ' · ' + asg('F'), 'ok · ' + J({ 'USAF|mand': MAND_AV, USAF: CONG_AV }));
  chk(name, 'lane', 'its clear clears only what answers that line', click('F', clearBtn('USAF not funded yet')) + ' · ' + asg('F'),
    'ok · ' + J({ 'USAF|mand': MAND_AV }));
  lanes(117, 16);
  chk(name, 'lane', 'funded in mandatory again, the kept choice is used', said(panel('F')) + ' · ' + onFile(16), 'mandatory:chosen:' + MAND_AV + ' · ' + MAND_AV);
  agree('mandatory after the choice');
  lanes(133, 0);
  chk(name, 'lane', 'funded in discretionary instead, the line follows the rule: never a mandatory name on it',
    said(panel('F')) + ' · ' + onFile(16), 'discretionary:rule: · ' + DISC_AV);
  agree('the other lane');
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

// ═══ A CSV CELL A SPREADSHEET WOULD RUN IS WRITTEN AS TEXT (v1.92, revised before merge) ══════════════════════
// A title or consequence typed as =HYPERLINK(...), +cmd, -cmd|..., @SUM(...), or behind a tab, a carriage return, a
// line feed or spaces, is a formula to whoever opens the CSV. Every CSV the board writes goes through csvCell(): such
// a cell gets a leading apostrophe; a true number, or a figure ORBIT formatted, is left exactly as it was.
{
  const name = 'v1.92 — CSV cells a spreadsheet would run are written as text';
  try {
  const J = JSON.stringify;
  const { ev } = boot();
  const cellOf = v => ev(`csvCell(${J(v)})`);
  const BAD = ['=1+1', '+cmd', "-cmd|' /C calc'!A0", '@SUM(A1)', '\t=1', '\r=1', '\n=1', '  =1', ' +1', '\t', '\rX', '\nY', '＝1'];
  chk(name, 'formula', 'every cell a spreadsheet would read as a formula starts with an apostrophe',
    J(BAD.map(v => cellOf(v).slice(0, 2))), J(BAD.map(() => `"'`)));
  const KEEP = [['Engine sustainment', '"Engine sustainment"'], ['-$1,234', '"-$1,234"'], ['+3', '"+3"'], ['12%', '"12%"'], ['$4.5M', '"$4.5M"'],
    ['say "hi"', '"say ""hi"""'], ['  indented', '"  indented"']];
  chk(name, 'kept', 'text and the figures ORBIT formats stay exactly as they were', J(KEEP.map(k => cellOf(k[0]))), J(KEEP.map(k => k[1])));
  chk(name, 'kept', 'a true number stays a number, negative included',
    J([ev(`csvCell(-42)`), ev(`csvCell(3.5)`), ev(`csvCell(0)`), ev(`csvCell(null)`)]), J(['"-42"', '"3.5"', '"0"', '""']));
  // THROUGH A REAL EXPORT: the Executive Synopsis lists a Mission Critical requirement short of discretionary by the
  // name the board shows for it (its plan event)
  seed(ev, { services: ['USAF'], items: [{ id: 'Q', grp: 'AV', team: 'AV', sect: '', custom: false, title: 't', event: '=HYPERLINK("http://x","y")',
    ccar: '', fy26: [0], ask: [100], alloc: null }], disc: [40], mand: [0], order: ['Q'], mc: { Q: true } });
  const rows = captureSynopsis(ev);
  chk(name, 'export', 'the synopsis writes the name as text, apostrophe first',
    J(rows.flat().filter(c => /HYPERLINK/.test(c))), J([`'=HYPERLINK("http://x","y")`]));
  chk(name, 'export', 'and leaves every figure in it alone', rows.flat().filter(c => /^'[-+$\d]/.test(c)).length, 0);
  } catch (e) {
    const msg = String((e && e.message) || e).split('\n')[0].slice(0, 140);
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + msg, got: 'threw', want: 'ran' });
  }
}

// ═══ THE IDS EXPORT (v1.92, revised before merge on the owner's decisions of 1 Oct 2026) ═══════════════════════
// Every row, amount and reason below is written here from the scenario, never read back from the board.
// THE WALK (order A B D C F H E): USAF disc 120 = A 100 + B 20; USAF mand 60 all to B; C's 40 and H's 10 find
// nothing. ANG disc 30 to A; ANG mand 40 = A 20 + D 20, D short 10. STOVL disc 10 to F, F short 15.
// So: A USAF discretionary only; A ANG both lanes; B USAF both lanes; D ANG mandatory only and 10 short;
// C unfunded, sharing A's control number; F discretionary and partly unfunded; H unfunded with no CCaR number;
// E unfunded on its own control number.
// THE RULES (A1): a mandatory contribution's Amount = Approved = its draw; a discretionary one carries the draw
// plus EVERY unfunded dollar on the service; no money = the requirement at Approved 0, on a DISCRETIONARY or
// lane-less budget; a fully mandatory-funded service has no $0/$0 discretionary row. One row per FY + budget +
// control, every contribution landing there consolidated, several requirements on a row disclosed for review.
{
  const name = 'v1.92 — the IDS export: consolidated, reconciled, nothing recorded';
  try {
  const J = JSON.stringify;
  const SV = ['USAF', 'ANG', 'STOVL'];
  const mkI = (id, ask, ccar, grp) => ({ id, grp: grp || 'AV', team: grp || 'AV', sect: '', custom: false,
    title: id + ' title', event: id + ' event', ccar, fy26: ask.map(() => 0), ask, alloc: null });
  const sc = { services: SV,
    items: [mkI('A', [100, 50, 0], 'JSF1'), mkI('B', [80, 0, 0], 'JSF2'), mkI('D', [0, 30, 0], 'JSF3'),
            mkI('C', [40, 0, 0], 'JSF1'), mkI('F', [0, 0, 25], 'JSF5'), mkI('H', [10, 0, 0], ''),
            mkI('E', [0, 20, 0], 'JSF4')],
    disc: [120, 30, 10], mand: [60, 40, 0], order: ['A', 'B', 'D', 'C', 'F', 'H', 'E'] };
  const UD = 'USAF O&M- CAM Discretionary AV', UM = 'USAF O&M - CAM OBBBA Mandatory AV',
    AD = 'USAF O&M - ANG CAM Discretionary AV', AM = 'USAF O&M - ANG CAM OBBBA Mandatory AV',
    SD = 'USMC STOVL O&M -1A9A FL Discretionary AV', CONG = 'USAF O&M- CAM CONG AV',
    RET = 'USAF O&M- CAM OLD Discretionary AV';
  const NOW = 1790000000000;           // 21 Sep 2026: the export's clock, frozen
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  const REC = n => ({ t: 'Record ' + n, o: 'OPR', p: 'AV', d: 1, k: String(1000 + n) });
  const RECS = `{JSF1:${J(REC(1))}, JSF2:${J(REC(2))}, JSF3:${J(REC(3))}, JSF4:${J(REC(4))}, JSF5:${J(REC(5))}}`;
  ev(`MS.ccarIdx={rows:${RECS}};
      BUDDB={ts:1700000000031, files:[], rows:${J([UD, UM, AD, AM, SD, CONG, RET])}.map(budParseName).filter(Boolean)};
      BUDDB.rows.forEach(function(b){ if(b.n===${J(RET)}) b.gone=1; });
      _budRegCache=null; S.budgetAsg={}; S.ccar={}; MS.ids={org:21}; save(); render();
      globalThis.__RD=Date; Date=class extends globalThis.__RD { constructor(...a){ if(a.length) super(...a); else super(${NOW}); }
        static now(){ return ${NOW}; } }; 'ok'`);
  const FORM = { reason: 'FY27 baseline from the SFCB', action: 'Add', fid: '20260921-1346', fidOk: true, org: '21', orgOk: true };
  // THE FILE: the sheets handed to the writer, the bytes it wrote, what was downloaded, what was said
  const exportIt = (form, board) => JSON.parse((board || ev)(`(function(){ var got=null, bytes=null, msg='', dl=[];
    var oa=window.alert, oc=HTMLAnchorElement.prototype.click, ob=buildXlsx;
    window.alert=function(m){ msg=String(m); };
    HTMLAnchorElement.prototype.click=function(){ dl.push(this.download||''); };
    buildXlsx=function(s, x){ got=s; bytes=ob(s, x); return bytes; };
    var ok;
    try{ ok=exportIdsReq(${form === undefined ? '' : J(form)}); }catch(e){ ok='threw '+e.message; }
    buildXlsx=ob; window.alert=oa; HTMLAnchorElement.prototype.click=oc;
    return JSON.stringify({ok:ok, msg:msg, sheets:got, bytes:bytes? Array.from(bytes) : null, dl:dl,
      stat:(document.getElementById('shareStat')||{}).textContent||''}); })()`));
  const cells = r => (r || []).map(c => c && typeof c === 'object' ? c.v : c);
  const reqRows = X => (((X.sheets || [])[0] || {}).rows || []).slice(1).map(cells);
  const sheet2 = X => (((X.sheets || [])[1] || {}).rows || []).map(r => cells(r).join(' | ')).join('\n');
  const show = L => L.map(r => `${r[4]} · ${r[5]} · ${r[6]}/${r[7]}`).join(' | ');
  const build = () => JSON.parse(ev(`JSON.stringify(idsBuild())`));
  const idsNow = () => ev(`JSON.stringify(MS.ids||null)`);

  // ── THE ROWS (A1), every one written from the scenario ───────────────────────────────────────────────
  const WANT = [
    [AD, 1001, 30, 30],     // A ANG discretionary: 50 asked, 20 of it paid by mandatory -> 30/30
    [AD, 1003, 10, 0],      // D ANG: drew only mandatory and is 10 short -> the 10 unfunded on DISCRETIONARY
    [AD, 1004, 20, 0],      // E ANG, no money: the requirement at Approved 0, on the discretionary rule's budget
    [AM, 1001, 20, 20],     // A ANG mandatory: Amount = Approved = the draw
    [AM, 1003, 20, 20],     // D ANG mandatory: the draw only -- never the unfunded 10
    [UM, 1002, 60, 60],     // B USAF mandatory
    [UD, 1001, 140, 100],   // A USAF 100/100 + C unfunded 40/0, consolidated on one control number
    [UD, 1002, 20, 20],     // B USAF discretionary: 80 asked, 60 of it paid by mandatory
    [SD, 1005, 25, 10],     // F STOVL discretionary: the unfunded 15 rides the discretionary line
  ];
  let X = exportIt(FORM);
  chk(name, 'A1', 'one row per FY + budget + control, Amounts and Approveds as written', show(reqRows(X)),
    WANT.map(w => `${w[0]} · ${w[1]} · ${w[2]}/${w[3]}`).join(' | '));
  chk(name, 'A1', 'a mandatory-only service that is short: mandatory 20/20 and the unfunded 10/0 on discretionary (PR #3 wrote mandatory 30/20)',
    reqRows(X).filter(r => r[5] === 1003).map(r => `${r[4]} ${r[6]}/${r[7]}`).join(' | '), `${AD} 10/0 | ${AM} 20/20`);
  chk(name, 'A1', 'no unfunded dollar on a mandatory budget: every mandatory row’s Amount is its Approved',
    reqRows(X).filter(r => /Mandatory/.test(r[4]) && r[6] !== r[7]).length, 0);
  // ONE BUDGET, SEVERAL CONTROLS; ONE CONTROL, SEVERAL BUDGETS; ONE CONTROL, LANE-SPECIFIC BUDGETS
  chk(name, 'consolidation', 'one budget carries several control numbers', reqRows(X).filter(r => r[4] === UD).map(r => r[5]).join(','), '1001,1002');
  chk(name, 'consolidation', 'one control number on several budgets is a row on each', reqRows(X).filter(r => r[5] === 1001).map(r => r[4]).join(' | '), [AD, AM, UD].join(' | '));
  chk(name, 'consolidation', 'the same control on two lane-specific budgets stays two rows', reqRows(X).filter(r => r[5] === 1001 && /ANG/.test(r[4])).length, 2);
  // SEVERAL REQUIREMENTS ON ONE ROW: consolidated, every contributor disclosed
  let P = build();
  const r7 = P.rows.find(r => r.ctl === '1001' && r.bud === UD) || { sources: [] };
  chk(name, 'consolidation', 'A and C on one budget and control: one row, both contributions in it',
    r7.sources.map(y => `${y.id} ${y.svc} ${y.lane} ${y.amount}/${y.approved}`).join(' | '), 'A USAF disc 100/100 | C USAF disc 40/0');
  chk(name, 'consolidation', 'and it is listed for review in the box and on the anomalies sheet',
    [P.multi.map(r => r.ref).join(','), /ROWS THAT CONSOLIDATE SEVERAL ORBIT REQUIREMENTS[\s\S]*7 \| USAF O&M- CAM Discretionary AV \| 1001 \| A \| [^\n]*\n7 \| USAF O&M- CAM Discretionary AV \| 1001 \| C \|/.test(sheet2(X))].join(' · '), '7 · true');
  chk(name, 'consolidation', 'a control used by several requirements across budgets is listed for review',
    P.shared.map(g => g.ctl + ':' + g.rows.map(r => r.ref).join('/')).join(' '), '1001:1/4/7');
  // A LANE-NEUTRAL BUDGET TAKES BOTH LANES OF ONE CONTROL IN ONE ROW
  ev(`S.budgetAsg.B={USAF:${J(CONG)}}; save(); render(); 'ok'`);
  P = build();
  chk(name, 'consolidation', 'B’s two lanes on one lane-less budget are one row, both lanes in it',
    P.rows.filter(r => r.ctl === '1002').map(r => `${r.bud} ${r.amount}/${r.approved} ` + r.sources.map(y => y.lane).join('+')).join(' | '), CONG + ' 80/80 disc+mand');
  ev(`delete S.budgetAsg.B; save(); render(); 'ok'`);
  // PROVENANCE AND RECONCILIATION, row by row and board-wide
  P = build();
  const src = P.rows.flatMap(r => r.sources).concat(P.excluded);
  chk(name, 'provenance', 'every contribution names its requirement, service, lane, budget, Amount and Approved',
    src.filter(y => !(y.id && y.svc && /^(disc|mand)$/.test(y.lane) && typeof y.amount === 'number' && typeof y.approved === 'number')).length
      + ' · ' + P.rows.flatMap(r => r.sources).filter(y => !y.budget).length, '0 · 0');
  chk(name, 'reconcile', 'every row’s Amount and Approved are the sum of its sources',
    P.rows.filter(r => r.amount !== r.sources.reduce((t, y) => t + y.amount, 0) || r.approved !== r.sources.reduce((t, y) => t + y.approved, 0)).length, 0);
  chk(name, 'reconcile', 'uploaded + not uploaded = every requirement (Amount) and every dollar drawn (Approved)',
    [P.tot.upAmt + P.tot.exAmt, P.tot.upApp + P.tot.exApp].join('/'), '355/260');
  chk(name, 'reconcile', 'every contribution is in exactly one place', J(Object.values(src.reduce((o, y) => { const k = y.id + y.svc + y.lane; o[k] = (o[k] || 0) + 1; return o; }, {})).filter(n => n !== 1)), '[]');
  chk(name, 'reconcile', 'the box’s own check holds, and every value is a whole dollar',
    P.check.ok + ' · ' + src.concat(P.rows).filter(y => !Number.isInteger(y.amount) || !Number.isInteger(y.approved)).length, 'true · 0');
  // APPROVED BY LANE (v1.93, item 44), from the walk above: discretionary USAF 120 + ANG 30 + STOVL 10 = 160;
  // mandatory USAF 60 + ANG 40 = 100. Nothing approved is left out (H's 10 is unfunded).
  chk(name, 'by lane', 'Approved by lane, uploaded and not uploaded, and the draws they reconcile to',
    [P.tot.upAppD, P.tot.upAppM, P.tot.exAppD, P.tot.exAppM, P.check.drawD, P.check.drawM].join('/'), '160/100/0/0/160/100');
  const laneBox = () => JSON.parse(ev(`(function(){ idsOpen=false; toggleIds(); var s=document.querySelector('#idsBody .rlg-sum'), t=document.querySelector('#idsBody .ids-recon');
    var o={sum:s? s.textContent.replace(/\\s+/g,' ') : '', rows:t? [].slice.call(t.querySelectorAll('tr')).map(function(r){ return [].slice.call(r.children).slice(1).map(function(c){ return c.textContent.trim(); }).join(' / '); }) : []};
    toggleIds(); return JSON.stringify(o); })()`));
  let LB = laneBox();
  chk(name, 'by lane', 'the summary line gives Req. Approved and how it splits', /Req\. Approved \$260 \(discretionary \$160 · mandatory \$100\)/.test(LB.sum), true);
  chk(name, 'by lane', 'the reconciliation, by lane, ties', LB.rows.join(' | '),
    ['Req. Amount / Req. Approved / of which discretionary / of which mandatory', '$355 / $260 / $160 / $100', '$345 / $260 / $160 / $100',
     '$10 / $0 / $0 / $0', '✓ ties / ✓ ties / ✓ ties / ✓ ties'].join(' | '));
  // a row on a lane-less budget holds both lanes: the split is the contributions', not the row's
  ev(`S.budgetAsg.B={USAF:${J(CONG)}}; save(); render(); 'ok'`);
  P = build();
  chk(name, 'by lane', 'B’s both lanes on one lane-less row still split 160 / 100', [P.tot.upAppD, P.tot.upAppM].join('/'), '160/100');
  // and a mandatory contribution left out is mandatory Approved left out: B's mandatory on a retired name
  ev(`S.budgetAsg.B={'USAF|mand':${J(RET)}}; save(); render(); 'ok'`);
  P = build();
  chk(name, 'by lane', 'B’s mandatory 60 not uploaded: 160 / 40 uploaded, 0 / 60 left out, and it still ties',
    [P.tot.upAppD, P.tot.upAppM, P.tot.exAppD, P.tot.exAppM, P.check.ok].join('/'), '160/40/0/60/true');
  LB = laneBox();
  chk(name, 'by lane', 'and the box says so, lane by lane', LB.rows.slice(2).join(' | '),
    ['$285 / $200 / $160 / $40', '$70 / $60 / $0 / $60', '✓ ties / ✓ ties / ✓ ties / ✓ ties'].join(' | '));
  ev(`delete S.budgetAsg.B; save(); render(); 'ok'`);
  P = build();
  chk(name, 'reconcile', 'the anomalies sheet reconciles the same figures',
    /Every requirement on the board[^\n]*\| 355 \| 260\nOn Requirement v1 \| 345 \| 260\nNot uploaded \(listed below\) \| 10 \| 0\nCheck \| ✓ ties \| ✓ ties/.test(sheet2(X)), true);
  // A FULLY MANDATORY-FUNDED SERVICE: no $0/$0 discretionary row
  ev(`S.mandSvc[1]=50; render(); 'ok'`);
  chk(name, 'A1', 'D fully paid by mandatory: its mandatory row only, never a $0/$0 discretionary row',
    build().rows.filter(r => r.ctl === '1003').map(r => `${r.bud} ${r.amount}/${r.approved}`).join(' | '), `${AM} 30/30`);
  ev(`S.mandSvc[1]=40; render(); 'ok'`);
  // B5 AND D-B: A REQUIREMENT WITH NO MONEY GOES ON A DISCRETIONARY BUDGET, EVEN WITH A MANDATORY CHOICE KEPT
  ev(`S.budgetAsg.E={'ANG|mand':${J(AM)}}; save(); render(); 'ok'`);
  chk(name, 'B5', 'E, unfunded with a mandatory budget kept for later: still the discretionary rule’s budget, Approved 0 (PR #3 put it on the mandatory budget)',
    build().rows.filter(r => r.ctl === '1004').map(r => `${r.bud} ${r.amount}/${r.approved}`).join(' | '), `${AD} 20/0`);
  chk(name, 'B5', 'and the mandatory choice is still stored', ev(`JSON.stringify(S.budgetAsg.E)`), J({ 'ANG|mand': AM }));
  ev(`delete S.budgetAsg.E; save(); render(); 'ok'`);
  // A BUDGET CHOSEN ON A LINE WITH NO MONEY is the one IDS files it under -- here a lane-less one, which takes C off
  // A's row: the same control number on two budgets, two rows
  ev(`S.budgetAsg.C={USAF:${J(CONG)}}; save(); render(); 'ok'`);
  chk(name, 'B5', 'C’s chosen lane-less budget takes its unfunded 40 to a row of its own; A’s row keeps A',
    build().rows.filter(r => r.ctl === '1001' && /^USAF O&M- CAM/.test(r.bud)).map(r => `${r.bud} ${r.amount}/${r.approved} ${r.reqs.join(',')}`).join(' | '),
    `${CONG} 40/0 C | ${UD} 100/100 A`);
  ev(`delete S.budgetAsg.C; save(); render(); 'ok'`);
  chk(name, 'pre-flight', 'requirements sharing a control number are listed for review, never blocked',
    ev(`JSON.stringify((preflight().find||[]).filter(function(f){ return f.k==='dup'; }).map(function(f){ return f.sev+':'+f.rows.map(function(r){ return r.id; }).join(','); }))`),
    J(['note:A,C']));
  chk(name, 'B5', 'rows uploaded with Approved 0 are listed on the anomalies sheet',
    /ROWS UPLOADED WITH REQ\. APPROVED 0[^\n]*\nRef No[^\n]*\n2 \| USAF O&M - ANG CAM Discretionary AV \| 1003 \| 10 \| D\n3 \| USAF O&M - ANG CAM Discretionary AV \| 1004 \| 20 \| E/.test(sheet2(X)), true);

  // ── NOT UPLOADED, NEVER STOPPED (B7): kept off Requirement v1, listed with every reason ─────────────────
  chk(name, 'B7', 'H has no CCaR number: not on Requirement v1, listed with its dollars, the export still made',
    [X.ok, reqRows(X).length, P.excluded.map(y => `${y.id} ${y.svc} ${y.lane} ${y.amount}/${y.approved} · ${y.reasons.join('; ')}`).join(' | ')].join(' · '),
    'true · 9 · H USAF disc 10/0 · no CCaR number on the requirement');
  ev(`S.budgetAsg.H={'USAF|disc':${J(RET)}}; save(); render(); 'ok'`);
  P = build();
  chk(name, 'B7', 'EVERY reason, not the first: no CCaR number AND a retired budget chosen',
    (P.excluded.find(y => y.id === 'H') || { reasons: [] }).reasons.join('; '),
    'no CCaR number on the requirement; the chosen budget is retired — the latest BAE import no longer lists it');
  const X2 = exportIt(FORM);
  chk(name, 'B7', 'and the anomalies sheet carries both, the amounts, and how to fix each',
    /AV \| H title \| H event \| H \| USAF \| discretionary \| USAF O&M- CAM OLD Discretionary AV \(chosen, not used\) \|  \| 10 \| 0 \| no CCaR number on the requirement; the chosen budget is retired[^|]*\| Give the requirement its CCaR number[^|]* Pick again under BAE budget/.test(sheet2(X2)), true);
  ev(`delete S.budgetAsg.H; save(); render(); 'ok'`);
  // CONTROL NUMBERS ARE NUMERIC AND EXACT (C1): a leading zero or a letter is listed, never altered
  ev(`MS.ccarIdx.rows.JSF4.k='01004'; MS.ccarIdx.rows.JSF5.k='10A5'; render(); 'ok'`);
  P = build();
  chk(name, 'C1', 'a Control No with a leading zero, or not all digits, keeps its contribution off Requirement v1',
    P.excluded.filter(y => /Control No/.test(y.reasons.join())).map(y => `${y.id} ${y.reasons.join('; ')}`).join(' | '),
    'F the Control No “10A5” is not all digits | E the Control No “01004” starts with 0, which a number cell cannot keep');
  ev(`MS.ccarIdx.rows.JSF4.k='1004'; MS.ccarIdx.rows.JSF5.k='1005'; render(); 'ok'`);

  // ── THE XLSX ITSELF: exact cell types, nothing a spreadsheet would run ─────────────────────────────────
  const unzip = bytes => { const b = Uint8Array.from(bytes || []), out = {}; let i = 0;
    const u16 = o => b[o] | (b[o + 1] << 8), u32 = o => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
    while (i + 30 <= b.length && u32(i) === 0x04034b50) { const n = u16(i + 26), e = u16(i + 28), sz = u32(i + 18);
      out[Buffer.from(b.slice(i + 30, i + 30 + n)).toString()] = Buffer.from(b.slice(i + 30 + n + e, i + 30 + n + e + sz)).toString(); i += 30 + n + e + sz; }
    return out; };
  const FX = Object.assign({}, FORM, { reason: '=HYPERLINK("http://x","click") & <b>' });
  const X3 = exportIt(FX), Z = unzip(X3.bytes), s1 = Z['xl/worksheets/sheet1.xml'] || '';
  const cell = ref => { const m = new RegExp('<c r="' + ref + '"([^>]*)>(.*?)</c>').exec(s1); return m ? (/t="inlineStr"/.test(m[1]) ? 'text:' + m[2].replace(/<[^>]+>/g, '') : 'number:' + m[2].replace(/<[^>]+>/g, '')) : 'none'; };
  chk(name, 'xlsx', 'A1 is the file ID as text; row 2 is Ref No, Action, ORG, FY, Budget, Control, Amount, Approved, Comment in the template’s types',
    ['A1', 'A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2'].map(cell).join(' | '),
    ['text:20260921-1346', 'number:1', 'text:Add', 'number:21', 'number:2027', 'text:' + AD.replace(/&/g, '&amp;'), 'number:1001', 'number:30', 'number:30',
     'text:=HYPERLINK(&quot;http://x&quot;,&quot;click&quot;) &amp; &lt;b&gt;'].join(' | '));
  chk(name, 'xlsx', 'no cell anywhere in the workbook is a formula', Object.values(Z).some(x => /<f[ >]/.test(x)), false);
  chk(name, 'xlsx', 'the reason is on every row, exactly as typed', [...new Set(reqRows(X3).map(r => r[8]))].join('¦'), FX.reason);
  chk(name, 'xlsx', 'the workbook holds Requirement v1 and the anomalies sheet, in that order',
    (/<sheets>(.*?)<\/sheets>/.exec(Z['xl/workbook.xml'] || '') || ['', ''])[1].replace(/<sheet name="([^"]+)"[^>]*\/>/g, '$1;'), 'Requirement v1;Missing data and anomalies;');
  chk(name, 'xlsx', 'Ref No runs 1..N with no gap', reqRows(X).map(r => r[0]).join(','), WANT.map((_, i) => i + 1).join(','));
  // DETERMINISTIC: the same inputs at the same time are the same file, byte for byte
  const Xa = exportIt(FORM), Xb = exportIt(FORM);
  chk(name, 'deterministic', 'two exports with the same answers and clock are identical, byte for byte',
    Xa.bytes && Xb.bytes && Xa.bytes.length > 1000 && J(Xa.bytes) === J(Xb.bytes), true);
  chk(name, 'deterministic', 'and the file is named for the appropriation, the year and the file ID', Xa.dl.join(), 'IDS Batch Import Req — O&M FY27 20260921-1346.xlsx');

  // ── NOTHING IS RECORDED; ONE ACTION, CHOSEN (B1, B3) ─────────────────────────────────────────────────
  const ids0 = idsNow();
  const Xc = exportIt(FORM), Xd = exportIt(Object.assign({}, FORM, { fid: '20260921-1347' }));
  chk(name, 'no history', 'exporting writes nothing about the export: the appropriation’s IDS setting is unchanged', idsNow(), ids0);
  chk(name, 'no history', 'and, after every export so far, it is still exactly the ORG the board started with', idsNow(), J({ org: 21 }));
  chk(name, 'no history', 'no record of batches, ids or sequence exists anywhere in it',
    /issued|sent|seq|ovr/.test(ev(`JSON.stringify(MS.ids)`)), false);
  chk(name, 'B1', 'the second export is the first again: every row Add, the same rows', J(reqRows(Xd).map(r => r.slice(1))), J(reqRows(Xc).map(r => r.slice(1))));
  chk(name, 'B1', 'Add is preselected when the box opens', ev(`(function(){ idsOpen=false; toggleIds(); var a=idsForm.action, c=document.getElementById('idsActAdd').checked; toggleIds(); return a+' · '+c; })()`), 'Add · true');
  const Xu = exportIt(Object.assign({}, FORM, { action: 'Update' }));
  chk(name, 'B1', 'Update chosen: every row Update', [...new Set(reqRows(Xu).map(r => r[1]))].join(), 'Update');
  chk(name, 'B2', 'an Update file warns on its anomalies sheet that CCaR may refuse records with Authorized allocations',
    /UPDATE FILE — CCaR MAY REFUSE RECORDS THAT HAVE AUTHORIZED ALLOCATIONS/.test(sheet2(Xu)) + ' · ' + /AUTHORIZED/.test(sheet2(Xc)), 'true · false');
  chk(name, 'B2', 'and in the box, the moment Update is chosen', ev(`(function(){ idsOpen=false; toggleIds(); idsForm.action='Update'; render();
    var w=document.querySelector('#idsBody .ids-warn'), t=w? w.textContent : ''; idsForm.action='Add'; render(); var g=!!document.querySelector('#idsBody .ids-warn'); toggleIds();
    return /Authorized allocations/.test(t)+' · '+g; })()`), 'true · false');
  const Xdel = exportIt(Object.assign({}, FORM, { action: 'Delete' }));
  chk(name, 'B3', 'ORBIT never writes Delete', Xdel.ok + ' · ' + (Xdel.sheets === null), 'false · true');
  // ORG: kept per appropriation, and only once a file is made
  const Xorg = exportIt(Object.assign({}, FORM, { org: '33' }));
  chk(name, 'ORG', 'a new ORG is used on every row and kept for the appropriation only once the file exists',
    [...new Set(reqRows(Xorg).map(r => r[2]))].join() + ' · ' + ev(`MS.ids.org`), '33 · 33');
  exportIt(FORM);

  // ── THE PROMPT: every answer, or nothing is made (file-level refusals) ────────────────────────────────
  const refusedWith = (patch, why) => { const before = idsNow(), R = exportIt(Object.assign({}, FORM, patch));
    return [R.ok, R.sheets === null, R.bytes === null, R.dl.length, idsNow() === before, new RegExp(why).test(R.msg)].join(','); };
  const NO = 'false,true,true,0,true,true';
  chk(name, 'B8', 'a blank reason refuses the file', refusedWith({ reason: '' }, 'give the reason for this export'), NO);
  chk(name, 'B8', 'so does a reason of spaces', refusedWith({ reason: '   ' }, 'give the reason for this export'), NO);
  chk(name, 'B8', 'and one holding a character a spreadsheet cannot store -- refused, never silently cleaned', refusedWith({ reason: 'FY27\u0007' }, 'cannot store'), NO);
  chk(name, 'B8', 'a reason longer than one cell holds is refused, never cut', refusedWith({ reason: 'x'.repeat(32768) }, 'longer than one spreadsheet cell'), NO);
  chk(name, 'ORG', 'no ORG refuses the file -- a file-level refusal, not a row anomaly', refusedWith({ org: '' }, 'give the ORG number'), NO);
  chk(name, 'ORG', 'an ORG symbol in place of the number is refused', refusedWith({ org: 'AFLCMC' }, 'give the ORG number'), NO);
  chk(name, 'ORG', 'an ORG not confirmed for every row and service is refused', refusedWith({ orgOk: false }, 'applies to every row and every service'), NO);
  chk(name, 'ORG', 'a new ORG typed into a refused prompt is not kept', refusedWith({ org: '44', orgOk: false }, 'applies to every row and every service')
    + ' · ' + ev(`MS.ids.org`), NO + ' · 21');
  chk(name, 'ORG', 'nor one typed when the reason is missing', refusedWith({ org: '44', reason: '' }, 'give the reason for this export') + ' · ' + ev(`MS.ids.org`), NO + ' · 21');
  chk(name, 'file ID', 'a file ID not in the template’s shape is refused', refusedWith({ fid: '2026921-1346' }, 'yyyyMMdd-NNNN'), NO);
  chk(name, 'file ID', 'so is one whose date does not exist', refusedWith({ fid: '20260231-1346' }, 'not a real date'), NO);
  chk(name, 'file ID', 'and one not confirmed as unused in any earlier CCaR submission', refusedWith({ fidOk: false }, 'has not been used in any earlier CCaR submission'), NO);
  const p2 = n => String(n).padStart(2, '0'), at = new Date(NOW);
  const CAND = `${at.getFullYear()}${p2(at.getMonth() + 1)}${p2(at.getDate())}-${p2(at.getHours())}${p2(at.getMinutes())}`;
  chk(name, 'file ID', 'the candidate is today’s date and the time of day (HHmm), editable', ev(`(function(){ idsOpen=false; toggleIds(); var f=idsForm.fid, v=document.getElementById('idsFid').value; toggleIds(); return f+' · '+v; })()`), CAND + ' · ' + CAND);
  const box = ev(`(function(){ idsOpen=false; toggleIds(); var t=document.getElementById('idsBody').textContent; toggleIds(); return t; })()`);
  chk(name, 'file ID', 'the box says the four digits are the time, not a sequence, and that no history is kept',
    [/time of day/.test(box), /not a sequence/.test(box), /stores no submission history and cannot guarantee this ID is unique/.test(box),
     /saved copies of the board, other machines/.test(box), /has not been used in any earlier CCaR submission/.test(box)].join(','), 'true,true,true,true,true');
  chk(name, 'prompt', 'the box’s own Export, unanswered, makes nothing and says what is missing',
    ev(`(function(){ idsOpen=false; toggleIds(); var built=false, ob=buildXlsx, oa=window.alert; buildXlsx=function(){ built=true; return new Uint8Array(0); }; window.alert=function(){};
      document.getElementById('idsExport').click(); buildXlsx=ob; window.alert=oa;
      var t=document.getElementById('idsBody').textContent; toggleIds(); return built+' · '+/Not made yet/.test(t)+' · '+/give the reason/.test(t); })()`), 'false · true · true');

  // ── ZERO UPLOADABLE ROWS: a diagnostic workbook, said plainly ───────────────────────────────────────────
  ev(`globalThis.__cc=MS.ccarIdx; MS.ccarIdx=null; render(); 'ok'`);
  const X0 = exportIt(FORM);
  chk(name, 'zero rows', 'with no CCaR file every contribution is anomalous: the workbook is still made',
    X0.ok + ' · ' + X0.dl.length, 'true · 1');
  chk(name, 'zero rows', 'Requirement v1 holds its header and no numbered row', (((X0.sheets || [])[0] || {}).rows || []).length, 1);
  chk(name, 'zero rows', 'the anomalies sheet begins NO UPLOADABLE IDS ROWS', sheet2(X0).split('\n')[0], 'NO UPLOADABLE IDS ROWS');
  chk(name, 'zero rows', 'and the message never calls it upload-ready',
    /NO uploadable IDS rows/.test(X0.stat) + ' · ' + /Do not upload/.test(X0.stat) + ' · ' + /rows? on Requirement v1, every one/.test(X0.stat), 'true · true · false');
  chk(name, 'zero rows', 'every dollar is still reconciled', /Not uploaded \(listed below\) \| 355 \| 260/.test(sheet2(X0)), true);
  ev(`MS.ccarIdx=globalThis.__cc; render(); 'ok'`);

  // ── ORBIT'S OWN ARITHMETIC: a failed check refuses before anything is made ────────────────────────────
  const failed = R => [R.ok, R.sheets === null, R.dl.length].join(',');
  ev(`itemById('B').ask[0]=80.5; render(); 'ok'`);
  const Xf = exportIt(FORM);
  chk(name, 'invariant', 'a value that is not a whole dollar fails the check: no workbook, no download', failed(Xf), 'false,true,0');
  chk(name, 'invariant', 'and the refusal names the check, the figures and the requirement',
    /every value is a whole dollar — expected whole dollars, found requirement 80\.5[^\n]*B\|USAF/.test(Xf.msg), true);
  const boxF = ev(`(function(){ idsOpen=false; toggleIds(); var t=document.getElementById('idsBody').textContent; toggleIds(); return t; })()`);
  chk(name, 'invariant', 'the box shows the failed check with expected and found, and the requirement',
    /Export refused — an internal check failed[\s\S]*every value is a whole dollar[\s\S]*whole dollars[\s\S]*80\.5[\s\S]*B\|USAF/.test(boxF), true);
  ev(`itemById('B').ask[0]=80; render(); 'ok'`);
  // a contribution counted twice: the duplicate identity, the per-service totals and the requirement are named
  ev(`globalThis.__is=idsSources; idsSources=function(T){ var a=globalThis.__is(T); a.push(Object.assign({}, a[0])); return a; }; 'ok'`);
  const Xd2 = exportIt(FORM);
  chk(name, 'invariant', 'a contribution counted twice: refused, naming the identity and the requirement’s totals',
    [failed(Xd2), /every contribution appears exactly once — expected once each, found 1 appear more than once · A\|USAF\|disc/.test(Xd2.msg),
     /for each requirement and service, Amount = the requirement — expected 100, found 200/.test(Xd2.msg)].join(' · '), 'false,true,0 · true · true');
  ev(`idsSources=globalThis.__is; 'ok'`);
  // a contribution dropped: the missing identity is named
  ev(`idsSources=function(T){ return globalThis.__is(T).filter(function(y){ return !(y.id==='B' && y.lane==='mand'); }); }; 'ok'`);
  const Xm = exportIt(FORM);
  chk(name, 'invariant', 'a contribution dropped: refused, the Approved short by the mandatory draw',
    [failed(Xm), /Approved = discretionary \+ mandatory draw — expected 80, found 20 · B\|USAF/.test(Xm.msg)].join(' · '), 'false,true,0 · true');
  ev(`idsSources=globalThis.__is; 'ok'`);
  // two rows on one key, handed to the check directly: refused
  chk(name, 'invariant', 'two rows on one FY + Budget + Control fail the check', ev(`(function(){ var T=tiers(), P=idsBuild(T);
    var r=JSON.parse(JSON.stringify(P.rows[0])); r.sources=[]; r.amount=0; r.approved=0; P.rows.push(r);
    var c=idsCheck(P, T); return c.ok+' · '+c.fails.map(function(x){ return x.inv; }).filter(function(v,i,a){ return a.indexOf(v)===i; }).join(' / '); })()`),
    'false · every FY + Budget + Control is one row');

  // ── THE BOARD ON SCREEN: a locked cycle and a PMO copy refuse before anything is asked or made ──────────
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      MS.years[MS.cur]=S; blCyc='PB'; blYr=MS.cur; cycLock(); cycView('PB|'+MS.cur); 'ok'`);
  const idsL = idsNow(), msL = ev(`JSON.stringify(MS)`);
  const XL = exportIt(FORM);
  chk(name, 'locked', 'while a locked cycle is on screen: refused, nothing built, nothing downloaded',
    [failed(XL), /locked cycle is a past plan/.test(XL.msg)].join(' · '), 'false,true,0 · true');
  chk(name, 'locked', 'and nothing written: the store on screen is byte for byte as it was', ev(`JSON.stringify(MS)`) === msL && idsNow() === idsL, true);
  ev(`cycLeave(); 'ok'`);
  chk(name, 'locked', 'back on the working plan, the export makes the file', exportIt(FORM).ok, true);
  const copyHtml = ev(`pmoCopyHtml({sandbox:true, by:'BLL', ts:1790000000000, fy:MS.cur, ap:APPN, base:pmoBaseline(), pv:PMO_PV, ord:{}})`);
  const C = boot({ html: copyHtml, ls: { prio27pmo: 'AV' } });
  const msC = C.ev(`JSON.stringify(MS)`);
  const XC = exportIt(FORM, C.ev);
  chk(name, 'copy', 'a PMO copy refuses: nothing built, nothing downloaded, nothing written',
    [failed(XC), /PMO copy/.test(XC.msg), C.ev(`JSON.stringify(MS)`) === msC].join(' · '), 'false,true,0 · true · true');
  chk(name, 'copy', 'and its IDS box says so before anything is typed',
    /Export is off here\.[^.]*off in a PMO copy/.test(C.ev(`(function(){ toggleIds(); var t=document.getElementById('idsBody').textContent; toggleIds(); return t; })()`)), true);

  // ── THE RECORD PANEL NAMES EVERY ROW'S BUDGET ─────────────────────────────────────────────────────────
  P = build();
  const panelSays = JSON.parse(ev(`(function(){ var out=[];
    S.order.forEach(function(id){ setCur(id); var c=ccarCtlOf(itemById(id)).v; if(!c) return;
      [].slice.call(document.querySelectorAll('#inspector table.budtab select')).forEach(function(s){
        var t=s.getAttribute('title')||'', m=/(?:The file prints|the IDS export files it under): (.+)$/.exec(t);
        if(m) out.push(m[1]+' · '+c); }); });
    return JSON.stringify(out.filter(function(v,i,a){ return a.indexOf(v)===i; }).sort()); })()`));
  chk(name, 'panel', 'every row’s budget is one the RECORD panel names for its line',
    J([...new Set(P.rows.map(r => `${r.bud} · ${r.ctl}`))].sort()), J(panelSays));
  ev(`Date=globalThis.__RD; 'ok'`);
  } catch (e) {
    const msg = String((e && e.message) || e).split('\n')[0].slice(0, 140);
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + msg, got: 'threw', want: 'ran' });
  }
}

// ═══ ONE BUDGET AND CONTROL ACROSS SERVICES (v1.92) ═════════════════════════════════════════════════════════
// STOVL and USMC-B are two services on the board and one in the BAE list's names: a STOVL budget serves both. One
// requirement funded in both lands on ONE budget and control number -- one row, both services in it.
{
  const name = 'v1.92 — the IDS export: one budget and control across two services';
  try {
  const J = JSON.stringify;
  const SD = 'USMC STOVL O&M -1A9A FL Discretionary AV';
  const { ev, errors } = boot();
  seed(ev, { services: ['STOVL', 'USMC-B'], items: [{ id: 'X', grp: 'AV', team: 'AV', sect: '', custom: false, title: 'X title',
    event: 'X event', ccar: 'JSF9', fy26: [0, 0], ask: [30, 20], alloc: null }], disc: [30, 20], mand: [0, 0], order: ['X'] });
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  ev(`MS.ccarIdx={rows:{JSF9:{t:'Record 9', o:'OPR', p:'AV', d:1, k:'2009'}}};
      BUDDB={ts:1700000000041, files:[], rows:[budParseName(${J(SD)})]}; _budRegCache=null; S.budgetAsg={}; render(); 'ok'`);
  const P = JSON.parse(ev(`JSON.stringify(idsBuild())`));
  chk(name, 'services', 'STOVL 30 and USMC-B 20 on one STOVL budget and control: one row of 50/50, both services in it',
    P.rows.map(r => `${r.bud} · ${r.ctl} · ${r.amount}/${r.approved} · ` + r.sources.map(y => y.svc + ' ' + y.amount).join(' + ')).join(' | '),
    `${SD} · 2009 · 50/50 · STOVL 30 + USMC-B 20`);
  chk(name, 'services', 'one requirement on it, so nothing for review', P.multi.length + ' · ' + P.check.ok, '0 · true');
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
    BUD, P1, 'Okonkwo', P2, 'Moonbeam', 'Vellichor', 'Grindlewald', 'Program Support Office', 'Contracting Office Lambda',
    // v1.92, revised: IDS-shaped state -- an ORG number, a typed comment, a file id, a control number
    'Mission Critical Funding Board', '987654', '551237', '20261001-7341', '7341'];
  // what the board holds, or quoted, or a figure: none of it may stay even in the list kept in memory
  const NEVER_KEPT = [T1, T2, T3, EVT, 'JSF77341', 'PIDQX4471', '7,654,321', BUD, P1, P2, 'Program Support Office', 'Contracting Office Lambda',
    'Mission Critical Funding Board', '987654', '551237', '20261001-7341'];
  const leaks = (txt, list) => list.filter(v => String(txt).toLowerCase().indexOf(v.toLowerCase()) >= 0).join(', ') || 'none';
  const { ev } = boot({ ls: { prio27execdb: '{not json', prio27who: P1 } });
  seed(ev, sc);
  ev(`S.pid={A:'PIDQX4471'}; MS.jrnl=(MS.jrnl||[]).concat([{t:1, by:${J(P2)}, id:'A', f:'title', a:'x', b:'y'}]);
      BUDDB={ts:1, files:[], rows:[budParseName(${J(BUD)})].filter(Boolean)}; _budRegCache=null;
      S.budgetAsg={A:{'USAF|d':${J(BUD)}}}; save(); render(); 'ok'`);
  // v1.92, revised before merge: IDS-SHAPED STATE. v1.92 records nothing about an export, but a board saved by v1.91
  // (the comment is made only of words the program itself uses, so only the walk over the stores can take it out)
  // (or an unreleased build) can hold an ORG number, a typed comment, file ids and lines naming budgets, control
  // numbers and dollars under MS.ids. None of it may reach the diagnostics file, even when a warning names it.
  ev(`MS.ids={org:987654, seq:4471, action:'Update', cmt:'Mission Critical Funding Board', issued:['20261001-7341'],
      sent:[{fid:'20261001-7341', ts:1, by:${J(P2)}, fy:2027, lines:[{bud:${J(BUD)}, ctl:'551237', amt:7654321, app:7654321, act:'Add'}]}]};
      _diagSec=null; save(); 'ok'`);
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
  ev(`setStat('⚠ IDS file 20261001-7341 for ORG 987654, control 551237: Mission Critical Funding Board'); 'ok'`);
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

// ═══ NEEDS ATTENTION: EVERY ENTRY OPENS ITS LIST (v1.93, item 42) ═══════════════════════════════════════════════
// Brad: "each error message to have a pop up to show me where the errors are, like it does with the Not Drawn
// statement ... when CCaR records haven't been assigned ... any requirements that are missing obligation dates."
// Four requirements, each case stated here: A banded Keep the Lights On with no impact statement, its one award
// covering its $70 discretionary and not its $30 mandatory; C ranked above B, unfunded, banded, no impact statement,
// no CCaR record, no date; B funded, no CCaR record, no date; D complete. Every list is written from that, never read back.
{
  const name = 'v1.93 — Needs attention: every entry opens its list';
  try {
  const J = JSON.stringify;
  const mk = (id, ask, ccar) => ({ id, grp: id === 'C' ? 'PSM' : 'AV', team: 'AV', sect: '', custom: false, title: id + ' title', event: id + ' event',
    ccar, fy26: [0], ask: [ask], alloc: null });
  const { ev } = boot();
  seed(ev, { services: ['USAF'], items: [mk('A', 100, 'JSF1'), mk('B', 50, ''), mk('C', 40, ''), mk('D', 20, 'JSF4')],
    disc: [140], mand: [30], order: ['A', 'C', 'B', 'D'], fsrc: { A: { m: 'split', dv: [70], mv: [30] }, C: { m: 'split', dv: [0], mv: [0] } } });
  ev(`(function(){ S.band={A:'ktlo', C:'ktlo', D:'ktlo'}; S.cons={D:'the line stops'};
    S.awards={A:{mode:'inc', inc:[{d:FYMON[2][0], day:1, sv:[70]}]}, D:{mode:'single', d:FYMON[3][0]}};
    window.prompt=function(m){ window.__asked=String(m); return null; };
    save(); render(); return 'ok'; })()`);
  chk(name, 'fixture', 'the draws: A 70 + 30, B 50, D 20, C nothing',
    ev(`(function(){ var T=tiers(); return JSON.stringify(['A','B','C','D'].map(function(id){ return [T[id].dT, T[id].mT]; })); })()`), J([[70, 30], [50, 0], [0, 0], [20, 0]]));
  const entries = () => JSON.parse(ev(`JSON.stringify([].slice.call(document.querySelectorAll('#posture .ppatt .e')).map(function(e){ return e.tagName+' '+e.textContent.replace(/\\\\s+/g,' ').trim(); }))`));
  chk(name, 'posture', 'every entry is a button, and says what it counts', J(entries()),
    J(['BUTTON ⚠ 2 impact statements missing', 'BUTTON ○ 2 without a CCaR record', 'BUTTON 📅 2 without an obligation date', 'BUTTON ◔ 1 award short of its funding']));
  const open = (k) => JSON.parse(ev(`(function(){ var b=[].slice.call(document.querySelectorAll('#posture .ppatt button.e')).filter(function(e){ return (e.getAttribute('onclick')||'').indexOf(${J(J(k))})>=0; })[0];
    if(!b) return JSON.stringify({none:true}); b.click();
    var bg=document.getElementById('attPanel'), rows=[].slice.call(document.querySelectorAll('#attBody .atttab tr')).slice(1);
    return JSON.stringify({open:/\\bopen\\b/.test(bg.className), title:document.getElementById('attTitle').textContent,
      rows:rows.map(function(r){ return [].slice.call(r.children).slice(0,-1).map(function(c){ return c.textContent.trim(); }).join(' · '); })}); })()`));
  const close = () => ev(`attClose(); 'ok'`);
  let L = open('imp');
  chk(name, 'impact', 'opens its list: A and C, by rank', L.open + ' ' + L.title + ' ' + L.rows.join(' | '),
    'true ⚠ IMPACT STATEMENTS MISSING 1 · A event · AV · $100 | 2 · C event · PSM · — |  · 2 requirements ·  · $100');
  close(); L = open('ccar');
  chk(name, 'CCaR', 'opens its list: C and B, by rank', L.rows.join(' | '), '2 · C event · PSM · — | 3 · B event · AV · $50 |  · 2 requirements ·  · $50');
  close(); L = open('oblig');
  chk(name, 'date', 'opens its list: every requirement with no date, the funded one first with what it leaves UNSCHEDULED',
    L.rows.join(' | '), '3 · B event · AV · $50 | 2 · C event · PSM · — |  · 2 requirements ·  · $50');
  close(); L = open('awshort');
  chk(name, 'awards short', 'opens its list: A, its $30 mandatory undated', L.rows.join(' | '), '1 · A event · AV · $0 · $30 |  · 1 requirement ·  · $0 · $30');
  // GO TO IT: the list closes, the requirement is selected, the field to fill is open or has the keyboard
  ev(`attGo('awshort','A'); 'ok'`);
  chk(name, 'go to it', 'awards short: A selected, the box closed, the award block’s first award has the keyboard',
    ev(`(function(){ var a=document.activeElement; return [curRow, attOpen, /attPanel/.test(document.querySelector('.modal-bg.open')? document.querySelector('.modal-bg.open').id : ''),
      !!(a && a.closest && a.closest('#inspector .awdblk')), a && a.type].join(' · '); })()`), 'A ·  · false · true · date');
  ev(`attShow('oblig'); attGo('oblig','B'); 'ok'`);
  chk(name, 'go to it', 'no date: B selected, its award date has the keyboard',
    ev(`(function(){ var a=document.activeElement; return [curRow, !!(a && a.closest && a.closest('#inspector .awdblk')), a && a.type].join(' · '); })()`), 'B · true · date');
  ev(`attShow('imp'); attGo('imp','C'); 'ok'`);
  chk(name, 'go to it', 'impact: C selected and its Impact statement editor open', ev(`J=JSON.stringify; J([curRow, fldOpen && fldOpen.id, fldOpen && fldOpen.kind])`), J(['C', 'C', 'cons']));
  ev(`fldClose(); attShow('ccar'); window.__asked=''; attGo('ccar','B'); 'ok'`);
  chk(name, 'go to it', 'CCaR: B selected and its CCaR record asked for', ev(`curRow+' · '+/CCaR record for "B event"/.test(window.__asked)`), 'B · true');
  // FIXED FROM THE LIST, IT LEAVES THE LIST AND THE COUNT AT ONCE
  ev(`S.ccar=S.ccar||{}; S.ccar.B='JSF2'; save(); render(); 'ok'`);
  chk(name, 'fixed', 'B given a CCaR record: the count and the list drop it', J([entries()[1], open('ccar').rows.length]), J(['BUTTON ○ 1 without a CCaR record', 2]));
  close();
  ev(`fillLastAwd('A'); 'ok'`);
  chk(name, 'fixed', 'A’s award covering both lanes: its entry is gone', entries().some(e => /award/.test(e)), false);
  } catch (e) {
    const msg = String((e && e.message) || e).split('\n')[0].slice(0, 140);
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + msg, got: 'threw', want: 'ran' });
  }
}

// ═══ EVERY BOX TAKES THE KEYBOARD, AND TYPING IS NEVER LOST TO A STRAY KEY (v1.93, item 39) ═════════════════
// One controller drives all the boxes: it names each as a dialog from its heading, makes the board behind it
// inert, closes the top box on Esc by pressing that box's own close control, and -- when something typed has not
// been saved -- asks "Discard what you typed?" before Esc, ✕ Close or a click on the backdrop closes it. jsdom
// lays nothing out, so Tab order and focus return are the browser check's (tools/dialogs-keyboard.mjs); this
// holds the rules themselves, with the controller reconciled by hand (dlgSync) where a browser's observer would.
{
  const name = 'v1.93 — every box: named, inert behind, Esc closes, typing guarded';
  try {
  const J = JSON.stringify;
  const mk = (id, ask) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: id + ' title', event: id + ' event',
    ccar: 'JSF1', fy26: [0], ask: [ask], alloc: null });
  const { ev } = boot();
  seed(ev, { services: ['USAF'], items: [mk('A', 100), mk('B', 50)], disc: [150], mand: [0], order: ['A', 'B'] });
  ev(`(function(){ S.cons={A:'the line stops'}; save(); render();
    window.__asked=[]; window.__ans=false; window.confirm=function(m){ window.__asked.push(String(m)); return window.__ans; };
    window.__key=function(k, shift){ var t=document.activeElement||document.body;
      t.dispatchEvent(new KeyboardEvent('keydown', {key:k, shiftKey:!!shift, bubbles:true, cancelable:true})); dlgSync(); };
    window.__type=function(e, txt){ e.focus(); e.value=e.value+txt; e.dispatchEvent(new Event('input', {bubbles:true})); };
    return 'ok'; })()`);
  const state = () => JSON.parse(ev(`JSON.stringify({ stack:DLG.stack.map(function(r){ return r.bg.id; }),
    inert:[].slice.call(document.body.children).filter(function(c){ return c.hasAttribute('inert'); }).map(function(c){ return c.id||c.tagName.toLowerCase(); }),
    open:dlgBoxes().filter(dlgIsOpen).map(function(b){ return b.id; }) })`));
  // NAMED, AND THE BOARD BEHIND IS INERT
  ev(`toggleCr(); dlgSync(); 'ok'`);
  const m = JSON.parse(ev(`(function(){ var m=document.querySelector('#crPanel .modal');
    return JSON.stringify([m.getAttribute('role'), m.getAttribute('aria-modal'), m.getAttribute('aria-label'), m.getAttribute('tabindex')]); })()`));
  chk(name, 'named', 'the CR box is a modal dialog named from its heading, not its ✕ Close', J(m.slice(0, 2)) + ' ' + m[3] + ' ' + /^⚖ CONTINUING RESOLUTION/.test(m[2]) + ' ' + /Close/.test(m[2]), '["dialog","true"] -1 true false');
  let st = state();
  chk(name, 'inert', 'every other part of the page is inert while the box is up, the box itself is not',
    J([st.stack, st.inert.length > 3, st.inert.includes('crPanel'), ev(`!!document.querySelector('.hdr, header') && (document.querySelector('.hdr, header').closest('[inert]')!==null)`)]), J([['crPanel'], true, false, true]));
  // the keyboard is never behind the box: a control on the board that takes focus hands it back
  ev(`(function(){ var b=document.querySelector('#list button') || document.getElementById('saveBtn'); if(b) b.focus(); return 'ok'; })()`);
  chk(name, 'keyboard', 'focusing a control behind the box puts the keyboard back in the box',
    ev(`!!(document.activeElement && document.activeElement.closest && document.activeElement.closest('#crPanel'))`), true);
  // ESC CLOSES THE TOP BOX, BY ITS OWN CLOSE CONTROL, AND THE PAGE COMES BACK
  ev(`__key('Escape'); 'ok'`);
  st = state();
  chk(name, 'Esc', 'Esc closes the box (crOpen false), nothing left inert, nothing asked', J([ev(`crOpen`), st.stack, st.inert, ev(`__asked.length`)]), J([false, [], [], 0]));
  // TYPING GUARDED: the Impact statement editor saves only with its own Save, so what is typed waits there
  ev(`openFld('A','cons'); dlgSync(); __type(document.getElementById('fld-cons'), ' unless'); 'ok'`);
  chk(name, 'typing', 'the editor is open with the typing in it', ev(`fldOpen && fldOpen.id+' · '+document.getElementById('fld-cons').value`), 'A · the line stops unless');
  ev(`__asked=[]; __ans=false; __key('Escape'); 'ok'`);
  chk(name, 'typing', 'Esc asks first; Cancel keeps the box and the typing, and saves nothing',
    J([ev(`__asked.length`), /^Discard what you typed\?/.test(ev(`__asked[0]||''`)), ev(`!!fldOpen`), ev(`document.getElementById('fld-cons').value`), ev(`S.cons.A`)]),
    J([1, true, true, 'the line stops unless', 'the line stops']));
  ev(`__asked=[]; document.querySelector('#fldPanel h3 button.x').dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true})); dlgSync(); 'ok'`);
  chk(name, 'typing', '✕ Close asks first; Cancel keeps it', J([ev(`__asked.length`), ev(`!!fldOpen`), ev(`document.getElementById('fld-cons').value`)]), J([1, true, 'the line stops unless']));
  ev(`__asked=[]; document.getElementById('fldPanel').dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true})); dlgSync(); 'ok'`);
  chk(name, 'typing', 'a click on the backdrop asks first; Cancel keeps it', J([ev(`__asked.length`), ev(`!!fldOpen`), ev(`document.getElementById('fld-cons').value`)]), J([1, true, 'the line stops unless']));
  ev(`__asked=[]; __ans=true; __key('Escape'); 'ok'`);
  chk(name, 'typing', 'Esc and OK: the box closes and the stored statement is untouched', J([ev(`__asked.length`), ev(`fldOpen`), ev(`S.cons.A`), state().stack]), J([1, null, 'the line stops', []]));
  // nothing typed: no question at all
  ev(`__asked=[]; openFld('A','cons'); dlgSync(); __key('Escape'); 'ok'`);
  chk(name, 'typing', 'nothing typed: Esc closes without asking', J([ev(`__asked.length`), ev(`fldOpen`)]), J([0, null]));
  // a field the box commits on change: typed and not yet committed is guarded; once committed, nothing to lose
  ev(`toggleEnt(); dlgSync(); window.__f=[].slice.call(document.querySelectorAll('#entPanel .modal input')).filter(function(e){ return !e.disabled && /^(text|)$/.test(e.getAttribute('type')||'') && !e.hasAttribute('oninput'); })[0];
    __type(__f, 'qz'); __asked=[]; __ans=false; __key('Escape'); 'ok'`);
  chk(name, 'typing', 'a plain field typed in and not committed: Esc asks, Cancel keeps it', J([ev(`__asked.length`), ev(`entOpen`), /qz$/.test(ev(`__f.value`))]), J([1, true, true]));
  ev(`__f.dispatchEvent(new Event('change', {bubbles:true})); __asked=[]; __key('Escape'); 'ok'`);
  chk(name, 'typing', 'once committed (its change event), Esc closes without asking', J([ev(`__asked.length`), ev(`entOpen`)]), J([0, false]));
  // the rule itself, on fields that do not redraw when they commit (the real ones above redraw, which would hide it):
  // typed is waiting until its change event; a field that applies as it is typed (oninput) never is
  ev(`(function(){ toggleCr(); dlgSync(); var m=document.querySelector('#crPanel .modal');
    window.__p=document.createElement('input'); window.__p.type='text'; m.appendChild(window.__p);
    __type(__p, 'qz'); __p.dispatchEvent(new Event('change', {bubbles:true})); __asked=[]; __ans=false; __key('Escape'); return 'ok'; })()`);
  chk(name, 'typing', 'a field committed by its change event, and not redrawn: Esc closes without asking', J([ev(`__asked.length`), ev(`crOpen`)]), J([0, false]));
  ev(`(function(){ toggleCr(); dlgSync(); var m=document.querySelector('#crPanel .modal');
    window.__l=document.createElement('input'); window.__l.type='text'; window.__l.setAttribute('oninput','void 0'); m.appendChild(window.__l);
    __type(__l, 'qz'); __asked=[]; __ans=false; __key('Escape'); return 'ok'; })()`);
  chk(name, 'typing', 'a field that applies as it is typed (oninput), not redrawn: Esc closes without asking', J([ev(`__asked.length`), ev(`crOpen`)]), J([0, false]));
  // ONE BOX ON ANOTHER: Esc closes the top one only, and the one below is live again
  ev(`togglePf(); dlgSync(); toggleJrnl(); dlgSync(); 'ok'`);
  st = state();
  chk(name, 'stacked', 'the journal over the pre-flight check: both open, the lower one inert under the top one',
    J([st.stack, st.inert.includes('pfPanel'), st.inert.includes('jrnlPanel')]), J([['pfPanel', 'jrnlPanel'], true, false]));
  // the journal's filter applies as it is typed, so it is never "typing to lose"
  ev(`__asked=[]; __type(document.querySelector('#jrnlPanel input[oninput]'), 'x'); __key('Escape'); 'ok'`);
  st = state();
  chk(name, 'stacked', 'Esc closes the journal without asking (its filter applies as typed); the pre-flight box stays, live',
    J([ev(`__asked.length`), ev(`jrnlOpen`), st.stack, st.inert.includes('pfPanel')]), J([0, false, ['pfPanel'], false]));
  ev(`__key('Escape'); 'ok'`);
  chk(name, 'stacked', 'Esc again closes the pre-flight box', J([ev(`pfOpen`), state().stack, state().inert]), J([false, [], []]));
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
