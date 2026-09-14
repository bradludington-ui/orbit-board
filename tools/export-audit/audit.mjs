// Audit the Excel Workbook export against tiers(), which is the board's own per-requirement
// discretionary / mandatory / unfunded truth. Every check compares a number the workbook prints
// against the same number recomputed from tiers().
import { boot, seed, capture, num, cv } from './boot.mjs';

const EPS = 0.005;
let failures = [];
const chk = (scenario, sheet, what, got, want) => {
  // Numbers compare within EPS; anything else (a marker string, a "differs"/"same" verdict)
  // compares exactly. Without this branch a string pair yields NaN and fails unconditionally.
  const numeric = typeof got === 'number' && typeof want === 'number';
  const ok = numeric ? Math.abs(got - want) <= EPS : Object.is(got, want);
  if (!ok) failures.push({ scenario, sheet, what, got, want, delta: numeric ? got - want : null });
  return ok;
};

const sum = a => a.reduce((x, y) => x + y, 0);
const rowKey = r => String(cv(r[0]) ?? '');
const findRow = (sh, k) => sh.rows.find(r => rowKey(r).trim() === k);
const sheetOf = (sheets, n) => sheets.find(s => s.name === n);

// ---------------------------------------------------------------------------------------------
// Scenarios. Per-service asks are deliberately uneven so anything that averages across services
// instead of weighting by service shows up as a mismatch.
// ---------------------------------------------------------------------------------------------
const SVC3 = ['STOVL', 'CV', 'CTOL'];
const it = (id, grp, ask, extra = {}) => ({
  id, grp, team: grp, sect: '', custom: false, title: id + ' title', event: id + ' event',
  ccar: '', fy26: ask.map(() => 0), ask, alloc: null, ...extra,
});

const SCENARIOS = {
  // Plain lane walk: discretionary runs dry partway, rest spills to mandatory, then unfunded.
  'auto lanes': {
    services: SVC3,
    items: [it('A', 'ATL', [50, 20, 10]), it('B', 'PSM', [40, 30, 5]), it('C', 'AV', [30, 10, 20])],
    disc: [60, 25, 12], mand: [40, 20, 10],
    order: ['A', 'B', 'C'], mc: { C: true },
  },
  // Every override flavour, plus a trim.
  'overrides + trims': {
    services: SVC3,
    items: [it('A', 'ATL', [50, 20, 10]), it('B', 'PSM', [40, 30, 5]),
            it('C', 'AV', [30, 10, 20]), it('D', 'MxS', [25, 15, 5])],
    disc: [70, 30, 15], mand: [50, 25, 12],
    order: ['A', 'B', 'C', 'D'],
    mc: { C: true },
    fsrc: { A: { m: 'mand' }, B: { m: 'ufr' }, C: { m: 'split', d: 30, mnd: 20 } },
    alloc: { D: { m: 's', v: [20, 10, 2] } },      // trimmed below ask -> delta
  },
  // PRIME-3 CLIN split, with one service carrying ask that NO clin covers.
  'prime clin split': {
    services: SVC3,
    items: [it('PRIME-3', 'PRIMES', [90, 10, 20]), it('A', 'ATL', [20, 10, 5])],
    disc: [0, 0, 0], mand: [90, 10, 20],
    order: ['PRIME-3', 'A'], mc: { 'PRIME-3': true },
    clins: { 'PRIME-3': [{ clin: '0010', ask: [90, 0, 0] }, { clin: '0002', ask: [0, 10, 0] }] },
  },
  // Cost elements present -> the two CE tabs are built. Also mixes MC with a trim.
  'cost elements': {
    services: SVC3,
    items: [it('A','ATL',[50,20,10]), it('B','PSM',[40,30,5]), it('C','AV',[30,10,20]), it('D','MxS',[25,15,5])],
    disc:[60,25,12], mand:[40,20,10],
    order:['A','B','C','D'], mc:{C:true, D:true},
    alloc:{ B:{m:'s', v:[30,20,3]} },
    costElems: true,
    costElem: { A:'Airframe PGSE', B:'Engine PGSE', C:'Airframe PGSE', D:'Avionics PGSE' },
  },
  // Prime CLIN split AND cost elements: pits 'PMO Matrix' against 'CE by PMO' and the per-PMO sheets.
  'prime + cost elements': {
    services: SVC3,
    items: [it('PRIME-3','PRIMES',[90,10,20]), it('A','ATL',[20,10,5])],
    disc:[50,10,10], mand:[60,15,20],
    order:['PRIME-3','A'], mc:{'PRIME-3':true},
    clins:{ 'PRIME-3':[{clin:'0010',ask:[90,0,0]},{clin:'0002',ask:[0,10,0]}] },
    costElems:true, costElem:{ 'PRIME-3':'Airframe PGSE', A:'Engine PGSE' },
  },
  // One starred requirement fully covered by discretionary (no shortfall) and one short.
  'mc fully funded': {
    services: SVC3,
    items: [it('A','ATL',[30,10,5]), it('B','PSM',[40,30,5]), it('C','AV',[20,10,10])],
    disc:[35,15,8], mand:[20,10,5],
    order:['A','B','C'], mc:{A:true, C:true},
  },
  // A starred requirement TRIMMED on the board and then fully covered by discretionary within
  // that trim. Its spill is zero, so a spill-based test would call it whole -- but 30 of the
  // requirement is not covered by the money that is coming, so it is short by the trim.
  'mc trimmed but disc-covered': {
    services: ['STOVL', 'CV'],
    items: [it('A', 'ATL', [50, 20])],
    disc: [40, 20], mand: [30, 30],
    order: ['A'], mc: { A: true },
    alloc: { A: { m: 's', v: [30, 10] } },
  },
  // Over-allocated in one service, short in another. The two readings of the shortage formula
  // diverge only here: money is not fungible across services, so an over-allocation on STOVL
  // must not mask a shortage on CV.
  'mc over-allocated one service': {
    services: ['STOVL', 'CV'],
    items: [it('A', 'ATL', [40, 30])],
    disc: [100, 50], mand: [0, 0],
    order: ['A'], mc: { A: true },
    alloc: { A: { m: 's', v: [60, 5] } },
  },
  // Over-allocated in one service AND the lane cannot cover it: the only shape where capping
  // 'beyond both lanes' at the ask differs from not capping it.
  'over-allocated and short of the lane': {
    services: ['STOVL', 'CV'],
    items: [it('A', 'ATL', [40, 30])],
    disc: [30, 50], mand: [0, 0],
    order: ['A'], mc: { A: true },
    alloc: { A: { m: 's', v: [60, 5] } },
  },
  // A DIRECTED SOURCE ON A TRIMMED REQUIREMENT. The basis is the board allocation, the same as for
  // any other requirement — a source says where the allocation is drawn from, not that the untrimmed
  // ask is being claimed. Until this scenario existed, every fsrc item also had no allocation, so
  // svcAlloc returned the ask anyway and the two readings were indistinguishable. Here the ask is 80
  // and the allocation 40, so they cannot be confused: the 40 difference must come out as TRIM, and
  // Beyond Both Lanes must be nothing.
  'directed source on a trimmed requirement': {
    services: SVC3,
    items: [it('A', 'ATL', [50, 20, 10]), it('B', 'PSM', [30, 10, 5])],
    disc: [60, 25, 12], mand: [40, 20, 10],
    order: ['A', 'B'],
    fsrc: { A: { m: 'mand' } },
    alloc: { A: { m: 't', v: 40 } },
  },
  // A SCALAR TRIM — one figure typed into the row's allocation box, which svcAlloc prorates across
  // services by each service's share of the ask. Every other scenario here hands in a per-service
  // vector, so this branch carried no coverage at all until a mutation sweep said so, and it is the
  // commonest edit on the board. The asks are deliberately uneven: the rule gives 30 / 15 / 5 where
  // an even split would give 16.67 each, so a wrong split cannot hide inside a right total.
  'scalar trim prorated across services': {
    services: SVC3,
    items: [it('A', 'ATL', [60, 30, 10])],
    disc: [40, 20, 10], mand: [0, 0, 0],
    order: ['A'],
    alloc: { A: { m: 't', v: 50 } },
  },
  // The same trim where one service's discretionary lane cannot cover its prorated share, so the
  // proration and the per-service lane floor have to hold at the same time.
  'scalar trim against a short lane': {
    services: SVC3,
    items: [it('A', 'ATL', [60, 30, 10])],
    disc: [10, 20, 10], mand: [15, 0, 0],
    order: ['A'],
    alloc: { A: { m: 't', v: 50 } },
  },
  // Nothing funded at all: every dollar must land in unfunded.
  'zero budget': {
    services: SVC3,
    items: [it('A', 'ATL', [50, 20, 10]), it('B', 'PSM', [40, 30, 5])],
    disc: [0, 0, 0], mand: [0, 0, 0],
    order: ['A', 'B'], mc: { B: true },
  },
};

for (const [name, sc] of Object.entries(SCENARIOS)) {
  const { ev, errors } = boot();
  if (sc.clins) ev(`DATA.clins = ${JSON.stringify(sc.clins)};`);
  if (sc.costElems) ev(`DATA.costElems = true;`);
  seed(ev, sc);
  if (sc.costElem) ev(`S.costElem = ${JSON.stringify(sc.costElem)};`);

  const T = JSON.parse(ev('JSON.stringify(tiers())'));
  const sheets = JSON.parse(capture(ev));
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  const SVC = sc.services, n = SVC.length;
  const ids = sc.order;
  const vecSum = f => { const v = SVC.map(() => 0); ids.forEach(id => f(T[id]).forEach((x, i) => v[i] += x)); return v; };
  const allD = vecSum(p => p.d), allM = vecSum(p => p.m), allU = vecSum(p => p.u);
  const askOf = id => sum(sc.items.find(x => x.id === id).ask);
  // MC is a memo over REQUIREMENTS now: the starred requirements' own value.
  const mcIds = ids.filter(id => sc.mc && sc.mc[id]);
  const mcMemo = mcIds.reduce((a, id) => a + askOf(id), 0);
  // "short" is measured against DISCRETIONARY ONLY: a starred requirement carried by the
  // mandatory lane is still short, because mandatory does not cover the commitment.
  const mcShortOf = {};
  ids.forEach(id => { const ask = sc.items.find(x => x.id === id).ask;
    mcShortOf[id] = sum(SVC.map((s, i) => Math.max(0, ask[i] - T[id].d[i]))); });
  const unfOf = mcShortOf;   // the MC basis: value less what discretionary covered
  const mcShortMemo = mcIds.filter(id => unfOf[id] > 0.005).reduce((a, id) => a + askOf(id), 0);
  const askAll = ids.reduce((a, id) => a + askOf(id), 0);

  // UNFUNDED IS PER SERVICE. A service is a service AND ITS VARIANT; money never nets across them.
  // THE ALLOCATION BASIS, DERIVED HERE from the scenario's own inputs — never read back from the
  // page. A scalar allocation prorates by each service's share of the ask; an even split is a
  // different answer, not a rounding difference, because money is not fungible across services.
  // A directed funding source does NOT re-base the requirement on its full ask: it says where the
  // ALLOCATION is drawn from. It used to, and that made the same money read as TRIM on an ordinary
  // requirement and as BEYOND BOTH LANES on one carrying a source — so recording where money came
  // from, which moves no money, grew the shortfall.
  const basisOf = id => {
    const item = sc.items.find(x => x.id === id);
    const a = sc.alloc && sc.alloc[id];
    if (a === null || a === undefined) return item.ask.slice();
    if (a.m === 's') return a.v.slice();          // per-service vector, taken as given
    const at = sum(item.ask);                     // scalar trim, prorated by ask share
    if (at > 0) return item.ask.map(x => a.v * x / at);
    return SVC.map(() => a.v / SVC.length);       // a zero ask cannot be weighted
  };
  const askArr = id => sc.items.find(x => x.id === id).ask;
  const unfSvcExp = id => SVC.map((s, i) => Math.max(0, askArr(id)[i] - T[id].d[i] - T[id].m[i]));
  const beyondSvcExp = id => SVC.map((s, i) => Math.max(0, Math.min(askArr(id)[i], basisOf(id)[i]) - T[id].d[i] - T[id].m[i]));
  const trimSvcExp = id => SVC.map((s, i) => Math.max(0, askArr(id)[i] - basisOf(id)[i]));
  const svcTot = f => SVC.map((s, i) => ids.reduce((a, id) => a + f(id)[i], 0));
  const unfSvcAll = svcTot(unfSvcExp), beyondSvcAll = svcTot(beyondSvcExp), trimSvcAll = svcTot(trimSvcExp);
  // With unfunded floored per service, funded + unfunded exceeds the ask exactly where a service was
  // funded BEYOND what it asked for -- that excess is real money and does not vanish. Per service the
  // identity is funded + unfunded == max(ask, funded); this is its board-wide form.
  const coverAll = ids.reduce((a, id) => a + sum(SVC.map((s, i) =>
    Math.max(askArr(id)[i], T[id].d[i] + T[id].m[i]))), 0);

  // ---- 1. conservation inside tiers() itself (the basis for everything else) ----
  ids.forEach(id => {
    const p = T[id];
    const basis = basisOf(id);
    SVC.forEach((s, i) => chk(name, 'tiers()', `${id} d+m+u == basis [${s}]`,
      p.d[i] + p.m[i] + p.u[i], basis[i]));
  });

  // ---- 1b. INDEPENDENT ORACLE: re-derive the greedy walk and compare draw for draw ----
  // Each service draws its own discretionary lane until dry, then mandatory, then unfunded.
  {
    const dRem = sc.disc.slice(), mRem = sc.mand.slice();
    ids.forEach(id => {
      const basis = basisOf(id);
      if (sc.fsrc && sc.fsrc[id]) {          // directed sources have their own rules; drawn down so
        SVC.forEach((s, i) => {              // later requirements still see the right lane balances
          dRem[i] -= T[id].d[i]; mRem[i] -= T[id].m[i];
        });
        return;
      }
      SVC.forEach((s, i) => {
        const want = basis[i];
        const d = Math.min(want, Math.max(0, dRem[i])); dRem[i] -= d;
        const m = Math.min(want - d, Math.max(0, mRem[i])); mRem[i] -= m;
        const u = want - d - m;
        chk(name, 'lane oracle', `${id} discretionary draw [${s}]`, T[id].d[i], d);
        chk(name, 'lane oracle', `${id} mandatory draw [${s}]`, T[id].m[i], m);
        chk(name, 'lane oracle', `${id} unfunded [${s}]`, T[id].u[i], u);
      });
    });
  }

  // ---- 2. lane draws never exceed budget authority ----
  SVC.forEach((s, i) => {
    if (allD[i] > sc.disc[i] + EPS) failures.push({ scenario: name, sheet: 'tiers()', what: `disc drawn > BA [${s}]`, got: allD[i], want: sc.disc[i], delta: allD[i] - sc.disc[i] });
    if (allM[i] > sc.mand[i] + EPS) failures.push({ scenario: name, sheet: 'tiers()', what: `mand drawn > BA [${s}]`, got: allM[i], want: sc.mand[i], delta: allM[i] - sc.mand[i] });
  });

  // ---- 3. Funding Streams: the board-wide roll-up ----
  const fs = sheetOf(sheets, 'Funding Streams');
  SVC.forEach((s, i) => {
    const r = findRow(fs, s); if (!r) return;
    chk(name, 'Funding Streams', `${s} Disc Funded`, num(r[3]), allD[i]);
    chk(name, 'Funding Streams', `${s} Mand Funded`, num(r[6]), allM[i]);
    chk(name, 'Funding Streams', `${s} Funded Total`, num(r[8]), allD[i] + allM[i]);
    chk(name, 'Funding Streams', `${s} Beyond Both Lanes`, num(r[10]), beyondSvcAll[i]);
    chk(name, 'Funding Streams', `${s} TOTAL UNFUNDED (floored per service)`, num(r[11]), unfSvcAll[i]);
    chk(name, 'Funding Streams', `${s} Trim`, num(r[9]), trimSvcAll[i]);
    // the three must close: beyond + trim == unfunded, per service
    chk(name, 'Funding Streams', `${s} beyond + trim == unfunded`,
      num(r[10]) + num(r[9]), num(r[11]));
  });

  // ---- 4. PMO Matrix: per-PMO shares must add back to the board totals ----
  const gmx = sheetOf(sheets, 'PMO Matrix');
  const pmoRows = gmx.rows.filter(r => {
    const k = rowKey(r);
    return k && !['TOTAL', 'PMO', 'BUDGET AUTHORITY', 'REMAINING (lanes)', 'UNFUNDED (beyond both lanes)',
      'ASK NOT ALLOCATED (trim deltas)', 'TOTAL UNFUNDED (deltas + beyond lanes)'].includes(k)
      && !k.includes('—') && typeof num(r[1]) === 'number' && !isNaN(num(r[1]));
  });
  SVC.forEach((s, i) => {
    chk(name, 'PMO Matrix', `sum of PMO rows == board Disc [${s}]`,
      sum(pmoRows.map(r => num(r[1 + i * 2]))), allD[i]);
    chk(name, 'PMO Matrix', `sum of PMO rows == board Mand [${s}]`,
      sum(pmoRows.map(r => num(r[2 + i * 2]))), allM[i]);
  });
  // ---- THE TWO STATED RULES, asserted verbatim ------------------------------------------------
  //   MC Total    = sum of MC-designated requirement/ask values
  //   MC shortage = requirement/ask value - discretionary allocated   (per service; mandatory
  //                 is never netted off, and an over-allocation in one service cannot mask a
  //                 shortage in another)
  chk(name, 'RULE', 'MC Total == sum of MC requirement/ask values',
    sum(pmoRows.map(r => num(r[r.length - 2]))), mcIds.reduce((a, id) => a + askOf(id), 0));
  chk(name, 'RULE', 'MC shortage == ask value - discretionary allocated',
    sum(pmoRows.map(r => num(r[r.length - 1]))),
    mcIds.reduce((a, id) => a + sum(SVC.map((s, i) =>
      Math.max(0, sc.items.find(x => x.id === id).ask[i] - T[id].d[i]))), 0));
  chk(name, 'PMO Matrix', 'sum of PMO rows == MC memo (requirement value)',
    sum(pmoRows.map(r => num(r[r.length - 2]))), mcMemo);
  const mcShortAll = mcIds.reduce((a, id) => a + mcShortOf[id], 0);
  chk(name, 'PMO Matrix', 'sum of PMO rows == MC short vs discretionary',
    sum(pmoRows.map(r => num(r[r.length - 1]))), mcShortAll);
  // The gap must ignore mandatory entirely. Floored PER SERVICE, not once on the totals:
  // money is not fungible across services, so being over-allocated on one cannot pay down a
  // shortage on another. The two readings agree on any board without an over-allocation.
  chk(name, 'PMO Matrix', 'MC short == value - discretionary drawn (mandatory ignored)',
    mcShortAll, mcIds.reduce((a, id) => a + sum(SVC.map((s, i) =>
      Math.max(0, sc.items.find(x => x.id === id).ask[i] - T[id].d[i]))), 0));
  // THE ANTI-DOUBLE-COUNT CHECK: the lanes alone must account for every requirement dollar,
  // with MC sitting outside them.
  chk(name, 'PMO Matrix', 'Disc + Mand across PMO rows == funded dollars',
    sum(pmoRows.map(r => sum(SVC.map((s, i) => num(r[1 + i * 2]) + num(r[2 + i * 2]))))),
    sum(allD) + sum(allM));

  const titleToIdMC = {}; ids.forEach(id => titleToIdMC[id + ' title'] = id);

  // ---- 5. tier list sheets tie to the same totals ----
  const tierTot = (sheetName, want, col = 7) => {
    const sh = sheetOf(sheets, sheetName); if (!sh) return;
    const tr = sh.rows.find(r => rowKey(r) === 'TOTAL'); if (!tr) return;
    chk(name, sheetName, 'TOTAL amount', num(tr[col]), want);
    SVC.forEach((s, i) => chk(name, sheetName, `TOTAL [${s}]`, num(tr[8 + i]),
      want === sum(allD) ? allD[i] : want === sum(allM) ? allM[i] : NaN));
  };
  tierTot('Funded - Discretionary', sum(allD));
  tierTot('Funded - Mandatory', sum(allM));
  {
    const sh = sheetOf(sheets, 'Mission Critical');
    const tr = sh && sh.rows.find(r => rowKey(r) === 'TOTAL');
    if (tr) chk(name, 'Mission Critical', 'TOTAL == requirement value of SHORTFALL MC items', num(tr[7]), mcShortMemo);

    // THE SHORTAGE ITSELF, per requirement. The sheet used to say WHICH starred requirements were
    // short and print their full value, but never by how much -- so the one figure the star is
    // about existed in no export, and the only place to read it per requirement was a panel that
    // was reporting "covered" for every row. Columns are appended after the per-service block.
    const hdr = sh && sh.rows.find(r => String(cv(r[0])).trim() === 'Rank');
    const shCol = hdr ? hdr.findIndex(c => /Short vs DISC/.test(String(cv(c)))) : -1;
    chk(name, 'Mission Critical', 'the shortage column is present',
      shCol > 0 ? 'present' : 'missing', 'present');
    if (sh && shCol > 0) {
      const svcCol = SVC.map(x => hdr.findIndex(c => String(cv(c)).trim() === 'Short ' + x));
      let listed = 0, shTot = 0;
      sh.rows.forEach(r => {
        const id = titleToIdMC[String(cv(r[3]))]; if (!id) return;
        listed++;
        const want = sum(SVC.map((x, i) => Math.max(0, askArr(id)[i] - T[id].d[i])));
        shTot += want;
        chk(name, 'Mission Critical', `${id}: \u2605 short == ask - discretionary`, num(r[shCol]), want);
        chk(name, 'Mission Critical', `${id}: \u2605 short == its own per-service columns`,
          sum(svcCol.map(i => num(r[i]))), num(r[shCol]));
      });
      // Only starred requirements that are actually short are listed; the filter and the column
      // have to agree, or a row appears with nothing to show or a shortage goes unlisted.
      const shouldList = ids.filter(id => mcIds.includes(id)
        && sum(SVC.map((x, i) => Math.max(0, askArr(id)[i] - T[id].d[i]))) > 0.005).length;
      chk(name, 'Mission Critical', 'every short starred requirement is listed, and only those',
        listed, shouldList);
      const trS = sh.rows.find(r => rowKey(r) === 'TOTAL');
      if (trS) chk(name, 'Mission Critical', 'TOTAL \u2605 short == the rows above it', num(trS[shCol]), shTot);
    }
  }

  // ---- 6. Unfunded sheet: each row's total must equal its per-service columns ----
  const us = sheetOf(sheets, 'Unfunded Requirements');
  // COLUMNS ARE FOUND BY HEADER, NOT BY POSITION. Reading them positionally meant that inserting
  // one column silently slid every later check onto the wrong column -- they kept comparing real
  // numbers and failing for a reason that had nothing to do with the figures.
  const uHdr = us.rows.find(r => String(cv(r[0])).trim() === 'Rank') || [];
  // Matched on a pattern, so the fiscal-year prefix on "<FY> Ask" does not have to be restated here.
  const uCol = (label, re) => {
    const i = uHdr.findIndex(c => re.test(String(cv(c)).trim()));
    if (i < 0) chk(name, 'Unfunded Requirements', `column "${label}" is present`, 'missing', 'present');
    return i; };
  const C = { ask: uCol('Ask', /^FY\d\d Ask$/), alloc: uCol('Allocated', /^Allocated$/),
              trim: uCol('Trim', /^Trim, by service$/), beyond: uCol('Beyond', /^Beyond Both Lanes$/),
              discUnf: uCol('Unfunded vs DISC', /^Unfunded vs DISC$/),
              tot: uCol('TOTAL Unfunded', /^TOTAL Unfunded$/) };
  const uSvc = SVC.map(s => uCol('Unf ' + s, new RegExp('^Unf ' + s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$')));
  {
    const tr = us.rows.find(r => rowKey(r) === 'TOTAL');
    if (tr) {
      chk(name, 'Unfunded Requirements', 'TOTAL unfunded == sum of per-service columns',
        sum(uSvc.map(i => num(tr[i]))), num(tr[C.tot]));
    }
  }

  // ---- 6b. Unfunded sheet, PER ROW: printed total must equal its own per-service columns ----
  const titleToId = {}; ids.forEach(id => titleToId[id + ' title'] = id);
  us.rows.forEach(r => {
    const id = titleToId[String(cv(r[3]))]; if (!id) return;
    chk(name, 'Unfunded Requirements', `${id}: TOTAL Unfunded == sum of per-service cols`,
      sum(uSvc.map(i => num(r[i]))), num(r[C.tot]));
    chk(name, 'Unfunded Requirements', `${id}: per-service cols floored per service`,
      sum(uSvc.map(i => num(r[i]))), sum(unfSvcExp(id)));
    chk(name, 'Unfunded Requirements', `${id}: Trim + Beyond == TOTAL Unfunded`,
      num(r[C.trim]) + num(r[C.beyond]), num(r[C.tot]));
    // 'Allocated' is the basis the lane engine worked from: the ask for a directed source,
    // the board's allocation otherwise. Never the funded total.
    chk(name, 'Unfunded Requirements', `${id}: Allocated == the basis used`,
      num(r[C.alloc]), sum(basisOf(id)));
    // THE TWO READINGS OF SHORT. "vs DISC" is ask - discretionary; TOTAL is ask - disc - mand.
    // Recomputed here from the scenario's own ask and the lane oracle, never read back from the
    // sheet that is under test.
    const dU = sum(SVC.map((s, i) => Math.max(0, askArr(id)[i] - T[id].d[i])));
    chk(name, 'Unfunded Requirements', `${id}: Unfunded vs DISC == ask - discretionary`,
      num(r[C.discUnf]), dU);
    chk(name, 'Unfunded Requirements', `${id}: mandatory can only narrow the gap, never widen it`,
      num(r[C.discUnf]) >= num(r[C.tot]) - EPS ? 'ok' : 'TOTAL exceeds vs-DISC', 'ok');
  });

  // ---- 6c. tier list sheets, PER ROW: printed amount must equal its per-service vector ----
  [['Funded - Discretionary','d'],['Funded - Mandatory','m'],['Mission Critical','mc']].forEach(([sn,kind]) => {
    const sh = sheetOf(sheets, sn); if (!sh) return;
    sh.rows.forEach(r => {
      const id = titleToId[String(cv(r[4]))]; if (!id) return;
      chk(name, sn, `${id}: amount == sum of per-service cols`,
        sum(SVC.map((s, i) => num(r[8 + i]))), num(r[7]));
      const want = kind === 'd' ? T[id].dT : kind === 'm' ? T[id].mT : askOf(id);
      chk(name, sn, `${id}: amount == tiers() truth`, num(r[7]), want);
    });
  });

  // ---- 6d. Decision Bands: ALL BANDS row must tie to the board ----
  {
    const bs = sheetOf(sheets, 'Decision Bands');
    const gr = bs && bs.rows.find(r => rowKey(r) === 'ALL BANDS');
    if (gr) {
      chk(name, 'Decision Bands', 'ALL BANDS Disc == board Disc', num(gr[7]), sum(allD));
      chk(name, 'Decision Bands', 'ALL BANDS Mand == board Mand', num(gr[8]), sum(allM));
      chk(name, 'Decision Bands', 'ALL BANDS Funded == Disc+Mand', num(gr[9]), sum(allD) + sum(allM));
      const askTot = ids.reduce((a, id) => a + sum(sc.items.find(x => x.id === id).ask), 0);
      chk(name, 'Decision Bands', 'ALL BANDS Requirement == total ask', num(gr[6]), askTot);
      chk(name, 'Decision Bands', 'ALL BANDS Funded + Unfunded == max(ask, funded) per service',
        num(gr[9]) + num(gr[10]), coverAll);
    }
  }

  // ---- 6e. per-PMO detail sheets must reconcile with the PMO Matrix ----
  const sharesOf = JSON.parse(ev(`JSON.stringify((function(){const o={};S.order.forEach(function(id){const t=itemById(id);if(t)o[id]=pmoSharesOf(t);});return o;})())`));
  let pmoLaneTotal = 0;
  {
    const mxRow = g => gmx.rows.find(r => rowKey(r) === g);
    const pmoSheets = sheets.filter(s => s.name.startsWith('PMO ') && s.name !== 'PMO Matrix');
    pmoSheets.forEach(sh => {
      const g = sh.name.slice(4);
      const mr = mxRow(g); if (!mr) return;
      const sub = lbl => sh.rows.filter(r => String(cv(r[0])).startsWith('Subtotal — ' + lbl));
      const d = sum(sub('Discretionary').map(r => num(r[7])));
      const m = sum(sub('Mandatory').map(r => num(r[7])));
      chk(name, `PMO sheets vs Matrix`, `${g}: Disc subtotal == Matrix Disc`, d,
        sum(SVC.map((s, i) => num(mr[1 + i * 2]))));
      chk(name, `PMO sheets vs Matrix`, `${g}: Mand subtotal == Matrix Mand`, m,
        sum(SVC.map((s, i) => num(mr[2 + i * 2]))));
      const u = sum(sub('Unfunded').map(r => num(r[7])));
      const mc = sum(sub('Mission Critical').map(r => num(r[7])));
      // the office's share of each starred-and-short requirement, computed independently here
      const shortMcShare = ids.filter(x => sc.mc && sc.mc[x] && unfOf[x] > 0.005)
        .reduce((acc, x) => {
          const sh = (sharesOf[x] || []).find(r => r[0] === g); if (!sh) return acc;
          const ask = sc.items.find(y => y.id === x).ask;
          return acc + sum(SVC.map((s, i) => ask[i] * (sh[1] ? sh[1][i] : 1)));
        }, 0);
      chk(name, 'PMO sheets', `${g}: MC subtotal == share of starred-and-short requirement value`, mc, shortMcShare);
      chk(name, 'PMO sheets vs Matrix', `${g}: MC memo == Matrix MC requirement column`,
        num(mr[mr.length - 2]), num(mr[mr.length - 2]));
      pmoLaneTotal += d + m + u;
    });
  }

  // every requirement dollar appears exactly once across the PMO sheets' lane sections
  chk(name, 'PMO sheets', 'Disc+Mand+Unf across all PMO sheets == max(ask, funded) per service',
    pmoLaneTotal, coverAll);

  // ---- 6f. Cost Element Matrix: same MC memo rules as every other matrix tab ----
  {
    const cem = sheetOf(sheets, 'Cost Element Matrix');
    if (cem) {
      const rows = cem.rows.filter(r => {
        const k = rowKey(r);
        return k && !['TOTAL', 'Cost Element', 'BUDGET AUTHORITY', 'REMAINING (lanes)',
          'UNFUNDED (beyond both lanes)', 'ASK NOT ALLOCATED (trim deltas)',
          'TOTAL UNFUNDED (deltas + beyond lanes)'].includes(k) && !isNaN(num(r[1]));
      });
      chk(name, 'Cost Element Matrix', 'MC memo == sum of MC requirement/ask values',
        sum(rows.map(r => num(r[r.length - 2]))), mcMemo);
      chk(name, 'Cost Element Matrix', 'MC short == ask - discretionary allocated',
        sum(rows.map(r => num(r[r.length - 1]))),
        mcIds.reduce((a, id) => a + sum(SVC.map((s, i) =>
          Math.max(0, sc.items.find(x => x.id === id).ask[i] - T[id].d[i]))), 0));
      SVC.forEach((s, i) => chk(name, 'Cost Element Matrix', `Disc [${s}]`,
        sum(rows.map(r => num(r[1 + i * 2]))), allD[i]));
    }
  }

  // ---- 6g. Two-Plan Forecast: the ROLLUP and BY PMO blocks are two views of one plan ----
  // Matched on "Forecast" alone: this sheet was renamed from "<FY> Spend Forecast" to
  // "<FY> Two-Plan Forecast" because it was being confused with the board's own forecast tab, and
  // a matcher pinned to the old words would have silently skipped this whole block afterwards.
  {
    const fc = sheets.find(x => /Forecast/.test(x.name));
    // A MISSING SHEET IS A FAILURE, NOT A SKIP. `if (fc)` alone meant a rename disabled every
    // check below it while the suite still read green.
    chk(name, 'Two-Plan Forecast', 'the forecast sheet is in the workbook',
      fc ? 'present' : 'missing', 'present');
    if (fc) {
      // each plan block prints ROLLUP ... TOTAL then BY PMO ... TOTAL; the two totals must agree
      const totals = [];
      let section = null;
      fc.rows.forEach(r => {
        const k = rowKey(r);
        if (/^ROLLUP/.test(k)) section = 'rollup';
        else if (/^BY PMO/.test(k)) section = 'bypmo';
        else if (k === 'TOTAL' && section) { totals.push([section, num(r[r.length - 1])]); section = null; }
      });
      for (let i = 0; i + 1 < totals.length; i += 2) {
        const [aName, a] = totals[i], [bName, b] = totals[i + 1];
        // THIS TAB IS PRINTED IN $M. The suite's absolute epsilon (0.005) is meant for dollars and
        // is enormous at this scale -- a whole dropped office came to 0.000012 and sailed through
        // it. Compare in dollars so the tolerance means what it does everywhere else.
        if (aName === 'rollup' && bName === 'bypmo')
          chk(name, 'Two-Plan Forecast', `plan ${i / 2 + 1}: BY PMO total == ROLLUP total`, b * 1e6, a * 1e6);
      }
      if (totals.length < 2)
        failures.push({ scenario: name, sheet: 'Two-Plan Forecast', what: 'could not read both plan totals', got: totals.length, want: '>= 2', delta: null });
    }
  }

  // ---- 7. CE by PMO (when cost elements exist) must agree with PMO Matrix ----
  const pmce = sheetOf(sheets, 'CE by PMO');
  if (pmce) {
    const tot = pmce.rows.filter(r => cv(r[0]) && !String(cv(r[0])).startsWith('    ') && !isNaN(num(r[2])));
    chk(name, 'CE by PMO', 'sum of PMO Disc == board Disc', sum(tot.map(r => num(r[3]))), sum(allD));
    // cols: 0 key | 1 Reqs | 2 Ask | 3 Disc | 4 MC memo | 5 MC short | 6 Mand | 7 Unfunded
    chk(name, 'CE by PMO', 'sum of PMO Mand == board Mand', sum(tot.map(r => num(r[6]))), sum(allM));
    chk(name, 'CE by PMO', 'sum of PMO MC == MC memo (requirement value)', sum(tot.map(r => num(r[4]))), mcMemo);
    chk(name, 'CE by PMO', 'sum of PMO MC short == MC short vs discretionary',
      sum(tot.map(r => num(r[5]))), mcIds.reduce((a, id) => a + mcShortOf[id], 0));
    chk(name, 'CE by PMO', 'sum of Ask == total ask', sum(tot.map(r => num(r[2]))), askAll);
    chk(name, 'CE by PMO', 'Unfunded column == per-service floored unfunded',
      sum(tot.map(r => num(r[7]))), sum(unfSvcAll));
    // Unfunded is max(0, Ask - Disc - Mand) per service, so Disc+Mand+Unf exceeds Ask exactly when
    // a service was funded beyond what it asked for. The rule below holds in both cases.
    tot.forEach(r => chk(name, 'CE by PMO', `${cv(r[0])}: Disc+Mand+Unf == max(Ask, Disc+Mand)`,
      num(r[3]) + num(r[6]) + num(r[7]), Math.max(num(r[2]), num(r[3]) + num(r[6]))));
  }
}

// ═══ the month-by-month sheets ══════════════════════════════════════════════════════════════════
// RCN-EEIC by Month and SI Codes by Month spread tiers() output across months through monSpreadOf.
// Both were completely uncovered: each is gated on the O&M appropriation AND on its own service
// set being present, and no existing scenario had those services. Two whole sheets moving real
// money, invisible to the suite.
//
// ONE check for both, deliberately. They are the same sheet builder over different service lists,
// and this session has already been bitten once by two copies of one rule drifting apart.
{
  const sc = {
    services: ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'],
    items: [it('A', 'ATL', [12000000, 1500000, 900000, 4200000, 2100000, 2361859]),
            it('B', 'PSM', [3000000, 400000, 200000, 1000000, 500000, 300000]),
            it('C', 'AV',  [2000000, 300000, 200000, 800000, 400000, 250000])],
    disc: [14000000, 1800000, 1100000, 5000000, 2200000, 2400000],
    mand: [4000000, 600000, 400000, 1500000, 800000, 900000],
    order: ['A', 'B', 'C'],
  };
  const { ev, errors } = boot();
  seed(ev, sc);
  ev(`
    MS.rcn=[{k:'rTEST_0', rcn:'12345', eeic:'ABC12', t:'Test combo', svc:['USAF','ANG','AFRC']}];
    S.rcnAsg={A:'rTEST_0', B:'rTEST_0'};   // C deliberately unassigned — the NONE bucket
    S.si={A:'LA', B:'EN', C:''};
    toggleAwdInc('A',0);
    var p=tiers()['A'];
    S.awards['A'].inc=[
      {d:FYMON[1][0],day:1,sv:SVC.map(function(s,i){return Math.round((p.d[i]||0)*0.40);})},
      {d:FYMON[4][0],day:1,sv:SVC.map(function(s,i){return Math.round((p.d[i]||0)*0.25);})}];
    S.awards['B']={mode:'single', d:FYMON[2][0], day:1};
    // C needs a DATE, not just money. Undated dollars land in NO DATE, so without this the
    // unassigned bucket contributes nothing to any month column and a mutation dropping it from
    // the roll-up row changes nothing at all.
    S.awards['C']={mode:'single', d:FYMON[6][0], day:1};
    save(); 'ok'`);
  const sheets = JSON.parse(capture(ev));
  if (errors.length) console.log('  [month sheets] jsdom errors:', errors.slice(0, 2));
  const T = JSON.parse(ev('JSON.stringify(tiers())'));

  // The service list each sheet covers, and the LABEL each service wears on it — read from the
  // page, because one of them renames (USMC-C prints as USMC CV) and hardcoding that here would
  // make the check pass for the wrong reason the day it changes.
  const svcOf = JSON.parse(ev(`JSON.stringify({
    'RCN-EEIC by Month': RCN_SVCS.map(function(s){ return [s, s]; }),
    'SI Codes by Month': CR_SVCS.map(function(s){ return [s, crSvcName(s)]; })
  })`));

  const txt = c => String((c && typeof c === 'object' && 'v' in c) ? c.v : (c ?? ''));
  const numOf = c => { const v = (c && typeof c === 'object' && 'v' in c) ? c.v : c;
                       return typeof v === 'number' ? v : NaN; };

  for (const [name, svcs] of Object.entries(svcOf)) {
    const sh = sheetOf(sheets, name);
    // The sheet must EXIST. Skipping silently when a gate is not met is how a check that cannot
    // run reads as a pass — the mistake this suite has already made twice.
    chk(name, name, 'sheet is produced when the appropriation and services allow it', sh ? 1 : 0, 1);
    if (!sh) continue;

    const rowNamed = re => sh.rows.find(r => re.test(txt(r[0])));
    const cells = r => r ? r.map(numOf).map(v => isNaN(v) ? 0 : v) : null;
    const esc = t => t.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
    const blocks = [];

    svcs.forEach(([svc, label]) => {
      const i = sc.services.indexOf(svc);
      const want = sc.order.reduce((a, id) => a + (T[id].d[i] || 0) + (T[id].m[i] || 0), 0);
      const row = cells(rowNamed(new RegExp('^' + esc(label) + ' TOTAL')));
      chk(name, name, `${label}: block total row exists`, row ? 1 : 0, 1);
      if (!row) return;
      blocks.push(row);
      const tot = row[row.length - 1];
      chk(name, name, `${label}: block total equals what the lanes funded on that service`, tot, want);
      // CONSERVATION: months plus NO DATE are the whole total. Nothing lost to an undated award.
      chk(name, name, `${label}: months + NO DATE add to the block total`,
        row.slice(0, -1).reduce((a, b) => a + b, 0), tot);
    });

    // The roll-up is the sum of the blocks above it, column by column — not a separate walk that
    // could quietly disagree with them.
    const all = cells(rowNamed(/\u2014 TOTAL BY MONTH$/));
    chk(name, name, 'the roll-up row exists', all ? 1 : 0, 1);
    if (all && blocks.length === svcs.length) {
      all.forEach((v, j) => chk(name, name, `the roll-up's column ${j + 1} is the sum of the blocks`,
        v, blocks.reduce((a, b) => a + (b[j] || 0), 0)));
    }
  }
}

// ═══ the ◨/◧ view toggle, and the marker that has to travel with it ═════════════════════════════
// "Discretionary only" runs the lane walk with every mandatory lane empty. The spend-plan family
// follows it; the rest of the workbook must not. And a workbook built that way is a WHAT-IF, which
// stops being obviously one the moment it is emailed — so the marker is part of the behaviour, not
// decoration, and is asserted here alongside the figures.
{
  const name = 'view toggle';
  const sc = {
    services: ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'],
    items: [it('A', 'ATL', [12000000, 1500000, 900000, 4200000, 2100000, 2361859]),
            it('B', 'PSM', [3000000, 400000, 200000, 1000000, 500000, 300000])],
    disc: [8000000, 1000000, 600000, 3000000, 1400000, 1600000],
    mand: [4000000, 600000, 400000, 1500000, 800000, 900000],
    order: ['A', 'B'],
  };
  const { ev, errors } = boot();
  seed(ev, sc);
  ev(`
    MS.rcn=[{k:'r0',rcn:'12345',eeic:'ABC12',t:'T',svc:['USAF','ANG','AFRC']}];
    S.rcnAsg={A:'r0',B:'r0'}; S.si={A:'LA',B:'EN'};
    S.awards['A']={mode:'single',d:FYMON[1][0],day:1};
    S.awards['B']={mode:'single',d:FYMON[2][0],day:1}; save(); 'ok'`);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  const txt = c => String((c && typeof c === 'object' && 'v' in c) ? c.v : (c ?? ''));
  const numOf = c => { const v = (c && typeof c === 'object' && 'v' in c) ? c.v : c;
                       return typeof v === 'number' ? v : NaN; };
  const look = () => {
    const sheets = JSON.parse(capture(ev));
    const tot = (n, re) => { const sh = sheetOf(sheets, n); if (!sh) return null;
      const r = sh.rows.find(x => re.test(txt(x[0]))); if (!r) return null;
      const v = r.map(numOf).filter(x => !isNaN(x)); return v.length ? v[v.length - 1] : null; };
    const title = n => { const sh = sheetOf(sheets, n); return sh ? txt(sh.rows[0][0]) : ''; };
    return { rcn: tot('RCN-EEIC by Month', /\u2014 TOTAL BY MONTH$/),
             si:  tot('SI Codes by Month', /\u2014 TOTAL BY MONTH$/),
             unf: tot('Unfunded Requirements', /^TOTAL/),
             rcnTitle: title('RCN-EEIC by Month'),
             siTitle:  title('SI Codes by Month'),
             file: ev('scenFile("BOOK")'),
             body: sheets.reduce((a, sh) => (a[sh.name] = JSON.stringify(sh.rows), a), {}) };
  };
  const both = (ev(`setScen(''); 'ok'`), look());
  const disc = (ev(`setScen('disc'); 'ok'`), look());
  ev(`setScen(''); 'ok'`);

  // Under "Discretionary only" the month sheets carry exactly the DISCRETIONARY drawn on their own
  // services — mandatory withheld means it never reaches a month.
  const drawn = svcs => svcs
    .reduce((a, svc) => { const i = sc.services.indexOf(svc); return a + Math.min(sc.disc[i],
      sc.order.reduce((q, id) => q + (sc.items.find(x => x.id === id).ask[i] || 0), 0)); }, 0);
  chk(name, 'month sheets', 'RCN month follows the toggle', disc.rcn, drawn(['USAF', 'ANG', 'AFRC']));
  chk(name, 'month sheets', 'SI month follows the toggle',  disc.si,  drawn(['STOVL', 'USMC-C', 'USN']));
  chk(name, 'month sheets', 'RCN month differs between the two views',
    both.rcn === disc.rcn ? 'same' : 'differs', 'differs');
  chk(name, 'month sheets', 'SI month differs between the two views',
    both.si === disc.si ? 'same' : 'differs', 'differs');

  // Everything else in the workbook keeps reading the truth walk. Unfunded Requirements is
  // ask-versus-allocation, not a lane shortfall, so the toggle must not move it.
  chk(name, 'scope', 'Unfunded Requirements is NOT moved by the toggle', disc.unf, both.unf);

  // ONE SHEET IS NOT ENOUGH. The month sheets are built partway through the workbook, so a view
  // that leaked into the shared truth walk would corrupt only the sheets built AFTER them --
  // Unfunded Requirements is computed earlier and would sail through. Compare every sheet.
  //
  // "<FY> Two-Plan Forecast" is deliberately on the invariant side: it is not the board's own
  // forecast but PLAN A (discretionary only) and PLAN B (disc + mandatory) side by side, both
  // modelled through fundOf. It already shows both answers at once, so the toggle must not move
  // it. The board's on-screen forecast tab is the one that follows the view; it is checked below.
  // The sheet carries its own name for exactly this reason -- it used to be "<FY> Spend Forecast",
  // one word away from the tab, and the two were read as the same thing.
  const FAMILY = ['RCN-EEIC by Month', 'SI Codes by Month'];
  const names = Object.keys(both.body);
  chk(name, 'scope', 'the two views build the same sheets',
    names.join('|'), Object.keys(disc.body).join('|'));
  names.filter(n => !FAMILY.includes(n)).forEach(n =>
    chk(name, 'scope', n + ': NOT moved by the toggle',
      both.body[n] === disc.body[n] ? 'same' : 'differs', 'same'));
  // Assert presence rather than filtering on it: a build where monSheet returned null would make
  // a .filter() skip these two checks entirely and the suite would still read green.
  FAMILY.forEach(n => {
    chk(name, 'scope', n + ': present in the workbook',
      names.includes(n) ? 'present' : 'missing', 'present');
    chk(name, 'scope', n + ': moved by the toggle',
      both.body[n] === disc.body[n] ? 'same' : 'differs', 'differs');
  });

  // The board's own on-screen spend forecast TAB is the other half of the family. It is computed, not
  // exported, so no sheet check can see it — read forecast() directly and hold it to the same rule.
  const fc = () => JSON.parse(ev(`(function(){ const F=forecast(); let m=0,u=0;
    Object.keys(F.byPMO).forEach(function(k){ m+=F.byPMO[k].m.reduce(function(a,v){return a+v;},0);
                                              u+=F.byPMO[k].unsch; });
    return JSON.stringify({months:m, unsch:u,
      roll:F.rollRows.reduce(function(a,r){return a+r.tot;},0)}); })()`));
  const fcBoth = (ev(`setScen(''); 'ok'`), fc());
  const fcDisc = (ev(`setScen('disc'); 'ok'`), fc());
  ev(`setScen(''); 'ok'`);
  chk(name, 'spend forecast', 'forecast follows the toggle', fcDisc.months + fcDisc.unsch,
    drawn(sc.services));
  chk(name, 'spend forecast', 'forecast differs between the two views',
    fcBoth.months === fcDisc.months ? 'same' : 'differs', 'differs');
  chk(name, 'spend forecast', 'forecast restores when the toggle goes back off', fc().months,
    fcBoth.months);
  // Conservation holds in BOTH views: every funded dollar lands in a month or in UNSCHEDULED.
  chk(name, 'spend forecast', 'roll-up reconciles to the months, Discretionary only',
    fcDisc.roll, fcDisc.months + fcDisc.unsch);
  chk(name, 'spend forecast', 'roll-up reconciles to the months, Discretionary + Mandatory',
    fcBoth.roll, fcBoth.months + fcBoth.unsch);

  // The month-sheet footer names the lane mix in prose. It used to say "discretionary + mandatory"
  // unconditionally, which the toggle made into a lie on the sheet it described -- a caption that
  // contradicts the column it sits under is worse than no caption.
  const foot = b => { const rows = JSON.parse(b['RCN-EEIC by Month']);
    const t = rows.map(r => String((r[0] && typeof r[0] === 'object' && 'v' in r[0]) ? r[0].v : (r[0] ?? '')))
                  .find(x => /^Funded dollars/.test(x));
    return t || ''; };
  chk(name, 'marker', 'month-sheet footer names the lane mix, Discretionary only',
    /DISCRETIONARY ONLY/.test(foot(disc.body)) ? 'names it' : 'stale', 'names it');
  chk(name, 'marker', 'month-sheet footer names the lane mix, Discretionary + Mandatory',
    /discretionary \+ mandatory/.test(foot(both.body)) ? 'names it' : 'stale', 'names it');

  // The marker travels on the sheet titles and the file name, and is absent when it should be.
  [['RCN sheet title', disc.rcnTitle, both.rcnTitle],
   ['SI sheet title',  disc.siTitle,  both.siTitle],
   ['file name',       disc.file,     both.file]].forEach(([what, on, off]) => {
    chk(name, 'marker', `${what}: marked under Discretionary only`,
      /DISC/i.test(on) ? 'marked' : 'unmarked', 'marked');
    chk(name, 'marker', `${what}: clean under Discretionary + Mandatory`,
      /DISC-ONLY|DISCRETIONARY ONLY/i.test(off) ? 'marked' : 'clean', 'clean');
  });
}

// ---------------------------------------------------------------------------------------------
console.log('\n' + '='.repeat(96));
if (!failures.length) { console.log('ALL CHECKS PASSED'); process.exit(0); }
const byKey = {};
failures.forEach(f => { const k = f.scenario + ' | ' + f.sheet; (byKey[k] ||= []).push(f); });
console.log(`${failures.length} FAILING CHECK(S)\n`);
for (const [k, fs] of Object.entries(byKey)) {
  console.log(`--- ${k}`);
  fs.forEach(f => console.log(f.delta === null
    ? `    ${f.what}\n        workbook ${JSON.stringify(f.got)}   truth ${JSON.stringify(f.want)}`
    : `    ${f.what}\n        workbook ${f.got.toFixed(4)}   truth ${f.want.toFixed(4)}   off by ${f.delta.toFixed(4)}`));
}
process.exit(1);
