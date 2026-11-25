// Mandatory plan events as unfunded lines (CONTRACT §45). With the switch on, the Unfunded page lists every plan event on a
// Mandatory budget in the CCaR pull as unfunded, one line a plan event within its CCaR record, marked Mandatory; nothing
// else in the tool changes (the spend plan pages and the PDFs still count that money as Approved); a view-only copy made
// with it on shows them and cannot change it. Invented data; every expectation is written out by hand from the rows below.
//
//   node apex/test/ufr-mandatory.test.mjs
process.env.TZ = 'America/New_York';
import { loadTool, pageHtml, checks } from './harness.mjs';

const C = checks('ufr-mandatory');
const J = x => JSON.stringify(x);
const settle = (ms = 40) => new Promise(res => setTimeout(res, ms));
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description', 'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC',
  'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code', 'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const NA = 'Not Allocated', AV = 'Air Vehicle (AV)', PP = 'Propulsion (PP)';
const B = { disc: 'USAF O&M- Tessa Base Discretionary', mUsaf: 'USAF O&M- Tessa Base Mandatory', mAng: 'USAF ANG O&M Tessa Mandatory', mStovl: 'USN STOVL O&M Tessa Mandatory', mSp: 'USAF APN Spares Tessa Base Initial Mandatory' };
const row = (ccar, Title, Budget, pe, Date, Amount, PMO) => ({ FY: 2027, 'CCaR No': ccar, Title, Budget, 'Plan Event': pe, Date, Amount, Alloc: NA, PMO });
// THE PULL, FY2027:
//   O&M     C1 Tessa A  "Lot One"    USAF Mandatory   2,400,000   PP
//           C1 Tessa A  "Lot One"    ANG Mandatory      300,000   PP     -> Lot One: USAF 2,400, ANG 300 = $2,700K
//           C1 Tessa A  "Lot Two"    USAF Mandatory   1,800,000   PP     -> the same record, another plan event: a line of its own, $1,800K
//           C1 Tessa A  "Lot One"    USAF Discretionary 5,000,000 PP     -> Discretionary: not Mandatory money, not listed
//           C2 Tessa B  "Repair"     STOVL Mandatory  1,500,000   AV     -> $1,500K
//           C3 Tessa C  "Disc Only"  USAF Discretionary 900,000   AV     -> not listed
//   Spares  C4 Tessa D  "Kit"        USAF Mandatory     700,000   PP     -> $700K
//   Mandatory in all: 4 plan events, $6,700K.
const OM = [row('C1', 'Tessa A', B.mUsaf, 'Lot One', '2026-12-01', '2400000', PP), row('C1', 'Tessa A', B.mAng, 'Lot One', '2027-01-01', '300000', PP), row('C1', 'Tessa A', B.mUsaf, 'Lot Two', '2027-02-01', '1800000', PP),
  row('C1', 'Tessa A', B.disc, 'Lot One', '2026-12-01', '5000000', PP), row('C2', 'Tessa B', B.mStovl, 'Repair', '2027-03-01', '1500000', AV), row('C3', 'Tessa C', B.disc, 'Disc Only', '2026-11-01', '900000', AV)];
const SPR = [row('C4', 'Tessa D', B.mSp, 'Kit', '2027-04-01', '700000', PP)];
// THE UFR TRACKER, O&M FY2027, $K:   1 Depot tooling TS9 AV USAF 900     2 Tessa A C1 PP USAF 500  (C1 has Mandatory plan events too)
const K = k => k * 100000;
const tl = (rank, title, pmo, ccar, k) => ({ ap: 'om', fy: 2027, sheet: 'O&M', row: 9 + rank, rank: String(rank), title, pmo, ccar, cents: [K(k), 0, 0, 0, 0, 0, 0], total: K(k), status: 'Unfunded', exec: 'Yes', sfcb: '' });
const TRK = { ok: true, fy: 2027, name: 'UFR FY27.xlsx', unit: 1000, tabs: [], notes: [], ignored: [], lines: [tl(1, 'Depot tooling', 'AV', 'TS9', 900), tl(2, 'Tessa A', 'PP', 'C1', 500)] };
const MODS = ['util', 'xlsx-read', 'import', 'engine', 'publish', 'pdf', 'xlsx-write', 'store'];
const NOW = '2026-11-09T12:00:00.000Z';
const errs = t => t.errors.filter(e => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click|HTMLCanvasElement)/.test(String(e)));

try {
  // ============================================================================ the lines themselves
  const t = loadTool({ modules: MODS }), SP = t.SP;
  SP.storeInit();
  SP.applyImport(await SP.parseFiles([{ name: 'om.csv', data: csv(OM) }, { name: 'sp.csv', data: csv(SPR) }], { now: NOW }));
  SP.setSettings({ asOf: '2026-10' });
  const M = SP.buildModel(SP.state.pulls.current, SP.state.settings, SP.defaultView(), null);
  const L = SP.ufrMandatory(M);
  C.eq('one line a plan event within its CCaR record, over its Mandatory rows only, by service', J(L.map(l => [l.ap, l.fy, l.title, l.ccar, l.record, l.pmo, l.cents, l.total, l.status, l.mand, l.rank])), J([
    ['om', 2027, 'Lot One', 'C1', 'Tessa A', PP, [240000000, 30000000, 0, 0, 0, 0, 0], 270000000, 'Mandatory', true, ''],
    ['om', 2027, 'Lot Two', 'C1', 'Tessa A', PP, [180000000, 0, 0, 0, 0, 0, 0], 180000000, 'Mandatory', true, ''],
    ['om', 2027, 'Repair', 'C2', 'Tessa B', AV, [0, 0, 0, 150000000, 0, 0, 0], 150000000, 'Mandatory', true, ''],
    ['sp', 2027, 'Kit', 'C4', 'Tessa D', PP, [70000000, 0, 0, 0, 0, 0, 0], 70000000, 'Mandatory', true, '']]));
  const W = SP.ufrWithMandatory({ 2027: TRK }, M);
  C.eq('added to the tracker’s list for the year, numbered after its lines; an appropriation the tracker has no line for starts at 1', J([W.n, W.cents, W.ufr[2027].lines.map(l => [l.ap, l.rank, l.title, !!l.mand])]),
    J([4, 670000000, [['om', '1', 'Depot tooling', false], ['om', '2', 'Tessa A', false], ['om', '3', 'Lot One', true], ['om', '4', 'Lot Two', true], ['om', '5', 'Repair', true], ['sp', '1', 'Kit', true]]]));
  C.eq('a CCaR record on the tracker that has Mandatory plan events too is flagged, once', J(W.overlap), J(['O&M FY2027: CCaR C1 is on the UFR tracker and has Mandatory plan events listed too; check it is not counted twice.']));
  C.chk('the tracker’s own list is not changed', TRK.lines.length === 2 && J(Object.keys(TRK.lines[0])).indexOf('mand') < 0);
  const W0 = SP.ufrWithMandatory({}, M);
  C.eq('with no tracker loaded the year gets a list of its own, marked as Mandatory only', J([W0.ufr[2027].mandOnly, W0.ufr[2027].lines.map(l => l.ap + ' ' + l.rank + ' ' + l.title), W0.overlap]),
    J([true, ['om 1 Lot One', 'om 2 Lot Two', 'om 3 Repair', 'sp 1 Kit'], []]));
  // the store
  C.chk('the switch is off until turned on; turning it on marks the plan unsaved; the same again changes nothing', (() => { const a = SP.state.ufrMand, b = SP.setUfrMandatory(true), c = SP.setUfrMandatory(true);
    return a === undefined && b === true && c === false && SP.state.ufrMand === true && SP.isDirty(); })());
  const saved = SP.savedHtml();
  C.chk('turning it off takes it out of the plan', SP.setUfrMandatory(false) === true && SP.state.ufrMand === undefined);
  t.close();
  const t2 = loadTool({ html: saved }); t2.SP.storeInit();
  C.chk('a saved plan opens with the switch as it was', t2.SP.state.ufrMand === true);
  t2.close();
  const bad = loadTool({ html: saved.replace('"ufrMand":true', '"ufrMand":"yes"') }); bad.SP.storeInit();
  C.chk('a saved plan whose switch is not yes or no is not opened as a plan', bad.SP.state.ufrMand === undefined && !Object.keys(bad.SP.state.pulls.current).length);
  bad.close();

  // ============================================================================ on the page
  const A = loadTool({ html: pageHtml({}) }), Wd = A.window, doc = Wd.document, S = A.SP;
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  const main = () => doc.getElementById('uiMain');
  const click = async el => { el.dispatchEvent(new Wd.MouseEvent('click', { bubbles: true })); await settle(); };
  const go = v => click(doc.querySelector('#uiNav [data-v="' + v + '"]'));
  S.applyImport(await S.parseFiles([{ name: 'om.csv', data: csv(OM) }, { name: 'sp.csv', data: csv(SPR) }], { now: NOW }));
  S.setSettings({ asOf: '2026-10' });
  await settle(60);
  const rows = () => [...main().querySelectorAll('#uiUfrT tbody tr[data-ufr]')].map(tr => { const i = tr.querySelector('input.urk'), c = tr.children;
    return [i ? i.value : c[0].textContent, tr.querySelector('.tg').textContent, tr.classList.contains('umand') ? 'Mandatory' : '', tr.querySelector('.uccar').textContent, c[3].textContent, tr.querySelector('.utot').textContent, c[c.length - 4].textContent, c[c.length - 1].textContent, tr.classList.contains('umand')]; });
  const flip = async on => { const b = main().querySelector('input[data-act=ufrmand]'); b.checked = on; b.dispatchEvent(new Wd.Event('change', { bubbles: true })); await settle(); };
  const tile = id => { const x = main().querySelector('.tile[data-tile=' + id + ']'); return x ? [x.querySelector('.tv').textContent, x.querySelector('.ts').textContent] : null; };
  // no tracker loaded: the page says so, and offers the switch
  await go('ufr');
  C.chk('with no tracker loaded the page still offers the switch, off, and says what it would list', /No unfunded list is loaded/.test(main().textContent) && main().querySelector('input[data-act=ufrmand]').checked === false
    && /Off: the list is the UFR tracker alone\. On, the 4 plan events on Mandatory budgets in the CCaR pull \(\$6,700K\) would be listed below as unfunded/.test(main().querySelector('#uiUfrMand').textContent), main().querySelector('#uiUfrMand') && main().querySelector('#uiUfrMand').textContent);
  await flip(true);
  C.eq('turned on with no tracker: the four Mandatory plan events are the list, numbered within their appropriation', J(rows().map(r => r.slice(0, 3))), J([['1', 'Lot One', 'Mandatory'], ['2', 'Lot Two', 'Mandatory'], ['3', 'Repair', 'Mandatory'], ['1', 'Kit', 'Mandatory']]));
  C.chk('the page says the list is the pull’s Mandatory plan events, not a tracker', /FY2027 Mandatory plan events from the CCaR pull/.test(main().querySelector('#uiUfrSub').textContent) && !/UFR tracker, loaded/.test(main().querySelector('#uiUfrSub').textContent));
  await flip(false);
  // with the tracker
  S.setUfr(TRK, '2026-11-10T12:00:00.000Z'); await go('ufr');
  C.eq('switch off: the list is the tracker alone, four tiles', J([rows().map(r => r.slice(0, 2)), tile('mand'), tile('sum')]), J([[['1', 'Depot tooling'], ['2', 'Tessa A']], null, ['$1,400K', '2 requirements, 1 appropriation']]));
  const omBefore = await (async () => { await go('om'); const h = main().innerHTML; await go('overview'); const o = main().innerHTML; await go('publish'); const p = main().innerHTML; await go('ufr'); return [h, o, p]; })();
  S.markSaved && S.markSaved();
  await flip(true);
  C.chk('the message says what was done, and the plan is unsaved', /Mandatory plan events are listed as unfunded on this page\. The spend plan pages and the PDFs are not changed\./.test(doc.querySelector('.msg').textContent) && S.isDirty() && S.state.ufrMand === true);
  //         rank  title           tag          under the title  PMO   total  status       approved in plan  tinted
  C.eq('switch on: the tracker’s lines, then each Mandatory plan event on a line of its own, marked, with its own amount as what the plan carries', J(rows()), J([
    ['1', 'Depot tooling', '', 'TS9', AV, '900', 'Unfunded', 'Unfunded only', false],
    ['2', 'Tessa A', '', 'C1', PP, '500', 'Unfunded', '9,500', false],     // the tracker's line: the record's whole plan, 2,400 + 300 + 1,800 + 5,000, Mandatory still counted there
    ['3', 'Lot One', 'Mandatory', 'C1', PP, '2,700', 'Mandatory', '2,700', true],
    ['4', 'Lot Two', 'Mandatory', 'C1', PP, '1,800', 'Mandatory', '1,800', true],
    ['5', 'Repair', 'Mandatory', 'C2', AV, '1,500', 'Mandatory', '1,500', true],
    ['1', 'Kit', 'Mandatory', 'C4', PP, '700', 'Mandatory', '700', true]]));
  const cellsOf = title => [...[...main().querySelectorAll('#uiUfrT tbody tr[data-ufr]')].find(tr => tr.querySelector('.tg').textContent === title).children].slice(4, 10).map(c => c.textContent);
  // §57 no tag in the title: a bar at the row's left edge, a key above the table, and Mandatory in Funding status
  { const mrows = [...main().querySelectorAll('#uiUfrT tbody tr.umand')];
    C.chk('§57 no Mandatory tag in any title; the key above the table says what the bar means', !main().querySelector('#uiUfrT .mtag') && mrows.length === 4
      && /^Mandatory plan event from the CCaR pull, not yet received/.test(main().querySelector('#uiUfrKey').textContent) && !!main().querySelector('#uiUfrKey .ukeybar')
      && mrows.every(tr => [...tr.children].some(td => td.textContent === 'Mandatory'))); }
  const kind = async v => { const b = main().querySelector('button[data-act=ufrkind][data-v="' + v + '"]'); await click(b); };
  C.eq('§57 Show offers All lines, UFR tracker and Mandatory, All pressed', J([...main().querySelectorAll('button[data-act=ufrkind]')].map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? ' *' : ''))), J(['All lines *', 'UFR tracker', 'Mandatory']));
  await kind('mand');
  C.eq('§57 Show Mandatory: the four Mandatory lines, the tiles and total follow', J([rows().map(r => r[1]), tile('sum')[0], main().querySelector('[data-act=ufrclear]').disabled]), J([['Lot One', 'Lot Two', 'Repair', 'Kit'], '$6,700K', false]));
  await kind('trk');
  C.eq('§57 Show UFR tracker: the tracker’s two lines, no key', J([rows().map(r => r[1]), !!main().querySelector('#uiUfrKey')]), J([['Depot tooling', 'Tessa A'], false]));
  await kind('');
  C.eq('§57 All lines: every line again', rows().length, 6);
  C.eq('Lot One by service: USAF 2,400 and ANG 300; Repair: STOVL 1,500', J([cellsOf('Lot One'), cellsOf('Repair')]), J([['2,400', '300', '-', '-', '-', '-'], ['-', '-', '-', '1,500', '-', '-']]));
  C.eq('five tiles: the total takes them in, and the fifth says how much is Mandatory', J([tile('sum'), tile('only'), tile('mand'), main().querySelector('.tiles').classList.contains('tiles5')]),
    J([['$8,100K', '6 lines (2 requirements on the tracker, 4 Mandatory plan events), 2 appropriations'], ['1', 'unfunded only: no plan event yet'], ['$6,700K', '4 plan events from the CCaR pull'], true]));
  C.eq('the total row', [...main().querySelectorAll('#uiUfrT tr.utotal td.n')].map(x => x.textContent).join(' '), '6,300 300 - 1,500 - - 8,100');
  C.eq('the record on the tracker and among the Mandatory plan events is flagged under the switch', J([...main().querySelectorAll('#uiUfrMandChk li')].map(li => li.textContent)),
    J(['O&M FY2027: CCaR C1 is on the UFR tracker and has Mandatory plan events listed too; check it is not counted twice.']));
  await click([...main().querySelectorAll('#uiUfrT .tg')].find(b => b.textContent === 'Lot Two'));
  C.chk('a Mandatory line opened says what it is, and that the spend plan still counts it', /A Mandatory plan event in the CCaR pull, of Tessa A: \$1,800K on Mandatory budgets in O&M FY2027\. It is listed here as unfunded because Mandatory funding has not been received\. The spend plan pages and the PDFs still count it as Approved\./
    .test(main().querySelector('tr.udetail').textContent), main().querySelector('tr.udetail').textContent);
  // nothing else in the tool moved
  const omAfter = await (async () => { await go('om'); const h = main().innerHTML; await go('overview'); const o = main().innerHTML; await go('publish'); const p = main().innerHTML; await go('ufr'); return [h, o, p]; })();
  // §55 the switch changes nothing on Spend plan PDFs: its two downloads do not read it
  C.chk('the O&M spend plan, the Overview and Spend plan PDFs are drawn exactly as with the switch off', omAfter[0] === omBefore[0] && omAfter[1] === omBefore[1] && omAfter[2] === omBefore[2]);
  C.eq('the tracker’s lists in the plan are not changed: the Mandatory lines are worked out, never stored', J(S.state.ufr['2027'].lines.map(l => l.title)), J(['Depot tooling', 'Tessa A']));
  // the Filter: a service switched off is left out of a Mandatory line as of any other
  const off = S.defaultView(); off.svc.USAF = false;
  const Voff = S.ufrView(S.buildModel(S.state.pulls.current, S.state.settings, S.defaultView(), null), off, S.ufrWithMandatory(S.state.ufr, S.buildModel(S.state.pulls.current, S.state.settings, S.defaultView(), null)).ufr, null, S.state.settings, {});
  C.eq('USAF switched off: Lot One is its ANG money alone, and Lot Two has none', J(Voff.lines.filter(l => l.mand).map(l => [l.title, l.sum])), J([['Lot One', 30000000], ['Lot Two', 0], ['Repair', 150000000], ['Kit', 0]]));
  // ranking a Mandatory line
  const type = async (title, v) => { const i = [...main().querySelectorAll('#uiUfrT tbody tr[data-ufr]')].find(tr => tr.querySelector('.tg').textContent === title).querySelector('input.urk'); i.value = v; i.dispatchEvent(new Wd.Event('change', { bubbles: true })); await settle(); };
  await type('Repair', '1');
  C.eq('a Mandatory line is ranked like any other: Repair typed to 1', J(rows().slice(0, 5).map(r => [r[0], r[1]])), J([['1', 'Repair'], ['2', 'Depot tooling'], ['3', 'Tessa A'], ['4', 'Lot One'], ['5', 'Lot Two']]));
  C.chk('no Mandatory line is said to differ from a tracker it was never on', ![...main().querySelectorAll('#uiUfrT tr.umand .urkf')].length && !/Repair|Lot One|Lot Two/.test((main().querySelector('#uiUfrRankChk') || { textContent: '' }).textContent),
    (main().querySelector('#uiUfrRankChk') || { textContent: '' }).textContent);
  C.chk('the ranking remembers which of its lines are Mandatory', J(S.state.ufrRank['om|2027'].map(e => [e.t, e.m === 1])) === J([['Repair', true], ['Depot tooling', false], ['Tessa A', false], ['Lot One', true], ['Lot Two', true]]), J(S.state.ufrRank['om|2027']));
  // §55 THE TWO DOWNLOADS. Discretionary: the body is the Discretionary money alone, and the list at the end is the tracker's
  // lines and every Mandatory plan event, in the keeper's ranking. Discretionary and Mandatory: the body is both, and the list
  // is the tracker's alone. Neither reads the Unfunded page's switch.
  {
    const list = d => d.ufr.map(l => [l.rank, l.title, l.status]), K$ = c => c / 100;
    const at = (R, id) => R.D.docs.find(d => d.id === id), pk = (R, l) => R.D.docs.find(d => d.kind === 'pmo' && d.label === l);
    const Rd = Wd.ui_pubData(Wd.ui_model(), 'd'), Rdm = Wd.ui_pubData(Wd.ui_model(), 'dm');
    C.eq('§55 Discretionary: the O&M list is the keeper’s ranking with every Mandatory line in it', J(list(at(Rd, 'ap:om'))),
      J([['1', 'Repair', 'Mandatory'], ['2', 'Depot tooling', 'Unfunded'], ['3', 'Tessa A', 'Unfunded'], ['4', 'Lot One', 'Mandatory'], ['5', 'Lot Two', 'Mandatory']]));
    C.eq('§55 … Initial Spares its one Mandatory line', J(list(at(Rd, 'ap:sp'))), J([['1', 'Kit', 'Mandatory']]));
    C.eq('§55 … each PMO’s PDF the lines under it, in the same order', J([list(pk(Rd, PP)), list(pk(Rd, AV))]),
      J([[['3', 'Tessa A', 'Unfunded'], ['4', 'Lot One', 'Mandatory'], ['5', 'Lot Two', 'Mandatory'], ['1', 'Kit', 'Mandatory']], [['1', 'Repair', 'Mandatory'], ['2', 'Depot tooling', 'Unfunded']]]));
    // O&M FY2027 Discretionary: Tessa A Lot One 5,000,000 and Tessa C Disc Only 900,000; Discretionary and Mandatory adds
    // 2,400,000 + 300,000 + 1,800,000 (Tessa A) and 1,500,000 (Tessa B Repair)
    const ap = (R, id) => K$(at(R, id).sections.find(x => x.fy === 2027).total.approved);
    C.eq('§55 Discretionary: the body is the Discretionary money alone; Discretionary and Mandatory, both', J([ap(Rd, 'ap:om'), K$(at(Rd, 'ap:om').stoplight.total.approved), ap(Rdm, 'ap:om')]),
      J([5900000, 5900000, 5900000 + 2400000 + 300000 + 1800000 + 1500000]));
    // §63 (Brad, 25 Nov 2026) Required = Approved + the tracker's lines (Tessa A's 500, Depot tooling's 900) + every Mandatory
    // line, each in its own CCaR record: Tessa A's Lot One 2,700 and Lot Two 1,800, Tessa B's Repair 1,500
    const sec = (R, id) => at(R, id).sections.find(x => x.fy === 2027), rec = (R, id, t) => sec(R, id).groups.flatMap(g => g.records).find(r => r.title === t);
    C.eq('§63 Discretionary: Required is Approved plus the tracker’s lines plus every Mandatory line', K$(sec(Rd, 'ap:om').total.required), 5900000 + 500000 + 900000 + 2700000 + 1800000 + 1500000);
    C.eq('§63 … a record already listed takes its Mandatory amounts on its own line: Tessa A, Approved 5,000, Required 5,000 + 500 + 2,700 + 1,800, by service (ANG 300)',
      J([K$(rec(Rd, 'ap:om', 'Tessa A').total.approved), K$(rec(Rd, 'ap:om', 'Tessa A').total.required), K$(rec(Rd, 'ap:om', 'Tessa A').svc[1].required), K$(rec(Rd, 'ap:om', 'Tessa A').total.delta)]),
      J([5000000, 10000000, 300000, -5000000]));
    C.eq('§63 … a record with Mandatory money alone is a line of its own: Tessa B, Approved $0, Required 1,500 on STOVL, its plan event its description',
      J([K$(rec(Rd, 'ap:om', 'Tessa B').total.approved), K$(rec(Rd, 'ap:om', 'Tessa B').svc[3].required), rec(Rd, 'ap:om', 'Tessa B').events, rec(Rd, 'ap:om', 'Tessa B').ccar]), J([0, 1500000, ['Repair'], 'C2']));
    // the unfunded list's total equals the sum of the deltas above it, in every Discretionary PDF
    const listSum = d => d.ufr.reduce((n, l) => n + l.total, 0), deltaSum = d => d.sections.reduce((n, x) => n + x.total.delta, 0);
    C.eq('§63 in every Discretionary PDF the unfunded list adds to the deltas of its spend plan pages', Rd.D.docs.filter(d => listSum(d) !== -deltaSum(d)).map(d => [d.id, listSum(d), deltaSum(d)]), []);
    C.eq('§63 Initial Spares, all Mandatory money: its Discretionary PDF has a section with Kit’s record (Approved $0, Required 700) and lists Kit',
      J([at(Rd, 'ap:sp').sections.length, K$(sec(Rd, 'ap:sp').total.approved), K$(sec(Rd, 'ap:sp').total.required), list(at(Rd, 'ap:sp'))]), J([1, 0, 700000, [['1', 'Kit', 'Mandatory']]]));
    C.eq('§63 Discretionary and Mandatory is unchanged: Required is its Approved plus the tracker’s lines alone', K$(sec(Rdm, 'ap:om').total.required), 5900000 + 2400000 + 300000 + 1800000 + 1500000 + 500000 + 900000);
    { const b = S.publishPdf(Wd.ui_pubDocAs(at(Rd, 'ap:sp'), 'd'), Wd.ui_pubCtx(Rd.Mp, Rd.P)), tx = Buffer.from(b).toString('latin1');
      C.chk('§55 … that PDF is written whole: its status page, Tessa D on the spend plan page, then the list with Kit', /^%PDF-/.test(tx) && /\(Kit\) Tj/.test(tx) && /\(Tessa D\) Tj/.test(tx) && /\(Initial Spares by fiscal year\) Tj/.test(tx), (tx.match(/\((?:[^()\\]|\\.)*\) Tj/g) || []).slice(0, 40).join(' ')); }
    C.chk('§55 … and Discretionary flags no Mandatory line’s PMO as unknown', !Rd.D.flags.some(f => /Lot One|Lot Two|Repair|Kit/.test(f)), J(Rd.D.flags));
    C.eq('§55 Discretionary and Mandatory: the list is the tracker’s alone, in the keeper’s ranking', J([list(at(Rdm, 'ap:om')), list(at(Rdm, 'ap:sp'))]),
      J([[['1', 'Depot tooling', 'Unfunded'], ['2', 'Tessa A', 'Unfunded']], []]));
    const Roff = (() => { const st = S.state.ufrMand; S.state.ufrMand = undefined; const x = [Wd.ui_pubData(Wd.ui_model(), 'd'), Wd.ui_pubData(Wd.ui_model(), 'dm')]; S.state.ufrMand = st; return x; })();
    const sig = R => J(R.D.docs.map(d => [d.id, d.sections.map(x => x.total), list(d)]));
    C.chk('§55 the Unfunded page’s switch changes neither download', sig(Roff[0]) === sig(Rd) && sig(Roff[1]) === sig(Rdm));
    const pg = S.publishPages(Wd.ui_pubDocAs(at(Rd, 'ap:om'), 'd'), Wd.ui_pubCtx(Rd.Mp, Rd.P)), txt = pg.pages.flatMap(p => p.ops.filter(o => o.t === 'text').map(o => o.s)).join(' | '), utx = txt.slice(txt.indexOf('Unfunded requirements'));
    C.chk('§55 the Discretionary O&M PDF prints them, Repair first, says what they are, and names itself Discretionary', /Repair \| [^|]*\| C2 /.test(utx) && utx.indexOf('Repair') < utx.indexOf('Depot tooling') && utx.indexOf('Depot tooling') < utx.indexOf('Lot One')
      && /Funding Status is Mandatory are Mandatory plan events from the CCaR pull/.test(utx) && /The spend plan pages above are the Discretionary money alone/.test(utx)
      && /Discretionary: Approved, Obligated and Remaining in this PDF are the Discretionary money alone/.test(txt) && txt.includes('APEX Spend Plan - O&M - Discretionary'), utx.slice(0, 1500));
    const tdm = S.publishPages(Wd.ui_pubDocAs(at(Rdm, 'ap:om'), 'dm'), Wd.ui_pubCtx(Rdm.Mp, Rdm.P)).pages.flatMap(p => p.ops.filter(o => o.t === 'text').map(o => o.s)).join(' | ');
    C.chk('§55 the Discretionary and Mandatory one says none of that', !/Discretionary: Approved, Obligated/.test(tdm) && !/Funding Status is Mandatory/.test(tdm) && tdm.includes('APEX Spend Plan - O&M - Discretionary and Mandatory'));
  }
  // a view-only copy made with the switch on
  const vo = loadTool({ html: S.viewOnlyHtml('2026-11-12T13:00:00.000Z') });
  for (let i = 0; i < 200 && !vo.window.document.getElementById('uiMain'); i++) await settle(5);
  vo.window.document.querySelector('#uiNav [data-v=ufr]').dispatchEvent(new vo.window.MouseEvent('click', { bubbles: true })); await settle(60);
  const vm = vo.window.document.getElementById('uiMain');
  C.eq('a view-only copy made with the switch on lists them, in the keeper’s ranking', J([...vm.querySelectorAll('#uiUfrT tbody tr[data-ufr]')].map(tr => [tr.querySelector('.urank').textContent, tr.querySelector('.tg').textContent, tr.classList.contains('umand')])),
    J([['1', 'Repair', true], ['2', 'Depot tooling', false], ['3', 'Tessa A', false], ['4', 'Lot One', true], ['5', 'Lot Two', true], ['1', 'Kit', true]]));
  C.chk('it says Mandatory funding was not received, has no switch, and cannot be changed', /Mandatory funding not received\. The 4 plan events on Mandatory budgets in the whole CCaR pull \(\$6,700K\) are listed below as unfunded/.test(vm.querySelector('#uiUfrMand').textContent)
    && !vm.querySelector('input[data-act=ufrmand]') && vo.SP.setUfrMandatory(false) === false && vo.SP.state.ufrMand === true, vm.querySelector('#uiUfrMand').textContent);
  C.eq('no script error in the view-only copy', J(errs(vo)), '[]');
  vo.close();
  // switched off again: the list is the tracker's, numbered 1 to N, and the ranked Mandatory lines are said
  await flip(false);
  C.eq('switch off: the tracker’s two lines, ranked 1 and 2 in the keeper’s order', J(rows().map(r => [r[0], r[1]])), J([['1', 'Depot tooling'], ['2', 'Tessa A']]));
  C.chk('and the ranking’s Mandatory lines are flagged as not listed, for what they were', [...main().querySelectorAll('#uiUfrRankChk li')].filter(li => /it was a Mandatory plan event, and the Mandatory switch is off or the pull no longer has it/.test(li.textContent)).length === 3,
    (main().querySelector('#uiUfrRankChk') || { textContent: '' }).textContent);
  // Import from last version brings the switch
  await flip(true);
  const fresh = loadTool({ modules: MODS }); fresh.SP.storeInit();
  const took = fresh.SP.takeSettings(S.savedHtml(), 'APEX last.html');
  C.chk('Import from last version brings the switch when it was on', took.ok === true && fresh.SP.state.ufrMand === true, took.message);
  fresh.close();
  C.eq('no script error on the page', J(errs(A)), '[]');
  A.close();
} catch (err) {
  console.error(err);
  C.chk('the test ran to its end', false, (err && err.message) || String(err));
}
C.done();
