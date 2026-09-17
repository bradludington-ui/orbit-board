// Audit the figures the BOARD derives and shows but never exports.
//
// The three export suites compare printed cells against the lane engine. Anything the board
// computes for the screen alone is invisible to them — a mutation sweep found exactly that: the
// cumulative column could be made to skip unfunded dollars entirely and every export suite passed,
// because no export carries it.
//
// The cumulative is not decoration. It is how the cutline banners are placed, so it is the figure
// that tells someone where the money runs out. Its oracle is derived here, from the scenario's own
// inputs, never read back from tiers() — an oracle that asks the code under test what the answer
// is will agree with it, including when it is wrong.
import { boot, seed } from './boot.mjs';

const failures = [];
const chk = (scenario, where, what, got, want) => {
  const ok = typeof got === 'number' && typeof want === 'number'
    ? Math.abs(got - want) <= 0.005 : String(got) === String(want);
  if (!ok) failures.push({ scenario, where, what, got, want });
};
const sum = a => a.reduce((x, y) => x + y, 0);

const SVC3 = ['STOVL', 'CV', 'CTOL'];
const it = (id, grp, ask, extra = {}) => ({
  id, grp, team: grp, sect: '', custom: false, title: id + ' title', event: id + ' event',
  ccar: '', fy26: ask.map(() => 0), ask, alloc: null, ...extra,
});

const SCENARIOS = {
  'plain order, lanes run dry partway': {
    services: SVC3,
    items: [it('A', 'ATL', [50, 20, 10]), it('B', 'PSM', [40, 30, 5]),
            it('C', 'AV', [30, 10, 20]), it('D', 'MxS', [25, 15, 5])],
    disc: [70, 30, 15], mand: [50, 25, 12],
    order: ['A', 'B', 'C', 'D'],
  },
  // The shape the surviving mutation exploited: dollars that NO lane covers. If the cumulative
  // counted only what discretionary and mandatory paid for, it would understate from here down.
  'nothing funded — every dollar unfunded': {
    services: SVC3,
    items: [it('A', 'ATL', [50, 20, 10]), it('B', 'PSM', [40, 30, 5])],
    disc: [0, 0, 0], mand: [0, 0, 0],
    order: ['A', 'B'],
  },
  // The scoreboard carries four Mission Critical figures and, until this scenario, no board
  // scenario had a starred requirement at all — so MC total, MC need, the program floor and the
  // mandatory tile's "incl ★ MC" were all being compared against zero.
  // A splits D+M, B is must-pay carried entirely by mandatory, C spills and strands, D is unfunded.
  'must-pays that the discretionary lane cannot cover': {
    services: SVC3,
    items: [it('A', 'ATL', [50, 20, 10]), it('B', 'PSM', [20, 10, 5]),
            it('C', 'AV', [10, 5, 3]), it('D', 'MxS', [5, 5, 5])],
    disc: [40, 20, 10], mand: [30, 15, 8],
    order: ['A', 'B', 'C', 'D'],
    mc: { A: true, B: true },
  },
  // Must-pays the discretionary lane covers outright: MC total is real but MC need must read zero,
  // so the program floor collapses to the discretionary BA and cannot be confused with it by luck.
  'must-pays fully covered by discretionary': {
    services: SVC3,
    items: [it('A', 'ATL', [20, 10, 5]), it('B', 'PSM', [15, 5, 5])],
    disc: [60, 30, 15], mand: [20, 10, 5],
    order: ['A', 'B'],
    mc: { A: true },
  },
  'trimmed rows, partial coverage': {
    services: SVC3,
    items: [it('A', 'ATL', [60, 30, 10]), it('B', 'PSM', [40, 20, 10]), it('C', 'AV', [20, 10, 5])],
    disc: [40, 20, 10], mand: [20, 10, 5],
    order: ['A', 'B', 'C'],
    alloc: { A: { m: 't', v: 50 }, B: { m: 's', v: [20, 10, 4] } },
  },
};

for (const [name, sc] of Object.entries(SCENARIOS)) {
  const { ev, errors } = boot();
  seed(ev, sc);
  const T = JSON.parse(ev('JSON.stringify(tiers())'));
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  const SVC = sc.services;
  // The basis, restated here rather than read from svcAlloc — same rule the export suite uses.
  const basisOf = id => {
    const item = sc.items.find(x => x.id === id);
    if (sc.fsrc && sc.fsrc[id]) return item.ask.slice();
    const a = sc.alloc && sc.alloc[id];
    if (a === null || a === undefined) return item.ask.slice();
    if (a.m === 's') return a.v.slice();
    const at = sum(item.ask);
    if (at > 0) return item.ask.map(x => a.v * x / at);
    return SVC.map(() => a.v / SVC.length);
  };

  // ---- the cumulative: a running total of every dollar the row accounts for, funded or not ----
  let running = 0;
  sc.order.forEach(id => {
    const p = T[id];
    running += sum(p.d) + sum(p.m) + sum(p.u);
    chk(name, 'cumulative', `${id}: cum is the running total of d+m+u`, p.cum, running);
    // Stated independently of tiers(): the row accounts for its whole basis, so the running total
    // of the bases is the same number. This is what fails if unfunded is dropped from the count.
    chk(name, 'cumulative', `${id}: cum counts unfunded dollars too`,
      p.cum, sc.order.slice(0, sc.order.indexOf(id) + 1).reduce((a, x) => a + sum(basisOf(x)), 0));
  });

  // ---- the clamping invariants ----
  // These are why two mutations in the sweep are marked EQUIVALENT rather than surviving: flooring
  // the lane remainders is defensive, because nothing can drive them negative in the first place.
  // That is only a safe thing to say while these hold. If a clamp is ever removed, these fail and
  // the two mutations stop being equivalent — which is the point of asserting it rather than
  // writing the reasoning into a comment and trusting it.
  {
    const rem = JSON.parse(ev('JSON.stringify(tiers().__rem)'));
    const drew = k => SVC.map((sv, i) => sc.order.reduce((a, id) => a + (T[id][k][i] || 0), 0));
    const dDrawn = drew('d'), mDrawn = drew('m');
    SVC.forEach((sv, i) => {
      chk(name, 'invariant', `${sv}: discretionary remaining never goes negative`,
        rem.dRem[i] >= -0.005 ? 'ok' : `negative (${rem.dRem[i]})`, 'ok');
      chk(name, 'invariant', `${sv}: mandatory remaining never goes negative`,
        rem.mRem[i] >= -0.005 ? 'ok' : `negative (${rem.mRem[i]})`, 'ok');
      chk(name, 'invariant', `${sv}: discretionary drawn never exceeds its BA`,
        dDrawn[i] <= sc.disc[i] + 0.005 ? 'ok' : `${dDrawn[i]} drawn vs BA ${sc.disc[i]}`, 'ok');
      chk(name, 'invariant', `${sv}: mandatory drawn never exceeds its BA`,
        mDrawn[i] <= sc.mand[i] + 0.005 ? 'ok' : `${mDrawn[i]} drawn vs BA ${sc.mand[i]}`, 'ok');
    });
  }

  // ---- the tier label the row wears, which the lane chip and the row edge both read from ----
  sc.order.forEach(id => {
    const p = T[id];
    const dT = sum(p.d), mT = sum(p.m), uT = sum(p.u);
    // The star only claims the row once the money misses it: a must-pay drawing ANY mandatory or
    // carrying ANY unfunded reads 'mc', but one the discretionary lane covers outright stays 'disc'.
    const mc = !!(sc.mc && sc.mc[id]);
    let want = uT > 0.005 ? 'unf'
             : mT > 0.005 ? (dT > 0.005 ? 'split' : (mc ? 'mc' : 'mand'))
             : 'disc';
    if (mc && (mT + uT) > 0.005) want = 'mc';
    chk(name, 'tier', `${id}: tier matches its lane draws`, p.tier, want);
  });
}


// ═══ the scoreboard tiles and the discretionary fit strip ═══════════════════════════════════════
// These are read off the RENDERED page, not recomputed in the harness. Re-evaluating the same
// expression here would compare my copy against my copy and pass whatever the board did — the same
// trap the lane oracle fell into. Reading the DOM tests the figure the user actually sees, wiring
// included.
//
// A pattern that fails to match is a FAILURE, never a skip. A check that cannot run reads as a pass,
// and this file exists because of figures nothing was checking.
for (const [name, sc] of Object.entries(SCENARIOS)) {
  const { ev, w, errors } = boot();
  seed(ev, sc);
  ev('render()');
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  const T = JSON.parse(ev('JSON.stringify(tiers())'));
  const SVC = sc.services, ids = sc.order;
  const doc = w.document;
  const textOf = sel => { const el = doc.querySelector(sel); return el ? el.textContent.replace(/\s+/g, ' ').trim() : null; };
  const money = t => t === null ? NaN : Number(String(t).replace(/[$,]/g, ''));

  // Pull one figure out of rendered text by an anchored pattern. Records a failure if the pattern
  // no longer matches, so a reworded tile surfaces instead of silently dropping its coverage.
  const grab = (where, what, sel, re, group = 1) => {
    const t = textOf(sel);
    if (t === null) { chk(name, where, `${what} — element ${sel} missing`, 'missing', 'present'); return NaN; }
    const m = t.match(re);
    if (!m) { chk(name, where, `${what} — pattern not found in "${t.slice(0, 90)}"`, 'no match', 'match'); return NaN; }
    return money(m[group]);
  };

  // ---- the oracle, from the lane engine's per-service vectors ----
  const perSvc = k => SVC.map((s, i) => ids.reduce((a, id) => a + (T[id][k][i] || 0), 0));
  const dBySvc = perSvc('d'), mBySvc = perSvc('m'), uBySvc = perSvc('u');
  const dBA = sum(sc.disc), mBA = sum(sc.mand);
  const askOf = id => sum(sc.items.find(x => x.id === id).ask);
  const mcIds = ids.filter(id => sc.mc && sc.mc[id]);

  // Left in each lane is floored PER SERVICE before summing: an overdrawn lane must never be
  // cancelled out by a healthy one, because the money cannot move between them.
  const dLeftExp = sum(SVC.map((s, i) => Math.max(0, sc.disc[i] - dBySvc[i])));
  const mLeftExp = sum(SVC.map((s, i) => Math.max(0, sc.mand[i] - mBySvc[i])));
  const dUsedExp = sum(dBySvc), mUsedExp = sum(mBySvc), uAmtExp = sum(uBySvc);
  // RULE: MC shortage = requirement value less what DISCRETIONARY covered, floored per service.
  const mcNeedExp = sum(mcIds.map(id => sum(SVC.map((s, i) =>
    Math.max(0, (sc.items.find(x => x.id === id).ask[i] || 0) - (T[id].d[i] || 0))))));
  const mcTotExp = mcIds.reduce((a, id) => a + askOf(id), 0);
  const floorExp = dBA + mcNeedExp;
  const mcCovExp = mcIds.reduce((a, id) => a + sum(T[id].m), 0);

  // ---- tile 1 · Discretionary ----
  chk(name, 'tile · Discretionary', 'left across service lanes, floored per service',
    grab('tile · Discretionary', 'left', '.sc.disc .rm', /^\$([\d,]+)/), dLeftExp);
  chk(name, 'tile · Discretionary', 'BA',
    grab('tile · Discretionary', 'BA', '.sc.disc', /BA: \$([\d,]+)/), dBA);
  chk(name, 'tile · Discretionary', 'discretionary used',
    grab('tile · Discretionary', 'used', '.sc.disc', /\$([\d,]+) used/), dUsedExp);

  chk(name, 'tile · Discretionary', 'count of rows funded wholly by discretionary',
    grab('tile · Discretionary', 'disc count', '.sc.disc', /(\d+) reqs fully disc/),
    ids.filter(id => sum(T[id].d) > 0.005 && sum(T[id].m) <= 0.005 && sum(T[id].u) <= 0.005).length);
  chk(name, 'tile · Discretionary', 'count of rows split across both lanes',
    grab('tile · Discretionary', 'split count', '.sc.disc', /(\d+) split D\+M/),
    ids.filter(id => sum(T[id].u) <= 0.005 && sum(T[id].m) > 0.005 && sum(T[id].d) > 0.005).length);

  // ---- tile 2 · Mission critical ----
  chk(name, 'tile · Mission critical', 'MC total is the sum of starred requirement values',
    grab('tile · Mission critical', 'MC total', '.sc.mc .rm', /^\$([\d,]+)/), mcTotExp);
  chk(name, 'tile · Mission critical', 'count of must-pay requirements',
    grab('tile · Mission critical', 'MC count', '.sc.mc', /allocated to (\d+) must-pay/), mcIds.length);
  chk(name, 'tile · Mission critical', 'PROGRAM FLOOR == discretionary BA + MC need',
    grab('tile · Mission critical', 'floor', '.sc.mc', /Program floor \(Discretionary BA \+ MC need\): \$([\d,]+)/), floorExp);
  if (mcNeedExp > 0.5) {
    chk(name, 'tile · Mission critical', 'MC need above the discretionary BA',
      grab('tile · Mission critical', 'MC need', '.sc.mc', /MC need \$([\d,]+)/), mcNeedExp);
  }

  // ---- tile 3 · Mandatory ----
  chk(name, 'tile · Mandatory', 'left across service lanes, floored per service',
    grab('tile · Mandatory', 'left', '.sc.mand .rm', /^\$([\d,]+)/), mLeftExp);
  chk(name, 'tile · Mandatory', 'mandatory drawn',
    grab('tile · Mandatory', 'drawn', '.sc.mand', /\$([\d,]+) drawn/), mUsedExp);
  chk(name, 'tile · Mandatory', 'count of rows funded wholly by mandatory',
    grab('tile · Mandatory', 'mand count', '.sc.mand', /(\d+) reqs fully mand/),
    ids.filter(id => sum(T[id].u) <= 0.005 && sum(T[id].m) > 0.005 && sum(T[id].d) <= 0.005).length);
  chk(name, 'tile · Mandatory', 'of which drawn for ★ MC requirements',
    grab('tile · Mandatory', 'MC share', '.sc.mand', /incl ★ MC \$([\d,]+)/), mcCovExp);

  // ---- tile 4 · Whole budget ----
  chk(name, 'tile · Whole budget', 'total BA',
    grab('tile · Whole budget', 'whole', '.sc.whole .rm', /^\$([\d,]+)/), dBA + mBA);
  chk(name, 'tile · Whole budget', 'funded when whole',
    grab('tile · Whole budget', 'funded', '.sc.whole', /\$([\d,]+) funded when whole/), dUsedExp + mUsedExp);
  chk(name, 'tile · Whole budget', 'count of rows carrying unfunded dollars',
    grab('tile · Whole budget', 'unf count', '.sc.whole', /(\d+) reqs \//),
    ids.filter(id => sum(T[id].u) > 0.005).length);
  chk(name, 'tile · Whole budget', 'beyond both lanes',
    grab('tile · Whole budget', 'beyond', '.sc.whole', /\$([\d,]+) beyond both lanes/), uAmtExp);
  // THE TWO PORTFOLIO READINGS, ON SCREEN. The tile used to show the lane figure alone, which is
  // NEITHER reading -- it excludes trims -- so the dashboard's most prominent unfunded number was a
  // third figure that appeared in no export. Both are asserted here because they are RENDERED and
  // never exported: no export suite can reach them.
  chk(name, 'tile · Whole budget', 'UNFUNDED vs DISC (ask - disc)',
    grab('tile · Whole budget', 'r1', '.sc.whole', /UNFUNDED vs DISC \$([\d,]+)/),
    sum(ids.map(id => sum(SVC.map((s, i) =>
      Math.max(0, (sc.items.find(x => x.id === id).ask[i] || 0) - T[id].d[i]))))));
  chk(name, 'tile · Whole budget', 'TOTAL unfunded (ask - disc - mand)',
    grab('tile · Whole budget', 'r2', '.sc.whole', /TOTAL \$([\d,]+)/),
    sum(ids.map(id => sum(SVC.map((s, i) =>
      Math.max(0, (sc.items.find(x => x.id === id).ask[i] || 0) - T[id].d[i] - T[id].m[i]))))));

  // ---- the discretionary fit strip, per service ----
  // Exact dollars live in each chip's tooltip; the chip face is abbreviated for width.
  const chips = [...doc.querySelectorAll('#fitBar .fitchip')];
  chk(name, 'fit strip', 'one chip per service', chips.length, SVC.length);
  SVC.forEach((svc, i) => {
    const el = chips[i];
    if (!el) { chk(name, 'fit strip', `${svc}: chip missing`, 'missing', 'present'); return; }
    const tip = (el.getAttribute('title') || '').replace(/\s+/g, ' ');
    const g = re => { const m = tip.match(re); if (!m) { chk(name, 'fit strip', `${svc}: pattern not found in "${tip.slice(0, 90)}"`, 'no match', 'match'); return NaN; } return money(m[1]); };
    chk(name, 'fit strip', `${svc}: discretionary BA`, g(/discretionary BA \$([\d,]+)/), sc.disc[i]);
    chk(name, 'fit strip', `${svc}: drawn against it`, g(/— \$([\d,]+) drawn/), dBySvc[i]);
    const over = mBySvc[i] + uBySvc[i];
    if (over > 0.5) {
      chk(name, 'fit strip', `${svc}: mandatory past the lane`, g(/Past it: \$([\d,]+) mandatory/), mBySvc[i]);
      chk(name, 'fit strip', `${svc}: unfunded past the lane`, g(/, \$([\d,]+) unfunded/), uBySvc[i]);
    } else {
      chk(name, 'fit strip', `${svc}: says nothing went past the lane`,
        /Nothing has gone past it/.test(tip) ? 'yes' : 'no', 'yes');
    }
  });

  // ---- the lane counts beside the strip ----
  const bar = textOf('#fitBar') || '';
  const cnt = (lbl, re) => { const m = bar.match(re);
    if (!m) { chk(name, 'lane counts', `${lbl} — pattern not found`, 'no match', 'match'); return NaN; }
    return Number(m[1]); };
  chk(name, 'lane counts', 'fits in disc — fully discretionary rows only',
    cnt('fits in disc', /fits in disc (\d+)/),
    ids.filter(id => sum(T[id].d) > 0.005 && sum(T[id].m) <= 0.005 && sum(T[id].u) <= 0.005).length);
  chk(name, 'lane counts', 'spills to mand — any mandatory draw',
    cnt('spills to mand', /spills to mand (\d+)/),
    ids.filter(id => sum(T[id].m) > 0.005).length);
  chk(name, 'lane counts', 'unfunded — any unfunded dollar',
    cnt('unfunded', /unfunded (\d+)/),
    ids.filter(id => sum(T[id].u) > 0.005).length);

  // ---- the per-service unfunded warning in the header ----
  const warn = textOf('#svcWarn') || '';
  SVC.forEach((svc, i) => {
    if (uBySvc[i] <= 0.5) return;
    const m = warn.match(new RegExp(svc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' \\$([\\d,]+)'));
    chk(name, 'unfunded by service', `${svc} reported, and not netted onto another service`,
      m ? money(m[1]) : 'absent', uBySvc[i]);
  });
}


// ═══ the incremental-funding residual ═══════════════════════════════════════════════════════════
// The last increment is the figure that goes on a contract modification. It is allocated dollars
// less what the earlier increments already obligate, PER SERVICE — netting it across services would
// produce a total that ties while every individual mod is wrong.
{
  const name = 'incremental funding residual';
  const sc = {
    services: ['STOVL', 'CV', 'CTOL'],
    items: [it('A', 'ATL', [12000000, 4200000, 2361859])],
    disc: [8000000, 2000000, 1000000], mand: [5000000, 3000000, 2000000],
    order: ['A'],
  };
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  const r = JSON.parse(ev(`
    (function(){
      toggleAwdInc('A', 0);
      var T = tiers(), p = T['A'];
      // Three dates; the first two take deliberately uneven shares so no service's residual equals
      // any other's, and an even split cannot pass by coincidence.
      S.awards['A'].inc = [
        {d:'2026-11', day:1, sv: SVC.map(function(s,i){ return Math.round((p.d[i]||0)*0.40); })},
        {d:'2027-02', day:1, sv: SVC.map(function(s,i){ return Math.round((p.d[i]||0)*0.25); })},
        {d:'2027-06', day:1, sv: SVC.map(function(){ return 0; })}
      ];
      save();
      fillLastAwd('A');
      var T2 = tiers(), p2 = T2['A'], inc = S.awards['A'].inc;
      return JSON.stringify({
        // DISCRETIONARY alone — the basis the increment balance tracks.
        alloc: SVC.map(function(s,i){ return (p2.d[i]||0); }),
        mand:  SVC.map(function(s,i){ return (p2.m[i]||0); }),
        sched: SVC.map(function(s,i){ return inc.reduce(function(a,x){ return a+((x.sv||[])[i]||0); }, 0); }),
        last:  inc[inc.length-1].sv.slice(),
        first: inc[0].sv.slice(), second: inc[1].sv.slice()
      });
    })()`));

  // The scenario is only meaningful if mandatory is actually drawn; otherwise the two possible
  // bases are the same number and this proves nothing.
  chk(name, 'residual', 'scenario actually draws mandatory, so the basis is distinguishable',
    sum(r.mand) > 0.5 ? 'yes' : 'no', 'yes');
  sc.services.forEach((svc, i) => {
    chk(name, 'residual', `${svc}: every DISCRETIONARY dollar is scheduled once the last increment is filled`,
      Math.round(r.sched[i]), Math.round(r.alloc[i]));
    // Stated independently of what fillLastAwd did: the last increment IS the remainder.
    chk(name, 'residual', `${svc}: last increment == allocated less the earlier increments`,
      Math.round(r.last[i]), Math.round(r.alloc[i] - r.first[i] - r.second[i]));
  });
  // A total that ties while the per-service splits are wrong is the failure this guards against,
  // so the totals are checked too — but they are not the point, and they are checked last.
  chk(name, 'residual', 'total scheduled equals total DISCRETIONARY allocated',
    Math.round(sum(r.sched)), Math.round(sum(r.alloc)));
}


// ═══ the spend forecast: increments are discretionary DOLLARS ═══════════════════════════════════
// monSpreadOf places money into months. Two things have to hold, and the first is the one that
// makes the second safe:
//   CONSERVATION — every funded dollar lands in a month or in UNSCHEDULED. Never dropped, never
//                  invented. This is the property the function exists to keep.
//   LITERAL       — what you type into an increment is the discretionary that lands in that month.
//                  It used to be a weight against the whole funded amount, which inflated every
//                  figure once the balance started reconciling against discretionary alone.
{
  const name = 'spend forecast';
  const sc = {
    services: ['STOVL', 'CV', 'CTOL'],
    items: [it('A', 'ATL', [12000000, 4200000, 2361859])],
    disc: [8000000, 2000000, 1000000], mand: [5000000, 3000000, 2000000],
    order: ['A'],
  };
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  // Two increments covering 65% of discretionary, both on real months, so a third of the
  // discretionary is deliberately left unscheduled and must show up as UNSCHEDULED.
  const r = JSON.parse(ev(`
    (function(){
      toggleAwdInc('A', 0);
      var T = tiers(), p = T['A'];
      var m0 = FYMON[1][0], m1 = FYMON[4][0];
      S.awards['A'].inc = [
        {d:m0, day:1, sv: SVC.map(function(s,i){ return Math.round((p.d[i]||0)*0.40); })},
        {d:m1, day:1, sv: SVC.map(function(s,i){ return Math.round((p.d[i]||0)*0.25); })}
      ];
      save();
      var sp = monSpreadOf('A', tiers()['A']);
      var p2 = tiers()['A'];
      return JSON.stringify({
        months: sp.m, unsch: sp.unsch, mi: [1, 4],
        d: SVC.map(function(s,i){ return p2.d[i]||0; }),
        m: SVC.map(function(s,i){ return p2.m[i]||0; }),
        inc: S.awards['A'].inc.map(function(x){ return x.sv.slice(); })
      });
    })()`));

  sc.services.forEach((svc, i) => {
    const placed = r.months[i].reduce((a, b) => a + b, 0) + r.unsch[i];
    chk(name, 'conservation', `${svc}: every funded dollar is in a month or UNSCHEDULED`,
      Math.round(placed), Math.round(r.d[i] + r.m[i]));

    // What was typed is what lands, plus mandatory riding the same proportions.
    const wsum = r.inc.reduce((a, x) => a + x[i], 0);
    r.mi.forEach((k, j) => {
      const wantD = r.inc[j][i];
      const wantM = wsum > 0 ? r.m[i] * r.inc[j][i] / wsum : 0;
      chk(name, 'literal placement', `${svc}: increment ${j + 1} lands as typed (+ its mandatory share)`,
        Math.round(r.months[i][k]), Math.round(wantD + wantM));
    });

    // The discretionary never put on a date is UNSCHEDULED — the same figure the board's
    // Balance to schedule row reports.
    chk(name, 'unscheduled', `${svc}: discretionary not on a date shows as UNSCHEDULED`,
      Math.round(r.unsch[i]), Math.round(r.d[i] - wsum));
  });

  // THE BOARD'S OWN SPREAD IS LITERAL; A MODELLED PLAN'S IS NOT. forecast() bare spreads what the
  // board actually funds, so an increment is the dollars typed. forecast(fundOf) spreads a
  // hypothetical plan whose dollars are NOT the ones the increments were sized against, so there
  // they can only carry the SHAPE. Treating both the same stranded most of Plan B in UNSCHEDULED.
  const f = JSON.parse(ev(`
    (function(){
      var bare = forecast();
      var T = tiers();
      // a modelled plan: the same order funded against a larger topline
      var modelled = forecast(function(id){
        var r = T[id]; if(!r) return null;
        var got = SVC.map(function(s,i){ return (r.d[i]||0)+(r.m[i]||0); });
        return {d:got, m:SVC.map(function(){return 0;}),
                dT:got.reduce(function(a,b){return a+b;},0), mT:0};
      });
      var pick = function(f2){ var k = Object.keys(f2.byPMO)[0]; var b = f2.byPMO[k];
        return {m:b.m.filter(function(v){return v>0.5;}), unsch:b.unsch, tot:b.tot}; };
      return JSON.stringify({bare:pick(bare), modelled:pick(modelled)});
    })()`));

  chk(name, 'literal vs modelled', 'the board\'s own spread holds back unscheduled discretionary',
    f.bare.unsch > 0.5 ? 'held' : 'none', 'held');
  chk(name, 'literal vs modelled', 'a modelled plan schedules all of its topline',
    Math.round(f.modelled.unsch), 0);
  chk(name, 'literal vs modelled', 'a modelled plan keeps the increments\' SHAPE',
    +(f.modelled.m[0] / (f.modelled.m[0] + f.modelled.m[1])).toFixed(4),
    +(r.inc[0].reduce((a, b) => a + b, 0)
      / (r.inc[0].reduce((a, b) => a + b, 0) + r.inc[1].reduce((a, b) => a + b, 0))).toFixed(4));
  chk(name, 'literal vs modelled', 'both conserve their own total',
    Math.round(f.modelled.m.reduce((a, b) => a + b, 0) + f.modelled.unsch), Math.round(f.modelled.tot));
}


// ═══ the cutline banners ════════════════════════════════════════════════════════════════════════
// natM and natU decide where the board draws its cutlines — the lines that say "the money runs out
// here". The rule is deliberately narrow: a draw only counts where that service's lane was ALREADY
// dry. Without that, a requirement directed to MANDATORY high in the order drags the discretionary
// cutline up the list with it and tells the room the money ran out sooner than it did.
//
// The oracle needs no replay of the draw logic: the lane remaining after row k is simply the BA
// less what rows 1..k drew, per service.
{
  const name = 'cutlines';
  const sc = {
    services: ['STOVL', 'CV', 'CTOL'],
    // B is directed to MANDATORY while its discretionary lane is still flush — the exact case the
    // guard exists for. C is large enough to actually exhaust the lane.
    items: [it('A', 'ATL', [1000, 500, 200]), it('B', 'PSM', [2000, 800, 300]),
            it('C', 'AV', [9000, 4000, 2000]), it('D', 'MxS', [3000, 1500, 800])],
    disc: [10000, 5000, 2500], mand: [8000, 4000, 2000],
    order: ['A', 'B', 'C', 'D'],
    fsrc: { B: { m: 'split', dv: [0, 0, 0], mv: [2000, 800, 300] },
            // D asks for far less mandatory than it needs, so it strands UFR while the mandatory
            // lane is still flush — the only shape that tells a one-guard natU from a two-guard one.
            D: { m: 'split', dv: [0, 0, 0], mv: [500, 200, 100] } },
  };
  const { ev, errors } = boot();
  seed(ev, sc);
  ev('render()');
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  const T = JSON.parse(ev('JSON.stringify(tiers())'));
  const SVC = sc.services;

  const dRem = sc.disc.slice(), mRem = sc.mand.slice();
  let firstNat = null;
  sc.order.forEach(id => {
    const p = T[id];
    SVC.forEach((s, i) => { dRem[i] -= p.d[i] || 0; mRem[i] -= p.m[i] || 0; });
    const wantM = SVC.reduce((a, s, i) => a + (dRem[i] <= 0.005 ? (p.m[i] || 0) : 0), 0);
    const wantU = SVC.reduce((a, s, i) =>
      a + ((dRem[i] <= 0.005 && mRem[i] <= 0.005) ? (p.u[i] || 0) : 0), 0);
    chk(name, 'natM', `${id}: mandatory counted only off an ALREADY-dry discretionary lane`, p.natM, wantM);
    chk(name, 'natU', `${id}: unfunded counted only where BOTH lanes are already gone`, p.natU, wantU);
    if (firstNat === null && (wantM + wantU) > 0.005) firstNat = id;
  });

  // B draws mandatory with its lane flush, so it must NOT be where the cutline lands. Without this
  // the scenario cannot tell a guarded natM from an unguarded one.
  chk(name, 'natM', 'a directed mandatory draw on a flush lane does not trigger the cutline',
    T.B.natM, 0);
  chk(name, 'cutline', 'the scenario does reach a cutline somewhere', firstNat ? 'yes' : 'no', 'yes');
  // The guard that the one-guard mutation removes: D strands unfunded dollars while its mandatory
  // lane still holds money, so they must NOT count toward the full-budget cutline.
  chk(name, 'natU', 'unfunded stranded while mandatory is still flush does not trigger the cutline',
    T.D.natU, 0);
  chk(name, 'natU', 'the scenario really does strand unfunded dollars on D',
    SVC.reduce((a, s, i) => a + (T.D.u[i] || 0), 0) > 0.5 ? 'yes' : 'no', 'yes');

  // And the banner is rendered immediately above that row, not somewhere else in the list.
  const placed = ev(`(function(){
    var el = document.querySelector('#list .cutline.cut-disc');
    if(!el) return 'absent';
    var n = el.nextElementSibling;
    while(n && !n.classList.contains('row')) n = n.nextElementSibling;
    return n ? n.id.replace(/^row-/, '') : 'nothing after it';
  })()`);
  chk(name, 'cutline', 'the discretionary banner sits immediately above the first row that crosses',
    placed, firstNat);
}

// ═══ the absorb line ════════════════════════════════════════════════════════════════════════════
// What the nominated contract would give up if the portfolio does not close. Per service, capped by
// what that service actually holds above the floor — and the floor is spread in the SHAPE of the
// allocation, not applied whole to every service.
{
  const name = 'absorb';
  const sc = {
    services: ['STOVL', 'CV', 'CTOL'],
    // A is the absorber and is fully funded; B and C strand money on different services, so the
    // shortfall is uneven and a netted "take" cannot pass by coincidence.
    items: [it('A', 'ATL', [6000, 3000, 1500]), it('B', 'PSM', [5000, 500, 200]),
            it('C', 'AV', [500, 4000, 2000])],
    disc: [6000, 3000, 1500], mand: [2000, 400, 300],
    order: ['A', 'B', 'C'],
  };
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  const FLOOR = 2000;
  const r = JSON.parse(ev(`
    (function(){
      S.absorb='A'; S.absorbFloor=${FLOOR}; save();
      var T=tiers(), AB=absorbCalc(T);
      return JSON.stringify({ab:AB, alloc:svcAlloc(itemById('A')),
        u:SVC.map(function(s,i){ return S.order.reduce(function(a,id){ return a+((T[id].u[i])||0); },0); })});
    })()`));
  const SVC = sc.services;

  const aTot = r.alloc.reduce((a, b) => a + b, 0);
  const floor = Math.max(0, Math.min(FLOOR, aTot));
  chk(name, 'setup', 'the scenario strands money on more than one service',
    r.u.filter(v => v > 0.5).length >= 2 ? 'yes' : 'no', 'yes');

  SVC.forEach((svc, i) => {
    // The floor is spread in the shape of the allocation — a service holding a tenth of the
    // allocation reserves a tenth of the floor, not all of it.
    const room = Math.max(0, r.alloc[i] - (aTot > 0 ? floor * r.alloc[i] / aTot : 0));
    const take = Math.min(r.u[i] || 0, room);
    chk(name, 'absorbed', `${svc}: capped by what this service holds above its share of the floor`,
      Math.round(r.ab.absorbed[i]), Math.round(take));
    chk(name, 'unabsorbed', `${svc}: what the absorber cannot cover stays on that service`,
      Math.round(r.ab.unabsorbed[i]), Math.round((r.u[i] || 0) - take));
  });
  SVC.forEach((svc, i) => {
    const share = aTot > 0 ? floor * r.alloc[i] / aTot : 0;
    chk(name, 'invariant', `${svc}: a service's share of the floor never exceeds its own allocation`,
      share <= r.alloc[i] + 0.005 ? 'ok' : `share ${share} > alloc ${r.alloc[i]}`, 'ok');
  });
  chk(name, 'invariant', 'the floor is clamped to the allocation total before it is spread',
    floor <= aTot + 0.005 ? 'ok' : `floor ${floor} > aTot ${aTot}`, 'ok');
  chk(name, 'absorbed', 'absorbed + unabsorbed is the whole portfolio shortfall',
    Math.round(r.ab.absorbedTot + r.ab.unabsorbedTot), Math.round(sum(r.u)));
}

// ═══ the on-screen marker on the spend forecast panel ════════════════════════════════════
// The workbook's markers are asserted in audit.mjs. This one is the marker the USER actually sees:
// the forecast panel's own heading, under "Discretionary only". It is rendered, never exported, so
// no export suite can reach it — exactly the class of figure this file exists for.
{
  const name = 'forecast marker';
  const sc = {
    services: ['USAF', 'ANG'],
    items: [it('A', 'ATL', [12000000, 1500000]), it('B', 'PSM', [3000000, 400000])],
    disc: [8000000, 1000000], mand: [4000000, 600000], order: ['A', 'B'],
  };
  const { ev, w, errors } = boot();
  seed(ev, sc);
  ev(`S.awards['A']={mode:'single',d:FYMON[1][0],day:1};
      S.awards['B']={mode:'single',d:FYMON[2][0],day:1}; save(); 'ok'`);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  // Open the panel: fcBody() only writes the heading while the forecast is on screen.
  ev('if(!fcOpen) toggleFc(); "ok"');
  chk(name, 'panel', 'the forecast panel opens', String(ev('!!fcOpen')), 'true');

  const head = () => { const el = w.document.querySelector('#fcTitle');
                       return el ? el.textContent.replace(/\s+/g, ' ').trim() : null; };
  const tag = JSON.parse(ev('JSON.stringify(SCEN_TAG)'));
  ev(`setScen(''); render(); 'ok'`);   const off = head();
  ev(`setScen('disc'); render(); 'ok'`); const on = head();
  ev(`setScen(''); render(); 'ok'`);   const back = head();

  chk(name, 'panel', 'the heading renders at all', off === null ? 'missing' : 'present', 'present');
  chk(name, 'panel', 'marked under Discretionary only',
    String(on).includes(tag) ? 'marked' : 'unmarked', 'marked');
  chk(name, 'panel', 'clean under Discretionary + Mandatory',
    String(off).includes(tag) ? 'marked' : 'clean', 'clean');
  chk(name, 'panel', 'the marker comes back off with the toggle',
    String(back).includes(tag) ? 'marked' : 'clean', 'clean');
}

// ═══ converting the whole board to an explicit Split ═══════════════════════════════════
// convertAllToSplit() freezes each requirement's current lane draw as directed per-service dollars.
// THE WHOLE POINT IS THAT NO FIGURE MOVES. It is a one-way bulk edit with no undo, so the property
// worth protecting is losslessness, not the mechanics -- if conversion shifts a dollar, it does so
// across every requirement at once and quietly.
//
// The fixture uses a SCALAR trim, which prorates to fractional per-service dollars. seedSplit()
// used to round each service to whole dollars on the way in; whole numbers everywhere would make
// that step invisible and prove nothing about it, so the fractional fixture stays as the thing
// that would notice any rounding reintroduced here.
for (const [label, allocB] of [['whole dollars', {m:'t', v:5000000}],
                               ['fractional trim', {m:'t', v:5000001}]]) {
  const name = 'convert to split — ' + label;
  const sc = {
    services: ['USAF', 'ANG', 'CTOL'],
    items: [it('A', 'ATL', [5000000, 2000000, 1000000]),
            it('B', 'ATL', [6000000, 1000000, 2000000]),
            it('C', 'PSM', [4000000, 3000000, 1000000])],
    disc: [7000000, 2500000, 1500000], mand: [3000000, 1000000, 800000],
    order: ['A', 'B', 'C'], alloc: { B: allocB },
  };
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  const shot = () => JSON.parse(ev(`(function(){
    const T=tiers(); const o={}; let d=0,m=0,du=0,u=0;
    S.order.forEach(function(id){ const p=T[id], x=itemById(id); if(!p||!x) return;
      o[id]={d:p.dT, m:p.mT, du:discUnfTotOf(x,p), u:unfTotOf(x,p)};
      d+=p.dT; m+=p.mT; du+=discUnfTotOf(x,p); u+=unfTotOf(x,p); });
    o.__tot={d:d, m:m, du:du, u:u}; return JSON.stringify(o); })()`));

  const before = shot();
  ev('window.confirm=function(){return true;}; window.alert=function(){}; convertAllToSplit(); "ok"');
  const after = shot();

  chk(name, 'convert', 'every requirement now carries a split',
    ev(`S.order.map(function(id){ return (S.fsrc[id]||{}).m||'auto'; }).join(',')`), 'split,split,split');
  ['A', 'B', 'C', '__tot'].forEach(k => {
    ['d', 'm', 'du', 'u'].forEach(f => {
      const what = { d: 'discretionary', m: 'mandatory', du: 'unfunded vs DISC', u: 'total unfunded' }[f];
      chk(name, 'lossless', `${k}: ${what} is unchanged by the conversion`, after[k][f], before[k][f]);
    });
  });

  // Converting twice must be a no-op: the second pass finds nothing left on the lane walk.
  const again = (ev('convertAllToSplit(); "ok"'), shot());
  chk(name, 'lossless', 'converting again changes nothing', again.__tot.u, after.__tot.u);

  // The two readings, stated as the rule they came from.
  ['A', 'B', 'C'].forEach(id => chk(name, 'readings',
    `${id}: mandatory can only narrow the gap between the two readings`,
    after[id].du >= after[id].u - 0.005 ? 'ok' : 'total exceeds vs-DISC', 'ok'));
}

// ══ the impact statement must be reachable on EVERY requirement ═════════════════════════
// "What happens if this is not funded" is the field a programme office is best placed to write, and
// it used to sit behind a band condition: the ⚠ CONSEQUENCE chip appears only where
// BAND_DEF().consReq is set, and the ⋯ menu offers it only on a critical band. On an ordinary band
// there was no way in at all -- which made the PMO submittal workflow unable to collect the one
// thing it exists to collect.
{
  const name = 'impact is always reachable';
  const sc = { services: ['USAF', 'ANG', 'AFRC'],
    items: [it('A', 'PSM', [9000000, 2000000, 1000000])],
    disc: [9000000, 2000000, 1000000], mand: [0, 0, 0], order: ['A'] };
  const { ev, errors } = boot();
  seed(ev, sc);
  const draw = () => ev('render(); if(typeof setCur==="function") setCur("A"); "ok"');
  draw();
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  // Read the DOM, not a regex over innerHTML. The handler is written as an HTML entity in the
  // source (toggleCons(&quot;A&quot;)), so match on the live attribute value -- the one the click
  // uses -- rather than on however the serializer chose to re-escape it.
  //
  // WHERE the way in lives differs by build, and the check has to follow it rather than pin one
  // spot. The card build offers it on the row; the grid build carries identity, money and the band
  // on the row and puts this in the RECORD panel, whose echo of the row chips has every onclick
  // stripped. Searching the row alone passed on the card and silently stopped covering the grid --
  // which is how removing the row chip read as green until audit:grid was run.
  const chip = () => ev(`(function(){
    var row=document.getElementById('row-A');
    var scopes=[['row', row]];
    var ins=document.getElementById('inspector')||document.getElementById('recPanel');
    if(ins) scopes.push(['panel', ins]);
    for (var s=0;s<scopes.length;s++){
      var el=scopes[s][1]; if(!el) continue;
      var all=el.querySelectorAll('[onclick]');
      for (var i=0;i<all.length;i++){
        var h=all[i].getAttribute('onclick')||'';
        if (h.indexOf('toggleCons')>=0 && h.indexOf('A')>=0)
          return {found:true, where:scopes[s][0],
                  text:(all[i].textContent||'').replace(/\\s+/g,' ').trim()};
      }
    }
    return {found:false};
  })()`);

  chk(name, 'fixture', 'the requirement has no decision band', ev('BAND_OF("A")===null'), true);
  const before = chip();
  chk(name, 'row', `the impact statement can be opened (${before.where || 'nowhere'})`,
    before.found ? 'reachable' : 'no way in', 'reachable');
  chk(name, 'row', 'and an unwritten one says so',
    /not written/.test(before.text || '') ? 'flagged' : 'silent', 'flagged');
  ev(`S.cons['A']='If this is not funded the depot line stops in March.'; 'ok'`);
  draw();
  const wrote = chip();
  chk(name, 'row', 'once written it is still reachable to edit',
    wrote.found ? 'reachable' : 'no way in', 'reachable');
  chk(name, 'row', 'and no longer flagged as missing',
    /not written/.test(wrote.text || '') ? 'still flagged' : 'clean', 'clean');
}

// ══ the Spruills grid must read the board's OWN requirements ═══════════════════════════
// APPNS is the consolidated multi-appropriation payload. It is a const baked in at build time and
// is EMPTY on a board that simply carries its own requirements -- nothing ever writes to it, and
// buildSavedHtml does not rewrite it either. spDefs() took it anyway for the board's own
// appropriation, so the Spruills panel reported Total Requirements $0.00M on a board holding
// $1.4B of asks, printed a DELTA of the entire budget as surplus, and dropped every per-PMO row.
// pkgPackOf has guarded this exact trap for a while; this makes sure spDefs keeps doing the same.
//
// The oracle is the scenario's own arithmetic. Asking spGather() what it thinks the answer is
// would have agreed with the bug.
{
  const name = 'Spruills reads the board it is on';
  const sc = { services: ['USAF', 'ANG', 'AFRC'],
    items: [it('A', 'PSM', [9000000, 2000000, 1000000]),
            it('B', 'AV',  [4000000, 500000, 250000]),
            it('C', 'MxS', [1500000, 750000, 125000])],
    disc: [9000000, 2000000, 1000000], mand: [3000000, 500000, 250000],
    order: ['A', 'B', 'C'] };
  const wantReq = sum(sc.items.map(i => sum(i.ask)));
  const wantBud = sum(sc.disc) + sum(sc.mand);
  const { ev, errors } = boot();
  seed(ev, sc);
  ev('render(); "ok"');
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  // The precondition the bug needed. If a build ever starts filling APPNS this check still holds,
  // but say so rather than passing silently on a board where the trap cannot spring.
  const appnsEmpty = ev(`(function(){ if(typeof APPNS==='undefined') return 'no APPNS';
    var p=APPNS[APPN]; return !!(p&&((p.items&&p.items.length)||(p.services&&p.services.length)))? 'filled':'empty'; })()`);
  chk(name, 'precondition', "the board's own APPNS slot is empty", appnsEmpty, 'empty');

  const fy = ev('MS.cur');
  const G = JSON.parse(ev('JSON.stringify(spGather())'));
  const own = G.blocks.find(b => b.name === ev('APPN'));
  chk(name, 'spGather', "the board's own appropriation has a block", !!own, true);
  if (own) {
    chk(name, 'spGather', 'total requirements are the board\'s asks', own.req[fy], wantReq);
    chk(name, 'spGather', 'available funding is disc + mand', own.bud[fy], wantBud);
    chk(name, 'spGather', 'delta is funding minus requirements',
      (own.bud[fy] || 0) - (own.req[fy] || 0), wantBud - wantReq);
    // The missing rows were the other half of it: a block with the right total and no rows under
    // it still briefs as a blank page.
    const rowTot = sum(Object.values(own.rows).map(r => +r[fy] || 0));
    chk(name, 'spGather', 'the rows under it add to the same total', rowTot, wantReq);
    chk(name, 'spGather', 'and there is a row per PMO', Object.keys(own.rows).length,
      new Set(sc.items.map(i => i.grp)).size);
  }
}

// ══ recording a funding source must not change what a requirement is short ═════════════
// A directed source says where the ALLOCATION is drawn from. It used to re-base the requirement on
// its full ask, so the gap between ask and allocation -- TRIM on every ordinary requirement -- was
// reported as BEYOND BOTH LANES on this one, and counted into the portfolio shortfall. Because
// seedSplit() fills the directed dollars FROM the allocation, that meant the act of recording where
// money came from, which moves no money whatsoever, flipped a row from "fully funded" to "partly
// unfunded" and grew the banner. Two requirements identical in ask, trim and funding read
// differently side by side on the 1-N report, with nothing on screen to say why.
//
// A and B here are the same requirement twice. Only the recorded source differs.
{
  const name = 'a recorded funding source moves no money';
  const sc = { services: ['USAF', 'ANG', 'AFRC'],
    items: [it('A', 'PSM', [9000000, 2000000, 1000000]),
            it('B', 'PSM', [9000000, 2000000, 1000000])],
    disc: [20000000, 5000000, 3000000], mand: [0, 0, 0],
    order: ['A', 'B'],
    alloc: { A: { m: 't', v: 6600000 }, B: { m: 't', v: 6600000 } } };
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  const read = id => JSON.parse(ev(`(function(){ var T=tiers(), p=T['${id}'], x=itemById('${id}');
    return JSON.stringify({d:p.dT, m:p.mT, beyond:p.uT, tier:p.tier,
      trim:trimTotOf(x), unf:unfTotOf(x,p), basis:basisSvcOf(x).reduce(function(a,b){return a+b;},0)}); })()`));

  const plain = read('A');
  // Record a source on B only — seeded from its own allocation, so no dollar is directed anywhere
  // it was not already going.
  chk(name, 'setup', 'the source is seeded from the allocation', ev(`seedSplit('B')`), true);
  ev('save(); render(); "ok"');
  const sourced = read('B');

  ['d', 'm', 'beyond', 'trim', 'unf', 'basis'].forEach(k => {
    const what = { d: 'discretionary drawn', m: 'mandatory drawn', beyond: 'beyond both lanes',
                   trim: 'trim', unf: 'total unfunded', basis: 'the basis measured against' }[k];
    chk(name, 'unchanged', `${what} is the same with a source recorded`, sourced[k], plain[k]);
  });
  chk(name, 'unchanged', 'and so is the funding tier', sourced.tier, plain.tier);
  // The trim on a 9/2/1 ask allocated 6.6 is 5.4, and the lanes cover the allocation in full, so
  // the arithmetic is stated rather than taken from either row.
  chk(name, 'oracle', 'the trim is the ask less the allocation', plain.trim, 12000000 - 6600000);
  chk(name, 'oracle', 'nothing is beyond the lanes', plain.beyond, 0);
  chk(name, 'oracle', 'total unfunded is the trim', plain.unf, plain.trim);
}

// ══ the pop-up editor saves what was typed, and opens where there is a panel to open it from ══
// Note, Description and Impact used to expand the row. On the grid build they are a pop-up now,
// because the RECORD panel is right there and an edit belongs with the requirement's other fields.
//
// TWO PROPERTIES, and they are checked separately on purpose. The machinery is byte-identical in
// both builds -- only the ROUTING differs, on whether this build has an #inspector -- so the save
// path is driven directly here in BOTH, and a mutation to it cannot survive on the build that does
// not happen to route through it. The routing is then asserted per build.
{
  const name = 'the pop-up editor';
  const sc = { services: ['USAF', 'ANG', 'AFRC'],
    items: [it('A', 'PSM', [9000000, 2000000, 1000000])],
    disc: [9000000, 2000000, 1000000], mand: [0, 0, 0], order: ['A'] };
  const { ev, errors } = boot();
  seed(ev, sc);
  ev('render(); if(typeof setCur==="function") setCur("A"); "ok"');
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  const isOpen = () => ev(`(function(){ var e=document.getElementById('fldPanel');
    return e? /\\bopen\\b/.test(e.className) : false; })()`);

  // 1. the save path, driven directly, in whichever build this is
  for (const [kind, store, text] of [['cons', 'cons', 'Depot line stops in March.'],
                                     ['desc', 'desc', 'Sustains the fielded capability.'],
                                     ['note', 'notes', 'Agreed at the Sep SFWG.']]) {
    ev(`openFld('A','${kind}'); "ok"`);
    chk(name, kind, 'opens on the requirement', isOpen(), true);
    chk(name, kind, 'loads what is already stored',
      ev(`(document.getElementById('fldVal')||{}).value===undefined? 'no field' : 'present'`), 'present');
    ev(`document.getElementById('fldVal').value=${JSON.stringify(text)}; fldSave(); "ok"`);
    chk(name, kind, 'saves what was typed', ev(`(S.${store}||{})['A']||''`), text);
    chk(name, kind, 'and closes once saved', isOpen(), false);
  }
  // A requirement removed out from under the editor must not leave it open on nothing.
  ev(`openFld('A','note'); "ok"`);
  ev(`fldOpen={id:'GONE', kind:'note'}; fldBody(); "ok"`);
  chk(name, 'stale', 'it closes when its requirement is gone', isOpen(), false);

  // 2. the routing, which is the half that differs
  const hasPanel = ev('fldHasPanel()');
  ev(`consOpen['A']=false; toggleCons('A'); "ok"`);
  chk(name, 'routing', `a panel build opens the pop-up, one without expands the row (panel: ${hasPanel})`,
    hasPanel ? (isOpen() && !ev(`!!consOpen['A']`) ? 'pop-up' : 'wrong route')
             : (!isOpen() && ev(`!!consOpen['A']`) ? 'row' : 'wrong route'),
    hasPanel ? 'pop-up' : 'row');
}

// ══ MIPR type is asked for on an OGC, and never on a prime ═════════════════════════════
// How an OGC's money is sent -- Direct Cite or Reimbursable. Two properties worth pinning:
//
//  1. WHICH REQUIREMENTS ARE ASKED. Keyed on the destination's KIND, not on "LM or P&W" by name.
//     A name list goes stale the day a prime is renamed or a third one is added -- the same trap
//     as the hardcoded year list that blanked a whole appropriation in Spruills. This asserts the
//     behaviour by RENAMING a prime and adding a third, which a name list could not survive.
//  2. IT TRAVELS. It is a PMO-contributable field and an attached container, so a year copy and a
//     submittal both have to carry it; a field the board asks for and then loses is worse than one
//     it never asked for.
{
  const name = 'MIPR type';
  const sc = { services: ['USAF', 'ANG', 'AFRC'],
    items: [it('A', 'PSM', [9000000, 2000000, 1000000]), it('B', 'AV', [4000000, 500000, 250000])],
    disc: [9000000, 2000000, 1000000], mand: [0, 0, 0], order: ['A', 'B'] };
  const { ev, errors } = boot();
  seed(ev, sc);
  ev('render(); "ok"');
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  const asked = id => ev(`destIsOgc(itemById('${id}'))`);
  chk(name, 'gate', 'not asked before a destination is logged', asked('A'), false);
  ev(`setDest('A','to','lm'); "ok"`);                       // a prime
  chk(name, 'gate', 'not asked when it goes straight to a prime', asked('A'), false);
  ev(`setDest('A','to','pax'); "ok"`);                      // a government activity
  chk(name, 'gate', 'asked when it goes to a government activity', asked('A'), true);

  // The point of keying on Kind: rename the prime, add another, and the answer must not move.
  ev(`flowSetEnt(0,'n','Lockheed Martin Aeronautics'); "ok"`);
  ev(`setDest('B','to','lm'); "ok"`);
  chk(name, 'gate', 'a renamed prime is still a prime', asked('B'), false);
  ev(`flowAddEnt(); var L=flowEnts(); flowSetEnt(L.length-1,'kind','prime'); "ok"`);
  const third = ev(`(function(){ var L=flowEnts(); return L[L.length-1].k; })()`);
  ev(`setDest('B','to','${third}'); "ok"`);
  chk(name, 'gate', 'and a third prime added later is one too', asked('B'), false);

  // store and round-trip
  ev(`setMipr('A','direct'); "ok"`);
  chk(name, 'store', 'it keeps what was chosen', ev(`miprOf('A')`), 'direct');
  chk(name, 'store', 'and refuses a value that is not one of the two',
    (ev(`setMipr('A','nonsense'); miprOf('A')`)) || '(cleared)', '(cleared)');
  ev(`setMipr('A','reimb'); "ok"`);

  // it is contributable, so a submittal carries it
  chk(name, 'travels', 'it is a field a programme office can send back',
    ev(`PMO_KEYS.indexOf('mipr')>=0`), true);

  // THE CLASSIFICATION MATRIX HAS TO COVER IT. matCols() is derived from recFields(), so a new
  // record field appears as a matrix column on its own -- but matBulk() is the one list that is
  // NOT derived, and a list-valued column with no bulk setter means the sweep covers less than
  // the grid shows. matBulkOk() is the board's own name for that gap; it read ['MIPR type'] the
  // first time a requirement was routed to a government activity, and nothing said so, because
  // no suite had ever called it on a board with a destination logged.
  chk(name, 'matrix', 'the matrix offers it as a column once a requirement is an OGC',
    ev(`matCols().indexOf('MIPR type')>=0`), true);
  chk(name, 'matrix', 'and the bulk sweep has a setter for every column it draws',
    ev(`JSON.stringify(matBulkOk())`), '[]');
  chk(name, 'matrix', 'a bulk set writes the value, not the label',
    ev(`matSet('bulkF','MIPR type'); matSet('bulkV','direct'); matApplyBulk(); miprOf('A')`),
    'direct');
  // The year copy is NOT asserted here. 'mipr' is in the board's container normalise list, and
  // `copy / move between years` in audit-import.mjs reads that list out of the board's own source
  // and proves every container in it actually receives data. Restating it here would be a second
  // check of the same thing that could drift from the first -- and the tautology this replaced
  // ("'listed' : 'listed'") asserted nothing at all while looking like it did.
}

// ═══ EVERY DOLLAR THE ENGINE PRODUCES IS A WHOLE DOLLAR ═════════════════════════════════
// Money used to be stored as a float and rounded only FOR DISPLAY. A scalar allocation prorated
// across the services by x*t/at left a fraction on every lane, and because unfSvcOf() floors each
// service separately those fractions cannot cancel against one another -- they surfaced as
// unfunded dollars nobody was short of, on a screen that also said the requirement was fully
// funded.
//
// THE ORACLE IS Number.isInteger, NOT A TOLERANCE, and that is the whole point. Every other money
// check in this codebase compares to within 0.005, so a third of a cent per service passed all of
// them while still tripping the >0.005 tests that decide what counts as unfunded. A rule this one
// enforces cannot be expressed with the tolerance the rule exists to eliminate.
{
  const name = 'whole dollars — scalar allocations that do not divide';
  // Chosen so no proration lands clean: none of these asks divide their allocation evenly, and
  // 13 across [1,3,7,11] is deliberately small enough that a lost dollar is the whole answer.
  const sc = {
    services: ['USAF', 'ANG', 'STOVL', 'USN'],
    items: [it('A', 'ATL', [246947793, 28251630, 100813070, 63796828]),
            it('B', 'PSM', [1, 3, 7, 11]),
            it('C', 'AV',  [333333333, 333333333, 333333334, 1]),
            it('D', 'MxS', [70000001, 30000007, 10000003, 5000009])],
    disc: [200000001, 20000003, 90000007, 50000011],
    mand: [10000003, 5000007, 3000011, 2000013],
    // D IS WALKED FIRST, and that is the whole point of it. Placed last it drew nothing: A
    // exhausts every discretionary lane, so D's directed share was capped at a dry lane's zero and
    // the fractional spread this fixture exists to expose never reached the output. A fixture that
    // cannot reach the code it is aimed at reads exactly like a passing one -- and this one did,
    // until split-share-fractional survived the sweep and said so.
    order: ['D', 'A', 'B', 'C'],
    alloc: { A: { m: 't', v: 412915308 }, B: { m: 't', v: 13 }, C: { m: 't', v: 777777777 } },
    // D carries a LEGACY whole-requirement split -- scalar Disc and Mand with no per-service
    // vectors. tiers() has to spread those across the lanes itself, and that spread is a second
    // proration with its own chance to leave a fraction on every service.
    fsrc: { D: { m: 'split', d: 61234567, mnd: 23456789 } },
  };
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  const F = JSON.parse(ev(`(function(){
    const T=tiers(), out={rows:[], ba:{disc:S.discSvc.slice(), mand:S.mandSvc.slice()}};
    S.order.forEach(function(id){ const p=T[id], x=itemById(id); if(!p||!x) return;
      out.rows.push({id:id, ask:x.ask.slice(), alloc:svcAlloc(x), d:p.d, m:p.m, u:p.u,
                     du:discUnfSvcOf(x,p), uu:unfSvcOf(x,p), effTot:eff(x)}); });
    return JSON.stringify(out); })()`));

  const whole = v => Number.isInteger(v);
  const allWhole = vec => vec.every(whole) ? 'ok' : vec.join(',');
  chk(name, 'whole dollars', 'the legacy split spread whole dollars too',
    (F.rows.filter(r => r.id === 'D')[0] || {d: [0.5]}).d.every(Number.isInteger) ? 'ok' : 'fractional', 'ok');
  F.rows.forEach(r => {
    [['requirement value', r.ask], ['allocation', r.alloc], ['discretionary drawn', r.d],
     ['mandatory drawn', r.m], ['unfunded', r.u], ['unfunded vs DISC', r.du],
     ['unfunded total', r.uu]].forEach(([what, vec]) =>
      chk(name, 'whole dollars', `${r.id}: every per-service ${what} is a whole dollar`,
        allWhole(vec), 'ok'));
    // EXACT, not near. The per-service allocation has to add back up to the scalar that was typed
    // or the difference becomes unfunded the moment a lane is tight -- which is the defect.
    chk(name, 'apportion', `${r.id}: the per-service allocation sums to exactly what was allocated`,
      sum(r.alloc), r.effTot);
    // Conservation still holds service by service, in whole dollars.
    r.alloc.forEach((v, i) => chk(name, 'apportion',
      `${r.id}: service ${i} — drawn plus unfunded equals the allocation`,
      r.d[i] + r.m[i] + r.u[i], v));
  });
  chk(name, 'whole dollars', 'discretionary budget authority is whole dollars', allWhole(F.ba.disc), 'ok');
  chk(name, 'whole dollars', 'mandatory budget authority is whole dollars', allWhole(F.ba.mand), 'ok');

  // What a person types is rounded at the door, not at the glass. These run last: they change the
  // board, and everything above is measured against the board as it was seeded.
  chk(name, 'input', 'a typed cent is stored as a whole dollar',
    ev(`setAsk('B',0,'1,234.56'); itemById('B').ask[0]`), 1235);
  chk(name, 'input', 'a typed shorthand amount is stored as a whole dollar',
    ev(`setAsk('B',1,'1.2345M'); itemById('B').ask[1]`), 1234500);
  chk(name, 'input', 'a typed allocation is stored as a whole dollar',
    ev(`setAlloc('C','777777777.49'); (S.alloc['C']||{}).v`), 777777777);
}

// ═══ DIRECTED IS NOT DRAWN ══════════════════════════════════════════════════════════════
// A directed split says where a requirement's dollars SHOULD come from. tiers() can only give what
// the service's lane still holds and what the allocation covers, so a directed dollar past either
// limit is not funded -- it lands in UFR. The editor used to print the DIRECTED figure in the box
// and the DRAWN figure in the column total, which let a service read as fully funded beside its own
// non-zero UFR and made the Disc column disagree with its own total by exactly the shortfall.
//
// Both builds render this from their own markup -- the grid from the RECORD panel, the card from
// the row expander -- so the check reads whichever editor the build has and asserts on the CELL,
// never on "somewhere in the HTML". A figure found loose in the page is the check that once passed
// because the value it wanted was sitting in the next column.
{
  const name = 'directed vs drawn — a lane too short for what was directed';
  const SHORT = 6293317;
  const ASK = [246947793, 100813070, 63796828];
  const sc = {
    services: ['USAF', 'STOVL', 'USN'],
    items: [it('A', 'PSM', ASK.slice())],
    disc: [ASK[0], ASK[1] - SHORT, ASK[2]], mand: [0, 0, 0],
    order: ['A'],
    fsrc: { A: { m: 'split', dv: ASK.slice(), mv: [0, 0, 0] } },
  };
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  // The engine's answer first. Everything the editor prints is measured against this, never
  // against the editor's own other cells.
  const p = JSON.parse(ev(`(function(){ const p=tiers()['A'];
    return JSON.stringify({d:p.d, m:p.m, u:p.u, dT:p.dT}); })()`));
  chk(name, 'engine', 'the short lane funds only what it holds', p.d[1], ASK[1] - SHORT);
  chk(name, 'engine', 'and the remainder is unfunded', p.u[1], SHORT);
  chk(name, 'engine', 'the other services are untouched', p.u[0] + p.u[2], 0);

  const cell = JSON.parse(ev(`(function(){
    let html;
    if(typeof inspectorBody==='function'){                 // grid: the docked RECORD panel
      curRow='A';
      if(!document.getElementById('inspector')){
        const d=document.createElement('div'); d.id='inspector'; document.body.appendChild(d); }
      inspectorBody(); html=document.getElementById('inspector').innerHTML;
    } else { html=svcTable(itemById('A')); }               // card: the row expander
    const wrap=document.createElement('div'); wrap.innerHTML=html;
    // OWN text means the cell's own figure with the second-reading line removed -- reading the
    // whole cell would let 'directed $411,557,691' answer a question asked about the total.
    const read=function(td){
      const dr=td.querySelector('.drew');
      const own=[].slice.call(td.childNodes).filter(function(n){
        return !(n.classList && n.classList.contains('drew')); })
        .map(function(n){ return n.textContent; }).join('').trim();
      return {box:((td.querySelector('input')||{}).value||'').trim(), own:own,
              drew:(dr? dr.textContent : '').trim()}; };
    const t=wrap.querySelector('.insp-split');
    if(t){                                                  // one ROW per service
      const tr=[].slice.call(t.querySelectorAll('tr')).filter(function(r){
        return r.children[0] && r.children[0].textContent.trim()==='STOVL'; })[0];
      const tot=[].slice.call(t.querySelectorAll('tr')).filter(function(r){
        return r.children[0] && r.children[0].textContent.trim()==='TOTAL'; })[0];
      return JSON.stringify({svc:read(tr.children[2]), tot:read(tot.children[2])});
    }
    const rows=[].slice.call(wrap.querySelectorAll('tr'));   // card: one COLUMN per service
    const dr=rows.filter(function(r){ return r.children[0]
      && /Split .* Disc/.test(r.children[0].textContent); })[0];
    return JSON.stringify({svc:read(dr.children[2]), tot:read(dr.children[dr.children.length-1])});
  })()`));

  const money = s => Number(String(s).replace(/[^0-9.-]/g, '')) || 0;
  chk(name, 'editor', 'the box still holds the figure that was DIRECTED', money(cell.svc.box), ASK[1]);
  chk(name, 'editor', 'the same cell also states what was actually DRAWN',
    money(cell.svc.drew), ASK[1] - SHORT);
  // The editor's own two figures have to be the engine's arithmetic, or it is telling a different
  // story from the money it is reporting.
  chk(name, 'editor', 'directed minus drawn is exactly this service’s unfunded figure',
    money(cell.svc.box) - money(cell.svc.drew), p.u[1]);
  // And the column must foot: the total is what was drawn, and it says so when the cells above it
  // were directed higher. Without that second reading the column does not add up on screen.
  chk(name, 'editor', 'the column total is what was DRAWN', money(cell.tot.own), p.dT);
  chk(name, 'editor', 'and the total states the DIRECTED sum the cells above it add up to',
    money(cell.tot.drew), ASK.reduce((a, b) => a + b, 0));
}

// ═══ THE ALLOCATION IS THE CAP, AND IT HAS TO BE SETTABLE ═══════════════════════════════
// v1.61 made the ROW ALLOCATION the basis every draw is measured against. Every control that SETS
// it was behind a condition that a funding-source override switched off: the row's input went
// disabled, and the grid's RECORD panel carried a read-only "Allocated" field. So an overridden
// requirement -- which on a working board is most of them -- had no control anywhere for the one
// figure that now capped it. A directed dollar past a trimmed allocation could be typed, was
// silently refused, and came out as a UFR with nothing on screen able to clear it.
//
// It reached a brief on a PRIME CONTRACT, where the CLIN grid routinely leaves the row allocation
// under the ask: the record showed a service fully funded against its own request with $51,510,452
// of UFR beside it, and the editor's explanation -- "the lane could not supply the rest" -- named
// a lane still holding $704,562,659.
//
// Three things are checked here, and the first two are the ones that failed:
//   1. the editor names the limit that ACTUALLY refused the dollar, lane or allocation;
//   2. an overridden requirement has a LIVE allocation control, on the row and in the panel;
//   3. driving that control to the ask clears the UFR to exactly zero.
{
  const name = 'the allocation caps the draw — and can be raised';
  // The user's own figures. USAF is trimmed below its ask; the lane is deliberately flush, so
  // nothing but the allocation can be the limit.
  const ASK   = [246947793, 28251630, 50000000];
  const ALLOC = [195437341, 19759949, 50000000];
  const TRIM  = ASK[0] - ALLOC[0] + ASK[1] - ALLOC[1];
  const sc = {
    services: ['USAF', 'ANG', 'STOVL'],
    items: [it('A', 'PSM', ASK.slice())],
    disc: [900000000, 900000000, 900000000], mand: [0, 0, 0],
    order: ['A'],
    alloc: { A: { m: 's', v: ALLOC.slice() } },
    fsrc: { A: { m: 'split', dv: ASK.slice(), mv: [0, 0, 0] } },
  };
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  // The oracle is the scenario's own inputs: ask - allocation, per service, floored. Never read
  // back from tiers(), which is the thing under test.
  const p = JSON.parse(ev(`(function(){ const p=tiers()['A'], it=itemById('A');
    return JSON.stringify({d:p.d, u:p.u, unf:unfSvcOf(it,p), dRem:tiers().__rem.dRem}); })()`));
  chk(name, 'engine', 'the trimmed service draws its allocation and no more', p.d[0], ALLOC[0]);
  chk(name, 'engine', 'the shortfall is ask less allocation', p.unf[0], ASK[0] - ALLOC[0]);
  chk(name, 'engine', 'nothing is BEYOND — every allocated dollar was paid', p.u[0], 0);
  chk(name, 'engine', 'and the lane it is blamed on is still flush',
    p.dRem[0] > 0, true);

  // 1. THE SENTENCE. Two limits, two different sentences, and the wrong one sends a reader hunting
  //    money that was never the constraint.
  const says = JSON.parse(ev(`(function(){ const it=itemById('A'), P=tiers()['A'], b=basisSvcOf(it);
    const capped=drewLine(it.ask[0], P.d[0], b[0]);
    // The same cell with the lane as the binding limit instead: drawn short of the cap.
    const lane=drewLine(it.ask[0], b[0]-1, b[0]);
    const grab=function(h){ const m=/title="([^"]*)"/.exec(h); return m? m[1] : ''; };
    return JSON.stringify({capped:grab(capped), lane:grab(lane)}); })()`));
  chk(name, 'wording', 'an allocation-capped cell names the allocation',
    /allocation for this service stops at/.test(says.capped), true);
  chk(name, 'wording', 'and does not blame the lane', /lane could not supply/.test(says.capped), false);
  chk(name, 'wording', 'a lane-limited cell still blames the lane',
    /lane could not supply/.test(says.lane), true);

  // 2. THE CONTROL. On the ROW in both builds, and in the grid build's RECORD panel as well.
  //    "Present" is not enough: a disabled input is exactly the defect.
  const ctl = JSON.parse(ev(`(function(){
    render();
    const rowIn=[].slice.call(document.querySelectorAll('#list .row .acts input'))
      .filter(function(n){ return /setAlloc/.test(n.getAttribute('onchange')||''); });
    let panel=[];
    if(typeof inspectorBody==='function'){
      curRow='A';
      if(!document.getElementById('inspector')){
        const d=document.createElement('div'); d.id='inspector'; document.body.appendChild(d); }
      inspectorBody();
      panel=[].slice.call(document.querySelectorAll('#inspector input'))
        .filter(function(n){ return /setSvc\\(/.test(n.getAttribute('onchange')||''); });
    } else {
      const wrap=document.createElement('div'); wrap.innerHTML=svcTable(itemById('A'));
      panel=[].slice.call(wrap.querySelectorAll('input'))
        .filter(function(n){ return /setSvc\\(/.test(n.getAttribute('onchange')||''); });
    }
    return JSON.stringify({row:rowIn.length, rowDead:rowIn.filter(function(n){ return n.disabled; }).length,
      panel:panel.length, panelDead:panel.filter(function(n){ return n.disabled; }).length});
  })()`));
  chk(name, 'control', 'the row offers an allocation input under a ⚙ override', ctl.row, 1);
  chk(name, 'control', 'and it is not disabled', ctl.rowDead, 0);
  chk(name, 'control', 'the editor offers one allocation input per service', ctl.panel, sc.services.length);
  chk(name, 'control', 'and none of them is disabled', ctl.panelDead, 0);

  // 3. THE ROUND TRIP. Drive the control the way the input drives it and the UFR has to go.
  chk(name, 'round trip', 'the shortfall before is the whole trim',
    p.unf.reduce((a, b) => a + b, 0), TRIM);
  const after = JSON.parse(ev(`(function(){
    setSvc('A',0,'${ASK[0]}'); setSvc('A',1,'${ASK[1]}');
    const P=tiers()['A'], it=itemById('A');
    return JSON.stringify({unf:unfSvcOf(it,P).reduce(function(a,b){ return a+b; },0), dT:P.dT});
  })()`));
  chk(name, 'round trip', 'raising the allocation to the ask clears the shortfall', after.unf, 0);
  chk(name, 'round trip', 'and the discretionary draw is the whole requirement',
    after.dT, ASK.reduce((a, b) => a + b, 0));
}

// ═══ UNSPENT DISCRETIONARY vs THE TRIMS THAT COULD TAKE IT ══════════════════════════════
// The board states two facts and never joined them up: a lane holds BA nobody drew, and
// requirements are short. trimAbsorb() answers the question they raise together -- which trims the
// REMAINING lane could actually cover, and in what order.
//
// The order is the whole claim and the easiest thing to get wrong. Sorting by size would read as a
// promise the lane cannot keep: the lane pays top-down, so a row's figure only means anything if
// everything above it was raised first. And because money is not fungible across services, a
// service with spare lane money must not be shown covering another service's trim.
{
  const name = 'trim absorption — what the remaining lane could take';
  const sc = {
    services: SVC3,
    // A, B and C are all trimmed and all want USAF money. Only enough for one is left, so the
    // ORDER decides who is offered it -- the property worth protecting.
    //
    // C IS THE BIGGEST ASK AND THE THIRD PRIORITY, AND THAT IS DELIBERATE. The first version of
    // this fixture made A both the highest priority and the largest, so sorting by size and
    // walking the priority order produced the SAME answer -- trim-absorb-unordered survived the
    // sweep while the check sat there looking like it proved something. The two orders have to
    // DISAGREE or the check cannot tell them apart. C's allocation is unchanged, so the lane walk
    // is identical either way; only its trim, and its rank under a size sort, move.
    items: [it('A', 'ATL', [100, 50, 40]), it('B', 'PSM', [80, 30, 20]),
            it('C', 'AV', [400, 20, 60]), it('D', 'MxS', [40, 10, 10])],
    disc: [200, 90, 70], mand: [0, 0, 0],
    order: ['A', 'B', 'C', 'D'],
    alloc: { A: { m: 's', v: [70, 40, 30] }, B: { m: 's', v: [50, 20, 10] },
             C: { m: 's', v: [30, 10, 20] } },   // D is allocated its full ask
  };
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  const A = JSON.parse(ev(`(function(){ const T=tiers(), A=trimAbsorb(T);
    return JSON.stringify({start:A.start, left:A.left, taken:A.taken,
      rows:A.rows.map(function(x){ return {id:x.id, trim:x.trim, take:x.take, beyond:x.beyond}; })}); })()`));

  // The lane is the ceiling. Offering more than is left would name requirements that cannot be
  // funded, which is worse than not answering the question at all.
  SVC3.forEach((s, i) => {
    const placed = A.rows.reduce((a, r) => a + r.take[i], 0);
    chk(name, 'lane', `${s}: never places more than the lane has left`,
      placed <= A.start[i] + 0.005 ? 'ok' : `${placed} > ${A.start[i]}`, 'ok');
    chk(name, 'lane', `${s}: what was left, less what was placed, is what is still unspent`,
      A.start[i] - placed, A.left[i]);
    chk(name, 'lane', `${s}: the running total agrees with the per-row figures`, A.taken[i], placed);
  });

  A.rows.forEach(r => SVC3.forEach((s, i) => {
    chk(name, 'row', `${r.id}/${s}: never offers more than that row was trimmed by`,
      r.take[i] <= r.trim[i] + 0.005 ? 'ok' : `${r.take[i]} > ${r.trim[i]}`, 'ok');
    // trim splits into what a lane can reach and what it cannot. Those are different answers --
    // one is a reallocation, the other needs budget authority -- so they must not blur.
    chk(name, 'row', `${r.id}/${s}: trimmed by == could be funded + still beyond the lane`,
      r.trim[i], r.take[i] + r.beyond[i]);
  }));

  // PRIORITY ORDER, stated as the thing a reader would check by hand. USAF has 10 left and three
  // rows want it; the first one in the order is the one offered it.
  const usafTakers = A.rows.filter(r => r.take[0] > 0.005).map(r => r.id);
  // C is trimmed by far the most and asks for far the most; A is simply earlier. A must win.
  chk(name, 'order', 'the earliest trimmed row gets first call on the lane, not the biggest',
    usafTakers.join(','), 'A');
  chk(name, 'order', 'and a row below it is offered nothing once the lane is spent',
    (A.rows.filter(r => r.id === 'B')[0] || {}).take[0], 0);
  // Whole dollars here too: this list is read as an instruction to type a figure into a box.
  chk(name, 'whole dollars', 'every figure offered is a whole dollar',
    A.rows.every(r => r.take.every(Number.isInteger) && r.trim.every(Number.isInteger))
      ? 'ok' : 'fractional', 'ok');

  chk(name, 'scope', 'a requirement allocated its full ask is not listed at all',
    A.rows.some(r => r.id === 'D') ? 'D is listed' : 'ok', 'ok');
  chk(name, 'scope', 'every trimmed requirement IS listed', A.rows.length, 3);
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
