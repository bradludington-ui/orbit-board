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
import { boot, seed, stopAtFirstFailure, capture, cv } from './boot.mjs';

const failures = [];
stopAtFirstFailure(failures);   // in the mutation sweep only: see boot.mjs
// EVERY NAMED SCENARIO MUST RUN. A block appended after process.exit() never executes and reads as
// a pass -- the proposal scenario in audit-import.mjs sat there for a whole verification round and
// five mutations aimed at it survived. chk() records every scenario it hears from; at the summary,
// any `const name = '...'` in this file it never heard from is a failure, not a pass.
import { readFileSync as _selfRead } from 'node:fs';
import { fileURLToPath as _selfPath } from 'node:url';
const SEEN = new Set();
// SUITE_CHECKS=<file> records every check (v1.99), as audit-import and audit-recon do, so a fail-before run can be counted
import { appendFileSync as _ckAppend } from 'node:fs';
const CHECKS = process.env.SUITE_CHECKS || '';
const chk = (scenario, where, what, got, want) => {
  SEEN.add(scenario);
  const ok = typeof got === 'number' && typeof want === 'number'
    ? Math.abs(got - want) <= 0.005 : String(got) === String(want);
  if (CHECKS) _ckAppend(CHECKS, JSON.stringify([scenario, where, what, ok, String(got).slice(0, 400)]) + '\n');
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
// The latest award is the figure that goes on a contract modification. It is FUNDED dollars --
// discretionary + mandatory, since v1.93 an award is the whole award -- less what the other awards
// already obligate, PER SERVICE: netting it across services would produce a total that ties while
// every individual mod is wrong. The latest BY DATE: the awards are stored out of order here.
{
  const name = 'incremental funding residual';
  try {
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
      // Three dates, the LATEST STORED FIRST; the other two take deliberately uneven shares so no
      // service's residual equals any other's, and an even split cannot pass by coincidence.
      S.awards['A'].inc = [
        {d:'2027-06', day:1, sv: SVC.map(function(){ return 0; })},
        {d:'2026-11', day:1, sv: SVC.map(function(s,i){ return Math.round((p.d[i]||0)*0.40); })},
        {d:'2027-02', day:1, sv: SVC.map(function(s,i){ return Math.round((p.d[i]||0)*0.25); })}
      ];
      save();
      fillLastAwd('A');
      var T2 = tiers(), p2 = T2['A'], inc = S.awards['A'].inc;
      var byD = function(d){ return inc.filter(function(x){ return x.d===d; })[0].sv.slice(); };
      return JSON.stringify({
        // FUNDED, both lanes — the basis the balance tracks since v1.93.
        disc:  SVC.map(function(s,i){ return (p2.d[i]||0); }),
        mand:  SVC.map(function(s,i){ return (p2.m[i]||0); }),
        sched: SVC.map(function(s,i){ return inc.reduce(function(a,x){ return a+((x.sv||[])[i]||0); }, 0); }),
        last:  byD('2027-06'), first: byD('2026-11'), second: byD('2027-02')
      });
    })()`));

  // The scenario is only meaningful if mandatory is actually drawn; otherwise the two possible
  // bases are the same number and this proves nothing.
  chk(name, 'residual', 'scenario actually draws mandatory, so the basis is distinguishable',
    sum(r.mand) > 0.5 ? 'yes' : 'no', 'yes');
  sc.services.forEach((svc, i) => {
    chk(name, 'residual', `${svc}: every FUNDED dollar, both lanes, is scheduled once the latest award is filled`,
      Math.round(r.sched[i]), Math.round(r.disc[i] + r.mand[i]));
    // Stated independently of what fillLastAwd did: the latest award IS the remainder.
    chk(name, 'residual', `${svc}: latest award == funded (disc + mand) less the earlier awards`,
      Math.round(r.last[i]), Math.round(r.disc[i] + r.mand[i] - r.first[i] - r.second[i]));
  });
  // A total that ties while the per-service splits are wrong is the failure this guards against,
  // so the totals are checked too — but they are not the point, and they are checked last.
  chk(name, 'residual', 'total scheduled equals total FUNDED, both lanes',
    Math.round(sum(r.sched)), Math.round(sum(r.disc) + sum(r.mand)));
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}


// ═══ the spend forecast: awards are DOLLARS ═════════════════════════════════════════════════════
// monSpreadOf places money into months. Two things have to hold, and the first is the one that
// makes the second safe:
//   CONSERVATION — every funded dollar lands in a month or in UNSCHEDULED. Never dropped, never
//                  invented. This is the property the function exists to keep.
//   LITERAL       — what you type into an award is what lands in that month. It used to be a weight
//                  against the whole funded amount, which inflated every figure. Since v1.93 an
//                  award is the whole award, both lanes; this one is typed short of the funding, so
//                  discretionary fills it and everything else -- the rest of discretionary and ALL
//                  of mandatory -- is UNSCHEDULED, with nothing to ride.
{
  const name = 'spend forecast';
  try {
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

    // What was typed is what lands: the awards are smaller than the discretionary, so they are all
    // discretionary, and nothing rides them.
    const wsum = r.inc.reduce((a, x) => a + x[i], 0);
    r.mi.forEach((k, j) => {
      chk(name, 'literal placement', `${svc}: award ${j + 1} lands as typed, and no more`,
        Math.round(r.months[i][k]), Math.round(r.inc[j][i]));
    });

    // Every funded dollar the awards do not cover is UNSCHEDULED, in both lanes — the same figure
    // the board's Balance to schedule row reports.
    chk(name, 'unscheduled', `${svc}: funded dollars the awards do not cover show as UNSCHEDULED`,
      Math.round(r.unsch[i]), Math.round(r.d[i] + r.m[i] - wsum));
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
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}


// ═══ v1.93 (item 40) — MANDATORY AWARDS LAST ═══════════════════════════════════════════════════
// Brad, 1 Oct 2026: a $300 requirement awarded $100 in each of January, February and March, with $250
// discretionary and $50 mandatory: "I would expect discretionary to award 100 in January, 100 in
// February and 50 in March. I would also expect my mandatory to award 50 in March." An award is the
// whole award, both lanes, in DATE order; discretionary fills them forward from the first, mandatory
// backward from the last, neither past an award's amount; what they do not cover is UNSCHEDULED in
// either lane. Every figure below is stated from the scenario, never read back from the board, and the
// same table is then demanded of every surface that places money in months: landSvc itself, the
// forecast's TOTAL, and the CR windows.
{
  const name = 'v1.93 — mandatory awards last';
  try {
  const sv = ['USAF', 'ANG'];
  const dir = (d, m) => ({ m: 'split', dv: d, mv: m });
  const sc = {
    services: sv,
    items: [it('A', 'AV', [300, 0]), it('B', 'AV', [300, 0]), it('C', 'PSM', [300, 0]), it('D', 'PSM', [200, 0]),
            it('E', 'MxS', [300, 0]), it('F', 'MxS', [300, 0]), it('G', 'TSS', [100, 60]), it('H', 'TSS', [300, 0])],
    disc: [5000, 5000], mand: [5000, 5000],
    order: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    fsrc: { A: dir([250, 0], [50, 0]),   // Brad's example
            B: dir([250, 0], [50, 0]),   // the same, awards typed for the discretionary only
            C: dir([150, 0], [50, 0]),   // partly funded: $100 unfunded in the middle
            D: dir([0, 0], [200, 0]),    // mandatory only, the awards more than it
            E: dir([250, 0], [50, 0]),   // Brad's example, the awards stored out of date order
            F: dir([250, 0], [50, 0]),   // one award date
            G: dir([100, 0], [0, 60]),   // ANG has no award of its own
            H: dir([100, 0], [100, 0]) }, // the awards more than the funding: the middle one empty
  };
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  // FYMON: 0 Oct, 1 Nov, 2 Dec, 3 Jan, 4 Feb, 5 Mar
  ev(`(function(){ var J=FYMON[3][0], F=FYMON[4][0], M=FYMON[5][0];
      var x=function(d, a){ return {d:d, day:1, sv:a}; };
      S.awards={};
      S.awards.A={mode:'inc', inc:[x(J,[100,0]), x(F,[100,0]), x(M,[100,0])]};
      S.awards.B={mode:'inc', inc:[x(J,[100,0]), x(F,[100,0]), x(M,[50,0])]};
      S.awards.C={mode:'inc', inc:[x(J,[100,0]), x(F,[100,0]), x(M,[100,0])]};
      S.awards.D={mode:'inc', inc:[x(J,[100,0]), x(F,[100,0]), x(M,[100,0])]};
      S.awards.E={mode:'inc', inc:[x(M,[100,0]), x(J,[100,0]), x(F,[100,0])]};
      S.awards.F={mode:'single', d:F};
      S.awards.G={mode:'inc', inc:[x(J,[100,0])]};
      S.awards.H={mode:'inc', inc:[x(J,[100,0]), x(F,[100,0]), x(M,[100,0])]};
      save(); return 'ok'; })()`);
  // the fixture holds: each requirement draws exactly what it was directed
  const want = { A: [[250, 0], [50, 0]], B: [[250, 0], [50, 0]], C: [[150, 0], [50, 0]], D: [[0, 0], [200, 0]],
                 E: [[250, 0], [50, 0]], F: [[250, 0], [50, 0]], G: [[100, 0], [0, 60]], H: [[100, 0], [100, 0]] };
  const T = JSON.parse(ev(`(function(){ var T=tiers(), o={}; S.order.forEach(function(id){ o[id]=[T[id].d, T[id].m]; }); return JSON.stringify(o); })()`));
  Object.keys(want).forEach(id => chk(name, 'fixture', `${id} draws what it was directed`, JSON.stringify(T[id]), JSON.stringify(want[id])));

  // THE TABLE, by requirement and service: [month index] -> [disc, mand]; and what stays undated.
  const J = 3, Fb = 4, M = 5;
  const table = {
    A: { USAF: { [J]: [100, 0], [Fb]: [100, 0], [M]: [50, 50] }, ud: [0, 0], um: [0, 0] },
    B: { USAF: { [J]: [100, 0], [Fb]: [100, 0], [M]: [50, 0] }, ud: [0, 0], um: [50, 0] },
    C: { USAF: { [J]: [100, 0], [Fb]: [50, 0], [M]: [0, 50] }, ud: [0, 0], um: [0, 0] },
    D: { USAF: { [Fb]: [0, 100], [M]: [0, 100] }, ud: [0, 0], um: [0, 0] },
    E: { USAF: { [J]: [100, 0], [Fb]: [100, 0], [M]: [50, 50] }, ud: [0, 0], um: [0, 0] },
    F: { USAF: { [Fb]: [250, 50] }, ud: [0, 0], um: [0, 0] },
    G: { USAF: { [J]: [100, 0] }, ud: [0, 0], um: [0, 60] },
    H: { USAF: { [J]: [100, 0], [M]: [0, 100] }, ud: [0, 0], um: [0, 0] },
  };
  const L = JSON.parse(ev(`(function(){ var o={}, mi={}; FYMON.forEach(function(x,k){ mi[x[0]]=k; });
    S.order.forEach(function(id){ var T=tiers()[id]; o[id]=SVC.map(function(s,i){
      var r=landSvc(S.awards[id], i, T.d[i], T.m[i], true);
      return {at:r.at.map(function(a){ return [mi[a.d], a.dv, a.mv]; }), ud:r.ud, um:r.um}; }); });
    return JSON.stringify(o); })()`));
  const dsum = { d: Array(12).fill(0), m: Array(12).fill(0), ud: 0, um: 0 };
  Object.keys(table).forEach(id => {
    sv.forEach((s, i) => {
      const exp = table[id][s] || {};
      const got = {}; L[id][i].at.forEach(([k, dv, mv]) => { got[k] = [Math.round(dv), Math.round(mv)]; });
      const ks = [...new Set([...Object.keys(exp), ...Object.keys(got)])].sort();
      ks.forEach(k => chk(name, id, `${s} ${['Oct','Nov','Dec','Jan','Feb','Mar'][k] || k}: disc, mand`,
        JSON.stringify(got[k] || [0, 0]), JSON.stringify(exp[k] || [0, 0])));
      chk(name, id, `${s}: discretionary left undated`, Math.round(L[id][i].ud), table[id].ud[i]);
      chk(name, id, `${s}: mandatory left undated`, Math.round(L[id][i].um), table[id].um[i]);
      Object.keys(exp).forEach(k => { dsum.d[k] += exp[k][0]; dsum.m[k] += exp[k][1]; });
      dsum.ud += table[id].ud[i]; dsum.um += table[id].um[i];
    });
  });
  // a placement is in date order whatever order the awards are stored in
  chk(name, 'E', 'the placements come back in date order', JSON.stringify(L.E[0].at.map(a => a[0])), JSON.stringify([J, Fb, M]));

  // EVERY SURFACE AGREES WITH THE TABLE: the forecast's TOTAL, the CR windows (v2.05, item 114: and the deck's chart by lane,
  // until the deck was removed; the lanes are held above, placement by placement)
  const fc = JSON.parse(ev(`(function(){ var F=forecast(), m=FYMON.map(function(){ return 0; }), u=0;
    F.rollRows.forEach(function(b){ b.m.forEach(function(v,k){ m[k]+=v; }); u+=b.unsch; }); return JSON.stringify({m:m, u:u}); })()`));
  for (let k = 0; k < 12; k++) chk(name, 'forecast', `month ${k + 1} total`, Math.round(fc.m[k]), dsum.d[k] + dsum.m[k]);
  chk(name, 'forecast', 'UNSCHEDULED', Math.round(fc.u), dsum.ud + dsum.um);
  const cr = JSON.parse(ev('JSON.stringify(crData().map(function(s){ return {win:s.win, nodate:s.nodate}; }))'));
  [J, Fb, M].forEach(k => chk(name, 'CR windows', `USAF ${['Jan','Feb','Mar'][k - 3]} 1–15`, Math.round(cr[0].win[k * 2]), dsum.d[k] + dsum.m[k]));
  chk(name, 'CR windows', 'ANG no date: its mandatory has no award of its own', Math.round(cr[1].nodate), 60);

  // THE AWARD BLOCK says it: both lanes in the balance, each award's split, the undated lane
  const blk = id => ev(`awardBlockHtml(itemById('${id}'))`);
  const hA = blk('A');
  chk(name, 'award block', 'the balance counts both lanes', /Balance to schedule — discretionary \+ mandatory/.test(hA), true);
  chk(name, 'award block', 'A: its March award reads $50 disc + $50 mand', (hA.match(/class="awdsplit"[^>]*>([^<]*)</g) || []).map(x => x.replace(/.*>/, '').replace(/<$/, '')).join(' | '),
    '$100 disc | $100 disc | $50 disc + $50 mand');
  chk(name, 'award block', 'A: fully scheduled', /awards \$300 vs <b>funded<\/b> \$300 \(discretionary \$250 \+ mandatory \$50\) ✓/.test(hA), true);
  chk(name, 'award block', 'the old mandatory row is gone', /rides these dates/.test(hA), false);
  const hB = blk('B');
  chk(name, 'award block', 'B: $50 left to schedule', (hB.match(/<tr class="awdbal">[\s\S]*?<\/tr>/) || [''])[0].includes('$50'), true);
  chk(name, 'award block', 'B: and it is mandatory', /\$50 mand is not on a date yet/.test(hB), true);
  chk(name, 'award block', 'B: with the button that covers it', /fillLastAwd\(/.test(hB), true);
  // per service, both lanes: USAF funded $300 against $250 of awards; ANG funded nothing and typed nothing
  const balCells = h => ((h.match(/<tr class="awdbal">([\s\S]*?)<\/tr>/) || ['', ''])[1].match(/<td[^>]*>([^<]*)</g) || []).map(x => x.replace(/.*>/, '').replace(/<$/, ''));
  chk(name, 'award block', 'B: the balance by service, then the total', JSON.stringify(balCells(hB).slice(1, 4)), JSON.stringify(['$50', '\u2014', '$50']));
  chk(name, 'award block', 'G: ANG’s mandatory is a balance of its own, with no award of its own', JSON.stringify(balCells(blk('G')).slice(1, 4)), JSON.stringify(['\u2014', '$60', '$60']));

  // PUT ON LAST covers both lanes, on the latest award: B's March becomes $100, $50 + $50
  ev(`fillLastAwd('B'); 'ok'`);
  const B2 = JSON.parse(ev(`(function(){ var T=tiers()['B'], mi={}; FYMON.forEach(function(x,k){ mi[x[0]]=k; });
    var r=landSvc(S.awards.B, 0, T.d[0], T.m[0], true);
    return JSON.stringify({mar:S.awards.B.inc.filter(function(x){ return x.d===FYMON[5][0]; })[0].sv[0],
      at:r.at.map(function(a){ return [mi[a.d], a.dv, a.mv]; }), ud:r.ud, um:r.um}); })()`));
  chk(name, 'put on last', 'B: the March award is now $100', B2.mar, 100);
  chk(name, 'put on last', 'B: March holds $50 disc + $50 mand', JSON.stringify(B2.at.find(a => a[0] === M) || []), JSON.stringify([M, 50, 50]));
  chk(name, 'put on last', 'B: nothing left undated', Math.round(B2.ud + B2.um), 0);
  // put on last takes the latest BY DATE: E's awards are stored March first
  ev(`S.awards.E.inc.forEach(function(x){ x.sv=[90,0]; }); fillLastAwd('E'); 'ok'`);
  chk(name, 'put on last', 'E: the residual goes on March, stored first', ev(`JSON.stringify(S.awards.E.inc.map(function(x){ return x.sv[0]; }))`), JSON.stringify([120, 90, 90]));

  // SWITCHING TO INCREMENTAL seeds the whole funded amount, both lanes, per service
  ev(`toggleAwdInc('F', 300); 'ok'`);
  chk(name, 'seed', 'F: the first award is $300, both lanes', ev(`JSON.stringify(S.awards.F.inc[0].sv)`), JSON.stringify([300, 0]));
  ev(`toggleAwdInc('G', 0); toggleAwdInc('G', 0); 'ok'`);
  chk(name, 'seed', 'G: each service its own funding, ANG its mandatory', ev(`JSON.stringify(S.awards.G.inc[0].sv)`), JSON.stringify([100, 60]));

  // A SHARE IS A SHARE OF THE WHOLE: the fill is not linear, so half of A placed on its own would put
  // $125 + $25 in January/February/March differently from half of A placed whole
  const half = JSON.parse(ev(`(function(){ var T=tiers()['A'];
    var w=monSpreadOf('A', T), h=monSpreadOf('A', T, function(){ return 0.5; });
    return JSON.stringify({w:w.m[0], h:h.m[0]}); })()`));
  chk(name, 'shares', 'half of A is half of A, month by month', JSON.stringify(half.h.map(v => Math.round(v * 2))), JSON.stringify(half.w.map(v => Math.round(v))));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ═══ v1.93 (item 41) — THE SPEND PLAN FORECAST BY PMO AND BY SERVICE, AND AN EXPORT OF THE VIEW ═════════════
// Brad: view the forecast by PMO and by service "in the same format as the top Roll Up section", and export the
// filtered view. PRIME-3 is shared between two offices by its CLINs (AV 0002: USAF 60; TSS 0008: USAF 40, ANG 50),
// so AV holds 60% of its USAF and none of its ANG, TSS 40% of its USAF and all of its ANG. PRIME-3 draws USAF
// $70 disc + $30 mand and ANG $50 disc; its awards are Jan (USAF 50, ANG 50) and Mar (USAF 50): USAF disc Jan 50,
// Mar 20, mand Mar 30. B (AV) $40 USAF in February; C (PSM) $30 ANG, no date. Every figure is stated from that.
{
  const name = 'v1.93 — the forecast by PMO and by service, and its export';
  try {
  const J = JSON.stringify;
  const sc = {
    services: ['USAF', 'ANG'],
    items: [it('PRIME-3', 'AV', [100, 50]), it('B', 'AV', [40, 0]), it('C', 'PSM', [0, 30])],
    disc: [150, 80], mand: [30, 0], order: ['PRIME-3', 'B', 'C'],
    fsrc: { 'PRIME-3': { m: 'split', dv: [70, 50], mv: [30, 0] }, B: { m: 'split', dv: [40, 0], mv: [0, 0] }, C: { m: 'split', dv: [0, 30], mv: [0, 0] } },
  };
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  ev(`(function(){ DATA.clins=DATA.clins||{}; DATA.clins['PRIME-3']=[{clin:'0002', ask:[60,0]}, {clin:'0008', ask:[40,50]}];
    S.ptype={'PRIME-3':'PRIME'};
    S.awards={'PRIME-3':{mode:'inc', inc:[{d:FYMON[3][0], day:1, sv:[50,50]}, {d:FYMON[5][0], day:1, sv:[50,0]}]}, B:{mode:'single', d:FYMON[4][0]}};
    save(); render(); return 'ok'; })()`);
  // [Oct..Sep] as a sparse map of month index -> dollars, then UNSCHEDULED and TOTAL
  const bag = (m, u, t) => { const a = Array(12).fill(0); Object.keys(m).forEach(k => { a[k] = m[k]; }); return J(a.concat([u, t])); };
  const Jn = 3, Fb = 4, Mr = 5;
  const view = v => JSON.parse(ev(`(function(){ fcView=${J(v)}; var D=fcViewData(), r=function(b){ return b.m.map(function(x){ return Math.round(x*100)/100; }).concat([Math.round(b.unsch*100)/100, Math.round(b.tot*100)/100]); };
    var o={roll:{}, by:{}, head:D.by.head, rollTot:r(D.rollTot), byTot:r(D.byTot)};
    D.roll.forEach(function(b){ o.roll[b.label]=r(b); }); D.by.rows.forEach(function(x){ o.by[x.label]=r(x.b); }); fcView=''; return JSON.stringify(o); })()`));
  const P3 = ev(`dispTitle(itemById('PRIME-3'))`), MISC = 'Miscellaneous OGC Efforts';
  const want = {
    '': { roll: { [P3]: bag({ [Jn]: 100, [Mr]: 50 }, 0, 150), [MISC]: bag({ [Fb]: 40 }, 30, 70) }, head: 'BY PMO',
          by: { AV: bag({ [Jn]: 30, [Fb]: 40, [Mr]: 30 }, 0, 100), TSS: bag({ [Jn]: 70, [Mr]: 20 }, 0, 90), PSM: bag({}, 30, 30) } },
    'p:AV': { roll: { [P3]: bag({ [Jn]: 30, [Mr]: 30 }, 0, 60), [MISC]: bag({ [Fb]: 40 }, 0, 40) }, head: 'AV BY SERVICE',
          by: { USAF: bag({ [Jn]: 30, [Fb]: 40, [Mr]: 30 }, 0, 100) } },
    'p:TSS': { roll: { [P3]: bag({ [Jn]: 70, [Mr]: 20 }, 0, 90) }, head: 'TSS BY SERVICE',
          by: { USAF: bag({ [Jn]: 20, [Mr]: 20 }, 0, 40), ANG: bag({ [Jn]: 50 }, 0, 50) } },
    'p:PSM': { roll: { [MISC]: bag({}, 30, 30) }, head: 'PSM BY SERVICE', by: { ANG: bag({}, 30, 30) } },
    's:0': { roll: { [P3]: bag({ [Jn]: 50, [Mr]: 50 }, 0, 100), [MISC]: bag({ [Fb]: 40 }, 0, 40) }, head: 'USAF BY PMO',
          by: { AV: bag({ [Jn]: 30, [Fb]: 40, [Mr]: 30 }, 0, 100), TSS: bag({ [Jn]: 20, [Mr]: 20 }, 0, 40) } },
    's:1': { roll: { [P3]: bag({ [Jn]: 50 }, 0, 50), [MISC]: bag({}, 30, 30) }, head: 'ANG BY PMO',
          by: { TSS: bag({ [Jn]: 50 }, 0, 50), PSM: bag({}, 30, 30) } },
  };
  const got = {};
  Object.keys(want).forEach(v => {
    const g = got[v] = view(v), w = want[v];
    chk(name, v || 'whole', 'the roll-up rows, by month, UNSCHEDULED and TOTAL',
      J(Object.keys(g.roll).sort().map(k => [k, J(g.roll[k])])), J(Object.keys(w.roll).sort().map(k => [k, w.roll[k]])));
    chk(name, v || 'whole', 'the breakdown the other way, and its heading', g.head + ' ' + J(Object.keys(g.by).sort().map(k => [k, J(g.by[k])])),
      w.head + ' ' + J(Object.keys(w.by).sort().map(k => [k, w.by[k]])));
    chk(name, v || 'whole', 'the breakdown adds to the roll-up', J(g.byTot), J(g.rollTot));
  });
  // EVERY VIEW ADDS BACK TO THE WHOLE PORTFOLIO, month by month: the offices, and the services
  const add = vs => J(vs.map(v => got[v].rollTot).reduce((a, b) => a.map((x, i) => Math.round((x + b[i]) * 100) / 100)));
  chk(name, 'ties', 'AV + TSS + PSM is the whole portfolio, every month', add(['p:AV', 'p:TSS', 'p:PSM']), J(got[''].rollTot));
  chk(name, 'ties', 'USAF + ANG is the whole portfolio, every month', add(['s:0', 's:1']), J(got[''].rollTot));
  // THE PICKER: one small control in the title line, the whole portfolio first, only what places money
  const pick = JSON.parse(ev(`(function(){ fcOpen=false; toggleFc(); var s=document.getElementById('fcView');
    var o={inTitle:!!(s && s.closest('h3')), opts:s? [].slice.call(s.options).map(function(x){ return x.value; }) : [], sel:s? s.value : null,
      exp:!!document.querySelector('#fcPanel h3 #fcExport')};
    s.value='p:TSS'; s.dispatchEvent(new Event('change'));
    o.after=document.getElementById('fcTitle').textContent; o.rollHead=document.querySelector('#fcBody div').textContent;
    toggleFc(); toggleFc(); o.reopened=fcView+'|'+document.getElementById('fcView').value; toggleFc(); return JSON.stringify(o); })()`));
  const G = JSON.parse(ev('JSON.stringify(GROUPS)')).filter(g => ['AV', 'TSS', 'PSM'].includes(g));
  chk(name, 'picker', 'in the title line, with the export beside it', pick.inTitle + ' ' + pick.exp, 'true true');
  chk(name, 'picker', 'whole portfolio, then each office, then each service', J(pick.opts), J([''].concat(G.map(g => 'p:' + g), ['s:0', 's:1'])));
  chk(name, 'picker', 'choosing TSS retitles the box and the roll-up', /— TSS/.test(pick.after) + ' ' + /ROLLUP — PRIME CONTRACTS \+ MISCELLANEOUS OGC — TSS/.test(pick.rollHead), 'true true');
  chk(name, 'picker', 'the box always opens on the whole portfolio', pick.reopened, '|');
  // EXPORT THIS VIEW: exactly the rows on screen, in dollars, each TOTAL the sum of the figures above it
  const X = JSON.parse(ev(`(function(){ var dl=[], got=null, ob=buildXlsx, oc=HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click=function(){ dl.push(this.download||''); }; buildXlsx=function(s){ got=s; return ob(s); };
    fcView='p:AV'; exportFcView(); fcView='';
    buildXlsx=ob; HTMLAnchorElement.prototype.click=oc;
    var rows=got[0].rows.map(function(r){ return (r||[]).map(function(c){ return c && typeof c==='object'? c.v : c; }); });
    return JSON.stringify({dl:dl, sheets:got.length, title:String(rows[0][0]), rows:rows}); })()`));
  chk(name, 'export', 'one workbook, named for the view', J(X.dl) + ' ' + X.sheets, J([ev(`expName(FYL()+' Spend Plan Forecast - AV.xlsx')`)]) + ' 1');
  chk(name, 'export', 'its title names the view', /Projected Spend Plan Forecast — AV —/.test(X.title), true);
  const line = l => { const r = X.rows.find(x => x[0] === l); return r ? J(r.slice(1)) : 'absent'; };
  chk(name, 'export', 'the AV roll-up rows, in dollars', line(P3) + ' ' + line(MISC), want['p:AV'].roll[P3] + ' ' + want['p:AV'].roll[MISC]);
  const tots = X.rows.filter(r => r[0] === 'TOTAL').map(r => J(r.slice(1)));
  chk(name, 'export', 'both TOTALs: the roll-up and AV by service', J(tots), J([bag({ [Jn]: 30, [Fb]: 40, [Mr]: 30 }, 0, 100), bag({ [Jn]: 30, [Fb]: 40, [Mr]: 30 }, 0, 100)]));
  chk(name, 'export', 'and the service row', line('USAF'), want['p:AV'].by.USAF);
  // A SHARE IS A SHARE OF THE WHOLE PLACEMENT on every surface that splits by office: the CR windows by PMO and
  // the PMO tabs' spend plan. Placed on its own, AV's 60% of PRIME-3's USAF ($42 disc, $18 mand) would fill
  // January with $42 and March with $18; as a share of the whole it is $30 and $30.
  const crP = JSON.parse(ev(`JSON.stringify((function(){ var R=crBuckets(null,'pmo'); var o={}; R.keys.forEach(function(k,i){ o[k]=R.data[i].win.map(function(v){ return Math.round(v*100)/100; }).concat([Math.round(R.data[i].nodate*100)/100]); }); return o; })())`));
  const win = (m, nd) => { const a = Array(12).fill(0); Object.keys(m).forEach(k => { a[k * 2] = m[k]; }); return J(a.concat([nd])); };
  chk(name, 'shares', 'CR by PMO: AV, TSS and PSM by window', J([crP.AV, crP.TSS, crP.PSM].map(J)),
    J([win({ [Jn]: 30, [Fb]: 40, [Mr]: 30 }, 0), win({ [Jn]: 70, [Mr]: 20 }, 0), win({}, 30)]));
  const sheets = JSON.parse(capture(ev));
  const months = n => { const sh = sheets.find(x => x.name === n); if (!sh) return 'no ' + n;
    const rows = sh.rows.map(r => (r || []).map(cv)); const h = rows.findIndex(r => r[0] === 'Rank' && r.includes('Unscheduled'));
    const tot = h < 0 ? null : rows.slice(h + 1).find(r => /^TOTAL/.test(String(r[0])));
    return tot ? J(rows[h].map((k, i) => [k, tot[i]]).filter(([k]) => /^(OCT|NOV|DEC|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP) \d\d$|^Unscheduled$/.test(String(k))).map(([, v]) => Math.round((+v || 0) * 100) / 100)) : 'no total'; };
  const mon = (m, u) => { const a = Array(12).fill(0); Object.keys(m).forEach(k => { a[k] = m[k]; }); return J(a.concat([u])); };
  chk(name, 'shares', 'the PMO tabs’ spend plan: AV, TSS, PSM', J([months('PMO AV'), months('PMO TSS'), months('PMO PSM')]),
    J([mon({ [Jn]: 30, [Fb]: 40, [Mr]: 30 }, 0), mon({ [Jn]: 70, [Mr]: 20 }, 0), mon({}, 30)]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
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
  try {
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
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ═══ the absorb line ════════════════════════════════════════════════════════════════════════════
// What the nominated contract would give up if the portfolio does not close. Per service, capped by
// what that service actually holds above the floor — and the floor is spread in the SHAPE of the
// allocation, not applied whole to every service.
{
  const name = 'absorb';
  try {
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
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ═══ the on-screen marker on the spend forecast panel ════════════════════════════════════
// The workbook's markers are asserted in audit.mjs. This one is the marker the USER actually sees:
// the forecast panel's own heading, under "Discretionary only". It is rendered, never exported, so
// no export suite can reach it — exactly the class of figure this file exists for.
{
  const name = 'forecast marker';
  try {
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
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
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
  try {
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
    var ins=document.getElementById('inspector');
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
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
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
  try {
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
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ══ v1.95: THE SPRUILLS TABLE BY SERVICE, BY YEAR, AND FOR ANOTHER APPROPRIATION ══════════════
// v1.95 (item 55) reads each year of the Spruills from that year's own state. Its checks hold Total
// Requirements and the rows by PMO for two years on the board's own appropriation, and another
// appropriation's rows by PMO. The rest of what the table prints was held for the year on screen
// only, or not at all: the rows by service, Available Funding (and so the Delta) for a year after the
// one on screen, and another appropriation's Total Requirements, Available Funding and rows. The
// money map (tools/money-map.json, spGather) cites this block for those cells.
//
// Full Fund is stood up the way a consolidated file carries it -- its payload in APPNS, its state
// alongside -- at three services against this board's two, so a row filed by this board's service
// list is caught. The oracle is the scenario's own arithmetic.
{
  const name = 'v1.95 — the Spruills by service, by year and for another appropriation';
  try {
  const J = JSON.stringify, M = 1e6;
  const { ev, errors } = boot();
  seed(ev, { services: ['USAF', 'ANG'], items: [it('A', 'AV', [10 * M, 2 * M]), it('B', 'TSS', [3 * M, 1 * M])],
    disc: [20 * M, 5 * M], mand: [4 * M, 1 * M], order: ['A', 'B'] });
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); MS.years[MS.cur]=S; save(); 'ok'`);
  const cur = +ev('MS.cur'), Y = [cur, cur + 1];
  // the next year, through the board's own editors: its own asks and its own budget
  ev(`switchYear(${cur + 1});
      setAsk('A',0,'10000000'); setAsk('A',1,'5000000'); setAsk('B',0,'3000000'); setAsk('B',1,'1000000');
      bmSetBase('disc',0,'30000000'); bmSetBase('disc',1,'6000000'); bmSetBase('mand',0,'0'); bmSetBase('mand',1,'2000000');
      switchYear(${cur}); 'ok'`);
  // Full Fund: an override in the year on screen, an added requirement in the next
  ev(`(function(){ var P=APPNS['FULL FUND']; P.services.length=0; P.items.length=0;
    ['USAF','ANG','AFRC'].forEach(function(s){ P.services.push(s); });
    P.items.push({id:'FF1', grp:'PSM', team:'PSM', sect:'', custom:false, title:'Req FF1', event:'Ev FF1', ccar:'CCFF1', fy26:[0,0,0], ask:[1000000,2000000,3000000], alloc:null});
    P.items.push({id:'FF2', grp:'AV', team:'AV', sect:'', custom:false, title:'Req FF2', event:'Ev FF2', ccar:'CCFF2', fy26:[0,0,0], ask:[4000000,0,1000000], alloc:null});
    var st={base:MS.base, cur:MS.cur, years:{}};
    st.years[${cur}]={asks:{FF1:[2000000,2000000,3000000]}, order:['FF1','FF2'], discSvc:[5000000,1000000,1000000], mandSvc:[1000000,0,0]};
    st.years[${cur + 1}]={asks:{}, order:['FF1','FF2','FFN'], discSvc:[6000000,2000000,2000000], mandSvc:[0,0,1000000],
      custom:[{id:'FFN', grp:'TSS', sect:'new', custom:true, title:'FF added (made up)', event:'e', ccar:'', fy26:[0,0,0], ask:[1000000,1000000,1000000], alloc:null}]};
    localStorage.setItem(_SLUGMAP.ff.key, JSON.stringify(st)); return 'ok'; })()`);
  const gather = by => JSON.parse(ev(`(function(){ var keep=[spBy, spSvc, spPmo]; try{ spBy=${J(by)}; spSvc='ALL'; spPmo='ALL';
      return JSON.stringify(spGather().blocks); } finally { spBy=keep[0]; spSvc=keep[1]; spPmo=keep[2]; } })()`));
  const own = ev('APPN'), bySvc = gather('svc'), byPmo = gather('pmo');
  const blk = (B, n) => B.find(b => b.name === n) || { rows: {}, req: {}, bud: {} };
  const rows = (b, keys) => keys.map(k => Y.map(y => (b.rows[k] || {})[y]));
  // THE TRUTH, by hand
  chk(name, 'by service', 'the board’s own rows by service, each year from that year’s own asks',
    J(rows(blk(bySvc, own), ['USAF', 'ANG'])), J([[13 * M, 13 * M], [3 * M, 6 * M]]));
  chk(name, 'by year', 'the board’s own Total Requirements, Available Funding and Delta, each year from that year’s own state',
    J(Y.map(y => { const b = blk(byPmo, own); return [b.req[y], b.bud[y], b.bud[y] - b.req[y]]; })),
    J([[16 * M, 30 * M, 14 * M], [19 * M, 38 * M, 19 * M]]));
  chk(name, 'another appropriation', 'Full Fund’s Total Requirements, Available Funding and Delta, each year from its own state',
    J(Y.map(y => { const b = blk(byPmo, 'FULL FUND'); return [b.req[y], b.bud[y], b.bud[y] - b.req[y]]; })),
    J([[12 * M, 8 * M, -4 * M], [14 * M, 11 * M, -3 * M]]));
  chk(name, 'another appropriation', 'Full Fund’s rows by service, at its own three services, each year',
    J(rows(blk(bySvc, 'FULL FUND'), ['USAF', 'ANG', 'AFRC'])), J([[6 * M, 6 * M], [2 * M, 3 * M], [4 * M, 5 * M]]));
  chk(name, 'another appropriation', 'Full Fund’s rows by PMO, each year: its override, its added requirement once',
    J(rows(blk(byPmo, 'FULL FUND'), ['PSM', 'AV', 'TSS'])), J([[7 * M, 6 * M], [5 * M, 5 * M], [null, 3 * M]]));
  const both = [blk(bySvc, own), blk(bySvc, 'FULL FUND')];
  chk(name, 'the rows add up', 'in each block and year, the rows by service add to Total Requirements',
    J(both.map(b => Y.map(y => Object.values(b.rows).reduce((a, r) => a + (r[y] || 0), 0) - b.req[y]))), J([[0, 0], [0, 0]]));
  if (errors.length) chk(name, 'jsdom', 'no script errors', errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
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
  try {
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
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ══ the edit box saves what was typed, and opens where it is asked to (v2.08, item 122) ══
// Note, Description and Impact were a pop-up from v1.86, and 📋 Requirement edit a box of its own. v2.08 made them one box,
// the whole record, held until Save (Brad, 26 Oct 2026). What this held of the pop-up still holds: each written field is its
// own field, a Save writes only what changed -- the unchanged note is never re-stamped or trimmed -- and a requirement gone
// from under the box leaves it saying so, not throwing. Driven through the box's own controls.
{
  const name = 'the edit box: the written fields';
  try {
  const sc = { services: ['USAF', 'ANG', 'AFRC'],
    items: [it('A', 'PSM', [9000000, 2000000, 1000000])],
    disc: [9000000, 2000000, 1000000], mand: [0, 0, 0], order: ['A'] };
  const { ev, errors } = boot();
  seed(ev, sc);
  ev('render(); if(typeof setCur==="function") setCur("A"); "ok"');
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  const isOpen = () => ev(`(function(){ var e=document.getElementById('editPanel');
    return e? /\\bopen\\b/.test(e.className) : false; })()`);
  const put = (id, v) => ev(`(function(){ var e=document.getElementById(${JSON.stringify(id)}); e.value=${JSON.stringify(v)}; e.dispatchEvent(new Event('input')); return 'ok'; })()`);

  // 1. the impact statement
  ev(`toggleCons('A'); "ok"`);
  chk(name, 'cons', 'opens on the requirement, at the impact statement', isOpen() + ' · ' + ev(`document.activeElement && document.activeElement.id`), 'true · erCons');
  chk(name, 'cons', 'labelled with the one name the board uses', ev(`(document.querySelector('label[for="erCons"]')||{}).textContent.indexOf('Impact statement')===0`), true);
  put('erCons', 'Depot line stops in March.');
  ev(`erSave(); "ok"`);
  chk(name, 'cons', 'saves what was typed', ev(`(S.cons||{})['A']||''`), 'Depot line stops in March.');
  chk(name, 'cons', 'and closes once saved', isOpen(), false);

  // DESCRIPTION AND NOTE: each its own field -- kept, journalled and sent as itself
  ev(`toggleDesc('A'); "ok"`);
  chk(name, 'desc & note', 'the description opens the box at the description', ev(`document.activeElement && document.activeElement.id`), 'erDesc');
  put('erDesc', 'Sustains the fielded capability.'); put('erNote', 'Agreed at the Sep SFWG.');
  ev(`erSave(); "ok"`);
  chk(name, 'desc & note', 'saves both, each to its own field', ev(`[(S.desc||{}).A, S.notes.A].join(' | ')`), 'Sustains the fielded capability. | Agreed at the Sep SFWG.');
  chk(name, 'desc & note', 'and closes once saved', isOpen(), false);
  // SAVING ONE NEVER RE-STAMPS OR TRIMS THE OTHER. The note is held exactly as an import left it, spacing and all.
  ev(`S.notes.A='Agreed at the Sep SFWG.  '; save(); "ok"`);
  const j0 = ev(`(MS.jrnl||[]).length`);
  ev(`toggleDesc('A'); "ok"`); put('erDesc', 'Sustains the fielded fleet.'); ev(`erSave(); "ok"`);
  chk(name, 'desc & note', 'a changed description is written', ev(`(S.desc||{}).A`), 'Sustains the fielded fleet.');
  chk(name, 'desc & note', 'the unchanged note is not written at all', ev(`JSON.stringify(S.notes.A)`), JSON.stringify('Agreed at the Sep SFWG.  '));
  chk(name, 'desc & note', 'and the journal records the description alone',
    ev(`JSON.stringify((MS.jrnl||[]).slice(${j0}).map(function(e){ return (e.p||[])[0]; }))`), '["desc"]');
  ev(`toggleDesc('A'); "ok"`); put('erDesc', ''); ev(`erSave(); "ok"`);
  chk(name, 'desc & note', 'clearing the description leaves the note', ev(`[JSON.stringify((S.desc||{}).A||null), JSON.stringify(S.notes.A)].join(' | ')`),
    'null | ' + JSON.stringify('Agreed at the Sep SFWG.  '));
  const j1 = ev(`(MS.jrnl||[]).length`);
  ev(`toggleNote('A'); erSave(); "ok"`);
  chk(name, 'desc & note', 'a Save with nothing changed writes nothing and closes', isOpen() + ' ' + ev(`(MS.jrnl||[]).length`) + ' ' + ev(`JSON.stringify(S.notes.A)`),
    'false ' + j1 + ' ' + JSON.stringify('Agreed at the Sep SFWG.  '));
  // A REQUIREMENT GONE FROM UNDER THE BOX: it stays open, says so on Save, writes nothing, and nothing throws
  ev(`toggleCons('A'); "ok"`); put('erCons', 'typed after it went');
  const before = ev(`JSON.stringify(S)`);
  let err = '';
  try { ev(`erOpen='GONE'; render(); erSave(); "ok"`); } catch (e) { err = String(e.message || e); }
  chk(name, 'stale', 'a requirement gone from under the box: nothing thrown', err || 'none', 'none');
  chk(name, 'stale', 'Save says it is no longer on the board', ev(`/no longer on the board/.test(document.getElementById('erMsg').textContent)`), true);
  chk(name, 'stale', 'and writes nothing', ev(`JSON.stringify(S)`) === before, true);
  ev(`erClose(); "ok"`);

  // 2. the routing: each RECORD panel button opens the one box at its own field
  for (const [fn, f] of [['toggleCons', 'erCons'], ['toggleDesc', 'erDesc'], ['toggleNote', 'erNote'], ['toggleRec', 'erEvent']]) {
    ev(`${fn}('A'); "ok"`);
    chk(name, 'routing', `${fn} opens the box at ${f}`, isOpen() + ' · ' + ev(`document.activeElement && document.activeElement.id`), 'true · ' + f);
    ev(`erClose(); "ok"`);
  }
  // ONE NAME EVERYWHERE: nothing on screen still says the old ones
  ev(`S.cons={}; S.band.A=BANDS_LIST()[0].id; render(); if(typeof inspectorBody==='function') inspectorBody(); "ok"`);
  const shown = ev(`(function(){ var b=document.body.cloneNode(true); b.querySelectorAll('script,style').forEach(function(x){ x.remove(); }); return b.textContent; })()`);   // what a person can read, not the code
  chk(name, 'names', 'no "📋 Record", "Impact —", "CONSEQUENCE" or "REQUIREMENT RECORD" is left on screen',
    ['\ud83d\udccb Record', 'Impact \u2014', 'CONSEQUENCE', 'REQUIREMENT RECORD'].filter(t => shown.indexOf(JSON.parse('"' + t + '"')) >= 0).join(',') || 'none', 'none');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
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
  try {
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
    ev(`matCols().indexOf('mipr')>=0`), true);
  chk(name, 'matrix', 'and the bulk sweep has a setter for every column it draws',
    ev(`JSON.stringify(matBulkOk())`), '[]');
  chk(name, 'matrix', 'a bulk set writes the value, not the label',
    ev(`matSet('bulkF','mipr'); matSet('bulkV','direct'); matApplyBulk(); miprOf('A')`),
    'direct');
  // The year copy is NOT asserted here. 'mipr' is on yearCopy()'s normalise list, and
  // `copy / move between years` in audit-import.mjs reads that list out of the board's own source
  // and proves every container in it actually receives data. Restating it here would be a second
  // check of the same thing that could drift from the first -- and the tautology this replaced
  // ("'listed' : 'listed'") asserted nothing at all while looking like it did.
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
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
  try {
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
  ev(`matPmo='ALL'; matMissing=''; matSet('bulkF','mipr'); matSet('bulkV','direct'); 'ok'`);
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
  ev(`matSet('bulkF','destEnd'); matSet('bulkV','dla'); matApplyBulk(); 'ok'`);
  chk(name, 'second hop', 'the OGC takes the ultimate recipient', ev(`destOf(itemById('A')).end`), 'dla');
  chk(name, 'second hop', 'the prime does not', ev(`destOf(itemById('B')).end||'(none)'`), '(none)');

  // AN ENTRY WITH NO applies() STILL REACHES EVERYONE -- the fix must not have narrowed the sweep
  // for the fields every requirement offers, which is the trap the obvious fix would have fallen
  // into. Obligation category is offered on every record.
  ev(`matSet('bulkF','obCat'); matSet('bulkV',OB_CATS[0]); 'ok'`);
  const Q = JSON.parse(ev(`JSON.stringify(matBulkPreview())`));
  chk(name, 'ungated', 'a field every requirement offers reaches all three', Q.n, 3);
  chk(name, 'ungated', 'and leaves none alone', Q.skip, 0);
  ev(`matApplyBulk(); 'ok'`);
  chk(name, 'ungated', 'and lands on all three',
    ev(`['A','B','C'].filter(function(id){ return obCatOf(id)===OB_CATS[0]; }).length`), 3);
  // The per-service budget setters are bulk-only -- no record label -- and must still be offered.
  chk(name, 'ungated', 'the bulk-only per-service budget setters are still in the sweep',
    ev(`Object.keys(matBulk()).some(function(k){ return k.indexOf('bud|')===0; })`), true);

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
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
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
  try {
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
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
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
  try {
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
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
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
  try {
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
  // v1.90: the row's allocation box is drawn in the Fund mode, which is where this control lives now
  const ctl = JSON.parse(ev(`(function(){
    uiMode='fund'; uiApply();
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
  ev(`uiMode='review'; uiApply(); render(); 'ok'`);   // back to the default for everything below
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
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
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
  try {
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
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
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
  try {
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
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ═══ THE PMO MENU IS THE ONE PLACE THE OFFICES ARE CHOSEN ═══════════════════════════════
// The offices and the prime/OGC filter used to be chips beside the search box, and the prime filter
// was ALSO in the Filter menu -- two homes for one control. They are one menu now, which moves a
// selection that used to be visible at a glance behind a click. So the button has to say what is
// selected, or the board shows one office's requirements while looking like it shows all of them.
{
  const name = 'the PMO menu';
  try {
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
  // v1.90: the label beside it says PMO; the button says whose requirements are showing
  chk(name, 'button', 'with nothing picked it says all offices', /All offices/.test(m.button), true);
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
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
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
  try {
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
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}


// ═══ CR CASH NEEDS — THE HALF-MONTH PLACEMENT ═══════════════════════════════════════════════════
// crData() places every funded dollar into one of twelve half-month windows across Oct–Mar, or into
// the no-date bucket. The register recorded it as a gap on 15 Sep: its WIRING was guarded (the sheet
// follows the toggle, the 1A9A return does not) and its arithmetic was not. Every placement rule gets
// a requirement here. The lanes are deep, so each requirement is funded in full and the placement is
// the only arithmetic under test.
//   A  single date, November          -> the 1–15 window of November, whole
//   B  single date, December, month only, with an old 16-EOM mark -> the 1–15 window of December. v1.94: the
//      award's own date decides, and a month with no day counts as the 1st; the mark decides nothing (it was the
//      16–EOM window up to v1.93, when one mark per requirement and month set the half)
//   C  awards October and April, a third and two-thirds of its funding -> a THIRD lands in October;
//      the April share is outside Oct–Mar and is not placed anywhere -- it is not cash needed under a CR
//   D  no award date                  -> no date
//   E  increments with no weight      -> no date
//   F  funded in STOVL only, March    -> a row in STOVL and in no other service
{
  const name = 'CR cash needs — the half-month placement';
  try {
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
      S.awards['C']={mode:'inc', inc:[{d:FYMON[0][0], sv:[20,10,5]},{d:FYMON[6][0], sv:[40,20,10]}]};
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
    want[W(2, 0)] += f.B[i];          // B: December, month only -- the 1st, whatever the old mark says (v1.94)
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
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}


// ═══ PPBE CYCLES — THE LOCK IS THE WINDOW, FROZEN ══════════════════════════════════════════
// A lock copies every window year that holds a plan, projects each from ITS OWN state, and never
// changes afterwards; the working plan is untouched and gets its tag and reference. The year on
// screen sits OUTSIDE the window here (base = cur+1), the way FY27 does once the base rolls to
// FY28, and three window years are deliberately blank. Then the file, the import, the legacy
// migration and the Spruills are each made to prove they read the lock and nothing else.
{
  const name = 'PPBE cycles — the lock is the window, frozen';
  try {
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
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH. On a mutated board a cycle can be
    // missing where the block expects one, and reading it threw; the sweep then saw a suite that
    // died, which proves nothing (CRASHED), where it should see a suite that noticed (a failure).
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}


// ═══ PPBE CYCLES — A LOCKED VIEW IS READ-ONLY AND LEAVES NO TRACE ═════════════════════════
// Viewing a cycle sets the whole working store aside and puts a throwaway copy on the page with
// the cycle's years in it, so every panel reads the lock through the ordinary path. Everything
// below is about the two things that must then be true: nothing changed on the copy can look
// kept or reach anything durable, and leaving returns the working plan byte for byte.
{
  const name = 'PPBE cycles — a locked view is read-only and leaves no trace';
  try {
  const sc = { services: ['USAF', 'ANG', 'STOVL'],
    items: [it('A', 'PSM', [100, 50, 20]), it('B', 'AV', [80, 40, 10]), it('C', 'PSM', [60, 30, 15]), it('D', 'MxS', [40, 20, 5])],
    disc: [150, 60, 30], mand: [40, 20, 10], order: ['A', 'B', 'C', 'D'] };
  const { ev, errors } = boot();
  seed(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); 'ok'`);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  const cur = +ev('MS.cur');
  const key = 'PB|' + cur;
  // a second planned year, the lock, and then the working plan moves on
  ev(`MS.years[MS.cur]=S; MS.base=MS.cur;
      var y1=JSON.parse(JSON.stringify(S)); y1.asks={A:[200,100,40]}; delete y1.pmoOrder; MS.years[MS.cur+1]=y1;
      blCyc='PB'; blYr=MS.cur; cycLock();
      setAsk('B',0,'123'); S.mc['A']=true; save(); 'ok'`);
  const settled = () => ev(`(function(){ var m=JSON.parse(JSON.stringify(MS)); Object.keys(m.years).forEach(function(y){ delete m.years[y].pmoOrder; });
    m.ts=0; (m.log||[]).forEach(function(e){ e.ts=0; }); return JSON.stringify(m); })()`);
  const lm0 = ev(`flowCfg().rules.lm`);
  const before = settled(), ls0 = ev(`localStorage.getItem(_AP.key)`), lock0 = ev(`JSON.stringify(CYCDB)`);
  const title0 = ev('document.title'), dirty0 = ev('DIRTY'), shadow0 = ev('JSON.stringify(_jrnlShadow)');
  chk(name, 'fixture', 'the working plan has moved on since the lock', ev(`JSON.stringify(itemById('B').ask)`), JSON.stringify([123, 40, 10]));
  chk(name, 'fixture', 'and is dirty', dirty0, true);
  // THE JOURNAL AS IT STOOD, to compare byte for byte after the view. The check this replaces
  // searched the journal's JSON for '999' (the value typed on the view) -- and found it in every
  // entry's TIMESTAMP whenever the clock read 1789 99x xxx xxx, which it did from 11:26Z to 14:13Z
  // on 21 Sep 2026, when the v1.80 gate ran this suite. A check that greps the serialised world
  // for a number is a check that fails on the clock.
  const jrnl0 = ev('JSON.stringify(MS.jrnl||[])');
  ev(`cycView('${key}'); 'ok'`);
  chk(name, 'view', 'the view is on', ev('CYCVIEW'), key);
  chk(name, 'view', 'the board shows the locked plan: B as it was', ev(`JSON.stringify(itemById('B').ask)`), JSON.stringify([80, 40, 10]));
  chk(name, 'view', 'and A unstarred', ev(`!!S.mc.A`), false);
  chk(name, 'view', 'on the year the plan was on', +ev('MS.cur'), cur);
  chk(name, 'view', 'every year on the drill is the cycle’s, so every panel reads the lock', ev(`JSON.stringify(MS.years[MS.cur+1].asks.A)`), JSON.stringify([200, 100, 40]));
  chk(name, 'view', 'the chart of accounts prints the locked ask', ev(`coaRows().filter(function(r){ return r.id==='B'; })[0].ask`), 130);
  chk(name, 'view', 'the header says so, naming the appropriation (v2.05, item 116)', /VIEWING O&M PB\d\d/.test(ev(`document.getElementById('cycTag').textContent`)), true);
  chk(name, 'view', 'the board carries the banner, naming the appropriation (v2.05, item 116)', /VIEWING O&M PB\d\d \(LOCKED\)/.test(ev(`document.getElementById('list').textContent`)), true);
  chk(name, 'view', 'the title says so, for every export that prints it', /LOCKED VIEW/.test(ev('document.title')), true);
  chk(name, 'view', 'and every file name says so, naming the appropriation (v2.05, item 116)', /\[O&M PB\d\d LOCKED\]\.xlsx$/.test(ev(`expName('ORBIT Breakouts.xlsx')`)), true);
  // writes are refused, and revert
  ev(`setAsk('B',0,'999'); 'ok'`);
  chk(name, 'writes', 'an edit is refused and reverts on screen', ev(`JSON.stringify(itemById('B').ask)`), JSON.stringify([80, 40, 10]));
  chk(name, 'writes', 'and the status says it was not kept', /not kept/i.test(ev(`document.getElementById('shareStat').innerHTML`)), true);
  chk(name, 'writes', 'save() returns false', ev('save()'), false);
  chk(name, 'writes', 'persist() returns false', ev('persist()'), false);
  chk(name, 'writes', 'browser storage is untouched', ev(`localStorage.getItem(_AP.key)`) === ls0, true);
  chk(name, 'writes', 'the lock itself is untouched', ev(`JSON.stringify(CYCDB)`) === lock0, true);
  chk(name, 'writes', 'a board file cannot be built from a view', ev(`(function(){ try{ buildSavedHtml(); return 'built'; }catch(e){ return 'refused'; } })()`), 'refused');
  chk(name, 'writes', 'a board cannot be loaded over a view', ev(`applyStore({base:MS.base, cur:MS.cur, years:{}})`), false);
  chk(name, 'writes', 'a lock cannot be taken from a view', ev(`blCyc='BES'; blYr=MS.cur; cycLock(); blGet('BES|'+MS.cur)`), null);
  chk(name, 'writes', 'the cycle on screen cannot be deleted', ev(`blLock('${key}',false); blDelete('${key}'); !!blGet('${key}')`), true);
  ev(`blLock('${key}',true); flowCfg().rules.lm='VIEWEDIT'; 'ok'`);   // an MS-level edit, to be lost with the view
  // years stay inside the cycle
  ev(`switchYear(MS.cur+1); 'ok'`);
  chk(name, 'years', 'a year the cycle holds opens, as the cycle held it', +ev('MS.cur') + ':' + ev(`JSON.stringify(itemById('A').ask)`), (cur + 1) + ':' + JSON.stringify([200, 100, 40]));
  chk(name, 'years', 'still on view', ev('CYCVIEW'), key);
  ev(`switchYear(MS.cur+3); 'ok'`);
  chk(name, 'years', 'a year the cycle never held is refused, not created', +ev('MS.cur') + ':' + ev(`MS.years[MS.cur+3]===undefined`), (cur + 1) + ':true');
  chk(name, 'years', 'and the status says which years it holds', /holds no FY/.test(ev(`document.getElementById('shareStat').innerHTML`)), true);
  // leave
  ev(`cycLeave(); 'ok'`);
  chk(name, 'leave', 'the view is off', ev('CYCVIEW'), '');
  chk(name, 'leave', 'the working plan is back, byte for byte', settled() === before, true);
  chk(name, 'leave', 'on the year it was on', +ev('MS.cur'), cur);
  chk(name, 'leave', 'with the board wired to it', ev('MS.years[MS.cur]===S'), true);
  chk(name, 'leave', 'B as the working plan has it', ev(`JSON.stringify(itemById('B').ask)`), JSON.stringify([123, 40, 10]));
  chk(name, 'leave', 'an edit to the board’s own settings made while viewing did not survive', ev(`flowCfg().rules.lm`), lm0);
  chk(name, 'leave', 'the title and the file names are back', ev('document.title') === title0 && !/LOCKED/.test(ev(`expName('x.xlsx')`)), true);
  chk(name, 'leave', 'the header is back to the working tag', ev(`document.getElementById('cycTag').textContent`), 'PB' + String(cur).slice(-2));
  chk(name, 'leave', 'the dirty flag is what it was', ev('DIRTY'), dirty0);
  chk(name, 'leave', 'and the journal is byte for byte what it was before the view', ev('JSON.stringify(MS.jrnl||[])') === jrnl0, true);
  chk(name, 'leave', 'so it carries nothing typed on the view', ev(`JSON.stringify(MS.jrnl||[]).indexOf('VIEWEDIT')<0 && !(MS.jrnl||[]).some(function(e){ return JSON.stringify([e.before,e.after,e.b,e.a,e.v]).indexOf('999')>=0; })`), true);
  // THE JOURNAL'S SHADOW is the one thing save() touches that persist() does not guard: a save
  // that ran on the view would take its shadow from the lock, and the first real save afterwards
  // would journal the difference as edits nobody made, in the current user's name.
  chk(name, 'leave', 'the journal’s shadow was never taken from the view', ev('JSON.stringify(_jrnlShadow)') === shadow0, true);
  const j0 = +ev('(MS.jrnl||[]).length');
  chk(name, 'leave', 'a later save still works', ev(`setAsk('C',0,'61'); save()`), true);
  chk(name, 'leave', 'and journals that edit alone — no phantom entries carrying the lock’s values',
    ev(`(MS.jrnl||[]).length>${j0} && (MS.jrnl||[]).slice(${j0}).every(function(e){ return JSON.stringify(e.p).indexOf('C')>=0; })`), true);
  // a migrated one-year cycle holds no plan to show
  ev(`var L={}; L['POM|'+MS.cur]={fy:MS.cur, ap:mySlug(), ts:5, by:'legacy', locked:true, svc:SVC.slice(), disc:[1,2,3], mand:[0,0,0], bands:[], reqs:[], pmo:{}};
      MS.baselines=L; cycMigrateLegacy(); cycView('POM|'+MS.cur); 'ok'`);
  chk(name, 'partial', 'a migrated one-year cycle cannot be viewed, and says why', ev('CYCVIEW') + ':' + /holds no plan to show/.test(ev(`document.getElementById('shareStat').innerHTML`)), ':true');
  // a cycle that never held the year on screen opens on the first year it holds
  ev(`switchYear(MS.cur+3); cycView('${key}'); 'ok'`);
  chk(name, 'open', 'a cycle that never held the year on screen opens on the first year it holds', +ev('MS.cur'), cur);
  ev(`cycLeave(); 'ok'`);
  chk(name, 'open', 'and leaving returns to the year that was on screen', +ev('MS.cur'), cur + 3);
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH. On a mutated board a cycle can be
    // missing where the block expects one, and reading it threw; the sweep then saw a suite that
    // died, which proves nothing (CRASHED), where it should see a suite that noticed (a failure).
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}


// ═══ v2.02 (U51) — A LOCKED CYCLE IS REPORT AND VIEW ONLY; REOPENED FROM THE WORKING PLAN, STAMPED ═══════════════
// Brad, 21 Oct 2026: "When I lock PB27 ... I want it to be report and view only. No changes." and "it will need to be
// re-openable ... it needs to be date stamped, so that we know nobody has made changes." A view unlocked any cycle (the one
// on screen included) and deleted another; a cycle locked again under its own name lost its record of being reopened.
{
  const name = 'v2.02 (U51) — a locked cycle is report and view only, reopened from the working plan and stamped';
  try {
  const sc = { services: ['USAF', 'ANG', 'STOVL'],
    items: [it('A', 'PSM', [100, 50, 20]), it('B', 'AV', [80, 40, 10])], disc: [150, 60, 30], mand: [40, 20, 10], order: ['A', 'B'] };
  const { ev } = boot();
  seed(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      localStorage.setItem('prio27who','Brad'); window.confirm=function(){ return true; }; window.alert=function(){};
      MS.years[MS.cur]=S; MS.base=MS.cur; blCyc='PB'; blYr=MS.cur; cycLock(); cycSetWorking('POM', MS.cur); blCyc='POM'; blYr=MS.cur; cycLock(); cycSetWorking('PB', MS.cur); 'ok'`);
  // v2.15 W1 (item 139): the plan is tagged with each cycle before it is locked as it, as Lock now asks (and put back on PB)
  const cur = +ev('MS.cur'), PB = 'PB|' + cur, POM = 'POM|' + cur, LBL = 'PB' + (cur % 100);
  const lines = k => JSON.parse(ev(`JSON.stringify(cycStampLines(blGet(${JSON.stringify(k)})))`));
  const shape = L => L.map(x => x.replace(/^(🔒 locked again|🔒 locked|🔓 reopened) .+? by Brad/u, '$1 <when> by Brad'));
  chk(name, 'taken', 'a new lock: locked, never reopened', JSON.stringify(shape(lines(PB))),
    JSON.stringify(['🔒 locked <when> by Brad', 'never reopened: the figures are as locked']));
  // POM reopened from the working plan, so the view has an unlocked cycle to try to delete
  ev(`blLock(${JSON.stringify(POM)}, false); 'ok'`);
  chk(name, 'working plan', 'reopening from the working plan works, and is stamped', JSON.stringify([ev(`blGet(${JSON.stringify(POM)}).locked`), shape(lines(POM))]),
    JSON.stringify([false, ['🔒 locked <when> by Brad', '🔓 reopened <when> by Brad', 'the figures are as first locked']]));
  // the view: nothing about any cycle can change
  ev(`cycView(${JSON.stringify(PB)}); 'ok'`);
  const said = () => ev(`(document.getElementById('shareStat')||{}).textContent||''`);
  chk(name, 'view', 'the banner says a CCaR QPE import still loads', /A CCaR QPE import \(active-year execution\) still loads here/.test(said()), true);
  const db0 = ev('JSON.stringify(CYCDB.cycles)');
  ev(`blLock(${JSON.stringify(PB)}, false); 'ok'`);
  chk(name, 'view', 'the cycle on screen is not reopened, and the line says why', JSON.stringify([ev(`blGet(${JSON.stringify(PB)}).locked`), said().startsWith('🔒 Unlocking a cycle is off while ' + LBL + ' is on screen.')]), JSON.stringify([true, true]));
  ev(`blLock(${JSON.stringify(POM)}, true); 'ok'`);
  chk(name, 'view', 'another cycle is not locked from the view', JSON.stringify([ev(`blGet(${JSON.stringify(POM)}).locked`), said().startsWith('🔒 Locking a cycle is off while ' + LBL + ' is on screen.')]), JSON.stringify([false, true]));
  ev(`blDelete(${JSON.stringify(POM)}); 'ok'`);
  chk(name, 'view', 'an unlocked cycle is not deleted from the view', JSON.stringify([!!JSON.parse(ev(`JSON.stringify(!!blGet(${JSON.stringify(POM)}))`)), said().startsWith('🔒 Deleting a cycle is off while ' + LBL + ' is on screen.')]), JSON.stringify([true, true]));
  chk(name, 'view', 'no cycle and no record moved', ev('JSON.stringify(CYCDB.cycles)') === db0, true);
  ev(`cycLeave(); 'ok'`);
  // back on the working plan: reopen PB, change a figure, lock it again under its own name -- the record goes with it
  const first = +ev(`blGet(${JSON.stringify(PB)}).ts`);
  ev(`blLock(${JSON.stringify(PB)}, false); setAsk('B',0,'123'); MS.years[MS.cur]=S; blCyc='PB'; blYr=MS.cur; cycLock(); 'ok'`);
  chk(name, 'replaced', 'locked again over its own name: the figures are new and the record says so', JSON.stringify([ev(`JSON.stringify(blGet(${JSON.stringify(PB)}).years[MS.cur].asks.B)`), shape(lines(PB))]),
    JSON.stringify([JSON.stringify([123, 40, 10]), ['🔒 locked <when> by Brad', '🔓 reopened <when> by Brad', '🔒 locked again <when> by Brad — its figures replaced', 'the figures are those locked last']]));
  chk(name, 'replaced', 'the first lock’s time is kept', +ev(`blGet(${JSON.stringify(PB)}).first.ts`), first);
  // POM locked again without being replaced: its figures are as first locked
  ev(`blLock(${JSON.stringify(POM)}, true); 'ok'`);
  chk(name, 'relocked', 'reopened and locked again, nothing replaced', JSON.stringify(shape(lines(POM))),
    JSON.stringify(['🔒 locked <when> by Brad', '🔓 reopened <when> by Brad', '🔒 locked again <when> by Brad', 'the figures are as first locked']));
  // the cycles panel prints the record
  ev(`blOpen=true; render(); 'ok'`);
  chk(name, 'panel', 'each cycle’s row carries its record', ev(`[].slice.call(document.querySelectorAll('#blBody .cyc-stamp')).length`), 2);
  // and it survives the file
  const html = ev('buildSavedHtml()');
  const R = boot({ html });
  chk(name, 'file', 'save → reopen keeps the record', R.ev(`JSON.stringify((blGet(${JSON.stringify(PB)})||{}).unlocks||[]).length > 2 && (blGet(${JSON.stringify(PB)}).first||{}).ts===${first}`), true);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ═══ v2.02 (item 89, ledger U52 / U53) — A LOCKED CYCLE KEEPS ITS OWN LISTS ═══════════════════════════════════════════════
// Brad, 20 Oct 2026: keep the destinations, the bands, the BAE list, and the PMO list with the requirement data pack, with the
// funds-flow money; 21 Oct: "When I lock PB27 ... I want it to be report and view only. No changes." PB27 is locked with A in
// office ZED on destination Depot One, band X, a BAE list naming ZED and AV, the data pack titling A "A title" / "A event", and
// International Partners $3,000,000 for FY27 with FY27 selected. Then the working plan moves on: the destination is renamed, band
// X removed, the AV discretionary name retired, A moved to AV and ZED deleted, a new data pack retitles A, and the partner money
// goes to FMS $2,000,000 with ALL YEARS. FAILS ON bd59dfa: the view read every one of those as they are today -- A filed under PSM
// (its stored ZED dropped against today's list) in the Spend Plan Source, the PMO tabs and the five-year plan, no budget on B's
// USAF discretionary line, A under "(not yet banded)", the new titles, and TOTAL FUNDING $2,000,290 under "[PB27 LOCKED]".
{
  const name = 'v2.02 (item 89) — a locked cycle keeps its own lists';
  try {
  const J = JSON.stringify;
  const sc = { services: ['USAF', 'ANG', 'STOVL'],
    items: [it('A', 'PSM', [100, 50, 20]), it('B', 'AV', [80, 40, 10])], disc: [150, 60, 30], mand: [40, 20, 10], order: ['A', 'B'] };
  const { ev, errors } = boot();
  seed(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      localStorage.setItem('prio27who','Brad'); window.confirm=function(){ return true; }; window.alert=function(){};
      MS.pmos=GROUPS.slice().concat(['ZED']); applyState(S); S.grp.A='ZED';
      flowEnts(); DESTDB.ents.push({k:'dz1', n:'Depot One', kind:'gov', t:'DEPOT ONE'}); S.dest={A:{to:'dz1'}};
      BANDS_LIST(); MS.bands.push({id:'bx', n:'Band X', d:'x', rule:'full', crit:false, consReq:false, c:'#123456'}); S.band.A='bx';
      BUDDB={ts:1700000000009, files:[], rows:['USAF O&M- CAM Discretionary AV','USAF O&M - CAM OBBBA Mandatory AV','USAF O&M- CAM Discretionary ZED'].map(budParseName).filter(Boolean)};
      _budRegCache=null; persistDest(); persistBud();
      flowCfg().other[MS.cur]={ip:3000000}; flowCfg().fys=[MS.cur];
      MS.years[MS.cur]=S; MS.base=MS.cur; save(); blCyc='PB'; blYr=MS.cur; cycLock(); 'ok'`);
  const key = 'PB|' + ev('MS.cur');
  chk(name, 'lock', 'CONTROL — PB27 is locked', ev(`!!(blGet(${J(key)})||{}).locked`), true);
  // THE WORKING PLAN MOVES ON
  ev(`DESTDB.ents.filter(function(e){ return e.k==='dz1'; })[0].n='Depot Renamed'; persistDest();
      MS.bands=MS.bands.filter(function(b){ return b.id!=='bx'; });
      BUDDB.rows.forEach(function(b){ if(b.n==='USAF O&M- CAM Discretionary AV') b.gone=1; }); BUDDB.ts++; _budRegCache=null; persistBud();
      S.grp.A='AV'; MS.pmos=MS.pmos.filter(function(g){ return g!=='ZED'; });
      BASE_ITEMS.forEach(function(i){ if(i.id==='A'){ i.title='A retitled'; i.event='A event retitled'; } });
      flowCfg().other={}; flowCfg().other[MS.cur]={fms:2000000}; flowCfg().fys=null;
      applyState(S); MS.years[MS.cur]=S; save(); 'ok'`);
  // every export of the board on screen, read cell by cell
  const books = (E) => JSON.parse(E(`(function(){ var res={};
    ['exportExcel','exportSrc','exportFlow','exportFydpPlan'].forEach(function(fn){ var cap=null, o=buildXlsx;
      buildXlsx=function(sh){ cap=sh; return new Uint8Array(0); };
      try{ window[fn](); }catch(e){ cap=[{name:'threw', rows:[[String(e&&e.message)]]}]; }
      buildXlsx=o;
      res[fn]=(cap||[]).map(function(sh){ return {name:sh.name, rows:(sh.rows||[]).map(function(r){ return (r||[]).map(function(c){ return (c&&typeof c==='object'&&'v' in c)? c.v : c; }); })}; }); });
    return JSON.stringify(res); })()`));
  const sheet = (B, fn, nm) => ((B[fn] || []).find(s => s.name === nm) || { rows: [] }).rows;
  const read = (E) => { const B = books(E);
    const src = (B.exportSrc[0] || { rows: [] }).rows.slice(1).map(r => [r[3], r[4], r[9], r[18]]);
    const fl = sheet(B, 'exportFlow', 'Funds Flow'), at = l => fl.filter(r => r[0] === l).map(r => r[1]).find(x => typeof x === 'number');
    const db = sheet(B, 'exportExcel', 'Decision Bands').find(r => r[1] === 'Band X');
    // v2.04: the five-year workbook's Summary, By PMO -- the office, its year-on-screen Requirement and Allocated (the lane draw), $M
    const sm = sheet(B, 'exportFydpPlan', 'Summary'), ph = sm.findIndex(r => r[0] === 'PMO' && !r[1]);
    const pm = (ph < 0 ? [] : sm.slice(ph + 2)).filter(r => r[0] === 'ZED' || r[0] === 'AV' || r[0] === 'PSM').map(r => [r[0], Math.round(r[2] * 1e6), Math.round(r[3] * 1e6)]);
    return { src, flow: [at('US service appropriations'), at('International Partners'), at('Foreign Military Sales'), at('TOTAL FUNDING')],
      band: db ? db.slice(0, 7) : null, pmo: pm, tabs: B.exportExcel.map(s => s.name).filter(n => /^PMO /.test(n) && n !== 'PMO Matrix'),
      dest: E(`flowEntName('dz1')`), sheets: Object.keys(B).map(f => f + ':' + B[f].length).join(' ') }; };
  // the figures as locked, worked out from the fixture: A draws discretionary 100 / 50 / 20; B draws USAF 50 + 30 mandatory, ANG
  // 10 + 20, STOVL 10; the funds flow's US money is the 290 they draw
  const LOCKED = {
    src: [['A event', 'USAF O&M- CAM Discretionary ZED', 100, 'ZED'], ['A event', '', 50, 'ZED'], ['A event', '', 20, 'ZED'],
          ['B event', 'USAF O&M- CAM Discretionary AV', 50, 'AV'], ['B event', 'USAF O&M - CAM OBBBA Mandatory AV', 30, 'AV'],
          ['B event', '', 10, 'AV'], ['B event', '', 20, 'AV'], ['B event', '', 10, 'AV']],
    flow: [290, 3000000, 0, 3000290], band: ['8', 'Band X', 'fund in full', '', '', 1, 170],
    pmo: [['AV', 130, 120], ['ZED', 170, 170]], tabs: ['PMO AV', 'PMO ZED'], dest: 'Depot One' };
  // THE WORKING PLAN takes every change (CONTROLS)
  const w = read(ev);
  chk(name, 'the working plan', 'CONTROL — A is AV’s, retitled; the retired name and ZED’s are gone; FMS $2,000,000 for ALL YEARS',
    J([w.src.slice(0, 2), w.flow, w.band, w.pmo, w.dest]),
    J([[['A event retitled', '', 100, 'AV'], ['A event retitled', '', 50, 'AV']], [290, 0, 2000000, 2000290], null,
       [['AV', 300, 290]], 'Depot Renamed']));
  const snap = `JSON.stringify([MS, S, DESTDB, BUDDB, BASE_ITEMS, BASE_ASK, CLINS, GROUPS, DATA.items, DATA.budget, SVC, DIRTY,
    localStorage.getItem(DEST_KEY), localStorage.getItem('prio27buddb'), localStorage.getItem(_AP.key)])`;
  const before = ev(snap);
  // THE VIEW: every list as locked
  ev(`cycView(${J(key)}); 'ok'`);
  const said = ev(`(document.getElementById('shareStat')||{}).textContent||''`);
  const v = read(ev);
  chk(name, 'the view · Spend Plan Source', 'every line’s title, BAE budget and PMO as locked: A in ZED on ZED’s name, B’s USAF discretionary on the name retired since',
    J(v.src), J(LOCKED.src));
  chk(name, 'the view · Funds Flow', 'partner and FMS money and the year selection as locked: International Partners $3,000,000, no FMS, TOTAL FUNDING $3,000,290',
    J(v.flow), J(LOCKED.flow));
  chk(name, 'the view · Decision Bands', 'band X, removed since, is still A’s band, by its locked name and rule', J(v.band), J(LOCKED.band));
  chk(name, 'the view · five-year plan By PMO', 'A’s money is ZED’s, the office deleted since', J(v.pmo), J(LOCKED.pmo));
  chk(name, 'the view · workbook', 'the PMO tabs are AV’s and ZED’s', J(v.tabs), J(LOCKED.tabs));
  chk(name, 'the view · destination list', 'A’s destination reads by its locked name', v.dest, LOCKED.dest);
  chk(name, 'the view', 'CONTROL — it says nothing about today’s lists: this cycle kept its own',
    J([/^👁 Viewing O&M PB27 \(locked\)/.test(said), /read as (it is|they are) today/.test(said)]), J([true, false]));
  // A REFUSED WRITE puts the kept lists back, the board-wide ones included, and writes nothing to browser storage
  ev(`DESTDB.ents.filter(function(e){ return e.k==='dz1'; })[0].n='Typed In The View'; BUDDB.rows=[]; flowCfg().other[MS.cur]={ip:9}; save(); 'ok'`);
  chk(name, 'the view · a refused save', 'the destination, the BAE list and the partner money are as locked again',
    J([ev(`flowEntName('dz1')`), ev(`budResolve('B','USAF','disc').effective`), ev(`flowCalc().ip`)]), J(['Depot One', 'USAF O&M- CAM Discretionary AV', 3000000]));
  const ls0 = ev(`JSON.stringify([localStorage.getItem(DEST_KEY), localStorage.getItem('prio27buddb')])`);
  chk(name, 'the view · storage', 'the destination and BAE lists on the page are the cycle’s, and neither can be written to browser storage',
    J([ev(`persistDest()`), ev(`persistBud()`), ev(`JSON.stringify([localStorage.getItem(DEST_KEY), localStorage.getItem('prio27buddb')])`) === ls0]), J([false, false, true]));
  // LEAVING: the working plan, the board-wide lists and browser storage byte for byte as they were
  ev(`cycLeave(); 'ok'`);
  chk(name, 'leaving the view', 'the working plan, every board-wide list and browser storage are byte for byte as they were', ev(snap) === before, true);
  chk(name, 'leaving the view', 'CONTROL — and its exports are today’s again', J(read(ev).src.slice(0, 2)), J(w.src.slice(0, 2)));
  // A PMO COPY carries the reference cycle's projection only, not the lists (it cannot be viewed)
  chk(name, 'a PMO copy', 'the reference cycle it carries holds no kept lists', ev(`MS.cycleRef=${J(key)}; JSON.stringify(cycRefOnlyDb()).indexOf('"keep"')<0`), true);
  // SAVED AND REOPENED: the kept lists travel in the file, and the door takes the board's own file
  const html = ev('buildSavedHtml()');
  chk(name, 'the saved file', 'the board’s own file passes the import door', ev(`inboundCheck(${J(html)})`), '');
  const R = boot({ html });
  R.ev(`window.confirm=function(){ return true; }; window.alert=function(){}; 'ok'`);
  chk(name, 'saved and reopened', 'CONTROL — the reopened working plan reads the new data pack', R.ev(`dispTitle(itemById('A'))`), 'A event retitled');
  R.ev(`cycView(${J(key)}); 'ok'`);
  const r = read(R.ev);
  chk(name, 'saved and reopened, the view', 'every list still as locked',
    J([r.src, r.flow, r.band, r.pmo, r.tabs, r.dest]), J([LOCKED.src, LOCKED.flow, LOCKED.band, LOCKED.pmo, LOCKED.tabs, LOCKED.dest]));
  R.ev(`cycLeave(); 'ok'`);
  // A CYCLE LOCKED BEFORE v2.02 kept none of them: viewed with today's lists, and said so
  R.ev(`delete blGet(${J(key)}).keep; delete blGet(${J(key)}).keepV; cycView(${J(key)}); 'ok'`);
  const oSaid = R.ev(`(document.getElementById('shareStat')||{}).textContent||''`);
  const o = read(R.ev);
  chk(name, 'a cycle locked before v2.02', 'its view says which lists are read as they are today',
    oSaid.endsWith('⚠ Its destinations, decision bands, BAE budget list, PMO list, requirement data and funds-flow settings are read as they are today: it was locked before v2.02, which did not keep them with a cycle.'), true);
  chk(name, 'a cycle locked before v2.02', 'CONTROL — and it reads today’s: the new title, ZED gone (A falls back to its home office, PSM), FMS for ALL YEARS',
    J([o.src[0], o.flow, o.dest]), J([['A event retitled', '', 100, 'PSM'], [290, 0, 2000000, 2000290], 'Depot Renamed']));
  R.ev(`cycLeave(); blOpen=true; blBody(); 'ok'`);
  chk(name, 'a cycle locked before v2.02', 'its line under PPBE cycles says (other lists: today’s)',
    /\(other lists: today’s\)/.test(R.ev(`document.getElementById('blBody').textContent`)), true);
  // A CYCLE STORE RE-POINTED (destMigrate, when the store's destination list is not the board's): the kept copy of the list is
  // re-keyed with its years, so the key its years now name is still the destination it kept, by the name it was locked with
  ev(`destRemap(destCycStates(), {dz1:'dz9'}); destRemapKeeps({dz1:'dz9'}); cycView(${J(key)}); 'ok'`);
  chk(name, 'a cycle store re-pointed', 'A’s destination key moved to dz9 in its years and in the list it kept, and reads Depot One',
    J([ev(`destOf(itemById('A')).to`), ev(`flowEntName('dz9')`)]), J(['dz9', 'Depot One']));
  ev(`cycLeave(); 'ok'`);
  chk(name, 'errors (control)', 'no script error on either board', J(errors.concat(R.errors)), '[]');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ═══ v2.02 (D5c, D6a, D7b, D7c) — Brad's small fixes of 21 Oct ═══════════════════════════════════════════════════
{
  const name = 'v2.02 (D5c, D6a, D7b, D7c) — whole dollars from a position, newer files refused, partner years offered, a year outside the window said';
  try {
  const sc = { services: ['USAF', 'ANG', 'STOVL'], items: [it('A', 'PSM', [100, 50, 20])], disc: [150, 60, 30], mand: [40, 20, 10], order: ['A'] };
  const { ev } = boot();
  seed(ev, sc);
  ev(`window.confirm=function(){ return true; }; window.alert=function(){}; 'ok'`);
  // D5c: a position a file carries with fractions is taken in whole dollars
  // v2.12 RV6: the position is split, as its d and m say it is: a one-figure position is now the service's total, divided by the
  // board's own base (ppLanesOf, Brad's R37 rule, read by Take too), and this check is about the fraction rounded at the door
  ev(`MS.ppbe=MS.ppbe||{}; MS.ppbe['POM|2099']={v:2, split:true, lines:{}, val:{USAF:{L1:{}}}}; MS.ppbe['POM|2099'].val.USAF.L1[MS.cur]={d:1000.6, m:250.4}; bmSeedFromPp('POM|2099'); 'ok'`);
  chk(name, 'D5c', 'the base budget authority taken from the position is whole dollars', ev(`JSON.stringify([S.bm.disc[0], S.bm.mand[0]])`), JSON.stringify([1001, 250]));
  // D6a: a file written by a newer ORBIT is refused at the door; the same build and an older one are not
  const B = ev('BUILD'), html = ev('buildSavedHtml()');
  const asBuild = v => html.replace(/const BUILD='v[^']*'/, "const BUILD='" + v + "'");
  const door = t => ev(`inboundCheck(${JSON.stringify(t)})`);
  chk(name, 'D6a', 'a board file written by v9.00 is refused, naming both versions', door(asBuild('v9.00 (1 Jan 2099)')),
    'it was written by a newer version of ORBIT (v9.00; this board is ' + B + '), which may carry what this version cannot read or would lose on its next save. Open the board from the shortcut to pick up the new program, and import it there');
  chk(name, 'D6a', 'CONTROL — the same build and an older one pass', JSON.stringify([door(html), door(asBuild('v1.50 (1 Jan 2026)'))]), JSON.stringify(['', '']));
  chk(name, 'D6a', 'a shared-folder copy carrying build v9.00 is refused; one with no build passes', JSON.stringify([
    /^it was written by a newer version of ORBIT \(v9\.00;/.test(door(JSON.stringify({ v: 1, build: 'v9.00 (1 Jan 2099)', ap: 'om' }))),
    door(JSON.stringify({ v: 1, ap: 'om' }))]), JSON.stringify([true, '']));
  // D7b: partner money typed for a year the board offers nothing else for is offered, and ALL YEARS counts it
  const y0 = +ev('MS.cur') - 9;
  ev(`flowCfg().other[${y0}]={ip:3000000}; flowCfg().fys=null; 'ok'`);
  chk(name, 'D7b', 'the year is offered', ev(`flowYears().indexOf(${y0})>=0`), true);
  chk(name, 'D7b', 'and ALL YEARS counts its $3,000,000', ev('flowCalc().ip'), 3000000);
  // D7c: a year made outside the FYDP window is said
  const b = +ev('+MS.base||+MS.cur'), far = b + 7;
  ev(`window.confirm=function(){ return false; }; switchYear(${far}); 'ok'`);
  chk(name, 'D7c', 'the line says the new year is outside the window', ev(`(document.getElementById('shareStat')||{}).textContent||''`).endsWith(
    ' ⚠ FY' + (far % 100) + ' is outside the FYDP window (FY' + (b % 100) + '–FY' + ((b + 4) % 100) + '): it is in no five-year report or locked cycle, and the funds flow’s ALL YEARS counts its plan.'), true);
  ev(`switchYear(${b + 1}); 'ok'`);
  chk(name, 'D7c', 'CONTROL — a year inside the window says nothing of it', /outside the FYDP window/.test(ev(`(document.getElementById('shareStat')||{}).textContent||''`)), false);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ═══ v2.02 (D3) — EVERY OFFICE'S PART OF A MONTH IS WITHIN $1 OF ITS EXACT SHARE ═══════════════════════════════════
// Brad, 21 Oct 2026. pmoSplit spread one part after another and let a cell drift up to $2.56 from part × weight / total
// weight, while the record said "about a dollar". Held here: every cell is a whole dollar within $1 of its exact share,
// every part's row and every office's column exact. The exact share is worked out in the test from the inputs alone.
{
  const name = 'v2.02 (D3) — every office’s part of a month is within $1 of its exact share';
  try {
  const { ev } = boot();
  const run = (w, parts, cols) => JSON.parse(ev(`JSON.stringify(pmoSplit(${JSON.stringify(w)}, ${JSON.stringify(parts)}, ${JSON.stringify(cols)}))`));
  // the worst cell, in exact fractions of a dollar: |X·W − part·w| / W
  const judge = (w, parts, cols, X) => {
    const W = w.reduce((a, b) => a + b, 0); let worst = 0, rows = true, colsOk = true;
    parts.forEach((p, j) => { if (X[j].reduce((a, b) => a + b, 0) !== p) rows = false; X[j].forEach((x, k) => { if (!Number.isInteger(x)) rows = false; worst = Math.max(worst, Math.abs(x * W - p * w[k]) / W); }); });
    cols.forEach((c, k) => { if (X.reduce((a, r) => a + r[k], 0) !== c) colsOk = false; });
    return { worst, rows, colsOk };
  };
  // Brad's counterexample: shares 2:2:2:3:3, months $4 and $6, each office taking $2. No floor-or-ceiling rounding fits.
  { const X = run([2, 2, 2, 3, 3], [4, 6], [2, 2, 2, 2, 2]), J = judge([2, 2, 2, 3, 3], [4, 6], [2, 2, 2, 2, 2], X);
    chk(name, 'counterexample', 'every row and column exact, the worst cell exactly $1', JSON.stringify([J.rows, J.colsOk, J.worst]), JSON.stringify([true, true, 1])); }
  // The measured worst case: weights 4:9:5 and a $3,928,224 part, placed as the forecast does (the office totals by apportion)
  { const w = [4, 9, 5], parts = [1309408, 1309408, 1309408], tot = 3928224;
    const cols = JSON.parse(ev(`JSON.stringify(apportion(${tot}, [4,9,5]))`));
    const J = judge(w, parts, cols, run(w, parts, cols));
    chk(name, 'measured case', 'within $1, margins exact', JSON.stringify([J.rows, J.colsOk, J.worst <= 1]), JSON.stringify([true, true, true])); }
  // A seeded sweep: 2-5 offices, 1-6 parts, small and large dollars; the office totals are apportion of the whole, as pmoPartsOf gives them
  { let seed = 20261021; const rnd = n => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
    let bad = 0, worst = 0, first = '';
    for (let c = 0; c < 3000; c++) {
      const K = 2 + rnd(4), Jn = 1 + rnd(6), big = rnd(3) === 0;
      const w = Array.from({ length: K }, () => 1 + rnd(big ? 9000 : 9));
      const parts = Array.from({ length: Jn }, () => rnd(big ? 5000000 : 40));
      const tot = parts.reduce((a, b) => a + b, 0);
      const cols = JSON.parse(ev(`JSON.stringify(apportion(${tot}, ${JSON.stringify(w)}))`));
      const J = judge(w, parts, cols, run(w, parts, cols));
      worst = Math.max(worst, J.worst);
      if (!J.rows || !J.colsOk || J.worst > 1 + 1e-12) { bad++; if (!first) first = JSON.stringify({ w, parts, cols, worst: J.worst }); }
    }
    chk(name, 'sweep', '3,000 seeded cases: margins exact and every cell within $1 (first failure shown)', first || 'none', 'none');
    chk(name, 'sweep', 'and the worst cell over all of them is at most $1', worst <= 1 + 1e-12, true); }
  // the rounding itself answers the counterexample (the wide pass), rather than handing it back to the old spread
  { const X = JSON.parse(ev(`JSON.stringify(typeof pmoRound==='function'? pmoRound([2,2,2,3,3], [4,6], [2,2,2,2,2]) : null)`));
    chk(name, 'counterexample', 'the matrix rounding answers it itself, within $1', JSON.stringify(X ? [judge([2, 2, 2, 3, 3], [4, 6], [2, 2, 2, 2, 2], X).worst] : null), JSON.stringify([1])); }
  // a share that is a whole dollar is not moved when the tight rounding fits: two offices, $2 and $2, each taking $2
  chk(name, 'CONTROL', 'whole-dollar shares stay put: $2 and $2 over 1:1 is $1 and $1 in each', JSON.stringify(run([1, 1], [2, 2], [2, 2])), JSON.stringify([[1, 1], [1, 1]]));
  // CONTROL: the requirement's own examples from E7 (U9) are unchanged: $3 over 1:2:3 is $1/$1/$1, $9 is $2/$3/$4
  chk(name, 'CONTROL', 'U9’s ties: $3 over 1:2:3 and $9 over 1:2:3', JSON.stringify([run([1, 2, 3], [3], [1, 1, 1]), run([1, 2, 3], [9], [2, 3, 4])]), JSON.stringify([[[1, 1, 1]], [[2, 3, 4]]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ═══ PPBE CYCLES — THE DELTAS AGAINST THE REFERENCE ═══════════════════════════════════════
// After a lock the working plan moves on. Every change is read against the lock's projection of
// the same year: value, allocation, funded (the lane draw), rank, band, PMO, the star, a
// requirement added, one removed. The totals must be accounted for by the rows -- changed rows
// plus new ones, less the removed -- and every figure must be the board's own authorities
// (tiers() and svcAlloc()) less the projection's. The lock is taken with TWO years held, and the
// base sits on the second, so a delta read against the wrong year cannot pass by coincidence.
{
  const name = 'PPBE cycles — the deltas against the reference';
  try {
  const sc = { services: ['USAF', 'ANG', 'STOVL'],
    items: [it('A', 'PSM', [100, 50, 20]), it('B', 'AV', [80, 40, 10]), it('C', 'PSM', [60, 30, 15]), it('D', 'MxS', [40, 20, 0]),
            it('E', 'PSM', [30, 10, 5]), it('F', 'AV', [20, 10, 5]), it('G', 'MxS', [12, 6, 3])],
    // USAF and ANG are deep, so a requirement nobody touched keeps its draw whatever the others do;
    // STOVL is nearly dry, so at least one requirement is funded below its allocation and a delta
    // that reads the allocation as the draw cannot pass by coincidence.
    disc: [1000, 500, 10], mand: [80, 40, 0], order: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] };
  const { ev, errors } = boot();
  seed(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); 'ok'`);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  const cur = +ev('MS.cur'), key = 'PB|' + cur;
  ev(`MS.years[MS.cur]=S; MS.base=MS.cur+1;
      var y1=JSON.parse(JSON.stringify(S)); y1.asks={A:[200,100,40]}; delete y1.pmoOrder; MS.years[MS.cur+1]=y1;
      blCyc='PB'; blYr=MS.cur; cycLock(); 'ok'`);
  chk(name, 'lock', 'the lock became the reference and the working tag', ev('MS.cycleRef') + ':' + ev('MS.cycle'), key + ':' + key);
  chk(name, 'lock', 'and the status offers the retag to the next cycle', /Retag it as BES/.test(ev(`document.getElementById('shareStat').innerHTML`)), true);
  chk(name, 'before', 'nothing has changed yet', ev(`(function(){ var D=cycDelta(MS.cur); return D.nChanged+':'+D.nNew+':'+D.nRemoved; })()`), '0:0:0');
  const fundWasA = +ev(`cycProj('${key}', MS.cur).reqs.filter(function(r){ return r.id==='A'; })[0].fund.reduce(function(a,b){ return a+b; },0)`);
  // the working plan moves on: a value, a trim, a star, a rank, a band, a PMO, one added, one removed
  ev(`setAsk('B',0,'123');
      S.alloc['A']={m:'t', v:100};
      S.mc['C']=true; S.grp['C']='AV';
      S.order.splice(S.order.indexOf('D'),1); S.order.unshift('D');
      S.band['B']='pdm'; S.mc['F']=true;         // F's ONLY change is the star, so the star alone must count
      S.custom.push({id:'NEW-1', grp:'PSM', sect:'new', custom:true, title:'Added here', event:'Added here', ccar:'', fy26:[0,0,0], ask:[10,5,2], alloc:null});
      S.order.push('NEW-1');
      S.removed.push('G'); S.order=S.order.filter(function(id){ return id!=='G'; });
      applyState(S); save(); render(); 'ok'`);
  const D = JSON.parse(ev(`JSON.stringify(cycDelta(MS.cur))`));
  chk(name, 'read', 'the deltas read against the reference, for the year on screen', D && D.ref + ':' + D.fy, key + ':' + cur);
  chk(name, 'value', 'B’s requirement moved by what was typed', D.rows.B.ask + ':' + D.rows.B.askWas + ':' + D.rows.B.askNow, '43:130:173');
  chk(name, 'value', 'A’s value did not move, and the delta is read against THIS year, not the base year', D.rows.A.ask, 0);
  chk(name, 'alloc', 'A’s allocation moved by the trim', D.rows.A.alloc, 100 - 170);
  const fundNowA = +ev(`(function(){ var p=tiers()['A']; return p.d.reduce(function(a,b){ return a+b; },0)+p.m.reduce(function(a,b){ return a+b; },0); })()`);
  chk(name, 'funded', 'A’s funded delta is the lane draw now less the lane draw locked', D.rows.A.fund, fundNowA - fundWasA);
  chk(name, 'funded', 'and A is funded below its allocation on the dry lane, so funded and allocated are told apart', D.rows.A.fundNow < D.rows.A.allocNow, true);
  chk(name, 'rank', 'D moved up three places', D.rows.D.rank + ':' + D.rows.D.rankWas + ':' + D.rows.D.rankNow, '3:4:1');
  chk(name, 'rank', 'and A down one', D.rows.A.rank, -1);
  chk(name, 'rank', 'E and F kept their places', D.rows.E.rank + ':' + D.rows.F.rank, '0:0');
  chk(name, 'flags', 'C was starred and moved office', D.rows.C.mcWas + '>' + D.rows.C.mcNow + ' ' + D.rows.C.grpWas + '>' + D.rows.C.grp, 'false>true PSM>AV');
  chk(name, 'flags', 'B changed band', D.rows.B.bandWas + '>' + D.rows.B.bandNow, 'null>pdm');
  chk(name, 'flags', 'F, starred and nothing else, counts as changed', D.rows.F.changed + ':' + D.rows.F.mcWas + '>' + D.rows.F.mcNow + ':' + D.rows.F.rank + ':' + D.rows.F.fund, 'true:false>true:0:0');
  chk(name, 'new', 'the added requirement is NEW, with no locked figure', D.rows['NEW-1'].isNew + ':' + D.rows['NEW-1'].askWas + ':' + D.rows['NEW-1'].ask, 'true:0:17');
  chk(name, 'removed', 'the removed requirement is listed with its locked figures', D.removed.map(r => r.id + ':' + r.askWas).join(','), 'G:21');
  chk(name, 'unchanged', 'E is unchanged', D.rows.E.changed, false);
  chk(name, 'counts', 'changed, new and removed are counted', D.nChanged + ':' + D.nNew + ':' + D.nRemoved, '6:1:1');
  // conservation: the rows account for the totals
  const rows = Object.values(D.rows), S_ = a => a.reduce((x, y) => x + y, 0);
  chk(name, 'totals', 'the requirement total moved by the rows, less the removed', Math.round((S_(rows.map(r => r.ask)) - S_(D.removed.map(r => r.askWas))) * 100) / 100, Math.round(D.tot.ask * 100) / 100);
  chk(name, 'totals', 'so did the allocation', Math.round((S_(rows.map(r => r.alloc)) - S_(D.removed.map(r => r.allocWas))) * 100) / 100, Math.round(D.tot.alloc * 100) / 100);
  chk(name, 'totals', 'and the funded', Math.round((S_(rows.map(r => r.fund)) - S_(D.removed.map(r => r.fundWas))) * 100) / 100, Math.round(D.tot.fund * 100) / 100);
  chk(name, 'totals', 'now is the board: the requirement total', D.tot.askNow, +ev(`S.order.reduce(function(a,id){ return a+askTot(itemById(id)); },0)`));
  chk(name, 'totals', 'and the funded total is the lane draw', D.tot.fundNow, +ev(`(function(){ var T=tiers(), s=0; S.order.forEach(function(id){ var p=T[id]; s+=p.d.reduce(function(a,b){return a+b;},0)+p.m.reduce(function(a,b){return a+b;},0); }); return s; })()`));
  chk(name, 'totals', 'the pots are read live', D.pots.discNow + ':' + D.pots.mandNow, '1510:120');
  // the row chip
  const rowHtml = id => ev(`(document.getElementById('row-${id}')||{}).innerHTML||''`);
  chk(name, 'chip', 'B carries the chip with its delta', /Δ PB\d\d/.test(rowHtml('B')) && /\+\$43/.test(rowHtml('B')), true);
  chk(name, 'chip', 'D’s chip says it moved up three', /▲3/.test(rowHtml('D')), true);
  chk(name, 'chip', 'the added requirement’s chip says NEW', /NEW/.test(rowHtml('NEW-1')), true);
  chk(name, 'chip', 'C’s chip names the star and the office move', /starred/.test(rowHtml('C')) && /PSM→AV/.test(rowHtml('C')), true);
  chk(name, 'chip', 'E, unchanged, carries no chip', /Δ PB/.test(rowHtml('E')), false);
  const chipF = (/<div class="dchip"[^>]*>([\s\S]*?)<\/div>/.exec(rowHtml('F')) || [])[1] || '';
  chk(name, 'chip', 'F’s chip names the star, and nothing else', /★ starred/.test(chipF) && !/req |alloc |funded |rank /.test(chipF), true);
  // the panel
  ev(`cycChgOpen=true; render(); 'ok'`);
  const panel = ev(`document.getElementById('cycChgBody').innerHTML`);
  chk(name, 'panel', 'the panel lists the added and the removed', /Added here/.test(panel) && /REMOVED/.test(panel) && /G event/.test(panel), true);
  chk(name, 'panel', 'and closes: the rows account for the totals', /✓ the rows account for the totals/.test(panel), true);
  chk(name, 'panel', 'B’s change is attributed from the journal', /unknown/.test(ev(`cycWho('B', cycDelta(MS.cur).ts, MS.cur)`)), true);
  chk(name, 'panel', 'a pure rank change says the order is not journaled', /order edits are not journaled/.test(panel), true);
  ev(`cycChgOpen=false; 'ok'`);
  // the inspector, on the build that has one
  if (ev(`typeof inspectorBody==='function' && typeof setCur==='function'`)) {
    ev(`setCur('B'); inspectorBody(); 'ok'`);
    const insp = ev(`(document.getElementById('inspector')||{}).innerHTML||''`);
    chk(name, 'inspector', 'the record panel shows the change since the reference', /Since PB\d\d/.test(insp) && /\+\$43/.test(insp), true);
  }
  // the retag
  ev(`cycRetagNext(); 'ok'`);
  chk(name, 'retag', 'the working plan is tagged as the next cycle, BES of the following year', ev('MS.cycle'), 'BES|' + (cur + 1));
  chk(name, 'retag', 'and the reference is unchanged', ev('MS.cycleRef'), key);
  chk(name, 'retag', 'POM is followed by BES the same year, BES by PB', ev(`JSON.stringify([cycNextOf('POM|2027'), cycNextOf('BES|2027')])`), JSON.stringify([{ cyc: 'BES', yr: 2027 }, { cyc: 'PB', yr: 2027 }]));
  // no reference, and a reference that lacks the year
  ev(`MS.cycleRef=''; render(); 'ok'`);
  chk(name, 'none', 'without a reference there is no delta and no chip', ev('cycDelta(MS.cur)') === null && !/Δ PB/.test(rowHtml('B')), true);
  ev(`cycChgOpen=true; render(); 'ok'`);
  chk(name, 'none', 'and the panel says so', /No reference cycle/.test(ev(`document.getElementById('cycChgBody').innerHTML`)), true);
  ev(`cycChgOpen=false; MS.cycleRef='${key}'; switchYear(MS.cur+3); cycChgOpen=true; render(); 'ok'`);
  chk(name, 'year', 'on a year the reference never held there is no delta, and the panel says which years it holds', ev('cycDelta(MS.cur)') === null && /holds no FY/.test(ev(`document.getElementById('cycChgBody').innerHTML`)), true);
  ev(`cycChgOpen=false; switchYear(MS.cur-3); 'ok'`);
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH. On a mutated board a cycle can be
    // missing where the block expects one, and reading it threw; the sweep then saw a suite that
    // died, which proves nothing (CRASHED), where it should see a suite that noticed (a failure).
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}


// ═══ PPBE CYCLES — A PMO COPY CARRIES THE REFERENCE PROJECTION, AND NOTHING ELSE OF THE STORE ═══
// Two cycles are locked and the working plan moves on. The copy published for the offices must
// carry ONE cycle, the reference, as a projection only: no year states, no other lock, nothing that
// can be put on the drill -- and still read it: the rows' deltas, the compare and the five-year
// plan on the copy must say what the board says. And the copy must be smaller than a full save.
{
  const name = 'PPBE cycles — a PMO copy carries the reference projection only';
  try {
  const sc = { services: ['USAF', 'ANG', 'STOVL'],
    items: [it('A', 'PSM', [100, 50, 20]), it('B', 'AV', [80, 40, 10]), it('C', 'PSM', [60, 30, 15])],
    disc: [200, 100, 40], mand: [80, 40, 20], order: ['A', 'B', 'C'] };
  const { ev, errors } = boot();
  seed(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); 'ok'`);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  const cur = +ev('MS.cur'), keyA = 'PB|' + cur, keyB = 'BES|' + (cur + 1);
  ev(`MS.years[MS.cur]=S; MS.base=MS.cur+1;
      var y1=JSON.parse(JSON.stringify(S)); delete y1.pmoOrder; MS.years[MS.cur+1]=y1;
      blCyc='PB'; blYr=MS.cur; cycLock(); cycSetWorking('BES', MS.cur+1); blCyc='BES'; blYr=MS.cur+1; cycLock();
      MS.cycleRef='${keyA}'; save(); setAsk('B',0,'123'); 'ok'`);
  // v2.15 W1 (item 139): the plan is retagged BES before it is locked as BES, as Lock now asks
  const dB = +ev(`(function(){ _cycDeltaCache=null; return cycDelta(MS.cur).rows.B.ask; })()`);
  chk(name, 'board', 'the board holds two locks and reads its deltas against PB', ev(`blList().join(',')`) + ' ' + dB, [keyA, keyB].sort().join(',') + ' 43');
  const full = +ev(`buildSavedHtml().length`);
  const html = ev(`pmoCopyHtml({sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, ap:APPN, base:pmoBaseline()})`);
  chk(name, 'size', 'the copy is smaller than a full save: no year states, one cycle', html.length < full, true);
  const pub = JSON.parse((/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/.exec(html) || [])[1] || '{}');
  const slug = ev('_AP.slug');
  chk(name, 'store', 'the copy packs one appropriation’s cycle store', Object.keys((pub.cycDb || {}).byAp || {}).join(','), slug);
  const st = ((pub.cycDb || {}).byAp || {})[slug] || { cycles: {} };
  chk(name, 'store', 'holding the reference cycle only', Object.keys(st.cycles || {}).join(','), keyA);
  const c = (st.cycles || {})[keyA] || {};
  chk(name, 'store', 'as a projection: no year states, marked partial and reference-only', JSON.stringify(Object.keys(c.years || { missing: 1 })) + ' ' + c.partial + ' ' + c.refOnly, '[] true true');
  chk(name, 'store', 'with the projection of both years it held', Object.keys(c.proj || {}).sort().join(','), cur + ',' + (cur + 1));
  const C = boot({ html });
  chk(name, 'copy', 'the copy knows it is one', String(C.ev('SANDBOX')), 'true');
  chk(name, 'copy', 'and holds the reference only', C.ev(`blList().join(',')`), keyA);
  chk(name, 'copy', 'the rows read their deltas against it, as the board does', C.ev(`(function(){ var d=cycDelta(MS.cur); return d? String(d.rows.B.ask) : 'none'; })()`), String(dB));
  chk(name, 'copy', 'the five-year plan reads it for both years', C.ev(`(function(){ var d=fydpData('${keyA}'); return d? d.held.join(',') : 'none'; })()`), cur + ',' + (cur + 1));
  chk(name, 'copy', 'and offers it as a source', new RegExp('<option value="' + keyA.replace('|', '\\|') + '"').test(C.ev(`fydpOpen=true; render(); fydpOpen=false; document.getElementById('fydpBody').innerHTML`)), true);
  chk(name, 'copy', 'the compare reads it', C.ev(`(function(){ var d=cycCmpData('${keyA}','working'); return d&&d.fy[MS.cur]&&d.fy[MS.cur].rows.B? String(d.fy[MS.cur].rows.B.d.ask) : 'none'; })()`), String(dB));
  chk(name, 'copy', 'but it cannot be put on the drill: there is no state to show', C.ev(`(function(){ var s=''; try{ cycView('${keyA}'); }catch(e){ s='threw '+e.message; } return (CYCVIEW||'')+'|'+s; })()`), '|');
  chk(name, 'copy', 'and the copy says why', /holds no plan to show/.test(C.ev(`document.getElementById('shareStat').innerHTML`)), true);
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH. On a mutated board a cycle can be
    // missing where the block expects one, and reading it threw; the sweep then saw a suite that
    // died, which proves nothing (CRASHED), where it should see a suite that noticed (a failure).
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// THE ADD BOX, DRIVEN THE WAY A PERSON DRIVES IT (v2.07, item 121). The strip that took a title and an optional total is
// gone: Add requirement is one box that builds the whole record, and Add is refused until every required field is answered.
// So every check of the add path types into the rendered box -- each field with the event a person's typing fires, each
// button clicked -- and reads what the box says (#arMsg, #arReadyN, #arChk), never the function behind a control: calling
// the function is exactly what missed subPick() (v1.84). __arFill answers every required field for an office that has no
// BAE list loaded, where the budget is waived ("no BAE list is loaded"); a test that is about one field overrides it.
// Evaluated once on a board: AR_DRIVE.
const AR_DRIVE = `(function(){
  globalThis.__arPut=function(id, v){ var e=document.getElementById(id); if(!e) throw new Error('the Add box has no #'+id);
    e.value=String(v); e.dispatchEvent(new Event(e.tagName==='SELECT'? 'change' : 'input', {bubbles:true})); };
  globalThis.__arBtn=function(re){ var b=[].filter.call(document.querySelectorAll('#addPanel button'), function(x){ return re.test(x.textContent.trim()); })[0];
    if(!b) throw new Error('the Add box has no button '+re); b.click(); };
  // open it (fresh), and answer "Which office are you adding for?" when it asks
  globalThis.__arOpen=function(g){ if(arOn()) toggleAdd(); toggleAdd(); if(typeof dlgSync==='function') dlgSync();
    if(!arOn()) throw new Error('the Add box did not open');
    if(g && !document.getElementById('arOffStep').hidden) __arPut('arOffice', g); };
  // o: {event, ptype:'PRIME'|'OGC', vals:[..], spread, gov, wbs, ccar, pid, desc, cons}
  globalThis.__arFill=function(o){ o=o||{};
    __arPut('arEvent', o.event!==undefined? o.event : 'Added in the box');
    document.getElementById(o.ptype==='OGC'? 'arPtO' : 'arPtP').click();
    (o.vals||[]).forEach(function(v,i){ __arPut('arV'+i, v); });
    if(o.spread!==undefined){ __arPut('arSpread', o.spread); __arBtn(/^Spread evenly$/); }
    __arPut('arOb', OB_CATS[0]);
    var e=flowEntsAZ().filter(function(x){ return destKeyIsOgc(x.k)===!!o.gov; })[0];
    __arPut('arTo', e.k);
    if(o.gov){ __arPut('arEnd', e.k); __arPut('arMipr', 'direct'); }
    if(o.ptype==='OGC') __arPut('arWbs', o.wbs!==undefined? o.wbs : '1.1');
    if(o.ccar!==undefined) __arPut('arCcar', o.ccar);
    if(o.pid!==undefined) __arPut('arPid', o.pid);
    __arPut('arDesc', o.desc!==undefined? o.desc : 'What it buys');
    __arPut('arCons', o.cons!==undefined? o.cons : 'What is lost if it is not funded');
    return document.getElementById('arReadyN').textContent; };
  return 'ok'; })()`;

// v1.89, ITEM 22: A REQUIREMENT ADDED BY ITS TOTAL IS WHOLE DOLLARS THAT ADD UP TO THAT TOTAL.
// addReq() divided the total by the number of services and kept the fraction. Before a reopen the
// workbook printed 999,999.9999999999 and an unfunded row of $1.000000000000007, with two sheets
// disagreeing about one requirement; the reopen then rounded each service by itself, so $1,000,000
// typed across six came back as $1,000,002. Driven through the form, the way a person adds one.
// The oracle is arithmetic, not apportion(): floor(total/n) each, one more for the first total%n.
// Compared as TEXT: chk() allows 0.005 on numbers, which 999,999.9999999999 passes.
// v2.07 (item 121): the total is typed into the Add box's "or a total…" and spread with its Spread evenly button, which
// puts the whole dollars into the service boxes to be read before Add; every other required field is answered. No BAE
// list is loaded, so the budget is waived on every service (CV can never carry a BAE name, and a list would add budget
// lines to the Spend Plan Source the export sweep below reads): the board is kept as it was, and what is held is the spread.
{
  const name = 'whole dollars — a requirement added by its total';
  try {
  const SV6 = ['USAF', 'ANG', 'AFRC', 'STOVL', 'CV', 'USN'];
  const want = (tot, n) => Array.from({ length: n }, (_, i) => Math.floor(tot / n) + (i < tot % n ? 1 : 0));
  const board = n => {
    const svcs = SV6.slice(0, n);
    const { ev } = boot();
    seed(ev, { services: svcs, items: [it('A', 'ATL', svcs.map(() => 9000)), it('B', 'PSM', svcs.map(() => 4000))],
      disc: svcs.map(() => 5000000), mand: svcs.map(() => 100000), order: ['A', 'B'], mc: { B: true } });
    ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
        applyState(S); save(); window.alert=function(m){ globalThis.__al=String(m); }; 'ok'`);
    ev(AR_DRIVE);
    return ev;
  };
  // the box opened, the office chosen, the total spread with the box's own button, every other required field answered,
  // and Add pressed; what the service boxes showed, the rail's count, and what the box said if it stayed open
  const addByTotal = (ev, title, tot) => JSON.parse(ev(`(function(){
      var n0=S.custom.length; __arOpen(GROUPS[0]);
      var ready=__arFill({event:${JSON.stringify(title)}, spread:${JSON.stringify(String(tot))}});
      var boxes=SVC.map(function(s,i){ return document.getElementById('arV'+i).value; });
      __arBtn(/^Add requirement/);
      var c=S.custom.length>n0? S.custom[S.custom.length-1] : null, m=document.getElementById('arMsg');
      var out={g:c? {id:c.id, ask:c.ask, item:(itemById(c.id)||{}).ask} : null, ready:ready, boxes:boxes, open:arOn(), msg:m? m.textContent : ''};
      if(arOn()) toggleAdd();
      return JSON.stringify(out); })()`));
  for (const [n, totals] of [[6, [1000000, 5, 100]], [3, [100, 1000000]], [1, [7]]]) {
    const ev = board(n);
    const added = totals.map(tot => [tot, addByTotal(ev, 'By total ' + tot, tot)]);
    const R = boot({ html: ev('buildSavedHtml()') });
    for (const [tot, a] of added) {
      const at = `${n} service(s), $${tot.toLocaleString()} typed`, g = a.g;
      chk(name, at, 'the box’s rail read every required field answered before Add, so nothing but the spread could stop it',
        /^(\d+) of \1$/.test(a.ready), true);
      chk(name, at, 'Spread evenly put whole dollars into the service boxes, the first services taking what is left over',
        JSON.stringify(a.boxes), JSON.stringify(want(tot, n).map(v => v ? v.toLocaleString('en-US') : '')));
      chk(name, at, 'the requirement was added', !!g, true);
      if (!g) continue;
      chk(name, at, 'every service a whole dollar', g.ask.every(Number.isInteger) && g.item.every(Number.isInteger), true);
      chk(name, at, 'the services add up to exactly the total typed', String(sum(g.ask)), String(tot));
      chk(name, at, 'the dollars left over go to the first services in the list', JSON.stringify(g.ask), JSON.stringify(want(tot, n)));
      chk(name, at, 'and a reopen reads back exactly those, not a rounding of them',
        R.ev(`JSON.stringify((S.custom.filter(function(c){ return c.id===${JSON.stringify(g.id)}; })[0]||{}).ask||null)`), JSON.stringify(want(tot, n)));
    }
    if (n !== 6) continue;
    // EVERY EXPORT, EVERY FIGURE. A cell formatted to show whole dollars that holds a fraction prints
    // one number and carries another -- 999,999.9999999999 reads as 1,000,000 until a sum is taken.
    // The only fractions a workbook may hold are in cells formatted to show them: the built-in
    // two-decimal styles (10, 11 -- the forecast's $M) or an export's own format with a point or a %.
    ev(`MS.years[MS.cur]=S; blCyc='PB'; blYr=MS.cur; cycLock(); cycCmpA='PB|'+MS.cur; cycCmpB='working'; 'ok'`);
    const EXPORTS = ['exportExcel', 'exportCSV', 'exportSrc', 'exportPlans', 'exportFlow', 'exportCoa', 'exportFydpPlan', 'exportCycCompare'];
    const sweep = JSON.parse(ev(`(function(){ var res={};
      ${JSON.stringify(EXPORTS)}.forEach(function(fn){
        var cap=null, ex=[], o=buildXlsx, r={sheets:0, cells:0, bad:[]};
        buildXlsx=function(sh, extra){ cap=sh; ex=extra||[]; return new Uint8Array(0); };
        try{ window[fn](); }catch(e){ r.bad.push('threw: '+e.message); }
        buildXlsx=o;
        (cap||[]).forEach(function(sh){ r.sheets++; (sh.rows||[]).forEach(function(row,ri){ (row||[]).forEach(function(c,ci){
          var v=(c&&typeof c==='object'&&'v' in c)? c.v : c, s=(c&&typeof c==='object'&&c.s)||0;
          if(typeof v!=='number') return; r.cells++;
          var x=s>=16? ex[s-16] : null;
          var decimals = s===10 || s===11 || !!(x && x.fmt && (x.fmt.indexOf('.')>=0 || x.fmt.indexOf('%')>=0));
          if(!decimals && !Number.isInteger(v)) r.bad.push(sh.name+' row '+(ri+1)+' col '+(ci+1)+' = '+v);
        }); }); });
        res[fn]=r; });
      return JSON.stringify(res); })()`));
    for (const fn of EXPORTS) {
      const r = sweep[fn] || { sheets: 0, cells: 0, bad: ['not run'] };
      chk(name, 'every export', `${fn} ran and wrote figures, so the sweep below looked at something`, r.sheets > 0 && r.cells > 0, true);
      chk(name, 'every export', `${fn}: every figure shown as whole dollars is one`, r.bad.slice(0, 3).join('; ') || 'none', 'none');
    }
    // THE REFUSAL. Nothing can produce a cent through the form today, so the guard is proved by
    // standing in for the spread with one that does: the requirement must not be added at all.
    // v2.07 (item 121): a spread that made cents could not reach Add either -- the box re-reads each service box through
    // parseAmt, which takes whole dollars at the door -- so it is the box's READING that is stood in for, with one that
    // carries a quarter on every service with a value.
    const n0 = ev('S.custom.length+"/"+DATA.items.length');
    ev(`globalThis.__arRx=arRead; arRead=function(){ var r=__arRx(); r.d.ask=r.d.ask.map(function(v){ return v>0? v+0.25 : v; }); return r; }; 'ok'`);
    const refused = addByTotal(ev, 'Would carry cents', 100);
    ev(`arRead=globalThis.__arRx; 'ok'`);
    chk(name, 'refusal', 'a value that is not whole dollars is never put on the board', refused.g === null && ev('S.custom.length+"/"+DATA.items.length') === n0, true);
    chk(name, 'refusal', 'and the person is told why, in the box, which stays open holding what was typed',
      JSON.stringify([/not in whole dollars/.test(refused.msg), refused.open]), JSON.stringify([true, true]));
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// v1.89, ITEM 24: AN ADDED REQUIREMENT NEVER INHERITS A DELETED ONE'S DATA.
// The next number was one past the highest REMAINING added requirement, so deleting NEW-3 and adding
// another made a new NEW-3; delete cleared nine containers and the new one inherited the rest -- band,
// award dates, destination, PID, impact statement, WBS, the UPL mark -- on screen, through save and
// reopen, and on four workbook sheets. Every container on the board's own REQ_MAPS is filled on the
// newest added requirement from SAMPLE below, and the two lists must match both ways: a container
// taken off REQ_MAPS, or added to it without a sample here, fails by name. (A container the board
// writes and REQ_MAPS lacks is caught by the round-trip fuzz, which fills every container there is.)
// 'ZZDEL' marks every value that must be gone from the plan and the exports once it is deleted. The
// change journal keeps the record of the deletion -- that is its job -- so the check reads the year's
// plan and the workbooks, never the journal.
{
  const name = 'an added requirement never inherits the data of a deleted one';
  try {
  const SVC = ['USAF', 'ANG', 'AFRC'];
  const SAMPLE = `{alloc:{m:'t', v:500}, mc:true, notes:'ZZDEL note', desc:'ZZDEL desc', titles:'ZZDEL title',
    ccar:'ZZDEL1', pid:'ZZDEL-PID', costElem:'ZZDEL-CE', fsrc:{m:'split', dv:[11,12,13], mv:[1,2,3]}, asks:[7,8,9],
    awards:{mode:'single', d:FYMON[2][0], day:9}, grp:GROUPS[1], si:'LA', dest:{to:flowEnts()[0].k, end:'ZZDEL end'},
    wbs:[{w:'9.9.9', v:[]}], clinWbs:{n1:[{w:'4.5.6', v:[]}]}, rcnAsg:'ZZDEL-RCN', rcnSvc:{USAF:'ZZDEL-RCNS'},
    clinRcn:{n1:'ZZDEL-RCNC'}, clinRcnSvc:{n1:{ANG:'ZZDEL-RCNCS'}}, aceMap:{w:['1.1.9'], ok:true}, upl:1, obCat:OB_CATS[1], budgetAsg:{USAF:'ZZDEL-BAE'},
    ptype:'PRIME', recNames:'ZZDEL record', clinAlloc:{n1:[5,6,7]}, clinMeta:{n1:{ask:[5,6,7], desc:'ZZDEL clin'}},
    clinNew:[{key:'n1', clin:'3099', desc:'ZZDEL new clin', ccar:'', ask:[1,1,1]}], clinRm:['0001'],
    crHalf:(function(){ var o={}; o[FYMON[2][0]]=1; return o; })(), band:'pdm', cons:'ZZDEL impact', minInc:250, mipr:'direct'}`;
  const mk = () => {
    const { ev } = boot();
    seed(ev, { services: SVC, items: [it('A', 'ATL', [900, 200, 100]), it('B', 'PSM', [400, 100, 50])],
      disc: [2000, 600, 300], mand: [500, 150, 80], order: ['A', 'B'] });
    ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
        applyState(S); save(); window.confirm=function(){ return true; }; window.alert=function(){};
        // v2.07 (item 121): the one writer every add ends in (reqCreate), given what the old strip wrote -- a title, the
        // event it defaulted to, the value by service -- and nothing else, so "nothing but the split" still means it
        globalThis.__add=function(t){ var n0=S.custom.length;
          reqCreate(GROUPS[0], {title:t, event:'(added at drill)', ask:SVC.map(function(s,i){ return 100*(i+1); })}); save(); render();
          return S.custom.length>n0? S.custom[S.custom.length-1].id : ''; };
        // every container, the UPL mark and the what-if levels that hold something under this id
        globalThis.__held=function(id, st){ st=st||S; var out=[];
          REQ_MAPS.forEach(function(k){ var bag=st[k]; if(bag && typeof bag==='object'
            && Object.prototype.hasOwnProperty.call(bag, k==='upl'? 'r|'+id : id)) out.push(k); });
          if(st.whatif) ['a','b'].forEach(function(p){ if((st.whatif[p]||{})[id]!==undefined) out.push('whatif.'+p); });
          return out; };
        globalThis.__fill=function(id){ var V=${SAMPLE};
          Object.keys(V).forEach(function(k){ if(!S[k] || typeof S[k]!=='object') S[k]={};
            if(k==='upl') S.upl['r|'+id]=1; else S[k][id]=JSON.parse(JSON.stringify(V[k])); });
          if(!S.whatif || typeof S.whatif!=='object') S.whatif={a:{}, b:{}};
          S.whatif.a=S.whatif.a||{}; S.whatif.b=S.whatif.b||{}; S.whatif.a[id]=40; S.whatif.b[id]=60;
          applyState(S); save(); return JSON.stringify(Object.keys(V).sort()); };
        'ok'`);
    return ev;
  };
  const ev = mk();
  const nm = [ev(`__add('First')`), ev(`__add('Second')`), ev(`__add('Doomed')`)];
  chk(name, 'setup', 'three requirements added, numbered from one', nm.join(','), 'NEW-1,NEW-2,NEW-3');
  const sample = JSON.parse(ev(`__fill('NEW-3')`));
  const list = JSON.parse(ev('JSON.stringify(REQ_MAPS.slice().sort())'));
  chk(name, 'the list', 'every container on REQ_MAPS has a value to fill here, and nothing here is off it',
    JSON.stringify({ offList: sample.filter(k => !list.includes(k)), noSample: list.filter(k => !sample.includes(k)) }),
    JSON.stringify({ offList: [], noSample: [] }));
  const held0 = JSON.parse(ev(`JSON.stringify(__held('NEW-3'))`));
  chk(name, 'setup', 'every container took its value, so a leftover in any of them would be seen',
    list.filter(k => !held0.includes(k)).join(',') || 'all', 'all');
  // DELETE, THEN ADD. The new number is not the old one, and nothing of the old one is anywhere.
  ev(`removeReq('NEW-3'); 'ok'`);
  chk(name, 'delete', 'deleting an added requirement removes everything held under its number',
    ev(`JSON.stringify(__held('NEW-3'))`), '[]');
  const n4 = ev(`__add('Fresh')`);
  chk(name, 'add', 'the next one added never reuses the deleted number', n4, 'NEW-4');
  chk(name, 'add', 'and holds nothing but the split it is born with',
    ev(`JSON.stringify(__held(${JSON.stringify(n4)}).filter(function(k){ return k!=='fsrc'; }))`), '[]');
  chk(name, 'plan', 'the year’s plan holds none of the deleted text', ev(`JSON.stringify(S).indexOf('ZZDEL')`), '-1');
  const EXPORTS = ['exportExcel', 'exportCSV', 'exportSrc', 'exportPlans', 'exportFlow', 'exportCoa', 'exportFydpPlan'];
  const inExports = JSON.parse(ev(`(function(){ var hits=[];
    ${JSON.stringify(EXPORTS)}.forEach(function(fn){ var cap=null, o=buildXlsx;
      buildXlsx=function(sh){ cap=sh; return new Uint8Array(0); };
      try{ window[fn](); }catch(e){ hits.push(fn+' threw '+e.message); } buildXlsx=o;
      if(JSON.stringify(cap||[]).indexOf('ZZDEL')>=0) hits.push(fn); });
    return JSON.stringify(hits); })()`));
  chk(name, 'exports', 'no workbook carries any of the deleted text', inExports.join(', ') || 'none', 'none');
  // SAVE AND REOPEN. The highest number handed out is saved with the board, so a reopened board
  // that deletes its newest added requirement still never hands its number out again.
  const R = boot({ html: ev('buildSavedHtml()') });
  R.ev(`window.confirm=function(){ return true; }; window.alert=function(){}; 'ok'`);
  chk(name, 'reopen', 'the reopened plan holds none of the deleted text either', R.ev(`JSON.stringify(S).indexOf('ZZDEL')`), '-1');
  R.ev(`removeReq(${JSON.stringify(n4)});
    reqCreate(GROUPS[0], {title:'After reopen', event:'(added at drill)', ask:SVC.map(function(){ return 10; })}); save(); render(); 'ok'`);
  chk(name, 'reopen', 'the newest deleted after a reopen: its number is still never reused',
    R.ev('S.custom[S.custom.length-1].id'), 'NEW-5');
  // A PROPOSAL ACCEPTED FROM AN OFFICE is numbered the same way.
  ev(`__fill(${JSON.stringify(n4)}); removeReq(${JSON.stringify(n4)}); 'ok'`);
  const got = JSON.parse(ev(`(function(){ var ok=pmoAcceptProposal({prop:{nid:'NEW-PSM-1', title:'Proposed', grp:GROUPS[0], ask:[100,200,300]}, src:0, from:'PSM', by:'Office'});
    var id=S.custom[S.custom.length-1].id; return JSON.stringify({ok:ok, id:id, held:__held(id).filter(function(k){ return k!=='fsrc'; })}); })()`));
  chk(name, 'proposal', 'a proposal accepted after a delete gets a new number and inherits nothing',
    JSON.stringify(got), JSON.stringify({ ok: true, id: 'NEW-5', held: [] }));
  // MOVED TO ANOTHER YEAR: it goes, with everything it held; nothing stays behind in this year.
  const mv = ev(`__add('Moving')`);
  ev(`__fill(${JSON.stringify(mv)}); 'ok'`);
  const moved = JSON.parse(ev(`(function(){ var y=MS.cur+1, r=yearCopy(${JSON.stringify(mv)}, y, 'm'); applyState(S); save();
    var T=MS.years[y]; return JSON.stringify({ok:r.ok, left:__held(${JSON.stringify(mv)}), band:(T.band||{})[r.tid]||'', desc:(T.desc||{})[r.tid]||''}); })()`));
  chk(name, 'move', 'moving an added requirement to another year leaves nothing of it behind',
    JSON.stringify(moved.left), '[]');
  chk(name, 'move', 'because it arrived there with its data', moved.ok + ' ' + moved.band + ' ' + moved.desc, 'true pdm ZZDEL desc');
  // A BOARD SAVED BEFORE v1.89 already holds leftovers under numbers no requirement has. The next
  // number is past them, so they can never be inherited; they are left where they are.
  const L = mk();
  L(`__add('Only'); S.band['NEW-7']='pdm'; S.desc['NEW-7']='ZZDEL leftover'; if(!S.upl) S.upl={}; S.upl['r|NEW-9']=1; save(); 'ok'`);
  const ln = L(`__add('Next')`);
  chk(name, 'leftovers', 'a board already holding leftovers numbers past them', ln, 'NEW-10');
  chk(name, 'leftovers', 'and the new one carries none of them', L(`JSON.stringify(__held(${JSON.stringify(ln)}).filter(function(k){ return k!=='fsrc'; }))`), '[]');
  // A LOCKED CYCLE compared with the plan: the deleted one is REMOVED and the new one ADDED, never
  // one requirement that "changed".
  const C = mk();
  const c1 = C(`__add('Locked in')`);
  C(`MS.years[MS.cur]=S; blCyc='PB'; blYr=MS.cur; cycLock(); removeReq(${JSON.stringify(c1)}); 'ok'`);
  const c2 = C(`__add('After the lock')`);
  const kinds = JSON.parse(C(`(function(){ var d=cycCmpData('PB|'+MS.cur,'working'), r=d&&d.fy[MS.cur]? d.fy[MS.cur].rows : {};
    return JSON.stringify({a:(r[${JSON.stringify(c1)}]||{}).kind||'', b:(r[${JSON.stringify(c2)}]||{}).kind||''}); })()`));
  chk(name, 'cycle compare', 'the locked one reads as removed, the new one as added', `${kinds.a} ${kinds.b} ${c1 !== c2}`, 'removed added true');
  // v2.07 (item 121): THROUGH THE ADD BOX. The box writes a whole record in the one writer; after a delete, the requirement
  // it adds takes a new number and holds exactly what was typed into it -- its split, and the five fields this fill answers
  // -- with nothing of the deleted one, and no entry at all for a field the box left blank (the note, the CCaR, the PID).
  const X = mk();
  X(AR_DRIVE);
  X(`__add('One'); __add('Two'); __add('Doomed'); __fill('NEW-3'); removeReq('NEW-3'); 'ok'`);
  const bx = JSON.parse(X(`(function(){ var n0=S.custom.length; __arOpen(GROUPS[0]);
      __arFill({event:'Typed in the box', vals:['1,000','2,000','3,000'], desc:'Typed desc', cons:'Typed impact'}); __arBtn(/^Add requirement/);
      var id=S.custom.length>n0? S.custom[S.custom.length-1].id : '';
      return JSON.stringify({id:id, held:__held(id).filter(function(k){ return k!=='fsrc'; }).sort(),
        vals:[S.ptype[id], S.obCat[id]===OB_CATS[0], (S.desc||{})[id], (S.cons||{})[id], !!((S.dest||{})[id]||{}).to, (itemById(id)||{}).event],
        zz:JSON.stringify(S).indexOf('ZZDEL')}); })()`));
  chk(name, 'the Add box', 'after a delete, the box’s requirement takes a new number and holds exactly what was typed, nothing of the deleted one',
    JSON.stringify(bx), JSON.stringify({ id: 'NEW-4', held: ['cons', 'desc', 'dest', 'obCat', 'ptype'],
      vals: ['PRIME', true, 'Typed desc', 'Typed impact', true, 'Typed in the box'], zz: -1 }));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// v1.89, ITEM 25: RESTORE BRINGS BACK WHAT REMOVE TOOK.
// Removing a requirement from the board's data deleted its allocation, MC star, note, renamed title,
// CLIN breakdown and cost element while the confirmation said "Restore any time"; restored, it came
// back unfunded. Remove now keeps them. The other half of the property is the one that makes keeping
// them safe: while removed, what it keeps counts NOWHERE. Proved against a board that never had it --
// every figure of every workbook must be identical.
{
  const name = 'restore brings back what remove took';
  try {
  const SVC = ['USAF', 'ANG', 'AFRC'];
  const EXPORTS = ['exportExcel', 'exportCSV', 'exportSrc', 'exportPlans', 'exportFlow', 'exportCoa', 'exportFydpPlan'];
  const setup = `S.alloc.A={m:'t', v:700}; S.mc.A=true; S.notes.A='kept note'; S.titles.A='ZZKEEP renamed';
    if(!S.costElem) S.costElem={}; S.costElem.A='ZZKEEP-CE';
    if(!S.clinAlloc) S.clinAlloc={}; S.clinAlloc.A={n1:[50,20,10]};
    if(!S.clinMeta) S.clinMeta={}; S.clinMeta.A={n1:{ask:[60,20,10], desc:'ZZKEEP clin'}};
    if(!S.clinNew) S.clinNew={}; S.clinNew.A=[{key:'n1', clin:'3001', desc:'ZZKEEP new clin', ccar:'', ask:[60,20,10]}];
    if(!S.clinRm) S.clinRm={}; S.clinRm.A=['0002'];
    S.band.A='pdm'; S.desc.A='ZZKEEP desc'; S.awards.A={mode:'single', d:FYMON[3][0], day:4};
    S.alloc.C={m:'s', v:[300,50,20]}; S.mc.C=true; S.awards.C={mode:'single', d:FYMON[5][0], day:2};`;
  const board = (items, order) => {
    const { ev } = boot();
    seed(ev, { services: SVC, items, disc: [2000, 600, 300], mand: [500, 150, 80], order });
    ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
        applyState(S); ${setup} applyState(S); save(); window.confirm=function(){ return true; }; window.alert=function(){}; 'ok'`);
    return ev;
  };
  const three = [it('A', 'ATL', [900, 200, 100]), it('B', 'PSM', [400, 100, 50]), it('C', 'AV', [500, 90, 40])];
  const X = board(three, ['A', 'B', 'C']);
  const Y = board(three.filter(x => x.id !== 'A'), ['B', 'C']);
  const fields = `JSON.stringify({alloc:S.alloc.A||null, mc:!!S.mc.A, note:S.notes.A||null, title:S.titles.A||null,
    ce:(S.costElem||{}).A||null, clin:[(S.clinAlloc||{}).A||null, (S.clinMeta||{}).A||null, (S.clinNew||{}).A||null, (S.clinRm||{}).A||null]})`;
  const before = X(fields);
  X(`removeReq('A'); 'ok'`);
  chk(name, 'removed', 'it is off the board', X(`String(S.order.indexOf('A')<0 && !itemById('A') && S.removed.indexOf('A')>=0)`), 'true');
  chk(name, 'removed', 'and keeps every field while it is', X(fields), before);
  // Every numeric cell of every workbook, addressed by sheet and position, against the board that
  // never had it; and none of its text anywhere.
  const cells = ev => JSON.parse(ev(`(function(){ var out={};
    ${JSON.stringify(EXPORTS)}.forEach(function(fn){ var cap=null, o=buildXlsx;
      buildXlsx=function(sh){ cap=sh; return new Uint8Array(0); };
      try{ window[fn](); }catch(e){ out[fn+' threw']=String(e.message); } buildXlsx=o;
      (cap||[]).forEach(function(sh){ (sh.rows||[]).forEach(function(r,ri){ (r||[]).forEach(function(c,ci){
        var v=(c&&typeof c==='object'&&'v' in c)? c.v : c;
        if(typeof v==='number') out[fn+' ▸ '+sh.name+' ▸ '+ri+','+ci]=v;
        else if(typeof v==='string' && v.indexOf('ZZKEEP')>=0) out[fn+' ▸ '+sh.name+' ▸ '+ri+','+ci+' text']=v;
      }); }); }); });
    return JSON.stringify(out); })()`));
  const cx = cells(X), cy = cells(Y);
  const diff = [...new Set([...Object.keys(cx), ...Object.keys(cy)])].filter(k => cx[k] !== cy[k]);
  chk(name, 'removed', 'the workbooks compared hold enough figures to mean something', Object.keys(cy).length > 200, true);
  chk(name, 'removed', 'while removed, every figure of every workbook is what a board that never had it prints',
    diff.slice(0, 3).map(k => `${k}: ${cx[k]} vs ${cy[k]}`).join('; ') || `all ${Object.keys(cy).length} equal`, `all ${Object.keys(cy).length} equal`);
  const lanes = `(function(){ var T=tiers(), s=0; Object.keys(T).forEach(function(k){ s+=(T[k].d||[]).concat(T[k].m||[]).reduce(function(a,b){ return a+b; },0); }); return String(s); })()`;
  chk(name, 'removed', 'and the lane walk counts it nowhere', X(lanes), Y(lanes));
  // SAVED WHILE REMOVED, REOPENED, RESTORED: exactly as it was.
  const R = boot({ html: X('buildSavedHtml()') });
  R.ev(`restoreReq('A'); 'ok'`);
  chk(name, 'restore', 'restored after a save and reopen, it has everything it had', R.ev(fields), before);
  chk(name, 'restore', 'and draws its allocation again', R.ev(`String(((tiers().A||{}).d||[]).concat((tiers().A||{}).m||[]).reduce(function(a,b){ return a+b; },0)>0)`), 'true');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ═══ v1.90 (item 27) — THE FUNDING POSTURE PRINTS THE SCORECARDS' FIGURES ═══════════════════════════
// The strip at the top of the board restates the four cards in one line, and it is the figure people
// will read, so it must be the cards' figure to the dollar -- and its unfunded-by-service figures must be
// the reading against the ask, service by service, that adds up to the card's TOTAL. A trimmed allocation
// is what makes the two unfunded readings differ, so the fixture carries one.
{
  const name = 'the funding posture prints the scorecards’ figures';
  try {
  const SVC = ['USAF', 'ANG', 'AFRC'];
  const { ev } = boot();
  seed(ev, { services: SVC, items: [it('A', 'ATL', [900, 200, 100]), it('B', 'PSM', [400, 100, 50]), it('C', 'AV', [500, 90, 40]),
                                    it('D', 'MxS', [700, 300, 200])],
             disc: [1200, 300, 150], mand: [600, 200, 150], order: ['A', 'B', 'C', 'D'], mc: { A: true, D: true } });
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      applyState(S); S.alloc.C={m:'t', v:300}; S.fsrc.B={m:'mand'}; applyState(S); save(); 'ok'`);
  const read = () => JSON.parse(ev(`(function(){ render();
    var n=function(t){ return Number(String(t||'').replace(/[^0-9.-]/g,''))||0; };
    var card=function(c){ return ((document.querySelector('#scores .sc.'+c)||{}).textContent||'').replace(/\\s+/g,' '); };
    var g=function(s,re){ var m=s.match(re); return m? n(m[1]) : null; };
    var pv=function(sel){ return [].slice.call(document.querySelectorAll('#posture '+sel)).map(function(e){ return n(e.getAttribute('data-v')); }); };
    var T=tiers(null, scenOpt()), tt=tierTotals(T), ask=[0,0,0];
    S.order.forEach(function(id){ var it=itemById(id); if(it && T[id]) unfSvcOf(it,T[id]).forEach(function(v,i){ ask[i]+=v; }); });
    var D=card('disc'), M=card('mand'), C=card('mc'), W=card('whole');
    return JSON.stringify({ lanes: pv('.pplanes [data-v]'), lanesCard: [g(D,/BA: \\$([\\d,]+)/), g(D,/\\$([\\d,]+) left/), g(M,/BA: \\$([\\d,]+)/), g(M,/\\$([\\d,]+) left/)],
      mc: pv('.pp.mc .v')[0], mcCard: g(C,/\\u26a0 \\$([\\d,]+) of the must-pay/)||0,
      whole: pv('.pp:nth-child(3) .v')[0], wholeCard: g(W,/TOTAL \\$([\\d,]+)/), u2: Math.round(tt.u2Amt), uLane: Math.round(tt.uAmt), mcNeed: Math.round(tt.mcNeed),
      svc: pv('.ppsvc [data-v]'), svcAsk: ask.map(Math.round) }); })()`));
  // NOT HOLLOW: on the board as seeded, the trim makes the lane reading differ from the reading against the
  // ask, and the must-pays draw mandatory, so what they need above discretionary is not what stays
  // unfunded -- a strip printing the wrong one of either pair is caught below, not agreeing by accident.
  const r0 = read();
  chk(name, 'fixture', 'the two unfunded readings differ on this board', r0.uLane !== r0.u2, true);
  chk(name, 'fixture', 'and the must-pays draw mandatory, so their need above discretionary is not what stays unfunded', r0.mcNeed !== r0.mc, true);
  for (const [label, step] of [['as seeded', ''], ['with the discretionary-only what-if', `setScen('disc');`], ['with a must-pay trimmed to nothing', `S.alloc.D={m:'t', v:0}; applyState(S);`]]) {
    if (step) ev(step + ` 'ok'`);
    const r = read();
    chk(name, label, 'the lanes: discretionary BA and left, mandatory BA and left, are the cards’', JSON.stringify(r.lanes), JSON.stringify(r.lanesCard));
    chk(name, label, 'mission critical unfunded is the card’s', r.mc, r.mcCard);
    chk(name, label, 'whole-budget unfunded is the card’s TOTAL', r.whole, r.wholeCard);
    chk(name, label, 'and that is the reading against the ask', r.whole, r.u2);
    chk(name, label, 'unfunded by service is the reading against the ask, service by service', JSON.stringify(r.svc), JSON.stringify(r.svcAsk));
    chk(name, label, 'and adds up to the TOTAL', r.svc.reduce((a, b) => a + b, 0), r.wholeCard);
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ═══ v1.94 (item 45) — CR HALF-MONTHS FOLLOW EACH AWARD'S OWN DATE ═══════════════════════════════════════════
// Brad, 2 Oct 2026: "The date and amount reported is the date and amount reported and should be the sole
// identifying information for where it resides in the CR view." The 1st to the 15th is the first half of the
// month, the 16th to the end the second; an award saved with a month and no day counts as the 1st, the date its
// award block shows. v1.93 took the half from ONE mark per requirement per month, set by whichever award was
// edited last (or a click), so two awards in one month shared a half and a moved or deleted award left its mark
// behind. Every figure below is written from the scenario; the awards are made through the board's own setters.
{
  const name = 'v1.94 — CR half-months follow each award’s own date';
  try {
  const J = JSON.stringify;
  const sc = {
    services: ['STOVL', 'USN'],
    items: [it('A', 'AV', [200, 100]), it('B', 'AV', [120, 0]), it('C', 'AV', [70, 0]), it('D', 'AV', [200, 0]),
            it('E', 'AV', [80, 0]), it('F', 'AV', [0, 90]), it('G', 'AV', [60, 0]), it('H', 'AV', [0, 25]),
            it('I', 'AV', [20, 0]), it('K', 'AV', [0, 30])],
    disc: [5000, 5000], mand: [5000, 5000], order: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K'],
    fsrc: { D: { m: 'split', dv: [150, 0], mv: [50, 0] } },
  };
  const { ev, errors } = boot();
  seed(ev, sc);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  // FYMON: 0 Oct, 1 Nov, 2 Dec, 3 Jan, 4 Feb, 5 Mar
  ev(`(function(){
    BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S);
    window.__day=function(k, d){ return FYMON[k][0]+'-'+String(d).padStart(2,'0'); };
    window.__add=function(id, k, d, sv, tag){ var e=document.getElementById('awdM-'+id); if(!e){ e=document.createElement('input'); e.id='awdM-'+id; document.body.appendChild(e); }
      e.value=__day(k, d); addAwd(id); var x=S.awards[id].inc.filter(function(a){ return !a.tag; })[0]; x.tag=tag;
      var i=S.awards[id].inc.indexOf(x); sv.forEach(function(v, si){ setAwdIncSvc(id, i, si, String(v)); }); };
    window.__at=function(id, tag){ return S.awards[id].inc.findIndex(function(a){ return a.tag===tag; }); };
    __add('A', 3, 10, [100, 60], 'a1'); __add('A', 3, 20, [100, 40], 'a2');                 // two in January: 10th and 20th
    __add('B', 3, 10, [50, 0], 'b1');   __add('B', 3, 20, [70, 0], 'b2');
    setAwdIncDate('B', __at('B','b2'), __day(4, 5));                                         // the 20th moves to 5 February
    __add('C', 3, 10, [30, 0], 'c1');   __add('C', 3, 20, [40, 0], 'c2');
    rmAwd('C', __at('C','c2'));                                                              // the second-half award is deleted
    __add('D', 5, 10, [100, 0], 'd1');  __add('D', 5, 25, [100, 0], 'd2');                 // both lanes: $150 disc + $50 mand
    setAwdDateFull('E', __day(2, 20));                                                       // one date: 20 December
    S.awards.F={mode:'single', d:FYMON[1][0]}; S.crHalf.F={}; S.crHalf.F[FYMON[1][0]]=1;    // an older board: month only, marked 16-EOM
    setAwdDateFull('G', __day(0, 10)); S.crHalf.G={}; S.crHalf.G[FYMON[0][0]]=1;            // dated the 10th, an old mark said 16-EOM
    setAwdDateFull('H', __day(2, 20)); S.crHalf.H={}; S.crHalf.H[FYMON[2][0]]=1;            // dated the 20th, and an old mark that agrees
    S.crHalf.G[FYMON[1][0]]=1;                                                               // G: a second mark, in a month G has no award in
    __add('I', 4, 15, [10, 0], 'i1');   __add('I', 4, 16, [10, 0], 'i2');                 // the boundary: the 15th and the 16th
    __add('K', 1, 5, [0, 15], 'k1');    __add('K', 2, 20, [0, 15], 'k2');                 // K: 5 Nov unmarked, 20 Dec with a mark that agrees
    S.crHalf.K={}; S.crHalf.K[FYMON[2][0]]=1;
    save(); render(); return 'ok'; })()`);
  const W = (m, h) => m * 2 + h;                        // window index: month 0..5, half 0|1
  const wins = o => { const a = Array(12).fill(0); Object.keys(o).forEach(k => { a[k] = o[k]; }); return a; };
  const want = {
    STOVL: { win: wins({ [W(0, 0)]: 60, [W(2, 1)]: 80, [W(3, 0)]: 100 + 50 + 30, [W(3, 1)]: 100, [W(4, 0)]: 70 + 10, [W(4, 1)]: 10, [W(5, 0)]: 100, [W(5, 1)]: 100 }), nodate: 40 },
    USN: { win: wins({ [W(1, 0)]: 90 + 15, [W(2, 1)]: 25 + 15, [W(3, 0)]: 60, [W(3, 1)]: 40 }), nodate: 0 },
  };
  const byReq = { A: wins({ [W(3, 0)]: 160, [W(3, 1)]: 140 }), B: wins({ [W(3, 0)]: 50, [W(4, 0)]: 70 }), C: wins({ [W(3, 0)]: 30 }),
    D: wins({ [W(5, 0)]: 100, [W(5, 1)]: 100 }), E: wins({ [W(2, 1)]: 80 }), F: wins({ [W(1, 0)]: 90 }), G: wins({ [W(0, 0)]: 60 }),
    H: wins({ [W(2, 1)]: 25 }), I: wins({ [W(4, 0)]: 10, [W(4, 1)]: 10 }), K: wins({ [W(1, 0)]: 15, [W(2, 1)]: 15 }) };
  const read = e => JSON.parse(e(`JSON.stringify(crData().map(function(s){ var by={};
    s.items.forEach(function(r){ by[r.id]=r.wins; }); return {win:s.win, nodate:s.nodate, tot:s.tot, by:by}; }))`));
  const cr = read(ev);
  sc.services.forEach((s, i) => {
    chk(name, s, 'every half-month window, by each award’s own date', J(cr[i].win), J(want[s].win));
    chk(name, s, 'No date: only the deleted award’s $40 (STOVL)', cr[i].nodate, want[s].nodate);
    chk(name, s, 'TOTAL IN WINDOW is the windows', cr[i].tot, want[s].win.reduce((a, b) => a + b, 0));
  });
  const reqSum = id => { const a = Array(12).fill(0); cr.forEach(s => (s.by[id] || Array(12).fill(0)).forEach((v, w) => { a[w] += v; })); return a; };
  Object.keys(byReq).forEach(id => chk(name, 'requirement ' + id, 'its windows, both services', J(reqSum(id)), J(byReq[id])));
  chk(name, 'marks', 'dating an award writes no half-month mark (A, B, C, D, E)',
    ev(`JSON.stringify(['A','B','C','D','E'].map(function(id){ return (S.crHalf||{})[id]||null; }))`), J([null, null, null, null, null]));
  chk(name, 'marks', 'the old marks are kept, untouched (F, G)',
    ev(`JSON.stringify([S.crHalf.F, S.crHalf.G])`), J([{ [ev('FYMON[1][0]')]: 1 }, { [ev('FYMON[0][0]')]: 1, [ev('FYMON[1][0]')]: 1 }]));
  // THE THREE SURFACES AGREE TO THE DOLLAR: the panel (By Service), the workbook's CR sheet, the 1A9A return
  const panel = JSON.parse(ev(`(function(){ crBy='svc'; var R=crRows(); return JSON.stringify(R.data.map(function(s){ return s.win; })); })()`));
  chk(name, 'panel', 'the CR panel By Service is the same windows', J(panel), J(cr.map(s => s.win)));
  const sheets = JSON.parse(capture(ev));
  const crs = sheets.find(x => x.name === 'CR Cash Needs');
  const rowOf = lbl => { const r = crs && crs.rows.find(r => r && cv(r[0]) === lbl); return r ? r.slice(1, 13).map(cv) : null; };
  chk(name, 'workbook', 'the workbook’s CR sheet: STOVL and USN rows', J([rowOf('STOVL'), rowOf('USN')]), J([want.STOVL.win, want.USN.win]));
  const r1a9a = JSON.parse(ev(`JSON.stringify(crExportRows().map(function(e){ return [e.id, e.wins]; }))`));
  chk(name, '1A9A', 'the 1A9A rows: each requirement, STOVL + USN combined',
    J(r1a9a), J(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K'].map(id => [id, byReq[id]])));
  // THE OBL DATE: the earliest award's real date (B: 10 Jan and 5 Feb); a day past the month's end is its last day
  const obl = id => ev(`(function(){ var s=crObl(${J(id)}); return s? new Date((s-25569)*86400000).toISOString().slice(0,10) : 'none'; })()`);
  chk(name, '1A9A', 'OBL DATE is the earliest award’s own date (B)', obl('B'), ev(`__day(3, 10)`));
  ev(`S.awards.Z={mode:'single', d:FYMON[4][0], day:31}; 'ok'`);
  chk(name, '1A9A', 'a day past the month’s end is that month’s last day', obl('Z'), ev(`(function(){ var y=+FYMON[4][0].slice(0,4); return FYMON[4][0]+'-'+String(new Date(Date.UTC(y, 2, 0)).getUTCDate()).padStart(2,'0'); })()`));
  ev(`delete S.awards.Z; 'ok'`);
  // NO CLICK SWITCHES A HALF
  const ph = ev(`(function(){ crOpen=true; crBy='svc'; crX={STOVL:true, USN:true}; render(); var h=document.getElementById('crBody').innerHTML; crOpen=false; render(); return h; })()`);
  chk(name, 'panel', 'no cell in the CR panel switches a half', /crToggle/.test(ph) ? 'a cell still switches' : 'none', 'none');
  chk(name, 'panel', 'and nothing in the board can', ev(`typeof crToggle`), 'undefined');
  // INCREMENTAL ON AND OFF KEEPS THE DAY
  ev(`toggleAwdInc('E', 80); 'ok'`);
  chk(name, 'toggle', 'switching E to Incremental keeps its day, and its December 16-EOM window',
    J([ev(`S.awards.E.inc[0].day`), read(ev)[0].by.E[W(2, 1)]]), J([20, 80]));
  ev(`toggleAwdInc('E', 80); 'ok'`);
  chk(name, 'toggle', 'and back to one date keeps it', ev(`JSON.stringify([S.awards.E.mode, S.awards.E.d, S.awards.E.day])`), J(['single', ev(`FYMON[2][0]`), 20]));
  // PRE-FLIGHT NAMES EVERY AWARD WHOSE HALF THE DATE MOVED FROM AN OLD MARK: F (month only) and G (dated the 10th)
  const pf = () => JSON.parse(ev(`(function(){ var f=preflight().find.filter(function(x){ return x.k==='crmoved'; })[0];
    return JSON.stringify(f? f.rows.map(function(r){ return r.id; }) : []); })()`));
  chk(name, 'pre-flight', 'lists F and G -- not H or K, whose old marks agree with their dates, nor K’s unmarked 5 Nov -- and nothing else', J(pf()), J(['F', 'G']));
  // THE CR PANEL SAYS SO, AND "THE DATES ARE RIGHT" CLEARS THOSE MARKS -- AND MOVES NO DOLLAR
  const note = ev(`(function(){ crOpen=true; render(); var b=document.getElementById('crBody'); var n=b.querySelector('.crmoved');
    var t=n? n.textContent.replace(/\\s+/g,' ') : ''; crOpen=false; render(); return t; })()`);
  chk(name, 'panel', 'the CR panel names both, and offers to clear the old marks',
    J([/F event/.test(note), /G event/.test(note), /clear the old marks/i.test(note)]), J([true, true, true]));
  // GO TO IT: the CR box closes and G is selected, its award date in the RECORD panel
  chk(name, 'panel', 'Go to it closes the CR box and selects the requirement',
    ev(`(function(){ toggleCr(); crGo('G'); return JSON.stringify([crOpen, document.getElementById('crPanel').classList.contains('open'), curRow]); })()`), J([false, false, 'G']));
  const before = J(read(ev).map(s => s.win));
  ev(`crClearOldMarks(); 'ok'`);
  chk(name, 'clear', 'the two disagreeing marks are gone; G’s other mark, H’s and K’s are kept; no figure moved; Pre-flight is clear',
    J([ev(`JSON.stringify([(S.crHalf.F||{})[FYMON[1][0]]||null, (S.crHalf.G||{})[FYMON[0][0]]||null, (S.crHalf.G||{})[FYMON[1][0]]||null,
      (S.crHalf.H||{})[FYMON[2][0]]||null, (S.crHalf.K||{})[FYMON[2][0]]||null])`),
      J(read(ev).map(s => s.win)) === before, pf()]), J([J([null, null, 1, 1, 1]), true, []]));
  // SAVE -> REOPEN: the same windows
  ev('save()');
  const r2 = boot({ html: ev('buildSavedHtml()') });
  chk(name, 'reopen', 'saved and reopened, every window is the same', J(read(r2.ev).map(s => s.win)), J(read(ev).map(s => s.win)));
  // COPY TO ANOTHER YEAR: the days travel, and the halves with them
  const cy = JSON.parse(ev(`(function(){ var r=yearCopy('A', MS.cur+1, 'c'); switchYear(MS.cur+1); S.discSvc=[5000,5000]; S.mandSvc=[5000,5000]; save();
    var d=crData(), o={days:S.awards.A.inc.map(function(x){ return x.day; }), win:[0,1].map(function(i){ var w=(d[i].items.filter(function(r){ return r.id==='A'; })[0]||{}).wins; return w? w.slice(6,8) : null; })};
    switchYear(MS.cur-1); return JSON.stringify(o); })()`));
  chk(name, 'copy', 'copied to the next year: A’s days and January halves', J(cy), J({ days: [10, 20], win: [[100, 100], [60, 40]] }));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// A REQUIREMENT SHARED BETWEEN OFFICES: each office's share of each award, in that award's own half
{
  const name = 'v1.94 — CR half-months by PMO, a requirement shared between offices';
  try {
  const J = JSON.stringify;
  const sc = { services: ['USAF', 'ANG'], items: [it('PRIME-3', 'AV', [100, 50])], disc: [150, 80], mand: [30, 0], order: ['PRIME-3'],
    fsrc: { 'PRIME-3': { m: 'split', dv: [70, 50], mv: [30, 0] } } };
  const { ev } = boot(); seed(ev, sc);
  ev(`(function(){ DATA.clins=DATA.clins||{}; DATA.clins['PRIME-3']=[{clin:'0002', ask:[60,0]}, {clin:'0008', ask:[40,50]}]; S.ptype={'PRIME-3':'PRIME'};
    var add=function(d, sv){ var e=document.getElementById('awdM-PRIME-3'); if(!e){ e=document.createElement('input'); e.id='awdM-PRIME-3'; document.body.appendChild(e); }
      e.value=FYMON[3][0]+'-'+d; addAwd('PRIME-3'); var i=S.awards['PRIME-3'].inc.findIndex(function(a){ return a.day===+d; });
      sv.forEach(function(v, si){ setAwdIncSvc('PRIME-3', i, si, String(v)); }); };
    add('10', [50, 50]); add('20', [50, 0]); save(); render(); return 'ok'; })()`);
  // USAF: disc $70 forward -> 10th $50, 20th $20; mand $30 back -> 20th $30. ANG: 10th $50. AV holds 60% of USAF, TSS 40% and all of ANG.
  const got = JSON.parse(ev(`JSON.stringify((function(){ var R=crBuckets(null,'pmo'), o={}; R.keys.forEach(function(k,i){ o[k]=R.data[i].win.slice(6,8).map(function(v){ return Math.round(v*100)/100; }); }); return o; })())`));
  chk(name, 'by PMO', 'January, first and second half: AV and TSS', J([got.AV, got.TSS]), J([[30, 30], [70, 20]]));
  const svc = JSON.parse(ev(`JSON.stringify(crData().map(function(s){ return s.win.slice(6,8); }))`));
  chk(name, 'by service', 'January, first and second half: USAF and ANG', J(svc), J([[50, 50], [50, 0]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ═══ v1.94 (item 46) — AWARDS ON ONE DATE KEEP A DEFINED ORDER ═══════════════════════════════════════════════
// Awards are taken by date; awards on the SAME date in the order they arrived on it -- added there, or moved
// there by a date edit, which puts an award at the bottom of that date's group. Discretionary fills forward and
// mandatory backward in that order, and put on last fills the last award of the latest date. v1.93 left the
// order to whatever earlier edits had made it: an award edited onto an occupied date could come first.
{
  const name = 'v1.94 — awards on one date keep a defined order';
  try {
  const J = JSON.stringify;
  const sc = { services: ['USAF', 'ANG'], items: [it('A', 'AV', [200, 0])], disc: [5000, 5000], mand: [5000, 5000], order: ['A'],
    fsrc: { A: { m: 'split', dv: [150, 0], mv: [50, 0] } } };
  const { ev } = boot(); seed(ev, sc);
  ev(`(function(){ BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S);
    window.__day=function(d){ return FYMON[3][0]+'-'+String(d).padStart(2,'0'); };
    window.__add=function(d, v, tag){ var e=document.getElementById('awdM-A'); if(!e){ e=document.createElement('input'); e.id='awdM-A'; document.body.appendChild(e); }
      e.value=__day(d); addAwd('A'); var x=S.awards.A.inc.filter(function(a){ return !a.tag; })[0]; x.tag=tag; setAwdIncSvc('A', S.awards.A.inc.indexOf(x), 0, String(v)); };
    window.__at=function(tag){ return S.awards.A.inc.findIndex(function(a){ return a.tag===tag; }); };
    __add(20, 100, 'p'); __add(20, 60, 'q'); __add(5, 40, 'r'); save(); return 'ok'; })()`);
  const order = e => e(`JSON.stringify(S.awards.A.inc.map(function(x){ return x.tag; }))`);
  const split = () => ev(`(function(){ var s=awdSplitOf('A', tiers().A); return JSON.stringify(S.awards.A.inc.map(function(x, j){ var q=s.by[j]||{dv:0,mv:0}; return x.tag+' '+q.dv+'d+'+q.mv+'m'; })); })()`);
  chk(name, 'add', 'two added on 20 Jan stay in the order added; 5 Jan first by date', order(ev), J(['r', 'p', 'q']));
  ev(`setAwdIncDate('A', __at('r'), __day(20)); 'ok'`);
  chk(name, 'edit', 'r moved onto 20 Jan joins the bottom of that date', order(ev), J(['p', 'q', 'r']));
  chk(name, 'split', 'discretionary forward from p, mandatory back from r', split(), J(['p 100d+0m', 'q 50d+10m', 'r 0d+40m']));
  ev(`S.awards.A.inc[__at('r')].sv=[0,0]; fillLastAwd('A'); 'ok'`);
  chk(name, 'put on last', 'put on last fills r, the last of the latest date', ev(`JSON.stringify(S.awards.A.inc.map(function(x){ return x.tag+':'+x.sv[0]; }))`), J(['p:100', 'q:60', 'r:40']));
  ev(`setAwdIncDate('A', __at('p'), FYMON[4][0]+'-05'); setAwdIncDate('A', __at('p'), __day(20)); 'ok'`);
  chk(name, 'edit', 'p moved away and back rejoins at the bottom', order(ev), J(['q', 'r', 'p']));
  ev(`__add(20, 0, 's'); 'ok'`);
  chk(name, 'add', 'a fourth added on 20 Jan goes last', order(ev), J(['q', 'r', 'p', 's']));
  ev('save()');
  const r2 = boot({ html: ev('buildSavedHtml()') });
  chk(name, 'reopen', 'saved and reopened: the same order', order(r2.ev), J(['q', 'r', 'p', 's']));
  chk(name, 'copy', 'copied to the next year: the same order',
    ev(`(function(){ yearCopy('A', MS.cur+1, 'c'); return JSON.stringify(MS.years[MS.cur+1].awards.A.inc.map(function(x){ return x.tag; })); })()`), J(['q', 'r', 'p', 's']));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ==== v1.95 W3: PMO packages and incoming awards (items 51, 52, 53) ====
// OPENING A SAVED BOARD, the sixth way an award comes in (review R09). Brad's default, kept: nothing is refused
// and NOTHING IS ZEROED -- a list of the wrong width keeps its total, spread over the requirement's values; what
// cannot be repaired is flagged NEEDS REPAIR with its cash UNSCHEDULED; and the record as it was saved is kept beside
// the repair (Codex's conditions). Asserted where it matters: each service's cash, in its CR half-month and in
// UNSCHEDULED, requirement by requirement and for the whole board.
const { bootMark: w3Mark, bootRelease: w3Release, settleBoards: w3Settle } = await import('./boot.mjs');
const w3bit = (id, ask) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Req ' + id, event: 'Event ' + id,
  ccar: 'JSF' + id, fy26: ask.map(() => 0), ask, alloc: null });
// a real saved board file whose FY27 plan carries these awards, written into the file as another tool would
const w3saved = (items, awards, tx) => {
  const b = boot(); seed(b.ev, { services: ['USAF', 'USN'], items, disc: [40000000, 60000000], mand: [0, 0], order: items.map(x => x.id) });
  b.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`);
  const RE = /(<script type="application\/json" id="pubState">)([\s\S]*?)(<\/script>)/;
  const t = b.ev('buildSavedHtml()').replace(RE, (m, a, s, c) => { const J = JSON.parse(s); (J.appns ? J.appns.om : J).years['2027'].awards = awards;
    return a + JSON.stringify(J).replace(/</g, '\\u003c') + c; });
  return tx ? tx(t) : t;
};
// a reading that cannot be taken is a failing check, not the end of the block (on v1.94 the new functions are missing)
const w3try = (ev, code) => { try { return ev(code); } catch (e) { return 'THREW: ' + String((e && e.message) || e).slice(0, 120); } };
// what the board holds for one award, the way a person reads it: mode | headline date | day | each award's
// date / day / dollars by service / mark
const W3_SUM = `function(aw){ if(!aw) return 'none'; var o=[aw.mode, aw.d||'', aw.day||''];
  (Array.isArray(aw.inc)? aw.inc : []).forEach(function(x){ o.push(x.d+'/'+(x.day||'')+'/'+JSON.stringify(x.sv)+'/'+(x.fx||'')); }); return o.join('|'); }`;
// one requirement's cash by service: what lands in 1-15 OCT (crData's own per-requirement windows) and UNSCHEDULED
const W3_REQCASH = `function(id){ var T=tiers(null, scenOpt()), p=T[id], cr=crData(null), ms=p? monSpreadOf(id,p) : {unsch:[0,0]};
  return SVC.map(function(s,i){ var r=(cr[i].items||[]).filter(function(x){ return x.id===id; })[0];
    return Math.round(r? r.wins[0] : 0)+'/'+Math.round(ms.unsch[i]); }).join(' '); }`;
await (async () => {
  const __bm = w3Mark();
  const name = 'v1.95 W3 — opening a saved board repairs its awards, never zeroes them, and keeps the originals (item 53)';
  try {
  const inc = (sv, d = '2026-10', day = 5) => ({ mode: 'inc', inc: [{ d, day, sv }] });
  // [id, label, the award as saved, what the board holds, the mark, cash 'USAF 1-15 OCT/UNSCHEDULED USN ...',
  //  true where v1.94 already placed the cash the same way (a control for that check)]
  const V = [
    ['G', 'good', inc([1000000, 2000000]), 'inc|||2026-10/5/[1000000,2000000]/', 'none', '1000000/0 2000000/0', true],
    ['T', 'figures written as text ["1000000","2000000"]', inc(['1000000', '2000000']), 'inc|||2026-10/5/[1000000,2000000]/', 'conv', '1000000/0 2000000/0', true],
    ['M', 'figures written with commas ["1,000,000","2,000,000"]', inc(['1,000,000', '2,000,000']), 'inc|||2026-10/5/[1000000,2000000]/', 'conv', '1000000/0 2000000/0'],
    ['F', 'fractions [1000000.75,1999999.25]', inc([1000000.75, 1999999.25]), 'inc|||2026-10/5/[1000001,1999999]/', 'conv', '1000000/0 1999999/1', true],
    ['K', '"1,234" and "abc"', inc(['1,234', 'abc']), 'inc|||2026-10/5/[1234,0]/repair', 'repair', '1234/998766 0/2000000'],
    ['N', 'a negative figure [-500000,2000000]', inc([-500000, 2000000]), 'inc|||2026-10/5/[0,2000000]/repair', 'repair', '0/1000000 2000000/0', true],
    ['I', '"Infinity"', inc(['Infinity', 2000000]), 'inc|||2026-10/5/[0,2000000]/repair', 'repair', '0/1000000 2000000/0'],
    ['A', '"NaN"', inc(['NaN', 2000000]), 'inc|||2026-10/5/[0,2000000]/repair', 'repair', '0/1000000 2000000/0', true],
    ['E', '1e400 in the file', inc([7777777777, 2000000]), 'inc|||2026-10/5/[0,2000000]/repair', 'repair', '0/1000000 2000000/0', true],
    ['W', 'one figure for two services [3000000]', inc([3000000]), 'inc|||2026-10/5/[1000000,2000000]/split', 'split', '1000000/0 2000000/0'],
    ['X', 'three figures for two services', inc([1000000, 2000000, 500000]), 'inc|||2026-10/5/[1166667,2333333]/split', 'split', '1000000/0 2000000/0'],
    ['L', 'dollars that are not a list ("3000000")', { mode: 'inc', inc: [{ d: '2026-10', day: 5, sv: '3000000' }] }, 'inc|||2026-10/5/[1000000,2000000]/split', 'split', '1000000/0 2000000/0'],
    ['U', 'one lump figure from before awards were split by service', { mode: 'inc', inc: [{ d: '2026-10', day: 5, v: 3000000 }] }, 'inc|||2026-10/5/[1000000,2000000]/split', 'split', '1000000/0 2000000/0', true],
    ['D', 'date "2027-13"', inc([1000000, 2000000], '2027-13'), 'inc||', 'repair', '0/1000000 0/2000000', true],
    ['H', 'date "abc"', inc([1000000, 2000000], 'abc'), 'inc||', 'repair', '0/1000000 0/2000000', true],
    ['Y', 'day 45', inc([1000000, 2000000], '2026-10', 45), 'inc|||2026-10//[1000000,2000000]/', 'conv', '1000000/0 2000000/0', true],
    ['S', 'a single award dated "2027-13"', { mode: 'single', d: '2027-13', day: 5 }, 'single||', 'repair', '0/1000000 0/2000000', true],
    ['B', 'mode "bogus" (a December date, an October award)', { mode: 'bogus', d: '2026-12', inc: [{ d: '2026-10', day: 5, sv: [1000000, 2000000] }] }, 'single||', 'repair', '0/1000000 0/2000000'],
    ['O', 'no mode', { inc: [{ d: '2026-10', day: 5, sv: [1000000, 2000000] }] }, 'single||', 'repair', '0/1000000 0/2000000', true],
    ['P', 'a good award and a later one with a figure that cannot be read', { mode: 'inc', inc: [{ d: '2026-10', day: 5, sv: [1000000, 2000000] }, { d: '2026-11', day: 20, sv: ['abc', 0] }] },
      'inc|||2026-10/5/[1000000,2000000]/|2026-11/20/[0,0]/repair', 'repair', '1000000/0 2000000/0'],
    ['Q', 'three figures, on a requirement whose values are all zero', inc([1, 2, 3]), 'inc||', 'repair', '0/0 0/0', true],
  ];
  const items = V.map(v => w3bit(v[0], v[0] === 'Q' ? [0, 0] : [1000000, 2000000]));
  const awards = {}; V.forEach(v => { awards[v[0]] = v[2]; });
  const html = w3saved(items, awards, t => t.replace('7777777777', '1e400'));
  const B = boot({ html });
  chk(name, 'opening', 'control — the board opens with no script error', JSON.stringify(B.errors), '[]');
  for (const [id, lbl, saved, holds, how, cash, cashCtl] of V) {
    chk(name, lbl, (id === 'G' ? 'control — ' : '') + 'what the board holds, every figure a whole number zero or more',
      B.ev(`(function(){ var aw=S.awards[${JSON.stringify(id)}]; var ok=(Array.isArray(aw&&aw.inc)? aw.inc : []).every(function(x){
        return !Array.isArray(x.sv) || x.sv.every(function(v){ return typeof v==='number' && v>=0 && v===Math.floor(v); }); });
        return (${W3_SUM})(aw)+(ok? '' : ' (A FIGURE IS NOT WHOLE DOLLARS)'); })()`), holds);
    chk(name, lbl, (cashCtl ? 'control (v1.94 placed it the same way) — ' : '') + 'its cash by service: 1–15 OCT / UNSCHEDULED, USAF then USN',
      B.ev(`(${W3_REQCASH})(${JSON.stringify(id)})`), cash);
    const orig = id === 'E' ? JSON.stringify(saved).replace('7777777777', 'null') : JSON.stringify(saved);
    chk(name, lbl, (id === 'G' ? 'control — nothing to keep: ' : '') + 'the record as it was saved is kept beside the repair, and marked',
      B.ev(`(function(){ var f=(S.awards[${JSON.stringify(id)}]||{}).fix; return f? f.how+' '+(f.orig===${JSON.stringify(orig)}? 'kept whole' : 'NOT KEPT: '+f.orig) : 'none'; })()`),
      how === 'none' ? 'none' : how + ' kept whole');
  }
  // THE WHOLE BOARD: CR Cash Needs by service and half-month, and UNSCHEDULED, add up to the requirements above
  const sum = k => V.reduce((a, v) => a + Number(v[5].split(' ')[k].split('/')[0]), 0);
  const uns = k => V.reduce((a, v) => a + Number(v[5].split(' ')[k].split('/')[1]), 0);
  chk(name, 'CR Cash Needs', 'every service’s 1–15 OCT and UNSCHEDULED are the sum of its requirements’ — nothing zeroed, nothing lost',
    B.ev(`JSON.stringify(crData(null).map(function(b){ return Math.round(b.win[0])+'/'+Math.round(b.nodate); }))`),
    JSON.stringify([sum(0) + '/' + uns(0), sum(1) + '/' + uns(1)]));
  chk(name, 'CR Cash Needs', 'and the 1A9A rows read the same award: an inferred split’s USN dollars in 1–15 OCT',
    B.ev(`JSON.stringify(crExportRows().filter(function(r){ return r.id==='W' || r.id==='X'; }).map(function(r){ return r.id+' '+Math.round(r.wins[0]); }))`),
    JSON.stringify(['W 2000000', 'X 2000000']));
  // THE REPORT: said on opening, listed under Needs attention with what was done and the split used, marked in the block
  const fixed = V.filter(v => v[4] !== 'none');
  const nRep = fixed.filter(v => v[4] === 'repair').length;
  chk(name, 'report', 'the board says on opening how many awards it repaired, and how many need repair',
    new RegExp('🔧 ' + fixed.length + ' awards repaired on opening are waiting to be checked — ' + nRep + ' need repair').test(B.ev(`(document.getElementById('shareStat')||{}).textContent`)), true);
  chk(name, 'report', 'Needs attention lists every one, those that need repair first',
    w3try(B.ev, `JSON.stringify(attLists().awfix.map(function(x){ return x.id+':'+x.how; }))`),
    JSON.stringify(fixed.filter(v => v[4] === 'repair').map(v => v[0] + ':repair').concat(fixed.filter(v => v[4] !== 'repair').map(v => v[0] + ':' + v[4]))));
  w3try(B.ev, `attShow('awfix'); 'ok'`);
  chk(name, 'report', 'its list names the award and the split used',
    /Inferred split — award 1 \(5 OCT 26\) has dollars for 1 service on a board of 2\. Its total, \$3,000,000, is kept and spread over the requirement’s values \(USAF \$1,000,000 · USN \$2,000,000\): USAF \$1,000,000 · USN \$2,000,000\. This split is INFERRED, not the one recorded\./
      .test(w3try(B.ev, `document.getElementById('attBody').textContent`)), true);
  w3try(B.ev, `attClose(); 'ok'`);
  const block = id => w3try(B.ev, `(function(){ var d=document.createElement('div'); d.innerHTML=awardBlockHtml(itemById(${JSON.stringify(id)})); return d.textContent.replace(/\\s+/g,' '); })()`);
  chk(name, 'award block', 'an inferred split is marked on its row and said, with the award as it was saved',
    [/SPLIT INFERRED \$3,000,000/, /◇ SPLIT INFERRED — repaired when this board was opened/, /The award as it was saved, kept with it/, /\{"mode":"inc","inc":\[\{"d":"2026-10","day":5,"sv":\[3000000\]\}\]\}/].every(r => r.test(block('W'))), true);
  chk(name, 'award block', 'an award that needs repair is marked, its good award still shown as it was',
    [/NEEDS REPAIR/, /⚠ NEEDS REPAIR — when this board was opened/, /\$3,000,000/].every(r => r.test(block('P'))), true);
  // SAVED AND REOPENED: the repairs and the originals travel, the cash with them
  const B2 = boot({ html: B.ev('buildSavedHtml()') });
  const fixN = `Object.keys(S.awards).filter(function(id){ return S.awards[id] && S.awards[id].fix; }).length`;
  chk(name, 'save and reopen', 'every repaired award, its mark and its original come back exactly',
    B2.ev(`JSON.stringify(S.awards)+' '+${fixN}`), B.ev(`JSON.stringify(S.awards)`) + ' ' + fixed.length);
  chk(name, 'save and reopen', 'and so does every service’s cash', B2.ev(`JSON.stringify(crData(null).map(function(b){ return Math.round(b.win[0])+'/'+Math.round(b.nodate); }))`),
    JSON.stringify([sum(0) + '/' + uns(0), sum(1) + '/' + uns(1)]));
  // CHECKED: off the list, its marks cleared, the original still kept -- and it stays checked
  w3try(B2.ev, `awdFixOk('W'); 'ok'`);
  const B3 = boot({ html: B2.ev('buildSavedHtml()') });
  chk(name, 'checked', 'a person marking it checked takes it off Needs attention for good, and the original stays',
    w3try(B3.ev, `JSON.stringify([attLists().awfix.some(function(x){ return x.id==='W'; }), S.awards.W.fix.ok, S.awards.W.inc[0].fx||'', S.awards.W.fix.orig])`),
    JSON.stringify([false, true, '', JSON.stringify(V.find(v => v[0] === 'W')[2])]));
  // EDITED BY HAND: an award block setter that replaces the award carries the record as it was saved across --
  // switching to one date, dating an award that had none, and clearing one
  w3try(B3.ev, `toggleAwdInc('X'); setAwdDateFull('S','2026-12-10'); setAwdDateFull('D',''); 'ok'`);
  const origOf = id => JSON.stringify(V.find(v => v[0] === id)[2]);
  chk(name, 'edited', 'each keeps the record as it was saved',
    w3try(B3.ev, `JSON.stringify(['X','S','D'].map(function(id){ var a=S.awards[id]||{}; return [a.mode, a.d||'', (a.fix||{}).orig||'LOST']; }))`),
    JSON.stringify([['single', '2026-10', origOf('X')], ['single', '2026-12', origOf('S')], ['single', '', origOf('D')]]));
  // EXPORTS take the new field as data: the workbooks still build
  chk(name, 'exports', 'control — the spend plan and board workbooks build on the repaired board',
    B3.ev(`(function(){ var n=0, _B=window.Blob; window.Blob=function(p,o){ n++; return new _B(p,o); };
      try{ exportPlans(); exportCSV(); }catch(e){ window.Blob=_B; return 'THREW '+e.message; } window.Blob=_B; return n>=2? 'built' : 'none'; })()`), 'built');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  w3Release(__bm);
  await w3Settle();
})();
// A LIST OF AWARDS THAT IS NOT A LIST no longer stops the board opening: v1.94 threw in applyState, and the board
// came up with nothing drawn
await (async () => {
  const __bm = w3Mark();
  const name = 'v1.95 W3 — an award list that is not a list never stops a board opening (item 53)';
  try {
  const awards2 = { R: { mode: 'inc', inc: { 0: { d: '2026-10', day: 5, sv: [1000000, 2000000] } } }, Z: { mode: 'inc', inc: 'x' } };
  const C = boot({ html: w3saved([w3bit('R', [1000000, 2000000]), w3bit('Z', [1000000, 2000000])], awards2) });
  chk(name, 'not a list', 'a board whose award lists are not lists opens, with no script error and every row drawn',
    JSON.stringify(C.errors) + ' ' + w3try(C.ev, `S.order.length+' '+DATA.items.length`), '[] 2 2');
  chk(name, 'not a list', 'each is flagged NEEDS REPAIR, its original kept whole',
    w3try(C.ev, `JSON.stringify(['R','Z'].map(function(id){ var f=S.awards[id].fix||{}; return f.how+' '+(f.orig===JSON.stringify(${JSON.stringify(awards2)}[id])); }))`),
    JSON.stringify(['repair true', 'repair true']));
  chk(name, 'not a list', 'and their cash is UNSCHEDULED, by service', w3try(C.ev, `JSON.stringify(crData(null).map(function(b){ return Math.round(b.win[0])+'/'+Math.round(b.nodate); }))`),
    JSON.stringify(['0/2000000', '0/4000000']));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  w3Release(__bm);
  await w3Settle();
})();
// A SERVICE ADDED to a board's own service list (a board whose services are its own, not its data's)
await (async () => {
  const __bm = w3Mark();
  const name = 'v1.95 W3 — a service added to the list keeps every award’s dollars in place (item 53)';
  try {
  // an award's dollars keep their places, the new service a zero beside them -- the way every other per-service list
  // is refitted; v1.94 gave every award of the old width zeroes
  const G = boot(); seed(G.ev, { services: ['USAF', 'USN'], items: [w3bit('A', [1000000, 2000000])], disc: [5000000, 5000000], mand: [0, 0], order: ['A'] });
  G.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S);
    S.awards.A={mode:'inc', inc:[{d:'2026-10', day:5, sv:[1000000,2000000]}]}; svcSaveList(SVC.concat(['ANG'])); 'ok'`);
  chk(name, 'a service added', 'an award keeps USAF $1,000,000 and USN $2,000,000, ANG $0, and nothing is marked repaired',
    G.ev(`JSON.stringify([SVC, S.awards.A.inc[0].sv, !!S.awards.A.fix])`), JSON.stringify([['USAF', 'USN', 'ANG'], [1000000, 2000000, 0], false]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  w3Release(__bm);
  await w3Settle();
})();
// ==== end W3 ====

// ==== v1.95 W4: journal by year, PMO drill and PMO by year (items 54, 55) ====
// v1.95, ITEM 55 (review R05): THE PMO DRILL USES THE BOARD'S OWN ALLOCATION.
// Spruills › By PMO › one PMO › in detail worked each requirement's allocation out with a rule of its
// own (allocVecFor): a directed split read as the full ask, an odd dollar was divided into cents, a
// forced unfunded row counted as allocated, so PMO AV's Controls read $258.00M where the board said
// $138.00M. Every other year was read with the year on screen's PMOs and asks, and an added
// requirement was counted twice. The PRIMES→PSM roll-up applied on Board budgets and not on a cycle
// locked from the same plan. The oracle below is the scenario's own arithmetic, written out by hand,
// and the year's projection (cycProjOf through aceWithYear -- what a lock takes) is held to it too.
const { bootMark: _w4Mark, bootRelease: _w4Release, settleBoards: _w4Settle } = await import('./boot.mjs');
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = _w4Mark();
  const name = 'v1.95 — the PMO drill uses the board’s own allocation';
  try {
  const J = JSON.stringify, M = 1e6;
  const { ev, errors } = boot();
  seed(ev, { services: ['USAF', 'ANG'],
    items: [it('SPLIT', 'AV', [100 * M, 100 * M]), it('ODD', 'AV', [100, 100]), it('UNEQ', 'AV', [70, 30]),
            it('OVER', 'AV', [100, 100]), it('ZERO', 'AV', [0, 0]), it('UFR', 'AV', [40 * M, 10 * M]),
            it('MOVE', 'AV', [5 * M, 3 * M]), it('STAY', 'TSS', [7 * M, 2 * M]),
            it('PRM', 'PRIMES', [20 * M, 4 * M], { title: 'LM Air Vehicle Annualized Sustainment (made up)' }),
            it('PSMX', 'PSM', [2 * M, 1 * M])],
    disc: [1000 * M, 1000 * M], mand: [1000 * M, 1000 * M],
    order: ['SPLIT', 'ODD', 'UNEQ', 'OVER', 'ZERO', 'UFR', 'MOVE', 'STAY', 'PRM', 'PSMX'] });
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); MS.years[MS.cur]=S; save(); 'ok'`);
  const cur = +ev('MS.cur'), Y = [cur, cur + 1];
  // every edit through the board's own editors
  ev(`setFsrc('SPLIT','split'); setFsrcSvc('SPLIT','d',0,'60000000'); setFsrcSvc('SPLIT','d',1,'0');
      setFsrcSvc('SPLIT','m',0,'0'); setFsrcSvc('SPLIT','m',1,'20000000');
      setAlloc('ODD','101'); setAlloc('UNEQ','101'); setAlloc('ZERO','101'); setAlloc('PRM','23999999');
      setSvc('OVER',0,'150'); setSvc('OVER',1,'10'); setFsrc('UFR','ufr'); 'ok'`);
  ev(`switchYear(${cur + 1}); setGrp('MOVE','TSS'); switchYear(${cur}); 'ok'`);          // FY+1 rolled forward; MOVE moves there only
  // v2.07 (item 121): added through the one writer the Add box ends in, with what the strip wrote: a title, an event, the value
  ev(`render(); reqCreate('AV', {title:'ADDED', event:'e', ask:[9000000, 1000000]}); save(); render(); 'ok'`);
  const nid = ev('S.custom[S.custom.length-1].id');
  ev(`yearCopy(${J(nid)}, ${cur + 1}, 'c'); save(); setAsk('STAY',0,'8000000'); 'ok'`);  // the year on screen's ask only
  // THE TRUTH, by hand: [USAF, ANG] allocated and asked, per PMO, per year. PRM is a prime under
  // PRIMES and rolls up to PSM in the Spruills; its 23,999,999 is apportioned whole as [19,999,999, 4,000,000].
  const want = {
    [cur]: { AV: { alloc: [74000323, 24000140], ask: [154000270, 114000230] }, TSS: { alloc: [8 * M, 2 * M], ask: [8 * M, 2 * M] },
             PSM: { alloc: [21999999, 5000000], ask: [22 * M, 5 * M] } },
    [cur + 1]: { AV: { alloc: [69000323, 21000140], ask: [149000270, 111000230] }, TSS: { alloc: [12 * M, 5 * M], ask: [12 * M, 5 * M] },
                 PSM: { alloc: [21999999, 5000000], ask: [22 * M, 5 * M] } },
  };
  // CONTROL (passes on v1.94 too): the year's projection -- the lock's engine -- is the hand arithmetic
  const proj = y => JSON.parse(ev(`JSON.stringify(aceWithYear(${y}, function(){ return cycProjOf().reqs.map(function(r){
      var x=itemById(r.id); return {grp:r.grp, rec:x? x.title : '', ask:r.ask, alloc:r.alloc}; }); }))`));
  const byPmo = rows => { const o = {}; rows.forEach(r => { const g = (r.grp === 'PRIMES' && /Annualized Sustainment/.test(r.rec)) ? 'PSM' : r.grp;
    o[g] ||= { alloc: [0, 0], ask: [0, 0] }; [0, 1].forEach(i => { o[g].alloc[i] += r.alloc[i]; o[g].ask[i] += r.ask[i]; }); }); return o; };
  const P = { [cur]: byPmo(proj(cur)), [cur + 1]: byPmo(proj(cur + 1)) };
  chk(name, 'control', 'CONTROL — each year’s projection by PMO is the hand arithmetic (passes on v1.94: the projection is not what changed)',
    J(Y.map(y => ['AV', 'TSS', 'PSM'].map(g => P[y][g]))), J(Y.map(y => ['AV', 'TSS', 'PSM'].map(g => want[y][g]))));
  // THE DRILL, on Board budgets, from the board's own requirements
  ev(`spAce='board'; spFund='board'; 'ok'`);
  const drill = g => JSON.parse(ev(`JSON.stringify(pmoDetail(${J(g)}, ${J(Y)}).filter(function(b){ return b.name===APPN; })[0])`));
  const read = (D, k) => Y.map(y => ['USAF', 'ANG'].map(sv => (D[k][sv] || {})[y]));
  const D = { AV: drill('AV'), TSS: drill('TSS'), PSM: drill('PSM'), PRIMES: drill('PRIMES') };
  chk(name, 'AV', 'Controls, each year: the split as split, odd dollars whole, unequal and zero asks, the override, the forced UFR as nothing, the added requirement once',
    J(read(D.AV, 'ctl')), J(Y.map(y => want[y].AV.alloc)));
  chk(name, 'AV', 'Requirement, each year: that year’s own asks, the added requirement once', J(read(D.AV, 'req')), J(Y.map(y => want[y].AV.ask)));
  chk(name, 'TSS', 'a PMO moved in one year: FY+1 holds it, the year on screen does not; each year’s own ask',
    J([read(D.TSS, 'ctl'), read(D.TSS, 'req')]), J([Y.map(y => want[y].TSS.alloc), Y.map(y => want[y].TSS.ask)]));
  chk(name, 'PSM', 'the prime under PRIMES rolls up to PSM, apportioned whole',
    J([read(D.PSM, 'ctl'), read(D.PRIMES, 'ctl')]), J([Y.map(y => want[y].PSM.alloc), Y.map(() => [undefined, undefined])]));
  const all = ['AV', 'TSS', 'PSM'].flatMap(g => ['req', 'bud', 'ctl'].flatMap(k => read(D[g], k).flat()));
  chk(name, 'whole dollars', 'every figure the drill holds is an integer', all.filter(v => !Number.isInteger(v)).length + ' of ' + all.length, '0 of ' + all.length);
  // BOARD BUDGETS AND A CYCLE LOCKED FROM THE SAME PLAN PRINT THE SAME CONTROLS
  ev(`blCyc='PB'; blYr=MS.cur; blNote=''; cycLock(); 'ok'`);
  ev(`spFund='bl|PB|${cur}'; 'ok'`);
  const L = { AV: drill('AV'), TSS: drill('TSS'), PSM: drill('PSM') };
  chk(name, 'the same plan locked', 'a cycle locked from this plan gives every PMO, every year, the Board budgets Controls',
    J(['AV', 'TSS', 'PSM'].map(g => read(L[g], 'ctl'))), J(['AV', 'TSS', 'PSM'].map(g => Y.map(y => want[y][g].alloc))));
  const screen = (fund, g) => ev(`(function(){ spOpen=true; spBy='pmo'; spPmo=${J(g)}; spFund=${J(fund)}; spAce='board'; spDrillSvc='ALL'; spBody();
      var r=document.querySelector('#spBody .pmoblk tr.lctl'); return r? [].slice.call(r.cells).slice(1,3).map(function(c){ return c.textContent.trim(); }).join(' | ') : '(no drill)'; })()`);
  const fm = v => ev(`fM2(${v})`);
  chk(name, 'on screen', 'the drill prints the same Controls from Board budgets and from the lock, and they are the board’s',
    ['AV', 'PSM'].map(g => screen('board', g) + ' / ' + screen('bl|PB|' + cur, g)).join(' ; '),
    ['AV', 'PSM'].map(g => { const s = Y.map(y => fm(want[y][g].alloc[0] + want[y][g].alloc[1])).join(' | '); return s + ' / ' + s; }).join(' ; '));
  // THE SPRUILLS TABLE ABOVE THE DRILL: each year's own requirements, each once, under that year's PMO
  ev(`spFund='board'; spPmo='ALL'; 'ok'`);
  const G = JSON.parse(ev(`JSON.stringify(spGather().blocks.filter(function(b){ return b.name===APPN; })[0])`));
  const tot = y => ['AV', 'TSS', 'PSM'].reduce((a, g) => a + want[y][g].ask[0] + want[y][g].ask[1], 0);
  chk(name, 'Spruills', 'Total Requirements and the rows by PMO, each year: the added requirement once, each year’s own ask and PMO',
    J(Y.map(y => [G.req[y], ['AV', 'TSS', 'PSM', 'PRIMES'].map(g => (G.rows[g] || {})[y])])),
    J(Y.map(y => [tot(y), ['AV', 'TSS', 'PSM'].map(g => want[y][g].ask[0] + want[y][g].ask[1]).concat([undefined])])));
  if (errors.length) chk(name, 'jsdom', 'no script errors', errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  _w4Release(__bm, []);
  await _w4Settle();
})();

// The PMO drill reads ANOTHER appropriation's requirements from that appropriation's own year state
// (its PMO, its added requirements once), and does not work out its allocation: the lane engine runs
// on one appropriation per page, so its Controls are left unknown and the totals across
// appropriations are not added up as if they were nothing. On v1.94 the drill filed Full Fund's added
// requirement under the PMO O&M's own state gave a requirement that happened to share its id.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = _w4Mark();
  const name = 'v1.95 — the PMO drill reads another appropriation from its own state';
  try {
  const J = JSON.stringify, M = 1e6;
  const ff = { base: 2027, cur: 2027, ts: 1, years: { 2027: {
    order: ['NEW-1'], alloc: {}, mc: {}, fsrc: {}, removed: [], discSvc: [50 * M, 50 * M], mandSvc: [0, 0],
    custom: [{ id: 'NEW-1', grp: 'AV', sect: 'new', custom: true, title: 'FF added (made up)', event: 'e', ccar: '',
               fy26: [0, 0], ask: [4 * M, 1 * M], alloc: null }] } } };
  const { ev } = boot({ ls: { prio27ff: J(ff), prio27who: 'alice' } });
  seed(ev, { services: ['USAF', 'ANG'], items: [it('A', 'AV', [10 * M, 10 * M])], disc: [100 * M, 100 * M], mand: [0, 0], order: ['A'] });
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); MS.years[MS.cur]=S; save(); 'ok'`);
  // O&M adds its own NEW-1 and moves it to TSS: the ids collide, the states do not
  // v2.07 (item 121): through the one writer the Add box ends in, with what the strip wrote
  ev(`render(); reqCreate('AV', {title:'OM added', event:'e', ask:[2000000, 0]}); save(); render(); setGrp('NEW-1','TSS');
      spAce='board'; spFund='board'; 'ok'`);
  const cur = +ev('MS.cur');
  const blk = (g, n) => JSON.parse(ev(`JSON.stringify(pmoDetail(${J(g)}, [MS.cur]).filter(function(b){ return b.name===${J(n)}; })[0]||null)`));
  const two = (b, k) => b ? ['USAF', 'ANG'].map(sv => (b[k][sv] || {})[cur]) : null;
  chk(name, 'Full Fund', 'its added requirement is under the PMO its own state gives (AV), once; its Controls are not guessed',
    J([two(blk('AV', 'FULL FUND'), 'req'), two(blk('AV', 'FULL FUND'), 'ctl'), two(blk('TSS', 'FULL FUND'), 'req')]),
    J([[4 * M, 1 * M], [null, null], [null, null]]));
  chk(name, 'O&M', 'O&M’s own added requirement is in TSS once, with its allocation', J([two(blk('TSS', 'O&M'), 'req'), two(blk('TSS', 'O&M'), 'ctl')]),
    J([[2 * M, 0], [2 * M, 0]]));
  const G = JSON.parse(ev(`(function(){ spBy='pmo'; return JSON.stringify(spGather().blocks.filter(function(b){ return b.name==='FULL FUND'; })[0].rows); })()`));
  chk(name, 'Spruills', 'the Full Fund block files it under AV, once', J(G), J({ AV: { [cur]: 5 * M } }));
  const scr = ev(`(function(){ spOpen=true; spBy='pmo'; spPmo='AV'; spFund='board'; spAce='board'; spDrillSvc='ALL'; spBody();
      var el=document.getElementById('spBody'), b=[].slice.call(el.querySelectorAll('.pmoblk'));
      var grand=b[b.length-1], ctl=grand? grand.querySelector('tr.lctl') : null, del=grand? grand.querySelector('tr.ldel') : null;
      var cell=function(r){ return r? r.cells[1].textContent.trim() : '(none)'; };
      return JSON.stringify([cell(ctl), cell(del), /FULL FUND holds AV requirements/.test(el.textContent)]); })()`);
  chk(name, 'on screen', 'across appropriations, the year Full Fund holds AV has no total Control or Delta, and the drill says why',
    scr, J(['—', '—', true]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  _w4Release(__bm, []);
  await _w4Settle();
})();
// ==== end W4 ====

// ==== v1.96 (item 65): long menus fold by the job ====
// Brad, 4 Oct 2026: "The list of selectable items is long. I need them grouped together in a meaningful way ... open to
// dropdowns within dropdowns". Decided: groups open in place under their heading, one at a time per menu, the last one
// remembered in this browser; one home for each action; a Find box in Reports & exports. Every check here fails on v1.95,
// where Reports & exports opened 25 items flat, Setup 19, File 15 and Filter 13.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = _w4Mark();
  const name = 'v1.96 — a long menu folds by the job, one group open at a time (item 65)';
  try {
  const J = JSON.stringify;
  const { ev } = boot();
  seed(ev, { services: ['USAF', 'ANG'], items: [it('A', 'AV', [500, 100]), it('B', 'PSM', [300, 50])],
             disc: [600, 120], mand: [100, 20], order: ['A', 'B'] });
  // v2.00 (menu, 19 Oct): Brad: "Move every top-right menu into the left menu, and remove every duplicate, so each action has
  // exactly one home." Reports & exports, Data and Setup are the left menu's now, and the File menu's items went each to one
  // place there. What a person sees as each opens, what each holds, one home for each action, the folding that stays (Setup,
  // Filter) and Find, are held here against those places: Reports & exports a box with its groups side by side (dd_reports),
  // Data a box of cards (dd_data), Setup a flyout that still folds (dd_setup), Program offices, Audit, Save's ▾ and Imports &
  // exports (dd_offices, dd_audit, dd_save, dd_boards).
  // What a person sees when a menu opens: every item, heading and box not folded away (or, in the box, found by Find).
  const shown = k => J(JSON.parse(ev(`(function(){ openMenu=${J(k)}; syncBtns(); const dd=document.getElementById('dd_'+${J(k)});
      return JSON.stringify([].slice.call(dd.querySelectorAll('.mi, .gh, input')).filter(function(e){
        const g=e.closest('.gbody'), x=e.closest('.uiRs'); return !e.hidden && !(g && g.hidden) && !(x && x.hidden); }).length); })()`)));
  ev(`menuGrpOpen={}; menuFindQ=''; openMenu=null; 'ok'`);
  // v2.02: the ATR/BTR log export and the Execution & reprogramming section went with the tracker (18 -> 17)
  // v2.03 (item 105): the Filter menu's "☰ By-service detail on every row" went with the card leftovers -- only the card's rows read it (3 -> 2)
  chk(name, 'rows', 'opened with nothing unfolded: Reports & exports 20 (Find, Pre-flight and the eighteen reports and exports, side by side -- v2.04 added the three AI review entries), Setup 6 (three groups, Live view, Save diagnostics, Clear this computer -- v2.04), Filter 2, the year 9, Data 8, Program offices 4, Audit 4, Save’s ▾ 1, Imports & exports 5',
    // v2.05 (item 114): 15 -- the deck, the synopsis and Executive decision removed, and the companion tool a link at the box's foot
    // v2.12 W1: Data 8 -- the Annual Cost Estimate card gains the import report (item 132)
    J(['reports', 'setup', 'view', 'fy', 'data', 'offices', 'audit', 'save', 'boards'].map(shown)), J(['15', '6', '2', '9', '8', '4', '4', '1', '5']));
  const heads = k => JSON.parse(ev(`(function(){ openMenu=${J(k)}; syncBtns();
      return JSON.stringify([].slice.call(document.querySelectorAll('#dd_'+${J(k)}+' .gh')).map(function(h){
        return h.querySelector('span:nth-child(2)').textContent; })); })()`));
  const secs = k => JSON.parse(ev(`(function(){ syncBtns(); return JSON.stringify([].slice.call(document.querySelectorAll('#dd_'+${J(k)}+' .uiRs h4, #dd_'+${J(k)}+' .uiDc h4'))
      .map(function(h){ return h.textContent; })); })()`));
  // v2.05 (item 114): two lists -- Working Documents (Briefing, renamed), Spend Plan & Cash with its year beside it, Five Years &
  // PPBE; then CCaR & Accounting Files and AI Review, advisory only. Companion tools is the box's foot.
  chk(name, 'groups', 'Reports & exports is grouped by the job, in two lists, nothing folded', J([secs('reports'), heads('reports')]),
    J([['Working Documents', 'Spend Plan & Cash ' + ev('FYL()'), 'Five Years & PPBE', 'CCaR & Accounting Files', 'AI Review advisory only'], []]));
  chk(name, 'groups', 'Setup and Filter fold', J([heads('setup'), heads('view')]),
    J([['Who and where', 'Codes and structure', 'Appearance — yours only'], ['Funding', 'Service — funded requirements only']]));
  chk(name, 'groups', 'Data is a card for each source', J(secs('data')), J(['Execution — CCaR QPE', 'CCaR records', 'Annual Cost Estimate', 'Budget extract (BAE)']));
  // Each group holds exactly what was decided, read off what its items call.
  // String.raw: a template literal would eat the regular expressions' backslashes
  const callOf = String.raw`function(e){
        const a=e.getAttribute('onclick')||''; const m=/mRun\(\s*([A-Za-z0-9_]+)\s*\)/.exec(a) || /getElementById\('([A-Za-z]+)'\)\.click/.exec(a)
          || /mRun\(function\(\)\{\s*([A-Za-z]+)\(/.exec(a) || /mRun\(\(\)=>\{\s*([A-Za-z]+)\(/.exec(a) || /^uiFlyClose\(\);mRun\(([A-Za-z0-9_]+)\)$/.exec(a)
          || /^(uiPmoLoad\('[a-z]+'\))$/.exec(a); return m? m[1] : a.slice(0,30); }`;
  const calls = (k, g) => JSON.parse(ev(`(function(){ syncBtns(); const b=document.getElementById('mg_'+${J(k)}+'_'+${J(g)}); if(!b) return '[]';
      return JSON.stringify([].slice.call(b.querySelectorAll('.mi')).map(${callOf})); })()`));
  const callsIn = sel => JSON.parse(ev(`(function(){ syncBtns(); return JSON.stringify([].slice.call(document.querySelectorAll(${J(sel)})).map(${callOf})); })()`));
  const flyCalls = k => JSON.parse(ev(`(function(){ const d=document.createElement('div'); d.innerHTML=uiFlyItems(${J(k)});
      return JSON.stringify([].slice.call(d.querySelectorAll('button[onclick]')).map(${callOf})); })()`));
  // v2.10 A: the foot names FYDP Disconnects among the FYDP views (item 130)
  chk(name, 'contents', 'Spend plan & cash: Two Spend Plans and the CR Cash Return (1A9A); the forecast and CR Cash Needs are views, and the box’s foot says where each view lives',
    J([callsIn('#dd_reports .uiRs[data-g="spend"] .mi'), /CR Cash Needs under Execution ▸; the five-year spend plan, PPBE Budget Positions, Spruills and FYDP Disconnects under FYDP ▸/.test(ev(`document.querySelector('#dd_reports .uiRfoot').textContent`))]),
    J([['togglePlans', 'crExport'], true]));
  // v2.05 (item 114; Brad, 23 Oct 2026): Briefing is Working Documents, without the deck, the synopsis and Executive decision; the
  // companion tool is a link at the foot, and changing it is a setting, under Setup › Who and where
  chk(name, 'contents', 'Working Documents, Five Years & PPBE, CCaR & Accounting Files; no Execution & reprogramming section and no Companion tools section',
    J(['brief', 'fydp', 'exec', 'ccar', 'tools'].map(g => callsIn(`#dd_reports .uiRs[data-g="${g}"] .mi`))),
    J([['exportExcel', 'exportCSV'], ['fydpPickExport', 'exportCycCompare'],
       [], ['exportSrc', 'toggleIds', 'exportCoa', 'exportAceTieout'], []]));
  chk(name, 'contents', 'the companion tool is the link at the box’s foot, and Linked tool… is under Setup › Who and where',
    J([callsIn('#dd_reports .uiRfoot button'), calls('setup', 'who').includes('linkSet')]), J([['linkOpen'], true]));
  chk(name, 'contents', 'the sections, in order: Working Documents, Spend Plan & Cash (the year beside it), Five Years & PPBE, CCaR & Accounting Files, AI Review (advisory only)',
    ev(`(function(){ syncBtns(); return [].slice.call(document.querySelectorAll('#dd_reports .uiRs h4')).map(function(h){ return h.textContent.replace(/\\s+/g,' ').trim(); }).join(' | '); })()`),
    'Working Documents | Spend Plan & Cash ' + ev('FYL()') + ' | Five Years & PPBE | CCaR & Accounting Files | AI Review advisory only');
  // v2.05 (item 114; Brad, 23 Oct 2026: "Leave the icons off. They're non value added"): no item in the left menu's boxes and side
  // panels starts with an icon -- read off what each list holds, every folded group included (the browser check G does it as drawn)
  chk(name, 'contents', 'no item on the left menu starts with an icon (a tick, ● and ○ for the theme in use are not icons)',
    ev(`(function(){ _keptMeta={t:1790000000000, why:'folder', by:'K Jones'}; syncBtns(); var bad=[];
      ['dd_reports','dd_data','dd_setup','dd_offices','dd_audit','dd_kept','dd_save','dd_boards'].forEach(function(k){
        [].slice.call(document.querySelectorAll('#'+k+' button.mi')).forEach(function(b){
          var x=b.querySelector(':scope > b'), t=x? x.textContent : [].slice.call(b.childNodes).filter(function(n){ return n.nodeType===3; }).map(function(n){ return n.textContent; }).join('');
          if(/^(?:(?![●○$])[^\\p{L}\\p{N}\\s"'“(])+\\s/u.test(t.trim()+' ')) bad.push(k+': '+t.trim().slice(0,30)); }); });
      ['fydp','exec','hist'].forEach(function(k){ var d=document.createElement('div'); d.innerHTML=uiFlyItems(k);
        [].slice.call(d.querySelectorAll('button')).forEach(function(b){ var t=[].slice.call(b.childNodes).filter(function(n){ return n.nodeType===3; }).map(function(n){ return n.textContent; }).join('');
          if(/^(?:(?![●○$])[^\\p{L}\\p{N}\\s"'“(])+\\s/u.test(t.trim()+' ')) bad.push(k+': '+t.trim().slice(0,30)); }); });
      _keptMeta=null; syncBtns(); return JSON.stringify(bad); })()`), '[]');
  chk(name, 'contents', 'every report: a title in title case with no icon, and the kind of file it gives on a tag',
    ev(`(function(){ syncBtns(); return [].slice.call(document.querySelectorAll('#dd_reports .mi.ri')).map(function(b){
      var t=[].slice.call(b.childNodes).filter(function(n){ return n.nodeType===3; }).map(function(n){ return n.textContent; }).join('').trim();
      return t+' ['+((b.querySelector('.fmt')||{}).textContent||'')+']'; }).join(' | '); })()`),
    'Excel Workbook [XLSX] | Priority Drill By Band… [XLSX] | Two Spend Plans… [VIEW] | CR Cash Return (1A9A) [XLSX] | FYDP Spend Plan… [XLSX] | Cycle Comparison [XLSX] | '
    + 'Spend Plan Source [XLSX] | IDS Batch Import… [XLSX] | Chart Of Accounts [XLSX] | ACE Tie-Out [XLSX] | Export For GenAI.mil… [TXT] | Import The Answer… [READ] | Review List [VIEW]');
  // v2.10 A: FYDP Disconnects is a FYDP view, beside the Spruills (item 130)
  // v2.12 W3: Fit to the PPBE position (item 134) is a FYDP view, after PPBE Budget Positions
  chk(name, 'contents', 'the views, one home each on the left menu: FYDP ▸ and Execution ▸',
    J([flyCalls('fydp'), flyCalls('exec')]),
    J([['toggleFydp', 'toggleSp', 'toggleFdc', 'toggleP2', 'toggleFit', 'toggleFlow'], ['toggleEx', 'toggleFc', 'toggleCr', 'toggleQpe', 'toggleDiv']]));
  chk(name, 'contents', 'what the File menu held, each in one place: Program offices; Audit; Imports & exports; Save’s ▾; Live view and Save diagnostics under Setup',
    J([callsIn('#dd_offices .mi'), callsIn('#dd_audit .mi'), callsIn('#dd_boards .mi'), callsIn('#dd_save .mi'), callsIn('#dd_setup > .mi')]),
    J([['publishPmoCopy', 'subOpenReview', "uiPmoLoad('one')", "uiPmoLoad('all')"], ['toggleJrnl', 'showLog', 'takePen', 'whoAmI'],
       ['fullFile', 'stateFile', 'multiFile', 'exportOneAppn', 'togglePkg'], ['publishState'], ['toggleLive', 'toggleDiag', 'clearComputer']]));
  chk(name, 'contents', 'Setup: Who and where; Appearance holds the five themes and three densities',
    J([calls('setup', 'who'), calls('setup', 'look').length]), J([['toggleSvcPanel', 'togglePmo', 'toggleEnt', 'linkSet'], 8]));   // v2.05 (item 114): Linked tool…
  // ONE HOME FOR EACH ACTION: on v1.95 Set base year and Reset were on two menus, realignment and WBS under Setup. Every list a
  // menu or the left menu draws is searched.
  const homes = ev(`(function(){ syncBtns(); const out={};
      const lists=[].slice.call(document.querySelectorAll('.menu[id^="m_"] .mdd')).concat(['dd_reports','dd_data','dd_setup','dd_boards','dd_offices','dd_audit','dd_kept','dd_save']
        .map(function(id){ return document.getElementById(id); }).filter(Boolean));
      ['fydp','exec','hist'].forEach(function(k){ const d=document.createElement('div'); d.id='fly_'+k; d.innerHTML=uiFlyItems(k); lists.push(d); });
      ['setBaseYear','resetYear','toggleRlg','toggleExw'].forEach(function(f){ out[f]=[];
        lists.forEach(function(dd){
          if([].slice.call(dd.querySelectorAll('button')).some(function(e){ return (e.getAttribute('onclick')||'').indexOf(f)>=0; })) out[f].push(dd.id); }); });
      return JSON.stringify(out); })()`);
  chk(name, 'one home', 'Set base year, Reset and Funding realignment on the year menu only; WBS from execution data under Data only', homes,
    J({ setBaseYear: ['dd_fy'], resetYear: ['dd_fy'], toggleRlg: ['dd_fy'], toggleExw: ['dd_data'] }));
  // ONE AT A TIME, a heading that says so, and its count -- in Setup, the left menu's list that folds
  const state = k => ev(`(function(){ return JSON.stringify([].slice.call(document.querySelectorAll('#dd_'+${J(k)}+' .gh')).map(function(h){
      const b=document.getElementById(h.getAttribute('aria-controls'));
      return [h.getAttribute('data-g'), h.tagName, h.getAttribute('aria-expanded'), !!b && !b.hidden, +h.querySelector('.gn').textContent===(b? b.querySelectorAll('.mi').length : -1)]; })); })()`);
  ev(`menuGrp('setup','who'); 'ok'`);
  const s1 = JSON.parse(state('setup'));
  ev(`menuGrp('setup','codes'); 'ok'`);
  const s2 = JSON.parse(state('setup'));
  chk(name, 'one at a time', 'opening Codes and structure closes Who and where; each heading is a button whose aria-expanded and count match its group',
    J([s1.filter(x => x[2] === 'true').map(x => x[0]), s2.filter(x => x[2] === 'true').map(x => x[0]),
       s2.every(x => x[1] === 'BUTTON' && x[4] && (x[2] === 'true') === x[3])]), J([['who'], ['codes'], true]));
  ev(`menuGrp('setup','codes'); 'ok'`);
  chk(name, 'one at a time', 'pressed again, the open group folds', J(JSON.parse(state('setup')).filter(x => x[2] === 'true').length), '0');
  // REMEMBERED IN THIS BROWSER, NEVER IN THE FILE
  ev(`menuGrp('setup','codes'); 'ok'`);
  const stored = ev(`localStorage.getItem('spmtMenuGroups')`);
  const saved = ev(`buildSavedHtml()`);
  const B = boot({ ls: { spmtMenuGroups: J({ setup: 'look', view: 'svc' }) } });
  seed(B.ev, { services: ['USAF', 'ANG'], items: [it('A', 'AV', [500, 100])], disc: [600, 120], mand: [100, 20], order: ['A'] });
  const back = B.ev(`(function(){ syncBtns(); const s=document.getElementById('mg_setup_look');
      openMenu='view'; syncBtns(); const r=document.getElementById('mg_view_svc');
      return JSON.stringify([!!s && !s.hidden, !!r && !r.hidden]); })()`);
  chk(name, 'remembered', 'the open group is kept in this browser and a board opened later opens on it; the saved file does not carry it',
    J([JSON.parse(stored || '{}').setup, back, saved.indexOf('"setup":"codes"') < 0]), J(['codes', '[true,true]', true]));
  // FIND in Reports & exports, the box on the left menu
  const find = q => JSON.parse(ev(`(function(){ uiRepOpen(); menuFind(${J(q)});
      const dd=document.getElementById('dd_reports');
      const vis=[].slice.call(dd.querySelectorAll('.mi')).filter(function(e){ const x=e.closest('.uiRs'); return !e.hidden && !(x && x.hidden); });
      const none=dd.querySelector('.mnone');
      return JSON.stringify({ n: vis.length, groups: vis.map(function(e){ const x=e.closest('.uiRs'); return x? x.getAttribute('data-g') : 'top'; })
        .filter(function(v,i,a){ return a.indexOf(v)===i; }), none: !!none && !none.hidden,
        lines: [].slice.call(dd.querySelectorAll('.uiRfoot .uiRsV.found')).map(function(){ return 'foot'; }) }); })()`));   // v2.05 (item 114): the foot
  const fx = find('excel'), fc = find('cash'), fz = find('zzqq'), ff = find('cash needs');
  // v2.02: the ATR/BTR log (Excel), and its Execution & reprogramming group, went with the tracker (seven, four groups before)
  // v2.05 (item 114): "(Excel)" left the titles for the XLSX tag, and Find reads the tag's words -- so "excel" finds every workbook
  chk(name, 'Find', 'typing "excel" lists the nine workbooks, from four groups at once',
    J([fx.n, fx.groups, fx.none]), J([9, ['brief', 'spend', 'fydp', 'ccar'], false]));
  chk(name, 'Find', 'a group’s name finds all of its items; nothing matching says so', J([fc.n, fc.groups, fz.n, fz.none]), J([2, ['spend'], 0, true]));
  chk(name, 'Find', 'a view that lives on the left menu is found by the line that says where it is', J([ff.n, ff.lines, ff.none]), J([0, ['foot'], false]));
  const after = JSON.parse(ev(`(function(){ uiRepClose(); syncBtns(); uiRepOpen();
      const f=document.getElementById('mFind'); const r=JSON.stringify([f? f.value : null, menuFindQ]); uiRepClose(); return r; })()`));
  chk(name, 'Find', 'closing the box clears it', J(after), J(['', '']));
  chk(name, 'Find', 'and it is a labelled search box at the top of the box',
    ev(`(function(){ syncBtns(); const f=document.querySelector('#dd_reports > .uiRtop > input:first-child'); return JSON.stringify([f.tagName, f.type, f.getAttribute('aria-label')]); })()`),   // v2.05 (item 114): first in the box's top row, Pre-Flight Check beside it
    J(['INPUT', 'search', 'Find a report or export']));
  // FILTER: the group holding a filter that is on opens by itself, and the headings say what is on
  const auto = JSON.parse(ev(`(function(){ menuGrpOpen={}; laneFilter='unf'; mcOnly=false; svcFilter=-1; openMenu=null; toggleMenu('view');
      const a=menuGrpOpen.view, f=document.getElementById('mg_view_fund');
      laneFilter=''; svcFilter=1; openMenu=null; toggleMenu('view');
      const b=menuGrpOpen.view, now=[].slice.call(document.querySelectorAll('#dd_view .gh .now')).map(function(n){ return n.textContent; });
      const items=[].slice.call(document.querySelectorAll('#mg_view_svc .mi')).map(function(e){ return e.textContent.replace(/^✓/,''); });
      svcFilter=-1; openMenu=null; syncBtns(); return JSON.stringify([a, !!f && !f.hidden, b, now, items]); })()`));
  chk(name, 'Filter', 'a filter that is on opens its group; the Service heading names the service and its items are the services by name',
    J(auto), J(['fund', true, 'svc', ['', 'ANG'], ['Any service', 'USAF', 'ANG']]));
  // A HEADING IS PRESSED LIKE A BUTTON: the click stays in the menu (the menu is drawn again under it, and the page's own
  // click handler would otherwise read that as a click outside), and focus comes back to the heading. v2.00 (menu): in
  // Setup's flyout on the left menu, the list that folds there
  const clicked = JSON.parse(ev(`(function(){ menuGrpOpen={}; openMenu=null; syncBtns(); uiFlyOpen('setup', document.getElementById('uiNav_setup'));
      const h=document.querySelector('#uiFly .gh[data-g="codes"]'); h.focus();
      h.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}));
      const g=document.getElementById('mg_setup_codes'), a=document.activeElement;
      const r=JSON.stringify([UI2.fly, !!g && !g.hidden && document.getElementById('uiFly').contains(g), !!a && a.classList.contains('gh') && a.getAttribute('data-g')==='codes' && a.isConnected]);
      uiFlyClose(); return r; })()`));
  chk(name, 'pressed', 'a click on a heading keeps the flyout open, opens the group, and leaves focus on that heading', J(clicked), J(['setup', true, true]));
  // AN IMPORTED SERVICE NAME IS TEXT on the Service heading too (it says which service is chosen)
  const H = boot();
  seed(H.ev, { services: ['<img src=x id=pwnsvc>', 'ANG'], items: [it('A', 'AV', [500, 100])], disc: [600, 120], mand: [100, 20], order: ['A'] });
  chk(name, 'escaped', 'a service named with markup is shown as text on the Service heading and in its group',
    H.ev(`(function(){ svcFilter=0; openMenu='view'; syncBtns(); return JSON.stringify([!!document.getElementById('pwnsvc'),
      /<img/.test(document.querySelector('#dd_view .gh[data-g="svc"] .now').textContent)]); })()`), J([false, true]));
  chk(name, 'Setup', 'the Appearance heading says the theme and density in use',
    ev(`(function(){ openMenu='setup'; syncBtns(); return document.querySelector('#dd_setup .gh[data-g="look"] .now').textContent; })()`), 'Harbor · Comfortable');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  _w4Release(__bm, []);
  await _w4Settle();
})();
// ==== end v1.96 item 65 ====
// ==== v1.97 W1: money entry and the engine (items 72, 73, 74, 75) ====
// The 5 Oct review of v1.96, R01–R04. Every check here fails on v1.96 (SP/v197w/board196.html) unless it says
// CONTROL. Each figure a check wants is worked out from the fixture's own numbers, by hand in the comments, or is an
// identity (d + m + u == basis, the parts add to the whole); none is read back from the board's own helpers.
// Each read goes through w1ev, which turns a throw into the text of a failed check, so one missing function on an
// older board fails its own checks rather than ending the block.
const { bootMark: _w1Mark, bootRelease: _w1Release, settleBoards: _w1Settle } = await import('./boot.mjs');
const w1ev = (ev, code) => { try { return ev(code); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 120); } };
const w1json = (ev, code) => { const r = w1ev(ev, code); try { return JSON.parse(r); } catch { return r; } };

// v1.97 W1, ITEM 72 (review R01) was proved here through setBATot, the command bar's writer of a typed budget total. v2.03
// (item 104) removed the command bar and setBATot with it: nothing on the page could reach them. The base is typed per
// service (bmSetBase), which 'v1.97 — typed money...' below still holds to whole dollars.

// v1.97 W1, ITEM 73 (review R02): AN OLD-STYLE SPLIT FUNDS BOTH OF ITS LANES. A whole-requirement split ({m:'split', d, mnd}
// -- only older files carry one) spread D and M over the same basis independently; on a tie both took the same service
// and mandatory was clipped there. Every row still totalled, which hid it. THE ORACLE: each fixture's d, m and u per
// service, worked out by hand below from the rule as specified -- discretionary spread over the basis, mandatory over
// what discretionary leaves of each service, whole dollars by largest remainder (a tie to the first service), then each
// service's own lane caps -- and the identities that hold whatever the placement: where the lanes can pay, d totals D and
// m totals M exactly; d + m + u is the basis on every service.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = _w1Mark();
  const name = 'v1.97 — an old-style split funds both of its lanes (item 73)';
  try {
  const J = JSON.stringify;
  const { ev } = boot();
  const BIG = 1000;   // a lane that never runs dry here
  // [what, services, the requirement's ask (its basis), legacy {d, mnd}, disc lanes, mand lanes, want {d, m, u}, lanes pay in full?]
  const F = [
    ['a $1 + $1 split on [1, 1]', ['A', 'B'], [1, 1], { d: 1, mnd: 1 }, [BIG, BIG], [BIG, BIG],
      // D: 1 over [1,1] = .5/.5 -> the tie to A -> [1,0]. Left [0,1]; M: 1 over [0,1] -> [0,1].
      { d: [1, 0], m: [0, 1], u: [0, 0] }, true],
    ['odd: $5 + $5 on [5, 5]', ['A', 'B'], [5, 5], { d: 5, mnd: 5 }, [BIG, BIG], [BIG, BIG],
      // D: 2.5/2.5 -> [3,2]. Left [2,3]; M: 5 over [2,3] -> [2,3].
      { d: [3, 2], m: [2, 3], u: [0, 0] }, true],
    ['three tied services: $10 + $11 on [7, 7, 7]', ['A', 'B', 'C'], [7, 7, 7], { d: 10, mnd: 11 }, [BIG, BIG, BIG], [BIG, BIG, BIG],
      // D: 3.33 each -> [4,3,3]. Left [3,4,4] = 11; M: 11 over it -> [3,4,4].
      { d: [4, 3, 3], m: [3, 4, 4], u: [0, 0, 0] }, true],
    ['unequal: $3 + $3 on [3, 1, 2]', ['A', 'B', 'C'], [3, 1, 2], { d: 3, mnd: 3 }, [BIG, BIG, BIG], [BIG, BIG, BIG],
      // D: 1.5, .5, 1 -> floors [1,0,1], the dollar left to the first .5 -> [2,0,1]. Left [1,1,1]; M -> [1,1,1].
      { d: [2, 0, 1], m: [1, 1, 1], u: [0, 0, 0] }, true],
    ['the same, its services in reverse order: [2, 1, 3]', ['C', 'B', 'A'], [2, 1, 3], { d: 3, mnd: 3 }, [BIG, BIG, BIG], [BIG, BIG, BIG],
      // D: 1, .5, 1.5 -> floors [1,0,1], the dollar left to the first .5 (B) -> [1,1,1]. Left [1,0,2]; M -> [1,0,2].
      { d: [1, 1, 1], m: [1, 0, 2], u: [0, 0, 0] }, true],
    ['a service with no basis: $3 + $5 on [0, 4, 4]', ['A', 'B', 'C'], [0, 4, 4], { d: 3, mnd: 5 }, [BIG, BIG, BIG], [BIG, BIG, BIG],
      // D: 0, 1.5, 1.5 -> [0,2,1]. Left [0,2,3]; M: 5 over it -> [0,2,3].
      { d: [0, 2, 1], m: [0, 2, 3], u: [0, 0, 0] }, true],
    ['a discretionary lane that cannot pay: $5 + $5 on [5, 5], B’s discretionary lane holds $1', ['A', 'B'], [5, 5], { d: 5, mnd: 5 }, [BIG, 1], [BIG, BIG],
      // shares as above: D [3,2], M [2,3]. B's discretionary pays 1 of its 2: B is $1 short, and only B.
      { d: [3, 1], m: [2, 3], u: [0, 1] }, false],
  ];
  const run = (svc, ask, leg, dl, ml) => {
    seed(ev, { services: svc, items: [it('X', 'AV', ask)], disc: dl, mand: ml, order: ['X'], fsrc: { X: Object.assign({ m: 'split' }, leg) } });
    return w1json(ev, `JSON.stringify((function(){ const t=tiers().X; return {d:t.d, m:t.m, u:t.u}; })())`);
  };
  F.forEach(([lbl, svc, ask, leg, dl, ml, want, full]) => {
    const t = run(svc, ask, leg, dl, ml);
    if (typeof t !== 'object') { chk(name, lbl, 'the fixture ran', t, 'ran'); return; }
    chk(name, lbl, 'discretionary, mandatory and unfunded by service, as worked out by hand', J([t.d, t.m, t.u]), J([want.d, want.m, want.u]));
    if (full) chk(name, lbl, 'the lanes can pay, so discretionary totals D and mandatory totals M exactly',
      J([sum(t.d), sum(t.m), sum(t.u)]), J([leg.d, leg.mnd, sum(ask) - leg.d - leg.mnd]));
    chk(name, lbl, 'CONTROL — d + m + u is the basis on every service, and no service draws past its own lanes (the row always totalled)',
      J([t.d.map((x, i) => x + t.m[i] + t.u[i]), t.d.every((x, i) => x <= dl[i]) && t.m.every((x, i) => x <= ml[i])]), J([ask, true]));
  });
  // A SPLIT FURTHER DOWN THE WALK: A, ranked first, empties USAF's discretionary lane; X's discretionary share on USAF
  // is unfunded, and its mandatory dollar is placed on ANG, where discretionary left room -- not on USAF beside it.
  seed(ev, { services: ['USAF', 'ANG'], items: [it('P', 'PSM', [4, 0]), it('X', 'AV', [1, 1])], disc: [4, 5], mand: [5, 5], order: ['P', 'X'],
             fsrc: { X: { m: 'split', d: 1, mnd: 1 } } });
  chk(name, 'down the walk', 'X after a requirement that emptied USAF’s discretionary lane: d [0,0], m [0,1], u [1,0]',
    w1ev(ev, `(function(){ const t=tiers().X; return JSON.stringify([t.d, t.m, t.u]); })()`), J([[0, 0], [0, 1], [1, 0]]));
  // CONVERTED TO A PER-SERVICE SPLIT -- the first keystroke in the split editor does it (migrateSplit) -- it keeps both lanes
  seed(ev, { services: ['A', 'B'], items: [it('X', 'AV', [1, 1])], disc: [BIG, BIG], mand: [BIG, BIG], order: ['X'], fsrc: { X: { m: 'split', d: 1, mnd: 1 } } });
  chk(name, 'converted', 'promoted to per-service vectors, the $1 + $1 split is Disc [1,0] and Mand [0,1], and still funds $2',
    w1ev(ev, `(function(){ migrateSplit('X'); const f=S.fsrc.X, t=tiers().X; return JSON.stringify([f.dv, f.mv, t.dT+t.mT]); })()`), J([[1, 0], [0, 1], 2]));
  // LARGE AND ODD (CONTROL: the shares here never meet on a service, so v1.96 placed them too): the totals hold to the dollar
  seed(ev, { services: ['USAF', 'ANG', 'STOVL'], items: [it('X', 'AV', [70000001, 30000007, 10000003])], disc: [1e12, 1e12, 1e12], mand: [1e12, 1e12, 1e12],
             order: ['X'], fsrc: { X: { m: 'split', d: 61234567, mnd: 23456789 } } });
  const L = w1json(ev, `JSON.stringify((function(){ const t=tiers().X; return {d:t.d, m:t.m, u:t.u}; })())`);
  chk(name, 'large and odd', 'CONTROL — $61,234,567 + $23,456,789 on [70,000,001, 30,000,007, 10,000,003]: d and m total exactly, whole dollars, each within $2 of its share',
    J([sum(L.d || []), sum(L.m || []), sum(L.u || []), [].concat(L.d || [], L.m || [], L.u || []).every(Number.isSafeInteger),
       [70000001, 30000007, 10000003].every((b, i) => Math.abs(L.d[i] - 61234567 * b / 110000011) < 1
         && Math.abs(L.d[i] + L.m[i] - (61234567 + 23456789) * b / 110000011) < 2)]),
    J([61234567, 23456789, 110000011 - 61234567 - 23456789, true, true]));
  // DIRECTED SPLITS DO NOT CHANGE (CONTROL): per-service Disc and Mand are drawn as typed, inside each lane
  seed(ev, { services: ['A', 'B'], items: [it('X', 'AV', [6, 4])], disc: [2, BIG], mand: [BIG, BIG], order: ['X'],
             fsrc: { X: { m: 'split', dv: [3, 1], mv: [2, 3] } } });
  chk(name, 'directed', 'CONTROL — a directed split Disc [3,1] Mand [2,3] with A’s discretionary lane at $2: d [2,1], m [2,3], u [1,0] (passes on v1.96)',
    w1ev(ev, `(function(){ const t=tiers().X; return JSON.stringify([t.d, t.m, t.u]); })()`), J([[2, 1], [2, 3], [1, 0]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  _w1Release(__bm, []);
  await _w1Settle();
})();

// v1.97 W1, ITEM 74 (review R03): A NEGATIVE ALLOCATION IS REFUSED. Typing -2 as the allocation on a requirement of [1, 1]
// was taken; its basis became [-1, -1], every lane draw was zero and d + m + u no longer equalled the basis. Now a
// negative typed is refused and the allocation keeps the value it had; one already saved (an older file -- set here
// directly, as the file would hand it over) is kept as it was, counts as zero in every figure, and is listed for repair.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = _w1Mark();
  const name = 'v1.97 — a negative allocation is refused, and one already saved counts as zero (item 74)';
  try {
  const J = JSON.stringify;
  const { ev } = boot();
  seed(ev, { services: ['USAF', 'ANG'], items: [it('X', 'AV', [1, 1]), it('Y', 'PSM', [30, 50]), it('Z', 'TSS', [8, 9])],
             disc: [100, 100], mand: [100, 100], order: ['X', 'Y', 'Z'],
             alloc: { Y: { m: 't', v: 40 } }, fsrc: { Z: { m: 'split', dv: [5, 6], mv: [1, 2] } } });
  const stat = () => w1ev(ev, `document.getElementById('shareStat').textContent`);
  const A = id => w1ev(ev, `JSON.stringify(S.alloc[${J(id)}]===undefined? null : S.alloc[${J(id)}])`);
  // ── typed ──
  w1ev(ev, `setStat(''); setAlloc('X','-2'); 'ok'`);
  chk(name, 'typed', '-2 typed as X’s allocation is refused: X keeps no allocation (its full requirement value)', A('X'), 'null');
  chk(name, 'typed', 'and the message says why', /not changed[\s\S]*below zero/.test(stat()), true);
  w1ev(ev, `setAlloc('Y','-5'); 'ok'`);
  chk(name, 'typed', '-5 typed over Y’s $40 allocation is refused: Y keeps $40', A('Y'), J({ m: 't', v: 40 }));
  w1ev(ev, `setSvc('Y',1,'-3'); 'ok'`);
  chk(name, 'typed', '-3 typed as Y’s ANG allocation is refused: Y keeps $40 as it was', A('Y'), J({ m: 't', v: 40 }));
  w1ev(ev, `setFsrcSvc('Z','d',0,'-4'); 'ok'`);
  chk(name, 'typed', '-4 typed as Z’s USAF discretionary dollars is refused: the split keeps Disc [5,6]', w1ev(ev, `JSON.stringify(S.fsrc.Z.dv)`), J([5, 6]));
  w1ev(ev, `setAlloc('X','0'); 'ok'`);
  chk(name, 'typed', 'CONTROL — $0 is an allocation: X allocated $0 is all trim, nothing unfunded beyond it (passes on v1.96)',
    w1ev(ev, `(function(){ const x=itemById('X'), t=tiers().X; return JSON.stringify([S.alloc.X, basisSvcOf(x), trimSvcOf(x), beyondSvcOf(x,t)]); })()`),
    J([{ m: 't', v: 0 }, [0, 0], [1, 1], [0, 0]]));
  w1ev(ev, `setAlloc('X','5'); 'ok'`);
  chk(name, 'typed', 'CONTROL — an allocation above the requirement value is taken, and the basis is clamped to the ask (passes on v1.96)',
    w1ev(ev, `JSON.stringify([S.alloc.X, basisSvcOf(itemById('X'))])`), J([{ m: 't', v: 5 }, [1, 1]]));
  // ── already saved ── X carries -2 as a total, Y [-7, 20] by service, Z a split whose USAF Disc is -3
  w1ev(ev, `S.alloc.X={m:'t', v:-2}; S.alloc.Y={m:'s', v:[-7,20]}; S.fsrc.Z={m:'split', dv:[-3,6], mv:[1,2]}; render(); 'ok'`);
  const E = w1json(ev, `JSON.stringify((function(){ const T=tiers(), o={};
      ['X','Y','Z'].forEach(function(id){ const x=itemById(id), t=T[id];
        o[id]={basis:basisSvcOf(x), dmu:t.d.map(function(v,i){ return v+t.m[i]+t.u[i]; }), d:t.d, m:t.m, u:t.u,
               unf:unfSvcOf(x,t), beyond:beyondSvcOf(x,t), trim:trimSvcOf(x)}; });
      return o; })())`);
  // by hand: X's -2 counts as 0 -> basis [0,0], all of [1,1] is trim and unfunded. Y's USAF -7 counts as 0 -> basis
  // [0,20]: ANG draws 20 of discretionary; trim [30,30]. Z: Disc -3 + Mand 1 on USAF counts as 0 -> basis [0, 8].
  const want = { X: { basis: [0, 0], d: [0, 0], m: [0, 0], u: [0, 0], unf: [1, 1], beyond: [0, 0], trim: [1, 1] },
                 Y: { basis: [0, 20], d: [0, 20], m: [0, 0], u: [0, 0], unf: [30, 30], beyond: [0, 0], trim: [30, 30] },
                 Z: { basis: [0, 8], d: [0, 6], m: [0, 2], u: [0, 0], unf: [8, 1], beyond: [0, 0], trim: [8, 1] } };
  ['X', 'Y', 'Z'].forEach(id => {
    const g = (E && E[id]) || {};
    chk(name, 'saved', `${id}: the basis never goes below zero`, J(g.basis), J(want[id].basis));
    chk(name, 'saved', `${id}: d + m + u is the basis the board states, on every service`, J(g.dmu), J(g.basis));
    chk(name, 'saved', `${id}: d, m, u, and beyond + trim == unfunded on every service`,
      J([g.d, g.m, g.u, (g.beyond || []).map((b, i) => b + g.trim[i])]), J([want[id].d, want[id].m, want[id].u, want[id].unf]));
  });
  chk(name, 'saved', 'CONTROL — each is kept exactly as saved (passes on v1.96, which kept them too)',
    w1ev(ev, `JSON.stringify([S.alloc.X, S.alloc.Y, S.fsrc.Z])`), J([{ m: 't', v: -2 }, { m: 's', v: [-7, 20] }, { m: 'split', dv: [-3, 6], mv: [1, 2] }]));
  // THE PRIORITY DRILL prints the allocation the board works from: X $0 and Y $20, not -$2 and the -$7 + $20 = $13 saved
  const drill = w1json(ev, `(function(){ let cap=null; const keep=buildXlsx; buildXlsx=function(sh){ cap=sh; return new Uint8Array(0); };
      try{ exportCSV(); } finally { buildXlsx=keep; }
      const out={}; (cap||[]).forEach(function(s){ (s.rows||[]).forEach(function(r){
        const v=(r||[]).map(function(c){ return (c && typeof c==='object' && 'v' in c)? c.v : c; });
        ['X','Y'].forEach(function(id){ if(v[4]===dispTitle(itemById(id)) && out[id]===undefined) out[id]=v[12]; }); }); });
      return JSON.stringify(out); })()`);
  chk(name, 'saved', 'the Priority Drill’s Allocated column prints what the board works from: X $0 and Y $20', J(drill), J({ X: 0, Y: 20 }));
  // LISTED FOR REPAIR, under Needs attention, with what was saved
  chk(name, 'listed', 'Needs attention lists all three, each with what was saved',
    w1ev(ev, `JSON.stringify(((attLists()||{}).neg||[]).map(function(r){ return [r.id, r.n]; }))`),
    J([['X', ['allocation −$2']], ['Y', ['USAF allocation −$7']], ['Z', ['USAF Disc −$3']]]));
  chk(name, 'listed', 'and the funding posture counts them', /3 negative allocations to repair/.test(w1ev(ev, `document.getElementById('posture').textContent`)), true);
  w1ev(ev, `attShow('neg'); 'ok'`);
  chk(name, 'listed', 'its list opens, saying what was saved',
    w1ev(ev, `JSON.stringify([attOpen, [].slice.call(document.querySelectorAll('#attBody .attneg')).map(function(e){ return e.textContent; })])`),
    J(['neg', ['allocation −$2', 'USAF allocation −$7', 'USAF Disc −$3']]));
  w1ev(ev, `attClose(); 'ok'`);
  // an edit to Y's ANG keeps USAF's -7 as saved (CONTROL: v1.96 seeded the edit from the same figures)
  w1ev(ev, `setSvc('Y',1,'25'); 'ok'`);
  chk(name, 'repair', 'CONTROL — typing Y’s ANG allocation leaves its USAF figure as it was saved (passes on v1.96)', A('Y'), J({ m: 's', v: [-7, 25] }));
  // REPAIRED: set again, X leaves the list; Y and Z stay until theirs are
  w1ev(ev, `setAlloc('X','1'); 'ok'`);
  chk(name, 'repair', 'X allocated $1 again leaves the list; Y and Z stay',
    w1ev(ev, `JSON.stringify(((attLists()||{}).neg||[]).map(function(r){ return r.id; }))`), J(['Y', 'Z']));
  // SIGNED FIELDS STAY SIGNED (CONTROL): a funding source and a PPBE position may still be below zero
  w1ev(ev, `S.bm.adds=[{name:'Rescission', pool:'disc', vec:[0,0]}]; bmSrcSet(0,'vec',1,'-25'); 'ok'`);
  chk(name, 'signed', 'CONTROL — a funding source can still be a reduction: -25 is taken (passes on v1.96)', w1ev(ev, `JSON.stringify(S.bm.adds[0].vec)`), J([0, -25]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  _w1Release(__bm, []);
  await _w1Settle();
})();

// v1.97 W1, ITEM 75 (review R04): TYPED MONEY IS CHECKED AS STRICTLY AS IMPORTED MONEY, AND A TYPO NEVER ZEROES A FIGURE.
// parseAmt read only the front of an entry -- "100oops" was $100, "1.2.3" $1, "1e309" $0, 9007199254740993 lost a dollar,
// $10,000,000,000,001 was taken though a file is refused anything over $10 trillion -- and most editors took text it
// could not read for a blank: "abc" over a $500 requirement value made it $0. Part 1 reads entries through parseAmt;
// part 2 drives EVERY editor that reads a typed amount with something it cannot take, and the figure must stay.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = _w1Mark();
  const name = 'v1.97 — typed money is read whole, and a typo never zeroes a figure (item 75)';
  try {
  const J = JSON.stringify;
  const { ev } = boot();
  seed(ev, { services: ['USAF', 'ANG'], items: [it('X', 'AV', [500, 700]), it('W', 'PSM', [40, 60])],
             disc: [10000, 10000], mand: [10000, 10000], order: ['X', 'W'] });
  // ── part 1: the reading ──
  const P = (s, o) => w1ev(ev, `(function(){ const v=parseAmt(${J(s)}${o ? ', ' + J(o) : ''}); return (typeof v==='number' && isNaN(v))? 'refused' : String(v); })()`);
  [['100oops', 'refused'], ['1.2.3', 'refused'], ['1e309', 'refused'], ['9007199254740993', 'refused'],
   ['$10,000,000,000,001', 'refused'], ['10000000000000.5', 'refused'], ['abc', 'refused'], ['5MM', 'refused'], ['1,2345', 'refused'],
   ['12 34', 'refused'], ['-5', 'refused'], ['$-5', 'refused']].forEach(([s, w]) =>
    chk(name, 'reading', `${J(s)} is ${w}`, P(s), w));
  chk(name, 'reading', '"-1.5" in a signed field is -2: cents round half away from zero', P('-1.5', { neg: true }), '-2');
  [['$10,000,000,000,000', '10000000000000'], ['9999999999999.5', '10000000000000'], ['$1,234', '1234'], ['2.5M', '2500000'],
   ['$ 2.5 m', '2500000'], ['750k', '750000'], ['1.2B', '1200000000'], ['1,234.56', '1235'], ['0.4', '0'],
   ['', 'null'], ['   ', 'null'], ['-5', '-5', { neg: true }]].forEach(([s, w, o]) =>
    chk(name, 'reading', `CONTROL — ${J(s)}${o ? ' in a signed field' : ''} is ${w} (read the same on v1.96)`, P(s, o), w));
  // ── part 2: every editor keeps its figure, and says why ──
  // RUN sets the figure up, types each entry, and reads the figure back after each; the figure must not move
  // a signed field (a funding source, a PPBE position) takes -5, so it is given an amount past the bound below zero instead
  const BAD = ['abc', '7oops', '$10,000,000,000,001', '-5'], SIGNED = ['abc', '7oops', '$10,000,000,000,001', '-$10,000,000,000,001'];
  const keeps = (where, setup, type, read, bad = BAD) => {
    const out = w1json(ev, `JSON.stringify((function(){ ${setup}; const was=JSON.stringify(${read}), r=[];
        ${J(bad)}.forEach(function(b){ setStat(''); ${type}; const now=JSON.stringify(${read});
          r.push([b, now===was? 'kept' : 'changed to '+now, /not changed/.test(document.getElementById('shareStat').textContent)]); });
        return r; })())`);
    chk(name, where, bad.join(', ') + ' each leave the figure as it was, and say so', J(out), J(bad.map(b => [b, 'kept', true])));
  };
  keeps('requirement value', `S.asks={}; itemById('X').ask=[500,700]`, `setAsk('X',0,b)`, `itemById('X').ask`);
  keeps('allocation', `S.alloc.X={m:'t', v:900}`, `setAlloc('X',b)`, `S.alloc.X`);
  keeps('allocation by service', `S.alloc.X={m:'s', v:[400,600]}`, `setSvc('X',1,b)`, `S.alloc.X`);
  keeps('split dollars', `S.fsrc.X={m:'split', dv:[100,200], mv:[30,40]}`, `setFsrcSvc('X','m',1,b)`, `S.fsrc.X`);
  keeps('split dollars, first keystroke', `delete S.fsrc.W`, `setFsrcSvc('W','d',0,b)`, `S.fsrc.W||null`);
  keeps('budget base', `S.bm={disc:[100,200], mand:[50,60], adds:[]}; applyBudget()`, `bmSetBase('mand',1,b)`, `[S.bm.mand, S.mandSvc]`);
  keeps('funding source', `S.bm.adds=[{name:'Add', pool:'disc', vec:[11,22]}]; applyBudget()`, `bmSrcSet(0,'vec',0,b)`, `S.bm.adds[0].vec`, SIGNED);
  keeps('award', `S.awards.X={mode:'inc', inc:[{d:'2026-11', day:5, sv:[100,200]}]}`, `setAwdIncSvc('X',0,1,b)`, `S.awards.X.inc[0].sv`);
  keeps('minimum increment', `S.minInc.X=300`, `setMinInc('X',b)`, `S.minInc.X`);
  keeps('absorber floor', `S.absorbFloor=1000`, `setAbsorbFloor(b)`, `S.absorbFloor`);
  keeps('PPBE position', `MS.ppbe=MS.ppbe||{}; ppYr=2027; ppSetV('USAF','k1',2027,'d','5000')`, `ppSetV('USAF','k1',2027,'d',b)`, `ppPos().val`, SIGNED);
  keeps('CLIN allocation', `S.clinNew={P1:[{key:'n1', clin:'0001', desc:'a', ccar:'', ask:[10,20]}]}; S.clinAlloc={P1:{n1:[10,20]}}`,
    `setClinSvc('P1','n1',0,b)`, `S.clinAlloc.P1.n1`);
  // v2.09 W1: a CLIN's request is typed per service (item 125, clinSetAsk); the guard is the same, on one service's box
  keeps('CLIN request', `S.clinNew={P1:[{key:'n1', clin:'0001', desc:'a', ccar:'', ask:[10,20]}]}`, `clinSetAsk('P1','n1',0,b)`, `S.clinNew.P1[0].ask`);
  keeps('WBS figure', `S.wbs={X:[{w:'1.1', v:[5,6]},{w:'1.2', v:[7,8]}]}`, `wbsSetVal('req','X','',0,1,b)`, `S.wbs.X`);
  keeps('unit cost', `DATA.buys=true; S.buys={ac:{base:[0,0], adj:[2,3], cost:[1000,2000], locked:false}, eng:{base:[0,0], adj:[0,0], cost:[0,0], locked:false}}`,
    `setBuy('ac','cost',0,b)`, `S.buys.ac.cost`);
  w1ev(ev, `delete DATA.buys; 'ok'`);
  // the total a quantity and a unit cost make is held to the bound too
  chk(name, 'unit cost', 'a unit cost of $6,000,000,000,000 on a quantity of 2 would make $12 trillion: refused, the cost kept',
    w1ev(ev, `(function(){ DATA.buys=true; S.buys={ac:{base:[0,0], adj:[2,3], cost:[1000,2000], locked:false}, eng:{base:[0,0], adj:[0,0], cost:[0,0], locked:false}};
      setBuy('ac','cost',0,'$6,000,000,000,000'); const c=S.buys.ac.cost.slice(); delete DATA.buys; return JSON.stringify(c); })()`), J([1000, 2000]));
  // ADD REQUIREMENT: a box it cannot read stops the add; nothing is added, and the alert names the box
  // v2.07 (item 121): typed into the Add box, with every other required field answered and ANG given $500 -- so a USAF box
  // taken for an empty one would let the requirement on, and "nothing is added" holds only because the box was read. The box
  // says it in its own message line (a refusal behind an open box would be out of sight), and keeps the entry, marked. The
  // total is the box's "or a total…": Spread evenly refuses one it cannot read, changes no service box, and says why.
  w1ev(ev, AR_DRIVE);
  const add = svc0 => w1json(ev, `JSON.stringify((function(){ render(); var n0=S.custom.length; __arOpen('AV');
      __arFill({event:'New one', vals:[${J(svc0)}, '500']}); __arBtn(/^Add requirement/);
      var m=document.getElementById('arMsg'), v=document.getElementById('arV0');
      var r=[S.custom.length-n0, m? m.textContent : '', v? v.value : '', v? v.getAttribute('aria-invalid') : null, arOn()];
      if(arOn()) toggleAdd(); return r; })())`);
  const spread = tot => w1json(ev, `JSON.stringify((function(){ render(); var n0=S.custom.length; __arOpen('AV');
      __arPut('arV0', '300'); __arPut('arV1', '400'); __arPut('arSpread', ${J(tot)}); __arBtn(/^Spread evenly$/);
      var m=document.getElementById('arMsg');
      var r=[S.custom.length-n0, m? m.textContent : '', [document.getElementById('arV0').value, document.getElementById('arV1').value], document.getElementById('arSpread').value];
      if(arOn()) toggleAdd(); return r; })())`);
  const a1 = add('7oops'), a2 = spread('1.2.3');
  chk(name, 'add requirement', 'a USAF value of “7oops”: nothing is added, the box names the box it could not read, and keeps the entry, marked',
    J([a1[0], /USAF: .*7oops.* is not an amount/.test(a1[1]), a1[2], a1[3], a1[4]]), J([0, true, '7oops', 'true', true]));
  chk(name, 'add requirement', 'a total of “1.2.3”: Spread evenly leaves every service box as it was, and says it could not read the total',
    J([a2[0], /total was not spread: .*1\.2\.3.* is not an amount/.test(a2[1]), a2[2], a2[3]]), J([0, true, ['300', '400'], '1.2.3']));
  // A BLANK STILL CLEARS (CONTROL): an empty box is the deliberate reset it always was
  chk(name, 'blank', 'CONTROL — a blank clears: the requirement value to $0, the allocation back to the requirement value, the minimum increment gone (passes on v1.96)',
    w1ev(ev, `(function(){ itemById('X').ask=[500,700]; setAsk('X',0,''); S.alloc.X={m:'t', v:900}; setAlloc('X',''); S.minInc.X=300; setMinInc('X','');
      return JSON.stringify([itemById('X').ask, S.alloc.X, S.minInc.X===undefined]); })()`), J([[0, 700], null, true]));
  // A CENT IS ROUNDED, AND SAID: whole dollars, with the figure kept named in the message
  chk(name, 'rounding', '1,234.56 typed as a requirement value is $1,235, and the message says what was entered',
    w1ev(ev, `(function(){ setStat(''); setAsk('X',1,'1,234.56'); return JSON.stringify([itemById('X').ask[1], /entered as \\$1,235/.test(document.getElementById('shareStat').textContent)]); })()`),
    J([1235, true]));
  // THE CLIN REQUEST IS SPREAD IN WHOLE DOLLARS that add up to what was typed
  // v2.09 W1: there is no spread any more (item 125: a CLIN's request is typed per service, clinSetAsk). What this held -- a
  // CLIN request is whole dollars -- is held on one service's box: $100.40 is $100 there, and the other service is untouched.
  chk(name, 'CLIN request', '$100.40 typed as a CLIN’s first service’s request is $100: whole dollars, the other service untouched',
    w1ev(ev, `(function(){ S.clinNew={P1:[{key:'n1', clin:'0001', desc:'a', ccar:'', ask:[1,2]}]}; clinSetAsk('P1','n1',0,'$100.40'); return JSON.stringify(S.clinNew.P1[0].ask); })()`),
    J([100, 2]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  _w1Release(__bm, []);
  await _w1Settle();
})();

// v1.99, ITEM 90 (from item 82 in the 6 Oct review): A QUANTITY IS A WHOLE NUMBER FROM 0, AND WHAT IT MAKES WITH A UNIT
// COST IS EXACT. A typed quantity was read loosely (a sign, a decimal, a Unicode minus, letters), and the dollars a quantity
// and a unit cost made were checked only when the cost was typed. Now: a quantity that is not a whole number from 0 is
// refused and the line keeps what it had; a quantity times a unit cost past $10 trillion is refused whichever side is
// typed; a quantity an older file saved that is not one is kept as saved, counts $0, and is listed. Every dollar figure
// is computed here independently, in BigInt. FAILS ON v1.98 except the checks marked CONTROL.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = _w1Mark();
  const name = 'v1.99 — a buy quantity is a whole number, and what it makes is exact (item 90)';
  try {
  const J = JSON.stringify;
  const { ev } = boot();
  seed(ev, { services: ['USAF', 'ANG'], items: [it('BUY-AC', 'AV', [0, 0]), it('BUY-ENG', 'AV', [0, 0]), it('X', 'PSM', [40, 60])],
             disc: [10000000, 10000000], mand: [0, 0], order: ['BUY-AC', 'BUY-ENG', 'X'] });
  const fresh = `DATA.buys=true; S.buys={ac:{base:[1,1], adj:[2,3], cost:[1000,2000], locked:false}, eng:{base:[0,0], adj:[0,0], cost:[0,0], locked:false}}; recomputeBuys(false)`;
  // the dollars a line makes, by BigInt: q × c, or null past $10 trillion
  const MAX = 10000000000000n;
  const make = (q, c) => { const p = BigInt(q) * BigInt(c); return p <= MAX ? Number(p) : null; };
  // TYPED QUANTITIES: each entry the field refuses leaves the line as it was, and says so
  const typed = (s) => w1json(ev, `JSON.stringify((function(){ ${fresh}; setStat(''); setBuy('ac','adj',0,${J(s)});
      return [S.buys.ac.adj[0], /not changed/i.test(document.getElementById('shareStat').textContent), itemById('BUY-AC').ask[0]]; })())`);
  for (const s of ['-1', '−1', '1.5', '2.0', '1e3', '12,34', '+5', 'five', '0x10', '9007199254740993', '2 3'])
    chk(name, 'typed quantity ' + J(s), (s === '9007199254740993' ? 'CONTROL — ' : '') + 'refused: the line keeps 2 and $2,000, and the board says it was not changed', J(typed(s)), J([2, true, 2000]));
  for (const [s, q] of [['7', 7], ['1,234', 1234], [' 12 ', 12], ['0', 0]])
    chk(name, 'typed quantity ' + J(s), 'CONTROL — taken as ' + q + ', and the requirement asks exactly ' + q + ' × $1,000', J(typed(s).filter((_, i) => i !== 1)), J([q, make(q, 1000)]));
  chk(name, 'typed quantity ""', 'CONTROL — a blank is 0: the line asks $0', J(typed('').filter((_, i) => i !== 1)), J([0, 0]));
  // THE PRODUCT, WHICHEVER SIDE IS TYPED: 10,000,000 × $2,000,000 is $20 trillion -- refused, nothing changed
  const big = w1json(ev, `JSON.stringify((function(){ ${fresh}; S.buys.ac.cost=[2000000, 2000]; recomputeBuys(false); setStat('');
      setBuy('ac','adj',0,'10,000,000'); return [S.buys.ac.adj[0], itemById('BUY-AC').ask[0], /more than/.test(document.getElementById('shareStat').textContent)]; })())`);
  chk(name, 'a quantity that would make $20 trillion', 'CONTROL — refused when the QUANTITY is typed: the line keeps 2 × $2,000,000 (v1.97 item 75 refused it too)', J(big), J([2, make(2, 2000000), true]));
  const edge = w1json(ev, `JSON.stringify((function(){ ${fresh}; S.buys.ac.cost=[2000000, 2000]; recomputeBuys(false);
      setBuy('ac','adj',0,'5,000,000'); const a=[S.buys.ac.adj[0], itemById('BUY-AC').ask[0]];
      setBuy('ac','adj',0,'5,000,001'); return a.concat([S.buys.ac.adj[0], itemById('BUY-AC').ask[0]]); })())`);
  chk(name, 'at the bound', '5,000,000 × $2,000,000 is exactly $10 trillion and is taken; 5,000,001 is refused (the first a CONTROL)',
    J(edge), J([5000000, make(5000000, 2000000), 5000000, make(5000000, 2000000)]));
  // A QUANTITY AN OLDER FILE SAVED THAT IS NOT ONE: kept as saved, $0, listed under Needs attention -- never converted
  const old = w1json(ev, `JSON.stringify((function(){ DATA.buys=true; S.buys={ac:{base:[1,1], adj:[-3, 2.5], cost:[1000,2000], locked:false},
        eng:{base:[0,0], adj:[4,'7'], cost:[500,600], locked:false}}; recomputeBuys(false);
      const L=(attLists().buy||[]);
      return [S.buys.ac.adj, S.buys.eng.adj, itemById('BUY-AC').ask, itemById('BUY-ENG').ask, L.map(function(r){ return [r.id, r.n.length]; })]; })())`);
  chk(name, 'saved quantities that are not whole numbers from 0', 'CONTROL — kept exactly as saved (-3, 2.5 and the text "7")', J([old[0], old[1]]), J([[-3, 2.5], [4, '7']]));
  chk(name, 'saved quantities that are not whole numbers from 0', 'each such line counts $0; a good line on the same table still counts exactly',
    J([old[2], old[3]]), J([[0, 0], [make(4, 500), 0]]));
  chk(name, 'saved quantities that are not whole numbers from 0', 'Needs attention lists both tables, with each bad line', J(old[4]), J([['BUY-AC', 2], ['BUY-ENG', 1]]));
  // THE PANEL: the bad line says it is not counted, and the table's total is what the good lines make
  const pan = w1json(ev, `JSON.stringify((function(){ buysOpen=true; buysPanel(); const t=document.getElementById('buysBody').textContent;
      return [document.querySelectorAll('#buysBody .buybad').length, t.indexOf(fM(${make(4, 500)}))>=0]; })())`);
  chk(name, 'the buys panel', 'the three bad lines are marked not counted, and the engine table’s total is 4 × $500', J(pan), J([3, true]));
  // SAVED AND REOPENED: the saved figures are still as they were (nothing converted on the way)
  const R = boot({ html: ev('buildSavedHtml()') });
  chk(name, 'saved and reopened', 'CONTROL — the board opens with no script error (opening recomputes the buy lines before the bound is declared)', J(R.errors), '[]');
  chk(name, 'saved and reopened', 'the quantities are still -3, 2.5 and "7", and still count $0',
    w1ev(R.ev, `JSON.stringify([S.buys.ac.adj, S.buys.eng.adj, itemById('BUY-AC').ask])`), J([[-3, 2.5], [4, '7'], [0, 0]]));
  // REPAIRED BY TYPING: the line takes the typed figure and leaves the list
  const fix = w1json(ev, `JSON.stringify((function(){ setBuy('ac','adj',0,'6'); setBuy('ac','adj',1,'1'); setBuy('eng','adj',1,'7');
      return [S.buys.ac.adj, itemById('BUY-AC').ask, itemById('BUY-ENG').ask, (attLists().buy||[]).length]; })())`);
  chk(name, 'repaired by typing', 'CONTROL — each line takes its figure, makes it exactly, and the list empties',
    J(fix), J([[6, 1], [make(6, 1000), make(1, 2000)], [make(4, 500), make(7, 600)], 0]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  _w1Release(__bm, []);
  await _w1Settle();
})();

// v1.99, ITEM 91 (from item 87, review N03): A CODE LONGER THAN ITS LIMIT IS REFUSED, NEVER CUT. A typed PID, CCaR record,
// RCN or EEIC was cut to its length without a word (a cut code can be another record), the new-requirement form cut its
// CCaR to 12 as it was typed, a PMO submittal's CCaR record was cut to 12 on the way in, and a CLIN number or description,
// a WBS or a PPBE line code took any length. Now every typed path refuses one over its limit -- nothing changes, and the
// text typed is kept where it was typed (a prompt opens again holding it, an inline field keeps it, marked) -- and a code
// that arrives in a file is kept whole and listed (Needs attention, Pre-flight). FAILS ON v1.98 except the CONTROLs.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = _w1Mark();
  const name = 'v1.99 — a code longer than its limit is refused when typed and flagged when imported, never cut (item 91)';
  try {
  const J = JSON.stringify;
  const { ev } = boot();
  seed(ev, { services: ['USAF', 'ANG'], items: [it('X', 'AV', [500, 700]), it('P', 'PSM', [400, 600])],
             disc: [10000, 10000], mand: [0, 0], order: ['X', 'P'] });
  // the board's prompt, answered from a list; every text it opened with is kept
  w1ev(ev, `BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });   // a file that carries them
    globalThis.__pr=[]; globalThis.__ans=[]; uiPrompt=function(q, d, cb){ __pr.push(String(d)); if(__ans.length) cb(__ans.shift()); };
    S.ptype=S.ptype||{}; S.ptype.P='PRIME'; S.pid.X='PID-OLD'; S.ccar.X='CC-OLD'; save(); 'ok'`);
  const L = n => 'A'.repeat(n);
  const ask = (code, answers) => w1json(ev, `JSON.stringify((function(){ __pr=[]; __ans=${J(answers)}; setStat(''); ${code};
      return {pr:__pr.slice(), stat:document.getElementById('shareStat').textContent}; })())`);
  // PID: 36 refused (kept PID-OLD; the box keeps the 36 typed); 35 taken (a CONTROL). v2.01 (Brad, 20 Oct): the limit is 35.
  // v2.08 (item 122): typed in the edit box, which keeps what was typed and writes nothing when Save refuses.
  const inBox = (f, v) => w1json(ev, `JSON.stringify((function(){ setStat(''); openEdit('X', ${J(f === 'erPid' ? 'pid' : 'ccar')});
      var e=document.getElementById(${J(f)}); e.value=${J(v)}; e.dispatchEvent(new Event('input')); erSave();
      var r={open:erOn(), kept:(document.getElementById(${J(f)})||{}).value, msg:(document.getElementById('erMsg')||{}).textContent||''};
      erClose(); return r; })())`);
  let r = inBox('erPid', L(36));
  chk(name, 'PID, typed', '36 characters: refused, the PID stays, and the box stays open holding what was typed',
    J([w1ev(ev, `S.pid.X`), r.open, r.kept, /at most 35/.test(r.msg)]), J(['PID-OLD', true, L(36), true]));
  inBox('erPid', L(35));
  chk(name, 'PID, typed', 'CONTROL — 35 characters are taken whole', w1ev(ev, `S.pid.X`), L(35));
  // CCaR record: 13 refused, 12 taken
  r = inBox('erCcar', L(13));
  chk(name, 'CCaR record, typed', '13 characters: refused, the record stays, and the box stays open holding them',
    J([w1ev(ev, `ccarOf(itemById('X'))`), r.kept, /at most 12/.test(r.msg)]), J(['CC-OLD', L(13), true]));
  // CLIN number and description, on a prime
  const n0 = Number(w1ev(ev, `clinList('P').length`));
  r = ask(`clinAdd('P')`, [L(21)]);
  chk(name, 'CLIN number, typed', '21 characters: no CLIN is added, and the box opens again holding them',
    J([Number(w1ev(ev, `clinList('P').length`)) - n0, r.pr[1], /at most 20/.test(r.stat)]), J([0, L(21), true]));
  // the number box opens again holding 0001; taking it, the description box opens holding the 141 characters
  r = ask(`clinAdd('P')`, ['0001', 'D'.repeat(141), '0001']);
  chk(name, 'CLIN description, typed', '141 characters: no CLIN is added, and both boxes open again holding what was typed',
    J([Number(w1ev(ev, `clinList('P').length`)) - n0, r.pr.slice(2), /at most 140/.test(r.stat)]), J([0, ['0001', 'D'.repeat(141)], true]));
  ask(`clinAdd('P')`, ['0001', 'Engines']);
  const key = w1ev(ev, `clinList('P').filter(function(c){ return c.clin==='0001'; })[0].key`);
  r = ask(`clinSetField('P',${J(key)},'ccar')`, [L(13)]);
  chk(name, 'a CLIN’s CCaR record, typed', '13 characters: refused, kept as it was, the box opens again holding them',
    J([w1ev(ev, `clinList('P').filter(function(c){ return c.key===${J(key)}; })[0].ccar||''`), r.pr[1]]), J(['', L(13)]));
  // WBS: the box, and the inline field
  r = ask(`wbsQuick('X')`, ['1.'.repeat(20) + '1']);
  chk(name, 'WBS, typed in the box', '41 characters: refused, the box opens again holding them',
    J([w1ev(ev, `JSON.stringify(wbsReq('X'))`), r.pr[1], /at most 40/.test(r.stat)]), J(['[]', '1.'.repeat(20) + '1', true]));
  const inl = w1json(ev, `JSON.stringify((function(){ wbsStore('req','X','',[{w:'1.1', v:[]}]); const el=document.createElement('input'); el.value=${J(L(41))};
      wbsSetNum('req','X','',0,el.value,el); return [wbsReq('X')[0].w, el.value, el.getAttribute('aria-invalid')]; })())`);
  chk(name, 'WBS, typed inline', '41 characters: refused, the WBS stays 1.1, and the field keeps what was typed, marked', J(inl), J(['1.1', L(41), 'true']));
  // RCN / EEIC in the list
  const rc = w1json(ev, `JSON.stringify((function(){ MS.rcn=[{k:'K1', rcn:'11111', eeic:'AAAAA'}]; const el=document.createElement('input');
      rcnSet(0,'rcn','12345678901',el); rcnSet(0,'eeic','ABCDEFGHIJK',el); return [MS.rcn[0].rcn, MS.rcn[0].eeic, el.getAttribute('aria-invalid')]; })())`);
  chk(name, 'RCN and EEIC, typed', '11 characters each: refused, the list keeps 11111 / AAAAA, and the field is marked', J(rc), J(['11111', 'AAAAA', 'true']));
  // THE NEW-REQUIREMENT FORM: a 13-character CCaR adds nothing, and the form keeps what was typed
  // v2.07 (item 121): the form is the Add box, and it takes a PID and a WBS too. One code over its limit at a time -- a CCaR
  // of 13, a PID of 36, a WBS of 41 -- with everything else answered, so each refusal is that code's own: nothing is added,
  // the box says the limit, keeps every field as typed, and none of the three has a maxlength to cut it silently. The
  // requirement is an OGC, so the box asks for its WBS (a prime's is logged per CLIN). CONTROL: at their limits (12, 35,
  // 40) all three are taken whole.
  w1ev(ev, AR_DRIVE);
  const boxTry = o => w1json(ev, `JSON.stringify((function(){ render(); var n0=S.custom.length; __arOpen('AV');
      __arFill(${J(Object.assign({ event: 'Proposed one', ptype: 'OGC', vals: ['100', ''], gov: true }, o))});
      __arBtn(/^Add requirement/);
      var g=function(id){ return document.getElementById(id); }, m=g('arMsg');
      var r={added:S.custom.length-n0, msg:m? m.textContent : '', open:arOn(),
        kept:['arCcar','arPid','arWbs','arEvent','arDesc','arCons'].map(function(id){ return g(id)? g(id).value : null; }),
        cut:['arCcar','arPid','arWbs'].filter(function(id){ return !g(id) || g(id).hasAttribute('maxlength'); }),
        id:S.custom.length>n0? S.custom[S.custom.length-1].id : ''};
      if(arOn()) toggleAdd(); return r; })())`);
  const okC = { ccar: L(12), pid: L(35), wbs: '1.'.repeat(19) + '12' };
  for (const [k, lbl, over, lim] of [['ccar', 'CCaR record', L(13), 12], ['pid', 'PID', L(36), 35], ['wbs', 'WBS', '1.'.repeat(20) + '1', 40]]) {
    const typed = { ...okC, [k]: over };
    const r = boxTry(typed);
    chk(name, 'the new-requirement form', `${lbl} of ${over.length} characters: nothing is added, the box says the limit, keeps every field as typed, and none of the three codes has a silent cut`,
      J([r.added, new RegExp('at most ' + lim).test(r.msg), r.open, r.kept, r.cut]),
      J([0, true, true, [typed.ccar, typed.pid, typed.wbs, 'Proposed one', 'What it buys', 'What is lost if it is not funded'], []]));
  }
  const atLim = boxTry(okC);
  chk(name, 'the new-requirement form', 'CONTROL — at their limits (12, 35, 40) the three codes are taken whole',
    w1ev(ev, `JSON.stringify([S.ccar[${J(atLim.id)}], S.pid[${J(atLim.id)}], ((S.wbs[${J(atLim.id)}]||[])[0]||{}).w])`), J([okC.ccar, okC.pid, okC.wbs]));
  // READING CHANGES NOTHING: the check runs as the board draws, so a prime with no CLIN entries must not gain empty ones
  const ro = w1json(ev, `JSON.stringify((function(){ ['clinMeta','clinNew','clinRm'].forEach(function(k){ if(S[k]) delete S[k].P; });
      codeIssues(); attLists(); return ['clinMeta','clinNew','clinRm'].map(function(k){ return !!(S[k] && S[k].P!==undefined); }); })())`);
  chk(name, 'reading a prime’s CLINs', 'the code check and Needs attention create no empty CLIN entries (a saved board would read differently)', J(ro), J([false, false, false]));
  // IMPORTED: a PMO submittal's 15-character CCaR record is kept whole, and listed
  const im = w1json(ev, `JSON.stringify((function(){ const ok=pmoAcceptProposal({prop:{nid:'n9', grp:'AV', title:'From the office', ask:[10,20], ccar:${J(L(15))}},
        src:'s1', from:'PSM', by:'Office'});
      const id=S.custom[S.custom.length-1].id;
      const pf=(preflight().find.filter(function(f){ return f.k==='code'; })[0]||{rows:[]}).rows.filter(function(x){ return x.id===id; }).length;
      const at=(attLists().code||[]).filter(function(x){ return x.id===id; }).length;
      return [S.ccar[id], pf, at]; })())`);
  chk(name, 'a PMO submittal', 'its 15-character CCaR record is kept whole, listed under Pre-flight and under Needs attention', J(im), J([L(15), 1, 1]));
  // A FILE THAT CARRIES ONE: kept whole through save and reopen, and listed
  w1ev(ev, `S.pid.P=${J(L(36))}; S.pid.X=${J(L(35))}; save(); 'ok'`);
  const R = boot({ html: ev('buildSavedHtml()') });
  chk(name, 'a saved file carrying a 36-character PID', 'reopened, it is kept whole and Needs attention lists it',
    w1ev(R.ev, `JSON.stringify([S.pid.P, (attLists().code||[]).some(function(x){ return x.id==='P'; })])`), J([L(36), true]));
  chk(name, 'a saved file carrying a 35-character PID', 'CONTROL — v2.01: at the limit, it is kept and not listed',
    w1ev(R.ev, `JSON.stringify([S.pid.X, codeIssues().some(function(x){ return x.id==='X' && x.kind==='pid'; })])`), J([L(35), false]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  _w1Release(__bm, []);
  await _w1Settle();
})();
// v2.00 (R2): AN EEIC IS CHECKED IN THE FORM IT IS STORED. rcnSet keeps an EEIC trimmed and upper-cased, but item 91's
// limit read it as typed, and upper-casing can lengthen it: ß becomes SS, ﬃ becomes FFI. Ten ß passed as 10 characters
// and were kept as 20 -- a code over its limit, written by the board itself. Now the form that is kept is the form checked:
// refused, the list keeps what it had, the field keeps what was typed, marked, and the status says the EEIC was not
// changed. Each case types into a field of its own, the list holding AAAAA; the expected values are literals.
// FAILS ON 1c94537 except the CONTROLs.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = _w1Mark();
  const name = 'v2.00 (R2) — an EEIC is checked in the form it is stored';
  try {
  const J = JSON.stringify;
  const { ev } = boot();
  seed(ev, { services: ['USAF', 'ANG'], items: [it('X', 'AV', [500, 700])], disc: [10000, 10000], mand: [0, 0], order: ['X'] });
  // [the EEIC kept, the field marked, the field's text, the status says EEIC not changed]
  const typed = t => w1json(ev, `JSON.stringify((function(){ MS.rcn=[{k:'K1', rcn:'11111', eeic:'AAAAA'}]; setStat(''); const el=document.createElement('input');
      el.value=${J(t)}; rcnSet(0,'eeic',el.value,el);
      return [MS.rcn[0].eeic, el.getAttribute('aria-invalid'), el.value, /EEIC not changed/.test(document.getElementById('shareStat').textContent)]; })())`);
  const SZ = 'ß', FFI = 'ﬃ';
  chk(name, 'EEIC typed as ß×10', 'upper-cased it is 20 characters: refused, the list keeps AAAAA, the field keeps what was typed, marked, the status says EEIC not changed',
    J(typed(SZ.repeat(10))), J(['AAAAA', 'true', SZ.repeat(10), true]));
  chk(name, 'EEIC typed as ﬃ×4', 'upper-cased it is 12 characters: refused, the list keeps AAAAA, the field keeps what was typed, marked, the status says EEIC not changed',
    J(typed(FFI.repeat(4))), J(['AAAAA', 'true', FFI.repeat(4), true]));
  chk(name, 'EEIC typed as ABCDEFGHIJK', 'CONTROL — 11 characters as typed: refused, the list keeps AAAAA, the field is marked',
    J(typed('ABCDEFGHIJK')), J(['AAAAA', 'true', 'ABCDEFGHIJK', true]));
  chk(name, 'EEIC typed as " ab12c "', 'CONTROL — kept trimmed and upper-cased as AB12C, the field not marked',
    J(typed(' ab12c ')), J(['AB12C', null, ' ab12c ', false]));
  chk(name, 'EEIC typed as ABCDEFGHIJ', 'CONTROL — 10 characters: kept as ABCDEFGHIJ, the field not marked',
    J(typed('ABCDEFGHIJ')), J(['ABCDEFGHIJ', null, 'ABCDEFGHIJ', false]));
  chk(name, 'EEIC typed as ß×5', 'CONTROL — upper-cased it is exactly 10 characters: kept as SSSSSSSSSS, the field not marked',
    J(typed(SZ.repeat(5))), J(['SSSSSSSSSS', null, SZ.repeat(5), false]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  _w1Release(__bm, []);
  await _w1Settle();
})();
// v2.00 (R2, Brad 11 Oct): THE REFUSAL SAYS THE LIMIT IS ON THE EEIC AS IT IS KEPT -- trimmed and upper-cased -- and names
// what was typed when upper-casing changed it. "The EEIC “SSSSSSSSSSSSSSSSSSSS” is 20 characters" read as wrong to someone who
// typed ten ß. The RCN, kept as typed, keeps item 91's wording. Expected texts are literals. FAILS ON 529e07e except the CONTROL.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = _w1Mark();
  const name = 'v2.00 (R2) — an EEIC refusal says the limit is on the EEIC trimmed and upper-cased';
  try {
  const J = JSON.stringify;
  const { ev } = boot();
  seed(ev, { services: ['USAF', 'ANG'], items: [it('X', 'AV', [500, 700])], disc: [10000, 10000], mand: [0, 0], order: ['X'] });
  // [the status line, the field's own explanation]
  const refused = (field, t) => w1json(ev, `JSON.stringify((function(){ MS.rcn=[{k:'K1', rcn:'11111', eeic:'AAAAA'}]; setStat(''); const el=document.createElement('input');
      el.value=${J(t)}; rcnSet(0,${J(field)},el.value,el);
      return [document.getElementById('shareStat').textContent, el.title]; })())`);
  const SZ = 'ß', W20 = 'S'.repeat(20);
  const eeic = why => J(['⚠ EEIC not changed. ' + why + '.', why]);
  chk(name, 'EEIC typed as ß×10', 'the refusal says the EEIC is measured trimmed and upper-cased, and that the ten ß typed become twenty S',
    J(refused('eeic', SZ.repeat(10))),
    eeic('The EEIC is measured as it is kept, trimmed and upper-cased: “' + SZ.repeat(10) + '” becomes “' + W20 + '”, 20 characters; it can be at most 10. Nothing was changed'));
  chk(name, 'EEIC typed as " abcdefghijk "', 'trimmed and upper-cased it is ABCDEFGHIJK, 11 characters, and the refusal says so',
    J(refused('eeic', ' abcdefghijk ')),
    eeic('The EEIC is measured as it is kept, trimmed and upper-cased: “abcdefghijk” becomes “ABCDEFGHIJK”, 11 characters; it can be at most 10. Nothing was changed'));
  chk(name, 'EEIC typed as ABCDEFGHIJK', 'unchanged by upper-casing: the refusal names it once, 11 characters',
    J(refused('eeic', 'ABCDEFGHIJK')),
    eeic('The EEIC is measured as it is kept, trimmed and upper-cased: “ABCDEFGHIJK” is 11 characters; it can be at most 10. Nothing was changed'));
  chk(name, 'RCN typed as 12345678901', 'CONTROL — the RCN keeps item 91\'s wording',
    J(refused('rcn', '12345678901')),
    J(['⚠ RCN not changed. The RCN “12345678901” is 11 characters; it can be at most 10. Nothing was changed.',
       'The RCN “12345678901” is 11 characters; it can be at most 10. Nothing was changed']));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  _w1Release(__bm, []);
  await _w1Settle();
})();
// ==== end v1.97 W1 ====
// ==== v1.97 W2: every edit the saved file carries marks the board unsaved (item 76) ====
// ==== end v1.97 W2 ====
// ==== v1.97 W3: batch import, Put this back, folder save history (items 77, 78, 79) ====
// ==== end v1.97 W3 ====
// ==== v1.97 W4: a board’s own service list moves dollars with it (item 80) ====
// v1.97, ITEM 80 (review R09): A BOARD'S OWN SERVICE LIST MOVES EACH SERVICE'S DOLLARS WITH IT.
// A board with no data pack keeps its own services (MS.svc). On v1.96 ▲▼ swapped the names and left every per-service
// list where it was, and ✕ cut the award lists from the end and every other list by applyState()'s position refit:
// S1 $100 / S2 $200 moved read S2 $100 / S1 $200, and S1 removed left S2 holding S1's $100. The board is built here
// through its own doors (＋ Add service, ＋ Add requirement), then EVERY kind of per-service list is given a different
// amount on every service, every requirement and line, in two fiscal years. The oracle is the fixture's own numbers,
// read BY NAME: after each change, every list the fixture wrote must hold, at each service's new place, what that
// service held when the fixture wrote it. The walk is generic -- any numeric list of the service width, found in the
// state as written -- so it does not share the board's own list of what to remap.
const { bootMark: _v7w4Mark, bootRelease: _v7w4Release, settleBoards: _v7w4Settle } = await import('./boot.mjs');
const W4S = ['S1', 'S2', 'S3', 'S4', 'S5'];
const w4amt = (y, k, r, s) => (y + 1) * 10000000 + (k + 1) * 100000 + (r + 1) * 1000 + (s + 1) * 10;
const w4vec = (y, k, r, n = W4S.length) => Array.from({ length: n }, (_, s) => w4amt(y, k, r, s));
// k: 0 requirement value, 1 prior-year value, 2 edited value (asks), 3 allocation by service, 4/5 directed disc/mand,
// 6/7 base budget authority disc/mand, 8/9 a funding source in each pool, 10 award increments, 11 WBS lines,
// 12 added CLINs' asks, 13 CLIN allocations, 14 an edited CLIN's ask, 15 a CLIN's WBS lines
const w4year = (y, n) => ({
  ask: [0, 1, 2].map(r => w4vec(y, 0, r, n)), fy26: [0, 1, 2].map(r => w4vec(y, 1, r, n)), asks: [0, 1, 2].map(r => w4vec(y, 2, r, n)),
  alloc: w4vec(y, 3, 0, n), dv: w4vec(y, 4, 0, n), mv: w4vec(y, 5, 0, n), bmD: w4vec(y, 6, 0, n), bmM: w4vec(y, 7, 0, n),
  addD: w4vec(y, 8, 0, n), addM: w4vec(y, 9, 0, n), awd: [0, 1, 2].map(r => w4vec(y, 10, r, n)), wbs: [0, 1].map(r => w4vec(y, 11, r, n)),
  clinNew: [0, 1].map(r => w4vec(y, 12, r, n)), clinAlloc: [0, 1].map(r => w4vec(y, 13, r, n)), clinMeta: w4vec(y, 14, 0, n),
  clinWbs: [0, 1].map(r => w4vec(y, 15, r, n)) });
// R1 directs its split (fsrc), R2 is allocated by service and is a prime with CLINs, R3 takes its whole value.
const W4FILL = `(function(V, fy){
  var ids=S.custom.map(function(c){ return c.id; }), R1=ids[0], R2=ids[1], R3=ids[2];
  S.custom.forEach(function(c,i){ c.ask=V.ask[i].slice(); c.fy26=V.fy26[i].slice(); S.asks[c.id]=V.asks[i].slice(); });
  delete S.fsrc[R2]; S.alloc[R2]={m:'s', v:V.alloc.slice()};
  delete S.fsrc[R3]; delete S.alloc[R3];
  S.fsrc[R1]={m:'split', dv:V.dv.slice(), mv:V.mv.slice()};
  S.bm={disc:V.bmD.slice(), mand:V.bmM.slice(), adds:[{name:'Add D', pool:'disc', vec:V.addD.slice()},{name:'Add M', pool:'mand', vec:V.addM.slice()}]};
  S.awards[R1]={mode:'inc', inc:[{d:(fy-1)+'-11', day:3, sv:V.awd[0].slice()},{d:fy+'-02', day:9, sv:V.awd[1].slice()}]};
  S.awards[R3]={mode:'inc', inc:[{d:fy+'-03', day:12, sv:V.awd[2].slice()}]};
  delete S.awards[R2];
  S.wbs[R1]=[{w:'1.1', v:V.wbs[0].slice()},{w:'1.2', v:V.wbs[1].slice()}];
  S.ptype[R2]='PRIME';
  S.clinNew={}; S.clinNew[R2]=[{key:'n1', clin:'3001', desc:'a', ccar:'', ask:V.clinNew[0].slice()},{key:'n2', clin:'3002', desc:'b', ccar:'', ask:V.clinNew[1].slice()}];
  S.clinAlloc={}; S.clinAlloc[R2]={n1:V.clinAlloc[0].slice(), n2:V.clinAlloc[1].slice()};
  S.clinMeta={}; S.clinMeta[R2]={b0:{ask:V.clinMeta.slice()}};
  S.clinWbs={}; S.clinWbs[R2]={n1:[{w:'2.1', v:V.clinWbs[0].slice()},{w:'2.2', v:V.clinWbs[1].slice()}]};
  applyState(S); MS.years[fy]=S; save(); render(); return 'ok';
})`;
// A board with no data pack, its services and requirements added the way a person adds them.
function w4Template(names, reqs) {
  const B = boot();
  B.ev(`localStorage.setItem('prio27who','w4'); window.__al=[]; window.__cf=[]; window.__pr=0;
    alert=function(m){ window.__al.push(String(m)); }; confirm=function(m){ window.__cf.push(String(m)); return true; };`);
  for (const s of names) B.ev(`prompt=function(){ return ${JSON.stringify(s)}; }; svcAdd();`);
  // v2.07 (item 121): the one writer the Add box ends in, given what the strip wrote -- a title, the event it defaulted to, the
  // value by service, the first office -- and nothing else: no service-width list but the value and its split, no note
  for (const r of reqs) B.ev(`reqCreate(GROUPS[0], {title:${JSON.stringify(r)}, event:'(added at drill)',
    ask:SVC.map(function(s,i){ return 100*(i+1); })}); save(); render(); 'ok'`);
  return B;
}
// Every numeric list of width n in a state, with its path.
function w4walk(node, path, out, n) {
  if (Array.isArray(node)) {
    if (node.length === n && node.length && node.every(v => typeof v === 'number')) { out.push([path, node]); return out; }
    node.forEach((v, i) => w4walk(v, path.concat(i), out, n)); return out;
  }
  if (node && typeof node === 'object') Object.keys(node).forEach(k => { if (k !== 'dataPack') w4walk(node[k], path.concat(k), out, n); });
  return out;
}
const w4at = (o, p) => p.reduce((x, k) => (x == null ? x : x[k]), o);
// Each list the fixture wrote, read at its services' new places, against what each service held when it was written.
// was: the original name of each service now listed (a rename is the same service).
function w4byName(years, names, orig, was = {}) {
  const bad = [];
  for (const [p, v] of orig) {
    const want = names.map(nm => v[W4S.indexOf(was[nm] || nm)]);
    const got = w4at(years, p);
    if (JSON.stringify(got) !== JSON.stringify(want)) bad.push(p.join('.') + ' = ' + JSON.stringify(got) + ', want ' + JSON.stringify(want));
  }
  return bad.length ? bad.length + ' lists hold another service’s dollars: ' + bad.slice(0, 3).join(' · ') : 'every list follows its service';
}
const w4money = v => '$' + Math.round(v).toLocaleString();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = _v7w4Mark();
  const name = 'v1.97 W4 — moving, renaming and removing a service moves its dollars with it, in every year (item 80)';
  try {
  const J = JSON.stringify;
  const B = w4Template(W4S, ['R1', 'R2', 'R3']), ev = B.ev;
  ev(`${W4FILL}(${J(w4year(0))}, 2027)`);
  ev(`switchYear(2028); ${W4FILL}(${J(w4year(1))}, 2028); switchYear(2027); 'ok'`);
  // filed under a service's NAME: a BAE budget per service and lane, an RCN/EEIC override, a PPBE position, the Spruills' service
  ev(`(function(){ var R1=S.custom[0].id; S.budgetAsg[R1]={'S3|disc':'BUD-3D','S3|mand':'BUD-3M','S1':'BUD-1'};
    S.rcnSvc[R1]={S3:'rc3'}; MS.ppbe['PB|2027']={v:2, split:false, lines:{S3:[{k:'_all', all:true}]}, val:{S3:{_all:{2027:{d:7,m:0}}}}};
    MS.spSvc='S3'; spSvc='S3'; MS.spDrillSvc='S1'; spDrillSvc='S1'; svcFilter=1; fcView='s:4'; save(); return 'ok'; })()`);
  const O = JSON.parse(ev(`JSON.stringify(MS.years)`));
  const orig = w4walk(O, [], [], W4S.length);
  const kinds = [...new Set(orig.map(([p]) => p[0] + ' ' + p.slice(1).filter(k => typeof k === 'string' && !/^NEW-/.test(k)).join('.')))].sort();
  const W4KINDS = ['alloc.v', 'asks', 'awards.inc.sv', 'bm.adds.vec', 'bm.disc', 'bm.mand', 'clinAlloc.n1', 'clinAlloc.n2', 'clinMeta.b0.ask',
    'clinNew.ask', 'clinWbs.n1.v', 'custom.ask', 'custom.fy26', 'discSvc', 'fsrc.dv', 'fsrc.mv', 'mandSvc', 'wbs.v'];
  chk(name, 'fixture (control)', 'every kind of per-service list holds a different amount on every service, in FY27 and FY28 (60 lists)',
    J(kinds) + ' ' + orig.length, J(['2027', '2028'].flatMap(y => W4KINDS.map(k => y + ' ' + k)).sort()) + ' 60');
  const svcNow = () => JSON.parse(ev(`JSON.stringify(SVC)`)), yrs = () => JSON.parse(ev(`JSON.stringify(MS.years)`));
  const jr0 = JSON.parse(ev(`JSON.stringify((MS.jrnl||[]).length)`));
  // ▼ on S2, ▲ on S5: both directions, first through last place
  ev(`svcMove(1,1)`);
  chk(name, 'move down', 'S2 moved down: every list in both years holds each service’s own dollars at its new place',
    J(svcNow()) + ' ' + w4byName(yrs(), svcNow(), orig), J(['S1', 'S3', 'S2', 'S4', 'S5']) + ' every list follows its service');
  const jr = JSON.parse(ev(`JSON.stringify((MS.jrnl||[]).slice(${jr0}).map(function(e){ return e.p[0]; }))`));
  chk(name, 'journal', 'the change is one journal line, the service list before and after, not a figure-by-figure record that would put dollars back by place',
    J(jr), J(['(services)']));
  chk(name, 'filters', 'a service filter on screen follows its service (the chip, the forecast view)',
    ev(`JSON.stringify([svcFilter, fcView])`), J([2, 's:4']));
  ev(`svcMove(4,-1)`);
  chk(name, 'move up', 'S5 moved up: every list follows its service',
    J(svcNow()) + ' ' + w4byName(yrs(), svcNow(), orig), J(['S1', 'S3', 'S2', 'S5', 'S4']) + ' every list follows its service');
  // rename: the same service -- its dollars stay where they are, what is filed under its name goes with it
  ev(`window.__al=[]; prompt=function(){ return 's2'; }; svcRen(1)`);
  chk(name, 'rename', 'renaming to a name already in the list (any case) is refused, and nothing changes',
    J(svcNow()) + ' ' + ev(`window.__al.length`), J(['S1', 'S3', 'S2', 'S5', 'S4']) + ' 1');
  ev(`prompt=function(){ return 'S3x'; }; svcRen(1)`);
  chk(name, 'rename', 'S3 renamed S3x: every list keeps its dollars where they were',
    J(svcNow()) + ' ' + w4byName(yrs(), svcNow(), orig, { S3x: 'S3' }), J(['S1', 'S3x', 'S2', 'S5', 'S4']) + ' every list follows its service');
  chk(name, 'rename', 'and what is filed under its name follows it: the BAE budget per lane, the RCN/EEIC override, the PPBE position, the Spruills’ service',
    ev(`JSON.stringify([S.budgetAsg[S.custom[0].id], S.rcnSvc[S.custom[0].id], Object.keys(MS.ppbe['PB|2027'].val), Object.keys(MS.ppbe['PB|2027'].lines), MS.spSvc, spSvc])`),
    J([{ S1: 'BUD-1', 'S3x|disc': 'BUD-3D', 'S3x|mand': 'BUD-3M' }, { S3x: 'rc3' }, ['S3x'], ['S3x'], 'S3x', 'S3x']));
  // remove the first: the confirm says what it holds, per kind, in each year -- the fixture's own sums
  const held = (s) => { const out = {}; [0, 1].forEach(y => { const V = w4year(y);
    const ask = V.ask.reduce((a, v) => a + v[s], 0), alloc = V.dv[s] + V.mv[s] + V.alloc[s] + V.ask[2][s];
    const ba = V.bmD[s] + V.bmM[s] + V.addD[s] + V.addM[s], awd = V.awd.reduce((a, v) => a + v[s], 0);
    [['ask', ask], ['alloc', alloc], ['ba', ba], ['awd', awd]].forEach(([k, v]) => { (out[k] ||= []).push(v); }); }); return out; };
  const h1 = held(0);
  const line = (lbl, v) => '  • ' + lbl + ': ' + w4money(v[0] + v[1]) + ' (FY27 ' + w4money(v[0]) + ', FY28 ' + w4money(v[1]) + ')';
  ev(`window.__cf=[]; svcDel(0)`);
  const ask1 = ev(`window.__cf[0]||''`);
  chk(name, 'delete first', 'removing S1 says first what it holds, per kind, in each year, in whole dollars',
    [line('requirement values', h1.ask), line('allocations', h1.alloc), line('budget authority', h1.ba), line('award increments', h1.awd)]
      .every(l => ask1.indexOf(l) >= 0) ? 'all four, exact' : ask1.slice(0, 300), 'all four, exact');
  chk(name, 'delete first', 'S1 removed: every other service keeps its own dollars, in every list and year',
    J(svcNow()) + ' ' + w4byName(yrs(), svcNow(), orig, { S3x: 'S3' }), J(['S3x', 'S2', 'S5', 'S4']) + ' every list follows its service');
  ev(`svcDel(1)`);
  chk(name, 'delete middle', 'S2 (a middle service) removed: every other service keeps its own dollars',
    J(svcNow()) + ' ' + w4byName(yrs(), svcNow(), orig, { S3x: 'S3' }), J(['S3x', 'S5', 'S4']) + ' every list follows its service');
  ev(`svcDel(2)`);
  chk(name, 'delete last', 'S4 (the last) removed: every other service keeps its own dollars',
    J(svcNow()) + ' ' + w4byName(yrs(), svcNow(), orig, { S3x: 'S3' }), J(['S3x', 'S5']) + ' every list follows its service');
  chk(name, 'filters', 'a filter on a service removed lets go (the chip, the PMO drill’s service); one on a service kept still names it',
    ev(`JSON.stringify([svcFilter, fcView, spDrillSvc, MS.spDrillSvc])`), J([-1, 's:1', 'ALL', 'ALL']));
  // save and reopen: the file names the services in their new order and every figure is on its own service
  const R = boot({ html: ev(`buildSavedHtml()`) });
  chk(name, 'save and reopen', 'the saved board reopens with S3x, S5 and every list, in both years, on its own service',
    R.ev(`JSON.stringify(SVC)`) + ' ' + w4byName(JSON.parse(R.ev(`JSON.stringify(MS.years)`)), JSON.parse(R.ev(`JSON.stringify(SVC)`)), orig, { S3x: 'S3' }),
    J(['S3x', 'S5']) + ' every list follows its service');
  chk(name, 'save and reopen', 'and the figures it shows are S3’s and S5’s: requirement value and budget authority, FY27',
    R.ev(`JSON.stringify([DATA.items.map(function(i){ return i.ask; }), S.discSvc, S.mandSvc])`),
    J([[0, 1, 2].map(r => [w4amt(0, 0, r, 2), w4amt(0, 0, r, 4)]), [w4amt(0, 6, 0, 2) + w4amt(0, 8, 0, 2), w4amt(0, 6, 0, 4) + w4amt(0, 8, 0, 4)],
       [w4amt(0, 7, 0, 2) + w4amt(0, 9, 0, 2), w4amt(0, 7, 0, 4) + w4amt(0, 9, 0, 4)]]));
  chk(name, 'errors (control)', 'no script error on either board', J(B.errors.concat(R.errors)), '[]');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  _v7w4Release(__bm, []);
  await _v7w4Settle();
})();
// A PPBE CYCLE IS A FIXED POINT, read by place against the list: the services it holds keep their names and places.
await (async () => {
  const __bm = _v7w4Mark();
  const name = 'v1.97 W4 — a kept PPBE cycle fixes the services it holds (item 80)';
  try {
  const J = JSON.stringify;
  const B = w4Template(['A', 'B', 'C'], ['R']), ev = B.ev;
  ev(`bmSetBase('disc',0,'1000'); bmSetBase('disc',1,'2000'); bmSetBase('disc',2,'3000'); blCyc='PB'; blYr=2027; cycLock(); 'ok'`);
  const lock0 = ev(`JSON.stringify(CYCDB.cycles)`);
  const was = ev(`JSON.stringify([SVC, S.discSvc, S.custom[0].ask])`);
  ev(`window.__al=[]; svcMove(0,1); svcMove(2,-1); prompt=function(){ return 'Ax'; }; svcRen(0); window.__cf=[]; svcDel(2)`);
  chk(name, 'refused', 'with PB27 locked over A, B, C: ▲▼, rename and ✕ each change nothing, and nothing is asked',
    ev(`JSON.stringify([SVC, S.discSvc, S.custom[0].ask])`) + ' ' + ev(`window.__cf.length`), was + ' 0');
  chk(name, 'refused', 'each says why, naming the cycle and the services it holds',
    ev(`JSON.stringify(window.__al.map(function(m){ return /PB27 \\(locked\\) holds A, B, C/.test(m) && /fixed point/.test(m); }))`), J([true, true, true, true]));
  chk(name, 'kept (control)', 'the cycle itself is untouched', ev(`JSON.stringify(CYCDB.cycles)`) === lock0, true);
  ev(`prompt=function(){ return 'D'; }; svcAdd()`);
  chk(name, 'add (control)', 'a service can still be added at the end', ev(`JSON.stringify([SVC, S.discSvc])`), J([['A', 'B', 'C', 'D'], [1000, 2000, 3000, 0]]));
  ev(`window.__al=[]; svcMove(3,-1)`);
  chk(name, 'refused', 'and moving it into the cycle’s places is refused too', ev(`JSON.stringify([SVC, window.__al.length])`), J([['A', 'B', 'C', 'D'], 1]));
  // the same lock UNLOCKED still reads by place: it fixes the list until it is deleted
  ev(`CYCDB.cycles['PB|2027'].locked=false; window.__al=[]; svcMove(0,1)`);
  chk(name, 'unlocked', 'an unlocked cycle fixes them too, and says it is unlocked',
    ev(`JSON.stringify([SVC, /PB27 \\(unlocked\\)/.test(window.__al[0]||'')])`), J([['A', 'B', 'C', 'D'], true]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  _v7w4Release(__bm, []);
  await _v7w4Settle();
})();
// THE REPROGRAMMING LOG AND A HELD SUBMITTAL read a service by its place too (this appropriation's rows only).
await (async () => {
  const __bm = _v7w4Mark();
  const name = 'v1.97 W4 — reprogramming rows and held submittals follow the list (item 80)';
  try {
  const J = JSON.stringify;
  const B = w4Template(['A', 'B', 'C', 'D'], ['R']), ev = B.ev;
  ev(`RPDB.entries=[{id:'r0',ts:1,ap:APPN,fy:2027,type:'BTR',svc:0,amtM:1},{id:'r2',ts:1,ap:APPN,fy:2027,type:'BTR',svc:2,amtM:2},
    {id:'r3',ts:1,ap:APPN,fy:2027,type:'BTR',svc:'3',amtM:4},{id:'rx',ts:1,ap:'OPN',fy:2027,type:'BTR',svc:0,amtM:3},
    {id:'rn',ts:1,ap:APPN,fy:2027,type:'BTR',svc:1,svcName:'B',svcPos:1,svcBy:'pick',amtM:5},
    {id:'rs',ts:1,ap:APPN,fy:2027,type:'BTR',svc:2,svcName:'A',svcPos:0,svcBy:'pick',amtM:6}];
    PMOSUBS=[{pmo:'PSM', svc:['A','B','C','D'], items:{}, base:{}, added:[], forFy:2027}];
    PMOSUBS[0].items[S.custom[0].id]={asks:[11,22,0,44]}; PMOSUBS[0].base[S.custom[0].id]={asks:[1,2,0,4]}; PMOSUBS[0].baseSeen=PMOSUBS[0].base;
    svcMove(0,1); 'ok'`);
  // rs: an older version moved it to C by its place alone, leaving A's name and seal behind -- the seal no longer matches, so
  // it is read by its place (C), which the swap does not move (v2.02: proved here since the W5 reader checks went)
  chk(name, 'move', 'A and B swapped: this appropriation’s rows follow their service, stamped; a broken seal is read by place; a held submittal’s figures follow theirs',
    ev(`JSON.stringify([RPDB.entries.filter(function(r){ return r.ap===APPN; }).map(function(r){ return r.id+':'+(SVC[r.svc])+':'+(r.ts>1); }),
      PMOSUBS[0].items[S.custom[0].id].asks, PMOSUBS[0].base[S.custom[0].id].asks])`),
    J([['r0:A:true', 'r2:C:false', 'r3:D:false', 'rn:B:true', 'rs:C:false'], [22, 11, 0, 44], [2, 1, 0, 4]]));
  // v1.97 integration: a row named by its service (W5) keeps its name, and its seal moves with its place. (v2.02: the log
  // is carried, not shown -- rpSvcOf went with the tracker -- so the row is read as stored: its name, the seal, its place.)
  chk(name, 'move · a named row', 'rn names B: after the swap it still reads B, sealed at B’s new place',
    ev(`(function(){ const r=RPDB.entries.find(function(x){ return x.id==='rn'; }); return JSON.stringify([r.svcName, rpNamed(r), r.svcPos, r.svc]); })()`),
    J(['B', true, 0, 0]));
  chk(name, 'other (control)', 'a row for another appropriation is not this list’s', ev(`JSON.stringify(RPDB.entries.filter(function(r){ return r.ap!==APPN; }).map(function(r){ return r.svc; }))`), J([0]));
  ev(`window.__al=[]; window.__cf=[]; svcDel(1)`);
  // v2.02: the refusal for reprogramming rows went with the tracker; the held submittal's still stands, and says only that
  chk(name, 'delete refused', 'A has a reprogramming row and a held submittal’s figures: removing it is refused for the submittal alone, before anything is asked',
    ev(`JSON.stringify([SVC, window.__cf.length, /reprogramming/.test(window.__al[0]||''), /submittal held/.test(window.__al[0]||'')])`),
    J([['B', 'A', 'C', 'D'], 0, false, true]));
  ev(`svcDel(2)`);
  chk(name, 'delete', 'C (no submittal figure) has row r2, which carried only its place: C goes; r2 is kept, given C’s name sealed where it stood, and the rows past it move up with their service',
    ev(`JSON.stringify([SVC, RPDB.entries.filter(function(r){ return r.ap===APPN; }).map(function(r){ return r.id+':'+(rpNamed(r)? r.svcName : SVC[r.svc]); }),
      (function(){ const r=RPDB.entries.find(function(x){ return x.id==='r2'; }); return [r.svcName, r.svcBy, r.svc, r.svcPos, r.ts>1]; })(),
      PMOSUBS[0].items[S.custom[0].id].asks])`),
    J([['B', 'A', 'D'], ['r0:A', 'r2:C', 'r3:D', 'rn:B', 'rs:C'], ['C', 'pos', 2, 2, true], [22, 11, 44]]));
  // v1.97 integration: a rename is the same service, and the row named by it follows the new name
  ev(`svcSaveList(['Bz','A','D'], [0,1,2]); 'ok'`);
  chk(name, 'rename · a named row', 'B renamed Bz: the row named B now reads Bz, at the same place, still confirmed',
    ev(`(function(){ const r=RPDB.entries.find(function(x){ return x.id==='rn'; }); return JSON.stringify([SVC, r.svcName, rpNamed(r), SVC[r.svcPos]]); })()`),
    J([['Bz', 'A', 'D'], 'Bz', true, 'Bz']));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  _v7w4Release(__bm, []);
  await _v7w4Settle();
})();
// ON A BOARD WHOSE DATA NAMES ITS SERVICES the list is fixed: ▲▼ and rename were offered there and did nothing.
await (async () => {
  const __bm = _v7w4Mark();
  const name = 'v1.97 W4 — a board whose data names its services offers no ▲▼ or rename (item 80)';
  try {
  const J = JSON.stringify;
  const T = w4Template(['A', 'B', 'C'], ['R']);
  const D = boot({ html: T.ev(`buildSavedHtml()`) }), ev = D.ev;   // saved with a requirement, it reopens on its data pack
  ev(`localStorage.setItem('prio27who','w4'); window.__pr=0; prompt=function(){ window.__pr++; return 'Z'; }; svcPanelOpen=true; render(); 'ok'`);
  chk(name, 'panel', 'the 🏷 Services panel lists A, B, C with no ▲, ▼, rename or ✕, and no ＋ Add',
    ev(`JSON.stringify([SVC_FROM_DATA, [].slice.call(document.querySelectorAll('#svcList b')).map(function(b){ return b.textContent; }), document.querySelectorAll('#svcList button').length])`),
    J([true, ['A', 'B', 'C'], 0]));
  const was = ev(`JSON.stringify([MS.svc, SVC, S.custom[0].ask, S.discSvc])`);
  ev(`svcMove(0,1); svcRen(0); svcSaveList(['B','A','C'], [1,0,2]); 'ok'`);
  chk(name, 'nothing', '▲▼, rename and the list itself change nothing there — not even the stored list — and rename asks nothing',
    ev(`JSON.stringify([MS.svc, SVC, S.custom[0].ask, S.discSvc])`) + ' ' + ev(`window.__pr`), was + ' 0');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  _v7w4Release(__bm, []);
  await _v7w4Settle();
})();
// THE DATA PACK THE BOARD WROTE names its services when the file is next opened. Save rewrites it only while the board
// has a requirement, so a board whose requirements were all removed kept the old list over the new figures.
await (async () => {
  const __bm = _v7w4Mark();
  const name = 'v1.97 W4 — a data pack the board wrote keeps step with its list (item 80)';
  try {
  const J = JSON.stringify;
  const B = w4Template(['A', 'B', 'C'], ['R']), ev = B.ev;
  ev(`bmSetBase('disc',0,'1000'); bmSetBase('disc',1,'2000'); bmSetBase('disc',2,'3000'); save(); removeReq(S.custom[0].id); svcDel(0); 'ok'`);
  const R = boot({ html: ev(`buildSavedHtml()`) });
  chk(name, 'reopen', 'A removed with no requirement left: the file reopens on B, C with B’s and C’s budget authority',
    R.ev(`JSON.stringify([SVC, S.discSvc])`), J([['B', 'C'], [2000, 3000]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  _v7w4Release(__bm, []);
  await _v7w4Settle();
})();
// CONTROL: an award of the wrong width (a damaged record, in a year not opened since) is not cut or padded to look whole
// by the move: applyState's award check repairs it from its total and keeps it as found.
await (async () => {
  const __bm = _v7w4Mark();
  const name = 'v1.97 W4 — an award of the wrong width is repaired from its total, not cut, when the list changes (item 80) — control';
  try {
  const J = JSON.stringify;
  const B = w4Template(['A', 'B', 'C', 'D'], ['R']), ev = B.ev;
  ev(`switchYear(2028); switchYear(2027); MS.years[2028].awards[S.custom[0].id]={mode:'inc', inc:[{d:'2027-11', day:3, sv:[10,20,30]}]}; svcMove(0,1); 'ok'`);
  chk(name, 'repaired (control)', 'the FY28 award keeps its $60, spread over the values and marked, its record kept as found',
    ev(`(function(){ var a=MS.years[2028].awards[S.custom[0].id]; return JSON.stringify([a.inc[0].sv.reduce(function(x,y){ return x+y; },0), a.inc[0].sv.length,
      !!(a.fix && a.fix.how), JSON.parse(awdOrigText(a.fix && a.fix.orig)).inc[0].sv]); })()`), J([60, 4, true, [10, 20, 30]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  _v7w4Release(__bm, []);
  await _v7w4Settle();
})();
// A DATA PACK THAT NAMES REQUIREMENTS BUT NO SERVICES leaves the board keeping its own list -- and its baseline values,
// its budget and its CLINs are read by place against that list too.
await (async () => {
  const __bm = _v7w4Mark();
  const name = 'v1.97 W4 — a board whose data names no services keeps its baseline, budget and CLINs with their service (item 80)';
  try {
  const J = JSON.stringify;
  const store = { base: 2027, cur: 2027, ts: 1, years: { 2027: { order: ['B1'], custom: [], removed: [] } }, svc: ['A', 'B', 'C'],
    dataPack: { services: [], items: [{ id: 'B1', grp: 'PSM', team: 'PSM', sect: '', title: 'Base one', event: 'E', ccar: '', fy26: [7, 8, 9], ask: [100, 200, 300] }],
      budget: [1000, 2000, 3000], clins: { B1: [{ clin: '0001', desc: 'x', ccar: '', ask: [11, 22, 33] }] } } };
  const B = boot({ ls: { prio27om: J(store), prio27who: 'w4' } }), ev = B.ev;
  ev(`confirm=function(){ return true; }; svcMove(0,1); 'ok'`);
  chk(name, 'move', 'A moved down: the baseline value, the prior-year value, the budget and the CLIN’s ask each follow their service',
    ev(`JSON.stringify([SVC, BASE_ASK.B1, itemById('B1').ask, BASE_ITEMS[0].fy26, DATA.budget, CLINS.B1[0].ask])`),
    J([['B', 'A', 'C'], [200, 100, 300], [200, 100, 300], [8, 7, 9], [2000, 1000, 3000], [22, 11, 33]]));
  const R = boot({ html: ev(`buildSavedHtml()`) });
  chk(name, 'save and reopen', 'saved and reopened, B1 asks B $200, A $100, C $300', R.ev(`JSON.stringify([SVC, itemById('B1').ask])`),
    J([['B', 'A', 'C'], [200, 100, 300]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  _v7w4Release(__bm, []);
  await _v7w4Settle();
})();
// CONTROL: with no list before, there is no service to follow. Figures a state held while the list was empty are kept
// as they came in and aligned by place against the first service added, as v1.96 did -- never zeroed by the remap.
await (async () => {
  const __bm = _v7w4Mark();
  const name = 'v1.97 W4 — the first service added takes what the board held before it had a list (item 80) — control';
  try {
  const J = JSON.stringify;
  const B = boot(), ev = B.ev;
  ev(`localStorage.setItem('prio27who','w4'); confirm=function(){ return true; };
    S.bm={disc:[500,600], mand:[50,60], adds:[]}; S.custom=[{id:'NEW-1', grp:'PSM', custom:true, title:'X', event:'', ccar:'', fy26:[0,0], ask:[100,200], alloc:null}];
    S.order=['NEW-1']; applyState(S); MS.years[MS.cur]=S; prompt=function(){ return 'A'; }; svcAdd(); 'ok'`);
  chk(name, 'first service (control)', 'A, the first service, takes the first figure of each list it found', ev(`JSON.stringify([SVC, S.discSvc, S.mandSvc, S.custom[0].ask])`),
    J([['A'], [500], [50], [100]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  _v7w4Release(__bm, []);
  await _v7w4Settle();
})();
// THE JOURNAL records a figure by its place. Put back after the list changed, it would land on whichever service holds
// that place now -- so a journalled figure from before the change is not put back; a single value (a note) still is.
await (async () => {
  const __bm = _v7w4Mark();
  const name = 'v1.97 W4 — a figure journalled before the list changed is not put back on another service (item 80)';
  try {
  const J = JSON.stringify;
  const B = w4Template(['A', 'B', 'C'], ['R']), ev = B.ev;
  ev(`S.custom[0].ask[0]=150; save(); S.notes[S.custom[0].id]='kept'; save(); 'ok'`);
  const at = JSON.parse(ev(`JSON.stringify((MS.jrnl||[]).map(function(e){ return e.p.join('.'); }))`));
  // v2.14 W4: an added requirement's fields are journalled by its id (item 124), no longer by its place in the list
  const iAsk = at.lastIndexOf('custom.' + ev(`S.custom[0].id`) + '.ask.0'), iNote = at.lastIndexOf('notes.' + ev(`S.custom[0].id`));
  ev(`svcMove(0,1); window.__cf=[]; jrnlUndo(${iAsk}); 'ok'`);
  chk(name, 'by place', 'R’s value for A, typed before A moved down, is not put back onto B, now first: nothing changes and nothing is asked',
    ev(`JSON.stringify([SVC, S.custom[0].ask, window.__cf.length])`) + ' ' + (iAsk >= 0), J([['B', 'A', 'C'], [200, 150, 300], 0]) + ' true');
  ev(`jrnlUndo(${iNote}); 'ok'`);
  chk(name, 'one value (control)', 'a note typed before the change can still be put back', ev(`JSON.stringify(S.notes[S.custom[0].id]||null)`) + ' ' + (iNote >= 0), 'null true');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  _v7w4Release(__bm, []);
  await _v7w4Settle();
})();
// ==== end v1.97 W4 ====
// ==== v1.97 W5: the reprogramming log by service and in whole dollars, and its money-map cells (items 81, 62) ====
// ==== end v1.97 W5 ====
// ==== v1.97 W6: the money map’s nine open cells, except the reprogramming log (item 62) ====
// v1.97 INTEGRATION (item 75): THE $M FIELDS ARE READ WHOLE TOO. W1 made every typed dollar figure read whole or not at
// all; the Funds Flow's partner and FMS money and the realignment's need, cap, target and credits are typed in $M and
// were read with parseFloat on what was left after stripping: "abc" made a $12.5M partner figure $0, "1.2.3" was 1.2,
// 1.2345678 put $1,234,567.80 into the Funds Flow export, and "750K" -- the K stripped, the rest taken as millions --
// was $750,000,000. Now: a bare number is millions, K/M/B mean what they say, whole dollars, and a figure that cannot
// be read keeps the one it had. FAILS ON v1.96: [12500000, 0, 1200000, 1234567.8, 750000000, 0] and the realignment's
// need cleared, its target 4 and its cap 1.2.
await (async () => {
  const name = 'v1.97 integration — the $M fields (Funds Flow, realignment) are read whole, and a typo keeps the figure';
  try {
    const J = JSON.stringify;
    const X = boot();
    seed(X.ev, { services: ['USAF', 'USN'], items: [it('A1', 'PSM', [500, 700])], disc: [0, 0], mand: [0, 0], order: ['A1'] });
    const ff = JSON.parse(X.ev(`(function(){ const o=[];
      flowSetOther(2027,'ip','12.5'); o.push(flowCfg().other[2027].ip);
      flowSetOther(2027,'ip','abc');  o.push(flowCfg().other[2027].ip);
      flowSetOther(2027,'ip','1.2.3'); o.push(flowCfg().other[2027].ip);
      flowSetOther(2027,'fms','1.2345678'); o.push(flowCfg().other[2027].fms);
      flowSetOther(2027,'fms','750K'); o.push(flowCfg().other[2027].fms);
      flowSetOther(2027,'fms',''); o.push(flowCfg().other[2027].fms);
      return JSON.stringify(o); })()`));
    chk(name, 'Funds Flow · partner and FMS money', '12.5 is $12,500,000; "abc" and "1.2.3" keep it; 1.2345678 is $1,234,568; 750K is $750,000; a blank clears it',
      J(ff), J([12500000, 12500000, 12500000, 1234568, 750000, 0]));
    const rl = JSON.parse(X.ev(`(function(){ const o=[];
      rlgSetSvc('USAF','2.5'); o.push(rlgSvcNeed.USAF);
      rlgSetSvc('USAF','abc'); o.push(rlgSvcNeed.USAF);
      rlgSetSvc('USAF','');    o.push(rlgSvcNeed.USAF===undefined);
      rlgSet('target','40');   o.push(rlgTarget);
      rlgSet('target','4o');   o.push(rlgTarget);
      rlgSetCap('7.25');       o.push(rlgCapOverride);
      rlgSetCap('1.2.3');      o.push(rlgCapOverride);
      return JSON.stringify(o); })()`));
    chk(name, 'realignment · need, target and cap', 'a figure that cannot be read keeps the one it had; a blank clears the need',
      J(rl), J([2.5, 2.5, true, 40, 40, 7.25, 7.25]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
})();
// v1.97 INTEGRATION: AN IMPORT THAT REORDERS THE SERVICES TAKES THE BUY LINES WITH THEM. svcRemapState() carries every
// per-service list of an incoming board into this board's order; BUY-AC and BUY-ENG's base, adjustment and unit cost were
// not among them (W4 found it by reading), so a file listing its services in another order put each service's buy
// adjustment and cost on another service. Driven through the board's own remap with the file's order [C, A, B] against
// this board's [A, B, C]. FAILS ON v1.96 (the vectors came back unmoved).
await (async () => {
  const name = 'v1.97 integration — an import that reorders the services takes the buy lines with them';
  try {
    const J = JSON.stringify;
    const X = boot();
    const got = X.ev(`JSON.stringify(svcRemapState({buys:{ac:{base:[3,1,2], adj:[30,10,20], cost:[300,100,200], locked:false},
      eng:{base:[6,4,5], adj:[60,40,50], cost:[600,400,500], locked:true}}}, [1,2,0]).buys)`);
    chk(name, 'svcRemapState · buys', 'each buy line’s base, adjustment and unit cost follow their service into this board’s order',
      got, J({ ac: { base: [1, 2, 3], adj: [10, 20, 30], cost: [100, 200, 300], locked: false }, eng: { base: [4, 5, 6], adj: [40, 50, 60], cost: [400, 500, 600], locked: true } }));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
})();
// ==== end v1.97 W6 ====
// ==== v1.98 item 83: RCN/EEIC by service on a prime's CLINs ====
// THE CLIN GRID (Brad, 5 Oct 2026): the CLIN's line stays as it is; its picker is the CLIN's standard for every Air Force
// service on it; "by service" -- only on a CLIN carrying two or more of USAF, ANG and AFRC -- opens one line where a
// service that differs gets its own; an exception is named with that line closed; a service whose money is on no
// combination says "not set" (Brad: flag gaps); each picker offers only the combinations set up for its service(s), and a
// saved choice that no longer fits, or points at a removed combination, is kept and marked, never changed.
// FAILS ON v1.97: one picker per CLIN offering every combination, no button, no line, no flag.
const v198Prime = (state) => {
  const X = boot();
  seed(X.ev, { services: ['USAF', 'ANG', 'AFRC', 'USN'], items: [it('PRIME_P', 'AV', [700, 251, 31, 41])], disc: [5000, 5000, 5000, 5000], mand: [0, 0, 0, 0], order: ['PRIME_P'] });
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.ptype={PRIME_P:'PRIME'};
    S.clinNew={PRIME_P:[{key:'n1',clin:'0001',desc:'air vehicle',ccar:'',ask:[401,251,31,41]},{key:'n2',clin:'0002',desc:'engines',ccar:'',ask:[299,0,0,0]}]};
    S.clinAlloc={PRIME_P:{n1:[401,251,31,41], n2:[299,0,0,0]}};
    MS.rcn=[{k:'K1',rcn:'11111',eeic:'AAAAA',t:'',svc:['USAF','ANG','AFRC']},{k:'K2',rcn:'22222',eeic:'BBBBB',t:'',svc:['ANG']},
            {k:'K3',rcn:'33333',eeic:'CCCCC',t:'',svc:['AFRC']},{k:'K5',rcn:'55555',eeic:'EEEEE',t:'',svc:['USAF']}];
    ${state}
    MS.years[MS.cur]=S; applyState(S); save(); window.confirm=function(){ return true; }; window.alert=function(){}; 'ok'`);
  return X;
};
const v198Cells = (X) => JSON.parse(X.ev(`(function(){ var d=document.createElement('div'); d.innerHTML=clinTable(itemById('PRIME_P'));
  return JSON.stringify([].slice.call(d.querySelectorAll('td.rcnc')).map(function(td){
    var b=td.querySelector('button.rcnby'), g=td.querySelector('.rcngap'), sel=td.querySelector('select');
    return {btn:b? b.textContent.trim() : null, cls:b? b.className : '', gap:g? g.textContent.trim() : null,
      opts:[].slice.call(sel.options).map(function(o){ return o.value+(o.selected?'*':''); }), bad:/rcnbad/.test(sel.className)}; })); })()`));
const v198Strip = (X) => JSON.parse(X.ev(`(function(){ var d=document.createElement('div'); d.innerHTML=clinTable(itemById('PRIME_P'));
  var tr=d.querySelectorAll('tr.rcnsub'); return JSON.stringify([].slice.call(tr).map(function(t){
    return [].slice.call(t.querySelectorAll('label')).map(function(l){ var sel=l.querySelector('select');
      return [l.querySelector('b').textContent, /gap/.test(l.className), [].slice.call(sel.options).map(function(o){ return o.value+(o.selected?'*':''); })]; }); })); })()`));
{
  const name = 'v1.98 item 83 — the CLIN grid: a standard per CLIN, a service that differs, gaps flagged, only fitting combinations offered';
  try {
    const J = JSON.stringify;
    const X = v198Prime(`S.clinRcn={PRIME_P:{n1:'K1', n2:'K1'}};`);
    chk(name, 'standard', 'CLIN 0001 (USAF, ANG, AFRC) offers only K1 -- the one set up for all three -- and a by service button; CLIN 0002 (USAF) offers K1 and K5 and no button',
      J(v198Cells(X)), J([{ btn: 'by service ▾', cls: 'rcnby', gap: null, opts: ['', 'K1*'], bad: false }, { btn: null, cls: '', gap: null, opts: ['', 'K1*', 'K5'], bad: false }]));
    chk(name, 'standard', 'closed, there is no by-service line', J(v198Strip(X)), J([]));
    X.ev(`S.clinRcnSvc={PRIME_P:{n1:{ANG:'K2'}}}; render(); 'ok'`);
    const c1 = v198Cells(X)[0] || {};
    chk(name, 'a service differs', 'with ANG on K2, CLIN 0001’s button names it, with the line closed', J(c1.btn + ' | ' + c1.cls), J('ANG differs ▾ | rcnby on'));
    X.ev(`if(typeof rcnClinOpen==='object') rcnClinOpen['PRIME_P|n1']=true; 'ok'`);
    chk(name, 'by service', 'the line lists CLIN 0001’s three services; each offers "= CLIN’s" and the combinations set up for that service',
      J(v198Strip(X)), J([[['USAF', false, ['*', 'K1', 'K5']], ['ANG', false, ['', 'K1', 'K2*']], ['AFRC', false, ['*', 'K1', 'K3']]]]));
    X.ev(`S.clinRcn={}; render(); 'ok'`);
    chk(name, 'gaps', 'with no standard and nothing on the requirement, CLIN 0001’s USAF and AFRC money is on nothing: the button says so; CLIN 0002 says USAF not set',
      J(v198Cells(X).map(c => [c.btn, c.cls, c.gap])), J([['USAF · AFRC not set ▴', 'rcnby gap', null], [null, '', 'USAF not set']]));
    chk(name, 'gaps', 'and the line marks those two services', J((v198Strip(X)[0] || []).map(l => [l[0], l[1]])), J([['USAF', true], ['ANG', false], ['AFRC', true]]));
    X.ev(`S.rcnAsg={PRIME_P:'K1'}; render(); 'ok'`);
    chk(name, 'the requirement fills in', 'a CLIN with none of its own uses the requirement’s: no gap left, ANG still differs',
      J(v198Cells(X).map(c => [c.btn, c.gap])), J([['ANG differs ▴', null], [null, null]]));
    X.ev(`S.clinRcn={PRIME_P:{n1:'K2'}}; S.clinRcnSvc.PRIME_P.n1.AFRC='GONE'; render(); 'ok'`);
    const c0 = v198Cells(X)[0] || {};
    chk(name, 'kept and marked', 'a saved standard that no longer fits (K2 is ANG only) is kept, selected and marked beside the one that fits; never changed',
      J([c0.opts, c0.bad, X.ev(`S.clinRcn.PRIME_P.n1`)]), J([['', 'K1', 'K2*'], true, 'K2']));
    chk(name, 'kept and marked', 'a pointer at a removed combination is AFRC money on nothing: flagged, and shown as removed in its picker',
      J([c0.btn, (v198Strip(X)[0] || [])[2]]), J(['AFRC not set ▴', ['AFRC', true, ['', 'K1', 'K3', 'GONE*']]]));
    const rec = JSON.parse(X.ev(`(function(){ var f=recFields('PRIME_P', itemById('PRIME_P')).filter(function(x){ return x.l==='RCN / EEIC'; })[0]||{};
      return JSON.stringify([f.set, /not set: CLIN 0001 AFRC/.test(f.n||'')]); })()`));
    chk(name, 'RECORD panel', 'the RCN / EEIC field reads the CLINs: not complete, naming CLIN 0001’s AFRC', J(rec), J([false, true]));
    // the setters, as the controls call them
    const set = JSON.parse(X.ev(`(function(){ if(typeof setRcnClinSvc!=='function') return 'null';
      setRcnClinSvc('PRIME_P','n2','USAF','K5'); var a=JSON.stringify(S.clinRcnSvc.PRIME_P.n2);
      setRcnClinSvc('PRIME_P','n2','USAF',''); var b=JSON.stringify((S.clinRcnSvc.PRIME_P||{}).n2===undefined);
      rcnClinReset('PRIME_P','n1'); return JSON.stringify([a, b, JSON.stringify(S.clinRcnSvc.PRIME_P===undefined)]); })()`));
    chk(name, 'setters', 'a service’s choice is filed under its name; clearing the last one removes the CLIN’s entry; ↺ clears the CLIN',
      J(set), J(['{"USAF":"K5"}', 'true', 'true']));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}
// REMOVING A COMBINATION clears every pointer at it in every year: the requirements', their services', the CLINs' and
// the CLINs' services'. FAILS ON v1.97: rcnUse() counted the CLINs and the confirmation said every assignment was
// cleared, but the CLINs' pointers stayed.
{
  const name = 'v1.98 item 83 — removing a combination clears every pointer at it, the CLINs’ included, in every year';
  try {
    const J = JSON.stringify;
    const X = v198Prime(`S.rcnAsg={PRIME_P:'K2'}; S.rcnSvc={PRIME_P:{ANG:'K2'}}; S.clinRcn={PRIME_P:{n1:'K2', n2:'K1'}};
      S.clinRcnSvc={PRIME_P:{n1:{ANG:'K2', AFRC:'K1'}}};`);
    X.ev(`var y=JSON.parse(JSON.stringify(S)); y.clinRcn={PRIME_P:{n1:'K2'}}; y.clinRcnSvc={PRIME_P:{n2:{ANG:'K2'}}}; MS.years[MS.cur+1]=y; window.__cf=[];
      window.confirm=function(m){ window.__cf.push(String(m)); return true; }; 'ok'`);
    chk(name, 'counted', 'K2 is pointed at eight times across the two years: the requirement, its ANG, a CLIN and a CLIN’s service, in each',
      X.ev(`rcnUse('K2')`), '8');
    X.ev(`rcnDel(1); 'ok'`);
    const left = JSON.parse(X.ev(`JSON.stringify([MS.cur, MS.cur+1].map(function(y){ var t=MS.years[y]||{};
      return [t.rcnAsg, t.rcnSvc, t.clinRcn, t.clinRcnSvc]; }))`));
    chk(name, 'cleared', 'nothing points at K2 in either year; K1’s pointers are kept',
      J(left), J([[{}, {}, { PRIME_P: { n2: 'K1' } }, { PRIME_P: { n1: { AFRC: 'K1' } } }], [{}, {}, {}, {}]]));
    chk(name, 'said', 'the confirmation counted them all', X.ev(`/8 assignments \\(requirements, services and CLINs\\)/.test(window.__cf[0]||'')`), 'true');
    chk(name, 'removed', 'and the list no longer holds K2', X.ev(`JSON.stringify(rcnReg().map(function(e){ return e.k; }))`), J(['K1', 'K3', 'K5']));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}
// AN ADDED CLIN DELETED FOR GOOD takes its RCN/EEIC and WBS with it: clinAdd gives the next one the first free key, so
// what was left was silently the new CLIN's. A CLIN from the board's data, removed, keeps them: it can be put back.
// FAILS ON v1.97: the new CLIN n1 arrived on the deleted one's K2 and its 9.9 WBS.
{
  const name = 'v1.98 item 83 — an added CLIN deleted for good takes its RCN/EEIC and WBS; the next added CLIN starts clean';
  try {
    const J = JSON.stringify;
    const X = v198Prime(`CLINS.PRIME_P=[{clin:'0100', desc:'base line', ccar:'', ask:[0,0,0,0]}];
      S.clinRcn={PRIME_P:{b0:'K1', n1:'K2'}}; S.clinRcnSvc={PRIME_P:{b0:{AFRC:'K3'}, n1:{ANG:'K2'}}};
      S.clinWbs={PRIME_P:{b0:[{w:'1.1', v:[]}], n1:[{w:'9.9', v:[]}]}};`);
    X.ev(`clinRemove('PRIME_P','n1'); var q=['0009','new line']; uiPrompt=function(m,d,cb){ cb(q.shift()); }; clinAdd('PRIME_P'); 'ok'`);
    const after = JSON.parse(X.ev(`JSON.stringify({keys:clinList('PRIME_P').map(function(c){ return c.key+':'+c.clin; }),
      rcn:rcnOfClin('PRIME_P','n1'), svc:JSON.stringify(((S.clinRcnSvc||{}).PRIME_P||{}).n1||null), wbs:wbsClin('PRIME_P','n1')})`));
    chk(name, 'the next added CLIN', 'it takes n1 again, and starts with no combination, no service choice and no WBS of its own',
      J(after), J({ keys: ['b0:0100', 'n2:0002', 'n1:0009'], rcn: '', svc: 'null', wbs: [] }));
    X.ev(`clinRemove('PRIME_P','b0'); 'ok'`);
    const kept = X.ev(`JSON.stringify([S.clinRcn.PRIME_P.b0, S.clinRcnSvc.PRIME_P.b0, S.clinWbs.PRIME_P.b0[0].w])`);
    chk(name, 'a CLIN from the data (control)', 'removed, it keeps its combination, its service choice and its WBS', kept, J(['K1', { AFRC: 'K3' }, '1.1']));
    X.ev(`clinRestore('PRIME_P','b0'); 'ok'`);
    chk(name, 'a CLIN from the data (control)', 'and put back, it is on its combination again', X.ev(`rcnOfClin('PRIME_P','b0')`), 'K1');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}
// A SERVICE RENAMED keeps its CLIN choices; one REMOVED takes them with it -- before the renames, so a service renamed
// onto the freed name keeps its own (AFRES -> ANG in the same change carries K3, never the removed ANG's K2). Every year.
// FAILS ON v1.97: the choices stayed under the old names.
await (async () => {
  const __bm = _v7w4Mark();
  const name = 'v1.98 item 83 — a service renamed keeps its CLIN RCN/EEIC choices; one removed takes them; every year';
  try {
  const J = JSON.stringify;
  const B = w4Template(['USAF', 'ANG', 'AFRC', 'USN'], ['R']), ev = B.ev;
  ev(`var id=S.custom[0].id; S.clinRcnSvc={}; S.clinRcnSvc[id]={n1:{ANG:'K2', AFRC:'K3'}}; MS.years[MS.cur]=S;
    var y=JSON.parse(JSON.stringify(S)); y.clinRcnSvc={}; y.clinRcnSvc[id]={n1:{AFRC:'K3b'}, n2:{ANG:'K2b'}}; MS.years[MS.cur+1]=y; save(); 'ok'`);
  const rd = () => JSON.parse(ev(`JSON.stringify([MS.cur, MS.cur+1].map(function(y){ return (MS.years[y].clinRcnSvc||{})[S.custom[0].id]||null; }))`));
  ev(`svcSaveList(['USAF','ANG','AFRES','USN'], [0,1,2,3]); 'ok'`);
  chk(name, 'renamed', 'AFRC renamed AFRES: its choices follow the new name, in both years', J(rd()),
    J([{ n1: { ANG: 'K2', AFRES: 'K3' } }, { n1: { AFRES: 'K3b' }, n2: { ANG: 'K2b' } }]));
  ev(`svcSaveList(['USAF','ANG','USN'], [0,2,3]); 'ok'`);
  chk(name, 'removed, and a rename onto its name', 'ANG removed and AFRES renamed ANG in one change: the old ANG’s choices are gone, AFRES’s are ANG’s',
    J(rd()), J([{ n1: { ANG: 'K3' } }, { n1: { ANG: 'K3b' } }]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  _v7w4Release(__bm, []);
  await _v7w4Settle();
})();
// A COPY TO ANOTHER YEAR carries a CLIN's service choices with the CLIN's own; the import report counts them; a corrupt
// container is a container again. FAILS ON v1.97: the copy arrived without them, and the report had no line for them.
{
  const name = 'v1.98 item 83 — a copy to another year carries the CLINs’ service choices; the import report counts them';
  try {
    const J = JSON.stringify;
    const X = v198Prime(`S.clinRcn={PRIME_P:{n1:'K1'}}; S.clinRcnSvc={PRIME_P:{n1:{ANG:'K2'}}};`);
    const cp = JSON.parse(X.ev(`(function(){ var r=yearCopy('PRIME_P', MS.cur+1, 'c'); var T=MS.years[MS.cur+1];
      return JSON.stringify([r.ok, (T.clinRcn||{})[r.tid]||null, (T.clinRcnSvc||{})[r.tid]||null]); })()`));
    chk(name, 'copy', 'the copy carries the CLIN’s standard and its ANG', J(cp), J([true, { n1: 'K1' }, { n1: { ANG: 'K2' } }]));
    const inv = JSON.parse(X.ev(`JSON.stringify(importInventory(MS).cats.clinRcnSvc||null)`));
    chk(name, 'import report', 'the report has a line for them, counting both years', J(inv && inv.n !== undefined ? inv.n : inv), J(2));
    X.ev(`S.clinRcnSvc='junk'; applyState(S); 'ok'`);
    chk(name, 'a corrupt container', 'one that arrives as a string is a container again', X.ev(`JSON.stringify([typeof S.clinRcnSvc, Array.isArray(S.clinRcnSvc)])`), J(['object', false]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}
// ==== end v1.98 item 83 ====

// ==== v2.03 item 19: a message that matters stays until it is read ====
// Brad, 21 Oct 2026 (item 19, and "session log, not file"): every message goes through setStat; a warning, a refusal or an
// import's result is kept UNREAD until More, its ✕ or the message list opens it, and ⚠ N unread says so while a later
// message is on the line. The list is this tab's: nothing goes into the board, so a refused import still changes nothing.
// Every expected value below is written by hand from those rules.
await (async () => {
  const name = 'v2.03 — a message that matters stays until it is read (item 19)';
  try {
    const J = JSON.stringify;
    const { ev } = boot();
    seed(ev, { services: SVC3, items: [it('A', 'AV', [5, 7, 11])], disc: [100, 100, 100], mand: [0, 0, 0], order: ['A'] });
    const st = () => JSON.parse(ev(`JSON.stringify({line:document.getElementById('shareStat').textContent,
        flag:document.getElementById('statKeep').hidden? '' : document.getElementById('statKeep').textContent,
        unread:statUnread().map(function(e){ return diagPlain(e.html); })})`));
    ev(`STAT_LOG.length=0; setStat(''); statSync(); 'ok'`);
    // 1. an ordinary message replaced by another leaves nothing unread
    ev(`setStat('Order saved.'); setStat('Filter cleared.'); 'ok'`);
    chk(name, 'ordinary', 'two ordinary messages: the second is on the line and nothing is unread', J(st()), J({ line: 'Filter cleared.', flag: '', unread: [] }));
    // 2. a warning on the line is not "earlier": nothing is flagged while it is still the one showing
    ev(`setStat('⚠ The shared folder could not be read.'); 'ok'`);
    chk(name, 'warning', 'a warning on the line on its own: no flag, it is the one being shown', st().flag, '');
    ev(`STAT_LOG.length=0; 'ok'`);
    // ... and replaced by an ordinary message it stays, flagged
    ev(`setStat('⚠ The shared folder could not be read.'); setStat('Order saved.'); 'ok'`);
    chk(name, 'warning', 'a warning then an ordinary message: the ordinary one is on the line, ⚠ 1 unread beside it, the warning kept',
      J(st()), J({ line: 'Order saved.', flag: '⚠ 1 unread', unread: ['⚠ The shared folder could not be read.'] }));
    // 3. the list shows it first, and opening the list is reading it
    const list = JSON.parse(ev(`(function(){ msgOpen(); const b=document.getElementById('msgBody');
        const r=[document.getElementById('msgPanel').classList.contains('open'), (b.querySelector('tr.unread td:last-child')||{}).textContent||'',
          [].slice.call(b.querySelectorAll('.msgh')).map(function(h){ return h.textContent; })];
        msgClose(); return JSON.stringify(r); })()`));
    chk(name, 'list', 'the list opens with the warning under NOT READ YET (1), the rest under EARLIER',
      J(list), J([true, '⚠ The shared folder could not be read.', ['NOT READ YET (1)', 'EARLIER']]));
    chk(name, 'list', 'once the list has been opened nothing is unread and the flag is gone', J(st()), J({ line: 'Order saved.', flag: '', unread: [] }));
    // 4. More reads the message on the line; so does its ✕
    ev(`setStat('⛔ Nothing was imported — the file is damaged.'); statToggle(); statToggle(); setStat('Order saved.'); 'ok'`);
    chk(name, 'More', 'a refusal opened with More, then replaced: nothing unread', J(st().unread), J([]));
    ev(`setStat('⚠ The deck could not be built.'); statHide(); setStat('Order saved.'); 'ok'`);
    chk(name, '✕', 'a warning hidden with ✕, then replaced: nothing unread', J(st().unread), J([]));
    // 5. an import's result is kept like a warning (statKeep)
    ev(`statKeep('⬅ Imported: Full Fund.'); setStat('Order saved.'); 'ok'`);
    chk(name, 'import result', 'an import result, then an ordinary message: the result is kept unread', J(st().unread), J(['⬅ Imported: Full Fund.']));
    ev(`msgOpen(); msgClose(); 'ok'`);
    // 6. the quiet start-up line is never unread
    ev(`_statQuiet=true; setStat('⚠ opened quietly'); _statQuiet=false; setStat('Order saved.'); 'ok'`);
    chk(name, 'quiet', 'a message said quietly at start-up is not kept unread', J(st().unread), J([]));
    // 7. seventy later messages never push an unread one out
    ev(`setStat('⚠ Kept one.'); for(var i=0;i<70;i++) setStat('Message '+i+'.'); 'ok'`);
    chk(name, 'a long session', 'after 70 later messages the unread warning is still there, and the list holds 60',
      J([st().unread, Number(ev(`STAT_LOG.length`))]), J([['⚠ Kept one.'], 60]));
    ev(`msgOpen(); msgClose(); 'ok'`);
    // 8. a refused import: the message is kept, and the board is exactly as it was (nothing written to the file or the journal)
    const before = ev(`JSON.stringify(MS)`);
    ev(`const _a=window.alert; window.alert=function(){}; try{ inRefuse('bad.html', 'the order holds something that is not a requirement'); }finally{ window.alert=_a; } setStat('Order saved.'); 'ok'`);
    chk(name, 'a refused import', 'its message is kept unread', J(st().unread), J(['⚠ Nothing imported — “bad.html” was refused: the order holds something that is not a requirement.']));
    chk(name, 'a refused import', 'and the store is byte for byte what it was', ev(`JSON.stringify(MS)`) === before, true);
    chk(name, 'the file', 'no message is ever written into the saved board', /Kept one\./.test(ev(`buildSavedHtml()`).replace(/<template id="helpDoc">[\s\S]*?<\/template>/, '')), false);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
})();
// ==== end v2.03 item 19 ====

// ==== v2.03 item 20: a requirement's fields are named in one place ====
// REQ_FIELD names each field once. THE PROOF IS A RENAME: change a label in the registry, at runtime, and every surface
// that names the field must say the new name -- the RECORD panel's three buttons, the pop-up's title, 📋 Requirement edit's
// heading and its field list, the proposal gate, the row's flag and the guide. A surface that spells the name itself keeps
// the old one and fails here by name. (PMO_FIELDS is read once, as the board opens; npm run check holds it to FL().)
await (async () => {
  const name = 'v2.03 — a requirement’s fields are named in one place (item 20)';
  try {
    const J = JSON.stringify;
    const { ev } = boot();
    seed(ev, { services: SVC3, items: [it('A', 'AV', [5, 7, 11]), it('B', 'AV', [1, 1, 1])], disc: [100, 100, 100], mand: [0, 0, 0], order: ['A', 'B'] });
    ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`);
    ev(AR_DRIVE);
    // the names as the board ships them, written by hand
    chk(name, 'the registry', 'the three written fields, with their icons',
      ev(`JSON.stringify([FLI('cons'), FLI('dn'), FLI('rec'), FL('grp'), FL('dest')])`), J(['⚠ Impact statement', '📄 Description & note', '📋 Requirement edit', 'PMO', 'Goes to']));
    // what every surface says, read off the page
    const read = () => JSON.parse(ev(`(function(){
      const r={};
      // a band that requires the impact statement, so the row flags it
      S.band.A='ktlo';   // Keep the Lights On requires the impact statement
      delete (S.cons||{}).A; render(); setCur('A');
      r.buttons=[].slice.call(document.querySelectorAll('#inspector .insp-act .a1')).map(function(b){ return b.textContent.trim(); });
      // v2.08 (item 122): the edit box -- its heading, its impact statement's label and its PMO's
      toggleRec('A'); r.popup=(document.querySelector('label[for="erCons"]')||{}).textContent||'';
      r.recHead=(document.getElementById('erTtl')||{}).textContent||'';
      r.boxGrp=(document.querySelector('label[for="erGrp"]')||{}).textContent||''; erClose();
      r.recFields=recFields('A', itemById('A')).filter(function(f){ return f.k==='grp'; }).map(function(f){ return f.l; });
      // v2.07 (item 121): the gate no longer asks for the PMO, so the field A HAS is its Prime contract / OGC -- a prime, whose
      // WBS is logged per CLIN. A gate that matched the panel's fields by label would read both as missing.
      S.ptype=S.ptype||{}; S.ptype.A='PRIME'; r.ptypeL=FL('ptype'); r.wbsL=FL('wbs');
      r.gate=pmoProposalGate('A');
      // the Add box (v2.07, item 121): its rail, its field labels and its refusal name the fields as the registry does when
      // the box opens -- a list captured once, the way PROPOSAL_MANDATORY was, would go on saying the old names
      __arOpen('AV');
      r.rail=[].slice.call(document.querySelectorAll('#arChk li')).map(function(li){ return li.textContent; }).join(' | ');
      r.labels=['cons','obCat'].map(function(k){ var l=document.querySelector('#arF_'+k+' label'); return l? l.textContent : '(no field)'; });
      __arBtn(/^Add requirement/);
      r.refusal=(document.getElementById('arMsg')||{}).textContent||'';
      toggleAdd(); delete S.ptype.A;
      r.flag=[].slice.call(document.querySelectorAll('#row-A .exc')).map(function(e){ return e.textContent; }).join(' | ');
      r.guide=helpSections().some(function(s){ return /Impact statement/.test(s.el.textContent); });
      r.guideNew=helpSections().some(function(s){ return /Consequence if unfunded/.test(s.el.textContent); });
      return JSON.stringify(r); })()`));
    const a = read();
    chk(name, 'as shipped', 'the RECORD panel’s buttons start with the three names',
      J(['⚠ Impact statement', '📄 Description & note', '📋 Requirement edit'].map((n, i) => (a.buttons[i] || '').startsWith(n))), J([true, true, true]));
    chk(name, 'as shipped', 'the row flags the missing impact statement by its name', /Impact statement required/.test(a.flag), true);
    chk(name, 'as shipped', 'the proposal gate does not list a field the requirement has (its Prime contract / OGC, and a prime’s WBS), and lists one it lacks',
      J([a.gate.indexOf(a.ptypeL) >= 0, a.gate.indexOf(a.wbsL) >= 0, a.gate.indexOf('Impact statement') >= 0]), J([false, false, true]));
    chk(name, 'as shipped', 'the Add box’s rail, its field labels and its refusal name the fields by the registry’s names',
      J([/Impact statement/.test(a.rail), /Obligation category/.test(a.rail), a.labels.map(l => l.split('*')[0]),
         /Impact statement/.test(a.refusal), /Obligation category/.test(a.refusal)]),
      J([true, true, ['Impact statement', 'Obligation category'], true, true]));
    ev(`REQ_FIELD.cons.l='Consequence if unfunded'; REQ_FIELD.dn.l='Notes and description'; REQ_FIELD.rec.l='Record'; REQ_FIELD.grp.l='Office'; REQ_FIELD.obCat.l='How the money leaves'; 'ok'`);
    const b = read();
    ev(`REQ_FIELD.cons.l='Impact statement'; REQ_FIELD.dn.l='Description & note'; REQ_FIELD.rec.l='Requirement edit'; REQ_FIELD.grp.l='PMO'; REQ_FIELD.obCat.l='Obligation category'; render(); 'ok'`);
    chk(name, 'renamed', 'the RECORD panel’s buttons say the new names',
      J(['⚠ Consequence if unfunded', '📄 Notes and description', '📋 Record'].map((n, i) => (b.buttons[i] || '').startsWith(n))), J([true, true, true]));
    chk(name, 'renamed', 'the edit box’s impact statement says the new name', b.popup.includes('Consequence if unfunded'), true);
    chk(name, 'renamed', 'the edit box’s heading says the new name', b.recHead.indexOf('✎ Record —')===0, true);
    chk(name, 'renamed', 'and its PMO field is called what the registry calls it', b.boxGrp.indexOf('Office')===0, true);
    chk(name, 'renamed', 'its PMO field is called what the registry calls it', J(b.recFields), J(['Office']));
    chk(name, 'renamed', 'the proposal gate names the missing fields by the new names (A has no obligation category or impact statement)',
      J(['How the money leaves', 'Consequence if unfunded'].map(n => b.gate.indexOf(n) >= 0)), J([true, true]));
    chk(name, 'renamed', 'the row’s flag says the new name', /Consequence if unfunded required/.test(b.flag), true);
    chk(name, 'renamed', 'the Add box’s rail, field labels and refusal say the new names, and not the old ones',
      J([/Consequence if unfunded/.test(b.rail), /How the money leaves/.test(b.rail), /Impact statement|Obligation category/.test(b.rail),
         b.labels.map(l => l.split('*')[0]), /Consequence if unfunded/.test(b.refusal), /How the money leaves/.test(b.refusal),
         /Impact statement|Obligation category/.test(b.refusal)]),
      J([true, true, false, ['Consequence if unfunded', 'How the money leaves'], true, true, false]));
    chk(name, 'renamed', 'the guide says the new name, and not the old one', J([b.guideNew, b.guide]), J([true, false]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
})();
// ==== end v2.03 item 20 ====

// ==== v2.05 item 116 ====
// ═══ v2.05 (item 116; Brad, 23 Oct 2026) — EACH APPROPRIATION IS LOCKED ON ITS OWN BOARD, NAMED, AND SEEN SIDE BY SIDE ═══════════
// "I need to have the ability to lock each appropriation against a PPBE cycle, not just one comprehensive lock." A lock always
// was one appropriation's; nothing on screen said so. The fixture makes every reading disagree: O&M (the board on screen) locks
// PB27 here; Full Fund has PB27 locked by its lead and is tagged BES28; Initial Spares locked PB27 and reopened it and is still
// tagged PB27; OPN holds nothing. So the overview must tell locked from reopened from never, name who and when, find the
// calendar the others are on (BES28, the latest tag, not the commonest), say which are behind it, leave OPN out of "not locked
// yet" (it holds no plan), and write nothing into any other appropriation's storage.
await (async () => {
  const name = 'v2.05 — each appropriation is locked on its own board, named, and seen side by side (item 116)';
  try {
  const J = JSON.stringify;
  const T1 = 1790100000000, T2 = 1790200000000;
  const ffStore = { ts: T1, base: 2027, cur: 2027, cycle: 'BES|2028', years: { 2027: { order: [], alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [] } } };
  const spStore = { ts: T1, base: 2027, cur: 2027, cycle: 'PB|2027', years: { 2027: { order: [], alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [] } } };
  const ffCyc = { ts: T1, cycles: { 'PB|2027': { cyc: 'PB', cycYr: 2027, ap: 'ff', locked: true, ts: T1, by: 'F Lead', first: { ts: T1, by: 'F Lead' }, unlocks: [], years: {}, proj: {} } } };
  const spCyc = { ts: T2, cycles: { 'PB|2027': { cyc: 'PB', cycYr: 2027, ap: 'sp', locked: false, ts: T1, by: 'S Lead', unlocks: [{ ts: T2, by: 'S Lead', on: false }], years: {}, proj: {} } } };
  const LS = { prio27ff: JSON.stringify(ffStore), 'prio27ff-cyc': JSON.stringify(ffCyc), prio27sp: JSON.stringify(spStore), 'prio27sp-cyc': JSON.stringify(spCyc) };
  const { ev, errors } = boot({ ls: LS });
  seed(ev, { services: ['USAF', 'ANG'], items: [it('A', 'PSM', [100, 50]), it('B', 'AV', [80, 40])], disc: [150, 60], mand: [20, 10], order: ['A', 'B'] });
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); MS.cycle=''; save(); 'ok'`);
  const OTHERS = ['prio27ff', 'prio27ff-cyc', 'prio27sp', 'prio27sp-cyc', 'prio27opn', 'prio27opn-cyc', 'prio27appn'];
  const otherLs = () => J(OTHERS.map(k => ev(`localStorage.getItem(${J(k)})`)));
  const before = otherLs();
  // ---- the lock, named, and what has not locked it yet
  ev(`blCyc='PB'; blYr=2027; cycLock(); 'ok'`);
  const stat = ev(`(document.getElementById('shareStat')||{}).textContent||''`);
  chk(name, 'lock', 'the status names the appropriation’s lock: O&M PB27', /O&M PB27 locked/.test(stat), true);
  chk(name, 'lock', 'and names what holds a plan and has not locked PB27 -- Initial Spares (reopened), not Full Fund (locked), not OPN (no plan)',
    (/Not locked as PB27 yet: (.*?) — each is locked on its own board/.exec(stat) || [])[1] || 'not said', 'Initial Spares');
  const me = ev('whoAmI()');
  // ---- the overview, as data
  const O = JSON.parse(ev(`JSON.stringify((function(){ var O=cycOverview(); return {lead:O.lead, keys:O.keys, rows:O.rows.map(function(r){
      return [r.k, r.own, r.held, r.tag, r.behind, cycCellOf(r.cycles['PB|2027'])]; })}; })())`));
  chk(name, 'overview', 'every appropriation, in order; the board on screen marked; which hold a plan',
    J(O.rows.map(r => [r[0], r[1], r[2]])), J([['om', true, true], ['ff', false, true], ['sp', false, true], ['opn', false, false]]));
  chk(name, 'overview', 'each one’s working tag, read from its own saved state', J(O.rows.map(r => r[3])), J(['PB|2027', 'BES|2028', 'PB|2027', '']));
  chk(name, 'overview', 'the calendar the others are on is the latest tag (BES28), not the commonest (PB27)', O.lead, 'BES|2028');
  chk(name, 'overview', 'behind it: O&M and Initial Spares; not Full Fund, and not OPN, which holds no plan', J(O.rows.map(r => r[4])), J([true, false, true, false]));
  chk(name, 'overview', 'PB27: locked here (by this editor), locked by F Lead, reopened by S Lead, never on OPN',
    J(O.rows.map(r => [r[5].s, r[5].by, r[0] === 'om' ? 'now' : r[5].ts])), J([['locked', me, 'now'], ['locked', 'F Lead', T1], ['open', 'S Lead', T2], ['none', undefined, undefined]]));
  // ---- the overview, as drawn in the PPBE cycles panel
  ev(`blOpen=true; render(); 'ok'`);
  const D = JSON.parse(ev(`JSON.stringify((function(){ var t=document.querySelector('#blBody .cyc-ovt'); if(!t) return null;
      return {rows:[].slice.call(t.querySelectorAll('tbody tr')).map(function(tr){ return [tr.getAttribute('data-ap'),
        [].slice.call(tr.querySelectorAll('td')).map(function(td){ return td.textContent.replace(/\\s+/g,' ').trim(); })]; }),
        head:[].slice.call(t.querySelectorAll('thead th')).map(function(th){ return th.textContent.trim(); }),
        step:((document.querySelector('#blBody .cyc-ov-step')||{}).textContent||'').replace(/\\s+/g,' ').trim(),
        retag:!!document.querySelector('#blBody .cyc-ov-step button[onclick="cycRetagLead()"]'),
        list:((document.querySelector('#blBody table.po:not(.cyc-ovt) tbody td b')||{}).textContent||''),
        lockBtn:([].slice.call(document.querySelectorAll('#blBody button')).filter(function(b){ return /^🔒 Lock /.test(b.textContent); })[0]||{}).textContent||''}; })())`));
  chk(name, 'panel', 'the table is drawn: Appropriation, Working plan, one column per cycle any of them holds', J(D && D.head), J(['Appropriation', 'Working plan', 'PB27', '']));
  chk(name, 'panel', 'each row says what the data says, and Go to is on every other appropriation’s row, never on this board’s',
    J(D.rows.map(r => [r[0], r[1][1].replace(/ ⚠ behind$/, '|behind'), (/not locked|reopened|locked/.exec(r[1][2]) || [''])[0], / · (F Lead|S Lead)$/.test(r[1][2]) ? RegExp.$1 : '', r[1][3]])),
    J([['om', 'PB27|behind', 'locked', '', ''], ['ff', 'BES28', 'locked', 'F Lead', 'Go to Full Fund'], ['sp', 'PB27|behind', 'reopened', 'S Lead', 'Go to Initial Spares'], ['opn', '—', 'not locked', '', 'Go to OPN']]));
  chk(name, 'panel', 'it says who is behind the calendar and what the others are on',
    /O&M is still tagged PB27; Initial Spares is still tagged PB27; Full Fund is on BES28/.test(D.step), true);
  chk(name, 'panel', 'and offers the retag on this board only, because this board is behind', D.retag, true);
  chk(name, 'panel', 'the cycles list and the lock button name the appropriation', J([D.list, /^🔒 Lock O&M FY\d\d(–FY\d\d)? as PB27$/.test(D.lockBtn)]), J(['O&M PB27', true]));
  // ---- the retag moves this board to the calendar, and nothing else
  ev(`cycRetagLead(); 'ok'`);
  chk(name, 'retag', 'O&M is retagged BES28, and no longer behind', J([ev('MS.cycle'), JSON.parse(ev('JSON.stringify(cycOverview().rows[0].behind)'))]), J(['BES|2028', false]));
  // ---- the locked view says whose lock it is: the title, the header tag, every file name
  ev(`cycView('PB|2027'); 'ok'`);
  chk(name, 'view', 'the window title, the header tag and a file name say O&M PB27',
    J([/O&M PB27 LOCKED VIEW$/.test(ev('document.title')), ev(`(document.getElementById('cycTag')||{}).textContent`), /\[O&M PB27 LOCKED\]/.test(ev(`expName('ORBIT x.xlsx')`))]),
    J([true, 'VIEWING O&M PB27 (locked)', true]));
  ev(`cycLeave(true); 'ok'`);
  // ---- Go to: the appropriation switch, and a mark this browser reads when that board opens
  // v2.14 W3: the stand-in says a switch happened (switchAppn returns true when it reopens); one returning nothing reads as a
  // switch that did not happen, and cycGoAppn takes its mark back
  ev(`window.__sw=[]; window.__swWas=switchAppn; switchAppn=function(a){ window.__sw.push(a); return true; }; blOpen=true; render();
      var b=document.querySelector('#blBody tr[data-ap="ff"] button'); if(b) b.click(); switchAppn=window.__swWas; 'ok'`);
  chk(name, 'go to', 'Go to Full Fund switches to FULL FUND and leaves the mark for it', J([JSON.parse(ev('JSON.stringify(window.__sw)')), ev(`localStorage.getItem('prio27cycGo')`)]), J([['FULL FUND'], 'ff']));
  ev(`localStorage.removeItem('prio27cycGo'); 'ok'`);
  chk(name, 'storage', 'nothing was written into another appropriation’s storage', otherLs(), before);
  chk(name, 'errors', 'no page error', errors.length, 0);
  // ---- the Full Fund board, opened from the mark: PPBE cycles open, the mark gone
  const F = boot({ appn: 'FULL FUND', ls: Object.assign({}, LS, { prio27cycGo: 'ff' }) });
  chk(name, 'go to', 'the board it opens is Full Fund, with PPBE cycles open, and the mark is gone',
    J([F.ev('mySlug()'), F.ev('String(blOpen)'), F.ev(`localStorage.getItem('prio27cycGo')`)]), J(['ff', 'true', null]));
  // ---- the Initial Spares board, behind the calendar: its opening says so and offers the retag
  const P = boot({ appn: 'INITIAL SPARES', ls: LS });
  const ps = P.ev(`(document.getElementById('shareStat')||{}).textContent||''`);
  chk(name, 'opening', 'a board behind the calendar says so when it opens, and offers the retag',
    J([/Initial Spares is tagged PB27, and the other appropriations are on BES28/.test(ps), !!P.ev(`String(!!document.querySelector('#shareStat button[onclick="cycRetagLead()"]'))`).match(/true/)]), J([true, true]));
  const N = boot({ appn: 'FULL FUND', ls: LS });
  chk(name, 'opening', 'a board on the calendar says nothing of it', /other appropriations are on/.test(N.ev(`(document.getElementById('shareStat')||{}).textContent||''`)), false);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
})();
// ==== end v2.05 item 116 ====

// ==== v2.06 items 119, 120 ====
// ═══ v2.06 (items 119, 120; Brad, 23 Oct 2026) — PPBE BUDGET POSITIONS: THE TOTAL CORNERS, AND FIGURES ENTERED IN $K ═══════════
// 119: both TOTAL rows closed on a bare <td></td>, so the Total column stopped one row short. Each corner is read off the
// rendered box and held to BOTH its row and the column above it, split on and off. 120: USAF's exhibits are in $K and were
// typed as printed, so BES28 USAF FY27 read $2.28M for $2.28B. The fixture logs USAF in $K and STOVL in dollars, so a rule
// applied to every service, or to none, cannot pass; the conversion is undone and the setting travels through a reopen.
await (async () => {
  const name = 'v2.06 — PPBE Budget Positions: the TOTAL corners, and figures entered in $K (items 119, 120)';
  try {
  const J = JSON.stringify;
  const { ev, errors } = boot({});
  seed(ev, { services: ['USAF', 'ANG', 'STOVL'], items: [it('A', 'PSM', [100, 50, 30])], disc: [150, 60, 40], mand: [20, 10, 5], order: ['A'] });
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); save(); 'ok'`);
  ev(`window.confirm=function(){ return true; }; window.alert=function(){}; MS.ppbe=MS.ppbe||{}; ppCyc='BES'; ppYr=2028; ppOpen=true; ppSvcIdx=0;
      ppLineAdd('USAF'); ppLineAdd('USAF');
      var L=ppPos().lines.USAF; window.__k1=L[0].k; window.__k2=L[1].k;
      ppSetV('USAF',__k1,2027,'d','15,828'); ppSetV('USAF',__k1,2028,'d','2,000'); ppSetV('USAF',__k2,2027,'d','500');
      ppSetV('USAF',__k2,2026,'d','7,000'); ppSetV('STOVL','si_OT',2026,'d','41,000,000');   // the window's FIRST year carries money
      ppSetV('STOVL','si_LA',2027,'d','1,250,130,000'); ppSetV('STOVL','si_EN',2028,'d','303,460,000'); render(); 'ok'`);
  // ---- read a table's cells off the rendered box
  const read = () => JSON.parse(ev(`(function(){ var t=document.querySelectorAll('#ppBody table.fctab');
      function rows(tb){ return [].slice.call(tb.querySelectorAll('tr')).map(function(r){ return [].slice.call(r.children).map(function(c){ return (c.firstChild&&c.firstChild.nodeType===3? c.firstChild.textContent : c.textContent).trim(); }); }); }
      return JSON.stringify({svc:rows(t[0]), roll:rows(t[1])}); })()`));
  const m = s => (s === '—' || s === '') ? 0 : Math.round(parseFloat(String(s).replace(/[$,M]/g, '')) * 100);   // $M to the cent shown
  // each printed figure is rounded to the cent of the $M shown, so n figures may sit n cents off the corner they add to
  const near = (got, cells) => { const want = cells.reduce((t, x) => t + m(x), 0); return Math.abs(got - want) <= cells.length ? got : want; };
  const corner = (tab, label) => { const hdr = tab[0], r = tab.find(x => x[0] === label); const ti = hdr.indexOf('Total');
    return { r, ti, cell: r ? r[ti] : undefined, yrs: r ? r.slice(1, ti) : [], body: tab.slice(1).filter(x => x !== r && x.length === hdr.length) }; };
  const holds = (split) => {
    const T = read();
    const s = corner(T.svc, 'USAF TOTAL'), a = corner(T.roll, 'ALL SERVICES');
    chk(name, 'item 119' + split, 'the USAF TOTAL row has a Total, and it is its row', J([s.cell !== undefined && s.cell !== '' && s.cell !== '—', m(s.cell)]), J([true, near(m(s.cell), s.yrs)]));
    const sCol = s.body.filter(x => x[0] !== '').map(x => x[s.ti]);
    chk(name, 'item 119' + split, 'the USAF TOTAL corner is the Total column above it', m(s.cell), near(m(s.cell), sCol));
    chk(name, 'item 119' + split, 'the ALL SERVICES row has a Total, and it is its row', J([a.cell !== undefined && a.cell !== '' && a.cell !== '—', m(a.cell)]), J([true, near(m(a.cell), a.yrs)]));
    chk(name, 'item 119' + split, 'the ALL SERVICES corner is the service Totals above it', m(a.cell), near(m(a.cell), a.body.map(x => x[a.ti])));
    return T;
  };
  holds('');
  const lbl118 = (when) => chk(name, 'item 118', 'each RCN / EEIC label cell is marked not to wrap, and the label column carries a width' + when,
    J([ev(`String(document.querySelectorAll('#ppBody table.fctab')[0].querySelectorAll('td.pplbl').length)`), /(^|;)\s*width:\s*\d+px/.test(ev(`document.querySelector('#ppBody table.fctab th').getAttribute('style')`))]), J(['2', true]));
  lbl118(' (one figure per line)');
  // ---- 120: USAF to $K. Its three figures were typed in thousands; the conversion multiplies them, and only them
  ev(`ppUnitSet('USAF','k'); 'ok'`);
  const val = () => JSON.parse(ev(`JSON.stringify(ppPos().val)`));
  let V = val();
  chk(name, 'item 120', 'turning USAF to $K, told yes, multiplies its figures by 1,000', J([V.USAF[ev('__k1')][2027].d, V.USAF[ev('__k1')][2028].d, V.USAF[ev('__k2')][2027].d]), J([15828000, 2000000, 500000]));
  chk(name, 'item 120', 'and STOVL, entered in dollars, is untouched', J([V.STOVL.si_LA[2027].d, V.STOVL.si_EN[2028].d]), J([1250130000, 303460000]));
  chk(name, 'item 120', 'USAF FY27 now totals $16.33M in dollars', ev(`String(ppSvcFy(ppPos(),'USAF',2027).t)`), '16328000');
  // a bare number is thousands; one with its own unit is read as written; a fraction of a thousand is not rounded first
  ev(`ppSetV('USAF',__k2,2027,'d','2,280,000'); ppSetV('USAF',__k2,2028,'d','15.8M'); ppSetV('USAF',__k1,2029,'d','15,828.5'); 'ok'`);
  V = val();
  chk(name, 'item 120', 'under $K, 2,280,000 is $2,280,000,000; 15.8M is $15,800,000; 15,828.5 is $15,828,500',
    J([V.USAF[ev('__k2')][2027].d, V.USAF[ev('__k2')][2028].d, V.USAF[ev('__k1')][2029].d]), J([2280000000, 15800000, 15828500]));
  ev(`ppSetV('STOVL','si_LA',2029,'d','15,828'); 'ok'`);
  chk(name, 'item 120', 'STOVL, still in dollars, reads 15,828 as $15,828', val().STOVL.si_LA[2029].d, 15828);
  ev(`ppSvcIdx=0; render(); 'ok'`);
  const box = JSON.parse(ev(`JSON.stringify({v:[].slice.call(document.querySelectorAll('#ppBody table.fctab')[0].querySelectorAll('input[onchange^="ppSetV"]')).map(function(i){ return i.value; }).filter(Boolean),
      h:document.querySelector('#ppBody table.fctab th').textContent, u:[].slice.call(document.querySelectorAll('#ppBody .ppunit button[aria-pressed="true"]')).map(function(b){ return b.textContent; }).join()==='$K'})`));
  chk(name, 'item 120', 'the USAF boxes show $K, the heading says so, and $K is the pressed choice',
    J([box.v.includes('2,280,000') && box.v.includes('15,828') && box.v.includes('15,828.5'), /figures in \$K/.test(box.h), box.u]), J([true, true, true]));
  const T2 = holds(' ($K)');
  const usafRoll = T2.roll.find(x => x[0] === 'USAF');
  chk(name, 'item 120', 'the roll-up prints USAF FY27 as $2,295.83M', usafRoll[T2.roll[0].indexOf('FY27')], '$2,295.83M');
  // ---- the setting and the conversion travel with the board
  const html = ev(`buildSavedHtml()`);
  const R = boot({ html });
  chk(name, 'item 120', 'after a reopen USAF is still entered in $K, with its conversion on record, and the dollars are the same',
    J([R.ev(`String(ppUnitK(MS.ppbe['BES|2028'],'USAF'))`), R.ev(`String(!!MS.ppbe['BES|2028'].kx.USAF)`), R.ev(`String(ppSvcFy(MS.ppbe['BES|2028'],'USAF',2027).t)`)]),
    J(['true', 'true', '2295828000']));
  // ---- undo (review fix): only the cells the conversion multiplied are divided; the three typed since stay as typed
  ev(`ppUnitUndo('USAF'); 'ok'`);
  V = val();
  chk(name, 'item 120', 'undo divides the figures the conversion multiplied, leaves the ones typed since, and returns USAF to dollars',
    J([V.USAF[ev('__k1')][2027].d, V.USAF[ev('__k1')][2028].d, V.USAF[ev('__k2')][2027].d, V.USAF[ev('__k2')][2028].d, V.USAF[ev('__k1')][2029].d,
       ev(`String(ppUnitK(ppPos(),'USAF'))`), ev(`String(!!(ppPos().kx||{}).USAF)`)]),
    J([15828, 2000, 2280000000, 15800000, 15828500, 'false', 'false']));
  // a record that names a figure which would not come back to a whole dollar (only a hand-made file can carry one) is refused
  ev(`(function(){ const P=ppPos(); P.unit=P.unit||{}; P.unit.USAF='k'; P.kx=P.kx||{}; P.kx.USAF={t:1, cells:[[__k1,'2029','d',15828500]]}; })(); ppUnitUndo('USAF'); 'ok'`);
  chk(name, 'item 120', 'the undo is refused while $15,828,500 cannot come back to a whole dollar', J([val().USAF[ev('__k1')][2029].d, ev(`String(ppUnitK(ppPos(),'USAF'))`)]), J([15828500, 'true']));
  ev(`(function(){ const P=ppPos(); delete P.kx.USAF; delete P.unit.USAF; })(); 'ok'`);
  // ---- told no: the setting turns on and no stored figure moves; turning it off never moves one either
  ev(`window.confirm=function(){ return false; }; ppUnitSet('USAF','k'); 'ok'`);
  chk(name, 'item 120', 'told no, $K is on and nothing stored moved', J([ev(`String(ppUnitK(ppPos(),'USAF'))`), val().USAF[ev('__k1')][2027].d]), J(['true', 15828]));
  ev(`ppUnitSet('USAF',''); 'ok'`);
  chk(name, 'item 120', 'turning $K off moves nothing', J([ev(`String(ppUnitK(ppPos(),'USAF'))`), val().USAF[ev('__k1')][2027].d]), J(['false', 15828]));
  // ---- split on: the corners carry the D · M line and still close
  ev(`window.confirm=function(){ return true; }; ppSplitSet(true); ppSetV('USAF',__k1,2027,'m','1,000'); render(); 'ok'`);
  holds(' (split)');
  const dm = ev(`(document.querySelectorAll('#ppBody table.fctab')[0].querySelector('td.pptot')||{}).textContent||''`);
  chk(name, 'item 119 (split)', 'the USAF TOTAL corner states its D and M', /^\$[\d.,]+M\$[\d.,]+M D · \$[\d.,]+M M$/.test(dm), true);
  // ---- 118: an RCN / EEIC line's label cell never wraps, and its column has a width
  lbl118(' (split)');
  chk(name, 'errors', 'no page error', errors.length, 0);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
})();
// ==== end v2.06 items 119, 120 ====

// ==== v2.06 review fixes (PPBE) ====
// ═══ v2.06 — THE PRE-MERGE REVIEW'S PPBE FIXES (25 Oct 2026) ═══════════════════════════════════════════════════════════════════
// A service renamed kept its "$K" setting under the old name, so the next figure typed as printed was stored at a thousandth;
// the undo divided figures typed since and stayed offered with $K off; the rounding message named a figure 1,000 times too
// small; and ALL SERVICES' corner counted a service the board no longer lists with no row above it. Each fails on be4de83.
await (async () => {
  const name = 'v2.06 — the pre-merge review’s PPBE fixes: a rename keeps $K, the undo puts back only what it multiplied, the message, a service no longer listed';
  try {
  const J = JSON.stringify;
  const B = w4Template(['USAF', 'ANG', 'STOVL'], ['R']), ev = B.ev;
  ev(`MS.ppbe=MS.ppbe||{}; ppCyc='BES'; ppYr=2028; ppSvcIdx=0; ppOpen=true;
      ppLineAdd('USAF'); var L=ppPos().lines.USAF; window.__k=L[0].k;
      ppSetV('USAF',__k,2027,'d','15,828'); ppSetV('USAF',__k,2028,'d','2,000'); ppUnitSet('USAF','k'); 'ok'`);
  const val = () => JSON.parse(ev(`JSON.stringify(ppPos().val)`));
  chk(name, 'fixture', 'USAF in $K, its two figures multiplied', J([val().USAF[ev('__k')][2027].d, val().USAF[ev('__k')][2028].d]), J([15828000, 2000000]));
  // ---- 5: the message names what was read
  ev(`ppSetV('USAF',__k,2029,'d','1,234.5675'); 'ok'`);
  chk(name, '5 · the message', 'a fractional thousand is stored to the dollar, and the message names that dollar figure',
    J([val().USAF[ev('__k')][2029].d, /\$1,234,568/.test(ev(`document.getElementById('shareStat').textContent`))]), J([1234568, true]));
  // ---- 4: a figure typed since is not divided
  ev(`ppSetV('USAF',__k,2029,'d','15.8M'); ppSetV('USAF',__k,2030,'d','3,000'); window.__cf=[]; ppUnitUndo('USAF'); 'ok'`);
  const u = val().USAF[ev('__k')];
  chk(name, '4 · the undo', 'undo divides the two figures it multiplied and leaves the two typed since, and says so',
    J([u[2027].d, u[2028].d, u[2029].d, u[2030].d, /2 other figures on USAF, typed or changed since, are left as they are/.test(ev(`window.__cf.join('|')`))]), J([15828, 2000, 15800000, 3000000, true]));
  ev(`ppUnitSet('USAF','k'); 'ok'`);
  chk(name, '4 · the undo', 'turned on again with figures in place, it asks and multiplies them', JSON.parse(ev(`JSON.stringify(ppPos().val.USAF[__k][2027].d)`)), 15828000);
  ev(`ppUnitSet('USAF',''); 'ok'`);
  chk(name, '4 · the undo', 'turned off, the ×1,000 record goes and no undo is offered',
    J([ev(`String(!!(ppPos().kx||{}).USAF)`), ev(`String([].slice.call(document.querySelectorAll('#ppBody .ppunit button')).some(function(b){ return /undo/.test(b.textContent); }))`)]), J(['false', 'false']));
  // ---- 3: a renamed service keeps its $K setting and its record
  ev(`ppUnitSet('USAF','k'); svcSaveList(['USAF-A','ANG','STOVL'], [0,1,2]); 'ok'`);
  chk(name, '3 · a rename', 'USAF renamed USAF-A keeps $K and its ×1,000 record',
    J([ev(`String(ppUnitK(ppPos(),'USAF-A'))`), ev(`String(!!(ppPos().kx||{})['USAF-A'])`), ev(`String(!!(ppPos().unit||{}).USAF)`)]), J(['true', 'true', 'false']));
  ev(`ppSetV('USAF-A',__k,2031,'d','7,000'); 'ok'`);
  chk(name, '3 · a rename', 'and a figure typed as printed after the rename is read in $K', JSON.parse(ev(`JSON.stringify(ppPos().val['USAF-A'][__k][2031].d)`)), 7000000);
  // ---- 6: a service the position holds that the board no longer lists
  ev(`ppPos().val.OLDSVC={x:{2027:{d:5000000,m:0}}}; render(); 'ok'`);
  const roll = JSON.parse(ev(`(function(){ var t=document.querySelectorAll('#ppBody table.fctab')[1]; return JSON.stringify([].slice.call(t.querySelectorAll('tr')).map(function(r){ return [].slice.call(r.children).map(function(c){ return (c.firstChild&&c.firstChild.nodeType===3? c.firstChild.textContent : c.textContent).trim(); }); })); })()`));
  const ti = roll[0].indexOf('Total'), m = s => (s === '—' || !s) ? 0 : Math.round(parseFloat(String(s).replace(/[$,M]/g, '')) * 100);
  const body = roll.slice(1, -1), all = roll[roll.length - 1];
  chk(name, '6 · not on this board', 'the service the board no longer lists is a row, and ALL SERVICES’ corner is the column above it',
    J([body.some(r => /^OLDSVC/.test(r[0])), Math.abs(m(all[ti]) - body.reduce((t, r) => t + m(r[ti]), 0)) <= body.length]), J([true, true]));
  chk(name, 'errors', 'no page error', B.errors.length, 0);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
})();
// ==== end v2.06 review fixes (PPBE) ====

// ==== v2.06 second review (PPBE) ====
// ═══ v2.06 — THE SECOND REVIEW: A RENAME ONTO A NAME A PPBE POSITION STILL HOLDS (25 Oct 2026) ═════════════════════════════════
// A position keeps a service that left the list, by name. Removing ANG and renaming USAF to ANG -- in one save, or ANG removed
// first -- laid USAF's figures over ANG's, and USAF took ANG's $K setting: a figure typed for it was then stored 1,000 times too
// large. Such a rename is refused, naming the position. Fails on 1e3e313.
await (async () => {
  const name = 'v2.06 — the second review: a service is not renamed onto a name a PPBE position still holds';
  try {
  const J = JSON.stringify;
  const B = w4Template(['USAF', 'ANG', 'STOVL'], ['R']), ev = B.ev;
  ev(`window.__al=[]; window.alert=function(m){ window.__al.push(String(m)); }; window.confirm=function(){ return true; };
      MS.ppbe=MS.ppbe||{}; ppCyc='BES'; ppYr=2028; ppSvcIdx=0; ppOpen=true;
      ppLineAdd('ANG'); window.__a=ppPos().lines.ANG[0].k; ppSetV('ANG',__a,2027,'d','2,000'); ppUnitSet('ANG','k');
      ppLineAdd('USAF'); window.__u=ppPos().lines.USAF[0].k; ppSetV('USAF',__u,2027,'d','5,000,000'); 'ok'`);
  const pos = () => JSON.parse(ev(`JSON.stringify({unit:ppPos().unit||{}, kx:Object.keys(ppPos().kx||{}), val:ppPos().val})`));
  chk(name, 'fixture', 'ANG in $K holds $2,000,000; USAF in dollars holds $5,000,000',
    J([pos().val.ANG[ev('__a')][2027].d, pos().val.USAF[ev('__u')][2027].d, pos().unit.ANG]), J([2000000, 5000000, 'k']));
  // in one save: ANG removed, USAF renamed ANG
  const one = ev(`String(svcSaveList(['ANG','STOVL'], [0,2]))`);
  let P = pos();
  chk(name, 'one save', 'removing ANG and renaming USAF onto its name is refused, naming the position, and nothing moves',
    J([one, ev('SVC.join()'), /BES28/.test(ev(`window.__al.join('|')`)), P.val.ANG[ev('__a')][2027].d, P.val.USAF[ev('__u')][2027].d, P.unit.ANG, P.unit.USAF || '']),
    J(['false', 'USAF,ANG,STOVL', true, 2000000, 5000000, 'k', '']));
  // in two: ANG removed (the position keeps it), then USAF renamed ANG
  ev(`window.__al=[]; svcSaveList(['USAF','STOVL'], [0,2]); 'ok'`);
  chk(name, 'two saves', 'ANG removed, the position still holds its $2,000,000 and its $K setting',
    J([ev('SVC.join()'), pos().val.ANG[ev('__a')][2027].d, pos().unit.ANG]), J(['USAF,STOVL', 2000000, 'k']));
  const two = ev(`String(svcSaveList(['ANG','STOVL'], [0,1]))`);
  P = pos();
  chk(name, 'two saves', 'then renaming USAF to ANG is refused, and USAF keeps its dollars and its own entry',
    J([two, ev('SVC.join()'), P.val.ANG[ev('__a')][2027].d, P.val.USAF[ev('__u')][2027].d, P.unit.USAF || '']), J(['false', 'USAF,STOVL', 2000000, 5000000, '']));
  // CONTROL: a rename onto a name nothing holds goes through
  chk(name, 'control', 'renaming USAF onto a fresh name is taken', J([ev(`String(svcSaveList(['USAF-A','STOVL'], [0,1]))`), ev('SVC.join()')]), J(['true', 'USAF-A,STOVL']));
  chk(name, 'errors', 'no page error', B.errors.length, 0);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
})();
// ==== end v2.06 second review (PPBE) ====
// ==== v2.07 (found by the hostile sweep) ====
// ═══ v2.07 — A BAE FILE ENTRY WITH NO DATE, AN ESTIMATE WITH NO TOTALS: THE BOARD STILL DRAWS ═══════════════════════════════════
// Found while the hostile fixture was given real shapes: the BAE register printed each file's date with
// new Date(ts).toISOString(), which throws on an entry with no readable date, and the Spruills read an estimate's
// appropriation totals as A.tot[y], which throws on one carrying none. Both run inside render(), so while either panel was
// open every redraw stopped there and nothing after it was drawn. Neither shape is refused at the door; both are drawn as
// what they are.
await (async () => {
  const name = 'v2.07 — a BAE file entry with no date, or an estimate with no totals, does not stop the board drawing';
  try {
  const J = JSON.stringify;
  const B = w4Template(['USAF', 'ANG'], ['R']), ev = B.ev;
  const drew = () => ev(`(function(){ try{ render(); return 'drew'; }catch(e){ return 'threw: '+e.message; } })()`);
  ev(`BUDDB={ts:1790000000201, files:[{dept:'USAF', file:'bae.xlsx', n:1}, 'x'], rows:[{n:'USAF O&M- CAM Discretionary R'}]}; _budRegCache=null;
      budOpen=true; 'ok'`);
  chk(name, 'BAE register', 'open on a file entry with no date, and one that is not an entry: every redraw still draws', drew(), 'drew');
  chk(name, 'BAE register', 'the entry with no date is listed, its date a dash',
    ev(`(function(){ var r=[].slice.call(document.querySelectorAll('#budRegPanel tr')).map(function(t){ return t.textContent; }).filter(function(t){ return /bae\.xlsx/.test(t); }); return r.length+' · '+/—$/.test(r[0]||''); })()`), '1 · true');
  ev(`budOpen=false; render();
      ACEDB.sets=ACEDB.sets||{}; ACEDB.sets.X={appn:{}}; APPN_SLUGS.forEach(function(k){ ACEDB.sets.X.appn[k]={pmo:{R:{2027:900}}}; });
      spAce='X'; spOpen=true; 'ok'`);
  chk(name, 'Spruills', 'open on an estimate whose appropriations carry no totals: every redraw still draws', drew(), 'drew');
  chk(name, 'Spruills', 'and the panel is drawn', ev(`(document.getElementById('spBody')||document.getElementById('spPanel')||{}).textContent.length>0`), true);
  ev(`spOpen=false; spAce='board'; render(); 'ok'`);
  chk(name, 'errors', 'no page error', B.errors.length, 0);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
})();
// ==== end v2.07 (found by the hostile sweep) ====

// ==== v2.08: the defects found mapping item 122 (F1, F3, F4, F6, F7, the absorber; Brad, 26 Oct 2026) ====
// Each was reproduced on v2.07 by recovery/v208/repro/found-on-main.mjs. Every expected value below is written out here, from
// the fixture, and every check fails on v2.07 unless it is marked CONTROL.
await (async () => {
  const name = 'v2.08 — the defects found mapping item 122: band, office, Goes to, Classify, a copy’s CLINs and absorber';
  try {
  const J = JSON.stringify;
  const itx = (id, grp, ask) => ({ id, title: 'Req ' + id, event: 'EV-' + id, grp, ask });
  const mk = (sc) => { const b = boot(); seed(b.ev, sc); b.ev(`window.alert=function(m){ window._al=(window._al||[]).concat([String(m)]); }; window.confirm=function(){ return true; }; render(); 'ok'`); return b; };
  const part = (tag, fn) => { try { fn(); } catch (e) { failures.push({ scenario: name, where: tag, what: 'the part threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' }); } };

  // ---- F1: clearing the decision band leaves the impact statement -- through the RECORD panel's own select
  part('F1', () => {
    const { ev } = mk({ services: ['USAF'], items: [itx('A', 'PSM', [100])], disc: [100], mand: [0], order: ['A'] });
    ev(`S.cons.A='Depot line stops in March. '+'x'.repeat(400); S.band.A=BANDS_LIST()[0].id; save(); setCur('A'); render(); 'ok'`);
    chk(name, 'F1', 'fixture: A carries a band and a 427-character impact statement', ev(`[!!S.band.A, (S.cons.A||'').length].join(' · ')`), 'true · 427');
    ev(`(function(){ var s=document.querySelector('#inspector select[onchange^="setBand("]'); s.value=''; s.dispatchEvent(new Event('change')); return 'ok'; })()`);
    chk(name, 'F1', 'the band is cleared', ev(`S.band.A===undefined`), true);
    chk(name, 'F1', 'and the impact statement is still there, whole', ev(`(S.cons.A||'').length`), 427);
  });

  // ---- F2: a redraw keeps what is typed in the RECORD panel's own figures, until it is committed
  part('F2', () => {
    const { ev } = mk({ services: ['USAF', 'ANG'], items: [itx('A', 'PSM', [100, 50]), itx('B', 'PSM', [70, 0])], disc: [300, 300], mand: [0, 0], order: ['A', 'B'] });
    ev(`setCur('A'); render(); 'ok'`);
    const q = sel => `document.querySelector('#inspector input[onchange^=${JSON.stringify(sel)}]')`;
    // typed into the value with the keyboard in it (the one field a browser leaves uncommitted: leaving a field commits it)
    ev(`(function(){ var a=${q('setAsk(')}; a.focus(); a.value='123456'; a.dispatchEvent(new Event('input')); return 'ok'; })()`);
    ev(`render(); render(); 'ok'`);
    chk(name, 'F2', 'two redraws later the value by service still holds what was typed', ev(`${q('setAsk(')}.value`), '123456');
    // v2.09 W1: the keyboard and "nothing written" are read here, before the keyboard leaves the value. Since v2.09 a figure put
    // back by a redraw and then left is applied (heldCommit, item 125), as a browser applies any field left after typing; v2.08
    // left it unapplied, the old figure kept under the one on screen. So the minimum increment is typed once the value is left.
    chk(name, 'F2', 'and the keyboard is still in the value it was typing', ev(`document.activeElement===${q('setAsk(')}`), true);
    chk(name, 'F2', 'nothing was written while it was only typed', ev(`JSON.stringify([itemById('A').ask[0], (S.minInc||{}).A||null])`), JSON.stringify([100, null]));
    ev(`(function(){ var m=${q('setMinInc(')}; m.focus(); return 'ok'; })()`);
    chk(name, 'F2', 'left for the minimum increment, the value put back is applied (v2.09)', ev(`itemById('A').ask[0]`), 123456);
    ev(`(function(){ var m=${q('setMinInc(')}; m.focus(); m.value='777'; m.dispatchEvent(new Event('input')); return 'ok'; })()`);
    ev(`render(); 'ok'`);
    chk(name, 'F2', 'and so does the minimum increment, typed with the keyboard in it', ev(`${q('setMinInc(')}.value`), '777');
    chk(name, 'F2', 'and the minimum increment is not written while it is only typed', ev(`JSON.stringify((S.minInc||{}).A||null)`), 'null');
    ev(`(function(){ var m=${q('setMinInc(')}; m.dispatchEvent(new Event('change')); return 'ok'; })()`);
    chk(name, 'F2', 'committed, the minimum increment is written', ev(`(S.minInc||{}).A`), 777);
    ev(`setCur('B'); render(); 'ok'`);
    chk(name, 'F2', 'CONTROL — typing never follows the panel to another requirement', ev(`${q('setMinInc(')}.value`), '');
  });

  // ---- F3: the office it is already in changes nothing; a bulk set leaves rows already set alone
  part('F3', () => {
    const { ev } = mk({ services: ['USAF'], items: [itx('A', 'PSM', [100]), itx('B', 'PSM', [100]), itx('C', 'PSM', [100]), itx('D', 'AV', [100])],
      disc: [400], mand: [0], order: ['A', 'B', 'C', 'D'] });
    ev(`S.pmoOrder.PSM=['A','B','C']; S.pmoOrder.AV=['D']; save(); 'ok'`);
    const j0 = ev(`(MS.jrnl||[]).length`);
    ev(`setGrp('A','PSM'); 'ok'`);
    chk(name, 'F3', 'setGrp(A, the office it is in) leaves the PSM ranking as it was', ev(`JSON.stringify(S.pmoOrder.PSM)`), J(['A', 'B', 'C']));
    chk(name, 'F3', 'and says it is already there', ev(`/is already in PSM/.test(document.getElementById('shareStat').textContent)`), true);
    chk(name, 'F3', 'and journals nothing', ev(`(MS.jrnl||[]).length`), Number(j0));
    ev(`matPmo='ALL'; matMissing=''; matSet('bulkF','grp'); matSet('bulkV','PSM'); 'ok'`);
    const P = JSON.parse(ev(`JSON.stringify(matBulkPreview())`));
    chk(name, 'F3', 'CONTROL: the bulk preview counts three already PSM and one to move', [P.same, P.differ].join(' · '), '3 · 1');
    ev(`matApplyBulk(); 'ok'`);
    chk(name, 'F3', 'a bulk PSM set moves only D, last; A, B and C keep their order', ev(`JSON.stringify(S.pmoOrder.PSM)`), J(['A', 'B', 'C', 'D']));
    chk(name, 'F3', 'its line says it was written on one requirement, not four', ev(`/set to <b>PSM<[/]b> on 1 requirement /.test(document.getElementById('shareStat').innerHTML)`), true);
    chk(name, 'F3', 'and its line says three were left alone', ev(`/3 already said it and were left alone/.test(document.getElementById('shareStat').textContent)`), true);
  });

  // ---- F4: a Goes to that is not a government activity takes the second hop and the MIPR type with it
  part('F4', () => {
    const { ev } = mk({ services: ['USAF'], items: [itx('A', 'PSM', [100]), itx('B', 'PSM', [100]), itx('C', 'PSM', [100])],
      disc: [300], mand: [0], order: ['A', 'B', 'C'] });
    ev(`setDest('A','to','pax'); setDest('A','end','lm'); setMipr('A','direct'); setDest('A','to','pw'); 'ok'`);
    chk(name, 'F4', 'A switched to Pratt & Whitney: the stored second hop is cleared', ev(`(S.dest.A||{}).end===undefined`), true);
    chk(name, 'F4', 'its MIPR type is cleared', ev(`(S.mipr||{}).A===undefined`), true);
    chk(name, 'F4', 'and its final destination is the prime', ev(`destEndOf(itemById('A'))`), 'pw');
    chk(name, 'F4', 'the funds flow by final destination files it under Pratt & Whitney', ev(`JSON.stringify(flowDestResolve(['A'],'end'))`), J(['pw']));
    ev(`setDest('A','to','pax'); setMipr('A','reimb'); setDest('A','to',''); 'ok'`);
    chk(name, 'F4', 'Goes to cleared takes the MIPR type and the record with it', ev(`[(S.dest||{}).A===undefined, (S.mipr||{}).A===undefined].join(' · ')`), 'true · true');
    // a board saved before v2.08: B is on a prime with a hidden second hop and MIPR type
    ev(`S.dest.B={to:'pw', end:'lm'}; S.mipr.B='direct'; save(); 'ok'`);
    chk(name, 'F4', 'one saved before: the hidden second hop is read as nothing', ev(`destEndOf(itemById('B'))`), 'pw');
    chk(name, 'F4', 'its MIPR type is read as nothing', ev(`miprOf('B')`), '');
    chk(name, 'F4', 'and nothing is deleted from the file', ev(`[S.dest.B.end, S.mipr.B].join(' · ')`), 'lm · direct');
    ev(`setDest('C','to','pax'); setDest('C','end','lm'); setMipr('C','direct'); 'ok'`);
    chk(name, 'F4', 'CONTROL: an OGC keeps both', ev(`[destEndOf(itemById('C')), miprOf('C')].join(' · ')`), 'lm · direct');
  });

  // ---- F7: Classify's per-service RCN / EEIC column sets RCN / EEIC, never the budget
  part('F7', () => {
    const { ev } = mk({ services: ['USAF', 'ANG', 'AFRC'], items: [itx('A', 'AV', [100, 50, 0]), itx('B', 'AV', [10, 0, 0])],
      disc: [300, 300, 300], mand: [0, 0, 0], order: ['A', 'B'] });
    const OM = ['USAF O&M - ANG CAM Discretionary AV', 'USAF O&M- CAM Discretionary AV', 'USAF O&M - CAM OBBBA Mandatory AV'];
    ev(`MS.rcn=[{k:'K1', rcn:'11111', eeic:'AAAAA', t:'', svc:['USAF','ANG','AFRC']}, {k:'K2', rcn:'22222', eeic:'BBBBB', t:'', svc:['ANG']}];
        BUDDB={ts:1700000000009, files:[], rows:${J(OM)}.map(budParseName).filter(Boolean)}; _budRegCache=null;
        matOpen=true; rcnSvcOpen['A']=true; render(); 'ok'`);
    const offered = JSON.parse(ev(`JSON.stringify([].map.call(document.querySelectorAll('#matBody .mat-bulk select')[0].options, function(o){ return [o.value, o.textContent]; }))`));
    chk(name, 'F7', 'the bulk set offers the per-service column under its own label', J(offered.filter(o => o[0] === 'rcnSvc|USAF')), J([['rcnSvc|USAF', '↳ USAF']]));
    ev(`(function(){ var s=document.querySelectorAll('#matBody .mat-bulk select')[0]; s.value='rcnSvc|USAF'; s.dispatchEvent(new Event('change')); return 'ok'; })()`);
    chk(name, 'F7', 'its values are the combinations USAF can carry, not budget names',
      ev(`JSON.stringify([].map.call(document.querySelectorAll('#matBody .mat-bulk select')[1].options, function(o){ return o.value; }))`), J(['', 'K1']));
    ev(`(function(){ var s=document.querySelectorAll('#matBody .mat-bulk select')[1]; s.value='K1'; s.dispatchEvent(new Event('change'));
        document.querySelector('#matBody button[onclick="matApplyBulk()"]').click(); return 'ok'; })()`);
    chk(name, 'F7', 'applied, it writes USAF’s RCN / EEIC on both rows', ev(`JSON.stringify([((S.rcnSvc||{}).A||{}).USAF, ((S.rcnSvc||{}).B||{}).USAF])`), J(['K1', 'K1']));
    chk(name, 'F7', 'and no budget', ev(`JSON.stringify(S.budgetAsg||{})`), '{}');
    chk(name, 'F7', 'CONTROL: every column the grid draws has a bulk setter', ev(`JSON.stringify(matBulkOk())`), '[]');
  });

  // ---- F6 and the absorber: a PMO copy cannot change a prime's CLINs or the shortfall absorber, and says so
  part('F6', () => {
    const items = [itx('A', 'PSM', [100, 50, 0]), itx('B', 'PSM', [80, 0, 0])];
    const P0 = mk({ services: ['USAF', 'ANG', 'AFRC'], items, disc: [300, 300, 300], mand: [0, 0, 0], order: ['A', 'B'] });
    P0.ev(`(function(){ BASE_ITEMS.length=0; ${J(items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); S.ptype.A='PRIME'; save(); render(); return 'ok'; })()`);
    P0.ev(`window.prompt=function(m){ return /number/.test(m)? 'CLIN77' : 'Spares'; }; clinAdd('A'); 'ok'`);
    chk(name, 'F6', 'CONTROL: on the portfolio board a CLIN can be added', P0.ev(`clinList('A').some(function(c){ return c.clin==='CLIN77'; })`), true);
    const html = P0.ev(String.raw`(function(){ const mode={sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, ap:APPN,
      base:pmoBaseline(), pv:PMO_PV, ord:JSON.parse(JSON.stringify(S.pmoOrder||{}))}; return pmoCopyHtml(mode); })()`);
    const C = boot({ html }); const ev = C.ev;
    ev(`window.alert=function(m){ window._al=(window._al||[]).concat([String(m)]); }; window.confirm=function(){ return true; }; render(); 'ok'`);
    const before = ev(`JSON.stringify([S.clinNew||{}, S.clinMeta||{}, S.clinAlloc||{}, S.clinWbs||{}, S.absorb||'', S.absorbFloor||0])`);
    const k = ev(`(clinList('A')[0]||{}).key`);
    // v2.09 W1: clinSetAsk below -- the CLIN request is typed per service (item 125); still one of the seven CLIN writers
    ev(`window.prompt=function(m){ return /number/.test(m)? 'CLIN88' : 'More'; }; clinAdd('A');
        clinSetAsk('A',${J(k)},0,'500'); setClinSvc('A',${J(k)},0,'40'); wbsStore('clin','A',${J(k)},[{w:'P1.2',v:[]}]);
        window.prompt=function(){ return 'JSF5555'; }; clinSetField('A',${J(k)},'ccar'); clinRemove('A',${J(k)}); clinResetGrid('A');
        setAbsorber('B',true); setAbsorbFloor('1000'); 'ok'`);
    chk(name, 'F6', 'in the copy, nothing in the CLIN drill or the absorber changed',
      ev(`JSON.stringify([S.clinNew||{}, S.clinMeta||{}, S.clinAlloc||{}, S.clinWbs||{}, S.absorb||'', S.absorbFloor||0])`), before);
    chk(name, 'F6', 'each CLIN writer said why (seven refusals)', ev(`(window._al||[]).filter(function(m){ return /CLIN breakdown is kept by the portfolio team/.test(m); }).length`), 7);
    chk(name, 'absorber', 'the absorber and its floor were refused as allocation (two refusals)', ev(`(window._al||[]).filter(function(m){ return /allocation is set by the portfolio team/.test(m); }).length`), 2);
    ev(`toggleClin('A'); render(); 'ok'`);
    chk(name, 'F6', 'the drill says it is read only in a copy', ev(`!!document.querySelector('.clin-detail .clin-locked')`), true);
    chk(name, 'F6', 'CONTROL: the portfolio board’s drill says nothing of the kind', P0.ev(`toggleClin('A'); render(); !!document.querySelector('.clin-detail .clin-locked')`), false);
  });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
})();
// ==== end v2.08 defects ====

// ==== v2.08 -- the review of the defect fixes (26 Oct 2026) ====
// Each part fails on the board the reviewers read (65cc26a); expected values are written out here.
await (async () => {
  const name = 'v2.08 — the review of the defect fixes: Classify’s per-service bulk and office cell, WBS from execution in a copy, a redraw that commits';
  try {
  const itx = (id, grp, ask) => ({ id, title: 'Req ' + id, event: 'EV-' + id, grp, ask });
  const part = (tag, fn) => { try { fn(); } catch (e) { failures.push({ scenario: name, where: tag, what: 'the part threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' }); } };
  const mk = (sc) => { const b = boot(); seed(b.ev, sc); b.ev(`window.__al=[]; window.alert=function(m){ __al.push(String(m)); }; window.confirm=function(){ return true; }; render(); 'ok'`); return b; };

  // ---- the per-service RCN / EEIC bulk set reaches only the rows that offer that service's line
  part('rcnSvc bulk', () => {
    const { ev } = mk({ services: ['USAF', 'ANG', 'AFRC'], items: [itx('A', 'AV', [100, 50, 0]), itx('B', 'AV', [10, 0, 0]), itx('C', 'AV', [0, 40, 0])],
      disc: [300, 300, 300], mand: [0, 0, 0], order: ['A', 'B', 'C'] });
    ev(`MS.rcn=[{k:'K1', rcn:'11111', eeic:'AAAAA', t:'', svc:['USAF','ANG','AFRC']}]; matOpen=true; rcnSvcOpen.A=true; matPmo='ALL'; matMissing='';
        matSet('bulkF','rcnSvc|USAF'); matSet('bulkV','K1'); 'ok'`);
    const P = JSON.parse(ev(`JSON.stringify(matBulkPreview())`));
    chk(name, 'rcnSvc bulk', 'the preview reaches A and B, which carry USAF, and leaves C alone', JSON.stringify([P.n, P.skip]), JSON.stringify([2, 1]));
    ev(`matApplyBulk(); 'ok'`);
    chk(name, 'rcnSvc bulk', 'and writes USAF’s line on A and B only', ev(`JSON.stringify(S.rcnSvc||{})`), JSON.stringify({ A: { USAF: 'K1' }, B: { USAF: 'K1' } }));
  });

  // ---- Classify's office cell: a keyboard move only moves; Enter or leaving it chooses
  part('office cell', () => {
    const { ev } = mk({ services: ['USAF'], items: [itx('A', 'PSM', [100]), itx('B', 'PSM', [100])], disc: [200], mand: [0], order: ['A', 'B'] });
    ev(`S.pmoOrder.PSM=['A','B']; save(); matOpen=true; render(); 'ok'`);
    const sel = `[].filter.call(document.querySelectorAll('#matBody select'), function(s){ return (s.getAttribute('onchange')||'').indexOf('setGrp(')>=0 && (s.getAttribute('onchange')||'').indexOf('"A"')>=0; })[0]`;
    // ArrowDown to the next office and ArrowUp back, as Chromium fires change on each
    ev(`(function(){ var s=${sel}; var o=s.value;
        s.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowDown'})); s.value=GROUPS[(GROUPS.indexOf(o)+1)%GROUPS.length]; s.dispatchEvent(new Event('change'));
        s=${sel}; s.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowUp'})); s.value=o; s.dispatchEvent(new Event('change')); return 'ok'; })()`);
    chk(name, 'office cell', 'arrowing past an office and back moves nothing: A is still first in PSM', JSON.stringify([ev(`grpOf(itemById('A'))`), ev(`JSON.stringify(S.pmoOrder.PSM)`)]), JSON.stringify(['PSM', '["A","B"]']));
    ev(`(function(){ var s=${sel}; s.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowDown'})); s.value='AV'; s.dispatchEvent(new Event('change'));
        s.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter'})); return 'ok'; })()`);
    chk(name, 'office cell', 'Enter chooses: A moves to AV', ev(`grpOf(itemById('A'))`), 'AV');
  });

  // ---- WBS from execution data in a PMO copy: a CLIN's is left, counted, and nothing is refused one alert at a time
  part('WBS from execution', () => {
    const items = [itx('A', 'PSM', [100]), itx('P', 'PSM', [100])];
    const P0 = mk({ services: ['USAF'], items, disc: [300], mand: [0], order: ['A', 'P'] });
    P0.ev(`(function(){ BASE_ITEMS.length=0; ${JSON.stringify(items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); S.ptype.P='PRIME'; save(); return 'ok'; })()`);
    const html = P0.ev(String.raw`(function(){ const mode={sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, ap:APPN,
      base:pmoBaseline(), pv:PMO_PV, ord:JSON.parse(JSON.stringify(S.pmoOrder||{}))}; return pmoCopyHtml(mode); })()`);
    const C = boot({ html }); const ev = C.ev;
    ev(`window.__al=[]; window.alert=function(m){ __al.push(String(m)); };
        execWbsScan=function(){ return {props:[{kind:'req', id:'A', para:'1.2'}, {kind:'clin', id:'P', clinKey:'k1', para:'2.1'}, {kind:'clin', id:'P', clinKey:'k2', para:'2.2'}], conflicts:[]}; };
        exwApply(); 'ok'`);
    chk(name, 'WBS from execution', 'in a copy: 1 written, 2 on a CLIN left alone, and no alert', JSON.stringify([ev(`JSON.stringify(S.wbs.A)`), ev(`document.getElementById('shareStat').textContent.indexOf('1</b> written')>=0 || /\\b1 written/.test(document.getElementById('shareStat').textContent)`),
        ev(`document.getElementById('shareStat').textContent.indexOf('2 on a CLIN left alone')>=0`), ev(`__al.length`)]),
      JSON.stringify(['[{"w":"1.2","v":[]}]', true, true, 0]));
  });

  // ---- a destination counted as in use only where the board reads it
  part('destination use', () => {
    const { ev } = mk({ services: ['USAF'], items: [itx('A', 'PSM', [100]), itx('B', 'PSM', [100])], disc: [200], mand: [0], order: ['A', 'B'] });
    ev(`S.dest={A:{to:'pw', end:'lm'}, B:{to:'pax', end:'lm'}}; save(); 'ok'`);   // A's 'lm' is hidden on a prime (a board saved before v2.08)
    chk(name, 'destination use', 'Lockheed Martin is in use by B only: A’s hidden second hop moves no money', ev(`flowEntUse('lm')`), 1);
  });

  // ---- the absorber's ✕ in a PMO copy is dimmed with the other allocation controls
  part('absorber ✕', () => {
    const items = [itx('A', 'PSM', [100])];
    const P0 = mk({ services: ['USAF'], items, disc: [300], mand: [0], order: ['A'] });
    P0.ev(`(function(){ BASE_ITEMS.length=0; ${JSON.stringify(items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); S.absorb='A'; save(); return 'ok'; })()`);
    const html = P0.ev(String.raw`(function(){ const mode={sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, ap:APPN,
      base:pmoBaseline(), pv:PMO_PV, ord:JSON.parse(JSON.stringify(S.pmoOrder||{}))}; return pmoCopyHtml(mode); })()`);
    const C = boot({ html });
    chk(name, 'absorber ✕', 'the copy’s style dims the ✕ that stops the absorber', C.ev(`[].some.call(document.querySelectorAll('style'), function(st){ return st.textContent.indexOf('button[onclick^="setAbsorber("]')>=0; })`), true);
  });

  // ---- a redraw that commits the typed figure (Chromium fires change on the field it removes) leaves nothing to put back
  // v2.08 second review: Chromium fires change on the focused field as the redraw removes it. Committed there, the panel drew
  // the old figure, the keyboard fell to the page and the rest of the typing was lost. The held field's handler is off for
  // the redraw: nothing is committed by it, the typing and the keyboard stay, leaving the field commits the whole figure.
  // (jsdom fires nothing on removal, so the change is fired here as Chromium fires it; npm run keys P drives Chromium.)
  part('redraw holds', () => {
    const { ev } = mk({ services: ['USAF'], items: [itx('A', 'PSM', [100])], disc: [300], mand: [0], order: ['A'] });
    ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); setCur('A'); render(); 'ok'`);
    const q = `document.querySelector('#inspector input[onchange^="setAsk("]')`;
    // Chromium fires change on the focused field AS the redraw removes it; jsdom fires nothing. The draw is wrapped so the
    // change lands where Chromium's does: inside the redraw, after the panel has read what is held, before it is drawn again.
    ev(`(function(){ var a=${q}; a.focus(); a.value='123'; a.dispatchEvent(new Event('input')); window.__old=a;
        var d0=inspectorDraw; inspectorDraw=function(){ __old.dispatchEvent(new Event('change')); return d0.apply(this, arguments); };
        try{ render(); } finally { inspectorDraw=d0; } return 'ok'; })()`);
    chk(name, 'redraw holds', 'the change Chromium fires on the field the redraw removed commits nothing', ev(`itemById('A').ask[0]`), 100);
    chk(name, 'redraw holds', 'the new field holds the typing, with the keyboard', JSON.stringify(ev(`(function(){ var a=${q}; return [a.value, document.activeElement===a, !!a.__pend, a!==__old]; })()`)),
      JSON.stringify(['123', true, true, true]));
    ev(`(function(){ var a=${q}; a.value='123456'; a.dispatchEvent(new Event('input')); a.dispatchEvent(new Event('change')); return 'ok'; })()`);
    chk(name, 'redraw holds', 'leaving the field commits the whole figure', ev(`itemById('A').ask[0]`), 123456);
    ev(`render(); 'ok'`);
    chk(name, 'redraw holds', 'committed, a later redraw shows the stored figure', ev(`${q}.value`).replace(/,/g, ''), '123456');
    ev(`document.activeElement.blur(); resetAsk('A'); 'ok'`);   // ↺ is clicked: the keyboard leaves the figure
    chk(name, 'redraw holds', 'put back with ↺, the panel shows the stored figure, not the old typing', JSON.stringify([ev(`itemById('A').ask[0]`), ev(`${q}.value`)]), JSON.stringify([100, '100']));
  });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
})();
// ==== end v2.08 -- the review of the defect fixes ====


// ==== v2.09 W1 (item 125): CLIN amounts and the row controls, by pointer ====
// Brad, 26 Oct 2026: "if I click a requirement amount on a CLIN, it sends me to the panel pop up and I'm unable to edit CLIN
// requirement amounts." What jsdom can see of it: a CLIN's request typed per service (Brad's decision), whole dollars in ↓ Fill
// from row and ↑ Apply grid to row, a new CLIN's grid starting as its first request, the drill's foot beside the prime's
// requirement value, a click that uses a control selecting the row quietly, a press a redraw took away, a redraw that holds a
// half-typed row figure (the change Chromium fires on a field the redraw removes is fired here, where Chromium fires it), and
// the two ways into the drill. Chromium's half -- a real pointer, every recorded control, four layouts -- is npm run pointer
// (tools/pointer-edit.mjs). Each part fails on the v2.08 board (ebe702e) unless it says CONTROL; expected values are worked
// out here from the fixture, never read back from the board.
await (async () => {
  const name = 'v2.09 — CLIN amounts and the row controls: the request by service, whole dollars, a new CLIN, the foot, a click that uses a control, a press, a redraw, the routes (item 125)';
  try {
  const J = JSON.stringify;
  const itx = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Req ' + id, event: 'EV-' + id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
  const part = (tag, fn) => { try { fn(); } catch (e) { failures.push({ scenario: name, where: tag, what: 'the part threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' }); } };
  const partA = async (tag, fn) => { try { await fn(); } catch (e) { failures.push({ scenario: name, where: tag, what: 'the part threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' }); } };
  const tick = ms => new Promise(r => setTimeout(r, ms));
  // a prime P on three services that asks USAF and ANG only, with two CLINs from the board's data; Q an ordinary requirement
  const mk = () => {
    const B = boot(); const items = [itx('P', 'AV', [4000, 500, 0]), itx('Q', 'AV', [100, 0, 0])];
    seed(B.ev, { services: ['USAF', 'ANG', 'AFRC'], items, disc: [9000, 9000, 9000], mand: [0, 0, 0], order: ['P', 'Q'] });
    B.ev(`(function(){ BASE_ITEMS.length=0; ${J(items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.ptype={P:'PRIME'}; CLINS.P=[{clin:'0001', desc:'Depot', ccar:'', ask:[1000,200,0]}, {clin:'0002', desc:'Spares', ccar:'', ask:[500,0,0]}];
      window.__cf=0; window.confirm=function(){ __cf++; return true; }; window.__al=[]; window.alert=function(m){ __al.push(String(m)); };
      UI2.on=true; UI2.dock=false; clinOpen={P:true}; save(); render();
      // a control by the writer its handler calls, in a row or the RECORD panel (no quoting games with selectors)
      window.__by=function(sc, pre){ return [].filter.call(document.querySelectorAll(sc+' input'), function(i){ return (i.getAttribute('onchange')||'').indexOf(pre)===0; })[0]; };
      return 'ok'; })()`);
    return B;
  };
  // a box in P's drill by the writer it calls
  const bx = (fn, key, j) => `__by('#row-P', ${J(fn + '("P",' + J(key) + ',' + j + ',')})`;
  const put = (sel, v) => `(function(){ var i=${sel}; i.focus(); i.value=${J(v)}; i.dispatchEvent(new Event('input', {bubbles:true})); i.dispatchEvent(new Event('change', {bubbles:true})); return 'ok'; })()`;

  // ---- 1. a CLIN's request is typed per service, and writes that service only
  part('request by service', () => {
    const { ev } = mk();
    chk(name, 'request by service', 'each CLIN has a request box per service (6) beside its allocation boxes (6), each named',
      ev(`(function(){ var r=document.querySelectorAll('#row-P input[onchange^="clinSetAsk("]'), a=document.querySelectorAll('#row-P input[onchange^="setClinSvc("]');
        return [r.length, a.length, r[1].getAttribute('aria-label'), a[1].getAttribute('aria-label')].join(' | '); })()`),
      '6 | 6 | ANG request, CLIN 0001 | ANG allocation, CLIN 0001');
    ev(put(bx('clinSetAsk', 'b0', 1), '250'));
    chk(name, 'request by service', 'ANG’s request on CLIN 0001 typed as 250: its request is [1000, 250, 0], the other services untouched',
      ev(`JSON.stringify(clinList('P')[0].ask)`), J([1000, 250, 0]));
    chk(name, 'request by service', 'and its allocation is not moved: the two stay independent (Brad)', ev(`JSON.stringify(clinVec('P', clinList('P')[0]))`), J([1000, 200, 0]));
    chk(name, 'request by service', 'the line’s request total is read from its boxes: $1,250, and vs request says the allocation is $50 short',
      ev(`(function(){ var tr=${bx('clinSetAsk', 'b0', 0)}.closest('tr'), nx=tr.nextElementSibling; return tr.querySelector('td.ct').textContent+' | '+nx.querySelector('td.off').textContent; })()`),
      '$1,250 | −$50');
    ev(put(bx('clinSetAsk', 'b0', 0), 'abc'));
    chk(name, 'request by service', 'an entry that is not an amount changes nothing, and says why', ev(`JSON.stringify([clinList('P')[0].ask, /CLIN request for USAF was not changed/.test(document.getElementById('shareStat').textContent)])`),
      J([[1000, 250, 0], true]));
    ev(put(bx('clinSetAsk', 'b0', 0), ''));
    chk(name, 'request by service', 'a blank box clears that service’s request', ev(`JSON.stringify(clinList('P')[0].ask)`), J([0, 250, 0]));
    chk(name, 'request by service', 'and the prime’s requirement value is never moved by a CLIN request', ev(`JSON.stringify(itemById('P').ask)`), J([4000, 500, 0]));
  });

  // ---- 2. a new CLIN asks nothing of a service until it is typed; its allocation starts as its first request, then stays apart
  part('new CLIN', () => {
    const { ev } = mk();
    ev(`(function(){ var q=['0009','Ninth line']; window.prompt=function(){ return q.shift(); }; clinAdd('P'); return 'ok'; })()`);
    chk(name, 'new CLIN', 'CONTROL: added, it asks nothing of any service yet', ev(`JSON.stringify(clinList('P')[2].ask)`), J([0, 0, 0]));
    ev(put(bx('clinSetAsk', 'n1', 0), '900'));
    chk(name, 'new CLIN', 'USAF’s first request, 900: its USAF allocation starts as 900 (it read $0, the whole request short, until ↺ Reset)',
      ev(`JSON.stringify([clinList('P')[2].ask, clinVec('P', clinList('P')[2])])`), J([[900, 0, 0], [900, 0, 0]]));
    ev(put(bx('setClinSvc', 'n1', 0), '700')); ev(put(bx('clinSetAsk', 'n1', 0), '1200'));
    chk(name, 'new CLIN', 'then an allocation of 700 typed and the request raised to 1,200: the allocation stays 700 (independent from then on)',
      ev(`JSON.stringify(clinVec('P', clinList('P')[2]))`), J([700, 0, 0]));
    ev(put(bx('clinSetAsk', 'n1', 1), '50'));
    chk(name, 'new CLIN', 'ANG’s first request, 50: ANG’s allocation starts there too; AFRC asks and holds nothing',
      ev(`JSON.stringify([clinList('P')[2].ask, clinVec('P', clinList('P')[2])])`), J([[1200, 50, 0], [700, 50, 0]]));
    ev(put(bx('clinSetAsk', 'b0', 2), '75'));
    chk(name, 'new CLIN', 'CONTROL: a CLIN from the board’s data keeps its allocation when its request is typed, as before', ev(`JSON.stringify(clinVec('P', clinList('P')[0]))`), J([1000, 200, 0]));
  });

  // ---- 3. whole dollars in ↓ Fill from row and ↑ Apply grid to row
  part('whole dollars', () => {
    const { ev } = mk();
    // the row allocation [100, 7, 0] over CLINs asking USAF 1000 and 500, ANG 200 and 0: 66⅔ and 33⅓ by hand; [67, 33] in whole dollars
    ev(`S.alloc.P={m:'s', v:[100,7,0]}; save(); render(); clinFromRow('P'); 'ok'`);
    chk(name, 'whole dollars', '↓ Fill from row: USAF’s $100 over requests of 1,000 and 500 is 67 and 33, ANG’s $7 all on 0001 -- whole dollars that add up to the row',
      ev(`JSON.stringify(clinList('P').map(function(c){ return clinVec('P', c); }))`), J([[67, 7, 0], [33, 0, 0]]));
    // a grid holding fractions (an older Fill from row): 10.1 + 20.2 is 30.299999999999997 as a float; the row gets whole dollars
    ev(`S.clinAlloc.P={b0:[10.1,3,0], b1:[20.2,4,0]}; save(); clinToRow('P'); 'ok'`);
    chk(name, 'whole dollars', '↑ Apply grid to row on a grid of 10.1 + 20.2 and 3 + 4: the row allocation is [30, 7, 0], whole dollars adding up to the grid’s total',
      ev(`JSON.stringify(S.alloc.P)`), J({ m: 's', v: [30, 7, 0] }));
  });

  // ---- 4. the foot: the CLINs' requests beside the prime's requirement value, information only
  part('foot', () => {
    const { ev } = mk();
    const rows = J(JSON.parse(ev(`JSON.stringify([].map.call(document.querySelectorAll('#row-P .clin-detail tfoot tr'), function(r){ return [].map.call(r.children, function(td){ return td.textContent; }).join('|'); }))`)).slice(0, 3));
    chk(name, 'foot', 'CLIN REQUESTS [1,500 · 200 · 0] = 1,700; REQUIREMENT VALUE [4,000 · 500 · 0] = 4,500; the difference by service',
      rows, J(['CLIN REQUESTS||$1,500|$200|$0|$1,700||||', 'REQUIREMENT VALUE (the prime’s, by service)||$4,000|$500|$0|$4,500||||',
        'REQUIREMENT − CLIN REQUESTS (information only)||+$3K|+$300|—|+$3K||||']));
    chk(name, 'foot', 'the difference is information, not a warning: its cells are not the amber of a mismatch',
      ev(`[].map.call(document.querySelectorAll('#row-P .clin-detail tfoot tr.cvdiff td'), function(td){ return td.className; }).slice(1, 5).join(',')`), ',inf,inf,ok');
    chk(name, 'foot', 'and the line above the grid names the requirement value', ev(`/requested \\$1,700 · requirement value \\$4,500/.test(document.querySelector('#row-P .clin-detail .ch').textContent)`), true);
  });

  // ---- 5. a click that uses a control in the row selects it quietly; a click on the row itself opens the RECORD panel
  part('quiet', () => {
    const { ev } = mk();
    const st = `(function(){ var p=document.getElementById('inspector'), s=document.getElementById('drawerScrim'); return [curRow, p.classList.contains('open'), !!(s && s.classList.contains('on'))].join(','); })()`;
    const click = sel => `(function(){ var e=${sel}; e.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window})); return 'ok'; })()`;
    // as a mousedown does: the control takes the keyboard, then the click comes
    ev(`drawerClose(); curRow='Q'; ${bx('setClinSvc', 'b0', 0)}.focus(); 'ok'`); ev(click(bx('setClinSvc', 'b0', 0)));
    chk(name, 'quiet', 'a click into a CLIN’s box selects P and leaves the RECORD panel where it was, the keyboard in the box',
      ev(st) + ',' + ev(`document.activeElement===${bx('setClinSvc', 'b0', 0)}`), 'P,false,false,true');
    ev(`drawerClose(); curRow='P'; document.querySelector('#row-Q input[onchange^="setRank("]').focus(); 'ok'`); ev(click(`document.querySelector('#row-Q input[onchange^="setRank("]')`));
    chk(name, 'quiet', 'and a click into another row’s rank box selects it the same way', ev(st), 'Q,false,false');
    ev(`drawerClose(); curRow='Q'; document.activeElement.blur(); 'ok'`); ev(click(`document.querySelector('#row-P .clin-detail .svc-hint')`));
    chk(name, 'quiet', 'a click on an empty part of the drill, which takes no keyboard, is the drill’s too', ev(st), 'P,false,false');
    ev(`drawerClose(); document.activeElement.blur(); 'ok'`); ev(click(`document.querySelector('#row-Q .t1')`));
    chk(name, 'quiet', 'CONTROL: a click on a row’s title selects it and opens the RECORD panel over the table', ev(st), 'Q,true,true');
  });

  // ---- 6. a press a redraw took away: the keyboard goes to the control in its place, and a button's press is delivered once
  await partA('a press', async () => {
    const { ev } = mk();
    // what Chromium does on a mousedown in box B while A holds typing: pointerdown, then A loses the keyboard and its change
    // redraws the rows before B can take it
    const press = (a, b) => `(function(){ var A=${a}, B=${b}; A.focus(); A.value='400001'; A.dispatchEvent(new Event('input', {bubbles:true}));
      window.__B=B; B.dispatchEvent(new Event('pointerdown', {bubbles:true})); A.blur(); A.dispatchEvent(new Event('change', {bubbles:true})); return 'ok'; })()`;
    ev(press(bx('setClinSvc', 'b0', 1), bx('setClinSvc', 'b1', 1)));
    chk(name, 'a press', 'typed into one box and pressed the next: the figure is stored, and the box standing where the pressed one was has the keyboard',
      ev(`JSON.stringify([clinVec('P', clinList('P')[0])[1], !__B.isConnected, document.activeElement===${bx('setClinSvc', 'b1', 1)}])`), J([400001, true, true]));
    ev(`document.activeElement.dispatchEvent(new Event('pointerup', {bubbles:true})); 'ok'`); await tick(30);
    // the field just left: Chromium can leave the keyboard on it as its change fires, and the redraw then gives it back -- never
    const left = `(function(){ var A=${bx('setClinSvc', 'b0', 0)}, B=${bx('setClinSvc', 'b0', 1)}; A.focus(); A.value='555'; A.dispatchEvent(new Event('input', {bubbles:true}));
      B.dispatchEvent(new Event('pointerdown', {bubbles:true})); A.dispatchEvent(new Event('change', {bubbles:true})); return 'ok'; })()`;
    ev(left);
    chk(name, 'a press', 'with the keyboard still on the field just left as its change redraws: the keyboard goes to the box pressed, not back to that field',
      ev(`JSON.stringify([clinVec('P', clinList('P')[0])[0], (document.activeElement.getAttribute('onchange')||'').slice(0, 22)])`), J([555, 'setClinSvc("P","b0",1,']));
    ev(`document.activeElement.dispatchEvent(new Event('pointerup', {bubbles:true})); 'ok'`); await tick(30);
    // a drill button pressed after typing: its press is delivered once, when the pointer comes up on it
    const btn = `document.querySelector('#row-P button[onclick^="clinToRow("]')`;
    ev(`__cf=0; ${press(bx('setClinSvc', 'b0', 2), btn)}`);
    ev(`(function(){ var b=${btn}; b.dispatchEvent(new Event('pointerup', {bubbles:true})); return 'ok'; })()`); await tick(40);
    chk(name, 'a press', 'typed, then ↑ Apply grid to row pressed: the figure is stored and the button asks its question once, on that press',
      ev(`JSON.stringify([clinVec('P', clinList('P')[0])[2], __cf, S.alloc.P && S.alloc.P.m])`), J([400001, 1, 's']));
    // declined, so the button's own press redraws nothing and is still there for a second delivery to reach
    ev(`__cf=0; window.confirm=function(){ __cf++; return false; }; ${press(bx('setClinSvc', 'b0', 2), btn)}`);
    ev(`(function(){ var b=${btn}; b.dispatchEvent(new Event('pointerup', {bubbles:true})); b.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window})); return 'ok'; })()`); await tick(40);
    chk(name, 'a press', 'CONTROL: and where the browser delivers that click itself, it is not delivered a second time', ev(`__cf`), 1);
    ev(`window.confirm=function(){ __cf++; return true; }; 'ok'`);
    // the RECORD panel's own boxes are redrawn by the same redraw: a press there survives too
    ev(`setCur('P'); 'ok'`);
    ev(press(bx('setClinSvc', 'b1', 2), `__by('#inspector', 'setAsk("P",1,')`));
    chk(name, 'a press', 'typed in the drill, then the RECORD panel’s ANG value pressed: the panel’s box has the keyboard after the redraw',
      ev(`(document.activeElement.getAttribute('onchange')||'').slice(0, 12)`), 'setAsk("P",1');
    ev(`document.activeElement.dispatchEvent(new Event('pointerup', {bubbles:true})); 'ok'`); await tick(30);
    // CONTROL: a redraw that put the keyboard somewhere on purpose keeps it there
    ev(`(function(){ var B=${bx('setClinSvc', 'b1', 2)}; B.dispatchEvent(new Event('pointerdown', {bubbles:true})); document.getElementById('q').focus(); render(); return 'ok'; })()`);
    chk(name, 'a press', 'CONTROL: a press whose redraw left the keyboard on purpose elsewhere (the search box here) is not taken from there', ev(`document.activeElement.id`), 'q');
    ev(`document.dispatchEvent(new Event('pointerup', {bubbles:true})); 'ok'`); await tick(30);
  });

  // ---- 7. a redraw while a row figure is half typed commits nothing; left, it is applied
  part('row hold', () => {
    const { ev } = mk();
    // Chromium fires change on the focused field as innerHTML removes it: #list's rows are replaced here with that change fired
    // (once, as Chromium fires it once: a change that redrew again would otherwise fire it again inside its own redraw)
    const redraw = sel => `(function(){ var A=${sel}, L=document.getElementById('list'), D=Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML'), once=false;
      Object.defineProperty(L, 'innerHTML', {configurable:true, get:function(){ return D.get.call(this); }, set:function(v){ if(!once && A.isConnected){ once=true; A.dispatchEvent(new Event('change', {bubbles:true})); } D.set.call(this, v); }});
      try{ render(); } finally { delete L.innerHTML; } window.__A=A; return 'ok'; })()`;
    const typed = (sel, v) => `(function(){ var A=${sel}; A.focus(); A.value=${J(v)}; A.dispatchEvent(new Event('input', {bubbles:true})); return 'ok'; })()`;
    ev(`uiMode='fund'; uiApply(); render(); 'ok'`);
    const al = `document.querySelector('#row-Q input[onchange^="setAlloc("]')`;
    ev(typed(al, '12')); ev(redraw(al));
    chk(name, 'row hold', 'Fund’s allocation half typed (12) and the rows redrawn: nothing is applied, and the new box holds the 12 with the keyboard',
      ev(`JSON.stringify([S.alloc.Q===undefined, ${al}.value, document.activeElement===${al}, ${al}!==__A])`), J([true, '12', true, true]));
    ev(`(function(){ var a=${al}; a.value='123456'; a.dispatchEvent(new Event('input', {bubbles:true})); a.dispatchEvent(new Event('change', {bubbles:true})); return 'ok'; })()`);
    chk(name, 'row hold', 'CONTROL: typed on and left, the whole figure is applied', ev(`JSON.stringify(S.alloc.Q)`), J({ m: 't', v: 123456 }));
    // typed whole, then a redraw, then Enter with nothing typed since: the browser fires no change for a value a script put back
    ev(typed(al, '777')); ev(redraw(al)); const mid = ev(`JSON.stringify(S.alloc.Q)`);
    ev(`(function(){ var a=${al}; a.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true})); return 'ok'; })()`);
    chk(name, 'row hold', 'typed whole (777) and redrawn: still 123,456; then Enter with nothing typed since: the 777 is applied',
      J([mid, ev(`JSON.stringify(S.alloc.Q)`)]), J([J({ m: 't', v: 123456 }), J({ m: 't', v: 777 })]));
    ev(`uiMode='review'; uiApply(); render(); 'ok'`);
    const rk = `document.querySelector('#row-Q input[onchange^="setRank("]')`;
    ev(typed(rk, '1')); ev(redraw(rk)); const o1 = ev(`JSON.stringify(S.order)`);
    chk(name, 'row hold', 'the rank box half typed and redrawn: the order is as it was', o1, J(['P', 'Q']));
    ev(`(function(){ var a=${rk}; a.blur(); return 'ok'; })()`);
    chk(name, 'row hold', 'and left with nothing typed since: the rank is applied then, Q first', J([o1, ev(`JSON.stringify(S.order)`)]), J([J(['P', 'Q']), J(['Q', 'P'])]));
    const cr = bx('clinSetAsk', 'b0', 1);
    ev(typed(cr, '9')); ev(redraw(cr));
    chk(name, 'row hold', 'a CLIN request half typed and redrawn: the request is as it was, the box holds the 9', ev(`JSON.stringify([clinList('P')[0].ask[1], ${cr}.value])`), J([200, '9']));
  });

  // ---- 8. the RECORD panel's hold applies a figure put back once it is left with nothing typed since (it was silent)
  part('panel hold', () => {
    const { ev } = mk();
    ev(`setCur('Q'); render(); 'ok'`);
    const q = `__by('#inspector', 'setAsk("Q",0,')`;
    ev(`(function(){ var a=${q}; a.focus(); a.value='4321'; a.dispatchEvent(new Event('input', {bubbles:true})); render(); return 'ok'; })()`);
    chk(name, 'panel hold', 'CONTROL (v2.08): the RECORD panel holds the typing across a redraw, applying nothing', ev(`JSON.stringify([itemById('Q').ask[0], ${q}.value])`), J([100, '4321']));
    ev(`(function(){ var a=${q}; a.blur(); return 'ok'; })()`);
    chk(name, 'panel hold', 'left with nothing typed since, the figure put back is applied', ev(`itemById('Q').ask[0]`), 4321);
    // only the box with the keyboard is held: one marked as typed that lost the keyboard with no change (only a script leaves a
    // box that way) is drawn from the board on the next redraw. (v208-rv-f2-any-marked survived the v2.08 board's own suite,
    // found while proving these; this pins it.)
    ev(`(function(){ var a=${q}; a.focus(); a.value='999'; a.dispatchEvent(new Event('input', {bubbles:true})); document.getElementById('q').focus(); render(); return 'ok'; })()`);
    chk(name, 'panel hold', 'CONTROL: a box marked as typed that has lost the keyboard is not held over the stored figure by a redraw',
      ev(`${q}.value`).replace(/,/g, ''), '4321');
  });

  // ---- 9. the ways into the drill from elsewhere open it where it can be used
  part('routes', () => {
    const { ev } = mk();
    const st = `(function(){ var a=document.activeElement, d=document.querySelector('#row-P .clin-detail');
      return [!!clinOpen.P, !!d, document.getElementById('inspector').classList.contains('open'), document.getElementById('drawerScrim').classList.contains('on'),
        erOn(), matOpen, !!(a && d && d.contains(a)), (a && a.getAttribute('onchange')||'').slice(0, 22)].join(','); })()`;
    for (const shut of [true, false]) {
      ev(`clinOpen.P=${!shut}; setCur('P'); render(); openEdit('P','rec'); dlgSync(); 'ok'`);
      ev(`document.querySelector('#editPanel button[onclick="erGo(\\'clin\\')"]').click(); dlgSync(); 'ok'`);
      chk(name, 'routes', `the edit box’s Open the 🧾 CLIN drill (drill ${shut ? 'shut' : 'open'}): the drill is open, the box and the sliding panel are closed, the keyboard is on its first box`,
        ev(st), 'true,true,false,false,false,false,true,clinSetAsk("P","b0",0,');
    }
    for (const k of [1, 2]) {
      ev(`matOpen=true; matPmo='ALL'; matMissing=''; render(); dlgSync(); 'ok'`);
      ev(`[].filter.call(document.querySelectorAll('#matBody button'), function(b){ return /^(clinGo|toggleClin)\\("P"\\)/.test(b.getAttribute('onclick')||''); })[0].click(); dlgSync(); 'ok'`);
      chk(name, 'routes', `the Classify grid’s Open the 🧾 CLIN drill (press ${k}): the grid is closed, the drill is open -- never shut -- and has the keyboard`,
        ev(st), 'true,true,false,false,false,false,true,clinSetAsk("P","b0",0,');
    }
    ev(`document.getElementById('q').value='zzz-no-such'; render(); clinGo('P'); 'ok'`);
    chk(name, 'routes', 'a prime the search hides: the drill is left open for when it shows, and the message says why it is not on screen',
      ev(`JSON.stringify([!!clinOpen.P, /not in the list as it is searched or filtered/.test(document.getElementById('shareStat').textContent)])`), J([true, true]));
  });

  // ---- 10. a row's ⋯ menu left open does not eat the first click into the drill
  part('row menu', () => {
    const { ev } = mk();
    ev(`rowMenuId='Q'; render(); window.__E=${bx('setClinSvc', 'b0', 2)}; __E.focus(); __E.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window})); 'ok'`);
    chk(name, 'row menu', 'with Q’s ⋯ menu open, a click into P’s CLIN box: the box is still there with the keyboard, and the menu is shut',
      ev(`JSON.stringify([__E.isConnected, document.activeElement===__E, rowMenuId, !!document.querySelector('.rowmenu.open')])`), J([true, true, null, false]));
  });

  // ---- 11. in a PMO copy the drill's WBS button is dimmed with the rest of the drill
  part('copy', () => {
    const { ev } = mk();
    // a CLIN the file carries (the board's data CLINs above are put in memory only, and a copy is opened from the file)
    ev(`S.clinNew={P:[{key:'n1', clin:'0003', desc:'Added', ccar:'', ask:[10,0,0]}]}; save(); 'ok'`);
    const html = ev(String.raw`(function(){ const mode={sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, ap:APPN,
      base:pmoBaseline(), pv:PMO_PV, ord:JSON.parse(JSON.stringify(S.pmoOrder||{}))}; return pmoCopyHtml(mode); })()`);
    const C = boot({ html });
    const css = C.ev(`[].map.call(document.querySelectorAll('style'), function(s){ return s.textContent; }).join('')`);
    chk(name, 'copy', 'the copy dims a CLIN’s WBS button, and the request boxes by their writer', J([css.indexOf(`[onclick^='toggleWbs("clin"']`) >= 0, css.indexOf('input[onchange^="clinSetAsk("]') >= 0]), J([true, true]));
    C.ev(`clinOpen={P:true}; render(); 'ok'`);
    chk(name, 'copy', 'CONTROL: and the copy’s CLIN WBS button is what that rule matches', C.ev(`!!document.querySelector('#row-P .clin-detail [onclick^=\\'toggleWbs("clin"\\']')`), true);
  });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
})();
// v2.09 review (clin-pointer): three defects the independent review of v2.09 found in item 125's area, each reproduced in
// Chromium on 9bc5496. (1) A redraw turned typing that was taken back into a write: heldCommit fired a change for a box that
// held the board's own figure again, and a per-service allocation was re-spread by the ask; the other way round (redraw, then
// the digit taken back) the browser's own change did it. (2) The CLIN drill's sideways scroll went back to the left on every
// redraw, so a button pressed after typing came back 200px from the pointer and the press went nowhere. (3) Fund's
// allocation box on a per-service allocation was crushed to 14px under ★ by its SVC tag. What jsdom can see of each is here
// (the change Chromium fires as a redraw removes a focused field, and the one it fires on leaving a box the hold gave the
// keyboard, are fired here where Chromium fires them); the pointer, the wheel and the layout are npm run pointer F. Each part
// fails on 9bc5496 unless it says CONTROL; expected values are worked out here from the fixture.
await (async () => {
  const name = 'v2.09 review — clin-pointer: a figure taken back writes nothing, the drill keeps its sideways scroll, Fund’s SVC box is whole';
  try {
  const J = JSON.stringify;
  const itx = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Req ' + id, event: 'EV-' + id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
  const part = (tag, fn) => { try { fn(); } catch (e) { failures.push({ scenario: name, where: tag, what: 'the part threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' }); } };
  // P a prime with a CLIN from the board's data; Q allocated per service, $100 all on USAF, though it asks USAF 60 and ANG 40
  // (so a total re-spread by the ask, [60, 40, 0], is a different allocation from the one held); R on the lane walk, no split
  const mk = () => {
    const B = boot(); const items = [itx('P', 'AV', [4000, 500, 0]), itx('Q', 'AV', [60, 40, 0]), itx('R', 'AV', [300, 0, 0]), itx('P2', 'AV', [700, 0, 0])];
    seed(B.ev, { services: ['USAF', 'ANG', 'AFRC'], items, disc: [9000, 9000, 9000], mand: [0, 0, 0], order: ['P', 'Q', 'R', 'P2'] });
    B.ev(`(function(){ BASE_ITEMS.length=0; ${J(items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.ptype={P:'PRIME', P2:'PRIME'}; CLINS.P=[{clin:'0001', desc:'Depot', ccar:'', ask:[1000,200,0]}, {clin:'0002', desc:'Spares', ccar:'', ask:[500,0,0]}];
      CLINS.P2=[{clin:'0101', desc:'Line', ccar:'', ask:[700,0,0]}];
      S.alloc.Q={m:'s', v:[100,0,0]};
      window.__cf=0; window.confirm=function(){ __cf++; return false; }; window.alert=function(){};
      UI2.on=true; UI2.dock=false; clinOpen={P:true}; save(); render();
      window.__by=function(sc, pre){ return [].filter.call(document.querySelectorAll(sc+' input'), function(i){ return (i.getAttribute('onchange')||'').indexOf(pre)===0; })[0]; };
      window.__btn=function(sc, h){ return [].filter.call(document.querySelectorAll(sc+' button'), function(b){ return b.getAttribute('onclick')===h; })[0]; };
      return 'ok'; })()`);
    return B;
  };
  const tick = ms => new Promise(r => setTimeout(r, ms));
  // Chromium fires change on the focused field as innerHTML removes it (#list's rows, or the RECORD panel): fired here, once
  const redraw = (sel, box) => `(function(){ var A=${sel}, L=document.getElementById(${J(box)}), D=Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML'), once=false;
    Object.defineProperty(L, 'innerHTML', {configurable:true, get:function(){ return D.get.call(this); }, set:function(v){ if(!once && A.isConnected){ once=true; A.dispatchEvent(new Event('change', {bubbles:true})); } D.set.call(this, v); }});
    try{ render(); } finally { delete L.innerHTML; } return 'ok'; })()`;
  // typing, as the input events a person's keys make: each string in turn is what the box holds after a key
  const keys = (sel, ...vals) => `(function(){ var A=${sel}; if(document.activeElement!==A) A.focus(); ${J(vals)}.forEach(function(v){ A.value=v; A.dispatchEvent(new Event('input', {bubbles:true})); }); return A.value; })()`;
  const leave = sel => `(function(){ var A=${sel}; A.blur(); return 'ok'; })()`;
  const enter = sel => `(function(){ var A=${sel}; A.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true})); return 'ok'; })()`;
  // what Chromium fires on leaving a box whose starting point the hold moved to the put-back figure
  const chromeChange = sel => `(function(){ var A=${sel}; A.dispatchEvent(new Event('change', {bubbles:true})); return 'ok'; })()`;
  const fund = `document.querySelector('#row-Q input[onchange^="setAlloc("]')`;
  const disc = `__by('#inspector', 'setFsrcSvc("R","d",0,')`;
  const req = `__by('#row-P', 'clinSetAsk("P","b0",0,')`;
  const QA = `JSON.stringify([S.alloc.Q, svcAlloc(itemById('Q'))])`, QA0 = J([{ m: 's', v: [100, 0, 0] }, [100, 0, 0]]);

  // ---- 1. typing taken back, THEN a redraw, then left: nothing is written (heldCommit fired a change for the board's own figure)
  part('taken back, then redrawn', () => {
    for (const how of ['Tab', 'Enter']) {
      const { ev } = mk();
      ev(`uiMode='fund'; uiApply(); render(); 'ok'`);
      chk(name, 'taken back, then redrawn', `CONTROL: Fund’s box on Q’s per-service allocation draws its total, $100`, ev(`${fund}.defaultValue`), '100');
      ev(keys(fund, '1007', '100')); ev(redraw(fund, 'list'));
      ev(how === 'Tab' ? leave(fund) : enter(fund));
      chk(name, 'taken back, then redrawn', `Fund’s box: a digit typed and taken back, a redraw, then ${how}: Q keeps its per-service allocation [100, 0, 0], not a $100 total re-spread by the ask to [60, 40, 0]`,
        ev(QA), QA0);
    }
    {
      const { ev } = mk();
      ev(`setCur('R'); render(); 'ok'`);
      chk(name, 'taken back, then redrawn', 'CONTROL: R is on the lane walk, and its USAF Disc box draws the lane’s $300', ev(`JSON.stringify([S.fsrc.R||null, ${disc}.defaultValue])`), J([null, '300']));
      ev(keys(disc, '3007', '300')); ev(redraw(disc, 'inspector')); ev(leave(disc));
      chk(name, 'taken back, then redrawn', 'the RECORD panel’s Disc box, the same: R is not converted to a Split', ev(`JSON.stringify(S.fsrc.R||null)`), 'null');
    }
    {
      const { ev } = mk();
      ev(keys(req, '1,0007', '1,000')); ev(redraw(req, 'list')); ev(leave(req));
      chk(name, 'taken back, then redrawn', 'a CLIN from the board’s data, its USAF request the same: no override is recorded over the data, and it is not marked changed',
        ev(`JSON.stringify([((S.clinMeta||{}).P||{}).b0||null, !!clinList('P')[0].edited])`), J([null, false]));
    }
    {
      const { ev } = mk();
      ev(`uiMode='fund'; uiApply(); render(); 'ok'`);
      ev(keys(fund, '250')); ev(redraw(fund, 'list'));
      chk(name, 'taken back, then redrawn', 'CONTROL: a figure typed whole is held by the redraw, not applied', ev(QA), QA0);
      ev(leave(fund));
      chk(name, 'taken back, then redrawn', 'CONTROL: and left, with nothing typed since, it is applied (W1’s heldCommit still does its job)', ev(`JSON.stringify(S.alloc.Q)`), J({ m: 't', v: 250 }));
    }
  });

  // ---- 2. the other way round: a redraw while the digit is there, then it is taken back: the browser's own change passes nothing
  part('redrawn, then taken back', () => {
    {
      const { ev } = mk();
      ev(`uiMode='fund'; uiApply(); render(); 'ok'`);
      ev(keys(fund, '1007')); ev(redraw(fund, 'list'));
      chk(name, 'redrawn, then taken back', 'CONTROL: the half-typed 1007 is held by the redraw, nothing applied', ev(`JSON.stringify([${fund}.value, S.alloc.Q])`), J(['1007', { m: 's', v: [100, 0, 0] }]));
      ev(keys(fund, '100')); ev(chromeChange(fund)); ev(leave(fund));
      chk(name, 'redrawn, then taken back', 'then taken back to $100 and left (Chromium fires change, its starting point being the 1007 put back): Q keeps [100, 0, 0]',
        ev(QA), QA0);
    }
    {
      const { ev } = mk();
      ev(`setCur('R'); render(); 'ok'`);
      ev(keys(disc, '3007')); ev(redraw(disc, 'inspector')); ev(keys(disc, '300')); ev(chromeChange(disc)); ev(leave(disc));
      chk(name, 'redrawn, then taken back', 'the RECORD panel’s Disc box the same way: R is not converted to a Split (it was, in v2.08 too)', ev(`JSON.stringify(S.fsrc.R||null)`), 'null');
    }
    {
      const { ev } = mk();
      ev(`uiMode='fund'; uiApply(); render(); 'ok'`);
      ev(keys(fund, '1007')); ev(redraw(fund, 'list')); ev(keys(fund, '1500')); ev(chromeChange(fund)); ev(leave(fund));
      chk(name, 'redrawn, then taken back', 'CONTROL: typed on to another figure after the redraw, its change goes through: $1,500', ev(`JSON.stringify(S.alloc.Q)`), J({ m: 't', v: 1500 }));
    }
  });

  // ---- 3. the drill keeps its sideways scroll across a redraw, each drill its own
  try {
    const { ev } = mk();
    ev(`clinOpen={P:true, P2:true}; render(); document.querySelector('#row-P .cscroll').scrollLeft=201; document.querySelector('#row-P2 .cscroll').scrollLeft=77; 'ok'`);
    const sl = `JSON.stringify([document.querySelector('#row-P .cscroll').scrollLeft, document.querySelector('#row-P2 .cscroll').scrollLeft])`;
    chk(name, 'drill scroll', 'CONTROL: the two drills are scrolled to 201 and 77', ev(sl), J([201, 77]));
    ev(`render(); 'ok'`);
    chk(name, 'drill scroll', 'after a redraw each drill is where it was, P’s at 201 and P2’s at 77 -- keyed by its row, never one drill’s scroll on another',
      ev(sl), J([201, 77]));
    // a figure typed in P's drill, then its ✕ pressed: the redraw the change makes leaves the drill (and so the ✕) where it was
    ev(`(function(){ var A=__by('#row-P', 'setClinSvc("P","b0",1,'), B=__btn('#row-P', 'clinRemove("P","b1")');
      A.focus(); A.value='4444'; A.dispatchEvent(new Event('input', {bubbles:true})); B.dispatchEvent(new Event('pointerdown', {bubbles:true}));
      A.blur(); A.dispatchEvent(new Event('change', {bubbles:true})); return 'ok'; })()`);
    chk(name, 'drill scroll', 'a figure typed in P’s drill, then its ✕ pressed: the figure is stored, the drill still at 201, and the keyboard on the ✕ standing where the one pressed was',
      ev(`JSON.stringify([clinVec('P', clinList('P')[0])[1], document.querySelector('#row-P .cscroll').scrollLeft, document.activeElement.getAttribute('onclick')])`),
      J([4444, 201, 'clinRemove("P","b1")']));
    ev(`document.activeElement.dispatchEvent(new Event('pointerup', {bubbles:true})); 'ok'`); await tick(30);
    chk(name, 'drill scroll', 'CONTROL: and the press is delivered once, as the pointer comes up on it (its question declined here)', ev(`__cf`), 1);
    ev(`clinOpen.P2=false; render(); clinOpen.P2=true; render(); 'ok'`);
    chk(name, 'drill scroll', 'CONTROL: a drill shut and opened again starts at the left', ev(`document.querySelector('#row-P2 .cscroll').scrollLeft`), 0);
  } catch (e) { failures.push({ scenario: name, where: 'drill scroll', what: 'the part threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' }); }

  // ---- 4. Fund's box on a per-service allocation: the SVC tag sits on the box's edge and takes none of its width or clicks
  part('SVC tag', () => {
    const { ev } = mk();
    ev(`uiMode='fund'; uiApply(); S.alloc.R={m:'t', v:250}; render(); 'ok'`);
    const tag = `document.querySelector('#row-Q .acts.alloc .mode-tag')`;
    chk(name, 'SVC tag', 'CONTROL: Q (per service) carries the SVC tag; R (a total) does not',
      ev(`JSON.stringify([!!${tag}, !!document.querySelector('#row-R .acts.alloc .mode-tag')])`), J([true, false]));
    // jsdom has no layout: what it can read is the rule that applies to the tag (the widths and the click are npm run pointer F)
    chk(name, 'SVC tag', 'the tag is taken out of the cell’s flow onto the box’s edge (position absolute), sized to its word (width auto, never the cell’s 100%), and lets a click through to the box (pointer-events none)',
      ev(`(function(){ var s=getComputedStyle(${tag}); return [s.position, s.width, s.pointerEvents].join(','); })()`), 'absolute,auto,none');
  });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
})();
// v2.09 second review (clin): AFTER A COMMIT THE KEYBOARD GOES BACK TO THE SAME REQUIREMENT'S CONTROL, OR NOWHERE. The keyboard's
// place across a redraw was found again by a control's first class, counted across the whole list when its row had none:
// Fund's allocation box on a per-service allocation is class "svcmode", a total typed into it is stored as a total, the box drawn
// again has no class, and the count took the NEXT per-service requirement's box -- Enter left the keyboard there, and the next
// figure typed replaced that requirement's allocation; Tab left it on that requirement's ★ (Chromium, ba3c294, and v2.08).
// What jsdom can see: which control has the keyboard after the commit, and where the next figure lands. jsdom has no layout,
// so the step Tab takes to the control after the box is Chromium's (npm run pointer G); here Tab finds the box itself again.
// Each part fails on ba3c294 unless it says CONTROL.
await (async () => {
  const name = 'v2.09 second review — clin: after a commit the keyboard goes back to the same requirement’s control, or nowhere';
  try {
  const J = JSON.stringify;
  const itx = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Req ' + id, event: 'EV-' + id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
  const part = (tag, fn) => { try { fn(); } catch (e) { failures.push({ scenario: name, where: tag, what: 'the part threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' }); } };
  // P a prime with two CLINs (its drill open); Q and Q2 each on a per-service allocation (what ↑ Apply grid to row writes),
  // asking USAF and ANG so a total re-spread by the ask differs from the allocation held; R on a total; T plain
  const mk = (dock) => {
    const B = boot(); const items = [itx('P', 'AV', [4000, 500, 0]), itx('Q', 'AV', [600, 400, 0]), itx('Q2', 'AV', [600, 400, 0]), itx('R', 'AV', [300, 0, 0]), itx('T', 'AV', [200, 0, 0])];
    seed(B.ev, { services: ['USAF', 'ANG', 'AFRC'], items, disc: [9000, 9000, 9000], mand: [0, 0, 0], order: ['P', 'Q', 'Q2', 'R', 'T'] });
    B.ev(`(function(){ BASE_ITEMS.length=0; ${J(items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.ptype={P:'PRIME'}; CLINS.P=[{clin:'0001', desc:'Depot', ccar:'', ask:[1000,200,0]}, {clin:'0002', desc:'Spares', ccar:'', ask:[500,0,0]}];
      S.alloc.Q={m:'s', v:[1000,0,0]}; S.alloc.Q2={m:'s', v:[2000,0,0]}; S.alloc.R={m:'t', v:250};
      window.confirm=function(){ return true; }; window.alert=function(){};
      // jsdom has no CSS.escape, which the board's count of a control by its class calls: the browser's, for class names
      if(typeof CSS==='undefined') window.CSS={escape:function(s){ return String(s).replace(/[^a-zA-Z0-9_-]/g, function(c){ return '\\\\'+c; }); }};
      UI2.on=true; UI2.dock=${dock ? 'true' : 'false'}; clinOpen={P:true}; uiMode='fund'; uiApply(); save(); render();
      window.__by=function(sc, pre){ return [].filter.call(document.querySelectorAll(sc+' input'), function(i){ return (i.getAttribute('onchange')||'').indexOf(pre)===0; })[0]; };
      // who has the keyboard: the writer its handler calls, and the requirement it belongs to
      window.__kb=function(){ var a=document.activeElement; if(!a || a===document.body) return 'nowhere';
        var r=a.closest('#list .row[id]'), p=a.closest('#inspector'); return (a.getAttribute('onchange')||a.getAttribute('onclick')||'').replace(/,this\\.value\\)$/, ')').slice(0, 40)+' @'+(r? r.id : p? 'panel:'+curRow : '-'); };
      return 'ok'; })()`);
    return B;
  };
  // a figure committed as Chromium commits it: Enter -- the key, then change, the box still the page's focus; Tab -- the key,
  // the box loses the keyboard, then change
  const commit = (sel, v, key) => `(function(){ var A=${sel}; A.focus(); A.value=${J(v)}; A.dispatchEvent(new Event('input', {bubbles:true}));
    A.dispatchEvent(new KeyboardEvent('keydown', {key:${J(key)}, bubbles:true}));
    if(${J(key)}==='Tab') A.blur(); A.dispatchEvent(new Event('change', {bubbles:true})); return __kb(); })()`;
  // the next figure typed into whatever has the keyboard, and Enter
  const next = v => `(function(){ var A=document.activeElement; if(!A || A===document.body) return 'nothing has the keyboard';
    A.value=${J(v)}; A.dispatchEvent(new Event('input', {bubbles:true})); A.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true}));
    A.dispatchEvent(new Event('change', {bubbles:true})); return 'ok'; })()`;
  const box = id => `document.querySelector('#row-${id} input[onchange^="setAlloc("]')`;
  const AL = `JSON.stringify([S.alloc.Q, S.alloc.Q2])`;

  // ---- 1. the finding: Fund's box on a per-service allocation, Enter
  part('Fund, per service, Enter', () => {
    const { ev } = mk(false);
    chk(name, 'Fund, per service, Enter', 'CONTROL: Q’s and Q2’s boxes are drawn per service (class svcmode), R’s as a total',
      ev(`[${box('Q')}.className, ${box('Q2')}.className, ${box('R')}.className].join(',')`), 'svcmode,svcmode,');
    chk(name, 'Fund, per service, Enter', '2,500 typed into Q’s box and Entered: the keyboard stays on Q’s box -- not Q2’s', ev(commit(box('Q'), '2,500', 'Enter')), 'setAlloc("Q") @row-Q');
    ev(next('7,000'));
    chk(name, 'Fund, per service, Enter', 'and the next figure, 7,000, is Q’s: Q is a $7,000 total, Q2 keeps its per-service [2,000, 0, 0]',
      ev(AL), J([{ m: 't', v: 7000 }, { m: 's', v: [2000, 0, 0] }]));
  });
  // ---- 2. Tab: the box found again is Q's, and the step to the control after it is taken from there
  part('Fund, per service, Tab', () => {
    const { ev } = mk(false);
    chk(name, 'Fund, per service, Tab', '2,500 typed into Q’s box and Tabbed: the control found again is Q’s box (Chromium then steps to Q’s ★), not Q2’s',
      ev(commit(box('Q'), '2,500', 'Tab')), 'setAlloc("Q") @row-Q');
    chk(name, 'Fund, per service, Tab', 'and Q2’s allocation and ★ are untouched', ev(`JSON.stringify([S.alloc.Q2, !!S.mc.Q2])`), J([{ m: 's', v: [2000, 0, 0] }, false]));
  });
  // ---- 3. the only per-service requirement, and the last: the keyboard went to the page (nothing to count), now it stays
  part('one per-service row', () => {
    const { ev } = mk(false);
    ev(`S.alloc.Q2={m:'t', v:900}; save(); render(); 'ok'`);
    chk(name, 'one per-service row', 'with Q the only per-service requirement, Enter after 2,500 keeps the keyboard on Q’s box', ev(commit(box('Q'), '2,500', 'Enter')), 'setAlloc("Q") @row-Q');
    const B2 = mk(false);
    chk(name, 'one per-service row', 'and on Q2, the last per-service one, Enter after 3,000 keeps it on Q2’s', B2.ev(commit(box('Q2'), '3,000', 'Enter')), 'setAlloc("Q2") @row-Q2');
  });
  // ---- 4. a commit that takes the row out of the list: nowhere, never the row standing in its place
  part('row gone', () => {
    const { ev } = mk(false);
    ev(`S.mc={Q:true, Q2:true}; mcOnly=true; render(); 'ok'`);
    const star = `[].filter.call(document.querySelectorAll('#row-Q button'), function(b){ return /^S\\.mc\\["Q"\\]/.test(b.getAttribute('onclick')||''); })[0]`;
    ev(`(function(){ var b=${star}; b.focus(); b.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true})); b.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window})); return 'ok'; })()`);
    chk(name, 'row gone', 'Mission Critical only: Q’s ★ cleared from the keyboard takes Q off the list, and the keyboard goes nowhere -- not to Q2’s ★, where Space would clear Q2’s',
      ev(`JSON.stringify([!!document.getElementById('row-Q'), __kb()])`), J([false, 'nowhere']));
    chk(name, 'row gone', 'CONTROL: Q2 is still Mission Critical', ev(`!!S.mc.Q2`), true);
  });
  // ---- 5. the rest keep their place, as they did: a total, the rank box at its new place, a CLIN box
  part('the rest', () => {
    const { ev } = mk(false);
    chk(name, 'the rest', 'CONTROL: Fund’s box on a total (R): Enter keeps the keyboard on R’s box', ev(commit(box('R'), '260', 'Enter')), 'setAlloc("R") @row-R');
    ev(`uiMode='review'; uiApply(); render(); 'ok'`);
    chk(name, 'the rest', 'CONTROL: T’s rank box, 1 Entered: T moves to the top, and the keyboard is on T’s rank box there',
      ev(commit(`document.querySelector('#row-T input[onchange^="setRank("]')`, '1', 'Enter')) + ' ' + ev(`S.order[0]`), 'setRank("T") @row-T T');
    chk(name, 'the rest', 'CONTROL: a CLIN’s ANG request, 250 Entered: the keyboard stays on that CLIN’s ANG request',
      ev(commit(`__by('#row-P', 'clinSetAsk("P","b0",1,')`, '250', 'Enter')), 'clinSetAsk("P","b0",1) @row-P');
    chk(name, 'the rest', 'CONTROL: and a CLIN’s ANG allocation, 150 Tabbed: the box found again is that one',
      ev(commit(`__by('#row-P', 'setClinSvc("P","b0",1,')`, '150', 'Tab')), 'setClinSvc("P","b0",1) @row-P');
  });
  // ---- 6. the RECORD panel's boxes: drawn after the rows, they lost the keyboard on every commit
  part('RECORD panel', () => {
    const { ev } = mk(true);
    ev(`uiMode='review'; uiApply(); setCur('T'); render(); 'ok'`);
    chk(name, 'RECORD panel', 'T’s value by service in the RECORD panel, USAF 210 Entered: stored, and the keyboard stays on that box',
      ev(commit(`__by('#inspector', 'setAsk("T",0,')`, '210', 'Enter')) + ' ' + ev(`itemById('T').ask[0]`), 'setAsk("T",0) @panel:T 210');
    chk(name, 'RECORD panel', 'and ANG 20 Tabbed: the box found again is T’s ANG (Chromium steps on to the box after it)',
      ev(commit(`__by('#inspector', 'setAsk("T",1,')`, '20', 'Tab')), 'setAsk("T",1) @panel:T');
  });
  // ---- 7. the panel drawn for another requirement: nothing in it is that control, even one whose handler names no requirement
  // (its ✕ Close here; in Chromium the panel's tabs are the same case)
  part('panel, another requirement', () => {
    const { ev } = mk(true);
    ev(`uiMode='review'; uiApply(); setCur('Q'); render(); 'ok'`);
    const close = `[].filter.call(document.querySelectorAll('#inspector button'), function(b){ return b.getAttribute('onclick')==='drawerClose()'; })[0]`;
    ev(`(function(){ var b=${close}; b.focus(); return 'ok'; })()`);
    chk(name, 'panel, another requirement', 'CONTROL: the keyboard is on Q’s RECORD panel’s ✕ Close, whose handler names no requirement', ev(`__kb()`), 'drawerClose() @panel:Q');
    // a redraw that takes Q off the list (Mission Critical only, Q2 the only star): the panel is drawn for Q2
    ev(`S.mc={Q2:true}; mcOnly=true; render(); 'ok'`);
    chk(name, 'panel, another requirement', 'the panel now shows Q2, and the keyboard is nowhere -- not on Q2’s panel', ev(`JSON.stringify([curRow, __kb()])`), J(['Q2', 'nowhere']));
  });
  // ---- 8. never into a closed sliding drawer, which is only moved off screen
  part('closed drawer', () => {
    const { ev } = mk(false);
    ev(`uiMode='review'; uiApply(); setCur('T'); drawerClose(); 'ok'`);
    // only a script leaves the keyboard in a closed drawer; a redraw must not put it back there
    ev(`(function(){ __by('#inspector', 'setAsk("T",0,').focus(); render(); return 'ok'; })()`);
    chk(name, 'closed drawer', 'the drawer closed, a redraw: the keyboard is not put back in it', ev(`JSON.stringify([document.getElementById('inspector').classList.contains('open'), __kb()])`), J([false, 'nowhere']));
  });
  // ---- 8b. a control removed never hands the keyboard to the one moved into its place
  part('a control removed', () => {
    const { ev } = mk(false);
    ev(`uiMode='review'; uiApply(); render(); 'ok'`);
    const x = k => `[].filter.call(document.querySelectorAll('#row-P button'), function(b){ return b.getAttribute('onclick')===${J('clinRemove("P",' + J(k) + ')')}; })[0]`;
    ev(`(function(){ var b=${x('b0')}; b.focus(); b.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true})); b.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window})); return 'ok'; })()`);
    chk(name, 'a control removed', 'CLIN 0001’s ✕ pressed from the keyboard: the line is removed and the keyboard goes nowhere -- not to CLIN 0002’s ✕ moved into its place, where the next Enter would remove that one too',
      ev(`JSON.stringify([clinList('P').map(function(c){ return c.clin; }), __kb()])`), J([['0002'], 'nowhere']));
  });
  // ---- 8c. CONTROL: a control whose handler says its own state keeps the keyboard where the box is drawn again the same
  part('a fit chip', () => {
    const { ev } = mk(false);
    const chip = `document.querySelectorAll('#fitBar .fitchip')[1]`;
    ev(`(function(){ var b=${chip}; b.focus(); b.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true})); b.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window})); return 'ok'; })()`);
    chk(name, 'a fit chip', 'CONTROL (v1.92): ANG’s fit chip pressed from the keyboard filters to ANG, and the keyboard stays on that chip, though its handler now says svcFilter=-1',
      ev(`JSON.stringify([svcFilter, document.activeElement===${chip}, document.activeElement.getAttribute('onclick')])`), J([1, true, 'svcFilter=-1;render()']));
  });
  // ---- 9. the receipt for the row's bound: every control drawn in a row is named by a handler that names its requirement, so a
  // control found again by its handler can only be its own requirement's (a control with no handler, or one naming no
  // requirement, added to the row would fail here first)
  part('every row control names its requirement', () => {
    const { ev } = mk(false);
    const scan = `(function(){ var bad=[], n=0; document.querySelectorAll('#list .row[id]').forEach(function(r){ var id=r.id.replace(/^row-/, '');
      r.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex]').forEach(function(el){ if(el.disabled) return; n++;
        var h=el.getAttribute('onchange')||el.getAttribute('onclick')||el.getAttribute('oninput');
        if(!h || h.indexOf(JSON.stringify(id))<0) bad.push(id+': '+el.tagName+' '+(h||'(no handler)').slice(0, 40)); }); });
      return JSON.stringify([n>0, bad]); })()`;
    for (const m of ['fund', 'review', 'rank']) {
      ev(`uiMode=${J(m)}; uiApply(); rowMenuId='Q'; render(); 'ok'`);
      chk(name, 'every row control names its requirement', `${m}, the drill and a ⋯ menu open: every control in every row is named by a handler naming its requirement`, ev(scan), J([true, []]));
    }
  });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
})();
// v2.09 third review (clin): A HANDLER THAT NAMES A PLACE IN A LIST NAMES WHATEVER STANDS THERE NOW. The second review found a
// control again by its handler; an award's ✕ is rmAwd(id, 0), its date setAwdIncDate(id, 1, …), a WBS line's ✕ wbsDel(…, 0), a
// line of the not-drawn list ndSetDrawn(0), a band's ▲ bandMove(2, -1): each names its item by its place. After a commit that
// took the item out or re-sorted the list, the handler named the item moved into the place, and the keyboard went there -- a
// second Enter removed the next award, re-dated another, cut the next requirement's directed figure, deleted the next WBS line
// with its dollars, or moved the band back (Chromium and jsdom, d3ce17d; the boxes also on ba3c294 and v2.08, by the box's own
// search for "the same onclick and text"). The rule: after a redraw the keyboard is back on the same control standing for the
// SAME item, or nowhere -- in a box, on the box itself. jsdom has no layout, so for the boxes the board's test of what is on
// screen is answered "yes" for every element while it runs (the browser's answer; npm run pointer H is the same in Chromium).
// Each part fails on d3ce17d unless it says CONTROL.
await (async () => {
  const name = 'v2.09 third review — clin: a control that names its item by its place is found again only where that item still stands';
  try {
  const J = JSON.stringify;
  const itx = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Req ' + id, event: 'EV-' + id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
  const part = (tag, fn) => { try { fn(); } catch (e) { failures.push({ scenario: name, where: tag, what: 'the part threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' }); } };
  // T carries three awards (Dec $100, Mar $200, Jun $50 on USAF); X and Y are directed $600 of USAF discretionary each against a
  // USAF lane of $500, so X draws $500 and Y nothing -- two lines of the not-drawn list, X's first
  const mk = () => {
    const B = boot(); const items = [itx('X', 'AV', [600, 0, 0]), itx('Y', 'AV', [600, 0, 0]), itx('T', 'AV', [400, 0, 0]), itx('U', 'AV', [100, 0, 0])];
    seed(B.ev, { services: ['USAF', 'ANG', 'AFRC'], items, disc: [500, 9000, 9000], mand: [0, 0, 0], order: ['X', 'Y', 'T', 'U'],
      fsrc: { X: { m: 'split', dv: [600, 0, 0], mv: [0, 0, 0] }, Y: { m: 'split', dv: [600, 0, 0], mv: [0, 0, 0] } } });
    B.ev(`(function(){ BASE_ITEMS.length=0; ${J(items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.awards.T={mode:'inc', inc:[{d:FYMON[2][0], day:5, sv:[100,0,0]}, {d:FYMON[5][0], day:9, sv:[200,0,0]}, {d:FYMON[8][0], day:12, sv:[50,0,0]}]};
      S.wbs.T=[{w:'1.1', v:[100,0,0]}, {w:'1.2', v:[100,0,0]}, {w:'1.3', v:[100,0,0]}];
      window.confirm=function(){ return true; }; window.alert=function(){};
      UI2.on=true; UI2.dock=true; uiMode='review'; uiApply(); setCur('T'); save(); render();
      window.__kb=function(){ var a=document.activeElement; if(!a || a===document.body) return 'nowhere';
        if(a.classList && a.classList.contains('modal')) return 'the box '+(a.parentElement? a.parentElement.id : '');
        return (a.getAttribute('onchange')||a.getAttribute('onclick')||'').replace(/,this\\.value\\)$/, ')').slice(0, 40); };
      // a button pressed from the keyboard: the key, then the click it makes; and again on whatever has the keyboard now
      window.__enter=function(b){ b.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true})); b.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window})); };
      window.__again=function(){ var a=document.activeElement; if(a && a.tagName==='BUTTON') __enter(a); return 'ok'; };
      window.__btn=function(sc, h){ return [].filter.call(document.querySelectorAll(sc+' button'), function(b){ return b.getAttribute('onclick')===h; })[0]; };
      window.__inp=function(sc, h){ return [].filter.call(document.querySelectorAll(sc+' input'), function(b){ return b.getAttribute('onchange')===h; })[0]; };
      window.__aw=function(){ return S.awards.T.inc.map(function(x){ return FYMON.findIndex(function(m){ return m[0]===x.d; })+'/'+x.day+':'+x.sv[0]; }).join(' | '); };
      return 'ok'; })()`);
    return B;
  };
  // the board's "is it on screen" answered yes while fn runs: jsdom draws nothing, and a box looks for its control only among those
  const shown = (ev, fn) => { ev(`window.__gcr=Element.prototype.getClientRects; Element.prototype.getClientRects=function(){ return [{}]; }; 'ok'`);
    try { return fn(); } finally { ev(`Element.prototype.getClientRects=window.__gcr; 'ok'`); } };

  // ---- 1. the finding: an award's ✕ in the RECORD panel, from the keyboard
  part('an award’s ✕', () => {
    const { ev } = mk();
    ev(`(function(){ var b=__btn('#inspector', 'rmAwd("T",0)'); b.focus(); __enter(b); return 'ok'; })()`);
    chk(name, 'an award’s ✕', 'the first award’s ✕ pressed from the keyboard: the Dec award is removed, and the keyboard goes nowhere -- not to the Mar award’s ✕, moved into its place as rmAwd("T",0)',
      ev(`JSON.stringify([__aw(), __kb()])`), J(['5/9:200 | 8/12:50', 'nowhere']));
    ev(`__again()`);
    chk(name, 'an award’s ✕', 'and a second Enter removes nothing: the Mar $200 and Jun $50 awards are both still there', ev(`__aw()`), '5/9:200 | 8/12:50');
  });
  // ---- 2. an award's date walked past another: the award re-sorts, and the date box at its old place is another award's
  part('an award’s date', () => {
    const { ev } = mk();
    const date = (i, m, d) => `(function(){ var A=__inp('#inspector', 'setAwdIncDate("T",${i},this.value)'); A.focus(); A.value=FYMON[${m}][0]+'-${d}';
      A.dispatchEvent(new Event('input', {bubbles:true})); A.dispatchEvent(new Event('change', {bubbles:true})); return __kb()+' '+(document.activeElement.value||''); })()`;
    // Chromium commits a date box on every step of ArrowUp, the box keeping the keyboard: a step that stays between its
    // neighbours keeps it there
    chk(name, 'an award’s date', 'CONTROL: the Mar award re-dated to Apr, still before Jun: the keyboard stays on its date box, holding the new date',
      ev(date(1, 6, '09')), 'setAwdIncDate("T",1) ' + ev(`FYMON[6][0]`) + '-09');
    const B2 = mk();
    chk(name, 'an award’s date', 'the Mar award re-dated to Jul, past the Jun award: the awards re-sort and the keyboard goes nowhere -- not to the date box now at its place, the Jun award’s',
      B2.ev(date(1, 9, '09')).split(' ')[0], 'nowhere');
    B2.ev(`(function(){ var A=document.activeElement; if(A && A.tagName==='INPUT'){ A.value=FYMON[10][0]+'-12'; A.dispatchEvent(new Event('change', {bubbles:true})); } return 'ok'; })()`);
    chk(name, 'an award’s date', 'and the next step re-dates nothing: the Jun $50 award keeps its date, and the Jul award is the $200', B2.ev(`__aw()`), '2/5:100 | 8/12:50 | 9/9:200');
  });
  // ---- 3. "set to drawn" in the not-drawn list, a box: the next line is another requirement's
  part('set to drawn', () => {
    const { ev } = mk();
    ev(`ndOpen=true; render(); dlgSync(); 'ok'`);
    chk(name, 'set to drawn', 'CONTROL: the list holds X’s line, then Y’s', ev(`JSON.stringify(ndData().list.map(function(g){ return g.id; }))`), J(['X', 'Y']));
    shown(ev, () => {
      ev(`(function(){ var b=__btn('#ndBody', 'ndSetDrawn(0)'); b.focus(); __enter(b); dlgSync(); return 'ok'; })()`);
      chk(name, 'set to drawn', 'X’s line set to drawn from the keyboard: X is directed what it drew, and the keyboard is on the box itself -- not on the button now at its place, Y’s',
        ev(`JSON.stringify([S.fsrc.X.dv, __kb()])`), J([[500, 0, 0], 'the box ndPanel']));
      ev(`__again(); dlgSync(); 'ok'`);
    });
    chk(name, 'set to drawn', 'and a second Enter leaves Y’s directed figure as it was', ev(`JSON.stringify(S.fsrc.Y.dv)`), J([600, 0, 0]));
  });
  // ---- 4. a WBS line's ✕, in its box
  part('a WBS line’s ✕', () => {
    const { ev } = mk();
    ev(`toggleWbs('req', 'T'); dlgSync(); 'ok'`);
    shown(ev, () => {
      ev(`(function(){ var b=__btn('#wbsBody', 'wbsDel("req","T","",0)'); b.focus(); __enter(b); dlgSync(); return 'ok'; })()`);
      chk(name, 'a WBS line’s ✕', 'line 1.1’s ✕ pressed from the keyboard: 1.1 is removed, and the keyboard is on the box itself -- not on 1.2’s ✕, moved into its place',
        ev(`JSON.stringify([S.wbs.T.map(function(x){ return x.w; }), __kb()])`), J([['1.2', '1.3'], 'the box wbsPanel']));
      ev(`__again(); dlgSync(); 'ok'`);
    });
    chk(name, 'a WBS line’s ✕', 'and a second Enter removes nothing: 1.2 and 1.3 are there with their dollars', ev(`JSON.stringify(S.wbs.T)`), J([{ w: '1.2', v: [100, 0, 0] }, { w: '1.3', v: [100, 0, 0] }]));
  });
  // ---- 5. a band's ▲, in the Bands box: the band moved down into its place has a ▲ that names that place too
  part('a band’s ▲', () => {
    const { ev } = mk();
    ev(`bandPanelOpen=true; render(); dlgSync(); 'ok'`);
    const L = () => ev(`JSON.stringify(BANDS_LIST().map(function(b){ return b.id; }))`);
    const l0 = JSON.parse(L());
    shown(ev, () => {
      ev(`(function(){ var b=__btn('#bandList', 'bandMove(2,-1)'); b.focus(); __enter(b); dlgSync(); return 'ok'; })()`);
      chk(name, 'a band’s ▲', 'the third band’s ▲ pressed from the keyboard: it moves up one, and the keyboard is on the box itself -- not on the ▲ of the band moved down into its place, which a second Enter would move back',
        ev(`JSON.stringify([BANDS_LIST().map(function(b){ return b.id; }), __kb()])`), J([[l0[0], l0[2], l0[1]].concat(l0.slice(3)), 'the box bandPanel']));
      ev(`__again(); dlgSync(); 'ok'`);
    });
    chk(name, 'a band’s ▲', 'and a second Enter moves nothing back', L(), J([l0[0], l0[2], l0[1]].concat(l0.slice(3))));
  });
  // ---- 6. CONTROLs: a place that cannot move keeps the keyboard -- a service, and a row's own ▲
  part('places that do not move', () => {
    const { ev } = mk();
    chk(name, 'places that do not move', 'CONTROL: the Mar award’s USAF dollars, 2500 Entered: stored (drawn again as 2,500), and the keyboard stays on that box (a service is one of a fixed few, though the award is one of a list)',
      ev(`(function(){ var A=__inp('#inspector', 'setAwdIncSvc("T",1,0,this.value)'); A.focus(); A.value='2500'; A.dispatchEvent(new Event('input', {bubbles:true}));
        A.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true})); A.dispatchEvent(new Event('change', {bubbles:true})); return __kb()+' '+__aw(); })()`),
      'setAwdIncSvc("T",1,0) 2/5:100 | 5/9:2500 | 8/12:50');
    ev(`uiMode='rank'; uiApply(); render(); 'ok'`);
    chk(name, 'places that do not move', 'CONTROL: Rank, T’s ▲ pressed from the keyboard: T moves up one, and the keyboard is on T’s ▲ (its handler names T)',
      ev(`(function(){ var b=__btn('#row-T', 'bump("T",-1)'); b.focus(); __enter(b); return S.order.indexOf('T')+' '+__kb(); })()`), '1 bump("T",-1)');
  });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
})();
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

// ==== v2.12 W1 (item 132): the ACE import by its header titles, the WBS tree, PSM inside Air Vehicle ====
// ==== end v2.12 W1 ====

// ==== v2.12 W2 (item 132): a WBS paragraph on every requirement, picked; the Spend Plan Source carries it; the FYDP plan joins STOVL ====
// ==== end v2.12 W2 ====

// ==== v2.12 W3 (item 134): every year's budget is the PPBE position; over and under flagged; unallocated added funds as UPL ====
// THE FIXTURE, three years and three services, every figure a literal so each expectation below is worked out by hand:
//   board's own base  FY27 disc [1000,400,300] mand [200,100,50]   FY28 [1100,410,310] / [210,110,60]   FY29 [1200,420,320] / [220,120,70]
//   added sources     FY27 disc [150,0,30] and mand [0,40,0]        FY28 disc [75,0,0]                   FY29 none
//   BES28 position    USAF FY27 900 / 300, FY28 5000 / 700; ANG entered in $K, FY27 452 / 90 (stored $452,000 / $90,000);
//                     AFRC named nowhere (the board's own base stands), FY29 logged by nobody (every base the board's own)
//   requirements      A [600,200,100]  B [500,300,200]  C [400,100,100], A then B then C
//   FY27 Splits       A disc [600,200,0] mand [0,0,100]; B disc [500,300,150] mand [0,0,50]; C on the lane walk. They over-hold
//                     USAF discretionary by $50 and AFRC mandatory by $100; FY28 and FY29 are on the lane walk, under-allocated.
const W3SV = ['USAF', 'ANG', 'AFRC'];
const w3Board = () => {
  const B = boot();
  seed(B.ev, { services: W3SV, items: [it('A', 'AV', [600, 200, 100]), it('B', 'PSM', [500, 300, 200]), it('C', 'AV', [400, 100, 100])],
    disc: [1000, 400, 300], mand: [200, 100, 50], order: ['A', 'B', 'C'] });
  // MS.svc: the board's own service list, so a load through applyStore keeps it (syncSvc reads it on a board with no data)
  B.ev(`window.confirm=function(){ return true; }; window.alert=function(){}; MS.svc=SVC.slice();
    BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.bm={disc:[1000,400,300], mand:[200,100,50], adds:[{name:'Cong add', pool:'disc', vec:[150,0,30]}, {name:'Supplemental', pool:'mand', vec:[0,40,0]}]};
    S.fsrc={A:{m:'split', dv:[600,200,0], mv:[0,0,100]}, B:{m:'split', dv:[500,300,150], mv:[0,0,50]}};
    applyState(S); MS.years[MS.cur]=S; save();
    switchYear(2028); S.bm={disc:[1100,410,310], mand:[210,110,60], adds:[{name:'Cong add', pool:'disc', vec:[75,0,0]}]}; S.fsrc={}; applyState(S); MS.years[2028]=S; save();
    switchYear(2029); S.bm={disc:[1200,420,320], mand:[220,120,70], adds:[]}; S.fsrc={}; applyState(S); MS.years[2029]=S; save();
    switchYear(2027);
    ppCyc='BES'; ppYr=2028;
    // v2.12 (item 134, Brad's R37 decision): the position is entered split, as its Disc and Mand figures say it is -- a position
    // left in one-figure mode now gives each service's TOTAL, which the board's own base divides between the lanes
    ppSplitSet(true);
    ppSetV('USAF','_all',2027,'d','900'); ppSetV('USAF','_all',2027,'m','300'); ppSetV('USAF','_all',2028,'d','5000'); ppSetV('USAF','_all',2028,'m','700');
    ppUnitSet('ANG','k'); ppSetV('ANG','_all',2027,'d','452'); ppSetV('ANG','_all',2027,'m','90');
    render(); 'ok'`);
  return B;
};
// what a year holds as its budget authority: the cache the Spruills and the other appropriations read, straight from MS.years
const w3Cache = (B, y) => B.ev(`JSON.stringify([MS.years[${y}].discSvc, MS.years[${y}].mandSvc])`);
// a workbook as it was downloaded, read back from its bytes with the board's reader
const w3Book = async (B, call) => JSON.parse(await B.w.eval(`(async function(){
  var cap=null, _B=window.Blob, oC=HTMLAnchorElement.prototype.click;
  window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
  HTMLAnchorElement.prototype.click=function(){};
  try{ ${call}; } finally { window.Blob=_B; HTMLAnchorElement.prototype.click=oC; }
  if(!cap) return JSON.stringify({err:'no workbook'});
  return JSON.stringify(await xlsxRead(cap.buffer.slice(cap.byteOffset, cap.byteOffset+cap.byteLength))); })()`));
{
  const name = 'v2.12 W3 — every year’s budget authority is read from the PPBE position, live (item 134)';
  try {
    const J = JSON.stringify;
    const B = w3Board(), { ev } = B;
    // ---- untagged: the board's own base, every year
    chk(name, 'untagged', 'CONTROL: an untagged plan reads the board’s own base plus added sources, every year (FY27 on screen, FY28 and FY29 as stored)',
      J([w3Cache(B, 2027), w3Cache(B, 2028), w3Cache(B, 2029)]),
      J([J([[1150, 400, 330], [200, 140, 50]]), J([[1175, 410, 310], [210, 110, 60]]), J([[1200, 420, 320], [220, 120, 70]])]));
    // ---- tagged BES28: every year at once, through the writer a person uses
    ev(`cycSetWorking('BES', 2028); 'ok'`);
    chk(name, 'tagged BES28', 'FY27 (on screen): USAF and ANG from BES28 (ANG’s $K figures read as the dollars they are), AFRC the board’s own -- each plus its added sources',
      w3Cache(B, 2027), J([[1050, 452000, 330], [300, 90040, 50]]));
    chk(name, 'tagged BES28', 'FY28’s stored budget is live without the year being opened: USAF from BES28, ANG named and logged nothing for FY28 ($0), AFRC its own',
      w3Cache(B, 2028), J([[5075, 0, 310], [700, 0, 60]]));
    chk(name, 'tagged BES28', 'FY29, a year BES28 logs nothing for: every base the board’s own',
      w3Cache(B, 2029), J([[1200, 420, 320], [220, 120, 70]]));
    chk(name, 'tagged BES28', 'the board’s own base is never overwritten (FY27 and FY28)',
      ev(`JSON.stringify([S.bm.disc, S.bm.mand, MS.years[2028].bm.disc, MS.years[2028].bm.mand])`), J([[1000, 400, 300], [200, 100, 50], [1100, 410, 310], [210, 110, 60]]));
    chk(name, 'tagged BES28', 'where each base came from, recorded for the panels (never saved): FY27 USAF and ANG from the position, AFRC the board’s own',
      ev(`JSON.stringify([BA_SRC[2027].from, BA_SRC[2027].key, BA_SRC[2029].logged, JSON.stringify(MS).indexOf('BA_SRC')])`), J([['pos', 'pos', 'board'], 'BES|2028', false, -1]));
    chk(name, 'tagged BES28', 'the lane walk draws against it: USAF discretionary drawn is BES28’s plus the add, no more',
      ev(`(function(){ var T=tiers(), t=0; S.order.forEach(function(id){ t+=T[id].d[0]; }); return t; })()`), 1050);
    chk(name, 'the Spruills', 'Available Funding each year is the live budget (Σ disc + mand): 32,1520 · 6,145 · 2,370 for FY27–FY29',
      ev(`(function(){ var k=[spBy,spSvc,spPmo]; spBy='pmo'; spSvc='ALL'; spPmo='ALL'; var b=spGather().blocks.find(function(x){ return x.name===APPN; }); spBy=k[0]; spSvc=k[1]; spPmo=k[2]; return JSON.stringify([b.bud[2027], b.bud[2028], b.bud[2029]]); })()`),
      J([1050 + 452000 + 330 + 300 + 90040 + 50, 5075 + 0 + 310 + 700 + 0 + 60, 1200 + 420 + 320 + 220 + 120 + 70]));
    // ---- a figure typed into the position moves the budget at once: the year on screen, and a year not opened
    ev(`ppCyc='BES'; ppYr=2028; ppSetV('USAF','_all',2028,'d','6000'); 'ok'`);
    chk(name, 'live', 'BES28 USAF FY28 typed 6,000: FY28’s stored budget is 6,075 at once, without opening FY28', w3Cache(B, 2028), J([[6075, 0, 310], [700, 0, 60]]));
    ev(`ppSetV('USAF','_all',2027,'d','800'); 'ok'`);
    chk(name, 'live', 'BES28 USAF FY27 typed 800: the year on screen is 950 at once', w3Cache(B, 2027), J([[950, 452000, 330], [300, 90040, 50]]));
    ev(`ppSplitSet(false); ppSplitSet(true); ppUnitSet('ANG',''); 'ok'`);
    chk(name, 'live', 'CONTROL: the split turned off and on, and ANG back to dollars, move no figure', w3Cache(B, 2027), J([[950, 452000, 330], [300, 90040, 50]]));
    // whole dollars at the door: a position a file carries with a fraction is read rounded; below zero, the lane is floored at 0
    ev(`MS.ppbe['BES|2028'].val.USAF._all['2027'].d=800.4; MS.ppbe['BES|2028'].val.ANG._all['2028']={d:-500, m:0}; baLiveAll(); 'ok'`);
    chk(name, 'whole dollars', 'a position figure of 800.40 is read as $800 (FY27 USAF 950, a whole dollar), and ANG FY28 at -500 is floored at $0',
      ev(`JSON.stringify([S.discSvc[0], Number.isInteger(S.discSvc[0]), MS.years[2028].discSvc[1]])`), J([950, true, 0]));
    ev(`MS.ppbe['BES|2028'].val.USAF._all['2027'].d=800; delete MS.ppbe['BES|2028'].val.ANG._all['2028']; baLiveAll(); 'ok'`);
    // the $K conversion and its undo move the budget at once -- in a year NOT on screen too (FY28 ANG $7 typed first): the year
    // on screen is applied again whenever the board draws, so only another year's stored budget shows the refresh was made
    ev(`ppSetV('ANG','_all',2028,'d','7'); ppUnitSet('ANG','k'); 'ok'`);
    chk(name, 'live', 'ANG’s figures turned to $K and multiplied by 1,000: FY27 ANG’s budget is 1,000 times, and FY28’s stored ANG $7,000, at once',
      ev(`JSON.stringify([S.discSvc[1], S.mandSvc[1], MS.years[2028].discSvc[1]])`), J([452000000, 90000040, 7000]));
    ev(`ppUnitUndo('ANG'); 'ok'`);
    chk(name, 'live', 'and the ×1,000 undone: back to 452,000 / 90,040, and FY28’s stored ANG $7, at once',
      ev(`JSON.stringify([S.discSvc[1], S.mandSvc[1], MS.years[2028].discSvc[1]])`), J([452000, 90040, 7]));
    ev(`ppSetV('ANG','_all',2028,'d',''); 'ok'`);
    // a load brings a position and a tag: every year's cache is made live as it lands (applyStore), not only the year on screen
    ev(`(function(){ var st=JSON.parse(JSON.stringify(MS)); st.years['2028'].discSvc=[1,2,3]; st.years['2028'].mandSvc=[4,5,6]; applyStore(st); return 'ok'; })()`);
    chk(name, 'a load', 'a store loaded with a stale FY28 cache: FY28 reads BES28 as it lands', w3Cache(B, 2028), J([[6075, 0, 310], [700, 0, 60]]));
    // ---- retag: every year moves to the new position; untag: the board's own back, to the dollar
    ev(`MS.ppbe['PB|2028']={v:2, split:true, lines:{}, val:{AFRC:{_all:{2028:{d:9,m:1}}}}}; cycSetWorking('PB', 2028); 'ok'`);
    chk(name, 'retag', 'retagged PB28: FY28 reads PB28 (AFRC 9 / 1, USAF and ANG not named: their own), FY27 is logged by nobody in PB28 (its own)',
      J([w3Cache(B, 2028), w3Cache(B, 2027)]), J([J([[1175, 410, 9], [210, 110, 1]]), J([[1150, 400, 330], [200, 140, 50]])]));
    ev(`cycSetWorking('', null); 'ok'`);
    chk(name, 'untag', 'untagged again: every year the board’s own base, to the dollar', J([w3Cache(B, 2027), w3Cache(B, 2028), w3Cache(B, 2029)]),
      J([J([[1150, 400, 330], [200, 140, 50]]), J([[1175, 410, 310], [210, 110, 60]]), J([[1200, 420, 320], [220, 120, 70]])]));
    // ---- the other writers: a line removed, the position deleted
    ev(`cycSetWorking('BES', 2028); ppCyc='BES'; ppYr=2028; ppLineDel('ANG','_all'); 'ok'`);
    chk(name, 'writers', 'ANG’s line removed from BES28: ANG is no longer named, so FY27 ANG is the board’s own again', w3Cache(B, 2027), J([[950, 400, 330], [300, 140, 50]]));
    chk(name, 'writers', 'and in FY28, not on screen: ANG was named and logged nothing there ($0); now its stored budget is the board’s own 410 / 110',
      w3Cache(B, 2028), J([[6075, 410, 310], [700, 110, 60]]));
    ev(`ppLineAdd('AFRC'); 'ok'`);
    chk(name, 'writers', 'an RCN line added for AFRC and not yet filled names nothing: AFRC keeps the board’s own (never a silent $0)', w3Cache(B, 2027), J([[950, 400, 330], [300, 140, 50]]));
    ev(`ppDel(); 'ok'`);
    chk(name, 'writers', 'BES28 deleted: the plan is still tagged BES28, and every year is the board’s own', J([ev('MS.cycle'), w3Cache(B, 2027), w3Cache(B, 2028)]),
      J(['BES|2028', J([[1150, 400, 330], [200, 140, 50]]), J([[1175, 410, 310], [210, 110, 60]])]));
    // v2.12 (R37): BES28 entered again, split as before (a new position starts in one-figure mode)
    ev(`ppSplitSet(true); ppSetV('USAF','_all',2027,'d','800'); ppSetV('USAF','_all',2027,'m','300'); ppSetV('USAF','_all',2028,'d','6000'); ppSetV('USAF','_all',2028,'m','700'); 'ok'`);
    // ---- Budget Management: a tagged plan's base is the position's, read-only, named
    ev(`bmOpen=true; render(); 'ok'`);
    chk(name, 'Budget Management', 'tagged: USAF’s two base cells are the position’s, read-only and named; ANG and AFRC keep their boxes; the row names BES28',
      ev(`(function(){ var b=document.getElementById('bmBody'); return JSON.stringify([b.querySelectorAll('td.bmpos').length, [].filter.call(b.querySelectorAll('input'), function(i){ return /bmSetBase/.test(i.getAttribute('onchange')||''); }).length, !!b.querySelector('.bmlive'), /read from BES28/.test(b.textContent), /Take the base from a PPBE position/i.test(b.textContent), b.querySelector('td.bmpos')? b.querySelector('td.bmpos').textContent : '']); })()`),
      J([2, 4, true, true, false, '$800 BES28']));
    ev(`cycSetWorking('', null); 'ok'`);
    chk(name, 'Budget Management', 'untagged: every base is a box again, and Take the base from a PPBE position is offered',
      ev(`(function(){ var b=document.getElementById('bmBody'); return JSON.stringify([b.querySelectorAll('td.bmpos').length, [].filter.call(b.querySelectorAll('input'), function(i){ return /bmSetBase/.test(i.getAttribute('onchange')||''); }).length, !!b.querySelector('.bmlive'), /Take the base from a PPBE position/i.test(b.textContent)]); })()`),
      J([0, 6, false, true]));
    ev(`bmOpen=false; ppCyc='BES'; ppYr=2028; ppSetV('ANG','_all',2027,'d','452000'); ppSetV('ANG','_all',2027,'m','90000'); cycSetWorking('BES', 2028); 'ok'`);
    // ---- opening a board writes nothing: saved, reopened, saved again -- the same bytes but for the clocks
    const zero = s => { const o = JSON.parse(s, (k, v) => (k === 'ts' ? 0 : v)); (function walk(x) { if (!x || typeof x !== 'object') return;
      if (Array.isArray(x.jrnl)) x.jrnl.forEach(e => { if (e) e.t = 0; }); if (x.writer && typeof x.writer === 'object') x.writer.t = 0; Object.values(x).forEach(walk); })(o); return J(o); };
    const pub = h => (/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/.exec(h) || [, 'null'])[1];
    const h1 = ev('buildSavedHtml()');
    const B2 = boot({ html: h1 });
    chk(name, 'reopened', 'the reopened board’s years read BES28 as the board that saved it did', J([w3Cache(B2, 2027), w3Cache(B2, 2028)]), J([w3Cache(B, 2027), w3Cache(B, 2028)]));
    const h2 = B2.ev('buildSavedHtml()');
    chk(name, 'reopened', 'opening wrote nothing: the reopened board saves the very state it opened (clocks aside)', zero(pub(h2)) === zero(pub(h1)) && pub(h1).length > 1000, true);
    // a board saved before v2.12, its FY28 cache stale (the board's own figure while tagged BES28): opening makes it live, writing no save
    const stale = h1.replace(/(<script type="application\/json" id="pubState">)([\s\S]*?)(<\/script>)/, (m, a, b, c) => {
      const o = JSON.parse(b); const st = o.appns[Object.keys(o.appns)[0]]; st.years['2028'].discSvc = [1175, 410, 310]; st.years['2028'].mandSvc = [210, 110, 60];
      return a + J(o).replace(/</g, '\\u003c') + c; });
    const B3 = boot({ html: stale });
    chk(name, 'reopened', 'a file whose FY28 cache was saved stale opens with FY28 read from BES28 (the end of opening refreshes every year)', w3Cache(B3, 2028), J([[6075, 0, 310], [700, 0, 60]]));
    chk(name, 'reopened', 'and opening it marked nothing unsaved', B3.ev(`String(!!(_baseDirty))`), 'false');
    // a year saved by an older build, never opened since (a container it predates is missing): opening, drawing the board and
    // working out the fit of every year read it on a copy, so saving the board straight back writes it as it was
    const old = h1.replace(/(<script type="application\/json" id="pubState">)([\s\S]*?)(<\/script>)/, (m, a, b, c) => {
      const o = JSON.parse(b); const st = o.appns[Object.keys(o.appns)[0]]; delete st.years['2029'].clinRcnSvc; delete st.years['2029'].rcnSvc;
      return a + J(o).replace(/</g, '\\u003c') + c; });
    const B4 = boot({ html: old });
    B4.ev(`render(); fitModel(); 'ok'`);
    const y29 = h => J(JSON.parse(pub(h)).appns[Object.keys(JSON.parse(pub(h)).appns)[0]].years['2029']);
    chk(name, 'reopened', 'a year nobody opened is saved back exactly as it was read: the fit worked it out on a copy', y29(B4.ev('buildSavedHtml()')) === y29(old), true);
    if (B.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
{
  const name = 'v2.12 W3 — the fit to the position: over, unallocated and UPL per year, service and lane (item 134)';
  try {
    const J = JSON.stringify;
    const B = w3Board(), { ev } = B;
    ev(`cycSetWorking('BES', 2028); render(); 'ok'`);
    const F = JSON.parse(ev(`JSON.stringify(fitModel())`));
    // a year the fit does not carry is a failing check that says so, never a throw that hides which check it was
    const lane = (y, k) => { const X = F.years[y] && F.years[y].L && F.years[y].L[k]; return X ? [X.ba, X.held, X.drawn, X.over, X.un, X.upl] : 'FY' + (y % 100) + ' is not in the fit'; };
    // FY27, worked out by hand from the fixture: [BA, held, drawn, over, unallocated, UPL], each by USAF, ANG, AFRC
    chk(name, 'FY27 discretionary', 'BA 1,050 / 452,000 / 330; held 1,100 / 600 / 250 (A and B’s Splits, C’s walk); drawn 1,050 / 600 / 250; USAF over 50; unallocated 0 / 451,400 / 80; UPL AFRC 30 (its add, inside what nobody holds)',
      J(lane(2027, 'd')), J([[1050, 452000, 330], [1100, 600, 250], [1050, 600, 250], [50, 0, 0], [0, 451400, 80], [0, 0, 30]]));
    chk(name, 'FY27 mandatory', 'BA 300 / 90,040 / 50; held 300 / 0 / 150; drawn 300 / 0 / 50; AFRC over 100; unallocated ANG 90,040; UPL ANG 40 (its add)',
      J(lane(2027, 'm')), J([[300, 90040, 50], [300, 0, 150], [300, 0, 50], [0, 0, 100], [0, 90040, 0], [0, 40, 0]]));
    chk(name, 'FY28 discretionary', 'on the lane walk: held is drawn; USAF 5,075 against 1,500 held; ANG $0 BA holds nothing; UPL USAF 75',
      J(lane(2028, 'd')), J([[5075, 0, 310], [1500, 0, 310], [1500, 0, 310], [0, 0, 0], [3575, 0, 0], [75, 0, 0]]));
    chk(name, 'FY28 mandatory', 'USAF 700 nobody holds (no mandatory add, so no UPL); AFRC 60 drawn in full',
      J(lane(2028, 'm')), J([[700, 0, 60], [0, 0, 60], [0, 0, 60], [0, 0, 0], [700, 0, 0], [0, 0, 0]]));
    chk(name, 'the years', 'every held year of the window, and two overs in all', J([F.held, F.over, F.key]), J([[2027, 2028, 2029], 2, 'BES|2028']));
    chk(name, 'the over list', 'FY27 USAF discretionary: every requirement holding money there, in priority order, B marked -- the lane cannot pay its last 50',
      J(F.years[2027].L.d.rows[0].map(r => [r.id, r.rank, r.held, r.drawn, r.short])), J([['A', 1, 600, 600, false], ['B', 2, 500, 450, true]]));
    chk(name, 'the over list', 'FY27 AFRC mandatory: A and B, both marked (A drew 50 of 100, B nothing of 50)',
      J(F.years[2027].L.m.rows[2].map(r => [r.id, r.held, r.drawn, r.short])), J([['A', 100, 50, true], ['B', 50, 0, true]]));
    chk(name, 'reduces nothing', 'the fit changes no figure: the Splits are as typed', ev(`JSON.stringify([S.fsrc.A.dv, S.fsrc.B.mv])`), J([[600, 200, 0], [0, 0, 50]]));
    chk(name, 'the ◨ switch', 'Discretionary only changes what is shown, not what is held: FY27 mandatory still holds 300 / 0 / 150',
      ev(`(function(){ scenView='disc'; _fitCache=null; render(); var h=fitModel().years[2027].L.m.held; scenView=''; _fitCache=null; render(); return JSON.stringify(h); })()`), J([300, 0, 150]));
    // ---- the box
    ev(`fitShow(); 'ok'`);
    // v2.12 RV3 (R15): each over is said against what it is measured against -- USAF's $50 is past BES28's $900 PLUS the lane's
    // $150 Cong add (the requirements hold $200 more than BES28 alone), and AFRC's base is the board's own
    chk(name, 'the box', 'it says each over the way it reads in the room, and nothing else is over',
      ev(`JSON.stringify([].map.call(document.querySelectorAll('#fitBody .fitover'), function(e){ return e.textContent; }))`),
      J(['▲ FY27 O&M, USAF discretionary: requirements hold $50 more than BES28 plus added funding ($900 + $150) — reduce a requirement',
         '▲ FY27 O&M, AFRC mandatory: requirements hold $100 more than the board’s own budget — reduce a requirement']));
    chk(name, 'the box', 'each year says where its base came from',
      ev(`JSON.stringify([].map.call(document.querySelectorAll('#fitBody .fityr span'), function(e){ return e.textContent; }))`),
      J(['Base from BES28 for USAF, ANG · the board’s own for AFRC (BES28 says nothing about it).',
         'Base from BES28 for USAF, ANG · the board’s own for AFRC (BES28 says nothing about it).',
         'BES28 logs nothing for FY29: every base is the board’s own, from Budget Management.']));
    chk(name, 'the box', 'FY27’s UPL column: AFRC discretionary 30, ANG mandatory 40',
      ev(`JSON.stringify([].map.call(document.querySelectorAll('#fitBody table.fittab')[0].querySelectorAll('tr[data-svc]'), function(r){ return r.getAttribute('data-svc')+' '+r.getAttribute('data-lane')+' '+r.lastElementChild.textContent; }))`),
      J(['USAF d —', 'USAF m —', 'ANG d —', 'ANG m $40', 'AFRC d $30', 'AFRC m —']));
    ev(`(function(){ var b=[].filter.call(document.querySelectorAll('#fitBody .fitgo'), function(x){ return /"B"/.test(x.getAttribute('onclick')); })[0]; b.click(); return 'ok'; })()`);
    chk(name, 'the box', 'Go to it closes the box and selects the requirement', ev(`JSON.stringify([fitOpen, curRow])`), J([false, 'B']));
    // ---- Needs attention: one entry while any year is over
    // v2.12 RV3 (R20, K10): one of the two overs is against BES28 and the other against AFRC's own base, so the entry names the mix
    chk(name, 'Needs attention', 'one entry, naming the overs and what they are against, and it opens the box',
      ev(`(function(){ var e=document.querySelector('#posture .fitatt'); if(!e) return 'none'; e.click(); return e.textContent+' | '+fitOpen; })()`), '🏛 2 over budget authority (1 against BES28) | true');
    ev(`fitOpen=false; S.fsrc.A.dv[0]=550; S.fsrc.A.mv[2]=0; save(); render(); 'ok'`);
    chk(name, 'Needs attention', 'reduced until nothing is over: the entry is gone', ev(`String(!!document.querySelector('#posture .fitatt'))`), 'false');
    ev(`S.fsrc.A.dv[0]=600; S.fsrc.A.mv[2]=100; save(); render(); 'ok'`);
    // ---- the UPL, the last line: on the board, after the last row, not a row
    chk(name, 'the board', 'the line after the last requirement: ANG mandatory $40 and AFRC discretionary $30, and it is not a row',
      ev(`(function(){ var L=document.getElementById('list'), u=L.querySelector('.uplline'); if(!u) return 'none';
        var rows=L.querySelectorAll('.row'); return JSON.stringify([[].map.call(u.querySelectorAll('.u'), function(x){ return x.getAttribute('data-svc')+' '+x.getAttribute('data-lane')+' '+x.getAttribute('data-v'); }),
          u.classList.contains('row'), !!u.querySelector('input,button,[draggable]'), rows[rows.length-1].compareDocumentPosition(u) & 4 ? 'after' : 'before']); })()`),
      J([['ANG m 40', 'AFRC d 30'], false, false, 'after']));
    // ---- the Excel workbook, read from its bytes: Funding Streams
    const X = await w3Book(B, 'exportExcel()');
    const fs = X['Funding Streams'] || [], hdr = (fs[2] || []).map(String), col = h => hdr.indexOf(h);
    const iT = fs.findIndex(r => String(r[0]) === 'TOTAL'), iU = fs.findIndex(r => String(r[0]) === 'UPL — added funding no requirement holds');
    chk(name, 'Funding Streams', 'the UPL lines come after the TOTAL, each under its lane’s Remaining column',
      J([iU > iT, fs.slice(iU + 1, iU + 3).map(r => [String(r[0]), Number(r[col('Disc Remaining')]) || 0, Number(r[col('Mand Remaining')]) || 0])]),
      J([true, [['UPL · ANG', 0, 40], ['UPL · AFRC', 30, 0]]]));
    chk(name, 'Funding Streams', 'and the TOTAL is still the sum of the service rows above it (Disc BA, Disc Funded, Mand Remaining)',
      J(['Disc BA', 'Disc Funded', 'Mand Remaining'].map(h => Number(fs[iT][col(h)]) - fs.slice(3, iT).reduce((a, r) => a + (Number(r[col(h)]) || 0), 0))), J([0, 0, 0]));
    // ---- the Priority Drill's 1-N tab
    const D = await w3Book(B, 'exportCSV()');
    const nt = D['1-N by Band'] || [], nh = (nt.find(r => String(r[0]) === 'Rank') || []).map(String);
    const iA = nt.findIndex(r => /^ALL BANDS/.test(String(r[0]))), ups = nt.filter(r => /^UPL — added funding no requirement holds/.test(String(r[0])));
    chk(name, '1-N by Band', 'a UPL line per lane after ALL BANDS: discretionary 30 (AFRC), mandatory 40 (ANG)',
      J([nt.indexOf(ups[0]) > iA, ups.map(r => [String(r[0]), Number(r[nh.indexOf('Discretionary')]) || 0, Number(r[nh.indexOf('Mandatory')]) || 0, W3SV.map(s => Number(r[nh.indexOf(s + ' funded')]) || 0)])]),
      J([true, [['UPL — added funding no requirement holds (discretionary)', 30, 0, [0, 0, 30]], ['UPL — added funding no requirement holds (mandatory)', 0, 40, [0, 40, 0]]]]));
    const reqRows = nt.filter(r => /^\d+$/.test(String(r[0])));
    chk(name, '1-N by Band', 'and ALL BANDS is still the sum of the requirement rows (Funded, Discretionary, Mandatory)',
      J(['Funded', 'Discretionary', 'Mandatory'].map(h => Number(nt[iA][nh.indexOf(h)]) - reqRows.reduce((a, r) => a + (Number(r[nh.indexOf(h)]) || 0), 0))), J([0, 0, 0]));
    // ---- the FYDP Spend Plan's appropriation tab: each year from its projection, $M read back in dollars
    const Y = await w3Book(B, `fydpSrc='working'; exportFydpPlan()`);
    const at = Y[ev('appnName(mySlug())')] || [], fh = (at.find(r => String(r[0]) === 'CCaR Record') || []).map(String);
    const $ = v => (String(v) === '—' ? '—' : Math.round(Number(v) * 1e6));
    const fyCol = y => fh.indexOf('FY' + (y % 100)) + 1;    // the Allocated column under each year
    const iFT = at.findIndex(r => String(r[0]) === 'TOTAL'), fu = at.filter(r => /^UPL — added funding no requirement holds/.test(String(r[0])));
    // v2.12 RV3 (R22): a line per service and lane, as every other surface states it -- the services were added together
    chk(name, 'FYDP Spend Plan', 'a UPL line per service and lane after the tab’s TOTAL, each held year’s UPL in its Allocated column, — for a year not held, the FYDP at the right',
      J([at.indexOf(fu[0]) > iFT, fu.map(r => [String(r[0])].concat([2027, 2028, 2029, 2030, 2031].map(y => $(r[fyCol(y)]))).concat([$(r[fh.indexOf('TOTAL FY27–FY31') + 1])]))]),
      J([true, [['UPL — added funding no requirement holds · USAF (discretionary)', 0, 75, 0, '—', '—', 75],
                ['UPL — added funding no requirement holds · AFRC (discretionary)', 30, 0, 0, '—', '—', 30],
                ['UPL — added funding no requirement holds · ANG (mandatory)', 40, 0, 0, '—', '—', 40]]]));
    const fLines = at.slice(at.findIndex(r => String(r[0]) === 'CCaR Record') + 2, iFT);
    chk(name, 'FYDP Spend Plan', 'and the TOTAL is still the sum of the requirement lines, each held year’s Allocated',
      J([2027, 2028, 2029].map(y => $(at[iFT][fyCol(y)]) - fLines.reduce((a, r) => a + ($(r[fyCol(y)]) || 0), 0))), J([0, 0, 0]));
    // ---- untagged and with no added funding: no UPL line anywhere, the sheets as they were
    const N = boot();
    seed(N.ev, { services: W3SV, items: [it('A', 'AV', [600, 200, 100])], disc: [1000, 400, 300], mand: [200, 100, 50], order: ['A'] });
    N.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); MS.years[MS.cur]=S; render(); 'ok'`);
    const NX = await w3Book(N, 'exportExcel()'), ND = await w3Book(N, 'exportCSV()');
    chk(name, 'no added funding', 'CONTROL: nothing unallocated is added funding, so no UPL line on the board, Funding Streams or the 1-N tab',
      J([N.ev(`String(!!document.querySelector('#list .uplline'))`), (NX['Funding Streams'] || []).some(r => /^UPL/.test(String(r[0]))), (ND['1-N by Band'] || []).some(r => /^UPL/.test(String(r[0])))]),
      J(['false', false, false]));
    if (B.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
{
  const name = 'v2.12 W3 — a lock keeps the position it read; only the working plan reads live (item 134)';
  try {
    const J = JSON.stringify;
    const B = w3Board(), { ev } = B;
    // ---- a lock taken on an UNTAGGED plan tags it first, and is taken under the position it gives the plan
    chk(name, 'tag first', 'CONTROL: the plan is untagged before the lock', ev('MS.cycle'), '');
    ev(`blCyc='BES'; blYr=2028; cycLock(); 'ok'`);
    const c = JSON.parse(ev(`JSON.stringify(blGet('BES|2028'))`));
    chk(name, 'tag first', 'the lock tagged the plan BES28', ev('MS.cycle'), 'BES|2028');
    chk(name, 'tag first', 'and its projection was taken under that tag: FY27 and FY28 budget from BES28 (taken before the tag, it froze the board’s own 1,150 / 1,175)',
      J([c.proj[2027].disc, c.proj[2027].mand, c.proj[2028].disc]), J([[1050, 452000, 330], [300, 90040, 50], [5075, 0, 310]]));
    chk(name, 'tag first', 'the tag it carried before is still what the lock records as where it came from', c.from, '');
    chk(name, 'the copy', 'the lock keeps a copy of the position it read', J([c.pos && c.pos.key, c.pos && c.pos.P.val.USAF._all[2027]]), J(['BES|2028', { d: 900, m: 300 }]));
    chk(name, 'the projection', 'and its FY27 UPL as locked: AFRC discretionary 30, ANG mandatory 40', J(c.proj[2027].upl), J({ d: [0, 0, 30], m: [0, 40, 0] }));
    // ---- the position changed after the lock: the working plan moves, the lock and its view do not
    ev(`ppCyc='BES'; ppYr=2028; ppSetV('USAF','_all',2027,'d','700'); 'ok'`);
    chk(name, 'after the lock', 'BES28 USAF FY27 typed 700 after the lock: the working plan is 850 at once', ev(`S.discSvc[0]`), 850);
    chk(name, 'after the lock', 'the lock’s projection and its copy of the position are as locked',
      ev(`JSON.stringify([blGet('BES|2028').proj[2027].disc[0], blGet('BES|2028').pos.P.val.USAF._all[2027].d])`), J([1050, 900]));
    ev(`cycView('BES|2028'); 'ok'`);
    chk(name, 'the view', 'its view reads the position as it was locked, every year: FY27 1,050, FY28 5,075 (today’s BES28 says 850)',
      ev(`JSON.stringify([CYCVIEW, S.discSvc[0], MS.years[2028].discSvc[0]])`), J(['BES|2028', 1050, 5075]));
    ev(`fitShow(); 'ok'`);
    chk(name, 'the view', 'the fit box in the view says it reads the lock’s copy', /as it was when it was locked/.test(ev(`document.getElementById('fitBody').textContent`)), true);
    ev(`fitOpen=false; cycLeave(); 'ok'`);
    chk(name, 'the view', 'left: the working plan reads today’s BES28 again', ev(`S.discSvc[0]`), 850);
    // ---- a lock taken before v2.12 kept no position: its years read as locked (the board's own base), whatever the tag says
    // v2.15 W1 (item 139): Lock now refuses a plan tagged with another cycle, so this lock -- as a build before v2.12 left it -- is taken
    // with the plan on PB27 for the moment, then the tag put back
    ev(`MS.cycle='PB|2027'; blCyc='PB'; blYr=2027; cycLock(); MS.cycle='BES|2028'; baLiveAll(); (function(){ var c=blGet('PB|2027'); delete c.pos;
      Object.keys(c.years).forEach(function(y){ var st=c.years[y]; st.discSvc=st.bm.disc.map(function(v,i){ return v+(st.bm.adds||[]).filter(function(a){ return a.pool!=='mand'; }).reduce(function(t,a){ return t+(a.vec[i]||0); },0); }); }); persistCyc(); })(); 'ok'`);
    ev(`cycView('PB|2027'); 'ok'`);
    chk(name, 'before v2.12', 'a lock with no position reads its years’ own bases in its view, though the working plan beside it is tagged BES28',
      ev(`JSON.stringify([MS.cycle, S.discSvc, S.mandSvc])`), J(['BES|2028', [1150, 400, 330], [200, 140, 50]]));
    ev(`cycLeave(); 'ok'`);
    chk(name, 'before v2.12', 'and the working plan is unchanged by having shown it', ev(`JSON.stringify(S.discSvc)`), J([850, 452000, 330]));
    if (B.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ---- v2.12 RV3: the review's fixes to item 134 (recovery/v212/notes-RV3.md). Each block fails on c23e8a0 unless it says CONTROL.
// the saved state a board file carries, and the same file with it changed by `fn(store)` -- a hand edit or a damaged transfer
const rv3Pub = h => JSON.parse((/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/.exec(h) || [, 'null'])[1]);
const rv3Edit = (h, fn) => h.replace(/(<script type="application\/json" id="pubState">)([\s\S]*?)(<\/script>)/, (m, a, b, c) => {
  const o = JSON.parse(b); fn(o.appns[Object.keys(o.appns)[0]], o); return a + JSON.stringify(o).replace(/</g, '\\u003c') + c; });
// the saved state with the clocks the save stamps set to zero (ts, the journal's t, the writer's t): what opening may not change
const rv3Zero = h => { const o = JSON.parse(JSON.stringify(rv3Pub(h)), (k, v) => (k === 'ts' ? 0 : v)); (function walk(x) { if (!x || typeof x !== 'object') return;
  if (Array.isArray(x.jrnl)) x.jrnl.forEach(e => { if (e) e.t = 0; }); if (x.writer && typeof x.writer === 'object') x.writer.t = 0; Object.values(x).forEach(walk); })(o); return JSON.stringify(o); };
{
  const name = 'v2.12 RV3 — a PPBE position that cannot be read never stops the board opening, and the door refuses it (R12, R23, R24)';
  try {
    const J = JSON.stringify;
    const B = w3Board(), { ev } = B;
    ev(`cycSetWorking('BES', 2028); 'ok'`);
    const h1 = ev('buildSavedHtml()');
    const P = st => st.ppbe['BES|2028'], AP = Object.keys(rv3Pub(h1).appns)[0];
    const rows = X => X.ev(`document.querySelectorAll('#list .row').length`);
    // ---- a line list that is not a list, and one holding a null: the board opens, USAF keeps its own base, and says why
    const hStr = rv3Edit(h1, st => { P(st).lines.USAF = 'x'; });
    const hNul = rv3Edit(h1, st => { P(st).lines.USAF = [null]; });
    const S1 = boot({ html: hStr }), S2 = boot({ html: hNul });
    chk(name, 'opens', 'a board tagged to a position whose USAF line list is the text "x" opens: its three requirements are drawn, nothing threw',
      J([rows(S1), S1.errors.length]), J([3, 0]));
    chk(name, 'opens', 'and a list holding a null opens the same way', J([rows(S2), S2.errors.length]), J([3, 0]));
    chk(name, 'opens', 'FY27 USAF reads the board’s own base (1,000 + the 150 add; mandatory 200), ANG still BES28’s, AFRC its own',
      w3Cache(S1, 2027), J([[1150, 452000, 330], [200, 90040, 50]]));
    chk(name, 'opens', 'and where it came from is recorded with why: the board’s own, its line list not a list',
      S1.ev(`JSON.stringify([BA_SRC[2027].from[0], BA_SRC[2027].bad[0]])`), J(['board', 'its line list is not a list']));
    S1.ev(`fitShow(); 'ok'`);
    chk(name, 'said', 'the fit box says USAF’s base is the board’s own because BES28 cannot be read for it',
      S1.ev(`(document.querySelector('#fitBody .fityr span')||{}).textContent||''`),
      'Base from BES28 for ANG · the board’s own for AFRC (BES28 says nothing about it) · the board’s own for USAF (its line list is not a list), where BES28 cannot be read.');
    chk(name, 'opens', 'the PPBE Budget Positions box opens on each, USAF first, without a throw',
      J([S1, S2].map(X => X.ev(`(function(){ try{ fitOpen=false; ppCyc='BES'; ppYr=2028; ppSvcIdx=0; toggleP2(); return String(!!document.querySelector('#ppBody .pptab')); }catch(e){ return 'threw: '+e.message; } })()`))),
      J(['true', 'true']));
    // ---- the door refuses both, naming the place; a load that does reach applyStore lands whole and does not throw
    chk(name, 'the door', 'the import check refuses the text line list, naming it',
      B.ev(`inboundCheck(${J(hStr)})`), 'the line list at the saved state.appns.' + AP + '.ppbe.BES|2028.lines.USAF is not a list (“"x"”)');
    chk(name, 'the door', 'and the null line, naming it', B.ev(`inboundCheck(${J(hNul)})`),
      'the line at the saved state.appns.' + AP + '.ppbe.BES|2028.lines.USAF[0] is not a line (“null”)');
    chk(name, 'a load', 'a store carrying the null line, loaded straight through applyStore, does not throw and lands whole (the tag, the position, every year)',
      ev(`(function(){ var st=JSON.parse(JSON.stringify(MS)); st.ppbe['BES|2028'].lines.USAF=[null]; st.years['2027'].order=['C','B','A'];
        try{ applyStore(st); }catch(e){ return 'threw: '+e.message; } return JSON.stringify([MS.cycle, S.order, S.discSvc[0], MS.ppbe['BES|2028'].lines.USAF]); })()`),
      J(['BES|2028', ['C', 'B', 'A'], 1150, [null]]));
    ev(`(function(){ var st=JSON.parse(JSON.stringify(MS)); st.ppbe['BES|2028'].lines.USAF=[{k:'_all', all:true}]; st.years['2027'].order=['A','B','C']; applyStore(st); return 'ok'; })()`);
    // ---- a figure written as text is read as the figure; a figure written as words cannot be read, and the door refuses it
    // (and AFRC given BES28's one figure, written as text: a service whose only figure is text is still one the position names)
    const hTxt = rv3Edit(h1, st => { P(st).val.USAF._all['2027'].d = '1,000'; P(st).lines.AFRC = [{ k: '_all', all: true }]; P(st).val.AFRC = { _all: { 2027: { d: '1,400', m: 0 } } }; });
    chk(name, 'text', 'CONTROL: the import check takes a figure written as text, as it takes every other amount', B.ev(`inboundCheck(${J(hTxt)})`), '');
    const S3 = boot({ html: hTxt });
    chk(name, 'text', 'BES28 USAF FY27 written as "1,000" is $1,000 of budget authority (+ the 150 add), read from BES28 -- not $0; AFRC’s "1,400" is $1,400 (+ its 30 add)',
      S3.ev(`JSON.stringify([S.discSvc[0], S.discSvc[2], BA_SRC[2027].from])`), J([1150, 1430, ['pos', 'pos', 'pos']]));
    const hWrd = rv3Edit(h1, st => { P(st).val.USAF._all['2027'].d = 'abc'; });
    chk(name, 'words', 'the import check refuses a figure written as words, naming it', B.ev(`inboundCheck(${J(hWrd)})`),
      'the amount at the saved state.appns.' + AP + '.ppbe.BES|2028.val.USAF._all.2027.d is not a figure (“abc”)');
    const S4 = boot({ html: hWrd });
    chk(name, 'words', 'the board’s own file carrying it opens: FY27 USAF is the board’s own base, said; FY28 USAF still BES28’s',
      S4.ev(`JSON.stringify([S.discSvc[0], BA_SRC[2027].bad[0], MS.years[2028].discSvc[0], document.querySelectorAll('#list .row').length])`),
      J([1150, 'one of its FY27 figures is not a figure', 5075, 3]));
    // ---- the copy a lock keeps is a position too
    ev(`blCyc='BES'; blYr=2028; cycLock(); 'ok'`);
    const hLock = ev('buildSavedHtml()').replace(/(<script type="application\/json" id="pubState">)([\s\S]*?)(<\/script>)/, (m, a, b, c) => {
      const o = JSON.parse(b); const by = o.cycDb.byAp; const k = Object.keys(by)[0]; by[k].cycles['BES|2028'].pos.P.lines.USAF = 7;
      return a + JSON.stringify(o).replace(/</g, '\\u003c') + c; });
    chk(name, 'the door', 'a lock whose copy of the position has a line list that is a number is refused, naming the lock',
      /^the line list at the saved state\.cycDb\.byAp\.[^.]+\.cycles\.BES\|2028\.pos\.P\.lines\.USAF is not a list/.test(B.ev(`inboundCheck(${J(hLock)})`)), true);
    if (B.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
{
  const name = 'v2.12 RV3 — opening reads another year’s budget as opening that year does, and a board saved twice is the same (R18)';
  try {
    const J = JSON.stringify;
    const B = w3Board(), { ev } = B;
    const h1 = ev('buildSavedHtml()');
    // FY28's base and its add written as text (a hand edit, or a file another tool wrote), its cache the figure the year opens to;
    // FY29's base saved with fractions (a typed total split before v1.97), its cache the whole dollars opening apportions it to
    const odd = rv3Edit(h1, st => { const y = st.years;
      y['2028'].bm.disc = ['1,100', '410', '310']; y['2028'].bm.adds[0].vec = ['75', '0', '0']; y['2028'].discSvc = [1175, 410, 310];
      y['2029'].bm.disc = [333.4, 333.4, 333.2]; y['2029'].discSvc = [334, 333, 333]; });
    chk(name, 'the fixture', 'CONTROL: the import check takes those figures (text amounts are amounts)', B.ev(`inboundCheck(${J(odd)})`), '');
    const B2 = boot({ html: odd });
    chk(name, 'opened', 'opening leaves FY28 and FY29 as they were saved: $1,175 / 410 / 310 (not "1,100"+75 = $0, "410"+"0" = $4,100) and $334 / 333 / 333',
      J([w3Cache(B2, 2028), w3Cache(B2, 2029)]), J([J([[1175, 410, 310], [210, 110, 60]]), J([[334, 333, 333], [220, 120, 70]])]));
    const h2 = B2.ev('buildSavedHtml()');
    chk(name, 'saved', 'opened and saved without an edit, the board writes the state it opened, the clocks aside', rv3Zero(h2) === rv3Zero(odd), true);
    const B3 = boot({ html: h2 }), h3 = B3.ev('buildSavedHtml()');
    chk(name, 'saved', 'and saved a second time, the same again', rv3Zero(h3) === rv3Zero(h2), true);
    // the oracle: the year opened reads those figures itself
    B2.ev(`switchYear(2028); 'ok'`);
    chk(name, 'opened', 'CONTROL: FY28 opened reads $1,175 / 410 / 310 -- the figure its cache was left at', B2.ev(`JSON.stringify(S.discSvc)`), J([1175, 410, 310]));
    B2.ev(`switchYear(2029); 'ok'`);
    chk(name, 'opened', 'CONTROL: FY29 opened reads $334 / 333 / 333', B2.ev(`JSON.stringify(S.discSvc)`), J([334, 333, 333]));
    // a stale cache over text parts is made live as opening the year reads it, never from the raw parts
    const stale = rv3Edit(odd, st => { st.years['2028'].discSvc = [1, 2, 3]; });
    const B4 = boot({ html: stale });
    chk(name, 'stale', 'a stale FY28 cache over text parts opens as $1,175 / 410 / 310, never $0 / 4,100 / 3,100', w3Cache(B4, 2028), J([[1175, 410, 310], [210, 110, 60]]));
    // and the live budget reads them so on a tagged plan too: FY28 AFRC (BES28 says nothing about it) is its own $310
    B4.ev(`cycSetWorking('BES', 2028); 'ok'`);
    chk(name, 'tagged', 'tagged BES28: FY28 USAF 5,000 + the text add of 75, ANG $0 (named, logs nothing), AFRC its own 310 read from the text "310"',
      w3Cache(B4, 2028), J([[5075, 0, 310], [700, 0, 60]]));
    if (B.errors.length || B2.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.concat(B2.errors).slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
{
  const name = 'v2.12 RV3 — a year started by Copy to year or Roll forward has its live budget at once (R13, R27)';
  try {
    const J = JSON.stringify;
    const B = w3Board(), { ev } = B;
    ev(`cycSetWorking('BES', 2028); ppCyc='BES'; ppYr=2028;
      ppSetV('USAF','_all',2030,'d','777'); ppSetV('USAF','_all',2030,'m','70'); ppSetV('USAF','_all',2031,'d','555'); ppSetV('USAF','_all',2031,'m','50'); 'ok'`);
    chk(name, 'the fixture', 'CONTROL: FY30 and FY31 hold no plan yet', ev(`JSON.stringify([!!MS.years[2030], !!MS.years[2031]])`), J([false, false]));
    // Copy to year, as the row's ⋯ menu offers it ("FY30 (new)")
    ev(`xferYear('A','c2030'); 'ok'`);
    chk(name, 'Copy to year', 'FY30 is created with BES28’s budget at once: USAF 777 / 70, ANG named and logging nothing ($0), AFRC the blank year’s own $0',
      w3Cache(B, 2030), J([[777, 0, 0], [70, 0, 0]]));
    chk(name, 'Copy to year', 'and its own base is the blank year’s $0, never the position’s', ev(`(function(){ var b=MS.years[2030].bm; return JSON.stringify(b? [b.disc, b.mand] : 'no own base'); })()`), J([[0, 0, 0], [0, 0, 0]]));
    { const pb = rv3Pub(ev('buildSavedHtml()')).appns; chk(name, 'Copy to year', 'the file the next Save writes carries it', J(pb[Object.keys(pb)[0]].years['2030'].discSvc), J([777, 0, 0])); }
    // Roll forward, B into FY31
    ev(`rollPick={B:1}; rollYrs={2031:1}; rollApply(); 'ok'`);
    chk(name, 'Roll forward', 'FY31 is created with BES28’s budget at once: USAF 555 / 50', w3Cache(B, 2031), J([[555, 0, 0], [50, 0, 0]]));
    ev(`cycSetWorking('', null); 'ok'`);
    chk(name, 'untag', 'untagged, both years are the blank year’s own $0 again', J([w3Cache(B, 2030), w3Cache(B, 2031)]), J([J([[0, 0, 0], [0, 0, 0]]), J([[0, 0, 0], [0, 0, 0]])]));
    if (B.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
{
  const name = 'v2.12 RV3 — what a requirement draws it holds, and a Split is held as far as its basis allows (R17, R32)';
  try {
    const J = JSON.stringify;
    // USAF discretionary 60, mandatory $0 plus a 40 mandatory add; A asks USAF 100, B asks USAF 30; both on the lane walk first
    const B = boot(), { ev } = B;
    seed(ev, { services: ['USAF', 'ANG'], items: [it('A', 'AV', [100, 0]), it('B', 'AV', [30, 0])], disc: [60, 0], mand: [0, 0], order: ['A', 'B'] });
    ev(`window.confirm=function(){ return true; }; window.alert=function(){}; MS.svc=SVC.slice();
      BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.bm={disc:[60,0], mand:[0,0], adds:[{name:'Supplemental', pool:'mand', vec:[40,0]}]}; S.fsrc={}; applyState(S); MS.years[MS.cur]=S; save(); render(); 'ok'`);
    const lane = k => JSON.parse(ev(`(function(){ var X=fitModel().years[MS.cur].L.${k}; return JSON.stringify([X.ba[0], X.held[0], X.drawn[0], X.over[0], X.un[0], X.upl[0]]); })()`));
    chk(name, 'the fixture', 'CONTROL: on the lane walk A draws 60 / 40 and the fit holds what it draws: nothing over, nothing unallocated',
      J([lane('d'), lane('m')]), J([[60, 60, 60, 0, 0, 0], [40, 40, 40, 0, 0, 0]]));
    // 100 typed into A's USAF Disc in the RECORD panel: its Split is seeded from the walk, so it holds Disc 100 / Mand 40 typed
    ev(`setFsrcSvc('A','d',0,'100'); 'ok'`);
    chk(name, 'R17', 'A’s Split is Disc 100 / Mand 40 and still draws 60 / 40', ev(`JSON.stringify([S.fsrc.A.dv, S.fsrc.A.mv, tiers().A.d, tiers().A.m])`), J([[100, 0], [40, 0], [60, 0], [40, 0]]));
    chk(name, 'R17', 'USAF mandatory holds the 40 A draws: no unallocated money and no UPL where the lane is spent', J(lane('m')), J([40, 40, 40, 0, 0, 0]));
    chk(name, 'R17', 'and the board shows no UPL line', ev(`String(!!document.querySelector('#list .uplline'))`), 'false');
    const X = await w3Book(B, 'exportExcel()');
    chk(name, 'R17', 'Funding Streams carries no UPL line beside a USAF row with nothing left in mandatory',
      (X['Funding Streams'] || []).some(r => /^UPL/.test(String(r[0]))), false);
    // a second Split directs Mand 30 into that same spent lane: the lane is over by 30, and both requirements holding it are listed
    ev(`setFsrcSvc('B','m',0,'30'); render(); 'ok'`);
    chk(name, 'R17', 'B’s 30 makes USAF mandatory hold 70 against 40: over 30, nothing unallocated', J(lane('m')), J([40, 70, 40, 30, 0, 0]));
    chk(name, 'R17', 'and the over lists A (holding the 40 it draws) and B (holding 30 it cannot draw), B marked',
      ev(`JSON.stringify(fitModel().years[MS.cur].L.m.rows[0].map(function(r){ return [r.id, r.held, r.drawn, r.short]; }))`), J([['A', 40, 40, false], ['B', 30, 0, true]]));
    // ---- R32: a Split is held as far as its basis allows. A's value lowered under its typed Split: the over clears
    const C = boot(), cv = C.ev;
    seed(cv, { services: ['USAF'], items: [it('A', 'AV', [600])], disc: [550], mand: [0], order: ['A'] });
    cv(`window.confirm=function(){ return true; }; window.alert=function(){}; MS.svc=SVC.slice();
      BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.bm={disc:[550], mand:[0], adds:[]}; S.fsrc={A:{m:'split', dv:[600], mv:[0]}}; applyState(S); MS.years[MS.cur]=S; save(); render(); 'ok'`);
    const one = () => JSON.parse(cv(`(function(){ var X=fitModel().years[MS.cur].L.d; return JSON.stringify([X.held[0], X.drawn[0], X.over[0], X.un[0]]); })()`));
    chk(name, 'R32', 'CONTROL: A’s Split of 600 on a 600 value against 550: held 600, drawn 550, over 50', J(one()), J([600, 550, 50, 0]));
    cv(`setAsk('A',0,'500'); render(); 'ok'`);
    chk(name, 'R32', 'A’s value lowered to 500 under its typed 600 (the Split untouched): held 500, drawn 500, nothing over, 50 unallocated',
      J([one(), cv(`JSON.stringify(S.fsrc.A.dv)`)]), J([[500, 500, 0, 50], J([600])]));
    chk(name, 'R32', 'and Needs attention carries no over', cv(`String(!!document.querySelector('#posture .fitatt'))`), 'false');
    if (B.errors.length || C.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.concat(C.errors).slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
{
  const name = 'v2.12 RV3 — an over in a year not on screen is counted, and Go to it puts that year on screen (R34)';
  try {
    const J = JSON.stringify;
    const B = w3Board(), { ev } = B;
    ev(`cycSetWorking('BES', 2028); render(); 'ok'`);
    chk(name, 'the fixture', 'CONTROL: FY28 has nothing over to begin with', ev(`JSON.stringify(fitModel().years[2028].L.d.over)`), J([0, 0, 0]));
    // FY28: ANG 100 typed into C's Split, through the RECORD panel's writer; ANG's FY28 budget authority is BES28's $0
    ev(`switchYear(2028); setFsrcSvc('C','d',1,'100'); switchYear(2027); render(); 'ok'`);
    chk(name, 'counted', 'with FY27 on screen, FY28 ANG discretionary is over by 100, and the model counts it beside FY27’s two',
      ev(`JSON.stringify([+MS.cur, fitModel().years[2028].L.d.over, fitModel().years[2027].over, fitModel().over])`), J([2027, [0, 100, 0], 2, 3]));
    chk(name, 'counted', 'Needs attention counts all three, two against BES28',
      ev(`((document.querySelector('#posture .fitatt')||{}).textContent)||'none'`), '🏛 3 over budget authority (2 against BES28)');
    ev(`fitShow(); 'ok'`);
    chk(name, 'the box', 'the box says FY28’s over',
      ev(`JSON.stringify([].map.call(document.querySelectorAll('#fitBody .fitover[data-fy="2028"]'), function(e){ return e.textContent; }))`),
      J(['▲ FY28 O&M, ANG discretionary: requirements hold $100 more than BES28 — reduce a requirement']));
    ev(`(function(){ var b=[].filter.call(document.querySelectorAll('#fitBody .fitover[data-fy="2028"] + .fitwrap .fitgo'), function(x){ return /"C"/.test(x.getAttribute('onclick')); })[0]; b.click(); return 'ok'; })()`);
    chk(name, 'Go to it', 'Go to it on FY28’s row closes the box, puts FY28 on screen and selects C', ev(`JSON.stringify([fitOpen, +MS.cur, curRow])`), J([false, 2028, 'C']));
    if (B.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
{
  const name = 'v2.12 RV3 — an over names what it is measured against, and so does Needs attention (R15, R20, K10)';
  try {
    const J = JSON.stringify;
    const B = w3Board(), { ev } = B;
    const said = () => ev(`(function(){ fitOpen=true; render(); var s=[].map.call(document.querySelectorAll('#fitBody .fitover[data-fy="2027"]'), function(e){ return e.textContent; });
      fitOpen=false; render(); return JSON.stringify([((document.querySelector('#posture .fitatt')||{}).textContent)||'none', s]); })()`);
    // untagged: every over is against the board's own budget
    chk(name, 'untagged', 'untagged, the two FY27 overs (ANG discretionary, AFRC mandatory) are against the board’s own budget, neither lane carrying added funding',
      said(), J(['🏛 2 over the board’s own budget', ['▲ FY27 O&M, ANG discretionary: requirements hold $100 more than the board’s own budget — reduce a requirement',
        '▲ FY27 O&M, AFRC mandatory: requirements hold $100 more than the board’s own budget — reduce a requirement']]));
    ev(`cycSetWorking('BES', 2028); S.fsrc.A.mv[2]=0; save(); render(); 'ok'`);
    // tagged, AFRC's mandatory over taken away: the one over left is against BES28, whose lane carries $150 of added funding
    chk(name, 'tagged', 'the one over is against BES28 plus the lane’s added funding, and Needs attention says so',
      said(), J(['🏛 1 over BES28 plus added funding', ['▲ FY27 O&M, USAF discretionary: requirements hold $50 more than BES28 plus added funding ($900 + $150) — reduce a requirement']]));
    // the position deleted, the plan still tagged BES28: an over now is against the board's own budget, never "over BES28"
    // (USAF's own base cut to 900 so it is over; ANG's Splits brought to its own 400 so it is not)
    ev(`ppCyc='BES'; ppYr=2028; ppDel(); S.bm.disc[0]=900; S.fsrc.B.dv[1]=200; applyBudget(); save(); render(); 'ok'`);
    chk(name, 'no position', 'BES28 deleted (still tagged): USAF holds 1,100 against its own 900 + 150 -- over the board’s own budget, not BES28',
      said(), J(['🏛 1 over the board’s own budget plus added funding', ['▲ FY27 O&M, USAF discretionary: requirements hold $50 more than the board’s own budget plus added funding ($900 + $150) — reduce a requirement']]));
    // a withheld (negative) source: the sentence says the budget authority is less than the base
    ev(`S.bm.adds[0].vec[0]=-150; applyBudget(); save(); render(); 'ok'`);
    chk(name, 'withheld', 'with $150 withheld, USAF holds 1,100 against 750: the sentence says the base less the withheld funding',
      J(JSON.parse(said())[1]), J(['▲ FY27 O&M, USAF discretionary: requirements hold $350 more than the board’s own budget less withheld funding ($900 − $150) — reduce a requirement']));
    if (B.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
{
  const name = 'v2.12 RV3 — a lock that read no position says so in its view, and a lock before v2.12 still reads as one (R14, R21, R28)';
  try {
    const J = JSON.stringify;
    const B = w3Board(), { ev } = B;
    // an untagged plan locked as PB27: the lock tags it PB27, which this appropriation logs no position under
    ev(`blCyc='PB'; blYr=2027; cycLock(); 'ok'`);
    chk(name, 'the lock', 'the lock keeps the tag it read, with no position', ev(`JSON.stringify([MS.cycle, blGet('PB|2027').pos])`), J(['PB|2027', { key: 'PB|2027', P: null }]));
    const view = () => ev(`(function(){ cycView('PB|2027'); fitShow(); var h=(document.querySelector('#fitBody .fithint')||{}).textContent||'', y=(document.querySelector('#fitBody .fityr span')||{}).textContent||'';
      fitOpen=false; cycLeave(); return JSON.stringify([h.split('. ')[0], y]); })()`);
    chk(name, 'the view', 'its view says it was locked when PB27 logged no position here, and each year that the lock kept none -- not "before v2.12", not "untagged"',
      view(), J(['Viewing O&M PB27 (locked): when it was locked, the plan’s tag (PB27) logged no position for O&M, so its years’ bases are the board’s own, as locked',
        'This lock kept no PB27 position for O&M: every base is the board’s own, as locked.']));
    // the same lock as an earlier v2.12 build stored it (pos:null), reads the same
    ev(`blGet('PB|2027').pos=null; 'ok'`);
    chk(name, 'pos:null', 'a lock stored with pos:null reads the same: the tag it read is the plan’s, else its own', JSON.parse(view())[1],
      'This lock kept no PB27 position for O&M: every base is the board’s own, as locked.');
    // CONTROL: a lock from before v2.12 has no pos at all
    ev(`delete blGet('PB|2027').pos; 'ok'`);
    chk(name, 'before v2.12', 'CONTROL: a lock with no pos is said to be from before v2.12', JSON.parse(view())[0],
      'Viewing O&M PB27 (locked): it was locked before v2.12 and kept no position, so its budget is as locked');
    if (B.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
{
  const name = 'v2.12 RV3 — a lock that tags the plan says which figures move, and never that the board is not changed (R16, R19, R29, K11)';
  try {
    const J = JSON.stringify;
    const B = w3Board(), { ev } = B;
    ev(`blCyc='BES'; blYr=2028; toggleBl(); 'ok'`);
    chk(name, 'the hint', 'the PPBE cycles box says the lock will tag the plan and move its budget, not that nothing changes',
      J([/The working plan is untagged: the lock tags it BES28, and every year that position logs reads its budget authority from it/.test(ev(`document.getElementById('blBody').textContent`)),
        /not changed by a lock/.test(ev(`document.getElementById('blBody').textContent`))]), J([true, false]));
    const q = JSON.parse(ev(`(function(){ var qs=[]; window.confirm=function(x){ qs.push(String(x)); return true; }; cycLock(); return JSON.stringify(qs); })()`));
    const tail = (q[0] || '').split('\n\n').slice(-2);
    chk(name, 'the question', 'it names every figure that moves, year by year, and ends that nothing ELSE changes',
      J(tail), J(['The working plan’s budget authority moves to BES28’s now: FY27 USAF discretionary $1,150 → $1,050; FY27 USAF mandatory $200 → $300; '
        + 'FY27 ANG discretionary $400 → $452,000; FY27 ANG mandatory $140 → $90,040; FY28 USAF discretionary $1,175 → $5,075; FY28 USAF mandatory $210 → $700; '
        + 'FY28 ANG discretionary $410 → $0; FY28 ANG mandatory $110 → $0. What the lanes fund moves with it.', 'Nothing else on the working board changes.']));
    chk(name, 'the question', 'and it moved exactly those: FY27 and FY28 read BES28', J([w3Cache(B, 2027), w3Cache(B, 2028)]),
      J([J([[1050, 452000, 330], [300, 90040, 50]]), J([[5075, 0, 310], [700, 0, 60]])]));
    chk(name, 'the status', 'the status line says the plan is now tagged, not "still"',
      J([/The working plan is now tagged BES28 \(8 budget figures now read from its position\)/.test(ev(`document.getElementById('shareStat').textContent`)),
        /still tagged/.test(ev(`document.getElementById('shareStat').textContent`))]), J([true, false]));
    // CONTROL: a tagged plan's next lock moves nothing, and is asked what it always was
    // v2.15 W1 (item 139): retagged PB28 first, as Lock now asks of a plan on another cycle
    const q2 = JSON.parse(ev(`(function(){ var qs=[]; cycSetWorking('PB', 2028); window.confirm=function(x){ qs.push(String(x)); return true; }; blCyc='PB'; blYr=2028; cycLock(); return JSON.stringify(qs); })()`));
    chk(name, 'tagged', 'CONTROL: a lock on a tagged plan ends as it always did', (q2[0] || '').split('\n\n').slice(-1)[0], 'The working board is not changed.');
    if (B.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
{
  const name = 'v2.12 RV3 — Budget Management says what the year reads; a one-figure position sets the total and keeps the board’s lane split, and is said (R36, R37)';
  try {
    const J = JSON.stringify;
    const B = w3Board(), { ev } = B;
    const bm = () => ev(`(function(){ bmOpen=true; render(); var b=document.getElementById('bmBody'), h=b.querySelector('.bmlive'); var r=JSON.stringify([h? h.firstElementChild.textContent : 'none',
      b.querySelectorAll('td.bmpos').length, [].filter.call(b.querySelectorAll('input'), function(i){ return /bmSetBase/.test(i.getAttribute('onchange')||''); }).length,
      /Take the base from a PPBE position/i.test(b.textContent), /Untag the plan to type every base here again/.test(b.textContent)]); bmOpen=false; render(); return r; })()`);
    ev(`cycSetWorking('BES', 2028); switchYear(2029); 'ok'`);
    chk(name, 'R36', 'FY29, which BES28 logs nothing for: the heading says so, every base is a box, nothing is read from the position, Take is not offered',
      bm(), J(['The plan is tagged BES28 — it logs nothing for FY29: the base is the board’s own', 0, 6, false, false]));
    ev(`switchYear(2027); 'ok'`);
    chk(name, 'R36', 'CONTROL: FY27, which BES28 logs: the base is read from BES28, live', JSON.parse(bm())[0], 'The base is read from BES28, live');
    ev(`ppCyc='BES'; ppYr=2028; ppDel(); 'ok'`);
    chk(name, 'R36', 'BES28 deleted, the plan still tagged: the heading says O&M logs no BES28 position',
      bm(), J(['The plan is tagged BES28 — O&M logs no BES28 position: the base is the board’s own', 0, 6, false, false]));
    // ---- R37 (Brad, 28 Oct 2026: "Keep my lane split"): a position typed as one figure per line, through the box's one field,
    // sets the service's total and the board's own base divides it between the lanes; a service with no own base takes it as
    // discretionary. USAF's own base 1,000 / 200 divides 1,800 as 1,500 / 300 -- unlike the old reading (1,800 / 0) and unlike
    // ignoring the position (1,000 / 200); AFRC has no own base, so its 50 is discretionary; ANG is not in the position.
    // v2.12: the check moved with Brad's decision (it pinned the all-discretionary reading the review asked him about).
    const C = boot(), cv = C.ev;
    seed(cv, { services: ['USAF', 'ANG', 'AFRC'], items: [it('M', 'AV', [200, 0, 0])], disc: [1000, 100, 0], mand: [200, 20, 0], order: ['M'] });
    cv(`window.confirm=function(){ return true; }; window.alert=function(){}; MS.svc=SVC.slice();
      BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.bm={disc:[1000,100,0], mand:[200,20,0], adds:[]}; applyState(S); MS.years[MS.cur]=S; save();
      ppCyc='BES'; ppYr=2028; ppSvcIdx=0; toggleP2(); ppLineAdd('USAF'); ppLineAdd('AFRC'); render(); 'ok'`);
    // the box's one field for FY27, as a person types into it (its own onchange: the discretionary slot)
    cv(`(function(){ var i=[].filter.call(document.querySelectorAll('#ppBody input'), function(x){ return /ppSetV\\("USAF",.*,2027,"d"/.test(x.getAttribute('onchange')||''); })[0];
      i.value='1800'; i.dispatchEvent(new Event('change')); return 'ok'; })()`);
    cv(`(function(){ var k=MS.ppbe['BES|2028'].lines.AFRC[0].k; ppSetV('AFRC', k, 2027, 'd', '50'); return 'ok'; })()`);
    chk(name, 'R37', 'the box is in one-figure mode and stored USAF FY27 as 1,800 and AFRC as 50, in the discretionary slot',
      cv(`JSON.stringify([!!MS.ppbe['BES|2028'].split, ppSvcFy(MS.ppbe['BES|2028'],'USAF',2027).d, ppSvcFy(MS.ppbe['BES|2028'],'USAF',2027).m, ppSvcFy(MS.ppbe['BES|2028'],'AFRC',2027).d])`), J([false, 1800, 0, 50]));
    cv(`toggleP2(); cycSetWorking('BES', 2028); 'ok'`);
    chk(name, 'R37', 'tagged: USAF reads 1,500 / 300 (1,800 divided as its own 1,000 / 200), AFRC 50 / 0 (no own base), ANG keeps its own',
      w3Cache(C, 2027), J([[1500, 100, 50], [300, 20, 0]]));
    cv(`fitShow(); 'ok'`);
    chk(name, 'R37', 'the fit box says how each one-figure service was read',
      cv(`(document.querySelector('#fitBody .fityr span')||{}).textContent||''`),
      'Base from BES28 for USAF, AFRC · the board’s own for ANG (BES28 says nothing about it). BES28 gives one figure per line: USAF divided between the lanes as the board’s own base divides it; AFRC read as discretionary (the board’s own base is $0 in both lanes).');
    cv(`fitOpen=false; bmOpen=true; render(); 'ok'`);
    chk(name, 'R37', 'and Budget Management says it too', /BES28 gives one figure per line: USAF divided between the lanes as the board’s own base divides it; AFRC read as discretionary/.test(cv(`document.getElementById('bmBody').textContent`)), true);
    if (B.errors.length || C.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.concat(C.errors).slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
{
  const name = 'v2.12 RV3 — the guide names the 🏛 entry and states the budget authority as the position plus added funding (K13, R31)';
  try {
    const B = boot(), { ev } = B;
    const sec = id => ev(`(function(){ var t=document.getElementById('helpDoc'), s=t && t.content.querySelector('section[data-id=${JSON.stringify(id)}]'); return s? s.textContent : ''; })()`);
    chk(name, 'K13', 'the Needs attention part of the guide names the 🏛 entry and what it opens', /The first entry, 🏛 N over BES28, opens the fit to the PPBE position instead/.test(sec('t-alloc')), true);
    chk(name, 'R31', 't-ppbe says no report states more than the budget authority, the position plus added funding',
      /no report states more than the budget authority \(the position plus added funding\)/.test(sec('t-ppbe')), true);
    chk(name, 'R31', 'and no longer claims no report states more than the position', /no report states more than the position\./.test(sec('t-ppbe')), false);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ---- v2.12 RV6: the second review of item 134 (S04-S09, S14, S17-S19) ----------------------------------------------------------
// ONE RULE FOR A ONE-FIGURE POSITION, THREE READERS. Brad's R37 rule (a position logged one figure per line sets each service's
// total; the board's own base for that service and year splits it, whole dollars; all discretionary where that base is $0) was
// stated in baOf alone: Take from a PPBE position wrote 1,800 / $0 over the board's own mandatory, and FYDP Disconnects printed the
// whole figure as Discretionary. Every reader now asks ppLanesOf. THE FIXTURE MAKES THE ALTERNATIVES DISAGREE (S18): two of its own
// bases tie at a half dollar (ANG 10 / 10 under 21, USN 500 / 500 under 1,801), so apportion (11 / 10, 901 / 900) is told from
// rounding each lane (11 / 11, 901 / 901: a dollar invented) and from flooring each (10 / 10, 900 / 900: a dollar dropped); USAF
// divides exactly (1,800 over 1,000 / 200: 1,500 / 300, against the old 1,800 / 0); AFRC has no own base (50 read as discretionary).
// Full Fund's own base is not this board's and its service list is in another order (USN first), so a base read from the wrong
// board, or by this board's service positions, is a different figure; and Full Fund holds no FY28 plan, whose base cannot be read.
const RV6SV = ['USAF', 'ANG', 'AFRC', 'USN'];
const rv6Board = () => {
  const B = boot();
  seed(B.ev, { services: RV6SV, items: [it('M', 'AV', [1500, 10, 50, 900]), it('N', 'PSM', [300, 11, 0, 901])],
    disc: [1000, 10, 0, 500], mand: [200, 10, 0, 500], order: ['M', 'N'] });
  B.ev(`window.__qs=[]; window.confirm=function(q){ window.__qs.push(String(q)); return true; }; window.alert=function(){}; MS.svc=SVC.slice();
    BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.bm={disc:[1000,10,0,500], mand:[200,10,0,500], adds:[]}; applyState(S); MS.years[MS.cur]=S; save();
    ppCyc='BES'; ppYr=2028; ppSvcIdx=0;
    ppSetV('USAF','_all',2027,'d','1800'); ppSetV('ANG','_all',2027,'d','21'); ppSetV('AFRC','_all',2027,'d','50'); ppSetV('USN','_all',2027,'d','1801');
    render(); 'ok'`);
  return B;
};
// the lanes every reader must give for FY27, worked out by hand from the fixture
const RV6D = [1500, 11, 50, 901], RV6M = [300, 10, 0, 900];
const RV6ONE = 'BES28 gives one figure per line: USAF, ANG, USN divided between the lanes as the board’s own base divides them; AFRC read as discretionary (the board’s own base is $0 in both lanes).';
{
  const name = 'v2.12 RV6 — a one-figure position is read by one rule: the live budget, Take from a PPBE position and FYDP Disconnects divide it alike (S04, S05, S14, S17, S18)';
  try {
    const J = JSON.stringify;
    // ---- the live budget (baOf): CONTROL, it already divided by R37's rule -- here with the ties that tell apportion apart (S18)
    const A = rv6Board();
    chk(name, 'the fixture', 'CONTROL: the position is in one-figure mode and holds the four figures as typed',
      A.ev(`JSON.stringify([!!MS.ppbe['BES|2028'].split, ['USAF','ANG','AFRC','USN'].map(function(s){ return ppSvcFy(MS.ppbe['BES|2028'], s, 2027).t; })])`), J([false, [1800, 21, 50, 1801]]));
    A.ev(`cycSetWorking('BES', 2028); 'ok'`);
    const live = JSON.parse(w3Cache(A, 2027));
    chk(name, 'the live budget', 'tagged BES28: each total divided as the board’s own base divides it -- the half-dollar ties go to the first lane, and AFRC (no own base) is discretionary',
      J(live), J([RV6D, RV6M]));
    chk(name, 'the live budget', 'every lane a whole dollar, and each service’s two lanes add to the figure typed: no dollar invented or dropped',
      J([live[0].concat(live[1]).every(Number.isInteger), live[0].map((d, i) => d + live[1][i])]), J([true, [1800, 21, 50, 1801]]));
    A.ev(`fitShow(); 'ok'`);
    chk(name, 'the live budget', 'the fit box says how each one-figure service was read',
      A.ev(`(document.querySelector('#fitBody .fityr span')||{}).textContent||''`), 'Base from BES28 for USAF, ANG, AFRC, USN. ' + RV6ONE);
    A.ev(`fitOpen=false; render(); 'ok'`);
    // ---- Take from a PPBE position, on an untagged plan, through Budget Management's own select
    const T = rv6Board();
    T.ev(`(function(){ bmOpen=true; render(); var s=[].filter.call(document.querySelectorAll('#bmBody select'), function(x){ return /bmSeedFromPp/.test(x.getAttribute('onchange')||''); })[0];
      s.value='BES|2028'; s.dispatchEvent(new Event('change')); return 'ok'; })()`);
    const q = JSON.parse(T.ev(`JSON.stringify(window.__qs)`))[0] || '';
    chk(name, 'Take', 'the question offers each service divided by the base as it stands before the take, never mandatory $0',
      J(q.split('\n').filter(l => /^\s+\w+:\s+disc/.test(l)).map(l => l.trim().replace(/\s+/g, ' '))),
      J(['USAF: disc 1,000 → 1,500 | mand 200 → 300', 'ANG: disc 10 → 11 | mand 10 → 10', 'AFRC: disc 0 → 50 | mand 0 → 0', 'USN: disc 500 → 901 | mand 500 → 900']));
    chk(name, 'Take', 'and says how each one-figure service was read', q.indexOf('\n\n' + RV6ONE + '\n\n') >= 0, true);
    chk(name, 'Take', 'OK writes exactly those lanes into the board’s own base -- whole dollars, its mandatory kept mandatory',
      T.ev(`JSON.stringify([S.bm.disc, S.bm.mand])`), J([RV6D, RV6M]));
    chk(name, 'Take', 'the status line says it too', T.ev(`document.getElementById('shareStat').textContent`).indexOf(RV6ONE) >= 0, true);
    chk(name, 'Take', 'the take is tracked as matching the position: not edited, not moved',
      T.ev(`(function(){ var s=bmPpState(); return JSON.stringify([s.edited, s.moved]); })()`), J([false, false]));
    T.ev(`bmSetBase('disc', 0, '1400'); 'ok'`);
    chk(name, 'Take', 'a base edited after the take is "edited here", never a position that "has changed since" (it did not)',
      T.ev(`(function(){ var s=bmPpState(); return JSON.stringify([s.edited, s.moved]); })()`), J([true, false]));
    T.ev(`bmSetBase('disc', 0, '1500'); bmOpen=false; render(); cycSetWorking('BES', 2028); 'ok'`);
    chk(name, 'Take', 'tagged afterwards, the plan reads what the take wrote: the same lanes as the plan tagged without a take',
      w3Cache(T, 2027), J([RV6D, RV6M]));
    // ---- FYDP Disconnects: this appropriation's own base for O&M, Full Fund's own for Full Fund
    const F = rv6Board();
    const YRS = [2027, 2028, 2029, 2030, 2031, 2032];
    const FFSV = ['USN', 'USAF', 'ANG', 'AFRC'];   // Full Fund's own list, in its own order
    const ffPos = { v: 2, split: false, lines: { USAF: [{ k: '_all', all: true }], USN: [{ k: '_all', all: true }], ANG: [{ k: '_all', all: true }] },
      val: { USAF: { _all: { 2027: { d: 1000, m: 0 }, 2028: { d: 400, m: 0 }, 2029: { d: 200, m: 0 } } }, USN: { _all: { 2027: { d: 40.4, m: 0 } } }, ANG: { _all: { 2027: { d: 41, m: 0 } } } } };
    const ffStore = { base: 2027, cur: 2027, ts: 5, order: [], ppbe: { 'BES|2028': ffPos }, dataPack: { services: FFSV, items: [], budget: [] },
      // FY27 holds its Budget Management base (its cache is the live figure, never the base); FY29 no components yet -- the budget it
      // holds is its base, as applyState reads a year with no components; FY28 is not held at all
      years: { 2027: { bm: { disc: [0, 300, 10, 0], mand: [0, 700, 30, 0], adds: [] }, discSvc: [9, 9, 9, 9], mandSvc: [9, 9, 9, 9] },
        2029: { discSvc: [0, 50, 0, 0], mandSvc: [0, 150, 0, 0] } } };
    const lines = []; ['om', 'ff', 'sp'].forEach(ap => RV6SV.forEach(sv => { const v = {}; YRS.forEach(y => { v[y] = 1000; }); lines.push({ ap, pmo: 'AV', svc: sv, v }); }));
    F.ev(`ACEDB.sets={'2025ACE':{label:'2025ACE', ts:2000, years:${J(YRS)}, lines:${J(lines)}, appn:{}, skip:{}}}; ACEDB.ts=4000;
      localStorage.setItem(_SLUGMAP.ff.key, ${J(J(ffStore))}); render(); 'ok'`);
    const FM = JSON.parse(F.ev(`JSON.stringify(fdcModel({ace:'2025ACE', cyc:'BES|2028'}))`) || 'null') || { sheets: [] };
    const rowsOf = (sh, ap) => ((FM.sheets.filter(s => s.name === sh)[0] || { rows: [] }).rows).filter(r => r.t === 'line' && r.ap === ap && (/Controls$/.test(r.label) || r.style === 'ital')).map(r => r.vals.slice(0, 3));
    chk(name, 'FYDP Disconnects', 'the Summary: O&M’s FY27 Discretionary and Mandatory are the four services divided by O&M’s own base -- the live budget’s figures, summed',
      J(rowsOf('Summary', 'om').map(v => v[0])), J([3672, RV6D.reduce((a, b) => a + b, 0), RV6M.reduce((a, b) => a + b, 0)]));
    chk(name, 'FYDP Disconnects', 'Full Fund FY27: divided by FULL FUND’s own base, by its own service list (USAF 300 / 700, ANG 10 / 31, USN no base: its 40.4 as 40 discretionary)',
      J(rowsOf('Summary', 'ff').map(v => v[0])), J([1081, 350, 731]));
    chk(name, 'FYDP Disconnects', 'Full Fund FY29, a year with no Budget Management components yet: divided by the budget it holds, as its own board opens it (50 / 150)',
      J(rowsOf('Summary', 'ff').map(v => v[2])), J([200, 50, 150]));
    chk(name, 'FYDP Disconnects', 'Full Fund FY28, a year it holds no plan for: Controls are the figure; Discretionary and Mandatory are —, never guessed',
      J(rowsOf('Summary', 'ff').map(v => v[1])), J([400, null, null]));
    chk(name, 'FYDP Disconnects', 'the service sheets divide the same way: USAF (USAF, ANG, AFRC) and USN CV, O&M then Full Fund, FY27',
      J([rowsOf('USAF', 'om').map(v => v[0]), rowsOf('USAF', 'ff').map(v => v[0]), rowsOf('USN CV', 'om').map(v => v[0]), rowsOf('USN CV', 'ff').map(v => v[0])]),
      J([[1871, 1561, 310], [1041, 310, 731], [1801, 901, 900], [40, 40, 0]]));
    const NOTE = 'BES28 gives O&M one figure per line: USAF, ANG, USN divided between Discretionary and Mandatory as O&M’s own base divides each in the year; '
      + 'AFRC in FY27 read as Discretionary (O&M’s own base is $0 in both lanes). '
      + 'BES28 gives Full Fund one figure per line: USAF, ANG divided between Discretionary and Mandatory as Full Fund’s own base divides each in the year; '
      + 'USN in FY27 read as Discretionary (Full Fund’s own base is $0 in both lanes); '
      + 'USAF in FY28 not divided, so Discretionary and Mandatory print —: Full Fund’s own base cannot be read (no Full Fund plan for that year).';
    chk(name, 'FYDP Disconnects', 'the model says how each appropriation’s one figure was read, and where it could not be', FM.note, NOTE);
    F.ev(`if(!fdcOpen) toggleFdc(); 'ok'`);
    chk(name, 'FYDP Disconnects', 'the box says the same sentence',
      F.ev(`[].some.call(document.querySelectorAll('#fdcBody .fdcnote'), function(n){ return n.textContent===${J('⚠ ' + NOTE)}; })`), true);
    F.ev(`toggleFdc(); fdcAceK='2025ACE'; fdcCycK='BES|2028'; 'ok'`);
    const X = await w3Book(F, 'exportFdc()');
    const sum = X.Summary || [], ffR = sum.findIndex(r => String(r[0]) === 'BES28 Prod Support Controls');
    chk(name, 'FYDP Disconnects', 'the workbook, read from its bytes: Full Fund’s FY27 controls 1,081 = 350 + 731, FY28 400 with — under it, and the note under every sheet’s table',
      J([sum.slice(ffR, ffR + 3).map(r => [String(r[0]), r[1], r[2]]), ['Summary', 'USAF', 'STOVL', 'USMC CV', 'USN CV'].map(s => (X[s] || []).some(r => String(r[0]) === NOTE))]),
      J([[['BES28 Prod Support Controls', 1081, 400], ['Discretionary', 350, '—'], ['Mandatory', 731, '—']], [true, true, true, true, true]]));
    for (const Bx of [A, T, F]) if (Bx.errors.length) chk(name, 'jsdom', 'no script errors', Bx.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
{
  const name = 'v2.12 RV6 — a lock taken before v2.12 is said as a lock of a tagged plan, never as an untagged plan (S06)';
  try {
    const J = JSON.stringify;
    const B = w3Board(), { ev } = B;
    const yr = () => ev(`(function(){ cycView('PB|2027'); fitShow(); var y=(document.querySelector('#fitBody .fityr span')||{}).textContent||''; fitOpen=false; cycLeave(); return y; })()`);
    // the plan tagged BES28, locked as PB27, then the lock made as a build before v2.12 left it (no `pos`; `from` the plan's tag)
    // v2.15 W1 (item 139): Lock now refuses a plan on another cycle, so the lock is taken with the plan on PB27 for the moment, and its
    // record then set as that build wrote it: `from` the plan's tag, BES28
    ev(`cycSetWorking('BES', 2028); MS.cycle='PB|2027'; blCyc='PB'; blYr=2027; cycLock(); MS.cycle='BES|2028'; baLiveAll(); blGet('PB|2027').from='BES|2028'; delete blGet('PB|2027').pos; persistCyc(); 'ok'`);
    chk(name, 'tagged', 'CONTROL: the lock records the tag the plan carried and keeps no position', ev(`JSON.stringify([blGet('PB|2027').from, Object.prototype.hasOwnProperty.call(blGet('PB|2027'), 'pos')])`), J(['BES|2028', false]));
    chk(name, 'tagged', 'each year of its view says the lock was taken before v2.12 with the plan tagged BES28 -- not "The plan is untagged"',
      yr(), 'This lock was taken before v2.12, the plan tagged BES28, and kept no position: every base is the board’s own, as locked.');
    // an untagged plan's lock before v2.12 kept from '' and tagged the plan with its own key as it was taken
    ev(`blGet('PB|2027').from=''; 'ok'`);
    chk(name, 'untagged when locked', 'a lock taken of an untagged plan names the tag it gave the plan', yr(),
      'This lock was taken before v2.12, the plan tagged PB27, and kept no position: every base is the board’s own, as locked.');
    chk(name, 'the working plan', 'CONTROL: off the view, an untagged plan is still said as untagged',
      ev(`(function(){ cycSetWorking('', 0); return fitSrcSay(baOf(S, MS.cur)); })()`), 'The plan is untagged: every base is the board’s own, from Budget Management.');
    if (B.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
{
  const name = 'v2.12 RV6 — withheld funding is "less withheld funding" in Needs attention too, and an over states the floored budget authority (S07)';
  try {
    const J = JSON.stringify;
    const B = w3Board(), { ev } = B;
    const said = () => JSON.parse(ev(`(function(){ fitModel(); fitOpen=true; render(); var s=[].map.call(document.querySelectorAll('#fitBody .fitover[data-fy="2027"]'), function(e){ return e.textContent; });
      fitOpen=false; render(); return JSON.stringify([((document.querySelector('#posture .fitatt')||{}).textContent)||'none', s]); })()`));
    // tagged BES28, AFRC's mandatory over taken away: USAF discretionary (BES28's 900) holds 1,100; its Cong add turned into a Withhold of 150
    ev(`cycSetWorking('BES', 2028); S.fsrc.A.mv[2]=0; S.bm.adds[0].vec[0]=-150; applyBudget(); save(); render(); 'ok'`);
    chk(name, 'against the position', 'the one over is against BES28 less withheld funding, in the box and in Needs attention -- never "plus added funding"',
      J(said()), J(['🏛 1 over BES28 less withheld funding', ['▲ FY27 O&M, USAF discretionary: requirements hold $350 more than BES28 less withheld funding ($900 − $150) — reduce a requirement']]));
    // BES28 cut to 100 for USAF FY27: 100 − 150 is floored at $0, so the requirements hold all 1,100 more than the budget authority
    ev(`ppCyc='BES'; ppYr=2028; ppSetV('USAF','_all',2027,'d','100'); 'ok'`);
    chk(name, 'floored', 'withheld past the base: the sentence says the budget authority is floored at $0, and the over is the whole 1,100',
      J(said()[1]), J(['▲ FY27 O&M, USAF discretionary: requirements hold $1,100 more than BES28 less withheld funding ($100 − $150, floored at $0) — reduce a requirement']));
    chk(name, 'floored', 'CONTROL: the budget authority is $0', ev(`S.discSvc[0]`), 0);
    // untagged, with a lane of added funding over beside one of withheld funding: every over against the board's own budget
    ev(`cycSetWorking('', 0); ppSetV('USAF','_all',2027,'d','900'); S.fsrc.A.mv[2]=100; S.bm.adds[1].vec[2]=10; applyBudget(); save(); render(); 'ok'`);
    chk(name, 'a mix', 'untagged: USAF discretionary over with withheld funding, AFRC mandatory over with added, ANG with neither -- Needs attention names both kinds',
      said()[0], '🏛 3 over the board’s own budget with funding added and withheld');
    ev(`S.bm.adds[1].vec[2]=0; applyBudget(); save(); render(); 'ok'`);
    chk(name, 'withheld alone', 'with only withheld funding in the overs’ lanes, it says less withheld funding', said()[0], '🏛 3 over the board’s own budget less withheld funding');
    if (B.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
{
  const name = 'v2.12 RV6 — a position in the older (v1) shape whose figure is words keeps the board’s own base and says why, as the v2 shape does (S08)';
  try {
    const J = JSON.stringify;
    const B = w3Board(), { ev } = B;
    ev(`cycSetWorking('BES', 2028); 'ok'`);
    const h1 = ev('buildSavedHtml()'), AP = Object.keys(rv3Pub(h1).appns)[0];
    // BES28 as a board before sub-designators kept it: {service: {year: figure}}; FY27 written as words, FY28 a figure
    const hWrd = rv3Edit(h1, st => { st.ppbe['BES|2028'] = { USAF: { 2027: 'abc', 2028: 5000 } }; });
    chk(name, 'the door', 'CONTROL: the import check refuses the v1 figure written as words, naming it', B.ev(`inboundCheck(${J(hWrd)})`),
      'the amount at the saved state.appns.' + AP + '.ppbe.BES|2028.USAF.2027 is not a figure (“abc”)');
    const hTxt = rv3Edit(h1, st => { st.ppbe['BES|2028'] = { USAF: { 2027: '1,800', 2028: 5000 } }; });
    chk(name, 'the door', 'CONTROL: and takes one written as text, as it takes every other amount', B.ev(`inboundCheck(${J(hTxt)})`), '');
    const W = boot({ html: hWrd });
    chk(name, 'opens', 'the board’s own file carrying it opens: FY27 USAF keeps its own base (1,000 + the 150 add; 200), and why is recorded -- never $0',
      W.ev(`JSON.stringify([S.discSvc[0], S.mandSvc[0], BA_SRC[2027].from[0], BA_SRC[2027].bad[0], document.querySelectorAll('#list .row').length])`),
      J([1150, 200, 'board', 'one of its FY27 figures is not a figure', 3]));
    W.ev(`fitShow(); 'ok'`);
    chk(name, 'said', 'the fit box says USAF’s base is the board’s own because BES28 cannot be read for it',
      /the board’s own for USAF \(one of its FY27 figures is not a figure\), where BES28 cannot be read/.test(W.ev(`(document.querySelector('#fitBody .fityr[data-fy="2027"] span')||{}).textContent||''`)), true);
    chk(name, 'opens', 'FY28 still reads BES28’s 5,000 -- one figure, divided as FY28’s own 1,100 / 210 divides it (4,198 / 802), plus its 75 add',
      W.ev(`JSON.stringify([MS.years[2028].discSvc[0], MS.years[2028].mandSvc[0]])`), J([4273, 802]));
    const X = boot({ html: hTxt });
    chk(name, 'text', 'CONTROL: the v1 figure written as "1,800" is read as 1,800 and divided as the own 1,000 / 200 divides it (+ the 150 add)',
      X.ev(`JSON.stringify([S.discSvc[0], S.mandSvc[0], BA_SRC[2027].from[0]])`), J([1650, 300, 'pos']));
    // and the v1 shape by cost element (Full Fund's, before sub-designators): {service: {cost element: {year: figure}}}
    const hCe = rv3Edit(h1, st => { st.ppbe['BES|2028'] = { USAF: { 'Depot Standup': { 2027: 'abc', 2028: 5000 } } }; });
    chk(name, 'by cost element', 'CONTROL: the import check refuses its figure written as words, naming it', B.ev(`inboundCheck(${J(hCe)})`),
      'the amount at the saved state.appns.' + AP + '.ppbe.BES|2028.USAF.Depot Standup.2027 is not a figure (“abc”)');
    const C = boot({ html: hCe });
    chk(name, 'by cost element', 'the board’s own file carrying it opens with FY27 USAF on its own base, and why recorded -- never $0',
      C.ev(`JSON.stringify([S.discSvc[0], S.mandSvc[0], BA_SRC[2027].from[0], BA_SRC[2027].bad[0]])`), J([1150, 200, 'board', 'one of its FY27 figures is not a figure']));
    for (const Bx of [B, W, X, C]) if (Bx.errors.length) chk(name, 'jsdom', 'no script errors', Bx.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
{
  const name = 'v2.12 RV6 — a lock that moves more figures than it lists says how many more (S19)';
  try {
    const J = JSON.stringify;
    const B = w3Board(), { ev } = B;
    // BES28 logs FY29 for USAF too: FY29 USAF moves both lanes, and ANG (named, logging nothing for FY29) goes to $0 in both -- 12 moves
    ev(`ppCyc='BES'; ppYr=2028; ppSetV('USAF','_all',2029,'d','6000'); ppSetV('USAF','_all',2029,'m','800'); blCyc='BES'; blYr=2028; 'ok'`);
    chk(name, 'the fixture', 'CONTROL: the lock’s tag moves twelve figures, more than the eight the question lists', ev(`cycTagMoves('BES|2028').length`), 12);
    const q = JSON.parse(ev(`(function(){ var qs=[]; window.confirm=function(x){ qs.push(String(x)); return true; }; cycLock(); return JSON.stringify(qs); })()`));
    chk(name, 'the question', 'it lists the first eight and says how many more, then what moves with them',
      (q[0] || '').split('\n\n').slice(-2)[0], 'The working plan’s budget authority moves to BES28’s now: FY27 USAF discretionary $1,150 → $1,050; FY27 USAF mandatory $200 → $300; '
        + 'FY27 ANG discretionary $400 → $452,000; FY27 ANG mandatory $140 → $90,040; FY28 USAF discretionary $1,175 → $5,075; FY28 USAF mandatory $210 → $700; '
        + 'FY28 ANG discretionary $410 → $0; FY28 ANG mandatory $110 → $0; and 4 more. What the lanes fund moves with it.');
    chk(name, 'the status', 'the status line counts all twelve',
      /The working plan is now tagged BES28 \(12 budget figures now read from its position\)/.test(ev(`document.getElementById('shareStat').textContent`)), true);
    chk(name, 'the lock', 'and FY29 moved: USAF 6,000 / 800, ANG $0', w3Cache(B, 2029), J([[6000, 0, 320], [800, 0, 70]]));
    if (B.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
{
  const name = 'v2.12 RV6 — the guide states the one-figure rule in Brad’s terms (S09)';
  try {
    const B = boot(), { ev } = B;
    const sec = id => ev(`(function(){ var t=document.getElementById('helpDoc'), s=t && t.content.querySelector('section[data-id=${JSON.stringify(id)}]'); return s? s.textContent : ''; })()`);
    chk(name, 't-ppbe', 'a position logged one figure per line sets each service’s total, split as the board’s own base splits it, all discretionary where that base is $0, read so by Take and FYDP Disconnects too',
      /A position logged one figure per line sets each service’s total for the year, split between discretionary and mandatory as the board’s own base for that service and year splits it \(all discretionary where that base is \$0\); Take from a PPBE position and FYDP Disconnects read it so too\./.test(sec('t-ppbe')), true);
    chk(name, 't-ppbe', 'and no longer says each service takes the year’s discretionary and mandatory figure', /takes that year’s discretionary and mandatory figure/.test(sec('t-ppbe')), false);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
}
// ==== end v2.12 W3 ====

// ==== v2.13 (item 136): one PPBE cycle for every appropriation, chosen in the context bar ====
// Brad, 2 Nov 2026: the cycle the board works in is chosen at the top and put on EVERY appropriation at once ("Apply to all"),
// Mixed while they disagree and offered on opening (never done unasked), with what the cycle's controls leave in the year on
// screen beside it -- controls against what the requirements hold, service by service and lane by lane, never netted. The lock
// comparison (deltas read against) does not move ("Separate comparison").
// PART 1, THE FIGURE, on the W3 fixture, whose FY27 fit is worked out by hand in the W3 block: BES28 gives USAF and ANG (AFRC
// is the board's own). Discretionary BA 1,050 / 452,000, held 1,100 / 600; mandatory BA 300 / 90,040, held 300 / 0. So against
// BES28's controls: unallocated 0 + 451,400 + 0 + 90,040 = 541,440; over USAF disc 50 only (AFRC's mandatory 100 is over the
// board's OWN budget, not BES28's, and is not counted); BA 543,390, held 2,000. Netted it would read 541,390 -- it must not.
// PART 2, EVERY APPROPRIATION, on four: O&M on screen (PB27); Full Fund on BES28 with a BES28 position; Initial Spares on PB27 with
// a BES28 position and notes of its own that must survive byte for byte; OPN a store from before years were kept (order only).
// Every expectation is a literal from the fixture.
{
  const name = 'v2.13 — one PPBE cycle for every appropriation, chosen at the top (item 136)';
  try {
    const J = JSON.stringify;
    // v2.15 W1 (item 139): Lock now refuses a plan tagged with another cycle, so a lock that read another cycle's position -- one taken
    // before v2.15, which a file still carries -- is made here as v2.14 made it: taken under the plan's own position, then its record
    // set to say so ({key: the plan's tag, P: that position}, from: that tag), as cycLock wrote it before the refusal
    const OLD_LOCK = k => `(function(K){ var t0=MS.cycle, P0=(MS.ppbe||{})[t0], had=Object.prototype.hasOwnProperty.call(MS.ppbe||{}, K)? MS.ppbe[K] : undefined;
      MS.ppbe=MS.ppbe||{}; if(P0!==undefined) MS.ppbe[K]=P0; else delete MS.ppbe[K]; MS.cycle=K; var p=K.split('|'); blCyc=p[0]; blYr=+p[1]; cycLock();
      MS.cycle=t0; if(had===undefined) delete MS.ppbe[K]; else MS.ppbe[K]=had;
      var c=blGet(K); c.pos={key:t0, P:P0? JSON.parse(JSON.stringify(ppNorm(P0))) : null}; c.from=t0; persistCyc(); baLiveAll(); save(); render(); })(${JSON.stringify(k)})`;

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    // ---------------------------------------------------------------- PART 1: the figure beside the selector
    const B = w3Board(), { ev } = B;
    chk(name, 'untagged', 'CONTROL: an untagged board says not tagged, and shows no figure',
      ev(`JSON.stringify([document.getElementById('b_cyc').textContent, document.getElementById('cycFit').hidden])`), J(['not tagged ▾', true]));
    ev(`window.__cm=''; window.confirm=function(m){ window.__cm=m; return true; }; 'ok'`);
    chk(name, 'one board', 'with no other appropriation holding a plan, it is put on BES28 alone', ev(`String(cycApplyAll('BES|2028'))`), 'true');
    chk(name, 'one board', 'the question names it: not tagged → BES28, controls entered; and OPN, Full Fund, Initial Spares as holding no plan',
      J([/• O&M \(this board\) — not tagged → BES28 \(controls entered\)/.test(ev('window.__cm')), (ev('window.__cm').match(/holds no plan, not changed/g) || []).length]), J([true, 3]));
    chk(name, 'one board', 'the board is on BES28, and the bar says so', J([ev('MS.cycle'), ev(`document.getElementById('b_cyc').textContent`)]), J(['BES|2028', 'BES28 ▾']));
    chk(name, 'the figure', 'FY27: $541K unallocated and $50 over against BES28’s controls -- both, never netted, and AFRC (the board’s own budget) not counted',
      ev(`document.getElementById('cycFit').textContent`), 'FY27 · $541K unallocated · ⚠ $50 over');
    const tip = ev(`document.getElementById('cycFit').title`);
    chk(name, 'the figure', 'its tooltip gives every figure to the dollar, names what is not counted, and counts the window’s overs',
      J([/budget authority \$543,390/.test(tip), /requirements hold \$2,000\./.test(tip), /\$541,440 unallocated and \$50 over in 1 service lane/.test(tip),
        /Not counted: AFRC \(BES28 gives no controls for it\)/.test(tip), /1 service lane over BES28 across the held years/.test(tip)]),
      J([true, true, true, true, true]));
    chk(name, 'the figure', 'it is the fit model’s own reading: the Fit panel opens from it',
      ev(`fitOpen=false; render(); document.getElementById('cycFit').click(); String(fitOpen)`), 'true');
    chk(name, 'the figure', 'and the panel says the same over FY27, to the dollar, naming what it does not count',
      ev(`(document.querySelector('#fitBody .fitctl[data-fy="2027"]')||{}).textContent||'none'`),
      'Against the budget authority BES28 gives (USAF, ANG, its controls with any funding added or withheld): $541,440 unallocated · $50 over, each service and lane on its own; not counted: AFRC.');
    chk(name, 'the figure', 'a save with no redraw after it leaves the figure as it was, never blanks it',
      ev(`fitOpen=false; render(); save(); syncBtns(); JSON.stringify([document.getElementById('cycFit').hidden, document.getElementById('cycFit').textContent])`),
      J([false, 'FY27 · $541K unallocated · ⚠ $50 over']));
    {
      const R = boot({ html: ev('buildSavedHtml()') });
      chk(name, 'the figure', 'the board saved and opened again shows it at once', R.ev(`JSON.stringify([document.getElementById('b_cyc').textContent, document.getElementById('cycFit').hidden, document.getElementById('cycFit').textContent])`),
        J(['BES28 ▾', false, 'FY27 · $541K unallocated · ⚠ $50 over']));
    }
    ev(`fitOpen=false; switchYear(2029); render(); 'ok'`);
    chk(name, 'the figure', 'FY29, a year BES28 logs nothing for, says so', ev(`document.getElementById('cycFit').textContent`), 'FY29 · no BES28 controls');
    ev(`switchYear(2027); cycSetWorking('BES', 2029); 'ok'`);
    chk(name, 'the figure', 'a cycle this appropriation has no position for says so', ev(`document.getElementById('cycFit').textContent`), 'no BES29 controls entered');
    // ---- the journal: a change of cycle is one line, by either writer, never put back, and it changes no requirement’s record
    const last = JSON.parse(ev(`JSON.stringify(MS.jrnl.slice(-2).map(function(e){ return [e.p, e.a, e.b, e.f, jrnlUndoable(e), jrnlLabel(e)]; }))`));
    chk(name, 'journal', 'putting it on BES28 and tagging this board BES29 are a line each: forced, never put back, labelled',
      J(last), J([[['(cycle)'], null, 'BES|2028', 1, false, 'the PPBE cycle — not tagged → BES28'], [['(cycle)'], 'BES|2028', 'BES|2029', 1, false, 'the PPBE cycle — BES28 → BES29']]));
    ev(`MS.jrnl.push({t:Date.now()-5000, by:'X', fy:MS.cur, p:['notes','A'], a:'', b:'a note'}); cycSetWorking('BES', 2028); 'ok'`);
    {
      const K = w3Board();
      K.ev(`blCyc='BES'; blYr=2028; cycLock(); 'ok'`);
      chk(name, 'journal', 'a lock that tags an untagged plan writes the line too', K.ev(`JSON.stringify(MS.jrnl.filter(function(e){ return e.p && e.p[0]==='(cycle)'; }).map(function(e){ return [e.a, e.b]; }))`),
        J([[null, 'BES|2028']]));
    }
    chk(name, 'journal', 'a requirement’s last recorded edit is still its own after a change of cycle', ev(`JSON.stringify((uiLastEdit('A')||{}).p)`), J(['notes', 'A']));
    // ---- the review (F6, F7, F15, F23): a locked view whose lock read another cycle's position; a lock that kept none; a service
    // the position cannot be read for
    ev(`window.confirm=function(){ return true; }; ${OLD_LOCK('PB|2027')}; uiCycGo('PB|2027'); 'ok'`);
    chk(name, 'locked view', 'PB27 locked while the plan was on BES28: the bar names PB27, the figure names BES28, the cycle it is against',
      ev(`JSON.stringify([document.getElementById('b_cyc').textContent, document.getElementById('cycFit').textContent])`), J(['PB27 (locked) ▾', 'BES28 · FY27 · $541K unallocated · ⚠ $50 over']));
    ev(`uiCycGo(''); cycSetWorking('PB', 2026); blCyc='PB'; blYr=2026; cycLock(); uiCycGo('PB|2026'); 'ok'`);
    chk(name, 'locked view', 'a lock that kept no position says it kept none -- not that the position is missing now',
      ev(`JSON.stringify([document.getElementById('cycFit').textContent, /This lock kept no PB26 position/.test(document.getElementById('cycFit').title)])`), J(['kept no PB26 controls', true]));
    ev(`uiCycGo(''); cycSetWorking('BES', 2028); MS.ppbe['BES|2028'].lines=Object.assign({}, MS.ppbe['BES|2028'].lines||{}, {USAF:'x'}); baLiveAll(); render(); fitOpen=true; render(); 'ok'`);
    chk(name, 'the figure', 'a service the position cannot be read for is named as that, in the tooltip and on the panel’s line',
      J([/Not counted, BES28 cannot be read for: USAF/.test(ev(`document.getElementById('cycFit').title`)),
        /not counted, BES28 cannot be read for: USAF/.test(ev(`(document.querySelector('#fitBody .fitctl[data-fy="2027"]')||{}).textContent||''`))]), J([true, true]));
    ev(`fitOpen=false; delete MS.ppbe['BES|2028'].lines.USAF; baLiveAll(); render(); 'ok'`);
    // ---------------------------------------------------------------- PART 2: four appropriations
    const T1 = 1790100000000, T0 = 1790000000000;
    const year = (bm) => ({ order: [], alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [], bm });
    const ffStore = { svc: ['USAF', 'ANG'], ts: T1, base: 2027, cur: 2027, cycle: 'BES|2028', by: 'F Lead',
      ppbe: { 'BES|2028': { v: 2, split: true, lines: {}, val: { USAF: { _all: { 2027: { d: 800, m: 80 } } } } } },
      years: { 2027: year({ disc: [100, 40], mand: [10, 0], adds: [] }) } };
    const spStore = { svc: ['USAF', 'ANG'], ts: T1, base: 2027, cur: 2027, cycle: 'PB|2027', by: 'S Lead', cycleRef: 'PB|2027',
      ppbe: { 'BES|2028': { v: 2, split: true, lines: {}, val: { USAF: { _all: { 2027: { d: 5000, m: 700 } } } } } },
      jrnl: [{ t: T0, by: 'S Lead', fy: 2027, p: ['notes', 'Q'], a: '', b: 'kept' }],
      years: { 2027: Object.assign(year({ disc: [100, 40], mand: [10, 0], adds: [] }), { notes: { Q: 'Initial Spares’ own note — keep me' } }) } };
    const opnLegacy = { order: ['Z'], alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [], ts: T0 };
    const LS = { prio27ff: J(ffStore), prio27sp: J(spStore), 'prio27sp.base': J({ file: 123, dirty: false, folder: { 'sp|2027': 9 } }), prio27opn: J(opnLegacy) };
    const KEYS = ['prio27ff', 'prio27ff.base', 'prio27sp', 'prio27sp.base', 'prio27opn', 'prio27opn.base', 'prio27ff-cyc', 'prio27sp-cyc', 'prio27opn-cyc'];
    const four = (extra = {}) => {
      const X = boot({ ls: Object.assign({}, LS, extra) });
      seed(X.ev, { services: ['USAF', 'ANG'], items: [it('A', 'PSM', [100, 50]), it('B', 'AV', [80, 40])], disc: [150, 60], mand: [20, 10], order: ['A', 'B'] });
      X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); MS.svc=SVC.slice(); MS.cycle='PB|2027'; save(); render();
        window.__cm=''; window.confirm=function(m){ window.__cm=m; return window.__yes!==false; }; window.alert=function(){}; 'ok'`);
      X.store = () => X.ev(`JSON.stringify(${J(KEYS)}.map(function(k){ return localStorage.getItem(k); }))`);
      X.all = () => JSON.parse(X.ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
      return X;
    };
    const tagOf = (X, k) => { const s = JSON.parse(X.ev(`localStorage.getItem(${J(k)})`) || 'null'); return s ? s.cycle : 'none'; };
    const F = four(), before = F.store();
    chk(name, 'mixed', 'each appropriation’s cycle, read from its own store: O&M PB27, Full Fund BES28, Initial Spares PB27, OPN (a store from before years were kept) untagged',
      F.ev(`JSON.stringify(cycAll().rows.map(function(r){ return [r.k, r.held, r.tag]; }))`), J([['om', true, 'PB|2027'], ['ff', true, 'BES|2028'], ['sp', true, 'PB|2027'], ['opn', true, '']]));
    chk(name, 'mixed', 'the bar reads Mixed, and its tooltip names each', J([F.ev(`document.getElementById('b_cyc').textContent`),
      /O&M: PB27; Full Fund: BES28; Initial Spares: PB27; OPN: not tagged/.test(F.ev(`document.getElementById('b_cyc').title`))]), J(['⚠ Mixed ▾', true]));
    F.ev(`toggleMenu('cyc'); 'ok'`);
    const menu = JSON.parse(F.ev(`JSON.stringify({rows:[].map.call(document.querySelectorAll('#dd_cyc .cycall-row'), function(r){ return r.textContent.replace(/\\s+/g,' ').trim(); }),
      items:[].map.call(document.querySelectorAll('#dd_cyc button.mi:not(.cycfit-mi)'), function(b){ var c=b.querySelector('.chk').textContent; return [b.textContent.slice(c.length).replace(/\\s+/g,' ').trim(), c]; })})`));   // v2.15 W1 (item 137): the figure's copy, shown only when the bar has no room for it, is not a choice
    chk(name, 'the menu', 'it lists every appropriation and its cycle, ⚠ beside each not on the latest',
      J(menu.rows), J(['O&M PB27 (this board) ⚠', 'Full Fund BES28', 'Initial Spares PB27 ⚠', 'OPN not tagged ⚠']));
    chk(name, 'the menu', 'it offers the cycles in use or with controls entered, and the next, latest first -- none ticked while they disagree; then the plan on screen',
      J(menu.items), J([['PB28no controls entered for it yet', ''], ['BES28controls entered: Full Fund, Initial Spares', ''], ['PB27no controls entered for it yet', ''],
        ['Working planthe plan you change and save', '✓']]));
    // ---- Cancel changes nothing
    F.ev(`window.__yes=false; 'ok'`);
    chk(name, 'cancel', 'Cancel: nothing written, nothing journalled, the board still on PB27',
      J([F.ev(`String(cycApplyAll('BES|2028'))`), F.store() === before, F.ev('MS.cycle'), F.ev(`String(MS.jrnl.filter(function(e){ return e.p && e.p[0]==='(cycle)'; }).length)`)]), J(['false', true, 'PB|2027', '0']));
    // ---- while they disagree, the figure names the cycle it is against: this board's own, PB27, given controls for USAF only.
    // USAF discretionary BA 1,000 against A and B's 100 + 80 on the lane walk: $820 unallocated; ANG is the board's own, not counted
    F.ev(`MS.ppbe['PB|2027']={v:2, split:true, lines:{}, val:{USAF:{_all:{2027:{d:1000, m:0}}}}}; baLiveAll(); render(); 'ok'`);
    chk(name, 'mixed', 'the figure beside a Mixed bar names this board’s cycle', F.ev(`document.getElementById('cycFit').textContent`), 'PB27 · FY27 · $820 unallocated');
    // ---- the rendered item, as a person picks it
    // the item is found by what it says (its label, after the tick column), and clicked as a person clicks it
    F.ev(`window.__mi=function(re){ return [].filter.call(document.querySelectorAll('#dd_cyc button.mi'), function(b){ return re.test(b.textContent.slice(b.querySelector('.chk').textContent.length)); })[0]; }; 'ok'`);
    F.ev(`window.__yes=true; toggleMenu('cyc'); window.__mi(/^BES28/).click(); 'ok'`);
    await sleep(30);
    const cm = F.ev('window.__cm');
    chk(name, 'the question', 'it names every appropriation and what happens to each, before anything is written',
      J([/^Put every appropriation on BES28\?/.test(cm), /• O&M \(this board\) — PB27 → BES28 \(no BES28 controls entered: it keeps its own budget until they are\)/.test(cm),
        /• Full Fund — already BES28/.test(cm), /• Initial Spares — PB27 → BES28 \(controls entered\)/.test(cm), /• OPN — not tagged → BES28/.test(cm),
        /Locked cycles and “deltas read against” do not change/.test(cm)]), J([true, true, true, true, true, true]));
    chk(name, 'applied', 'every appropriation holding a plan is on BES28: O&M on screen, Initial Spares and OPN in their stores; Full Fund was already',
      J([F.ev('MS.cycle'), tagOf(F, 'prio27ff'), tagOf(F, 'prio27sp'), tagOf(F, 'prio27opn')]), J(['BES|2028', 'BES|2028', 'BES|2028', 'BES|2028']));
    const sp1 = JSON.parse(F.ev(`localStorage.getItem('prio27sp')`));
    const strip = o => { const c = JSON.parse(J(o)); ['cycle', 'ts', 'by', 'jrnl'].forEach(k => delete c[k]); return J(c); };
    chk(name, 'applied', 'Initial Spares’ store is otherwise exactly what it was -- its note, its position, its deltas reference (PB27, the separate comparison)',
      strip(sp1), strip(spStore));
    chk(name, 'applied', 'its store is newer than it was, so its board opens it; and its journal gains one line',
      J([sp1.ts > T1, sp1.jrnl.length, sp1.jrnl[1].p, sp1.jrnl[1].a, sp1.jrnl[1].b, sp1.jrnl[1].f]), J([true, 2, ['(cycle)'], 'PB|2027', 'BES|2028', 1]));
    chk(name, 'applied', 'and this browser records it as work no saved copy has, keeping what the record held',
      F.ev(`localStorage.getItem('prio27sp.base')`), J({ file: 123, dirty: true, folder: { 'sp|2027': 9 } }));
    chk(name, 'applied', 'Full Fund, already on BES28, is not written at all', JSON.parse(F.store())[0], J(ffStore));
    const opn1 = JSON.parse(F.ev(`localStorage.getItem('prio27opn')`));
    chk(name, 'applied', 'OPN’s old-shape store is put in the shape its board opens, so the cycle stays at the top and its plan is kept',
      J([opn1.cycle, !!(opn1.years && opn1.years[2027]), J((opn1.years || {})[2027] && opn1.years[2027].order)]), J(['BES|2028', true, J(['Z'])]));
    chk(name, 'applied', 'the bar reads BES28, and the menu ticks it', J([F.ev(`document.getElementById('b_cyc').textContent`),
      F.ev(`(function(){ toggleMenu('cyc'); var t=window.__mi(/^BES28/).querySelector('.chk').textContent; toggleMenu('cyc'); return t; })()`)]),
      J(['BES28 ▾', '✓']));
    chk(name, 'applied', 'the message says what changed', /Every appropriation is on BES28 — O&M, Initial Spares, OPN changed/.test(F.ev(`document.getElementById('shareStat').textContent`)), true);
    chk(name, 'applied', 'O&M’s journal has the line', F.ev(`JSON.stringify(MS.jrnl.slice(-1).map(function(e){ return [e.p, e.a, e.b]; }))`), J([[['(cycle)'], 'PB|2027', 'BES|2028']]));
    chk(name, 'applied', 'the board on screen’s deltas are still read against what they were (the separate comparison)', F.ev(`String(MS.cycleRef)`), '');
    const saved = JSON.parse(F.ev(`(function(){ var h=buildSavedHtml(); var m=/<script type="application\\/json" id="pubState">([\\s\\S]*?)<\\/script>/.exec(h); return JSON.stringify(JSON.parse(m[1]).appns); })()`));
    chk(name, 'saved', '💾 Save carries every appropriation’s cycle into the file', J(['om', 'ff', 'sp', 'opn'].map(k => saved[k] && saved[k].cycle)), J(['BES|2028', 'BES|2028', 'BES|2028', 'BES|2028']));
    // ---- the Initial Spares board, opened in the same browser: on BES28, and its budget read from its own BES28 position at once
    const S2 = boot({ appn: 'INITIAL SPARES', ls: F.all() });
    chk(name, 'opened', 'the Initial Spares board opens on BES28, its USAF budget its own position’s ($5,000 / $700), ANG its own base -- nothing clicked',
      S2.ev(`JSON.stringify([MS.cycle, S.discSvc, S.mandSvc, MS.years[2027].notes])`), J(['BES|2028', [5000, 40], [700, 0], { Q: 'Initial Spares’ own note — keep me' }]));
    chk(name, 'opened', 'and, every appropriation agreeing, its opening offers nothing', /different PPBE cycles/.test(S2.ev(`document.getElementById('shareStat').textContent`)), false);
    // ---- storage refuses part-way: everything put back, nothing changed, nothing reads unsaved for it
    // v2.14 RV1-B: refused with a reason other than room. A refusal for room, put back whole, now carries the other appropriations'
    // plans on this page (audit-board's RV1-B block "putting every appropriation on a cycle tags them on this page"); any other
    // refusal is refused as it was, which is what this part holds.
    {
      const R = four(), b0 = R.store();
      R.ev(`window.__setI=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(k==='prio27opn.base') throw new DOMException('denied','SecurityError'); return window.__setI.call(this,k,v); };
        window.__g0=_sideGen; 'ok'`);
      const ok = R.ev(`String(cycApplyAll('BES|2028'))`);
      R.ev(`Storage.prototype.setItem=window.__setI; 'ok'`);
      chk(name, 'refused', 'refused on the last write: every store put back as it was, the board still on PB27, nothing counted as unsaved',
        J([ok, R.store() === b0, R.ev('MS.cycle'), R.ev('String(_sideGen===window.__g0)')]), J(['false', true, 'PB|2027', 'true']));
      chk(name, 'refused', 'and it says nothing was changed', /The PPBE cycle was not changed.*Nothing was changed\./.test(R.ev(`document.getElementById('shareStat').textContent`)), true);
    }
    // ---- the file's copy is the newer, and this browser holds unsaved Initial Spares work: that work is never written over
    {
      const N = four({ 'prio27sp.base': J({ dirty: true }) });
      N.ev(`PUBS.sp=JSON.parse(${J(J(Object.assign({}, spStore, { ts: T1 + 5000, by: 'Colleague' })))}); _cycAllMemo=null; 'ok'`);
      const b0 = N.ev(`localStorage.getItem('prio27sp')`);
      N.ev(`cycApplyAll('BES|2028'); 'ok'`);
      chk(name, 'unsaved work', 'Initial Spares is named and left alone: its store in this browser byte for byte; the others are moved',
        J([/• Initial Spares — NOT changed: this browser holds Initial Spares work the saved file does not have/.test(N.ev('window.__cm')),
          N.ev(`localStorage.getItem('prio27sp')`) === b0, tagOf(N, 'prio27opn'), N.ev('MS.cycle')]), J([true, true, 'BES|2028', 'BES|2028']));
      chk(name, 'unsaved work', 'and the message names it, and does not say every appropriation moved',
        J([/not changed<\/b>: Initial Spares \(this browser holds Initial Spares work/.test(N.ev(`document.getElementById('shareStat').innerHTML`)),
          /Every appropriation/.test(N.ev(`document.getElementById('shareStat').textContent`))]), J([true, false]));
      // the same, with nothing unsaved: the file's copy is the one its board would open, so that is what is written, newer than both
      const C = four({ 'prio27sp.base': J({ dirty: false }) });
      C.ev(`PUBS.sp=JSON.parse(${J(J(Object.assign({}, spStore, { ts: T1 + 5000, by: 'Colleague', years: { 2027: Object.assign(year({ disc: [100, 40], mand: [10, 0], adds: [] }), { notes: { Q: 'the colleague’s note' } }) } })))}); _cycAllMemo=null; cycApplyAll('BES|2028'); 'ok'`);
      const sp2 = JSON.parse(C.ev(`localStorage.getItem('prio27sp')`));
      chk(name, 'unsaved work', 'CONTROL: nothing unsaved -- the file’s newer copy is what is written, tagged, and newer than it',
        J([sp2.cycle, sp2.years[2027].notes.Q, sp2.ts > T1 + 5000, C.ev('PUBS.sp.cycle')]), J(['BES|2028', 'the colleague’s note', true, 'BES|2028']));
      chk(name, 'unsaved work', 'and its record names the file that copy came from, the one open', C.ev(`JSON.stringify([JSON.parse(localStorage.getItem('prio27sp.base')), PUB_FILE_TS])`),
        J([{ dirty: true, file: JSON.parse(C.ev('PUB_FILE_TS')) }, JSON.parse(C.ev('PUB_FILE_TS'))]));
      // F21: a colleague's clock an hour ahead -- the copy written is still newer than the file's
      const A1 = four({ 'prio27sp.base': J({ dirty: false }) });
      A1.ev(`PUBS.sp=Object.assign(JSON.parse(${J(J(spStore))}), {ts:Date.now()+3600000}); _cycAllMemo=null; cycApplyAll('BES|2028'); 'ok'`);
      chk(name, 'unsaved work', 'a file stamped by a clock an hour ahead: the copy written is newer still, so Initial Spares opens it',
        A1.ev(`String(JSON.parse(localStorage.getItem('prio27sp')).ts > PUBS.sp.ts - 1 && JSON.parse(localStorage.getItem('prio27sp')).ts > Date.now()+3500000)`), 'true');
    }
    // ---- working out of the shared folder: the board on screen alone
    {
      const D = four(), b0 = D.store();
      D.ev(`driveStoreOn=function(){ return true; }; cycApplyAll('BES|2028'); 'ok'`);
      chk(name, 'shared folder', 'only the board on screen is moved; every other store is untouched, and the question says each board offers it',
        J([D.ev('MS.cycle'), D.store() === b0, /• Initial Spares — PB27: moved on its own board, which offers BES28 when it opens/.test(D.ev('window.__cm'))]), J(['BES|2028', true, true]));
    }
    // ---- a locked view: refused, nothing written; the menu says why
    {
      const V = four();
      // the plan is on BES28 when PB27 is locked, so the lock's position is BES28's: the bar must name the lock, PB27
      V.ev(`cycSetWorking('BES', 2028); ${OLD_LOCK('PB|2027')}; cycView('PB|2027'); 'ok'`);       // v2.15 W1: a lock taken before v2.15 (OLD_LOCK)
      const b0 = V.store();
      chk(name, 'locked view', 'refused, nothing written, and the bar names the lock', J([V.ev(`String(cycApplyAll('BES|2028'))`), V.store() === b0, V.ev(`document.getElementById('b_cyc').textContent`)]),
        J(['false', true, 'PB27 (locked) ▾']));
      V.ev(`toggleMenu('cyc'); 'ok'`);
      chk(name, 'locked view', 'the menu offers no cycle to put anything on, only the plan on screen', V.ev(`JSON.stringify([/is on screen, read only/.test(document.getElementById('dd_cyc').textContent),
        [].filter.call(document.querySelectorAll('#dd_cyc button.mi'), function(b){ return /cycApplyAll/.test(b.getAttribute('onclick')); }).length])`), J([true, 0]));
      V.ev(`cycLeave(true); 'ok'`);
    }
    // ---- a PMO copy: it shows the cycle it was published with, and changes nothing
    {
      const html = F.ev(`pmoCopyHtml({sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, ap:APPN, base:pmoBaseline()})`);
      const P = boot({ html });
      P.ev(`window.confirm=function(){ return true; }; 'ok'`);
      chk(name, 'PMO copy', 'the copy reads BES28, refuses to change it, and its menu offers nothing that would',
        J([P.ev(`document.getElementById('b_cyc').textContent`), P.ev(`String(cycApplyAll('PB|2028'))`), P.ev('MS.cycle'),
          P.ev(`(function(){ toggleMenu('cyc'); return [].filter.call(document.querySelectorAll('#dd_cyc button.mi'), function(b){ return /cycApplyAll/.test(b.getAttribute('onclick')); }).length; })()`)]),
        J(['BES28 ▾', 'false', 'BES|2028', 0]));
      chk(name, 'PMO copy', 'and PPBE cycles’ own tag is refused there too', J([P.ev(`cycSetWorking('PB', 2028); MS.cycle`)]), J(['BES|2028']));
      const html0 = B.ev(`(function(){ var w=MS.cycle; MS.cycle=''; var h=pmoCopyHtml({sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, ap:APPN, base:pmoBaseline()}); MS.cycle=w; return h; })()`);
      const P0 = boot({ html: html0 });
      chk(name, 'PMO copy', 'a lock taken in an untagged copy leaves it untagged, and its question never says it will tag it',
        P0.ev(`window.__q=''; window.confirm=function(m){ window.__q+=m; return true; }; blCyc='BES'; blYr=2028; cycLock(); JSON.stringify([String(MS.cycle), /this lock tags it/.test(window.__q), /budget authority moves/.test(window.__q)])`),
        J(['', false, false]));
      chk(name, 'PMO copy', 'its PPBE cycles tag box is read only', P.ev(`blOpen=true; render(); JSON.stringify([].map.call(document.querySelectorAll('#blBody select[onchange^="cycSetWorking"], #blBody input[onchange^="cycSetWorking"]'), function(e){ return e.disabled; }))`),
        J([true, true]));
    }
    // ---- opening a board whose appropriations disagree: named and offered, nothing changed by opening
    {
      const LS0 = Object.assign({}, LS);
      const O = boot({ appn: 'INITIAL SPARES', ls: LS0 });
      const st = O.ev(`document.getElementById('shareStat').textContent`);
      chk(name, 'opening', 'it names each appropriation’s cycle and offers BES28 (the latest) and PB27 (this board’s)',
        J([/The appropriations are on different PPBE cycles: Full Fund BES28, Initial Spares PB27, OPN not tagged\./.test(st),
          O.ev(`JSON.stringify([].map.call(document.querySelectorAll('#shareStat button'), function(b){ return b.textContent; }).filter(function(t){ return /^Put every/.test(t); }))`)]),
        J([true, J(['Put every appropriation on BES28', 'Put every appropriation on PB27'])]));
      chk(name, 'opening', 'the offer is kept unread in the message list, so a later line cannot take it away', O.ev(`String((function(){ var e=STAT_LOG.filter(function(x){ return /different PPBE cycles/.test(x.html); }).pop(); return !!(e && e.keep && !e.read); })())`), 'true');
      chk(name, 'opening', 'opening changes nothing: Full Fund and OPN’s stores as they were', J([O.ev(`localStorage.getItem('prio27ff')`), O.ev(`localStorage.getItem('prio27opn')`)]), J([LS.prio27ff, LS.prio27opn]));
      O.ev(`window.confirm=function(){ return true; }; [].filter.call(document.querySelectorAll('#shareStat button'), function(b){ return b.textContent==='Put every appropriation on BES28'; })[0].click(); 'ok'`);
      chk(name, 'opening', 'the offer, taken, puts them all on BES28', J([O.ev('MS.cycle'), tagOf(O, 'prio27ff'), tagOf(O, 'prio27opn')]), J(['BES|2028', 'BES|2028', 'BES|2028']));
    }
    // ---- a stopped import's mix: nothing is written into it
    {
      const M = four(), b0 = M.store();
      M.ev(`localStorage.setItem(IMP_MIXED_KEY, JSON.stringify({keys:['prio27ff']})); 'ok'`);
      chk(name, 'stopped import', 'while an import stopped part-way holds Save, the cycle is not changed and nothing is written',
        J([M.ev(`String(cycApplyAll('BES|2028'))`), M.store() === b0, M.ev('MS.cycle')]), J(['false', true, 'PB|2027']));
    }
    // ---- another appropriation's plan changed by another writer here (an import, a package) is read again, not remembered
    {
      const L = four();
      L.ev(`cycAll(); lsSet('prio27ff', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('prio27ff')), {cycle:'PB|2027'})), 'Full Fund board data');
        localStorage.setItem('prio27opn', JSON.stringify({years:{2027:{order:['Z']}}, base:2027, cur:2027, cycle:'PB|2027'})); lsSet('prio27sp-cyc', '{}', 'x'); render(); 'ok'`);
      chk(name, 'read again', 'after another appropriation’s plan is written here, the bar reads it: every one on PB27',
        L.ev(`document.getElementById('b_cyc').textContent`), 'PB27 ▾');
    }
    // ---- the guide says it
    chk(name, 'the guide', 'the guide says the box at the top puts every appropriation on one cycle, reads Mixed, and shows the figure',
      /The <b>PPBE cycle<\/b> box at the top of the board.*every appropriation that holds a plan is put on it at once.*<i>Mixed<\/i>.*<b>unallocated<\/b>.*<b>over<\/b>/s
        .test(F.ev(`document.getElementById('helpDoc').innerHTML`)), true);
    // ---- a board on the latest cycle, the others behind it: its opening says so too (not only a board behind)
    {
      const L2 = boot({ appn: 'FULL FUND', ls: Object.assign({}, LS) });
      chk(name, 'opening', 'Full Fund, on BES28 with the others behind, is told they disagree and offered BES28 -- and is not told it is behind',
        J([/The appropriations are on different PPBE cycles/.test(L2.ev(`document.getElementById('shareStat').textContent`)),
          /Full Fund is tagged/.test(L2.ev(`document.getElementById('shareStat').textContent`))]), J([true, false]));
    }
    // ---- an empty board, untagged, is no disagreement: OPN opened with nothing in it, the others on BES28
    {
      // Initial Spares' store exists, empty and untagged: no disagreement either
      const E = boot({ appn: 'OPN', ls: { prio27ff: LS.prio27ff, prio27sp: J({ svc: ['USAF', 'ANG'], ts: T1, base: 2027, cur: 2027, cycle: '', years: { 2027: year({ disc: [0, 0], mand: [0, 0], adds: [] }) } }) } });
      chk(name, 'empty board', 'an empty OPN board on screen reads BES28, as every other board does, and its opening offers nothing',
        J([E.ev(`document.getElementById('b_cyc').textContent`), /different PPBE cycles|OPN is not tagged/.test(E.ev(`document.getElementById('shareStat').textContent`))]),
        J(['BES28 ▾', false]));
    }
    // ---- a package or a file taken whole says it changes the cycle (and the deltas' reference) -- its preview said nothing before
    chk(name, 'package preview', 'the preview of a package names a change of PPBE cycle and of what deltas are read against',
      F.ev(`JSON.stringify(pkgDiff({cycle:'PB|2027', cycleRef:'', years:{}}, {cycle:'BES|2028', cycleRef:'PB|2027', years:{}}))`),
      J([['PPBE cycle', 'PB27 → BES28'], ['Deltas read against', 'none → PB27']]));
    // ---- only a cycle and a four-digit year is a cycle: it ranks, it can be tagged
    chk(name, 'keys', 'a key that is not a cycle never ranks as one', F.ev(`JSON.stringify([cycKeyRank('BES|2028x'), cycKeyRank('BES|28'), cycKeyRank('BES|2028')!==null])`), J([null, null, true]));
    chk(name, 'keys', 'and PPBE cycles will not tag the plan with one', F.ev(`(function(){ var w=MS.cycle; cycSetWorking('BES', 28); return String(MS.cycle===w); })()`), 'true');
    // ---- another tab put this appropriation on a cycle: this tab, open on it, follows -- or its next save would put the old one back
    {
      const T = four();
      const other = J(Object.assign(JSON.parse(T.ev(`localStorage.getItem(_AP.key)`)), { cycle: 'BES|2028',
        jrnl: [{ t: T1, by: 'Other tab', fy: 2027, p: ['(cycle)'], a: 'PB|2027', b: 'BES|2028', f: 1 }] }));
      T.ev(`window.dispatchEvent(new StorageEvent('storage', {key:_AP.key, newValue:${J(other)}})); 'ok'`);
      chk(name, 'another tab', 'the tab takes BES28 with the other tab’s journal line, and says so', J([T.ev('MS.cycle'),
        T.ev(`JSON.stringify(MS.jrnl.slice(-1).map(function(e){ return [e.by, e.a, e.b]; }))`), /was put on BES28 in another tab/.test(T.ev(`document.getElementById('shareStat').textContent`))]),
        J(['BES|2028', J([['Other tab', 'PB|2027', 'BES|2028']]), true]));
      // a tag that is not a cycle, though the other tab's journal carries a newer line for it: still not taken
      T.ev(`window.dispatchEvent(new StorageEvent('storage', {key:'prio27ff', newValue:'{}'})); window.dispatchEvent(new StorageEvent('storage', {key:_AP.key, newValue:${J(J({ cycle: 'BES|28x', years: {},
        jrnl: [{ t: 1799000000000, by: 'Other tab', fy: 2027, p: ['(cycle)'], a: 'BES|2028', b: 'BES|28x', f: 1 }] }))}})); 'ok'`);
      chk(name, 'another tab', 'CONTROL: another key, or a tag that is not a cycle, changes nothing here', T.ev('MS.cycle'), 'BES|2028');
    }
    // ---- this board's own storage refuses: the others are on the new cycle, and the message says to save before reloading
    {
      const O2 = four();
      O2.ev(`window.__setI=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(k===_AP.key) throw new DOMException('full','QuotaExceededError'); return window.__setI.call(this,k,v); }; cycApplyAll('BES|2028'); Storage.prototype.setItem=window.__setI; 'ok'`);
      chk(name, 'own refused', 'the others are moved, this board is on BES28 on screen, and it is told to save before reloading',
        J([tagOf(O2, 'prio27sp'), O2.ev('MS.cycle'), /Browser storage refused this board’s own change/.test(O2.ev(`document.getElementById('shareStat').textContent`))]), J(['BES|2028', 'BES|2028', true]));
    }
    // ---- every appropriation held only in the file: put on BES28, saved, and each opened from that file alone
    {
      const FL = four({ prio27ff: null, prio27sp: null, prio27opn: null });
      FL.ev(`localStorage.removeItem('prio27ff'); localStorage.removeItem('prio27sp'); localStorage.removeItem('prio27opn');
        PUBS.ff=JSON.parse(${J(J(ffStore))}); PUBS.sp=JSON.parse(${J(J(spStore))}); _cycAllMemo=null; render(); 'ok'`);
      chk(name, 'file only', 'CONTROL: the others are read from the file alone, and disagree', FL.ev(`document.getElementById('b_cyc').textContent`), '⚠ Mixed ▾');
      FL.ev(`cycApplyAll('BES|2028'); 'ok'`);
      const html = FL.ev('buildSavedHtml()');
      const opened = ['FULL FUND', 'INITIAL SPARES'].map(a => { const X = boot({ html, appn: a }); return [X.ev('mySlug()'), X.ev('MS.cycle'), X.ev(`document.getElementById('b_cyc').textContent`)]; });
      chk(name, 'file only', 'the saved file opens every appropriation on BES28, and every board reads one cycle', J(opened), J([['ff', 'BES|2028', 'BES28 ▾'], ['sp', 'BES|2028', 'BES28 ▾']]));
    }
    // ---- the review (F0): another tab of this browser saves Initial Spares while the question is open: it is left as it now is
    {
      const Q = four();
      Q.ev(`window.confirm=function(m){ window.__cm=m; var s=JSON.parse(localStorage.getItem('prio27sp')); s.years[2027].notes={Q:'typed in the other tab while the question was open'}; s.ts=Date.now();
        localStorage.setItem('prio27sp', JSON.stringify(s)); return true; }; cycApplyAll('BES|2028'); 'ok'`);
      const spq = JSON.parse(Q.ev(`localStorage.getItem('prio27sp')`));
      chk(name, 'question open', 'Initial Spares, saved in another tab while the question was open, keeps that work and its cycle; the others move; it is named',
        J([spq.years[2027].notes.Q, spq.cycle, tagOf(Q, 'prio27opn'), Q.ev('MS.cycle'), /Initial Spares \(Initial Spares was saved in another tab while the question was open\)/.test(Q.ev(`document.getElementById('shareStat').textContent`))]),
        J(['typed in the other tab while the question was open', 'PB|2027', 'BES|2028', 'BES|2028', true]));
    }
    // ---- F1: a tab viewing a lock keeps the cycle another tab chose for the plan set aside; a tab that merely saved an old copy is not followed
    {
      const VT = four();
      VT.ev(`blCyc='PB'; blYr=2027; cycLock(); cycView('PB|2027'); 'ok'`);
      const chose = J(Object.assign(JSON.parse(VT.ev(`localStorage.getItem(_AP.key)`)), { cycle: 'BES|2028', jrnl: [{ t: Date.now ? 1795000000000 : 0, by: 'Other tab', fy: 2027, p: ['(cycle)'], a: 'PB|2027', b: 'BES|2028', f: 1 }] }));
      VT.ev(`window.dispatchEvent(new StorageEvent('storage', {key:_AP.key, newValue:${J(chose)}})); cycLeave(true); 'ok'`);
      chk(name, 'another tab', 'viewing a lock, the plan set aside takes the cycle another tab chose, and has it on leaving the view', VT.ev('MS.cycle'), 'BES|2028');
      const stale = J(Object.assign(JSON.parse(VT.ev(`localStorage.getItem(_AP.key)`)), { cycle: 'PB|2027', jrnl: [] }));
      VT.ev(`window.dispatchEvent(new StorageEvent('storage', {key:_AP.key, newValue:${J(stale)}})); 'ok'`);
      chk(name, 'another tab', 'a tab that wrote its old copy back, with no change of cycle in its journal, is not taken as somebody choosing PB27', VT.ev('MS.cycle'), 'BES|2028');
    }
    // ---- F18: the tab that takes the cycle reads its budget from that cycle's position at once
    {
      const BT = four();
      BT.ev(`MS.ppbe['BES|2028']={v:2, split:true, lines:{}, val:{USAF:{_all:{2027:{d:999, m:77}}}}}; save(); render(); 'ok'`);
      const ch = J(Object.assign(JSON.parse(BT.ev(`localStorage.getItem(_AP.key)`)), { cycle: 'BES|2028', jrnl: [{ t: 1795000000000, by: 'Other tab', fy: 2027, p: ['(cycle)'], a: 'PB|2027', b: 'BES|2028', f: 1 }] }));
      BT.ev(`window.dispatchEvent(new StorageEvent('storage', {key:_AP.key, newValue:${J(ch)}})); 'ok'`);
      chk(name, 'another tab', 'and its USAF budget is BES28’s $999 / $77 at once', BT.ev(`JSON.stringify([S.discSvc[0], S.mandSvc[0]])`), J([999, 77]));
    }
    // ---- F19: another tab moves another appropriation: the bar reads it again
    {
      const ST = four();
      ST.ev(`cycAll(); ['prio27ff','prio27opn'].forEach(function(k){ var s=JSON.parse(localStorage.getItem(k)); if(!s.years) s={years:{2027:{order:['Z']}}, base:2027, cur:2027}; s.cycle='PB|2027'; localStorage.setItem(k, JSON.stringify(s)); });
        window.dispatchEvent(new StorageEvent('storage', {key:'prio27ff'})); render(); 'ok'`);
      chk(name, 'another tab', 'another appropriation moved in another tab: the bar reads every one on PB27', ST.ev(`document.getElementById('b_cyc').textContent`), 'PB27 ▾');
    }
    // ---- F20: refused on a counted key, on a board read as saved: put back whole, and it still reads saved
    // v2.14 RV1-B: refused with a reason other than room -- a refusal for room, put back whole, now carries the other appropriations'
    // plans on this page (audit-board's RV1-B blocks); any other refusal is refused as it was, which is what this part holds
    {
      const R2 = four();
      R2.ev(`_sideSaved=_sideGen; sideBootNote.keys=[]; Object.keys(_lsRefused).forEach(function(k){ delete _lsRefused[k]; });
        window.__setI=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(k==='prio27opn') throw new DOMException('denied','SecurityError'); return window.__setI.call(this,k,v); };
        cycApplyAll('BES|2028'); Storage.prototype.setItem=window.__setI; 'ok'`);
      chk(name, 'refused', 'refused on Initial Spares’ neighbour OPN after Initial Spares was written: put back, nothing held as refused, the lists still read saved',
        R2.ev(`JSON.stringify([MS.cycle, JSON.parse(localStorage.getItem('prio27sp')).cycle, Object.keys(_lsRefused), sideUnsaved()])`), J(['PB|2027', 'PB|2027', [], false]));
    }
    // ---- F22: a position with no figures is no controls entered
    {
      const PE = four({ prio27ff: J(Object.assign({}, ffStore, { ppbe: Object.assign({}, ffStore.ppbe, { 'PB|2028': { v: 2, split: true, lines: {}, val: {} } }) })) });
      chk(name, 'the menu', 'a position entered and left without figures is not controls entered, and offers no later cycle',
        PE.ev(`JSON.stringify(cycAllChoices(cycAll()).map(function(k){ return [k, cycAll().rows.filter(function(r){ return (r.pos||[]).indexOf(k)>=0; }).length]; }))`),
        J([['PB|2028', 0], ['BES|2028', 2], ['PB|2027', 0]]));
    }
    // ---- F9, F10: a store this browser cannot read is said, never "no plan"; the headline then names who moved
    {
      const U = four({ prio27sp: '{not a board', prio27opn: 'null' });
      U.ev(`MS.cycle='BES|2028'; save(); _cycAllMemo=null; render(); toggleMenu('cyc'); 'ok'`);
      chk(name, 'cannot be read', 'Initial Spares cannot be read: the bar does not say every appropriation is on BES28, and the list says why',
        J([U.ev(`document.getElementById('b_cyc').textContent`), U.ev(`(document.querySelector('#dd_cyc .cycall-row[data-ap="sp"]')||{}).textContent`)]),
        J(['⚠ BES28 ▾', 'Initial Spares ⚠ cannot be read']));
      U.ev(`toggleMenu('cyc'); cycApplyAll('PB|2028'); 'ok'`);
      chk(name, 'cannot be read', 'the question names it NOT changed with its reason, and the message names who moved',
        J([/• Initial Spares — NOT changed: its saved state in this browser could not be read/.test(U.ev('window.__cm')),
          /🏷 O&M, Full Fund are on PB28/.test(U.ev(`document.getElementById('shareStat').textContent`))]), J([true, true]));
    }
    // ---- F11: a tag that is not a cycle is shown as written
    {
      const N2 = four({ prio27ff: J(Object.assign({}, ffStore, { cycle: 'BES|28' })) });
      N2.ev(`toggleMenu('cyc'); 'ok'`);
      chk(name, 'not a cycle', 'Full Fund tagged BES|28 reads as written, so the disagreement can be seen',
        N2.ev(`document.querySelector('#dd_cyc .cycall-row[data-ap="ff"]').textContent`), 'Full Fund BES|28 (not a cycle) ⚠');
    }
    // ---- F13: opening says "the others are on X" only where they are
    {
      const O3 = boot({ appn: 'INITIAL SPARES', ls: { prio27ff: LS.prio27ff, prio27sp: LS.prio27sp,
        prio27opn: J({ svc: ['USAF'], ts: T1, base: 2027, cur: 2027, cycle: 'POM|2027', years: { 2027: { order: ['Z'] } } }) } });
      const st3 = O3.ev(`document.getElementById('shareStat').textContent`);
      chk(name, 'opening', 'the others disagree among themselves: the opening says the latest in use, never that they are all on it',
        J([/Initial Spares is tagged PB27, and the latest cycle in use is BES28/.test(st3), /other appropriations are on/.test(st3)]), J([true, false]));
    }
    // ---- F16: Locks by appropriation counts an empty, untagged plan as the bar does
    {
      const L3 = four({ prio27opn: J({ svc: ['USAF'], ts: T1, base: 2027, cur: 2027, cycle: '', years: { 2027: { order: [] } } }) });
      chk(name, 'empty board', 'an empty, untagged OPN plan is not behind in Locks by appropriation either',
        L3.ev(`String(cycOverview().rows.filter(function(r){ return r.k==='opn'; })[0].behind)`), 'false');
    }
    // ---- a file's tag that is not a cycle is drawn as text, never offered, never run
    {
      const bad = '<img src=x onerror="window.__pw=1">|2028';
      const H = four({ prio27ff: J(Object.assign({}, ffStore, { cycle: bad })) });
      H.ev(`toggleMenu('cyc'); 'ok'`);
      chk(name, 'hostile', 'a tag that is not a cycle is drawn as text in the list, offered as no choice, and runs nothing',
        J([H.ev(`String(!!document.querySelector('#dd_cyc img'))`), /<img src=x/.test(H.ev(`document.querySelector('#dd_cyc .cycall-row[data-ap="ff"]').textContent`)),
          H.ev(`String([].some.call(document.querySelectorAll('#dd_cyc button.mi'), function(b){ return /img/.test(b.getAttribute('onclick')); }))`), H.ev('String(window.__pw||0)')]),
        J(['false', true, 'false', '0']));
      chk(name, 'hostile', 'and cycApplyAll refuses it, writing nothing', J([H.ev(`String(cycApplyAll(${J(bad)}))`), tagOf(H, 'prio27sp')]), J(['false', 'PB|2027']));
    }
    chk(name, 'errors', 'no page error on any board', J([B.errors.length, F.errors.length, S2.errors.length]), J([0, 0, 0]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
}
// ==== end v2.13 item 136 ====

// ==== v2.14 W1 (item 140; item 141 D): Save writes only to its own file, and asks before writing over what it does not carry ====
// ==== end v2.14 W1 ====

// ==== v2.14 W2 (item 141): a full import too big for browser storage goes into a new file ====
// ==== end v2.14 W2 ====

// ==== v2.14 W3 (item 141 F, G; item 140 c): browser storage refused or full ====
// Item 141 F: a board larger than browser storage leaves it full, and then a change storage refuses lives on screen only. Measured
// on v2.13 (recovery/v214/notes-W3.md): the refusal went uncounted (Save diagnostics "none this session"), closing the tab asked
// nothing, switching appropriation or Go to under PPBE cycles reopened the page and the change was gone -- and with storage full
// to the last character the switch itself was refused, uncounted, and the page reopened on the same appropriation; the writer
// key was remade on every call, so the second 💾 Save was refused "unknown holds the pen"; the editor name was asked on every
// save and stamped "unknown". Every expectation here is a literal from the fixture. Storage is filled by a counted quota
// (w3sQuota), installed in the board's own window after it opened: a write is refused when it would take storage, keys and
// values in characters, past what it holds now plus `room` -- as Chromium counts it.
const W3S_FIX = { services: ['USAF', 'ANG'], items: [it('A', 'AV', [100, 20]), it('B', 'PSM', [50, 10])], disc: [120, 20], mand: [30, 10], order: ['A', 'B'] };
const w3sQuota = room => `(function(){ var size=function(){ var t=0; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); t+=k.length+localStorage.getItem(k).length; } return t; };
  var LIM=size()+${room}; window.__si=window.__si||Storage.prototype.setItem; var si=window.__si;
  Storage.prototype.setItem=function(k, v){ v=String(v); var was=localStorage.getItem(k);
    if(size()-(was===null? 0 : k.length+was.length)+k.length+v.length>LIM) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    return si.call(this, k, v); }; return LIM; })()`;
const w3sSleep = ms => new Promise(r => setTimeout(r, ms));
// a board with two requirements, saved, the opening's own timers run (they set DIRTY back), read as clean
const w3sFresh = async (o = {}) => {
  const B = boot(o); seed(B.ev, W3S_FIX);
  B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); }); save(); render(); 'ok'`);
  await w3sSleep(5);
  B.ev(`DIRTY=false; _persistFail=false; render(); 'ok'`);
  return B;
};
// jsdom reports a reload it does not carry out as a "navigation" error: that is how reopenPage() shows here
const w3sNav = B => B.errors.filter(e => /navigation/i.test(e)).length;
const w3sLeave = B => B.ev(`(function(){ var e=new Event('beforeunload', {cancelable:true}); window.dispatchEvent(e); return String(e.defaultPrevented); })()`);
// the appropriation box, as a person uses it: its value, then a change event (C30c); what it reads afterwards
const w3sPick = (B, v) => B.ev(`(function(){ var s=document.getElementById('appnSel'); s.value=${JSON.stringify(v)}; s.dispatchEvent(new Event('change')); return s.value; })()`);
// memOnlyNow() as text; 'none' on a board that has no such function (so a board before v2.14 fails each check, not the block)
const w3sMem = B => B.ev(`typeof memOnlyNow==='function'? String(memOnlyNow()) : 'none'`);
const w3sStat = B => B.ev(`(document.getElementById('shareStat')||{}).textContent||''`);
const w3sLs = B => B.ev(`JSON.stringify((function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return o; })())`);
const w3sRefused = B => JSON.parse(B.ev(`JSON.stringify(DIAG.refused.map(function(r){ return r.what+' — '+r.why; }))`));
// a stand-in board file, empty (a new file), remembered as this page's: Save writes it in place with no window
const W3S_FH = `window.__fw={content:'', writes:0};
  FH={name:'Board.html', kind:'file', queryPermission: async function(){ return 'granted'; }, requestPermission: async function(){ return 'granted'; },
    getFile: async function(){ return {text: async function(){ return window.__fw.content; }, size: window.__fw.content.length, lastModified: 1}; },
    createWritable: async function(){ var buf=''; return {write: async function(x){ buf+=String(x); }, close: async function(){ window.__fw.content=buf; window.__fw.writes++; }}; }};
  window.showSaveFilePicker=function(){ return Promise.reject(new DOMException('no window here', 'AbortError')); };
  window.showOpenFilePicker=function(){ return Promise.reject(new DOMException('no window here', 'AbortError')); };`;
{
  const name = 'v2.14 W3 — storage full: a change browser storage refuses is counted, and nothing reopens the page over it unasked (item 141 F)';
  try {
    const J = JSON.stringify;
    const NOTE = 'typed while full ' + 'x'.repeat(80);
    // room 60: the appropriation choice (prio27appn + FULL FUND, 19), the Go to mark (prio27cycGo + ff, 13) and the record a file
    // save writes (prio27om.base, about 22) fit; the edit (about 280 more) does not. This browser's writer key is stored already.
    const full = async () => {
      const B = await w3sFresh();
      B.ev(`writerKey(); localStorage.removeItem('prio27appn'); localStorage.removeItem('prio27cycGo'); ${w3sQuota(60)}; S.notes=S.notes||{}; S.notes.A=${J(NOTE)}; save(); 'ok'`);
      return B;
    };
    { const C = await w3sFresh();
      chk(name, 'leaving (a CONTROL)', 'a board with nothing on screen only lets the page be left without asking', J([w3sMem(C), w3sLeave(C)]), J(['false', 'false'])); }
    const A = await full();
    // (a) counted, in lsSet's words
    chk(name, 'counted', 'the refused edit is counted once, as “O&M board data”, and Save diagnostics says so',
      J([A.ev('String(_persistFail)'), w3sRefused(A), (A.ev('diagReport()').match(/Writes refused:.*$/m) || [''])[0]]),
      J(['true', ['O&M board data — QuotaExceededError'], 'Writes refused:     1 this session']));
    chk(name, 'counted', 'the change is on screen only, and the message says what follows',
      J([w3sMem(A), /Until it is saved, closing or reloading this page asks first, and switching appropriation waits\.$/.test(w3sStat(A))]), J(['true', true]));
    // (b) leaving asks
    chk(name, 'leaving', 'closing or reloading the page asks first (beforeunload is cancelled)', w3sLeave(A), 'true');
    // (c) switching appropriation, from the box
    { const n0 = w3sNav(A), v = w3sPick(A, 'FULL FUND');
      chk(name, 'switching', 'switching from the box reopens nothing, and the box reads O&M again', J([w3sNav(A) - n0, v]), J([0, 'O&M']));
      chk(name, 'switching', 'it says why, naming Save', /^⛔ Not switched\. Your latest changes are on screen only: browser storage refused them, so no saved copy holds them, and switching appropriation reopens the page, which would lose them\. 💾 Save writes them into the board file, then try again\.$/.test(w3sStat(A)), true);
      chk(name, 'switching', 'the edit is still on screen, and the choice was never written', J([A.ev('S.notes.A'), A.ev(`localStorage.getItem('prio27appn')`)]), J([NOTE, null])); }
    // (d) Go to under PPBE cycles
    { const n0 = w3sNav(A); A.ev(`cycGoAppn('ff'); 'ok'`);
      chk(name, 'Go to', 'Go to Full Fund reopens nothing, leaves no mark to open PPBE cycles later, and says why',
        J([w3sNav(A) - n0, A.ev(`localStorage.getItem('prio27cycGo')`), /^⛔ Not opened\. Your latest changes are on screen only.*opening Full Fund reopens the page/.test(w3sStat(A))]), J([0, null, true])); }
    // (k1)-(k3) the imports that reopen the page: refused before their own questions, storage untouched
    const other = await w3sFresh();
    other.ev(`S.titles=S.titles||{}; S.titles.A='ANOTHER BOARD'; save(); 'ok'`);
    const otherHtml = other.ev('buildSavedHtml()');
    const otherPub = JSON.parse(otherHtml.match(/id="pubState">([\s\S]*?)<\/script>/)[1]);
    A.ev(`window.__cq=[]; window.confirm=function(q){ window.__cq.push(String(q)); return true; }; window.__pq=0; window.prompt=function(){ window.__pq++; return null; };
      window.__al=[]; window.alert=function(m){ window.__al.push(String(m)); }; 'ok'`);
    const ls0 = w3sLs(A);
    { const n0 = w3sNav(A); const r = A.ev(`String(fullImportText(${J(otherHtml)}, 'another.html'))`);
      chk(name, 'a full import', 'refused: false, nothing asked, nothing reopened, storage byte-identical',
        J([r, A.ev('window.__cq.length+window.__pq+window.__al.length'), w3sNav(A) - n0, w3sLs(A) === ls0]), J(['false', 0, 0, true]));
      chk(name, 'a full import', 'it says why', /^⛔ Not imported\. Your latest changes are on screen only.*a full import reopens the page/.test(w3sStat(A)), true); }
    { const n0 = w3sNav(A);
      A.ev(`consTakePick(${J({ appns: { ff: otherPub.appns.om } })}, ${J(otherHtml)}, 'x.html'); 'ok'`);
      chk(name, 'Import one appropriation', 'refused before it asks which to take: nothing asked, nothing reopened, storage byte-identical',
        J([A.ev('window.__cq.length+window.__pq+window.__al.length'), w3sNav(A) - n0, w3sLs(A) === ls0,
          /^⛔ Not imported\. .*taking an appropriation from a file reopens the page/.test(w3sStat(A))]), J([0, 0, true, true])); }
    // (k3) a JSON state file through importState (C30b): it meets importState's own guard whatever routes a board .html
    { const stateTxt = J({ base: 2027, cur: 2027, ts: 1790000000000, years: { 2027: { order: ['A', 'B'], notes: { A: 'from the state file' } } } });
      const n0 = w3sNav(A);
      await A.ev(`new Promise(function(res){ var inp={files:[new File([${J(stateTxt)}], 'state.json')], value:'x'};
        try{ importState(inp); }catch(e){ window.__al.push('THREW '+e.message); }
        (function wait(n){ if(inp.value==='' || n>400) return res('ok'); setTimeout(function(){ wait(n+1); }, 5); })(0); })`);
      chk(name, 'a state file', 'refused before its own question: nothing asked, nothing reopened, storage byte-identical, the edit still there',
        J([A.ev('window.__cq.length+window.__pq+window.__al.length'), w3sNav(A) - n0, w3sLs(A) === ls0, A.ev('S.notes.A'),
          /^⛔ Not imported\. .*loading this file reopens the page/.test(w3sStat(A))]), J([0, 0, true, NOTE, true])); }
    // (e) after a downloaded copy: one question instead of a refusal (where a download is the only Save)
    { const D = await full();
      D.ev(`publishState(); window.__cq=[]; window.confirm=function(q){ window.__cq.push(String(q)); return false; }; 'ok'`);
      const n0 = w3sNav(D), v = w3sPick(D, 'FULL FUND'), qs = JSON.parse(D.ev('JSON.stringify(window.__cq)'));
      chk(name, 'after a downloaded copy', 'switching asks once, naming the downloaded copy as the only one holding the changes',
        J([D.ev('String(_dlOnly)'), qs.length, /^Your latest changes are in the copy you downloaded, but not in the board file, and browser storage could not keep them\.\n\nSwitching appropriation reopens the page: afterwards only the downloaded copy holds them\./.test(qs[0] || '')]),
        J(['true', 1, true]));
      chk(name, 'after a downloaded copy', 'Cancel: nothing reopened, the box on O&M again, and “nothing changed”',
        J([w3sNav(D) - n0, v, /Not switched — nothing changed\./.test(w3sStat(D))]), J([0, 'O&M', true]));
      const E = await full();
      E.ev(`publishState(); window.__cq=[]; window.confirm=function(q){ window.__cq.push(String(q)); return true; }; 'ok'`);
      const n1 = w3sNav(E); w3sPick(E, 'FULL FUND');
      chk(name, 'after a downloaded copy', 'OK, on a fresh board in the same state: it goes on, and reopens', J([E.ev('window.__cq.length'), w3sNav(E) - n1 > 0]), J([1, true])); }
    // (f) a file save ends it
    { const F = await full();
      F.ev(`window.confirm=function(){ return true; }; ${W3S_FH} 'ok'`);
      await F.ev('saveInPlaceFile()');
      chk(name, 'a file save', 'the board file is written, nothing is on screen only, and leaving asks nothing',
        J([F.ev('window.__fw.writes'), w3sMem(F), w3sLeave(F)]), J([1, 'false', 'false']));
      const n0 = w3sNav(F); w3sPick(F, 'FULL FUND');
      chk(name, 'a file save', 'and switching appropriation then reopens the page', w3sNav(F) - n0 > 0, true); }
    // (g1), (g2): a list refused while the board opened is not on screen only (the file holds it); one refused after it is
    { const G = await w3sFresh();
      G.ev(`_lsRefused[DEST_KEY]=_sideBootGen; 'ok'`);
      chk(name, 'a list refused while opening', 'is not on screen only, and leaving asks nothing', J([w3sMem(G), w3sLeave(G)]), J(['false', 'false']));
      G.ev(`delete _lsRefused[DEST_KEY]; ${w3sQuota(30)}; ACEDB.sets=ACEDB.sets||{}; ACEDB.sets['ACE-W3']={fp:'w3', lines:[${J('y'.repeat(200))}]}; persistAce(); 'ok'`);
      chk(name, 'a list refused after opening', 'the cost estimates refused after the board opened are on screen only, and leaving asks',
        J([w3sMem(G), w3sLeave(G)]), J(['true', 'true']));
      // (i) Clear this computer with that list on screen only
      G.ev(`window.__cq=[]; window.confirm=function(q){ window.__cq.push(String(q)); return true; }; clearComputer(); 'ok'`);
      const q0 = JSON.parse(G.ev('JSON.stringify(window.__cq)'))[0] || '';
      chk(name, 'Clear this computer', 'its question says the changes are on screen only, held by neither this browser nor the file',
        /⚠ This board has changes ON SCREEN ONLY: browser storage refused them, so neither this browser nor the file holds them\. They will be lost\./.test(q0), true);
      chk(name, 'Clear this computer', 'and the reopening it asked about does not meet the browser’s own question too', w3sLeave(G), 'false'); }
    // (l) the file route holding the only copy of something (impFileHolds, W2's; stood in here) asks too, and a deliberate reopening does not
    { const L = await w3sFresh();
      L.ev(`window.__ifh=impFileHolds; impFileHolds=function(){ return true; }; 'ok'`);
      chk(name, 'the file route holds a copy', 'with nothing on screen only, leaving asks while the file route holds the only copy of something',
        J([w3sMem(L), w3sLeave(L)]), J(['false', 'true']));
      L.ev(`_leaving=true; 'ok'`);
      chk(name, 'the file route holds a copy', 'a deliberate reopening does not', w3sLeave(L), 'false');
      L.ev(`impFileHolds=window.__ifh; _leaving=false; 'ok'`);
      chk(name, 'the file route holds a copy (a CONTROL)', 'once it holds nothing, leaving asks nothing', w3sLeave(L), 'false'); }
    chk(name, 'errors', 'no page error but the reloads jsdom does not carry out', J(A.errors.filter(e => !/navigation/i.test(e)).slice(0, 2)), '[]');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
}
{
  const name = 'v2.14 W3 — storage full: the writer key and the editor name are kept for the page (item 141 F)';
  try {
    const J = JSON.stringify;
    // storage refusing everything new (room 0), no writer key and no name stored yet
    const B = await w3sFresh();
    B.ev(`localStorage.removeItem('prio27writerKey'); localStorage.removeItem('prio27who'); window.confirm=function(){ return true; };
      window.__asked=0; window.prompt=function(){ window.__asked++; return 'BL'; }; ${W3S_FH} ${w3sQuota(0)}; 'ok'`);
    // (a) the writer key
    const keys = JSON.parse(B.ev(`JSON.stringify((function(){ var o=[]; for(var i=0;i<10;i++) o.push(writerKey()); return o; })())`));
    chk(name, 'the writer key', 'ten calls give one key, and one fingerprint', J([new Set(keys).size, /^[0-9a-f]{32}$/.test(keys[0]), B.ev('String(writerFp()===writerFp())')]), J([1, true, 'true']));
    chk(name, 'the writer key', 'it is not in storage, and its refusal is counted once', J([B.ev(`localStorage.getItem('prio27writerKey')`), w3sRefused(B)]),
      J([null, ['This browser’s writer key — QuotaExceededError']]));
    // (b), (c) two Saves after two edits
    B.ev(`S.notes.A='first'; save(); 'ok'`); await B.ev('saveInPlaceFile()'); const s1 = w3sStat(B);
    B.ev(`S.notes.A='second'; save(); 'ok'`); await B.ev('saveInPlaceFile()'); const s2 = w3sStat(B);
    chk(name, 'two Saves', 'both are written, the second by BL, and the pen is this browser’s own', J([B.ev('window.__fw.writes'), /^💾 Saved in place by BL/.test(s2), B.ev('uiPenOther()')]), J([2, true, '']));
    chk(name, 'two Saves', 'the first, which claimed the pen, says storage would not keep the writer key and what follows; the second does not',
      J([/You are now this board’s writer: only you save it in place\. Browser storage would not keep this browser’s writer key: once this page is closed, 💾 Save here will refuse and name you as the writer — Audit › Take the pen… then takes it back\./.test(s1),
        /would not keep this browser’s writer key/.test(s2)]), J([true, false]));
    // (d) the editor name, asked once
    { const D = await w3sFresh();
      D.ev(`localStorage.removeItem('prio27who'); window.__asked=0; window.prompt=function(){ window.__asked++; return 'BL'; }; ${w3sQuota(0)}; 'ok'`);
      D.ev(`for(var i=0;i<3;i++){ S.notes.B='n'+i; save(); } 'ok'`);
      chk(name, 'the editor name', 'three edits ask the name once, and the board is stamped BL', J([D.ev('window.__asked'), D.ev('MS.by'), D.ev('whoIs()'), D.ev(`localStorage.getItem('prio27who')`)]), J([1, 'BL', 'BL', null]));
      chk(name, 'the editor name', 'its refusal is counted', w3sRefused(D).filter(s => /^Your editor name — /.test(s)).length, 1); }
    // (d2) a name typed when storage will not keep it wins over the one stored (longer than it, so it cannot replace it in place)
    { const E = await w3sFresh();
      E.ev(`localStorage.setItem('prio27who', 'Ann'); window.prompt=function(){ return 'Roberta'; }; ${w3sQuota(0)}; whoAmI(true); 'ok'`);
      chk(name, 'the editor name', 'it says the page remembers it until it is closed', /Editor name set to Roberta — stamped on future saves\. Browser storage would not keep it, so this page remembers it until it is closed, and asks again next time\.$/.test(w3sStat(E)), true);
      E.ev(`S.notes.B='after'; save(); 'ok'`);
      chk(name, 'the editor name', '“Roberta”, typed, stamps the next save, not the “Ann” storage still holds', J([E.ev('MS.by'), E.ev('whoIs()'), E.ev(`localStorage.getItem('prio27who')`)]), J(['Roberta', 'Roberta', 'Ann'])); }
    // (e) CONTROL: storage accepting
    { const C = await w3sFresh();
      C.ev(`localStorage.removeItem('prio27writerKey'); localStorage.removeItem('prio27who'); window.confirm=function(){ return true; }; window.prompt=function(){ return 'BL'; }; ${W3S_FH} 'ok'`);
      C.ev(`S.notes.A='x'; save(); 'ok'`); await C.ev('saveInPlaceFile()');
      chk(name, 'storage accepting (a CONTROL)', 'both are stored, nothing is kept for the page alone, and nothing says storage would not keep them',
        J([/^[0-9a-f]{32}$/.test(C.ev(`localStorage.getItem('prio27writerKey')||''`)), C.ev(`localStorage.getItem('prio27who')`), C.ev('_wkMem'), C.ev('_whoMem'), /would not keep/.test(w3sStat(C)), C.ev('window.__fw.writes')]),
        J([true, 'BL', '', '', false, 1])); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
}
{
  const name = 'v2.14 W3 — storage full: switching appropriation never reopens the page after a refused write (item 141 F)';
  try {
    const J = JSON.stringify;
    // a clean board, storage full to the last character, no appropriation choice stored
    const B = await w3sFresh();
    B.ev(`localStorage.removeItem('prio27appn'); ${w3sQuota(0)}; 'ok'`);
    chk(name, 'the fixture', 'nothing is on screen only (a CONTROL)', w3sMem(B), 'false');
    { const n0 = w3sNav(B), v = w3sPick(B, 'FULL FUND');
      chk(name, 'switching', 'the choice is refused: nothing reopened, and the box reads O&M again', J([w3sNav(B) - n0, v]), J([0, 'O&M']));
      chk(name, 'switching', 'it says why, and what to do', /^⛔ Not switched\. Browser storage is full, so this browser cannot note which appropriation to open, and the page would reopen on O&M again\. Nothing changed\. Setup › Save diagnostics… shows what fills it; Setup › Clear this computer… frees what ORBIT keeps there, after asking \(the board file is not touched\)\.$/.test(w3sStat(B)), true);
      chk(name, 'switching', 'and the refusal is counted', J(w3sRefused(B)), J(['Which appropriation this browser opens — QuotaExceededError'])); }
    // room for the Go to mark (13), not for the choice (19): the mark is taken back
    { const C = await w3sFresh();
      C.ev(`localStorage.removeItem('prio27appn'); localStorage.removeItem('prio27cycGo'); ${w3sQuota(15)}; 'ok'`);
      const n0 = w3sNav(C); C.ev(`cycGoAppn('ff'); 'ok'`);
      chk(name, 'Go to', 'room for the mark and not the choice: nothing reopened, and no mark left behind to open PPBE cycles unasked',
        J([w3sNav(C) - n0, C.ev(`localStorage.getItem('prio27cycGo')`), /^⛔ Not switched\. Browser storage is full/.test(w3sStat(C))]), J([0, null, true])); }
    // CONTROL: a choice of the same length replaces the stored one in place, so a full browser still switches
    { const K = await w3sFresh();
      K.ev(`localStorage.setItem('prio27appn', 'O&M'); ${w3sQuota(0)}; 'ok'`);
      const n0 = w3sNav(K); w3sPick(K, 'OPN');
      chk(name, 'a choice of the same length (a CONTROL)', 'O&M to OPN fits where O&M was, and reopens', J([w3sNav(K) - n0 > 0, K.ev(`localStorage.getItem('prio27appn')`)]), J([true, 'OPN'])); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
}
// ==== end v2.14 W3 ====

// ==== v2.14 W4 (items 129, 124; ledger U63, U64, U35): the held findings ====
// v2.14 W4 (item 124): PUT BACK FINDS AN ADDED REQUIREMENT BY ITS ID. The journal filed a year's added requirements by their place
// in S.custom (['custom', 1, 'ask', 0]): delete one above and Put back wrote the value onto the requirement that moved into that
// place; Put back of a requirement that was gone threw inside applyState and left an element with no id, which the next save stored.
// FAILS ON THE SLOT COMMIT (v2.13): (a) the line is ['custom',1,'ask',0]; (b) NEW-3 becomes 200; (c) it throws and leaves {ask,fy26};
// (d) the add is offered at ['custom',0]; (e) the planted line is offered; (g) the label names no plan event; (h) is offered.
await (async () => {
  const name = 'v2.14 W4 — Put back finds an added requirement by its id, and refuses once it is gone (item 124)';
  try {
    const J = JSON.stringify;
    const mk = (id, ask) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Req ' + id, event: 'E' + id, ccar: '', fy26: [0, 0, 0], ask, alloc: null });
    const board = () => {
      const B = boot();
      seed(B.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [mk('A', [900, 200, 100])], disc: [2000, 600, 300], mand: [500, 150, 80], order: ['A'] });
      B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save();
        localStorage.setItem('prio27who','Pat'); window.__cf=0; window.confirm=function(){ window.__cf++; return true; }; window.alert=function(){};
        window.__rn=Date.now; window.__tk=0; Date.now=function(){ return window.__rn.call(Date)+window.__tk; }; 'ok'`);
      return B;
    };
    // a minute later, so each edit is its own line (JRNL_JOIN), as the U19 parts do
    const later = B => B.ev(`window.__tk+=61000; 'ok'`);
    const lines = B => JSON.parse(B.ev(`JSON.stringify((MS.jrnl||[]).map(function(e,i){ return {i:i, p:e.p, a:e.a, b:e.b}; }))`));
    const asks = B => B.ev(`JSON.stringify(S.custom.map(function(c){ return [c && c.id || null, ((c && c.ask)||[])[0]]; }))`);
    const B = board();
    const ids = JSON.parse(B.ev(`(function(){ var a=reqCreate('AV', {title:'X', event:'EX', ask:[100,0,0]}); var b=reqCreate('AV', {title:'Y', event:'EY', ask:[200,0,0]});
      var c=reqCreate('AV', {title:'Z', event:'EZ', ask:[300,0,0]}); save(); render(); return JSON.stringify([a,b,c]); })()`));
    const [X, Y, Z] = ids;
    chk(name, 'fixture', 'three added requirements, X above Y above Z', J(ids), J(['NEW-1', 'NEW-2', 'NEW-3']));
    // (a) a field edit is journalled by the requirement's id
    later(B); B.ev(`setAsk(${J(Y)}, 0, '250'); 'ok'`);
    const ya = lines(B).filter(e => e.p[0] === 'custom' && e.b === 250).pop() || { i: -1, p: [] };
    chk(name, '(a) by id', 'Y’s value, 200 → 250, is journalled at [custom, Y, ask, 0]', J(ya.p) + ' ' + J([ya.a, ya.b]), J(['custom', Y, 'ask', 0]) + ' ' + J([200, 250]));
    // (g) its label names the requirement by its plan event
    chk(name, '(g) label', 'its journal label names Y (its plan event)', /EY/.test(B.ev(`diagPlain(jrnlLabel(MS.jrnl[${ya.i}]))`)), true);
    // (b) X, above Y, is removed; Put back of Y's line lands on Y
    later(B); B.ev(`removeReq(${J(X)}); 'ok'`);
    later(B); try { B.ev(`jrnlUndo(${ya.i}); 'ok'`); } catch (e) {}
    chk(name, '(b) after a delete above', 'Put back writes Y’s 200 back on Y, and Z keeps its 300', asks(B), J([[Y, 200], [Z, 300]]));
    // (d) the add and the remove of X are one line each, at [custom, X], neither offered
    const xl = lines(B).filter(e => e.p[0] === 'custom' && e.p[1] === X);
    chk(name, '(d) whole lines', 'X’s add and its removal are one line each at [custom, X], neither put back',
      J(xl.map(e => [e.p.length, e.a === null || e.a === undefined, e.b === null || e.b === undefined, B.ev(`String(jrnlUndoable(MS.jrnl[${e.i}]))`)])),
      J([[2, true, false, 'false'], [2, false, true, 'false']]));
    chk(name, '(d) whole lines', 'no line is filed by a place in the added list',
      J(lines(B).filter(e => e.p[0] === 'custom' && typeof e.p[1] === 'number').length), '0');
    // (c) Z's value changed, then Z removed: Put back asks nothing, changes nothing, and says so
    later(B); B.ev(`setAsk(${J(Z)}, 0, '333'); 'ok'`);
    const zl = lines(B).filter(e => e.p[0] === 'custom' && e.b === 333).pop() || { i: -1 };
    later(B); B.ev(`removeReq(${J(Z)}); 'ok'`);
    const cf0 = +B.ev('window.__cf'), before = B.ev(`JSON.stringify(MS.years[MS.cur].custom)`);
    let threw = '';
    later(B); try { B.ev(`jrnlUndo(${zl.i}); 'ok'`); } catch (e) { threw = String(e.message || e).slice(0, 80); }
    chk(name, '(c) gone', 'Put back of the removed Z’s value throws nothing, asks nothing and changes nothing',
      J([threw, +B.ev('window.__cf') - cf0, B.ev(`JSON.stringify(MS.years[MS.cur].custom)`) === before]), J(['', 0, true]));
    chk(name, '(c) gone', 'and says so',
      /Not put back.*that added requirement is no longer in FY27\. Nothing was changed\./.test(B.ev(`(document.getElementById('shareStat')||{}).textContent`)), true);
    chk(name, '(c) gone', 'every added requirement still has a text id', B.ev(`String(S.custom.every(function(c){ return c && typeof c.id==='string' && c.id; }))`), 'true');
    // jrnlSet itself refuses: a direct call makes no element with no id
    chk(name, '(c) gone', 'jrnlSet refuses a path naming an added requirement that is gone, writing nothing',
      B.ev(`(function(){ var b=JSON.stringify(MS.years[MS.cur].custom); var r=jrnlSet(MS.cur, ['custom',${J(Z)},'ask',0], 5); return JSON.stringify([r, JSON.stringify(MS.years[MS.cur].custom)===b]); })()`), J([false, true]));
    B.ev(`setNote('A','after'); 'ok'`);
    const R = boot({ ls: JSON.parse(B.ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`)) });
    chk(name, '(c) gone', 'reopened from storage: every id in the order is a requirement, and no page error',
      J([R.ev(`String(S.order.every(function(id){ return !!itemById(id); }))`), R.errors.length]), J(['true', 0]));
    // (e) a line filed by place before v2.14 is not offered
    later(B); B.ev(`MS.jrnl.push({t:Date.now(), by:'Old', fy:MS.cur, p:['custom',0,'ask',0], a:1, b:2}); 'ok'`);
    const pl = lines(B).length - 1;
    chk(name, '(e) by place', 'a line filed by place (v2.13’s shape) is not offered for Put back', B.ev(`String(jrnlUndoable(MS.jrnl[${pl}]))`), 'false');
    // the journal panel's last cell says why, each kind with its own title
    B.ev(`jrnlOpen=true; render(); jrnlBody(); 'ok'`);
    const cells = JSON.parse(B.ev(`JSON.stringify([].filter.call(document.querySelectorAll('#jrnlBody span.hint'), function(s){ return s.textContent==='not put back here'; }).map(function(s){ return s.getAttribute('title'); }))`));
    const whole = lines(B).filter(e => e.p[0] === 'custom' && e.p.length === 2 && typeof e.p[1] === 'string').length;
    chk(name, '(d) the panel', 'each whole added-requirement line reads “not put back here”, with why on hover',
      J(cells.filter(t => /^An added requirement as a whole — added or removed — is not put back from the change journal\. To take one out, use Remove on its row’s ⋯ menu; to bring one back, put back an earlier saved copy from History & recovery\.$/.test(t)).length), J(whole));
    chk(name, '(e) the panel', 'and the line filed by place reads it too, with its own reason',
      J(cells.filter(t => /^Recorded before v2\.14 by its place in the list of added requirements\. Put back now, it could land on another requirement, so it is not offered\.$/.test(t)).length), '1');
    B.ev(`jrnlOpen=false; render(); 'ok'`);
    // (f) CONTROL: a description and a renamed plan event are put back as before
    later(B); B.ev(`setDesc('A','D1'); 'ok'`); later(B); B.ev(`setDesc('A','D2'); 'ok'`);
    const dl = lines(B).filter(e => J(e.p) === J(['desc', 'A']) && e.b === 'D2').pop() || { i: -1 };
    later(B); B.ev(`jrnlUndo(${dl.i}); 'ok'`);
    later(B); B.ev(`reqApply(${J(Y)}, {titles:'Renamed Y'}); 'ok'`);
    const tl = lines(B).filter(e => J(e.p) === J(['titles', Y]) && e.b === 'Renamed Y').pop() || { i: -1 };
    later(B); B.ev(`jrnlUndo(${tl.i}); 'ok'`);
    chk(name, '(f) CONTROL', 'a description and a renamed plan event are put back as before',
      B.ev(`JSON.stringify([S.desc.A, (S.titles||{})[${J(Y)}]||null])`), J(['D1', null]));
    // (h) a year whose added requirements repeat an id is journalled by place, and those lines are not offered
    const D = board();
    D.ev(`reqCreate('AV', {title:'P', event:'EP', ask:[10,0,0]}); save(); var c=JSON.parse(JSON.stringify(S.custom[0])); c.title='Q'; S.custom.push(c); save(); 'ok'`);
    later(D); D.ev(`S.custom[1].ask[0]=11; save(); 'ok'`);
    const dup = lines(D).filter(e => e.p[0] === 'custom' && e.b === 11).pop() || { i: -1, p: [] };
    chk(name, '(h) ids repeat', 'a year whose added requirements repeat an id is journalled by place, and the line is not offered',
      J(dup.p) + ' ' + D.ev(`String(jrnlUndoable(MS.jrnl[${dup.i}]))`), J(['custom', 1, 'ask', 0]) + ' false');
    chk(name, 'errors', 'no page error', J([B.errors.length, D.errors.length]), J([0, 0]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
})();
// v2.14 W4 (ledger U35): THE RCN / EEIC LIST KEEPS WHAT IS TYPED ACROSS A REDRAW, BY ITS ROW. Every redraw (a Live tick, a status
// line, a load) rebuilt the rows from the stored list: 88888 typed and not yet left read 11111 again, Esc no longer asked, and after
// a load that added a row above the typing was gone. FAILS ON THE SLOT COMMIT (v2.13): (1) the field reads 11111; (2) there is no
// rcnDraw to wrap; (3) dlgDirty is false; (4) nothing is put back; (6) the same for EEIC and the title; (7) nothing is said.
await (async () => {
  const name = 'v2.14 W4 — the RCN / EEIC list keeps what is typed across a redraw, by its row (ledger U35)';
  try {
    const J = JSON.stringify;
    const mk = (id, ask) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Rec ' + id, event: 'EV-' + id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
    const RCN0 = [{ k: 'rA', rcn: '11111', eeic: 'AAAAA', t: 'ORIGINAL TITLE', svc: ['USAF', 'ANG', 'AFRC'] }, { k: 'rB', rcn: '22222', eeic: 'BBBBB', t: 'SECOND', svc: ['USAF'] }];
    const board = () => {
      const B = boot();
      seed(B.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [mk('A', [100, 20, 10])], disc: [1000, 100, 100], mand: [100, 10, 10], order: ['A'] });
      B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S);
        MS.rcn=${J(RCN0)}; save(); window.confirm=function(){ return true; }; window.alert=function(){}; rcnOpen=true; render(); dlgSync(); 'ok'`);
      return B;
    };
    const F = ['rcn', 'eeic', 't'];
    const typeIn = (B, row, f, v) => B.ev(`(function(){ var r=document.querySelectorAll('#rcnBody tr')[${row}+1]; var i=r.querySelectorAll('input.btn')[${f}];
      i.focus(); i.value=${J(v)}; i.dispatchEvent(new Event('input', {bubbles:true})); return 'ok'; })()`);
    const fieldOf = (B, row, f) => JSON.parse(B.ev(`(function(){ var r=document.querySelectorAll('#rcnBody tr')[${row}+1]; if(!r) return 'null'; var i=r.querySelectorAll('input.btn')[${f}];
      return JSON.stringify([i.value, document.activeElement===i, !!i.__pend]); })()`));
    const dirty = B => B.ev(`(function(){ dlgSync(); var t=DLG.stack[DLG.stack.length-1]; return String(!!t && dlgDirty(t)); })()`);
    const stored = B => B.ev(`JSON.stringify(MS.rcn.map(function(e){ return [e.k, e.rcn, e.eeic, e.t]; }))`);
    const leave = B => B.ev(`(function(){ var a=document.activeElement; if(a && a.blur) a.blur(); return 'ok'; })()`);
    // (1)-(5), and (6) the same for the EEIC and the title
    [['RCN', 0, '88888'], ['EEIC', 1, 'QQQQQ'], ['title', 2, 'HELD NEW TITLE']].forEach(function ([lbl, f, v]) {
      const B = board();
      typeIn(B, 0, f, v);
      B.ev(`render(); render(); 'ok'`);
      chk(name, '(1) ' + lbl, 'typed and not left, then two redraws: the field still reads it, has the keyboard and is still pending; the list is unchanged',
        J(fieldOf(B, 0, f)) + ' ' + J(JSON.parse(stored(B))[0][f + 1]), J([v, true, true]) + ' ' + J(RCN0[0][F[f]]));
      chk(name, '(3) ' + lbl, 'and Esc still asks (the box reads it as typing not yet committed)', dirty(B), 'true');
      // (4) a load that adds a row above: the typing follows its row, now second
      B.ev(`(function(){ var st=JSON.parse(JSON.stringify(MS)); st.rcn.unshift({k:'rZ', rcn:'99999', eeic:'ZZZZZ', t:'ADDED ABOVE', svc:['USAF']}); st.ts=Date.now()+5; applyStore(st); render(); return 'ok'; })()`);
      chk(name, '(4) ' + lbl, 'a load adds a row above: the typing is on its own row, now second, and the new row reads its own',
        J([fieldOf(B, 1, f), fieldOf(B, 0, f)[0]]), J([[v, true, true], ['99999', 'ZZZZZ', 'ADDED ABOVE'][f]]));
      // (5) leaving the field commits it to its row, and to no other
      leave(B);
      const want = [['rZ', '99999', 'ZZZZZ', 'ADDED ABOVE'], ['rA', '11111', 'AAAAA', 'ORIGINAL TITLE'], ['rB', '22222', 'BBBBB', 'SECOND']];
      want[1][f + 1] = v;
      chk(name, '(5) ' + lbl, 'leaving the field commits it to rA; rZ and rB are unchanged', stored(B), J(want));
      chk(name, 'errors · ' + lbl, 'no page error', String(B.errors.length), '0');
    });
    // (2) a draw that fires change on the old field first, as Chromium does when innerHTML removes a focused field: nothing committed
    {
      const B = board();
      typeIn(B, 0, 0, '88888');
      const has = B.ev(`String(typeof rcnDraw==='function')`);
      chk(name, '(2) change in the draw', 'the list is drawn by rcnDraw, under the hold', has, 'true');
      if (has === 'true') {
        B.ev(`window.__rd=rcnDraw; rcnDraw=function(el){ var a=document.activeElement; if(a && el && el.contains(a)) a.dispatchEvent(new Event('change', {bubbles:true})); return window.__rd.apply(this, arguments); }; render(); rcnDraw=window.__rd; 'ok'`);
        chk(name, '(2) change in the draw', 'a change fired on the old field during the draw commits nothing, and the typing is held',
          J(JSON.parse(stored(B))[0][1]) + ' ' + J(fieldOf(B, 0, 0)), J('11111') + ' ' + J(['88888', true, true]));
      }
    }
    // (7) a load that removes the row: the typing is put on no other row, nothing changes, and the board says so
    {
      const B = board();
      typeIn(B, 0, 0, '88888');
      B.ev(`(function(){ var st=JSON.parse(JSON.stringify(MS)); st.rcn.shift(); st.ts=Date.now()+5; applyStore(st); render(); return 'ok'; })()`);
      chk(name, '(7) row gone', 'no row holds the typing, and the list is the copy loaded',
        J([B.ev(`String([].some.call(document.querySelectorAll('#rcnBody input'), function(i){ return i.value==='88888'; }))`), stored(B)]),
        J(['false', J([['rB', '22222', 'BBBBB', 'SECOND']])]));
      chk(name, '(7) row gone', 'and the board says what was not kept, and why',
        B.ev(`(document.getElementById('shareStat')||{}).textContent`).indexOf('⚠ What you were typing in the RCN / EEIC list (“88888”) was not kept: the row it was in is no longer on the list. Nothing was changed.') >= 0, true);
    }
    // (8) CONTROL: a value committed shows the stored text after a redraw, and nothing is held
    {
      const B = board();
      typeIn(B, 0, 0, '77777');
      B.ev(`(function(){ var i=document.activeElement; i.dispatchEvent(new Event('change', {bubbles:true})); i.blur(); render(); return 'ok'; })()`);
      chk(name, '(8) CONTROL', 'committed: the list holds it and the redraw shows it, not pending', J(JSON.parse(stored(B))[0][1]) + ' ' + J([fieldOf(B, 0, 0)[0], fieldOf(B, 0, 0)[2]]), J('77777') + ' ' + J(['77777', false]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
})();
// ==== end v2.14 W4 ====

// ==== v2.14 integration (the lead) ====
// ---- INT-A (INT-4) ----
// v2.14 INT-4 (item 141 C, F): A TAB HELD BY THE HAND-OVER HAS ITS CHANGE ON SCREEN ONLY, AND LEAVING IT ASKS -- W2's hold with W3's
// prompt. While an import's new file has not been opened in this browser, W2's hold keeps a held page from writing the plan or a list
// the import cleared back into browser storage (persist sets _persistFail; lsSet counts the list refused), so an older copy cannot
// stand in front of the new file. The change is then on screen only: W3's memOnlyNow must read it so, so the browser asks before the
// tab is closed and nothing in ORBIT reopens it unasked -- or a held tab closed in the ordinary way loses its edit. 💾 Save into the
// tab's own file ends it, and lifting the hold by hand lets storage take the next change. The note is the one another tab's file
// route wrote, stated here from the fixture's literals (W2_KEYS' nine lists, W2_SAY's names): a note in storage is data this page
// reads. Measured on the slot commit (v2.13, the stubs inert): the edit went into browser storage and leaving asked nothing.
const INT4_NOTE = { n: 'int4-0001', how: 'file', name: 'big-board (ORBIT v2.14).html', from: 'big-board.html', at: 1790000000000,
  href: 'https://example.invalid/elsewhere/board.html', h: {},
  keys: ['prio27om', 'prio27ff', 'prio27om-cyc', 'prio27ff-cyc', 'prio27buddb', 'prio27execdb', 'prio27acedb', 'prio27reprog', 'prio27destdb'],
  says: ['the O&M plan', 'the Full Fund plan', 'the locked cycles for O&M', 'the locked cycles for Full Fund', 'the BAE list',
    'the execution data', 'the cost estimates', 'the reprogramming log', 'the destination list'] };
await (async () => {
  const name = 'v2.14 INT — a tab held by the hand-over has its change on screen only, and leaving it asks (item 141 C, F)';
  try {
    const J = JSON.stringify;
    const NOTE = J(INT4_NOTE);
    const stored = (B, k) => B.ev(`localStorage.getItem(${J(k)})||''`);
    const held = B => B.ev(`JSON.stringify(DIAG.refused.filter(function(r){ return r.why==='HandOverHold'; }).map(function(r){ return r.what; }))`);
    // CONTROL: no note in this browser. A change is kept in browser storage, nothing is on screen only, leaving asks nothing.
    { const C = await w3sFresh();
      C.ev(`S.notes.A='KEPT IN STORAGE'; save(); 'ok'`);
      chk(name, 'no note (a CONTROL)', 'a change is kept in browser storage: nothing on screen only, and leaving asks nothing',
        J([/KEPT IN STORAGE/.test(stored(C, 'prio27om')), w3sMem(C) === 'true', w3sLeave(C)]), J([true, false, 'false'])); }
    // (a) a tab opened while the note stands: held from its opening
    const H = await w3sFresh({ ls: { prio27impFile: NOTE } });
    const s0 = stored(H, 'prio27om');
    H.ev(`S.notes.A='HELD EDIT'; save(); 'ok'`);
    chk(name, '(a) held', 'the change is on screen and is not written to browser storage; the hold counts it as kept nowhere',
      J([H.ev('S.notes.A'), stored(H, 'prio27om') === s0, /HELD EDIT/.test(stored(H, 'prio27om')), JSON.parse(held(H)).length > 0]), J(['HELD EDIT', true, false, true]));
    chk(name, '(a) held', 'and it is on screen only, so closing the tab asks first', J([w3sMem(H), w3sLeave(H)]), J(['true', 'true']));
    chk(name, '(a) held', 'the message line says the tab is held, and where the board is', /ORBIT wrote the imported board into “big-board \(ORBIT v2\.14\)\.html”[\s\S]*This page stays held until it is closed/.test(w3sStat(H)), true);
    { const n0 = w3sNav(H), v = w3sPick(H, 'FULL FUND');
      chk(name, '(a) held', 'switching appropriation reopens nothing over it: the box reads O&M again, and it says why, naming Save',
        J([w3sNav(H) - n0, v, /^⛔ Not switched\. Your latest changes are on screen only/.test(w3sStat(H)), H.ev('S.notes.A')]), J([0, 'O&M', true, 'HELD EDIT'])); }
    // (b) 💾 Save into the tab's own file ends it: the change is in the file, and leaving asks nothing
    H.ev(`window.confirm=function(){ return true; }; ${W3S_FH} 'ok'`);
    await H.ev('saveInPlaceFile()');
    chk(name, '(b) 💾 Save', 'the file is written; nothing is on screen only, and leaving asks nothing', J([H.ev('window.__fw.writes'), /HELD EDIT/.test(H.ev('window.__fw.content')), w3sMem(H), w3sLeave(H)]), J([1, true, 'false', 'false']));
    // (c) a list the import cleared, written after that (the execution data): held too, and on screen only again
    H.ev(`EXDB=Object.assign({}, EXDB, {ts:Date.now(), all:Object.assign({}, EXDB.all||{}, {om:{fy:2027, rows:[['INT4', 5]]}})}); persistExdb(); 'ok'`);
    chk(name, '(c) a list', 'the execution data is held out of browser storage, and leaving asks again', J([/INT4/.test(stored(H, 'prio27execdb')), w3sMem(H), w3sLeave(H)]), J([false, 'true', 'true']));
    // (d) the import's file opened in another tab (the note gone from storage): this tab stays held for its life
    H.ev(`localStorage.removeItem('prio27impFile'); S.notes.A='AFTER THE FILE OPENED'; save(); 'ok'`);
    chk(name, '(d) after the file opened elsewhere', 'this tab stays held: its next change is not in browser storage, and leaving asks',
      J([/AFTER THE FILE OPENED/.test(stored(H, 'prio27om')), w3sMem(H), w3sLeave(H)]), J([false, 'true', 'true']));
    // (e) lifting the hold by hand (asked, OK): browser storage takes the next writes, the list and the change, and leaving asks nothing
    H.ev(`window.confirm=function(){ return true; }; impHandClear(); persistExdb(); S.notes.A='AFTER THE LIFT'; save(); 'ok'`);
    chk(name, '(e) the hold lifted', 'the list and the next change are kept in browser storage: nothing is on screen only, and leaving asks nothing',
      J([/INT4/.test(stored(H, 'prio27execdb')), /AFTER THE LIFT/.test(stored(H, 'prio27om')), w3sMem(H), w3sLeave(H)]), J([true, true, 'false', 'false']));
    // (f) a tab open BEFORE the note was written: held from the moment the browser says another tab wrote it
    const E = await w3sFresh();
    E.ev(`localStorage.setItem('prio27impFile', ${J(NOTE)}); window.dispatchEvent(new StorageEvent('storage', {key:'prio27impFile', newValue:${J(NOTE)}}));
      localStorage.removeItem('prio27impFile'); S.notes.A='IN AN OLDER TAB'; save(); 'ok'`);
    chk(name, '(f) an older tab', 'it is held once the browser says another tab wrote the note: its change is on screen only, and leaving asks',
      J([/IN AN OLDER TAB/.test(stored(E, 'prio27om')), w3sMem(E), w3sLeave(E)]), J([false, 'true', 'true']));
    chk(name, 'errors', 'no page error but the reloads jsdom does not carry out', J([...H.errors, ...E.errors].filter(e => !/navigation/i.test(e)).slice(0, 2)), '[]');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
})();
// ---- end INT-A ----

// ---- INT-B (INT-11) ----
// v2.14 INT (W3's stage 2 finding; recovery/v214/w3-cyc-erase-probe.mjs, made a check): A CHANGE ON SCREEN ONLY KEEPS ITS MARK
// THROUGH A REFUSED CYCLE CHOICE. A package for Full Fund that browser storage refused is in PUBS alone, so leaving the page asks
// (memOnlyNow, memOnlyLeave). "Put every appropriation on PB28", refused at OPN and put back whole, used to delete the refusal of
// every key it had tried to write after lsMarksBack had put the page's marks back -- Full Fund's among them -- so leaving stopped
// asking and the package was lost when the tab closed. Fails on the slot commit (v2.13 had no leave question to keep); fails with
// v214-int-cyc-erases-refusal, which puts the delete back. The package is applied through pkgApply, its own writer, and the cycle is
// chosen from the context bar's rendered list, as a person picks it.
await (async () => {
  const name = 'v2.14 INT — a change refused before “put every appropriation on a cycle” stays on screen only, and leaving still asks (item 141 F)';
  try {
    const J = JSON.stringify;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const T1 = 1790100000000, T0 = 1790000000000;
    const year = (bm) => ({ order: [], alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [], bm });
    // Full Fund on BES28 (positions entered), Initial Spares on PB27, OPN an old single-year plan; this board, O&M, on PB27
    const ffStore = { svc: ['USAF', 'ANG'], ts: T1, base: 2027, cur: 2027, cycle: 'BES|2028', by: 'F Lead',
      ppbe: { 'BES|2028': { v: 2, split: true, lines: {}, val: { USAF: { _all: { 2027: { d: 800, m: 80 } } } } } },
      years: { 2027: year({ disc: [100, 40], mand: [10, 0], adds: [] }) } };
    const spStore = { svc: ['USAF', 'ANG'], ts: T1, base: 2027, cur: 2027, cycle: 'PB|2027', by: 'S Lead', cycleRef: 'PB|2027',
      ppbe: {}, years: { 2027: year({ disc: [100, 40], mand: [10, 0], adds: [] }) } };
    const opnLegacy = { order: ['Z'], alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [], ts: T0 };
    const X = boot({ ls: { prio27ff: J(ffStore), prio27sp: J(spStore), prio27opn: J(opnLegacy) } });
    seed(X.ev, { services: ['USAF', 'ANG'], items: [it('A', 'PSM', [100, 50]), it('B', 'AV', [80, 40])], disc: [150, 60], mand: [20, 10], order: ['A', 'B'] });
    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); MS.svc=SVC.slice(); MS.cycle='PB|2027'; save(); render();
      window.__cq=[]; window.confirm=function(m){ window.__cq.push(String(m)); return true; }; window.alert=function(){}; 'ok'`);
    await sleep(5);
    X.ev(`DIRTY=false; _persistFail=false; render(); 'ok'`);   // the opening's own timers run; the board reads as clean
    const mem = () => X.ev(`typeof memOnlyNow==='function'? String(memOnlyNow()) : 'none'`);
    const refused = () => JSON.parse(X.ev(`JSON.stringify(typeof _lsRefused==='object' && _lsRefused? Object.keys(_lsRefused).sort() : null)`));
    const leave = () => X.ev(`(function(){ var e=new Event('beforeunload', {cancelable:true}); window.dispatchEvent(e); return String(e.defaultPrevented); })()`);
    const ffOf = (code) => { try { const st = JSON.parse(X.ev(code)) || {}; return [st.by || '', (((st.years || {})[2027] || {}).notes || {}).P || '']; } catch (e) { return ['unreadable', '']; } };
    const NOTE = 'from the package -- only on screen';
    // 1. A Full Fund package arrives and browser storage refuses it: pkgApply's own write, then its in-memory slot
    const pkgMs = Object.assign({}, ffStore, { ts: Date.now(), by: 'Pkg', years: { 2027: Object.assign(year({ disc: [100, 40], mand: [10, 0], adds: [] }), { notes: { P: NOTE } }) } });
    X.ev(`window.__setI=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(k==='prio27ff') throw new DOMException('The quota has been exceeded.','QuotaExceededError'); return window.__setI.call(this,k,v); };
      try{ window.__pk=pkgApply({spmtPkg:PKG_VER, ap:'ff', seq:1, by:'Pkg', ts:${Date.now()}, ms:${J(pkgMs)}}, 'Full Fund package.json'); }finally{ Storage.prototype.setItem=window.__setI; } 'ok'`);
    chk(name, '1. the package', 'it is loaded, browser storage still holds the Full Fund it held, and the package is in the board’s copy of Full Fund (a CONTROL)',
      J([X.ev('String(window.__pk)'), ffOf(`localStorage.getItem('prio27ff')`), ffOf('JSON.stringify(PUBS.ff)')]), J(['true', ['F Lead', ''], ['Pkg', NOTE]]));
    chk(name, '1. the package', 'it is on screen only: the refusal is counted against Full Fund, and leaving the page asks',
      J([mem(), refused(), leave()]), J(['true', ['prio27ff'], 'true']));
    // 2. "Put every appropriation on PB28", from the context bar; browser storage refuses OPN, and every key is put back
    // v2.14 RV1-B: refused with a reason other than room. A refusal for room, put back whole, is now carried on this page (the
    // RV1-B block "putting every appropriation on a cycle tags them on this page"); any other refusal is refused as before, and
    // this check keeps its point -- the mark the page held before survives the put-back -- with one.
    const ls0 = X.ev(`JSON.stringify((function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return o; })())`);
    X.ev(`Storage.prototype.setItem=function(k,v){ if(k==='prio27opn') throw new DOMException('The operation is insecure.','SecurityError'); return window.__setI.call(this,k,v); };
      toggleMenu('cyc'); var b=[].filter.call(document.querySelectorAll('#dd_cyc button.mi'), function(x){ return /^PB28/.test(x.textContent.slice(x.querySelector('.chk').textContent.length)); })[0];
      window.__clicked=!!b; if(b) b.click(); 'ok'`);
    await sleep(30);
    X.ev(`Storage.prototype.setItem=window.__setI; 'ok'`);
    const ls1 = X.ev(`JSON.stringify((function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return o; })())`);
    chk(name, '2. the cycle', 'PB28 was picked from the list, asked once, and refused at OPN: nothing was changed, and the message says so (a CONTROL)',
      J([X.ev('String(window.__clicked)'), JSON.parse(X.ev('JSON.stringify(window.__cq)')).filter(q => /^Put every appropriation on PB28\?/.test(q)).length, X.ev('MS.cycle'),
        /The PPBE cycle was not changed — browser storage refused OPN board data \(SecurityError\)\. Nothing was changed\./.test(X.ev(`(document.getElementById('shareStat')||{}).textContent||''`))]),
      J(['true', 1, 'PB|2027', true]));
    chk(name, '2. the cycle', 'browser storage is byte for byte what it held before the choice (a CONTROL)', ls1 === ls0, true);
    chk(name, '2. the cycle', 'the package is still on screen only, its refusal still counted against Full Fund, and still in the board’s copy',
      J([mem(), refused(), ffOf('JSON.stringify(PUBS.ff)')]), J(['true', ['prio27ff'], ['Pkg', NOTE]]));
    chk(name, '2. the cycle', 'and leaving the page still asks first', leave(), 'true');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
})();
// ---- end INT-B ----
// ==== end v2.14 integration ====
// ==== v2.14 review round 1 fixes ====
// ---- RV1-A (the file route) ----
// ---- end RV1-A ----

// ---- RV1-B (cycles, packages, storage) ----
// RV1-B: W3's board (w3sFresh) with its requirement values in BASE_ASK, as a board opened from a file has them -- a package applied
// through applyStore reads them (applyState)
const w3sFreshAsk = async () => { const B = await w3sFresh(); B.ev(`DATA.items.forEach(function(i){ BASE_ASK[i.id]=i.ask.slice(); }); 'ok'`); return B; };
// v2.14 RV1-B (own-package-refused-not-on-screen-only): AN APPROPRIATION PACKAGE MERGED INTO THE BOARD ON SCREEN IS COUNTED AS persist()
// COUNTS IT. pkgApply wrote the open board's key with lsSet and never through save(), so a refusal set nothing memOnlyNow reads,
// and the hand-over hold did not even mark it unsaved: the package was on screen only, closing the tab asked nothing, the
// appropriation box reopened the page from storage's older copy, and under the hold the save state read "Saved". The return is
// the board's own issue, sent back with a note (r1a-storagefull p3 and p6, made a check); the box is driven as a person drives it.
await (async () => {
  const name = 'v2.14 RV1-B — a package for the board on screen that browser storage refuses, or the hand-over hold holds, is on screen only, and nothing leaves it unasked';
  try {
    const J = JSON.stringify;
    const NOTE = 'FROM THE RETURN ' + 'r'.repeat(400);
    const w3sFresh = w3sFreshAsk;
    // the O&M package this board issues (captured from its download), returned by the office with a note on A
    const ret = (B) => {
      B.ev(`window.__blob=null; window.__B0=window.Blob; window.Blob=function(p,o){ window.__blob=String(p&&p[0]); return new window.__B0(p,o); };
        window.confirm=function(){ return true; }; window.alert=function(){}; localStorage.setItem('prio27who','BL'); pkgIssue('om', true); window.Blob=window.__B0; 'ok'`);
      const pkg = JSON.parse(B.ev('window.__blob'));
      pkg.dir = 'return'; pkg.by = 'O&M Lead'; pkg.ts = Date.now() + 1000;
      const y = pkg.ms.years[pkg.ms.cur]; y.notes = Object.assign({}, y.notes || {}, { A: NOTE });
      return pkg;
    };
    const ready = async (B) => { await w3sSleep(5); B.ev(`DIRTY=false; _persistFail=false; render(); 'ok'`); };
    const stored = (B) => B.ev(`String((localStorage.getItem('prio27om')||'').indexOf(${J(NOTE)})>=0)`);
    const said = (B) => B.ev(`(document.getElementById('saveState')||{}).textContent||''`);
    // (a) a CONTROL: browser storage takes it -- in storage, nothing on screen only, leaving does not ask
    { const C = await w3sFresh(); const pkg = ret(C); await ready(C);
      const r = C.ev(`String(pkgApply(${J(pkg)}, 'om-return.json'))`);
      chk(name, '(a) stored', 'the return is merged and browser storage holds it: nothing is on screen only, and leaving does not ask (a CONTROL)',
        J([r, C.ev('S.notes.A') === NOTE, stored(C), w3sMem(C), w3sLeave(C)]), J(['true', true, 'true', 'false', 'false'])); }
    // (b) browser storage refuses it (room for the appropriation choice, not for the plan)
    const A = await w3sFresh(); const pkgA = ret(A); await ready(A);
    A.ev(`writerKey(); localStorage.removeItem('prio27appn'); ${w3sQuota(40)}; 'ok'`);
    const ra = A.ev(`String(pkgApply(${J(pkgA)}, 'om-return.json'))`);
    chk(name, '(b) refused', 'the return is merged and on screen, and browser storage kept the copy it had (a CONTROL)',
      J([ra, A.ev('S.notes.A') === NOTE, stored(A), w3sRefused(A)]), J(['true', true, 'false', ['O&M board data — QuotaExceededError']]));
    chk(name, '(b) refused', 'it is on screen only: counted against the plan, and closing or reloading the page asks first',
      J([A.ev('String(DIRTY && _persistFail)'), w3sMem(A), w3sLeave(A)]), J(['true', 'true', 'true']));
    { const n0 = w3sNav(A), v = w3sPick(A, 'FULL FUND');
      chk(name, '(b) refused', 'switching appropriation from the box reopens nothing, the box reads O&M again, and the return is still on screen',
        J([w3sNav(A) - n0, v, A.ev(`localStorage.getItem('prio27appn')`), A.ev('S.notes.A') === NOTE]), J([0, 'O&M', null, true])); }
    chk(name, '(b) refused', 'the save state does not read saved', /^Saved/.test(said(A)), false);
    // (b2) 💾 Save writes it into the file, and that ends it
    A.ev(`${W3S_FH} 'ok'`);
    await A.ev('saveInPlaceFile()'); await w3sSleep(20);
    chk(name, '(b2) saved', 'the file holds the return, and nothing is on screen only any more: leaving does not ask',
      J([A.ev('window.__fw.writes'), A.ev(`String(window.__fw.content.indexOf(${J(NOTE)})>=0)`), w3sMem(A), w3sLeave(A)]), J([1, 'true', 'false', 'false']));
    // (c) the hand-over hold refuses it, after a file save (the board reads Saved first)
    { const H = await w3sFresh(); const pkg = ret(H); H.ev(`${W3S_FH} 'ok'`);
      await H.ev('saveInPlaceFile()'); await w3sSleep(10);
      chk(name, '(c) held', 'before the merge the board reads saved, with nothing on screen only (a CONTROL)', J([/^Saved/.test(said(H)), w3sMem(H)]), J([true, 'false']));
      const m = { n: 'imp-1', at: Date.now(), name: 'new board.html', from: 'big.html', href: '', keys: ['prio27om', 'prio27ff'], says: ['the O&M plan', 'the Full Fund plan'], h: {}, rep: '', how: 'file' };
      H.ev(`impHandLatch(${J(m)}); window.confirm=function(){ return true; }; 'ok'`);
      const r = H.ev(`String(pkgApply(${J(pkg)}, 'om-return.json'))`);
      chk(name, '(c) held', 'the return is merged and on screen, and the hold kept it out of browser storage (a CONTROL)', J([r, H.ev('S.notes.A') === NOTE, stored(H)]), J(['true', true, 'false']));
      chk(name, '(c) held', 'it is unsaved and on screen only, and leaving asks first', J([H.ev('String(DIRTY)'), w3sMem(H), w3sLeave(H)]), J(['true', 'true', 'true']));
      chk(name, '(c) held', 'the save state no longer reads saved', /^Saved/.test(said(H)), false); }
    // (d) stored after a file save: this browser's record says it holds work the saved file does not have, as an edit's does
    { const D = await w3sFresh(); const pkg = ret(D); D.ev(`${W3S_FH} 'ok'`);
      await D.ev('saveInPlaceFile()'); await w3sSleep(10);
      const b0 = JSON.parse(D.ev(`localStorage.getItem('prio27om.base')||'null'`)) || {};
      D.ev(`window.confirm=function(){ return true; }; 'ok'`);
      const r = D.ev(`String(pkgApply(${J(pkg)}, 'om-return.json'))`);
      const b1 = JSON.parse(D.ev(`localStorage.getItem('prio27om.base')||'null'`)) || {};
      chk(name, '(d) recorded', 'after the file save the record is clean, naming that save (a CONTROL)', J([b0.dirty, +b0.file > 0]), J([false, true]));
      chk(name, '(d) recorded', 'the merged return is stored, and the record marks it unsaved against the same save -- so a newer file opened later keeps it aside',
        J([r, stored(D), b1.dirty, b1.file === b0.file]), J(['true', 'true', true, true])); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
})();
// v2.14 RV1-B (other-appn-package-erased-by-older-copy): ANOTHER APPROPRIATION'S PLAN IS READ AS SAVE WOULD WRITE IT -- the newer of
// browser storage's copy and this page's own (PUBS). pkgStoreOf and the ladder copy took storage's copy whatever its age: a Full
// Fund package storage had refused, held in PUBS alone, was replaced by storage's OLDER Full Fund when the ladder was copied or Full
// Fund issued -- the refusal mark cleared, leaving stopped asking, and the saved file carried no package. And with nothing refused,
// a file's newer Full Fund gave way to this browser's older one. Where the copy passed over is this browser's unsaved work, nothing
// is written over either (r1a-storagefull p5 and the skeptics' sk3, made a check).
await (async () => {
  const name = 'v2.14 RV1-B — a package held on this page alone, or a newer file copy, survives copying a ladder and issuing; unsaved work in storage is left alone';
  try {
    const J = JSON.stringify;
    const NOTE = 'PACKAGE NOTE ' + 'p'.repeat(6000);
    const w3sFresh = w3sFreshAsk;
    const has = (B, code, t) => B.ev(`String((${code}||'').indexOf(${J(t)})>=0)`);
    const pubFF = 'JSON.stringify(PUBS.ff)', savedFile = 'buildSavedHtml()', lsFF = `localStorage.getItem('prio27ff')`;
    // Full Fund, as this browser and the file hold it: a copy of this board's plan, a minute old; then its package, refused
    const withPackage = async () => {
      const B = await w3sFresh();
      const ff0 = JSON.parse(B.ev('JSON.stringify(MS)')); ff0.ts = Date.now() - 60000; ff0.by = 'FF Lead';
      B.ev(`localStorage.setItem('prio27ff', ${J(J(ff0))}); PUBS.ff=${J(ff0)}; localStorage.setItem('prio27who','BL');
        window.confirm=function(){ return true; }; window.__al=[]; window.alert=function(m){ window.__al.push(String(m)); }; 'ok'`);
      const ms = JSON.parse(J(ff0)); ms.years[ms.cur].notes = { A: NOTE };
      const bandLen = +B.ev('JSON.stringify(BANDS_LIST()).length');
      B.ev(`${w3sQuota(2 * bandLen + 900)}; 'ok'`);
      const r = B.ev(`String(pkgApply(${J({ spmtPkg: 1, dir: 'issue', ap: 'ff', apName: 'Full Fund', seq: 1, ts: Date.now(), by: 'FF Lead', baseSig: '', ms })}, 'ff-package.json'))`);
      return { B, r };
    };
    // (a) a ladder copied after the refused package
    { const { B, r } = await withPackage();
      chk(name, '(a) the package', 'it is loaded, held on this page alone, and leaving asks (a CONTROL)',
        J([r, has(B, pubFF, NOTE), has(B, lsFF, NOTE), w3sMem(B), w3sLeave(B)]), J(['true', 'true', 'false', 'true', 'true']));
      B.ev(`bandCopyAll(); 'ok'`);
      chk(name, '(a) the ladder', 'Full Fund on this page still holds the package, with the ladder put on it',
        J([has(B, pubFF, NOTE), B.ev(`String(JSON.stringify(PUBS.ff.bands)===JSON.stringify(BANDS_LIST()))`)]), J(['true', 'true']));
      chk(name, '(a) the ladder', 'it is still on screen only and leaving still asks; the saved file carries the package',
        J([w3sMem(B), w3sLeave(B), B.ev('JSON.stringify(Object.keys(_lsRefused))'), has(B, savedFile, NOTE)]), J(['true', 'true', J(['prio27ff']), 'true'])); }
    // (b) Full Fund issued after the refused package
    { const { B } = await withPackage();
      B.ev(`window.__blob=null; window.__B0=window.Blob; window.Blob=function(p,o){ window.__blob=String(p&&p[0]); return new window.__B0(p,o); }; pkgIssue('ff', true); window.Blob=window.__B0; 'ok'`);
      chk(name, '(b) the issue', 'the package issued carries what Full Fund holds on this page, the package included',
        has(B, 'window.__blob', NOTE), 'true');
      chk(name, '(b) the issue', 'Full Fund on this page still holds it, leaving still asks, and the saved file carries it',
        J([has(B, pubFF, NOTE), w3sMem(B), w3sLeave(B), has(B, savedFile, NOTE)]), J(['true', 'true', 'true', 'true'])); }
    // (c) nothing refused: the file's Full Fund (on this page) is newer than this browser's, which holds no unsaved work
    { const B = await w3sFresh();
      const old = JSON.parse(B.ev('JSON.stringify(MS)')); old.ts = Date.now() - 60000; old.years[old.cur].notes = { A: 'OLDER IN THIS BROWSER' };
      const nw = JSON.parse(J(old)); nw.ts = Date.now() - 30000; nw.years[nw.cur].notes = { A: 'NEWER IN THE FILE' };
      B.ev(`localStorage.setItem('prio27ff', ${J(J(old))}); localStorage.setItem('prio27ff.base', ${J(J({ file: 1, dirty: false }))}); PUBS.ff=${J(nw)};
        window.confirm=function(){ return true; }; window.alert=function(){}; 'ok'`);
      chk(name, '(c) newer file copy', 'Full Fund is read from the newer copy, the file’s, which is the one Save writes',
        J([B.ev(`String(pkgStoreOf('ff').ts)`), has(B, savedFile, 'NEWER IN THE FILE')]), J([String(nw.ts), 'true']));
      B.ev(`bandCopyAll(); 'ok'`);
      chk(name, '(c) newer file copy', 'the ladder goes onto the file’s newer Full Fund: this page and browser storage hold it, and so does the saved file',
        J([has(B, pubFF, 'NEWER IN THE FILE'), has(B, lsFF, 'NEWER IN THE FILE'), has(B, savedFile, 'NEWER IN THE FILE')]), J(['true', 'true', 'true'])); }
    // (d) the copy passed over is this browser's unsaved work: the ladder, the issue and a package leave both copies as they are
    { const B = await w3sFresh();
      const old = JSON.parse(B.ev('JSON.stringify(MS)')); old.ts = Date.now() - 60000; old.years[old.cur].notes = { A: 'UNSAVED IN THIS BROWSER' };
      const nw = JSON.parse(J(old)); nw.ts = Date.now() - 30000; nw.years[nw.cur].notes = { A: 'NEWER IN THE FILE' };
      B.ev(`localStorage.setItem('prio27ff', ${J(J(old))}); localStorage.setItem('prio27ff.base', ${J(J({ file: 1, dirty: true }))}); PUBS.ff=${J(nw)};
        window.confirm=function(){ return true; }; window.__al=[]; window.alert=function(m){ window.__al.push(String(m)); }; 'ok'`);
      const ls0 = B.ev(lsFF), pub0 = B.ev(pubFF);
      B.ev(`bandCopyAll(); 'ok'`);
      // v2.14 RV2-B (held-ladder-promise-never-kept): no ladder is held for it -- its opening's first, empty board took the held ladder and
      // dropped it before the work and the file's copy were on screen, so the promise below was never kept -- and the line says not copied
      chk(name, '(d) unsaved work', 'copying the ladder writes neither Full Fund: browser storage and this page hold what they held, and no ladder is held for it',
        J([B.ev(lsFF) === ls0, B.ev(pubFF) === pub0, B.ev(`String(!!localStorage.getItem(BAND_PEND_KEY('ff')))`)]), J([true, true, 'false']));
      chk(name, '(d) unsaved work', 'and the message says why Full Fund was not copied',
        /Not copied to Full Fund — this browser holds Full Fund work the saved file does not have/.test(w3sStat(B)), true);
      B.ev(`window.__blob=null; window.__B0=window.Blob; window.Blob=function(p,o){ window.__blob=String(p&&p[0]); return new window.__B0(p,o); }; pkgIssue('ff', true); window.Blob=window.__B0; 'ok'`);
      chk(name, '(d) unsaved work', 'issuing Full Fund issues nothing and writes neither copy, saying why',
        J([B.ev('String(window.__blob)'), B.ev(lsFF) === ls0, B.ev(pubFF) === pub0, /^⚠ Full Fund was not issued — this browser holds Full Fund work the saved file does not have/.test(w3sStat(B))]),
        J(['null', true, true, true]));
      const ms = JSON.parse(J(nw)); ms.years[ms.cur].notes = { A: 'A PACKAGE' };
      const r = B.ev(`String(pkgApply(${J({ spmtPkg: 1, dir: 'issue', ap: 'ff', apName: 'Full Fund', seq: 1, ts: Date.now(), by: 'FF Lead', baseSig: '', ms })}, 'ff-package.json'))`);
      chk(name, '(d) unsaved work', 'a Full Fund package is not taken, the refusal names why, and neither copy is written',
        J([r, /^NOT IMPORTED — this browser holds Full Fund work the saved file does not have/.test(B.ev('window.__al[window.__al.length-1]||""')), B.ev(lsFF) === ls0, B.ev(pubFF) === pub0]),
        J(['false', true, true, true])); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
})();
// v2.14 RV1-B (cyc-record-stale-file-ts): AFTER THIS PAGE HAS SAVED THE FILE, A CYCLE PUT ON THE OTHER APPROPRIATIONS RECORDS THAT
// SAVE. cycApplyAll recorded the file's save at OPENING (PUB_FILE_TS) for each plan it took from the file, so after the page's own
// Saves Full Fund opened saying the file had been saved by somebody since -- sending the person to ⬅ Import the file, which would
// throw the cycle away -- and its first Save asked HOLD ON about Brad's own O&M save. Brad's main path, in its order: the board file
// opened in a browser holding none of it, an edit, Save, Save again, the cycle for every appropriation, Full Fund (r1a-savetarget p3).
await (async () => {
  const name = 'v2.14 RV1-B — after this page saves the file, putting every appropriation on a cycle records that save for each one it takes from the file';
  try {
    const J = JSON.stringify, K = 'ab'.repeat(16), URL0 = 'https://example.invalid/ORBIT%20Live.html';
    const pubOf = html => { const m = /<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/.exec(String(html)); try { return JSON.parse(m[1]); } catch { return null; } };
    const fileTs = html => { const p = pubOf(html) || {}; return Math.max(0, ...Object.values(p.appns || {}).map(s => (s && s.ts) || 0)); };
    const lsOf = B => JSON.parse(w3sLs(B));
    const SVC = ['USAF', 'ANG'];
    const mk = (html, appn, items) => { const X = boot(Object.assign({ appn, ls: { prio27writerKey: K } }, html ? { html } : {}));
      seed(X.ev, { services: SVC, items, disc: [900, 200], mand: [100, 20], order: items.map(i => i.id) });
      X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S);
        WRITER={by:'BLL', fp:writerFp(), t:1700000000000}; save(); 'ok'`); return X; };
    const FF = mk(null, 'FULL FUND', [it('F', 'AV', [700, 100]), it('G', 'TSS', [500, 90])]);
    const OM = mk(FF.ev('buildSavedHtml()'), 'O&M', [it('A', 'PSM', [400, 100]), it('B', 'AV', [300, 10])]);
    const FILE = OM.ev('buildSavedHtml()');
    await w3sSleep(5);
    // the file on disk, remembered as this page's: Save writes it in place
    const disk = { content: FILE, writes: 0 };
    const fh = (B) => { B.w.__disk = { name: 'ORBIT Live.html', kind: 'file', isSameEntry: async o => o === B.w.__disk,
        queryPermission: async () => 'granted', requestPermission: async () => 'granted',
        getFile: async () => ({ text: async () => disk.content }),
        createWritable: async () => { let b = ''; return { write: async x => { b += String(x); }, close: async () => { disk.content = b; disk.writes++; } }; } };
      B.ev(`FH=window.__disk; window.showSaveFilePicker=function(){ return Promise.reject(new DOMException('no window here', 'AbortError')); };
        window.showOpenFilePicker=function(){ return Promise.reject(new DOMException('no window here', 'AbortError')); }; 'ok'`); };
    const wire = (B, yes) => B.ev(`window.__q=[]; window.confirm=function(m){ window.__q.push(String(m)); return ${yes}; }; window.alert=function(){};
      window.prompt=function(){ return null; }; localStorage.setItem('prio27who','BLL'); 'ok'`);
    const P = boot({ html: FILE, url: URL0, ls: { prio27writerKey: K, prio27appn: 'O&M' } }); await w3sSleep(40);
    wire(P, 'true'); fh(P);
    P.ev(`S.notes=S.notes||{}; S.notes.A='edit 1'; save(); 'ok'`); await w3sSleep(5);
    await P.ev('saveInPlaceFile()'); await w3sSleep(40);
    P.ev(`S.notes.A='edit 2'; save(); 'ok'`); await w3sSleep(5);
    await P.ev('saveInPlaceFile()'); await w3sSleep(40);
    const saved = fileTs(disk.content);
    chk(name, 'the O&M page', 'both saves were written, asking nothing, and the file’s save is now later than the one this page opened (a CONTROL)',
      J([disk.writes, P.ev('window.__q.length'), saved > +P.ev('PUB_FILE_TS')]), J([2, 0, true]));
    P.ev(`window.__q=[]; 'ok'`);
    const r = P.ev(`String(cycApplyAll('PB|2027'))`);
    const rec = JSON.parse(P.ev(`localStorage.getItem('prio27ff.base')||'null'`)) || {};
    chk(name, 'the cycle', 'Full Fund is put on PB27 from the file, recorded as unsaved work from the save the file now is', J([r, rec.dirty, rec.file]), J(['true', true, saved]));
    // switching to Full Fund: the page reopens on the same file, in the same browser
    const F = boot({ html: disk.content, url: URL0, ls: Object.assign(lsOf(P), { prio27appn: 'FULL FUND' }) }); await w3sSleep(40);
    chk(name, 'Full Fund opens', 'on PB27, from the save the file is, and its opening line does not say the file was saved by somebody since',
      J([F.ev('MS.cycle'), +F.ev('LASTKNOWN') === +F.ev('PUB_FILE_TS'), /has been saved since then|saved by someone|Import the file/.test(w3sStat(F))]), J(['PB|2027', true, false]));
    wire(F, 'false'); fh(F);
    F.ev(`S.notes=S.notes||{}; S.notes.F='ff edit'; save(); 'ok'`);
    const w0 = disk.writes;
    await F.ev('saveInPlaceFile()'); await w3sSleep(40);
    chk(name, 'Full Fund saves', 'its first Save asks nothing (no HOLD ON over Brad’s own O&M save) and writes the file',
      J([JSON.parse(F.ev('JSON.stringify(window.__q)')).map(q => q.slice(0, 40)), disk.writes - w0]), J([[], 1]));
    const out = pubOf(disk.content) || { appns: {} }, note = (k, id) => ((((out.appns[k] || {}).years || {})[(out.appns[k] || {}).cur] || {}).notes || {})[id];
    chk(name, 'Full Fund saves', 'the file holds O&M’s edit, both cycles and Full Fund’s edit',
      J([note('om', 'A'), (out.appns.om || {}).cycle, (out.appns.ff || {}).cycle, note('ff', 'F')]), J(['edit 2', 'PB|2027', 'PB|2027', 'ff edit']));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
})();
// v2.14 RV1-B (critic/cyc-all-refused-on-file-route-board, cycle-for-all-refused-on-big-board): A BOARD THAT LIVES IN ITS FILE TAKES
// THE CYCLE FOR EVERY APPROPRIATION. The other plans are on the page (PUBS) because browser storage cannot hold them with this one;
// cycApplyAll wrote every one into storage at once, so the choice was refused ("Nothing was changed.") on Brad's main path. Refused
// for room and put back whole, each plan read from the file, they are tagged on this page: on screen only, so leaving asks and
// switching waits, and 💾 Save writes them into the file. Storage is left exactly as it was. The board file opened in a browser that
// holds none of it, with room for this plan and its growth, not for another's (r1a-storagefull p2, made a check).
await (async () => {
  const name = 'v2.14 RV1-B — on a board whose plans live in its file, putting every appropriation on a cycle tags them on this page, and Save writes them';
  try {
    const J = JSON.stringify;
    const B0 = await w3sFresh();
    B0.ev(`S.notes=S.notes||{}; S.notes.A='OM-'+'o'.repeat(6000); save(); 'ok'`);
    const om = JSON.parse(B0.ev('JSON.stringify(MS)'));
    const ff = JSON.parse(J(om)); ff.ts = om.ts - 1000; ff.years[ff.cur].notes = { A: 'FF-' + 'f'.repeat(6000) };
    const sp = JSON.parse(J(om)); sp.ts = om.ts - 2000; sp.years[sp.cur].notes = { A: 'SP-' + 's'.repeat(6000) };
    B0.ev(`PUBS.ff=${J(ff)}; PUBS.sp=${J(sp)}; 'ok'`);
    const html = B0.ev('buildSavedHtml()');
    const T = boot({ html }); await w3sSleep(80);
    const omLen = +T.ev('JSON.stringify(MS).length');
    T.ev(`writerKey(); localStorage.setItem('prio27who','BL'); ${w3sQuota(0)}; Storage.prototype.setItem=window.__si; ${w3sQuota(omLen + 2500)};
      window.confirm=function(){ return true; }; window.alert=function(){}; ${W3S_FH} 'ok'`);
    T.ev(`S.notes.B='edit one'; save(); render(); 'ok'`);
    await T.ev('saveInPlaceFile()'); await w3sSleep(20);
    T.ev(`S.notes.B='edit two'; save(); render(); 'ok'`);
    await T.ev('saveInPlaceFile()'); await w3sSleep(20);
    const OTHERS = ['prio27ff', 'prio27ff.base', 'prio27sp', 'prio27sp.base'];
    const lsK = () => { const o = JSON.parse(w3sLs(T)); return OTHERS.map(k => o[k] === undefined ? null : o[k]); };
    const k0 = lsK();
    chk(name, 'the fixture', 'both saves written; browser storage holds no other appropriation, and nothing is on screen only (a CONTROL)',
      J([T.ev('window.__fw.writes'), k0, w3sMem(T)]), J([2, [null, null, null, null], 'false']));
    const r = T.ev(`String(cycApplyAll('PB|2028'))`), said = w3sStat(T);
    chk(name, 'the cycle', 'browser storage refused Full Fund’s plan, and this board’s own change was stored (a CONTROL)',
      J([w3sRefused(T).indexOf('Full Fund board data — QuotaExceededError') >= 0, T.ev('String(_persistFail)')]), J([true, 'false']));
    chk(name, 'the cycle', 'every appropriation is on PB28 on this page: this board, Full Fund and Initial Spares',
      J([r, T.ev('MS.cycle'), T.ev('String((PUBS.ff||{}).cycle)'), T.ev('String((PUBS.sp||{}).cycle)')]), J(['true', 'PB|2028', 'PB|2028', 'PB|2028']));
    chk(name, 'the cycle', 'each carries the change as one journal line of its own', J([T.ev(`String(((PUBS.ff.jrnl||[]).slice(-1)[0]||{}).p)`), T.ev(`String(((PUBS.sp.jrnl||[]).slice(-1)[0]||{}).p)`)]), J(['(cycle)', '(cycle)']));
    chk(name, 'the cycle', 'nothing half-landed: browser storage holds exactly what it held of the other appropriations', J(lsK()), J(k0));
    chk(name, 'the cycle', 'the other appropriations are on screen only: counted against each, and leaving asks first',
      J([T.ev('JSON.stringify(Object.keys(_lsRefused).sort())'), w3sMem(T), w3sLeave(T)]), J([J(['prio27ff', 'prio27sp']), 'true', 'true']));
    { const n0 = w3sNav(T), v = w3sPick(T, 'FULL FUND');
      chk(name, 'the cycle', 'switching appropriation from the box reopens nothing, and the box reads O&M again', J([w3sNav(T) - n0, v]), J([0, 'O&M'])); }
    chk(name, 'the cycle', 'the message says they are on PB28 on this page only, that Save writes them, and that leaving asks until then',
      /Browser storage cannot hold the other appropriations’ plans: Full Fund, Initial Spares are on PB28 on this page only, and 💾 Save writes them into the file\. Until it is saved, closing or reloading this page asks first/.test(said), true);
    await T.ev('saveInPlaceFile()'); await w3sSleep(20);
    const out = JSON.parse((T.ev('window.__fw.content').match(/id="pubState">([\s\S]*?)<\/script>/) || [])[1] || 'null') || { appns: {} };
    chk(name, '💾 Save', 'the file holds every appropriation on PB28, and nothing is on screen only any more',
      J([(out.appns.om || {}).cycle, (out.appns.ff || {}).cycle, (out.appns.sp || {}).cycle, w3sMem(T), w3sLeave(T)]), J(['PB|2028', 'PB|2028', 'PB|2028', 'false', 'false']));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
})();
// v2.14 RV1-B: THE DESTINATION LIST RULE STILL READS THIS BROWSER'S OWN COPY. pkgStoreOf reads the newer of storage's copy and this
// page's (apStoreOf) now; destOwnLists read other appropriations through it, so this browser's older Full Fund -- whose destination
// list holds "unassigned", a key the funds flow keeps for its own row -- went unread once the page's Full Fund was newer, and the
// warning and the block it drives (v2.00 U44, audit-recon T9) said nothing. destOwnLists reads storage's copy beside the newer one.
// A GUARD for the reach kept: its two rule checks pass on 44aa984 too (pkgStoreOf read storage's copy then), and fail when the read
// is dropped (v200-u44-say-no-packages); its first line, which copy pkgStoreOf reads, is the other-appn finding's and fails there.
await (async () => {
  const name = 'v2.14 RV1-B — a copy this browser holds of another appropriation is still read by the destination list rule';
  try {
    const J = JSON.stringify;
    const B = await w3sFreshAsk();
    const base = JSON.parse(B.ev('JSON.stringify(MS)'));
    const ents = ((base.flow || {}).ents || []).filter(e => e && e.k !== 'unassigned');
    const clean = JSON.parse(J(base)); clean.flow = Object.assign({}, clean.flow || {}, { ents }); clean.ts = Date.now() - 1000;
    const old = JSON.parse(J(clean)); old.ts = Date.now() - 60000; old.flow.ents = ents.concat([{ k: 'unassigned', n: 'Depot U' }]);
    B.ev(`localStorage.setItem('prio27ff', ${J(J(old))}); PUBS.ff=${J(clean)}; localStorage.setItem('prio27who','BL');
      window.confirm=function(){ return true; }; window.__al=[]; window.alert=function(m){ window.__al.push(String(m)); }; 'ok'`);
    chk(name, 'the fixture', 'Full Fund is read from the newer copy, this page’s, which is clean; this browser’s older copy holds “unassigned”',
      J([B.ev(`String(pkgStoreOf('ff').ts)`), B.ev(`String(JSON.stringify(PUBS.ff.flow.ents).indexOf('"unassigned"')>=0)`), B.ev(`String((localStorage.getItem('prio27ff')||'').indexOf('"unassigned"')>=0)`)]),
      J([String(clean.ts), 'false', 'true']));
    const lists = JSON.parse(B.ev(`JSON.stringify(destOwnLists().map(function(l){ return [l.at, l.odd.map(function(x){ return x.what; })]; }))`));
    chk(name, 'the rule', 'it names Full Fund’s plan, holding the key “unassigned”', J(lists.filter(l => /Full Fund/.test(l[0])).map(l => [l[0], l[1].some(w => /“unassigned”/.test(w))])), J([['Full Fund’s plan', true]]));
    B.ev(`window.__blob=null; window.__B0=window.Blob; window.Blob=function(p,o){ window.__blob=String(p&&p[0]); return new window.__B0(p,o); }; pkgIssue('ff', true); window.Blob=window.__B0; 'ok'`);
    chk(name, 'the rule', 'and ⬆ Issue Full Fund is refused by it: no package is written', J([B.ev('String(!!window.__blob)'), /is refused/.test(B.ev('window.__al.join(" ")'))]), J(['false', true]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
})();
// v2.14 RV1-B (the check of RV1-B's fixes: critic/cyc-all-refused-on-file-route-board and cycle-for-all-refused-on-big-board, still
// refused where a plan lives in browser storage): THE PLANS THIS BROWSER STORES ARE CARRIED TOO. The fix carried the other
// appropriations' plans on this page only when every one had come from the board file; once one was in browser storage -- Full Fund
// opened and saved there once on Brad's main path, or the storage route whose last few hundred characters edits had filled -- the
// same refusal for room came back, "Nothing was changed.", with no way forward. Carried, this page's copy holds storage's copy's work
// and the cycle, so nothing of storage's is passed over: ⬆ Issue and a second choice go on. Once 💾 Save has written it, its record
// says saved, so its own board opens the file's tagged plan with nothing kept aside (rv1-B-check x5-storage-route and pA2-tour).
await (async () => {
  const __bm = w3Mark();
  const name = 'v2.14 RV1-B — plans this browser stores are carried too when storage has no room for the cycle, and Save records them saved';
  try {
    const J = JSON.stringify;
    const B = await w3sFresh();
    const base = JSON.parse(B.ev('JSON.stringify(MS)'));
    const FFN = 'FF-' + 'f'.repeat(600), SPN = 'SP-' + 's'.repeat(600);
    const ff = JSON.parse(J(base)); ff.ts = Date.now() - 5000; ff.by = 'FF Lead'; ff.years[ff.cur].notes = { A: FFN };
    const sp = JSON.parse(J(base)); sp.ts = Date.now() - 6000; sp.by = 'SP Lead'; sp.years[sp.cur].notes = { A: SPN };
    // Full Fund and Initial Spares in this browser, each holding work its own board has not saved into a file; this page's file
    // holds neither (the storage route)
    B.ev(`localStorage.setItem('prio27ff', ${J(J(ff))}); localStorage.setItem('prio27ff.base', ${J(J({ file: 0, dirty: true }))});
      localStorage.setItem('prio27sp', ${J(J(sp))}); localStorage.setItem('prio27sp.base', ${J(J({ file: 0, dirty: true }))});
      for (var k in PUBS) delete PUBS[k]; writerKey(); localStorage.setItem('prio27who','BL');
      window.__q=[]; window.confirm=function(m){ window.__q.push(String(m)); return true; }; window.alert=function(){}; ${W3S_FH} 'ok'`);
    // O&M's 💾 Save writes all three into the file (each the newer of this page's and storage's); their records stay as they were
    await B.ev('saveInPlaceFile()'); await w3sSleep(20);
    const OTHERS = ['prio27ff', 'prio27ff.base', 'prio27sp', 'prio27sp.base'];
    const lsK = () => { const o = JSON.parse(w3sLs(B)); return OTHERS.map(k => o[k] === undefined ? null : o[k]); };
    const k0 = lsK();
    chk(name, 'the fixture', 'the file is written; browser storage holds Full Fund and Initial Spares, unsaved; nothing is on screen only (a CONTROL)',
      J([B.ev('window.__fw.writes'), k0.map(v => v !== null), w3sMem(B)]), J([1, [true, true, true, true], 'false']));
    // browser storage has no room left for Initial Spares' plan, grown by its cycle line
    B.ev(`window.__si2=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(k==='prio27sp') throw new DOMException('The quota has been exceeded.','QuotaExceededError'); return window.__si2.call(this,k,v); }; 'ok'`);
    const r = B.ev(`String(cycApplyAll('PB|2028'))`), said = w3sStat(B);
    chk(name, 'the cycle', 'refused for room at Initial Spares, put back whole, and carried: every appropriation is on PB28 on this page',
      J([r, B.ev('MS.cycle'), B.ev('String((PUBS.ff||{}).cycle)'), B.ev('String((PUBS.sp||{}).cycle)')]), J(['true', 'PB|2028', 'PB|2028', 'PB|2028']));
    chk(name, 'the cycle', 'each carries this browser’s work on it, as browser storage holds it',
      J([B.ev(`String((((PUBS.ff||{}).years||{})[MS.cur]||{}).notes.A)`) === FFN, B.ev(`String((((PUBS.sp||{}).years||{})[MS.cur]||{}).notes.A)`) === SPN]), J([true, true]));
    chk(name, 'the cycle', 'nothing half-landed: browser storage holds exactly what it held of them', J(lsK()), J(k0));
    chk(name, 'the cycle', 'they are on screen only, and leaving asks first; the message says Save writes them',
      J([B.ev('JSON.stringify(Object.keys(_lsRefused).sort())'), w3sMem(B), w3sLeave(B),
        /Full Fund, Initial Spares are on PB28 on this page only, and 💾 Save writes them into the file/.test(said)]),
      J([J(['prio27ff', 'prio27sp']), 'true', 'true', true]));
    // a second choice: this page's copies are the ones storage's were tagged from -- not "this browser holds work the file does not have"
    B.ev(`window.__q=[]; 'ok'`);
    const r2 = B.ev(`String(cycApplyAll('BES|2028'))`);
    chk(name, 'a second choice', 'BES28 for every appropriation: neither is left out as holding work the saved file does not have, and both move',
      J([r2, /NOT changed/.test(B.ev('window.__q.join(" ")')), B.ev('MS.cycle'), B.ev('String((PUBS.ff||{}).cycle)'), B.ev('String((PUBS.sp||{}).cycle)'), J(lsK()) === J(k0)]),
      J(['true', false, 'BES|2028', 'BES|2028', 'BES|2028', true]));
    // ⬆ Issue Full Fund: issued from this page's copy, which holds storage's work and the cycle
    B.ev(`window.__blob=null; window.__B0=window.Blob; window.Blob=function(p,o){ window.__blob=String(p&&p[0]); return new window.__B0(p,o); }; pkgIssue('ff', true); window.Blob=window.__B0; 'ok'`);
    chk(name, '⬆ Issue', 'Full Fund is issued, carrying this browser’s work and BES28',
      J([B.ev(`String((window.__blob||'').indexOf(${J(FFN)})>=0)`), B.ev(`String((window.__blob||'').indexOf('"cycle":"BES|2028"')>=0)`)]), J(['true', 'true']));
    // 💾 Save writes them; Initial Spares, still carried from storage's own copy, is recorded saved against this save
    await B.ev('saveInPlaceFile()'); await w3sSleep(20);
    const file = B.ev('window.__fw.content');
    const pub = JSON.parse((file.match(/id="pubState">([\s\S]*?)<\/script>/) || [])[1] || 'null') || { appns: {} };
    const wrote = Math.max(0, ...Object.values(pub.appns).map(s => (s && s.ts) || 0));
    chk(name, '💾 Save', 'the file holds every appropriation on BES28 with this browser’s work, and nothing is on screen only',
      J([(pub.appns.om || {}).cycle, (pub.appns.ff || {}).cycle, (pub.appns.sp || {}).cycle, J(pub.appns.sp || {}).indexOf(SPN) >= 0, w3sMem(B), w3sLeave(B)]),
      J(['BES|2028', 'BES|2028', 'BES|2028', true, 'false', 'false']));
    chk(name, '💾 Save', 'Initial Spares’ record says its work is saved, in this save; its plan in browser storage is left as it was',
      J([JSON.parse(B.ev(`localStorage.getItem('prio27sp.base')`)), B.ev(`localStorage.getItem('prio27sp')`) === k0[2]]), J([{ file: wrote, dirty: false }, true]));
    // Initial Spares opened from that file, in this browser
    B.ev(`Storage.prototype.setItem=window.__si2; 'ok'`);
    const S2 = boot({ html: file, appn: 'INITIAL SPARES', ls: JSON.parse(w3sLs(B)) }); await w3sSleep(40);
    chk(name, 'Initial Spares opens', 'on BES28 with its work, nothing kept aside, and the opening line says nothing was kept aside',
      J([S2.ev('mySlug()'), S2.ev('MS.cycle'), S2.ev(`String(JSON.stringify(MS).indexOf(${J(SPN)})>=0)`), S2.ev(`String(localStorage.getItem('prio27sp.kept')!==null)`), /kept aside/i.test(w3sStat(S2))]),
      J(['sp', 'BES|2028', 'true', 'false', false]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  w3Release(__bm);
})();
// v2.14 RV1-B (the check of RV1-B's fixes: the import doors' CONFLICT question in the held state): A FULL IMPORT, OR TAKING ONE
// APPROPRIATION, NAMES THIS BROWSER'S UNSAVED WORK BEFORE IT REPLACES IT. This browser holds Full Fund work no saved copy has, and this
// page's Full Fund -- the board file's, saved since on another machine -- is newer. Once pkgStoreOf read the newer copy, both doors asked
// only about the file's change (somebody else's) and then replaced the only copy of this browser's work; before RV1-B they named
// this browser's and not the file's. Both are replaced, so both are named; refused, nothing changes (rv1-B-check x3-import-conflict).
await (async () => {
  const __bm = w3Mark();
  const name = 'v2.14 RV1-B — importing over an appropriation names this browser’s unsaved work as well as the newer copy’s, before replacing both';
  try {
    const J = JSON.stringify;
    for (const door of ['full', 'take']) {
      const B = await w3sFresh();
      B.ev(`localStorage.setItem('prio27who','BL'); window.__q=[]; window.confirm=function(m){ window.__q.push(String(m)); return !/^CONFLICT/.test(String(m)); }; window.alert=function(m){ window.__q.push('ALERT '+String(m)); }; 'ok'`);
      const base = JSON.parse(B.ev('JSON.stringify(MS)'));
      const T0 = Date.now() - 300000, T1 = Date.now() - 200000, T2 = Date.now() - 100000, fy = String(base.cur);
      const ff0 = JSON.parse(J(base)); ff0.ts = T0; ff0.by = 'FF Lead'; ff0.jrnl = [];
      B.ev(`localStorage.removeItem('prio27ff'); PUBS.ff=${J(ff0)}; 'ok'`);
      const IMPORT = B.ev('buildSavedHtml()');
      const ffU = JSON.parse(J(ff0)); ffU.ts = T1; ffU.by = 'BL'; ffU.years[fy].notes = { A: 'UNSAVED IN THIS BROWSER' };
      ffU.jrnl = [{ t: T1, by: 'BL', fy: +fy, p: ['years', fy, 'notes', 'A'], b: null, a: 'UNSAVED IN THIS BROWSER' }];
      const ffF = JSON.parse(J(ff0)); ffF.ts = T2; ffF.by = 'Other'; ffF.years[fy].titles = { A: 'SAVED ELSEWHERE' };
      ffF.jrnl = [{ t: T2, by: 'Other', fy: +fy, p: ['years', fy, 'titles', 'A'], b: null, a: 'SAVED ELSEWHERE' }];
      B.ev(`localStorage.setItem('prio27ff', ${J(J(ffU))}); localStorage.setItem('prio27ff.base', ${J(J({ file: T0, dirty: true }))}); PUBS.ff=${J(ffF)}; 'ok'`);
      const ls0 = B.ev(`localStorage.getItem('prio27ff')`);
      if (door === 'full') B.ev(`String(fullImportText(${J(IMPORT)}, 'import.html'))`);
      else { const fullSt = JSON.parse(IMPORT.match(/id="pubState">([\s\S]*?)<\/script>/)[1]); B.ev(`String(consTakeApply(${J(fullSt)}, ${J(IMPORT)}, 'import.html', ['ff'], false))`); }
      const cq = JSON.parse(B.ev('JSON.stringify(window.__q)')).filter(q => /^CONFLICT — Full Fund/.test(q));
      chk(name, door === 'full' ? 'a full import' : 'taking Full Fund', 'one CONFLICT question, naming this browser’s unsaved change and the newer copy’s, before anything is replaced',
        J([cq.length, /notes › A\) \(BL,/.test(cq[0] || ''), /titles › A\) \(Other,/.test(cq[0] || '')]), J([1, true, true]));
      chk(name, door === 'full' ? 'a full import' : 'taking Full Fund', 'answered no, browser storage still holds this browser’s work, byte for byte',
        B.ev(`localStorage.getItem('prio27ff')`) === ls0, true);
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  w3Release(__bm);
})();
// v2.14 RV1-B (the check of RV1-B's fixes): ⬆ PUSH BASELINES AND ⬆ SEND BACK, IN THE HELD STATE. This browser holds Full Fund work no
// saved copy has, and this page's Full Fund is newer. pkgIssue leaves Full Fund alone and says why; the push's own closing line then
// said "Pushed 1 of 2 … your browser blocked the extra downloads". Send back read the newer copy too, and sent it without this browser's
// work, unsaid; before RV1-B it sent this browser's and left the newer one out. Both are named now, and nothing is sent or written for
// Full Fund (rv1-B-check x4-pushall, and the same reading in pkgSendBack).
await (async () => {
  const __bm = w3Mark();
  const name = 'v2.14 RV1-B — pushing baselines and sending back name an appropriation whose unsaved work is behind a newer copy, and send none of it';
  try {
    const J = JSON.stringify;
    const B = await w3sFresh();
    const old = JSON.parse(B.ev('JSON.stringify(MS)')); old.ts = Date.now() - 60000; old.years[old.cur].notes = { A: 'UNSAVED IN THIS BROWSER' };
    const nw = JSON.parse(J(old)); nw.ts = Date.now() - 30000; nw.years[nw.cur].notes = { A: 'NEWER IN THE FILE' };
    B.ev(`localStorage.setItem('prio27ff', ${J(J(old))}); localStorage.setItem('prio27ff.base', ${J(J({ file: 1, dirty: true }))}); PUBS.ff=${J(nw)};
      localStorage.setItem('prio27who','BL'); window.confirm=function(){ return true; }; window.alert=function(){};
      window.__n=[]; window.__B0=window.Blob; window.Blob=function(p,o){ window.__n.push(String(p&&p[0])); return new window.__B0(p,o); }; 'ok'`);
    const ls0 = B.ev(`localStorage.getItem('prio27ff')`), pub0 = B.ev('JSON.stringify(PUBS.ff)');
    B.ev(`pkgPushAll(); 'ok'`);
    await w3sSleep(700);
    const files = JSON.parse(B.ev('JSON.stringify(window.__n)')), said = w3sStat(B);
    chk(name, '⬆ Push baselines', 'O&M’s package is made and none for Full Fund; both Full Fund copies are as they were',
      J([files.length, files.some(f => /"ap":"ff"/.test(f)), B.ev(`localStorage.getItem('prio27ff')`) === ls0, B.ev('JSON.stringify(PUBS.ff)') === pub0]), J([1, false, true, true]));
    chk(name, '⬆ Push baselines', 'the closing line says Full Fund was not issued, for this browser’s unsaved work behind the newer copy',
      // v2.14 RV2-B: the reason is apHeldWhy's one sentence now (it says which copy is the newer), naming the appropriation
      /Full Fund was not issued: this browser holds Full Fund work the saved file does not have, and the file’s copy is newer/.test(said), true);
    B.ev(`window.__n=[]; pkgSendBack('ff'); 'ok'`);
    chk(name, '⬆ Send back', 'nothing is sent for Full Fund, both copies are as they were, and the line says why',
      J([B.ev('window.__n.length'), B.ev(`localStorage.getItem('prio27ff')`) === ls0, B.ev('JSON.stringify(PUBS.ff)') === pub0,
        /Full Fund was not sent back — this browser holds Full Fund work the saved file does not have, and the file’s copy is newer/.test(w3sStat(B))]),
      J([0, true, true, true]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  w3Release(__bm);
})();
// ---- end RV1-B ----

// ---- RV1-C (Save and the import doors) ----
// ---- end RV1-C ----

// ---- RV1-D (held findings and older files) ----
// v2.14 RV1-D (u35-place-key-misplaces-typing): THE RCN / EEIC LIST HOLDS TYPING IN A ROW WITH NO KEY OF ITS OWN BY WHAT THE ROW HOLDS,
// NEVER BY ITS PLACE. Such a row (no text key, or the key of an earlier row: the user's own board and the team's folder copy may carry
// them) was held as '#'+its place; a load that put a row above it put the typing on the row that moved into that place, and leaving the
// field overwrote that row's code. FAILS ON 44aa984: (a) NOKEY-ONE becomes 99999 and NOKEY-TWO keeps 33333; (b) K1-REPEAT-B is
// overwritten; (c) a row that only moved loses the typing and is said to be gone; (d) a changed row takes the typing; (e) the second
// of two identical rows is held as the first's place too -- (e) passes there (a CONTROL for the count of identical rows).
await (async () => {
  const name = 'v2.14 RV1-D — the RCN / EEIC list holds typing in a row with no key of its own by what the row holds, never by its place (u35-place-key-misplaces-typing)';
  try {
    const J = JSON.stringify;
    const mk = (id, ask) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Rec ' + id, event: 'EV-' + id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
    const board = (rcn) => {
      const B = boot();
      seed(B.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [mk('A', [100, 20, 10])], disc: [1000, 100, 100], mand: [100, 10, 10], order: ['A'] });
      B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S);
        MS.rcn=${J(rcn)}; save(); window.confirm=function(){ return true; }; window.alert=function(){}; rcnOpen=true; render(); 'ok'`);
      return B;
    };
    const row = (t, rcn, k) => Object.assign(k === undefined ? {} : { k }, { rcn, eeic: 'E' + rcn.slice(0, 4), t, svc: ['USAF'] });
    const typeIn = (B, title, v) => B.ev(`(function(){ var r=[].filter.call(document.querySelectorAll('#rcnBody tr'), function(r){ var i=r.querySelectorAll('input.btn'); return i[2] && i[2].value===${J(title)}; })[${title === 'TWIN' ? 1 : 0}];
      var i=r.querySelectorAll('input.btn')[0]; i.focus(); i.value=${J(v)}; i.dispatchEvent(new Event('input', {bubbles:true})); return 'ok'; })()`);
    const load = (B, js) => B.ev(`(function(){ var st=JSON.parse(JSON.stringify(MS)); (function(L){ ${js} })(st.rcn); st.ts=Date.now()+5; applyStore(st); render(); return 'ok'; })()`);
    const focused = B => B.ev(`(function(){ var a=document.activeElement; var r=a && a.closest && a.closest('#rcnBody tr'); return r? JSON.stringify([r.querySelectorAll('input.btn')[2].value, a.value]) : 'none'; })()`);
    const leave = B => B.ev(`(function(){ var a=document.activeElement; if(a && a.blur) a.blur(); return 'ok'; })()`);
    const stored = B => B.ev(`JSON.stringify(MS.rcn.map(function(e){ return [e.t, e.rcn]; }))`);
    const said = B => B.ev(`(document.getElementById('shareStat')||{}).textContent||''`);
    // (a) two rows with no key; a load adds a keyless row above them: the typing stays with NOKEY-TWO
    {
      const B = board([row('KEYED', '11111', 'rA'), row('NOKEY-ONE', '22222'), row('NOKEY-TWO', '33333')]);
      typeIn(B, 'NOKEY-TWO', '99999');
      load(B, `L.splice(1, 0, {rcn:'44444', eeic:'DDDDD', t:'NOKEY-NEW', svc:['USAF']});`);
      chk(name, '(a) no key', 'after the load the typing is still in NOKEY-TWO’s field, with the keyboard', focused(B), J(['NOKEY-TWO', '99999']));
      leave(B);
      chk(name, '(a) no key', 'leaving it commits it to NOKEY-TWO; NOKEY-ONE keeps 22222', stored(B), J([['KEYED', '11111'], ['NOKEY-NEW', '44444'], ['NOKEY-ONE', '22222'], ['NOKEY-TWO', '99999']]));
      chk(name, 'errors · (a)', 'no page error', String(B.errors.length), '0');
    }
    // (b) rows repeating an earlier row's key; a colleague's ✕ on the keyed row above, loaded: the typing stays with K1-REPEAT-A
    {
      const B = board([row('TOP', '11111', 'rX'), row('K1-FIRST', '22222', 'K1'), row('K1-REPEAT-A', '33333', 'K1'), row('K1-REPEAT-B', '55555', 'K1')]);
      typeIn(B, 'K1-REPEAT-A', '99999');
      load(B, `L.shift();`);
      leave(B);
      chk(name, '(b) a repeated key', 'leaving it commits it to K1-REPEAT-A; K1-FIRST and K1-REPEAT-B keep theirs', stored(B), J([['K1-FIRST', '22222'], ['K1-REPEAT-A', '99999'], ['K1-REPEAT-B', '55555']]));
    }
    // (c) a row with no key that only moved: the typing follows it, and nothing says it is gone
    {
      const B = board([row('TOP', '11111', 'rX'), row('NOKEY-TWO', '33333')]);
      typeIn(B, 'NOKEY-TWO', '99999');
      load(B, `L.shift();`);
      chk(name, '(c) moved', 'the row moved up: the typing is in its field, and nothing says the row is gone', J([focused(B), /no longer on the list/.test(said(B))]), J([J(['NOKEY-TWO', '99999']), false]));
      leave(B);
      chk(name, '(c) moved', 'leaving it commits it to NOKEY-TWO', stored(B), J([['NOKEY-TWO', '99999']]));
    }
    // (d) a row with no key that the load changed (its title): the typing is put on no row, nothing changes, and the board says why
    {
      const B = board([row('KEYED', '11111', 'rA'), row('NOKEY-ONE', '22222'), row('NOKEY-TWO', '33333')]);
      typeIn(B, 'NOKEY-TWO', '99999');
      load(B, `L[2].t='NOKEY-TWO RENAMED';`);
      chk(name, '(d) changed', 'no field holds the typing, and the list is the copy loaded',
        J([B.ev(`String([].some.call(document.querySelectorAll('#rcnBody input'), function(i){ return i.value==='99999'; }))`), stored(B)]),
        J(['false', J([['KEYED', '11111'], ['NOKEY-ONE', '22222'], ['NOKEY-TWO RENAMED', '33333']])]));
      chk(name, '(d) changed', 'and the board says the row has no key of its own and is not on the list as it was',
        said(B).indexOf('⚠ What you were typing in the RCN / EEIC list (“99999”) was not kept: the row it was in has no key of its own, and the list as loaded no longer holds that row as it was. Nothing was changed.') >= 0, true);
    }
    // (e) two identical rows with no key: typing in the second stays in the second across a redraw
    {
      const B = board([row('TWIN', '44444'), row('TWIN', '44444')]);
      typeIn(B, 'TWIN', '99999');
      B.ev(`render(); 'ok'`); leave(B);
      chk(name, '(e) two alike', 'leaving it commits it to the second of the two', stored(B), J([['TWIN', '44444'], ['TWIN', '99999']]));
    }
    // v2.14 RV1-D (the check of this fix): THE FIRST ROW OF A REPEATED KEY WAS STILL HELD BY ITS KEY. A colleague's ordinary ✕ on that
    // row, loaded, left the repeat the first row with the key, and the typing (99999) overwrote the repeat's own code (33333). And a key
    // one row carries became two rows' by a load that added a row with it above: the new row took the key, and the typing. FAILS ON
    // 44aa984 AND ON THE FIRST CUT OF THIS FIX: (f) and (h) the typing lands on another row and is saved there; (g) and (h) a row that
    // is still there as it was loses the typing; (i) the words say a row that is still there is gone.
    // (f) typing in the FIRST of two rows sharing K1 (a keyed row above); a colleague's ✕ removes that row: kept on no row, and said
    {
      const B = board([row('TOP', '11111', 'rX'), row('K1-FIRST', '22222', 'K1'), row('K1-REPEAT', '33333', 'K1')]);
      typeIn(B, 'K1-FIRST', '99999');
      load(B, `L.splice(1, 1);`);
      chk(name, '(f) the first of a repeated key', 'no field holds the typing after the row it was in was removed',
        B.ev(`String([].some.call(document.querySelectorAll('#rcnBody input'), function(i){ return i.value==='99999'; }))`), 'false');
      leave(B);
      chk(name, '(f) the first of a repeated key', 'leaving changes nothing: K1-REPEAT keeps its own 33333', stored(B), J([['TOP', '11111'], ['K1-REPEAT', '33333']]));
      chk(name, '(f) the first of a repeated key', 'and the board says the row has no key of its own and is not on the list as it was',
        said(B).indexOf('was not kept: the row it was in has no key of its own, and the list as loaded no longer holds that row as it was') >= 0, true);
    }
    // (g) typing in the SECOND of two rows sharing K1; a colleague's ✕ removes the first, so the key becomes this row's alone: kept
    {
      const B = board([row('TOP', '11111', 'rX'), row('K1-FIRST', '22222', 'K1'), row('K1-REPEAT', '33333', 'K1')]);
      typeIn(B, 'K1-REPEAT', '99999');
      load(B, `L.splice(1, 1);`);
      chk(name, '(g) a repeated key becomes one row’s', 'the typing is still in K1-REPEAT’s field, with the keyboard', focused(B), J(['K1-REPEAT', '99999']));
      leave(B);
      chk(name, '(g) a repeated key becomes one row’s', 'leaving it commits it to K1-REPEAT', stored(B), J([['TOP', '11111'], ['K1-REPEAT', '99999']]));
    }
    // (h) typing in K2-ONLY, the one row with K2; a load adds a row with K2 above it: the typing stays with K2-ONLY, the new row keeps 44444
    {
      const B = board([row('TOP', '11111', 'rX'), row('K2-ONLY', '22222', 'K2')]);
      typeIn(B, 'K2-ONLY', '99999');
      load(B, `L.splice(1, 0, {k:'K2', rcn:'44444', eeic:'DDDDD', t:'K2-NEW', svc:['USAF']});`);
      chk(name, '(h) a key becomes shared', 'the typing is still in K2-ONLY’s field, with the keyboard', focused(B), J(['K2-ONLY', '99999']));
      leave(B);
      chk(name, '(h) a key becomes shared', 'leaving it commits it to K2-ONLY; the row the load added keeps its own 44444',
        stored(B), J([['TOP', '11111'], ['K2-NEW', '44444'], ['K2-ONLY', '99999']]));
    }
    // (i) the same, but the load also changed K2-ONLY's title: kept on no row, and never said to be off the list (K2 is still on it)
    {
      const B = board([row('TOP', '11111', 'rX'), row('K2-ONLY', '22222', 'K2')]);
      typeIn(B, 'K2-ONLY', '99999');
      load(B, `L[1].t='K2-ONLY RENAMED'; L.splice(1, 0, {k:'K2', rcn:'44444', eeic:'DDDDD', t:'K2-NEW', svc:['USAF']});`);
      leave(B);
      chk(name, '(i) shared and changed', 'leaving changes nothing: every row keeps its own code', stored(B), J([['TOP', '11111'], ['K2-NEW', '44444'], ['K2-ONLY RENAMED', '22222']]));
      chk(name, '(i) shared and changed', 'the board says the row is not on the list as it was, not that it is no longer on the list',
        J([said(B).indexOf('the list as loaded no longer holds that row as it was') >= 0, /is no longer on the list/.test(said(B))]), J([true, false]));
      chk(name, 'errors · (f)–(i)', 'no page error', String(B.errors.length), '0');
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
})();
// v2.14 RV1-D (held, also noticed): PUT BACK OF A FIELD OF AN ADDED REQUIREMENT THAT HAS LEFT ITS YEAR IS REFUSED. Deleting one purges
// everything the year keeps under its id, each container a journal line (['desc','NEW-1'] ...), and Put back of one wrote the value under
// an id no requirement carries and said "put back". FAILS ON 44aa984: (a) S.desc holds NEW-1 again and the status says it was put back.
await (async () => {
  const name = 'v2.14 RV1-D — Put back of a field of an added requirement that has left its year is refused, never written under an id nothing carries (held, also noticed)';
  try {
    const J = JSON.stringify;
    const mk = (id, ask) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Req ' + id, event: 'E' + id, ccar: '', fy26: [0, 0, 0], ask, alloc: null });
    const B = boot();
    seed(B.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [mk('A', [900, 200, 100])], disc: [2000, 600, 300], mand: [500, 150, 80], order: ['A'] });
    B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save();
      localStorage.setItem('prio27who','Pat'); window.__cf=0; window.confirm=function(){ window.__cf++; return true; }; window.alert=function(){};
      window.__rn=Date.now; window.__tk=0; Date.now=function(){ return window.__rn.call(Date)+window.__tk; }; 'ok'`);
    const later = () => B.ev(`window.__tk+=61000; 'ok'`);
    const X = B.ev(`(function(){ var a=reqCreate('AV', {title:'X', event:'EX', ask:[100,0,0]}); save(); render(); return a; })()`);
    const Y = B.ev(`(function(){ var a=reqCreate('AV', {title:'Y', event:'EY', ask:[200,0,0]}); save(); render(); return a; })()`);
    later(); B.ev(`setDesc(${J(X)}, 'the description'); setNote(${J(X)}, 'a note'); setDesc('A', 'A1'); setDesc(${J(Y)}, 'Y1'); 'ok'`);
    later(); B.ev(`setDesc('A', 'A2'); setDesc(${J(Y)}, 'Y2'); 'ok'`);
    later(); B.ev(`removeReq(${J(X)}); removeReq('A'); 'ok'`);
    const L = JSON.parse(B.ev(`JSON.stringify((MS.jrnl||[]).map(function(e,i){ return [i, e.p, e.a, e.b]; }))`));
    const purge = L.filter(x => J(x[1]) === J(['desc', X]) && x[3] === null).pop() || [-1];
    const typed = L.filter(x => J(x[1]) === J(['notes', X]) && x[2] === null).pop() || [-1];
    chk(name, 'fixture', 'X is gone from the year, and its delete wrote a line clearing its description', J([B.ev(`String(S.custom.some(function(c){ return c.id===${J(X)}; }))`), purge[0] >= 0, typed[0] >= 0]), J(['false', true, true]));
    // (a) Put back of the purge line
    const cf0 = +B.ev('window.__cf'), j0 = +B.ev('MS.jrnl.length');
    later(); B.ev(`jrnlUndo(${purge[0]}); 'ok'`);
    chk(name, '(a) the purge line', 'Put back asks nothing, writes nothing under X’s id, adds no journal line',
      J([+B.ev('window.__cf') - cf0, B.ev(`String(Object.prototype.hasOwnProperty.call(S.desc, ${J(X)}))`), +B.ev('MS.jrnl.length') - j0]), J([0, 'false', 0]));
    chk(name, '(a) the purge line', 'and says the added requirement is no longer in the year',
      /Not put back.*that added requirement is no longer in FY27\. Nothing was changed\./.test(B.ev(`(document.getElementById('shareStat')||{}).textContent`)), true);
    // (b) the line that set its note, the same
    later(); B.ev(`jrnlUndo(${typed[0]}); 'ok'`);
    chk(name, '(b) an earlier line', 'Put back of the line that wrote X’s note is refused the same way', J([B.ev(`String(Object.prototype.hasOwnProperty.call(S.notes, ${J(X)}))`), +B.ev('MS.jrnl.length') - j0]), J(['false', 0]));
    // (c) CONTROL: a requirement from the board's data, removed, keeps its fields -- its description is put back as before
    const al = L.filter(x => J(x[1]) === J(['desc', 'A']) && x[3] === 'A2').pop() || [-1];
    later(); B.ev(`jrnlUndo(${al[0]}); 'ok'`);
    chk(name, '(c) CONTROL', 'A, from the board’s data and removed, has its description put back (A2 → A1)', B.ev(`String(S.desc.A)`), 'A1');
    // (d) CONTROL: an added requirement still in the year has its description put back as before
    const yl = L.filter(x => J(x[1]) === J(['desc', Y]) && x[3] === 'Y2').pop() || [-1];
    later(); B.ev(`jrnlUndo(${yl[0]}); 'ok'`);
    chk(name, '(d) CONTROL', 'Y, an added requirement still in the year, has its description put back (Y2 → Y1)', B.ev(`String(S.desc[${J(Y)}])`), 'Y1');
    chk(name, 'errors', 'no page error', String(B.errors.length), '0');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
})();
// ---- end RV1-D ----
// ==== end v2.14 review round 1 fixes ====
// ==== v2.14 review round 2 fixes ====
// ---- RV2-A (the file route and Save) ----
// ---- end RV2-A ----
// ---- RV2-B (other appropriations, cycles and packages) ----
// v2.14 RV2-B (carry-and-held-lost-on-next-write, carry-then-held-misfire): A PLAN CARRIED ON THIS PAGE STAYS CARRIED THROUGH THIS PAGE'S
// OWN LATER WRITES. The storage route of RV1-B's carry check -- Full Fund and Initial Spares in this browser, their records unsaved,
// O&M's Save first -- with browser storage refusing BOTH plans from then on. RV1-B's carry held only while this page's copy kept the
// exact time it was carried with: one ⬆ Issue or ladder copy storage refused moved it, and from then on the page read its own copy as
// "this browser's unsaved work passed over by a newer copy" -- the second cycle left the plans out, a second Issue and ⬆ Send back were
// refused ("the file's copy is newer", untrue), Save left their records unsaved, and their board's opening in a full browser did not
// open the file at all: the cycle and the issue ledger just saved were not on screen (r2a-packages p3/p4, r2a-seams p2). Every
// expectation is a literal of the fixture or read from the bytes Save wrote.
await (async () => {
  const __bm = w3Mark();
  const name = 'v2.14 RV2-B — a plan carried on this page stays carried through ⬆ Issue and the ladder copy browser storage refuses: a second cycle, a second Issue, ⬆ Send back, Save and its opening in a full browser (carry-and-held-lost-on-next-write)';
  try {
    const J = JSON.stringify;
    const B = await w3sFresh();
    const base = JSON.parse(B.ev('JSON.stringify(MS)'));
    const FFN = 'FF-' + 'f'.repeat(600), SPN = 'SP-' + 's'.repeat(600);
    const ff = JSON.parse(J(base)); ff.ts = Date.now() - 5000; ff.by = 'FF Lead'; ff.years[ff.cur].notes = { A: FFN };
    const sp = JSON.parse(J(base)); sp.ts = Date.now() - 6000; sp.by = 'SP Lead'; sp.years[sp.cur].notes = { A: SPN };
    B.ev(`localStorage.setItem('prio27ff', ${J(J(ff))}); localStorage.setItem('prio27ff.base', ${J(J({ file: 0, dirty: true }))});
      localStorage.setItem('prio27sp', ${J(J(sp))}); localStorage.setItem('prio27sp.base', ${J(J({ file: 0, dirty: true }))});
      for (var k in PUBS) delete PUBS[k]; writerKey(); localStorage.setItem('prio27who','BL');
      window.__q=[]; window.confirm=function(m){ window.__q.push(String(m)); return true; }; window.alert=function(){};
      URL.createObjectURL=function(){ return 'blob:x'; }; HTMLAnchorElement.prototype.click=function(){}; ${W3S_FH} 'ok'`);
    await B.ev('saveInPlaceFile()'); await w3sSleep(20);
    const lsFF0 = B.ev(`localStorage.getItem('prio27ff')`), lsSP0 = B.ev(`localStorage.getItem('prio27sp')`);
    // browser storage has no room left for either plan
    B.ev(`window.__si2=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(k==='prio27ff'||k==='prio27sp') throw new DOMException('The quota has been exceeded.','QuotaExceededError'); return window.__si2.call(this,k,v); }; 'ok'`);
    const held = () => J([B.ev(`String(apStoreOf('ff').held)`), B.ev(`String(apStoreOf('sp').held)`)]);
    const blob = code => { B.ev(`window.__blob=null; window.__B0=window.Blob; window.Blob=function(p,o){ window.__blob=String(p&&p[0]); return new window.__B0(p,o); }; ${code}; window.Blob=window.__B0; 'ok'`); return B.ev('String(window.__blob)'); };
    const r1 = B.ev(`String(cycApplyAll('PB|2028'))`);
    chk(name, 'the cycle', 'carried on this page, every appropriation on PB28, neither read as held (a CONTROL)',
      J([r1, B.ev('String((PUBS.ff||{}).cycle)'), B.ev('String((PUBS.sp||{}).cycle)'), held()]), J(['true', 'PB|2028', 'PB|2028', J(['false', 'false'])]));
    // ⬆ Issue Initial Spares: issued; storage refuses its ledger, so this page holds it
    const i1 = blob(`pkgIssue('sp', true)`);
    chk(name, '⬆ Issue', 'Initial Spares is issued from this page’s copy (its work and PB28), and is still not read as held',
      J([i1.indexOf(SPN) >= 0, i1.indexOf('"cycle":"PB|2028"') >= 0, held()]), J([true, true, J(['false', 'false'])]));
    // ⚖ the ladder copied to every appropriation: storage refuses both
    B.ev(`(function(){ const L=JSON.parse(JSON.stringify(BANDS_LIST())); L[0].n='RV2B LADDER'; bandSave(L); window.__q.length=0; bandCopyAll(); return 'ok'; })()`);
    const lad = w3sStat(B);
    chk(name, '⚖ the ladder', 'both get it on this page, neither is then read as held, and the line names both refusals (also-noticed: two refused writes)',
      J([B.ev(`String(((PUBS.ff||{}).bands||[{}])[0].n)`), B.ev(`String(((PUBS.sp||{}).bands||[{}])[0].n)`), held(), /Browser storage refused Full Fund, Initial Spares/.test(lad)]),
      J(['RV2B LADDER', 'RV2B LADDER', J(['false', 'false']), true]));
    chk(name, '⚖ the ladder', 'browser storage still holds exactly what it held of both plans', J([B.ev(`localStorage.getItem('prio27ff')`) === lsFF0, B.ev(`localStorage.getItem('prio27sp')`) === lsSP0]), J([true, true]));
    // a second cycle choice moves both; nothing is left out as holding work the saved file does not have
    B.ev(`window.__q=[]; 'ok'`);
    const r2 = B.ev(`String(cycApplyAll('BES|2028'))`);
    chk(name, 'a second choice', 'BES28 for every appropriation: neither is left out, both move',
      J([r2, /NOT changed/.test(B.ev('window.__q.join(" ")')), B.ev('String((PUBS.ff||{}).cycle)'), B.ev('String((PUBS.sp||{}).cycle)'), held()]),
      J(['true', false, 'BES|2028', 'BES|2028', J(['false', 'false'])]));
    // a second ⬆ Issue of Initial Spares, and ⬆ Send back of Full Fund
    const i2 = blob(`pkgIssue('sp', true)`), sb = blob(`pkgSendBack('ff')`);
    chk(name, 'a second Issue, ⬆ Send back', 'Initial Spares goes out as package #2 on BES28, Full Fund goes back with its work and the ladder; nothing says “the file’s copy is newer”',
      J([/"seq":2\b/.test(i2), i2.indexOf('"cycle":"BES|2028"') >= 0, sb.indexOf(FFN) >= 0, sb.indexOf('RV2B LADDER') >= 0, /file’s copy is newer/.test(w3sStat(B))]),
      J([true, true, true, true, false]));
    // 💾 Save writes both; their records say saved against this save
    await B.ev('saveInPlaceFile()'); await w3sSleep(20);
    const file = B.ev('window.__fw.content');
    const pub = JSON.parse((file.match(/id="pubState">([\s\S]*?)<\/script>/) || [])[1] || 'null') || { appns: {} };
    const wrote = Math.max(0, ...Object.values(pub.appns).map(s => (s && s.ts) || 0));
    const fSP = pub.appns.sp || {}, fFF = pub.appns.ff || {};
    chk(name, '💾 Save', 'the file holds Full Fund and Initial Spares on BES28 with their work, the ladder and package #2',
      J([fFF.cycle, fSP.cycle, J(fFF).indexOf(FFN) >= 0, J(fSP).indexOf(SPN) >= 0, ((fFF.bands || [{}])[0] || {}).n, ((fSP.sync || {}).seq)]),
      J(['BES|2028', 'BES|2028', true, true, 'RV2B LADDER', 2]));
    chk(name, '💾 Save', 'both records say their work is saved, in this save; neither is read as held',
      J([JSON.parse(B.ev(`localStorage.getItem('prio27ff.base')`)), JSON.parse(B.ev(`localStorage.getItem('prio27sp.base')`)), held()]),
      J([{ file: wrote, dirty: false }, { file: wrote, dirty: false }, J(['false', 'false'])]));
    // Initial Spares opened from that file in this same full browser: the file opens, nothing is held back or kept aside
    B.ev(`Storage.prototype.setItem=window.__si2; 'ok'`);
    const LS = JSON.parse(w3sLs(B)), size = Object.keys(LS).reduce((t, k) => t + k.length + LS[k].length, 0);
    const S2 = boot({ html: file, appn: 'INITIAL SPARES', ls: LS, quota: size + 50 }); await w3sSleep(40);
    chk(name, 'Initial Spares opens, browser full', 'on BES28 with its work and package #2 on screen, nothing kept aside, and not “this browser holds work that is in no saved copy”',
      J([S2.ev('mySlug()'), S2.ev('MS.cycle'), S2.ev(`String(((MS.sync||{}).seq))`), S2.ev(`String(JSON.stringify(MS).indexOf(${J(SPN)})>=0)`),
        S2.ev(`String(localStorage.getItem('prio27sp.kept')!==null)`), /in no saved copy/.test(w3sStat(S2))]),
      J(['sp', 'BES|2028', '2', 'true', 'false', false]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  w3Release(__bm);
})();
// v2.14 RV2-B (also-noticed: cycCarrySaved): A CARRIED PLAN WHOSE RECORD 💾 SAVE CANNOT WRITE STAYS CARRIED, AND THE NEXT SAVE RECORDS IT.
// The entry went whatever the record write did, so a record storage refused left the plan read as held from then on -- the next ⬆ Issue
// was refused, the next cycle left it out -- and the next Save, with room again, never recorded it saved (rv2-B q1).
await (async () => {
  const __bm = w3Mark();
  const name = 'v2.14 RV2-B — a carried plan whose record 💾 Save cannot write stays carried, and the next Save records it saved (also-noticed: cycCarrySaved)';
  try {
    const J = JSON.stringify;
    const B = await w3sFresh();
    const base = JSON.parse(B.ev('JSON.stringify(MS)'));
    const sp = JSON.parse(J(base)); sp.ts = Date.now() - 6000; sp.by = 'SP Lead'; sp.years[sp.cur].notes = { A: 'SP-WORK' };
    B.ev(`localStorage.setItem('prio27sp', ${J(J(sp))}); localStorage.setItem('prio27sp.base', ${J(J({ file: 0, dirty: true }))});
      for (var k in PUBS) delete PUBS[k]; writerKey(); localStorage.setItem('prio27who','BL');
      window.__q=[]; window.confirm=function(m){ window.__q.push(String(m)); return true; }; window.alert=function(){};
      URL.createObjectURL=function(){ return 'blob:x'; }; HTMLAnchorElement.prototype.click=function(){}; ${W3S_FH} 'ok'`);
    await B.ev('saveInPlaceFile()'); await w3sSleep(20);
    // v2.15 W2 (item 143): that Save now records Initial Spares saved (it wrote it exactly as storage held it); the fixture puts the
    // record back to unsaved, as an edit there would, so a carry forgotten on a refused record still reads as held (what this guards)
    B.ev(`localStorage.setItem('prio27sp.base', ${J(J({ file: 0, dirty: true }))}); 'ok'`);
    B.ev(`window.__si2=Storage.prototype.setItem; window.__refuse={'prio27sp':1}; Storage.prototype.setItem=function(k,v){ if(window.__refuse[k]) throw new DOMException('The quota has been exceeded.','QuotaExceededError'); return window.__si2.call(this,k,v); }; 'ok'`);
    const r1 = B.ev(`String(cycApplyAll('PB|2028'))`);
    chk(name, 'the cycle', 'carried, and Initial Spares not read as held (a CONTROL)', J([r1, B.ev(`String(apStoreOf('sp').held)`)]), J(['true', 'false']));
    // 💾 Save, with storage refusing Initial Spares' record as well
    B.ev(`window.__refuse['prio27sp.base']=1; 'ok'`);
    await B.ev('saveInPlaceFile()'); await w3sSleep(20);
    chk(name, '💾 Save, its record refused', 'the record is as it was, and Initial Spares is still not read as held',
      J([JSON.parse(B.ev(`localStorage.getItem('prio27sp.base')`)), B.ev(`String(apStoreOf('sp').held)`)]), J([{ file: 0, dirty: true }, 'false']));
    B.ev(`window.__blob=null; window.__B0=window.Blob; window.Blob=function(p,o){ window.__blob=String(p&&p[0]); return new window.__B0(p,o); }; pkgIssue('sp', true); window.Blob=window.__B0; window.__q=[]; 'ok'`);
    const r2 = B.ev(`String(cycApplyAll('BES|2028'))`);
    chk(name, 'after it', '⬆ Issue Initial Spares issues it, and the next cycle moves it',
      J([B.ev(`String((window.__blob||'').indexOf('SP-WORK')>=0)`), r2, /Initial Spares — NOT changed/.test(B.ev('window.__q.join(" ")')), B.ev('String((PUBS.sp||{}).cycle)')]),
      J(['true', 'true', false, 'BES|2028']));
    // room again: the next 💾 Save records it saved
    B.ev(`window.__refuse={}; 'ok'`);
    await B.ev('saveInPlaceFile()'); await w3sSleep(20);
    const pub = JSON.parse((B.ev('window.__fw.content').match(/id="pubState">([\s\S]*?)<\/script>/) || [])[1] || 'null') || { appns: {} };
    const wrote = Math.max(0, ...Object.values(pub.appns).map(s => (s && s.ts) || 0));
    chk(name, 'the next 💾 Save', 'Initial Spares’ record says its work is saved, in that save', JSON.parse(B.ev(`localStorage.getItem('prio27sp.base')`)), { file: wrote, dirty: false });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  w3Release(__bm);
})();
// v2.14 RV2-B (also-noticed: the record): ANOTHER APPROPRIATION THIS PAGE WRITES INTO BROWSER STORAGE IS RECORDED UNSAVED. ⬆ Issue, ⚖ the
// ladder copy and a package taken wrote Full Fund into browser storage and left its record saying "saved", so a newer board file opened
// later on Full Fund's own board replaced that work with nothing kept aside: the issue ledger, the ladder, the package's note (rv2-B q2).
// Then a CONTROL: 💾 Save of the page's file records it saved again, and its board opens that file keeping nothing aside.
await (async () => {
  const __bm = w3Mark();
  const name = 'v2.14 RV2-B — another appropriation this page writes into browser storage is recorded unsaved, so a newer file opened later keeps it aside (also-noticed: the record)';
  try {
    const J = JSON.stringify;
    const MINE = ['USAF', 'ANG', 'AFRC'];
    const SCO = { services: MINE, items: [it('A', 'AV', [900, 200, 100]), it('B', 'PSM', [400, 100, 50])], disc: [1200, 300, 150], mand: [100, 20, 10], order: ['A', 'B'] };
    const SCF = { services: MINE, items: [it('F', 'AV', [700, 100, 60]), it('G', 'TSS', [500, 90, 30])], disc: [900, 150, 60], mand: [200, 40, 20], order: ['F', 'G'] };
    const asBuilt = (ev, sc) => ev(`(function(){ BASE_ITEMS.length=0; ${J(sc.items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); return 'ok'; })()`);
    const lsOf = ev => JSON.parse(ev(`JSON.stringify((function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return o; })())`));
    const MARK = { issue: '"issuedTs"', ladder: 'RV2B RECORD LADDER', apply: 'FROM THE PACKAGE' };
    for (const how of ['issue', 'ladder', 'apply']) {
      // Full Fund's board, saved into the file this browser opens; this browser keeps that copy, recorded saved against it
      const F = boot({ appn: 'FULL FUND' }); seed(F.ev, SCF); asBuilt(F.ev, SCF);
      F.ev(`MS.years[MS.cur]=S; S.notes={F:'FF note'}; save(); 'ok'`);
      const O = boot({ html: F.ev('buildSavedHtml()'), appn: 'O&M' }); seed(O.ev, SCO); asBuilt(O.ev, SCO); O.ev(`MS.years[MS.cur]=S; save(); 'ok'`);
      const FILE1 = O.ev('buildSavedHtml()');
      const ffTs = JSON.parse(/id="pubState">([\s\S]*?)<\/script>/.exec(FILE1)[1]).appns.ff.ts;
      const LS = lsOf(F.ev); LS['prio27ff.base'] = J({ file: ffTs, folder: {}, dirty: false }); LS.prio27appn = 'O&M';
      const B = boot({ html: FILE1, ls: LS }); await w3sSleep(30);
      B.ev(`window.confirm=function(){ return true; }; window.alert=function(){}; URL.createObjectURL=function(){ return 'blob:x'; }; HTMLAnchorElement.prototype.click=function(){}; 'ok'`);
      if (how === 'issue') B.ev(`pkgIssue('ff', true); 'ok'`);
      else if (how === 'ladder') B.ev(`(function(){ var L=JSON.parse(JSON.stringify(BANDS_LIST())); L[0].n='RV2B RECORD LADDER'; bandSave(L); bandCopyAll(); return 'ok'; })()`);
      else {
        const ms = JSON.parse(B.ev(`JSON.stringify(pkgStrip(pkgStoreOf('ff')))`)); ms.years[ms.cur].notes = { F: 'FROM THE PACKAGE' };
        B.ev(`pkgApply(${J({ spmtPkg: B.ev('PKG_VER'), dir: 'issue', ap: 'ff', apName: 'Full Fund', seq: 1, ts: Date.now(), by: 'FF Mgr', baseSig: 'x', ms })}, 'p.json'); 'ok'`);
      }
      chk(name, how, 'browser storage holds Full Fund with this page’s work on it (a CONTROL)', B.ev(`String((localStorage.getItem('prio27ff')||'').indexOf(${J(MARK[how])})>=0)`), 'true');
      chk(name, how, 'and Full Fund’s record now says this browser holds work no saved file has', JSON.parse(B.ev(`localStorage.getItem('prio27ff.base')`)).dirty, true);
      // nobody saves here; another machine saves the board file with a newer Full Fund (H added)
      await w3sSleep(10);
      F.ev(`reqCreate('AV', {title:'H added later', event:'EV-H', ask:[5000000,0,0]}); save(); 'ok'`);
      const LS2 = lsOf(B.ev); LS2.prio27appn = 'FULL FUND';
      const FF = boot({ html: F.ev('buildSavedHtml()'), ls: LS2 }); await w3sSleep(40);
      chk(name, how, 'Full Fund opens the newer file and keeps this page’s work aside, whole, not lost',
        J([FF.ev('mySlug()'), FF.ev('JSON.stringify(S.order)'), FF.ev(`String((localStorage.getItem('prio27ff.kept')||'').indexOf(${J(MARK[how])})>=0)`)]),
        J(['ff', J(['F', 'G', 'NEW-1']), 'true']));
      if (how === 'issue') {
        // CONTROL: the page's own Save writes it; the record says saved in that save; Full Fund opens that file keeping nothing aside
        B.ev(`writerKey(); localStorage.setItem('prio27who','BL'); ${W3S_FH} window.__fw.content=${J(FILE1)}; LASTKNOWN=PUB_FILE_TS; 'ok'`);
        await B.ev('saveInPlaceFile()'); await w3sSleep(30);
        const file = B.ev('window.__fw.content');
        const pub = JSON.parse((file.match(/id="pubState">([\s\S]*?)<\/script>/) || [])[1] || 'null') || { appns: {} };
        const wrote = Math.max(0, ...Object.values(pub.appns).map(s => (s && s.ts) || 0));
        chk(name, 'issue, then 💾 Save', 'the file carries the issue, and Full Fund’s record says saved in that save',
          J([J(pub.appns.ff || {}).indexOf('"issuedTs"') >= 0, JSON.parse(B.ev(`localStorage.getItem('prio27ff.base')`)).dirty, JSON.parse(B.ev(`localStorage.getItem('prio27ff.base')`)).file]), J([true, false, wrote]));
        const LS3 = lsOf(B.ev); LS3.prio27appn = 'FULL FUND';
        const F3 = boot({ html: file, ls: LS3 }); await w3sSleep(40);
        chk(name, 'issue, then 💾 Save', 'Full Fund opens that file with the issue on screen, keeping nothing aside (a CONTROL)',
          J([F3.ev(`String(!!(MS.sync && MS.sync.issuedTs))`), F3.ev(`String(localStorage.getItem('prio27ff.kept')!==null)`)]), J(['true', 'false']));
      }
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  w3Release(__bm);
})();
// v2.14 RV2-B (held-ladder-promise-never-kept): ⚖ COPYING THE LADDER HOLDS NOTHING FOR AN APPROPRIATION WHOSE UNSAVED WORK IS BEHIND A NEWER
// COPY, AND SAYS IT WAS NOT COPIED. RV1-B held the ladder for it and promised it "goes on when that board opens, after its opening keeps
// that work aside": its opening's first, empty board took the held ladder and dropped the key before the work and the file's copy were
// put on screen, so the file's Full Fund opened on its old ladder with nothing said; and when storage refused another appropriation's
// write too, the closing line was skipped and Full Fund was not mentioned at all (r2a-packages p2, p5). The way the line now names --
// open it once, then copy again -- is held too.
await (async () => {
  const __bm = w3Mark();
  const name = 'v2.14 RV2-B — ⚖ copying the ladder holds nothing for an appropriation whose unsaved work is behind a newer copy, says it was not copied, and copying again after its board opens puts the ladder on it (held-ladder-promise-never-kept)';
  try {
    const J = JSON.stringify;
    const held = async (refuseSP) => {
      const B = await w3sFresh();
      const old = JSON.parse(B.ev('JSON.stringify(MS)')); old.ts = Date.now() - 60000; old.by = 'BL'; old.years[old.cur].notes = { A: 'UNSAVED IN THIS BROWSER' };
      const nw = JSON.parse(J(old)); nw.ts = Date.now() - 30000; nw.by = 'FF Lead'; nw.years[nw.cur].notes = { A: 'NEWER IN THE FILE' };
      B.ev(`localStorage.setItem('prio27ff', ${J(J(old))}); localStorage.setItem('prio27ff.base', ${J(J({ file: 1, dirty: true }))}); PUBS.ff=${J(nw)};
        writerKey(); localStorage.setItem('prio27who','BL');
        window.__q=[]; window.confirm=function(m){ window.__q.push(String(m)); return true; }; window.alert=function(){}; ${W3S_FH} 'ok'`);
      if (refuseSP) {
        const sp = JSON.parse(J(old)); sp.ts = Date.now() - 90000; sp.years[sp.cur].notes = { A: 'SP' };
        B.ev(`localStorage.setItem('prio27sp', ${J(J(sp))}); PUBS.sp=${J(sp)};
          window.__si2=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(k==='prio27sp') throw new DOMException('The quota has been exceeded.','QuotaExceededError'); return window.__si2.call(this,k,v); }; 'ok'`);
      }
      B.ev(`(function(){ var L=JSON.parse(JSON.stringify(BANDS_LIST())); L[0].n='RV2B HELD LADDER'; bandSave(L); window.__q.length=0; bandCopyAll(); return 'ok'; })()`);
      return B;
    };
    const B = await held(false);
    const q = B.ev('String(window.__q[0]||"")'), line = w3sStat(B);
    chk(name, 'the question', 'Full Fund is not among those that get the ladder, and is named as NOT copied, with why',
      J([/^Copy O&M’s ladder to Initial Spares, OPN\?/.test(q), /NOT copied to Full Fund — this browser holds Full Fund work the saved file does not have/.test(q)]), J([true, true]));
    chk(name, 'the line', 'it says Full Fund was not copied and how to copy it, and promises nothing for later',
      J([/Not copied to Full Fund — this browser holds Full Fund work the saved file does not have.*Open Full Fund once.*then copy the ladder again/.test(line), /goes on when/.test(line)]), J([true, false]));
    chk(name, 'nothing held', 'no ladder is held for Full Fund, and neither copy of it is written',
      J([B.ev(`localStorage.getItem(BAND_PEND_KEY('ff'))`), B.ev(`String(((PUBS.ff.years||{})[PUBS.ff.cur]||{}).notes.A)`), B.ev(`String(JSON.parse(localStorage.getItem('prio27ff')).years[MS.cur].notes.A)`)]),
      J([null, 'NEWER IN THE FILE', 'UNSAVED IN THIS BROWSER']));
    // this browser's Full Fund turning unsaved while the question is open (another tab of this browser, typing in Full Fund): read again
    // where it is written, it is left alone too -- nothing written, nothing held for it, named in the line
    { const C = await w3sFresh();
      const old = JSON.parse(C.ev('JSON.stringify(MS)')); old.ts = Date.now() - 60000; old.years[old.cur].notes = { A: 'OLDER HERE' };
      const nw = JSON.parse(J(old)); nw.ts = Date.now() - 30000; nw.years[nw.cur].notes = { A: 'NEWER IN THE FILE' };
      C.ev(`localStorage.setItem('prio27ff', ${J(J(old))}); localStorage.setItem('prio27ff.base', ${J(J({ file: 1, dirty: false }))}); PUBS.ff=${J(nw)};
        window.__q=[]; window.confirm=function(m){ window.__q.push(String(m)); localStorage.setItem('prio27ff.base', ${J(J({ file: 1, dirty: true }))}); return true; }; window.alert=function(){};
        (function(){ var L=JSON.parse(JSON.stringify(BANDS_LIST())); L[0].n='RV2B HELD LADDER'; MS.bands=L; MS.bandsTs=Date.now(); })(); bandCopyAll(); 'ok'`);
      chk(name, 'turned unsaved while asked', 'Full Fund was offered, then found unsaved where it is written: neither copy written, nothing held for it, and the line says not copied',
        J([/^Copy O&M’s ladder to Full Fund/.test(C.ev('String(window.__q[0]||"")')), C.ev(`String(((PUBS.ff.years||{})[PUBS.ff.cur]||{}).notes.A)`), C.ev(`String(JSON.parse(localStorage.getItem('prio27ff')).years[MS.cur].notes.A)`),
          C.ev(`localStorage.getItem(BAND_PEND_KEY('ff'))`), /Not copied to Full Fund — this browser holds Full Fund work the saved file does not have/.test(w3sStat(C))]),
        J([true, 'NEWER IN THE FILE', 'OLDER HERE', null, true])); }
    // storage refusing another appropriation's write as well: Full Fund is still named
    const B2 = await held(true);
    chk(name, 'with a write refused', 'the line still names Full Fund as not copied, and names Initial Spares’ refusal',
      J([/Not copied to Full Fund/.test(w3sStat(B2)), /Browser storage refused Initial Spares/.test(w3sStat(B2))]), J([true, true]));
    // the way forward: save, open Full Fund (it keeps the unsaved work aside), back to O&M and copy again -- it lands on the file's copy
    await B.ev('saveInPlaceFile()'); await w3sSleep(20);
    const file = B.ev('window.__fw.content');
    const F = boot({ html: file, appn: 'FULL FUND', ls: JSON.parse(w3sLs(B)) }); await w3sSleep(40);
    chk(name, 'Full Fund opens', 'the file’s copy on its own ladder, this browser’s work kept aside (a CONTROL)',
      J([F.ev('mySlug()'), F.ev(`String((S.notes||{}).A)`), F.ev(`String(localStorage.getItem('prio27ff.kept')!==null)`), F.ev(`String(BANDS_LIST()[0].n)==='RV2B HELD LADDER'`)]), J(['ff', 'NEWER IN THE FILE', 'true', false]));
    const O = boot({ html: file, appn: 'O&M', ls: JSON.parse(w3sLs(F)) }); await w3sSleep(40);
    O.ev(`window.confirm=function(){ return true; }; window.alert=function(){}; bandCopyAll(); 'ok'`);
    chk(name, 'copied again', 'from O&M once Full Fund has opened, the ladder goes on the file’s Full Fund',
      J([O.ev(`String(((PUBS.ff||{}).bands||[{}])[0].n)`), O.ev(`String((((PUBS.ff||{}).years||{})[(PUBS.ff||{}).cur]||{}).notes.A)`)]), J(['RV2B HELD LADDER', 'NEWER IN THE FILE']));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  w3Release(__bm);
})();
// v2.14 RV2-B (spruills-bydband-read-older-copy): THE SPRUILLS AND THE PRIORITY DRILL'S REQUIREMENTS BY BAND READ ANOTHER APPROPRIATION AS
// 💾 SAVE WRITES IT. The board file holds a Full Fund newer than this browser's clean copy -- requirement H, $5,000,000, added and saved
// elsewhere. Both read browser storage first whatever its age: the Spruills printed FY27 Full Fund requirements of $0 and the by-band
// sheet counted two Full Fund requirements, while Save, the five-year plan, FYDP Disconnects and packages all read three (r2a-seams p3).
await (async () => {
  const __bm = w3Mark();
  const name = 'v2.14 RV2-B — the Spruills and the Priority Drill’s requirements by band read another appropriation as 💾 Save writes it (spruills-bydband-read-older-copy)';
  try {
    const J = JSON.stringify;
    const MINE = ['USAF', 'ANG', 'AFRC'];
    const SCO = { services: MINE, items: [it('A', 'AV', [900, 200, 100]), it('B', 'PSM', [400, 100, 50])], disc: [1200, 300, 150], mand: [100, 20, 10], order: ['A', 'B'] };
    const SCF = { services: MINE, items: [it('F', 'AV', [700, 100, 60]), it('G', 'TSS', [500, 90, 30])], disc: [900, 150, 60], mand: [200, 40, 20], order: ['F', 'G'] };
    const H_ASK = 5000000;
    const asBuilt = (ev, sc) => ev(`(function(){ BASE_ITEMS.length=0; ${J(sc.items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); return 'ok'; })()`);
    const lsOf = ev => JSON.parse(ev(`JSON.stringify((function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return o; })())`));
    const F = boot({ appn: 'FULL FUND' }); seed(F.ev, SCF); asBuilt(F.ev, SCF);
    F.ev(`MS.years[MS.cur]=S; save(); 'ok'`);
    const LS_OLD = lsOf(F.ev); const ffOld = JSON.parse(LS_OLD.prio27ff);
    LS_OLD['prio27ff.base'] = J({ file: ffOld.ts, folder: {}, dirty: false });
    await w3sSleep(10);
    F.ev(`reqCreate('AV', {title:'H added later', event:'EV-H', ask:[${H_ASK},0,0]}); save(); 'ok'`);
    const O = boot({ html: F.ev('buildSavedHtml()'), appn: 'O&M' }); seed(O.ev, SCO); asBuilt(O.ev, SCO); O.ev(`MS.years[MS.cur]=S; save(); 'ok'`);
    const FILE = O.ev('buildSavedHtml()');
    const LS = Object.assign({}, LS_OLD); delete LS.prio27om; delete LS['prio27om.base']; LS.prio27appn = 'O&M';
    const B = boot({ html: FILE, ls: LS }); await w3sSleep(30);
    const ord = code => { try { const st = JSON.parse(B.ev(`JSON.stringify(${code})`)); return J(st.years[st.cur].order); } catch (e) { return 'n/a'; } };
    chk(name, 'the fixture', 'this browser’s Full Fund holds two requirements, the file’s three, and Save writes the file’s (a CONTROL)',
      J([J(ffOld.years[ffOld.cur].order), ord('pubsFor(MS).ff')]), J([J(['F', 'G']), J(['F', 'G', 'NEW-1'])]));
    chk(name, 'the Spruills', 'they read Full Fund as Save writes it', ord(`spDefs().filter(function(d){ return d.slug==='ff'; })[0].ms`), J(['F', 'G', 'NEW-1']));
    const req = JSON.parse(B.ev(`(function(){ var r=spGather(); var a=Array.isArray(r)? r : (r.blocks||r.out||[]); var b=a.filter(function(x){ return /FULL FUND/.test(x.name); })[0]; return JSON.stringify(b? b.req : null); })()`));
    // v2.14 round 2 (the lead, at the merge): RV2-D's fix counts another appropriation's base requirements from its own plan's data pack
    // (spruills-other-appn-base-requirements-zero), so the figure is F and G's asks plus H's -- read off the older copy it would lack H's
    const FF_BASE = SCF.items.reduce((t, i) => t + i.ask.reduce((a, v) => a + v, 0), 0);
    chk(name, 'the Spruills', 'FY27 Full Fund requirements carry F and G and the added requirement’s value', J(req && req[B.ev('String(MS.cur)')]), J(FF_BASE + H_ASK));
    const rows = JSON.parse(B.ev(`(function(){ var cap=null; var _b=buildXlsx; buildXlsx=function(sh){ cap=sh; return _b.apply(this, arguments); };
      URL.createObjectURL=function(){ return 'blob:x'; }; HTMLAnchorElement.prototype.click=function(){}; window.alert=function(){};
      try{ exportCSV(); }catch(e){ return JSON.stringify(['threw '+e.message]); } finally{ buildXlsx=_b; }
      var out=[]; (cap||[]).forEach(function(s){ var on=false; (s.rows||[]).forEach(function(r){ var t=(r||[]).map(function(c){ return (c&&typeof c==='object')? c.v : c; });
        if(/REQUIREMENTS BY BAND, ACROSS EVERY APPROPRIATION/.test(String(t[0]))) on=true; else if(on && t.length && t[0]==='Full Fund') out.push(t); }); });
      return JSON.stringify(out); })()`));
    const ffRow = rows[0] || [];
    chk(name, 'the Priority Drill', 'requirements by band, across every appropriation, counts Full Fund’s three', J(ffRow.slice(1).reduce((t, v) => t + (+v || 0), 0)), J(3));
    // this browser's Full Fund holding unsaved work behind the file's newer copy: read as Full Fund's own board opens it, the file's
    B.ev(`localStorage.setItem('prio27ff.base', ${J(J({ file: ffOld.ts, folder: {}, dirty: true }))}); 'ok'`);
    chk(name, 'held work behind a newer copy', 'the Spruills read the file’s Full Fund, as its own board opens it (and keeps the work aside)',
      J([B.ev(`String(apStoreOf('ff').held)`), ord(`spDefs().filter(function(d){ return d.slug==='ff'; })[0].ms`)]), J(['true', J(['F', 'G', 'NEW-1'])]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  w3Release(__bm);
})();
// v2.14 RV2-B (sideboot-names-stray-as-saved-by-save): ANOTHER APPROPRIATION'S WORK TYPED ON A PAGE WITH NO BOARD FILE IS NEVER SAID TO BE
// SAVE'S TO WRITE. Every opening of the board file on O&M read "Unsaved changes — … This browser holds changes to the Full Fund plan that
// the file does not have: 💾 Save writes them into the file", Save wrote the file's Full Fund (RV1-C) and read "Saved", and the next
// opening said it again; Clear this computer told the person to Save first to keep work Save never keeps (r2a-seams p4). It is named
// apart, as what it is, while it lasts. A CONTROL: an ordinary unsaved Full Fund still reads as Save's to write.
await (async () => {
  const __bm = w3Mark();
  const name = 'v2.14 RV2-B — another appropriation’s work typed on a page with no board file is not said to be Save’s to write: it is named apart, and Clear this computer warns of it (sideboot-names-stray-as-saved-by-save)';
  try {
    const J = JSON.stringify;
    const MINE = ['USAF', 'ANG', 'AFRC'];
    const SCO = { services: MINE, items: [it('A', 'AV', [900, 200, 100]), it('B', 'PSM', [400, 100, 50])], disc: [1200, 300, 150], mand: [100, 20, 10], order: ['A', 'B'] };
    const SCF = { services: MINE, items: [it('F', 'AV', [700, 100, 60]), it('G', 'TSS', [500, 90, 30])], disc: [900, 150, 60], mand: [200, 40, 20], order: ['F', 'G'] };
    const asBuilt = (ev, sc) => ev(`(function(){ BASE_ITEMS.length=0; ${J(sc.items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); return 'ok'; })()`);
    const lsOf = ev => JSON.parse(ev(`JSON.stringify((function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return o; })())`));
    const F = boot({ appn: 'FULL FUND' }); seed(F.ev, SCF); asBuilt(F.ev, SCF); F.ev(`S.notes=S.notes||{}; S.notes.F='FILE FF note'; MS.years[MS.cur]=S; save(); 'ok'`);
    const O = boot({ html: F.ev('buildSavedHtml()'), appn: 'O&M' }); seed(O.ev, SCO); asBuilt(O.ev, SCO); O.ev(`MS.years[MS.cur]=S; save(); 'ok'`);
    const FILE = O.ev('buildSavedHtml()');
    await w3sSleep(15);
    // blank work: Full Fund typed on the program page, which opened no board file
    const Bk = boot({ ls: { prio27appn: 'FULL FUND', prio27who: 'BLL' } });
    Bk.ev(`S.notes=S.notes||{}; S.notes.Z='BLANK page note'; save(); 'ok'`);
    const LS = lsOf(Bk.ev); delete LS.prio27om; delete LS['prio27om.base']; LS.prio27appn = 'O&M';
    chk(name, 'the fixture', 'Full Fund’s record says blank work no saved file holds (a CONTROL)', JSON.parse(LS['prio27ff.base']).blank, true);
    const say = B => ({ keys: B.ev('JSON.stringify(sideBootNote.keys)'), un: B.ev('String(unsavedNow())'), tip: B.ev(`(document.getElementById('saveState')||{}).title||''`) });
    const OM = boot({ html: FILE, ls: LS }); await w3sSleep(30);
    const s1 = say(OM);
    chk(name, 'O&M opens', 'the board reads saved: Full Fund is not among the plans Save writes, and the tooltip does not say Save writes it',
      J([s1.keys, s1.un, /Full Fund plan that the file does not have/.test(s1.tip)]), J([J([]), 'false', false]));
    chk(name, 'O&M opens', 'the tooltip names Full Fund’s work typed on a page with no board file, and how to keep it',
      /holds Full Fund work typed on a page with no board file\. 💾 Save does not write it.*Open Full Fund once/.test(s1.tip), true);
    OM.ev(`window.__cq=[]; window.confirm=function(m){ window.__cq.push(String(m)); return false; }; clearComputer(); 'ok'`);
    chk(name, 'Clear this computer', 'its question warns that Full Fund’s work typed on a page with no board file will be lost, never that Save keeps it',
      /This browser holds Full Fund work typed on a page with no board file\. No file has it, and 💾 Save does not write it/.test(OM.ev('String(window.__cq[0]||"")')), true);
    // reopened after a Save: the same, never "Save writes them"
    const OM2 = boot({ html: OM.ev('buildSavedHtml()'), ls: lsOf(OM.ev) }); await w3sSleep(30);
    const s2 = say(OM2);
    chk(name, 'reopened', 'still not among the plans Save writes; still named apart', J([s2.keys, /Full Fund plan that the file does not have/.test(s2.tip), /typed on a page with no board file/.test(s2.tip)]), J([J([]), false, true]));
    // CONTROL: the same Full Fund work under an ordinary record (a page that saved a file once): Save's to write, and said so
    const LS3 = Object.assign({}, LS); LS3['prio27ff.base'] = J({ file: 1, dirty: true, blank: false });
    const OM3 = boot({ html: FILE, ls: LS3 }); await w3sSleep(30);
    const s3 = say(OM3);
    chk(name, 'ordinary unsaved work', 'it is among the plans Save writes, and said so (a CONTROL)', J([s3.keys, /Full Fund plan that the file does not have: 💾 Save writes them/.test(s3.tip), /typed on a page with no board file/.test(s3.tip)]), J([J(['prio27ff']), true, false]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  w3Release(__bm);
})();
// v2.14 RV2-B (also-noticed: two tabs on one board file): 💾 SAVE NAMES ANOTHER APPROPRIATION THE FILE HOLDS NEWER THAN THE COPY IT WOULD
// WRITE OVER IT. One tab put Initial Spares on BES28 (carried on that page) and saved; this page still holds the Initial Spares it opened,
// on PB27. Its HOLD ON says somebody saved the file and names nothing; OK wrote PB27 back over the file's BES28, a cycle nobody chose to
// drop (r2a-journeys p3 t2). Now a second question names Initial Spares, both cycles and who saved it; Cancel writes nothing.
await (async () => {
  const __bm = w3Mark();
  const name = 'v2.14 RV2-B — 💾 Save names another appropriation the file holds newer than the copy it would write over it, and Cancel writes nothing (also-noticed: two tabs)';
  try {
    const J = JSON.stringify;
    const B = await w3sFresh();
    const sp = JSON.parse(B.ev('JSON.stringify(MS)')); sp.ts = Date.now() - 60000; sp.by = 'SP Lead'; sp.cycle = 'PB|2027';
    B.ev(`for (var k in PUBS) delete PUBS[k]; PUBS.sp=${J(sp)}; writerKey(); localStorage.setItem('prio27who','BL');
      window.__q=[]; window.__ans=[]; window.confirm=function(m){ window.__q.push(String(m)); return window.__ans.length? window.__ans.shift() : true; }; window.alert=function(){}; ${W3S_FH} 'ok'`);
    await B.ev('saveInPlaceFile()'); await w3sSleep(20);
    chk(name, 'the fixture', 'the file is written with Initial Spares on PB27, and nothing in browser storage holds Initial Spares (a CONTROL)',
      J([B.ev('window.__fw.writes'), JSON.parse((B.ev('window.__fw.content').match(/id="pubState">([\s\S]*?)<\/script>/) || [])[1]).appns.sp.cycle, B.ev(`localStorage.getItem('prio27sp')`)]), J([1, 'PB|2027', null]));
    // the other tab's Save: Initial Spares on BES28, saved later by Brad
    const later = Date.now() + 1000;
    B.ev(`(function(){ var t=window.__fw.content, m=t.match(/(<script type="application\\/json" id="pubState">)([\\s\\S]*?)(<\\/script>)/); var p=JSON.parse(m[2]);
      p.appns.sp.cycle='BES|2028'; p.appns.sp.ts=${later}; p.appns.sp.by='Brad';
      var rep=m[1]+JSON.stringify(p).replace(/</g,'\\\\u003c')+m[3]; window.__fw.content=t.replace(m[0], function(){ return rep; }); return 'ok'; })()`);
    const before = B.ev('window.__fw.content');
    B.ev(`S.notes=S.notes||{}; S.notes.A='an edit here'; save(); window.__q=[]; window.__ans=[true, false]; 'ok'`);
    await B.ev('saveInPlaceFile()'); await w3sSleep(20);
    const qs = JSON.parse(B.ev('JSON.stringify(window.__q)'));
    const named = qs.find(q => /Initial Spares: the file holds a newer copy/.test(q)) || '';
    chk(name, 'the Save', 'after the HOLD ON, a question names Initial Spares, who saved it, and both cycles',
      J([/^⚠ HOLD ON/.test(qs[0] || ''), !!named, /by Brad/.test(named), /the file’s is on BES28, this board’s on PB27/.test(named)]), J([true, true, true, true]));
    chk(name, 'Cancel', 'nothing is written: the file keeps Initial Spares on BES28', J([B.ev('window.__fw.writes'), B.ev('window.__fw.content') === before]), J([1, true]));
    // CONTROL: an ordinary Save, nobody else having saved, asks nothing of the kind
    const C = await w3sFresh();
    C.ev(`for (var k in PUBS) delete PUBS[k]; PUBS.sp=${J(sp)}; writerKey(); localStorage.setItem('prio27who','BL'); window.__q=[]; window.confirm=function(m){ window.__q.push(String(m)); return true; }; window.alert=function(){}; ${W3S_FH} 'ok'`);
    await C.ev('saveInPlaceFile()'); await w3sSleep(20);
    C.ev(`S.notes=S.notes||{}; S.notes.A='again'; save(); window.__q=[]; 'ok'`);
    await C.ev('saveInPlaceFile()'); await w3sSleep(20);
    chk(name, 'an ordinary Save', 'asks nothing and writes (a CONTROL)', J([C.ev('window.__q.length'), C.ev('window.__fw.writes')]), J([0, 2]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  w3Release(__bm);
})();
// v2.14 RV2-B (carry-then-held-misfire, with no cycle at all): A WRITE BROWSER STORAGE REFUSES, BUILT FROM STORAGE'S OWN COPY, IS NOT READ
// AS THIS BROWSER'S UNSAVED WORK BEHIND A NEWER COPY. Browser storage and the board file hold the same Full Fund and its record says
// unsaved -- the state right after a full import that fits (contract §12 Q6). One ⬆ Issue storage refused made the page's copy newer,
// and from then on Full Fund read as held: the second Issue was refused ("the file's copy is newer", of the page's own copy) and Save
// left the record unsaved (the skeptics' no-carry control, r2a-skeptic …carry-then-held-misfire-1 p-skeptic CYC=0).
await (async () => {
  const __bm = w3Mark();
  const name = 'v2.14 RV2-B — a write browser storage refuses, built from storage’s own copy, is not read as this browser’s unsaved work behind a newer copy (carry-then-held-misfire, no cycle)';
  try {
    const J = JSON.stringify;
    const B = await w3sFresh();
    const ff = JSON.parse(B.ev('JSON.stringify(MS)')); ff.ts = Date.now() - 5000; ff.by = 'FF Lead'; ff.years[ff.cur].notes = { A: 'FF-SAME' };
    B.ev(`localStorage.setItem('prio27ff', ${J(J(ff))}); localStorage.setItem('prio27ff.base', ${J(J({ file: 0, dirty: true }))}); for (var k in PUBS) delete PUBS[k]; PUBS.ff=${J(ff)};
      writerKey(); localStorage.setItem('prio27who','BL'); window.confirm=function(){ return true; }; window.alert=function(){};
      URL.createObjectURL=function(){ return 'blob:x'; }; HTMLAnchorElement.prototype.click=function(){}; ${W3S_FH}
      window.__si2=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(k==='prio27ff') throw new DOMException('The quota has been exceeded.','QuotaExceededError'); return window.__si2.call(this,k,v); }; 'ok'`);
    const issue = () => { B.ev(`window.__blob=null; window.__B0=window.Blob; window.Blob=function(p,o){ window.__blob=String(p&&p[0]); return new window.__B0(p,o); }; pkgIssue('ff', true); window.Blob=window.__B0; 'ok'`); return B.ev('String(window.__blob)'); };
    chk(name, 'the fixture', 'Full Fund is not held to begin with (a CONTROL)', B.ev(`String(apStoreOf('ff').held)`), 'false');
    const i1 = issue();
    chk(name, '⬆ Issue', 'issued as package #1, held on this page alone, and Full Fund is still not read as held',
      J([/"seq":1\b/.test(i1), B.ev(`localStorage.getItem('prio27ff')`) === J(ff), B.ev(`String(apStoreOf('ff').held)`)]), J([true, true, 'false']));
    const i2 = issue();
    chk(name, 'a second ⬆ Issue', 'goes out as package #2; nothing says the file’s copy is newer', J([/"seq":2\b/.test(i2), /file’s copy is newer/.test(w3sStat(B))]), J([true, false]));
    await B.ev('saveInPlaceFile()'); await w3sSleep(20);
    const pub = JSON.parse((B.ev('window.__fw.content').match(/id="pubState">([\s\S]*?)<\/script>/) || [])[1] || 'null') || { appns: {} };
    const wrote = Math.max(0, ...Object.values(pub.appns).map(s => (s && s.ts) || 0));
    chk(name, '💾 Save', 'the file carries package #2, and Full Fund’s record says saved in that save',
      J([(((pub.appns.ff || {}).sync) || {}).seq, JSON.parse(B.ev(`localStorage.getItem('prio27ff.base')`))]), J([2, { file: wrote, dirty: false }]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  w3Release(__bm);
})();
// v2.14 RV2-B (also-noticed: apHeldWhy): A REFUSAL FOR UNSAVED WORK BEHIND A NEWER COPY SAYS WHICH COPY IS THE NEWER -- the board file's, or
// one this page made and has not saved. It said "the file's copy is newer" of both. Here this page's Full Fund is a package storage
// refused (on this page alone), and this browser's older copy is then recorded unsaved (as another tab of this browser records it):
// ⬆ Issue is refused, naming this page's copy; once 💾 Save has written it, the newer copy is the file's, and the refusal says so.
await (async () => {
  const __bm = w3Mark();
  const name = 'v2.14 RV2-B — a refusal for unsaved work behind a newer copy says which copy is the newer: the file’s, or one this page made and has not saved (also-noticed: apHeldWhy)';
  try {
    const J = JSON.stringify;
    const B = await w3sFresh();
    const old = JSON.parse(B.ev('JSON.stringify(MS)')); old.ts = Date.now() - 60000; old.years[old.cur].notes = { A: 'OLDER HERE' };
    const nw = JSON.parse(J(old)); nw.ts = Date.now() - 30000; nw.years[nw.cur].notes = { A: 'THE FILE’S' };
    B.ev(`localStorage.setItem('prio27ff', ${J(J(old))}); localStorage.setItem('prio27ff.base', ${J(J({ file: 1, dirty: false }))}); PUBS.ff=${J(nw)};
      writerKey(); localStorage.setItem('prio27who','BL'); window.confirm=function(){ return true; }; window.alert=function(){};
      URL.createObjectURL=function(){ return 'blob:x'; }; HTMLAnchorElement.prototype.click=function(){}; ${W3S_FH}
      window.__si2=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(k==='prio27ff') throw new DOMException('The quota has been exceeded.','QuotaExceededError'); return window.__si2.call(this,k,v); }; 'ok'`);
    const ms = JSON.parse(J(nw)); ms.years[ms.cur].notes = { A: 'A PACKAGE' };
    const r = B.ev(`String(pkgApply(${J({ spmtPkg: 1, dir: 'issue', ap: 'ff', apName: 'Full Fund', seq: 1, ts: Date.now(), by: 'FF Lead', baseSig: '', ms })}, 'ff-package.json'))`);
    chk(name, 'the package', 'taken on this page alone; browser storage keeps its older copy (a CONTROL)',
      J([r, B.ev(`String(PUBS.ff.years[PUBS.ff.cur].notes.A)`), B.ev(`String(JSON.parse(localStorage.getItem('prio27ff')).years[MS.cur].notes.A)`)]), J(['true', 'A PACKAGE', 'OLDER HERE']));
    B.ev(`localStorage.setItem('prio27ff.base', ${J(J({ file: 1, dirty: true }))}); pkgIssue('ff', true); 'ok'`);
    const s1 = w3sStat(B);
    chk(name, 'held, the newer copy this page’s', 'Full Fund is not issued, and the reason names a newer Full Fund made on this page, not the file’s',
      J([/^⚠ Full Fund was not issued/.test(s1), /a newer Full Fund made on this page is not in the file yet/.test(s1), /file’s copy is newer/.test(s1)]), J([true, true, false]));
    await B.ev('saveInPlaceFile()'); await w3sSleep(20);
    B.ev(`pkgIssue('ff', true); 'ok'`);
    const s2 = w3sStat(B);
    chk(name, 'held, after 💾 Save', 'once the file holds it, the reason says the file’s copy is newer',
      J([/^⚠ Full Fund was not issued/.test(s2), /the file’s copy is newer/.test(s2), /made on this page/.test(s2)]), J([true, true, false]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  w3Release(__bm);
})();
// v2.14 RV2-B (finish, blank-mark-cleared): BLANK WORK STAYS BLANK WORK WHEN ANOTHER PAGE WITH NO BOARD FILE WRITES ON IT. Full Fund typed
// on the program page (its record marked blank); on another blank page ⚖ the ladder copied, or Full Fund issued. RV2-B's own record
// write (apPut) wrote blank:false, so the board file opened later on O&M read that blank work as this browser's newer Full Fund: 💾 Save
// wrote it over the file's after a HOLD ON, and Full Fund's own board opened it rather than the file's (rv2-B-check x1). Expectations
// are the fixture's literals.
await (async () => {
  const __bm = w3Mark();
  const name = 'v2.14 RV2-B — blank work stays blank work when another page with no board file copies the ladder onto it or issues it: the board file keeps its own Full Fund, and Full Fund’s board keeps the work aside (finish: blank-mark-cleared)';
  try {
    const J = JSON.stringify;
    const MINE = ['USAF', 'ANG', 'AFRC'];
    const SCO = { services: MINE, items: [it('A', 'AV', [900, 200, 100]), it('B', 'PSM', [400, 100, 50])], disc: [1200, 300, 150], mand: [100, 20, 10], order: ['A', 'B'] };
    const SCF = { services: MINE, items: [it('F', 'AV', [700, 100, 60]), it('G', 'TSS', [500, 90, 30])], disc: [900, 150, 60], mand: [200, 40, 20], order: ['F', 'G'] };
    const asBuilt = (ev, sc) => ev(`(function(){ BASE_ITEMS.length=0; ${J(sc.items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); return 'ok'; })()`);
    const lsOf = ev => JSON.parse(ev(`JSON.stringify((function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return o; })())`));
    for (const how of ['ladder', 'issue']) {
      const MARK = how === 'issue' ? '"issuedTs"' : 'RV2B BLANK LADDER';
      const F = boot({ appn: 'FULL FUND' }); seed(F.ev, SCF); asBuilt(F.ev, SCF); F.ev(`S.notes=S.notes||{}; S.notes.F='FILE FF note'; MS.years[MS.cur]=S; save(); 'ok'`);
      const O = boot({ html: F.ev('buildSavedHtml()'), appn: 'O&M' }); seed(O.ev, SCO); asBuilt(O.ev, SCO); O.ev(`MS.years[MS.cur]=S; save(); 'ok'`);
      const FILE = O.ev('buildSavedHtml()');
      await w3sSleep(15);
      const Bk = boot({ ls: { prio27appn: 'FULL FUND', prio27who: 'BLL' } });
      Bk.ev(`S.notes=S.notes||{}; S.notes.Z='BLANK page note'; save(); 'ok'`);
      const LS = lsOf(Bk.ev); LS.prio27appn = 'O&M';
      const r0 = JSON.parse(LS['prio27ff.base']);
      chk(name, how, 'the fixture: Full Fund’s record says blank work no saved file holds (a CONTROL)', J([r0.dirty, +r0.file || 0, r0.blank]), J([true, 0, true]));
      // another page with no board file, on O&M
      const Bo = boot({ ls: LS }); await w3sSleep(20);
      Bo.ev(`window.confirm=function(){ return true; }; window.alert=function(){}; URL.createObjectURL=function(){ return 'blob:x'; }; HTMLAnchorElement.prototype.click=function(){}; 'ok'`);
      if (how === 'issue') Bo.ev(`pkgIssue('ff', true); 'ok'`);
      else Bo.ev(`(function(){ const L=JSON.parse(JSON.stringify(BANDS_LIST())); L[0].n='RV2B BLANK LADDER'; bandSave(L); bandCopyAll(); return 'ok'; })()`);
      const ffLs = Bo.ev(`localStorage.getItem('prio27ff')`) || '';
      chk(name, how, 'the write is on the blank work in browser storage (a CONTROL)', J([ffLs.indexOf(MARK) >= 0, ffLs.indexOf('BLANK page note') >= 0]), J([true, true]));
      const r1 = JSON.parse(Bo.ev(`localStorage.getItem('prio27ff.base')`));
      chk(name, how, 'Full Fund’s record still says blank work no saved file holds', J([r1.dirty, +r1.file || 0, r1.blank]), J([true, 0, true]));
      // the board file opened on O&M, then 💾 Save
      const LS2 = lsOf(Bo.ev); delete LS2.prio27om; delete LS2['prio27om.base'];
      const OM = boot({ html: FILE, ls: LS2 }); await w3sSleep(30);
      OM.ev(`writerKey(); localStorage.setItem('prio27who','BLL'); window.__q=[]; window.confirm=function(m){ window.__q.push(String(m)); return true; }; window.alert=function(){}; ${W3S_FH} window.__fw.content=${J(FILE)}; LASTKNOWN=PUB_FILE_TS; 'ok'`);
      await OM.ev('saveInPlaceFile()'); await w3sSleep(40);
      const pub = JSON.parse((OM.ev('window.__fw.content').match(/id="pubState">([\s\S]*?)<\/script>/) || [])[1] || 'null') || { appns: {} };
      const ff = pub.appns.ff || {}, fy = (ff.years || {})[ff.cur] || {};
      chk(name, how + ', then the board file on O&M and 💾 Save', 'Save writes the file’s own Full Fund, and asks no HOLD ON',
        J([OM.ev('window.__fw.writes'), J(fy.notes || null), J(fy.order || null), JSON.parse(OM.ev('JSON.stringify(window.__q)')).some(q => /HOLD ON/.test(q))]),
        J([1, J({ F: 'FILE FF note' }), J(['F', 'G']), false]));
      // Full Fund's own board, from the board file
      const FFb = boot({ html: FILE, ls: Object.assign({}, LS2, { prio27appn: 'FULL FUND' }) }); await w3sSleep(30);
      const kept = FFb.ev(`localStorage.getItem('prio27ff.kept')||''`);
      chk(name, how + ', then Full Fund’s own board', 'opens the file’s Full Fund, and keeps the blank work aside with this page’s work on it',
        J([FFb.ev('JSON.stringify(S.notes)'), kept.indexOf('BLANK page note') >= 0, kept.indexOf(MARK) >= 0]), J([J({ F: 'FILE FF note' }), true, true]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  w3Release(__bm);
})();
// v2.14 RV2-B (finish, stray-carried-saved): A PACKAGE IS NOT TAKEN OVER BLANK WORK ITS OWN BOARD KEEPS ASIDE. On O&M of the board file,
// with Full Fund's blank work in browser storage (stray against the file's), pkgApply asked about that blank work, replaced it, or --
// storage refusing -- remembered it as carried, and the next 💾 Save recorded that blank work saved: Full Fund's opening dropped it with
// nothing kept aside (rv2-B-check x2). Now it is refused, as ⬆ Issue and ⬆ Send back are, and no writer remembers stray work as
// carried. A CONTROL: under an ordinary record the same stored copy is storage's, read and carried as before.
await (async () => {
  const __bm = w3Mark();
  const name = 'v2.14 RV2-B — a package is not taken over blank work its own board keeps aside, and no writer remembers that work as carried: Save writes the file’s Full Fund and Full Fund’s board keeps the work aside (finish: stray-carried-saved)';
  try {
    const J = JSON.stringify;
    const MINE = ['USAF', 'ANG', 'AFRC'];
    const SCO = { services: MINE, items: [it('A', 'AV', [900, 200, 100]), it('B', 'PSM', [400, 100, 50])], disc: [1200, 300, 150], mand: [100, 20, 10], order: ['A', 'B'] };
    const SCF = { services: MINE, items: [it('F', 'AV', [700, 100, 60]), it('G', 'TSS', [500, 90, 30])], disc: [900, 150, 60], mand: [200, 40, 20], order: ['F', 'G'] };
    const asBuilt = (ev, sc) => ev(`(function(){ BASE_ITEMS.length=0; ${J(sc.items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); return 'ok'; })()`);
    const lsOf = ev => JSON.parse(ev(`JSON.stringify((function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return o; })())`));
    const F = boot({ appn: 'FULL FUND' }); seed(F.ev, SCF); asBuilt(F.ev, SCF); F.ev(`S.notes=S.notes||{}; S.notes.F='FILE FF note'; MS.years[MS.cur]=S; save(); 'ok'`);
    const O = boot({ html: F.ev('buildSavedHtml()'), appn: 'O&M' }); seed(O.ev, SCO); asBuilt(O.ev, SCO); O.ev(`MS.years[MS.cur]=S; save(); 'ok'`);
    const FILE = O.ev('buildSavedHtml()');
    await w3sSleep(15);
    const Bk = boot({ ls: { prio27appn: 'FULL FUND', prio27who: 'BLL' } });
    Bk.ev(`S.notes=S.notes||{}; S.notes.Z='BLANK page note'; save(); 'ok'`);
    const LS = lsOf(Bk.ev); delete LS.prio27om; delete LS['prio27om.base']; LS.prio27appn = 'O&M';
    const OM = boot({ html: FILE, ls: LS }); await w3sSleep(30);
    OM.ev(`writerKey(); localStorage.setItem('prio27who','BLL'); window.__q=[]; window.confirm=function(m){ window.__q.push(String(m)); return true; }; window.alert=function(m){ window.__q.push('ALERT '+m); }; URL.createObjectURL=function(){ return 'blob:x'; }; HTMLAnchorElement.prototype.click=function(){}; ${W3S_FH} window.__fw.content=${J(FILE)}; LASTKNOWN=PUB_FILE_TS; 'ok'`);
    chk(name, 'the fixture', 'Full Fund’s stored copy is blank work its own board keeps aside (a CONTROL)', OM.ev(`String(strayHeld('ff'))`), 'true');
    // (apCarryRaw is RV2-B's: a board before it has no writer that remembers anything as carried)
    chk(name, 'a writer', 'remembers nothing of that blank work as carried (apCarryRaw)', OM.ev(`String(typeof apCarryRaw!=='function' || apCarryRaw('ff')===undefined)`), 'true');
    const raw0 = OM.ev(`localStorage.getItem('prio27ff')`), base0 = OM.ev(`localStorage.getItem('prio27ff.base')`);
    // a Full Fund package, issued from the board file on Full Fund's own board in another browser
    const ms = JSON.parse(J(JSON.parse(/id="pubState">([\s\S]*?)<\/script>/.exec(FILE)[1]).appns.ff)); ms.years[ms.cur].notes = { F: 'FROM THE PACKAGE' };
    const r = OM.ev(`String(pkgApply(${J({ spmtPkg: OM.ev('PKG_VER'), dir: 'issue', ap: 'ff', apName: 'Full Fund', seq: 1, ts: Date.now(), by: 'FF Mgr', baseSig: 'x', ms })}, 'ff-package.json'))`);
    const qs = JSON.parse(OM.ev('JSON.stringify(window.__q)'));
    chk(name, 'the package', 'is refused, saying why and that nothing was changed', J([r, qs.length, /^ALERT NOT IMPORTED — this browser holds Full Fund work typed on a page with no board file/.test(qs[0] || ''), /Nothing was changed\./.test(qs[0] || '')]), J(['false', 1, true, true]));
    chk(name, 'the package', 'browser storage, its record and this page’s Full Fund are as they were', J([OM.ev(`localStorage.getItem('prio27ff')`) === raw0, OM.ev(`localStorage.getItem('prio27ff.base')`) === base0, OM.ev(`JSON.stringify(PUBS.ff.years[PUBS.ff.cur].notes)`)]), J([true, true, J({ F: 'FILE FF note' })]));
    await OM.ev('saveInPlaceFile()'); await w3sSleep(40);
    const pub = JSON.parse((OM.ev('window.__fw.content').match(/id="pubState">([\s\S]*?)<\/script>/) || [])[1] || 'null') || { appns: {} };
    const ffp = pub.appns.ff || {};
    const rb = JSON.parse(OM.ev(`localStorage.getItem('prio27ff.base')`));
    chk(name, '💾 Save', 'writes the file’s Full Fund, and Full Fund’s record still says blank work no saved file holds', J([OM.ev('window.__fw.writes'), J(((ffp.years || {})[ffp.cur] || {}).notes || null), rb.dirty, +rb.file || 0, rb.blank]), J([1, J({ F: 'FILE FF note' }), true, 0, true]));
    const LS3 = lsOf(OM.ev); LS3.prio27appn = 'FULL FUND';
    const FFb = boot({ html: OM.ev('window.__fw.content'), ls: LS3 }); await w3sSleep(40);
    chk(name, 'Full Fund’s own board', 'opens the saved file’s Full Fund and keeps the blank work aside, whole', J([FFb.ev('JSON.stringify(S.notes)'), (FFb.ev(`localStorage.getItem('prio27ff.kept')||''`)).indexOf('BLANK page note') >= 0]), J([J({ F: 'FILE FF note' }), true]));
    // CONTROL: the same stored copy under an ordinary record (a page that saved a file once) is storage's newer copy, and carried
    const LS4 = Object.assign({}, LS); LS4['prio27ff.base'] = J({ file: 1, dirty: true, blank: false });
    const OM4 = boot({ html: FILE, ls: LS4 }); await w3sSleep(30);
    chk(name, 'ordinary unsaved work', 'it is not stray, and a writer holds storage’s copy as it stands (a CONTROL)', J([OM4.ev(`String(strayHeld('ff'))`), OM4.ev(`String(typeof apCarryRaw!=='function' || apCarryRaw('ff')===localStorage.getItem('prio27ff'))`)]), J(['false', 'true']));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  w3Release(__bm);
})();
// v2.14 RV2-B (finish, newer-copy-asked-after-import): 💾 SAVE DOES NOT ASK ABOUT A NEWER COPY THIS PAGE REPLACED ON PURPOSE. RV2-B's line
// naming an appropriation the file holds newer than the bytes (written for two tabs) also fired after ⇊ Import several boards took
// yesterday's file over the board file: the very save this page came from, whose Full Fund this page had opened and chose to replace
// (rv2-B-check x3). It is asked only where somebody else saved the file since. A CONTROL: then it still is.
await (async () => {
  const __bm = w3Mark();
  const name = 'v2.14 RV2-B — 💾 Save does not ask about a newer copy this page replaced on purpose (⇊ Import several boards of yesterday’s file), and still names one somebody else saved since (finish: newer-copy-asked-after-import)';
  try {
    const J = JSON.stringify;
    const MINE = ['USAF', 'ANG', 'AFRC'];
    const SCO = { services: MINE, items: [it('A', 'AV', [900, 200, 100]), it('B', 'PSM', [400, 100, 50])], disc: [1200, 300, 150], mand: [100, 20, 10], order: ['A', 'B'] };
    const SCF = { services: MINE, items: [it('F', 'AV', [700, 100, 60]), it('G', 'TSS', [500, 90, 30])], disc: [900, 150, 60], mand: [200, 40, 20], order: ['F', 'G'] };
    const asBuilt = (ev, sc) => ev(`(function(){ BASE_ITEMS.length=0; ${J(sc.items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); return 'ok'; })()`);
    const F = boot({ appn: 'FULL FUND' }); seed(F.ev, SCF); asBuilt(F.ev, SCF); F.ev(`S.notes=S.notes||{}; S.notes.F='OLD FF note'; MS.years[MS.cur]=S; save(); 'ok'`);
    const O = boot({ html: F.ev('buildSavedHtml()'), appn: 'O&M' }); seed(O.ev, SCO); asBuilt(O.ev, SCO); O.ev(`MS.years[MS.cur]=S; save(); 'ok'`);
    const OLD = O.ev('buildSavedHtml()');
    await w3sSleep(20);
    // today: Full Fund edited and saved into the board file
    const F2 = boot({ html: OLD, appn: 'FULL FUND' }); await w3sSleep(20); F2.ev(`S.notes.F='NEW FF note'; save(); 'ok'`);
    const FILE = F2.ev('buildSavedHtml()');
    const OM = boot({ html: FILE, appn: 'O&M' }); await w3sSleep(30);
    OM.ev(`writerKey(); localStorage.setItem('prio27who','BLL'); window.__q=[]; window.__ans=[]; window.confirm=function(m){ window.__q.push(String(m)); return window.__ans.length? window.__ans.shift() : true; }; window.alert=function(m){ window.__q.push('ALERT '+m); }; window.prompt=function(){ return 'BLL'; }; ${W3S_FH} window.__fw.content=${J(FILE)}; LASTKNOWN=PUB_FILE_TS; window.__old=${J(OLD)}; 'ok'`);
    await OM.ev('saveInPlaceFile()'); await w3sSleep(40);
    chk(name, 'the fixture', 'a first Save writes the board file (a CONTROL)', OM.ev('window.__fw.writes'), 1);
    OM.ev(`window.__q=[]; importBoards({files:[new File([window.__old], 'yesterday (ORBIT).html')], value:''}); 'ok'`);
    for (let i = 0; i < 100 && OM.ev(`String(JSON.stringify(((PUBS.ff||{}).years||{})[(PUBS.ff||{}).cur]||{}).indexOf('OLD FF note')>=0)`) !== 'true'; i++) await w3sSleep(50);
    chk(name, '⇊ Import several boards', 'takes yesterday’s Full Fund over the file’s (a CONTROL)', OM.ev(`JSON.stringify(PUBS.ff.years[PUBS.ff.cur].notes)`), J({ F: 'OLD FF note' }));
    OM.ev(`window.__q=[]; 'ok'`);
    await OM.ev('saveInPlaceFile()'); await w3sSleep(40);
    const pub = JSON.parse((OM.ev('window.__fw.content').match(/id="pubState">([\s\S]*?)<\/script>/) || [])[1] || 'null') || { appns: {} };
    chk(name, '💾 Save after the import', 'asks nothing, and writes yesterday’s Full Fund into the file',
      J([OM.ev('window.__q.length'), OM.ev('window.__fw.writes'), J(pub.appns.ff.years[pub.appns.ff.cur].notes)]), J([0, 2, J({ F: 'OLD FF note' })]));
    // and RV2-B's two-tab rule still holds: somebody else saves the file, a newer Full Fund in it; the next Save asks the HOLD ON, then names it
    const later = Date.now() + 1000;
    OM.ev(`(function(){ var t=window.__fw.content, m=t.match(/(<script type="application\\/json" id="pubState">)([\\s\\S]*?)(<\\/script>)/); var p=JSON.parse(m[2]);
      p.appns.ff.ts=${later}; p.appns.ff.by='Brad';
      var rep=m[1]+JSON.stringify(p).replace(/</g,'\\\\u003c')+m[3]; window.__fw.content=t.replace(m[0], function(){ return rep; }); return 'ok'; })()`);
    OM.ev(`S.notes=S.notes||{}; S.notes.A='an edit here'; save(); window.__q=[]; window.__ans=[true, false]; 'ok'`);
    await OM.ev('saveInPlaceFile()'); await w3sSleep(40);
    const qs = JSON.parse(OM.ev('JSON.stringify(window.__q)'));
    chk(name, 'somebody else saved since', 'the HOLD ON, then a question naming Full Fund’s newer copy; Cancel writes nothing (RV2-B’s two-tab rule, kept)',
      J([/^⚠ HOLD ON — Brad saved this file/.test(qs[0] || ''), /Full Fund: the file holds a newer copy/.test(qs[1] || ''), OM.ev('window.__fw.writes')]), J([true, true, 2]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  w3Release(__bm);
})();
// v2.14 RV2-B (finish, take-record-left-saved): THE ORDINARY ⬅ IMPORT OF ONE APPROPRIATION RECORDS IT UNSAVED. consTakeApply wrote the
// taken plan into browser storage and left its record naming the old save as saved, so a newer board file opened on that appropriation's
// own board replaced what was taken with nothing kept aside -- another appropriation's (rv2-B-check x4), and the board's own, whose
// reopened page even read "Saved" (rv2-B x5). ⇊ Import several boards did the same to every appropriation but the one on screen (x7).
await (async () => {
  const __bm = w3Mark();
  const name = 'v2.14 RV2-B — the ordinary ⬅ Import of one appropriation, and ⇊ Import several boards, record what they take unsaved, so a newer board file opened later keeps it aside (finish: take-record-left-saved)';
  try {
    const J = JSON.stringify;
    const MINE = ['USAF', 'ANG', 'AFRC'];
    const SCO = { services: MINE, items: [it('A', 'AV', [900, 200, 100]), it('B', 'PSM', [400, 100, 50])], disc: [1200, 300, 150], mand: [100, 20, 10], order: ['A', 'B'] };
    const SCF = { services: MINE, items: [it('F', 'AV', [700, 100, 60]), it('G', 'TSS', [500, 90, 30])], disc: [900, 150, 60], mand: [200, 40, 20], order: ['F', 'G'] };
    const asBuilt = (ev, sc) => ev(`(function(){ BASE_ITEMS.length=0; ${J(sc.items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); return 'ok'; })()`);
    const lsOf = ev => JSON.parse(ev(`JSON.stringify((function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return o; })())`));
    for (const [how, k] of [['take', 'ff'], ['take', 'om'], ['batch', 'ff']]) {
      const appn = k === 'ff' ? 'FULL FUND' : 'O&M', route = how + ' ' + k;
      const F = boot({ appn: 'FULL FUND' }); seed(F.ev, SCF); asBuilt(F.ev, SCF); F.ev(`MS.years[MS.cur]=S; S.notes={F:'FF note'}; save(); 'ok'`);
      const FFONLY = F.ev('buildSavedHtml()');
      const O = boot({ html: FFONLY, appn: 'O&M' }); seed(O.ev, SCO); asBuilt(O.ev, SCO); O.ev(`MS.years[MS.cur]=S; S.notes={A:'OM note'}; save(); 'ok'`);
      const FILE1 = O.ev('buildSavedHtml()');
      const P1 = JSON.parse(/id="pubState">([\s\S]*?)<\/script>/.exec(FILE1)[1]);
      // this browser opened that file and holds both plans as saved in it
      const LS = Object.assign(lsOf(F.ev), lsOf(O.ev));
      LS['prio27ff.base'] = J({ file: P1.appns.ff.ts, folder: {}, dirty: false }); LS['prio27om.base'] = J({ file: P1.appns.om.ts, folder: {}, dirty: false }); LS.prio27appn = 'O&M';
      const B = boot({ html: FILE1, ls: LS }); await w3sSleep(30);
      B.ev(`window.confirm=function(){ return true; }; window.alert=function(){}; window.__re=0; reopenPage=function(){ window.__re++; }; 'ok'`);
      if (how === 'take') {
        const lead = JSON.parse(J(P1)); const lp = lead.appns[k];
        lp.years[lp.cur].notes = k === 'ff' ? { F: 'FROM THE LEAD' } : { A: 'FROM THE LEAD' }; lp.ts = Date.now();
        B.ev(`consTakeApply(${J(lead)}, '', 'lead.html', [${J(k)}], false); 'ok'`);
      } else {
        // the lead's own Full Fund board file, saved later
        await w3sSleep(10);
        const L = boot({ html: FFONLY, appn: 'FULL FUND' }); await w3sSleep(20); L.ev(`S.notes.F='FROM THE LEAD'; save(); 'ok'`);
        B.ev(`window.__lead=${J(L.ev('buildSavedHtml()'))}; importBoards({files:[new File([window.__lead], 'lead (ORBIT).html')], value:''}); 'ok'`);
        for (let i = 0; i < 200 && (B.ev(`localStorage.getItem('prio27ff')||''`)).indexOf('FROM THE LEAD') < 0; i++) await w3sSleep(25);
      }
      chk(name, route, 'what was taken lands in browser storage, and the page reopens after a take, not after a batch (a CONTROL)', J([(B.ev(`localStorage.getItem(${J('prio27' + k)})`) || '').indexOf('FROM THE LEAD') >= 0, B.ev('window.__re')]), J([true, how === 'take' ? 1 : 0]));
      const rec = JSON.parse(B.ev(`localStorage.getItem(${J('prio27' + k + '.base')})`));
      chk(name, route, 'its record says this browser holds work no saved copy has, naming the save it was opened from', J([rec.dirty, rec.file]), J([true, P1.appns[k].ts]));
      if (route === 'take om') {
        const R = boot({ html: FILE1, ls: lsOf(B.ev) }); await w3sSleep(30);
        chk(name, 'take om, reopened', 'the board on screen reads unsaved, the taken plan on screen', J([R.ev(`(document.getElementById('saveState')||{}).textContent||''`), R.ev('JSON.stringify(S.notes)')]), J(['Unsaved changes', J({ A: 'FROM THE LEAD' })]));
      }
      // nobody saves here; another machine saves the board file with a newer plan of that appropriation (H added)
      await w3sSleep(10);
      const X = k === 'ff' ? F : O;
      X.ev(`reqCreate('AV', {title:'H added later', event:'EV-H', ask:[5000000,0,0]}); save(); 'ok'`);
      const FILE2 = X.ev('buildSavedHtml()');
      const LS2 = lsOf(B.ev); LS2.prio27appn = appn;
      const N = boot({ html: FILE2, ls: LS2 }); await w3sSleep(40);
      const kept = N.ev(`localStorage.getItem(${J('prio27' + k + '.kept')})||''`);
      chk(name, route + ', then a newer board file on its own board', 'opens the newer file and keeps what was taken aside, whole',
        J([N.ev('mySlug()'), N.ev('JSON.stringify(S.order)').indexOf('NEW-1') >= 0, kept.indexOf('FROM THE LEAD') >= 0]), J([k, true, true]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  w3Release(__bm);
})();
// ---- end RV2-B ----
// ---- RV2-C (round 2, second half: C) ----
// ---- end RV2-C ----
// ---- RV2-D (round 2, second half: D) ----
const { bootMark: _rv2dMark, bootRelease: _rv2dRelease, settleBoards: _rv2dSettle } = await import('./boot.mjs');
// v2.14 RV2-D (rcn-twin-typing-moves-to-the-other-row): TYPING IN ONE OF TWO IDENTICAL RCN / EEIC ROWS IS NEVER MOVED ONTO THE OTHER BY A
// LOAD THAT CHANGES ONE OF THEM. A row was held by what it holds plus how many identical rows come before it; a load that renamed the
// upper of two identical rows left the lower one with none above it, so it drew with the signature held for the upper one, and the
// typing moved there and was saved on the "repeats row 1" row nothing reads. FAILS ON 74a6aec: (a) the typing is on row 2 and is saved
// there; (b) the typing in row 2 is dropped with words that say the row has no key and is not on the list as it was; (c) the keyless
// twins, the same as (a); (j) dropped in words that say the row has no key. (d) and (e) are CONTROLS (pass there too): a plain redraw,
// and a load that changes a third, different row.
// v2.14 RV2-D (the check of this fix): AND A LOAD THAT CHANGES, ADDS OR REMOVES A TWIN ELSEWHERE LEAVES THE TYPING WHERE IT WAS. The
// first cut carried the count of ALL identical rows, so any change to a twin dropped the typing, with words that were not true.
// FAILS ON THE FIRST CUT (8028c1b): (b) dropped; (f) the lower twin renamed, (g) a second row made identical to the one typed in, (h) a
// row exactly like it added, (i) its twin removed -- each dropped, where the row typed in was there as it was. (k) passes on both (a
// CONTROL for the first cut; it bites a row followed only by the fewest-changes reading, which loses a row that only moved).
await (async () => {
  const __bm = _rv2dMark();
  const name = 'v2.14 RV2-D — typing in one of two identical RCN / EEIC rows is never moved onto the other by a load that changes one of them (rcn-twin-typing-moves-to-the-other-row)';
  try {
    const J = JSON.stringify;
    const mk = (id, ask) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Rec ' + id, event: 'EV-' + id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
    const boards = [];
    const board = (rcn) => {
      const B = boot(); boards.push(B);
      seed(B.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [mk('A', [100, 20, 10])], disc: [1000, 100, 100], mand: [100, 10, 10], order: ['A'] });
      B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S);
        MS.rcn=${J(rcn)}; S.rcnAsg={A:'K1'}; save(); window.confirm=function(){ return true; }; window.alert=function(){}; rcnOpen=true; render(); 'ok'`);
      return B;
    };
    const K1 = { k: 'K1', rcn: '11111', eeic: 'AAAAA', t: 'Depot', svc: ['USAF'] }, NOKEY = { rcn: '', eeic: '', t: '', svc: ['USAF'] };
    const rowsOf = B => `[].filter.call(document.querySelectorAll('#rcnBody tr'), function(t){ return t.querySelector('input.btn'); })`;
    const typeIn = (B, n, v) => B.ev(`(function(){ var r=${rowsOf(B)}[${n}]; var i=r.querySelectorAll('input.btn')[0]; i.focus(); i.value=${J(v)};
      i.dispatchEvent(new Event('input', {bubbles:true})); return 'ok'; })()`);
    const load = (B, js) => B.ev(`(function(){ setStat(''); var st=JSON.parse(JSON.stringify(MS)); (function(L){ ${js} })(st.rcn); st.rcn=st.rcn.filter(Boolean); st.ts=Date.now()+5; applyStore(st); render(); return 'ok'; })()`);
    const holds = (B, v) => B.ev(`String([].some.call(document.querySelectorAll('#rcnBody input'), function(i){ return i.value===${J(v)}; }))`);
    const focused = B => B.ev(`(function(){ var a=document.activeElement; var r=a && a.closest && a.closest('#rcnBody tr'); if(!r) return 'none';
      return 'row '+(${rowsOf(B)}.indexOf(r)+1)+' '+a.value; })()`);
    const leave = B => B.ev(`(function(){ var a=document.activeElement; if(a && a.blur) a.blur(); return 'ok'; })()`);
    const stored = B => B.ev(`JSON.stringify(MS.rcn.map(function(e){ return [e.k===undefined? '-' : e.k, e.t, e.rcn]; }))`);
    const reads = B => B.ev(`String(rcnEntry('K1') && rcnEntry('K1').rcn)`);
    const said = B => B.ev(`(document.getElementById('shareStat')||{}).textContent||''`);
    const TWIN = 'was not kept: the row it was in was exactly like another row on the list, and once the list was loaded the two could not be told apart. Nothing was changed.';
    const LEFT = 'was not kept: the load changed or removed the row it was in; another row on the list is exactly as that row was, but it is not the row the typing was in. Nothing was changed.';
    // the row typed in is there as it was: the typing stays in it, with the keyboard; leaving commits it there; nothing is said
    const kept = (part, B, row, want) => {
      chk(name, part, 'the typing is still in row ' + row + ', with the keyboard', focused(B), 'row ' + row + ' 99999');
      leave(B);
      chk(name, part, 'leaving commits it to row ' + row + ', and nothing says it was not kept', J([stored(B), /was not kept/.test(said(B))]), J([J(want), false]));
    };
    // (a) two identical rows sharing K1 (the second "repeats row 1"); typing in row 1, the row A reads; a load renames row 1
    {
      const B = board([K1, K1]);
      typeIn(B, 0, '99999');
      load(B, `L[0].t='Depot repair';`);
      chk(name, '(a) the first twin, renamed by the load', 'no field holds the typing: it is not put on the other twin', holds(B, '99999'), 'false');
      leave(B);
      chk(name, '(a) the first twin, renamed by the load', 'leaving changes nothing: both rows keep 11111, and A reads the row it always read',
        J([stored(B), reads(B)]), J([J([['K1', 'Depot repair', '11111'], ['K1', 'Depot', '11111']]), '11111']));
      chk(name, '(a) the first twin, renamed by the load', 'and the board says the row typed in was changed, and the row exactly like it is another',
        said(B).indexOf('(“99999”) ' + LEFT) >= 0, true);
      chk(name, 'errors · (a)', 'no page error', String(B.errors.length), '0');
    }
    // (b) the same twins; typing in row 2; the load renames row 1: row 2 is there as it was, and the typing stays in it
    {
      const B = board([K1, K1]);
      typeIn(B, 1, '99999');
      load(B, `L[0].t='Depot repair';`);
      kept('(b) the second twin, the first renamed', B, 2, [['K1', 'Depot repair', '11111'], ['K1', 'Depot', '99999']]);
    }
    // (c) two identical rows with no key at all; typing in the first; the load fills the first's title
    {
      const B = board([NOKEY, NOKEY]);
      typeIn(B, 0, '12345');
      load(B, `L[0].t='Depot repair';`);
      leave(B);
      chk(name, '(c) keyless twins, the first changed', 'leaving changes nothing: the second keeps its blank code', stored(B), J([['-', 'Depot repair', ''], ['-', '', '']]));
      chk(name, '(c) keyless twins, the first changed', 'and the board says the row typed in was changed, and the row exactly like it is another',
        said(B).indexOf('(“12345”) ' + LEFT) >= 0, true);
    }
    // (d) CONTROL: a plain redraw keeps the typing on row 1 of the twins
    {
      const B = board([K1, K1]);
      typeIn(B, 0, '99999');
      B.ev(`render(); 'ok'`);
      chk(name, '(d) CONTROL', 'across a plain redraw the typing stays in row 1, with the keyboard', focused(B), 'row 1 99999');
      leave(B);
      chk(name, '(d) CONTROL', 'leaving commits it to row 1, the row A reads', J([stored(B), reads(B)]), J([J([['K1', 'Depot', '99999'], ['K1', 'Depot', '11111']]), '99999']));
    }
    // (e) CONTROL: a load that changes a third row, unlike either twin, leaves the typing on row 1
    {
      const B = board([K1, K1, { k: 'K2', rcn: '22222', eeic: 'BBBBB', t: 'Other', svc: ['USAF'] }]);
      typeIn(B, 0, '99999');
      load(B, `L[2].t='Other renamed';`);
      chk(name, '(e) CONTROL', 'a load that changes another row leaves the typing in row 1', focused(B), 'row 1 99999');
      leave(B);
      chk(name, '(e) CONTROL', 'leaving commits it to row 1', stored(B), J([['K1', 'Depot', '99999'], ['K1', 'Depot', '11111'], ['K2', 'Other renamed', '22222']]));
    }
    // (f) the twins; typing in row 1; the load renames row 2, the repeat: row 1 is there as it was, and A reads what was typed
    {
      const B = board([K1, K1]);
      typeIn(B, 0, '99999');
      load(B, `L[1].t='Depot (repeat) renamed';`);
      kept('(f) the first twin, the second renamed', B, 1, [['K1', 'Depot', '99999'], ['K1', 'Depot (repeat) renamed', '11111']]);
      chk(name, '(f) the first twin, the second renamed', 'and A reads 99999', reads(B), '99999');
    }
    // (g) two rows sharing K1 that differ (Depot / Depot repair); typing in row 1; the load makes row 2 exactly like row 1
    {
      const B = board([K1, Object.assign({}, K1, { t: 'Depot repair' })]);
      typeIn(B, 0, '99999');
      load(B, `L[1].t='Depot';`);
      kept('(g) a second row made exactly like the one typed in', B, 1, [['K1', 'Depot', '99999'], ['K1', 'Depot', '11111']]);
    }
    // (h) K1 on one row; typing in it; the load adds a row exactly like it below (a list from a board before v2.00)
    {
      const B = board([K1]);
      typeIn(B, 0, '99999');
      load(B, `L.push(JSON.parse(JSON.stringify(L[0])));`);
      kept('(h) a row exactly like it added below', B, 1, [['K1', 'Depot', '99999'], ['K1', 'Depot', '11111']]);
      chk(name, '(h) a row exactly like it added below', 'and A reads 99999', reads(B), '99999');
    }
    // (i) the twins; typing in row 1; the load removes one of them: the row left is exactly the row typed in, at its place
    {
      const B = board([K1, K1]);
      typeIn(B, 0, '99999');
      load(B, `L.splice(0, 1);`);
      kept('(i) a twin removed, typing in the first', B, 1, [['K1', 'Depot', '99999']]);
    }
    // (j) the twins; typing in row 2, the repeat; the load removes one of them: which went cannot be told, and the one left is the row
    // A reads -- the typing is put on no row, and said in the twin's words
    {
      const B = board([K1, K1]);
      typeIn(B, 1, '99999');
      load(B, `L.splice(0, 1);`);
      chk(name, '(j) a twin removed, typing in the repeat', 'no field holds the typing', holds(B, '99999'), 'false');
      leave(B);
      chk(name, '(j) a twin removed, typing in the repeat', 'leaving changes nothing: the row left keeps 11111, and A reads it', J([stored(B), reads(B)]), J([J([['K1', 'Depot', '11111']]), '11111']));
      chk(name, '(j) a twin removed, typing in the repeat', 'and the board says the two could not be told apart, never that the row has no key',
        J([said(B).indexOf('(“99999”) ' + TWIN) >= 0, /has no key of its own/.test(said(B))]), J([true, false]));
    }
    // (k) three keyless rows unlike each other; typing in the first; the load moves it to the end: it only moved, so the typing follows it
    {
      const B = board(['ONE', 'TWO', 'THREE'].map((t, i) => ({ rcn: String(i + 1).repeat(5), eeic: 'EEEEE', t, svc: ['USAF'] })));
      typeIn(B, 0, '99999');
      load(B, `L.push(L.shift());`);
      kept('(k) a row with no key that only moved past the others', B, 3, [['-', 'TWO', '22222'], ['-', 'THREE', '33333'], ['-', 'ONE', '99999']]);
    }
    chk(name, 'errors · (b)–(k)', 'no page error', String(boards.slice(1).reduce((n, B) => n + B.errors.length, 0)), '0');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  _rv2dRelease(__bm); await _rv2dSettle();
})();
// v2.14 RV2-D (spruills-other-appn-base-requirements-zero, spruills-checks-cannot-reach-a-real-board): ANOTHER APPROPRIATION'S
// REQUIREMENTS ARE READ FROM ITS OWN PLAN'S DATA PACK, as every program file carries them. The program's consolidated payload (APPNS)
// is empty on every board since the generator was retired, and a full import moves a consolidated file's packs into the plans; read
// from APPNS alone, Full Fund's base requirements counted nowhere -- Spruills read Total Requirements $0.00M and a surplus Delta, the
// PMO drill gave PSM $0 there, and the chart of accounts listed none of them. The v1.95 checks stood Full Fund up in APPNS by hand and
// could not see it. And the board's own added requirements are listed once by the chart of accounts (it listed each twice, also found
// here). Full Fund's plan is the same in this browser's storage and in the file, so the check holds whichever copy is read.
// FAILS ON 74a6aec: Full Fund's Spruills rows, totals and drill read only FFN's $3M in the second year and nothing in the first; the
// chart of accounts lists no Full Fund requirement and N twice.
// v2.14 RV2-D (the check of this fix): AND FOR A YEAR FULL FUND'S PLAN HAS NOT STARTED, THE CHART OF ACCOUNTS DOES NOT LIST ITS
// REQUIREMENTS "AS DELIVERED". With every appropriation read from its own plan's pack, the chart listed Full Fund's requirements for a
// year its plan holds no state for, at their shipped asks, under a flag saying its board had never been opened in this file, while the
// Spruills on the same page read no data there. FAILS ON THE FIRST CUT (8028c1b): (y) Full Fund is listed as delivered; and on 74a6aec
// and the first cut, the workbook does not say Full Fund holds no plan for that year. (z) is a CONTROL: an appropriation this file has
// never opened, with only a shipped payload, is still listed as delivered. (x) passes on both (a store in no year's shape was never
// read for its pack); it bites the guard that keeps it so.
await (async () => {
  const __bm = _rv2dMark();
  const name = 'v2.14 RV2-D — the Spruills, the PMO drill and the chart of accounts read another appropriation from its own plan’s data pack, and this board’s added requirements once (spruills-other-appn-base-requirements-zero)';
  try {
    const J = JSON.stringify, M = 1e6;
    const { ev, errors } = boot();
    seed(ev, { services: ['USAF', 'ANG'], items: [it('A', 'AV', [10 * M, 2 * M]), it('B', 'TSS', [3 * M, 1 * M])],
      disc: [20 * M, 5 * M], mand: [4 * M, 1 * M], order: ['A', 'B'] });
    ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); MS.years[MS.cur]=S; save();
      window.confirm=function(){ return true; }; window.alert=function(){}; spAce='board'; 'ok'`);
    const cur = +ev('MS.cur'), Y = [cur, cur + 1], own = ev('APPN');
    const N = ev(`(function(){ var a=reqCreate('AV', {title:'N', event:'EN', ask:[1000000, 500000]}); save(); render(); return a; })()`);
    const other = own === 'FULL FUND' ? 'O&M' : 'FULL FUND', slug = ev(`APPN_SLUG[${J(other)}]`);
    // the other appropriation, as a program file carries it: its requirements in its plan's own data pack, the consolidated payload empty
    ev(`(function(){ var st={base:MS.base, cur:MS.cur, ts:Date.now()-60000, years:{},
        dataPack:{services:['USAF','ANG','AFRC'], items:[
          {id:'FF1', grp:'PSM', team:'PSM', sect:'', custom:false, title:'Req FF1', event:'Ev FF1', ccar:'CCFF1', fy26:[0,0,0], ask:[1000000,2000000,3000000], alloc:null},
          {id:'FF2', grp:'AV', team:'AV', sect:'', custom:false, title:'Req FF2', event:'Ev FF2', ccar:'CCFF2', fy26:[0,0,0], ask:[4000000,0,1000000], alloc:null}]}};
      st.years[${cur}]={asks:{FF1:[2000000,2000000,3000000]}, order:['FF1','FF2'], discSvc:[5000000,1000000,1000000], mandSvc:[1000000,0,0]};
      st.years[${cur + 1}]={asks:{}, order:['FF1','FF2','FFN'], discSvc:[6000000,2000000,2000000], mandSvc:[0,0,1000000],
        custom:[{id:'FFN', grp:'TSS', sect:'new', custom:true, title:'FF added (made up)', event:'e', ccar:'', fy26:[0,0,0], ask:[1000000,1000000,1000000], alloc:null}]};
      localStorage.setItem(_SLUGMAP[${J(slug)}].key, JSON.stringify(st)); PUBS[${J(slug)}]=JSON.parse(JSON.stringify(st)); return 'ok'; })()`);
    chk(name, 'fixture', 'the program carries no consolidated payload for it, and its plan carries a data pack, in storage and in the file alike',
      ev(`JSON.stringify([_hasData(APPNS[${J(other)}]), _hasPack(JSON.parse(localStorage.getItem(_SLUGMAP[${J(slug)}].key))), _hasPack(PUBS[${J(slug)}])])`), J([false, true, true]));
    const gather = by => JSON.parse(ev(`(function(){ var keep=[spBy, spSvc, spPmo]; try{ spBy=${J(by)}; spSvc='ALL'; spPmo='ALL';
        return JSON.stringify(spGather().blocks); } finally { spBy=keep[0]; spSvc=keep[1]; spPmo=keep[2]; } })()`));
    const bySvc = gather('svc'), byPmo = gather('pmo');
    const blk = (B, n) => B.find(b => b.name === n) || { rows: {}, req: {}, bud: {} };
    const rows = (b, keys) => keys.map(k => Y.map(y => (b.rows[k] || {})[y]));
    // THE TRUTH, by hand: FY on screen FF1 at its override 2+2+3 = $7M, FF2 4+0+1 = $5M; the next year FF1 at its own 1+2+3 = $6M, FF2
    // $5M, FFN 1+1+1 = $3M. Budgets 5+1+1+1 = $8M and 6+2+2+1 = $11M.
    chk(name, 'Spruills', 'Full Fund’s Total Requirements, Available Funding and Delta, each year from its own plan',
      J(Y.map(y => { const b = blk(byPmo, other); return [b.req[y], b.bud[y], b.bud[y] - b.req[y]]; })), J([[12 * M, 8 * M, -4 * M], [14 * M, 11 * M, -3 * M]]));
    chk(name, 'Spruills', 'Full Fund’s rows by service, at its own three services, each year',
      J(rows(blk(bySvc, other), ['USAF', 'ANG', 'AFRC'])), J([[6 * M, 6 * M], [2 * M, 3 * M], [4 * M, 5 * M]]));
    chk(name, 'Spruills', 'Full Fund’s rows by PMO, each year: its override, its added requirement once',
      J(rows(blk(byPmo, other), ['PSM', 'AV', 'TSS'])), J([[7 * M, 6 * M], [5 * M, 5 * M], [null, 3 * M]]));
    const drill = JSON.parse(ev(`(function(){ var b=pmoDetail('PSM', ${J(Y)}).filter(function(x){ return x.name===${J(other)}; })[0]||{svcs:[], req:{}};
      return JSON.stringify([b.svcs, b.svcs.map(function(sv){ return ${J(Y)}.map(function(y){ return (b.req[sv]||{})[y]||0; }); })]); })()`));
    chk(name, 'PMO drill', 'PSM in Full Fund: FF1 by its own three services, each year (its override on screen, its own ask the next)',
      J(drill), J([['USAF', 'ANG', 'AFRC'], [[2 * M, 1 * M], [2 * M, 2 * M], [3 * M, 3 * M]]]));
    const coa = JSON.parse(ev(`JSON.stringify(coaRows(${cur}).map(function(r){ return [r.ap, r.id, r.ask]; }))`));
    chk(name, 'chart of accounts', 'every requirement of both appropriations, each once: this board’s A, B and its added N; Full Fund’s FF1 and FF2',
      J(coa.filter(r => r[0] === own || r[0] === other)), J([[own, 'A', 12 * M], [own, 'B', 4 * M], [own, N, 1.5 * M], [other, 'FF1', 7 * M], [other, 'FF2', 5 * M]]));
    chk(name, 'chart of accounts', '“Where we stand”: requirements and the year’s requirement, by appropriation',
      ev(`JSON.stringify(coaSummary(coaRows(${cur})).filter(function(b){ return b.ap===${J(own)} || b.ap===${J(other)}; }).map(function(b){ return [b.ap, b.n, b.ask]; }))`),
      J([[own, 3, 17.5 * M], [other, 2, 12 * M]]));
    // (y) the board moves on to a year Full Fund's plan has not started (it holds this year and the next); (z) Initial Spares was never
    // opened in this file -- no plan anywhere -- and the program ships a payload for it
    ev(`(function(){ var P=APPNS['INITIAL SPARES']; P.services.length=0; P.items.length=0; ['USAF','ANG'].forEach(function(s){ P.services.push(s); });
      P.items.push({id:'SP1', grp:'PSM', team:'PSM', sect:'', custom:false, title:'Req SP1', event:'Ev SP1', ccar:'', fy26:[0,0], ask:[700000,300000], alloc:null});
      localStorage.removeItem(_SLUGMAP.sp.key); PUBS.sp=null; switchYear(${cur + 2}); return 'ok'; })()`);
    const FY2 = 'FY' + ((cur + 2) % 100);
    chk(name, '(y) fixture', 'the year on screen is two on, which Full Fund’s plan does not hold; Initial Spares has no plan at all',
      ev(`JSON.stringify([MS.cur, Object.keys(JSON.parse(localStorage.getItem(_SLUGMAP[${J(slug)}].key)).years), localStorage.getItem(_SLUGMAP.sp.key), PUBS.sp])`),
      J([cur + 2, [String(cur), String(cur + 1)], null, null]));
    chk(name, '(y) a year Full Fund has not started', 'the chart of accounts lists none of Full Fund’s requirements for it, and so no Full Fund row in “Where we stand”',
      ev(`JSON.stringify([coaRows(${cur + 2}).filter(function(r){ return r.ap===${J(other)}; }).length, coaSummary(coaRows(${cur + 2})).some(function(b){ return b.ap===${J(other)}; })])`), J([0, false]));
    const stand = JSON.parse(ev(`(function(){ var cap=null; var keep=buildXlsx; buildXlsx=function(sh){ cap=sh; return new Uint8Array(0); };
      try{ exportCoa(); } finally { buildXlsx=keep; }
      var s1=(cap||[]).filter(function(s){ return s.name==='Where we stand'; })[0]||{rows:[]};
      return JSON.stringify(s1.rows.map(function(r){ return (r||[]).map(function(c){ return (c && typeof c==='object' && 'v' in c)? c.v : c; }); })); })()`));
    const firsts = stand.map(r => String(r[0] ?? ''));
    chk(name, '(y) a year Full Fund has not started', 'the workbook’s “Where we stand” has no Full Fund row, and says Full Fund holds no plan for ' + FY2,
      J([firsts.some(v => v === other || v.indexOf(other + '  (') === 0), firsts.indexOf(other + ' holds no plan for ' + FY2 + ': its board has not started that year, so it is not on this chart, and the Spruills reads no data for it there either.') >= 0]),
      J([false, true]));
    chk(name, '(y) a year Full Fund has not started', 'and the Spruills reads no data for Full Fund there',
      J(blk(gather('pmo'), other).req[cur + 2] === undefined), 'true');
    chk(name, '(z) CONTROL — never opened in this file', 'Initial Spares, with only a shipped payload, is still listed as delivered: SP1 at its shipped $1,000,000',
      ev(`JSON.stringify(coaRows(${cur + 2}).filter(function(r){ return r.ap==='INITIAL SPARES'; }).map(function(r){ return [r.id, r.ask, r.fromPayload]; }))`), J([['SP1', 1000000, true]]));
    // (x) a store for OPN in no year's shape (a board from before fiscal years, its edits at the top): its pack is not printed as delivered
    // at the shipped figures, since nothing here reads where its edits are -- as before every appropriation was read from its own pack
    ev(`(function(){ var st={ts:Date.now()-60000, asks:{OP1:[9000000,0]}, order:['OP1'],
        dataPack:{services:['USAF','ANG'], items:[{id:'OP1', grp:'PSM', team:'PSM', sect:'', custom:false, title:'Req OP1', event:'Ev OP1', ccar:'', fy26:[0,0], ask:[100000,0], alloc:null}]}};
      localStorage.setItem(_SLUGMAP.opn.key, JSON.stringify(st)); PUBS.opn=JSON.parse(JSON.stringify(st)); return 'ok'; })()`);
    chk(name, '(x) a store in no year’s shape', 'OPN’s pack is not listed as delivered at its shipped $100,000, while its own edit says $9,000,000',
      ev(`JSON.stringify(coaRows(${cur + 2}).filter(function(r){ return r.ap==='OPN'; }).map(function(r){ return [r.id, r.ask]; }))`), '[]');
    chk(name, 'errors', 'no page error', errors.length ? errors.slice(0, 2).join(' | ') : '', '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  _rv2dRelease(__bm); await _rv2dSettle();
})();
// v2.14 RV2-D (byband-counts-a-requirement-the-mend-took-out): THE PRIORITY DRILL'S COUNT BY BAND, ACROSS EVERY APPROPRIATION, COUNTS
// ONLY REQUIREMENTS. An older ORBIT's Put back of an add left the add's id in the order with a null where the requirement was (the mend
// takes it out, on that appropriation's own board), and the count read another appropriation's order raw. O&M's plan is the same in
// this browser's storage and in the file. FAILS ON 74a6aec: O&M counts 5 (A, B, C, the ghost NEW-1, NEW-2) beside a year holding 4.
await (async () => {
  const __bm = _rv2dMark();
  const name = 'v2.14 RV2-D — the Priority Drill’s count by band across every appropriation counts only the requirements on each year’s list (byband-counts-a-requirement-the-mend-took-out)';
  try {
    const J = JSON.stringify;
    const { ev, errors } = boot({ appn: 'FULL FUND' });
    seed(ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('F1', 'AV', [500, 100, 50]), it('F2', 'PSM', [300, 0, 20])],
      disc: [2000, 600, 300], mand: [500, 150, 80], order: ['F1', 'F2'] });
    ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); MS.years[MS.cur]=S; save();
      window.confirm=function(){ return true; }; window.alert=function(){}; 'ok'`);
    const cur = +ev('MS.cur');
    chk(name, 'fixture', 'Full Fund is on screen', ev('mySlug()'), 'ff');
    // O&M as v2.13's Put back of NEW-1's add leaves it: a null where NEW-1 was, its id still in the order (the order is not journalled)
    const om = { base: cur, cur, ts: Date.now() - 60000, years: {},
      dataPack: { services: ['USAF', 'ANG', 'AFRC'], items: ['A', 'B', 'C'].map(id => it(id, 'AV', [100, 10, 1])) } };
    om.years[cur] = { order: ['A', 'B', 'C', 'NEW-1', 'NEW-2'], discSvc: [1000, 100, 10], mandSvc: [0, 0, 0],
      custom: [null, { id: 'NEW-2', grp: 'AV', team: 'AV', sect: 'new', custom: true, title: 'Y', event: 'EY', ccar: '', fy26: [0, 0, 0], ask: [200, 0, 0], alloc: null }] };
    ev(`localStorage.setItem(_SLUGMAP.om.key, ${J(J(om))}); PUBS.om=JSON.parse(${J(J(om))}); 'ok'`);
    const byBand = JSON.parse(ev(`(function(){ var cap=null; var keep=buildXlsx; buildXlsx=function(sh){ cap=sh; return new Uint8Array(0); };
      try{ exportCSV(); } finally { buildXlsx=keep; }
      var out={}, on=false; (cap||[]).forEach(function(s){ (s.rows||[]).forEach(function(r){
        var v=(r||[]).map(function(c){ return (c && typeof c==='object' && 'v' in c)? c.v : c; });
        if(/REQUIREMENTS BY BAND, ACROSS EVERY APPROPRIATION/.test(String(v[0]||''))){ on=true; return; }
        if(on && /^Counts only/.test(String(v[0]||''))){ on=false; return; }
        if(on && typeof v[1]==='number') out[v[0]]=v.slice(1).reduce(function(a,b){ return a+(typeof b==='number'? b : 0); }, 0); }); });
      return JSON.stringify(out); })()`));
    chk(name, 'by band', 'O&M counts the four requirements on its year’s list (A, B, C and NEW-2), never the id the Put back left behind', byBand['O&M'], 4);
    chk(name, 'by band', 'CONTROL — Full Fund counts its own two', byBand['Full Fund'], 2);
    chk(name, 'errors', 'no page error', errors.length ? errors.slice(0, 2).join(' | ') : '', '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 300), got: 'threw', want: 'ran' });
  }
  _rv2dRelease(__bm); await _rv2dSettle();
})();
// ---- end RV2-D ----
// ==== end v2.14 review round 2 fixes ====

// ==== v2.15 W1 (items 137, 138, 139: the context bar, a package under the receiving cycle, retag every locked appropriation) ====
// Brad, 2 Nov 2026 -- v2.13's question 2: "2a" (item 139); question 3: "No wrapping." (item 137). Every check but those labelled CONTROL
// fails on the slot commit (8c24ea2). Every expectation is a literal from the fixture.
// FOUR APPROPRIATIONS ON PB27: O&M (the board on screen) and Full Fund have locked it; Initial Spares locked it and reopened it; OPN never
// locked it. So the retag must move exactly two, name the other two with the way out, write each one's journal line, and leave the two
// stores it does not move byte for byte -- and a retag that moved every appropriation on PB27, or only the board on screen, disagrees.
await (async () => {
  const name = 'v2.15 W1 — the retag moves every appropriation that has locked the cycle, and Lock refuses a plan on another cycle (item 139)';
  try {
    const J = JSON.stringify;
    const T1 = 1790100000000, T2 = 1790200000000;
    const year = () => ({ order: [], alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [] });
    const store = (tag, by) => ({ ts: T1, base: 2027, cur: 2027, cycle: tag, by, years: { 2027: year() } });
    const lock = (ap, by) => ({ ts: T1, cycles: { 'PB|2027': { cyc: 'PB', cycYr: 2027, ap, locked: true, ts: T1, by, first: { ts: T1, by }, unlocks: [], years: {}, proj: {} } } });
    const reopened = (ap, by) => ({ ts: T2, cycles: { 'PB|2027': { cyc: 'PB', cycYr: 2027, ap, locked: false, ts: T1, by, unlocks: [{ ts: T2, by, on: false }], years: {}, proj: {} } } });
    const LS = (spTag = 'PB|2027') => ({ prio27ff: J(store('PB|2027', 'F Lead')), 'prio27ff-cyc': J(lock('ff', 'F Lead')),
      prio27sp: J(store(spTag, 'S Lead')), 'prio27sp-cyc': J(reopened('sp', 'S Lead')), prio27opn: J(store('PB|2027', 'N Lead')) });
    const KEYS = ['prio27ff', 'prio27ff-cyc', 'prio27ff.base', 'prio27sp', 'prio27sp-cyc', 'prio27sp.base', 'prio27opn', 'prio27opn-cyc', 'prio27opn.base'];
    const board = (ls, tag = 'PB|2027') => {
      const X = boot({ ls });
      seed(X.ev, { services: ['USAF', 'ANG'], items: [it('A', 'PSM', [100, 50]), it('B', 'AV', [80, 40])], disc: [150, 60], mand: [20, 10], order: ['A', 'B'] });
      X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); MS.svc=SVC.slice(); MS.cycle=${J(tag)}; save(); render();
        window.__q=[]; window.__yes=true; window.confirm=function(m){ window.__q.push(String(m)); return window.__yes; }; window.alert=function(){}; 'ok'`);
      X.store = () => X.ev(`JSON.stringify(${J(KEYS)}.map(function(k){ return localStorage.getItem(k); }))`);
      X.tag = k => { const s = JSON.parse(X.ev(`localStorage.getItem(${J(k)})`) || 'null'); return s ? s.cycle : 'none'; };
      X.jl = k => { const s = JSON.parse(X.ev(`localStorage.getItem(${J(k)})`) || 'null'); return ((s && s.jrnl) || []).filter(e => e && e.p && e.p[0] === '(cycle)').map(e => (e.a || '') + '>' + (e.b || '')); };
      X.stat = () => X.ev(`(document.getElementById('shareStat')||{}).textContent||''`);
      X.myJl = () => JSON.parse(X.ev(`JSON.stringify(MS.jrnl.filter(function(e){ return e.p && e.p[0]==='(cycle)'; }).map(function(e){ return (e.a||'')+'>'+(e.b||''); }))`));
      return X;
    };
    // ---------------------------------------------------------------- the lock, and the button after it
    const A = board(LS());
    A.ev(`blCyc='PB'; blYr=2027; cycLock(); 'ok'`);
    chk(name, 'the fixture', 'CONTROL: O&M locked PB27 and is tagged PB27; Full Fund locked it, Initial Spares reopened it, OPN never locked it -- all four on PB27',
      A.ev(`JSON.stringify(cycOverview().rows.map(function(r){ return [r.k, r.tag, cycCellOf(r.cycles['PB|2027']).s]; }))`),
      J([['om', 'PB|2027', 'locked'], ['ff', 'PB|2027', 'locked'], ['sp', 'PB|2027', 'open'], ['opn', 'PB|2027', 'none']]));
    const lockBtn = A.ev(`(function(){ var b=document.querySelector('#shareStat button[onclick="cycRetagNext()"]'); return b? b.textContent : 'none'; })()`);
    chk(name, 'after the lock', 'the button the lock offers says how many it moves: 2 of the 4 on PB27', lockBtn, '🏷 Retag 2 of 4 as BES28');
    A.ev(`blOpen=true; render(); 'ok'`);
    chk(name, 'PPBE cycles', 'the retag in PPBE cycles says the same', A.ev(`(function(){ var b=document.querySelector('#blBody button[onclick="cycRetagNext()"]'); return b? b.textContent : 'none'; })()`), '🏷 Retag 2 of 4 as BES28');
    // ---------------------------------------------------------------- Cancel changes nothing
    const before = A.store(), jl0 = J(A.myJl());
    A.ev(`window.__yes=false; window.__q=[]; cycRetagNext(); 'ok'`);
    chk(name, 'Cancel', 'it asks first, and Cancel changes nothing: no store written, the board still on PB27, no journal line',
      J([A.ev('window.__q.length'), A.store() === before, A.ev('MS.cycle'), J(A.myJl()) === jl0]), J([1, true, 'PB|2027', true]));
    // ---------------------------------------------------------------- OK: the two move, the two are named
    A.ev(`window.__yes=true; window.__q=[]; document.getElementById('shareStat').innerHTML=''; cycRetagNext(); 'ok'`);
    const q = A.ev('window.__q[0]||""');
    chk(name, 'the question', 'it names the two it moves and the two it leaves, with why',
      J([/^Retag 2 appropriations as BES28\?/.test(q), /• O&M \(this board\) — PB27 → BES28/.test(q), /• Full Fund — PB27 → BES28/.test(q),
        /• Initial Spares — PB27, NOT retagged: has not locked PB27: lock it on its own board, then retag/.test(q), /• OPN — PB27, NOT retagged: has not locked PB27/.test(q),
        /Initial Spares and OPN have not locked PB27: lock each on its own board, then retag\./.test(q)]), J([true, true, true, true, true, true]));
    chk(name, 'OK', 'O&M and Full Fund are on BES28, each with its journal line; Initial Spares and OPN stay on PB27',
      J([A.ev('MS.cycle'), A.tag('prio27ff'), A.tag('prio27sp'), A.tag('prio27opn'), A.myJl().slice(-1), A.jl('prio27ff'), A.jl('prio27sp'), A.jl('prio27opn')]),
      J(['BES|2028', 'BES|2028', 'PB|2027', 'PB|2027', ['PB|2027>BES|2028'], ['PB|2027>BES|2028'], [], []]));
    chk(name, 'OK', 'the stores it does not move are byte for byte as they were',
      J(KEYS.filter(k => /sp|opn/.test(k)).map(k => A.ev(`localStorage.getItem(${J(k)})`) === JSON.parse(before)[KEYS.indexOf(k)])), J([true, true, true, true, true, true]));
    chk(name, 'OK', 'the line names the two it moved and the way out for the two it did not',
      J([/O&M, Full Fund are retagged BES28/.test(A.stat()), /Initial Spares and OPN have not locked PB27: lock each on its own board, then retag/.test(A.stat())]), J([true, true]));
    chk(name, 'OK', 'the deltas reference stays the lock (CONTROL: the retag never moved it)', A.ev('MS.cycleRef'), 'PB|2027');
    // ---------------------------------------------------------------- the third button: Retag … as … under Locks by appropriation
    // Initial Spares on BES28 already (the calendar's lead); O&M and Full Fund locked PB27, OPN did not: the lead retag moves the two
    const L = board(LS('BES|2028'));
    L.ev(`blCyc='PB'; blYr=2027; cycLock(); blOpen=true; render(); 'ok'`);
    const leadBtn = L.ev(`(function(){ var b=document.querySelector('#blBody .cyc-ov-step button[onclick="cycRetagLead()"]'); return b? b.textContent : 'none'; })()`);
    chk(name, 'Locks by appropriation', 'the retag offered beside the calendar says how many it moves: 2 of the 3 on PB27', leadBtn, '🏷 Retag 2 of 3 as BES28');
    const lb = L.store();
    L.ev(`window.__q=[]; cycRetagLead(); 'ok'`);
    chk(name, 'Locks by appropriation', 'it moves O&M and Full Fund to BES28 and names OPN, which has not locked PB27; OPN and Initial Spares are left as they were',
      J([L.ev('MS.cycle'), L.tag('prio27ff'), L.tag('prio27opn'), L.tag('prio27sp'), /• OPN — PB27, NOT retagged: has not locked PB27/.test(L.ev('window.__q[0]||""')),
        L.ev(`localStorage.getItem('prio27opn')`) === JSON.parse(lb)[KEYS.indexOf('prio27opn')], L.ev(`localStorage.getItem('prio27sp')`) === JSON.parse(lb)[KEYS.indexOf('prio27sp')]]),
      J(['BES|2028', 'BES|2028', 'PB|2027', 'BES|2028', true, true, true]));
    // the same offer when the board opens behind the others
    { const L2 = board(LS('BES|2028'));
      L2.ev(`blCyc='PB'; blYr=2027; cycLock(); 'ok'`);
      const ls2 = JSON.parse(L2.ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
      const O = boot({ ls: ls2 });
      chk(name, 'opening', 'a board behind the others offers the same retag when it opens, with the count',
        // read off the session's messages: in the harness the shell's own opening line follows it on the status line
        O.ev(`(function(){ var m=STAT_LOG.map(function(x){ return String(x.html||''); }).join(' '), r=/onclick="cycRetagLead\\(\\)">([^<]*)</.exec(m); return r? r[1] : 'none'; })()`), 'Retag 2 of 3 as BES28'); }
    // ---------------------------------------------------------------- one appropriation alone keeps its own words
    { const S1 = board({});
      S1.ev(`blCyc='PB'; blYr=2027; cycLock(); 'ok'`);
      chk(name, 'one appropriation', 'CONTROL: with no other appropriation on PB27 the button keeps its words, and moves this board alone',
        J([S1.ev(`(function(){ var b=document.querySelector('#shareStat button[onclick="cycRetagNext()"]'); return b? b.textContent : 'none'; })()`),
          (S1.ev(`cycRetagNext(); MS.cycle`))]), J(['🏷 Retag it as BES28', 'BES|2028'])); }
    // ---------------------------------------------------------------- Lock refuses a plan tagged with another cycle
    { const R = board({}, 'BES|2028');
      R.ev(`window.__q=[]; blCyc='PB'; blYr=2027; cycLock(); 'ok'`);
      chk(name, 'Lock', 'a plan on BES28 is not locked as PB27: nothing asked, no lock taken, the tag unchanged',
        J([R.ev('window.__q.length'), R.ev(`String(!!blGet('PB|2027'))`), R.ev('MS.cycle')]), J([0, 'false', 'BES|2028']));
      chk(name, 'Lock', 'and the line names both and the way out',
        /Not locked — O&M’s plan is on BES28, so it cannot be locked as PB27: .*Tag this board PB27 under PPBE cycles \(Working plan is tagged\), lock, then retag\./.test(R.stat()), true);
      const R2 = board({}, 'PB|2027');
      R2.ev(`window.__q=[]; blCyc='PB'; blYr=2027; cycLock(); 'ok'`);
      chk(name, 'Lock', 'CONTROL: tagged PB27, it locks PB27 as before', J([R2.ev('window.__q.length'), R2.ev(`String(!!(blGet('PB|2027')||{}).locked)`), R2.ev('MS.cycle')]), J([1, 'true', 'PB|2027']));
      const U = board({}, '');
      U.ev(`blCyc='PB'; blYr=2027; cycLock(); 'ok'`);
      chk(name, 'Lock', 'CONTROL: an untagged plan is still tagged by its lock', J([U.ev(`String(!!(blGet('PB|2027')||{}).locked)`), U.ev('MS.cycle')]), J(['true', 'PB|2027'])); }
    // ---------------------------------------------------------------- a PMO copy and a locked view
    { const P0 = board(LS());
      P0.ev(`blCyc='PB'; blYr=2027; cycLock(); 'ok'`); P0.ff0 = P0.ev(`localStorage.getItem('prio27ff')`);
      const html = P0.ev(`pmoCopyHtml({sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, ap:APPN, base:pmoBaseline()})`);
      const P = boot({ html });
      P.ev(`window.confirm=function(){ return true; }; window.alert=function(){}; 'ok'`);
      chk(name, 'PMO copy', 'CONTROL: a PMO copy refuses the retag, its cycle unchanged', J([P.ev(`cycRetagNext(); MS.cycle`), /chosen on the portfolio board/.test(P.ev(`document.getElementById('shareStat').textContent`))]), J(['PB|2027', true]));
      P.ev(`blCyc='BES'; blYr=2028; cycLock(); 'ok'`);
      chk(name, 'PMO copy', 'a lock of another cycle in a copy is refused: it locks the cycle it was published with',
        J([P.ev(`String(!!blGet('BES|2028'))`), /This PMO copy reads PB27, as the portfolio team published it: lock PB27 here\./.test(P.ev(`document.getElementById('shareStat').textContent`))]), J(['false', true]));
      P0.ev(`cycView('PB|2027'); 'ok'`);
      chk(name, 'locked view', 'CONTROL: a locked view refuses the retag', J([P0.ev(`cycRetagNext(); _cycStash && _cycStash.MS.cycle`), P0.ev(`localStorage.getItem('prio27ff')`) === P0.ff0]), J(['PB|2027', true]));
      P0.ev(`cycLeave(true); 'ok'`); }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
})();
// THE CONTEXT BAR'S STEPS (item 137), in jsdom: what the steps draw, and the order fitTop takes them in. jsdom lays nothing out, so the bar's
// widths are stood in for: the bar is 1,000px of content in 700px until each step takes its share (the labels 100, the short figure 100,
// the figure leaving 50, the fourth step 50) -- so it takes all four, in order, and stops at the first that fits. The real widths are
// layout-fits S and toolbar-fits'. The figure is the v2.13 block's: FY27 · $541K unallocated · ⚠ $50 over against BES28.
await (async () => {
  const name = 'v2.15 W1 — the context bar gives the PPBE cycle’s figure less room in steps, never wrapping first (item 137)';
  try {
    const J = JSON.stringify;
    const B = w3Board(), { ev } = B;
    ev(`cycApplyAll('BES|2028'); render(); 'ok'`);
    const fig = () => JSON.parse(ev(`(function(){ var f=document.getElementById('cycFit'); return JSON.stringify({t:f.textContent, l:f.getAttribute('data-l'), s:f.getAttribute('data-s'), title:f.title.split(' — ')[0]}); })()`));
    chk(name, 'the figure', 'two lengths: the whole sentence, and short -- no "FY27 ·", "unallocated" and "over" as signs', J([fig().l, fig().s]), J(['FY27 · $541K unallocated · ⚠ $50 over', '$541K · ⚠ $50']));
    chk(name, 'the figure', 'its tooltip leads with the whole sentence', fig().title, 'FY27 · $541K unallocated · ⚠ $50 over');
    // the stand-in widths, then fitTop
    ev(`(function(){ var h=document.querySelector('.hdr'), f=document.getElementById('cycFit');
      Object.defineProperty(h, 'clientWidth', {configurable:true, get:function(){ return window.__cw; }});
      Object.defineProperty(h, 'scrollWidth', {configurable:true, get:function(){ var w=1000, c=h.classList;
        if(c.contains('tight1')) w-=100; if(c.contains('cyc1') && f.textContent===f.getAttribute('data-s')) w-=100; if(c.contains('cyc2')) w-=50; if(c.contains('tight3')) w-=50; return w; }}); })(); 'ok'`);
    const at = cw => JSON.parse(ev(`window.__cw=${cw}; fitTop(); JSON.stringify([document.querySelector('.hdr').className, document.getElementById('cycFit').textContent])`));
    chk(name, 'the steps', 'room for it all: nothing changes', J(at(1000)), J(['hdr', 'FY27 · $541K unallocated · ⚠ $50 over']));
    chk(name, 'the steps', 'first the labels go, and nothing else', J(at(900)), J(['hdr tight1', 'FY27 · $541K unallocated · ⚠ $50 over']));
    chk(name, 'the steps', 'then the figure shortens', J(at(800)), J(['hdr tight1 cyc1', '$541K · ⚠ $50']));
    chk(name, 'the steps', 'then it leaves the bar for the list', J(at(750)), J(['hdr tight1 cyc1 cyc2', '$541K · ⚠ $50']));
    chk(name, 'the steps', 'then the fourth step, and the bar fits on one line -- never wrapped while a step is left', J(at(700)), J(['hdr tight1 cyc1 cyc2 tight3', '$541K · ⚠ $50']));
    chk(name, 'the steps', 'only a bar that still does not fit wraps (the phone layout)', J(at(600)), J(['hdr tight1 cyc1 cyc2 tight3 tight2', '$541K · ⚠ $50']));
    chk(name, 'the steps', 'and given room again, it comes back whole', J(at(1000)), J(['hdr', 'FY27 · $541K unallocated · ⚠ $50 over']));
    // moved into the list: the list leads with the whole sentence, opening Fit to the PPBE position; the button carries the over
    at(750);
    ev(`toggleMenu('cyc'); 'ok'`);
    const L = JSON.parse(ev(`(function(){ var b=document.querySelector('#dd_cyc .cycfit-in button.mi'), first=document.querySelector('#dd_cyc button');
      return JSON.stringify({txt:b? b.textContent.replace(/\\s+/g,' ').trim() : 'none', on:b? b.getAttribute('onclick') : '', first:first===b, fover:document.getElementById('b_cyc').classList.contains('fover'),
        tip:/⚠ \\$50 over BES28’s controls in FY27\\./.test(document.getElementById('b_cyc').title)}); })()`));
    chk(name, 'in the list', 'the list leads with the whole sentence, and it opens Fit to the PPBE position',
      J([L.txt, L.on, L.first]), J(['FY27 · $541K unallocated · ⚠ $50 overopens Fit to the PPBE position', 'mRun(()=>fitShow())', true]));
    chk(name, 'in the list', 'and the PPBE cycle carries the over: its ⚠ mark, and the figure in its tooltip', J([L.fover, L.tip]), J([true, true]));
    ev(`fitOpen=false; document.querySelector('#dd_cyc .cycfit-in button.mi').click(); 'ok'`);
    await new Promise(r => setTimeout(r, 40));
    chk(name, 'in the list', 'a press on it opens Fit to the PPBE position, and closes the list', J([ev('String(fitOpen)'), ev('String(openMenu)')]), J(['true', 'null']));
    // nothing over: no mark
    ev(`fitOpen=false; render(); S.fsrc={}; applyState(S); MS.years[MS.cur]=S; save(); render(); 'ok'`);
    chk(name, 'nothing over', 'with nothing over, the button carries no mark (CONTROL of the mark)', ev(`String(document.getElementById('b_cyc').classList.contains('fover'))`), 'false');
    if (B.errors.length) chk(name, 'jsdom', 'no script errors', B.errors.slice(0, 2).join(' | '), '');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
})();
// ==== end v2.15 W1 ====
// ==== v2.15 W2 (items 142, 143, 145; item 131 FDC listener: the copy that opens, Save records what it wrote, two tabs) ====
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
