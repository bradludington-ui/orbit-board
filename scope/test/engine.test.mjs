// The model (CONTRACT §4–§6): SP.buildModel, SP.statusOf, SP.naLines, SP.diffPulls, SP.defaultSettings, SP.defaultView.
//
// The expectations come from test/fixture/oracle.py, which reads the same synthetic pull files with Python and openpyxl
// and works every figure out from the contract alone. The tool's model is compared to it VALUE FOR VALUE in every
// scenario §12 names, plus one more that exercises the settings (Authorized entered, an extra special CCaR, an edited
// goal curve, a budget override). Then the identities the contract forces are asserted on every block of every
// scenario: the tree adds up at every level, the PMO rows add to the block, the running sum ends at the dated total.
// Last, the same rows in other layouts must give exactly the same model.
//
//   node scope/test/engine.test.mjs
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTool, checks, scratchDir } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const MAKE = join(HERE, 'fixture', 'make_fixture.py');
const ORACLE = join(HERE, 'fixture', 'oracle.py');
const C = checks('engine');
const tmp = scratchDir('sfcbsp-engine-');
const t = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine'] });
const SP = t.SP;
const NOW = '2026-11-09T12:00:00.000Z';

// restated from CONTRACT §2/§4, never read from the tool, so a change on either side is a disagreement, not an echo
const COLS = ['prior', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12', 'next', 'nodate'];
const SERVICES = ['USAF', 'USAF ANG', 'USAF AFRC', 'USMC B (STOVL)', 'USMC C (USMC CV)', 'USN (USN CV)', 'Service not identified'];
const PMO_ORDER = ['air vehicle (av)', 'business operations (bop)', 'combat data systems (cds)', 'maintenance systems (mxs)',
  'product support management (psm)', 'propulsion (pp)', 'training systems (tss)'];
const GOALS = {
  om1: [0, .0833, .1667, .25, .3333, .4167, .5, .5833, .6667, .75, .8333, .9167, 1],
  om2: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  p1: [0, .0667, .1333, .2, .2667, .3333, .4, .4667, .5333, .6, .6667, .7333, .8],
  p2: [.8, .8083, .8167, .825, .8333, .8417, .85, .8583, .8667, .875, .8833, .8917, .9],
  p3: [.9, .9083, .9167, .925, .9333, .9417, .95, .9583, .9667, .975, .9833, .9917, 1],
  p4: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] };
const normKey = s => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// ---------------------------------------------------------------------------------------------------- comparing
// A deep comparison that says WHERE two values part. Whole numbers (cents, counts) must be equal; a number with a
// fraction (a ratio, a goal) may differ by 1e-12, the contract's tolerance. Objects compare by their keys whatever
// order they were written in; arrays keep their order, because the order of a Not Allocated list is part of §5.
function diff(got, want, path = '') {
  if (typeof want === 'number' && typeof got === 'number') {
    if (Number.isInteger(want) && Number.isInteger(got)) return got === want ? null : path + ': got ' + got + ', want ' + want;
    return Math.abs(got - want) <= 1e-12 ? null : path + ': got ' + got + ', want ' + want;
  }
  if (want === null || got === null || typeof want !== 'object' || typeof got !== 'object') {
    return got === want ? null : path + ': got ' + JSON.stringify(got) + ', want ' + JSON.stringify(want);
  }
  if (Array.isArray(want) !== Array.isArray(got)) return path + ': one is a list and the other is not';
  if (Array.isArray(want)) {
    if (got.length !== want.length) return path + ': ' + got.length + ' entries, want ' + want.length
      + (got.length > want.length ? ' (extra ' + JSON.stringify(got[want.length]).slice(0, 200) + ')' : ' (missing ' + JSON.stringify(want[got.length]).slice(0, 200) + ')');
    for (let i = 0; i < want.length; i++) { const d = diff(got[i], want[i], path + '[' + i + ']'); if (d) return d; }
    return null;
  }
  const kg = Object.keys(got).sort(), kw = Object.keys(want).sort();
  const miss = kw.filter(k => !(k in got)), extra = kg.filter(k => !(k in want));
  if (miss.length || extra.length) return path + ': keys differ' + (miss.length ? ', missing ' + JSON.stringify(miss.slice(0, 5)) : '')
    + (extra.length ? ', extra ' + JSON.stringify(extra.slice(0, 5)) : '');
  for (const k of kw) { const d = diff(got[k], want[k], path + '.' + k); if (d) return d; }
  return null;
}
function same(name, got, want) { const d = diff(got, want); return C.chk(name, d === null, d || ''); }

// --------------------------------------------------------------------------------------------- the tool's model
// read into the oracle's shape (dicts keyed by column id; the tree flattened to "PMO|Title|…" keys)
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
    pmos: f.pmos, titles: f.titles, pes: f.pes, ccars: f.ccars, na: b.na.map(naRow) };
}
function diffShape(D) {
  const out = {};
  for (const [ap, d] of Object.entries(D)) {
    out[ap] = { byBlock: Object.fromEntries(Object.entries(d.byBlock).map(([k, v]) => [k, { approved: v.approved, obligated: v.obligated }])),
      ccarsNew: d.ccarsNew.map(c => c.key), ccarsGone: d.ccarsGone.map(c => c.key), pmoMoves: d.pmoMoves.map(m => [m.key, m.from, m.to]) };
  }
  return out;
}
const pick = (o, ks) => Object.fromEntries(ks.map(k => [k, o[k]]));

// every field expected.json holds, compared one at a time so a failure names what disagrees
function compare(sc, M, X) {
  same(sc + ': asOf, E, firstFY, asOfIndex, window', pick(M, ['asOf', 'E', 'firstFY', 'asOfIndex', 'window']),
    pick(X, ['asOf', 'E', 'firstFY', 'asOfIndex', 'window']));
  same(sc + ': shown (services, lanes, all)', { services: M.shown.services, lanes: M.shown.lanes, all: M.shown.all }, X.shown);
  same(sc + ': special CCaRs, normalised', M.special, X.special);
  same(sc + ': showNoDate', M.showNoDate, X.showNoDate);
  same(sc + ': the blocks, in appropriation then FY order', M.blocks.map(b => b.key), Object.keys(X.blocks));
  for (const b of M.blocks) {
    const x = X.blocks[b.key];
    if (!x) continue;
    const g = blockShape(b);
    for (const f of Object.keys(x)) same(sc + ' ' + b.key + ': ' + f, g[f], x[f]);
    same(sc + ' ' + b.key + ': the PMO rows in §4.4 order', b.pmoRows.map(p => p.label), Object.keys(x.pmos));
  }
  same(sc + ': aps', Object.fromEntries(M.aps.map(a => [a.ap, pick(a.total, ['approved', 'authorized', 'obligated', 'unobligated', 'oblPct'])])), X.aps);
  same(sc + ': aps hold their own blocks', M.aps.map(a => a.blocks.map(b => b.key)),
    M.aps.map(a => Object.keys(X.blocks).filter(k => k.startsWith(a.ap + '|'))));
  same(sc + ': summary totals', pick(M.summary.total, ['approved', 'authorized', 'obligated', 'unobligated', 'unprog', 'oblPct']), X.summary);
  same(sc + ': summary rows are the blocks', M.summary.rows.map(b => b.key), Object.keys(X.blocks));
  const tabs = {};
  for (const p of M.pmos) {
    tabs[p.label] = {};
    for (const pb of p.blocks) {
      tabs[p.label][pb.key] = { approved: pb.approved, authorized: pb.authorized, obligated: pb.obligated, unobligated: pb.unobligated,
        unprog: pb.unprog, oblPct: pb.oblPct, goal: pb.goal, delta: pb.delta, status: pb.status, execAfterAsOf: pb.execAfterAsOf,
        cols: byCol(pb.cols), na: pb.na.map(naRow) };
    }
  }
  same(sc + ': PMO tabs (every PMO block, figures, columns and Not Allocated)', tabs, X.pmoTabs);
  same(sc + ': PMO codes', Object.fromEntries(M.pmos.map(p => [p.label, p.code])), X.pmoCodes);
  const e = M.excluded;
  // §15.2: the oracle states the FY2025 OBBBA rows set aside only on a scenario that loads one (its READING: absent reads as
  // §15.2's zeros), so the tool's are compared to it there and held to the zeros everywhere else
  same(sc + ': excluded', Object.assign({ beforeFirst: e.beforeFirst.cents, beforeFirstRows: e.beforeFirst.rows, beforeFirstByFy: e.beforeFirst.byFy,
    unidentified: e.unidentified.cents, unidentifiedRows: e.unidentified.rows, unreadableRows: e.unreadable.rows }, 'obbba' in X.excluded ? { obbba: e.obbba } : {}), X.excluded);
  if (!('obbba' in X.excluded)) same(sc + ': excluded.obbba is §15.2’s zeros where no FY2025 OBBBA row is loaded', e.obbba, { rows: 0, cents: 0, obligated: 0, blocks: [], budgets: [] });
  // §17.2 the OBBBA money that counts outside O&M, per (ap, fy). The oracle writes the list only where a row the rule names is
  // loaded or the list has an entry (its READING: absent reads as []); where it writes it, the model carries it too, equal
  same(sc + ': obbbaElsewhere (§17.2)', M.obbbaElsewhere === undefined ? [] : M.obbbaElsewhere, X.obbbaElsewhere || []);
  if ('obbbaElsewhere' in X) C.chk(sc + ': the model carries obbbaElsewhere where the oracle writes it', Array.isArray(M.obbbaElsewhere), String(M.obbbaElsewhere));
  same(sc + ': execAfterAsOf', M.execAfterAsOf, X.execAfterAsOf);
  same(sc + ': rowsByAp', M.rowsByAp, X.rowsByAp);
  same(sc + ': naAll is every block’s list, in model order',
    M.naAll.map(i => [i.ap, i.fy, ...naRow(i)]), M.blocks.flatMap(b => X.blocks[b.key] ? X.blocks[b.key].na.map(r => [b.ap, b.fy, ...r]) : []));
}

// ----------------------------------------------------------------------------------------------- the invariants
function invariants(sc, M) {
  const bad = [];
  const sum = a => a.reduce((x, y) => x + y, 0);
  const checkNodes = (where, nodes, level) => {
    for (const n of nodes) {
      if (n.level !== level) bad.push(where + ': ' + n.label + ' is at level ' + n.level + ', want ' + level);
      if (n.total !== sum(n.cols)) bad.push(where + ': ' + n.label + ' total is not the sum of its columns');
      if (!n.cols.every(Number.isSafeInteger)) bad.push(where + ': ' + n.label + ' has a column that is not whole cents');
      if (level < 4) {
        if (!n.children.length) bad.push(where + ': ' + n.label + ' has no children');
        for (let i = 0; i < 15; i++) if (sum(n.children.map(c => c.cols[i])) !== n.cols[i]) { bad.push(where + ': children of ' + n.label + ' do not add up in ' + COLS[i]); break; }
        for (let i = 1; i < n.children.length; i++) {
          const a = n.children[i - 1], b = n.children[i];
          if (a.total < b.total || (a.total === b.total && cmp(a.label, b.label) > 0)) { bad.push(where + ': children of ' + n.label + ' are not largest first'); break; }
        }
        checkNodes(where + ' › ' + n.label, n.children, level + 1);
      } else if (n.children.length) bad.push(where + ': CCaR ' + n.label + ' has children');
    }
  };
  const pmoRank = p => { const i = PMO_ORDER.indexOf(p.key ?? p.pmo); return i >= 0 ? [0, i, ''] : (p.key ?? p.pmo) === '' ? [2, 0, ''] : [1, 0, p.label]; };
  const pmoOrdered = list => list.every((p, i) => i === 0 || (() => {
    const a = pmoRank(list[i - 1]), b = pmoRank(p);
    return a[0] < b[0] || (a[0] === b[0] && (a[1] < b[1] || (a[1] === b[1] && cmp(a[2], b[2]) <= 0)));
  })());
  const blockInv = (where, b) => {
    if (sum(b.cols) !== b.approved) bad.push(where + ': the columns do not add to Approved');
    if (b.obligated + b.unobligated !== b.approved) bad.push(where + ': obligated + unobligated is not Approved');
    for (let i = 0; i < 15; i++) if (sum(b.pmoRows.map(p => p.cols[i])) !== b.cols[i]) { bad.push(where + ': the PMO rows do not add up in ' + COLS[i]); break; }
    if (sum(b.tree.map(p => p.total)) !== b.approved) bad.push(where + ': the PMO totals do not add to Approved');
    if (b.cum[13] !== b.approved - b.cols[14]) bad.push(where + ': cum ends at ' + b.cum[13] + ', not the dated total ' + (b.approved - b.cols[14]));
    if (b.cum[14] !== null) bad.push(where + ': No date is in the running sum');
    let run = 0;
    for (let i = 0; i < 14; i++) { run += b.cols[i]; if (b.cum[i] !== run) { bad.push(where + ': cum is not the running sum at ' + COLS[i]); break; } }
    if (!pmoOrdered(b.tree)) bad.push(where + ': the PMOs are not in §4.4 order');
    checkNodes(where, b.tree, 1);
    for (let i = 1; i < b.na.length; i++) {
      const p = b.na[i - 1], q = b.na[i];
      if (p.colIndex > q.colIndex || (p.colIndex === q.colIndex && (p.cents < q.cents || (p.cents === q.cents && cmp(p.label, q.label) > 0)))) { bad.push(where + ': Not Allocated is not in §5 order'); break; }
    }
    if (b.na.some(i => i.cents === 0)) bad.push(where + ': a $0 Not Allocated item is listed');
  };
  for (const b of M.blocks) blockInv(sc + ' ' + b.key, b);
  if (!pmoOrdered(M.pmos)) bad.push(sc + ': the PMO tabs are not in §4.4 order');
  for (const p of M.pmos) {
    const tab = ['ff', 'sp', 'om', 'opn'];
    for (let i = 1; i < p.blocks.length; i++) {
      const a = p.blocks[i - 1], c = p.blocks[i];
      const x = tab.indexOf(a.ap) - tab.indexOf(c.ap);
      if (x > 0 || (x === 0 && a.fy >= c.fy)) { bad.push(sc + ' PMO ' + p.label + ': blocks not in Full Fund, Spares, O&M, OPN then FY order'); break; }
    }
    for (const pb of p.blocks) {
      const where = sc + ' PMO ' + p.label + ' ' + pb.key;
      blockInv(where, pb);
      if (pb.tree.length !== 1 || pb.tree[0].key !== p.pmo) bad.push(where + ': its tree does not start at its own PMO node');
      if (pb.authorized !== pb.approved || pb.authorizedEntered) bad.push(where + ': Authorized is not Approved');
      const blk = M.blocks.find(b => b.key === pb.key), row = blk && blk.pmoRows.find(r => r.pmo === p.pmo);
      if (!row || JSON.stringify(row.cols) !== JSON.stringify(pb.cols)) bad.push(where + ': its columns are not the block’s PMO row');
    }
  }
  // every PMO block of a block adds back to the block
  for (const b of M.blocks) {
    const parts = M.pmos.flatMap(p => p.blocks.filter(pb => pb.key === b.key));
    if (sum(parts.map(pb => pb.approved)) !== b.approved || sum(parts.map(pb => pb.obligated)) !== b.obligated)
      bad.push(sc + ' ' + b.key + ': the PMO blocks do not add back to the block');
  }
  C.chk(sc + ': every invariant holds on every block and PMO block', bad.length === 0, bad.slice(0, 8).join('; '));
}

// ---------------------------------------------------------------------------------------------- the fixture
function py(args) { return spawnSync('python3', ['-I', ...args], { encoding: 'utf8', maxBuffer: 1 << 28 }); }
const ab = p => { const b = readFileSync(p); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };
async function importFiles(names) {
  return SP.parseFiles(names.map(n => ({ name: n.split('/').pop(), data: ab(join(tmp.dir, n)) })), { now: NOW });
}
// CONTRACT §11: each appropriation in an import replaces that appropriation's current pull, which becomes previous
function apply(store, parsed) {
  for (const ap of Object.keys(parsed.pulls)) {
    if (store.current[ap]) store.previous[ap] = store.current[ap];
    store.current[ap] = parsed.pulls[ap];
  }
}
function oracle(args, name) {
  const out = join(tmp.dir, 'exp-' + name + '.json');
  const r = py([ORACLE, ...args, '--out', out]);
  if (r.status !== 0) throw new Error('the oracle failed on ' + name + ': ' + r.stderr.slice(-800));
  return JSON.parse(readFileSync(out, 'utf8'));
}
function settingsFor(asOf, firstFY) {
  const s = SP.defaultSettings('2026-11-09');
  s.asOf = asOf; s.firstFY = firstFY;
  return s;
}
function viewFor(svcOff = [], lanes = ['disc', 'mand']) {
  const v = SP.defaultView();
  for (const s of svcOff) v.svc[s] = false;
  for (const l of ['disc', 'mand']) if (!lanes.includes(l)) v.lane[l] = false;
  return v;
}

try {
  C.eq('the engine boots with no script errors', t.errors, []);
  const mk = py([MAKE, '--out', tmp.dir]);
  if (mk.status !== 0) throw new Error('make_fixture failed: ' + mk.stderr);
  const manifest = JSON.parse(readFileSync(join(tmp.dir, 'manifest.json'), 'utf8'));

  // ============================================================================================ defaults (§4.1)
  {
    const s = SP.defaultSettings('2026-11-09');
    C.eq('defaultSettings: imported 9 Nov 2026, data through 2026-10', s.asOf, '2026-10');
    C.eq('defaultSettings: imported 1 Jan 2026, data through 2025-12', SP.defaultSettings('2026-01-01').asOf, '2025-12');
    C.eq('defaultSettings: imported 31 Oct 2026, data through 2026-09', SP.defaultSettings('2026-10-31').asOf, '2026-09');
    C.eq('defaultSettings: firstFY 2025', s.firstFY, 2025);
    same('defaultSettings: the goal curves are v12’s', s.goals, GOALS);
    same('defaultSettings: special CCaRs PP 2000 and JSF6654', s.special, ['PP 2000', 'JSF6654']);
    same('defaultSettings: no Authorized, no overrides', [s.authorized, s.budgets], [{}, {}]);
    s.goals.om1[3] = 9; s.special.push('X');
    C.chk('defaultSettings: a copy, so editing it leaves the defaults alone',
      SP.defaultSettings('2026-11-09').goals.om1[3] === 0.25 && SP.SPECIAL_CCARS_DEFAULT.length === 2);
    const v = SP.defaultView();
    same('defaultView: every service, the unknown one too, and both lanes', v, { svc: Object.fromEntries(SERVICES.map(x => [x, true])), lane: { disc: true, mand: true } });
  }
  // ============================================================================================ statusOf (§4.5)
  {
    const S = [[0.5, 0.5, 'green'], [0.5 - 1e-13, 0.5, 'green'], [0.6, 0.5, 'green'], [0.4, 0.5, 'yellow'], [0.39, 0.5, 'red'],
      [0.3999999, 0.5, 'red'], [0, 0.0833, 'yellow'], [0, 0.1667, 'red'], [null, 0.5, null], [0.5, null, null], [-0.2, 0, 'red']];
    for (const [p, g, w] of S) C.eq('statusOf(' + p + ', ' + g + ')', SP.statusOf(p, g), w);
    C.eq('every status has its word', [SP.statusWord('green'), SP.statusWord('yellow'), SP.statusWord('red'), SP.statusWord(null)], ['On track', 'Within 10', 'Behind', '']);
  }
  // ============================================================================================ refusals and empties
  {
    let threw = null;
    try { SP.buildModel({}, { asOf: '2026-13', firstFY: 2025 }, SP.defaultView()); } catch (e) { threw = e; }
    C.chk('buildModel refuses an as-of that is not a month, in words', threw && /YYYY-MM/.test(threw.message), String(threw));
    const M0 = SP.buildModel({}, settingsFor('2026-10', 2025), SP.defaultView());
    same('buildModel with no pulls: no blocks, no PMOs, no notes', [M0.blocks, M0.pmos, M0.naAll, M0.summary.notes, M0.summary.total.approved], [[], [], [], [], 0]);
    same('the columns and their labels for asOf 2026-10', M0.cols.map(c => [c.id, c.label, c.closed]),
      [['prior', 'Prior Yr', true], ['m1', 'Oct', true], ...['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((m, i) => ['m' + (i + 2), m, false]),
        ['next', 'FY28+', false], ['nodate', 'No date', false]]);
    const M3 = SP.buildModel({}, settingsFor('2026-03', 2025), SP.defaultView());
    same('asOf 2026-03: E 2026, March is m6, closed through it, Next is FY27+', [M3.E, M3.asOfIndex, M3.cols.filter(c => c.closed).length, M3.cols[13].label, M3.asOfLabel], [2026, 6, 7, 'FY27+', 'Mar-2026']);
  }

  // ============================================================================================ the scenarios (§12)
  const gen1 = await importFiles(['pull-all.xlsx']);
  const store1 = { current: {}, previous: {} };
  apply(store1, gen1);
  const gen2 = await importFiles(['gen2/pull-om.xlsx', 'gen2/pull-ff.csv']);
  const store2 = { current: {}, previous: {} };
  apply(store2, await importFiles(['pull-all.xlsx']));
  apply(store2, gen2);
  C.eq('gen2: O&M and Full Fund came from gen2; Spares and OPN kept from gen1',
    ['om', 'ff', 'sp', 'opn'].map(ap => store2.current[ap] === (ap === 'om' || ap === 'ff' ? gen2.pulls[ap] : store2.current[ap]) && !!store2.current[ap]), [true, true, true, true]);
  C.eq('gen2: the previous pulls are gen1’s O&M and Full Fund (and its unidentified rows)', Object.keys(store2.previous).sort(), ['ff', 'om', 'unidentified']);

  // §15.5 the obbba pulls (O&M FY2025 holding only FY2025 OBBBA rows, Full Fund FY2025 mixing them with ordinary ones)
  const storeO = { current: {}, previous: {} };
  apply(storeO, await importFiles(['obbba/pull-om.xlsx', 'obbba/pull-ff.csv']));
  // §17.4 the obbba2 pulls alone: O&M FY2025 rows named OBBBA (left out), rows on budgets only the report marks (counted, as
  // no report is loaded), Initial Spares, Full Fund and OPN FY2025 OBBBA money (counted, listed in obbbaElsewhere)
  const storeO2 = { current: {}, previous: {} };
  apply(storeO2, await importFiles(['obbba2/pull-om.xlsx', 'obbba2/pull-ff.csv', 'obbba2/pull-sp.xlsx']));
  const SCEN = [
    { name: 'all', store: store1, asOf: '2026-10', first: 2025 },
    { name: 'usaf-off', store: store1, asOf: '2026-10', first: 2025, svcOff: ['USAF'] },
    { name: 'mand-only', store: store1, asOf: '2026-10', first: 2025, lanes: ['mand'] },
    { name: 'asof-2026-03', store: store1, asOf: '2026-03', first: 2025 },
    { name: 'first-2024', store: store1, asOf: '2026-10', first: 2024 },
    { name: 'gen2', store: store2, asOf: '2026-10', first: 2025 },
    // §15.5: FY2025 OBBBA funding left out, under a switch, and before a later First FY instead
    { name: 'obbba', store: storeO, asOf: '2026-10', first: 2025 },
    { name: 'obbba-usaf-off', store: storeO, asOf: '2026-10', first: 2025, svcOff: ['USAF'] },
    { name: 'obbba-first-2026', store: storeO, asOf: '2026-10', first: 2026 },
    // §17.4: the obbba2 pulls with no report, so each pull row is judged by its own name
    { name: 'obbba2', store: storeO2, asOf: '2026-10', first: 2025 },
  ];
  const models = {};
  for (const sc of SCEN) {
    const X = oracle(['--scenario', sc.name, '--fixture', tmp.dir], sc.name);
    const view = viewFor(sc.svcOff, sc.lanes);
    const M = SP.buildModel(sc.store.current, settingsFor(sc.asOf, sc.first), view);
    models[sc.name] = M;
    C.chk(sc.name + ': the oracle and the scenario agree on what was asked', X.asOf === sc.asOf && X.firstFY === sc.first);
    compare(sc.name, M, X);
    invariants(sc.name, M);
    if (sc.name === 'gen2') same('gen2: diffPulls, per appropriation in both pulls', diffShape(SP.diffPulls(sc.store.previous, sc.store.current, settingsFor(sc.asOf, sc.first))), X.diff);
  }
  // §15.5 the obbba fixture makes the rule matter, so the comparisons above could fail: the rule takes a whole block away (O&M
  // FY2025, whose only rows are FY2025 O&M OBBBA funding), and §17 keeps Full Fund FY2025's OBBBA rows (OBBBA funding outside
  // O&M counts like any other money, listed in obbbaElsewhere); under First FY 2026 the same rows are before the First FY
  // instead (§4.3: condition 3 first)
  {
    const Mo = models.obbba, Mf = models['obbba-first-2026'];
    C.chk('obbba: O&M FY2025 has no block, Full Fund FY2025 has one, and the rows left out are O&M’s alone (§17)',
      !Mo.blocks.some(b => b.key === 'om|2025') && Mo.blocks.some(b => b.key === 'ff|2025')
      && Mo.excluded.obbba.blocks.map(b => b.ap + '|' + b.fy).join() === 'om|2025' && Mo.excluded.obbba.obligated > 0, JSON.stringify(Mo.excluded.obbba.blocks));
    C.chk('obbba: Full Fund FY2025’s OBBBA rows count, and are listed as OBBBA money outside O&M (§17.2)',
      Array.isArray(Mo.obbbaElsewhere) && Mo.obbbaElsewhere.some(e => e.ap === 'ff' && e.fy === 2025 && e.pull.rows > 0), JSON.stringify(Mo.obbbaElsewhere));
    C.chk('obbba-first-2026: none is left out by the rule; they are before the First FY', Mf.excluded.obbba.rows === 0 && Mf.excluded.beforeFirst.byFy['2025'] > 0);
  }
  // §17.4 obbba2 without its report: only the O&M FY2025 rows NAMED OBBBA are left out (each budget by:'name'); the O&M
  // FY2025 rows on budgets only the report marks still count, so O&M FY2025 keeps its block; and the OBBBA money of Initial
  // Spares, Full Fund and OPN FY2025 counts and is listed. A fixture that could not reach these would make compare() pass for
  // nothing.
  {
    const M2 = models.obbba2, o = M2.excluded.obbba, mk = new Set(manifest.obbba2.marks.map(normKey));
    C.chk('obbba2: O&M FY2025 keeps its block, and only O&M FY2025 rows are left out, every budget by its own name',
      M2.blocks.some(b => b.key === 'om|2025') && o.rows > 0 && o.blocks.map(b => b.ap + '|' + b.fy).join() === 'om|2025' && o.budgets.every(t => t.by === 'name'), JSON.stringify(o));
    C.chk('obbba2: no budget only the report would mark is left out with no report loaded', !o.budgets.some(t => mk.has(t.key) && !/\bOBBBA\b/i.test(t.name)),
      JSON.stringify(o.budgets.map(t => t.key)));
    C.chk('obbba2: the pulls do hold O&M FY2025 rows on a budget only the report marks (so the check above can fail)',
      storeO2.current.om.rows.some(r => { const b = r.c[SP.RAW_HEADERS.indexOf('Budget')]; return mk.has(normKey(b)) && r.c[SP.RAW_HEADERS.indexOf('FY')] === 2025 && !/\bOBBBA\b/i.test(String(b)); }));
    C.chk('obbba2: every entry of the list is FY2025 outside O&M', (M2.obbbaElsewhere || []).every(e => e.fy === 2025 && e.ap !== 'om'), JSON.stringify(M2.obbbaElsewhere));
    C.chk('obbba2: the list names Full Fund and Initial Spares FY2025 with pull rows', ['ff', 'sp'].every(a => (M2.obbbaElsewhere || []).some(e => e.ap === a && e.fy === 2025 && e.pull.rows > 0)), JSON.stringify(M2.obbbaElsewhere));
  }

  // ============================================================================================ settings in play
  // Authorized entered, an extra special CCaR, an edited goal curve and a budget override (with its service then
  // switched off), all on the oracle's --settings path, so the settings are read the same way on both sides.
  {
    const omNa = new Map();
    for (const r of manifest.gen1) if (r.ap === 'om' && r.status === 'na' && r.ccar && !['pp 2000', 'jsf6654'].includes(normKey(r.ccar))) omNa.set(r.ccar, (omNa.get(r.ccar) || 0) + 1);
    const extraCcar = [...omNa.entries()].sort((a, b) => b[1] - a[1] || cmp(a[0], b[0]))[0][0];
    const ffBud = new Map();
    for (const r of manifest.gen1) if (r.ap === 'ff' && !/mandatory/i.test(r.budget)) ffBud.set(r.budget, (ffBud.get(r.budget) || 0) + 1);
    const budget = [...ffBud.entries()].sort((a, b) => b[1] - a[1] || cmp(a[0], b[0]))[0][0];
    const goals = JSON.parse(JSON.stringify(GOALS));
    goals.om1 = goals.om1.map(x => Math.min(1, x + 0.05)); goals.p1[1] = 0.5;
    const extra = { authorized: { 'om|2026': 12345678901, 'ff|2025': 0 }, goals, special: ['PP 2000', 'JSF6654', ' ' + extraCcar.toLowerCase() + ' '],
      budgets: { [budget]: { svc: 'USAF ANG', lane: 'mand' } } };
    const sfile = join(tmp.dir, 'settings.json');
    writeFileSync(sfile, JSON.stringify(extra));
    const X = oracle(['--files', join(tmp.dir, 'pull-all.xlsx'), '--asof', '2026-10', '--first', '2025', '--settings', sfile], 'settings');
    const s = settingsFor('2026-10', 2025);
    Object.assign(s, { authorized: extra.authorized, goals, special: extra.special, budgets: { [normKey(budget)]: { svc: 'USAF ANG', lane: 'mand' } } });
    const M = SP.buildModel(store1.current, s, SP.defaultView());
    compare('settings', M, X);
    invariants('settings', M);
    const b = M.blocks.find(x => x.key === 'om|2026');
    C.chk('settings: Authorized entered is used and marked entered', b.authorized === 12345678901 && b.authorizedEntered === true);
    C.chk('settings: Authorized entered as 0 is entered, not "not entered"', M.blocks.find(x => x.key === 'ff|2025').authorizedEntered === true);
    C.chk('settings: the extra special CCaR makes CC: items', M.naAll.some(i => i.key === 'CC:' + normKey(extraCcar)));
    C.chk('settings: Authorized-not-entered note names the blocks, not "any block"', M.summary.notes.some(n => /^Authorized was not entered for O&M FY2025, /.test(n)));
    // the overridden budget's service, switched off: its rows leave every figure
    const X2 = oracle(['--files', join(tmp.dir, 'pull-all.xlsx'), '--asof', '2026-10', '--first', '2025', '--settings', sfile, '--svc-off', 'USAF ANG', '--lanes', 'mand'], 'settings-off');
    const M2 = SP.buildModel(store1.current, s, viewFor(['USAF ANG'], ['mand']));
    compare('settings, ANG off, mandatory only', M2, X2);
    invariants('settings, ANG off, mandatory only', M2);
  }

  // ============================================================================================ the layout check (§12)
  {
    const lay = await importFiles(['pull-om.xlsx', 'pull-ff.csv', 'pull-sp-opn.xlsx']);
    const st = { current: {}, previous: {} };
    apply(st, lay);
    const ML = SP.buildModel(st.current, settingsFor('2026-10', 2025), SP.defaultView());
    const MA = models.all;
    const a = JSON.stringify(ML), b = JSON.stringify(MA);
    let at = 0;
    while (at < a.length && a[at] === b[at]) at++;
    C.chk('layout: pull-om.xlsx + pull-ff.csv + pull-sp-opn.xlsx give exactly the model pull-all.xlsx gives', a === b,
      'they part at character ' + at + ': …' + a.slice(Math.max(0, at - 80), at + 80) + '… vs …' + b.slice(Math.max(0, at - 80), at + 80) + '…');
    compare('layout', ML, oracle(['--scenario', 'layout', '--fixture', tmp.dir], 'layout'));
  }

  // ============================================================================================ what the oracle does not hold
  {
    const M = models.all;
    // §5 the one-line-per-month text
    const b = M.blocks.find(x => x.na.length > 3 && new Set(x.na.map(i => i.col)).size > 2);
    const L = SP.naLines(b.na, M.cols);
    const want = [];
    for (const c of M.cols) {
      const its = b.na.filter(i => i.col === c.id);
      if (!its.length) continue;
      want.push([c.id, c.label + ':', its.map(i => i.label + ' ($' + SP.fmtM(i.cents) + 'M)' + (i.status === 'na' ? '' : i.status === 'unprog' ? ' [Unprogrammed]'
        : i.status === 'fcst' ? ' [Forecast]' : ' [' + i.statusLabel + ']')).join('; ')]);
    }
    same('naLines: one line per column with items, in column order, every item, tagged', L.map(l => [l.col, l.label, l.text]), want);
    const allLines = M.blocks.flatMap(x => SP.naLines(x.na, M.cols));
    C.chk('naLines: an Unprogrammed item is tagged', allLines.some(l => l.text.includes(' [Unprogrammed]')));
    C.chk('naLines: a Forecast item is tagged', allLines.some(l => l.text.includes(' [Forecast]')));
    C.chk('naLines: an item with another status carries its Alloc text', M.naAll.some(i => i.status === 'other') && allLines.some(l => /\[(?!Unprogrammed|Forecast)[^\]]+\]/.test(l.text)));
    C.chk('naLines: Prior Yr, FY28+ and No date lines appear', ['Prior Yr:', 'FY28+:', 'No date:'].every(lab => allLines.some(l => l.label === lab)));
    C.chk('naLines: an amount under $5,000 reads <0.01, never 0.00', allLines.every(l => !/\(\$0\.00M\)/.test(l.text)));
    // §5 an item's distinct CCaRs, PMOs and titles
    C.chk('Not Allocated items carry their CCaRs, PMOs and titles', M.naAll.every(i => i.ccars.length >= 1 && i.pmos.length >= 1 && i.titles.length >= 1));
    C.chk('a special CCaR item is labelled by its title', M.naAll.filter(i => i.key.startsWith('CC:')).every(i => i.titles.includes(i.label) || i.label === '(no title)')
      && M.naAll.some(i => i.key.startsWith('CC:')));
    // every PMO gets a list (v12 gave one to PSM only)
    const withNa = M.pmos.filter(p => p.blocks.some(pb => pb.na.length));
    C.chk('every PMO with non-executed money has its own Not Allocated list', withNa.length >= 6, withNa.length + ' PMOs have lists');
    // §4.6 the PMO rows of pmos[] are its blocks' figures, and the total is their sum
    C.chk('pmos[].rows are its blocks', M.pmos.every(p => p.rows.length === p.blocks.length && p.rows.every((r, i) => r.key === p.blocks[i].key && r.approved === p.blocks[i].approved && r.authorized === r.approved)));
    C.chk('pmos[].total adds its rows', M.pmos.every(p => p.total.approved === p.rows.reduce((x, r) => x + r.approved, 0) && p.total.authorized === p.total.approved));
    // the Summary notes (§4.6), each only when it is not zero
    const N = M.summary.notes.join('\n');
    C.chk('notes (all): nothing about the switches when everything is shown', !/services shown|lanes shown/i.test(N));
    C.chk('notes (all): Unprogrammed money by block', /Unprogrammed money is counted in Approved: .*\$\d/.test(N));
    C.chk('notes (all): money before FY2025, by FY, with its rows', N.includes('Money before FY2025 is not shown: FY2024 $' + SP.fmtM(M.excluded.beforeFirst.cents) + 'M (' + M.excluded.beforeFirst.rows + ' rows)'));
    C.chk('notes (all): rows whose appropriation was not identified', N.includes(M.excluded.unidentified.rows + ' rows ($' + SP.fmtM(M.excluded.unidentified.cents) + 'M)'));
    C.chk('notes (all): unreadable rows', N.includes(M.excluded.unreadable.rows + ' rows could not be read'));
    C.chk('notes (all): executed rows dated after the as-of month', N.includes(M.execAfterAsOf.rows + ' rows marked Actual Execution ($' + SP.fmtM(M.execAfterAsOf.cents) + 'M)') && N.includes('Oct-2026'));
    C.chk('notes (all): Authorized not entered, for any block', /Authorized was not entered for any block/.test(N));
    C.eq('shown.text, everything on', M.shown.text, 'All services, both lanes');
    C.eq('shown.text, USAF off', models['usaf-off'].shown.text, 'Services shown: USAF ANG, USAF AFRC, USMC B (STOVL), USMC C (USMC CV), USN (USN CV), Service not identified; lanes shown: Discretionary, Mandatory');
    C.eq('shown.text, mandatory only', models['mand-only'].shown.text, 'Services shown: all; lanes shown: Mandatory');
    C.chk('notes (usaf-off): the first note says what is shown', models['usaf-off'].summary.notes[0].startsWith(models['usaf-off'].shown.text));
    C.chk('notes (first-2024): no money before the first FY', !models['first-2024'].summary.notes.some(n => /^Money before/.test(n)));
    // switches never remove a block (§4.6)
    same('the switches remove no block', models['mand-only'].blocks.map(x => x.key), M.blocks.map(x => x.key));
    // present: what the pulls hold, whatever the switches, for the filter bar's seventh box
    C.chk('present lists the unknown service when a row carries it', models['usaf-off'].present.services.includes('Service not identified') === M.present.services.includes('Service not identified'));
    // the model is plain data: it survives JSON whole (the store and the export may serialise it)
    C.chk('the model is plain data', JSON.stringify(JSON.parse(JSON.stringify(M))) === JSON.stringify(M));
    // building twice gives the same model (no state kept between builds)
    C.chk('buildModel is repeatable', JSON.stringify(SP.buildModel(store1.current, settingsFor('2026-10', 2025), SP.defaultView())) === JSON.stringify(M));

    // review S2: the switches are this browser's, so "Service not identified" turned off on a plan that has such rows
    // stays off on a plan that has none. There it has no box (§9) and hides nothing, so nothing may say "filtered", and
    // a list of what is shown never names it. The plan here is the fixture with every name no rule knows given a service.
    const sN = settingsFor('2026-10', 2025);
    for (const b of SP.budgetTable(store1.current, sN)) if (b.unknown) sN.budgets[b.key] = { svc: 'USAF' };
    const known = SP.buildModel(store1.current, sN, SP.defaultView());
    C.chk('S2: the plan with every budget given a service has no row without one', !known.present.services.includes('Service not identified')
      && Object.keys(sN.budgets).length > 0, JSON.stringify(known.present.services));
    const hid = SP.buildModel(store1.current, sN, viewFor(['Service not identified']));
    same('S2: the unknown switch off where no row needs it: everything is shown, in words', [hid.shown.all, hid.shown.text, hid.shown.services],
      [true, 'All services, both lanes', SERVICES.slice(0, 6)]);
    C.chk('S2: and no note says the figures are filtered', !hid.summary.notes.some(n => /services shown/i.test(n)), hid.summary.notes.join(' / '));
    C.chk('S2: and every figure is the all-on plan\'s', JSON.stringify(hid.blocks) === JSON.stringify(known.blocks));
    C.eq('S2: USAF off there: the list names only services with a switch', SP.buildModel(store1.current, sN, viewFor(['USAF'])).shown.text,
      'Services shown: USAF ANG, USAF AFRC, USMC B (STOVL), USMC C (USMC CV), USN (USN CV); lanes shown: Discretionary, Mandatory');
    C.eq('S2: every service with a switch off there: none shown, not the one with no switch', SP.buildModel(store1.current, sN, viewFor(SERVICES.slice(0, 6))).shown.text,
      'Services shown: none; lanes shown: Discretionary, Mandatory');
    const stillOff = SP.buildModel(store1.current, settingsFor('2026-10', 2025), viewFor(['Service not identified']));
    C.chk('S2: where such rows exist the same switch still filters, and says so', !stillOff.shown.all
      && stillOff.shown.text === 'Services shown: USAF, USAF ANG, USAF AFRC, USMC B (STOVL), USMC C (USMC CV), USN (USN CV); lanes shown: Discretionary, Mandatory'
      && stillOff.summary.total.approved < M.summary.total.approved, stillOff.shown.text);
  }

  // ============================================================================================ §14 with no BAE report
  // With no BAE report loaded nothing in §1–§13 changes (CONTRACT §14, §14.3): buildModel's fourth argument absent, null,
  // or anything that is not a report gives the same model to the character; no field §14 adds is on it; and every word
  // the products read from the engine is §8's. (engine-bae.test.mjs holds the model WITH a report.)
  {
    const NO14 = ['planned', 'approvedSrc', 'covered', 'authorizedSrc', 'slide', 'planShort', 'marks', 'reportAuthorized', 'basis', 'sect'];
    const has14 = o => NO14.filter(k => o && typeof o === 'object' && k in o);
    for (const sc of SCEN) {
      const M = models[sc.name], J0 = JSON.stringify(M);
      const s = settingsFor(sc.asOf, sc.first), v = viewFor(sc.svcOff, sc.lanes);
      const notReports = [null, undefined, { rows: 'not a list' }, [], 'a report', 0];
      C.chk(sc.name + ': a fourth argument that is no report gives the no-report model, character for character',
        notReports.every(x => JSON.stringify(SP.buildModel(sc.store.current, s, v, x)) === J0));
      const extra = [...M.blocks.map(has14), ...M.pmos.flatMap(p => p.blocks.map(has14).concat(p.rows.map(has14), [has14(p.total)])),
        ...M.aps.map(a => has14(a.total)), has14(M.summary.total)].flat();
      C.chk(sc.name + ': no field §14 adds is on the model', !('bae' in M) && extra.length === 0, JSON.stringify([...new Set(extra)]));
    }
    const M = models.all;
    C.eq('§14: line 2 with no report is §8.1’s', SP.summaryLine2(M), 'Data through Oct-2026 | Approved = total planned ($M from the CCaR pull) | Authorized = entered, else Approved'
      + ' | Obligated = CCaR status "Actual Execution" | Unobligated = Approved - Obligated | Delta = Obl% - OSD%');
    C.eq('§14: the marks’ words with no report are §8’s', [SP.markText('†', M), SP.markText('‡', M), SP.AUTH_MARK_TEXT['†']],
      ['Authorized was not entered; Approved is shown in its place (on a total, for the rows marked †).',
        'Authorized as entered, for the appropriation and FY as a whole: it covers every service and lane, while the switches show only some.',
        'Authorized was not entered; Approved is shown in its place (on a total, for the rows marked †).']);
    C.chk('§14: no block, PMO row or total carries § with no report', M.blocks.every(b => SP.approvedMark(b, M) === '')
      && M.pmos.every(p => p.rows.every(r => SP.approvedMark(r, M) === '')) && SP.authMarks(M.summary.rows, M).sect === false);
    C.chk('§14: the Obligation % label reads “Approved” and the block’s Approved', M.blocks.every(b => SP.oblLabel(b, M).startsWith('Obligation %  (Approved ' + SP.fmtMText(b.approved) + 'M; ')));
    C.chk('§14: the slide and the plan are the block’s own figures', M.blocks.every(b => SP.plannedOf(b) === b.approved
      && JSON.stringify(SP.slideOf(b)) === JSON.stringify({ basis: b.approved, oblPct: b.oblPct, goal: b.goal, delta: b.delta, status: b.status })));
    C.chk('§14: no PMO tab lines', M.pmos.every(p => SP.pmoTabNotes(p, M).length === 0));
    // the lines under a PMO tab's table (one source for the screen and the workbook, integration): §8.6's note alone
    C.chk('§14: under every PMO tab, §8.6’s one note, word for word', M.pmos.every(p => JSON.stringify(SP.pmoTabLines(p, M))
      === JSON.stringify(['Authorized is entered by appropriation and FY; a PMO row shows Approved.'])));
    C.chk('§14: no note speaks of a report', !M.summary.notes.some(n => /BAE|CCaR plan|§/.test(n)));
  }

  // ============================================================================================ hand-built rows
  // The few cases the fixture does not reach, on stored rows written here (the shape §3 stores), every value invented.
  {
    let n = 0;
    const row = (o) => {
      const c = new Array(32).fill('');
      c[0] = o.fy ?? 2027; c[2] = o.ccar ?? 'CC-' + (++n); c[3] = o.title ?? 'A title'; c[4] = o.budget ?? 'USAF O&M Discretionary';
      c[7] = o.pe ?? 'A plan event'; c[8] = o.date ?? '2026-11-15'; c[9] = o.cents ?? 100; c[10] = o.alloc ?? 'Not Allocated';
      c[18] = o.pmo ?? 'Air Vehicle (AV)';
      return { c, x: {}, src: [0, 'O&M Raw Data', ++n] };
    };
    // 70 Not Allocated items in one month: v12 stopped at 60 (12 on PMO PSM); the tool lists them all
    const rows = [];
    for (let i = 0; i < 70; i++) rows.push(row({ pe: 'Plan event ' + String(i).padStart(2, '0'), cents: 1000000 + i, pmo: 'Product Support Management (PSM)' }));
    // labels: the spelling most rows use; a tie goes to the first spelling met
    rows.push(row({ title: 'Mixed Case', pe: 'Tie PE', alloc: 'Actual Execution', cents: 5 }), row({ title: 'MIXED  case', pe: 'tie pe', alloc: 'Actual Execution', cents: 7 }));
    rows.push(row({ title: 'Many', pe: 'M', alloc: 'Actual Execution' }), row({ title: 'MANY', pe: 'M', alloc: 'Actual Execution' }), row({ title: 'MANY', pe: 'M', alloc: 'Actual Execution' }));
    // PMOs: one not in the list, one blank, one listed late; and a $0 item made of +x and -x
    rows.push(row({ pmo: 'Zeta Office', alloc: 'Actual Execution' }), row({ pmo: 'Alpha Office', alloc: 'Actual Execution' }), row({ pmo: '', alloc: 'Actual Execution' }),
      row({ pmo: 'Training Systems (TSS)', alloc: 'Actual Execution' }));
    rows.push(row({ pe: 'Nets to zero', cents: 500 }), row({ pe: 'NETS TO ZERO', cents: -500 }));
    // a block whose rows add to $0: every ratio is null, never NaN or Infinity
    rows.push(row({ fy: 2026, cents: 300, alloc: 'Actual Execution' }), row({ fy: 2026, cents: -300 }));
    const M = SP.buildModel({ om: { rows } }, settingsFor('2026-10', 2025), SP.defaultView());
    const b = M.blocks.find(x => x.key === 'om|2027');
    const nov = SP.naLines(b.na, M.cols).find(l => l.col === 'm2');
    C.chk('naLines: no cap: 70 items in one month, all listed', nov && nov.items.length === 70 && nov.text.split('; ').length === 70, nov && nov.items.length);
    const psm = M.pmos.find(p => p.code === 'PSM');
    C.chk('naLines: no cap on a PMO’s list either (v12: 12 on PSM)', psm && SP.naLines(psm.blocks[0].na, M.cols).find(l => l.col === 'm2').items.length === 70);
    const titles = SP.treeRows(b.tree, 2).filter(x => x.level === 2).map(x => x.label);
    C.chk('labels: a 1–1 tie goes to the spelling met first', titles.includes('Mixed Case') && !titles.includes('MIXED  case'), titles.join(' / '));
    C.chk('labels: the spelling most rows use wins (MANY twice, Many once)', titles.includes('MANY') && !titles.includes('Many'), titles.join(' / '));
    same('PMO order: the list first, others by label, (no PMO) last', b.tree.map(p => p.label),
      ['Air Vehicle (AV)', 'Product Support Management (PSM)', 'Training Systems (TSS)', 'Alpha Office', 'Zeta Office', '(no PMO)']);
    same('PMO codes: the parenthesised text, else the first 12 characters', M.pmos.map(p => p.code), ['AV', 'PSM', 'TSS', 'Alpha Office', 'Zeta Office', 'no PMO']);
    C.chk('a $0 Not Allocated item is hidden (+x and -x of one plan event)', !b.na.some(i => i.key === 'PE:nets to zero'));
    const z = M.blocks.find(x => x.key === 'om|2026');
    C.chk('a block adding to $0 has null ratios and statuses, never NaN', z.approved === 0 && z.oblPct === null && z.delta === null && z.status === null
      && z.obl.every(o => o.v === null) && z.statusC.every(s => s.status === null));
    C.chk('treeRows to level 1 gives only the PMO rows', SP.treeRows(b.tree, 1).every(x => x.level === 1) && SP.treeRows(b.tree, 1).length === b.tree.length);
    C.chk('treeRows to level 4 visits every node, parents before children', SP.treeRows(b.tree).length === b.tree.reduce(function cnt(s, x) { return s + 1 + x.children.reduce(cnt, 0); }, 0));
    // values out of a saved file that are not what they should be: read as absent, never thrown on
    const s = settingsFor('2026-10', 2025);
    s.authorized = { 'om|2027': '12', 'om|2026': 1.5 }; s.goals = { om1: [0, 'x'], om2: GOALS.om2.map((v, i) => (i === 1 ? 'bad' : v)) };
    const M2 = SP.buildModel({ om: { rows } }, s, SP.defaultView());
    C.chk('Authorized that is not whole cents is not entered', M2.blocks.every(x => !x.authorizedEntered && x.authorized === x.approved));
    C.chk('a curve that is not 13 values falls back to v12’s', M2.blocks.find(x => x.key === 'om|2027').goal === GOALS.om1[1]);
    C.chk('a goal cell that is not a number has no goal, so no status', M2.blocks.find(x => x.key === 'om|2026').goalC[1] === null);
  }

  // ============================================================================================ diffPulls beyond the oracle
  {
    const D = SP.diffPulls(store2.previous, store2.current, settingsFor('2026-10', 2025));
    same('diffPulls covers only appropriations in both pulls', Object.keys(D), ['om', 'ff']);
    for (const [ap, d] of Object.entries(D)) {
      // every line whose readable dollars moved is in one of the four lists, so their changes add to Approved's
      const leaves = [...d.leaves.new, ...d.leaves.gone, ...d.leaves.changed, ...(d.leaves.unread || [])];
      const net = leaves.reduce((x, l) => x + l.change, 0);
      C.chk('diff ' + ap + ': the leaf changes add to the change in Approved', net === d.totals.approved[1] - d.totals.approved[0], net + ' vs ' + (d.totals.approved[1] - d.totals.approved[0]));
      C.chk('diff ' + ap + ': leaf keys are ap|fy|pmo|title|pe|ccar in normKeys', leaves.every(l => l.key === l.parts.join('|') && l.parts.length === 6 && l.parts[0] === ap));
      for (const k of ['new', 'gone', 'changed', 'unread']) {
        const l = d.leaves[k] || [];
        // the size of a line's change is the largest of its amount, its obligated dollars and its dollars moved between
        // months (review BP-2), restated here from the contract, never read from the tool's own `size`
        const size = x => Math.max(Math.abs(x.change), Math.abs((x.obligated || [0, 0])[1] - (x.obligated || [0, 0])[0]), (x.moved || { cents: 0 }).cents);
        C.chk('diff ' + ap + ': ' + k + ' leaves are largest change first', l.every((x, i) => i === 0 || size(l[i - 1]) >= size(x)));
      }
      C.chk('diff ' + ap + ': new leaves start at 0 and gone ones end at 0', d.leaves.new.every(l => l.before === 0) && d.leaves.gone.every(l => l.after === 0));
      C.chk('diff ' + ap + ': the totals are the blocks added', d.totals.approved[1] === Object.values(d.byBlock).reduce((x, v) => x + v.approved[1], 0));
    }
    const ch = manifest.gen2Changes;
    C.chk('diff: the new CCaR carries its label and dollars', D[ch.newCcarAp] && D[ch.newCcarAp].ccarsNew.some(c => c.key === normKey(ch.newCcar) && c.cents !== 0 && c.label.length > 0));
    C.chk('diff: the plan event gone shows as gone leaves', D[ch.gonePeAp] && D[ch.gonePeAp].leaves.gone.some(l => l.parts[4] === normKey(ch.gonePe)));
    C.chk('diff: no previous pull, no report', Object.keys(SP.diffPulls({}, store2.current, settingsFor('2026-10', 2025))).length === 0);
  }

  // ============================================================================================ diffPulls: rows that do not
  // read, money obligated or moved to another month (second review M1, BP-2, BP-6), on hand-built O&M rows
  {
    let n = 0;
    const row = (o) => {
      const c = new Array(32).fill('');
      c[0] = o.fy === undefined ? 2026 : o.fy; c[2] = o.ccar; c[3] = o.title || 'A title'; c[4] = 'USAF O&M Discretionary';
      c[7] = o.pe || 'A plan event'; c[8] = o.date || '2026-06-15'; c[9] = o.cents === undefined ? 100 : o.cents; c[10] = o.alloc || 'Not Allocated';
      c[18] = o.pmo || 'Air Vehicle (AV)';
      const r = { c, x: {}, src: [0, 'O&M Raw Data', ++n] };
      if (o.bad) r.bad = [o.bad];
      return r;
    };
    const S = settingsFor('2026-10', 2025);
    const J = x => JSON.stringify(x);
    const diffOf = (r0, r1) => SP.diffPulls({ om: { rows: r0, importedAt: '2026-11-02T12:00:00.000Z' } }, { om: { rows: r1, importedAt: '2026-11-09T12:00:00.000Z' } }, S).om;
    const leafOf = (d, list, ccar) => (d.leaves[list] || []).find(l => l.parts[5] === normKey(ccar));
    // M1: B200's one row reads in the first pull; in the second its Amount does not (it is still in the pull)
    const keep = row({ ccar: 'D400', cents: 9000 });
    const g1 = [keep, row({ ccar: 'B200', pe: 'PE B', cents: 500000000 })];
    const g2 = [keep, row({ ccar: 'B200', pe: 'PE B', cents: null, bad: 'Amount “5,000,000 USD” is not an amount' })];
    const m1 = diffOf(g1, g2);
    C.chk('M1: a CCaR whose row no longer reads is not “gone from this pull”', !m1.ccarsGone.some(c => c.key === 'b200'), JSON.stringify(m1.ccarsGone));
    C.chk('M1: nor is its line gone', !leafOf(m1, 'gone', 'B200'), JSON.stringify(m1.leaves.gone));
    const u1 = leafOf(m1, 'unread', 'B200');
    C.chk('M1: its line is listed apart: 5.00 it could read before, nothing it can read now, one row it could not read',
      !!u1 && u1.before === 500000000 && u1.after === 0 && J(u1.unread) === '[0,1]' && J(u1.what).includes('unread'), JSON.stringify(u1));
    same('M1: rows that could not be read, counted on each side', m1.unread, [0, 1]);
    C.chk('M1: Approved after counts only what reads, as every figure does', m1.totals.approved[1] === 9000 && m1.totals.approved[0] === 500009000, JSON.stringify(m1.totals));
    const m1r = diffOf(g2, g1);
    C.chk('M1: the other way round, a CCaR whose row now reads is not “new in this pull”', !m1r.ccarsNew.some(c => c.key === 'b200') && !leafOf(m1r, 'new', 'B200')
      && !!leafOf(m1r, 'unread', 'B200'), JSON.stringify(m1r.ccarsNew) + JSON.stringify(m1r.leaves.new));
    // a CCaR truly gone is still gone, and one truly new still new, whether or not any of its rows read
    const m1g = diffOf(g1, [keep]);
    C.chk('M1 (control): a CCaR in no row of the new pull is gone', m1g.ccarsGone.some(c => c.key === 'b200') && !!leafOf(m1g, 'gone', 'B200'));
    const m1n = diffOf([keep], g2);
    C.chk('M1: a CCaR in no row of the earlier pull is new, even when its one row does not read',
      m1n.ccarsNew.some(c => c.key === 'b200' && c.cents === 0 && c.unread === 1), JSON.stringify(m1n.ccarsNew));
    // a row whose FY does not read has no line, but its CCaR is still in the pull
    const m1f = diffOf(g1, [keep, row({ ccar: 'B200', pe: 'PE B', fy: null, cents: 500000000, bad: 'FY “FY2O26” is not a year' })]);
    C.chk('M1: a CCaR whose only row has an FY that does not read is not gone either', !m1f.ccarsGone.some(c => c.key === 'b200') && m1f.unread[1] === 1,
      JSON.stringify(m1f.ccarsGone));

    // BP-2: no amount changed; A100's row became Actual Execution and C300's moved from Jun-2026 to Sep-2026
    const h1 = [keep, row({ ccar: 'A100', pe: 'PE A', cents: 234000000 }), row({ ccar: 'C300', pe: 'PE C', cents: 187654321, date: '2026-06-28' })];
    const h2 = [keep, row({ ccar: 'A100', pe: 'PE A', cents: 234000000, alloc: 'Actual Execution is allocated to a Plan Event' }),
      row({ ccar: 'C300', pe: 'PE C', cents: 187654321, date: '2026-09-28' })];
    const bp = diffOf(h1, h2);
    const ob = leafOf(bp, 'changed', 'A100'), sl = leafOf(bp, 'changed', 'C300');
    C.chk('BP-2: a line whose money became obligated is a changed line, and says so', !!ob && ob.change === 0 && J(ob.obligated) === '[0,234000000]'
      && JSON.stringify(ob.what) === '["obligated"]', JSON.stringify(ob));
    C.chk('BP-2: a line whose money moved from Jun to Sep is a changed line, and says from where to where', !!sl && sl.change === 0 && J(sl.moved) === J({ cents: 187654321,
      from: [{ ym: '2026-06', cents: 187654321 }], to: [{ ym: '2026-09', cents: 187654321 }] }) && JSON.stringify(sl.what) === '["dates"]', JSON.stringify(sl));
    same('BP-2: largest first by what moved: the obligated line (2.34) before the slipped one (1.88)', bp.leaves.changed.map(l => l.parts[5]), ['a100', 'c300']);
    C.chk('BP-2 (control): the line nothing happened to is listed nowhere', ![...bp.leaves.changed, ...bp.leaves.new, ...bp.leaves.gone].some(l => l.parts[5] === 'd400'));
    // an amount that grows in one month is a change of amount, not a move
    const gr = diffOf(h1, [keep, h1[1], row({ ccar: 'C300', pe: 'PE C', cents: 187654321 + 500, date: '2026-06-28' })]);
    const g = leafOf(gr, 'changed', 'C300');
    C.chk('BP-2: more money in the same month is an amount change, and no month is said to have moved', !!g && g.change === 500 && J(g.moved) === J({ cents: 0, from: [], to: [] })
      && JSON.stringify(g.what) === '["amount"]', JSON.stringify(g));

    // BP-6: a line is every row of one FY, PMO, Title, Plan Event and CCaR added together: one of its two rows removed
    // changes the line; it is not a line gone
    const two = [keep, row({ ccar: 'E500', pe: 'PE E', cents: 300 }), row({ ccar: 'E500', pe: 'PE E', cents: 700 })];
    const b6 = diffOf(two, [keep, two[1]]);
    C.chk('BP-6: a row taken from a line that remains changes the line (one changed line, none gone)', b6.leaves.changed.length === 1 && b6.leaves.gone.length === 0
      && b6.leaves.changed[0].before === 1000 && b6.leaves.changed[0].after === 300, JSON.stringify(b6.leaves));

    // M3: a CCaR's PMO is the one most of its rows carry, and where PMOs carry as many rows it is the first of them in
    // the PMO order (§4.4: SP.PMO_ORDER, then any other PMO by its normalised name, (no PMO) last), never the PMO of
    // whichever row the pull happens to list first. Decided by row order, A100 (one AV row and one PSM row, the same in
    // both pulls, only listed the other way round) was said to have moved from AV to PSM (second review M3).
    // The expected PMOs are restated from that rule here, never read back from the tool.
    const AVP = 'Air Vehicle (AV)', PSMP = 'Product Support Management (PSM)', ZC = 'Zeta Cell (ZC)', AC = 'Alpha Cell (AC)', NOP = '(no PMO)';
    const pmoOfNew = rows => { const c = diffOf([keep], [keep].concat(rows)).ccarsNew; return c.length === 1 ? c[0].pmo : J(c); };
    const a1 = row({ ccar: 'A100', pe: 'PE A1', cents: 100000, pmo: AVP }), a2 = row({ ccar: 'A100', pe: 'PE A2', cents: 200000, pmo: PSMP });
    const m3 = diffOf([keep, a1, a2], [keep, a2, a1]);
    same('M3: the same two rows listed the other way round move no CCaR to another PMO', m3.pmoMoves, []);
    C.chk('M3: (and nothing else is said to have changed)', !m3.ccarsNew.length && !m3.ccarsGone.length && !m3.leaves.changed.length
      && !m3.leaves.new.length && !m3.leaves.gone.length, J(m3.leaves));
    same('M3: a CCaR with one AV row and one PSM row is AV’s, in either order (AV comes first in the PMO order)', [pmoOfNew([a1, a2]), pmoOfNew([a2, a1])], [AVP, AVP]);
    // every order of four rows under four PMOs, one row each: on the list first, then other PMOs by name, (no PMO) last
    const perms = xs => xs.length < 2 ? [xs] : xs.flatMap((x, i) => perms(xs.slice(0, i).concat(xs.slice(i + 1))).map(p => [x].concat(p)));
    // a stored row's text is trimmed at import (§3), so a row with no PMO holds '' (row() would put AV in its place)
    const tie = [PSMP, ZC, NOP, AC].map((p, i) => { const r = row({ ccar: 'P600', pe: 'PE P' + i, cents: 1000 * (i + 1), pmo: p }); if (p === NOP) r.c[18] = ''; return r; });
    for (const [rows, want, what] of [[tie, PSMP, 'PSM (on the list) before two PMOs that are not and (no PMO)'],
      [tie.slice(1), AC, 'Alpha Cell before Zeta Cell (by name) and (no PMO)'], [tie.slice(1, 3), ZC, 'Zeta Cell before (no PMO)']]) {
      const ps = perms(rows);
      const got = [...new Set(ps.map(pmoOfNew))];
      same('M3: a tie between ' + rows.length + ' PMOs gives ' + what + ', in all ' + ps.length + ' orders of its rows', got, [want]);
      const moves = ps.flatMap(p => ps.map(q => diffOf([keep].concat(p), [keep].concat(q)).pmoMoves.length)).reduce((s, x) => s + x, 0);
      C.chk('M3: no pair of those orders says the CCaR moved (' + ps.length * ps.length + ' pairs)', moves === 0, moves + ' moves');
    }
    // where none of a CCaR's rows reads, its PMO is read from those rows (M1), by the same rule
    const ub = (pmo, i) => row({ ccar: 'U700', pe: 'PE U' + i, cents: null, pmo, bad: 'Amount “x” is not an amount' });
    same('M3: a tied CCaR none of whose rows reads moves nowhere when its rows swap', diffOf([keep, ub(PSMP, 1), ub(AVP, 2)], [keep, ub(AVP, 2), ub(PSMP, 1)]).pmoMoves, []);
    // controls: the tie rule decides only a tie
    same('M3 (control): most rows still decide: two PSM rows and one AV row are PSM’s, in any order',
      [...new Set(perms([a1, a2, row({ ccar: 'A100', pe: 'PE A3', cents: 5, pmo: PSMP })]).map(pmoOfNew))], [PSMP]);
    same('M3 (control): a CCaR whose one row moved from AV to PSM is still said to have moved',
      diffOf([keep, row({ ccar: 'C300', pe: 'PE C', cents: 7000, pmo: AVP })], [keep, row({ ccar: 'C300', pe: 'PE C', cents: 7000, pmo: PSMP })]).pmoMoves
        .map(m => [m.key, m.from, m.to]), [['c300', AVP, PSMP]]);
    same('M3 (control): a PSM row added to that tie makes PSM carry most rows, and that is said',
      diffOf([keep, a1, a2], [keep, a2, a1, row({ ccar: 'A100', pe: 'PE A2', cents: 1, pmo: PSMP })]).pmoMoves.map(m => [m.key, m.from, m.to]), [['a100', AVP, PSMP]]);
    // the oracle states the rule on its own (fixture/oracle.py diff_pulls), and the fixture holds no tied CCaR: so both
    // read two CSV pulls, through each side's own import, whose tied CCaRs list their rows in another order and one of
    // whose CCaRs wholly moved. Each must report the real move and nothing else.
    const H = SP.RAW_HEADERS;
    const q = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const rec = (ccar, pe, pmo, amt) => { const o = { FY: 2026, 'CCaR No': ccar, Title: 'A title', Budget: 'USAF O&M Discretionary', 'Plan Event': pe,
      Date: '2026-06-15', Amount: amt, Alloc: 'Not Allocated', PMO: pmo }; return H.map(h => q(o[h])).join(','); };
    const p1 = [rec('A100', 'PE A1', AVP, 1000), rec('A100', 'PE A2', PSMP, 2000), rec('P600', 'PE P0', PSMP, 1), rec('P600', 'PE P1', ZC, 2),
      rec('P600', 'PE P2', '', 3), rec('P600', 'PE P3', AC, 4), rec('Q800', 'PE Q0', '', 5), rec('Q800', 'PE Q1', ZC, 6), rec('C300', 'PE C', AVP, 7000)];
    const p2 = [p1[1], p1[0], p1[5], p1[4], p1[3], p1[2], p1[7], p1[6], rec('C300', 'PE C', PSMP, 7000)];
    writeFileSync(join(tmp.dir, 'm3-g1.csv'), [H.join(','), ...p1].join('\n'));
    writeFileSync(join(tmp.dir, 'm3-g2.csv'), [H.join(','), ...p2].join('\n'));
    const XM3 = oracle(['--files', join(tmp.dir, 'm3-g1.csv'), '--then', join(tmp.dir, 'm3-g2.csv'), '--asof', '2026-10', '--first', '2025'], 'm3');
    const [i1, i2] = [await importFiles(['m3-g1.csv']), await importFiles(['m3-g2.csv'])];
    const eM3 = SP.diffPulls({ om: i1.pulls.om }, { om: i2.pulls.om }, S).om.pmoMoves.map(m => [m.key, m.from, m.to]);
    same('M3: the oracle reports the real move alone when tied CCaRs list their rows in another order', XM3.diff && XM3.diff.om && XM3.diff.om.pmoMoves, [['c300', AVP, PSMP]]);
    same('M3: and so does the tool, reading the same two files', eM3, [['c300', AVP, PSMP]]);
  }
} catch (e) {
  C.chk('the engine test ran to the end', false, e && e.stack ? e.stack : String(e));
} finally {
  t.close();
  tmp.rm();
  C.done();
}
