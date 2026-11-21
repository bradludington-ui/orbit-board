// A view-only copy (CONTRACT §35): the dashboard as a file for others to look at. No Data checks, no Set up, no Manage data,
// no importing, no saving; Data through and First FY are said, never set. The Filter and the pickers still work, and the
// figures are the page's own. The lock is in the store as well as on the screen. Invented data throughout.
//
//   node apex/test/view-only.test.mjs
process.env.TZ = 'America/New_York';
import { loadTool, pageHtml, checks } from './harness.mjs';

const C = checks('view-only');
const J = x => JSON.stringify(x);
const settle = (ms = 20) => new Promise(res => setTimeout(res, ms));
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const row = (ccar, Title, Budget, Date, Amount, Alloc, PMO) => ({ FY: 2027, 'CCaR No': ccar, Title, Budget, 'Plan Event': 'E ' + ccar, Date, Amount, Alloc, PMO });
const OLD = [row('TS0001', 'Tessa A', 'USAF O&M- Tessa Base Discretionary', '2026-12-01', '900000', 'Not Allocated', 'Air Vehicle (AV)')];
const NEW = [row('TS0001', 'Tessa A', 'USAF O&M- Tessa Base Discretionary', '2026-10-15', '1000000', 'Actual Execution is allocated', 'Air Vehicle (AV)'),
  row('TS0002', 'Tessa B', 'USN CV O&M Tessa', '2027-02-01', '3000000', 'Not Allocated', 'Propulsion (PP)')];
const errs = t => t.errors.filter(e => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click|HTMLCanvasElement)/.test(String(e)));
async function boot(html) {
  const t = loadTool({ html });
  for (let i = 0; i < 200 && !t.window.document.getElementById('uiMain'); i++) await settle(5);
  const W = t.window, doc = W.document;
  return { t, W, doc, SP: t.SP, main: () => doc.getElementById('uiMain'),
    click: el => el.dispatchEvent(new W.MouseEvent('click', { bubbles: true })), change: el => el.dispatchEvent(new W.Event('change', { bubbles: true })),
    async view(v) { this.click(doc.querySelector('[data-act=view][data-v="' + v + '"]')); await settle(); return this.main(); },
    shown: el => !!el && !el.closest('[hidden]') };
}

try {
  // ---- the keeper's page: two imports (so there is a pull it replaced and a history), settings, publishing settings
  const A = await boot(pageHtml({}));
  A.SP.applyImport(await A.SP.parseFiles([{ name: 'om.csv', data: csv(OLD) }], { now: '2026-10-09T12:00:00.000Z' }));
  A.SP.applyImport(await A.SP.parseFiles([{ name: 'om.csv', data: csv(NEW) }], { now: '2026-11-09T12:00:00.000Z' }));
  A.SP.setSettings({ asOf: '2026-10', firstFY: 2026, authorized: { 'om|2027': 350000000 } });
  A.SP.setPublish({ desc: { ts0001: 'A description' }, fm: { om: 'O. Lead' } });
  await settle(40);
  // §36 the lists of what is not yet obligated are headed Unobligated Requirements; the CCaR status keeps its own name
  { const sl = await A.view('slides');
    C.chk('under a slide block the list is headed Unobligated Requirements', [...sl.querySelectorAll('.nabar')].length >= 1 && [...sl.querySelectorAll('.nabar')].every(b => b.textContent === 'Unobligated Requirements'));
    C.chk('nothing on the slides view says Not Allocated Requirements', !/Not Allocated Requirements/.test(sl.textContent));
    C.eq('the Data checks item and its view say Unobligated', J([A.doc.querySelector('[data-act=view][data-v=na]').textContent, (await A.view('na')).querySelector('h2.title').textContent]),
      J(['Unobligated', 'Unobligated Requirements - every appropriation and FY']));
    C.chk('a row’s Status still says Not Allocated: that is CCaR’s word for the row', [...A.main().querySelectorAll('table.na tbody tr')].some(tr => /Not Allocated/.test(tr.textContent)));
    await A.view('summary'); }
  const got = [];
  A.SP.download = (name, data, mime) => { got.push({ name, data, mime }); return name; };
  const btn = A.doc.querySelector('#uiManage button[data-act=viewcopy]');
  C.chk('the keeper’s page has the button, in Manage data', !!btn && btn.textContent === 'Publish view-only copy…');
  const before = J(A.SP.state), dirty = A.SP.isDirty();
  A.click(btn);
  for (let i = 0; i < 200 && !got.length; i++) await settle(10);
  C.chk('it hands the browser one .html file, named for the data', got.length === 1 && /^APEX view only - data through Oct-2026 - \d{4}-\d\d-\d\d\.html$/.test(got[0].name) && got[0].mime === 'text/html', J(got.map(g => g.name)));
  C.chk('the keeper’s page is not changed by it: the same plan, not view-only, still unsaved as it was', J(A.SP.state) === before && A.SP.isViewOnly() === false && A.SP.isDirty() === dirty);
  C.chk('and says what the copy is', /It is a copy for viewing: no importing, saving, Settings or Data checks; the Filter and the pickers still work/.test(A.doc.querySelector('.msg').textContent), A.doc.querySelector('.msg').textContent);
  const summaryOf = async T => [...(await T.view('summary')).querySelectorAll('table.top tbody tr')].map(tr => [...tr.children].map(td => td.textContent));
  const WANT = await summaryOf(A);
  const copy = String(got[0].data);

  // ---- the copy, opened
  const V = await boot(copy);
  C.eq('no script error opening the copy', J(errs(V.t)), '[]');
  C.chk('it is view-only', V.SP.isViewOnly() === true && V.SP.state.viewOnly === true);
  C.eq('it holds the plan on screen: the pulls, the settings, the publishing settings', J([J(V.SP.state.pulls.current) === J(A.SP.state.pulls.current), J(V.SP.state.settings) === J(A.SP.state.settings), J(V.SP.state.publish) === J(A.SP.state.publish)]), J([true, true, true]));
  C.eq('and not what a reader has no view of: the pull it replaced, the history, the last import report', J([V.SP.state.pulls.previous, V.SP.state.history, V.SP.state.lastImport]), J([{}, [], null]));
  C.chk('the copy is smaller than the keeper’s own saved file', copy.length < A.SP.savedHtml().length);
  C.eq('the menu has no Data checks and no Set up', J([...V.doc.querySelectorAll('#uiNav .navg')].map(g => [g.getAttribute('aria-label') || '', g.querySelectorAll('button').length])), J([['', 4], ['Browse', 6], ['Briefing', 5]]));
  C.chk('no Not Allocated, Import report, What changed or Settings anywhere on the page', !['na', 'report', 'changes', 'settings'].some(v => V.doc.querySelector('[data-act=view][data-v="' + v + '"]')));
  C.chk('it opens on the Summary, which says it is view-only at the top', V.main().querySelector('h2.title') && V.shown(V.doc.getElementById('uiVo')) && V.doc.getElementById('uiVo').textContent === 'View only');
  C.chk('there is no Manage data: the button and the bar are hidden', V.doc.getElementById('uiManageBtn').hidden === true && V.doc.getElementById('uiManage').hidden === true);
  C.eq('so nothing to import, save or publish with is on screen', J(['import', 'lastpick', 'save', 'savecopy', 'viewcopy'].map(a => [...V.doc.querySelectorAll('[data-act=' + a + ']')].some(b => V.shown(b)))), J([false, false, false, false, false]));
  C.chk('no "Unsaved changes" is said', !V.shown(V.doc.getElementById('uiSave')));
  C.chk('Data through and First FY are said as words, and their boxes are not on screen', /^Data through Oct-2026 · First FY 2026 · Published \d{1,2} [A-Z][a-z]{2} \d{4}$/.test(V.doc.getElementById('uiAsOfText').textContent)   /* review I10: and the day it was published */
    && !V.shown(V.doc.getElementById('uiAsOf')) && !V.shown(V.doc.getElementById('uiFirst')), V.doc.getElementById('uiAsOfText').textContent);
  C.eq('the figures are the keeper’s, cell for cell (the Summary)', J(await summaryOf(V)), J(WANT));
  // every view left in the menu draws
  for (const v of ['find', 'mypmo', 'cal', 'charts', 'pmos', 'om', 'overview', 'slides', 'publish']) {
    const m = await V.view(v);
    C.chk('the ' + v + ' view draws', !m.querySelector('p.err') && m.textContent.length > 40, m.textContent.slice(0, 120));
  }
  // what a reader may still do: the Filter and the pickers
  const usn = [...V.doc.querySelectorAll('#uiSwitches input[data-act=svc]')].find(b => /USN \(USN CV\)/.test(b.parentElement.textContent));
  C.chk('the service switches are there', !!usn);
  usn.checked = false; V.change(usn); await settle(40);
  const filt = await summaryOf(V);
  C.chk('switching a service off changes the view (USN’s 3.00 is no longer counted) and the Filter says so', J(filt) !== J(WANT) && V.doc.querySelector('.filtbtn').classList.contains('filtered'), J(filt[0]));
  { const again = [...V.doc.querySelectorAll('#uiSwitches input[data-act=svc]')].find(b => /USN \(USN CV\)/.test(b.parentElement.textContent)); again.checked = true; V.change(again); await settle(40); }
  C.eq('and switching it back on brings the figures back', J(await summaryOf(V)), J(WANT));
  const pm = await V.view('mypmo');
  const sel = pm.querySelector('select[data-f=pmo]') || pm.querySelector('select');
  C.chk('My PMO still has its PMO picker, with both offices', !!sel && [...sel.options].map(o => o.textContent).join('|').includes('Propulsion (PP)'), sel && [...sel.options].map(o => o.textContent).join('|'));
  // Publish PDFs: the downloads, none of the boxes
  const pub = await V.view('publish');
  C.chk('Publish PDFs offers the downloads', pub.querySelectorAll('button[data-act=pubdoc]').length >= 2 && !!pub.querySelector('button[data-act=pubzip]'));
  C.eq('and none of what changes the plan: no description boxes, FM Lead boxes, title box, emblem or unfunded-list buttons',
    J(['input[data-act=pubdesc]', 'input[data-act=pubfm]', 'input[data-act=pubhead]', '[data-act=embpick]', '[data-act=pubnoemb]', '[data-act=ufrpick]', '[data-act=ufrdel]', '[data-act=descpick]'].map(s => !!pub.querySelector(s))),
    J([false, false, false, false, false, false, false, false]));
  // Help says what this copy is
  V.click(V.doc.querySelector('[data-act=help]')); await settle();
  C.chk('Help opens by saying this is a view-only copy', /This is a view-only copy\./.test((V.doc.getElementById('uiVoHelp') || { textContent: '' }).textContent));

  // ---- the lock is in the store too: whatever is called, nothing changes and nothing is saved
  const S0 = J(V.SP.state);
  let threw = '';
  try { V.SP.applyImport(await V.SP.parseFiles([{ name: 'om.csv', data: csv(OLD) }], { now: '2026-11-20T12:00:00.000Z' })); } catch (e) { threw = e.message; }
  C.chk('an import is refused, saying why', /view-only copy of APEX: nothing in it can be changed, imported or saved/.test(threw), threw);
  V.SP.setSettings({ asOf: '2026-01', firstFY: 2020, authorized: { 'om|2027': 1 } });
  const r = [V.SP.setPublish({ fm: { om: 'Changed' } }), V.SP.setUfr({ ok: true, fy: 2027, lines: [] }), V.SP.removeUfr(2027), V.SP.takePlan(A.SP.savedHtml(), 'x.html'), V.SP.takeSettings(A.SP.savedHtml(), 'x.html'),
    await V.SP.saveFile(), await V.SP.saveCopy()];
  C.eq('settings, publishing settings, unfunded lists, taking a plan, Save and Save a copy are each refused', J(r.map(x => (x && typeof x === 'object' ? x.ok : x))), J([false, false, false, false, false, false, false]));
  C.chk('each refusal that speaks says it is a view-only copy', r.slice(3).every(x => /view-only copy/.test(x.message)), J(r.slice(3).map(x => x.message)));
  C.eq('after all of that the plan is exactly what it was, and nothing is unsaved', J([J(V.SP.state) === S0, V.SP.isDirty()]), J([true, false]));
  // a view asked for that the menu does not hold is the Summary
  const fake = V.doc.createElement('button'); fake.setAttribute('data-act', 'view'); fake.setAttribute('data-v', 'settings'); V.doc.getElementById('uiNav').appendChild(fake);
  V.click(fake); await settle();
  C.chk('asked for Settings anyhow, the copy shows the Summary', V.doc.querySelector('#uiNav [aria-pressed=true]').getAttribute('data-v') === 'summary' && !/Settings \(saved in this file\)/.test(V.main().textContent));
  C.eq('no script error in the copy', J(errs(V.t)), '[]');

  // ---- a copy is not a dead end for its keeper: a full APEX can take the plan out of it, and is not locked by it
  const B = await boot(pageHtml({}));
  const tk = B.SP.takePlan(copy, 'APEX view only.html');
  C.chk('a full APEX takes the plan in a view-only copy and stays a full APEX', tk.ok === true && B.SP.isViewOnly() === false && !('viewOnly' in B.SP.state) && J(B.SP.state.settings) === J(A.SP.state.settings));
  B.t.close();
  // a mark that is not yes or no is a damaged file
  const bad = JSON.parse(S0); bad.viewOnly = 'yes';
  const tb = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine', 'publish', 'pdf', 'store'], state: bad });
  const rb = tb.SP.storeInit();
  C.chk('refused on opening: a view-only mark that is not yes or no', rb.ok === false && /view-only mark is not yes or no/.test(rb.message), J(rb));
  tb.close(); V.t.close(); A.t.close();
} catch (err) {
  console.error(err);
  C.chk('the test ran to its end', false, (err && err.message) || String(err));
}
C.done();
