// The import-safety review's findings (IMP-1 … IMP-14), each held on a small pull made here. Every name and figure below
// is invented, and every expectation is worked out from the rows this file writes, never read back from the tool.
//
// What it holds the tool to:
//   IMP-1   an appropriation whose every row sits on a sheet named for another (a misfiled row) never replaces that
//           appropriation's pull unasked: the person is asked, Cancel changes nothing, OK says so after; and the refusal
//           of two sheets no longer advises importing the files one at a time (which is the silent route)
//   IMP-2   the Import report (screen and workbook) lists the unreadable rows of a pull the last import did not replace
//   IMP-4   the message line names a file the import refused, and reads as a warning, not a success
//   IMP-6   an Amount that is a formula saved without its result is unreadable and named, never $0; a blank Amount is
//           counted in the report
//   IMP-7   a saved plan (.html) can be taken whole into another copy of the tool; the tool's own export re-imports
//           without growing "Service (2)" … columns
//   IMP-8   one stray byte in a UTF-8 CSV does not turn the whole file into Windows-1252 (a refused FY header, mojibake)
//   IMP-9   rows whose Date could not be read (placed in No date) are said in the message line
//   IMP-10  a file that is not a zip is named for what it is (.xls, a web page, a saved plan, text), not "truncated"
//   IMP-11  the same pull imported again keeps the pull What changed compares with
//   IMP-12  an import that places no row leaves Data through where the person set it
//   IMP-13  a row with values only in columns the tool does not read is listed with its text, not called blank
//   IMP-14  a saved file whose last import report is the wrong shape is refused on opening, not drawn broken
//
//   node spend-plan/test/import-safety.test.mjs
//   SFCBSP_PAGE=/path/to/built.html node spend-plan/test/import-safety.test.mjs   (the same checks on a given built page)
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadTool, checks, scratchDir } from './harness.mjs';

const C = checks('import-safety');
const tmp = scratchDir('sfcbsp-impsafe-');
const PAGE = process.env.SFCBSP_PAGE ? readFileSync(process.env.SFCBSP_PAGE, 'utf8') : null;
const NOW = '2026-11-09T15:00:00Z';
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const NA = 'Not Allocated', EXEC = 'Actual Execution is allocated';
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = (rows, extra = []) => [HEADERS.concat(extra).join(',')].concat(rows.map(o => HEADERS.concat(extra).map(h => q(o[h])).join(','))).join('\n');
const usd = c => '$' + (c / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');   // $1,234.00, restated
const J = x => JSON.stringify(x);

// the page: built from the sources, or the page SFCBSP_PAGE names, with a saved state in its tag when one is given
function boot(state) {
  let html = null;
  if (PAGE) {
    html = PAGE;
    if (state) html = html.replace('<script id="spState" type="application/json">null</script>',
      () => '<script id="spState" type="application/json">' + JSON.stringify(state).replace(/</g, '\\u003c') + '</script>');
  }
  const t = PAGE ? loadTool({ html }) : loadTool({ state });
  const asked = [];
  let answer = true;
  t.window.confirm = qq => { asked.push(String(qq)); return answer; };
  const doc = t.window.document;
  return {
    t, SP: t.SP, doc, asked,
    answer(v) { answer = v; },
    async parse(files) { return t.SP.parseFiles(files.map(([name, data]) => ({ name, data })), { now: NOW }); },
    async imp(files) { return t.SP.applyImport(await this.parse(files)); },
    // the page's own Import button, given files the way the file input gives them
    async ui(files) {
      await t.window.ui_import(files.map(([name, data]) => ({
        name, arrayBuffer: async () => (typeof data === 'string' ? new TextEncoder().encode(data).buffer : data) })));
      return { text: doc.getElementById('uiMsg').textContent, cls: doc.getElementById('uiMsg').className };
    },
    view(v) {
      if (typeof t.SP.uiRender === 'function') t.SP.uiRender();   // the page redraws after an import on a timer; draw it now
      const b = doc.querySelector('[data-act=view][data-v="' + v + '"]');
      if (b) b.dispatchEvent(new t.window.MouseEvent('click', { bubbles: true }));
      return (doc.getElementById('uiMain') || doc.body).textContent.replace(/\s+/g, ' ');
    },
    model() { return t.SP.buildModel(t.SP.state.pulls.current, t.SP.state.settings, t.SP.defaultView()); },
  };
}
// the page boots on DOMContentLoaded, after the constructor returns: one turn of the loop and it has drawn
const settle = () => new Promise(r => setTimeout(r, 20));
const totals = SP => { const M = SP.buildModel(SP.state.pulls.current, SP.state.settings, SP.defaultView()); return Object.fromEntries(M.aps.map(a => [a.ap, a.total.approved])); };
// one finding's checks: a block that throws is a failing check that names it, and the blocks after it still run
async function block(name, fn) {
  try { await fn(); } catch (e) { C.chk(name + ': the checks stopped part way: ' + String((e && e.stack) || e).split('\n').slice(0, 2).join(' | '), false); }
}
async function refusal(p) { try { await p; return null; } catch (e) { return e; } }

// A workbook written by hand, zipped by Python: another writer, so the reader is never checked only against itself.
//   sheets  {name: sheetXml}
function xlsx(file, sheets) {
  const py = `
import json, sys, zipfile
out, sheets = sys.argv[1], json.loads(sys.argv[2])
names = list(sheets.keys())
ct = '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' \\
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' \\
  '<Default Extension="xml" ContentType="application/xml"/>' \\
  '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' + \\
  ''.join('<Override PartName="/xl/worksheets/sheet%d.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' % (i + 1) for i in range(len(names))) + '</Types>'
rels = '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' \\
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'
wb = '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' \\
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + \\
  ''.join('<sheet name="%s" sheetId="%d" r:id="rId%d"/>' % (n.replace('&', '&amp;'), i + 1, i + 1) for i, n in enumerate(names)) + '</sheets></workbook>'
wrels = '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + \\
  ''.join('<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet%d.xml"/>' % (i + 1, i + 1) for i in range(len(names))) + '</Relationships>'
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml', ct); z.writestr('_rels/.rels', rels); z.writestr('xl/workbook.xml', wb)
    z.writestr('xl/_rels/workbook.xml.rels', wrels)
    for i, n in enumerate(names): z.writestr('xl/worksheets/sheet%d.xml' % (i + 1), sheets[n])
`;
  const out = join(tmp.dir, file);
  const r = spawnSync('python3', ['-I', '-c', py, out, JSON.stringify(sheets)], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('the workbook writer failed: ' + r.stderr);
  const b = readFileSync(out);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}
const xs = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const L = i => { let n = i + 1, s = ''; while (n > 0) { s = String.fromCharCode(65 + (n - 1) % 26) + s; n = Math.floor((n - 1) / 26); } return s; };
// a sheet of inline-string headers, then rows whose cells are given as raw cell XML (or a plain value written as text)
function sheetXml(headers, rows) {
  const cell = (r, i, v) => typeof v === 'object' && v && v.xml !== undefined ? v.xml.replace('@', L(i) + r)
    : '<c r="' + L(i) + r + '" t="inlineStr"><is><t>' + xs(v) + '</t></is></c>';
  const line = (r, vals) => '<row r="' + r + '">' + vals.map((v, i) => (v === null || v === undefined || v === '' ? '' : cell(r, i, v))).join('') + '</row>';
  return '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'
    + line(1, headers) + rows.map((vals, k) => line(k + 2, vals)).join('') + '</sheetData></worksheet>';
}

const ROW = { FY: 2026, Title: 'Invented Title', PMO: 'Alpha Wing (AW)', 'Plan Event': 'Event one', Date: '2026-01-10', Alloc: NA };
const om = (n, amt, extra = {}) => Array.from({ length: n }, (_, i) => ({ ...ROW, 'CCaR No': 'XX' + String(100 + i), Budget: 'USAF O&M Discretionary', Amount: String(amt), ...extra }));
const ff = (n, amt) => Array.from({ length: n }, (_, i) => ({ ...ROW, 'CCaR No': 'YY' + String(100 + i), Budget: 'USAF Full Fund Discretionary', Amount: String(amt) }));

try {
  // ===================================================================================================================
  // IMP-1 — a misfiled row: the advice, the record, the question
  // ===================================================================================================================
  await block('IMP-1', async () => {
    const T = boot();
    const SP = T.SP;
    C.eq('the page boots with no script errors', T.t.errors, []);
    const ffFile = ['FF Raw Data.csv', csv(ff(40, 1000000))];                              // 40 rows, $40,000,000.00
    const stray = { ...ROW, 'CCaR No': 'YY999', Budget: 'USAF Full Fund Discretionary', Amount: '1234' };
    const omFile = ['O&M Raw Data.csv', csv(om(30, 500000).concat([stray]))];               // 30 O&M rows and one Full Fund row
    // together: the one-sheet rule refuses, and its advice is no longer the route that loses the pull
    const e = await refusal(T.parse([ffFile, omFile]));
    C.chk('IMP-1: two sheets holding Full Fund rows are refused', !!e && e.refused === true, e && e.message);
    C.chk('IMP-1: the refusal does not advise importing the files one at a time', !!e && !/one at a time/.test(e.message), e && e.message);
    C.chk('IMP-1: it says to move the row to its own appropriation’s sheet or correct its Budget',
      !!e && /move it to the sheet of its own appropriation, or correct its Budget/.test(e.message), e && e.message);
    // the O&M file alone: parsed, with the Full Fund row recorded as one that every row of its appropriation is on such a sheet
    const p = await T.parse([omFile]);
    C.eq('IMP-1: the stray is recorded with its file, sheet, rows and dollars',
      (p.report.strays || []).map(x => [x.ap, x.file, x.sheet, x.sheetAp, x.rows, x.cents]), [['ff', 'O&M Raw Data.csv', 'O&M Raw Data', 'om', 1, 123400]]);
    C.chk('IMP-1: the report lines name it', SP.importReportLines(p.report).some(l => /Every Full Fund row in this import sits on a sheet named for O&M/.test(l) && l.includes('$1,234.00')));
    // a Full Fund pull is on screen; the O&M file brings the stray: the person is asked, and Cancel changes nothing
    await T.imp([ffFile]);
    C.eq('IMP-1: (the Full Fund pull is on screen: 40 rows, $40,000,000.00)', [SP.state.pulls.current.ff.rows.length, totals(SP).ff], [40, 4000000000]);
    const before = J(SP.state);
    T.answer(false);
    const r0 = SP.applyImport(p);
    C.chk('IMP-1: the person is asked before the stray replaces the Full Fund pull', T.asked.length === 1, J(T.asked));
    C.chk('IMP-1: the question names the sheet, the row and the pull it would replace',
      /O&M Raw Data/.test(T.asked[0] || '') && /\$1,234\.00/.test(T.asked[0] || '') && /40 rows, \$40,000,000\.00/.test(T.asked[0] || ''), T.asked[0]);
    C.chk('IMP-1: Cancel: the result says nothing was imported', !!r0 && r0.ok === false && /^Nothing was imported/.test(r0.message), J(r0));
    C.chk('IMP-1: Cancel: the state is exactly as it was', J(SP.state) === before);
    // OK: imported, and the message says so as a warning
    T.answer(true);
    const r1 = SP.applyImport(p);
    C.chk('IMP-1: OK: imported, and the message names the stray as a check', !!r1 && r1.warn === true && /a sheet named for O&M/.test(r1.message) && /1 row, \$1,234\.00/.test(r1.message), J(r1));
    C.eq('IMP-1: OK: the Full Fund pull is the one row (as the person chose); the 40-row pull is previous',
      [SP.state.pulls.current.ff.rows.length, SP.state.pulls.previous.ff.rows.length], [1, 40]);
    T.t.close();
  });
  // through the page's own Import button: Cancel reads as a refusal, OK as a warning
  await block('IMP-1 (through the page)', async () => {
    const T = boot();
    await T.ui([['FF Raw Data.csv', csv(ff(40, 1000000))]]);
    const stray = { ...ROW, 'CCaR No': 'YY999', Budget: 'USAF Full Fund Discretionary', Amount: '1234' };
    T.answer(false);
    const m0 = await T.ui([['O&M Raw Data.csv', csv(om(30, 500000).concat([stray]))]]);
    C.chk('IMP-1 (page): Cancel: the message line says nothing was imported, as an error', /msg-err/.test(m0.cls) && /Nothing was imported/.test(m0.text), J(m0));
    C.eq('IMP-1 (page): Cancel: Full Fund still $40,000,000.00, and no O&M', [totals(T.SP).ff, totals(T.SP).om], [4000000000, undefined]);
    T.answer(true);
    const m1 = await T.ui([['O&M Raw Data.csv', csv(om(30, 500000).concat([stray]))]]);
    C.chk('IMP-1 (page): OK: the message line is a warning, not a plain success', /msg-warn/.test(m1.cls) && /sheet named for O&M/.test(m1.text), J(m1));
    T.t.close();
  });
  // controls: a combined sheet whose name names no appropriation, and rows on their own sheets, ask nothing
  await block('IMP-1 (controls)', async () => {
    const T = boot();
    await T.imp([['Export.csv', csv(om(2, 100).concat(ff(2, 200)))]]);
    await T.imp([['O&M Raw Data.csv', csv(om(2, 100))], ['FF Raw Data.csv', csv(ff(2, 200))]]);
    C.eq('IMP-1 (control): a combined export and rows on their own sheets ask nothing', T.asked, []);
    T.t.close();
  });

  // ===================================================================================================================
  // IMP-2 — the Import report lists what a pull the last import did not replace still holds
  // ===================================================================================================================
  await block('IMP-2', async () => {
    const T = boot();
    const SP = T.SP;
    const sp = [
      { ...ROW, 'CCaR No': 'SP101', Budget: 'USAF Initial Spares', Amount: '700' },
      { ...ROW, 'CCaR No': 'SP102', Budget: 'USAF Initial Spares', Amount: 'lots' },          // row 3: unreadable
      { ...ROW, 'CCaR No': 'SP103', Budget: 'USAF Initial Spares', Amount: '250', Date: 'soon' },   // row 4: a Date that does not read
    ];
    await T.imp([['spares-pull.csv', csv(sp)]]);
    await T.imp([['OPN Raw Data.csv', csv([{ ...ROW, 'CCaR No': 'OP101', Budget: 'USN OPN', Amount: '900' }])]]);
    const notes = T.model().summary.notes.filter(n => /could not be read/.test(n));
    C.chk('IMP-2: (the Summary still names the unreadable row and sends the reader to the Import report)', notes.length === 1 && /See the Import report/.test(notes[0]), J(notes));
    const kept = typeof SP.keptPullLines === 'function' ? SP.keptPullLines(SP.state.pulls.current, SP.state.lastImport.report) : [];
    C.chk('IMP-2: the pull kept from the earlier import is listed, with its file and sheet',
      kept.some(l => l.startsWith('Initial Spares: 3 rows, $950.00 (plus 1 unreadable row') && l.includes('“spares-pull.csv” › “spares-pull”')), J(kept));
    C.chk('IMP-2: its unreadable row is listed by row, with its reason',
      kept.some(l => l.includes('“spares-pull.csv” › “spares-pull” row 3: Amount “lots” is not an amount')), J(kept));
    C.chk('IMP-2: its unreadable Date is listed by row', kept.some(l => l.includes('row 4: Date “soon”')), J(kept));
    C.chk('IMP-2: the OPN pull the last import brought is not listed again', !kept.some(l => l.startsWith('OPN')), J(kept));
    const scr = T.view('report');
    C.chk('IMP-2 (page): the Import report view lists the row the Summary counts', scr.includes('row 3: Amount “lots” is not an amount') && scr.includes('Pulls on screen from earlier imports'), scr.slice(0, 400));
    C.chk('IMP-2 (page): its heading no longer says the last import is where all the data on screen came from', !scr.includes('The import the data on screen came from'));
    const spec = SP.excelSpec(T.model(), SP.state.pulls.current, SP.state.settings, { report: SP.state.lastImport.report, today: '2026-11-09' });
    const rep = spec.sheets.find(s => s.name === 'Import Report');
    const texts = rep ? rep.rows.map(r => r.cells && r.cells[0] && r.cells[0].v).filter(v => typeof v === 'string') : [];
    C.chk('IMP-2 (workbook): the Import Report sheet lists it too', texts.some(v => v.includes('row 3: Amount “lots” is not an amount')), J(texts.slice(-8)));
    // control: once every pull on screen came from the last import, there is nothing kept to list
    await T.imp([['spares-pull.csv', csv(sp)], ['OPN Raw Data.csv', csv([{ ...ROW, 'CCaR No': 'OP101', Budget: 'USN OPN', Amount: '900' }])]]);
    C.eq('IMP-2 (control): nothing is listed when the last import brought every pull', typeof SP.keptPullLines === 'function' ? SP.keptPullLines(SP.state.pulls.current, SP.state.lastImport.report) : null, []);
    T.t.close();
  });

  // ===================================================================================================================
  // IMP-4, IMP-9 — the message line names a refused file, unreadable rows and dates
  // ===================================================================================================================
  await block('IMP-4, IMP-9', async () => {
    const T = boot();
    await T.imp([['OPN Raw Data.csv', csv([{ ...ROW, 'CCaR No': 'OP101', Budget: 'USN OPN', Amount: '900' }])]]);
    // a workbook cut short in a download: it starts like a zip and has lost its end
    const cut = new Uint8Array(200); cut.set([0x50, 0x4B, 0x03, 0x04]);
    const rows = om(3, 100).concat([{ ...ROW, 'CCaR No': 'XX900', Budget: 'USAF O&M', Amount: 'n/a' }, { ...ROW, 'CCaR No': 'XX901', Budget: 'USAF O&M', Amount: '5', Date: '3/15/26' }]);
    const m = await T.ui([['O&M Raw Data.csv', csv(rows)], ['cut-opn.xlsx', cut.buffer]]);
    C.chk('IMP-4: the message line names the refused file and its reason', /“cut-opn\.xlsx” was refused/.test(m.text) && /cut short|truncated/.test(m.text), m.text);
    C.chk('IMP-4: and reads as a warning, not a plain success', /msg-warn/.test(m.cls), m.cls);
    C.chk('IMP-4: the unreadable row is said', /1 O&M row could not be read \(FY or Amount\)/.test(m.text), m.text);
    C.chk('IMP-9: the row whose Date could not be read is said to be in No date', /1 row has a Date that could not be read: it is in the No date column/.test(m.text), m.text);
    const m2 = await T.ui([['O&M Raw Data.csv', csv(om(2, 100))]]);
    C.chk('IMP-4 (control): a clean import is a plain success that names no refusal', /msg-ok/.test(m2.cls) && !/refused/.test(m2.text), J(m2));
    T.t.close();
  });

  // ===================================================================================================================
  // IMP-6 — a formula saved without its result; a blank Amount
  // ===================================================================================================================
  await block('IMP-6', async () => {
    const T = boot();
    const SP = T.SP;
    const H = ['FY', 'CCaR No', 'Title', 'Budget', 'Plan Event', 'Date', 'Amount', 'Alloc', 'PMO'];
    const base = ['2026', 'XX1', 'Invented Title', 'USAF O&M', 'PE', '2026-01-10'];
    const ab = xlsx('formulas.xlsx', { 'O&M Raw Data': sheetXml(H, [
      base.concat([{ xml: '<c r="@"><v>5000</v></c>' }, NA, 'Alpha Wing (AW)']),                          // row 2: a number
      base.concat([{ xml: '<c r="@"><f>2500000*2</f><v></v></c>' }, NA, 'Alpha Wing (AW)']),              // row 3: no result
      base.concat([{ xml: '<c r="@"><f>7+1</f><v/></c>' }, NA, 'Alpha Wing (AW)']),                       // row 4: no result
      base.concat([{ xml: '<c r="@"><f>1+2</f><v>3</v></c>' }, NA, 'Alpha Wing (AW)']),                   // row 5: a result
      base.concat(['', NA, { xml: '<c r="@" t="str"><f>"Alpha Wing (AW)"</f><v/></c>' }]),                // row 6: blank Amount
    ]) });
    const p = await T.parse([['formulas.xlsx', ab]]);
    const rows = p.pulls.om.rows;
    C.eq('IMP-6: a numeric formula saved without its result is unreadable, naming the formula, never $0',
      rows.map(r => [r.src[2], r.c[9], r.bad ? r.bad.join('; ') : null]),
      [[2, 500000, null], [3, null, 'Amount “=2500000*2” is not an amount'], [4, null, 'Amount “=7+1” is not an amount'], [5, 300, null], [6, 0, null]]);
    C.eq('IMP-6 (control): an empty text result, as Excel saves "" (v12’s formula columns), is blank', rows[4].c[18], '');
    C.eq('IMP-6: the sheet counts the cells', p.report.files[0].sheets[0].noResult, ['G3', 'G4']);
    const lines = SP.importReportLines(p.report);
    C.chk('IMP-6: the report says which cells hold a formula with no result', lines.some(l => l.includes('2 cells hold a formula saved without its result (G3, G4)')), J(lines.slice(0, 4)));
    C.chk('IMP-6: the report counts the blank Amount', lines.some(l => /^Conversions:.*1 blank amount read as \$0/.test(l)), J(lines.filter(l => /Conversions/.test(l))));
    T.t.close();
  });

  // ===================================================================================================================
  // IMP-7 — a saved plan taken into another copy; the tool's own export re-imported
  // ===================================================================================================================
  await block('IMP-7', async () => {
    const A = boot();
    await A.imp([['O&M Raw Data.csv', csv(om(3, 1000000).concat([{ ...ROW, 'CCaR No': 'XX9', Budget: 'Mystery Line', Amount: '50' }]))], ['Export.csv', csv([{ ...ROW, 'CCaR No': 'ZZ1', Budget: 'Mystery Line', Amount: '77' }])]]);
    await A.imp([['O&M Raw Data.csv', csv(om(3, 2000000))]]);
    A.SP.setSettings({ authorized: { 'om|2026': 123400 }, special: ['XX101'], budgets: { 'usaf o&m discretionary': { lane: 'mand' } } });
    const g = A.SP.state.settings.goals ? JSON.parse(J(A.SP.state.settings.goals)) : null;
    if (g && Array.isArray(g.om1)) { g.om1[3] = 0.777; A.SP.setSettings({ goals: g }); }
    const planHtml = A.SP.savedHtml();
    const want = JSON.parse(J(A.SP.state));
    // the export, re-imported: its four derived columns are the tool's own, not extras that grow every round
    const spec = A.SP.excelSpec(A.model(), A.SP.state.pulls.current, A.SP.state.settings, { report: A.SP.state.lastImport.report, today: '2026-11-09' });
    const xb = await A.SP.writeXlsx(spec);
    const r1 = await A.parse([['export.xlsx', xb.buffer.slice(xb.byteOffset, xb.byteOffset + xb.byteLength)]]);
    C.eq('IMP-7: a re-imported export keeps no Service/Lane/Status/Counted extras', r1.pulls.om.headers.slice(32), []);
    const used = r1.report.files[0].sheets.find(s => s.used);
    C.eq('IMP-7: they are named as the tool’s own columns, ignored', used && used.ownCols, ['Service', 'Lane', 'Status', 'Counted']);
    C.eq('IMP-7: the rows read back as the rows exported', r1.pulls.om.rows.map(r => r.c), A.SP.state.pulls.current.om.rows.map(r => r.c));
    const r1b = await A.parse([['status.csv', csv(om(1, 5), ['Status'])]]);
    C.eq('IMP-7 (control): one column named Status alone is someone’s data, and kept', r1b.pulls.om.headers.slice(32), ['Status']);
    // a fresh copy takes the saved plan whole
    const B = boot();
    const m = await B.ui([['plan.html', planHtml]]);
    C.chk('IMP-7: a fresh copy takes the saved plan, and says so', /^Took the plan/.test(m.text) && /msg-ok/.test(m.cls), J(m));
    const got = JSON.parse(J(B.SP.state));
    for (const k of ['settings', 'pulls', 'history', 'lastImport']) C.eq('IMP-7: the plan’s ' + k + ' arrive whole', got[k], want[k]);
    C.eq('IMP-7: Authorized, the special CCaRs and the override arrive', [(got.settings || {}).authorized, (got.settings || {}).special, (got.settings || {}).budgets], [{ 'om|2026': 123400 }, ['XX101'], { 'usaf o&m discretionary': { lane: 'mand' } }]);
    C.eq('IMP-7: the figures are the same in both copies', J(B.model().summary.total), J(A.model().summary.total));
    C.chk('IMP-7: the copy that took it has unsaved work (its own file does not have it yet)', B.SP.isDirty() === true);
    C.eq('IMP-7: (a fresh copy holding nothing is not asked)', B.asked, []);
    // a copy holding its own plan is asked; Cancel keeps it
    const D = boot();
    await D.imp([['O&M Raw Data.csv', csv(om(1, 5))]]);
    const dBefore = J(D.SP.state);
    D.answer(false);
    const r2 = await D.ui([['plan.html', planHtml]]);
    C.chk('IMP-7: a copy holding a plan is asked first, and Cancel takes nothing', D.asked.length === 1 && /msg-err/.test(r2.cls) && J(D.SP.state) === dBefore, J([D.asked, r2]));
    D.answer(true);
    await D.ui([['plan.html', planHtml]]);
    C.eq('IMP-7: OK replaces it with the plan', JSON.parse(J(D.SP.state)).pulls, want.pulls);
    // refusals: mixed with a pull, not a plan, a plan of another tool, an empty plan, and the plan given to the pull reader
    const m3 = await D.ui([['plan.html', planHtml], ['O&M Raw Data.csv', csv(om(1, 5))]]);
    C.chk('IMP-7: a plan with a pull is refused: a plan is taken on its own', /msg-err/.test(m3.cls) && /on its own/.test(m3.text), J(m3));
    const notPlan = '<!DOCTYPE html><html><head><title>x</title></head><body>hello</body></html>';
    const r4 = typeof D.SP.takePlan === 'function' ? D.SP.takePlan(notPlan, 'page.html') : { ok: true };
    C.chk('IMP-7: a page that is not a plan is refused, and says why', r4.ok === false && /not a SCOPE file/.test(r4.message), J(r4));
    const other = planHtml.replace(/"tool":"sfcb-spend-plan"/, '"tool":"someone-else"');
    const r5 = typeof D.SP.takePlan === 'function' ? D.SP.takePlan(other, 'other.html') : { ok: true };
    C.chk('IMP-7: a plan saved by another tool is refused', r5.ok === false && /another tool/.test(r5.message), J(r5));
    const e6 = await refusal(D.parse([['plan.html', planHtml]]));
    C.chk('IMP-7/IMP-10: handed to the pull reader, a plan is named as a plan, not a truncated workbook',
      !!e6 && /saved SCOPE plan, not a CCaR pull/.test(e6.message) && !/truncated/.test(e6.message), e6 && e6.message);
    A.t.close(); B.t.close(); D.t.close();
  });

  // ===================================================================================================================
  // IMP-8 — one stray byte in a UTF-8 CSV
  // ===================================================================================================================
  await block('IMP-8', async () => {
    const T = boot();
    const head = 'FY,CCaR No,Title,Budget,Plan Event,Date,Amount,Alloc,PMO\r\n';
    const body = '2026,C1,Wing – fairing’s study,USAF O&M,PE 1,2026-03-01,5,Not Allocated,AV\r\n2026,C2,Caf#,USAF O&M,PE 2,2026-03-01,7,Not Allocated,AV\r\n';
    const enc = new TextEncoder();
    const withStray = bom => {
      const t = enc.encode(head + body), at = t.indexOf(0x23);   // the '#' becomes one Windows-1252 byte, 0xE9
      const u = new Uint8Array(t); u[at] = 0xE9;
      return bom ? new Uint8Array([0xEF, 0xBB, 0xBF, ...u]).buffer : u.buffer;
    };
    for (const bom of [true, false]) {
      const w = bom ? 'with a byte-order mark' : 'without one';
      const e = await refusal(T.parse([['pull.csv', withStray(bom)]]));
      C.chk('IMP-8 (' + w + '): imported, not refused for a missing FY', !e, e && e.message);
      if (e) continue;
      const p = await T.parse([['pull.csv', withStray(bom)]]);
      C.eq('IMP-8 (' + w + '): the good UTF-8 reads as written; only the stray byte is U+FFFD', p.pulls.om.rows.map(r => r.c[3]), ['Wing – fairing’s study', 'Caf�']);
      C.chk('IMP-8 (' + w + '): the report says one byte was not UTF-8, and where', p.report.files[0].notes.some(n => /1 byte in it is not/.test(n) && /row 3/.test(n)), J(p.report.files[0].notes));
    }
    // control: a Windows-1252 file (Excel's plain CSV) is still read as Windows-1252
    const w1252 = enc.encode(head + '2026,C2,Caf#,USAF O&M,PE 2,2026-03-01,7,Not Allocated,AV\r\n');
    w1252[w1252.indexOf(0x23)] = 0xE9;
    const p2 = await T.parse([['old.csv', w1252.buffer]]);
    C.eq('IMP-8 (control): a Windows-1252 CSV reads é as é', p2.pulls.om.rows.map(r => r.c[3]), ['Café']);
    T.t.close();
  });

  // ===================================================================================================================
  // IMP-10 — a file with no zip directory, named for what it is
  // ===================================================================================================================
  await block('IMP-10', async () => {
    const T = boot();
    const SP = T.SP;
    const ole = new Uint8Array(512); ole.set([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);
    const cases = [
      ['an old .xls', ole.buffer, /Excel 97–2003 workbook \(\.xls\)/],
      ['a web page named .xls', new TextEncoder().encode('<html><body><table><tr><td>FY</td></tr></table></body></html>').buffer, /web page \(HTML\)/],
      ['a CSV named .xlsx', new TextEncoder().encode('FY,Amount\n2026,5\n').buffer, /plain text\. If it is a CSV export/],
    ];
    for (const [what, buf, re] of cases) {
      const e = await refusal(SP.readXlsx(buf));
      C.chk('IMP-10: ' + what + ' is named for what it is', !!e && re.test(e.message) && !/truncated/.test(e.message) && /not an \.xlsx workbook/.test(e.message), e && e.message);
    }
    const cut = new Uint8Array(100); cut.set([0x50, 0x4B, 0x03, 0x04]);
    const ec = await refusal(SP.readXlsx(cut.buffer));
    C.chk('IMP-10 (control): a zip cut short is still said to be cut short, and to be exported again',
      !!ec && /cut short|truncated/.test(ec.message) && /export it again/.test(ec.message), ec && ec.message);
    T.t.close();
  });

  // ===================================================================================================================
  // IMP-11 — the same pull imported again
  // ===================================================================================================================
  await block('IMP-11', async () => {
    const T = boot();
    const SP = T.SP;
    const a = ['O&M Raw Data.csv', csv(om(1, 1100))], b = ['O&M Raw Data.csv', csv(om(1, 2200))], c = ['O&M Raw Data.csv', csv(om(1, 3300))];
    await T.imp([a]); await T.imp([b]);
    const r = await T.imp([b]);
    C.eq('IMP-11: the same pull again keeps the pull What changed compares with', [SP.state.pulls.previous.om.rows[0].c[9], SP.state.pulls.current.om.rows[0].c[9]], [110000, 220000]);
    C.chk('IMP-11: and says so', /same as the one on screen/.test(r.message) && !/it replaces is kept/.test(r.message), r.message);
    const d = SP.diffPulls(SP.state.pulls.previous, SP.state.pulls.current, SP.state.settings);
    C.chk('IMP-11: What changed still shows the change from the earlier pull', J(d).includes('110000') && J(d).includes('220000'), J(d).slice(0, 300));
    await T.imp([c]);
    C.eq('IMP-11 (control): a different pull moves the current one to previous', SP.state.pulls.previous.om.rows[0].c[9], 220000);
    T.t.close();
  });

  // ===================================================================================================================
  // IMP-12 — an import that places no row
  // ===================================================================================================================
  await block('IMP-12', async () => {
    const T = boot();
    const SP = T.SP;
    await T.imp([['O&M Raw Data.csv', csv(om(1, 100))]]);
    SP.setSettings({ asOf: '2026-09' });
    const r = await T.imp([['stray.csv', csv([{ ...ROW, 'CCaR No': 'QQ1', Budget: 'Mystery Line', Amount: '5' }])]]);
    C.eq('IMP-12: Data through stays where the person set it', SP.state.settings.asOf, '2026-09');
    C.chk('IMP-12: and the message says it stays', /Data through stays Sep-2026/.test(r.message) && !/reset/.test(r.message), r.message);
    await T.imp([['O&M Raw Data.csv', csv(om(1, 200))]]);
    C.eq('IMP-12 (control): an import that brings a pull still resets it', SP.state.settings.asOf, '2026-10');
    T.t.close();
  });

  // ===================================================================================================================
  // IMP-13 — a row with values only in columns the tool does not read
  // ===================================================================================================================
  await block('IMP-13', async () => {
    const T = boot();
    const SP = T.SP;
    const rows = om(2, 100).concat([{ Notes: 'orphan note in an extra column only' }, {}]);
    const p = await T.parse([['O&M Raw Data.csv', csv(rows, ['Notes'])]]);
    C.eq('IMP-13: the two data rows are read; only the empty row is a blank row', [p.pulls.om.rows.length, p.report.rowsBlank], [2, 1]);
    C.eq('IMP-13: the row with only a note is listed with its text', (p.report.extraOnly || []).map(x => [x.row, x.values]), [[4, [['Notes', 'orphan note in an extra column only']]]]);
    C.chk('IMP-13: the report lines carry its text', SP.importReportLines(p.report).some(l => l.includes('row 4: Notes “orphan note in an extra column only”')));
    T.t.close();
  });

  // ===================================================================================================================
  // IMP-14 — a saved file whose last import report is the wrong shape
  // ===================================================================================================================
  await block('IMP-14', async () => {
    const A = boot();
    await A.imp([['O&M Raw Data.csv', csv(om(2, 100))]]);
    const good = JSON.parse(J(A.SP.state));
    A.t.close();
    const cases = [
      ['its files are text', s => { s.lastImport.report.files = 'abc'; }],
      ['it is a list', s => { s.lastImport.report = [1, 2]; }],
      ['a file’s notes are missing', s => { delete s.lastImport.report.files[0].notes; }],
    ];
    for (const [what, f] of cases) {
      const st = JSON.parse(J(good)); f(st);
      const T = boot(st);
      await settle();
      const msg = T.doc.getElementById('uiMsg').textContent;
      C.chk('IMP-14 (' + what + '): the plan is not opened half-drawn', !T.SP.state.pulls.current.om && /last import report/.test(msg), msg);
      T.t.close();
    }
    const T = boot(good);
    await settle();
    C.chk('IMP-14 (control): a sound report opens, and the report view draws it', !!T.SP.state.pulls.current.om && !/could not be drawn/.test(T.view('report')));
    T.t.close();
    // a report saved before this version has no extraOnly, strays or ownCols: still sound
    const old = JSON.parse(J(good)); delete old.lastImport.report.extraOnly; delete old.lastImport.report.strays;
    for (const fr of old.lastImport.report.files) for (const s of fr.sheets) { delete s.ownCols; delete s.noResult; delete s.extraOnly; }
    const O = boot(old);
    await settle();
    C.chk('IMP-14 (control): a report without this version’s fields opens and draws', !!O.SP.state.pulls.current.om && !/could not be drawn/.test(O.view('report')));
    O.t.close();
  });
} catch (e) {
  C.chk('the run stopped before the end: ' + String((e && e.stack) || e).split('\n').slice(0, 3).join(' | '), false);
} finally {
  tmp.rm();
}
C.done();
