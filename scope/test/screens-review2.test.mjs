// The second review's screens findings, each held on pulls made here (every name and figure invented) or on the synthetic
// fixture, first in jsdom through the page's own controls, then in Chromium for what only a browser draws: the keyboard's
// place, printing, colour and accessible names. Every expectation is worked out from the rows this file writes.
//
// What it holds the tool to:
//   SEAM-10  a Not Allocated filter (PMO, appropriation, FY), and the PMO picked on the PMOs view, stay chosen while the
//            switches leave them nothing to show, say so, and come back when the switches do
//   M1       What changed never calls a CCaR or a line new or gone because a row of it could not be read in one pull, and
//            says how many rows could not be read
//   BP-2     What changed lists a line whose money became obligated, or moved to another month, with no amount changed
//   BP-6     What changed counts LINES, says what a line is, and tells two imports on one day apart
//   SCR2-1   a change made with the keyboard is never left under the sticky top its own message grows
//   SCR2-2   a printed view carries the CUI marking at the top and the bottom of every page, and says Data through
//   SCR2-3   the † and ‡ on a TOTAL row can be read on its navy (4.5:1)
//   SCR2-5   a setting put back as the file holds it (Data through retyped, say) leaves the plan Saved, and says so
//   SCR2-7   What changed and the Import report, which show every row, do not head their notice "Showing only part"
//   SCR2-8   the Not Allocated count of nothing reads $0.00M, never $-M
//   SCR2-9   Help's two sentences the fixes made untrue
//   SCR2-10  every picker's accessible name starts with the words beside it ("Expand to …")
//   SCR2-11  the top bar and the import message tell two pulls imported on one day apart
//
//   node scope/test/screens-review2.test.mjs
//   SFCBSP_PAGE=/path/to/built.html node scope/test/screens-review2.test.mjs   (the same checks on a given built page)
import { chromium } from 'playwright-core';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CHROME } from '../../tools/chrome.mjs';
import { loadTool, pageHtml, checks, scratchDir } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const C = checks('screens-review2');
const tmp = scratchDir('sfcbsp-scr2-');
const PAGE = process.env.SFCBSP_PAGE ? readFileSync(process.env.SFCBSP_PAGE, 'utf8') : null;
const J = x => JSON.stringify(x);
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const NA = 'Not Allocated', EXEC = 'Actual Execution is allocated to a Plan Event';
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const ROW = { FY: 2026, Title: 'Invented Title', PMO: 'Air Vehicle (AV)', 'Plan Event': 'Event one', Date: '2026-06-15', Alloc: NA, Budget: 'USAF O&M Discretionary' };
const r = o => Object.assign({}, ROW, o);
const pad = n => String(n).padStart(2, '0');
const day = iso => { const d = new Date(iso); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const hm = iso => { const d = new Date(iso); return day(iso) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const settle = () => new Promise(res => setTimeout(res, 20));

function withState(html, state) {
  return state ? html.replace('<script id="spState" type="application/json">null</script>',
    () => '<script id="spState" type="application/json">' + JSON.stringify(state).replace(/</g, '\\u003c') + '</script>') : html;
}
function boot(state) {
  const t = PAGE ? loadTool({ html: withState(PAGE, state) }) : loadTool({ state });
  t.window.confirm = () => true;
  const doc = t.window.document, W = t.window;
  const T = {
    t, SP: t.SP, doc, W,
    main: () => doc.getElementById('uiMain'),
    msg: () => doc.getElementById('uiMsg').textContent,
    async imp(files, now) {
      const parsed = await t.SP.parseFiles(files.map(([name, data]) => ({ name, data })), { now });
      const res = await t.SP.applyImport(parsed);
      t.SP.uiRender(); await settle();
      return res;
    },
    async ui(files) {
      await W.ui_import(files.map(([name, data]) => ({ name, arrayBuffer: async () => new TextEncoder().encode(data).buffer })));
      await settle();
    },
    view(v) { const b = doc.querySelector('[data-act=view][data-v="' + v + '"]'); b.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); return T.main(); },
    change(el, value) { if (value !== undefined) { if (el.type === 'checkbox') el.checked = value; else el.value = value; } el.dispatchEvent(new W.Event('change', { bubbles: true })); },
    click(el) { el.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); },
    svc(i, on) { T.change(doc.querySelector('input[data-act=svc][data-i="' + i + '"]'), on); },
    pick(f, text) {
      const s = T.main().querySelector('select[data-f="' + f + '"]');
      const o = [...s.options].find(x => x.textContent === text);
      if (!o) throw new Error('no ' + f + ' option "' + text + '" in ' + J([...s.options].map(x => x.textContent)));
      T.change(s, o.value);
    },
    chosen(f) { const s = T.main().querySelector('select[data-f="' + f + '"]'); return s.options[s.selectedIndex].textContent; },
    count: () => (T.main().querySelector('p.count') || {}).textContent || '',
    // script errors, less what jsdom itself cannot do (it has no scrolling: a new view scrolls to its top)
    errors: () => t.errors.filter(e => !/^Not implemented: Window's scrollTo\(\) method/.test(String(e))),
  };
  return T;
}
async function block(name, fn) {
  try { await fn(); } catch (e) { C.chk(name + ': the checks stopped part way: ' + String((e && e.stack) || e).split('\n').slice(0, 2).join(' | '), false); }
}

try {
  // ===================================================================================================================
  // SEAM-10, SCR2-8 — a filter the switches empty stays chosen
  // ===================================================================================================================
  await block('SEAM-10', async () => {
    const T = boot();
    // Alpha Office's items are all USN money in FY2027; Air Vehicle's all USAF money in FY2026
    const rows = [r({ 'CCaR No': 'AL100', PMO: 'Alpha Office', Budget: 'USN O&M Discretionary', FY: 2027, Date: '2027-02-10', Amount: '2500000' }),
      r({ 'CCaR No': 'AL101', PMO: 'Alpha Office', Budget: 'USN O&M Discretionary', FY: 2027, Date: '2027-03-10', 'Plan Event': 'Event two', Amount: '1000000' }),
      r({ 'CCaR No': 'AV100', Amount: '4000000' }), r({ 'CCaR No': 'AV101', Amount: '3000000', Alloc: EXEC })];
    await T.imp([['O&M Raw Data.csv', csv(rows)]], '2026-11-09T15:00:00Z');
    T.view('na');
    T.pick('pmo', 'Alpha Office');
    C.chk('SEAM-10: (Alpha Office chosen: its 2 items, $3.50M)', /^2 of 2 items, \$3\.50M$/.test(T.count()), T.count());
    T.svc(5, false);                                    // USN off: Alpha Office has nothing left to show
    C.chk('SEAM-10: USN off, the PMO filter still says Alpha Office, never All', /^Alpha Office/.test(T.chosen('pmo')), T.chosen('pmo'));
    C.chk('SEAM-10: and lists nothing, rather than every PMO’s items', /^0 of 0 items/.test(T.count()), T.count());
    const lost = T.main().querySelector('p.note.lost');
    C.chk('SEAM-10: and says the filter chosen has nothing that counts with these switches, and stays chosen', !!lost && /Alpha Office/.test(lost.textContent)
      && /stays chosen/.test(lost.textContent), lost && lost.textContent);
    C.chk('SCR2-8: the count of nothing reads $0.00M, never $-M', /, \$0\.00M$/.test(T.count()) && !/\$-M/.test(T.count()), T.count());
    T.svc(5, true);
    // SCR2-8 on its own: Air Vehicle and FY2027 are both there, but no Air Vehicle item is in FY2027
    T.click(T.main().querySelector('[data-act=naclear]'));
    T.pick('pmo', 'Air Vehicle (AV)'); T.pick('fy', 'FY2027');
    C.chk('SCR2-8: a choice with no item counts “0 of 1 items, $0.00M”, never $-M', T.count() === '0 of 1 items, $0.00M', T.count());
    T.click(T.main().querySelector('[data-act=naclear]'));
    T.pick('pmo', 'Alpha Office');
    C.chk('SEAM-10: USN back on, Alpha Office’s list is back, as chosen', T.chosen('pmo') === 'Alpha Office' && /^2 of 2 items, \$3\.50M$/.test(T.count())
      && !T.main().querySelector('p.note.lost'), T.chosen('pmo') + ' / ' + T.count());
    // the FY and appropriation choices the same way
    T.click(T.main().querySelector('[data-act=naclear]'));
    T.pick('fy', 'FY2027');
    T.svc(5, false);
    C.chk('SEAM-10: an FY chosen stays chosen while it has no item', /^FY2027/.test(T.chosen('fy')) && /^0 of \d+ items/.test(T.count()), T.chosen('fy') + ' / ' + T.count());
    T.svc(5, true);
    C.chk('SEAM-10: and its items come back with the switch', T.chosen('fy') === 'FY2027' && /^2 of \d+ items/.test(T.count()), T.chosen('fy') + ' / ' + T.count());
    T.click(T.main().querySelector('[data-act=naclear]'));
    C.chk('SEAM-10 (control): Clear filters takes every choice off', T.chosen('pmo') === 'All' && T.chosen('fy') === 'All' && /^4 of 4 items|^3 of 3 items/.test(T.count()),
      T.chosen('pmo') + ' / ' + T.count());
    // the PMOs view: the PMO picked stays picked
    T.view('pmos');
    const ps = () => T.main().querySelector('select[data-act=pmo]');
    const opt = [...ps().options].find(o => o.textContent === 'Alpha Office');
    T.change(ps(), opt.value);
    C.chk('SEAM-10: (PMOs: Alpha Office picked)', /PMO: Alpha Office/.test(T.main().querySelector('h2.title').textContent));
    T.svc(5, false);
    C.chk('SEAM-10: PMOs, USN off: still Alpha Office, saying it has no money that counts, never another PMO’s tab',
      /PMO: Alpha Office/.test(T.main().querySelector('h2.title').textContent) && /no money that counts/.test(T.main().textContent)
      && /^Alpha Office/.test(ps().options[ps().selectedIndex].textContent), T.main().querySelector('h2.title').textContent);
    T.svc(5, true);
    C.chk('SEAM-10: PMOs, USN back on: Alpha Office’s tab', /PMO: Alpha Office/.test(T.main().querySelector('h2.title').textContent)
      && !!T.main().querySelector('table.grid.top'), T.main().querySelector('h2.title').textContent);
    C.eq('SEAM-10: no script error', T.errors(), []);
    T.t.close();
  });

  // ===================================================================================================================
  // M1, BP-2, BP-6, SCR2-11 — What changed and the top bar, after two pulls imported on one day
  // ===================================================================================================================
  await block('What changed', async () => {
    const T = boot();
    const T1 = '2026-11-09T14:05:00Z', T2 = '2026-11-09T16:40:00Z';
    const keep = r({ 'CCaR No': 'D400', 'Plan Event': 'PE D', Amount: '90' });
    const g1 = [keep,
      r({ 'CCaR No': 'B200', 'Plan Event': 'PE B', Amount: '5000000' }),
      r({ 'CCaR No': 'A100', 'Plan Event': 'PE A', Amount: '2340000' }),
      r({ 'CCaR No': 'C300', 'Plan Event': 'PE C', Amount: '1876543.21', Date: '2026-06-28' }),
      r({ 'CCaR No': 'E500', 'Plan Event': 'PE E', Amount: '300' }), r({ 'CCaR No': 'E500', 'Plan Event': 'PE E', Amount: '700' })];
    // the second pull: B200's Amount no longer reads; A100 obligated; C300 slipped to Sep; one of E500's two rows gone
    const g2 = [keep,
      r({ 'CCaR No': 'B200', 'Plan Event': 'PE B', Amount: '5,000,000 USD' }),
      r({ 'CCaR No': 'A100', 'Plan Event': 'PE A', Amount: '2340000', Alloc: EXEC }),
      r({ 'CCaR No': 'C300', 'Plan Event': 'PE C', Amount: '1876543.21', Date: '2026-09-28' }),
      r({ 'CCaR No': 'E500', 'Plan Event': 'PE E', Amount: '300' })];
    const ff = [r({ 'CCaR No': 'F100', Budget: 'USAF Full Fund Discretionary', Amount: '2000000' })];
    await T.imp([['O&M Raw Data.csv', csv(g1)], ['FF Raw Data.csv', csv(ff)]], T1);
    const res = await T.imp([['O&M Raw Data.csv', csv(g2)]], T2);
    // SCR2-11: the top bar and the message say which pull is the older
    const pulls = T.doc.getElementById('uiPulls').textContent;
    C.chk('SCR2-11: the top bar names the two imports of one day by their times', pulls.includes('O&M imported ' + hm(T2)) && pulls.includes('Full Fund imported ' + hm(T1)), pulls);
    C.chk('SCR2-11: the import message names the kept pull’s time', res.message.includes('Full Fund keeps its pull of ' + hm(T1)), res.message);
    const M = T.view('changes');
    const txt = M.textContent;
    // BP-6: the imports this file holds, told apart
    const imps = [...M.querySelectorAll('ul.notes li')].map(x => x.textContent);
    C.chk('BP-6: the two imports of one day are told apart in the list', imps.length === 2 && imps[0].startsWith(hm(T1) + ':') && imps[1].startsWith(hm(T2) + ':'), J(imps));
    const sec = M.querySelector('section.chg[data-ap="om"]');
    const h4 = k => sec.querySelector('h4[data-list="' + k + '"]');
    // M1
    C.chk('M1: B200, still in the pull with an Amount that does not read, is not “gone from this pull”', h4('gone').getAttribute('data-n') === '0'
      && !/B200/.test((h4('gone').nextElementSibling || {}).textContent || ''), h4('gone').textContent);
    const un = sec.querySelector('p.note.unread');
    C.chk('M1: the view says how many rows could not be read, in each pull, and that none is called new or gone for it', !!un
      && un.getAttribute('data-unread') === '0|1' && /1 row in this pull and 0 rows in the earlier one could not be read/.test(un.textContent), un && un.textContent);
    C.chk('M1: the view no longer says every row is compared with nothing about the rows it cannot read', /still in its pull/.test(txt), '');
    // open every list
    for (let i = 0; i < 10; i++) {
      const b = [...sec.ownerDocument.querySelectorAll('section.chg[data-ap="om"] button[data-act=diff]')].find(x => x.getAttribute('aria-expanded') === 'false' && !x.disabled);
      if (!b) break;
      T.click(b);
    }
    const S = T.main().querySelector('section.chg[data-ap="om"]');
    const btns = [...S.querySelectorAll('button[data-act=diff]')].map(b => b.textContent);
    C.eq('BP-6: the buttons count lines, in words that agree with their counts', btns, ['Hide the 3 changed lines (largest change first)',
      'Show the 0 new lines (largest change first)', 'Show the 0 lines gone (largest change first)', 'Hide the 1 line with a row that could not be read (largest change first)']);
    C.chk('BP-6: the view says what a line is, and that a row taken from a line that stays changes it', /A line is every row of one FY, PMO, Title, Plan Event and CCaR, added together/
      .test((S.querySelector('p.note.lines') || {}).textContent || ''));
    const rowsOf = k => [...S.querySelectorAll('table[data-leaves="' + k + '"] tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => td.textContent));
    const ch0 = rowsOf('changed'), ch = [0, 1, 2].map(i => ch0[i] || []);
    // ordered by the largest of amount, obligated and dollars moved: A100 obligated 2.34, C300 moved 1.88, E500 amount 0.0007
    C.eq('BP-2: the changed lines, largest first: the line obligated, the line that slipped, the line that lost a row', ch0.map(x => x[4]), ['A100', 'C300', 'E500']);
    C.chk('BP-2: the obligated line says so, with its obligated dollars before and after', ch[0][8] === '-' && ch[0][9] === '2.34' && ch[0][10] === 'obligated 0.00 → 2.34', J(ch[0]));
    C.chk('BP-2: the slipped line says what moved, from Jun-2026 to Sep-2026', ch[1][7] === '-' && ch[1][10] === '1.88 moved from Jun-2026 to Sep-2026', J(ch[1]));
    C.chk('BP-6: E500, one of its two rows gone, is a changed line (1,000 → 300), not a line gone', ch[2][5] === '<0.01' && ch[2][10] === 'amount', J(ch[2]));
    const ur = rowsOf('unread');
    C.chk('M1: B200’s line is listed apart: 5.00 it could read, nothing it can read now, and why', ur.length === 1 && ur[0][4] === 'B200' && ur[0][5] === '5.00'
      && ur[0][6] === '-' && /1 row in this pull could not be read/.test(ur[0][10]), J(ur));
    C.eq('What changed: no script error', T.errors(), []);
    T.t.close();
    // two imports in the same minute: told apart to the second, in the top bar and in the message
    const U = boot();
    const S1 = '2026-11-09T14:05:10Z', S2 = '2026-11-09T14:05:40Z';
    await U.imp([['O&M Raw Data.csv', csv(g1)], ['FF Raw Data.csv', csv(ff)]], S1);
    const res2 = await U.imp([['O&M Raw Data.csv', csv(g2)]], S2);
    const hms = iso => hm(iso) + ':' + pad(new Date(iso).getSeconds());
    const pl = U.doc.getElementById('uiPulls').textContent;
    C.chk('SCR2-11: two imports in one minute are told apart to the second, in the top bar and in the message', pl.includes('O&M imported ' + hms(S2))
      && pl.includes('Full Fund imported ' + hms(S1)) && res2.message.includes('Full Fund keeps its pull of ' + hms(S1)), pl + ' | ' + res2.message);
    U.t.close();
  });

  // ===================================================================================================================
  // SCR2-7 — the views the switches do not reach
  // ===================================================================================================================
  await block('SCR2-7', async () => {
    const T = boot();
    await T.imp([['O&M Raw Data.csv', csv([r({ 'CCaR No': 'K100', Amount: '1000' }), r({ 'CCaR No': 'K101', Budget: 'USN O&M Discretionary', Amount: '2000' })])]],
      '2026-11-09T15:00:00Z');
    // a view the switches do not reach does not head its notice "Showing only part of the data"
    T.svc(0, false);
    for (const v of ['changes', 'report']) {
      const box = T.view(v).querySelector('p.shown');
      C.chk('SCR2-7: USAF off, ' + v + ' says it shows every row, and never “Showing only part of the data.”', !!box && /^This view shows every row, whatever the switches/.test(box.textContent)
        && !/Showing only part of the data/.test(box.textContent), box && box.textContent);
    }
    const nbox = T.view('na').querySelector('p.shown');
    C.chk('SCR2-7 (control): Not Allocated, which the switches do reach, still says it shows only part', !!nbox && /^Showing only part of the data\./.test(nbox.textContent), nbox && nbox.textContent);
    T.t.close();
  });

  // ===================================================================================================================
  // SCR2-5 — a setting put back as the file holds it
  // ===================================================================================================================
  await block('SCR2-5', async () => {
    const t0 = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine'] });
    const parsed = await t0.SP.parseFiles([{ name: 'O&M Raw Data.csv', data: csv([r({ 'CCaR No': 'K100', Amount: '1000' })]) }], { now: '2026-11-09T15:00:00Z' });
    const state = JSON.parse(J({ v: 1, tool: 'sfcb-spend-plan', savedAt: '2026-11-09T15:30:00.000Z', settings: t0.SP.defaultSettings('2026-11-09'),
      pulls: { current: parsed.pulls, previous: {} }, history: [{ importedAt: '2026-11-09T15:00:00Z', aps: ['om'], totals: {} }], lastImport: { report: parsed.report } }));
    t0.close();
    const T = boot(state);
    await settle();                                     // the page draws once its document is ready
    const save = () => T.doc.getElementById('uiSave').textContent;
    C.chk('SCR2-5: (the saved plan opens Saved, Data through Oct-2026)', save() === 'Saved' && T.SP.state.settings.asOf === '2026-10', save());
    const box = T.doc.getElementById('uiAsOf');
    T.change(box, '2026-01'); await settle();
    C.chk('SCR2-5: (January taken: Unsaved changes)', save() === 'Unsaved changes' && T.SP.isDirty());
    T.change(box, '2026-10'); await settle();
    C.chk('SCR2-5: October typed back, the month the file holds: Saved again, nothing to save', save() === 'Saved' && !T.SP.isDirty() && T.SP.saveStatus() === 'saved', save());
    C.chk('SCR2-5: and the message says nothing is unsaved', /Data through set to Oct-2026/.test(T.msg()) && /nothing is unsaved/.test(T.msg()), T.msg());
    // an override set and taken off again, through the Settings view's own picker
    T.view('settings');
    const sel = () => T.main().querySelector('select[data-act=bsvc][data-i="0"]');
    T.change(sel(), '1'); await settle();
    C.chk('SCR2-5: (a budget override: Unsaved changes)', save() === 'Unsaved changes');
    T.change(sel(), ''); await settle();
    C.chk('SCR2-5: taken off again: Saved', save() === 'Saved' && !T.SP.isDirty(), save());
    // control: anything but a setting stays unsaved, whatever the settings say afterwards
    await T.ui([['O&M Raw Data.csv', csv([r({ 'CCaR No': 'K100', Amount: '1000' }), r({ 'CCaR No': 'K101', Amount: '2000' })])]]);
    T.SP.setSettings({ asOf: '2026-05' }); T.SP.setSettings({ asOf: '2026-10' }); await settle();
    C.chk('SCR2-5 (control): after an import, settings put back leave the import unsaved', save() === 'Unsaved changes' && T.SP.isDirty(), save());
    C.eq('SCR2-5: no script error', T.errors(), []);
    T.t.close();
  });

  // ===================================================================================================================
  // SCR2-9, SCR2-10 — Help's words, and the pickers' names
  // ===================================================================================================================
  await block('SCR2-9/10', async () => {
    const T = boot();
    await T.imp([['O&M Raw Data.csv', csv([r({ 'CCaR No': 'K100', Amount: '1000' }), r({ 'CCaR No': 'K101', FY: 2027, Date: '2027-01-02', Amount: '2000' })])]],
      '2026-11-09T15:00:00Z');
    T.click(T.doc.querySelector('[data-act=help]'));
    const help = T.main().textContent;
    C.chk('SCR2-9: no “They are this browser’s view” left standing after the entered Authorized and the notes', !/They are this browser’s view/.test(help)
      && /The service and lane switches are this browser’s view, not saved in the file\./.test(help), '');
    C.chk('SCR2-9: an entered Authorized is said to be saved in the file', /an entered Authorized, which is entered for an appropriation and FY as a whole and saved in the file/.test(help));
    C.chk('SCR2-9: Help no longer says every import sets Data through (one that places no row leaves it)', !/Each import sets Data through/.test(help)
      && /one that places no row in any appropriation leaves it where it was/.test(help), '');
    T.click(T.doc.querySelector('[data-act=help]'));
    // every picker inside a label, on every view: its accessible name starts with the label's own words (WCAG 2.5.3)
    const bad = [];
    let seen = 0;
    for (const v of ['summary', 'slides', 'om', 'pmos', 'na', 'settings', 'changes', 'report']) {
      for (const el of T.view(v).querySelectorAll('label select[aria-label], label input[aria-label]')) {
        const lab = el.closest('label');
        const words = [...lab.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').replace(/\s+/g, ' ').trim();
        if (!words) continue;
        seen++;
        if (!el.getAttribute('aria-label').toLowerCase().startsWith(words.toLowerCase())) bad.push(v + ': “' + words + '” vs “' + el.getAttribute('aria-label') + '”');
      }
    }
    C.chk('SCR2-10: every labelled picker’s accessible name starts with the words beside it (' + seen + ' pickers)', seen >= 2 && !bad.length, J(bad.slice(0, 3)));
    T.t.close();
  });

  // ===================================================================================================================
  // CHROMIUM: SCR2-1, SCR2-2, SCR2-3, SCR2-5, SCR2-10 on the synthetic fixture
  // ===================================================================================================================
  await block('Chromium', async () => {
    const FX = join(tmp.dir, 'fx');
    mkdirSync(FX);
    const mk = spawnSync('python3', ['-I', join(HERE, 'fixture', 'make_fixture.py'), '--out', FX], { encoding: 'utf8' });
    if (mk.status !== 0) throw new Error('make_fixture.py failed: ' + mk.stderr.slice(-400));
    const t0 = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine'] });
    const b = readFileSync(join(FX, 'pull-all.xlsx'));
    const NOW = '2026-11-09T12:00:00.000Z';
    const parsed = await t0.SP.parseFiles([{ name: 'pull-all.xlsx', data: b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) }], { now: NOW });
    const state = JSON.parse(J({ v: 1, tool: 'sfcb-spend-plan', savedAt: '2026-11-09T12:30:00.000Z', settings: t0.SP.defaultSettings('2026-11-09'),
      pulls: { current: parsed.pulls, previous: {} }, history: [{ importedAt: NOW, aps: ['om', 'ff', 'sp', 'opn'], totals: {} }], lastImport: { report: parsed.report } }));
    t0.close();
    const file = join(tmp.dir, 'sfcb-spend-plan.html');
    writeFileSync(file, PAGE ? withState(PAGE, state) : pageHtml({ state }));
    const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
    try {
      const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, timezoneId: 'America/New_York' });
      const p = await ctx.newPage();
      const errors = [];
      p.on('pageerror', e => errors.push(e.message));
      p.on('dialog', d => d.dismiss().catch(() => {}));
      await p.goto(pathToFileURL(file).href);
      // SCOPE opens on the Overview (CONTRACT §18); these checks read the Summary
      await p.waitForSelector('[data-act=view][data-v=summary]');
      await p.click('[data-act=view][data-v=summary]');
      await p.waitForSelector('tr[data-bk=total]');
      const saveWord = () => p.$eval('#uiSave', e => e.textContent);
      await p.evaluate(() => SP.say(''));

      // ---- SCR2-5 in the browser's own month box: typing "10" over October takes January at the "1"
      await p.focus('#uiAsOf');
      await p.keyboard.type('10', { delay: 40 });
      await p.waitForTimeout(250);
      C.chk('SCR2-5 (Chromium): “10” typed over October leaves the plan Saved', (await saveWord()) === 'Saved'
        && (await p.evaluate(() => SP.state.settings.asOf)) === '2026-10', await saveWord());
      await p.evaluate(() => { document.activeElement.blur(); SP.say(''); });

      // ---- SCR2-10: found by the words on screen, as speech input finds it
      await p.click('[data-act=view][data-v=om]');
      C.chk('SCR2-10 (Chromium): the Expand to pickers are found by the name “Expand to”', (await p.getByRole('combobox', { name: 'Expand to' }).count()) >= 2);

      // ---- SCR2-3: the marks on a TOTAL row can be read on its navy
      await p.click('[data-act=view][data-v=settings]');
      await p.fill('input[data-act=auth][data-i="0"]', '100');
      await p.press('input[data-act=auth][data-i="0"]', 'Tab');
      await p.waitForTimeout(100);
      await p.click('[data-act=svc][data-i="0"]');                // USAF off: the entered Authorized is marked ‡
      await p.click('[data-act=view][data-v=summary]');
      const marks = await p.evaluate(() => {
        const lum = c => { const m = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
          return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
        return [...document.querySelectorAll('tr.total .dag, tr.total .ddag')].map(e => {
          const fg = lum(getComputedStyle(e).color), bg = lum(getComputedStyle(e.closest('td')).backgroundColor);
          return { mark: e.textContent, ratio: Math.round(100 * (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05)) / 100 };
        });
      });
      C.chk('SCR2-3: the TOTAL row carries its † and ‡', marks.some(m => m.mark === '†') && marks.some(m => m.mark === '‡'), J(marks));
      C.chk('SCR2-3: each reads at 4.5:1 or more on the navy', marks.length > 0 && marks.every(m => m.ratio >= 4.5), J(marks));
      await p.click('[data-act=svc][data-i="0"]');

      // ---- SCR2-1: the keyboard's place is not left under the top its own change grows
      await p.click('[data-act=view][data-v=settings]');
      await p.evaluate(() => SP.say(''));
      await p.waitForTimeout(50);
      const n = await p.$$eval('#uiMain table.budgets select', l => l.length);
      await p.focus('#uiMain table.budgets select >> nth=' + (n - 1));
      const probe = () => p.evaluate(() => {
        const a = document.activeElement, rr = a.getBoundingClientRect(), top = document.getElementById('uiTop').getBoundingClientRect().bottom;
        const at = document.elementFromPoint(rr.left + rr.width / 2, rr.top + rr.height / 2);
        return { k: a.getAttribute('data-fkey'), top: Math.round(rr.top), bottom: Math.round(rr.bottom), headerBottom: Math.round(top), seen: !!at && (at === a || a.contains(at)) };
      });
      let s;
      for (let i = 0; i < 300; i++) {
        await p.keyboard.press('Shift+Tab');
        s = await probe();
        if (/^b(svc|lane):/.test(s.k || '') && s.top < s.headerBottom + 20) break;
      }
      C.chk('SCR2-1: (a budget picker reached with Shift+Tab sits just under the top, on screen)', /^b(svc|lane):/.test(s.k || '') && s.seen, J(s));
      await p.keyboard.press('ArrowDown');
      await p.waitForTimeout(300);
      const after = await probe();
      C.chk('SCR2-1: (its change writes a message, and the top grows)', after.headerBottom > s.headerBottom, J(after) + ' was ' + J(s));
      C.chk('SCR2-1: the picker just changed is on screen, not under the grown top', after.k === s.k && after.seen && after.top >= after.headerBottom, J(after));
      // control: a control scrolled away before the top grew is left where the person scrolled it
      await p.evaluate(() => SP.say(''));
      await p.waitForTimeout(100);
      const y0 = await p.evaluate(() => { window.scrollTo(0, document.documentElement.scrollHeight); return window.scrollY; });
      await p.evaluate(() => SP.say('A message that grows the top. '.repeat(12), 'info'));
      await p.waitForTimeout(150);
      const y1 = await p.evaluate(() => window.scrollY);
      C.chk('SCR2-1 (control): a focused control scrolled off the window is not scrolled back to when the top grows', Math.abs(y1 - y0) <= 60, y0 + ' -> ' + y1);
      await p.evaluate(() => SP.say(''));

      // ---- SCR2-2: printed, every page is marked at its top and its bottom, and says Data through
      const pdfOk = spawnSync('pdftotext', ['-v'], { encoding: 'utf8' });
      C.chk('SCR2-2: (pdftotext is here to read the printed pages)', !pdfOk.error, String(pdfOk.error || ''));
      for (const v of ['summary', 'om', 'na']) {
        await p.click('[data-act=view][data-v=' + v + ']');
        if (v === 'om') { for (let i = 0; i < 2; i++) await p.selectOption('#uiMain select[data-act=lvl] >> nth=' + i, '4'); }
        const f = join(tmp.dir, 'print-' + v + '.pdf');
        await p.pdf({ path: f, format: 'Letter', landscape: true, printBackground: true });
        const bb = spawnSync('pdftotext', ['-bbox-layout', f, '-'], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout || '';
        const pages = bb.split('<page ').slice(1);
        const bad = [];
        let text = '';
        pages.forEach((pg, i) => {
          const H = Number((/^[^>]*height="([\d.]+)"/.exec(pg) || [])[1]);
          const lines = [...pg.matchAll(/<line xMin="[\d.]+" yMin="([\d.]+)" xMax="[\d.]+" yMax="([\d.]+)">([\s\S]*?)<\/line>/g)]
            .map(m => ({ y0: +m[1], y1: +m[2], t: [...m[3].matchAll(/>([^<]*)<\/word>/g)].map(x => x[1]).join(' ') }));
          text += lines.map(l => l.t).join('\n') + '\n';
          const cui = lines.filter(l => l.t === 'CUI//REL TO US DoW');
          const top = cui.some(l => l.y0 < 54), bottom = cui.some(l => l.y1 > H - 54);
          const other = lines.filter(l => l.t !== 'CUI//REL TO US DoW').length;
          if (!top || !bottom || !other) bad.push('p' + (i + 1) + (top ? '' : ' no CUI at the top') + (bottom ? '' : ' no CUI at the bottom') + (other ? '' : ' blank'));
        });
        C.chk('SCR2-2: ' + v + ' printed: every page (' + pages.length + ') marked CUI at its top and its bottom, none blank', pages.length >= (v === 'summary' ? 1 : 3) && !bad.length,
          J(bad.slice(0, 4)));
        if (v !== 'summary') C.chk('SCR2-2: ' + v + ' printed says what month its actuals run to', /Data through Oct-2026/.test(text), text.slice(0, 200));
      }
      C.eq('Chromium: no script error', errors, []);
      await ctx.close();
    } finally { await browser.close().catch(() => {}); }
  });
} finally {
  tmp.rm();
  C.done();
}
