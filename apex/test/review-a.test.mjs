// Review group A, "finding things" (notes in docs/notes-group-a.md): ways to a requirement and to an office, and what Find shows
// and searches. Invented data throughout: an invented PM/TPOC name is planted to prove no person's name reaches the screen.
//
//   I01 My PMO and By PMO share one remembered office, with a link each way; the pickers that start on All still do
//   I03 on a narrow window a requirement pressed (or jumped to) is brought into view and given the keyboard; a wide one's
//       panel scrolls inside itself
//   I04 the detail lists plan events before budgets; more than three budgets fold behind their count
//   I12 Find's Projected award picker and Order picker; Unfunded keeps its rank order
//   I14 an Unfunded line with no plan event has no button; Unfunded and SRRB jumps land in the line's own appropriation and
//       year, open the one requirement left, and never give the search box the keyboard
//   I17 a view-only copy's Summary leads to Find a requirement and My PMO
//   I32 My PMO's first list looks 1, 2, 3 or 6 months ahead and says its total
//   I33 a search lists title and CCaR matches first; Enter opens the first
//   I37 an Unfunded group says how many lines and whose ranks
//   I51 more than 200 requirements are all listed
//   I52 description, PID and Sub-PMO are shown and searched; people's names are not
//
//   node apex/test/review-a.test.mjs
process.env.TZ = 'America/New_York';
import { loadTool, pageHtml, checks } from './harness.mjs';

const C = checks('review-a');
const J = x => JSON.stringify(x);
const settle = (ms = 25) => new Promise(res => setTimeout(res, ms));
const NOW = '2026-11-09T12:00:00.000Z';
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'SRRB', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, with column Y headed SRRB (§44)
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const EX = 'Actual Execution is allocated', NA = 'Not Allocated', AV = 'Air Vehicle (AV)', PP = 'Propulsion (PP)';
const B_OM = 'USAF O&M- Quill Base Discretionary AV', B_SP = 'USAF APN Spares Tessa Base Initial';
const row = (FY, ccar, Title, Budget, pe, Date, Amount, Alloc, PMO, more) => Object.assign({ FY, 'CCaR No': ccar, Title, Budget, 'Plan Event': pe, Date, Amount, Alloc, PMO: PMO || AV }, more || {});
// Data through Oct-2026.
//   O&M FY2026  Tessa C  TS0003 awarded Dec 2025; Tessa D  TS0004 "Depot Work" planned Dec 2026, SRRB Yes
//   O&M FY2027  Garnet Rework TS0007 no date; Kestrel Pump KP0001 plan event "Tessa lens" Apr 2027 (a title with no "tessa" in it);
//               Tessa A TS0001 awarded; Tessa B TS0002 "Depot Work" Mar 2027 on five budgets (1.0 each);
//               Tessa F TS0006 1.0 awarded Oct, 0.5 late Aug 2026, 2.0 Feb 2027; its rows carry a description, a PID, a Sub-PMO and a
//               PM/TPOC name (invented)
//   Initial Spares FY2027  Tessa E TS0005 Jun 2027, Propulsion
const MORE = { 'Event Description': 'Invented engine overhaul', 'PMT PID#': 'PID-4471', 'Sub-PMO': 'Avionics Sub', 'PM/TPOC': 'Pat Inventedname', 'Contracting POC': 'Kim Madeupname' };
const OM = [
  row(2027, 'TS0001', 'Tessa A', B_OM, 'T1', '2026-10-15', '3000000', EX),
  ...[1, 2, 3, 4, 5].map(i => row(2027, 'TS0002', 'Tessa B', 'USAF O&M- Budget Line ' + i + ' AV', 'Depot Work', '2027-03-10', '1000000', NA)),
  row(2026, 'TS0003', 'Tessa C', B_OM, 'T3', '2025-12-01', '2000000', EX),
  row(2026, 'TS0004', 'Tessa D', B_OM, 'Depot Work', '2026-12-05', '2000000', NA, AV, { SRRB: 'Yes' }),
  row(2027, 'TS0006', 'Tessa F', B_OM, 'T6 lot one', '2026-10-05', '1000000', EX, AV, MORE),
  row(2027, 'TS0006', 'Tessa F', B_OM, 'T6 lot two', '2026-08-10', '500000', NA, AV, MORE),
  row(2027, 'TS0006', 'Tessa F', B_OM, 'T6 lot three', '2027-02-01', '2000000', NA, AV, MORE),
  row(2027, 'TS0007', 'Garnet Rework', B_OM, 'T7', '', '700000', NA),
  row(2027, 'KP0001', 'Kestrel Pump', B_OM, 'Tessa lens', '2027-04-01', '400000', NA),
];
const SPR = [row(2027, 'TS0005', 'Tessa E', B_SP, 'T5', '2027-06-01', '1000000', NA, PP)];
const K = k => k * 100000;
const uline = (rank, title, pmo, ccar, usaf) => ({ ap: 'om', fy: 2027, sheet: 'O&M', row: 9 + rank, rank: String(rank), title, pmo, ccar, cents: [K(usaf), 0, 0, 0, 0, 0, 0], total: K(usaf), status: 'Unfunded', exec: 'Yes', sfcb: '' });
const UFR = { ok: true, fy: 2027, name: 'UFR Tracker FY27.xlsx', unit: 1000, tabs: [], notes: [], ignored: [],
  lines: [uline(1, 'Tessa F more', 'AV', 'TS0006', 200), uline(2, 'New thing', 'PP', 'TS0099', 100), uline(3, 'Tessa B more', 'AV', 'TS0002', 50)] };
const ignorable = /^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click|HTMLCanvasElement)/;

async function boot(html, url) {
  const t = loadTool({ html, url: url || 'http://localhost/apex.html' });
  const W = t.window, doc = W.document;
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  const T = {
    t, W, doc, SP: t.SP, main: () => doc.getElementById('uiMain'),
    click(el) { el.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); },
    change(el) { el.dispatchEvent(new W.Event('change', { bubbles: true })); },
    async view(v) { T.click(doc.querySelector('[data-act=view][data-v="' + v + '"]')); await settle(); return T.main(); },
    async type(s) { const b = doc.getElementById('uiFindQ'); b.focus(); b.value = s; b.dispatchEvent(new W.Event('input', { bubbles: true })); await settle(); return T.main(); },
    async pick(sel, label) { const s = T.main().querySelector(sel); s.value = [...s.options].find(o => o.textContent === label).value; T.change(s); await settle(); return T.main(); },
    rows: () => [...T.main().querySelectorAll('#uiFindRes tbody tr[data-rk]')].map(tr => tr.querySelector('.tg').textContent),
    pressed: () => (doc.querySelector('#uiNav [aria-pressed=true]') || { getAttribute: () => '' }).getAttribute('data-v'),
    errors: () => t.errors.filter(e => !ignorable.test(String(e))),
  };
  return T;
}
async function loaded(T) {
  T.SP.applyImport(await T.SP.parseFiles([{ name: 'om.csv', data: csv(OM) }, { name: 'sp.csv', data: csv(SPR) }], { now: NOW }));
  T.SP.setSettings({ asOf: '2026-10' });
  await settle(40);
}

try {
  const T = await boot(pageHtml({}));
  await loaded(T);
  const SP = T.SP, doc = T.doc;
  const M = SP.buildModel(SP.state.pulls.current, SP.state.settings, SP.getView ? SP.getView() : SP.defaultView(), null);
  const R = SP.requirementsOf(M), F = R.find(r => r.ccar === 'TS0006');

  // ================================================================ I52 description, PID and Sub-PMO; never a person's name
  C.eq('I52: a requirement carries its PID and Sub-PMO, and each plan event its description', J([F.pid, F.sub, F.events.map(e => e.desc)]),
    J([['PID-4471'], ['Avionics Sub'], [['Invented engine overhaul'], ['Invented engine overhaul'], ['Invented engine overhaul']]]));
  C.chk('I52: a derived row as JSON is what it was (the three texts are kept off its keys)', !/PID-4471|overhaul|Avionics/.test(J(SP.state.pulls.current.om.rows.map(r => SP.deriveRow(r, SP.state.settings)))));
  await T.view('find');
  for (const [w, want] of [['overhaul', ['Tessa F']], ['pid-4471', ['Tessa F']], ['avionics', ['Tessa F']], ['Inventedname', []], ['madeupname', []]])
    C.eq('I52: searching "' + w + '"', (await T.type(w), T.rows()), want);
  await T.type('');
  T.click([...T.main().querySelectorAll('#uiFindRes [data-act=findsel]')].find(b => b.textContent === 'Tessa F')); await settle();
  const det = () => doc.getElementById('uiFindDet');
  C.eq('I52: the detail shows the Sub-PMO and the PID', [...det().querySelectorAll('.kv')].map(k => k.textContent).filter(x => /^(Sub-PMO|PID)/.test(x)), ['Sub-PMOAvionics Sub', 'PIDPID-4471']);
  C.eq('I52: … and each plan event its description', [...det().querySelectorAll('.fevs .fdesc')].map(x => x.textContent), ['Invented engine overhaul', 'Invented engine overhaul', 'Invented engine overhaul']);
  C.chk('I52: no person’s name is on the page', !/Inventedname|Madeupname/.test(doc.body.textContent));
  C.chk('I52: the search box says what it reads', /description or PID/.test(doc.getElementById('uiFindQ').getAttribute('placeholder')));

  // ================================================================ I04 plan events before budgets; many budgets fold
  T.click([...T.main().querySelectorAll('#uiFindRes [data-act=findsel]')].find(b => b.textContent === 'Tessa B')); await settle();
  { const d = det(), evAt = [...d.children].indexOf(d.querySelector('h3.fev')), bud = d.querySelector('details.fbud');
    C.chk('I04: five budgets fold behind their count, closed', !!bud && bud.querySelector('summary').textContent === '5 budgets' && !bud.open);
    C.chk('I04: the plan events come before the budgets', !!bud && evAt >= 0 && evAt < [...d.children].indexOf(bud));
    C.chk('I04: a requirement with one budget still shows it as a line', (T.click([...T.main().querySelectorAll('#uiFindRes [data-act=findsel]')].find(b => b.textContent === 'Tessa A')), await settle(),
      [...det().querySelectorAll('.kv')].some(k => k.textContent === 'Budget' + B_OM) && !det().querySelector('details.fbud'))); }
  await T.type('line 4'); T.click(T.main().querySelector('#uiFindRes [data-act=findsel]')); await settle();
  C.chk('I04: a search that matched a budget opens the fold', T.rows().join() === 'Tessa B' && det().querySelector('details.fbud').open);
  await T.type('');

  // ================================================================ I33 title and CCaR matches first; Enter opens the first
  await T.type('tessa');
  C.eq('I33: "tessa": every title holding it first, in the list’s order, then the one that matched a plan event', T.rows(), ['Tessa C', 'Tessa D', 'Tessa A', 'Tessa B', 'Tessa F', 'Tessa E', 'Kestrel Pump']);
  C.chk('I33: a quiet heading parts them', (T.main().querySelector('#uiFindRes tr.fgrp') || {}).nextElementSibling === T.main().querySelector('#uiFindRes tr[data-rk]:last-child')
    && /Also matched/.test(T.main().querySelector('#uiFindRes tr.fgrp').textContent));
  await T.type('garn');
  C.chk('I33: one group alone has no heading', !T.main().querySelector('#uiFindRes tr.fgrp'));
  await T.type('tessa');
  doc.getElementById('uiFindQ').dispatchEvent(new T.W.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await settle();
  C.chk('I33: Enter in the box opens the first requirement listed, and the box keeps the keyboard', det().querySelector('h3').textContent.startsWith('Tessa C') && doc.activeElement === doc.getElementById('uiFindQ'));
  await T.type('');

  // ================================================================ I12 Projected award picker and Order
  for (const [label, want] of [['Past its projected date', ['Tessa F']], ['In the next 3 months', ['Tessa D']], ['In the next 2 months', ['Tessa D']], ['In the next month', []],
    ['More than 3 months out', ['Kestrel Pump', 'Tessa B', 'Tessa E']], ['No date', ['Garnet Rework']], ['Awarded', ['Tessa C', 'Tessa A']]])
    C.eq('I12: Projected award "' + label + '"', (await T.pick('select[data-f=st]', label), T.rows()), want);
  await T.pick('select[data-f=st]', 'All');
  await T.pick('select[data-f=ord]', 'Still to award, largest first');
  C.eq('I12: Still to award, largest first, across every appropriation and year', T.rows(), ['Tessa B', 'Tessa F', 'Tessa D', 'Tessa E', 'Garnet Rework', 'Kestrel Pump', 'Tessa C', 'Tessa A']);
  C.chk('I12: … and the count line says the order is on this screen only', /in order of still to award, largest first, on this screen only/.test(doc.getElementById('uiFindCount').textContent));
  await T.pick('select[data-f=ord]', 'Projected award, earliest first');
  C.eq('I12: Projected award, earliest first; nothing to award or no date last', T.rows().slice(0, 6), ['Tessa F', 'Tessa D', 'Tessa B', 'Kestrel Pump', 'Tessa E', 'Tessa C']);
  await T.pick('select[data-f=ord]', 'Appropriation, FY, title');
  C.eq('I12: the list’s own order back', T.rows(), ['Tessa C', 'Tessa D', 'Garnet Rework', 'Kestrel Pump', 'Tessa A', 'Tessa B', 'Tessa F', 'Tessa E']);

  // ================================================================ I51 more than 200 listed
  {
    const U = await boot(pageHtml({}));
    const many = Array.from({ length: 230 }, (_, i) => row(2027, 'MN' + String(i).padStart(4, '0'), 'Many ' + String(i).padStart(3, '0'), B_OM, 'E' + i, '2027-01-01', '1000', NA));
    U.SP.applyImport(await U.SP.parseFiles([{ name: 'om.csv', data: csv(many) }, { name: 'sp.csv', data: csv(SPR) }], { now: NOW })); U.SP.setSettings({ asOf: '2026-10' }); await settle(40);
    await U.view('find');
    C.eq('I51: 231 requirements are every one listed, the last appropriation too', [U.rows().length, U.rows()[230], /are listed: type more/.test(U.doc.getElementById('uiFindCount').textContent)], [231, 'Tessa E', false]);
    U.t.close();
  }

  // ================================================================ I32 My PMO's first list: how far ahead, and its total
  let m = await T.view('mypmo');
  await T.pick('select[data-act=pmof][data-f=pmo]', AV);
  const tile3 = T.main().querySelector('.tile[data-tile=remaining] .tv').getAttribute('data-c');
  const soon = () => [...T.main().querySelectorAll('[data-list=soon] .plist li .tg')].map(b => b.textContent);
  C.eq('I32: three months by default, Nov 2026 to Jan 2027, with the list’s total', [T.main().querySelector('[data-list=soon] h3').textContent, soon(), doc.getElementById('uiPmoSoonTot').textContent],
    ['Projected to award in the next three months', ['Tessa D'], '1 plan event, 2.00 ($M), Nov 2026 to Jan 2027']);
  await T.pick('select[data-act=pmof][data-f=win]', 'Next 6 months');
  C.eq('I32: six months: to Apr 2027, every plan event of those months, added up', [T.main().querySelector('[data-list=soon] h3').textContent, soon(), doc.getElementById('uiPmoSoonTot').textContent],
    ['Projected to award in the next 6 months', ['Tessa D', 'Tessa F', 'Tessa B', 'Kestrel Pump'], '4 plan events, 9.40 ($M), Nov 2026 to Apr 2027']);
  C.chk('I32: the tiles do not move with it', T.main().querySelector('.tile[data-tile=remaining] .tv').getAttribute('data-c') === tile3);
  await T.pick('select[data-act=pmof][data-f=win]', 'Next month');
  C.chk('I32: next month alone, and an empty list says which month', /Nothing is projected to award in Nov 2026\./.test(T.main().querySelector('[data-list=soon]').textContent) && !doc.getElementById('uiPmoSoonTot'));
  await T.pick('select[data-act=pmof][data-f=win]', 'Next 3 months');

  // ================================================================ I01 one office for My PMO and By PMO; the All pickers stay on All
  await T.pick('select[data-act=pmof][data-f=pmo]', PP);
  C.chk('I01: My PMO links to the office’s spend plan', !!T.main().querySelector('[data-act=view][data-v=pmos]'));
  T.click(T.main().querySelector('[data-act=view][data-v=pmos]')); await settle();
  C.eq('I01: By PMO opens on the office picked on My PMO', [T.pressed(), T.main().querySelector('select[data-act=pmo]').selectedOptions[0].textContent], ['pmos', PP]);
  m = await T.pick('select[data-act=pmo]', AV);
  C.chk('I01: a pick on By PMO is remembered in this browser', T.W.localStorage.getItem('sfcbsp.pmo') === SP.normKey(AV));
  T.click(T.main().querySelector('[data-act=view][data-v=mypmo]')); await settle();
  C.eq('I01: … and the link back opens My PMO on it', [T.pressed(), T.main().querySelector('select[data-act=pmof][data-f=pmo]').selectedOptions[0].textContent], ['mypmo', AV]);
  for (const v of ['find', 'cal', 'charts']) {
    m = await T.view(v);
    C.eq('I01: ' + v + '’s PMO picker still starts on All', m.querySelector('select[data-f=pmo]').selectedOptions[0].textContent, 'All');
  }
  { // a new page in the same browser: both start on the office remembered
    const T2 = await boot(pageHtml({ state: JSON.parse(J(SP.state)) }));
    T2.W.localStorage.setItem('sfcbsp.pmo', SP.normKey(PP));
    const m2 = await T2.view('pmos');
    C.eq('I01: a page opened later starts By PMO on the remembered office', m2.querySelector('select[data-act=pmo]').selectedOptions[0].textContent, PP);
    T2.t.close();
  }

  // ================================================================ I14 jumps from Unfunded and SRRB
  SP.setUfr(UFR, '2026-11-14T15:00:00.000Z'); await settle(40);
  m = await T.view('ufr');
  const urow = title => [...T.main().querySelectorAll('#uiUfrT tr[data-ufr]')].find(tr => tr.querySelector('.tg').textContent === title);
  T.click(urow('New thing').querySelector('.tg')); await settle();
  C.chk('I14: a line with no plan event offers no way to Requirements', /Not in the spend plan/.test(T.main().querySelector('tr.udetail').textContent) && !T.main().querySelector('tr.udetail [data-act=reqfind]'));
  T.click(urow('Tessa F more').querySelector('.tg')); await settle();
  T.click(T.main().querySelector('tr.udetail [data-act=reqfind]')); await settle();
  C.eq('I14: a line in the plan lands on its one requirement, in its own appropriation and year, opened',
    [T.pressed(), doc.getElementById('uiFindQ').value, T.main().querySelector('select[data-f=ap]').selectedOptions[0].textContent, T.main().querySelector('select[data-f=fy]').selectedOptions[0].textContent,
      T.rows(), (det().querySelector('h3') || {}).textContent], ['find', 'TS0006', 'O&M', 'FY2027', ['Tessa F'], 'Tessa F TS0006']);
  C.chk('I14: … the keyboard is on the requirement, never in the search box', doc.activeElement !== doc.getElementById('uiFindQ') && doc.activeElement === T.main().querySelector('#uiFindRes tr.cur [data-act=findsel]'));
  m = await T.view('srrb');
  T.click([...T.main().querySelectorAll('#uiSrrbT [data-act=reqfind]')].find(b => b.textContent === 'Depot Work')); await settle();
  C.eq('I14: an SRRB line lands in its own year: "Depot Work" of O&M FY2026 is Tessa D alone (FY2027’s Tessa B shares the name)',
    [T.pressed(), doc.getElementById('uiFindQ').value, T.rows(), (det().querySelector('h3') || {}).textContent], ['find', 'Depot Work', ['Tessa D'], 'Tessa D TS0004']);
  // a Special CCaR line keeps listing every part, with nothing narrowing (§21, §28)
  { await T.view('find'); T.SP.setSettings({ special: ['TS0002'] }); await settle(40);
    m = await T.view('cal');
    T.click(T.main().querySelector('tr[data-sp] [data-act=reqfind]')); await settle();
    C.eq('I14: the Calendar’s Special CCaR line still lists its requirement with every picker on All', [T.pressed(), doc.getElementById('uiFindQ').value, [...T.main().querySelectorAll('.findbar select')].slice(0, 3).map(s => s.selectedOptions[0].textContent)],
      ['find', 'TS0002', ['All', 'All', 'All']]);
    T.SP.setSettings({ special: SP.SPECIAL_CCARS_DEFAULT.slice() }); await settle(40); }

  // ================================================================ I37 an Unfunded group says how many and whose ranks
  m = await T.view('ufr');
  C.eq('I37: the group heading, keeper’s page, nothing ranked', [...m.querySelectorAll('#uiUfrT tr.ugrp')].map(x => x.textContent), ['O&M FY2027 · 3 lines, in the UFR tracker’s ranks']);
  m = await T.pick('select[data-act=ufrf][data-f=pmo]', PP);
  C.eq('I37: a PMO picked: the whole group is still counted, and how many are shown', [...m.querySelectorAll('#uiUfrT tr.ugrp')].map(x => x.textContent), ['O&M FY2027 · 3 lines (1 shown), in the UFR tracker’s ranks']);
  C.chk('I37: the note says a rank runs across every PMO', /across every PMO, so a PMO picked shows gaps/.test(m.textContent));
  C.chk('I12: Unfunded keeps its rank order, whatever order Find was put in', (await T.pick('select[data-act=ufrf][data-f=pmo]', 'All'),
    J([...T.main().querySelectorAll('#uiUfrT tr[data-ufr] .urank')].map(td => (td.querySelector('input') || td).value || td.textContent))) === J(['1', '2', '3']));

  // ================================================================ I03 a requirement pressed on a narrow window
  {
    await T.view('find'); await T.type('');
    const seen = [];
    const proto = T.W.Element.prototype, had = proto.scrollIntoView;
    proto.scrollIntoView = function () { seen.push(this.id || this.tagName); };
    { const b = [...T.main().querySelectorAll('#uiFindRes [data-act=findsel]')].find(x => x.textContent === 'Tessa E'); b.focus(); T.click(b); await settle(); }   // a press: the button has the keyboard
    C.chk('I03: on a wide window the detail is beside the list: the keyboard stays on the row and nothing scrolls', doc.activeElement && doc.activeElement.getAttribute('data-act') === 'findsel' && !seen.length);
    T.W.matchMedia = qq => ({ matches: /max-width: *1100px/.test(qq), media: qq, addListener() {}, removeListener() {} });
    T.click([...T.main().querySelectorAll('#uiFindRes [data-act=findsel]')].find(b => b.textContent === 'Tessa D')); await settle();
    C.chk('I03: 1,100 px or narrower: the detail is brought into view and its heading takes the keyboard', doc.activeElement === doc.getElementById('uiFindDetH')
      && /^Tessa D/.test(doc.activeElement.textContent) && seen.includes('uiFindDet'), J(seen) + ' ' + (doc.activeElement && doc.activeElement.outerHTML.slice(0, 80)));
    seen.length = 0;
    m = await T.view('mypmo');
    T.click(T.main().querySelector('[data-list=soon] [data-act=reqopen]')); await settle();
    C.chk('I03: a jump from My PMO on a narrow window does the same', T.pressed() === 'find' && doc.activeElement === doc.getElementById('uiFindDetH') && seen.includes('uiFindDet'));
    delete T.W.matchMedia; proto.scrollIntoView = had;
    const css = [...doc.querySelectorAll('style')].map(s => s.textContent).join('\n');
    C.chk('I03: on a wide window the side panel scrolls inside itself, below the pinned top', /@media \(min-width:1101px\)\{\.finddet\{max-height:calc\(100vh - var\(--topH, 96px\) - 24px\);overflow:auto\}\}/.test(css));
  }

  // ================================================================ I17 a view-only copy's Summary leads somewhere
  m = await T.view('summary');
  C.chk('I17: the keeper’s own Summary is as it was', !m.querySelector('#uiSumGo'));
  {
    const VO = await boot(SP.viewOnlyHtml('2026-11-19T12:00:00.000Z'));
    let v = VO.main();
    C.eq('I17: a view-only copy opens on the Summary, with a way to Find a requirement and to My PMO above the table', [VO.pressed(), [...v.querySelectorAll('#uiSumGo button')].map(b => b.textContent),
      v.querySelector('#uiSumGo').nextElementSibling.tagName], ['summary', ['Find a requirement', 'My PMO'], 'H2']);
    VO.click(v.querySelector('#uiSumGo [data-v=find]')); await settle();
    C.chk('I17: Find a requirement goes there', VO.pressed() === 'find' && !!VO.doc.getElementById('uiFindQ'));
    await VO.view('mypmo'); await VO.pick('select[data-act=pmof][data-f=pmo]', PP);
    v = await VO.view('summary');
    C.eq('I17: once an office is picked, the button names it', v.querySelector('#uiSumGo [data-v=mypmo]').textContent, 'My PMO: ' + PP);
    const css = [...VO.doc.querySelectorAll('style')].map(s => s.textContent).join('\n');
    C.chk('I17: the buttons are never printed', /@media print\{\.golinks\{display:none\}\}/.test(css));
    C.eq('I17: no script error in the copy', VO.errors(), []);
    VO.t.close();
  }
  C.eq('no script error', T.errors(), []);
  T.t.close();
} catch (e) {
  C.chk('the test ran to its end', false, (e && e.stack) || String(e));
} finally {
  C.done();
}
