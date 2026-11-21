// Your order and full screen (CONTRACT §46). Each person may move the PMOs of a spend plan table and the record titles under
// a PMO into an order of their own, kept in this browser (never in the file); plan events and CCaRs do not move; no figure
// moves. A Full screen button sits in the header where the browser has full screen. Invented data.
//
//   node apex/test/your-order.test.mjs
process.env.TZ = 'America/New_York';
import { loadTool, pageHtml, checks } from './harness.mjs';

const C = checks('your-order');
const J = x => JSON.stringify(x);
const settle = (ms = 30) => new Promise(res => setTimeout(res, ms));
try {
  const t = loadTool({ html: pageHtml({}), url: 'http://localhost/apex.html' });
  const W = t.window, doc = W.document, SP = t.SP;
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  const H = SP.RAW_HEADERS, row = (cc, title, pe, amt, pmo) => ({ FY: 2027, 'CCaR No': cc, Title: title, Budget: 'USAF O&M- Tessa Base Discretionary', 'Plan Event': pe, Date: '2026-12-01', Amount: amt, Alloc: 'Not Allocated', PMO: pmo });
  // Air Vehicle: three titles, largest first A (900), B (500), C (200); C has two plan events. Propulsion: one title.
  const ROWS = [row('T1', 'Tessa A', 'E1', '900000', 'Air Vehicle (AV)'), row('T2', 'Tessa B', 'E2', '500000', 'Air Vehicle (AV)'),
    row('T3', 'Tessa C', 'E3', '150000', 'Air Vehicle (AV)'), row('T3', 'Tessa C', 'E4', '50000', 'Air Vehicle (AV)'), row('T4', 'Tessa D', 'E5', '400000', 'Propulsion (PP)'),
    row('T5', 'Tessa E', 'E6', '100000', 'Combat Data Systems (CDS)'), row('T6', 'Tessa B', 'E7', '30000', 'Propulsion (PP)')];   // a second "Tessa B", under Propulsion
  const csv = [H.join(',')].concat(ROWS.map(o => H.map(h => (o[h] === undefined ? '' : o[h])).join(','))).join('\n');
  SP.applyImport(await SP.parseFiles([{ name: 'om.csv', data: csv }], { now: '2026-11-09T12:00:00.000Z' }));
  SP.setSettings({ asOf: '2026-10' });
  await settle(60);
  const main = () => doc.getElementById('uiMain');
  const click = async el => { el.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); await settle(60); };
  const change = async (el, v) => { el.value = v; el.dispatchEvent(new W.Event('change', { bubbles: true })); await settle(60); };
  const sec = () => main().querySelector('section.blk-sec');
  const labs = lv => [...sec().querySelectorAll('tbody tr.lv' + lv + ' > th')].map(th => (th.querySelector('.tg, .leaf') || th).textContent.replace(/^[▸▾]/, ''));
  const figs = () => [...sec().querySelectorAll('tbody tr')].filter(r => /lv1|band/.test(r.className)).map(r => [...r.querySelectorAll('td')].map(td => td.textContent).join('|')).sort();
  const nm = r => (r.querySelector('th .tg, th .leaf') || r).textContent.replace(/^[▸▾]/, '');
  // the row of a PMO, or of a title under a named PMO (default Air Vehicle)
  const labRow = (lv, name, pmo = 'Air Vehicle (AV)') => { let under = null;
    for (const r of sec().querySelectorAll('tbody tr')) { if (r.classList.contains('lv1')) under = nm(r); if (r.classList.contains('lv' + lv) && nm(r) === name && (lv === 1 || under === pmo)) return r; } return null; };
  const drag = async (from, onto, after) => {
    const ev = (el, type, y) => { const e = new W.Event(type, { bubbles: true, cancelable: true }); Object.defineProperty(e, 'clientY', { value: y }); el.dispatchEvent(e); return e; };
    from.querySelector('th.lab').dispatchEvent(new W.MouseEvent('mousedown', { bubbles: true }));
    ev(from, 'dragstart', 0); ev(onto.querySelector('td'), 'dragover', after ? 1 : -1); ev(onto.querySelector('td'), 'drop', after ? 1 : -1); ev(from, 'dragend', 0);
    await settle(60);
  };

  await click(doc.querySelector('#uiNav [data-v=om]'));
  C.eq('standard order: PMOs as listed, AV’s titles largest first', J([labs(1), labs(2)]), J([['Air Vehicle (AV)', 'Combat Data Systems (CDS)', 'Propulsion (PP)'], ['Tessa A', 'Tessa B', 'Tessa C', 'Tessa E', 'Tessa D', 'Tessa B']]));
  C.chk('no place boxes, arrows or Change order button: dragging is the only way', !sec().querySelector('input[type=number], button[data-act^=ord]:not([data-act=ordreset])') && !/Change order/.test(sec().textContent));
  const before = figs();
  C.chk('every PMO and every title beside another is draggable by its label (a grip is drawn); a plan event is not', sec().querySelectorAll('tr.lv1.mv').length === 3
    && sec().querySelectorAll('tr.lv2.mv').length === 5 && sec().querySelectorAll('tr.lv3.mv, tr.lv4.mv').length === 0);
  C.chk('a title alone under its PMO cannot move (nothing to move it past)', !labRow(2, 'Tessa E', 'Combat Data Systems (CDS)').classList.contains('mv'));
  // a drag, as the browser sends it: the mouse held on the label, dragstart, dragover a sibling, drop
  await drag(labRow(1, 'Propulsion (PP)'), labRow(1, 'Air Vehicle (AV)'), false);
  C.eq('Propulsion dragged onto the top half of Air Vehicle goes before it', J(labs(1)), J(['Propulsion (PP)', 'Air Vehicle (AV)', 'Combat Data Systems (CDS)']));
  await drag(labRow(2, 'Tessa C'), labRow(2, 'Tessa A'), false);
  C.eq('Tessa C dragged before Tessa A stands first under Air Vehicle', J(labs(2)), J(['Tessa D', 'Tessa B', 'Tessa C', 'Tessa A', 'Tessa B', 'Tessa E']));
  await drag(labRow(2, 'Tessa A'), labRow(2, 'Tessa B'), true);
  C.eq('Tessa A dragged onto the bottom half of Tessa B goes after it', J(labs(2)), J(['Tessa D', 'Tessa B', 'Tessa C', 'Tessa B', 'Tessa A', 'Tessa E']));
  await drag(labRow(2, 'Tessa B'), labRow(1, 'Propulsion (PP)'), false);
  await drag(labRow(2, 'Tessa B'), labRow(2, 'Tessa B', 'Propulsion (PP)'), false);
  await drag(labRow(2, 'Tessa A'), labRow(2, 'Tessa B', 'Propulsion (PP)'), false);
  C.eq('a title dropped on a PMO, or on another PMO’s title (even one of the same name), does not move', J(labs(2)), J(['Tessa D', 'Tessa B', 'Tessa C', 'Tessa B', 'Tessa A', 'Tessa E']));
  // from the keyboard: Alt with an arrow on the label
  const key = async (el, k) => { el.dispatchEvent(new W.KeyboardEvent('keydown', { key: k, altKey: true, bubbles: true })); await settle(60); };
  await key(labRow(2, 'Tessa A').querySelector('.tg'), 'ArrowUp');
  C.eq('Alt with the up arrow on Tessa A’s label moves it up one place', J(labs(2)), J(['Tessa D', 'Tessa B', 'Tessa C', 'Tessa A', 'Tessa B', 'Tessa E']));
  C.eq('no figure moved: every PMO row and every total row has the same cells', J(figs()), J(before));
  // the plan events stay largest first under the moved title
  await change(sec().querySelector('select[data-act=lvl]'), '3');
  C.eq('Tessa C’s plan events stay in the standard order (largest first)', J(labs(3).slice(labs(3).indexOf('E3'), labs(3).indexOf('E3') + 2)), J(['E3', 'E4']));
  C.eq('kept in this browser: Propulsion first for O&M FY2027', J(JSON.parse(W.localStorage.getItem('sfcbsp.order')).pmo['om|2027'][0]), J(SP.normKey('Propulsion (PP)')));
  C.chk('the saved plan holds no order', !/"order"|sfcbsp\.order/.test(JSON.stringify(SP.state)));
  // the PMO page shows Air Vehicle's titles in the same order
  await click(doc.querySelector('#uiNav [data-v=pmos]'));
  C.eq('By PMO: Air Vehicle’s titles stand in your order too', J(labs(2)), J(['Tessa C', 'Tessa A', 'Tessa B']));
  C.chk('By PMO: the titles drag, the one PMO does not', sec().querySelectorAll('tr.lv2.mv').length === 3 && sec().querySelectorAll('tr.lv1.mv').length === 0);
  // a reload in the same browser keeps it
  const store = W.localStorage.getItem('sfcbsp.order');
  t.close();
  const t2 = loadTool({ html: pageHtml({}), url: 'http://localhost/apex.html' }), W2 = t2.window, d2 = W2.document, S2 = t2.SP;
  for (let i = 0; i < 200 && !d2.getElementById('uiMain'); i++) await settle(5);
  W2.localStorage.setItem('sfcbsp.order', store);
  S2.applyImport(await S2.parseFiles([{ name: 'om.csv', data: csv }], { now: '2026-11-09T12:00:00.000Z' })); S2.setSettings({ asOf: '2026-10' }); await settle(60);
  d2.querySelector('#uiNav [data-v=om]').dispatchEvent(new W2.MouseEvent('click', { bubbles: true })); await settle(60);
  const s2 = d2.querySelector('#uiMain section.blk-sec');
  const l2 = lv => [...s2.querySelectorAll('tbody tr.lv' + lv + ' > th')].map(th => (th.querySelector('.tg, .leaf') || th).textContent.replace(/^[▸▾]/, ''));
  C.eq('another page in the same browser opens in your order, and says so', J([l2(1), !!s2.querySelector('.ordmine')]), J([['Propulsion (PP)', 'Air Vehicle (AV)', 'Combat Data Systems (CDS)'], true]));
  s2.querySelector('button[data-act=ordreset]').dispatchEvent(new W2.MouseEvent('click', { bubbles: true })); await settle(60);
  const s3 = d2.querySelector('#uiMain section.blk-sec');
  C.eq('Standard order puts the table back and the button goes', J([[...s3.querySelectorAll('tbody tr.lv1 > th')].map(th => th.textContent.replace(/^[▸▾]/, '')), !!s3.querySelector('button[data-act=ordreset]')]),
    J([['Air Vehicle (AV)', 'Combat Data Systems (CDS)', 'Propulsion (PP)'], false]));
  // full screen: hidden where the browser has none (jsdom), shown and working where it has
  C.chk('Full screen is hidden where the browser has no full screen', d2.getElementById('uiFs').hidden === true);
  t2.close();
  const t3 = loadTool({ html: pageHtml({}), url: 'http://localhost/apex.html' }), W3 = t3.window, d3 = W3.document;
  let asked = 0, left = 0;
  Object.defineProperty(d3, 'fullscreenEnabled', { configurable: true, get: () => true });
  let fsEl = null;
  Object.defineProperty(d3, 'fullscreenElement', { configurable: true, get: () => fsEl });
  d3.documentElement.requestFullscreen = () => { asked++; fsEl = d3.documentElement; d3.dispatchEvent(new W3.Event('fullscreenchange')); return Promise.resolve(); };
  d3.exitFullscreen = () => { left++; fsEl = null; d3.dispatchEvent(new W3.Event('fullscreenchange')); return Promise.resolve(); };
  W3.localStorage.setItem('sfcbsp.order', '{"pmo":{"om|2027":"x"},"title":[1]}');
  for (let i = 0; i < 200 && !d3.getElementById('uiMain'); i++) await settle(5);
  t3.SP.applyImport(await t3.SP.parseFiles([{ name: 'om.csv', data: csv }], { now: '2026-11-09T12:00:00.000Z' })); await settle(60);
  d3.querySelector('#uiNav [data-v=om]').dispatchEvent(new W3.MouseEvent('click', { bubbles: true })); await settle(60);
  C.eq('an order store that is not an order is read as none: the standard order, nothing thrown', J([...d3.querySelectorAll('#uiMain section.blk-sec tbody tr.lv1 > th')].map(th => th.textContent.replace(/^[▸▾]/, ''))),
    J(['Air Vehicle (AV)', 'Combat Data Systems (CDS)', 'Propulsion (PP)']));
  const fb = () => d3.getElementById('uiFs');
  C.eq('Full screen shows in the header, beside Help', J([fb().hidden, fb().textContent, fb().nextElementSibling.id]), J([false, 'Full screen', 'uiHelp']));
  fb().dispatchEvent(new W3.MouseEvent('click', { bubbles: true })); await settle(30);
  C.eq('pressed, it asks the browser for full screen and becomes Exit full screen', J([asked, fb().textContent, fb().getAttribute('aria-pressed')]), J([1, 'Exit full screen', 'true']));
  fb().dispatchEvent(new W3.MouseEvent('click', { bubbles: true })); await settle(30);
  C.eq('pressed again, it leaves full screen', J([left, fb().textContent]), J([1, 'Full screen']));
  C.eq('no script error on the page', J(t3.errors.filter(x => !/^Not implemented/.test(String(x)))), '[]');
  t3.close();
  // printing (Ctrl+P): no open/close arrows, no drag grip, no order buttons
  { const css = (await import('node:fs')).readFileSync(new URL('../src/style.css', import.meta.url), 'utf8'), pr = (css.match(/@media print\{[^@]*/g) || []).join(' ');
    C.chk('printing hides the open/close arrows, the drag grip and the order buttons', /tr\.mv > th\.lab::before\{content:none\}/.test(pr) && /\.tg \.arr\{display:none\}/.test(pr) && /\.ordbtn,\.ordmine\{display:none\}/.test(pr)); }
} catch (err) {
  console.error(err);
  C.chk('the test ran to its end', false, (err && err.message) || String(err));
}
C.done();
