// The fifth review of FY2025 OBBBA funding (CONTRACT §15) and of PMO tabs built from plan events (§16): the words that
// did not say what the figures do. Every pull and report below is written here, by hand, as CSV, and every name and
// figure in them is invented. Each expectation is worked out from the rows this file writes, never read back from the
// tool's own figures.
//
// What it holds the tool to (each was confirmed by a skeptic before it was fixed):
//   M5-2, P5-4  under a First FY after 2025, the Import report's line on the sustainment budgets counts, as "of them, N
//               rows before FY…", only sustainment rows: a FY2025 OBBBA row is on its own line, and only there;
//   M5-4        an appropriation whose only rows from First FY on are FY2025 OBBBA funding says so on its view, where it
//               said the pull held no such rows;
//   P5-5        What changed, whose figures include FY2025 OBBBA rows, says so when the pulls it compares hold any;
//   P5-6        the import message's account of "counted", and the Import report's sentence on the readable rows' money,
//               name FY2025 OBBBA funding beside what else they leave out (view, sheet, and a report kept from before);
//   P5-8        Help says what Settings says (the rule), not that it says how much is left out;
//   P5-2        the Summary's note on report money no plan event uses names its Authorized as well as its Approved, so
//               the PMO tabs do add up to the Summary less it, and names a typed Authorized, which no PMO tab shares;
//   P5-9        one row "carries" a Budget name that names no appropriation; several "carry".
//
//   node spend-plan/test/obbba-pmo-review5.test.mjs
// The test runs in a zone that is not UTC, as the other workbook tests do (review XP-9). Set before any date is made.
process.env.TZ = 'America/New_York';
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTool, pageHtml, checks, scratchDir } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const READ = join(HERE, 'export-read.py');
const C = checks('obbba-pmo-review5');
const tmp = scratchDir('sfcbsp-review5-');
const J = x => JSON.stringify(x);
const settle = (ms = 20) => new Promise(res => setTimeout(res, ms));
const NOW = '2026-11-09T12:00:00.000Z', NOW2 = '2026-11-16T12:00:00.000Z';

// ------------------------------------------------------------------------------------------------ restated
const pad2 = n => String(n).padStart(2, '0');
const commas = d => d.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
// §2: $M in a sentence (zero 0.00), restated
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
const D = d => Math.round(d * 100);            // dollars -> cents
const flat = s => String(s ?? '').replace(/\s+/g, ' ').trim();
const sum = l => l.reduce((a, b) => a + b, 0);

const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const BAE_H = ['Budget Name', 'Budget FY Numeric', 'Budget Approved Amount', 'Budget Authorized Amount'];
const baeCsv = rows => [BAE_H.join(',')].concat(rows.map(r => r.map(q).join(','))).join('\n');
const EX = 'Actual Execution is allocated', NA = 'Not Allocated';
const AV = 'Air Vehicle (AV)', PSM = 'Product Support Management (PSM)';
const row = (FY, ccar, Title, Budget, pe, Date, Amount, Alloc, PMO) => ({ FY, 'CCaR No': ccar, Title, Budget, 'Plan Event': pe, Date, Amount, Alloc, PMO });

// ------------------------------------------------------------------------------------------------ the pulls and report
const B_OM = 'USAF O&M- Invented Review Line Discretionary AV';
const B_OMO = 'USAF O&M- Invented Review OBBBA Line Discretionary AV';
const B_X = 'USAF O&M- Invented Review Spare Line Discretionary PSM';     // no plan event uses it: on no PMO tab (§16.1)
const B_FF = 'USAF APN Full Fund Invented Review Discretionary AV';
const B_FLY = 'USAF APN Full Fund Invented Review Flyaway';
const B_NOAP = 'Invented Review Staff Office';
const OM = [
  row(2024, 'QR0001', 'Invented Title P', B_OM, 'Ev P', '2024-03-10', '250000', EX, AV),        // before First FY 2025
  row(2025, 'QR0002', 'Invented Title A', B_OM, 'Ev A', '2024-12-10', '1000000', EX, AV),
  row(2025, 'QR0003', 'Invented Title B', B_OMO, 'Ev B', '2025-01-10', '400000', EX, AV),       // FY2025 OBBBA funding
  row(2026, 'QR0004', 'Invented Title C', B_OM, 'Ev C', '2025-11-10', '3000000', EX, AV),
  row(2026, 'QR0005', 'Invented Title D', B_OM, 'Ev D', '2026-02-10', '1000000', NA, PSM),
];
const FF = [row(2025, 'QR0006', 'Invented Title E', B_FF, 'Ev E', '2025-01-10', '2000000', EX, AV)];
// [name, FY, Approved $, Authorized $, scope (§14.2, restated), in a scope 'in' row: whether FY < 2025 / FY < 2026]
const BAE = [
  [B_OM, 2024, 500000, 500000],          // 1 in, before FY2025
  [B_OM, 2025, 2000000, 1800000],        // 2 in, covers O&M FY2025 (its only counted pull row is AV's)
  [B_OMO, 2025, 900000, 800000],         // 3 FY2025 OBBBA
  [B_OMO, 2025, 100000, 100000],         // 4 FY2025 OBBBA
  [B_OM, 2026, 8000000, 6000000],        // 5 in, covers O&M FY2026: AV's plan $3.00M, PSM's $1.00M, so 3 : 1
  [B_X, 2026, 2000000, 500000],          // 6 in, O&M FY2026, no plan event uses it: less Authorized than Approved
  [B_FF, 2025, 2500000, 2500000],        // 7 in, covers Full Fund FY2025
  [B_FLY, 2026, 7000000, 7000000],       // 8 Flyaway
  [B_NOAP, 2026, 300000, 300000],        // 9 names no appropriation
];
const SCOPE = ['in', 'in', 'obbba', 'obbba', 'in', 'in', 'in', 'flyaway', 'noap'];   // restated from §14.2 and §15.3, row by row
const OB_ROWS = SCOPE.filter(s => s === 'obbba').length;
const files = (om, ff, bae, extra) => [['om.csv', om && csv(om)], ['ff.csv', ff && csv(ff)], ['bae.csv', bae && baeCsv(bae)]].concat(extra || [])
  .filter(([, d]) => d).map(([name, data]) => ({ name, data }));
C.chk('the fixture: report rows 3 and 4 are its FY2025 OBBBA rows, and the scopes restated cover every row', BAE.length === SCOPE.length
  && J(BAE.map((r, i) => (r[1] === 2025 && /\bOBBBA\b/i.test(r[0]) ? i : -1)).filter(i => i >= 0)) === J([2, 3]));

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
async function boot(html) {
  const t = loadTool({ html });
  t.window.confirm = () => true;
  const W = t.window, doc = W.document;
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  const T = {
    t, W, doc, SP: t.SP,
    main: () => doc.getElementById('uiMain'),
    click(el) { el.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); },
    async view(v) { T.click(doc.querySelector('[data-act=view][data-v="' + v + '"]')); await settle(); return T.main(); },
    async help() { T.click(doc.querySelector('#uiHelp')); await settle(); return T.main(); },
    errors: () => t.errors.filter(e => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click)/.test(String(e))),
  };
  return T;
}
// a plan made by the tool's own import and store: each import [files, now], then the settings; the state a saved file holds
async function planOf(imports, settings, between) {
  const tp = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine', 'store'] });
  tp.window.confirm = () => true;
  const msgs = [];
  try {
    for (let i = 0; i < imports.length; i++) {
      const [fs, now] = imports[i];
      msgs.push(tp.SP.applyImport(await tp.SP.parseFiles(fs, { now })).message);
      if (between && between[i]) tp.SP.setSettings(between[i]);
    }
    if (settings) tp.SP.setSettings(settings);
    return { state: JSON.parse(J(tp.SP.state)), msgs };
  } finally { tp.close(); }
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
const S0 = (SPx, first, extra) => { const s = SPx.defaultSettings('2026-11-09'); s.asOf = '2026-10'; if (first) s.firstFY = first; return Object.assign(s, extra || {}); };

const t = loadTool();
const SP = t.SP;
try {
  C.eq('the page boots with no script errors', t.errors, []);

  // =================================================================================================================
  // M5-2, P5-4: "of them, N rows before FY…" counts the sustainment rows alone; a FY2025 OBBBA row is said once
  // =================================================================================================================
  await block('rows by scope', async () => {
    const IN = SCOPE.map((s, i) => i).filter(i => SCOPE[i] === 'in');
    for (const first of [2025, 2026]) {
      const before = IN.filter(i => BAE[i][1] < first).length;     // rows 1 (FY2025), rows 1, 2 and 7 (FY2026)
      const { state } = await planOf([[files(OM, FF, BAE), NOW]], { asOf: '2026-10', firstFY: first });
      const T = await boot(pageHtml({ state }));
      const m = await T.view('report');
      const li = k => flat((m.querySelector('ul.baerows li[data-scope="' + k + '"]') || {}).textContent);
      const inLi = li('in');
      C.chk('First FY ' + first + ': the sustainment line counts its ' + IN.length + ' rows', inLi.startsWith('Sustainment budgets: ' + IN.length + ' rows (3 budgets)'), inLi);
      C.chk('First FY ' + first + ': “of them” counts the ' + before + ' sustainment ' + (before === 1 ? 'row' : 'rows') + ' before FY' + first + ' alone, not the '
        + OB_ROWS + ' FY2025 OBBBA rows (review M5-2, P5-4)',
      inLi.includes('; of them, ' + before + (before === 1 ? ' row' : ' rows') + ' before FY' + first + (before === 1 ? ' counts' : ' count') + ' nowhere'), inLi);
      C.chk('First FY ' + first + ': the FY2025 OBBBA rows are on their own line, ' + OB_ROWS + ' of them',
        li('obbba') === 'FY2025 O&M OBBBA funding (not a reporting year), counted nowhere: ' + OB_ROWS + ' rows.', li('obbba'));    // §17.3's words
      // each row said once: the rows the lines count add up to the rows the report holds
      const n = k => { const x = /: (\d+) rows?/.exec(li(k)); return x ? Number(x[1]) : NaN; };
      C.eq('First FY ' + first + ': the lines by scope count every row once', n('in') + n('flyaway') + n('noap') + n('obbba') + n('bad'), BAE.length);
      C.eq('First FY ' + first + ': no script error', T.errors(), []);
      T.t.close();
    }
  });

  // =================================================================================================================
  // P5-6: the import message's "counted (…)", and the Import report's sentence on the readable rows' money
  // =================================================================================================================
  await block('the import’s words', async () => {
    const readable = sum(BAE.map(r => D(r[2]))), readU = sum(BAE.map(r => D(r[3])));
    const out = k => sum(BAE.filter((r, i) => SCOPE[i] === k).map(r => D(r[2])));
    const inC = out('in');
    C.chk('the fixture: the readable rows’ Approved less Flyaway, FY2025 OBBBA and naming no appropriation is the sustainment budgets’', readable - out('flyaway') - out('obbba') - out('noap') === inC);
    // §17.3: the words say FY2025 O&M OBBBA funding (every OBBBA row here is O&M)
    const LINE = '  The readable rows hold Approved ' + usd(readable) + ' and Authorized ' + usd(readU) + ': every budget in the report, before Flyaway, FY2025 O&M OBBBA '
      + 'funding and the budgets that name no appropriation are left out.';
    // the message, at First FY 2025: 4 rows count (2, 5, 6, 7); row 1 is before FY2025; rows 3 and 4 are FY2025 OBBBA
    const { state, msgs } = await planOf([[files(OM, FF, BAE), NOW]], { asOf: '2026-10' });
    C.chk('the import message: “counted” names the rule beside the First FY (review P5-6)', msgs[0].includes('Imported the BAE report “bae.csv” › “bae”, which has no date in its '
      + 'file name: 9 rows, 4 of them counted (sustainment budgets of FY2025 or later, FY2025 O&M OBBBA funding left out); not counted: 1 Flyaway (production), 1 that names '
      + 'no appropriation, 1 before FY2025 and 2 FY2025 O&M OBBBA.'), msgs[0]);
    // control: a report with no FY2025 OBBBA row says what it said before §15
    const BAE0 = BAE.filter((r, i) => SCOPE[i] !== 'obbba');
    const p0 = await planOf([[files(OM, FF, BAE0), NOW]], { asOf: '2026-10' });
    C.chk('control: with no FY2025 OBBBA row, “counted” is as it was', p0.msgs[0].includes(': 7 rows, 4 of them counted (sustainment budgets of FY2025 or later); not counted: '
      + '1 Flyaway (production), 1 that names no appropriation and 1 before FY2025.'), p0.msgs[0]);
    // control: under First FY 2026 they are before the First FY, so the rule takes none and is not named
    const p6 = await planOf([[files(OM, FF), NOW], [files(null, null, BAE), NOW2]], null, [{ asOf: '2026-10', firstFY: 2026 }]);
    C.chk('control: under First FY 2026 the FY2025 OBBBA rows are before the First FY, and the rule is not named', p6.msgs[1].includes(': 9 rows, 2 of them counted '
      + '(sustainment budgets of FY2026 or later); not counted: 1 Flyaway (production), 1 that names no appropriation and 5 before FY2026.'), p6.msgs[1]);
    // the Import report's file part, on the view and in the workbook
    const T = await boot(pageHtml({ state }));
    const m = await T.view('report');
    const txt = flat(m.textContent);
    C.chk('the Import report (view): the readable rows’ money names FY2025 OBBBA funding among what is left out (review P5-6)', txt.includes(flat(LINE)), txt.slice(0, 600));
    const book = await exportBook(T, 'review5');
    const ir = (sheetRows(book, 'Import Report') || []).map(r => String(r[0] ?? ''));
    C.chk('the Import Report sheet: the same sentence', ir.includes(LINE), J(ir.filter(l => /readable rows hold/.test(l))));
    T.t.close();
    // a report kept from an earlier import, listed from the stored report (SP.baeKeptLines)
    const pk = await planOf([[files(OM, FF, BAE), NOW], [files(OM.map(r => Object.assign({}, r, { Amount: r['CCaR No'] === 'QR0004' ? '3100000' : r.Amount })), FF), NOW2]],
      { asOf: '2026-10' });
    const Tk = await boot(pageHtml({ state: pk.state }));
    const mk = await Tk.view('report');
    const kept = flat(mk.textContent);
    C.chk('the Import report: a report kept from an earlier import names FY2025 OBBBA funding too', kept.includes('The BAE report on screen, from an earlier import')
      && kept.includes(flat(LINE)), kept.slice(0, 600));
    Tk.t.close();
    // control: a report with none says the sentence it said before §15
    const T0 = await boot(pageHtml({ state: p0.state }));
    const m0 = flat((await T0.view('report')).textContent);
    C.chk('control: a report with no FY2025 OBBBA row: the sentence as it was', m0.includes(flat('  The readable rows hold Approved ' + usd(sum(BAE0.map(r => D(r[2]))))
      + ' and Authorized ' + usd(sum(BAE0.map(r => D(r[3])))) + ': every budget in the report, before Flyaway and the budgets that name no appropriation are left out.')), m0.slice(0, 600));
    T0.t.close();
  });

  // =================================================================================================================
  // M5-4: an appropriation whose only rows from First FY on are FY2025 OBBBA funding says so
  // =================================================================================================================
  await block('an appropriation with no block', async () => {
    const OM2 = OM.filter(r => r['CCaR No'] === 'QR0001' || r['CCaR No'] === 'QR0003');    // FY2024, and FY2025 OBBBA
    const OM3 = OM.filter(r => r['CCaR No'] === 'QR0001');                                 // FY2024 alone
    const cases = [
      [OM2, 2025, 'No O&M block is shown: the current pull’s only O&M rows from FY2025 on are FY2025 O&M OBBBA funding, which is left out: it is not a reporting year.', true],
      [OM2, 2026, 'No O&M rows from FY2026 on in the current pull.', false],
      [OM3, 2025, 'No O&M rows from FY2025 on in the current pull.', false]];
    for (const [om, first, want, ob] of cases) {
      const w = (om === OM2 ? 'FY2024 and FY2025 OBBBA rows' : 'a FY2024 row alone') + ', First FY ' + first;
      const { state } = await planOf([[files(om, FF), NOW]], { asOf: '2026-10', firstFY: first });
      const T = await boot(pageHtml({ state }));
      const p = (await T.view('om')).querySelector('p.none');
      C.eq('the O&M view, ' + w + (ob ? ': it says its rows from First FY on are FY2025 OBBBA funding (review M5-4)' : ': as before (control)'),
        p ? flat(p.textContent) : null, want);
      C.eq('the O&M view, ' + w + ': no script error', T.errors(), []);
      T.t.close();
    }
  });

  // =================================================================================================================
  // P5-5: What changed says it compares FY2025 OBBBA rows when the pulls hold some
  // =================================================================================================================
  await block('what changed', async () => {
    const L2 = ob => 'Every row of every FY is compared, whatever the switches show and whatever the First FY' + (ob ? ', FY2025 O&M OBBBA funding (left out of every '
      + 'other figure) included' : '') + ', because the question is what the new pull holds.';
    const amt = (rows, ccar, a) => rows.map(r => (r['CCaR No'] === ccar ? Object.assign({}, r, { Amount: a }) : r));
    const plain = OM.filter(r => r['CCaR No'] !== 'QR0003');
    for (const [w, a, b, ob] of [
      ['a FY2025 OBBBA row changed', OM, amt(OM, 'QR0003', '500000'), true],
      ['an OBBBA row in the earlier pull only', OM, plain, true],
      ['control: no OBBBA row in either pull', plain, amt(plain, 'QR0004', '3500000'), false]]) {
      const { state } = await planOf([[files(a, FF), NOW], [files(b, FF), NOW2]], { asOf: '2026-10' });
      const T = await boot(pageHtml({ state }));
      const m = await T.view('changes');
      const l2 = flat((m.querySelector('p.l2') || {}).textContent);
      C.chk('What changed, ' + w + ': ' + (ob ? 'its opening sentence says the FY2025 OBBBA rows are compared (review P5-5)' : 'its opening sentence as it was'),
        l2.startsWith(L2(ob)), l2);
      C.chk('What changed, ' + w + ': O&M is compared', !!m.querySelector('section.chg[data-ap="om"]'));
      C.eq('What changed, ' + w + ': no script error', T.errors(), []);
      T.t.close();
    }
  });

  // =================================================================================================================
  // P5-8: Help says Settings states the rule; the Summary's notes and the Import report say how much
  // =================================================================================================================
  await block('help', async () => {
    const T = await boot(pageHtml({}));
    const h = flat((await T.help()).textContent);
    C.chk('Help: the Summary’s notes and the Import report say how much is left out, Settings states the rule (review P5-8)',
      // §17: "such rows" now follows a sentence on the OBBBA money that counts, so Help names the rows it means
      h.includes('Where rows the rule leaves out are loaded, the Summary’s notes and the Import report say how much is left out, Settings states the '
        + 'rule, and an appropriation and FY whose only rows they are has no block.') && !/Settings and the Import report say how much/.test(h), h.slice(0, 400));
    C.chk('Help: the Summary’s notes say how much of each block’s Approved and Authorized is on no PMO tab (review P5-2)',
      h.includes('The Summary’s notes say how much of each block’s Approved and Authorized it is, so the PMO tabs add up to the Summary less it (except an Authorized '
        + 'typed in Settings, which is for its block as a whole and never shared among PMOs)'), '');
    T.t.close();
  });

  // =================================================================================================================
  // P5-2: the money no plan event uses, its Approved AND its Authorized; a typed Authorized named
  // =================================================================================================================
  await block('the money no plan event uses', async () => {
    const P = await SP.parseFiles(files(OM, FF, BAE), { now: NOW });
    const bae = Object.assign({}, P.bae, { importedAt: NOW });
    // O&M FY2026: B_X (row 6) is the only budget no plan event uses there; Full Fund FY2025 and O&M FY2025 have none
    const unA = D(BAE[5][2]), unU = D(BAE[5][3]);
    const blockA = D(BAE[4][2]) + unA, blockU = D(BAE[4][3]) + unU;
    const HEAD = 'The PMO tabs share each budget’s Approved and Authorized among the PMOs whose plan events use it, by their CCaR plan on it. ';
    const NOTE = HEAD + 'O&M FY2026 ' + $M(unA) + ' Approved and ' + $M(unU) + ' Authorized of the BAE report’s money is on budgets no plan event uses, so the PMO tabs add up '
      + 'to the Summary less it.';
    const TYPED = ' An Authorized typed in Settings (marked ‡: O&M FY2026) is for its block as a whole and is never shared among the PMOs, so there the PMO tabs’ '
      + 'Authorized need not add up to the Summary’s.';
    C.chk('the fixture: the money no plan event uses carries less Authorized than Approved, so the two readings differ', unU !== unA);
    const M = SP.buildModel(P.pulls, S0(SP), SP.defaultView(), bae);
    const b = M.blocks.find(x => x.key === 'om|2026');
    const rowsOf = k => M.pmos.flatMap(p => p.rows.filter(r => r.ap + '|' + r.fy === k));
    C.eq('O&M FY2026: the Summary’s Approved and Authorized are the report’s', [b.approved, b.authorized], [blockA, blockU]);
    C.eq('O&M FY2026: the PMO tabs add up to the Summary less the money no plan event uses, Approved and Authorized (§16.1)',
      [sum(rowsOf('om|2026').map(r => r.approved)), sum(rowsOf('om|2026').map(r => r.authorized))], [blockA - unA, blockU - unU]);
    C.eq('the Summary’s note names that money’s Approved and its Authorized (review P5-2)', M.summary.notes.filter(n => n.startsWith('The PMO tabs share')), [NOTE]);
    // a typed Authorized is the block's as a whole: the PMO tabs keep the report's split, and the note says so
    const Mt = SP.buildModel(P.pulls, S0(SP, null, { authorized: { 'om|2026': D(7000000) } }), SP.defaultView(), bae);
    const bt = Mt.blocks.find(x => x.key === 'om|2026');
    const rowsT = Mt.pmos.flatMap(p => p.rows.filter(r => r.ap + '|' + r.fy === 'om|2026'));
    C.eq('typed: the Summary shows the typed Authorized, the PMO tabs share the report’s', [bt.authorized, sum(rowsT.map(r => r.authorized))], [D(7000000), blockU - unU]);
    C.eq('typed: the note names the block whose Authorized is typed (review P5-2)', Mt.summary.notes.filter(n => n.startsWith('The PMO tabs share')), [NOTE + TYPED]);
    // on the screen and in the workbook, the model's note
    const { state } = await planOf([[files(OM, FF, BAE), NOW]], { asOf: '2026-10' });
    const T = await boot(pageHtml({ state }));
    const sm = flat((await T.view('summary')).textContent);
    C.chk('the Summary (view) prints the note', sm.includes(flat(NOTE)), '');
    const book = await exportBook(T, 'review5-pmo');
    const ss = (sheetRows(book, 'Summary') || []).map(r => String(r[0] ?? ''));
    C.chk('the Summary sheet prints the note', ss.includes(NOTE), J(ss.filter(l => l.startsWith('The PMO tabs'))));
    T.t.close();
  });

  // =================================================================================================================
  // P5-9: one row carries a Budget name that names no appropriation; two carry
  // =================================================================================================================
  await block('rows whose appropriation is not identified', async () => {
    const MISC = n => [['misc.csv', csv(Array.from({ length: n }, (_, i) => row(2025, 'QR009' + i, 'Invented Title Z', B_NOAP, 'Ev Z', '2025-02-10', '280000', NA, AV)))]];
    for (const n of [1, 2]) {
      const P = await SP.parseFiles(files(OM, FF, null, MISC(n)), { now: NOW });
      const M = SP.buildModel(P.pulls, S0(SP), SP.defaultView());
      C.eq('the fixture: ' + n + ' row' + (n === 1 ? '' : 's') + ' whose appropriation is not identified', [M.excluded.unidentified.rows, M.excluded.unidentified.cents], [n, n * D(280000)]);
      const note = M.summary.notes.find(x => /a Budget name that names no appropriation/.test(x)) || '';
      C.chk(n + ' row' + (n === 1 ? ' carries' : 's carry') + ' a Budget name that names no appropriation (review P5-9)',
        note.startsWith(n + (n === 1 ? ' row (' : ' rows (') + '$' + mText(n * D(280000)) + 'M) ' + (n === 1 ? 'carries' : 'carry') + ' a Budget name that names no appropriation'), note);
    }
  });
} finally {
  t.close();
  tmp.rm();
  C.done();
}
