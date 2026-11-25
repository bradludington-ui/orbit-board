// ACROSS THE FYDP, IN A BROWSER (v2.23 W2, item 158). What jsdom cannot see -- fit, a real pointer and real keys -- held in Chromium on
// the board tools/fydp-across-fixture.mjs builds (base FY27: FY26-FY31), in Harbor:
//   A. At 1920, 1440 and 1024 the tab fits: the page never scrolls sideways (the grid scrolls inside its own frame), every box shows
//      its figure whole ($123,456,789 included), and the chart sits inside the tab.
//   B. A figure typed in FY29 with the keyboard and left with Tab lands in FY29's plan, FY27 stays on screen, and the keyboard goes on
//      to the next box (USAF Discretionary, FY27) -- the tab is redrawn under it. Enter commits as well.
//   C. FY29's directed discretionary figure its lane cannot pay: the box keeps it and the line under it says what it drew.
//   D. Add to FY30 (a real click): the box opens with the keyboard in it, Esc closes it and hands the keyboard back to the button;
//      opened again, grown by 5%, Add makes FY30's requirement linked to FY29's, and FY27 is still on screen.
//   E. Fill across: grow by 2% a year from FY27 into FY28-FY31 -- the preview lists FY31 as not filled -- and Fill writes FY28-FY30's
//      requirement only, never a Disc or Mand figure.
//   F. The RECORD card's year strip: each year with its lane word, the year on screen marked, and Manage across the FYDP inside the
//      card, which opens the requirement page at its Across the FYDP tab.
// Until the requirement page (W1) is merged, the tab is drawn the way the page will draw it -- REQPG_TABS' html(id) into #reqPage,
// again after every render (V223_AFTER) -- and F checks that the button calls reqPageOpen(id, 'fydp'). Once reqPageOpen draws the page,
// the check opens the tab through it instead (it looks for #xfTab after reqPageOpen).
//
//   node tools/fydp-across.mjs [--board FILE] [--shots DIR]
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CHROME } from './chrome.mjs';
import { buildAcrossBoard } from './fydp-across-fixture.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const FILE = resolve(opt('--board') || join(ROOT, 'prioritization-board-grid.html'));
const SHOTS = opt('--shots');
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const B = buildAcrossBoard(readFileSync(FILE, 'utf8'));
process.on('exit', () => B.done());
let bad = 0;
const chk = (what, ok, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? '   ' + detail : ''}`); };
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const open = async (w, h) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(() => { try { localStorage.setItem('spmtTheme', 'harbor'); localStorage.setItem('prio27who', 'Pat'); } catch (e) {} });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.accept());
  await p.goto('file://' + B.file);
  await p.waitForFunction(() => typeof render === 'function' && document.querySelectorAll('#list .row').length > 0, null, { timeout: 40000 });
  await p.waitForTimeout(300);
  return { p, ctx, errs };
};
// the tab on the page: through reqPageOpen when it draws the page, else the way the page will draw it
const mount = p => p.evaluate(() => {
  try { reqPageOpen('R001', 'fydp'); } catch (e) {}
  const rp = document.getElementById('reqPage');
  if (rp && !rp.hidden && rp.querySelector('#xfTab')) return 'page';
  window.__xfMount = function () {
    const e = document.getElementById('reqPage'); if (!e) return;
    const t = REQPG_TABS.filter(x => x.k === 'fydp')[0];
    e.hidden = false; e.innerHTML = '<div style="padding:12px 18px">' + t.html('R001') + '</div>'; t.after('R001');
  };
  const st = document.createElement('style'); st.textContent = '.gridsplit,#uiKpis,.moneybar{display:none!important}'; document.head.appendChild(st);
  V223_AFTER.push(function () { if (window.__xfMount) window.__xfMount(); });
  window.__xfMount();
  try { render(); } catch (e) {}   // the header fits itself on a render (fitTop), as it does when the page opens
  return 'harness';
});
const press = async (p, sel, wait = 300) => { const l = p.locator(sel).first(); await l.scrollIntoViewIfNeeded(); const bb = await l.boundingBox();
  if (!bb) throw new Error('nothing to press: ' + sel); await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(wait); };
const box = (y, k, i) => `#xfTab input[data-y="${y}"][data-xf="${k}"][data-si="${i}"]`;
const askOf = (p, y, id, i) => p.evaluate(([y, id, i]) => { const it = yrItemOf(MS.years[y], id); return it ? it.ask[i] : null; }, [y, id, i]);

for (const [w, h] of [[1920, 1080], [1440, 900], [1024, 768]]) {
  try {
    const { p, ctx, errs } = await open(w, h);
    const how = await mount(p);
    await p.waitForTimeout(200);
    // ── A. the fit
    const a = await p.evaluate(() => {
      const t = document.getElementById('xfTab'), r = t.getBoundingClientRect(), wr = t.querySelector('.xfwrap');
      const clip = [...t.querySelectorAll('input.xfin')].filter(i => i.scrollWidth > i.clientWidth + 1).map(i => i.value);
      const ch = t.querySelector('.xfchart').getBoundingClientRect();
      const big = [...t.querySelectorAll('input.xfin')].some(i => i.value === '123,456,789');
      const past = [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('.xfwrap .xftab') && e.getClientRects().length).slice(0, 4).map(e => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right));
      return { side: document.scrollingElement.scrollWidth - innerWidth, past, clip, chartIn: ch.left >= r.left - 1 && ch.right <= r.right + 1,
        wrapIn: wr.getBoundingClientRect().right <= innerWidth + 1, inputs: t.querySelectorAll('input.xfin').length, big };
    });
    chk(`A · ${w} (${how}): the page does not scroll sideways, the grid stays in its frame, the chart inside the tab`, a.side <= 0 && a.wrapIn && a.chartIn, JSON.stringify(a));
    chk(`A · ${w}: every one of the ${a.inputs} boxes shows its figure whole, $123,456,789 among them`, a.inputs > 20 && !a.clip.length && a.big, JSON.stringify(a.clip));
    if (SHOTS && w !== 1920) await p.screenshot({ path: join(SHOTS, `across-${w}.png`), fullPage: true });
    if (w === 1920) { chk(`· ${w}: nothing threw`, errs.length === 0, errs.slice(0, 3).join(' | ')); await ctx.close(); continue; }
    // ── B. the keyboard: type in FY29, Tab on; Enter commits
    await press(p, box(2029, 'q', 0), 150);
    await p.keyboard.press('Control+A'); await p.keyboard.type('1,500,000'); await p.keyboard.press('Tab'); await p.waitForTimeout(500);
    const b1 = await p.evaluate(() => { const a = document.activeElement; return { cur: MS.cur, y: a && a.getAttribute('data-y'), k: a && a.getAttribute('data-xf'), si: a && a.getAttribute('data-si'), inTab: !!(a && a.closest && a.closest('#xfTab')) }; });
    const b2 = await askOf(p, 2029, 'R001', 0), b0 = await askOf(p, 2027, 'R001', 0);
    chk(`B · ${w}: 1,500,000 typed in FY29 and left with Tab lands in FY29's plan; FY27 stays on screen and keeps its figure`, b2 === 1500000 && b0 === 123456789 && b1.cur === 2027, JSON.stringify([b2, b0, b1.cur]));
    chk(`B · ${w}: the keyboard goes on to the next box, USAF Discretionary FY27, in the redrawn tab`, b1.inTab && b1.y === '2027' && b1.k === 'd' && b1.si === '0', JSON.stringify(b1));
    await press(p, box(2028, 'q', 1), 150);
    await p.keyboard.press('Control+A'); await p.keyboard.type('900000'); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
    chk(`B · ${w}: Enter commits too: FY28 ANG's requirement`, await askOf(p, 2028, 'R001', 1) === 900000, String(await askOf(p, 2028, 'R001', 1)));
    // ── C. a lane that cannot pay what was typed
    const c = await p.evaluate(() => { const i = document.querySelector('#xfTab input[data-y="2029"][data-xf="d"][data-si="0"]'); const d = i && i.parentElement.querySelector('.drew');
      return { val: i && i.value, drew: d && d.textContent, dv: MS.years[2029].fsrc.R001.dv[0] }; });
    chk(`C · ${w}: FY29's USAF discretionary keeps the typed figure and says what the lane drew`, c.val === Math.round(c.dv).toLocaleString() && /^drew \$/.test(c.drew || ''), JSON.stringify(c));
    // ── D. Add to FY30
    await press(p, '#xfTab button.xfaddb:has-text("Add to FY30")', 400);
    const d1 = await p.evaluate(() => ({ open: document.getElementById('xfAddPanel').classList.contains('open'), inBox: !!(document.activeElement && document.activeElement.closest('#xfAddPanel')) }));
    chk(`D · ${w}: Add to FY30 opens its box with the keyboard in it`, d1.open && d1.inBox, JSON.stringify(d1));
    if (SHOTS && w === 1440) await p.screenshot({ path: join(SHOTS, 'add-to-year-1440.png') });
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    const d2 = await p.evaluate(() => ({ open: document.getElementById('xfAddPanel').classList.contains('open'), at: (document.activeElement || {}).textContent }));
    chk(`D · ${w}: Esc closes it and hands the keyboard back to the button`, !d2.open && /Add to FY30/.test(d2.at || ''), JSON.stringify(d2));
    await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    await press(p, '#xfAddGrow', 100);
    await press(p, '#xfAddPct', 100); await p.keyboard.press('Control+A'); await p.keyboard.type('5');
    await press(p, '#xfAddGo', 500);
    const d3 = await p.evaluate(() => { const n = (MS.years[2030].custom || []).filter(c => c.prior && c.prior.id === 'R001')[0];
      return { cur: MS.cur, n: !!n, prior: n && n.prior, ask0: n && n.ask[0], src0: ((MS.years[2029].asks || {}).R001 || [])[0], last: n && MS.years[2030].order[MS.years[2030].order.length - 1] === n.id, open: document.getElementById('xfAddPanel').classList.contains('open') }; });
    chk(`D · ${w}: opened with Enter, grown 5%, Add makes FY30's requirement linked to FY29's, last in FY30's order; FY27 still on screen`,
      d3.n && d3.prior.fy === 2029 && d3.ask0 === Math.round(d3.src0 * 1.05) && d3.last && d3.cur === 2027 && !d3.open, JSON.stringify(d3));
    // ── E. Fill across
    const dm0 = await p.evaluate(() => JSON.stringify([2028, 2029, 2030].map(y => [MS.years[y].fsrc, MS.years[y].alloc])));
    await press(p, '#xfTab button:has-text("Fill across")', 400);
    await press(p, 'input[name="xfFillHow"][value="grow"]', 150);
    await press(p, '#xfFillPct', 100); await p.keyboard.press('Control+A'); await p.keyboard.type('2'); await p.waitForTimeout(200);
    const e1 = await p.evaluate(() => ({ from: document.getElementById('xfFillFrom').value, to: document.getElementById('xfFillTo').value, prev: document.getElementById('xfFillPrev').textContent, go: document.getElementById('xfFillGo').textContent,
      side: (() => { const m = document.querySelector('#xfFillPanel .modal'); return m.scrollWidth - m.clientWidth; })() }));
    chk(`E · ${w}: Fill from FY27 into FY28-FY31, grown 2% a year: the preview names FY31 as not filled and Fill counts the years`, e1.from === '2027' && e1.to === '2031' && /FY31: not filled/.test(e1.prev) && /Fill 3 years/.test(e1.go) && e1.side <= 0, JSON.stringify(e1).slice(0, 300));
    if (SHOTS && w === 1440) await p.screenshot({ path: join(SHOTS, 'fill-across-1440.png') });
    await press(p, '#xfFillGo', 600);
    const e2 = await p.evaluate(() => ({ y28: ((MS.years[2028].asks || {}).R001 || [])[0], y29: ((MS.years[2029].asks || {}).R001 || [])[0],
      y30: ((MS.years[2030].custom || []).filter(c => c.prior && c.prior.id === 'R001')[0] || {}).ask, cur: MS.cur }));
    const dm1 = await p.evaluate(() => JSON.stringify([2028, 2029, 2030].map(y => [MS.years[y].fsrc, MS.years[y].alloc])));
    chk(`E · ${w}: Fill writes FY28-FY30's requirement, grown 2% a year from FY27, and no Disc or Mand figure`,
      e2.y28 === Math.round(123456789 * 1.02) && e2.y29 === Math.round(123456789 * 1.02 * 1.02) && e2.y30 && e2.y30[0] === Math.round(123456789 * Math.pow(1.02, 3)) && dm1 === dm0 && e2.cur === 2027, JSON.stringify(e2));
    // ── F. the RECORD card's year strip
    await p.evaluate(() => { const e = document.getElementById('reqPage'); if (window.__xfMount) { window.__xfMount = null; e.hidden = true; e.innerHTML = ''; [...document.querySelectorAll('style')].pop().remove(); } setCur('R001'); render(); });
    await p.waitForTimeout(500);
    const f = await p.evaluate(() => { const i = document.getElementById('inspector'), s = i.querySelector('.recyrs'), m = s && s.querySelector('button.recyrman');
      const ir = i.getBoundingClientRect(), mr = m && m.getBoundingClientRect();
      return { chips: s ? [...s.querySelectorAll('.recyr')].map(e => e.tagName + ':' + e.textContent) : [], man: !!m, inside: !!m && mr.left >= ir.left - 1 && mr.right <= ir.left + i.clientWidth + 1 && mr.height >= 24 };
    });
    chk(`F · ${w}: the strip: each year with its lane word, FY27 marked, and Manage across the FYDP inside the card`,
      f.chips.length >= 4 && /^SPAN:FY27 .* · /.test(f.chips[0]) && f.chips.slice(1).every(c => /^BUTTON:FY\d\d .* · /.test(c)) && f.man && f.inside, JSON.stringify(f));
    if (SHOTS && w === 1440) await p.locator('#inspector').screenshot({ path: join(SHOTS, 'record-strip-1440.png') });
    await p.evaluate(() => { const o = reqPageOpen; window.__rp = null; reqPageOpen = function (id, k) { window.__rp = [id, k]; return o.apply(this, arguments); }; });
    await press(p, '#inspector button.recyrman', 400);
    const f2 = await p.evaluate(() => ({ called: window.__rp, page: (() => { const e = document.getElementById('reqPage'); return !!(e && !e.hidden && e.querySelector('#xfTab')); })() }));
    chk(`F · ${w}: Manage across the FYDP opens the requirement page at Across the FYDP`, JSON.stringify(f2.called) === '["R001","fydp"]', JSON.stringify(f2));
    chk(`· ${w}: nothing threw`, errs.length === 0, errs.slice(0, 3).join(' | '));
    await ctx.close();
  } catch (e) { chk(`${w}: the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 200)); }
}
await b.close();
console.log(bad ? `\n${bad} Across the FYDP check(s) failed\n` : '\nAcross the FYDP fits at 1920, 1440 and 1024, takes a figure for another year by keyboard and keeps the keyboard\'s place, says what a lane drew, adds to a year, fills across, and the record card opens it\n');
process.exit(bad ? 1 : 0);
