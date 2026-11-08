// Audit the two remaining exports that do lane / Mission Critical math:
//   exportCSV      — the Priority Drill workbook (1-N by band, plus a tab per PMO)
//   (the Executive Funding Synopsis was removed in v2.05, item 114)
//
//   exportSrc      — the Spend Plan Source workbook, whose Amount column IS lane arithmetic
//
// The remaining Excel exports (ACE Tie-Out, Chart of Accounts, CR Cash Return) carry no
// lane, MC or unfunded arithmetic — they reconcile against imported sources — so they are not
// covered here. The Spend Plan Source used to be on that list and no longer belongs on it: its
// Amount column is now what DISCRETIONARY paid, straight out of the lane walk. While it was listed
// there it had no money check at all, and changing its basis moved a fixture total from 285 to 150
// with all twelve suites still green.
import { boot, seed, cv, stopAtFirstFailure, BOARD } from './boot.mjs';

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

// A CSV export writes into a Blob; record the text instead of downloading it. (v2.05, item 114: it read the Executive
// Synopsis, removed with the deck; the CSV the board still writes is the proposed 1-N order.)
function captureCsv(ev, call) {
  ev(`globalThis.__csv=null;
      if(!globalThis.__oB) globalThis.__oB=Blob;
      Blob=function(parts){ globalThis.__csv=String(parts&&parts[0]||''); return new globalThis.__oB(parts); };
      ${call};
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
  const unfOf = id => sum(SVC.map((s, i) => Math.max(0, askArr(id)[i] - T[id].d[i] - T[id].m[i])));

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
  // THROUGH A REAL EXPORT: the proposed 1-N order lists the requirement by the name the board shows for it (v2.05: it was
  // the Executive Synopsis, removed with the deck)
  seed(ev, { services: ['USAF'], items: [{ id: 'Q', grp: 'AV', team: 'AV', sect: '', custom: false, title: '=HYPERLINK("http://x","y")', event: '=HYPERLINK("http://x","y")',
    ccar: '', fy26: [0], ask: [100], alloc: null }], disc: [40], mand: [0], order: ['Q'], mc: { Q: true } });
  const rows = captureCsv(ev, 'exportProposedOrder()');
  chk(name, 'export', 'the proposed order writes the name as text, apostrophe first',
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
  // v2.12 W2: the four requirements carry no WBS paragraph, so item 132's ▦ Without a WBS is the last entry (its list is
  // checked in the v2.12 W2 slot)
  chk(name, 'posture', 'every entry is a button, and says what it counts', J(entries()),
    J(['BUTTON ⚠ 2 impact statements missing', 'BUTTON ○ 2 without a CCaR record', 'BUTTON 📅 2 without an obligation date', 'BUTTON ◔ 1 award short of its funding',
       'BUTTON ▦ 4 without a WBS']));
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
  // v2.08 (item 122): the edit box, open at the field
  chk(name, 'go to it', 'impact: C selected and its record open at the impact statement', ev(`J=JSON.stringify; J([curRow, erOpen, document.activeElement && document.activeElement.id])`), J(['C', 'C', 'erCons']));
  ev(`erClose(); attShow('ccar'); attGo('ccar','B'); 'ok'`);
  chk(name, 'go to it', 'CCaR: B selected and its record open at the CCaR record', ev(`[curRow, erOpen, document.activeElement && document.activeElement.id].join(' · ')`), 'B · B · erCcar');
  ev(`erClose(); 'ok'`);
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
  // v2.08 (item 122): the impact statement is written in the edit box, held until its Save
  ev(`openEdit('A','cons'); dlgSync(); __type(document.getElementById('erCons'), ' unless'); 'ok'`);
  chk(name, 'typing', 'the editor is open with the typing in it', ev(`erOpen && erOpen+' · '+document.getElementById('erCons').value`), 'A · the line stops unless');
  ev(`__asked=[]; __ans=false; __key('Escape'); 'ok'`);
  chk(name, 'typing', 'Esc asks first; Cancel keeps the box and the typing, and saves nothing',
    J([ev(`__asked.length`), /^Discard what you typed\?/.test(ev(`__asked[0]||''`)), ev(`!!erOpen`), ev(`document.getElementById('erCons').value`), ev(`S.cons.A`)]),
    J([1, true, true, 'the line stops unless', 'the line stops']));
  ev(`__asked=[]; document.querySelector('#editPanel h3 button.x').dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true})); dlgSync(); 'ok'`);
  chk(name, 'typing', '✕ Close asks first; Cancel keeps it', J([ev(`__asked.length`), ev(`!!erOpen`), ev(`document.getElementById('erCons').value`)]), J([1, true, 'the line stops unless']));
  ev(`__asked=[]; document.getElementById('editPanel').dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true})); dlgSync(); 'ok'`);
  chk(name, 'typing', 'a click on the backdrop asks first; Cancel keeps it', J([ev(`__asked.length`), ev(`!!erOpen`), ev(`document.getElementById('erCons').value`)]), J([1, true, 'the line stops unless']));
  ev(`__asked=[]; __ans=true; __key('Escape'); 'ok'`);
  chk(name, 'typing', 'Esc and OK: the box closes and the stored statement is untouched', J([ev(`__asked.length`), ev(`erOpen`), ev(`S.cons.A`), state().stack]), J([1, null, 'the line stops', []]));
  // nothing typed: no question at all
  ev(`__asked=[]; openEdit('A','cons'); dlgSync(); __key('Escape'); 'ok'`);
  chk(name, 'typing', 'nothing typed: Esc closes without asking', J([ev(`__asked.length`), ev(`erOpen`)]), J([0, null]));
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

// v2.04 (item 108): A RECORD NUMBER NAMES THE RECORD AND OFFERS ITS DESCRIPTION (Brad, 22 Oct 2026). Every expected value is
// typed here from the records file below; none is read back from the board. A has its own number; B none, its two CLINs on one
// record; C none, its CLINs on two records (option (a): "Multiple records (2)", a line per CLIN); D's number is held by two
// records that disagree (no name, never a guess); E has its own number and a Description someone wrote.
{
  const name = 'v2.04 (item 108) — the CCaR records list names the record and offers its short description';
  try {
  const J = JSON.stringify;
  const SV = ['USAF', 'ANG'];
  const mkI = (id, ask) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: id + ' title', event: id + ' event',
    ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
  const { w, ev } = boot();
  seed(ev, { services: SV, items: ['A', 'B', 'C', 'D', 'E'].map(id => mkI(id, [10, 5])), disc: [100, 100], mand: [0, 0],
    order: ['A', 'B', 'C', 'D', 'E'] });
  ev(`S.ccar={A:'JSF1', D:'JSF9', E:'JSF5'}; S.desc={E:'Written by the office'}; S.ptype={B:'PRIME', C:'PRIME'};
      CLINS.B=[{clin:'0001', desc:'b1', ccar:'JSF2', ask:[5,2]}, {clin:'0002', desc:'b2', ccar:'jsf 2', ask:[5,3]}];
      CLINS.C=[{clin:'0001', desc:'c1', ccar:'JSF3', ask:[6,2]}, {clin:'0002', desc:'c2', ccar:'JSF4', ask:[4,3]}];
      DATA.clins=CLINS; save(); render(); 'ok'`);
  const names = () => ev(`['A','B','C','D','E'].map(function(id){ return recName(itemById(id)); }).join(' | ')`);
  chk(name, 'before the list', 'CONTROL: with no records file, every Record Name is the data pack’s title', names(),
    'A title | B title | C title | D title | E title');
  const ROWS = [['CCaR No', 'Title', 'OPR', 'PMO', 'Control No', 'Short Description'],
    ['JSF1', 'Engine overhaul record', 'OPR1', 'AV', '7001', 'Overhaul of the F135 engines'],
    ['JSF2', 'Avionics record', 'OPR2', 'AV', '7002', 'Avionics spares'],
    ['JSF3', 'Clin three record', 'OPR3', 'AV', '7003', 'Third CLIN work'],
    ['JSF4', 'Clin four record', 'OPR4', 'AV', '7004', 'Fourth CLIN work'],
    ['JSF5', 'Support record', 'OPR5', 'AV', '7005', 'Support equipment'],
    ['JSF9', 'Nine A', 'OPR9', 'AV', '7009', 'Nine A work'],
    ['JSF9', 'Nine B', 'OPR9', 'AV', '7010', 'Nine B work']];
  const imp = rows => w.eval(`(async function(){ var b=buildXlsx([{name:'CCaR', cols:[10,20,8,8,8,30], rows:${J(rows)}}]);
    var ab=b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength);
    await importCcarRecs({files:[{name:'records.xlsx', arrayBuffer:async function(){ return ab; }}], value:''}); return 'ok'; })()`);
  await imp(ROWS);
  chk(name, 'Record Name', 'own number → the list’s Title; one shared CLIN record → its Title; two CLIN records → Multiple records (2); a number the list holds under disagreeing records → the data pack’s title, never a guess; own number → its Title',
    names(), 'Engine overhaul record | Avionics record | Multiple records (2) | D title | Support record');
  chk(name, 'import', 'importing the list writes no Description', ev(`JSON.stringify(S.desc)`), J({ E: 'Written by the office' }));
  chk(name, 'Description offered', 'A: its record’s Short Description; B: the shared record’s; C: one line per CLIN; D: none',
    ev(`['A','B','C','D'].map(function(id){ return ccarDescOf(itemById(id)); }).join(' || ')`),
    'Overhaul of the F135 engines || Avionics spares || CLIN 0001 · JSF3 — Third CLIN work\nCLIN 0002 · JSF4 — Fourth CLIN work || ');
  // TYPING A NUMBER fills an EMPTY Description, and only an empty one
  // v2.08 (item 122): typed in the edit box, which fills its description box and writes both on Save
  const ccBox = (id, v) => ev(`(function(){ openEdit(${J(id)},'ccar'); var e=document.getElementById('erCcar'); e.value=${J(v)}; e.dispatchEvent(new Event('input')); erSave(); return 'ok'; })()`);
  ccBox('D', 'JSF2');
  chk(name, 'typed number', 'D typed JSF2: Record Name and Description follow it', ev(`recName(itemById('D'))+' | '+((S.desc||{}).D||'')`),
    'Avionics record | Avionics spares');
  ccBox('E', 'JSF1');
  chk(name, 'typed number', 'E typed JSF1: a written Description is kept', ev(`(S.desc||{}).E||''`), 'Written by the office');

  const pE = ev(`(function(){ curRow='E'; try{ inspectorBody(); }catch(e){ return 'threw '+e.message; } return (document.getElementById('inspector')||{}).innerHTML||''; })()`);
  chk(name, 'RECORD panel', 'E: the panel names the record and offers to REPLACE the Description', /CCaR Record Name[\s\S]*Engine overhaul record[\s\S]*Replace the Description with the CCaR one/.test(pE), true);
  ev(`globalThis.__c=window.confirm; window.confirm=function(){ return false; }; ccarDescUse('E'); window.confirm=globalThis.__c; 'ok'`);
  chk(name, 'RECORD panel', 'E: answered no, the written Description stays', ev(`(S.desc||{}).E||''`), 'Written by the office');
  ev(`globalThis.__c=window.confirm; window.confirm=function(){ return true; }; ccarDescUse('E'); window.confirm=globalThis.__c; 'ok'`);
  chk(name, 'RECORD panel', 'E: replaced only after the question is answered yes', ev(`(S.desc||{}).E||''`), 'Overhaul of the F135 engines');
  // A NEWER LIST renames the record: the name is read, never copied
  await imp(ROWS.map(r => r[0] === 'JSF1' ? ['JSF1', 'Engine overhaul — renamed', 'OPR1', 'AV', '7001', 'x'] : r));
  chk(name, 'newer list', 'A’s Record Name follows the newer list', ev(`recName(itemById('A'))`), 'Engine overhaul — renamed');
  chk(name, 'newer list', 'and E’s Description, now ordinary text, does not move', ev(`(S.desc||{}).E||''`), 'Overhaul of the F135 engines');
  ev(`S.recNames={A:'Typed on the board'}; 'ok'`);
  chk(name, 'typed name', 'a name typed on the board still wins', ev(`recName(itemById('A'))`), 'Typed on the board');
  ev(`delete S.recNames.A; 'ok'`);
  // THE SPEND PLAN SOURCE: a CLIN line carries the CLIN's own record, number and name
  const src = JSON.parse(ev(`(function(){ var got='[]'; var ob=buildXlsx, oa=window.alert, oc=window.confirm;
    window.alert=function(){}; window.confirm=function(){ return true; };
    buildXlsx=function(s){ got=JSON.stringify(s); return new Uint8Array(0); };
    try{ exportSrc(); }catch(e){ got='[]'; } buildXlsx=ob; window.alert=oa; window.confirm=oc; return got; })()`));
  const rows = ((src[0] || {}).rows || []).slice(1);
  const lines = rows.filter(r => txt(r[25])).map(r => `${txt(r[25])}:${txt(r[2])}:${txt(r[3])}`);
  const uniq = [...new Set(lines)].sort().join(' | ');
  chk(name, 'Spend Plan Source', 'every CLIN line carries the CLIN’s own CCaR number and Record Name', uniq,
    '0001:JSF2:Avionics record | 0001:JSF3:Clin three record | 0002:JSF4:Clin four record | 0002:jsf 2:Avionics record');
  chk(name, 'Spend Plan Source', 'CONTROL: a requirement line with its own number keeps it',
    [...new Set(rows.filter(r => !txt(r[25]) && txt(r[2]) === 'JSF1').map(r => txt(r[3])))].join(','), 'Engine overhaul — renamed');
  // THE CLIN DRILL shows each CLIN's own Record Name
  const drill = ev(`(function(){ try{ return clinTable(itemById('C'))||''; }catch(e){ return 'threw '+e.message; } })()`);
  chk(name, 'CLIN drill', 'each CLIN line names its own record', /Clin three record[\s\S]*Clin four record/.test(drill), true);
  } catch (e) {
    const msg = String((e && e.message) || e).split('\n')[0].slice(0, 140);
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + msg, got: 'threw', want: 'ran' });
  }
}

// v2.04 (item 109): THE AI REVIEW ROUND TRIP (Brad, 22 Oct 2026). The request carries the plan's own figures; the answer is read
// through the import door, laid out as a list and checked against the board; NOTHING on the board changes. Every expected figure
// is worked from the fixture: A asks 100 + 50 = 150 and the lanes (disc 120/30, no mandatory) pay 100 + 30; B asks 80 and finds 20.
{
  const name = 'v2.04 (item 109) — the AI review: a request out, an answer in, nothing applied';
  try {
  const J = JSON.stringify;
  const mkI = (id, ask) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: id + ' title', event: id + ' event',
    ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
  const { w, ev } = boot();
  seed(ev, { services: ['USAF', 'ANG'], items: [mkI('A', [100, 50]), mkI('B', [80, 0])], disc: [120, 30], mand: [0, 0], order: ['A', 'B'] });
  ev(`S.costElem={A:'Airframe PGSE'}; save(); render(); 'ok'`);
  const req = ev(`(function(){ var dl=[], oc=HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click=function(){ dl.push(this.download); };
    var t=aiExport(); HTMLAnchorElement.prototype.click=oc; return JSON.stringify({t:t, dl:dl}); })()`);
  const R = JSON.parse(req), body = JSON.parse(R.t.slice(R.t.lastIndexOf('\n{\n') + 1));
  chk(name, 'request', 'one file is written, named for the request', R.dl.length === 1 && /^ORBIT AI review request/.test(R.dl[0]), true);
  chk(name, 'request', 'it says the answer is advisory and gives the answer format', /ADVISORY/.test(R.t) && R.t.includes('"format":"orbitAiReview"'), true);
  const yr = body.fiscalYearOnScreen;
  chk(name, 'request', 'A’s figures for the year on screen: ask 150; funded 130 (USAF 100 + ANG 30, all ANG disc); unfunded 20',
    J(body.requirements.find(r => r.id === 'A').years[yr]), J({ ask: 150, alloc: 150, fund: 130, unf: 20 }));
  chk(name, 'request', 'B’s: ask 80, funded 20 (USAF disc 120 − A’s 100), unfunded 60',
    J([body.requirements.find(r => r.id === 'B').years[yr]].map(y => [y.ask, y.fund, y.unf])), J([[80, 20, 60]]));
  chk(name, 'request', 'it carries the board’s own values a suggestion may use', body.allowedValues.obCat.includes('UPL') && body.requirements[0].costElem === 'Airframe PGSE', true);
  const before = ev(`JSON.stringify(MS)`);
  const answer = 'Here is my review:\n```json\n' + J({ format: 'orbitAiReview', findings: [
    { id: 'B', kind: 'anomaly', year: yr, measure: 'unf', figure: 60, severity: 'high', reason: 'Most of B is unfunded.' },
    { id: 'B', kind: 'anomaly', year: yr, measure: 'fund', figure: 25, severity: 'low', reason: 'A misread figure.' },
    { id: 'Z', kind: 'anomaly', severity: 'low', reason: 'A requirement the board does not hold.' },
    { id: 'B', kind: 'suggestion', field: 'obCat', value: 'UPL', severity: 'medium', reason: 'Looks like an unfunded priority.' },
    { id: 'A', kind: 'suggestion', field: 'costElem', value: 'Not a real element', severity: 'low', reason: 'Invented.' },
    { id: 'A', kind: 'suggestion', field: 'costElem', value: 'Airframe PGSE', reason: 'Already right.' }] }) + '\n```\n';
  await w.eval(`(async function(){ await aiImport({files:[{name:'answer.txt', size:${answer.length}, text:async function(){ return ${J(answer)}; }}], value:''}); return 'ok'; })()`);
  const rows = JSON.parse(ev(`JSON.stringify(AIREV.rows.map(function(r){ return [r.id, r.kind, r.ok, r.checks.join('; ')]; }))`));
  chk(name, 'answer', 'every finding is listed and checked against the board', J(rows), J([
    ['B', 'anomaly', true, ''],
    ['B', 'anomaly', false, 'the board says $20, not $25'],
    ['Z', 'anomaly', false, 'no requirement “Z” on this board'],
    ['B', 'suggestion', true, ''],
    ['A', 'suggestion', false, '“Not a real element” is not one of the board’s Cost element values'],
    ['A', 'suggestion', true, 'already set to this']]));
  chk(name, 'answer', 'NOTHING on the board changed: the whole store is byte for byte as before', ev(`JSON.stringify(MS)`) === before, true);
  const panel = ev(`(document.getElementById('aiBody')||{}).innerHTML||''`);
  chk(name, 'list', 'the list is open, shows the AI’s reasoning and a Go to it for each requirement on the board',
    ev(`document.getElementById('aiPanel').className`) + ' | ' + (panel.includes('Most of B is unfunded.') && (panel.match(/aiGo\(/g) || []).length), 'modal-bg open | 5');
  const refused = await w.eval(`(async function(){ var said=''; var oa=window.alert; window.alert=function(m){ said=String(m); };
    await aiImport({files:[{name:'bad.json', size:40, text:async function(){ return '{"format":"orbitAiReview","findings":[{"__proto__":{"x":1}}]}'; }}], value:''});
    window.alert=oa; return said; })()`);
  chk(name, 'door', 'an answer carrying a built-in name is refused at the import door, and the list read before stays',
    /was not read as an AI review/.test(refused) && ev(`AIREV.file`) === 'answer.txt', true);
  } catch (e) {
    const msg = String((e && e.message) || e).split('\n')[0].slice(0, 140);
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + msg, got: 'threw', want: 'ran' });
  }
}

// v2.04 (item 106): CLEAR THIS COMPUTER removes everything ORBIT keeps in the browser and nothing else, asks first (twice when
// unsaved work would go), and leaves the board file alone.
{
  const name = 'v2.04 (item 106) — Clear this computer';
  try {
  const { ev } = boot();
  seed(ev, { services: ['USAF'], items: [{ id: 'A', grp: 'AV', team: 'AV', sect: '', custom: false, title: 'A', event: 'A', ccar: '', fy26: [0], ask: [10], alloc: null }],
    disc: [10], mand: [0], order: ['A'] });
  ev(`localStorage.setItem('prio27om','{}'); localStorage.setItem('prio27om.kept','{"x":1}'); localStorage.setItem('spmtTheme','harbor');
      localStorage.setItem('prio27who','Brad'); localStorage.setItem('someoneElse','keep me'); sessionStorage.setItem('spmtX','1'); 'ok'`);
  const keys = () => ev(`(function(){ var a=[]; for(var i=0;i<localStorage.length;i++) a.push(localStorage.key(i)); return a.sort().join(','); })()`);
  const before = keys();
  const run = answers => ev(`(function(){ var q=${JSON.stringify(answers)}, asked=[]; var oc=window.confirm;
    window.confirm=function(m){ asked.push(String(m)); return q.length? q.shift() : false; };
    try{ location.reload=function(){}; }catch(e){}
    try{ clearComputer(); }catch(e){ asked.push('threw '+e.message); }
    window.confirm=oc; return JSON.stringify(asked); })()`);
  ev(`DIRTY=true; 'ok'`);
  let asked = JSON.parse(run([false]));
  chk(name, 'declined', 'answered no: nothing is removed', keys(), before);
  chk(name, 'declined', 'the question names the unsaved changes and the work kept aside', /UNSAVED CHANGES/.test(asked[0]) && /KEPT ASIDE/.test(asked[0]), true);
  asked = JSON.parse(run([true, false]));
  chk(name, 'last check', 'with work that would be lost, a second question; answered no, nothing is removed', asked.length === 2 && keys() === before, true);
  asked = JSON.parse(run([true, true]));
  chk(name, 'cleared', 'every prio27 and spmt key goes; a key ORBIT does not own stays', keys(), 'someoneElse');
  chk(name, 'cleared', 'this tab’s session storage too', ev(`String(sessionStorage.getItem('spmtX'))`), 'null');
  } catch (e) {
    const msg = String((e && e.message) || e).split('\n')[0].slice(0, 140);
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + msg, got: 'threw', want: 'ran' });
  }
}

// v2.04 (item 113): THE HOUSE STYLE -- every report workbook dressed for briefing, the figures untouched. Brad, 22 Oct 2026:
// "Only update the style for now." So the check is that nothing but the style moved: each export's workbook, read back,
// holds exactly the values the same sheets hold written plain; every part is XML another program can read; every count
// the stylesheet declares is what it holds and every cell's style is one it declares; the cells of a row are in column
// order and a sheet's parts in the schema's order (Excel refuses either); a sheet that must stay as it is -- the IDS
// template's Requirement v1 -- is written byte for byte as before; the footer's & is a code, so a literal one is
// doubled and then escaped. The five-year plan's Summary carries a chart read off its own cells, and its tabs print
// their headings on every page. The Spend Plan Source and the 1A9A are never dressed: CCaR and the comptroller read them.
{
  const name = 'v2.04 (item 113) — the house style: every report dressed, no figure moved';
  try {
  const J = JSON.stringify;
  const { ev } = boot();
  seed(ev, SCENARIOS[Object.keys(SCENARIOS)[0]]);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      window.confirm=function(){ return true; }; window.alert=function(){}; HTMLAnchorElement.prototype.click=function(){};
      S.awards={}; S.awards[S.order[0]]={mode:'single', d:FYMON[2][0], day:3}; applyState(S); MS.years[MS.cur]=S; MS.base=MS.cur; save();
      blCyc='PB'; blYr=MS.cur; cycLock(); cycCmpA='PB|'+MS.cur; cycCmpB='working'; fydpSrc='working'; 'ok'`);
  // the stored zip's parts, each read as another program reads XML; the arguments the export handed the writer
  ev(`window.__houseParts=function(u){ var dv=new DataView(u.buffer, u.byteOffset, u.byteLength), at=0, td=new TextDecoder(), o={};
      while(at+30<=u.length && dv.getUint32(at,true)===0x04034b50){ var sz=dv.getUint32(at+18,true), nl=dv.getUint16(at+26,true), xl=dv.getUint16(at+28,true);
        o[td.decode(u.subarray(at+30,at+30+nl))]=td.decode(u.subarray(at+30+nl+xl,at+30+nl+xl+sz)); at+=30+nl+xl+sz; } return o; }; 'ok'`);
  const run = async (call) => JSON.parse(await ev(`(async function(){
    var o=buildXlsx, args=null, got=null;
    buildXlsx=function(sh, ex, op){ args=[JSON.parse(JSON.stringify(sh)), ex? JSON.parse(JSON.stringify(ex)) : ex, op? JSON.parse(JSON.stringify(op)) : op]; got=o(sh, ex, op); return got; };
    try{ ${call}; }catch(e){ buildXlsx=o; return JSON.stringify({err:String((e&&e.message)||e)}); }
    buildXlsx=o;
    if(!got) return JSON.stringify({err:'no workbook'});
    var plain=o(args[0], args[1], null), parts=__houseParts(got), pp=__houseParts(plain), bad=[], sch=[], ord=[], xfs=[];
    var P=function(t){ return new DOMParser().parseFromString(t,'application/xml'); };
    Object.keys(parts).forEach(function(k){ if(/\\.(xml|rels)$/.test(k) && P(parts[k]).getElementsByTagName('parsererror').length) bad.push(k); });
    var st=P(parts['xl/styles.xml']), cnt={};
    ['numFmts','fonts','fills','borders','cellXfs'].forEach(function(t){ var e=st.getElementsByTagName(t)[0]; if(e) cnt[t]=[+e.getAttribute('count'), e.children.length]; });
    var nxf=cnt.cellXfs? cnt.cellXfs[1] : 0;
    var ORDER=['sheetPr','dimension','sheetViews','sheetFormatPr','cols','sheetData','mergeCells','printOptions','pageMargins','pageSetup','headerFooter','drawing'];
    var sheets={};
    Object.keys(parts).filter(function(k){ return /^xl\\/worksheets\\/sheet\\d+\\.xml$/.test(k); }).forEach(function(k){
      var d=P(parts[k]), ws=d.documentElement, kids=[].slice.call(ws.children).map(function(e){ return e.localName; });
      var ix=kids.map(function(n){ return ORDER.indexOf(n); }); if(ix.some(function(v,i){ return v<0 || (i && v<ix[i-1]); })) sch.push(k+': '+kids.join(','));
      [].slice.call(d.getElementsByTagName('row')).forEach(function(r){ var last=-1; [].slice.call(r.getElementsByTagName('c')).forEach(function(c){
        var ref=c.getAttribute('r'), col=0; ref.replace(/^[A-Z]+/, function(L){ for(var i=0;i<L.length;i++) col=col*26+(L.charCodeAt(i)-64); return L; });
        if(col<=last) ord.push(k+' '+ref); last=col; var s=+(c.getAttribute('s')||0); if(!(s>=0 && s<nxf)) xfs.push(k+' '+ref+' s='+s); }); });
      var sv=d.getElementsByTagName('sheetView')[0], ft=d.getElementsByTagName('oddFooter')[0];
      sheets[k]={grid:sv? sv.getAttribute('showGridLines') : null, tab:!!d.getElementsByTagName('tabColor').length, land:(d.getElementsByTagName('pageSetup')[0]||{getAttribute:function(){ return null; }}).getAttribute('orientation'),
        foot:ft? ft.textContent : null, same:parts[k]===pp[k]};
    });
    var wb=P(parts['xl/workbook.xml']), names=[].slice.call(wb.getElementsByTagName('sheet')).map(function(e){ return e.getAttribute('name'); });
    var titles=[].slice.call(wb.getElementsByTagName('definedName')).map(function(e){ return {sheet:+e.getAttribute('localSheetId'), ref:e.textContent}; });
    var a=await xlsxRead(got.buffer.slice(got.byteOffset, got.byteOffset+got.byteLength)), b=await xlsxRead(plain.buffer.slice(plain.byteOffset, plain.byteOffset+plain.byteLength));
    return JSON.stringify({house:!!(args[2]&&args[2].house), bad:bad, cnt:cnt, sch:sch, ord:ord.slice(0,5), xfs:xfs.slice(0,5), sheets:sheets, names:names, titles:titles,
      same:JSON.stringify(a)===JSON.stringify(b), nvals:JSON.stringify(a).length, parts:Object.keys(parts), types:parts['[Content_Types].xml'],
      chart:parts['xl/charts/chart1.xml']||'', rels:parts['xl/worksheets/_rels/sheet1.xml.rels']||'', read:a}); })()`));
  const CALLS = ['exportExcel()', 'exportCSV()', 'exportPlans()', 'exportFlow()', 'exportCoa()', 'exportFcView()', 'exportCycCompare()', 'exportFydpPlan()'];
  const R = {};
  for (const c of CALLS) {
    const r = R[c] = await run(c);
    chk(name, c, 'builds, dressed', J([r.err || '', r.house]), J(['', true]));
    if (r.err) continue;
    chk(name, c, 'every value is the one the same sheets hold written plain — and there are values', r.same && r.nvals > 200, true);
    chk(name, c, 'every part is XML another program reads', J(r.bad), '[]');
    chk(name, c, 'every count the stylesheet declares is what it holds', J(Object.keys(r.cnt).filter(k => r.cnt[k][0] !== r.cnt[k][1])), '[]');
    chk(name, c, 'every cell’s style is one the stylesheet declares', J(r.xfs), '[]');
    chk(name, c, 'the cells of a row are in column order', J(r.ord), '[]');
    chk(name, c, 'a sheet’s parts are in the schema’s order', J(r.sch), '[]');
    const sh = Object.values(r.sheets);
    chk(name, c, 'every sheet: no gridlines, a tab colour, landscape, a footer naming the report and the sheet',
      J(sh.filter(x => !(x.grid === '0' && x.tab && x.land === 'landscape' && /^&L&8ORBIT .+&R&8Page &P of &N  ·  printed \d{4}-\d\d-\d\d$/.test(x.foot || ''))).length), '0');
  }
  // the five-year plan: an & in a name is doubled in the footer; the chart reads its own cells; headings repeat on every page
  const F = R['exportFydpPlan()'];
  if (!F.err) {
    const app = ev(`appnName(mySlug())`), ai = F.names.indexOf(app);
    chk(name, 'FYDP', 'the footer doubles an & in a sheet name, so it prints as one (O&M)',
      app.indexOf('&') < 0 || (F.sheets['xl/worksheets/sheet' + (ai + 1) + '.xml'].foot || '').indexOf(app.replace(/&/g, '&&')) > 0, true);
    chk(name, 'FYDP', 'the Summary carries a chart: its drawing, its part and both content types',
      J([F.parts.indexOf('xl/charts/chart1.xml') >= 0, F.parts.indexOf('xl/drawings/drawing1.xml') >= 0, /Target="\.\.\/drawings\/drawing1\.xml"/.test(F.rels),
        /PartName="\/xl\/charts\/chart1\.xml" ContentType="application\/vnd\.openxmlformats-officedocument\.drawingml\.chart\+xml"/.test(F.types),
        /PartName="\/xl\/drawings\/drawing1\.xml"/.test(F.types)]), J([true, true, true, true, true]));
    // each series is the column its name heads, on the Summary, over the fiscal years
    const refs = [...F.chart.matchAll(/<c:ser>[\s\S]*?<c:v>([^<]*)<\/c:v>[\s\S]*?<c:cat><c:strRef><c:f>([^<]*)<\/c:f>[\s\S]*?<c:val><c:numRef><c:f>([^<]*)<\/c:f>/g)]
      .map(m => [m[1], m[2].replace(/&apos;/g, "'"), m[3].replace(/&apos;/g, "'")]);
    const sm = F.read.Summary || [];
    const cell = ref => { const m = /^'(.+)'!\$([A-Z]+)\$(\d+):\$([A-Z]+)\$(\d+)$/.exec(ref); if (!m) return null; const col = m[2].charCodeAt(0) - 65;
      return { sheet: m[1], col, r0: +m[3] - 1, r1: +m[5] - 1 }; };
    chk(name, 'FYDP chart', 'two series, Requirement then Allocated, each reading the column its name heads on the Summary, over the five fiscal years',
      J(refs.map(([n, c, v]) => { const C = cell(c), V = cell(v); if (!C || !V) return 'unreadable'; const hdr = sm[V.r0 - 1] || [];
        return [n, V.sheet, String(hdr[V.col] ?? ''), V.r1 - V.r0 + 1, (sm.slice(C.r0, C.r1 + 1).map(r => String((r || [])[C.col] ?? '')).join(',')), sm.slice(V.r0, V.r1 + 1).every(r => typeof (r || [])[V.col] === 'number' || (r || [])[V.col] === '—')]; })),
      J(['Requirement', 'Allocated'].map(n => { const y = +ev('MS.base||MS.cur'); return [n, 'Summary', n, 5, [0, 1, 2, 3, 4].map(k => 'FY' + ((y + k) % 100)).join(','), true]; })));
    chk(name, 'FYDP print titles', 'the appropriation tab repeats its two heading rows on every page; the Summary, service and PMO tabs, whose tables each have their own, do not',
      J(F.titles.map(t => [F.names[t.sheet], /^'(.+)'!\$(\d+):\$(\d+)$/.test(t.ref) && RegExp.$1 === F.names[t.sheet].replace(/'/g, "''") ? (+RegExp.$3 - +RegExp.$2 + 1) : 'bad ref ' + t.ref])),
      J([[app, 2]]));
  }
  // the IDS file: its Requirement v1 sheet is the template, written exactly as before; the sheet after it is dressed
  const ids = JSON.parse(ev(`(function(){ var sh=function(){ return [{name:'Requirement v1', cols:[10,10], rows:[['20261022-0001'],[{v:'Ref No',s:2},{v:'Amount',s:2}],[1,1234567]]},
      {name:'Missing data', cols:[30], rows:[[{v:'IDS — missing data and anomalies',s:7}],['note'],[],[{v:'What',s:2}],['x & y']]}]; };
    var a=__houseParts(buildXlsx(idsHouse(sh()), IDS_XTRA, xlsxHouse('IDS Batch Import'))), b=__houseParts(buildXlsx(sh(), IDS_XTRA));
    return JSON.stringify([a['xl/worksheets/sheet1.xml']===b['xl/worksheets/sheet1.xml'], a['xl/worksheets/sheet2.xml']!==b['xl/worksheets/sheet2.xml'] && /showGridLines="0"/.test(a['xl/worksheets/sheet2.xml'])]); })()`));
  chk(name, 'IDS', 'Requirement v1 is written byte for byte as the plain writer writes it, and the sheet after it is dressed', J(ids), J([true, true]));
  // the two formats other offices read in are never dressed; every other report is
  const src = _selfRead(BOARD, 'utf8');
  const calls = []; const re = /\nfunction ((?:export|pmo|cr)[A-Za-z0-9_]*)\s*\(/g; let m;
  const fns = [...src.matchAll(re)].map(x => ({ n: x[1], at: x.index }));
  for (const mm of src.matchAll(/[^A-Za-z_.]buildXlsx\(/g)) {
    const f = fns.filter(x => x.at < mm.index).pop(); if (!f || !/^(export|pmoReport|crExport)/.test(f.n)) continue;
    let d = 0, i = mm.index + mm[0].length - 1; for (; i < src.length; i++) { if (src[i] === '(') d++; else if (src[i] === ')' && --d === 0) break; }
    calls.push([f.n, /xlsxHouse\(|house:true/.test(src.slice(mm.index, i))]);
  }
  // v2.10 B: FYDP Disconnects (exportFdc, item 130) joins the reports that do not ask: it is drawn in the look of Brad's own
  // Spruill slides ("this exact look, color scheme, structure"), and the house would paint its colours over theirs. Until
  // builder A's exportFdc is on the board there are fifteen; with it, sixteen (the integration should make that 16 outright).
  const NOHOUSE = /^(exportSrc|crExport|exportFdc)$/;
  chk(name, 'which reports', 'every report workbook asks for the house style but the Spend Plan Source and the 1A9A, which CCaR and the comptroller read in, and FYDP Disconnects, which has the slides’ own look',
    J(calls.filter(c => c[1] === NOHOUSE.test(c[0])).map(c => c[0])), '[]');
  chk(name, 'which reports', 'and the list is the thirteen reports that write a workbook and the two (three, with FYDP Disconnects) that do not',
    calls.length, 16);   // v2.10 integration: exportFdc is on the board, so the count is 16 outright
  ev(`blLock('PB|'+MS.cur, false); blDelete('PB|'+MS.cur); 'ok'`);
  } catch (e) {
    const msg = String((e && e.message) || e).split('\n')[0].slice(0, 140);
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + msg, got: 'threw', want: 'ran' });
  }
}

// v2.07 (item 121): ONE BOX BUILDS THE WHOLE RECORD (Brad, 24 Oct 2026). The strip took a title and a value and left every
// other field to be found afterwards in three places; a PMO copy then refused to send the proposal until ten of them were
// filled. The box asks for them all before Add, for ONE office, and writes nothing until Add. Each rule is driven here through
// the rendered controls -- a value set and its input / change events fired, a rendered button clicked -- and every expected
// figure, list and label is typed from the fixture below and Brad's rules, never read back from the board:
//   offices PSM and AV; services USAF, ANG, STOVL; A (PSM, ★, event 'alpha event') ranked over B (AV) and C (PSM);
//   PSM's office ranking A, C; FY26 holds P26 (PSM) and V26 (AV);
//   the BAE list: PSM has one Discretionary USAF name, one Mandatory USAF name, one lane-less ANG name, a retired and a
//   Full Fund USAF name, and no STOVL name; AV has a USAF and a STOVL name; one name has no office (a legacy budget); and one
//   names NEWO, an office that does not exist yet;
//   the CCaR records list: JSF1 'Engine overhaul record' (Overhaul of the F135 engines), JSF2 'Avionics record' (Avionics
//   spares); JSF7 is in no list.
{
  const name = 'v2.07 — the Add requirement box (item 121)';
  try {
  const J = JSON.stringify;
  const SV = ['USAF', 'ANG', 'STOVL'];
  const mkI = (id, grp, ask, ev) => ({ id, grp, team: grp, sect: '', custom: false, title: id + ' title', event: ev,
    ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
  const { ev } = boot();
  seed(ev, { services: SV, items: [mkI('A', 'PSM', [100, 40, 20], 'alpha event'), mkI('B', 'AV', [50, 0, 0], 'bravo event'),
    mkI('C', 'PSM', [30, 10, 0], 'charlie event')], disc: [200, 100, 50], mand: [50, 20, 10], order: ['A', 'B', 'C'], mc: { A: true } });
  const BAE = { psmDisc: 'USAF O&M- CAM Discretionary PSM', psmMand: 'USAF O&M - CAM OBBBA Mandatory PSM', psmAng: 'USAF O&M - ANG CAM PSM',
    psmGone: 'USAF O&M- CAM PES Discretionary PSM', psmFF: 'USAF F-35 Full Fund Supt Discretionary PSM', avDisc: 'USAF O&M- CAM Discretionary AV',
    avStovl: 'USMC STOVL O&M -1A9A FL Discretionary AV', legacy: 'USAF O&M- CAM', newo: 'USAF O&M- CAM Discretionary NEWO',
    cpp: 'USAF O&M- CAM Discretionary C++' };
  const OB = 'PMO LM Contract';
  ev(`(function(){
    BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.pmoOrder={PSM:['A','C'], AV:['B']};
    var T=freshYearState(); T.order=['P26','V26'];
    T.custom=[{id:'P26', grp:'PSM', team:'PSM', sect:'new', custom:true, title:'P26 title', event:'PSM last year', ccar:'', fy26:[0,0,0], ask:[5,0,0], alloc:null},
              {id:'V26', grp:'AV', team:'AV', sect:'new', custom:true, title:'V26 title', event:'AV last year', ccar:'', fy26:[0,0,0], ask:[7,0,0], alloc:null}];
    MS.years['2026']=T;
    var B=${J(BAE)};
    BUDDB={ts:1790000000121, files:[], rows:Object.keys(B).map(function(k){ return k==='psmGone'? {n:B[k], gone:1} : {n:B[k]}; })};
    _budRegCache=null;
    MS.ccarIdx={rows:{JSF1:{t:'Engine overhaul record', o:'OPR1', p:'PSM', d:1, k:'7001', s:'Overhaul of the F135 engines'},
                      JSF2:{t:'Avionics record', o:'OPR2', p:'PSM', d:1, k:'7002', s:'Avionics spares'},
                      JSF8:{t:'Shared number', o:'OPR8', p:'PSM', d:2, k:'7008', s:'Held twice'}}};
    save(); render();
    window.__asked=[]; window.__ans=false; window.confirm=function(m){ window.__asked.push(String(m)); return window.__ans; };
    window.__g=function(id){ return document.getElementById(id); };
    window.__key=function(k, t){ t=t||document.activeElement||document.body;
      t.dispatchEvent(new KeyboardEvent('keydown', {key:k, bubbles:true, cancelable:true})); dlgSync(); };
    // a person types: the value replaced, then its input and change events
    window.__set=function(id, v){ var e=__g(id); if(!e) return 'no #'+id; e.focus(); e.value=v;
      e.dispatchEvent(new Event('input', {bubbles:true})); e.dispatchEvent(new Event('change', {bubbles:true})); return 'ok'; };
    // a person picks from a rendered select: refused if the box does not offer it
    window.__pick=function(id, v){ var e=__g(id); if(!e) return 'no #'+id; e.value=v; if(e.value!==String(v)) return 'not offered';
      e.dispatchEvent(new Event('change', {bubbles:true})); return 'ok'; };
    window.__click=function(sel){ var b=document.querySelector(sel); if(!b) return 'no '+sel; b.click(); dlgSync(); return 'ok'; };
    window.__cancel=function(){ var b=[].slice.call(document.querySelectorAll('#arFt button')).filter(function(x){ return x.textContent==='Cancel'; })[0];
      if(!b) return 'no Cancel'; b.click(); dlgSync(); return 'ok'; };
    window.__box=function(){ var h=function(id){ var e=__g(id); return e? e.hidden : null; };
      return JSON.stringify({open:arOpen, cls:/\\bopen\\b/.test(__g('addPanel').className), off:arOff, step:h('arOffStep'), form:h('arNew'), yr:h('arYr'),
        who:__g('arWho')? __g('arWho').textContent : null}); };
    window.__rail=function(){ return JSON.stringify([].slice.call(document.querySelectorAll('#arChk li')).map(function(li){
      return li.className+':'+li.childNodes[1].textContent+(li.querySelector('span:not(.sr)')? li.querySelector('span:not(.sr)').textContent : ''); })); };
    window.__opts=function(id){ var e=__g(id); return e? [].slice.call(e.options).map(function(o){ return o.value; }) : null; };
    window.__snap=function(){ var o={}; Object.keys(S).forEach(function(k){ o[k]=JSON.stringify(S[k]); }); return o; };
    window.__diff=function(a, nid){ var b=__snap(), out=[], isO=function(v){ return !!v && typeof v==='object' && !Array.isArray(v); };
      Object.keys(a).concat(Object.keys(b)).filter(function(k,i,arr){ return arr.indexOf(k)===i; }).sort().forEach(function(k){
        if(a[k]===b[k]) return;
        var x=a[k]===undefined? undefined : JSON.parse(a[k]), y=b[k]===undefined? undefined : JSON.parse(b[k]);
        if((x===undefined || isO(x)) && isO(y)){ x=x||{};
          var sub=Object.keys(x).concat(Object.keys(y)).filter(function(s,i,arr){ return arr.indexOf(s)===i && JSON.stringify(x[s])!==JSON.stringify(y[s]); });
          out.push(k+'['+sub.map(function(s){ return s===nid? 'NEW' : s; }).join(',')+']'); }
        else out.push(k); });
      return out; };
    return 'ok'; })()`);
  const box = () => JSON.parse(ev(`__box()`));
  const rail = () => JSON.parse(ev(`__rail()`));
  const btn = () => ev(`__g('arAddBtn').textContent`);
  const val = id => ev(`(__g(${J(id)})||{value:'(none)'}).value`);
  const say = () => ev(`__g('arMsg')? __g('arMsg').textContent : '(no message line)'`);
  const store = () => ev(`JSON.stringify(MS)`);
  const RAIL9 = ['Plan event', 'Prime contract / OGC', 'Requirement value', 'Budget', 'Obligation category', 'WBS', 'Goes to', 'Description', 'Impact statement'];

  // ── (1) ONE OFFICE. "Once they select their PMO, that's the only PMO they can support with adding requirements." ─────────
  // One office chosen at the top is used as is, and said.
  ev(`setPmoFilter('PSM'); __click('#toolAdd'); 'ok'`);
  let b = box();
  chk(name, 'office', 'PSM chosen at the top: the box opens for PSM, asks nothing, shows the form, and says whose it is',
    J([b.open, b.cls, b.off, b.step, b.form, /^For PSM — the only office this box adds for \(the office chosen at the top\)/.test(b.who)]),
    J([true, true, 'PSM', true, false, true]));
  chk(name, 'office', 'a box under the box controller: a modal dialog named from its heading',
    ev(`(function(){ var m=document.querySelector('#addPanel .modal'); return [m.getAttribute('role'), m.getAttribute('aria-modal'), /^＋ Add requirement/.test(m.getAttribute('aria-label')||'')].join(' · '); })()`),
    'dialog · true · true');
  ev(`__cancel(); 'ok'`);
  // All offices: the box asks first, and shows no form until it is answered
  ev(`setPmoFilter('ALL'); __click('#toolAdd'); 'ok'`);
  b = box();
  chk(name, 'office', 'All offices: the box asks which office first, and shows neither the form nor the year list',
    J([b.open, b.off, b.step, b.form, b.yr, b.who]), J([true, '', false, true, true, 'Choose the office first.']));
  chk(name, 'office', 'the question offers every office on the board', J(JSON.parse(ev(`JSON.stringify(__opts('arOffice'))`))), J(['', 'ATL', 'PSM', 'PP', 'AV', 'MxS', 'CDS', 'TSS', 'BOP']));
  let ms0 = store();
  ev(`__click('#arAddBtn'); 'ok'`);
  chk(name, 'office', 'Add before the office is chosen: refused in the box, nothing written',
    J([say(), store() === ms0, box().open]), J(['Choose the office first: pick it, or move to it with the arrow keys and press Enter.', true, true]));
  // A KEYBOARD MOVE ONLY MOVES (v2.07 review): Chromium fires change on every arrow key of a closed select, and the first
  // ArrowDown locked the box to the first office and sent the keyboard on -- no other office could be reached. Moved through
  // with the arrow keys, each move firing change as Chromium does: nothing chosen. Enter: the one moved to.
  ev(`(function(){ var s=__g('arOffice'); ['ATL','PSM'].forEach(function(v){ __key('ArrowDown', s); s.value=v; s.dispatchEvent(new Event('change', {bubbles:true})); }); return 'ok'; })()`);
  chk(name, 'office', 'moved through with the arrow keys, each move firing change: no office chosen yet, the question still asked',
    J([box().off, box().step, box().form]), J(['', false, true]));
  ev(`__key('Enter', __g('arOffice')); 'ok'`);
  chk(name, 'office', 'Enter on it: the office moved to is chosen, and the keyboard goes on to the plan event',
    J([box().off, box().step, box().form, ev(`document.activeElement && document.activeElement.id`)]), J(['PSM', true, false, 'arEvent']));
  ev(`__cancel(); __click('#toolAdd'); 'ok'`);
  chk(name, 'office', 'CONTROL: reopened, the question is asked again', J([box().off, box().step]), J(['', false]));
  chk(name, 'office', 'answering the question (a change on the rendered select)', ev(`__pick('arOffice', 'PSM')`), 'ok');
  b = box();
  chk(name, 'office', 'answered PSM: the question goes, the form shows, the office is said as chosen here',
    J([b.off, b.step, b.form, /^For PSM — the only office this box adds for \(chosen here\)/.test(b.who)]), J(['PSM', true, false, true]));
  // the budgets and the year list follow it
  ev(`__set('arV0', '1'); __set('arV1', '1'); 'ok'`);
  chk(name, 'office', 'the budgets offered are PSM’s', J(JSON.parse(ev(`JSON.stringify([__opts('arB0'), __opts('arB1')])`))), J([['', BAE.psmDisc], ['', BAE.psmAng]]));
  ev(`__set('arV0', ''); __set('arV1', ''); __click('#arTabYr'); 'ok'`);
  chk(name, 'office', 'From another year: FY26 is offered', ev(`__pick('naFromFy', '2026')`), 'ok');
  const yrRows = () => ev(`[].slice.call(document.querySelectorAll('#naFromWrap tr[data-id]')).map(function(r){ return r.getAttribute('data-id'); }).join(',')`);
  chk(name, 'office', 'the year list is PSM’s: P26, never AV’s V26', yrRows(), 'P26');
  // NOTHING IN THE BOX CHANGES IT: the one control that sets the office is the question, gone once answered; and the
  // office chosen on the board behind the box does not reach into it
  chk(name, 'office', 'the only control in the box that sets the office is the question, and it is hidden once answered',
    ev(`(function(){ var c=[].slice.call(document.querySelectorAll('#addPanel [onchange], #addPanel [onclick], #addPanel [oninput], #addPanel [onkeydown]')).filter(function(e){
      return /arSetOffice|arOffPick|arOffKey|setPmoFilter|arOff\\s*=/.test((e.getAttribute('onchange')||'')+(e.getAttribute('onclick')||'')+(e.getAttribute('oninput')||'')+(e.getAttribute('onkeydown')||'')); });
      return c.map(function(e){ return e.id; }).join(',')+' · '+(c.length===1 && c[0].closest('[hidden]')!==null); })()`), 'arOffice · true');
  ev(`setPmoFilter('AV'); 'ok'`);
  chk(name, 'office', 'AV chosen on the board behind the open box: the box still adds for PSM, its year list still PSM’s',
    J([box().off, yrRows()]), J(['PSM', 'P26']));
  ev(`__click('#arTabNew'); __set('arV0', '1'); 'ok'`);
  chk(name, 'office', 'and its budgets still PSM’s', J(JSON.parse(ev(`JSON.stringify(__opts('arB0'))`))), J(['', BAE.psmDisc]));
  ev(`__cancel(); setPmoFilter('PSM'); 'ok'`);
  // and AV's own box lists AV's year
  ev(`setPmoFilter('AV'); __click('#toolAdd'); __click('#arTabYr'); __pick('naFromFy', '2026'); 'ok'`);
  chk(name, 'office', 'CONTROL: a box for AV lists AV’s V26', yrRows(), 'V26');
  ev(`__cancel(); setPmoFilter('PSM'); __click('#toolAdd'); 'ok'`);

  // ── (2) THE REQUIRED LIST, AND ADD PRESSED EARLY ─────────────────────────────────────────────────────────────────────
  // "All required to be added." The rail is the proposal gate's own list: plan event, Prime / OGC, the requirement, a budget
  // for every service with a value (nothing to choose yet), obligation category, WBS, Goes to, description, impact statement.
  chk(name, 'required', 'the rail lists every required field, each still needed, the budget waived until a service has a value',
    J(rail()), J(RAIL9.map(l => l === 'Budget' ? 'na:Budget · once a service has a value' : 'no:' + l)));
  chk(name, 'required', 'and it is reqNeeds() on what the box holds, field for field',
    J(rail().map(r => r.split(':')[1].split(' · ')[0])), ev(`JSON.stringify(reqNeeds(arRead().d).map(function(x){ return arShort(x.l); }))`));
  chk(name, 'required', 'the button and the count say 8 still needed', btn() + ' · ' + ev(`__g('arReadyN').textContent`), 'Add requirement — 8 still needed · 1 of 9');
  ms0 = store();
  const n0 = ev(`S.order.length+' · '+S.custom.length+' · '+DATA.items.length`);
  ev(`__click('#arAddBtn'); 'ok'`);
  chk(name, 'Add early', 'Add pressed with nothing filled: nothing added, nothing written to the store, the box stays open',
    J([ev(`S.order.length+' · '+S.custom.length+' · '+DATA.items.length`), store() === ms0, box().open]), J([n0, true, true]));
  chk(name, 'Add early', 'it says how many are still needed, and which',
    say(), '8 still needed before it can be added: Plan event · Prime contract / OGC · Requirement value · Obligation category · WBS · Goes to · Description · Impact statement.');
  chk(name, 'Add early', 'every missing field is marked, and nothing else',
    ev(`[].slice.call(document.querySelectorAll('#arNew .miss')).map(function(e){ return e.id; }).join(',')`), 'arF_titles,arF_ptype,arF_obCat,arF_wbs,arV0,arF_dest,arF_desc,arF_cons');
  chk(name, 'Add early', 'and the first of them has the keyboard', ev(`document.activeElement && document.activeElement.id`), 'arEvent');
  chk(name, 'Add early', 'the message is the box’s own -- an alert inside it, never the status line the box covers',
    ev(`__g('arMsg').closest('#addPanel .modal')!==null && __g('arMsg').getAttribute('role')==='alert'`), true);
  // the count follows what is typed, and a mark comes off a field as soon as it is answered
  ev(`__set('arEvent', 'Depot tooling'); 'ok'`);
  chk(name, 'count', 'the plan event typed: 7 still needed, its mark gone', btn() + ' · ' + ev(`__g('arF_titles').classList.contains('miss')`), 'Add requirement — 7 still needed · false');
  ev(`__click('#arPtO'); 'ok'`);
  chk(name, 'count', 'OGC pressed: 6 still needed, the switch says which', btn() + ' · ' + ev(`__g('arPtO').getAttribute('aria-pressed')+'/'+__g('arPtP').getAttribute('aria-pressed')`),
    'Add requirement — 6 still needed · true/false');

  // "Spread a total" puts WHOLE dollars into the boxes, the leftover to the first services (v1.89; Brad, 30 Sep 2026: $100
  // across three is 34 / 33 / 33), there to be read and changed before Add -- never a share with cents, never one rounded alone
  const vals = () => J([val('arV0'), val('arV1'), val('arV2'), ev(`__g('arTot').textContent`)]);
  ev(`__set('arSpread', '100'); __click('#arNew .ar-spread button'); 'ok'`);
  chk(name, 'spread', '$100 over three services: 34 / 33 / 33, the total $100, the spread box emptied', vals() + ' ' + val('arSpread'),
    J(['34', '33', '33', '$100']) + ' ');
  ev(`__set('arSpread', '1,000,000'); __click('#arNew .ar-spread button'); 'ok'`);
  chk(name, 'spread', '$1,000,000 over three: 333,334 / 333,333 / 333,333, to the dollar', vals(), J(['333,334', '333,333', '333,333', '$1,000,000']));
  ev(`__set('arSpread', '12abc'); __click('#arNew .ar-spread button'); 'ok'`);
  chk(name, 'spread', 'a total that cannot be read spreads nothing, and says so', J([/^The total was not spread: /.test(say()), JSON.parse(vals())]),
    J([true, ['333,334', '333,333', '333,333', '$1,000,000']]));
  ev(`__set('arSpread', ''); __set('arV0', ''); __set('arV1', ''); __set('arV2', ''); 'ok'`);

  // ── (3) BUDGETS: "Only that PMO's budgets should pop up." ────────────────────────────────────────────────────────────
  chk(name, 'budgets', 'no service has a value: no picker shows, each says why',
    ev(`[0,1,2].map(function(i){ return __g('arB'+i).hidden+':'+__g('arBn'+i).textContent; }).join(' | ')`),
    'true:add a value to choose a budget | true:add a value to choose a budget | true:add a value to choose a budget');
  ev(`__set('arV0', '1.2M'); 'ok'`);
  chk(name, 'budgets', 'USAF given a value: its picker shows PSM’s one USAF name -- not AV’s, not the Mandatory one, not the legacy, retired or Full Fund names',
    J([ev(`__g('arB0').hidden`), JSON.parse(ev(`JSON.stringify(__opts('arB0'))`)), ev(`__g('arB1').hidden`)]), J([false, ['', BAE.psmDisc], true]));
  chk(name, 'budgets', 'and the rail now asks for one budget', J(rail()[3]), J('no:Budget · 0 of 1 chosen'));
  ev(`__set('arV1', '350,000'); __set('arV2', '100'); 'ok'`);
  chk(name, 'budgets', 'ANG: PSM’s lane-less ANG name; STOVL: PSM has none, so no picker, and it says so',
    J([JSON.parse(ev(`JSON.stringify(__opts('arB1'))`)), ev(`__g('arB2').hidden`), ev(`__g('arBn2').textContent`)]),
    J([['', BAE.psmAng], true, 'no STOVL budget is listed for PSM']));
  chk(name, 'budgets', 'the rail asks for two -- STOVL is waived -- and the total is the three values', J([rail()[3], ev(`__g('arTot').textContent`)]),
    J(['no:Budget · 0 of 2 chosen', '$1,550,100']));
  chk(name, 'budgets', 'AV’s USAF name cannot be chosen for a PSM requirement', ev(`__pick('arB0', ${J(BAE.avDisc)})`), 'not offered');
  chk(name, 'budgets', 'nor PSM’s Mandatory one', ev(`__pick('arB0', ${J(BAE.psmMand)})`), 'not offered');
  ev(`__pick('arB0', ${J(BAE.psmDisc)}); __pick('arB1', ${J(BAE.psmAng)}); 'ok'`);
  chk(name, 'budgets', 'both chosen: the rail says 2 of 2', J(rail()[3]), J('ok:Budget · 2 of 2 chosen'));

  // ── (4) WHERE THE MONEY GOES: the OGC fields only for a government activity; a PRIME is never asked for a WBS ──────────
  ev(`__pick('arTo', 'lm'); 'ok'`);
  chk(name, 'OGC', 'Goes to a prime: Which awards to and MIPR type are neither shown nor asked for',
    J([ev(`__g('arF_destEnd').hidden+' · '+__g('arF_mipr').hidden`), rail().some(r => /Which awards to|MIPR type/.test(r))]), J(['true · true', false]));
  ev(`__pick('arTo', 'dla'); 'ok'`);
  chk(name, 'OGC', 'Goes to a government activity: both shown, and both required',
    J([ev(`__g('arF_destEnd').hidden+' · '+__g('arF_mipr').hidden`), rail().filter(r => /Which awards to|MIPR type/.test(r))]),
    J(['false · false', ['no:Which awards to', 'no:MIPR type']]));
  ev(`__set('arWbs', '1.2.3'); 'ok'`);
  ev(`__click('#arPtP'); 'ok'`);
  chk(name, 'PRIME', 'Prime contract pressed: the WBS box goes, says it is logged per CLIN, and the rail does not ask for it',
    J([ev(`__g('arWbs').hidden`), ev(`__g('arWbsNote').textContent`), rail()[5]]), J([true, 'logged per CLIN, in its CLIN drill once it is added', 'ok:WBS']));
  ev(`__set('arWbs', ''); 'ok'`);
  chk(name, 'PRIME', 'even with nothing typed in it', J(rail()[5]), J('ok:WBS'));
  ev(`__click('#arPtO'); 'ok'`);
  chk(name, 'PRIME', 'back to OGC: the WBS is shown and asked for again', J([ev(`__g('arWbs').hidden`), rail()[5]]), J([false, 'no:WBS']));

  // ── (5) THE RECORD TITLE IS READ, NEVER TYPED; THE LIST'S DESCRIPTION FILLS AN EMPTY ONE ─────────────────────────────
  // "When the record number is typed in, it auto fills the Record Title. Nobody should be typing in the Record Title."
  chk(name, 'record title', 'the box’s fields are these and no others -- no record title, band, star, award date or RCN / EEIC to type',
    ev(`[].slice.call(document.querySelectorAll('#arNew input, #arNew select, #arNew textarea')).map(function(e){ return e.id; }).join(',')`),
    'arEvent,arPtype,arCcar,arPid,arOb,arWbs,arV0,arB0,arV1,arB1,arV2,arB2,arSpread,arTo,arEnd,arMipr,arDesc,arCons,arNote');
  chk(name, 'record title', 'before a record is typed the title says where it comes from',
    ev(`__g('arRecT').tagName+' · '+__g('arRecT').textContent`), 'SPAN · filled from the CCaR records list when the record is typed');
  ev(`__set('arCcar', 'jsf 1'); 'ok'`);
  chk(name, 'record title', 'jsf 1 typed: the list’s title, read only, and its short description in the empty description',
    J([ev(`__g('arRecT').textContent`), val('arDesc')]), J(['Engine overhaul record', 'Overhaul of the F135 engines']));
  ev(`__set('arCcar', 'JSF2'); 'ok'`);
  chk(name, 'record title', 'changed to JSF2: the title and the description the box filled both follow it',
    J([ev(`__g('arRecT').textContent`), val('arDesc')]), J(['Avionics record', 'Avionics spares']));
  ev(`__set('arCcar', 'JSF7'); 'ok'`);
  chk(name, 'record title', 'JSF7, in no list: no title, said so, and the filled description goes with the record it came from',
    J([ev(`__g('arRecT').textContent`), val('arDesc')]), J(['not in the CCaR records list', '']));
  ev(`__set('arCcar', 'JSF8'); 'ok'`);
  chk(name, 'record title', 'JSF8, which the list holds twice: no title taken, and it says the number is held twice -- not that it is missing',
    J([ev(`__g('arRecT').textContent`), val('arDesc')]), J(['held by 2 records in the CCaR records list — no title is taken from it', '']));
  ev(`__set('arDesc', 'Written by the office'); __set('arCcar', 'JSF1'); 'ok'`);
  chk(name, 'record title', 'a description somebody typed is never overwritten by the list’s', J([ev(`__g('arRecT').textContent`), val('arDesc')]),
    J(['Engine overhaul record', 'Written by the office']));

  // ── (6) ADD WRITES EXACTLY WHAT THE BOX HOLDS ─────────────────────────────────────────────────────────────────────────
  ev(`__set('arPid', 'P-77'); __pick('arOb', ${J(OB)}); __set('arWbs', '1.2.3'); __pick('arEnd', 'lm'); __pick('arMipr', 'direct');
      __set('arCons', 'The line stops.'); __set('arNote', 'a note'); 'ok'`);
  chk(name, 'Add', 'every required field answered: the button says Add requirement, 11 of 11', btn() + ' · ' + ev(`__g('arReadyN').textContent`),
    'Add requirement · 11 of 11');
  chk(name, 'Add', 'and the rail ticks all eleven, the budget among them',
    J(rail().map(r => r.split(':')[0])), J(Array(11).fill('ok')));
  // A FIGURE THAT CANNOT BE READ, A CODE OVER ITS LIMIT: refused, never cut and never taken for $0, the box keeping the text
  ms0 = store();
  ev(`__set('arCcar', 'JSF1234567890'); __click('#arAddBtn'); 'ok'`);
  chk(name, 'refused', 'a CCaR record of 13 characters: not added, nothing written, the text kept and marked',
    J([/^This requirement was not added\. The CCaR record .* is 13 characters; it can be at most 12\..*the box keeps what you typed\.$/.test(say()),
       store() === ms0, box().open, val('arCcar'), ev(`__g('arF_ccar')? __g('arF_ccar').classList.contains('miss')+' · '+__g('arCcar').getAttribute('aria-invalid') : 'the box is gone'`)]),
    J([true, true, true, 'JSF1234567890', 'true · true']));
  chk(name, 'refused', 'and it says nothing was changed once, not twice', (say().match(/[Nn]othing/g) || []).length, 1);
  ev(`__set('arCcar', 'JSF1'); __set('arV2', '1.5.0'); __click('#arAddBtn'); 'ok'`);
  chk(name, 'refused', 'a STOVL value that cannot be read: not added -- never taken for $0 -- nothing written, the text kept, the keyboard on it',
    J([/^This requirement was not added\. STOVL: .*the box keeps what you typed\.$/.test(say()), store() === ms0, val('arV2'),
       ev(`document.activeElement && document.activeElement.id`), val('arDesc')]), J([true, true, '1.5.0', 'arV2', 'Written by the office']));
  ev(`__set('arV2', '100'); 'ok'`);
  // THE REFERENCE IS PEEKED, NEVER SPENT: asked twice it is the same number and the year is untouched; the add then gets it
  const pk = JSON.parse(ev(`(function(){ var s0=JSON.stringify(S), a=newReqSeqPeek(), b=newReqSeqPeek(); return JSON.stringify([a, b, JSON.stringify(S)===s0]); })()`));
  chk(name, 'reference', 'peeked twice: one number, and the year state unchanged', J([pk[0] === pk[1], pk[2]]), J([true, true]));
  const NID = 'NEW-' + pk[0];
  chk(name, 'reference', 'the rail names that reference', ev(`/reference ${NID}(?![0-9])/.test((__g('arSum')||{}).textContent||'')`), true);
  ev(`window.__s0=__snap(); window.__y26=JSON.stringify(MS.years['2026']); window.__n=DATA.items.length;
      window.__saves=0; window.__caps=0; if(!window.__os) window.__os=save; if(!window.__oj) window.__oj=jrnlCapture;
      save=function(){ window.__saves++; return window.__os.apply(this, arguments); };
      jrnlCapture=function(){ window.__caps++; return window.__oj.apply(this, arguments); };
      __click('#arAddBtn');
      save=window.__os; jrnlCapture=window.__oj; 'ok'`);
  b = box();
  chk(name, 'Add', 'Add: the box closes and empties', J([b.open, b.cls, ev(`__g('arBody').innerHTML`)]), J([false, false, '']));
  chk(name, 'Add', 'the new requirement has the peeked reference and sits at the bottom of the order and of PSM’s ranking',
    J([ev(`S.order[S.order.length-1]`), JSON.parse(ev(`JSON.stringify(S.pmoOrder.PSM)`))]), J([NID, ['A', 'C', NID]]));
  chk(name, 'Add', 'it writes the requirement, the order, PSM’s ranking, its Split and the box’s fields -- and nothing else',
    J(JSON.parse(ev(`JSON.stringify(__diff(__s0, ${J(NID)}))`))),
    J(['budgetAsg[NEW]', 'ccar[NEW]', 'cons[NEW]', 'custom', 'desc[NEW]', 'dest[NEW]', 'fsrc[NEW]', 'mipr[NEW]', 'newSeq', 'notes[NEW]',
       'obCat[NEW]', 'order', 'pid[NEW]', 'pmoOrder[PSM]', 'ptype[NEW]', 'wbs[NEW]']));
  chk(name, 'Add', 'each one as the box held it',
    ev(`(function(){ var n=${J(NID)}; return JSON.stringify([S.ccar[n], S.pid[n], S.ptype[n], S.obCat[n], S.wbs[n], S.dest[n], S.mipr[n], S.desc[n], S.notes[n], S.cons[n]]); })()`),
    J(['JSF1', 'P-77', 'OGC', OB, [{ w: '1.2.3', v: [] }], { to: 'dla', end: 'lm' }, 'direct', 'Written by the office', 'a note', 'The line stops.']));
  chk(name, 'Add', 'the requirement: PSM, the plan event typed, the CCaR list’s title, the values as typed, added, unstarred',
    ev(`(function(){ var it=itemById(${J(NID)}); return JSON.stringify([it.grp, it.event, it.title, it.ask, !!it.custom, !!S.mc[it.id], DATA.items.length-__n, recName(it)]); })()`),
    J(['PSM', 'Depot tooling', 'Engine overhaul record', [1200000, 350000, 100], true, false, 1, 'Engine overhaul record']));
  chk(name, 'Add', 'on a Split, and FY26 untouched', J([ev(`(S.fsrc[${J(NID)}]||{m:'none'}).m`), ev(`JSON.stringify(MS.years['2026'])===__y26`)]), J(['split', true]));
  chk(name, 'Add', 'ONE save, so ONE journal capture', ev(`__saves+' · '+__caps`), '1 · 1');
  chk(name, 'budgets', 'the Discretionary name lands under USAF|disc, the lane-less one under the bare service',
    ev(`JSON.stringify(S.budgetAsg[${J(NID)}])`), J({ 'USAF|disc': BAE.psmDisc, ANG: BAE.psmAng }));
  chk(name, 'budgets', 'and the budget authority calls both chosen',
    ev(`['USAF','ANG'].map(function(s){ return budResolve(${J(NID)}, s, 'disc').status; }).join(' · ')`), 'chosen · chosen');
  chk(name, 'Add', 'the proposal gate on the new requirement asks for nothing', ev(`JSON.stringify(pmoProposalGate(${J(NID)}))`), '[]');
  chk(name, 'Add', 'CONTROL: the same gate on A, which carries none of it, names every field A lacks', ev(`JSON.stringify(pmoProposalGate('A'))`),
    J(['Prime contract / OGC', 'Budget (BAE)', 'Obligation category', 'WBS', 'Goes to', 'Description', 'Impact statement']));
  chk(name, 'Add', 'and the status line says what was added, where', ev(`__g('shareStat').textContent`),
    `➕ Added ${NID} — Depot tooling — to FY27 for PSM, at the bottom of the order.`);

  // ── (7) CANCEL AND ESC: nothing is written until Add, and typing is never lost to a stray key ───────────────────────────
  ms0 = store();
  ev(`__click('#toolAdd'); __set('arEvent', 'qz'); __asked=[]; __ans=false; __key('Escape'); 'ok'`);
  chk(name, 'Esc', 'typed, then Esc: it asks first; Cancel keeps the box and the typing',
    J([ev(`__asked.length`), /^Discard what you typed\?/.test(ev(`__asked[0]||''`)), box().open, val('arEvent')]), J([1, true, true, 'qz']));
  ev(`__asked=[]; __ans=true; __key('Escape'); 'ok'`);
  chk(name, 'Esc', 'Esc and OK: the box closes and nothing is written', J([ev(`__asked.length`), box().open, store() === ms0]), J([1, false, true]));
  ev(`__click('#toolAdd'); __set('arEvent', 'qz'); __set('arV0', '5'); __asked=[]; __cancel(); 'ok'`);
  chk(name, 'Cancel', 'typed, then Cancel: it closes without asking, and nothing is written', J([ev(`__asked.length`), box().open, store() === ms0]), J([0, false, true]));
  ev(`__click('#toolAdd'); 'ok'`);
  chk(name, 'Cancel', 'reopened: every field is empty and the rail starts again',
    J([ev(`[].slice.call(document.querySelectorAll('#arNew input, #arNew select, #arNew textarea')).filter(function(e){ return e.value!==''; }).map(function(e){ return e.id; }).join(',')`), btn()]),
    J(['', 'Add requirement — 8 still needed']));
  ev(`__asked=[]; __key('Escape'); 'ok'`);
  chk(name, 'Esc', 'nothing typed: Esc closes without asking', J([ev(`__asked.length`), box().open]), J([0, false]));

  // ── (8) "ADD AND OPEN ITS RECORD" takes off a filter that would hide it, and says so ─────────────────────────────────
  ev(`__g('q').value='alpha'; mcOnly=true; render(); __click('#toolAdd');
      __set('arEvent', 'Test bench'); __set('arWbs', 'W-9'); __click('#arPtP'); __set('arCcar', 'JSF7'); __set('arV0', '500');
      __pick('arB0', ${J(BAE.psmDisc)}); __pick('arOb', ${J(OB)}); __pick('arTo', 'lm'); __set('arDesc', 'Bench.'); __set('arCons', 'No bench.');
      __set('arV1', '5'); __pick('arB1', ${J(BAE.psmAng)}); __set('arV1', '');
      __click('#arAddOpen'); 'ok'`);
  await new Promise(r => setTimeout(r, 30));
  const N2 = ev(`S.order[S.order.length-1]`);
  chk(name, 'open its record', 'the search and ★-only are off, the new requirement is on screen and its record open',
    J([ev(`__g('q').value`), ev(`mcOnly`), ev(`curRow`) === N2, ev(`!!__g('row-'+curRow)`), N2 !== NID]), J(['', false, true, true, true]));
  chk(name, 'open its record', 'and the status line says which filters came off', ev(`__g('shareStat').textContent`),
    `Showing ${N2} in its record — the search, ★ Mission Critical only were taken off so it can be seen.`);
  chk(name, 'open its record', 'a PRIME with a WBS typed before Prime was pressed: no WBS written; a CCaR in no list: no title',
    ev(`JSON.stringify([S.ptype[${J(N2)}], (S.wbs||{})[${J(N2)}]===undefined, itemById(${J(N2)}).title])`), J(['PRIME', true, '']));
  // A BUDGET IS WRITTEN ONLY FOR A SERVICE WITH A VALUE (v2.07 review): ANG was given a value and a budget, then its value
  // erased -- its picker hid and kept the choice, and the requirement was written with a budget for a service asking $0
  chk(name, 'open its record', 'ANG given a value and a budget, then its value erased: only USAF’s budget is written',
    ev(`JSON.stringify([itemById(${J(N2)}).ask, S.budgetAsg[${J(N2)}]])`), J([[500, 0, 0], { 'USAF|disc': BAE.psmDisc }]));

  // ── (3, again) NO BAE LIST LOADED: there is nothing to choose, so every service is waived and the requirement is added ─
  ev(`window.__bud=BUDDB; BUDDB={ts:1790000000122, files:[], rows:[]}; _budRegCache=null; __click('#toolAdd');
      __set('arEvent', 'No list yet'); __click('#arPtO'); __set('arV0', '40.60'); __set('arV1', '2'); __pick('arOb', ${J(OB)}); __set('arWbs', '4.5');
      __pick('arTo', 'lm'); __set('arDesc', 'd'); __set('arCons', 'c'); 'ok'`);
  chk(name, 'no BAE list', 'no picker shows; each service with a value says no list is loaded',
    ev(`[0,1,2].map(function(i){ return __g('arB'+i).hidden+':'+__g('arBn'+i).textContent; }).join(' | ')`),
    'true:no BAE list is loaded — chosen once one is | true:no BAE list is loaded — chosen once one is | true:add a value to choose a budget');
  chk(name, 'no BAE list', 'the budget is waived on the rail, and nothing else is missing', J([rail()[3], btn()]), J(['na:Budget · no BAE list is loaded', 'Add requirement']));
  ev(`__click('#arAddBtn'); 'ok'`);
  const N3 = ev(`S.order[S.order.length-1]`);
  chk(name, 'no BAE list', 'Add: it is added, with no budget written', J([box().open, ev(`itemById(${J(N3)}).event`), ev(`(S.budgetAsg||{})[${J(N3)}]===undefined`)]),
    J([false, 'No list yet', true]));
  // A FIGURE ROUNDED TO A WHOLE DOLLAR IS SAID (v2.07 review), as every other money editor says it (amtNo)
  chk(name, 'no BAE list', 'USAF typed as 40.60: added as $41, and the status line says it was entered as $41',
    J([ev(`itemById(${J(N3)}).ask[0]`), /USAF: “40\.60” was entered as \$41 — the board keeps whole dollars\.$/.test(ev(`__g('shareStat').textContent`))]), J([41, true]));
  ev(`BUDDB=window.__bud; _budRegCache=null; 'ok'`);

  // ── (9) A LOCKED CYCLE, J / K, AND THE EMPTY YEAR ──────────────────────────────────────────────────────────────────
  ev(`blCyc='PB'; blYr=MS.cur; cycLock(); cycView('PB|'+MS.cur); 'ok'`);
  chk(name, 'locked', 'a locked cycle on screen: Add requirement opens nothing, and says why',
    J([ev(`String(arShow())`), ev(`__click('#toolAdd')`), box().open, box().cls, /Adding requirements is off while/.test(ev(`__g('shareStat').textContent`))]),
    J(['false', 'ok', false, false, true]));
  ev(`cycLeave(); blLock('PB|'+MS.cur, false); blDelete('PB|'+MS.cur); 'ok'`);
  ev(`setPmoFilter('ALL'); __g('q').value=''; render(); setCur('A'); if(document.activeElement) document.activeElement.blur(); __key('j', document.body); 'ok'`);
  chk(name, 'J / K', 'CONTROL: with no box open, J moves the selection from A to the next row', ev(`curRow`), 'B');
  ev(`setCur('A'); __click('#toolAdd'); __pick('arOffice', 'PSM'); __g('arPtP').focus(); __key('j', __g('arPtP')); __key('k', __g('arPtP')); 'ok'`);
  chk(name, 'J / K', 'J and K pressed on a button in the box leave the selection behind it where it was',
    J([ev(`document.activeElement && document.activeElement.id`), ev(`curRow`)]), J(['arPtP', 'A']));
  ev(`__cancel(); 'ok'`);
  {
    const E = boot();
    seed(E.ev, { services: ['USAF'], items: [], disc: [0], mand: [0], order: [] });
    E.ev(`render(); 'ok'`);
    chk(name, 'empty year', 'a year with no requirements says so, and its button opens the box',
      E.ev(`(function(){ var l=document.getElementById('list'), b=l.querySelector('button'); var t=l.textContent.replace(/\\s+/g,' ').trim();
        if(!b) return t+' · no button'; b.click(); return t+' · '+arOpen+' · '+/\\bopen\\b/.test(document.getElementById('addPanel').className); })()`),
      'FY27 holds no requirements yet. ＋ Add requirement · true · true');
  }

  // ── (10) THE BUDGET LIST FOLLOWS THE OFFICES; AN OFFICE NAMED LIKE A PATTERN ─────────────────────────────────────────
  // "An office added in Setup offered no budgets until the page was reloaded": the list was cached without the offices.
  chk(name, 'offices', 'CONTROL: before NEWO exists its budget names no office, so nobody is offered it',
    ev(`(budReg().filter(function(b){ return b.n===${J(BAE.newo)}; })[0]||{}).pmo`), '');
  ev(`window.__oup=uiPrompt; window.__pmoName='NEWO'; uiPrompt=function(m, d, cb){ cb(window.__pmoName); }; pmoAdd(); uiPrompt=window.__oup; 'ok'`);
  ev(`setPmoFilter('NEWO'); __click('#toolAdd'); __set('arV0', '10'); 'ok'`);
  chk(name, 'offices', 'NEWO added in Setup, no reload: the box for NEWO offers its budget',
    J([box().off, JSON.parse(ev(`JSON.stringify(__opts('arB0'))`))]), J(['NEWO', ['', BAE.newo]]));
  ev(`__cancel(); 'ok'`);
  chk(name, 'offices', 'an office named C++ is added, and nothing throws',
    ev(`(function(){ try{ window.__pmoName='C++'; uiPrompt=function(m, d, cb){ cb(window.__pmoName); }; pmoAdd(); uiPrompt=window.__oup;
      setPmoFilter('ALL'); __click('#toolAdd'); __pick('arOffice', 'C++'); __set('arV0', '10'); return GROUPS.indexOf('C++')>=0? 'ok' : 'not added'; }
      catch(e){ uiPrompt=window.__oup; return 'threw: '+e.message; } })()`), 'ok');
  chk(name, 'offices', 'and the box for C++ offers C++’s budget', J([box().off, JSON.parse(ev(`JSON.stringify(__opts('arB0'))`))]), J(['C++', ['', BAE.cpp]]));
  ev(`__cancel(); 'ok'`);
  } catch (e) {
    const msg = String((e && e.message) || e).split('\n')[0].slice(0, 140);
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + msg, got: 'threw', want: 'ran' });
  }
}

// v2.07 REVIEW OF THE ADD BOX (25 Oct 2026). An independent review of v2.07 found the box saying less, or doing less, than
// the person at it would expect, in seven places; each is fixed and held here through the rendered controls -- a value set and
// its input / change events fired, a rendered button clicked, a key pressed on the control -- with every expectation typed from
// the fixture below and the rule it states, never read back from the board:
//   offices PSM and AV, then "(AV)" added through Setup; services USAF, ANG, STOVL; A (PSM) ranked over B (AV);
//   FY26 holds P26 and Q26, both PSM's and both missing fields, so each opens in New requirement to be finished;
//   the BAE list: PSM has a Discretionary USAF name and a lane-less ANG one; AV a USAF and a STOVL name (ending " AV");
//   and one USAF name ends "(AV)".
// A second review of those fixes (25 Oct 2026) added here: a WBS Add refused for its length keeps its mark until it is right;
// one ticked to finish while another is being finished waits behind it (Add and open hidden until the last); and Reset year's
// line names the Add requirement box there is.
{
  const name = 'v2.07 — the review of the Add box: rounding, an office named (AV), the marks, the office keys, the PMO filter, a ticked row, Add and open';
  try {
  const J = JSON.stringify;
  const SV = ['USAF', 'ANG', 'STOVL'];
  const mkI = (id, grp, ask, ev) => ({ id, grp, team: grp, sect: '', custom: false, title: id + ' title', event: ev,
    ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
  const { ev } = boot();
  seed(ev, { services: SV, items: [mkI('A', 'PSM', [100, 40, 20], 'alpha event'), mkI('B', 'AV', [50, 0, 0], 'bravo event')],
    disc: [200, 100, 50], mand: [50, 20, 10], order: ['A', 'B'] });
  const BAE = { psmDisc: 'USAF O&M- CAM Discretionary PSM', psmAng: 'USAF O&M - ANG CAM PSM', avDisc: 'USAF O&M- CAM Discretionary AV',
    avStovl: 'USMC STOVL O&M -1A9A FL Discretionary AV', parAv: 'USAF O&M- CAM Discretionary (AV)' };
  const OB = 'PMO LM Contract';
  ev(`(function(){
    BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.pmoOrder={PSM:['A'], AV:['B']};
    var T=freshYearState(); T.order=['P26','Q26'];
    T.custom=[{id:'P26', grp:'PSM', team:'PSM', sect:'new', custom:true, title:'P26 title', event:'papa event', ccar:'', fy26:[0,0,0], ask:[5,0,0], alloc:null},
              {id:'Q26', grp:'PSM', team:'PSM', sect:'new', custom:true, title:'Q26 title', event:'quebec event', ccar:'', fy26:[0,0,0], ask:[7,0,0], alloc:null}];
    MS.years['2026']=T;
    var B=${J(BAE)};
    BUDDB={ts:1790000000125, files:[], rows:Object.keys(B).map(function(k){ return {n:B[k]}; })};
    _budRegCache=null;
    save(); render();
    window.__asked=[]; window.__ans=false; window.confirm=function(m){ window.__asked.push(String(m)); return window.__ans; };
    window.__g=function(id){ return document.getElementById(id); };
    // a key pressed on a control, with Alt held where asked
    window.__key=function(k, t, o){ t=t||document.activeElement||document.body; var d={key:k, bubbles:true, cancelable:true};
      if(o) for(var p in o) d[p]=o[p]; t.dispatchEvent(new KeyboardEvent('keydown', d)); dlgSync(); };
    window.__set=function(id, v){ var e=__g(id); if(!e) return 'no #'+id; e.focus(); e.value=v;
      e.dispatchEvent(new Event('input', {bubbles:true})); e.dispatchEvent(new Event('change', {bubbles:true})); return 'ok'; };
    window.__pick=function(id, v){ var e=__g(id); if(!e) return 'no #'+id; e.value=v; if(e.value!==String(v)) return 'not offered';
      e.dispatchEvent(new Event('change', {bubbles:true})); return 'ok'; };
    window.__click=function(sel){ var b=document.querySelector(sel); if(!b) return 'no '+sel; b.click(); dlgSync(); return 'ok'; };
    window.__cancel=function(){ var b=[].slice.call(document.querySelectorAll('#arFt button')).filter(function(x){ return x.textContent==='Cancel'; })[0];
      if(!b) return 'no Cancel'; b.click(); dlgSync(); return 'ok'; };
    window.__box=function(){ var h=function(id){ var e=__g(id); return e? e.hidden : null; };
      return JSON.stringify({open:arOpen, off:arOff, step:h('arOffStep'), form:h('arNew')}); };
    window.__rail=function(){ return JSON.stringify([].slice.call(document.querySelectorAll('#arChk li')).map(function(li){
      return li.className+':'+li.childNodes[1].textContent+(li.querySelector('span:not(.sr)')? li.querySelector('span:not(.sr)').textContent : ''); })); };
    window.__opts=function(id){ var e=__g(id); return e? [].slice.call(e.options).map(function(o){ return o.value; }) : null; };
    // what an early Add marked, as the page has it: the outlined boxes, and the controls a screen reader hears as invalid
    window.__marks=function(){ var ids=function(s){ return [].slice.call(document.querySelectorAll(s)).map(function(e){ return e.id; }).join(','); };
      return ids('#arNew .miss')+' | '+ids('#arNew [aria-invalid]'); };
    // every required field answered, a prime contract (so no WBS), USAF only
    window.__fill=function(evn){ __set('arEvent', evn); __click('#arPtP'); __set('arV0', '500'); __pick('arB0', B.psmDisc);
      __pick('arOb', ${J(OB)}); __pick('arTo', 'lm'); __set('arDesc', 'd'); __set('arCons', 'c'); return 'ok'; };
    return 'ok'; })()`);
  const box = () => JSON.parse(ev(`__box()`));
  const rail = () => JSON.parse(ev(`__rail()`));
  const val = id => ev(`(__g(${J(id)})||{value:'(none)'}).value`);
  const say = () => ev(`__g('arMsg')? __g('arMsg').textContent+' · '+__g('arMsg').className : '(no message line)'`);
  const stat = () => ev(`__g('shareStat').textContent`);
  const marks = () => ev(`__marks()`);

  // ── ROUNDING IS SAID. A total spread, or a figure typed, that is not whole dollars is kept as whole dollars -- and the box
  // says so, as every other money editor does (amtNo). "1,000,000.50" spread over three went in as 333,334 / 334 / 333 with
  // the box silent, so the person read $1,000,001 back without being told the .50 had become a dollar.
  ev(`setPmoFilter('PSM'); __click('#toolAdd'); 'ok'`);
  chk(name, 'rounding', 'CONTROL: the box opens for PSM, the office chosen at the top', J([box().open, box().off, box().form]), J([true, 'PSM', false]));
  ev(`__set('arSpread', '1,000,000.50'); __click('#arNew .ar-spread button'); 'ok'`);
  chk(name, 'rounding', 'a total of 1,000,000.50 spread: $1,000,001 in whole dollars, the leftover two to the first two services, and the box says the total was rounded',
    J([val('arV0'), val('arV1'), val('arV2'), ev(`__g('arTot').textContent`), say()]),
    J(['333,334', '333,334', '333,333', '$1,000,001', 'The total “1,000,000.50” was entered as $1,000,001 — the board keeps whole dollars. · ar-msg ok']));
  ev(`__set('arSpread', '300'); __click('#arNew .ar-spread button'); 'ok'`);
  chk(name, 'rounding', 'CONTROL: a total in whole dollars spreads 100 / 100 / 100 and says nothing',
    J([val('arV0'), val('arV1'), val('arV2'), say()]), J(['100', '100', '100', ' · ar-msg']));
  ev(`__cancel(); 'ok'`);

  // ── AN OFFICE NAMED "(AV)" GETS ITS OWN BUDGETS. The rule took an office's name off the end of a BAE name only after a
  // word boundary, and there is none between a space and "(": an office added in Setup as "(AV)" was offered nothing, its
  // budget shown waived for want of a name the list does hold. The office's name now starts its own word whatever it starts
  // with -- one pattern, used both to find the office and to take it off the funding line -- and "(AV)" still never takes AV's.
  chk(name, '(AV)', 'CONTROL: before "(AV)" is an office, the name ending "(AV)" names no office -- not AV',
    ev(`budParseName(${J(BAE.parAv)}).pmo`), '');
  ev(`window.__oup=uiPrompt; uiPrompt=function(m, d, cb){ cb('(AV)'); }; pmoAdd(); uiPrompt=window.__oup; 'ok'`);
  chk(name, '(AV)', '"(AV)" is added through Setup', ev(`GROUPS.indexOf('(AV)')>=0`), true);
  chk(name, '(AV)', 'its BAE name is read as (AV)’s, discretionary, on the CAM line -- "(AV)" taken off the end, as "PSM" is off PSM’s',
    ev(`(function(){ var p=budParseName(${J(BAE.parAv)}); return [p.pmo, p.dm, p.line].join(' · '); })()`), '(AV) · disc · CAM');
  chk(name, '(AV)', 'CONTROL: AV’s own name is still AV’s, on the same line',
    ev(`(function(){ var p=budParseName(${J(BAE.avDisc)}); return [p.pmo, p.dm, p.line].join(' · '); })()`), 'AV · disc · CAM');
  // a name that starts with punctuation needs no separator before it: glued to the word before, it was (AV)'s before v2.07 and
  // still is; a name that starts with a letter still needs one ("DiscretionaryPSM" names nobody)
  chk(name, '(AV)', 'a BAE name with "(AV)" glued to the word before it is (AV)’s too; one with PSM glued on names nobody',
    J([ev(`budParseName('USAF O&M- CAM Discretionary(AV)').pmo`), ev(`budParseName('USAF O&M- CAM DiscretionaryPSM').pmo`)]), J(['(AV)', '']));
  ev(`setPmoFilter('(AV)'); __click('#toolAdd'); __set('arV0', '10'); __set('arV2', '10'); 'ok'`);
  chk(name, '(AV)', 'the box for (AV): USAF offers (AV)’s own name and never AV’s; STOVL, which only AV has a name for, shows no picker and says so',
    J([box().off, JSON.parse(ev(`JSON.stringify(__opts('arB0'))`)), ev(`__g('arB0').hidden`), ev(`__g('arB2').hidden`), ev(`__g('arBn2').textContent`)]),
    J(['(AV)', ['', BAE.parAv], false, true, 'no STOVL budget is listed for (AV)']));
  chk(name, '(AV)', 'and the rail asks for that one budget -- 0 of 1 chosen, never waived', J(rail()[3]), J('no:Budget · 0 of 1 chosen'));
  ev(`__pick('arB0', ${J(BAE.parAv)}); 'ok'`);
  chk(name, '(AV)', 'chosen: 1 of 1', J(rail()[3]), J('ok:Budget · 1 of 1 chosen'));
  ev(`__cancel(); setPmoFilter('AV'); __click('#toolAdd'); __set('arV0', '10'); __set('arV2', '10'); 'ok'`);
  chk(name, '(AV)', 'CONTROL: the box for AV offers AV’s USAF and STOVL names, never (AV)’s',
    J(JSON.parse(ev(`JSON.stringify([__opts('arB0'), __opts('arB2')])`))), J([['', BAE.avDisc], ['', BAE.avStovl]]));
  ev(`__cancel(); 'ok'`);

  // ── A MARK COMES OFF WHERE IT WAS PUT. Add pressed early outlines every missing field and tells a screen reader each control
  // is invalid. Answering a field took the outline off its box only: the first value box (outlined itself, outside any field
  // box), every control's "invalid", the Prime / OGC switch's, and a CCaR record refused for its length and then corrected all
  // stayed marked -- a box that read as wrong when it was right. Each mark now comes off as its field is answered.
  ev(`setPmoFilter('PSM'); __click('#toolAdd'); __click('#arAddBtn'); 'ok'`);
  const M0 = ['arF_titles', 'arF_ptype', 'arF_obCat', 'arF_wbs', 'arV0', 'arF_dest', 'arF_desc', 'arF_cons'];
  const I0 = ['arEvent', 'arPtP', 'arOb', 'arWbs', 'arV0', 'arTo', 'arDesc', 'arCons'];
  const left = (m, i) => m.join(',') + ' | ' + i.join(',');
  chk(name, 'marks', 'Add pressed with nothing filled: every missing field outlined, and its control marked invalid', marks(), left(M0, I0));
  const STEPS = [
    ['the plan event typed', `__set('arEvent', 'Marks event')`, 'arF_titles', 'arEvent'],
    ['OGC pressed', `__click('#arPtO')`, 'arF_ptype', 'arPtP'],
    ['a USAF value typed (the first value box carries its own outline)', `__set('arV0', '500')`, 'arV0', 'arV0'],
    ['an obligation category chosen', `__pick('arOb', ${J(OB)})`, 'arF_obCat', 'arOb'],
    ['a WBS typed', `__set('arWbs', '1.2')`, 'arF_wbs', 'arWbs'],
    ['Goes to chosen', `__pick('arTo', 'lm')`, 'arF_dest', 'arTo'],
    ['a description typed', `__set('arDesc', 'd')`, 'arF_desc', 'arDesc'],
    ['an impact statement typed', `__set('arCons', 'c')`, 'arF_cons', 'arCons'],
  ];
  let mL = M0.slice(), iL = I0.slice();
  STEPS.forEach(([what, act, m, i]) => {
    ev(`${act}; 'ok'`);
    mL = mL.filter(x => x !== m); iL = iL.filter(x => x !== i);
    chk(name, 'marks', what + ': its outline and its control’s mark come off, every other mark stays', marks(), left(mL, iL));
  });
  ev(`__click('#arAddBtn'); 'ok'`);
  chk(name, 'marks', 'Add again with only USAF’s budget unchosen: its picker alone is marked', marks(), 'arB0 | arB0');
  ev(`__pick('arB0', ${J(BAE.psmDisc)}); 'ok'`);
  chk(name, 'marks', 'the budget chosen: no mark left on its picker', marks(), ' | ');
  ev(`__set('arCcar', 'JSF1234567890'); __click('#arAddBtn'); 'ok'`);
  chk(name, 'marks', 'a CCaR record of 13 characters: refused, its field outlined and its box marked', marks(), 'arF_ccar | arCcar');
  ev(`__set('arCcar', 'JSF1'); 'ok'`);
  chk(name, 'marks', 'corrected to JSF1: nothing in the box is marked any more', marks(), ' | ');

  // ── A WBS ADD REFUSED FOR ITS LENGTH STAYS MARKED UNTIL IT IS ONE ADD TAKES (second review). The rail counts a WBS as
  // answered once anything is typed in it, so the first keystroke anywhere else in the box took the outline and the "invalid"
  // off a WBS of 41 characters -- the box read as right, and Add refused it again. The mark now stays until the WBS is one Add
  // takes (40 characters at most, codeMax), or until Prime contract is pressed: a prime's WBS is logged per CLIN, so the box
  // asks for none and the hidden field is not wrong.
  const W41 = '1.2.3.4.5.6.7.8.9.10.11.12.13.14.15.16.17';      // 41 characters
  const wbsNo = 'This requirement was not added. The WBS “' + W41 + '” is 41 characters; it can be at most 40. '
    + 'Nothing on the board was changed; the box keeps what you typed. · ar-msg bad';
  ev(`__set('arWbs', ${J(W41)}); __click('#arAddBtn'); 'ok'`);
  chk(name, 'WBS mark', 'a WBS of 41 characters: Add refuses it, outlines its field and marks its box, and nothing is added',
    J([marks(), say(), ev(`S.order.join(',')`)]), J(['arF_wbs | arWbs', wbsNo, 'A,B']));
  ev(`__set('arCons', 'c, and more'); __set('arEvent', 'Marks event'); 'ok'`);
  chk(name, 'WBS mark', 'the impact statement and the plan event typed again: the WBS is still 41 characters, and keeps its outline and its mark',
    marks(), 'arF_wbs | arWbs');
  ev(`__set('arWbs', '1.2.3'); 'ok'`);
  chk(name, 'WBS mark', 'corrected to 1.2.3: its outline and its mark come off, and nothing in the box is marked', marks(), ' | ');
  ev(`__set('arWbs', ${J(W41)}); __click('#arAddBtn'); 'ok'`);
  chk(name, 'WBS mark', 'CONTROL: 41 characters again and Add: marked again, nothing added', J([marks(), ev(`S.order.join(',')`)]), J(['arF_wbs | arWbs', 'A,B']));
  ev(`__click('#arPtP'); 'ok'`);
  chk(name, 'WBS mark', 'Prime contract pressed: the WBS is hidden (logged per CLIN) and its outline and its mark come off',
    J([ev(`__g('arWbs').hidden`), marks()]), J([true, ' | ']));
  ev(`__click('#arPtO'); __set('arWbs', '1.2'); 'ok'`);
  chk(name, 'WBS mark', 'CONTROL: OGC again, the WBS shown and set to 1.2: nothing marked', J([ev(`__g('arWbs').hidden`), marks()]), J([false, ' | ']));

  // A FIGURE ROUNDED TO $0 IS SAID TOO. "0.40" typed for STOVL went in as $0, and the status line, which says every other
  // rounding, said nothing: it was said only for a figure that rounded to more than $0.
  ev(`__set('arV2', '0.40'); __click('#arAddBtn'); 'ok'`);
  const N1 = ev(`S.order[S.order.length-1]`);
  chk(name, 'rounding', 'STOVL typed as 0.40: added, STOVL at $0', J([box().open, ev(`itemById(${J(N1)}).event`), JSON.parse(ev(`JSON.stringify(itemById(${J(N1)}).ask)`))]),
    J([false, 'Marks event', [500, 0, 0]]));
  chk(name, 'rounding', 'and the status line says STOVL was entered as $0',
    (stat().match(/ℹ .*$/) || ['(nothing said of a rounding)'])[0], 'ℹ STOVL: “0.40” was entered as $0 — the board keeps whole dollars.');

  // ── THE OFFICE QUESTION: A KEY THAT OPENS THE LIST HANDS THE CHOICE BACK TO IT. A keyboard move only moves (the v2.07
  // review's first fix: Chromium fires change on every arrow key of a closed select). But a person who moved with an arrow key
  // and then opened the list -- Space, F4 or Alt+ArrowDown -- and picked from it was ignored: the pick fired change like a
  // move, and the box went on asking. A pick from the open list chooses, as a mouse pick does.
  ev(`setPmoFilter('ALL'); 'ok'`);
  const OPENERS = [['Space', ' ', false], ['F4', 'F4', false], ['Alt+ArrowDown', 'ArrowDown', true]];
  OPENERS.forEach(([lbl, k, alt]) => {
    ev(`__click('#toolAdd'); (function(){ var s=__g('arOffice'); s.focus(); __key('ArrowDown', s); s.value='ATL'; s.dispatchEvent(new Event('change', {bubbles:true})); })(); 'ok'`);
    chk(name, 'office keys', lbl + ': CONTROL: ArrowDown first only moves -- no office chosen, the question still asked', J([box().off, box().step, box().form]), J(['', false, true]));
    ev(`(function(){ var s=__g('arOffice'); __key(${J(k)}, s, {altKey:${alt}}); s.value='PSM'; s.dispatchEvent(new Event('change', {bubbles:true})); })(); 'ok'`);
    chk(name, 'office keys', lbl + ' opens the list and PSM is picked from it: PSM chosen, the question gone, the form shown',
      J([box().off, box().step, box().form]), J(['PSM', true, false]));
    ev(`__cancel(); 'ok'`);
  });
  ev(`__click('#toolAdd'); (function(){ var s=__g('arOffice'); s.focus(); ['ArrowDown', 'ArrowUp', 'End', 'p'].forEach(function(k){
      __key(k, s); s.value='PSM'; s.dispatchEvent(new Event('change', {bubbles:true})); }); })(); 'ok'`);
  chk(name, 'office keys', 'CONTROL: ArrowDown, ArrowUp, End and a letter -- each a move, each firing change -- choose nothing',
    J([box().off, box().step, box().form]), J(['', false, true]));
  ev(`__key('Enter', __g('arOffice')); 'ok'`);
  chk(name, 'office keys', 'CONTROL: and Enter chooses the office moved to', J([box().off, box().step]), J(['PSM', true]));
  ev(`__cancel(); 'ok'`);

  // ── "ADD AND OPEN ITS RECORD" TAKES OFF THE PMO FILTER THAT HIDES IT. The box adds for the office it opened with, and the
  // office shown behind it can change while it is open: added for PSM with AV showing, the new requirement was not on screen,
  // the RECORD panel fell back to an AV row, and nothing said why. The PMO filter comes off, and is named.
  ev(`setPmoFilter('PSM'); __click('#toolAdd'); setPmoFilter('AV'); __fill('Filter event'); __click('#arAddOpen'); 'ok'`);
  await new Promise(r => setTimeout(r, 30));
  const N2 = ev(`S.order[S.order.length-1]`);
  chk(name, 'PMO filter', 'added for PSM with AV showing behind the box: the PMO filter is off, the new PSM requirement is the current row and on screen',
    J([N2 !== N1, ev(`itemById(${J(N2)}).event`), ev(`grpOf(itemById(${J(N2)}))`), ev(`filter`), ev(`curRow`) === N2, ev(`!!__g('row-'+curRow)`)]),
    J([true, 'Filter event', 'PSM', 'ALL', true, true]));
  chk(name, 'PMO filter', 'and the status line names the PMO filter as taken off', stat(),
    `Showing ${N2} in its record — the PMO filter was taken off so it can be seen.`);
  ev(`setPmoFilter('PSM'); __click('#toolAdd'); __fill('Own office event'); __click('#arAddOpen'); 'ok'`);
  await new Promise(r => setTimeout(r, 30));
  const N3 = ev(`S.order[S.order.length-1]`);
  chk(name, 'PMO filter', 'CONTROL: PSM showing and added for PSM: the filter stays, the requirement is on screen, and nothing is said to have come off',
    J([N3 !== N2, ev(`filter`), ev(`curRow`) === N3, ev(`!!__g('row-'+curRow)`), /taken off/.test(stat())]), J([true, 'PSM', true, true, false]));

  // ── A TICKED ROW KEEPS THE KEYBOARD; ONLY THE LAST ONE TO FINISH CAN BE OPENED. jsdom lays nothing out, so for these two the
  // page is given the browser's one fact the dialog controller reads -- an element is drawn when nothing over it is hidden --
  // and the box is reconciled by hand (dlgSync) where a browser's observer would. Ticking a row of From another year redraws
  // the list: the checkbox had no id, so the controller could not find it again and sent the keyboard to the year picker at
  // the top, and the next Tab started over. Each checkbox is found again by its own id.
  ev(`window.__gcr=Element.prototype.getClientRects;
      Element.prototype.getClientRects=function(){ for(var e=this; e; e=e.parentElement){ if(e.hidden || (e.style && e.style.display==='none')) return []; }
        return this.isConnected? [{top:0, left:0, right:1, bottom:1, width:1, height:1}] : []; }; 'ok'`);
  ev(`__click('#toolAdd'); __click('#arTabYr'); __pick('naFromFy', '2026'); 'ok'`);
  chk(name, 'a ticked row', 'CONTROL: PSM’s FY26 list holds P26 and Q26, each to be ticked',
    ev(`[].slice.call(document.querySelectorAll('#naFromWrap tr[data-id]')).map(function(r){ return r.getAttribute('data-id')+':'+!!r.querySelector('input[type=checkbox]'); }).join(',')`),
    'P26:true,Q26:true');
  const tick = id => ev(`(function(){ var c=document.querySelector('#naFromWrap tr[data-id=${J(id)}] input[type=checkbox]'); c.focus(); c.checked=true;
      c.dispatchEvent(new Event('change', {bubbles:true})); dlgSync(); var a=document.activeElement, r=a && a.closest? a.closest('tr[data-id]') : null;
      return [a && a.id, r && r.getAttribute('data-id'), a && a.type, a && a.checked].join(' · '); })()`);
  chk(name, 'a ticked row', 'P26 ticked: the list is redrawn and the keyboard is on P26’s own checkbox, ticked -- not on the year picker', tick('P26'),
    'naFromCb_P26 · P26 · checkbox · true');
  chk(name, 'a ticked row', 'then Q26 ticked: the keyboard on Q26’s, and the button offers both to finish', tick('Q26') + ' · ' + ev(`__g('naFromBtn').textContent`),
    'naFromCb_Q26 · Q26 · checkbox · true · Finish 2 in New requirement');
  // The box stays open over the record until the last one brought in is finished, so "Add and open its record" on any but the
  // last would open a record behind a box that does not close: it was offered on every one.
  ev(`__click('#naFromBtn'); 'ok'`);
  const ft = () => ev(`[__g('arAddOpen').hidden, __g('arAddBtn').hidden, /Finishing FY26 (P26|Q26)/.exec(__g('arFinBar').textContent)[1]].join(' · ')`);
  chk(name, 'Add and open', 'finishing P26, Q26 still waiting: Add requirement is offered, Add and open its record is not', ft(), 'true · false · P26');
  ev(`__click('#arFinBar button'); 'ok'`);
  chk(name, 'Add and open', 'P26 skipped, Q26 the last: Add and open its record is offered again', ft(), 'false · false · Q26');
  // (second review) One being finished keeps its place: more ticked to finish wait BEHIND it, its bar counts them as they
  // stand, and Add and open goes again while any wait -- then comes back for the last.
  const bar = () => ev(`(function(){ var t=__g('arFinBar').textContent, m=/ · (\\d+) more after this\\./.exec(t);
      return /Finishing FY26 (P26|Q26)/.exec(t)[1]+' · '+(m? m[1] : 0)+' waiting'; })()`);
  ev(`__click('#arTabYr'); 'ok'`);
  chk(name, 'Add and open', 'CONTROL: Q26 is in the form, so From another year lists it as in New requirement, with no checkbox; P26, skipped, can be ticked',
    ev(`[].slice.call(document.querySelectorAll('#naFromWrap tr[data-id]')).map(function(r){ return r.getAttribute('data-id')+':'
      +!!r.querySelector('input[type=checkbox]')+':'+/— in New requirement, to finish/.test(r.textContent); }).join(',')`),
    'P26:true:false,Q26:false:true');
  chk(name, 'Add and open', 'P26 ticked again: the button offers one to finish', tick('P26') + ' · ' + ev(`__g('naFromBtn').textContent`),
    'naFromCb_P26 · P26 · checkbox · true · Finish 1 in New requirement');
  ev(`__click('#naFromBtn'); 'ok'`);
  chk(name, 'Add and open', 'brought in while Q26 is being finished: the box is back on New requirement with Q26 still in it, its bar counts P26 waiting, '
    + 'Add requirement is offered and Add and open its record is not',
    J([box().form, bar(), ft()]), J([false, 'Q26 · 1 waiting', 'true · false · Q26']));
  chk(name, 'Add and open', 'and the box and the status line say it waits behind the one being finished',
    J([say(), stat()]), J(['1 to finish in New requirement, after the one being finished. · ar-msg ok', '1 to finish in New requirement, after the one being finished.']));
  ev(`__fill('Q26 finished'); __click('#arAddBtn'); 'ok'`);
  const NQ = ev(`S.order[S.order.length-1]`);
  chk(name, 'Add and open', 'Q26 finished and added, linked to FY26 Q26; P26, the last, opens: Add and open its record is offered again',
    J([NQ !== N3, ev(`itemById(${J(NQ)}).event`), JSON.parse(ev(`JSON.stringify(itemById(${J(NQ)}).prior)`)), bar(), ft()]),
    J([true, 'Q26 finished', { fy: 2026, id: 'Q26' }, 'P26 · 0 waiting', 'false · false · P26']));
  chk(name, 'Add and open', 'the status line names the one added and the one still to finish', stat(),
    `➕ Added ${NQ} — Q26 finished — to FY27 for PSM, at the bottom of the order, linked to FY26 Q26. 1 more to finish from FY26.`);
  ev(`__fill('P26 finished'); __click('#arAddOpen'); 'ok'`);
  const NP = ev(`S.order[S.order.length-1]`);
  chk(name, 'Add and open', 'P26 finished with Add and open its record: added, linked to FY26 P26, the box closed and the new requirement the current row',
    J([NP !== NQ, ev(`itemById(${J(NP)}).event`), JSON.parse(ev(`JSON.stringify(itemById(${J(NP)}).prior)`)), box().open, ev(`curRow`) === NP]),
    J([true, 'P26 finished', { fy: 2026, id: 'P26' }, false, true]));
  ev(`Element.prototype.getClientRects=window.__gcr; 'ok'`);

  // ── RESET YEAR NAMES THE BOX THERE IS (second review). The blank year's line sent people to "✎ Board → Add Requirement",
  // a menu the board no longer has; it names Review's Add requirement, as a sentence of its own.
  ev(`window.__asked=[]; window.__ans=true; resetYear(); window.__ans=false; 'ok'`);
  chk(name, 'Reset year', 'Reset year asks first, and FY27 is left with no requirements',
    J([ev(`__asked.length`), /^Reset FY27 to BLANK\?/.test(ev(`__asked[0]||''`)), ev(`S.order.length`)]), J([1, true, 0]));
  chk(name, 'Reset year', 'the status line sends people to Add requirement under Requirements › Review, in a sentence of its own', stat(),
    '🗑 FY27 is now BLANK — no requirements, zero BA. Use Add requirement (Requirements › Review) to add requirements, restore baseline '
    + 'items from the 🗑 Removed list (Restore all brings the full set back), or roll data in via Import.');
  chk(name, 'Reset year', 'CONTROL: the button it names is there, in the Review tools, called Add requirement',
    ev(`(function(){ var b=__g('t_review') && __g('t_review').querySelector('#toolAdd'); return b? b.textContent.trim() : '(not in the Review tools)'; })()`),
    'Add requirement');
  } catch (e) {
    const msg = String((e && e.message) || e).split('\n')[0].slice(0, 140);
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + msg, got: 'threw', want: 'ran' });
  }
}

// ==== v2.08 item 122: edit the whole record in one box (Brad, 26 Oct 2026: D1-D12, D9 retire the rename) ====
// The box is driven through its own controls: each value is typed into the field (an input event, as typing makes) or chosen
// (a change event), and Save is its button. Every expected value is written out here, from the fixture. Every check fails on
// v2.07 (the box does not exist there) unless it is marked CONTROL.
{
  const name = 'v2.08 — the edit box: the whole record, held until Save, written once (item 122)';
  try {
  const J = JSON.stringify;
  const itx = (id, grp, ask, x) => Object.assign({ id, title: 'Rec ' + id, event: 'EV-' + id, grp, ask }, x || {});
  const { ev, errors } = boot();
  seed(ev, { services: ['USAF', 'ANG'], items: [itx('A', 'PSM', [100, 50]), itx('B', 'PSM', [80, 0]), itx('C', 'AV', [60, 0]), itx('D', 'PSM', [40, 0])],
             disc: [400, 400], mand: [0, 0], order: ['A', 'B', 'C', 'D'] });
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S);
      S.ccar.A='JSF1'; S.pid.A='PID-A'; S.ptype.A='OGC'; S.obCat=S.obCat||{}; S.obCat.A=OB_CATS[0];
      S.wbs=S.wbs||{}; S.wbs.A=[{w:'1.2.3', v:[]}]; S.wbs.B=[{w:'4.1', v:[1,0]},{w:'4.2', v:[0,1]}];
      S.dest=S.dest||{}; S.dest.A={to:'pax', end:'lm'}; S.mipr=S.mipr||{}; S.mipr.A='direct';
      S.desc.A='What A is.'; S.notes.A='A note.'; S.cons.A='A stops.';
      S.pmoOrder.PSM=['A','B','D']; S.pmoOrder.AV=['C']; save();
      window.__asked=[]; window.__ans=true; window.confirm=function(m){ __asked.push(String(m)); return __ans; };
      window.__saves=0; var _s=save; save=function(){ __saves++; return _s.apply(this, arguments); }; setCur('A'); render(); 'ok'`);
  const g = id => `document.getElementById(${J(id)})`;
  const put = (id, v) => ev(`(function(){ var e=${g(id)}; e.value=${J(v)}; e.dispatchEvent(new Event('input')); e.dispatchEvent(new Event('change')); return 'ok'; })()`);
  const val = id => ev(`(${g(id)}||{value:'(no field)'}).value`);
  const open = () => ev(`/(^| )open( |$)/.test(${g('editPanel')}.className)`);
  const btn = id => ev(`${g(id)}.click(); 'ok'`);

  // ---- it opens holding the record
  ev(`toggleRec('A'); 'ok'`);
  chk(name, 'opens', 'Requirement edit opens the box at the plan event', J([open(), ev(`document.activeElement.id`)]), J([true, 'erEvent']));
  chk(name, 'opens', 'every field holds what is stored',
    J(['erEvent', 'erCcar', 'erPid', 'erPtype', 'erGrp', 'erOb', 'erWbs', 'erTo', 'erEnd', 'erMipr', 'erDesc', 'erNote', 'erCons'].map(val)),
    J(['EV-A', 'JSF1', 'PID-A', 'OGC', 'PSM', ev('OB_CATS[0]'), '1.2.3', 'pax', 'lm', 'direct', 'What A is.', 'A note.', 'A stops.']));
  chk(name, 'opens', 'the OGC fields are shown for a government activity', J([ev(`${g('erF_destEnd')}.hidden`), ev(`${g('erF_mipr')}.hidden`)]), J([false, false]));
  chk(name, 'opens', 'the CCaR record name is shown, never a field to type in', J([ev(`${g('erRecT')}.tagName`), ev(`${g('erRecT')}.textContent`)]), J(['SPAN', 'Rec A']));
  chk(name, 'opens', 'nothing in it edits money: no value, budget, allocation or band control',
    ev(`document.querySelectorAll('#erBody [onchange*="setAsk"],#erBody [onchange*="setFsrc"],#erBody [onchange*="setBand"],#erBody [onchange*="budLine"],#erBody [onchange*="setAlloc"]').length`), 0);

  // ---- a redraw while it holds typing keeps the typing (F2 cannot reach it)
  put('erPid', 'PID-NEW'); ev(`render(); render(); 'ok'`);
  chk(name, 'held', 'two redraws later the typing is still in the box, and nothing is written', J([val('erPid'), ev(`S.pid.A`)]), J(['PID-NEW', 'PID-A']));
  chk(name, 'held', 'the Save button counts the changes', ev(`${g('erSaveBtn')}.textContent`), 'Save 1 change');
  // ---- Cancel writes nothing
  const s0 = ev(`JSON.stringify(S)`);
  btn('erFt'); ev(`(function(){ [].filter.call(document.querySelectorAll('#erFt button'), function(b){ return b.textContent==='Cancel'; })[0].click(); return 'ok'; })()`);
  chk(name, 'Cancel', 'Cancel closes the box and writes nothing', J([open(), ev(`JSON.stringify(S)`) === s0]), J([false, true]));

  // ---- Save writes exactly what changed, in one save()
  ev(`toggleRec('A'); __saves=0; 'ok'`);
  const pmo0 = ev(`JSON.stringify(S.pmoOrder)`), j0 = Number(ev(`(MS.jrnl||[]).length`));
  put('erPid', 'PID-NEW'); put('erNote', 'A note, revised.');
  ev(`erPt('OGC'); 'ok'`);   // OGC again: set, never toggled
  btn('erSaveBtn');
  chk(name, 'Save', 'it wrote the two fields typed', J([ev(`S.pid.A`), ev(`S.notes.A`)]), J(['PID-NEW', 'A note, revised.']));
  chk(name, 'Save', 'Prime contract / OGC chosen again is still OGC', ev(`S.ptype.A`), 'OGC');
  chk(name, 'Save', 'in one save()', ev(`__saves`), 1);
  chk(name, 'Save', 'the journal has an entry per changed field and no other', J(JSON.parse(ev(`JSON.stringify((MS.jrnl||[]).slice(${j0}).map(function(e){ return (e.p||[])[0]; }).sort())`))), J(['notes', 'pid']));
  chk(name, 'Save', 'an unchanged office leaves every ranking as it was', ev(`JSON.stringify(S.pmoOrder)`), pmo0);
  chk(name, 'Save', 'it closes, and says what it saved', J([open(), ev(`document.getElementById('shareStat').textContent`)]), J([false, '✎ EV-A: saved PID, Note.']));

  // ---- the plan event: a board-data requirement's rename is an override; typed back, it goes
  ev(`toggleRec('A'); 'ok'`); put('erEvent', 'A renamed'); btn('erSaveBtn');
  chk(name, 'plan event', 'a rename of a board-data requirement is kept as an override', J([ev(`S.titles.A`), ev(`dispTitle(itemById('A'))`)]), J(['A renamed', 'A renamed']));
  ev(`toggleRec('A'); 'ok'`); put('erEvent', 'EV-A'); btn('erSaveBtn');
  chk(name, 'plan event', 'typed back to the file’s own, the override is gone', ev(`S.titles.A===undefined`), true);
  ev(`toggleRec('A'); 'ok'`); put('erEvent', '   '); btn('erSaveBtn');
  chk(name, 'plan event', 'empty is refused: nothing written, the box stays open saying why', J([open(), ev(`S.titles.A===undefined`), ev(`${g('erMsg')}.textContent.indexOf('The plan event cannot be empty')>=0`)]), J([true, true, true]));
  ev(`erClose(); 'ok'`);

  // ---- a split WBS is shown, never retyped; Save of another field leaves it
  ev(`toggleRec('B'); 'ok'`);
  chk(name, 'WBS', 'a split WBS: no field to retype it, and its split named with a way to it',
    J([ev(`${g('erWbs')}.hidden`), ev(`${g('erWbsNote')}.textContent.indexOf('split over 2 lines')>=0`), ev(`${g('erWbsGo')}.hidden`)]), J([true, true, false]));
  const wbsB = ev(`JSON.stringify(S.wbs.B)`);
  put('erDesc', 'What B is.'); btn('erSaveBtn');
  chk(name, 'WBS', 'and Save of another field leaves the split exactly as it was', ev(`JSON.stringify(S.wbs.B)`), wbsB);

  // ---- D10: a Goes to that is not a government activity takes Which awards to and the MIPR type with it
  ev(`toggleRec('A'); 'ok'`); put('erTo', 'pw');
  chk(name, 'D10', 'switched to a prime, the OGC fields are hidden', J([ev(`${g('erF_destEnd')}.hidden`), ev(`${g('erF_mipr')}.hidden`)]), J([true, true]));
  btn('erSaveBtn');
  // in setDest's own shape -- {to} for a destination that is not a government activity (v2.08 review: {to, end:''} beside
  // setDest's {to} read as a change between two equal destinations)
  chk(name, 'D10', 'saved: Goes to is the prime, Which awards to and the MIPR type are cleared', ev(`JSON.stringify([S.dest.A, (S.mipr||{}).A||null])`), J([{ to: 'pw' }, null]));

  // ---- the CCaR record fills an EMPTY description, never a written one; re-entered, it changes nothing
  // a CCaR records list, for this part only
  ev(`MS.ccarIdx={n:1, rows:{}}; MS.ccarIdx.rows[ccarNorm('JSF9')]={t:'Nine record', s:'What nine is', d:1}; 'ok'`);
  ev(`toggleRec('C'); 'ok'`); put('erCcar', 'JSF9');
  chk(name, 'CCaR', 'an empty description is filled from the CCaR list, and the record name read', J([val('erDesc'), ev(`${g('erRecT')}.textContent`)]), J(['What nine is', 'Nine record']));
  btn('erSaveBtn');
  chk(name, 'CCaR', 'saved, both are written', J([ev(`S.ccar.C`), ev(`S.desc.C`)]), J(['JSF9', 'What nine is']));
  ev(`toggleRec('A'); 'ok'`); put('erCcar', 'JSF9');
  chk(name, 'CCaR', 'a written description is never replaced', val('erDesc'), 'What A is.');
  ev(`erClose(); toggleRec('C'); 'ok'`); put('erCcar', 'JSF9');
  chk(name, 'CCaR', 'the same number typed again: nothing to save', ev(`${g('erSaveBtn')}.textContent`), 'Save');
  ev(`erClose(); delete MS.ccarIdx; 'ok'`);

  // ---- the office (D8): asked first, naming what follows; Cancel moves nothing; OK puts it last in the new office
  ev(`toggleRec('A'); __asked=[]; __ans=false; 'ok'`); put('erGrp', 'AV'); btn('erSaveBtn');
  chk(name, 'office', 'Save asks, naming this fiscal year only and last in the new office’s ranking',
    J([ev(`__asked.length`), ev(`__asked[0].indexOf('FY27 only')>=0`), ev(`__asked[0].indexOf('last in AV')>=0`)]), J([1, true, true]));
  chk(name, 'office', 'answered Cancel, nothing moved and the box is still open with the choice', J([ev(`grpOf(itemById('A'))`), open(), val('erGrp')]), J(['PSM', true, 'AV']));
  ev(`__ans=true; 'ok'`); btn('erSaveBtn');
  chk(name, 'office', 'answered OK, it moved, last in AV, out of PSM', J([ev(`grpOf(itemById('A'))`), ev(`JSON.stringify(S.pmoOrder.AV)`), ev(`S.pmoOrder.PSM.indexOf('A')`)]), J(['AV', J(['C', 'A']), -1]));

  // ---- changed while the box was open: nothing written
  ev(`toggleRec('D'); 'ok'`); put('erPid', 'TYPED'); ev(`S.pid.D='FROM ELSEWHERE'; 'ok'`); btn('erSaveBtn');
  chk(name, 'changed meanwhile', 'its record changed under the box: Save refuses and writes nothing', J([ev(`S.pid.D`), open(), ev(`${g('erMsg')}.textContent.indexOf('changed while this box was open')>=0`)]), J(['FROM ELSEWHERE', true, true]));
  ev(`erClose(); 'ok'`);

  // ---- prev / next: typing not saved is asked about first
  ev(`toggleRec('B'); __asked=[]; __ans=false; 'ok'`); put('erNote', 'typed in B');
  ev(`erStep(1); 'ok'`);
  chk(name, 'next', 'next ↓ with typing asks first; Cancel stays on B with the typing', J([ev(`__asked.length`), ev(`erOpen`), val('erNote')]), J([1, 'B', 'typed in B']));
  ev(`__ans=true; erStep(1); 'ok'`);
  chk(name, 'next', 'OK opens the next requirement, and B kept nothing', J([ev(`erOpen`), ev(`(S.notes||{}).B||''`)]), J(['C', '']));
  ev(`erClose(); 'ok'`);

  // ---- the required list warns (D5); the RECORD panel's 📋 count reads it (D11)
  ev(`toggleRec('D'); 'ok'`);
  const rail = JSON.parse(ev(`JSON.stringify([].map.call(document.querySelectorAll('#erChk li'), function(l){ return l.className+':'+l.textContent.split(' — ')[0]; }))`));
  chk(name, 'D5', 'the list is reqNeeds’ own, in its order', J(rail.map(r => r.split(':')[1].replace(/[✓!–]/, '').split(' · ')[0])),
    J(['Plan event', 'Prime contract / OGC', 'Requirement value', 'Budget', 'Obligation category', 'WBS', 'Goes to', 'Description', 'Impact statement']));
  ev(`erClose(); setCur('D'); render(); 'ok'`);
  chk(name, 'D11', 'the 📋 button counts what the list still needs', ev(`[].map.call(document.querySelectorAll('#inspector .insp-act .a2'), function(e){ return e.textContent; })[2]`), '6 of 8 still needed');

  // ---- D9: the record name is read, never typed -- the row's rename is gone
  ev(`toggleRowMenu('A', {stopPropagation:function(){}}); 'ok'`);
  chk(name, 'D9', 'the row’s ⋯ menu offers no rename of the CCaR record name', ev(`document.body.innerHTML.indexOf('Rename the CCaR record name')`), -1);
  ev(`rowMenuId=null; render(); 'ok'`);

  // ---- D12: Brief is a presentation view, its own label says requirements can't be edited there -- so Needs attention's Go
  // to selects the requirement and says how to edit it, and the box does not open (v2.08 review: it opened, editable)
  ev(`uiSetMode('brief'); attShow('imp'); attGo('imp','D'); 'ok'`);
  chk(name, 'D12', 'in Brief, Go to selects D and the box does not open; the status line says to switch to Review',
    J([open(), ev(`curRow`), ev(`document.getElementById('shareStat').textContent.indexOf('Switch to Review to edit')>=0`)]), J([false, 'D', true]));
  ev(`uiSetMode('review'); 'ok'`);

  // ---- a locked cycle: the box does not open
  ev(`blCyc='PB'; blYr=MS.cur; cycLock(); cycView('PB|'+MS.cur); 'ok'`);
  chk(name, 'locked', 'on a locked cycle the box does not open', J([ev(`openEdit('A','rec')`), open()]), J([false, false]));
  ev(`cycLeave(); 'ok'`);
  chk(name, 'errors', 'no page error', errors.length, 0);
  } catch (e) {
    const msg = String((e && e.message) || e).split('\n')[0].slice(0, 160);
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + msg, got: 'threw', want: 'ran' });
  }
}
// ==== end v2.08 item 122 ====

// ==== v2.08 item 122 -- the review of the edit box (26 Oct 2026) ====
// Three reviewers by area, each finding re-run by a skeptic. Each part below fails on the board they reviewed (65cc26a) and
// passes here; every expected value is written out from the fixture. Parts are run apart, so one that throws says so by name.
{
  const name = 'v2.08 — the review of the edit box: kept values, the WBS after OGC, Goes to’s shape, prev/next, the SI code, the words';
  try {
  const J = JSON.stringify;
  const itx = (id, grp, ask, x) => Object.assign({ id, title: 'Rec ' + id, event: 'EV-' + id, grp, ask }, x || {});
  const part = (tag, fn) => { try { fn(); } catch (e) { failures.push({ scenario: name, where: tag, what: 'the part threw: ' + String((e && e.message) || e).split('\n')[0].slice(0, 160), got: 'threw', want: 'ran' }); } };
  const mk = (services, items, order) => { const b = boot(); seed(b.ev, { services, items, disc: services.map(() => 500), mand: services.map(() => 0), order });
    b.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save();
      window.__asked=[]; window.__ans=true; window.confirm=function(m){ __asked.push(String(m)); return __ans; }; render(); 'ok'`); return b; };
  const putIn = (ev, id, v) => ev(`(function(){ var e=document.getElementById(${J(id)}); e.value=${J(v)}; e.dispatchEvent(new Event('input')); e.dispatchEvent(new Event('change')); return 'ok'; })()`);
  const btn = (ev, id) => ev(`document.getElementById(${J(id)}).click(); 'ok'`);

  // ---- a stored value the list does not hold is kept as saved, and Save of another field leaves it
  part('kept as saved', () => {
    const { ev } = mk(['USAF', 'ANG'], [itx('A', 'PSM', [100, 50])], ['A']);
    ev(`MS.rcn=[{k:'K1', rcn:'11111', eeic:'AAAAA', t:'', svc:['USAF','ANG']}];
        S.obCat=S.obCat||{}; S.obCat.A='Contract (old)'; S.dest=S.dest||{}; S.dest.A={to:'zz'}; S.rcnAsg=S.rcnAsg||{}; S.rcnAsg.A='R9|E9';
        S.rcnSvc=S.rcnSvc||{}; S.rcnSvc.A={USAF:'R8|E8'}; rcnSvcOpen.A=true; save(); setCur('A'); render(); toggleRec('A'); 'ok'`);
    chk(name, 'kept as saved', 'opened with nothing typed, there is nothing to save', ev(`document.getElementById('erSaveBtn').textContent`), 'Save');
    // v2.08 second review: the option is short -- "(kept)" -- because a closed select cannot wrap; its hover says why
    chk(name, 'kept as saved', 'each picker shows the value as stored, kept as saved',
      J(['erOb', 'erTo', 'erRcn', 'erRs_USAF'].map(i => ev(`(function(){ var s=document.getElementById(${J(i)}), o=s.options[s.selectedIndex];
        return s.value+' | '+(/ \\(kept\\)$/.test(o.text) && (o.getAttribute('title')||'').indexOf('kept as saved')>=0); })()`))),
      J(['Contract (old) | true', 'zz | true', 'R9|E9 | true', 'R8|E8 | true']));
    putIn(ev, 'erNote', 'only a note'); btn(ev, 'erSaveBtn');
    chk(name, 'kept as saved', 'Save of a note leaves all four as they were, and says only the note',
      J([ev(`S.obCat.A`), ev(`JSON.stringify(S.dest.A)`), ev(`S.rcnAsg.A`), ev(`JSON.stringify(S.rcnSvc.A)`), ev(`S.notes.A`), ev(`document.getElementById('shareStat').textContent`)]),
      J(['Contract (old)', '{"to":"zz"}', 'R9|E9', '{"USAF":"R8|E8"}', 'only a note', '✎ EV-A: saved Note.']));
  });

  // ---- the WBS typed after switching Prime contract to OGC in the box is saved
  part('WBS after OGC', () => {
    const { ev } = mk(['USAF'], [itx('A', 'PSM', [100])], ['A']);
    ev(`S.ptype.A='PRIME'; save(); toggleRec('A'); erPt('OGC'); 'ok'`);
    chk(name, 'WBS after OGC', 'switched to OGC, the WBS field is there', ev(`document.getElementById('erWbs').hidden`), false);
    putIn(ev, 'erWbs', '3.1.4'); btn(ev, 'erSaveBtn');
    chk(name, 'WBS after OGC', 'saved: the type and the WBS typed', J([ev(`S.ptype.A`), ev(`JSON.stringify(S.wbs.A)`)]), J(['OGC', '[{"w":"3.1.4","v":[]}]']));
  });

  // ---- where the money goes, written as setDest writes it
  part('Goes to', () => {
    const { ev } = mk(['USAF'], [itx('A', 'PSM', [100]), itx('B', 'PSM', [100]), itx('C', 'PSM', [100])], ['A', 'B', 'C']);
    ev(`setDest('A','to','dla'); save(); 'ok'`);
    const d0 = ev(`JSON.stringify(S.dest.A)`), j0 = Number(ev(`(MS.jrnl||[]).length`));
    ev(`toggleRec('A'); 'ok'`); putIn(ev, 'erMipr', 'reimb'); btn(ev, 'erSaveBtn');
    chk(name, 'Goes to', 'only the MIPR type changed: the destination record is untouched', ev(`JSON.stringify(S.dest.A)`), d0);
    // the year's first MIPR type makes its container, which the journal records as one line
    chk(name, 'Goes to', 'and the journal records the MIPR type alone', ev(`JSON.stringify((MS.jrnl||[]).slice(${j0}).map(function(e){ return (e.p||[]).join('.'); }))`), J(['mipr']));
    ev(`delete S.mipr; save(); 'ok'`);
    const j1 = Number(ev(`(MS.jrnl||[]).length`));
    ev(`toggleRec('B'); 'ok'`); putIn(ev, 'erTo', 'pw'); btn(ev, 'erSaveBtn');
    chk(name, 'Goes to', 'Goes to set to a prime on a year with no MIPR types: no MIPR container is made, none journalled',
      J([ev(`S.mipr===undefined`), ev(`(MS.jrnl||[]).slice(${j1}).some(function(e){ return (e.p||[])[0]==='mipr'; })`), ev(`JSON.stringify(S.dest.B)`)]), J([true, false, '{"to":"pw"}']));
    // a board saved before v2.08: C on a prime, with a hidden second hop and MIPR type
    ev(`S.dest.C={to:'pw', end:'lm'}; S.mipr={C:'direct'}; save(); 'ok'`);
    ev(`toggleRec('C'); 'ok'`); putIn(ev, 'erTo', 'chlk'); btn(ev, 'erSaveBtn');
    chk(name, 'Goes to', 'a hidden second hop does not come back when Goes to becomes a government activity (the box)', J([ev(`JSON.stringify(S.dest.C)`), ev(`(S.mipr||{}).C||null`)]), J(['{"to":"chlk"}', null]));
    ev(`S.dest.C={to:'pw', end:'lm'}; S.mipr={C:'direct'}; save(); setDest('C','to','chlk'); 'ok'`);
    chk(name, 'Goes to', 'nor through setDest (Classify, a bulk set)', J([ev(`JSON.stringify(S.dest.C)`), ev(`(S.mipr||{}).C||null`), ev(`JSON.stringify(flowDestResolve(['C'],'end'))`)]), J(['{"to":"chlk"}', null, '["chlk"]']));
  });

  // ---- prev / next: the box controller compares against the record on screen
  part('prev/next', () => {
    const { ev } = mk(['USAF'], [itx('A', 'PSM', [100]), itx('B', 'PSM', [100])], ['A', 'B']);
    ev(`S.obCat=S.obCat||{}; S.obCat.A=OB_CATS[1]; save(); toggleRec('A'); dlgSync(); erStep(1); dlgSync(); 'ok'`);
    chk(name, 'prev/next', 'on B with nothing typed, the box holds no typing to ask about', J([ev(`erOpen`), ev(`dlgDirty(dlgTop())`)]), J(['B', false]));
    putIn(ev, 'erOb', ev(`OB_CATS[1]`));
    chk(name, 'prev/next', 'typing that makes B match A is still typing on B', ev(`dlgDirty(dlgTop())`), true);
    ev(`erClose(); 'ok'`);
  });

  // ---- the SI code: "follows the PMO and prime rules" is a choice of its own
  part('SI code', () => {
    const b = boot(); seed(b.ev, { services: ['STOVL', 'USMC-C', 'USN'], items: [itx('A', 'AV', [0, 0, 100]), itx('B', 'AV', [0, 0, 100])], disc: [500, 500, 500], mand: [0, 0, 0], order: ['A', 'B'] });
    const ev = b.ev;
    ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save();
        window.confirm=function(){ return true; }; 'ok'`);
    const d0 = ev(`siDefault(itemById('A'))`), dPP = ev(`(function(){ var g=S.grp.A; S.grp.A='PP'; var d=siDefault(itemById('A')); if(g===undefined) delete S.grp.A; else S.grp.A=g; return d; })()`);
    chk(name, 'SI code', 'fixture: A’s derived code changes when it moves to PP', d0 !== dPP, true);
    ev(`toggleRec('A'); 'ok'`);
    chk(name, 'SI code', 'with no code stored, the picker says it follows the PMO and prime rules', ev(`(function(){ var s=document.getElementById('erSi'); return s.options[s.selectedIndex].text; })()`), '— follows the PMO and prime rules —');
    putIn(ev, 'erGrp', 'PP'); btn(ev, 'erSaveBtn');
    chk(name, 'SI code', 'moved to PP in the same Save, it still follows: nothing stored, the code is PP’s', J([ev(`S.si.A===undefined`), ev(`siOf(itemById('A'))`)]), J([true, dPP]));
    ev(`S.grp.B='PP'; save(); 'ok'`);
    chk(name, 'SI code', 'fixture: B, in PP, derives a code', ev(`siOf(itemById('B'))`), dPP);
    ev(`toggleRec('B'); 'ok'`); putIn(ev, 'erSi', ''); btn(ev, 'erSaveBtn');
    chk(name, 'SI code', '"none" chosen over a derived code is stored as none', J([ev(`JSON.stringify(S.si.B)`), ev(`siOf(itemById('B'))`)]), J(['""', '']));
  });

  // ---- the words and the ways out
  part('words', () => {
    const { ev } = mk(['USAF'], [itx('A', 'PSM', [100]), itx('B', 'PSM', [100])], ['A', 'B']);
    ev(`S.wbs.A=[{w:'1.1', v:[]}]; S.ptype.B='PRIME'; save(); setCur('A'); render(); toggleRec('A'); 'ok'`);
    const btnCount = ev(`(function(){ erClose(); setCur('A'); render(); var t=[].map.call(document.querySelectorAll('#inspector .insp-act .a2'), function(e){ return e.textContent; })[2]; toggleRec('A'); return t; })()`);
    chk(name, 'words', 'the box’s Required count and the 📋 button say the same thing', ev(`document.getElementById('erReadyN').textContent`), btnCount);
    chk(name, 'words', 'the record name drawn from the file says so', ev(`document.getElementById('erRecTag').textContent`), 'from the file');
    chk(name, 'words', 'a WBS of one line can be split from the box', J([ev(`document.getElementById('erWbsGo').hidden`), ev(`document.getElementById('erWbsSplit').hidden`), ev(`document.getElementById('erWbsSplit').textContent`)]), J([false, false, 'Split it by service…']));
    ev(`erGo('record'); 'ok'`);
    chk(name, 'words', 'the way to the value and budgets closes the box and puts the keyboard in the RECORD panel’s value', J([ev(`erOn()`), ev(`(document.activeElement.getAttribute('onchange')||'').indexOf('setAsk(')===0`)]), J([false, true]));
    ev(`clinOpen.B=true; render(); openEdit('B','rec'); erGo('clin'); 'ok'`);
    chk(name, 'words', 'Open the CLIN drill leaves an open drill open', ev(`!!clinOpen.B`), true);
  });

  // ---- a CCaR record the file carries cannot be cleared in the box, and the box says so
  part('CCaR from the file', () => {
    const { ev } = mk(['USAF'], [itx('A', 'PSM', [100], { ccar: 'JSF77' })], ['A']);
    ev(`toggleRec('A'); 'ok'`); putIn(ev, 'erCcar', ''); btn(ev, 'erSaveBtn');
    chk(name, 'CCaR from the file', 'cleared: nothing saved, the box stays open saying why, the record stays',
      J([ev(`erOn()`), ev(`document.getElementById('erMsg').textContent.indexOf('comes from the file and cannot be cleared here')>=0`), ev(`ccarOf(itemById('A'))`)]), J([true, true, 'JSF77']));
    ev(`erClose(); 'ok'`);
  });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).split('\n')[0].slice(0, 160), got: 'threw', want: 'ran' });
  }
}
// ==== end v2.08 item 122 -- the review ====

// ==== v2.08 item 122 -- the second review of the edit box (26 Oct 2026) ====
// A second round of reviewers on the first round's fixes (3898d95), each finding re-run by a skeptic. Each part fails there and
// passes here; every expected value is written out from the fixture.
{
  const name = 'v2.08 — the second review of the edit box: a CCaR record typed over the file’s, the SI code’s rule, where a record name comes from, the RCN note, the way to the RECORD panel';
  try {
  const J = JSON.stringify;
  const itx = (id, grp, ask, x) => Object.assign({ id, title: 'Rec ' + id, event: 'EV-' + id, grp, ask }, x || {});
  const part = (tag, fn) => { try { fn(); } catch (e) { failures.push({ scenario: name, where: tag, what: 'the part threw: ' + String((e && e.message) || e).split('\n')[0].slice(0, 160), got: 'threw', want: 'ran' }); } };
  const mk = (services, items, order) => { const b = boot(); seed(b.ev, { services, items, disc: services.map(() => 500), mand: services.map(() => 0), order });
    b.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save();
      window.__asked=[]; window.__ans=true; window.confirm=function(m){ __asked.push(String(m)); return __ans; }; render(); 'ok'`); return b; };
  const putIn = (ev, id, v) => ev(`(function(){ var e=document.getElementById(${J(id)}); e.value=${J(v)}; e.dispatchEvent(new Event('input')); e.dispatchEvent(new Event('change')); return 'ok'; })()`);
  const btn = (ev, id) => ev(`document.getElementById(${J(id)}).click(); 'ok'`);
  const stat = ev => ev(`document.getElementById('shareStat').textContent`);

  // ---- a CCaR record typed over the file's is cleared back to the file's; the file's own still cannot be
  part('CCaR typed over the file’s', () => {
    const { ev } = mk(['USAF', 'ANG'], [itx('A', 'PSM', [100, 0], { ccar: 'JSF1234' }), itx('B', 'PSM', [100, 0], { ccar: 'JSF5555' })], ['A', 'B']);
    ev(`S.ccar=S.ccar||{}; S.ccar.A='JSF9999'; save(); render(); openEdit('A','ccar'); 'ok'`);
    chk(name, 'CCaR typed over the file’s', 'the box shows the record typed over the file’s', ev(`document.getElementById('erCcar').value`), 'JSF9999');
    putIn(ev, 'erCcar', ''); btn(ev, 'erSaveBtn');
    chk(name, 'CCaR typed over the file’s', 'cleared, the typed record goes and the file’s is read again', J([ev(`erOn()`), ev(`(S.ccar||{}).A===undefined`), ev(`ccarOf(itemById('A'))`)]),
      J([false, true, 'JSF1234']));
    chk(name, 'CCaR typed over the file’s', 'and the status line says so', stat(ev), '✎ EV-A: saved CCaR record (back to the file’s JSF1234).');
    ev(`openEdit('B','ccar'); 'ok'`); putIn(ev, 'erCcar', ''); btn(ev, 'erSaveBtn');
    chk(name, 'CCaR typed over the file’s', 'the file’s own record, nothing typed over it, still cannot be cleared', J([ev(`erOn()`), ev(`ccarOf(itemById('B'))`)]), J([true, 'JSF5555']));
    ev(`erClose(); S.ccar.A='JSF9999'; save(); openEdit('A','ccar'); 'ok'`); putIn(ev, 'erCcar', 'JSF1234'); btn(ev, 'erSaveBtn');
    chk(name, 'CCaR typed over the file’s', 'the file’s own record typed back leaves no record typed over it', J([ev(`(S.ccar||{}).A===undefined`), ev(`ccarOf(itemById('A'))`)]),
      J([true, 'JSF1234']));
  });

  // ---- the SI code: a pick the PMO and prime rules give anyway, with no code stored, is no change and is not said
  part('SI rule', () => {
    const { ev } = mk(['USN', 'STOVL'], [itx('A', 'PP', [100, 0]), itx('B', 'PSM', [100, 0]), itx('C', 'PSM', [100, 0])], ['A', 'B', 'C']);
    chk(name, 'SI rule', 'the fixture: O&M, A on PP derives EN, B and C on PSM derive none', J([ev(`siApplies()`), ev(`siOf(itemById('A'))`), ev(`siOf(itemById('B'))`)]), J([true, 'EN', '']));
    const j0 = +ev(`(MS.jrnl||[]).length`);
    ev(`openEdit('A','si'); 'ok'`); putIn(ev, 'erSi', 'EN');
    chk(name, 'SI rule', 'EN picked on PP, which the rules give anyway, is no change', ev(`document.getElementById('erSaveBtn').textContent`), 'Save');
    btn(ev, 'erSaveBtn');
    chk(name, 'SI rule', 'Save says nothing changed, stores nothing and journals nothing', J([stat(ev), ev(`(S.si||{}).A===undefined`), +ev(`(MS.jrnl||[]).length`) - j0]),
      J(['Nothing changed on EV-A.', true, 0]));
    ev(`openEdit('B','si'); 'ok'`); putIn(ev, 'erSi', '');
    chk(name, 'SI rule', '— none — on PSM, where the rules give none, is no change', ev(`document.getElementById('erSaveBtn').textContent`), 'Save');
    ev(`erClose(); openEdit('C','si'); 'ok'`); putIn(ev, 'erSi', 'LA');
    chk(name, 'SI rule', 'a code the rules do not give is a change', ev(`document.getElementById('erSaveBtn').textContent`), 'Save 1 change');
    btn(ev, 'erSaveBtn');
    chk(name, 'SI rule', 'stored, and said', J([ev(`S.si.C`), stat(ev)]), J(['LA', '✎ EV-C: saved Navy SI code.']));
    // moved to PP in the same Save with EN picked: EN is what the rules give the office the box holds -- no code is stored
    ev(`openEdit('B','si'); 'ok'`); putIn(ev, 'erGrp', 'PP'); putIn(ev, 'erSi', 'EN');
    chk(name, 'SI rule', 'moved to PP with EN picked: only the office is a change', ev(`document.getElementById('erSaveBtn').textContent`), 'Save 1 change');
    btn(ev, 'erSaveBtn');
    chk(name, 'SI rule', 'saved: B is on PP, no code stored, and it reads EN by the rules', J([ev(`grpOf(itemById('B'))`), ev(`(S.si||{}).B===undefined`), ev(`siOf(itemById('B'))`)]),
      J(['PP', true, 'EN']));
  });

  // ---- where the record name shown comes from: a prime named by its CLINs' record reads it from the list
  part('record name source', () => {
    const { ev } = mk(['USAF', 'ANG'], [itx('A', 'PSM', [100, 0], { title: '' }), itx('B', 'PSM', [100, 0], { title: '' }), itx('D', 'PSM', [100, 0], { title: 'PACK TITLE' })], ['A', 'B', 'D']);
    ev(`MS.ccarIdx={ts:1700000000001, file:'recs.xlsx', n:2, rows:{JSF1:{t:'DEPOT RECORD ONE', s:'one', d:1}, JSF2:{t:'FIELD RECORD TWO', s:'two', d:1}}};
        S.ptype=S.ptype||{}; S.ptype.A='PRIME'; S.ptype.B='PRIME'; S.ptype.D='PRIME';
        S.clinNew=S.clinNew||{}; S.clinNew.A=[{key:'n1', clin:'0001', desc:'one', ccar:'JSF1'}];
        S.clinNew.B=[{key:'n1', clin:'0001', desc:'one', ccar:'JSF1'},{key:'n2', clin:'0002', desc:'two', ccar:'JSF2'}]; save(); render(); 'ok'`);
    const line = id => { ev(`openEdit(${J(id)},'rec'); 'ok'`);
      const r = ev(`document.getElementById('erRecT').textContent+' | '+document.getElementById('erRecTag').textContent`); ev(`erClose(); 'ok'`); return r; };
    chk(name, 'record name source', 'a prime named by its CLINs’ one record: from the CCaR records list', line('A'), 'DEPOT RECORD ONE | from the CCaR records list');
    chk(name, 'record name source', 'one named by several: from the CCaR records list', line('B'), 'Multiple records (2) | from the CCaR records list');
    chk(name, 'record name source', 'one the list does not name shows its file title: from the file', line('D'), 'PACK TITLE | from the file');
  });

  // ---- the note under RCN / EEIC follows what the box holds, the requirement's own and each service's
  part('RCN note', () => {
    const { ev } = mk(['USAF', 'ANG', 'AFRC'], [itx('A', 'PSM', [100, 50, 0])], ['A']);
    ev(`MS.rcn=[{k:'r1', rcn:'12345', eeic:'ABCDE', t:'Depot', svc:['USAF','ANG','AFRC']},{k:'r2', rcn:'54321', eeic:'EDCBA', t:'Field', svc:['USAF','ANG','AFRC']}];
        S.rcnAsg=S.rcnAsg||{}; S.rcnAsg.A='r2'; rcnSvcOpen.A=true; save(); setCur('A'); render(); openEdit('A','rcnAsg'); 'ok'`);
    const note = () => ev(`document.getElementById('erRcnNote').textContent`);
    const L1 = ev(`rcnLabel('r1')`), L2 = ev(`rcnLabel('r2')`);
    chk(name, 'RCN note', 'opened: the stored combination, for each service with money', note(), 'USAF ' + L2 + ' · ANG ' + L2);
    putIn(ev, 'erRcn', 'r1');
    chk(name, 'RCN note', 'another picked: the note names it for every service', note(), 'USAF ' + L1 + ' · ANG ' + L1);
    putIn(ev, 'erRs_USAF', 'r2');
    chk(name, 'RCN note', 'USAF given its own: the note names each, and that they differ', note(), 'USAF ' + L2 + ' · ANG ' + L1 + ' — the services differ: set them per service');
    btn(ev, 'erSaveBtn');
    chk(name, 'RCN note', 'saved, the board reads what the note said', J(['USAF', 'ANG'].map(sv => ev(`rcnAsgOf('A', ${J(sv)})`))), J(['r2', 'r1']));
  });

  // ---- the way to the RECORD panel opens the box's own requirement, after ↑ prev / next ↓ too
  part('to the RECORD panel', () => {
    const { ev } = mk(['USAF', 'ANG'], [itx('A', 'PSM', [100, 50]), itx('B', 'PSM', [80, 20])], ['A', 'B']);
    ev(`setCur('A'); render(); document.querySelector('#inspector [onclick^="toggleRec("]').click(); dlgSync(); 'ok'`);
    ev(`document.querySelector('#editPanel button[onclick="erStep(1)"]').click(); dlgSync(); 'ok'`);
    chk(name, 'to the RECORD panel', 'after next ↓ the box is on B', ev(`erOpen`), 'B');
    ev(`document.getElementById('erToPanel').click(); dlgSync(); 'ok'`);
    chk(name, 'to the RECORD panel', 'the box closes and the RECORD panel shows B', J([ev(`erOn()`), ev(`curRow`)]), J([false, 'B']));
    chk(name, 'to the RECORD panel', 'the keyboard is on B’s own value', ev(`(document.activeElement && document.activeElement.getAttribute('onchange')||'').indexOf('setAsk("B",')===0`), true);
  });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ==== end v2.08 item 122 -- the second review ====


// ==== v2.09 W1 (item 125): CLIN amounts and the row controls, by pointer ====
// ==== end v2.09 W1 ====

// ==== v2.09 W2 (item 126): a PMO copy's five years ====
// ==== end v2.09 W2 ====

// ==== v2.09 W3 (item 127): Save in a PMO copy; the board refuses a copy at its other doors ====
// What a PMO copy's foot holds, and the words that said its Save was off, in jsdom (the browser half -- layout, target size,
// the keyboard, the picker's name and the real handle store -- is tools/pmo-save.mjs). Every check fails on v2.08 (ebe702e)
// unless it says CONTROL.
{
  const name = 'v2.09 W3 — a copy’s foot: 💾 Save above ✉ Submit input, its ▾ and Ctrl+S, and the words that said Save was off (item 127)';
  try {
    const J = JSON.stringify;
    const e3 = (ev, code) => { try { return ev(code); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 120); } };
    const it3 = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Rec ' + id, event: 'EV-' + id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
    const SC = { services: ['USAF', 'ANG'], items: [it3('A', 'PSM', [900, 200]), it3('C', 'AV', [500, 0])], disc: [1200, 250], mand: [300, 50], order: ['A', 'C'] };
    const B = boot(); seed(B.ev, SC);
    B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save();
      try{ localStorage.setItem('prio27who','BLL'); }catch(e){} render(); syncBtns(); 'ok'`);
    const C0 = B.ev(`(function(){ let cap=null; const _B=window.Blob;
      window.Blob=function(pt,o){ if(!cap && o && o.type==='text/html') cap=String(pt[0]); return new _B(pt,o); };
      window.confirm=function(){ return true; }; try{ publishPmoCopy(); }catch(e){} window.Blob=_B; return cap||''; })()`);
    const foot = ev => e3(ev, `JSON.stringify([...document.getElementById('uiSave').querySelectorAll('button, #saveState')].filter(function(e){ return !e.closest('[hidden]'); })
      .map(function(e){ return e.id==='saveState'? 'state' : (e.id||e.className)+':'+(e.getAttribute('onclick')||''); }))`);
    const ddSave = ev => e3(ev, `JSON.stringify([...document.querySelectorAll('#dd_save [onclick]')].map(function(b){ return b.getAttribute('onclick'); }))`);
    // the board: its foot as it was (a CONTROL)
    chk(name, 'board', 'the board’s foot is 💾 Save, its ▾ and the save state, as before (a CONTROL)', foot(B.ev),
      J(['saveBtn:saveInPlace()', "uiNav_save:uiGo('save',this)", 'state']));
    chk(name, 'board', 'its ▾ offers the board’s Save a copy (a CONTROL)', ddSave(B.ev), J(['mRun(publishState)']));
    // the copy
    const P = boot({ html: C0 });
    P.ev(`window.__al=[]; window.alert=function(m){ __al.push(String(m)); }; window.confirm=function(){ return true; }; window.prompt=function(){ return null; };
      try{ localStorage.setItem('prio27who','Pat'); localStorage.setItem('prio27pmo','PSM'); }catch(e){} render(); syncBtns(); 'ok'`);
    chk(name, 'copy', 'the foot, top to bottom: 💾 Save and its ▾, the save state, then ✉ Submit input', foot(P.ev),
      J(['pmoSaveBtn:pmoSaveCopy()', "uiNav_save:uiGo('save',this)", 'state', 'saveBtn:pmoSubmit()']));
    chk(name, 'copy', '✉ Submit input stays the primary button; Save is a plain one', e3(P.ev, `JSON.stringify([document.getElementById('saveBtn').className, document.getElementById('pmoSaveBtn').className])`),
      J(['btn pri', '']));
    chk(name, 'copy', 'the ▾ offers the copy’s own Save a copy, and nothing of the board’s', ddSave(P.ev), J(['mRun(pmoSaveCopyDl)']));
    chk(name, 'copy', 'the save state of the copy as it was published: not saved to a file yet', e3(P.ev, `document.getElementById('saveState').textContent`), 'not saved to a file yet');
    P.ev(`setDesc('A','PSM rewrote A'); syncBtns(); 'ok'`);
    chk(name, 'copy', 'edited: Unsaved changes, and Save says so', e3(P.ev, `JSON.stringify([document.getElementById('saveState').textContent, document.getElementById('pmoSaveBtn').classList.contains('dirty')])`), J(['Unsaved changes', true]));
    chk(name, 'copy', 'the bar no longer says a copy has no Save', /no Save/.test(e3(P.ev, `(document.getElementById('uiEdChip')||{}).textContent||''`)), false);
    // Ctrl+S is the copy's Save; on the board it is the board's
    const keyS = ev => e3(ev, `(function(){ window.__s=[]; var a=window.saveInPlace, b=window.pmoSaveCopy;
      saveInPlace=function(){ __s.push('saveInPlace'); }; pmoSaveCopy=function(){ __s.push('pmoSaveCopy'); };
      try{ uiSaveKey({ctrlKey:true, metaKey:false, altKey:false, shiftKey:false, key:'s', preventDefault:function(){}}); }finally{ saveInPlace=a; if(b) pmoSaveCopy=b; }
      return JSON.stringify(__s); })()`);
    chk(name, 'Ctrl+S', 'in a copy it is the copy’s Save', keyS(P.ev), J(['pmoSaveCopy']));
    chk(name, 'Ctrl+S', 'on the board it is the board’s (a CONTROL)', keyS(B.ev), J(['saveInPlace']));
    // the board's own ways out stay shut in a copy: each says so, and nothing is downloaded
    const shut = e3(P.ev, `(function(){ var out=[], _B=window.Blob, made=0; window.Blob=function(pt,o){ if(o && o.type==='text/html') made++; return new _B(pt,o); };
      ['saveInPlace','saveInPlaceFile','publishState'].forEach(function(f){ __al=[]; try{ window[f](); }catch(e){} out.push(__al.length===1 && /PMO copy/.test(__al[0])); });
      window.Blob=_B; out.push(made); return JSON.stringify(out); })()`);
    chk(name, 'the gate', 'the board’s Save, its file save and its Save a copy are each refused in a copy, and nothing is downloaded (a CONTROL on the gate)', shut, J([true, true, true, 0]));
    const gate = e3(P.ev, `(function(){ __al=[]; sandboxBlock('Saving to the shared file'); return __al[0]||''; })()`);
    chk(name, 'the words', 'the gate no longer says the work is in this browser only, and names Save', J([/in this browser only/.test(gate), /Save .*office.*own file/.test(gate)]), J([false, true]));
    chk(name, 'the words', 'the opening line names Save, not “kept in this browser, against this copy”',
      J([/Save/.test(e3(P.ev, `document.getElementById('shareStat').innerHTML`)), /against this copy/.test(e3(P.ev, `document.getElementById('shareStat').innerHTML`))]), J([true, false]));
    chk(name, 'the words', '✉ Submit input’s title points to Save', /Save.*office.*own file/.test(e3(P.ev, `document.getElementById('saveBtn').title`)), true);
    // storage refusing a change: the message points to the copy's own Save
    const refusedMsg = e3(P.ev, `(function(){ var si=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(k===_AP.key || k===BUDDB_KEY) throw new DOMException('full','QuotaExceededError'); return si.call(this,k,v); };
      try{ setDesc('A','refused'); var a=document.getElementById('shareStat').textContent; persistBud(); var b=document.getElementById('shareStat').textContent; return JSON.stringify([a,b]); }
      finally{ Storage.prototype.setItem=si; } })()`);
    chk(name, 'the words', 'storage refusing the work, or a list, points to Save and the office’s own file',
      J((() => { try { return JSON.parse(refusedMsg).map(t => /Save now to keep it in your office’s own file|Save to keep it in your office’s own file/.test(t)); } catch { return refusedMsg; } })()), J([true, true]));
    // the in-file guide's office part
    const guide = e3(P.ev, `JSON.stringify(helpSections().filter(function(s){ return s.part==='office'; }).map(function(s){ return s.id+'|'+s.el.textContent; }))`);
    chk(name, 'the guide', 'the office part has a section on Save, and no longer says Save is turned off or to reopen the same file in the same browser',
      J((() => { try { const G = JSON.parse(guide); return [G.some(g => /^o-save\|/.test(g)), G.some(g => /Save says it is turned off/.test(g)), G.some(g => /Reopen the same file in the same browser/.test(g))]; } catch { return guide; } })()), J([true, false, false]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ==== end v2.09 W3 ====

// ==== v2.09 W4 (item 128): the SI tab's requirements by code ====
// ==== end v2.09 W4 ====

// ==== v2.10 A (item 130): FYDP Disconnects -- the figures and the box ====
// FYDP › FYDP Disconnects (Brad, 27 Oct 2026): the cost estimate against a PPBE cycle's controls, by appropriation, a Summary
// and four service sheets, on screen; Export to Excel prints the same model (the workbook itself is the B slot's). Every
// expectation below is worked out HERE from the fixture's own literals -- the estimate's lines, each appropriation's position
// cells -- by the rules as Brad stated them, never read back from fdcModel(). The fixture makes the alternatives disagree:
// every appropriation, service, year and lane carries its own figure; the estimate's lines are fractional dollars; two lines
// share a service; an OPN line and a line for a service in no group; Full Fund's positions are in this browser's storage and
// Spares' only in the file (PUBS), Spares missing FY30 and carrying fractions; a second estimate that stops at FY31; a cycle
// logged only in Spares that is newer than the working plan's; a zero requirement under live controls. Every check fails on
// v2.09 (d3ce17d), which has no FYDP Disconnects, unless it says CONTROL.
{
  const name = 'v2.10 A — FYDP Disconnects: the figures, read never recomputed, and the box (item 130)';
  try {
    const J = JSON.stringify;
    const E = (ev, code) => { try { return ev(code); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 160); } };
    // a canonical form: keys sorted, and a number that is not finite named (JSON would print it as null)
    const canon = v => J(v, function (k, x) {
      if (typeof x === 'number' && !Number.isFinite(x)) return 'NF:' + x;
      if (x && typeof x === 'object' && !Array.isArray(x)) { const o = {}; Object.keys(x).sort().forEach(q => { o[q] = x[q]; }); return o; }
      return x; });
    const pageModel = (ev, opts) => E(ev, `JSON.stringify(fdcModel(${opts ? J(opts) : ''}), function(k,x){ return (typeof x==='number' && !isFinite(x))? 'NF:'+x : x; })`);
    const parse = s => { try { return JSON.parse(s); } catch { return null; } };
    const SV6 = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'], APS = ['om', 'ff', 'sp'];
    const YRS = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];
    // ---- the fixture's literals --------------------------------------------------------------------------------------------
    const ace25 = [];
    APS.forEach((ap, a) => SV6.forEach((sv, s) => {
      if (ap === 'sp' && sv === 'USMC-C') return;            // USMC CV asks nothing of Spares: a zero requirement under live controls
      const v = {}; YRS.forEach(y => { v[y] = (a + 1) * 1e9 + (s + 1) * 1e7 + (y - 2020) * 1e6 + (a * 7 + s * 3 + y % 5) * 1000 + (s % 2 ? 0.3 : 0.7); });
      ace25.push({ ap, pmo: 'AV', svc: sv, v });
      if (sv === 'USAF' || sv === 'STOVL') { const w = {}; YRS.forEach(y => { w[y] = 250000.7 + y * 3 + a; }); ace25.push({ ap, pmo: 'PP', svc: sv, v: w }); }
    }));
    { const v = {}; YRS.forEach(y => { v[y] = 9.9e8 + y; }); ace25.push({ ap: 'opn', pmo: 'AV', svc: 'USAF', v }); }          // OPN: never counted
    { const v = {}; [2027, 2028, 2029, 2030, 2031, 2032].forEach(y => { v[y] = 5e6 + y; }); ace25.push({ ap: 'om', pmo: 'Non-PMO', svc: 'XSVC', v }); }  // in no group
    const ace26 = [{ ap: 'om', pmo: 'AV', svc: 'USAF', v: { 2027: 7e6, 2028: 7.1e6, 2029: 7.2e6, 2030: 7.3e6, 2031: 7.4e6 } }];
    const HOST = '2027<img src=x onerror=__pw()>ACE';
    const SETS = {
      '2025ACE': { label: '2025ACE', ts: 2000, years: YRS.slice(), lines: ace25, appn: {}, skip: {} },
      '2026ACE': { label: '2026ACE', ts: 3000, years: [2027, 2028, 2029, 2030, 2031], lines: ace26, appn: {}, skip: {} },
      [HOST]: { label: HOST, ts: 1000, years: [2027, 2028], lines: [{ ap: 'om', pmo: 'AV', svc: 'USAF', v: { 2027: 1e6 } }], appn: {}, skip: {} },
    };
    // a position: one figure per service, line, year and lane (USAF on two lines); f marks a fraction of a dollar on every cell
    const fac = [0.82, 1.05, 0.9, 1.12, 0.95, 0.88];
    const D = (a, s, y, k) => Math.round(((a + 1) * 1e9 + (s + 1) * 1e7) * fac[(y - 2027 + 6) % 6] / 1000) * 1000 + k * 333333 + s * 7;
    const Mx = (a, s, y, k) => (a === 2 && y !== 2028) ? 0 : (s + 1) * 1000000 + (y - 2027) * 10007 + a * 1009 + k * 11;
    const posOf = (a, svcs, yrs, f) => { const lines = {}, val = {};
      svcs.forEach((sv, s) => { const ks = sv === 'USAF' ? ['n1', 'n2'] : ['_all']; lines[sv] = ks.map(k => ({ k })); val[sv] = {};
        ks.forEach((k, ki) => { val[sv][k] = {}; yrs.forEach(y => { val[sv][k][y] = { d: D(a, s, y, ki) / (sv === 'USAF' ? 2 : 1) + (f || 0), m: Mx(a, s, y, ki) }; }); }); });
      return { v: 2, split: true, lines, val }; };
    const POS = {
      om: { 'BES|2028': posOf(0, SV6, [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]),
            'PB|2027': posOf(0, SV6, [2026, 2027, 2028, 2029, 2030, 2031], 0) },
      ff: { 'BES|2028': posOf(1, ['USAF', 'STOVL', 'USMC-C', 'USN', 'NAVY-X'], [2027, 2028, 2029, 2030, 2031, 2032]) },
      sp: { 'BES|2028': posOf(2, SV6, [2027, 2028, 2029, 2031, 2032], 0.6),       // no FY30; a fraction of a dollar on each cell
            'POM|2029': posOf(2, ['USN'], [2028, 2029, 2030, 2031, 2032, 2033]) },
    };
    POS.om['PB|2027'].val.USAF.n1[2027].d += 123456789;   // PB27 is not BES28
    // ---- the oracle: the rules, from those literals --------------------------------------------------------------------------
    const GROUPS = [['USAF', 'USAF CTOL', 'USAF F-35A', ['USAF', 'ANG', 'AFRC']], ['STOVL', 'USMC STOVL', 'USMC F-35B', ['STOVL']],
      ['USMC CV', 'USMC CV', 'USMC F-35C', ['USMC-C']], ['USN CV', 'USN CV', 'USN F-35C', ['USN']]];
    const APN = { om: ['O&M', 'O&M'], ff: ['PROCUREMENT', 'Prod Support'], sp: ['INITIAL SPARES', 'Initial Spares'] };
    const yy = y => String(y % 100).padStart(2, '0');
    const oracle = (setKey, cycKey, intl) => {
      const set = SETS[setKey], Y = +cycKey.split('|')[1], years = [], sum = [];
      for (let y = Y - 1; y <= Y + 4; y++) years.push(y);
      for (let y = Y; y <= Y + 4; y++) sum.push(y);
      const ACE = /^\d{4}ACE$/.test(setKey) ? setKey.slice(0, 4) + ' ACE' : setKey, CYC = cycKey.split('|')[0] + (Y % 100);
      const carried = new Set(set.years.map(Number)); set.lines.forEach(l => Object.keys(l.v).forEach(y => carried.add(+y)));
      const req = (ap, svcs) => years.map(y => !carried.has(y) ? null
        : set.lines.filter(l => l.ap === ap && (!svcs || svcs.includes(l.svc)) && l.v[y] !== undefined).reduce((t, l) => t + Math.round(l.v[y]), 0));
      const pos = (ap, svcs, w) => years.map(y => { const P = POS[ap][cycKey]; if (!P) return null;
        const held = Object.values(P.val).some(L => Object.values(L).some(F => F[y] !== undefined)); if (!held) return null;
        return Object.keys(P.val).filter(sv => !svcs || svcs.includes(sv)).reduce((t, sv) => t + Math.round(Object.values(P.val[sv]).reduce((u, F) => u + ((F[y] || {})[w] || 0), 0)), 0); });
      const iv = (k, ap) => years.map(y => ((intl[k] || {})[ap] || {})[y] || 0);
      const T = v => sum.some(y => v[years.indexOf(y)] === null) ? null : sum.reduce((t, y) => t + v[years.indexOf(y)], 0);
      const add = (p, q) => p.map((x, i) => x === null || q[i] === null ? null : x + q[i]);
      const sub = (p, q) => p.map((x, i) => x === null || q[i] === null ? null : x - q[i]);
      const fr = (f, r) => f === null || r === null || r === 0 ? null : f / r;
      const L = (label, style, vals, x) => Object.assign({ t: 'line', label, style, vals, tot: T(vals) }, x || {});
      const PC = (label, f, r, x) => Object.assign({ t: 'line', label, style: 'pct', vals: f.map((v, i) => fr(v, r[i])), tot: fr(T(f), T(r)) }, x || {});
      const zero = years.map(() => 0), cols = years.map(y => 'FY' + yy(y)).concat(['FY' + yy(sum[0]) + '-' + yy(sum[4])]);
      const rows = []; let tu = zero, ti = zero, td = zero, tm = zero, tf = zero;
      APS.forEach(ap => { const [band, rq] = APN[ap];
        const us = req(ap), ir = iv('ir', ap), d = pos(ap, null, 'd'), m = pos(ap, null, 'm'), fi = iv('if', ap);
        const ctl = add(d, m), R = add(us, ir), F = add(ctl, fi);
        rows.push({ t: 'band', label: band }, L(ACE + ' ' + rq + ' Required', 'bold', R, { ap }), L(ACE + ' - ' + rq + ' Req - US Only', 'sub', us, { ap }),
          L(ACE + ' - International Req Total', 'sub', ir, { ap, input: 'ir' }), L(CYC + ' ' + rq + ' Controls', 'bold', ctl, { ap }),
          L('Discretionary', 'ital', d, { ap }), L('Mandatory', 'ital', m, { ap }), L('International Funding', 'bold', fi, { ap, input: 'if' }),
          L('Delta (' + ACE + ' vs ' + CYC + ')', 'delta', sub(F, R), { ap }), PC('% Funded', F, R, { ap }), { t: 'gap' });
        tu = add(tu, us); ti = add(ti, ir); td = add(td, d); tm = add(tm, m); tf = add(tf, fi); });
      const tc = add(td, tm), TR = add(tu, ti), TF = add(tc, tf);
      rows.push({ t: 'navy', label: 'F-35 Sustainment - Total DoD' }, L(ACE + ' Required Funding', 'bold', TR), L('Requirement - US Only', 'sub', tu),
        L('International Requirement Total', 'sub', ti), L(CYC + ' Approved Funding', 'bold', tc), L('Discretionary', 'ital', td), L('Mandatory', 'ital', tm),
        L('International Approved Funding', 'bold', tf), L('DoD Delta (' + ACE + ' vs ' + CYC + ')', 'delta', sub(TF, TR)), PC('% Funded (' + CYC + ')', TF, TR));
      const sheets = [{ name: 'Summary', kind: 'summary', title: 'F-35 Sustainment Summary', subtitle: ACE + ' / ' + CYC, corner: '(TY$M) Total Position',
        over: 'Delta from ' + CYC, head: 'Appropriation', cols, rows }];
      GROUPS.forEach(([gname, title, air, svcs]) => { const G = []; let gu = zero, gd = zero, gm = zero;
        APS.forEach(ap => { const rq = APN[ap][1], us = req(ap, svcs), d = pos(ap, svcs, 'd'), m = pos(ap, svcs, 'm'), ctl = add(d, m);
          G.push(L(ACE + ' - ' + rq + ' Req', 'bold', us, { ap }), L(CYC + ' Controls', 'bold', ctl, { ap }), L('Discretionary', 'ital', d, { ap }),
            L('Mandatory', 'ital', m, { ap }), L(air + ' Delta', 'delta', sub(ctl, us), { ap }), PC('% Funded', ctl, us, { ap }), { t: 'sep' });
          gu = add(gu, us); gd = add(gd, d); gm = add(gm, m); });
        const gc = add(gd, gm);
        G.push(L(ACE + ' - Total Sustainment', 'bold', gu), L(CYC + ' Controls', 'bold', gc), L('Discretionary', 'ital', gd), L('Mandatory', 'ital', gm),
          L(air + ' Delta', 'delta', sub(gc, gu)), PC('% Funded', gc, gu));
        sheets.push({ name: gname, kind: 'service', title: 'F-35 Sustainment', subtitle: CYC + ' Service Detail – ' + title, head: air + ' TY$M', cols, rows: G }); });
      const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], now = new Date();
      const out = { ace: { key: setKey, label: ACE }, cyc: { key: cycKey, label: CYC }, years, sum, marking: 'CUI//REL TO US DoW',
        footer: MON[now.getMonth()] + ' ' + now.getFullYear() + ' / Sustainment Finance / PSM', sheets };
      // v2.11: the services no sheet takes -- an estimate line, then each appropriation's position under the cycle, in that
      // order -- said once, and carried by the model only when there is one (STOVL also takes Full Fund's USMC-B)
      const grouped = new Set(GROUPS.flatMap(g => g[3]).concat(['USMC-B'])), STORE = { om: 'O&M', ff: 'Full Fund', sp: 'Initial Spares' }, lone = [];
      const one = (sv, at) => { if (grouped.has(sv)) return; const f = lone.find(x => x.sv === sv); if (f) { if (!f.at.includes(at)) f.at.push(at); } else lone.push({ sv, at: [at] }); };
      set.lines.forEach(l => { if (STORE[l.ap]) one(l.svc, ACE); });
      ['om', 'ff', 'sp'].forEach(ap => { const P = POS[ap][cycKey]; if (P) Object.keys(P.val).forEach(sv => one(sv, STORE[ap] + ' ' + CYC)); });
      if (lone.length) out.note = 'Counted on the Summary only, on no service sheet: ' + lone.map(x => x.sv + ' (' + x.at.join(', ') + ')').join('; ') + '.';
      return out;
    };
    // how the box prints a figure: millions, a shortfall red in parentheses, nothing to state as an em dash
    const money = v => v === null ? '—' : (v < 0 ? '($' + Math.round(-v / 1e6).toLocaleString('en-US') + ')' : '$' + Math.round(v / 1e6).toLocaleString('en-US'));
    const shown = (r, v) => r.style === 'pct' ? (v === null ? '—' : Math.round(v * 100) + '%') : money(v);
    // ---- the board: O&M on screen, Full Fund in this browser's storage, Spares in the file only ---------------------------------
    const B = boot();
    seed(B.ev, { services: SV6, items: [{ id: 'A', grp: 'PSM', team: 'PSM', sect: '', custom: false, title: 'Rec A', event: 'EV-A', ccar: '', fy26: SV6.map(() => 0), ask: SV6.map((_, i) => (i + 1) * 1e6), alloc: null }],
      disc: SV6.map(() => 9e6), mand: SV6.map(() => 1e6), order: ['A'] });
    E(B.ev, `BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save();
      try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
      ACEDB.sets=${J(SETS)}; ACEDB.ts=4000;
      MS.ppbe=${J(POS.om)}; MS.cycle='BES|2028';
      localStorage.setItem(_SLUGMAP.ff.key, JSON.stringify({years:{}, order:[], ts:10, ppbe:${J(POS.ff)}}));
      PUBS.sp={years:{}, order:[], ts:Date.now()+60000, ppbe:${J(POS.sp)}};
      window.__pw=function(){ window.__pwned=1; }; render(); 'ok'`);
    // ---- where it lives, and the box ---------------------------------------------------------------------------------------
    // v2.12 W3: Fit to the PPBE position (item 134) sits after PPBE Budget Positions, the positions it reads
    chk(name, 'the left menu', 'FYDP ▸ lists FYDP Disconnects… after the Spruills, opening toggleFdc',
      E(B.ev, `(function(){ var d=document.createElement('div'); d.innerHTML=uiFlyItems('fydp'); return JSON.stringify([].map.call(d.querySelectorAll('button'), function(b){ return (b.getAttribute('onclick')||'').replace(/^uiFlyClose\\(\\);mRun\\((\\w+)\\)$/,'$1'); })); })()`),
      J(['toggleFydp', 'toggleSp', 'toggleFdc', 'toggleP2', 'toggleFit', 'toggleFlow']));
    E(B.ev, `toggleFdc(); 'ok'`);
    chk(name, 'the box', 'it opens, named from its heading, with its own close control',
      E(B.ev, `JSON.stringify([document.getElementById('fdcPanel').classList.contains('open'), /^FYDP DISCONNECTS/.test(document.querySelector('#fdcPanel h3').textContent), !!document.querySelector('#fdcPanel h3 button.x')])`), J([true, true, true]));
    const opts = id => E(B.ev, `JSON.stringify([].map.call(document.querySelectorAll('#${id} option'), function(o){ return [o.value, o.textContent, o.selected]; }))`);
    const aceOpts = parse(opts('fdcAce')) || [];
    chk(name, 'the pickers', 'the cost estimates, newest import first, each by its label as imported; the newest is picked to start',
      J(aceOpts.map(o => [o[0], o[1].replace(/ \(imported .*\)$/, ''), o[2]])), J([['2026ACE', '2026 ACE', true], ['2025ACE', '2025 ACE', false], [HOST, HOST, false]]));
    chk(name, 'the pickers', 'the PPBE cycles: every cycle a position is logged under in O&M, Full Fund or Spares, newest first, each naming who logged it; the working plan’s BES28 is picked to start although Spares’ POM29 is newer',
      opts('fdcCyc'), J([['POM|2029', 'POM29 — positions logged for Initial Spares', false], ['BES|2028', 'BES28 — positions logged for O&M, Full Fund, Initial Spares', true],
        ['PB|2027', 'PB27 — positions logged for O&M', false]]));
    // the estimate that stops at FY31: its FY32 requirement is nothing to state, never $0
    chk(name, '2026 ACE', 'every sheet, line by line, from the estimate that carries FY27–FY31 only (FY32 and the FYDP total print —)',
      canon((parse(pageModel(B.ev)) || {}).sheets), canon(oracle('2026ACE', 'BES|2028', {}).sheets));
    chk(name, '2026 ACE', 'the box says the estimate carries no FY32',
      E(B.ev, `[].some.call(document.querySelectorAll('#fdcBody .fdcnote.warn'), function(n){ return /2026 ACE carries no figure for FY32/.test(n.textContent); })`), 'true');
    // pick 2025 ACE as a person does
    const pick = (ev, id, v) => E(ev, `(function(){ var s=document.getElementById(${J(id)}); s.value=${J(v)}; s.dispatchEvent(new Event('change',{bubbles:true})); return s.value; })()`);
    pick(B.ev, 'fdcAce', '2025ACE');
    const M0 = parse(pageModel(B.ev)) || {}, W0 = oracle('2025ACE', 'BES|2028', {});
    chk(name, 'the model', 'the estimate and cycle it names, the years (the year before the cycle, then the FYDP), the marking and the footer of the month it is made',
      canon([M0.ace, M0.cyc, M0.years, M0.sum, M0.marking, M0.footer]), canon([W0.ace, W0.cyc, W0.years, W0.sum, W0.marking, W0.footer]));
    W0.sheets.forEach((sh, i) => {
      const got = ((M0.sheets || [])[i]) || {};
      chk(name, 'the model · ' + sh.name, 'title, subtitle, headings and columns', canon([got.name, got.kind, got.title, got.subtitle, got.corner, got.over, got.head, got.cols]),
        canon([sh.name, sh.kind, sh.title, sh.subtitle, sh.corner, sh.over, sh.head, sh.cols]));
      sh.rows.forEach((r, ri) => chk(name, 'the model · ' + sh.name, 'row ' + ri + ' ' + (r.label || r.t), canon((got.rows || [])[ri]), canon(r)));
      chk(name, 'the model · ' + sh.name, 'no row more or fewer', ((got.rows || []).length), sh.rows.length);
    });
    {
      const figs = (M0.sheets || []).flatMap(s => s.rows.filter(r => r.t === 'line' && r.style !== 'pct').flatMap(r => r.vals.concat([r.tot]))).filter(v => v !== null);
      chk(name, 'the model', 'every money figure on every sheet is a whole dollar (an estimate line is $M times a million; Spares’ cells carry 60 cents)',
        J([figs.length > 300, figs.filter(v => !Number.isInteger(v)).length]), J([true, 0]));
    }
    chk(name, 'the model', 'the fixture reaches what it tests (a CONTROL on the fixture): a null year (Spares FY30), a null FYDP total, a negative and a positive delta, a zero requirement under live controls',
      J((() => { const s = W0.sheets[0].rows, u = W0.sheets[3].rows; const sp = s.filter(r => r.ap === 'sp' && r.style === 'bold')[1];
        const dl = W0.sheets.flatMap(x => x.rows.filter(r => r.style === 'delta').flatMap(r => r.vals)).filter(v => v !== null);
        return [sp.vals[3], sp.tot, dl.some(v => v < 0), dl.some(v => v > 0), u.filter(r => r.ap === 'sp')[0].vals[1], u.filter(r => r.ap === 'sp')[1].vals[1] > 0]; })()),
      J([null, null, true, true, 0, true]));
    // the box draws the model: every figure on the Summary, a shortfall red in parentheses, nothing to state as —
    const cells = ev => parse(E(ev, `JSON.stringify([].map.call(document.querySelectorAll('#fdcPage tbody tr'), function(tr){
      return [].map.call(tr.querySelectorAll('td'), function(td){ var i=td.querySelector('input'); return i? 'in:'+i.value : (td.querySelector('.neg')? 'neg:' : '')+td.textContent; }); }))`)) || [];
    const want = sh => sh.rows.map(r => r.t === 'band' || r.t === 'navy' ? [] : r.t !== 'line' ? [''] : r.vals.map((v, i) => r.input ? 'in:$' + (v / 1e6).toLocaleString('en-US', { maximumFractionDigits: 6 }) : (v !== null && v < 0 && r.style !== 'pct' ? 'neg:' : '') + shown(r, v))
      .concat([(r.tot !== null && r.tot < 0 && r.style !== 'pct' ? 'neg:' : '') + shown(r, r.tot)]));
    chk(name, 'the box · Summary', 'every cell on screen is the figure the model holds, in $M: red parentheses for a shortfall, — for nothing to state, $0 in each International box',
      canon(cells(B.ev)), canon(want(W0.sheets[0])));
    chk(name, 'the box · Summary', 'the CUI marking above the title and in the footer, the title, the subtitle and the footer line',
      E(B.ev, `JSON.stringify([].map.call(document.querySelectorAll('#fdcPage > div:not(.fdcwrap), #fdcPage .fdcfoot > span'), function(e){ return e.textContent; }))`),
      J(['CUI//REL TO US DoW', 'F-35 Sustainment Summary', '2025 ACE / BES28', W0.footer + 'CUI//REL TO US DoW', W0.footer, 'CUI//REL TO US DoW']));
    const notes = () => E(B.ev, `JSON.stringify([].map.call(document.querySelectorAll('#fdcBody .fdcnote'), function(n){ return n.textContent; }))`);
    chk(name, 'the box', 'it says the International figures are not kept and are lost when the board reloads, switching appropriation included',
      /kept for this session only: they are not saved with the board, and are lost when the board reloads — switching appropriation reloads it/.test(notes()), true);
    chk(name, 'the box', 'it says Spares holds no BES28 position for FY30, and names the services counted on the Summary only',
      J([/Initial Spares holds no BES28 position for FY30, so that year prints —/.test(notes()), /Counted on the Summary only, on no service sheet: XSVC \(2025 ACE\); NAVY-X \(Full Fund BES28\)/.test(notes())]), J([true, true]));
    // ---- nothing typed is kept: the stores before -----------------------------------------------------------------------------
    const stores = ev => E(ev, `JSON.stringify([JSON.stringify(MS), (function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })(),
      JSON.stringify(PUBS), JSON.stringify(MS.jrnl||[]), _saveGen, typeof DIRTY==='undefined'? null : DIRTY])`);
    const before = stores(B.ev);
    // ---- the International figures, typed as a person types them ----------------------------------------------------------
    const type = (ev, id, v) => E(ev, `(function(){ var e=document.getElementById(${J(id)}); if(!e) return 'no box '+${J(id)}; e.focus(); e.value=${J(v)};
      e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); return e.value+'|'+document.getElementById('fdcMsg').textContent; })()`);
    const t1 = type(B.ev, 'fdcIn_ir_om_2028', '12.5');
    const t2 = type(B.ev, 'fdcIn_if_ff_2029', '750K');
    const t3 = type(B.ev, 'fdcIn_if_sp_2031', '1.2345678');
    const t4 = type(B.ev, 'fdcIn_ir_sp_2027', 'abc');
    const t5 = type(B.ev, 'fdcIn_if_ff_2029', 'abc');          // a refusal keeps the figure there, never clears it
    const t6 = type(B.ev, 'fdcIn_if_om_2032', '-5');
    const t7 = type(B.ev, 'fdcIn_ir_ff_2030', '3');
    chk(name, 'International', 'typed in $M through the board’s $M reader: 12.5 is $12,500,000, 750K is $750,000, 3 is $3,000,000, and each box shows it back',
      J([t1.split('|')[0], t2.split('|')[0], t7.split('|')[0]]), J(['$12.5', '$0.75', '$3']));
    chk(name, 'International', 'a fraction of a dollar is kept as a whole dollar, and said', t3, '$1.234568|Entered as $1,234,568: the board keeps whole dollars.');
    chk(name, 'International', 'words, and a figure below zero, are refused: the box keeps what it held ($0, $0.75 and $0) and says why',
      J([t4.split('|')[0], /not changed/.test(t4), t5.split('|')[0], /not changed/.test(t5), t6.split('|')[0], /below zero/.test(t6)]), J(['$0', true, '$0.75', true, '$0', true]));
    const INTL = { ir: { om: { 2028: 12500000 }, ff: { 2030: 3000000 } }, if: { ff: { 2029: 750000 }, sp: { 2031: 1234568 } } };
    const M1 = parse(pageModel(B.ev)) || {}, W1 = oracle('2025ACE', 'BES|2028', INTL);
    chk(name, 'International', 'the Summary moves by them: each appropriation’s requirement, funding, delta and % Funded, and the total section',
      canon((M1.sheets || [])[0]), canon(W1.sheets[0]));
    chk(name, 'International', 'the four service sheets do not move (they carry no International lines): they are the sheets without them', canon((M1.sheets || []).slice(1)), canon(W0.sheets.slice(1)));
    chk(name, 'International', 'and the service sheets are still the fixture’s (a CONTROL on the line above, with the one before it)', canon(W1.sheets.slice(1)), canon(W0.sheets.slice(1)));
    chk(name, 'International', 'the box redraws the figures they move, in place: every Summary cell is the new model’s',
      canon(cells(B.ev)), canon(want(W1.sheets[0])));
    // a render while a figure is being typed takes nothing: the field, its keyboard and its text stay
    chk(name, 'International', 'a redraw never runs under a figure being typed (the field, the keyboard and the text stay)',
      E(B.ev, `(function(){ var e=document.getElementById('fdcIn_ir_om_2029'); e.focus(); e.value='4.4'; e.dispatchEvent(new Event('input',{bubbles:true}));
        render(); var f=document.getElementById('fdcIn_ir_om_2029'); var r=JSON.stringify([f===e, document.activeElement===e, f.value]);
        e.value='$0'; e.dispatchEvent(new Event('change',{bubbles:true})); e.blur(); return r; })()`), J([true, true, '4.4']));
    // a Tab leaving a figure: Chromium fires its change as the keyboard is nowhere, a Tab on its way (here, as there); the box puts
    // the keyboard where the Tab was going, before the figures are drawn again -- or the box controller hands it back to the field.
    // jsdom lays nothing out, so what is on screen (getClientRects) is stood in for while it runs; npm run keys (R) is the browser.
    const tabOut = step => E(B.ev, `(function(){ var gr=Element.prototype.getClientRects; Element.prototype.getClientRects=function(){ return [{}]; };
      try{ var e=document.getElementById('fdcIn_if_om_2027'); e.focus(); e.value='0'; e.dispatchEvent(new Event('input',{bubbles:true}));
        e.blur(); _navStep=${step}; e.dispatchEvent(new Event('change',{bubbles:true})); return document.activeElement.id; }
      finally { _navStep=null; Element.prototype.getClientRects=gr; } })()`);
    chk(name, 'International', 'Tab out of a figure lands on the next year’s box, Shift+Tab on the box before it',
      J([tabOut(1), tabOut(-1)]), J(['fdcIn_if_om_2028', 'fdcIn_ir_om_2032']));
    // ---- the tabs ----------------------------------------------------------------------------------------------------------
    const tab = i => E(B.ev, `(function(){ document.getElementById('fdcTab_${i}').click(); return JSON.stringify([[].map.call(document.querySelectorAll('#fdcBody .fdctabs button'), function(b){ return b.textContent+'='+b.getAttribute('aria-pressed'); }),
      document.querySelector('#fdcPage .fdct1').textContent, document.querySelector('#fdcPage .fdct2').textContent, document.querySelector('#fdcPage thead tr:last-child th').textContent]); })()`);
    chk(name, 'the tabs', 'USAF: pressed alone, its slide’s title and subtitle, its rows headed USAF F-35A', tab(1),
      J([['Summary — all services=false', 'USAF=true', 'STOVL=false', 'USMC CV=false', 'USN CV=false'], 'F-35 Sustainment', 'BES28 Service Detail – USAF CTOL', 'USAF F-35A TY$M']));
    chk(name, 'the tabs', 'USAF’s cells are the USAF sheet (USAF, ANG and AFRC), with a dark separator between the appropriations', canon(cells(B.ev)), canon(want(W1.sheets[1])));
    {
      const line3 = y => ace25.filter(l => l.ap === 'om' && ['USAF', 'ANG', 'AFRC'].includes(l.svc)).reduce((t, l) => t + Math.round(l.v[y]), 0);
      const usaf1 = y => ace25.filter(l => l.ap === 'om' && l.svc === 'USAF').reduce((t, l) => t + Math.round(l.v[y]), 0);
      const got = ((((parse(pageModel(B.ev)) || {}).sheets || [])[1] || {}).rows || [])[0] || {};
      chk(name, 'the tabs', 'USAF holds ANG and AFRC: its O&M requirement each year is the three services’ lines, not USAF’s alone',
        J([got.label, got.vals, W0.years.some(y => line3(y) === usaf1(y))]), J(['2025 ACE - O&M Req', W0.years.map(line3), false]));
    }
    chk(name, 'the tabs', 'USN CV', (tab(4), canon(cells(B.ev))), canon(want(W1.sheets[4])));
    tab(0);
    // ---- the cycle picker moves the years and the controls -------------------------------------------------------------------
    pick(B.ev, 'fdcCyc', 'PB|2027');
    chk(name, 'PB27', 'the columns are FY26–FY31 with an FY27–31 total, and every sheet is PB27’s (Full Fund and Spares log no PB27, so their controls print —)',
      canon([E(B.ev, `JSON.stringify([].map.call(document.querySelectorAll('#fdcPage thead tr:last-child th'), function(t){ return t.textContent; }))`), (parse(pageModel(B.ev)) || {}).sheets]),
      canon([J(['Appropriation', 'FY26', 'FY27', 'FY28', 'FY29', 'FY30', 'FY31', 'FY27-31']), oracle('2025ACE', 'PB|2027', INTL).sheets]));
    chk(name, 'PB27', 'the box says Full Fund and Spares have no PB27 position', J([/Full Fund has no PB27 position logged/.test(notes()), /Initial Spares has no PB27 position logged/.test(notes())]), J([true, true]));
    pick(B.ev, 'fdcCyc', 'BES|2028');
    // ---- an estimate's label is drawn as text ------------------------------------------------------------------------------
    pick(B.ev, 'fdcAce', HOST);
    chk(name, 'hostile', 'an estimate named with markup is drawn as text: in the picker and the subtitle, nothing built from it, nothing run',
      E(B.ev, `JSON.stringify([document.querySelector('#fdcAce option:checked').textContent.replace(/ \\(imported .*\\)$/,''), document.querySelector('#fdcPage .fdct2').textContent, document.querySelectorAll('#fdcBody img').length, !!window.__pwned])`),
      J([HOST, HOST + ' / BES28', 0, false]));
    pick(B.ev, 'fdcAce', '2025ACE');
    // ---- nothing is kept: the same stores after typing, tabs and picks ------------------------------------------------------
    const after = stores(B.ev), bP = parse(before) || [], aP = parse(after) || [];
    // typed and in the box (the O&M International Req for FY28 is $12,500,000), and kept nowhere else
    const inBox = E(B.ev, `fdcModel().sheets[0].rows[3].vals[1]`);
    chk(name, 'nothing stored', 'the store (MS) is byte for byte as it was before the International figures were typed, which the box holds',
      J([aP[0] === bP[0] && typeof aP[0] === 'string', inBox]), J([true, 12500000]));
    chk(name, 'nothing stored', 'browser storage, the file’s appropriations (PUBS), the change journal, the save count and the unsaved flag: unchanged, with the figures in the box',
      J([aP.slice(1), inBox]), J([bP.slice(1), 12500000]));
    chk(name, 'nothing stored', 'yet the figures are in the box: the model still carries them (a CONTROL on the two above being a real test)',
      canon(((parse(pageModel(B.ev)) || {}).sheets || [])[0]), canon(W1.sheets[0]));
    const saved = E(B.ev, `buildSavedHtml()`);
    const R0 = boot({ html: saved });
    E(R0.ev, `toggleFdc(); (function(){ var s=document.getElementById('fdcAce'); s.value='2025ACE'; s.dispatchEvent(new Event('change',{bubbles:true})); })(); 'ok'`);
    chk(name, 'nothing stored', 'the board saved and opened again: every International box is back at $0, the requirement as the estimate alone',
      E(R0.ev, `JSON.stringify([document.getElementById('fdcIn_ir_om_2028').value, document.getElementById('fdcIn_if_sp_2031').value, fdcModel().sheets[0].rows[1].vals[1]])`),
      J(['$0', '$0', W0.sheets[0].rows[1].vals[1]]));
    // ---- Export to Excel: the model it hands the workbook, and the file's name ------------------------------------------------
    const exp = ev => E(ev, `(function(){ var got=null, built=null, name=null, al=[]; var oS=window.fdcSheets, oB=window.buildXlsx, oC=HTMLAnchorElement.prototype.click, oA=window.alert;
      window.fdcSheets=function(m){ got=m; return {sheets:[{name:'S', cols:[10], rows:[['x']]}], extra:{marker:1}}; };
      window.buildXlsx=function(s, x){ built=[s.length, x && x.marker]; return new Uint8Array([1]); };
      HTMLAnchorElement.prototype.click=function(){ name=this.download; }; window.alert=function(m){ al.push(String(m)); };
      try{ exportFdc(); } finally { window.fdcSheets=oS; window.buildXlsx=oB; HTMLAnchorElement.prototype.click=oC; window.alert=oA; }
      return JSON.stringify([got? JSON.stringify(got)===JSON.stringify(fdcModel()) : null, built, name, al.length]); })()`);
    chk(name, 'Export to Excel', 'it hands fdcSheets the model on screen (International figures included) and buildXlsx what that returns, and names the file for the estimate, the cycle and the years',
      exp(B.ev), J([true, [1, 1], 'ORBIT FYDP Disconnects — 2025 ACE vs BES28 — FY27–FY32.xlsx', 0]));
    // ---- END TO END (v2.10 integration): the real fdcSheets and buildXlsx, nothing stood in but the download. The parts above
    // hand the workbook a stand-in, because A and B were built apart; this is where the two meet. Five sheets in order, and the
    // Summary's O&M requirement and the USAF sheet's O&M controls, FY28, are the box's own figures in the bytes.
    const e2e = J(parse(E(B.ev, `(function(){ var u=null, oB=window.buildXlsx, oC=HTMLAnchorElement.prototype.click; var M=fdcModel();
      window.buildXlsx=function(s, x, o){ u=oB(s, x, o); return u; }; HTMLAnchorElement.prototype.click=function(){};
      try{ exportFdc(); } finally { window.buildXlsx=oB; HTMLAnchorElement.prototype.click=oC; }
      if(!u) return JSON.stringify({err:'no workbook'});
      var dv=new DataView(u.buffer, u.byteOffset, u.byteLength), at=0, td=new TextDecoder(), parts={};
      while(at+30<=u.length && dv.getUint32(at,true)===0x04034b50){ var sz=dv.getUint32(at+18,true), nl=dv.getUint16(at+26,true), xl=dv.getUint16(at+28,true);
        parts[td.decode(u.subarray(at+30,at+30+nl))]=td.decode(u.subarray(at+30+nl+xl,at+30+nl+xl+sz)); at+=30+nl+xl+sz; }
      var P=function(t){ return new DOMParser().parseFromString(t,'application/xml'); };
      var names=[].slice.call(P(parts['xl/workbook.xml']).getElementsByTagName('sheet')).map(function(s){ return s.getAttribute('name'); });
      var nums=function(k){ return [].slice.call(P(parts['xl/worksheets/sheet'+k+'.xml']).getElementsByTagName('v')).map(function(v){ return +v.textContent; }); };
      var want1=M.sheets[0].rows.filter(function(r){ return r.t==='line' && r.ap==='om' && r.style==='bold'; })[0].vals[1];
      var want2=M.sheets[1].rows.filter(function(r){ return r.t==='line' && r.ap==='om' && /Controls/.test(r.label); })[0].vals[1];
      return JSON.stringify({names:names, sum:nums(1).indexOf(want1)>=0, usaf:nums(2).indexOf(want2)>=0, whole:Number.isInteger(want1) && Number.isInteger(want2)}); })()`)));
    chk(name, 'end to end', 'Export writes the five sheets in order, and the bytes hold the box’s own Summary and USAF figures, whole dollars',
      e2e, J({ names: ['Summary', 'USAF', 'STOVL', 'USMC CV', 'USN CV'], sum: true, usaf: true, whole: true }));
    // ---- a locked cycle on screen: it only reads, so it works, and the file says which lock --------------------------------
    E(B.ev, `blCyc='PB'; blYr=MS.cur; cycLock(); cycView('PB|'+MS.cur); 'ok'`);
    chk(name, 'a locked view', 'on PB27 locked the model is the working plan’s, read from the same stores, International figures and all', canon(parse(pageModel(B.ev, { ace: '2025ACE', cyc: 'BES|2028' }))), canon(W1));
    chk(name, 'a locked view', 'and the file is marked with the lock on screen', (parse(exp(B.ev)) || [])[2], 'ORBIT FYDP Disconnects — 2025 ACE vs BES28 — FY27–FY32 [O&M PB27 LOCKED].xlsx');
    E(B.ev, `cycLeave(true); 'ok'`);
    // ---- a PMO copy holds one appropriation: not offered ----------------------------------------------------------------------
    const C0 = E(B.ev, `(function(){ fdcOpen=false; render(); let cap=null; const _B=window.Blob;
      window.Blob=function(pt,o){ if(!cap && o && o.type==='text/html') cap=String(pt[0]); return new _B(pt,o); };
      window.confirm=function(){ return true; }; try{ publishPmoCopy(); }catch(e){} window.Blob=_B; return cap||''; })()`);
    const P = boot({ html: C0 });
    E(P.ev, `try{ localStorage.setItem('prio27who','Pat'); }catch(e){} render(); 'ok'`);
    const offered = ev => E(ev, `/toggleFdc/.test(uiFlyItems('fydp'))`);
    chk(name, 'a PMO copy', 'the board offers FYDP Disconnects; a PMO copy does not', J([offered(B.ev), offered(P.ev)]), J([true, false]));
    chk(name, 'a PMO copy', 'called anyway, it does not open, says why, and its export downloads nothing',
      J([E(P.ev, `toggleFdc(); JSON.stringify([fdcOpen, document.getElementById('fdcPanel').classList.contains('open'), /not offered in a PMO copy/.test(document.getElementById('shareStat').textContent)])`),
        (parse(exp(P.ev)) || []).slice(2)]), J([J([false, false, true]), [null, 1]]));
    // ---- nothing to build -------------------------------------------------------------------------------------------------
    const N = boot();
    seed(N.ev, { services: SV6, items: [], disc: SV6.map(() => 0), mand: SV6.map(() => 0), order: [] });
    chk(name, 'nothing to build', 'no cost estimate: no model, the box says where one comes from, and Export is off',
      E(N.ev, `ACEDB.sets={}; MS.ppbe=${J(POS.om)}; toggleFdc(); JSON.stringify([fdcModel(), document.getElementById('fdcWhy').textContent, document.getElementById('fdcExport').disabled])`),
      J([null, 'No cost estimate is loaded: Data › Import Annual Cost Estimate… brings one in.', true]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ---- v2.10 review (A-1): a service named by its appropriation's own alias reaches its sheet ----------------------------------
// Full Fund's own service list calls the F-35B service 'USMC-B' and keys its PPBE positions by it; the estimate files it 'STOVL'
// (aceSvcOf). On 4c531a0 the STOVL sheet printed PROCUREMENT controls $0 against the whole requirement, the four service
// sheets came short of the Summary's controls by exactly Full Fund's F-35B, and the box named USMC-B as counted on the Summary
// only. Every figure below is worked out from the fixture's literals, the STOVL sheet taking both names (the board's alias
// table); run with O&M on screen and Full Fund in this browser's storage, then with Full Fund on screen (its own list) and O&M
// in storage -- which board is open must not decide which name counts. A service in no group stays on the Summary alone (XSVC
// in the estimate, NAVY-X in Full Fund's position): the four sheets plus those add up to the Summary, line by line, year by
// year. On 4c531a0 the block fails 16 checks (Full Fund's lines); the rest pass there, the CONTROLs and what must not move.
{
  const name = 'v2.10 review — FYDP Disconnects: Full Fund’s USMC-B is the STOVL sheet’s, and the service sheets add up to the Summary (A-1)';
  try {
    const J = JSON.stringify;
    const E = (ev, code) => { try { return ev(code); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 160); } };
    const parse = s => { try { return JSON.parse(s); } catch { return null; } };
    const ACE6 = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'], FF6 = ['USAF', 'ANG', 'AFRC', 'USMC-B', 'USMC-C', 'USN'];
    const YRS = [2027, 2028, 2029, 2030, 2031, 2032], APS = ['om', 'ff', 'sp'];
    const lines = [];
    APS.forEach((ap, a) => ACE6.forEach((sv, s) => { const v = {}; YRS.forEach(y => { v[y] = (a + 1) * 1e9 + (s + 1) * 1e7 + (y - 2020) * 1e5; }); lines.push({ ap, pmo: 'AV', svc: sv, v }); }));
    { const v = {}; YRS.forEach(y => { v[y] = 3e6 + y; }); lines.push({ ap: 'ff', pmo: 'AV', svc: 'XSVC', v }); }        // in no group
    const SETS = { '2025ACE': { label: '2025ACE', ts: 2000, years: YRS.slice(), lines, appn: {}, skip: {} } };
    const posOf = (list, a) => { const P = { v: 2, split: true, lines: {}, val: {} };
      list.forEach((sv, s) => { P.lines[sv] = [{ k: '_all', all: true }]; P.val[sv] = { _all: {} };
        YRS.forEach(y => { P.val[sv]._all[y] = { d: (a + 1) * 2e8 + (s + 1) * 3e6 + (y - 2020) * 1e4, m: (s + 1) * 1e5 + a * 1e3 + (y - 2020) }; }); });
      return P; };
    const POS = { om: posOf(ACE6, 0), ff: posOf(FF6.concat(['NAVY-X']), 1), sp: posOf(ACE6, 2) };
    // the rule: a sheet takes a service by its name or by its other name in the board's alias table
    const GRP = [['USAF', ['USAF', 'ANG', 'AFRC']], ['STOVL', ['STOVL', 'USMC-B']], ['USMC CV', ['USMC-C']], ['USN CV', ['USN']]];
    const lane = (ap, svcs, y, w) => Object.keys(POS[ap].val).filter(sv => svcs.includes(sv)).reduce((t, sv) => t + POS[ap].val[sv]._all[y][w], 0);
    const reqOf = (ap, svcs, y) => lines.filter(l => l.ap === ap && svcs.includes(l.svc)).reduce((t, l) => t + l.v[y], 0);
    const T5 = f => YRS.slice(1).reduce((t, y) => t + f(y), 0);
    const pick = (rows, ap, k) => rows.filter(r => r.t === 'line' && r.ap === ap && (k === 'us' ? / Req( - US Only)?$/.test(r.label)
      : k === 'ctl' ? /Controls$/.test(r.label) : r.label === (k === 'd' ? 'Discretionary' : 'Mandatory')))[0] || { vals: [], tot: 'missing' };
    const lone = { us: { ff: ['XSVC'] }, d: { ff: ['NAVY-X'] }, m: { ff: ['NAVY-X'] }, ctl: { ff: ['NAVY-X'] } };
    const loneOf = (k, ap, y) => { const L = (lone[k] || {})[ap] || []; return k === 'us' ? reqOf(ap, L, y) : k === 'ctl' ? lane(ap, L, y, 'd') + lane(ap, L, y, 'm') : lane(ap, L, y, k); };
    const money = v => '$' + Math.round(v / 1e6).toLocaleString('en-US');
    const ST = ['STOVL', 'USMC-B'], ctlST = (ap, y) => lane(ap, ST, y, 'd') + lane(ap, ST, y, 'm');
    const run = (B, label) => {
      const M = parse(E(B.ev, `JSON.stringify(fdcModel({ace:'2025ACE', cyc:'BES|2028'}))`)) || { sheets: [] };
      const sh = n => (M.sheets || []).filter(s => s.name === n)[0] || { rows: [] };
      chk(name, label, 'the years are FY27–FY32 (a CONTROL on the fixture: every year below is held)', J(M.years), J(YRS));
      // the STOVL sheet: Full Fund's USMC-B, O&M's and Spares' STOVL, each from its own position, against the estimate's STOVL
      APS.forEach(ap => {
        const S = sh('STOVL').rows;
        chk(name, label + ' · STOVL · ' + ap, 'the controls are this appropriation’s F-35B position, discretionary + mandatory, every year and the FYDP',
          J([pick(S, ap, 'ctl').vals, pick(S, ap, 'ctl').tot]), J([YRS.map(y => ctlST(ap, y)), T5(y => ctlST(ap, y))]));
        chk(name, label + ' · STOVL · ' + ap, 'Discretionary and Mandatory', J([pick(S, ap, 'd').vals, pick(S, ap, 'm').vals]),
          J([YRS.map(y => lane(ap, ST, y, 'd')), YRS.map(y => lane(ap, ST, y, 'm'))]));
        chk(name, label + ' · STOVL · ' + ap, 'the delta is those controls less the estimate’s STOVL requirement',
          J((S.filter(r => r.ap === ap && r.style === 'delta')[0] || {}).vals), J(YRS.map(y => ctlST(ap, y) - reqOf(ap, ['STOVL'], y))));
      });
      chk(name, label, 'the fixture reaches what it tests (a CONTROL): Full Fund’s F-35B is logged under USMC-B alone, and it is not $0',
        J([Object.keys(POS.ff.val).includes('STOVL'), lane('ff', ['USMC-B'], 2028, 'd') > 0]), J([false, true]));
      // the four sheets, plus what no sheet takes, are the Summary: every appropriation, line, year and the FYDP total
      const sum = sh('Summary').rows;
      APS.forEach(ap => ['us', 'ctl', 'd', 'm'].forEach(k => {
        const got = YRS.map((y, i) => GRP.reduce((t, g) => t + (pick(sh(g[0]).rows, ap, k).vals[i] || 0), 0) + loneOf(k, ap, y));
        const gotT = GRP.reduce((t, g) => t + (+pick(sh(g[0]).rows, ap, k).tot || 0), 0) + T5(y => loneOf(k, ap, y));
        chk(name, label + ' · foots · ' + ap, k + ': the four service sheets plus the services no sheet takes are the Summary’s line, each year and the FYDP',
          J([got, gotT]), J([pick(sum, ap, k).vals, pick(sum, ap, k).tot]));
      }));
      const all = Object.keys(POS.ff.val);
      chk(name, label + ' · foots', 'and the Summary is the whole position (a CONTROL: the identity above is not two copies of one mistake)',
        J(pick(sum, 'ff', 'ctl').vals), J(YRS.map(y => lane('ff', all, y, 'd') + lane('ff', all, y, 'm'))));
      // the notes name only what no sheet takes
      E(B.ev, `if(!fdcOpen) toggleFdc(); fdcTab(0); 'ok'`);
      chk(name, label + ' · the box', 'Counted on the Summary only names XSVC and NAVY-X, and never USMC-B',
        E(B.ev, `JSON.stringify([].map.call(document.querySelectorAll('#fdcBody .fdcnote.warn'), function(n){ return n.textContent; }).filter(function(t){ return /Summary only/.test(t); }))`),
        J(['⚠ Counted on the Summary only, on no service sheet: XSVC (2025 ACE); NAVY-X (Full Fund BES28).']));
      // and the STOVL tab draws Full Fund's controls, never $0
      E(B.ev, `fdcTab(2); 'ok'`);
      const ri = sh('STOVL').rows.findIndex(r => r.t === 'line' && r.ap === 'ff' && /Controls$/.test(r.label));
      chk(name, label + ' · the box', 'the STOVL tab draws PROCUREMENT’s controls from Full Fund’s USMC-B',
        E(B.ev, `JSON.stringify([0,1,2,3,4,5,6].map(function(c){ var td=document.getElementById('fdcC_${ri}_'+c); return td? td.textContent : null; }))`),
        J(YRS.map(y => money(ctlST('ff', y))).concat([money(T5(y => ctlST('ff', y)))])));
      E(B.ev, `fdcTab(0); toggleFdc(); 'ok'`);
    };
    const store = (P, svcs) => J({ base: 2028, cur: 2028, ts: 5, years: {}, order: [], ppbe: { 'BES|2028': P }, dataPack: svcs ? { services: svcs, items: [], budget: [] } : undefined });
    // O&M on screen, Full Fund and Spares in this browser's storage
    const O = boot();
    seed(O.ev, { services: ACE6, items: [], disc: ACE6.map(() => 0), mand: ACE6.map(() => 0), order: [] });
    E(O.ev, `ACEDB.sets=${J(SETS)}; ACEDB.ts=4000; MS.ppbe={'BES|2028':${J(POS.om)}}; MS.cycle='BES|2028';
      localStorage.setItem(_SLUGMAP.ff.key, ${J(store(POS.ff, FF6))}); localStorage.setItem(_SLUGMAP.sp.key, ${J(store(POS.sp))}); render(); 'ok'`);
    chk(name, 'O&M on screen', 'the board on screen is O&M (a CONTROL)', E(O.ev, `mySlug()`), 'om');
    run(O, 'O&M on screen');
    // Full Fund on screen: its own list says USMC-B; O&M's position, in storage, says STOVL
    const F = boot({ appn: 'FULL FUND', ls: { prio27om: store(POS.om), prio27sp: store(POS.sp),
      prio27ff: J({ base: 2028, cur: 2028, ts: 5, years: { 2028: { order: [] } }, order: [], dataPack: { services: FF6, items: [], budget: [] } }) } });
    E(F.ev, `ACEDB.sets=${J(SETS)}; ACEDB.ts=4000; MS.ppbe={'BES|2028':${J(POS.ff)}}; MS.cycle='BES|2028'; render(); 'ok'`);
    chk(name, 'Full Fund on screen', 'the board on screen is Full Fund, its own services naming USMC-B (a CONTROL)',
      E(F.ev, `JSON.stringify([mySlug(), SVC.indexOf('USMC-B')>=0, SVC.indexOf('STOVL')>=0])`), J(['ff', true, false]));
    run(F, 'Full Fund on screen');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ---- v2.10 review (A-2): an International figure left by a CLICK keeps the click's keyboard -------------------------------------
// Chromium fires the change of a figure typed and left with the mouse while the keyboard is nowhere, the click's focus still to
// land. On 4c531a0 fdcIntlSet drew the figures it moves at that moment, the box controller handed the keyboard back to the year
// just left, the click's focus was dropped and the next figure went into that year (250 in FY28, FY30 clicked, 7 typed: FY28
// $2,507M, FY30 $0); a sheet tab clicked left the keyboard on the estimate picker. Here the click is delivered as Chromium
// delivers it -- pointerdown on what is clicked, the field left with the keyboard nowhere, its change, the box controller's turn
// (the observer's microtask), then the click's focus, which lands only if nothing took the keyboard meanwhile, then the click.
// jsdom lays nothing out, so what is on screen (getClientRects) is stood in for while it runs; npm run keys (R) is Chromium,
// with a real mouse. On 4c531a0 the block fails 3 checks; the other two pass there (the figure is taken, and the CONTROL).
{
  const name = 'v2.10 review — FYDP Disconnects: an International figure left by a click keeps the click’s keyboard (A-2)';
  try {
    const J = JSON.stringify;
    const E = (ev, code) => { try { return ev(code); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 160); } };
    const SV6 = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'];
    const B = boot();
    seed(B.ev, { services: SV6, items: [], disc: SV6.map(() => 0), mand: SV6.map(() => 0), order: [] });
    E(B.ev, `(function(){ var Y=[2026,2027,2028,2029,2030,2031,2032,2033], S6=${J(SV6)}, L=[];
      ['om','ff','sp'].forEach(function(ap, a){ S6.forEach(function(sv, s){ var v={}; Y.forEach(function(y){ v[y]=(a+1)*9e8+(s+1)*4e7+(y-2020)*3e6; }); L.push({ap:ap, pmo:'AV', svc:sv, v:v}); }); });
      ACEDB.sets={'2025ACE':{label:'2025ACE', ts:2000, years:Y, lines:L, appn:{}, skip:{}}};
      var val={}, lines={}; S6.forEach(function(sv, s){ lines[sv]=[{k:'_all', all:true}]; val[sv]={_all:{}};
        [2027,2028,2029,2030,2031,2032].forEach(function(y){ val[sv]._all[y]={d:(s+1)*1.3e8+(y-2027)*2e6, m:y===2027? 5e6 : 0}; }); });
      MS.ppbe={'BES|2028':{v:2, split:true, lines:lines, val:val}}; MS.cycle='BES|2028'; toggleFdc(); })(); 'ok'`);
    // (a browser has run every microtask before a person clicks: the observer's records from the redraws before are delivered first)
    const click = (from, to, typed) => B.w.eval(`(async function(){ var gr=Element.prototype.getClientRects; Element.prototype.getClientRects=function(){ return [{}]; };
      try{ await new Promise(function(r){ setTimeout(r, 0); });
        var a=document.getElementById(${J(from)}), b=document.getElementById(${J(to)});
        a.focus(); a.value=${J(typed)}; a.dispatchEvent(new Event('input',{bubbles:true}));
        b.dispatchEvent(new Event('pointerdown',{bubbles:true}));
        a.blur(); a.dispatchEvent(new Event('change',{bubbles:true}));
        await null; await null;
        var a2=document.activeElement; if(!a2 || a2===document.body) b.focus();
        b.click();
        await new Promise(function(r){ setTimeout(r, 20); });
        return (document.activeElement||{}).id||''; }
      finally{ Element.prototype.getClientRects=gr; } })()`);
    const typeHere = v => E(B.ev, `(function(){ var e=document.activeElement; if(!e || !e.id) return 'nowhere'; e.value=${J(v)};
      e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); return e.id; })()`);
    const c0 = E(B.ev, `document.getElementById('fdcC_1_1').textContent`);
    const k1 = await click('fdcIn_ir_om_2028', 'fdcIn_ir_om_2030', '250');
    chk(name, 'a click on the next box', '250 typed in FY28 and FY30 clicked: the keyboard is on FY30, where it was clicked', k1, 'fdcIn_ir_om_2030');
    chk(name, 'a click on the next box', 'FY28 is taken, and the figures it moves are drawn once the click has landed (O&M’s FY28 requirement $250M up)',
      J([E(B.ev, `FDC_INTL.ir.om[2028]`), E(B.ev, `document.getElementById('fdcC_1_1').textContent`) === '$' + (Number(c0.replace(/[$,]/g, '')) + 250).toLocaleString('en-US')]), J([250000000, true]));
    chk(name, 'a click on the next box', 'and the 7 typed next goes into FY30, not FY28', J([typeHere('7'), E(B.ev, `JSON.stringify(FDC_INTL.ir.om)`)]),
      J(['fdcIn_ir_om_2030', J({ 2028: 250000000, 2030: 7000000 })]));
    const k2 = await click('fdcIn_if_om_2031', 'fdcTab_1', '3');
    chk(name, 'a click on a sheet tab', '3 typed in FY31’s International Funding and the USAF tab clicked: the tab is pressed and has the keyboard, the figure taken for FY31',
      J([k2, E(B.ev, `document.getElementById('fdcTab_1').getAttribute('aria-pressed')`), E(B.ev, `JSON.stringify(FDC_INTL.if.om)`)]), J(['fdcTab_1', 'true', J({ 2031: 3000000 })]));
    chk(name, 'a click on a sheet tab', 'nothing threw (a CONTROL)', J(B.errors.slice(0, 2)), J([]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ---- v2.10 review (A-3): with the team on the shared folder, another appropriation is read as its own board opens it -----------
// In folder mode Full Fund's own board opens the folder's copy when that is newer (driveStorePull); the five-year plan reads it
// so (fydpStoreFolder). On 4c531a0 the box read this browser's copy alone: controls weeks old beside the folder's current
// estimate, and with no copy here "Full Fund has no BES28 position logged" while the folder held one. Here: a Full Fund board
// writes the folder's copy (newer) and this browser's (older), each from its own livePayload(); O&M is on screen in folder mode
// with a stand-in folder. The box must say it is reading and state nothing until the folder has answered, then draw the folder's
// figures; Export pressed meanwhile waits for that answer and downloads once; with no copy in this browser it reads the folder
// the same way; a folder that cannot be read is named and nothing is said of a position not looked at; and each opening reads
// it again. Every figure is the fixture's. On 4c531a0 the block fails 8 checks; the rest pass there (the CONTROLs, and what
// the fix must keep: no claim of a missing position, the tables once it has answered). Part 4 (the skeptic's route, on e29f128's
// board): the folder reads but Full Fund's copy in it does not -- mid-sync, cut short, not a board -- with and without a copy in
// this browser; the six checks fail on e29f128, which took this browser's copy or said Full Fund had no position. Part 5 (the
// second skeptic's, on 72b56db): no readable appropriation logs a position and Full Fund's copy cannot be read -- the box said
// none was logged for Full Fund; both checks fail on 72b56db.
{
  const name = 'v2.10 review — FYDP Disconnects: in the shared folder, another appropriation is read as its own board opens it (A-3)';
  try {
    const J = JSON.stringify;
    const E = (ev, code) => { try { return ev(code); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 160); } };
    const parse = s => { try { return JSON.parse(s); } catch { return null; } };
    const SV = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'], YRS = [2027, 2028, 2029, 2030, 2031, 2032];
    const seedIt = ev => { seed(ev, { services: SV, items: [{ id: 'A', grp: 'PSM', team: 'PSM', sect: '', custom: false, title: 'Rec A', event: 'EV-A', ccar: '', fy26: SV.map(() => 0), ask: [100, 0, 0, 0, 0, 200], alloc: null }],
      disc: [1e9, 0, 0, 0, 0, 1e9], mand: SV.map(() => 0), order: ['A'] });
      E(ev, `BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); }); 'ok'`); };
    // v2.12 RV6: the positions are entered split, as their Discretionary and Mandatory figures say they are. This block is about
    // which copy is read; a position left in one-figure mode is now each service's total, divided by that appropriation's own base
    // (ppLanesOf, Brad's R37 rule) -- which the v2.12 W3 slot's RV6 block holds -- and its d and m were never a split to divide.
    const posOf = f => { const v = {}; YRS.forEach(y => { v[y] = f(y); }); return { v: 2, split: true, lines: { USN: [{ k: '_all', all: true }] }, val: { USN: { _all: v } } }; };
    const OLD = y => ({ d: 1e6, m: 0 }), NEW = y => ({ d: 50e6 + y, m: 2e6 + y }), NEWER = y => ({ d: 70e6 + y, m: 3e6 + y });
    // Full Fund's own board writes both copies, as it saves them (the folder save puts the data pack in first: _driveStorePushRun)
    const F = boot({ appn: 'FULL FUND' });
    seedIt(F.ev);
    const mk = (ts, f, extra) => E(F.ev, `(function(){ MS.ppbe=${J({ 'BES|2028': posOf(f) })}; ${extra || ''} MS.ts=${ts}; MS.dataPack=dataPackOf();
      var p=livePayload(); p.ts=${ts}; return JSON.stringify(p); })()`);
    const folderTxt = mk(20000, NEW, `MS.ppbe['POM|2029']=${J(posOf(y => ({ d: 9e6 + y, m: 0 })))};`);
    const newerTxt = mk(30000, NEWER);
    const oldStore = J((parse(mk(10, OLD)) || {}).store);
    const FILE = E(F.ev, `driveName(MS.cur, 'ff')`);
    const ace = { label: '2025ACE', ts: 5, years: YRS, appn: {}, skip: {}, lines: [{ ap: 'om', pmo: 'PSM', svc: 'USN', v: Object.fromEntries(YRS.map(y => [y, 3e6])) },
      { ap: 'ff', pmo: 'PSM', svc: 'USN', v: Object.fromEntries(YRS.map(y => [y, 60e6])) }] };
    const folder = (granted) => `(function(){ var files=window.__fold={}; files[${J(FILE)}]=${J(folderTxt)}; return {
      name:'team', kind:'directory',
      queryPermission: async function(){ return ${granted ? "'granted'" : "'denied'"}; }, requestPermission: async function(){ return ${granted ? "'granted'" : "'denied'"}; },
      getFileHandle: async function(n){ if(Object.prototype.hasOwnProperty.call(files, n)) return {name:n, getFile: async function(){
          if(window.__foldErr){ var x=new Error('the file could not be read'); x.name=window.__foldErr; throw x; }
          return {text: async function(){ return files[n]; }, lastModified:1}; }};
        var e=new Error('not found: '+n); e.name='NotFoundError'; throw e; },
      getDirectoryHandle: async function(){ var e=new Error('nf'); e.name='NotFoundError'; throw e; },
      values: async function*(){ for(var k of Object.keys(files)) yield {kind:'file', name:k}; } }; })()`;
    const board = (withOld, granted) => {
      const ls = { spmtLive: J({ store: true, mode: 'drive', on: false, folder: 'team' }) };
      if (withOld) ls.prio27ff = oldStore;
      const O = boot({ ls });
      seedIt(O.ev);
      E(O.ev, `ACEDB.sets={'2025ACE':${J(ace)}}; ACEDB.ts=4000; MS.ppbe={'BES|2028':${J(posOf(y => ({ d: 2e6, m: 0 })))}}; MS.cycle='BES|2028';
        _driveDir=${folder(granted)}; render(); 'ok'`);
      return O;
    };
    const settle = async O => { for (let i = 0; i < 100; i++) { await new Promise(r => setTimeout(r, 10)); if (E(O.ev, `!!(_fdcFold && _fdcFold.done)`) === true) break; }
      await new Promise(r => setTimeout(r, 20)); };
    const ffRows = O => parse(E(O.ev, `(function(){ var M=fdcModel(); if(!M) return 'null';
      return JSON.stringify(M.sheets[0].rows.filter(function(r){ return r.t==='line' && r.ap==='ff' && (/Controls$/.test(r.label) || r.style==='ital'); }).map(function(r){ return r.vals; })); })()`));
    const want = f => [YRS.map(y => f(y).d + f(y).m), YRS.map(y => f(y).d), YRS.map(y => f(y).m)];
    const notes = O => parse(E(O.ev, `JSON.stringify([].map.call(document.querySelectorAll('#fdcBody .fdcnote'), function(n){ return n.textContent; }))`)) || [];
    const claims = O => notes(O).filter(t => /Full Fund (has|holds) no/.test(t));
    // ---- 1. this browser holds an older copy; the folder a newer one ------------------------------------------------------------
    const O = board(true, true);
    chk(name, 'the fixture', 'folder mode is on, this browser’s Full Fund copy is the older one, and the five-year plan’s reader takes the folder’s (a CONTROL)',
      J([E(O.ev, `driveStoreOn()`), E(O.ev, `fydpStoreLocal('ff').st.ts`), await O.w.eval(`(async function(){ var r=await fydpStoreFolder('ff', fydpStoreLocal('ff')); return JSON.stringify([!!r.folder, ppSvcFy(r.st.ppbe['BES|2028'],'USN',2028)]); })()`)]),
      J([true, 10, J([true, { d: NEW(2028).d, m: NEW(2028).m, t: NEW(2028).d + NEW(2028).m }])]));
    // opened, and Export pressed at once: the box is reading, states no figure, and the workbook waits
    E(O.ev, `window.__exp={n:0, model:null}; window.__oS=fdcSheets; window.__oB=buildXlsx; window.__oC=HTMLAnchorElement.prototype.click;
      fdcSheets=function(m){ window.__exp.model=JSON.stringify(m); return {sheets:[{name:'S', cols:[10], rows:[['x']]}], extra:{}}; };
      buildXlsx=function(){ return new Uint8Array([1]); }; HTMLAnchorElement.prototype.click=function(){ window.__exp.n++; };
      window.__al=[]; window.alert=function(m){ window.__al.push(String(m)); }; toggleFdc(); 'ok'`);
    const reading = E(O.ev, `JSON.stringify([(document.getElementById('fdcWhy')||{}).textContent||null, !!document.getElementById('fdcPage'), fdcModel()===null])`);
    chk(name, 'reading', 'the box says it is reading the shared folder for Full Fund and Initial Spares, and draws no table and no model until it has answered',
      reading, J(['Reading the shared folder for Full Fund and Initial Spares: each is read as its own board opens it, the folder’s copy when that is newer…', false, true]));
    chk(name, 'reading', 'and says nothing of a position it has not looked at', J(claims(O)), J([]));
    E(O.ev, `document.getElementById('fdcExport').click(); 'ok'`);
    chk(name, 'reading', 'Export pressed while it reads downloads nothing yet, refuses nothing, and says the workbook waits for the folder',
      J([E(O.ev, `window.__exp.n`), E(O.ev, `window.__al.length`), /reading the shared folder for Full Fund and Initial Spares — the workbook downloads as soon as it answers/.test(E(O.ev, `document.getElementById('shareStat').textContent`))]), J([0, 0, true]));
    await settle(O);
    chk(name, 'answered', 'then the box draws Full Fund’s controls, Discretionary and Mandatory from the folder’s copy, every year', J(ffRows(O)), J(want(NEW)));
    chk(name, 'answered', 'the reading line is gone and the tables are on screen', E(O.ev, `JSON.stringify([!!document.getElementById('fdcWhy'), !!document.getElementById('fdcPage')])`), J([false, true]));
    chk(name, 'answered', 'and the box claims no missing Full Fund position', J(claims(O)), J([]));
    const exM = parse(E(O.ev, `window.__exp.model`)) || { sheets: [{ rows: [] }] };
    chk(name, 'answered', 'the waiting Export downloaded once, with the folder’s figures',
      J([E(O.ev, `window.__exp.n`), (exM.sheets[0].rows.filter(r => r.t === 'line' && r.ap === 'ff' && /Controls$/.test(r.label))[0] || {}).vals]), J([1, want(NEW)[0]]));
    // a cycle logged only in the folder's copy stays picked across the next opening, while the folder is read again
    E(O.ev, `fdcPick('cyc', 'POM|2029'); toggleFdc(); toggleFdc(); 'ok'`);
    await settle(O);
    chk(name, 'answered', 'a cycle only the folder’s copy logs (POM29), picked, is still the pick once the folder answers again',
      E(O.ev, `(document.querySelector('#fdcCyc option:checked')||{}).value`), 'POM|2029');
    // each opening reads the folder afresh: a newer save reaches the box the next time it opens
    E(O.ev, `fdcPick('cyc', 'BES|2028'); toggleFdc(); window.__fold[${J(FILE)}]=${J(newerTxt)}; toggleFdc(); 'ok'`);
    await settle(O);
    chk(name, 'opened again', 'the folder saved again since: the next opening draws the newer copy', J(ffRows(O)), J(want(NEWER)));
    E(O.ev, `fdcSheets=window.__oS; buildXlsx=window.__oB; HTMLAnchorElement.prototype.click=window.__oC; toggleFdc(); 'ok'`);
    // ---- 2. no Full Fund copy in this browser at all ----------------------------------------------------------------------------
    const N = board(false, true);
    chk(name, 'no copy here', 'this browser holds no Full Fund copy (a CONTROL)', J(E(N.ev, `fydpStoreLocal('ff').st`)), J(null));
    E(N.ev, `toggleFdc(); 'ok'`);
    await settle(N);
    chk(name, 'no copy here', 'the folder’s copy is read all the same: Full Fund’s controls are the folder’s, and nothing says it has no position', J([ffRows(N), claims(N)]), J([want(NEW), []]));
    // ---- 3. a folder that cannot be read ----------------------------------------------------------------------------------------
    const D = board(true, false);
    E(D.ev, `toggleFdc(); 'ok'`);
    await settle(D);
    const dn = notes(D).filter(t => /^⚠ Full Fund/.test(t));
    chk(name, 'folder unreadable', 'the box names the folder for Full Fund, and never says it has no position or prints this browser’s older copy',
      J([dn.length === 1 && /^⚠ Full Fund: its controls cannot be read here \(the shared folder could not be read \(.+\), so its newest copy is unknown\), so they print —\.$/.test(dn[0]), claims(D), (ffRows(D) || [])[0]]),
      J([true, [], YRS.map(() => null)]));
    // ---- 4. the folder reads, but Full Fund's copy in it cannot be read at that moment (the skeptic's route) --------------------
    // A copy mid-sync (getFile throws NotReadableError), one cut short (truncated JSON, which the import check does not refuse) and
    // one that is not a board (no store): only NotFoundError means the folder has none (driveStoreRead's rule). Before the strict
    // reading, this browser's older copy stood in with no note, and with no copy here the box said Full Fund "has no BES28 position
    // logged" while the folder held one. Now each is named, its controls print —, and nothing is guessed -- with or without a
    // copy in this browser.
    const ROUTES = [
      ['mid-sync', `window.__foldErr='NotReadableError'`, /could not be opened \(it may be syncing\)/],
      ['cut short', `window.__fold[${J(FILE)}]=${J(folderTxt.slice(0, Math.floor(folderTxt.length / 2)))}`, /is cut short or damaged/],
      ['not a board', `window.__fold[${J(FILE)}]=${J(J({ v: 1, ts: 40000 }))}`, /is not a saved board/],
    ];
    for (const [route, plant, how] of ROUTES) for (const here of [true, false]) {
      const B = board(here, true);
      E(B.ev, `${plant}; toggleFdc(); 'ok'`);
      await settle(B);
      const bn = notes(B).filter(t => /^⚠ Full Fund/.test(t));
      const re = new RegExp('^⚠ Full Fund: its controls cannot be read here \\(the shared folder’s copy ' + how.source + '\\), so they print —\\.$');
      chk(name, 'copy unreadable — ' + route + (here ? ', older copy here' : ', no copy here'),
        'Full Fund’s copy is named as unreadable, its controls print —, and the box neither claims a missing position nor prints this browser’s copy',
        J([bn.length === 1 && re.test(bn[0]), claims(B), (ffRows(B) || [])[0]]), J([true, [], YRS.map(() => null)]));
      // Initial Spares has no copy in the folder (NotFoundError) and none here: that is "none there", never "cannot be read"
      chk(name, 'copy unreadable — ' + route + (here ? ', older copy here' : ', no copy here'),
        'Initial Spares, with no copy in the folder, is read as having none there: no position logged, never unreadable',
        J([notes(B).some(t => /^⚠ Initial Spares has no BES28 position logged/.test(t)), notes(B).some(t => /^⚠ Initial Spares: its controls cannot be read here/.test(t))]), J([true, false]));
      E(B.ev, `toggleFdc(); 'ok'`);
    }
    // ---- 5. nothing readable logs a position, and Full Fund's copy cannot be read (the second skeptic's route) ---------------------
    // fdcState said "No PPBE position is logged for O&M, Full Fund or Initial Spares" -- of an appropriation it never read. The
    // appropriation that could not be read is named, with why, and left out of the list of those that log nothing.
    for (const here of [true, false]) {
      const B = board(here, true);
      E(B.ev, `MS.ppbe={}; window.__foldErr='NotReadableError'; toggleFdc(); 'ok'`);
      await settle(B);
      chk(name, 'nothing readable' + (here ? ', older copy here' : ', no copy here'),
        'the box names Full Fund as unreadable and says only O&M and Initial Spares log no position; no model, no claim of Full Fund',
        J([E(B.ev, `(document.getElementById('fdcWhy')||{}).textContent||null`), E(B.ev, `fdcModel()===null`)]),
        J(['No PPBE position is logged for O&M or Initial Spares: FYDP › PPBE Budget Positions… logs one. Full Fund’s controls cannot be read here (the shared folder’s copy could not be opened (it may be syncing)).', true]));
      E(B.ev, `toggleFdc(); 'ok'`);
    }
    // the five-year plan keeps its older reading (strict unset): the same mid-sync copy hands back this browser's copy (a CONTROL)
    const P = board(true, true);
    chk(name, 'copy unreadable — the five-year plan', 'fydpStoreFolder without strict still falls back to this browser’s copy (a CONTROL: unchanged)',
      await P.w.eval(`(async function(){ window.__foldErr='NotReadableError'; var r=await fydpStoreFolder('ff', fydpStoreLocal('ff')); return JSON.stringify([r.why||'', r.st && r.st.ts]); })()`),
      J(['', 10]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ==== end v2.10 A ====

// ==== v2.10 B (item 130): FYDP Disconnects -- the workbook ====
// Brad, 27 Oct 2026, of his Spruill charts: "I need to produce these Excel spreadsheets with this exact look, color scheme,
// structure, etc." fdcSheets(model) lays out the sheets the box's model hands it and buildXlsx writes them. The model here is
// HAND-BUILT in the contract's shape (recovery/v210/item130-contract.md), so the check needs nothing of the figures' builder:
// a Summary and a USAF sheet, distinct figures on every line and year, a negative, a positive delta, a year with no position
// (null) inside and outside the FYDP total's years, % Funded, an imported label holding & and <.
// THE CHECK reads the workbook the way another program does: the bytes buildXlsx made, unzipped, every part parsed with the
// page's DOMParser, every cell's style resolved through xl/styles.xml to its fill colour, font (bold, italic, size, colour,
// name), border, number format and alignment. Every expectation is typed below from the contract's look -- never read
// back from fdcSheets: the marking, the two merged titles (26 and 22 pt), the corner label and the navy band over the years,
// the navy (Summary) or light-blue (service) heading row, light-blue appropriation bands, the navy total band, the dark-grey
// separator, bold / indented / italic lines, the delta under a heavy black rule, money as whole dollars shown in millions
// with a shortfall red in parentheses, % Funded as 0%, "—" for a null, the footer row with the marking; column widths 52 and
// 13, landscape and one page, no gridlines, Arial, no house style; and the part order and counts Excel demands.
// FAILS ON 35d0dd0 (no fdcSheets: no workbook), every check but the CONTROLs.
{
  const name = 'v2.10 B (item 130) — the FYDP Disconnects workbook: the slides’ look, read back from the bytes';
  try {
  const J = JSON.stringify;
  const { ev } = boot();
  const COLS = ['FY27', 'FY28', 'FY29', 'FY30', 'FY31', 'FY32', 'FY28-32'];
  // the FYDP total is the five years after the first; null when any of them is null
  const tot = v => v.slice(1).some(x => x === null) ? null : v.slice(1).reduce((a, b) => a + b, 0);
  const ln = (label, style, vals, extra = {}) => Object.assign({ t: 'line', label, style, vals, tot: tot(vals) }, extra);
  const MODEL = {
    ace: { key: 'a1', label: '2025 ACE' }, cyc: { key: 'BES|2028', label: 'BES28' },
    years: [2027, 2028, 2029, 2030, 2031, 2032], sum: [2028, 2029, 2030, 2031, 2032],
    marking: 'CUI//REL TO US DoW', footer: 'October 2026 / Sustainment Finance / PSM',
    sheets: [
      { name: 'Summary', kind: 'summary', title: 'F-35 Sustainment Summary', subtitle: '2025 ACE <rev 2> / BES28',
        corner: '(TY$M) Total Position', over: 'Delta from BES28', head: 'Appropriation', cols: COLS,
        rows: [
          { t: 'band', label: 'O&M' },
          ln('2025 ACE O&M Required', 'bold', [4234101000, 4484202000, 4655303000, 4886404000, 5196505000, 5274606000], { ap: 'om' }),
          ln('2025 ACE - O&M Req - US Only', 'sub', [4134101000, 4384202000, 4555303000, 4786404000, 5096505000, 5174606000], { ap: 'om' }),
          ln('2025 ACE - International Req Total', 'sub', [100000000, 100000001, 100000002, 100000003, 100000004, 100000005], { ap: 'om', input: 'ir' }),
          ln('BES28 O&M Controls', 'bold', [null, 3937001000, 4177002000, 4712003000, 4813004000, 4895005000], { ap: 'om' }),
          ln('Discretionary', 'ital', [null, 3900001000, 4170002000, 4700003000, 4803004000, 4885005000], { ap: 'om' }),
          ln('Mandatory', 'ital', [null, 37000000, 7000000, 12000000, 10000000, 10000000], { ap: 'om' }),
          ln('International Funding', 'bold', [0, 1000, 25000000, 0, 2000, 0], { ap: 'om', input: 'if' }),
          ln('Delta (2025 ACE vs BES28)', 'delta', [null, -547200000, -453301000, -174401000, -383499000, -379601000], { ap: 'om' }),
          { t: 'line', label: '% Funded', style: 'pct', vals: [null, 0.878, 0.9026, 0.9643, 0.9262, 0.928], tot: 0.9201, ap: 'om' },
          { t: 'gap' },
          { t: 'band', label: 'PROCUREMENT' },
          ln('2025 ACE Prod Support Required', 'bold', [1278000001, 1390000002, 1371000003, 1525000004, 1527000005, 1597000006], { ap: 'ff' }),
          ln('BES28 Prod Support Controls', 'bold', [964000000, 1349000000, null, 1396000000, 1260000000, 1376000000], { ap: 'ff' }),
          ln('Delta (2025 ACE vs BES28)', 'delta', [-314000001, 41000002, null, -129000004, -267000005, -221000006], { ap: 'ff' }),
          { t: 'gap' },
          { t: 'navy', label: 'F-35 Sustainment - Total DoD' },
          ln('2025 ACE Required Funding', 'bold', [5512101001, 5874202002, 6026303003, 6411404004, 6723505005, 6871606006]),
          ln('DoD Delta (2025 ACE vs BES28)', 'delta', [-1111000007, -791000008, -914000009, -411000010, -732000011, -768000012]),
          { t: 'line', label: '% Funded (BES28)', style: 'pct', vals: [0.84, 0.89, 0.88, 0.95, 0.91, 0.912], tot: 0.91 },
        ] },
      { name: 'USAF', kind: 'service', title: 'F-35 Sustainment', subtitle: 'BES28 Service Detail – USAF CTOL',
        head: 'USAF F-35A TY$M', cols: COLS,
        rows: [
          ln('2025 ACE - O&M Req', 'bold', [2240101000, 2342202000, 2394303000, 2582404000, 2829505000, 2763606000], { ap: 'om' }),
          ln('BES28 Controls', 'bold', [1943001000, 1949002000, 2163003000, 2522004000, 2668005000, 2519006000], { ap: 'om' }),
          ln('Discretionary', 'ital', [1818001000, 1949002000, 2163003000, 2522004000, 2668005000, 2519006000], { ap: 'om' }),
          ln('Mandatory', 'ital', [125000000, 0, 0, 0, 0, 0], { ap: 'om' }),
          ln('USAF F-35A Delta', 'delta', [-297100000, -393200000, -231300000, -60400000, 160500000, -244600000], { ap: 'om' }),
          { t: 'line', label: '% Funded', style: 'pct', vals: [0.87, 0.83, 0.9, 0.98, 1.06, 0.91], tot: 0.92, ap: 'om' },
          { t: 'sep' },
          ln('2025 ACE - Total Sustainment', 'bold', [3430000001, 3645000002, 3714000003, 3972000004, 4262000005, 4205000006]),
          ln('USAF F-35A Delta', 'delta', [-518000001, -479000002, -465000003, -184000004, -371000005, -418000006]),
          { t: 'line', label: '% Funded', style: 'pct', vals: [0.85, 0.87, 0.87, 0.95, 0.91, 0.9], tot: 0.9 },
        ] },
    ],
  };
  // ---- the look, as the contract states it ----
  const NAVY = '1F3864', BAND = '8DB4E2', SVCH = '9BC2E6', SEP = '404040', WHITE = 'FFFFFF', FOOT = '595959';
  const MONEY = '$#,##0,,;[Red]($#,##0,,)', PCT = '0%';
  const GRID = { left: 'thin:FF808080', right: 'thin:FF808080', top: 'thin:FF808080', bottom: 'thin:FF808080' };
  const RULE = Object.assign({}, GRID, { top: 'medium:FF000000' });
  // v2.10 review: an indented look is aligned left, or Excel does not draw the indent (WB-1); every other look as it was
  const LK = (o = {}) => ({ font: { b: o.b ? 1 : 0, i: o.i ? 1 : 0, sz: o.sz || 11, color: 'FF' + (o.color || '000000'), name: 'Arial' },
    fill: o.fill ? 'FF' + o.fill : null, border: o.border || null, fmt: o.fmt || 'General', h: o.h || (o.indent ? 'left' : null), indent: o.indent || 0 });
  const LINE = { bold: { b: 1 }, sub: { indent: 2 }, ital: { i: 1, indent: 2 }, delta: {}, pct: {} };
  const L = c => String.fromCharCode(65 + c);
  const expect = sh => {
    const n = sh.cols.length, rows = [], merges = [];
    const put = (cells, ht) => { const r = rows.length + 1; rows.push({ r, ht: ht || null, cells: cells.map((c, j) => [L(j) + r, c[0], c[1]]) }); return r; };
    const all = (label, lk) => [[label, lk]].concat(sh.cols.map(() => ['', lk]));
    merges.push('A' + put([[MODEL.marking, LK({ b: 1, h: 'center' })]]) + ':' + L(n) + rows.length);
    merges.push('A' + put([[sh.title, LK({ b: 1, sz: 26, h: 'center' })]], 36) + ':' + L(n) + rows.length);
    merges.push('A' + put([[sh.subtitle, LK({ b: 1, sz: 22, h: 'center' })]], 30) + ':' + L(n) + rows.length);
    put([]);
    const sum = sh.kind === 'summary';
    if (sum) {
      const nv = LK({ b: 1, color: WHITE, fill: NAVY, h: 'center' });
      merges.push('B' + put([[sh.corner, LK({ b: 1, sz: 9 })]].concat(sh.cols.map((c, j) => [j ? '' : sh.over, nv]))) + ':' + L(n) + rows.length);
    }
    const hd = sum ? { b: 1, color: WHITE, fill: NAVY, border: GRID } : { b: 1, fill: SVCH, border: GRID };
    put([[sh.head, LK(hd)]].concat(sh.cols.map(c => [c, LK(Object.assign({ h: 'center' }, hd))])));
    for (const r of sh.rows) {
      if (r.t === 'gap') put([]);
      else if (r.t === 'band') put(all(r.label, LK({ b: 1, color: WHITE, fill: BAND, border: GRID })));
      else if (r.t === 'navy') put(all(r.label, LK({ b: 1, color: WHITE, fill: NAVY, border: GRID })));
      else if (r.t === 'sep') put(all('', LK({ fill: SEP, border: GRID })), 9);
      else {
        const s = LINE[r.style], bd = r.style === 'delta' ? RULE : GRID;
        const num = LK({ b: s.b, i: s.i, border: bd, h: 'right', fmt: r.style === 'pct' ? PCT : MONEY });
        put([[r.label, LK({ b: s.b, i: s.i, indent: s.indent, border: bd })]].concat(r.vals.concat([r.tot]).map(v => [v === null ? '—' : v, num])));
      }
    }
    if (rows[rows.length - 1].cells.length) put([]);
    merges.push('B' + put([[MODEL.footer, LK({ sz: 12, color: FOOT })], [MODEL.marking, LK({ b: 1, h: 'center' })]]) + ':D' + rows.length);
    return { rows, merges };
  };
  // ---- the workbook, read as another program reads it ----
  const R = JSON.parse(ev(`(function(){ try{
    var F=fdcSheets(${J(MODEL)}), u=buildXlsx(F.sheets, F.extra);
    if(!u) return JSON.stringify({err:'no workbook'});
    var dv=new DataView(u.buffer, u.byteOffset, u.byteLength), at=0, td=new TextDecoder(), parts={}, order=[];
    while(at+30<=u.length && dv.getUint32(at,true)===0x04034b50){ var sz=dv.getUint32(at+18,true), nl=dv.getUint16(at+26,true), xl=dv.getUint16(at+28,true);
      var k=td.decode(u.subarray(at+30,at+30+nl)); order.push(k); parts[k]=td.decode(u.subarray(at+30+nl+xl,at+30+nl+xl+sz)); at+=30+nl+xl+sz; }
    var P=function(t){ return new DOMParser().parseFromString(t,'application/xml'); };
    var bad=order.filter(function(k){ return P(parts[k]).getElementsByTagName('parsererror').length>0; });
    var A=function(x){ return [].slice.call(x||[]); }, one=function(d,t){ return d.getElementsByTagName(t)[0]; };
    var st=P(parts['xl/styles.xml']), cnt={};
    ['numFmts','fonts','fills','borders','cellXfs'].forEach(function(t){ var e=one(st,t); cnt[t]=e? [+e.getAttribute('count'), e.children.length] : null; });
    var fmts={'0':'General'}, codes=[];
    A(one(st,'numFmts').children).forEach(function(n){ fmts[n.getAttribute('numFmtId')]=n.getAttribute('formatCode'); codes.push(n.getAttribute('formatCode')); });
    var fonts=A(one(st,'fonts').children).map(function(f){ var g=function(t){ return f.getElementsByTagName(t)[0]; };
      return {b:g('b')?1:0, i:g('i')?1:0, sz:g('sz')? +g('sz').getAttribute('val') : null, color:g('color')? g('color').getAttribute('rgb') : null, name:g('name')? g('name').getAttribute('val') : null}; });
    var fills=A(one(st,'fills').children).map(function(f){ var p=f.getElementsByTagName('patternFill')[0], c=f.getElementsByTagName('fgColor')[0];
      return (p && p.getAttribute('patternType')==='solid' && c)? c.getAttribute('rgb') : null; });
    var borders=A(one(st,'borders').children).map(function(b){ var o={}, any=0; ['left','right','top','bottom'].forEach(function(n){ var e=b.getElementsByTagName(n)[0];
      if(e && e.getAttribute('style')){ var c=e.getElementsByTagName('color')[0]; o[n]=e.getAttribute('style')+':'+(c? c.getAttribute('rgb') : ''); any=1; } }); return any? o : null; });
    var xfs=A(one(st,'cellXfs').children).map(function(x){ var a=x.getElementsByTagName('alignment')[0], nf=x.getAttribute('numFmtId')||'0';
      return {font:fonts[+(x.getAttribute('fontId')||0)]||'no font', fill:fills[+(x.getAttribute('fillId')||0)]||null, border:borders[+(x.getAttribute('borderId')||0)]||null,
        fmt:fmts[nf]===undefined? 'undeclared '+nf : fmts[nf], h:a && a.getAttribute('horizontal')? a.getAttribute('horizontal') : null,
        indent:a && a.getAttribute('indent')? +a.getAttribute('indent') : 0}; });
    var wb=P(parts['xl/workbook.xml']), rels=P(parts['xl/_rels/workbook.xml.rels']), tgt={};
    A(rels.getElementsByTagName('Relationship')).forEach(function(r){ tgt[r.getAttribute('Id')]=r.getAttribute('Target'); });
    var sheets=A(wb.getElementsByTagName('sheet')).map(function(s){
      var k='xl/'+tgt[s.getAttribute('r:id')], d=P(parts[k]||'<x/>'), ws=d.documentElement, out={name:s.getAttribute('name'), part:k};
      out.kids=A(ws.children).map(function(e){ return e.localName; });
      out.cols=A(d.getElementsByTagName('col')).map(function(c){ return [+c.getAttribute('min'), +c.getAttribute('max'), +c.getAttribute('width'), c.getAttribute('customWidth')]; });
      out.rows=A(d.getElementsByTagName('row')).map(function(r){ return {r:+r.getAttribute('r'), ht:r.getAttribute('ht')? +r.getAttribute('ht') : null, custom:r.getAttribute('customHeight'),
        cells:A(r.getElementsByTagName('c')).map(function(c){ var t=c.getAttribute('t')||'n', v;
          if(t==='inlineStr'){ var tt=c.getElementsByTagName('t')[0]; v=tt? tt.textContent : ''; } else { var vv=c.getElementsByTagName('v')[0]; v=vv? Number(vv.textContent) : null; }
          return {ref:c.getAttribute('r'), t:t, v:v, s:+(c.getAttribute('s')||0)}; })}; });
      var mc=one(d,'mergeCells'); out.mcount=mc? +mc.getAttribute('count') : 0;
      out.merges=A(d.getElementsByTagName('mergeCell')).map(function(m){ return m.getAttribute('ref'); });
      var sv=one(d,'sheetView'), ps=one(d,'pageSetup'), pr=one(d,'pageSetUpPr'), po=one(d,'printOptions');
      out.page={grid:sv? sv.getAttribute('showGridLines') : null, fitToPage:pr? pr.getAttribute('fitToPage') : null, orientation:ps? ps.getAttribute('orientation') : null,
        fitToWidth:ps? ps.getAttribute('fitToWidth') : null, fitToHeight:ps? ps.getAttribute('fitToHeight') : null, centred:po? po.getAttribute('horizontalCentered') : null};
      out.house=[d.getElementsByTagName('tabColor').length, d.getElementsByTagName('headerFooter').length];
      return out; });
    return JSON.stringify({order:order, bad:bad, cnt:cnt, codes:codes, xfs:xfs, fills:fills, sheets:sheets,
      types:parts['[Content_Types].xml']||''});
  }catch(e){ return JSON.stringify({err:String((e&&e.message)||e)}); } })()`));
  const SH = R.sheets || [];
  chk(name, 'the workbook', 'fdcSheets lays it out and buildXlsx writes it: every part is XML another program reads',
    J([R.err || '', R.bad]), J(['', []]));
  chk(name, 'the sheets', 'the model’s sheets, by its names, in its order: Summary, then USAF', J(SH.map(s => s.name)), J(['Summary', 'USAF']));
  // ---- every cell, value and look ----
  const lookOf = s => (R.xfs || [])[s] || 'no style ' + s;
  MODEL.sheets.forEach((m, si) => {
    const got = SH[si] || { rows: [], merges: [], cols: [], page: {}, kids: [], house: [] }, want = expect(m);
    chk(name, m.name, 'its rows are the ones the layout makes, in order: the marking, two titles, a blank, ' + (m.kind === 'summary' ? 'the corner and the band over the years, ' : '')
      + 'the headings, every row of the model, a blank and the footer', J(got.rows.map(r => r.r)), J(want.rows.map(r => r.r)));
    want.rows.forEach(w => {
      const g = got.rows.find(r => r.r === w.r) || { r: null, cells: [] };
      chk(name, m.name + ' row ' + w.r, 'the row is there, and every cell: its value and its look -- fill, font, border, number format, alignment',
        J([g.r, g.cells.map(c => [c.ref, c.v, lookOf(c.s)])]), J([w.r, w.cells]));
    });
    chk(name, m.name, 'the merges: the marking and both titles across the table' + (m.kind === 'summary' ? ', the band over the years' : '') + ', the footer’s marking centred on the page',
      J([got.merges, got.mcount]), J([want.merges, want.merges.length]));
    chk(name, m.name, 'row heights: the titles 36 and 30 points' + (m.kind === 'summary' ? '' : ', the separator 9') + ', nothing else set',
      J(got.rows.filter(r => r.ht !== null).map(r => [r.r, r.ht, r.custom])), J(want.rows.filter(r => r.ht).map(r => [r.r, r.ht, '1'])));
    chk(name, m.name, 'column A 52 wide, the six years and the FYDP total 13 each', J(got.cols), J([[1, 1, 52, '1']].concat(COLS.map((c, j) => [j + 2, j + 2, 13, '1']))));
    chk(name, m.name, 'printed as a slide: no gridlines, landscape, one page wide and one tall, centred', J(got.page),
      J({ grid: '0', fitToPage: '1', orientation: 'landscape', fitToWidth: '1', fitToHeight: '1', centred: '1' }));
    chk(name, m.name, 'no house style: no tab colour, no house footer', J(got.house), J([0, 0]));
    chk(name, m.name, 'the parts of the sheet in the order the schema demands (Excel refuses a part out of order)', J(got.kids),
      J(['sheetPr', 'sheetViews', 'cols', 'sheetData', 'mergeCells', 'printOptions', 'pageMargins', 'pageSetup']));
    const cellsOut = got.rows.flatMap(r => r.cells.map(c => [r.r, c.ref])).filter(([r, ref], i, a) => {
      const col = ref.charCodeAt(0), row = +ref.slice(1), prev = i && a[i - 1][0] === r ? a[i - 1][1].charCodeAt(0) : 0;
      return row !== r || col <= prev; });
    const ncell = got.rows.reduce((a, r) => a + r.cells.length, 0);
    chk(name, m.name, 'every cell sits in its own row, in column order (Excel calls anything else damaged) -- and there are cells',
      J([ncell > 0, cellsOut]), J([true, []]));
    chk(name, m.name, 'every cell’s style is one the stylesheet declares -- and there are cells',
      J([ncell > 0, got.rows.flatMap(r => r.cells.filter(c => !(c.s >= 0 && c.s < (R.xfs || []).length)).map(c => c.ref))]), J([true, []]));
    // the claims a reader makes of the sheet, one by one
    chk(name, m.name, 'the CUI marking above the title and in the footer row', J([(got.rows[0] || { cells: [] }).cells.map(c => c.v),
      (got.rows[got.rows.length - 1] || { cells: [] }).cells.map(c => c.v)]), J([[MODEL.marking], [MODEL.footer, MODEL.marking]]));
  });
  // ---- the claims a reader makes, typed out ----
  const cellAt = (sheet, ref) => { for (const r of ((SH.find(s => s.name === sheet) || {}).rows || [])) for (const c of r.cells) if (c.ref === ref) return [c.v, lookOf(c.s)]; return null; };
  chk(name, 'Summary B11', 'BES28 O&M Controls in FY27 (no position logged) prints “—”, never $0, and its FYDP total still adds FY28–32',
    J([cellAt('Summary', 'B11') && cellAt('Summary', 'B11')[0], cellAt('Summary', 'H11') && cellAt('Summary', 'H11')[0]]), J(['—', 3937001000 + 4177002000 + 4712003000 + 4813004000 + 4895005000]));
  chk(name, 'Summary H20', 'Prod Support Controls has no FY29 position, inside the FYDP: its total is “—”, not the four years it has',
    J(cellAt('Summary', 'H20') && cellAt('Summary', 'H20')[0]), J('—'));
  chk(name, 'Summary C15', 'a shortfall is stored as the negative whole dollars it is, and its format shows millions, red in parentheses',
    J(cellAt('Summary', 'C15') && [cellAt('Summary', 'C15')[0], cellAt('Summary', 'C15')[1].fmt, Number.isInteger(cellAt('Summary', 'C15')[0])]), J([-547200000, MONEY, true]));
  chk(name, 'Summary C21', 'a positive delta is stored positive, black under the same format', J(cellAt('Summary', 'C21') && cellAt('Summary', 'C21')[0]), J(41000002));
  chk(name, 'Summary A15', 'the delta line sits under a heavy black rule, across the whole row', J(['A', 'B', 'H'].map(c => { const x = cellAt('Summary', c + '15'); return x && x[1].border && x[1].border.top; })),
    J(['medium:FF000000', 'medium:FF000000', 'medium:FF000000']));
  chk(name, 'Summary C16', '% Funded holds the fraction and shows it as 0%', J(cellAt('Summary', 'C16') && [cellAt('Summary', 'C16')[0], cellAt('Summary', 'C16')[1].fmt]), J([0.878, PCT]));
  chk(name, 'Summary A3', 'an imported label holding < reads back as typed, and the band holding & reads O&M', J([cellAt('Summary', 'A3') && cellAt('Summary', 'A3')[0], cellAt('Summary', 'A7') && cellAt('Summary', 'A7')[0]]),
    J(['2025 ACE <rev 2> / BES28', 'O&M']));
  chk(name, 'USAF row 5', 'a service sheet’s heading row is light blue (9BC2E6) with black bold text, not the Summary’s navy',
    J(cellAt('USAF', 'A5') && [cellAt('USAF', 'A5')[1].fill, cellAt('USAF', 'A5')[1].font.color, cellAt('USAF', 'A5')[1].font.b]), J(['FF9BC2E6', 'FF000000', 1]));
  chk(name, 'USAF row 12', 'the separator between sections is dark grey (404040), 9 points tall, across the table',
    J([((SH[1] || { rows: [] }).rows.find(r => r.r === 12) || {}).ht, ['A', 'H'].map(c => { const x = cellAt('USAF', c + '12'); return x && x[1].fill; })]), J([9, ['FF404040', 'FF404040']]));
  chk(name, 'every cell', 'every cell of the workbook is Arial', J([...new Set(SH.flatMap(s => s.rows.flatMap(r => r.cells.map(c => (lookOf(c.s).font || {}).name))))]), J(['Arial']));
  // ---- the stylesheet and the package ----
  chk(name, 'styles', 'every count the stylesheet declares (number formats, fonts, fills, borders, cell styles) is what it holds',
    J([Object.keys(R.cnt || {}), Object.keys(R.cnt || {}).filter(k => !R.cnt[k] || R.cnt[k][0] !== R.cnt[k][1])]), J([['numFmts', 'fonts', 'fills', 'borders', 'cellXfs'], []]));
  chk(name, 'styles', 'the money format and the percent are each declared once, shared by every style that uses them',
    J([(R.codes || []).filter(c => c === MONEY).length, (R.codes || []).filter(c => c === PCT).length]), J([1, 1]));
  const fl = (R.fills || []).filter(Boolean);
  const worn = [...new Set(SH.flatMap(s => s.rows.flatMap(r => r.cells.map(c => lookOf(c.s).fill)).filter(Boolean)))].sort();
  chk(name, 'styles', 'the cells wear four fills -- navy, the separator grey, light blue, the service blue -- and no fill colour is declared twice, however many styles wear it',
    J([worn, fl.length > 0 && fl.length === new Set(fl).size]), J([['FF1F3864', 'FF404040', 'FF8DB4E2', 'FF9BC2E6'], true]));
  chk(name, 'package', 'the parts in Excel’s order: content types, relationships, the workbook and its links, the styles, then each sheet',
    J(R.order), J(['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml']));
  chk(name, 'package', 'each sheet is declared in the content types', J([1, 2].map(i => (R.types || '').indexOf('PartName="/xl/worksheets/sheet' + i + '.xml"') >= 0)), J([true, true]));
  // CONTROL: the writer's new options are opt-in -- an ordinary sheet that asks for none is written as before: no sheetPr,
  // no page, gridlines shown, Calibri
  const plain = JSON.parse(ev(`(function(){ var u=buildXlsx([{name:'P', cols:[10], rows:[[{v:'a',s:1}],[12]]}]), dv=new DataView(u.buffer, u.byteOffset, u.byteLength), at=0, td=new TextDecoder(), o={};
    while(at+30<=u.length && dv.getUint32(at,true)===0x04034b50){ var sz=dv.getUint32(at+18,true), nl=dv.getUint16(at+26,true), xl=dv.getUint16(at+28,true);
      o[td.decode(u.subarray(at+30,at+30+nl))]=td.decode(u.subarray(at+30+nl+xl,at+30+nl+xl+sz)); at+=30+nl+xl+sz; }
    var s=o['xl/worksheets/sheet1.xml']; return JSON.stringify([/sheetPr|pageSetup|printOptions|showGridLines|ht=/.test(s), /Arial/.test(o['xl/styles.xml'])]); })()`));
  chk(name, 'CONTROL · an ordinary sheet', 'a sheet that asks for no page, gridlines or heights is written without them, in Calibri', J(plain), J([false, false]));
  } catch (e) {
    const msg = String((e && e.message) || e).split('\n')[0].slice(0, 160);
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + msg, got: 'threw', want: 'ran' });
  }
}
// v2.10 review (WB-1): THE INDENTED LINES WERE PRINTED FLUSH. fdcSheets gave a 'sub' and an 'ital' label indent="2" and no
// horizontal alignment, and Excel draws an indent only under left, right or distributed alignment: rendered, '… - US Only',
// 'Discretionary' and 'Mandatory' started at the same x as the bold totals, while the box indents them 22px and the contract
// calls them indented lines. THE CHECK reads each line's label and first figure out of the bytes buildXlsx made -- the
// <alignment> element its cell's style carries in xl/styles.xml, attribute by attribute -- found by the label's own text,
// and expects it from the model's style, typed here: an indented line is left, vertical centre, indent 2; a bold, delta or %
// line has no horizontal and no indent, as before; every figure is right with no indent, as before.
// FAILS ON 4c531a0 (the indented labels carry no horizontal): the six indented lines; the flush lines and the CONTROL pass there.
{
  const name = 'v2.10 review — the FYDP Disconnects workbook draws its indented lines indented: left alignment beside the indent (WB-1)';
  try {
  const J = JSON.stringify;
  const { ev } = boot();
  const COLS = ['FY27', 'FY28', 'FY29', 'FY30', 'FY31', 'FY32', 'FY28-32'];
  const ln = (label, style, k) => ({ t: 'line', label, style, vals: [1, 2, 3, 4, 5, 6].map(j => k * 1000000 + j), tot: k * 5000000 + 20 });
  const MODEL = {
    years: [2027, 2028, 2029, 2030, 2031, 2032], sum: [2028, 2029, 2030, 2031, 2032],
    marking: 'CUI', footer: 'October 2026 / PSM',
    sheets: [
      { name: 'Summary', kind: 'summary', title: 'Summary', subtitle: 'ACE / BES28', corner: '(TY$M)', over: 'Delta', head: 'Appropriation', cols: COLS,
        rows: [{ t: 'band', label: 'O&M' }, ln('O&M Required', 'bold', 1), ln('O&M Req - US Only', 'sub', 2), ln('International Req Total', 'sub', 3),
          ln('O&M Controls', 'bold', 4), ln('O&M Discretionary', 'ital', 5), ln('O&M Mandatory', 'ital', 6), ln('O&M Delta', 'delta', 7),
          { t: 'line', label: 'O&M % Funded', style: 'pct', vals: [0.9, 0.91, 0.92, 0.93, 0.94, 0.95], tot: 0.93 },
          { t: 'gap' }, { t: 'navy', label: 'Total DoD' }, ln('Required Funding', 'bold', 8), ln('DoD Delta', 'delta', 9)] },
      { name: 'USAF', kind: 'service', title: 'USAF', subtitle: 'BES28 Service Detail', head: 'USAF TY$M', cols: COLS,
        rows: [ln('USAF Req', 'bold', 10), ln('USAF Controls', 'bold', 11), ln('USAF Discretionary', 'ital', 12), ln('USAF Mandatory', 'ital', 13),
          ln('USAF Delta', 'delta', 14), { t: 'sep' }, ln('USAF Total Sustainment', 'bold', 15)] },
    ],
  };
  // ---- the look, by the model's style ----
  const LEFT = { horizontal: 'left', indent: '2', vertical: 'center' }, FLUSH = { vertical: 'center' }, FIG = { horizontal: 'right', vertical: 'center' };
  const WANT = { sub: LEFT, ital: LEFT, bold: FLUSH, delta: FLUSH, pct: FLUSH };
  // ---- the bytes, read as another program reads them: every cell's <alignment>, by its style ----
  const R = JSON.parse(ev(`(function(){ try{
    var F=fdcSheets(${J(MODEL)}), u=buildXlsx(F.sheets, F.extra);
    if(!u) return JSON.stringify({err:'no workbook'});
    var dv=new DataView(u.buffer, u.byteOffset, u.byteLength), at=0, td=new TextDecoder(), parts={};
    while(at+30<=u.length && dv.getUint32(at,true)===0x04034b50){ var sz=dv.getUint32(at+18,true), nl=dv.getUint16(at+26,true), xl=dv.getUint16(at+28,true);
      parts[td.decode(u.subarray(at+30,at+30+nl))]=td.decode(u.subarray(at+30+nl+xl,at+30+nl+xl+sz)); at+=30+nl+xl+sz; }
    var P=function(t){ return new DOMParser().parseFromString(t,'application/xml'); }, A=function(x){ return [].slice.call(x||[]); };
    var xfs=A(P(parts['xl/styles.xml']).getElementsByTagName('cellXfs')[0].children).map(function(x){
      var a=x.getElementsByTagName('alignment')[0], o={}; if(!a) return null;
      A(a.attributes).map(function(t){ return t.name; }).sort().forEach(function(n){ o[n]=a.getAttribute(n); }); return o; });
    var sheets=[1,2].map(function(k){ var out={}, d=P(parts['xl/worksheets/sheet'+k+'.xml']||'<x/>');
      A(d.getElementsByTagName('row')).forEach(function(r){ var c=A(r.getElementsByTagName('c')), a=c[0];
        if(!a || a.getAttribute('t')!=='inlineStr') return; var tt=a.getElementsByTagName('t')[0];
        out[tt? tt.textContent : '']=[xfs[+(a.getAttribute('s')||0)]||null, c[1]? xfs[+(c[1].getAttribute('s')||0)]||null : 'no figure']; });
      return out; });
    return JSON.stringify({sheets:sheets});
  }catch(e){ return JSON.stringify({err:String((e&&e.message)||e)}); } })()`));
  chk(name, 'the workbook', 'fdcSheets lays it out and buildXlsx writes it', J(R.err || ''), J(''));
  MODEL.sheets.forEach((m, si) => {
    const got = (R.sheets || [])[si] || {}, lines = m.rows.filter(r => r.t === 'line');
    const ind = lines.filter(r => WANT[r.style] === LEFT);
    // the fixture carries what the fix is about: indented lines, plain and italic, beside the flush ones
    chk(name, m.name, 'the fixture really does carry indented lines, italic among them, beside lines that are not indented',
      J([ind.length >= 2, lines.length > ind.length, ind.some(r => r.style === 'ital')]), J([true, true, true]));
    lines.forEach(r => {
      chk(name, m.name + ' · ' + r.label, r.style + ' line: its label ' + (WANT[r.style] === LEFT ? 'aligned left beside its indent of 2, so Excel draws the indent' : 'with no horizontal alignment and no indent, as before')
        + '; its first figure right, no indent', J(got[r.label] || null), J([WANT[r.style], FIG]));
    });
  });
  // CONTROL: the left alignment is fdcSheets' own -- the writer still writes exactly what an entry asks, so a workbook whose
  // style asks for an indent and names no alignment (the house style's title band, the Excel workbook's indented column)
  // keeps every byte it had
  const plain = JSON.parse(ev(`(function(){ var u=buildXlsx([{name:'P', cols:[10], rows:[[{v:'a', s:XF_EXTRA0}]]}], [{align:{v:'center', indent:1}}]),
    dv=new DataView(u.buffer, u.byteOffset, u.byteLength), at=0, td=new TextDecoder(), o={};
    while(at+30<=u.length && dv.getUint32(at,true)===0x04034b50){ var sz=dv.getUint32(at+18,true), nl=dv.getUint16(at+26,true), xl=dv.getUint16(at+28,true);
      o[td.decode(u.subarray(at+30,at+30+nl))]=td.decode(u.subarray(at+30+nl+xl,at+30+nl+xl+sz)); at+=30+nl+xl+sz; }
    return JSON.stringify((o['xl/styles.xml'].match(/<alignment[^>]*indent="1"[^>]*\\/>/g)||[])); })()`));
  chk(name, 'CONTROL · the writer', 'an entry that asks for an indent and no alignment, outside FYDP Disconnects, is written as it asks: no horizontal',
    J(plain), J(['<alignment vertical="center" indent="1"/>']));
  } catch (e) {
    const msg = String((e && e.message) || e).split('\n')[0].slice(0, 160);
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + msg, got: 'threw', want: 'ran' });
  }
}
// ==== end v2.10 B ====

// ==== v2.11: FYDP Disconnects -- the workbook names the services counted on the Summary only ====
// Brad, 27 Oct 2026: "Keep the band text navy; add the workbook note line". A service no sheet takes -- an estimate line, or a
// service in a position under the cycle, whose name no group holds (renamed in Setup, say) -- is counted on the Summary alone.
// The box always said so; the workbook carried none of the box's notes, so a service tab could print $0 controls with nothing to
// say why. fdcModel now carries the box's sentence (M.note, from fdcLoneSay) and fdcSheets writes it under the table on every
// sheet: merged across the table, italic, 10 pt, left and wrapped, the row as tall as the lines it wraps to (long unbroken
// names included, up to Excel's 409-point limit -- the review's page-1), a blank row on each side, the
// footer last. With no such service there is no note and nothing moves: the model has no note key, and fdcSheets writes what
// v2.10's wrote for the same model, read from git (b2cb041). Every expectation is typed from the fixture's literals.
// FAILS ON b2cb041 (v2.10) on every note check; the no-note checks pass there by construction (CONTROLs).
{
  const name = 'v2.11 — the FYDP Disconnects workbook says, under every sheet’s table, which services are counted on the Summary only';
  try {
    const J = JSON.stringify;
    const E = (ev, code) => { try { return ev(code); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 160); } };
    const parse = s => { try { return JSON.parse(s); } catch { return null; } };
    const SV = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'], YRS = [2027, 2028, 2029, 2030, 2031, 2032], APS = ['om', 'ff', 'sp'];
    const SHEETS = ['Summary', 'USAF', 'STOVL', 'USMC CV', 'USN CV'];
    const linesOf = extra => { const L = [];
      APS.forEach((ap, a) => SV.forEach((sv, s) => { const v = {}; YRS.forEach(y => { v[y] = (a + 1) * 1e9 + (s + 1) * 1e7 + (y - 2020) * 1e5; }); L.push({ ap, pmo: 'AV', svc: sv, v }); }));
      if (extra) { const v = {}; YRS.forEach(y => { v[y] = 3e6 + y; }); L.push({ ap: 'om', pmo: 'AV', svc: 'XSVC', v }); }
      return L; };
    const posOf = (list, a) => { const P = { v: 2, split: true, lines: {}, val: {} };
      list.forEach((sv, s) => { P.lines[sv] = [{ k: '_all', all: true }]; P.val[sv] = { _all: {} };
        YRS.forEach(y => { P.val[sv]._all[y] = { d: (a + 1) * 2e8 + (s + 1) * 3e6 + (y - 2020) * 1e4, m: (s + 1) * 1e5 + a * 1e3 }; }); });
      return P; };
    const store = P => J({ base: 2028, cur: 2028, ts: 5, years: {}, order: [], ppbe: { 'BES|2028': P } });
    // a board with O&M on screen and Full Fund and Spares in this browser; `lone` adds a service in no group to each source
    const board = lone => {
      const B = boot();
      seed(B.ev, { services: SV, items: [], disc: SV.map(() => 0), mand: SV.map(() => 0), order: [] });
      const SETS = { '2025ACE': { label: '2025ACE', ts: 2000, years: YRS.slice(), lines: linesOf(lone), appn: {}, skip: {} } };
      const P = { om: posOf(lone ? SV.concat(['F-35B']) : SV, 0), ff: posOf(lone ? SV.concat(['NAVY-X']) : SV, 1), sp: posOf(lone ? SV.concat(['USMC STOVL']) : SV, 2) };
      E(B.ev, `ACEDB.sets=${J(SETS)}; ACEDB.ts=4000; MS.ppbe={'BES|2028':${J(P.om)}}; MS.cycle='BES|2028';
        localStorage.setItem(_SLUGMAP.ff.key, ${J(store(P.ff))}); localStorage.setItem(_SLUGMAP.sp.key, ${J(store(P.sp))}); render(); 'ok'`);
      return B;
    };
    // the sentence, from the fixture: the estimate's line first, then each appropriation's position in the box's order
    const NOTE = 'Counted on the Summary only, on no service sheet: XSVC (2025 ACE); F-35B (O&M BES28); NAVY-X (Full Fund BES28); USMC STOVL (Initial Spares BES28).';
    const HT = 28;   // it wraps to two lines at about 120 characters, 14 pt a line
    // the workbook Export writes, read the way another program reads it: unzipped from the bytes, every part parsed, every row's
    // cells, merges and height, and the look of the cell that holds the note
    const book = B => parse(E(B.ev, `(function(){ var u=null, oB=window.buildXlsx, oC=HTMLAnchorElement.prototype.click;
      window.buildXlsx=function(s, x, o){ u=oB(s, x, o); return u; }; HTMLAnchorElement.prototype.click=function(){};
      try{ exportFdc(); } finally { window.buildXlsx=oB; HTMLAnchorElement.prototype.click=oC; }
      if(!u) return JSON.stringify({err:'no workbook'});
      var dv=new DataView(u.buffer, u.byteOffset, u.byteLength), at=0, td=new TextDecoder(), parts={};
      while(at+30<=u.length && dv.getUint32(at,true)===0x04034b50){ var sz=dv.getUint32(at+18,true), nl=dv.getUint16(at+26,true), xl=dv.getUint16(at+28,true);
        parts[td.decode(u.subarray(at+30,at+30+nl))]=td.decode(u.subarray(at+30+nl+xl,at+30+nl+xl+sz)); at+=30+nl+xl+sz; }
      var P=function(t){ return new DOMParser().parseFromString(t,'application/xml'); }, A=function(x){ return [].slice.call(x||[]); };
      var bad=Object.keys(parts).filter(function(k){ return /\\.xml$|\\.rels$/.test(k) && P(parts[k]).getElementsByTagName('parsererror').length; });
      var st=P(parts['xl/styles.xml']);
      var fonts=A(st.getElementsByTagName('fonts')[0].children).map(function(f){ var g=function(t){ return f.getElementsByTagName(t)[0]; };
        return {i:g('i')?1:0, b:g('b')?1:0, sz:g('sz')? +g('sz').getAttribute('val') : null, name:g('name')? g('name').getAttribute('val') : null}; });
      var xfs=A(st.getElementsByTagName('cellXfs')[0].children).map(function(x){ var a=x.getElementsByTagName('alignment')[0];
        return {font:fonts[+(x.getAttribute('fontId')||0)], h:a? a.getAttribute('horizontal') : null, wrap:a? a.getAttribute('wrapText') : null}; });
      var names=A(P(parts['xl/workbook.xml']).getElementsByTagName('sheet')).map(function(s){ return s.getAttribute('name'); });
      var sheets=names.map(function(nm, k){ var d=P(parts['xl/worksheets/sheet'+(k+1)+'.xml']);
        var rows=A(d.getElementsByTagName('row')).map(function(r){ return {r:+r.getAttribute('r'), ht:r.getAttribute('ht'), cells:A(r.getElementsByTagName('c')).map(function(c){
          var t=A(c.getElementsByTagName('t')).map(function(e){ return e.textContent; }).join(''), v=c.getElementsByTagName('v')[0];
          return {ref:c.getAttribute('r'), s:+(c.getAttribute('s')||0), text: t || (v? v.textContent : '')}; })}; });
        var merges=A(d.getElementsByTagName('mergeCell')).map(function(m){ return m.getAttribute('ref'); });
        return {name:nm, rows:rows, merges:merges}; });
      return JSON.stringify({bad:bad, xfs:xfs, sheets:sheets}); })()`));
    // ---- a service in no group, in every source: the model, the box and every sheet of the workbook say so ------------------
    const B = board(true);
    const M = parse(E(B.ev, `JSON.stringify(fdcModel({ace:'2025ACE', cyc:'BES|2028'}))`)) || {};
    chk(name, 'the model', 'the model carries the box’s sentence, naming every service no sheet takes and where it came from', M.note, NOTE);
    E(B.ev, `if(!fdcOpen) toggleFdc(); 'ok'`);
    chk(name, 'the box', 'the box says the same sentence, once',
      E(B.ev, `JSON.stringify([].map.call(document.querySelectorAll('#fdcBody .fdcnote'), function(n){ return n.textContent; }).filter(function(t){ return /Summary only/.test(t); }))`),
      J(['⚠ ' + NOTE]));
    E(B.ev, `toggleFdc(); 'ok'`);
    const W = book(B) || { sheets: [], xfs: [], bad: ['no workbook'] };
    chk(name, 'the workbook', 'every part parses, and the five sheets are there in order (CONTROL)', J([W.bad, W.sheets.map(s => s.name)]), J([[], SHEETS]));
    SHEETS.forEach(sn => {
      const sh = W.sheets.filter(s => s.name === sn)[0] || { rows: [], merges: [] };
      const hits = sh.rows.filter(r => r.cells.some(c => c.text === NOTE));
      const nr = hits.length ? hits[0] : { r: -1, cells: [] };
      const last = sh.rows[sh.rows.length - 1] || { r: 0, cells: [] };
      const at = r => sh.rows.filter(x => x.r === r)[0] || { cells: [] };
      const nc = nr.cells.filter(c => c.text === NOTE)[0] || { ref: '', s: -1 };
      const look = W.xfs[nc.s] || { font: {} };
      chk(name, 'the workbook · ' + sn, 'the note is written once, in column A, as the box words it', J([hits.length, nc.ref]), J([1, 'A' + nr.r]));
      chk(name, 'the workbook · ' + sn, 'merged across the table (A to H: the label, six years and the FYDP total)', sh.merges.includes('A' + nr.r + ':H' + nr.r), true);
      chk(name, 'the workbook · ' + sn, 'italic Arial 10 pt, left and wrapped, the row as tall as its lines',
        J([look.font.i, look.font.sz, look.font.name, look.h, look.wrap, +nr.ht]), J([1, 10, 'Arial', 'left', '1', HT]));
      chk(name, 'the workbook · ' + sn, 'under the table: a blank row above it, a blank row below it, then the footer row with the marking, last',
        J([at(nr.r - 1).cells.length, at(nr.r + 1).cells.length, last.r, last.cells.map(c => c.text)]),
        J([0, 0, nr.r + 2, [(M.footer || ''), 'CUI//REL TO US DoW']]));
    });
    // ---- long unbroken names (v2.11 review, page-1): the row is as tall as the lines the note WRAPS to ----------------------
    // Each name is one 61-character word, so a line holds one name and its place: seven names wrap to seven lines (98 pt),
    // where the note's length alone said five (70 pt) and LibreOffice cut its first and last lines. Forty wrap to forty, which
    // Excel's 409-point row limit holds (the length alone said 364).
    const longName = i => 'LONG' + String(i).padStart(2, '0') + 'X'.repeat(55);
    [[7, 98], [40, 409]].forEach(([k, ht]) => {
      const LB = boot();
      seed(LB.ev, { services: SV, items: [], disc: SV.map(() => 0), mand: SV.map(() => 0), order: [] });
      const names = Array.from({ length: k }, (_, i) => longName(i));
      E(LB.ev, `ACEDB.sets=${J({ '2025ACE': { label: '2025ACE', ts: 2000, years: YRS.slice(), lines: linesOf(false), appn: {}, skip: {} } })}; ACEDB.ts=4000;
        MS.ppbe={'BES|2028':${J(posOf(SV.concat(names), 0))}}; MS.cycle='BES|2028';
        localStorage.setItem(_SLUGMAP.ff.key, ${J(store(posOf(SV, 1)))}); localStorage.setItem(_SLUGMAP.sp.key, ${J(store(posOf(SV, 2)))}); render(); 'ok'`);
      const want = 'Counted on the Summary only, on no service sheet: ' + names.map(n => n + ' (O&M BES28)').join('; ') + '.';
      const LW = book(LB) || { sheets: [] };
      const got = SHEETS.map(sn => { const sh = LW.sheets.filter(x => x.name === sn)[0] || { rows: [] };
        const r = sh.rows.filter(x => x.cells.some(c => c.text === want))[0]; return r ? +r.ht : null; });
      chk(name, 'long names · ' + k, 'every sheet carries the note whole, its row ' + ht + ' pt: the lines it wraps to' + (ht === 409 ? ', held at Excel’s 409-point limit' : ''),
        J(got), J(SHEETS.map(() => ht)));
    });
    // a word longer than a line takes the lines it needs: an estimate line's service is read from a workbook cell, and a
    // 250-character one is two full lines and part of a third -- four with the words around it (56 pt), never three (42)
    {
      const LB = boot(), big = 'LONG' + 'X'.repeat(246);
      seed(LB.ev, { services: SV, items: [], disc: SV.map(() => 0), mand: SV.map(() => 0), order: [] });
      const lines = linesOf(false); { const v = {}; YRS.forEach(y => { v[y] = 4e6 + y; }); lines.push({ ap: 'om', pmo: 'AV', svc: big, v }); }
      E(LB.ev, `ACEDB.sets=${J({ '2025ACE': { label: '2025ACE', ts: 2000, years: YRS.slice(), lines, appn: {}, skip: {} } })}; ACEDB.ts=4000;
        MS.ppbe={'BES|2028':${J(posOf(SV, 0))}}; MS.cycle='BES|2028';
        localStorage.setItem(_SLUGMAP.ff.key, ${J(store(posOf(SV, 1)))}); localStorage.setItem(_SLUGMAP.sp.key, ${J(store(posOf(SV, 2)))}); render(); 'ok'`);
      const want = 'Counted on the Summary only, on no service sheet: ' + big + ' (2025 ACE).';
      const LW = book(LB) || { sheets: [] };
      chk(name, 'a word longer than a line', 'a 250-character service name: the note’s row is 56 pt on every sheet (four lines)',
        J(SHEETS.map(sn => { const sh = LW.sheets.filter(x => x.name === sn)[0] || { rows: [] }; const r = sh.rows.filter(x => x.cells.some(c => c.text === want))[0]; return r ? +r.ht : null; })),
        J(SHEETS.map(() => 56)));
    }
    // ---- no service outside the groups: no note, and the workbook is v2.10's -----------------------------------------------
    const N = board(false);
    const MN = E(N.ev, `JSON.stringify(fdcModel({ace:'2025ACE', cyc:'BES|2028'}))`);
    chk(name, 'nothing ungrouped', 'the model has no note at all (a CONTROL on the fixture: every service is in a group)', Object.prototype.hasOwnProperty.call(parse(MN) || {}, 'note'), false);
    E(N.ev, `if(!fdcOpen) toggleFdc(); 'ok'`);
    chk(name, 'nothing ungrouped', 'and the box names no service counted on the Summary only',
      E(N.ev, `[].filter.call(document.querySelectorAll('#fdcBody .fdcnote'), function(n){ return /Summary only/.test(n.textContent); }).length`), 0);
    E(N.ev, `toggleFdc(); 'ok'`);
    const WN = book(N) || { sheets: [] };
    chk(name, 'nothing ungrouped', 'no sheet of the workbook carries the sentence, and each ends on its footer row two below the table',
      J(WN.sheets.map(s => s.rows.some(r => r.cells.some(c => /Summary only/.test(c.text))))), J(SHEETS.map(() => false)));
    // the same model through v2.10's own fdcSheets (git b2cb041): what it writes is what this board writes
    const { execFileSync } = await import('node:child_process');
    const root = _selfPath(new URL('../..', import.meta.url));
    let v210 = null;
    try { v210 = execFileSync('git', ['-C', root, 'show', 'b2cb041:prioritization-board-grid.html'], { encoding: 'utf8', maxBuffer: 64 << 20 }); }
    catch (e) { failures.push({ scenario: name, where: 'nothing ungrouped', what: 'v2.10’s board could not be read from git (a shallow clone? git fetch --unshallow): ' + String((e && e.message) || e).slice(0, 120), got: 'unread', want: 'read' }); }
    if (v210) {
      const O = boot({ html: v210 });
      chk(name, 'nothing ungrouped', 'the board read from git is v2.10 (a CONTROL)', O.ev('BUILD'), 'v2.10 (27 Oct 2026)');
      const mine = E(N.ev, `JSON.stringify(fdcSheets(${MN}))`), theirs = E(O.ev, `JSON.stringify(fdcSheets(${MN}))`);
      chk(name, 'nothing ungrouped', 'fdcSheets writes, for a model with no note, exactly what v2.10’s fdcSheets wrote: every row, merge, height and style',
        mine === theirs && mine.length > 1000, true);
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ==== end v2.11 ====

// ==== v2.12 W1 (item 132): the ACE import by its header titles, the WBS tree, PSM inside Air Vehicle ====
// v2.12 W1 (item 132; Brad, 28 Oct 2026): THE COST ESTIMATE IS READ BY ITS HEADER TITLES, ON ANY SHEET. A workbook shaped like the
// 2026 file is built by the board's own writer: a Cover sheet first, then PMO Database Output with a title line, a blank row and
// the titles on row 3, in the 2026 order (the WBS in Z, Level in AA, CES1 from AB), columns ORBIT does not read among them and one
// inserted, a Notes sheet whose few titles must lose to the real header, and a row of every kind the import leaves out, each with
// dollars that differ by row and year. Every expectation is typed here from the fixture -- the reason each row should land in, the
// lines, the tree, the dollars by reason by year -- never read back out of the board; and the conservation the report states is
// checked against the sheet's own dollars, added up here. Then the mapping box: two titles renamed, asked once, Cancel and an
// unanswered field importing nothing, the answers used and remembered for the same layout, and asked again for another. Then the
// refusals (an .xlsb by name and by its contents, a file with no then-year row, a sheet with no titles), the report box as drawn,
// the Data card's item, and PSM inside Air Vehicle: every estimate's default, and a stored {} on a 2026 estimate replaced on
// opening and said once. FAILS ON d732259 (the slot commit), which reads fixed positions off the first sheet: every import is
// "nothing matched the expected columns", and its alignment for a 2026 estimate is {}.
{
  const name = 'v2.12 W1 — the cost estimate is read by its header titles on any sheet: every row kept or left out with its reason and dollars, the WBS tree, the mapping box, the report';
  try {
    const J = JSON.stringify;
    const E = (ev, code) => { try { return ev(code); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 160); } };
    const parse = s => { try { return JSON.parse(s); } catch { return null; } };
    // Three titles spelled as a person might type them -- 'PALS / O&S', 'Rollup Value' (no question mark), 'JPO-managed': a title is
    // matched with case, spaces and punctuation taken out, so each is the field it names
    const HDR = ['Index', 'Sub Index', 'PALS / O&S', '$ Type', 'US/PTN/FMS', 'Service', 'T/M/S', 'Rollup Value', 'JPO-managed', 'Shared/Unique',
      'Share Type', 'Cost Allocation Rule', 'Primary Requirement Driver', 'Govt/LM/PW', 'Labor/Material', 'Contract Requirement', 'Bi/Multilat',
      'Budget Element (US Only)', 'Appropriation (US Only)', 'Support Line Category', 'CCAR Element', 'CCAR Budget', 'CCAR Description', 'PMO',
      'Owning IPT', 'Work Breakdown Structure', 'Level', 'CES1', 'CES2', 'CES3', 'CES4', 'CES5', 'CES6', 'CES7', 'CES8',
      2024, 2025, 2026, 2027, 2028, 'Comments'];
    const YRS = [2024, 2025, 2026, 2027, 2028];
    const OM = ['Unit-Level Manpower', 'Unit-Level Maintenance', 'Organizational Maintenance'];
    const DS = ['Depot Standup', 'CONUS Depot Standup'];
    // Each row: what the file says (defaults: O&S, TY$, US, USAF F-35A, not a rollup, JPO managed, O&M, Air Vehicle), its dollars
    // (d: whole dollars, written into the sheet in $M; raw: a cell written as text), and what the import must do with it: `why`
    // the reason it is left out, or `x` the line it is kept as; `note` the reasons it is kept and named.
    const R = [
      { wbs: '1.2.1.1', ces: OM.concat(['Officer']), d: { 2027: 1234567, 2028: -250000 }, raw: { 2028: '(0.25)' }, ccar: 'JSF5594', cdesc: 'Sustainment ops',
        x: { ap: 'om', pmo: 'AV', svc: 'USAF', ce: '' } },
      { wbs: '1.2.1.2', ces: OM.concat(['Enlisted']), svc: 'ANG', pmo: 'Propulsion', d: { 2027: 2500000, 2028: 100001 }, x: { ap: 'om', pmo: 'PP', svc: 'ANG', ce: '' } },
      { wbs: '1.2.2', ces: [OM[0], OM[1], 'Intermediate Maintenance'], svc: 'USMC', tms: 'F-35B', pmo: 'Training Systems & Simulation', d: { 2027: 750003 },
        x: { ap: 'om', pmo: 'TSS', svc: 'STOVL', ce: '' } },
      // a name conflict: 1.2 named "Unit Level Maint." here, "Unit-Level Maintenance" first
      { wbs: '1.2.1.3', ces: [OM[0], 'Unit Level Maint.', OM[2], 'Civilian'], svc: 'USN', tms: 'F-35C', d: { 2027: 333004 }, x: { ap: 'om', pmo: 'AV', svc: 'USN', ce: '' } },
      // the Level is not the paragraph's depth: kept, named
      { wbs: '1.3.1', lv: 4, ces: [OM[0], 'Contractor Support', 'Field Service'], svc: 'AFRC', d: { 2027: 400005, 2026: 12345 }, note: ['level'],
        x: { ap: 'om', pmo: 'AV', svc: 'AFRC', ce: '' } },
      // an O&S paragraph starting with P: kept, named
      { wbs: 'P1.4', ces: ['Pseudo PALS', 'Mislettered'], d: { 2027: 600006 }, note: ['p'], x: { ap: 'om', pmo: 'AV', svc: 'USAF', ce: '' } },
      // a paragraph with no dollar: in the tree, no line
      { wbs: '1.2.1.4', ces: OM.concat(['Reserve']), d: {}, zero: true, x: { ap: 'om' } },
      // kept with no WBS: named
      { wbs: '', lv: '', ces: [], d: { 2027: 50007 }, note: ['nowbs'], x: { ap: 'om', pmo: 'AV', svc: 'USAF', ce: '' } },
      // Initial Spares, a PALS paragraph that does not start with P: kept, named
      { wbs: '7.1', pals: 'PALS', slc: 'Initial Spares', appus: 'Procurement', ces: ['Spares', 'Initial'], d: { 2027: 900008 }, note: ['p'], x: { ap: 'sp', pmo: 'AV', svc: 'USAF', ce: '' } },
      // Full Fund: Depot Activation of every kind, and the E breakouts
      // the E breakout comes first in the file: its heading is judged against the name its UNSUFFIXED twin gives P6.2.2, read first
      { wbs: 'P6.2.2.1E', pals: 'PALS', slc: 'Depot Activation', appus: 'Procurement', pmo: 'Propulsion', ces: DS.concat(['ECU Propulsion', 'Engine shop ECU']), d: { 2027: 450011 },
        x: { ap: 'ff', pmo: 'PP', svc: 'USAF', ce: 'Depot Standup Propulsion' } },
      { wbs: 'P6.2.2.1', pals: 'PALS', slc: 'Depot Activation', appus: 'Procurement', pmo: 'Propulsion', ces: DS.concat(['Propulsion', 'Engine shop']), d: { 2027: 1100009, 2028: 1200010 },
        x: { ap: 'ff', pmo: 'PP', svc: 'USAF', ce: 'Depot Standup Propulsion' } },
      { wbs: 'P6.3.2', pals: 'PALS', slc: 'Depot Activation', appus: 'Procurement', pmo: 'Air Vehicle', ces: ['Depot Standup', 'Software Depot Standup', 'Propulsion'], d: { 2027: 220012 },
        x: { ap: 'ff', pmo: 'AV', svc: 'USAF', ce: 'Depot Standup Software' } },
      { wbs: 'P6.3.2E', pals: 'PALS', slc: 'Depot Activation', appus: 'Procurement', pmo: 'Combat Data Systems', ces: ['Depot Standup', 'Software Depot Standup', 'ECU Propulsion'], d: { 2027: 230013 },
        x: { ap: 'ff', pmo: 'CDS', svc: 'USAF', ce: 'Depot Standup Software' } },
      { wbs: 'P6.5.1.2E', pals: 'PALS', slc: 'Depot Activation', appus: 'Procurement', pmo: 'Air Vehicle', ces: ['Depot Standup', 'Government Depot', 'Government', 'Gov line E'], d: { 2027: 300014 },
        x: { ap: 'ff', pmo: 'AV', svc: 'USAF', ce: 'Depot Standup Air Vehicle' } },
      { wbs: 'P6.5.1.2', pals: 'PALS', slc: 'Depot Activation', appus: 'Procurement', pmo: 'Air Vehicle', ces: ['Depot Standup', 'Government Depot', 'Government', 'Gov line'], d: { 2027: 200015 },
        x: { ap: 'ff', pmo: 'AV', svc: 'USAF', ce: 'Depot Standup Air Vehicle' } },
      { wbs: 'P6.6.1', pals: 'PALS', slc: 'Depot Activation', appus: 'Procurement', pmo: 'Maintenance Systems', ces: ['Depot Standup', 'Other Depot', 'Unsettled'], d: { 2027: 170016 }, note: ['depot'],
        x: { ap: 'ff', pmo: 'MxS', svc: 'USAF', ce: '' } },
      { wbs: 'P2.1.1', pals: 'PALS', slc: 'PEC TRNG EQ (Full Mission Sims)', appus: 'Procurement', pmo: 'Training Systems & Simulation', ces: ['Training', 'Simulators', 'FMS sims'],
        d: { 2027: 810017 }, x: { ap: 'ff', pmo: 'TSS', svc: 'USAF', ce: 'Full Mission Simulators' } },
      { wbs: 'P3.1', pals: 'PALS', slc: 'Pubs / Tech Data', appus: 'Procurement', pmo: 'PO&A', ces: ['Data', 'Tech data'], d: { 2027: 64018 },
        x: { ap: 'ff', pmo: 'BOP', svc: 'USAF', ce: 'Pubs/Tech Data' } },
      { wbs: 'P3.2', pals: 'PALS', slc: 'Other ILS', appus: 'Procurement', pmo: 'Non-PMO', ces: ['Data', 'Other ILS'], d: { 2027: 77019 },
        x: { ap: 'ff', pmo: 'Non-PMO', svc: 'USAF', ce: 'Other ILS Production' } },
      { wbs: 'P9.1', pals: 'PALS', slc: 'Other Proc (OPN)', appus: 'Procurement', ces: ['Other Proc', 'Support equipment'], d: { 2027: 91020 },
        x: { ap: 'opn', pmo: 'AV', svc: 'USAF', ce: '' } },
      // left out, one of every kind, each with its own dollars
      { wbs: '1.5.1', dt: 'CY$', ces: [OM[0], 'x', 'y'], d: { 2027: 5000021 }, why: 'dtype' },
      { wbs: '1.5.2', dt: 'BY$', ces: [OM[0], 'x', 'z'], d: { 2028: 1000022 }, why: 'dtype' },
      { wbs: '1.2', roll: 'Yes', ces: OM.slice(0, 2), d: { 2027: 3734567 }, why: 'rollup' },
      { wbs: '1.9', slc: '', ces: [OM[0], 'Summary'], d: { 2027: 9000023 }, why: 'blank' },
      { wbs: '1.6.1', appus: 'MILPERS', ces: [OM[0], 'm', 'n'], d: { 2027: 2200024 }, why: 'milpers' },
      { wbs: '1.6.2', us: 'PTN', ces: [OM[0], 'm', 'p'], d: { 2027: 1700025 }, why: 'partner' },
      { wbs: '1.6.3', us: 'FMS', ces: [OM[0], 'm', 'q'], d: { 2028: 800026 }, why: 'partner' },
      { wbs: '1.6.4', jpo: 'No', ces: [OM[0], 'm', 'r'], d: { 2027: 600027 }, why: 'jpo' },
      { wbs: '1.7.1', pmo: 'Service Mgd', ces: [OM[0], 's', 't'], d: { 2027: 4400028, 2028: 4500029 }, why: 'svcmgd' },
      { wbs: '1.7.2', pmo: 'Owning IPT X', ces: [OM[0], 's', 'u'], d: { 2027: 110030 }, why: 'pmo' },
      { wbs: 'P8.1', pals: 'PALS', slc: 'Modifications', appus: 'Procurement', ces: ['Mods', 'm'], d: { 2027: 220031 }, why: 'slc' },
      { wbs: 'P8.2', slc: 'Airframe PGSE', ces: ['PGSE', 'm'], d: { 2027: 330032 }, why: 'pals' },
      { wbs: '1.8.1', pals: 'PALS', ces: [OM[0], 'v', 'w'], d: { 2028: 440033 }, why: 'pals' },
      { wbs: '1.8.2', svc: 'USMC', tms: 'F-35A', ces: [OM[0], 'v', 'x'], d: { 2027: 550034 }, why: 'svc' },
      // not data: no WBS and no dollar (formatting between the rows)
      { wbs: '', lv: '', ces: [], d: {}, notData: true, idx: '' }
    ];
    const MUL = 1e6;
    const rowOf = (o, i, hdr) => { const r = hdr.map(() => '');
      const AKA = { 'PALS/O&S': 'PALS / O&S', 'Rollup Value?': 'Rollup Value', 'JPO Managed': 'JPO-managed' };
      const put = (t, v) => { let j = hdr.indexOf(t); if (j < 0 && AKA[t]) j = hdr.indexOf(AKA[t]); if (j >= 0) r[j] = v; };
      put('Index', o.idx !== undefined ? o.idx : i + 1); put('PALS/O&S', o.pals || 'O&S'); put('$ Type', o.dt || 'TY$'); put('US/PTN/FMS', o.us || 'US');
      put('Service', o.svc || 'USAF'); put('T/M/S', o.tms || 'F-35A'); put('Rollup Value?', o.roll || 'No'); put('JPO Managed', o.jpo || 'Yes');
      put('Appropriation (US Only)', o.appus || 'O&M'); put('Support Line Category', o.slc === undefined ? 'O&S' : o.slc);
      put('CCAR Element', o.ccar || ''); put('CCAR Description', o.cdesc || ''); put('PMO', o.pmo || 'Air Vehicle'); put('Owning IPT', 'IPT ' + i);
      put('Cost Allocation Rule', 'rule ' + i); put('Work Breakdown Structure', o.wbs);
      put('Level', o.lv !== undefined ? o.lv : (o.wbs ? o.wbs.split('.').length : ''));
      (o.ces || []).forEach((n, k) => put('CES' + (k + 1), n));
      YRS.forEach(y => { if (o.raw && o.raw[y] !== undefined) put(y, o.raw[y]); else if (o.d[y] !== undefined) put(y, o.d[y] / MUL); });
      put('Comments', 'note ' + i);
      if (o.notData) { r.fill(''); r[hdr.indexOf('Comments')] = 'section break'; }
      return r; };
    // `shown` is the header as the file titles it: the rows are laid out by HDR's columns, so a renamed title moves nothing else
    const book = (hdr, rows, shown) => [
      { name: 'Cover', rows: [['2026 SUST ACE COMPLETE'], ['Detail file'], ['Service', 'PMO', 'Level']] },
      { name: 'PMO Database Output', rows: [['PMO Database Output — FY26 estimate, then-year $M'], []].concat([shown || hdr], rows.map((o, i) => rowOf(o, i, hdr))) },
      { name: 'Notes', rows: [['Service', 'PMO', 'Level', 'CES1', 'Work Breakdown Structure'], ['USAF', 'Air Vehicle', 3, 'x', '1.1']] }];
    const imp = async (B, sheets, file) => { await B.ev(`importAce({files:[__wb(${J(sheets)}, ${J(file)})], value:''})`); await new Promise(r => setTimeout(r, 30)); };
    const mkBoard = () => { const B = boot();
      seed(B.ev, { services: ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'], items: [], disc: [0, 0, 0, 0, 0, 0], mand: [0, 0, 0, 0, 0, 0], order: [] });
      E(B.ev, `globalThis.__wb=function(sheets, name){ const b=buildXlsx(sheets); return {name:name, arrayBuffer: async function(){ return b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength); }}; }; 'ok'`);
      return B; };

    // ---- the expectations, from the fixture alone
    const sumV = (rs) => { const o = {}; rs.forEach(x => YRS.forEach(y => { if (x.d[y]) o[y] = (o[y] || 0) + x.d[y]; })); return o; };
    const data = R.filter(o => !o.notData), keptR = data.filter(o => !o.why), outR = data.filter(o => o.why);
    const WHY = ['dtype', 'rollup', 'blank', 'milpers', 'partner', 'jpo', 'svcmgd', 'pmo', 'slc', 'pals', 'svc'];
    const NAMED_OUT = ['blank', 'pmo', 'slc', 'pals', 'svc'];
    const rowNoOf = o => R.indexOf(o) + 4;           // the titles on row 3, the first data row is row 4
    const wantLines = keptR.filter(o => !o.zero).map(o => [o.x.ap, o.x.pmo, o.x.svc, o.wbs.toUpperCase(), o.wbs ? o.wbs.split('.').length : 0, o.x.ce,
      o.slc === undefined ? 'O&S' : o.slc, o.ccar || '', o.cdesc || '', o.d]);
    const wantReasons = {}; WHY.forEach(k => { const rs = outR.filter(o => o.why === k); if (rs.length) wantReasons[k] = { rows: rs.length, v: sumV(rs) }; });
    const wantNamed = [];
    data.forEach(o => { if (o.why && NAMED_OUT.indexOf(o.why) >= 0) wantNamed.push([o.why, rowNoOf(o)]);
      (o.note || []).forEach(k => wantNamed.push([k, rowNoOf(o)])); });
    wantNamed.sort((a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : 1));
    const node = (n, lv, up) => ({ n, lv, up });
    const wantTree = {
      om: { '1': node(OM[0], 1, ''), '1.2': node(OM[1], 2, '1'), '1.2.1': node(OM[2], 3, '1.2'), '1.2.1.1': node('Officer', 4, '1.2.1'),
        '1.2.1.2': node('Enlisted', 4, '1.2.1'), '1.2.2': node('Intermediate Maintenance', 3, '1.2'), '1.2.1.3': node('Civilian', 4, '1.2.1'),
        '1.3': node('Contractor Support', 2, '1'), '1.3.1': node('Field Service', 3, '1.3'), 'P1': node('Pseudo PALS', 1, ''), 'P1.4': node('Mislettered', 2, 'P1'),
        '1.2.1.4': node('Reserve', 4, '1.2.1') },
      sp: { '7': node('Spares', 1, ''), '7.1': node('Initial', 2, '7') },
      ff: { 'P6': node('Depot Standup', 1, ''), 'P6.2': node('CONUS Depot Standup', 2, 'P6'), 'P6.2.2': node('Propulsion', 3, 'P6.2'), 'P6.2.2.1': node('Engine shop', 4, 'P6.2.2'),
        'P6.3': node('Software Depot Standup', 2, 'P6'), 'P6.3.2': node('Propulsion', 3, 'P6.3'), 'P6.5': node('Government Depot', 2, 'P6'),
        'P6.5.1': node('Government', 3, 'P6.5'), 'P6.5.1.2': node('Gov line', 4, 'P6.5.1'), 'P6.6': node('Other Depot', 2, 'P6'), 'P6.6.1': node('Unsettled', 3, 'P6.6'),
        'P2': node('Training', 1, ''), 'P2.1': node('Simulators', 2, 'P2'), 'P2.1.1': node('FMS sims', 3, 'P2.1'), 'P3': node('Data', 1, ''), 'P3.1': node('Tech data', 2, 'P3'),
        'P3.2': node('Other ILS', 2, 'P3'),
        // the breakouts: a heading takes the suffix only where its CES name differs from the unsuffixed heading's
        'P6.2.2E': node('ECU Propulsion', 3, 'P6.2'), 'P6.2.2.1E': node('Engine shop ECU', 4, 'P6.2.2E'),
        'P6.3.2E': node('ECU Propulsion', 3, 'P6.3'), 'P6.5.1.2E': node('Gov line E', 4, 'P6.5.1') },
      opn: { 'P9': node('Other Proc', 1, ''), 'P9.1': node('Support equipment', 2, 'P9') } };
    const sortTree = T => { const o = {}; Object.keys(T || {}).sort().forEach(ap => { o[ap] = {}; Object.keys(T[ap]).sort().forEach(c => { o[ap][c] = T[ap][c]; }); }); return o; };

    chk(name, 'fixture', 'CONTROL — the dollars differ by row and by year, so a row counted under the wrong reason, or twice, moves a total',
      (() => { const v = []; data.forEach(o => YRS.forEach(y => { if (o.d[y]) v.push(Math.abs(o.d[y])); })); return new Set(v).size === v.length && v.length > 30; })(), true);
    chk(name, 'fixture', 'CONTROL — the header is on row 3 of the second sheet, with the WBS in Z, Level in AA and CES1 in AB, as the 2026 file',
      [HDR.indexOf('Work Breakdown Structure'), HDR.indexOf('Level'), HDR.indexOf('CES1')].join(','), '25,26,27');

    // ---- 1. the import, straight through
    const B = mkBoard();
    await imp(B, book(HDR, R), '2026 SUST ACE COMPLETE Detail File.xlsx');
    const set = parse(E(B.ev, `JSON.stringify(ACEDB.sets['2026ACE']||null)`)) || {};
    const rep = set.rep || {};
    chk(name, 'header', 'filed as 2026ACE: the year, then ACE anywhere after it in the file name', E(B.ev, `JSON.stringify(Object.keys(ACEDB.sets))`), J(['2026ACE']));
    chk(name, 'header', 'it says which sheet and row it read its titles from: PMO Database Output, row 3 (not the Cover, not the Notes sheet)',
      J([rep.sheet, rep.row, rep.sheets]), J(['PMO Database Output', 3, ['Cover', 'PMO Database Output', 'Notes']]));
    chk(name, 'header', 'every column is found by its title wherever it sits: the WBS in Z, Level AA, CES1 AB, PMO X, Support Line Category T -- and PALS / O&S, Rollup Value and JPO-managed by their titles as spelled',
      J(['wbs', 'lv', 'ces1', 'pmo', 'slc', 'roll', 'dtype', 'pals', 'jpo'].map(f => [(rep.map || {})[f] && rep.map[f].c, (rep.map || {})[f] && rep.map[f].how, (rep.map || {})[f] && rep.map[f].t])),
      J([['Z', 'title', 'Work Breakdown Structure'], ['AA', 'title', 'Level'], ['AB', 'title', 'CES1'], ['X', 'title', 'PMO'], ['T', 'title', 'Support Line Category'],
        ['H', 'title', 'Rollup Value'], ['D', 'title', '$ Type'], ['C', 'title', 'PALS / O&S'], ['I', 'title', 'JPO-managed']]));
    chk(name, 'header', 'every fiscal year column is read (a header that is a year)', J(set.years), J(YRS));
    const gotLines = (set.lines || []).map(l => [l.ap, l.pmo, l.svc, l.wbs, l.lv, l.ce, l.slc, l.ccar, l.cdesc, l.v]);
    chk(name, 'lines', 'every kept row with a dollar is a line, in file order: its appropriation and cost element by the Support Line Category (Depot Activation by CES2, then PMO), its office, service, paragraph, level, CCaR fields and whole dollars',
      J(gotLines), J(wantLines));
    chk(name, 'lines', 'every figure is a whole dollar, and (0.25) read as -$250,000', (set.lines || []).every(l => Object.keys(l.v).every(y => Number.isInteger(l.v[y])))
      + ' ' + ((set.lines || [])[0] || { v: {} }).v[2028], 'true -250000');
    chk(name, 'tree', 'the WBS tree: every paragraph with every heading above it, named by its CES columns, the E breakouts under their own heading only where the name differs',
      J(sortTree(set.wbs)), J(sortTree(wantTree)));
    chk(name, 'tree', 'the readers walk it: P6.2.2.1E is under ECU Propulsion, P6.5.1.2E under Government',
      E(B.ev, `JSON.stringify([aceWbsUp('2026ACE','ff','P6.2.2.1e'), aceWbsPath('2026ACE','ff','P6.2.2.1E'), aceWbsUp('2026ACE','ff','P6.5.1.2E')])`),
      J([['P6.2.2.1E', 'P6.2.2E', 'P6.2', 'P6'], 'Depot Standup › CONUS Depot Standup › ECU Propulsion › Engine shop ECU', ['P6.5.1.2E', 'P6.5.1', 'P6.5', 'P6']]));
    chk(name, 'conflicts', 'a paragraph two rows name differently keeps the first name and is named, with the row of the other',
      J((rep.conflicts || []).map(c => [c.ap, c.code, c.n, (c.also || []).map(a => [a.n, a.rows])])), J([['om', '1.2', OM[1], [['Unit Level Maint.', [rowNoOf(R[3])]]]]]));
    const gotReasons = {}; Object.keys(rep.reasons || {}).forEach(k => { gotReasons[k] = { rows: rep.reasons[k].rows, v: rep.reasons[k].v }; });
    chk(name, 'reasons', 'each reason in the contract’s order: its rows and its dollars by year, every reason the fixture plants', J(gotReasons), J(wantReasons));
    chk(name, 'reasons', 'the dollar types left out are named in the record, and each reason’s values as the file writes them', J([rep.types, ((rep.reasons || {}).pmo || {}).by, ((rep.reasons || {}).slc || {}).by]),
      J([[['CY$', 1], ['BY$', 1]], [['Owning IPT X', 1]], [['Modifications', 1]]]));
    chk(name, 'named', 'every named row, left out or kept: a blank category, an unknown PMO, category or service, PALS/O&S disagreeing, the P check, the Level check, an unsettled Depot Activation, no WBS',
      J((rep.named || []).map(n => [n.k, n.row]).sort((a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : 1))), J(wantNamed));
    chk(name, 'kept', 'kept: the rows the fixture keeps, the lines with a dollar, the paragraph with none, and their dollars by year',
      J([rep.kept && rep.kept.rows, rep.kept && rep.kept.lines, rep.kept && rep.kept.zero, rep.kept && rep.kept.v]), J([keptR.length, wantLines.length, 1, sumV(keptR)]));
    // CONSERVATION, TO THE DOLLAR: every dollar of the sheet (added up here, from the fixture) is kept or in exactly one reason
    const sheetV = sumV(data);
    chk(name, 'conservation', 'the sheet’s dollars, every year: the record’s total is the fixture’s, and the formatting row is not data', J([rep.total && rep.total.v, rep.total && rep.total.rows, rep.notData]), J([sheetV, data.length, 1]));
    chk(name, 'conservation', 'kept + every reason = the sheet, every year, to the dollar, and the report says it ties',
      J(YRS.filter(y => sheetV[y]).map(y => (rep.kept.v[y] || 0) + Object.keys(rep.reasons || {}).reduce((a, k) => a + (rep.reasons[k].v[y] || 0), 0))) + ' ' + rep.ties,
      J(YRS.filter(y => sheetV[y]).map(y => sheetV[y])) + ' true');
    chk(name, 'aggregates', 'the appropriation totals the Spruills read are the kept lines’ dollars', J(Object.keys(set.appn || {}).sort().map(ap => [ap, set.appn[ap].tot])),
      J(['ff', 'om', 'opn', 'sp'].map(ap => [ap, sumV(keptR.filter(o => o.x.ap === ap))])));
    // the report opens after the import, and its message says where it lives
    chk(name, 'report', 'the import report opens after the import (the Spruills does not), and the message points to it',
      E(B.ev, `[aceRepOpen, spOpen, document.getElementById('aceRepPanel').classList.contains('open'), /Data \\u203a Import report/.test(document.getElementById('shareStat').textContent)].join(',')`), 'true,false,true,true');
    const wantRowCells = k => { const x = wantReasons[k]; return [String(x.rows), '$' + (x.v[2027] || 0).toLocaleString('en-US'), '$' + Object.values(x.v).reduce((a, b) => a + b, 0).toLocaleString('en-US')]; };
    chk(name, 'report', 'the box draws each reason: its rows, the year on screen’s dollars and all years’',
      E(B.ev, `JSON.stringify(['svcmgd','dtype','blank'].map(function(k){ var tr=document.querySelector('#aceRepBody tr[data-why="'+k+'"]'); return tr? [].slice.call(tr.children,1).map(function(td){ return td.textContent; }) : null; }))`),
      J(['svcmgd', 'dtype', 'blank'].map(wantRowCells)));
    chk(name, 'report', 'and the named rows by row number, and the tree’s size by appropriation, and that it ties',
      E(B.ev, `JSON.stringify([[].slice.call(document.querySelectorAll('#aceRepBody .acerep-named[data-why="pmo"] tr td:first-child')).map(function(td){ return td.textContent; }),
        document.querySelector('#aceRepBody .acerep-tree').textContent.replace(/\\s+/g,' '), /\\u2713 Every dollar/.test(document.querySelector('#aceRepBody .acerep-ties').textContent)])`),
      J([[String(rowNoOf(R.find(o => o.why === 'pmo')))], 'WBS paragraphs, each with every heading above it and named from the CES columns: O&M 12 · Initial Spares 2 · Full Fund 21 · OPN 2.', true]));
    // the Data card's item reopens it, for the newest estimate
    E(B.ev, `aceRepClose(); 'ok'`);
    const subNow = E(B.ev, `(function(){ syncBtns(); var b=[].slice.call(document.querySelectorAll('#dd_data .mi')).find(function(x){ return /Import report/.test(x.textContent); });
        if(!b) return 'no item'; var sub=(b.querySelector('.sub')||{}).textContent||''; b.click(); return sub; })()`);
    await new Promise(r => setTimeout(r, 20));
    chk(name, 'report', 'the Data card offers it, says what the newest estimate kept and left out, and opens it',
      subNow + ' | ' + E(B.ev, `aceRepOpen+' '+aceRepK`), '2026ACE: ' + wantLines.length + ' lines kept · ' + outR.length + ' rows left out, with reasons | true 2026ACE');
    E(B.ev, `aceRepClose(); 'ok'`);
    // the Spruills' own Import Annual Cost Estimate… button is the real import (it only said the import was "staged here")
    chk(name, 'report', 'the Spruills’ Import Annual Cost Estimate… button opens the file picker the import reads',
      E(B.ev, `(function(){ spOpen=true; render(); var b=[].slice.call(document.querySelectorAll('#spBody button')).find(function(x){ return /Import Annual Cost Estimate/.test(x.textContent); });
        var oc=b? b.getAttribute('onclick') : 'no button'; spOpen=false; render(); return oc; })()`), "document.getElementById('aceFile').click()");

    // ---- 2. a title that has changed: asked once, in the mapping box; Cancel and an unanswered field import nothing
    const HDR2 = HDR.map(t => t === 'Rollup Value' ? 'Roll-up Flag' : (t === 'PALS / O&S' ? 'Account Family' : t));
    const B2 = mkBoard();
    const before = E(B2.ev, `JSON.stringify(ACEDB)`);
    await imp(B2, book(HDR, R, HDR2), '2026 ACE renamed.xlsx');
    chk(name, 'mapping box', 'a required title the file does not carry is asked about, in the box, listing the file’s own headers; nothing is stored yet',
      E(B2.ev, `JSON.stringify([aceColOpen, document.getElementById('aceColPanel').classList.contains('open'), [].slice.call(document.querySelectorAll('#aceColBody select')).map(function(s){ return s.id; }),
        [].slice.call((document.getElementById('aceCol_roll')||{options:[]}).options).map(function(o){ return o.textContent; }).filter(function(t){ return /Roll-up|Comments|— not/.test(t); }), JSON.stringify(ACEDB)===${J(before)}])`),
      J([true, true, ['aceCol_roll', 'aceCol_pals'], ['— not in this file —', 'H · Roll-up Flag', 'AO · Comments'], true]));
    E(B2.ev, `aceColCancel(); 'ok'`);
    chk(name, 'mapping box', 'Cancel imports nothing', E(B2.ev, `JSON.stringify([aceColOpen, JSON.stringify(ACEDB)===${J(before)}, /canceled/.test(document.getElementById('shareStat').textContent)])`), J([false, true, true]));
    await imp(B2, book(HDR, R, HDR2), '2026 ACE renamed.xlsx');
    E(B2.ev, `document.getElementById('aceCol_roll').value=String(${HDR2.indexOf('Roll-up Flag')}); document.querySelector('#aceColBody button.btn.pri').click(); 'ok'`);
    await new Promise(r => setTimeout(r, 30));
    chk(name, 'mapping box', 'a field still unanswered refuses the file, naming the field, and nothing is stored',
      E(B2.ev, `JSON.stringify([/PALS\\/O&S/.test(document.getElementById('shareStat').textContent), /failed/.test(document.getElementById('shareStat').textContent), JSON.stringify(ACEDB)===${J(before)}])`), J([true, true, true]));
    await imp(B2, book(HDR, R, HDR2), '2026 ACE renamed.xlsx');
    E(B2.ev, `document.getElementById('aceCol_roll').value=String(${HDR2.indexOf('Roll-up Flag')}); document.getElementById('aceCol_pals').value=String(${HDR2.indexOf('Account Family')});
      document.querySelector('#aceColBody button.btn.pri').click(); 'ok'`);
    await new Promise(r => setTimeout(r, 30));
    const set2 = parse(E(B2.ev, `JSON.stringify(ACEDB.sets['2026ACE']||null)`)) || {};
    chk(name, 'mapping box', 'answered, the file is read exactly as the titled one: the same lines, tree and reasons',
      J([(set2.lines || []).map(l => [l.ap, l.pmo, l.svc, l.wbs, l.lv, l.ce, l.slc, l.ccar, l.cdesc, l.v]), sortTree(set2.wbs), Object.keys((set2.rep || {}).reasons || {}).map(k => [k, set2.rep.reasons[k].rows])]),
      J([wantLines, sortTree(wantTree), Object.keys(wantReasons).map(k => [k, wantReasons[k].rows])]));
    chk(name, 'mapping box', 'the answers are said in the report and remembered for this layout, in ACEDB (so they travel with the board)',
      J([(set2.rep.map.roll || {}).how, (set2.rep.map.pals || {}).how, (set2.rep.map.roll || {}).t, parse(E(B2.ev, `JSON.stringify(Object.keys(ACEDB.cols||{}).map(function(k){ return ACEDB.cols[k].map; }))`))]),
      J(['asked', 'asked', 'Roll-up Flag', [{ roll: 'Roll-up Flag', pals: 'Account Family' }]]));
    await imp(B2, book(HDR, R, HDR2), '2026 ACE renamed.xlsx');
    chk(name, 'mapping box', 'the same layout again is read without asking, by the remembered answers',
      E(B2.ev, `JSON.stringify([aceColOpen, (ACEDB.sets['2026ACE'].rep.map.roll||{}).how, (ACEDB.sets['2026ACE'].rep.map.pals||{}).how, ACEDB.sets['2026ACE'].lines.length])`), J([false, 'remembered', 'remembered', wantLines.length]));
    const HDR3 = HDR2.concat(['Another new column']);
    await imp(B2, book(HDR, R, HDR3), '2026 ACE renamed.xlsx');
    chk(name, 'mapping box', 'a different layout (one more column) is a different signature, and is asked about again',
      E(B2.ev, `JSON.stringify([aceColOpen, [].slice.call(document.querySelectorAll('#aceColBody select')).map(function(s){ return s.id; })])`), J([true, ['aceCol_roll', 'aceCol_pals']]));
    E(B2.ev, `aceColCancel(); 'ok'`);

    // ---- 3. refusals: nothing is stored
    const B3 = mkBoard();
    const b3 = E(B3.ev, `JSON.stringify(ACEDB)`);
    await B3.ev(`importAce({files:[{name:'2026 SUST ACE COMPLETE.xlsb', arrayBuffer: async function(){ return new ArrayBuffer(8); }}], value:''})`);
    chk(name, 'refused', 'an .xlsb is refused before it is read, saying to save it as .xlsx', E(B3.ev, `/save it as an Excel Workbook \\(\\.xlsx\\)/.test(document.getElementById('shareStat').textContent)+' '+(JSON.stringify(ACEDB)===${J(b3)})`), 'true true');
    await B3.ev(`(function(){ var z=_zipStore([['xl/workbook.bin', new Uint8Array([1,2,3])], ['[Content_Types].xml', _utf8('<Types/>')]]);
      return importAce({files:[{name:'2026 ACE.xlsx', arrayBuffer: async function(){ return z.buffer.slice(z.byteOffset, z.byteOffset+z.byteLength); }}], value:''}); })()`);
    await new Promise(r => setTimeout(r, 30));
    chk(name, 'refused', 'a binary workbook renamed .xlsx is named for what it is', E(B3.ev, `/Excel Binary Workbook/.test(document.getElementById('shareStat').textContent)+' '+(JSON.stringify(ACEDB)===${J(b3)})`), 'true true');
    await imp(B3, book(HDR, R.filter(o => !o.notData).map(o => Object.assign({}, o, { dt: 'CY$' }))), '2026 ACE.xlsx');
    chk(name, 'refused', 'a file with no then-year row is refused, naming the types it holds', E(B3.ev, `/no then-year rows.*CY\\$/.test(document.getElementById('shareStat').textContent)+' '+(JSON.stringify(ACEDB)===${J(b3)})`), 'true true');
    await imp(B3, [{ name: 'Sheet1', rows: [['a', 'b'], [1, 2]] }], '2026 ACE.xlsx');
    chk(name, 'refused', 'a workbook with no sheet carrying the titles is refused, naming them', E(B3.ev, `/no sheet carries the estimate.*Work Breakdown Structure/.test(document.getElementById('shareStat').textContent)+' '+(JSON.stringify(ACEDB)===${J(b3)})`), 'true true');

    // ---- 3b. Excel leaves empty rows out of the file: the rows said are the sheet's own numbers. A workbook written by hand, its
    // titles on row 3 (rows 1 and 2 not in the file), a data row on 5 (row 4 not in the file) and one on 6.
    const B6 = mkBoard();
    // v2.12 RV1: the titles carry US/PTN/FMS and CCAR Element (their cells blank), so this check of the row numbers is not stopped
    // by the mapping box, which now asks about either when a file has no column titled so (review R25)
    await B6.ev(`(function(){ var x=function(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); },
      H=${J(['PALS/O&S', '$ Type', 'Service', 'T/M/S', 'Rollup Value?', 'JPO Managed', 'Appropriation (US Only)', 'Support Line Category', 'PMO', 'Work Breakdown Structure', 'Level', 'CES1', 'CES2', '2027', 'US/PTN/FMS', 'CCAR Element'])},
      R5=['O&S','TY$','USAF','F-35A','No','Yes','O&M','O&S','Air Vehicle','1.1','2','Manpower','Officer'], R6=['O&S','TY$','USAF','F-35A','No','Yes','O&M','O&S','Nobody Office','1.2','2','Manpower','Enlisted'];
      var col=function(i){ return String.fromCharCode(65+i); }, cells=function(r, a, num){ return a.map(function(v,i){ return '<c r="'+col(i)+r+'" t="inlineStr"><is><t>'+x(v)+'</t></is></c>'; }).join('')
        +(num!==undefined? '<c r="'+col(a.length)+r+'"><v>'+num+'</v></c>' : ''); };
      var sheet='<worksheet><sheetData><row r="3">'+cells(3, H)+'</row><row r="5">'+cells(5, R5, 1.5)+'</row><row r="6">'+cells(6, R6, 2.25)+'</row></sheetData></worksheet>';
      var z=_zipStore([['xl/workbook.xml', _utf8('<workbook><sheets><sheet name="PMO Database Output" sheetId="1" r:id="rId1"/></sheets></workbook>')],
        ['xl/_rels/workbook.xml.rels', _utf8('<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>')],
        ['xl/worksheets/sheet1.xml', _utf8(sheet)]]);
      return importAce({files:[{name:'2026 ACE by hand.xlsx', arrayBuffer: async function(){ return z.buffer.slice(z.byteOffset, z.byteOffset+z.byteLength); }}], value:''}); })()`);
    await new Promise(r => setTimeout(r, 30));
    chk(name, 'row numbers', 'a sheet Excel wrote with its empty rows left out: the titles are said to be on row 3, and the row left out is named as row 6, the numbers a person sees',
      E(B6.ev, `JSON.stringify((function(){ var R=(ACEDB.sets['2026ACE']||{}).rep||{}; return [R.row, (R.named||[]).map(function(n){ return [n.k, n.row]; }), (ACEDB.sets['2026ACE']||{lines:[]}).lines.length]; })())`),
      J([3, [['pmo', 6]], 1]));
    // a cell out of the file is a value, never a key: a PMO reading "constructor", a dollar type "__proto__" -- counted as text, and
    // the board saved with that estimate still passes the import check, which refuses those names as keys
    const B7 = mkBoard();
    await imp(B7, book(HDR, [{ wbs: '1.1', ces: ['A', 'B'], d: { 2027: 100001 }, x: {} }, { wbs: '1.2', pmo: 'constructor', ces: ['A', 'C'], d: { 2027: 200002 } },
      { wbs: '1.3', pmo: '__proto__', ces: ['A', 'D'], d: { 2027: 300003 } }, { wbs: '1.4', dt: '__proto__', ces: ['A', 'E'], d: { 2027: 400004 } },
      { wbs: '1.5', dt: 'toString', ces: ['A', 'F'], d: { 2027: 500005 } }]), '2026 ACE built-in names.xlsx');
    chk(name, 'values, not keys', 'a PMO or a dollar type spelled like a name every object answers to is counted as the text it is, rows and dollars',
      E(B7.ev, `JSON.stringify((function(){ var R=ACEDB.sets['2026ACE'].rep; return [R.reasons.pmo.by, R.reasons.pmo.v, R.types, R.reasons.dtype.v, Object.getPrototypeOf(R.reasons)===Object.prototype]; })())`),
      J([[['constructor', 1], ['__proto__', 1]], { 2027: 500005 }, [['__proto__', 1], ['toString', 1]], { 2027: 900009 }, true]));
    chk(name, 'values, not keys', 'and the board saved with that estimate passes the import check', E(B7.ev, `inboundCheck(buildSavedHtml())||'passes'`), 'passes');
    // a renamed title answered in the mapping box that reads "constructor" is read by, and not remembered: the board saved after it
    // still passes the import check (a field named pmo holding that name is refused there)
    await imp(B7, book(HDR, R.slice(0, 2), HDR.map(t => t === 'PMO' ? 'constructor' : t)), '2027 ACE odd title.xlsx');
    E(B7.ev, `document.getElementById('aceCol_pmo').value=String(${HDR.indexOf('PMO')}); document.querySelector('#aceColBody button.btn.pri').click(); 'ok'`);
    await new Promise(r => setTimeout(r, 30));
    chk(name, 'values, not keys', 'a PMO column titled "constructor", answered in the box: the file is read by it, the title is not remembered, and the saved board passes the import check',
      E(B7.ev, `JSON.stringify([(ACEDB.sets['2027ACE']||{lines:[]}).lines.length, ((ACEDB.sets['2027ACE']||{}).cols||{map:{}}).map.pmo===undefined, inboundCheck(buildSavedHtml())||'passes'])`),
      J([2, true, 'passes']));
    try { B7.w.close(); } catch {}
    // the answers a colleague gave in the mapping box come across with an ordinary import; a layout this board answers for keeps its own
    E(B6.ev, `ACEDB.cols={MINE:{map:{roll:'Mine'}}}; importStores({aceDb:{sets:{}, cols:{MINE:{map:{roll:'Theirs'}}, THEIRS:{map:{pals:'Account Family'}}}}}); 'ok'`);
    chk(name, 'remembered layouts', 'an ordinary import takes the layouts this board has not answered for, and keeps its own answer for one it has',
      E(B6.ev, `JSON.stringify([ACEDB.cols.MINE.map.roll, (ACEDB.cols.THEIRS||{map:{}}).map.pals])`), J(['Mine', 'Account Family']));

    // ---- 4. PSM inside Air Vehicle: every estimate's default; a stored {} on a 2026 estimate replaced on opening and said once
    const B4 = mkBoard();
    E(B4.ev, `MS.aceAlign={'2026ACE':{}, '2027ACE':{AV:'CDS'}, '2025ACE':{}}; save(); 'ok'`);
    const html = E(B4.ev, `buildSavedHtml()`);
    const B5 = boot({ html });
    chk(name, 'PSM inside AV', 'a 2026 estimate’s stored {} is the old default: replaced on opening; a real choice and an older estimate’s are kept',
      E(B5.ev, `JSON.stringify(MS.aceAlign)`), J({ '2026ACE': { PSM: 'AV' }, '2027ACE': { AV: 'CDS' }, '2025ACE': {} }));
    chk(name, 'PSM inside AV', 'and it is said once', E(B5.ev, `(STAT_LOG||[]).filter(function(e){ return /PSM is inside Air Vehicle/.test(e.html) && /2026ACE/.test(e.html); }).length`), 1);
    chk(name, 'PSM inside AV', 'an estimate of any year, read for the first time, puts PSM under AV', E(B5.ev, `JSON.stringify([aceAlign('2031ACE'), aceAlign('2024ACE'), acePmoFor('2031ACE','PSM')])`),
      J([{ PSM: 'AV' }, { PSM: 'AV' }, 'AV']));
    [B, B2, B3, B4, B5, B6].forEach(x => { try { x.w.close(); } catch {} });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ---- v2.12 RV1 (the review of W1's import; recovery/v212/notes-RV1.md): a shared fixture for the blocks below ----------------
// The 2026 header as W1's block lays it out, a row writer that puts each field under its own title wherever the header carries
// it (a header renamed or reordered moves nothing else), and a board to import into. `us` and `ces` write what they are given,
// blank included, so a blank US/PTN/FMS cell can be written.
const RV1 = (() => {
  const J = JSON.stringify;
  const HDR = ['Index', 'Sub Index', 'PALS/O&S', '$ Type', 'US/PTN/FMS', 'Service', 'T/M/S', 'Rollup Value?', 'JPO Managed', 'Shared/Unique',
    'Appropriation (US Only)', 'Support Line Category', 'CCAR Element', 'CCAR Description', 'PMO', 'Work Breakdown Structure', 'Level',
    'CES1', 'CES2', 'CES3', 'CES4', 'CES5', 'CES6', 'CES7', 'CES8', 2026, 2027, 2028];
  // o: {wbs, ces[], d:{year: whole $}, raw:{year: cell as written}, pals, dt, us, svc, tms, roll, jpo, appus, slc, pmo, lv, ccar, cdesc, at:{title: cell}}
  // `put` writes under every column a title heads, unless `at` names that column's own value (a duplicated title)
  const rowOf = (o, i, hdr) => { const r = hdr.map(() => '');
    const put = (t, v) => { const j = hdr.indexOf(t); if (j >= 0) r[j] = v; };
    put('Index', i + 1); put('PALS/O&S', o.pals || 'O&S'); put('$ Type', o.dt || 'TY$'); put('US/PTN/FMS', o.us !== undefined ? o.us : 'US');
    put('Service', o.svc || 'USAF'); put('T/M/S', o.tms || 'F-35A'); put('Rollup Value?', o.roll || 'No'); put('JPO Managed', o.jpo || 'Yes');
    put('Appropriation (US Only)', o.appus || 'O&M'); put('Support Line Category', o.slc === undefined ? 'O&S' : o.slc);
    put('CCAR Element', o.ccar || ''); put('CCAR Description', o.cdesc || ''); put('PMO', o.pmo || 'Air Vehicle');
    put('Work Breakdown Structure', o.wbs); put('Level', o.lv !== undefined ? o.lv : (o.wbs ? String(o.wbs).split('.').length : ''));
    (o.ces || []).forEach((n, k) => put('CES' + (k + 1), n));
    hdr.forEach((h, j) => { if (typeof h === 'number') { if (o.raw && o.raw[h] !== undefined) r[j] = o.raw[h]; else if (o.d && o.d[h] !== undefined) r[j] = o.d[h] / 1e6; } });
    Object.keys(o.at || {}).forEach(j => { r[+j] = o.at[j]; });
    return r; };
  // the rows are written by HDR's columns (`hdr`), the header row as the file titles it (`shown`)
  const book = (rows, hdr, shown, extra) => [{ name: 'Cover', rows: [['2026 SUST ACE COMPLETE']] },
    { name: 'PMO Database Output', rows: [['PMO Database Output — then-year $M'], []].concat([shown || hdr || HDR], rows.map((o, i) => rowOf(o, i, hdr || HDR))) }]
    .concat(extra || []);
  const mkBoard = () => { const B = boot();
    seed(B.ev, { services: ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'], items: [], disc: [0, 0, 0, 0, 0, 0], mand: [0, 0, 0, 0, 0, 0], order: [] });
    B.ev(`globalThis.__wb=function(sheets, name){ const b=buildXlsx(sheets); return {name:name, arrayBuffer: async function(){ return b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength); }}; }; 'ok'`);
    return B; };
  const E = (B, code) => { try { return B.ev(code); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 160); } };
  const imp = async (B, sheets, file) => { await B.ev(`importAce({files:[__wb(${J(sheets)}, ${J(file)})], value:''})`); await new Promise(r => setTimeout(r, 30)); };
  const set = (B, k) => { try { return JSON.parse(B.ev(`JSON.stringify(ACEDB.sets[${J(k)}]||null)`)) || {}; } catch { return {}; } };
  const stat = B => E(B, `document.getElementById('shareStat').textContent`);
  const answer = async (B, picks) => { E(B, `(function(){ var p=${J(picks)}; Object.keys(p).forEach(function(f){ var s=document.getElementById('aceCol_'+f); if(s) s.value=String(p[f]); });
    document.querySelector('#aceColBody button.btn.pri').click(); return 'ok'; })()`); await new Promise(r => setTimeout(r, 30)); };
  const asked = B => { try { return JSON.parse(E(B, `JSON.stringify(aceColOpen? [].slice.call(document.querySelectorAll('#aceColBody select')).map(function(s){ return s.getAttribute('data-f'); }) : null)`)); } catch { return 'unreadable'; } };
  return { J, HDR, rowOf, book, mkBoard, E, imp, set, stat, answer, asked };
})();

// v2.12 RV1 (review R01, R02, R07, R08, R10, R30, K12): A STORED IMPORT REPORT IS READ, NEVER TRUSTED. A board file whose estimate
// carries a report in a shape ORBIT does not write -- counts as text, a year as text, totals missing, a list given as text -- is
// opened the way a teammate's file is (its saved bytes booted), and taken through an ordinary import: the Data card is drawn on
// every redraw, the report box is opened, and the board must keep drawing, draw no markup out of the file, and say the report
// cannot be read. A whole report with figures that do not add up, but stored as tying, is shown as not tying: the box works it out
// again. FAILS ON c23e8a0: the Data card draws the text count as an <img> on opening, the report box draws the years as markup,
// a report missing its totals throws inside render() so the board stops redrawing, and a stored ties:true is printed as ✓.
{
  const name = 'v2.12 RV1 — a stored import report is read, never trusted: counts that are text, years that are text and a report missing its totals are said to be unreadable, drawn as nothing, and never stop the board drawing';
  try {
    const { J, mkBoard, E } = RV1;
    const B = mkBoard();
    const v = { 2027: 1000 };
    // a whole report, the shape the import writes, except that its stored `ties` claims what its figures do not show
    const whole = { v: 1, file: 'w.xlsx', sheet: 'PMO Database Output', row: 3, sheets: ['PMO Database Output'], years: [2027], map: {}, absent: [], none: [],
      reasons: { pmo: { rows: 2, v: { 2027: 300 }, by: [['Owning IPT', 2]] } }, named: [], kept: { rows: 1, lines: 1, zero: 0, v: { 2027: 1000 } },
      total: { rows: 3, v: { 2027: 1500 } }, notData: 0, types: [], tree: {}, conflicts: [], ties: true };
    const hostile = '<img src=x id=rv1pw onerror="__rv1pw=1">';
    const sets = {
      '2019ACE': { label: '2019ACE', ts: 999, years: [2027], appn: { om: { tot: v, pmo: {}, svc: {} } }, lines: [],
        rep: Object.assign({}, whole, { years: ['x'] }) },                                       // a year that is not a year, its figures fine
      '2020ACE': { label: '2020ACE', ts: 1000, years: [2027], appn: { om: { tot: v, pmo: {}, svc: {} } }, lines: [],
        rep: Object.assign({}, whole, { kept: { rows: 1, lines: 1, zero: 0, v: { 2027: '<img src=x id=rv1pw onerror="__rv1pw=1">' } } }) },   // a figure that is text
      '2021ACE': { label: '2021ACE', ts: 1001, years: [2027], appn: { om: { tot: v, pmo: { AV: v }, svc: { USAF: v } } }, lines: [], rep: whole },
      '2022ACE': { label: '2022ACE', ts: 1002, years: [2027], appn: { om: { tot: v, pmo: {}, svc: {} } }, lines: [], skip: { pmo: 2 },
        rep: { v: 1, reasons: {}, named: [], conflicts: [] } },                                   // no kept, no total (R07, R10, R30, K12)
      '2023ACE': { label: '2023ACE', ts: 1003, years: [2027], appn: { om: { tot: v, pmo: {}, svc: {} } }, lines: [],
        rep: Object.assign({}, whole, { named: 'x', ties: true }) },                              // a list given as text (R10)
      '2024ACE': { label: '2024ACE', ts: 1004, years: [2027], appn: { om: { tot: v, pmo: {}, svc: {} } }, lines: [],
        rep: Object.assign({}, whole, { years: ['2027"><img src=x id=rv1yr onerror="__rv1pw=1">'],
          total: { rows: 3, v: { '2027"><img src=x id=rv1yr onerror="__rv1pw=1">': 1500 } } }) },   // a year that is text (R02)
      '2025ACE': { label: '2025ACE', ts: 1005, years: [2027], appn: { om: { tot: v, pmo: {}, svc: {} } }, lines: [],
        rep: Object.assign({}, whole, { reasons: { dtype: { rows: hostile, v: {} } } }) } };    // a count that is text, the newest (R01, R08)
    E(B, `ACEDB={ts:Date.now(), sets:${J(sets)}}; persistAce(); save(); 'ok'`);
    const html = E(B, `buildSavedHtml()`);
    chk(name, 'the door', 'CONTROL — the board file carrying these reports passes the import check: the report is not the door’s to judge', E(B, `inboundCheck(buildSavedHtml())||'passes'`), 'passes');
    // ---- opened as a teammate's file is: nothing clicked
    const O = boot({ html });
    const ev = c => RV1.E(O, c);
    ev(`globalThis.__rv1pw=0; 'ok'`);
    chk(name, 'the Data card', 'opened, with no click: the Data card draws the newest estimate’s report as unreadable, and draws no markup from it',
      ev(`(function(){ render(); syncBtns(); var b=[].slice.call(document.querySelectorAll('#dd_data .mi')).find(function(x){ return /Import report/.test(x.textContent); });
        return JSON.stringify([document.querySelectorAll('img#rv1pw, img#rv1yr').length, b? (b.querySelector('.sub')||{}).textContent : 'no item']); })()`),
      J([0, '2025ACE: its import report cannot be read — import the workbook again']));
    // ---- each report opened in the box: render() never throws, nothing from the file is markup, and the box says what it is
    const open = k => ev(`(function(){ var t=''; try{ aceRepShow(${J(k)}); render(); render(); }catch(e){ t='threw: '+e.message; }
      var el=document.getElementById('aceRepBody'); return JSON.stringify([t, document.getElementById('aceRepPanel').classList.contains('open'),
        el.querySelectorAll('img').length, !!el.querySelector('.acerep-bad'), /cannot be read/.test(el.textContent), el.textContent.length>0]); })()`);
    ['2019ACE', '2020ACE', '2022ACE', '2023ACE', '2024ACE', '2025ACE'].forEach(k => {
      chk(name, 'the report box', k + ': opened and redrawn twice, nothing throws; the box says its report cannot be read, and draws nothing of it as markup',
        open(k), J(['', true, 0, true, true, true]));
      ev(`aceRepClose(); 'ok'`);
    });
    chk(name, 'the report box', 'and the report missing its totals still names the rows the estimate recorded as left out (its own row counts), so it is not blank',
      ev(`(function(){ aceRepShow('2022ACE'); render(); var t=document.getElementById('aceRepBody').textContent; aceRepClose(); return /pmo 2/.test(t)+' '+/Import the workbook again/.test(t); })()`), 'true true');
    // the board keeps drawing while the box is open: the redraw reaches the panels after it and the left menu
    chk(name, 'the board draws', 'with an unreadable report open, a redraw reaches what comes after the box: the Data card’s item is ticked as open',
      ev(`(function(){ aceRepShow('2022ACE'); var t=''; try{ render(); }catch(e){ t='threw'; } var b=[].slice.call(document.querySelectorAll('#dd_data .mi')).find(function(x){ return /Import report/.test(x.textContent); });
        var on=b? /\\u2713/.test((b.querySelector('.chk')||{}).textContent||'') : 'no item'; aceRepClose(); return t+'|'+on; })()`), '|true');
    // a whole report that does not tie, though it says it does: the box works it out from the figures it prints
    chk(name, 'the report box', 'a whole report whose kept and left-out dollars do not add to the sheet is shown as not adding up, whatever it stored',
      ev(`(function(){ aceRepShow('2021ACE'); render(); var t=(document.querySelector('#aceRepBody .acerep-ties')||{}).textContent||''; aceRepClose(); return /\\u2717 Kept and left out do not add/.test(t)+' '+/\\u2713 Every dollar/.test(t); })()`),
      'true false');
    chk(name, 'the report box', 'CONTROL — that whole report is drawn as a report (its kept row and its reason), not as unreadable',
      ev(`(function(){ aceRepShow('2021ACE'); render(); var el=document.getElementById('aceRepBody'), k=el.querySelector('tr.acerep-kept'), p=el.querySelector('tr[data-why="pmo"]');
        var r=[!!el.querySelector('.acerep-bad'), k? [].slice.call(k.children,1).map(function(td){ return td.textContent; }) : null, p? p.children[1].textContent : null]; aceRepClose(); return JSON.stringify(r); })()`),
      J([false, ['1', '$1,000', '$1,000'], '2']));
    chk(name, 'nothing ran', 'no planted handler ran, and no element from the file is on the page', ev(`globalThis.__rv1pw+' '+document.querySelectorAll('#rv1pw, #rv1yr').length`), '0 0');
    // ---- the same reports through an ordinary import of the board file: taken whole (the import check passes them), drawn as nothing
    const C = mkBoard();
    E(C, `globalThis.__rv1pw=0; importStores({aceDb:{ts:Date.now(), sets:${J(sets)}}}); render(); syncBtns(); 'ok'`);
    chk(name, 'an ordinary import', 'taken by an ordinary import, the same reports draw no markup on the Data card, and opening each throws nothing',
      E(C, `(function(){ var t=''; ['2019ACE','2020ACE','2022ACE','2023ACE','2024ACE','2025ACE'].forEach(function(k){ try{ aceRepShow(k); render(); aceRepClose(); }catch(e){ t+=k+' threw; '; } });
        return JSON.stringify([Object.keys(ACEDB.sets).sort(), t, document.querySelectorAll('#rv1pw, #rv1yr').length, globalThis.__rv1pw]); })()`),
      J([['2019ACE', '2020ACE', '2021ACE', '2022ACE', '2023ACE', '2024ACE', '2025ACE'], '', 0, 0]));
    [B, O, C].forEach(x => { try { x.w.close(); } catch {} });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}

// v2.12 RV1 (review R00, R06, R25): THE HEADER, READ BY TITLE AND NEVER BY POSITION. A title the header carries twice is asked about,
// never taken from its first column; an answer is remembered by its title, with the column it was given for kept only to tell apart
// two columns that title shares; a fiscal year heading two columns refuses the file; and an optional column whose absence changes
// what is read -- US/PTN/FMS, which decides which lines are partner or FMS; CCAR Element; CESk where the file's paragraphs reach
// level k -- is asked about too, with "this file has no such column" an answer the box remembers. The fixture makes the
// alternatives disagree: a $3M subtotal (Rollup Value? Yes) over its $1M and $2M parts, so reading the wrong rollup column keeps
// $6M; partner and FMS rows with a US service, so reading every row as US keeps their $5M; a second 2027 column holding $5M.
// FAILS ON c23e8a0: a title heading two columns is read from the first (FY27 kept $6M), an answer for a title that heads two columns
// is re-read from the first next time, a second 2027 column is dropped with the report saying every dollar ties, and a renamed
// US/PTN/FMS (or CES3, or CCAR Element) is read as absent with no question.
{
  const name = 'v2.12 RV1 — the header: a title or a year that heads two columns, a remembered answer resolved by its title, and an optional column renamed, are asked about or refused, never read by position';
  try {
    const { J, HDR, book, mkBoard, E, imp, set, stat, answer, asked } = RV1;
    const R3 = [{ wbs: '1.2', roll: 'Yes', ces: ['A', 'B'], d: { 2027: 3000000 } }, { wbs: '1.2.1', ces: ['A', 'B', 'C'], d: { 2027: 1000000 } },
      { wbs: '1.2.2', ces: ['A', 'B', 'D'], d: { 2027: 2000000 } }];
    const kept27 = B => (set(B, '2026ACE').rep || { kept: { v: {} } }).kept.v[2027];
    const H = t => HDR.indexOf(t);
    // (a) the real Rollup Value? is H; column A is titled the same
    const HA = HDR.map((t, i) => (i === 0 ? 'Rollup Value?' : t));
    const A1 = mkBoard();
    await imp(A1, book(R3, HDR, HA), '2026 ACE dup.xlsx');
    chk(name, 'a title twice', 'a title the header carries on two columns is asked about, the box naming both columns, and nothing is read yet',
      J([asked(A1), E(A1, `(document.querySelector('#aceColBody .acecol-why[data-f="roll"]')||{}).textContent||''`), JSON.stringify(set(A1, '2026ACE')) === '{}']),
      J([['roll'], 'This file titles 2 columns alike: A, ' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[H('Rollup Value?')] + '. Pick the one that holds it.', true]));
    await answer(A1, { roll: H('Rollup Value?') });
    chk(name, 'a title twice', 'answered, the subtotal is left out: FY27 keeps $3,000,000, not its parts and itself', J([kept27(A1), ((set(A1, '2026ACE').rep || {}).reasons || {}).rollup]),
      J([3000000, { rows: 1, v: { 2027: 3000000 }, by: [] }]));
    E(A1, `confirm=function(){ return true; }; 'ok'`);
    await imp(A1, book(R3, HDR, HA), '2026 ACE dup.xlsx');
    chk(name, 'a title twice', 'the same layout again is read by the answer -- the column it was given for, which that title still heads -- without asking',
      J([asked(A1), kept27(A1), (((set(A1, '2026ACE').rep || {}).map || {}).roll || {}).how]), J([null, 3000000, 'remembered']));
    // (b) a renamed title answered in the box, which a second column also carries
    const HB = HDR.map((t, i) => (i === 0 || t === 'Rollup Value?' ? 'Flag' : t));
    const B2 = mkBoard();
    E(B2, `confirm=function(){ return true; }; 'ok'`);
    await imp(B2, book(R3, HDR, HB), '2026 ACE flag.xlsx');
    chk(name, 'remembered by title', 'Rollup Value? renamed "Flag", and column A also titled "Flag": asked', J(asked(B2)), J(['roll']));
    await answer(B2, { roll: H('Rollup Value?') });
    const memB = (() => { try { return JSON.parse(E(B2, `JSON.stringify(ACEDB.cols[Object.keys(ACEDB.cols)[0]])`)); } catch { return {}; } })();
    chk(name, 'remembered by title', 'the answer is remembered by its title, with the column it was given for beside it', J([memB.map, memB.at]), J([{ roll: 'Flag' }, { roll: H('Rollup Value?') }]));
    await imp(B2, book(R3, HDR, HB), '2026 ACE flag.xlsx');
    chk(name, 'remembered by title', 'the next import of that layout reads the column the person picked, not the first column titled "Flag": FY27 keeps $3,000,000',
      J([asked(B2), kept27(B2)]), J([null, 3000000]));
    // an answer remembered by its title alone (a board before this, or another board's) cannot say which of the two: asked again
    E(B2, `(function(){ var k=Object.keys(ACEDB.cols)[0]; ACEDB.cols[k]={map:{roll:'Flag'}}; return 'ok'; })()`);
    await imp(B2, book(R3, HDR, HB), '2026 ACE flag.xlsx');
    chk(name, 'remembered by title', 'remembered by its title alone, with two columns carrying it, the field is asked about again, never taken from the first', J(asked(B2)), J(['roll']));
    E(B2, `aceColCancel(); 'ok'`);
    // (c) a fiscal year heading two columns: refused, either order, nothing stored
    const HC = HDR.concat([2027]);
    const RC = [{ wbs: '1.1', ces: ['A', 'B'], d: { 2027: 1000000 }, at: { [HC.length - 1]: 5 } }];
    const C3 = mkBoard();
    await imp(C3, book(RC, HC), '2026 ACE two 2027.xlsx');
    chk(name, 'a year twice', 'a header with 2027 on two columns is refused, naming the year and both columns, and nothing is stored',
      J([/same fiscal year/.test(stat(C3)), /FY2027 in columns AA and AC/.test(stat(C3)), E(C3, `JSON.stringify(Object.keys(ACEDB.sets||{}))`)]), J([true, true, '[]']));
    const HC2 = [2027].concat(HDR);
    await imp(C3, book([{ wbs: '1.1', ces: ['A', 'B'], d: { 2027: 1000000 }, at: { 0: 5 } }], HC2), '2026 ACE two 2027.xlsx');
    chk(name, 'a year twice', 'and with the extra 2027 first: refused the same way, never read as the estimate', J([/FY2027 in columns A and AB/.test(stat(C3)), E(C3, `Object.keys(ACEDB.sets||{}).length`)]), J([true, 0]));
    // (d) US/PTN/FMS renamed: partner and FMS rows that carry a US service
    const RD = [{ wbs: '1.1', ces: ['A', 'B'], d: { 2027: 1000000 } }, { wbs: '1.2', us: 'PTN', ces: ['A', 'C'], d: { 2027: 2000000 } },
      { wbs: '1.3', us: 'FMS', ces: ['A', 'D'], d: { 2027: 3000000 } }];
    const HD = HDR.map(t => (t === 'US/PTN/FMS' ? 'US / Partner / FMS' : t));
    const D4 = mkBoard();
    E(D4, `confirm=function(){ return true; }; 'ok'`);
    await imp(D4, book(RD, HDR, HD), '2026 ACE partner.xlsx');
    chk(name, 'an optional column renamed', 'US/PTN/FMS retitled: asked about, as optional, with "this file has no such column" offered and nothing chosen',
      J([asked(D4), E(D4, `(function(){ var s=document.getElementById('aceCol_usptn'); return JSON.stringify([s.value, [].slice.call(s.options).slice(0,2).map(function(o){ return o.value+'='+o.textContent; })]); })()`)]),
      J([['usptn'], J(['', ['=— choose —', 'none=— this file has no such column —']])]));
    await answer(D4, {});
    chk(name, 'an optional column renamed', 'left unanswered, the file is refused naming it, and nothing is stored', J([/no answer was given for “US\/PTN\/FMS”/.test(stat(D4)), E(D4, `Object.keys(ACEDB.sets||{}).length`)]), J([true, 0]));
    await imp(D4, book(RD, HDR, HD), '2026 ACE partner.xlsx');
    await answer(D4, { usptn: H('US/PTN/FMS') });
    chk(name, 'an optional column renamed', 'answered with its column, the partner and FMS rows are left out: FY27 keeps $1,000,000, not $6,000,000',
      J([kept27(D4), (((set(D4, '2026ACE').rep || {}).reasons || {}).partner || {}).rows]), J([1000000, 2]));
    await imp(D4, book(RD, HDR, HD), '2026 ACE partner.xlsx');
    chk(name, 'an optional column renamed', 'the same layout again: read by the answer, not asked', J([asked(D4), kept27(D4)]), J([null, 1000000]));
    // no such column at all: answered "none", every row read as US -- said in the status line and the report, and remembered
    const HD2 = HDR.filter(t => t !== 'US/PTN/FMS');
    const D5 = mkBoard();
    await imp(D5, book(RD.slice(0, 1), HD2), '2026 ACE no partner column.xlsx');
    chk(name, 'no such column', 'a file with no US/PTN/FMS column is asked about it', J(asked(D5)), J(['usptn']));
    await answer(D5, { usptn: 'none' });
    chk(name, 'no such column', 'answered "this file has no such column": imported, said in the status line, recorded in the report, remembered as none',
      J([kept27(D5), /no US\/PTN\/FMS column, so every row was read as US/.test(stat(D5)), (set(D5, '2026ACE').rep || {}).none,
        E(D5, `JSON.stringify(ACEDB.cols[Object.keys(ACEDB.cols)[0]].none)`)]), J([1000000, true, ['usptn'], J(['usptn'])]));
    E(D5, `confirm=function(){ return true; }; 'ok'`);
    await imp(D5, book(RD.slice(0, 1), HD2), '2026 ACE no partner column.xlsx');
    chk(name, 'no such column', 'and the same layout again is read without asking', J(asked(D5)), 'null');
    // CES3 renamed on a file whose paragraphs reach level 3: asked; CES4-CES8 absent and nothing that deep: not asked
    const LE = HDR.filter(t => !/^CES[4-8]$/.test(t)), HE = LE.map(t => (t === 'CES3' ? 'Level 3 name' : t));
    const RE = [{ wbs: '1.2.1', ces: ['Manpower', 'Maintenance', 'Organizational'], d: { 2027: 1000000 } }];
    const E6 = mkBoard();
    await imp(E6, book(RE, LE, HE), '2026 ACE ces3.xlsx');
    chk(name, 'CES by depth', 'CES3 retitled on a file whose paragraphs reach level 3 is asked about; CES4-CES8, deeper than any paragraph, are not', J(asked(E6)), J(['ces3']));
    await answer(E6, { ces3: HE.indexOf('Level 3 name') });
    chk(name, 'CES by depth', 'answered, the level-3 paragraph is named by it', E(E6, `aceWbsPath('2026ACE','om','1.2.1')`), 'Manpower › Maintenance › Organizational');
    const E7 = mkBoard();
    await imp(E7, book([{ wbs: '1.2', ces: ['Manpower', 'Maintenance'], d: { 2027: 1000000 } }], HDR.filter(t => !/^CES[3-8]$/.test(t))), '2026 ACE shallow.xlsx');
    chk(name, 'CES by depth', 'CONTROL — a file two levels deep with no CES3-CES8 is not asked about them: imported straight on', J([asked(E7), Object.keys(set(E7, '2026ACE').lines || {}).length]), J([null, 1]));
    // CCAR Element renamed: asked about (each line's CCaR record puts its paragraphs first in a requirement's WBS picker)
    const E8 = mkBoard();
    await imp(E8, book([{ wbs: '1.2', ces: ['A', 'B'], ccar: 'JSF5594', d: { 2027: 1000000 } }], HDR, HDR.map(t => (t === 'CCAR Element' ? 'CCaR Record No' : t))), '2026 ACE ccar.xlsx');
    chk(name, 'CCAR Element', 'CCAR Element retitled is asked about', J(asked(E8)), J(['ccar']));
    await answer(E8, { ccar: H('CCAR Element') });
    chk(name, 'CCAR Element', 'answered, each line carries its CCaR record', ((set(E8, '2026ACE').lines || [])[0] || {}).ccar, 'JSF5594');
    [A1, B2, C3, D4, D5, E6, E7, E8].forEach(x => { try { x.w.close(); } catch {} });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}

// v2.12 RV1 (review R05, R11, R04): THE FILE'S KEY KEEPS THE YEAR RIGHT BEFORE ACE, AND A YEAR CELL IS A FIGURE ONLY WHEN IT IS ONE.
// A locked 2026ACE is held; the same estimate under names a person gives a file -- "2026ACE_final", "2026ACE (1)", "FY2026ACE",
// "2026 ACE_final", "2026_ACE" -- must meet the locked-replace question (answered Cancel: nothing changes), while "2026 Workspace",
// "2026 TRACE" and "2026 ACEs" are not estimates of 2026 and are filed under their own names. Then year cells written as text: a
// word or a date reads as nothing and the row is named; a U+2212 minus and "$(1.5)" are negative; "1,234.5" is a figure.
// FAILS ON c23e8a0: the names glued to ACE are filed under their whole names with no question, "FY27 TBD" reads $27,000,000,
// "−1.5" and "$(1.5)" read positive, and no cell is named.
{
  const name = 'v2.12 RV1 — the file key keeps the year right before ACE, so a re-import meets the locked-replace question; and a year cell is a figure only when the whole of it is one';
  try {
    const { J, book, mkBoard, E, imp, set } = RV1;
    const B = mkBoard();
    const R1 = [{ wbs: '1.1', ces: ['A', 'B'], d: { 2027: 1000000 } }];
    await imp(B, book(R1), '2026 SUST ACE COMPLETE Detail File.xlsx');
    chk(name, 'the key', 'CONTROL — the 2026 file’s own name is 2026ACE, locked', E(B, `JSON.stringify([Object.keys(ACEDB.sets), ACEDB.sets['2026ACE'].locked])`), J([['2026ACE'], true]));
    E(B, `globalThis.__asked=[]; confirm=function(m){ __asked.push(String(m).split('\\n')[0]); return false; }; 'ok'`);
    const same = ['2026ACE_final.xlsx', '2026ACE (1).xlsx', 'FY2026ACE.xlsx', '2026 ACE_final.xlsx', '2026_ACE.xlsx', '2026ACE Detail File.xlsx'];
    for (const f of same) await imp(B, book(R1), f);
    chk(name, 'the key', 'each name with 2026 right before ACE is the same estimate: the locked-replace question is asked, and Cancel leaves one estimate',
      E(B, `JSON.stringify([__asked.length, __asked.every(function(m){ return /2026ACE is already loaded and LOCKED/.test(m); }), Object.keys(ACEDB.sets)])`), J([same.length, true, ['2026ACE']]));
    E(B, `confirm=function(){ return true; }; 'ok'`);
    for (const f of ['2026 Workspace.xlsx', '2026 TRACE.xlsx', '2026 ACEs.xlsx']) await imp(B, book(R1), f);
    chk(name, 'the key', 'a word ending in ace after the year, or ACE run into a word, is not an estimate of 2026: each is filed under its own name',
      E(B, `JSON.stringify(Object.keys(ACEDB.sets).sort())`), J(['2026 ACEs', '2026 TRACE', '2026 Workspace', '2026ACE']));
    // ---- year cells written as text
    const C = mkBoard();
    const RT = [{ wbs: '1.1', ces: ['A', 'B'], raw: { 2027: 'FY27 TBD', 2028: '12/31/2026' } }, { wbs: '1.2', ces: ['A', 'C'], raw: { 2027: '−1.5' } },
      { wbs: '1.3', ces: ['A', 'D'], raw: { 2027: '$(1.5)', 2028: '1,234.5' } }, { wbs: '1.4', ces: ['A', 'E'], raw: { 2027: 'see note 3', 2028: '-' }, d: { 2026: 2000000 } },
      { wbs: '1.5', ces: ['A', 'F'], raw: { 2027: '1,5' }, d: { 2026: 1000000 } }];
    await imp(C, book(RT), '2026 ACE text cells.xlsx');
    const s = set(C, '2026ACE');
    chk(name, 'figures', 'a minus sign pasted from an exhibit and "$(1.5)" are negative; "1,234.5" is a figure; a word, a date and "1,5" read as nothing',
      J((s.lines || []).map(l => [l.wbs, l.v])), J([['1.2', { 2027: -1500000 }], ['1.3', { 2027: -1500000, 2028: 1234500000 }], ['1.4', { 2026: 2000000 }], ['1.5', { 2026: 1000000 }]]));
    chk(name, 'figures', 'every row with a cell of text that is not a figure is named, with the cell as the file wrote it; a bare dash is not',
      J(((s.rep || {}).named || []).filter(n => n.k === 'text').map(n => [n.wbs, n.what])),
      J([['1.1', 'FY2027 “FY27 TBD” · FY2028 “12/31/2026”'], ['1.4', 'FY2027 “see note 3”'], ['1.5', 'FY2027 “1,5”']]));
    chk(name, 'figures', 'and the paragraph whose only cells were text is in the tree with no dollar, its row counted kept', J([(s.rep || {}).kept && s.rep.kept.zero, !!((s.wbs || {}).om || {})['1.1']]), J([1, true]));
    chk(name, 'figures', 'aceMoney itself: a figure only when the whole cell is one', E(C, `JSON.stringify(['FY27 TBD','Q3','see note 3','\\u22121.5','$(1.5)','($1.5)','(1.5)','1,234.5','1,5','1.5-','',' 2 ',3].map(aceMoney))`),
      J([0, 0, 0, -1500000, -1500000, -1500000, -1500000, 1234500000, 0, 0, 0, 2000000, 3000000]));
    [B, C].forEach(x => { try { x.w.close(); } catch {} });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}

// v2.12 RV1 (review R03, R09, R26, K08): A BREAKOUT IS A WHOLE BRANCH. Once a heading on a suffixed line takes the suffix, every heading
// below it on that line does too, so an E line never folds back under its twin's heading where a lower level's name repeats the
// twin's. Three shapes, each on an O&S board where the AV + PSM split can read them: a level-5 E line whose level-3 name differs and
// level-4 name matches (R09); a breakout from level 2, whose level-3 name matches (K08); and, as controls, Brad's own shapes -- a
// level-4 E line whose level-3 name differs (P6.2.2.1E) and one whose names all match (P6.5.1.2E, under Government). Then a Full
// Fund 5-level E line (R03, R26) beside a level-4 E line of the same code named otherwise, a conflict that is named. AV claims the
// plain headings 1.2.2 and 1.3, PSM the breakouts 1.2.2E and 1.3E: each breakout's dollars are PSM's part. Every expectation is typed
// here from the fixture. FAILS ON c23e8a0: both breakouts fold under the plain headings, the ECU headings hold nothing, PSM's part is
// $0 and AV's carries the ECU lines' $800,000.
{
  const name = 'v2.12 RV1 — an E breakout is a whole branch: every heading below the first one that takes the suffix carries it, and the AV + PSM split follows the tree';
  try {
    const { J, book, mkBoard, E, imp, set } = RV1;
    const B = mkBoard();
    const RW = [
      { wbs: '1.2.2.1.1', ces: ['Manpower', 'Maintenance', 'Propulsion', 'F135', 'Engine repair'], d: { 2027: 1000000 } },
      { wbs: '1.2.2.1.1E', ces: ['Manpower', 'Maintenance', 'ECU Propulsion', 'F135', 'Engine repair ECU'], d: { 2027: 500000 } },
      { wbs: '1.3.2.1', ces: ['Manpower', 'CONUS Depot', 'Propulsion', 'Engine shop'], d: { 2027: 400000 } },
      { wbs: '1.3.2.1E', ces: ['Manpower', 'ECU Depot', 'Propulsion', 'Engine shop ECU'], d: { 2027: 300000 } },
      { wbs: '1.4.2.1', ces: ['Manpower', 'Depot', 'Propulsion', 'Line'], d: { 2027: 20000 } },
      { wbs: '1.4.2.1E', ces: ['Manpower', 'Depot', 'ECU Propulsion', 'Line ECU'], d: { 2027: 10000 } },
      { wbs: '1.5.1.2', ces: ['Manpower', 'Government Depot', 'Government', 'Gov line'], d: { 2027: 7000 } },
      { wbs: '1.5.1.2E', ces: ['Manpower', 'Government Depot', 'Government', 'Gov line E'], d: { 2027: 3000 } },
      // Full Fund: a 5-level E line, and a level-4 E line of the code the deeper line's level-4 heading takes, named otherwise
      { wbs: 'P6.2.2.1', pals: 'PALS', slc: 'Depot Activation', appus: 'Procurement', pmo: 'Propulsion', ces: ['Depot Standup', 'CONUS Depot Standup', 'Propulsion', 'Engine shop'], d: { 2027: 110000 } },
      { wbs: 'P6.2.2.1.3', pals: 'PALS', slc: 'Depot Activation', appus: 'Procurement', pmo: 'Propulsion', ces: ['Depot Standup', 'CONUS Depot Standup', 'Propulsion', 'Engine shop', 'Tooling'], d: { 2027: 120000 } },
      { wbs: 'P6.2.2.1E', pals: 'PALS', slc: 'Depot Activation', appus: 'Procurement', pmo: 'Propulsion', ces: ['Depot Standup', 'CONUS Depot Standup', 'ECU Propulsion', 'Engine shop ECU'], d: { 2027: 130000 } },
      { wbs: 'P6.2.2.1.3E', pals: 'PALS', slc: 'Depot Activation', appus: 'Procurement', pmo: 'Propulsion', ces: ['Depot Standup', 'CONUS Depot Standup', 'ECU Propulsion', 'Engine shop', 'Tooling ECU'], d: { 2027: 140000 } }];
    await imp(B, book(RW), '2026 SUST ACE COMPLETE Detail File.xlsx');
    const up = (ap, c) => E(B, `JSON.stringify(aceWbsUp('2026ACE',${J(ap)},${J(c)}))`);
    chk(name, 'the tree', 'a level-5 E line whose level-3 name differs stays in its breakout below it: 1.2.2.1.1E -> 1.2.2.1E -> 1.2.2E -> 1.2 -> 1',
      up('om', '1.2.2.1.1E'), J(['1.2.2.1.1E', '1.2.2.1E', '1.2.2E', '1.2', '1']));
    chk(name, 'the tree', 'and its path names its own breakout, ECU Propulsion', E(B, `aceWbsPath('2026ACE','om','1.2.2.1.1E')`), 'Manpower › Maintenance › ECU Propulsion › F135 › Engine repair ECU');
    chk(name, 'the tree', 'a breakout from level 2 is that heading’s whole branch: 1.3.2.1E -> 1.3.2E -> 1.3E "ECU Depot" -> 1',
      up('om', '1.3.2.1E') + ' ' + E(B, `(aceWbsNode('2026ACE','om','1.3E')||{}).n`), J(['1.3.2.1E', '1.3.2E', '1.3E', '1']) + ' ECU Depot');
    chk(name, 'the tree', 'CONTROL — Brad’s shapes are as before: a level-4 E line under its own level-3 heading, and one whose names all match under Government',
      up('om', '1.4.2.1E') + ' ' + up('om', '1.5.1.2E'), J(['1.4.2.1E', '1.4.2E', '1.4', '1']) + ' ' + J(['1.5.1.2E', '1.5.1', '1.5', '1']));
    chk(name, 'the tree', 'Full Fund: P6.2.2.1.3E -> P6.2.2.1E -> P6.2.2E -> P6.2 -> P6, and the plain P6.2.2.1 keeps none of it',
      up('ff', 'P6.2.2.1.3E') + ' ' + E(B, `JSON.stringify(Object.keys(ACEDB.sets['2026ACE'].wbs.ff).filter(function(c){ return ACEDB.sets['2026ACE'].wbs.ff[c].up==='P6.2.2.1'; }))`),
      J(['P6.2.2.1.3E', 'P6.2.2.1E', 'P6.2.2E', 'P6.2', 'P6']) + ' ' + J(['P6.2.2.1.3']));
    chk(name, 'the tree', 'the heading P6.2.2.1E that line passes through is a line named otherwise: two names for one paragraph, named as a conflict',
      J(((set(B, '2026ACE').rep || {}).conflicts || []).map(c => [c.ap, c.code, c.n, (c.also || []).map(a => a.n)])), J([['ff', 'P6.2.2.1E', 'Engine shop ECU', ['Engine shop']]]));
    // the AV + PSM split reads the tree: AV on the plain headings, PSM on the breakouts
    const split = E(B, `JSON.stringify((function(){ var sp=aceGroupSplit('2026ACE','AV',['AV','PSM'],[{fy:2027, rows:[{pmo:'AV', claims:['1.2.2','1.3','1.4.2','1.5.1']}, {pmo:'PSM', claims:['1.2.2E','1.3E','1.4.2E']}]}]);
      return [sp.by.AV, sp.by.PSM, sp.shared, sp.est]; })())`);
    chk(name, 'the split', 'each breakout’s dollars are the office’s that claims the breakout: PSM $810,000 (500,000 + 300,000 + 10,000), AV $1,430,000, nothing shared',
      split, J([1000000 + 400000 + 20000 + 7000 + 3000, 500000 + 300000 + 10000, 0, 2240000]));
    try { B.w.close(); } catch {}
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}

// v2.12 RV1 (review R33, R35): COVERAGE -- the code was right and nothing pinned it. Every entry of the Support Line Category map is a
// kept row with dollars no other row uses, so a category dropped from the map or filed under another appropriation or cost element
// moves a figure; a later sheet carrying the very same titles (a copied tab) with other dollars, so the tie goes to the first sheet
// as the contract says; and a kept row whose US/PTN/FMS cell is blank, read as US (W1's decision). These pass on c23e8a0: they are
// here for the mutations that change each rule (v212-rv1-slc-*, v212-rv1-header-tie-last, v212-rv1-blank-us-partner).
{
  const name = 'v2.12 RV1 — every Support Line Category the map holds lands on its appropriation and cost element; a header tie goes to the first sheet; a blank US/PTN/FMS cell is US';
  try {
    const { J, HDR, book, mkBoard, E, imp, set } = RV1;
    const F = (slc, ce, ces2, pmo) => ({ slc, pals: 'PALS', appus: 'Procurement', pmo: pmo || 'Air Vehicle', ces: ['Full Fund', ces2 || slc], x: { ap: 'ff', ce } });
    const R = [
      { slc: 'O&S', ces: ['O&M', 'Ops'], x: { ap: 'om', ce: '' } },
      { slc: 'Initial Spares', pals: 'PALS', appus: 'Procurement', ces: ['Spares', 'Initial'], x: { ap: 'sp', ce: '' } },
      { slc: 'Other Proc (OPN)', pals: 'PALS', appus: 'Procurement', ces: ['OPN', 'Support'], x: { ap: 'opn', ce: '' } },
      F('Airframe PGSE', 'Airframe PGSE'), F('Avionics PGSE', 'Avionics PGSE'), F('Engine PGSE', 'Engine PGSE'), F('Fixed JPO Support', 'Fixed JPO Support'),
      F('JRE', 'JRE'), F('Other ILS', 'Other ILS Production'), F('PEC TRNG EQ', 'Peculiar Training Equip'),
      F('PEC TRNG EQ (Full Mission Sims)', 'Full Mission Simulators'), F('Production Eng Support', 'Production Engineering Support'),
      F('Pubs / Tech Data', 'Pubs/Tech Data'), F('Depot Activation', 'Depot Standup Software', 'Software Depot Standup'),
      F('Depot Activation', 'Depot Standup Propulsion', 'Organic Depot', 'Propulsion'), F('Depot Activation', 'Depot Standup Air Vehicle', 'Organic Depot', 'Air Vehicle'),
      // a blank US/PTN/FMS cell, the column present: US (W1's decision), kept
      { slc: 'O&S', us: '', ces: ['O&M', 'Blank flag'], x: { ap: 'om', ce: '' } }];
    R.forEach((o, i) => { o.wbs = (o.pals === 'PALS' ? 'P' : '') + (i + 1) + '.1'; o.d = { 2027: (i + 1) * 1000003 }; });
    chk(name, 'fixture', 'CONTROL — one kept row for every entry of the map, and every dollar figure distinct',
      J([new Set(R.map(o => o.slc)).size, new Set(R.map(o => o.d[2027])).size === R.length]), J([14, true]));
    // the copied tab: the same titles, every figure ten times over, after the real one
    const copy = { name: 'PMO Database Output (copy)', rows: [['copy'], [], HDR].concat(R.map((o, i) => RV1.rowOf(Object.assign({}, o, { d: { 2027: o.d[2027] * 10 } }), i, HDR))) };
    const B = mkBoard();
    await imp(B, book(R, HDR, null, [copy]), '2026 SUST ACE COMPLETE Detail File.xlsx');
    const s = set(B, '2026ACE');
    chk(name, 'a tie', 'two sheets carry the same titles: the first in the file is read, and its dollars', J([(s.rep || {}).sheet, ((s.lines || [])[0] || { v: {} }).v[2027]]), J(['PMO Database Output', 1000003]));
    chk(name, 'the map', 'every category lands on its appropriation and cost element, with its own dollars',
      J((s.lines || []).map(l => [l.slc, l.ap, l.ce, l.v[2027]])), J(R.map(o => [o.slc, o.x.ap, o.x.ce, o.d[2027]])));
    const tot = ap => R.filter(o => o.x.ap === ap).reduce((a, o) => a + o.d[2027], 0);
    chk(name, 'the map', 'and each appropriation’s total is its categories’ dollars', J(['ff', 'om', 'opn', 'sp'].map(ap => [ap, ((s.appn || {})[ap] || { tot: {} }).tot[2027]])),
      J(['ff', 'om', 'opn', 'sp'].map(ap => [ap, tot(ap)])));
    chk(name, 'blank US/PTN/FMS', 'the row with a blank US/PTN/FMS cell is kept, and nothing is left out as partner or FMS',
      J([(s.lines || []).some(l => l.wbs === R[R.length - 1].wbs), !!(((s.rep || {}).reasons || {}).partner)]), J([true, false]));
    try { B.w.close(); } catch {}
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ---- v2.12 RV4 (the second review of the cost estimate import, S00-S03 and S21; recovery/v212/notes-RV4.md) ------------------
// Each block below uses RV1's fixture (above) and FAILS ON c81e995 unless a part is labelled CONTROL.

// v2.12 RV4 (second review S00): THE FILE KEY TAKES THE YEAR NEAREST ACE. A regex match starts as far left as it can, and RV1's
// lazy gap let another year sit between the year it took and ACE, so a date or a cycle tag ahead of the estimate's year won. Two
// locked estimates are held, 2026ACE and the approved 2027ACE; three names of the 2026 estimate with an earlier four-digit year in
// front -- a cycle tag, a "BES2028 from" (2026ACE in v2.11), a date -- must each meet 2026ACE's locked-replace question, never
// 2027ACE's and never a new key; Cancel leaves both estimates as they were. FAILS ON c81e995: "PB2027 2026 SUST ACE" meets the
// locked 2027ACE's question (an OK there replaces the approved estimate), "BES2028 from 2026 ACE" is filed silently as 2028ACE and
// the date-prefixed name as 2025ACE.
{
  const name = 'v2.12 RV4 — the file key takes the year nearest ACE, not the first year the name carries (S00)';
  try {
    const { J, book, mkBoard, E, imp } = RV1;
    const B = mkBoard();
    await imp(B, book([{ wbs: '1.1', ces: ['A', 'B'], d: { 2026: 1000000 } }]), '2026 SUST ACE COMPLETE Detail File.xlsx');
    await imp(B, book([{ wbs: '1.1', ces: ['A', 'B'], d: { 2027: 7000000 } }]), '2027 SUST ACE COMPLETE Detail File.xlsx');
    chk(name, 'the key', 'CONTROL — 2026ACE and the approved 2027ACE are held, both locked', E(B, `JSON.stringify(Object.keys(ACEDB.sets).sort().map(function(k){ return [k, ACEDB.sets[k].locked]; }))`),
      J([['2026ACE', true], ['2027ACE', true]]));
    E(B, `globalThis.__asked=[]; confirm=function(m){ __asked.push(String(m).split('\\n')[0]); return false; }; 'ok'`);
    const ahead = ['PB2027 2026 SUST ACE COMPLETE Detail File.xlsx', 'BES2028 from 2026 ACE.xlsx', '2025-11-03 2026 SUST ACE COMPLETE Detail File.xlsx'];
    for (const f of ahead) await imp(B, book([{ wbs: '1.1', ces: ['A', 'B'], d: { 2026: 3000000 } }]), f);
    chk(name, 'the key', 'each name with an earlier year ahead of the estimate’s own meets 2026ACE’s locked-replace question, and no other',
      E(B, `JSON.stringify(__asked)`), J(ahead.map(() => '⚠ 2026ACE is already loaded and LOCKED.')));
    chk(name, 'the key', 'answered Cancel, nothing is filed under another year: the two estimates, each with its own figures',
      E(B, `JSON.stringify(Object.keys(ACEDB.sets).sort().map(function(k){ return [k, ACEDB.sets[k].lines[0].v]; }))`), J([['2026ACE', { 2026: 1000000 }], ['2027ACE', { 2027: 7000000 }]]));
    // CONTROL — what RV1's check holds still holds, and so do a year range and a later year after ACE
    E(B, `__asked=[]; 'ok'`);
    const same = ['2026ACE_final.xlsx', 'FY2026ACE.xlsx', '2026_ACE.xlsx', '2026-27 ACE.xlsx', '2026 SUST ACE 2027 update.xlsx', '2026 ACE for BES2028.xlsx'];
    for (const f of same) await imp(B, book([{ wbs: '1.1', ces: ['A', 'B'], d: { 2026: 3000000 } }]), f);
    chk(name, 'the key', 'CONTROL — a name with 2026 right before ACE, or a later year only after ACE, is 2026ACE', E(B, `JSON.stringify(__asked)`),
      J(same.map(() => '⚠ 2026ACE is already loaded and LOCKED.')));
    try { B.w.close(); } catch {}
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}

// v2.12 RV4 (second review S01): A ROW WITH NO WBS WHOSE YEAR CELLS ARE FIGURES WRITTEN AS TEXT IS DATA. Since RV1 a cell such as
// "1.5*" reads as nothing, so a real line that lost its WBS and footnoted its figures had no WBS and no dollar, and was filed as
// formatting: out of the sheet's rows, named nowhere, the import saying "No row left out". Before RV1 it was kept and named. Here: a
// line with every field filled, no WBS, FY27 "1.5*" and FY28 "2.0 (a)"; a line WITH a WBS whose only cell is "0.7*" (RV1's case,
// unchanged); a line with a real figure; and a truly blank row, which is still formatting (CONTROL). FAILS ON c81e995: the
// footnoted line is counted as formatting (notData 2), is in no total and is named nowhere, and the status line says nothing of it.
{
  const name = 'v2.12 RV4 — a row with no WBS whose year cells are figures written as text is counted, kept and named, never filed as formatting (S01)';
  try {
    const { J, HDR, book, mkBoard, E, imp, set, stat } = RV1;
    const B = mkBoard();
    const S = book([{ wbs: '1.1', ces: ['A', 'B'], d: { 2027: 1000000 } }, { wbs: '', ces: ['A', 'B'], raw: { 2027: '1.5*', 2028: '2.0 (a)' } },
      { wbs: '1.3', ces: ['A', 'C'], raw: { 2027: '0.7*' } }]);
    S[1].rows.push(HDR.map(() => ''));         // a blank row under the lines: formatting
    await imp(B, S, '2026 SUST ACE COMPLETE Detail File.xlsx');
    const R = set(B, '2026ACE').rep || {};
    chk(name, 'counted', 'the footnoted line is one of the sheet’s rows and is kept; only the blank row is formatting',
      J([(R.total || {}).rows, R.notData, (R.kept || {}).rows, (R.kept || {}).lines]), J([3, 1, 3, 1]));
    chk(name, 'counted', 'only the paragraph 1.3 is a paragraph with no dollar in the tree; the line with no WBS is in no tree', J([(R.kept || {}).zero, Object.keys((set(B, '2026ACE').wbs || {}).om || {}).sort()]),
      J([1, ['1', '1.1', '1.3']]));
    chk(name, 'named', 'the footnoted line is named for its missing WBS and for its text, each cell as the file wrote it; 1.3 for its text',
      J((R.named || []).map(n => [n.k, n.row, n.wbs, n.what])),
      J([['nowbs', 5, '', 'O&S'], ['text', 5, '', 'FY2027 “1.5*” · FY2028 “2.0 (a)”'], ['text', 6, '1.3', 'FY2027 “0.7*”']]));
    chk(name, 'said', 'the status line says the kept rows whose year cells are text, read as nothing', /⚠ 2 kept rows hold a year cell of text that is not a figure, read as nothing: named in the report\./.test(stat(B)), true);
    chk(name, 'said', 'and the report box lists the line under “No WBS” by its row', E(B, `(function(){ var d=document.querySelector('#aceRepBody .acerep-named[data-why="nowbs"]'); return d? [].slice.call(d.querySelectorAll('td')).slice(0,1).map(function(t){ return t.textContent; }).join('') : 'none'; })()`), '5');
    chk(name, 'said', 'every dollar the sheet reads is still kept or in a reason', R.ties, true);
    // a sheet whose only rows are kept with nothing read -- the footnoted line and a paragraph of text -- is refused, and the refusal
    // says they were kept with no dollar and which hold text (it said "every row was left out —" and named no reason)
    const B2 = mkBoard();
    await imp(B2, book([{ wbs: '', ces: ['A', 'B'], raw: { 2027: '1.5*' } }, { wbs: '1.3', ces: ['A', 'C'], raw: { 2027: '0.7*' } }]), '2026 SUST ACE COMPLETE Detail File.xlsx');
    chk(name, 'said', 'a sheet of rows kept with nothing read is refused for that, naming the rows of text; nothing is stored',
      J([stat(B2).replace(/^.*import failed: /, ''), E(B2, `Object.keys(ACEDB.sets||{}).length`)]),
      J(['no row carries a dollar ORBIT can read: 2 rows were kept with none, and rows 4, 5 hold a year cell of text that is not a figure', 0]));
    [B, B2].forEach(x => { try { x.w.close(); } catch {} });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}

// v2.12 RV4 (second review S02): A HEADING TWO ROWS PLACE UNDER DIFFERENT PARENTS IS NAMED AND SETTLED BY ONE RULE. 1.2.2.1E's own
// row says CES3 "Propulsion" (under 1.2.2); its child 1.2.2.1.3E says CES3 "ECU Propulsion" (under the breakout 1.2.2E). The same
// disagreement on a second heading, 1.3.2.1E, so the list's order can be seen. The rows are imported in one order and then in the
// reverse: the rule (the breakout parent wins) puts both E headings under their breakouts either way, the AV + PSM split is the same
// either way, and both headings are named, in code order. AV claims the plain 1.2.2 and 1.3.2, PSM the breakouts 1.2.2E and
// 1.3.2E. CONTROL: a file whose rows agree names nothing. FAILS ON c81e995: no disagreement is named, and with the parent rows first
// the E headings sit under the plain ones -- PSM $0, AV $1,870,000 -- while the reverse order gives PSM $670,000.
{
  const name = 'v2.12 RV4 — a heading two rows place under different parents is named and settled by one rule, whatever the order of the rows (S02)';
  try {
    const { J, book, mkBoard, E, imp, set, stat } = RV1;
    const rows = [
      { wbs: '1.2.2.1', ces: ['Manpower', 'Maintenance', 'Propulsion', 'Engine shop'], d: { 2027: 1000000 } },
      { wbs: '1.2.2.1E', ces: ['Manpower', 'Maintenance', 'Propulsion', 'Engine shop ECU'], d: { 2027: 150000 } },
      { wbs: '1.2.2.1.3E', ces: ['Manpower', 'Maintenance', 'ECU Propulsion', 'Engine shop ECU', 'Tooling ECU'], d: { 2027: 300000 } },
      { wbs: '1.3.2.1', ces: ['Manpower', 'Depot', 'Airframe', 'Wing shop'], d: { 2027: 200000 } },
      { wbs: '1.3.2.1E', ces: ['Manpower', 'Depot', 'Airframe', 'Wing shop ECU'], d: { 2027: 120000 } },
      { wbs: '1.3.2.1.4E', ces: ['Manpower', 'Depot', 'ECU Airframe', 'Wing shop ECU', 'Jigs ECU'], d: { 2027: 100000 } }];
    const look = async order => {
      const B = mkBoard();
      await imp(B, book(order), '2026 SUST ACE COMPLETE Detail File.xlsx');
      const s = set(B, '2026ACE'), R = s.rep || {};
      const up = c => E(B, `JSON.stringify(aceWbsUp('2026ACE','om',${J(c)}))`);
      const split = E(B, `JSON.stringify((function(){ var sp=aceGroupSplit('2026ACE','AV',['AV','PSM'],[{fy:2027, rows:[{pmo:'AV', claims:['1.2.2','1.3.2']}, {pmo:'PSM', claims:['1.2.2E','1.3.2E']}]}]);
        return [sp.by.AV, sp.by.PSM, sp.shared, sp.est]; })())`);
      const box = E(B, `(function(){ var d=document.querySelector('#aceRepBody .acerep-ups'); return d? d.textContent : 'none'; })()`);
      const out = { up: [up('1.2.2.1E'), up('1.3.2.1E')], split, ups: (R.ups || []).map(u => [u.ap, u.code, u.up, (u.by || []).map(b => b.up)]),
        rows: (R.ups || []).map(u => (u.by || []).map(b => [b.up, b.rows])), conf: (R.conflicts || []).length, box, stat: stat(B),
        path: E(B, `aceWbsPath('2026ACE','om','1.2.2.1.3E')`) };
      try { B.w.close(); } catch {}
      return out;
    };
    const A = await look(rows), Z = await look(rows.slice().reverse());
    const wantUp = J([J(['1.2.2.1E', '1.2.2E', '1.2', '1']), J(['1.3.2.1E', '1.3.2E', '1.3', '1'])]);
    chk(name, 'the rule', 'the parent rows first: each E heading goes under its breakout, the parent another row gives it', J(A.up), wantUp);
    chk(name, 'the rule', 'the child rows first: the same tree', J(Z.up), wantUp);
    chk(name, 'the rule', 'and the deeper line’s path names its own breakout', A.path + ' | ' + Z.path, 'Manpower › Maintenance › ECU Propulsion › Engine shop ECU › Tooling ECU | Manpower › Maintenance › ECU Propulsion › Engine shop ECU › Tooling ECU');
    const wantSplit = J([1000000 + 200000, 150000 + 300000 + 120000 + 100000, 0, 1870000]);
    chk(name, 'the split', 'the AV + PSM split is the same whatever the order: every E line is PSM’s, $670,000; AV $1,200,000; nothing shared', A.split + ' ' + Z.split, wantSplit + ' ' + wantSplit);
    const wantUps = J([['om', '1.2.2.1E', '1.2.2E', ['1.2.2', '1.2.2E']], ['om', '1.3.2.1E', '1.3.2E', ['1.3.2', '1.3.2E']]]);
    chk(name, 'named', 'both headings are named, in code order, with the parent taken and every parent given -- in either order of the rows', J(A.ups) + ' ' + J(Z.ups), wantUps + ' ' + wantUps);
    chk(name, 'named', 'each parent with the row that gave it (the rows are 4-9 in the file; reversed, they are counted the other way)', J([A.rows, Z.rows]),
      J([[[['1.2.2', [5]], ['1.2.2E', [6]]], [['1.3.2', [8]], ['1.3.2E', [9]]]], [[['1.2.2', [8]], ['1.2.2E', [7]]], [['1.3.2', [5]], ['1.3.2E', [4]]]]]));
    chk(name, 'named', 'no name conflict is invented: the rows agree on every name', A.conf + ' ' + Z.conf, '0 0');
    chk(name, 'said', 'the report box names them and says the rule', [/A heading two rows place under different parents — 2: it goes under the breakout heading \(the one carrying the letter\), whatever order the rows are in/.test(A.box),
      /1\.2\.2\.1E O&M1\.2\.2E ECU Propulsion1\.2\.2 Propulsion \(row 5\); 1\.2\.2E ECU Propulsion \(row 6\)/.test(A.box)].join(','), 'true,true');
    chk(name, 'said', 'and the status line counts them among the rows named for a look', /No row left out; 2 named for a look/.test(A.stat), true);
    // CONTROL — the same lines with the rows agreeing (each E heading's own row names the breakout too): nothing to name
    const agree = rows.map(o => (o.wbs === '1.2.2.1E' ? Object.assign({}, o, { ces: ['Manpower', 'Maintenance', 'ECU Propulsion', 'Engine shop ECU'] })
      : o.wbs === '1.3.2.1E' ? Object.assign({}, o, { ces: ['Manpower', 'Depot', 'ECU Airframe', 'Wing shop ECU'] }) : o));
    const C = await look(agree);
    chk(name, 'the rule', 'CONTROL — rows that agree name nothing and give the same tree and split', J([C.ups, C.box, J(C.up), C.split]), J([[], 'none', wantUp, wantSplit]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}

// v2.12 RV4 (second review S03): ANY ANSWER GIVEN FOR A LAYOUT IS REMEMBERED, AS THE BOX SAYS. A field whose own title heads two
// columns was settled only by an answer naming one of them: an answer naming a column of another title, or "this file has no such
// column" for an optional field, was stored and asked again on every import. (a) Columns A and J are titled "Rollup Value?" and the
// flags are in H, "Rollup Flag": answered H, the next two imports read H without asking ($3M subtotal over its $1M and $2M parts:
// reading A or J keeps $6M). (b) CCAR Description titled twice, answered "no such column": not asked again. CONTROL: an answer
// naming one of the two same-titled columns (RV1's case) is still read. FAILS ON c81e995: (a) and (b) are asked on every import.
{
  const name = 'v2.12 RV4 — a title the file carries twice, answered with another title’s column or “no such column”, is remembered and not asked again (S03)';
  try {
    const { J, HDR, book, mkBoard, E, imp, set, answer, asked } = RV1;
    const R3 = [{ wbs: '1.2', roll: 'Yes', ces: ['A', 'B'], d: { 2027: 3000000 } }, { wbs: '1.2.1', ces: ['A', 'B', 'C'], d: { 2027: 1000000 } },
      { wbs: '1.2.2', ces: ['A', 'B', 'D'], d: { 2027: 2000000 } }];
    const H = t => HDR.indexOf(t);
    const kept27 = B => (set(B, '2026ACE').rep || { kept: { v: {} } }).kept.v[2027];
    const how = (B, f) => ((((set(B, '2026ACE').rep || {}).map || {})[f]) || {}).how;
    // (a) A and J titled "Rollup Value?", the flags in H titled "Rollup Flag"
    const HA = HDR.map((t, i) => (i === 0 || t === 'Shared/Unique' ? 'Rollup Value?' : t === 'Rollup Value?' ? 'Rollup Flag' : t));
    const A = mkBoard();
    E(A, `confirm=function(){ return true; }; 'ok'`);
    await imp(A, book(R3, HDR, HA), '2026 ACE flag.xlsx');
    chk(name, 'another title', 'CONTROL — asked, the box naming the two same-titled columns', J([asked(A), E(A, `(document.querySelector('#aceColBody .acecol-why[data-f="roll"]')||{}).textContent||''`)]),
      J([['roll'], 'This file titles 2 columns alike: A, J. Pick the one that holds it.']));
    await answer(A, { roll: H('Rollup Value?') });
    chk(name, 'another title', 'answered H, “Rollup Flag”: the subtotal is left out, FY27 keeps $3,000,000', kept27(A), 3000000);
    const again = [];
    for (let n = 0; n < 2; n++) { await imp(A, book(R3, HDR, HA), '2026 ACE flag.xlsx'); again.push([asked(A), kept27(A), how(A, 'roll')]); if (asked(A)) E(A, `aceColCancel(); 'ok'`); }
    chk(name, 'another title', 'the same layout twice more is read by the answer, as the box promised: not asked, $3,000,000, remembered', J(again), J([[null, 3000000, 'remembered'], [null, 3000000, 'remembered']]));
    // (b) CCAR Description titled twice, answered "no such column"
    const HB = HDR.map(t => (t === 'Shared/Unique' ? 'CCAR Description' : t));
    const Bb = mkBoard();
    E(Bb, `confirm=function(){ return true; }; 'ok'`);
    await imp(Bb, book(R3, HDR, HB), '2026 ACE cdesc.xlsx');
    chk(name, 'no such column', 'CONTROL — CCAR Description on two columns is asked about', J(asked(Bb)), J(['cdesc']));
    await answer(Bb, { cdesc: 'none' });
    chk(name, 'no such column', 'answered “no such column”: imported, recorded as answered so', J([kept27(Bb), (set(Bb, '2026ACE').rep || {}).none]), J([3000000, ['cdesc']]));
    const againB = [];
    for (let n = 0; n < 2; n++) { await imp(Bb, book(R3, HDR, HB), '2026 ACE cdesc.xlsx'); againB.push([asked(Bb), (set(Bb, '2026ACE').rep || {}).none]); if (asked(Bb)) E(Bb, `aceColCancel(); 'ok'`); }
    chk(name, 'no such column', 'the same layout twice more reads the answer: not asked, still answered “no such column”', J(againB), J([[null, ['cdesc']], [null, ['cdesc']]]));
    // CONTROL — the answer naming one of the two same-titled columns (A and H both "Rollup Value?", H picked) is still read
    const HC = HDR.map((t, i) => (i === 0 ? 'Rollup Value?' : t));
    const Cc = mkBoard();
    E(Cc, `confirm=function(){ return true; }; 'ok'`);
    await imp(Cc, book(R3, HDR, HC), '2026 ACE dup.xlsx');
    await answer(Cc, { roll: H('Rollup Value?') });
    await imp(Cc, book(R3, HDR, HC), '2026 ACE dup.xlsx');
    chk(name, 'another title', 'CONTROL — an answer naming one of the two same-titled columns is read again without asking', J([asked(Cc), kept27(Cc)]), J([null, 3000000]));
    [A, Bb, Cc].forEach(x => { try { x.w.close(); } catch {} });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}

// v2.12 RV4 (second review S21): THE GUIDE SAYS WHAT THE IMPORT DOES, AND NOTHING PINNED IT. RV1 rewrote t-ace (review R31): a box asks
// when a title is missing or heads two columns, and about a missing US/PTN/FMS, CCAR Element or CESk, which may be answered "no such
// column"; the report shows 40 named rows of each kind (the board's own ACE_REP_CAP) and says a report not in ORBIT's shape is
// unreadable. RV4 adds the rule for a heading two rows place under different parents (S02). Read from the board's own guide, as RV3
// reads t-ppbe. FAILS ON c81e995: the S02 rule is not in the guide (the other parts pass there: they are here for their mutations).
{
  const name = 'v2.12 RV4 — the guide’s cost estimate section says what the import asks, shows and settles (S21)';
  try {
    const B = boot(), { ev } = B;
    const sec = ev(`(function(){ var t=document.getElementById('helpDoc'), s=t && t.content.querySelector('section[data-id="t-ace"]'); return s? s.textContent : ''; })()`);
    const cap = ev(`String(ACE_REP_CAP)`);
    chk(name, 'asked', 'a box asks when a title is missing or heads two columns', /asks which holds a field, once \(remembered for files laid out the same way, and travelling with the board\), when its title is missing or heads two columns/.test(sec), true);
    chk(name, 'asked', 'and about the optional columns that change what is read, which may be answered no such column',
      /also a missing US\/PTN\/FMS or CCAR Element, and CESk where paragraphs reach level k, which may be answered no such column \(no US\/PTN\/FMS: every row is US\)/.test(sec), true);
    chk(name, 'shown', 'the report’s named rows are capped on screen at the board’s own figure', sec.indexOf('the named rows (' + cap + ' of each kind on screen)') >= 0, true);
    chk(name, 'shown', 'and a report not in ORBIT’s shape is said to be unreadable', /one not in ORBIT’s shape is said to be unreadable/.test(sec), true);
    chk(name, 'shown', 'and the old claims are gone: every named row, a changed title asked once', [/every named row/.test(sec), /If a title has changed/.test(sec)].join(','), 'false,false');
    chk(name, 'settled', 'the rule for a heading two rows place under different parents (S02)', /a heading two rows place under different parents goes under the breakout one, and is named/.test(sec), true);
    try { B.w.close(); } catch {}
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ==== end v2.12 W1 ====

// ==== v2.12 W2 (item 132): a WBS paragraph on every requirement, picked; the Spend Plan Source carries it; the FYDP plan joins STOVL ====
// ---- v2.12 W2 (item 132): the shared fixture -------------------------------------------------------------------------------
// One estimate, hand-built in the contract's shape (set.wbs[ap][CODE] = {n, lv, up}): the import that writes it is W1's, and
// these blocks never need it. O&M's tree has six paragraphs -- 1, 1.2, 1.2.1, 1.2.2, 1.3 and 1.10, so a sort by text (1.10
// before 1.2) and the estimate's own order (1.10 last) disagree -- and Full Fund's has one, 7.7, which O&M must never offer.
// Two O&M lines carry CCaR JSF1 (one spelled jsf1), so its suggestions are 1.2.1 and 1.2.2; a Full Fund line also on JSF1,
// at 1.10 -- a code O&M's tree holds too -- must not be suggested on O&M. Every expectation below is written from these
// literals, never read back.
const W2_TREE = { '1': { n: 'Manpower', lv: 1, up: '' }, '1.2': { n: 'Maintenance', lv: 2, up: '1' },
  '1.2.1': { n: 'Organizational', lv: 3, up: '1.2' }, '1.2.2': { n: 'Depot', lv: 3, up: '1.2' },
  '1.3': { n: 'Training', lv: 2, up: '1' }, '1.10': { n: 'Supply', lv: 2, up: '1' } };
const W2_SET = { label: '2026ACE', ts: 5, years: [2027], appn: {}, skip: {}, fp: 'fp-w2', locked: true,
  lines: [{ ap: 'om', pmo: 'AV', svc: 'USAF', wbs: '1.2.1', ccar: 'JSF1', v: { 2027: 1e6 } },
          { ap: 'om', pmo: 'AV', svc: 'USAF', wbs: '1.2.2', ccar: 'jsf1', v: { 2027: 1e6 } },
          { ap: 'om', pmo: 'AV', svc: 'USAF', wbs: '1.3', ccar: 'JSF9', v: { 2027: 1e6 } },
          { ap: 'ff', pmo: 'AV', svc: 'USAF', wbs: '1.10', ccar: 'JSF1', v: { 2027: 1e6 } }],
  wbs: { om: W2_TREE, ff: { '7.7': { n: 'Full Fund only', lv: 1, up: '' } } } };
const W2_PATH = { '1': 'Manpower', '1.2': 'Manpower › Maintenance', '1.2.1': 'Manpower › Maintenance › Organizational',
  '1.2.2': 'Manpower › Maintenance › Depot', '1.3': 'Manpower › Training', '1.10': 'Manpower › Supply' };
const W2_OPT = c => c + ' — ' + W2_PATH[c];
const w2it = (id, grp, ask, x) => Object.assign({ id, grp, team: grp, sect: '', custom: false, title: id + ' title', event: id + ' event',
  ccar: '', fy26: ask.map(() => 0), ask, alloc: null }, x || {});
// the in-page helpers: type into a field the way a person does (the event its typing fires), open the Add box for AV
const W2_DRIVE = `(function(){
  globalThis.__w2put=function(id, v){ var e=document.getElementById(id); if(!e) throw new Error('no #'+id);
    e.value=String(v); e.dispatchEvent(new Event(e.tagName==='SELECT'? 'change' : 'input', {bubbles:true})); };
  globalThis.__w2add=function(){ if(arOn()) arHide(); toggleAdd(); if(typeof dlgSync==='function') dlgSync();
    if(!document.getElementById('arOffStep').hidden) __w2put('arOffice', 'AV'); };
  globalThis.__w2fill=function(o){ __w2put('arEvent', 'Added in the box'); document.getElementById('arPtO').click();
    __w2put('arV0', '1000'); __w2put('arOb', OB_CATS[0]);
    var e=flowEntsAZ().filter(function(x){ return !destKeyIsOgc(x.k); })[0]; __w2put('arTo', e.k);
    if(o.ccar!==undefined) __w2put('arCcar', o.ccar);
    if(o.wbs!==undefined) __w2put('arWbs', o.wbs);
    __w2put('arDesc', 'What it buys'); __w2put('arCons', 'What is lost'); };
  globalThis.__w2opts=function(sel){ return [].map.call(document.querySelectorAll(sel+' option'), function(o){ return [o.value, o.getAttribute('label')||'']; }); };
  return 'ok'; })()`;
// v2.12 (integration): `opt` may give the lanes and the order (the Needs attention block's unfunded primes); the default is the board
// every W2 block uses
const w2Board = (est, opt) => {
  const B = boot();
  seed(B.ev, { services: ['USAF', 'ANG'],
    items: [w2it('A', 'AV', [100, 50], { ccar: 'JSF1' }), w2it('B', 'AV', [80, 0]), w2it('C', 'AV', [60, 0], { ccar: 'JSF9' }),
            w2it('S', 'AV', [400, 0]), w2it('P', 'AV', [300, 0]), w2it('Q', 'AV', [150, 0]), w2it('R', 'AV', [500, 0])],
    disc: (opt && opt.disc) || [1290, 50], mand: [0, 0], order: (opt && opt.order) || ['A', 'B', 'C', 'S', 'P', 'Q', 'R'] });
  B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.ptype={A:'OGC', B:'OGC', C:'OGC', S:'OGC', P:'PRIME', Q:'PRIME', R:'PRIME'};
    DATA.clins=DATA.clins||{}; DATA.clins.P=[{clin:'0001', desc:'P one', ccar:'', ask:[200,0]}, {clin:'0002', desc:'P two', ccar:'', ask:[100,0]}];
    DATA.clins.Q=[{clin:'0001', desc:'Q one', ccar:'', ask:[150,0]}, {clin:'0002', desc:'Q two', ccar:'', ask:[0,0]}];
    CLINS.P=DATA.clins.P; CLINS.Q=DATA.clins.Q;
    S.wbs={B:[{w:'9.9.9', v:[]}], C:[{w:'1.3', v:[]}], S:[{w:'1.2.1', v:[300,0]}, {w:'8.8', v:[100,0]}]};
    S.clinWbs={P:{b0:[{w:'1.2', v:[]}]}, Q:{b0:[{w:'4.4', v:[]}]}};
    ACEDB={ts:9, sets:${JSON.stringify({ '2026ACE': est })}};
    window.prompt=function(m, d){ (globalThis.__w2pr=globalThis.__w2pr||[]).push(String(m)); return null; };
    applyState(S); save(); render(); 'ok'`);
  B.ev(W2_DRIVE);
  return B;
};

// ---- v2.12 W2 (item 132): the pickers ----------------------------------------------------------------------------------------
// A WBS paragraph is PICKED from the estimate's tree in every place one is entered -- the Add box (#arWbs), the edit box
// (#erWbs), a requirement's WBS lines (the WBS panel) and the quick box Classify's column opens (wbsQuick) -- each a text field
// with a datalist of "code — path", the CCaR record's paragraphs first and marked suggested; a code the list holds is taken as
// the estimate writes it; any other is refused with the text kept; a paragraph already stored that the list does not hold is
// kept and flagged; with no estimate naming this appropriation a paragraph is taken as typed, and the field says so. Driven
// through the rendered fields with the events typing fires. On d732259 every check fails but the CONTROLs (no datalist, no name,
// no refusal: '7.7' is added, and a picked "code — path" is stored as typed or refused for its length).
{
  const name = 'v2.12 W2 — a WBS paragraph is picked from the estimate: the Add box, the edit box, the WBS lines and the quick box (item 132)';
  try {
    const J = JSON.stringify;
    const B = w2Board(W2_SET), ev = B.ev;
    const ORDER = ['1', '1.2', '1.3', '1.10'];          // the estimate's order, after JSF1's two suggestions
    // ---- the Add box
    ev(`__w2add(); 'ok'`);
    chk(name, 'the Add box', 'the WBS field is a text field reading the list "arWbsList"',
      ev(`(function(){ var e=document.getElementById('arWbs'); return e.tagName+' '+(e.getAttribute('list')||'')+' '+!!document.getElementById('arWbsList'); })()`), 'INPUT arWbsList true');
    ev(`__w2fill({ccar:'JSF1', wbs:''}); 'ok'`);
    chk(name, 'the Add box', 'the list is every O&M paragraph as "code — path": JSF1’s two first, marked suggested, then the estimate’s order (never Full Fund’s 7.7)',
      ev(`JSON.stringify(__w2opts('#arWbsList'))`),
      J([[W2_OPT('1.2.1'), 'suggested — on CCaR JSF1'], [W2_OPT('1.2.2'), 'suggested — on CCaR JSF1']].concat(ORDER.map(c => [W2_OPT(c), '']))));
    chk(name, 'the Add box', 'with nothing picked the field says where to pick from and names the suggestions, which are never set',
      ev(`document.getElementById('arWbsNote').textContent`),
      'Pick a paragraph of the 2026ACE estimate for O&M — type its code or its name. Suggested for CCaR JSF1 (never set): 1.2.1, 1.2.2.');
    ev(`document.getElementById('arAddBtn').click(); 'ok'`);
    chk(name, 'the Add box', 'CONTROL — a suggestion is not a pick: Add with no WBS is refused for its WBS, nothing added',
      ev(`JSON.stringify([S.custom.length, arOn(), /WBS/.test(document.getElementById('arMsg').textContent)])`), J([0, true, true]));
    ev(`__w2put('arWbs', '1.2.2'); 'ok'`);
    chk(name, 'the Add box', 'the name of the paragraph typed shows under it', ev(`document.getElementById('arWbsNote').textContent`), W2_OPT('1.2.2'));
    ev(`__w2put('arWbs', '7.7'); 'ok'`);
    chk(name, 'the Add box', 'a code the list does not hold is flagged under it as it is typed',
      ev(`JSON.stringify([document.getElementById('arWbsNote').textContent, document.getElementById('arWbsNote').className])`),
      J(['⚠ Not a paragraph of the 2026ACE estimate for O&M — pick one from the list. Suggested for CCaR JSF1 (never set): 1.2.1, 1.2.2.', 'ar-n wbsn off']));
    ev(`document.getElementById('arAddBtn').click(); 'ok'`);
    chk(name, 'the Add box', 'Add with 7.7 is refused, saying why; nothing is added and the box keeps what was typed, marked',
      // (read without throwing: a box that took 7.7 has closed, and its fields are gone -- the check fails on its figures)
      ev(`JSON.stringify([S.custom.length, arOn(), (document.getElementById('arWbs')||{}).value, document.getElementById('arWbs') && document.getElementById('arWbs').getAttribute('aria-invalid'),
        /7\\.7.{0,4} is not a paragraph of the 2026ACE estimate for O&M/.test((document.getElementById('arMsg')||{}).textContent||'')])`), J([0, true, '7.7', 'true', true]));
    ev(`__w2put('arWbs', ${J(W2_OPT('1.2.1'))}); 'ok'`);
    chk(name, 'the Add box', 'picked from the list as "code — path", the field shows the code alone and its name under it',
      ev(`JSON.stringify([document.getElementById('arWbs').value, document.getElementById('arWbsNote').textContent])`), J(['1.2.1', W2_OPT('1.2.1')]));
    ev(`document.getElementById('arAddBtn').click(); 'ok'`);
    const nid = ev(`S.custom.length? S.custom[S.custom.length-1].id : ''`);
    chk(name, 'the Add box', 'a paragraph picked as "code — path" is added, stored as its code alone',
      ev(`JSON.stringify([arOn(), S.custom.length, (S.wbs||{})[${J(nid)}]||null])`), J([false, 1, [{ w: '1.2.1', v: [] }]]));
    // ---- the quick box keeps a stored paragraph the list does not hold, when it is left as it is (OK pressed, nothing typed)
    ev(`wbsQuick('B'); document.getElementById('uipVal').value='9.9.9'; uipDone(true); 'ok'`);
    chk(name, 'the quick box', 'a stored paragraph the estimate does not hold, left as it is, is kept as stored and the box closes',
      ev(`JSON.stringify([/\\bopen\\b/.test(document.getElementById('uipPanel').className), S.wbs.B])`), J([false, [{ w: '9.9.9', v: [] }]]));
    // ---- the edit box
    const box = (id, at) => ev(`(function(){ if(erOn()) erClose(); openEdit(${J(id)}, ${J(at || 'wbs')}); var n=document.getElementById('erWbsNote');
      return JSON.stringify([erOn(), document.activeElement && document.activeElement.id, document.getElementById('erWbs').value, document.getElementById('erWbs').hidden,
        n.textContent, n.className, document.getElementById('erWbs').getAttribute('list'), document.querySelectorAll('#erWbsList option').length]); })()`);
    chk(name, 'the edit box', 'a stored paragraph the estimate does not hold is shown as stored, and flagged',
      box('B'), J([true, 'erWbs', '9.9.9', false, '⚠ 9.9.9 is not a paragraph of the 2026ACE estimate for O&M — kept as stored; pick one to replace it.', 'ar-n wbsn off', 'erWbsList', 6]));
    ev(`__w2put('erDesc', 'Edited'); document.getElementById('erSaveBtn').click(); 'ok'`);
    chk(name, 'the edit box', 'CONTROL — saving another field keeps it, exactly as stored',
      ev(`JSON.stringify([erOn(), S.wbs.B, S.desc.B])`), J([false, [{ w: '9.9.9', v: [] }], 'Edited']));
    box('B'); ev(`__w2put('erWbs', '7.7'); document.getElementById('erSaveBtn').click(); 'ok'`);
    chk(name, 'the edit box', 'a code the list does not hold, typed, is refused on Save: nothing written, the box open, the text kept and marked',
      ev(`JSON.stringify([erOn(), S.wbs.B, (document.getElementById('erWbs')||{}).value, document.getElementById('erWbs') && document.getElementById('erWbs').getAttribute('aria-invalid'),
        /7\\.7.{0,4} is not a paragraph of the 2026ACE estimate for O&M/.test((document.getElementById('erMsg')||{}).textContent||'')])`),
      J([true, [{ w: '9.9.9', v: [] }], '7.7', 'true', true]));
    ev(`__w2put('erWbs', ${J(W2_OPT('1.2.2'))}); 'ok'`);
    chk(name, 'the edit box', 'picked as "code — path", the field shows the code alone and its name under it',
      ev(`JSON.stringify([document.getElementById('erWbs').value, document.getElementById('erWbsNote').textContent])`), J(['1.2.2', W2_OPT('1.2.2')]));
    ev(`document.getElementById('erSaveBtn').click(); 'ok'`);
    chk(name, 'the edit box', 'and Save stores the code alone', ev(`JSON.stringify([erOn(), S.wbs.B])`), J([false, [{ w: '1.2.2', v: [] }]]));
    // a code typed as the estimate does not write it -- lower case, spaced -- is saved as the estimate writes it (capitals, no
    // spaces: aceNormWbs). A paragraph with a letter is put in the tree for this check and taken out after it, so every list
    // below is the fixture's own.
    ev(`ACEDB.sets['2026ACE'].wbs.om['1.2.2E']={n:'Depot breakout', lv:4, up:'1.2.2'}; 'ok'`);
    box('B'); ev(`__w2put('erWbs', ' 1.2.2 e '); document.getElementById('erSaveBtn').click(); 'ok'`);
    chk(name, 'the edit box', 'a code typed in lower case, with spaces, is saved as the estimate writes it',
      ev(`JSON.stringify([erOn(), S.wbs.B])`), J([false, [{ w: '1.2.2E', v: [] }]]));
    ev(`if(erOn()) erClose(); delete ACEDB.sets['2026ACE'].wbs.om['1.2.2E']; 'ok'`);
    chk(name, 'the edit box', 'a split shows its lines’ count and flags the line the estimate does not hold; the keyboard goes to its split',
      box('S'), J([true, 'erWbsSplit', '', true, '2 WBS — split over 2 lines · ⚠ not paragraphs of the 2026ACE estimate for O&M, kept as stored: 8.8', 'ar-n wbsn off', 'erWbsList', 6]));
    ev(`erClose(); 'ok'`);
    // ---- the WBS lines (the WBS panel)
    const panel = () => JSON.parse(ev(`(function(){ var b=document.getElementById('wbsBody');
      return JSON.stringify({lists:[].map.call(b.querySelectorAll('table input.btn'), function(i){ return i.getAttribute('list'); }),
        opts:b.querySelectorAll('#wbsDl option').length, names:[].map.call(b.querySelectorAll('.wbsnm'), function(d){ return d.className+' | '+d.textContent; }),
        src:(b.querySelector('.wbssrc')||{}).textContent||''}); })()`));
    ev(`toggleWbs('req','S',''); 'ok'`);
    chk(name, 'the WBS lines', 'each line is picked from the list, its name under it, the one the estimate does not hold flagged',
      J(panel()), J({ lists: ['wbsDl', 'wbsDl'], opts: 6, names: ['wbsnm | ' + W2_PATH['1.2.1'], 'wbsnm off | ⚠ not a paragraph of the 2026ACE estimate for O&M — kept as stored'],
        src: 'Each paragraph is picked from the 2026ACE estimate for O&M: type its code or its name.' }));
    ev(`(function(){ var i=document.querySelectorAll('#wbsBody table input.btn')[1]; i.value='6.6'; i.dispatchEvent(new Event('change')); })(); 'ok'`);
    chk(name, 'the WBS lines', 'a code the list does not hold is refused: the line keeps 8.8, the field keeps 6.6, marked',
      ev(`JSON.stringify([S.wbs.S[1].w, document.querySelectorAll('#wbsBody table input.btn')[1].value, document.querySelectorAll('#wbsBody table input.btn')[1].getAttribute('aria-invalid')])`),
      J(['8.8', '6.6', 'true']));
    ev(`(function(){ var i=document.querySelectorAll('#wbsBody table input.btn')[1]; i.value=${J(W2_OPT('1.3'))}; i.dispatchEvent(new Event('change')); })(); 'ok'`);
    chk(name, 'the WBS lines', 'one picked as "code — path" is stored as its code, the split’s dollars untouched',
      ev(`JSON.stringify(S.wbs.S)`), J([{ w: '1.2.1', v: [300, 0] }, { w: '1.3', v: [100, 0] }]));
    ev(`wbsOpen=null; render(); 'ok'`);
    // ---- the quick box (Classify's WBS column)
    const uip = () => JSON.parse(ev(`JSON.stringify([/\\bopen\\b/.test(document.getElementById('uipPanel').className), document.getElementById('uipVal').value,
      document.getElementById('uipVal').getAttribute('list'), __w2opts('#uipList').slice(0, 2), document.getElementById('uipNote').textContent, (globalThis.__w2pr||[]).filter(function(m){ return /WBS/.test(m); }).length])`));
    ev(`wbsQuick('C'); 'ok'`);
    chk(name, 'the quick box', 'it is the in-app box, never the browser’s prompt: the list, JSF9’s 1.3 first and suggested, and the name of the one held',
      J(uip()), J([true, '1.3', 'uipList', [[W2_OPT('1.3'), 'suggested — on CCaR JSF9'], [W2_OPT('1'), '']], W2_OPT('1.3'), 0]));
    ev(`document.getElementById('uipVal').value='5.5'; uipDone(true); 'ok'`);
    chk(name, 'the quick box', 'a code the list does not hold is refused and the box opens again holding it; the WBS stays 1.3',
      ev(`JSON.stringify([/\\bopen\\b/.test(document.getElementById('uipPanel').className), document.getElementById('uipVal').value, S.wbs.C,
        /5\\.5.{0,4} is not a paragraph/.test(document.getElementById('shareStat').textContent)])`), J([true, '5.5', [{ w: '1.3', v: [] }], true]));
    ev(`(function(){ var u=document.getElementById('uipVal'); u.value=${J(W2_OPT('1.10'))}; u.dispatchEvent(new Event('input')); })(); 'ok'`);
    chk(name, 'the quick box', 'picked as "code — path", the field shows the code alone and its name under it',
      ev(`JSON.stringify([document.getElementById('uipVal').value, document.getElementById('uipNote').textContent])`), J(['1.10', W2_OPT('1.10')]));
    ev(`uipDone(true); 'ok'`);
    chk(name, 'the quick box', 'one the list holds is taken, and the box closes', ev(`JSON.stringify([/\\bopen\\b/.test(document.getElementById('uipPanel').className), S.wbs.C])`),
      J([false, [{ w: '1.10', v: [] }]]));
    // ---- with no estimate naming this appropriation (Full Fund's tree only): typed as before, and said
    const N = w2Board(Object.assign({}, W2_SET, { wbs: { ff: W2_SET.wbs.ff } })), nv = N.ev;
    nv(`__w2add(); __w2fill({wbs:'7.7'}); 'ok'`);
    chk(name, 'no estimate', 'the field says there is nothing to pick from, and offers no list',
      nv(`JSON.stringify([document.getElementById('arWbsNote').textContent, document.querySelectorAll('#arWbsList option').length])`),
      J(['No cost estimate names O&M’s WBS paragraphs: the paragraph is taken as typed.', 0]));
    nv(`document.getElementById('arAddBtn').click(); 'ok'`);
    chk(name, 'no estimate', 'CONTROL — a paragraph is taken as typed', nv(`JSON.stringify((S.wbs||{})[(S.custom[S.custom.length-1]||{}).id]||null)`), J([{ w: '7.7', v: [] }]));
    nv(`wbsQuick('C'); 'ok'`);
    chk(name, 'no estimate', 'the quick box says so, in the browser’s own prompt',
      nv(`(globalThis.__w2pr||[]).filter(function(m){ return /WBS/.test(m); }).slice(-1)[0]||''`), 'WBS paragraph number for this requirement — no cost estimate names O&M’s paragraphs, so it is taken as typed');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}

// ---- v2.12 W2 (item 132): Needs attention ------------------------------------------------------------------------------------
// Seven requirements, each case stated: A (OGC) has no WBS; B's 9.9.9 and S's second line 8.8 are not in the estimate; C is on
// 1.3; P is a prime whose CLIN 0002 carries $100 and no WBS; Q is a prime whose CLIN 0002 carries nothing (its 0001 is on 4.4,
// not in the estimate); R is a prime with no CLIN at all. The lanes pay everyone but R in full, R $200 of $500. So Without a WBS
// is A, P and R ($150, $300, $200), the heading 4 of 7 requirements and $690 of $1,340 funded; WBS not in the estimate is B, S
// and Q. Each opens the edit box at the WBS (a split at its split, a prime its CLIN drill). On d732259 every check fails.
{
  const name = 'v2.12 W2 — Needs attention lists every requirement without a WBS, and every WBS the estimate does not hold (item 132)';
  try {
    const J = JSON.stringify;
    const B = w2Board(W2_SET), ev = B.ev;
    chk(name, 'fixture', 'the draws: A 100+50, B 80, C 60, S 400, P 300, Q 150, R 200 of 500 (a CONTROL on the fixture)',
      ev(`(function(){ var T=tiers(); return JSON.stringify(S.order.map(function(id){ return T[id].dT+T[id].mT; })); })()`), J([150, 80, 60, 400, 300, 150, 200]));
    // v2.12 RV2 (K01, K05): the heading's funded dollars are those that go out on a paragraph -- P's $200 on CLIN 0001's 1.2
    // among them -- so $890 of $1,340, where every dollar of a requirement with any paragraph used to count ($690)
    chk(name, 'the lists', 'Without a WBS: A, P and R, each with its funded dollars; the coverage: 4 of 7 requirements, $890 of $1,340',
      ev(`(function(){ var A=attLists(); return JSON.stringify([A.wbs.map(function(r){ return [r.id, r.funded]; }), A.wbs.cov]); })()`),
      J([[['A', 150], ['P', 300], ['R', 200]], { n: 4, of: 7, f: 890, fof: 1340 }]));
    chk(name, 'the lists', 'WBS not in the estimate: B, S and Q, each paragraph as stored (a prime’s naming its CLIN)',
      ev(`JSON.stringify(attLists().wbsx.map(function(r){ return [r.id, r.n]; }))`), J([['B', ['9.9.9']], ['S', ['8.8']], ['Q', ['4.4 (CLIN 0001)']]]));
    const entries = JSON.parse(ev(`JSON.stringify([].map.call(document.querySelectorAll('#posture .ppatt .e'), function(e){ return [e.getAttribute('onclick'), e.textContent.replace(/\\s+/g,' ').trim()]; }).slice(-2))`));
    chk(name, 'the posture', 'the two entries come last, saying what they count', J(entries),
      J([['attShow("wbs")', '▦ 3 without a WBS'], ['attShow("wbsx")', '≠ 3 WBS not in the estimate']]));
    const open = k => JSON.parse(ev(`(function(){ var b=[].filter.call(document.querySelectorAll('#posture .ppatt button.e'), function(e){ return e.getAttribute('onclick')==='attShow(${J(k)})'; })[0];
      if(!b) return JSON.stringify({none:true}); b.click();
      return JSON.stringify({title:document.getElementById('attTitle').textContent, rows:[].slice.call(document.querySelectorAll('#attBody .atttab tr')).slice(1).map(function(r){
        return [].slice.call(r.children).slice(0,-1).map(function(c){ return c.textContent.trim(); }).join(' · '); })}); })()`));
    let L = open('wbs');
    // v2.12 RV2 (K01, K05, K09): each row also says what goes out with no WBS, and its dollars -- P's CLIN 0002 $100, R's money on
    // no CLIN at all
    chk(name, 'Without a WBS', 'its heading states the coverage; its rows are A, P and R with why, what goes out blank and their funded dollars, and the total',
      J(L), J({ title: '▦ WITHOUT A WBS — 4 of 7 requirements have one · $890 of $1,340 funded',
        rows: ['1 · A event · AV · no paragraph · $150 · $150', '5 · P event · AV · CLIN 0002 has no paragraph · $100 · $300', '7 · R event · AV · USAF money on no CLIN · $200 · $200',
          ' · 3 requirements ·  ·  · $450 · $650'] }));
    ev(`attClose(); 'ok'`);
    L = open('wbsx');
    chk(name, 'WBS not in the estimate', 'its heading names the estimate; its rows are each paragraph as stored, with the funded dollars',
      J(L), J({ title: '≠ WBS NOT IN THE ESTIMATE — 2026ACE estimate for O&M',
        rows: ['2 · B event · AV · 9.9.9 · $80', '4 · S event · AV · 8.8 · $400', '6 · Q event · AV · 4.4 (CLIN 0001) · $150', ' · 3 requirements ·  ·  · $630'] }));
    // Go to it
    const go = (k, id) => JSON.parse(ev(`(function(){ attClose(); attShow(${J(k)});
      var b=[].filter.call(document.querySelectorAll('#attBody .attgo'), function(x){ return (x.getAttribute('onclick')||'').indexOf(${J(J(id))})>=0; })[0];
      if(!b) return JSON.stringify({none:true}); b.click();
      var r={open:attOpen, edit:erOn()? erOpen : '', at:document.activeElement? document.activeElement.id : '', clin:!!clinOpen[${J(id)}], cur:curRow};
      if(erOn()) erClose(); clinOpen={}; render(); return JSON.stringify(r); })()`));
    chk(name, 'Go to it', 'A: the edit box opens on A at its WBS', J(go('wbs', 'A')), J({ open: null, edit: 'A', at: 'erWbs', clin: false, cur: 'A' }));
    chk(name, 'Go to it', 'S (a split): the edit box opens on S, the keyboard on its split', J(go('wbsx', 'S')), J({ open: null, edit: 'S', at: 'erWbsSplit', clin: false, cur: 'S' }));
    chk(name, 'Go to it', 'P (a prime): its CLIN drill opens, never the edit box', J(go('wbs', 'P')), J({ open: null, edit: '', at: '', clin: true, cur: 'P' }));
    // fixed, it leaves the list at once
    ev(`S.wbs.A=[{w:'1.3', v:[]}]; S.clinWbs.P.b1=[{w:'1.2.2', v:[]}]; save(); render(); 'ok'`);
    chk(name, 'fixed', 'a paragraph given leaves the list and the coverage counts it',
      ev(`(function(){ var A=attLists(); return JSON.stringify([A.wbs.map(function(r){ return r.id; }), A.wbs.cov.n, A.wbs.cov.f]); })()`), J([['R'], 6, 1140]));
    // with no estimate naming this appropriation nothing is "not in it": that list is empty and its entry is not drawn
    const N = w2Board(Object.assign({}, W2_SET, { wbs: { ff: W2_SET.wbs.ff } }));
    chk(name, 'no estimate', 'WBS not in the estimate is empty, and the posture has no entry for it; Without a WBS still counts A, P and R',
      N.ev(`JSON.stringify([attLists().wbsx.length, [].some.call(document.querySelectorAll('#posture .ppatt button'), function(b){ return b.getAttribute('onclick')==='attShow("wbsx")'; }), attLists().wbs.map(function(r){ return r.id; })])`),
      J([0, false, ['A', 'P', 'R']]));
    // v2.12 (integration): A PRIME IS WITHOUT A WBS BY ITS CLINS, FUNDED OR NOT. Above, P's CLIN 0002 and R's money on no CLIN go
    // out blank on the Spend Plan Source, so RV2's rule (list what goes out blank) lists them whatever wbsStateOf says -- and on the
    // merged board v212-w2-att-prime-any-clin and -no-clins SURVIVED. Here the lanes run dry before P and R: nothing of theirs goes
    // out, and only the rule that a prime is without a WBS while a CLIN asking money has none, or while it has no CLIN, lists them.
    const U = w2Board(W2_SET, { disc: [790, 50], order: ['A', 'B', 'C', 'S', 'Q', 'P', 'R'] });
    chk(name, 'unfunded primes', 'the lanes pay P and R nothing, and nothing of theirs goes out on the Spend Plan Source (a CONTROL on the fixture)',
      U.ev(`(function(){ var T=tiers(), W=wbsBlankOf(); return JSON.stringify(['P', 'R'].map(function(id){ return [T[id].dT+T[id].mT, W.by[id]? W.by[id].amt : 0]; })); })()`),
      J([[0, 0], [0, 0]]));
    chk(name, 'unfunded primes', 'Without a WBS lists A, P and R: P because CLIN 0002 asks $100 and has no paragraph (though CLIN 0001 has one), R because it has no CLIN',
      U.ev(`JSON.stringify(attLists().wbs.map(function(r){ return r.id==='A'? [r.id] : [r.id, r.funded, r.why]; }))`),
      J([['A'], ['P', 0, ['CLIN 0002 has no paragraph']], ['R', 0, ['no CLIN']]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}

// ---- v2.12 W2 (item 132): Classify in bulk -----------------------------------------------------------------------------------
// With the estimate naming O&M's paragraphs, Classify's bulk set offers the WBS, its values the pickers' own list; it reaches A,
// B and C and leaves S (split across paragraphs: one paragraph written over it would erase the split) and the three primes
// (their WBS is per CLIN) alone. Driven through the grid's rendered controls. On d732259 the WBS is never offered in bulk; the
// CONTROLs pass there (no gap reported, and with no estimate no bulk WBS).
{
  const name = 'v2.12 W2 — Classify sets one WBS paragraph on many requirements, from the estimate (item 132)';
  try {
    const J = JSON.stringify;
    const B = w2Board(W2_SET), ev = B.ev;
    ev(`matOpen=true; matPmo='ALL'; matMissing=''; render(); 'ok'`);
    const pick = (i, v) => ev(`(function(){ var s=document.querySelectorAll('#matBody .mat-bulk select')[${i}]; if(!s) return 'no select';
      s.value=${J(v)}; s.dispatchEvent(new Event('change')); return s.value; })()`);
    chk(name, 'offered', 'the bulk set offers the WBS', ev(`[].map.call((document.querySelectorAll('#matBody .mat-bulk select')[0]||{options:[]}).options, function(o){ return o.value; }).indexOf('wbs')>=0`), true);
    pick(0, 'wbs');
    chk(name, 'offered', 'its values are the estimate’s paragraphs, as the pickers show them, in the estimate’s order',
      ev(`JSON.stringify([].map.call((document.querySelectorAll('#matBody .mat-bulk select')[1]||{options:[]}).options, function(o){ return [o.value, o.textContent]; }).slice(1))`),
      J(['1', '1.2', '1.2.1', '1.2.2', '1.3', '1.10'].map(c => [c, W2_OPT(c)])));
    pick(1, '1.2.2');
    // v2.12 RV2 (K04): S and the primes are said for what they are -- neither "never offers" the field
    chk(name, 'preview', 'A blank, B and C overwritten, S (a WBS split) and the three primes (their WBS is per CLIN) left alone',
      ev(`(document.querySelector('#matBody .mat-prev')||{}).textContent||''`),
      '1 blank · 0 already this · 2 overwritten · 1 with a WBS split, left alone so the split is kept · 3 primes, whose WBS is per CLIN, left alone');
    ev(`(function(){ var b=[].filter.call(document.querySelectorAll('#matBody .mat-bulk button'), function(x){ return /^Apply$/.test(x.textContent.trim()); })[0]; b.click(); })(); 'ok'`);
    chk(name, 'applied', 'A, B and C are on 1.2.2; S keeps its split; no prime gains a requirement-level WBS, and their CLINs are untouched',
      ev(`JSON.stringify([S.wbs.A, S.wbs.B, S.wbs.C, S.wbs.S, ['P','Q','R'].map(function(id){ return (S.wbs||{})[id]||null; }), S.clinWbs])`),
      J([[{ w: '1.2.2', v: [] }], [{ w: '1.2.2', v: [] }], [{ w: '1.2.2', v: [] }], [{ w: '1.2.1', v: [300, 0] }, { w: '8.8', v: [100, 0] }], [null, null, null],
        { P: { b0: [{ w: '1.2', v: [] }] }, Q: { b0: [{ w: '4.4', v: [] }] } }]));
    chk(name, 'applied', 'the grid’s WBS cell names the paragraph under its button',
      ev(`(function(){ var r=[].filter.call(document.querySelectorAll('#matBody .mat-tab tr'), function(tr){ return /A event|A title/.test(tr.children[0].textContent); })[0];
        var d=r? r.querySelector('.wbsnm') : null; return d? d.textContent : 'none'; })()`), W2_PATH['1.2.2']);
    chk(name, 'offered', 'CONTROL — with a list, the WBS is no gap in the bulk set', ev(`JSON.stringify(matBulkOk())`), '[]');
    const N = w2Board(Object.assign({}, W2_SET, { wbs: { ff: W2_SET.wbs.ff } }));
    chk(name, 'no estimate', 'CONTROL — with no estimate naming O&M there is no bulk WBS, and none is asked for',
      N.ev(`JSON.stringify([!!matBulk().wbs, matBulkOk()])`), J([false, []]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}

// What one board's export wrote, read back from its bytes with the board's own reader (as recon's w6Book)
const w2Book = (W, fn) => W.eval(`(async function(){
  var cap=null,_B=window.Blob,msg='';
  window.alert=function(m){ msg+=String(m); }; window.confirm=function(){ return true; };
  window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
  try{ ${fn}(); }catch(e){ window.Blob=_B; return JSON.stringify({__err:'threw '+String((e&&e.message)||e)}); }
  window.Blob=_B;
  if(!cap) return JSON.stringify({__err:'no file: '+msg.slice(0,80)});
  var ab=cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength);
  return JSON.stringify(await xlsxRead(ab)); })()`);
// largest remainder, worked out here -- never the board's apportion(): floor each share, then the dollars left over one at a
// time to the largest fractions, ties to the earlier
const w2LR = (tot, w) => { const s = w.reduce((a, b) => a + b, 0); const q = w.map(x => Math.floor(tot * x / s));
  let left = tot - q.reduce((a, b) => a + b, 0);
  w.map((x, i) => ({ i, r: tot * x - q[i] * s })).sort((a, b) => (b.r - a.r) || (a.i - b.i)).forEach(o => { if (left > 0) { q[o.i]++; left--; } });
  return q; };
// v2.12 RV2 (K06): a service's money over its paragraphs ONCE, then each piece by largest remainder from what each paragraph
// still has to take -- the board's srcWbsSpread, worked out here from w2LR
const w2Spread = (pieces, weights) => { const left = w2LR(pieces.reduce((a, b) => a + b, 0), weights);
  return pieces.map(p => { const s = w2LR(p, left.map(x => Math.max(0, x))); s.forEach((v, k) => { left[k] -= v; }); return s; }); };

// ---- v2.12 W2 (item 132): the Spend Plan Source's column 23 -------------------------------------------------------------------
// Brad, 28 Oct 2026: "Yes, the WBS in ORBIT should populate in the WBS column of that file for that line item." Four requirements,
// every case stated: A on one paragraph (1.2.1), whole; B split as the office typed it -- USAF $300 on 1.2.1 and $200 on 1.3 of
// a $700 ask, ANG $100 on 1.2.1 of $200 -- with the rest not yet assigned; C on none; P a prime whose CLIN 0001 is on 1.2.2 and
// 0002 on 1.10. The lanes pay B's USAF $351 discretionary and $349 mandatory, so the split is apportioned and cannot come out
// even by luck (351 over 300 / 200 / 200 is 151 / 100 / 100; 349 is 149 / 100 / 100). Every expected line is worked out here
// from those literals; the workbook is read from its bytes. On d732259 the column is blank on every line, B goes out as one
// line per service and lane, and the status line names nothing: every check fails but the CONTROLs.
await (async () => {
  const name = 'v2.12 W2 — the Spend Plan Source carries each line’s WBS paragraph, split as the office typed it (item 132)';
  try {
    const J = JSON.stringify;
    const X = boot();
    seed(X.ev, { services: ['USAF', 'ANG'], items: [w2it('A', 'AV', [500, 100]), w2it('B', 'AV', [700, 200]), w2it('C', 'AV', [90, 0]), w2it('P', 'AV', [300, 0])],
      disc: [851, 300], mand: [739, 0], order: ['A', 'B', 'C', 'P'] });
    const BUD = { 'USAF|disc': 'USAF O&M- CAM Discretionary AV', 'USAF|mand': 'USAF O&M - CAM OBBBA Mandatory AV',
      'ANG|disc': 'USAF O&M - ANG CAM Discretionary AV', 'ANG|mand': 'USAF O&M - ANG CAM OBBBA Mandatory AV' };
    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.ptype={A:'OGC', B:'OGC', C:'OGC', P:'PRIME'};
      DATA.clins=DATA.clins||{}; DATA.clins.P=[{clin:'0001', desc:'P one', ccar:'', ask:[100,0]}, {clin:'0002', desc:'P two', ccar:'', ask:[200,0]}]; CLINS.P=DATA.clins.P;
      S.wbs={A:[{w:'1.2.1', v:[]}], B:[{w:'1.2.1', v:[300,100]}, {w:'1.3', v:[200,0]}]};
      S.clinWbs={P:{b0:[{w:'1.2.2', v:[]}], b1:[{w:'1.10', v:[]}]}};
      ACEDB={ts:9, sets:${J({ '2026ACE': W2_SET })}};
      BUDDB={ts:1700000000060, files:[], rows:${J(Object.values(BUD))}.map(budParseName).filter(Boolean)}; _budRegCache=null;
      applyState(S); save(); 'ok'`);
    chk(name, 'fixture', 'the lanes (a CONTROL on the fixture): A 500/100 disc; B 351/200 disc + 349 mand; C 90 mand; P 300 mand',
      X.ev(`(function(){ var T=tiers(); return ['A','B','C','P'].map(function(id){ return T[id].d.join('/')+'+'+T[id].m.join('/'); }).join(' '); })()`),
      '500/100+0/0 351/200+349/0 0/0+90/0 0/0+300/0');
    const NM = { '1.2.1': 'Organizational', '1.3': 'Training', '1.2.2': 'Depot', '1.10': 'Supply' };
    const cell = c => c ? c + ' - ' + NM[c] : '';
    const W = [];
    const add = (id, key, amt, c) => { if (amt) W.push([id, key, amt, cell(c)]); };
    add('A', 'USAF|disc', 500, '1.2.1'); add('A', 'ANG|disc', 100, '1.2.1');
    // v2.12 RV2 (K06): the rule is the service's money split once, then each lane from what each paragraph has left (w2Spread);
    // on this fixture it gives what the old split lane by lane gave -- the RV2 block below makes the two disagree
    { const [p, q] = w2Spread([351, 349], [300, 200, 200]); add('B', 'USAF|disc', p[0], '1.2.1'); add('B', 'USAF|disc', p[1], '1.3'); add('B', 'USAF|disc', p[2], '');
      add('B', 'USAF|mand', q[0], '1.2.1'); add('B', 'USAF|mand', q[1], '1.3'); add('B', 'USAF|mand', q[2], ''); }
    { const p = w2LR(200, [100, 0, 100]); add('B', 'ANG|disc', p[0], '1.2.1'); add('B', 'ANG|disc', p[1], '1.3'); add('B', 'ANG|disc', p[2], ''); }
    add('C', 'USAF|mand', 90, '');
    { const p = w2LR(300, [100, 200]); add('P', 'USAF|mand', p[0], '1.2.2'); add('P', 'USAF|mand', p[1], '1.10'); }
    chk(name, 'fixture', 'the split cannot come out even by luck (a CONTROL on the oracle): 351 is 151 / 100 / 100, 349 is 149 / 100 / 100',
      J([w2LR(351, [300, 200, 200]), w2LR(349, [300, 200, 200])]), J([[151, 100, 100], [149, 100, 100]]));
    const bk = JSON.parse(await w2Book(X.w, 'exportSrc'));
    chk(name, 'workbook', 'the Spend Plan Source builds and reads back', bk.__err || 'ok', 'ok');
    const src = Object.values(bk).find(rs => (rs || []).length > 1) || [];
    const HDR = JSON.parse(X.ev('JSON.stringify(SRC_HDR)'));
    chk(name, 'layout', 'CONTROL — the same 32 columns in the same order, column 23 still Spares WBS',
      J([(src[0] || []).map(c => String(c ?? '')), HDR[23]]), J([HDR, 'Spares WBS']));
    const svcOf = b => Object.keys(BUD).find(k => BUD[k] === b) || ('no budget ' + b);
    const got = src.slice(1).map(r => ({ id: String(r[7] ?? '').replace(/ event$/, ''), key: svcOf(String(r[4] ?? '')), amt: typeof r[9] === 'number' ? r[9] : NaN,
      w: String(r[23] ?? ''), row: r }));
    const fmt = l => [l.id, l.key, l.amt, l.w].join(' · ');
    chk(name, 'lines', 'every line: requirement, service and lane, amount and WBS -- a line per paragraph, the unassigned part on a line with the column blank',
      J(got.map(fmt).sort()), J(W.map(w => w.join(' · ')).sort()));
    chk(name, 'lines', 'each line’s WBS reads back to its code (srcWbsPara, as WBS from execution data reads the column)',
      X.ev(`JSON.stringify(${J(got.map(l => l.w))}.map(srcWbsPara))`), J(got.map(l => l.w.split(' - ')[0])));
    // THE LINES ADD UP TO THE LINE THEY REPLACE: per requirement, service and lane, what the lane paid
    const T = JSON.parse(X.ev(`JSON.stringify(tiers())`));
    ['A', 'B', 'C', 'P'].forEach(id => ['USAF', 'ANG'].forEach((sv, i) => ['disc', 'mand'].forEach(ln => {
      const draw = (ln === 'disc' ? T[id].d : T[id].m)[i] || 0; if (!draw) return;
      chk(name, 'adds up · ' + id + ' · ' + sv + ' ' + ln, 'its lines add up to what the lane paid, to the dollar',
        got.filter(l => l.id === id && l.key === sv + '|' + ln).reduce((a, l) => a + l.amt, 0), draw); })));
    // AND EVERY OTHER CELL IS THE LINE'S OWN: B's USAF discretionary lines differ only in Amount and WBS
    // (read over the header's 32 columns: the reader drops a row's empty cells at its end, and a blank WBS can be one of them)
    const bud = got.filter(l => l.id === 'B' && l.key === 'USAF|disc').map(l => J(HDR.map((h, j) => String(l.row[j] ?? '')).filter((c, j) => j !== 9 && j !== 23)));
    chk(name, 'layout', 'a requirement’s paragraph lines differ only in Amount and WBS', bud.length + ':' + new Set(bud).size, '3:1');
    chk(name, 'layout', 'a prime’s CLIN lines carry their CLIN, each with the CLIN’s own paragraph',
      J(got.filter(l => l.id === 'P').map(l => [String(l.row[25] ?? ''), l.w])), J([['0001', cell('1.2.2')], ['0002', cell('1.10')]]));
    // THE EXPORT NAMES THE REQUIREMENTS WITH A LINE AND NO PARAGRAPH: B (three unassigned lines) and C (one), never A or P
    // v2.12 RV2 (K14): the whole sentence -- it was cut at the dash, so its pointer was never read: it sent the person to record
    // fields and a Needs attention list that held neither B's unassigned part nor a prime's money on no CLIN. Both are on it now.
    chk(name, 'said', 'the status line names B and C, how many lines each, and the list that holds both',
      X.ev(`document.getElementById('shareStat').textContent.replace(/^.*?(⚠ \\d+ lines? go(es)? out with no WBS paragraph.*?fix\\.).*$/, '$1').trim()`),
      '⚠ 4 lines go out with no WBS paragraph, on 2 requirements: B event (3 lines), C event — Needs attention › ▦ without a WBS lists each, with what to fix.');
    chk(name, 'said', 'and that list holds B and C, with the dollars the file sends blank',
      X.ev(`JSON.stringify(attLists().wbs.map(function(r){ return [r.id, r.blank]; }))`), J([['B', 300], ['C', 90]]));
    // the reconciliation of the offices' planning shares reads the same lines: they still add to the draw (a CONTROL that the
    // split leaves officeClinRecon whole)
    chk(name, 'agreement', 'CONTROL — the offices’ CLIN reconciliation still adds to P’s draw',
      X.ev(`(function(){ var R=officeClinRecon(); var p=R.reqs.filter(function(r){ return r.id==='P'; })[0]; return p? p.offices.reduce(function(a,o){ return a+o.cd+o.cm; }, 0) : -1; })()`), 300);
    // v2.12 (integration): THE SPLIT ONCE IS IN WHOLE DOLLARS. Above, B's USAF $700 over 300 / 200 / 200 divides exactly, so a split
    // in fractions of a dollar gives the same lines, and on the merged board v212-w2-src-fraction SURVIVED: since RV2 (K06) each lane
    // takes its share from what each paragraph has left, by largest remainder, so the lines are whole dollars either way, and only
    // WHICH lane carries the odd dollar shows the difference. E asks $300 on USAF, typed $200 on 1.2.1 and $100 on 1.3; the lanes pay
    // $50 discretionary and $50 mandatory. Split once in whole dollars: $67 / $33, so discretionary $34 / $16, mandatory $33 / $17.
    // In fractions ($66.67 / $33.33) the odd dollar lands on the other lane: $33 / $17 and $34 / $16.
    const Y = boot();
    seed(Y.ev, { services: ['USAF'], items: [w2it('E', 'AV', [300])], disc: [50], mand: [50], order: ['E'] });
    Y.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.ptype={E:'OGC'}; S.wbs={E:[{w:'1.2.1', v:[200]}, {w:'1.3', v:[100]}]};
      ACEDB={ts:9, sets:${J({ '2026ACE': W2_SET })}};
      BUDDB={ts:1700000000060, files:[], rows:${J([BUD['USAF|disc'], BUD['USAF|mand']])}.map(budParseName).filter(Boolean)}; _budRegCache=null;
      applyState(S); save(); 'ok'`);
    chk(name, 'odd dollar', 'the lanes pay E $50 discretionary and $50 mandatory (a CONTROL on the fixture)',
      Y.ev(`(function(){ var T=tiers(); return T.E.d.join('/')+'+'+T.E.m.join('/'); })()`), '50+50');
    { const [p, q] = w2Spread([50, 50], [200, 100]);
      chk(name, 'odd dollar', 'CONTROL on the oracle: split once, $67 / $33; discretionary $34 / $16, mandatory $33 / $17', J([p, q]), J([[34, 16], [33, 17]]));
      const yb = JSON.parse(await w2Book(Y.w, 'exportSrc'));
      const ys = Object.values(yb).find(rs => (rs || []).length > 1) || [];
      const yl = ys.slice(1).map(r => [svcOf(String(r[4] ?? '')), typeof r[9] === 'number' ? r[9] : NaN, String(r[23] ?? '')].join(' · '));
      chk(name, 'odd dollar', 'E’s lines: the odd dollar on discretionary’s 1.2.1, as the money split once in whole dollars gives it',
        J(yl.sort()), J([['USAF|disc', p[0], cell('1.2.1')], ['USAF|disc', p[1], cell('1.3')], ['USAF|mand', q[0], cell('1.2.1')], ['USAF|mand', q[1], cell('1.3')]].map(w => w.join(' · ')).sort())); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
})();

// ---- v2.12 W2 (item 132): the FYDP Spend Plan's STOVL tab carries Full Fund's USMC-B --------------------------------------------
// Full Fund names the F-35B service USMC-B where O&M names it STOVL. The workbook's service tabs joined by exact name, so with O&M
// on screen the F-35B money sat on a STOVL tab (O&M's) and a USMC-B tab (Full Fund's), and the STOVL tab read short to every
// USMC reader (modelled on the v2.10 review's A-1 check for FYDP Disconnects). Two boards, chained through the saved file the way
// a consolidated board travels: Full Fund (USAF $100M and USMC-B $40M on F1, USMC-B $25M and USN $10M on F2) and O&M (USAF $200M
// and STOVL $30M on A1, ANG $5M and USMC-C $7M on A2); each on screen in turn. Every figure below is the fixture's literals, read
// back from the workbook's bytes; the service tabs must still partition each appropriation's tab. Initial Spares carries BOTH
// names in one list (STOVL $3M and USMC-B $4M on S1, beside USAF $10M), so the STOVL tab must add every index whose name folds
// to it: the first alone would read $3M. On d732259 both boards print a USMC-B tab, and STOVL never carries Full Fund's money
// with O&M on screen (nor O&M's with Full Fund on screen); every check fails but the CONTROLs.
await (async () => {
  const name = 'v2.12 W2 — the FYDP Spend Plan’s STOVL tab carries Full Fund’s USMC-B, whichever board is open (item 132)';
  try {
    const J = JSON.stringify;
    const ACE6 = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'], FF6 = ['USAF', 'ANG', 'AFRC', 'USMC-B', 'USMC-C', 'USN'];
    const M = 1e6;
    const mk = (html, appn, svcs, items) => { const B = boot({ html, appn });
      seed(B.ev, { services: svcs, items, disc: svcs.map(() => 1e9), mand: svcs.map(() => 0), order: items.map(i => i.id) });
      B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); MS.years[MS.cur]=S; save(); 'ok'`);
      return B; };
    const F = mk(null, 'FULL FUND', FF6, [w2it('F1', 'AV', [100 * M, 0, 0, 40 * M, 0, 0]), w2it('F2', 'AV', [0, 0, 0, 25 * M, 0, 10 * M])]);
    const SP = mk(F.ev('buildSavedHtml()'), 'INITIAL SPARES', ['USAF', 'STOVL', 'USMC-B'], [w2it('S1', 'AV', [10 * M, 3 * M, 4 * M])]);
    const O = mk(SP.ev('buildSavedHtml()'), null, ACE6, [w2it('A1', 'AV', [200 * M, 0, 0, 30 * M, 0, 0]), w2it('A2', 'AV', [0, 5 * M, 0, 0, 7 * M, 0])]);
    const F2 = boot({ html: O.ev('buildSavedHtml()'), appn: 'FULL FUND' });
    // what each appropriation asks, by the tab its service belongs on: USMC-B is STOVL's
    const WANT = { 'O&M': { USAF: 200, ANG: 5, STOVL: 30, 'USMC-C': 7 }, 'Full Fund': { USAF: 100, STOVL: 65, USN: 10 }, 'Initial Spares': { USAF: 10, STOVL: 7 } };
    const TABS = ['USAF', 'ANG', 'STOVL', 'USMC-C', 'USN'];
    for (const [B, label, slug] of [[O, 'O&M on screen', 'om'], [F2, 'Full Fund on screen', 'ff']]) {
      chk(name, label, 'the board on screen (a CONTROL)', B.ev('mySlug()'), slug);
      const bk = JSON.parse(await w2Book(B.w, 'exportFydpPlan'));
      chk(name, label, 'the workbook builds and reads back', bk.__err || 'ok', 'ok');
      const names = Object.keys(bk).filter(k => k !== '__err');
      chk(name, label, 'one tab per service, STOVL among them and no USMC-B tab', J(names.filter(n => TABS.concat(['USMC-B', 'AFRC']).includes(n))), J(TABS));
      // a tab's "summary by appropriation" row for an appropriation, FY27's Requirement and Allocated ($M, read as dollars)
      const row = (tab, app) => { const r = (bk[tab] || []).find(x => x && String(x[0] ?? '') === app); return r ? [Math.round((+r[2] || 0) * M), Math.round((+r[3] || 0) * M)] : [0, 0]; };
      chk(name, label + ' · STOVL', 'the STOVL tab: O&M’s STOVL $30M, Full Fund’s USMC-B $65M and Spares’ two names $7M, requirement and allocated',
        J([row('STOVL', 'O&M'), row('STOVL', 'Full Fund'), row('STOVL', 'Initial Spares')]), J([[30 * M, 30 * M], [65 * M, 65 * M], [7 * M, 7 * M]]));
      chk(name, label + ' · STOVL', 'and its own block for each appropriation',
        J((bk.STOVL || []).map(r => String((r || [])[0] ?? '')).filter(t => /^STOVL — /.test(t))),
        J(['STOVL — summary by appropriation', 'STOVL — O&M', 'STOVL — Full Fund', 'STOVL — Initial Spares']));
      Object.keys(WANT).forEach(app => {
        const tot = (bk[app] || []).filter(r => r && String(r[0] ?? '') === 'TOTAL').map(r => [Math.round((+r[2] || 0) * M), Math.round((+r[3] || 0) * M)])[0] || [-1, -1];
        const sum = TABS.reduce((a, t) => { const v = row(t, app); return [a[0] + v[0], a[1] + v[1]]; }, [0, 0]);
        chk(name, label + ' · partition · ' + app, 'the service tabs add up to the appropriation’s tab, requirement and allocated', J(sum), J(tot));
        chk(name, label + ' · partition · ' + app, 'which is what it asks (a CONTROL: the identity is not two copies of one mistake)',
          J(tot), J([1, 1].map(() => Object.values(WANT[app]).reduce((a, b) => a + b, 0) * M)));
        TABS.forEach(t => chk(name, label + ' · ' + t + ' · ' + app, 'each service tab carries that service’s own dollars', row(t, app)[0], (WANT[app][t] || 0) * M));
      });
      const sumBy = (() => { const S0 = bk.Summary || []; const i = S0.findIndex(r => r && String(r[0] ?? '') === 'By service'); const j = S0.findIndex((r, k) => k > i && r && String(r[0] ?? '') === 'By PMO');
        return S0.slice(i, j).filter(r => r && TABS.concat(['USMC-B', 'AFRC']).includes(String(r[0] ?? ''))).map(r => [String(r[0]), Math.round((+r[2] || 0) * M)]); })();
      chk(name, label + ' · Summary', 'By service: one STOVL row, $102M, and no USMC-B row', J(sumBy),
        J([['USAF', 310 * M], ['ANG', 5 * M], ['STOVL', 102 * M], ['USMC-C', 7 * M], ['USN', 10 * M]]));
    }
    // the panel reads the board on screen: with Full Fund open its service view is STOVL, never USMC-B
    chk(name, 'Full Fund on screen · the panel', 'the panel’s views name STOVL and never USMC-B',
      F2.ev(`(function(){ fydpOpen=true; render(); var o=[].map.call(document.querySelectorAll('#fydpBody option'), function(x){ return x.value; }); fydpOpen=false; render();
        return JSON.stringify([o.indexOf('s:STOVL')>=0, o.indexOf('s:USMC-B')>=0]); })()`), J([true, false]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
})();
// ---- v2.12 RV2 (K00, K07): one reader of a stored paragraph, and nothing rewrites it unasked ------------------------------------
// B's WBS is stored as CCaR writes its column -- "1.2.1 - Organizational", taken as typed before the estimate named O&M's
// paragraphs -- and 1.2.1 is a paragraph of the estimate. Every reader of a stored paragraph now reads it as 1.2.1
// (wbsCodeIn): Needs attention does not call it "not in the estimate", the WBS lines and Classify name it, the tie-out claims
// 1.2.1. And nothing rewrites it unasked: the edit box opens with the text as stored and nothing to save, steps on without
// asking, and a Save of another field keeps it; the quick box keeps it on OK. On c23e8a0 it is flagged in three places, claimed
// as "1.2.1-ORGANIZATIONAL", and the edit box opens dirty, asks on ↓, and rewrites it on Save; every check fails but the
// CONTROLs.
{
  const name = 'v2.12 RV2 — a paragraph stored as CCaR writes it is read as its code everywhere, and nothing rewrites it unasked (K00, K07)';
  try {
    const J = JSON.stringify;
    const B = w2Board(W2_SET), ev = B.ev;
    ev(`S.wbs.B=[{w:'1.2.1 - Organizational', v:[]}]; save(); render();
      window.__rvAsk=[]; window.confirm=function(m){ window.__rvAsk.push(String(m)); return false; }; 'ok'`);
    chk(name, 'Needs attention', 'WBS not in the estimate lists S and Q, never B (1.2.1 is in it)',
      ev(`JSON.stringify(attLists().wbsx.map(function(r){ return r.id; }))`), J(['S', 'Q']));
    ev(`toggleWbs('req','B',''); 'ok'`);
    chk(name, 'the WBS lines', 'B’s line is named, not flagged',
      ev(`JSON.stringify([].map.call(document.querySelectorAll('#wbsBody .wbsnm'), function(d){ return d.className+' | '+d.textContent; }))`),
      J(['wbsnm | ' + W2_PATH['1.2.1']]));
    ev(`wbsOpen=null; render(); 'ok'`);
    chk(name, 'Classify', 'the bulk set reads B as already 1.2.1', ev(`matBulk().wbs.get(itemById('B'))`), '1.2.1');
    ev(`matOpen=true; matPmo='ALL'; matMissing=''; render(); 'ok'`);
    chk(name, 'Classify', 'the grid’s WBS cell names it, and does not flag it',
      ev(`(function(){ var r=[].filter.call(document.querySelectorAll('#matBody .mat-tab tr'), function(tr){ return /B event|B title/.test(tr.children[0].textContent); })[0];
        var d=r? r.querySelector('.wbsnm') : null; return d? d.className+' | '+d.textContent : 'none'; })()`), 'wbsnm | ' + W2_PATH['1.2.1']);
    ev(`matOpen=false; render(); 'ok'`);
    chk(name, 'the tie-out', 'B claims 1.2.1 (aceWbsOf), the code the estimate’s lines carry', ev(`JSON.stringify(aceWbsOf('B'))`), J(['1.2.1']));
    // the edit box: opened with nothing typed, it holds the text as stored, has nothing to save and asks nothing
    ev(`openEdit('B', 'wbs'); dlgSync(); 'ok'`);
    chk(name, 'the edit box', 'it opens holding the paragraph as stored, named, with nothing to save',
      ev(`JSON.stringify([document.getElementById('erWbs').value, document.getElementById('erWbsNote').textContent, erDirty(), JSON.stringify(erChanges(erRead()))])`),
      J(['1.2.1 - Organizational', W2_OPT('1.2.1'), false, '{}']));
    ev(`erStep(1); 'ok'`);
    chk(name, 'the edit box', '↓ next steps on to C without asking to discard typing nobody did',
      ev(`JSON.stringify([window.__rvAsk.length, erOpen])`), J([0, 'C']));
    ev(`erClose(); openEdit('B', 'desc'); __w2put('erDesc', 'Only the description'); document.getElementById('erSaveBtn').click(); 'ok'`);
    chk(name, 'the edit box', 'a Save of another field keeps the paragraph exactly as stored, and says it saved only that field',
      ev(`JSON.stringify([erOn(), S.wbs.B, /\\bWBS\\b/.test(document.getElementById('shareStat').textContent), S.desc.B])`),
      J([false, [{ w: '1.2.1 - Organizational', v: [] }], false, 'Only the description']));
    // the quick box: OK with nothing typed keeps it as stored
    ev(`wbsQuick('B'); 'ok'`);
    chk(name, 'the quick box', 'it opens holding the paragraph as stored, named', ev(`JSON.stringify([document.getElementById('uipVal').value, document.getElementById('uipNote').textContent])`),
      J(['1.2.1 - Organizational', W2_OPT('1.2.1')]));
    ev(`uipDone(true); 'ok'`);
    chk(name, 'the quick box', 'OK with nothing typed keeps it exactly as stored', ev(`JSON.stringify(S.wbs.B)`), J([{ w: '1.2.1 - Organizational', v: [] }]));
    chk(name, 'CONTROL', 'C, stored as 1.3, opens in the edit box clean too',
      ev(`(function(){ openEdit('C', 'wbs'); var r=[document.getElementById('erWbs').value, erDirty()]; erClose(); return JSON.stringify(r); })()`), J(['1.3', false]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}

// ---- v2.12 RV2 (K02): the quick box asks before Esc throws away what was typed ------------------------------------------------
// The in-app box Classify's WBS cell opens is saved only by its own OK, so the box controller must ask before Esc (or a click
// outside it) throws away what was typed -- as the edit box does for the same typing. Its field carried oninput (it names the
// paragraph as typed), which the controller reads as "applies as typed", so on c23e8a0 Esc closed it without a word.
{
  const name = 'v2.12 RV2 — the WBS quick box asks before Esc throws away what was typed (K02)';
  try {
    const J = JSON.stringify;
    const B = w2Board(W2_SET), ev = B.ev;
    ev(`window.__rvAsk=[]; window.__rvAns=false; window.confirm=function(m){ window.__rvAsk.push(String(m)); return window.__rvAns; };
      window.__rvEsc=function(){ var t=document.activeElement||document.body;
        t.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true, cancelable:true})); dlgSync(); };
      wbsQuick('C'); dlgSync(); var u=document.getElementById('uipVal'); u.focus(); u.value='1.2.2'; u.dispatchEvent(new Event('input', {bubbles:true})); 'ok'`);
    const st = () => JSON.parse(ev(`JSON.stringify([/\\bopen\\b/.test(document.getElementById('uipPanel').className), document.getElementById('uipVal').value, window.__rvAsk.length, S.wbs.C])`));
    ev(`__rvEsc(); 'ok'`);
    chk(name, 'Esc, declined', 'typed 1.2.2, Esc asks first; declined, the box stays open holding the typing, nothing stored',
      J(st()), J([true, '1.2.2', 1, [{ w: '1.3', v: [] }]]));
    ev(`window.__rvAns=true; window.__rvAsk=[]; __rvEsc(); 'ok'`);
    chk(name, 'Esc, accepted', 'accepted, the box closes and nothing is stored', J(st().filter((x, i) => i !== 1)), J([false, 1, [{ w: '1.3', v: [] }]]));
    ev(`window.__rvAsk=[]; wbsQuick('C'); dlgSync(); document.getElementById('uipVal').focus(); __rvEsc(); 'ok'`);
    chk(name, 'CONTROL', 'with nothing typed, Esc closes it and asks nothing', J(st().filter((x, i) => i !== 1)), J([false, 0, [{ w: '1.3', v: [] }]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}

// ---- v2.12 RV2 (K03): the CLIN drill and the PMO review name a paragraph, and flag one the estimate does not hold --------------
// The name shows beside every paragraph shown, and a stored one the list does not hold is flagged. P's CLIN 0001 is on 1.2 and
// Q's on 4.4 (not in the estimate); a submittal proposes 9.9 for A and 1.2.2 for C. On c23e8a0 the drill shows bare codes and
// the review "9.9" and "1.2.2" with nothing beside them: every check fails.
{
  const name = 'v2.12 RV2 — the CLIN drill and the PMO review name a paragraph, and flag one the estimate does not hold (K03)';
  try {
    const J = JSON.stringify;
    const B = w2Board(W2_SET), ev = B.ev;
    const drill = id => JSON.parse(ev(`(function(){ clinOpen={}; clinOpen[${J(id)}]=true; render();
      var r=document.getElementById('row-'+${J(id)}), d=r? r.querySelector('.clin-detail') : null;
      var o=d? [].map.call(d.querySelectorAll('td.cw:not(.rcnc)'), function(td){ var n=td.querySelector('.wbsnm'); return (td.querySelector('button')||{}).textContent+' | '+(n? n.className+' | '+n.textContent : ''); }) : ['no drill'];
      clinOpen={}; render(); return JSON.stringify(o); })()`));
    chk(name, 'the CLIN drill', 'P’s CLIN on 1.2 is named under its button; its CLIN with no paragraph shows none',
      J(drill('P')), J(['1.2 | wbsnm | ' + W2_PATH['1.2'], '+ WBS | ']));
    chk(name, 'the CLIN drill', 'Q’s CLIN on 4.4 is flagged as not in the estimate', J(drill('Q')),
      J(['4.4 | wbsnm off | ⚠ not in the 2026ACE estimate for O&M: 4.4', '+ WBS | ']));
    chk(name, 'the review’s words', 'a paragraph reads with its name, or flagged',
      ev(`pmoFmtVal('wbs', [{w:'1.2.1', v:[]}, {w:'9.9', v:[]}])`), '1.2.1 — ' + W2_PATH['1.2.1'] + ' · 9.9 (not in the 2026ACE estimate for O&M)');
    // through a submittal, in the review table as drawn
    ev(`window.alert=function(){}; window.confirm=function(){ return true; };
      pmoTake({spmtPkg:1, dir:'submit', ap:'', fy:MS.cur, ts:Date.now(), by:'PMO', fromTs:1, pmo:'AV', svc:SVC.slice(),
        items:{A:{wbs:[{w:'9.9', v:[]}]}, C:{wbs:[{w:'1.2.2', v:[]}]}}, base:{A:{}, C:{wbs:[{w:'1.3', v:[]}]}}}, 'sub.json');
      subOpenReview(); 'ok'`);
    const rows = JSON.parse(ev(`JSON.stringify([].map.call(document.querySelectorAll('#subPanel tr'), function(tr){ return tr.textContent.replace(/\\s+/g,' ').trim(); }))`));
    chk(name, 'the review', 'A’s proposed 9.9 is flagged; C’s 1.3 and 1.2.2 are named',
      J([rows.some(t => t.includes('9.9 (not in the 2026ACE estimate for O&M)')), rows.some(t => t.includes('1.3 — ' + W2_PATH['1.3']) && t.includes('1.2.2 — ' + W2_PATH['1.2.2']))]),
      J([true, true]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}

// ---- v2.12 RV2 (K04): Classify says why a bulk WBS leaves a requirement alone -------------------------------------------------
// S is split across paragraphs and P, Q and R are primes: none "never offers" the field -- S carries a WBS split, a prime's WBS
// is per CLIN. The preview, the confirm and the status line say which. On c23e8a0 all four read "never offer it".
{
  const name = 'v2.12 RV2 — Classify says why a bulk WBS leaves a requirement alone (K04)';
  try {
    const J = JSON.stringify;
    const B = w2Board(W2_SET), ev = B.ev;
    ev(`window.__rvAsk=[]; window.confirm=function(m){ window.__rvAsk.push(String(m)); return true; };
      matOpen=true; matPmo='ALL'; matMissing=''; matSet('bulkF', 'wbs'); matSet('bulkV', '1.2.2'); render(); 'ok'`);
    chk(name, 'preview', 'the three primes and the split are each said for what they are',
      ev(`(document.querySelector('#matBody .mat-prev')||{}).textContent||''`),
      '1 blank · 0 already this · 2 overwritten · 1 with a WBS split, left alone so the split is kept · 3 primes, whose WBS is per CLIN, left alone');
    ev(`matApplyBulk(); 'ok'`);
    chk(name, 'confirm', 'the question says the same', J([/\n  1 with a WBS split, left alone so the split is kept\n  3 primes, whose WBS is per CLIN, left alone\n/.test(ev(`window.__rvAsk[0]||''`)),
      /never offer/.test(ev(`window.__rvAsk[0]||''`))]), J([true, false]));
    chk(name, 'status', 'and so does the status line, once the set is made',
      ev(`document.getElementById('shareStat').textContent.replace(/^.*? — /, '')`),
      '2 had a different answer and were overwritten; 1 with a WBS split, left alone so the split is kept; 3 primes, whose WBS is per CLIN, left alone.');
    chk(name, 'CONTROL', 'S keeps its split, and the set reached A, B and C', ev(`JSON.stringify([S.wbs.S.length, S.wbs.A, S.wbs.B, S.wbs.C])`),
      J([2, [{ w: '1.2.2', v: [] }], [{ w: '1.2.2', v: [] }], [{ w: '1.2.2', v: [] }]]));
    ev(`matSet('bulkF', 'mipr'); matSet('bulkV', 'direct'); render(); 'ok'`);
    chk(name, 'CONTROL', 'a field that says no why reads as it always did (MIPR type, offered only where the money goes to a government activity)',
      ev(`(document.querySelector('#matBody .mat-prev')||{}).textContent||''`), '0 blank · 0 already this · 0 overwritten · 7 never offer it, left alone');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}

// ---- v2.12 RV2 (K01, K05, K09, K14, K16): Without a WBS, its heading and the export's message read one thing --------------------
// Eight requirements, every case stated. A (OGC) is split across 1.2.1 and 1.3 and leaves USAF $200 and ANG $100 of its
// allocation not yet assigned; C has no paragraph; D is on 1.3, whole; P is a prime whose CLINs carry USAF only, on 1.2.2 and
// 1.10, while it is funded ANG $80 too; Q is a prime whose CLIN 0002 requests nothing but is ALLOCATED $100 in its drill, with
// no paragraph; R is a prime whose CLIN 0002 requests $100 and is allocated $0, with no paragraph (it carries no money); R2 is R
// with the CLIN grid stored in the old array form; U is a prime the lanes do not reach, whose CLIN 0001 is allocated $50 with no
// paragraph and requests nothing. The Spend Plan Source sends A's $300, C's $90, P's ANG $80 and Q's CLIN 0002 $100 with the WBS
// blank: those four are listed with those dollars and why, and U (unfunded, a CLIN carrying money and no paragraph); the
// heading counts R, R2 and D, and $1,450 of $2,020 funded that goes out on a paragraph; the export names the same four, and
// points to that list. On c23e8a0 the list is C, Q and U with their funded dollars, the heading 5 of 8 and $1,680 of $2,020, the
// export's message sends the person to record fields and a list that do not hold A or P: every check fails but the CONTROLs.
await (async () => {
  const name = 'v2.12 RV2 — Without a WBS, its heading and the Spend Plan Source’s message are one reading of what goes out blank (K01, K05, K09, K14, K16)';
  try {
    const J = JSON.stringify;
    const X = boot();
    const ids = ['A', 'C', 'D', 'P', 'Q', 'R', 'R2', 'U'];
    seed(X.ev, { services: ['USAF', 'ANG'],
      items: [w2it('A', 'AV', [700, 200]), w2it('C', 'AV', [90, 0]), w2it('D', 'AV', [100, 0]), w2it('P', 'AV', [300, 80]),
              w2it('Q', 'AV', [250, 0]), w2it('R', 'AV', [150, 0]), w2it('R2', 'AV', [150, 0]), w2it('U', 'AV', [100, 0])],
      disc: [1740, 280], mand: [0, 0], order: ids });
    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.ptype={A:'OGC', C:'OGC', D:'OGC', P:'PRIME', Q:'PRIME', R:'PRIME', R2:'PRIME', U:'PRIME'};
      DATA.clins=DATA.clins||{};
      DATA.clins.P=[{clin:'0001', desc:'p1', ccar:'', ask:[100,0]}, {clin:'0002', desc:'p2', ccar:'', ask:[200,0]}];
      DATA.clins.Q=[{clin:'0001', desc:'q1', ccar:'', ask:[150,0]}, {clin:'0002', desc:'q2', ccar:'', ask:[0,0]}];
      DATA.clins.R=[{clin:'0001', desc:'r1', ccar:'', ask:[150,0]}, {clin:'0002', desc:'r2', ccar:'', ask:[100,0]}];
      DATA.clins.R2=[{clin:'0001', desc:'s1', ccar:'', ask:[150,0]}, {clin:'0002', desc:'s2', ccar:'', ask:[100,0]}];
      DATA.clins.U=[{clin:'0001', desc:'u1', ccar:'', ask:[0,0]}, {clin:'0002', desc:'u2', ccar:'', ask:[100,0]}];
      ['P','Q','R','R2','U'].forEach(function(id){ CLINS[id]=DATA.clins[id]; });
      S.wbs={A:[{w:'1.2.1', v:[300,100]}, {w:'1.3', v:[200,0]}], D:[{w:'1.3', v:[]}]};
      S.clinWbs={P:{b0:[{w:'1.2.2', v:[]}], b1:[{w:'1.10', v:[]}]}, Q:{b0:[{w:'1.2', v:[]}]}, R:{b0:[{w:'1.2', v:[]}]}, R2:{b0:[{w:'1.2', v:[]}]}, U:{b1:[{w:'1.2', v:[]}]}};
      ACEDB={ts:9, sets:${J({ '2026ACE': W2_SET })}};
      applyState(S); save(); render(); 'ok'`);
    // the drill's own Allocation boxes, typed as a person types them (setClinSvc): Q's CLIN 0002 $100, R's $0, U's CLIN 0001 $50
    X.ev(`setClinSvc('Q','b1',0,'100'); setClinSvc('R','b1',0,'0'); setClinSvc('U','b0',0,'50'); setClinSvc('U','b1',0,'0');
      S.clinAlloc.R2=[[150,0],[0,0]]; save(); render(); 'ok'`);
    chk(name, 'fixture', 'the draws (a CONTROL on the fixture): A 700/200, C 90, D 100, P 300/80, Q 250, R 150, R2 150, U nothing',
      X.ev(`(function(){ var T=tiers(); return JSON.stringify(S.order.map(function(id){ return T[id].d.join('/'); })); })()`),
      J(['700/200', '90/0', '100/0', '300/80', '250/0', '150/0', '150/0', '0/0']));
    chk(name, 'fixture', 'R2’s CLIN grid is still in the old array form when the list is read (a CONTROL that the branch is reached)',
      X.ev(`(attLists(), Array.isArray(S.clinAlloc.R2))`), true);
    const A = JSON.parse(X.ev(`(function(){ var A=attLists(); return JSON.stringify({rows:A.wbs.map(function(r){ return [r.id, r.blank, r.funded, r.why]; }), cov:A.wbs.cov}); })()`));
    chk(name, 'the list', 'Without a WBS: A, C, P, Q and U, each with what goes out blank, why, and its funded dollars',
      J(A.rows), J([['A', 300, 900, ['part of its WBS split not yet assigned']], ['C', 90, 90, ['no paragraph']], ['P', 80, 380, ['ANG money on no CLIN']],
        ['Q', 100, 250, ['CLIN 0002 has no paragraph']], ['U', 0, 0, ['CLIN 0001 has no paragraph']]]));
    chk(name, 'the heading', 'the coverage: 3 of 8 requirements (D, R, R2), and $1,450 of $2,020 funded goes out on a paragraph',
      J(A.cov), J({ n: 3, of: 8, f: 1450, fof: 2020 }));
    X.ev(`attShow('wbs'); 'ok'`);
    chk(name, 'the list as drawn', 'its heading, and a row naming why with the dollars that go out blank',
      X.ev(`JSON.stringify([document.getElementById('attTitle').textContent, [].slice.call(document.querySelectorAll('#attBody .atttab tr')).slice(1).map(function(r){
        return [].slice.call(r.children).slice(0,-1).map(function(c){ return c.textContent.trim(); }).join(' · '); })])`),
      J(['▦ WITHOUT A WBS — 3 of 8 requirements have one · $1,450 of $2,020 funded',
        ['1 · A event · AV · part of its WBS split not yet assigned · $300 · $900', '2 · C event · AV · no paragraph · $90 · $90', '4 · P event · AV · ANG money on no CLIN · $80 · $380',
         '5 · Q event · AV · CLIN 0002 has no paragraph · $100 · $250', '8 · U event · AV · CLIN 0001 has no paragraph · — · —', ' · 5 requirements ·  ·  · $570 · $1,620']]));
    X.ev(`attClose(); 'ok'`);
    chk(name, 'the posture', 'its entry counts the five', X.ev(`([].filter.call(document.querySelectorAll('#posture .ppatt button.e'), function(e){ return e.getAttribute('onclick')==='attShow("wbs")'; })[0]||{}).textContent`),
      '▦ 5 without a WBS');
    // the export, read from its bytes: the blank lines are exactly the list's dollars, and its message names the same four
    const bk = JSON.parse(await w2Book(X.w, 'exportSrc'));
    chk(name, 'workbook', 'the Spend Plan Source builds and reads back', bk.__err || 'ok', 'ok');
    const src = Object.values(bk).find(rs => (rs || []).length > 1) || [];
    const blank = {}; src.slice(1).forEach(r => { if (String(r[23] ?? '') === '') { const id = String(r[7] ?? '').replace(/ event$/, ''); blank[id] = (blank[id] || 0) + (+r[9] || 0); } });
    chk(name, 'one reading', 'the lines the file sends with the WBS blank, by requirement, are the list’s dollars',
      J(blank), J({ A: 300, C: 90, P: 80, Q: 100 }));
    chk(name, 'one reading', 'the message names the four, and points to the list that holds every one of them, with what to fix',
      X.ev(`document.getElementById('shareStat').textContent.replace(/^.*?(⚠ \\d+ lines? go(es)? out with no WBS paragraph.*?fix\\.).*$/, '$1')`),
      '⚠ 5 lines go out with no WBS paragraph, on 4 requirements: A event (2 lines), C event, P event, Q event — Needs attention › ▦ without a WBS lists each, with what to fix.');
    chk(name, 'one reading', 'every requirement it names is on the list',
      J(Object.keys(blank).every(id => A.rows.some(r => r[0] === id))), 'true');
    // v2.12 RV5 (S20): MEASURED FROM A STATE NO DRAW HAS TOUCHED. This took its snapshot after the fixture had drawn the board many
    // times, so whatever a draw writes had landed already and before and after matched whatever the code did: under
    // v212-rv2-draw-writes it passed, and only R2's array-form CONTROL went red. P's CLIN containers are taken away first (a
    // prime with base CLINs and none of them: what a board opened from a file before its drill was first opened holds), then
    // only what every draw runs for Needs attention -- attLists, and the posture that reads it -- is run: the RECORD panel
    // (gridAfterRender) makes a selected prime's containers on purpose, so render() is not what is measured here.
    chk(name, 'the draw writes nothing', 'P’s CLIN containers taken away (a CONTROL on the fixture: none is left)',
      X.ev(`(function(){ ['clinAlloc','clinMeta','clinNew','clinRm'].forEach(function(n){ if(S[n] && typeof S[n]==='object') delete S[n].P; });
        return JSON.stringify(['clinAlloc','clinMeta','clinNew','clinRm'].map(function(n){ return !!(S[n] && Object.prototype.hasOwnProperty.call(S[n], 'P')); })); })()`),
      J([false, false, false, false]));
    chk(name, 'the draw writes nothing', 'reading the list (as every draw does) leaves the CLIN containers exactly as they were',
      X.ev(`(function(){ var a=JSON.stringify([S.clinAlloc||null, S.clinMeta||null, S.clinNew||null, S.clinRm||null]); attLists(); scoreboard(); return a===JSON.stringify([S.clinAlloc||null, S.clinMeta||null, S.clinNew||null, S.clinRm||null]); })()`), true);
    // a prime's paragraph left on the requirement (it was an OGC) is sent nowhere: no box shows it
    X.ev(`S.wbs.P=[{w:'1.3', v:[]}]; save(); render(); 'ok'`);
    chk(name, 'a prime', 'a requirement-level paragraph left on a prime does not cover its money on no CLIN',
      X.ev(`JSON.stringify(attLists().wbs.filter(function(r){ return r.id==='P'; }).map(function(r){ return [r.blank, r.why]; }))`), J([[80, ['ANG money on no CLIN']]]));
    // fixed in the CLIN drill, it leaves the list at once: P's CLIN 0001 is given ANG money, A's split is finished
    X.ev(`delete S.wbs.P; setClinSvc('P','b0',1,'80'); S.wbs.A=[{w:'1.2.1', v:[500,200]}, {w:'1.3', v:[200,0]}]; save(); render(); 'ok'`);
    chk(name, 'fixed', 'A and P leave the list, and the heading counts them',
      X.ev(`(function(){ var A=attLists(); return JSON.stringify([A.wbs.map(function(r){ return r.id; }), A.wbs.cov.n, A.wbs.cov.f]); })()`), J([['C', 'Q', 'U'], 5, 1830]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
})();

// ---- v2.12 RV2 (K06, K15): each paragraph goes out with what the office typed for it, measured against the allocation -----------
// Two boards. ONE: E is split $100 / $100 / $100 and awarded in twelve increments of $25; F the same split, one award date, paid
// $151 discretionary and $149 mandatory. Each piece split over the paragraphs by itself rounded the same way every time:
// E went out $108 / $96 / $96 and F $101 / $100 / $99; split once and each piece taken from what is left, both go out exactly
// $100 / $100 / $100, every line still adding up to its piece. TWO: the base a split is measured against is the ALLOCATION:
// B asks USAF $700, is allocated $600 and drawn $500 ($251 discretionary, $249 mandatory), split $300 / $200 -- so the ask, the
// allocation and the draw give three different answers; and Q's CLIN 0001 ($100 of the prime's $300) is split $60 / $30 of
// its own CLIN allocation. Every line is worked out here, by largest remainder, from those literals; the workbook is read from
// its bytes. On c23e8a0 ONE fails (the old per-piece split); TWO's lines pass there (the base was right) -- CONTROLs kept for the
// mutations that move the base -- and its last check, Without a WBS on the funded plan, fails (B was not listed).
await (async () => {
  const name = 'v2.12 RV2 — the Spend Plan Source sends each paragraph what the office typed for it, measured against the allocation (K06, K15)';
  try {
    const J = JSON.stringify;
    // the rule, worked out here: the service's money over the paragraphs once, then each piece from what each still has to take
    const spread = w2Spread;
    const lines = (bk) => (Object.values(bk).find(rs => (rs || []).length > 1) || []).slice(1).map(r => ({ id: String(r[7] ?? '').replace(/ event$/, ''),
      amt: +r[9] || 0, w: String(r[23] ?? '').split(' - ')[0], dt: r[8], clin: String(r[25] ?? '') }));
    // ---- ONE: increments, and both lanes
    const O = boot();
    seed(O.ev, { services: ['USAF'], items: [w2it('E', 'AV', [300]), w2it('F', 'AV', [300])], disc: [451], mand: [149], order: ['E', 'F'] });
    O.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.ptype={E:'OGC', F:'OGC'};
      S.wbs={E:[{w:'1.2', v:[100]}, {w:'1.3', v:[100]}, {w:'1.10', v:[100]}], F:[{w:'1.2', v:[100]}, {w:'1.3', v:[100]}, {w:'1.10', v:[100]}]};
      S.awards=S.awards||{};
      S.awards.E={mode:'inc', inc:[10,11,12,1,2,3,4,5,6,7,8,9].map(function(m){ return {d:(m>=10? MS.cur-1 : MS.cur)+'-'+String(m).padStart(2,'0'), day:5, sv:[25]}; })};
      S.awards.F={d:(MS.cur-1)+'-11', day:3};
      ACEDB={ts:9, sets:${J({ '2026ACE': W2_SET })}};
      applyState(S); save(); 'ok'`);
    chk(name, 'one · fixture', 'the draws (a CONTROL): E $300 discretionary, F $151 discretionary and $149 mandatory',
      O.ev(`(function(){ var T=tiers(); return JSON.stringify([T.E.d, T.E.m, T.F.d, T.F.m]); })()`), J([[300], [0], [151], [149]]));
    const L1 = lines(JSON.parse(await w2Book(O.w, 'exportSrc')));
    const tot = (id) => { const o = {}; L1.filter(l => l.id === id).forEach(l => { o[l.w] = (o[l.w] || 0) + l.amt; }); return o; };
    chk(name, 'one · paragraphs', 'E’s twelve increments add up, per paragraph, to what the office typed: $100 each',
      J(tot('E')), J({ '1.2': 100, '1.3': 100, '1.10': 100 }));
    chk(name, 'one · paragraphs', 'F’s two lanes add up, per paragraph, to what the office typed: $100 each', J(tot('F')), J({ '1.2': 100, '1.3': 100, '1.10': 100 }));
    const wantE = spread(Array(12).fill(25), [100, 100, 100, 0]), wantF = spread([151, 149], [100, 100, 100, 0]);
    chk(name, 'one · lines', 'every line of E is the rule’s own, increment by increment',
      J(L1.filter(l => l.id === 'E').map(l => l.amt)), J([].concat(...wantE.map(s => s.slice(0, 3))).filter(v => v)));
    chk(name, 'one · lines', 'every line of F is the rule’s own, lane by lane', J(L1.filter(l => l.id === 'F').map(l => l.amt)), J([].concat(...wantF.map(s => s.slice(0, 3))).filter(v => v)));
    { const byDt = {}; L1.filter(l => l.id === 'E').forEach(l => { byDt[l.dt] = (byDt[l.dt] || 0) + l.amt; });
      chk(name, 'one · lines', 'each increment’s lines add up to that increment, on its own date', J(Object.values(byDt)), J(Array(12).fill(25))); }
    chk(name, 'one · oracle', 'the rule is not the old one by luck (a CONTROL): split piece by piece, E would go out 108 / 96 / 96',
      J([0, 1, 2].map(k => Array(12).fill(25).reduce((a, p) => a + w2LR(p, [100, 100, 100])[k], 0))), J([108, 96, 96]));
    // ---- TWO: the base is the allocation, a requirement's and a CLIN's
    const W = boot();
    seed(W.ev, { services: ['USAF', 'ANG'], items: [w2it('A', 'AV', [49, 0]), w2it('Q', 'AV', [300, 0]), w2it('B', 'AV', [700, 200])],
      disc: [600, 200], mand: [249, 0], order: ['A', 'Q', 'B'], alloc: { B: { m: 's', v: [600, 200] } } });
    W.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.ptype={A:'OGC', Q:'PRIME', B:'OGC'};
      DATA.clins=DATA.clins||{}; DATA.clins.Q=[{clin:'0001', desc:'q1', ccar:'', ask:[100,0]}, {clin:'0002', desc:'q2', ccar:'', ask:[200,0]}]; CLINS.Q=DATA.clins.Q;
      S.wbs={A:[{w:'1.2.2', v:[]}]}; S.clinWbs={Q:{b1:[{w:'1.10', v:[]}]}};
      ACEDB={ts:9, sets:${J({ '2026ACE': W2_SET })}};
      applyState(S); save(); render(); 'ok'`);
    // B's split and Q's CLIN 0001 split, typed through the WBS lines' own setters
    W.ev(`wbsAdd('req','B',''); wbsAdd('req','B',''); wbsSetNum('req','B','',0,'1.2.1'); wbsSetNum('req','B','',1,'1.3');
      wbsSetVal('req','B','',0,0,'300'); wbsSetVal('req','B','',0,1,'100'); wbsSetVal('req','B','',1,0,'200'); wbsSetVal('req','B','',1,1,'0');
      wbsAdd('clin','Q','b0'); wbsAdd('clin','Q','b0'); wbsSetNum('clin','Q','b0',0,'1.2.1'); wbsSetNum('clin','Q','b0',1,'1.3');
      wbsSetVal('clin','Q','b0',0,0,'60'); wbsSetVal('clin','Q','b0',1,0,'30'); 'ok'`);
    chk(name, 'two · fixture', 'the three bases disagree (a CONTROL): B’s USAF ask $700, allocation $600, draw $251 + $249; Q’s CLIN 0001 $100 of the prime’s $300',
      W.ev(`(function(){ var T=tiers(); return JSON.stringify([itemById('B').ask[0], svcAlloc(itemById('B'))[0], T.B.d[0], T.B.m[0], clinVec('Q', clinList('Q')[0])[0], svcAlloc(itemById('Q'))[0], T.Q.d[0]]); })()`),
      J([700, 600, 251, 249, 100, 300, 300]));
    const L2 = lines(JSON.parse(await w2Book(W.w, 'exportSrc')));
    const wantB = spread([251, 249], [300, 200, 100]);       // USAF: the allocation leaves $100 not yet assigned
    chk(name, 'two · B', 'B’s USAF lines, discretionary then mandatory: split once over $300 / $200 / $100 of a $600 allocation',
      J(L2.filter(l => l.id === 'B' && !l.clin).slice(0, 6).map(l => [l.amt, l.w])),
      J([].concat(...wantB.map(s => [[s[0], '1.2.1'], [s[1], '1.3'], [s[2], '']]))));
    chk(name, 'two · B', 'its ANG line: $100 on 1.2.1, $100 not yet assigned', J(L2.filter(l => l.id === 'B').slice(6).map(l => [l.amt, l.w])), J([[100, '1.2.1'], [100, '']]));
    chk(name, 'two · Q', 'Q’s CLIN 0001 goes out $60 / $30 / $10 of its own CLIN’s $100, CLIN 0002 whole on 1.10',
      J(L2.filter(l => l.id === 'Q').map(l => [l.clin, l.amt, l.w])), J([['0001', 60, '1.2.1'], ['0001', 30, '1.3'], ['0001', 10, ''], ['0002', 200, '1.10']]));
    chk(name, 'two · oracle', 'measured against the ask B would go out 214 / 143 / 143, against the draw 300 / 200 / 0 (a CONTROL: the bases disagree)',
      J([w2LR(500, [300, 200, 200]), w2LR(500, [300, 200, 0]), w2LR(500, [300, 200, 100])]), J([[214, 143, 143], [300, 200, 0], [250, 167, 83]]));
    // Without a WBS reads the lines the export sends, on the funded plan: under ◨ Discretionary only (the posture's view) B is
    // still $700 funded, $183 of it with no WBS -- its USAF $42 + $41 not yet assigned, its ANG $100
    W.ev(`scenView='disc'; render(); 'ok'`);
    chk(name, 'two · the funded plan', 'under ◨ Discretionary only, Without a WBS still reads B as the export sends it: $700 funded, $183 with no WBS',
      W.ev(`(function(){ var r=attLists(tiers(null, scenOpt())).wbs.filter(function(x){ return x.id==='B'; })[0]; return JSON.stringify(r? [r.funded, r.blank] : null); })()`), J([700, 183]));
    W.ev(`scenView=''; render(); 'ok'`);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
})();

// ---- v2.12 RV2 (K17, K00): a paragraph carried from another year is kept as stored -------------------------------------------
// FY26 holds three of AV's requirements made in the Add box, each with no description, so From another year opens each in New
// requirement to finish: K1 on 4.4 (a paragraph the estimate does not hold), K2 on 4.4 too, K3 on "1.2.1 - Organizational".
// Left as it is, a carried paragraph is kept exactly as stored -- flagged under the field -- and added; changed, it is judged
// like any other (5.5 refused with the typing kept, 1.2 taken). On c23e8a0 K3's is rewritten to 1.2.1 as the box opens; the
// K1 and K2 checks pass there (CONTROLs for the mutation that removes the carried branch).
{
  const name = 'v2.12 RV2 — a paragraph carried from another year is kept as stored, even one the estimate does not hold (K17)';
  try {
    const J = JSON.stringify;
    const B = w2Board(W2_SET), ev = B.ev;
    ev(`(function(){ var T=JSON.parse(JSON.stringify(S)), to=flowEntsAZ().filter(function(x){ return !destKeyIsOgc(x.k); })[0].k;
      T.custom=[]; T.order=[];
      [['K1','4.4'],['K2','4.4'],['K3','1.2.1 - Organizational']].forEach(function(q){ var id='NEW-'+q[0];
        T.custom.push({id:id, grp:'AV', team:'AV', sect:'', custom:true, title:'', event:q[0]+' event', ccar:'', fy26:[0,0], ask:[10,0], alloc:null});
        T.order.push(id); (T.wbs=T.wbs||{})[id]=[{w:q[1], v:[]}]; (T.ptype=T.ptype||{})[id]='OGC'; (T.obCat=T.obCat||{})[id]=OB_CATS[0];
        (T.dest=T.dest||{})[id]={to:to}; (T.cons=T.cons||{})[id]='what is lost'; if(T.desc) delete T.desc[id]; });
      MS.years[2026]=T; save(); render(); return 'ok'; })()`);
    const bring = id => ev(`__w2add(); document.getElementById('arTabYr').click(); naFromPick(2026); naFromSel={${J('NEW-' + id)}:1}; naFromAdd();
      JSON.stringify([arOn(), document.getElementById('arWbs').value, document.getElementById('arWbsNote').textContent])`);
    const added = () => ev(`JSON.stringify((S.custom||[]).map(function(c){ return [c.event, ((S.wbs||{})[c.id]||[]).map(function(e){ return e.w; })]; }))`);
    chk(name, 'carried, unchanged', 'K1 opens to finish holding 4.4, flagged as kept as stored',
      bring('K1'), J([true, '4.4', '⚠ 4.4 is not a paragraph of the 2026ACE estimate for O&M — kept as stored; pick one to replace it.']));
    ev(`__w2put('arDesc', 'What it buys'); document.getElementById('arAddBtn').click(); 'ok'`);
    chk(name, 'carried, unchanged', 'Add keeps it exactly as stored, and the box closes', J([ev('arOn()'), JSON.parse(added()).slice(-1)[0]]),
      J([false, ['K1 event', ['4.4']]]));
    bring('K2');
    ev(`__w2put('arDesc', 'What it buys'); __w2put('arWbs', '5.5'); document.getElementById('arAddBtn').click(); 'ok'`);
    chk(name, 'carried, changed', 'changed to 5.5, a paragraph the estimate does not hold, it is refused: the box open, the typing kept, nothing added',
      ev(`JSON.stringify([arOn(), document.getElementById('arWbs').value, S.custom.length, /5\\.5.{0,4} is not a paragraph of the 2026ACE estimate for O&M/.test((document.getElementById('arMsg')||{}).textContent||'')])`),
      J([true, '5.5', 1, true]));
    ev(`__w2put('arWbs', '1.2'); document.getElementById('arAddBtn').click(); 'ok'`);
    chk(name, 'carried, changed', 'changed to 1.2, one it holds, it is taken', J(JSON.parse(added()).slice(-1)[0]), J(['K2 event', ['1.2']]));
    chk(name, 'carried as CCaR writes it', 'K3 opens holding "1.2.1 - Organizational" as stored, named (never shortened as it opens)',
      bring('K3'), J([true, '1.2.1 - Organizational', W2_OPT('1.2.1')]));
    ev(`__w2put('arDesc', 'What it buys'); document.getElementById('arAddBtn').click(); 'ok'`);
    chk(name, 'carried as CCaR writes it', 'and Add keeps it exactly as stored', J(JSON.parse(added()).slice(-1)[0]), J(['K3 event', ['1.2.1 - Organizational']]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}

// ---- v2.12 RV5 (S10): a board file whose CLIN request is not a list opens and draws, as v2.11 drew it; the door refuses it -------
// A hand edit or a damaged transfer. FILE ONE: P's first CLIN in the data pack requests 5 (a number) and an edit to its second
// requests {}; Q's first added CLIN requests the text "abc". v2.11 (read from git, bbb7ee9) opens it and draws every row (only a
// drill that was opened failed); on c81e995 the top-level applyStore threw -- "(c.ask || []).slice is not a function", for the
// text "(v || []).some is not a function" -- and no row was drawn, with nothing to say why. FILE TWO adds a CLIN that is null in
// the data pack and in the added CLINs, and a prime whose CLINs are {a:1}, not a list: v2.11 could not open that either (a
// CONTROL). Now both open with no script error and draw the four rows; file one with the money v2.11 drew (the rows' figures,
// every requirement's lanes and the totals: the CLIN grid feeds nothing); each drill opens, a request that is not a list asking
// nothing and a CLIN that is not a CLIN being no CLIN; and the import check refuses each shape, naming the CLIN and the place,
// while the same file with them put right (a request in text figures too) is taken. On c81e995 every check fails but the CONTROLs.
await (async () => {
  const name = 'v2.12 RV5 — a board file whose CLIN request is not a list opens and draws as v2.11 drew it, and the import check refuses it by name (S10)';
  try {
    const J = JSON.stringify;
    const X = boot();
    seed(X.ev, { services: ['USAF', 'ANG'],
      items: [w2it('A', 'AV', [100, 20]), w2it('P', 'AV', [300, 40]), w2it('Q', 'AV', [500, 0]), w2it('R', 'AV', [80, 0])],
      disc: [700, 30], mand: [150, 0], order: ['A', 'P', 'Q', 'R'] });
    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.ptype={A:'OGC', P:'PRIME', Q:'PRIME', R:'PRIME'}; DATA.clins=DATA.clins||{};
      DATA.clins.P=[{clin:'0001', desc:'one', ccar:'', ask:5}, {clin:'0002', desc:'two', ccar:'', ask:[100,40]}];
      DATA.clins.R=[{clin:'0001', desc:'r one', ccar:'', ask:[80,0]}]; CLINS.P=DATA.clins.P; CLINS.R=DATA.clins.R;
      S.clinNew={Q:[{key:'n1', clin:'0009', desc:'added', ccar:'', ask:'abc'}, {key:'n2', clin:'0010', desc:'two', ccar:'', ask:[300,0]}]};
      S.clinMeta={P:{b1:{ask:{}}}};
      applyState(S); save(); 'ok'`);
    // the data pack's request is planted in the saved file itself: the board fits its own CLINs to the services as it applies a
    // year, so a number put there before saving would be saved as the zeros it was fitted to
    const pub = h => { const o = JSON.parse(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/.exec(h)[1]);
      o.appns.om.dataPack.clins.P[0].ask = 5; return J(o).replace(/</g, '\\u003c'); };
    const ST1 = pub(X.ev(`buildSavedHtml()`));
    X.ev(`DATA.clins.P.splice(1, 0, null); DATA.clins.R={a:1}; CLINS.R=DATA.clins.R; S.clinNew.Q.splice(1, 0, null); S.clinMeta={P:{b2:{ask:{}}}}; save(); 'ok'`);
    const ST2 = pub(X.ev(`buildSavedHtml()`));
    const into = (h, st) => h.replace(/<script type="application\/json" id="pubState">[\s\S]*?<\/script>/, () => '<script type="application/json" id="pubState">' + st + '</script>');
    const me = _selfRead(BOARD, 'utf8');
    const R1 = boot({ html: into(me, ST1) }), R2 = boot({ html: into(me, ST2) });
    const rowsOf = B => { try { return B.ev(`JSON.stringify([].map.call(document.querySelectorAll('[id^="row-"]'), function(r){ return [r.id, r.textContent.match(/\\$[\\d,.]+[MK]?/g)||[]]; }))`); } catch (e) { return '[]'; } };
    const moneyOf = B => { try { return B.ev(`(function(){ var T=tiers(), t=tierTotals(T);
      return JSON.stringify([S.order.map(function(id){ return [id, T[id].d, T[id].m, T[id].u, T[id].cum]; }), [t.dUsed, t.mUsed, t.uAmt, t.u1Amt, t.u2Amt]]); })()`); } catch (e) { return 'threw'; } };
    const opens = B => J([B.errors.length, JSON.parse(rowsOf(B)).length, (() => { try { return B.ev(`document.getElementById('posture').textContent.trim().length>0`); } catch (e) { return false; } })()]);
    chk(name, 'opens', 'file one opens with no script error and draws its four rows, and the posture', opens(R1), J([0, 4, true]));
    chk(name, 'opens', 'and so does file two, with its null CLINs and a prime whose CLINs are not a list', opens(R2), J([0, 4, true]));
    // the same files on v2.11, read from git
    const { execFileSync } = await import('node:child_process');
    const root = _selfPath(new URL('../..', import.meta.url));
    let v211 = null;
    try { v211 = execFileSync('git', ['-C', root, 'show', 'bbb7ee9:prioritization-board-grid.html'], { encoding: 'utf8', maxBuffer: 64 << 20 }); }
    catch (e) { failures.push({ scenario: name, where: 'as v2.11', what: 'v2.11’s board could not be read from git (a shallow clone? git fetch --unshallow): ' + String((e && e.message) || e).slice(0, 120), got: 'unread', want: 'read' }); }
    if (v211) {
      const O1 = boot({ html: into(v211, ST1) }), O2 = boot({ html: into(v211, ST2) });
      chk(name, 'as v2.11', 'the board read from git is v2.11 (no Needs attention WBS reading), and it opens file one and draws it (a CONTROL)',
        J([O1.ev(`typeof wbsBlankOf`), JSON.parse(opens(O1))]), J(['undefined', [0, 4, true]]));
      chk(name, 'as v2.11', 'v2.11 could not open file two either (a CONTROL: its null CLINs were never a regression)', J(JSON.parse(opens(O2)).slice(0, 2)), J([1, 0]));
      chk(name, 'as v2.11', 'file one: every row shows the figures v2.11 shows', rowsOf(R1), rowsOf(O1));
      chk(name, 'as v2.11', 'file one: every requirement’s discretionary, mandatory, unfunded and cumulative, and the totals, are v2.11’s', moneyOf(R1), moneyOf(O1));
    }
    const MONEY = J([[['A', [100, 20], [0, 0], [0, 0], 120], ['P', [300, 10], [0, 0], [0, 30], 460], ['Q', [300, 0], [150, 0], [50, 0], 960], ['R', [0, 0], [0, 0], [80, 0], 1040]], [730, 150, 160, 310, 160]]);
    chk(name, 'the money (a CONTROL on the fixture)', 'the lanes walk the four requirements the same way whatever the CLINs hold, in both files',
      J([moneyOf(R1), moneyOf(R2)]), J([MONEY, MONEY]));
    // each drill opens; a request that is not a list asks nothing (opening fits a data-pack CLIN's to the services), and a CLIN
    // that is not a CLIN is no CLIN
    const drill = B => { try { return B.ev(`(function(){ var o=[]; ['P','Q','R'].forEach(function(id){ clinOpen={}; clinOpen[id]=true; render();
        o.push([id, clinList(id).map(function(c){ return [c.key, c.clin, clinAskTot(c)]; }), !!document.querySelector('#row-'+id+' .clin-detail')]); });
      clinOpen={}; render(); return JSON.stringify(o); })()`); } catch (e) { return 'threw ' + String(e.message).slice(0, 80); } };
    chk(name, 'the drill', 'file one: each prime’s drill opens, and a request that is not a list asks nothing', drill(R1),
      J([['P', [['b0', '0001', 0], ['b1', '0002', 140]], true], ['Q', [['n1', '0009', 0], ['n2', '0010', 300]], true], ['R', [['b0', '0001', 80]], true]]));
    chk(name, 'the drill', 'file two: a CLIN that is null, and a prime’s CLINs that are not a list, are no CLIN', drill(R2),
      J([['P', [['b0', '0001', 0], ['b2', '0002', 140]], true], ['Q', [['n1', '0009', 0], ['n2', '0010', 300]], true], ['R', [], true]]));
    // the import check: every door reads a file through it
    const door = st => { try { return R1.ev(`inboundCheck(${J(J(st))})`); } catch (e) { return 'threw ' + String(e.message).slice(0, 80); } };
    const ok = JSON.parse(ST2), fy = Object.keys(ok.appns.om.years)[0], yr = s => s.appns.om.years[fy];
    ok.appns.om.dataPack.clins.P = [{ clin: '0001', desc: 'one', ccar: '', ask: [5, 0] }, { clin: '0009', desc: 'gone', ccar: '', ask: [0, 0] }, { clin: '0002', desc: 'two', ccar: '', ask: [100, 40] }];
    ok.appns.om.dataPack.clins.R = [];
    yr(ok).clinNew.Q = [{ key: 'n1', clin: '0009', desc: 'added', ccar: '', ask: ['1,000', 0] }, { key: 'n3', clin: '0011', desc: 'three', ccar: '', ask: [0, 0] }, { key: 'n2', clin: '0010', desc: 'two', ccar: '', ask: [300, 0] }];
    yr(ok).clinMeta.P.b2.ask = [100, 40];
    chk(name, 'the door', 'CONTROL: the same file with every shape put right is taken (a request written as text figures too)', door(ok), '');
    const at = 'the file.appns.om', Y = at + '.years.' + fy;
    const one = fn => { const s = JSON.parse(J(ok)); fn(s); return door(s); };
    chk(name, 'the door', 'file one as saved is refused, naming a CLIN whose request is not a list', door(JSON.parse(ST1)),
      'the request of CLIN “0009” at ' + Y + '.clinNew.Q[0].ask is not a list of figures (“"abc"”)');
    chk(name, 'the door', 'a CLIN in the data pack whose request is a number', one(s => { s.appns.om.dataPack.clins.P[0].ask = 5; }),
      'the request of CLIN “0001” at ' + at + '.dataPack.clins.P[0].ask is not a list of figures (“5”)');
    chk(name, 'the door', 'a CLIN in the data pack that is null', one(s => { s.appns.om.dataPack.clins.P[1] = null; }),
      'the CLIN at ' + at + '.dataPack.clins.P[1] is not a CLIN (“null”)');
    chk(name, 'the door', 'a prime’s CLINs in the data pack that are not a list', one(s => { s.appns.om.dataPack.clins.R = { a: 1 }; }),
      'the CLINs at ' + at + '.dataPack.clins.R are not a list (“{"a":1}”)');
    chk(name, 'the door', 'an added CLIN whose request holds a word', one(s => { yr(s).clinNew.Q[2].ask = [300, 'lots']; }),
      'the request of CLIN “0010”: the amount at ' + Y + '.clinNew.Q[2].ask[1] is not a figure (“lots”)');
    chk(name, 'the door', 'an added CLIN that is null', one(s => { yr(s).clinNew.Q[1] = null; }),
      'the CLIN at ' + Y + '.clinNew.Q[1] is not a CLIN (“null”)');
    chk(name, 'the door', 'a prime’s added CLINs that are not a list', one(s => { yr(s).clinNew.Q = 'x'; }),
      'the CLINs at ' + Y + '.clinNew.Q are not a list (“"x"”)');
    chk(name, 'the door', 'an edit to a CLIN whose request is not a list', one(s => { yr(s).clinMeta.P.b2.ask = {}; }),
      'the request of CLIN “b2” at ' + Y + '.clinMeta.P.b2.ask is not a list of figures (“{}”)');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
})();
// ---- v2.12 RV5 (S11): the tie-out's AV + PSM split claims the paragraphs the one rule reads, and no others ----------------------
// O&M, the estimate's three lines $1M each, all under the estimate's AV (PSM sits inside it): A (AV, an OGC) on 1.3; P (PSM, a
// prime) with CLIN 0001 on 1.2.2 and CLIN 0002 on 1.2.1; O (PSM, an OGC) on 1.2.1. CLIN 0002 removed in the drill keeps its
// paragraph so it can be put back, and the Spend Plan Source sends nothing on it: PSM claims 1.2.2 alone and 1.2.1 goes to the
// shared line (both offices or neither) -- until O claims it. Then P switched to an OGC (its CLINs' paragraphs left stored) and
// O to a prime (its own paragraph left stored, no CLIN): every surface but the tie-out read neither as having a WBS, and neither
// claims a line -- PSM $0, the two lines shared. Put back, each claim returns with it. Read from aceWbsOf, aceGroupSplit, the
// panel as drawn and the tie-out's suggestions, every figure from the literals above. On c81e995 PSM keeps both lines throughout:
// the removed-CLIN and type-switch checks fail; the before, put-back and switched-back checks are CONTROLs.
{
  const name = 'v2.12 RV5 — the tie-out’s AV + PSM split claims only the paragraphs the one rule reads: a removed CLIN, a prime switched to an OGC and back (S11)';
  try {
    const J = JSON.stringify;
    const X = boot();
    seed(X.ev, { services: ['USAF'], items: [w2it('A', 'AV', [100]), w2it('P', 'PSM', [300]), w2it('O', 'PSM', [200])],
      disc: [600], mand: [0], order: ['A', 'P', 'O'] });
    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.ptype={A:'OGC', P:'PRIME', O:'OGC'}; DATA.clins=DATA.clins||{};
      DATA.clins.P=[{clin:'0001', desc:'one', ccar:'', ask:[200]}, {clin:'0002', desc:'two', ccar:'', ask:[100]}]; CLINS.P=DATA.clins.P;
      S.wbs={A:[{w:'1.3', v:[]}]}; S.clinWbs={P:{b0:[{w:'1.2.2', v:[]}], b1:[{w:'1.2.1', v:[]}]}};
      ACEDB={ts:9, sets:${J({ '2026ACE': W2_SET })}}; window.confirm=function(){ return true; }; window.alert=function(){};
      applyState(S); save(); render(); 'ok'`);
    const M = 1e6;
    const read = () => JSON.parse(X.ev(`(function(){ var sp=aceGroupSplit('2026ACE', 'AV', ['AV','PSM'], [aceScan('2026ACE', MS.cur)]);
      aceOpen=true; render();
      var pan=[].slice.call(document.querySelectorAll('#aceBody tr.acesplit')).map(function(tr){ return [tr.getAttribute('data-g')||'shared', tr.children[1].textContent]; })
        .sort(function(x, y){ return ['AV','PSM','shared'].indexOf(x[0])-['AV','PSM','shared'].indexOf(y[0]); });
      aceOpen=false; render();
      return JSON.stringify({claims:[aceWbsOf('P'), aceWbsOf('O')], split:[sp.by.AV||0, sp.by.PSM||0, sp.shared], pan:pan,
        sug:aceSuggestFull('2026ACE','P').exact}); })()`));
    const pan = (av, psm, sh) => [['AV', '$' + av.toLocaleString('en-US')], ['PSM', '$' + psm.toLocaleString('en-US')], ['shared', '$' + sh.toLocaleString('en-US')]];
    chk(name, 'before', 'CONTROL: P claims both its CLINs’ paragraphs and O has none; PSM’s part is the two lines, nothing shared',
      J(read()), J({ claims: [['1.2.2', '1.2.1'], []], split: [M, 2 * M, 0], pan: pan(M, 2 * M, 0), sug: ['1.2.2', '1.2.1'] }));
    X.ev(`clinRemove('P','b1'); 'ok'`);
    chk(name, 'a removed CLIN', 'its paragraph (kept so it can be put back) claims nothing: PSM 1.2.2 alone, 1.2.1 on the shared line, on the panel and in the suggestions',
      J([X.ev(`JSON.stringify(S.clinWbs.P.b1)`), read()]), J([J([{ w: '1.2.1', v: [] }]), { claims: [['1.2.2'], []], split: [M, M, M], pan: pan(M, M, M), sug: ['1.2.2'] }]));
    X.ev(`clinRestore('P','b1'); 'ok'`);
    chk(name, 'a removed CLIN', 'CONTROL: put back, its claim comes back with it', J(read().split), J([M, 2 * M, 0]));
    X.ev(`S.wbs.O=[{w:'1.2.1', v:[]}]; save(); render(); reqApply('P', {ptype:'OGC'}); reqApply('O', {ptype:'PRIME'}); 'ok'`);
    chk(name, 'switched', 'P now an OGC and O a prime, their old paragraphs left stored (a CONTROL on the fixture), and neither has a WBS on the one rule',
      X.ev(`JSON.stringify([ptypeOf('P'), ptypeOf('O'), Object.keys(S.clinWbs.P), S.wbs.O, wbsStateOf('P').has, wbsStateOf('O').has])`),
      J(['OGC', 'PRIME', ['b0', 'b1'], [{ w: '1.2.1', v: [] }], false, false]));
    chk(name, 'switched', 'so neither claims a line: PSM $0, 1.2.1 and 1.2.2 on the shared line, on the panel too',
      J((r => [r.claims, r.split, r.pan])(read())), J([[[], []], [M, 0, 2 * M], pan(M, 0, 2 * M)]));
    X.ev(`reqApply('P', {ptype:'PRIME'}); reqApply('O', {ptype:'OGC'}); 'ok'`);
    chk(name, 'switched', 'CONTROL: switched back, the stored paragraphs claim again (O and P both PSM: still PSM’s two lines)',
      J((r => [r.claims, r.split])(read())), J([[['1.2.2', '1.2.1'], ['1.2.1']], [M, 2 * M, 0]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ---- v2.12 RV5 (S12, S15): the PMO review and its change report show a proposed requirement's WBS, named or flagged --------------
// An office proposes four new requirements: N1 on 1.2.2, N2 on 9.9 (a paragraph the board's estimate does not hold -- typed in a
// copy published before the estimate, or before a newer one came in), N3 split across 1.2.1 and 9.9, N4 a prime with none. The
// review table as drawn and the change report read from its bytes each name every paragraph with its path, and flag 9.9, the way
// an edit's WBS reads (K03); N4 shows none. Ticked and applied, each lands on what was shown (a CONTROL: the landing was right) and
// the flagged ones are exactly those Needs attention then lists as ≠ WBS not in the estimate. On c81e995 the review and the report
// print no WBS at all for a proposal: those checks fail.
await (async () => {
  const name = 'v2.12 RV5 — the PMO review and its change report show a proposed new requirement’s WBS, named, or flagged where the estimate does not hold it (S12, S15)';
  try {
    const J = JSON.stringify;
    const B = w2Board(W2_SET), ev = B.ev;
    ev(`window.alert=function(){}; window.confirm=function(){ return true; };
      (function(){ var P=function(nid, e, pt, w){ return {nid:nid, grp:'AV', title:'', event:e, ask:[50,0], ccar:'', desc:'what it buys', cons:'what is lost',
        notes:'', pid:'', recNames:'', mipr:'', obCat:'', ptype:pt, wbs:w, dest:{to:'', end:''}, awards:null, minInc:null, band:'', mc:false,
        costElem:'', si:'', rcnAsg:'', budgetAsg:null, rcnSvc:null, crHalf:null, prior:null, titles:''}; };
      PMOSUBS=[]; PMOPICK={};
      pmoTake({spmtPkg:1, dir:'submit', ap:'', fy:MS.cur, ts:Date.now(), by:'PMO', fromTs:1, pmo:'AV', svc:SVC.slice(), items:{}, base:{},
        added:[P('NEW-AV-1','N1 event','OGC',[{w:'1.2.2', v:[]}]), P('NEW-AV-2','N2 event','OGC',[{w:'9.9', v:[]}]),
               P('NEW-AV-3','N3 event','OGC',[{w:'1.2.1', v:[30,0]}, {w:'9.9', v:[20,0]}]), P('NEW-AV-4','N4 event','PRIME',[])]}, 'sub.json'); })();
      subOpenReview(); 'ok'`);
    const W = {
      N1: 'WBS 1.2.2 — ' + W2_PATH['1.2.2'],
      N2: 'WBS 9.9 (not in the 2026ACE estimate for O&M)',
      N3: 'WBS 1.2.1 — ' + W2_PATH['1.2.1'] + ' · 9.9 (not in the 2026ACE estimate for O&M)' };
    const seen = rows => ['N1', 'N2', 'N3', 'N4'].map(n => { const t = rows.filter(x => x.includes(n + ' event'))[0] || '';
      return [n, W[n] ? t.includes(W[n]) : !/\bWBS\b/.test(t)]; });
    const drawn = JSON.parse(ev(`JSON.stringify([].map.call(document.querySelectorAll('#subPanel tr'), function(tr){ return tr.textContent.replace(/\\s+/g,' ').trim(); }))`));
    chk(name, 'the review', 'each proposal’s row names its paragraphs, flags 9.9, and N4 (no WBS) shows none',
      J(seen(drawn)), J([['N1', true], ['N2', true], ['N3', true], ['N4', true]]));
    const bk = JSON.parse(await w2Book(B.w, 'pmoReport'));
    chk(name, 'the change report', 'the report builds and reads back', bk.__err || 'ok', 'ok');
    const rep = (bk['Proposed changes'] || []).filter(r => String(r[5] ?? '') === 'New requirement (proposed)').map(r => String(r[7] ?? ''));
    chk(name, 'the change report', 'its Proposed cell for each proposal reads the same: named, flagged, and nothing for N4',
      J([rep.length, seen(rep)]), J([4, [['N1', true], ['N2', true], ['N3', true], ['N4', true]]]));
    ev(`subPickAll(true); pmoApply(); 'ok'`);
    const land = JSON.parse(ev(`JSON.stringify((S.custom||[]).filter(function(c){ return c.from; }).map(function(c){
      return [c.event.replace(/ event$/,''), ((S.wbs||{})[c.id]||[]).map(function(e){ return e.w; })]; }))`));
    chk(name, 'applied', 'CONTROL: each lands on what the review showed', J(land), J([['N1', ['1.2.2']], ['N2', ['9.9']], ['N3', ['1.2.1', '9.9']], ['N4', []]]));
    chk(name, 'applied', 'and the ones the review flagged are the ones Needs attention lists as not in the estimate',
      ev(`JSON.stringify(attLists().wbsx.map(function(r){ var it=itemById(r.id); return it.event.replace(/ event$/,''); }).filter(function(n){ return /^N\\d$/.test(n); }).sort())`),
      J(['N2', 'N3']));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
})();
// ---- v2.12 RV5 (S13): Without a WBS names the CLIN whose one WBS line has no paragraph ------------------------------------------
// P is a prime: CLIN 0001 requests $200 and CLIN 0002 $100, on 1.3. In the WBS panel the person adds a line to CLIN 0001 (＋ Add WBS,
// clicked as drawn) and leaves it blank: the Spend Plan Source sends its $200 blank, and Needs attention must say which CLIN to
// fix -- as it reads when the CLIN has no line at all (a CONTROL, first). The same once a paragraph typed into that line is
// cleared. A requirement that is not a prime with one blank line still reads "no paragraph" (a CONTROL). On c81e995 both blank
// cases read "no paragraph", naming no CLIN, though a prime's record has no WBS field to fix it in.
{
  const name = 'v2.12 RV5 — Without a WBS names the CLIN whose one WBS line has no paragraph (S13)';
  try {
    const J = JSON.stringify;
    const X = boot();
    seed(X.ev, { services: ['USAF'], items: [w2it('P', 'AV', [300]), w2it('C', 'AV', [90])], disc: [390], mand: [0], order: ['P', 'C'] });
    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.ptype={P:'PRIME', C:'OGC'}; DATA.clins=DATA.clins||{};
      DATA.clins.P=[{clin:'0001', desc:'one', ccar:'', ask:[200]}, {clin:'0002', desc:'two', ccar:'', ask:[100]}]; CLINS.P=DATA.clins.P;
      S.clinWbs={P:{b1:[{w:'1.3', v:[]}]}}; S.wbs={C:[{w:'', v:[]}]};
      ACEDB={ts:9, sets:${J({ '2026ACE': W2_SET })}}; applyState(S); save(); render(); 'ok'`);
    const why = () => X.ev(`JSON.stringify(attLists().wbs.map(function(r){ return [r.id, r.blank, r.why]; }))`);
    chk(name, 'no line', 'CONTROL: CLIN 0001 with no line at all is named; C’s one blank line reads no paragraph',
      why(), J([['P', 200, ['CLIN 0001 has no paragraph']], ['C', 90, ['no paragraph']]]));
    X.ev(`toggleWbs('clin','P','b0'); [].filter.call(document.querySelectorAll('button'), function(b){ return /Add WBS/.test(b.textContent); })[0].click(); 'ok'`);
    chk(name, 'one blank line', 'a line added to CLIN 0001 and left blank: stored as one line with no paragraph (a CONTROL on the fixture)',
      X.ev(`JSON.stringify(S.clinWbs.P.b0.map(function(e){ return e.w; }))`), J(['']));
    chk(name, 'one blank line', 'Needs attention names CLIN 0001, as with no line', why(), J([['P', 200, ['CLIN 0001 has no paragraph']], ['C', 90, ['no paragraph']]]));
    X.ev(`attShow('wbs'); 'ok'`);
    chk(name, 'one blank line', 'and the list as drawn says it', X.ev(`JSON.stringify([].slice.call(document.querySelectorAll('#attBody td.attwbs')).map(function(td){ return td.textContent; }))`),
      J(['CLIN 0001 has no paragraph', 'no paragraph']));
    X.ev(`attClose(); wbsSetNum('clin','P','b0',0,'1.2.1'); wbsSetNum('clin','P','b0',0,''); 'ok'`);
    chk(name, 'a paragraph cleared', 'a paragraph typed into that line and cleared reads the same', why(), J([['P', 200, ['CLIN 0001 has no paragraph']], ['C', 90, ['no paragraph']]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ---- v2.12 RV5 (S16): WBS from execution data reads the Spend Plan Source's own WBS back, and picks from the estimate -------------
// Item 132 (Brad's decision 4): ORBIT sends each line's paragraph in column 23 and "reads the same column back". B is split by the
// office across 1.3.1 and 1.3.2, C is on 1.2.1, E across 1.3.1 and 1.2.1; A and D have none. The board's own Spend Plan Source,
// exported and imported back as the CCaR pull (the real exportSrc bytes through the real importSrc), sends B and E a line per
// paragraph; then E's WBS is cut to 1.3.1 alone, and the pull's lines for A and D are given "9.9.9 - Not in the estimate" (a
// paragraph the estimate the pickers offer does not hold) and "1.2.2 - Depot". B and C already carry exactly what their rows name:
// said as already set, as sent -- never a conflict "to set by hand", never "ready to write". E's rows name a paragraph it no
// longer carries: a real conflict, still skipped (a CONTROL). A's 9.9.9 is listed apart and never written; D's 1.2.2 is ready to
// write, named, and written, as before. With no estimate naming O&M, 9.9.9 is taken as before v2.12 (a CONTROL). On c81e995 B is
// a conflict, C ready to write, and A's 9.9.9 written and only then flagged: those checks fail.
await (async () => {
  const name = 'v2.12 RV5 — WBS from execution data reads the Spend Plan Source’s own WBS back as already set, and picks a paragraph from the estimate (S16)';
  try {
    const J = JSON.stringify;
    const TREE = Object.assign({}, W2_TREE, { '1.3.1': { n: 'Field Service', lv: 3, up: '1.3' }, '1.3.2': { n: 'Depot Field', lv: 3, up: '1.3' } });
    const SET = Object.assign({}, W2_SET, { wbs: { om: TREE } });
    const X = boot();
    seed(X.ev, { services: ['USAF', 'ANG'],
      items: [w2it('A', 'AV', [100, 0], { ccar: 'JSF1', title: 'Alpha rec' }), w2it('B', 'AV', [900, 100], { ccar: 'JSF2', title: 'Bravo rec' }),
              w2it('C', 'AV', [500, 0], { ccar: 'JSF3', title: 'Charlie rec' }), w2it('D', 'AV', [70, 0], { ccar: 'JSF4', title: 'Delta rec' }),
              w2it('E', 'AV', [400, 0], { ccar: 'JSF5', title: 'Echo rec' })],
      disc: [5000, 500], mand: [0, 0], order: ['A', 'B', 'C', 'D', 'E'] });
    X.ev(`window.confirm=function(){ return true; }; window.alert=function(){};
      BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.ptype={A:'OGC', B:'OGC', C:'OGC', D:'OGC', E:'OGC'}; ACEDB={ts:9, sets:${J({ '2026ACE': SET })}};
      applyState(S); save(); render(); 'ok'`);
    // B and E split by the office through the WBS panel's own setters; C on one paragraph
    X.ev(`wbsStore('req','B','',[{w:'1.3.1', v:[]}]); wbsAdd('req','B',''); wbsSetNum('req','B','',1,'1.3.2',null);
      wbsSetVal('req','B','',0,0,'600'); wbsSetVal('req','B','',1,0,'300'); wbsSetVal('req','B','',0,1,'100');
      wbsStore('req','E','',[{w:'1.3.1', v:[]}]); wbsAdd('req','E',''); wbsSetNum('req','E','',1,'1.2.1',null);
      wbsSetVal('req','E','',0,0,'250'); wbsSetVal('req','E','',1,0,'150');
      wbsStore('req','C','',[{w:'1.2.1', v:[]}]); render(); 'ok'`);
    await X.w.eval(`(async function(){ var cap=null, _B=window.Blob, oC=HTMLAnchorElement.prototype.click;
      window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); }; HTMLAnchorElement.prototype.click=function(){};
      try{ exportSrc(); } finally { window.Blob=_B; HTMLAnchorElement.prototype.click=oC; }
      globalThis.__rv5sps=cap; return 'ok'; })()`);
    chk(name, 'the round trip', 'the board’s own Spend Plan Source sends B and E a line per paragraph (a CONTROL on the fixture)',
      J(JSON.parse(await X.w.eval(`(async function(){ var b=globalThis.__rv5sps; var r=await xlsxRead(b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength));
        var k=Object.keys(r)[0], o={}; r[k].slice(1).forEach(function(x){ var t=String(x[7]&&typeof x[7]==='object'? x[7].v : x[7]).replace(/ event$/,''), w=String(x[23]&&typeof x[23]==='object'? x[23].v : (x[23]==null? '' : x[23])).split(' - ')[0];
          if(w) (o[t]=o[t]||[]).indexOf(w)<0 && o[t].push(w); }); return JSON.stringify(o); })()`))),
      J({ B: ['1.3.1', '1.3.2'], C: ['1.2.1'], E: ['1.3.1', '1.2.1'] }));
    await X.w.eval(`importSrc({files:[{name:'Spend Plan Source.xlsx', arrayBuffer: async function(){ var b=globalThis.__rv5sps; return b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength); }}], value:''})`);
    await new Promise(r => setTimeout(r, 200));
    // what CCaR adds on its side: a paragraph on A and on D; and E's split cut to one paragraph on the board
    X.ev(`(function(){ var box=EXDB.all[mySlug()]; Object.keys(box.rows).forEach(function(fy){ box.rows[fy].forEach(function(r){
        var c=String(r[2]||''); if(c==='JSF1') r[23]='9.9.9 - Not in the estimate'; if(c==='JSF4') r[23]='1.2.2 - Depot'; }); }); })();
      S.wbs.E=[{w:'1.3.1', v:[]}]; save(); render(); 'ok'`);
    const scan = () => JSON.parse(X.ev(`(function(){ var s=execWbsScan(null), m=function(L, f){ return (L||[]).map(function(r){ return [r.id, f(r)]; }); };
      return JSON.stringify({props:m(s.props, function(r){ return r.para; }), conflicts:m(s.conflicts, function(r){ return r.paras.slice().sort(); }),
        asSent:m(s.asSent, function(r){ return r.paras.slice().sort(); }), unlisted:m(s.unlisted, function(r){ return r.off; })}); })()`));
    const S0 = scan();
    chk(name, 'the round trip', 'B’s split and C’s paragraph come back as already set, as sent -- not a conflict, not ready to write',
      J([S0.asSent, S0.conflicts.filter(r => r[0] !== 'E'), S0.props.filter(r => r[0] === 'C')]), J([[['B', ['1.3.1', '1.3.2']], ['C', ['1.2.1']]], [], []]));
    chk(name, 'the round trip', 'CONTROL: E’s rows name a paragraph it no longer carries -- still a conflict, skipped', J(S0.conflicts.filter(r => r[0] === 'E')), J([['E', ['1.2.1', '1.3.1']]]));
    chk(name, 'the pick rule', 'A’s 9.9.9, a paragraph the estimate does not hold, is listed apart, not offered to write; D’s 1.2.2 still is',
      J([S0.unlisted, S0.props]), J([[['A', ['9.9.9']]], [['D', '1.2.2']]]));
    X.ev(`toggleExw(); 'ok'`);
    const pan = X.ev(`(document.getElementById('exwBody')||{}).textContent.replace(/\\s+/g,' ')`);
    const conf = X.ev(`([].map.call(document.querySelectorAll('#exwBody .hint'), function(d){ return d.textContent; }).filter(function(t){ return /DIFFERENT paragraphs/.test(t); })[0]||'')`);
    chk(name, 'the panel', 'it says each: 9.9.9 not written, B and C already set as sent, D named, and B is no conflict to set by hand',
      J([/1 requirement had rows naming a paragraph the 2026ACE estimate for O&M does not hold\. Not written/.test(pan) && /· A event — 9\.9\.9/.test(pan),
        /2 requirements already carry exactly the paragraphs their rows name/.test(pan) && /· B event — 1\.3\.1, 1\.3\.2/.test(pan) && /· C event — 1\.2\.1/.test(pan),
        pan.includes('1.2.2 — ' + W2_PATH['1.2.2']), [conf.includes('E event'), conf.includes('B event'), conf.includes('C event')]]),
      J([true, true, true, [true, false, false]]));
    X.ev(`exwApply(); toggleExw(); 'ok'`);
    chk(name, 'written', 'Write puts D on 1.2.2, as before, and nothing on A; B, C and E are as they were, and the status line says why',
      X.ev(`JSON.stringify([(S.wbs.A||[]).map(function(e){ return e.w; }), S.wbs.D.map(function(e){ return e.w; }), S.wbs.B.map(function(e){ return e.w; }),
        S.wbs.C.map(function(e){ return e.w; }), S.wbs.E.map(function(e){ return e.w; }),
        /1 written, 1 in conflict and skipped, 1 naming a paragraph the estimate does not hold, not written\\./.test(document.getElementById('shareStat').textContent)])`),
      J([[], ['1.2.2'], ['1.3.1', '1.3.2'], ['1.2.1'], ['1.3.1'], true]));
    X.ev(`ACEDB={ts:10, sets:{}}; delete S.wbs.D; save(); render(); 'ok'`);
    chk(name, 'no estimate', 'CONTROL: with no estimate naming O&M, A’s 9.9.9 is taken as before v2.12', J(scan().props.filter(r => r[0] === 'A')), J([['A', '9.9.9']]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
})();
// ==== end v2.12 W2 ====

// ==== v2.12 W3 (item 134): every year's budget is the PPBE position; over and under flagged; unallocated added funds as UPL ====
// v2.12 RV6 (S05, S14, S17): FYDP Disconnects reads each appropriation's position through the board's one rule (ppLanesOf). A
// SPLIT POSITION IS READ AS IT ALWAYS WAS, to the byte: this block builds the v2.10 / v2.11 shapes -- three appropriations, split
// positions with cents in both lanes (rounded at the door), a year a position does not log, a service no group takes (the v2.11
// note), the other appropriations' stores holding their own bases (so a split read as one figure would divide differently) -- and
// holds the model, the workbook's sheets and the box's text to what the board before the change (c81e995, read from git) gives for
// the same fixture. The one-figure readings are the v2.12 W3 slot's RV6 block in audit-board.
// PASSES ON c81e995 BY CONSTRUCTION (it is the board compared against): a CONTROL of the rewrite, proved by its mutations.
{
  const name = 'v2.12 RV6 — FYDP Disconnects reads a split position exactly as before: the model, the sheets and the box, against the board before the one rule (S05, S14)';
  try {
    const J = JSON.stringify;
    const E = (ev, code) => { try { return ev(code); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 160); } };
    const SV = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'], YRS = [2027, 2028, 2029, 2030, 2031, 2032];
    const lines = []; ['om', 'ff', 'sp'].forEach((ap, a) => SV.forEach((sv, s) => { const v = {}; YRS.forEach(y => { v[y] = (a + 1) * 1e9 + (s + 1) * 1e7 + (y - 2020) * 1e5; }); lines.push({ ap, pmo: 'AV', svc: sv, v }); }));
    // split, cents in both lanes, FY31 not logged; `extra` adds a service no sheet takes
    const posOf = (a, extra) => { const P = { v: 2, split: true, lines: {}, val: {} };
      SV.concat(extra ? [extra] : []).forEach((sv, s) => { P.lines[sv] = [{ k: '_all', all: true }]; P.val[sv] = { _all: {} };
        YRS.filter(y => y !== 2031).forEach(y => { P.val[sv]._all[y] = { d: (a + 1) * 2e8 + (s + 1) * 3e6 + (y - 2020) * 1e4 + 0.4, m: (s + 1) * 1e5 + a * 1e3 + 0.6 }; }); });
      return P; };
    const yearsOf = k => { const o = {}; [2027, 2028, 2029].forEach(y => { o[y] = { bm: { disc: SV.map((s, i) => (i + 1) * 7e6 * k), mand: SV.map((s, i) => (i + 2) * 3e6 * k), adds: [] } }; }); return o; };
    const store = (a, extra) => J({ base: 2027, cur: 2027, ts: 5, order: [], ppbe: { 'BES|2028': posOf(a, extra) }, dataPack: { services: SV, items: [], budget: [] }, years: yearsOf(a + 1) });
    const SETS = { '2025ACE': { label: '2025ACE', ts: 2000, years: YRS.slice(), lines, appn: {}, skip: {} } };
    const setUp = B => { seed(B.ev, { services: SV, items: [], disc: SV.map((s, i) => (i + 1) * 5e6), mand: SV.map((s, i) => (i + 1) * 2e6), order: [] });
      E(B.ev, `ACEDB.sets=${J(SETS)}; ACEDB.ts=4000; MS.ppbe={'BES|2028':${J(posOf(0, 'F-35B'))}}; MS.cycle='BES|2028';
        localStorage.setItem(_SLUGMAP.ff.key, ${J(store(1, 'NAVY-X'))}); localStorage.setItem(_SLUGMAP.sp.key, ${J(store(2))}); render(); 'ok'`); };
    const read = B => E(B.ev, `(function(){ var M=fdcModel({ace:'2025ACE', cyc:'BES|2028'}); if(!fdcOpen) toggleFdc();
      var box=(document.getElementById('fdcBody')||{}).textContent||''; toggleFdc(); return JSON.stringify({M:M, sheets:fdcSheets(M), box:box}); })()`);
    const N = boot(); setUp(N);
    const mine = read(N), M = (JSON.parse(mine.startsWith('threw') ? 'null' : mine) || {}).M || { sheets: [] };
    const lane = (ap, lbl) => ((M.sheets[0] || { rows: [] }).rows.filter(r => r.t === 'line' && r.ap === ap && r.label === lbl)[0] || {}).vals;
    chk(name, 'the fixture', 'CONTROL: the positions are split and carry mandatory money, rounded at the door (O&M FY27 USAF 203,070,000.4 + 100,000.6 read as 203,070,000 / 100,001 -- the Summary adds six services)',
      J([lane('om', 'Discretionary')[0], lane('om', 'Mandatory')[0]]),
      J([SV.reduce((t, s, i) => t + Math.round(2e8 + (i + 1) * 3e6 + 7e4 + 0.4), 0) + Math.round(2e8 + 7 * 3e6 + 7e4 + 0.4), SV.reduce((t, s, i) => t + Math.round((i + 1) * 1e5 + 0.6), 0) + Math.round(7e5 + 0.6)]));
    chk(name, 'the fixture', 'CONTROL: and the note names the services no sheet takes, as v2.11 wrote it', M.note,
      'Counted on the Summary only, on no service sheet: F-35B (O&M BES28); NAVY-X (Full Fund BES28).');
    const { execFileSync } = await import('node:child_process');
    const root = _selfPath(new URL('../..', import.meta.url));
    let before = null;
    try { before = execFileSync('git', ['-C', root, 'show', 'c81e995:prioritization-board-grid.html'], { encoding: 'utf8', maxBuffer: 64 << 20 }); }
    catch (e) { failures.push({ scenario: name, where: 'the board before', what: 'c81e995’s board could not be read from git (a shallow clone? git fetch --unshallow): ' + String((e && e.message) || e).slice(0, 120), got: 'unread', want: 'read' }); }
    if (before) {
      const O = boot({ html: before }); setUp(O);
      chk(name, 'the board before', 'CONTROL: the board read from git has no one rule for a position (it is the board before RV6)', E(O.ev, `typeof ppLanesOf`), 'undefined');
      const theirs = read(O), P = s => { try { return JSON.parse(s); } catch { return {}; } }, a = P(mine), b = P(theirs);
      chk(name, 'the model', 'fdcModel gives exactly what the board before gave: every sheet, row, figure, total and the note', J(a.M), J(b.M));
      chk(name, 'the sheets', 'fdcSheets writes exactly what it wrote: every row, merge, height and style', J(a.sheets) === J(b.sheets) && J(a.sheets).length > 1000, true);
      chk(name, 'the box', 'and the box says exactly what it said', a.box === b.box && a.box.length > 200, true);
      if (O.errors.length) chk(name, 'jsdom', 'no script errors (the board before)', O.errors.slice(0, 2).join(' | '), '');
    }
    if (N.errors.length) chk(name, 'jsdom', 'no script errors', N.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ==== end v2.12 W3 ====

// ==== v2.14 W1 (item 140; item 141 D): Save writes only to its own file, and asks before writing over what it does not carry ====
// ==== end v2.14 W1 ====

// ==== v2.14 W2 (item 141): a full import too big for browser storage goes into a new file ====
// ==== end v2.14 W2 ====

// ==== v2.14 W3 (item 141 F, G; item 140 c): browser storage refused or full ====
// Item 141 G: SAVE DIAGNOSTICS SAYS WHAT FILLS BROWSER STORAGE, BY KIND. Brad's refused import named the write at which storage
// ran out, not what filled it; "Browser storage: N entries, X MB" could not tell a board too big on its own from one that met
// storage already full of PMO copies, another board or another web page. Each kind's entries and characters here are the
// harness's own sums over the keys it reads itself, sorted by the contract's rule restated here (never read back from
// diagLsKinds). The report names no key and reads no value: another tool's key may name a person.
{
  const name = 'v2.14 W3 — Save diagnostics counts browser storage by kind and names no key that is not ORBIT’s (item 141 G)';
  try {
    const J = JSON.stringify;
    const mkI = (id, ask) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Req ' + id, event: 'E' + id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
    const B = boot(); seed(B.ev, { services: ['USAF', 'ANG'], items: [mkI('A', [100, 20])], disc: [120, 20], mand: [30, 10], order: ['A'] });
    B.ev(`save(); render(); 'ok'`);
    const PLANT = {
      'prio27om-cyc': 'c'.repeat(100), 'prio27acedb': 'a'.repeat(50), 'prio27om.kept': 'k'.repeat(30),
      'prio27om-pmo1790000000000': 'p'.repeat(70), 'prio27om-pmo1790000000000.base': '{"file":0,"dirty":true}', 'prio27execdb-pmo1791111111111': 'e'.repeat(10),
      'prio27appn': 'O&M', 'spmtTheme': 'harbor',
      'vellichor-<img src=x>': 's'.repeat(400), 'zanzibar-secret-token': 'Brunhilde Okonkwo',
    };
    B.ev(`(function(){ var P=${J(PLANT)}; for(var k in P) localStorage.setItem(k, P[k]); })(); 'ok'`);
    const ls = JSON.parse(B.ev(`JSON.stringify((function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return o; })())`));
    // the rule, first match wins (contract §7; map.md storage-full, Functions 18)
    const kindOf = k => !/^(prio27|spmt)/.test(k) ? 'Not ORBIT' : /-pmo\d+/.test(k) ? 'PMO copies' : /\.kept$/.test(k) ? 'Work kept aside'
      : /\.base$/.test(k) ? 'Save records' : /^prio27(om|ff|sp|opn)-cyc$/.test(k) ? 'Locked cycles' : /^prio27(om|ff|sp|opn)$/.test(k) ? 'Boards'
      : /^prio27(execdb|acedb|buddb|reprog|destdb)$/.test(k) ? 'Lists' : 'Settings';
    const ORDER = ['Boards', 'Locked cycles', 'Lists', 'Work kept aside', 'Save records', 'PMO copies', 'Settings', 'Not ORBIT'];
    const want = Object.fromEntries(ORDER.map(l => [l, { n: 0, c: 0 }]));
    for (const [k, v] of Object.entries(ls)) { const w = want[kindOf(k)]; w.n++; w.c += k.length + v.length; }
    const wantLines = ORDER.map(l => '    ' + (l + ':').padEnd(18) + (want[l].n ? want[l].n + ' entr' + (want[l].n === 1 ? 'y' : 'ies') + ', ' + want[l].c + ' characters' : 'none')
      + (l === 'PMO copies' && want[l].n ? ' (2 publish dates)' : ''));
    chk(name, 'the fixture', 'the planted keys sort as the rule says: a copy’s .base is a PMO copy, two keys are not ORBIT’s, every kind is there (a CONTROL)',
      J([want['PMO copies'].n, want['Not ORBIT'].n, ORDER.filter(l => !want[l].n)]), J([3, 2, []]));
    const rep = B.ev('diagReport()'), L = rep.split(/\r?\n/);
    const at = L.indexOf('  Storage by kind:    characters, keys and values together, as browser storage counts them');
    chk(name, 'by kind', 'Save diagnostics has the “Storage by kind” heading, right after “Browser storage”', J([at > 0, /^  Browser storage:    /.test(L[at - 1] || '')]), J([true, true]));
    chk(name, 'by kind', 'each kind, in order: its entries and characters are the harness’s own sums of the keys it read', J(L.slice(at + 1, at + 1 + ORDER.length)), J(wantLines));
    const tot = +((rep.match(/Browser storage: {4}(\d+) entries/) || [])[1]);
    const kinds = L.slice(at + 1, at + 1 + ORDER.length).reduce((s, l) => s + (+((l.match(/: +(\d+) entr/) || [])[1] || 0)), 0);
    chk(name, 'by kind', 'the kinds add up to the entries on the “Browser storage” line', J([kinds, tot]), J([Object.keys(ls).length, Object.keys(ls).length]));
    chk(name, 'names nothing', 'no key that is not ORBIT’s, no value and no markup reaches the report',
      ['vellichor', 'zanzibar', 'secret-token', 'Brunhilde', 'Okonkwo', '<img', 'sssssssss'].filter(s => rep.indexOf(s) >= 0).join(', ') || 'none', 'none');
    chk(name, 'names nothing', 'nor any ORBIT key: the report counts, it does not list', ['prio27om-cyc', 'prio27om.kept', 'pmo1790000000000', 'spmtTheme'].filter(s => rep.indexOf(s) >= 0).join(', ') || 'none', 'none');
    // the box shows the same report
    B.ev(`toggleDiag(); 'ok'`);
    chk(name, 'the box', 'Save diagnostics’ box shows the same lines', J(B.ev(`document.getElementById('diagPre').textContent`).split(/\r?\n/).slice(at, at + 1 + ORDER.length)), J(L.slice(at, at + 1 + ORDER.length)));
    if (B.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ==== end v2.14 W3 ====

// ==== v2.14 W4 (items 129, 124; ledger U63, U64, U35): the held findings ====
// ==== end v2.14 W4 ====

// ==== v2.14 integration (the lead) ====
// ==== end v2.14 integration ====
// ==== v2.14 review round 1 fixes ====
// ---- RV1-A (the file route) ----
// ---- end RV1-A ----

// ---- RV1-B (cycles, packages, storage) ----
// ---- end RV1-B ----

// ---- RV1-C (Save and the import doors) ----
// ---- end RV1-C ----

// ---- RV1-D (held findings and older files) ----
// ---- end RV1-D ----
// ==== end v2.14 review round 1 fixes ====
// ==== v2.14 review round 2 fixes ====
// ---- RV2-A (the file route and Save) ----
// ---- end RV2-A ----
// ---- RV2-B (other appropriations, cycles and packages) ----
// ---- end RV2-B ----
// ---- RV2-C (round 2, second half: C) ----
// ---- end RV2-C ----
// ---- RV2-D (round 2, second half: D) ----
// ---- end RV2-D ----
// ==== end v2.14 review round 2 fixes ====

// ==== v2.15 W1 (items 137, 138, 139: the context bar, a package under the receiving cycle, retag every locked appropriation) ====
// ==== end v2.15 W1 ====
// ==== v2.15 W2 (items 142, 143, 145; item 131 FDC listener: the copy that opens, Save records what it wrote, two tabs) ====
// v2.15 W2 (item 131): FYDP Disconnects left open while another tab of this browser saves an appropriation. The box was a reading
// behind -- nothing redrew it -- and Export read storage afresh, so the workbook could carry figures the box on screen did not. Here
// O&M is on screen with the estimate and its own BES28 position; Full Fund's plan, with a BES28 position of its own, is in browser
// storage; another tab then saves Full Fund with other controls, and the browser tells this page (the storage event). Every check
// fails on the slot commit unless it says CONTROL.
{
  const name = 'v2.15 W2 — FYDP Disconnects follows another tab’s save, never under a figure being typed, and Export refuses figures that moved (item 131)';
  try {
    const J = JSON.stringify;
    const E = (ev, code) => { try { return ev(code); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 160); } };
    const SV6 = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'];
    const mk = () => {
      const B = boot();
      seed(B.ev, { services: SV6, items: [], disc: SV6.map(() => 0), mand: SV6.map(() => 0), order: [] });
      E(B.ev, `(function(){ var Y=[2026,2027,2028,2029,2030,2031,2032,2033], S6=${J(SV6)}, L=[];
        ['om','ff','sp'].forEach(function(ap, a){ S6.forEach(function(sv, s){ var v={}; Y.forEach(function(y){ v[y]=(a+1)*9e8+(s+1)*4e7+(y-2020)*3e6; }); L.push({ap:ap, pmo:'AV', svc:sv, v:v}); }); });
        ACEDB.sets={'2025ACE':{label:'2025ACE', ts:2000, years:Y, lines:L, appn:{}, skip:{}}};
        window.__pos=function(d){ var val={}, lines={}; S6.forEach(function(sv, s){ lines[sv]=[{k:'_all', all:true}]; val[sv]={_all:{}};
          [2027,2028,2029,2030,2031,2032].forEach(function(y){ val[sv]._all[y]={d:d+(s+1)*1e6, m:0}; }); }); return {'BES|2028':{v:2, split:true, lines:lines, val:val}}; };
        MS.ppbe=__pos(130000000); MS.cycle='BES|2028';
        var ff=JSON.parse(JSON.stringify(MS)); ff.ppbe=__pos(777000000); ff.ts=Date.now();
        localStorage.setItem(_SLUGMAP.ff.key, JSON.stringify(ff));
        window.__dl=0; URL.createObjectURL=function(){ return 'blob:x'; }; HTMLAnchorElement.prototype.click=function(){ if(/\\.xlsx$/.test(this.download||'')) __dl++; };
        toggleFdc(); })(); 'ok'`);
      return B;
    };
    // another tab saves Full Fund with other controls, and the browser says so
    const tab = (B, d) => E(B.ev, `(function(){ var old=localStorage.getItem(_SLUGMAP.ff.key), ff=JSON.parse(old); ff.ppbe=__pos(${d}); ff.ts=Date.now()+10;
      var v=JSON.stringify(ff); localStorage.setItem(_SLUGMAP.ff.key, v);
      window.dispatchEvent(new StorageEvent('storage', {key:_SLUGMAP.ff.key, oldValue:old, newValue:v})); return 'ok'; })()`);
    const body = B => E(B.ev, `document.getElementById('fdcBody').textContent`);
    const ffCtl = B => E(B.ev, `(function(){ var M=fdcModel(); return JSON.stringify(M? M.sheets[0].rows.filter(function(r){ return r.t==='line'; }).map(function(r){ return r.vals; }) : null); })()`);
    // 1. NOTHING BEING TYPED: the open box is drawn again with the other tab's figures, and Export writes them
    {
      const B = mk();
      const b0 = body(B), m0 = ffCtl(B);
      chk(name, '1. the fixture', 'the box is open, drawn, and Full Fund’s controls are in it (a CONTROL)', J([E(B.ev, 'String(fdcOpen)'), /Export to Excel/.test(b0), m0 !== 'null']), J(['true', true, true]));
      tab(B, 888000000);
      chk(name, '1. another tab saves', 'the model moved (a CONTROL)', ffCtl(B) !== m0, true);
      chk(name, '1. another tab saves', 'the box on screen is drawn again with the figures as they are now', body(B) !== b0, true);
      E(B.ev, 'exportFdc(); 0');
      chk(name, '1. Export', 'it writes the workbook, the box and it agreeing', E(B.ev, 'String(__dl)'), '1');
    }
    // 2. A FIGURE BEING TYPED: nothing is drawn under it; Export refuses, saying the figures moved, and draws the box again; then writes
    {
      const B = mk();
      E(B.ev, `(function(){ var e=document.getElementById('fdcIn_ir_om_2028'); e.focus(); e.value='12'; e.dispatchEvent(new Event('input',{bubbles:true})); return 'ok'; })()`);
      const b0 = body(B);
      tab(B, 888000000);
      chk(name, '2. typing', 'nothing is drawn under the figure being typed: the box and the field stand, the typing kept',
        J([body(B) === b0, E(B.ev, `(document.activeElement||{}).id||''`), E(B.ev, `document.getElementById('fdcIn_ir_om_2028').value`)]), J([true, 'fdcIn_ir_om_2028', '12']));
      E(B.ev, `(function(){ document.activeElement.blur(); exportFdc(); return 'ok'; })()`);
      chk(name, '2. Export behind', 'nothing is downloaded, and the box says the figures moved', J([E(B.ev, 'String(__dl)'), /figures moved since the box was drawn/.test(E(B.ev, `document.getElementById('fdcMsg').textContent`)),
        /figures moved since the box was drawn/.test(E(B.ev, `document.getElementById('shareStat').textContent`))]), J(['0', true, true]));
      chk(name, '2. Export behind', 'and the box is drawn again with the figures as they are now (CONTROL on the slot commit: its status line redraws it there)', body(B) !== b0, true);
      E(B.ev, 'exportFdc(); 0');
      chk(name, '2. Export behind', 'Export again writes the workbook', E(B.ev, 'String(__dl)'), '1');
    }
    // 3. CONTROL: one tab alone -- an International figure typed, then Export straight away, writes the workbook as it always has
    {
      const B = mk();
      E(B.ev, `(function(){ var e=document.getElementById('fdcIn_ir_om_2028'); e.focus(); e.value='12'; e.dispatchEvent(new Event('input',{bubbles:true}));
        e.blur(); e.dispatchEvent(new Event('change',{bubbles:true})); exportFdc(); return 'ok'; })()`);
      chk(name, '3. one tab alone', 'a figure typed and Export pressed at once: the workbook is written, the figure in it (a CONTROL)',
        J([E(B.ev, 'String(__dl)'), E(B.ev, 'String(FDC_INTL.ir.om[2028])')]), J(['1', '12000000']));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ==== end v2.15 W2 ====
// ==== v2.15 W3 (items 144, 146 (storage writes, Save and import wording, test gaps)) ====
// ==== end v2.15 W3 ====
// ==== v2.15 W4 (items 131, 135 and the handoff small fixes: folder reads, house indents, CLIN request, guide, drill, Funded) ====
// ==== end v2.15 W4 ====
// ==== v2.15 integration (the lead) ====
// ==== end v2.15 integration ====

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
