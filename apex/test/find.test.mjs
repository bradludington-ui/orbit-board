// Find a requirement and the quiet frame (CONTRACT §20). Every expectation is worked by hand from the small invented plan
// below, and the list is held to the Summary of the same page: what the requirements add up to is what a block states.
//
//   node apex/test/find.test.mjs
process.env.TZ = 'America/New_York';
import { loadTool, pageHtml, checks } from './harness.mjs';

const C = checks('find');
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
  // ============================================================================================ an empty file
  {
    const T = await boot(pageHtml({}));
    C.chk('an empty file opens with the Manage data bar open, since the first thing to do is import', !T.doc.getElementById('uiManage').hidden
      && T.doc.getElementById('uiManageBtn').getAttribute('aria-expanded') === 'true' && !!T.doc.querySelector('#uiManage [data-act=import]'));
    C.chk('… and no month to read yet', T.doc.getElementById('uiAsOfText').textContent === '');
    T.t.close();
  }

  // ============================================================================================ the list, with no report
  let saved = null;
  {
    const T = await boot(pageHtml({}));
    T.SP.applyImport(await T.SP.parseFiles(files(null), { now: NOW }));
    T.SP.setSettings({ asOf: '2026-10' });
    await settle(40);
    C.eq('the page opens on Find a requirement', [T.pressed(), T.main().className, !!T.doc.getElementById('uiFindQ')], ['find', 'ov', true]);
    const R = T.SP.requirementsOf(modelOf(T));
    C.eq('the requirements, each worked by hand: money, state and the next month to award',
      R.map(r => [r.ap + '|' + r.fy, r.title, r.ccar, r.planned, r.awarded, r.remaining, r.state, r.next]), WANT);
    const F = R.find(r => r.ccar === 'TS0006');
    C.eq('a requirement’s plan events run by month, each with its money and whether it is awarded or late',
      F.events.map(e => [e.pe, e.ym, e.cents, e.awarded, e.late]),
      [['T6 lot two', '2026-08', D(0.5e6), false, true], ['T6 lot one', '2026-10', D(1e6), true, false], ['T6 lot three', '2027-02', D(2e6), false, false]]);
    C.eq('a plan event with no date comes last and is never late', R.find(r => r.ccar === 'TS0007').events.map(e => [e.pe, e.ym, e.late]), [['T7', null, false]]);
    C.eq('the model as JSON does not carry the rows the list reads', J(modelOf(T)).includes('"rows":[{"d"'), false);
    // on screen
    C.eq('the list on screen, in the words a reader sees', T.rows(), [
      ['Tessa C', 'TS0003 · Air Vehicle (AV)', 'O&M FY2026', D(2e6), D(2e6), 0, 'Awarded'],
      ['Tessa D', 'TS0004 · Air Vehicle (AV)', 'O&M FY2026', D(2e6), 0, D(2e6), 'Dec 2026'],
      ['Garnet Rework', 'TS0007 · Air Vehicle (AV)', 'O&M FY2027', D(0.7e6), 0, D(0.7e6), 'No date'],
      ['Tessa A', 'TS0001 · Air Vehicle (AV)', 'O&M FY2027', D(3e6), D(3e6), 0, 'Awarded'],
      ['Tessa B', 'TS0002 · Air Vehicle (AV)', 'O&M FY2027', D(5e6), 0, D(5e6), 'Mar 2027'],
      ['Tessa F', 'TS0006 · Air Vehicle (AV)', 'O&M FY2027', D(3.5e6), D(1e6), D(2.5e6), 'Was Aug 2026'],
      ['Tessa E', 'TS0005 · Propulsion (PP)', 'Initial Spares FY2027', D(1e6), 0, D(1e6), 'Jun 2027'],
    ]);
    // 2.0 + 2.0 + 0.7 + 3.0 + 5.0 + 3.5 + 1.0 = 17.2 planned; 2.0 + 3.0 + 1.0 = 6.0 awarded; 11.2 still to award
    C.eq('the count line adds them up: 17.20M planned, 6.00M awarded, 11.20M still to award',
      T.doc.getElementById('uiFindCount').textContent, '7 requirements · Planned 17.20 · Awarded 6.00 · Still to award 11.20 ($M)');
    // against the Summary of the same page: a block's requirements add up to the block
    const sum = [...(await T.view('summary')).querySelectorAll('table.top tr[data-bk]')].filter(tr => tr.getAttribute('data-bk') !== 'total')
      .map(tr => [tr.getAttribute('data-bk'), ...[...tr.querySelectorAll('td.n[data-c]')].map(td => Number(td.getAttribute('data-c')))]);
    for (const [k, approved, , obligated] of sum) {
      const mine = R.filter(r => r.ap + '|' + r.fy === k);
      C.eq(k + ': its requirements add up to the Summary’s Approved and Obligated', [mine.reduce((s, r) => s + r.planned, 0), mine.reduce((s, r) => s + r.awarded, 0)], [approved, obligated]);
    }
    await T.view('find');
    // typing narrows the list and leaves the keyboard in the box
    let m = await T.type('garn');
    C.eq('typing part of a title finds it', T.rows().map(r => r[0]), ['Garnet Rework']);
    C.chk('… and the box keeps the keyboard and what was typed', T.doc.activeElement === T.doc.getElementById('uiFindQ') && T.doc.getElementById('uiFindQ').value === 'garn');
    await T.type('ts0002'); C.eq('a CCaR number finds it', T.rows().map(r => r[0]), ['Tessa B']);
    await T.type('lot three'); C.eq('a plan event finds its requirement', T.rows().map(r => r[0]), ['Tessa F']);
    await T.type('tessa 2026'); C.eq('every word must be there: "tessa 2026" is the FY2026 requirements', T.rows().map(r => r[0]), ['Tessa C', 'Tessa D']);
    m = await T.type('zzz');
    C.chk('nothing found is said, with a way back', /No requirement matches/.test(m.textContent) && !!m.querySelector('[data-act=findclear]'));
    T.click(m.querySelector('[data-act=findclear]')); await settle();
    C.eq('Clear the search brings every requirement back', T.rows().length, 7);
    // the pickers
    await T.pick('ap', 'Initial Spares'); C.eq('the Appropriation picker', T.rows().map(r => r[0]), ['Tessa E']);
    await T.pick('ap', 'All'); await T.pick('fy', 'FY2026'); C.eq('the FY picker', T.rows().map(r => r[0]), ['Tessa C', 'Tessa D']);
    await T.pick('fy', 'All'); await T.pick('pmo', 'Propulsion (PP)'); C.eq('the PMO picker', T.rows().map(r => r[0]), ['Tessa E']);
    m = await T.pick('pmo', 'All');
    C.eq('All is offered first in each picker and shows everything', [T.rows().length, ...[...m.querySelectorAll('.findbar select')].map(s => s.options[0].textContent)], [7, 'All', 'All', 'All']);
    // opening one
    C.chk('before one is picked the side panel says so', /Pick a requirement/.test(T.doc.getElementById('uiFindDet').textContent));
    T.click([...m.querySelectorAll('#uiFindRes .tg')].find(b => b.textContent === 'Tessa F')); await settle();
    const det = T.doc.getElementById('uiFindDet');
    C.eq('the one picked lists its plan events by month, in words',
      [...det.querySelectorAll('.fevs li')].map(li => [li.querySelector('.fd').textContent, li.querySelector('.fp').textContent.replace(/\s+/g, ' ').trim(), li.querySelector('.fa').textContent]),
      [['Aug 2026', 'T6 lot two Not awarded', '0.50'], ['Oct 2026', 'T6 lot one Awarded', '1.00'], ['Feb 2027', 'T6 lot three', '2.00']]);
    C.eq('… and its money, PMO, appropriation and budget', [...det.querySelectorAll('.kv')].map(k => k.textContent),
      ['Planned ($M)3.50', 'Awarded ($M)1.00', 'Still to award ($M)2.50', 'PMOAir Vehicle (AV)', 'AppropriationO&M FY2027', 'Budget' + B_OM]);
    C.chk('its row is marked as the one open', T.main().querySelector('#uiFindRes tr.cur .tg').textContent === 'Tessa F'
      && T.main().querySelector('#uiFindRes tr.cur .tg').getAttribute('aria-expanded') === 'true');
    T.click(det.querySelector('[data-act=view]')); await settle();
    C.eq('Open O&M goes to the O&M view', T.pressed(), 'om');
    m = await T.view('find');
    C.chk('coming back, the one picked is still open', T.doc.getElementById('uiFindDet').querySelector('h3').textContent.startsWith('Tessa F'));
    // a month that has not closed is not late: with Data through Jul-2026, August is still to come
    T.SP.setSettings({ asOf: '2026-07' }); await settle(40);
    C.eq('with Data through Jul-2026, a plan event in August is projected, not late', T.rows().find(r => r[0] === 'Tessa F')[6], 'Aug 2026');
    T.SP.setSettings({ asOf: '2026-10' }); await settle(40);
    // the switches: every row here is USAF
    C.chk('the switches are open while the Manage bar is', !T.doc.getElementById('uiSwitches').hidden);
    T.doc.querySelector('input[data-act=svc][data-i="0"]').click(); await settle(40);
    m = T.main();
    C.chk('with USAF switched off no requirement is counted, and the page says what is shown', /^0 requirements/.test(T.doc.getElementById('uiFindCount').textContent)
      && !!m.querySelector('.ovshown.filtered') && /Services shown/.test(T.doc.querySelector('.filtbtn').textContent));
    T.doc.querySelector('input[data-act=svc][data-i="0"]').click(); await settle(40);
    C.eq('no script error', T.errors(), []);
    saved = JSON.parse(J(T.SP.state));
    T.t.close();
  }

  // ============================================================================================ a reader opens the saved file
  {
    const T = await boot(pageHtml({ state: saved }));
    C.eq('a file that holds a plan opens on Find a requirement', [T.pressed(), T.rows().length], ['find', 7]);
    C.chk('… with the Manage data bar closed: no dates to set, no Import, no Save in sight', T.doc.getElementById('uiManage').hidden
      && T.doc.getElementById('uiManageBtn').getAttribute('aria-expanded') === 'false' && T.doc.getElementById('uiManage').contains(T.doc.getElementById('uiAsOf'))
      && T.doc.getElementById('uiManage').contains(T.doc.querySelector('[data-act=save]')) && T.doc.getElementById('uiManage').contains(T.doc.querySelector('[data-act=import]')));
    C.eq('… the month the figures run to, as words', T.doc.getElementById('uiAsOfText').textContent, 'Data through Oct-2026');
    C.chk('… "Saved" not shown to a reader, Export and Help in the top bar', T.doc.getElementById('uiSave').hidden && T.doc.getElementById('uiSave').textContent === 'Saved'
      && !T.doc.getElementById('uiManage').contains(T.doc.querySelector('[data-act=export]')) && !T.doc.getElementById('uiManage').contains(T.doc.getElementById('uiHelp')));
    C.chk('… the switches behind one button that says what is shown', T.doc.getElementById('uiSwitches').hidden
      && T.doc.querySelector('.filtbtn').textContent === 'Filter: All services, both lanes' && T.doc.querySelector('.filtbtn').getAttribute('aria-expanded') === 'false');
    T.click(T.doc.querySelector('.filtbtn')); await settle();
    C.chk('the Filter button opens the switches', !T.doc.getElementById('uiSwitches').hidden && T.doc.querySelector('.filtbtn').getAttribute('aria-expanded') === 'true'
      && T.doc.querySelectorAll('#uiSwitches input[data-act=svc]').length >= 6);
    T.click(T.doc.querySelector('.filtbtn')); await settle();
    T.doc.querySelector('input[data-act=lane][data-l="mand"]').click(); await settle(40);
    C.chk('a switch that is off keeps the switches open, so a filtered page never hides what filtered it', !T.doc.getElementById('uiSwitches').hidden
      && T.doc.querySelector('.filtbtn').classList.contains('filtered'));
    T.doc.querySelector('input[data-act=lane][data-l="mand"]').click(); await settle(40);
    T.click(T.doc.getElementById('uiManageBtn')); await settle();
    C.chk('Manage data opens the bar: the two dates, Import, Save and the pulls line', !T.doc.getElementById('uiManage').hidden
      && T.doc.getElementById('uiManageBtn').getAttribute('aria-expanded') === 'true' && T.doc.getElementById('uiAsOf').value === '2026-10'
      && /O&M imported/.test(T.doc.getElementById('uiPulls').textContent) && !T.doc.getElementById('uiSave').hidden);
    C.eq('the menu’s groups', [...T.doc.querySelectorAll('#uiNav .navg')].map(g => [g.getAttribute('aria-label') || '', g.querySelectorAll('button').length]),
      [['', 3], ['Browse', 5], ['Briefing', 3], ['Data checks', 3], ['Set up', 1]]);
    C.eq('a reader’s file: no script error', T.errors(), []);
    T.t.close();
  }

  // ============================================================================================ with a BAE report
  {
    const T = await boot(pageHtml({}));
    T.SP.applyImport(await T.SP.parseFiles(files([[B_OM, 2027, 10000000, 6000000]]), { now: NOW }));
    T.SP.setSettings({ asOf: '2026-10' });
    await settle(40);
    C.chk('the report is on screen', !!(T.SP.state.bae && T.SP.state.bae.current));
    C.eq('a requirement’s Planned is its CCaR plan, with or without the BAE report',
      T.SP.requirementsOf(modelOf(T)).map(r => [r.ap + '|' + r.fy, r.title, r.ccar, r.planned, r.awarded, r.remaining, r.state, r.next]), WANT);
    T.t.close();
  }
} catch (e) {
  C.chk('the run stopped before the end: ' + String((e && e.stack) || e).split('\n').slice(0, 3).join(' | '), false);
}
C.done();
