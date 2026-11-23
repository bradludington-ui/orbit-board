// IPT on PMO Spend Plan (CONTRACT §58): a PMO's tab can be narrowed to one IPT, the pull's Sub-PMO column. The picker offers
// the Sub-PMO texts of that PMO's rows (and "(no IPT)" for rows with none); picked, every figure of the tab is that IPT's rows
// alone. Invented data; every expectation is worked out by hand from the rows below.
//
//   node apex/test/ipt.test.mjs
process.env.TZ = 'America/New_York';
import { loadTool, pageHtml, checks } from './harness.mjs';

const C = checks('ipt');
const J = x => JSON.stringify(x);
const settle = (ms = 40) => new Promise(res => setTimeout(res, ms));
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description', 'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC',
  'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code', 'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const AV = 'Air Vehicle (AV)', PP = 'Propulsion (PP)', BUD = 'USAF O&M- Tessa Base Discretionary', EX = 'Actual Execution is allocated', NA = 'Not Allocated';
const row = (ccar, Title, pe, Date, Amount, Alloc, PMO, sub) => ({ FY: 2027, 'CCaR No': ccar, Title, Budget: BUD, 'Plan Event': pe, Date, Amount, Alloc, PMO, 'Sub-PMO': sub });
// THE PULL, O&M FY2027:
//   AV  TS1 Tessa A  "A1" 1,000,000 obligated  Sub-PMO "Wing Team"
//   AV  TS1 Tessa A  "A2"   500,000 planned    Sub-PMO "Wing Team"
//   AV  TS2 Tessa B  "B1" 2,000,000 planned    Sub-PMO "Tail Team"
//   AV  TS3 Tessa C  "C1"   300,000 obligated  (no Sub-PMO)
//   PP  TS4 Tessa D  "D1" 4,000,000 planned    Sub-PMO "Wing Team"   (another PMO's IPT of the same name)
// So AV: Approved 3,800,000, Obligated 1,300,000; AV Wing Team: Approved 1,500,000, Obligated 1,000,000; Tail Team 2,000,000 and 0.
const OM = [row('TS1', 'Tessa A', 'A1', '2026-10-05', '1000000', EX, AV, 'Wing Team'), row('TS1', 'Tessa A', 'A2', '2027-01-05', '500000', NA, AV, 'Wing Team'),
  row('TS2', 'Tessa B', 'B1', '2027-02-05', '2000000', NA, AV, 'Tail Team'), row('TS3', 'Tessa C', 'C1', '2026-10-09', '300000', EX, AV, ''),
  row('TS4', 'Tessa D', 'D1', '2027-03-05', '4000000', NA, PP, 'Wing Team')];
const errs = t => t.errors.filter(e => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click|HTMLCanvasElement)/.test(String(e)));

try {
  const A = loadTool({ html: pageHtml({}), url: 'http://localhost/apex.html' }), W = A.window, doc = W.document, S = A.SP;
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  const main = () => doc.getElementById('uiMain');
  const click = async el => { el.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); await settle(); };
  const change = async el => { el.dispatchEvent(new W.Event('change', { bubbles: true })); await settle(); };
  S.applyImport(await S.parseFiles([{ name: 'om.csv', data: csv(OM) }], { now: '2026-11-09T12:00:00.000Z' }));
  S.setSettings({ asOf: '2026-10' });
  await settle(60);
  await click(doc.querySelector('#uiNav [data-v=pmos]'));
  const pmoSel = () => main().querySelector('select[data-act=pmo]'), iptSel = () => main().querySelector('select[data-act=ipt]');
  const pickPmo = async label => { const s = pmoSel(); s.value = [...s.options].find(o => o.textContent === label).value; await change(s); };
  const pickIpt = async label => { const s = iptSel(); s.value = [...s.options].find(o => o.textContent === label).value; await change(s); };
  // the PMO table's total row: Approved, Authorized, Obligated, Unobligated ($M)
  const total = () => [...main().querySelector('table.grid tbody tr:last-child').children].slice(1, 5).map(c => c.textContent);
  await pickPmo(AV);
  C.eq('Air Vehicle: the IPT picker offers All IPTs, then its Sub-PMOs by name, then (no IPT)', J([...iptSel().options].map(o => o.textContent)), J(['All IPTs', 'Tail Team', 'Wing Team', '(no IPT)']));
  C.eq('all IPTs: the whole PMO', J(total()), J(['3.80', '3.80', '1.30', '2.50']));
  const stateBefore = J(S.state);
  await pickIpt('Wing Team');
  C.eq('Wing Team: only its rows, under Air Vehicle (the other PMO’s Wing Team is not counted)', J(total()), J(['1.50', '1.50', '1.00', '0.50']));
  C.chk('the title and a note say which IPT', /PMO: Air Vehicle \(AV\) - IPT: Wing Team - /.test(main().querySelector('h2.title').textContent)
    && /^Only the rows whose Sub-PMO is Wing Team\. Authorized shows Approved here\.$/.test(main().querySelector('#uiIptNote').textContent), main().querySelector('h2.title').textContent);
  C.chk('the block lists Tessa A alone', /Tessa A/.test(main().querySelector('.blk-sec').textContent) && !/Tessa B|Tessa C|Tessa D/.test(main().querySelector('.blk-sec').textContent));
  C.chk('nothing in the plan changes', J(S.state) === stateBefore);
  C.chk('on paper, the line says which IPT was picked', /IPT Wing Team/.test(doc.getElementById('uiPrintHead').textContent), doc.getElementById('uiPrintHead').textContent);
  await pickIpt('(no IPT)');
  C.eq('(no IPT): the rows with no Sub-PMO', J(total()), J(['0.30', '0.30', '0.30', '-']));
  await pickIpt('All IPTs');
  C.eq('All IPTs: the whole PMO again, and no note', J([total(), !!main().querySelector('#uiIptNote')]), J([['3.80', '3.80', '1.30', '2.50'], false]));
  await pickIpt('Tail Team');
  await pickPmo(PP);
  C.eq('another PMO: the IPT choice is taken off, and its own Sub-PMOs are offered', J([total(), [...iptSel().options].map(o => o.textContent), iptSel().value]), J([['4.00', '4.00', '-', '4.00'], ['All IPTs', 'Wing Team'], '']));
  await pickIpt('Wing Team');
  C.eq('Propulsion’s Wing Team is its own rows', J(total()), J(['4.00', '4.00', '-', '4.00']));
  // a view-only copy has it too
  const vo = loadTool({ html: S.viewOnlyHtml('2026-11-12T13:00:00.000Z'), url: 'http://localhost/apex.html' });
  for (let i = 0; i < 200 && !vo.window.document.getElementById('uiMain'); i++) await settle(5);
  vo.window.document.querySelector('#uiNav [data-v=pmos]').dispatchEvent(new vo.window.MouseEvent('click', { bubbles: true })); await settle(60);
  const vm = vo.window.document.getElementById('uiMain'), vps = vm.querySelector('select[data-act=pmo]');
  vps.value = [...vps.options].find(o => o.textContent === AV).value; vps.dispatchEvent(new vo.window.Event('change', { bubbles: true })); await settle(60);
  const vis = vo.window.document.getElementById('uiMain').querySelector('select[data-act=ipt]');
  vis.value = [...vis.options].find(o => o.textContent === 'Wing Team').value; vis.dispatchEvent(new vo.window.Event('change', { bubbles: true })); await settle(60);
  C.eq('a view-only copy offers IPT and narrows the same way', J([...vo.window.document.getElementById('uiMain').querySelector('table.grid tbody tr:last-child').children].slice(1, 5).map(c => c.textContent)), J(['1.50', '1.50', '1.00', '0.50']));
  C.eq('no script error in the copy', J(errs(vo)), '[]');
  vo.close();
  C.eq('no script error on the page', J(errs(A)), '[]');
  A.close();
} catch (err) {
  console.error(err);
  C.chk('the test ran to its end', false, (err && err.message) || String(err));
}
C.done();
