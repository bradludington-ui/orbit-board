// The Excel workbook with a BAE report of budgets loaded (CONTRACT §14.5–§14.6), and without one (§14: nothing changes).
//
// With a report, the workbook is written from the synthetic fixture's pull and report, READ BACK with Python's openpyxl
// (test/export-read.py) and with LibreOffice, and every figure is compared to test/fixture/oracle.py, which works them
// out from the fixture files alone (§14.8): the stoplight tables on the report's Approved and Authorized, with their
// marks (§ on Approved, † and ‡ on Authorized) and a line for each mark used; every totals band, on every sheet, on the
// CCaR plan (rule 6) with the label's word; the PMO tabs on the budgets (rules 4 and 7) and their notes; the BAE Report
// sheet, row by row and cell by cell against the report file itself; the Import Report's BAE section and the Settings
// sheet's report and Authorized table.
//
// Without a report, the workbook is compared CELL FOR CELL with one written by the code before the report existed:
// the sources at commit 0c71592 (on main: the first dashboard, with no §14 in it), read from git and booted beside the
// current ones. Not a figure, a style, a merge or a row height may differ.
//
//   node scope/test/export-bae.test.mjs
// The test runs in a zone that is not UTC, so an import time the workbook writes in UTC cannot pass for this computer's
// own (review XP-9). Set before any date is made.
process.env.TZ = 'America/New_York';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadTool, checks, scratchDir } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');
const MAKE = join(HERE, 'fixture', 'make_fixture.py');
const ORACLE = join(HERE, 'fixture', 'oracle.py');
const READ = join(HERE, 'export-read.py');
const C = checks('export-bae');
const tmp = scratchDir('sfcbsp-export-bae-');
const MODS = ['util', 'xlsx-read', 'import', 'engine', 'xlsx-write', 'export'];
const t = loadTool({ modules: MODS });
const SP = t.SP;
const NOW = '2026-11-09T12:00:00.000Z', TODAY = '2026-11-09';
// the code before §14 (CONTRACT §14: "with no BAE report loaded, nothing in §1–§13 changes"), on main
const BEFORE = '0c71592';

// ------------------------------------------------------------------------------------------------ restated from §2–§14
// Restated, never read from the tool: a change on either side is then a disagreement this test reports, not an echo.
const COLS = ['prior', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12', 'next', 'nodate'];
const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const AP_LABEL = { om: 'O&M', ff: 'Full Fund', sp: 'Initial Spares', opn: 'OPN' };
const AP_ORDER = ['om', 'ff', 'sp', 'opn'], PMO_TAB_ORDER = ['ff', 'sp', 'om', 'opn'];
const RAW_SHEET = { om: 'O&M Raw Data', ff: 'FF Raw Data', sp: 'Spares Raw Data', opn: 'OPN Raw Data' };
const STATUS_FILL = { green: '00B050', yellow: 'FFD700', red: 'C00000' };
const STATUS_WORD = { green: 'On track', yellow: 'Within 10', red: 'Behind' };
const CUI = 'CUI//REL TO US DoW';
const FM = '#,##0.00;(#,##0.00);-', TINY_FM = '"<0.01";"(<0.01)";-';
const markFm = m => '#,##0.00"' + m + '";(#,##0.00)"' + m + '";-"' + m + '"';
const tinyMarkFm = m => '"<0.01' + m + '";"(<0.01)' + m + '";-"' + m + '"';
// §14.5 and §8: what each mark means, the words the screen and the workbook print
const SECT = 'Approved is the CCaR plan: the BAE report has no figure for this block.';
const DAGGER = 'Authorized was neither entered nor in the BAE report; Approved is shown in its place (on a total, for the rows marked †).';
// with a BAE report loaded ‡ is on every typed figure, whatever the switches, and says so (answer 8, review I4-4)
const DDAGGER = 'Authorized as entered, for the appropriation and FY as a whole: it is used in place of the BAE report’s figure, where the report has one, and covers every service and lane, whatever the switches show.';
const LINE2_TAIL = ' | Obligated = CCaR status "Actual Execution" | Unobligated = Approved - Obligated | Delta = Obl% - OSD%';
// §14.6 rule 6, said on the Slide blocks view and under the Slide Snapshots sheet's line 3 alike (review P4-6)
const SLIDE_NOTE = 'The slide blocks measure the CCaR plan by month, as they always have: where the BAE report has figures for a block, its Approved on the '
  + 'Summary is the report’s, and the block’s Obligation % row says “CCaR plan” beside the plan it measures.';
// §14.6 the Settings sheet: what the Used column is, in the marks it prints (review P4-7)
const USED_NOTE = 'Used is the typed figure where one is typed (marked ‡: it covers every service and lane, whatever the switches show), else the BAE report’s'
  + ' (which counts only what the switches show), else Approved, which is then the CCaR plan (marked †). Typing a figure on the Settings view sets it;'
  + ' clearing it goes back to the BAE report’s.';
const PMO_TAB_ORDER_LABELS = ['air vehicle (av)', 'business operations (bop)', 'combat data systems (cds)', 'maintenance systems (mxs)',
  'propulsion (pp)', 'product support management (psm)', 'training systems (tss)'];
const normKey = s => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const pad2 = n => String(n).padStart(2, '0');
const commas = d => d.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const show = v => JSON.stringify(v);
const sum = a => a.reduce((x, y) => x + y, 0);
// §2 fmtM, restated: $M to two decimals, '-' for zero, '<0.01' under $5,000, negatives in parentheses
function fmtM(c) {
  if (c === 0) return '-';
  const a = Math.abs(c);
  let body;
  if (a < 500000) body = '<0.01';
  else { let q = Math.floor(a / 1e6); if (a - q * 1e6 >= 500000) q++; body = commas(String(Math.floor(q / 100))) + '.' + pad2(q % 100); }
  return c < 0 ? '(' + body + ')' : body;
}
// $M inside a sentence: zero written 0.00 (the Obligation % label, the PMO strip)
const mSent = c => (c === 0 ? '0.00' : fmtM(c));
// whole dollars and cents, as the Import Report writes them: $1,234.56, -$1,234.56
const usd = c => (c < 0 ? '-' : '') + '$' + commas(String(Math.floor(Math.abs(c) / 100))) + '.' + pad2(Math.abs(c) % 100);
const rows1 = n => n + (n === 1 ? ' row' : ' rows');
// §16.2 restated (it replaced review M4-3's sentence on budget names with rules 4 and 7): the line a PMO tab's figures are
// explained by, and the report money no plan event uses, on a PMO tab, in the Summary's note and in the Import report's two
// lists; and review M4-6, the money a covered block's plan and Obligated count that its Approved leaves out
const PE_LINE = 'Approved and Authorized are the BAE report’s figures for the budgets this PMO’s plan events are assigned to; a budget the plan events of '
  + 'several PMOs use is split among them by each one’s CCaR plan on it. Obligated counts this PMO’s plan events.';
const unMoney = X => X.bae.unassigned.filter(u => u.approved !== 0 || u.authorized !== 0);
const unList = us => us.map(u => AP_LABEL[u.ap] + ' FY' + u.fy + ' $' + mSent(u.approved) + 'M').join('; ');
const unTabLine = us => unList(us) + ' of the BAE report’s Approved is on budgets no plan event uses; it is in the Summary and on no PMO tab (see the Import report).';
// review P5-2: each block names its unassigned Approved AND Authorized (the PMO tabs' Authorized falls short of the Summary's
// by the latter), and a block whose Authorized is typed is named, since a typed figure is never shared among the PMOs
const andL = l => l.length > 1 ? l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1] : l.join('');
const typedOf = X => Object.keys(X.blocks).filter(k => X.blocks[k].authorizedEntered).map(k => AP_LABEL[k.split('|')[0]] + ' FY' + k.split('|')[1]);
const unSummaryNote = (us, typed) => 'The PMO tabs share each budget’s Approved and Authorized among the PMOs whose plan events use it, by their CCaR plan on it. '
  + us.map(u => AP_LABEL[u.ap] + ' FY' + u.fy + ' $' + mSent(u.approved) + 'M Approved and $' + mSent(u.authorized) + 'M Authorized').join('; ')
  + ' of the BAE report’s money is on budgets no plan event uses, so the PMO tabs add up to the Summary less it.'
  + (typed.length ? ' An Authorized typed in Settings (marked ‡: ' + andL(typed) + ') is for its block as a whole and is never shared among the PMOs, '
    + 'so there the PMO tabs’ Authorized need not add up to the Summary’s.' : '');
const figs16 = t => 'Approved ' + usd(t.approved) + ', Authorized ' + usd(t.authorized);
const splitItem = e => '    ' + AP_LABEL[e.ap] + ' FY' + e.fy + ': “' + e.name + '” (' + figs16(e) + '), by each PMO’s CCaR plan on it, largest share first: '
  + e.pmos.map(p => p.pmo + ', plan ' + usd(p.plan) + ': ' + figs16(p)).join('; ') + '.';
const unItem = (u, t) => '    ' + AP_LABEL[u.ap] + ' FY' + u.fy + ': “' + t.name + '” (' + figs16(t) + '): '
  + (t.why === 'nopull' ? 'no plan event uses it in this block' : 'its plan events’ plan is not above zero') + '.';
const OFF_KIND = { flyaway: 'Flyaway (production)', noap: 'Names no appropriation', blank: 'No Budget' };
const OFF_WORD = { flyaway: ['Flyaway (production) budget', 'Flyaway (production) budgets'], noap: ['budget that names no appropriation', 'budgets that name no appropriation'],
  blank: ['row with no Budget', 'rows with no Budget'] };
const offNote = o => {
  const w = [];
  for (const k of ['flyaway', 'noap', 'blank']) {
    const of = o.budgets.filter(b => b.kind === k), c = k === 'blank' ? of.reduce((x, b) => x + b.rows, 0) : of.length;
    if (c) w.push(c + ' ' + OFF_WORD[k][c === 1 ? 0 : 1]);
  }
  const m = c => '$' + mSent(c) + 'M';
  return AP_LABEL[o.ap] + ' FY' + o.fy + ': the CCaR plan counts ' + m(o.planned) + ' on ' + (w.length > 1 ? w.slice(0, -1).join(', ') + ' and ' + w[w.length - 1] : w[0])
    + ', which the BAE report’s Approved leaves out' + (o.obligated !== 0 ? '; ' + m(o.obligated) + ' of it is obligated, so Obligated and Obl % count money that Approved does not.'
      : ', so the plan counts money that Approved does not.') + ' See the Import report.';
};
const offLine = list => 'Obligated includes money executed on budgets the BAE report’s Approved leaves out (Flyaway (production), a budget that names no appropriation, '
  + 'or no Budget at all): ' + list.map(([k, c]) => AP_LABEL[k.split('|')[0]] + ' FY' + k.split('|')[1] + ' $' + mSent(c) + 'M').join('; ')
  + '. Obl % there counts it against an Approved that does not.';
function tabSorted(labels) {
  const rank = l => { const i = PMO_TAB_ORDER_LABELS.indexOf(normKey(l)); return i >= 0 ? [0, i] : l === '(no PMO)' ? [2, 0] : [1, 0]; };
  return labels.slice().sort((a, b) => { const x = rank(a), y = rank(b); return x[0] - y[0] || x[1] - y[1] || cmp(a, b); });
}
function localWhen(iso) {
  const d = new Date(iso);
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}
const SERVICES = ['USAF', 'USAF ANG', 'USAF AFRC', 'USMC B (STOVL)', 'USMC C (USMC CV)', 'USN (USN CV)', 'Service not identified'];
function shownText(X) {
  if (X.shown.all) return 'All services, both lanes';
  const sv = X.shown.services.length === SERVICES.length ? 'all' : X.shown.services.length ? X.shown.services.join(', ') : 'none';
  const ln = X.shown.lanes.length ? X.shown.lanes.map(l => (l === 'disc' ? 'Discretionary' : 'Mandatory')).join(', ') : 'none';
  return 'Services shown: ' + sv + '; lanes shown: ' + ln;
}

// ------------------------------------------------------------------------------------------------ the read-back
function py(args, input) { return spawnSync('python3', ['-I', ...args], { encoding: 'utf8', maxBuffer: 1 << 30, input }); }
function readBook(file) {
  const r = py([READ, file]);
  if (r.status !== 0) throw new Error('export-read.py failed: ' + r.stderr.slice(-800));
  return JSON.parse(r.stdout);
}
function soffice(args, out) {
  mkdirSync(out, { recursive: true });
  return spawnSync('soffice', ['-env:UserInstallation=file://' + join(tmp.dir, 'lo-profile'), '--headless', '--norestore', ...args,
    '--outdir', out], { encoding: 'utf8', timeout: 240000 });
}
// st = [fill, fontColour, bold, italic, numberFormat, size, indent, horizontal, vertical]
function sheetView(book, name) {
  const s = book.sheets.find(x => x.name === name);
  if (!s) return null;
  const rows = s.rows.map(r => {
    const m = new Map();
    for (const [ci, v, si] of r.cells) m.set(ci, { v, st: book.styles[si] });
    return { r: r.r, level: r.level, hidden: r.hidden, ht: r.ht, m, v: ci => (m.has(ci) ? m.get(ci).v : null), st: ci => (m.has(ci) ? m.get(ci).st : null) };
  });
  return { s, rows };
}
const isBlank = row => !row || [...row.m.values()].every(c => c.v === null || c.v === undefined || c.v === '');
function moneyOk(got, want) {
  if (want === null || want === undefined) return got === null || got === undefined;
  return typeof got === 'number' && Math.abs(got - want / 1e8) <= 1e-9;
}
function pctOk(got, want) {
  if (want === null || want === undefined) return got === null || got === undefined;
  return typeof got === 'number' && Math.abs(got - want) <= 1e-12;
}
// the mark a money cell carries, read off its number format: '', '§', '†', '‡' or '†‡'; null for a format that is no mark
function markOf(st) {
  const f = String((st || [])[4] || '');
  if (f === FM || f === TINY_FM) return '';
  for (const m of ['§', '†‡', '†', '‡']) if (f === markFm(m) || f === tinyMarkFm(m)) return m;
  return null;
}
const marksOf = x => ({ sect: !!(x.marks && x.marks.sect), dag: !!(x.marks && x.marks.dagger), ddag: !!(x.marks && x.marks.ddagger) });
const authMarkOf = mk => (mk.dag ? '†' : '') + (mk.ddag ? '‡' : '');
// the block columns: A label, B Total, Prior Yr … FY{E+1}+ [, No date], then Total
function blockLayout(X) {
  const ids = COLS.slice(0, 14).concat(X.showNoDate ? ['nodate'] : []);
  const at = {};
  ids.forEach((id, j) => { at[id] = 2 + j; });
  return { ids, at, last: 2 + ids.length, W: 3 + ids.length };
}

// ------------------------------------------------------------------------------------------------ the plan's totals band
// Monthly Totals, Cumulative Totals, Obligation %, OSD Goal %, OSD Status from row i, held to the plan p:
//   {total, cols, cum, obl:{id:[v, kind]}, goalC, statusC:{id:[status, kind]}, oblPct, goal, status, word}
// where word is the label's 'CCaR plan' or 'Approved' (§14.5) and total is the plan (rule 6), never a report's Approved
function checkPlanBand(where, rows, i, L, X, p) {
  const mt = rows[i], cu = rows[i + 1], ob = rows[i + 2], go = rows[i + 3], stt = rows[i + 4];
  C.eq(where + ': the totals band labels', [mt, cu, go, stt].map(r => r && r.v(0)), ['Monthly Totals', 'Cumulative Totals', 'OSD Goal %', 'OSD Status']);
  const bad = [];
  const money = (r, what, total, cols) => {
    if (!r) { bad.push(what + ' missing'); return; }
    if (!moneyOk(r.v(1), total) || !moneyOk(r.v(L.last), total)) bad.push(what + ' Total ' + r.v(1) + '/' + r.v(L.last) + ' want ' + total / 1e8);
    for (const id of L.ids) if (!moneyOk(r.v(L.at[id]), cols[id])) bad.push(what + ' ' + id + ' ' + r.v(L.at[id]) + ' want ' + (cols[id] === null ? null : cols[id] / 1e8));
  };
  money(mt, 'Monthly Totals', p.total, p.cols);
  money(cu, 'Cumulative Totals', p.total, p.cum);
  C.eq(where + ': the Obligation % label names the plan (' + p.word + ')', ob && ob.v(0),
    'Obligation %  (' + p.word + ' ' + mSent(p.total) + 'M; actual through ' + MONTHS[X.asOfIndex - 1] + ', plan after)');
  if (ob) {
    if (!pctOk(ob.v(1), p.oblPct) || !pctOk(ob.v(L.last), p.oblPct)) bad.push('Obl % Total ' + ob.v(1) + ' want ' + p.oblPct);
    if (p.obl) for (const id of L.ids) if (!pctOk(ob.v(L.at[id]), p.obl[id][0])) bad.push('Obl % ' + id + ' ' + ob.v(L.at[id]) + ' want ' + p.obl[id][0]);
  }
  if (go) {
    if (!pctOk(go.v(1), p.goal) || !pctOk(go.v(L.last), p.goal)) bad.push('Goal Total ' + go.v(1) + ' want ' + p.goal);
    if (p.goalC) for (const id of L.ids) if (!pctOk(go.v(L.at[id]), p.goalC[id])) bad.push('Goal ' + id + ' ' + go.v(L.at[id]) + ' want ' + p.goalC[id]);
  }
  if (stt) {
    const word = s => (s ? STATUS_WORD[s] : null);
    for (const c of [1, L.last]) {
      const v = stt.v(c), f = stt.st(c) && stt.st(c)[0];
      if (v !== word(p.status) || (p.status ? f !== STATUS_FILL[p.status] : Object.values(STATUS_FILL).includes(f))) bad.push('Status Total ' + v + '/' + f + ' want ' + p.status);
    }
    if (p.statusC) for (const id of L.ids) if (stt.v(L.at[id]) !== word(p.statusC[id][0])) bad.push('Status ' + id + ' ' + stt.v(L.at[id]) + ' want ' + p.statusC[id][0]);
  } else bad.push('OSD Status missing');
  C.chk(where + ': the totals band is the CCaR plan in every column and its Total (rule 6)', !bad.length, bad.slice(0, 5).join('; '));
  return i + 5;
}
// an oracle block's plan, as a band prints it
const planOf = x => ({ total: x.slide.basis, cols: x.cols, cum: x.cum, obl: x.obl, goalC: x.goalC, statusC: x.statusC,
  oblPct: x.slide.oblPct, goal: x.slide.goal, status: x.slide.status, word: x.covered ? 'CCaR plan' : 'Approved' });

// ------------------------------------------------------------------------------------------------ the code before §14
// The sources at BEFORE, from git, written into a scratch tree with its own build.mjs and booted from there: the page
// those sources build, exactly as that build would assemble it. Nothing is written to the repository. null when this
// clone does not hold that commit (a shallow clone): the check that needs it then fails, saying so.
async function toolBefore() {
  const ok = spawnSync('git', ['-C', REPO, 'cat-file', '-e', BEFORE + '^{commit}'], { encoding: 'utf8' });
  if (ok.status !== 0) return null;
  const root = join(tmp.dir, 'before', 'spend-plan');
  mkdirSync(join(root, 'src'), { recursive: true });
  const ls = spawnSync('git', ['-C', REPO, 'ls-tree', '--name-only', BEFORE, 'spend-plan/src/'], { encoding: 'utf8' });
  const files = ['spend-plan/build.mjs'].concat(ls.stdout.split('\n').filter(Boolean));
  for (const f of files) {
    const r = spawnSync('git', ['-C', REPO, 'show', BEFORE + ':' + f], { maxBuffer: 1 << 28 });
    if (r.status !== 0) return null;
    writeFileSync(join(root, f.replace(/^spend-plan\//, '')), r.stdout);
  }
  const { assemble } = await import(pathToFileURL(join(root, 'build.mjs')).href);
  return loadTool({ html: assemble({ modules: MODS }) });
}

// ------------------------------------------------------------------------------------------------ the fixture
const ab = p => { const b = readFileSync(p); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };
function oracle(name, args) {
  const out = join(tmp.dir, 'exp-' + name + '.json');
  const r = py([ORACLE, ...args, '--out', out]);
  if (r.status !== 0) throw new Error('the oracle failed on ' + name + ': ' + r.stderr.slice(-800));
  return JSON.parse(readFileSync(out, 'utf8'));
}
// the report file as openpyxl reads it: every row, every cell, as the tool keeps a column it does not read (text: a
// whole number as its digits, other text trimmed). Python never reads the tool's output here, only the fixture's file.
function reportFile(file) {
  const r = py(['-c', `
import json, sys, openpyxl
ws = openpyxl.load_workbook(sys.argv[1]).worksheets[0]
def txt(v):
    if v is None: return None
    if isinstance(v, bool): return str(v).upper()
    if isinstance(v, int) or (isinstance(v, float) and v.is_integer()): return str(int(v))
    s = str(v).strip()
    return s if s != '' else None
rows = []
for r in ws.iter_rows():
    rows.append({'r': r[0].row, 'cells': [txt(c.value) for c in r]})
print(json.dumps(rows))
`, file]);
  if (r.status !== 0) throw new Error('reading the report file failed: ' + r.stderr.slice(-800));
  return JSON.parse(r.stdout);
}

let before = null;
try {
  C.eq('the modules boot with no script errors', t.errors, []);
  const mk = py([MAKE, '--out', tmp.dir]);
  if (mk.status !== 0) throw new Error('make_fixture failed: ' + mk.stderr);
  const manifest = JSON.parse(readFileSync(join(tmp.dir, 'manifest.json'), 'utf8'));
  const MB = manifest.bae;
  // the report's rows in file order, its total row among them; the data rows and those that cannot be read
  const gen1 = MB.gen1.slice().sort((a, b) => a.row - b.row);
  const nData = gen1.filter(it => it.kind === 'data').length, nBad = gen1.filter(it => it.kind === 'data' && it.bad.length).length;
  const totalRowNo = (gen1.find(it => it.kind === 'total') || {}).row;
  // the same report under the name the real one carries, so its date is read from its name (§14.1)
  const STAMPED = 'Report__BAE_ALL_Services_USAF_and_DoN_2026-01-31_120000.xlsx';
  copyFileSync(join(tmp.dir, 'bae.xlsx'), join(tmp.dir, STAMPED));
  const pullFile = { name: 'pull-all.xlsx', data: ab(join(tmp.dir, 'pull-all.xlsx')) };
  const parsed = await SP.parseFiles([pullFile, { name: 'bae.xlsx', data: ab(join(tmp.dir, 'bae.xlsx')) }], { now: NOW });
  const parsedS = await SP.parseFiles([pullFile, { name: STAMPED, data: ab(join(tmp.dir, STAMPED)) }], { now: NOW });
  C.chk('the import brings the pull and the report', !!parsed.bae && Array.isArray(parsed.bae.rows) && !!parsed.pulls.om && !!parsed.report.bae);
  // the store adds the import's time (§14.7)
  const baeOf = p => Object.assign({}, p.bae, { importedAt: NOW });
  const FILE = reportFile(join(tmp.dir, 'bae.xlsx'));
  const ENT = { 'om|2026': 39876543210, 'sp|2025': 8000000000 };

  // ============================================================================================ with a report (§14.6)
  // bae-all and bae-usaf-off are checked figure for figure; bae-entered and bae-entered-off add a typed Authorized, so
  // the ‡ and the Settings sheet's Typed column are read back too. bae-usaf-off imports the report under its dated name.
  const SCEN = [
    { name: 'bae-all', p: parsed, plain: ['--files', join(tmp.dir, 'pull-all.xlsx')] },
    { name: 'bae-usaf-off', p: parsedS, off: ['USAF'], stamp: '2026-01-31 12:00', plain: ['--files', join(tmp.dir, 'pull-all.xlsx'), '--svc-off', 'USAF'] },
    { name: 'bae-entered', p: parsed, auth: ENT, plain: ['--files', join(tmp.dir, 'pull-all.xlsx')] },
    { name: 'bae-entered-off', p: parsed, auth: ENT, off: ['USN (USN CV)'], plain: ['--files', join(tmp.dir, 'pull-all.xlsx'), '--svc-off', 'USN (USN CV)'] },
  ];
  let allFile = null, allX = null, allSheets = 0;
  for (const sc of SCEN) {
    const X = oracle(sc.name, ['--scenario', sc.name, '--fixture', tmp.dir]);
    // the same pulls and switches with no report: the plan every totals band must still print (rule 6)
    const X0 = oracle(sc.name + '-plain', sc.plain);
    const settings = SP.defaultSettings(TODAY);
    settings.asOf = X.asOf; settings.firstFY = X.firstFY;
    if (sc.auth) settings.authorized = JSON.parse(JSON.stringify(sc.auth));
    const view = SP.defaultView();
    for (const s of sc.off || []) view.svc[s] = false;
    const bae = baeOf(sc.p);
    const model = SP.buildModel(sc.p.pulls, settings, view, bae);
    const bytes = await SP.excelBytes(model, sc.p.pulls, settings, { report: sc.p.report, today: TODAY, bae });
    C.eq(sc.name + ': the writer changed nothing on the way out', SP.lastXlsxNotes.messages, []);
    const file = join(tmp.dir, sc.name + '.xlsx');
    writeFileSync(file, bytes);
    const B = readBook(file);
    const names = B.sheets.map(s => s.name);
    const SX = shownText(X), L = blockLayout(X), w0 = sc.name;
    const when = sc.stamp || TODAY;

    // ------------------------------------------------------------------------- the sheets: the BAE Report after the raw data
    const apsWith = AP_ORDER.filter(ap => Object.keys(X.blocks).some(k => k.startsWith(ap + '|')));
    const pmoLabels = tabSorted(Object.keys(X.pmoTabs));
    const rawAps = AP_ORDER.filter(ap => X.rowsByAp[ap] !== undefined);
    C.eq(w0 + ': the sheets, in order, the BAE Report after the raw data (§14.6)', names, ['Summary', 'Slide Snapshots'].concat(apsWith.map(ap => AP_LABEL[ap]),
      pmoLabels.map(l => 'PMO ' + X.pmoCodes[l]), ['Not Allocated'], rawAps.map(ap => RAW_SHEET[ap]), ['BAE Report', 'Import Report', 'Settings']));
    const pb = [];
    for (const s of B.sheets) {
      const h = s.header.center, f = s.footer.center;
      if (!(h && h.text === CUI) || !(f && f.text === CUI)) pb.push(s.name + ' CUI');
      const data = /Raw Data$|^BAE Report$/.test(s.name);
      if (data ? s.fitToPage || s.grid === false : !s.fitToPage || s.grid !== false) pb.push(s.name + ' fit ' + s.fitToPage + ' grid ' + s.grid);
      if (s.formulas) pb.push(s.name + ' holds formulas');
    }
    C.chk(w0 + ': every sheet carries the CUI marking; the BAE Report prints at full size with gridlines, as a raw data sheet; no formulas', !pb.length, pb.slice(0, 5).join('; '));

    // ------------------------------------------------------------------------- the stoplight tables (§14.3, §14.5)
    // one FY table row: Approved and its §, Authorized and its † or ‡, Obligated, Unobligated, Obl %, goal, delta, status
    const figRow = (where, row, c0, x, mk, bad) => {
      if (!row) { bad.push(where + ' has no row'); return; }
      if (!moneyOk(row.v(c0), x.approved)) bad.push(where + ' approved ' + row.v(c0) + ' want ' + x.approved / 1e8);
      if (!moneyOk(row.v(c0 + 1), x.authorized)) bad.push(where + ' authorized ' + row.v(c0 + 1) + ' want ' + x.authorized / 1e8);
      if (!moneyOk(row.v(c0 + 2), x.obligated)) bad.push(where + ' obligated ' + row.v(c0 + 2));
      if (!moneyOk(row.v(c0 + 3), x.unobligated)) bad.push(where + ' unobligated ' + row.v(c0 + 3));
      if (!pctOk(row.v(c0 + 4), x.oblPct)) bad.push(where + ' Obl % ' + row.v(c0 + 4) + ' want ' + x.oblPct);
      if (x.goal === undefined && [5, 6, 7].some(d => row.v(c0 + d) !== null)) bad.push(where + ' has a goal, delta or status');
      if (x.goal !== undefined && !pctOk(row.v(c0 + 5), x.goal)) bad.push(where + ' goal ' + row.v(c0 + 5));
      if (x.delta !== undefined && !pctOk(row.v(c0 + 6), Math.abs(x.delta || 0) <= 1e-12 && x.delta !== null ? 0 : x.delta)) bad.push(where + ' delta ' + row.v(c0 + 6));
      if (x.status !== undefined && row.v(c0 + 7) !== (x.status ? STATUS_WORD[x.status] : null)) bad.push(where + ' status ' + row.v(c0 + 7) + ' want ' + x.status);
      const am = markOf(row.st(c0)), dm = markOf(row.st(c0 + 1));
      if (am !== (mk.sect ? '§' : '')) bad.push(where + ' Approved mark ' + show(am) + ' want ' + (mk.sect ? '§' : 'none'));
      if (dm !== authMarkOf(mk)) bad.push(where + ' Authorized mark ' + show(dm) + ' want ' + show(authMarkOf(mk)));
    };
    // the lines under a table: one per mark used, in its words, and no line for a mark not used
    const markLines = (where, rows, from, mk) => {
      const got = [];
      for (let i = from; i < rows.length && ['§', '†', '‡'].includes(rows[i].v(0)); i++) got.push([rows[i].v(0), rows[i].v(1)]);
      const want = [];
      if (mk.sect) want.push(['§', SECT]);
      if (mk.dag) want.push(['†', DAGGER]);
      if (mk.ddag) want.push(['‡', DDAGGER]);
      C.eq(where + ': a line for each mark the table uses, saying what it means (§14.5)', got, want);
      return from + got.length;
    };
    const anyMark = list => ({ sect: list.some(x => x.sect), dag: list.some(x => x.dag), ddag: list.some(x => x.ddag) });

    // ------------------------------------------------------------------------- §8.1 the Summary
    {
      const S = sheetView(B, 'Summary'), rows = S.rows, w = w0 + ' Summary';
      C.eq(w + ': line 2 says Approved and Authorized are the BAE report’s, and of when (§14.5)', rows[1].v(0),
        'Data through Oct-2026 | Approved, Authorized = BAE report of ' + when + ' (sustainment budgets)' + LINE2_TAIL);
      C.eq(w + ': line 3 is the shown text', rows[2].v(0), SX);
      const keys = Object.keys(X.blocks), bad = [];
      keys.forEach((k, j) => figRow(k, rows[4 + j], 2, X.blocks[k], marksOf(X.blocks[k]), bad));
      const T = X.summary, tm = marksOf(T), tr = rows[4 + keys.length];
      C.chk(w + ': the oracle’s blocks carry each mark the scenario is meant to show', !sc.auth || !sc.off || keys.some(k => X.blocks[k].marks.ddagger), sc.name);
      if (!tr || tr.v(0) !== 'TOTAL - Sustainment') bad.push('no TOTAL row');
      else figRow('TOTAL', tr, 2, { approved: T.approved, authorized: T.authorized, obligated: T.obligated, unobligated: T.unobligated, oblPct: T.oblPct }, tm, bad);
      C.chk(w + ': every block and the TOTAL against the oracle: the report’s figures, each with its marks', !bad.length, bad.slice(0, 6).join('; '));
      C.chk(w + ': the TOTAL carries each mark its rows carry', JSON.stringify(tm) === JSON.stringify(anyMark(keys.map(k => marksOf(X.blocks[k])))), show(tm));
      const leg = rows.findIndex(r => r.v(0) === 'Legend (OSD Status):');
      markLines(w, rows, leg + 4, tm);
      const ni = rows.findIndex(r => r.v(0) === 'Notes:');
      const ns = ni < 0 ? [] : rows.slice(ni + 1).map(r => r.v(0)).filter(Boolean);
      C.eq(w + ': the notes are the model’s, every one, in order', ns, model.summary.notes);
      C.chk(w + ': a note on the report itself (§14.5)', ns.some(n => /^Approved and Authorized come from the BAE report /.test(n) && n.includes(rows1(X.bae.rows.in))), ns.join(' / ').slice(0, 300));
      // §16.2: the report money no plan event uses, named once, so the PMO tabs are not read as adding up to the Summary
      C.eq(w + ': the note on report money no plan event uses (§16.2), from the oracle', ns.filter(n => n.startsWith('The PMO tabs share')),
        unMoney(X).length ? [unSummaryNote(unMoney(X), typedOf(X))] : []);
      // rule 5: each block whose CCaR plan is under half the report's Approved, flagged in the Summary's notes
      for (const p of X.bae.planShort) {
        const label = AP_LABEL[p.ap] + ' FY' + p.fy;
        C.chk(w + ': ' + label + ' is flagged: its CCaR plan is under half the report’s Approved (rule 5)', ns.includes(label + ': the CCaR plan ($' + mSent(p.planned)
          + 'M) is ' + Math.round(100 * p.planned / p.approved) + '% of the BAE report’s Approved ($' + mSent(p.approved) + 'M); Obl % is measured against the report’s figure.'),
          ns.filter(n => n.startsWith(label)).join(' / '));
      }
      if (X.bae.uncovered.length) {
        const n = ns.find(x => /^The BAE report has no figure for /.test(x)) || '';
        C.chk(w + ': the blocks the report does not cover are named, marked §', n.includes('§') && X.bae.uncovered.every(u => n.includes(AP_LABEL[u.ap] + ' FY' + u.fy)), n);
      }
      // review M4-6: each covered block whose plan and Obligated hold money on budgets its Approved can never hold, named
      for (const o of X.bae.offReport) {
        const label = AP_LABEL[o.ap] + ' FY' + o.fy;
        C.chk(w + ': ' + label + ' names the money its Approved leaves out (M4-6)', ns.includes(offNote(o)), offNote(o) + ' | ' + ns.filter(n => n.startsWith(label)).join(' / '));
      }
      if (sc.name === 'bae-all') C.chk('bae-all: the fixture holds a planShort block and an uncovered one, so the checks above have something to read',
        X.bae.planShort.length > 0 && X.bae.uncovered.length > 0 && X.bae.offReport.length > 0);
    }

    // ------------------------------------------------------------------------- §8.3–8.5 the appropriation sheets
    for (const ap of apsWith) {
      const S = sheetView(B, AP_LABEL[ap]), rows = S.rows, w = w0 + ' ' + AP_LABEL[ap];
      C.eq(w + ': the title names both sources of its figures', rows[0].v(0), 'F-35 Sustainment ' + AP_LABEL[ap]
        + ' - Spend Plan & FY Summary (from the CCaR pull imported ' + TODAY + ' and the BAE report of ' + when + ')');
      const keys = Object.keys(X.blocks).filter(k => X.blocks[k].ap === ap), bad = [];
      keys.forEach((k, j) => {
        const row = rows[3 + j];
        if (!row || row.v(0) !== X.blocks[k].fy) { bad.push(k + ' FY ' + (row && row.v(0))); return; }
        figRow(k, row, 1, X.blocks[k], marksOf(X.blocks[k]), bad);
      });
      const A = X.aps[ap], tr = rows[3 + keys.length];
      if (!tr || tr.v(0) !== 'Total - All FYs') bad.push('no Total - All FYs');
      else figRow('Total - All FYs', tr, 1, { approved: A.approved, authorized: A.authorized, obligated: A.obligated, unobligated: A.unobligated, oblPct: A.oblPct }, marksOf(A), bad);
      C.chk(w + ': the FY table and its total against the oracle, each with its marks', !bad.length, bad.slice(0, 6).join('; '));
      markLines(w, rows, 4 + keys.length, marksOf(A));
      const bars = rows.map((r, i) => [i, r.v(0)]).filter(([i, v]) => typeof v === 'string' && /^FY\d{4} - Spend Plan by PMO/.test(v));
      C.eq(w + ': one block per FY', bars.length, keys.length);
      bars.forEach(([i], j) => {
        const k = keys[j];
        if (!k) return;
        let r = i + 2;
        while (r < rows.length && !isBlank(rows[r])) r++;
        checkPlanBand(w + ' ' + k, rows, r + 1, L, X, planOf(X.blocks[k]));
      });
    }

    // ------------------------------------------------------------------------- §8.2 the slide blocks: on the plan
    {
      const rows = sheetView(B, 'Slide Snapshots').rows, keys = Object.keys(X.blocks);
      // under line 3, the sheet says what the blocks measure, as the Slide blocks view does (review P4-6)
      C.eq(w0 + ' Slides: under line 3, the blocks are said to measure the CCaR plan while the Summary’s Approved is the report’s', [rows[2].v(0), rows[3].v(0)], [SX, SLIDE_NOTE]);
      const bars = rows.map((r, i) => [i, r.v(0)]).filter(([i, v]) => typeof v === 'string' && / - Spend Plan \(PMO Summary, slide-ready\)$/.test(v));
      C.eq(w0 + ' Slides: one block per block', bars.length, keys.length);
      bars.forEach(([i], j) => {
        const k = keys[j], x = X.blocks[k];
        if (!x) return;
        const got = [];
        let r = i + 2;
        for (; r < rows.length && !isBlank(rows[r]); r++) got.push(rows[r].v(0));
        C.eq(w0 + ' Slides ' + k + ': the PMO rows are the plan’s, by the PMO column', got, Object.keys(x.pmos));
        checkPlanBand(w0 + ' Slides ' + k, rows, r + 1, L, X, planOf(x));
      });
    }

    // ------------------------------------------------------------------------- §8.6 the PMO tabs: on the budgets (§14.4)
    for (const label of pmoLabels) {
      const name = 'PMO ' + X.pmoCodes[label], S = sheetView(B, name), w = w0 + ' ' + name;
      if (!C.chk(w + ' exists', !!S)) continue;
      const rows = S.rows, tab = X.pmoTabs[label];
      const keys = Object.keys(tab).sort((a, b) => {
        const [pa, fa] = a.split('|'), [pb2, fb] = b.split('|');
        return PMO_TAB_ORDER.indexOf(pa) - PMO_TAB_ORDER.indexOf(pb2) || Number(fa) - Number(fb);
      });
      // §14.4: a row on the budgets carries no mark; a row the report does not cover is §4.6's, Approved the plan (§)
      // and Authorized that Approved (†); the strip below carries the same
      const rmk = k => ({ sect: tab[k].sect, dag: tab[k].sect, ddag: false });
      const bad = [];
      keys.forEach((k, j) => {
        const row = rows[3 + j];
        if (!row || row.v(1) !== Number(k.split('|')[1])) { bad.push(k + ' row ' + (row && row.v(1))); return; }
        if (tab[k].basis !== (tab[k].sect ? 'row' : 'planEvent')) bad.push(k + ' the oracle’s basis and § disagree');
        figRow(k, row, 2, tab[k], rmk(k), bad);
      });
      const ta = sum(keys.map(k => tab[k].approved)), tu = sum(keys.map(k => tab[k].authorized)), to = sum(keys.map(k => tab[k].obligated));
      const tm = anyMark(keys.map(rmk)), tr = rows[3 + keys.length];
      if (!tr || tr.v(0) !== 'Total - All') bad.push('no Total - All');
      else figRow('Total - All', tr, 2, { approved: ta, authorized: tu, obligated: to, unobligated: ta - to, oblPct: ta ? to / ta : null }, tm, bad);
      C.chk(w + ': the table is the PMO’s share of the budgets its plan events use where the report covers a block, §4.6’s elsewhere, each with its marks', !bad.length, bad.slice(0, 6).join('; '));
      let at = markLines(w, rows, 4 + keys.length, tm);
      const notes = [];
      for (; at < rows.length && !isBlank(rows[at]) && typeof rows[at].v(0) === 'string' && !rows[at].st(0)[0]; at++) notes.push(rows[at].v(0));
      const onPE = keys.some(k => tab[k].basis === 'planEvent'), onRows = keys.some(k => tab[k].basis !== 'planEvent');
      // §16.2: every tab, (no PMO) too, says the same of a covered row, then the report money its blocks hold that no plan
      // event uses, when there is some (§14.4's sentences on budget names went with rules 4 and 7)
      C.eq(w + ': it says what its figures count, in §16.2’s words, when a row is on its plan events', notes[0] === PE_LINE, onPE);
      C.chk(w + ': and never §14.4’s words on budget names', !notes.some(n => /end(s)? in (this|any) PMO’s code/.test(n)), notes.join(' / '));
      // (the blocks in the tab's own row order, §8.6: Full Fund, Initial Spares, O&M, OPN, as its table and its M4-6 line)
      const unT = keys.filter(k => tab[k].basis === 'planEvent').map(k => unMoney(X).find(u => u.ap + '|' + u.fy === k)).filter(Boolean);
      C.eq(w + ': it names the report money no plan event uses on the blocks it shows, only where there is some (§16.2)',
        notes.filter(n => n.endsWith('it is in the Summary and on no PMO tab (see the Import report).')), unT.length ? [unTabLine(unT)] : []);
      const offRows = keys.filter(k => tab[k].basis === 'planEvent' && tab[k].offObligated !== 0);
      C.eq(w + ': it names the Obligated its Approved leaves out, block by block, only where there is some (M4-6)', notes.filter(n => n.startsWith('Obligated includes money executed')),
        offRows.length ? [offLine(offRows.map(k => [k, tab[k].offObligated]))] : []);
      C.eq(w + ': it says a PMO row shows Approved only of the blocks the report does not cover', notes.includes(
        'Authorized is entered by appropriation and FY; where the BAE report has no figure for a block, its PMO row shows Approved.'), onRows);
      const typed = keys.filter(k => tab[k].basis === 'planEvent' && sc.auth && sc.auth[k] !== undefined);
      C.eq(w + ': a typed Authorized on a block it shows on the budgets is said never to be split among the PMOs', notes.some(n => /never split among the PMOs/.test(n)
        && typed.every(k => n.includes(AP_LABEL[k.split('|')[0]] + ' FY' + k.split('|')[1]))), typed.length > 0);
      const bars = rows.map((r, i) => [i, r.v(0), r.st(0)]).filter(([i, v, st]) => typeof v === 'string' && st && st[0] === '305496');
      C.eq(w + ': one block per row of its table', bars.map(b => b[1]), keys.map(k => AP_LABEL[k.split('|')[0]] + ' - FY' + k.split('|')[1]));
      bars.forEach(([i], j) => {
        const k = keys[j], x = tab[k], [ap, fy] = k.split('|');
        if (!x) return;
        const sm = x.sect ? '§' : '', dm = x.sect ? '†' : '';
        C.eq(w + ' ' + k + ': the strip prints the table’s row for this block, with its marks', rows[i + 2] && rows[i + 2].v(0), AP_LABEL[ap] + ' FY' + fy
          + ' Summary  |  Approved ' + mSent(x.approved) + 'M' + sm + '  |  Authorized ' + mSent(x.authorized) + 'M' + dm + '  |  Obligated ' + mSent(x.obligated)
          + 'M  |  Unobligated ' + mSent(x.unobligated) + 'M');
        let r = i + 3;
        while (r < rows.length && !isBlank(rows[r])) r++;
        // the band is the PMO's plan by its own PMO column: the no-report oracle's PMO tab (§16.1: every PMO with a row has
        // plan events there; a budget's name gives none a row); the goal is the block's
        const p0 = X0.pmoTabs[label] && X0.pmoTabs[label][k];
        if (C.chk(w + ' ' + k + ': the PMO has plan events in the block (§16.1)', !!p0)) C.eq(w + ' ' + k + ': the oracle’s detail columns are the no-report PMO tab’s', x.cols, p0.cols);
        const cum = {}; let run = 0;
        for (const id of COLS.slice(0, 14)) { run += x.cols[id]; cum[id] = run; }
        cum.nodate = null;
        checkPlanBand(w + ' ' + k, rows, r + 1, L, X, { total: x.planned, cols: x.cols, cum, obl: null, goalC: null, statusC: null,
          oblPct: p0 ? p0.oblPct : null, goal: X.blocks[k].goal, status: p0 ? p0.status : null, word: x.basis === 'planEvent' ? 'CCaR plan' : 'Approved' });
        if (p0) C.chk(w + ' ' + k + ': its plan is the no-report PMO tab’s', x.planned === p0.approved, x.planned + ' vs ' + p0.approved);
      });
    }

    // ------------------------------------------------------------------------- §14.6 the BAE Report sheet
    if (C.chk(w0 + ': the workbook has a BAE Report sheet', !!sheetView(B, 'BAE Report'))) {
      const S = sheetView(B, 'BAE Report'), rows = S.rows, w = w0 + ' BAE Report';
      const head = []; for (let i = 0; i < 60; i++) if (rows[0].v(i) !== null) head.push(rows[0].v(i));
      const nh = MB.headers.length;
      C.eq(w + ': every column the file has, in its order, then Appropriation, Service, Lane, PMO, Counted', head,
        MB.headers.concat(['Appropriation', 'Service', 'Lane', 'PMO', 'Counted']));
      C.eq(w + ': the file’s header row is the report’s', FILE[0].cells, MB.headers);
      C.eq(w + ': frozen below row 1', S.s.freeze, 'A2');
      const counted = new Map(X.bae.counted.map(([rn, why]) => [rn, why]));
      // §16.2 the PMO column: where a counting row's money goes, as the oracle works it out; blank on a row that does not count
      const goes = new Map(X.bae.pmoColumn.map(([rn, g]) => [rn, g === '' ? null : g]));
      const data = rows.slice(1).filter(r => !isBlank(r));
      C.eq(w + ': one row per row of the report, its total row included, in file order', data.length, FILE.length - 1);
      const bad = [];
      let n = 0;
      for (const it of gen1) {
        const row = data[n++], fr = FILE.find(f => f.r === it.row);
        if (!row || !fr) { bad.push('row ' + it.row + ' missing'); continue; }
        // in file order: the sheet's n-th data row is the file's n-th, and the file has no blank row between them
        if (row.r !== it.row) bad.push('row ' + it.row + ' written at ' + row.r);
        if (it.kind === 'total') {
          if (row.v(0) !== null || row.v(1) !== null) bad.push('the total row has a name or FY');
          if (!(typeof row.v(2) === 'number' && Math.abs(row.v(2) - Math.round(it.approved * 100) / 100) < 1e-6)) bad.push('the total row’s Approved ' + row.v(2));
          if (!(typeof row.v(3) === 'number' && Math.abs(row.v(3) - Math.round(it.authorized * 100) / 100) < 1e-6)) bad.push('the total row’s Authorized ' + row.v(3));
          if (!/^No: the report’s own total row, never counted/.test(String(row.v(nh + 4)))) bad.push('the total row’s Counted ' + show(row.v(nh + 4)));
          if ([0, 1, 2, 3].some(k => row.v(nh + k) !== null)) bad.push('the total row is given an appropriation, service, lane or PMO');
          continue;
        }
        if (row.v(0) !== it.name) bad.push(it.row + ' name ' + show(row.v(0)));
        if (row.v(1) !== it.fy) bad.push(it.row + ' FY ' + show(row.v(1)));
        for (const [ci, k] of [[2, 'approved'], [3, 'authorized']]) {
          const v = row.v(ci), st = row.st(ci) || [];
          if (it[k] === null) {
            // could not be read: the text as the file holds it, in red, never a number
            if (v !== it.forms[k] || st[1] !== 'C00000') bad.push(it.row + ' ' + k + ' ' + show(v) + ' ' + show(st[1]) + ' want the text ' + it.forms[k] + ' in red');
          } else if (!(typeof v === 'number' && Math.abs(v - it[k] / 100) < 1e-9 && st[4] === '#,##0.00')) bad.push(it.row + ' ' + k + ' ' + show(v) + ' ' + show(st[4]) + ' want ' + it[k] / 100);
        }
        for (let ci = 4; ci < nh; ci++) if (row.v(ci) !== fr.cells[ci]) { bad.push(it.row + ' ' + MB.headers[ci] + ' ' + show(row.v(ci)) + ' want ' + show(fr.cells[ci])); break; }
        const want = [it.ap ? AP_LABEL[it.ap] : null, it.svc, it.lane === 'mand' ? 'Mandatory' : 'Discretionary', goes.get(it.row), counted.get(it.row)];
        const got = [0, 1, 2, 3, 4].map(k => row.v(nh + k));
        if (JSON.stringify(got) !== JSON.stringify(want)) bad.push(it.row + ' derived ' + show(got) + ' want ' + show(want));
      }
      C.chk(w + ': every row against the report file and the oracle (name, FY, amounts in dollars, every other column, appropriation, service, lane, PMO, counted)',
        !bad.length && n === data.length, bad.slice(0, 5).join('; ') + ' (' + n + ' of ' + data.length + ')');
      const gv = [...goes.values()];
      C.chk(w + ': the PMO column holds a split among PMOs, a single PMO and “No plan event uses it” (§16.2)', gv.some(g => g && g.includes('; ')) && gv.some(g => g && / 100\.0%$/.test(g))
        && gv.includes('No plan event uses it') && gv.includes(null), [...new Set(gv)].slice(0, 6).join(' / '));
      // §14.6's Counted words, each a reading the oracle gives one row or another
      const whys = new Set(X.bae.counted.map(c => c[1]));
      C.chk(w + ': the Counted column holds Yes and every reason this fixture gives (' + [...whys].join(', ') + ')',
        [...whys].every(y => ['Yes', 'Flyaway (production)', 'Names no appropriation', 'Before the first FY', 'Could not be read', 'Switch off'].includes(y))
        && whys.has('Yes') && whys.has('Flyaway (production)') && whys.has('Names no appropriation') && whys.has('Could not be read')
        && (!(sc.off && sc.off.length) || whys.has('Switch off')), [...whys].join(', '));
      // the rows marked Yes of a block's appropriation and FY add to what the stoplight tables print for the blocks the
      // report covers (§14.3): a reader can filter this sheet on Yes and arrive at the Summary's figures
      let yesA = 0;
      for (const it of gen1) if (it.kind === 'data' && counted.get(it.row) === 'Yes' && X.blocks[it.ap + '|' + it.fy]) yesA += it.approved;
      C.eq(w + ': the rows marked Yes, within the blocks, add to the covered blocks’ Approved', yesA,
        sum(Object.values(X.blocks).filter(b => b.covered).map(b => b.approved)));
    }

    // ------------------------------------------------------------------------- §14.6 the Import Report's BAE section
    {
      const IR = sheetView(B, 'Import Report').rows.map(r => r.v(0)).filter(Boolean), w = w0 + ' Import Report';
      const file = sc.stamp ? STAMPED : 'bae.xlsx';
      C.chk(w + ': the report is named among what the workbook holds, with its date and its import', IR.includes('  BAE report of budgets: “' + file + '” › “Sheet1”, '
        + (sc.stamp ? 'dated ' + sc.stamp + ' by its file name' : 'with no date in its file name') + ', imported ' + localWhen(NOW) + '.'), IR.slice(0, 8).join(' / '));
      C.chk(w + ': the import’s own BAE part: file, sheet, rows read, the total row checked', IR.some(l => l.startsWith('BAE report of budgets: “' + file + '” › “Sheet1”'))
        && IR.includes('  Rows read: ' + nData + ' (' + (nData - nBad) + ' readable, ' + nBad + ' unreadable). Blank rows skipped: 0.')
        && IR.some(l => l.startsWith('  Total row (row ' + totalRowNo + ', ') && l.endsWith('it agrees (within $1 each).')), IR.filter(l => /^ {2}(Rows read|Total row)/.test(l)).join(' / '));
      const h = IR.indexOf('The BAE report of budgets of ' + when + ' (“' + file + '”), as the figures read it:');
      // a missing section fails here, and the scenario goes on to the Settings sheet
      if (C.chk(w + ': the section on the report as the figures read it', h >= 0, IR.slice(-30).join(' / '))) {
        const S = IR.slice(h + 1);
        const r = X.bae.rows;
        C.chk(w + ': rows by scope (§14.6)', S[0].includes(rows1(r.in) + ' of sustainment budgets') && S[0].includes(rows1(r.flyaway) + ' of Full Fund Flyaway')
          && S[0].includes(rows1(r.noap) + ' naming no appropriation') && S[0].includes(rows1(r.bad) + ' that could not be read'), S[0]);
        // in model order (§14.8: appropriations as SP.APS, then FY); the oracle's object keeps its keys in the order it met them
        const byKey = ([a], [b]) => AP_ORDER.indexOf(a.split('|')[0]) - AP_ORDER.indexOf(b.split('|')[0]) || Number(a.split('|')[1]) - Number(b.split('|')[1]);
        const by = Object.entries(X.bae.byBlock).sort(byKey).map(([k, v]) => '    ' + AP_LABEL[k.split('|')[0]] + ' FY' + k.split('|')[1] + ': Approved ' + usd(v.approved)
          + ', Authorized ' + usd(v.authorized) + '.');
        C.eq(w + ': the sustainment budgets’ Approved and Authorized by appropriation and FY, every one, in order', S.slice(2, 2 + by.length), by);
        let i = 2 + by.length;
        C.chk(w + ': the planShort blocks, flagged (rule 5)', S[i].endsWith(X.bae.planShort.length ? X.bae.planShort.length + '.' : 'none.'), S[i]);
        // the lists worked out on the blocks as the switches leave them say so, with what is shown, when something is
        // hidden; the lines beside them say they cover every service and lane (review P4-4)
        const swW = X.shown.all ? '' : ', with the switches as they are (' + SX + ')';
        C.eq(w + ': the planShort line says it counts with the switches as they are, when they hide something (P4-4)', S[i],
          '  Blocks whose CCaR plan is under half the BAE report’s Approved (flagged, never hidden: Obl % is measured against the report’s figure)' + swW + ': '
          + (X.bae.planShort.length ? X.bae.planShort.length + '.' : 'none.'));
        const ps = X.bae.planShort.map(p => '    ' + AP_LABEL[p.ap] + ' FY' + p.fy + ': the CCaR plan ' + usd(p.planned) + ' is ' + Math.round(100 * p.planned / p.approved)
          + '% of the report’s Approved ' + usd(p.approved) + '.');
        C.eq(w + ': each planShort block, its plan against the report’s Approved', S.slice(i + 1, i + 1 + ps.length), ps);
        i += 1 + ps.length;
        const list = () => { const out = []; for (i++; i < S.length && S[i].startsWith('    '); i++) out.push(S[i].trim().replace(/^“|”$/g, '')); return out; };
        // review P4-4 changed this expectation: on a filtered workbook the line says it counts with the switches as they are
        C.eq(w + ': the budgets the pull counts with no report row, said to count with the switches as they are when they hide something (P4-4)', S[i],
          '  Budgets the CCaR pull counts that have no row in the BAE report' + swW + ': ' + (X.bae.pullOnly.length ? X.bae.pullOnly.length + '.' : 'none.'));
        const po = list();
        C.eq(w + ': … each named, as the oracle has them', po.map(normKey).sort(cmp), X.bae.pullOnly);
        C.chk(w + ': the report’s budgets with money and no pull row', new RegExp('^ {2}Sustainment budgets the BAE report holds money for, FY' + X.firstFY + ' to FY' + X.E).test(S[i] || ''), S[i]);
        const ro = list();
        C.eq(w + ': … each named, as the oracle has them', ro.map(normKey).sort(cmp), X.bae.reportOnly);
        C.chk(w + ': the fixture has a budget on each side, so both lists have something to read', X.bae.pullOnly.length > 0 && X.bae.reportOnly.length > 0);
        // review M4-6: the money a covered block's plan and Obligated count that its Approved never can, budget by budget
        const items = X.bae.offReport.flatMap(o => o.budgets.map(b => '    ' + AP_LABEL[o.ap] + ' FY' + o.fy + ': ' + (b.name === '' ? '(no Budget, ' + rows1(b.rows) + ')' : '“' + b.name + '”')
          + ' (' + OFF_KIND[b.kind] + '): CCaR plan ' + usd(b.planned) + ', obligated ' + usd(b.obligated) + '.'));
        C.chk(w + ': the budgets a covered block counts that its Approved leaves out', /^ {2}Budgets the CCaR pull counts on a block the BAE report covers, which its Approved leaves out /.test(S[i] || '')
          && (S[i] || '').endsWith(items.length ? items.length + '.' : 'none.'), S[i]);
        C.chk(w + ': … said to count with the switches as they are, when they hide something (P4-4)', (S[i] || '').endsWith('Approved never can)' + swW + ': ' + (items.length ? items.length + '.' : 'none.')), S[i]);
        const ol = [];
        for (i++; i < S.length && S[i].startsWith('    '); i++) ol.push(S[i]);
        C.eq(w + ': … each named, with its block, its kind, its plan and its obligations, as the oracle has them', ol, items);
        // §16.2 the two lists on how the PMO tabs share the report, each "none" when empty, each saying it counts with the
        // switches as they are when they hide something
        const spI = X.bae.split.map(splitItem), unI = X.bae.unassigned.flatMap(u => u.budgets.map(t => unItem(u, t)));
        for (const [head, its] of [['Budgets split among PMOs by their plan events', spI], ['BAE report money no plan event uses (on no PMO tab)', unI]]) {
          C.eq(w + ': §16.2 “' + head + '”, said to count with the switches as they are when they hide something', S[i], '  ' + head + swW + ': ' + (its.length ? its.length + '.' : 'none.'));
          const got = [];
          for (i++; i < S.length && S[i].startsWith('    '); i++) got.push(S[i]);
          C.eq(w + ': … each, as the oracle has it', got, its);
        }
        C.chk(w + ': the fixture puts something in both §16 lists', spI.length > 0 && unI.length > 0);
      }
    }

    // ------------------------------------------------------------------------- §14.6 the Settings sheet
    {
      const ST = sheetView(B, 'Settings').rows, w = w0 + ' Settings';
      const kv = k => { const r = ST.find(x => x.v(0) === k); return r ? r.v(1) : undefined; };
      C.eq(w + ': the report: file, sheet, date, imported', [kv('File'), kv('Sheet'), kv('Date'), kv('Imported')],
        [sc.stamp ? STAMPED : 'bae.xlsx', 'Sheet1', sc.stamp ? sc.stamp + ' (from its file name)' : 'None in its file name: it is known by the day it was imported',
          localWhen(NOW) + ' (this computer’s time)']);
      const hi = ST.findIndex(x => x.v(0) === 'Block' && x.v(1) === 'Typed');
      C.eq(w + ': the Authorized table is Block, Typed, BAE report, Used (§14.6)', hi < 0 ? null : [0, 1, 2, 3].map(c => ST[hi].v(c)), ['Block', 'Typed', 'BAE report', 'Used']);
      const keys = Object.keys(X.blocks), bad = [];
      keys.forEach((k, j) => {
        const x = X.blocks[k], row = ST[hi + 1 + j];
        if (!row || row.v(0) !== AP_LABEL[x.ap] + ' FY' + x.fy) { bad.push(k + ' row ' + (row && row.v(0))); return; }
        const typed = sc.auth && sc.auth[k] !== undefined ? sc.auth[k] : null;
        if (!moneyOk(row.v(1), typed)) bad.push(k + ' typed ' + row.v(1));
        // the report's figure for the block under these switches: Authorized where it is the one used; the whole report's
        // (every service) where a typed figure stands in front of it with every switch on; 'No figure' where it has none
        const rep = !x.covered ? 'No figure' : x.authorizedSrc === 'report' ? x.authorized : X.shown.all ? X.bae.byBlock[k].authorized : undefined;
        if (rep === 'No figure' ? row.v(2) !== 'No figure' : rep !== undefined && !moneyOk(row.v(2), rep)) bad.push(k + ' BAE report ' + row.v(2) + ' want ' + rep);
        if (!moneyOk(row.v(3), x.authorized)) bad.push(k + ' used ' + row.v(3) + ' want ' + x.authorized / 1e8);
        if ((x.authorizedSrc === 'entered') !== (typed !== null)) bad.push(k + ' the oracle’s source and the typed figure disagree');
      });
      C.chk(w + ': each block’s typed, report and used Authorized against the oracle', !bad.length, bad.slice(0, 5).join('; '));
      // review P4-7: Used carries the mark every table prints beside that Authorized, as the Settings view marks it, with a
      // line for each mark used under the table; no § (there is no Approved column), and the note promises only those marks
      const um = [], used = { dag: false, ddag: false };
      keys.forEach((k, j) => {
        const x = X.blocks[k], row = ST[hi + 1 + j], want = (x.marks.dagger ? '†' : '') + (x.marks.ddagger ? '‡' : '');
        if (x.marks.dagger) used.dag = true;
        if (x.marks.ddagger) used.ddag = true;
        if (!row || markOf(row.st(3)) !== want) um.push(k + ' Used mark ' + show(row && markOf(row.st(3))) + ' want ' + show(want));
      });
      C.chk(w + ': Used carries each block’s mark, as the Settings view does (P4-7)', !um.length, um.slice(0, 5).join('; '));
      C.chk(w + ': the scenario’s Used column carries a mark to see', used.dag || used.ddag);
      // the lines between the table (and any typed figure with no block under it) and the note on what Used is
      const ni = ST.findIndex((x, i) => i > hi && typeof x.v(0) === 'string' && x.v(0).startsWith('Used is '));
      const lines = ST.slice(hi + 1 + keys.length, ni < 0 ? ST.length : ni).map(x => x.v(0)).filter(v => typeof v === 'string' && /^[§†‡] /.test(v));
      C.eq(w + ': under the table, a line for each mark Used carries, in §14.5’s words (P4-7)', lines, (used.dag ? ['† ' + DAGGER] : []).concat(used.ddag ? ['‡ ' + DDAGGER] : []));
      C.eq(w + ': then what Used is, naming only the marks it prints (P4-7)', ni < 0 ? null : ST[ni].v(0), USED_NOTE);
      // review P4-8, BP4-6: one comma before the BAE clause of the switches heading
      C.eq(w + ': the switches heading names what covers every service and lane, in one sentence (P4-8)', (ST.find(x => typeof x.v(0) === 'string' && x.v(0).startsWith('Switches (')) || { v: () => null }).v(0),
        'Switches (this browser’s view; every figure counts only what is shown, except an entered Authorized and the Summary’s notes on rows not counted, '
        + 'and what the Summary’s note and the Import Report say of the BAE report as a whole, which cover every service and lane)');
      if (sc.auth) C.chk(w + ': the scenario types on a covered block and an uncovered one, so both columns have something to read',
        X.blocks['om|2026'].covered && !X.blocks['sp|2025'].covered && X.blocks['om|2026'].authorizedSrc === 'entered');
      C.chk(w + ': the old “Authorized entered” list is not printed beside the table', !ST.some(x => x.v(0) === 'Authorized entered ($M)'));
    }

    if (sc.name === 'bae-all') { allFile = file; allX = X; allSheets = names.length; }
  }

  // ============================================================================================ LibreOffice
  // another program shows the marks as the formats say, and opens every sheet, the BAE Report's 34 columns included
  {
    const lo = join(tmp.dir, 'lo-csv');
    const r = soffice(['--convert-to', 'csv:Text - txt - csv (StarCalc):44,34,76,1,,0,false,true,true,false,false,-1', allFile], lo);
    const files = existsSync(lo) ? readdirSync(lo).filter(f => f.endsWith('.csv')) : [];
    C.chk('LibreOffice converts every sheet of the workbook with a report', r.status === 0 && files.some(f => /BAE Report/.test(f)) && files.length === allSheets
      && !/\bError\b/.test((r.stdout || '') + (r.stderr || '')), 'status ' + r.status + ', ' + files.length + ' of ' + allSheets + ' sheets; ' + ((r.stderr || '') + (r.stdout || '')).slice(-300));
    const CSV = JSON.parse(py([READ, 'csv', lo]).stdout || '{}');
    const get = re => CSV[Object.keys(CSV).find(k => re.test(k))] || [];
    const tot = get(/-Summary\.csv$/).find(row => row[0] === 'TOTAL - Sustainment');
    const m2 = c => { const a = Math.abs(c); let q = Math.floor(a / 1e6); if (a - q * 1e6 >= 500000) q++; return (c < 0 && q ? '-' : '') + commas(String(Math.floor(q / 100))) + '.' + pad2(q % 100); };
    C.eq('LibreOffice shows the TOTAL: Approved marked §, Authorized marked †', tot ? [tot[2], tot[3]] : null,
      [m2(allX.summary.approved) + '§', m2(allX.summary.authorized) + '†']);
    const br = get(/-BAE Report\.csv$/);
    C.eq('LibreOffice reads the BAE Report sheet’s header row', br[0] ? br[0].slice(-5) : null, ['Appropriation', 'Service', 'Lane', 'PMO', 'Counted']);
  }

  // ============================================================================================ a report kept from before
  // the last import brought pulls only: the report on screen is listed from its own rows (SP.baeKeptLines), or its
  // unreadable rows and its total row's check would be in no sheet of the workbook
  {
    const pullsOnly = await SP.parseFiles([pullFile], { now: '2026-11-10T15:00:00.000Z' });
    const s = SP.defaultSettings(TODAY);
    const bae = baeOf(parsed);
    const M = SP.buildModel(pullsOnly.pulls, s, SP.defaultView(), bae);
    const spec = SP.excelSpec(M, pullsOnly.pulls, s, { report: pullsOnly.report, today: TODAY, bae });
    const IR = spec.sheets.find(x => x.name === 'Import Report').rows.map(r => r.cells[0] && r.cells[0].v).filter(Boolean);
    C.chk('a report kept over a later import of pulls is listed from its own rows, with its unreadable row and its total row checked',
      IR.some(l => l.startsWith('BAE report of budgets on screen, kept from an earlier import (' + localWhen(NOW) + ')'))
      && gen1.filter(it => it.kind === 'data' && it.bad.length).every(it => IR.some(l => l.includes(' row ' + it.row + ': ')))
      && IR.filter(l => l.startsWith('  Total row (row ' + totalRowNo + ',')).length === 1, IR.filter(l => /BAE/.test(l)).join(' / '));
    C.chk('… and the last import’s own lines say it brought no report', !IR.some(l => l.startsWith('BAE report of budgets: ')));
  }

  // ============================================================================================ the report must be the model's
  {
    const s = SP.defaultSettings(TODAY), bae = baeOf(parsed);
    const M = SP.buildModel(parsed.pulls, s, SP.defaultView(), bae);
    const short = Object.assign({}, bae, { rows: bae.rows.slice(1) });
    let err = null;
    try { SP.excelSpec(M, parsed.pulls, s, { report: parsed.report, today: TODAY, bae: short }); } catch (e) { err = e; }
    C.chk('a report other than the one the figures were worked out from is refused, never written beside them', err && /not the one its figures were worked out from/.test(err.message), err && err.message);
    err = null;
    try { SP.excelSpec(M, parsed.pulls, s, { report: parsed.report, today: TODAY }); } catch (e) { err = e; }
    C.chk('figures from a report, with no report given to write its sheet: refused, said', err && /the report itself was not given/.test(err.message), err && err.message);
  }

  // ============================================================================================ a plan just under half
  // review P4-9: a block flagged as under half is never said to be 50% of the report's Approved. §14.5's example rounds to
  // a whole percent (3.57% is "4%"), and a plan from 49.5% up to half rounded to 50: "is 50% of the BAE report's Approved"
  // under "under half". One row of a report, sized against the fixture's own O&M FY2025 plan, at 49.99%, 49.49% and 40%.
  {
    const s = SP.defaultSettings(TODAY);
    s.asOf = '2026-10'; s.firstFY = 2025;
    const P = SP.buildModel(parsed.pulls, s, SP.defaultView()).blocks.find(b => b.key === 'om|2025').approved;
    const H = ['Budget Name', 'Budget FY Numeric', 'Budget Approved Amount', 'Budget Authorized Amount'];
    for (const [ratio, word] of [[0.4999, 'under 50%'], [0.4949, '49%'], [0.4, '40%']]) {
      const appr = Math.ceil(P / ratio);
      const bae = { headers: H, cols: H, rows: [{ c: ['USAF O&M Invented Probe Line Discretionary AV', 2025, appr, appr], x: {}, src: [0, 'Sheet1', 2] }],
        file: 'invented.xlsx', sheet: 'Sheet1', stamp: null, total: null, importedAt: NOW };
      const M = SP.buildModel(parsed.pulls, s, SP.defaultView(), bae);
      const b = M.blocks.find(x => x.key === 'om|2025');
      if (!C.chk('P4-9 ' + word + ': the fixture sizes a flagged block at that ratio', b && b.planShort && Math.abs(b.planned / b.approved - ratio) < 1e-6, b && b.planned / b.approved)) continue;
      C.chk('P4-9 ' + word + ': the Summary’s note says the plan is ' + word + ' of the report’s Approved', M.summary.notes.includes('O&M FY2025: the CCaR plan ($' + mSent(b.planned)
        + 'M) is ' + word + ' of the BAE report’s Approved ($' + mSent(b.approved) + 'M); Obl % is measured against the report’s figure.'), M.summary.notes.filter(n => /CCaR plan \(/.test(n)).join(' / '));
      C.chk('P4-9 ' + word + ': … and so does the Import Report', SP.baeModelLines(M).includes('    O&M FY2025: the CCaR plan ' + usd(b.planned) + ' is ' + word
        + ' of the report’s Approved ' + usd(b.approved) + '.'), SP.baeModelLines(M).filter(l => /% of/.test(l)).join(' / '));
    }
  }

  // ============================================================================================ the UI action
  {
    const caught = [];
    const realDownload = SP.download;
    SP.download = (name, bytes, mime) => { caught.push({ name, bytes, mime }); return name; };
    const settings = SP.defaultSettings(TODAY);
    SP.state = { v: 1, tool: 'sfcb-spend-plan', savedAt: null, settings, pulls: { current: parsed.pulls, previous: {} }, history: [],
      lastImport: { report: parsed.report }, bae: { current: baeOf(parsed), previous: null } };
    SP.getView = () => SP.defaultView();
    const res = await SP.exportExcel();
    C.chk('exportExcel with a report on screen writes it, with its BAE Report sheet', res && res.ok === true && caught.length === 1 && res.sheets === allSheets, show(res));
    if (caught.length) {
      const f = join(tmp.dir, 'ui.xlsx');
      writeFileSync(f, caught[0].bytes);
      const B = readBook(f);
      C.chk('… its Summary on the report’s figures', sheetView(B, 'Summary').rows[1].v(0).includes('Approved, Authorized = BAE report of ' + TODAY), sheetView(B, 'Summary').rows[1].v(0));
    }
    SP.download = realDownload;
    SP.state = null;
  }

  // ============================================================================================ with no report: as before
  // CONTRACT §14: "with no BAE report loaded, nothing in §1–§13 changes". The workbook the code at BEFORE writes and the
  // one this code writes, from the same pull, settings and switches, compared: first the spec the writer is given (every
  // cell's value and style, every merge, height, outline level, page break, freeze and page setting), then the files
  // themselves read back with openpyxl. Their core properties hold the time of writing, so their bytes are not compared.
  before = await toolBefore();
  if (C.chk('the code before the BAE report is in this clone (commit ' + BEFORE + ', on main); if this fails, run git fetch --unshallow', !!before)) {
    C.eq('the code before the BAE report boots with no script errors', before.errors, []);
    const SPb = before.SP;
    const pb = await SPb.parseFiles([{ name: 'pull-all.xlsx', data: ab(join(tmp.dir, 'pull-all.xlsx')) }], { now: NOW });
    const pn = await SP.parseFiles([pullFile], { now: NOW });
    const CASES = [
      { name: 'every switch on' },
      { name: 'USAF off', off: ['USAF'] },
      { name: 'mandatory only', lanes: ['mand'] },
      { name: 'Authorized typed, a switch off', auth: { 'om|2026': 50000000000, 'ff|2025': 0 }, off: ['USN (USN CV)'] },
      { name: 'data through 2026-03', asOf: '2026-03' },
      { name: 'first FY 2024', first: 2024 },
      // a report handed to the export, but a model built with none: the model decides, so nothing changes
      { name: 'a report given, none in the model', meta: true },
    ];
    for (const cs of CASES) {
      const mkS = (S) => {
        const s = S.defaultSettings(TODAY);
        if (cs.asOf) s.asOf = cs.asOf;
        if (cs.first) s.firstFY = cs.first;
        if (cs.auth) s.authorized = JSON.parse(JSON.stringify(cs.auth));
        return s;
      };
      const mkV = (S) => {
        const v = S.defaultView();
        for (const x of cs.off || []) v.svc[x] = false;
        if (cs.lanes) for (const l of ['disc', 'mand']) if (!cs.lanes.includes(l)) v.lane[l] = false;
        return v;
      };
      const sb = mkS(SPb), sn = mkS(SP);
      const Mb = SPb.buildModel(pb.pulls, sb, mkV(SPb)), Mn = SP.buildModel(pn.pulls, sn, mkV(SP));
      const metaB = { report: pb.report, today: TODAY }, metaN = { report: pn.report, today: TODAY };
      if (cs.meta) metaN.bae = baeOf(parsed);
      // the workbook's creator is the tool's name, SCOPE since CONTRACT §18: the older build's is read as today's
      const specB = JSON.stringify(SPb.excelSpec(Mb, pb.pulls, sb, metaB)).replace('"creator":"SFCB Spend Plan"', '"creator":"SCOPE"'), specN = JSON.stringify(SP.excelSpec(Mn, pn.pulls, sn, metaN));
      let at = 0; while (at < specB.length && specB[at] === specN[at]) at++;
      C.chk('no report, ' + cs.name + ': the workbook’s spec is the one the code before the report wrote, cell for cell', specB === specN,
        'first difference at ' + at + ': before …' + specB.slice(Math.max(0, at - 120), at + 80) + '… now …' + specN.slice(Math.max(0, at - 120), at + 80) + '…');
      const fb = join(tmp.dir, 'before-' + CASES.indexOf(cs) + '.xlsx'), fn = join(tmp.dir, 'now-' + CASES.indexOf(cs) + '.xlsx');
      writeFileSync(fb, await SPb.excelBytes(Mb, pb.pulls, sb, metaB));
      writeFileSync(fn, await SP.excelBytes(Mn, pn.pulls, sn, metaN));
      const Bb = readBook(fb), Bn = readBook(fn);
      const diffs = [];
      for (let i = 0; i < Math.max(Bb.sheets.length, Bn.sheets.length); i++) {
        const a = Bb.sheets[i], b = Bn.sheets[i];
        if (!a || !b) { diffs.push('sheet ' + i + ' only on one side: ' + ((a || b).name)); continue; }
        const lay = s => JSON.stringify(Object.assign({}, s, { rows: undefined }));
        if (lay(a) !== lay(b)) diffs.push(a.name + ': its page, outline, freeze, merges or widths');
        const cellsOf = (B, s) => s.rows.map(r => JSON.stringify([r.r, r.level, r.hidden, r.ht, r.cells.map(([c, v, si]) => [c, v, B.styles[si]])]));
        const ca = cellsOf(Bb, a), cb = cellsOf(Bn, b);
        if (ca.length !== cb.length) diffs.push(a.name + ': ' + ca.length + ' rows, now ' + cb.length);
        for (let j = 0; j < Math.min(ca.length, cb.length); j++) if (ca[j] !== cb[j]) { diffs.push(a.name + ' row ' + (j + 1) + ': ' + ca[j].slice(0, 200) + ' now ' + cb[j].slice(0, 200)); break; }
      }
      C.chk('no report, ' + cs.name + ': read back with openpyxl, every sheet, row and cell (value and style) is the same as before', !diffs.length, diffs.slice(0, 3).join('; '));
    }
  }
} catch (e) {
  C.chk('the test ran to the end', false, (e && e.stack) || String(e));
} finally {
  if (before) before.close();
  t.close();
  tmp.rm();
  C.done();
}
