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
            // D DIRECTS DISCRETIONARY INTO A LANE C HAS ALREADY EMPTIED, while the mandatory lane
            // is still flush — the only shape that tells a one-guard natU from a two-guard one.
            // It used to under-direct mandatory instead and let the undirected remainder strand,
            // which stopped being unfunded-beyond-the-lanes when a directed split started stating
            // its own allocation: an undirected dollar is a TRIM, and a trim is nobody's cutline.
            // Its STOVL mandatory draw comes off that dry lane, which is what puts the cutline
            // on this row; the dollars it directed to the dry DISCRETIONARY lane strand beside it.
            D: { m: 'split', dv: [500, 200, 100], mv: [500, 0, 0] } },
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
  // The year copy is NOT asserted here. 'mipr' is on yearCopy()'s normalise list, and
  // `copy / move between years` in audit-import.mjs reads that list out of the board's own source
  // and proves every container in it actually receives data. Restating it here would be a second
  // check of the same thing that could drift from the first -- and the tautology this replaced
  // ("'listed' : 'listed'") asserted nothing at all while looking like it did.
}

// ═══ A BULK WRITE LANDS ONLY WHERE THE FIELD IS OFFERED ══════════════════════════════════════════════════════
// BACKLOG entry 7. matApplyBulk() wrote to every row matRows() returned, whether or not that
// requirement offered the field: a bulk MIPR type with no missing-field filter set landed on every
// prime, where the record panel never shows it, and the value was real -- in S.mipr, travelling in
// a submittal and a year copy, with nothing on screen saying so. The obvious fix (skip rows whose
// recFields() lacks the label) was wrong: the per-service budget setters are bulk-only entries with
// no matching label and would have been silently no-op'd. So each entry says for itself who it
// applies to, and the default is everyone.
{
  const name = 'a bulk write lands only where the field is offered';
  const sc = {
    services: SVC3,
    items: [it('A', 'PSM', [100, 50, 40]), it('B', 'PSM', [80, 30, 20]), it('C', 'AV', [60, 20, 10])],
    disc: [300, 100, 70], mand: [0, 0, 0], order: ['A', 'B', 'C'],
  };
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  // A goes to a government activity (an OGC), B straight to a prime, C has no destination yet.
  ev(`setDest('A','to','pax'); setDest('B','to','lm'); 'ok'`);
  chk(name, 'fixture', 'only A offers MIPR type on its record',
    ev(`JSON.stringify(['A','B','C'].filter(function(id){
      return recFields(id, itemById(id)).some(function(f){ return f.l==='MIPR type'; }); }))`),
    JSON.stringify(['A']));

  // THE PREVIEW SAYS WHO IS REACHED AND WHO IS LEFT ALONE, before anything is written.
  ev(`matPmo='ALL'; matMissing=''; matSet('bulkF','MIPR type'); matSet('bulkV','direct'); 'ok'`);
  const P = JSON.parse(ev(`JSON.stringify(matBulkPreview())`));
  chk(name, 'preview', 'it reaches the one requirement that offers the field', P.n, 1);
  chk(name, 'preview', 'and says how many never offer it', P.skip, 2);

  // THE WRITE LANDS ON A AND NOWHERE ELSE. B is a prime and C is unrouted; neither has a MIPR
  // type on its record, so a value in S.mipr for either is a value nothing on screen can show.
  ev(`matApplyBulk(); 'ok'`);
  chk(name, 'write', 'the OGC takes the classification', ev(`miprOf('A')`), 'direct');
  chk(name, 'write', 'the prime does not', ev(`miprOf('B')||'(none)'`), '(none)');
  chk(name, 'write', 'nor does the unrouted requirement', ev(`miprOf('C')||'(none)'`), '(none)');
  chk(name, 'write', 'and the store holds exactly one entry',
    ev(`JSON.stringify(Object.keys(S.mipr||{}))`), JSON.stringify(['A']));

  // 'Which awards to' is the other gated field, and it has been landing on primes since it shipped.
  ev(`matSet('bulkF','Which awards to'); matSet('bulkV','dla'); matApplyBulk(); 'ok'`);
  chk(name, 'second hop', 'the OGC takes the ultimate recipient', ev(`destOf(itemById('A')).end`), 'dla');
  chk(name, 'second hop', 'the prime does not', ev(`destOf(itemById('B')).end||'(none)'`), '(none)');

  // AN ENTRY WITH NO applies() STILL REACHES EVERYONE -- the fix must not have narrowed the sweep
  // for the fields every requirement offers, which is the trap the obvious fix would have fallen
  // into. Obligation category is offered on every record.
  ev(`matSet('bulkF','Obligation category'); matSet('bulkV',OB_CATS[0]); 'ok'`);
  const Q = JSON.parse(ev(`JSON.stringify(matBulkPreview())`));
  chk(name, 'ungated', 'a field every requirement offers reaches all three', Q.n, 3);
  chk(name, 'ungated', 'and leaves none alone', Q.skip, 0);
  ev(`matApplyBulk(); 'ok'`);
  chk(name, 'ungated', 'and lands on all three',
    ev(`['A','B','C'].filter(function(id){ return obCatOf(id)===OB_CATS[0]; }).length`), 3);
  // The per-service budget setters are bulk-only -- no record label -- and must still be offered.
  chk(name, 'ungated', 'the bulk-only per-service budget setters are still in the sweep',
    ev(`Object.keys(matBulk()).some(function(k){ return k.indexOf('\u21b3 ')===0; })`), true);

  // THE SECOND-HOP CONTROL IS OFFERED FOR EVERY NON-PRIME KIND, not only 'gov'. BACKLOG entry 1's
  // completeness rule cannot be satisfied for an 'other' destination otherwise, and the two gates
  // (MIPR type, Which awards to) are one predicate so they cannot drift.
  ev(`flowAddEnt(); var L=flowEnts(); flowSetEnt(L.length-1,'kind','other'); 'ok'`);
  const other = ev(`(function(){ var L=flowEnts(); return L[L.length-1].k; })()`);
  ev(`setDest('C','to','${other}'); 'ok'`);
  chk(name, 'other kind', 'a requirement routed to an other-kind destination is an OGC',
    ev(`destIsOgc(itemById('C'))`), true);
  chk(name, 'other kind', 'and its record offers the second hop',
    ev(`recFields('C', itemById('C')).some(function(f){ return f.l==='Which awards to'; })`), true);
  chk(name, 'other kind', 'and MIPR type, off the same predicate',
    ev(`recFields('C', itemById('C')).some(function(f){ return f.l==='MIPR type'; })`), true);
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
    // The label lost its "Split \u2014" prefix when the Disc and Mand rows stopped being gated
    // behind a conversion: they render on every requirement now, converted or not.
    const dr=rows.filter(function(r){ return r.children[0]
      && /Disc \\$ \\(edit\\)/.test(r.children[0].textContent); })[0];
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

// ═══ A DIRECTED SPLIT STATES ITS OWN ALLOCATION ═════════════════════════════════════════
// Two figures used to claim the same decision. A per-service directed split says, per service,
// exactly how many Disc and Mand dollars go against a requirement -- and a ROW ALLOCATION sat
// beside it saying the same thing in a different number. v1.61 made that row allocation the basis
// every draw was capped at, which meant the typed figure was silently refused whenever the two
// disagreed; v1.62 made the allocation editable everywhere, which fixed the trap but left the
// second authority in place. It is gone now: for a per-service split, svcAlloc() reads the directed
// dollars. There is one number, the one that was typed.
//
// What follows from that, and is checked here:
//   1. the draw follows what was DIRECTED, whatever the row allocation says;
//   2. what was NOT directed is a TRIM -- not "beyond both lanes", which is what a reader is told
//      when a lane could not pay. With flush lanes nothing is beyond, however deep the trim;
//   3. a lane that genuinely cannot pay still reads as a lane shortfall, and says so;
//   4. the CLIN grid feeds none of it, and offers no button that would;
//   5. a non-split funding source still draws against the row allocation, and that allocation is
//      still settable -- the v1.62 fix, which those requirements still need.
{
  const name = 'a directed split states its own allocation';
  const ASK = [1177300843, 244413277, 61976846];
  const DV  = [ 931629547, 244413277, 61976846];
  const MV  = [  56322052,         0,        0];
  // The row allocation is set to a THIRD figure, unrelated to either the ask or what is directed.
  // Nothing below may depend on it.
  const ALLOC = ASK.map(v => Math.round(v * 0.4));
  const DIRECTED = DV.map((v, i) => v + MV[i]);
  const TRIM = ASK.reduce((a, v, i) => a + (v - DIRECTED[i]), 0);
  const sc = {
    services: ['USAF', 'ANG', 'AFRC'],
    items: [it('A', 'PSM', ASK.slice())],
    disc: ASK.map(v => v * 3), mand: ASK.map(v => v * 3),   // deliberately flush
    order: ['A'],
    alloc: { A: { m: 's', v: ALLOC.slice() } },
    fsrc: { A: { m: 'split', dv: DV.slice(), mv: MV.slice() } },
  };
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  const read = () => JSON.parse(ev(`(function(){ const it=itemById('A'), p=tiers()['A'];
    return JSON.stringify({ alloc:svcAlloc(it), basis:basisSvcOf(it), d:p.d, m:p.m, u:p.u,
      unf:unfSvcOf(it,p), trim:trimSvcOf(it) }); })()`));
  const S = a => a.reduce((x, y) => x + y, 0);
  let r = read();

  // 1. THE DIRECTED DOLLARS ARE THE ALLOCATION, and the row allocation is not consulted.
  chk(name, 'allocation', 'the allocation is what was directed, per service',
    r.alloc.join('|'), DIRECTED.join('|'));
  chk(name, 'allocation', 'and it is not the row allocation', r.alloc.join('|') === ALLOC.join('|'), false);
  chk(name, 'draw', 'discretionary drawn is what was directed', S(r.d), S(DV));
  chk(name, 'draw', 'mandatory drawn is what was directed', S(r.m), S(MV));
  chk(name, 'draw', 'the trimmed row allocation held nothing back', S(r.d) + S(r.m) > S(ALLOC), true);

  // 2. UNDIRECTED IS A TRIM. This is the line the user reads: "lane short" says a lane could not
  //    pay, and on flush lanes that is a false statement about where the money went.
  chk(name, 'naming', 'nothing is beyond both lanes', S(r.u), 0);
  chk(name, 'naming', 'the undirected remainder is the trim', S(r.trim), TRIM);
  chk(name, 'naming', 'total unfunded is exactly that trim', S(r.unf), TRIM);
  sc.services.forEach((sv, i) => chk(name, 'naming',
    `${sv}: beyond + trim == unfunded`, r.u[i] + r.trim[i], r.unf[i]));
  chk(name, 'identity', 'd + m + u == the basis', S(r.d) + S(r.m) + S(r.u), S(r.basis));

  // 3. RAISING WHAT IS DIRECTED RAISES THE DRAW, with no allocation to change first.
  r = (ev(`setFsrcSvc('A','d',0,'${ASK[0] - MV[0]}'); 'ok'`), read());
  chk(name, 'round trip', 'directing the full ask draws the full ask', S(r.d) + S(r.m), S(ASK));
  chk(name, 'round trip', 'and the shortfall is gone', S(r.unf), 0);

  // 4. A LANE THAT GENUINELY CANNOT PAY still reads as one, and says so rather than blaming a
  //    figure the reader could have changed.
  const SHORT = 6293317;
  const { ev: ev2 } = boot();
  seed(ev2, { ...sc, disc: [DV[0] - SHORT, ASK[1] * 3, ASK[2] * 3] });
  const lane = JSON.parse(ev2(`(function(){ const it=itemById('A'), p=tiers()['A'], b=basisSvcOf(it);
    const grab=function(h){ const m=/title="([^"]*)"/.exec(h); return m? m[1] : ''; };
    return JSON.stringify({ u:p.u, d:p.d, say:grab(drewLine(S.fsrc['A'].dv[0], p.d[0], b[0])) }); })()`));
  chk(name, 'lane', 'the short lane pays only what it holds', lane.d[0], DV[0] - SHORT);
  chk(name, 'lane', 'and that shortfall IS beyond both lanes', lane.u[0], SHORT);
  chk(name, 'lane', 'the cell blames the lane', /lane could not supply/.test(lane.say), true);
  // THE TWO SENTENCES, stated directly. A cell that drew everything its cap allowed was stopped by
  // the cap; one that drew less than its cap was stopped by the lane. Both readings still exist --
  // a forced source (Disc, Mand, UFR or a legacy split) still draws against the row allocation, so
  // a cap can still be the thing that refused the dollar there.
  const why = JSON.parse(ev(`(function(){
    const grab=function(h){ const m=/title="([^"]*)"/.exec(h); return m? m[1] : ''; };
    return JSON.stringify({ capped:grab(drewLine(100, 60, 60)), lane:grab(drewLine(100, 60, 80)) });
  })()`));
  chk(name, 'wording', 'drawn up to its cap names the allocation',
    /allocation for this service stops at/.test(why.capped), true);
  chk(name, 'wording', 'and does not blame the lane', /lane could not supply/.test(why.capped), false);
  chk(name, 'wording', 'drawn short of its cap names the lane',
    /lane could not supply/.test(why.lane), true);
  chk(name, 'wording', 'and does not blame the allocation',
    /allocation for this service stops at/.test(why.lane), false);

  // 5. THE CLIN GRID FEEDS NOTHING. Moving every line in it must move no figure at all, and the
  //    button that would write the grid into the funding math is not offered on a split.
  const clin = JSON.parse(ev(`(function(){
    if(!S.ptype) S.ptype={}; S.ptype['A']='PRIME';
    if(!S.clinNew) S.clinNew={};
    S.clinNew['A']=[{key:'n1', clin:'0001', desc:'line', ccar:'', ask:[100,200,300]}];
    const before=JSON.stringify(tiers()['A']);
    clinVec('A', clinList('A')[0])[0] = 999999999;      // move the grid as far as it will go
    const after=JSON.stringify(tiers()['A']);
    const html=clinTable(itemById('A'));
    return JSON.stringify({ same: before===after, splitRow: clinSplitRow('A'),
      offersApply: html.indexOf('clinToRow')>=0, saysItFeedsNothing: html.indexOf('feeds none of the funding math')>=0 });
  })()`));
  chk(name, 'clin', 'the drill knows this row states its own allocation', clin.splitRow, true);
  chk(name, 'clin', 'moving the whole CLIN grid moves no figure', clin.same, true);
  chk(name, 'clin', 'and the grid is not offered a way into the funding math', clin.offersApply, false);
  chk(name, 'clin', 'the drill says so in words', clin.saysItFeedsNothing, true);

  // 6. THE ROW CONTROL. A split shows a DERIVED allocation -- never an input that writes somewhere
  //    nothing reads. Every OTHER funding source still draws against the row allocation, so that
  //    one stays live: that is the v1.62 trap fix, and those requirements still depend on it.
  const ctl = JSON.parse(ev(`(function(){
    const pick=function(){ render();
      const n=[].slice.call(document.querySelectorAll('#list .row .acts input'))
        .filter(function(x){ return !x.className || /svcmode|^$/.test(x.className); });
      return n[n.length-1]; };
    S.fsrc['A']={m:'split', dv:${JSON.stringify(DV)}, mv:${JSON.stringify(MV)}};
    const a=pick();
    S.fsrc['A']={m:'disc'};
    const b=pick();
    return JSON.stringify({ splitDead:!!(a&&a.disabled), splitShows:a? a.value:'',
      forcedLive:!!(b&&!b.disabled&&/setAlloc/.test(b.getAttribute('onchange')||'')) });
  })()`));
  chk(name, 'control', 'a split shows its allocation rather than offering a dead input', ctl.splitDead, true);
  chk(name, 'control', 'and what it shows is the directed total',
    Number(String(ctl.splitShows).replace(/[^0-9]/g, '')), S(DIRECTED));
  chk(name, 'control', 'a forced-source requirement keeps a live allocation input', ctl.forcedLive, true);
  // AND THAT INPUT HAS TO WRITE. A live control that changes no figure is the same defect wearing
  // a different face: this is the v1.62 trap, which a forced source can still fall into because it
  // states only WHERE its money comes from, never how much.
  const forced = JSON.parse(ev(`(function(){
    S.fsrc['A']={m:'disc'}; S.alloc['A']=null;
    const full=tiers()['A'].dT;
    setAlloc('A', String(Math.round(askTot(itemById('A'))/2)));
    const half=tiers()['A'].dT;
    return JSON.stringify({full:full, half:half, ask:askTot(itemById('A'))});
  })()`));
  chk(name, 'control', 'a forced source draws its full ask with no allocation set', forced.full, forced.ask);
  chk(name, 'control', 'and typing an allocation moves the draw',
    forced.half, Math.round(forced.ask / 2));
}


// ═══ "UNFUNDED" MEANS THE SAME THING ON EVERY SURFACE THAT SAYS IT ══════════════════════
// The board holds two ask-based readings and one lane reading, and only the first two may ever be
// printed under the word UNFUNDED:
//
//   unfSvcOf()      ask - discretionary - mandatory      what the requirement is short
//   discUnfSvcOf()  ask - discretionary                  what one pot leaves short
//   p.u / beyondSvcOf()   basis - drawn                  ALLOCATED, and no lane could pay it
//
// p.u is strictly smaller: it says nothing about ask that was never allocated. Seven surfaces
// summed it and labelled the result "Unfunded" — the service lane table and the chart above it,
// the PMO matrix, the cost-element rollup, the team table, the must-pay warning on the scoreboard,
// and a board-wide vector in the workbook. On a board whose requirements are hand-directed below
// their ask with flush lanes, p.u is ZERO on every one of them, so the panels read $0 unfunded per
// service while the record beside them showed hundreds of millions. Reported from a live board.
//
// The scenario is built so the two readings CANNOT be confused: beyond is exactly zero everywhere,
// so any surface still reading it prints a figure that is wrong by the whole shortfall.
{
  const name = 'unfunded means the same thing on every surface';
  const ASK = [1000, 300, 200];
  const DV  = [ 700, 300, 200];          // hand-directed below the ask on USAF only
  const SHORT = ASK[0] - DV[0];
  const sc = {
    services: ['USAF', 'ANG', 'STOVL'],
    items: [it('A', 'PSM', ASK.slice(), { team: 'ATL' })],
    disc: [5000, 5000, 5000], mand: [5000, 5000, 5000],   // deliberately flush: nothing is beyond
    order: ['A'],
    mc: { A: true },
    fsrc: { A: { m: 'split', dv: DV.slice(), mv: [0, 0, 0] } },
  };
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  const truth = JSON.parse(ev(`(function(){ const A=itemById('A'), p=tiers()['A'];
    return JSON.stringify({ beyond:p.u, unf:unfSvcOf(A,p) }); })()`));
  const S = a => a.reduce((x, y) => x + y, 0);
  chk(name, 'setup', 'nothing at all is beyond both lanes', S(truth.beyond), 0);
  chk(name, 'setup', 'and the requirement is short by what was not directed', S(truth.unf), SHORT);

  // Every panel is driven for real and read out of the DOM: a figure that is right in a helper and
  // wrong on the panel is the defect, so the helper is never asked what the panel says.
  const read = (call, el, col) => JSON.parse(ev(`(function(){
    try{ ${call} }catch(e){ return JSON.stringify({err:String(e.message)}); }
    const n=document.getElementById('${el}'); if(!n) return JSON.stringify({err:'no #${el}'});
    const rows=[].slice.call(n.querySelectorAll('tr')).map(function(tr){
      return [].slice.call(tr.children).map(function(td){ return td.textContent.trim(); }); });
    const hdr=rows[0]||[]; const c=hdr.indexOf('${col}');
    if(c<0) return JSON.stringify({err:'no column ${col} in '+JSON.stringify(hdr)});
    const money=function(v){ return Number(String(v).replace(/[^0-9.-]/g,''))||0; };
    const tot=rows.filter(function(r){ return /^TOTAL/i.test(r[0]||''); })[0];
    return JSON.stringify({ total: tot? money(tot[c]) : null,
      cells: rows.slice(1).filter(function(r){ return !/^TOTAL/i.test(r[0]||''); })
                 .map(function(r){ return money(r[c]); }) });
  })()`));

  const lane = read('gsOpen=true; svcSummary();', 'gsBody', 'Unfunded');
  chk(name, 'service lane table', 'it rendered', lane.err || 'ok', 'ok');
  if (!lane.err) {
    chk(name, 'service lane table', 'the TOTAL unfunded is the ask-based figure', lane.total, SHORT);
    chk(name, 'service lane table', 'and the short service carries it', lane.cells[0], SHORT);
    chk(name, 'service lane table', 'it is not BEYOND, which is zero here', lane.total === 0, false);
  }

  // The team panel only exists on a board that carries teams, so turn them on rather than let the
  // check pass on a panel that was never drawn.
  const team = read('DATA.teams=true; teamOpen=true; teamSummary();', 'teamBody', 'Unfunded');
  chk(name, 'team table', 'it rendered', team.err || 'ok', 'ok');
  if (!team.err) {
    chk(name, 'team table', 'the team unfunded is the ask-based figure', S(team.cells), SHORT);
    chk(name, 'team table', 'it is not BEYOND, which is zero here', S(team.cells) === 0, false);
  }

  // The scoreboard's must-pay warning. A is starred, so the line has to state the same shortfall.
  const mcLine = ev(`(function(){
    scoreboard();
    const t=(document.getElementById('scoreboard')||document.body).textContent;
    const m=/of the must-pay total is UNFUNDED/.test(t);
    const f=/⚠\\s*\\$([\\d,]+) of the must-pay total/.exec(t);
    return JSON.stringify({shown:m, amt:f? Number(f[1].replace(/,/g,'')) : null});
  })()`);
  const mc = JSON.parse(mcLine);
  chk(name, 'scoreboard', 'the must-pay warning states the ask-based shortfall',
    mc.shown ? mc.amt : 'not shown', SHORT);
}

// ═══ EVERY REQUIREMENT'S DISC AND MAND ARE TYPED — NO MODE SWITCH FIRST ═════════════════
// The Disc and Mand cells used to go read-only until a requirement had been converted to an
// explicit Split, with the editor telling the reader to go and flip a setting. That made the
// automatic lane walk a gate in front of the one decision this editor exists for, on a board whose
// stated direction is that every requirement carries an explicit split.
//
// The conversion is not free to get wrong: it must move NO money. setFsrcSvc() seeds the split from
// the draw the lane walk was already producing, so only the typed service changes.
{
  const name = 'every requirement takes a typed Disc and Mand';
  const ASK = [1000, 300, 200];
  // THE DRAW MUST NOT EQUAL THE ASK, or a seed that re-bases on the ask is the IDENTITY and the
  // check that exists to catch it cannot. The first version of this fixture funded A in full; the
  // mutation SURVIVED, which is this repo's third fixture-cannot-reach-its-target. USAF is trimmed
  // on the row allocation so the lane walk draws 800 of its 1000 ask.
  const TRIM_TO = 800;
  const sc = { services: ['USAF', 'ANG', 'STOVL'],
    items: [it('A', 'PSM', ASK.slice())],
    alloc: { A: { m: 's', v: [TRIM_TO, ASK[1], ASK[2]] } },
    disc: [5000, 5000, 5000], mand: [5000, 5000, 5000], order: ['A'] };   // NO fsrc at all
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));

  const ed = JSON.parse(ev(`(function(){
    render();
    let html;
    if(typeof inspectorBody==='function'){
      curRow='A';
      if(!document.getElementById('inspector')){
        const d=document.createElement('div'); d.id='inspector'; document.body.appendChild(d); }
      inspectorBody(); html=document.getElementById('inspector').innerHTML;
    } else { html=svcTable(itemById('A')); }
    const w=document.createElement('div'); w.innerHTML=html;
    const ins=[].slice.call(w.querySelectorAll('input'))
      .filter(function(n){ return /setFsrcSvc/.test(n.getAttribute('onchange')||''); });
    return JSON.stringify({ n:ins.length, dead:ins.filter(function(n){ return n.disabled; }).length,
      gated:/set funding to Split/.test(html),
      filled:ins.filter(function(n){ return String(n.value||'').replace(/[^0-9]/g,'').length>0; }).length });
  })()`));
  chk(name, 'editor', 'one Disc and one Mand box per service, with no source recorded',
    ed.n, sc.services.length * 2);
  chk(name, 'editor', 'none of them is disabled', ed.dead, 0);
  chk(name, 'editor', 'and nothing tells the reader to go and flip a setting first', ed.gated, false);
  chk(name, 'editor', 'the boxes hold what the lane walk drew', ed.filled, sc.services.length);

  const before = JSON.parse(ev(`(function(){ const p=tiers()['A'], A=itemById('A');
    return JSON.stringify({dT:p.dT, d:p.d, m:p.m, unf:unfSvcOf(A,p), src:!!S.fsrc['A']}); })()`));
  chk(name, 'before', 'the requirement starts on the automatic lane walk', before.src, false);
  // THE PROPERTY THAT MAKES THE REST OF THIS BLOCK ABLE TO FAIL. State it, do not assume it.
  chk(name, 'before', 'and the lane walk draws LESS than the ask somewhere',
    before.d[0] < ASK[0] ? 'yes' : `no — drew ${before.d[0]} of ${ASK[0]}`, 'yes');
  chk(name, 'before', 'the trimmed service draws its allocation', before.d[0], TRIM_TO);

  // TYPED INTO A SERVICE THAT IS NOT THE TRIMMED ONE, so the untouched-service assertions below are
  // measured against a figure a bad seed would move.
  const TYPED = 250, AT = 1;
  ev(`setFsrcSvc('A','d',${AT},'${TYPED}'); 'ok'`);
  const after = JSON.parse(ev(`(function(){ const p=tiers()['A'], A=itemById('A');
    return JSON.stringify({dT:p.dT, d:p.d, m:p.m, unf:unfSvcOf(A,p),
      src:(S.fsrc['A']||{}).m, dv:S.fsrc['A'].dv, mv:S.fsrc['A'].mv}); })()`));
  chk(name, 'after', 'the first keystroke converts the requirement', after.src, 'split');
  chk(name, 'after', 'the typed service holds what was typed', after.d[AT], TYPED);
  chk(name, 'after', 'the typed service is short by exactly what was given up',
    after.unf[AT], ASK[AT] - TYPED);
  // NOTHING ELSE MOVED. This is the whole risk of converting on a keystroke: a seed that rounds,
  // reprorates or re-bases on the ask would change figures the user never touched, on a board they
  // are about to brief. The trimmed service is the one that would move, so it is named.
  sc.services.forEach((sv, i) => { if (i === AT) return;
    chk(name, 'after', `${sv}: its discretionary draw is untouched`, after.d[i], before.d[i]);
    chk(name, 'after', `${sv}: and its shortfall is untouched`, after.unf[i], before.unf[i]);
  });
  chk(name, 'after', 'the seed recorded the draw, not the ask', after.dv[0], TRIM_TO);
}

// ═══ THE PMO MENU IS THE ONE PLACE THE OFFICES ARE CHOSEN ═══════════════════════════════
// The offices and the prime/OGC filter used to be chips beside the search box, and the prime filter
// was ALSO in the Filter menu -- two homes for one control. They are one menu now, which moves a
// selection that used to be visible at a glance behind a click. So the button has to say what is
// selected, or the board shows one office's requirements while looking like it shows all of them.
{
  const name = 'the PMO menu';
  const sc = {
    services: ['USAF', 'ANG', 'STOVL'],
    items: [it('A', 'AV', [900, 200, 100]), it('B', 'AV', [400, 100, 50]),
            it('C', 'PSM', [300, 80, 40]),  it('D', 'MxS', [200, 50, 25])],
    disc: [2000, 600, 300], mand: [500, 150, 80], order: ['A', 'B', 'C', 'D'],
  };
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  // applyState() seeds the per-office rankings from the items, and seed() pushes the fixture's
  // items AFTER it -- so in this harness they are empty and filtering to an office renders nothing.
  // Seed them the way the board does, or the filter check would be testing the harness.
  ev(`S.pmoOrder={}; GROUPS.forEach(function(g){
        S.pmoOrder[g]=S.order.filter(function(id){ const i=itemById(id); return i&&grpOf(i)===g; }); });
      'ok'`);

  const look = () => JSON.parse(ev(`(function(){
    render();
    const dd=document.getElementById('dd_pmo'), b=document.getElementById('b_pmo');
    if(!dd||!b) return JSON.stringify({err:'no PMO menu'});
    return JSON.stringify({
      button: b.textContent.trim(),
      items: [].slice.call(dd.querySelectorAll('.mi')).map(function(n){
        return n.textContent.replace(/\\s+/g,' ').trim(); }),
      chips: (document.getElementById('chips')||{}).innerHTML || '',
      viewMenu: (document.getElementById('dd_view')||{}).textContent || ''
    });
  })()`));

  let m = look();
  chk(name, 'menu', 'the board has a PMO menu', m.err || 'ok', 'ok');
  // ONE HOME. The chips are gone and the prime filter left the Filter menu with them.
  chk(name, 'one home', 'the chip strip no longer carries the offices', m.chips, '');
  chk(name, 'one home', 'and the Filter menu no longer carries Prime Contracts',
    /Prime Contracts/.test(m.viewMenu), false);
  // The ticked entry carries a check mark before its label, so this matches inside the text.
  chk(name, 'menu', 'it offers the whole portfolio',
    m.items.some(x => /All programme offices/.test(x)), true);
  // EVERY OFFICE THAT HAS REQUIREMENTS, WITH ITS COUNT -- derived from grpOf(), so a reassignment
  // or an added office is counted the moment it happens rather than when somebody remembers.
  ['PSM 1', 'AV 2', 'MxS 1'].forEach(want =>
    chk(name, 'counts', `it offers ${want.split(' ')[0]} with its count`,
      m.items.some(x => x.indexOf(want) === 0), true));
  // AN EMPTY OFFICE IS STILL OFFERED. Hiding it -- what the chips did -- means somebody who has
  // just added one goes looking and reads the absence as a failure.
  chk(name, 'empty offices', 'an office with nothing in it is still listed',
    m.items.some(x => /^ATL/.test(x)), true);
  chk(name, 'empty offices', 'and says so rather than showing a bare zero',
    m.items.some(x => /^ATL/.test(x) && /no requirements/.test(x)), true);

  // THE BUTTON SAYS WHAT IS SELECTED.
  chk(name, 'button', 'with nothing picked it names the menu', /PMO/.test(m.button), true);
  ev(`setPmoFilter('PSM'); 'ok'`);   m = look();
  chk(name, 'button', 'picking an office puts it on the button', /PSM/.test(m.button), true);
  // The filter really is applied, not just displayed: the rendered list holds PSM's one row.
  chk(name, 'button', 'and the list is filtered to it',
    Number(ev(`document.querySelectorAll('#list .row').length`)), 1);
  ev(`ptypeFilter='PRIME'; 'ok'`);   m = look();
  chk(name, 'button', 'a contract-type filter shows on the button too',
    /Primes/.test(m.button), true);
  ev(`filter='ALL'; ptypeFilter=''; 'ok'`);

  // ORDER MATTERS FROM HERE DOWN, AND THE NEXT CHECK IS WHY.
  // pmoSave() below runs applyState(), which rebuilds DATA.items from the baseline -- and this
  // harness pushes its fixture in AFTER applyState, so the baseline is empty and the board is left
  // with no requirements at all. Everything that counts, filters or moves a requirement has to
  // happen BEFORE that call. This assertion is the tripwire: move the reassignment checks below
  // pmoSave and they stop testing an empty board silently and fail here instead.
  chk(name, 'reassign', 'the board still holds its requirements at this point',
    Number(ev(`DATA.items.length`)), 4);
  // A REASSIGNMENT MOVES THE REQUIREMENT, NOT JUST ITS LABEL.
  //
  // Everything above this reads offices straight out of the fixture, where the overlay and the
  // file agree -- so counting by grpOf() and counting by the file's own i.grp give the SAME
  // answer, and a mutation that swapped one for the other sailed through. The comment on the
  // count checks claimed a reassignment showed up 'the moment it happens'; nothing here had ever
  // reassigned anything. The two readings have to DISAGREE before any of this proves a thing.
  //
  // So move one: A is homed to AV in the payload and sent to MxS by hand. From here on the file
  // says AV and the board must say MxS everywhere.
  const before = look();
  chk(name, 'reassign', 'before the move the offices hold their payload counts',
    ['AV 2', 'MxS 1'].every(w => before.items.some(x => x.indexOf(w) === 0)), true);
  ev(`setGrp('A','MxS'); 'ok'`);
  m = look();
  chk(name, 'reassign', 'the requirement now answers with the office it was moved to',
    ev(`grpOf(itemById('A'))`), 'MxS');
  // THE PAYLOAD IS NOT REWRITTEN. The move is an overlay for this year, which is what lets the
  // record editor say where it came from and what makes the next import a merge rather than a
  // fight. If this ever starts returning MxS, the move has scribbled on the baseline.
  chk(name, 'reassign', 'without the payload being rewritten underneath it',
    ev(`itemById('A').grp`), 'AV');
  // THE COUNTS FOLLOW IT -- both ends, in the same render. Counting the office it left is what
  // catches a count that reads the file: the office it joined can be right by accident.
  chk(name, 'reassign', 'the office it left is one lighter',
    m.items.some(x => x.indexOf('AV 1') === 0), true);
  chk(name, 'reassign', 'and the office it joined is one heavier',
    m.items.some(x => x.indexOf('MxS 2') === 0), true);
  // AND IT IS A REAL MOVE, not a relabelled row: filtering to the new office lists it.
  ev(`setPmoFilter('MxS'); 'ok'`);
  chk(name, 'reassign', 'filtering to the new office lists both requirements',
    Number(ev(`document.querySelectorAll('#list .row').length`)), 2);
  ev(`setPmoFilter('AV'); 'ok'`);
  chk(name, 'reassign', 'and the office it left no longer lists it',
    ev(`!!document.getElementById('row-A')`), false);
  ev(`setPmoFilter('ALL'); 'ok'`);
  // EVERY SURFACE THAT LISTS AN OFFICE. The workbook decides which PMO tabs to emit, and which
  // rows land on each, with this same predicate -- so a move that stopped here would print the
  // requirement on the wrong tab of the thing that gets briefed.
  chk(name, 'reassign', 'the offices that have requirements are derived the same way',
    ev(`JSON.stringify(GROUPS.filter(function(g){
          return DATA.items.some(function(i){ return grpOf(i)===g; }); }))`),
    JSON.stringify(['PSM', 'AV', 'MxS']));   // configured order, not the order the fixture lists
  chk(name, 'reassign', 'and the moved requirement belongs to the tab it was sent to',
    ev(`DATA.items.filter(function(i){ return grpOf(i)==='MxS'; })
          .map(function(i){ return i.id; }).sort().join(',')`), 'A,D');
  // The record says where it came from, so a reviewer can see the move rather than infer it.
  chk(name, 'reassign', 'the record editor shows what it was moved from',
    ev(`(recFields('A', itemById('A')).filter(function(f){ return f.l==='PMO'; })[0]||{}).n`),
    'moved from AV for ' + ev(`FYL()`));

  // AN OFFICE ADDED HERE REACHES EVERY SURFACE THAT LISTS ONE.
  ev(`pmoSave(GROUPS.concat(['SE'])); 'ok'`);
  m = look();
  chk(name, 'added office', 'it joins the configured list', ev(`GROUPS.indexOf('SE')>=0`), true);
  chk(name, 'added office', 'it appears in the menu straight away',
    m.items.some(x => /^SE/.test(x)), true);
  // The per-requirement control is built from GROUPS, so the same addition reaches it.
  chk(name, 'added office', 'and the record editor offers it',
    ev(`/GROUPS\\.map/.test(String(recFields))`), true);
  chk(name, 'added office', 'the roll-ups order it after the configured ones',
    ev(`JSON.stringify(pmoKeys({SE:1, AV:1}))`), JSON.stringify(['AV', 'SE']));
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


// ═══ CR CASH NEEDS — THE HALF-MONTH PLACEMENT ═══════════════════════════════════════════════════
// crData() places every funded dollar into one of twelve half-month windows across Oct–Mar, or into
// the no-date bucket. The register recorded it as a gap on 15 Sep: its WIRING was guarded (the sheet
// follows the toggle, the 1A9A return does not) and its arithmetic was not. Every placement rule gets
// a requirement here. The lanes are deep, so each requirement is funded in full and the placement is
// the only arithmetic under test.
//   A  single date, November          -> the 1–15 window of November, whole
//   B  single date, December, FLIPPED -> the 16–EOM window of December
//   C  increments October and April, weighted 1:2 -> a THIRD lands in October; the April share is
//      outside Oct–Mar and is not placed anywhere -- it is not cash needed under a CR
//   D  no award date                  -> no date
//   E  increments with no weight      -> no date
//   F  funded in STOVL only, March    -> a row in STOVL and in no other service
{
  const name = 'CR cash needs — the half-month placement';
  const sc = {
    services: ['USAF', 'ANG', 'STOVL'],
    items: [it('A', 'PSM', [100, 50, 20]), it('B', 'AV', [80, 40, 10]), it('C', 'PSM', [60, 30, 15]),
            it('D', 'MxS', [40, 20, 5]),  it('E', 'PSM', [30, 10, 5]), it('F', 'AV', [0, 0, 25])],
    disc: [1000, 500, 200], mand: [0, 0, 0], order: ['A', 'B', 'C', 'D', 'E', 'F'],
  };
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  ev(`S.awards['A']={mode:'single', d:FYMON[1][0]};
      S.awards['B']={mode:'single', d:FYMON[2][0]}; S.crHalf['B']={}; S.crHalf['B'][FYMON[2][0]]=1;
      S.awards['C']={mode:'inc', inc:[{d:FYMON[0][0], sv:[60,30,15]},{d:FYMON[6][0], sv:[120,60,30]}]};
      S.awards['E']={mode:'inc', inc:[{d:FYMON[3][0], sv:[0,0,0]}]};
      S.awards['F']={mode:'single', d:FYMON[5][0]}; save(); 'ok'`);
  const f = { A: [100, 50, 20], B: [80, 40, 10], C: [60, 30, 15], D: [40, 20, 5], E: [30, 10, 5], F: [0, 0, 25] };
  chk(name, 'fixture', 'every requirement is funded in full',
    ev(`(function(){ var T=tiers(); return JSON.stringify(S.order.map(function(id){ var p=T[id]; return p.d.map(function(v,i){ return v+p.m[i]; }); })); })()`),
    JSON.stringify(Object.values(f)));
  const cr = JSON.parse(ev(`JSON.stringify(crData().map(function(s){ return {win:s.win, nodate:s.nodate, tot:s.tot,
    items:s.items.map(function(r){ return {id:r.id, wins:r.wins, months:r.months}; })}; }))`));
  const W = (m, half) => m * 2 + (half ? 1 : 0);
  sc.services.forEach((sv, i) => {
    const want = Array(12).fill(0);
    want[W(1, 0)] += f.A[i];          // A: November, 1–15
    want[W(2, 1)] += f.B[i];          // B: December, flipped to 16–EOM
    want[W(0, 0)] += f.C[i] / 3;      // C: a third in October; the April two-thirds is outside the window
    want[W(5, 0)] += f.F[i];          // F: March
    for (let w = 0; w < 12; w++) chk(name, sv, 'window ' + (w + 1), cr[i].win[w], want[w]);
    chk(name, sv, 'no date is the unscheduled money: no award, and increments with no weight', cr[i].nodate, f.D[i] + f.E[i]);
    chk(name, sv, 'the total is what landed in the window', cr[i].tot, want.reduce((a, b) => a + b, 0));
    chk(name, sv, 'and not the funded amount, because an increment fell outside the window',
      cr[i].tot < f.A[i] + f.B[i] + f.C[i] + f.F[i] ? 'ok' : 'the April share was counted', 'ok');
  });
  chk(name, 'rows', 'a service a requirement is not funded in gets no row for it',
    cr[0].items.some(r => r.id === 'F') ? 'F has a USAF row' : 'ok', 'ok');
  chk(name, 'rows', 'a requirement with nothing in the window gets no row',
    cr[0].items.some(r => r.id === 'D' || r.id === 'E') ? 'an unscheduled row' : 'ok', 'ok');
  chk(name, 'rows', 'a row names the month it lands in', (cr[0].items.find(r => r.id === 'C') || { months: [] }).months.join(','), ev('FYMON[0][0]'));
  chk(name, 'rows', 'and a flipped row still names its month, not a half',
    (cr[0].items.find(r => r.id === 'B') || { months: [] }).months.join(','), ev('FYMON[2][0]'));
  // THE 1A9A RETURN: the three CR services only, one row per requirement, windows carried across
  chk(name, '1A9A', 'the return covers the three CR services', ev('JSON.stringify(CR_SVCS)'), JSON.stringify(['STOVL', 'USMC-C', 'USN']));
  const rt = JSON.parse(ev(`JSON.stringify(crExportRows().map(function(e){ return {id:e.id, w:e.wins}; }))`));
  const stovl = sc.services.indexOf('STOVL');
  chk(name, '1A9A', 'one row per requirement with STOVL money in the window', rt.map(r => r.id).sort().join(','), 'A,B,C,F');
  rt.forEach(r => { for (let w = 0; w < 12; w++)
    chk(name, '1A9A', r.id + ' window ' + (w + 1) + ' is its STOVL placement', r.w[w],
      (cr[stovl].items.find(x => x.id === r.id) || { wins: Array(12).fill(0) }).wins[w]); });
  chk(name, '1A9A', 'and it never takes the scenario: it is a formal return of the funded plan',
    /const svc=crData\(\), idx=/.test(ev('String(crExportRows)')), true);
}


// ═══ PPBE CYCLES — THE LOCK IS THE WINDOW, FROZEN ══════════════════════════════════════════
// A lock copies every window year that holds a plan, projects each from ITS OWN state, and never
// changes afterwards; the working plan is untouched and gets its tag and reference. The year on
// screen sits OUTSIDE the window here (base = cur+1), the way FY27 does once the base rolls to
// FY28, and three window years are deliberately blank. Then the file, the import, the legacy
// migration and the Spruills are each made to prove they read the lock and nothing else.
{
  const name = 'PPBE cycles — the lock is the window, frozen';
  const sc = { services: ['USAF', 'ANG', 'STOVL'],
    items: [it('A', 'PSM', [100, 50, 20]), it('B', 'AV', [80, 40, 10]), it('C', 'PSM', [60, 30, 15]), it('D', 'MxS', [40, 20, 5])],
    disc: [150, 60, 30], mand: [40, 20, 10], order: ['A', 'B', 'C', 'D'] };
  const { ev, errors } = boot();
  seed(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); 'ok'`);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  const cur = +ev('MS.cur');
  // two more planned years: cur+1 with A's value doubled, cur+5 (the last window year) without D
  ev(`MS.years[MS.cur]=S; MS.base=MS.cur+1;
      var y1=JSON.parse(JSON.stringify(S)); y1.asks={A:[200,100,40]}; delete y1.pmoOrder; MS.years[MS.cur+1]=y1;
      var y5=JSON.parse(JSON.stringify(S)); y5.order=['A','B','C']; y5.removed=['D']; delete y5.pmoOrder; MS.years[MS.cur+5]=y5;
      'ok'`);
  const held = [cur, cur + 1, cur + 5];
  chk(name, 'window', 'the years a lock takes: the window where planned, and the year on screen outside it',
    ev('JSON.stringify(cycWindowYears())'), JSON.stringify(held));
  ev(`blCyc='PB'; blYr=MS.cur; blNote='  as briefed  '; cycLock(); 'ok'`);
  const key = 'PB|' + cur;
  const c = () => JSON.parse(ev(`JSON.stringify(blGet('${key}')||null)`));
  const C0 = c();
  chk(name, 'lock', 'the cycle exists and is locked', !!(C0 && C0.locked), true);
  chk(name, 'lock', 'it holds exactly the planned window years, whole', Object.keys(C0.years).join(','), held.join(','));
  chk(name, 'lock', 'and a projection for each', Object.keys(C0.proj).join(','), held.join(','));
  chk(name, 'lock', 'the note is kept, trimmed', C0.note, 'as briefed');
  chk(name, 'lock', 'the base and the window are recorded', C0.base + ':' + C0.window.join(','), (cur + 1) + ':' + held.join(','));
  chk(name, 'lock', 'the working plan takes the tag, being untagged', ev('MS.cycle'), key);
  chk(name, 'lock', 'and reads its deltas against the lock', ev('MS.cycleRef'), key);
  chk(name, 'lock', 'the board on screen is unchanged: still the year it was on', +ev('MS.cur'), cur);
  chk(name, 'lock', 'with its own order intact', ev('JSON.stringify(S.order)'), JSON.stringify(sc.order));
  // each projection is ITS year's plan
  const askOf = (fy, id) => JSON.stringify(((C0.proj[fy].reqs.find(r => r.id === id)) || {}).ask);
  chk(name, 'projection', `FY${(cur + 1) % 100}’s projection carries FY${(cur + 1) % 100}’s value of A, not the screen year’s`, askOf(cur + 1, 'A'), JSON.stringify([200, 100, 40]));
  chk(name, 'projection', 'the year on screen keeps its own', askOf(cur, 'A'), JSON.stringify([100, 50, 20]));
  chk(name, 'projection', `FY${(cur + 5) % 100} has no D`, C0.proj[cur + 5].reqs.some(r => r.id === 'D') ? 'D present' : 'absent', 'absent');
  const fundNow = JSON.parse(ev(`JSON.stringify((function(){ var T=tiers(); return S.order.map(function(id){ var p=T[id]; return p.d.map(function(v,i){ return v+p.m[i]; }); }); })())`));
  chk(name, 'projection', 'funded is the lane draw, d+m per service, requirement by requirement',
    JSON.stringify(C0.proj[cur].reqs.map(r => r.fund)), JSON.stringify(fundNow));
  chk(name, 'projection', 'and disc and mand are stored apart, adding to it',
    C0.proj[cur].reqs.every(r => r.fund.every((v, i) => Math.abs(v - (r.d[i] + r.m[i])) < 1e-9)) ? 'yes' : 'no', 'yes');
  chk(name, 'projection', 'the PMO roll-up funded is its requirements added',
    JSON.stringify(C0.proj[cur].pmo.PSM.fund),
    JSON.stringify([0, 1, 2].map(i => C0.proj[cur].reqs.filter(r => r.grp === 'PSM').reduce((a, r) => a + r.fund[i], 0))));
  chk(name, 'projection', 'the budget authority of the year is carried', JSON.stringify([C0.proj[cur].disc, C0.proj[cur].mand]), JSON.stringify([sc.disc, sc.mand]));
  // immutability
  const frozen = JSON.stringify(C0.years[cur]);
  ev(`setAsk('B',0,'1'); S.mc['A']=true; save(); 'ok'`);
  const C1 = c();
  chk(name, 'frozen', 'editing the board leaves the locked year byte-identical', JSON.stringify(C1.years[cur]) === frozen ? 'unchanged' : 'CHANGED', 'unchanged');
  chk(name, 'frozen', 'because the lock is a copy, not a reference', ev(`blGet('${key}').years[MS.cur]===MS.years[MS.cur]`), false);
  chk(name, 'frozen', 'and the projection did not move either', JSON.stringify(C1.proj[cur].reqs.map(r => r.ask)), JSON.stringify(C0.proj[cur].reqs.map(r => r.ask)));
  // a second lock under the same key is refused while locked; delete is refused while locked
  ev(`cycLock(); 'ok'`);
  chk(name, 'locked', 'a second lock under a locked key is refused', c().ts, C0.ts);
  ev(`blDelete('${key}'); 'ok'`);
  chk(name, 'locked', 'delete is refused while locked', !!c(), true);
  ev(`blLock('${key}', false); 'ok'`);
  chk(name, 'unlock', 'an unlock is stamped with who and when', (c().unlocks || []).length + ':' + ((c().unlocks || [{}])[0].by || ''), '1:' + ev('whoAmI()'));
  chk(name, 'unlock', 'and the cycle is open', c().locked, false);
  chk(name, 'header', 'the header names the working cycle', /PB\d\d/.test(ev(`document.getElementById('cycTag').textContent`)), true);
  // save → reopen: the store, the tag and the reference travel in the file
  const html = ev('buildSavedHtml()');
  const R = boot({ html });
  chk(name, 'file', 'the locked cycles come back from a saved file, byte for byte', R.ev('JSON.stringify(CYCDB)'), ev('JSON.stringify(CYCDB)'));
  chk(name, 'file', 'so does the working plan’s tag', R.ev('MS.cycle'), ev('MS.cycle'));
  chk(name, 'file', 'and its reference', R.ev('MS.cycleRef'), ev('MS.cycleRef'));
  chk(name, 'file', 'a package for a manager does not carry the store', ev(`JSON.stringify(pkgStrip({cycDb:{byAp:{}}, years:{}}))`), JSON.stringify({ years: {} }));
  // import: a cycle held here is never replaced by one arriving in a file; one not held is taken
  const imp = JSON.parse(ev(`(function(){
      var mine=blGet('${key}'); var inc={cycDb:{byAp:{}}}; var slot={cycles:{}}; inc.cycDb.byAp[mySlug()]=slot;
      var theirs=JSON.parse(JSON.stringify(mine)); theirs.ts=mine.ts+1; theirs.note='THEIRS';
      slot.cycles['${key}']=theirs;
      slot.cycles['BES|'+(MS.cur+1)]=JSON.parse(JSON.stringify(mine));
      var said=importStores(inc);
      return JSON.stringify({said:said, note:blGet('${key}').note, took:!!blGet('BES|'+(MS.cur+1))}); })()`));
  chk(name, 'import', 'a cycle held here is left alone', imp.note, 'as briefed');
  chk(name, 'import', 'a cycle not held here is taken', imp.took, true);
  chk(name, 'import', 'and both are said in words', imp.said.some(x => /left alone/.test(x)) && imp.said.some(x => /came across/.test(x)), true);
  ev(`blLock('BES|'+(MS.cur+1), false); blDelete('BES|'+(MS.cur+1)); 'ok'`);
  // delete, once unlocked, and the reference clears
  ev(`blDelete('${key}'); 'ok'`);
  chk(name, 'delete', 'an unlocked cycle can be deleted', c(), null);
  chk(name, 'delete', 'and a reference to it is cleared, not left dangling', ev('MS.cycleRef'), '');
  // legacy: a one-year baseline becomes a partial cycle, once
  const lk = 'POM|' + cur;
  ev(`var L={}; L['${lk}']={fy:MS.cur, ap:mySlug(), ts:5, by:'legacy', locked:true, svc:SVC.slice(), disc:[1,2,3], mand:[0,0,0], bands:[],
        reqs:[{id:'A', title:'A', grp:'PSM', ccar:'', pid:'', band:'', mc:false, ask:[100,50,20], alloc:[100,50,20]}],
        pmo:{PSM:{ask:[100,50,20], alloc:[100,50,20], n:1}}};
      MS.baselines=L; cycMigrateLegacy(); 'ok'`);
  const M = JSON.parse(ev(`JSON.stringify(blGet('${lk}')||null)`));
  chk(name, 'legacy', 'a one-year baseline becomes a cycle', !!M, true);
  chk(name, 'legacy', 'marked partial, holding that one year’s projection and no state',
    M.partial + ':' + Object.keys(M.proj).join(',') + ':' + Object.keys(M.years).length, 'true:' + cur + ':0');
  chk(name, 'legacy', 'its lock, author and stamp carried', M.locked + ':' + M.by + ':' + M.ts, 'true:legacy:5');
  chk(name, 'legacy', 'the legacy container is gone once carried', ev('MS.baselines===undefined'), true);
  chk(name, 'legacy', 'the Spruills can read it for the year it holds', ev(`JSON.stringify((blPmoAlloc('${lk}','PSM',MS.cur)||{}).alloc)`), JSON.stringify([100, 50, 20]));
  ev(`blLock('${lk}', false); blDelete('${lk}'); cycMigrateLegacy(); 'ok'`);
  chk(name, 'legacy', 'a migrated cycle deleted on purpose does not come back on the next load', ev(`blGet('${lk}')`), null);
  // the Spruills reads every year the cycle holds, and none it does not
  ev(`blCyc='PB'; blYr=MS.cur; cycLock(); spFund='bl|PB|'+MS.cur; 'ok'`);
  const D = JSON.parse(ev(`JSON.stringify(pmoDetail('PSM',[MS.cur, MS.cur+1, MS.cur+2, MS.cur+5]).filter(function(b){ return b.name===APPN; })[0].ctl)`));
  const P1 = JSON.parse(ev(`JSON.stringify(cycProj('PB|'+MS.cur, MS.cur+1).pmo.PSM.alloc)`));
  chk(name, 'spruills', 'a cycle gives the PMO its control for every year it holds', [D.USAF[cur + 1], D.ANG[cur + 1], D.STOVL[cur + 1]].join(','), P1.join(','));
  chk(name, 'spruills', 'and none for a year it never held', String(D.USAF[cur + 2]), 'undefined');
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
