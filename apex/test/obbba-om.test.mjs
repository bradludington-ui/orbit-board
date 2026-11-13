// FY2025 O&M OBBBA funding: O&M only, and marked in Budget Flex 02 too (CONTRACT §17; Brad, 11 Nov 2026: "Yes, leave out
// OBBBA funding for O&M but leave it in for Spares."). Every pull and report below is written here, by hand, as CSV, and
// every name and figure in them is invented. Each expectation is worked out from the rows this file writes, never read back
// from the tool's own figures.
//
// What it holds the tool to:
//   - SP.isObbba25(name, fy, ap, mark) is the one predicate: FY 2025, appropriation O&M, and the word OBBBA (whole, any case)
//     in the name or the mark (a report row's Budget Flex 02 text; for a pull row, whether the loaded report marks its
//     budget); SP.baeFlex02Col / SP.baeFlex02 read a stored report row's Budget Flex 02 (by its header, the first so
//     headed); SP.baeObbbaKeys gives the budgets the report marks (FY 2025, O&M, Flex 02 holding the word);
//   - a report row marked in Budget Flex 02 is FY2025 O&M OBBBA funding (scope obbba, obbbaBy 'flex02'), named AND flexed
//     is obbbaBy 'name'; O&M FY2026, Initial Spares, Full Fund and OPN FY2025 rows marked either way count (scope in);
//     Budget Flex 01 and 03 are never read; OBBBAX is a longer word; obbba in lower case marks; a report with no Budget
//     Flex 02 column is read by its names alone;
//   - a pull O&M FY2025 row on a budget only the report marks counts with no report, and is left out with it
//     (excluded.obbba.budgets[].by 'report'), an (ap, fy) whose only rows those are has no block, and an unreadable one
//     names none; OBBBA funding of every other appropriation counts exactly as if its name did not hold the word, and is
//     listed in M.obbbaElsewhere (information only);
//   - First FY 2026 takes them all as before the First FY; a switch off moves none of it; save and reopen keeps it;
//   - every §17.3 word, on the screen and in the workbook (read back with openpyxl), the import message, Help, README;
//   - with no row whose name or Budget Flex 02 holds the word, the model, every view but Help, the workbook, the import
//     messages and the saved state are what the code before §17 (commit 8c0603e, read from git) makes, byte for byte.
//
//   node apex/test/obbba-om.test.mjs
// The test runs in a zone that is not UTC, as the other workbook tests do (review XP-9). Set before any date is made.
process.env.TZ = 'America/New_York';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadTool, pageHtml, checks, scratchDir } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');
const READ = join(HERE, 'export-read.py');
const C = checks('obbba-om');
const tmp = scratchDir('sfcbsp-obbba-om-');
const J = x => JSON.stringify(x);
const settle = (ms = 20) => new Promise(res => setTimeout(res, ms));
// the code before §17: the contract for it was committed first, with no line of its code
const BEFORE = '8c0603e';
const NOW = '2026-11-09T12:00:00.000Z', NOW2 = '2026-11-16T12:00:00.000Z';

// ------------------------------------------------------------------------------------------------ restated from §17
// Restated, never read from the tool: a change on either side is then a disagreement this test reports, not an echo.
const WHY = 'FY2025 O&M OBBBA funding (not a reporting year)';
const WHY_FLEX = WHY + ', marked in Budget Flex 02';                              // a report row (§17.3)
const WHY_REP = WHY + ', marked in the BAE report’s Budget Flex 02';              // a pull row (§17.3)
const HEAD = 'FY2025 O&M OBBBA funding, left out (not a reporting year)';
const RULE = 'FY2025 O&M OBBBA funding is left out of every figure: it is not a reporting year. OBBBA funding of every other appropriation counts '
  + 'like any other money (Brad, 11 Nov 2026).';
const ELSE_HEAD = 'OBBBA funding outside O&M counts like any other money (Brad, 11 Nov 2026):';
const WHERE = 'FY2025 O&M OBBBA funding is left out (not a reporting year), so no block is shown';
const AP = { om: 'O&M', ff: 'Full Fund', sp: 'Initial Spares', opn: 'OPN' };
const pad2 = n => String(n).padStart(2, '0');
const commas = d => d.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
function mText(c) {
  if (c === 0) return '0.00';
  const a = Math.abs(c);
  let body;
  if (a < 500000) body = '<0.01';
  else { let h = Math.floor(a / 1e6); if (a - h * 1e6 >= 500000) h++; body = commas(String(Math.floor(h / 100))) + '.' + pad2(h % 100); }
  return c < 0 ? '(' + body + ')' : body;
}
const usd = c => (c < 0 ? '-' : '') + '$' + commas(String(Math.floor(Math.abs(c) / 100))) + '.' + pad2(Math.abs(c) % 100);
const $M = c => '$' + mText(c) + 'M';
const rw = n => n + (n === 1 ? ' row' : ' rows');
const D = d => Math.round(d * 100);
const normKey = s => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
const flat = s => String(s ?? '').replace(/\s+/g, ' ').trim();
// §17.1 restated: the word, whole, any case
const word = s => /\bOBBBA\b/i.test(String(s ?? ''));

// ------------------------------------------------------------------------------------------------ the pulls and report
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
// the report's four, then the three Budget Flex columns of the real report's layout (§17.1 reads 02 alone)
const BAE_H = ['Budget Name', 'Budget FY Numeric', 'Budget Approved Amount', 'Budget Authorized Amount', 'Budget Flex 01', 'Budget Flex 02', 'Budget Flex 03'];
const baeCsv = (rows, heads = BAE_H) => [heads.join(',')].concat(rows.map(r => heads.map((_, i) => q(r[i])).join(','))).join('\n');
const EX = 'Actual Execution is allocated', NA = 'Not Allocated';
const AV = 'Air Vehicle (AV)', PSM = 'Product Support Management (PSM)', TSS = 'Training Systems (TSS)';
const row = (FY, ccar, Title, Budget, pe, Date, Amount, Alloc, PMO) => ({ FY, 'CCaR No': ccar, Title, Budget, 'Plan Event': pe, Date, Amount, Alloc, PMO });
// O&M budgets
const B_OM = 'USAF O&M- Invented Base Line Discretionary AV';            // ordinary: the O&M FY2025 block stays
const B_OMF = 'USAF O&M- Invented Relief Line Discretionary AV';        // its name lacks the word; the report marks it in Flex 02
const B_OMN = 'USAF O&M- Invented OBBBA Relief Discretionary AV';       // named, and flexed too in the report
const B_OML = 'USN O&M- Invented Lowcase Mandatory PSM';                // the report marks it in Flex 02 in lower case
const B_OMX = 'USAF O&M- Invented Longer Line Discretionary AV';        // OBBBAX in Flex 02: a longer word, ordinary
const B_OM13 = 'USAF O&M- Invented Flex Other Discretionary AV';        // the word in Flex 01 and 03 only: ordinary
// other appropriations: their OBBBA money counts
const B_SPF = 'USAF APN Spares Invented Relief Initial';                // marked in Flex 02, its name lacks the word
const B_SPN = 'USAF APN Spares Invented OBBBA Initial';                 // named
const B_SP = 'USAF APN Spares Invented Plain Initial';
const B_FFN = 'USN APN Full Fund Invented OBBBA Discretionary TSS';     // named (and flexed in the report)
const B_FF = 'USAF APN Full Fund Invented Base Discretionary AV';
const B_FFF = 'USAF APN Full Fund Invented Relief Discretionary AV';    // marked in Flex 02; no pull row
const B_OPNF = 'USN OPN Invented Relief Mandatory';                     // marked in Flex 02, its name lacks the word
const OM = [
  row(2025, 'QD0001', 'Invented Title A', B_OM, 'Ev 1', '2024-11-10', '3000000', EX, AV),
  row(2025, 'QD0002', 'Invented Title A', B_OM, 'Ev 2', '2025-03-10', '500000', NA, AV),
  row(2025, 'QD0003', 'Invented Title B', B_OMF, 'Ev 3', '2024-12-10', '2000000', EX, AV),     // report-marked
  row(2025, 'QD0004', 'Invented Title B', B_OMF, 'Ev 4', '2025-05-10', '700000', NA, AV),      // report-marked
  row(2025, 'QD0005', 'Invented Title C', B_OMN, 'Ev 5', '2025-01-10', '900000', EX, AV),      // named
  row(2025, 'QD0006', 'Invented Title D', B_OML, 'Ev 6', '2025-02-10', '400000', EX, PSM),     // report-marked (lower case)
  row(2025, 'QD0007', 'Invented Title E', B_OMX, 'Ev 7', '2025-04-10', '250000', EX, AV),
  row(2025, 'QD0008', 'Invented Title E', B_OM13, 'Ev 8', '2025-06-10', '150000', NA, AV),
  row(2026, 'QD0009', 'Invented Title B', B_OMF, 'Ev 9', '2025-11-10', '1200000', EX, AV),     // FY2026: counts
  row(2026, 'QD0010', 'Invented Title A', B_OM, 'Ev 10', '2026-01-10', '800000', NA, AV),
  row(2025, 'QD0011', 'Invented Title B', B_OMF, 'Ev 11', '2025-07-10', 'n/a', NA, AV),       // unreadable, report-marked
];
const SPR = [
  row(2025, 'QE0001', 'Invented Title S', B_SPF, 'Ev 21', '2025-01-10', '600000', EX, AV),
  row(2025, 'QE0002', 'Invented Title T', B_SPN, 'Ev 22', '2025-02-10', '350000', EX, AV),
  row(2025, 'QE0003', 'Invented Title T', B_SPN, 'Ev 23', '2025-08-10', '50000', NA, AV),
  row(2026, 'QE0004', 'Invented Title U', B_SP, 'Ev 24', '2026-02-10', '100000', EX, AV),
];
const FF = [
  row(2025, 'QF0001', 'Invented Title F', B_FFN, 'Ev 31', '2025-01-10', '1500000', EX, TSS),
  row(2025, 'QF0002', 'Invented Title G', B_FF, 'Ev 32', '2025-03-10', '2500000', EX, AV),
];
const OPN = [row(2025, 'QG0001', 'Invented Title O', B_OPNF, 'Ev 41', '2025-04-10', '300000', EX, AV)];
const BAE = [
  [B_OM, 2025, 5000000, 4000000, '', '', ''],                  // 0  in: covers O&M FY2025
  [B_OMF, 2025, 3000000, 2500000, '', 'OBBBA', ''],            // 1  obbba, flex02: marks B_OMF
  [B_OMN, 2025, 1000000, 1000000, '', 'OBBBA', ''],            // 2  obbba, name (named and flexed)
  [B_OML, 2025, 400000, 400000, '', 'obbba act', ''],          // 3  obbba, flex02 (lower case): marks B_OML
  [B_OMX, 2025, 300000, 300000, '', 'OBBBAX', ''],             // 4  in: a longer word
  [B_OM13, 2025, 200000, 200000, 'OBBBA', '', 'OBBBA'],        // 5  in: Flex 01 and 03 are never read
  [B_OMF, 2026, 2000000, 1800000, '', 'OBBBA', ''],            // 6  in: FY2026
  [B_OM, 2026, 1000000, 1000000, '', '', ''],                  // 7  in
  [B_SPF, 2025, 800000, 700000, '', 'OBBBA', ''],              // 8  in: Initial Spares counts (obbbaElsewhere, Flex 02)
  [B_SPN, 2025, 500000, 500000, '', '', ''],                   // 9  in: Initial Spares, named
  [B_SP, 2026, 150000, 150000, '', '', ''],                    // 10 in
  [B_FFN, 2025, 1600000, 1600000, '', 'OBBBA', ''],            // 11 in: Full Fund, named (and flexed)
  [B_FF, 2025, 2600000, 2600000, '', '', ''],                  // 12 in
  [B_FFF, 2025, 700000, 650000, '', 'OBBBA', ''],              // 13 in: Full Fund, Flex 02
  [B_OPNF, 2025, 350000, 350000, '', 'OBBBA', ''],             // 14 in: OPN, Flex 02
];
const files = (sets, bae, baeHeads) => sets.filter(([, rows]) => rows.length).map(([name, rows]) => ({ name, data: csv(rows) }))
  .concat(bae ? [{ name: 'bae.csv', data: baeCsv(bae, baeHeads) }] : []);
const ALL = (om = OM, sp = SPR, ff = FF, opn = OPN) => [['om.csv', om], ['sp.csv', sp], ['ff.csv', ff], ['opn.csv', opn]];
const NO_FLEX02 = BAE_H.filter(h => h !== 'Budget Flex 02');
const noFlex02 = rows => rows.map(r => [r[0], r[1], r[2], r[3], r[4], r[6]]);

// ---------------------------------------------------------------------------------------------- what the rows add to
// §17.1 restated: an O&M FY2025 pull row is marked by its name or by a report row of its budget (FY 2025, O&M by name,
// Flex 02 holding the word)
const omName = n => /o&m/i.test(n);
const reportMarks = bae => new Set((bae || []).filter(r => r[1] === 2025 && omName(r[0]) && word(r[5])).map(r => normKey(r[0])));
const isOb = (r, bae) => r.FY === 2025 && (word(r.Budget) || reportMarks(bae).has(normKey(r.Budget)));   // O&M rows only
const amt = r => D(Number(r.Amount)), obl = r => (r.Alloc === EX ? amt(r) : 0);
const readable = r => r.Amount !== 'n/a';
const sumOf = (rows, f = amt) => rows.reduce((a, r) => a + f(r), 0);
// the readable O&M FY2025 rows left out, per budget in row order
function expOb(bae) {
  const rows = OM.filter(r => readable(r) && isOb(r, bae));
  const bud = new Map();
  for (const r of rows) {
    const k = normKey(r.Budget);
    if (!bud.has(k)) bud.set(k, { key: k, name: r.Budget, ap: 'om', by: word(r.Budget) ? 'name' : 'report', rows: 0, cents: 0, obligated: 0 });
    const u = bud.get(k); u.rows++; u.cents += amt(r); u.obligated += obl(r);
  }
  return { rows: rows.length, cents: sumOf(rows), obligated: sumOf(rows, obl),
    blocks: rows.length ? [{ ap: 'om', fy: 2025, rows: rows.length, cents: sumOf(rows), obligated: sumOf(rows, obl) }] : [], budgets: [...bud.values()] };
}
const EMPTY_OB = { rows: 0, cents: 0, obligated: 0, blocks: [], budgets: [] };
C.chk('the fixture: with no report only the named O&M row is left out; with it, the named one and the three the report marks',
  J(OM.filter(r => readable(r) && isOb(r, null)).map(r => r['CCaR No'])) === J(['QD0005'])
  && J(OM.filter(r => readable(r) && isOb(r, BAE)).map(r => r['CCaR No'])) === J(['QD0003', 'QD0004', 'QD0005', 'QD0006']));
const EXP_OB_NOREP = expOb(null), EXP_OB_REP = expOb(BAE);
C.eq('the fixture: the figures restated below', [EXP_OB_REP.cents, EXP_OB_REP.obligated, EXP_OB_NOREP.cents], [D(4000000), D(3300000), D(900000)]);
// §17.2 M.obbbaElsewhere restated: per (ap, fy) of another appropriation, FY2025, marked; pull rows by name, report rows
// (sustainment, readable, First FY or later) by name or Flex 02
function expElse(bae) {
  const out = [];
  for (const [ap, rows] of [['ff', FF], ['sp', SPR], ['opn', OPN]]) {
    const pr = rows.filter(r => r.FY === 2025 && readable(r) && word(r.Budget));
    const apOf = n => (/spares/i.test(n) ? 'sp' : /full\s*fund/i.test(n) ? 'ff' : /\bopn\b/i.test(n) ? 'opn' : /o&m/i.test(n) ? 'om' : null);
    const rr = (bae || []).filter(r => r[1] === 2025 && apOf(r[0]) === ap && (word(r[0]) || word(r[5])));
    if (!pr.length && !rr.length) continue;
    out.push({ ap, fy: 2025, pull: { rows: pr.length, cents: sumOf(pr), obligated: sumOf(pr, obl) },
      report: { rows: rr.length, approved: rr.reduce((a, r) => a + D(r[2]), 0), authorized: rr.reduce((a, r) => a + D(r[3]), 0),
        byName: rr.filter(r => word(r[0])).length, byFlex02: rr.filter(r => !word(r[0])).length } });
  }
  return out;
}
const EXP_ELSE_REP = expElse(BAE), EXP_ELSE_NOREP = expElse(null);
C.eq('the fixture: OBBBA money outside O&M, with the report (Full Fund, Initial Spares, OPN) and without (the pulls’ named rows)',
  [EXP_ELSE_REP.map(e => e.ap + ':' + e.pull.rows + '/' + e.report.rows), EXP_ELSE_NOREP.map(e => e.ap + ':' + e.pull.rows)], [['ff:1/2', 'sp:2/2', 'opn:0/1'], ['ff:1', 'sp:2']]);
const EXP_NOTE_REP = 'FY2025 O&M OBBBA funding is left out of every figure: it is not a reporting year. The CCaR pull holds 4 rows of it on 3 budgets '
  + '(O&M FY2025), ' + $M(D(4000000)) + ' planned, ' + $M(D(3300000)) + ' of it obligated. See the Import report.';
const EXP_NOTE_NOREP = 'FY2025 O&M OBBBA funding is left out of every figure: it is not a reporting year. The CCaR pull holds 1 row of it on 1 budget '
  + '(O&M FY2025), ' + $M(D(900000)) + ' planned, ' + $M(D(900000)) + ' of it obligated. See the Import report.';
const EXP_LINES_REP = ['In the CCaR pulls: 4 rows on 3 budgets (O&M FY2025):',
  '  “' + B_OMF + '” (O&M), marked in the BAE report’s Budget Flex 02: 2 rows, plan ' + usd(D(2700000)) + ', obligated ' + usd(D(2000000)) + '.',
  '  “' + B_OMN + '” (O&M): 1 row, plan ' + usd(D(900000)) + ', obligated ' + usd(D(900000)) + '.',
  '  “' + B_OML + '” (O&M), marked in the BAE report’s Budget Flex 02: 1 row, plan ' + usd(D(400000)) + ', obligated ' + usd(D(400000)) + '.',
  '  Total: 4 rows, plan ' + usd(D(4000000)) + ', obligated ' + usd(D(3300000)) + '.',
  'In the BAE report: 3 rows, Approved ' + usd(D(4400000)) + ', Authorized ' + usd(D(3900000)) + ' (named OBBBA: 1 row; marked in Budget Flex 02 only: 2 rows).'];
const EXP_ELSE_LINES = ['Full Fund FY2025: in the CCaR pull, 1 row, plan ' + usd(D(1500000)) + '; in the BAE report, 2 rows (named OBBBA: 1 row; marked in Budget Flex 02 only: 1 row), '
  + 'Approved ' + usd(D(2300000)) + ', Authorized ' + usd(D(2250000)) + '.',
'Initial Spares FY2025: in the CCaR pull, 2 rows, plan ' + usd(D(400000)) + '; in the BAE report, 2 rows (named OBBBA: 1 row; marked in Budget Flex 02 only: 1 row), '
  + 'Approved ' + usd(D(1300000)) + ', Authorized ' + usd(D(1200000)) + '.',
'OPN FY2025: in the CCaR pull, none; in the BAE report, 1 row (named OBBBA: 0 rows; marked in Budget Flex 02 only: 1 row), Approved ' + usd(D(350000))
  + ', Authorized ' + usd(D(350000)) + '.'];
// the report's Counted, file order (§17.3)
const EXP_COUNTED = ['Yes', WHY_FLEX, WHY, WHY_FLEX, 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'];

// ------------------------------------------------------------------------------------------------ the tools
function py(args) { return spawnSync('python3', ['-I', ...args], { encoding: 'utf8', maxBuffer: 1 << 30 }); }
function readBook(file) {
  const r = py([READ, file]);
  if (r.status !== 0) throw new Error('export-read.py failed: ' + r.stderr.slice(-800));
  return JSON.parse(r.stdout);
}
function sheetRows(book, name) {
  const s = book.sheets.find(x => x.name === name);
  if (!s) return null;
  return s.rows.map(r => { const a = []; for (const [ci, v] of r.cells) a[ci] = v; return a; });
}
async function assembleBefore() {
  if (spawnSync('git', ['-C', REPO, 'cat-file', '-e', BEFORE + '^{commit}']).status !== 0) return null;
  const root = join(tmp.dir, 'before', 'spend-plan');
  mkdirSync(join(root, 'src'), { recursive: true });
  const ls = spawnSync('git', ['-C', REPO, 'ls-tree', '--name-only', BEFORE, 'spend-plan/src/'], { encoding: 'utf8' });
  for (const f of ['spend-plan/build.mjs'].concat(ls.stdout.split('\n').filter(Boolean))) {
    const r = spawnSync('git', ['-C', REPO, 'show', BEFORE + ':' + f], { maxBuffer: 1 << 28 });
    if (r.status !== 0) return null;
    writeFileSync(join(root, f.replace(/^spend-plan\//, '')), r.stdout);
  }
  const { assemble } = await import(pathToFileURL(join(root, 'build.mjs')).href);
  return assemble;
}
const withState = (html, state) => html.replace('<script id="spState" type="application/json">null</script>',
  () => '<script id="spState" type="application/json">' + J(state).replace(/</g, '\\u003c') + '</script>');
async function boot(html) {
  const t = loadTool({ html });
  t.window.confirm = () => true;
  const W = t.window, doc = W.document;
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  const T = {
    t, W, doc, SP: t.SP,
    main: () => doc.getElementById('uiMain'),
    click(el) { el.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); },
    change(el, value) { if (value !== undefined) el.value = value; el.dispatchEvent(new W.Event('change', { bubbles: true })); },
    async view(v) { T.click(doc.querySelector('[data-act=view][data-v="' + v + '"]')); await settle(); return T.main(); },
    async help() { T.click(doc.querySelector('#uiHelp')); await settle(); return T.main(); },
    errors: () => t.errors.filter(e => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click)/.test(String(e))),
  };
  return T;
}
async function planOf(SPx, imports, settings) {
  const msgs = [];
  for (const [fs, now] of imports) msgs.push(SPx.applyImport(await SPx.parseFiles(fs, { now })).message);
  if (settings) SPx.setSettings(settings);
  return { state: JSON.parse(J(SPx.state)), msgs };
}
async function exportBook(T, name) {
  let got = null;
  const real = T.SP.download;
  T.SP.download = (n, bytes) => { got = { n, bytes }; return n; };
  const r = await T.SP.exportExcel();
  T.SP.download = real;
  if (!r.ok || !got) throw new Error('the export failed: ' + r.message);
  const f = join(tmp.dir, name + '.xlsx');
  writeFileSync(f, got.bytes);
  return readBook(f);
}
async function block(name, fn) {
  try { await fn(); } catch (e) { C.chk(name + ': the checks stopped part way: ' + String((e && e.stack) || e).split('\n').slice(0, 3).join(' | '), false); }
}
const S0 = (SPx, first) => { const s = SPx.defaultSettings('2026-11-09'); s.asOf = '2026-10'; if (first) s.firstFY = first; return s; };
const V0 = (SPx, off = [], lanes = ['disc', 'mand']) => {
  const v = SPx.defaultView();
  for (const s of off) v.svc[s] = false;
  for (const l of ['disc', 'mand']) if (!lanes.includes(l)) v.lane[l] = false;
  return v;
};
const withBae = (parsed, now) => (parsed.bae ? Object.assign({}, parsed.bae, { importedAt: now || NOW }) : null);
const counted = M => J({ blocks: M.blocks, aps: M.aps, pmos: M.pmos, naAll: M.naAll, total: M.summary.total, present: M.present, shown: M.shown,
  showNoDate: M.showNoDate, execAfterAsOf: M.execAfterAsOf, execNoDate: M.execNoDate, stale: M.stale });
// the same rows with every OBBBA word taken out of the names and the Flex 02 cells of the appropriations other than O&M:
// what "counts like any other money" means, row for row
const unword = n => String(n).replace(/OBBBA/gi, 'OBBBQ');
const plainRow = r => Object.assign({}, r, { Budget: unword(r.Budget) });
const plainBae = rows => rows.map(r => (omName(r[0]) ? r : [unword(r[0]), r[1], r[2], r[3], r[4], word(r[5]) ? '' : r[5], r[6]]));

const t = loadTool();
const SP = t.SP;
try {
  C.eq('the page boots with no script errors', t.errors, []);

  // =================================================================================================================
  // §17.1 THE ONE PREDICATE AND ITS TWO HELPERS
  // =================================================================================================================
  await block('the predicate', async () => {
    C.eq('SP.OBBBA_FY is 2025', SP.OBBBA_FY, 2025);
    const cases = [
      ['USAF O&M OBBBA Line', 2025, 'om', undefined, true], ['usaf o&m obbba line', 2025, 'om', undefined, true],
      ['USAF O&M OBBBA Line', 2025, 'sp', undefined, false], ['USAF O&M OBBBA Line', 2025, 'ff', undefined, false],
      ['USAF O&M OBBBA Line', 2025, 'opn', undefined, false], ['USAF O&M OBBBA Line', 2025, null, undefined, false],
      ['USAF O&M OBBBA Line', 2025, undefined, undefined, false], ['USAF O&M OBBBA Line', 2026, 'om', undefined, false],
      ['USAF O&M OBBBA Line', '2025', 'om', undefined, false], ['USAF O&M NOBBBAX Line', 2025, 'om', undefined, false],
      ['USAF O&M Line', 2025, 'om', 'OBBBA', true], ['USAF O&M Line', 2025, 'om', 'Relief obbba act', true],
      ['USAF O&M Line', 2025, 'om', 'OBBBAX', false], ['USAF O&M Line', 2025, 'om', '', false], ['USAF O&M Line', 2025, 'om', true, true],
      ['USAF O&M Line', 2025, 'om', false, false], ['USAF O&M Line', 2025, 'om', undefined, false], ['USAF O&M Line', 2025, 'sp', 'OBBBA', false],
      ['USAF O&M Line', 2025, 'sp', true, false], ['USAF O&M Line', 2026, 'om', true, false], ['USAF O&M OBBBA Line', 2025, 'om', false, true]];
    const bad = cases.filter(([n, fy, ap, mk, w]) => SP.isObbba25(n, fy, ap, mk) !== w);
    C.chk('SP.isObbba25(name, fy, ap, mark): FY 2025, O&M, and the word in the name or the mark (§17.1)', !bad.length, J(bad));
    // the Flex 02 column: by its header (normKey), the first so headed; Flex 01 and 03 never
    // found as §14.1 finds the four it reads: normKey, a trailing unit in parentheses taken off; the first so headed (the import
    // keeps a second one as "Budget Flex 02 (2)", after it)
    C.eq('SP.baeFlex02Col: the first header that is budget flex 02, compared as §14.1 compares the four', [SP.baeFlex02Col({ headers: ['Budget Name', 'Budget Flex 01', ' BUDGET  FLEX 02 ', 'Budget Flex 02 (2)'] }),
      SP.baeFlex02Col({ headers: ['Budget Name', 'Budget Flex 01', 'Budget Flex 03'] }), SP.baeFlex02Col({ rows: [] }),
      SP.baeFlex02Col({ headers: ['Budget Name', 'Budget Flex 01 (Code)', 'Budget Flex 02 (Code)', 'Budget Flex 03 (Code)'] })], [' BUDGET  FLEX 02 ', null, undefined, 'Budget Flex 02 (Code)']);
    const r = { c: ['x', 2025, 1, 1], x: { 'Budget Flex 01': 'OBBBA', 'Budget Flex 02': 'Relief OBBBA', 'Budget Flex 03': 'OBBBA' } };
    C.eq('SP.baeFlex02: the cell under that header, else empty; with no header list, the row’s own Budget Flex 02',
      [SP.baeFlex02(r, 'Budget Flex 02'), SP.baeFlex02(r, null), SP.baeFlex02(r, 'Budget Flex 03 '), SP.baeFlex02(r, undefined), SP.baeFlex02({ c: [] }, undefined)],
      ['Relief OBBBA', '', '', 'Relief OBBBA', '']);
    const bae = { headers: BAE_H.slice(), rows: BAE.map((b, i) => ({ c: b.slice(0, 4).map((v, k) => (k >= 2 ? D(v) : v)),
      x: Object.fromEntries(BAE_H.slice(4).map((h, k) => [h, b[4 + k]]).filter(([, v]) => v !== '')), src: [0, 'bae', i + 2] })) };
    C.eq('SP.baeObbbaKeys: the budgets the report marks (FY 2025, O&M, Flex 02 holding the word), whatever their name says',
      [...SP.baeObbbaKeys(bae)].sort(), [normKey(B_OMF), normKey(B_OMN), normKey(B_OML)].sort());
    C.eq('… none with no report, or a report with no Flex 02 column', [SP.baeObbbaKeys(null).size, SP.baeObbbaKeys({ headers: NO_FLEX02, rows: bae.rows }).size], [0, 0]);
    // nothing but 10-util.js spells the rule
    const src = n => readFileSync(join(HERE, '..', 'src', n), 'utf8');
    const others = ['20-xlsx-read.js', '30-import.js', '40-engine.js', '50-xlsx-write.js', '60-export.js', '70-pictures.js', '80-store.js', '90-ui.js'];
    C.eq('no source but 10-util.js spells the rule (a pattern for the word, a test against 2025, or the Flex 02 header)',
      others.filter(n => /\\bOBBBA|OBBBA\\b|\/[^/\n]*obbba[^/\n]*\/[gimsuy]*/i.test(src(n)) || /[=!]==?\s*2025\b|\b2025\s*[=!]==?/.test(src(n)) || /budget flex 02/.test(src(n))), []);
    C.chk('… and 10-util.js defines SP.isObbba25 once, on SP.OBBBA_FY and O&M', (src('10-util.js').match(/SP\.isObbba25 = /g) || []).length === 1
      && /fy === SP\.OBBBA_FY && ap === 'om'/.test(src('10-util.js')));
  });

  // =================================================================================================================
  // §17.1, §17.2 THE MODEL
  // =================================================================================================================
  const Pn = await SP.parseFiles(files(ALL()), { now: NOW });                // the pulls alone
  const Pr = await SP.parseFiles(files(ALL(), BAE), { now: NOW });           // the pulls and the report
  C.chk('the pulls and the report read', J(Object.keys(Pr.pulls)) === J(['om', 'ff', 'sp', 'opn']) && Pr.bae && Pr.bae.rows.length === BAE.length, J(Object.keys(Pr.pulls)));
  await block('the model, with no report', async () => {
    const M = SP.buildModel(Pn.pulls, S0(SP), V0(SP));
    C.eq('no report: only the O&M row named OBBBA is left out (by:name)', M.excluded.obbba, EXP_OB_NOREP);
    C.eq('no report: the blocks', M.blocks.map(b => b.key), ['om|2025', 'om|2026', 'ff|2025', 'sp|2025', 'sp|2026', 'opn|2025']);
    const om = M.blocks.find(b => b.key === 'om|2025');
    C.eq('no report: O&M FY2025 counts the rows only the report would mark', [om.approved, om.obligated], [D(7000000), D(5650000)]);
    C.eq('no report: model.obbbaElsewhere: the pulls’ named OBBBA rows outside O&M', M.obbbaElsewhere, EXP_ELSE_NOREP);
    C.chk('no report: the Summary’s note', M.summary.notes.includes(EXP_NOTE_NOREP), J(M.summary.notes));
  });
  await block('the model, with the report', async () => {
    const bae = withBae(Pr);
    const M = SP.buildModel(Pr.pulls, S0(SP), V0(SP), bae);
    C.eq('with the report: the named O&M row and those of the budgets it marks are left out (by:name, by:report)', M.excluded.obbba, EXP_OB_REP);
    C.eq('… the blocks: O&M FY2025 stays (its ordinary rows)', M.blocks.map(b => b.key), ['om|2025', 'om|2026', 'ff|2025', 'sp|2025', 'sp|2026', 'opn|2025']);
    C.eq('… the report’s rows by scope', bae.rows.map(r => SP.baeDerive(r, S0(SP), undefined, SP.baeFlex02Col(bae)).scope),
      ['in', 'obbba', 'obbba', 'obbba', 'in', 'in', 'in', 'in', 'in', 'in', 'in', 'in', 'in', 'in', 'in']);
    C.eq('… obbbaBy on the rows of scope obbba only: flex02, name (named and flexed), flex02 (lower case)',
      M.bae.derived.map(d => ('obbbaBy' in d) ? d.obbbaBy : '-'), ['-', 'flex02', 'name', 'flex02', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']);
    C.eq('… model.bae.rows', M.bae.rows, { in: 12, flyaway: 0, noap: 0, bad: 0, obbba: 3 });
    C.eq('… the Counted reasons, file order (§17.3)', M.bae.counted.map(x => x[1]), EXP_COUNTED);
    C.eq('… SP.baeTally', SP.baeTally(bae, S0(SP), V0(SP)), { rows: 15, yes: 12, bad: 0, flyaway: 0, noap: 0, first: 0, obbba: 3, off: 0, firstFY: 2025 });
    const fig = k => { const b = M.blocks.find(x => x.key === k); return [b.covered, b.planned, b.approved, b.authorized, b.obligated]; };
    C.eq('… O&M FY2025: the plan less the rows left out; the report’s Approved less its rows of them, Flex 01/03 and OBBBAX counted',
      fig('om|2025'), [true, D(3900000), D(5500000), D(4500000), D(3250000)]);
    C.eq('… O&M FY2026: the Flex-marked FY2026 row counts', fig('om|2026'), [true, D(2000000), D(3000000), D(2800000), D(1200000)]);
    C.eq('… Initial Spares FY2025: its OBBBA money counts, named and flexed, pull and report', fig('sp|2025'), [true, D(1000000), D(1300000), D(1200000), D(950000)]);
    C.eq('… Full Fund FY2025: likewise', fig('ff|2025'), [true, D(4000000), D(4900000), D(4850000), D(4000000)]);
    C.eq('… OPN FY2025: likewise', fig('opn|2025'), [true, D(300000), D(350000), D(350000), D(300000)]);
    C.eq('… model.obbbaElsewhere (§17.2)', M.obbbaElsewhere, EXP_ELSE_REP);
    C.eq('… pullOnly: a budget whose only counted rows the report marks is not in it; reportOnly holds the Flex-marked Full Fund budget',
      [M.bae.pullOnly, M.bae.reportOnly], [[], [normKey(B_FFF)]]);
    C.eq('… the unreadable report-marked row is counted as unreadable', M.excluded.unreadable.rows, 1);
    C.chk('… the Summary’s note, in §17.3’s words', M.summary.notes.includes(EXP_NOTE_REP), J(M.summary.notes));
    C.chk('… the report’s note names 3 FY2025 O&M OBBBA rows among what it leaves out', M.summary.notes.some(n => n.startsWith('Approved and Authorized come from the BAE report ')
      && n.includes('Counted nowhere: 3 FY2025 O&M OBBBA rows.') && n.includes('it holds 12 rows of sustainment budgets (11 budgets)')), J(M.summary.notes));
    C.chk('… and says nothing of the money that counts (§17.3): OBBBA is named by those two notes alone', !M.summary.notes.some(n => /outside O&M|like any other money/.test(n))
      && M.summary.notes.filter(n => /OBBBA/.test(n)).length === 2, J(M.summary.notes));
    C.eq('SP.obbbaLines: the section, both counts and the budgets the report marks named so', SP.obbbaLines(M).slice(1), EXP_LINES_REP);
    C.chk('… its first line states the rule for O&M, by the name or Budget Flex 02', /^An O&M row whose FY is 2025/.test(SP.obbbaLines(M)[0])
      && /Budget Flex 02/.test(SP.obbbaLines(M)[0]) && /OBBBA funding of every other appropriation counts like any other money \(Brad, 11 Nov 2026\)\.$/.test(SP.obbbaLines(M)[0]), SP.obbbaLines(M)[0]);
    C.eq('SP.obbbaElsewhereLines', SP.obbbaElsewhereLines(M), EXP_ELSE_LINES);
    // TREATED AS A ROW BEFORE FIRST FY IS: every figure is the one the plan makes without those rows (pull and report)
    const leftOut = new Set(['QD0003', 'QD0004', 'QD0005', 'QD0006', 'QD0011']);
    const P0 = await SP.parseFiles(files(ALL(OM.filter(r => !leftOut.has(r['CCaR No']))), BAE.filter((_, i) => ![1, 2, 3].includes(i))), { now: NOW });
    const M0 = SP.buildModel(P0.pulls, S0(SP), V0(SP), withBae(P0));
    C.chk('… every figure, block, PMO row and tab, Not Allocated item and total is the one the plan makes without them', counted(M) === counted(M0));
    // COUNTS LIKE ANY OTHER MONEY: the same plan with every OBBBA word outside O&M taken out of the names and Flex 02
    const Pp = await SP.parseFiles(files(ALL(OM, SPR.map(plainRow), FF.map(plainRow), OPN.map(plainRow)), plainBae(BAE)), { now: NOW });
    const Mp = SP.buildModel(Pp.pulls, S0(SP), V0(SP), withBae(Pp));
    const keyless = s => s.replace(/OBBBQ/g, 'OBBBA').replace(/obbbq/g, 'obbba');
    C.chk('OBBBA money of Initial Spares, Full Fund and OPN: every figure is the one the plan makes with no such word in their names or Flex 02',
      keyless(counted(Mp)) === counted(M) && J(Mp.excluded.obbba) === J(M.excluded.obbba));
    C.eq('… and that plan lists none outside O&M', Mp.obbbaElsewhere, []);
    // the switches move none of it
    for (const [w, off, lanes] of [['USAF off', ['USAF']], ['USN off', ['USN (USN CV)']], ['mandatory only', [], ['mand']]]) {
      const Mx = SP.buildModel(Pr.pulls, S0(SP), V0(SP, off, lanes), bae), Mx0 = SP.buildModel(P0.pulls, S0(SP), V0(SP, off, lanes), withBae(P0));
      C.chk(w + ': excluded.obbba, obbbaElsewhere and the blocks do not follow the switches', J(Mx.excluded.obbba) === J(EXP_OB_REP) && J(Mx.obbbaElsewhere) === J(EXP_ELSE_REP)
        && J(Mx.blocks.map(b => b.key)) === J(M.blocks.map(b => b.key)));
      C.chk(w + ': every figure is the one the plan makes without those rows', counted(Mx) === counted(Mx0));
      C.eq(w + ': the report’s rows of it are still FY2025 O&M OBBBA funding (the rule comes before the switches)', Mx.bae.counted.slice(1, 4).map(x => x[1]), [WHY_FLEX, WHY, WHY_FLEX]);
    }
    // FIRST FY 2026: before the First FY, all of them; nothing is said to count outside O&M
    const Mf = SP.buildModel(Pr.pulls, S0(SP, 2026), V0(SP), bae);
    C.eq('First FY 2026: nothing is FY2025 O&M OBBBA funding, and none is listed outside O&M', [Mf.excluded.obbba, Mf.obbbaElsewhere], [EMPTY_OB, []]);
    C.eq('First FY 2026: the report’s rows of it are before the First FY', Mf.bae.counted.slice(1, 4).map(x => x[1]), ['Before the first FY', 'Before the first FY', 'Before the first FY']);
    C.eq('First FY 2026: the blocks', Mf.blocks.map(b => b.key), ['om|2026', 'sp|2026']);
    // a report with no Budget Flex 02 column is read by its names alone (Flex 01 and 03 never)
    const Pq = await SP.parseFiles(files(ALL(), noFlex02(BAE), NO_FLEX02), { now: NOW });
    const Mq = SP.buildModel(Pq.pulls, S0(SP), V0(SP), withBae(Pq));
    C.eq('a report with no Budget Flex 02 column: its names alone (only the named row), so only the named pull row is left out',
      [Mq.bae.counted.map(x => x[1]), Mq.excluded.obbba], [['Yes', 'Yes', WHY].concat(new Array(12).fill('Yes')), EXP_OB_NOREP]);
    // a second column headed Budget Flex 02 is not read: the first is
    const H2 = BAE_H.concat(['Budget Flex 02']);
    const Pd = await SP.parseFiles(files(ALL(), BAE.map(r => [r[0], r[1], r[2], r[3], r[4], '', r[6], r[5]]), H2), { now: NOW });
    C.eq('two columns headed Budget Flex 02: the first is read (here empty), the second is not', SP.buildModel(Pd.pulls, S0(SP), V0(SP), withBae(Pd)).excluded.obbba, EXP_OB_NOREP);
  });
  await block('an O&M FY2025 whose only rows the report marks', async () => {
    const om = OM.filter(r => r.Budget === B_OMF || r.FY === 2026);    // QD0003, QD0004, QD0009, QD0010, QD0011 (unreadable)
    const Pa = await SP.parseFiles(files([['om.csv', om]]), { now: NOW });
    const Ma = SP.buildModel(Pa.pulls, S0(SP), V0(SP));
    C.eq('no report: O&M FY2025 has its block, its rows counted', [Ma.blocks.map(b => b.key), Ma.obbbaNoBlock, Ma.excluded.obbba.rows], [['om|2025', 'om|2026'], [], 0]);
    const Pb = await SP.parseFiles(files([['om.csv', om]], BAE), { now: NOW });
    const Mb = SP.buildModel(Pb.pulls, S0(SP), V0(SP), withBae(Pb));
    C.eq('with the report: O&M FY2025 has no block, and its unreadable row names none either', [Mb.blocks.map(b => b.key), Mb.obbbaNoBlock], [['om|2026'], [{ ap: 'om', fy: 2025 }]]);
    C.eq('… its noBlock entry carries obbba (the report’s counting money for it is not shown)', Mb.bae.noBlock.filter(t => t.ap === 'om' && t.fy === 2025),
      [{ ap: 'om', fy: 2025, approved: D(5500000), authorized: D(4500000), obbba: true }]);
    C.chk('… and the note says why, in §17.3’s words', Mb.summary.notes.includes('O&M FY2025 has no block: its only CCaR pull rows are FY2025 O&M OBBBA funding, which is left out. '
      + 'The BAE report’s ' + $M(D(5500000)) + ' Approved and ' + $M(D(4500000)) + ' Authorized for it are not shown.'), J(Mb.summary.notes));
    C.eq('SP.diffPulls compares the pulls themselves, these rows included', SP.diffPulls(Pa.pulls, Pa.pulls, S0(SP)).om.byBlock['om|2025'].approved, [D(2700000), D(2700000)]);
  });
  await block('SP.diffBae', async () => {
    const bae = withBae(Pr);
    // the Flex-marked rows changed, and a Flex-marked budget added: nothing it compares moved; a FY2026 one changed (control)
    const R2 = BAE.map((r, i) => (i === 1 || i === 3 ? [r[0], r[1], r[2] + 50000, r[3], r[4], r[5], r[6]] : r))
      .concat([['USAF O&M- Invented Second Relief Discretionary AV', 2025, 400000, 400000, '', 'OBBBA', '']]);
    const d2 = SP.diffBae(bae, withBae(await SP.parseFiles(files([], R2), { now: NOW2 }), NOW2), S0(SP));
    C.eq('SP.diffBae: rows marked in Budget Flex 02 are not compared', [d2.byBlock, d2.budgetsNew, d2.budgetsGone, d2.budgetsChanged, d2.budgetsUnread],
      [SP.diffBae(bae, bae, S0(SP)).byBlock, [], [], [], []]);
    const R3 = BAE.map((r, i) => (i === 6 ? [r[0], r[1], r[2] + 50000, r[3], r[4], r[5], r[6]] : r));
    const d3 = SP.diffBae(bae, withBae(await SP.parseFiles(files([], R3), { now: NOW2 }), NOW2), S0(SP));
    C.eq('… control: a Flex-marked FY2026 row is compared', d3.budgetsChanged.map(b => b.key), [normKey(B_OMF)]);
  });

  // =================================================================================================================
  // THE SCREENS AND THE WORKBOOK, from a plan the tool's own import made
  // =================================================================================================================
  await block('the products', async () => {
    const tp = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine', 'store'] });
    tp.window.confirm = () => true;
    const { state, msgs } = await planOf(tp.SP, [[files(ALL(), BAE), NOW]], { asOf: '2026-10' });
    tp.close();
    C.chk('the import message: 12 of 15 rows counted, 3 FY2025 O&M OBBBA not (§17.3)',
      msgs[0].includes('15 rows, 12 of them counted (sustainment budgets of FY2025 or later, FY2025 O&M OBBBA funding left out); not counted: 3 FY2025 O&M OBBBA.'), msgs[0]);
    const T = await boot(pageHtml({ state }));
    C.eq('the page boots on the plan with no script errors', T.errors(), []);
    // Import report: both sections, line for line, and the BAE section's words
    const rep = await T.view('report');
    const sec = rep.querySelector('section.obbba');
    C.chk('screen, Import report: the section, headed in §17.3’s words', !!sec && flat(sec.querySelector('h3').textContent) === HEAD, sec ? sec.innerHTML.slice(0, 200) : 'none');
    if (sec) C.eq('screen, Import report: its lines after the rule', [...sec.querySelectorAll('.rl')].slice(1).map(e => e.textContent), EXP_LINES_REP.map(s => s.trim()));
    const els = rep.querySelector('section.obbba-else');
    C.chk('screen, Import report: OBBBA funding outside O&M, headed in §17.3’s words', !!els && flat(els.querySelector('h3').textContent) === ELSE_HEAD, els ? els.innerHTML.slice(0, 200) : 'none');
    if (els) C.eq('screen, Import report: one line per appropriation and FY', [...els.querySelectorAll('.rl')].map(e => e.textContent), EXP_ELSE_LINES);
    const sc = rep.querySelector('ul.baerows li[data-scope=obbba]');
    C.eq('screen, the BAE section’s rows by scope', sc && sc.textContent, WHY + ', counted nowhere: 3 rows.');
    C.chk('screen, the BAE section’s rule names it', flat(rep.querySelector('section.baeread p.l2').textContent).includes('it is not ' + WHY + ', and the switches show'));
    // Settings
    const set = await T.view('settings');
    const rl = set.querySelector('p.obbba-rule');
    C.eq('screen, Settings: the rule under First FY, §17.3’s words', rl && rl.textContent, RULE);
    // Help states it always
    const help = await T.help();
    const ht = flat(help.textContent);
    C.chk('screen, Help: the rule for O&M, by the name or Budget Flex 02, and the rest counting', ht.includes('it is not FY2025 O&M OBBBA funding, and the switches show its service and lane.')
      && ht.includes('FY2025 O&M OBBBA funding is left out of every figure, block, list and picture') && ht.includes('Budget Flex 02')
      && ht.includes('OBBBA funding of every other appropriation (Initial Spares, Full Fund, OPN) counts like any other money'), ht.slice(0, 200));
    // THE WORKBOOK, read back with openpyxl
    const Bk = await exportBook(T, 'products');
    const raw = sheet => Object.fromEntries(sheetRows(Bk, sheet).slice(1).filter(r => r).map(r => [r[2], r[35]]));
    const ro = raw('O&M Raw Data');
    C.chk('workbook, O&M Raw Data: the unreadable report-marked row is listed as could not be read', /^No: could not be read/.test(ro.QD0011 || ''), J(ro.QD0011));
    delete ro.QD0011;
    C.eq('workbook, O&M Raw Data: the Counted words, marked by name or by the report (§17.3)', ro, { QD0001: 'Yes', QD0002: 'Yes', QD0003: 'No: ' + WHY_REP,
      QD0004: 'No: ' + WHY_REP, QD0005: 'No: ' + WHY, QD0006: 'No: ' + WHY_REP, QD0007: 'Yes', QD0008: 'Yes', QD0009: 'Yes', QD0010: 'Yes' });
    C.eq('workbook, Spares, FF and OPN Raw Data: every row counts', [raw('Spares Raw Data'), raw('FF Raw Data'), raw('OPN Raw Data')],
      [{ QE0001: 'Yes', QE0002: 'Yes', QE0003: 'Yes', QE0004: 'Yes' }, { QF0001: 'Yes', QF0002: 'Yes' }, { QG0001: 'Yes' }]);
    const br = sheetRows(Bk, 'BAE Report');
    const bh = br[0];
    C.eq('workbook, BAE Report: Counted, file order', br.slice(1).map(r => r[bh.indexOf('Counted')]), EXP_COUNTED);
    C.eq('workbook, BAE Report: the three Budget Flex columns written back as the file has them', br.slice(1).map(r => ['Budget Flex 01', 'Budget Flex 02', 'Budget Flex 03']
      .map(h => r[bh.indexOf(h)] ?? '')), BAE.map(r => [r[4], r[5], r[6]]));
    const ir = sheetRows(Bk, 'Import Report').map(r => (r && r[0]) || '');
    const h = ir.indexOf(HEAD);
    C.chk('workbook, Import Report: the section, headed in §17.3’s words', h >= 0, J(ir.slice(-30)));
    if (h >= 0) C.eq('workbook, Import Report: its lines after the rule, the screen’s', ir.slice(h + 2, h + 2 + EXP_LINES_REP.length), EXP_LINES_REP.map(s => '  ' + s));
    const e = ir.indexOf(ELSE_HEAD);
    C.chk('workbook, Import Report: OBBBA funding outside O&M', e >= 0, J(ir.slice(-30)));
    if (e >= 0) C.eq('workbook, Import Report: one line per appropriation and FY, the screen’s', ir.slice(e + 1, e + 1 + EXP_ELSE_LINES.length), EXP_ELSE_LINES.map(s => '  ' + s));
    C.chk('workbook, Import Report: rows by scope count FY2025 O&M OBBBA', ir.some(s => s.startsWith('  Rows by what they are') && s.includes('3 rows of ' + WHY)));
    const st = sheetRows(Bk, 'Settings').map(r => (r && r[0]) || '');
    C.eq('workbook, Settings: the rule, under First FY', st[st.indexOf('First FY shown') + 1], RULE);
    const Su = sheetRows(Bk, 'Summary').map(r => (r || []).filter(v => typeof v === 'string').join(' | '));
    C.chk('workbook, Summary: the note, in the screen’s words', Su.includes(EXP_NOTE_REP), J(Su.slice(-12)));
    C.eq('no script error on the screens', T.errors(), []);
    T.t.close();

    // FIRST FY 2026: none of it is said
    const st2 = JSON.parse(J(state));
    st2.settings.firstFY = 2026;
    const T2 = await boot(pageHtml({ state: st2 }));
    const rep2 = await T2.view('report');
    C.chk('First FY 2026: no Import report section, no list outside O&M', !rep2.querySelector('section.obbba') && !rep2.querySelector('section.obbba-else'));
    const set2 = await T2.view('settings');
    C.chk('First FY 2026: no Settings line', !set2.querySelector('p.obbba-rule'));
    const B2 = await exportBook(T2, 'first2026');
    const raw2 = Object.fromEntries(sheetRows(B2, 'O&M Raw Data').slice(1).filter(r => r).map(r => [r[2], r[35]]));
    C.eq('First FY 2026, O&M Raw Data: a report-marked row is before the First FY', raw2.QD0003, 'No: FY2025 is before the first FY shown (FY2026)');
    T2.t.close();

    // SAVE AND REOPEN: the report's Budget Flex 02 travels in the file, and the plan is the same
    const T3 = await boot(pageHtml());
    T3.SP.applyImport(await T3.SP.parseFiles(files(ALL(), BAE), { now: NOW }));
    T3.SP.setSettings({ asOf: '2026-10' });
    const html = T3.SP.savedHtml();
    T3.t.close();
    const T4 = await boot(html);
    const s4 = T4.SP.state;
    const M4 = T4.SP.buildModel(s4.pulls.current, s4.settings, T4.SP.getView(), s4.bae.current);
    C.eq('save and reopen: the report’s Budget Flex 02 cells come back', s4.bae.current.rows.map(r => T4.SP.baeFlex02(r, T4.SP.baeFlex02Col(s4.bae.current))), BAE.map(r => r[5]));
    C.chk('save and reopen: the same rows left out, marked the same way, the same money listed outside O&M',
      J(M4.excluded.obbba) === J(EXP_OB_REP) && J(M4.obbbaElsewhere) === J(EXP_ELSE_REP) && J(M4.bae.counted.map(x => x[1])) === J(EXP_COUNTED), J([M4.excluded.obbba, M4.obbbaElsewhere]));
    T4.t.close();

    // WHAT CHANGED: pulls whose only OBBBA rows the report marks are said to be compared, with the report and not without
    const omP = OM.filter(r => r.Budget !== B_OMN), omP2 = omP.map(r => (r['CCaR No'] === 'QD0003' ? Object.assign({}, r, { Amount: '2100000' }) : r));
    const plan = async (withRep) => {
      const tq = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine', 'store'] });
      tq.window.confirm = () => true;
      const pq = await planOf(tq.SP, [[files([['om.csv', omP]], withRep ? BAE : null), NOW], [files([['om.csv', omP2]]), NOW2]], { asOf: '2026-10' });
      tq.close();
      return pq.state;
    };
    const lead = 'Every row of every FY is compared, whatever the switches show and whatever the First FY, FY2025 O&M OBBBA funding (left out of every other figure) included';
    for (const [w, withRep, says] of [['with the report', true, true], ['with no report (control)', false, false]]) {
      const T5 = await boot(pageHtml({ state: await plan(withRep) }));
      const ch = await T5.view('changes');
      C.chk('What changed, ' + w + ': its opening sentence ' + (says ? 'says' : 'does not say') + ' the report-marked rows are compared',
        flat(ch.querySelector('p.l2').textContent).startsWith(lead) === says, flat(ch.querySelector('p.l2').textContent).slice(0, 220));
      T5.t.close();
    }
    // What changed in the BAE report: a report whose only FY2025 O&M OBBBA rows are marked in Budget Flex 02 says it leaves them out
    const flexOnly = BAE.filter((_, i) => i !== 2);
    const tr = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine', 'store'] });
    tr.window.confirm = () => true;
    const pr = await planOf(tr.SP, [[files(ALL(), flexOnly), NOW], [files([], flexOnly.map((r, i) => (i === 6 ? [r[0], r[1], r[2] + 50000, r[3], r[4], r[5], r[6]] : r))), NOW2]], { asOf: '2026-10' });
    tr.close();
    const T6 = await boot(pageHtml({ state: pr.state }));
    const ch6 = await T6.view('changes');
    const bn = ch6.querySelector('section.chg.bae p.note');
    C.chk('What changed in the BAE report: rows marked in Budget Flex 02 alone are said to be left out', !!bn && flat(bn.textContent).startsWith('Its sustainment budgets are compared, every FY '
      + 'and every row, whatever the switches show; Flyaway, ' + WHY + ', and the budgets that name no appropriation are left out'), bn && flat(bn.textContent));
    // the import's own part of the Import report, from the report alone (SP.importReportLines): its rows marked in Budget Flex
    // 02 alone are named among what the readable rows' money leaves out (§15.4 review P5-6, in §17.3's words)
    const rp6 = flat((await T6.view('report')).textContent);
    C.chk('the Import report: a report whose only FY2025 O&M OBBBA rows are marked in Budget Flex 02 names them among what its money leaves out',
      rp6.includes('every budget in the report, before Flyaway, FY2025 O&M OBBBA funding and the budgets that name no appropriation are left out.'), rp6.slice(0, 400));
    C.eq('no script error on What changed', T6.errors(), []);
    T6.t.close();

    // AN O&M VIEW WITH NO BLOCK because the report marks its only FY2025 rows, First FY 2025, no FY2026 rows
    const tv = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine', 'store'] });
    tv.window.confirm = () => true;
    const pv = await planOf(tv.SP, [[files([['om.csv', OM.filter(r => r.Budget === B_OMF && r.FY === 2025)], ['sp.csv', SPR]], BAE), NOW]], { asOf: '2026-10' });
    tv.close();
    const T7 = await boot(pageHtml({ state: pv.state }));
    const v7 = await T7.view('om');
    const none = v7.querySelector('p.none[data-obbba]');
    C.eq('screen, O&M with no block: it says its only rows are FY2025 O&M OBBBA funding', none && none.textContent,
      'No O&M block is shown: the current pull’s only O&M rows from FY2025 on are FY2025 O&M OBBBA funding, which is left out: it is not a reporting year.');
    const r7 = await T7.view('report');
    const w7 = r7.querySelector('table.baeblocks tr[data-bk="om|2025"] td.wrap');
    C.eq('screen, the BAE section’s table: O&M FY2025, On this page', w7 && w7.textContent, WHERE);
    T7.t.close();
  });

  // =================================================================================================================
  // WITH NO ROW WHOSE NAME OR BUDGET FLEX 02 HOLDS THE WORD NOTHING CHANGES: the code before §17 and this one
  // =================================================================================================================
  await block('no OBBBA word: as before §17', async () => {
    const assembleB = await assembleBefore();
    if (!C.chk('the code before §17 is in this clone (commit ' + BEFORE + '); in a shallow clone run git fetch --unshallow', !!assembleB)) return;
    const tb = loadTool({ html: assembleB({}) });
    C.eq('the code before §17 boots with no script errors', tb.errors, []);
    const SPb = tb.SP;
    // every row of the plan, every OBBBA word taken out of every name and every Budget Flex 02, which keeps other text
    const pl = rows => rows.map(plainRow);
    const omW = pl(OM), sets = () => ALL(omW, pl(SPR), pl(FF), pl(OPN));
    const baeW = BAE.map(r => [unword(r[0]), r[1], r[2], r[3], unword(r[4]), r[5] === '' ? '' : 'Relief ' + unword(r[5]).replace(/OBBBQ/gi, 'Act'), unword(r[6])]);
    C.chk('… the plan compared holds no OBBBA word anywhere', !J([OM, SPR, FF, OPN].map(pl)).match(/OBBBA/i) && !J(baeW).match(/\bOBBBA\b/i));
    for (const [name, withRep] of [['no report', false], ['with a report', true]]) {
      const Pn2 = await SP.parseFiles(files(sets(), withRep ? baeW : null), { now: NOW }), Pb2 = await SPb.parseFiles(files(sets(), withRep ? baeW : null), { now: NOW });
      for (const [w, first, off, lanes] of [['every switch on'], ['USAF off', 2025, ['USAF']], ['mandatory only', 2025, [], ['mand']], ['First FY 2026', 2026]]) {
        const Mn = SP.buildModel(Pn2.pulls, S0(SP, first), V0(SP, off, lanes), withBae(Pn2)), Mb = SPb.buildModel(Pb2.pulls, S0(SPb, first), V0(SPb, off, lanes), withBae(Pb2));
        C.chk(name + ', ' + w + ': the model is the one before §17, byte for byte', J(Mn) === J(Mb));
        const meta = P => ({ report: P.report, today: '2026-11-09', bae: withBae(P) });
        const sn = J(SP.excelSpec(Mn, Pn2.pulls, S0(SP, first), meta(Pn2))), sb = J(SPb.excelSpec(Mb, Pb2.pulls, S0(SPb, first), meta(Pb2))).replace('"creator":"SFCB Spend Plan"', '"creator":"APEX"');   // the creator is the tool's name, APEX since §19
        let at = 0; while (at < sn.length && sn[at] === sb[at]) at++;
        C.chk(name + ', ' + w + ': the workbook is the one before §17, cell for cell', sn === sb, 'first difference at ' + at + ': before …' + sb.slice(Math.max(0, at - 100), at + 80) + '… now …' + sn.slice(Math.max(0, at - 100), at + 80));
      }
    }
    // the store and every view but Help, on a plan of two imports each with a report
    const omW2 = omW.map(r => (r['CCaR No'] === 'QD0003' ? Object.assign({}, r, { Amount: '2100000' }) : r));
    const baeW2 = baeW.map((r, i) => (i === 6 ? [r[0], r[1], r[2] + 50000, r[3], r[4], r[5], r[6]] : r));
    const mk = async SPx => planOf(SPx, [[files(sets(), baeW), NOW], [files([['om.csv', omW2]], baeW2), NOW2]], { asOf: '2026-10' });
    const tn = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine', 'store'] }), tbs = loadTool({ html: assembleB({ modules: ['util', 'xlsx-read', 'import', 'engine', 'store'] }) });
    tn.window.confirm = () => true; tbs.window.confirm = () => true;
    const pn = await mk(tn.SP), pb = await mk(tbs.SP);
    tn.close(); tbs.close();
    C.eq('the import messages are the ones before §17', pn.msgs, pb.msgs);
    C.chk('the saved state is the one before §17', J(pn.state.pulls) === J(pb.state.pulls) && J(pn.state.bae) === J(pb.state.bae) && J(pn.state.settings) === J(pb.state.settings));
    const A = await boot(pageHtml({ state: pn.state })), Bp = await boot(withState(assembleB({}), pn.state));
    const same = (what, f) => { const a = f(A), b = f(Bp); C.chk('no OBBBA word: ' + what + ' is drawn as before §17', a === b, a.length + ' vs ' + b.length + ' characters, first difference at ' + [...a].findIndex((ch, i) => ch !== b[i])); };
    // the top's frame (the name, the menu's place) is APEX's since CONTRACT §18: what the top SAYS is compared
    same('the top (its pulls line and its message)', T => T.doc.getElementById('uiPulls').innerHTML + '|' + T.doc.getElementById('uiMsg').innerHTML);
    same('the switches', T => T.doc.querySelector('#uiFilters .filters').innerHTML   /* the row of switches; since CONTRACT §20 a button sits above it */);
    for (const v of ['summary', 'slides', 'om', 'ff', 'sp', 'opn', 'na', 'report', 'changes', 'settings']) {
      await A.view(v); await Bp.view(v);
      if (v === 'changes') {
        for (const T of [A, Bp]) for (const b of [...T.main().querySelectorAll('button[data-act=diff]:not([disabled])')]) { T.click(T.doc.querySelector('[data-fkey="' + b.getAttribute('data-fkey') + '"]')); await settle(); }
      }
      same('the ' + v + ' view', T => T.main().innerHTML);
    }
    await A.view('pmos'); await Bp.view('pmos');
    const n = A.main().querySelector('select[data-act=pmo]').options.length;
    for (let i = 0; i < n; i++) {
      for (const T of [A, Bp]) { T.change(T.main().querySelector('select[data-act=pmo]'), String(i)); await settle(); }
      same('PMO tab ' + i, T => T.main().innerHTML);
    }
    C.chk('… the pages compared held the plan (blocks, a report, two pulls)', n > 1 && J(SP.buildModel(pn.state.pulls.current, pn.state.settings, SP.defaultView(), pn.state.bae.current).blocks.map(b => b.key)).length > 20);
    C.eq('no script error on either page', A.errors().concat(Bp.errors()), []);
    A.t.close(); Bp.t.close(); tb.close();
  });

  // =================================================================================================================
  // THE README states the rule where it states First FY
  // =================================================================================================================
  {
    const rd = readFileSync(join(HERE, '..', 'README.md'), 'utf8');
    const at = rd.indexOf('## Data through and First FY'), next = rd.indexOf('\n## ', at + 5);
    const part = rd.slice(at, next);
    C.chk('README: the rule for O&M, by the name or Budget Flex 02, the rest counting', at >= 0 && /\*\*FY2025 O&M OBBBA funding is left out\*\* of every figure/.test(part)
      && /Budget Flex 02/.test(part) && /leave it in for Spares/.test(part) && /OBBBA funding of every other appropriation \(Initial Spares, Full Fund, OPN\) counts/.test(part.replace(/\s+/g, ' ')));
  }
} catch (e) {
  C.chk('the test ran to the end', false, (e && e.stack) || String(e));
} finally {
  t.close();
  tmp.rm();
  C.done();
}
