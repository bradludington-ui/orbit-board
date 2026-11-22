// Download this list (CONTRACT §50): beside each narrowable list -- Requirements, My PMO, Unfunded and SRRB -- a button saves
// exactly the lines on screen after the page's pickers, its Find box and the Filter's switches, in the order shown, with the
// screen's columns and figures (numbers as numbers), as one Excel sheet carrying the CUI marking, what was picked and the Data
// through month. It works in a view-only copy, changes nothing in the plan, and is absent where nothing is listed. Every
// workbook is read back with the page's own reader and checked against the rows on the screen AND against figures written by
// hand from the invented rows below.
//
//   node apex/test/list-download.test.mjs
process.env.TZ = 'America/New_York';
import { inflateRawSync } from 'node:zlib';
import { loadTool, pageHtml, checks } from './harness.mjs';

const C = checks('list-download');
const J = x => JSON.stringify(x);
const settle = (ms = 40) => new Promise(res => setTimeout(res, ms));
// the pull's 32 headings (CONTRACT §2, restated) with column Y headed SRRB (§44)
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description', 'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC',
  'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code', 'IPT', 'Spares WBS', 'SRRB', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const NA = 'Not Allocated', EX = 'Actual Execution is allocated', AV = 'Air Vehicle (AV)', PP = 'Propulsion (PP)';
const B = { usaf: 'USAF O&M- Tessa Base Discretionary', stovl: 'USN STOVL O&M Tessa', sp: 'USAF APN Spares Tessa Base Initial' };
const row = (ccar, Title, Budget, pe, Date, Amount, Alloc, PMO, SRRB) => ({ FY: 2027, 'CCaR No': ccar, Title, Budget, 'Plan Event': pe, Date, Amount, Alloc, PMO, SRRB });
// THE PULL, FY2027 (Data through Oct-2026):
//   O&M     C1 Tessa A  "Depot Work"  USAF   Dec 2026  1,000,000  planned  AV  SRRB Yes
//           C2 Tessa B  "Repair"      STOVL  Jan 2027    300,000  planned  PP  SRRB Yes
//           C3 Tessa C  "Field Reps"  USAF   no date     500,000  planned  PP  SRRB Y
//           C4 Tessa D  "Lot"         USAF   Oct 2026    900,000  awarded  AV  SRRB No
//   Spares  C6 Tessa F  "Spares Kit"  USAF   Mar 2027    700,000  planned  PP  SRRB Yes
const OM = [row('C1', 'Tessa A', B.usaf, 'Depot Work', '2026-12-01', '1000000', NA, AV, 'Yes'), row('C2', 'Tessa B', B.stovl, 'Repair', '2027-01-20', '300000', NA, PP, 'Yes'),
  row('C3', 'Tessa C', B.usaf, 'Field Reps', '', '500000', NA, PP, 'Y'), row('C4', 'Tessa D', B.usaf, 'Lot', '2026-10-15', '900000', EX, AV, 'No')];
const SPR = [row('C6', 'Tessa F', B.sp, 'Spares Kit', '2027-03-01', '700000', NA, PP, 'Yes')];
// THE UFR TRACKER, $K: O&M 1 Alpha TS1 AV USAF 100 · 2 Bravo TS2 PP USAF 200 · 3 Charlie TS3 AV STOVL 300 · 4 Delta TS4 PP USAF 400; Spares 1 Echo TS5 AV USAF 50
const K = k => k * 100000;
const tl = (ap, rank, title, pmo, ccar, svc, k, exec, sfcb) => { const c = [0, 0, 0, 0, 0, 0, 0]; c[svc] = K(k);
  return { ap, fy: 2027, sheet: ap === 'om' ? 'O&M' : 'Spares', row: 9 + rank, rank: String(rank), title, pmo, ccar, cents: c, total: K(k), status: 'Unfunded', exec, sfcb }; };
const TRK = { ok: true, fy: 2027, name: 'UFR FY27.xlsx', unit: 1000, tabs: [], notes: [], ignored: [], lines: [
  tl('om', 1, 'Alpha', 'AV', 'TS1', 0, 100, 'Yes', 'Approved'), tl('om', 2, 'Bravo', 'PP', 'TS2', 0, 200, 'No', 'Deferred'), tl('om', 3, 'Charlie', 'AV', 'TS3', 3, 300, '', ''),
  tl('om', 4, 'Delta', 'PP', 'TS4', 0, 400, '', ''), tl('sp', 1, 'Echo', 'AV', 'TS5', 0, 50, '', '')] };
const NOW = '2026-11-09T12:00:00.000Z';
const CUI = 'CUI//REL TO US DoW';
const errs = t => t.errors.filter(e => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click|HTMLCanvasElement)/.test(String(e)));
// a .xlsx's parts, read with Node's own inflate: the header and footer are in the sheet's XML, which the page's reader does not return
function unzip(u8) {
  const b = Buffer.from(u8), out = {};
  let e = b.length - 22; while (e >= 0 && b.readUInt32LE(e) !== 0x06054b50) e--;
  let p = b.readUInt32LE(e + 16);
  for (let i = 0, n = b.readUInt16LE(e + 10); i < n; i++) {
    const meth = b.readUInt16LE(p + 10), csz = b.readUInt32LE(p + 20), nl = b.readUInt16LE(p + 28), xl = b.readUInt16LE(p + 30), cl = b.readUInt16LE(p + 32), off = b.readUInt32LE(p + 42);
    const name = b.slice(p + 46, p + 46 + nl).toString();
    const ds = off + 30 + b.readUInt16LE(off + 26) + b.readUInt16LE(off + 28), data = b.slice(ds, ds + csz);
    out[name] = (meth === 8 ? inflateRawSync(data) : data).toString('utf8');
    p += 46 + nl + xl + cl;
  }
  return out;
}

async function boot(html) {
  const t = loadTool({ html, url: 'http://localhost/apex.html' });
  for (let i = 0; i < 200 && !t.window.document.getElementById('uiMain'); i++) await settle(5);
  const W = t.window, doc = W.document, S = t.SP;
  const got = [];
  S.download = (name, bytes, mime) => { got.push({ name, bytes, mime }); return name; };
  const X = { t, W, doc, S, got, main: () => doc.getElementById('uiMain'),
    async click(el) { el.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); await settle(); },
    async change(el) { el.dispatchEvent(new W.Event('change', { bubbles: true })); await settle(); },
    async view(v) { await X.click(doc.querySelector('#uiNav [data-act=view][data-v="' + v + '"]')); return X.main(); },
    async pick(sel, label) { const el = X.main().querySelector(sel); el.value = [...el.options].find(o => o.textContent === label).value; await X.change(el); },
    btn: kind => X.main().querySelector('button[data-act=listdl][data-l=' + kind + ']'),
    // press the button, wait for the download, read it back with the page's own reader
    async press(kind) {
      const n = got.length; await X.click(X.btn(kind));
      for (let i = 0; i < 300 && got.length === n; i++) await settle(10);
      const d = got[got.length - 1];
      if (!d || got.length === n) return null;
      const wb = await S.readXlsx(d.bytes.buffer.slice(d.bytes.byteOffset, d.bytes.byteOffset + d.bytes.byteLength));
      return { name: d.name, mime: d.mime, bytes: d.bytes, sheets: wb.sheets, rows: wb.sheets[0].rows.map(r => (r || []).map(v => (v === undefined || v === null ? '' : v))) };
    } };
  return X;
}
// a workbook's list: from the row after the header row to the row before the last CUI line
function body(R) { return { head: R.rows[5], data: R.rows.slice(6, R.rows.length - 1) }; }
const M = v => (typeof v === 'number' ? Math.round(v * 1e8) : v);        // $M back to cents
const Kc = v => (typeof v === 'number' ? Math.round(v * 1e5) : v);       // $K back to cents
const cnum = el => (el.hasAttribute('data-c') ? Number(el.getAttribute('data-c')) : el.textContent);

try {
  // the plan is made on one page and saved; the page under test opens that file, so it starts with nothing unsaved
  const A0 = await boot(pageHtml({}));
  A0.S.applyImport(await A0.S.parseFiles([{ name: 'om.csv', data: csv(OM) }, { name: 'sp.csv', data: csv(SPR) }], { now: NOW }));
  A0.S.setSettings({ asOf: '2026-10' });
  A0.S.setUfr(TRK, '2026-11-10T12:00:00.000Z');
  await settle(60);
  const savedFile = A0.S.savedHtml();
  A0.t.close();
  const A = await boot(savedFile);
  const { S, doc } = A;
  await settle(60);
  const state0 = J(S.state);
  C.chk('the saved plan opens with nothing unsaved', !S.isDirty());

  // ============================================================================ Requirements (Find)
  let m = await A.view('find');
  C.chk('Requirements: the button is there, labelled, a real button the keyboard reaches', !!A.btn('find') && A.btn('find').tagName === 'BUTTON' && A.btn('find').getAttribute('type') === 'button'
    && A.btn('find').textContent === 'Download this list (Excel)' && /as shown/.test(A.btn('find').getAttribute('aria-label')) && A.btn('find').tabIndex >= 0);
  await A.pick('select[data-act=findf][data-f=pmo]', PP);
  const findScreen = () => [...A.main().querySelectorAll('#uiFindRes table.findt tbody tr')].map(tr => tr.classList.contains('fgrp') ? [tr.textContent]
    : (() => { const [cc, pm] = tr.querySelector('.fsub').textContent.split(' · '), td = [...tr.querySelectorAll('td')];
      return [tr.querySelector('.tg').textContent, cc, pm, td[0].textContent, cnum(td[1]), cnum(td[2]), cnum(td[3]), td[4].textContent]; })());
  let R = await A.press('find');
  let L = body(R);
  C.eq('Requirements, Propulsion picked: the header row is the screen’s columns, the Requirement cell split into title, CCaR and PMO', J(L.head),
    J(['Requirement', 'CCaR', 'PMO', 'Appropriation', 'Planned ($M)', 'Awarded ($M)', 'Still to award ($M)', 'Projected award']));
  const lines = d => d.slice(0, -1);
  C.eq('… every line is the screen’s, in its order, figures back to the cent', J(lines(L.data).map(r => [r[0], r[1], r[2], r[3], M(r[4]), M(r[5]), M(r[6]), r[7]])), J(findScreen()));
  C.eq('… and as written by hand: Tessa B, C and F, planned $300,000, $500,000, $700,000, nothing awarded', J(lines(L.data).map(r => [r[0], r[1], r[3], M(r[4]), M(r[5]), M(r[6]), r[7]])),
    J([['Tessa B', 'C2', 'O&M FY2027', 30000000, 0, 30000000, 'Jan 2027'], ['Tessa C', 'C3', 'O&M FY2027', 50000000, 0, 50000000, 'No date'],
      ['Tessa F', 'C6', 'Initial Spares FY2027', 70000000, 0, 70000000, 'Mar 2027']]));
  C.eq('… the money is numbers, not text', J(lines(L.data).map(r => [typeof r[4], typeof r[5], typeof r[6]])), J([['number', 'number', 'number'], ['number', 'number', 'number'], ['number', 'number', 'number']]));
  C.eq('… a total row of the lines listed', J([L.data[L.data.length - 1][0], M(L.data[L.data.length - 1][4])]), J(['Total, 3 requirements listed', 150000000]));
  C.eq('… the sheet starts and ends with the CUI marking', J([R.rows[0][0], R.rows[R.rows.length - 1][0]]), J([CUI, CUI]));
  C.chk('… its title, Data through line, the pickers line and the Filter line', /^Requirements/.test(R.rows[1][0]) && /^Data through Oct-2026 \| Downloaded \d{4}-\d{2}-\d{2} \| 3 lines/.test(R.rows[2][0])
    && R.rows[3][0] === 'Picked on the page: PMO: ' + PP && /^Filter: /.test(R.rows[4][0]), J(R.rows.slice(1, 5).map(r => r[0])));
  const parts = unzip(R.bytes), sx = parts['xl/worksheets/sheet1.xml'] || '';
  C.chk('… the sheet’s printed header and footer carry the CUI marking, as the workbook’s do', sx.includes('<oddHeader>&amp;C&amp;"Calibri,Bold"' + CUI + '</oddHeader>') && sx.includes('<oddFooter>&amp;C&amp;"Calibri,Bold"' + CUI + '&amp;RPage &amp;P of &amp;N</oddFooter>'), sx.slice(-600));
  C.chk('… the file name follows the workbook’s pattern, naming the page', /^APEX FY2027 - Requirements list - data through Oct-2026 - \d{4}-\d{2}-\d{2}\.xlsx$/.test(R.name) && R.mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', R.name);
  // the Find box too
  const fq = doc.getElementById('uiFindQ'); fq.value = 'field'; fq.dispatchEvent(new A.W.Event('input', { bubbles: true })); await settle(400);
  R = await A.press('find'); L = body(R);
  C.eq('Requirements, “field” typed as well: the one line, and the pickers line names both', J([lines(L.data).map(r => r[0]), findScreen().map(r => r[0]), R.rows[3][0]]),
    J([['Tessa C'], ['Tessa C'], 'Picked on the page: Find “field” · PMO: ' + PP]));
  fq.value = 'nothing like this'; fq.dispatchEvent(new A.W.Event('input', { bubbles: true })); await settle(400);
  C.chk('Requirements, nothing matches: no button', !A.btn('find') && !!A.main().querySelector('#uiFindRes .none'));
  fq.value = ''; fq.dispatchEvent(new A.W.Event('input', { bubbles: true })); await settle(400);
  // the Filter's service switch: STOVL off
  const stovl = doc.querySelector('input[data-act=svc][data-i="3"]');
  stovl.checked = false; await A.change(stovl); await settle(40);
  m = await A.view('find');
  await A.pick('select[data-act=findf][data-f=pmo]', PP);
  R = await A.press('find'); L = body(R);
  C.eq('Requirements, STOVL switched off in the Filter: Tessa B (STOVL only) is gone, as on screen', J([lines(L.data).map(r => r[0]), findScreen().map(r => r[0])]), J([['Tessa C', 'Tessa F'], ['Tessa C', 'Tessa F']]));
  C.chk('… the Filter line is the page’s own words (STOVL not among the services shown), and the file name says [filtered]', R.rows[4][0] === 'Filter: ' + A.main().querySelector('.ovshown').textContent
    && /^Filter: Services shown: /.test(R.rows[4][0]) && !/STOVL/.test(R.rows[4][0]) && / \[filtered\]\.xlsx$/.test(R.name), J([R.rows[4][0], R.name]));
  { const on = doc.querySelector('input[data-act=svc][data-i="3"]'); on.checked = true; await A.change(on); await settle(40); }
  C.chk('STOVL is switched back on', doc.querySelector('input[data-act=svc][data-i="3"]').checked && J(S.getView().svc).indexOf('false') < 0, J(S.getView()));

  // ============================================================================ My PMO
  m = await A.view('mypmo');
  await A.pick('select[data-act=pmof][data-f=pmo]', AV);
  const pmoScreen = () => [...A.main().querySelectorAll('table.findt tbody tr')].map(tr => { const td = [...tr.querySelectorAll('td')];
    return [tr.querySelector('.tg').textContent, tr.querySelector('.fsub').textContent, td[0].textContent, cnum(td[1]), cnum(td[2]), cnum(td[3]), td[4].textContent]; });
  C.chk('My PMO: the button sits beside the Every requirement heading', !!A.main().querySelector('.dlhead h3.pmoall') && A.main().querySelector('.dlhead').contains(A.btn('pmo')));
  R = await A.press('pmo'); L = body(R);
  C.eq('My PMO, Air Vehicle: the header row', J(L.head), J(['Requirement', 'CCaR', 'Appropriation', 'Planned ($M)', 'Awarded ($M)', 'Still to award ($M)', 'Projected award']));
  C.eq('… every line is the screen’s', J(lines(L.data).map(r => [r[0], r[1], r[2], M(r[3]), M(r[4]), M(r[5]), r[6]])), J(pmoScreen()));
  C.eq('… and by hand: Tessa A planned $1,000,000; Tessa D $900,000, all awarded', J(lines(L.data).map(r => [r[0], M(r[3]), M(r[4]), M(r[5]), r[6]])),
    J([['Tessa A', 100000000, 0, 100000000, 'Dec 2026'], ['Tessa D', 90000000, 90000000, 0, 'Awarded']]));
  C.eq('… its total, and the pickers line names the office and the year', J([L.data[L.data.length - 1][0], M(L.data[L.data.length - 1][3]), M(L.data[L.data.length - 1][4]), R.rows[3][0]]),
    J(['Total, 2 requirements', 190000000, 90000000, 'Picked on the page: PMO: ' + AV + ' · FY: All']));
  C.chk('… the file name', /^APEX FY2027 - My PMO list - data through Oct-2026 - \d{4}-\d{2}-\d{2}\.xlsx$/.test(R.name), R.name);
  await A.pick('select[data-act=pmof][data-f=pmo]', PP);
  R = await A.press('pmo'); L = body(R);
  C.eq('My PMO, Propulsion: Tessa B, C and F, as on screen', J([lines(L.data).map(r => r[0]), pmoScreen().map(r => r[0])]), J([['Tessa B', 'Tessa C', 'Tessa F'], ['Tessa B', 'Tessa C', 'Tessa F']]));

  // ============================================================================ Unfunded
  m = await A.view('ufr');
  C.chk('Unfunded: the button sits beside the list’s heading', !!A.btn('ufr') && A.main().querySelector('.dlhead').contains(A.btn('ufr')));
  await A.pick('select[data-act=ufrf][data-f=pmo]', PP);
  const ufrScreen = () => [...A.main().querySelectorAll('#uiUfrT tbody tr')].filter(tr => !tr.classList.contains('udetail')).map(tr => {
    if (tr.classList.contains('ugrp')) return ['G', tr.querySelector('th').firstChild.textContent.trim()];
    if (tr.classList.contains('usub') || tr.classList.contains('utotal')) return ['T', tr.querySelector('th').textContent].concat([...tr.querySelectorAll('td.n')].map(cnum));
    const ch = [...tr.children], inp = ch[0].querySelector('input'), ns = ch.length - 9;
    return ['L', inp ? inp.value : ch[0].textContent, tr.querySelector('.tg').textContent, ch[2].querySelector('.fsub') ? '' : ch[2].textContent, ch[3].textContent]
      .concat(ch.slice(4, 5 + ns).map(cnum), [ch[5 + ns].textContent, ch[6 + ns].textContent, ch[7 + ns].textContent, cnum(ch[8 + ns])]);
  });
  const ufrBook = L => { const ns = L.head.length - 9;
    return L.data.map(r => r.slice(1).every(v => v === '') ? ['G', r[0]] : r[0] === '' ? ['T', r[1]].concat(r.slice(4, 5 + ns).map(Kc))
      : ['L', String(r[0]), r[1], r[2], r[3]].concat(r.slice(4, 5 + ns).map(Kc), [r[5 + ns], r[6 + ns], r[7 + ns], Kc(r[8 + ns])])); };
  R = await A.press('ufr'); L = body(R);
  const NS = L.head.length - 9;
  C.eq('Unfunded, Propulsion picked: the header row (Rank, Requirement, CCaR Record, PMO, a column a service in $K, then the rest)', J([L.head.slice(0, 4), L.head.slice(4, 4 + NS).every(h => / \(\$K\)$/.test(h)), L.head.slice(4 + NS)]),
    J([['Rank', 'Requirement', 'CCaR Record', 'PMO'], true, ['Total ($K)', 'Funding status', 'Exec ready?', 'SFCB action', 'Approved in plan ($K)']]));
  C.eq('… the service columns are the screen’s', J(L.head.slice(4, 4 + NS).map(h => h.replace(/ \(\$K\)$/, ''))), J([...A.main().querySelectorAll('#uiUfrT thead th')].slice(4, 4 + NS).map(th => th.textContent)));
  C.eq('… each list’s heading is a row of its own', J(R.rows[6]), J(['O&M FY2027']));
  C.eq('… every line, subtotal and total is the screen’s, in its order, figures back to the cent', J(ufrBook(L)), J(ufrScreen()));
  C.eq('… and by hand: Bravo rank 2 and Delta rank 4, USAF $200K and $400K', J(L.data.filter(r => typeof r[0] === 'number').map(r => [r[0], r[1], r[2], r[3], Kc(r[4]), Kc(r[4 + NS]), r[5 + NS], r[8 + NS]])),
    J([[2, 'Bravo', 'TS2', PP, 20000000, 20000000, 'Unfunded', 'Unfunded only'], [4, 'Delta', 'TS4', PP, 40000000, 40000000, 'Unfunded', 'Unfunded only']]));
  const sub = L.data.find(r => /^Subtotal/.test(r[1])), tot = L.data[L.data.length - 1];
  C.eq('… the subtotal (of the lines shown) and the total, $600K', J([sub[1], Kc(sub[4]), Kc(sub[4 + NS]), tot[1], Kc(tot[4 + NS])]), J(['Subtotal, O&M FY2027 (the lines shown)', 60000000, 60000000, 'Total unfunded', 60000000]));
  C.eq('… the amounts and the rank are numbers', J([typeof sub[4], typeof L.data.find(r => r[1] === 'Bravo')[0], typeof L.data.find(r => r[1] === 'Bravo')[4]]), J(['number', 'number', 'number']));
  C.eq('… the pickers line and the file name', J([R.rows[3][0], /^APEX FY2027 - Unfunded list - data through Oct-2026 - \d{4}-\d{2}-\d{2}\.xlsx$/.test(R.name)]), J(['Picked on the page: PMO: ' + PP, true]));
  await A.click(A.main().querySelector('[data-act=ufrclear]'));
  await A.click([...A.main().querySelectorAll('button[data-act=ufrap]')].find(b => b.textContent === 'Initial Spares'));
  R = await A.press('ufr'); L = body(R);
  C.eq('Unfunded, Initial Spares pressed: Echo alone, and the pickers line names the appropriation', J([lines(L.data).filter(r => typeof r[0] === 'number').map(r => r[1]), R.rows[3][0]]),
    J([['Echo'], 'Picked on the page: Appropriation: Initial Spares']));
  const uq = doc.getElementById('uiUfrQ'); uq.value = 'zzz-none'; uq.dispatchEvent(new A.W.Event('input', { bubbles: true })); await settle(400);
  C.chk('Unfunded, nothing matches: no button', !A.btn('ufr') && !!A.main().querySelector('#uiUfrNone'));
  uq.value = ''; uq.dispatchEvent(new A.W.Event('input', { bubbles: true })); await settle(400);
  await A.click(A.main().querySelector('[data-act=ufrclear]'));

  // ============================================================================ SRRB
  m = await A.view('srrb');
  await A.pick('select[data-act=srrbf][data-f=ap]', 'O&M');
  const srrbScreen = () => [...A.main().querySelectorAll('#uiSrrbT tbody tr')].map(tr => {
    if (tr.classList.contains('ugrp')) return ['G', tr.textContent];
    if (tr.classList.contains('band')) return ['T', tr.querySelector('th').textContent].concat([...tr.querySelectorAll('td.n')].map(cnum));
    const td = [...tr.children];
    return ['L', tr.querySelector('.tg').textContent, td[0].querySelectorAll('.fsub')[0].textContent, [...td[1].querySelectorAll('.srrbp')].map(x => x.textContent).join(', '), td[2].textContent].concat([...tr.querySelectorAll('td.n')].map(cnum), ['Yes']);
  });
  R = await A.press('srrb'); L = body(R);
  const nsv = L.head.length - 7;
  C.eq('SRRB, O&M picked: the header row', J(L.head.slice(0, 4).concat(L.head.slice(-3))), J(['Requirement (Plan Event Title)', 'CCaR records', 'PMO', 'Award date', 'Total ($M)', 'SRRB', 'Not counted: rows not marked Yes ($M)']));
  const srrbBook = L.data.map(r => r.slice(1).every(v => v === '') ? ['G', r[0]] : r[0] === 'Total' ? ['T', 'Total'].concat(r.slice(4, 4 + nsv + 1).map(M))
    : ['L', r[0], r[1], r[2], r[3]].concat(r.slice(4, 4 + nsv + 1).map(M), [r[4 + nsv + 1]]));
  C.eq('… every line and the total is the screen’s, in its order, figures back to the cent', J(srrbBook), J(srrbScreen()));
  C.eq('… and by hand: Depot Work $1,000,000 USAF (AV, Dec-2026); Repair $300,000 STOVL; Field Reps $500,000, no date', J(lines(L.data).filter(r => r[5 + nsv] === 'Yes').map(r => [r[0], r[1], r[2], r[3], M(r[4 + nsv])])),
    J([['Depot Work', 'C1', AV, 'Dec-2026', 100000000], ['Field Reps', 'C3', PP, 'No date', 50000000], ['Repair', 'C2', PP, 'Jan-2027', 30000000]]));
  C.eq('… the total is $1,800,000, and a number', J([M(L.data[L.data.length - 1][4 + nsv]), typeof L.data[L.data.length - 1][4 + nsv]]), J([180000000, 'number']));
  C.eq('… the pickers line and the file name', J([R.rows[3][0], /^APEX FY2027 - SRRB list - data through Oct-2026/.test(R.name)]), J(['Picked on the page: Appropriation: O&M', true]));

  // ============================================================================ nothing changed, and the button is not printed
  C.chk('four pages downloaded, and nothing in the saved plan changed: not a figure, not a pick, not unsaved', J(S.state) === state0 && !S.isDirty(), (() => { const a = J(S.state), b = state0; let i = 0; while (i < a.length && a[i] === b[i]) i++; return a.slice(i - 80, i + 80) + ' | ' + b.slice(i - 80, i + 80) + ' dirty ' + S.isDirty(); })());
  const css = [...doc.querySelectorAll('style')].map(s => s.textContent).join('\n');
  C.chk('the button is hidden in print', /@media print\{\.dlrow,\.dlbtn\{display:none!important\}\}/.test(css));
  C.eq('no script error on the page', J(errs(A.t)), '[]');

  // ============================================================================ a view-only copy: readers are the main audience
  const vohtml = S.viewOnlyHtml('2026-11-12T13:00:00.000Z');
  A.t.close();
  const V = await boot(vohtml);
  const vstate = J(V.S.state);
  C.chk('a view-only copy is one', V.S.isViewOnly());
  await V.view('ufr');
  await V.pick('select[data-act=ufrf][data-f=pmo]', AV);
  C.chk('view-only: the Unfunded button is there', !!V.btn('ufr'));
  R = await V.press('ufr'); L = body(R);
  C.eq('view-only, Unfunded, Air Vehicle picked: Alpha, Charlie (O&M) and Echo (Spares), with the CUI marking', J([lines(L.data).filter(r => typeof r[0] === 'number').map(r => r[1]), R.rows[0][0], R.rows[R.rows.length - 1][0]]),
    J([['Alpha', 'Charlie', 'Echo'], CUI, CUI]));
  await V.view('srrb');
  await V.pick('select[data-act=srrbf][data-f=pmo]', PP);
  R = await V.press('srrb'); L = body(R);
  C.eq('view-only, SRRB, Propulsion: Field Reps, Repair, Spares Kit', J(lines(L.data).filter(r => r[L.head.length - 2] === 'Yes').map(r => r[0])), J(['Field Reps', 'Repair', 'Spares Kit']));
  await V.view('find');
  R = await V.press('find');
  C.eq('view-only, Requirements: all five', J(body(R).data.slice(0, -1).map(r => r[0])), J(['Tessa A', 'Tessa B', 'Tessa C', 'Tessa D', 'Tessa F']));
  await V.view('mypmo');
  R = await V.press('pmo');
  C.chk('view-only, My PMO: a sheet with its lines', !!R && body(R).data.length >= 2);
  C.chk('view-only: nothing in the copy’s plan changed', J(V.S.state) === vstate);
  C.eq('no script error in the view-only copy', J(errs(V.t)), '[]');
  V.t.close();

  // ============================================================================ the pure layout, and an empty list
  const T = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine', 'publish', 'xlsx-write', 'export'] });
  let threw = '';
  try { T.SP.listSpec({ cols: [], rows: [] }); } catch (e) { threw = e.message; }
  C.eq('SP.listSpec refuses a list with no columns', threw, 'There is no list to write.');
  const sp = T.SP.listSpec({ page: 'Unfunded', title: 'x', asOfLabel: 'Oct-2026', today: '2026-11-22', picks: '', shown: 'Everything shown', cols: [{ h: 'A', t: 's' }, { h: 'B', t: 'k' }], rows: [{ k: 'line', c: ['a', 123456] }] });
  C.eq('one sheet, the workbook’s CUI header and footer, frozen under its header', J([sp.sheets.length, sp.sheets[0].header, sp.sheets[0].footer, sp.sheets[0].freeze]),
    J([1, '&C&"Calibri,Bold"' + CUI, '&C&"Calibri,Bold"' + CUI + '&RPage &P of &N', 'A7']));
  C.eq('a $K cell is the number in thousands, formatted as whole thousands', J(sp.sheets[0].rows[6].cells[1]), J({ v: 1.23456, s: { font: { sz: 10, color: '1A1A1A' }, fmt: '#,##0;(#,##0);-', align: { h: 'right', v: 'center' }, border: { t: ['thin', '808080'], b: ['thin', '808080'], l: ['thin', '808080'], r: ['thin', '808080'] } } }));
  C.eq('with nothing picked, the pickers line says so', sp.sheets[0].rows[3].cells[0].v, 'Picked on the page: nothing (the whole list)');
  T.close();
} catch (err) {
  console.error(err);
  C.chk('the test ran to its end', false, (err && err.message) || String(err));
}
C.done();
