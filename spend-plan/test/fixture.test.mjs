// The fixture and the oracle, checked against each other and against themselves (builder A2).
//
// Every other suite compares the tool to expected.json, so expected.json has to be right on its own. Three kinds of
// check hold it there, and none of them reads a line of spend-plan/src:
//   1. the fixture's MANIFEST (what make_fixture.py meant each row to be: appropriation, FY, cents, date, status,
//      service, lane, stated from its own tables) against what the oracle READ from the files: per block, column,
//      service, lane, status and PMO. A parsing or classification mistake in the oracle shows up here.
//   2. the identities the contract forces: the tree adds up at every level, approved is the sum of the columns, the
//      running sum ends at the dated total, usaf-off = all less the USAF rows, mand-only + disc-only = all, and the
//      same rows in other layouts (pull-om.xlsx + pull-ff.csv + pull-sp-opn.xlsx) give exactly what pull-all.xlsx gives.
//   3. coverage: the fixture really holds every case CONTRACT §12 lists, so a later edit cannot quietly drop one.
// LibreOffice (when present) reads two of the files on its own, so a fixture openpyxl writes wrongly and reads back
// the same wrong way cannot pass for right.
//
//   node spend-plan/test/fixture.test.mjs
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { scratchDir, checks } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const MAKE = join(HERE, 'fixture', 'make_fixture.py');
const ORACLE = join(HERE, 'fixture', 'oracle.py');
const T = checks('fixture + oracle');
// Objects are compared with their keys sorted (the order a dict is written in means nothing); arrays keep their order,
// because the order of a Not Allocated list is part of §5. eq() calls this.chk, so the collector is wrapped.
const canon = v => Array.isArray(v) ? v.map(canon)
  : (v && typeof v === 'object') ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
const chk = (...a) => T.chk(...a), eq = (n, got, want) => T.eq(n, canon(got), canon(want));

// CONTRACT §2, restated here (not imported from the tool) so a change to either side is a disagreement, not an echo
const GOALS = {
  om1: [0, .0833, .1667, .25, .3333, .4167, .5, .5833, .6667, .75, .8333, .9167, 1],
  om2: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  p1: [0, .0667, .1333, .2, .2667, .3333, .4, .4667, .5333, .6, .6667, .7333, .8],
  p2: [.8, .8083, .8167, .825, .8333, .8417, .85, .8583, .8667, .875, .8833, .8917, .9],
  p3: [.9, .9083, .9167, .925, .9333, .9417, .95, .9583, .9667, .975, .9833, .9917, 1],
  p4: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] };
const SERVICES = ['USAF', 'USAF ANG', 'USAF AFRC', 'USMC B (STOVL)', 'USMC C (USMC CV)', 'USN (USN CV)'];
const UNK = 'Service not identified';
const COLS = ['prior', ...Array.from({ length: 12 }, (_, i) => 'm' + (i + 1)), 'next', 'nodate'];
const RUN = COLS.slice(0, -1);
const PROC = { om: false, ff: true, sp: true, opn: true };
const normKey = s => String(s ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
const close = (a, b) => (a === null || b === null) ? a === b : Math.abs(a - b) <= 1e-12;
const sum = a => a.reduce((x, y) => x + y, 0);

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.error) throw r.error;
  return r;
}
function py(args) { return run('python3', ['-I', ...args]); }
function makeFixture(dir, seed) {
  const r = py([MAKE, '--out', dir, ...(seed !== undefined ? ['--seed', String(seed)] : [])]);
  if (r.status !== 0) throw new Error('make_fixture failed: ' + r.stderr);
  return JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
}
function oracle(dir, scenario) {
  const out = join(dir, 'exp', scenario + '.json');
  const r = py([ORACLE, '--scenario', scenario, '--fixture', dir, '--out', out]);
  if (r.status !== 0) { chk('oracle ran: ' + scenario, false, r.stderr.slice(-600)); return null; }
  return JSON.parse(readFileSync(out, 'utf8'));
}

// ------------------------------------------------------------------------------------------------ the window (§4.2)
function windowOf(asOf) {
  const [y, m] = asOf.split('-').map(Number);
  const E = m >= 10 ? y + 1 : y;
  const ws = `${E - 1}-10-01`, we = `${E}-10-01`;
  const asOfIndex = ((m - 10 + 12) % 12) + 1;
  const nx = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const ends = { prior: ws };
  let cy = E - 1, cm = 10;
  for (let k = 1; k <= 12; k++) {
    const [ey, em] = cm === 12 ? [cy + 1, 1] : [cy, cm + 1];
    ends['m' + k] = `${ey}-${String(em).padStart(2, '0')}-01`; cy = ey; cm = em;
  }
  const colOf = d => {
    if (!d) return 'nodate';
    if (d < ws) return 'prior';
    if (d >= we) return 'next';
    const yy = +d.slice(0, 4), mm = +d.slice(5, 7);
    return 'm' + ((yy - (E - 1)) * 12 + (mm - 10) + 1);
  };
  const closed = c => c === 'prior' || (c[0] === 'm' && +c.slice(1) <= asOfIndex);
  return { E, ws, we, asOfIndex, asOfNext: nx, ends, colOf, closed };
}

// ------------------------------------------------- what the MANIFEST says each block holds (the generator's intent)
function fromManifest(rows, { asOf, first, svcOff = [], lanes = ['disc', 'mand'] }) {
  const W = windowOf(asOf);
  const blocks = {}, ex = { beforeFirst: 0, unidentified: 0, unreadableRows: 0 }, byAp = {};
  // §4.3; condition 4 (§15) reads the generator's own `obbba` flag, which only obbba/'s rows carry
  const counted = r => r.ap && !r.bad.length && r.fy >= first && !r.obbba && !svcOff.includes(r.svc) && lanes.includes(r.lane);
  for (const r of rows) {
    byAp[r.ap || 'unidentified'] = (byAp[r.ap || 'unidentified'] || 0) + 1;
    if (r.bad.length) ex.unreadableRows++;
    else if (!r.ap) ex.unidentified += r.cents;
    else if (r.fy < first) ex.beforeFirst += r.cents;
    if (r.ap && r.fy !== null && r.fy >= first && !r.obbba) {          // §15.2: FY2025 OBBBA funding names no block
      const k = r.ap + '|' + r.fy;
      blocks[k] = blocks[k] || { approved: 0, obligated: 0, unprog: 0, after: 0, cols: Object.fromEntries(COLS.map(c => [c, 0])),
        naCols: Object.fromEntries(COLS.map(c => [c, 0])), pmo: {}, svc: {}, lane: {}, status: {}, rows: [] };
    }
    if (!counted(r)) continue;
    const b = blocks[r.ap + '|' + r.fy];
    const c = W.colOf(r.date);
    b.rows.push(r);
    b.approved += r.cents; b.cols[c] += r.cents;
    if (r.status === 'exec') { b.obligated += r.cents; if (r.date && r.date >= W.asOfNext) b.after += r.cents; }
    else b.naCols[c] += r.cents;
    if (r.status === 'unprog') b.unprog += r.cents;
    const pk = normKey(r.pmo);
    b.pmo[pk] = (b.pmo[pk] || 0) + r.cents;
    b.svc[r.svc] = (b.svc[r.svc] || 0) + r.cents;
    b.lane[r.lane] = (b.lane[r.lane] || 0) + r.cents;
    const sg = r.status === 'other' ? 'other:' + r.statusLabel : r.status;
    b.status[sg] = (b.status[sg] || 0) + r.cents;
  }
  return { W, blocks, ex, byAp };
}

function stripZero(o) { return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== 0)); }

// the oracle's figures against the generator's intent, block by block
function againstManifest(tag, exp, man) {
  const W = man.W;
  eq(tag + ': E', exp.E, W.E);
  eq(tag + ': as-of column', exp.asOfIndex, W.asOfIndex);
  eq(tag + ': the blocks', Object.keys(exp.blocks).sort(), Object.keys(man.blocks).sort());
  for (const [k, mb] of Object.entries(man.blocks)) {
    const b = exp.blocks[k];
    if (!b) continue;
    eq(`${tag} ${k}: approved`, b.approved, mb.approved);
    eq(`${tag} ${k}: obligated (status Actual Execution, any date)`, b.obligated, mb.obligated);
    eq(`${tag} ${k}: unprogrammed`, b.unprog, mb.unprog);
    eq(`${tag} ${k}: executed after the as-of month`, b.execAfterAsOf, mb.after);
    eq(`${tag} ${k}: every column`, b.cols, mb.cols);
    const naCols = Object.fromEntries(COLS.map(c => [c, 0]));
    for (const it of b.na) naCols[it[0]] += it[3];
    eq(`${tag} ${k}: Not Allocated items add to the not-executed rows, column by column`, naCols, mb.naCols);
    const pm = {};
    for (const [lbl, p] of Object.entries(b.pmos)) pm[lbl === '(no PMO)' ? '' : normKey(lbl)] = p.total;
    eq(`${tag} ${k}: each PMO's total`, pm, mb.pmo);
    eq(`${tag} ${k}: cents by service (the budget-name rules)`, stripZero(exp.crossChecks.bySvc[k] || {}), stripZero(mb.svc));
    eq(`${tag} ${k}: cents by lane`, stripZero(exp.crossChecks.byLane[k] || {}), stripZero(mb.lane));
    eq(`${tag} ${k}: cents by status`, stripZero(exp.crossChecks.byStatus[k] || {}), stripZero(mb.status));
    // the actual obligation line: exec rows dated before each closed column's end, over approved
    for (const c of COLS) {
      if (c === 'nodate' || !W.closed(c)) continue;
      const ex = sum(mb.rows.filter(r => r.status === 'exec' && r.date && r.date < W.ends[c]).map(r => r.cents));
      const want = mb.approved ? ex / mb.approved : null;
      chk(`${tag} ${k}: actual obligation % in ${c}`, close(b.obl[c][0], want) && b.obl[c][1] === 'actual',
        JSON.stringify(b.obl[c]) + ' want ' + want);
    }
  }
  eq(tag + ': money before the first FY', exp.excluded.beforeFirst, man.ex.beforeFirst);
  eq(tag + ': money whose appropriation is not identified', exp.excluded.unidentified, man.ex.unidentified);
  eq(tag + ': unreadable rows', exp.excluded.unreadableRows, man.ex.unreadableRows);
  eq(tag + ': rows per appropriation', exp.rowsByAp, man.byAp);
}

// --------------------------------------------------------------------- what the contract forces, whatever the data
function curveOf(ap, n) {
  if (n <= 0) return null;
  if (!PROC[ap]) return n === 1 ? 'om1' : 'om2';
  return 'p' + Math.min(n, 4);
}
function statusOf(p, g) {
  if (p === null || g === null) return null;
  if (p >= g - 1e-12) return 'green';
  if (g - p <= 0.10 + 1e-12) return 'yellow';
  return 'red';
}
function structure(tag, exp) {
  const W = windowOf(exp.asOf);
  const tot = { approved: 0, obligated: 0, authorized: 0 }, aps = {};
  const tabSum = {};
  for (const [k, b] of Object.entries(exp.blocks)) {
    const t = `${tag} ${k}`;
    eq(t + ': approved = the sum of the columns', b.approved, sum(COLS.map(c => b.cols[c])));
    let run = 0, runOk = true;
    for (const c of RUN) { run += b.cols[c]; runOk = runOk && b.cum[c] === run; }
    chk(t + ': cum is the running sum', runOk, JSON.stringify(b.cum));
    eq(t + ': cum ends at the dated total', b.cum.next, b.approved - b.cols.nodate);
    eq(t + ': unobligated', b.unobligated, b.approved - b.obligated);
    eq(t + ': authorized = approved (none entered)', [b.authorized, b.authorizedEntered], [b.approved, false]);
    chk(t + ': obl %', close(b.oblPct, b.approved ? b.obligated / b.approved : null), String(b.oblPct));
    const n = W.E - b.fy + 1;
    eq(t + ': year of availability and curve', [b.n, b.curve], [n, curveOf(b.ap, n)]);
    const g = b.curve ? GOALS[b.curve][W.asOfIndex] : null;
    chk(t + ': goal', close(b.goal, g), String(b.goal));
    chk(t + ': delta', close(b.delta, b.oblPct !== null && g !== null ? b.oblPct - g : null), String(b.delta));
    eq(t + ': status', b.status, statusOf(b.oblPct, g));
    // per column: the plan line, the goals and the statuses
    COLS.forEach((c, i) => {
      if (c === 'nodate') { eq(t + ': nodate has no obligation line', [b.obl[c], b.goalC[c], b.statusC[c]], [[null, null], null, [null, null]]); return; }
      const kind = W.closed(c) ? 'actual' : 'plan';
      chk(t + ': kind of ' + c, b.obl[c][1] === kind, JSON.stringify(b.obl[c]));
      if (kind === 'plan') chk(t + ': plan % in ' + c, close(b.obl[c][0], b.approved ? b.cum[c] / b.approved : null), String(b.obl[c][0]));
      const gc = (b.curve && c !== 'next') ? GOALS[b.curve][i] : null;
      chk(t + ': goal in ' + c, close(b.goalC[c], gc), String(b.goalC[c]));
      eq(t + ': status in ' + c, b.statusC[c], [statusOf(b.obl[c][0], gc), kind]);
    });
    // the tree adds up at every level (§4.4 leaf rule)
    for (const c of COLS) eq(t + ': PMO rows add to the block in ' + c, sum(Object.values(b.pmos).map(p => p.cols[c])), b.cols[c]);
    for (const [pl, p] of Object.entries(b.pmos)) {
      eq(t + ': PMO total = its columns: ' + pl, p.total, sum(COLS.map(c => p.cols[c])));
      eq(t + ': titles add to their PMO: ' + pl, sum(Object.entries(b.titles).filter(([key]) => key.startsWith(pl + '|')).map(([, v]) => v)), p.total);
    }
    for (const [tk, tv] of Object.entries(b.titles))
      eq(t + ': plan events add to their title: ' + tk, sum(Object.entries(b.pes).filter(([key]) => key.startsWith(tk + '|')).map(([, v]) => v)), tv);
    for (const [pk, pv] of Object.entries(b.pes))
      eq(t + ': CCaRs add to their plan event: ' + pk, sum(Object.entries(b.ccars).filter(([key]) => key.startsWith(pk + '|')).map(([, v]) => v)), pv);
    // Not Allocated: no $0 item, §5 order, and no two items a comparator could order two ways
    let prev = null, orderOk = true, zero = false;
    const seen = new Set();
    let tie = '';
    for (const it of b.na) {
      if (it[3] === 0) zero = true;
      const key = COLS.indexOf(it[0]);
      if (prev && (prev[0] > key || (prev[0] === key && (prev[1] < it[3] || (prev[1] === it[3] && prev[2] > it[4]))))) orderOk = false;
      prev = [key, it[3], it[4]];
      const s = it[0] + '|' + it[3];
      if (seen.has(s)) tie = s;
      seen.add(s);
      chk(t + ': item key matches its label or CCaR: ' + it[2],
        it[2].startsWith('PE:') ? normKey(it[4] === '(no plan event)' ? '' : it[4]) === it[2].slice(3) : exp.special.includes(it[2].slice(3)), it[4]);
    }
    chk(t + ': no $0 Not Allocated item', !zero);
    chk(t + ': Not Allocated in column, then cents (largest first), then label order', orderOk);
    chk(t + ': no two Not Allocated items share a column and cents (the fixture keeps the label tie-break moot)', !tie, tie);
    for (const f of ['approved', 'obligated', 'authorized']) tot[f] += b[f];
    const a = aps[b.ap] = aps[b.ap] || { approved: 0, obligated: 0 };
    a.approved += b.approved; a.obligated += b.obligated;
  }
  eq(tag + ': summary = the blocks', [exp.summary.approved, exp.summary.obligated, exp.summary.authorized], [tot.approved, tot.obligated, tot.authorized]);
  for (const [ap, a] of Object.entries(aps)) eq(tag + ': appropriation total ' + ap, [exp.aps[ap].approved, exp.aps[ap].obligated], [a.approved, a.obligated]);
  // PMO tabs: one per PMO with counted rows, and its blocks are the PMO rows of the blocks
  const want = {};
  for (const [k, b] of Object.entries(exp.blocks)) for (const [pl, p] of Object.entries(b.pmos)) (want[pl] = want[pl] || {})[k] = p.total;
  const got = {};
  for (const [pl, tb] of Object.entries(exp.pmoTabs)) for (const [k, f] of Object.entries(tb)) (got[pl] = got[pl] || {})[k] = f.approved;
  eq(tag + ': PMO tabs carry each PMO row of each block', got, want);
  for (const [k, b] of Object.entries(exp.blocks)) {
    const ob = sum(Object.values(exp.pmoTabs).map(tb => tb[k] ? tb[k].obligated : 0));
    eq(tag + ' ' + k + ': PMO tabs\' obligated add to the block', ob, b.obligated);
    const naP = Object.fromEntries(COLS.map(c => [c, 0])), naB = Object.fromEntries(COLS.map(c => [c, 0]));
    for (const tb of Object.values(exp.pmoTabs)) for (const it of (tb[k] ? tb[k].na : [])) naP[it[0]] += it[3];
    for (const it of b.na) naB[it[0]] += it[3];
    eq(tag + ' ' + k + ': every PMO\'s Not Allocated list adds to the block\'s', naP, naB);
  }
}

// ------------------------------------------------------------------------------------- a small RFC 4180 reader
function readCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(f); f = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += ch;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows;
}

// ======================================================================================== §14 the BAE report
// Restated from CONTRACT §14.8 and the real report's shape, never imported from the fixture or the tool.
const BAE_HEADERS = ['Budget Name', 'Budget FY Numeric', 'Budget Approved Amount ($M)', 'Budget Authorized Amount ($M)',
  'Budget Service', 'APPN AF', 'APPN SFIS', 'BA SFIS', 'BLI SFIS', 'BPAC', 'BSA SFIS', 'Budget Exec Years', 'Budget Flex 01',
  'Budget Flex 02', 'Budget Flex 03', 'Budget Office', 'DEPT AF', 'DEPT SFIS', 'Limit AF', 'Limit SFIS', 'OBAN', 'PEC',
  'PEC SFIS', 'RCCC', 'Cost Element', 'Project Description', 'Variant', 'Navy PU'];
const BAE_FMT = '$#,##0.000,,_);($#,##0.000,,)';
const AP_ORDER = ['om', 'ff', 'sp', 'opn'];
const blockOrder = (a, b) => AP_ORDER.indexOf(a.split('|')[0]) - AP_ORDER.indexOf(b.split('|')[0]) || +a.split('|')[1] - +b.split('|')[1];
const add = (o, k, f, v) => { const t = o[k] = o[k] || { approved: 0, authorized: 0, obligated: 0 }; t[f] += v; return t; };

// What §14.2–14.5 make of the generator's own record of a pull and a report, for given settings: the manifest-side
// answer the oracle's reading of the FILES is held to. The pull side reuses fromManifest; budgets' PMOs are the
// generator's hand-stated ones (manifest.bae.budgetPmo and each report row's pmo), never the rule run on the name.
function baeExpect(pull, bae, budgetPmo, o) {
  const { first, svcOff = [], lanes = ['disc', 'mand'], auth = {} } = o;
  const P = fromManifest(pull, o);
  const E = P.W.E;
  const data = bae.filter(r => r.kind === 'data');
  const good = data.filter(r => !r.bad.length);
  const shown = r => !svcOff.includes(r.svc) && lanes.includes(r.lane);
  const counting = r => !r.bad.length && r.scope === 'in' && r.fy >= first && shown(r);
  const covered = new Set(good.filter(r => r.scope === 'in').map(r => r.ap + '|' + r.fy));
  // review M4-6: a covered block's counted pull money on a budget the report's Approved can never hold (no Budget; the
  // word Flyaway; a name the §3 Budget rule places nowhere). The rule and the word restated from the contract.
  const apOfName = n => /spares/i.test(n) ? 'sp' : /full\s*fund/i.test(n) ? 'ff' : /\bopn\b/i.test(n) ? 'opn' : /o&m/i.test(n) ? 'om' : null;
  const offKind = b => { const n = String(b ?? '').trim(); return n === '' ? 'blank' : /\bflyaway\b/i.test(n) ? 'flyaway' : apOfName(n) ? null : 'noap'; };
  const blocks = {};
  for (const [k, pb] of Object.entries(P.blocks)) {
    const cov = covered.has(k);
    const rep = data.filter(r => counting(r) && r.ap + '|' + r.fy === k);
    const planned = pb.approved;
    const approved = cov ? sum(rep.map(r => r.approved)) : planned;
    const entered = k in auth;
    const authorized = entered ? auth[k] : cov ? sum(rep.map(r => r.authorized)) : approved;
    const tabs = {};
    for (const r of pb.rows) add(tabs, r.pmo || '(no PMO)', 'approved', 0);           // every PMO with a pull row
    let off = null;
    if (cov) {
      for (const r of rep) { add(tabs, r.pmo, 'approved', r.approved); add(tabs, r.pmo, 'authorized', r.authorized); }
      for (const r of pb.rows) if (r.status === 'exec') {
        const t = add(tabs, budgetPmo[r.budget], 'obligated', r.cents);
        if (offKind(r.budget)) t.offObligated = (t.offObligated || 0) + r.cents;
      }
      const by = {};
      for (const r of pb.rows) {
        const kind = offKind(r.budget);
        if (!kind) continue;
        const e = by[normKey(r.budget)] = by[normKey(r.budget)] || { key: normKey(r.budget), name: String(r.budget ?? '').trim(), kind, rows: 0, planned: 0, obligated: 0 };
        e.rows++; e.planned += r.cents;
        if (r.status === 'exec') e.obligated += r.cents;
      }
      const bs = Object.values(by).filter(e => e.planned || e.obligated);
      if (bs.length) off = { planned: sum(bs.map(e => e.planned)), obligated: sum(bs.map(e => e.obligated)), budgets: bs };
    } else {
      for (const r of pb.rows) {
        add(tabs, r.pmo || '(no PMO)', 'approved', r.cents); add(tabs, r.pmo || '(no PMO)', 'authorized', r.cents);
        if (r.status === 'exec') add(tabs, r.pmo || '(no PMO)', 'obligated', r.cents);
      }
    }
    blocks[k] = { covered: cov, planned, approved, approvedSrc: cov ? 'report' : 'plan', authorized,
      authorizedSrc: entered ? 'entered' : cov ? 'report' : 'approved', authorizedEntered: entered, obligated: pb.obligated,
      unobligated: approved - pb.obligated, planShort: cov && approved > 0 && 2 * planned < approved, tabs, off };
  }
  const keys = Object.keys(blocks).sort(blockOrder);
  const nb = {};
  for (const r of data) if (counting(r) && r.fy <= E && !(r.ap + '|' + r.fy in blocks)) {
    const t = nb[r.ap + '|' + r.fy] = nb[r.ap + '|' + r.fy] || { approved: 0, authorized: 0, money: false };
    t.approved += r.approved; t.authorized += r.authorized; t.money = t.money || r.approved !== 0 || r.authorized !== 0;
  }
  // §15.3: an (ap, fy) whose pull rows (read or not) are all FY2025 OBBBA funding carries obbba: true, written only then
  const allOb = {};
  for (const r of pull) if (r.ap && r.fy !== null) { const k = r.ap + '|' + r.fy; allOb[k] = (allOb[k] !== false) && !!r.obbba; }
  const reportNames = new Set(data.filter(r => r.name).map(r => normKey(r.name)));
  const pullNames = new Set(pull.map(r => normKey(r.budget)));
  const pullOnly = new Set(Object.values(P.blocks).flatMap(b => b.rows).map(r => normKey(r.budget)).filter(n => !reportNames.has(n)));
  const ins = good.filter(r => r.scope === 'in');
  const reportOnly = new Set(ins.filter(r => r.fy >= first && r.fy <= E && (r.approved || r.authorized) && !pullNames.has(normKey(r.name))).map(r => normKey(r.name)));
  const tot = bae.find(r => r.kind === 'total');
  const diff = tot && { approved: Math.round(tot.approved * 100) - sum(good.map(r => r.approved)),
    authorized: Math.round(tot.authorized * 100) - sum(good.map(r => r.authorized)) };
  const why = r => r.bad.length ? 'Could not be read' : r.scope === 'flyaway' ? 'Flyaway (production)'
    : r.scope === 'noap' ? 'Names no appropriation' : r.fy < first ? 'Before the first FY'
    : r.scope === 'obbba' ? OB_WHY : shown(r) ? 'Yes' : 'Switch off';
  return { P, E, blocks,
    lists: {
      rows: Object.assign({ in: ins.length, flyaway: good.filter(r => r.scope === 'flyaway').length, noap: good.filter(r => r.scope === 'noap').length,
        bad: data.length - good.length }, (pull.some(r => r.obbba) || data.some(r => r.obbba)) ? { obbba: good.filter(r => r.scope === 'obbba').length } : {}),
      skipped: bae.filter(r => r.kind === 'skip').length,
      cents: { approved: sum(ins.map(r => r.approved)), authorized: sum(ins.map(r => r.authorized)) },
      total: diff && { ok: Math.abs(diff.approved) <= 100 && Math.abs(diff.authorized) <= 100, diff },
      uncovered: keys.filter(k => !blocks[k].covered).map(k => ({ ap: k.split('|')[0], fy: +k.split('|')[1] })),
      noBlock: Object.keys(nb).sort(blockOrder).filter(k => nb[k].money).map(k => Object.assign({ ap: k.split('|')[0], fy: +k.split('|')[1],
        approved: nb[k].approved, authorized: nb[k].authorized }, allOb[k] ? { obbba: true } : {})),
      planShort: keys.filter(k => blocks[k].planShort).map(k => ({ ap: k.split('|')[0], fy: +k.split('|')[1],
        planned: blocks[k].planned, approved: blocks[k].approved })),
      pullOnly: [...pullOnly].sort(), reportOnly: [...reportOnly].sort(),
      offReport: keys.filter(k => blocks[k].off).map(k => Object.assign({ ap: k.split('|')[0], fy: +k.split('|')[1] }, blocks[k].off)),
      unreadable: data.filter(r => r.bad.length).map(r => ({ rowNo: r.row, name: r.name || '', bad: r.bad })),
      counted: data.map(r => [r.row, why(r)]) } };
}

// §14.6 diffBae from the generator's record of the two reports: per (ap, fy), and the budgets new, gone and changed; a
// budget with a row that could not be read, either side, in none of those but apart, when anything about it differs
// (review I4-3), and every such row counted
function baeDiffExpect(r0, r1) {
  const side = rows => {
    const blocks = {}, figs = {}, present = new Set(), unread = {};
    for (const r of rows) {
      if (r.kind !== 'data' || !r.name || r.scope !== 'in') continue;
      const k = normKey(r.name);
      present.add(k);
      if (r.bad.length) { unread[k] = (unread[k] || 0) + 1; continue; }
      const b = blocks[r.ap + '|' + r.fy] = blocks[r.ap + '|' + r.fy] || [0, 0];
      b[0] += r.approved; b[1] += r.authorized;
      figs[k] = figs[k] || {};
      const f = figs[k][r.fy] = figs[k][r.fy] || [0, 0];
      f[0] += r.approved; f[1] += r.authorized;
    }
    return { blocks, figs, present, unread };
  };
  const a = side(r0), b = side(r1);
  const byBlock = {};
  for (const k of [...new Set([...Object.keys(a.blocks), ...Object.keys(b.blocks)])].sort()) {
    const x = a.blocks[k] || [0, 0], y = b.blocks[k] || [0, 0];
    byBlock[k] = { approved: [x[0], y[0]], authorized: [x[1], y[1]] };
  }
  const tot = (f, i) => sum(Object.values(f || {}).map(v => v[i]));
  const ent = k => ({ key: k, approved: [tot(a.figs[k], 0), tot(b.figs[k], 0)], authorized: [tot(a.figs[k], 1), tot(b.figs[k], 1)] });
  const unr = k => k in a.unread || k in b.unread;
  const moved = k => JSON.stringify(canon(a.figs[k] || {})) !== JSON.stringify(canon(b.figs[k] || {}));
  const both = [...new Set([...a.present, ...b.present])];
  return { byBlock, unread: [sum(Object.values(a.unread)), sum(Object.values(b.unread))],
    budgetsNew: [...b.present].filter(k => !a.present.has(k) && !unr(k)).sort().map(ent),
    budgetsGone: [...a.present].filter(k => !b.present.has(k) && !unr(k)).sort().map(ent),
    budgetsChanged: [...a.present].filter(k => b.present.has(k) && !unr(k) && moved(k)).sort().map(ent),
    budgetsUnread: both.filter(k => unr(k) && (!a.present.has(k) || !b.present.has(k) || (a.unread[k] || 0) !== (b.unread[k] || 0) || moved(k))).sort()
      .map(k => Object.assign(ent(k), { unread: [a.unread[k] || 0, b.unread[k] || 0] })) };
}

// ======================================================================= §15 FY2025 OBBBA funding is left out
// Restated from CONTRACT §15, never imported from the fixture or the tool: the rule, the Counted words, and what the
// generator's own record (manifest.obbba, whose rows carry `obbba`: FY2025 OBBBA funding, from its hand-stated table)
// makes of M.excluded.obbba and of each pull row's Counted reason.
const OB_RULE = /\bOBBBA\b/i;
const OB_WHY = 'FY2025 OBBBA funding (not a reporting year)';
// M.excluded.obbba (§15.2): the readable, identified rows of FY >= First FY that are FY2025 OBBBA funding, whatever the
// switches; blocks in model order, budgets one per normKey, first spelling, in row order (the manifest lists the rows
// in file order, O&M's file first, as every §15 scenario imports them)
function obbbaExpect(rows, first) {
  const out = { rows: 0, cents: 0, obligated: 0, blocks: [], budgets: [] }, B = {}, U = {}, order = [];
  for (const r of rows) {
    if (r.bad.length || !r.ap || r.fy < first || !r.obbba) continue;
    const ob = r.status === 'exec' ? r.cents : 0, k = r.ap + '|' + r.fy, key = normKey(r.budget);
    const b = B[k] = B[k] || { ap: r.ap, fy: r.fy, rows: 0, cents: 0, obligated: 0 };
    if (!U[key]) { U[key] = { key, name: String(r.budget).trim(), ap: r.ap, rows: 0, cents: 0, obligated: 0 }; order.push(key); }
    for (const t of [out, b, U[key]]) { t.rows++; t.cents += r.cents; t.obligated += ob; }
  }
  out.blocks = Object.keys(B).sort(blockOrder).map(k => B[k]);
  out.budgets = order.map(k => U[k]);
  return out;
}
// the first §4.3 condition a row of the generator's record fails, as the oracle's rawCounted spells it
const rawWhy = (r, { first, svcOff = [], lanes = ['disc', 'mand'] }) => r.bad.length ? 'unreadable' : !r.ap ? 'unidentified'
  : r.fy < first ? 'beforeFirst' : r.obbba ? 'obbba' : (!svcOff.includes(r.svc) && lanes.includes(r.lane)) ? 'yes' : 'switch';
// the oracle's reading of obbba/'s pulls, against the manifest: M.excluded.obbba, every row's Counted reason (matched by
// file and sheet row, both recorded by the generator as it wrote them), and the seventh switch
function obbbaAgainst(tag, exp, rows, o) {
  const xo = exp.excluded && exp.excluded.obbba;
  eq(tag + ': excluded.obbba has §15.2\'s shape', xo && Object.keys(xo).sort(), ['blocks', 'budgets', 'cents', 'obligated', 'rows']);
  eq(tag + ': excluded.obbba: rows, cents, obligated, blocks in model order, budgets one per normKey in row order', xo, obbbaExpect(rows, o.first));
  const fi = f => exp.input.files.indexOf(f.split('/').pop());
  const want = {}, got = {};
  for (const r of rows) want[(r.ap || 'unidentified') + '|' + fi(r.file) + '|' + r.row] = [rawWhy(r, o), r.case];
  for (const [ap, l] of Object.entries(exp.rawCounted || {})) for (const [f, , n, w] of l) got[ap + '|' + f + '|' + n] = w;
  const bad = Object.keys(want).filter(k => got[k] !== want[k][0]).map(k => `${k} (${want[k][1]}): ${got[k]}, want ${want[k][0]}`);
  const extra = Object.keys(got).filter(k => !(k in want));
  chk(`${tag}: every pull row's Counted reason is the first §4.3 condition it fails, row by row (${rows.length} rows)`,
    !bad.length && !extra.length, bad.slice(0, 6).join('; ') + (extra.length ? ' | rows the manifest lacks: ' + extra.slice(0, 4) : ''));
  // §9 the seventh switch exists only when a row that would count but for the switches has no service: an FY2025 OBBBA
  // row with none never would
  const unk = rows.some(r => r.ap && !r.bad.length && r.fy >= o.first && !r.obbba && r.svc === UNK);
  eq(tag + ': "Service not identified" is a switch only when a row that would count has no service', exp.shown.services.includes(UNK), unk);
}

// the report file as openpyxl reads it on its own: header row, headers, the money cells' formats and texts, the total
const BAE_SHAPE_PY = `
import json, sys, openpyxl
wb = openpyxl.load_workbook(sys.argv[1])
ws = wb.worksheets[0]
rows = list(ws.iter_rows())
hi = next(i for i, r in enumerate(rows[:15]) if any(c.value is not None and 'Budget Name' in str(c.value) for c in r))
hdr = [c.value for c in rows[hi]]
col = lambda pre: next(j for j, h in enumerate(hdr) if str(h).strip().startswith(pre))
ca, cu = col('Budget Approved'), col('Budget Authorized')
data, last = rows[hi + 1:-1], rows[-1]
def kind(v): return 'none' if v is None else ('text' if isinstance(v, str) else 'number')
nums = lambda j: sum(r[j].value for r in data if isinstance(r[j].value, (int, float)) and not isinstance(r[j].value, bool))
print(json.dumps({'sheets': wb.sheetnames, 'headerRow': hi + 1, 'headers': hdr, 'freeze': ws.freeze_panes,
  'formats': sorted({r[j].number_format for r in data for j in (ca, cu) if r[j].value is not None}),
  'texts': [sorted({r[j].value for r in data if isinstance(r[j].value, str)}) for j in (ca, cu)],
  'zeros': [sum(1 for r in data if r[j].value == '$0.000') for j in (ca, cu)],
  'kinds': [sorted({type(r[j].value).__name__ for r in data if r[j].value is not None}) for j in (ca, cu)],
  'lastRow': [kind(last[col(n)].value) for n in ('Budget Name', 'Budget FY', 'Budget Approved', 'Budget Authorized')],
  'lastIs': last[0].row, 'maxRow': ws.max_row,
  'totalMinusSum': [last[ca].value - nums(ca), last[cu].value - nums(cu)]}))
`;

// ===================================================================================================================
const S = scratchDir('sfcbsp-fixture-');
try {
  const A = join(S.dir, 'a'), B = join(S.dir, 'b'), C = join(S.dir, 'c');
  const man = makeFixture(A);
  makeFixture(B);
  // ---------------------------------------------------------------------------------------------- determinism
  const files = () => ['pull-all.xlsx', 'pull-om.xlsx', 'pull-ff.csv', 'pull-sp-opn.xlsx', 'gen2/pull-om.xlsx', 'gen2/pull-ff.csv', 'bae.xlsx', 'gen2/bae.xlsx', 'manifest.json'];
  const h = (d, f) => createHash('sha256').update(readFileSync(join(d, f))).digest('hex');
  for (const f of files()) chk('the same seed writes the same bytes: ' + f, h(A, f) === h(B, f));
  chk('about 600 rows', man.gen1.length >= 550 && man.gen1.length <= 700, String(man.gen1.length));

  // --------------------------------------------------------------- coverage: the fixture holds every §12 case
  const g1 = man.gen1;
  const has = (what, pred) => chk('the fixture holds ' + what, g1.some(pred));
  const amt = new Set(g1.map(r => r.forms.amount).filter(v => v !== undefined).map(String));
  for (const a of ['$0.00', '(1,234.56)', '-$1,234.56', '$(1,234.56)', ' -1234 ', '$1,234.50', '1,234.50', 'TBD', '1,23,456'])
    chk('the fixture holds the amount text ' + JSON.stringify(a), amt.has(a));
  has('a number with more than two decimals', r => typeof r.forms.amount === 'number' && Math.round(r.forms.amount * 100) !== r.forms.amount * 100);
  has('cents', r => r.cents !== null && r.cents % 100 !== 0 && r.forms.amount === undefined);
  has('a negative amount', r => r.cents !== null && r.cents < 0);
  for (const fy of ['FY26', 'FY2026', '2026', 'FY-TBD']) has('the FY text ' + fy, r => r.forms.fy === fy);
  for (const k of ['serial', 'text', 'datetime-with-time']) has('a date written as ' + k, r => r.forms.dateKind === k);
  for (const [name, re] of [['M/D/YYYY', /^\d{1,2}\/\d{1,2}\/\d{4}$/], ['D Mon YYYY', /^\d{1,2} [A-Z][a-z]{2} \d{4}$/], ['Mon-YYYY', /^[A-Z][a-z]{2}-\d{4}$/]])
    has('a text date ' + name, r => typeof r.forms.date === 'string' && re.test(r.forms.date));
  has('an unreadable date', r => r.forms.date === 'TBD' && r.date === '');
  has('a serial date with a time of day', r => typeof r.forms.date === 'number' && !Number.isInteger(r.forms.date));
  for (const [st, lbl] of [['exec'], ['na'], ['unprog'], ['fcst'], ['other', '(blank)'], ['other', 'Pending Review']])
    has('the status ' + (lbl || st), r => r.status === st && (!lbl || r.statusLabel === lbl));
  for (const s of [...SERVICES, UNK]) has('a counted row of service ' + s, r => r.ap && r.svc === s);
  has('a Mandatory line', r => r.lane === 'mand' && r.ap);
  has('a Navy OPN line', r => r.ap === 'opn' && /USN OPN/.test(r.budget) && r.svc === 'USN (USN CV)');
  has('a Navy APN CONG line', r => /CONG/.test(r.budget) && r.svc === 'USN (USN CV)');
  has('a budget no rule knows, placed by its sheet', r => r.budget === 'DLA Reimbursable Line X' && r.ap === 'sp' && r.svc === UNK);
  has('"CHANGE ORDER" (ANG inside a word) read as USAF', r => /CHANGE ORDER/.test(r.budget) && r.svc === 'USAF');
  has('rows whose appropriation nothing identifies', r => r.ap === null);
  for (const fy of [2024, 2025, 2026, 2027, 2028]) for (const ap of fy === 2028 ? ['om'] : ['om', 'ff', 'sp', 'opn'])
    has(`a ${ap} FY${fy} row`, r => r.ap === ap && r.fy === fy);
  has('PP 2000', r => normKey(r.ccar) === 'pp 2000' && r.ccar === 'PP 2000');
  has('" pp 2000", the case-and-space variant', r => r.raw.ccar === ' pp 2000');
  has('JSF6654', r => r.ccar === 'JSF6654');
  has('an office not in the list', r => r.pmo === 'Sustainment Analytics (SA)');
  has('a blank PMO', r => r.ap && r.pmo === '');
  has('leading and trailing spaces', r => r.raw.title && /^\s.*\s$/.test(r.raw.title));
  has('a plan event with a leading space', r => r.raw.pe && /^\s/.test(r.raw.pe));
  has('a plan event longer than 80 characters', r => r.pe.length > 80);
  has('a title holding <b>&"\'', r => r.title.includes('<b>&"\''));
  has('a plan event holding </script>', r => r.pe.includes('</script>'));
  has('a plan event holding "><img src=x onerror=alert(1)>', r => r.pe.includes('"><img src=x onerror=alert(1)>'));
  has('an executed row dated after the as-of month (2026-10)', r => r.status === 'exec' && r.date >= '2026-11-01' && r.ap && r.fy >= 2025);
  const variant = f => g1.some(a => g1.some(b => a.ap === b.ap && a.fy === b.fy && a[f] !== b[f] && normKey(a[f]) === normKey(b[f])));
  chk('the fixture holds a title in two spellings', variant('title'));
  chk('the fixture holds a plan event in two spellings', variant('pe'));

  // ---------------------------------------------------------------------------------------------- the scenarios
  const ex = {};
  for (const s of ['all', 'usaf-off', 'mand-only', 'disc-only', 'asof-2026-03', 'first-2024', 'gen2', 'layout']) ex[s] = oracle(A, s);
  const sets = {
    all: { asOf: '2026-10', first: 2025 }, 'usaf-off': { asOf: '2026-10', first: 2025, svcOff: ['USAF'] },
    'mand-only': { asOf: '2026-10', first: 2025, lanes: ['mand'] }, 'disc-only': { asOf: '2026-10', first: 2025, lanes: ['disc'] },
    'asof-2026-03': { asOf: '2026-03', first: 2025 }, 'first-2024': { asOf: '2026-10', first: 2024 } };
  for (const [s, o] of Object.entries(sets)) if (ex[s]) { againstManifest(s, ex[s], fromManifest(g1, o)); structure(s, ex[s]); }

  if (ex.all) {
    const a = ex.all;
    // the cases, read back as the contract says they must read
    eq('all: every column has money in some block', COLS.filter(c => !Object.values(a.blocks).some(b => b.cols[c] !== 0)), []);
    chk('all: the No-date column is shown', a.showNoDate === true);
    eq('all: FY2028 money has no curve and no goal', [a.blocks['om|2028'].n, a.blocks['om|2028'].curve, a.blocks['om|2028'].goal,
      a.blocks['om|2028'].status, COLS.every(c => a.blocks['om|2028'].goalC[c] === null)], [0, null, null, null, true]);
    const z = a.blocks['opn|2025'];
    eq('all: a block netting to zero has no percentages', [z.approved, z.oblPct, z.status, z.delta, COLS.every(c => z.obl[c][0] === null)], [0, null, null, null, true]);
    chk('all: the statuses span green, yellow and red', ['green', 'yellow', 'red'].every(s => Object.values(a.blocks).some(b => b.status === s)));
    const cds = a.blocks['om|2026'].titles['Combat Data Systems (CDS)|Ventral <b>&"\' Fairing Study'];
    chk('all: the markup title is a node, spelt exactly', cds > 0, String(cds));
    chk('all: the </script> plan event is a node', Object.keys(a.blocks['om|2027'].pes).some(k => k.endsWith('|Close-out </script> review')));
    chk('all: the image-tag plan event is an item', a.blocks['ff|2026'].na.some(it => it[4] === '"><img src=x onerror=alert(1)>'));
    const long = g1.find(r => r.pe.length > 80 && r.ap === 'om');
    chk('all: the long plan event keeps all its characters and money', a.blocks['om|2027'].na.some(it => it[4] === long.pe));
    const hyd = g1.filter(r => normKey(r.title) === 'hydraulic pump overhaul');
    eq('all: four spellings of a title are one node, labelled by the majority',
      a.blocks['om|2026'].titles['Maintenance Systems (MxS)|Hydraulic Pump Overhaul'], sum(hyd.map(r => r.cents)));
    eq('all: a non-breaking space is the same title', a.blocks['om|2026'].titles['Air Vehicle (AV)|Radar Shroud Repair'],
      sum(g1.filter(r => normKey(r.title) === 'radar shroud repair').map(r => r.cents)));
    const jsf = a.blocks['om|2026'].na.find(it => it[2] === 'CC:jsf6654' && it[0] === 'm7');
    eq('all: a special CCaR is one item a month, labelled by its title', jsf && [jsf[1], jsf[3], jsf[4]],
      ['na', sum(g1.filter(r => r.ccar === 'JSF6654' && r.status === 'na' && r.date === '2027-04-30').map(r => r.cents)), 'Airframe Annual Readiness Bundle']);
    const pp = a.blocks['om|2027'].na.find(it => it[2] === 'CC:pp 2000' && it[0] === 'm6');
    eq('all: " pp 2000" joins PP 2000 (and every plan event under it) in one item', pp && pp[3],
      sum(g1.filter(r => normKey(r.ccar) === 'pp 2000' && r.fy === 2027 && r.status === 'na' && r.date.startsWith('2027-03')).map(r => r.cents)));
    const groups = new Set(Object.values(a.blocks).flatMap(b => b.na.map(it => it[1])));
    eq('all: the status groups of the Not Allocated items', [...groups].sort(), ['fcst', 'na', 'other:(blank)', 'other:Pending Review', 'unprog']);
    const hold = a.blocks['om|2027'].na.find(it => it[2] === 'PE:hold - pending funds return');
    eq('all: one plan event in two offices is one item', hold && hold[3], 2015000_00 + 1104000_00);
    eq('all: executed after the as-of month (top level)', a.execAfterAsOf.cents,
      sum(Object.values(a.blocks).map(b => b.execAfterAsOf)));
    chk('all: (no PMO) and the office not in the list have PMO tabs', '(no PMO)' in a.pmoTabs && 'Sustainment Analytics (SA)' in a.pmoTabs);
    eq('all: PMO codes', [a.pmoCodes['Air Vehicle (AV)'], a.pmoCodes['Sustainment Analytics (SA)']], ['AV', 'SA']);
    eq('all: the shown text inputs', [a.shown.all, a.shown.lanes], [true, ['disc', 'mand']]);
  }
  // usaf-off = all less the USAF rows, summed straight from the fixture's own record of the rows
  if (ex.all && ex['usaf-off']) for (const [k, b] of Object.entries(ex.all.blocks)) {
    const usaf = g1.filter(r => r.ap + '|' + r.fy === k && !r.bad.length && r.svc === 'USAF');
    eq('usaf-off ' + k + ': approved = all less the USAF rows', ex['usaf-off'].blocks[k].approved, b.approved - sum(usaf.map(r => r.cents)));
    eq('usaf-off ' + k + ': obligated = all less the USAF exec rows', ex['usaf-off'].blocks[k].obligated,
      b.obligated - sum(usaf.filter(r => r.status === 'exec').map(r => r.cents)));
  }
  if (ex['usaf-off']) eq('usaf-off: the shown flag', ex['usaf-off'].shown.all, false);
  // mand-only + disc-only = all
  if (ex.all && ex['mand-only'] && ex['disc-only']) for (const [k, b] of Object.entries(ex.all.blocks)) {
    const m = ex['mand-only'].blocks[k], d = ex['disc-only'].blocks[k];
    for (const f of ['approved', 'obligated', 'unprog', 'execAfterAsOf']) eq(`lanes ${k}: mand + disc = all (${f})`, m[f] + d[f], b[f]);
    eq(`lanes ${k}: mand + disc = all (columns)`, COLS.map(c => m.cols[c] + d.cols[c]), COLS.map(c => b.cols[c]));
    const naC = blk => COLS.map(c => sum(blk.na.filter(it => it[0] === c).map(it => it[3])));
    eq(`lanes ${k}: mand + disc = all (Not Allocated by column)`, naC(m).map((v, i) => v + naC(d)[i]), naC(b));
  }
  if (ex['mand-only']) chk('mand-only: some block has Mandatory money', Object.values(ex['mand-only'].blocks).filter(b => b.approved).length >= 2);
  // the layout-independence check: the same rows in three other files give exactly the same expected values
  if (ex.all && ex.layout) {
    const strip = o => { const c = { ...o }; delete c.input; return JSON.stringify(c); };
    chk('layout: pull-om.xlsx + pull-ff.csv + pull-sp-opn.xlsx give exactly what pull-all.xlsx gives', strip(ex.all) === strip(ex.layout));
  }
  if (ex['asof-2026-03']) {
    const q = ex['asof-2026-03'];
    eq('asof-2026-03: E, the as-of column and the window', [q.E, q.asOfIndex, q.window], [2026, 6, { start: '2025-10-01', end: '2026-10-01' }]);
    eq('asof-2026-03: FY2027 has no curve', [q.blocks['om|2027'].n, q.blocks['om|2027'].curve], [0, null]);
  }
  if (ex['first-2024']) {
    const f = ex['first-2024'];
    eq('first-2024: the FY2024 blocks and their curves', ['om', 'ff', 'sp', 'opn'].map(ap => f.blocks[ap + '|2024'] && f.blocks[ap + '|2024'].curve), ['om2', 'p4', 'p4', 'p4']);
    eq('first-2024: nothing before the first FY', f.excluded.beforeFirst, 0);
    if (ex.all) eq('first-2024: what "all" excluded is now counted', f.summary.approved - ex.all.summary.approved, ex.all.excluded.beforeFirst);
  }
  // gen2: O&M and FF from the later pull, Spares and OPN from the first; and what changed
  if (ex.gen2) {
    const g = ex.gen2, ch = man.gen2Changes;
    const rows2 = [...man.gen2, ...g1.filter(r => r.tab === 'sp' || r.tab === 'opn')];
    againstManifest('gen2', g, fromManifest(rows2, { asOf: '2026-10', first: 2025 }));
    structure('gen2', g);
    eq('gen2: the diff covers the appropriations in both pulls', Object.keys(g.diff).sort(), ['ff', 'om']);
    for (const ap of ['om', 'ff']) {
      const by = (rows) => { const o = {}; for (const r of rows) if (r.ap === ap && !r.bad.length) { const k = ap + '|' + r.fy;
        o[k] = o[k] || { approved: 0, obligated: 0 }; o[k].approved += r.cents; if (r.status === 'exec') o[k].obligated += r.cents; } return o; };
      const b0 = by(g1), b1 = by(man.gen2);
      const want = {};
      for (const k of [...new Set([...Object.keys(b0), ...Object.keys(b1)])].sort()) {
        const x = b0[k] || { approved: 0, obligated: 0 }, y = b1[k] || { approved: 0, obligated: 0 };
        want[k] = { approved: [x.approved, y.approved], obligated: [x.obligated, y.obligated] };
      }
      eq('gen2 diff ' + ap + ': approved and obligated before and after', g.diff[ap].byBlock, want);
      const cc = rows => new Set(rows.filter(r => r.ap === ap && !r.bad.length).map(r => normKey(r.ccar)));
      const c0 = cc(g1), c1 = cc(man.gen2);
      eq('gen2 diff ' + ap + ': CCaRs new', g.diff[ap].ccarsNew, [...c1].filter(x => !c0.has(x)).sort());
      eq('gen2 diff ' + ap + ': CCaRs gone', g.diff[ap].ccarsGone, [...c0].filter(x => !c1.has(x)).sort());
    }
    eq('gen2: the new CCaR', g.diff.om.ccarsNew, [normKey(ch.newCcar)]);
    eq('gen2: the CCaR gone', g.diff.ff.ccarsGone, [normKey(ch.goneCcar)]);
    eq('gen2: the CCaR moved to another PMO', g.diff.ff.pmoMoves, [[normKey(ch.movedCcar), ch.movedFrom, ch.movedTo]]);
    chk('gen2: the plan event gone is gone', !Object.keys(g.blocks['om|2026'].pes).some(k => k.endsWith('|' + ch.gonePe)) &&
      Object.keys(ex.all.blocks['om|2026'].pes).some(k => k.endsWith('|' + ch.gonePe)));
    chk('gen2: the new budget name is counted', g.crossChecks.bySvc['om|2027']['USAF AFRC'] > ex.all.crossChecks.bySvc['om|2027']['USAF AFRC']);
    eq('gen2: Spares and OPN unchanged from the first import', ['sp|2025', 'sp|2026', 'sp|2027', 'opn|2026', 'opn|2027'].map(k => g.blocks[k].approved),
      ['sp|2025', 'sp|2026', 'sp|2027', 'opn|2026', 'opn|2027'].map(k => ex.all.blocks[k].approved));
  }

  // ======================================================================== §14 the BAE report (CONTRACT §14.8)
  const BM = man.bae, R1 = BM.gen1, R2 = BM.gen2;
  const D1 = R1.filter(r => r.kind === 'data'), D2 = R2.filter(r => r.kind === 'data');
  const rowsG2 = [...man.gen2, ...g1.filter(r => r.tab === 'sp' || r.tab === 'opn')];
  // ---------------------------------------------------------- the two report files, as openpyxl reads them on its own
  const shapeOf = (dir, f) => { const r = py(['-c', BAE_SHAPE_PY, join(dir, f)]); return r.status === 0 ? JSON.parse(r.stdout) : (chk('read ' + f, false, r.stderr.slice(-400)), null); };
  const sh1 = shapeOf(A, 'bae.xlsx'), sh2 = shapeOf(A, 'gen2/bae.xlsx');
  if (sh1) {
    eq('bae.xlsx: one sheet, named as the real report\'s is', sh1.sheets, ['Sheet1']);
    eq('bae.xlsx: the header on row 1', sh1.headerRow, 1);
    eq('bae.xlsx: the real report\'s 28 headers, in its order', sh1.headers, BAE_HEADERS);
    eq('bae.xlsx: frozen under the header', sh1.freeze, 'A2');
    eq('bae.xlsx: every money cell carries the $M display format', sh1.formats, [BAE_FMT]);
    eq('bae.xlsx: the texts among the amounts are the report\'s zero and the one unreadable figure', sh1.texts, [['$0.000', '$1.250'], ['$0.000']]);
    chk('bae.xlsx: $0.000 text zeros in both money columns', sh1.zeros[0] >= 1 && sh1.zeros[1] >= 10, JSON.stringify(sh1.zeros));
    eq('bae.xlsx: amounts are whole-dollar and fractional numbers besides those texts', sh1.kinds, [['float', 'int', 'str'], ['float', 'int', 'str']]);
    eq('bae.xlsx: the last row is the total row: no name, no FY, two amounts', [sh1.lastRow, sh1.lastIs === sh1.maxRow], [['none', 'none', 'number', 'number'], true]);
    chk('bae.xlsx: the total row is the sum of every number above it', sh1.totalMinusSum.every(d => Math.abs(d) < 0.005), JSON.stringify(sh1.totalMinusSum));
  }
  if (sh2) {
    const h2 = sh2.headers.map(h => String(h));
    eq('gen2/bae.xlsx: the header on row 3, under two lines', sh2.headerRow, 3);
    chk('gen2/bae.xlsx: "Budget FY" in place of "Budget FY Numeric"', h2.includes('Budget FY') && !h2.includes('Budget FY Numeric'));
    chk('gen2/bae.xlsx: Authorized without its unit, and before Approved', h2.includes('Budget Authorized Amount') &&
      h2.indexOf('Budget Authorized Amount') < h2.indexOf('Budget Approved Amount ($M)'));
    chk('gen2/bae.xlsx: a header with a trailing space', h2.includes('Budget Name '));
    eq('gen2/bae.xlsx: the same 28 columns', h2.map(h => h.trim()).map(h => ({ 'Budget FY': 'Budget FY Numeric', 'Budget Authorized Amount': 'Budget Authorized Amount ($M)' })[h] || h).sort(), [...BAE_HEADERS].sort());
    chk('gen2/bae.xlsx: the total row is the sum of every number above it, the unreadable rows\' too', sh2.totalMinusSum.every(d => Math.abs(d) < 0.005), JSON.stringify(sh2.totalMinusSum));
    eq('gen2/bae.xlsx: the total row is last: no name, no FY, two amounts', [sh2.lastIs === sh2.maxRow, sh2.lastRow], [true, ['none', 'none', 'number', 'number']]);
  }

  // ------------------------------------------- coverage: every case §14.8 lists is really in the report, counted
  const cnt = (what, n, min = 1) => chk(`the BAE fixture holds ${what} (${n})`, n >= min, String(n));
  const pullBud = new Set(g1.map(r => r.budget)), repBud = new Set(D1.map(r => r.name));
  const inGood = D1.filter(r => r.scope === 'in' && !r.bad.length);
  cnt('rows of budgets the pull uses', D1.filter(r => pullBud.has(r.name)).length, 20);
  cnt('Flyaway rows', D1.filter(r => r.scope === 'flyaway').length, 3);
  cnt('a Flyaway name spelt in capitals', D1.filter(r => r.scope === 'flyaway' && /FLYAWAY/.test(r.name)).length);
  for (const [w, re] of [['Advance Procurement', /Advance Procurement/], ['Modifications', /Modifications/], ['RDT&E', /RDT&E/], ['a squadron', /Squadron/]])
    cnt('a name that places no appropriation: ' + w, D1.filter(r => r.scope === 'noap' && re.test(r.name)).length);
  cnt('budgets the pull does not use, with money in FY2025–2027', new Set(inGood.filter(r => !pullBud.has(r.name) && r.fy >= 2025 && r.fy <= 2027 && (r.approved || r.authorized)).map(r => r.name)).size, 3);
  cnt('a sustainment budget the pull counts and the report lacks', new Set(g1.filter(r => r.ap && !r.bad.length && r.fy >= 2025 &&
    BM.names[r.budget] && BM.names[r.budget].scope === 'in' && !repBud.has(r.budget)).map(r => r.budget)).size);
  cnt('a budget the pull counts by its sheet, which no report row can carry', new Set(g1.filter(r => r.ap && !r.bad.length && r.fy >= 2025 && !BM.names[r.budget]).map(r => r.budget)).size);
  for (const s of [...SERVICES, UNK]) cnt('an in-scope report row of service ' + s, inGood.filter(r => r.svc === s).length);
  for (const l of ['disc', 'mand']) cnt('an in-scope report row in lane ' + l, inGood.filter(r => r.lane === l).length);
  cnt('a budget whose PMO code differs from its rows\' PMO column', new Set(g1.filter(r => r.ap && !r.bad.length && r.fy >= 2025 &&
    BM.budgetPmo[r.budget] !== (r.pmo || '(no PMO)') && inGood.some(x => x.name === r.budget && x.fy === r.fy)).map(r => r.budget)).size);
  cnt('an in-scope budget with no PMO code', new Set(inGood.filter(r => r.pmo === '(no PMO)').map(r => r.name)).size, 3);
  cnt('a PMO code in lower case', inGood.filter(r => / mxs$/.test(r.name) && r.pmo === 'Maintenance Systems (MxS)').length);
  cnt('a budget whose PMO is known only from the pull', inGood.filter(r => r.pmo === 'Sustainment Analytics (SA)').length);
  const XA = baeExpect(g1, R1, BM.budgetPmo, { asOf: '2026-10', first: 2025 });
  cnt('blocks the report does not cover', XA.lists.uncovered.length, 2);
  const only = (ap, fy, pred) => D1.some(r => r.ap === ap && r.fy === fy) && D1.filter(r => r.ap === ap && r.fy === fy).every(pred);
  chk('the BAE fixture holds a block whose only report rows are Flyaway (Full Fund FY2025)', only('ff', 2025, r => r.scope === 'flyaway'));
  chk('the BAE fixture holds a block whose only report row cannot be read (Initial Spares FY2025)', only('sp', 2025, r => r.bad.length > 0));
  cnt('an (ap, fy) with report money and no block (with E = 2028)', baeExpect(g1, R1, BM.budgetPmo, { asOf: '2027-10', first: 2025 }).lists.noBlock.length);
  cnt('an unreadable amount', D1.filter(r => r.bad.includes('Approved') || r.bad.includes('Authorized')).length);
  cnt('planShort blocks', XA.lists.planShort.length, 2);
  cnt('a planShort block with a plan', XA.lists.planShort.filter(p => p.planned > 0).length);
  cnt('a covered block reading Approved $0 with USAF off', Object.values(baeExpect(g1, R1, BM.budgetPmo, { asOf: '2026-10', first: 2025, svcOff: ['USAF'] }).blocks)
    .filter(b => b.covered && b.approved === 0 && b.planned !== 0).length);
  for (const f of ['int', 'cents', 'subcent']) cnt('amounts written as ' + f, D1.filter(r => r.forms.approved === f || r.forms.authorized === f).length, 2);
  cnt('an Approved written as the text $0.000', D1.filter(r => r.forms.approved === '$0.000').length);
  cnt('Authorized written as the text $0.000', D1.filter(r => r.forms.authorized === '$0.000').length, 10);
  cnt('an Authorized above its Approved', inGood.filter(r => r.authorized > r.approved).length);
  cnt('an Authorized short of its Approved, not zero', inGood.filter(r => r.authorized && r.authorized < r.approved).length);
  cnt('a non-zero amount under $100,000', inGood.filter(r => [r.approved, r.authorized].some(c => c && Math.abs(c) < 100000_00)).length);
  cnt('report rows for FY2028 and later', inGood.filter(r => r.fy >= 2028).length, 5);
  cnt('a total row', R1.filter(r => r.kind === 'total').length);
  const DX = baeDiffExpect(R1, R2);
  for (const k of ['budgetsNew', 'budgetsGone', 'budgetsChanged', 'budgetsUnread']) cnt('gen2: ' + k, DX[k].length);
  cnt('gen2: an FY that cannot be read', D2.filter(r => r.bad.includes('FY')).length);
  cnt('gen2: a row with no Budget Name', D2.filter(r => r.bad.includes('Budget Name')).length);
  cnt('gen2: a row blank in the four columns the tool reads', R2.filter(r => r.kind === 'skip').length);
  chk('gen2: the total row differs from the readable rows, by the unreadable rows\' money', (() => {
    const t = baeExpect(rowsG2, R2, BM.budgetPmo, { asOf: '2026-10', first: 2025 }).lists.total;
    return t && !t.ok && t.diff.approved === sum(D2.filter(r => r.bad.length).map(r => r.approved || 0)); })());

  // ------------------------------------- the oracle's reading of the files, against the manifest and the plain runs
  const ENT = { 'om|2026': 39876543210, 'sp|2025': 8000000000 };
  const plainRun = (dir, name, args) => {
    const out = join(dir, 'exp', 'plain-' + name + '.json');
    const r = py([ORACLE, '--files', join(dir, 'pull-all.xlsx'), ...args, '--out', out]);
    return r.status === 0 ? JSON.parse(readFileSync(out, 'utf8')) : (chk('plain run ' + name, false, r.stderr.slice(-400)), null);
  };
  const PLAN = ['n', 'curve', 'goal', 'unprog', 'execAfterAsOf', 'cols', 'cum', 'obl', 'goalC', 'statusC', 'pmos', 'titles', 'pes', 'ccars', 'na'];
  const TOP = ['asOf', 'E', 'firstFY', 'asOfIndex', 'window', 'special', 'shown', 'showNoDate', 'excluded', 'execAfterAsOf', 'rowsByAp', 'crossChecks'];
  function compareBae(tag, exp, X, plain) {
    if (!exp || !plain) return;
    eq(tag + ': the blocks are the pull\'s (a report adds none)', Object.keys(exp.blocks).sort(), Object.keys(plain.blocks).sort());
    eq(tag + ': the blocks the manifest makes', Object.keys(exp.blocks).sort(), Object.keys(X.blocks).sort());
    for (const f of TOP) eq(`${tag}: ${f} is the plain run's`, exp[f], plain[f]);
    for (const [k, b] of Object.entries(exp.blocks)) {
      const x = X.blocks[k], p = plain.blocks[k], t = `${tag} ${k}`;
      if (!x || !p) continue;
      for (const f of ['covered', 'planned', 'approved', 'approvedSrc', 'authorized', 'authorizedSrc', 'authorizedEntered', 'obligated', 'unobligated', 'planShort'])
        eq(`${t}: ${f}`, b[f], x[f]);
      eq(t + ': planned is the plain run\'s Approved', b.planned, p.approved);
      for (const f of PLAN) eq(`${t}: ${f} stays on the plan`, b[f], p[f]);
      eq(t + ': the slide figures are the plain run\'s headline', b.slide, { basis: p.approved, oblPct: p.oblPct, goal: p.goal, delta: p.delta, status: p.status });
      const pct = b.approved ? b.obligated / b.approved : null;
      chk(t + ': Obl % = obligated / Approved (the report\'s)', close(b.oblPct, pct), String(b.oblPct));
      chk(t + ': delta', close(b.delta, pct !== null && b.goal !== null ? pct - b.goal : null), String(b.delta));
      eq(t + ': status on that Obl %', b.status, statusOf(pct, b.goal));
      // ‡ on every entered figure with a report loaded, whatever the switches (answer 8, review I4-4)
      eq(t + ': marks', b.marks, { sect: !x.covered, dagger: x.authorizedSrc === 'approved', ddagger: !!x.authorizedEntered });
      // §14.4 the PMO rows: budgets' figures on a covered block, rows' on another; the detail stays on the plan
      const tabs = Object.fromEntries(Object.entries(exp.pmoTabs).filter(([, tb]) => tb[k]).map(([l, tb]) => [l, tb[k]]));
      eq(t + ': which PMOs have a row', Object.keys(tabs).sort(), Object.keys(x.tabs).sort());
      for (const [l, tr] of Object.entries(tabs)) {
        const w = x.tabs[l];
        if (!w) continue;
        eq(`${t} PMO ${l}: Approved, Authorized, Obligated, basis, and the Obligated its Approved leaves out (M4-6)`,
          [tr.approved, tr.authorized, tr.obligated, tr.basis, tr.sect, tr.offObligated], [w.approved, w.authorized, w.obligated, x.covered ? 'budget' : 'row', !x.covered, w.offObligated || 0]);
        chk(`${t} PMO ${l}: Obl % and status`, close(tr.oblPct, tr.approved ? tr.obligated / tr.approved : null) &&
          tr.status === statusOf(tr.oblPct, b.goal), JSON.stringify([tr.oblPct, tr.status]));
        const pd = plain.pmoTabs[l] && plain.pmoTabs[l][k];
        eq(`${t} PMO ${l}: its detail is the plain run's`, [tr.planned, tr.cols, tr.na, tr.unprog, tr.execAfterAsOf],
          pd ? [pd.approved, pd.cols, pd.na, pd.unprog, pd.execAfterAsOf] : [0, Object.fromEntries(COLS.map(c => [c, 0])), [], 0, 0]);
      }
    }
    const blocks = Object.values(exp.blocks);
    const totals = bs => ({ approved: sum(bs.map(b => b.approved)), planned: sum(bs.map(b => b.planned)), authorized: sum(bs.map(b => b.authorized)),
      obligated: sum(bs.map(b => b.obligated)), unobligated: sum(bs.map(b => b.unobligated)) });
    const s = totals(blocks);
    eq(tag + ': the summary adds the blocks', ['approved', 'planned', 'authorized', 'obligated', 'unobligated'].map(f => exp.summary[f]), Object.values(s));
    eq(tag + ': the summary\'s planned is the plain run\'s Approved', exp.summary.planned, plain.summary.approved);
    chk(tag + ': the summary\'s Obl % is over the report\'s Approved', close(exp.summary.oblPct, s.approved ? s.obligated / s.approved : null));
    for (const ap of Object.keys(exp.aps)) eq(`${tag}: the ${ap} total adds its blocks`, ['approved', 'planned', 'authorized', 'obligated', 'unobligated'].map(f => exp.aps[ap][f]),
      Object.values(totals(blocks.filter(b => b.ap === ap))));
    for (const f of ['rows', 'skipped', 'cents', 'total', 'uncovered', 'noBlock', 'planShort', 'pullOnly', 'reportOnly', 'unreadable', 'counted'])
      eq(`${tag}: model.bae.${f}`, exp.bae[f], X.lists[f]);
    // each block's budgets compared by name: the manifest's row order need not be the files'
    const byName = l => (l || []).map(o => Object.assign({}, o, { budgets: [...o.budgets].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)) }));
    eq(`${tag}: model.bae.offReport (review M4-6)`, byName(exp.bae.offReport), byName(X.lists.offReport));
  }
  const BAE_SC = {
    'bae-all': [{ asOf: '2026-10', first: 2025 }, () => ex.all, R1, g1],
    'bae-usaf-off': [{ asOf: '2026-10', first: 2025, svcOff: ['USAF'] }, () => ex['usaf-off'], R1, g1],
    'bae-mand-only': [{ asOf: '2026-10', first: 2025, lanes: ['mand'] }, () => ex['mand-only'], R1, g1],
    'bae-entered': [{ asOf: '2026-10', first: 2025, auth: ENT }, () => ex.all, R1, g1],
    'bae-entered-off': [{ asOf: '2026-10', first: 2025, auth: ENT, svcOff: ['USN (USN CV)'] }, () => plainRun(A, 'usn-off', ['--svc-off', 'USN (USN CV)']), R1, g1],
    'bae-asof-2027-10': [{ asOf: '2027-10', first: 2025 }, () => plainRun(A, 'asof-2027-10', ['--asof', '2027-10']), R1, g1],
    'bae-gen2': [{ asOf: '2026-10', first: 2025 }, () => ex.gen2, R2, rowsG2] };
  const exB = {};
  for (const [s, [o, plain, rep, pull]] of Object.entries(BAE_SC)) {
    exB[s] = oracle(A, s);
    compareBae(s, exB[s], baeExpect(pull, rep, BM.budgetPmo, o), plain());
    if (exB[s]) eq(s + ': the settings it was run with', [exB[s].input.svcOff, exB[s].input.authorized || {}], [o.svcOff || [], o.auth || {}]);
  }
  if (exB['bae-all']) {
    const b = exB['bae-all'].bae;
    eq('bae-all: the report as read', [b.present, b.file, b.sheet, b.stamp, b.headerRow], [true, 'bae.xlsx', 'Sheet1', null, 1]);
    // a typed Authorized wins for its block alone, covered or not, and moves nothing else
    const e = exB['bae-entered'];
    if (e) for (const [k, x] of Object.entries(exB['bae-all'].blocks)) {
      const y = e.blocks[k];
      if (k in ENT) eq('bae-entered ' + k + ': the typed figure, marked as entered', [y.authorized, y.authorizedSrc, y.authorizedEntered, y.approved], [ENT[k], 'entered', true, x.approved]);
      else eq('bae-entered ' + k + ': unchanged', y, x);
    }
    if (e) for (const [l, tb] of Object.entries(exB['bae-all'].pmoTabs)) eq('bae-entered: a typed Authorized is never split to PMOs (' + l + ')', e.pmoTabs[l], tb);
    const o = exB['bae-entered-off'];
    if (o) eq('bae-entered-off: ‡ on the typed figures alone, while a switch is off', Object.keys(o.blocks).filter(k => o.blocks[k].marks.ddagger).sort(), Object.keys(ENT).sort());
    if (e) eq('bae-entered: ‡ on the typed figures alone, every switch on too (answer 8: marked as entered, review I4-4)',
      Object.keys(e.blocks).filter(k => e.blocks[k].marks.ddagger).sort(), Object.keys(ENT).sort());
  }
  if (exB['bae-gen2']) {
    const g = exB['bae-gen2'], ch = BM.gen2Changes;
    eq('bae-gen2: the later report is the one read', [g.bae.file, g.bae.headerRow, g.bae.skipped], ['bae.xlsx', 3, 1]);
    eq('bae-gen2: the pull diff is the plain gen2 run\'s', g.diff, ex.gen2 && ex.gen2.diff);
    eq('bae-gen2: diffBae per (ap, fy)', g.diffBae.byBlock, DX.byBlock);
    eq('bae-gen2: diffBae counts the rows that could not be read, each side', g.diffBae.unread, DX.unread);
    for (const k of ['budgetsNew', 'budgetsGone', 'budgetsChanged', 'budgetsUnread']) {
      const pickE = e => Object.assign({ key: e.key, approved: e.approved, authorized: e.authorized }, k === 'budgetsUnread' ? { unread: e.unread } : {});
      eq('bae-gen2: diffBae ' + k, (g.diffBae[k] || []).map(pickE).sort((a, b) => a.key < b.key ? -1 : 1), DX[k]);
      const sz = g.diffBae[k].map(e => e.size);
      chk('bae-gen2: ' + k + ' largest change first', sz.every((v, i) => !i || sz[i - 1] >= v), JSON.stringify(sz));
    }
    eq('bae-gen2: the budget gone and the budget new are the generator\'s', [g.diffBae.budgetsGone.map(e => e.key), g.diffBae.budgetsNew.map(e => e.key)],
      [[normKey(ch.gone)], [normKey(ch.new)]]);
    chk('bae-gen2: Full Fund FY2025 is covered now', g.blocks['ff|2025'].covered && !exB['bae-all'].blocks['ff|2025'].covered);
  }
  {  // §14.1: the report's date from a file name ending _YYYY-MM-DD_HHMMSS (the contract's own example), else none
    const named = join(S.dir, 'Report__BAE_ALL_Services_USAF_and_DoN_2026-01-31_120000.xlsx');
    writeFileSync(named, readFileSync(join(A, 'bae.xlsx')));
    const out = join(S.dir, 'stamp.json');
    const r = py([ORACLE, '--files', join(A, 'pull-all.xlsx'), named, '--out', out]);
    const j = r.status === 0 ? JSON.parse(readFileSync(out, 'utf8')) : null;
    eq('the report\'s date is read from its file name', j && j.bae && [j.bae.stamp, j.bae.file], ['2026-01-31 12:00', 'Report__BAE_ALL_Services_USAF_and_DoN_2026-01-31_120000.xlsx']);
    eq('…and only the name changed: the same figures as bae-all', j && exB['bae-all'] && JSON.stringify(j.blocks) === JSON.stringify(exB['bae-all'].blocks), true);
  }
  if (exB['bae-asof-2027-10']) eq('bae-asof-2027-10: report money with no block, FY2028', exB['bae-asof-2027-10'].bae.noBlock.map(n => n.ap + '|' + n.fy), ['ff|2028', 'sp|2028', 'opn|2028']);

  // ================================================== §15 FY2025 OBBBA funding is left out (CONTRACT §15.5)
  const OB = man.obbba, OBP = OB.pull, OBR = OB.bae.filter(r => r.kind === 'data');
  // ------------------------------------------- obbba/ is written last, from its own streams: it moves no other byte
  for (const f of ['obbba/pull-om.xlsx', 'obbba/pull-ff.csv', 'obbba/bae.xlsx']) chk('the same seed writes the same bytes: ' + f, h(A, f) === h(B, f));
  {
    const D = join(S.dir, 'd');
    const r = py([MAKE, '--out', D, '--no-obbba']);
    chk('make_fixture.py --no-obbba ran', r.status === 0, (r.stderr || '').slice(-300));
    if (r.status === 0) {
      for (const f of files().filter(f => f !== 'manifest.json')) chk('obbba/ moves no byte of ' + f, h(A, f) === h(D, f));
      const mA = JSON.parse(readFileSync(join(A, 'manifest.json'), 'utf8')), mD = JSON.parse(readFileSync(join(D, 'manifest.json'), 'utf8'));
      const only = 'obbba' in mA && !('obbba' in mD);
      delete mA.obbba;
      chk('obbba/ adds the manifest\'s "obbba" part and changes nothing else in it', only && JSON.stringify(mA) === JSON.stringify(mD));
      chk('--no-obbba writes no obbba/', !existsSync(join(D, 'obbba')));
    }
  }
  // --------------------------------------------------- coverage: every case §15.5 names, and the extra ones
  {
    const off = Object.entries(OB.names).filter(([n, v]) => v.word !== OB_RULE.test(n)).map(([n]) => n);
    chk('the generator\'s hand-stated OBBBA word agrees with §15.1\'s /\\bOBBBA\\b/i on every name', !off.length, off.join('; '));
    const has15 = (what, pred, min = 1) => { const n = OBP.filter(pred).length; chk(`obbba/ holds ${what} (${n})`, n >= min, String(n)); };
    const word = r => !!(OB.names[r.budget] && OB.names[r.budget].word);
    const om25 = OBP.filter(r => r.ap === 'om' && r.fy === 2025);
    chk('obbba/pull-om.xlsx: O&M FY2025 holds only FY2025 OBBBA rows, so its block must vanish', om25.length >= 8 && om25.every(r => r.obbba),
      om25.filter(r => !r.obbba).map(r => r.id).join(','));
    has15('ordinary O&M FY2026 rows', r => r.ap === 'om' && r.fy === 2026 && r.meant === 'counted' && !/obbba/i.test(r.budget), 10);
    has15('an OBBBA budget\'s O&M FY2026 rows, which count', r => r.ap === 'om' && r.fy === 2026 && word(r) && r.meant === 'counted');
    has15('an OBBBA FY2025 row with an unreadable amount', r => r.obbba && r.bad.includes('Amount') && r.meant === 'unreadable');
    has15('an OBBBA FY2025 name in lower case', r => r.obbba && /\bobbba\b/.test(r.budget) && r.meant === 'obbba');
    has15('an O&M name with OBBBA inside a longer word', r => r.ap === 'om' && /obbba/i.test(r.budget) && !word(r) && r.meant === 'counted');
    has15('an FY2025 name with a letter after OBBBA, ordinary', r => r.fy === 2025 && /OBBBA[A-Za-z0-9_]/.test(r.budget) && !r.obbba && r.meant === 'counted');
    has15('an FY2025 name with a letter before OBBBA, ordinary', r => r.fy === 2025 && /[A-Za-z0-9_]OBBBA/.test(r.budget) && !r.obbba && r.meant === 'counted');
    const ff25 = OBP.filter(r => r.ap === 'ff' && r.fy === 2025);
    chk('obbba/pull-ff.csv: Full Fund FY2025 mixes ordinary and OBBBA rows (the block stays, less them)',
      ff25.filter(r => r.obbba).length >= 3 && ff25.filter(r => r.meant === 'counted').length >= 5);
    const ob25 = OBP.filter(r => r.obbba && r.meant === 'obbba');
    for (const ap of ['om', 'ff']) {
      const o = ob25.filter(r => r.ap === ap);
      chk(`obbba/: ${ap} FY2025 OBBBA rows obligated (Actual Execution) and not`, o.some(r => r.status === 'exec') && o.some(r => r.status !== 'exec'));
      chk(`obbba/: ${ap} FY2025 OBBBA rows of two services`, new Set(o.map(r => r.svc)).size >= 2, [...new Set(o.map(r => r.svc))].join(','));
      chk(`obbba/: ${ap} FY2025 OBBBA rows in both lanes`, new Set(o.map(r => r.lane)).size === 2);
    }
    has15('an OBBBA FY2025 row on a budget whose other rows are FY2026', r => r.obbba && OBP.filter(x => normKey(x.budget) === normKey(r.budget))
      .every(x => x.fy === 2025 || (x.fy === 2026 && x.meant === 'counted')) && OBP.some(x => normKey(x.budget) === normKey(r.budget) && x.fy === 2026));
    has15('an OBBBA FY2025 row whose appropriation nothing identifies (set aside as that, the earlier condition)', r => r.obbba && !r.ap && r.meant === 'unidentified');
    has15('an OBBBA FY2025 row on a Flyaway budget', r => r.obbba && r.ap === 'ff' && /\bflyaway\b/i.test(r.budget));
    has15('an OBBBA FY2025 row with no service', r => r.obbba && r.ap && r.svc === UNK);
    has15('an OBBBA FY2025 row obligated after the as-of month (2026-10)', r => r.obbba && r.status === 'exec' && r.date >= '2026-11-01');
    has15('an OBBBA FY2025 row with its FY written as text', r => r.obbba && typeof r.forms.fy === 'string');
    const spell = {};
    for (const r of OBP.filter(r => r.obbba)) (spell[normKey(r.budget)] = spell[normKey(r.budget)] || new Set()).add(r.budget);
    chk('obbba/ holds one OBBBA budget spelt two ways (one budget, first spelling)', Object.values(spell).some(v => v.size >= 2));
    const cntR = (what, pred, min = 1) => { const n = OBR.filter(pred).length; chk(`obbba/bae.xlsx holds ${what} (${n})`, n >= min, String(n)); };
    cntR('readable OBBBA FY2025 rows', r => r.scope === 'obbba' && !r.bad.length, 5);
    cntR('an OBBBA budget\'s FY2026 row, ordinary', r => r.fy === 2026 && OB.names[r.name] && OB.names[r.name].word && r.scope === 'in');
    cntR('ordinary O&M FY2025 rows (an (ap, fy) whose pull rows are all FY2025 OBBBA)', r => r.ap === 'om' && r.fy === 2025 && r.scope === 'in' && !r.bad.length, 2);
    cntR('an OBBBA FY2025 Flyaway row (Flyaway first)', r => r.obbba && r.scope === 'flyaway');
    cntR('an OBBBA FY2025 row naming no appropriation (that first)', r => r.obbba && r.scope === 'noap');
    cntR('an OBBBA FY2025 row that cannot be read (that first)', r => r.obbba && r.bad.length && r.meant === 'Could not be read');
    cntR('an OBBBA FY2025 row in mixed case', r => r.scope === 'obbba' && !/OBBBA/.test(r.name) && !/obbba/.test(r.name));
    cntR('an OBBBA FY2025 row of an appropriation the pulls hold none of', r => r.scope === 'obbba' && !OBP.some(x => x.ap === r.ap));
    const remain = Object.keys(fromManifest(OBP, { asOf: '2026-10', first: 2025 }).blocks).sort(blockOrder);
    eq('obbba/: the blocks that remain', remain, ['om|2026', 'om|2027', 'ff|2025', 'ff|2026', 'ff|2027']);
    chk('obbba/bae.xlsx: ordinary rows cover every block that remains', remain.every(k => OBR.some(r => r.scope === 'in' && !r.bad.length && r.ap + '|' + r.fy === k)));
    const repNames = new Set(OBR.map(r => normKey(r.name)));
    chk('obbba/: an OBBBA FY2025 pull budget the report lacks, in lower case and with no service (neither may be in pullOnly)',
      OBP.some(r => r.obbba && /\bobbba\b/.test(r.budget) && !repNames.has(normKey(r.budget))) && OBP.some(r => r.obbba && r.ap && r.svc === UNK && !repNames.has(normKey(r.budget))));
    eq('obbba/: the report\'s rows are meant as §14.6/§15.4 word them', [...new Set(OBR.map(r => r.meant))].sort(),
      ['Could not be read', 'FY2025 OBBBA funding (not a reporting year)', 'Flyaway (production)', 'Names no appropriation', 'Yes']);
  }
  // ----------------------------------------------- the oracle's reading of obbba/, against the generator's record
  const OB_SC = { obbba: { asOf: '2026-10', first: 2025 }, 'obbba-usaf-off': { asOf: '2026-10', first: 2025, svcOff: ['USAF'] },
    'obbba-first-2026': { asOf: '2026-10', first: 2026 } };
  const exO = {};
  for (const [s, o] of Object.entries(OB_SC)) {
    const e = exO[s] = oracle(A, s);
    if (!e) continue;
    againstManifest(s, e, fromManifest(OBP, o));
    structure(s, e);
    obbbaAgainst(s, e, OBP, o);
    eq(s + ': the settings it was run with', [e.firstFY, e.input.svcOff, e.input.files], [o.first, o.svcOff || [], ['pull-om.xlsx', 'pull-ff.csv']]);
  }
  if (exO.obbba) {
    const e = exO.obbba;
    chk('obbba: O&M FY2025, whose pull rows are all FY2025 OBBBA funding (one unreadable), has no block', !('om|2025' in e.blocks) && 'ff|2025' in e.blocks);
    chk('obbba: the generator\'s "meant" is the reason the oracle gives each row at First FY 2025, every switch on',
      OBP.every(r => r.meant === (rawWhy(r, OB_SC.obbba) === 'yes' ? 'counted' : rawWhy(r, OB_SC.obbba))));
    chk('obbba: some FY2025 OBBBA money is obligated, some not', e.excluded.obbba.obligated > 0 && e.excluded.obbba.obligated < e.excluded.obbba.cents);
  }
  if (exO.obbba && exO['obbba-usaf-off']) eq('obbba-usaf-off: excluded.obbba is the same whatever the switches', exO['obbba-usaf-off'].excluded.obbba, exO.obbba.excluded.obbba);
  if (exO['obbba-first-2026']) {
    const f = exO['obbba-first-2026'];
    eq('obbba-first-2026: every FY2025 OBBBA row is before First FY instead, so excluded.obbba is §15.2\'s zeros', f.excluded.obbba,
      { rows: 0, cents: 0, obligated: 0, blocks: [], budgets: [] });
    if (exO.obbba) eq('obbba-first-2026: money before First FY is FY2025\'s every readable row, the OBBBA ones included', f.excluded.beforeFirstByFy,
      { 2025: sum(Object.values(exO.obbba.blocks).filter(b => b.fy === 2025).map(b => b.approved)) + exO.obbba.excluded.obbba.cents });
  }
  for (const [s, x] of [['all', ex.all], ['bae-all', exB['bae-all']], ['bae-gen2', exB['bae-gen2']]]) if (x)
    chk(s + ': with no FY2025 OBBBA row loaded, no §15 key (excluded.obbba, rawCounted, bae.rows.obbba, noBlock[].obbba)',
      !('obbba' in x.excluded) && !('rawCounted' in x) && !(x.bae && ('obbba' in x.bae.rows || x.bae.noBlock.some(n => 'obbba' in n))));
  // ---------------------------------------------------------------- bae-obbba: the two pulls with the report
  {
    const XO = baeExpect(OBP, OB.bae, OB.budgetPmo, { asOf: '2026-10', first: 2025 });
    const e = oracle(A, 'bae-obbba');
    compareBae('bae-obbba', e, XO, exO.obbba);
    if (e && exO.obbba) {
      eq('bae-obbba: excluded.obbba and every pull row\'s Counted reason are the plain obbba run\'s', [e.excluded, e.rawCounted], [exO.obbba.excluded, exO.obbba.rawCounted]);
      eq('bae-obbba: bae.rows.obbba counts the readable FY2025 OBBBA report rows', e.bae.rows.obbba, OBR.filter(r => r.scope === 'obbba' && !r.bad.length).length);
      const om = OBR.filter(r => r.ap === 'om' && r.fy === 2025 && r.scope === 'in' && !r.bad.length);
      eq('bae-obbba: O&M FY2025 is a noBlock with obbba, its money the ordinary report rows alone', e.bae.noBlock.filter(n => n.ap === 'om' && n.fy === 2025),
        [{ ap: 'om', fy: 2025, approved: sum(om.map(r => r.approved)), authorized: sum(om.map(r => r.authorized)), obbba: true }]);
      chk('bae-obbba: obbba is on no other noBlock entry', e.bae.noBlock.every(n => (n.ap === 'om' && n.fy === 2025) || !('obbba' in n)));
      const left = [...new Set(OBP.filter(r => r.obbba && r.ap).map(r => normKey(r.budget)))];
      chk('bae-obbba: no budget left out as FY2025 OBBBA funding is in pullOnly', left.every(k => !e.bae.pullOnly.includes(k)), e.bae.pullOnly.join('; '));
      chk('bae-obbba: no offReport entry for the OBBBA Flyaway pull budget', !e.bae.offReport.some(o => o.budgets.some(b => /flyaway/i.test(b.name) && /obbba/i.test(b.name))));
      eq('bae-obbba: Counted per report row is the generator\'s "meant"', e.bae.counted, OBR.map(r => [r.row, r.meant]));
      chk('bae-obbba: every block that remains is covered, by its ordinary rows', Object.values(e.blocks).every(b => b.covered));
      chk('bae-obbba: no FY2025 OBBBA row is a reportOnly budget', !OBR.some(r => r.scope === 'obbba' && e.bae.reportOnly.includes(normKey(r.name))
        && !OBR.some(x => x.scope === 'in' && normKey(x.name) === normKey(r.name))));
    }
  }

  // ---------------------------------------------------------------------------- refusals (§3: nothing changes)
  {
    const r1 = py([ORACLE, '--files', join(A, 'pull-all.xlsx'), join(A, 'pull-all.xlsx'), '--out', join(S.dir, 'r1.json')]);
    const j1 = existsSync(join(S.dir, 'r1.json')) ? JSON.parse(readFileSync(join(S.dir, 'r1.json'), 'utf8')) : {};
    chk('a file given twice is refused', r1.status === 3 && /twice/.test(j1.refused || ''), (j1.refused || r1.stderr).slice(0, 200));
    const r2 = py([ORACLE, '--files', join(A, 'pull-all.xlsx'), join(A, 'pull-om.xlsx'), '--out', join(S.dir, 'r2.json')]);
    const j2 = existsSync(join(S.dir, 'r2.json')) ? JSON.parse(readFileSync(join(S.dir, 'r2.json'), 'utf8')) : {};
    chk('O&M from two sheets is refused, naming both', r2.status === 3 && /O&M Raw Data/.test(j2.refused || '') && /Report/.test(j2.refused || ''),
      (j2.refused || r2.stderr).slice(0, 300));
    // §14.1: two report sheets in one import refuse the whole import, naming both
    const r3 = py([ORACLE, '--files', join(A, 'pull-all.xlsx'), join(A, 'bae.xlsx'), join(A, 'gen2', 'bae.xlsx'), '--out', join(S.dir, 'r3.json')]);
    const j3 = existsSync(join(S.dir, 'r3.json')) ? JSON.parse(readFileSync(join(S.dir, 'r3.json'), 'utf8')) : {};
    chk('two BAE reports in one import are refused, naming both', r3.status === 3 && (j3.refused || '').split('bae.xlsx').length === 3,
      (j3.refused || r3.stderr).slice(0, 300));
  }

  // ------------------------------------------------- LibreOffice reads the 1904 file and the shared strings on its own
  const lo = spawnSync('soffice', ['--version'], { encoding: 'utf8' });
  if (lo.status === 0) {
    const out = join(S.dir, 'lo');
    mkdirSync(out, { recursive: true });
    const conv = spawnSync('soffice', ['-env:UserInstallation=file://' + join(S.dir, 'loprof'), '--headless', '--convert-to',
      'csv:Text - txt - csv (StarCalc):44,34,76,1', '--outdir', out, join(A, 'pull-om.xlsx'), join(A, 'pull-all.xlsx')],
      { encoding: 'utf8', timeout: 180000 });
    const byId = Object.fromEntries(g1.map(r => [r.id, r]));
    for (const [f, hdrRow] of [['pull-om.csv', 0], ['pull-all.csv', 1]]) {
      const p = join(out, f);
      if (!existsSync(p)) { chk('LibreOffice converted ' + f, false, (conv.stderr || '').slice(-300)); continue; }
      const rows = readCsv(readFileSync(p, 'utf8'));
      const hdr = rows[hdrRow].map(normKey);
      const di = hdr.indexOf('date'), ei = hdr.indexOf('event description'), ti = hdr.indexOf('title');
      let n = 0; const bad = [];
      for (const r of rows.slice(hdrRow + 1)) {
        const id = (r[ei] || '').split(':')[0], it = byId[id];
        if (!it) continue;
        n++;
        if (it.dateCell === 'datetime' && r[di] !== it.date) bad.push(id + ' date ' + r[di] + ' want ' + it.date);
        if (r[ti] !== (it.raw.title ?? it.title)) bad.push(id + ' title ' + JSON.stringify(r[ti]));
      }
      chk('LibreOffice reads every O&M row of ' + f + ' with the dates and titles the manifest states', n >= 200 && !bad.length,
        n + ' rows; ' + bad.slice(0, 5).join('; '));
    }
    // the BAE reports: LibreOffice shows each money cell through the report's own format, $M to three decimals, so
    // every figure it prints must be the manifest's dollars over a million (and a text stays the text it is)
    for (const [f, rows] of [['bae.xlsx', R1], ['gen2/bae.xlsx', R2]]) {
      const od = join(S.dir, 'lo-' + f.replace(/\W/g, '_'));
      mkdirSync(od, { recursive: true });
      spawnSync('soffice', ['-env:UserInstallation=file://' + join(S.dir, 'loprof'), '--headless', '--convert-to',
        'csv:Text - txt - csv (StarCalc):44,34,76,1', '--outdir', od, join(A, f)], { encoding: 'utf8', timeout: 180000 });
      const p = join(od, 'bae.csv');
      if (!existsSync(p)) { chk('LibreOffice converted ' + f, false); continue; }
      const lines = readCsv(readFileSync(p, 'utf8'));
      const hdrRow = rows.find(r => r.kind !== 'total').row - 1;          // the row above the first written row
      const hdr = lines[hdrRow - 1].map(h => h.trim());
      const ci = pre => hdr.findIndex(h => h.startsWith(pre));
      const [ia, iu, iname] = [ci('Budget Approved'), ci('Budget Authorized'), ci('Budget Name')];
      const shownM = s => { const t = s.trim(); const neg = /^\(.*\)$/.test(t); const v = +t.replace(/[()$,]/g, ''); return neg ? -v : v; };
      const bad = [];
      let n = 0;
      for (const r of rows) {
        const line = lines[r.row - 1] || [];
        if (r.kind === 'skip') continue;
        n++;
        for (const [k, i] of [['approved', ia], ['authorized', iu]]) {
          const form = r.kind === 'data' ? r.forms[k] : 'total';
          if (typeof form === 'string' && form.startsWith('$')) { if (line[i] !== form) bad.push(r.row + ' ' + k + ' ' + line[i]); continue; }
          const cents = r.kind === 'total' ? r[k] * 100 : r[k];
          if (!(Math.abs(shownM(line[i]) * 1e8 - cents) <= 0.0005e8 + 1)) bad.push(r.row + ' ' + k + ' shows ' + line[i] + ' for ' + cents);
        }
        if (r.kind === 'total' && line[iname] !== '') bad.push('the total row has a name: ' + line[iname]);
      }
      eq('LibreOffice reads the 28 headers of ' + f, hdr.map(h => h.trim()).length, 28);
      chk('LibreOffice shows every amount of ' + f + ' as the manifest\'s dollars in $M, the total row included', n >= 100 && !bad.length,
        n + ' rows; ' + bad.slice(0, 5).join('; '));
    }
  } else {
    console.log('  (LibreOffice not found: the independent read of the fixture is skipped)');
  }

  // ----------------------------------------------- another seed: different data, the same rules must still hold
  const man7 = makeFixture(C, 7);
  for (const s of ['all', 'usaf-off', 'layout']) {
    const e = oracle(C, s);
    if (!e) continue;
    if (s !== 'layout') { againstManifest('seed 7 ' + s, e, fromManifest(man7.gen1, sets[s])); structure('seed 7 ' + s, e); }
    else {
      const all7 = JSON.parse(readFileSync(join(C, 'exp', 'all.json'), 'utf8'));
      delete all7.input; delete e.input;
      chk('seed 7 layout: the same rows in other layouts give the same values', JSON.stringify(all7) === JSON.stringify(e));
    }
  }
  // the BAE report built on another pull: the design holds whatever rows the seed draws
  {
    const B7 = man7.bae, g7 = man7.gen1;
    const r7g2 = [...man7.gen2, ...g7.filter(r => r.tab === 'sp' || r.tab === 'opn')];
    const a7 = JSON.parse(readFileSync(join(C, 'exp', 'all.json'), 'utf8'));
    compareBae('seed 7 bae-all', oracle(C, 'bae-all'), baeExpect(g7, B7.gen1, B7.budgetPmo, { asOf: '2026-10', first: 2025 }), a7);
    compareBae('seed 7 bae-gen2', oracle(C, 'bae-gen2'), baeExpect(r7g2, B7.gen2, B7.budgetPmo, { asOf: '2026-10', first: 2025 }), oracle(C, 'gen2'));
    const X7 = baeExpect(g7, B7.gen1, B7.budgetPmo, { asOf: '2026-10', first: 2025 });
    chk('seed 7: still uncovered blocks, planShort blocks and a report-only budget', X7.lists.uncovered.length >= 2 &&
      X7.lists.planShort.length >= 1 && X7.lists.reportOnly.length >= 3, JSON.stringify([X7.lists.uncovered, X7.lists.planShort.length]));
  }

  // §15 on another seed's obbba/: the same rules, whatever rows the seed draws
  {
    const O7 = man7.obbba, p7 = {};
    for (const [s, o] of Object.entries(OB_SC)) {
      const e = p7[s] = oracle(C, s);
      if (!e) continue;
      againstManifest('seed 7 ' + s, e, fromManifest(O7.pull, o));
      structure('seed 7 ' + s, e);
      obbbaAgainst('seed 7 ' + s, e, O7.pull, o);
    }
    compareBae('seed 7 bae-obbba', oracle(C, 'bae-obbba'), baeExpect(O7.pull, O7.bae, O7.budgetPmo, { asOf: '2026-10', first: 2025 }), p7.obbba);
  }
} catch (e) {
  chk('the test ran to the end', false, e && e.stack || String(e));
} finally {
  S.rm();
}
T.done();
