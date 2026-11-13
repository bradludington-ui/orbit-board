// The Charts view (CONTRACT §26): awards by month, the PMO scoreboard, late awards, the workload heat map and the burn-up,
// on the small invented plan of pmo-calendar.test.mjs. Every expectation is worked by hand from the plan below; SP.chartsOf
// is held to it, and the page to SP.chartsOf and to the Award calendar's own Total row.
//
//   node apex/test/charts.test.mjs
process.env.TZ = 'America/New_York';
import { loadTool, pageHtml, checks } from './harness.mjs';

const C = checks('charts');
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
  const SP = T.SP, M = modelOf(T), R = SP.requirementsOf(M);
  const pickIn = async (f, label) => { const s = T.main().querySelector('select[data-act=chf][data-f=' + f + ']'); s.value = [...s.options].find(o => o.textContent === label).value;
    s.dispatchEvent(new T.W.Event('change', { bubbles: true })); await settle(); return T.main(); };

  // ============================================================================================ SP.chartsOf, by hand
  // Columns (the execution year is FY2027): Prior Yr holds Tessa C's 2.0M awarded Dec 2025 and Tessa F's 0.5M of Aug 2026,
  // closed and not awarded (late); Oct holds 3.0M + 1.0M awarded; Dec 2.0M, Feb 2.0M, Mar 5.0M and Jun 1.0M projected;
  // Garnet Rework's 0.7M has no date.
  const X = SP.chartsOf(M, R);
  const col = l => X.cols.find(c => c.label === l), kinds = c => [c.awarded, c.late, c.projected, c.total];
  C.eq('awards by month: Prior Yr is 2.0 awarded and 0.5 late', kinds(col('Prior Yr')), [D(2e6), D(0.5e6), 0, D(2.5e6)]);
  C.eq('… Oct is 4.0 awarded', kinds(col('Oct')), [D(4e6), 0, 0, D(4e6)]);
  C.eq('… Dec, Feb, Mar and Jun are projected, and the undated 0.7 is in No date', ['Dec', 'Feb', 'Mar', 'Jun', 'No date'].map(l => kinds(col(l))),
    [[0, 0, D(2e6), D(2e6)], [0, 0, D(2e6), D(2e6)], [0, 0, D(5e6), D(5e6)], [0, 0, D(1e6), D(1e6)], [0, 0, D(0.7e6), D(0.7e6)]]);
  C.eq('… every other column is empty, and the columns add to the plan, 17.2', [X.cols.filter(c => c.total !== 0).length, X.cols.reduce((s, c) => s + c.total, 0)], [7, D(17.2e6)]);
  C.eq('the next three months are Nov 2026 to Jan 2027: Tessa D’s 2.0 in December, one plan event', X.next3, { from: '2026-11', to: '2027-01', cents: D(2e6), n: 1 });
  // the scoreboard. Air Vehicle: 16.2 planned, 6.0 awarded = 37.04%. Its goal is each block's goal for Oct-2026 weighted by
  // plan: O&M FY2026 (second year: 100%) holds 4.0 of it, O&M FY2027 (first year: 8.33%) 12.2: (4.0 + 12.2 x 0.0833) / 16.2.
  const g = k => M.blocks.find(b => b.key === k).goal;
  C.eq('the OSD goals this plan’s blocks have for Oct-2026', [g('om|2026'), g('om|2027'), g('sp|2027')], [1, 0.0833, 0.0667]);
  const av = X.pmos.find(p => p.label === 'Air Vehicle (AV)'), pp = X.pmos.find(p => p.label === 'Propulsion (PP)');
  C.eq('scoreboard, Air Vehicle: 6 requirements, 16.2 planned, 6.0 awarded', [av.n, av.planned, av.awarded], [6, D(16.2e6), D(6e6)]);
  C.chk('… 37.04% of plan against a goal of (4.0 + 12.2 x 0.0833) / 16.2 = 30.96%: on track', Math.abs(av.pct - 6 / 16.2) < 1e-12 && Math.abs(av.goal - (4 + 12.2 * 0.0833) / 16.2) < 1e-12 && av.status === 'green', J([av.pct, av.goal, av.status]));
  C.eq('scoreboard, Propulsion: nothing awarded of 1.0 against 6.67%: within 10 points', [pp.n, pp.planned, pp.awarded, pp.pct, pp.goal, pp.status], [1, D(1e6), 0, 0, 0.0667, 'yellow']);
  C.eq('the offices are in name order', X.pmos.map(p => p.label), ['Air Vehicle (AV)', 'Propulsion (PP)']);
  // late: only Tessa F's August lot, two months before the Data through month
  C.eq('late awards: Tessa F, 0.5, due Aug 2026, two months ago', [X.late.map(l => [l.req.title, l.cents, l.ym, l.age, l.n]), X.lateCents], [[['Tessa F', D(0.5e6), '2026-08', 2, 1]], D(0.5e6)]);
  // the heat map: an office's row is its part of each column
  const hr = l => X.heat.rows.find(r => r.label === l), at = (r, l) => r.cells[X.cols.findIndex(c => c.label === l)];
  C.eq('heat map, Air Vehicle: 2.5, 4.0, 2.0, 2.0, 5.0 and 0.7; Propulsion: 1.0 in June', [['Prior Yr', 'Oct', 'Dec', 'Feb', 'Mar', 'No date'].map(l => at(hr('Air Vehicle (AV)'), l)), hr('Air Vehicle (AV)').total,
    at(hr('Propulsion (PP)'), 'Jun'), hr('Propulsion (PP)').total, X.heat.max], [[D(2.5e6), D(4e6), D(2e6), D(2e6), D(5e6), D(0.7e6)], D(16.2e6), D(1e6), D(1e6), D(5e6)]);
  C.eq('the heat map’s columns add to the awards by month', X.cols.map((c, i) => X.heat.rows.reduce((s, r) => s + r.cells[i], 0)), X.cols.map(c => c.total));
  C.eq('a part of the list is that part: Propulsion alone', (x => [x.n, x.cols.reduce((s, c) => s + c.total, 0), x.pmos.length, x.late.length, x.next3.cents])(SP.chartsOf(M, R.filter(r => r.pmo === 'Propulsion (PP)'))), [1, D(1e6), 1, 0, 0]);
  C.eq('no requirement, no figure', (x => [x.n, x.pmos, x.late, x.heat.rows, x.cols.every(c => c.total === 0)])(SP.chartsOf(M, [])), [0, [], [], [], true]);

  // ============================================================================================ the page
  let m = await T.view('charts');
  C.eq('Charts is in the menu, and draws five cards', [T.pressed(), [...m.querySelectorAll('.chcard')].map(c => c.getAttribute('data-ch'))], ['charts', ['months', 'pmos', 'late', 'heat', 'burn']]);
  const rects = () => [...T.main().querySelectorAll('.chsvg rect.chb')].map(r => [X.cols.find(c => c.index === Number(r.getAttribute('data-col'))).label, r.getAttribute('data-k'), Number(r.getAttribute('data-c'))]);
  C.eq('awards by month: a bar part for each figure that is not zero, and no other', rects(), [['Prior Yr', 'awarded', D(2e6)], ['Prior Yr', 'late', D(0.5e6)], ['Oct', 'awarded', D(4e6)],
    ['Dec', 'projected', D(2e6)], ['Feb', 'projected', D(2e6)], ['Mar', 'projected', D(5e6)], ['Jun', 'projected', D(1e6)], ['No date', 'projected', D(0.7e6)]]);
  C.chk('every bar part says what it is in words', [...m.querySelectorAll('.chsvg rect.chb')].every(r => /: (Awarded|Not awarded, past its date|Projected) [\d.,]+ \(\$M\)$/.test(r.querySelector('title').textContent)));
  C.eq('the next three months are said in words and dollars', [Number(m.querySelector('#uiChNext').getAttribute('data-c')), m.querySelector('#uiChNext').textContent], [D(2e6), 'Nov 2026 to Jan 2027: 2.00 ($M) projected to award']);
  const sb = () => [...T.main().querySelectorAll('.chpmo tbody tr')].map(tr => [tr.querySelector('.tg').textContent, tr.querySelector('.chpct').textContent, (tr.querySelector('.st') || { textContent: '' }).textContent, Number(tr.querySelector('td.n').getAttribute('data-c'))]);
  C.eq('scoreboard rows: the office, its share, its status word and its plan', sb(), [['Air Vehicle (AV)', '37.04%', 'On track', D(16.2e6)], ['Propulsion (PP)', '0.00%', 'Within 10', D(1e6)]]);
  C.eq('the bar is the share and the tick is the goal', (tr => [tr.querySelector('.chfill').style.width, tr.querySelector('.chgoal').style.left])(m.querySelector('.chpmo tbody tr')), ['37%', '31%']);     // 37.04% and 30.96%, to a tenth of a percent, as the page’s own parser writes them back
  C.eq('late awards: the requirement, its money, when it was due and how long ago', [...m.querySelectorAll('.chlate tbody tr')].map(tr => [tr.querySelector('.tg').textContent, Number(tr.querySelector('.chpct').getAttribute('data-c')),
    tr.querySelector('.chdue').firstChild.textContent, tr.querySelector('.chdue .fsub').textContent, tr.querySelector('.chlbar').className]), [['Tessa F', D(0.5e6), 'Aug 2026', '2 months ago', 'chlbar a2']]);
  C.eq('… and their total', [Number(m.querySelector('#uiChLate').getAttribute('data-c')), m.querySelector('#uiChLate').textContent], [D(0.5e6), '0.50 ($M) on 1 requirement.']);
  const heat = () => [...T.main().querySelectorAll('.chheat tbody tr')].map(tr => [tr.querySelector('th').textContent, ...[...tr.querySelectorAll('td')].map(td => Number(td.getAttribute('data-c')))]);
  C.eq('heat map rows are SP.chartsOf’s, cell for cell, with their totals', heat(), X.heat.rows.map(r => [r.label, ...r.cells, r.total]));
  C.chk('the largest cell is the darkest, and an empty one has no colour', (() => { const tds = [...m.querySelectorAll('.chheat tbody td:not(.tot)')], big = tds.find(td => Number(td.getAttribute('data-c')) === D(5e6));
    return /rgba\(5, ?87, ?149, ?1(\.0+)?\)|rgb\(5, ?87, ?149\)/.test(big.style.background) && big.classList.contains('hot') && tds.filter(td => td.getAttribute('data-c') === '0').every(td => !td.style.background && td.textContent === ''); })());
  C.eq('burn-up: one for each block, in the Overview’s order', [...m.querySelectorAll('.chburn')].map(f => f.getAttribute('data-bk')), SP.overviewOf(M, null).charts.map(c => c.key));
  { const f = m.querySelector('.chburn[data-bk="om|2027"]'), b = M.blocks.find(x => x.key === 'om|2027'), want = b.obl[M.asOfIndex].v - b.goalC[M.asOfIndex];
    C.chk('burn-up, O&M FY2027: the gap said is the slide block’s Obligation % less its OSD goal for October (4.0 of 12.2 awarded, 32.79%, against 8.33%)',
      Math.abs(Number(f.querySelector('.chgap').getAttribute('data-gap')) - want) < 1e-12 && Math.abs(want - (4 / 12.2 - 0.0833)) < 1e-9 && /^Oct: 32\.79%, 24\.5 points ahead of the goal\.$/.test(f.querySelector('.chgap').textContent),
      f.querySelector('.ovlab').textContent); }
  C.chk('burn-up, O&M FY2026 (a second-year block, goal 100%): behind, in words', /points behind the goal/.test(m.querySelector('.chburn[data-bk="om|2026"] .chgap.behind').textContent));
  // against the Award calendar: a month's three parts are its Total cell
  { const tot = (await T.view('cal')).querySelectorAll('.calt tr.calt-tot td'); const cal = [...tot].slice(0, -1).map(td => Number(td.getAttribute('data-c')));
    C.eq('each month’s three parts add to the Award calendar’s Total row', X.cols.map(c => c.awarded + c.late + c.projected), cal); }
  // the pickers
  await T.view('charts'); m = await pickIn('pmo', 'Propulsion (PP)');
  C.eq('the PMO picker narrows the bars, the scoreboard, the late list and the heat map', [T.doc.getElementById('uiChCount').textContent, rects(), sb().map(r => r[0]), m.querySelectorAll('.chlate tbody tr').length, heat().map(r => r[0])],
    ['1 requirement', [['Jun', 'projected', D(1e6)]], ['Propulsion (PP)'], 0, ['Propulsion (PP)']]);
  C.chk('… the late card says nothing is late, and the burn-up still shows every block (it is a block’s figure)', /Nothing is past its projected date/.test(m.querySelector('[data-ch=late]').textContent) && m.querySelectorAll('.chburn').length === 3);
  await pickIn('pmo', 'All'); m = await pickIn('ap', 'Initial Spares');
  C.eq('the Appropriation picker reaches the burn-up too', [[...m.querySelectorAll('.chburn')].map(f => f.getAttribute('data-bk')), T.doc.getElementById('uiChCount').textContent], [['sp|2027'], '1 requirement']);
  await pickIn('ap', 'All'); m = await pickIn('fy', 'FY2026');
  C.eq('the FY picker: FY2026’s two requirements and its one block', [T.doc.getElementById('uiChCount').textContent, rects(), [...m.querySelectorAll('.chburn')].map(f => f.getAttribute('data-bk'))],
    ['2 requirements', [['Prior Yr', 'awarded', D(2e6)], ['Dec', 'projected', D(2e6)]], ['om|2026']]);
  m = await pickIn('fy', 'All');
  // the ways on
  T.click(m.querySelector('.chlate .tg')); await settle();
  C.eq('a late requirement’s name opens it on Find a requirement', [T.pressed(), T.doc.getElementById('uiFindDet').querySelector('h3').textContent.startsWith('Tessa F')], ['find', true]);
  m = await T.view('charts'); T.click([...m.querySelectorAll('.chpmo .tg')].find(b => b.textContent === 'Propulsion (PP)')); await settle();
  C.eq('an office on the scoreboard opens My PMO on that office', [T.pressed(), T.main().querySelector('.ovtitle').textContent], ['mypmo', 'Propulsion (PP)']);
  // the switches reach it
  T.doc.querySelector('input[data-act=svc][data-i="0"]').click(); await settle(40);
  C.chk('with every row switched off the view says so', /No requirement is counted/.test((await T.view('charts')).textContent));
  C.eq('no script error', T.errors(), []);
  T.t.close();
} catch (e) {
  C.chk('the run stopped before the end: ' + String((e && e.stack) || e).split('\n').slice(0, 3).join(' | '), false);
}
C.done();
