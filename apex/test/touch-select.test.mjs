// A drop-down on a touch screen (CONTRACT §59): after a choice the page is drawn again, and a phone opens a drop-down's own
// picker whenever that drop-down takes the focus, so the focus is not handed back to a drop-down there. With a mouse and a
// keyboard it still is, so Tab carries on from where it was. Invented data.
//
//   node apex/test/touch-select.test.mjs
process.env.TZ = 'America/New_York';
import { loadTool, pageHtml, checks } from './harness.mjs';

const C = checks('touch-select');
const J = x => JSON.stringify(x);
const settle = (ms = 40) => new Promise(res => setTimeout(res, ms));
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description', 'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC',
  'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code', 'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => (o[h] === undefined ? '' : String(o[h]))).join(','))).join('\n');
const row = (ccar, Title, PMO, sub) => ({ FY: 2027, 'CCaR No': ccar, Title, Budget: 'USAF O&M- Tessa Base Discretionary', 'Plan Event': 'E ' + ccar, Date: '2027-01-05', Amount: '100000', Alloc: 'Not Allocated', PMO, 'Sub-PMO': sub });
const OM = [row('TS1', 'Tessa A', 'Air Vehicle (AV)', 'Wing Team'), row('TS2', 'Tessa B', 'Air Vehicle (AV)', 'Tail Team'), row('TS3', 'Tessa C', 'Propulsion (PP)', 'Fan Team')];

try {
  const A = loadTool({ html: pageHtml({}), url: 'http://localhost/apex.html' }), W = A.window, doc = W.document, S = A.SP;
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  let coarse = true;
  W.matchMedia = q => ({ matches: /pointer:\s*coarse/.test(q) ? coarse : false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  S.applyImport(await S.parseFiles([{ name: 'om.csv', data: csv(OM) }], { now: '2026-11-09T12:00:00.000Z' }));
  S.setSettings({ asOf: '2026-10' });
  await settle(60);
  doc.querySelector('#uiNav [data-v=pmos]').dispatchEvent(new W.MouseEvent('click', { bubbles: true })); await settle();
  const pick = async (sel, i) => { const s = doc.getElementById('uiMain').querySelector(sel); s.focus(); s.selectedIndex = i; s.dispatchEvent(new W.Event('change', { bubbles: true })); await settle(); };
  const focusKey = () => { const a = doc.activeElement; return a && a.getAttribute ? a.getAttribute('data-fkey') : null; };
  await pick('select[data-act=ipt]', 1);
  C.chk('on a touch screen, after a choice the new IPT drop-down does not take the focus (its picker would open again)', focusKey() !== 'ipt' && doc.activeElement.tagName !== 'SELECT', String(focusKey()));
  C.chk('… and the choice is made', /IPT: Tail Team/.test(doc.querySelector('h2.title').textContent), doc.querySelector('h2.title').textContent);
  await pick('select[data-act=pmo]', 1);
  C.chk('… the same for the PMO drop-down', doc.activeElement.tagName !== 'SELECT' && /PMO: Propulsion/.test(doc.querySelector('h2.title').textContent), String(focusKey()));
  coarse = false;
  await pick('select[data-act=pmo]', 0);
  C.eq('with a mouse and keyboard the drop-down keeps the focus, so Tab carries on from it', focusKey(), 'pmo');
  C.eq('no script error', J(A.errors.filter(e => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click|HTMLCanvasElement)/.test(String(e)))), '[]');
  A.close();
} catch (err) {
  console.error(err);
  C.chk('the test ran to its end', false, (err && err.message) || String(err));
}
C.done();
