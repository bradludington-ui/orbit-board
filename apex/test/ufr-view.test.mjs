// The Unfunded (UFR) view (CONTRACT §37): the unfunded list under Browse, with its pickers, Find box, tiles, charts and
// total, in $K. Every expectation is worked by hand from the small invented plan and the five invented lines below.
//
//   node apex/test/ufr-view.test.mjs
process.env.TZ = 'America/New_York';
import { loadTool, pageHtml, checks } from './harness.mjs';

const C = checks('ufr-view');
const J = x => JSON.stringify(x);
const settle = (ms = 20) => new Promise(res => setTimeout(res, ms));
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const EX = 'Actual Execution is allocated', NA = 'Not Allocated', AV = 'Air Vehicle (AV)', PP = 'Propulsion (PP)';
const row = (ccar, Title, Budget, pe, Date, Amount, Alloc, PMO) => ({ FY: 2027, 'CCaR No': ccar, Title, Budget, 'Plan Event': pe, Date, Amount, Alloc, PMO });
const B = { usaf: 'USAF O&M- Tessa Base Discretionary', ang: 'USAF ANG O&M Tessa', stovl: 'USN STOVL O&M Tessa', usn: 'USN CV O&M Tessa', sp: 'USAF APN Spares Tessa Base Initial' };
// THE PLAN, FY2027 (JSF6654 is a Special CCaR, so a prime):
//   O&M     JSF6654 Prime Alpha    AV: USAF 3,000,000.40 awarded;  PP: USN 1,000,000 planned     -> Approved 4,000,000.40, Obligated 3,000,000.40
//           TS0002  Tessa B        AV: USAF 5,250,000 planned; ANG 500,000.60 awarded            -> Approved 5,750,000.60, Obligated 500,000.60
//           TS0007  Garnet Rework  PP: STOVL 700,000 planned
//   Spares  TS0005  Tessa E        PP: USAF 1,000,000 planned
const OM = [row('JSF6654', 'Prime Alpha', B.usaf, 'P1', '2026-10-15', '3000000.40', EX, AV), row('JSF6654', 'Prime Alpha', B.usn, 'P2', '2027-03-10', '1000000', NA, PP),
  row('TS0002', 'Tessa B', B.usaf, 'T2a', '2026-10-20', '5250000', NA, AV), row('TS0002', 'Tessa B', B.ang, 'T2b', '2026-10-05', '500000.60', EX, AV),
  row('TS0007', 'Garnet Rework', B.stovl, 'T7', '2026-12-01', '700000', NA, PP)];
const SPR = [row('TS0005', 'Tessa E', B.sp, 'T5', '2027-06-01', '1000000', NA, PP)];
// THE UNFUNDED LIST, FY2027, in $K:
//   O&M     1 Prime Alpha    AV  JSF6654  USAF 2,000  STOVL 500   Pending   Yes  Approved 12 Nov   -> on the prime (over both PMOs)
//           2 Tessa B        AV  TS0002   ANG 300                 Unfunded  No
//           3 New thing      PP  TS0099   USN CV 400              Unfunded  Yes                    -> no plan event: unfunded only
//           4 Garnet Rework  AV  TS0007   USAF 100                Unfunded  Yes  Deferred          -> the plan has TS0007 under PP, not AV: unfunded only
//   Spares  1 Tessa E        PP  TS0005   USAF 250                Pending   No
const K = k => k * 100000;                                   // $K -> cents
const c7 = o => { const a = [0, 0, 0, 0, 0, 0, 0]; for (const k of Object.keys(o)) a[Number(k)] = K(o[k]); return a; };
const line = (ap, rank, title, pmo, ccar, o, status, exec, sfcb) => { const cents = c7(o); return { ap, fy: 2027, sheet: ap === 'om' ? 'O&M' : 'Initial Spares', row: 9 + rank, rank: String(rank), title, pmo, ccar, cents,
  total: cents.reduce((a, b) => a + b, 0), status, exec, sfcb }; };
const LINES = [line('om', 1, 'Prime Alpha', 'AV', 'JSF6654', { 0: 2000, 3: 500 }, 'Pending', 'Yes', 'Approved 12 Nov'), line('om', 2, 'Tessa B', 'AV', 'TS0002', { 1: 300 }, 'Unfunded', 'No', ''),
  line('om', 3, 'New thing', 'PP', 'TS0099', { 5: 400 }, 'Unfunded', 'Yes', ''), line('om', 4, 'Garnet Rework', 'AV', 'TS0007', { 0: 100 }, 'Unfunded', 'Yes', 'Deferred'),
  line('sp', 1, 'Tessa E', 'PP', 'TS0005', { 0: 250 }, 'Pending', 'No', '')];
const UFR = { ok: true, fy: 2027, name: 'UFR Tracker FY27.xlsx', unit: 1000, tabs: [], lines: LINES, notes: [], ignored: [] };
const errs = t => t.errors.filter(e => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click|HTMLCanvasElement)/.test(String(e)));
async function boot(html) {
  const t = loadTool({ html });
  for (let i = 0; i < 200 && !t.window.document.getElementById('uiMain'); i++) await settle(5);
  const W = t.window, doc = W.document;
  const T = { t, W, doc, SP: t.SP, main: () => doc.getElementById('uiMain'),
    click: el => el.dispatchEvent(new W.MouseEvent('click', { bubbles: true })), change: el => el.dispatchEvent(new W.Event('change', { bubbles: true })),
    async view(v) { T.click(doc.querySelector('[data-act=view][data-v="' + v + '"]')); await settle(); return T.main(); },
    async pick(f, label) { const s = T.main().querySelector('select[data-act=ufrf][data-f=' + f + ']'); s.value = [...s.options].find(o => o.textContent === label).value; T.change(s); await settle(); return T.main(); },
    async type(text) { const b = doc.getElementById('uiUfrQ'); b.focus(); b.value = text; b.dispatchEvent(new W.Event('input', { bubbles: true })); await settle(); return T.main(); },
    rows: () => [...T.main().querySelectorAll('#uiUfrT tbody tr[data-ufr]')].map(tr => [tr.querySelector('.urank').textContent, tr.querySelector('.tg').textContent, tr.querySelector('.fsub').textContent, tr.querySelector('.utot').textContent]),
    tile: id => { const x = T.main().querySelector('.tile[data-tile=' + id + ']'); return [x.querySelector('.tv').textContent, x.querySelector('.ts').textContent]; },
    total: () => [...T.main().querySelectorAll('#uiUfrT tr.band td.n')].map(td => td.textContent) };
  return T;
}

try {
  const A = await boot(pageHtml({}));
  const SP = A.SP;
  SP.applyImport(await SP.parseFiles([{ name: 'om.csv', data: csv(OM) }, { name: 'sp.csv', data: csv(SPR) }], { now: '2026-11-09T12:00:00.000Z' }));
  SP.setSettings({ asOf: '2026-10' });
  await settle(40);

  // ---------------------------------------------------------------- the figures (SP.ufrView)
  C.eq('whole thousands, as the tracker is kept: rounded, commas, parentheses, a dash for zero', J([SP.fmtK(123456789), SP.fmtK(K(2500)), SP.fmtK(-K(12)), SP.fmtK(0), SP.fmtK(49999), SP.fmtK(50000)]), J(['1,235', '2,500', '(12)', '-', '-', '1']));
  const M = SP.buildModel(SP.state.pulls.current, SP.state.settings, SP.defaultView(), null);
  const ufr = { 2027: Object.assign({ importedAt: '2026-11-14T15:00:00.000Z' }, UFR) };
  const V = F => SP.ufrView(M, SP.defaultView(), ufr, null, SP.state.settings, F || {});
  const v0 = V();
  C.eq('five lines, in two groups: by appropriation and fiscal year, in rank order', J(v0.groups.map(g => [g.apLabel, g.fy, g.lines.map(l => l.rank + ' ' + l.title)])),
    J([['O&M', 2027, ['1 Prime Alpha', '2 Tessa B', '3 New thing', '4 Garnet Rework']], ['Initial Spares', 2027, ['1 Tessa E']]]));
  C.eq('the six service columns of the tracker; no "No service" column when no line needs one', J(v0.svc.map(x => x.label)), J(['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC CV', 'USN CV']));
  C.eq('each line’s amounts and total', J(v0.lines.map(l => [l.amt, l.sum])), J(LINES.map(l => [l.cents.slice(0, 6), l.total])));
  C.eq('each line’s PMO, as the published plans resolve it (AV is Air Vehicle (AV))', J(v0.lines.map(l => l.pmoLabel)), J([AV, AV, PP, AV, PP]));
  C.eq('beside the spend plan: the prime over both PMOs, Tessa B, then two with no plan event, then Tessa E', J(v0.lines.map(l => l.plan)),
    J([{ approved: 400000040, obligated: 300000040 }, { approved: 575000060, obligated: 50000060 }, null, null, { approved: 100000000, obligated: 0 }]));
  C.eq('the total row', J(v0.total), J({ amt: [K(2350), K(300), 0, K(500), 0, K(400)], sum: K(3550) }));
  C.eq('the tiles: total; exec ready (lines 1, 3 and 4); SFCB approved (line 1); not in the spend plan (lines 3 and 4)',
    J(v0.tiles), J({ sum: K(3550), n: 5, aps: 2, exec: { sum: K(3000), n: 3 }, sfcb: { sum: K(2500), n: 1 }, only: 2 }));
  C.eq('unfunded by PMO, largest first, each in its plan colour', J(v0.byPmo.map(x => [x.label, x.sum, x.color])), J([[AV, K(2900), '#B9D7B0'], [PP, K(650), '#E9B9C4']]));
  C.eq('unfunded by service', J(v0.bySvc.map(x => [x.label, x.sum])), J([['USAF', K(2350)], ['ANG', K(300)], ['AFRC', 0], ['STOVL', K(500)], ['USMC CV', 0], ['USN CV', K(400)]]));
  C.eq('what the pickers offer, from the list itself', J(v0.picks), J({ pmos: [['air vehicle (av)', AV], ['propulsion (pp)', PP]], aps: [['om', 'O&M'], ['sp', 'Initial Spares']], fys: [['2027', 'FY2027']],
    statuses: [['Pending', 'Pending'], ['Unfunded', 'Unfunded']], execs: [['No', 'No'], ['Yes', 'Yes']] }));
  const ranks = v => v.lines.map(l => l.ap + l.rank);
  C.eq('one PMO', J([ranks(V({ pmo: 'propulsion (pp)' })), V({ pmo: 'propulsion (pp)' }).total.sum, V({ pmo: 'propulsion (pp)' }).all]), J([['om3', 'sp1'], K(650), 5]));
  C.eq('one appropriation; one status; exec ready Yes', J([ranks(V({ ap: 'sp' })), ranks(V({ status: 'Pending' })), ranks(V({ exec: 'Yes' }))]), J([['sp1'], ['om1', 'sp1'], ['om1', 'om3', 'om4']]));
  C.eq('Find: part of a title, or of a CCaR number, whatever its case', J([ranks(V({ q: 'garnet' })), ranks(V({ q: ' JSF66 ' })), ranks(V({ q: 'ts00' })), ranks(V({ q: 'zzz' }))]), J([['om4'], ['om1'], ['om2', 'om3', 'om4', 'sp1'], []]));
  C.eq('pickers together narrow together, and the tiles follow', J([ranks(V({ pmo: 'air vehicle (av)', exec: 'Yes' })), V({ pmo: 'air vehicle (av)', exec: 'Yes' }).tiles]),
    J([['om1', 'om4'], { sum: K(2600), n: 2, aps: 1, exec: { sum: K(2600), n: 2 }, sfcb: { sum: K(2500), n: 1 }, only: 1 }]));
  // a service switched off is left out of every amount, as on every other view
  const off = SP.defaultView(); off.svc.USAF = false;
  const vOff = SP.ufrView(M, off, ufr, null, SP.state.settings, {});
  C.eq('USAF switched off: no USAF column; each line and the total are without it', J([vOff.svc.map(x => x.label), vOff.lines.map(l => l.sum), vOff.total.sum]),
    J([['ANG', 'AFRC', 'STOVL', 'USMC CV', 'USN CV'], [K(500), K(300), K(400), 0, 0], K(1200)]));
  C.eq('and Approved in the plan is without USAF too: the prime is its USN 1,000,000; Tessa E, all USAF, is $0 and still in the plan', J([vOff.lines[0].plan, vOff.lines[4].plan]),
    J([{ approved: 100000000, obligated: 0 }, { approved: 0, obligated: 0 }]));
  // an amount the tracker gave under no service has a column of its own
  const odd = SP.ufrView(M, SP.defaultView(), { 2027: Object.assign({}, UFR, { lines: [Object.assign({}, LINES[1], { cents: [0, 0, 0, 0, 0, 0, K(7)], total: K(7) })] }) }, null, SP.state.settings, {});
  C.eq('an amount under no service: a seventh column, "No service"', J([odd.svc.map(x => x.label).slice(-1), odd.lines[0].sum]), J([['No service'], K(7)]));

  // ---------------------------------------------------------------- the page
  const nav = A.doc.querySelector('[data-act=view][data-v="ufr"]');
  C.chk('one item in the menu, the last under Browse', !!nav && nav.textContent === 'Unfunded' && nav.closest('.navg').getAttribute('aria-label') === 'Browse' && nav === nav.closest('.navg').lastElementChild);
  let m = await A.view('ufr');
  C.chk('before a tracker is loaded the page says so, and where to import it', /No unfunded list is loaded\. Import the UFR tracker on Publish PDFs/.test(m.querySelector('#uiUfrEmpty').textContent)
    && !!m.querySelector('#uiUfrEmpty button[data-act=view][data-v=publish]'), m.textContent);
  C.chk('there is no import button on this page: it stays on Publish PDFs', !m.querySelector('[data-act=ufrpick]') && !m.querySelector('input[type=file]'));
  SP.setUfr(UFR, '2026-11-14T15:00:00.000Z'); await settle(40);
  m = A.main();
  C.eq('the title, and which tracker and how many lines', J([m.querySelector('.ovtitle').textContent, m.querySelector('#uiUfrSub').textContent]), J(['Unfunded requirements (UFR)', 'FY2027 UFR tracker, loaded 2026-11-14 · 5 lines']));
  C.eq('the pickers, at the top left, in order', J([...m.querySelectorAll('.ufrbar label')].map(l => l.firstChild.textContent.trim())), J(['Choose your PMO', 'Appropriation', 'FY', 'Funding status', 'Exec ready', 'Find']));
  C.chk('the picker bar is the first thing on the page', m.firstElementChild.classList.contains('ufrbar'));
  C.eq('the Exec ready picker offers All and the values in the tracker’s column', J([...m.querySelector('select[data-f=exec]').options].map(o => o.textContent)), J(['All', 'No', 'Yes']));
  C.eq('the four tiles, in $K', J(['sum', 'exec', 'sfcb', 'only'].map(A.tile)), J([['$3,550K', '5 requirements, 2 appropriations'], ['$3,000K', '3 of 5 requirements'], ['$2,500K', '1 requirement'], ['2', 'unfunded only: no plan event yet']]));
  C.eq('the list: rank, title, CCaR number and total', J(A.rows()), J([['1', 'Prime Alpha', 'JSF6654', '2,500'], ['2', 'Tessa B', 'TS0002', '300'], ['3', 'New thing', 'TS0099', '400'], ['4', 'Garnet Rework', 'TS0007', '100'], ['1', 'Tessa E', 'TS0005', '250']]));
  C.eq('a heading row for each appropriation and fiscal year', J([...m.querySelectorAll('#uiUfrT tr.ugrp')].map(tr => tr.textContent)), J(['O&M FY2027', 'Initial Spares FY2027']));
  C.eq('the columns', J([...m.querySelectorAll('#uiUfrT thead th')].map(th => th.textContent)),
    J(['Rank', 'Requirement', 'PMO', 'USAF', 'ANG', 'AFRC', 'STOVL', 'USMC CV', 'USN CV', 'Total ($K)', 'Funding status', 'Exec ready?', 'SFCB action', 'Approved in plan ($K)']));
  const rowEl = (T, id) => [...T.main().querySelectorAll('tr[data-ufr]')].find(x => x.getAttribute('data-ufr') === id);
  const cells = id => { const tr = [...A.main().querySelectorAll('tr[data-ufr]')].find(x => x.getAttribute('data-ufr') === id); if (!tr) throw new Error('no row ' + id + ' among ' + [...A.main().querySelectorAll('tr[data-ufr]')].map(x => x.getAttribute('data-ufr')).join(' ; ')); return [...tr.children].map(td => td.textContent); };
  C.eq('a line, cell by cell: the prime', J(cells('om|2027|O&M|10')), J(['1', 'Prime AlphaJSF6654', AV, '2,000', '-', '-', '500', '-', '-', '2,500', 'Pending', 'Yes', 'Approved 12 Nov', '4,000']));
  C.eq('a line with no plan event says Unfunded only', cells('om|2027|O&M|12')[13], 'Unfunded only');
  C.eq('the total row', J(A.total()), J(['2,350', '300', '-', '500', '-', '400', '3,550']));
  C.eq('the two charts: by PMO and by service, each bar’s figure', J([...m.querySelectorAll('.card[data-list]')].map(c => [c.querySelector('h3').textContent, [...c.querySelectorAll('li')].map(li => li.querySelector('.fp').textContent + ' ' + li.querySelector('.fa').textContent)])),
    J([['Unfunded by PMO ($K)', [AV + ' 2,900', PP + ' 650']], ['Unfunded by service ($K)', ['USAF 2,350', 'ANG 300', 'AFRC -', 'STOVL 500', 'USMC CV -', 'USN CV 400']]]));
  C.chk('the widest bar of each chart is full width and the others are in proportion', m.querySelector('.card[data-list=pmo] .ubar span').style.width === '100%' && m.querySelectorAll('.card[data-list=pmo] .ubar span')[1].style.width === '22.4%');
  // the pickers
  m = await A.pick('pmo', PP);
  C.eq('Choose your PMO: Propulsion’s two lines, and the count, tiles and total follow', J([A.rows().map(r => r[1]), m.querySelector('#uiUfrN').textContent, A.tile('sum'), A.total().slice(-1)]),
    J([['New thing', 'Tessa E'], '2 of 5 lines', ['$650K', '2 requirements, 2 appropriations'], ['650']]));
  m = await A.pick('ap', 'Initial Spares');
  C.eq('and Initial Spares: one line', J(A.rows().map(r => r[1])), J(['Tessa E']));
  C.chk('Clear filters is offered once something is picked', A.doc.querySelector('[data-act=ufrclear]').disabled === false);
  A.click(A.doc.querySelector('[data-act=ufrclear]')); await settle();
  C.eq('Clear filters shows the whole list again', J([A.rows().length, A.main().querySelector('#uiUfrN').textContent, A.doc.querySelector('[data-act=ufrclear]').disabled]), J([5, '5 lines', true]));
  m = await A.pick('exec', 'Yes');
  C.eq('Exec ready Yes: lines 1, 3 and 4', J(A.rows().map(r => r[1])), J(['Prime Alpha', 'New thing', 'Garnet Rework']));
  A.click(A.doc.querySelector('[data-act=ufrclear]')); await settle();
  // the Find box narrows as it is typed in, and keeps the keyboard
  m = await A.type('garnet');
  C.eq('Find "garnet": one line, with the keyboard still in the box', J([A.rows().map(r => r[1]), A.doc.activeElement && A.doc.activeElement.id, A.main().querySelector('#uiUfrN').textContent]), J([['Garnet Rework'], 'uiUfrQ', '1 of 5 lines']));
  m = await A.type('zzz');
  C.chk('a search nothing matches says so', /No unfunded requirement matches/.test(A.main().querySelector('#uiUfrNone').textContent) && !A.main().querySelector('#uiUfrT'));
  m = await A.type('');
  C.eq('and emptied, the list is back', A.rows().length, 5);
  // a line opened beside its spend plan
  A.click(rowEl(A, 'om|2027|O&M|10').querySelector('.tg')); await settle();
  const det = () => (A.main().querySelector('tr.udetail') || { textContent: '' }).textContent;
  C.chk('pressing the prime opens it beside its spend plan, in $K: Approved, Obligated, Remaining, Required and Delta',
    /In the spend plan \(O&M FY2027\): Approved \$4,000K · Obligated \$3,000K · Remaining \$1,000K · Required \$6,500K \(Approved \+ this unfunded \$2,500K\) · Delta \(2,500\)/.test(det())
    && rowEl(A, 'om|2027|O&M|10').querySelector('.tg').getAttribute('aria-expanded') === 'true', det());
  A.click(rowEl(A, 'om|2027|O&M|12').querySelector('.tg')); await settle();
  C.chk('pressing one with no plan event says it is not in the spend plan, and only one line is open at a time', /Not in the spend plan: no plan event in O&M FY2027 carries this CCaR record under Propulsion \(PP\), so Approved is \$0 and Required is this unfunded \$400K/.test(det())
    && A.main().querySelectorAll('tr.udetail').length === 1, det());
  A.click(A.main().querySelector('tr.udetail [data-act=reqfind]')); await settle();
  C.chk('Open this requirement goes to Requirements, searched for its CCaR number', A.doc.querySelector('#uiNav [aria-pressed=true]').getAttribute('data-v') === 'find' && A.doc.getElementById('uiFindQ').value === 'TS0099');
  // the Filter's services
  await A.view('ufr');
  const usaf = [...A.doc.querySelectorAll('#uiSwitches input[data-act=svc]')].find(b => b.parentElement.textContent.trim() === 'USAF');
  usaf.checked = false; A.change(usaf); await settle(40);
  C.eq('USAF switched off in the Filter: its column goes, and the totals are without it', J([[...A.main().querySelectorAll('#uiUfrT thead th')].map(th => th.textContent).slice(3, 8), A.total(), A.tile('sum')[0], A.main().querySelector('.ovshown').classList.contains('filtered')]),
    J([['ANG', 'AFRC', 'STOVL', 'USMC CV', 'USN CV'], ['300', '-', '500', '-', '400', '1,200'], '$1,200K', true]));
  { const again = [...A.doc.querySelectorAll('#uiSwitches input[data-act=svc]')].find(b => b.parentElement.textContent.trim() === 'USAF'); again.checked = true; A.change(again); await settle(40); }
  C.eq('no script error on the page', J(errs(A.t)), '[]');

  // ---------------------------------------------------------------- on a published, view-only copy
  const VO = await boot(A.SP.viewOnlyHtml('2026-11-19T12:00:00.000Z'));
  m = await VO.view('ufr');
  C.chk('the view-only copy has the view, under Browse', VO.SP.isViewOnly() && m.querySelector('.ovtitle').textContent === 'Unfunded requirements (UFR)');
  C.eq('with the same list and figures', J([VO.rows(), VO.total(), VO.tile('sum')]), J([[['1', 'Prime Alpha', 'JSF6654', '2,500'], ['2', 'Tessa B', 'TS0002', '300'], ['3', 'New thing', 'TS0099', '400'], ['4', 'Garnet Rework', 'TS0007', '100'], ['1', 'Tessa E', 'TS0005', '250']],
    ['2,350', '300', '-', '500', '-', '400', '3,550'], ['$3,550K', '5 requirements, 2 appropriations']]));
  m = await VO.pick('pmo', AV);
  C.eq('and its pickers work', J(VO.rows().map(r => r[1])), J(['Prime Alpha', 'Tessa B', 'Garnet Rework']));
  C.chk('nothing on it imports or removes a list', !m.querySelector('[data-act=ufrpick]') && !m.querySelector('[data-act=ufrdel]') && !m.querySelector('input[type=file]'));
  const state0 = J(VO.SP.state);
  VO.click(VO.main().querySelector('tr[data-ufr] .tg')); await settle(); await VO.type('tessa');
  C.chk('using the view changes nothing in the copy’s plan', J(VO.SP.state) === state0 && VO.SP.isDirty() === false);
  // a view-only copy published with no tracker loaded says so, without pointing to an import it does not have
  A.SP.removeUfr(2027);
  const VE = await boot(A.SP.viewOnlyHtml('2026-11-19T12:00:00.000Z'));
  m = await VE.view('ufr');
  C.chk('a copy published with no unfunded list says none is loaded in this copy, with no way offered to import one', m.querySelector('#uiUfrEmpty').textContent === 'No unfunded list is loaded in this copy.' && !m.querySelector('#uiUfrEmpty button'));
  C.eq('no script error in the copies', J(errs(VO.t).concat(errs(VE.t))), '[]');
  VE.t.close(); VO.t.close(); A.t.close();
} catch (err) {
  console.error(err);
  C.chk('the test ran to its end', false, (err && err.message) || String(err));
}
C.done();
