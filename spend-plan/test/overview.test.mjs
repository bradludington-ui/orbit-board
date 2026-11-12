// SCOPE's Overview and frame (CONTRACT §18). The Overview works out nothing of its own, so these checks hold it two ways:
// against figures worked out by hand from a small invented plan, and against the Summary view and the slide blocks of the
// same page, which it must never disagree with. Every name and amount here is invented.
//
//   node spend-plan/test/overview.test.mjs
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

async function boot(files) {
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
    T.SP.setSettings({ asOf: '2026-10' });
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
    C.eq('the page is titled SCOPE', T.doc.title, 'SCOPE');
    C.chk('the top names SCOPE, with what the letters stand for', /^SCOPE\s*Sustainment Spend Plans/.test(T.doc.querySelector('h1.brand').textContent)
      && T.doc.querySelector('h1.brand').getAttribute('title') === 'Sustainment Current-Year Obligations, Planning & Execution');
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
    // the workbook and the pictures are named SCOPE
    C.chk('the workbook is named SCOPE', /^SCOPE FY2027 - data through Oct-2026 - 2026-11-09/.test(T.SP.excelFileName(T.SP.buildModel(T.SP.state.pulls.current, T.SP.state.settings, T.SP.defaultView(), null), '2026-11-09')));
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
} catch (e) {
  C.chk('the run stopped before the end: ' + String((e && e.stack) || e).split('\n').slice(0, 3).join(' | '), false);
}
C.done();
