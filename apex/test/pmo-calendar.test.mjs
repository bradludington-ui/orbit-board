// My PMO and the Award calendar (CONTRACT §21): the requirements of find.test.mjs's small invented plan, grouped two other
// ways. Every expectation is worked by hand from the plan below, and the calendar's totals are held to the blocks' own columns.
//
//   node apex/test/pmo-calendar.test.mjs
process.env.TZ = 'America/New_York';
import { loadTool, pageHtml, checks } from './harness.mjs';

const C = checks('pmo-calendar');
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
const row = (FY, ccar, Title, Budget, pe, Date, Amount, Alloc, PMO) => ({ FY, 'CCaR No': ccar, Title, Budget, 'Plan Event': pe, Date, Amount, Alloc, PMO: PMO || 'Air Vehicle (AV)' });
const B_OM = 'USAF O&M- Tessa Base Discretionary AV', B_SP = 'USAF APN Spares Tessa Base Initial';
// Data through Oct-2026. Seven requirements:
//   O&M FY2026  Tessa C  2.0M awarded Dec 2025                                   -> Awarded
//               Tessa D  2.0M planned Dec 2026                                   -> Dec 2026
//   O&M FY2027  Garnet Rework  0.7M, no date                                     -> No date
//               Tessa A  3.0M awarded Oct 2026                                   -> Awarded
//               Tessa B  5.0M planned Mar 2027                                   -> Mar 2027
//               Tessa F  1.0M awarded Oct 2026; 0.5M planned Aug 2026 (closed, not awarded); 2.0M planned Feb 2027 -> Was Aug 2026
//   Initial Spares FY2027  Tessa E  1.0M planned Jun 2027, another PMO           -> Jun 2027
const OM = [
  row(2027, 'TS0001', 'Tessa A', B_OM, 'T1', '2026-10-15', '3000000', EX),
  row(2027, 'TS0002', 'Tessa B', B_OM, 'T2', '2027-03-10', '5000000', NA),
  row(2026, 'TS0003', 'Tessa C', B_OM, 'T3', '2025-12-01', '2000000', EX),
  row(2026, 'TS0004', 'Tessa D', B_OM, 'T4', '2026-12-05', '2000000', NA),
  row(2027, 'TS0006', 'Tessa F', B_OM, 'T6 lot one', '2026-10-05', '1000000', EX),
  row(2027, 'TS0006', 'Tessa F', B_OM, 'T6 lot two', '2026-08-10', '500000', NA),
  row(2027, 'TS0006', 'Tessa F', B_OM, 'T6 lot three', '2027-02-01', '2000000', NA),
  row(2027, 'TS0007', 'Garnet Rework', B_OM, 'T7', '', '700000', NA),
];
const SPR = [row(2027, 'TS0005', 'Tessa E', B_SP, 'T5', '2027-06-01', '1000000', NA, 'Propulsion (PP)')];
const D = d => Math.round(d * 100);
const WANT = [   // [block, title, CCaR, planned, awarded, still to award, state, next]
  ['om|2026', 'Tessa C', 'TS0003', D(2e6), D(2e6), 0, 'awarded', null],
  ['om|2026', 'Tessa D', 'TS0004', D(2e6), 0, D(2e6), 'planned', '2026-12'],
  ['om|2027', 'Garnet Rework', 'TS0007', D(0.7e6), 0, D(0.7e6), 'nodate', null],
  ['om|2027', 'Tessa A', 'TS0001', D(3e6), D(3e6), 0, 'awarded', null],
  ['om|2027', 'Tessa B', 'TS0002', D(5e6), 0, D(5e6), 'planned', '2027-03'],
  ['om|2027', 'Tessa F', 'TS0006', D(3.5e6), D(1e6), D(2.5e6), 'late', '2026-08'],
  ['sp|2027', 'Tessa E', 'TS0005', D(1e6), 0, D(1e6), 'planned', '2027-06'],
];

async function boot(html) {
  const tt = loadTool({ html });
  const W = tt.window, doc = W.document;
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  const T = {
    t: tt, W, doc, SP: tt.SP, main: () => doc.getElementById('uiMain'),
    click(el) { el.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); },
    async view(v) { T.click(doc.querySelector('[data-act=view][data-v="' + v + '"]')); await settle(); return T.main(); },
    async type(s) { const b = doc.getElementById('uiFindQ'); b.focus(); b.value = s; b.dispatchEvent(new W.Event('input', { bubbles: true })); await settle(); return T.main(); },
    async pick(f, label) { const s = T.main().querySelector('select[data-f=' + f + ']'); s.value = [...s.options].find(o => o.textContent === label).value; s.dispatchEvent(new W.Event('change', { bubbles: true })); await settle(); return T.main(); },
    rows: () => [...T.main().querySelectorAll('#uiFindRes tbody tr')].map(tr => { const n = [...tr.querySelectorAll('td.n')].map(td => Number(td.getAttribute('data-c') || 0));
      return [tr.querySelector('.tg').textContent, tr.querySelector('.fsub').textContent, tr.children[1].textContent, n[0], n[1], n[2], tr.querySelector('.when').textContent]; }),
    pressed: () => (doc.querySelector('#uiNav [aria-pressed=true]') || { getAttribute: () => '' }).getAttribute('data-v'),
    errors: () => tt.errors.filter(e => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click)/.test(String(e))),
  };
  return T;
}
const files = bae => [{ name: 'om.csv', data: csv(OM) }, { name: 'sp.csv', data: csv(SPR) }].concat(bae ? [{ name: 'bae.csv', data: baeCsv(bae) }] : []);
const modelOf = T => T.SP.buildModel(T.SP.state.pulls.current, T.SP.state.settings, T.SP.getView ? T.SP.getView() : T.SP.defaultView(), T.SP.state.bae && T.SP.state.bae.current);

try {
  const T = await boot(pageHtml({}));
  T.SP.applyImport(await T.SP.parseFiles(files(null), { now: NOW }));
  T.SP.setSettings({ asOf: '2026-10' });
  await settle(40);
  const pickIn = async (act, f, label) => { const s = T.main().querySelector('select[data-act=' + act + '][data-f=' + f + ']'); s.value = [...s.options].find(o => o.textContent === label).value;
    s.dispatchEvent(new T.W.Event('change', { bubbles: true })); await settle(); return T.main(); };
  const tiles = m => ['planned', 'awarded', 'remaining', 'late'].map(k => { const e = m.querySelector('.tile[data-tile=' + k + ']'); return [Number(e.querySelector('.tv').getAttribute('data-c')), e.querySelector('.tv').textContent, e.querySelector('.ts').textContent]; });
  const plist = (m, id) => [...m.querySelectorAll('[data-list=' + id + '] .plist li')].map(li => [li.querySelector('.fd').textContent, li.querySelector('.tg').textContent, li.querySelector('.fsub').textContent, Number(li.querySelector('.fa').getAttribute('data-c'))]);

  // ============================================================================================ My PMO
  // Air Vehicle holds every requirement but Tessa E: 2.0 + 2.0 + 0.7 + 3.0 + 5.0 + 3.5 = 16.2 planned; 2.0 + 3.0 + 1.0 = 6.0 awarded.
  // Data through Oct-2026, so the next three months are Nov-2026 to Jan-2027: only Tessa D's 2.0M in December. Past its date:
  // Tessa F's 0.5M of August 2026.
  let m = await T.view('mypmo');
  C.eq('My PMO opens on the first office that has a name', [T.pressed(), m.querySelector('.ovtitle').textContent, m.className], ['mypmo', 'Air Vehicle (AV)', 'ov']);
  C.eq('its tiles: 16.20M planned, 6.00M awarded, 10.20M still to award, one requirement past its date',
    tiles(m), [[D(16.2e6), '16.20', '6 requirements'], [D(6e6), '6.00', '37.04% of planned'], [D(10.2e6), '10.20', '4 not fully awarded'], [D(0.5e6), '1', '0.50 ($M) not yet awarded']]);
  C.eq('projected in the next three months: Tessa D in December', plist(m, 'soon'), [['Dec 2026', 'Tessa D', 'TS0004 · O&M FY2026 · T4', D(2e6)]]);
  C.eq('past its projected date: Tessa F’s lot of August', plist(m, 'late'), [['Aug 2026', 'Tessa F', 'TS0006 · O&M FY2027 · T6 lot two', D(0.5e6)]]);
  C.eq('every requirement of the office is listed beneath', [...m.querySelectorAll('.findt tbody tr')].map(tr => tr.querySelector('.tg').textContent + '|' + tr.querySelector('.when').textContent),
    ['Tessa C|Awarded', 'Tessa D|Dec 2026', 'Garnet Rework|No date', 'Tessa A|Awarded', 'Tessa B|Mar 2027', 'Tessa F|Was Aug 2026']);
  m = await pickIn('pmof', 'fy', 'FY2026');
  C.eq('FY2026 alone: 4.00M planned, 2.00M awarded, nothing past its date',
    tiles(m), [[D(4e6), '4.00', '2 requirements'], [D(2e6), '2.00', '50.00% of planned'], [D(2e6), '2.00', '1 not fully awarded'], [0, '0', 'nothing is past its date']]);
  C.chk('… and an empty list says so', /Nothing is past its projected date/.test(m.querySelector('[data-list=late]').textContent) && plist(m, 'soon').length === 1);
  m = await pickIn('pmof', 'fy', 'All');
  m = await pickIn('pmof', 'pmo', 'Propulsion (PP)');
  C.eq('another office: Propulsion holds Tessa E alone', [m.querySelector('.ovtitle').textContent, tiles(m)[0], plist(m, 'soon'), plist(m, 'late')],
    ['Propulsion (PP)', [D(1e6), '1.00', '1 requirement'], [], []]);
  C.chk('… whose June award is outside the next three months, and the page names them', /from Nov 2026 to Jan 2027/.test(m.querySelector('[data-list=soon]').textContent));
  C.chk('the PMO picker offers no "All": My PMO is always one office', ![...m.querySelector('select[data-f=pmo]').options].some(o => o.textContent === 'All'));
  m = await pickIn('pmof', 'pmo', 'Air Vehicle (AV)');
  T.click([...m.querySelectorAll('[data-list=late] .tg')][0]); await settle();
  C.eq('a requirement’s name opens it on Find a requirement', [T.pressed(), T.doc.getElementById('uiFindDet').querySelector('h3').textContent.startsWith('Tessa F'), T.rows().length], ['find', true, 7]);

  // ============================================================================================ the Award calendar
  // The execution year is FY2027: Oct-2026 to Sep-2027. Tessa C's December 2025 and Tessa F's August 2026 are before it
  // (Prior Yr); Garnet Rework has no date.
  m = await T.view('cal');
  const cal = () => { const m2 = T.main(), hd = [...m2.querySelectorAll('.calt thead th')].map(th => th.textContent);
    return { hd, rows: [...m2.querySelectorAll('.calt tbody tr')].map(tr => (tr.classList.contains('calg') ? ['#' + tr.textContent]
      : [tr.querySelector('th').firstChild.textContent, ...[...tr.children].slice(1).map((td, i) => [...td.querySelectorAll('.cchip')].map(c => hd[i + 1] + ':' + c.getAttribute('data-k') + ':' + c.getAttribute('data-c'))).flat()])) }; };
  let K = cal();
  C.eq('the calendar’s columns are the model’s: Prior Yr, the year’s months, the next year, No date, Total',
    K.hd, ['Requirement ($M)', 'Prior Yr', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'FY28+', 'No date', 'Total']);
  C.eq('each requirement’s money sits in the month it is projected to award, by office', K.rows.slice(0, -1), [
    ['#Air Vehicle (AV)'],
    ['Tessa C', 'Prior Yr:c-aw:' + D(2e6)],
    ['Tessa D', 'Dec:c-plan:' + D(2e6)],
    ['Garnet Rework', 'No date:c-plan:' + D(0.7e6)],
    ['Tessa A', 'Oct:c-aw:' + D(3e6)],
    ['Tessa B', 'Mar:c-plan:' + D(5e6)],
    ['Tessa F', 'Prior Yr:c-late:' + D(0.5e6), 'Oct:c-aw:' + D(1e6), 'Feb:c-plan:' + D(2e6)],
    ['#Propulsion (PP)'],
    ['Tessa E', 'Jun:c-plan:' + D(1e6)],
  ]);
  const totRow = () => [...T.main().querySelectorAll('.calt tr.calt-tot td')].map(td => Number(td.getAttribute('data-c')));
  //                         Prior  Oct     Nov Dec     Jan Feb     Mar     Apr May Jun     Jul Aug Sep Next No date  Total
  C.eq('the Total row, worked by hand', totRow(), [D(2.5e6), D(4e6), 0, D(2e6), 0, D(2e6), D(5e6), 0, 0, D(1e6), 0, 0, 0, 0, D(0.7e6), D(17.2e6)]);
  const M = modelOf(T);
  C.eq('… is the blocks’ own columns added up', totRow().slice(0, 15), M.cols.map(c => M.blocks.reduce((s, b) => s + b.cols[c.index], 0)));
  C.chk('a chip says what it is in words too, for a screen reader', [...T.main().querySelectorAll('.calt .cchip')].every(c => c.querySelector('.vh') && c.getAttribute('title'))
    && T.main().querySelector('.calt .c-late .vh').textContent.trim() === 'Not awarded, past its date');
  C.chk('closed months are marked, and the Data through month is named', T.main().querySelector('.calt thead th.now').textContent === 'Oct'
    && [...T.main().querySelectorAll('.calt thead th.cl')].map(th => th.textContent).join() === 'Prior Yr,Oct');
  await pickIn('calf', 'fy', 'FY2026'); K = cal();
  C.eq('the FY picker: FY2026’s two requirements, and no No date column when nothing listed lacks a date',
    [K.rows.slice(0, -1).map(r => r[0]), K.hd.includes('No date'), totRow().pop()], [['#Air Vehicle (AV)', 'Tessa C', 'Tessa D'], false, D(4e6)]);
  await pickIn('calf', 'fy', 'All'); await pickIn('calf', 'pmo', 'Propulsion (PP)');
  C.eq('the PMO picker', cal().rows.slice(0, -1).map(r => r[0]), ['#Propulsion (PP)', 'Tessa E']);
  await pickIn('calf', 'pmo', 'All'); m = await pickIn('calf', 'ap', 'Initial Spares');
  C.eq('the Appropriation picker', [cal().rows.slice(0, -1).map(r => r[0]), T.doc.getElementById('uiCalCount').textContent], [['#Propulsion (PP)', 'Tessa E'], '1 requirement']);
  T.click(m.querySelector('.calt .tg')); await settle();
  C.eq('a requirement’s name opens it on Find a requirement', [T.pressed(), T.doc.getElementById('uiFindDet').querySelector('h3').textContent.startsWith('Tessa E')], ['find', true]);
  // the switches reach both
  T.doc.querySelector('input[data-act=svc][data-i="0"]').click(); await settle(40);
  C.chk('with every row switched off the calendar and My PMO say so', /No requirement is counted/.test((await T.view('cal')).textContent) && /No requirement is counted/.test((await T.view('mypmo')).textContent));
  C.eq('no script error', T.errors(), []);
  T.t.close();

  // ============================================================================================ the office is remembered
  {
    const tt = loadTool({ html: pageHtml({}), url: 'http://localhost/apex.html' });   // jsdom gives file:// no storage; an http origin has it
    const W = tt.window, doc = W.document;
    for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
    tt.SP.applyImport(await tt.SP.parseFiles(files(null), { now: NOW })); tt.SP.setSettings({ asOf: '2026-10' }); await settle(40);
    doc.querySelector('[data-act=view][data-v=mypmo]').dispatchEvent(new W.MouseEvent('click', { bubbles: true })); await settle();
    const s = doc.querySelector('#uiMain select[data-f=pmo]'); s.value = [...s.options].find(o => o.textContent === 'Propulsion (PP)').value; s.dispatchEvent(new W.Event('change', { bubbles: true })); await settle();
    C.eq('the office picked is kept in this browser, beside the switches, never in the file', [W.localStorage.getItem('sfcbsp.pmo'), JSON.stringify(tt.SP.state).includes('sfcbsp.pmo')], ['propulsion (pp)', false]);
    tt.close();
  }
} catch (e) {
  C.chk('the run stopped before the end: ' + String((e && e.stack) || e).split('\n').slice(0, 3).join(' | '), false);
}
C.done();
