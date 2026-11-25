// THE NEW LOOK HOLDS ITS PROMISES (v2.22 W1, items 155, 154, 149.28, 149.51) -- in Chromium, on a populated board, because jsdom lays
// nothing out and every promise here is about where something is drawn and whether it can be read:
//
//   A. The header holds the find box on one line: a search box at least 170px wide, or -- fitTop()'s step cmd1 -- its magnifier alone in
//      a 36px button (32px from the fourth step on), never wrapped while that step is left; the find box keeps its words as its accessible name.
//   B. The money bar draws every requirement in priority order, each block as wide as its share of the board's requirement (to a pixel),
//      the blocks filling the bar; no run's words are cut (they shorten to the ranks, or go); it is not drawn in Brief, on the Funding
//      page, or where the room is 760px or less.
//   C. Columns (149.28): in a room too narrow for every column, each tick box is greyed and says why; with room, none is.
//   D. A row shows the hand (149.51), and its fields keep their own pointer.
//   E. The rows' Funded figure and status pill (with what is unfunded under it) are read whole at 1920, 1440, 1366 and 1024 -- a
//      nine-digit figure included -- and the title band's chips are on screen, whole, each at least 24px high.
//   F. The Funding page (item 154): the four tiles, Unfunded by service, Needs attention and the bar are on screen without a sideways
//      scroll at 1920, 1440 and 1024; no figure in a tile is cut; every Needs attention entry is a 24px target.
//
//   node tools/look-fits.mjs [--board FILE]
import { chromium } from 'playwright-core';
import { resolve, join } from 'node:path';
import { CHROME } from './chrome.mjs';
import { buildPopulated } from './ia-fixture.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const bi = args.indexOf('--board');
const FILE = resolve(bi >= 0 ? args[bi + 1] : join(ROOT, 'prioritization-board-grid.html'));
// a nine-digit requirement, short, so the widest Funded figure and the widest "unfunded $X" are on the board
const BOARD = buildPopulated(FILE, `applyAskVec(S.order[4], [923456789,0,0,0,0,0]);`);
let bad = 0;
const chk = (what, ok, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${ok ? '' : '  -- ' + String(detail || '').slice(0, 400)}`); };

const browser = await chromium.launch({ executablePath: CHROME });
const open = async (w, mode, h = 1000) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(m => { try { if (!sessionStorage.getItem('__seeded')) { localStorage.setItem('spmtTheme', 'harbor'); localStorage.setItem('spmtMode', m); sessionStorage.setItem('__seeded', '1'); } } catch (e) {} }, mode);
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + BOARD);
  await p.waitForFunction(() => typeof render === 'function' && document.querySelectorAll('#list .row').length > 0, null, { timeout: 40000 });
  await p.evaluate(m => { if (uiMode !== m) uiSetMode(m); }, mode);
  await p.waitForTimeout(300);
  return { ctx, p, errs };
};
console.log('\n' + FILE.split('/').pop());

// ── A. the find box ───────────────────────────────────────────────────────────────────────────────────────────────────────
console.log('A. the find box');
for (const w of [1920, 1512, 1440, 1366, 1280, 1152, 1024, 960, 900, 820]) {
  const { ctx, p, errs } = await open(w, 'review', 900);
  const r = await p.evaluate(() => { const b = document.getElementById('cmdOpen'), h = document.querySelector('.hdr');
    if (!b) return null;
    const c = b.getBoundingClientRect(), tops = [...h.children].filter(e => e.getBoundingClientRect().width > 0 && !e.classList.contains('statwrap')).map(e => Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2));
    const lbl = (b.querySelector('.cmdT') || {}).textContent || '';
    return { w: Math.round(c.width), cls: h.className, spread: Math.max(...tops) - Math.min(...tops), name: lbl, scroll: document.documentElement.scrollWidth - innerWidth }; });
  const ok = !!r && (/cmd1/.test(r.cls) ? (r.w >= 24 && r.w <= 36) : r.w >= 170) && r.spread <= 6 && !/tight2/.test(r.cls) && r.name === 'Find or run anything' && r.scroll <= 0 && !errs.length;
  chk(`A · ${w}px: the find box is ${r ? (/cmd1/.test(r.cls) ? 'its magnifier, ' + r.w + 'px' : r.w + 'px wide') : 'missing'}, the header one line`, ok, JSON.stringify(r) + ' ' + errs.join(' | '));
  await ctx.close();
}

// ── B. the money bar ──────────────────────────────────────────────────────────────────────────────────────────────────────
console.log('B. the money bar');
for (const w of [1920, 1440, 1024]) {
  const { ctx, p, errs } = await open(w, 'review');
  const r = await p.evaluate(() => {
    const bar = document.querySelector('#moneyBar .mbbar'); if (!bar) return null;
    const W = bar.clientWidth, blocks = [...bar.querySelectorAll('.mbb')];
    const asks = blocks.map(b => +b.style.flexGrow), tot = asks.reduce((a, b) => a + b, 0);
    const off = blocks.map((b, i) => Math.abs(b.getBoundingClientRect().width - asks[i] / tot * W)).reduce((a, b) => Math.max(a, b), 0);
    const filled = blocks.reduce((a, b) => a + b.getBoundingClientRect().width, 0);
    const order = blocks.map(b => b.getAttribute('data-id')).join() === S.order.filter(id => itemById(id)).join();
    const cut = [...bar.querySelectorAll('.mbl')].filter(l => l.style.visibility !== 'hidden' && l.scrollWidth > l.clientWidth + 0.5).map(l => l.textContent);
    return { n: blocks.length, order, off: +off.toFixed(2), gap: +Math.abs(filled - W).toFixed(2), cut }; });
  chk(`B · ${w}px: every requirement, in priority order, each block its share of the bar to a pixel, filling it, no run’s words cut`,
    !!r && r.order && r.off <= 1 && r.gap <= 1.5 && !r.cut.length && !errs.length, JSON.stringify(r) + ' ' + errs.join(' | '));
  for (const m of ['brief', 'fund']) {
    await p.evaluate(mm => uiSetMode(mm), m); await p.waitForTimeout(200);
    const shown = await p.evaluate(() => { const e = document.getElementById('moneyBar'); return !!(e && e.getClientRects().length && getComputedStyle(e).display !== 'none'); });
    chk(`B · ${w}px: not drawn in ${m === 'brief' ? 'Brief' : 'the Funding page'}`, !shown, '');
  }
  await ctx.close();
}
{ const { ctx, p } = await open(700, 'review');
  const shown = await p.evaluate(() => { const e = document.getElementById('moneyBar'); return !!(e && getComputedStyle(e).display !== 'none'); });
  chk('B · 700px (a room under 760): the bar is not drawn', !shown, ''); await ctx.close(); }

// ── C. Columns, greyed where they cannot apply ───────────────────────────────────────────────────────────────────────────
console.log('C. Columns');
for (const [w, mode, want] of [[1920, 'review', false], [1920, 'rank', false], [1024, 'rank', true]]) {
  const { ctx, p } = await open(w, mode);
  await p.click('#uiColsBtn'); await p.waitForTimeout(150);
  const r = await p.evaluate(() => [...document.querySelectorAll('#uiColsPop label')].map(l => ({ off: l.querySelector('input').disabled, why: (l.querySelector('small') || {}).textContent || '' })));
  const ok = r.length > 0 && r.every(x => x.off === want && (!want || /Not at this width/.test(x.why)));
  chk(`C · ${w}px ${mode}: ${want ? 'every tick box greyed, saying why' : 'every tick box live'}`, ok, JSON.stringify(r));
  await ctx.close();
}

// ── D. the hand over a row ───────────────────────────────────────────────────────────────────────────────────────────────
console.log('D. the pointer');
{ const { ctx, p } = await open(1440, 'review');
  const r = await p.evaluate(() => { const row = document.querySelector('#list .row'), t = row.querySelector('.reqc'), i = row.querySelector('.rank input');
    return { row: getComputedStyle(t).cursor, field: getComputedStyle(i).cursor }; });
  chk('D · a row shows the hand; its rank box keeps its own pointer', r.row === 'pointer' && r.field !== 'pointer', JSON.stringify(r));
  await ctx.close(); }

// ── E. the rows' Funded and status, and the chips ────────────────────────────────────────────────────────────────────────
console.log('E. the rows and the chips');
for (const [w, mode] of [[1920, 'review'], [1440, 'review'], [1366, 'review'], [1024, 'review'], [1920, 'rank'], [1440, 'rank'], [1024, 'rank'], [900, 'rank']]) {
  const { ctx, p, errs } = await open(w, mode);
  const r = await p.evaluate(() => {
    const cut = [];
    document.querySelectorAll('#list .row').forEach(row => {
      row.querySelectorAll('.fundc .fv, .lanec .pill, .lanec .unfx').forEach(e => {
        const c = e.getBoundingClientRect(), cell = e.closest('.fundc, .lanec').getBoundingClientRect();
        if (e.scrollWidth > e.clientWidth + 0.5 || c.right > cell.right + 0.5 || c.left < cell.left - 0.5) cut.push(row.id + ' ' + e.className + ' "' + e.textContent + '"'); }); });
    const big = [...document.querySelectorAll('#list .row .fundc .fv, #list .row .lanec .unfx')].some(e => /\$\d{3},\d{3},\d{3}/.test(e.textContent));
    const chips = [...document.querySelectorAll('#gridBand .fchipb')].filter(b => !b.hidden).map(b => { const c = b.getBoundingClientRect();
      const t = document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2);
      return { id: b.id, h: Math.round(c.height), in: c.left >= 0 && c.right <= innerWidth, hit: !!t && (t === b || b.contains(t)) }; });
    return { cut, big, chips, scroll: document.documentElement.scrollWidth - innerWidth };
  });
  chk(`E · ${w}px ${mode}: every ${mode === 'rank' ? '' : 'Funded figure, '}status pill and "unfunded $X" whole (a nine-digit figure among them)`, r.big && !r.cut.length && r.scroll <= 0, JSON.stringify(r.cut.slice(0, 5)) + ' big:' + r.big + ' scroll:' + r.scroll);
  chk(`E · ${w}px ${mode}: the band’s chips on screen, whole, clickable, 24px or more`, r.chips.length >= 5 && r.chips.every(c => c.h >= 24 && c.in && c.hit), JSON.stringify(r.chips));
  chk(`E · ${w}px ${mode}: nothing threw`, !errs.length, errs.join(' | '));
  await ctx.close();
}

// ── F. the Funding page ──────────────────────────────────────────────────────────────────────────────────────────────────
console.log('F. the Funding page');
for (const w of [1920, 1440, 1024]) {
  const { ctx, p, errs } = await open(w, 'fund');
  const r = await p.evaluate(() => {
    const pe = document.getElementById('posture'); if (!pe || !pe.getClientRects().length) return null;
    const parts = ['.pptiles', '.ppsvcb', '.ppatt', '.ppbar'].map(s => { const e = pe.querySelector(s); return e ? e.getBoundingClientRect() : null; });
    const cut = [...pe.querySelectorAll('.ppt .n, .ppt .v, .ppsvc b')].filter(e => e.scrollWidth > e.clientWidth + 0.5).map(e => e.textContent);
    const ents = [...pe.querySelectorAll('.ppatt button.e')].map(b => Math.round(b.getBoundingClientRect().height));
    return { tiles: pe.querySelectorAll('.pptiles .ppt').length, parts: parts.every(c => c && c.width > 0 && c.right <= innerWidth + 0.5), cut, ents,
      scroll: document.documentElement.scrollWidth - innerWidth, kpis: getComputedStyle(document.getElementById('uiKpis')).display };
  });
  chk(`F · ${w}px: four tiles, Unfunded by service, Needs attention and the bar on screen, no figure cut, no sideways scroll`,
    !!r && r.tiles === 4 && r.parts && !r.cut.length && r.scroll <= 0 && r.kpis === 'none', JSON.stringify(r));
  chk(`F · ${w}px: every Needs attention entry is a 24px target`, !!r && r.ents.length > 0 && r.ents.every(h => h >= 24), JSON.stringify(r && r.ents));
  chk(`F · ${w}px: nothing threw`, !errs.length, errs.join(' | '));
  await ctx.close();
}
await browser.close();
console.log(bad ? `\n${bad} LOOK CHECK(S) FAILED` : '\nthe new look holds');
process.exit(bad ? 1 : 0);
