// A year left out entirely (CONTRACT §23): O&M FY2025 by default. A small invented plan, every expectation worked by hand:
// the model, the comparison of two pulls, every screen, and the workbook hold nothing of it; the Import report alone says
// how many rows were left out; the saved plan still holds them; and settings.leftOut decides which year it is.
//
//   node apex/test/left-out.test.mjs
process.env.TZ = 'America/New_York';
import { loadTool, pageHtml, checks } from './harness.mjs';

const C = checks('left-out');
const J = x => JSON.stringify(x);
const settle = (ms = 20) => new Promise(res => setTimeout(res, ms));
const NOW = '2026-11-09T12:00:00.000Z';
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const baeCsv = rows => ['Budget Name,Budget FY Numeric,Budget Approved Amount,Budget Authorized Amount'].concat(rows.map(r => r.map(q).join(','))).join('\n');
const EX = 'Actual Execution is allocated', NA = 'Not Allocated';
const row = (FY, ccar, Title, Budget, pe, Date, Amount, Alloc) => ({ FY, 'CCaR No': ccar, Title, Budget, 'Plan Event': pe, Date, Amount, Alloc, PMO: 'Air Vehicle (AV)' });
const B_OM = 'USAF O&M- Quill Base Discretionary AV', B_OLD = 'USAF O&M- Oldline Base Discretionary AV', B_SP = 'USAF APN Spares Quill Base Initial';
const D = d => Math.round(d * 100);
// Data through Oct-2026.
//   O&M FY2025     Oldmoney Alpha  4.0M awarded Mar 2025; Oldmoney Beta 1.5M planned Jan 2027      <- left out: 2 rows, 5.5M,
//                  on a budget of their own (Oldline), which no other row uses
//   O&M FY2026     Quill One       2.0M awarded Dec 2025
//   O&M FY2027     Quill Two       3.0M planned Mar 2027
//   Spares FY2025  Quill Spare     1.0M awarded Jun 2025                                           <- FY2025 of another appropriation stays
const OM = [
  row(2025, 'QL0001', 'Oldmoney Alpha', B_OLD, 'Q1', '2025-03-10', '4000000', EX),
  row(2025, 'QL0002', 'Oldmoney Beta', B_OLD, 'Q2', '2027-01-12', '1500000', NA),
  row(2026, 'QL0003', 'Quill One', B_OM, 'Q3', '2025-12-01', '2000000', EX),
  row(2027, 'QL0004', 'Quill Two', B_OM, 'Q4', '2027-03-10', '3000000', NA),
];
const SPR = [row(2025, 'QL0005', 'Quill Spare', B_SP, 'Q5', '2025-06-02', '1000000', EX)];
// the same pull with only its O&M FY2025 rows changed: a comparison must show nothing
const OM2 = OM.map(r => (r.FY === 2025 ? Object.assign({}, r, { Amount: String(Number(r.Amount) + 250000) }) : r));
// a report: O&M FY2025 9.0M / 8.0M (left out), O&M FY2026 2.5M / 2.4M, O&M FY2027 3.5M / 3.0M, Spares FY2025 1.2M / 1.1M
const BAE = [[B_OLD, 2025, '9000000', '8000000'], [B_OM, 2026, '2500000', '2400000'], [B_OM, 2027, '3500000', '3000000'], [B_SP, 2025, '1200000', '1100000']];
const files = (om, bae) => [{ name: 'om.csv', data: csv(om) }, { name: 'sp.csv', data: csv(SPR) }].concat(bae ? [{ name: 'bae.csv', data: baeCsv(bae) }] : []);

try {
  // ============================================================================================ the model
  const tt = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine', 'xlsx-write', 'export', 'store'] });
  const SP = tt.SP;
  const P = await SP.parseFiles(files(OM, BAE), { now: NOW }), P2 = await SP.parseFiles(files(OM2, null), { now: NOW });
  const S = Object.assign(SP.defaultSettings('2026-11-09'), { asOf: '2026-10', firstFY: 2025 });
  const V = SP.defaultView();
  C.chk('the default settings carry no list: O&M FY2025 is the tool’s own default', !('leftOut' in S) && J(SP.LEFT_OUT_DEFAULT) === J(['om|2025']));
  const M = SP.buildModel(P.pulls, S, V), keys = m => m.blocks.map(b => b.key);
  C.eq('no O&M FY2025 block; FY2025 of another appropriation stays', keys(M), ['om|2026', 'om|2027', 'sp|2025']);
  C.eq('the TOTAL is the other three blocks: 2.0 + 3.0 + 1.0', [M.summary.total.approved, M.summary.total.obligated], [D(6e6), D(3e6)]);
  C.eq('the rows the model works from', M.rowsByAp, { om: 2, sp: 1 });
  C.chk('nothing is "excluded" or "before the first FY" on its account', M.excluded.beforeFirst.rows === 0 && !J(M.excluded).includes('2025'), J(M.excluded));
  C.eq('the model says what it left out', M.leftOut, [{ ap: 'om', fy: 2025, rows: 2, reportRows: 0 }]);
  C.chk('no requirement of it', !SP.requirementsOf(M).some(r => /Oldmoney/.test(r.title)) && SP.requirementsOf(M).length === 3);
  C.chk('no word of it anywhere in the model but that count', !J(Object.assign({}, M, { leftOut: null })).includes('Oldmoney') && !J(Object.assign({}, M, { leftOut: null })).includes('om|2025'));
  const Mall = SP.buildModel(P.pulls, Object.assign({}, S, { leftOut: [] }), V);
  C.eq('with an empty list nothing is left out', [keys(Mall), Mall.summary.total.approved, Mall.leftOut], [['om|2025', 'om|2026', 'om|2027', 'sp|2025'], D(11.5e6), undefined]);
  const Msp = SP.buildModel(P.pulls, Object.assign({}, S, { leftOut: ['sp|2025'] }), V);
  C.eq('the list decides which year: Initial Spares FY2025 instead', [keys(Msp), Msp.leftOut], [['om|2025', 'om|2026', 'om|2027'], [{ ap: 'sp', fy: 2025, rows: 1, reportRows: 0 }]]);
  C.eq('a list entry that is not "appropriation|year" is ignored', keys(SP.buildModel(P.pulls, Object.assign({}, S, { leftOut: ['om', 2025, 'OM|2025', 'om|25'] }), V)), keys(Mall));
  // with the report
  const Mb = SP.buildModel(P.pulls, S, V, P.bae);
  const blk = k => Mb.blocks.find(b => b.key === k);
  C.eq('the report’s O&M FY2025 row gives no figure and no block', [keys(Mb), Object.keys(Mb.bae.byBlock)], [['om|2026', 'om|2027', 'sp|2025'], ['om|2026', 'om|2027', 'sp|2025']]);
  C.eq('Approved and Authorized are the report’s other rows: 2.5 + 3.5 + 1.2 and 2.4 + 3.0 + 1.1', [Mb.summary.total.approved, Mb.summary.total.authorized, blk('om|2026').approved], [D(7.2e6), D(6.5e6), D(2.5e6)]);
  C.eq('… and the report’s row is counted as left out', Mb.leftOut, [{ ap: 'om', fy: 2025, rows: 2, reportRows: 1 }]);
  C.chk('no list of the report names it (no block, uncovered, report only)', !J([Mb.bae.noBlock, Mb.bae.uncovered, Mb.bae.reportOnly, Mb.summary.notes]).includes('2025') || !/O&M FY2025/.test(J([Mb.bae.noBlock, Mb.bae.uncovered, Mb.summary.notes])),
    J([Mb.bae.noBlock, Mb.bae.uncovered]));
  C.eq('the report’s tally counts the rows that are left: 3', SP.baeTally(P.bae, S, V).rows, 3);
  // the comparison of two pulls
  const dif = SP.diffPulls(P.pulls, P2.pulls, S), difAll = SP.diffPulls(P.pulls, P2.pulls, Object.assign({}, S, { leftOut: [] }));
  C.eq('a pull that differs only in O&M FY2025 rows shows no change', [dif.om.totals.approved, Object.keys(dif.om.byBlock)], [[D(5e6), D(5e6)], ['om|2026', 'om|2027']]);
  C.eq('… and with nothing left out the same two pulls differ by 0.5M', difAll.om.totals.approved, [D(10.5e6), D(11e6)]);
  // the lines for the Import report
  C.eq('the Import report’s one line', SP.leftOutLines(Mb), ['O&M FY2025: 2 CCaR pull rows and 1 BAE report row. They are in no figure, block, list, picture or sheet; the files and the saved plan still hold them.']);
  C.eq('… and none when nothing was left out', SP.leftOutLines(Mall), []);
  // the workbook
  const spec = SP.excelSpec(Mb, P.pulls, S, { report: P.report, bae: P.bae, today: '2026-11-09' });
  const cells = sh => sh.rows.flatMap(r => (r.cells || r).map(c => (c && typeof c === 'object' ? c.v : c))).filter(v => v !== null && v !== undefined);
  const byName = Object.fromEntries(spec.sheets.map(s => [s.name, cells(s)]));
  C.chk('the workbook has the sheets to look in', ['Summary', 'O&M Raw Data', 'BAE Report', 'Import Report'].every(n => byName[n] && byName[n].length), Object.keys(byName).join());
  C.chk('no sheet names an Oldmoney requirement or its Oldline budget (the Settings sheet’s budget list included)', !Object.values(byName).some(v => v.some(x => /Oldmoney|Oldline/.test(String(x)))));
  C.eq('O&M Raw Data holds the two rows that are left, by title', byName['O&M Raw Data'].filter(x => /^(Oldmoney|Quill)/.test(String(x))), ['Quill One', 'Quill Two']);
  C.eq('BAE Report holds the three rows that are left, by FY', byName['BAE Report'].filter(x => x === 2025 || x === 2026 || x === 2027), [2026, 2027, 2025]);
  const named = Object.entries(byName).filter(([, v]) => v.some(x => /O&M FY2025/.test(String(x)))).map(([n]) => n);
  C.eq('only the Import Report sheet names O&M FY2025, in the section’s one line', [named, byName['Import Report'].filter(x => /O&M FY2025/.test(String(x)))],
    [['Import Report'], ['  O&M FY2025: 2 CCaR pull rows and 1 BAE report row. They are in no figure, block, list, picture or sheet; the files and the saved plan still hold them.']]);
  tt.close();

  // ============================================================================================ every screen
  const t2 = loadTool({ html: pageHtml({}) });
  const W = t2.window, doc = W.document;
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  t2.SP.applyImport(await t2.SP.parseFiles(files(OM, BAE), { now: NOW }));
  t2.SP.setSettings({ asOf: '2026-10' }); await settle(40);
  const views = [...doc.querySelectorAll('[data-act=view]')].map(b => b.getAttribute('data-v'));
  C.chk('the page has its views', views.length >= 8, views.join());
  const seen = [];
  for (const v of views) {
    doc.querySelector('[data-act=view][data-v="' + v + '"]').dispatchEvent(new W.MouseEvent('click', { bubbles: true })); await settle(30);
    const m = doc.getElementById('uiMain'), text = m.textContent;
    if (/Oldmoney|Oldline/.test(text) || m.querySelector('[data-bk="om|2025"]') || (v !== 'report' && /O&M FY2025/.test(text))) seen.push(v);
  }
  C.eq('no view shows a requirement, a budget, a block or a word of O&M FY2025 (Settings’ budget list included)', seen, []);
  doc.getElementById('uiHelp').dispatchEvent(new W.MouseEvent('click', { bubbles: true })); await settle(30);
  const help = doc.getElementById('uiMain').textContent;
  C.chk('Help says O&M FY2025 is left out entirely, in place of the rule on its OBBBA funding', /O&M FY2025 is left out entirely \(Brad, 13 Nov 2026\)/.test(help) && !/FY2025 O&M OBBBA funding is left out/.test(help), help.slice(0, 80));
  doc.querySelector('[data-act=view][data-v="report"]').dispatchEvent(new W.MouseEvent('click', { bubbles: true })); await settle(30);
  const sec = doc.querySelector('#uiMain section.leftout');
  C.eq('the Import report alone says what was left out', sec && [sec.querySelector('h3').textContent, sec.textContent.includes('O&M FY2025: 2 CCaR pull rows and 1 BAE report row.')], ['Left out of APEX entirely', true]);
  C.chk('the saved plan still holds the rows', t2.SP.state.pulls.current.om.rows.length === 4 && t2.SP.state.bae.current.rows.length === 4 && !('leftOut' in t2.SP.state.settings));
  C.eq('no script error', t2.errors.filter(e => !/^Not implemented/.test(String(e))), []);
  t2.close();
} catch (e) {
  C.chk('the run stopped before the end: ' + String((e && e.stack) || e).split('\n').slice(0, 3).join(' | '), false);
}
C.done();
