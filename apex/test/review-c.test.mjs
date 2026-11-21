// Review group C (figures, words and what a reader is told): each change below is held to figures and words written out by
// hand from the small invented plans in this file. Notes: apex/docs/notes-group-c.md.
//   I78 the Charts scoreboard's share counts a deobligation, as its Plan does; a year with no OSD goal stays out (§26)
//   I81 the Filter's Mandatory lane switch takes §45's Mandatory lines off the Unfunded page
//   I79 the Mandatory card says it is the whole pull; I83 the Unfunded tile and the PDF section line split their counts
//   I82 the PDFs' header is dated by the data (the oldest pull, §30) and says when it was printed
//   I84 the burn-up says what Actual Execution it leaves off its line; I15 "CCaR plan" where a BAE report is loaded
//   I02 an appropriation's Unobligated lists are folded; I36 Show everything, and a switch left off is said on opening
//   I06 the boot note's late line; I10 a view-only copy's publish day and tab title; I58 the tab title; I39 an older pull
//   I22 Menu, Filter and Manage data draw only the bars
//
//   node apex/test/review-c.test.mjs
process.env.TZ = 'America/New_York';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadTool, pageHtml, checks } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const C = checks('review-c');
const J = x => JSON.stringify(x);
const settle = (ms = 40) => new Promise(res => setTimeout(res, ms));
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description', 'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC',
  'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code', 'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const EX = 'Actual Execution is allocated', NA = 'Not Allocated', AV = 'Air Vehicle (AV)', PP = 'Propulsion (PP)';
const B = { disc: 'USAF O&M- Tessa Base Discretionary', mUsaf: 'USAF O&M- Tessa Base Mandatory', mAng: 'USAF ANG O&M Tessa Mandatory', mStovl: 'USN STOVL O&M Tessa Mandatory', mSp: 'USAF APN Spares Tessa Base Initial Mandatory' };
const row = (FY, ccar, Title, Budget, pe, Date, Amount, Alloc, PMO) => ({ FY, 'CCaR No': ccar, Title, Budget, 'Plan Event': pe, Date, Amount, Alloc, PMO });
const NOW = '2026-11-09T12:00:00.000Z';
const errs = t => t.errors.filter(e => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click|HTMLCanvasElement|window\.print)/.test(String(e)));
const D = d => Math.round(d * 100);
const MODS = ['util', 'xlsx-read', 'import', 'engine', 'publish', 'pdf', 'xlsx-write', 'store'];

// ---------------------------------------------------------------------------- PLAN 1: the Charts (I78, I84). Data through Oct-2026.
//   O&M FY2027, AV:  Tessa A  3.0M awarded Oct 2026 (Actual Execution)
//                    Tessa B  5.0M planned Mar 2027
//                    Tessa N -1.0M awarded Sep 2026: a deobligation
//   O&M FY2028, AV:  Tessa Z  4.0M planned Jan 2028: a year after the execution year, so no OSD goal
//   O&M FY2027, PP:  Tessa X  0.5M awarded, dated 5 Nov 2026: after the Data through month
// AV's scoreboard row: Plan 3 + 5 - 1 + 4 = 11.0M; its share is of FY2027's three, awarded 3 - 1 = 2.0M of plan 3 + 5 - 1 = 7.0M, 2/7.
// Before review I78 the deobligation was left out: 3.0M of 8.0M, 3/8.
// The O&M FY2027 block: Approved 3 + 5 - 1 + 0.5 = 7.5M, Obligated 3 - 1 + 0.5 = 2.5M (33.33%); 0.5M of it dated after Oct.
const P1 = [
  row(2027, 'TS0001', 'Tessa A', B.disc, 'T1', '2026-10-15', '3000000', EX, AV),
  row(2027, 'TS0002', 'Tessa B', B.disc, 'T2', '2027-03-10', '5000000', NA, AV),
  row(2027, 'TS0009', 'Tessa N', B.disc, 'T9', '2026-09-01', '-1000000', EX, AV),
  row(2028, 'TS0010', 'Tessa Z', B.disc, 'T10', '2028-01-10', '4000000', NA, AV),
  row(2027, 'TS0011', 'Tessa X', B.disc, 'T11', '2026-11-05', '500000', EX, PP),
];

// ---------------------------------------------------------------------------- PLAN 2: the Unfunded page (I81, I79, I83, I15), ufr-mandatory's plan
const P2 = [row(2027, 'C1', 'Tessa A', B.mUsaf, 'Lot One', '2026-12-01', '2400000', NA, PP), row(2027, 'C1', 'Tessa A', B.mAng, 'Lot One', '2027-01-01', '300000', NA, PP),
  row(2027, 'C1', 'Tessa A', B.mUsaf, 'Lot Two', '2027-02-01', '1800000', NA, PP), row(2027, 'C1', 'Tessa A', B.disc, 'Lot One', '2026-12-01', '5000000', NA, PP),
  row(2027, 'C2', 'Tessa B', B.mStovl, 'Repair', '2027-03-01', '1500000', NA, AV), row(2027, 'C3', 'Tessa C', B.disc, 'Disc Only', '2026-11-01', '900000', NA, AV)];
const P2SP = [row(2027, 'C4', 'Tessa D', B.mSp, 'Kit', '2027-04-01', '700000', NA, PP)];
// Mandatory in all: 4 plan events, $6,700K. The tracker: 1 Depot tooling TS9 AV $900K (no plan event), 2 Tessa A C1 PP $500K.
const K = k => k * 100000;
const tl = (rank, title, pmo, ccar, k) => ({ ap: 'om', fy: 2027, sheet: 'O&M', row: 9 + rank, rank: String(rank), title, pmo, ccar, cents: [K(k), 0, 0, 0, 0, 0, 0], total: K(k), status: 'Unfunded', exec: 'Yes', sfcb: '' });
const TRK = { ok: true, fy: 2027, name: 'UFR FY27.xlsx', unit: 1000, tabs: [], notes: [], ignored: [], lines: [tl(1, 'Depot tooling', 'AV', 'TS9', 900), tl(2, 'Tessa A', 'PP', 'C1', 500)] };

async function page(html, opts = {}) {
  const t = loadTool(opts.url ? { html, url: opts.url } : { html });
  if (opts.confirm) t.window.confirm = opts.confirm;
  const doc = t.window.document;
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  const T = {
    t, W: t.window, doc, SP: t.SP, main: () => doc.getElementById('uiMain'),
    async click(el) { el.dispatchEvent(new t.window.MouseEvent('click', { bubbles: true })); await settle(); },
    async go(v) { await T.click(doc.querySelector('#uiNav [data-v="' + v + '"]')); return T.main(); },
    async change(el, v) { if (typeof v === 'boolean') el.checked = v; else el.value = v; el.dispatchEvent(new t.window.Event('change', { bubbles: true })); await settle(); },
  };
  return T;
}

try {
  // ============================================================================ I78 the scoreboard's share, by hand
  {
    const T = await page(pageHtml({}));
    T.SP.applyImport(await T.SP.parseFiles([{ name: 'om.csv', data: csv(P1) }], { now: NOW }));
    T.SP.setSettings({ asOf: '2026-10' });
    await settle(60);
    const SP = T.SP, M = SP.buildModel(SP.state.pulls.current, SP.state.settings, SP.defaultView(), null);
    const X = SP.chartsOf(M, SP.requirementsOf(M)), av = X.pmos.find(p => p.label === AV), b27 = M.blocks.find(b => b.key === 'om|2027');
    C.eq('I78 the fixture: AV holds four requirements, Plan 11.0M, Awarded 2.0M; FY2028 has no OSD goal', J([av.n, av.planned, av.awarded, M.blocks.find(b => b.key === 'om|2028').goal]), J([4, D(11e6), D(2e6), null]));
    C.chk('I78 AV’s share is FY2027’s Awarded over FY2027’s Plan, the deobligation in both: 2.0M of 7.0M (it was 3.0M of 8.0M)', Math.abs(av.pct - 2 / 7) < 1e-12, String(av.pct));
    C.chk('I78 the goal is the FY2027 block’s, weighted by plan above zero (one block, so its own goal)', typeof b27.goal === 'number' && Math.abs(av.goal - b27.goal) < 1e-12, J([av.goal, b27.goal]));
    C.chk('I78 an office whose only requirements have no goal still has no share', SP.chartsOf(M, SP.requirementsOf(M).filter(r => r.fy === 2028)).pmos[0].pct === null);
    const m = await T.go('charts');
    const tr = m.querySelector('.chpmo tr[data-k="' + av.key + '"]');
    C.chk('I78 the page prints AV at 28.57%', tr && Math.abs(Number(tr.querySelector('.chpct').getAttribute('data-p')) - 2 / 7) < 1e-12 && tr.querySelector('.chpct').textContent === '28.57%', tr && tr.textContent);
    C.chk('I78 the scoreboard’s note says a year with no OSD goal counts in Plan and not in the share',
      /A requirement in a year with no OSD goal counts in Plan but not in the share\./.test(m.querySelector('[data-ch=pmos] .cardnote').textContent), m.querySelector('[data-ch=pmos] .cardnote').textContent);
    // ========================================================================== I84 the burn-up's words
    const f = m.querySelector('.chburn[data-bk="om|2027"]');
    C.chk('I84 the O&M FY2027 burn-up says the 0.5M dated after Oct is not on its line, and the slide block’s Total that counts it (33.33%)',
      f && f.querySelector('.choff') && f.querySelector('.choff').getAttribute('data-c') === String(D(0.5e6))
      && f.querySelector('.choff').textContent === 'Plus ' + SP.fmtMText(D(0.5e6)) + ' ($M) of Actual Execution dated after Oct-2026, which is not on this line: the slide block’s Total, which counts it, is 33.33%.'
      && !f.querySelector('.chgap .choff'), f && f.querySelector('.ovlab').textContent);
    C.chk('I84 a block with nothing dated after the month says nothing more', !m.querySelector('.chburn[data-bk="om|2028"] .choff'));
    C.chk('I84 the key reads Actual through Oct-2026, and the note no longer says the line is as the slide block prints it',
      [...m.querySelectorAll('[data-ch=burn] .chkey .chk')].map(x => x.textContent)[0] === 'Actual through Oct-2026'
      && !/as its slide block prints it/.test(m.querySelector('[data-ch=burn] .cardnote').textContent), m.querySelector('[data-ch=burn]').textContent.slice(0, 300));
    C.eq('I78/I84 no script error', J(errs(T.t)), '[]');
    T.t.close();
  }

  // ============================================================================ I81 I79 I83 the Unfunded page
  {
    const T = await page(pageHtml({}));
    const SP = T.SP;
    SP.applyImport(await SP.parseFiles([{ name: 'om.csv', data: csv(P2) }, { name: 'sp.csv', data: csv(P2SP) }], { now: NOW }));
    SP.setSettings({ asOf: '2026-10' });
    SP.setUfr(TRK, '2026-11-10T12:00:00.000Z');
    SP.setUfrMandatory(true);
    await settle(60);
    const Mf = SP.buildModel(SP.state.pulls.current, SP.state.settings, SP.defaultView(), null), ufr = SP.ufrWithMandatory(SP.state.ufr, Mf).ufr;
    const noMand = SP.defaultView(); noMand.lane.mand = false;
    const V = SP.ufrView(Mf, noMand, ufr, null, SP.state.settings, {}), V1 = SP.ufrView(Mf, SP.defaultView(), ufr, null, SP.state.settings, {});
    C.eq('I81 every switch on: the tracker’s 2 lines and the 4 Mandatory lines, $8,100K', J([V1.n, V1.total.sum, V1.tiles.mand]), J([6, K(8100), { sum: K(6700), n: 4 }]));
    C.eq('I81 Mandatory lane off: the 4 Mandatory lines are off, the tracker’s 2 stay ($1,400K), and the tile counts what it took off',
      J([V.lines.map(l => [l.title, l.rank]), V.total.sum, V.tiles.mand, V.all]), J([[['Depot tooling', '1'], ['Tessa A', '2']], K(1400), { sum: 0, n: 0, hidden: 4 }, 6]));
    const off2 = SP.defaultView(); off2.lane.disc = false;
    C.eq('I81 the Discretionary lane off leaves the tracker’s lines and the Mandatory lines as they are (the tracker has no lanes, §37)', J(SP.ufrView(Mf, off2, ufr, null, SP.state.settings, {}).lines.length), '6');
    let m = await T.go('ufr');
    const tile = id => { const x = m.querySelector('.tile[data-tile=' + id + ']'); return x ? [x.querySelector('.tv').textContent, x.querySelector('.ts').textContent] : null; };
    // I83 the count with Mandatory lines in it
    C.eq('I83 the total tile counts lines, and says how many of each', J(tile('sum')), J(['$8,100K', '6 lines (2 requirements on the tracker, 4 Mandatory plan events), 2 appropriations']));
    C.eq('I83 and Exec ready counts of the same lines', J(tile('exec')), J(['$1,400K', '2 of 6 lines']));
    // I79 the card
    C.chk('I79 the switch’s card says its figure is the whole pull’s, and that the tile counts what the filters show',
      /On: the 4 plan events on Mandatory budgets in the whole CCaR pull \(\$6,700K\) are listed below as unfunded, one line a plan event, marked Mandatory; the Mandatory, not received tile counts those the Filter and the pickers show\./
        .test(m.querySelector('#uiUfrMand').textContent), m.querySelector('#uiUfrMand').textContent);
    // I81 on the page
    C.chk('I81 the note says the lanes apply to the Mandatory lines only', /The Filter above \(its services; its lanes for the Mandatory lines only\)/.test(m.querySelector('.findnote').textContent));
    await T.change(T.doc.querySelector('input[data-act=lane][data-l=mand]'), false);
    m = T.main();
    C.eq('I81 Mandatory switched off in the Filter: two lines, no Mandatory tag, and the fifth tile says they are hidden by the switch',
      J([[...m.querySelectorAll('#uiUfrT tbody tr[data-ufr]')].map(tr => tr.querySelector('.tg').textContent), m.querySelectorAll('#uiUfrT .mtag').length, tile('mand'), tile('sum')]),
      J([['Depot tooling', 'Tessa A'], 0, ['Hidden', 'by the Filter’s Mandatory lane switch: 4 plan events'], ['$1,400K', '2 requirements, 1 appropriation']]));
    await T.change(T.doc.querySelector('input[data-act=lane][data-l=mand]'), true);
    // I79 in a view-only copy
    const vo = await page(SP.viewOnlyHtml('2026-11-21T13:00:00.000Z'));
    const vm = await vo.go('ufr');
    C.chk('I79 a view-only copy’s card says the same', /The 4 plan events on Mandatory budgets in the whole CCaR pull \(\$6,700K\) are listed below as unfunded, each marked Mandatory; the Mandatory, not received tile counts those the Filter and the pickers show\./
      .test(vm.querySelector('#uiUfrMand').textContent), vm.querySelector('#uiUfrMand').textContent);
    // I10 the copy's publish day, its tab title and the tooltip for a reader
    C.chk('I10 a view-only copy says when it was published, beside the Data through month', /^Data through Oct-2026 · First FY \d{4} · Published 21 Nov 2026$/.test(vo.doc.getElementById('uiAsOfText').textContent), vo.doc.getElementById('uiAsOfText').textContent);
    C.eq('I10 I58 its tab title carries the marking, the month and the publish day', vo.doc.title.replace(/^CUI - [^-]+ - APEX FY\d+ \(view only\)/, 'CUI - APEX'), 'CUI - APEX · data through Oct-2026 · published 21 Nov 2026');
    C.eq('I10 the View only mark is as it was', vo.doc.getElementById('uiVo').textContent, 'View only');
    C.eq('I10 no script error in the copy', J(errs(vo.t)), '[]');
    vo.t.close();
    // ========================================================================== I83 I15 I82 the PDFs' words
    const D2 = SP.publishData(Mf, SP.state.ufr, null, { settings: SP.state.settings });
    const om = D2.docs.find(d => d.id === 'ap:om'), sec = om.sections.find(s => s.fy === 2027);
    C.eq('I83 the O&M FY2027 section: 4 CCaR records (C1, C2, C3 and TS9), 1 of them on the unfunded list only', J([sec.n, sec.ufrOnly]), J([4, 1]));
    const texts = p => p.ops.filter(o => o.t === 'text').map(o => o.s);
    const ctx = { program: 'Tessa Program', fm: { om: 'O. Lead' }, asOfLabel: Mf.asOfLabel, today: '2026-12-12', dataDay: '2026-11-21', uploaded: 'Data uploaded 21 Nov 2026 · 21 days ago.', emblem: null, model: Mf, bae: false, ufrFiles: [] };
    const pages = SP.publishPages(om, ctx).pages, brk = pages.find(p => p.kind === 'break' && texts(p).includes('FY2027 Spend Plan'));
    C.chk('I83 the section’s break page says how many are unfunded only', texts(brk).some(s => /^4 requirements \(1 unfunded only, no plan event\)   \|   Required \$[\d,]+   \|   Approved \$/.test(s)), J(texts(brk)));
    C.chk('I82 every page’s header is dated by the data, then the month, then the print day', texts(brk).includes('Data uploaded 21 Nov 2026  |  Data through Oct-2026  |  Printed 12 Dec 2026')
      && texts(pages[0]).includes('Data uploaded 21 Nov 2026  |  Data through Oct-2026  |  Printed 12 Dec 2026') && !pages.some(p => texts(p).some(s => /Data as of/.test(s))), J(texts(pages[0]).slice(0, 8)));
    C.chk('I82 with no pull day, the print day alone', texts(SP.publishPages(om, Object.assign({}, ctx, { dataDay: '' })).pages[0]).includes('Data through Oct-2026  |  Printed 12 Dec 2026'));
    const brkB = SP.publishPages(om, Object.assign({}, ctx, { bae: true })).pages.find(p => p.kind === 'break' && texts(p).includes('FY2027 Spend Plan'));
    C.chk('I15 with a BAE report loaded the section line names its Approved the CCaR plan', texts(brkB).some(s => /\|   Approved \(CCaR plan\) \$/.test(s)) && !texts(brk).some(s => /CCaR plan/.test(s)), J(texts(brkB)));
    C.eq('I81 I79 I83 no script error', J(errs(T.t)), '[]');
    T.t.close();
  }

  // ============================================================================ I02 the folded lists; I15 their tie line; I36; I22
  {
    const T = await page(pageHtml({}));
    const SP = T.SP;
    SP.applyImport(await SP.parseFiles([{ name: 'om.csv', data: csv(P1) }], { now: NOW }));
    SP.setSettings({ asOf: '2026-10' });
    await settle(60);
    let m = await T.go('om');
    const folds = [...m.querySelectorAll('details.nafold')];
    // O&M FY2027's not-obligated rows: Tessa B 5.0M (Not Allocated); FY2028's: Tessa Z 4.0M
    C.eq('I02 each block’s list is one closed fold, its bar the heading as before, how many and how much beside it',
      J(folds.map(d => [d.getAttribute('data-na'), d.open, d.querySelector('summary h3.nabar').textContent, d.querySelector('.nacount').textContent, d.querySelector('.nacount').getAttribute('data-c')])),
      J([['om|2027', false, 'Unobligated Requirements — O&M FY2027', '1 item, ' + SP.fmtMText(D(5e6)) + ' ($M). Press to open the list.', String(D(5e6))],
        ['om|2028', false, 'Unobligated Requirements — O&M FY2028', '1 item, ' + SP.fmtMText(D(4e6)) + ' ($M). Press to open the list.', String(D(4e6))]]));
    C.chk('I02 every item is still in the page (no cap, §5): the rows are inside the fold', folds.every(d => d.querySelectorAll('table.na tbody tr').length === 1));
    C.chk('I02 no BAE report: no tie line', !m.querySelector('.natie'));
    folds[0].open = true;
    folds[0].dispatchEvent(new T.W.Event('toggle'));
    await settle();
    // Expand to redraws the whole view, and so does going to another view and back: the fold opened stays open for this visit
    await T.change(m.querySelector('select[data-act=lvl]'), '4');
    C.eq('I02 a redraw keeps it open', J([...T.main().querySelectorAll('details.nafold')].map(d => d.open)), J([true, false]));
    await T.go('summary'); m = await T.go('om');
    C.eq('I02 opened, it stays open while the page is open; the other stays closed', J([...m.querySelectorAll('details.nafold')].map(d => d.open)), J([true, false]));
    C.chk('I02 and its bar says it folds', /Press to fold the list\.$/.test(m.querySelector('details.nafold').querySelector('.nacount').textContent));
    // I22 Menu, Filter and Manage data: only the bars are drawn (the view keeps the very elements it had)
    const before = T.main().firstElementChild, sw = () => !T.doc.getElementById('uiSwitches').hidden;
    const f0 = sw(), fb = T.doc.querySelector('[data-act=filt]');
    fb.focus();
    await T.click(fb);
    C.chk('I22 the Filter button opens or folds the switches, keeps the keyboard, and leaves the view as it was drawn', sw() === !f0
      && T.main().firstElementChild === before && T.doc.activeElement && T.doc.activeElement.getAttribute('data-fkey') === 'filt');
    await T.click(T.doc.querySelector('[data-act=filt]'));
    await T.click(T.doc.querySelector('[data-act=navtoggle]'));
    C.chk('I22 the Menu button: the menu is open and the view is as it was drawn', T.doc.getElementById('uiShell').classList.contains('navopen') && T.main().firstElementChild === before);
    await T.click(T.doc.querySelector('[data-act=navtoggle]'));
    const m0 = T.doc.getElementById('uiManage').hidden;
    await T.click(T.doc.querySelector('[data-act=manage]'));
    C.chk('I22 Manage data: the bar opens or folds, and the view is as it was drawn', T.doc.getElementById('uiManage').hidden === !m0 && T.main().firstElementChild === before);
    await T.click(T.doc.querySelector('[data-act=manage]'));
    C.chk('I22 a switch still draws the whole view', await (async () => { await T.change(T.doc.querySelector('input[data-act=svc][data-i="1"]'), false); const x = T.main().firstElementChild !== before;
      await T.change(T.doc.querySelector('input[data-act=svc][data-i="1"]'), true); return x; })());
    // I36 Show everything
    C.chk('I36 every switch on: no Show everything', !T.doc.querySelector('[data-act=showall]'));
    await T.change(T.doc.querySelector('input[data-act=lane][data-l=mand]'), false);
    const sa = T.doc.querySelector('#uiSwitches [data-act=showall]');
    C.chk('I36 a switch off: Show everything is beside the switches', sa && sa.textContent === 'Show everything');
    sa.focus();
    await T.click(sa);
    C.chk('I36 pressed, every switch is on again and the keyboard is on the Filter', SP.getView().lane.mand === true && T.doc.querySelector('[data-act=filt]').textContent === 'Filter: All services, both lanes'
      && !T.doc.querySelector('[data-act=showall]') && T.doc.activeElement.getAttribute('data-fkey') === 'filt' && /counted again/.test(T.doc.getElementById('uiMsg').textContent));
    // I36 opened again with a switch left off: said once, by what is off
    const saved = SP.savedHtml();
    T.t.close();
    // each page here is its own browser, so the switches an earlier visit left are put in this one's storage before it opens
    const withView = v => saved.replace('<script id="spState"', () => '<script>localStorage.setItem("sfcbsp.view", ' + J(J(v)) + ');</script><script id="spState"');
    const T2 = await page(withView({ svc: { 'USAF ANG': false }, lane: { mand: false } }), { url: 'http://apex.test/apex.html' });   // file:// has no storage in jsdom
    C.chk('I36 opened with switches left off from an earlier visit, the message line says what is not counted',
      /This browser keeps the Filter’s switches from an earlier visit: Mandatory is not counted, and USAF ANG is left out\. Show everything, in the Filter, counts it all again\./.test(T2.doc.getElementById('uiMsg').textContent)
      && /^Opened the (saved plan|plan saved)/.test(T2.doc.getElementById('uiMsg').textContent), T2.doc.getElementById('uiMsg').textContent);
    T2.t.close();
    const T3 = await page(withView({ svc: {}, lane: { disc: true, mand: true } }), { url: 'http://apex.test/apex.html' });
    C.chk('I36 with every switch on, nothing more is said', !/earlier visit/.test(T3.doc.getElementById('uiMsg').textContent), T3.doc.getElementById('uiMsg').textContent);
    C.eq('I02 I22 I36 no script error', J(errs(T3.t)), '[]');
    T3.t.close();
  }

  // ============================================================================ I06 the boot note; I58 the tab title
  {
    const shell = readFileSync(join(HERE, '..', 'src', 'shell.html'), 'utf8'), store = readFileSync(join(HERE, '..', 'src', '80-store.js'), 'utf8');
    const line = 'If this stays, download the file and open it in Edge, Chrome or Safari.';
    C.chk('I06 the shell’s boot note carries the late line, inside the one boot-note paragraph', shell.includes('<div id="app"><p class="boot-note">Opening APEX&hellip;<span class="boot-late">' + line + '</span></p></div>'));
    C.chk('I06 and the store’s copy of the note is the same words', store.includes('<p class="boot-note">Opening APEX…<span class="boot-late">' + line + '</span></p>'));
    const css = readFileSync(join(HERE, '..', 'src', 'style.css'), 'utf8');
    C.chk('I06 the stylesheet holds it back a few seconds, with no script', /\.boot-late\{[^}]*visibility:hidden;[^}]*animation:apexBootLate 0s linear 4s forwards\}/.test(css) && /@keyframes apexBootLate\{to\{visibility:visible\}\}/.test(css));
    C.chk('I58 the tab title carries the marking', /<title>CUI - APEX<\/title>/.test(shell));
    // a page saved after the screens drew opens with the same note
    const t = loadTool({ modules: MODS });
    t.SP.storeInit();
    const html = t.SP.savedHtml();
    C.chk('I06 a saved file opens on the note with its late line', html.includes('<div id="app"><p class="boot-note">Opening APEX…<span class="boot-late">' + line + '</span></p></div>') || html.includes('<div id="app"><p class="boot-note">Opening APEX&hellip;<span class="boot-late">' + line + '</span></p></div>'), (html.match(/<div id="app">.{0,200}/) || [''])[0]);
    t.close();
  }

  // ============================================================================ I39 an older pull, and the file names
  {
    // week 2: O&M FY2027 obligated 30.0M; week 1, imported over it by mistake: 20.0M (10.0M less: over $5M and over 5%)
    const wk = ob => [row(2027, 'W1', 'Widget', B.disc, 'W', '2026-10-01', String(ob), EX, AV), row(2027, 'W2', 'Gadget', B.disc, 'G', '2027-02-01', '9000000', NA, AV)];
    let asked = [];
    const T = await page(pageHtml({}), { confirm: qn => { asked.push(qn); return false; } });
    const SP = T.SP;
    await SP.applyImport(await SP.parseFiles([{ name: 'CCaR O&M 14 Nov.csv', data: csv(wk(30000000)) }], { now: NOW }));
    SP.setSettings({ asOf: '2026-10' });
    C.eq('I39 the first pull: no question', asked.length, 0);
    const r = await SP.applyImport(await SP.parseFiles([{ name: 'CCaR O&M 7 Nov.csv', data: csv(wk(20000000)) }], { now: '2026-11-10T12:00:00.000Z' }));
    C.chk('I39 a pull whose Obligated falls is asked about, naming both files, both figures and the fall', asked.length === 1
      && asked[0].includes('In this import (“CCaR O&M 7 Nov.csv”), O&M Obligated (rows CCaR marks Actual Execution) falls against the pull on screen (“CCaR O&M 14 Nov.csv”, imported ')
      && asked[0].includes('FY2027 from $30,000,000.00 to $20,000,000.00, $10,000,000.00 less') && /Import anyway\?$/.test(asked[0]), asked[0]);
    C.chk('I39 declined, nothing is imported and the message says why', r && r.ok === false && /^Nothing was imported\. The import’s O&M Obligated is less than the pull on screen’s \(FY2027 \$10,000,000\.00 less\)/.test(r.message)
      && SP.state.pulls.current.om.files[0].name === 'CCaR O&M 14 Nov.csv', r && r.message);
    asked = [];
    // a small deobligation is no question: 30.0M to 29.0M is $1M and 3.3%
    await SP.applyImport(await SP.parseFiles([{ name: 'CCaR O&M 21 Nov.csv', data: csv(wk(29000000)) }], { now: '2026-11-21T12:00:00.000Z' }));
    C.chk('I39 a fall of $1M (3.3%) is an ordinary deobligation: no question, and the pull is taken', asked.length === 0 && SP.state.pulls.current.om.files[0].name === 'CCaR O&M 21 Nov.csv', J(asked));
    await settle(60);
    C.chk('I39 the upload pill’s tooltip names each pull’s file', /O&M imported .* \(CCaR O&M 21 Nov\.csv\)/.test(T.doc.getElementById('uiUpd').title), T.doc.getElementById('uiUpd').title);
    C.eq('I39 no script error', J(errs(T.t)), '[]');
    T.t.close();
  }
} catch (e) {
  C.chk('the checks ran to the end', false, (e && e.stack) || String(e));
}
C.done();
