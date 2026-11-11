// The model with a BAE report of budgets loaded (CONTRACT §14.2–§14.5): SP.buildModel's fourth argument, SP.baeDerive,
// SP.budgetPmo, bpmo on the pull's rows, the marks and their words, SP.oblLabel's word, the Summary's line 2 and notes,
// the PMO tab's lines, model.bae and SP.diffBae.
//
// The expectations come from test/fixture/oracle.py, which reads the same synthetic pull and report files with Python
// and openpyxl and works every figure out from the contract alone. The tool's model is compared to it VALUE FOR VALUE in
// every bae-* scenario §14.8 names. Then the identities §14 forces are asserted on every scenario, each restated here:
// a covered block's PMO rows add to the block; the slides, the trees and the totals bands are the no-report model's
// exactly (rule 6); the switches move the report's figures by exactly the report rows they hide, as they move the plan
// by the pull rows they hide, both taken from the generator's own record (manifest.json), never from either program.
// Last, hand-built rows reach what the fixture does not: §16's split of a budget among the PMOs whose plan events use it
// (a remainder among three, a plan below zero, a plan event on two budgets), the words of every mark, label and note, and
// SP.diffBae's edges.
//
//   node spend-plan/test/engine-bae.test.mjs
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTool, checks, scratchDir } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const MAKE = join(HERE, 'fixture', 'make_fixture.py');
const ORACLE = join(HERE, 'fixture', 'oracle.py');
const C = checks('engine-bae');
const tmp = scratchDir('sfcbsp-engine-bae-');
const t = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine'] });
const SP = t.SP;
const NOW = '2026-11-09T12:00:00.000Z', NOW2 = '2026-12-02T15:00:00.000Z';

// restated from CONTRACT §2/§4/§14, never read from the tool
const COLS = ['prior', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12', 'next', 'nodate'];
const AP_ORDER = ['om', 'ff', 'sp', 'opn'];
const AP_LABEL = { om: 'O&M', ff: 'Full Fund', sp: 'Initial Spares', opn: 'OPN' };
const normKey = s => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
const sum = a => a.reduce((x, y) => x + y, 0);
const J = x => JSON.stringify(x);
const OLD_DAGGER = 'Authorized was not entered; Approved is shown in its place (on a total, for the rows marked †).';
const NEW_DAGGER = 'Authorized was neither entered nor in the BAE report; Approved is shown in its place (on a total, for the rows marked †).';
const SECT = 'Approved is the CCaR plan: the BAE report has no figure for this block.';
// review I4-4: with a report, ‡ is on every typed figure (answer 8: "marked as entered"), and its words say so
const NEW_DDAGGER = 'Authorized as entered, for the appropriation and FY as a whole: it is used in place of the BAE report’s figure, where the report has one, and covers every service and lane, whatever the switches show.';
const LINE2_TAIL = ' | Obligated = CCaR status "Actual Execution" | Unobligated = Approved - Obligated | Delta = Obl% - OSD%';

// ---------------------------------------------------------------------------------------------------- comparing
// as engine.test.mjs compares: whole numbers exactly, a fraction within the contract's 1e-12, objects by their keys
// whatever their order, lists in order
function diff(got, want, path = '') {
  if (typeof want === 'number' && typeof got === 'number') {
    if (Number.isInteger(want) && Number.isInteger(got)) return got === want ? null : path + ': got ' + got + ', want ' + want;
    return Math.abs(got - want) <= 1e-12 ? null : path + ': got ' + got + ', want ' + want;
  }
  if (want === null || got === null || typeof want !== 'object' || typeof got !== 'object') {
    return got === want ? null : path + ': got ' + J(got) + ', want ' + J(want);
  }
  if (Array.isArray(want) !== Array.isArray(got)) return path + ': one is a list and the other is not';
  if (Array.isArray(want)) {
    if (got.length !== want.length) return path + ': ' + got.length + ' entries, want ' + want.length
      + (got.length > want.length ? ' (extra ' + J(got[want.length]).slice(0, 200) + ')' : ' (missing ' + J(want[got.length]).slice(0, 200) + ')');
    for (let i = 0; i < want.length; i++) { const d = diff(got[i], want[i], path + '[' + i + ']'); if (d) return d; }
    return null;
  }
  const kg = Object.keys(got).sort(), kw = Object.keys(want).sort();
  const miss = kw.filter(k => !(k in got)), extra = kg.filter(k => !(k in want));
  if (miss.length || extra.length) return path + ': keys differ' + (miss.length ? ', missing ' + J(miss.slice(0, 5)) : '')
    + (extra.length ? ', extra ' + J(extra.slice(0, 5)) : '');
  for (const k of kw) { const d = diff(got[k], want[k], path + '.' + k); if (d) return d; }
  return null;
}
function same(name, got, want) { const d = diff(got, want); return C.chk(name, d === null, d || ''); }
const pick = (o, ks) => Object.fromEntries(ks.map(k => [k, o[k]]));

// --------------------------------------------------------------------------------------------- the tool's model
// read into the oracle's shape
const byCol = arr => Object.fromEntries(COLS.map((id, i) => [id, arr[i]]));
function flatTree(tree) {
  const out = { pmos: {}, titles: {}, pes: {}, ccars: {} };
  for (const p of tree) {
    out.pmos[p.label] = { total: p.total, cols: byCol(p.cols) };
    for (const ti of p.children) {
      out.titles[p.label + '|' + ti.label] = ti.total;
      for (const e of ti.children) {
        out.pes[p.label + '|' + ti.label + '|' + e.label] = e.total;
        for (const c of e.children) out.ccars[p.label + '|' + ti.label + '|' + e.label + '|' + c.label] = c.total;
      }
    }
  }
  return out;
}
const naRow = it => [it.col, it.group, it.key, it.cents, it.label];
function blockShape(b) {
  const f = flatTree(b.tree);
  return { ap: b.ap, fy: b.fy, n: b.n, curve: b.curve, approved: b.approved, unprog: b.unprog, obligated: b.obligated,
    unobligated: b.unobligated, authorized: b.authorized, authorizedEntered: b.authorizedEntered, oblPct: b.oblPct,
    goal: b.goal, delta: b.delta, status: b.status, execAfterAsOf: b.execAfterAsOf, cols: byCol(b.cols), cum: byCol(b.cum),
    obl: byCol(b.obl.map(o => [o.v, o.kind])), goalC: byCol(b.goalC), statusC: byCol(b.statusC.map(s => [s.status, s.kind])),
    pmos: f.pmos, titles: f.titles, pes: f.pes, ccars: f.ccars, na: b.na.map(naRow),
    // §14.3
    planned: b.planned, approvedSrc: b.approvedSrc, covered: b.covered, authorizedSrc: b.authorizedSrc, slide: b.slide,
    planShort: b.planShort, marks: b.marks };
}
// the PMO tabs: the stoplight row (pmos[].rows, §14.4) and, below it, the detail by the PMO column (its PMO block)
function pmoTabs(M) {
  const tabs = {};
  for (const p of M.pmos) {
    tabs[p.label] = {};
    p.blocks.forEach((pb, i) => {
      const r = p.rows[i];
      tabs[p.label][pb.key] = { approved: r.approved, authorized: r.authorized, obligated: r.obligated, unobligated: r.unobligated,
        oblPct: r.oblPct, goal: r.goal, delta: r.delta, status: r.status, basis: r.basis, sect: r.sect,
        planned: pb.planned, unprog: pb.unprog, execAfterAsOf: pb.execAfterAsOf, cols: byCol(pb.cols), na: pb.na.map(naRow),
        offObligated: r.offObligated };
    });
  }
  return tabs;
}
function diffShape(D) {
  const out = {};
  for (const [ap, d] of Object.entries(D)) {
    out[ap] = { byBlock: Object.fromEntries(Object.entries(d.byBlock).map(([k, v]) => [k, { approved: v.approved, obligated: v.obligated }])),
      ccarsNew: d.ccarsNew.map(c => c.key), ccarsGone: d.ccarsGone.map(c => c.key), pmoMoves: d.pmoMoves.map(m => [m.key, m.from, m.to]) };
  }
  return out;
}
const DIFF_ENTRY = ['key', 'name', 'size', 'approved', 'authorized', 'byFy'];
function diffBaeShape(D) {
  return { byBlock: Object.fromEntries(Object.entries(D.byBlock).map(([k, v]) => [k, { approved: v.approved, authorized: v.authorized }])),
    unread: D.unread,
    budgetsNew: D.budgetsNew.map(e => pick(e, DIFF_ENTRY)), budgetsGone: D.budgetsGone.map(e => pick(e, DIFF_ENTRY)),
    budgetsChanged: D.budgetsChanged.map(e => pick(e, DIFF_ENTRY)),
    // review I4-3: a budget with a row that could not be read is listed apart, with its unread row counts
    budgetsUnread: (D.budgetsUnread || []).map(e => pick(e, DIFF_ENTRY.concat(['unread']))) };
}

// EVERY FIELD the oracle writes for a scenario with a report, one at a time so a failure names what disagrees. Of model.bae,
// headerRow, skipped and conversions are facts of the import, not the model (§14.1: parseFiles' report holds them), so they
// are held to the import's report; unreadable rows' reasons are the import's words, so their fields are compared (which of
// the four could not be read) beside the rows and names. crossChecks and input are the oracle's own (its header says so).
const BAE_KEYS = ['present', 'file', 'sheet', 'stamp', 'rows', 'cents', 'total', 'totalRow', 'byBlock', 'uncovered', 'noBlock', 'planShort',
  'pullOnly', 'reportOnly', 'offReport', 'counted', 'budgets', 'pullBudgetPmo'];
function compare(sc, M, X, part) {
  same(sc + ': asOf, E, firstFY, asOfIndex, window', pick(M, ['asOf', 'E', 'firstFY', 'asOfIndex', 'window']),
    pick(X, ['asOf', 'E', 'firstFY', 'asOfIndex', 'window']));
  same(sc + ': shown (services, lanes, all)', { services: M.shown.services, lanes: M.shown.lanes, all: M.shown.all }, X.shown);
  same(sc + ': special CCaRs, normalised', M.special, X.special);
  same(sc + ': showNoDate', M.showNoDate, X.showNoDate);
  same(sc + ': the blocks are the pull’s, in appropriation then FY order', M.blocks.map(b => b.key), Object.keys(X.blocks));
  for (const b of M.blocks) {
    const x = X.blocks[b.key];
    if (!x) continue;
    const g = blockShape(b);
    for (const f of Object.keys(x)) same(sc + ' ' + b.key + ': ' + f, g[f], x[f]);
  }
  same(sc + ': aps (the §14.3 totals and their marks)', Object.fromEntries(M.aps.map(a => [a.ap, pick(a.total, Object.keys(X.aps[a.ap] || {}))])), X.aps);
  same(sc + ': summary totals and marks', pick(M.summary.total, Object.keys(X.summary)), X.summary);
  const tabs = pmoTabs(M);
  same(sc + ': PMO tabs: which PMOs, and which blocks each has a row in', Object.fromEntries(Object.entries(tabs).map(([l, v]) => [l, Object.keys(v).sort()])),
    Object.fromEntries(Object.entries(X.pmoTabs).map(([l, v]) => [l, Object.keys(v).sort()])));
  for (const [l, v] of Object.entries(X.pmoTabs)) for (const [k, w] of Object.entries(v)) {
    if (tabs[l] && tabs[l][k]) same(sc + ' PMO ' + l + ' ' + k + ' (§14.4)', tabs[l][k], w);
  }
  same(sc + ': PMO codes', Object.fromEntries(M.pmos.map(p => [p.label, p.code])), X.pmoCodes);
  const e = M.excluded;
  // (§15.2: the oracle states the FY2025 OBBBA rows set aside only on a scenario that loads one, bae-obbba here)
  same(sc + ': excluded', Object.assign({ beforeFirst: e.beforeFirst.cents, beforeFirstRows: e.beforeFirst.rows, beforeFirstByFy: e.beforeFirst.byFy,
    unidentified: e.unidentified.cents, unidentifiedRows: e.unidentified.rows, unreadableRows: e.unreadable.rows }, 'obbba' in X.excluded ? { obbba: e.obbba } : {}), X.excluded);
  same(sc + ': execAfterAsOf', M.execAfterAsOf, X.execAfterAsOf);
  same(sc + ': rowsByAp', M.rowsByAp, X.rowsByAp);
  C.chk(sc + ': the oracle read a report', !!X.bae && X.bae.present === true);
  C.chk(sc + ': the model carries one', !!M.bae && M.bae.present === true);
  if (!X.bae || !M.bae) return;
  for (const k of BAE_KEYS) same(sc + ': model.bae.' + k, M.bae[k], X.bae[k]);
  // §16.3 how the PMO tabs share the report: the budgets split among PMOs (each PMO by its label, as the oracle names it) and
  // the money no plan event takes, per covered block; and §16.2 the BAE Report sheet's PMO column, row by row
  same(sc + ': model.bae.split (§16.3)', M.bae.split.map(e => Object.assign({}, e, { pmos: e.pmos.map(p => ({ pmo: p.label, plan: p.plan, approved: p.approved,
    authorized: p.authorized })) })), X.bae.split);
  same(sc + ': model.bae.unassigned (§16.3)', M.bae.unassigned, X.bae.unassigned);
  // §17.2 how each report row of scope 'obbba' is marked ('name' | 'flex02'), and no other row carries obbbaBy; the oracle
  // writes the list only where a row the rule names is loaded (absent reads as none)
  same(sc + ': model.bae.derived[].obbbaBy, row by row (§17.2)', M.bae.derived.filter(d => 'obbbaBy' in d).map(d => [d.rowNo, d.obbbaBy]), X.bae.obbbaBy || []);
  C.chk(sc + ': only a row of scope obbba carries obbbaBy', M.bae.derived.every(d => ('obbbaBy' in d) === (d.scope === 'obbba')));
  // §17.2 the OBBBA money that counts outside O&M (the oracle's READING: absent reads as [])
  same(sc + ': obbbaElsewhere (§17.2)', M.obbbaElsewhere === undefined ? [] : M.obbbaElsewhere, X.obbbaElsewhere || []);
  if ('obbbaElsewhere' in X) C.chk(sc + ': the model carries obbbaElsewhere where the oracle writes it', Array.isArray(M.obbbaElsewhere), String(M.obbbaElsewhere));
  same(sc + ': the BAE Report sheet’s PMO column, row by row (§16.2)', M.bae.derived.map(d => [d.rowNo, d.goes]), X.bae.pmoColumn);
  same(sc + ': model.bae.unreadable: each row, its name and what could not be read',
    M.bae.unreadable.map(u => ({ rowNo: u.rowNo, name: u.name, bad: u.fields })), X.bae.unreadable);
  C.chk(sc + ': model.bae.unreadable carries the import’s own words for each', M.bae.unreadable.every(u => u.bad.length > 0), J(M.bae.unreadable));
  // the import's facts, from parseFiles' report of the import that brought this report
  same(sc + ': the import’s header row', part.headerRow, X.bae.headerRow);
  same(sc + ': rows skipped, blank in all four columns', part.blank + part.extraOnly.length, X.bae.skipped);
  same(sc + ': text zeros read as $0 (conversions)', part.conversions.zero, X.bae.conversions.approved + X.bae.conversions.authorized);
}

// §16.1 restated: shares of `amount` by `weights` (each a plan above zero) are largest remainder when each is the floor of
// |amount| x w / W or one cent more, they add up to the amount exactly, and every share given the extra cent has a remainder
// at least as large as every share not given one (which of two equal remainders takes it is the hand-built checks' to say:
// the order here is largest share first, not the model's). A negative amount is split as its absolute value, negated.
function lrOk(amount, weights, shares) {
  const W = weights.reduce((a, x) => a + BigInt(x), 0n), A = BigInt(Math.abs(amount)), neg = amount < 0;
  if (W <= 0n || weights.some(x => x <= 0) || shares.length !== weights.length) return false;
  const got = shares.map(x => BigInt(neg ? -x : x));
  if (got.reduce((a, x) => a + x, 0n) !== A) return false;
  const fl = weights.map(x => A * BigInt(x) / W), rem = weights.map(x => A * BigInt(x) % W);
  const up = got.map((g, i) => g - fl[i]);
  if (up.some(u => u !== 0n && u !== 1n)) return false;
  for (let i = 0; i < up.length; i++) for (let j = 0; j < up.length; j++) {
    if (up[i] === 1n && up[j] === 0n && rem[i] < rem[j]) return false;
  }
  return true;
}

// ----------------------------------------------------------------------------------------------- the invariants
// M: the model with the report; M0: the model of the same pulls, settings and switches with none
function invariants(sc, M, M0) {
  const bad = [];
  same(sc + ': a report never adds or removes a block', M.blocks.map(b => b.key), M0.blocks.map(b => b.key));
  for (const b of M.blocks) {
    const b0 = M0.blocks.find(x => x.key === b.key), w = sc + ' ' + b.key;
    if (!b0) continue;
    // rule 6: the slide, the columns, the tree, the totals band and Not Allocated are the plan's, exactly
    if (b.planned !== b0.approved) bad.push(w + ': planned is not the no-report Approved');
    if (J(b.slide) !== J({ basis: b0.approved, oblPct: b0.oblPct, goal: b0.goal, delta: b0.delta, status: b0.status })) bad.push(w + ': slide is not the no-report headline');
    for (const f of ['cols', 'cum', 'obl', 'goalC', 'statusC', 'tree', 'pmoRows', 'na', 'unprog', 'obligated', 'execAfterAsOf', 'goal', 'n', 'curve'])
      if (J(b[f]) !== J(b0[f])) bad.push(w + ': ' + f + ' moved with the report');
    if (SP.slideOf(b) !== b.slide || J(SP.slideOf(b0)) !== J(b.slide)) bad.push(w + ': SP.slideOf does not give the plan on both models');
    if (SP.plannedOf(b) !== b0.approved || SP.plannedOf(b0) !== b0.approved) bad.push(w + ': SP.plannedOf does not give the plan on both models');
    // rule 3: measured against Approved
    if (b.obligated + b.unobligated !== b.approved) bad.push(w + ': obligated + unobligated is not Approved');
    if ((b.approved === 0 ? null : b.obligated / b.approved) !== b.oblPct) bad.push(w + ': Obl % is not Obligated / Approved');
    if (b.covered !== (b.approvedSrc === 'report') || (!b.covered && b.approved !== b.planned)) bad.push(w + ': approvedSrc and covered disagree');
    // the PMO rows of this block
    const rows = M.pmos.flatMap(p => p.rows.filter(r => r.key === b.key));
    // §16.1 the PMOs with a row are exactly those the block's tree shows (its rows by their PMO column)
    const tabPmos = M.pmos.filter(p => p.rows.some(r => r.key === b.key)).map(p => p.key).sort(), treePmos = b.tree.map(n => n.key).sort();
    if (J(tabPmos) !== J(treePmos)) bad.push(w + ': the PMOs with a row ' + J(tabPmos) + ' are not the tree’s ' + J(treePmos));
    if (sum(rows.map(r => r.obligated)) !== b.obligated) bad.push(w + ': the PMO rows’ Obligated do not add to the block’s');
    if (b.covered) {
      // §16.1: every report dollar of a covered block is on exactly one PMO row or unassigned, never two
      const un = M.bae.unassigned.find(u => u.ap + '|' + u.fy === b.key) || { approved: 0, authorized: 0, budgets: [] };
      if (un.approved !== sum(un.budgets.map(t => t.approved)) || un.authorized !== sum(un.budgets.map(t => t.authorized))) bad.push(w + ': the unassigned money does not add its budgets');
      if (sum(rows.map(r => r.approved)) + un.approved !== b.approved) bad.push(w + ': the PMO rows’ Approved and the unassigned do not add to the block’s');
      if (sum(rows.map(r => r.authorized)) + un.authorized !== b.reportAuthorized) bad.push(w + ': the PMO rows’ Authorized and the unassigned do not add to the report’s');
      if (b.authorizedSrc !== 'entered' && b.authorized !== b.reportAuthorized) bad.push(w + ': a block not entered does not show the report’s Authorized');
      if (!rows.every(r => r.basis === 'planEvent' && !r.sect && r.authorizedSrc === 'report')) bad.push(w + ': a covered block’s PMO rows are not on the plan events');
    } else {
      if (sum(rows.map(r => r.approved)) !== b.approved) bad.push(w + ': the PMO rows’ Approved do not add to the block’s');
      if (!rows.every(r => r.basis === 'row' && r.sect && r.authorized === r.approved && r.approved === r.planned && r.authorizedSrc === 'approved'))
        bad.push(w + ': an uncovered block’s PMO rows are not §4.6’s');
      if (b.reportAuthorized !== null) bad.push(w + ': an uncovered block reports an Authorized from the report');
    }
    // §14.5 the marks each product prints, restated: † where Authorized is Approved standing in, ‡ on a typed figure while
    // a switch is off, nothing on the report's figure (it follows the switches exactly); § where Approved is the plan
    // because the report has no figure. A PMO row is never ‡ (a typed Authorized is never split to PMOs).
    const want = b.authorizedSrc === 'approved' ? '†' : b.authorizedSrc === 'entered' ? '‡' : '';
    if (SP.authMark(b, M) !== want || b.marks.dagger !== (want === '†') || b.marks.ddagger !== (want === '‡')) bad.push(w + ': its Authorized mark is not ' + J(want));
    if (SP.approvedMark(b, M) !== (b.covered ? '' : '§') || b.marks.sect !== !b.covered) bad.push(w + ': its Approved mark is not ' + (b.covered ? 'none' : '§'));
    for (const r of rows) {
      if (SP.authMark(r, M) !== (b.covered ? '' : '†') || SP.approvedMark(r, M) !== (b.covered ? '' : '§')) { bad.push(w + ': a PMO row’s marks are not ' + (b.covered ? 'none' : '† and §')); break; }
    }
    // the counted report rows of a covered block are its Approved and Authorized (model.bae.derived, file order)
    const der = M.bae.derived.filter(d => d.counts && d.ap + '|' + d.fy === b.key);
    if (b.covered && (sum(der.map(d => d.approved)) !== b.approved || sum(der.map(d => d.authorized)) !== b.reportAuthorized)) bad.push(w + ': the counted report rows do not add to the block');
  }
  // §16.1 the split is exact per budget: each covered block's counting report rows by budget, shared among the PMOs by the
  // model's own split list (several PMOs), wholly to the one PMO the BAE Report sheet's PMO column names (one), or on no
  // PMO (unassigned); every PMO row's Approved and Authorized is then the sum of its shares, to the cent
  for (const b of M.blocks.filter(x => x.covered)) {
    const w = sc + ' ' + b.key, A = new Map();
    for (const d of M.bae.derived.filter(d => d.counts && d.ap + '|' + d.fy === b.key)) {
      const t = A.get(d.key) || { approved: 0, authorized: 0, goes: d.goes };
      t.approved += d.approved; t.authorized += d.authorized; A.set(d.key, t);
    }
    const want = new Map(), un = M.bae.unassigned.find(u => u.ap + '|' + u.fy === b.key);
    const give = (label, a, u) => { const t = want.get(label) || [0, 0]; t[0] += a; t[1] += u; want.set(label, t); };
    for (const [k, t] of A) {
      const sp = M.bae.split.find(e => e.ap + '|' + e.fy === b.key && e.key === k);
      const ua = un && un.budgets.find(x => x.key === k);
      if ([sp, ua].filter(Boolean).length > 1) bad.push(w + ' ' + k + ': split and unassigned at once');
      if (sp) {
        if (sp.approved !== t.approved || sp.authorized !== t.authorized) bad.push(w + ' ' + k + ': the split’s figures are not the report’s');
        if (sum(sp.pmos.map(p => p.approved)) !== t.approved || sum(sp.pmos.map(p => p.authorized)) !== t.authorized) bad.push(w + ' ' + k + ': the shares do not add up to the budget exactly');
        for (const f of ['approved', 'authorized']) if (!lrOk(t[f], sp.pmos.map(p => p.plan), sp.pmos.map(p => p[f]))) bad.push(w + ' ' + k + ': the ' + f + ' shares are not largest remainder');
        for (const p of sp.pmos) give(p.label, p.approved, p.authorized);
      } else if (ua) {
        if (ua.approved !== t.approved || ua.authorized !== t.authorized) bad.push(w + ' ' + k + ': the unassigned budget’s figures are not the report’s');
        if (t.goes !== 'No plan event uses it') bad.push(w + ' ' + k + ': an unassigned budget’s PMO column reads ' + J(t.goes));
      } else {
        const one = /^(.*) 100\.0%$/.exec(t.goes || '');
        if (!one) { bad.push(w + ' ' + k + ': a budget neither split nor unassigned has PMO column ' + J(t.goes)); continue; }
        give(one[1], t.approved, t.authorized);
      }
    }
    for (const p of M.pmos) {
      const r = p.rows.find(x => x.key === b.key);
      if (!r) continue;
      const g = want.get(p.label) || [0, 0];
      if (r.approved !== g[0] || r.authorized !== g[1]) bad.push(w + ' PMO ' + p.label + ': Approved/Authorized ' + J([r.approved, r.authorized]) + ', its shares ' + J(g));
      want.delete(p.label);
    }
    if (want.size) bad.push(w + ': shares given to a PMO with no row: ' + J([...want.keys()]));
  }
  // each PMO block: its detail is the no-report one, and every PMO with a row has rows by its PMO column (§16.1)
  for (const p of M.pmos) {
    const p0 = M0.pmos.find(x => x.pmo === p.pmo);
    p.blocks.forEach((pb, i) => {
      const w = sc + ' PMO ' + p.label + ' ' + pb.key, r = p.rows[i];
      for (const f of ['approved', 'authorized', 'obligated', 'unobligated', 'oblPct', 'delta', 'status', 'planned', 'basis', 'sect'])
        if (J(r[f]) !== J(pb[f])) bad.push(w + ': the row and the PMO block disagree on ' + f);
      const pb0 = p0 && p0.blocks.find(x => x.key === pb.key);
      if (pb0) {
        for (const f of ['cols', 'cum', 'obl', 'goalC', 'statusC', 'tree', 'na', 'unprog', 'execAfterAsOf'])
          if (J(pb[f]) !== J(pb0[f])) bad.push(w + ': ' + f + ' is not the no-report PMO block’s');
        if (pb.planned !== pb0.approved) bad.push(w + ': planned is not the no-report PMO block’s Approved');
      } else bad.push(w + ': a PMO row with no rows of its own (§16.1: a budget’s name gives no PMO a row)');
    });
    if (p.total.approved !== sum(p.rows.map(r => r.approved)) || p.total.authorized !== sum(p.rows.map(r => r.authorized))
      || p.total.planned !== sum(p.rows.map(r => r.planned))) bad.push(sc + ' PMO ' + p.label + ': its total does not add its rows');
  }
  // the totals add their blocks, and carry each mark a block carries
  const tot = (list, t, w) => {
    for (const f of ['approved', 'planned', 'authorized', 'obligated', 'unobligated']) if (t[f] !== sum(list.map(b => b[f]))) bad.push(w + ': ' + f + ' is not the sum');
    for (const k of ['sect', 'dagger', 'ddagger']) if (t.marks[k] !== list.some(b => b.marks[k])) bad.push(w + ': the ' + k + ' mark is not its blocks’');
  };
  for (const a of M.aps) tot(a.blocks, a.total, sc + ' ' + a.ap + ' total');
  tot(M.blocks, M.summary.total, sc + ' summary total');
  const am = SP.authMarks(M.summary.rows, M);
  if (am.sect !== M.summary.total.marks.sect || am.dag !== M.summary.total.marks.dagger) bad.push(sc + ': SP.authMarks and the total’s marks disagree');
  C.chk(sc + ': every §14 identity holds on every block, PMO row and total', bad.length === 0, bad.slice(0, 8).join('; '));
}

// ---------------------------------------------------------------------------------------------- the fixture
function py(args) { return spawnSync('python3', ['-I', ...args], { encoding: 'utf8', maxBuffer: 1 << 28 }); }
const ab = p => { const b = readFileSync(p); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };
async function importFiles(names, now) {
  return SP.parseFiles(names.map(n => ({ name: n.split('/').pop(), data: ab(join(tmp.dir, n)) })), { now: now || NOW });
}
// CONTRACT §11 and §14.7: each appropriation in an import replaces its pull; a report replaces the report whole, and the
// one it replaces becomes previous; the store adds the import's time
function apply(store, parsed, now) {
  for (const ap of Object.keys(parsed.pulls)) {
    if (store.current[ap]) store.previous[ap] = store.current[ap];
    store.current[ap] = parsed.pulls[ap];
  }
  if (parsed.bae) {
    if (store.bae.current) store.bae.previous = store.bae.current;
    store.bae.current = Object.assign({}, parsed.bae, { importedAt: now || NOW });
  }
}
function oracle(args, name) {
  const out = join(tmp.dir, 'exp-' + name + '.json');
  const r = py([ORACLE, ...args, '--out', out]);
  if (r.status !== 0) throw new Error('the oracle failed on ' + name + ': ' + r.stderr.slice(-800));
  return JSON.parse(readFileSync(out, 'utf8'));
}
function settingsFor(asOf, firstFY, authorized) {
  const s = SP.defaultSettings('2026-11-09');
  s.asOf = asOf; s.firstFY = firstFY;
  if (authorized) s.authorized = Object.assign({}, authorized);
  return s;
}
function viewFor(svcOff = [], lanes = ['disc', 'mand']) {
  const v = SP.defaultView();
  for (const s of svcOff) v.svc[s] = false;
  for (const l of ['disc', 'mand']) if (!lanes.includes(l)) v.lane[l] = false;
  return v;
}
const ENT = { 'om|2026': 39876543210, 'sp|2025': 8000000000 };

try {
  C.eq('the engine boots with no script errors', t.errors, []);
  const mk = py([MAKE, '--out', tmp.dir]);
  if (mk.status !== 0) throw new Error('make_fixture failed: ' + mk.stderr);
  const man = JSON.parse(readFileSync(join(tmp.dir, 'manifest.json'), 'utf8'));

  const g1 = await importFiles(['pull-all.xlsx', 'bae.xlsx']);
  C.chk('the first import brings a report beside the pull', !!g1.bae && Array.isArray(g1.bae.rows) && !!g1.report.bae);
  const st1 = { current: {}, previous: {}, bae: { current: null, previous: null } };
  apply(st1, g1);
  const g2 = await importFiles(['gen2/pull-om.xlsx', 'gen2/pull-ff.csv', 'gen2/bae.xlsx'], NOW2);
  const st2 = { current: {}, previous: {}, bae: { current: null, previous: null } };
  apply(st2, await importFiles(['pull-all.xlsx', 'bae.xlsx']));
  apply(st2, g2, NOW2);
  C.chk('gen2: the later report is current and the first previous', st2.bae.current.importedAt === NOW2 && st2.bae.previous.importedAt === NOW);
  // §15.5 bae-obbba: the obbba pulls with their report, so §16's split and its identities are held on its covered blocks too
  const gO = await importFiles(['obbba/pull-om.xlsx', 'obbba/pull-ff.csv', 'obbba/bae.xlsx']);
  const stO = { current: {}, previous: {}, bae: { current: null, previous: null } };
  apply(stO, gO);
  // §17.4 bae-obbba2: the obbba2 pulls with their report, whose Budget Flex 02 marks O&M FY2025 budgets (the pulls' rows on
  // them are left out with the report), and Initial Spares, Full Fund and OPN FY2025 budgets (which count)
  const gO2 = await importFiles(['obbba2/pull-om.xlsx', 'obbba2/pull-ff.csv', 'obbba2/pull-sp.xlsx', 'obbba2/bae.xlsx']);
  const stO2 = { current: {}, previous: {}, bae: { current: null, previous: null } };
  apply(stO2, gO2);
  // §17.1: the report marks O&M FY2025 pull rows of the budgets it marks, so the plan the report leaves is not the pulls with
  // no report: the invariants' no-report model (M0) is built from the pulls with those rows' Budget named OBBBA, which the
  // rule leaves out by name alone. Which budgets the report marks is the generator's own record (manifest.json's marks),
  // never the tool's SP.baeObbbaKeys.
  const MARKS2 = new Set(man.obbba2.marks.map(normKey));
  const BUD_I = SP.RAW_HEADERS.map(normKey).indexOf('budget'), FY_I = SP.RAW_HEADERS.map(normKey).indexOf('fy');
  const asLeft = (pulls, marks) => {
    if (!marks || !marks.size) return pulls;
    const out = Object.assign({}, pulls);
    if (pulls.om) out.om = Object.assign({}, pulls.om, { rows: pulls.om.rows.map(r => r.c[FY_I] === 2025 && marks.has(normKey(r.c[BUD_I]))
      ? Object.assign({}, r, { c: r.c.map((v, i) => i === BUD_I ? v + ' OBBBA' : v) }) : r) });
    return out;
  };

  // ============================================================================================ the scenarios (§14.8)
  const SCEN = [
    { name: 'bae-all', st: st1, part: g1.report.bae, asOf: '2026-10', first: 2025 },
    { name: 'bae-usaf-off', st: st1, part: g1.report.bae, asOf: '2026-10', first: 2025, svcOff: ['USAF'] },
    { name: 'bae-mand-only', st: st1, part: g1.report.bae, asOf: '2026-10', first: 2025, lanes: ['mand'] },
    { name: 'bae-entered', st: st1, part: g1.report.bae, asOf: '2026-10', first: 2025, auth: ENT },
    { name: 'bae-entered-off', st: st1, part: g1.report.bae, asOf: '2026-10', first: 2025, auth: ENT, svcOff: ['USN (USN CV)'] },
    { name: 'bae-asof-2027-10', st: st1, part: g1.report.bae, asOf: '2027-10', first: 2025 },
    { name: 'bae-gen2', st: st2, part: g2.report.bae, asOf: '2026-10', first: 2025 },
    { name: 'bae-obbba', st: stO, part: gO.report.bae, asOf: '2026-10', first: 2025 },
    // §17.4 FY2025 O&M OBBBA funding marked in its name or in Budget Flex 02, a later First FY, and a service off
    { name: 'bae-obbba2', st: stO2, part: gO2.report.bae, asOf: '2026-10', first: 2025, marks: MARKS2 },
    { name: 'bae-obbba2-first-2026', st: stO2, part: gO2.report.bae, asOf: '2026-10', first: 2026, marks: MARKS2 },
    { name: 'bae-obbba2-usaf-off', st: stO2, part: gO2.report.bae, asOf: '2026-10', first: 2025, svcOff: ['USAF'], marks: MARKS2 },
  ];
  const models = {}, plain = {};
  for (const sc of SCEN) {
    const X = oracle(['--scenario', sc.name, '--fixture', tmp.dir], sc.name);
    const s = settingsFor(sc.asOf, sc.first, sc.auth), v = viewFor(sc.svcOff, sc.lanes);
    const M = SP.buildModel(sc.st.current, s, v, sc.st.bae.current);
    const M0 = SP.buildModel(asLeft(sc.st.current, sc.marks), s, v);
    models[sc.name] = M; plain[sc.name] = M0;
    C.chk(sc.name + ': the oracle and the scenario agree on what was asked', X.asOf === sc.asOf && X.firstFY === sc.first
      && J(X.input.authorized || {}) === J(sc.auth || {}) && J(X.input.svcOff) === J([...(sc.svcOff || [])].sort()));
    compare(sc.name, M, X, sc.part);
    invariants(sc.name, M, M0);
    if (sc.name === 'bae-gen2') {
      same('bae-gen2: diffPulls is untouched by the report', diffShape(SP.diffPulls(sc.st.previous, sc.st.current, s)), X.diff);
      same('bae-gen2: SP.diffBae, per (ap, fy) and the budgets new, gone and changed, largest change first',
        diffBaeShape(SP.diffBae(sc.st.bae.previous, sc.st.bae.current, s)), X.diffBae);
    }
  }

  {
    const Mo = models['bae-obbba'];
    C.chk('bae-obbba: its covered blocks hold a budget split among PMOs and money no plan event uses, so §16’s identities are held there too',
      Mo.blocks.some(b => b.covered) && Mo.bae.split.length > 0 && Mo.bae.unassigned.length > 0, J([Mo.bae.split.length, Mo.bae.unassigned.length]));
  }
  // §17.4 the obbba2 report makes §17 matter, so the comparisons above could fail: it leaves out O&M FY2025 rows marked only in
  // Budget Flex 02 (with their pull rows, by:'report') and rows named OBBBA, while Initial Spares, Full Fund and OPN FY2025
  // money marked either way counts. The report changes the plan on O&M FY2025 alone, by exactly the readable pull rows of
  // the budgets it marks (summed here from the tool's pull rows, picked by the generator's marks).
  {
    const M = models['bae-obbba2'], o = M.excluded.obbba, Mn = SP.buildModel(stO2.current, settingsFor('2026-10', 2025), viewFor());
    C.chk('bae-obbba2: excluded.obbba is O&M FY2025 alone, with budgets marked by their name and by the report',
      o.blocks.map(b => b.ap + '|' + b.fy).join() === 'om|2025' && o.budgets.some(t => t.by === 'name') && o.budgets.some(t => t.by === 'report'), J(o));
    same('bae-obbba2: each budget left out by:\'report\' is one the generator says the report marks, and only those',
      o.budgets.filter(t => t.by === 'report').map(t => t.key).sort(), o.budgets.filter(t => MARKS2.has(t.key) && !/\bOBBBA\b/i.test(t.name)).map(t => t.key).sort());
    C.chk('bae-obbba2: report rows of scope obbba marked by name and by Budget Flex 02 alone',
      M.bae.derived.some(d => d.obbbaBy === 'name') && M.bae.derived.some(d => d.obbbaBy === 'flex02'), J(M.bae.derived.filter(d => d.obbbaBy).map(d => [d.rowNo, d.obbbaBy])));
    C.chk('bae-obbba2: OBBBA money outside O&M is listed for Initial Spares, Full Fund and OPN FY2025, with report rows by Budget Flex 02',
      ['sp', 'ff', 'opn'].every(a => (M.obbbaElsewhere || []).some(e => e.ap === a && e.fy === 2025)) && (M.obbbaElsewhere || []).some(e => e.report.byFlex02 > 0), J(M.obbbaElsewhere));
    const omRows = stO2.current.om.rows.filter(r => !(r.bad && r.bad.length) && r.c[FY_I] === 2025 && MARKS2.has(normKey(r.c[BUD_I])) && !/\bOBBBA\b/i.test(String(r.c[BUD_I])));
    const marked = sum(omRows.map(r => SP.deriveRow(r, settingsFor('2026-10', 2025)).cents));
    const bad = [];
    for (const b of Mn.blocks) {
      const w = M.blocks.find(x => x.key === b.key);
      const want = b.key === 'om|2025' ? b.approved - marked : b.approved;
      if (!w || w.planned !== want) bad.push(b.key + ' planned ' + (w && w.planned) + ', want ' + want);
    }
    C.chk('bae-obbba2: the report moves the plan on O&M FY2025 alone, by exactly the pull rows of the budgets its Budget Flex 02 marks', !bad.length && marked > 0 && omRows.length > 0, bad.join('; ') + ' marked ' + marked);
    C.chk('bae-obbba2: and O&M FY2025 keeps its block (ordinary rows remain)', M.blocks.some(b => b.key === 'om|2025'));
  }

  // ============================================================================================ the switches move the
  // report's figures exactly as they move the plan's: per block, what a view hides from Approved is the counting report
  // rows of the services and lanes it hides, and from planned the pull rows it hides. Both are summed here from the
  // generator's own record of what it wrote (manifest.json), with the service and lane IT stated for each row.
  {
    const R1 = man.bae.gen1.filter(r => r.kind === 'data' && !r.bad.length && r.scope === 'in' && r.fy >= 2025);
    const P1 = man.gen1.filter(r => r.ap && !r.bad.length && Number.isInteger(r.fy) && r.fy >= 2025);
    for (const [name, base, svcOff, lanes] of [['bae-usaf-off', 'bae-all', ['USAF'], ['disc', 'mand']], ['bae-mand-only', 'bae-all', [], ['mand']],
      ['bae-entered-off', 'bae-entered', ['USN (USN CV)'], ['disc', 'mand']]]) {
      const hid = r => svcOff.includes(r.svc) || !lanes.includes(r.lane);
      const A = models[base], Bm = models[name];
      const bad = [];
      for (const b of A.blocks) {
        const v = Bm.blocks.find(x => x.key === b.key);
        const inB = r => r.ap + '|' + r.fy === b.key && hid(r);
        const rep = R1.filter(inB), pull = P1.filter(inB);
        if (b.covered && b.approved - v.approved !== sum(rep.map(r => r.approved))) bad.push(b.key + ' Approved moved by ' + (b.approved - v.approved) + ', its hidden report rows hold ' + sum(rep.map(r => r.approved)));
        if (b.covered && b.authorizedSrc === 'report' && b.authorized - v.authorized !== sum(rep.map(r => r.authorized))) bad.push(b.key + ' Authorized moved by ' + (b.authorized - v.authorized));
        if (b.planned - v.planned !== sum(pull.map(r => r.cents))) bad.push(b.key + ' planned moved by ' + (b.planned - v.planned) + ', its hidden pull rows hold ' + sum(pull.map(r => r.cents)));
        if (b.authorizedSrc === 'entered' && v.authorized !== b.authorized) bad.push(b.key + ' a typed Authorized moved with a switch');
      }
      C.chk(name + ' against ' + base + ': the switches move the report’s figures by exactly the report rows they hide, and the plan by the pull rows', bad.length === 0, bad.slice(0, 6).join('; '));
      C.chk(name + ': and they do move something (the check can fail)', A.blocks.some(b => b.covered && b.approved !== Bm.blocks.find(x => x.key === b.key).approved));
    }
    // a typed Authorized while a switch is off is the only figure marked ‡ (§14.5: a report's figure is never marked)
    const Mo = models['bae-entered-off'];
    same('bae-entered-off: ‡ only on the typed figures', Mo.blocks.filter(b => SP.authMark(b, Mo) === '‡').map(b => b.key).sort(), Object.keys(ENT).sort());
    same('bae-entered-off: no PMO row is ever marked ‡', Mo.pmos.flatMap(p => p.rows.filter(r => SP.authMark(r, Mo) === '‡')).length, 0);
  }

  // ============================================================================================ what the fixture holds
  {
    const M = models['bae-all'], M0 = plain['bae-all'];
    C.chk('bae-all: some blocks covered, some not, some short of half', M.blocks.some(b => b.covered) && M.blocks.some(b => !b.covered) && M.blocks.some(b => b.planShort));
    // §16.1 (rule 7 replaced): a PMO row's Obligated is its own plan events' executed rows, by the PMO column, as the tree
    // counts them. The fixture holds executed rows whose budget's name ends in another PMO's code (manifest), so a row
    // still counted rule 7's way would differ here
    const mis = man.gen1.filter(r => r.ap && !r.bad.length && r.fy >= 2025 && r.status === 'exec' && man.bae.budgetPmo[r.budget] && man.bae.budgetPmo[r.budget] !== (r.pmo || '(no PMO)'));
    C.chk('§16: the fixture holds executed rows whose budget names another PMO (manifest), so rule 7 would move them', mis.length > 0);
    const bad = [];
    for (const b of M.blocks.filter(x => x.covered)) {
      const want = {};
      for (const r of man.gen1.filter(r => r.ap + '|' + r.fy === b.key && !r.bad.length && r.status === 'exec')) want[r.pmo || '(no PMO)'] = (want[r.pmo || '(no PMO)'] || 0) + r.cents;
      for (const p of M.pmos) {
        const r = p.rows.find(x => x.key === b.key);
        if (r && r.obligated !== (want[p.label] || 0)) bad.push(b.key + ' ' + p.label + ' Obligated ' + r.obligated + ', its plan events’ say ' + (want[p.label] || 0));
      }
    }
    C.chk('§16: every covered block’s PMO Obligated is its own plan events’ executed rows (manifest), row by row', bad.length === 0, bad.slice(0, 5).join('; '));
    // §16.4 the fixture reaches every case: a budget split between two PMOs and one among three or more, with a cent left
    // to place by largest remainder; a budget no plan event uses; one whose plan is not above zero; a plan event on two
    // budgets; and a PMO whose plan events use only budgets the report lacks (its row reads Approved $0)
    const sp = M.bae.split, ub = M.bae.unassigned.flatMap(u => u.budgets);
    const placed = e => ['approved', 'authorized'].some(f => { const W = sum(e.pmos.map(p => p.plan)); return e.pmos.some(p => BigInt(p[f]) * BigInt(W) !== BigInt(e[f]) * BigInt(p.plan)); });
    C.chk('§16.4: a budget split between exactly two PMOs, unequal plans', sp.some(e => e.pmos.length === 2 && e.pmos[0].plan !== e.pmos[1].plan));
    C.chk('§16.4: a budget split among three PMOs or more', sp.some(e => e.pmos.length >= 3));
    C.chk('§16.4: a split with a remainder to place (no share is exact)', sp.some(placed));
    C.chk('§16.4: a budget no plan event uses', ub.some(t => t.why === 'nopull' && t.approved !== 0));
    C.chk('§16.4: a budget whose plan is not above zero for any PMO', ub.some(t => t.why === 'noplan'));
    const peBud = new Map();
    for (const r of man.gen1.filter(r => r.ap && !r.bad.length && r.fy >= 2025)) {
      const k = r.ap + '|' + r.fy + '|' + normKey(r.pmo) + '|' + normKey(r.pe);
      if (!peBud.has(k)) peBud.set(k, new Set());
      peBud.get(k).add(normKey(r.budget));
    }
    C.chk('§16.4: a plan event on two budgets or more (manifest)', [...peBud.values()].some(x => x.size > 1));
    const zero = M.pmos.flatMap(p => p.rows.filter(r => r.covered && r.approved === 0 && p.blocks.find(x => x.key === r.key).planned > 0).map(r => p.label + ' ' + r.key));
    C.chk('§16.4: a PMO whose plan events use only budgets the report lacks reads Approved $0 on a covered block', zero.length > 0, J(zero));
    // every pull row gets bpmo, by the same function as a report row's PMO
    const keys = Object.keys(man.bae.budgetPmo);
    same('SP.budgetPmo: every budget the generator wrote, to the PMO it stated', keys.map(n => { const k = SP.budgetPmo(n, M); return k ? M.pmos.find(p => p.pmo === k)?.label || k : '(no PMO)'; }),
      keys.map(n => man.bae.budgetPmo[n]));
    same('model.bae.pullBudgetPmo is SP.budgetPmo of each pull budget', Object.fromEntries(Object.entries(M.bae.pullBudgetPmo).filter(([k]) => keys.some(n => normKey(n) === k))),
      Object.fromEntries(keys.filter(n => normKey(n) in M.bae.pullBudgetPmo).map(n => [normKey(n), man.bae.budgetPmo[n]])));
    // the report's rows, derived as the generator says it meant them
    const names = man.bae.names, nb = [];
    for (const d of M.bae.derived) {
      const w = names[d.name];
      if (!w) continue;
      if (d.ap !== w.ap || d.scope !== w.scope || d.svc !== w.svc || d.lane !== w.lane || d.pmoLabel !== w.pmo) nb.push(d.name + ': ' + J([d.ap, d.scope, d.svc, d.lane, d.pmoLabel]) + ' vs ' + J(w));
    }
    C.chk('SP.baeDerive: every report row’s appropriation, scope, service, lane and PMO are the generator’s', nb.length === 0 && M.bae.derived.length > 50, nb.slice(0, 4).join('; '));
    // the model is plain data, repeatable, and a report the build cannot read is no report
    C.chk('the model with a report is plain data', J(JSON.parse(J(M))) === J(M));
    C.chk('buildModel with a report is repeatable', J(SP.buildModel(st1.current, settingsFor('2026-10', 2025), viewFor(), st1.bae.current)) === J(M));
    C.chk('the report the build is given is not changed by it', J(st1.bae.current) === J(Object.assign({}, g1.bae, { importedAt: NOW })));
    for (const [what, v] of [['null', null], ['undefined', undefined], ['a report with no rows list', { rows: 'x' }], ['a list', []], ['a number', 7]]) {
      C.chk('buildModel with ' + what + ' for a report is the no-report model', J(SP.buildModel(st1.current, settingsFor('2026-10', 2025), viewFor(), v)) === J(M0));
    }
    // the words the products print with a report loaded
    C.eq('line 2 with a report', SP.summaryLine2(M), 'Data through Oct-2026 | Approved, Authorized = BAE report of ' + (st1.bae.current.stamp || '2026-11-09')
      + ' (sustainment budgets)' + LINE2_TAIL);
    C.eq('line 2 with none (§8.1)', SP.summaryLine2(M0), 'Data through Oct-2026 | Approved = total planned ($M from the CCaR pull) | Authorized = entered, else Approved' + LINE2_TAIL);
    C.eq('the marks’ words with a report', ['†', '‡', '§'].map(m => SP.markText(m, M)), [NEW_DAGGER, NEW_DDAGGER, SECT]);
    C.eq('the marks’ words with none', ['†', '‡'].map(m => SP.markText(m, M0)), [OLD_DAGGER, SP.AUTH_MARK_TEXT['‡']]);
    const cov = M.blocks.find(b => b.covered && b.planned !== b.approved), unc = M.blocks.find(b => !b.covered);
    C.chk('oblLabel on a covered block: “CCaR plan”, and the plan’s figure', SP.oblLabel(cov, M).startsWith('Obligation %  (CCaR plan ' + SP.fmtMText(cov.planned) + 'M; actual through Oct'), SP.oblLabel(cov, M));
    C.chk('oblLabel on an uncovered block: “Approved”, the plan', SP.oblLabel(unc, M).startsWith('Obligation %  (Approved ' + SP.fmtMText(unc.planned) + 'M; '), SP.oblLabel(unc, M));
    C.chk('oblLabel with no report is §8’s, word for word', SP.oblLabel(M0.blocks[0], M0) === 'Obligation %  (Approved ' + SP.fmtMText(M0.blocks[0].approved) + 'M; actual through Oct, plan after)');
    same('§ marks the blocks the report does not cover, and their PMO rows', [M.blocks.filter(b => SP.approvedMark(b, M) === '§').map(b => b.key),
      [...new Set(M.pmos.flatMap(p => p.rows.filter(r => SP.approvedMark(r, M) === '§').map(r => r.key)))].sort()],
      [M.bae.uncovered.map(u => u.ap + '|' + u.fy), M.bae.uncovered.map(u => u.ap + '|' + u.fy).sort()]);
    C.chk('no § without a report', M0.blocks.every(b => SP.approvedMark(b, M0) === '') && SP.authMarks(M0.summary.rows, M0).sect === false);
    // the Summary's notes (§14.5)
    const N = M.summary.notes.join('\n');
    C.chk('notes: the report, its date, its rows and its total row checked', /^Approved and Authorized come from the BAE report of \S+.* \(bae\.xlsx\) wherever it has figures for a block: it holds 100 rows of sustainment budgets/m.test(N)
      && N.includes('Counted nowhere: 7 Flyaway (production) rows, 11 rows naming no appropriation and 1 row that could not be read.')
      && N.includes('Its total row agrees with the rows read.'), N);
    C.chk('notes: the blocks the report does not cover, marked §', N.includes('The BAE report has no figure for Full Fund FY2025 and Initial Spares FY2025: Approved there is the CCaR plan (marked §).'), N);
    for (const p of M.bae.planShort) {
      const pct = Math.round(100 * p.planned / p.approved);
      C.chk('notes: ' + AP_LABEL[p.ap] + ' FY' + p.fy + ' flagged short of half', N.includes(AP_LABEL[p.ap] + ' FY' + p.fy + ': the CCaR plan ($' + SP.fmtMText(p.planned) + 'M) is ' + pct
        + '% of the BAE report’s Approved ($' + SP.fmtMText(p.approved) + 'M); Obl % is measured against the report’s figure.'), N);
    }
    C.chk('notes: † says neither entered nor in the report, and names only the blocks it marks',
      N.includes('Authorized was neither entered nor in the BAE report for Full Fund FY2025, Initial Spares FY2025; Approved is shown in its place (marked †).') && !N.includes('Authorized was not entered'), N);
    const N0 = M0.summary.notes.join('\n');
    C.chk('notes with no report say nothing of one', !/BAE/.test(N0) && N0.includes('Authorized was not entered for any block'));
    const Na = models['bae-asof-2027-10'];
    C.chk('notes (E = 2028): the report’s money for a year with no block, named', Na.bae.noBlock.length > 0
      && Na.summary.notes.some(n => n.startsWith('The BAE report holds money for ') && Na.bae.noBlock.every(x => n.includes(AP_LABEL[x.ap] + ' FY' + x.fy + ' ($' + SP.fmtMText(x.approved) + 'M Approved, $' + SP.fmtMText(x.authorized) + 'M Authorized)'))),
      Na.summary.notes.join(' / '));
    C.chk('notes (filtered): the first note names the report’s whole totals as an exception', models['bae-usaf-off'].summary.notes[0].includes('the note below on the BAE report as a whole')
      && models['bae-usaf-off'].summary.notes.some(n => n.startsWith('Approved and Authorized come from the BAE report ') && n.endsWith('This counts every service and lane, whatever the switches show.')));
    // review M4-6: a covered block's plan and Obligated hold money on budgets its Approved can never hold; the model's list is
    // the oracle's (compare, above), and here each one is named in the Summary's notes in these words, restated
    C.chk('fixture: a covered block counts pull money on a budget the report’s Approved leaves out, so the note is there to see',
      M.bae.offReport.length > 0 && M.bae.offReport.some(o => o.obligated !== 0), J(M.bae.offReport));
    const KIND = { flyaway: ['Flyaway (production) budget', 'Flyaway (production) budgets'], noap: ['budget that names no appropriation', 'budgets that name no appropriation'],
      blank: ['row with no Budget', 'rows with no Budget'] };
    const offWords = bs => { const w = []; for (const k of ['flyaway', 'noap', 'blank']) { const of = bs.filter(t => t.kind === k), c = k === 'blank' ? sum(of.map(t => t.rows)) : of.length;
      if (c) w.push(c + ' ' + KIND[k][c === 1 ? 0 : 1]); } return w.length > 1 ? w.slice(0, -1).join(', ') + ' and ' + w[w.length - 1] : w[0]; };
    const offNote = o => AP_LABEL[o.ap] + ' FY' + o.fy + ': the CCaR plan counts $' + SP.fmtMText(o.planned) + 'M on ' + offWords(o.budgets) + ', which the BAE report’s Approved leaves out'
      + (o.obligated !== 0 ? '; $' + SP.fmtMText(o.obligated) + 'M of it is obligated, so Obligated and Obl % count money that Approved does not.' : ', so the plan counts money that Approved does not.')
      + ' See the Import report.';
    for (const sc of Object.keys(models)) for (const o of models[sc].bae.offReport) {
      C.chk(sc + ' notes: ' + AP_LABEL[o.ap] + ' FY' + o.fy + ' names the plan and Obligated its Approved leaves out (M4-6)', models[sc].summary.notes.includes(offNote(o)),
        offNote(o) + ' | ' + models[sc].summary.notes.join(' / '));
    }
    C.chk('notes: no such note on a block without that money', M.summary.notes.filter(x => / which the BAE report’s Approved leaves out/.test(x)).length === M.bae.offReport.length);
    // the PMO tab's lines (§16.2), restated here: what its figures count, then the report money on the blocks it shows that no
    // plan event uses (each block with its Approved, in the tab's order), then the Obligated its Approved leaves out, then a
    // typed Authorized never split
    const PE_LINE = 'Approved and Authorized are the BAE report’s figures for the budgets this PMO’s plan events are assigned to; a budget the plan events '
      + 'of several PMOs use is split among them by each one’s CCaR plan on it. Obligated counts this PMO’s plan events.';
    // (the blocks in the tab's own row order, §8.6: Full Fund, Initial Spares, O&M, OPN, as its table and its other lines)
    const unLine = (p, Mx) => {
      const us = p.rows.filter(r => r.covered).map(r => Mx.bae.unassigned.find(u => u.ap + '|' + u.fy === r.key))
        .filter(u => u && (u.approved !== 0 || u.authorized !== 0));
      return us.length ? [us.map(u => AP_LABEL[u.ap] + ' FY' + u.fy + ' $' + SP.fmtMText(u.approved) + 'M').join('; ')
        + ' of the BAE report’s Approved is on budgets no plan event uses; it is in the Summary and on no PMO tab (see the Import report).'] : [];
    };
    const offLine = p => { const o = p.rows.filter(r => r.covered && r.offObligated !== 0); return o.length ? ['Obligated includes money executed on budgets the BAE report’s '
      + 'Approved leaves out (Flyaway (production), a budget that names no appropriation, or no Budget at all): ' + o.map(r => AP_LABEL[r.ap] + ' FY' + r.fy + ' $'
      + SP.fmtMText(r.offObligated) + 'M').join('; ') + '. Obl % there counts it against an Approved that does not.'] : []; };
    const av = M.pmos.find(p => p.code === 'AV');
    same('PMO tab lines: what its figures count, and the money no plan event uses on its blocks', SP.pmoTabNotes(av, M), [PE_LINE].concat(unLine(av, M), offLine(av)));
    C.chk('fixture: AV’s tab shows blocks with money no plan event uses, so that line is there to see', unLine(av, M).length === 1, J(SP.pmoTabNotes(av, M)));
    const Me = models['bae-entered'], ave = Me.pmos.find(p => p.code === 'AV');
    same('PMO tab lines: a typed Authorized on a block the tab shows is said to be never split', SP.pmoTabNotes(ave, Me), [PE_LINE].concat(unLine(ave, Me), offLine(ave),
      ['Authorized is entered for O&M FY2026 as a whole and is never split among the PMOs: this tab shows the BAE report’s Authorized for that block.']));
    same('PMO tab lines with no report: none', SP.pmoTabNotes(M0.pmos[0], M0), []);
    // every tab: (no PMO) is the plan events with no PMO and says what every tab says (review M4-3's sentence on budgets whose
    // name ends in no code went with rules 4 and 7), and (M4-6) a tab whose own executed rows hold money Approved leaves out says so
    const tabBad = M.pmos.filter(p => J(SP.pmoTabNotes(p, M)) !== J(p.rows.some(r => r.covered) ? [PE_LINE].concat(unLine(p, M), offLine(p)) : [])).map(p => p.label);
    C.chk('PMO tab lines: every tab, (no PMO) too, in §16.2’s words', tabBad.length === 0 && M.pmos.some(p => p.label === '(no PMO)'), J(tabBad));
    C.chk('fixture: a tab’s own executed rows hold money the report’s Approved leaves out, so the M4-6 line is there to see', M.pmos.some(p => offLine(p).length), '');
    C.chk('PMO tab lines: no tab says §14.4’s words on budget names any more', M.pmos.every(p => !SP.pmoTabLines(p, M).some(l => /end(s)? in (this|any) PMO’s code/.test(l))));
    // every line under a PMO tab's table, the screen's and the workbook's (integration): §14.4's lines, then §8.6's note said
    // only of the rows the report does not cover, and only when the tab has one
    const NARROW = 'Authorized is entered by appropriation and FY; where the BAE report has no figure for a block, its PMO row shows Approved.';
    const lineBad = M.pmos.filter(p => JSON.stringify(SP.pmoTabLines(p, M)) !== JSON.stringify(SP.pmoTabNotes(p, M)
      .concat(p.rows.some(r => !r.covered) ? [NARROW] : []))).map(p => p.label);
    C.chk('PMO tab lines: §14.4’s, then the narrowed §8.6 note where a row is uncovered', !lineBad.length && M.pmos.some(p => p.rows.some(r => !r.covered))
      && M.pmos.some(p => p.rows.every(r => r.covered)), J(lineBad));
    same('PMO tab lines with no report: §8.6’s note', SP.pmoTabLines(M0.pmos[0], M0), ['Authorized is entered by appropriation and FY; a PMO row shows Approved.']);
    // the seventh switch exists for a report row with no service, as for a pull row (§9, review S2)
    C.chk('present: a report row with no service makes its switch exist', M.present.services.includes('Service not identified'));
  }

  // ============================================================================================ hand-built rows
  // Rule 7, the marks and every note, on stored rows written here in the shapes §3 and §14.1 store, every value invented.
  {
    let n = 0;
    const row = o => {
      const c = new Array(32).fill('');
      c[0] = o.fy ?? 2027; c[2] = o.ccar ?? 'CC-' + (++n); c[3] = 'A title'; c[4] = o.budget; c[7] = o.pe ?? 'A plan event';
      c[8] = o.date ?? '2026-11-15'; c[9] = o.cents; c[10] = o.alloc ?? 'Not Allocated'; c[18] = o.pmo ?? 'Air Vehicle (AV)';
      return { c, x: {}, src: [0, 'O&M Raw Data', ++n] };
    };
    const rep = (name, fy, a, u, bad) => { const r = { c: [name, fy, a, u], x: {}, src: [0, 'Sheet1', ++n] }; if (bad) r.bad = bad; return r; };
    const AV = 'USAF O&M Fixture Discretionary AV', PSM = 'USAF O&M Fixture Discretionary PSM', PP = 'USAF O&M Fixture Discretionary PP';
    const pulls = { om: { rows: [
      row({ budget: PSM, pmo: 'Air Vehicle (AV)', alloc: 'Actual Execution', cents: 100000000 }),      // its budget names PSM
      row({ budget: AV, cents: 300000000 }),
      row({ budget: PP, pmo: 'Propulsion (PP)', alloc: 'Actual Execution', cents: 50000000 }),
      row({ budget: AV, pmo: 'Air Vehicle (AV)', alloc: 'Unprogrammed', cents: 7000000 }),
      row({ budget: AV, fy: 2026, alloc: 'Actual Execution', cents: 20000000 }),
      row({ budget: 'USAF O&M Fixture Discretionary SA', pmo: 'Sustainment Analytics (SA)', fy: 2026, cents: 1000000 }) ] } };
    const report = (rows, total) => ({ headers: ['Budget Name', 'Budget FY Numeric', 'Budget Approved Amount ($M)', 'Budget Authorized Amount ($M)'],
      cols: ['Budget Name', 'Budget FY Numeric', 'Budget Approved Amount ($M)', 'Budget Authorized Amount ($M)'], rows, file: 'Report__BAE_x_2026-01-31_120000.xlsx',
      sheet: 'Sheet1', stamp: '2026-01-31 12:00', total: total || null, importedAt: NOW });
    const RROWS = [rep(AV, 2027, 1000000000, 800000000), rep(PSM, 2027, 500000000, 500000000), rep('USAF O&M Fixture Discretionary CAM', 2027, 200000000, 0),
      rep('USAF O&M Fixture Discretionary tss', 2027, 0, 0), rep('USAF APAF Full Fund FLYAWAY Lot AV', 2027, 900000000, 900000000),
      rep('USAF APAF Advance Procurement AV', 2027, 400000000, 400000000), rep('USAF APAF Full Fund Fixture Discretionary AV', 2027, 70000000, 0),
      rep(AV, 2027, null, 5, ['Budget Approved Amount ($M) “$1.250” is text, not a number']), rep(AV, 2024, 100000000, 100000000),
      rep('USAF O&M Fixture Discretionary sa', 2027, 30000000, 30000000)];
    const goodSum = f => sum(RROWS.filter(r => !r.bad).map(r => r.c[f]));
    const BAE = report(RROWS, { approved: goodSum(2), authorized: goodSum(3), rowNo: 99 });
    const S = settingsFor('2026-10', 2025);
    const M = SP.buildModel(pulls, S, viewFor(), BAE), M0 = SP.buildModel(pulls, S, viewFor());
    const b = M.blocks.find(x => x.key === 'om|2027'), u = M.blocks.find(x => x.key === 'om|2026');
    same('hand: a report adds no block (Full Fund FY2027 has report money and no pull row)', M.blocks.map(x => x.key), ['om|2026', 'om|2027']);
    same('hand: the covered block: planned, the report’s Approved and Authorized, Obligated on the plan, short of half',
      [b.covered, b.planned, b.approved, b.authorized, b.authorizedSrc, b.obligated, b.unobligated, b.planShort],
      [true, 457000000, 1730000000, 1330000000, 'report', 150000000, 1580000000, true]);
    same('hand: the uncovered block: the plan, † and §', [u.covered, u.approved, u.planned, u.authorized, u.authorizedSrc, SP.authMark(u, M), SP.approvedMark(u, M)],
      [false, 21000000, 21000000, 21000000, 'approved', '†', '§']);
    const rowOf = (code, key) => { const p = M.pmos.find(x => x.code === code); const r = p && p.rows.find(x => x.key === key); return r ? [r.approved, r.authorized, r.obligated, r.basis] : null; };
    // §16.1: AV's plan events use the AV and the PSM budget, so both are AV's whole; PP's use only the PP budget, which the
    // report lacks (Approved $0); the CAM, tss and sa budgets no plan event uses are on no row; PSM, TSS, SA and (no PMO)
    // have no plan event in the block, so no row there, whatever their budgets' names say (rules 4 and 7 replaced)
    same('hand: §16, the PMO rows of the covered block: by the PMO column, each PMO’s share of the budgets its plan events use',
      ['AV', 'PSM', 'PP', 'TSS', 'SA', 'no PMO'].map(c => rowOf(c, 'om|2027')),
      [[1500000000, 1300000000, 100000000, 'planEvent'], null, [0, 0, 50000000, 'planEvent'], null, null, null]);
    same('hand: §16, the money no plan event uses', M.bae.unassigned, [{ ap: 'om', fy: 2027, approved: 230000000, authorized: 30000000, budgets: [
      { key: 'usaf o&m fixture discretionary cam', name: 'USAF O&M Fixture Discretionary CAM', approved: 200000000, authorized: 0, why: 'nopull' },
      { key: 'usaf o&m fixture discretionary sa', name: 'USAF O&M Fixture Discretionary sa', approved: 30000000, authorized: 30000000, why: 'nopull' },
      { key: 'usaf o&m fixture discretionary tss', name: 'USAF O&M Fixture Discretionary tss', approved: 0, authorized: 0, why: 'nopull' }] }]);
    same('hand: §16, no budget is split (one PMO’s plan events use each)', M.bae.split, []);
    C.chk('hand: SA, a PMO only the pull names, has its budget read by its code', M.bae.pmoIndex.some(p => p.code === 'SA') && SP.budgetPmo('X discretionary SA', M) === 'sustainment analytics (sa)'
      && SP.budgetPmo('X discretionary SA') === '', J(M.bae.pmoIndex.map(p => p.code)));
    same('hand: §16, a budget’s name gives no PMO a row: TSS (no pull row) has no tab, SA only its own block', [M.pmos.some(x => x.code === 'TSS'),
      M.pmos.find(x => x.code === 'SA').rows.map(r => r.key)], [false, ['om|2026']]);
    same('hand: the uncovered block’s PMO rows are by the PMO column: AV with the plan, SA with its row', ['AV', 'SA'].map(c => rowOf(c, 'om|2026')),
      [[20000000, 20000000, 20000000, 'row'], [1000000, 1000000, 0, 'row']]);
    // bpmo on the pull's rows: the budget's PMO by the same function as the report's
    same('hand: SP.budgetPmo reads the last word, without case', ['A b AV', 'A b psm', 'A  b  Pp  ', 'A b AV', 'A b CAM', 'A b SUPT', 'A b Initial', 'A b CV', 'A b Non-PMO', '', '   ', 'AV x']
      .map(s => SP.budgetPmo(s, M)), ['air vehicle (av)', 'product support management (psm)', 'propulsion (pp)', 'air vehicle (av)', '', '', '', '', '', '', '', '']);
    const d = SP.baeDerive(rep('USAF APAF Full Fund fixture flyaway AV', 2027, 1, 1), S), e = SP.baeDerive(rep('USN APN Advance Procurement CV', 2027, 1, 1), S);
    same('hand: SP.baeDerive: Flyaway in any case is out of scope; a name with no appropriation is noap', [d.ap, d.scope, e.ap, e.scope, e.svc], ['ff', 'flyaway', null, 'noap', 'USN (USN CV)']);
    // an override moves a budget's pull rows and its report row together (§14.2)
    const So = settingsFor('2026-10', 2025); So.budgets = { [normKey(PSM)]: { svc: 'USAF ANG', lane: 'mand' } };
    const Mo = SP.buildModel(pulls, So, viewFor(['USAF ANG']), BAE), bo = Mo.blocks.find(x => x.key === 'om|2027');
    same('hand: an override moves the budget’s pull rows and report row together under a switch', [bo.planned, bo.approved, bo.obligated, Mo.bae.counted.find(x => x[0] === RROWS[1].src[2])[1]],
      [357000000, 1230000000, 50000000, 'Switch off']);
    // the words
    const N = M.summary.notes;
    same('hand: the Summary’s notes with a report', N, [
      'Approved and Authorized come from the BAE report of 2026-01-31 12:00 (Report__BAE_x_2026-01-31_120000.xlsx) wherever it has figures for a block: it holds 7 rows of sustainment budgets (6 budgets), $19.00M Approved and $14.30M Authorized over every FY. Counted nowhere: 1 Flyaway (production) row, 1 row naming no appropriation, 1 row that could not be read and 1 row before FY2025. Its total row agrees with the rows read.',
      'The BAE report has no figure for O&M FY2026: Approved there is the CCaR plan (marked §).',
      'O&M FY2027: the CCaR plan ($4.57M) is 26% of the BAE report’s Approved ($17.30M); Obl % is measured against the report’s figure.',
      'The PMO tabs share each budget’s Approved and Authorized among the PMOs whose plan events use it, by their CCaR plan on it. O&M FY2027 $2.30M Approved and $0.30M Authorized of the BAE report’s money is on budgets no plan event uses, so the PMO tabs add up to the Summary less it.',
      'The BAE report holds money for Full Fund FY2027 ($0.70M Approved, $0.00M Authorized), which the CCaR pull has no rows for: no block is shown for it.',
      'Unprogrammed money is counted in the CCaR plan: O&M FY2027 $0.07M.',
      'Authorized was neither entered nor in the BAE report for O&M FY2026; Approved is shown in its place (marked †).',
      '3 rows marked Actual Execution ($1.70M) are dated after Oct-2026, the data-through month; they are counted as obligated.']);
    same('hand: line 2 names the report’s date', SP.summaryLine2(M), 'Data through Oct-2026 | Approved, Authorized = BAE report of 2026-01-31 12:00 (sustainment budgets)' + LINE2_TAIL);
    same('hand: the TOTAL carries † and §, never ‡ with nothing typed', SP.authMarks(M.summary.rows, M), { dag: true, ddag: false, sect: true });
    same('hand: model.bae', pick(M.bae, ['rows', 'cents', 'total', 'uncovered', 'noBlock', 'planShort', 'pullOnly', 'reportOnly']), {
      rows: { in: 7, flyaway: 1, noap: 1, bad: 1 }, cents: { approved: 1900000000, authorized: 1430000000 }, total: { ok: true, diff: { approved: 0, authorized: 0 } },
      uncovered: [{ ap: 'om', fy: 2026 }], noBlock: [{ ap: 'ff', fy: 2027, approved: 70000000, authorized: 0 }],
      planShort: [{ ap: 'om', fy: 2027, planned: 457000000, approved: 1730000000 }], pullOnly: ['usaf o&m fixture discretionary pp'],
      reportOnly: ['usaf apaf full fund fixture discretionary av', 'usaf o&m fixture discretionary cam'] });
    same('hand: the names beside the keys, as the files spell them', [M.bae.pullOnlyNames, M.bae.reportOnlyNames],
      [[PP], ['USAF APAF Full Fund Fixture Discretionary AV', 'USAF O&M Fixture Discretionary CAM']]);
    const undated = Object.assign(report(RROWS), { stamp: null, importedAt: null });
    C.chk('hand: a report with no date says so on line 2 and in its note', SP.summaryLine2(SP.buildModel(pulls, S, viewFor(), undated))
      === 'Data through Oct-2026 | Approved, Authorized = BAE report with no date recorded (sustainment budgets)' + LINE2_TAIL
      && SP.buildModel(pulls, S, viewFor(), undated).summary.notes[0].startsWith('Approved and Authorized come from the BAE report with no date recorded (Report__BAE_x_2026-01-31_120000.xlsx) wherever'));
    C.eq('hand: a report’s date is its stamp, else its import day, else none', [SP.baeWhen(BAE), SP.baeWhen({ importedAt: '2026-11-09T12:00:00' }), SP.baeWhen({}), SP.baeWhen(null)],
      ['2026-01-31 12:00', '2026-11-09', null, null]);
    same('hand: Counted, per report row, the first reason in §4.3’s order', M.bae.counted.map(x => x[1]),
      ['Yes', 'Yes', 'Yes', 'Yes', 'Flyaway (production)', 'Names no appropriation', 'Yes', 'Could not be read', 'Before the first FY', 'Yes']);
    same('hand: unreadable rows: what could not be read, and the import’s words', M.bae.unreadable.map(x => [x.name, x.fields, x.bad.length]), [[AV, ['Approved'], 1]]);
    // a typed Authorized wins over the report, and is never split to PMOs (rule 8)
    const Se = settingsFor('2026-10', 2025, { 'om|2027': 999900000 });
    const Me = SP.buildModel(pulls, Se, viewFor(), BAE), be = Me.blocks.find(x => x.key === 'om|2027');
    // ‡ with every switch on too: line 2 says Authorized is the report's, so unmarked it read as the report's (review I4-4)
    same('hand: a typed Authorized wins, marked ‡ as entered with every switch on, the report’s kept beside it',
      [be.authorized, be.authorizedSrc, be.authorizedEntered, be.reportAuthorized, SP.authMark(be, Me), Me.shown.all, be.marks.ddagger], [999900000, 'entered', true, 1330000000, '‡', true, true]);
    same('hand: the TOTAL over a typed figure carries ‡ with every switch on', SP.authMarks(Me.summary.rows, Me).ddag, true);
    same('hand: and the PMO rows keep the report’s Authorized', Me.pmos.flatMap(p => p.rows.filter(r => r.key === 'om|2027').map(r => r.authorized)), M.pmos.flatMap(p => p.rows.filter(r => r.key === 'om|2027').map(r => r.authorized)));
    const Mf = SP.buildModel(pulls, Se, viewFor(['USAF ANG']), BAE);
    same('hand: ‡ on the typed figure while a switch is off too (USAF ANG off; no row of it, but the switch exists)', [SP.authMark(Mf.blocks.find(x => x.key === 'om|2027'), Mf), Mf.shown.all], ['‡', false]);
    // with no report the mark is §8's, unchanged: an entered figure is unmarked with every switch on
    const M0e = SP.buildModel(pulls, Se, viewFor()), b0e = M0e.blocks.find(x => x.key === 'om|2027');
    same('hand (no report): an entered figure with every switch on carries no mark, as before', [SP.authMark(b0e, M0e), SP.markText('‡', M0e)], ['', SP.AUTH_MARK_TEXT['‡']]);
    // the total row checked: a row that disagrees, one that cannot be read, none at all
    const tot = (tt) => SP.buildModel(pulls, S, viewFor(), report(RROWS, tt)).summary.notes[0].replace(/^.*\. (?=It)/, '');
    same('hand: the total row, checked', [tot({ approved: goodSum(2) + 12345, authorized: goodSum(3) - 50, rowNo: 99 }), tot({ approved: null, authorized: 5, rowNo: 99 }), tot(null),
      tot({ approved: goodSum(2) + 100, authorized: goodSum(3) - 100, rowNo: 99 })],
      ['Its total row differs from the rows read by $123.45 Approved and -$0.50 Authorized; see the Import report.', 'Its total row could not be read, so it was not checked.',
        'It has no total row to check against.', 'Its total row agrees with the rows read.']);
    // a report row whose service no rule knows makes the seventh switch exist, so it can be turned back on (review S2)
    const unk = report([rep('DoN O&M Fixture Discretionary BOP', 2027, 5000000, 0)]);
    const Mu = SP.buildModel(pulls, S, viewFor(['Service not identified']), unk);
    C.chk('hand: a report row with no service: its switch exists, and turned off it hides that row and says so',
      Mu.present.services.includes('Service not identified') && !Mu.shown.all && Mu.blocks.find(x => x.key === 'om|2027').approved === 0
      && Mu.bae.counted[0][1] === 'Switch off', J([Mu.present.services, Mu.shown]));
    C.chk('hand (control): with no report the same switch hides nothing and does not exist', !SP.buildModel(pulls, S, viewFor(['Service not identified'])).present.services.includes('Service not identified'));
    // the no-report model of the same rows is untouched by any of this
    C.chk('hand: with no report, nothing of §14 is on the model', !('bae' in M0) && M0.blocks.every(x => !('planned' in x) && !('slide' in x) && !('marks' in x) && !('covered' in x))
      && M0.pmos.every(p => p.rows.every(r => !('basis' in r))));
  }

  // ============================================================================================ §16 by hand
  // PMO tabs built from the plan events (Brad, 11 Nov 2026): a budget several PMOs' plan events use is split by each one's
  // CCaR plan on it, in whole cents by largest remainder, a tie to the PMO earlier in the model's order; a plan at or below
  // zero takes no share; a budget no plan event uses, or none above zero, is on no PMO tab. Every figure here is worked out
  // by hand from §16.1, never read from the tool.
  {
    let n = 0;
    const EX = 'Actual Execution';
    const row = o => {
      const c = new Array(32).fill('');
      c[0] = 2027; c[2] = 'CC-' + (++n); c[3] = 'A title'; c[4] = o.budget; c[7] = o.pe ?? 'PE-' + n;
      c[8] = '2026-11-15'; c[9] = o.cents; c[10] = o.alloc ?? 'Not Allocated'; c[18] = o.pmo;
      return { c, x: {}, src: [0, 'O&M Raw Data', ++n] };
    };
    const rep = (name, a, u) => ({ c: [name, 2027, a, u], x: {}, src: [0, 'Sheet1', ++n] });
    const H = s => 'USAF O&M Hand Discretionary ' + s;
    const AVL = 'Air Vehicle (AV)', PPL = 'Propulsion (PP)', PSML = 'Product Support Management (PSM)', TSSL = 'Training Systems (TSS)', CDSL = 'Combat Data Systems (CDS)', AOL = 'Alpha Office (AO)';
    const pulls = { om: { rows: [
      // B3 "…AV": AV, PP and PSM, plans 1 : 2 : 4. AV's plan event PE-A is on B2 too (a plan event on two budgets)
      row({ budget: H('AV'), pmo: AVL, pe: 'PE-A', alloc: EX, cents: 1000000 }),
      row({ budget: H('AV'), pmo: PPL, cents: 2000000 }),
      row({ budget: H('AV'), pmo: PSML, cents: 4000000 }),
      // B2 "…PSM": AV 3,000,000; PP nets to -1,000,000 (below zero: no share)
      row({ budget: H('PSM'), pmo: AVL, pe: 'PE-A', cents: 3000000 }),
      row({ budget: H('PSM'), pmo: PPL, cents: 2000000 }),
      row({ budget: H('PSM'), pmo: PPL, cents: -3000000 }),
      // B4 "…PP": PSM nets to 0, AV to -100,000: no plan above zero, so it is unassigned ('noplan')
      row({ budget: H('PP'), pmo: PSML, cents: 500000 }),
      row({ budget: H('PP'), pmo: PSML, cents: -500000 }),
      row({ budget: H('PP'), pmo: AVL, cents: -100000 }),
      // B5 "…BOP": Alpha Office (listed first, and first by its label) and TSS with equal plans: the odd cent goes to TSS,
      // first in the model's order (SP.PMO_ORDER before any other PMO)
      row({ budget: H('BOP'), pmo: AOL, cents: 1000000 }),
      row({ budget: H('BOP'), pmo: TSSL, cents: 1000000 }),
      // CDS: its plan events use only a budget the report lacks: a row, Approved $0, its own Obligated
      row({ budget: H('MXS'), pmo: CDSL, alloc: EX, cents: 9000000 }) ] } };
    const BAE = { headers: ['Budget Name', 'Budget FY Numeric', 'Budget Approved Amount ($M)', 'Budget Authorized Amount ($M)'], rows: [
      rep(H('AV'), 100000000, 10), rep(H('PSM'), 7777777, 0), rep(H('PP'), 4000000, 4000000), rep(H('BOP'), 3, -3), rep(H('CDS'), 1234500, 0)],
      file: 'h16.xlsx', sheet: 'Sheet1', stamp: null, total: null, importedAt: NOW };
    const S = settingsFor('2026-10', 2025);
    const M = SP.buildModel(pulls, S, viewFor(), BAE), b = M.blocks[0];
    const rowOf = code => { const p = M.pmos.find(x => x.code === code); const r = p && p.rows.find(x => x.key === 'om|2027'); return r ? [r.approved, r.authorized, r.obligated, r.basis] : null; };
    same('§16 hand: the block is the report’s', [b.covered, b.approved, b.authorized, b.obligated], [true, 113012280, 4000007, 10000000]);
    // AV: B3 1/7 of 100,000,000 = 14,285,714.29 and of 10 = 1.43; B2 whole (PP's plan is below zero). PP: 28,571,428.57 takes
    // the odd cent of B3's Approved (the largest remainder), 2.86 and PSM's 5.71 the two odd cents of its Authorized. B5:
    // 3 cents by equal plans, the odd one to TSS; -3 split as 3 and negated. CDS: $0. B4 and B6 on no row.
    same('§16 hand: each PMO row, by its plan events', ['AV', 'PP', 'PSM', 'TSS', 'AO', 'CDS'].map(rowOf), [
      [22063491, 1, 1000000, 'planEvent'], [28571429, 3, 0, 'planEvent'], [57142857, 6, 0, 'planEvent'], [2, -2, 0, 'planEvent'], [1, -1, 0, 'planEvent'],
      [0, 0, 9000000, 'planEvent']]);
    same('§16 hand: the budgets split among PMOs, in name order, each largest share first (a tie in the model’s order)', M.bae.split.map(e => [e.name, e.approved, e.authorized,
      e.pmos.map(p => [p.label, p.plan, p.approved, p.authorized])]), [
      [H('AV'), 100000000, 10, [[PSML, 4000000, 57142857, 6], [PPL, 2000000, 28571429, 3], [AVL, 1000000, 14285714, 1]]],
      [H('BOP'), 3, -3, [[TSSL, 1000000, 2, -2], [AOL, 1000000, 1, -1]]]]);
    same('§16 hand: the money no plan event uses, and why', M.bae.unassigned, [{ ap: 'om', fy: 2027, approved: 5234500, authorized: 4000000, budgets: [
      { key: normKey(H('CDS')), name: H('CDS'), approved: 1234500, authorized: 0, why: 'nopull' },
      { key: normKey(H('PP')), name: H('PP'), approved: 4000000, authorized: 4000000, why: 'noplan' }] }]);
    same('§16 hand: the BAE Report sheet’s PMO column, row by row', M.bae.derived.map(d => d.goes), [
      PSML + ' 57.1%; ' + PPL + ' 28.6%; ' + AVL + ' 14.3%', AVL + ' 100.0%', 'No plan event uses it', TSSL + ' 50.0%; ' + AOL + ' 50.0%', 'No plan event uses it']);
    same('§16 hand: the Summary’s note', M.summary.notes.filter(x => x.startsWith('The PMO tabs share')), ['The PMO tabs share each budget’s Approved and Authorized among the PMOs '
      + 'whose plan events use it, by their CCaR plan on it. O&M FY2027 $0.05M Approved and $0.04M Authorized of the BAE report’s money is on budgets no plan event uses, '
      + 'so the PMO tabs add up to the Summary less it.']);   // review P5-2: its Authorized too
    same('§16 hand: under a PMO tab', SP.pmoTabLines(M.pmos.find(p => p.code === 'CDS'), M), [
      'Approved and Authorized are the BAE report’s figures for the budgets this PMO’s plan events are assigned to; a budget the plan events of several PMOs use is split among them by each one’s CCaR plan on it. Obligated counts this PMO’s plan events.',
      'O&M FY2027 $0.05M of the BAE report’s Approved is on budgets no plan event uses; it is in the Summary and on no PMO tab (see the Import report).']);
    const L = SP.pmoSplitLists(M);
    same('§16 hand: the Import report’s two lists', [L.split.head, L.split.items.map(i => i.text), L.unassigned.head, L.unassigned.items.map(i => [i.why, i.text])], [
      'Budgets split among PMOs by their plan events', [
        'O&M FY2027: “' + H('AV') + '” (Approved $1,000,000.00, Authorized $0.10), by each PMO’s CCaR plan on it, largest share first: ' + PSML + ', plan $40,000.00: Approved $571,428.57, '
          + 'Authorized $0.06; ' + PPL + ', plan $20,000.00: Approved $285,714.29, Authorized $0.03; ' + AVL + ', plan $10,000.00: Approved $142,857.14, Authorized $0.01.',
        'O&M FY2027: “' + H('BOP') + '” (Approved $0.03, Authorized -$0.03), by each PMO’s CCaR plan on it, largest share first: ' + TSSL + ', plan $10,000.00: Approved $0.02, '
          + 'Authorized -$0.02; ' + AOL + ', plan $10,000.00: Approved $0.01, Authorized -$0.01.'],
      'BAE report money no plan event uses (on no PMO tab)', [
        ['nopull', 'O&M FY2027: “' + H('CDS') + '” (Approved $12,345.00, Authorized $0.00): no plan event uses it in this block.'],
        ['noplan', 'O&M FY2027: “' + H('PP') + '” (Approved $40,000.00, Authorized $40,000.00): its plan events’ plan is not above zero.']]]);
    // the switches: with TSS off its plan events are hidden, so B5's whole goes to Alpha Office; the report rows of a service
    // switched off count nowhere, as every report row does
    const Mt = SP.buildModel(pulls, S, viewFor(['USAF']), BAE);
    same('§16 hand: every row here is USAF, so with USAF off nothing is split or unassigned, and no PMO has a row', [Mt.bae.split, Mt.bae.unassigned, Mt.pmos.length], [[], [], 0]);
    // SP.splitByPlan itself
    same('§16 hand: SP.splitByPlan', [SP.splitByPlan(100000000, [1000000, 2000000, 4000000]), SP.splitByPlan(3, [5, 5]), SP.splitByPlan(-3, [5, 5]),
      SP.splitByPlan(10, [0, -5]), SP.splitByPlan(10, [0, 3]), SP.splitByPlan(0, [1, 2]), SP.splitByPlan(7, []), SP.splitByPlan(1, [1, 1, 1])],
      [[14285714, 28571429, 57142857], [2, 1], [-2, -1], null, [0, 10], [0, 0], null, [1, 0, 0]]);
    // past 2^53: a $5B budget by a $5B plan. Floating point loses the products; the shares must still add up to the cent and
    // be largest remainder
    const big = [[500000000000, [123456789012, 376543210988]], [9007199254740991, [3, 7, 11]], [987654321098, [1, 1, 1, 1, 1, 1, 7]]];
    C.chk('§16 hand: SP.splitByPlan is exact past 2^53 (each share floor or floor + 1, largest remainder, the sum exact)',
      big.every(([a, w]) => lrOk(a, w, SP.splitByPlan(a, w)) && lrOk(-a, w, SP.splitByPlan(-a, w))), J(big.map(([a, w]) => SP.splitByPlan(a, w))));
  }

  // ============================================================================================ review M4-6 by hand
  // A covered block's pull rows on budgets the report's Approved can never hold (Flyaway, a name that places it in no
  // appropriation, no Budget at all): planned and Obligated keep them (§14.3), so they are named, never moved. The review's
  // own case first: $100M executed on a Flyaway AV budget beside $40M on SUPT, against $1,000M and $50M in the report.
  {
    let n = 0;
    const EX = 'Actual Execution';
    const row = o => {
      const c = new Array(32).fill('');
      c[0] = o.fy ?? 2026; c[2] = 'CC-' + (++n); c[3] = 'A title'; c[4] = o.budget; c[7] = 'A plan event';
      c[8] = '2026-02-15'; c[9] = o.cents; c[10] = o.alloc ?? EX; c[18] = o.pmo ?? 'Air Vehicle (AV)';
      return { c, x: {}, src: [0, 'FF Raw Data', ++n] };
    };
    const rep = (name, fy, a, u) => ({ c: [name, fy, a, u], x: {}, src: [0, 'Sheet1', ++n] });
    const FLY = 'USAF APAF Full Fund Flyaway Lot Discretionary AV', SUPT = 'USAF APAF Full Fund SUPT Discretionary AV', MOD = 'USAF APAF Modifications Probe Kit Discretionary AV';
    const pulls = { ff: { rows: [
      row({ budget: FLY, cents: 10000000000 }),
      row({ budget: SUPT, cents: 4000000000 }),
      row({ budget: MOD, alloc: 'Not Allocated', cents: 300000000 }),       // placed by its sheet; planned only
      row({ budget: MOD, cents: 200000000 }),
      row({ budget: '', pmo: 'Propulsion (PP)', cents: 70000000 }),          // no Budget at all: (no PMO) by its budget
      row({ budget: '  ', pmo: 'Propulsion (PP)', alloc: 'Not Allocated', cents: 5000000 }),
      row({ budget: FLY, fy: 2027, cents: 900000000 }) ] } };              // FY2027: the report has no figure for it
    const BAE = { headers: ['Budget Name', 'Budget FY Numeric', 'Budget Approved Amount ($M)', 'Budget Authorized Amount ($M)'], rows: [
      rep(FLY, 2026, 100000000000, 100000000000), rep(SUPT, 2026, 5000000000, 5000000000), rep(MOD, 2026, 800000000, 800000000)],
      file: 'b.xlsx', sheet: 'Sheet1', stamp: null, total: null, importedAt: NOW };
    const S = settingsFor('2026-10', 2025);
    const M = SP.buildModel(pulls, S, viewFor(), BAE), M0 = SP.buildModel(pulls, S, viewFor());
    const b = M.blocks.find(x => x.key === 'ff|2026'), u = M.blocks.find(x => x.key === 'ff|2027');
    same('M4-6: the figures are §14.3’s, unmoved: Approved the SUPT budget alone, planned and Obligated every row',
      [b.covered, b.approved, b.planned, b.obligated, b.unobligated, b.status], [true, 5000000000, 14575000000, 14270000000, -9270000000, 'green']);
    same('M4-6: the block names what its Approved leaves out, budget by budget in row order, with its plan and its obligations', b.offReport, {
      planned: 10575000000, obligated: 10270000000, budgets: [
        { key: normKey(FLY), name: FLY, kind: 'flyaway', rows: 1, planned: 10000000000, obligated: 10000000000 },
        { key: normKey(MOD), name: MOD, kind: 'noap', rows: 2, planned: 500000000, obligated: 200000000 },
        { key: '', name: '', kind: 'blank', rows: 2, planned: 75000000, obligated: 70000000 }] });
    same('M4-6: model.bae.offReport lists the covered block alone (FY2027 is not covered: its Approved is its plan)', M.bae.offReport.map(o => [o.ap, o.fy, o.planned, o.obligated, o.budgets.length]),
      [['ff', 2026, 10575000000, 10270000000, 3]]);
    same('M4-6: an uncovered block has nothing to name', [u.covered, u.offReport], [false, null]);
    same('M4-6: the Summary’s note, in its words', M.summary.notes.filter(x => x.startsWith('Full Fund FY2026: the CCaR plan counts')),
      ['Full Fund FY2026: the CCaR plan counts $105.75M on 1 Flyaway (production) budget, 1 budget that names no appropriation and 2 rows with no Budget, which the BAE report’s Approved leaves out; $102.70M of it is obligated, so Obligated and Obl % count money that Approved does not. See the Import report.']);
    // §16.1: AV's Obligated (its own plan events' executed rows) holds the Flyaway and Modifications money; PP's the rows with
    // no Budget, which its PMO column names (rule 7 put them under (no PMO), by their blank budget)
    const pr = (code, key) => { const p = M.pmos.find(x => x.code === code); return p && p.rows.find(r => r.key === key); };
    same('M4-6: a PMO row carries the part of its Obligated its Approved leaves out', [pr('AV', 'ff|2026').obligated, pr('AV', 'ff|2026').offObligated,
      pr('PP', 'ff|2026').obligated, pr('PP', 'ff|2026').offObligated, pr('PP', 'ff|2026').approved, pr('AV', 'ff|2026').approved, pr('AV', 'ff|2027').offObligated],
      [14200000000, 10200000000, 70000000, 70000000, 0, 5000000000, 0]);
    same('M4-6: the AV tab says so under its table', SP.pmoTabNotes(M.pmos.find(p => p.code === 'AV'), M), [
      'Approved and Authorized are the BAE report’s figures for the budgets this PMO’s plan events are assigned to; a budget the plan events of several PMOs use is split among them by each one’s CCaR plan on it. Obligated counts this PMO’s plan events.',
      'Obligated includes money executed on budgets the BAE report’s Approved leaves out (Flyaway (production), a budget that names no appropriation, or no Budget at all): Full Fund FY2026 $102.00M. Obl % there counts it against an Approved that does not.']);
    // a block whose such money is planned only: the plan, not Obligated, holds it
    const Mp = SP.buildModel({ ff: { rows: [row({ budget: SUPT, cents: 4000000000 }), row({ budget: MOD, alloc: 'Not Allocated', cents: 300000000 })] } }, S, viewFor(), BAE);
    same('M4-6: money planned and not obligated is named as the plan’s', Mp.summary.notes.filter(x => x.startsWith('Full Fund FY2026: the CCaR plan counts')),
      ['Full Fund FY2026: the CCaR plan counts $3.00M on 1 budget that names no appropriation, which the BAE report’s Approved leaves out, so the plan counts money that Approved does not. See the Import report.']);
    C.chk('M4-6: and no PMO tab claims Obligated it does not hold', Mp.pmos.every(p => SP.pmoTabNotes(p, Mp).length <= 1));
    // controls: every row on a budget the report can count names nothing; with no report, nothing of this is on the model
    const Mc = SP.buildModel({ ff: { rows: [row({ budget: SUPT, cents: 4000000000 })] } }, S, viewFor(), BAE);
    C.chk('M4-6 (control): a block whose rows are all on sustainment budgets names nothing', Mc.bae.offReport.length === 0 && Mc.blocks[0].offReport === null
      && !Mc.summary.notes.some(x => /leaves out/.test(x)) && Mc.pmos.every(p => p.rows.every(r => r.offObligated === 0)));
    C.chk('M4-6 (control): with no report, nothing of it is on the model', M0.blocks.every(x => !('offReport' in x)) && M0.pmos.every(p => p.rows.every(r => !('offObligated' in r))));
    same('M4-6: the switches reach it as they reach the block (USAF off hides every USAF row)', SP.buildModel(pulls, S, viewFor(['USAF']), BAE).bae.offReport.map(o => o.budgets.map(t => t.kind)),
      [['blank']]);
  }

  // ============================================================================================ SP.diffBae beyond the oracle
  {
    let n = 0;
    const rep = (name, fy, a, u, bad) => { const r = { c: [name, fy, a, u], x: {}, src: [0, 'Sheet1', ++n] }; if (bad) r.bad = bad; return r; };
    const A = 'USAF O&M Line Discretionary AV', Bn = 'USAF O&M Line Discretionary PSM', Cn = 'USAF O&M Line Discretionary PP', D = 'USAF O&M Line Discretionary TSS';
    const prev = { file: 'old.xlsx', stamp: null, importedAt: NOW, rows: [rep(A, 2026, 1000, 500), rep(Bn, 2026, 10, 10), rep(Cn, 2027, 300, 300),
      rep('USAF APAF Full Fund FLYAWAY AV', 2026, 9, 9), rep(A, 2027, 0, 0)] };
    const E = 'USAF O&M Line Discretionary BOP';
    const cur = { file: 'new.xlsx', stamp: '2026-12-01 06:00', importedAt: NOW2, rows: [rep(' usaf o&m line discretionary av ', 2026, 1500, 500),
      rep(Cn, 2027, null, 300, ['Budget Approved Amount “x” is text']), rep(D, 2027, 70, 0), rep('USAF APAF Full Fund FLYAWAY AV', 2026, 99, 99),
      rep(E, 2026, 40, null, ['Budget Authorized Amount “n/a” is text'])] };
    const X = SP.diffBae(prev, cur, settingsFor('2026-10', 2025));
    same('diffBae: per (ap, fy), in scope, readable rows only, in model order', Object.entries(X.byBlock).map(([k, v]) => [k, v.approved, v.authorized]),
      [['om|2026', [1010, 1500], [510, 500]], ['om|2027', [300, 70], [300, 0]]]);
    same('diffBae: new and gone by name; a Flyaway budget is in neither; one whose only row could not be read is not new', [X.budgetsNew.map(e => e.key), X.budgetsGone.map(e => e.key)],
      [[normKey(D)], [normKey(Bn)]]);
    same('diffBae: one whose FY2027 $0 row went is changed; largest first', X.budgetsChanged.map(e => [e.key, e.size, e.approved, e.authorized]),
      [[normKey(A), 500, [1000, 1500], [500, 500]]]);
    // review I4-3: listed as changed, a budget whose row stopped reading read as cut to $0, its readable Approved included
    same('diffBae: a budget whose row stopped reading, and one new with only such a row, are listed apart, never new, gone or changed, with their unread rows',
      X.budgetsUnread.map(e => [e.key, e.size, e.approved, e.authorized, e.unread]), [[normKey(Cn), 300, [300, 0], [300, 0], [0, 1]], [normKey(E), 0, [0, 0], [0, 0], [0, 1]]]);
    same('diffBae: every in-scope row that could not be read is counted, each side', X.unread, [0, 2]);
    same('diffBae: each FY either side holds', X.budgetsChanged[0].byFy, { 2026: { approved: [1000, 1500], authorized: [500, 500] }, 2027: { approved: [0, 0], authorized: [0, 0] } });
    same('diffBae: the name is the new report’s spelling', X.budgetsChanged[0].name, 'usaf o&m line discretionary av');
    same('diffBae: the section names both reports', X.title, 'BAE report: 2026-11-09 (old.xlsx) → 2026-12-01 06:00 (new.xlsx)');
    same('diffBae: the same report twice changes nothing, its unreadable rows included', (() => { const z = SP.diffBae(cur, cur);
      return [z.budgetsNew.length, z.budgetsGone.length, z.budgetsChanged.length, z.budgetsUnread.length, z.unread]; })(), [0, 0, 0, 0, [2, 2]]);
  }
} catch (e) {
  C.chk('the engine-bae test ran to the end', false, e && e.stack ? e.stack : String(e));
} finally {
  t.close();
  tmp.rm();
  C.done();
}
