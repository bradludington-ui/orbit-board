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
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
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
  const counted = r => r.ap && !r.bad.length && r.fy >= first && !svcOff.includes(r.svc) && lanes.includes(r.lane);
  for (const r of rows) {
    byAp[r.ap || 'unidentified'] = (byAp[r.ap || 'unidentified'] || 0) + 1;
    if (r.bad.length) ex.unreadableRows++;
    else if (!r.ap) ex.unidentified += r.cents;
    else if (r.fy < first) ex.beforeFirst += r.cents;
    if (r.ap && r.fy !== null && r.fy >= first) {
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

// ===================================================================================================================
const S = scratchDir('sfcbsp-fixture-');
try {
  const A = join(S.dir, 'a'), B = join(S.dir, 'b'), C = join(S.dir, 'c');
  const man = makeFixture(A);
  makeFixture(B);
  // ---------------------------------------------------------------------------------------------- determinism
  const files = () => ['pull-all.xlsx', 'pull-om.xlsx', 'pull-ff.csv', 'pull-sp-opn.xlsx', 'gen2/pull-om.xlsx', 'gen2/pull-ff.csv', 'manifest.json'];
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

  // ---------------------------------------------------------------------------- refusals (§3: nothing changes)
  {
    const r1 = py([ORACLE, '--files', join(A, 'pull-all.xlsx'), join(A, 'pull-all.xlsx'), '--out', join(S.dir, 'r1.json')]);
    const j1 = existsSync(join(S.dir, 'r1.json')) ? JSON.parse(readFileSync(join(S.dir, 'r1.json'), 'utf8')) : {};
    chk('a file given twice is refused', r1.status === 3 && /twice/.test(j1.refused || ''), (j1.refused || r1.stderr).slice(0, 200));
    const r2 = py([ORACLE, '--files', join(A, 'pull-all.xlsx'), join(A, 'pull-om.xlsx'), '--out', join(S.dir, 'r2.json')]);
    const j2 = existsSync(join(S.dir, 'r2.json')) ? JSON.parse(readFileSync(join(S.dir, 'r2.json'), 'utf8')) : {};
    chk('O&M from two sheets is refused, naming both', r2.status === 3 && /O&M Raw Data/.test(j2.refused || '') && /Report/.test(j2.refused || ''),
      (j2.refused || r2.stderr).slice(0, 300));
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
} catch (e) {
  chk('the test ran to the end', false, e && e.stack || String(e));
} finally {
  S.rm();
}
T.done();
