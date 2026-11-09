// The import: helpers (§2), the readers and parseFiles (§3), deriveRow, apOfRow and budgetTable.
//
// The workbooks are written by test/import-fixtures.py with openpyxl and by hand with zipfile -- another writer, so the
// reader is never checked only against itself -- into a temporary directory, and every value in them is invented.
// What each row must read as is written beside it there (expect.json), from the literal the row was written with.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { loadTool, checks, scratchDir, pageHtml } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const C = checks('import');
const tmp = scratchDir('sfcbsp-import-');
const t = loadTool({ modules: ['util', 'xlsx-read', 'import'] });
const SP = t.SP;

async function refusal(p) { try { await p; return null; } catch (e) { return e; } }
const has = (s, sub) => typeof s === 'string' && s.includes(sub);

try {
  const py = spawnSync('python3', ['-I', join(HERE, 'import-fixtures.py'), tmp.dir], { encoding: 'utf8' });
  if (py.status !== 0) throw new Error('the fixture writer failed: ' + py.stderr);
  const E = JSON.parse(readFileSync(join(tmp.dir, 'expect.json'), 'utf8'));
  const ab = n => { const b = readFileSync(join(tmp.dir, n)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };
  const NOW = '2026-11-09T12:00:00.000Z';
  const H = SP.RAW_HEADERS;
  const col = h => H.indexOf(h);

  // =============================================================================================================
  // §2 constants and helpers
  // =============================================================================================================
  C.eq('the 32 raw headers, as Python lists them', [...H], E.headers);
  C.chk('constants are frozen: a curve cannot be edited in place', Object.isFrozen(SP.GOALS_DEFAULT.om1) && Object.isFrozen(SP.APS[0]));
  { const g = SP.goalsDefault(); g.om1[3] = 9; C.chk('goalsDefault() is a deep, editable copy', SP.GOALS_DEFAULT.om1[3] === 0.25 && g.om1[3] === 9); }
  C.eq('esc covers & < > " \'', SP.esc('<a href="x">&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
  C.eq('esc of null is empty', SP.esc(null), '');
  C.eq('normKey: trims, one space for any run (non-breaking included), lower-case', SP.normKey('  Air\u00a0Vehicle \t (AV)  '), 'air vehicle (av)');
  C.eq('normKey of null', SP.normKey(undefined), '');
  // parseAmount, every form in CONTRACT §2
  const PA = [
    ['$0.00', 0, 'dollar'], ['1,234.50', 123450, 'text'], [' -1234 ', -123400, 'text'], ['(1,234.56)', -123456, 'paren'],
    ['-$1,234.56', -123456, 'dollar'], ['$(1,234.56)', -123456, 'paren'], ['($1,234.56)', -123456, 'paren'], ['$-5', -500, 'dollar'],
    ['', 0, 'blank'], ['   ', 0, 'blank'], [null, 0, 'blank'], [undefined, 0, 'blank'],
    [1234.56, 123456, 'number'], [1234.5599999999999, 123456, 'number'], [-0.01, -1, 'number'], [0, 0, 'number'],
    ['1.005', 101, 'subcent'], ['-1.005', -101, 'subcent'], ['1.0049', 100, 'subcent'], [12.345, 1235, 'subcent'], [0.005, 1, 'subcent'],
    ['1.500', 150, 'text'], ['12,345,678.9', 1234567890, 'text'], ['.5', 50, 'text'], ['1.', 100, 'text'], ['\u22125', -500, 'text'],
    ['1,23', null, 'bad'], ['1234,567', null, 'bad'], ['12,34,567', null, 'bad'], ['abc', null, 'bad'], ['$', null, 'bad'],
    ['-(5)', null, 'bad'], ['(-5)', null, 'bad'], ['(5', null, 'bad'], ['5)', null, 'bad'], ['$$5', null, 'bad'], ['--5', null, 'bad'],
    ['1 234', null, 'bad'], ['1e5', null, 'bad'], [NaN, null, 'bad'], [Infinity, null, 'bad'], [true, null, 'bad'], [1e21, null, 'bad'],
  ];
  for (const [v, cents, how] of PA) C.eq('parseAmount(' + JSON.stringify(v) + ')', SP.parseAmount(v), { cents, how });
  C.chk('parseAmount never gives -0', !Object.is(SP.parseAmount('(0.00)').cents, -0) && !Object.is(SP.parseAmount(-0.001).cents, -0));
  // fmtM
  const FM = [[1234567, '0.01'], [-123456789, '(1.23)'], [0, '-'], [499999, '<0.01'], [-1, '(<0.01)'], [500000, '0.01'],
    [1500000, '0.02'], [2500000, '0.03'], [123456789012, '1,234.57'], [-123456789012, '(1,234.57)'], [100000000000, '1,000.00'], [null, '—']];
  for (const [c, s] of FM) C.eq('fmtM(' + c + ')', SP.fmtM(c), s);
  const FP = [[0.1234, '12.34%'], [0.12345, '12.35%'], [1, '100.00%'], [0, '0.00%'], [-0.5, '-50.00%'], [null, '—']];
  for (const [x, s] of FP) C.eq('fmtPct(' + x + ')', SP.fmtPct(x), s);
  const FD = [[0.209, '+20.90%'], [-0.1503, '-15.03%'], [0, '0.00%'], [0.00001, '0.00%'], [-0.00001, '0.00%'], [null, '—']];
  for (const [x, s] of FD) C.eq('fmtDelta(' + x + ')', SP.fmtDelta(x), s);
  C.eq('fmtUsd', [SP.fmtUsd(123456789), SP.fmtUsd(-5), SP.fmtUsd(0)], ['$1,234,567.89', '-$0.05', '$0.00']);
  C.eq('ymOf', [SP.ymOf('2026-03-31'), SP.ymOf(''), SP.ymOf(null)], ['2026-03', '', '']);
  C.eq('fyOf: October to December belong to the next FY', [SP.fyOf('2025-09-30'), SP.fyOf('2025-10-01'), SP.fyOf('2025-12-31'), SP.fyOf('2026-01-01'), SP.fyOf('')],
    [2025, 2026, 2026, 2026, null]);
  for (const [n, want] of Object.entries(E.serials)) {
    C.eq('excelSerialToIso(' + n + ') against openpyxl, 1900 system', SP.excelSerialToIso(Number(n), false), want['1900']);
    C.eq('excelSerialToIso(' + n + ') against openpyxl, 1904 system', SP.excelSerialToIso(Number(n), true), want['1904']);
  }
  C.eq('serial 60 (the 29 Feb 1900 that never was), 0 and a negative are no date',
    [SP.excelSerialToIso(60, false), SP.excelSerialToIso(0, false), SP.excelSerialToIso(-3, false)], ['', '', '']);
  C.eq('isoDate refuses a day that does not exist', [SP.isoDate(2026, 2, 29), SP.isoDate(2024, 2, 29), SP.isoDate(2026, 13, 1)], ['', '2024-02-29', '']);
  C.eq('colLetter', [SP.colLetter(0), SP.colLetter(25), SP.colLetter(26), SP.colLetter(33), SP.colLetter(16383)], ['A', 'Z', 'AA', 'AH', 'XFD']);
  C.eq('readFY: numbers 1990–2100 and the text forms',
    [SP.readFY(2026), SP.readFY('2026'), SP.readFY('FY26'), SP.readFY('fy2026'), SP.readFY(' FY 25 '), SP.readFY(1989), SP.readFY(2101),
     SP.readFY(2026.5), SP.readFY('FY'), SP.readFY('2026a'), SP.readFY(''), SP.readFY(true)],
    [2026, 2026, 2026, 2026, 2025, null, null, null, null, null, null, null]);
  C.eq('readDate: every text form, a serial, blank and unreadable',
    [SP.readDate('2026-01-31'), SP.readDate('1/5/2026'), SP.readDate('12/31/2025'), SP.readDate('5 Feb 2026'), SP.readDate('05 feb 2026'),
     SP.readDate('Mar-2026'), SP.readDate('2025-11-26 00:00:00'), SP.readDate(46022, false), SP.readDate(''), SP.readDate(null),
     SP.readDate('2026-02-30'), SP.readDate('31/31/2026'), SP.readDate('Foo-2026'), SP.readDate('46022'), SP.readDate(false)],
    ['2026-01-31', '2026-01-05', '2025-12-31', '2026-02-05', '2026-02-05', '2026-03-01', '2025-11-26', '2025-12-31', '', '', null, null, null, null, null]);

  // SP.download: a Blob URL clicked through a temporary anchor, revoked later
  {
    const w = t.window, clicks = [], revoked = [], timers = [];
    let made = null;
    const keep = { click: w.HTMLAnchorElement.prototype.click, create: w.URL.createObjectURL, revoke: w.URL.revokeObjectURL, st: w.setTimeout };
    w.HTMLAnchorElement.prototype.click = function () { clicks.push({ href: this.href, download: this.download, inDoc: this.isConnected }); };
    w.URL.createObjectURL = b => { made = b; return 'blob:made'; };
    w.URL.revokeObjectURL = u => revoked.push(u);
    w.setTimeout = (fn, ms) => { timers.push([fn, ms]); return 1; };
    const name = SP.download('SFCB test.xlsx', new Uint8Array([1, 2, 3]), 'application/x-test');
    C.chk('download clicks one anchor named for the file, in the page while clicked', clicks.length === 1 && clicks[0].download === 'SFCB test.xlsx'
      && clicks[0].href === 'blob:made' && clicks[0].inDoc && name === 'SFCB test.xlsx', JSON.stringify(clicks));
    C.chk('download leaves no anchor behind', w.document.querySelectorAll('a').length === 0);
    C.chk('download wraps bytes in a Blob of the type given', made && made.size === 3 && made.type === 'application/x-test');
    C.chk('download revokes the URL later, not in the same turn', revoked.length === 0 && timers.length === 1 && timers[0][1] >= 1000);
    timers[0][0]();
    C.eq('download revokes the URL it made', revoked, ['blob:made']);
    const blob = new Blob(['x'], { type: 'text/plain' });
    SP.download('b.txt', blob);
    C.chk('download passes a Blob through as it is', made === blob);
    w.HTMLAnchorElement.prototype.click = keep.click; w.URL.createObjectURL = keep.create; w.URL.revokeObjectURL = keep.revoke; w.setTimeout = keep.st;
  }

  // =============================================================================================================
  // readCsv
  // =============================================================================================================
  C.eq('readCsv: quoted fields, doubled quotes, newlines inside quotes, CRLF', SP.readCsv('a,"b,c","say ""hi""","one\r\ntwo"\r\n1,,3,\r\n'),
    [['a', 'b,c', 'say "hi"', 'one\r\ntwo'], ['1', '', '3', '']]);
  C.eq('readCsv: a byte-order mark is not data; LF and CR end records; no extra record for the last line ending',
    SP.readCsv('\uFEFFFY,x\n1,2\r3,4\n'), [['FY', 'x'], ['1', '2'], ['3', '4']]);
  C.eq('readCsv: an empty quoted field, and a file with no line ending', SP.readCsv('"",a'), [['', 'a']]);
  C.eq('readCsv: a quote inside an unquoted field is kept as it is', SP.readCsv('ab"c,d'), [['ab"c', 'd']]);
  {
    let msg = '';
    try { SP.readCsv('a,b\n1,"never closed\n2,3\n'); } catch (e) { msg = e.message; }
    C.chk('readCsv refuses a quote that never closes, naming its row', has(msg, 'That file is not a readable .csv') && has(msg, 'row 2'), msg);
  }

  // =============================================================================================================
  // hdr1.xlsx: header on row 1, shuffled columns, an extra column, every amount, FY and date form
  // =============================================================================================================
  const r1 = await SP.parseFiles([{ name: 'hdr1.xlsx', data: ab('hdr1.xlsx') }], { now: NOW });
  const X1 = E.hdr1;
  const sh1 = r1.report.files[0].sheets[0];
  C.chk('hdr1: the columns really are shuffled (a check by position would fail here)', X1.cols.slice(0, 32).join() !== H.join() && X1.cols.indexOf('Amount') !== col('Amount'));
  C.chk('hdr1: the sheet is used, its header on row 1', sh1.used && sh1.headerRow === 1, JSON.stringify(sh1));
  C.eq('hdr1: Svc (auto) and Inc (auto) are ignored and noted', [...sh1.ignoredCols].sort(), ['Inc (auto)', 'Svc (auto)']);
  C.eq('hdr1: the column no one knows is kept under its own name', sh1.extras, ['Notes']);
  C.eq('hdr1: no known column is missing', sh1.missingCols, []);
  C.eq('hdr1: blank formula-style rows are skipped and counted', [sh1.blank, r1.report.rowsBlank], [X1.blank, X1.blank]);
  C.eq('hdr1: rows read', r1.report.rowsRead, X1.rows.length);
  C.eq('hdr1: pulls hold O&M and the unidentified row, nothing else', Object.keys(r1.pulls), ['om', 'unidentified']);
  C.eq('hdr1: the O&M pull headers are the 32, then the extra column', r1.pulls.om.headers, [...H, 'Notes']);
  C.eq('hdr1: the pull names its file and sheet, and when it was imported', [r1.pulls.om.files, r1.pulls.om.importedAt], [[{ name: 'hdr1.xlsx', sheets: ['Report'] }], NOW]);
  const all1 = r1.pulls.om.rows.concat(r1.pulls.unidentified.rows);
  const byNo = new Map(all1.map(r => [r.src[2], r]));
  C.eq('hdr1: rows are in sheet order, top to bottom', r1.pulls.om.rows.map(r => r.src[2]), r1.pulls.om.rows.map(r => r.src[2]).slice().sort((a, b) => a - b));
  for (const x of X1.rows) {
    const r = byNo.get(x.rowNo);
    const tag = 'hdr1 row ' + x.rowNo + ': ';
    if (!C.chk(tag + 'is read', !!r)) continue;
    C.eq(tag + 'src', r.src, [0, 'Report', x.rowNo]);
    C.eq(tag + 'amount in cents', r.c[col('Amount')], x.cents === null ? null : x.cents);
    C.eq(tag + 'FY', r.c[col('FY')], x.fy);
    if ('date' in x) C.eq(tag + 'Date', r.c[col('Date')], x.date);
    if ('month' in x) C.eq(tag + 'Month', r.c[col('Month')], x.month);
    if (x.bad) C.chk(tag + 'unreadable, with the reason naming ' + x.bad.join(', '),
      Array.isArray(r.bad) && r.bad.length === x.bad.length && x.bad.every((f, i) => r.bad[i].startsWith(f)), JSON.stringify(r.bad));
    else C.chk(tag + 'readable', r.bad === undefined, JSON.stringify(r.bad));
    if (x.dateBad) C.chk(tag + 'the unreadable Date is listed with its text and kept on the row',
      r1.report.dateUnreadable.some(d => d.row === x.rowNo && d.column === 'Date' && d.raw === x.dateBad && d.sheet === 'Report' && d.file === 'hdr1.xlsx')
      && r.raw && r.raw.Date === x.dateBad);
    if ('pe' in x) C.eq(tag + 'Plan Event kept exactly', r.c[col('Plan Event')], x.pe);
    if ('title' in x) C.eq(tag + 'Title kept (trimmed at the ends only)', r.c[col('Title')], x.title);
    if ('ccar' in x) C.eq(tag + 'a number in a text column reads as its text', r.c[col('CCaR No')], x.ccar);
    if ('extra' in x) C.eq(tag + 'the extra column travels on the row', r.x.Notes, x.extra);
    if ('status' in x) {
      const d = SP.deriveRow(r, {});
      C.eq(tag + 'status', [d.status, 'statusLabel' in x ? d.statusLabel : d.statusLabel], [x.status, 'statusLabel' in x ? x.statusLabel : d.statusLabel]);
    }
    C.chk(tag + 'is in the ' + (x.ap || 'om') + ' pull', (x.ap === 'unidentified' ? r1.pulls.unidentified.rows : r1.pulls.om.rows).includes(r));
    C.chk(tag + 'every stored text is a string and every typed value its type',
      r.c.every((v, i) => i === col('FY') ? (v === null || typeof v === 'number') : i === col('Amount') ? (v === null || Number.isInteger(v))
        : typeof v === 'string'));
  }
  // the counts the report gives
  const readable = X1.rows.filter(x => x.cents !== null || !(x.bad || []).includes('Amount'));
  const howN = h => X1.rows.filter(x => !(x.bad || []).includes('Amount') && x.how === h).length;
  const cv = r1.report.conversions;
  C.eq('hdr1: conversions counted by kind', [cv.text, cv.dollar, cv.paren, cv.subcent, cv.blank, cv.number],
    [howN('text'), howN('dollar'), howN('paren'), howN('subcent'), howN('blank'), howN('number')]);
  C.eq('hdr1: spaces trimmed, counted and named by column', [cv.trimmed, r1.report.trimmedBy], [2, { Amount: 1, Title: 1 }]);
  C.eq('hdr1: each sub-cent rounding is listed', r1.report.subcent.map(s => [s.row, s.raw, s.cents]),
    X1.rows.filter(x => x.how === 'subcent').map(x => [x.rowNo, x.rowNo === X1.rows.find(y => y.cents === 101).rowNo ? '1.005' : '12.345', x.cents]));
  const badX = X1.rows.filter(x => x.bad);
  C.eq('hdr1: unreadable rows are listed with file, sheet, row, reasons and the dollars where readable',
    r1.report.unreadable.map(u => [u.file, u.sheet, u.row, u.reasons.length, u.cents]),
    badX.map(x => ['hdr1.xlsx', 'Report', x.rowNo, x.bad.length, x.cents]));
  C.chk('hdr1: the unreadable FY and Amount texts are quoted in the report',
    r1.report.unreadable.some(u => u.raw.FY === 'abc') && r1.report.unreadable.some(u => u.raw.Amount === 'twelve'));
  const omWant = X1.rows.filter(x => x.ap !== 'unidentified' && !x.bad).reduce((s, x) => s + x.cents, 0);
  C.eq('hdr1: rows and dollars per appropriation (unreadable rows counted apart)', [r1.report.byAp.om.rows, r1.report.byAp.om.cents, r1.report.byAp.om.unreadable],
    [X1.rows.filter(x => x.ap !== 'unidentified').length, omWant, badX.length]);
  C.eq('hdr1: the row no appropriation claims is reported', [r1.report.byAp.unidentified.rows, r1.report.byAp.unidentified.cents], [1, 1800]);
  const allocWant = new Map();
  for (const x of X1.rows) {
    const a = x.status === 'unprog' ? 'Unprogrammed - Pending Allocation' : x.status === 'fcst' ? 'Forecast - Planned'
      : x.statusLabel === 'Some Other Status' ? 'Some Other Status' : x.statusLabel === '(blank)' ? '' : byNo.get(x.rowNo).c[col('Alloc')];
    const e = allocWant.get(a) || [0, 0]; e[0]++; if (!x.bad) e[1] += x.cents; allocWant.set(a, e);
  }
  C.eq('hdr1: the distinct Alloc texts with counts and dollars, most rows first', r1.report.alloc.map(a => [a.text, a.rows, a.cents]),
    [...allocWant].map(([k, v]) => [k, v[0], v[1]]).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)));
  C.eq('hdr1: nothing disagreed and no file was refused', [r1.report.disagreements, r1.report.refusedFiles], [[], []]);
  const lines1 = SP.importReportLines(r1.report);
  C.chk('hdr1: the report lines name the sheet, the conversions and each unreadable row',
    lines1.some(l => has(l, 'Sheet “Report”: used')) && lines1.some(l => has(l, 'written with $'))
    && lines1.filter(l => /row \d+ \(/.test(l)).length === badX.length, lines1.join('\n'));
  C.chk('hostile text is kept as text in the pull and in the report lines, and esc() makes it inert',
    byNo.get(X1.rows.find(x => x.pe).rowNo).c[col('Plan Event')] === '</script><img src=x onerror=alert(1)>'
    && !/[<>]/.test(SP.esc('</script><img src=x onerror=alert(1)>')));
  C.eq('the pulls survive JSON (the saved file) unchanged', JSON.parse(JSON.stringify(r1.pulls)).om.rows.length, r1.pulls.om.rows.length);
  C.chk('an extra-column object has no prototype (a column headed __proto__ is a column)', Object.getPrototypeOf(r1.pulls.om.rows[0].x) === null);

  // =============================================================================================================
  // hdr2.xlsx: header on row 2 under a title row; ignored sheets; the sheet-name fallback; a sheet named __proto__
  // =============================================================================================================
  const r2 = await SP.parseFiles([{ name: 'hdr2.xlsx', data: ab('hdr2.xlsx') }], { now: NOW });
  const s2 = Object.fromEntries(r2.report.files[0].sheets.map(s => [s.name, s]));
  C.eq('hdr2: sheets in workbook order', r2.report.files[0].sheets.map(s => s.name), ['Summary', 'FF Raw Data', '__proto__', 'Misc', 'Spares Raw Data', 'Near miss', 'Header only']);
  C.chk('hdr2: the header is found on row 2, under v12’s title row', s2['FF Raw Data'].used && s2['FF Raw Data'].headerRow === 2 && s2['Spares Raw Data'].headerRow === 2);
  C.chk('hdr2: a report sheet with no header is ignored, and says why', !s2.Summary.used && has(s2.Summary.why, 'no row in the first 15'));
  C.chk('hdr2: a near-miss header names the header it lacks', !s2['Near miss'].used && has(s2['Near miss'].why, 'row 1 comes closest but has no “Alloc”'), s2['Near miss'].why);
  C.chk('hdr2: a header with no rows below it is ignored, and says why', !s2['Header only'].used && has(s2['Header only'].why, 'no data rows'));
  C.eq('hdr2: rows by appropriation', Object.fromEntries(Object.entries(r2.pulls).map(([k, p]) => [k, p.rows.length])), { ff: 3, sp: 1, opn: 1, unidentified: 1 });
  C.eq('hdr2: a budget that names no appropriation is placed by its sheet’s name (FF Raw Data)', r2.pulls.ff.rows.map(r => r.c[col('CCaR No')]), ['FF-1', 'FF-2', 'FF-3']);
  C.eq('hdr2: the sheet named __proto__ is an ordinary sheet', [r2.pulls.opn.files, s2.__proto__ && s2.__proto__.used],
    [[{ name: 'hdr2.xlsx', sheets: ['__proto__'] }], true]);
  C.chk('hdr2: no prototype in the page was touched', t.ev('Object.keys(Object.prototype).length === 0 && ({}).rows === undefined && ({}).headerRow === undefined'));
  C.eq('hdr2: a sheet whose name decides nothing leaves its row unidentified', r2.pulls.unidentified.rows[0].src.slice(1), ['Misc', 2]);
  C.eq('hdr2: the sheet name deciding where the budget is silent is no disagreement', r2.report.disagreements, []);
  C.eq('hdr2: the ignored sheets are listed', r2.report.ignoredSheets.map(s => s.sheet), ['Summary', 'Near miss', 'Header only']);
  const d2 = r => SP.deriveRow(r, {});
  C.eq('hdr2: services and lanes of the budgets', r2.pulls.ff.rows.concat(r2.pulls.sp.rows, r2.pulls.opn.rows).map(r => [d2(r).ap, d2(r).svc, d2(r).lane]),
    [['ff', 'USMC C (USMC CV)', 'disc'], ['ff', 'USAF', 'mand'], ['ff', 'USAF', 'disc'], ['sp', 'USN (USN CV)', 'disc'], ['opn', 'USN (USN CV)', 'disc']]);

  // a combined sheet: rows of several appropriations on one sheet is fine; a budget that disagrees with the sheet is counted
  const rd = await SP.parseFiles([{ name: 'disagree.xlsx', data: ab('disagree.xlsx') }], { now: NOW });
  C.eq('disagree: the budget wins', [rd.pulls.ff.rows.length, rd.pulls.sp.rows.length], [2, 1]);
  C.eq('disagree: the disagreements are counted per sheet', rd.report.disagreements.map(d => [d.file, d.sheet, d.rows, d.cents, d.sheetAp, d.byBudget]),
    [['disagree.xlsx', 'Spares Raw Data', 2, 1000300, 'sp', { ff: 2 }]]);
  C.chk('disagree: the report lines say so', SP.importReportLines(rd.report).some(l => has(l, 'Spares Raw Data') && has(l, 'placed by Budget as Full Fund 2')));

  // =============================================================================================================
  // the refusals: one sheet per appropriation, the same file twice, nothing usable, an unreadable file
  // =============================================================================================================
  {
    const e = await refusal(SP.parseFiles([{ name: 'clash.xlsx', data: ab('clash.xlsx') }]));
    C.chk('clash: O&M rows on two sheets of one workbook refuse the import', e && e.refused, e && e.message);
    C.chk('clash: the message names each sheet and its count, so the misfiled row is found',
      e && has(e.message, '“clash.xlsx” › “O&M Raw Data” holds 3 O&M rows')
      && has(e.message, '“clash.xlsx” › “FF Raw Data” holds 1 O&M row') && has(e.message, 'Nothing was imported'), e && e.message);
    const csvB = H.join(',') + '\n' + ['2026', '2025-11-01', 'B-1', 'T', 'USAF O&M- Fixture Line Discretionary AV', '', '', 'PE', '2025-11-03', '5', 'Not Allocated'].join(',') + ',,,,,,,,,,,,,,,,,,,,,\n'
      + ['2026', '2025-11-01', 'B-2', 'T', 'USAF O&M- Fixture Line Discretionary AV', '', '', 'PE', '2025-11-03', '6', 'Not Allocated'].join(',') + ',,,,,,,,,,,,,,,,,,,,,\n';
    const e2 = await refusal(SP.parseFiles([{ name: 'clash-a.xlsx', data: ab('clash-a.xlsx') }, { name: 'clash-b.csv', data: csvB }]));
    C.chk('clash: O&M rows from two files refuse the import, naming both',
      e2 && e2.refused && has(e2.message, '“clash-a.xlsx” › “O&M Raw Data” holds 2 O&M rows')
      && has(e2.message, '“clash-b.csv” › “clash-b” holds 2 O&M rows'), e2 && e2.message);
    const same = ab('hdr2.xlsx');
    const e3 = await refusal(SP.parseFiles([{ name: 'first.xlsx', data: same }, { name: 'second.xlsx', data: ab('hdr2.xlsx') }]));
    C.chk('the same file twice (identical bytes, other names) is refused', e3 && e3.refused && has(e3.message, '“second.xlsx” is the same file as “first.xlsx”'), e3 && e3.message);
    const e4 = await refusal(SP.parseFiles([{ name: 'x.csv', data: csvB }, { name: 'x.csv', data: csvB }]));
    C.chk('the same file given twice under one name is refused', e4 && e4.refused && has(e4.message, '“x.csv” was given twice'), e4 && e4.message);
    const e5 = await refusal(SP.parseFiles([{ name: 'nodata.xlsx', data: ab('nodata.xlsx') }]));
    C.chk('a file with no usable sheet is refused by name, and nothing is imported', e5 && e5.refused && has(e5.message, '“nodata.xlsx” was refused'), e5 && e5.message);
    const e6 = await refusal(SP.parseFiles([{ name: 'dupkey.xlsx', data: ab('dupkey.xlsx') }]));
    C.chk('two columns headed Amount: the sheet is not read (which holds the money is not guessed)',
      e6 && e6.refused && e6.report.files[0].sheets[0].why.startsWith('two columns are headed “Amount” (J and AG)'), e6 && e6.report && e6.report.files[0].sheets[0].why);
    const e7 = await refusal(SP.parseFiles([]));
    C.chk('an import of no file is refused', e7 && e7.refused);
  }
  // truncated and damaged .xlsx files: refused with the plain message, never a DataView error
  {
    const whole = new Uint8Array(ab('hdr1.xlsx'));
    const half = whole.slice(0, whole.length >> 1).buffer;
    const e = await refusal(SP.parseFiles([{ name: 'cut.xlsx', data: half }]));
    C.chk('a truncated .xlsx is refused with the plain message', e && e.refused && has(e.message, '“cut.xlsx” was refused: That file is not an .xlsx workbook (no ZIP end-of-directory record)')
      && has(e.message, 'export it again'), e && e.message);
    const tail = whole.slice(0, whole.length - 5).buffer;
    const et = await refusal(SP.readXlsx(tail));
    C.chk('a file cut in its last bytes is refused the same way', et && has(et.message, 'no ZIP end-of-directory record'), et && et.message);
    // damage the compressed bytes of the worksheet (a part the reader reads: damage to one it never opens changes nothing)
    const dmg = whole.slice();
    const dv = new DataView(dmg.buffer);
    const nameB = new TextEncoder().encode('xl/worksheets/sheet1.xml');
    let lh = -1;
    for (let i = 0; i + 30 + nameB.length < dmg.length && lh < 0; i++) if (dv.getUint32(i, true) === 0x04034b50 && dv.getUint16(i + 26, true) === nameB.length
      && nameB.every((b, k) => dmg[i + 30 + k] === b)) lh = i;
    const start = lh + 30 + dv.getUint16(lh + 26, true) + dv.getUint16(lh + 28, true);
    C.chk('the worksheet entry was found to damage', lh >= 0);
    for (let i = start; i < start + 40 && i < dmg.length; i++) dmg[i] = 0xff;
    const ed = await refusal(SP.readXlsx(dmg.buffer));
    C.chk('damaged compressed data is refused in words', ed && /^That file is not a readable \.xlsx — .* could not be decompressed/.test(ed.message), ed && ed.message);
    const cdOff = dv.getUint32(dmg.length - 22 + 16, true);
    const cd = whole.slice(); new DataView(cd.buffer).setUint32(cd.length - 22 + 16, cd.length + 1000, true);
    const ec = await refusal(SP.readXlsx(cd.buffer));
    C.chk('a directory that points past the end is refused in words', ec && has(ec.message, 'past the end of a ') && cdOff > 0, ec && ec.message);
    const ee = await refusal(SP.readXlsx(new ArrayBuffer(0)));
    C.chk('an empty file says it is empty', ee && ee.message.startsWith('That file is empty'), ee && ee.message);
    const en = await refusal(SP.readXlsx(new TextEncoder().encode('FY,Amount\n2026,5\n')));
    C.chk('text named .xlsx is refused as no workbook', en && has(en.message, 'not an .xlsx workbook'), en && en.message);
    const es = await refusal(SP.readXlsx(ab('hand-badsst.xlsx')));
    C.chk('a cell past the shared-string table is a damaged file, not a blank cell', es && has(es.message, 'points at text #999 but its shared-string table holds 37'), es && es.message);
    const mix = await SP.parseFiles([{ name: 'hdr1.xlsx', data: ab('hdr1.xlsx') }, { name: 'cut.xlsx', data: half }], { now: NOW });
    C.chk('one unreadable file among good ones: the good one imports and the bad one is named',
      mix.pulls.om.rows.length === r1.pulls.om.rows.length && mix.report.refusedFiles.length === 1 && mix.report.refusedFiles[0].file === 'cut.xlsx'
      && SP.importReportLines(mix.report).some(l => has(l, 'File “cut.xlsx”') && has(l, 'REFUSED')));
  }

  // =============================================================================================================
  // the 1904 date system, and a workbook written by hand
  // =============================================================================================================
  {
    const wb = await SP.readXlsx(ab('d1904.xlsx'));
    C.chk('d1904: the file reports date1904', wb.date1904 === true);
    const r = await SP.parseFiles([{ name: 'd1904.xlsx', data: ab('d1904.xlsx') }]);
    C.eq('d1904: dates read in the 1904 system', r.pulls.om.rows.map(x => [x.c[col('Month')], x.c[col('Date')]]), [['2026-03-01', '2026-03-15'], ['2025-10-01', '2025-10-01']]);
    const w1 = await SP.readXlsx(ab('hdr1.xlsx'));
    C.chk('hdr1: an ordinary workbook is not 1904', w1.date1904 === false);
  }
  {
    const wb = await SP.readXlsx(ab('hand.xlsx'));
    C.chk('hand: date1904="true" is read', wb.date1904 === true);
    C.eq('hand: sheet names unescaped, in workbook order', wb.sheets.map(s => s.name), ['O&M Raw Data', 'Ghost']);
    C.chk('hand: a sheet whose part is missing is named, not skipped', has(wb.sheets[1].problem, 'missing from the file'));
    const s = wb.sheets[0];
    C.eq('hand: row numbers come from the rows (a <row/> with no cells is row 2)', s.rowNo, [1, 2, 3, 4, 5]);
    C.eq('hand: rich runs join, a phonetic reading is left out', [s.rows[0][7], s.rows[3][3]], ['Plan Event', 'Phonetic Title']);
    C.eq('hand: cell types b, e, d, inline rich, and a cell with no reference', [s.rows[2][5], s.rows[2][6], s.rows[2][8], s.rows[2][3], s.rows[3][11]],
      [true, '#N/A', '2026-01-31', 'Inline Title', false]);
    C.eq('hand: _xHHHH_ codes and character references', s.rows[3][7], 'Line\rTwo & _x0041_ A _x0001_');
    C.eq('hand: a line break written raw (CR LF or CR) reads as LF, as every XML reader reads it; &#13; and _x000D_ stay CR',
      s.rows[2][11], 'Raw\nbreak, raw\nCR, kept \r and \r');
    C.eq('hand: codes decoded and kept are counted', wb.esc, { dec: 3, kept: 1 });
    const r = await SP.parseFiles([{ name: 'hand.xlsx', data: ab('hand.xlsx') }]);
    const rows = r.pulls.om.rows;
    C.eq('hand: two data rows; the cell-less row and the styled-only row are blank', [rows.length, r.report.files[0].sheets[0].blank], [2, 2]);
    C.eq('hand: typed values', rows.map(x => [x.c[col('FY')], x.c[col('Month')], x.c[col('Date')], x.c[col('Amount')], x.c[col('C/L')], x.c[col('SB')], x.c[col('Event Description')]]),
      [[2026, E.hand.month3, E.hand.date3, 450025, 'TRUE', '#N/A', 'Raw\nbreak, raw\nCR, kept \r and'], [2026, E.hand.month4, E.hand.date4, 1250, '', '', 'FALSE']]);
    C.chk('hand: the Ghost sheet is listed as ignored with its reason', r.report.ignoredSheets.some(x => x.sheet === 'Ghost' && has(x.why, 'missing')));
    C.chk('hand: the codes are reported on the file', r.report.files[0].notes.length === 2);
  }

  // =============================================================================================================
  // CSV: a byte-order mark, quoted newlines, plain numbers, Windows-1252
  // =============================================================================================================
  {
    const q = s => '"' + String(s).replace(/"/g, '""') + '"';
    const line = vals => H.map(h => (h in vals ? vals[h] : '')).join(',');
    const text = '\uFEFF' + H.join(',') + ',Svc (auto)\r\n'
      + line({ FY: '2026', Month: '2025-11-01', 'CCaR No': 'CSV-1', Title: q('Title, with comma'), Budget: 'USAF O&M- Fixture Line Discretionary AV',
        'Plan Event': q('PE "quoted"'), Date: '2025-11-30', Amount: '1234.5', Alloc: 'Not Allocated', 'Event Description': q('Line one\nLine two'), PMO: 'Air Vehicle (AV)' }) + ',USAF\r\n'
      + line({ FY: 'FY26', 'CCaR No': 'CSV-2', Budget: 'USAF O&M- Fixture Line Discretionary AV', Date: '12/31/2025', Amount: '$0.00', Alloc: EXECA() }) + ',\r\n'
      + line({ FY: '2026', 'CCaR No': 'CSV-3', Budget: 'USAF O&M- Fixture Line Discretionary AV', Date: '', Amount: q('1,234.00'), Alloc: 'Not Allocated' }) + ',\r\n';
    function EXECA() { return 'Actual Execution is allocated to a Plan Event'; }
    const r = await SP.parseFiles([{ name: 'pull.csv', data: text }]);
    const rows = r.pulls.om.rows;
    C.eq('csv: the byte-order mark does not hide the FY header; three rows', rows.length, 3);
    C.eq('csv: quoted commas, doubled quotes and a newline inside quotes', [rows[0].c[col('Title')], rows[0].c[col('Plan Event')], rows[0].c[col('Event Description')]],
      ['Title, with comma', 'PE "quoted"', 'Line one\nLine two']);
    C.eq('csv: rows are numbered as records, so the row after a two-line value is row 3', rows.map(x => x.src[2]), [2, 3, 4]);
    C.eq('csv: the sheet is named for the file', rows[0].src[1], 'pull');
    C.eq('csv: amounts', rows.map(x => x.c[col('Amount')]), [123450, 0, 123400]);
    C.eq('csv: a plain number is a number; $ and commas are conversions', [r.report.conversions.number, r.report.conversions.dollar, r.report.conversions.text], [1, 1, 1]);
    C.eq('csv: Svc (auto) ignored', r.report.files[0].sheets[0].ignoredCols, ['Svc (auto)']);
    const bomBytes = new Uint8Array([0xEF, 0xBB, 0xBF, ...new TextEncoder().encode(text.slice(1))]);
    const rb = await SP.parseFiles([{ name: 'pull.CSV', data: bomBytes.buffer }]);
    C.eq('csv bytes with a byte-order mark read the same', rb.pulls.om.rows.map(x => x.c), rows.map(x => x.c));
    const cp = H.join(',') + '\r\n' + line({ FY: '2026', 'CCaR No': 'CP-1', Title: 'Café Line', Budget: 'USAF O&M- Fixture Line Discretionary AV', Amount: '5', Alloc: 'Not Allocated' }) + '\r\n';
    const cpBytes = new Uint8Array([...cp].map(ch => ch.charCodeAt(0)));   // every character below 256: Windows-1252 bytes
    const rc = await SP.parseFiles([{ name: 'ansi.csv', data: cpBytes }]);
    C.chk('csv in Windows-1252 is read as such, and the report says so',
      rc.pulls.om.rows[0].c[col('Title')] === 'Café Line' && has(rc.report.files[0].notes[0], 'Windows-1252'), rc.report.files[0].notes.join(' '));
  }

  // =============================================================================================================
  // apOfRow, deriveRow, budgetTable
  // =============================================================================================================
  const mk = (v, src) => { const c = H.map(h => (h === 'FY' ? 2026 : h === 'Amount' ? 0 : h === 'Date' || h === 'Month' ? '' : '')); for (const [k, x] of Object.entries(v)) c[col(k)] = x; return { c, x: {}, src: src || [0, 'Report', 2] }; };
  C.eq('apOfRow: by budget, in the contract’s order', ['USN APN Spares Initial Full Fund Discretionary AV', 'USAF APN FULL  FUND SUPT', 'USN OPN Ship Alts', 'USAF O&M- CAM',
    'USN OPNAV Something', 'USAF BOS'].map(b => SP.apOfRow(mk({ Budget: b }), 'Sheet1')), ['sp', 'ff', 'opn', 'om', null, null]);
  C.eq('apOfRow: by the sheet name when the budget names none', ['O&M Raw Data', 'o&m  raw data', 'FF Raw Data', 'pull-ff', 'Full Fund', 'Spares Raw Data', 'Initial Spares',
    'OPN Raw Data', 'Staff', 'Topnotch', 'O&M', 'Sheet1'].map(n => SP.apOfRow(mk({ Budget: 'USAF BOS' }), n)), ['om', 'om', 'ff', 'ff', 'ff', 'sp', 'sp', 'opn', null, null, null, null]);
  C.eq('apOfRow: the budget wins over the sheet', SP.apOfRow(mk({ Budget: 'USN APN Full Fund' }), 'Spares Raw Data'), 'ff');
  const SVC = [
    ['USAF O&M- Fixture Line Discretionary PP', 'USAF', 'disc'], ['USAF O&M - ANG CAM OBBBA Mandatory', 'USAF ANG', 'mand'],
    ['USAF O&M-ANG CAM Discretionary AV', 'USAF ANG', 'disc'], ['USAF O&M- AFRC CAM Discretionary AV', 'USAF AFRC', 'disc'],
    ['USAF ANG AFRC Discretionary', 'USAF AFRC', 'disc'], ['USN O&M- Fixture USMC CV EN Discretionary PP', 'USMC C (USMC CV)', 'disc'],
    ['USN APN Full Fund SUPT USMC CV FIXED Discretionary BOP', 'USMC C (USMC CV)', 'disc'], ['USN O&M- Fixture USN CV EN Discretionary PP', 'USN (USN CV)', 'disc'],
    ['USN APN Spares Initial STOVL Discretionary AV', 'USMC B (STOVL)', 'disc'], ['USN STOVL USMC CV', 'USMC B (STOVL)', 'disc'],
    ['USN OPN Fixture Ship Line Discretionary MxS', 'USN (USN CV)', 'disc'], ['USN APN Spares Fixture CONG Discretionary PP', 'USN (USN CV)', 'disc'],
    ['USMC  CV  Mandatory', 'USMC C (USMC CV)', 'mand'], ['Misc USN CV Line', 'USN (USN CV)', 'disc'], ['  usaf o&m lower case', 'USAF', 'disc'],
    ['Misc CHANGE Discretionary', SP.SVC_UNKNOWN, 'disc'], ['RANGE Support', SP.SVC_UNKNOWN, 'disc'], ['HANGAR Upkeep', SP.SVC_UNKNOWN, 'disc'],
    ['X USN Y', SP.SVC_UNKNOWN, 'disc'], ['USAFE Line', SP.SVC_UNKNOWN, 'disc'], ['', SP.SVC_UNKNOWN, 'disc'], ['USAF Mandatoryish', 'USAF', 'disc'],
    ['USAF O&M Mandatory', 'USAF', 'mand'], ['constructor', SP.SVC_UNKNOWN, 'disc'], ['__proto__', SP.SVC_UNKNOWN, 'disc'],
  ];
  for (const [b, svc, lane] of SVC) C.eq('deriveRow service and lane: ' + JSON.stringify(b), [SP.deriveRow(mk({ Budget: b }), {}).svc, SP.deriveRow(mk({ Budget: b }), {}).lane], [svc, lane]);
  const ST = [['Actual Execution is allocated to a Plan Event', 'exec', 'Actual Execution'], ['ACTUAL EXECUTION', 'exec', 'Actual Execution'],
    ['Not Allocated', 'na', 'Not Allocated'], ['not  allocated', 'na', 'Not Allocated'], ['Not Allocated (held)', 'other', 'Not Allocated (held)'],
    ['Unprogrammed - Pending Allocation', 'unprog', 'Unprogrammed'], ['Forecast', 'fcst', 'Forecast'], ['', 'other', '(blank)'], ['Some Status', 'other', 'Some Status']];
  for (const [a, s, l] of ST) C.eq('deriveRow status: ' + JSON.stringify(a), [SP.deriveRow(mk({ Alloc: a }), {}).status, SP.deriveRow(mk({ Alloc: a }), {}).statusLabel], [s, l]);
  {
    const set = { budgets: { 'misc change discretionary': { svc: 'USAF' }, 'usaf o&m- fixture line discretionary pp': { lane: 'mand' }, 'bogus line': { svc: 'Bogus', lane: 'x' } } };
    C.eq('an override of the service wins', SP.deriveRow(mk({ Budget: 'Misc  CHANGE Discretionary' }), set).svc, 'USAF');
    C.eq('an override of the lane wins, the service by rule', [SP.deriveRow(mk({ Budget: 'USAF O&M- Fixture Line Discretionary PP' }), set).lane, SP.deriveRow(mk({ Budget: 'USAF O&M- Fixture Line Discretionary PP' }), set).svc], ['mand', 'USAF']);
    C.eq('an override naming no service or lane is ignored', [SP.deriveRow(mk({ Budget: 'Bogus Line' }), set).svc, SP.deriveRow(mk({ Budget: 'Bogus Line' }), set).lane], [SP.SVC_UNKNOWN, 'disc']);
    C.eq('a budget named for a built-in finds no override', [SP.deriveRow(mk({ Budget: 'constructor' }), set).svc, SP.deriveRow(mk({ Budget: 'toString' }), { budgets: {} }).svc], [SP.SVC_UNKNOWN, SP.SVC_UNKNOWN]);
    C.eq('deriveRow with no settings at all', SP.deriveRow(mk({ Budget: 'USAF O&M' }), undefined).svc, 'USAF');
    const d = SP.deriveRow(mk({ PMO: ' Air\u00a0Vehicle (AV) ', Title: 'TITLE  One', 'Plan Event': 'Pe', 'CCaR No': 'Jsf 1', Budget: 'USAF O&M', Date: '2026-01-02', Amount: 5 }, [1, 'O&M Raw Data', 9]), {});
    C.eq('deriveRow keys are normKeys; fields pass through', [d.k, d.ap, d.fy, d.date, d.cents, d.src, d.bad],
      [{ pmo: 'air vehicle (av)', title: 'title one', pe: 'pe', ccar: 'jsf 1' }, 'om', 2026, '2026-01-02', 5, [1, 'O&M Raw Data', 9], null]);
    const bad = mk({ Amount: null }); bad.bad = ['Amount "x" is not an amount'];
    C.eq('deriveRow carries an unreadable row’s reasons', SP.deriveRow(bad, {}).bad, ['Amount "x" is not an amount']);
  }
  {
    const pulls = { om: { rows: [mk({ Budget: 'USAF O&M Line', Amount: 100 }), mk({ Budget: 'usaf  o&m line', Amount: 50 }), mk({ Budget: 'USAF O&M Line', Amount: 7 }),
      Object.assign(mk({ Budget: 'Zeta CHANGE', Amount: null }), { bad: ['x'] })] }, unidentified: { rows: [mk({ Budget: 'Zeta CHANGE', Amount: 3 })] } };
    const bt = SP.budgetTable(pulls, { budgets: { 'zeta change': { lane: 'mand' } } });
    C.eq('budgetTable: one entry per normKey, the most-used spelling, rows, dollars of readable rows, rule, override and what applies',
      bt.map(b => [b.name, b.rows, b.cents, b.aps, b.svcRule, b.laneRule, b.override, b.svc, b.lane, b.unknown]),
      [['USAF O&M Line', 3, 157, ['om'], 'USAF', 'disc', null, 'USAF', 'disc', false],
       ['Zeta CHANGE', 2, 3, ['om', 'unidentified'], SP.SVC_UNKNOWN, 'disc', { lane: 'mand' }, SP.SVC_UNKNOWN, 'mand', true]]);
  }
  C.eq('no script error in the page', t.errors, []);

  // =============================================================================================================
  // THE SAME READING IN CHROMIUM, from file:// under the page's own Content-Security-Policy. jsdom borrows Node's
  // streams and Blob, so only a real browser shows that DecompressionStream, Blob.stream and Response work there.
  // =============================================================================================================
  {
    const { chromium } = await import('playwright-core');
    const { CHROME } = await import('../../tools/chrome.mjs');
    const page0 = join(tmp.dir, 'page.html');
    writeFileSync(page0, pageHtml({ modules: ['util', 'xlsx-read', 'import'] }));
    const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
    try {
      const page = await browser.newPage();
      const perr = [];
      page.on('pageerror', e => perr.push(e.message));
      page.on('console', m => { if (m.type() === 'error') perr.push(m.text()); });
      await page.goto('file://' + page0);
      const b64 = n => readFileSync(join(tmp.dir, n)).toString('base64');
      const inPage = await page.evaluate(async (files) => {
        const bytes = s => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; };
        const out = {};
        for (const [n, s] of Object.entries(files)) {
          try { const r = await SP.parseFiles([{ name: n, data: bytes(s) }], { now: '2026-11-09T12:00:00.000Z' }); out[n] = { pulls: r.pulls, conv: r.report.conversions }; }
          catch (e) { out[n] = { refused: e.message }; }
        }
        return out;
      }, { 'hdr1.xlsx': b64('hdr1.xlsx'), 'hand.xlsx': b64('hand.xlsx'), 'd1904.xlsx': b64('d1904.xlsx'), 'cut.xlsx': readFileSync(join(tmp.dir, 'hdr1.xlsx')).subarray(0, 3000).toString('base64') });
      const viaJsdom = async n => { const r = await SP.parseFiles([{ name: n, data: ab(n) }], { now: NOW }); return { pulls: JSON.parse(JSON.stringify(r.pulls)), conv: r.report.conversions }; };
      for (const n of ['hdr1.xlsx', 'hand.xlsx', 'd1904.xlsx']) C.eq('chromium: ' + n + ' reads exactly as in jsdom', inPage[n], await viaJsdom(n));
      C.chk('chromium: a truncated file is refused with the plain message', has(inPage['cut.xlsx'].refused, 'That file is not an .xlsx workbook'), JSON.stringify(inPage['cut.xlsx']));
      C.eq('chromium: no page error and no CSP violation', perr, []);
    } finally { await browser.close(); }
  }
} catch (e) {
  C.chk('the test ran to its end', false, e && e.stack || String(e));
} finally {
  t.close();
  tmp.rm();
  C.done();
}
