// FY2025 OBBBA funding is left out (CONTRACT §15; Brad, 11 Nov 2026: "Just leave FY25 OBBBA funding out. Although it's
// active technically, it's not a reporting year."). Every pull and report below is written here, by hand, as CSV, and
// every name and figure in them is invented. Each expectation is worked out from the rows this file writes, never read
// back from the tool's own figures.
//
// What it holds the tool to:
//   - SP.isObbba25 is the one predicate: the word OBBBA in any case, a whole word, FY 2025 exactly; no other source spells it;
//   - a pull's FY2025 OBBBA row counts in no figure, block, tree, PMO row or tab, Not Allocated item, slide block or picture,
//     whatever the switches show, exactly as if it were not in the pull (§15.2: treated as a row before First FY is);
//     an (ap, fy) whose only rows they are has no block, an unreadable one names none, a block that also has other rows
//     stays, less them; model.excluded.obbba says how much, by block and by budget;
//   - First FY 2026 takes them as before the First FY (the first condition a row fails); FY2026 OBBBA, a name with OBBBA
//     inside a longer word and a lower-case obbba are each what the rule says;
//   - a report's FY2025 OBBBA row is scope 'obbba', counts nowhere and covers nothing; its reason, its rows, the tally, the
//     noBlock flag, SP.diffBae leaving it out, SP.diffPulls keeping the pull's;
//   - every §15.4 word, on the screen and in the workbook (read back with openpyxl), the import message and Help;
//   - with no FY2025 OBBBA row loaded, the model, every view but Help, the workbook and the import message are what the
//     code before §15 (commit 8fada01, read from git) makes of the same plan, byte for byte.
//
//   node spend-plan/test/obbba.test.mjs
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
const C = checks('obbba');
const tmp = scratchDir('sfcbsp-obbba-');
const J = x => JSON.stringify(x);
const settle = (ms = 20) => new Promise(res => setTimeout(res, ms));
// the code before §15: the contract for it was committed first, with no line of its code
const BEFORE = '8fada01';
const NOW = '2026-11-09T12:00:00.000Z', NOW2 = '2026-11-16T12:00:00.000Z';

// ------------------------------------------------------------------------------------------------ restated from §15
// Restated, never read from the tool: a change on either side is then a disagreement this test reports, not an echo.
const WHY = 'FY2025 OBBBA funding (not a reporting year)';
const HEAD = 'FY2025 OBBBA funding, left out (not a reporting year)';
const RULE = 'FY2025 OBBBA funding is left out of every figure: it is not a reporting year (Brad, 11 Nov 2026).';
const WHERE = 'FY2025 OBBBA funding is left out (not a reporting year), so no block is shown';
const EVERY = ' This counts every service and lane, whatever the switches show.';
const AP = { om: 'O&M', ff: 'Full Fund', sp: 'Initial Spares', opn: 'OPN' };
const pad2 = n => String(n).padStart(2, '0');
const commas = d => d.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
// §2: $M in a sentence (zero 0.00) and exact dollars, restated
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
const rows1 = n => n + (n === 1 ? ' row' : ' rows');
const D = d => Math.round(d * 100);            // dollars -> cents
const normKey = s => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
const flat = s => String(s ?? '').replace(/\s+/g, ' ').trim();

// ------------------------------------------------------------------------------------------------ the pulls and report
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const BAE_H = ['Budget Name', 'Budget FY Numeric', 'Budget Approved Amount', 'Budget Authorized Amount'];
const baeCsv = rows => [BAE_H.join(',')].concat(rows.map(r => r.map(q).join(','))).join('\n');
const EX = 'Actual Execution is allocated', NA = 'Not Allocated';
const AV = 'Air Vehicle (AV)', PSM = 'Product Support Management (PSM)', TSS = 'Training Systems (TSS)';
const row = (FY, ccar, Title, Budget, pe, Date, Amount, Alloc, PMO) => ({ FY, 'CCaR No': ccar, Title, Budget, 'Plan Event': pe, Date, Amount, Alloc, PMO });
const B_OM = 'USAF O&M- Invented Line Discretionary AV';
const B_OMO = 'USAF O&M- Invented OBBBA Line Discretionary AV';
const B_OMO_LOW = 'usaf o&m- invented obbba line discretionary av';       // the same budget (normKey), in lower case
const B_OMN = 'USN O&M- Invented OBBBA Mandatory PSM';
const B_OMX = 'USAF O&M- Invented NOBBBAX Line Discretionary AV';        // OBBBA inside a longer word: ordinary
const B_FF = 'USAF APN Full Fund Invented Discretionary AV';
const B_FFO = 'USN APN Full Fund Invented OBBBA Discretionary TSS';
const B_SP = 'USAF APN Spares Invented Initial';
const B_SPO = 'USAF APN Spares Invented OBBBA Initial';
const OM = [
  row(2024, 'QA0001', 'Invented Title A', B_OM, 'Ev A', '2024-03-10', '250000', EX, AV),       // before First FY 2025
  row(2025, 'QA0010', 'Invented Title B', B_OMO, 'Ev B', '2024-11-10', '1000000', EX, AV),     // O&M FY2025: OBBBA only
  row(2025, 'QA0011', 'Invented Title B', B_OMO_LOW, 'Ev B2', '2025-02-10', '400000', NA, AV),
  row(2025, 'QA0012', 'Invented Title C', B_OMN, 'Ev C', '2025-05-10', '150000', EX, PSM),
  row(2025, 'QA0013', 'Invented Title C', B_OMO, 'Ev D', '2025-06-10', 'n/a', NA, AV),         // unreadable amount
  row(2026, 'QA0020', 'Invented Title E', B_OM, 'Ev E', '2025-11-10', '2000000', EX, AV),
  row(2026, 'QA0021', 'Invented Title F', B_OMO, 'Ev F', '2026-01-10', '300000', EX, AV),       // OBBBA FY2026: counts
  row(2026, 'QA0022', 'Invented Title G', B_OMX, 'Ev G', '2026-08-10', '200000', NA, AV),       // NOBBBAX: counts
];
const FF = [
  row(2025, 'QB0001', 'Invented Title H', B_FF, 'Ev H', '2025-01-10', '4000000', EX, AV),       // Full Fund FY2025: stays, less OBBBA
  row(2025, 'QB0002', 'Invented Title I', B_FFO, 'Ev I', '2025-02-10', '700000', EX, TSS),
  row(2025, 'QB0003', 'Invented Title I', B_FFO, 'Ev J', '2025-09-10', '100000', NA, TSS),
  row(2025, 'QB0004', 'Invented Title H', B_FF, 'Ev K', '2025-03-10', '1000000', NA, AV),
];
const SPR = [
  row(2025, 'QC0001', 'Invented Title M', B_SPO, 'Ev M', '2025-04-10', 'n/a', NA, AV),          // its only row: unreadable OBBBA
  row(2026, 'QC0002', 'Invented Title N', B_SP, 'Ev N', '2026-04-10', '800000', EX, AV),
];
const OBB_CCARS = ['QA0010', 'QA0011', 'QA0012', 'QB0002', 'QB0003'];          // the readable FY2025 OBBBA rows
// §15.1 restated: the word OBBBA, any case, FY 2025
const isOb = r => r.FY === 2025 && /\bOBBBA\b/i.test(r.Budget);
const BAE = [
  [B_OMO, 2025, 9000000, 8000000],                         // 1 FY2025 OBBBA
  [B_OM, 2025, 3000000, 2500000],                          // 2 ordinary O&M FY2025: the pull's rows there are all OBBBA (noBlock, obbba)
  [B_OM, 2026, 5000000, 4000000],                          // 3 covers O&M FY2026
  [B_OMO, 2026, 600000, 500000],                           // 4 OBBBA FY2026: counts
  [B_OM, 2027, 7000000, 7000000],                          // 5 ordinary noBlock (no pull rows at all)
  [B_FF, 2025, 6000000, 6000000],                          // 6 covers Full Fund FY2025
  [B_FFO, 2025, 1000000, 900000],                          // 7 FY2025 OBBBA
  ['USAF APN Full Fund Invented OBBBA Flyaway', 2025, 2000000, 2000000],   // 8 Flyaway comes first
  ['Invented OBBBA Staff Office', 2025, 300000, 300000],   // 9 names no appropriation comes first
  [B_SP, 2026, 900000, 800000],                            // 10 covers Initial Spares FY2026
  ['USAF APN Full Fund Invented Flyaway', 2026, 1500000, 1500000],         // 11 Flyaway
];
const BAE_OB = [0, 6];                                    // the indexes of the FY2025 OBBBA rows of scope obbba
const isObR = r => r[1] === 2025 && /\bOBBBA\b/i.test(r[0]);   // §15.1 restated, on a report row (rows 1, 7, 8 and 9)
const files = (om, ff, sp, bae) => [['om.csv', csv(om)], ['ff.csv', csv(ff)], ['sp.csv', csv(sp)]].filter(([, d]) => d.split('\n').length > 1)
  .concat(bae ? [['bae.csv', baeCsv(bae)]] : []).map(([name, data]) => ({ name, data }));

// ---------------------------------------------------------------------------------------------- what the rows add to
const sumOf = (rows, f) => rows.reduce((a, r) => a + (f ? f(r) : D(Number(r.Amount))), 0);
const obRows = OM.concat(FF).filter(r => OBB_CCARS.includes(r['CCaR No']));
const EXP_OB = {
  rows: 5, cents: D(2350000), obligated: D(1850000),
  blocks: [{ ap: 'om', fy: 2025, rows: 3, cents: D(1550000), obligated: D(1150000) }, { ap: 'ff', fy: 2025, rows: 2, cents: D(800000), obligated: D(700000) }],
  budgets: [{ key: normKey(B_OMO), name: B_OMO, ap: 'om', rows: 2, cents: D(1400000), obligated: D(1000000) },
    { key: normKey(B_OMN), name: B_OMN, ap: 'om', rows: 1, cents: D(150000), obligated: D(150000) },
    { key: normKey(B_FFO), name: B_FFO, ap: 'ff', rows: 2, cents: D(800000), obligated: D(700000) }],
};
C.chk('the fixture: the figures restated below are those of its FY2025 OBBBA rows', sumOf(obRows) === EXP_OB.cents
  && sumOf(obRows.filter(r => r.Alloc === EX)) === EXP_OB.obligated
  && J(OM.concat(FF, SPR).filter(isOb).map(r => r['CCaR No'])) === J(['QA0010', 'QA0011', 'QA0012', 'QA0013', 'QB0002', 'QB0003', 'QC0001']));
const EXP_NOTE = 'FY2025 OBBBA funding is left out of every figure: it is not a reporting year. The CCaR pull holds 5 rows of it on 3 budgets '
  + '(O&M FY2025, Full Fund FY2025), ' + $M(D(2350000)) + ' planned, ' + $M(D(1850000)) + ' of it obligated. See the Import report.';
const EXP_LINES = (withBae) => ['A row whose budget name holds the word OBBBA and whose FY is 2025 counts in no figure, block, list or picture, whatever the '
  + 'switches show: FY2025 is not a reporting year (Brad, 11 Nov 2026).',
'In the CCaR pulls: 5 rows on 3 budgets (O&M FY2025, Full Fund FY2025):',
'  “' + B_OMO + '” (O&M): 2 rows, plan ' + usd(D(1400000)) + ', obligated ' + usd(D(1000000)) + '.',
'  “' + B_OMN + '” (O&M): 1 row, plan ' + usd(D(150000)) + ', obligated ' + usd(D(150000)) + '.',
'  “' + B_FFO + '” (Full Fund): 2 rows, plan ' + usd(D(800000)) + ', obligated ' + usd(D(700000)) + '.',
'  Total: 5 rows, plan ' + usd(D(2350000)) + ', obligated ' + usd(D(1850000)) + '.']
  .concat(withBae ? ['In the BAE report: 2 rows, Approved ' + usd(D(10000000)) + ', Authorized ' + usd(D(8900000)) + '.'] : []);
const NOBLOCK_NOTE = 'O&M FY2025 has no block: its only CCaR pull rows are FY2025 OBBBA funding, which is left out. The BAE report’s '
  + $M(D(3000000)) + ' Approved and ' + $M(D(2500000)) + ' Authorized for it are not shown.';

// ------------------------------------------------------------------------------------------------ the tools
function py(args) { return spawnSync('python3', ['-I', ...args], { encoding: 'utf8', maxBuffer: 1 << 30 }); }
function readBook(file) {
  const r = py([READ, file]);
  if (r.status !== 0) throw new Error('export-read.py failed: ' + r.stderr.slice(-800));
  return JSON.parse(r.stdout);
}
// a sheet as rows of their cells' values (by column)
function sheetRows(book, name) {
  const s = book.sheets.find(x => x.name === name);
  if (!s) return null;
  return s.rows.map(r => { const a = []; for (const [ci, v] of r.cells) a[ci] = v; return a; });
}
// the page as the sources at BEFORE build it, from git, assembled by that commit's own build.mjs in a scratch tree; null
// when this clone does not hold the commit (the check that needs it then fails, saying so)
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
// a whole page in jsdom, booted, with what a person uses
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
// a plan made by the tool's own import and store: each import [files, now], then the settings; the state a saved file holds
async function planOf(SPx, imports, settings) {
  const msgs = [];
  for (const [fs, now] of imports) msgs.push(SPx.applyImport(await SPx.parseFiles(fs, { now })).message);
  if (settings) SPx.setSettings(settings);
  return { state: JSON.parse(J(SPx.state)), msgs };
}
// the workbook the UI's own Export writes, read back with openpyxl
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
// what the products print of a model, beside what the rule may add: every field §15 leaves alone
const counted = M => J({ blocks: M.blocks, aps: M.aps, pmos: M.pmos, naAll: M.naAll, total: M.summary.total, present: M.present, shown: M.shown,
  showNoDate: M.showNoDate, execAfterAsOf: M.execAfterAsOf, execNoDate: M.execNoDate, stale: M.stale });

const t = loadTool();
const SP = t.SP;
try {
  C.eq('the page boots with no script errors', t.errors, []);

  // =================================================================================================================
  // §15.1 THE ONE PREDICATE
  // =================================================================================================================
  await block('the predicate', async () => {
    C.eq('SP.OBBBA_FY is 2025', SP.OBBBA_FY, 2025);
    const cases = [['USAF O&M OBBBA Line', 2025, true], ['usaf o&m obbba line', 2025, true], ['USAF ObBbA', 2025, true], ['OBBBA', 2025, true],
      ['USAF O&M OBBBA-2 Line', 2025, true], ['USAF NOBBBAX Line', 2025, false], ['USAF OBBBAX Line', 2025, false], ['USAF XOBBBA Line', 2025, false],
      ['USAF OBBBA_2 Line', 2025, false], ['USAF O&M OBBBA Line', 2026, false], ['USAF O&M OBBBA Line', 2024, false], ['USAF O&M OBBBA Line', '2025', false],
      ['USAF O&M OBBBA Line', null, false], ['USAF O&M Line', 2025, false], [null, 2025, false], ['', 2025, false]];
    const bad = cases.filter(([n, fy, w]) => SP.isObbba25(n, fy) !== w);
    C.chk('SP.isObbba25: the whole word OBBBA, any case, FY 2025 exactly', !bad.length, J(bad));
    // nothing else spells the rule: the word as a pattern, and a test against the year, are in 10-util.js alone
    const src = n => readFileSync(join(HERE, '..', 'src', n), 'utf8');
    const others = ['20-xlsx-read.js', '30-import.js', '40-engine.js', '50-xlsx-write.js', '60-export.js', '70-pictures.js', '80-store.js', '90-ui.js'];
    const spelled = others.filter(n => /\\bOBBBA|OBBBA\\b|\/[^/\n]*obbba[^/\n]*\/[gimsuy]*/i.test(src(n)) || /[=!]==?\s*2025\b|\b2025\s*[=!]==?/.test(src(n)));
    C.eq('no source but 10-util.js spells the rule (a pattern for the word, or a test against 2025)', spelled, []);
    C.chk('… and 10-util.js defines SP.isObbba25 once, on SP.OBBBA_FY', (src('10-util.js').match(/SP\.isObbba25 = /g) || []).length === 1
      && /SP\.OBBBA_FY = 2025;/.test(src('10-util.js')) && /fy === SP\.OBBBA_FY/.test(src('10-util.js')));
  });

  // =================================================================================================================
  // §15.2 PULL ROWS: the model
  // =================================================================================================================
  const P1 = await SP.parseFiles(files(OM, FF, SPR), { now: NOW });
  const P0 = await SP.parseFiles(files(OM.filter(r => !isOb(r)), FF.filter(r => !isOb(r)), SPR.filter(r => !isOb(r))), { now: NOW });
  C.chk('the pulls read: O&M, Full Fund and Initial Spares', J(Object.keys(P1.pulls)) === J(['om', 'ff', 'sp']), J(Object.keys(P1.pulls)));
  await block('the model', async () => {
    const M = SP.buildModel(P1.pulls, S0(SP), V0(SP));
    C.eq('the blocks: O&M FY2025 vanishes (its rows are all OBBBA), Initial Spares FY2025 too (its one row is an unreadable OBBBA row), Full Fund FY2025 stays',
      M.blocks.map(b => b.key), ['om|2026', 'ff|2025', 'sp|2026']);
    C.eq('model.excluded.obbba (§15.2)', M.excluded.obbba, EXP_OB);
    C.eq('model.obbbaNoBlock: the (ap, fy) whose only pull rows are FY2025 OBBBA funding, readable or not', M.obbbaNoBlock, [{ ap: 'om', fy: 2025 }, { ap: 'sp', fy: 2025 }]);
    C.eq('the unreadable OBBBA rows are counted as unreadable (the first condition they fail)', M.excluded.unreadable.rows, 2);
    C.eq('before First FY is what it was', [M.excluded.beforeFirst.cents, M.excluded.beforeFirst.rows], [D(250000), 1]);
    const ff = M.blocks.find(b => b.key === 'ff|2025'), om = M.blocks.find(b => b.key === 'om|2026');
    C.eq('Full Fund FY2025 stays, less its OBBBA rows: Approved and Obligated', [ff.approved, ff.obligated], [D(5000000), D(4000000)]);
    C.eq('O&M FY2026 holds the FY2026 OBBBA row and the NOBBBAX row: Approved and Obligated', [om.approved, om.obligated], [D(2500000), D(2300000)]);
    C.eq('no PMO tab for a PMO whose only rows are FY2025 OBBBA funding (PSM, TSS)', M.pmos.map(p => p.label), [AV]);
    const nas = M.naAll.map(i => i.label + '|' + (i.ccars || []).join(';'));
    C.chk('no Not Allocated item from a FY2025 OBBBA row', !M.naAll.some(i => (i.ccars || []).some(c => /QA001[0-3]|QB000[23]/.test(c))), J(nas));
    const ccars = [];
    const walk = n => { if (n.kind === 'ccar') ccars.push(n.label); (n.children || []).forEach(walk); };
    M.blocks.forEach(b => b.tree.forEach(walk));
    C.chk('no tree holds a FY2025 OBBBA row’s CCaR', !ccars.some(c => /QA001[0-3]|QB000[23]|QC0001/.test(c)) && ccars.includes('QA0021') && ccars.includes('QA0022'), J(ccars));
    // TREATED AS A ROW BEFORE FIRST FY IS: every figure the products print is the model of the same pulls without them
    const M0 = SP.buildModel(P0.pulls, S0(SP), V0(SP));
    C.chk('every figure, block, PMO row and tab, Not Allocated item and total is the one the pulls make without those rows', counted(M) === counted(M0));
    C.eq('… which have none to leave out', [M0.excluded.obbba.rows, M0.obbbaNoBlock], [0, []]);
    C.eq('no FY2025 OBBBA row loaded: model.excluded.obbba is the empty one', M0.excluded.obbba, { rows: 0, cents: 0, obligated: 0, blocks: [], budgets: [] });
    // whatever the switches
    for (const [w, off, lanes] of [['USAF off', ['USAF'], undefined], ['USN off', ['USN (USN CV)'], undefined], ['mandatory only', [], ['mand']]]) {
      const Mx = SP.buildModel(P1.pulls, S0(SP), V0(SP, off, lanes)), Mx0 = SP.buildModel(P0.pulls, S0(SP), V0(SP, off, lanes));
      C.chk(w + ': model.excluded.obbba and the blocks do not follow the switches', J(Mx.excluded.obbba) === J(EXP_OB) && J(Mx.blocks.map(b => b.key)) === J(M.blocks.map(b => b.key))
        && J(Mx.obbbaNoBlock) === J(M.obbbaNoBlock));
      C.chk(w + ': every figure is the one the pulls make without those rows', counted(Mx) === counted(Mx0));
    }
    // FIRST FY 2026: each row is set aside for the first condition it fails, so every FY2025 OBBBA row is before the First FY
    const Mf = SP.buildModel(P1.pulls, S0(SP, 2026), V0(SP));
    C.eq('First FY 2026: nothing is FY2025 OBBBA funding, all of it is before the First FY', [Mf.excluded.obbba, Mf.obbbaNoBlock],
      [{ rows: 0, cents: 0, obligated: 0, blocks: [], budgets: [] }, []]);
    C.eq('First FY 2026: money before it, by FY, every FY2025 row included', [Mf.excluded.beforeFirst.byFy, Mf.excluded.beforeFirst.rowsByFy],
      [{ 2024: D(250000), 2025: D(1550000 + 5800000) }, { 2024: 1, 2025: 7 }]);
    C.eq('First FY 2026: the blocks', Mf.blocks.map(b => b.key), ['om|2026', 'sp|2026']);
    C.chk('First FY 2026: no note on FY2025 OBBBA funding', !Mf.summary.notes.some(n => /OBBBA/.test(n)), J(Mf.summary.notes));
    // AN UNREADABLE ROW names its block (§4.6), unless it is FY2025 OBBBA funding: the same row under an ordinary name does
    const spPlain = SPR.map(r => (r['CCaR No'] === 'QC0001' ? Object.assign({}, r, { Budget: B_SP }) : r));
    const Pc = await SP.parseFiles(files(OM, FF, spPlain), { now: NOW });
    C.eq('control: the unreadable row under an ordinary name names Initial Spares FY2025, as §4.6 says', SP.buildModel(Pc.pulls, S0(SP), V0(SP)).blocks.map(b => b.key),
      ['om|2026', 'ff|2025', 'sp|2025', 'sp|2026']);
    // A BUDGET WHOSE ONLY COUNTED ROWS WERE FY2025 OBBBA FUNDING is not in pullOnly (§15.2), and has no offReport entry
    const Pr = await SP.parseFiles(files(OM, FF, SPR, BAE), { now: NOW });
    const Mr = SP.buildModel(Pr.pulls, S0(SP), V0(SP), withBae(Pr));
    C.eq('with the report: pullOnly holds the NOBBBAX budget, not the OBBBA budget the report lacks (USN … PSM)', Mr.bae.pullOnly, [normKey(B_OMX)]);
    C.eq('with the report: no offReport', Mr.bae.offReport, []);
    C.chk('with the report: model.excluded.obbba is the same, and the blocks too', J(Mr.excluded.obbba) === J(EXP_OB) && J(Mr.blocks.map(b => b.key)) === J(M.blocks.map(b => b.key)));
  });

  // =================================================================================================================
  // §15.3 REPORT ROWS
  // =================================================================================================================
  await block('the report', async () => {
    const Pr = await SP.parseFiles(files(OM, FF, SPR, BAE), { now: NOW });
    C.chk('the report reads, every row', Pr.bae && Pr.bae.rows.length === BAE.length, Pr.bae && Pr.bae.rows.length);
    const bae = withBae(Pr);
    const scopes = bae.rows.map(r => SP.baeDerive(r, S0(SP)).scope);
    C.eq('SP.baeDerive: scope obbba after Flyaway and naming no appropriation, before in', scopes,
      ['obbba', 'in', 'in', 'in', 'in', 'in', 'obbba', 'flyaway', 'noap', 'in', 'flyaway']);
    const M = SP.buildModel(Pr.pulls, S0(SP), V0(SP), bae);
    C.eq('model.bae.rows gains obbba', M.bae.rows, { in: 6, flyaway: 2, noap: 1, bad: 0, obbba: 2 });
    C.eq('the Counted reason, file order', M.bae.counted.map(x => x[1]),
      [WHY, 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', WHY, 'Flyaway (production)', 'Names no appropriation', 'Yes', 'Flyaway (production)']);
    C.eq('SP.BAE_COUNTED_WHY: obbba after first and before off', Object.keys(SP.BAE_COUNTED_WHY), ['bad', 'flyaway', 'noap', 'first', 'obbba', 'off', 'yes']);
    C.eq('SP.baeTally gains obbba', SP.baeTally(bae, S0(SP), V0(SP)), { rows: 11, yes: 6, bad: 0, flyaway: 2, noap: 1, first: 0, obbba: 2, off: 0, firstFY: 2025 });
    C.eq('… under First FY 2026 they are before the First FY', SP.baeTally(bae, S0(SP, 2026), V0(SP)),
      { rows: 11, yes: 4, bad: 0, flyaway: 2, noap: 1, first: 4, obbba: 0, off: 0, firstFY: 2026 });
    C.eq('… and USAF off reaches only the rows that would count', SP.baeTally(bae, S0(SP), V0(SP, ['USAF'])),
      { rows: 11, yes: 0, bad: 0, flyaway: 2, noap: 1, first: 0, obbba: 2, off: 6, firstFY: 2025 });
    C.eq('a FY2025 OBBBA row covers nothing, and counts nowhere: O&M FY2026 is the report’s ordinary rows and the FY2026 OBBBA row',
      M.blocks.map(b => [b.key, b.covered, b.approved, b.authorized]),
      [['om|2026', true, D(5600000), D(4500000)], ['ff|2025', true, D(6000000), D(6000000)], ['sp|2026', true, D(900000), D(800000)]]);
    C.eq('the report’s in-scope money leaves them out', [M.bae.cents, Object.keys(M.bae.byBlock)],
      [{ approved: D(3000000 + 5000000 + 600000 + 7000000 + 6000000 + 900000), authorized: D(2500000 + 4000000 + 500000 + 7000000 + 6000000 + 800000) },
        ['om|2025', 'om|2026', 'om|2027', 'ff|2025', 'sp|2026']]);
    C.eq('noBlock: O&M FY2025 carries obbba (its pull rows are all FY2025 OBBBA funding); O&M FY2027 does not', M.bae.noBlock,
      [{ ap: 'om', fy: 2025, approved: D(3000000), authorized: D(2500000), obbba: true }, { ap: 'om', fy: 2027, approved: D(7000000), authorized: D(7000000) }]);
    C.eq('the report’s FY2025 OBBBA rows by Counted: their money', [M.bae.derived.filter(d => d.why === WHY).map(d => [d.approved, d.authorized])],
      [[[D(9000000), D(8000000)], [D(1000000), D(900000)]]]);
    // the same plan with the report's OBBBA rows and the pull's taken out: every figure the same; noBlock the same but its flag
    const Pr0 = await SP.parseFiles(files(OM.filter(r => !isOb(r)), FF.filter(r => !isOb(r)), SPR.filter(r => !isOb(r)), BAE.filter(r => !isObR(r))), { now: NOW });
    const M0 = SP.buildModel(Pr0.pulls, S0(SP), V0(SP), withBae(Pr0));
    C.chk('with the report: every figure is the one the plan makes without the FY2025 OBBBA rows', counted(M) === counted(M0));
    C.eq('… noBlock too, but for its flag', M.bae.noBlock.map(t => { const x = Object.assign({}, t); delete x.obbba; return x; }), M0.bae.noBlock);
    C.chk('… and the plan without them has no rows.obbba key and no obbba flag', !('obbba' in M0.bae.rows) && M0.bae.noBlock.every(x => !('obbba' in x)), J([M0.bae.rows, M0.bae.noBlock]));
    // rows.obbba is there when such a row is loaded anywhere (the pull's alone here), by scope, so 0 when the report has none
    const Pr1 = await SP.parseFiles(files(OM, FF, SPR, BAE.filter((_, i) => !BAE_OB.includes(i))), { now: NOW });
    C.eq('the pull holds FY2025 OBBBA funding and the report none: rows.obbba is 0', SP.buildModel(Pr1.pulls, S0(SP), V0(SP), withBae(Pr1)).bae.rows,
      { in: 6, flyaway: 2, noap: 1, bad: 0, obbba: 0 });
    // a budget's scope is its name's: B_OMO's first report row is FY2025 OBBBA funding, its second FY2026 and counted
    C.eq('model.bae.budgets: a budget is a sustainment budget by its name, whatever FY its first row is', [M.bae.budgets[normKey(B_OMO)].scope, M.bae.budgets[normKey(B_FFO)].scope],
      ['in', 'in']);
    // a switch off: a noBlock entry follows the switches (§14.5), and still carries the flag where it stands
    const Mu = SP.buildModel(Pr.pulls, S0(SP), V0(SP, ['USN (USN CV)']), bae);
    C.eq('USN off: the same noBlock, flag and all', Mu.bae.noBlock, M.bae.noBlock);
    // SP.diffBae leaves them out as it leaves Flyaway out: a report whose FY2025 OBBBA rows changed, and which gained a budget
    // holding only FY2025 OBBBA money, changed nothing it compares; one whose FY2026 OBBBA row changed did (control)
    const R2 = BAE.map((r, i) => (i === 0 ? [r[0], r[1], 9500000, 8500000] : r)).concat([['USAF O&M- Invented Second OBBBA Discretionary AV', 2025, 400000, 400000]]);
    const Pb2 = await SP.parseFiles(files([], [], [], R2), { now: NOW2 });
    const d2 = SP.diffBae(bae, withBae(Pb2, NOW2), S0(SP));
    C.eq('SP.diffBae: FY2025 OBBBA rows are not compared', [d2.byBlock, d2.budgetsNew, d2.budgetsGone, d2.budgetsChanged, d2.budgetsUnread],
      [Object.fromEntries(Object.entries(SP.diffBae(bae, bae, S0(SP)).byBlock)), [], [], [], []]);
    C.chk('… and its byBlock has no O&M FY2025 money from them', d2.byBlock['om|2025'].approved[0] === D(3000000) && d2.byBlock['om|2025'].approved[1] === D(3000000), J(d2.byBlock['om|2025']));
    const R3 = BAE.map((r, i) => (i === 3 ? [r[0], r[1], 650000, 500000] : r));
    const d3 = SP.diffBae(bae, withBae(await SP.parseFiles(files([], [], [], R3), { now: NOW2 }), NOW2), S0(SP));
    C.eq('control: an OBBBA FY2026 row is compared', d3.budgetsChanged.map(b => b.key), [normKey(B_OMO)]);
    // SP.diffPulls compares the pulls themselves: a FY2025 OBBBA row's change is listed
    const om2 = OM.map(r => (r['CCaR No'] === 'QA0010' ? Object.assign({}, r, { Amount: '1200000' }) : r));
    const Pp2 = await SP.parseFiles(files(om2, [], []), { now: NOW2 });
    const dp = SP.diffPulls(P1.pulls, Pp2.pulls, S0(SP));
    C.eq('SP.diffPulls: O&M FY2025, every readable row, OBBBA included, before and after', dp.om.byBlock['om|2025'].approved, [D(1550000), D(1750000)]);
    C.chk('… and the line that changed is listed', dp.om.leaves.changed.some(l => l.ccar === 'QA0010' && l.change === D(200000)), J(dp.om.leaves.changed.map(l => l.ccar)));
  });

  // =================================================================================================================
  // §15.4 THE WORDS: the model's notes
  // =================================================================================================================
  await block('the notes', async () => {
    const M = SP.buildModel(P1.pulls, S0(SP), V0(SP));
    const N = M.summary.notes;
    const i = N.indexOf(EXP_NOTE), b = N.findIndex(n => /^Money before FY2025 is not shown/.test(n));
    C.chk('the Summary’s note on FY2025 OBBBA funding, in §15.4’s words, right after the note on money before First FY', i >= 0 && b >= 0 && i === b + 1, J(N));
    const Mu = SP.buildModel(P1.pulls, S0(SP), V0(SP, ['USAF']));
    C.chk('USAF off: it closes as the note on money before First FY does (it counts every service and lane)', Mu.summary.notes.includes(EXP_NOTE + EVERY)
      && Mu.summary.notes.some(n => /^Money before FY2025 is not shown: .*\.$/.test(n) && n.endsWith(EVERY)), J(Mu.summary.notes));
    // with FY2025 OBBBA funding the only row not counted, the switch's note still names its notes as covering every service
    const Pf = await SP.parseFiles(files([], FF, []), { now: NOW });
    const Mf = SP.buildModel(Pf.pulls, S0(SP), V0(SP, ['USAF']));
    C.chk('only FY2025 OBBBA funding not counted, USAF off: “Every figure counts only these, except the notes below on rows not counted …”',
      /Every figure counts only these, except the notes below on rows not counted, which cover every service and lane\.$/.test(Mf.summary.notes[0]), J(Mf.summary.notes));
    C.chk('… and that note is there', Mf.summary.notes.includes('FY2025 OBBBA funding is left out of every figure: it is not a reporting year. The CCaR pull holds 2 rows of it on 1 budget '
      + '(Full Fund FY2025), ' + $M(D(800000)) + ' planned, ' + $M(D(700000)) + ' of it obligated. See the Import report.' + EVERY), J(Mf.summary.notes));
    const Pr = await SP.parseFiles(files(OM, FF, SPR, BAE), { now: NOW });
    const Mr = SP.buildModel(Pr.pulls, S0(SP), V0(SP), withBae(Pr));
    const Nr = Mr.summary.notes;
    C.chk('the obbba noBlock note, in place of the ordinary words', Nr.includes(NOBLOCK_NOTE), J(Nr));
    C.chk('… and the ordinary noBlock note names only the other', Nr.includes('The BAE report holds money for O&M FY2027 (' + $M(D(7000000)) + ' Approved, ' + $M(D(7000000))
      + ' Authorized), which the CCaR pull has no rows for: no block is shown for it.') && !Nr.some(n => /holds money for O&M FY2025/.test(n)), J(Nr));
    C.chk('the report’s note names what it leaves out by kind, with “2 FY2025 OBBBA”', Nr.some(n => /^Approved and Authorized come from the BAE report /.test(n)
      && n.includes('Counted nowhere: 2 Flyaway (production) rows, 1 row naming no appropriation and 2 FY2025 OBBBA rows.')), J(Nr));
    C.chk('… and its rows of sustainment budgets leave them out', Nr.some(n => n.includes('it holds 6 rows of sustainment budgets (4 budgets)')), J(Nr));
    // the Import report's section (SP.obbbaLines, the view's and the sheet's): with no report, with the report, and with only
    // the report holding FY2025 OBBBA funding
    C.eq('the Import report section, no report: the pull side alone', SP.obbbaLines(M), EXP_LINES(false));
    C.eq('… with the report: and the report’s rows of it', SP.obbbaLines(Mr), EXP_LINES(true));
    const Po = await SP.parseFiles(files(OM.filter(r => !isOb(r)), FF.filter(r => !isOb(r)), SPR.filter(r => !isOb(r)), BAE), { now: NOW });
    const Mo = SP.buildModel(Po.pulls, S0(SP), V0(SP), withBae(Po));
    C.eq('… only the report holding some: the pulls none', SP.obbbaLines(Mo), [EXP_LINES(true)[0], 'In the CCaR pulls: none.', EXP_LINES(true)[6]]);
    C.chk('… and no Summary note on the pulls’ FY2025 OBBBA funding', !Mo.summary.notes.some(n => /^FY2025 OBBBA funding is left out/.test(n)), J(Mo.summary.notes));
    C.eq('no FY2025 OBBBA row loaded: no section', SP.obbbaLines(SP.buildModel(P0.pulls, S0(SP), V0(SP))), []);
    // an unreadable report row whose FY reads 2025 and whose name holds OBBBA: scope obbba, and why 'bad' (the first condition)
    const ub = { rows: [{ c: [B_OMO, 2025, null, 50000000], x: {}, src: [0, 'R', 2], bad: ['its Approved could not be read'] }] };
    C.eq('an unreadable FY2025 OBBBA report row: scope obbba, counted as could not be read', [SP.baeDerive(ub.rows[0], S0(SP)).scope, SP.baeTally(ub, S0(SP), V0(SP))],
      ['obbba', { rows: 1, yes: 0, bad: 1, flyaway: 0, noap: 0, first: 0, obbba: 0, off: 0, firstFY: 2025 }]);
  });

  // =================================================================================================================
  // THE SCREENS AND THE WORKBOOK, from a plan the tool's own import made: words on screen and in the workbook alike
  // =================================================================================================================
  await block('the products', async () => {
    const tp = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine', 'store'] });
    tp.window.confirm = () => true;
    const { state, msgs } = await planOf(tp.SP, [[files(OM, FF, SPR, BAE), NOW]], { asOf: '2026-10' });
    tp.close();
    // review P5-6: what "counted" means names the rule beside the First FY, as it names the switches: 8 rows here are
    // sustainment budgets of FY2025 or later, and 6 count
    C.chk('the import message names the report’s rows not counted, “2 FY2025 OBBBA” among them',
      msgs[0].includes('11 rows, 6 of them counted (sustainment budgets of FY2025 or later, FY2025 OBBBA funding left out); not counted: 2 Flyaway (production), '
        + '1 that names no appropriation and 2 FY2025 OBBBA.'), msgs[0]);
    const T = await boot(pageHtml({ state }));
    C.eq('the page boots on the plan with no script errors', T.errors(), []);
    const M = T.SP.buildModel(state.pulls.current, state.settings, T.SP.getView(), state.bae.current);
    // Summary
    const sum = await T.view('summary');
    const lis = [...sum.querySelectorAll('ul.notes li')].map(li => li.textContent);
    C.chk('screen, Summary: the note on FY2025 OBBBA funding and the obbba noBlock note', lis.includes(EXP_NOTE) && lis.includes(NOBLOCK_NOTE), J(lis));
    C.chk('screen, Summary: no row for O&M FY2025, a row for Full Fund FY2025', !sum.querySelector('tr[data-bk="om|2025"]') && !!sum.querySelector('tr[data-bk="ff|2025"]'));
    const slides = await T.view('slides');
    C.eq('screen, Slide blocks: one per block, none for O&M FY2025', [...slides.querySelectorAll('section.slide')].map(s => s.getAttribute('aria-label')),
      ['O&M FY2026', 'Full Fund FY2025', 'Initial Spares FY2026']);
    const om = await T.view('om');
    C.chk('screen, O&M: no FY2025 row or block, and no FY2025 OBBBA CCaR, at every level', !om.querySelector('tr[data-bk="om|2025"]') && !!om.querySelector('tr[data-bk="om|2026"]')
      && !/QA001[0-3]/.test(om.textContent), flat(om.textContent).slice(0, 300));
    const pm = await T.view('pmos');
    const opts = [...pm.querySelectorAll('select[data-act=pmo] option')].map(o => flat(o.textContent));
    C.chk('screen, PMOs: only the PMO with counted rows', opts.some(o => o.includes(AV)) && !opts.some(o => /Product Support|Training Systems/.test(o)), J(opts));
    const na = await T.view('na');
    C.chk('screen, Not Allocated: no item from a FY2025 OBBBA row', !/Ev B2|Ev J\b|QA0011|QB0003/.test(na.textContent));
    // Import report: the section, line for line, and the BAE section's words
    const rep = await T.view('report');
    const sec = rep.querySelector('section.obbba');
    C.chk('screen, Import report: the section, headed in §15.4’s words', !!sec && flat(sec.querySelector('h3').textContent) === HEAD, sec ? sec.innerHTML.slice(0, 200) : 'none');
    if (sec) C.eq('screen, Import report: its lines', [...sec.querySelectorAll('.rl')].map(e => e.textContent), EXP_LINES(true).map(s => s.trim()));
    const where = rep.querySelector('table.baeblocks tr[data-bk="om|2025"] td.wrap');
    C.eq('screen, the BAE section’s table: O&M FY2025, On this page', where && where.textContent, WHERE);
    const where27 = rep.querySelector('table.baeblocks tr[data-bk="om|2027"] td.wrap');
    C.eq('… control: O&M FY2027 keeps the ordinary words', where27 && where27.textContent, 'The CCaR pull has no rows for it, so no block is shown');
    const sc = rep.querySelector('ul.baerows li[data-scope=obbba]');
    C.eq('screen, the BAE section’s rows by scope count FY2025 OBBBA', sc && sc.textContent, WHY + ', counted nowhere: 2 rows.');
    C.chk('screen, the BAE section’s rule says it', /its FY is FY2025 or later, it is not FY2025 OBBBA funding \(not a reporting year\), and the switches show/.test(flat(rep.querySelector('section.baeread p.l2').textContent)));
    // Settings
    const set = await T.view('settings');
    const rl = set.querySelector('p.obbba-rule');
    C.eq('screen, Settings: the rule under First FY', rl && rl.textContent, RULE);
    // Help states the rule always
    const help = await T.help();
    C.chk('screen, Help: the rule where First FY is stated', /its FY is at least First FY, it is not FY2025 OBBBA funding, and the switches show its service and lane\./.test(flat(help.textContent))
      && /FY2025 OBBBA funding is left out of every figure, block, list and picture/.test(flat(help.textContent)), flat(help.textContent).slice(0, 200));

    // THE WORKBOOK, read back with openpyxl
    const Bk = await exportBook(T, 'products');
    const names = Bk.sheets.map(s => s.name);
    C.chk('workbook: no PMO tab for PSM or TSS, one for AV', names.includes('PMO AV') && !names.some(n => /PMO (PSM|TSS)/.test(n)), J(names));
    const Su = sheetRows(Bk, 'Summary');
    const texts = Su.map(r => (r || []).filter(v => typeof v === 'string').join(' | '));
    C.chk('workbook, Summary: the two notes, in the screen’s words', texts.includes(EXP_NOTE) && texts.includes(NOBLOCK_NOTE), J(texts.slice(-14)));
    C.chk('workbook, Summary: no O&M FY2025 row', !Su.some(r => r && r[1] === 2025 && r[0] === 'O&M'));
    const Sl = sheetRows(Bk, 'Slide Snapshots').map(r => (r || []).filter(v => typeof v === 'string').join(' '));
    C.chk('workbook, Slide Snapshots: no O&M FY2025 block', !Sl.some(s => /O&M FY2025/.test(s)) && Sl.some(s => /Full Fund FY2025/.test(s)));
    const Na = sheetRows(Bk, 'Not Allocated').map(r => (r || []).join(' '));
    C.chk('workbook, Not Allocated: no FY2025 OBBBA item', !Na.some(s => /Ev B2|Ev J\b|QA0011|QB0003/.test(s)));
    // the raw data sheets: every row, its reason
    const raw = (sheet) => Object.fromEntries(sheetRows(Bk, sheet).slice(1).filter(r => r).map(r => [r[2], r[35]]));
    const ro = raw('O&M Raw Data'), rf = raw('FF Raw Data'), rs = raw('Spares Raw Data');
    C.chk('workbook, O&M Raw Data: the unreadable OBBBA row is listed, as could not be read', /^No: could not be read/.test(ro.QA0013 || ''), J(ro.QA0013));
    delete ro.QA0013;
    C.eq('workbook, O&M Raw Data: every other row, and why it counts or not', ro, {
      QA0001: 'No: FY2024 is before the first FY shown (FY2025)', QA0010: 'No: ' + WHY, QA0011: 'No: ' + WHY, QA0012: 'No: ' + WHY,
      QA0020: 'Yes', QA0021: 'Yes', QA0022: 'Yes' });
    C.eq('workbook, FF Raw Data', rf, { QB0001: 'Yes', QB0002: 'No: ' + WHY, QB0003: 'No: ' + WHY, QB0004: 'Yes' });
    C.chk('workbook, Spares Raw Data: the unreadable OBBBA row is listed, as could not be read', /^No: could not be read/.test(rs.QC0001 || '') && rs.QC0002 === 'Yes', J(rs));
    // the BAE Report sheet's Counted
    const br = sheetRows(Bk, 'BAE Report');
    C.eq('workbook, BAE Report: Counted', br.slice(1).map(r => r[8]), [WHY, 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', WHY, 'Flyaway (production)', 'Names no appropriation', 'Yes', 'Flyaway (production)']);
    // the Import Report sheet: the section, then the BAE section's two lines
    const ir = sheetRows(Bk, 'Import Report').map(r => (r && r[0]) || '');
    const h = ir.indexOf(HEAD);
    C.chk('workbook, Import Report: the section, headed in §15.4’s words', h >= 0, J(ir));
    if (h >= 0) C.eq('workbook, Import Report: its lines, the screen’s', ir.slice(h + 1, h + 1 + EXP_LINES(true).length), EXP_LINES(true).map(s => '  ' + s));
    C.chk('workbook, Import Report: O&M FY2025 by appropriation and FY says why no block is shown',
      ir.includes('    O&M FY2025: Approved ' + usd(D(3000000)) + ', Authorized ' + usd(D(2500000)) + '; ' + WHERE + '.'), J(ir.filter(s => /FY2025:/.test(s))));
    C.chk('… control: O&M FY2027’s line is as before', ir.includes('    O&M FY2027: Approved ' + usd(D(7000000)) + ', Authorized ' + usd(D(7000000)) + '.'));
    C.chk('workbook, Import Report: rows by scope count FY2025 OBBBA', ir.some(s => s.startsWith('  Rows by what they are')
      && s.endsWith('1 row naming no appropriation, 2 rows of ' + WHY + ' and 0 rows that could not be read.')), J(ir.filter(s => /Rows by what/.test(s))));
    // the Settings sheet: the line under First FY
    const st = sheetRows(Bk, 'Settings').map(r => (r && r[0]) || '');
    const f = st.indexOf('First FY shown');
    C.eq('workbook, Settings: the rule, under First FY', st[f + 1], RULE);
    // the pictures: one per block, none for O&M FY2025 (the drawing is the pictures test's; here, which blocks)
    const realPng = T.SP.blockPng;
    T.SP.blockPng = async () => new Uint8Array([1, 2, 3]);
    const zip = await T.SP.allPicturesZip(M);
    T.SP.blockPng = realPng;
    const zf = join(tmp.dir, 'pics.zip');
    writeFileSync(zf, Buffer.from(await zip.arrayBuffer()));
    const zn = py(['-c', 'import sys, zipfile, json; print(json.dumps(zipfile.ZipFile(sys.argv[1]).namelist()))', zf]);
    C.eq('pictures: one per block, none for O&M FY2025', JSON.parse(zn.stdout || 'null'), ['O&M FY2026.png', 'Full Fund FY2025.png', 'Initial Spares FY2026.png']);
    C.eq('no script error on the screens', T.errors(), []);
    T.t.close();

    // FIRST FY 2026 on the same plan: none of it is said, because the rule leaves nothing out (they are before the First FY)
    const st2 = JSON.parse(J(state));
    st2.settings.firstFY = 2026;
    const T2 = await boot(pageHtml({ state: st2 }));
    const rep2 = await T2.view('report');
    C.chk('First FY 2026: no Import report section on FY2025 OBBBA funding', !rep2.querySelector('section.obbba'));
    const set2 = await T2.view('settings');
    C.chk('First FY 2026: no Settings line', !set2.querySelector('p.obbba-rule'));
    const B2 = await exportBook(T2, 'first2026');
    const raw2 = Object.fromEntries(sheetRows(B2, 'O&M Raw Data').slice(1).filter(r => r).map(r => [r[2], r[35]]));
    C.eq('First FY 2026, O&M Raw Data: a FY2025 OBBBA row is before the First FY', raw2.QA0010, 'No: FY2025 is before the first FY shown (FY2026)');
    C.eq('First FY 2026, BAE Report: its FY2025 OBBBA rows are before the First FY', [0, 6].map(i => sheetRows(B2, 'BAE Report')[i + 1][8]), ['Before the first FY', 'Before the first FY']);
    C.chk('First FY 2026: no Import Report section, no Settings line', !sheetRows(B2, 'Import Report').some(r => r && r[0] === HEAD)
      && !sheetRows(B2, 'Settings').some(r => r && r[0] === RULE));
    T2.t.close();

    // What changed in the BAE report says it leaves them out, when either report holds some
    const tq = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine', 'store'] });
    tq.window.confirm = () => true;
    const R2 = BAE.map((r, i) => (i === 3 ? [r[0], r[1], 650000, 500000] : r));
    const pq = await planOf(tq.SP, [[files(OM, FF, SPR, BAE), NOW], [files([], [], [], R2), NOW2]], { asOf: '2026-10' });
    tq.close();
    C.chk('the second import’s message names “2 FY2025 OBBBA” too', pq.msgs[1].includes('2 FY2025 OBBBA'), pq.msgs[1]);
    const T3 = await boot(pageHtml({ state: pq.state }));
    const ch = await T3.view('changes');
    const bn = ch.querySelector('section.chg.bae p.note');
    C.chk('screen, What changed: the BAE report’s comparison says FY2025 OBBBA funding is left out, as Flyaway is',
      !!bn && flat(bn.textContent).startsWith('Its sustainment budgets are compared, every FY and every row, whatever the switches show; Flyaway, ' + WHY
        + ', and the budgets that name no appropriation are left out, as they are from every figure.'), bn && flat(bn.textContent));
    C.eq('no script error on What changed', T3.errors(), []);
    T3.t.close();
  });

  // =================================================================================================================
  // WITH NO FY2025 OBBBA ROW LOADED NOTHING CHANGES: the code before §15 and this one, on the same plan
  // =================================================================================================================
  await block('no FY2025 OBBBA row: as before', async () => {
    const assembleB = await assembleBefore();
    if (!C.chk('the code before §15 is in this clone (commit ' + BEFORE + '); in a shallow clone run git fetch --unshallow', !!assembleB)) return;
    const tb = loadTool({ html: assembleB({}) });
    C.eq('the code before §15 boots with no script errors', tb.errors, []);
    const SPb = tb.SP;
    // the same pulls and report less every FY2025 OBBBA row: the FY2026 OBBBA row and the NOBBBAX row stay, and count
    // (the report less every row the predicate names: its FY2025 OBBBA Flyaway and no-appropriation rows too, which are
    // FY2025 OBBBA funding by §15.1 even though another reason comes first)
    const om0 = OM.filter(r => !isOb(r)), ff0 = FF.filter(r => !isOb(r)), sp0 = SPR.filter(r => !isOb(r)), bae0 = BAE.filter(r => !isObR(r));
    const om0b = om0.map(r => (r['CCaR No'] === 'QA0021' ? Object.assign({}, r, { Amount: '350000' }) : r));
    const bae0b = bae0.map(r => (r[0] === B_OMO ? [r[0], r[1], 650000, 500000] : r));
    const strip = M => { const x = JSON.parse(J(M)); delete x.obbbaNoBlock; delete x.excluded.obbba; return J(x); };
    // §16 (Brad, 11 Nov 2026, built after §15 on this tree) moves, WITH A REPORT LOADED ONLY, a covered block's PMO rows
    // (by the plan events), the BAE Report sheet's PMO column, the words under a PMO tab, the Summary's note on report money
    // no plan event uses and the Import report's two lists. The code before §15 has none of it, so with a report those are set
    // aside on both sides here, and engine-bae, export-bae and screens-bae hold them to the oracle; everything else must
    // still be the code before §15's, byte for byte. A PMO's detail (its rows by the PMO column) is §16's too, and stays.
    const DETAIL = ['key', 'ap', 'fy', 'n', 'curve', 'cols', 'cum', 'obl', 'goalC', 'statusC', 'tree', 'na', 'unprog', 'execAfterAsOf', 'planned', 'slide'];
    const mask16 = (M, rep) => {
      const x = JSON.parse(M);
      if (!rep) return J(x);
      if (x.bae) { delete x.bae.split; delete x.bae.unassigned; for (const d of x.bae.derived || []) delete d.goes; }
      x.summary.notes = x.summary.notes.filter(n => !n.startsWith('The PMO tabs share'));
      x.pmos = x.pmos.map(p => ({ key: p.key, label: p.label, code: p.code, blocks: p.blocks.filter(b => b.tree.length || b.planned)
        .map(b => Object.fromEntries(DETAIL.map(f => [f, b[f]]))) })).filter(p => p.blocks.length);
      return J(x);
    };
    const ROW16 = /^(The PMO tabs share| {2}Budgets split among PMOs by their plan events| {2}BAE report money no plan event uses)/;
    const wb16 = (spec, rep) => {
      const x = JSON.parse(J(spec));
      if (!rep) return J(x);
      x.sheets = x.sheets.filter(sh => !/^PMO /.test(sh.name)).map(sh => {
        const text = r => (r.cells || []).map(c => (c && typeof c.v === 'string' ? c.v : '')).join('');
        const drop = new Set();
        let inList = false;
        sh.rows.forEach((r, i) => {
          const t = text(r);
          if (ROW16.test(t)) { drop.add(i); inList = !t.startsWith('The'); } else if (inList && t.startsWith('    ')) drop.add(i); else inList = false;
        });
        if (sh.name === 'BAE Report') {                     // its PMO column, the last but one (§16.2)
          const w = sh.rows[0].cells.length;
          for (const r of sh.rows.slice(1)) if (r.cells[w - 2]) r.cells[w - 2] = { s: r.cells[w - 2].s };
        }
        const merges = sh.merges.map(m => { const g = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(m); const i = Number(g[2]) - 1;
          return drop.has(i) ? null : J([g[1], g[3], Number(g[4]) - Number(g[2]), sh.rows[i]]); }).filter(Boolean).sort();
        return Object.assign(sh, { rows: sh.rows.filter((_, i) => !drop.has(i)), merges });
      });
      return J(x);
    };
    for (const [name, withRep] of [['no report', false], ['with a report', true]]) {
      const Pn = await SP.parseFiles(files(om0, ff0, sp0, withRep ? bae0 : null), { now: NOW });
      const Pb = await SPb.parseFiles(files(om0, ff0, sp0, withRep ? bae0 : null), { now: NOW });
      for (const [w, first, off, lanes] of [['every switch on'], ['USAF off', 2025, ['USAF']], ['mandatory only', 2025, [], ['mand']], ['First FY 2026', 2026], ['First FY 2024', 2024]]) {
        const Mn = SP.buildModel(Pn.pulls, S0(SP, first), V0(SP, off, lanes), withBae(Pn)), Mb = SPb.buildModel(Pb.pulls, S0(SPb, first), V0(SPb, off, lanes), withBae(Pb));
        C.chk(name + ', ' + w + ': the model is the one before §15, but for the empty excluded.obbba and obbbaNoBlock' + (withRep ? ' (and §16’s PMO figures, set aside)' : ''),
          mask16(strip(Mn), withRep) === mask16(J(Mb), withRep));
        C.chk(name + ', ' + w + ': … and those are empty', J(Mn.excluded.obbba) === J({ rows: 0, cents: 0, obligated: 0, blocks: [], budgets: [] }) && J(Mn.obbbaNoBlock) === '[]');
        const meta = P => ({ report: P.report, today: '2026-11-09', bae: withBae(P) });
        const sn = wb16(SP.excelSpec(Mn, Pn.pulls, S0(SP, first), meta(Pn)), withRep), sb = wb16(SPb.excelSpec(Mb, Pb.pulls, S0(SPb, first), meta(Pb)), withRep);
        let at = 0; while (at < sn.length && sn[at] === sb[at]) at++;
        C.chk(name + ', ' + w + ': the workbook is the one before §15, cell for cell' + (withRep ? ' (§16’s PMO tabs, PMO column and lines set aside)' : ''), sn === sb, 'first difference at ' + at + ': before …' + sb.slice(Math.max(0, at - 100), at + 80) + '… now …' + sn.slice(Math.max(0, at - 100), at + 80));
      }
    }
    // the store and every view (Help aside: it states the rule always), on a plan of two imports each with a report
    const mk = async SPx => planOf(SPx, [[files(om0, ff0, sp0, bae0), NOW], [files(om0b, [], [], bae0b), NOW2]], { asOf: '2026-10' });
    const tn = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine', 'store'] }), tbs = loadTool({ html: assembleB({ modules: ['util', 'xlsx-read', 'import', 'engine', 'store'] }) });
    tn.window.confirm = () => true; tbs.window.confirm = () => true;
    const pn = await mk(tn.SP), pb = await mk(tbs.SP);
    tn.close(); tbs.close();
    C.eq('the import messages are the ones before §15', pn.msgs, pb.msgs);
    C.chk('the saved state is the one before §15', J(pn.state.pulls) === J(pb.state.pulls) && J(pn.state.bae) === J(pb.state.bae) && J(pn.state.settings) === J(pb.state.settings));
    const A = await boot(pageHtml({ state: pn.state })), Bp = await boot(withState(assembleB({}), pn.state));
    const same = (what, f) => { const a = f(A), b = f(Bp); C.chk('no FY2025 OBBBA row: ' + what + ' is drawn as before §15', a === b, a.length + ' vs ' + b.length + ' characters, first difference at ' + [...a].findIndex((ch, i) => ch !== b[i])); };
    // §16 on the screens, set aside as above (both reports are loaded here): the Import report's account of a PMO's row and its
    // two lists, the Summary's note on money no plan event uses, and a PMO tab's table and the lines under it (its detail,
    // the sections below, stays)
    const html16 = (T, v) => {
      const m = T.main().cloneNode(true);
      if (v === 'report') {
        for (const h of [...m.querySelectorAll('section.baeread h4')].filter(h => /^(Budgets split among PMOs|BAE report money no plan event uses)/.test(h.textContent))) {
          while (h.nextElementSibling && h.nextElementSibling.tagName !== 'H4') h.nextElementSibling.remove();
          h.remove();
        }
        const l2 = m.querySelector('section.baeread p.l2');
        if (l2) l2.innerHTML = l2.innerHTML.replace(/ A PMO’s row .*$/, '');
      }
      for (const li of [...m.querySelectorAll('li, p')].filter(x => x.textContent.startsWith('The PMO tabs share'))) li.remove();
      // the strip over each block prints the PMO row's figures (§8.6 item 3), which §16 moves; the tree and band below it stay
      for (const x of m.querySelectorAll('section.blk-sec tr.strip')) x.remove();
      if (v === 'pmos') return [...m.querySelectorAll('section.blk-sec')].map(x => x.outerHTML).join('');
      return m.innerHTML;
    };
    const same16 = (what, v) => same(what, T => html16(T, v));
    same('the top', T => T.doc.getElementById('uiTop').innerHTML);
    same('the switches', T => T.doc.getElementById('uiFilters').innerHTML);
    // the pages compared hold the plan: its blocks on the Summary, both reports and both pulls on What changed
    await A.view('summary');
    C.eq('no FY2025 OBBBA row: the page compared holds the plan’s blocks', [...A.main().querySelectorAll('table.top tr[data-bk]')].map(r => r.getAttribute('data-bk')),
      ['om|2026', 'ff|2025', 'sp|2026', 'total']);
    await A.view('changes');
    C.chk('… and What changed compares two pulls and two reports', !!A.main().querySelector('section.chg.bae') && !!A.main().querySelector('section.chg.bae table')
      && A.main().querySelectorAll('button[data-act=diff]').length > 0, flat(A.main().textContent).slice(0, 300));
    for (const v of ['summary', 'slides', 'om', 'ff', 'sp', 'opn', 'na', 'report', 'changes', 'settings']) {
      await A.view(v); await Bp.view(v);
      if (v === 'changes') {
        for (const T of [A, Bp]) for (const b of [...T.main().querySelectorAll('button[data-act=diff]:not([disabled])')]) { T.click(T.doc.querySelector('[data-fkey="' + b.getAttribute('data-fkey') + '"]')); await settle(); }
      }
      same16('the ' + v + ' view', v);
    }
    await A.view('pmos'); await Bp.view('pmos');
    const n = A.main().querySelector('select[data-act=pmo]').options.length;
    for (let i = 0; i < n; i++) {
      for (const T of [A, Bp]) { T.change(T.main().querySelector('select[data-act=pmo]'), String(i)); await settle(); }
      same16('PMO tab ' + i + ', its detail', 'pmos');
    }
    // a switch off, then the Summary and the Import report again
    for (const T of [A, Bp]) { const box = T.doc.querySelector('#uiFilters input[type=checkbox]'); box.checked = false; box.dispatchEvent(new T.W.Event('change', { bubbles: true })); await settle(); }
    for (const v of ['summary', 'report', 'settings']) { await A.view(v); await Bp.view(v); same16('the ' + v + ' view with a switch off', v); }
    C.eq('no script error on either page', A.errors().concat(Bp.errors()), []);
    A.t.close(); Bp.t.close(); tb.close();
  });

  // =================================================================================================================
  // THE README states the rule where it states First FY
  // =================================================================================================================
  {
    const rd = readFileSync(join(HERE, '..', 'README.md'), 'utf8');
    const at = rd.indexOf('## Data through and First FY'), next = rd.indexOf('\n## ', at + 5);
    C.chk('README: the rule, under Data through and First FY', at >= 0 && /\*\*FY2025 OBBBA funding is left out\*\* of every figure/.test(rd.slice(at, next)));
  }
} catch (e) {
  C.chk('the test ran to the end', false, (e && e.stack) || String(e));
} finally {
  t.close();
  tmp.rm();
  C.done();
}
