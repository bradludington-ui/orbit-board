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
    chk(name, 'the left menu', 'FYDP ▸ lists FYDP Disconnects… after the Spruills, opening toggleFdc',
      E(B.ev, `(function(){ var d=document.createElement('div'); d.innerHTML=uiFlyItems('fydp'); return JSON.stringify([].map.call(d.querySelectorAll('button'), function(b){ return (b.getAttribute('onclick')||'').replace(/^uiFlyClose\\(\\);mRun\\((\\w+)\\)$/,'$1'); })); })()`),
      J(['toggleFydp', 'toggleSp', 'toggleFdc', 'toggleP2', 'toggleFlow']));
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
    const posOf = f => { const v = {}; YRS.forEach(y => { v[y] = f(y); }); return { v: 2, split: false, lines: { USN: [{ k: '_all', all: true }] }, val: { USN: { _all: v } } }; };
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
    const HDR = ['Index', 'Sub Index', 'PALS/O&S', '$ Type', 'US/PTN/FMS', 'Service', 'T/M/S', 'Rollup Value?', 'JPO Managed', 'Shared/Unique',
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
      { wbs: 'P6.2.2.1', pals: 'PALS', slc: 'Depot Activation', appus: 'Procurement', pmo: 'Propulsion', ces: DS.concat(['Propulsion', 'Engine shop']), d: { 2027: 1100009, 2028: 1200010 },
        x: { ap: 'ff', pmo: 'PP', svc: 'USAF', ce: 'Depot Standup Propulsion' } },
      { wbs: 'P6.2.2.1E', pals: 'PALS', slc: 'Depot Activation', appus: 'Procurement', pmo: 'Propulsion', ces: DS.concat(['ECU Propulsion', 'Engine shop ECU']), d: { 2027: 450011 },
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
      const put = (t, v) => { const j = hdr.indexOf(t); if (j >= 0) r[j] = v; };
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
    chk(name, 'header', 'every column is found by its title wherever it sits: the WBS in Z, Level AA, CES1 AB, PMO X, Support Line Category T',
      J(['wbs', 'lv', 'ces1', 'pmo', 'slc', 'roll', 'dtype'].map(f => [(rep.map || {})[f] && rep.map[f].c, (rep.map || {})[f] && rep.map[f].how])),
      J([['Z', 'title'], ['AA', 'title'], ['AB', 'title'], ['X', 'title'], ['T', 'title'], ['H', 'title'], ['D', 'title']]));
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
    chk(name, 'reasons', 'the dollar types left out are named in the record', J(rep.types), J({ 'CY$': 1, 'BY$': 1 }));
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

    // ---- 2. a title that has changed: asked once, in the mapping box; Cancel and an unanswered field import nothing
    const HDR2 = HDR.map(t => t === 'Rollup Value?' ? 'Roll-up Flag' : (t === 'PALS/O&S' ? 'Account Family' : t));
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
    [B, B2, B3, B4, B5].forEach(x => { try { x.w.close(); } catch {} });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ==== end v2.12 W1 ====

// ==== v2.12 W2 (item 132): a WBS paragraph on every requirement, picked; the Spend Plan Source carries it; the FYDP plan joins STOVL ====
// ==== end v2.12 W2 ====

// ==== v2.12 W3 (item 134): every year's budget is the PPBE position; over and under flagged; unallocated added funds as UPL ====
// ==== end v2.12 W3 ====

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
