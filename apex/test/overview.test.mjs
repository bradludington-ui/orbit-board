// APEX's Overview and frame (CONTRACT §18). The Overview works out nothing of its own, so these checks hold it two ways:
// against figures worked out by hand from a small invented plan, and against the Summary view and the slide blocks of the
// same page, which it must never disagree with. Every name and amount here is invented.
//
//   node apex/test/overview.test.mjs
process.env.TZ = 'America/New_York';
import { loadTool, pageHtml, checks } from './harness.mjs';

const C = checks('overview');
const J = x => JSON.stringify(x);
const settle = (ms = 20) => new Promise(res => setTimeout(res, ms));
const NOW = '2026-11-09T12:00:00.000Z';
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const BAE_H = ['Budget Name', 'Budget FY Numeric', 'Budget Approved Amount', 'Budget Authorized Amount', 'Budget Flex 01', 'Budget Flex 02', 'Budget Flex 03'];
const baeCsv = rows => [BAE_H.join(',')].concat(rows.map(r => BAE_H.map((_, i) => q(r[i])).join(','))).join('\n');
const EX = 'Actual Execution is allocated', NA = 'Not Allocated';
const row = (FY, ccar, Title, Budget, pe, Date, Amount, Alloc) => ({ FY, 'CCaR No': ccar, Title, Budget, 'Plan Event': pe, Date, Amount, Alloc, PMO: 'Air Vehicle (AV)' });
const B_OM = 'USAF O&M- Tessa Base Discretionary AV', B_SP = 'USAF APN Spares Tessa Base Initial';
// O&M FY2027: 8.0M planned, 3.0M obligated in October. O&M FY2026: 4.0M, 2.0M obligated. Initial Spares FY2027: 1.0M, none.
const OM = [
  row(2027, 'TS0001', 'Tessa A', B_OM, 'T1', '2026-10-15', '3000000', EX),
  row(2027, 'TS0002', 'Tessa B', B_OM, 'T2', '2027-03-10', '5000000', NA),
  row(2026, 'TS0003', 'Tessa C', B_OM, 'T3', '2025-12-01', '2000000', EX),
  row(2026, 'TS0004', 'Tessa D', B_OM, 'T4', '2026-12-05', '2000000', NA),
];
const SPR = [row(2027, 'TS0005', 'Tessa E', B_SP, 'T5', '2027-06-01', '1000000', NA)];
const D = d => Math.round(d * 100);
const tile = (m, id) => { const e = m.querySelector('.tile[data-tile=' + id + '] .tv'); return e ? Number(e.getAttribute('data-c')) : null; };
const tileText = (m, id) => { const e = m.querySelector('.tile[data-tile=' + id + ']'); return e ? e.textContent : ''; };

async function boot(files, opt = {}) {
  const tt = loadTool({ html: pageHtml({}) });
  const W = tt.window, doc = W.document;
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  const T = {
    t: tt, W, doc, SP: tt.SP, main: () => doc.getElementById('uiMain'),
    click(el) { el.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); },
    async view(v) { T.click(doc.querySelector('[data-act=view][data-v="' + v + '"]')); await settle(); return T.main(); },
    async fy(f) { T.click(doc.querySelector('[data-act=ovfy][data-fy="' + f + '"]')); await settle(); return T.main(); },
    errors: () => tt.errors.filter(e => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click)/.test(String(e))),
  };
  if (files) {
    T.SP.applyImport(await T.SP.parseFiles(files, { now: NOW }));
    T.SP.setSettings({ asOf: opt.asOf || '2026-10' });
    await settle(40);
  }
  return T;
}
// the Summary view's rows, read off the page: {key, cents: [approved, authorized, obligated, unobligated], status}
const summaryRows = m => [...m.querySelectorAll('table.top tr[data-bk]')].map(tr => ({ k: tr.getAttribute('data-bk'),
  c: [...tr.querySelectorAll('td.n[data-c]')].slice(0, 4).map(td => Number(td.getAttribute('data-c'))), st: (tr.querySelector('td.st') || {}).textContent || '' }));

try {
  // ============================================================================================ the frame and the name
  {
    const T = await boot(null);
    C.eq('the page is titled APEX', T.doc.title, 'APEX');
    C.chk('the top names APEX, with what the letters stand for', /^APEX\s*Appropriation Planning & Execution/.test(T.doc.querySelector('h1.brand').textContent)
      && T.doc.querySelector('h1.brand').getAttribute('title') === 'Appropriation Planning & Execution');
    C.chk('the top carries the T-Rex mark, drawn in the page itself and hidden from screen readers', !!T.doc.querySelector('h1.brand svg.mark path[d]')
      && T.doc.querySelector('h1.brand svg.mark').getAttribute('aria-hidden') === 'true' && !T.doc.querySelector('h1.brand svg.mark [href], h1.brand svg.mark image'));
    C.chk('no data yet: the menu is not drawn and the page is on a sheet', T.doc.getElementById('uiNav').hidden && T.main().className === 'sheet');
    C.chk('the page still carries the marker every saved file carries', !!T.doc.querySelector('meta[name="sfcb-spend-plan"]'));
    C.eq('no data yet: no script error', T.errors(), []);
    T.t.close();
  }

  // ============================================================================================ no report
  {
    const T = await boot([{ name: 'om.csv', data: csv(OM) }, { name: 'sp.csv', data: csv(SPR) }]);
    let m = T.main();
    const nav = [...T.doc.querySelectorAll('#uiNav button')];
    C.eq('the menu lists the Overview first, then the views as before', nav.map(b => b.textContent),
      ['Overview', 'Summary', 'Slide blocks', 'O&M', 'Full Fund', 'Initial Spares', 'OPN', 'PMOs', 'Not Allocated', 'Import report', 'What changed', 'Settings']);
    C.chk('an import opens on the Overview', nav[0].getAttribute('aria-pressed') === 'true' && m.className === 'ov' && !!m.querySelector('.tiles'));
    C.chk('the menu is beside the view, outside the sticky top', !T.doc.getElementById('uiTop').contains(T.doc.getElementById('uiNav'))
      && T.doc.getElementById('uiShell').contains(T.doc.getElementById('uiNav')) && T.doc.getElementById('uiShell').contains(m));
    // the execution year is FY2027 (Data through Oct-2026): the Overview opens on it
    C.eq('it opens on the execution year', [...m.querySelectorAll('[data-act=ovfy]')].map(b => b.textContent + ':' + b.getAttribute('aria-pressed')),
      ['FY2026:false', 'FY2027:true', 'All:false']);
    C.eq('FY2027 tiles: Approved 9.0M, Authorized 9.0M, Obligated 3.0M, Unobligated 6.0M',
      ['approved', 'authorized', 'obligated', 'unobligated'].map(k => tile(m, k)), [D(9e6), D(9e6), D(3e6), D(6e6)]);
    C.chk('FY2027 tiles print $M as the tables do, and Obligated says 33.33% of Approved', /9\.00/.test(tileText(m, 'approved')) && /3\.00/.test(tileText(m, 'obligated'))
      && /33\.33% of Approved/.test(tileText(m, 'obligated')), tileText(m, 'obligated'));
    C.chk('an Authorized nobody entered carries †, and the mark is explained under the tiles', /†/.test(tileText(m, 'authorized'))
      && !!m.querySelector('.ovnotes .mark-note[data-mark=dag]') && !/†|‡|§/.test(tileText(m, 'approved')));
    C.eq('FY2027 by appropriation: O&M 8.0M (88.89%), Initial Spares 1.0M (11.11%)',
      [...m.querySelectorAll('.ovaps tr')].map(tr => [tr.getAttribute('data-ap'), Number(tr.querySelector('td[data-c]').getAttribute('data-c')), tr.querySelectorAll('td')[1].textContent]),
      [['om', D(8e6), '88.89%'], ['sp', D(1e6), '11.11%']]);
    C.chk('the split is drawn, one arc per appropriation', m.querySelectorAll('svg.donut circle').length === 2);
    C.eq('FY2027 has a chart for each of its blocks', [...m.querySelectorAll('.ovc')].map(f => f.getAttribute('data-bk')), ['om|2027', 'sp|2027']);
    // O&M FY2027 by month: October is closed, 3.0M of 8.0M obligated = 37.50% actual; November to February the plan is
    // still 3.0M of 8.0M; from March the plan is the whole 8.0M
    const O = T.SP.overviewOf(T.SP.buildModel(T.SP.state.pulls.current, T.SP.state.settings, T.SP.defaultView(), null), 2027);
    const om = O.charts.find(c => c.key === 'om|2027').months;
    C.eq('O&M FY2027 by month: 37.50% actual in October, the plan after', om.map(x => [x.label, x.kind, x.v === null ? null : Math.round(x.v * 10000)]),
      [['Oct', 'actual', 3750], ['Nov', 'plan', 3750], ['Dec', 'plan', 3750], ['Jan', 'plan', 3750], ['Feb', 'plan', 3750], ['Mar', 'plan', 10000],
        ['Apr', 'plan', 10000], ['May', 'plan', 10000], ['Jun', 'plan', 10000], ['Jul', 'plan', 10000], ['Aug', 'plan', 10000], ['Sep', 'plan', 10000]]);
    const bars = [...m.querySelectorAll('.ovc[data-bk="om|2027"] svg rect.b')];
    C.chk('its chart draws one bar a month: one actual, eleven planned, each saying its month in words', bars.length === 12
      && bars.filter(b => b.classList.contains('ba')).length === 1 && bars.filter(b => b.classList.contains('bp')).length === 11
      && bars[0].querySelector('title').textContent.startsWith('Oct: 37.50% actual') && bars[5].querySelector('title').textContent.startsWith('Mar: 100.00% planned'));
    // a chart is its slide block: the same label, the same Obligation % and status as the Slide blocks view prints
    const blocks = T.SP.buildModel(T.SP.state.pulls.current, T.SP.state.settings, T.SP.defaultView(), null).blocks;
    const b27 = blocks.find(b => b.key === 'om|2027');
    C.eq('a chart carries its slide block’s own Obligation % label', m.querySelector('.ovc[data-bk="om|2027"] .ovlab').textContent, T.SP.oblLabel(b27, { cols: O.charts.length ? T.SP.buildModel(T.SP.state.pulls.current, T.SP.state.settings, T.SP.defaultView(), null).cols : [], asOfIndex: 1 }));
    C.eq('… and the block’s Obligation %', m.querySelector('.ovc[data-bk="om|2027"] .ovpct').textContent, '37.50%');

    // against the Summary of the same page, for each choice of FY
    const sum = summaryRows(await T.view('summary'));
    C.chk('the Summary is on a light sheet', T.main().className === 'sheet');
    for (const f of ['2026', '2027', 'all']) {
      await T.view('overview'); m = await T.fy(f);
      const mine = sum.filter(r => r.k !== 'total' && (f === 'all' || r.k.endsWith('|' + f)));
      const add = i => mine.reduce((s, r) => s + r.c[i], 0);
      C.eq('FY ' + f + ': the tiles are the Summary’s rows added up', ['approved', 'authorized', 'obligated', 'unobligated'].map(k => tile(m, k)), [add(0), add(1), add(2), add(3)]);
      const words = [...new Set(mine.map(r => r.st).filter(Boolean))];
      C.chk('FY ' + f + ': the status counts are the Summary’s rows', words.every(w => [...m.querySelectorAll('.ovstatus .stc')].some(s => s.textContent === mine.filter(r => r.st === w).length + ' ' + w))
        && [...m.querySelectorAll('.ovstatus .stc')].reduce((s, e) => s + parseInt(e.textContent, 10), 0) === mine.length, m.querySelector('.ovstatus').textContent);
      C.eq('FY ' + f + ': one chart per block', [...m.querySelectorAll('.ovc')].map(x => x.getAttribute('data-bk')), mine.map(r => r.k));
    }
    C.eq('every FY: the tiles are the Summary’s TOTAL row', ['approved', 'authorized', 'obligated', 'unobligated'].map(k => tile(m, k)), sum.find(r => r.k === 'total').c);
    C.eq('every FY, worked by hand: 13.0M, 13.0M, 5.0M, 8.0M', ['approved', 'authorized', 'obligated', 'unobligated'].map(k => tile(m, k)), [D(13e6), D(13e6), D(5e6), D(8e6)]);
    m = await T.fy('2026');
    C.eq('FY2026, worked by hand: 4.0M, 4.0M, 2.0M, 2.0M', ['approved', 'authorized', 'obligated', 'unobligated'].map(k => tile(m, k)), [D(4e6), D(4e6), D(2e6), D(2e6)]);
    // its two ways out
    T.click(m.querySelector('.ovc[data-bk="om|2026"] .ovopen')); await settle();
    C.chk('a chart’s name opens its appropriation', T.doc.querySelector('#uiNav [data-v=om]').getAttribute('aria-pressed') === 'true' && T.main().className === 'sheet');
    m = await T.view('overview');
    C.chk('the Overview keeps the FY picked', m.querySelector('[data-act=ovfy][data-fy="2026"]').getAttribute('aria-pressed') === 'true');
    T.click(m.querySelector('.ovstatus [data-act=view]')); await settle();
    C.chk('Open the Summary opens the Summary', T.doc.querySelector('#uiNav [data-v=summary]').getAttribute('aria-pressed') === 'true' && !!T.main().querySelector('table.top'));
    // a switch off: every row here is USAF, so every figure is zero, as the Summary's is, and the Overview says what is shown
    T.doc.querySelector('input[data-act=svc][data-i="0"]').click(); await settle(40);
    m = await T.view('overview'); m = await T.fy('all');
    C.eq('with USAF switched off every tile is zero', ['approved', 'authorized', 'obligated', 'unobligated'].map(k => tile(m, k)), [0, 0, 0, 0]);
    C.chk('… the Overview says which services are shown, and draws no split of nothing', !!m.querySelector('.ovshown.filtered')
      && /Services shown/.test(m.querySelector('.ovshown').textContent) && !m.querySelector('svg.donut'));
    C.eq('no script error', T.errors(), []);
    // the workbook and the pictures are named APEX
    C.chk('the workbook is named APEX', /^APEX FY2027 - data through Oct-2026 - 2026-11-09/.test(T.SP.excelFileName(T.SP.buildModel(T.SP.state.pulls.current, T.SP.state.settings, T.SP.defaultView(), null), '2026-11-09')));
    T.t.close();
  }

  // ============================================================================================ with a BAE report
  {
    // the report gives O&M FY2027 an Approved of 10.0M and an Authorized of 6.0M; it has no figure for Initial Spares FY2027
    const T = await boot([{ name: 'om.csv', data: csv(OM) }, { name: 'sp.csv', data: csv(SPR) }, { name: 'bae.csv', data: baeCsv([[B_OM, 2027, 10000000, 6000000, '', '', '']]) }]);
    const m = T.main();
    C.chk('the report is on screen', !!(T.SP.state.bae && T.SP.state.bae.current) && /BAE report/.test(m.querySelector('.ovsub').textContent));
    // Approved 10.0M + the plan's 1.0M (§); Authorized 6.0M + 1.0M standing in (†); Obligated 3.0M; Unobligated 8.0M
    C.eq('FY2027 with the report: Approved 11.0M, Authorized 7.0M, Obligated 3.0M, Unobligated 8.0M',
      ['approved', 'authorized', 'obligated', 'unobligated'].map(k => tile(m, k)), [D(11e6), D(7e6), D(3e6), D(8e6)]);
    C.chk('… Approved carries § and Authorized †, each explained', /§/.test(tileText(m, 'approved')) && /†/.test(tileText(m, 'authorized'))
      && !!m.querySelector('.ovnotes .mark-note[data-mark=sect]') && !!m.querySelector('.ovnotes .mark-note[data-mark=dag]'));
    C.chk('… Obligated is 27.27% of Approved', /27\.27% of Approved/.test(tileText(m, 'obligated')), tileText(m, 'obligated'));
    // the chart stays on the CCaR plan, as the slide block does (§14.3): 3.0M of 8.0M
    C.chk('a chart stays on the CCaR plan, and its label says so', m.querySelector('.ovc[data-bk="om|2027"] .ovpct').textContent === '37.50%'
      && /CCaR plan 8\.00M/.test(m.querySelector('.ovc[data-bk="om|2027"] .ovlab').textContent), m.querySelector('.ovc[data-bk="om|2027"] .ovlab').textContent);
    const sum = summaryRows(await T.view('summary'));
    await T.view('overview'); const all = await T.fy('all');
    C.eq('every FY with the report: the tiles are the Summary’s TOTAL row', ['approved', 'authorized', 'obligated', 'unobligated'].map(k => tile(all, k)), sum.find(r => r.k === 'total').c);
    C.eq('with a report: no script error', T.errors(), []);
    T.t.close();
  }

  // ============================================================================================ the review of §18
  // Each block below holds a rule a planted mistake passed before it (review MC-7), or a finding of the review.
  const model = T => T.SP.buildModel(T.SP.state.pulls.current, T.SP.state.settings, T.SP.defaultView(), (T.SP.state.bae && T.SP.state.bae.current) || null);
  const chips = m => [...m.querySelectorAll('.ovstatus .stc')].map(e => e.getAttribute('data-st') + ':' + e.textContent);
  const B_OMN = 'USN O&M- Tessa Base Discretionary AV';

  // ---- a switch off (MC-1), a block for a later year (RF-1, the no-goal chip), a typed Authorized (‡), First FY
  {
    // FY2028 O&M: 2.0M planned for December 2027, after the execution year FY2027, so it has no OSD goal and nothing in
    // Oct to Sep. FY2026 gets a USN row, so that block still has figures with USAF switched off.
    const OM2 = OM.concat([row(2028, 'TS0006', 'Tessa F', B_OM, 'T6', '2027-12-01', '2000000', NA), row(2026, 'TS0007', 'Tessa G', B_OMN, 'T7', '2025-11-03', '1000000', EX)]);
    const T = await boot([{ name: 'om.csv', data: csv(OM2) }, { name: 'sp.csv', data: csv(SPR) }]);
    let m = await T.fy('all');
    const sumAll = summaryRows(await T.view('summary'));
    m = await T.view('overview');
    C.eq('MC-7: a block for a later year has no status on the Summary, and the Overview counts it as “1 with no OSD goal”',
      [sumAll.find(r => r.k === 'om|2028').st, chips(m).filter(x => /^(none|nopct):/.test(x))], ['', ['none:1 with no OSD goal']]);
    const f28 = m.querySelector('.ovc[data-bk="om|2028"]'), none28 = [...f28.querySelectorAll('svg text.ovnone')].map(t => t.textContent);
    C.eq('RF-1: its chart, with nothing in Oct to Sep, says so and where the plan is', none28,
      ['Nothing obligated or planned', 'in Oct to Sep, and no OSD goal', 'Obligation % in the FY28+ column: 100.00%']);
    C.chk('RF-1: … in the picture’s name too, and no other chart carries the line', /Nothing obligated or planned in Oct to Sep/.test(f28.querySelector('svg').getAttribute('aria-label'))
      && m.querySelectorAll('svg text.ovnone').length === 3 && !f28.querySelector('polyline.gline'), f28.querySelector('svg').getAttribute('aria-label'));
    C.eq('an FY the plan has no row for reads as every FY', [T.SP.overviewOf(model(T), 1999).fy, T.SP.overviewOf(model(T), 1999).rows.length], [null, 4]);

    // the goal line is the OSD goal BY MONTH (§18.3), read here from the settings' own table, not the block's one goal
    const b27 = model(T).blocks.find(b => b.key === 'om|2027'), g = T.SP.state.settings.goals[b27.curve];
    const titles = [...m.querySelectorAll('.ovc[data-bk="om|2027"] svg rect.b title')].map(t => t.textContent);
    C.chk('MC-7: the fixture’s OSD goal differs from month to month', new Set(g.slice(1, 13)).size > 3, J(g));
    C.eq('MC-7: each month’s bar names that month’s own OSD goal', titles.map(t => (t.match(/OSD goal ([0-9.]+%)/) || [])[1]), g.slice(1, 13).map(x => T.SP.fmtPct(x)));
    const ys = (m.querySelector('.ovc[data-bk="om|2027"] polyline.gline').getAttribute('points') || '').split(' ').map(p => Number(p.split(',')[1]));
    C.chk('MC-7: … and the line is drawn through twelve points that follow it', ys.length === 12 && new Set(ys).size > 3
      && ys.every((y, i) => i === 0 || (g[i + 1] > g[i] ? y < ys[i - 1] : g[i + 1] < g[i] ? y > ys[i - 1] : y === ys[i - 1])), J(ys));

    // USAF off: O&M FY2027, FY2028 and Initial Spares FY2027 have nothing shown. Two of them HAVE an OSD goal.
    T.doc.querySelector('input[data-act=svc][data-i="0"]').click(); await settle(40);
    const sumOff = summaryRows(await T.view('summary'));
    const goalOf = k => { const tr = [...T.main().querySelectorAll('table.top tr[data-bk]')].find(x => x.getAttribute('data-bk') === k); return tr.querySelectorAll('td')[tr.querySelectorAll('td').length - 3].textContent; };
    const goals = ['om|2027', 'sp|2027', 'om|2028'].map(goalOf);
    C.chk('MC-1: with USAF off the Summary still prints an OSD goal for O&M FY2027 and Initial Spares FY2027, and none for FY2028',
      /%$/.test(goals[0]) && /%$/.test(goals[1]) && goals[2] === '' && sumOff.filter(r => r.k !== 'total' && !r.st).length === 3, J(goals));
    m = await T.view('overview');
    C.eq('MC-1: the Overview says 2 with no Obligation % and 1 with no OSD goal, not 3 with no OSD goal',
      chips(m).filter(x => /^(none|nopct):/.test(x)), ['nopct:2 with no Obligation %', 'none:1 with no OSD goal']);
    C.eq('MC-1: every row is counted once', chips(m).reduce((s, x) => s + parseInt(x.split(':')[1], 10), 0), 4);
    T.doc.querySelector('input[data-act=svc][data-i="0"]').click(); await settle(40);

    // a typed Authorized with a service switched off covers every service: ‡ (§4.5), on the tile as on the Summary's TOTAL
    T.SP.setSettings({ authorized: { 'om|2026': D(4.5e6) } }); await settle(40);
    const usn = [...T.doc.querySelectorAll('input[data-act=svc]')].find(i => /USN/.test(i.parentElement.textContent));
    usn.click(); await settle(40);
    const tot = (await T.view('summary')).querySelector('tr[data-bk=total]').textContent;
    m = await T.view('overview'); m = await T.fy('2026');
    C.chk('MC-7: a typed Authorized with a switch off carries ‡ on the Summary’s TOTAL and on the Authorized tile, explained', /‡/.test(tot)
      && /‡/.test(tileText(m, 'authorized')) && !/‡/.test(tileText(m, 'approved')) && !!m.querySelector('.ovnotes .mark-note[data-mark=ddag]'), tileText(m, 'authorized'));
    // Authorized 4.5M of the 4.0M shown: the tile says ITS share of Approved (112.50%), not Obligated's (50.00%)
    C.chk('MC-7: the Authorized tile says Authorized’s own share of Approved', /112\.50% of Approved/.test(tileText(m, 'authorized')) && /50\.00% of Approved/.test(tileText(m, 'obligated')), tileText(m, 'authorized'));
    usn.click(); await settle(40);

    // FY2026 is picked. First FY moves to 2027 and the plan has no FY2026 row any more: back to the execution year
    T.SP.setSettings({ firstFY: 2027 }); await settle(40);
    m = await T.view('overview');
    C.eq('MC-7: a picked FY that First FY drops falls back to the execution year, not to every FY',
      [...m.querySelectorAll('[data-act=ovfy]')].map(b => b.textContent + ':' + b.getAttribute('aria-pressed')), ['FY2027:true', 'FY2028:false', 'All:false']);
    C.eq('… and the tiles are FY2027’s', tile(m, 'approved'), D(9e6));
    C.eq('review blocks: no script error', T.errors(), []);
    T.t.close();
  }

  // ---- Obligation % above 100%, and a negative Approved
  {
    // Initial Spares FY2027: 4.0M obligated in October against a plan that nets to 2.0M: 200.00% actual.
    // O&M FY2026: its plan nets to -2.0M, so Approved by appropriation has a negative share for every FY.
    const OM3 = [row(2027, 'TS0001', 'Tessa A', B_OM, 'T1', '2026-10-15', '3000000', EX), row(2026, 'TS0003', 'Tessa C', B_OM, 'T3', '2026-10-15', '1000000', EX),
      row(2026, 'TS0004', 'Tessa D', B_OM, 'T4', '2027-03-10', '-6000000', NA)];
    const SP3 = [row(2027, 'TS0005', 'Tessa E', B_SP, 'T5', '2026-10-20', '4000000', EX), row(2027, 'TS0008', 'Tessa H', B_SP, 'T8', '2027-06-01', '-2000000', NA)];
    const T = await boot([{ name: 'om.csv', data: csv(OM3) }, { name: 'sp.csv', data: csv(SP3) }]);
    let m = T.main();
    const rects = [...m.querySelectorAll('.ovc[data-bk="sp|2027"] svg rect.b')];
    C.chk('MC-7: a bar above 100% says 200.00% and stays inside the plot', rects[0].querySelector('title').textContent.startsWith('Oct: 200.00% actual')
      && rects.every(r => Number(r.getAttribute('y')) >= 8 && Number(r.getAttribute('y')) + Number(r.getAttribute('height')) <= 112.05), J(rects.slice(0, 2).map(r => [r.getAttribute('y'), r.getAttribute('height')])));
    C.chk('… and FY2027 alone, every share above zero, draws the split', m.querySelectorAll('svg.donut circle').length === 2);
    m = await T.fy('all');
    C.eq('MC-7: with a negative Approved (O&M -2.0M) the table still lists both', [...m.querySelectorAll('.ovaps tr')].map(tr => [tr.getAttribute('data-ap'), Number(tr.querySelector('td[data-c]').getAttribute('data-c'))]),
      [['om', D(-2e6)], ['sp', D(2e6)]]);
    C.chk('MC-7: … and no ring is drawn of a negative share', !m.querySelector('svg.donut'));
    C.eq('above 100%: no script error', T.errors(), []);
    T.t.close();
  }

  // ---- a pull imported before the data-through month ended (MC-5)
  {
    const T = await boot([{ name: 'om.csv', data: csv(OM) }, { name: 'sp.csv', data: csv(SPR) }], { asOf: '2026-11' });
    const m = T.main();
    C.chk('MC-7: a stale pull’s chart label names the import its actuals stop at, as the slide block does', /actual through the 2026-11-09 import, plan after/.test(m.querySelector('.ovc[data-bk="om|2027"] .ovlab').textContent),
      m.querySelector('.ovc[data-bk="om|2027"] .ovlab').textContent);
    C.chk('MC-5: the sentence above the charts does not say “an actual through Nov”', !/through Nov\b/.test(m.querySelector('.cardnote').textContent)
      && /an actual through the month or import its label names, the plan after/.test(m.querySelector('.cardnote').textContent), m.querySelector('.cardnote').textContent);
    const sn = m.querySelector('.ovnotes .ovstale');
    C.chk('MC-5: the Overview names the pulls imported before the month ended, and their import day', !!sn && /before the end of Nov-2026/.test(sn.textContent)
      && /O&M 2026-11-09; Initial Spares 2026-11-09/.test(sn.textContent), sn && sn.textContent);
    const notes = [...(await T.view('summary')).querySelectorAll('ul.notes li')].map(l => l.textContent);
    C.chk('… as the Summary’s note does', notes.some(x => /O&M and Initial Spares pulls were imported before the end of Nov-2026/.test(x)));
    T.t.close();
    const T2 = await boot([{ name: 'om.csv', data: csv(OM) }, { name: 'sp.csv', data: csv(SPR) }]);
    C.chk('MC-5: a pull that reaches the data-through month has no such line, and the sentence names the month', !T2.main().querySelector('.ovstale')
      && /an actual through Oct, the plan after/.test(T2.main().querySelector('.cardnote').textContent) && !T2.main().querySelector('.cardnote.bae-plan'));
    T2.t.close();
  }

  // ---- with a BAE report whose Approved is far from the plan: two readings on one page (MC-2), § by appropriation (MC-3)
  {
    // the report gives O&M FY2027 100.0M (the plan is 8.0M) and O&M FY2026 2.0M (the plan is 4.0M); nothing for Initial Spares
    const T = await boot([{ name: 'om.csv', data: csv(OM) }, { name: 'sp.csv', data: csv(SPR) },
      { name: 'bae.csv', data: baeCsv([[B_OM, 2027, 100000000, 6000000, '', '', ''], [B_OM, 2026, 2000000, 2000000, '', '', '']]) }]);
    let m = await T.fy('all');
    const M = model(T), sl = k => T.SP.slideOf(M.blocks.find(b => b.key === k));
    const sum = summaryRows(await T.view('summary')).filter(r => r.k !== 'total');
    m = await T.view('overview');
    const word = s => (s ? T.SP.statusWord(s) : '');
    C.chk('MC-7: the fixture’s Summary status and slide status differ for a block', sum.some(r => r.st !== word(sl(r.k).status)), J(sum.map(r => [r.k, r.st, word(sl(r.k).status)])));
    C.eq('MC-7: the status counts are the Summary’s rows, not the slide blocks’', chips(m).filter(x => !/^(none|nopct):/.test(x)).map(x => x.split(':')[1]),
      T.SP.STATUS_LEGEND.map(l => sum.filter(r => r.st === l.word).length + ' ' + l.word));
    C.eq('MC-7: a chart’s badge and Obligation % are its slide block’s, not the Summary row’s',
      sum.map(r => { const f = m.querySelector('.ovc[data-bk="' + r.k + '"]'); return [(f.querySelector('figcaption .stc') || { textContent: '' }).textContent, f.querySelector('.ovpct').textContent]; }),
      sum.map(r => [word(sl(r.k).status), T.SP.fmtPct(sl(r.k).oblPct)]));
    const note = m.querySelector('.cardnote.bae-plan');
    C.chk('MC-2: the chart card says the charts measure the CCaR plan and the tiles and counts the Summary’s Approved, in the Slide blocks view’s words',
      !!note && note.textContent.startsWith(T.SP.SLIDES_PLAN_NOTE) && /tiles and the status counts above are the Summary’s/.test(note.textContent), note && note.textContent);
    // Approved 100.0M + 2.0M + the plan's 1.0M (§) = 103.0M; Authorized 6.0M + 2.0M + 1.0M standing in = 9.0M: 8.74%
    C.chk('MC-7: the Authorized tile says 8.74% of Approved', tile(m, 'approved') === D(103e6) && /8\.74% of Approved/.test(tileText(m, 'authorized')), tileText(m, 'authorized'));
    const apCell = ap => m.querySelector('.ovaps tr[data-ap=' + ap + '] td[data-c]').textContent;
    C.eq('MC-3: Approved by appropriation marks the plan’s figure § and not the report’s', [apCell('om'), apCell('sp')], ['102.00', '1.00§']);
    C.chk('… as the Initial Spares view’s own total does', /1\.00§/.test((await T.view('sp')).querySelector('tr[data-bk=total]').textContent));
    C.eq('two readings: no script error', T.errors(), []);
    T.t.close();
  }
} catch (e) {
  C.chk('the run stopped before the end: ' + String((e && e.stack) || e).split('\n').slice(0, 3).join(' | '), false);
}
C.done();
