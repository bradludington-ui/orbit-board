// THE REQUIREMENT PAGE, RANK BY BAND AND THE FIVE-YEAR CHART, IN CHROMIUM (v2.23 W1, item 156).
//
// jsdom has no layout, no real keyboard and no real pointer: audit-board's "v2.23 W1" blocks hold the figures, and this holds the
// rest, on the board tools/record-card-fixture.mjs builds (six services, awards on R002, a long title on R001, FY28 started), in
// Harbor and Midnight, with real keys and real clicks (page.mouse at an element's centre):
//   A. The page at 1920, 1440, 1366 and 1024, every tab: no sideways scroll; nothing in the page past its right edge; no figure cut in
//      its box; the header's buttons whole and on screen; the chart's month labels each inside its own column; the long title wraps.
//   B. The keyboard: Tab reaches Back, Previous, Next, ★, Edit record and the tabs in that order; Enter on a tab shows it and keeps the
//      keyboard there; Esc goes back to the list with the keyboard on the requirement's row.
//   C. The pointer: a real click on Next steps to the next requirement, on a tab shows it, on Back returns to the list with the row
//      selected.
//   D. Rank by band at 1440 and 1024: the switch by a real click; no sideways scroll; every card inside its column and no column past
//      the page; a real click on a card opens its record; Tab to a card and Enter does the same.
//   E. The five-year chart at 1440 and 1024: inside its box, no sideways scroll in the box, every bar's words inside its column.
//
//   node tools/req-page.mjs [--board FILE]
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CHROME } from './chrome.mjs';
import { buildRecordBoard } from './record-card-fixture.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const FILE = resolve(opt('--board') || join(ROOT, 'prioritization-board-grid.html'));
const B = buildRecordBoard(readFileSync(FILE, 'utf8'));
process.on('exit', () => B.done());
let bad = 0;
const chk = (what, ok, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${ok || !detail ? '' : '   ' + String(detail).slice(0, 400)}`); };
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const open = async (w, h, theme = 'harbor', mode = 'review') => {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(([t, m]) => { try { if (!sessionStorage.getItem('__seeded')) { localStorage.setItem('spmtTheme', t); localStorage.setItem('spmtMode', m);
    localStorage.setItem('prio27who', 'Pat'); sessionStorage.setItem('__seeded', '1'); } } catch (e) {} }, [theme, mode]);
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.accept());
  await p.goto('file://' + B.file);
  await p.waitForFunction(() => typeof render === 'function' && document.querySelectorAll('#list .row').length > 0, null, { timeout: 40000 });
  await p.waitForTimeout(300);
  return { p, ctx, errs };
};
const press = async (p, sel, wait = 250) => { const l = p.locator(sel).first(); await l.scrollIntoViewIfNeeded(); const bb = await l.boundingBox();
  if (!bb) throw new Error('nothing to press: ' + sel); await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(wait); };
// what is wrong with the page as drawn, measured: [] when nothing is
const pageFaults = p => p.evaluate(() => {
  const out = [], W = document.documentElement.clientWidth, pg = document.getElementById('reqPage');
  if (!pg || pg.hidden) return ['the page is not shown'];
  if (document.documentElement.scrollWidth > W + 1) out.push('the page scrolls sideways: ' + document.documentElement.scrollWidth + ' > ' + W);
  const pr = pg.getBoundingClientRect();
  pg.querySelectorAll('*').forEach(e => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
    if (r.right > Math.min(W, pr.right) + 1) out.push('past the right edge: ' + (e.className || e.tagName) + ' ' + Math.round(r.right) + ' > ' + Math.round(Math.min(W, pr.right))); });
  pg.querySelectorAll('.rpk .v, .rpchip, .rppill, .rptab, .rptop button, .rphact button, .rpsvc td, .rpsvc th, .rpmv').forEach(e => {
    if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible') out.push('cut: ' + e.className + ' "' + e.textContent.slice(0, 30) + '"');
    const r = e.getBoundingClientRect(), par = e.closest('.rpk, .rpcard, .rptabs, .rptop, .rphact, .rpchips');
    if (par) { const q = par.getBoundingClientRect(); if (r.right > q.right + 1 || r.left < q.left - 1) out.push('outside its box: ' + (e.className || e.tagName) + ' "' + e.textContent.slice(0, 30) + '"'); } });
  pg.querySelectorAll('.rpmo').forEach(m => { const q = m.getBoundingClientRect();
    m.querySelectorAll('.rpml, .rpmv').forEach(x => { const r = x.getBoundingClientRect(); if (r.width && (r.left < q.left - 1 || r.right > q.right + 1)) out.push('a month’s words past its column: "' + x.textContent + '"'); }); });
  const t = document.getElementById('rpTitle'); if (t && t.scrollWidth > t.clientWidth + 1) out.push('the title is cut');
  pg.querySelectorAll('.rptop button, .rphact button, .rptab').forEach(x => { const r = x.getBoundingClientRect(); if (r.height < 24 || r.width < 24) out.push('a target under 24px: ' + x.textContent); });
  return out.slice(0, 8);
});

// ── A. the page, every tab, four widths, two themes
for (const [w, h, theme] of [[1920, 1080, 'harbor'], [1440, 900, 'harbor'], [1366, 768, 'harbor'], [1024, 768, 'harbor'], [1440, 900, ''], [1024, 768, '']]) {
  const lay = `${w} ${theme || 'midnight'}`;
  try {
    const { p, ctx, errs } = await open(w, h, theme);
    for (const id of ['R002', 'R001', 'R003']) {
      await p.evaluate(i => reqPageOpen(i), id); await p.waitForTimeout(200);
      for (const k of await p.evaluate(() => [].map.call(document.querySelectorAll('#reqPage .rptab'), b => b.id.replace('rptab_', '')))) {
        await p.evaluate(x => reqPageTab(x), k); await p.waitForTimeout(120);
        const f = await pageFaults(p);
        chk(`A · ${lay}: ${id}, ${k}: whole, on screen, nothing cut`, f.length === 0, f.join(' | '));
      }
    }
    chk(`A · ${lay}: no script error`, errs.length === 0, errs.join(' | '));
    await ctx.close();
  } catch (e) { chk(`A · ${lay}: ran`, false, e.message); }
}

// ── B. the keyboard
for (const [w, h] of [[1440, 900], [1024, 768]]) {
  try {
    const { p, ctx } = await open(w, h);
    await p.evaluate(() => reqPageOpen('R002')); await p.waitForTimeout(250);
    await p.evaluate(() => document.querySelector('#reqPage .rpback').focus());
    const seq = [];
    for (let i = 0; i < 9; i++) { await p.keyboard.press('Tab'); seq.push(await p.evaluate(() => { const a = document.activeElement;
      return a.closest('#reqPage') ? (a.id || a.className.split(' ').filter(c => /^rp/.test(c))[0] || a.textContent.trim()) : 'OUT:' + (a.id || a.tagName); })); }
    chk(`B · ${w}: from Back, Tab reaches Previous, Next, ★, Edit record and every tab, in that order`, seq.join(',').startsWith('rpnav,rpnav,rpmc,rpedit,rptab_over,rptab_svc,rptab_awd,rptab_hist'), seq.join(','));
    await p.evaluate(() => document.querySelector('#reqPage .rpnav').focus());
    await p.keyboard.press('Shift+Tab');
    chk(`B · ${w}: Back is reached by the keyboard`, await p.evaluate(() => document.activeElement.classList.contains('rpback')));
    await p.evaluate(() => document.getElementById('rptab_awd').focus()); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    chk(`B · ${w}: Enter on Awards shows it, pressed, the keyboard still on it`, await p.evaluate(() => [REQPG.k, document.getElementById('rptab_awd').getAttribute('aria-pressed'), document.activeElement.id].join()) === 'awd,true,rptab_awd',
      await p.evaluate(() => [REQPG.k, document.activeElement.id].join()));
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    const e1 = await p.evaluate(() => [!!REQPG, curRow, document.activeElement.id, document.getElementById('reqPage').hidden].join());
    chk(`B · ${w}: Esc goes back to the list, the keyboard on R002’s row`, e1 === 'false,R002,row-R002,true', e1);
    await ctx.close();
  } catch (e) { chk(`B · ${w}: ran`, false, e.message); }
}

// ── C. the pointer
for (const [w, h] of [[1440, 900], [1024, 768]]) {
  try {
    const { p, ctx } = await open(w, h);
    await p.evaluate(() => reqPageOpen('R002')); await p.waitForTimeout(250);
    await press(p, '#reqPage .rpnav[data-step="1"]');
    chk(`C · ${w}: a click on Next shows R003, the keyboard on Next`, await p.evaluate(() => [REQPG.id, curRow, document.activeElement.getAttribute('data-step')].join()) === 'R003,R003,1',
      await p.evaluate(() => [REQPG.id, curRow].join()));
    await press(p, '#rptab_svc');
    chk(`C · ${w}: a click on Funding by service shows it`, await p.evaluate(() => REQPG.k + ',' + !!document.querySelector('#reqPage .rpsvc')) === 'svc,true');
    await press(p, '#reqPage .rpback', 350);
    const c1 = await p.evaluate(() => { const r = document.getElementById('row-R003'), b = r && r.getBoundingClientRect();
      return [!!REQPG, curRow, document.getElementById('reqPage').hidden, !!(b && b.height > 0 && b.top < innerHeight && b.bottom > 0)].join(); });
    chk(`C · ${w}: a click on Back: the list, R003 selected and on screen`, c1 === 'false,R003,true,true', c1);
    await ctx.close();
  } catch (e) { chk(`C · ${w}: ran`, false, e.message); }
}

// ── D. Rank by band
for (const [w, h] of [[1440, 900], [1024, 768]]) {
  try {
    const { p, ctx, errs } = await open(w, h, 'harbor', 'rank');
    await press(p, '#rkv_board', 350);
    const d1 = await p.evaluate(() => { const out = [], W = document.documentElement.clientWidth, bd = document.getElementById('rkBoard');
      if (!bd || bd.hidden) return ['the board is not shown'];
      if (document.documentElement.scrollWidth > W + 1) out.push('the page scrolls sideways');
      const br = bd.getBoundingClientRect();
      bd.querySelectorAll('.rkcol').forEach(c => { const r = c.getBoundingClientRect(); if (r.right > br.right + 1 || r.left < br.left - 1) out.push('a column past the board');
        c.querySelectorAll('.rkcard, .rkcut, .rkh').forEach(x => { const q = x.getBoundingClientRect(); if (q.right > r.right + 1 || q.left < r.left - 1) out.push('past its column: ' + x.textContent.slice(0, 30)); }); });
      bd.querySelectorAll('.rkcard').forEach(x => { const q = x.getBoundingClientRect(); if (q.height < 24) out.push('a card under 24px'); });
      if (!bd.querySelectorAll('.rkcard').length) out.push('no card');
      return out.slice(0, 8); });
    chk(`D · ${w}: the board by a real click on its switch; no sideways scroll, every card inside its column`, d1.length === 0, d1.join(' | '));
    await p.evaluate(() => { try { drawerClose(); } catch (e) {} });
    await press(p, '#rkBoard .rkcard[data-id="R004"]', 350);
    const d2 = await p.evaluate(() => [curRow, drawerNarrow() ? document.getElementById('inspector').classList.contains('open') : !!document.querySelector('#inspector .rechead')].join());
    chk(`D · ${w}: a real click on R004’s card opens its record`, d2 === 'R004,true', d2);
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    await p.evaluate(() => document.querySelector('#rkBoard .rkcard[data-id="R006"]').focus()); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    chk(`D · ${w}: Enter on R006’s card does the same`, await p.evaluate(() => curRow) === 'R006');
    chk(`D · ${w}: no script error`, errs.length === 0, errs.join(' | '));
    await ctx.close();
  } catch (e) { chk(`D · ${w}: ran`, false, e.message); }
}

// ── E. the five-year chart
for (const [w, h] of [[1440, 900], [1024, 768]]) {
  try {
    const { p, ctx } = await open(w, h);
    await p.evaluate(() => toggleFydp()); await p.waitForTimeout(300);
    const e1 = await p.evaluate(() => { const out = [], m = document.querySelector('#fydpPanel .modal'), c = document.querySelector('#fydpBody .fydpchart');
      if (!c) return ['no chart'];
      if (m.scrollWidth > m.clientWidth + 1) out.push('the box scrolls sideways: ' + m.scrollWidth + ' > ' + m.clientWidth);
      const cr = c.getBoundingClientRect();
      c.querySelectorAll('.fyb').forEach(x => { const r = x.getBoundingClientRect();
        x.querySelectorAll('.fygap, b, .fyf').forEach(y => { const q = y.getBoundingClientRect(); if (q.width && (q.left < r.left - 1 || q.right > r.right + 1)) out.push('a year’s words past its column: ' + y.textContent); }); });
      c.querySelectorAll('.fyapp td, .fyapp th').forEach(x => { const q = x.getBoundingClientRect(); if (q.right > cr.right + 1) out.push('a cell past the chart: ' + x.textContent.slice(0, 20)); });
      if (c.querySelectorAll('.fyb').length !== 5) out.push('not five years');
      return out.slice(0, 8); });
    chk(`E · ${w}: the chart is inside its box, no sideways scroll, every year’s words in its column`, e1.length === 0, e1.join(' | '));
    await ctx.close();
  } catch (e) { chk(`E · ${w}: ran`, false, e.message); }
}

await b.close();
console.log(bad ? `\n${bad} FAILING CHECK(S)` : '\nALL CHECKS PASSED');
process.exit(bad ? 1 : 0);
