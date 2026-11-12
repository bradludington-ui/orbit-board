// PMO tabs are built from the PMO's plan events (CONTRACT §16; Brad, 11 Nov 2026: "PMO tab should be based on Plan Event
// entries. The BAE budget assigned to that plan event should matrix over to populate the approved and authorized amounts.").
// A budget the plan events of several PMOs use is split among them by each one's CCaR plan on it; the figures go on the
// PMO's table only, the tree under it unchanged.
//
// Every pull and report below is written here, by hand, as CSV, imported through the tool's own import, and every name and
// figure in them is invented. Every expectation is worked out from the rows this file writes, by §16.1's rule restated
// here, never read back from the tool's figures. The rows are chosen so each case §16.4 names is here, side by side:
//   - a budget three PMOs' plan events use, with plans 1 : 2 : 4, so neither its Approved nor its Authorized divides evenly
//     and each has cents to place by largest remainder;
//   - a budget two PMOs use with EQUAL plans and an odd cent, so the tie goes to the PMO earlier in the model's order (and
//     one of them is (no PMO), the plan events with no PMO); its Authorized is negative, split as its absolute value;
//   - a budget whose plan nets to zero or below for every PMO (unassigned, 'noplan'), and one where one PMO's plan on it
//     nets below zero, so the other takes the whole;
//   - a budget no plan event uses (unassigned, 'nopull'), and a PMO whose plan events use only a budget the report lacks
//     (its row: Approved $0, its own Obligated);
//   - a plan event on two budgets, its plan counted on each;
//   - budgets whose names end in one PMO's code while other PMOs' plan events use them: a name decides no PMO any more;
//   - a covered and an uncovered block, in two appropriations, so a tab's lines name blocks in the tab's order; a service
//     switched off; report rows that do not count (before the First FY, Flyaway, FY2025 OBBBA) and one that counts in an
//     (ap, fy) with no block.
// It holds the model, the words (SP's), the workbook (read back with openpyxl), the screens (the page in jsdom, real
// clicks) to that, and holds the parts §16 leaves alone, with and without the report, to the code before §16 (commit
// 463c9ad, read from git), byte for byte.
//
//   node spend-plan/test/pmo-plan-events.test.mjs
// The test runs in a zone that is not UTC, as the other workbook tests do (review XP-9). Set before any date is made.
process.env.TZ = 'America/New_York';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadTool, pageHtml, checks, scratchDir } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');
const READ = join(HERE, 'export-read.py');
const C = checks('pmo-plan-events');
const tmp = scratchDir('sfcbsp-pmo16-');
const J = x => JSON.stringify(x);
const settle = (ms = 20) => new Promise(res => setTimeout(res, ms));
// the code before §16: §15 built, before any line of §16's code
const BEFORE = '463c9ad';
const NOW = '2026-11-09T12:00:00.000Z';
const TODAY = '2026-11-09';

// ------------------------------------------------------------------------------------------------ restated from §16
// Restated, never read from the tool: a change on either side is then a disagreement this test reports, not an echo.
const PE_LINE = 'Approved and Authorized are the BAE report’s figures for the budgets this PMO’s plan events are assigned to; a budget the plan events '
  + 'of several PMOs use is split among them by each one’s CCaR plan on it. Obligated counts this PMO’s plan events.';
const UN_TAIL = ' of the BAE report’s Approved is on budgets no plan event uses; it is in the Summary and on no PMO tab (see the Import report).';
const NARROW = 'Authorized is entered by appropriation and FY; where the BAE report has no figure for a block, its PMO row shows Approved.';
const SUMMARY_HEAD = 'The PMO tabs share each budget’s Approved and Authorized among the PMOs whose plan events use it, by their CCaR plan on it. ';
// review P5-2: the Summary's note names each block's unassigned Approved and Authorized (no Authorized is typed here, so the
// sentence on a typed figure is not said)
const SUMMARY_TAIL = ' of the BAE report’s money is on budgets no plan event uses, so the PMO tabs add up to the Summary less it.';
const SPLIT_HEAD = 'Budgets split among PMOs by their plan events';
const UN_HEAD = 'BAE report money no plan event uses (on no PMO tab)';
const NO_PE = 'No plan event uses it';
const WHY = { nopull: 'no plan event uses it in this block', noplan: 'its plan events’ plan is not above zero' };
const AP = { om: 'O&M', ff: 'Full Fund', sp: 'Initial Spares', opn: 'OPN' };
const TAB_AP = ['ff', 'sp', 'om', 'opn'];                 // §8.6: a PMO tab's rows run Full Fund, Initial Spares, O&M, OPN
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
const D = d => Math.round(d * 100);            // dollars -> cents
const normKey = s => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
const flat = s => String(s ?? '').replace(/\s+/g, ' ').trim();
const sum = a => a.reduce((x, y) => x + y, 0);

// ------------------------------------------------------------------------------------------------ the pulls and report
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const BAE_H = ['Budget Name', 'Budget FY Numeric', 'Budget Approved Amount', 'Budget Authorized Amount'];
const baeCsv = rows => [BAE_H.join(',')].concat(rows.map(r => r.map(q).join(','))).join('\n');
const EX = 'Actual Execution is allocated', NA = 'Not Allocated';
const AV = 'Air Vehicle (AV)', PP = 'Propulsion (PP)', PSM = 'Product Support Management (PSM)', TSS = 'Training Systems (TSS)',
  CDS = 'Combat Data Systems (CDS)', NOPMO = '(no PMO)';
let ccarN = 0;
const row = (FY, Budget, pe, Date, Amount, Alloc, PMO) => ({ FY, 'CCaR No': 'QH' + String(++ccarN).padStart(4, '0'), Title: 'Hand Title ' + pe, Budget,
  'Plan Event': pe, Date, Amount, Alloc, PMO });
// every budget's name ends in one PMO's code, and (B2, B3, B9) another PMO's plan events use it, or (B6) no tab has the code
const B1 = 'USAF O&M- Hand Line One Discretionary AV';
const B2 = 'USAF O&M- Hand Line Two Discretionary PSM';
const B3 = 'USAF O&M- Hand Line Three Discretionary PP';
const B4 = 'USAF O&M- Hand Line Four Discretionary TSS';
const B5 = 'USAF O&M- Hand Line Five Discretionary CDS';
const B6 = 'USAF O&M- Hand Line Six Discretionary MXS';
const B7 = 'USN O&M- Hand Line Seven Mandatory AV';
const B8 = 'USAF APN Full Fund Hand Line Discretionary AV';
const B9 = 'USAF APN Full Fund Hand Spare Discretionary PSM';
const BFLY = 'USAF APN Full Fund Hand Flyaway';
const BOB = 'USAF O&M- Hand OBBBA Line Discretionary AV';
const OM = [
  // O&M FY2026, covered. B1: AV, PP and PSM, plans 1 : 2 : 4; AV's plan event Ev A is on B2 too (a plan event on two budgets)
  row(2026, B1, 'Ev A', '2026-01-10', '1000000', EX, AV),
  row(2026, B1, 'Ev P1', '2026-01-10', '2000000', NA, PP),
  row(2026, B1, 'Ev S1', '2026-02-10', '4000000', NA, PSM),
  // B2: AV 3,000,000; PP nets to -1,000,000 (no share), so AV takes the whole
  row(2026, B2, 'Ev A', '2026-02-10', '3000000', NA, AV),
  row(2026, B2, 'Ev P2', '2026-03-10', '2000000', NA, PP),
  row(2026, B2, 'Ev P3', '2026-03-10', '-3000000', NA, PP),
  // B3: PSM nets to 0, AV to -100,000: no plan above zero ('noplan')
  row(2026, B3, 'Ev S2', '2026-04-10', '500000', NA, PSM),
  row(2026, B3, 'Ev S3', '2026-04-10', '-500000', NA, PSM),
  row(2026, B3, 'Ev A2', '2026-05-10', '-100000', NA, AV),
  // B4: TSS and the plan events with no PMO, equal plans
  row(2026, B4, 'Ev T1', '2026-05-10', '1000000', EX, TSS),
  row(2026, B4, 'Ev N1', '2026-06-10', '1000000', NA, ''),
  // B6: CDS's only plan event, on a budget the report lacks
  row(2026, B6, 'Ev C1', '2026-06-10', '9000000', EX, CDS),
  // B7: a USN budget, AV and PSM 3 : 1
  row(2026, B7, 'Ev A3', '2026-07-10', '600000', NA, AV),
  row(2026, B7, 'Ev S4', '2026-07-10', '200000', EX, PSM),
  // O&M FY2027: the report has no figure for it (§4.6's rows)
  row(2027, B1, 'Ev A4', '2026-11-10', '2000000', NA, AV),
  row(2027, B1, 'Ev S5', '2026-12-10', '500000', EX, PSM),
];
const FF = [
  // Full Fund FY2026, covered: B8 AV 5 : PP 3; B9 in the report only
  row(2026, B8, 'Ev F1', '2026-01-10', '5000000', EX, AV),
  row(2026, B8, 'Ev F2', '2026-02-10', '3000000', NA, PP),
];
const BAE = [
  [B1, 2026, 1000000, 0.10],          // row 2
  [B2, 2026, 77777.77, 0],            // row 3
  [B3, 2026, 40000, 40000],           // row 4
  [B4, 2026, 0.03, -0.03],            // row 5
  [B5, 2026, 12345, 0],               // row 6
  [B7, 2026, 1000.01, 1000],          // row 7
  [B8, 2026, 6000000, 5000000],       // row 8
  [B9, 2026, 250000, 250000],         // row 9
  [B1, 2024, 999, 999],               // row 10: before the First FY
  [BFLY, 2026, 2000000, 2000000],     // row 11: Flyaway
  [B1, 2028, 300000, 300000],         // row 12: counts, in an (ap, fy) with no block
  [BOB, 2025, 400000, 400000],        // row 13: FY2025 OBBBA (§15)
];
const files = withReport => [{ name: 'om.csv', data: csv(OM) }, { name: 'ff.csv', data: csv(FF) }]
  .concat(withReport ? [{ name: 'bae.csv', data: baeCsv(BAE) }] : []);

// ------------------------------------------------------------------------------------------------ worked out by hand
// §16.1 per covered block: each PMO's plan on each budget (its rows by the PMO column), each budget's report figures shared
// by largest remainder in whole cents. The model's PMO order (§4.4): SP.PMO_ORDER (AV, BOP, CDS, MxS, PSM, PP, TSS), then
// any other PMO by its label, (no PMO) last.
//   B1 Approved 100,000,000c by 1:2:4 -> 14,285,714.29 / 28,571,428.57 / 57,142,857.14: floors add to 99,999,999, the one
//      cent left to the largest remainder (PP, .57): AV 14,285,714, PP 28,571,429, PSM 57,142,857.
//      Authorized 10c -> 1.43 / 2.86 / 5.71: floors 8, two cents left to PP (.86) and PSM (.71): AV 1, PP 3, PSM 6.
//   B2 AV alone (PP's -1,000,000 takes no share): AV 7,777,777 and 0.
//   B3 no weight: unassigned, 'noplan'. B5 no pull row: unassigned, 'nopull'.
//   B4 3c by 1:1 -> 1.5 each; the odd cent to TSS (earlier than (no PMO)): TSS 2, (no PMO) 1. -3c: TSS -2, (no PMO) -1.
//   B7 100,001c by 3:1 -> 75,000.75 / 25,000.25: the cent to AV: AV 75,001, PSM 25,000. 100,000c: 75,000 / 25,000.
//   B8 600,000,000c by 5:3 -> AV 375,000,000, PP 225,000,000; 500,000,000c -> 312,500,000 / 187,500,000.
const EXP = {
  blocks: {          // [covered, approved, authorized, planned, obligated]
    'om|2026': [true, D(1131122.81), D(41000.07), D(20700000), D(11200000)],
    'om|2027': [false, D(2500000), D(2500000), D(2500000), D(500000)],
    'ff|2026': [true, D(6250000), D(5250000), D(8000000), D(5000000)],
  },
  // label -> [[key, approved, authorized, obligated, basis]], in the tab's order (§8.6)
  rows: {
    [AV]: [['ff|2026', 375000000, 312500000, D(5000000), 'planEvent'], ['om|2026', 14285714 + 7777777 + 75001, 1 + 0 + 75000, D(1000000), 'planEvent'],
      ['om|2027', D(2000000), D(2000000), 0, 'row']],
    [CDS]: [['om|2026', 0, 0, D(9000000), 'planEvent']],
    [PSM]: [['om|2026', 57142857 + 25000, 6 + 25000, D(200000), 'planEvent'], ['om|2027', D(500000), D(500000), D(500000), 'row']],
    [PP]: [['ff|2026', 225000000, 187500000, 0, 'planEvent'], ['om|2026', 28571429, 3, 0, 'planEvent']],
    [TSS]: [['om|2026', 2, -2, D(1000000), 'planEvent']],
    [NOPMO]: [['om|2026', 1, -1, 0, 'planEvent']],
  },
  split: [           // model order, then the budget's name; each largest share first, a tie in the model's order
    ['om', 2026, B4, 3, -3, [[TSS, D(1000000), 2, -2], [NOPMO, D(1000000), 1, -1]]],
    ['om', 2026, B1, 100000000, 10, [[PSM, D(4000000), 57142857, 6], [PP, D(2000000), 28571429, 3], [AV, D(1000000), 14285714, 1]]],
    ['om', 2026, B7, 100001, 100000, [[AV, D(600000), 75001, 75000], [PSM, D(200000), 25000, 25000]]],
    ['ff', 2026, B8, 600000000, 500000000, [[AV, D(5000000), 375000000, 312500000], [PP, D(3000000), 225000000, 187500000]]],
  ],
  unassigned: [
    { ap: 'om', fy: 2026, approved: D(52345), authorized: D(40000), budgets: [
      { key: normKey(B5), name: B5, approved: D(12345), authorized: 0, why: 'nopull' },
      { key: normKey(B3), name: B3, approved: D(40000), authorized: D(40000), why: 'noplan' }] },
    { ap: 'ff', fy: 2026, approved: D(250000), authorized: D(250000), budgets: [
      { key: normKey(B9), name: B9, approved: D(250000), authorized: D(250000), why: 'nopull' }] },
  ],
  // §16.2 the BAE Report sheet's PMO column, report row by report row (rows 2 to 13): a percent of the plan to one decimal,
  // half up, largest first; "No plan event uses it"; blank where the row does not count
  goes: [PSM + ' 57.1%; ' + PP + ' 28.6%; ' + AV + ' 14.3%', AV + ' 100.0%', NO_PE, TSS + ' 50.0%; ' + NOPMO + ' 50.0%', NO_PE,
    AV + ' 75.0%; ' + PSM + ' 25.0%', AV + ' 62.5%; ' + PP + ' 37.5%', NO_PE, '', '', NO_PE, ''],
};
// with USN (USN CV) switched off, B7's pull rows and its report row are hidden: AV and PSM keep B1 and B2 only
const EXP_USN = {
  rows: Object.assign({}, EXP.rows, {
    [AV]: [EXP.rows[AV][0], ['om|2026', 14285714 + 7777777, 1, D(1000000), 'planEvent'], EXP.rows[AV][2]],
    [PSM]: [['om|2026', 57142857, 6, 0, 'planEvent'], EXP.rows[PSM][1]],
  }),
  split: EXP.split.filter(e => e[2] !== B7),
  goes: EXP.goes.map((g, i) => (i === 5 ? '' : g)),
};
const splitText = ([ap, fy, name, a, u, ps]) => AP[ap] + ' FY' + fy + ': “' + name + '” (Approved ' + usd(a) + ', Authorized ' + usd(u)
  + '), by each PMO’s CCaR plan on it, largest share first: ' + ps.map(([l, w, pa, pu]) => l + ', plan ' + usd(w) + ': Approved ' + usd(pa)
  + ', Authorized ' + usd(pu)).join('; ') + '.';
const unText = (u, t) => AP[u.ap] + ' FY' + u.fy + ': “' + t.name + '” (Approved ' + usd(t.approved) + ', Authorized ' + usd(t.authorized) + '): ' + WHY[t.why] + '.';
// a tab's lines (§16.2 then §14.4): what its figures count, the money no plan event uses on its covered blocks in the tab's
// order, and §8.6's note narrowed to its rows the report does not cover. No row here carries Obligated on a budget the
// report's Approved leaves out, and no Authorized is typed, so neither of those lines is said.
const unOf = k => EXP.unassigned.find(u => u.ap + '|' + u.fy === k);
function tabLines(rows) {
  const cov = rows.filter(r => r[4] === 'planEvent').map(r => r[0]);
  const un = cov.map(unOf).filter(Boolean);
  return [PE_LINE].concat(un.length ? [un.map(u => AP[u.ap] + ' FY' + u.fy + ' $' + mText(u.approved) + 'M').join('; ') + UN_TAIL] : [],
    rows.some(r => r[4] === 'row') ? [NARROW] : []);
}
const SUMMARY_NOTE = SUMMARY_HEAD + EXP.unassigned.map(u => AP[u.ap] + ' FY' + u.fy + ' $' + mText(u.approved) + 'M Approved and $' + mText(u.authorized) + 'M Authorized')
  .join('; ') + SUMMARY_TAIL;

C.chk('the fixture: the hand-worked shares add up to each budget, to the cent', EXP.split.every(([, , , a, u, ps]) => sum(ps.map(p => p[2])) === a && sum(ps.map(p => p[3])) === u));
C.chk('the fixture: the PMO rows and the unassigned add up to each covered block, to the cent (§16.1)', ['om|2026', 'ff|2026'].every(k => {
  const rs = Object.values(EXP.rows).flatMap(l => l.filter(r => r[0] === k)), u = unOf(k);
  return sum(rs.map(r => r[1])) + u.approved === EXP.blocks[k][1] && sum(rs.map(r => r[2])) + u.authorized === EXP.blocks[k][2];
}));
// read off the report rows written above: B1's figures are not multiples of 7 (its plans add to 7 parts), and B4's are odd
// (two equal plans), so each has a cent to place, and B4's is a tie
C.chk('the fixture: the three-way split has cents to place in both figures, and the two-way one a tie', [2, 3].every(c => D(BAE[0][c]) % 7 !== 0)
  && [2, 3].every(c => Math.abs(D(BAE[3][c])) % 2 === 1) && BAE[0][0] === B1 && BAE[3][0] === B4);

// ------------------------------------------------------------------------------------------------ the tools
function py(args) { return spawnSync('python3', ['-I', ...args], { encoding: 'utf8', maxBuffer: 1 << 30 }); }
function readBook(file) {
  const r = py([READ, file]);
  if (r.status !== 0) throw new Error('export-read.py failed: ' + r.stderr.slice(-800));
  return JSON.parse(r.stdout);
}
// a sheet as rows of their cells' values (by column), and of their style rows
function sheetRows(book, name) {
  const s = book.sheets.find(x => x.name === name);
  if (!s) return null;
  return s.rows.map(r => { const a = []; for (const [ci, v] of r.cells) a[ci] = v; return a; });
}
const col0 = rows => rows.map(r => r[0]).filter(v => typeof v === 'string');
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
    errors: () => t.errors.filter(e => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click)/.test(String(e))),
  };
  return T;
}
async function block(name, fn) {
  try { await fn(); } catch (e) { C.chk(name + ': the checks stopped part way: ' + String((e && e.stack) || e).split('\n').slice(0, 3).join(' | '), false); }
}
const S0 = SPx => { const s = SPx.defaultSettings(TODAY); s.asOf = '2026-10'; s.firstFY = 2025; return s; };
const V0 = (SPx, off = []) => { const v = SPx.defaultView(); for (const s of off) v.svc[s] = false; return v; };
const withBae = parsed => (parsed.bae ? Object.assign({}, parsed.bae, { importedAt: NOW }) : null);
const rowsOf = M => Object.fromEntries(M.pmos.map(p => [p.label, p.rows.map(r => [r.key, r.approved, r.authorized, r.obligated, r.basis])]));
const splitOf = M => M.bae.split.map(e => [e.ap, e.fy, e.name, e.approved, e.authorized, e.pmos.map(p => [p.label, p.plan, p.approved, p.authorized])]);
const USN = 'USN (USN CV)';

const t = loadTool();
const SP = t.SP;
try {
  C.eq('the page boots with no script errors', t.errors, []);
  const P = await SP.parseFiles(files(true), { now: NOW });
  C.chk('the import brings both pulls and the report, every report row read', !!P.pulls.om && !!P.pulls.ff && !!P.bae && P.bae.rows.length === BAE.length
    && P.bae.rows.every(r => !r.bad || !r.bad.length), J(P.bae && P.bae.rows.map(r => r.bad)));
  const M = SP.buildModel(P.pulls, S0(SP), V0(SP), withBae(P));
  const Mu = SP.buildModel(P.pulls, S0(SP), V0(SP, [USN]), withBae(P));

  // =================================================================================================================
  // §16.1 THE MODEL
  // =================================================================================================================
  await block('the model', async () => {
    C.eq('the blocks: covered or not, Approved and Authorized the report’s, the plan and Obligated the pull’s', Object.fromEntries(M.blocks.map(b => [b.key,
      [b.covered, b.approved, b.authorized, b.planned, b.obligated]])), EXP.blocks);
    C.eq('§16.1: each PMO row, by its plan events (a share of each budget they use, by their CCaR plan on it); Obligated its own plan events’', rowsOf(M), EXP.rows);
    C.chk('§16.1: the PMOs with a row in a block are exactly the PMOs its tree shows', M.blocks.every(b => J(M.pmos.filter(p => p.rows.some(r => r.key === b.key))
      .map(p => p.key).sort()) === J(b.tree.map(n => n.key).sort())));
    C.chk('§16.1: a budget’s name gives no PMO a row: no tab for MxS, whose code B6 ends in; PSM none in Full Fund, whose B9 ends in PSM',
      !M.pmos.some(p => p.code === 'MxS' || p.code === 'MXS') && !M.pmos.find(p => p.label === PSM).rows.some(r => r.key === 'ff|2026'), J(M.pmos.map(p => p.code)));
    C.eq('§16.1: CDS, whose only plan event is on a budget the report lacks: Approved $0, its own Obligated', rowsOf(M)[CDS], [['om|2026', 0, 0, D(9000000), 'planEvent']]);
    C.chk('§16.1: a covered row’s Obl %, Unobligated, marks and Authorized source follow its own Approved; an uncovered row is §4.6’s', M.pmos.every(p => p.rows.every(r => r.covered
      ? r.unobligated === r.approved - r.obligated && r.oblPct === (r.approved ? r.obligated / r.approved : null) && r.sect === false && r.authorizedSrc === 'report'
        && r.offObligated === 0 && J(r.marks) === J({ sect: false, dagger: false, ddagger: false })
      : r.basis === 'row' && r.sect === true && r.approved === r.planned && r.authorized === r.approved && r.authorizedSrc === 'approved')));
    C.chk('§16.3: no budget name is spelt in a covered row (§14.4’s “budget” basis is gone)', !M.pmos.some(p => p.rows.some(r => r.basis === 'budget')));
    C.eq('§16.3 model.bae.split: the budgets several PMOs’ plan events use, each PMO’s plan and shares, largest first, a tie in the model’s order', splitOf(M), EXP.split);
    C.eq('§16.3 model.bae.unassigned: per covered block, each budget no plan event takes, and why', M.bae.unassigned, EXP.unassigned);
    C.eq('§16.2 the PMO column of each report row (blank where it does not count; “No plan event uses it” in an (ap, fy) with no block)',
      M.bae.derived.map(d => d.goes), EXP.goes);
    // the identities, from the model's own figures: every report dollar of a covered block on exactly one PMO row or unassigned
    for (const b of M.blocks.filter(x => x.covered)) {
      const rs = M.pmos.flatMap(p => p.rows.filter(r => r.key === b.key)), u = M.bae.unassigned.find(x => x.ap + '|' + x.fy === b.key) || { approved: 0, authorized: 0 };
      const rep = M.bae.derived.filter(d => d.counts && d.ap + '|' + d.fy === b.key);
      C.eq(b.key + ': Σ PMO rows + unassigned = the block’s Approved and the report’s Authorized, to the cent (§16.1)',
        [sum(rs.map(r => r.approved)) + u.approved, sum(rs.map(r => r.authorized)) + u.authorized], [b.approved, sum(rep.map(d => d.authorized))]);
      const byB = new Map();
      for (const d of rep) byB.set(d.key, (byB.get(d.key) || 0) + d.approved);
      const onSplit = M.bae.split.filter(e => e.ap + '|' + e.fy === b.key), onUn = (u.budgets || []);
      C.chk(b.key + ': every counting budget is split, unassigned, or one PMO’s whole, never two of those', [...byB.keys()].every(k =>
        [onSplit.some(e => e.key === k), onUn.some(x => x.key === k)].filter(Boolean).length <= 1));
      C.chk(b.key + ': each split budget’s shares add up to the report’s figure exactly', onSplit.every(e => sum(e.pmos.map(p => p.approved)) === e.approved
        && sum(e.pmos.map(p => p.authorized)) === e.authorized && byB.get(e.key) === e.approved));
    }
    C.eq('§16.1 with USN off: B7 hidden on both sides; AV and PSM keep B1 and B2 only', rowsOf(Mu), EXP_USN.rows);
    C.eq('§16.3 with USN off: the split list takes the switches', splitOf(Mu), EXP_USN.split);
    C.eq('§16.3 with USN off: the unassigned money is all USAF, unchanged', Mu.bae.unassigned, EXP.unassigned);
    C.eq('§16.2 with USN off: the PMO column of B7’s row is blank (it does not count)', Mu.bae.derived.map(d => d.goes), EXP_USN.goes);
    // the tree under each PMO's table is the plan by its PMO column: unchanged by the report (§16: "on the PMO's table only")
    const M0 = SP.buildModel(P.pulls, S0(SP), V0(SP));
    const det = Mx => J(Mx.pmos.map(p => [p.label, p.blocks.map(b => [b.key, b.cols, b.cum, b.tree, b.na, b.unprog])]));
    C.chk('§16: each PMO’s detail (its tree, columns and Not Allocated) is the no-report model’s, byte for byte', det(M) === det(M0));
    C.eq('§16: the PMO rows of the no-report model are §4.6’s (no basis, nothing split)', [M0.pmos.every(p => p.rows.every(r => !('basis' in r))), M0.bae], [true, undefined]);
  });

  // =================================================================================================================
  // SP.splitByPlan
  // =================================================================================================================
  await block('SP.splitByPlan', async () => {
    C.eq('three PMOs, plans 1 : 2 : 4: the cents left go to the largest remainders, the shares add up exactly',
      [SP.splitByPlan(100000000, [1, 2, 4]), SP.splitByPlan(10, [1, 2, 4])], [[14285714, 28571429, 57142857], [1, 3, 6]]);
    C.eq('equal plans: the odd cent to the PMO earlier in the order; a negative amount split as its absolute value, negated',
      [SP.splitByPlan(3, [5, 5]), SP.splitByPlan(-3, [5, 5]), SP.splitByPlan(1, [1, 1, 1])], [[2, 1], [-2, -1], [1, 0, 0]]);
    C.eq('no weight above zero: null (the budget is unassigned); a weight at or below zero takes nothing',
      [SP.splitByPlan(10, [0, 0]), SP.splitByPlan(10, [-5, 0]), SP.splitByPlan(10, [0, 3]), SP.splitByPlan(0, [1, 2])], [null, null, [0, 10], [0, 0]]);
    // past 2^53: a $5B budget against $5B of plan. Each share is floor or floor + 1 of the exact quotient, and the sum exact
    const A = 499999999999, W = [123456789012, 376543210987, 7];
    const got = SP.splitByPlan(A, W), tot = W.reduce((a, w) => a + BigInt(w), 0n);
    const fl = W.map(w => BigInt(A) * BigInt(w) / tot);
    C.chk('exact past 2^53: each share floor or floor + 1, the sum the amount', !!got && got.reduce((a, x) => a + BigInt(x), 0n) === BigInt(A)
      && got.every((g, i) => BigInt(g) - fl[i] === 0n || BigInt(g) - fl[i] === 1n), J(got));
    C.eq('SP.planPct: one decimal, half up, in whole numbers', [SP.planPct(1, 7), SP.planPct(1, 8), SP.planPct(1249, 10000), SP.planPct(1, 1)],
      ['14.3%', '12.5%', '12.5%', '100.0%']);
  });

  // =================================================================================================================
  // §16.2 THE WORDS, from SP (the screen and the workbook print these)
  // =================================================================================================================
  await block('the words', async () => {
    C.eq('§16.2 under each PMO tab’s table (SP.pmoTabLines): what its figures count, the money no plan event uses on its covered blocks in the tab’s order, '
      + 'then §8.6’s note narrowed', Object.fromEntries(M.pmos.map(p => [p.label, SP.pmoTabLines(p, M)])), Object.fromEntries(Object.entries(EXP.rows).map(([l, rs]) => [l, tabLines(rs)])));
    C.chk('§16.2: no tab says §14.4’s words on budget names', M.pmos.every(p => !SP.pmoTabLines(p, M).some(l => /end(s)? in (this|any) PMO’s code/.test(l))));
    C.eq('§16.2 the Summary’s note on report money no plan event uses', M.summary.notes.filter(n => n.startsWith('The PMO tabs share')), [SUMMARY_NOTE]);
    const L = SP.pmoSplitLists(M);
    C.eq('§16.2 the Import report’s list of budgets split among PMOs, in its words', [L.split.head, L.split.items.map(i => [i.bk, i.key, i.text])],
      [SPLIT_HEAD, EXP.split.map(e => [e[0] + '|' + e[1], normKey(e[2]), splitText(e)])]);
    C.eq('§16.2 the Import report’s list of report money no plan event uses, each with why', [L.unassigned.head, L.unassigned.items.map(i => [i.bk, i.key, i.why, i.text])],
      [UN_HEAD, EXP.unassigned.flatMap(u => u.budgets.map(x => [u.ap + '|' + u.fy, x.key, x.why, unText(u, x)]))]);
    // the sheet's lines (SP.baeModelLines): each list's heading with its count, then each item, indented
    const lines = SP.baeModelLines(M);
    const at = h => lines.indexOf(h);
    const sIt = EXP.split.map(e => '    ' + splitText(e)), uIt = EXP.unassigned.flatMap(u => u.budgets.map(x => '    ' + unText(u, x)));
    C.eq('§16.2 the Import Report sheet’s lines: the split list', at('  ' + SPLIT_HEAD + ': 4.') < 0 ? null : lines.slice(at('  ' + SPLIT_HEAD + ': 4.') + 1, at('  ' + SPLIT_HEAD + ': 4.') + 5), sIt);
    C.eq('§16.2 the Import Report sheet’s lines: the unassigned list', at('  ' + UN_HEAD + ': 3.') < 0 ? null : lines.slice(at('  ' + UN_HEAD + ': 3.') + 1, at('  ' + UN_HEAD + ': 3.') + 4), uIt);
    // under a switch, each list says it counts with the switches as they are
    const lu = SP.baeModelLines(Mu);
    const sw = l => new RegExp('^ {2}' + l.replace(/[()]/g, '\\$&') + ', with the switches as they are \\(.+\\): \\d+\\.$');
    C.chk('§16.2 with USN off: both lists say they count with the switches as they are', lu.some(l => sw(SPLIT_HEAD).test(l) && l.endsWith(': 3.')) && lu.some(l => sw(UN_HEAD).test(l) && l.endsWith(': 3.')),
      lu.filter(l => l.includes(SPLIT_HEAD) || l.includes(UN_HEAD)).join(' / '));
  });

  // =================================================================================================================
  // THE WORKBOOK, read back with openpyxl
  // =================================================================================================================
  for (const [w, Mx, X] of [['every switch on', M, EXP], ['USN off', Mu, Object.assign({}, EXP, EXP_USN)]]) {
    await block('the workbook, ' + w, async () => {
      const f = join(tmp.dir, 'pmo16-' + (Mx === M ? 'all' : 'usn') + '.xlsx');
      writeFileSync(f, await SP.excelBytes(Mx, P.pulls, S0(SP), { report: P.report, today: TODAY, bae: withBae(P) }));
      const B = readBook(f);
      // the BAE Report sheet: its PMO column, the last but one, header "PMO"; one row per report row, in file order
      const BR = sheetRows(B, 'BAE Report');
      if (C.chk(w + ': the BAE Report sheet', !!BR)) {
        const pi = BR[0].length - 2;
        C.eq(w + ': its PMO column’s header stays “PMO” (§16.2), Counted after it', [BR[0][pi], BR[0][pi + 1]], ['PMO', 'Counted']);
        C.eq(w + ': its PMO column says where each counting row’s money goes, blank where it does not count (§16.2)',
          BR.slice(1, 1 + BAE.length).map(r => r[pi] ?? ''), X.goes);
        C.eq(w + ': … the rows are the report’s, in file order', BR.slice(1, 1 + BAE.length).map(r => r[0]), BAE.map(r => r[0]));
      }
      // the Import Report sheet: the two lists, each heading with its count, each item indented
      const IR = col0(sheetRows(B, 'Import Report') || []);
      const swW = Mx === M ? '' : ', with the switches as they are (';
      const hi = h => IR.findIndex(l => l.startsWith('  ' + h + swW));
      const sI = hi(SPLIT_HEAD), uI = hi(UN_HEAD);
      C.chk(w + ': the Import Report sheet’s two §16.2 headings, each with its count', sI >= 0 && uI >= 0 && IR[sI].endsWith(': ' + X.split.length + '.')
        && IR[uI].endsWith(': 3.'), J([IR[sI], IR[uI]]));
      C.eq(w + ': … the budgets split among PMOs, each PMO’s plan and shares', IR.slice(sI + 1, sI + 1 + X.split.length), X.split.map(e => '    ' + splitText(e)));
      C.eq(w + ': … the money no plan event uses, and why', IR.slice(uI + 1, uI + 4), EXP.unassigned.flatMap(u => u.budgets.map(x => '    ' + unText(u, x))));
      // the Summary's notes
      const SU = sheetRows(B, 'Summary');
      const ni = SU.findIndex(r => r[0] === 'Notes:');
      C.eq(w + ': the Summary’s note on report money no plan event uses', SU.slice(ni + 1).map(r => r[0]).filter(n => typeof n === 'string' && n.startsWith('The PMO tabs share')),
        [SUMMARY_NOTE]);
      // each PMO sheet: its table (the PMO's rows, $M) and the lines under it
      for (const [label, rs] of Object.entries(X.rows)) {
        const code = /\(([^)]*)\)\s*$/.exec(label)[1], R = sheetRows(B, 'PMO ' + code);
        if (!C.chk(w + ' PMO ' + code + ': its sheet', !!R)) continue;
        const bad = [];
        rs.forEach(([k, a, u, o], j) => {
          const r = R[3 + j] || [];
          // the appropriation's name on the first of its rows (merged down them, as every table of blocks prints it)
          const first = j === 0 || rs[j - 1][0].split('|')[0] !== k.split('|')[0];
          const want = [first ? AP[k.split('|')[0]] : undefined, Number(k.split('|')[1]), a / 1e8, u / 1e8, o / 1e8, (a - o) / 1e8];
          if (r[0] !== want[0] || r[1] !== want[1] || [2, 3, 4, 5].some(c => typeof r[c] !== 'number' || Math.abs(r[c] - want[c]) > 1e-9)) bad.push(k + ' ' + J(r.slice(0, 6)) + ' want ' + J(want));
          const op = a ? o / a : null;
          if (op === null ? r[6] != null && r[6] !== '' : typeof r[6] !== 'number' || Math.abs(r[6] - op) > 1e-12) bad.push(k + ' Obl % ' + r[6]);
        });
        C.chk(w + ' PMO ' + code + ': each row, in the tab’s order: Approved, Authorized, Obligated, Unobligated and Obl %, as worked out by hand', !bad.length, bad.join('; '));
        const L = col0(R), want = tabLines(rs), i0 = L.indexOf(PE_LINE);
        C.eq(w + ' PMO ' + code + ': the lines under its table (§16.2)', i0 < 0 ? null : L.slice(i0, i0 + want.length), want);
        C.eq(w + ' PMO ' + code + ': the money no plan event uses is said once', L.filter(l => l.endsWith(UN_TAIL)).length, want.filter(l => l.endsWith(UN_TAIL)).length);
      }
      C.eq(w + ': no other PMO sheet (none for a code a budget’s name ends in)', B.sheets.map(s => s.name).filter(n => n.startsWith('PMO ')).sort(),
        Object.keys(X.rows).map(l => 'PMO ' + /\(([^)]*)\)\s*$/.exec(l)[1]).sort());
    });
  }

  // =================================================================================================================
  // THE SCREENS: the page in jsdom, with what a person uses
  // =================================================================================================================
  await block('the screens', async () => {
    // a plan made by the tool's own import and store, the state a saved file holds, opened in a page
    const tx = loadTool(), SPx = tx.SP;
    SPx.applyImport(await SPx.parseFiles(files(true), { now: NOW }));
    SPx.setSettings({ asOf: '2026-10', firstFY: 2025 });
    const state = JSON.parse(J(SPx.state));
    tx.close();
    const T = await boot(pageHtml({ state }));
    for (const [w, X] of [['every switch on', EXP], ['USN off', Object.assign({}, EXP, EXP_USN)]]) {
      if (X !== EXP) {
        const lab = [...T.doc.querySelectorAll('#uiFilters label')].find(l => flat(l.textContent) === USN);
        if (!C.chk('the USN switch is on the page', !!lab)) break;
        const box = lab.querySelector('input'); box.checked = false; box.dispatchEvent(new T.W.Event('change', { bubbles: true }));
        await settle();
      }
      let m = await T.view('summary');
      C.eq(w + ': the Summary’s note on report money no plan event uses', [...m.querySelectorAll('ul.notes li')].map(e => flat(e.textContent))
        .filter(n => n.startsWith('The PMO tabs share')), [SUMMARY_NOTE]);
      m = await T.view('pmos');
      const sel = () => T.main().querySelector('select[data-act=pmo]');
      C.eq(w + ': a PMO tab for each PMO whose plan events are in a block, and no other', [...sel().options].map(o => o.textContent).sort(), Object.keys(X.rows).sort());
      for (const [label, rs] of Object.entries(X.rows)) {
        const o = [...sel().options].find(x => x.textContent === label);
        if (!o) continue;
        T.change(sel(), o.value);
        await settle();
        m = T.main();
        const got = [...m.querySelectorAll('table.top tr[data-bk]')].map(tr => {
          const c = [...tr.querySelectorAll('td[data-c]')].slice(0, 4);
          return [tr.getAttribute('data-bk')].concat(c.map(x => Number(x.getAttribute('data-c'))), [c[0] && !!c[0].querySelector('.sect')]);
        });
        const tot = ['total', sum(rs.map(r => r[1])), sum(rs.map(r => r[2])), sum(rs.map(r => r[3])), sum(rs.map(r => r[1] - r[3])), rs.some(r => r[4] === 'row')];
        C.eq(w + ' PMO ' + label + ': its table, row by row in the tab’s order (Approved, Authorized, Obligated, Unobligated, § where uncovered), then its total', got,
          rs.map(([k, a, u, ob, basis]) => [k, a, u, ob, a - ob, basis === 'row']).concat([tot]));
        C.eq(w + ' PMO ' + label + ': the lines under its table (§16.2)', [...m.querySelectorAll('p.note.pmo-note')].map(e => flat(e.textContent)), tabLines(rs));
      }
      m = await T.view('report');
      const R = m.querySelector('section.baeread');
      if (!C.chk(w + ': the Import report’s BAE section', !!R)) continue;
      const items = cls => [...R.querySelectorAll('ul.' + cls + ' li')].map(e => [e.getAttribute('data-bk'), e.getAttribute('data-key'), e.getAttribute('data-why'), flat(e.textContent)]);
      C.eq(w + ': the budgets split among PMOs by their plan events, each PMO’s plan and shares (§16.2)', items('pmosplit'),
        X.split.map(e => [e[0] + '|' + e[1], normKey(e[2]), null, splitText(e)]));
      C.eq(w + ': the report money no plan event uses, each budget and why (§16.2)', items('unassigned'),
        EXP.unassigned.flatMap(u => u.budgets.map(x => [u.ap + '|' + u.fy, x.key, x.why, unText(u, x)])));
      for (const [h, n] of [[SPLIT_HEAD, X.split.length], [UN_HEAD, 3]]) {
        const e = [...R.querySelectorAll('h4.sub')].find(x => flat(x.textContent).startsWith(h + ':'));
        C.chk(w + ': “' + h + '” under a heading that counts it', !!e && e.getAttribute('data-n') === String(n) && flat(e.textContent) === h + ': ' + n, e && e.outerHTML);
        C.eq(w + ': … with a note under it that it counts with the switches as they are, only when they hide something', !!e && !!e.nextElementSibling
          && e.nextElementSibling.matches('p.note') && /^Counted with the switches as they are/.test(flat(e.nextElementSibling.textContent)), X !== EXP);
      }
    }
    C.eq('no script error on the page', T.errors(), []);
    T.t.close();
  });

  // =================================================================================================================
  // WHAT §16 LEAVES ALONE: the code before it, read from git, on the same imports
  // =================================================================================================================
  // with a report, against the code before §16 on the same import: §16 moves a covered block's PMO rows (and the words,
  // lists and column that say so) and nothing else. An uncovered block and its PMO rows, every block's own figures, the
  // totals, every PMO's detail, model.bae but for §16's fields, and every sheet §16 does not touch, byte for byte.
  // §17 (built after §16) says FY2025 O&M OBBBA funding where §15 said FY2025 OBBBA funding (§17.3), states the O&M-only rule in
  // Settings, records how a budget and a report row are marked (§17.2: excluded.obbba.budgets[].by, derived[].obbbaBy), and
  // adds model.obbbaElsewhere: the hand-built report's one OBBBA row is O&M (BOB), so no figure moves. Those words and fields
  // are taken back to §15's on this side only, and the rest must still be the code before §16's. obbba.test.mjs and
  // obbba-om.test.mjs hold §17's own.
  const RULE17 = 'FY2025 O&M OBBBA funding is left out of every figure: it is not a reporting year. OBBBA funding of every other appropriation counts '
    + 'like any other money (Brad, 11 Nov 2026).';
  const RULE15 = 'FY2025 OBBBA funding is left out of every figure: it is not a reporting year (Brad, 11 Nov 2026).';
  const as15 = s => s.split(RULE17).join(RULE15).replace(/FY2025 O&M OBBBA/g, 'FY2025 OBBBA');
  const ex15 = e => { const x = JSON.parse(J(e)); if (x.obbba) for (const b of x.obbba.budgets) delete b.by; return J(x); };
  function asBefore(w, SPb, Pn, Pb, sn, sb, vn, vb, reach = true) {
    const Mr = SP.buildModel(Pn.pulls, sn, vn, withBae(Pn)), Mrb = SPb.buildModel(Pb.pulls, sb, vb, withBae(Pb));
    for (const f of ['blocks', 'aps', 'naAll', 'shown', 'execAfterAsOf'])
      C.chk(w + ': model.' + f + ' is the one before §16, byte for byte', J(Mr[f]) === J(Mrb[f]));
    C.chk(w + ': model.excluded is the one before §16, byte for byte (§17.2’s by set aside)', ex15(Mr.excluded) === J(Mrb.excluded));
    C.chk(w + ': the Summary’s TOTAL is the one before §16', J(Mr.summary.total) === J(Mrb.summary.total));
    C.eq(w + ': the Summary’s notes are the ones before §16 (§17.3’s words aside), and the one on money no plan event uses',
      Mr.summary.notes.filter(n => !n.startsWith('The PMO tabs share')).map(as15), Mrb.summary.notes);
    const unc = Mx => J(Mx.pmos.map(p => [p.label, p.rows.filter(r => !r.covered)]).filter(x => x[1].length));
    C.chk(w + ': every PMO row of a block the report does not cover is the one before §16', unc(Mr) === unc(Mrb) && (!reach || unc(Mr) !== '[]'), unc(Mr).slice(0, 200));
    const det = Mx => J(Object.fromEntries(Mx.pmos.map(p => [p.label, Object.fromEntries(p.blocks.filter(b => b.tree.length).map(b => [b.key,
      [b.cols, b.cum, b.obl, b.goalC, b.statusC, b.tree, b.na, b.unprog, b.execAfterAsOf, b.planned, b.slide]]))]).filter(([, v]) => Object.keys(v).length)));
    C.chk(w + ': every PMO’s detail under its table (its rows by the PMO column) is the one before §16', det(Mr) === det(Mrb));
    const baeRest = Mx => { const x = JSON.parse(J(Mx.bae)); delete x.split; delete x.unassigned; for (const d of x.derived || []) { delete d.goes; delete d.obbbaBy; } return J(x); };
    C.chk(w + ': model.bae is the one before §16, but for its split, unassigned and PMO column (and §17’s words and obbbaBy)', as15(baeRest(Mr)) === baeRest(Mrb));
    const sh = (S, Mx, Px, st) => S.excelSpec(Mx, Px.pulls, st, { report: Px.report, today: TODAY, bae: withBae(Px) }).sheets;
    const a = sh(SP, Mr, Pn, sn), b = sh(SPb, Mrb, Pb, sb);
    const pmoTab = n => /^PMO /.test(n), keep = n => !/^(PMO |Summary$|BAE Report$|Import Report$)/.test(n);
    C.eq(w + ': the same sheets, in the same order, the PMO tabs (§16’s to decide) aside', a.map(x => x.name).filter(n => !pmoTab(n)), b.map(x => x.name).filter(n => !pmoTab(n)));
    const moved = a.filter(x => keep(x.name)).filter(x => as15(J(x)) !== J(b.find(y => y.name === x.name))).map(x => x.name);
    C.chk(w + ': every sheet but the Summary, the PMO tabs, the BAE Report and the Import Report is the one before §16, cell for cell',
      moved.length === 0 && a.some(x => keep(x.name) && /^(O&M|Full Fund)$/.test(x.name)), J(moved));
    return { a, b };
  }
  await block('as before §16', async () => {
    const assembleB = await assembleBefore();
    if (!C.chk('the code before §16 is in this clone (commit ' + BEFORE + '); if this fails, run git fetch --unshallow', !!assembleB)) return;
    const tb = loadTool({ html: assembleB({}) });
    const SPb = tb.SP;
    C.eq('the code before §16 boots with no script errors', tb.errors, []);
    for (const [w, off] of [['every switch on', []], ['USN off', [USN]]]) {
      // with no report: the model and the workbook are the code before §16's, byte for byte
      const Pn = await SP.parseFiles(files(false), { now: NOW }), Pb = await SPb.parseFiles(files(false), { now: NOW });
      const Mn = SP.buildModel(Pn.pulls, S0(SP), V0(SP, off)), Mb = SPb.buildModel(Pb.pulls, S0(SPb), V0(SPb, off));
      C.chk('no report, ' + w + ': the model is the one before §16, byte for byte', J(Mn) === J(Mb));
      const sn = J(SP.excelSpec(Mn, Pn.pulls, S0(SP), { report: Pn.report, today: TODAY })), sb = J(SPb.excelSpec(Mb, Pb.pulls, S0(SPb), { report: Pb.report, today: TODAY })).replace('"creator":"SFCB Spend Plan"', '"creator":"SCOPE"');   // the creator is the tool's name, SCOPE since §18
      let at = 0; while (at < sn.length && sn[at] === sb[at]) at++;
      C.chk('no report, ' + w + ': the workbook is the one before §16, cell for cell', sn === sb, 'first difference at ' + at + ': before …' + sb.slice(Math.max(0, at - 100), at + 80)
        + '… now …' + sn.slice(Math.max(0, at - 100), at + 80));
      // with the report: §16 moves a covered block's PMO rows and nothing else
      const Pr = await SPb.parseFiles(files(true), { now: NOW });
      const r = asBefore('the hand-built report, ' + w, SPb, P, Pr, S0(SP), S0(SPb), V0(SP, off), V0(SPb, off));
      // the PMO tabs are §16's to decide: before it, B6's executed row gave MxS a tab by its budget's name (rule 7)
      C.chk('with the hand-built report, ' + w + ': before §16 a budget’s name gave MxS a tab, which its plan events never could', r.b.some(x => x.name === 'PMO MxS')
        && !r.a.some(x => x.name === 'PMO MxS'));
    }
    // the synthetic fixture's pull and report (make_fixture.py): §14.8's scenarios bae-all, bae-usaf-off, bae-mand-only, bae-entered
    const FX = join(tmp.dir, 'fx');
    mkdirSync(FX);
    const mk = py([join(HERE, 'fixture', 'make_fixture.py'), '--out', FX]);
    if (!C.chk('the synthetic fixture is written', mk.status === 0, (mk.stderr || '').slice(-400))) { tb.close(); return; }
    const fx = () => ['pull-all.xlsx', 'bae.xlsx'].map(n => { const b = readFileSync(join(FX, n)); return { name: n, data: b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) }; });
    const Fn = await SP.parseFiles(fx(), { now: NOW }), Fb = await SPb.parseFiles(fx(), { now: NOW });
    for (const [w, off, lanes, auth] of [['bae-all', []], ['bae-usaf-off', ['USAF']], ['bae-mand-only', [], ['mand']],
      ['bae-entered', [], null, { 'om|2026': 39876543210, 'sp|2025': 8000000000 }]]) {
      const st = S => { const s = S0(S); if (auth) s.authorized = Object.assign({}, auth); return s; };
      const vw = S => { const v = V0(S, off); for (const l of ['disc', 'mand']) if (lanes && !lanes.includes(l)) v.lane[l] = false; return v; };
      // (with mandatory alone no uncovered block holds a PMO row, so there is none to compare there)
      asBefore('the fixture, ' + w, SPb, Fn, Fb, st(SP), st(SPb), vw(SP), vw(SPb), w !== 'bae-mand-only');
    }
    tb.close();
  });
} catch (e) {
  C.chk('the test ran to the end', false, (e && e.stack) || String(e));
} finally {
  t.close();
  tmp.rm();
  C.done();
}
