// EVERY DROP-DOWN SHOWS ALL OF ITS ITEMS (v1.93, item 43). Brad photographed a row's ⋯ menu cut off under the
// list and Reports & exports running off the bottom of the screen. Measured on v1.92: the row menu was clipped
// by the list's own scroll box (194px of it hidden on the last row, at any window size) and Reports & exports
// (877px) ran 232px past a 730px window with nothing to scroll.
//
// This opens every toolbar menu, and a row's ⋯ menu on the first and the last row of a long list and of a short
// one, at four widths and two heights, the way a person does (a click on its button). For each it checks:
//   - the menu's box lies inside the window;
//   - every item, scrolled into view inside the menu if the menu scrolls, is inside the window and is the
//     thing actually under its own centre -- nothing around it (the list's edge, a box, the top) covers it.
//
//   node tools/dropdowns-visible.mjs
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
import { CHROME } from './chrome.mjs';
import { buildPopulated } from './ia-fixture.mjs';

const BOARD = process.env.BOARD || resolve(new URL('..', import.meta.url).pathname, 'prioritization-board-grid.html');
const LIVE = buildPopulated(BOARD);
const SIZES = [[761, 730], [1024, 730], [1536, 730], [1920, 730], [761, 960], [1024, 960], [1536, 960], [1920, 960]];
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const bad = [];
let looked = 0;

// one open menu, judged: its box in the window, and every item visible and on top, scrolled into view if need be
const judge = p => p.evaluate(() => {
  const dd = document.querySelector('.menu.open > .mdd'); if (!dd) return { none: true };
  const W = innerWidth, H = innerHeight, r = dd.getBoundingClientRect(), out = [];
  if (r.top < -0.5 || r.left < -0.5 || r.bottom > H + 0.5 || r.right > W + 0.5)
    out.push(`the menu runs outside the window (${Math.round(r.left)},${Math.round(r.top)} to ${Math.round(r.right)},${Math.round(r.bottom)} in ${W}×${H})`);
  const items = [...dd.querySelectorAll('.mi, button, select, input')].filter(e => e.offsetParent !== null || getComputedStyle(e).position === 'fixed');
  items.forEach(e => {
    e.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const c = e.getBoundingClientRect(), x = c.left + Math.min(c.width / 2, 20), y = c.top + c.height / 2;
    const label = (e.textContent || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 40);
    if (c.top < -0.5 || c.bottom > H + 0.5 || c.left < -0.5 || c.right > W + 0.5) { out.push(`"${label}" is outside the window`); return; }
    const top = document.elementFromPoint(x, y);
    if (!top || !(top === e || e.contains(top))) out.push(`"${label}" is covered by ${top ? (top.id ? '#' + top.id : top.tagName.toLowerCase() + '.' + String(top.className).split(' ')[0]) : 'nothing'}`);
  });
  return { items: items.length, problems: out };
});

for (const [w, h] of SIZES) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage(); p.on('dialog', d => d.accept('Probe'));
  await p.addInitScript(() => { try { localStorage.setItem('spmtTheme', 'harbor'); localStorage.setItem('prio27who', 'Probe'); } catch (e) {} });
  await p.goto('file://' + LIVE); await p.waitForFunction(() => typeof render === 'function'); await p.waitForTimeout(500);
  // THE TOOLBAR MENUS, each from its own button
  const keys = await p.evaluate(() => [...document.querySelectorAll('.menu[id^="m_"]')].map(m => m.id.slice(2))
    .filter(k => { const bt = document.getElementById('b_' + k); if (!bt) return false; const c = bt.getBoundingClientRect(); return c.width > 0 && c.height > 0; }));
  for (const k of keys) {
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.click('#b_' + k); await p.waitForTimeout(120);
    const r = await judge(p); looked++;
    if (r.none) bad.push(`${w}×${h} ${k}: its menu did not open`);
    else r.problems.forEach(x => bad.push(`${w}×${h} ${k} menu: ${x}`));
    await p.keyboard.press('Escape'); await p.waitForTimeout(60);
  }
  // A ROW'S ⋯ MENU on the first and the last row, in the whole list and in a short one
  const rowMenu = async (which, tag) => {
    const id = await p.evaluate(which => { const r = [...document.querySelectorAll('#list [id^="rm_"]')].filter(e => e.getBoundingClientRect().height > 0);
      const e = which === 'first' ? r[0] : r[r.length - 1]; return e ? e.id : null; }, which);
    if (!id) { bad.push(`${w}×${h} ${tag}: no row menu to open`); return; }
    await p.evaluate(id => { const e = document.getElementById(id); e.scrollIntoView({ block: 'nearest' }); }, id);
    await p.click('#' + id.replace(/([^A-Za-z0-9_-])/g, '\\$1') + ' .rmbtn'); await p.waitForTimeout(150);
    const r = await judge(p); looked++;
    if (r.none) bad.push(`${w}×${h} ${tag} ${which} row: its menu did not open`);
    else r.problems.forEach(x => bad.push(`${w}×${h} ${tag} ${which} row menu: ${x}`));
    await p.keyboard.press('Escape'); await p.waitForTimeout(60);
  };
  await rowMenu('first', 'whole list'); await rowMenu('last', 'whole list');
  // a short list: the office with the fewest requirements, picked from the PMO menu the way a person does
  const g = await p.evaluate(() => { const n = {}; DATA.items.forEach(i => { if (S.order.indexOf(i.id) >= 0) n[i.grp] = (n[i.grp] || 0) + 1; });
    const ks = Object.keys(n).filter(k => n[k] >= 2).sort((a, b) => n[a] - n[b]); return ks[0] || null; });
  if (g) {
    await p.evaluate(g => { setPmoFilter(g); }, g); await p.waitForTimeout(200);
    await rowMenu('first', 'short list (' + g + ')'); await rowMenu('last', 'short list (' + g + ')');
    await p.evaluate(() => { setPmoFilter('ALL'); });
  } else bad.push(`${w}×${h}: no office with two or more requirements for the short list`);
  await ctx.close();
}
await b.close();
console.log(`\ndrop-downs: ${looked} opened across ${SIZES.length} window sizes`);
if (bad.length) { console.log(`${bad.length} PROBLEM(S)`); bad.slice(0, 60).forEach(x => console.log('  ✗ ' + x)); process.exit(1); }
console.log('every item of every drop-down is in the window and on top');
