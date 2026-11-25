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
        title:sel.getAttribute('title')||'', first:sel.options[0].textContent, name:(tr.querySelector('.budname')||{}).textContent||'',
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
  // v2.22 W3 (149.34): the line prints the rule's budget once, whole (budname), and its picker no longer repeats it
  chk(name, 'rule', 'a line the rule settles says so, naming the budget the file prints', ud.how + ' · ' + ud.first + ' · ' + ud.name,
    'rule · — keep the rule — · ' + DISC_AV);
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
    said(f) + ' · ' + (f.rows[0] || {}).title, 'not funded yet:rule: · No money yet · unfunded dollars go under: ' + DISC_AV);
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

// v2.19 (item 150): removed with its feature -- v1.92 — the IDS export: consolidated, reconciled, nothing recorded

// v2.19 (item 150): removed with its feature -- v1.92 — the IDS export: one budget and control across two services

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

// v2.19 (item 150): removed with its feature -- v2.04 (item 109) — the AI review: a request out, an answer in, nothing applied

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
  const CALLS = ['exportExcel()', 'exportCSV()', 'exportPlans()', 'exportFcView()', 'exportCycCompare()', 'exportFydpPlan()'];
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
    // v2.15 W4: the second series and its column are named Funded since v2.15 (the handoff's decision 18 a); the column it reads is the same
    chk(name, 'FYDP chart', 'two series, Requirement then Funded, each reading the column its name heads on the Summary, over the five fiscal years',
      J(refs.map(([n, c, v]) => { const C = cell(c), V = cell(v); if (!C || !V) return 'unreadable'; const hdr = sm[V.r0 - 1] || [];
        return [n, V.sheet, String(hdr[V.col] ?? ''), V.r1 - V.r0 + 1, (sm.slice(C.r0, C.r1 + 1).map(r => String((r || [])[C.col] ?? '')).join(',')), sm.slice(V.r0, V.r1 + 1).every(r => typeof (r || [])[V.col] === 'number' || (r || [])[V.col] === '—')]; })),
      J(['Requirement', 'Funded'].map(n => { const y = +ev('MS.base||MS.cur'); return [n, 'Summary', n, 5, [0, 1, 2, 3, 4].map(k => 'FY' + ((y + k) % 100)).join(','), true]; })));
    chk(name, 'FYDP print titles', 'the appropriation tab repeats its two heading rows on every page; the Summary, service and PMO tabs, whose tables each have their own, do not',
      J(F.titles.map(t => [F.names[t.sheet], /^'(.+)'!\$(\d+):\$(\d+)$/.test(t.ref) && RegExp.$1 === F.names[t.sheet].replace(/'/g, "''") ? (+RegExp.$3 - +RegExp.$2 + 1) : 'bad ref ' + t.ref])),
      J([[app, 2]]));
  }
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
  // v2.19 (item 150): FYDP Disconnects, the funds flow, the chart of accounts, the ACE tie-out and the IDS file are gone: eleven
  const NOHOUSE = /^(exportSrc|crExport)$/;
  chk(name, 'which reports', 'every report workbook asks for the house style but the Spend Plan Source and the 1A9A, which CCaR and the comptroller read in',
    J(calls.filter(c => c[1] === NOHOUSE.test(c[0])).map(c => c[0])), '[]');
  chk(name, 'which reports', 'and the list is the nine reports that write a workbook and the two that do not',
    calls.length, 11);
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
  // v2.22 W2 (item 149.24 b): PSM has one USAF name, so it is picked for the person, still changeable -- it read "0 of 1 chosen"
  chk(name, 'budgets', 'and the rail asks for one budget, already answered: PSM’s only USAF name is picked', J([rail()[3], val('arB0')]), J(['ok:Budget · 1 of 1 chosen', BAE.psmDisc]));
  ev(`__set('arV1', '350,000'); __set('arV2', '100'); 'ok'`);
  chk(name, 'budgets', 'ANG: PSM’s lane-less ANG name; STOVL: PSM has none, so no picker, and it says so',
    J([JSON.parse(ev(`JSON.stringify(__opts('arB1'))`)), ev(`__g('arB2').hidden`), ev(`__g('arBn2').textContent`)]),
    J([['', BAE.psmAng], true, 'no STOVL budget is listed for PSM']));
  // v2.22 W2 (item 149.24 b): ANG has one PSM name too, picked
  chk(name, 'budgets', 'the rail asks for two -- STOVL is waived -- and the total is the three values', J([rail()[3], ev(`__g('arTot').textContent`)]),
    J(['ok:Budget · 2 of 2 chosen', '$1,550,100']));
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
  // v2.22 W2 (item 149.24 b): every field empty but the two budget pickers, each holding PSM's only name for its service (hidden
  // until a value is typed); nothing was typed
  chk(name, 'Cancel', 'reopened: every field is empty but the pickers of PSM’s only budgets, and the rail starts again',
    J([ev(`[].slice.call(document.querySelectorAll('#arNew input, #arNew select, #arNew textarea')).filter(function(e){ return e.value!==''; }).map(function(e){ return e.id+'='+e.value; }).join(',')`), btn()]),
    J(['arB0=' + BAE.psmDisc + ',arB1=' + BAE.psmAng, 'Add requirement — 8 still needed']));
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
    // v2.22 W2 (items 149.29, 149.30): a board with nothing in any year is the program with no board in it, which has its Start here
    // block; so FY26 holds a requirement here, and the empty FY27 leads with From another year beside its way to add a new one
    E.ev(`(function(){ var T=freshYearState(); T.order=['P26']; T.custom=[{id:'P26', grp:'PSM', team:'PSM', sect:'new', custom:true, title:'P26 title', event:'last year', ccar:'', fy26:[0], ask:[5], alloc:null}];
      MS.years['2026']=T; render(); return 'ok'; })()`);
    chk(name, 'empty year', 'a year with no requirements says so, and its button to add a new one opens the box',
      E.ev(`(function(){ var l=document.getElementById('list'), b=[].slice.call(l.querySelectorAll('button')).filter(function(x){ return /Add a new requirement/.test(x.textContent); })[0];
        var t=l.querySelector('b')? l.querySelector('b').textContent : l.textContent;
        if(!b) return t+' · no button'; b.click(); return t+' · '+b.textContent+' · '+arOpen+' · '+/\\bopen\\b/.test(document.getElementById('addPanel').className); })()`),
      'FY27 holds no requirements yet. · ＋ Add a new requirement · true · true');
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
  // v2.22 W2 (item 149.24 b): (AV)'s one name is picked for the person -- it read "0 of 1 chosen"; never waived either way
  chk(name, '(AV)', 'and the rail asks for that one budget -- answered by (AV)’s only name, picked; never waived', J(rail()[3]), J('ok:Budget · 1 of 1 chosen'));
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
  // v2.22 W2 (item 149.24 b): PSM's only USAF name is picked for the person; set back to none, as a person may, to leave it unchosen
  ev(`__pick('arB0', ''); __click('#arAddBtn'); 'ok'`);
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
    chk(name, 'Goes to', 'nor through setDest (Classify, a bulk set)', J([ev(`JSON.stringify(S.dest.C)`), ev(`(S.mipr||{}).C||null`), ev(`JSON.stringify(destOf(itemById('C')))`)]), J(['{"to":"chlk"}', null, '{"to":"chlk","end":""}']));   // v2.19: the funds flow's resolver is gone; destOf reads no hop
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
    // v2.22 W3 (149.40): said in plain words
    chk(name, 'SI code', 'with no code stored, the picker says it follows the PMO and prime rules', ev(`(function(){ var s=document.getElementById('erSi'); return s.options[s.selectedIndex].text; })()`), '— the code its office and contract give —');
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
    // v2.22 W3 (149.40): plain words -- "from the file" was said of records somebody typed in
    chk(name, 'words', 'the record name drawn from the file says so', ev(`document.getElementById('erRecTag').textContent`), 'the requirement’s own title');
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
    chk(name, 'record name source', 'one the list does not name shows its file title: from the file', line('D'), 'PACK TITLE | the requirement’s own title');   // v2.22 W3 (149.40)
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
    // v2.15 W3: and Save as a new file… and Choose another file… (item 146)
    chk(name, 'board', 'its ▾ offers the board’s Save a copy (a CONTROL)', ddSave(B.ev), J(['mRun(publishState)', 'mRun(fhSaveNew)', 'mRun(fhRepick)']));
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

// v2.19 (item 150): removed with its feature -- v2.10 A — FYDP Disconnects: the figures, read never recomputed, and the box (item 130)
// v2.19 (item 150): removed with its feature -- v2.10 review — FYDP Disconnects: Full Fund’s USMC-B is the STOVL sheet’s, and the service sheets add up to the Summary (A-1)
// v2.19 (item 150): removed with its feature -- v2.10 review — FYDP Disconnects: an International figure left by a click keeps the click’s keyboard (A-2)
// v2.19 (item 150): removed with its feature -- v2.10 review — FYDP Disconnects: in the shared folder, another appropriation is read as its own board opens it (A-3)
// ==== end v2.10 A ====

// v2.19 (item 150): removed with its feature -- v2.10 B (item 130) — the FYDP Disconnects workbook: the slides’ look, read back from the bytes
// v2.19 (item 150): removed with its feature -- v2.10 review — the FYDP Disconnects workbook draws its indented lines indented: left alignment beside the indent (WB-1)
// ==== end v2.10 B ====

// v2.19 (item 150): removed with its feature -- v2.11 — the FYDP Disconnects workbook says, under every sheet’s table, which services are counted on the Summary only
// ==== end v2.11 ====

// v2.19 (item 150): removed with its feature -- v2.12 W1 — the cost estimate is read by its header titles on any sheet: every row kept or left out with its reason and dollars, the WBS tree, the mapping box, the report
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

// v2.19 (item 150): removed with its feature -- v2.12 RV1 — a stored import report is read, never trusted: counts that are text, years that are text and a report missing its totals are said to be unreadable, drawn as nothing, and never stop the board drawing

// v2.19 (item 150): removed with its feature -- v2.12 RV1 — the header: a title or a year that heads two columns, a remembered answer resolved by its title, and an optional column renamed, are asked about or refused, never read by position

// v2.19 (item 150): removed with its feature -- v2.12 RV1 — the file key keeps the year right before ACE, so a re-import meets the locked-replace question; and a year cell is a figure only when the whole of it is one

// v2.19 (item 150): removed with its feature -- v2.12 RV1 — an E breakout is a whole branch: every heading below the first one that takes the suffix carries it, and the AV + PSM split follows the tree

// v2.19 (item 150): removed with its feature -- v2.12 RV1 — every Support Line Category the map holds lands on its appropriation and cost element; a header tie goes to the first sheet; a blank US/PTN/FMS cell is US
// ---- v2.12 RV4 (the second review of the cost estimate import, S00-S03 and S21; recovery/v212/notes-RV4.md) ------------------
// Each block below uses RV1's fixture (above) and FAILS ON c81e995 unless a part is labelled CONTROL.

// v2.19 (item 150): removed with its feature -- v2.12 RV4 — the file key takes the year nearest ACE, not the first year the name carries (S00)

// v2.19 (item 150): removed with its feature -- v2.12 RV4 — a row with no WBS whose year cells are figures written as text is counted, kept and named, never filed as formatting (S01)

// v2.19 (item 150): removed with its feature -- v2.12 RV4 — a heading two rows place under different parents is named and settled by one rule, whatever the order of the rows (S02)

// v2.19 (item 150): removed with its feature -- v2.12 RV4 — a title the file carries twice, answered with another title’s column or “no such column”, is remembered and not asked again (S03)

// v2.19 (item 150): removed with its feature -- v2.12 RV4 — the guide’s cost estimate section says what the import asks, shows and settles (S21)
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

// v2.19 (item 150): removed with its feature -- v2.12 W2 — a WBS paragraph is picked from the estimate: the Add box, the edit box, the WBS lines and the quick box (item 132)

// ---- v2.12 W2 (item 132): Needs attention ------------------------------------------------------------------------------------
// Seven requirements, each case stated: A (OGC) has no WBS; B's 9.9.9 and S's second line 8.8 are not in the estimate; C is on
// 1.3; P is a prime whose CLIN 0002 carries $100 and no WBS; Q is a prime whose CLIN 0002 carries nothing (its 0001 is on 4.4,
// not in the estimate); R is a prime with no CLIN at all. The lanes pay everyone but R in full, R $200 of $500. So Without a WBS
// is A, P and R ($150, $300, $200), the heading 4 of 7 requirements and $690 of $1,340 funded; WBS not in the estimate is B, S
// and Q. Each opens the edit box at the WBS (a split at its split, a prime its CLIN drill). On d732259 every check fails.
{
  // v2.19 (item 150): the estimate is gone, and with it WBS not in the estimate; the list of requirements without a WBS stays
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
    const entries = JSON.parse(ev(`JSON.stringify([].map.call(document.querySelectorAll('#posture .ppatt .e'), function(e){ return [e.getAttribute('onclick'), e.textContent.replace(/\\s+/g,' ').trim()]; }).slice(-2))`));
    chk(name, 'the posture', 'its entry comes last, saying what it counts', J(entries.slice(-1)),
      J([['attShow("wbs")', '▦ 3 without a WBS']]));
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
    // Go to it
    const go = (k, id) => JSON.parse(ev(`(function(){ attClose(); attShow(${J(k)});
      var b=[].filter.call(document.querySelectorAll('#attBody .attgo'), function(x){ return (x.getAttribute('onclick')||'').indexOf(${J(J(id))})>=0; })[0];
      if(!b) return JSON.stringify({none:true}); b.click();
      var r={open:attOpen, edit:erOn()? erOpen : '', at:document.activeElement? document.activeElement.id : '', clin:!!clinOpen[${J(id)}], cur:curRow};
      if(erOn()) erClose(); clinOpen={}; render(); return JSON.stringify(r); })()`));
    chk(name, 'Go to it', 'A: the edit box opens on A at its WBS', J(go('wbs', 'A')), J({ open: null, edit: 'A', at: 'erWbs', clin: false, cur: 'A' }));
    chk(name, 'Go to it', 'P (a prime): its CLIN drill opens, never the edit box', J(go('wbs', 'P')), J({ open: null, edit: '', at: '', clin: true, cur: 'P' }));
    // fixed, it leaves the list at once
    ev(`S.wbs.A=[{w:'1.3', v:[]}]; S.clinWbs.P.b1=[{w:'1.2.2', v:[]}]; save(); render(); 'ok'`);
    chk(name, 'fixed', 'a paragraph given leaves the list and the coverage counts it',
      ev(`(function(){ var A=attLists(); return JSON.stringify([A.wbs.map(function(r){ return r.id; }), A.wbs.cov.n, A.wbs.cov.f]); })()`), J([['R'], 6, 1140]));
    // with no estimate naming this appropriation nothing is "not in it": that list is empty and its entry is not drawn
    const N = w2Board(Object.assign({}, W2_SET, { wbs: { ff: W2_SET.wbs.ff } }));
    chk(name, 'no estimate', 'there is no WBS-not-in-the-estimate list or entry; Without a WBS still counts A, P and R',
      N.ev(`JSON.stringify(['wbsx' in attLists(), [].some.call(document.querySelectorAll('#posture .ppatt button'), function(b){ return b.getAttribute('onclick')==='attShow("wbsx")'; }), attLists().wbs.map(function(r){ return r.id; })])`),
      J([false, false, ['A', 'P', 'R']]));
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

// v2.19 (item 150): removed with its feature -- v2.12 W2 — Classify sets one WBS paragraph on many requirements, from the estimate (item 132)

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
    // v2.19 (item 150): the column carries the code only -- there is no estimate to name it
    const cell = c => c || '';
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
      // v2.18 (item 149.17): the message says where Needs attention is
      '⚠ 4 lines go out with no WBS paragraph, on 2 requirements: B event (3 lines), C event — Needs attention, on the Funding page › ▦ without a WBS lists each, with what to fix.');
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
  // v2.19 (item 150): with the estimate gone there is nothing to name or flag it against; what stays is that it is read as its
  // code (the Spend Plan Source's one reader, wbsCodeIn) and that nothing rewrites it unasked
  try {
    const J = JSON.stringify;
    const B = w2Board(W2_SET), ev = B.ev;
    ev(`S.wbs.B=[{w:'1.2.1 - Organizational', v:[]}]; save(); render();
      window.__rvAsk=[]; window.confirm=function(m){ window.__rvAsk.push(String(m)); return false; }; 'ok'`);
    chk(name, 'its code', 'B’s stored paragraph is read as 1.2.1', ev(`wbsCodeIn(S.wbs.B[0].w)`), '1.2.1');
    // the edit box: opened with nothing typed, it holds the text as stored, has nothing to save and asks nothing
    ev(`openEdit('B', 'wbs'); dlgSync(); 'ok'`);
    chk(name, 'the edit box', 'it opens holding the paragraph as stored, with nothing to save',
      ev(`JSON.stringify([document.getElementById('erWbs').value, erDirty(), JSON.stringify(erChanges(erRead()))])`),
      J(['1.2.1 - Organizational', false, '{}']));
    ev(`erStep(1); 'ok'`);
    chk(name, 'the edit box', '↓ next steps on to C without asking to discard typing nobody did',
      ev(`JSON.stringify([window.__rvAsk.length, erOpen])`), J([0, 'C']));
    ev(`erClose(); openEdit('B', 'desc'); __w2put('erDesc', 'Only the description'); document.getElementById('erSaveBtn').click(); 'ok'`);
    chk(name, 'the edit box', 'a Save of another field keeps the paragraph exactly as stored, and says it saved only that field',
      ev(`JSON.stringify([erOn(), S.wbs.B, /\\bWBS\\b/.test(document.getElementById('shareStat').textContent), S.desc.B])`),
      J([false, [{ w: '1.2.1 - Organizational', v: [] }], false, 'Only the description']));
    // the quick box: OK with nothing typed keeps it as stored
    ev(`window.__qp=[]; window.prompt=function(m, d){ if(/^WBS/.test(m)) window.__qp.push(d); return d; }; wbsQuick('B'); 'ok'`);
    chk(name, 'the quick box', 'it opens holding the paragraph as stored, and OK keeps it exactly as stored',
      ev(`JSON.stringify([window.__qp, S.wbs.B])`), J([['1.2.1 - Organizational'], [{ w: '1.2.1 - Organizational', v: [] }]]));
    chk(name, 'CONTROL', 'C, stored as 1.3, opens in the edit box clean too',
      ev(`(function(){ openEdit('C', 'wbs'); var r=[document.getElementById('erWbs').value, erDirty()]; erClose(); return JSON.stringify(r); })()`), J(['1.3', false]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}

// v2.19 (item 150): removed with its feature -- v2.12 RV2 — the WBS quick box asks before Esc throws away what was typed (K02)

// v2.19 (item 150): removed with its feature -- v2.12 RV2 — the CLIN drill and the PMO review name a paragraph, and flag one the estimate does not hold (K03)

// v2.19 (item 150): removed with its feature -- v2.12 RV2 — Classify says why a bulk WBS leaves a requirement alone (K04)

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
      // v2.18 (item 149.17): the message says where Needs attention is
      '⚠ 5 lines go out with no WBS paragraph, on 4 requirements: A event (2 lines), C event, P event, Q event — Needs attention, on the Funding page › ▦ without a WBS lists each, with what to fix.');
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

// v2.19 (item 150): removed with its feature -- v2.12 RV2 — a paragraph carried from another year is kept as stored, even one the estimate does not hold (K17)

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
      // v2.22 W1 (item 155): Review reads Funded and the status now, and the running total is Rank's -- so the figures v2.11's rows
      // show (the requirement and the cumulative) are compared in Rank, where both boards print them, less the "unfunded $X" v2.22
      // adds under the status (149.45; its dollars are the line below's, moneyOf, per requirement)
      const rankRows = B => { try { return B.ev(`(function(){ uiMode='rank'; render(); var out=JSON.stringify([].map.call(document.querySelectorAll('[id^="row-"]'), function(r){
        var c=r.cloneNode(true); [].forEach.call(c.querySelectorAll('.unfx'), function(x){ x.remove(); }); return [r.id, c.textContent.match(/\\$[\\d,.]+[MK]?/g)||[]]; }));
        uiMode='review'; render(); return out; })()`); } catch (e) { return '[]'; } };
      chk(name, 'as v2.11', 'file one: every row shows the figures v2.11 shows', rankRows(R1), rankRows(O1));
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
// v2.19 (item 150): removed with its feature -- v2.12 RV5 — the tie-out’s AV + PSM split claims only the paragraphs the one rule reads: a removed CLIN, a prime switched to an OGC and back (S11)
// v2.19 (item 150): removed with its feature -- v2.12 RV5 — the PMO review and its change report show a proposed new requirement’s WBS, named, or flagged where the estimate does not hold it (S12, S15)
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
// v2.19 (item 150): removed with its feature -- v2.12 RV5 — WBS from execution data reads the Spend Plan Source’s own WBS back as already set, and picks a paragraph from the estimate (S16)
// ==== end v2.12 W2 ====

// v2.19 (item 150): removed with its feature -- v2.12 RV6 — FYDP Disconnects reads a split position exactly as before: the model, the sheets and the box, against the board before the one rule (S05, S14)
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
// v2.15 W1 (item 139): LOCK AS A BUILD BEFORE v2.15 LOCKED. Lock now refuses a plan tagged with another cycle (it would keep that cycle's
// controls under the lock's name). Older fixtures here lock a cycle on a plan tagged with another -- a lock a file still carries -- so this
// takes it the way v2.14 did: under the lock's key for the moment, with the position of the cycle the plan is on, then the tag put back
// and the lock's record set as v2.14 wrote it (pos: the plan's tag and its position; from: the plan's tag). Where the plan is untagged or
// on the lock's own cycle it is cycLock() itself. A function declaration, so every block above the slot can call it (it is hoisted).
function w1LockAsBefore() {
  return `(function(){ var K=blKey(blCyc, blYr||MS.cur), t0=(typeof MS.cycle==='string')? MS.cycle : '';
    if(!t0 || t0===K){ cycLock(); return; }
    MS.ppbe=MS.ppbe||{}; var P0=MS.ppbe[t0], had=Object.prototype.hasOwnProperty.call(MS.ppbe, K)? MS.ppbe[K] : undefined, c0=blGet(K);
    if(P0!==undefined) MS.ppbe[K]=P0; else delete MS.ppbe[K];
    MS.cycle=K; cycLock(); MS.cycle=t0;
    if(had===undefined) delete MS.ppbe[K]; else MS.ppbe[K]=had;
    var c=blGet(K); baLiveAll(); if(c && c!==c0){ c.pos={key:t0, P:P0? JSON.parse(JSON.stringify(ppNorm(P0))) : null}; c.from=t0; persistCyc(); save(); } })();`;
}
// v2.19 (item 150): removed with its feature -- v2.15 W2 — FYDP Disconnects follows another tab’s save, never under a figure being typed, and Export refuses figures that moved (item 131)
// ==== end v2.15 W2 ====
// ==== v2.15 W3 (items 144, 146 (storage writes, Save and import wording, test gaps)) ====
// ==== end v2.15 W3 ====
// ==== v2.15 W4 (items 131, 135 and the handoff small fixes: folder reads, house indents, CLIN request, guide, drill, Funded) ====
// v2.15 W4 (item 131): THE SPRUILLS, THE CHART OF ACCOUNTS, LOCKS BY APPROPRIATION AND THE FIVE-YEAR PLAN READ ANOTHER APPROPRIATION
// AS ITS OWN BOARD OPENS IT, STRICTLY. The A-3 fixture's shape: Full Fund's own board writes the shared folder's copy (newer: tagged
// BES28, with a BES28 position and its requirement A asked at $70M) and this browser's (older: untagged, $30M); O&M is on screen in
// folder mode with a stand-in folder. Every figure is the fixture's. FAILS ON THE SLOT COMMIT (8c24ea2): the Spruills draws at once
// and prints this browser's $30M, says nothing of the position its Available Funding came from, and with Full Fund's copy unreadable
// still prints the older copy; the chart of accounts lists the older copy's $30M, and lists it with the copy unreadable; Locks by
// appropriation shows Full Fund untagged and never says it could not be read; the five-year plan opens this browser's older copy
// where the folder's could not be read. The CONTROLs (the fixture, Initial Spares with no copy anywhere) pass there.
{
  const name = 'v2.15 W4 — the Spruills, the chart of accounts, Locks by appropriation and the five-year plan read the shared folder strictly (item 131, item 135)';
  try {
    const J = JSON.stringify;
    const E = (ev, code) => { try { return ev(code); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 160); } };
    const parse = s => { try { return JSON.parse(s); } catch { return null; } };
    const SV = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'], YRS = [2027, 2028, 2029, 2030, 2031, 2032];
    const seedIt = ev => { seed(ev, { services: SV, items: [{ id: 'A', grp: 'PSM', team: 'PSM', sect: '', custom: false, title: 'Rec A', event: 'EV-A', ccar: 'JSF7', fy26: SV.map(() => 0), ask: [10e6, 0, 0, 0, 0, 20e6], alloc: null }],
      disc: [1e9, 0, 0, 0, 0, 1e9], mand: SV.map(() => 0), order: ['A'] });
      E(ev, `BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); }); 'ok'`); };
    const posOf = f => { const v = {}; YRS.forEach(y => { v[y] = f(y); }); return { v: 2, split: true, lines: { USN: [{ k: '_all', all: true }] }, val: { USN: { _all: v } } }; };
    const F = boot({ appn: 'FULL FUND' });
    seedIt(F.ev);
    const CUR = +E(F.ev, 'MS.cur');
    const mk = (ts, extra) => E(F.ev, `(function(){ ${extra || ''} MS.ts=${ts}; MS.dataPack=dataPackOf(); var p=livePayload(); p.ts=${ts}; return JSON.stringify(p); })()`);
    const oldStore = J((parse(mk(10, `S.asks={A:[10e6,0,0,0,0,20e6]}; MS.cycle=''; MS.ppbe={};`)) || {}).store);
    const folderTxt = mk(20000, `S.asks={A:[30e6,0,0,0,0,40e6]}; MS.ppbe=${J({ 'BES|2028': posOf(y => ({ d: 50e6 + y, m: 2e6 })) })}; MS.cycle='BES|2028';`);
    const newerTxt = mk(30000, `S.asks={A:[50e6,0,0,0,0,40e6]};`);
    const newestTxt = mk(40000, `S.asks={A:[60e6,0,0,0,0,50e6]};`);
    const FILE = E(F.ev, `driveName(MS.cur, 'ff')`);
    const folder = () => `(function(){ var files=window.__fold={}; files[${J(FILE)}]=${J(folderTxt)}; return {
      name:'team', kind:'directory',
      queryPermission: async function(){ return 'granted'; }, requestPermission: async function(){ return 'granted'; },
      getFileHandle: async function(n){ if(Object.prototype.hasOwnProperty.call(files, n)) return {name:n, getFile: async function(){
          if(window.__foldErr){ var x=new Error('the file could not be read'); x.name=window.__foldErr; throw x; }
          return {text: async function(){ return files[n]; }, lastModified:1}; }};
        var e=new Error('not found: '+n); e.name='NotFoundError'; throw e; },
      getDirectoryHandle: async function(){ var e=new Error('nf'); e.name='NotFoundError'; throw e; },
      values: async function*(){ for(var k of Object.keys(files)) yield {kind:'file', name:k}; } }; })()`;
    const board = (err) => {
      const O = boot({ ls: { spmtLive: J({ store: true, mode: 'drive', on: false, folder: 'team' }), prio27ff: oldStore } });
      seedIt(O.ev);
      // with Full Fund's copy unreadable, the file also carries Full Fund as a consolidated payload: the shape where an unread
      // appropriation would otherwise be listed on the chart of accounts as delivered
      E(O.ev, `_driveDir=${folder()}; ${err ? `window.__foldErr=${J(err)}; APPNS['FULL FUND']={services:${J(SV)}, items:[{id:'A', grp:'PSM', team:'PSM', sect:'', custom:false, title:'Rec A', event:'EV-A', ccar:'JSF7', fy26:[0,0,0,0,0,0], ask:[10e6,0,0,0,0,20e6], alloc:null}], budget:[]};` : ''} window.alert=function(){}; render(); 'ok'`);
      return O;
    };
    const settle = async O => { for (let i = 0; i < 100; i++) { await new Promise(r => setTimeout(r, 10));
        if (E(O.ev, `typeof _apFold!=='undefined' && !!(_apFold && _apFold.done)`) === true) break; }
      await new Promise(r => setTimeout(r, 20)); };
    chk(name, 'the fixture', 'CONTROL: folder mode is on; this browser’s Full Fund copy is the older one ($30M asked, untagged); the folder’s asks $70M and is tagged BES28',
      J([E(board('').ev, `driveStoreOn()`), (parse(oldStore) || {}).ts, (parse(folderTxt) || {}).store.cycle]), J([true, 10, 'BES|2028']));
    // v2.19 (item 150): the Spruills and the chart of accounts are gone; Locks by appropriation and the five-year plan stay
    // ---- 3. Locks by appropriation ---------------------------------------------------------------------------------------------
    const O = board('');
    E(O.ev, `toggleBl(); 'ok'`);
    chk(name, '3 · Locks by appropriation, reading', 'until the folder has answered, Full Fund’s working plan reads “reading the shared folder…”',
      E(O.ev, `(document.querySelector('#blBody tr[data-ap="ff"] .cyc-ov-tag')||{}).textContent||''`), 'reading the shared folder…');
    await settle(O); E(O.ev, `render(); 'ok'`);
    chk(name, '3 · Locks by appropriation, answered', 'then Full Fund’s working plan is the folder’s tag, BES28, never this browser’s untagged copy',
      E(O.ev, `JSON.stringify(cycOverview().rows.filter(function(r){ return r.k==='ff'; }).map(function(r){ return [r.tag, r.held, r.foldWhy||'']; }))`), J([['BES|2028', true, '']]));
    E(O.ev, `toggleBl(); window.__fold[${J(FILE)}]=${J(newestTxt)}; 'ok'`);
    // ---- 4. Full Fund's copy in the folder cannot be read at that moment (mid-sync) ---------------------------------------------
    const D = board('NotReadableError');
    E(D.ev, `toggleBl(); 'ok'`); await settle(D);
    chk(name, '4 · copy unreadable, Locks by appropriation', 'Full Fund’s working plan names the copy that could not be read, and is neither behind nor counted',
      E(D.ev, `JSON.stringify(cycOverview().rows.filter(function(r){ return r.k==='ff'; }).map(function(r){ return [/could not be opened \\(it may be syncing\\)/.test(r.foldWhy||''), r.held, !!r.behind]; }))`), J([[true, false, false]]));
    chk(name, '4 · copy unreadable, Locks by appropriation', 'and its cell says so on screen',
      /^⚠ the shared folder’s copy could not be opened \(it may be syncing\)$/.test(E(D.ev, `(document.querySelector('#blBody tr[data-ap="ff"] .cyc-ov-tag')||{}).textContent||''`)), true);
    E(D.ev, `toggleBl(); 'ok'`);
    // ---- 5. the five-year plan: Full Fund's copy unreadable -- its block is refused, never this browser's older copy --------------
    const g5 = parse(await D.w.eval(`(async function(){ var A=null; fydpGather(fydpData('working'), function(x){ A=x; });
      for(var i=0;i<100 && !A;i++) await new Promise(function(r){ setTimeout(r, 10); });
      var a=(A||[]).filter(function(x){ return x.k==='ff'; })[0]||{}; return JSON.stringify({why:a.why||'', D:!!a.D}); })()`)) || {};
    chk(name, '5 · the five-year plan', 'Full Fund’s block is refused, naming the copy that could not be read; the older copy here is not opened in its place',
      J([/the shared folder’s copy could not be opened \(it may be syncing\)/.test(g5.why), g5.D]), J([true, false]));
    const g5b = parse(await O.w.eval(`(async function(){ var A=null; fydpGather(fydpData('working'), function(x){ A=x; });
      for(var i=0;i<100 && !A;i++) await new Promise(function(r){ setTimeout(r, 10); });
      var a=(A||[]).filter(function(x){ return x.k==='ff'; })[0]||{}; return JSON.stringify({why:a.why||'', ts:a.ts||0}); })()`)) || {};
    chk(name, '5 · the five-year plan', 'CONTROL: with the copy readable, the folder’s newest copy is the one its frame opens', J([g5b.why, g5b.ts]), J(['', 40000]));
    for (const [w, B] of [['readable', O], ['unreadable', D]]) if (B.errors.length) chk(name, 'jsdom', 'no script errors (' + w + ')', B.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// v2.15 W4 (item 131): EVERY DRESSED WORKBOOK DRAWS ITS INDENTS. The house style wrote the title band, the subtitle and column B's text
// with indent="1" and no horizontal alignment, which Excel and LibreOffice do not draw (v2.10's WB-1 found it in FYDP Disconnects; the
// house style had it in every dressed workbook). Read out of the bytes four real exports write -- the board workbook, the Priority
// Drill, the five-year spend plan and the chart of accounts -- every cell style that carries an indent must name left, right or
// distributed beside it. FAILS ON THE SLOT COMMIT: each of the four carries indented styles with no horizontal. CONTROL: each has
// indented styles to judge, and what each workbook says is what it said written plain (v2.04 (item 113) holds the values).
{
  const name = 'v2.15 W4 — every dressed workbook draws its indents: an indent always has its horizontal alignment beside it (item 131)';
  try {
    const J = JSON.stringify;
    const B = boot();
    const mkI = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Rec ' + id, event: 'EV-' + id, ccar: 'JSF' + id, fy26: ask.map(() => 0), ask, alloc: null });
    seed(B.ev, { services: ['USAF', 'ANG'], items: [mkI('A', 'AV', [900e6, 5e6]), mkI('B', 'PSM', [800e6, 1e6])], disc: [2e9, 1e9], mand: [1e8, 0], order: ['A', 'B'] });
    B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); }); save(); render(); 'ok'`);
    const styles = fn => JSON.parse(B.ev(`(function(){ var ob=buildXlsx, got=null; buildXlsx=function(){ var u=ob.apply(this, arguments); if(u && u.length) got=u; return u; };
      try{ ${fn}(); } finally { buildXlsx=ob; }
      if(!got) return 'null';
      var u=got, dv=new DataView(u.buffer, u.byteOffset, u.byteLength), at=0, td=new TextDecoder(), o={};
      while(at+30<=u.length && dv.getUint32(at,true)===0x04034b50){ var sz=dv.getUint32(at+18,true), nl=dv.getUint16(at+26,true), xl=dv.getUint16(at+28,true);
        o[td.decode(u.subarray(at+30,at+30+nl))]=td.decode(u.subarray(at+30+nl+xl,at+30+nl+xl+sz)); at+=30+nl+xl+sz; }
      var x=o['xl/styles.xml']||'', xf=(x.split('<cellXfs')[1]||'').split('</cellXfs>')[0];
      return JSON.stringify((xf.match(/<alignment[^>]*\\/>/g)||[]).filter(function(a){ return /indent="[1-9]/.test(a); })); })()`));
    for (const fn of ['exportExcel', 'exportCSV', 'exportFydpPlan']) {   // v2.19: the chart of accounts is gone
      const al = styles(fn) || [];
      chk(name, fn, 'CONTROL: the workbook is dressed and carries indented styles to judge', al.length > 0, true);
      chk(name, fn, 'every indented style names left, right or distributed beside its indent, so Excel draws it',
        J(al.filter(a => !/horizontal="(left|right|distributed)"/.test(a))), J([]));
    }
    if (B.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// v2.15 W4 (the handoff's decision 20): THE PRIORITY DRILL GIVES EVERY DOLLAR FIGURE A COLUMN WIDE ENOUGH TO PRINT IT. The Summary's
// FUNDED BY PMO AND BAND table runs a column per band, then unbanded and TOTAL, past the ten columns the BY BAND table sized: with the
// eight standard bands its unbanded and TOTAL figures sat in the narrow % Fund column (8) and one with no width at all, and a
// funded figure in millions printed ### in a narrow viewer. Every money cell of every tab is held to its column: a width of at least
// the figure as printed ($ and thousands separators) plus one. FAILS ON THE SLOT COMMIT: the Summary's unbanded and TOTAL figures.
// CONTROL: the fixture really does put a funded figure of over a billion dollars in the unbanded column.
{
  const name = 'v2.15 W4 — the Priority Drill gives every dollar figure a column wide enough to print it (the handoff’s decision 20)';
  try {
    const J = JSON.stringify;
    const B = boot();
    const mkI = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Rec ' + id, event: 'EV-' + id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
    seed(B.ev, { services: ['USAF', 'ANG'], items: [mkI('A', 'AV', [900e6, 5e6]), mkI('B', 'PSM', [800e6, 1e6])], disc: [2e9, 1e9], mand: [1e8, 0], order: ['A', 'B'] });
    const sh = captureDrill(B.ev);
    const MONEY = new Set([12, 13, 14, 15]);
    const shown = v => (v < 0 ? '-' : '') + '$' + Math.round(Math.abs(v)).toLocaleString('en-US');
    const S0 = sh[0], hdr = S0.rows.findIndex(r => r && r[0] && r[0].v === 'PMO'), ub = hdr < 0 ? -1 : S0.rows[hdr].findIndex(c => c && c.v === 'unbanded');
    chk(name, 'the fixture', 'CONTROL: the Summary’s PMO × band table carries a funded figure over $1B in its unbanded column, the tenth or later (the BY BAND table sized the tenth for % Fund)',
      J([ub >= 9, S0.rows.slice(hdr + 1).some(r => r && r[ub] && typeof r[ub].v === 'number' && r[ub].v > 1e9)]), J([true, true]));
    const short = [];
    sh.forEach(s => (s.rows || []).forEach((r, ri) => (r || []).forEach((c, ci) => {
      if (!c || typeof c !== 'object' || typeof c.v !== 'number' || !MONEY.has(c.s)) return;
      const w = (s.cols || [])[ci], need = shown(c.v).length + 1;
      if (!(w >= need)) short.push(s.name + ' r' + ri + ' c' + ci + ': ' + shown(c.v) + ' in ' + (w === undefined ? 'no width' : w));
    })));
    chk(name, 'every tab', 'every money cell sits in a column at least as wide as its figure as printed, plus one', J(short.slice(0, 6)), J([]));
    if (B.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// v2.15 W4 (the handoff's decision 18 a): THE FIVE-YEAR WORKBOOK AND ITS PANEL CALL THE LANE DRAW FUNDED. Its second figure has been
// discretionary + mandatory drawn since v2.04 -- what a lock stores and every other surface calls Funded -- under the heading
// Allocated, which everywhere else is the allocation the lanes work from. A heading only: every figure is as it was (the recon suite's
// five-year blocks hold them to the engine). FAILS ON THE SLOT COMMIT: every heading, the chart and the panel say Allocated.
{
  const name = 'v2.15 W4 — the five-year spend plan calls the lane draw Funded, in the workbook and on its panel (the handoff’s decision 18 a)';
  try {
    const J = JSON.stringify;
    const B = boot();
    const mkI = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Rec ' + id, event: 'EV-' + id, ccar: 'JSF' + id, fy26: ask.map(() => 0), ask, alloc: null });
    seed(B.ev, { services: ['USAF', 'ANG'], items: [mkI('A', 'AV', [900, 50]), mkI('B', 'PSM', [800, 10])], disc: [1000, 30], mand: [100, 0], order: ['A', 'B'] });
    B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); }); save(); render(); 'ok'`);
    const sh = JSON.parse(B.ev(`(function(){ var ob=buildXlsx, got=null; buildXlsx=function(s){ got=s; return new Uint8Array([1]); }; try{ fydpSrc='working'; exportFydpPlan(); } finally { buildXlsx=ob; } return JSON.stringify(got); })()`)) || [];
    const heads = [];
    sh.forEach(s => (s.rows || []).forEach(r => (r || []).forEach(c => { if (c && typeof c === 'object' && c.s === 2 && (c.v === 'Funded' || c.v === 'Allocated')) heads.push(c.v); })));
    chk(name, 'workbook', 'every tab’s second figure is headed Funded, and none Allocated',
      J([heads.filter(v => v === 'Funded').length > 4, heads.filter(v => v === 'Allocated').length]), J([true, 0]));
    const ch = (sh[0] && sh[0].chart) || {};
    chk(name, 'workbook', 'the Summary’s chart is Requirement vs Funded, its second series named Funded',
      J([ch.title && ch.title.replace(/, .*$/, ''), (ch.series || []).map(x => x.name)]), J(['Requirement vs Funded', ['Requirement', 'Funded']]));
    B.ev(`fydpSrc='working'; fydpOpen=true; render(); 'ok'`);
    const ph = JSON.parse(B.ev(`JSON.stringify([].map.call(document.querySelectorAll('#fydpBody th.n'), function(t){ return t.textContent; }))`));
    chk(name, 'panel', 'the panel heads each year’s second column Funded, and none Allocated, and its note says what Funded is',
      J([ph.filter(v => v === 'Funded').length > 0, ph.filter(v => v === 'Allocated').length, /Funded is what discretionary and mandatory pay/.test(B.ev(`document.getElementById('fydpBody').textContent`))]), J([true, 0, true]));
    B.ev(`fydpOpen=false; render(); 'ok'`);
    if (B.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// v2.15 W4 (the handoff's decision 19): THE GUIDE DESCRIBES THE FIVE-YEAR WORKBOOK THE BOARD WRITES. Both its paragraphs described the
// workbook before v2.04 -- "three summary sheets", "requirement and allocation", a PMO-only tab set -- and the office's section still
// offered "the slides", removed in v2.05. Read in a booted board, as the guide draws them. FAILS ON THE SLOT COMMIT.
{
  const name = 'v2.15 W4 — the guide describes the five-year workbook the board writes (the handoff’s decision 19)';
  try {
    const J = JSON.stringify;
    const B = boot();
    const grab = id => { const m = new RegExp('data-id="' + id + '"[^>]*>([\\s\\S]*?)</section>').exec(B.ev(`document.getElementById('helpDoc').innerHTML`)); return m ? m[1].replace(/<[^>]+>/g, '') : ''; };
    const o = grab('o-export'), t = grab('t-fydp');
    chk(name, 'office part', 'the office’s paragraph names the Summary, the tabs for the appropriation, each service and each office, and Requirement and Funded',
      J([/a Summary, then a tab for the appropriation, each service and each office/.test(o), /Requirement and Funded for the base year and the next four/.test(o)]), J([true, true]));
    chk(name, 'office part', 'and no longer offers the slides, removed in v2.05, or “requirement and allocation”', J([/slides/.test(o), /requirement and allocation/i.test(o)]), J([false, false]));
    chk(name, 'team part', 'the team’s paragraph names the Summary with its chart, a tab for each appropriation, service and PMO, and Funded as what discretionary and mandatory pay',
      J([/a Summary with a chart, then a tab for each appropriation, each service and each PMO/.test(t), /Requirement and Funded \(what discretionary and mandatory pay\)/.test(t)]), J([true, true]));
    chk(name, 'team part', 'and no longer the workbook before v2.04: no “three summary sheets”, no “requirement and allocation”',
      J([/three summary sheets/.test(t), /requirement and allocation/i.test(t)]), J([false, false]));
    chk(name, 'size', 'CONTROL: the guide stays inside its budget (72 KB, as the v1.86 block holds it)', B.ev(`document.getElementById('helpDoc').innerHTML.length`) < 72000, true);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// v2.19 (item 150): removed with its feature -- v2.15 W4 — a cost estimate imported again since v2.12 says why it disagrees with the copy imported before (item 135)
// v2.15 W4 (item 146): THE EDIT BOX TAKES A STORED SI CODE BACK TO THE RULES. "— follows the PMO and prime rules —" was offered only
// where nothing was stored, so a stored "no SI code" (or a code chosen by hand) could not be given back to the rules from the box --
// v2.14 W4's own check had to delete it in the page. Picked, nothing is stored (setSi's rule) and the code follows the office: B, in
// PP, derives EN. FAILS ON THE SLOT COMMIT: the option is not there, so the pick cannot be made. CONTROL: with nothing stored the
// option is offered and selected, as before.
{
  const name = 'v2.15 W4 — the edit box takes a stored SI code, or a stored none, back to the PMO and prime rules (item 146)';
  try {
    const J = JSON.stringify;
    const itx = (id, grp, ask) => ({ id, title: 'Rec ' + id, event: 'EV-' + id, grp, team: grp, sect: '', custom: false, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
    const B = boot(); seed(B.ev, { services: ['STOVL', 'USMC-C', 'USN'], items: [itx('A', 'AV', [0, 0, 100]), itx('B', 'PP', [0, 0, 100]), itx('C', 'PP', [0, 0, 100])], disc: [500, 500, 500], mand: [0, 0, 0], order: ['A', 'B', 'C'] });
    const ev = B.ev;
    ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); S.si={B:'', C:'OT'}; save(); window.confirm=function(){ return true; }; 'ok'`);
    chk(name, 'the fixture', 'CONTROL: B and C are in PP, which derives EN; B stores none by hand, C stores OT by hand', ev(`JSON.stringify([siDefault(itemById('B')), siOf(itemById('B')), siOf(itemById('C'))])`), J(['EN', '', 'OT']));
    const opts = id => JSON.parse(ev(`(function(){ openEdit(${J(id)},'si'); var s=document.getElementById('erSi'); var o=s? [].map.call(s.options, function(x){ return [x.value, x.text]; }) : null; return JSON.stringify(o); })()`));
    const FOL = ['\u0004', '— the code its office and contract give —'];   // v2.22 W3 (149.40): plain words
    chk(name, 'nothing stored (a CONTROL)', 'A, with nothing stored, is offered the rules’ option, selected', J([(opts('A') || []).some(o => o[0] === FOL[0] && o[1] === FOL[1]), ev(`document.getElementById('erSi').value`)]), J([true, FOL[0]]));
    ev(`erClose(); 'ok'`);
    for (const [id, was] of [['B', ''], ['C', 'OT']]) {
      const o = opts(id) || [];
      chk(name, id + ' (stored ' + (was ? was : 'none') + ')', 'the rules’ option is offered beside what is stored', J(o.some(x => x[0] === FOL[0] && x[1] === FOL[1])), 'true');
      ev(`(function(){ var s=document.getElementById('erSi'); s.value='\\u0004'; s.dispatchEvent(new Event('input')); s.dispatchEvent(new Event('change')); })(); erSave(); 'ok'`);
      chk(name, id + ' (stored ' + (was ? was : 'none') + ')', 'picked and saved, nothing is stored and the code follows its office: EN', ev(`JSON.stringify([Object.prototype.hasOwnProperty.call(S.si||{}, ${J(id)}), siOf(itemById(${J(id)}))])`), J([false, 'EN']));
      ev(`if(erOpen) erClose(); 'ok'`);
    }
    if (B.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ==== end v2.15 W4 ====
// ==== v2.15 integration (the lead) ====
// ==== end v2.15 integration ====
// ==== v2.15 review RV-A ====
// ==== end v2.15 review RV-A ====
// ==== v2.15 review RV-B ====
// ==== end v2.15 review RV-B ====
// ==== v2.15 review RV-C ====
// ==== end v2.15 review RV-C ====
// ==== v2.15 review RV-D ====
// ==== end v2.15 review RV-D ====
// ==== v2.22 W1 ====
// ==== end v2.22 W1 ====
// ==== v2.22 W2 ====
// v2.22 W2 (contract §1.2; Brad, 25 Nov 2026): Ctrl K, the list's search and Filter, the empty program, new years, the Add box.
// Every check here FAILS ON THE SLOT COMMIT (41ea5d7) unless it says CONTROL: the predicate, the palette, Start here, the tick-all,
// Add and start another and the pre-picked budget are not there, and each block throws or fails where it first reaches one.
// THE FIXTURE (W2F) works out by hand, so no expectation is read back from the code under test: one service (USAF), discretionary
// $300 and mandatory $120, six requirements of $100 but F's $50, walked in order A..F -- A, B and C draw discretionary, D draws $100
// of mandatory, E the last $20 and is short $80, F draws nothing and is short $50. E is starred: its MC shortage is its requirement
// less discretionary, $100, never its unfunded $80 (the Mission Critical rule).
const W2F = {
  services: ['USAF'],
  items: [['A', 'PSM', 100, 'alpha event'], ['B', 'PSM', 100, 'bravo event'], ['C', 'AV', 100, 'charlie event'],
    ['D', 'AV', 100, 'delta event'], ['E', 'PSM', 100, 'echo event'], ['F', 'AV', 50, 'foxtrot event']]
    .map(([id, grp, a, ev]) => ({ id, grp, team: grp, sect: '', custom: false, title: id + ' title', event: ev, ccar: '', fy26: [0], ask: [a], alloc: null })),
  disc: [300], mand: [120], order: ['A', 'B', 'C', 'D', 'E', 'F'], mc: { E: true },
};
const W2H = `(function(){
  window.__g=function(id){ return document.getElementById(id); };
  window.__v=function(id){ var e=__g(id); return e? String(e.value) : '(no #'+id+')'; };   // a field's value, or that it is not there
  window.__set=function(id, v){ var e=__g(id); if(!e) return 'no #'+id; e.focus(); e.value=v;
    e.dispatchEvent(new Event('input', {bubbles:true})); e.dispatchEvent(new Event('change', {bubbles:true})); return 'ok'; };
  window.__pick=function(id, v){ var e=__g(id); if(!e) return 'no #'+id; e.value=v; if(e.value!==String(v)) return 'not offered';
    e.dispatchEvent(new Event('change', {bubbles:true})); return 'ok'; };
  window.__key=function(k, t, o){ t=t||document.activeElement||document.body; var e=new KeyboardEvent('keydown', Object.assign({key:k, bubbles:true, cancelable:true}, o||{}));
    t.dispatchEvent(e); dlgSync(); return e.defaultPrevented; };
  window.__click=function(sel){ var b=document.querySelector(sel); if(!b) return 'no '+sel; b.click(); dlgSync(); return 'ok'; };
  window.__rows=function(){ return [].slice.call(document.querySelectorAll('#list .row')).map(function(r){ return r.id.replace(/^row-/,''); }).join(','); };
  window.__btns=function(sel){ return [].slice.call(document.querySelectorAll(sel)).map(function(b){ return b.textContent.replace(/\\s+/g,' ').trim(); }); };
  window.__asked=[]; window.__ans=true; window.confirm=function(m){ window.__asked.push(String(m)); return window.__ans; };
  // on the WINDOW, on the way down: the left menu's own handler (uiPanelRun, on the document) closes a flyout before the item runs
  window.__clicked=[]; window.addEventListener('click', function(e){ var t=e.target;
    if(t && t.getAttribute) window.__clicked.push({h:t.getAttribute('onclick')||'', id:t.id||'',
      where:(t.closest && t.closest('#uiFly'))? 'fly' : ((t.closest && t.closest('#uiRepPanel, #uiImpPanel, #uiDataPanel')) || {id:''}).id||'' }); }, true);
  return 'ok'; })()`;
const w2Tick = () => new Promise(r => setTimeout(r, 40));   // a left-menu item runs its call a turn later (mRun)
const w2Boot = (sc = W2F, o = {}) => {
  const B = boot(o); seed(B.ev, sc);
  B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); render(); 'ok'`);
  B.ev(W2H);
  return B;
};

// ── (1) THE LIST'S SEARCH (item 149.25) and FILTER (item 149.26) ──────────────────────────────────────────────────────────────
{
  const name = 'v2.22 W2 — the list’s search reads the row, clears with ✕ and Esc, says when nothing matches; Filter opens on Funding (items 149.25, 149.26)';
  try {
    const J = JSON.stringify;
    const { ev, errors } = w2Boot();
    ev(`S.recNames={C:'Gateway record name'}; S.notes={D:'needs the zebra crossing'}; S.ccar={E:'JSF2'}; S.costElem={F:'Depot Standup'}; save(); render(); 'ok'`);
    chk(name, 'fixture', 'CONTROL: six rows in the order A..F, nothing searched', ev(`__rows()`), 'A,B,C,D,E,F');
    // the row's second line: the record name, the note, the cost element; the number it is listed at
    const S1 = q => ev(`(function(){ __set('q', ${J(q)}); return __rows(); })()`);
    chk(name, 'search', 'the record name (on the row’s second line) finds C, and only C', S1('gateway'), 'C');
    chk(name, 'search', 'a word of the note finds D', S1('ZEBRA'), 'D');
    chk(name, 'search', 'the cost element finds F', S1('depot stand'), 'F');
    chk(name, 'search', 'the office finds its requirements (PSM: A, B, E)', S1('psm'), 'A,B,E');
    chk(name, 'search', '#2 finds the requirement listed at 2, and nothing else', S1('#2'), 'B');
    chk(name, 'search', '2 finds number 2 and E, whose CCaR record JSF2 holds the digit', S1('2'), 'B,E');
    chk(name, 'search', 'CONTROL: the title still finds as before (charlie)', S1('charlie'), 'C');
    // the clear button: hidden with nothing searched, shown with a search on, and it clears
    chk(name, 'clear', 'a search on: the ✕ inside the box is shown, named, and a native button', J([ev(`__g('qClr').hidden`), ev(`__g('qClr').tagName`), ev(`__g('qClr').getAttribute('aria-label')`)]),
      J([false, 'BUTTON', 'Clear the search']));
    ev(`__click('#qClr'); 'ok'`);
    chk(name, 'clear', '✕ clears the search: every row back, the box empty, the ✕ hidden, the keyboard in the box', J([ev(`__rows()`), ev(`__g('q').value`), ev(`__g('qClr').hidden`), ev(`document.activeElement && document.activeElement.id`)]),
      J(['A,B,C,D,E,F', '', true, 'q']));
    S1('echo');
    const prevented = ev(`__key('Escape', __g('q'))`);
    chk(name, 'Esc', 'Esc in the box clears a search that is on, and goes no further', J([ev(`__rows()`), ev(`__g('q').value`), prevented]), J(['A,B,C,D,E,F', '', true]));
    chk(name, 'Esc', 'CONTROL: Esc with nothing to clear is left alone', ev(`String(__key('Escape', __g('q')))`), 'false');
    // the search said under the header while the box is out of sight (jsdom draws nothing, so its box is never in sight; the browser
    // check holds the geometry)
    S1('charlie');
    chk(name, 'title band', 'a search on, its box not in sight: the note says what is searched and how many are shown, with a way to clear',
      J([ev(`__g('qAway').hidden`), ev(`__g('qAway').textContent.replace(/\\s+/g,' ').trim()`)]), J([false, 'Searching for “charlie” — 1 requirement shown Clear the search']));
    ev(`__click('#qAway button'); 'ok'`);
    chk(name, 'title band', 'its Clear the search clears, and the note goes', J([ev(`__rows()`), ev(`__g('qAway').hidden`)]), J(['A,B,C,D,E,F', true]));
    // nothing matches
    S1('zzzz');
    chk(name, 'no match', 'a search that finds nothing says so, names the search, and offers Clear the search',
      J([ev(`(__g('list').querySelector('.listempty')||{textContent:''}).textContent.replace(/\\s+/g,' ').trim()`)]), J(['No requirements match the search “zzzz”.Clear the search']));
    ev(`__click('#list .listempty button'); 'ok'`);
    chk(name, 'no match', 'Clear the search gives the list back', ev(`__rows()`), 'A,B,C,D,E,F');
    ev(`mcOnly=true; laneFilter='disc'; render(); __set('q', 'zzzz'); 'ok'`);
    chk(name, 'no match', 'a search and two filters: all three named, and the way back clears them all',
      J([ev(`__g('list').querySelector('.listempty b').nextSibling.textContent`), JSON.parse(ev(`JSON.stringify(__btns('#list .listempty button'))`))]),
      J([' the search “zzzz” · ★ Mission Critical only · fully discretionary only.', ['Clear the search and filters']]));
    ev(`__click('#list .listempty button'); 'ok'`);
    chk(name, 'no match', 'Clear the search and filters: every row back, nothing on', J([ev(`__rows()`), ev(`String(mcOnly)`), ev(`laneFilter`), ev(`__g('q').value`)]), J(['A,B,C,D,E,F', 'false', '', '']));
    // the palette's Requirements group and the list are ONE predicate: the same query finds the same requirements
    const agree = q => J([ev(`(function(){ __set('q', ${J(q)}); return __rows(); })()`),
      ev(`(function(){ var R=cmdResults(${J(q)}), g=R.groups.filter(function(x){ return x.k==='req'; })[0]; return g? g.rows.map(function(r){ return r.id; }).join(',') : ''; })()`)]);
    ['gateway', 'zebra', '#2', '2', 'psm', 'title'].forEach(q => {
      const [l, p] = JSON.parse(agree(q));
      chk(name, 'one predicate', 'the list and Ctrl K find the same requirements for “' + q + '”', p, l);
    });
    ev(`__set('q', ''); 'ok'`);
    // FILTER (149.26): on a browser that has never opened or closed one of its groups, Funding is open; no divider above it
    chk(name, 'Filter', 'CONTROL: nothing kept in this browser about the Filter menu’s groups', ev(`String(Object.prototype.hasOwnProperty.call(menuGrpOpen, 'view') && menuGrpOpen.view!=='fund')`), 'false');
    ev(`toggleMenu('view'); 'ok'`);
    chk(name, 'Filter', 'its first use: the Funding group is open, Service folded, and nothing above Funding but its heading',
      J([ev(`__g('dd_view').querySelector('.gh[data-g="fund"]').getAttribute('aria-expanded')`), ev(`__g('dd_view').querySelector('.gh[data-g="svc"]').getAttribute('aria-expanded')`),
        ev(`__g('dd_view').firstElementChild.className`)]), J(['true', 'false', 'gh']));
    ev(`menuGrp('view', 'fund'); toggleMenu('view'); toggleMenu('view'); 'ok'`);
    chk(name, 'Filter', 'closed by hand, it stays closed the next time Filter opens', ev(`__g('dd_view').querySelector('.gh[data-g="fund"]').getAttribute('aria-expanded')`), 'false');
    ev(`toggleMenu('view'); 'ok'`);
    if (errors.length) chk(name, 'jsdom', 'no script errors', errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}

// ── (2) CTRL K (item 155): find a requirement, a CCaR record or a left-menu action, and run the action from its one home ─────────
{
  const name = 'v2.22 W2 — Ctrl K finds requirements, CCaR records and every left-menu action, and runs each action from its own menu item (item 155)';
  try {
    const J = JSON.stringify;
    const { ev, errors } = w2Boot();
    ev(`MS.ccarIdx={rows:{JSF2:{t:'Avionics record', o:'OPR', p:'PSM', d:1}, JSF9:{t:'Nothing on it', o:'OPR', p:'PSM', d:1}}}; S.ccar={E:'JSF2'}; save(); render(); 'ok'`);
    const state = () => JSON.parse(ev(`JSON.stringify({open:cmdIsOpen(), focus:document.activeElement && document.activeElement.id,
      role:document.querySelector('#cmdPanel .modal').getAttribute('role'), lbl:document.querySelector('#cmdPanel .modal').getAttribute('aria-label')})`));
    chk(name, 'opening', 'CONTROL: the palette starts closed', state().open, false);
    const pre1 = ev(`__key('k', document.body, {ctrlKey:true})`);
    chk(name, 'opening', 'Ctrl K opens it, the browser’s own Ctrl K held back: a dialog named “Find or run anything”, the keyboard in its search',
      J([pre1, state()]), J([true, { open: true, focus: 'cmdQ', role: 'dialog', lbl: 'Find or run anything' }]));
    ev(`cmdClose(); 'ok'`);
    ev(`__key('k', document.body, {metaKey:true})`);
    chk(name, 'opening', '⌘K opens it too', state().open, true);
    // requirements: number, office, CCaR, value, funded or short, the MC shortage, a status pill with its word -- the fixture's own figures
    const grp = () => JSON.parse(ev(`JSON.stringify([].slice.call(document.querySelectorAll('#cmdList .cmd-g')).map(function(g){
      return [g.querySelector('.cmd-gh').textContent, [].slice.call(g.querySelectorAll('.cmd-o')).map(function(o){
        var p=o.querySelector('.cmd-pill, .cmd-tag'); return [o.querySelector('.cmd-t1').textContent, o.querySelector('.cmd-t2').textContent, p? p.textContent : '', p? (p.getAttribute('data-lk')||'') : '']; })]; }))`));
    ev(`__set('cmdQ', 'event'); 'ok'`);
    chk(name, 'requirements', 'every requirement, by its number, its words and figures as the board works them out, with its lane in words',
      J(grp()[0]), J(['Requirements', [
        ['#1 alpha event', 'PSM · $100 · funded in full', 'Discretionary', 'disc'],
        ['#2 bravo event', 'PSM · $100 · funded in full', 'Discretionary', 'disc'],
        ['#3 charlie event', 'AV · $100 · funded in full', 'Discretionary', 'disc'],
        ['#4 delta event', 'AV · $100 · funded in full', 'Mandatory', 'mand'],
        ['#5 echo event', 'PSM · JSF2 · $100 · unfunded $80 · ★ MC short $100', 'Mandatory', 'mand'],
        ['#6 foxtrot event', 'AV · $50 · unfunded $50', 'Unfunded', 'unf']]]));
    // the keyboard: arrows move, the active row named to the search box
    const act = () => ev(`__g('cmdQ').getAttribute('aria-activedescendant')+'|'+(document.querySelector('#cmdList .cmd-o.on')||{id:''}).id`);
    chk(name, 'keys', 'CONTROL: the first row is the active one', act(), 'cmdO_0|cmdO_0');
    ev(`__key('ArrowDown', __g('cmdQ')); __key('ArrowDown', __g('cmdQ')); 'ok'`);
    chk(name, 'keys', 'Down twice: the third row, named to the search box as its active option', act(), 'cmdO_2|cmdO_2');
    ev(`__key('ArrowUp', __g('cmdQ')); __key('ArrowUp', __g('cmdQ')); __key('ArrowUp', __g('cmdQ')); 'ok'`);
    chk(name, 'keys', 'Up three times from there wraps round to the last', act(), 'cmdO_5|cmdO_5');
    // Enter on a requirement the list hides: what hid it is taken off and said, it is selected and scrolled to, the box closes
    ev(`cmdClose(); mcOnly=false; laneFilter='disc'; render(); 'ok'`);
    chk(name, 'Enter', 'CONTROL: fully discretionary only is on, so D is not in the list', ev(`__rows()`), 'A,B,C');
    ev(`window.__sv=[]; Element.prototype.scrollIntoView=function(){ window.__sv.push(this.id); }; cmdOpen(); __set('cmdQ', 'delta'); __key('Enter', __g('cmdQ')); 'ok'`);
    chk(name, 'Enter', 'Enter on D: the filter is taken off and said, D is the record on screen and scrolled to, and the box is closed',
      J([ev(`__rows()`), ev(`curRow`), ev(`String(__sv.indexOf('row-D')>=0)`), state().open, /the lane filter was taken off/.test(ev(`__g('shareStat').textContent`))]),
      J(['A,B,C,D,E,F', 'D', 'true', false, true]));
    // CCaR records: shown when a records list is loaded; Enter shows the requirements on that record in the list
    ev(`cmdOpen(); __set('cmdQ', 'avionics'); 'ok'`);
    // E's record name is that record's title (the list names it), so E is found too
    chk(name, 'records', 'a CCaR record found by its title: its number and title, and how many requirements it holds this year',
      J(grp().map(g => [g[0], g[1].map(r => r.slice(0, 3))])), J([['Requirements', [['#5 echo event', 'PSM · JSF2 · $100 · unfunded $80 · ★ MC short $100', 'Mandatory']]],
        ['CCaR records', [['JSF2 · Avionics record', '1 requirement on this record, FY27', 'Record']]]]));
    ev(`__key('ArrowDown', __g('cmdQ')); __key('Enter', __g('cmdQ')); 'ok'`);
    chk(name, 'records', 'Enter on it: the list shows the requirements on that record, by the list’s own search', J([ev(`__g('q').value`), ev(`__rows()`), state().open]), J(['JSF2', 'E', false]));
    ev(`__set('q', ''); 'ok'`);
    // ACTIONS: every left-menu item, harvested here the way a person reaches it -- each entry opened, every item in its flyout or box
    // read, every folded group included -- and compared with what the palette offers
    const harvest = JSON.parse(ev(`(function(){
      var got={}, BOX={rep:'uiRepPanel', imp:'uiImpPanel', data:'uiDataPanel'};
      UI_NAV.forEach(function(k){ var nb=__g('uiNav_'+k); if(!nb || nb.hidden) return;
        if(!BOX[k] && UI_FLY.indexOf(k)<0) return;
        nb.click(); dlgSync();
        var root=BOX[k]? __g(BOX[k]) : __g('uiFly');
        [].slice.call(root.querySelectorAll(BOX[k]? 'button.mi' : 'button:not(.gh)')).forEach(function(b){ if(!b.disabled) got[b.getAttribute('onclick')]=1; });
        uiFlyClose(); if(BOX[k]) uiBoxClose(BOX[k]); dlgSync(); });
      return JSON.stringify(Object.keys(got).sort()); })()`));
    const offered = JSON.parse(ev(`(function(){ cmdClose(); CMD.acts=null; return JSON.stringify(cmdActions().filter(function(a){ return !a.view && !a.button; }).map(function(a){ return a.h; })
      .filter(function(h,i,arr){ return arr.indexOf(h)===i; }).sort()); })()`));
    chk(name, 'actions', 'CONTROL: the left menu holds many items here', J(harvest.length > 40), 'true');
    chk(name, 'actions', 'every item on the left menu is offered, and nothing that is not on it', J(offered), J(harvest));
    chk(name, 'actions', 'the views are offered as views: Requirements, Funding, Cycles & compare, Brief',
      ev(`cmdActions().filter(function(a){ return a.view; }).map(function(a){ return a.t+'·'+a.path; }).join(' | ')`), 'Requirements·Views | Funding·Views | Allocate·Views | Cycles & compare·Views | Brief·Views');   // v2.23 W3: Allocate is a view (item 159)
    // > lists actions only
    ev(`cmdOpen(); __set('cmdQ', '>e'); 'ok'`);
    chk(name, 'actions', '> first: actions only, even where requirements and records hold the words', J(grp().map(g => g[0])), J(['Actions']));
    ev(`__set('cmdQ', '>'); 'ok'`);
    chk(name, 'actions', '> alone lists every action', J(ev(`CMD.rows.length`) === ev(`cmdActions().length`)), 'true');
    // Enter on an action presses that left-menu item itself: its entry opened, the item clicked where it sits
    ev(`__set('cmdQ', 'change journal'); 'ok'`);
    chk(name, 'run', 'Change journal…, found by its words, under Audit', J(grp().map(g => [g[0], g[1].map(r => r.slice(0, 3))])), J([['Actions', [['Change journal…', 'Audit', 'Action']]]]));
    ev(`__clicked=[]; __key('Enter', __g('cmdQ')); 'ok'`); await w2Tick();
    chk(name, 'run', 'Enter: Audit’s own item is pressed in its flyout (mRun(toggleJrnl)), and the journal opens',
      J([ev(`JSON.stringify(__clicked.filter(function(c){ return c.h==='mRun(toggleJrnl)'; }))`), ev(`String(jrnlOpen)`), state().open]), J([J([{ h: 'mRun(toggleJrnl)', id: '', where: 'fly' }]), 'true', false]));
    ev(`toggleJrnl(); 'ok'`);
    ev(`window.__xl=0; exportExcel=function(){ window.__xl++; }; cmdOpen(); __set('cmdQ', 'excel workbook'); __clicked=[]; __key('Enter', __g('cmdQ')); 'ok'`); await w2Tick();
    chk(name, 'run', 'Excel Workbook: Reports & exports’ own item is pressed in its box, the export runs once, and the box closes',
      J([ev(`JSON.stringify(__clicked.filter(function(c){ return /exportExcel/.test(c.h); }).map(function(c){ return c.where; }))`), ev(`__xl`), ev(`__g('uiRepPanel').classList.contains('open')`)]),
      J([J(['uiRepPanel']), 1, false]));
    ev(`cmdOpen(); __set('cmdQ', 'funding'); 'ok'`);
    chk(name, 'run', 'CONTROL: the Funding view is offered under Views', ev(`String(CMD.rows.some(function(r){ return r.kind==='act' && r.a.view && r.t==='Funding'; }))`), 'true');
    ev(`(function(){ var i=CMD.rows.map(function(r){ return r.kind==='act' && r.a.view && r.t==='Funding'; }).indexOf(true); cmdRun(i); })(); 'ok'`);
    chk(name, 'run', 'a view runs as its entry: the Funding page', ev(`uiMode`), 'fund');
    ev(`uiSetMode('review'); 'ok'`);
    if (errors.length) chk(name, 'jsdom', 'no script errors', errors.slice(0, 2).join(' | '), '');
    // A PMO COPY: Program offices is not on its left menu, so Ctrl K offers none of it; its Save is Submit input
    {
      const B = w2Boot();
      const html = B.ev(`(function(){ var cap=null, _B=window.Blob;
        window.Blob=function(pt,o){ if(!cap && o && o.type==='text/html') cap=String(pt[0]); return new _B(pt,o); };
        window.confirm=function(){ return true; }; try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
        try{ publishPmoCopy(); }catch(e){} window.Blob=_B; return cap||''; })()`);
      chk(name, 'PMO copy', 'CONTROL: a copy was published', J(html.length > 100000), 'true');
      const C = boot({ html });
      const acts = JSON.parse(C.ev(`(function(){ CMD.acts=null; return JSON.stringify({sb:!!SANDBOX, hs:cmdActions().map(function(a){ return a.h; })}); })()`));
      chk(name, 'PMO copy', 'nothing of Program offices is offered (Publish PMO copy, Review submittals, the submittal loads), and Save is ✉ Submit input',
        J([acts.sb, acts.hs.filter(h => /publishPmoCopy|subOpenReview|uiPmoLoad/.test(h)), acts.hs.includes('pmoSubmit()'), acts.hs.includes('saveInPlace()')]), J([true, [], true, false]));
      // the copy also leaves Program offices' list empty, so that alone could not tell: on the board, an entry the menu does not
      // show offers nothing even where its list holds items
      const hid = JSON.parse(B.ev(`(function(){ CMD.acts=null; var was=cmdActions().filter(function(a){ return /publishPmoCopy/.test(a.h); }).length;
        __g('uiNav_pmo').hidden=true; CMD.acts=null; var now=cmdActions().filter(function(a){ return a.nav==='uiNav_pmo'; }).length;
        __g('uiNav_pmo').hidden=false; CMD.acts=null; return JSON.stringify([was, now]); })()`));
      chk(name, 'hidden entry', 'Program offices hidden on the board: none of its items is offered (CONTROL: shown, Publish PMO copy is)', J(hid), J([1, 0]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}

// ── (3) THE EMPTY PROGRAM (149.29), NEW YEARS (149.30), THE ADD BOX (149.22, 149.24 b) ────────────────────────────────────────────
{
  const name = 'v2.22 W2 — Start here in the empty program, an empty year leads with From another year, Add and start another, the only budget picked (items 149.22, 149.24, 149.29, 149.30)';
  try {
    const J = JSON.stringify;
    // THE PROGRAM WITH NO BOARD IN IT: nothing seeded, no services, no requirement in any year
    {
      const { ev, errors } = boot();
      ev(W2H);
      const sh = J([ev(`String(!!document.querySelector('#driveBar .starthere'))`), ev(`(document.querySelector('#driveBar .starthere h2')||{textContent:''}).textContent`),
        ev(`JSON.stringify(__btns('#driveBar .starthere button'))`)]);
      chk(name, 'Start here', 'one Start here block, its three ways in: open your saved board, connect the shared folder, start a new board',
        sh, J(['true', 'Start here', J(['Open your saved board…', 'Connect the shared folder…', 'Start a new board…'])]));
      chk(name, 'Start here', 'the shared-folder banner is folded into it: nothing else in the bar', ev(`String(__g('driveBar').children.length)`), '1');
      chk(name, 'Start here', 'the opening line waits behind the Message button, and points at Start here',
        J([ev(`__g('statWrap').classList.contains('fresh')`), /Start here/.test(ev(`__g('shareStat').textContent`))]), J([false, true]));
      chk(name, 'Start here', 'the list points at it, and offers no Add requirement it could never finish',
        J([/Start here/.test(ev(`__g('list').textContent`)), ev(`String(__g('list').querySelectorAll('button').length)`)]), J([true, '0']));
      // each way in presses its own left-menu item
      ev(`window.__ff=0; __g('fullFile').addEventListener('click', function(e){ window.__ff++; e.preventDefault(); }); __clicked=[]; startHere('open'); 'ok'`); await w2Tick();
      chk(name, 'Start here', 'Open your saved board…: Imports & exports’ own Import a full board is pressed, and its file picker asked for',
        J([ev(`JSON.stringify(__clicked.filter(function(c){ return /fullFile/.test(c.h); }).map(function(c){ return c.where; }))`), ev(`__ff`)]), J([J(['uiImpPanel']), 1]));
      ev(`__clicked=[]; startHere('folder'); 'ok'`); await w2Tick();
      chk(name, 'Start here', 'Connect the shared folder…: Setup’s own Live view… is pressed, and Live view opens',
        J([ev(`JSON.stringify(__clicked.filter(function(c){ return c.h==='mRun(toggleLive)'; }).map(function(c){ return c.where; }))`), ev(`String(liveOpen)`)]), J([J(['fly']), 'true']));
      ev(`toggleLive(); dlgSync(); __clicked=[]; startHere('board'); 'ok'`); await w2Tick();
      chk(name, 'Start here', 'Start a new board…: Setup’s own Services… is pressed, and the services open',
        J([ev(`JSON.stringify(__clicked.filter(function(c){ return c.h==='mRun(toggleSvcPanel)'; }).map(function(c){ return c.where; }))`), ev(`String(svcPanelOpen)`)]), J([J(['fly']), 'true']));
      ev(`toggleSvcPanel(); dlgSync(); 'ok'`);
      chk(name, 'Add', 'with no services, Add requirement opens no box it could never finish, and says why',
        J([ev(`String(arShow())`), ev(`String(arOpen)`), /no services yet/.test(ev(`__g('shareStat').textContent`))]), J(['false', 'false', true]));
      if (errors.length) chk(name, 'jsdom (program)', 'no script errors', errors.slice(0, 2).join(' | '), '');
    }
    // CONTROL: a board with requirements has no Start here
    {
      const { ev } = w2Boot();
      chk(name, 'Start here', 'CONTROL: a board with requirements has no Start here block', ev(`String(!!document.querySelector('.starthere'))`), 'false');
    }
    // A NEW YEAR: FY28 started empty on a board whose FY27 holds A..F
    const SV2 = ['USAF', 'ANG'];
    const sc2 = { services: SV2, items: W2F.items.map(x => ({ ...x, fy26: [0, 0], ask: [x.ask[0], 10] })), disc: [300, 30], mand: [120, 30], order: W2F.order, mc: {} };
    const { ev, errors } = w2Boot(sc2);
    const BAE = ['USAF O&M- CAM Discretionary PSM', 'USAF O&M - ANG CAM PSM', 'USAF O&M - ANG CONG PSM',
      'USAF O&M- CAM Discretionary AV', 'USAF O&M- CAM PES Discretionary AV', 'USAF O&M - ANG CONG AV'];
    ev(`BUDDB={ts:1790000000222, files:[], rows:${J(BAE)}.map(function(n){ return {n:n}; })}; _budRegCache=null; setPmoFilter('PSM'); 'ok'`);
    ev(`__asked=[]; window.confirm=function(m){ __asked.push(String(m)); return __asked.length>1; }; switchYear(2028); window.confirm=function(m){ __asked.push(String(m)); return window.__ans; }; 'ok'`);
    chk(name, 'new year', 'CONTROL: FY28 was started empty (not rolled forward) and is on screen', J([ev(`MS.cur`), ev(`S.order.length`)]), J([2028, 0]));
    chk(name, 'new year', 'the empty year says so and leads with From another year, beside the way to add a new one',
      J([ev(`__g('list').querySelector('.listempty b').textContent`), JSON.parse(ev(`JSON.stringify(__btns('#list .listempty button'))`))]),
      J(['FY28 holds no requirements yet.', ['Bring requirements in from another year…', '＋ Add a new requirement']]));
    ev(`__click('#list .listempty button'); 'ok'`);
    chk(name, 'new year', 'its first button opens Add requirement on From another year, for PSM', J([ev(`String(arOpen)`), ev(`arTabOn`), ev(`String(__g('arYr').hidden)`), ev(`arOff`)]), J(['true', 'yr', 'false', 'PSM']));
    ev(`naFromPick('2027'); 'ok'`);
    const tick = () => J([ev(`JSON.stringify(Object.keys(naFromSel).sort())`), ev(`__g('naFromBtn').textContent`), ev(`String(__g('naFromBtn').disabled)`)]);
    chk(name, 'tick-all', 'a tick-all over FY27’s PSM rows, named with how many it ticks', ev(`(__g('naFromAll')||{getAttribute:function(){ return 'none'; }}).getAttribute('aria-label')`), 'Tick all 3 that can be brought in');
    ev(`__g('naFromAll').checked=true; __g('naFromAll').dispatchEvent(new Event('change', {bubbles:true})); 'ok'`);
    chk(name, 'tick-all', 'ticked: A, B and E, PSM’s three, and the button says what it will do; the keyboard stays on the tick-all',
      J([tick(), ev(`document.activeElement && document.activeElement.id`), ev(`String(__g('naFromAll').checked)`)]),
      J([J([J(['A', 'B', 'E']), 'Finish 3 in New requirement', 'false']), 'naFromAll', 'true']));
    ev(`__g('naFromAll').checked=false; __g('naFromAll').dispatchEvent(new Event('change', {bubbles:true})); 'ok'`);
    chk(name, 'tick-all', 'unticked: none, and the button is off', tick(), J([J([]), 'Tick the ones to bring in', 'true']));
    // finishing one brought in: the form holds only the picked budget, which is no typing, so nothing is asked before it is filled
    ev(`__asked=[]; naFromTick('A', true); naFromAdd(); 'ok'`);
    chk(name, 'finish', 'one brought in to finish fills New requirement without asking: the only budget picked is not typing',
      J([ev(`__asked.length`), ev(`arTabOn`), ev(`__g('arEvent').value`)]), J([0, 'new', 'alpha event']));
    ev(`arSkip(); __g('addPanel').querySelector('h3 button.x').click(); dlgSync(); 'ok'`);
    // the Removed list says what Restore does not bring back
    ev(`rmOpen=true; render(); 'ok'`);
    chk(name, 'Removed', 'the Removed list says what Restore brings back and what it does not, and how to bring one in whole',
      ev(`(__g('rmPanel').querySelector('.rmsay')||{textContent:''}).textContent.replace(/\\s+/g,' ').trim()`),
      '↩ Restore brings a requirement back as FY28 holds it. In a year started empty that is the board’s own line, bare: not the PID, award dates, notes or description another year holds. To bring one in with all of that, linked to the year it came from: Bring one in from another year…');
    ev(`rmOpen=false; render(); 'ok'`);
    // THE ADD BOX: the only budget picked, never one offered by hand only, never one of several
    ev(`toggleAdd(); __set('arV0', '100'); __set('arV1', '10'); 'ok'`);
    chk(name, 'budget', 'PSM: USAF’s only name picked for you, and said on hover; ANG has two (one by hand only), so none is picked',
      J([ev(`__g('arB0').value`), /picked for you/.test(ev(`__g('arB0').title`)), ev(`__g('arB1').value`)]), J([BAE[0], true, '']));
    ev(`__g('addPanel').querySelector('h3 button.x').click(); dlgSync(); setPmoFilter('AV'); toggleAdd(); __set('arV0', '100'); __set('arV1', '10'); 'ok'`);
    chk(name, 'budget', 'AV: USAF has three names, so none is picked; ANG’s only name is by hand only, so it is not picked', J([ev(`__g('arB0').value`), ev(`__g('arB1').value`)]), J(['', '']));
    ev(`__g('addPanel').querySelector('h3 button.x').click(); dlgSync(); setPmoFilter('PSM'); 'ok'`);
    // ADD AND START ANOTHER: the office kept, the form emptied (the only budget picked again), the keyboard on the plan event
    const fill = ev1 => `__set('arEvent', ${J(ev1)}); __click('#arPtP'); __set('arV0', '200'); __pick('arOb', 'PMO LM Contract'); __pick('arTo', 'lm');
      __set('arDesc', 'd'); __set('arCons', 'c'); 'ok'`;
    ev(`toggleAdd(); ${fill('first added')}`);
    chk(name, 'start another', 'CONTROL: the form is complete, its budget the one picked for it', J([ev(`__g('arAddBtn').textContent`), ev(`__g('arB0').value`)]), J(['Add requirement', BAE[0]]));
    chk(name, 'start another', 'Add and start another is beside Add requirement, a native button', JSON.parse(ev(`JSON.stringify(__btns('#arFt button'))`)), JSON.parse(J(['Cancel', 'Add and open its record', 'Add and start another', 'Add requirement'])));
    ev(`window.__sv=[]; Element.prototype.scrollIntoView=function(){ window.__sv.push(this.id); }; __click('#arAddMore'); 'ok'`);
    chk(name, 'start another', 'added; the box stays open for PSM with the form empty, the only budget picked again, the keyboard on the plan event, and says what it added',
      J([ev(`S.order.join(',')`), ev(`String(arOpen)`), ev(`arOff`), ev(`__v('arEvent')+'|'+__v('arV0')+'|'+__v('arDesc')`), ev(`__v('arB0')`),
        ev(`document.activeElement && document.activeElement.id`), ev(`(__g('arMsg')||{textContent:'(no message line)'}).textContent`)]),
      J(['NEW-1', 'true', 'PSM', '||', BAE[0], 'arEvent', 'Added NEW-1 — first added. The form is empty for the next one, for PSM.']));
    chk(name, 'start another', 'and the list went to the new row', ev(`String(__sv.indexOf('row-NEW-1')>=0)`), 'true');
    ev(`${fill('second added')}; __sv=[]; __click('#arAddBtn'); 'ok'`);
    chk(name, 'Add', 'Add requirement: added, the box closed, the list at the new row, and the confirmation opened whole so it shows at any width',
      J([ev(`S.order.join(',')`), ev(`String(arOpen)`), ev(`String(__sv.indexOf('row-NEW-2')>=0)`), ev(`__g('statWrap').classList.contains('big')`), /Added NEW-2/.test(ev(`__g('shareStat').textContent`))]),
      J(['NEW-1,NEW-2', 'false', 'true', true, true]));
    if (errors.length) chk(name, 'jsdom', 'no script errors', errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ==== end v2.22 W2 ====
// ==== v2.22 W3 ====
// ==== end v2.22 W3 ====
// ==== v2.22 integration (the lead) ====
// ==== end v2.22 integration (the lead) ====
// ==== v2.23 W1 ====
// ==== end v2.23 W1 ====
// ==== v2.23 W2 ====
// ==== end v2.23 W2 ====
// ==== v2.23 W3 ====
// ==== end v2.23 W3 ====
// ==== v2.23 integration (the lead) ====
// ==== end v2.23 integration (the lead) ====

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
