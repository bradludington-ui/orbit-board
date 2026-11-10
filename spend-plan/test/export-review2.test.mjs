// The second review's export findings, each held on pulls made here. Every name and figure below is invented; each
// expectation is worked out from the rows and settings this file writes, never read back from the tool's own figures, and
// the workbook is read back with openpyxl, its own XML, Carlito (Calibri's metric twin) and LibreOffice, never with the
// tool's own reader.
//
// What it holds the tool to:
//   SEAM-8, M4, XP2-3, BP-8  a TOTAL's Authorized carries each mark its rows carry (†, ‡, †‡), on the screen as in the
//                            workbook, so one figure never makes two claims about what it is;
//   M4, XP2-4                every sheet and every view that prints a mark says what it means, beside the table it marks;
//   XP2-1                    a merged, wrapped line is as tall as its words: Excel never fits a merged row's height, so the
//                            † and ‡ key lines showed one line and hid the rest;
//   SEAM-9                   the Settings sheet never says "No such rows" for the seventh switch beside a raw sheet that
//                            lists rows with no service (before the first FY, or unreadable);
//   M5                       a delta that rounds to zero prints its sign as the workbook's format shows it, so the screen
//                            and LibreOffice agree, and a status is never beside figures that do not explain it;
//   XP2-5                    the README says what the workbook prints: the report sheets one page wide, the raw data not;
//   XP2-6                    printed, a slide block is never cut across two pages;
//   BP-3                     a pull imported before the data-through month ended says where its actuals stop, on every
//                            product that states "actual through", and the top bar says "imported", not "pulled";
//   BP-9                     a goal change names the curve, the column, the old and new goal; a download says where it went.
//
//   node spend-plan/test/export-review2.test.mjs
// Not UTC, so a day read in UTC cannot pass for this computer's own: at 03:00Z on 1 November it is 31 October in New York.
process.env.TZ = 'America/New_York';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTool, checks, scratchDir, pageHtml } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const READ = join(HERE, 'export-read.py'), MEASURE = join(HERE, 'export-review2.py');
const C = checks('export-review2');
const tmp = scratchDir('sfcbsp-xr2-');
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const EXEC = 'Actual Execution is allocated', NA = 'Not Allocated';
const PMOS = ['Air Vehicle (AV)', 'Business Operations (BOP)', 'Combat Data Systems (CDS)', 'Maintenance Systems (MxS)',
  'Product Support Management (PSM)', 'Propulsion (PP)', 'Training Systems (TSS)'];   // the office names (CONTRACT, preamble)
const BUD = { om: 'USAF O&M Discretionary', ff: 'USAF Full Fund Discretionary', sp: 'USAF Initial Spares Discretionary', opn: 'USN OPN Discretionary' };
const NAVY_OM = 'USN O&M Discretionary';
const AP_LABEL = { om: 'O&M', ff: 'Full Fund', sp: 'Initial Spares', opn: 'OPN' };
const APS = ['om', 'ff', 'sp', 'opn'];
const CUI = 'CUI//REL TO US DoW';
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const py = args => spawnSync('python3', ['-I', ...args], { encoding: 'utf8', maxBuffer: 1 << 30 });
const show = v => JSON.stringify(v);
function soffice(args, out) {
  mkdirSync(out, { recursive: true });
  return spawnSync('soffice', ['-env:UserInstallation=file://' + join(tmp.dir, 'lo-profile'), '--headless', '--norestore', ...args,
    '--outdir', out], { encoding: 'utf8', timeout: 240000 });
}
function measure(file) {
  const r = py([MEASURE, file]);
  if (r.status !== 0) throw new Error('export-review2.py failed: ' + (r.stderr || r.stdout).slice(-800));
  return JSON.parse(r.stdout);
}
async function writeBook(SP, M, pulls, settings, name) {
  const f = join(tmp.dir, name);
  writeFileSync(f, await SP.excelBytes(M, pulls, settings, { today: '2026-04-15' }));
  return f;
}
function boot() {
  const t = loadTool();
  C.eq('the page boots with no script errors', t.errors, []);
  const doc = t.window.document;
  const click = sel => { const el = doc.querySelector(sel); if (!el) return false; el.dispatchEvent(new t.window.MouseEvent('click', { bubbles: true })); return true; };
  const tick = (sel, on) => { const el = doc.querySelector(sel); el.checked = on; el.dispatchEvent(new t.window.Event('change', { bubbles: true })); };
  const main = () => doc.getElementById('uiMain') || doc.querySelector('main');
  const imp = async (rows, now, settings, name = 'Export.csv') => {
    const parsed = await t.SP.parseFiles([{ name, data: csv(rows) }], { now });
    t.SP.applyImport(parsed);
    if (settings) t.SP.setSettings(settings);
    t.SP.uiRender();
    return parsed;
  };
  return { t, SP: t.SP, doc, click, tick, main, imp };
}
const fmtOf = c => (c && c.s && c.s.fmt) || '';
const marksOf = f => (f.includes('†') ? '†' : '') + (f.includes('‡') ? '‡' : '');
const texts = sh => sh.rows.flatMap(r => r.cells.map(c => (c && typeof c.v === 'string' ? c.v : '')));

// ---------------------------------------------------------------------------------------------------------------------
// THE PULL: twelve blocks (four appropriations, FY2025 to FY2027), every PMO in each, with Not Allocated lines, so the
// Slide Snapshots sheet runs to several printed pages. Two blocks are made to sit on their goal's edge (M5):
//   O&M FY2026   Approved $2,010,000.10, Obligated $1,005,000.00: half a cent per $100 short of the 50% the O&M
//                first-year curve asks at March, a delta of about -0.0000025%, Within 10;
//   Full Fund FY2026  Approved $4,000,000.00, Obligated $1,333,200.00: exactly 33.33%, the procurement curve's March
//                goal, which the test then sets 0.00000000005 points higher, as a typed goal reached through a division can.
// ---------------------------------------------------------------------------------------------------------------------
function bigRows() {
  const rows = [];
  const base = (ap, fy, pmo, k) => ({ FY: fy, 'CCaR No': 'XR' + ap.toUpperCase() + fy + k, Title: 'Invented title ' + k + ' of ' + pmo, PMO: pmo,
    Budget: BUD[ap], 'Plan Event': 'Invented plan event ' + k + ' for ' + pmo + ' in ' + AP_LABEL[ap] + ' FY' + fy + ', a long name to fill its line' });
  for (const ap of APS) {
    for (const fy of [2025, 2026, 2027]) {
      const key = ap + '|' + fy;
      PMOS.forEach((pmo, k) => {
        let amt = String(150000 + 12345 * (k + 1) + (fy - 2024) * 1000 + APS.indexOf(ap) * 777);
        if (key === 'om|2026') amt = k === 6 ? '105000.10' : '150000.00';
        if (key === 'ff|2026') amt = k === 6 ? '266800.00' : '400000.00';
        const month = String(((k * 2 + fy) % 12) + 1).padStart(2, '0');
        rows.push({ ...base(ap, fy, pmo, k), Date: (fy - 1) + '-' + (month >= '10' ? month : '11') + '-1' + k, Amount: amt, Alloc: NA });
      });
      const ex = key === 'om|2026' ? '1005000.00' : key === 'ff|2026' ? '1333200.00' : String(300000 + (fy - 2024) * 50000);
      rows.push({ ...base(ap, fy, PMOS[0], 9), Date: (fy - 1) + '-11-20', Amount: ex, Alloc: EXEC });
      // a Navy O&M row, so a block still has money with USAF switched off (not in O&M FY2026, whose figures are exact)
      if (ap === 'om' && fy !== 2026) rows.push({ ...base(ap, fy, PMOS[1], 8), Budget: NAVY_OM, Date: (fy - 1) + '-12-05', Amount: '2500000', Alloc: NA });
    }
  }
  return rows;
}
const NOW = '2026-04-15T12:00:00Z';     // Data through Mar-2026: E is FY2026

// =====================================================================================================================
// SEAM-8, M4, XP2-3, BP-8: a TOTAL carries each mark its rows carry, on the screen as in the workbook;
// M4, XP2-4: every sheet and view that prints a mark explains it; XP2-1: the key lines are as tall as their words
// =====================================================================================================================
{
  const T = boot();
  const SP = T.SP;
  await T.imp(bigRows(), NOW, { asOf: '2026-03', firstFY: 2025 });
  const blocks = APS.flatMap(ap => [2025, 2026, 2027].map(fy => ap + '|' + fy));
  // [what, authorized entered, USAF off]
  const CASES = [['nothing entered, every switch on', {}, false], ['O&M FY2026 entered, USAF off', { 'om|2026': 900000000 }, true],
    ['every block entered, USAF off', Object.fromEntries(blocks.map((k, i) => [k, 100000000 + i])), true],
    ['every block entered, every switch on', Object.fromEntries(blocks.map((k, i) => [k, 100000000 + i])), false]];
  let measured = 0;
  for (const [what, auth, usafOff] of CASES) {
    SP.setSettings({ authorized: auth });
    T.tick('input[data-act=svc][data-i="0"]', !usafOff);
    // the marks, restated (§8.1, review R3): a row not entered is †; one entered is ‡ while a switch is off; a TOTAL is
    // each mark its rows carry
    const rowMark = k => (Object.prototype.hasOwnProperty.call(auth, k) ? (usafOff ? '‡' : '') : '†');
    const totMark = keys => (keys.some(k => rowMark(k) === '†') ? '†' : '') + (keys.some(k => rowMark(k) === '‡') ? '‡' : '');
    const view = SP.getView();
    const M = SP.buildModel(SP.state.pulls.current, SP.state.settings, view);
    C.chk(what + ': the switches are as set', M.shown.all === !usafOff, M.shown.text);
    const spec = SP.excelSpec(M, SP.state.pulls.current, SP.state.settings, { today: '2026-04-15' });
    const sheet = name => spec.sheets.find(s => s.name === name);
    for (const [vName, sheetName, keys, totLabel] of [['summary', 'Summary', blocks, 'TOTAL - Sustainment']]
      .concat(APS.map(ap => [ap, AP_LABEL[ap], blocks.filter(k => k.startsWith(ap + '|')), 'Total - All FYs']))) {
      const want = totMark(keys);
      // the screen
      T.click('button[data-act=view][data-v="' + vName + '"]');
      const tot = T.main().querySelector('tr[data-bk="total"]');
      const cell = tot ? tot.querySelectorAll('td.n')[1] : null;
      const got = cell ? (cell.querySelector('.dag') ? '†' : '') + (cell.querySelector('.ddag') ? '‡' : '') : null;
      C.eq(what + ': screen ' + sheetName + ': the TOTAL’s Authorized carries each mark its rows carry', got, want);
      const shownMarks = new Set([...T.main().querySelectorAll('table.top .dag, table.top .ddag')].map(e => e.textContent));
      const notes = [...T.main().querySelectorAll('p.note')].map(e => e.textContent);
      for (const m of shownMarks) {
        C.chk(what + ': screen ' + sheetName + ': ' + m + ' is explained under its table', notes.some(n => n === m + ' ' + SP.AUTH_MARK_TEXT[m]), notes.join(' / '));
      }
      // the workbook
      const sh = sheet(sheetName);
      const tr = sh.rows.find(r => r.cells[0] && r.cells[0].v === totLabel);
      const auth = tr ? tr.cells[sheetName === 'Summary' ? 3 : 2] : null;
      C.eq(what + ': workbook ' + sheetName + ': the TOTAL’s Authorized carries each mark its rows carry', marksOf(fmtOf(auth)), want);
      C.eq(what + ': ' + sheetName + ': the screen and the workbook mark the same TOTAL the same', got, marksOf(fmtOf(auth)));
    }
    // every sheet that prints a mark says what it means, on that sheet (a sheet is printed and sent on alone)
    for (const sh of spec.sheets) {
      if (/Raw Data$/.test(sh.name)) continue;
      const used = new Set();
      for (const r of sh.rows) for (const c of r.cells) for (const m of ['†', '‡']) if (fmtOf(c).includes(m)) used.add(m);
      for (const m of used) {
        const key = sh.rows.find(r => r.cells[0] && r.cells[0].v === m && r.cells[1] && r.cells[1].v === SP.AUTH_MARK_TEXT[m]);
        C.chk(what + ': workbook ' + sh.name + ': ' + m + ' is printed and explained on the sheet', !!key, sh.name);
      }
    }
    C.chk(what + ': the † text says Approved stands in, the ‡ text that it covers every service and lane',
      /Approved is shown in its place/.test(SP.AUTH_MARK_TEXT['†']) && /every service and lane/.test(SP.AUTH_MARK_TEXT['‡']));
    // XP2-1: measured from the written file, in Carlito, never by the tool's own estimate
    if (what.startsWith('O&M FY2026 entered')) {
      const f = await writeBook(SP, M, SP.state.pulls.current, SP.state.settings, 'marks.xlsx');
      const R = measure(f);
      const keyRows = spec.sheets.reduce((n, sh) => n + sh.rows.filter(r => r.cells[0] && (r.cells[0].v === '†' || r.cells[0].v === '‡')).length, 0);
      C.chk('XP2-1: the workbook has † and ‡ key lines to measure (on the Summary and each appropriation sheet)', keyRows >= 2 + APS.length, keyRows);
      C.eq('XP2-1: every merged, wrapped line is as tall as its words, measured in Carlito (the key lines included)', R.short, []);
      measured++;
    }
  }
  C.chk('XP2-1: the measure ran', measured === 1);
  T.tick('input[data-act=svc][data-i="0"]', true);
  T.t.close();
}

// =====================================================================================================================
// M5: a delta that rounds to zero, on the screen and as LibreOffice shows the workbook; XP2-6: printed, no slide block
// is cut across two pages
// =====================================================================================================================
{
  const T = boot();
  const SP = T.SP;
  await T.imp(bigRows(), NOW, { asOf: '2026-03', firstFY: 2025 });
  const goals = SP.goalsDefault();
  goals.p1[6] = 0.3333 + 5e-13;   // a goal a hair above Full Fund FY2026's 33.33%: within statusOf's tolerance, so On track
  SP.setSettings({ goals });
  T.click('button[data-act=view][data-v=summary]');
  const M = SP.buildModel(SP.state.pulls.current, SP.state.settings, SP.getView());
  const om26 = M.blocks.find(b => b.key === 'om|2026'), ff26 = M.blocks.find(b => b.key === 'ff|2026');
  // the fixture reaches its target: one delta a hair below zero and Within 10; one a hair below zero, within tolerance
  C.chk('M5: O&M FY2026 sits a hair below its goal, Within 10 (the case the finding names)',
    !!om26 && om26.delta < 0 && om26.delta > -0.00005 && om26.status === 'yellow', om26 && [om26.delta, om26.status]);
  C.chk('M5: Full Fund FY2026 sits within 1e-12 below its goal, On track',
    !!ff26 && ff26.delta < 0 && ff26.delta > -1e-12 && ff26.status === 'green', ff26 && [ff26.delta, ff26.status]);
  const scr = [...T.main().querySelectorAll('table.top tr[data-bk]:not([data-bk=total])')].map(tr => ({
    bk: tr.getAttribute('data-bk'), delta: tr.querySelectorAll('td.n')[6].textContent, st: tr.querySelector('td.st').textContent }));
  const row = k => scr.find(x => x.bk === k) || {};
  C.eq('M5: screen: O&M FY2026 prints its delta’s sign beside Within 10', [row('om|2026').delta, row('om|2026').st], ['-0.00%', 'Within 10']);
  C.eq('M5: screen: Full Fund FY2026, on its goal within the tolerance, prints 0.00% beside On track', [row('ff|2026').delta, row('ff|2026').st], ['0.00%', 'On track']);
  // the workbook as LibreOffice shows it, every Summary row against the screen
  const file = await writeBook(SP, M, SP.state.pulls.current, SP.state.settings, 'delta.xlsx');
  const lo = join(tmp.dir, 'lo-csv');
  const r = soffice(['--convert-to', 'csv:Text - txt - csv (StarCalc):44,34,76,1,,0,false,true,true,false,false,-1', file], lo);
  const CSV = r.status === 0 ? JSON.parse(py([READ, 'csv', lo]).stdout || '{}') : {};
  const sum = CSV[Object.keys(CSV).find(k => /-Summary\.csv$/.test(k))] || [];
  const h = sum.findIndex(x => x[0] === 'Appropriation' && x[8] === 'Delta (pp)');
  const lrows = h < 0 ? [] : sum.slice(h + 1, h + 1 + M.summary.rows.length);
  C.chk('M5: LibreOffice converted the workbook and its Summary has every row', r.status === 0 && lrows.length === scr.length && scr.length === M.blocks.length,
    'status ' + r.status + ', ' + lrows.length + ' of ' + scr.length);
  const diff = [];
  scr.forEach((s, i) => { const l = lrows[i] || []; if (l[8] !== s.delta || l[9] !== s.st) diff.push(s.bk + ': screen ' + s.delta + ' ' + s.st + ', LibreOffice ' + l[8] + ' ' + l[9]); });
  C.eq('M5: every Summary row’s Delta and Status read the same on the screen and in LibreOffice', diff, []);
  // the appropriation sheets' tables too
  for (const ap of APS) {
    const sh = CSV[Object.keys(CSV).find(k => k.endsWith('-' + AP_LABEL[ap] + '.csv'))] || [];
    const hh = sh.findIndex(x => x[0] === 'FY' && x[7] === 'Delta (pp)');
    T.click('button[data-act=view][data-v="' + ap + '"]');
    const s2 = [...T.main().querySelectorAll('table.top tr[data-bk]:not([data-bk=total])')].map(tr => tr.querySelectorAll('td.n')[6].textContent);
    const l2 = hh < 0 ? [] : sh.slice(hh + 1, hh + 1 + s2.length).map(x => x[7]);
    C.eq('M5: ' + AP_LABEL[ap] + ': every Delta reads the same on the screen and in LibreOffice', l2, s2);
  }
  // XP2-6: the page breaks as written (openpyxl reads them back), then the printed pages (LibreOffice's PDF)
  const spec = SP.excelSpec(M, SP.state.pulls.current, SP.state.settings, { today: '2026-04-15' });
  const sl = spec.sheets.find(s => s.name === 'Slide Snapshots');
  const tops = [];
  // a block's first row: the CUI line above its bar (with the filter line between them when something is hidden)
  sl.rows.forEach((rw, i) => {
    if (!(rw.cells[0] && / - Spend Plan \(PMO Summary, slide-ready\)$/.test(rw.cells[0].v))) return;
    const j = [i - 1, i - 2].find(k => k >= 0 && sl.rows[k].cells[0] && sl.rows[k].cells[0].v === CUI);
    tops.push(j === undefined ? -1 : j + 1);
  });
  C.eq('XP2-6: each block after the first starts a printed page, at its CUI line', sl.breaks || [], tops.slice(1));
  C.chk('XP2-6: every block was found', tops.length === M.blocks.length, tops.length + ' of ' + M.blocks.length);
  const R = measure(file);
  C.eq('XP2-6: openpyxl reads the breaks back from the file', R.breaks['Slide Snapshots'] || [], tops.slice(1));
  C.eq('XP2-6: rowBreaks follows headerFooter, as the schema orders them', R.after, { 'Slide Snapshots': true });
  const pdfDir = join(tmp.dir, 'lo-pdf');
  const rp = soffice(['--convert-to', 'pdf', file], pdfDir);
  const pdf = join(pdfDir, 'delta.pdf');
  const txt = rp.status === 0 && existsSync(pdf) ? spawnSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf8', maxBuffer: 1 << 28 }).stdout || '' : '';
  const pages = txt.split('\f');
  const s0 = pages.findIndex(p => /Slide Snapshots - picture-ready blocks for PowerPoint/.test(p));
  let s1 = pages.findIndex((p, i) => i > s0 && /Spend Plan & FY Summary/.test(p));
  if (s1 < 0) s1 = pages.length;
  const slidePages = s0 < 0 ? [] : pages.slice(s0, s1);
  const count = (p, re) => (p.match(re) || []).length;
  const cut = [];
  let bars = 0;
  slidePages.forEach((p, i) => {
    const n = [count(p, / - Spend Plan \(PMO Summary, slide-ready\)/g), count(p, /Monthly Totals/g), count(p, /Cumulative Totals/g),
      count(p, /Obligation %\s+\(Approved/g), count(p, /OSD Goal %/g), count(p, /OSD Status(?! and use)/g)];
    bars += n[0];
    if (n.some(x => x !== n[0])) cut.push('page ' + (i + 1) + ' of the sheet: bar, Monthly, Cumulative, Obligation %, Goal, Status = ' + n.join(', '));
  });
  C.chk('XP2-6: LibreOffice printed the sheet over several pages, every block on them', slidePages.length > 1 && bars === M.blocks.length,
    slidePages.length + ' pages, ' + bars + ' of ' + M.blocks.length + ' blocks; ' + (rp.stderr || '').slice(-200));
  C.eq('XP2-6: printed, every block is whole on one page: its bar through OSD Status', cut, []);
  T.t.close();
}

// =====================================================================================================================
// SEAM-9: the seventh switch's line on the Settings sheet, beside the raw sheets
// =====================================================================================================================
{
  const t = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine', 'xlsx-write', 'export'] });
  const SP = t.SP;
  const B = { 'CCaR No': 'XS0101', Title: 'Invented', PMO: PMOS[0], 'Plan Event': 'Event one', Alloc: NA };
  const MYST = 'Mystery O&M Line';   // names O&M, and no service
  const rows = [{ ...B, FY: 2027, Budget: BUD.om, Date: '2026-11-10', Amount: '1000000' },
    { ...B, FY: 2026, Budget: MYST, Date: '2026-01-10', Amount: '377000' }, { ...B, FY: 2026, Budget: MYST, Date: '2026-02-10', Amount: '266000' },
    { ...B, FY: 2027, Budget: MYST, Date: '2026-12-10', Amount: 'about ten' }];
  const parsed = await SP.parseFiles([{ name: 'O&M Raw Data.csv', data: csv(rows) }], { now: '2026-11-09T12:00:00Z' });
  const line = (first, pulls = parsed.pulls) => {
    const S = Object.assign(SP.defaultSettings('2026-11-09'), { asOf: '2026-10', firstFY: first });
    const M = SP.buildModel(pulls, S, SP.defaultView());
    const spec = SP.excelSpec(M, pulls, S, {});
    const r = spec.sheets.find(s => s.name === 'Settings').rows.find(x => x.cells[0] && x.cells[0].v === 'Service not identified');
    const raw = spec.sheets.find(s => s.name === 'O&M Raw Data');
    const si = raw.rows[0].cells.findIndex(c => c && c.v === 'Service');
    const listed = raw.rows.slice(1).filter(x => x.cells[si] && x.cells[si].v === 'Service not identified').length;
    return { v: r && r.cells[1] ? String(r.cells[1].v) : null, listed };
  };
  const a = line(2027);
  C.chk('SEAM-9: the raw sheet lists the three rows with no service (the case the finding names)', a.listed === 3, a.listed);
  C.chk('SEAM-9: the Settings sheet does not say "No such rows" beside them', !!a.v && !/No such rows/.test(a.v), a.v);
  C.chk('SEAM-9: it says there is no switch, and why each row with no service counts nowhere',
    !!a.v && /^No switch/.test(a.v) && /2 rows before the first FY shown \(FY2027\)/.test(a.v) && /1 row that could not be read/.test(a.v), a.v);
  C.eq('SEAM-9: with First FY 2026 the rows count, and the switch is shown', line(2026).v, 'Shown');
  const clean = { om: Object.assign({}, parsed.pulls.om, { rows: parsed.pulls.om.rows.filter(x => x.c[4] !== MYST) }) };
  C.eq('SEAM-9: with no row that has no service, there are no such rows', line(2027, clean).v, 'No such rows (no switch)');
  t.close();
}

// =====================================================================================================================
// BP-3: a pull imported before the data-through month ended says where its actuals stop
// =====================================================================================================================
{
  const T = boot();
  const SP = T.SP;
  // one OPN block over $10,000M, so its longer label is wider than the label column (it must wrap, never be cut)
  const all = bigRows().concat([{ FY: 2026, 'CCaR No': 'XRBIG', Title: 'Invented large title', PMO: PMOS[2], Budget: BUD.opn,
    'Plan Event': 'Invented large plan event', Date: '2025-12-01', Amount: '12000000000', Alloc: NA }]);
  await T.imp(all, '2026-10-05T14:00:00Z');
  // O&M again on 9 November: Data through moves to Oct-2026; Full Fund, Initial Spares and OPN keep their 5 October pull
  await T.imp(all.filter(r => r.Budget === BUD.om || r.Budget === NAVY_OM), '2026-11-09T14:00:00Z', null, 'O&M Raw Data.csv');
  C.eq('BP-3: Data through is Oct-2026 after the 9 November import', SP.state.settings.asOf, '2026-10');
  const M = SP.buildModel(SP.state.pulls.current, SP.state.settings, SP.getView());
  C.eq('BP-3: the model names the pulls imported before Oct-2026 ended, and their day', (M.stale || []).map(s => [s.ap, s.day]),
    [['ff', '2026-10-05'], ['sp', '2026-10-05'], ['opn', '2026-10-05']]);
  const stale = new Set(['ff', 'sp', 'opn']);
  const IMPORTED = 'actual through the 2026-10-05 import, plan after)', THROUGH = 'actual through Oct, plan after)';
  const okLabel = (ap, lab) => typeof lab === 'string' && lab.startsWith('Obligation %') && lab.endsWith(stale.has(ap) ? IMPORTED : THROUGH);
  const bad = M.blocks.filter(b => !okLabel(b.ap, SP.oblLabel(b, M))).map(b => b.key + ': ' + SP.oblLabel(b, M));
  C.eq('BP-3: each block’s Obligation % line says where its actuals stop', bad, []);
  const note = M.summary.notes.find(n => /imported/.test(n) && /2026-10-05/.test(n));
  C.chk('BP-3: a Summary note names the three and when they were imported, before Oct-2026 ended',
    !!note && /Full Fund, Initial Spares and OPN pulls were imported/.test(note) && /before the end of Oct-2026/.test(note), note || M.summary.notes.join(' / '));
  // the screen: the Summary's notes, the slide blocks' and the PMO view's labels, the top bar
  T.click('button[data-act=view][data-v=summary]');
  C.chk('BP-3: screen Summary: the note is shown', !!note && T.main().textContent.includes(note));
  T.click('button[data-act=view][data-v=slides]');
  const labs = [...T.main().querySelectorAll('section.slide')].map(s => {
    const th = [...s.querySelectorAll('th')].find(e => /^Obligation %/.test(e.textContent.replace(/ /g, ' ')));
    return [s.getAttribute('aria-label'), th ? th.textContent.replace(/ /g, ' ') : null];
  });
  const badS = labs.filter(([n, l]) => !okLabel(Object.keys(AP_LABEL).find(k => n.startsWith(AP_LABEL[k] + ' FY')), l || ''));
  C.chk('BP-3: screen slide blocks: every Obligation % line says where its actuals stop', labs.length === M.blocks.length && !badS.length, show(badS.slice(0, 3)));
  const top = T.doc.getElementById('uiPulls').textContent;
  C.chk('BP-3: the top bar says each appropriation was imported (the import’s day), never "pulled"',
    /OPN imported 2026-10-05/.test(top) && /O&M imported 2026-11-09/.test(top) && !/pulled/.test(top), top);
  // the workbook: every Obligation % line on the slide, appropriation and PMO sheets, and the Summary's notes
  const spec = SP.excelSpec(M, SP.state.pulls.current, SP.state.settings, { today: '2026-11-09' });
  let n = 0;
  const badW = [];
  for (const sh of spec.sheets) {
    let ap = null;
    for (const r of sh.rows) {
      const v = r.cells[0] && typeof r.cells[0].v === 'string' ? r.cells[0].v : '';
      // the block a band belongs to is named by the bar above it: a slide bar, an appropriation sheet, a PMO-tab bar
      const m = /^(O&M|Full Fund|Initial Spares|OPN) (?:FY\d{4} - Spend Plan|- FY\d{4})/.exec(v) || (sh.name in { 'O&M': 1, 'Full Fund': 1, 'Initial Spares': 1, OPN: 1 } && /^FY\d{4} - Spend Plan by/.test(v) ? [0, sh.name] : null);
      if (m) ap = Object.keys(AP_LABEL).find(k => AP_LABEL[k] === m[1]);
      if (v.startsWith('Obligation %')) { n++; if (!ap || !okLabel(ap, v)) badW.push(sh.name + ': ' + v); }
    }
  }
  const want = M.blocks.length * 2 + M.pmos.reduce((s, p) => s + p.blocks.length, 0);
  C.chk('BP-3: workbook: every Obligation % line (slides, appropriation sheets, PMO tabs) says where its actuals stop', n === want && !badW.length,
    n + ' of ' + want + '; ' + badW.slice(0, 3).join(' / '));
  C.chk('BP-3: workbook Summary: the note is in its notes', !!note && texts(spec.sheets.find(s => s.name === 'Summary')).includes(note));
  // every label is whole as Excel draws it, measured in Carlito from the written file
  const big = M.blocks.find(b => b.key === 'opn|2026');
  C.chk('BP-3: the fixture reaches its target: an OPN block over $10,000M', !!big && big.approved > 1e12, big && big.approved);
  const R = measure(await writeBook(SP, M, SP.state.pulls.current, SP.state.settings, 'stale.xlsx'));
  C.eq('BP-3: no Obligation % label (nor any other line) is cut or too short for its words, measured in Carlito', R.short, []);
  // a later import of all four brings every pull past the month: nothing is marked
  await T.imp(all, '2026-11-10T14:00:00Z');
  const M2 = SP.buildModel(SP.state.pulls.current, SP.state.settings, SP.getView());
  C.chk('BP-3: once every pull is imported after Oct-2026 ended, nothing is marked',
    (M2.stale || []).length === 0 && !M2.summary.notes.some(x => /actual obligations stop/.test(x)) && M2.blocks.every(b => SP.oblLabel(b, M2).endsWith(THROUGH)));
  // the day is this computer's: 03:00Z on 1 November is 31 October in New York, so October is not over for that pull
  const P = JSON.parse(JSON.stringify(SP.state.pulls.current));
  const S = Object.assign({}, SP.state.settings, { asOf: '2026-10' });
  P.opn.importedAt = '2026-11-01T03:00:00Z'; P.sp.importedAt = '2026-11-01T05:00:00Z';
  const M3 = SP.buildModel(P, S, SP.getView());
  C.eq('BP-3: the import day is read in this computer’s time (31 October in New York is before October ends; 1 November is not)',
    (M3.stale || []).map(s => [s.ap, s.day]), [['opn', '2026-10-31']]);
  T.t.close();
}

// =====================================================================================================================
// BP-9: what a goal change and a download say
// =====================================================================================================================
{
  const T = boot();
  const SP = T.SP;
  await T.imp(bigRows(), NOW, { asOf: '2026-03', firstFY: 2025 });
  T.click('button[data-act=view][data-v=settings]');
  const inp = T.main().querySelector('input[data-act=goal][data-curve=om1][data-i="6"]');
  inp.value = '55';
  inp.dispatchEvent(new T.t.window.Event('change', { bubbles: true }));
  C.eq('BP-9: a goal change names the curve, the column, the new and the old goal', T.doc.getElementById('uiMsg').textContent,
    'OSD goal for O&M, first year, Mar, set to 55% (was 50%). The statuses are worked out again.');
  const res = await SP.exportExcel();
  C.chk('BP-9: Export Excel says where the file went, as the pictures’ messages do',
    res.ok && /as a download: your browser puts it in its downloads folder, or asks where to save it\.$/.test(res.message), res.message);
  C.chk('BP-9: no message says "to your downloads": where a download lands is the browser’s choice',
    !/to your downloads/.test(pageHtml()));
  T.t.close();
}

// =====================================================================================================================
// XP2-5: the README says what the workbook prints
// =====================================================================================================================
{
  const readme = readFileSync(join(HERE, '..', 'README.md'), 'utf8');
  C.chk('XP2-5: the README does not say every sheet prints one page wide (the raw data sheets do not)',
    !/Every sheet[^.]*one page wide/i.test(readme), (readme.match(/[^.\n]*one page wide[^.\n]*/i) || [''])[0]);
  C.chk('XP2-5: the README says the raw data sheets print at full size across pages',
    /raw data sheets print at full size/i.test(readme), (readme.match(/[^.\n]*raw data[^.\n]*print[^.\n]*/i) || [''])[0]);
}

// =====================================================================================================================
// XP2-6, the writer: breaks are written where the schema puts them, read back, and refused when Excel would refuse them
// =====================================================================================================================
{
  const t = loadTool({ modules: ['util', 'xlsx-write'] });
  const SP = t.SP;
  const rows = Array.from({ length: 12 }, (_, i) => ({ cells: [{ v: 'row ' + (i + 1) }] }));
  const sheet = extra => Object.assign({ name: 'A', page: { orientation: 'landscape', paper: 'letter', fitWidth: 1, fitHeight: 0 },
    header: '&CHead', footer: '&CFoot', rows }, extra);
  const f = join(tmp.dir, 'breaks.xlsx');
  let wrote = null;
  try { writeFileSync(f, await SP.writeXlsx({ sheets: [sheet({ breaks: [7, 3, 7] })] })); wrote = true; } catch (e) { wrote = e.message; }
  C.chk('writer: a sheet with page breaks is written', wrote === true, wrote);
  const R = wrote === true ? measure(f) : {};
  C.eq('writer: breaks are read back by openpyxl, once each, in order', R.breaks, { A: [3, 7] });
  C.eq('writer: rowBreaks follows headerFooter', R.after, { A: true });
  for (const [what, b] of [['not a list', 'x'], ['row 1 (a page already starts there)', [1]], ['not a whole row', [2.5]],
    ['more than Excel holds (1,026)', Array.from({ length: 1027 }, (_, i) => i + 2)]]) {
    let threw = false;
    try { await SP.writeXlsx({ sheets: [sheet({ breaks: b, rows: Array.from({ length: 1100 }, () => ({ cells: [{ v: 1 }] })) })] }); } catch (e) { threw = true; }
    C.chk('writer: a break list that is ' + what + ' is refused', threw);
  }
  t.close();
}

tmp.rm();
C.done();
