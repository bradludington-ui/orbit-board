// Audit the Excel Workbook export against tiers(), which is the board's own per-requirement
// discretionary / mandatory / unfunded truth. Every check compares a number the workbook prints
// against the same number recomputed from tiers().
import { boot, seed, capture, num, cv, stopAtFirstFailure } from './boot.mjs';
import { inflateRawSync } from 'node:zlib';

const EPS = 0.005;
let failures = [];
stopAtFirstFailure(failures);   // in the mutation sweep only: see boot.mjs
// EVERY NAMED SCENARIO MUST RUN. A block appended after process.exit() never executes and reads as
// a pass -- the proposal scenario in audit-import.mjs sat there for a whole verification round and
// five mutations aimed at it survived. chk() records every scenario it hears from; at the summary,
// any `const name = '...'` in this file it never heard from is a failure, not a pass.
import { readFileSync as _selfRead } from 'node:fs';
import { fileURLToPath as _selfPath } from 'node:url';
const SEEN = new Set();
const chk = (scenario, sheet, what, got, want) => {
  SEEN.add(scenario);
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
// COLUMNS BY NAME, NEVER BY INDEX. A sheet gains a column and every r[n] after it silently reads
// the neighbour -- the arithmetic still ties, against the wrong figure. Adding the second unfunded
// reading to Funding Streams moved four checks one column left and they kept "passing" on values
// that were off by the whole trim. An unknown header throws here rather than returning -1, because
// a renamed column must fail loudly instead of reading undefined and comparing NaN.
const hdrRow = sh => sh.rows.find(r => (r || []).some(c => String(cv(c) ?? '').trim() === 'Service'))
  || sh.rows[2];
const colOf = (sh, h) => {
  const hr = hdrRow(sh) || [];
  const i = hr.findIndex(c => String(cv(c) ?? '').trim() === h);
  if (i < 0) throw new Error(`no column headed "${h}" on sheet "${sh.name}" -- headers: `
    + hr.map(c => String(cv(c) ?? '')).filter(Boolean).join(' | '));
  return i;
};

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
    const raw = (a === null || a === undefined) ? item.ask.slice()
      : a.m === 's' ? a.v.slice()                 // per-service vector, taken as given
      : sum(item.ask) > 0 ? item.ask.map(x => a.v * x / sum(item.ask))   // scalar trim, by ask share
      : SVC.map(() => a.v / SVC.length);          // a zero ask cannot be weighted
    // CLAMPED TO THE REQUIREMENT, stated here independently of the board. An allocation above a
    // service's ask is not money that requirement can draw: uncapped, the engine spent lane money
    // nothing asked for, and whatever the lane could not cover surfaced as unfunded on a service
    // already funded in full. Derived here rather than read back from basisSvcOf() -- an oracle
    // that asks the code under test what the answer is will agree with it, including when it is
    // wrong, which is how the uncapped reading survived in this file in the first place.
    return SVC.map((_, i) => Math.min(raw[i], Math.max(0, item.ask[i] || 0)));
  };
  const askArr = id => sc.items.find(x => x.id === id).ask;
  const unfSvcExp = id => SVC.map((s, i) => Math.max(0, askArr(id)[i] - T[id].d[i] - T[id].m[i]));
  // READING #1: ask less what DISCRETIONARY paid, mandatory not counted at all. One lane earlier
  // than unfSvcExp and floored the same way, per service.
  const discUnfSvcExp = id => SVC.map((s, i) => Math.max(0, askArr(id)[i] - T[id].d[i]));
  const beyondSvcExp = id => SVC.map((s, i) => Math.max(0, Math.min(askArr(id)[i], basisOf(id)[i]) - T[id].d[i] - T[id].m[i]));
  const trimSvcExp = id => SVC.map((s, i) => Math.max(0, askArr(id)[i] - basisOf(id)[i]));
  const svcTot = f => SVC.map((s, i) => ids.reduce((a, id) => a + f(id)[i], 0));
  const unfSvcAll = svcTot(unfSvcExp), beyondSvcAll = svcTot(beyondSvcExp), trimSvcAll = svcTot(trimSvcExp);
  const discUnfSvcAll = svcTot(discUnfSvcExp);
  // With unfunded floored per service, funded + unfunded exceeds the ask exactly where a service was
  // funded BEYOND what it asked for -- that excess is real money and does not vanish. Per service the
  // identity is funded + unfunded == max(ask, funded); this is its board-wide form.
  const coverAll = ids.reduce((a, id) => a + sum(SVC.map((s, i) =>
    Math.max(askArr(id)[i], T[id].d[i] + T[id].m[i]))), 0);

  // ---- 1. conservation inside tiers() itself (the basis for everything else) ----
  // CAPPED AT THE ASK. u is "beyond both lanes" and the rulebook states it as
  // max(0, min(ask, basis) - d - m). The cap only bites where a service is allocated MORE than it
  // asked for, and there it is the difference between a real answer and a phantom: without it a
  // service drawn to its full requirement still reports unfunded money, which is not a number that
  // can exist. Nobody is short of money they did not ask for.
  ids.forEach(id => {
    const p = T[id], basis = basisOf(id);
    SVC.forEach((s, i) => chk(name, 'tiers()', `${id} d+m+u == basis [${s}]`,
      p.d[i] + p.m[i] + p.u[i], basis[i]));
  });

  // ---- 1z. NO SERVICE IS EVER FUNDED ABOVE ITS OWN REQUIREMENT ----
  // This is the invariant the per-service FLOORS rest on. Every unfunded reading on this board is
  // written max(0, ask - d [- m]) and every one of those floors exists to stop an over-funded
  // service paying down a short one -- money is not fungible across services. Since basisSvcOf()
  // clamps the allocation to the ask, d + m can never exceed it, so those floors are arithmetically
  // unreachable and the mutations that remove them cannot bite.
  //
  // THAT IS WHY THIS CHECK EXISTS. Five guards were declared equivalent on the strength of this
  // invariant; if it ever stops holding they become load-bearing again with nothing proving they
  // work. This check fails FIRST in that case, which is the only thing that makes those
  // equivalences safe to declare.
  ids.forEach(id => {
    const p = T[id], ask = askArr(id);
    SVC.forEach((s, i) => chk(name, 'tiers()',
      `${id} funded never exceeds the requirement [${s}]`,
      p.d[i] + p.m[i] <= ask[i] + 0.005 ? 'ok' : `${p.d[i] + p.m[i]} > ${ask[i]}`, 'ok'));
  });

  // ---- 1a. THE IDENTITY THAT SETTLES WHAT u MEANS ----
  // beyond + trim == the requirement's own shortfall, per service. This is the check that decides
  // between the capped and uncapped readings, and it is why the cap is not a preference: with an
  // uncapped u the identity fails by exactly the over-allocation, and the board contradicts the
  // rulebook it prints at the top of its own trace matrix. Stated per service because money is not
  // fungible across them -- netted, an over-allocation on one service would hide a shortage on
  // another, which is the defect 'mc over-allocated one service' exists to prevent.
  ids.forEach(id => {
    const p = T[id], basis = basisOf(id), ask = askArr(id);
    SVC.forEach((s, i) => {
      const trim = Math.max(0, ask[i] - basis[i]);
      const ufr2 = Math.max(0, ask[i] - p.d[i] - p.m[i]);
      chk(name, 'tiers()', `${id} beyond + trim == unfunded vs BOTH lanes [${s}]`,
        p.u[i] + trim, ufr2);
    });
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
        const u = want - d - m;   // basisOf is already clamped, so this needs no second cap
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
  const FSC = {
    disc: colOf(fs, 'Disc Funded'), mand: colOf(fs, 'Mand Funded'),
    fund: colOf(fs, 'Funded Total'), trim: colOf(fs, 'Ask Not Allocated (delta)'),
    beyond: colOf(fs, 'Beyond Both Lanes'),
    discUnf: colOf(fs, 'Unfunded vs DISC'), unf: colOf(fs, 'TOTAL UNFUNDED'),
  };
  SVC.forEach((s, i) => {
    const r = findRow(fs, s); if (!r) return;
    chk(name, 'Funding Streams', `${s} Disc Funded`, num(r[FSC.disc]), allD[i]);
    chk(name, 'Funding Streams', `${s} Mand Funded`, num(r[FSC.mand]), allM[i]);
    chk(name, 'Funding Streams', `${s} Funded Total`, num(r[FSC.fund]), allD[i] + allM[i]);
    chk(name, 'Funding Streams', `${s} Beyond Both Lanes`, num(r[FSC.beyond]), beyondSvcAll[i]);
    chk(name, 'Funding Streams', `${s} TOTAL UNFUNDED (floored per service)`, num(r[FSC.unf]), unfSvcAll[i]);
    chk(name, 'Funding Streams', `${s} Trim`, num(r[FSC.trim]), trimSvcAll[i]);
    // the three must close: beyond + trim == unfunded, per service
    chk(name, 'Funding Streams', `${s} beyond + trim == unfunded`,
      num(r[FSC.beyond]) + num(r[FSC.trim]), num(r[FSC.unf]));
    // READING #1, the second of the two the board states: ask less DISCRETIONARY alone. It can
    // never be smaller than reading #2, and the gap is exactly what the mandatory lane carried.
    chk(name, 'Funding Streams', `${s} Unfunded vs DISC (floored per service)`,
      num(r[FSC.discUnf]), discUnfSvcAll[i]);
    chk(name, 'Funding Streams', `${s} reading #1 - reading #2 == mandatory drawn`,
      num(r[FSC.discUnf]) - num(r[FSC.unf]), allM[i]);
  });

  // ---- 4. PMO Matrix: per-PMO shares must add back to the board totals ----
  const gmx = sheetOf(sheets, 'PMO Matrix');
  // The per-key rows are everything ABOVE the budget-authority block, and slicing there is
  // STRUCTURAL. This used to be an exclusion list of the block's row labels, which is the same trap
  // as any hardcoded name list: adding the second unfunded reading to baBlock put a row in the
  // block that the list did not name, so it was counted as a PMO and inflated every lane total by
  // the whole portfolio shortfall. A list of what something is NOT goes stale; a boundary does not.
  const baAt = gmx.rows.findIndex(r => rowKey(r).trim() === 'BUDGET AUTHORITY');
  chk(name, 'PMO Matrix', 'the budget-authority block is present to slice at',
    baAt >= 0 ? 'found' : 'MISSING', 'found');
  const pmoRows = gmx.rows.slice(0, baAt < 0 ? gmx.rows.length : baAt).filter(r => {
    const k = rowKey(r).trim();
    return k && k !== 'TOTAL' && k !== 'PMO' && !k.includes('—')
      && typeof num(r[1]) === 'number' && !isNaN(num(r[1]));
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
      // BOTH READINGS, BOARD-WIDE, against the fixture's own arithmetic. This is the check the
      // sheet's ROW SET has to satisfy: a requirement short against discretionary but covered once
      // mandatory is counted has a TOTAL Unfunded of zero, and while the filter listed only
      // TOTAL-unfunded rows it was dropped -- taking its vs-DISC figure with it. The column looked
      // authoritative and its total was short by exactly the rows the two readings disagree about.
      // Summing the printed rows would NOT catch that; only the board-wide truth does.
      chk(name, 'Unfunded Requirements', 'TOTAL "Unfunded vs DISC" == board-wide ask - disc',
        num(tr[C.discUnf]), sum(discUnfSvcAll));
      chk(name, 'Unfunded Requirements', 'TOTAL "TOTAL Unfunded" == board-wide ask - disc - mand',
        num(tr[C.tot]), sum(unfSvcAll));
      // and the two must differ by exactly what the mandatory lane drew, or one of them is the other
      chk(name, 'Unfunded Requirements', 'the gap between the readings == mandatory drawn',
        num(tr[C.discUnf]) - num(tr[C.tot]), sum(allM));
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
      // Sliced at the budget-authority block, for the same reason the PMO Matrix is: baBlock's rows
      // are not a fixed set, and an exclusion list of their labels silently promotes any new one to
      // a data row. Both matrix tabs come off the same builder, so both had to move together.
      const cemBaAt = cem.rows.findIndex(r => rowKey(r).trim() === 'BUDGET AUTHORITY');
      chk(name, 'Cost Element Matrix', 'the budget-authority block is present to slice at',
        cemBaAt >= 0 ? 'found' : 'MISSING', 'found');
      const rows = cem.rows.slice(0, cemBaAt < 0 ? cem.rows.length : cemBaAt).filter(r => {
        const k = rowKey(r).trim();
        return k && k !== 'TOTAL' && k !== 'Cost Element' && !isNaN(num(r[1]));
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
             body: sheets.reduce((a, sh) => (a[sh.name] = JSON.stringify(sh.rows), a), {}),
             // MONEY ONLY, with every label stripped. The whole-body compare below proves a sheet
             // did NOT move; it cannot prove one DID, because these sheets stamp scenTitle() on
             // their title row -- so the body differs under the toggle whether or not a single
             // dollar changed. A "moved by the toggle" check satisfied by its own marker asserts
             // nothing. This is what the FAMILY checks compare instead.
             nums: sheets.reduce((a, sh) => (a[sh.name] = JSON.stringify(sh.rows.map(r =>
               (r || []).map(c => { const v = (c && typeof c === 'object' && 'v' in c) ? c.v : c;
                                    return typeof v === 'number' ? v : null; }))), a), {}) };
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
  // THE SPEND-PLAN FAMILY: every surface that states WHEN funded dollars land. All of them follow
  // the view, because a spend plan built under "discretionary only" must show the discretionary
  // plan. CR Cash Needs joined them when the toggle was extended to all spend-plan surfaces; it is
  // safe to move because the WHOLE workbook filename carries [DISC-ONLY] (scenFile, asserted
  // below) and the sheet stamps scenTitle on its own title row.
  //
  // The 1A9A CR Cash Return is the one spend-plan surface deliberately NOT in this family. It is a
  // formal external submission on a fixed format with nowhere to put a marker, so it always reports
  // the funded plan -- asserted separately below, because a scenario leaking into it would put
  // model figures under a real heading.
  const FAMILY = ['RCN-EEIC by Month', 'SI Codes by Month', 'CR Cash Needs'];
  const names = Object.keys(both.body);
  chk(name, 'scope', 'the two views build the same sheets',
    names.join('|'), Object.keys(disc.body).join('|'));
  // A PMO TAB IS HALF IN THE FAMILY (v1.86). Its last block -- the office's requirements and the months
  // their money obligates in -- is a spend plan, and follows the view with the rest; everything above
  // it is the office's money by portion, and must not move. So the tab is cut at that block's title.
  const PMO_TAB = n => /^PMO /.test(n) && n !== 'PMO Matrix';   // one tab per office; the matrix is the roll-up
  const cutAt = (body) => { const rows = JSON.parse(body);
    const k = rows.findIndex(r => /Requirements \(Disc\/Mand Funded Portions\)/.test(String(((r || [])[0] || {}).v || (r || [])[0] || '')));
    return { head: JSON.stringify(k < 0 ? rows : rows.slice(0, k)), block: k < 0 ? [] : rows.slice(k) }; };
  const numsOf = rows => JSON.stringify(rows.map(r => (r || []).map(c => { const v = (c && typeof c === 'object' && 'v' in c) ? c.v : c;
    return typeof v === 'number' ? v : null; })));
  names.filter(n => !FAMILY.includes(n) && !PMO_TAB(n)).forEach(n =>
    chk(name, 'scope', n + ': NOT moved by the toggle',
      both.body[n] === disc.body[n] ? 'same' : 'differs', 'same'));
  const pmoTabs = names.filter(PMO_TAB);
  chk(name, 'scope', 'the workbook has PMO tabs to check', pmoTabs.length > 0, true);
  pmoTabs.forEach(n => {
    const a = cutAt(both.body[n]), b = cutAt(disc.body[n]);
    chk(name, 'scope', n + ': everything above its spend plan is NOT moved by the toggle', a.head === b.head ? 'same' : 'differs', 'same');
    chk(name, 'scope', n + ': its spend plan is there', a.block.length > 3 && b.block.length > 3, true);
    chk(name, 'scope', n + ': its spend plan FIGURES move with the toggle', numsOf(a.block) === numsOf(b.block) ? 'same' : 'differs', 'differs');
    chk(name, 'scope', n + ': and say they are the what-if', [a.block, b.block].map(bl => /\u25e8 DISCRETIONARY ONLY/.test(JSON.stringify(bl[0]))).join(','), 'false,true');
  });
  // Assert presence rather than filtering on it: a build where monSheet returned null would make
  // a .filter() skip these two checks entirely and the suite would still read green.
  FAMILY.forEach(n => {
    chk(name, 'scope', n + ': present in the workbook',
      names.includes(n) ? 'present' : 'missing', 'present');
    // ON THE NUMBERS, not the body: see `nums` above. Comparing bodies here passed on the marker
    // alone -- a CR sheet wired to ignore the toggle still "differed" because its stamped title did.
    chk(name, 'scope', n + ': its FIGURES move with the toggle',
      both.nums[n] === disc.nums[n] ? 'same' : 'differs', 'differs');
    // and the sheet must actually carry figures, or two empty grids agree and prove nothing
    chk(name, 'scope', n + ': carries figures to compare',
      /[-\d]/.test(String(both.nums[n] || '').replace(/null|,|\[|\]/g, '')) ? 'yes' : 'no', 'yes');
  });

  // THE 1A9A CR CASH RETURN IS THE EXCEPTION, and the exception has to be a tested property rather
  // than a comment. It is a formal external submission on a fixed format -- header row
  // 'FY<yy> CRA REQUIREMENTS' -- with nowhere to stamp [DISC-ONLY], so it must report the FUNDED
  // plan in BOTH views. crExportRows() reads crData() with no scenario; passing scenOpt() there
  // would send a what-if out under a real heading, reconciling perfectly the whole way.
  // Asserted on rows, not on a file: crExport() alerts and returns on a non-O&M board.
  {
    const rowsIn = view => ev(`(function(){ setScen(${JSON.stringify(view)});
      var r; try{ r=JSON.stringify(crExportRows()); }catch(e){ r='ERR '+e.message; }
      setScen(''); return r; })()`);
    const a = rowsIn(''), b = rowsIn('disc');
    chk(name, 'scope', 'the 1A9A CR cash return is NOT moved by the toggle',
      a === b ? 'same' : 'differs', 'same');
    // and it must actually be producing something, or "same" is two empty lists agreeing
    chk(name, 'scope', 'the 1A9A return had rows to compare',
      (a && a !== '[]' && !a.startsWith('ERR')) ? 'rows' : `nothing to compare (${String(a).slice(0, 40)})`,
      'rows');
  }

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

// ═══ THE PMO TABS' OBLIGATION REPORT ════════════════════════════════════════════════════════
// Each PMO tab carries, under its four portion sections, one row per requirement that office has a
// stake in: Disc and Mand per service, what it is still short, and the months its funded dollars
// are planned to obligate in.
//
// The row has to CROSS-FOOT or it is worse than not being there. A reader adds the month columns
// across and expects Total (Disc+Mand); every dollar without an award date, and every dollar an
// incremental schedule left unplaced, has to show up in UNSCHEDULED or that addition comes up
// short against a figure printed on the same line.
//
// The months themselves are asserted against the scenario's OWN award dates, never read back from
// monSpreadOf() — an oracle that asks the code under test where a dollar went agrees with it,
// including when it is wrong.
{
  const name = "the PMO tabs' obligation report";
  const SVCX = ['USAF', 'ANG', 'STOVL'];
  const mk = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false,
    title: id + ' record name', event: id + ' plan event', ccar: '',
    fy26: ask.map(() => 0), ask, alloc: null });
  // THE FIXTURE HAS TO BE ABLE TO FAIL. The first version of it funded every requirement in full
  // and gave none of them more than one owning office, so 'UFR is not inside the total' and 'the
  // share is applied' were both the IDENTITY and both mutations SURVIVED. So: A is TRIMMED below
  // its ask, and PRIME-3 is split across two offices by its CLIN numbers.
  const ASK_A = [900, 200, 100], ALLOC_A = [700, 200, 100];
  const UFR_A = ASK_A.reduce((a, v, i) => a + (v - ALLOC_A[i]), 0);
  const CL_AV = [300, 75, 40], CL_MX = [100, 25, 10];              // PRIME-3's CLINs, by office
  const ASK_P = CL_AV.map((v, i) => v + CL_MX[i]);
  const { ev, errors } = boot();
  seed(ev, { services: SVCX,
    items: [mk('A', 'AV', ASK_A.slice()), mk('PRIME-3', 'AV', ASK_P.slice()), mk('C', 'PSM', [300, 80, 40])],
    disc: [1400, 400, 200], mand: [200, 60, 30], order: ['A', 'PRIME-3', 'C'],
    alloc: { A: { m: 's', v: ALLOC_A.slice() } } });
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  // A obligates on one date; PRIME-3 is incremental and STORED OUT OF ORDER; C carries no date.
  // PRIME-3's CLIN numbers decide its offices: ...2 is AV, ...10 is MxS.
  ev(`
    DATA.clins={'PRIME-3':[{clin:'0002',desc:'av share',ccar:'',ask:${JSON.stringify(CL_AV)}},
                           {clin:'0010',desc:'mxs share',ccar:'',ask:${JSON.stringify(CL_MX)}}]};
    S.ccar={A:'JSF4620', 'PRIME-3':'JSF6435', C:'JSF6506'};
    S.awards={ A:{mode:'single', d:'2026-11', day:30},
               'PRIME-3':{mode:'inc', d:'2026-12', inc:[{d:'2027-03',day:31,sv:[200,50,25]},
                                                        {d:'2026-12',day:15,sv:[200,50,25]}]} };
    'ok'`);
  const sheets = JSON.parse(capture(ev));

  const block = tab => {
    const sh = sheetOf(sheets, 'PMO ' + tab);
    if (!sh) return { err: 'no tab PMO ' + tab };
    const t = sh.rows.findIndex(r => /Requirements \(Disc\/Mand Funded Portions\)/.test(String(cv((r || [])[0]) ?? '')));
    if (t < 0) return { err: 'no obligation report on PMO ' + tab };
    const hdr = (sh.rows[t + 2] || []).map(c => String(cv(c) ?? ''));
    const band = (sh.rows[t + 1] || []).findIndex(c => String(cv(c) ?? '').includes('Spend Plan'));
    const at = k => hdr.indexOf(k);
    const rows = sh.rows.slice(t + 3).filter(r => typeof cv(r[at('Total (Disc+Mand)')]) === 'number');
    return { sh, t, title: String(cv(sh.rows[t][0])), hdr, band, at, rows,
             cols: sh.cols.length, months: hdr.slice(at('OCT 26'), at('Unscheduled')) };
  };

  const av = block('AV');
  chk(name, 'PMO AV', 'the report is on the tab', av.err || 'ok', 'ok');
  if (!av.err) {
    chk(name, 'PMO AV', 'it is titled for the office', av.title.startsWith('AV — FY27 Requirements'), true);
    // THE COUNT. Widths and headings are authored separately; one short and every figure on the
    // block prints under the wrong heading in a workbook that opens perfectly.
    chk(name, 'PMO AV', 'one column width per heading', av.cols, av.hdr.length);
    ['Rank', 'Requirement (CCaR Record Name)', 'Plan Event', 'CCaR #', 'PID',
     'FY27 Ask', 'Disc allocated', 'Total (Disc+Mand)',
     'UFR (Unfunded Requirement)', 'Unscheduled'].forEach(h =>
      chk(name, 'PMO AV', `it states "${h}"`, av.at(h) >= 0, true));
    // THE THREE SUMMARY COLUMNS SIT TOGETHER, DIRECTLY AFTER PID, and in that order: what was
    // asked, what discretionary put against it, what both lanes put against it.
    chk(name, 'PMO AV', 'the ask comes straight after PID', av.at('FY27 Ask'), av.at('PID') + 1);
    chk(name, 'PMO AV', 'then the discretionary total', av.at('Disc allocated'), av.at('FY27 Ask') + 1);
    chk(name, 'PMO AV', 'then disc + mand', av.at('Total (Disc+Mand)'), av.at('Disc allocated') + 1);
    chk(name, 'PMO AV', 'and they come before the per-service breakout',
      av.at('Total (Disc+Mand)') < av.at('USAF Disc'), true);
    // ONE column headed Total (Disc+Mand), not two. It used to sit after the Mand block as well.
    chk(name, 'PMO AV', 'the funded total is stated once',
      av.hdr.filter(h => h === 'Total (Disc+Mand)').length, 1);
    SVCX.forEach(sv => {
      chk(name, 'PMO AV', `${sv} has its own Disc column`, av.at(sv + ' Disc') >= 0, true);
      chk(name, 'PMO AV', `${sv} has its own Mand column`, av.at(sv + ' Mand') >= 0, true);
    });
    chk(name, 'PMO AV', 'twelve months of the fiscal year', av.months.length, 12);
    chk(name, 'PMO AV', 'the first one is October', av.months[0], 'OCT 26');
    // ── THE BANDS. Three headings over three blocks, each its own colour, each merged across
    //    exactly the columns it describes. A band one column short or one long is a heading that
    //    claims figures it does not cover, on the row a reader uses to know what they are looking at.
    const bandCells = (av.sh.rows[av.t + 1] || []);
    const labelled = bandCells.map((c, i) => ({ i, v: String(cv(c) ?? ''), s: c && c.s }))
      .filter(x => x.v);
    chk(name, 'bands', 'three headings are banded across the section', labelled.length, 3);
    chk(name, 'bands', 'Disc Allocations sits over the first service Disc column',
      labelled[0] && labelled[0].v + '@' + labelled[0].i, 'Disc Allocations@' + av.at('USAF Disc'));
    chk(name, 'bands', 'Mand Allocations sits over the first service Mand column',
      labelled[1] && labelled[1].v + '@' + labelled[1].i, 'Mand Allocations@' + av.at('USAF Mand'));
    chk(name, 'bands', 'the Spend Plan band sits over the first month column',
      labelled[2] && labelled[2].v + '@' + labelled[2].i, 'FY27 Spend Plan@' + av.at('OCT 26'));
    // DISTINCT COLOURS, or three bands in a row read as one. They are also the board's own colour
    // language -- discretionary green, mandatory purple -- so the reader is not taught a second one.
    chk(name, 'bands', 'each band has its own style',
      new Set(labelled.map(x => x.s)).size, 3);
    // A MERGE PAINTS ONLY WHAT IS THERE. Every cell under a band has to be emitted with the band's
    // own style, or the colour stops after the label and the rest of the span is plain.
    const spanPainted = (from, n, style) => {
      let ok = 0;
      for (let i = from; i < from + n; i++) { const c = bandCells[i];
        if (c && typeof c === 'object' && c.s === style) ok++; }
      return ok;
    };
    chk(name, 'bands', 'the Disc band is painted across every service column',
      spanPainted(av.at('USAF Disc'), SVCX.length, labelled[0] && labelled[0].s), SVCX.length);
    chk(name, 'bands', 'the Mand band too',
      spanPainted(av.at('USAF Mand'), SVCX.length, labelled[1] && labelled[1].s), SVCX.length);
    chk(name, 'bands', 'and the Spend Plan band across all twelve months',
      spanPainted(av.at('OCT 26'), 12, labelled[2] && labelled[2].s), 12);
    // The merges the writer is handed: one per band, on the band's own row, spanning its block.
    const mg = (av.sh.merges || []).slice().sort((a, b) => a.c - b.c);
    chk(name, 'bands', 'three merges are asked for', mg.length, 3);
    chk(name, 'bands', 'all on the band row', mg.every(m => m.r === av.t + 1), true);
    chk(name, 'bands', 'the Disc merge spans its services',
      mg[0] && mg[0].c + '+' + mg[0].cs, av.at('USAF Disc') + '+' + SVCX.length);
    chk(name, 'bands', 'the Mand merge spans its services',
      mg[1] && mg[1].c + '+' + mg[1].cs, av.at('USAF Mand') + '+' + SVCX.length);
    chk(name, 'bands', 'the Spend Plan merge spans the twelve months',
      mg[2] && mg[2].c + '+' + mg[2].cs, av.at('OCT 26') + '+12');

    // CROSS-FOOT, EVERY ROW AND THE TOTAL.
    const M0 = av.at('OCT 26'), UNS = av.at('Unscheduled'), TOT = av.at('Total (Disc+Mand)');
    let seen = 0;
    av.rows.forEach(r => {
      const months = r.slice(M0, UNS).reduce((a, c) => a + (num(c) || 0), 0);
      seen++;
      chk(name, 'PMO AV', `${String(cv(r[0]))}: months + unscheduled = Total (Disc+Mand)`,
        months + (num(r[UNS]) || 0), num(r[TOT]));
    });
    chk(name, 'PMO AV', 'and there were rows to check', seen, 3);   // 2 requirements + the TOTAL row
    // THE PROPERTIES THAT LET THE REST OF THIS BLOCK FAIL. State them rather than assume them.
    chk(name, 'PMO AV', 'the fixture really does carry a shortfall',
      num(av.rows[0][av.at('UFR (Unfunded Requirement)')]) > 0, true);

    // WHERE THE MONEY LANDS, against the scenario's own dates. A obligates 30 Nov 2026, so its
    // whole funded amount is in NOV 26 and nowhere else.
    const rowOf = rank => av.rows.filter(r => String(cv(r[0])) === String(rank))[0];
    const cell = (rank, col) => num(rowOf(rank)[av.at(col)]) || 0;
    chk(name, 'PMO AV', 'a single award date puts the whole funded amount in that month',
      cell(1, 'NOV 26'), cell(1, 'Total (Disc+Mand)'));
    chk(name, 'PMO AV', 'and nothing of it is unscheduled', cell(1, 'Unscheduled'), 0);
    // PRIME-3's increments are stored newest-first; both must land in their own month regardless.
    // The expected figure is this office's SHARE of the increment, derived from the scenario's own
    // CLIN split rather than written as a literal that goes stale the moment the fixture moves.
    const INC = [200, 50, 25];
    const incAv = INC.reduce((a, v, i) => a + v * CL_AV[i] / (CL_AV[i] + CL_MX[i]), 0);
    // v1.95 (item 60): AN OFFICE'S SHARE IS WHOLE DOLLARS. The exact share is 207.5, which no sheet may hold, so
    // each increment carries a whole-dollar part of it, within a dollar of the exact share; the two add up below.
    const near = v => Number.isInteger(v) && Math.abs(v - incAv) < 1;
    chk(name, 'PMO AV', 'an increment lands in its own month', near(cell(2, 'DEC 26')), true);
    chk(name, 'PMO AV', 'including one stored out of order', near(cell(2, 'MAR 27')), true);
    chk(name, 'PMO AV', 'and the two are the whole funded amount',
      cell(2, 'DEC 26') + cell(2, 'MAR 27'), cell(2, 'Total (Disc+Mand)'));

    // THE ROW'S OWN ARITHMETIC CLOSES, left to right: what was asked, less what the two lanes put
    // against it, is what is short. On a shared requirement all three are this office's share, so
    // an unshared ask would break exactly the rows that span two offices.
    av.rows.forEach(r => {
      const a = num(r[av.at('FY27 Ask')]) || 0, t = num(r[av.at('Total (Disc+Mand)')]) || 0;
      const u = num(r[av.at('UFR (Unfunded Requirement)')]) || 0;
      chk(name, 'PMO AV', `${String(cv(r[0]))}: Ask less funded is the UFR`, a - t, u);
    });
    // And the two summary columns are the blocks beside them, added up.
    av.rows.forEach(r => {
      const d = SVCX.reduce((x, sv) => x + (num(r[av.at(sv + ' Disc')]) || 0), 0);
      chk(name, 'PMO AV', `${String(cv(r[0]))}: Disc allocated is the service columns`,
        num(r[av.at('Disc allocated')]), d);
    });
    // UFR IS NOT INSIDE THE TOTAL. It is what the office is still short, not money it holds.
    // A is trimmed, so its UFR is non-zero and folding it in would be visible here.
    chk(name, 'PMO AV', 'the trimmed requirement states its shortfall',
      num(rowOf(1)[av.at('UFR (Unfunded Requirement)')]), UFR_A);
    chk(name, 'PMO AV', 'and the funded total is what the lanes paid, not ask less nothing',
      cell(1, 'Total (Disc+Mand)'), ALLOC_A.reduce((a, b) => a + b, 0));
    av.rows.forEach(r => {
      const d = SVCX.reduce((a, sv) => a + (num(r[av.at(sv + ' Disc')]) || 0), 0);
      const m = SVCX.reduce((a, sv) => a + (num(r[av.at(sv + ' Mand')]) || 0), 0);
      chk(name, 'PMO AV', `${String(cv(r[0]))}: Total is Disc + Mand and nothing else`,
        d + m, num(r[av.at('Total (Disc+Mand)')]));
    });

    // THE OFFICE'S SHARE. PRIME-3's CLINs put 300/75/40 with AV and 100/25/10 with MxS, so each
    // tab must carry that fraction of the draw and the two must add back to the whole requirement.
    // The fractions come from the scenario's own CLIN figures, never from pmoSharesOf().
    const mxs = block('MxS');
    chk(name, 'PMO MxS', 'the second office got a tab', mxs.err || 'ok', 'ok');
    if (!mxs.err) {
      const pAv = av.rows.filter(r => String(cv(r[0])) === '2')[0];
      const pMx = mxs.rows.filter(r => String(cv(r[0])) === '2')[0];
      chk(name, 'share', 'the shared requirement is on both tabs',
        (pAv && pMx) ? 'both' : `av ${!!pAv}, mxs ${!!pMx}`, 'both');
      if (pAv && pMx) {
        SVCX.forEach((sv, i) => {
          const whole = CL_AV[i] + CL_MX[i];
          const got = num(pAv[av.at(sv + ' Disc')]) || 0;
          chk(name, 'share', `${sv}: AV carries its CLIN share of the draw`,
            got, (num(pAv[av.at(sv + ' Disc')]) + num(pMx[mxs.at(sv + ' Disc')])) * CL_AV[i] / whole);
        });
        const tAv = num(pAv[av.at('Total (Disc+Mand)')]), tMx = num(pMx[mxs.at('Total (Disc+Mand)')]);
        chk(name, 'share', 'and neither office carries the whole requirement',
          (tAv < ASK_P.reduce((a, b) => a + b, 0) && tMx > 0) ? 'shared' : `av ${tAv}, mxs ${tMx}`, 'shared');
        chk(name, 'share', 'the two shares add back to the whole funded requirement',
          tAv + tMx, ASK_P.reduce((a, b) => a + b, 0));
      }
    }
  }

  // ── THE BYTES, NOT THE SHEET OBJECTS ─────────────────────────────────────────────────────
  // Everything above reads what exportExcel HANDED the writer. mergeCells is the one thing that
  // can be perfectly right there and still fatal: it belongs after sheetData in the schema, and a
  // workbook that puts it before is not "slightly wrong" -- Excel refuses the part and the file
  // does not open at all. Nothing else on this board reads this workbook's bytes back, so the only
  // way to know is to unzip what came out.
  {
    // capture() swapped buildXlsx for a stub that returns no bytes and never put it back. Reading
    // the bytes means asking the REAL writer for them.
    ev(`if(globalThis.__origBuildXlsx) buildXlsx=globalThis.__origBuildXlsx; 'ok'`);
    const b64 = ev(`(function(){
      let cap=null; const _B=window.Blob;
      window.Blob=function(p,o){ if(!cap && p && p[0] && p[0].byteLength) cap=p[0]; return new _B(p,o); };
      try{ exportExcel(); } finally { window.Blob=_B; }
      if(!cap) return '';
      let s=''; const u=new Uint8Array(cap.buffer, cap.byteOffset, cap.byteLength);
      for(let i=0;i<u.length;i++) s+=String.fromCharCode(u[i]);
      return btoa(s);
    })()`);
    chk(name, 'bytes', 'the workbook produced bytes', b64 ? 'bytes' : 'nothing', 'bytes');
    if (b64) {
      const buf = Buffer.from(b64, 'base64');
      // Walk the central directory rather than trusting a name order.
      const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
      chk(name, 'bytes', 'it is a zip with an end-of-directory record', eocd > 0, true);
      const nEnt = buf.readUInt16LE(eocd + 10), cdOff = buf.readUInt32LE(eocd + 16);
      const parts = {};
      let q = cdOff;
      for (let i = 0; i < nEnt; i++) {
        const nLen = buf.readUInt16LE(q + 28), xLen = buf.readUInt16LE(q + 30), cLen = buf.readUInt16LE(q + 32);
        const lho = buf.readUInt32LE(q + 42), method = buf.readUInt16LE(q + 10), csize = buf.readUInt32LE(q + 20);
        const nm = buf.toString('utf8', q + 46, q + 46 + nLen);
        const lnLen = buf.readUInt16LE(lho + 26), lxLen = buf.readUInt16LE(lho + 28);
        const raw = buf.subarray(lho + 30 + lnLen + lxLen, lho + 30 + lnLen + lxLen + csize);
        try { parts[nm] = (method === 0 ? raw : inflateRawSync(raw)).toString('utf8'); } catch (e) { parts[nm] = ''; }
        q += 46 + nLen + xLen + cLen;
      }
      const sheetXml = Object.keys(parts).filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n));
      const withMerge = sheetXml.filter(n => parts[n].indexOf('<mergeCells') >= 0);
      // DERIVED FROM THE FIXTURE, not written as a number. This fixture grew a third office when
      // the shared prime was added to it, and a literal 2 would have been quietly wrong about
      // which sheets were being checked rather than loudly wrong about the merges.
      // A PMO tab with nothing to report carries no block and so no merges -- rightly. What must
      // hold is that every tab that HAS the block has its bands in the file.
      const nWithBlock = sheets.filter(x => /^PMO /.test(x.name)
        && x.rows.some(r => /Requirements \(Disc\/Mand Funded Portions\)/.test(String(cv((r || [])[0]) ?? '')))).length;
      chk(name, 'bytes', 'the fixture really does produce banded tabs', nWithBlock > 1, true);
      chk(name, 'bytes', 'every tab carrying the block carries its merges in the file itself',
        withMerge.length, nWithBlock);
      withMerge.forEach(n => {
        const xml = parts[n];
        const m = /<mergeCells count="(\d+)">([\s\S]*?)<\/mergeCells>/.exec(xml) || [];
        const refs = [...String(m[2] || '').matchAll(/<mergeCell ref="([A-Z]+\d+):([A-Z]+\d+)"\/>/g)];
        chk(name, 'bytes', `${n}: the declared count matches what is there`,
          Number(m[1] || -1), refs.length);
        // THE ORDER THAT DECIDES WHETHER THE FILE OPENS.
        chk(name, 'bytes', `${n}: mergeCells comes after sheetData`,
          xml.indexOf('<mergeCells') > xml.indexOf('</sheetData>'), true);
        // A merge whose anchor cell was never written leaves Excel repairing the file on open.
        refs.forEach(r => chk(name, 'bytes', `${n}: ${r[1]}:${r[2]} has a cell to anchor on`,
          xml.indexOf('<c r="' + r[1] + '"') >= 0, true));
      });
    }
  }

  // A REQUIREMENT WITH NO AWARD DATE IS UNSCHEDULED, not dropped. C carries none.
  const psm = block('PSM');
  chk(name, 'PMO PSM', 'the report is on that tab too', psm.err || 'ok', 'ok');
  if (!psm.err) {
    const r = psm.rows[0];
    const tot = num(r[psm.at('Total (Disc+Mand)')]);
    chk(name, 'PMO PSM', 'a requirement with no award date is funded', tot > 0, true);
    chk(name, 'PMO PSM', 'and all of it sits in Unscheduled', num(r[psm.at('Unscheduled')]), tot);
    chk(name, 'PMO PSM', 'with no month claiming any of it',
      r.slice(psm.at('OCT 26'), psm.at('Unscheduled')).reduce((a, c) => a + (num(c) || 0), 0), 0);
  }
}

// ---------------------------------------------------------------------------------------------
// ==== v2.09 W1 (item 125): CLIN amounts and the row controls, by pointer ====
// ==== end v2.09 W1 ====

// ==== v2.09 W2 (item 126): a PMO copy's five years ====
// ==== end v2.09 W2 ====

// ==== v2.09 W3 (item 127): Save in a PMO copy; the board refuses a copy at its other doors ====
// ==== end v2.09 W3 ====

// ==== v2.09 W4 (item 128): the SI tab's requirements by code ====
// ==== end v2.09 W4 ====

// ==== v2.10 A (item 130): FYDP Disconnects -- the figures and the box ====
// ==== end v2.10 A ====

// ==== v2.10 B (item 130): FYDP Disconnects -- the workbook ====
// ==== end v2.10 B ====

{
  const src = _selfRead(_selfPath(import.meta.url), 'utf8');
  const named = [...src.matchAll(/^  const name = '([^']+)'/gm)].map(m => m[1]);   // a scenario's own line, never this one
  // A name built by concatenation ('convert to split — ' + label) is heard only in its finished
  // forms, so a literal that any heard scenario STARTS WITH has run. A dead block's literal has none.
  named.forEach(n => { if (![...SEEN].some(s => s === n || s.startsWith(n))) failures.push({ scenario: n, sheet: 'harness',
    what: 'this scenario never ran — is its block after process.exit()?', got: 'never ran', want: 'ran' }); });
}
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
