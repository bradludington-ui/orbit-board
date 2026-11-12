// The .xlsx writer and the zip (CONTRACT §7): SP.writeXlsx, SP.zipFiles, SP.lastXlsxNotes.
//
// Every workbook the writer makes is read back by readers that are not the tool's: Python's zipfile, xml.etree (every part
// must be well-formed XML) and openpyxl (test/xw-read.py), then LibreOffice, which converts it to CSV and to .xlsx and must
// do so without an error. What each cell must read as is written beside the spec here, from the literal it was given.
// Every value is invented.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomBytes } from 'node:crypto';
import { loadTool, checks, scratchDir, pageHtml } from './harness.mjs';
import { CHROME } from '../../tools/chrome.mjs';
import { chromium } from 'playwright-core';

const HERE = dirname(fileURLToPath(import.meta.url));
const C = checks('xlsx-write');
const tmp = scratchDir('sfcbsp-xw-');
const t = loadTool({ modules: ['util', 'xlsx-write'] });
const SP = t.SP;

const py = (mode, path) => {
  const r = spawnSync('python3', ['-I', join(HERE, 'xw-read.py'), mode, path], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error('xw-read.py ' + mode + ' failed: ' + r.stderr.slice(-2000));
  return JSON.parse(r.stdout);
};
const save = (name, bytes) => { const p = join(tmp.dir, name); writeFileSync(p, Buffer.from(bytes.buffer, bytes.byteOffset, bytes.length)); return p; };
async function refusal(f) { try { await f(); return null; } catch (e) { return e; } }
// LibreOffice, with a profile of its own so a second soffice on this machine (another test) cannot collide with it
function soffice(args, out) {
  mkdirSync(out, { recursive: true });
  const prof = 'file://' + join(tmp.dir, 'lo-profile');
  return spawnSync('soffice', ['-env:UserInstallation=' + prof, '--headless', '--norestore', ...args, '--outdir', out],
    { encoding: 'utf8', timeout: 180000 });
}

// The CUI marking as the export writes it, so the header code path is the real one
const HDR = '&C&"Calibri,Bold"CUI//REL TO US DoW';
const FTR = '&C&"Calibri,Bold"CUI//REL TO US DoW&RPage &P of &N';

// ---------------------------------------------------------------------------------------------------------------
// THE FEATURE SPEC
// ---------------------------------------------------------------------------------------------------------------
const NAVY = '1F3A68';
const sTitle = { font: { b: true, sz: 16, color: 'FFFFFF', name: 'Calibri' }, fill: NAVY, align: { h: 'left', v: 'center' } };
const sHead = { font: { b: true, sz: 10 }, fill: 'FFE699', border: { t: ['medium', '404040'], b: ['medium', '404040'], l: ['medium', '404040'], r: ['medium', '404040'] }, align: { h: 'center', wrap: true } };
const sMoney = { fmt: '#,##0.00;(#,##0.00);-', border: { t: ['thin', '808080'], b: ['thin', '808080'], l: ['thin', '808080'], r: ['thin', '808080'] } };
const sPct = { fmt: '0.00%' };
const sDelta = { fmt: '+0.00%;-0.00%;0.00%' };
const sTitleRow = { font: { b: true, sz: 10 }, align: { indent: 2 } };            // indent with no horizontal: must become left
const sPe = { font: { sz: 10 }, align: { indent: 4, h: 'right' } };              // indent with its own horizontal: kept
const sCcar = { font: { sz: 9, i: true, color: '808080' }, align: { indent: 6, v: 'top' } };
const sArial = { font: { name: 'Arial', sz: 12 } };
const sDashed = { border: { b: ['dashed'], t: ['double', 'C00000'] } };            // a side with no colour, and a double

const features = {
  name: 'Features', tabColor: NAVY, grid: false, freeze: 'B3', outlineAbove: true,
  page: { orientation: 'landscape', paper: 'letter', fitWidth: 1, fitHeight: 0 },
  header: HDR, footer: FTR,
  cols: [{ w: 42 }, { w: 12.5 }, { w: 9, hidden: true }, null, { hidden: true }, { w: 0 }],
  rows: [
    { cells: [{ v: 'Spend Plan', s: sTitle }, { s: sTitle }, { s: sTitle }, { s: sTitle }], ht: 24 },
    { cells: [{ v: 'Label', s: sHead }, { v: 'Total', s: sHead }, { v: 'Hidden col', s: sHead }, { v: 'Pct', s: sHead }, { v: 'Delta', s: sHead }] },
    { cells: [{ v: 'Alpha office', s: { font: { b: true, sz: 11, color: NAVY } } }, { v: 1234.5, s: sMoney }, { v: 7 }, { v: 0.4567, s: sPct }, { v: -0.1503, s: sDelta }], level: 1 },
    { cells: [{ v: 'A title', s: sTitleRow }, { v: -98.765, s: sMoney }], level: 2 },
    { cells: [{ v: 'A plan event', s: sPe }, { v: 0, s: sMoney }], level: 3, hidden: true },
    { cells: [{ v: 'CCAR-0001', s: sCcar }, { v: 0.01, s: sMoney }], level: 4, hidden: true },
    { cells: [{ v: 'Another plan event', s: sPe }, { v: 5, s: sMoney }], level: 3, hidden: true },
    { cells: [{ v: 'Another title', s: sTitleRow }, { v: 3, s: sMoney }], level: 2 },
    null,                                                                   // a blank row in the middle
    { cells: [null, { v: 'arial', s: sArial }, { v: 'dashed', s: sDashed }] },
    { cells: [], ht: 30 },                                                   // a row with a height and nothing in it
    { cells: [{ v: 'Wrapped and merged across three columns, long enough to need wrapping', s: { align: { wrap: true, v: 'top' } } }] },
  ],
  merges: ['A1:D1', 'A12:C12', 'E1:E1'],                                      // E1:E1 merges nothing and is not written
};

// Sheet names Excel would refuse, and clashes
const nameCases = [
  ['Bad/Name:*?[x]\\', 'Bad_Name____x__'],
  ['A name that is far longer than thirty-one characters', 'A name that is far longer than '],
  ['Dup', 'Dup'], ['dup', 'dup (2)'], ['DUP', 'DUP (3)'],
  ['', 'Sheet' + 0],    // index filled in below
  ['History', 'History (2)'],
  ["'Quoted'", 'Quoted'],
  ['x'.repeat(31), 'x'.repeat(31)], ['X'.repeat(31), 'X'.repeat(27) + ' (2)'],
];

// Hostile text: every value must come back exactly, except the characters XML cannot carry, which come back as U+FFFD
const BAD = ['\u0001', '\u0008', '\u000B', '\u000C', '\u001F', '\uFFFE', '\uFFFF', '\uD800', '\uDC00'];
const hostile = [
  ['cr', 'carriage\rreturn', 'carriage\rreturn'],
  ['crlf', 'a\r\nb', 'a\r\nb'],
  ['lf', 'line\nfeed', 'line\nfeed'],
  ['tab', 'tab\there', 'tab\there'],
  ['cdata', 'end ]]> of cdata', 'end ]]> of cdata'],
  ['script', '<script>alert(1)</script>', '<script>alert(1)</script>'],
  ['img', '"><img src=x onerror=alert(1)>', '"><img src=x onerror=alert(1)>'],
  ['quotes', `<b>&"'`, `<b>&"'`],
  ['amps', 'O&M && R&D &amp; &lt;', 'O&M && R&D &amp; &lt;'],
  ['xesc', 'held _x0041_ literally', 'held _x0041_ literally'],
  ['spaces', '  leading and trailing  ', '  leading and trailing  '],
  ['double', 'two  spaces', 'two  spaces'],
  ['formula', '=1+1', '=1+1'],
  ['emoji', 'pair \uD83D\uDE00 kept', 'pair \uD83D\uDE00 kept'],
  ['nbsp', '\u00A0nbsp\u00A0', '\u00A0nbsp\u00A0'],
  ['controls', 'c' + BAD.join('c') + 'c', 'c' + BAD.map(() => '\uFFFD').join('c') + 'c'],
];
const longText = 'L'.repeat(40000);

// Dates as serials with a date format
const dates = [
  ['2026-10-01', 46296, '2026-10-01'],
  ['2024-02-29', null, '2024-02-29'],     // a leap day
  ['1900-03-01', 61, '1900-03-01'],
  ['1900-02-28', 59, '1900-02-28'],       // before Excel's phantom 29 Feb 1900: one lower than a day count
  ['1900-01-01', 1, '1900-01-01'],
];
const badDates = ['2026-02-30', '1899-12-31', 'next Tuesday'];

// Numbers at full precision
const nums = [
  [0.1 + 0.2, '0.3'], [1 / 3, '0.333333333333333'], [1234567.891, '1234567.891'], [-42, '-42'], [1e-7, '1e-7'],
  [123456789012, '123456789012'], [-0, '0'], [2 ** 53, '9007199254740992'],
];

function buildSpec() {
  const hostileRows = hostile.map(([k, v]) => ({ cells: [{ v: k }, { v }] }));
  hostileRows.push({ cells: [{ v: 'long' }, { v: longText }] });
  hostileRows.push({ cells: [{ v: 'nan' }, { v: NaN, s: sMoney }, { v: Infinity }, { v: -Infinity }] });
  hostileRows.push({ cells: [{ v: 'bool' }, { v: true }, { v: false }] });
  hostileRows.push({ cells: [{ v: 'empty string' }, { v: '' }, { v: '', s: sMoney }] });
  const dateRows = dates.map(([iso]) => ({ cells: [{ v: iso }, { v: { date: iso } }, { v: { date: iso }, s: { fmt: 'mmm-yyyy', font: { b: true } } }] }));
  badDates.forEach(d => dateRows.push({ cells: [{ v: 'bad ' + d }, { v: { date: d } }] }));
  dateRows.push({ cells: [{ v: 'blank date' }, { v: { date: '' } }, { v: { date: null }, s: sMoney }] });
  const numRows = nums.map(([n]) => ({ cells: [{ v: n }] }));
  // the style registry: 1,000 cells, each handed its own fresh object, describing 5 distinct looks
  const dedupe = [];
  for (let i = 0; i < 200; i++) {
    dedupe.push({ cells: [
      { v: i, s: { fmt: '#,##0.00;(#,##0.00);-', border: { t: ['thin', '808080'], b: ['thin', '808080'], l: ['thin', '808080'], r: ['thin', '808080'] } } },
      { v: 'x', s: { font: { b: true, sz: 11, color: '1f3a68' } } },      // lower-case hex: the same colour
      { v: 'y', s: { fill: 'F2F2F2' } },
      { v: 'z', s: { fill: '#F2F2F2' } },                                  // with a #: the same fill again
      { v: 0.5, s: { fmt: '0.00%' } },                                     // a built-in format: no numFmt written
      { v: 'w', s: { font: { b: true }, align: { indent: 3 } } },
    ] });
  }
  const spec = {
    creator: 'SFCB Spend Plan',
    sheets: [
      features,
      { name: 'Hostile <&>"\'s', rows: hostileRows, cols: [{ w: 12 }, { w: 60 }] },
      { name: 'Dates', rows: dateRows, freeze: 'A2' },
      { name: 'Numbers', rows: numRows, freeze: 'B1' },
      { name: 'Dedupe', rows: dedupe, header: '&LLeft&CCentre&RRight', footer: '&L&D&R&P' },
      { name: 'Summary below', rows: [
        { cells: [{ v: 'detail 1' }], level: 1, hidden: true },
        { cells: [{ v: 'detail 2' }], level: 1, hidden: true },
        { cells: [{ v: 'total' }] },
      ] },
      { name: 'Empty' },
      ...nameCases.map(([n]) => ({ name: n, rows: [{ cells: [{ v: 'named ' + n }] }] })),
      { name: 'Code _x0041_ sheet', header: '&Chdr _x0042_ end', outlineAbove: true, rows: [
        null,                                                          // a blank summary row above a hidden group
        { cells: [{ v: 'hidden detail' }], level: 1, hidden: true },
        { cells: [{ v: 'shown' }] },
      ] },
    ],
  };
  return spec;
}

try {
  // -------------------------------------------------------------------------------------------------------------
  C.eq('the tool booted with no script errors', t.errors, []);
  C.chk('the API is there', typeof SP.writeXlsx === 'function' && typeof SP.zipFiles === 'function' && 'lastXlsxNotes' in SP);

  const spec = buildSpec();
  const firstName = 7;   // index of the first name case in spec.sheets
  nameCases[5][1] = 'Sheet' + (firstName + 5 + 1);
  const bytes = await SP.writeXlsx(spec);
  const N = SP.lastXlsxNotes;
  C.chk('writeXlsx returns bytes', Object.prototype.toString.call(bytes) === '[object Uint8Array]' && bytes.length > 1000, String(bytes && bytes.length));
  const file = save('features.xlsx', bytes);
  const R = py('full', file);

  // ---- the package: every part well-formed, the zip sound, DEFLATE used --------------------------------------
  C.eq('the zip has no member whose CRC is wrong', R.crcBad, null);
  C.eq('every member can be read', R.parts.filter(p => p.readError).map(p => p.name + ': ' + p.readError), []);
  for (const p of R.parts) if ('wellFormed' in p) C.chk('part ' + p.name + ' is well-formed XML', p.wellFormed, p.error);
  C.chk('every XML part was checked (sheets, styles, strings, workbook, rels, props)', R.parts.filter(p => p.wellFormed).length === spec.sheets.length + 8, String(R.parts.length));
  C.chk('every member is deflated where it helps (CompressionStream exists here)', R.parts.every(p => p.method === 8 || p.method === 0) && R.parts.some(p => p.method === 8));
  C.chk('notes say the zip was deflated', N.deflated === true);
  C.chk('[Content_Types].xml is the first member', R.parts[0].name === '[Content_Types].xml');

  // ---- element order: the schema's, or Excel refuses the part --------------------------------------------------
  const SHEET_ORDER = ['sheetPr', 'dimension', 'sheetViews', 'sheetFormatPr', 'cols', 'sheetData', 'mergeCells', 'printOptions', 'pageMargins', 'pageSetup', 'headerFooter'];
  const inOrder = (got, order) => { let last = -1; for (const g of got) { const i = order.indexOf(g); if (i < 0 || i <= last) return false; last = i; } return true; };
  R.parts.filter(p => /^xl\/worksheets\/sheet\d+\.xml$/.test(p.name)).forEach(p =>
    C.chk('sheet part ' + p.name + ' keeps the schema order', inOrder(p.children, SHEET_ORDER), p.children.join(',')));
  const f1 = R.parts.find(p => p.name === 'xl/worksheets/sheet1.xml');
  C.eq('the feature sheet has every element, in order', f1.children, ['sheetPr', 'dimension', 'sheetViews', 'sheetFormatPr', 'cols', 'sheetData', 'mergeCells', 'pageMargins', 'pageSetup', 'headerFooter']);
  C.eq('sheetPr children in order: tabColor, outlinePr, pageSetUpPr', R.raw[0].sheetPr.map(x => x[0]), ['tabColor', 'outlinePr', 'pageSetUpPr']);
  C.eq('styles.xml keeps the schema order', R.styles.order, ['numFmts', 'fonts', 'fills', 'borders', 'cellStyleXfs', 'cellXfs', 'cellStyles']);
  const wbPart = R.parts.find(p => p.name === 'xl/workbook.xml');
  C.eq('workbook.xml keeps the schema order', wbPart.children, ['workbookPr', 'bookViews', 'sheets']);

  // ---- the feature sheet through openpyxl ---------------------------------------------------------------------
  const F = R.sheets[0], FR = R.raw[0];
  C.eq('sheet name', F.title, 'Features');
  C.eq('tab colour', F.tab, 'FF1F3A68');
  C.eq('gridlines off', F.grid, false);
  C.eq('freeze panes at B3', F.freeze, 'B3');
  C.eq('summary rows above their detail (summaryBelow off)', F.summaryBelow, false);
  C.eq('fit to page set', F.fitToPage, true);
  C.eq('page: landscape, letter (1), one page wide, as tall as it takes', F.page, { orientation: 'landscape', paperSize: 1, fitToWidth: 1, fitToHeight: 0 });
  C.eq('header text, as written', FR.headerFooter.oddHeader, HDR);
  C.eq('footer text, as written', FR.headerFooter.oddFooter, FTR);
  C.eq('header through openpyxl: centre text', F.header.center, 'CUI//REL TO US DoW');
  C.eq('header through openpyxl: its font', F.headerFont.center, 'Calibri,Bold');
  C.eq('footer through openpyxl: right part', F.footer.right, 'Page &P of &N');
  C.eq('merges: the single-cell one is not written', F.merges, ['A12:C12', 'A1:D1']);
  C.eq('mergeCells count matches what is written', FR.mergeCount, '2');
  C.eq('column A width', F.cols.A && F.cols.A.width, 42);
  C.eq('column B width', F.cols.B && F.cols.B.width, 12.5);
  C.eq('column C hidden with its width', F.cols.C && [F.cols.C.hidden, F.cols.C.width], [true, 9]);
  C.eq('column E hidden with no width of its own', F.cols.E && F.cols.E.hidden, true);
  C.eq('the cols as written: only the columns with something to say', FR.cols, [
    { min: '1', max: '1', width: '42', customWidth: '1' }, { min: '2', max: '2', width: '12.5', customWidth: '1' },
    { min: '3', max: '3', width: '9', customWidth: '1', hidden: '1' }, { min: '5', max: '5', width: '9.140625', hidden: '1' },
    { min: '6', max: '6', width: '0', customWidth: '1' }]);
  C.eq('column F zero wide', F.cols.F && F.cols.F.width, 0);
  C.chk('column D (null) keeps the default', !F.cols.D || (!F.cols.D.hidden && !F.cols.D.customWidth), JSON.stringify(F.cols.D));
  C.eq('row 1 height', F.rows['1'] && F.rows['1'].ht, 24);
  C.eq('row 11 height, with nothing in it', F.rows['11'] && F.rows['11'].ht, 30);
  const lv = r => F.rows[String(r)] ? [F.rows[String(r)].outline, F.rows[String(r)].hidden] : [0, false];
  C.eq('outline levels and hidden rows, rows 3-8', [3, 4, 5, 6, 7, 8].map(lv), [[1, false], [2, false], [3, true], [4, true], [3, true], [2, false]]);
  C.eq('outlineLevelRow is the deepest level used', FR.formatPr.outlineLevelRow, '4');
  C.eq('collapsed on a summary row above hidden detail (rows 4 and 5), and nowhere else', Object.keys(FR.rows).filter(r => FR.rows[r].collapsed === '1'), ['4', '5']);
  const S6 = R.raw[5];
  C.eq('summary below: collapsed goes on the row after the hidden detail', Object.keys(S6.rows).filter(r => S6.rows[r].collapsed === '1'), ['3']);
  C.eq('summary below: no outlinePr written', S6.sheetPr, []);
  const SX = R.raw[R.raw.length - 1];
  C.eq('a blank summary row above a hidden group is still written, to carry collapsed', SX.rows['1'], { collapsed: '1' });
  C.eq('the escape in a header, as written', SX.headerFooter.oddHeader, '&Chdr _x005F_x0042_ end');
  C.chk('summary below: openpyxl reads summaryBelow as the default (not off)', R.sheets[5].summaryBelow !== false, String(R.sheets[5].summaryBelow));

  const cell = r => F.cells[r] || {};
  C.eq('title: value', cell('A1').v, 'Spend Plan');
  C.eq('title: font', cell('A1').font, { b: true, i: false, sz: 16, color: 'FFFFFFFF', name: 'Calibri' });
  C.eq('title: fill', cell('A1').fill, 'FF1F3A68');
  C.eq('title: alignment', [cell('A1').align.h, cell('A1').align.v], ['left', 'center']);
  // openpyxl replaces the cells a merge covers with bare MergedCells, so this is read from the part itself
  C.chk('a merged-over cell is written with the band\'s style and no value', FR.cells.D1 && FR.cells.D1[1] === FR.cells.A1[1] && FR.cells.D1[2] === null && FR.cells.A1[1] !== null, JSON.stringify([FR.cells.A1, FR.cells.D1]));
  C.eq('header row: fill and medium 404040 box', [cell('A2').fill, cell('A2').border], ['FFFFE699', { l: ['medium', 'FF404040'], r: ['medium', 'FF404040'], t: ['medium', 'FF404040'], b: ['medium', 'FF404040'] }]);
  C.eq('header row: centre and wrap', [cell('B2').align.h, cell('B2').align.wrap], ['center', true]);
  C.eq('money: value and format', [cell('B3').v, cell('B3').fmt], [1234.5, '#,##0.00;(#,##0.00);-']);
  C.eq('money: thin 808080 grid', cell('B3').border, { l: ['thin', 'FF808080'], r: ['thin', 'FF808080'], t: ['thin', 'FF808080'], b: ['thin', 'FF808080'] });
  C.eq('a negative money figure', cell('B4').v, -98.765);
  C.eq('percent: value and format', [cell('D3').v, cell('D3').fmt], [0.4567, '0.00%']);
  C.eq('delta: value and format', [cell('E3').v, cell('E3').fmt], [-0.1503, '+0.00%;-0.00%;0.00%']);
  C.eq('PMO line: bold navy 11', cell('A3').font, { b: true, i: false, sz: 11, color: 'FF1F3A68', name: 'Calibri' });
  C.eq('an indent with no horizontal alignment is written with left', [cell('A4').align.h, cell('A4').align.indent], ['left', 2]);
  C.eq('an indent keeps a horizontal alignment given with it', [cell('A5').align.h, cell('A5').align.indent], ['right', 4]);
  C.eq('CCaR line: 9 pt italic grey, indent 6, top', [cell('A6').font, cell('A6').align.indent, cell('A6').align.v, cell('A6').align.h],
    [{ b: false, i: true, sz: 9, color: 'FF808080', name: 'Calibri' }, 6, 'top', 'left']);
  C.eq('a font name other than Calibri', [cell('B10').font.name, cell('B10').font.sz], ['Arial', 12]);
  C.eq('a dashed side with no colour, and a double in C00000', [cell('C10').border.b, cell('C10').border.t, cell('C10').border.l], [['dashed', null], ['double', 'FFC00000'], null]);
  C.eq('wrap and top', [cell('A12').align.wrap, cell('A12').align.v], [true, 'top']);
  C.eq('an unstyled number is General', [cell('C3').v, cell('C3').fmt], [7, 'General']);

  // ---- sheet names --------------------------------------------------------------------------------------------
  // openpyxl does not undo OOXML's _x005F_ escape in a sheet name, so it reads the escaped form; LibreOffice reads it back as
  // written (checked below), which is the reading Excel gives
  const wantNames = ['Features', 'Hostile <&>"\'s', 'Dates', 'Numbers', 'Dedupe', 'Summary below', 'Empty', ...nameCases.map(x => x[1]), 'Code _x005F_x0041_ sheet'];
  C.eq('sheet names made legal and unique, through openpyxl', R.sheets.map(s => s.title), wantNames);
  C.eq('sheet names in workbook.xml', R.sheetNamesXml, wantNames);
  C.chk('every name at most 31 characters, none with []:*?/\\, none blank, unique ignoring case',
    R.sheetNamesXml.every(n => n.length <= 31 && n.trim() && !/[[\]:*?/\\]/.test(n) && !/^'|'$/.test(n))
    && new Set(R.sheetNamesXml.map(n => n.toLowerCase())).size === R.sheetNamesXml.length);
  C.eq('every renamed sheet is noted, from and to (an escape is not a renaming)', N.renamed, nameCases.filter(([a, b]) => a !== b).map(([a, b]) => ({ from: a, to: b })));
  C.chk('each renaming is said in a message', N.renamed.every(r => N.messages.some(m => m.includes('“' + r.from + '”') && m.includes('“' + r.to + '”'))));
  nameCases.forEach(([n, want], i) => C.eq('the sheet first named "' + n + '" holds its own cell', R.sheets[firstName + i].cells.A1 && R.sheets[firstName + i].cells.A1.v, 'named ' + n));

  // ---- hostile text --------------------------------------------------------------------------------------------
  const H = R.sheets[1];
  // openpyxl undoes OOXML's _x005F_ by deleting every "x005F_" it finds, so it reads the escaped text correctly here.
  hostile.forEach(([k, , want], i) => C.eq('hostile text "' + k + '" round-trips through openpyxl', H.cells['B' + (i + 1)] && H.cells['B' + (i + 1)].v, want));
  C.eq('the formula-looking text is text, not a formula', H.cells['B13'] && [H.cells['B13'].type, H.cells['B13'].v], ['s', '=1+1']);
  C.eq('every character XML cannot carry was counted', N.replaced, BAD.length);
  C.chk('and said so', N.messages.some(m => m.startsWith(BAD.length + ' characters a workbook cannot hold')), N.messages.join(' | '));
  const longRow = hostile.length + 1;
  C.eq('a text over 32,767 characters is cut there', H.cells['B' + longRow] && H.cells['B' + longRow].v.length, 32767);
  C.eq('and the cut is noted with its cell', N.cut, { count: 1, at: ['Hostile <&>"\'s!B' + longRow] });
  C.eq('NaN and the infinities are left empty and noted', N.nonFinite, { count: 3, at: ['Hostile <&>"\'s!B' + (longRow + 1), 'Hostile <&>"\'s!C' + (longRow + 1), 'Hostile <&>"\'s!D' + (longRow + 1)] });
  C.eq('a non-finite cell keeps its style and holds nothing', H.cells['B' + (longRow + 1)] && [H.cells['B' + (longRow + 1)].v, H.cells['B' + (longRow + 1)].fmt], [null, '#,##0.00;(#,##0.00);-']);
  C.eq('booleans', H.cells['B' + (longRow + 2)] && [H.cells['B' + (longRow + 2)].v, H.cells['C' + (longRow + 2)].v, H.cells['B' + (longRow + 2)].type], [true, false, 'b']);
  C.eq('an empty string is an empty cell; with a style, a styled empty cell', [H.cells['B' + (longRow + 3)], H.cells['C' + (longRow + 3)] && H.cells['C' + (longRow + 3)].v], [undefined, null]);
  C.chk('the CR is written as &#13; in the shared strings', (() => {
    const r = spawnSync('python3', ['-I', '-c', 'import zipfile,sys; print(zipfile.ZipFile(sys.argv[1]).read("xl/sharedStrings.xml").decode())', file], { encoding: 'utf8' });
    return r.stdout.includes('carriage&#13;return') && !r.stdout.includes('carriage\rreturn') && r.stdout.includes('_x005F_x0041_') && r.stdout.includes('end ]]&gt; of cdata');
  })());
  C.eq('shared strings: count and uniqueCount agree with what is written', [R.sharedStrings.uniqueCount, String(R.sharedStrings.n)], [String(R.sharedStrings.n), R.sharedStrings.uniqueCount]);

  // ---- dates ---------------------------------------------------------------------------------------------------
  const D = R.sheets[2], DR = R.raw[2];
  dates.forEach(([iso, serial], i) => {
    const r = i + 1;
    C.eq('date ' + iso + ' through openpyxl', D.cells['B' + r] && D.cells['B' + r].v, { date: iso, time: '00:00:00' });
    C.eq('date ' + iso + ' has the default format', D.cells['B' + r] && D.cells['B' + r].fmt, 'yyyy-mm-dd');
    C.eq('date ' + iso + ' with its own format keeps it', D.cells['C' + r] && [D.cells['C' + r].fmt, D.cells['C' + r].font.b], ['mmm-yyyy', true]);
    C.chk('date ' + iso + ' is a number cell (no t)', DR.cells['B' + r] && DR.cells['B' + r][0] === null, JSON.stringify(DR.cells['B' + r]));
    if (serial !== null) C.eq('date ' + iso + ' is serial ' + serial, DR.cells['B' + r] && DR.cells['B' + r][2], String(serial));
  });
  badDates.forEach((d, i) => C.eq('a date that is not one ("' + d + '") is kept as its text', D.cells['B' + (dates.length + 1 + i)] && D.cells['B' + (dates.length + 1 + i)].v, d));
  C.eq('and each is noted', N.badDates.count, badDates.length);
  const br = dates.length + badDates.length + 1;
  C.eq('a blank date is an empty cell; with a style, a styled empty cell', [D.cells['B' + br], D.cells['C' + br] && D.cells['C' + br].fmt], [undefined, '#,##0.00;(#,##0.00);-']);
  C.eq('freeze A2 on the dates sheet', D.freeze, 'A2');

  // ---- numbers --------------------------------------------------------------------------------------------------
  const NR = R.raw[3];
  nums.forEach(([n, txt], i) => C.eq('number ' + n + ' is written as ' + txt, NR.cells['A' + (i + 1)] && NR.cells['A' + (i + 1)][2], txt));
  C.eq('number cells read back by openpyxl', nums.map((x, i) => R.sheets[3].cells['A' + (i + 1)].v), [0.3, 0.333333333333333, 1234567.891, -42, 1e-7, 123456789012, 0, 2 ** 53]);
  C.eq('freeze B1 (columns only)', R.sheets[3].freeze, 'B1');

  // ---- the style registry --------------------------------------------------------------------------------------
  const ST = R.styles;
  for (const k of ['numFmts', 'fonts', 'fills', 'borders', 'cellXfs'])
    C.chk('styles.xml ' + k + ': every entry distinct, and count says how many', ST[k].n === ST[k].distinct && String(ST[k].n) === ST[k].count, JSON.stringify(ST[k]));
  const DD = R.sheets[4];
  const dxf = c => R.raw[4].cells[c][1];
  C.eq('1,200 fresh-but-equal style objects in 6 columns make 5 cell formats (two columns look alike)', new Set(['A', 'B', 'C', 'D', 'E', 'F'].flatMap(c => Array.from({ length: 200 }, (_, i) => dxf(c + (i + 1))))).size, 5);
  C.eq('lower-case hex and # are the same colour', [DD.cells.B7.font.color, DD.cells.C7.fill, DD.cells.D7.fill], ['FF1F3A68', 'FFF2F2F2', 'FFF2F2F2']);
  C.chk('a built-in format (0.00%) is used by its id, not declared again', !ST.numFmtCodes.includes('0.00%') && ST.xfs.some(x => x.numFmtId === '10'), JSON.stringify(ST.numFmtCodes));
  C.eq('the custom formats, each declared once', ST.numFmtCodes.slice().sort(), ['#,##0.00;(#,##0.00);-', '+0.00%;-0.00%;0.00%', 'mmm-yyyy', 'yyyy-mm-dd'].sort());
  C.eq('Excel needs fills 0 and 1 to be none and gray125', ST.fills.n >= 2, true);
  C.eq('header and footer on another sheet', [R.raw[4].headerFooter.oddHeader, R.raw[4].headerFooter.oddFooter], ['&LLeft&CCentre&RRight', '&L&D&R&P']);
  C.eq('a sheet with no page set has no pageSetup', R.raw[4].pageSetup, null);
  C.eq('the empty sheet is there and holds nothing', [R.sheets[6].title, Object.keys(R.sheets[6].cells).length], ['Empty', 0]);

  // ---- LibreOffice: it converts to CSV and to xlsx with no error ---------------------------------------------------
  const lo = join(tmp.dir, 'lo');
  const csvOut = soffice(['--convert-to', 'csv:Text - txt - csv (StarCalc):44,34,76,1,,0,false,true,true,false,false,-1', file], lo);
  const csvFiles = existsSync(lo) ? readdirSync(lo).filter(f => f.endsWith('.csv')) : [];
  C.chk('LibreOffice converted every sheet to CSV', csvOut.status === 0 && csvFiles.length === spec.sheets.length, 'status ' + csvOut.status + ' ' + (csvOut.stderr || '').slice(-400) + ' files ' + csvFiles.length);
  C.chk('LibreOffice said nothing went wrong', !/\bError\b/.test((csvOut.stdout || '') + (csvOut.stderr || '')), (csvOut.stdout || '') + (csvOut.stderr || ''));
  const CSV = py('csv', lo);
  const hostileCsv = Object.keys(CSV).find(k => k.includes('Hostile'));
  if (C.chk('the hostile sheet came out of LibreOffice', !!hostileCsv, Object.keys(CSV).join(', '))) {
    const rows = CSV[hostileCsv];
    // LibreOffice reads _x005F_ itself and keeps a CR; this is the check that the escapes mean the same to another program
    // LibreOffice keeps a lone CR but makes CR LF one line break (its own reading: the part holds "a&#13;\nb", checked above
    // through openpyxl), so that one value is compared as LibreOffice shows it
    hostile.forEach(([k, , want], i) => C.eq('hostile text "' + k + '" round-trips through LibreOffice', rows[i] && rows[i][1], k === 'crlf' ? 'a\nb' : want));
    C.eq('the long text through LibreOffice', rows[hostile.length] && rows[hostile.length][1].length, 32767);
  }
  const datesCsv = Object.keys(CSV).find(k => k.includes('Dates'));
  if (C.chk('the dates sheet came out of LibreOffice', !!datesCsv)) {
    // LibreOffice counts from 30 Dec 1899 without Excel's phantom leap day, so only dates from 1 March 1900 agree
    dates.filter(([iso]) => iso >= '1900-03-01').forEach(([iso]) => {
      const i = dates.findIndex(d => d[0] === iso);
      C.eq('date ' + iso + ' through LibreOffice', CSV[datesCsv][i] && CSV[datesCsv][i][1], iso);
    });
  }
  const featCsv = Object.keys(CSV).find(k => k.includes('Features'));
  if (C.chk('the feature sheet came out of LibreOffice', !!featCsv))
    C.eq('LibreOffice reads the money cell, shown in its format', CSV[featCsv][2] && CSV[featCsv][2][1], '1,234.50');
  const xo = join(tmp.dir, 'lo-xlsx');
  const xlsxOut = soffice(['--convert-to', 'xlsx', file], xo);
  const conv = join(xo, 'features.xlsx');
  C.chk('LibreOffice converted it to xlsx', xlsxOut.status === 0 && existsSync(conv), 'status ' + xlsxOut.status + ' ' + (xlsxOut.stderr || '').slice(-400));
  if (existsSync(conv)) {
    const L = py('full', conv);
    C.eq('LibreOffice kept every sheet, by name', L.sheets.map(s => s.title), wantNames);
    const LF = L.sheets[0];
    C.eq('LibreOffice kept the merges', LF.merges, ['A12:C12', 'A1:D1']);
    C.chk('LibreOffice reads the escaped sheet name as given (its CSV is named for it)', csvFiles.some(f => f.includes('Code _x0041_ sheet')), csvFiles.join(', '));
    C.eq('LibreOffice reads the escaped header as given, and writes it back escaped', L.raw[L.raw.length - 1].headerFooter && L.raw[L.raw.length - 1].headerFooter.oddHeader, '&Chdr _x005F_x0042_ end');
    C.eq('LibreOffice kept the outline levels and hidden rows', [3, 4, 5, 6, 7, 8].map(r => LF.rows[String(r)] ? [LF.rows[String(r)].outline, LF.rows[String(r)].hidden] : [0, false]),
      [[1, false], [2, false], [3, true], [4, true], [3, true], [2, false]]);
    C.eq('LibreOffice kept the hidden columns', [LF.cols.C && LF.cols.C.hidden, LF.cols.E && LF.cols.E.hidden], [true, true]);
    C.eq('LibreOffice kept the freeze', LF.freeze, 'B3');
    C.eq('LibreOffice kept the indent', LF.cells.A4 && [LF.cells.A4.align.h, LF.cells.A4.align.indent], ['left', 2]);
    C.eq('LibreOffice kept the header', L.raw[0].headerFooter && L.raw[0].headerFooter.oddHeader && L.raw[0].headerFooter.oddHeader.includes('CUI//REL TO US DoW'), true);
    C.eq('LibreOffice kept landscape', LF.page.orientation, 'landscape');
  }

  // ---- spec mistakes are refused, loudly, naming them ---------------------------------------------------------------
  const one = s => ({ sheets: [Object.assign({ name: 'S', rows: [{ cells: [{ v: 1 }] }] }, s)] });
  const mistakes = [
    ['a misspelt font key', one({ rows: [{ cells: [{ v: 1, s: { font: { bold: true } } }] }] }), '"bold"'],
    ['a misspelt style key', one({ rows: [{ cells: [{ v: 1, s: { colour: 'FF0000' } }] }] }), '"colour"'],
    ['a misspelt cell key', one({ rows: [{ cells: [{ value: 1 }] }] }), '"value"'],
    ['a misspelt row key', one({ rows: [{ cells: [], height: 3 }] }), '"height"'],
    ['a misspelt sheet key', one({ freezePane: 'A2' }), '"freezePane"'],
    ['a colour that is not RRGGBB', one({ tabColor: 'navy' }), 'navy'],
    ['an outline level of 8', one({ rows: [{ cells: [], level: 8 }] }), 'level'],
    ['overlapping merges', one({ merges: ['A1:C1', 'B1:D2'] }), 'overlaps'],
    ['a freeze that is not a cell', one({ freeze: 'row 5' }), 'row 5'],
    ['a border style Excel does not know', one({ rows: [{ cells: [{ v: 1, s: { border: { t: ['heavy'] } } }] }] }), 'heavy'],
    ['an alignment Excel does not know', one({ rows: [{ cells: [{ v: 1, s: { align: { h: 'middle' } } }] }] }), 'middle'],
    ['a header longer than Excel allows', one({ header: 'x'.repeat(256) }), '255'],
    ['a paper size the writer does not know', one({ page: { paper: 'quarto' } }), 'quarto'],
    ['a value that is an object', one({ rows: [{ cells: [{ v: { amount: 1 } }] }] }), 'value must be'],
    ['a bare value where a cell belongs', one({ rows: [{ cells: [5] }] }), '{v, s}'],
    ['no sheets', { sheets: [] }, 'no sheets'],
  ];
  for (const [what, sp, says] of mistakes) {
    const e = await refusal(() => SP.writeXlsx(sp));
    C.chk('refused: ' + what, e && String(e.message).includes(says), e ? e.message : 'not refused');
  }

  // ---- 50,000 rows in under 3 seconds --------------------------------------------------------------------------------
  {
    const money = { fmt: '#,##0.00' }, dt = { fmt: 'yyyy-mm-dd' };
    const head = { cells: Array.from({ length: 36 }, (_, j) => ({ v: 'Column ' + j, s: { font: { b: true } } })) };
    const rows = [head];
    for (let i = 0; i < 50000; i++) {
      const cells = [];
      cells.push({ v: 2025 + (i % 3) }, { v: { date: '2026-' + String(1 + (i % 12)).padStart(2, '0') + '-01' }, s: dt });
      cells.push({ v: 'CCAR-' + (i % 900) }, { v: 'Title ' + (i % 250) + ' & sons <b>' }, { v: 'Budget line ' + (i % 40) });
      for (let j = 5; j < 32; j++) cells.push(j % 4 === 0 ? { v: (i * 37 + j) / 100, s: money } : { v: 'text ' + ((i + j) % 500) });
      cells.push({ v: 'USAF' }, { v: 'disc' }, { v: 'exec' }, { v: 'Yes' });
      rows.push({ cells, level: i % 5 === 0 ? 0 : 1, hidden: i % 7 === 0 });
    }
    // Every one of the 36 columns filled on every row: a real CCaR pull fills 17 to 25 of its 32, so this is the worst
    // case. The machine is shared with other tests, so a second attempt is allowed before the time counts as a failure;
    // both times are printed.
    const times = [];
    let big;
    for (let k = 0; k < 2; k++) {
      const t0 = performance.now();
      big = await SP.writeXlsx({ sheets: [{ name: 'Raw', freeze: 'A2', rows, cols: Array.from({ length: 36 }, () => ({ w: 14 })) }] });
      times.push(Math.round(performance.now() - t0));
      if (times[k] < 3000) break;
    }
    C.chk('a 50,000-row, 36-column sheet writes in under 3 s', Math.min(...times) < 3000, times.join(' ms, ') + ' ms');
    console.log('  (50,000 rows x 36 columns: ' + times.join(' ms, then ') + ' ms; ' + (big.length / 1e6).toFixed(1) + ' MB)');
    const BL = py('light', save('big.xlsx', big));
    C.eq('the big workbook: zip sound', BL.crcBad, null);
    C.chk('the big workbook: every part well-formed', BL.parts.filter(p => 'wellFormed' in p).every(p => p.wellFormed));
    C.eq('the big workbook: every row and cell is there', [BL.sheets[0].rows, BL.sheets[0].cells, BL.sheets[0].last], [50001, 50001 * 36, 'AJ50001']);
  }

  // ---- zipFiles --------------------------------------------------------------------------------------------------------
  {
    const rnd = new Uint8Array(randomBytes(70000));   // truly random, so deflate cannot shrink it and it must be stored
    const text = new TextEncoder().encode('repeated text '.repeat(5000));
    const members = [
      { name: 'O&M FY2026.png', data: rnd },
      { name: 'Initial Spares FY2025.png', data: text },
      { name: 'empty.png', data: new Uint8Array(0) },
      { name: 'Café é.png', data: new Uint8Array([1, 2, 3]) },
      { name: 'sub/folder/deep.bin', data: rnd.slice(0, 1000).buffer },               // an ArrayBuffer
      { name: 'as a blob.bin', data: new Blob([new Uint8Array([9, 8, 7, 6])]) },     // a Blob
    ];
    const sha = b => createHash('sha256').update(Buffer.from(b.buffer ? new Uint8Array(b.buffer, b.byteOffset, b.byteLength) : b)).digest('hex');
    const want = [rnd, text, new Uint8Array(0), new Uint8Array([1, 2, 3]), rnd.slice(0, 1000), new Uint8Array([9, 8, 7, 6])].map(sha);
    const z = await SP.zipFiles(members);
    const Z = py('zip', save('pictures.zip', z));
    C.eq('zipFiles: every CRC right', Z.crcBad, null);
    C.eq('zipFiles: every member, in order, by name', Z.members.map(m => m.name), members.map(m => m.name));
    C.eq('zipFiles: every member\'s bytes match', Z.members.map(m => m.sha256), want);
    C.eq('zipFiles: the compressible member is deflated, random bytes and the empty one stored', Z.members.map(m => m.method), [0, 8, 0, 0, 0, 0]);
    C.chk('zipFiles: a non-ASCII name is flagged UTF-8', (Z.members[3].flag & 0x800) !== 0 && (Z.members[0].flag & 0x800) === 0);
    for (const [what, files, says] of [
      ['a name that climbs out of its folder', [{ name: '../evil.png', data: rnd }], 'safely'],
      ['an absolute name', [{ name: '/etc/x', data: rnd }], 'safely'],
      ['a backslash', [{ name: 'a\\b.png', data: rnd }], 'safely'],
      ['two files under one name', [{ name: 'A.png', data: rnd }, { name: 'a.png', data: rnd }], 'two files'],
      ['a file with no bytes', [{ name: 'x.png', data: 'not bytes' }], 'no bytes'],
      ['a blank name', [{ name: '', data: rnd }], 'safely'],
    ]) {
      const e = await refusal(() => SP.zipFiles(files));
      C.chk('zipFiles refuses ' + what, e && e.message.includes(says), e ? e.message : 'not refused');
    }
  }

  // ---- with no CompressionStream: stored, and it still opens ---------------------------------------------------------
  {
    const t2 = loadTool({ modules: ['util', 'xlsx-write'] });
    delete t2.window.CompressionStream;
    C.chk('the window really has no CompressionStream now', typeof t2.window.CompressionStream === 'undefined' && t2.ev('typeof CompressionStream') === 'undefined');
    const b = await t2.SP.writeXlsx(buildSpec());
    C.eq('notes say the zip was stored', t2.SP.lastXlsxNotes.deflated, false);
    const R2 = py('full', save('stored.xlsx', b));
    C.chk('every member is stored', R2.parts.every(p => p.method === 0), R2.parts.map(p => p.method).join(','));
    C.eq('the stored workbook: zip sound', R2.crcBad, null);
    C.chk('the stored workbook: every part well-formed', R2.parts.filter(p => 'wellFormed' in p).every(p => p.wellFormed));
    C.eq('the stored workbook reads the same as the deflated one', JSON.stringify(R2.sheets), JSON.stringify(R.sheets));
    const zz = await t2.SP.zipFiles([{ name: 'a.txt', data: new TextEncoder().encode('aaaa'.repeat(1000)) }]);
    const Z2 = py('zip', save('stored.zip', zz));
    C.eq('zipFiles with no CompressionStream: stored and sound', [Z2.members[0].method, Z2.crcBad, Z2.members[0].size], [0, null, 4000]);
    const lo2 = join(tmp.dir, 'lo-stored');
    const r = soffice(['--convert-to', 'csv', save('stored2.xlsx', b)], lo2);
    C.chk('LibreOffice opens the stored workbook', r.status === 0 && existsSync(join(lo2, 'stored2.csv')), (r.stderr || '').slice(-300));
    t2.close();
  }

  // ---- a CompressionStream that cannot do deflate-raw is the same as none -----------------------------------------------
  {
    const t3 = loadTool({ modules: ['util', 'xlsx-write'] });
    t3.window.CompressionStream = function (fmt) { if (fmt === 'deflate-raw') throw new TypeError('unsupported'); };
    const b = await t3.SP.writeXlsx({ sheets: [{ name: 'S', rows: [{ cells: [{ v: 'x'.repeat(5000) }] }] }] });
    const R3 = py('light', save('old-browser.xlsx', b));
    C.chk('a browser without deflate-raw stores the members and the file opens', R3.parts.every(p => p.method === 0) && R3.crcBad === null && R3.parts.filter(p => 'wellFormed' in p).every(p => p.wellFormed));
    t3.close();
  }

  // ---- in Chromium: the browser's own CompressionStream, and the time where Brad will run it -----------------------------
  {
    const page = join(tmp.dir, 'page.html');
    writeFileSync(page, pageHtml({ modules: ['util', 'xlsx-write'] }));
    const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
    try {
      const pg = await browser.newPage();
      const perr = [];
      pg.on('pageerror', e => perr.push(e.message));
      await pg.goto('file://' + page);
      // the same spec, carried as JSON (which keeps a lone surrogate as \uD800) with NaN and the infinities marked
      const text = JSON.stringify(buildSpec(), (k, v) => (typeof v === 'number' && !isFinite(v) ? { __num: String(v) } : v));
      const got = await pg.evaluate(async text => {
        const spec = JSON.parse(text, (k, v) => (v && typeof v === 'object' && '__num' in v ? Number(v.__num) : v));
        const b = await SP.writeXlsx(spec);
        let bin = '';
        for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
        const n = SP.lastXlsxNotes;
        return { b64: btoa(bin), notes: { replaced: n.replaced, cut: n.cut, nonFinite: n.nonFinite, badDates: n.badDates, renamed: n.renamed, deflated: n.deflated } };
      }, text);
      const RC = py('full', save('chromium.xlsx', new Uint8Array(Buffer.from(got.b64, 'base64'))));
      C.eq('Chromium: no page errors', perr, []);
      C.eq('Chromium: the zip is sound and deflated', [RC.crcBad, RC.parts.some(p => p.method === 8), got.notes.deflated], [null, true, true]);
      C.chk('Chromium: every part well-formed', RC.parts.filter(p => 'wellFormed' in p).every(p => p.wellFormed));
      C.eq('Chromium: openpyxl reads the same workbook jsdom wrote, cell for cell', JSON.stringify(RC.sheets), JSON.stringify(R.sheets));
      C.eq('Chromium: the same notes', got.notes, { replaced: N.replaced, cut: N.cut, nonFinite: N.nonFinite, badDates: N.badDates, renamed: N.renamed, deflated: true });
      const times = await pg.evaluate(async () => {
        const money = { fmt: '#,##0.00' }, dt = { fmt: 'yyyy-mm-dd' };
        const rows = [{ cells: Array.from({ length: 36 }, (_, j) => ({ v: 'Column ' + j, s: { font: { b: true } } })) }];
        for (let i = 0; i < 50000; i++) {
          const cells = [];
          cells.push({ v: 2025 + (i % 3) }, { v: { date: '2026-' + String(1 + (i % 12)).padStart(2, '0') + '-01' }, s: dt });
          cells.push({ v: 'CCAR-' + (i % 900) }, { v: 'Title ' + (i % 250) + ' & sons <b>' }, { v: 'Budget line ' + (i % 40) });
          for (let j = 5; j < 32; j++) cells.push(j % 4 === 0 ? { v: (i * 37 + j) / 100, s: money } : { v: 'text ' + ((i + j) % 500) });
          cells.push({ v: 'USAF' }, { v: 'disc' }, { v: 'exec' }, { v: 'Yes' });
          rows.push({ cells, level: i % 5 === 0 ? 0 : 1, hidden: i % 7 === 0 });
        }
        const out = [];
        for (let k = 0; k < 2; k++) {
          const t0 = performance.now();
          await SP.writeXlsx({ sheets: [{ name: 'Raw', freeze: 'A2', rows }] });
          out.push(Math.round(performance.now() - t0));
          if (out[k] < 3000) break;
        }
        return out;
      });
      C.chk('Chromium: a 50,000-row, 36-column sheet writes in under 3 s', Math.min(...times) < 3000, times.join(' ms, ') + ' ms');
      console.log('  (in Chromium, 50,000 rows x 36 columns: ' + times.join(' ms, then ') + ' ms)');
    } finally {
      await browser.close();
    }
  }

  // ---- notes are the last write's own ----------------------------------------------------------------------------------
  {
    await SP.writeXlsx({ sheets: [{ name: 'Clean', rows: [{ cells: [{ v: 'fine' }] }] }] });
    C.eq('a clean write leaves clean notes', [SP.lastXlsxNotes.replaced, SP.lastXlsxNotes.renamed.length, SP.lastXlsxNotes.messages.length, SP.lastXlsxNotes.cells], [0, 0, 0, 1]);
  }
} catch (e) {
  C.chk('the test ran to the end', false, e && e.stack || String(e));
} finally {
  t.close();
  tmp.rm();
}
C.done();
