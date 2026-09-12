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
  chk(name, 'tile · Whole budget', 'unfunded beyond the whole budget',
    grab('tile · Whole budget', 'unfunded', '.sc.whole', /\$([\d,]+) unfunded beyond it/), uAmtExp);

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
