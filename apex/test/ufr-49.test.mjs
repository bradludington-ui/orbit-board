// The Unfunded page's own controls (CONTRACT §49): a button for each appropriation, the PMO picker named plainly, a line
// dragged to another rank (no up or down buttons), a subtotal under each list and the total after them, the CCaR record in
// its own column, and the keeper's Exec ready? and SFCB action on a Mandatory line, kept in the plan, carried by Import
// from last version and shown (never editable) in a view-only copy. Invented data; every expectation is written by hand.
//
//   node apex/test/ufr-49.test.mjs
process.env.TZ = 'America/New_York';
import { loadTool, pageHtml, checks } from './harness.mjs';

const C = checks('ufr-49');
const J = x => JSON.stringify(x);
const settle = (ms = 40) => new Promise(res => setTimeout(res, ms));
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description', 'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC',
  'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code', 'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const NA = 'Not Allocated', AV = 'Air Vehicle (AV)', PP = 'Propulsion (PP)';
const B = { disc: 'USAF O&M- Tessa Base Discretionary', mUsaf: 'USAF O&M- Tessa Base Mandatory', mStovl: 'USN STOVL O&M Tessa Mandatory', mSp: 'USAF APN Spares Tessa Base Initial Mandatory' };
const row = (ccar, Title, Budget, pe, Date, Amount, PMO) => ({ FY: 2027, 'CCaR No': ccar, Title, Budget, 'Plan Event': pe, Date, Amount, Alloc: NA, PMO });
// THE PULL, FY2027, Mandatory plan events:  O&M  C1 "Lot One" USAF 2,400 PP;  C2 "Repair" STOVL 1,500 AV;   Spares  C4 "Kit" USAF 700 PP
const OM = [row('C1', 'Tessa A', B.mUsaf, 'Lot One', '2026-12-01', '2400000', PP), row('C1', 'Tessa A', B.disc, 'Lot One', '2026-12-01', '5000000', PP),
  row('C2', 'Tessa B', B.mStovl, 'Repair', '2027-03-01', '1500000', AV)];
const SPR = [row('C4', 'Tessa D', B.mSp, 'Kit', '2027-04-01', '700000', PP)];
// THE UFR TRACKER, $K:  O&M  1 Alpha TS1 AV USAF 100 · 2 Bravo TS2 PP USAF 200 · 3 Charlie TS3 AV STOVL 300 · 4 Delta TS4 PP USAF 400
//                       Spares 1 Echo TS5 AV USAF 50
const K = k => k * 100000;
const tl = (ap, rank, title, pmo, ccar, svc, k, exec, sfcb) => { const c = [0, 0, 0, 0, 0, 0, 0]; c[svc] = K(k);
  return { ap, fy: 2027, sheet: ap === 'om' ? 'O&M' : 'Spares', row: 9 + rank, rank: String(rank), title, pmo, ccar, cents: c, total: K(k), status: 'Unfunded', exec, sfcb }; };
const TRK = { ok: true, fy: 2027, name: 'UFR FY27.xlsx', unit: 1000, tabs: [], notes: [], ignored: [], lines: [
  tl('om', 1, 'Alpha', 'AV', 'TS1', 0, 100, 'Yes', 'Approved'), tl('om', 2, 'Bravo', 'PP', 'TS2', 0, 200, 'No', 'Deferred'), tl('om', 3, 'Charlie', 'AV', 'TS3', 3, 300, '', ''),
  tl('om', 4, 'Delta', 'PP', 'TS4', 0, 400, '', ''), tl('sp', 1, 'Echo', 'AV', 'TS5', 0, 50, '', '')] };
const MODS = ['util', 'xlsx-read', 'import', 'engine', 'publish', 'pdf', 'xlsx-write', 'store'];
const NOW = '2026-11-09T12:00:00.000Z';
const errs = t => t.errors.filter(e => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click|HTMLCanvasElement)/.test(String(e)));

try {
  // ============================================================================ the store
  const t = loadTool({ modules: MODS }), SP = t.SP;
  SP.storeInit();
  SP.applyImport(await SP.parseFiles([{ name: 'om.csv', data: csv(OM) }, { name: 'sp.csv', data: csv(SPR) }], { now: NOW }));
  const key = SP.ufrMandKey({ ap: 'om', fy: 2027, ccar: ' c2 ', title: 'REPAIR' });
  C.eq('a Mandatory line is known by its appropriation, year, CCaR record and plan event title, as a ranking knows a line', key, SP.ufrMandKey({ ap: 'om', fy: 2027, ccar: 'C2', title: 'Repair' }));
  SP.markSaved && SP.markSaved();
  C.chk('Exec ready? takes Yes, No or nothing, and marks the plan unsaved', SP.setUfrMandStatus(key, 'exec', 'Yes') === true && SP.isDirty() && J(SP.state.ufrMandSet[key]) === J({ exec: 'Yes', sfcb: '' }));
  C.chk('… and refuses anything else, changing nothing', SP.setUfrMandStatus(key, 'exec', 'Maybe') === false && SP.state.ufrMandSet[key].exec === 'Yes');
  C.chk('SFCB action takes text, spaces tidied', SP.setUfrMandStatus(key, 'sfcb', '  Approved   12 Nov ') === true && SP.state.ufrMandSet[key].sfcb === 'Approved 12 Nov');
  C.chk('the same again changes nothing; a field it does not know is refused', SP.setUfrMandStatus(key, 'sfcb', 'Approved 12 Nov') === false && SP.setUfrMandStatus(key, 'status', 'x') === false);
  const saved = SP.savedHtml();
  C.chk('both blank takes the line out, and the last out takes the table out', SP.setUfrMandStatus(key, 'exec', '') === true && SP.setUfrMandStatus(key, 'sfcb', '') === true && SP.state.ufrMandSet === undefined);
  t.close();
  const t2 = loadTool({ html: saved }); t2.SP.storeInit();
  C.eq('a saved plan opens with them', J(t2.SP.state.ufrMandSet), J({ [key]: { exec: 'Yes', sfcb: 'Approved 12 Nov' } }));
  // the line in the lists the Unfunded page reads
  const Mf = t2.SP.buildModel(t2.SP.state.pulls.current, t2.SP.state.settings, t2.SP.defaultView(), null);
  const W = t2.SP.ufrWithMandatory({}, Mf, t2.SP.state.ufrMandSet), Rep = W.ufr['2027'].lines.find(l => l.title === 'Repair'), Lot = W.ufr['2027'].lines.find(l => l.title === 'Lot One');
  C.eq('the Mandatory line carries them; another Mandatory line carries none', J([Rep.exec, Rep.sfcb, Lot.exec, Lot.sfcb]), J(['Yes', 'Approved 12 Nov', '', '']));
  const fresh = loadTool({ modules: MODS }); fresh.SP.storeInit();
  const took = fresh.SP.takeSettings(saved, 'APEX last.html');
  C.chk('Import from last version brings them', took.ok === true && J(fresh.SP.state.ufrMandSet) === J({ [key]: { exec: 'Yes', sfcb: 'Approved 12 Nov' } }), took.message);
  fresh.close();
  const vo0 = loadTool({ html: t2.SP.viewOnlyHtml('2026-11-12T13:00:00.000Z') }); vo0.SP.storeInit();
  C.chk('a view-only copy keeps them, and refuses a change', J(vo0.SP.state.ufrMandSet) === J({ [key]: { exec: 'Yes', sfcb: 'Approved 12 Nov' } }) && vo0.SP.setUfrMandStatus(key, 'exec', 'No') === false);
  vo0.close();
  t2.close();
  const bad = loadTool({ html: saved.replace('"exec":"Yes"', '"exec":7') }); bad.SP.storeInit();
  C.chk('a saved plan whose Mandatory settings are not text is not opened as a plan', bad.SP.state.ufrMandSet === undefined && !Object.keys(bad.SP.state.pulls.current).length);
  bad.close();

  // ============================================================================ on the page
  const A = loadTool({ html: pageHtml({}), url: 'http://localhost/apex.html' }), Wd = A.window, doc = Wd.document, S = A.SP;
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  const main = () => doc.getElementById('uiMain');
  const click = async el => { el.dispatchEvent(new Wd.MouseEvent('click', { bubbles: true })); await settle(); };
  const change = async el => { el.dispatchEvent(new Wd.Event('change', { bubbles: true })); await settle(); };
  S.applyImport(await S.parseFiles([{ name: 'om.csv', data: csv(OM) }, { name: 'sp.csv', data: csv(SPR) }], { now: NOW }));
  S.setSettings({ asOf: '2026-10' });
  S.setUfr(TRK, '2026-11-10T12:00:00.000Z');
  await settle(60);
  await click(doc.querySelector('#uiNav [data-v=ufr]'));
  const titles = () => [...main().querySelectorAll('#uiUfrT tbody tr[data-ufr]')].map(tr => tr.querySelector('.tg').textContent);
  const box = title => [...main().querySelectorAll('#uiUfrT tbody tr[data-ufr]')].find(tr => tr.querySelector('.tg').textContent === title);
  const tile = id => { const x = main().querySelector('.tile[data-tile=' + id + ']'); return [x.querySelector('.tv').textContent, x.querySelector('.ts').textContent]; };
  const apBtn = label => [...main().querySelectorAll('button[data-act=ufrap]')].find(b => b.textContent === label);
  const subs = () => [...main().querySelectorAll('#uiUfrT tr.usub')].map(tr => [tr.querySelector('th').textContent, [...tr.querySelectorAll('td.n')].map(td => td.textContent).join(' ')]);
  const total = () => [...main().querySelectorAll('#uiUfrT tr.utotal td.n')].map(td => td.textContent).join(' ');
  // the appropriation buttons
  C.eq('a button for each appropriation the list holds, All pressed', J([...main().querySelectorAll('button[data-act=ufrap]')].map(b => [b.textContent, b.getAttribute('aria-pressed')])),
    J([['All appropriations', 'true'], ['O&M', 'false'], ['Initial Spares', 'false']]));
  C.chk('the buttons are named as one group, Appropriation', main().querySelector('.ufrapbar [role=group]').getAttribute('aria-label') === 'Appropriation');
  await click(apBtn('Initial Spares'));
  C.eq('Initial Spares pressed: its one line, its subtotal and the total, and the button says it is pressed', J([titles(), subs(), total(), apBtn('Initial Spares').getAttribute('aria-pressed'), apBtn('All appropriations').getAttribute('aria-pressed')]),
    J([['Echo'], [['Subtotal, Initial Spares FY2027', '50 - - - - - 50']], '50 - - - - - 50', 'true', 'false']));
  await click(apBtn('All appropriations'));
  C.eq('All appropriations: every line again', titles().length, 5);
  // the CCaR Record column
  C.eq('the CCaR record is a column of its own, after the requirement, and the title is the title alone', J([box('Alpha').children[1].textContent, box('Alpha').children[2].textContent, [...main().querySelectorAll('#uiUfrT thead th')].slice(1, 4).map(th => th.textContent)]),
    J(['Alpha', 'TS1', ['Requirement', 'CCaR Record', 'PMO']]));
  // subtotals and total
  C.eq('a subtotal under each list, by service and in all, and the total after them', J([subs(), total()]),
    J([[['Subtotal, O&M FY2027', '700 - - 300 - - 1,000'], ['Subtotal, Initial Spares FY2027', '50 - - - - - 50']], '750 - - 300 - - 1,050']));
  C.eq('each subtotal comes right after its list’s last line', J([...main().querySelectorAll('#uiUfrT tr.usub')].map(tr => tr.previousElementSibling.querySelector('.tg').textContent)), J(['Delta', 'Echo']));
  // the PMO picker
  const pmo = main().querySelector('select[data-act=ufrf][data-f=pmo]');
  C.eq('the PMO picker is named PMO', pmo.parentElement.firstChild.textContent.trim(), 'PMO');
  pmo.value = [...pmo.options].find(o => o.textContent === PP).value; await change(pmo);
  C.eq('Propulsion picked: its lines, its subtotal says it is of the lines shown', J([titles(), subs()]), J([['Bravo', 'Delta'], [['Subtotal, O&M FY2027 (the lines shown)', '600 - - - - - 600']]]));
  // a drag with a PMO picked moves the line in the whole list, past the line shown
  const ev = (el, type, y) => { const e = new Wd.Event(type, { bubbles: true, cancelable: true }); Object.defineProperty(e, 'clientY', { value: y }); el.dispatchEvent(e); return e; };
  const drag = async (from, to, y) => { const f = box(from), tg = box(to); ev(f.querySelector('th.lab'), 'mousedown', 0); ev(f, 'dragstart', 0); ev(tg.querySelector('th.lab'), 'dragover', y); ev(tg.querySelector('th.lab'), 'drop', y); ev(f, 'dragend', 0); await settle(); };
  await drag('Delta', 'Bravo', -1);
  C.eq('Delta dragged above Bravo with Propulsion picked: Delta is 2, Bravo 3, in the whole list', J([...main().querySelectorAll('#uiUfrT tbody tr[data-ufr]')].map(tr => [tr.querySelector('input.urk').value, tr.querySelector('.tg').textContent])),
    J([['2', 'Delta'], ['3', 'Bravo']]));
  C.eq('… and the whole list is Alpha, Delta, Bravo, Charlie', J(S.state.ufrRank['om|2027'].map(e => e.t)), J(['Alpha', 'Delta', 'Bravo', 'Charlie']));
  await click(main().querySelector('[data-act=ufrclear]'));
  // the Mandatory lines: Exec ready? and SFCB action
  C.chk('with the Mandatory switch off, no line has a status control', !main().querySelector('select.umx, select.ums'));
  const sw = main().querySelector('input[data-act=ufrmand]'); sw.checked = true; await change(sw);
  C.eq('switch on: each Mandatory line has an Exec ready? picker and an SFCB action box; a tracker line has neither',
    J(['Lot One', 'Repair', 'Kit', 'Alpha'].map(n => [n, !!box(n).querySelector('select.umx[data-act=ufrmx]'), !!box(n).querySelector('select.ums[data-act=ufrms]')])),
    J([['Lot One', true, true], ['Repair', true, true], ['Kit', true, true], ['Alpha', false, false]]));
  C.eq('the picker offers blank, Yes and No', J([...box('Repair').querySelector('select.umx').options].map(o => o.value)), J(['', 'Yes', 'No']));
  // §56 SFCB action is a drop-down of the tracker's four, in its order
  C.eq('§56 the SFCB action picker offers blank and the tracker’s four', J([...box('Repair').querySelector('select.ums').options].map(o => o.textContent)), J(['\u2014', 'Approved', 'Denied', 'Info Requested', 'Deferred']));
  C.eq('the tiles before: Exec ready counts Alpha alone; SFCB approved Alpha alone', J([tile('exec'), tile('sfcb')]),
    J([['$100K', '1 of 8 lines'], ['$100K', '1 requirement']]));
  S.markSaved && S.markSaved();
  const ex = box('Repair').querySelector('select.umx'); ex.value = 'Yes'; await change(ex);
  const sf = box('Repair').querySelector('select.ums'); sf.value = 'Approved'; await change(sf);
  C.chk('set on Repair: it stays set, the message says so, and the plan is unsaved', box('Repair').querySelector('select.umx').value === 'Yes' && box('Repair').querySelector('select.ums').value === 'Approved'
    && /SFCB action for “Repair” is “Approved”\. Save to keep it/.test(doc.querySelector('.msg').textContent) && S.isDirty(), doc.querySelector('.msg').textContent);
  C.eq('the tiles count it: Exec ready and SFCB approved each add Repair’s $1,500K', J([tile('exec'), tile('sfcb')]),
    J([['$1,600K', '2 of 8 lines'], ['$1,600K', '2 requirements']]));
  { const s2 = box('Lot One').querySelector('select.ums'); s2.value = 'Info Requested'; await change(s2); }
  C.eq('§56 Info Requested chosen on Lot One is kept, and counts as not approved', J([box('Lot One').querySelector('select.ums').value, tile('sfcb')]), J(['Info Requested', ['$1,600K', '2 requirements']]));
  { const s2 = box('Lot One').querySelector('select.ums'); s2.value = ''; await change(s2); }
  C.eq('the plan holds it by the line, nothing else', J(S.state.ufrMandSet), J({ [S.ufrMandKey({ ap: 'om', fy: 2027, ccar: 'C2', title: 'Repair' })]: { exec: 'Yes', sfcb: 'Approved' } }));
  C.eq('the tracker’s own lists are not changed', J(S.state.ufr['2027'].lines.map(l => [l.title, l.exec, l.sfcb])),
    J([['Alpha', 'Yes', 'Approved'], ['Bravo', 'No', 'Deferred'], ['Charlie', '', ''], ['Delta', '', ''], ['Echo', '', '']]));
  S.setUfrMandStatus(S.ufrMandKey({ ap: 'sp', fy: 2027, ccar: 'C4', title: 'Kit' }), 'sfcb', 'Approved 12 Nov'); A.window.ui_render(); await settle();
  C.eq('§56 a value typed before §56 is still shown as it was, beside the four', J([box('Kit').querySelector('select.ums').value, [...box('Kit').querySelector('select.ums').options].map(o => o.value)]),
    J(['Approved 12 Nov', ['', 'Approved', 'Denied', 'Info Requested', 'Deferred', 'Approved 12 Nov']]));
  S.setUfrMandStatus(S.ufrMandKey({ ap: 'sp', fy: 2027, ccar: 'C4', title: 'Kit' }), 'sfcb', ''); A.window.ui_render(); await settle();
  // a view-only copy shows them as text
  const vo = loadTool({ html: S.viewOnlyHtml('2026-11-12T13:00:00.000Z') });
  for (let i = 0; i < 200 && !vo.window.document.getElementById('uiMain'); i++) await settle(5);
  vo.window.document.querySelector('#uiNav [data-v=ufr]').dispatchEvent(new vo.window.MouseEvent('click', { bubbles: true })); await settle(60);
  const vm = vo.window.document.getElementById('uiMain'), vrow = [...vm.querySelectorAll('#uiUfrT tbody tr[data-ufr]')].find(tr => tr.querySelector('.tg').textContent === 'Repair');
  C.chk('a view-only copy shows Repair’s Exec ready? and SFCB action as text, with no picker, no box and nothing to drag', vrow.querySelector('.uexec').textContent === 'Yes' && vrow.children[vrow.children.length - 2].textContent === 'Approved'
    && !vm.querySelector('select.umx, select.ums') && !vm.querySelector('#uiUfrT tr[data-o]'));
  C.chk('… and the appropriation buttons and the PMO picker are there for readers', !!vm.querySelector('button[data-act=ufrap]') && !!vm.querySelector('select[data-act=ufrf][data-f=pmo]'));
  C.eq('no script error in the view-only copy', J(errs(vo)), '[]');
  vo.close();
  C.eq('no script error on the page', J(errs(A)), '[]');
  A.close();
} catch (err) {
  console.error(err);
  C.chk('the test ran to its end', false, (err && err.message) || String(err));
}
C.done();
