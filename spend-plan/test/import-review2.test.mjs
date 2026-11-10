// The second review's import and kept-pull findings, each held on a small pull made here. Every name and figure below is
// invented, and every expectation is worked out from the rows this file writes, never read back from the tool.
//
// What it holds the tool to:
//   SEAM-1  one misfiled row on a sheet whose name names no appropriation ("Report", as CCaR names its export) never
//           replaces a whole pull unasked: a pull that would keep fewer than half the readable rows is asked about
//   SEAM-2  the misfiled-row question no longer advises giving the row its own sheet (taken, that route replaced the whole
//           pull with no question), and the row on its own sheet is asked about all the same
//   F1      an O&M file named "O&M.csv", "om.csv", "O&M Raw Data (2).csv", "OM pull 9 Nov.csv" or "pull-om.csv" is an O&M
//           sheet to the misfiled-row question; "Room.csv" is not
//   F5      a correct pull whose name mentions two appropriations ("FF and OPN pull.csv", a sheet "Spares and FF") is not
//           asked about
//   DL-2/F4 an import whose Amounts cannot be read is asked about before it replaces a readable pull, and any import with
//           rows that count nowhere reads as a warning, not a plain success
//   SEAM-3  the rows whose appropriation is not identified stay while a pull their import brought is on screen, through a
//           save and reopen, and go (said) once every such pull has been replaced
//   BP-1    a pull imported again, the same row for row, leaves What changed naming the pull those rows came in, and says
//           the newest import changed nothing
//   SEAM-6  "the earlier pull What changed compares with is kept" is never said when there is no earlier pull
//   SEAM-7  an import that placed no row in an appropriation is not listed as an empty "2026-11-04: "
//
//   node spend-plan/test/import-review2.test.mjs
//   SFCBSP_PAGE=/path/to/built.html node spend-plan/test/import-review2.test.mjs   (the same checks on a given built page)
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadTool, checks, scratchDir } from './harness.mjs';

const C = checks('import-review2');
const tmp = scratchDir('sfcbsp-imprev2-');
const PAGE = process.env.SFCBSP_PAGE ? readFileSync(process.env.SFCBSP_PAGE, 'utf8') : null;
const T1 = '2026-11-02T15:00:00Z', T2 = '2026-11-09T15:00:00Z', T3 = '2026-11-16T15:00:00Z', T4 = '2026-11-23T15:00:00Z', T5 = '2026-11-30T15:00:00Z';
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const NA = 'Not Allocated';
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const J = x => JSON.stringify(x);
const day = iso => { const d = new Date(iso), p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };

function boot(state, html0) {
  let html = html0 || null;
  if (!html && PAGE) {
    html = PAGE;
    if (state) html = html.replace('<script id="spState" type="application/json">null</script>',
      () => '<script id="spState" type="application/json">' + JSON.stringify(state).replace(/</g, '\\u003c') + '</script>');
  }
  const t = html ? loadTool({ html }) : loadTool({ state });
  const asked = [];
  let answer = true;
  t.window.confirm = qq => { asked.push(String(qq)); return answer; };
  const doc = t.window.document;
  return {
    t, SP: t.SP, doc, asked,
    answer(v) { answer = v; },
    async parse(files, now) { return t.SP.parseFiles(files.map(([name, data]) => ({ name, data })), { now: now || T1 }); },
    async imp(files, now) { return t.SP.applyImport(await this.parse(files, now)); },
    async ui(files) {
      await t.window.ui_import(files.map(([name, data]) => ({
        name, arrayBuffer: async () => (typeof data === 'string' ? new TextEncoder().encode(data).buffer : data) })));
      return { text: doc.getElementById('uiMsg').textContent, cls: doc.getElementById('uiMsg').className };
    },
    view(v) {
      if (typeof t.SP.uiRender === 'function') t.SP.uiRender();
      const b = doc.querySelector('[data-act=view][data-v="' + v + '"]');
      if (b) b.dispatchEvent(new t.window.MouseEvent('click', { bubbles: true }));
      return doc.getElementById('uiMain') || doc.body;
    },
    model() { return t.SP.buildModel(t.SP.state.pulls.current, t.SP.state.settings, t.SP.defaultView()); },
  };
}
const settle = () => new Promise(r => setTimeout(r, 20));
const approved = (SP, ap) => { const M = SP.buildModel(SP.state.pulls.current, SP.state.settings, SP.defaultView()); const a = M.aps.find(x => x.ap === ap); return a ? a.total.approved : 0; };
async function block(name, fn) {
  try { await fn(); } catch (e) { C.chk(name + ': the checks stopped part way: ' + String((e && e.stack) || e).split('\n').slice(0, 2).join(' | '), false); }
}

// A workbook written by hand, zipped by Python: another writer, so the reader is never checked only against itself.
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
// a sheet of the 32 headers and the given rows, each cell inline text, or raw cell XML given as {xml} ('@' is its address)
function sheetOf(rows) {
  const cell = (r, i, v) => typeof v === 'object' && v && v.xml !== undefined ? v.xml.replace('@', L(i) + r)
    : '<c r="' + L(i) + r + '" t="inlineStr"><is><t>' + xs(v) + '</t></is></c>';
  const line = (r, vals) => '<row r="' + r + '">' + vals.map((v, i) => (v === null || v === undefined || v === '' ? '' : cell(r, i, v))).join('') + '</row>';
  return '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'
    + line(1, HEADERS) + rows.map((o, k) => line(k + 2, HEADERS.map(h => o[h]))).join('') + '</sheetData></worksheet>';
}

const ROW = { FY: 2026, Title: 'Invented Title', PMO: 'Alpha Wing (AW)', 'Plan Event': 'Event one', Date: '2026-01-10', Alloc: NA };
const om = (n, amt, pre = 'XX') => Array.from({ length: n }, (_, i) => ({ ...ROW, 'CCaR No': pre + String(100 + i), Budget: 'USAF O&M Discretionary', Amount: String(amt) }));
const ff = (n, amt, pre = 'YY') => Array.from({ length: n }, (_, i) => ({ ...ROW, 'CCaR No': pre + String(100 + i), Budget: 'USAF Full Fund Discretionary', Amount: String(amt) }));
const sp = (n, amt) => Array.from({ length: n }, (_, i) => ({ ...ROW, 'CCaR No': 'SP' + String(100 + i), Budget: 'USAF Initial Spares', Amount: String(amt) }));
const opn = (n, amt) => Array.from({ length: n }, (_, i) => ({ ...ROW, 'CCaR No': 'OP' + String(100 + i), Budget: 'USN OPN', Amount: String(amt) }));
const lost = n => Array.from({ length: n }, (_, i) => ({ ...ROW, 'CCaR No': 'ZZ' + String(100 + i), Budget: 'Mystery Line', Amount: String(425000) }));
const STRAY = { ...ROW, 'CCaR No': 'YY999', Budget: 'USAF Full Fund Discretionary', Amount: '1234' };

try {
  // ===================================================================================================================
  // SEAM-1 — a misfiled row on a sheet whose name names no appropriation
  // ===================================================================================================================
  await block('SEAM-1', async () => {
    for (const [what, file] of [['a CSV named Report', ['Report.csv', csv(om(5, 500000).concat([STRAY]))]],
      ['a workbook whose one sheet is "Report"', ['pull-om.xlsx', xlsx('report.xlsx', { Report: sheetOf(om(5, 500000).concat([STRAY])) })]]]) {
      const T = boot();
      const SP = T.SP;
      await T.imp([['FF Raw Data.csv', csv(ff(40, 1000000))]]);                          // 40 rows, $40,000,000.00
      C.eq('SEAM-1 (' + what + '): (Full Fund on screen: 40 rows, $40,000,000.00)', [SP.state.pulls.current.ff.rows.length, approved(SP, 'ff')], [40, 4000000000]);
      const before = J(SP.state);
      const p = await T.parse([file], T2);
      C.eq('SEAM-1 (' + what + '): (the sheet names no appropriation, so no stray is recorded)', p.report.strays, []);
      T.answer(false);
      const r0 = SP.applyImport(p);
      C.chk('SEAM-1 (' + what + '): the person is asked before 1 row replaces the 40-row Full Fund pull', T.asked.length === 1, J(T.asked));
      C.chk('SEAM-1 (' + what + '): the question says the pull would keep fewer than half its rows, and names the pull it replaces',
        /fewer than half the 40 readable rows of the Full Fund pull on screen/.test(T.asked[0] || '') && /40 rows, \$40,000,000\.00/.test(T.asked[0] || ''), T.asked[0]);
      C.chk('SEAM-1 (' + what + '): Cancel imports nothing and says so', r0 && r0.ok === false && /^Nothing was imported/.test(r0.message) && J(SP.state) === before, J(r0));
      T.answer(true);
      const r1 = SP.applyImport(p);
      C.chk('SEAM-1 (' + what + '): OK imports, and the message is a warning that says the pull shrank',
        r1.ok === true && r1.warn === true && /Check: the Full Fund pull now has 1 readable row \(\$1,234\.00\), where the pull it replaced had 40 \(\$40,000,000\.00\)/.test(r1.message), J(r1));
      C.eq('SEAM-1 (' + what + '): OK: the 40-row pull is kept as previous', SP.state.pulls.previous.ff.rows.length, 40);
      T.t.close();
    }
    // through the page's own Import button: Cancel is an error line, OK a warning
    const P = boot();
    await P.ui([['FF Raw Data.csv', csv(ff(40, 1000000))]]);
    P.answer(false);
    const m0 = await P.ui([['Report.csv', csv(om(5, 500000).concat([STRAY]))]]);
    C.chk('SEAM-1 (page): Cancel: nothing imported, as an error, and Full Fund still $40,000,000.00',
      /msg-err/.test(m0.cls) && /Nothing was imported/.test(m0.text) && approved(P.SP, 'ff') === 4000000000, J(m0));
    P.answer(true);
    const m1 = await P.ui([['Report.csv', csv(om(5, 500000).concat([STRAY]))]]);
    C.chk('SEAM-1 (page): OK: a warning, not a plain success', /msg-warn/.test(m1.cls) && /Check: the Full Fund pull now has 1 readable row/.test(m1.text), J(m1));
    P.t.close();
    // controls: a pull of the same size, and one exactly half the size, ask nothing
    const K = boot();
    await K.imp([['FF Raw Data.csv', csv(ff(4, 100))]]);
    await K.imp([['FF Raw Data.csv', csv(ff(4, 200))]], T2);
    await K.imp([['FF Raw Data.csv', csv(ff(2, 300))]], T3);
    C.eq('SEAM-1 (control): the same number of rows, and exactly half, ask nothing', K.asked, []);
    await K.imp([['FF Raw Data.csv', csv(ff(4, 200))]], T4);
    K.answer(false);
    await K.imp([['FF Raw Data.csv', csv(ff(1, 400))]], T5);
    C.chk('SEAM-1 (boundary): fewer than half (1 of 4) is asked', K.asked.length === 1, J(K.asked));
    K.t.close();
  });

  // ===================================================================================================================
  // SEAM-2 — the advice, and the row given a sheet of its own
  // ===================================================================================================================
  await block('SEAM-2', async () => {
    const T = boot();
    const SP = T.SP;
    await T.imp([['FF Raw Data.csv', csv(ff(40, 1000000))]]);
    const omFile = ['O&M Raw Data.csv', csv(om(30, 500000).concat([STRAY]))];
    const p = await T.parse([omFile], T2);
    T.answer(false);
    const r0 = SP.applyImport(p);
    const qq = T.asked[0] || '';
    C.chk('SEAM-2: the question no longer advises moving the row to "the right sheet"', !/right sheet/.test(qq) && !/its own tab/.test(qq), qq);
    C.chk('SEAM-2: it advises correcting the Budget or taking the row out of this file, and says a sheet of its own would still replace the pull',
      /correct its Budget, or take it out of this file/.test(qq) && /Given a sheet of its own in this file, it would still replace that whole pull/.test(qq), qq);
    C.chk('SEAM-2: Cancel’s message gives the same advice, not "move them to the right sheet"', r0.ok === false && !/right sheet/.test(r0.message)
      && /correct their Budget, or take them out of this file/.test(r0.message), J(r0));
    const lines = SP.importReportLines(p.report).filter(l => /^Every Full Fund row/.test(l));
    C.chk('SEAM-2: the Import report line gives the same advice, not "move it to the Full Fund sheet"',
      lines.length === 1 && !/move it to the Full Fund sheet/.test(lines[0]) && /take it out of this file/.test(lines[0]), J(lines));
    // following the old advice: the row on a sheet of its own, in the same O&M workbook
    const moved = xlsx('moved.xlsx', { 'O&M Raw Data': sheetOf(om(30, 500000)), 'FF Raw Data': sheetOf([STRAY]) });
    const n0 = T.asked.length;
    const r1 = await T.imp([['om-moved.xlsx', moved]], T3);
    C.chk('SEAM-2: the row on a sheet of its own is still asked about before it replaces the 40-row pull',
      T.asked.length === n0 + 1 && /fewer than half the 40 readable rows of the Full Fund pull on screen/.test(T.asked[n0] || '') && r1.ok === false, J([T.asked[n0], r1]));
    C.eq('SEAM-2: (declined, Full Fund is still the 40-row pull)', [SP.state.pulls.current.ff.rows.length, approved(SP, 'ff')], [40, 4000000000]);
    T.t.close();
  });

  // ===================================================================================================================
  // F1 — an O&M sheet by any of its usual names; F5 — a name that mentions two appropriations
  // ===================================================================================================================
  await block('F1', async () => {
    const T = boot();
    for (const name of ['O&M.csv', 'om.csv', 'O&M Raw Data (2).csv', 'OM pull 9 Nov.csv', 'pull-om.csv', 'O & M pull.csv']) {
      const p = await T.parse([[name, csv(om(5, 500000).concat([STRAY]))]]);
      C.eq('F1: the Full Fund row in "' + name + '" is recorded as on a sheet named for O&M',
        (p.report.strays || []).map(x => [x.ap, x.sheetAp, x.rows]), [['ff', 'om', 1]]);
    }
    for (const name of ['Room.csv', 'Export.csv', 'Customs pull.csv']) {
      const p = await T.parse([[name, csv(om(5, 500000).concat([STRAY]))]]);
      C.eq('F1 (control): "' + name + '" names no appropriation, so nothing is recorded', p.report.strays, []);
    }
    // with no Full Fund pull on screen nothing would be lost by size, so the name is the only thing that asks
    const r = await T.imp([['O&M.csv', csv(om(5, 500000).concat([STRAY]))]]);
    C.chk('F1: the O&M file named "O&M.csv" is asked about, on a page with no Full Fund pull', T.asked.length === 1 && /a sheet named for O&M/.test(T.asked[0] || ''), J([T.asked, r]));
    T.t.close();
  });
  await block('F5', async () => {
    const T = boot();
    for (const name of ['FF and OPN pull 9 Nov.csv', 'OPN pull (from FF tool).csv']) {
      const p = await T.parse([[name, csv(opn(3, 2000))]]);
      C.eq('F5: a correct OPN pull named "' + name + '" is not taken for misfiled rows', p.report.strays, []);
    }
    const wb = xlsx('two-names.xlsx', { 'Spares and FF': sheetOf(sp(3, 200).concat(ff(3, 300))) });
    const p2 = await T.parse([['combined.xlsx', wb]]);
    C.eq('F5: a combined sheet named "Spares and FF" holding Spares and Full Fund rows records nothing', p2.report.strays, []);
    await T.imp([['FF and OPN pull 9 Nov.csv', csv(opn(3, 2000))]]);
    C.eq('F5: and nothing is asked', T.asked, []);
    const p3 = await T.parse([['FF Raw Data.csv', csv(opn(3, 2000))]]);
    C.eq('F5 (control): OPN rows alone on a sheet named for Full Fund are still recorded', (p3.report.strays || []).map(x => [x.ap, x.sheetAp]), [['opn', 'ff']]);
    T.t.close();
  });

  // ===================================================================================================================
  // DL-2, F4 — Amounts that cannot be read, and rows that count nowhere
  // ===================================================================================================================
  await block('DL-2, F4', async () => {
    const T = boot();
    const SP = T.SP;
    await T.imp([['O&M Raw Data.csv', csv(om(3, 1000))]]);
    C.eq('DL-2: (O&M on screen: $3,000.00)', approved(SP, 'om'), 300000);
    const before = J(SP.state);
    const bad = om(3, 1000).map(o => ({ ...o, Amount: 'USD 1,000.00' }));
    T.answer(false);
    const r0 = await T.imp([['O&M Raw Data.csv', csv(bad)]], T2);
    C.chk('DL-2: a pull whose every Amount cannot be read is asked about before it replaces the readable one',
      T.asked.length === 1 && /none of them can be read: all 3 could not be read/.test(T.asked[0] || '') && /could not be read \(FY or Amount\) and would count nowhere/.test(T.asked[0] || ''), J(T.asked));
    C.chk('DL-2: Cancel changes nothing', r0.ok === false && J(SP.state) === before, J(r0));
    // the same, as IMP-6's shape: a workbook some program wrote with formulas and no results
    const fx = xlsx('uncalc.xlsx', { 'O&M Raw Data': sheetOf(om(3, 0).map((o, i) => ({ ...o, Amount: { xml: '<c r="@"><f>' + (i + 1) + '000*1</f><v></v></c>' } }))) });
    const r1 = await T.imp([['uncalc.xlsx', fx]], T2);
    C.chk('DL-2: an uncalculated workbook is asked about too', T.asked.length === 2 && /none of them can be read/.test(T.asked[1] || '') && r1.ok === false, J(T.asked[1]));
    T.answer(true);
    const m = await T.ui([['O&M Raw Data.csv', csv(bad)]]);
    C.chk('F4: OK: the message line is a warning, not a plain success', /msg-warn/.test(m.cls) && /Check: the O&M pull now has 0 readable rows/.test(m.text), J(m));
    T.t.close();
    // one unreadable row, and rows no appropriation claims: no question, but a warning
    const W = boot();
    const m2 = await W.ui([['O&M Raw Data.csv', csv(om(3, 1000).concat([{ ...ROW, 'CCaR No': 'XX900', Budget: 'USAF O&M', Amount: 'n/a' }]))]]);
    C.chk('F4: an import with an unreadable row reads as a warning that names it', W.asked.length === 0 && /msg-warn/.test(m2.cls) && /1 O&M row could not be read/.test(m2.text), J(m2));
    const m3 = await W.ui([['O&M Raw Data.csv', csv(om(3, 1000))], ['Export.csv', csv(lost(1))]]);
    C.chk('F4: an import with a row no appropriation claims reads as a warning that names it', /msg-warn/.test(m3.cls) && /appropriation was not identified/.test(m3.text), J(m3));
    const m4 = await W.ui([['O&M Raw Data.csv', csv(om(3, 2000))]]);
    C.chk('F4 (control): a clean import is a plain success', /msg-ok/.test(m4.cls), J(m4));
    W.t.close();
  });

  // ===================================================================================================================
  // SEAM-3 — the rows no appropriation claims stay with their import's pulls
  // ===================================================================================================================
  await block('SEAM-3', async () => {
    const T = boot();
    const SP = T.SP;
    const all = [['O&M Raw Data.csv', csv(om(2, 100000))], ['FF Raw Data.csv', csv(ff(2, 200000))], ['Spares Raw Data.csv', csv(sp(2, 300000))],
      ['OPN Raw Data.csv', csv(opn(2, 400000))], ['Misc Export.csv', csv(lost(2))]];
    await T.imp(all, T1);
    const note = () => T.model().summary.notes.filter(n => /names no appropriation/.test(n));
    C.chk('SEAM-3: (the first import keeps its two unidentified rows, $8,500.00, and the Summary names them)',
      SP.state.pulls.current.unidentified && SP.state.pulls.current.unidentified.rows.length === 2 && note().length === 1, J(note()));
    const r = await T.imp([['FF Raw Data.csv', csv(ff(2, 250000))]], T2);
    C.chk('SEAM-3: an import of Full Fund alone leaves them on screen: O&M, Spares and OPN still come from their file',
      !!SP.state.pulls.current.unidentified && SP.state.pulls.current.unidentified.rows.length === 2, J(Object.keys(SP.state.pulls.current)));
    C.chk('SEAM-3: the Summary still names them', note().length === 1 && note()[0].startsWith('2 rows'), J(note()));
    const rep = T.view('report').textContent.replace(/\s+/g, ' ');
    C.chk('SEAM-3: the Import report view still lists each of them', rep.includes('ZZ100') && rep.includes('ZZ101'), rep.slice(0, 300));
    C.chk('SEAM-3: the message says they stay, and from which import', new RegExp('2 rows whose appropriation was not identified, from the import of ' + day(T1) + ', stay').test(r.message), r.message);
    const spec = SP.excelSpec(T.model(), SP.state.pulls.current, SP.state.settings, { report: SP.state.lastImport.report, today: '2026-11-09' });
    const ir = spec.sheets.find(s => s.name === 'Import Report');
    const txt = ir ? J(ir.rows.map(x => x.cells && x.cells.map(c => c && c.v))) : '';
    C.chk('SEAM-3: the workbook’s Import Report sheet lists them too', txt.includes('ZZ100') && txt.includes('ZZ101'));
    // saved and reopened, they still know which import they came with
    const html = SP.savedHtml();
    T.t.close();
    const R = boot(null, html);
    await settle();
    C.eq('SEAM-3: saved and reopened, they are still on screen', R.SP.state.pulls.current.unidentified && R.SP.state.pulls.current.unidentified.rows.length, 2);
    await R.imp([['FF Raw Data.csv', csv(ff(2, 260000))]], T3);
    C.chk('SEAM-3: and a later import of Full Fund alone still leaves them', !!R.SP.state.pulls.current.unidentified, J(Object.keys(R.SP.state.pulls.current)));
    // once O&M, Spares and OPN are replaced too, nothing on screen came from their file: they go, and the message says so
    const r2 = await R.imp([['O&M Raw Data.csv', csv(om(2, 110000))], ['Spares Raw Data.csv', csv(sp(2, 310000))], ['OPN Raw Data.csv', csv(opn(2, 410000))]], T4);
    C.chk('SEAM-3: once every pull of their import is replaced, they are no longer current, and are kept as previous',
      !R.SP.state.pulls.current.unidentified && R.SP.state.pulls.previous.unidentified && R.SP.state.pulls.previous.unidentified.rows.length === 2);
    C.chk('SEAM-3: the message says so', /2 rows whose appropriation was not identified, from the import of .* are no longer on screen/.test(r2.message), r2.message);
    R.t.close();
  });

  // ===================================================================================================================
  // BP-1 — the same pull imported again; SEAM-6 — with no earlier pull
  // ===================================================================================================================
  await block('BP-1', async () => {
    const T = boot();
    const SP = T.SP;
    const A = ['O&M Raw Data.csv', csv(om(2, 1100))], B = ['O&M Raw Data.csv', csv(om(2, 2200).concat(om(1, 900, 'NEW')))], Cc = ['O&M Raw Data.csv', csv(om(2, 3300))];
    await T.imp([A], T1); await T.imp([B], T2);
    const r = await T.imp([B], T3);
    C.eq('BP-1: (previous is still the first pull)', SP.state.pulls.previous.om.rows.map(x => x.c[9]), [110000, 110000]);
    C.eq('BP-1: the new pull is today’s, and records since when its rows have been on screen', [SP.state.pulls.current.om.importedAt, SP.state.pulls.current.om.sameSince], [T3, T2]);
    C.chk('BP-1: the message says What changed still compares it with the pull before it', /same as the one on screen, row for row, so What changed still compares it with the pull before it/.test(r.message), r.message);
    const v = T.view('changes');
    const sec = v.querySelector('section.chg[data-ap="om"]');
    const h3 = sec ? sec.querySelector('h3').textContent : '';
    C.chk('BP-1: What changed names the pull those rows came in, not the newest import', h3.endsWith('pull of ' + day(T1) + ' → pull of ' + day(T2)), h3);
    const same = sec ? sec.querySelector('[data-same]') : null;
    C.chk('BP-1: and says the newest import changed nothing', !!same && same.textContent.includes('Nothing changed in the O&M pull imported ' + day(T3))
      && same.textContent.includes('the same, row for row, as the pull of ' + day(T2)), same && same.textContent);
    C.chk('BP-1: the view’s heading does not call them the last two pulls', !/between the last two pulls/.test(v.querySelector('h2').textContent), v.querySelector('h2').textContent);
    await T.imp([B], T4);
    C.eq('BP-1: imported a third time, it still dates the rows from their first import', SP.state.pulls.current.om.sameSince, T2);
    await T.imp([Cc], T5);
    C.chk('BP-1 (control): a different pull moves the current one to previous, and says nothing of the same rows',
      SP.state.pulls.previous.om.rows[0].c[9] === 220000 && !SP.state.pulls.current.om.sameSince && !T.view('changes').querySelector('[data-same]'));
    T.t.close();
  });
  await block('SEAM-6', async () => {
    const T = boot();
    const SP = T.SP;
    const X = [['O&M Raw Data.csv', csv(om(2, 1100))], ['FF Raw Data.csv', csv(ff(2, 2200))]];
    await T.imp(X, T1);
    const r = await T.imp(X, T2);
    C.chk('SEAM-6: the same pulls twice in a new page: no "earlier pull … is kept", and it says there is none yet',
      !/earlier pull What changed compares with is kept/.test(r.message) && /no earlier pull of either for What changed to compare with yet/.test(r.message), r.message);
    C.chk('SEAM-6: and the number agrees ("the pulls are the same as the ones on screen")', /pulls are the same as the ones on screen/.test(r.message), r.message);
    C.eq('SEAM-6: (there is indeed no earlier pull)', Object.keys(SP.state.pulls.previous), []);
    T.t.close();
  });

  // ===================================================================================================================
  // SEAM-7 — an import that placed no row in an appropriation, in What changed's list of imports
  // ===================================================================================================================
  await block('SEAM-7', async () => {
    const T = boot();
    await T.imp([['O&M Raw Data.csv', csv(om(1, 100))]], T1);
    await T.imp([['stray.csv', csv(lost(1))]], T2);
    const items = [...T.view('changes').querySelectorAll('ul.notes li')].map(li => li.textContent);
    C.eq('SEAM-7: (two imports are listed)', items.length, 2);
    C.chk('SEAM-7: the import that placed no row says so, not an empty "date: "', /^\d{4}-\d{2}-\d{2}: no pull \(only rows whose appropriation was not identified\)$/.test(items[1] || ''), J(items));
    C.chk('SEAM-7 (control): the other names its pull', /: O&M$/.test(items[0] || ''), J(items));
    T.t.close();
  });
} catch (e) {
  C.chk('the run stopped before the end: ' + String((e && e.stack) || e).split('\n').slice(0, 3).join(' | '), false);
} finally {
  tmp.rm();
}
C.done();
