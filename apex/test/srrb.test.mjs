// The SRRB list (CONTRACT §44): every plan event marked Yes in the CCaR pull's SRRB column, one line a plan event title
// within an appropriation and fiscal year, with its PMO and its plan amounts by service; No and blank are left off. Under
// Briefing. Invented data; every expectation is written out by hand from the rows below.
//
//   node apex/test/srrb.test.mjs
process.env.TZ = 'America/New_York';
import { loadTool, pageHtml, checks } from './harness.mjs';

const C = checks('srrb');
const J = x => JSON.stringify(x);
const settle = (ms = 40) => new Promise(res => setTimeout(res, ms));
// the pull's 32 column headings (CONTRACT §2, restated), and the same with column Y headed SRRB in place of Quantity
const OLD = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];
const NEW = OLD.map(h => (h === 'Quantity' ? 'SRRB' : h));
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = (heads, rows) => [heads.join(',')].concat(rows.map(o => heads.map(h => q(o[h])).join(','))).join('\n');
const EX = 'Actual Execution is allocated', NA = 'Not Allocated', AV = 'Air Vehicle (AV)', PP = 'Propulsion (PP)';
const B = { usaf: 'USAF O&M- Tessa Base Discretionary', ang: 'USAF ANG O&M Tessa', stovl: 'USN STOVL O&M Tessa', sp: 'USAF APN Spares Tessa Base Initial' };
const row = (FY, ccar, Title, Budget, pe, Date, Amount, Alloc, PMO, SRRB) => ({ FY, 'CCaR No': ccar, Title, Budget, 'Plan Event': pe, Date, Amount, Alloc, PMO, SRRB });
// THE PULL:
//   O&M FY2027  1  C1 Tessa A  "Depot Work"    USAF   Dec 2026  1,000,000.00  planned   AV  Yes
//               2  C1 Tessa A  "Depot Work"    ANG    Jan 2027    250,000.50  awarded   AV  yes      <- awarded money is listed too
//               3  C2 Tessa B  "depot work "   STOVL  Jan 2027    300,000.00  planned   PP  YES      <- the same title on another record and PMO: the same line
//               4  C1 Tessa A  "Depot Work"    USAF   Feb 2027    400,000.00  planned   AV  (blank)  <- not marked: not in the line's amounts
//               5  C3 Tessa C  "Field Reps"    USAF   no date     500,000.00  planned   PP  Y
//               6  C4 Tessa D  "Not Needed"    USAF   Nov 2026    900,000.00  planned   AV  No
//               7  C5 Tessa E  "Blank One"     USAF   Nov 2026    800,000.00  planned   AV  (blank)
//   O&M FY2028  8  C1 Tessa A  "Depot Work"    USAF   Dec 2027    600,000.00  planned   AV  Yes      <- another year: a line of its own
//   Spares 2027 9  C6 Tessa F  "Spares Kit"    USAF   Mar 2027    700,000.00  planned   PP  Yes
const OM = [row(2027, 'C1', 'Tessa A', B.usaf, 'Depot Work', '2026-12-01', '1000000', NA, AV, 'Yes'), row(2027, 'C1', 'Tessa A', B.ang, 'Depot Work', '2027-01-15', '250000.50', EX, AV, 'yes'),
  row(2027, 'C2', 'Tessa B', B.stovl, 'depot work ', '2027-01-20', '300000', NA, PP, 'YES'), row(2027, 'C1', 'Tessa A', B.usaf, 'Depot Work', '2027-02-01', '400000', NA, AV, ''),
  row(2027, 'C3', 'Tessa C', B.usaf, 'Field Reps', '', '500000', NA, PP, 'Y'), row(2027, 'C4', 'Tessa D', B.usaf, 'Not Needed', '2026-11-01', '900000', NA, AV, 'No'),
  row(2027, 'C5', 'Tessa E', B.usaf, 'Blank One', '2026-11-01', '800000', NA, AV, ''), row(2028, 'C1', 'Tessa A', B.usaf, 'Depot Work', '2027-12-01', '600000', NA, AV, 'Yes')];
const SPR = [row(2027, 'C6', 'Tessa F', B.sp, 'Spares Kit', '2027-03-01', '700000', NA, PP, 'Yes')];
const MODS = ['util', 'xlsx-read', 'import', 'engine', 'publish', 'pdf', 'xlsx-write', 'store'];
const errs = t => t.errors.filter(e => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click|HTMLCanvasElement)/.test(String(e)));
const NOW = '2026-11-09T12:00:00.000Z';

try {
  // ============================================================================ the list itself (SP.srrbView)
  const t = loadTool({ modules: MODS }), SP = t.SP;
  SP.storeInit();
  const got = SP.applyImport(await SP.parseFiles([{ name: 'om.csv', data: csv(NEW, OM) }, { name: 'sp.csv', data: csv(NEW, SPR) }], { now: NOW }));
  C.chk('a pull whose column Y is headed SRRB in place of Quantity is imported', !!SP.state.pulls.current.om && SP.state.pulls.current.om.rows.length === 8 && SP.state.pulls.current.sp.rows.length === 1, J(got && got.message));
  SP.setSettings({ asOf: '2026-10' });
  C.eq('a row’s SRRB cell is read as it is written; Yes and Y, in any case, are a mark', J([SP.state.pulls.current.om.rows.map(r => SP.srrbOfRow(r)), ['Yes', 'yes', ' YES ', 'Y', 'No', '', 'Yes please', 'N', null].map(x => SP.srrbYes(x))]),
    J([['Yes', 'yes', 'YES', '', 'Y', 'No', '', 'Yes'], [true, true, true, true, false, false, false, false, false]]));
  const model = v => SP.buildModel(SP.state.pulls.current, SP.state.settings, v || SP.defaultView(), null);
  const M = model();
  const view = (F, Mx, v) => SP.srrbView(Mx || M, SP.state.pulls.current, v || SP.defaultView(), F || {});
  const V = view();
  const brief = l => [l.apLabel + ' FY' + l.fy, l.title, l.ccars, l.pmos.map(p => p.label), l.months, l.nodate, l.amt, l.sum, l.other];
  C.eq('the service columns are the six, in their order', J(V.svc.map(s => s.label)), J(['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC CV', 'USN CV']));
  C.eq('four lines: one a plan event title within an appropriation and fiscal year, only its rows marked Yes added up, by service', J(V.lines.map(brief)), J([
    ['O&M FY2027', 'Depot Work', ['C1', 'C2'], [AV, PP], ['2026-12', '2027-01'], false, [100000000, 25000050, 0, 30000000, 0, 0], 155000050, 40000000],
    ['O&M FY2027', 'Field Reps', ['C3'], [PP], [], true, [50000000, 0, 0, 0, 0, 0], 50000000, 0],
    ['O&M FY2028', 'Depot Work', ['C1'], [AV], ['2027-12'], false, [60000000, 0, 0, 0, 0, 0], 60000000, 0],
    ['Initial Spares FY2027', 'Spares Kit', ['C6'], [PP], ['2027-03'], false, [70000000, 0, 0, 0, 0, 0], 70000000, 0]]));
  C.chk('a plan event marked No and one left blank are not listed', !V.lines.some(l => /Not Needed|Blank One/.test(l.title)) && V.all === 4 && V.n === 4);
  C.eq('the total row adds the lines, service by service', J([V.total.amt, V.total.sum]), J([[280000000, 25000050, 0, 30000000, 0, 0], 335000050]));
  C.eq('by PMO: each PMO’s own marked rows (a plan event on two PMOs is in both bars, by their rows), largest first', J(V.byPmo.map(x => [x.label, x.sum])), J([[AV, 185000050], [PP, 150000000]]));
  C.eq('by service', J(V.bySvc.map(x => [x.label, x.sum])), J([['USAF', 280000000], ['ANG', 25000050], ['AFRC', 0], ['STOVL', 30000000], ['USMC CV', 0], ['USN CV', 0]]));
  C.eq('the pickers offer what the list holds', J(V.picks), J({ pmos: [['air vehicle (av)', AV], ['propulsion (pp)', PP]], aps: [['om', 'O&M'], ['sp', 'Initial Spares']], fys: [['2027', 'FY2027'], ['2028', 'FY2028']] }));
  C.eq('groups: an appropriation and fiscal year each', J(V.groups.map(g => [g.apLabel + ' FY' + g.fy, g.lines.length])), J([['O&M FY2027', 2], ['O&M FY2028', 1], ['Initial Spares FY2027', 1]]));
  const titles = F => view(F).lines.map(l => l.apLabel + ' FY' + l.fy + ' ' + l.title);
  C.eq('PMO Propulsion: every line that PMO is on, the shared one too', J(titles({ pmo: 'propulsion (pp)' })), J(['O&M FY2027 Depot Work', 'O&M FY2027 Field Reps', 'Initial Spares FY2027 Spares Kit']));
  C.eq('appropriation, fiscal year, and the Find box by plan event or CCaR number', J([titles({ ap: 'sp' }), titles({ fy: '2028' }), titles({ q: 'c2' }), titles({ q: 'FIELD' }), titles({ q: 'zzz' })]),
    J([['Initial Spares FY2027 Spares Kit'], ['O&M FY2028 Depot Work'], ['O&M FY2027 Depot Work'], ['O&M FY2027 Field Reps'], []]));
  // a service switched off: its rows are not in the model, and it has no column
  const off = SP.defaultView(); off.svc.USAF = false;
  const Voff = view({}, model(off), off);
  C.eq('USAF off: no USAF column, and only what the other services carry is listed', J([Voff.svc.map(s => s.label), Voff.lines.map(l => [l.title, l.amt, l.sum])]),
    J([['ANG', 'AFRC', 'STOVL', 'USMC CV', 'USN CV'], [['Depot Work', [25000050, 0, 30000000, 0, 0], 55000050]]]));
  C.chk('the derived row as JSON is what it was: the SRRB mark is not one of its own keys', !Object.keys(SP.deriveRow(SP.state.pulls.current.om.rows[0], SP.state.settings)).includes('srrb')
    && SP.deriveRow(SP.state.pulls.current.om.rows[0], SP.state.settings).srrb === 'Yes');
  t.close();

  // ---- a pull with no SRRB column, and one whose column marks nothing
  const t0 = loadTool({ modules: MODS });
  t0.SP.storeInit();
  t0.SP.applyImport(await t0.SP.parseFiles([{ name: 'om.csv', data: csv(OLD, OM) }], { now: NOW }));
  t0.SP.setSettings({ asOf: '2026-10' });
  const V0 = t0.SP.srrbView(t0.SP.buildModel(t0.SP.state.pulls.current, t0.SP.state.settings, t0.SP.defaultView(), null), t0.SP.state.pulls.current, t0.SP.defaultView(), {});
  C.eq('a pull with no SRRB column: nothing is listed, and it says the column is not there', J([V0.has, V0.all]), J([false, 0]));
  t0.close();

  // ============================================================================ on the page
  const A = loadTool({ html: pageHtml({}) }), W = A.window, doc = W.document, S = A.SP;
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  const main = () => doc.getElementById('uiMain');
  const click = async el => { el.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); await settle(); };
  S.applyImport(await S.parseFiles([{ name: 'om.csv', data: csv(OLD, OM) }], { now: NOW }));
  S.setSettings({ asOf: '2026-10' });
  await settle(60);
  const nav = () => doc.querySelector('#uiNav [data-act=view][data-v="srrb"]');
  C.chk('one item in the menu, SRRB, under Briefing, between Slide blocks and Publish PDFs', !!nav() && nav().textContent === 'SRRB' && nav().closest('.navg').getAttribute('aria-label') === 'Briefing'
    && nav().previousElementSibling.textContent === 'Slide Blocks' && nav().nextElementSibling.textContent === 'Spend Plan PDFs');
  await click(nav());
  C.chk('with a pull that has no SRRB column the page says so', /The CCaR pull loaded has no column headed SRRB/.test(main().querySelector('#uiSrrbEmpty').textContent) && !main().querySelector('#uiSrrbT'));
  S.applyImport(await S.parseFiles([{ name: 'om.csv', data: csv(NEW, OM.map(r => Object.assign({}, r, { SRRB: r.SRRB === 'No' ? 'No' : '' }))) }], { now: '2026-11-10T12:00:00.000Z' }));
  await settle(60); await click(nav());
  C.chk('with the column there and nothing marked Yes it says that', /No plan event is marked Yes in the SRRB column\.$/.test(main().querySelector('#uiSrrbEmpty').textContent), main().textContent.slice(0, 200));
  S.applyImport(await S.parseFiles([{ name: 'om.csv', data: csv(NEW, OM) }, { name: 'sp.csv', data: csv(NEW, SPR) }], { now: '2026-11-11T12:00:00.000Z' }));
  await settle(60); await click(nav());
  const heads = () => [...main().querySelectorAll('#uiSrrbT thead th')].map(th => th.textContent);
  const rows = () => [...main().querySelectorAll('#uiSrrbT tbody tr[data-srrb]')].map(tr => [...tr.children].map((c, i) => (i === 0 ? [...c.children].map(x => x.textContent).join(' | ') : i === 1 ? [...c.querySelectorAll('.srrbp')].map(x => x.textContent).join(' + ') : c.textContent)));
  C.eq('the list’s columns', J(heads()), J(['Requirement (Plan Event Title)', 'PMO', 'Award date', 'USAF', 'ANG', 'AFRC', 'STOVL', 'USMC CV', 'USN CV', 'Total ($M)', 'SRRB']));
  C.eq('the list, cell by cell, in $M', J(rows()), J([
    ['Depot Work | C1, C2 | 0.40 ($M) of this plan event is on rows not marked Yes, and is not counted', AV + ' + ' + PP, 'Dec-2026, Jan-2027', '1.00', '0.25', '-', '0.30', '-', '-', '1.55', 'Yes'],
    ['Field Reps | C3', PP, 'No date', '0.50', '-', '-', '-', '-', '-', '0.50', 'Yes'],
    ['Depot Work | C1', AV, 'Dec-2027', '0.60', '-', '-', '-', '-', '-', '0.60', 'Yes'],
    ['Spares Kit | C6', PP, 'Mar-2027', '0.70', '-', '-', '-', '-', '-', '0.70', 'Yes']]));
  C.eq('the group headings and the total row', J([[...main().querySelectorAll('#uiSrrbT tr.ugrp')].map(x => x.textContent), [...main().querySelectorAll('#uiSrrbT tr.band td.n')].map(x => x.textContent)]),
    J([['O&M FY2027', 'O&M FY2028', 'Initial Spares FY2027'], ['2.80', '0.25', '-', '0.30', '-', '-', '3.35']]));
  const tile = id => { const x = main().querySelector('.tile[data-tile=' + id + ']'); return [x.querySelector('.tv').textContent, x.querySelector('.ts').textContent]; };
  C.eq('the tiles', J([tile('sum'), tile('n'), tile('pmo'), tile('svc')]), J([['3.35', '4 requirements, 3 appropriations and years'], ['4', 'plan events marked Yes, over 2 PMOs'], [AV, '1.85 ($M)'], ['USAF', '2.80 ($M)']]));
  C.eq('the two charts', J([...main().querySelectorAll('.card[data-list]')].map(c => [c.querySelector('h3').textContent, [...c.querySelectorAll('li')].map(li => li.querySelector('.fp').textContent + ' ' + li.querySelector('.fa').textContent)])),
    J([['SRRB requirements by PMO ($M)', [AV + ' 1.85', PP + ' 1.50']], ['SRRB requirements by service ($M)', ['USAF 2.80', 'ANG 0.25', 'AFRC -', 'STOVL 0.30', 'USMC CV -', 'USN CV -']]]));
  C.chk('the page says how many it lists and through which month', /Plan events marked Yes in the CCaR pull’s SRRB column · Data through Oct-2026 · 4 requirements/.test(main().querySelector('.ovsub').textContent), main().querySelector('.ovsub').textContent);
  // the pickers and the Find box
  const pick = async (f, label) => { const s = main().querySelector('select[data-act=srrbf][data-f=' + f + ']'); s.value = [...s.options].find(o => o.textContent === label).value; s.dispatchEvent(new W.Event('change', { bubbles: true })); await settle(); };
  await pick('pmo', PP);
  C.eq('PMO Propulsion picked: three lines, the count and the total follow', J([rows().map(r => r[0].split(' | ')[0]), main().querySelector('#uiSrrbN').textContent, [...main().querySelectorAll('#uiSrrbT tr.band td.n')].pop().textContent]),
    J([['Depot Work', 'Field Reps', 'Spares Kit'], '3 of 4 requirements', '2.75']));
  await click(main().querySelector('[data-act=srrbclear]'));
  const box = doc.getElementById('uiSrrbQ'); box.focus(); box.value = 'field'; box.dispatchEvent(new W.Event('input', { bubbles: true })); await settle();
  C.chk('typing in Find narrows the list and the box keeps the keyboard', J(rows().map(r => r[0].split(' | ')[0])) === J(['Field Reps']) && doc.activeElement === doc.getElementById('uiSrrbQ') && main().querySelector('#uiSrrbN').textContent === '1 of 4 requirements');
  doc.getElementById('uiSrrbQ').value = 'nothing like it'; doc.getElementById('uiSrrbQ').dispatchEvent(new W.Event('input', { bubbles: true })); await settle();
  C.chk('a search that matches nothing says so', /No SRRB requirement matches/.test(main().querySelector('#uiSrrbNone').textContent));
  await click(main().querySelector('[data-act=srrbclear]'));
  // nothing on the page changes the plan; a line opens the requirement
  const before = J(S.state);
  await click(main().querySelector('#uiSrrbT tbody tr[data-srrb] .tg'));
  C.chk('pressing a line opens Requirements searched for that plan event, and changes nothing in the plan', /Find a requirement|Requirements/.test(main().textContent.slice(0, 200)) && doc.getElementById('uiFindQ') && doc.getElementById('uiFindQ').value === 'Depot Work' && J(S.state) === before,
    main().textContent.slice(0, 120));
  // a view-only copy has the page
  const vo = loadTool({ html: S.viewOnlyHtml('2026-11-12T13:00:00.000Z') });
  for (let i = 0; i < 200 && !vo.window.document.getElementById('uiMain'); i++) await settle(5);
  vo.window.document.querySelector('#uiNav [data-v=srrb]').dispatchEvent(new vo.window.MouseEvent('click', { bubbles: true })); await settle(60);
  C.eq('a view-only copy has the SRRB page, with the same list', J([...vo.window.document.querySelectorAll('#uiSrrbT tbody tr[data-srrb] .tg')].map(x => x.textContent)), J(['Depot Work', 'Field Reps', 'Depot Work', 'Spares Kit']));
  C.eq('no script error in the view-only copy', J(errs(vo)), '[]');
  vo.close();
  C.eq('no script error on the page', J(errs(A)), '[]');
  A.close();
} catch (err) {
  console.error(err);
  C.chk('the test ran to its end', false, (err && err.message) || String(err));
}
C.done();
