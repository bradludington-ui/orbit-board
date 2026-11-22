// On a phone (CONTRACT §38): the same page at 640 px and narrower. The menu is folded behind one Menu button that names the
// view on screen, the top bar scrolls away, nothing scrolls the page sideways, and a wide table keeps its first column.
// A wider window is as it was. Invented data throughout; the layout is measured in Chromium, which is the only place a
// layout exists.
//
//   node apex/test/phone.test.mjs
process.env.TZ = 'America/New_York';
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CHROME } from '../../tools/chrome.mjs';
import { loadTool, pageHtml, scratchDir, checks } from './harness.mjs';

const C = checks('phone');
const J = x => JSON.stringify(x);
const settle = (ms = 20) => new Promise(res => setTimeout(res, ms));
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
// a plan wide and long enough to need a phone layout: 3 PMOs, 6 services, 12 months, 2 fiscal years
const SV = ['USAF O&M- Tessa Base Discretionary', 'USAF ANG O&M Tessa', 'USAF AFRC O&M Tessa', 'USN STOVL O&M Tessa', 'USN USMC CV O&M Tessa', 'USN CV O&M Tessa'];
const PMOS = ['Air Vehicle (AV)', 'Propulsion (PP)', 'Combat Data Systems (CDS)'];
const ROWS = [];
for (const fy of [2026, 2027]) for (let i = 0; i < 12; i++) for (let s = 0; s < 6; s++) {
  const m = 1 + ((i * 5 + s * 3) % 12), yy = fy - (m >= 10 ? 1 : 0);
  ROWS.push({ FY: fy, 'CCaR No': 'TS' + (1000 + i), Title: 'Invented requirement number ' + i, Budget: SV[s], 'Plan Event': 'PE ' + i + '-' + s,
    Date: yy + '-' + String(m).padStart(2, '0') + '-' + String(1 + ((i + s) % 27)).padStart(2, '0'), Amount: String(100000 * (1 + i) + 1000 * s),
    Alloc: (i + s) % 3 === 0 ? 'Actual Execution is allocated' : 'Not Allocated', PMO: PMOS[i % 3] });
}
const line = (rank, title, pmo, ccar, c) => ({ ap: 'om', fy: 2027, sheet: 'O&M', row: 10 + rank, rank: String(rank), title, pmo, ccar, cents: c.concat([0]), total: c.reduce((a, b) => a + b, 0), status: 'Unfunded', exec: 'Yes', sfcb: '' });
const UFR = { ok: true, fy: 2027, name: 'UFR FY2027.xlsx', unit: 1000, tabs: [], notes: [], ignored: [], lines: [
  line(1, 'Invented requirement number 3', 'AV', 'TS1003', [5e7, 1e7, 0, 2e7, 0, 1e7]), line(2, 'A new unfunded thing', 'PP', 'TS9999', [7e7, 0, 0, 0, 0, 0])] };

let browser = null, scratch = null;
try {
  // ---- in jsdom: the Menu button is part of the page and follows the view
  const t = loadTool({ html: pageHtml({}) });
  const W = t.window, doc = W.document, SP = t.SP;
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  const btn = () => doc.getElementById('uiNavBtn');
  C.chk('with no data there is no menu and no Menu button', !!btn() && btn().hidden === true);
  SP.applyImport(await SP.parseFiles([{ name: 'om.csv', data: csv(ROWS) }], { now: '2026-11-09T12:00:00.000Z' }));
  SP.setSettings({ asOf: '2026-10' });
  await settle(60);
  const click = el => { el.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); return settle(40); };
  const shown = () => [btn().hidden, btn().getAttribute('aria-expanded'), btn().querySelector('.nbv').textContent, doc.getElementById('uiShell').classList.contains('navopen')];
  const cur = () => doc.querySelector('#uiNav button[aria-pressed=true]').textContent;
  C.eq('with data the button is there, folded, and names the view on screen', J(shown()), J([false, 'false', cur(), false]));
  C.eq('it says which menu it opens', btn().getAttribute('aria-controls'), 'uiNav');
  await click(btn());
  C.eq('pressed, the menu is open', J(shown().slice(1)), J(['true', cur(), true]));
  await click(btn());
  C.eq('pressed again, it is folded', J(shown().slice(1)), J(['false', cur(), false]));
  await click(btn());
  await click(doc.querySelector('#uiNav button[data-v=cal]'));
  C.eq('a view chosen from the open menu folds it, and the button names the new view', J([shown().slice(1), cur()]), J([['false', 'Calendar', false], 'Calendar']));
  for (const [id, label] of [['om', 'O&M'], ['ufr', 'Unfunded'], ['publish', 'Spend plan PDFs'], ['settings', 'Settings']]) {
    const b = doc.querySelector('#uiNav button[data-v=' + id + ']');
    if (!b) { C.chk('the menu has ' + label, false); continue; }
    await click(b);
    C.eq('the button names ' + label, btn().querySelector('.nbv').textContent, label);
  }
  C.chk('whether the menu is open is not part of the plan: nothing is unsaved by it', (() => { const before = J(SP.state); btn().dispatchEvent(new W.MouseEvent('click', { bubbles: true })); return J(SP.state) === before; })());
  C.eq('no script error on the page', J(t.errors.filter(x => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click)/.test(String(x)))), '[]');
  t.close();

  // ---- in Chromium: the layout itself
  scratch = scratchDir('apex-phone-');
  const file = join(scratch.dir, 'apex.html');
  writeFileSync(file, pageHtml({}));
  browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const open = async (viewport, mobile) => {
    const cx = await browser.newContext(mobile ? { viewport, isMobile: true, hasTouch: true } : { viewport });
    const p = await cx.newPage(), errs = [];
    p.on('pageerror', e => errs.push(String(e)));
    await p.goto(pathToFileURL(file).href);
    await p.waitForSelector('#uiMain');
    await p.evaluate(async ([text, ufr]) => { SP.applyImport(await SP.parseFiles([{ name: 'om.csv', data: text }], { now: '2026-11-09T12:00:00.000Z' })); SP.setSettings({ asOf: '2026-10' }); SP.setUfr(ufr, '2026-11-10T12:00:00.000Z'); }, [csv(ROWS), UFR]);
    await p.waitForSelector('#uiNav button[data-v=om]', { state: 'attached' });
    await p.evaluate(() => { const m = document.querySelector('[data-act=manage][aria-expanded=true]'); if (m) m.click(); const x = document.getElementById('uiMsgX'); if (x && !x.hidden) x.click(); });
    await p.waitForTimeout(150);
    return { p, errs, cx };
  };
  const measure = p => p.evaluate(() => {
    const de = document.documentElement, cs = e => getComputedStyle(e), R = e => e.getBoundingClientRect();
    const btn = document.getElementById('uiNavBtn'), nav = document.getElementById('uiNav'), top = document.getElementById('uiTop') || document.querySelector('header.top');
    const small = [...document.querySelectorAll('#uiMain button, #uiMain select, .filtbtn, #uiNavBtn')].filter(e => { const r = R(e); return r.width > 0 && r.height > 0 && r.height < 29.5; }).map(e => e.tagName + '.' + e.className + ' ' + Math.round(R(e).height));
    return { sx: de.scrollWidth - de.clientWidth, btn: cs(btn).display !== 'none', btnH: Math.round(R(btn).height), nav: cs(nav).display !== 'none', topPos: cs(top).position,
      mainTop: Math.round(R(document.getElementById('uiMain')).top + scrollY), small: small.slice(0, 5), topH: de.style.getPropertyValue('--topH') };
  });
  const VIEWS = ['find', 'mypmo', 'cal', 'charts', 'pmos', 'om', 'ufr', 'overview', 'summary', 'slides', 'publish', 'na', 'report', 'settings'];

  // a phone
  for (const width of [390, 360]) {
    const { p, errs, cx } = await open({ width, height: 800 }, true);
    const ids = await p.evaluate(() => [...document.querySelectorAll('#uiNav button[data-v]')].map(b => b.getAttribute('data-v')));
    C.chk('at ' + width + ' px: every view named in this test is in the menu', VIEWS.every(v => ids.includes(v)), J(VIEWS.filter(v => !ids.includes(v))));
    let m = await measure(p);
    C.eq('at ' + width + ' px: the Menu button shows, the menu is folded, the top bar is not pinned', J([m.btn, m.nav, m.topPos]), J([true, false, 'static']));
    C.chk('at ' + width + ' px: the Menu button is a finger high', m.btnH >= 44, m.btnH);
    C.chk('at ' + width + ' px: the view starts within 300 px of the top (it was 400 with the menu open)', m.mainTop <= 300, m.mainTop);
    C.eq('at ' + width + ' px: what is pinned is the CUI line and the Menu button, and headings stick under exactly that', m.topH, (20 + m.btnH) + 'px');
    const bad = [], tiny = []; let after = null;
    for (const id of ids) {
      await p.tap('#uiNavBtn'); await p.waitForTimeout(60);
      const openNow = await p.evaluate(() => getComputedStyle(document.getElementById('uiNav')).display !== 'none');
      if (!openNow) bad.push(id + ': the menu did not open');
      await p.tap('#uiNav button[data-v="' + id + '"]'); await p.waitForTimeout(220);
      m = await measure(p);
      if (m.sx > 1) bad.push(id + ': the page scrolls ' + m.sx + ' px sideways');
      if (m.nav) bad.push(id + ': the menu stayed open');
      if (m.small.length) tiny.push(id + ': ' + m.small.join(', '));
    }
    C.eq('at ' + width + ' px: on every view the menu opens, folds once a view is chosen, and the page does not scroll sideways', J(bad), '[]');
    C.eq('at ' + width + ' px: nothing pressed in a view is under 30 px high', J(tiny), '[]');
    // tiles two to a row
    await p.tap('#uiNavBtn'); await p.tap('#uiNav button[data-v=overview]'); await p.waitForTimeout(200);
    C.eq('at ' + width + ' px: the Overview’s tiles are two to a row', await p.evaluate(() => { const t = [...document.querySelectorAll('#uiMain .tiles .tile')].slice(0, 4).map(e => Math.round(e.getBoundingClientRect().top)); return [t[0] === t[1], t[2] === t[3], t[2] > t[0]]; }).then(J), J([true, true, true]));
    // a wide table scrolled sideways keeps its first column, with nothing showing through it
    await p.tap('#uiNavBtn'); await p.tap('#uiNav button[data-v=om]'); await p.waitForTimeout(250);
    const pin = await p.evaluate(() => { const tw = document.querySelector('#uiMain .tw.treew'), row = tw.querySelector('tbody tr[class*="lv"] th.lab'); const x0 = row.getBoundingClientRect().left; tw.scrollLeft = 200;
      const x1 = row.getBoundingClientRect().left, clear = [...tw.querySelectorAll('th.lab')].filter(c => getComputedStyle(c).backgroundColor === 'rgba(0, 0, 0, 0)').length; return { scrolled: tw.scrollLeft, moved: Math.round(x1 - x0), clear }; });
    C.chk('at ' + width + ' px: the spend plan scrolled sideways keeps its first column in place, filled', pin.scrolled > 100 && Math.abs(pin.moved) <= 1 && pin.clear === 0, J(pin));
    await p.tap('#uiNavBtn'); await p.tap('#uiNav button[data-v=cal]'); await p.waitForTimeout(250);
    const cal = await p.evaluate(() => { const tw = document.querySelector('.calcard .tw'), lab = tw.querySelector('tbody tr[data-rk] th.lab, tbody tr[data-sp] th.lab'), g = tw.querySelector('tr.calg .calgl'); const a = lab.getBoundingClientRect().left, ga = g.getBoundingClientRect().left; tw.scrollLeft = 250;
      return { scrolled: tw.scrollLeft, lab: Math.round(lab.getBoundingClientRect().left - a), grp: Math.round(g.getBoundingClientRect().left - ga) }; });
    C.chk('at ' + width + ' px: the calendar scrolled sideways keeps the requirement and the PMO heading in place', cal.scrolled > 100 && cal.lab === 0 && Math.abs(cal.grp) <= 8, J(cal));
    // a change of view leaves a reader who has scrolled past the top bar at the Menu button, not back at the top bar
    await p.evaluate(() => scrollTo(0, 700)); await p.waitForTimeout(80);
    await p.tap('#uiNavBtn'); await p.tap('#uiNav button[data-v=om]'); await p.waitForTimeout(300);
    C.chk('at ' + width + ' px: after a change of view the Menu button is under the CUI line and the top bar is off screen', (await p.evaluate(() => { const b = document.getElementById('uiNavBtn').getBoundingClientRect().top; return [b >= 19 && b <= 21 && scrollY > 0, Math.round(b), Math.round(scrollY)]; }).then(x => (after = x, x[0]))), J(after));
    C.eq('at ' + width + ' px: no script error', J(errs), '[]');
    await cx.close();
  }

  // a wider window is as it was
  for (const width of [641, 1366]) {
    const { p, errs, cx } = await open({ width, height: 900 }, false);
    const m = await measure(p);
    C.eq('at ' + width + ' px: no Menu button, the menu is on the page, the top bar is pinned', J([m.btn, m.nav, m.topPos]), J([false, true, 'sticky']));
    C.eq('at ' + width + ' px: no script error', J(errs), '[]');
    await cx.close();
  }
} catch (err) {
  console.error(err);
  C.chk('the test ran to its end', false, (err && err.message) || String(err));
}
if (browser) await browser.close();
if (scratch) scratch.rm();
C.done();
