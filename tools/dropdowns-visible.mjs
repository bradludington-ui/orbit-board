// EVERY DROP-DOWN SHOWS ALL OF ITS ITEMS (v1.93, item 43). Brad photographed a row's ⋯ menu cut off under the
// list and Reports & exports running off the bottom of the screen. Measured on v1.92: the row menu was clipped
// by the list's own scroll box (194px of it hidden on the last row, at any window size) and Reports & exports
// (877px) ran 232px past a 730px window with nothing to scroll.
//
// This opens every toolbar menu -- and, since v1.96 (item 65), every folded group in it -- and a row's ⋯ menu on the
// first and the last row of a long list and of a short one, at four widths and two heights, the way a person does (a
// click on its button, then on each group's heading). For each it checks:
//   - the menu's box lies inside the window;
//   - every item, scrolled into view inside the menu if the menu scrolls, is inside the window and is the
//     thing actually under its own centre -- nothing around it (the list's edge, a box, the top) covers it.
//
// TWICE, THE SECOND TIME IN WINDOWS' FONT (v1.95, item 57). The board asks for 'Segoe UI', which this machine does
// not have, so the first pass measures it in Liberation Sans (Arial's widths) -- and v1.94 passed it with nothing to
// spare while Edge on Windows put Reports & exports 3px past the left edge at 761px. The second pass declares a
// Segoe-like stand-in, 6% wider and as tall as Segoe UI (font-standin.mjs), and checks the same menus again; it
// first proves the stand-in is the font being drawn, or fails.
//
// v2.00 (UI S4, fix round): AND DOCKED. The RECORD panel slides over the table by default now, closed until a row is
// picked; docked beside the table (View › Record panel › Docked beside the table, prio27uiDock = '1' in this browser) it
// stands beside the rows above 1400px -- the layout these menus were first measured in, a narrower list with the panel
// at its right, where a row's ⋯ menu opens. So both fonts are checked a second time docked, at the sizes above 1400px
// (1536 and 1920, both heights), every toolbar menu and every row menu as above, and the panel is checked to be docked
// beside the list there. At 1400 and narrower docked is a drawer, as the first pass already has it.
//
// v2.00 (menu, 19 Oct): Reports & exports, Data, Setup and File left the toolbar for the LEFT MENU. Every flyout there (FYDP,
// Execution, Program offices, Audit, History & recovery, Setup with each folded group opened, Save's ▾) and every box it opens
// (Imports & exports, Reports & exports, Data) is opened from its entry the way a person does, at every size and in both
// fonts, and judged as a toolbar menu is: in the window, every item in it and on top.
//
//   node tools/dropdowns-visible.mjs
import { chromium } from 'playwright-core';
import { resolve, join, dirname } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { CHROME } from './chrome.mjs';
import { buildPopulated } from './ia-fixture.mjs';
import { STANDIN_SCALE, withStandin, standinProblem } from './font-standin.mjs';

const BOARD = process.env.BOARD || resolve(new URL('..', import.meta.url).pathname, 'prioritization-board-grid.html');
const LIVE = buildPopulated(BOARD);
const SEGOE = join(dirname(LIVE), 'segoe-standin.html');
writeFileSync(SEGOE, withStandin(readFileSync(LIVE, 'utf8')));
const SIZES = [[761, 730], [1024, 730], [1536, 730], [1920, 730], [761, 960], [1024, 960], [1536, 960], [1920, 960]];
const FONTS = [['', LIVE], [`Segoe stand-in +${STANDIN_SCALE - 100}%: `, SEGOE]];
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const bad = [];
let looked = 0;

// one open menu, judged: its box in the window, and every item visible and on top, scrolled into view if need be
const judge = (p, sel = '.menu.open > .mdd') => p.evaluate(sel => {
  const dd = document.querySelector(sel); if (!dd) return { none: true };
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
}, sel);

for (const [pass, docked] of [['', false], ['docked: ', true]])
for (const [font, FILE] of FONTS) for (const [W, h] of SIZES) {
  if (docked && W <= 1400) continue;   // docked is a drawer there, which the first pass has
  const w = pass + font + W;
  const ctx = await b.newContext({ viewport: { width: W, height: h } });
  const p = await ctx.newPage(); p.on('dialog', d => d.accept('Probe'));
  await p.addInitScript(() => { try { localStorage.setItem('spmtTheme', 'harbor'); localStorage.setItem('prio27who', 'Probe'); } catch (e) {} });
  if (docked) await p.addInitScript(() => { try { localStorage.setItem('prio27uiDock', '1'); } catch (e) {} });
  await p.goto('file://' + FILE); await p.waitForFunction(() => typeof render === 'function'); await p.waitForTimeout(500);
  if (font) { const why = await standinProblem(p); if (why) { bad.push(`${w}×${h}: ${why}`); await ctx.close(); continue; } }
  // docked: the panel stands beside the list (in the page, to the list's right), with the setting on
  if (docked) {
    const at = await p.evaluate(() => { const i = document.getElementById('inspector'), cs = getComputedStyle(i), r = i.getBoundingClientRect(),
      g = document.querySelector('.gridwrap').getBoundingClientRect();
      return { dock: document.documentElement.classList.contains('ui-dock'), fixed: cs.position === 'fixed', shown: cs.display !== 'none' && r.width > 0,
        beside: r.left >= g.right - 1, panel: Math.round(r.left) + '-' + Math.round(r.right), list: Math.round(g.left) + '-' + Math.round(g.right) }; });
    if (!(at.dock && !at.fixed && at.shown && at.beside)) bad.push(`${w}×${h}: the RECORD panel is not docked beside the list (${JSON.stringify(at)})`);
  }
  // THE TOOLBAR MENUS, each from its own button
  const keys = await p.evaluate(() => [...document.querySelectorAll('.menu[id^="m_"]')].map(m => m.id.slice(2))
    .filter(k => { const bt = document.getElementById('b_' + k); if (!bt) return false; const c = bt.getBoundingClientRect(); return c.width > 0 && c.height > 0; }));
  for (const k of keys) {
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.click('#b_' + k); await p.waitForTimeout(120);
    const r = await judge(p); looked++;
    if (r.none) bad.push(`${w}×${h} ${k}: its menu did not open`);
    else r.problems.forEach(x => bad.push(`${w}×${h} ${k} menu: ${x}`));
    // v1.96 (item 65): A LONG MENU FOLDS. Each group is opened from its heading, the way a person does, and the menu is
    // judged again with that group open: every item in it in the window and on top, the menu scrolling if it must.
    const gs = await p.evaluate(k => [...document.querySelectorAll('#dd_' + k + ' .gh')].map(h => h.getAttribute('data-g')), k);
    for (const g of gs) {
      await p.click(`#dd_${k} .gh[data-g="${g}"]`); await p.waitForTimeout(100);
      const rg = await judge(p); looked++;
      const opened = await p.evaluate(([k, g]) => { const b = document.getElementById('mg_' + k + '_' + g); return !!b && !b.hidden; }, [k, g]);
      if (rg.none) bad.push(`${w}×${h} ${k} › ${g}: the menu closed when the group was opened`);
      else if (!opened) bad.push(`${w}×${h} ${k} › ${g}: the group did not open`);
      else rg.problems.forEach(x => bad.push(`${w}×${h} ${k} › ${g}: ${x}`));
    }
    await p.keyboard.press('Escape'); await p.waitForTimeout(60);
  }
  // v2.00 (menu): THE LEFT MENU'S FLYOUTS AND BOXES, each from its entry; Setup's folded groups each opened from its heading.
  // Work kept aside is set, so History & recovery draws its items.
  await p.evaluate(() => { try { drawerClose(); } catch (e) {} try { _keptMeta = { t: Date.now(), why: 'folder' }; syncBtns(); } catch (e) {} });
  const LEFT = await p.evaluate(() => (typeof UI_NAV !== 'undefined' ? UI_NAV : []).filter(k => ['rep', 'imp', 'data'].concat(typeof UI_FLY !== 'undefined' ? UI_FLY : []).indexOf(k) >= 0
    && (document.getElementById('uiNav_' + k) || {}).getClientRects().length));
  if (LEFT.join() !== 'fydp,exec,rep,imp,data,pmo,aud,hist,setup,save') bad.push(`${w}×${h}: the left menu's flyouts and boxes are not all there (${LEFT.join(', ')})`);
  for (const k of LEFT) {
    await p.evaluate(() => { window.scrollTo(0, 0); try { uiFlyClose(); } catch (e) {} });
    await p.click('#uiNav_' + k); await p.waitForTimeout(150);
    const sel = ['rep', 'imp', 'data'].includes(k) ? '.modal-bg.open > .modal' : '#uiFly.open';
    const r = await judge(p, sel); looked++;
    if (r.none) bad.push(`${w}×${h} left ${k}: it did not open`);
    else r.problems.forEach(x => bad.push(`${w}×${h} left ${k}: ${x}`));
    const gs = sel === '#uiFly.open' ? await p.evaluate(() => [...document.querySelectorAll('#uiFly .gh')].map(h => h.getAttribute('data-g'))) : [];
    for (const g of gs) {
      const was = await p.evaluate(g => document.querySelector(`#uiFly .gh[data-g="${g}"]`).getAttribute('aria-expanded'), g);
      if (was !== 'true') { await p.click(`#uiFly .gh[data-g="${g}"]`); await p.waitForTimeout(100); }
      const rg = await judge(p, sel); looked++;
      if (rg.none) bad.push(`${w}×${h} left ${k} › ${g}: the flyout closed when the group was opened`);
      else rg.problems.forEach(x => bad.push(`${w}×${h} left ${k} › ${g}: ${x}`));
    }
    await p.keyboard.press('Escape'); await p.waitForTimeout(80);
    await p.evaluate(() => { try { uiFlyClose(); uiImpClose(); uiRepClose(); uiDataClose(); } catch (e) {} });
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
console.log(`\ndrop-downs: ${looked} opened across ${SIZES.length} window sizes, in this machine's font and in a Segoe-like stand-in +${STANDIN_SCALE - 100}%`
  + `, the RECORD panel sliding over, and again docked beside the list at the ${SIZES.filter(([W]) => W > 1400).length} of them above 1400px`);
if (bad.length) { console.log(`${bad.length} PROBLEM(S)`); bad.slice(0, 60).forEach(x => console.log('  ✗ ' + x)); process.exit(1); }
console.log('every item of every drop-down is in the window and on top');
