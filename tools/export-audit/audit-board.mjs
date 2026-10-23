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
  try {
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
  ev(`openFld('A','cons'); "ok"`);
  chk(name, 'cons', 'opens on the requirement', isOpen(), true);
  chk(name, 'cons', 'titled with the one name the board uses', ev(`document.getElementById('fldTitle').textContent.indexOf('\u26a0 Impact statement')===0`), true);
  chk(name, 'cons', 'loads what is already stored',
    ev(`(document.getElementById('fld-cons')||{}).value===undefined? 'no field' : 'present'`), 'present');
  ev(`document.getElementById('fld-cons').value='Depot line stops in March.'; fldSave(); "ok"`);
  chk(name, 'cons', 'saves what was typed', ev(`(S.cons||{})['A']||''`), 'Depot line stops in March.');
  chk(name, 'cons', 'and closes once saved', isOpen(), false);

  // DESCRIPTION & NOTE: one pop-up, two fields. The description first, the note under it, one Save
  // -- and each still its own field: kept, journalled and sent as itself.
  ev(`openFld('A','dn'); "ok"`);
  chk(name, 'desc & note', 'one pop-up holds both, the description first',
    ev(`[...document.querySelectorAll('#fldBody textarea')].map(function(t){ return t.id; }).join(',')`), 'fld-desc,fld-note');
  chk(name, 'desc & note', 'titled Description & note', ev(`document.getElementById('fldTitle').textContent.indexOf('\ud83d\udcc4 Description & note')===0`), true);
  ev(`document.getElementById('fld-desc').value='Sustains the fielded capability.';
      document.getElementById('fld-note').value='Agreed at the Sep SFWG.'; fldSave(); "ok"`);
  chk(name, 'desc & note', 'saves both, each to its own field', ev(`[(S.desc||{}).A, S.notes.A].join(' | ')`), 'Sustains the fielded capability. | Agreed at the Sep SFWG.');
  chk(name, 'desc & note', 'and closes once saved', isOpen(), false);
  // SAVING ONE NEVER RE-STAMPS OR BLANKS THE OTHER. The note is held exactly as an import left it,
  // spacing and all; a save that wrote it back would trim it and journal it as an edit nobody made.
  ev(`S.notes.A='Agreed at the Sep SFWG.  '; save(); "ok"`);
  const j0 = ev(`(MS.jrnl||[]).length`);
  ev(`openFld('A','dn'); document.getElementById('fld-desc').value='Sustains the fielded fleet.'; fldSave(); "ok"`);
  chk(name, 'desc & note', 'a changed description is written', ev(`(S.desc||{}).A`), 'Sustains the fielded fleet.');
  chk(name, 'desc & note', 'the unchanged note is not written at all', ev(`JSON.stringify(S.notes.A)`), JSON.stringify('Agreed at the Sep SFWG.  '));
  chk(name, 'desc & note', 'and the journal records the description alone',
    ev(`JSON.stringify((MS.jrnl||[]).slice(${j0}).map(function(e){ return (e.p||[])[0]; }))`), '["desc"]');
  ev(`openFld('A','dn'); document.getElementById('fld-desc').value=''; fldSave(); "ok"`);
  chk(name, 'desc & note', 'clearing the description leaves the note', ev(`[JSON.stringify((S.desc||{}).A||null), JSON.stringify(S.notes.A)].join(' | ')`),
    'null | ' + JSON.stringify('Agreed at the Sep SFWG.  '));
  ev(`openFld('A','dn'); fldSave(); "ok"`);
  chk(name, 'desc & note', 'a Save with nothing changed writes nothing and closes', isOpen() + ' ' + ev(`(MS.jrnl||[]).length`) + ' ' + ev(`JSON.stringify(S.notes.A)`),
    'false ' + ev(`(MS.jrnl||[]).length`) + ' ' + JSON.stringify('Agreed at the Sep SFWG.  '));
  // A requirement removed out from under the editor must not leave it open on nothing -- for every
  // kind of editor the board HAS. (v1.86: this read kind 'note', which v1.86 retired; an unknown kind
  // closes the editor by another line, so the check passed with the guard removed, and the gate's
  // sweep said so. The kinds now come from the board, and there must be some.)
  const kinds = JSON.parse(ev('JSON.stringify(Object.keys(FLD_DEF))'));
  chk(name, 'stale', 'the board has editor kinds to check', kinds.length >= 2, true);
  const stale = kinds.filter(k => {
    ev(`openFld('A',${JSON.stringify(k)}); "ok"`);
    const opened = isOpen();
    let err = '';
    try { ev(`fldOpen={id:'GONE', kind:${JSON.stringify(k)}}; fldBody(); "ok"`); } catch (e) { err = String(e.message || e); }
    return !opened || err || isOpen();
  });
  chk(name, 'stale', 'each kind opens, then closes when its requirement is gone', stale.join(',') || 'all', 'all');

  // 2. the routing: the impact statement opens the pop-up (v2.03: the card build's row expander, which a board with no
  // RECORD panel fell back to, is gone)
  ev(`toggleCons('A'); "ok"`);
  chk(name, 'routing', 'the impact statement opens the pop-up', isOpen() && ev(`fldOpen && fldOpen.kind`) === 'cons', true);
  ev(`fldClose(); render(); "ok"`);
  // the description and the note open the one pop-up (v1.86)
  for (const fn of ['toggleDesc', 'toggleNote']) {
    ev(`${fn}('A'); "ok"`);
    chk(name, 'routing', `${fn} opens Description & note`, isOpen() && ev(`fldOpen && fldOpen.kind`) === 'dn', true);
    ev(`fldClose(); "ok"`);
  }
  // ONE NAME EVERYWHERE: nothing on screen still says the old ones
  ev(`S.cons={}; S.band.A=BANDS_LIST()[0].id; render(); if(typeof inspectorBody==='function') inspectorBody(); "ok"`);
  const shown = ev(`(function(){ var b=document.body.cloneNode(true); b.querySelectorAll('script,style').forEach(function(x){ x.remove(); }); return b.textContent; })()`);   // what a person can read, not the code
  chk(name, 'names', 'no "📋 Record", "Impact —", "CONSEQUENCE" or "REQUIREMENT RECORD" is left on screen',
    ['\ud83d\udccb Record', 'Impact \u2014', 'CONSEQUENCE', 'REQUIREMENT RECORD'].filter(t => shown.indexOf(JSON.parse('"' + t + '"')) >= 0).join(',') || 'none', 'none');
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
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
      MS.years[MS.cur]=S; MS.base=MS.cur; blCyc='PB'; blYr=MS.cur; cycLock(); blCyc='POM'; blYr=MS.cur; cycLock(); 'ok'`);
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
  ev(`MS.ppbe=MS.ppbe||{}; MS.ppbe['POM|2099']={v:2, split:false, lines:{}, val:{USAF:{L1:{}}}}; MS.ppbe['POM|2099'].val.USAF.L1[MS.cur]={d:1000.6, m:250.4}; bmSeedFromPp('POM|2099'); 'ok'`);
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
      blCyc='PB'; blYr=MS.cur; cycLock(); blCyc='BES'; blYr=MS.cur+1; cycLock();
      MS.cycleRef='${keyA}'; save(); setAsk('B',0,'123'); 'ok'`);
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

// v1.89, ITEM 22: A REQUIREMENT ADDED BY ITS TOTAL IS WHOLE DOLLARS THAT ADD UP TO THAT TOTAL.
// addReq() divided the total by the number of services and kept the fraction. Before a reopen the
// workbook printed 999,999.9999999999 and an unfunded row of $1.000000000000007, with two sheets
// disagreeing about one requirement; the reopen then rounded each service by itself, so $1,000,000
// typed across six came back as $1,000,002. Driven through the form, the way a person adds one.
// The oracle is arithmetic, not apportion(): floor(total/n) each, one more for the first total%n.
// Compared as TEXT: chk() allows 0.005 on numbers, which 999,999.9999999999 passes.
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
    return ev;
  };
  const addByTotal = (ev, title, tot) => JSON.parse(ev(`(function(){ _addPanelSvc=null; syncAddPanel();
      var n0=S.custom.length; globalThis.__al='';
      document.getElementById('naTitle').value=${JSON.stringify(title)};
      document.getElementById('naTot').value=${JSON.stringify(String(tot))};
      document.getElementById('naGrp').value=GROUPS[0]; addReq();
      var c=S.custom.length>n0? S.custom[S.custom.length-1] : null;
      return JSON.stringify(c? {id:c.id, ask:c.ask, item:(itemById(c.id)||{}).ask} : null); })()`));
  for (const [n, totals] of [[6, [1000000, 5, 100]], [3, [100, 1000000]], [1, [7]]]) {
    const ev = board(n);
    const added = totals.map(tot => [tot, addByTotal(ev, 'By total ' + tot, tot)]);
    const R = boot({ html: ev('buildSavedHtml()') });
    for (const [tot, g] of added) {
      const at = `${n} service(s), $${tot.toLocaleString()} typed`;
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
    const n0 = ev('S.custom.length+"/"+DATA.items.length');
    ev(`globalThis.__apx=apportion; apportion=function(t,w){ return w.map(function(){ return t/w.length; }); }; 'ok'`);
    const refused = addByTotal(ev, 'Would carry cents', 100);
    ev(`apportion=globalThis.__apx; 'ok'`);
    chk(name, 'refusal', 'a value that is not whole dollars is never put on the board', refused === null && ev('S.custom.length+"/"+DATA.items.length') === n0, true);
    chk(name, 'refusal', 'and the person is told why', /not in whole dollars/.test(ev('globalThis.__al')), true);
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
        globalThis.__add=function(t){ _addPanelSvc=null; syncAddPanel(); var n0=S.custom.length;
          document.getElementById('naTitle').value=t; document.getElementById('naTot').value='';
          SVC.forEach(function(s,i){ document.getElementById('naSvc'+i).value=String(100*(i+1)); });
          document.getElementById('naGrp').value=GROUPS[0]; addReq();
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
  R.ev(`removeReq(${JSON.stringify(n4)}); _addPanelSvc=null; syncAddPanel();
    document.getElementById('naTitle').value='After reopen';
    SVC.forEach(function(s,i){ document.getElementById('naSvc'+i).value='10'; });
    document.getElementById('naGrp').value=GROUPS[0]; addReq(); 'ok'`);
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
  ev(`render(); document.getElementById('naTitle').value='ADDED'; document.getElementById('naEvent').value='e';
      document.getElementById('naGrp').value='AV'; document.getElementById('naTot').value='';
      document.getElementById('naSvc0').value='9000000'; document.getElementById('naSvc1').value='1000000'; addReq(); 'ok'`);
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
  ev(`render(); document.getElementById('naTitle').value='OM added'; document.getElementById('naEvent').value='e';
      document.getElementById('naGrp').value='AV'; document.getElementById('naTot').value='';
      document.getElementById('naSvc0').value='2000000'; document.getElementById('naSvc1').value='0'; addReq(); setGrp('NEW-1','TSS');
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
  chk(name, 'rows', 'opened with nothing unfolded: Reports & exports 20 (Find, Pre-flight and the eighteen reports and exports, side by side -- v2.04 added the three AI review entries), Setup 6 (three groups, Live view, Save diagnostics, Clear this computer -- v2.04), Filter 2, the year 9, Data 7, Program offices 4, Audit 4, Save’s ▾ 1, Imports & exports 5',
    // v2.05 (item 114): 15 -- the deck, the synopsis and Executive decision removed, and the companion tool a link at the box's foot
    J(['reports', 'setup', 'view', 'fy', 'data', 'offices', 'audit', 'save', 'boards'].map(shown)), J(['15', '6', '2', '9', '7', '4', '4', '1', '5']));
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
  chk(name, 'contents', 'Spend plan & cash: Two Spend Plans and the CR Cash Return (1A9A); the forecast and CR Cash Needs are views, and the box’s foot says where each view lives',
    J([callsIn('#dd_reports .uiRs[data-g="spend"] .mi'), /CR Cash Needs under Execution ▸; the five-year spend plan, PPBE Budget Positions and Spruills under FYDP ▸/.test(ev(`document.querySelector('#dd_reports .uiRfoot').textContent`))]),
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
  chk(name, 'contents', 'the views, one home each on the left menu: FYDP ▸ and Execution ▸',
    J([flyCalls('fydp'), flyCalls('exec')]),
    J([['toggleFydp', 'toggleSp', 'toggleP2', 'toggleFlow'], ['toggleEx', 'toggleFc', 'toggleCr', 'toggleQpe', 'toggleDiv']]));
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
  keeps('CLIN request', `S.clinNew={P1:[{key:'n1', clin:'0001', desc:'a', ccar:'', ask:[10,20]}]}`, `clinSetReq('P1','n1',b)`, `S.clinNew.P1[0].ask`);
  keeps('WBS figure', `S.wbs={X:[{w:'1.1', v:[5,6]},{w:'1.2', v:[7,8]}]}`, `wbsSetVal('req','X','',0,1,b)`, `S.wbs.X`);
  keeps('unit cost', `DATA.buys=true; S.buys={ac:{base:[0,0], adj:[2,3], cost:[1000,2000], locked:false}, eng:{base:[0,0], adj:[0,0], cost:[0,0], locked:false}}`,
    `setBuy('ac','cost',0,b)`, `S.buys.ac.cost`);
  w1ev(ev, `delete DATA.buys; 'ok'`);
  // the total a quantity and a unit cost make is held to the bound too
  chk(name, 'unit cost', 'a unit cost of $6,000,000,000,000 on a quantity of 2 would make $12 trillion: refused, the cost kept',
    w1ev(ev, `(function(){ DATA.buys=true; S.buys={ac:{base:[0,0], adj:[2,3], cost:[1000,2000], locked:false}, eng:{base:[0,0], adj:[0,0], cost:[0,0], locked:false}};
      setBuy('ac','cost',0,'$6,000,000,000,000'); const c=S.buys.ac.cost.slice(); delete DATA.buys; return JSON.stringify(c); })()`), J([1000, 2000]));
  // ADD REQUIREMENT: a box it cannot read stops the add; nothing is added, and the alert names the box
  const add = (svc0, tot) => w1json(ev, `JSON.stringify((function(){ render(); syncAddPanel(); const n0=S.custom.length, al=[], _a=window.alert; window.alert=function(m){ al.push(String(m)); };
      document.getElementById('naTitle').value='New one'; document.getElementById('naEvent').value='e'; document.getElementById('naGrp').value='AV';
      document.getElementById('naSvc0').value=${J(svc0)}; document.getElementById('naSvc1').value=''; document.getElementById('naTot').value=${J(tot)};
      try{ addReq(); }finally{ window.alert=_a; }
      return [S.custom.length-n0, al.join(' | ')]; })())`);
  const a1 = add('7oops', ''), a2 = add('', '1.2.3');
  chk(name, 'add requirement', 'a USAF value of “7oops”, or a total of “1.2.3”: nothing is added, and the alert names the box',
    J([a1[0], /USAF: .*7oops.* is not an amount/.test(a1[1]), a2[0], /Total: .*1\.2\.3.* is not an amount/.test(a2[1])]), J([0, true, 0, true]));
  // A BLANK STILL CLEARS (CONTROL): an empty box is the deliberate reset it always was
  chk(name, 'blank', 'CONTROL — a blank clears: the requirement value to $0, the allocation back to the requirement value, the minimum increment gone (passes on v1.96)',
    w1ev(ev, `(function(){ itemById('X').ask=[500,700]; setAsk('X',0,''); S.alloc.X={m:'t', v:900}; setAlloc('X',''); S.minInc.X=300; setMinInc('X','');
      return JSON.stringify([itemById('X').ask, S.alloc.X, S.minInc.X===undefined]); })()`), J([[0, 700], null, true]));
  // A CENT IS ROUNDED, AND SAID: whole dollars, with the figure kept named in the message
  chk(name, 'rounding', '1,234.56 typed as a requirement value is $1,235, and the message says what was entered',
    w1ev(ev, `(function(){ setStat(''); setAsk('X',1,'1,234.56'); return JSON.stringify([itemById('X').ask[1], /entered as \\$1,235/.test(document.getElementById('shareStat').textContent)]); })()`),
    J([1235, true]));
  // THE CLIN REQUEST IS SPREAD IN WHOLE DOLLARS that add up to what was typed
  chk(name, 'CLIN request', '$100 over a CLIN asking [1, 2] is [33, 67]: whole dollars, adding up to $100',
    w1ev(ev, `(function(){ S.clinNew={P1:[{key:'n1', clin:'0001', desc:'a', ccar:'', ask:[1,2]}]}; clinSetReq('P1','n1','$100'); return JSON.stringify(S.clinNew.P1[0].ask); })()`),
    J([33, 67]));
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
  // PID: 36 refused (kept PID-OLD; the box opens again holding the 36); 35 taken (a CONTROL). v2.01 (Brad, 20 Oct): the limit
  // is 35, not 20 -- a 21- to 35-character PID, refused before, is taken whole, and the prompt says the limit
  let r = ask(`editPid('X')`, [L(36)]);
  chk(name, 'PID, typed', '36 characters: refused, the PID stays, and the box opens again holding what was typed',
    J([w1ev(ev, `S.pid.X`), r.pr.length, r.pr[1], /at most 35/.test(r.stat)]), J(['PID-OLD', 2, L(36), true]));
  ask(`editPid('X')`, [L(35)]);
  chk(name, 'PID, typed', 'CONTROL — 35 characters are taken whole', w1ev(ev, `S.pid.X`), L(35));
  const pq = w1json(ev, `JSON.stringify((function(){ var q=''; var _p=uiPrompt; uiPrompt=function(t){ q=String(t); };
    try{ editPid('X'); } finally { uiPrompt=_p; } return q; })())`);
  chk(name, 'PID, typed', 'v2.01: the prompt says the limit is 35', String(/\(up to 35 characters\):$/.test(pq)), 'true');
  // CCaR record: 13 refused, 12 taken
  r = ask(`editCcar('X')`, [L(13)]);
  chk(name, 'CCaR record, typed', '13 characters: refused, the record stays, and the box opens again holding them',
    J([w1ev(ev, `ccarOf(itemById('X'))`), r.pr[1], /at most 12/.test(r.stat)]), J(['CC-OLD', L(13), true]));
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
  const nf = w1json(ev, `JSON.stringify((function(){ render(); syncAddPanel(); const n0=S.custom.length, al=[], _a=window.alert; window.alert=function(m){ al.push(String(m)); };
      document.getElementById('naTitle').value='Proposed one'; document.getElementById('naEvent').value='e'; document.getElementById('naGrp').value='AV';
      document.getElementById('naSvc0').value='100'; document.getElementById('naSvc1').value=''; document.getElementById('naTot').value='';
      document.getElementById('naCcar').value=${J(L(13))};
      try{ addReq(); }finally{ window.alert=_a; }
      return [S.custom.length-n0, document.getElementById('naCcar').value, document.getElementById('naTitle').value, document.getElementById('naCcar').hasAttribute('maxlength')]; })())`);
  chk(name, 'the new-requirement form', '13 characters of CCaR: nothing is added, the form keeps the CCaR and the title, and the field has no silent cut',
    J(nf), J([0, L(13), 'Proposed one', false]));
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
  for (const r of reqs) B.ev(`document.getElementById('naTitle').value=${JSON.stringify(r)};
    SVC.forEach(function(s,i){ document.getElementById('naSvc'+i).value=String(100*(i+1)); }); addReq();`);
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
  const iAsk = at.lastIndexOf('custom.0.ask.0'), iNote = at.lastIndexOf('notes.' + ev(`S.custom[0].id`));
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
      openFld('A','cons'); r.popup=(document.querySelector('#fldPanel h3')||{}).textContent||''; fldClose();
      recOpen='A'; render(); r.recHead=(document.getElementById('recHead')||{}).textContent||'';
      r.recFields=recFields('A', itemById('A')).filter(function(f){ return f.k==='grp'; }).map(function(f){ return f.l; });
      recOpen=null; render();
      r.gate=pmoProposalGate('A');
      r.flag=[].slice.call(document.querySelectorAll('#row-A .exc')).map(function(e){ return e.textContent; }).join(' | ');
      r.guide=helpSections().some(function(s){ return /Impact statement/.test(s.el.textContent); });
      r.guideNew=helpSections().some(function(s){ return /Consequence if unfunded/.test(s.el.textContent); });
      return JSON.stringify(r); })()`));
    const a = read();
    chk(name, 'as shipped', 'the RECORD panel’s buttons start with the three names',
      J(['⚠ Impact statement', '📄 Description & note', '📋 Requirement edit'].map((n, i) => (a.buttons[i] || '').startsWith(n))), J([true, true, true]));
    chk(name, 'as shipped', 'the row flags the missing impact statement by its name', /Impact statement required/.test(a.flag), true);
    chk(name, 'as shipped', 'the proposal gate does not list a field the requirement has (its PMO), and lists one it lacks',
      J([a.gate.indexOf('PMO') >= 0, a.gate.indexOf('Impact statement') >= 0]), J([false, true]));
    ev(`REQ_FIELD.cons.l='Consequence if unfunded'; REQ_FIELD.dn.l='Notes and description'; REQ_FIELD.rec.l='Record'; REQ_FIELD.grp.l='Office'; REQ_FIELD.obCat.l='How the money leaves'; 'ok'`);
    const b = read();
    ev(`REQ_FIELD.cons.l='Impact statement'; REQ_FIELD.dn.l='Description & note'; REQ_FIELD.rec.l='Requirement edit'; REQ_FIELD.grp.l='PMO'; REQ_FIELD.obCat.l='Obligation category'; render(); 'ok'`);
    chk(name, 'renamed', 'the RECORD panel’s buttons say the new names',
      J(['⚠ Consequence if unfunded', '📄 Notes and description', '📋 Record'].map((n, i) => (b.buttons[i] || '').startsWith(n))), J([true, true, true]));
    chk(name, 'renamed', 'the pop-up’s title says the new name', b.popup.includes('⚠ Consequence if unfunded'), true);
    chk(name, 'renamed', '📋 Requirement edit’s heading says the new name', b.recHead, '📋 RECORD');
    chk(name, 'renamed', 'its PMO field is called what the registry calls it', J(b.recFields), J(['Office']));
    chk(name, 'renamed', 'the proposal gate names the missing fields by the new names (A has no obligation category or impact statement)',
      J(['How the money leaves', 'Consequence if unfunded'].map(n => b.gate.indexOf(n) >= 0)), J([true, true]));
    chk(name, 'renamed', 'the row’s flag says the new name', /Consequence if unfunded required/.test(b.flag), true);
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
  ev(`window.__sw=[]; window.__swWas=switchAppn; switchAppn=function(a){ window.__sw.push(a); }; blOpen=true; render();
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
