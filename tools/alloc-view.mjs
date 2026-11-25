// ALLOCATE, IN A BROWSER (v2.23 W3, item 159). What jsdom cannot see -- where things land, what fits, what the keyboard and the
// clipboard do -- checked in Chromium on a populated board (50 requirements, six services, splits and the lane walk, mandatory drawn),
// written through the board's own code in jsdom and opened as a saved file, the way a person opens one:
//   A. The Sheet and One lane at 1920, 1440 and 1024 (Harbor): no sideways scroll of the page; the view inside the window; every
//      box shows its whole figure; the column heads and the pinned lines stay in view when the sheet is scrolled; the tiles' figures
//      are whole.
//   B. Present at 1920: the same screen, read only, in larger type; nothing cut; no box.
//   C. The keyboard: arrows move between boxes; digits typed with the real keyboard and Tab are taken into the draft (a change
//      fired per keystroke would not be), and the keyboard lands on the next box after the redraw.
//   D. Paste from Excel: a tab- and line-separated block pasted into a box fills from it; a cell that is not a figure is named.
//   E. The mandatory switch, with a real pointer: the box opens with the keyboard inside it, Esc closes it changing nothing; Move and
//      turn off: no Mandatory column in either view, Fund mode's Mandatory column is gone -- its cells line up with their heads and the
//      row template has a track for each cell shown and no more -- the Requirements tiles are three.
//   F. Leaving Allocate with a figure not saved asks; Cancel stays.
//   --shots DIR writes the screens (1440 and 1024: Sheet, One lane, the box; 1920: Present) in Harbor.
//
//   node tools/alloc-view.mjs [--board FILE] [--shots DIR]
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { CHROME } from './chrome.mjs';
import { boot, seed } from './export-audit/boot.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const FILE = resolve(opt('--board') || join(ROOT, 'prioritization-board-grid.html'));
const SHOTS = opt('--shots') ? resolve(opt('--shots')) : '';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

// the board: 50 requirements over six services, in seven offices; most on a split, some on the lane walk; mandatory drawn
const SVCN = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'], PMOS = ['PSM', 'PP', 'AV', 'MxS', 'CDS', 'TSS', 'ATL'];
const NAMES = ['Engine Module Repair Capacity', 'Depot Field Team Travel', 'ALIS/ODIN Infrastructure Refresh', 'Sustainment Fuel (Ferry Flights)',
  'Flight Test Instrumentation', 'Low Observable Restoration Kits', 'Training GDOS IT Support', 'Supply Chain Data Analytics', 'Tooling and GSE Calibration',
  'Software Maintenance Release'];
const items = Array.from({ length: 50 }, (_, i) => ({
  id: 'R' + String(i + 1).padStart(3, '0'), grp: PMOS[i % 7], team: PMOS[i % 7], sect: '', custom: false,
  title: 'OGC ' + NAMES[i % 10] + (i >= 10 ? ' ' + (1 + Math.floor(i / 10)) : ''), event: 'OGC ' + NAMES[i % 10] + (i >= 10 ? ' ' + (1 + Math.floor(i / 10)) : ''),
  ccar: '', fy26: SVCN.map(() => 0), alloc: null,
  ask: SVCN.map((_, j) => ((i * 7 + j * 3) % 4 === 0) ? 0 : Math.round((120 + ((i * 37 + j * 53) % 780)) * 1000)) }));
const tot = j => items.reduce((a, x) => a + x.ask[j], 0);
const sc = { services: SVCN, items, order: items.map(x => x.id), disc: SVCN.map((_, j) => Math.round(tot(j) * 0.45)), mand: SVCN.map((_, j) => Math.round(tot(j) * 0.15)) };
const dir = mkdtempSync(join(tmpdir(), 'orbit-alloc-'));
process.on('exit', () => { try { rmSync(dir, { recursive: true, force: true }); } catch {} });
const board = (() => {
  const { ev } = boot({ html: readFileSync(FILE, 'utf8') });
  seed(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S);
    S.order.forEach(function(id, n){ if(n%3!==2) seedSplit(id); }); applyState(S); save(); 'ok'`);
  const f = join(dir, 'board.html'); writeFileSync(f, ev('buildSavedHtml()')); return f;
})();

let bad = 0;
const chk = (what, ok, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? '   ' + detail : ''}`); };
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const open = async (w, h, dialog = 'accept') => {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(() => { try { localStorage.setItem('spmtTheme', 'harbor'); localStorage.setItem('spmtMode', 'review'); } catch (e) {} });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.__dialog = dialog; p.on('dialog', d => (p.__dialog === 'dismiss' ? d.dismiss() : d.accept()));
  await p.goto('file://' + board);
  await p.waitForFunction(() => typeof render === 'function' && document.querySelectorAll('#list .row').length > 0, null, { timeout: 40000 });
  await p.waitForTimeout(300);
  return { p, ctx, errs };
};
const press = async (p, sel, wait = 250) => { const l = p.locator(sel).first(); await l.scrollIntoViewIfNeeded(); const bb = await l.boundingBox();
  if (!bb) throw new Error('nothing to press: ' + sel); await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(wait); };
const shot = async (p, name) => { if (SHOTS) await p.screenshot({ path: join(SHOTS, name + '.png') }); };
// what fits: the page does not scroll sideways, the view is inside the window, no box cuts its figure, no tile figure is cut
const fits = p => p.evaluate(() => {
  const se = document.scrollingElement, v = document.getElementById('allocView'), r = v.getBoundingClientRect(), W = document.documentElement.clientWidth;
  const cut = [...v.querySelectorAll('input.avin, .avt .v, .avtab b, .avgf b, .avro')].filter(e => e.getClientRects().length && e.scrollWidth > e.clientWidth + 1)
    .map(e => (e.getAttribute('data-k') || e.className) + ':' + (e.value || e.textContent).slice(0, 20));
  return { pageSide: se.scrollWidth - se.clientWidth, right: Math.round(r.right), W, shown: r.width > 0 && !v.hidden, cut: cut.slice(0, 6), nCut: cut.length,
    boxes: v.querySelectorAll('input.avin').length };
});

// ── A. the Sheet and One lane fit ───────────────────────────────────────────────────────────────────────────────────────
for (const [w, h] of [[1920, 1080], [1440, 900], [1024, 768]]) {
  try {
    const { p, ctx, errs } = await open(w, h);
    await press(p, '#uiNav_alloc', 600);
    const f = await fits(p);
    chk(`A · ${w}: Allocate opens from the left menu, its Sheet inside the window, no sideways scroll of the page`, f.shown && f.pageSide <= 0 && f.right <= f.W, JSON.stringify(f));
    chk(`A · ${w}: every box shows its whole figure, and every tile its whole figure`, f.boxes > 100 && f.nCut === 0, JSON.stringify(f.cut));
    const st = await p.evaluate(() => { const s = document.getElementById('avScroll'); const th = s.querySelector('thead'); const t0 = th.getBoundingClientRect().top - s.getBoundingClientRect().top;
      s.scrollTop = 600; s.scrollLeft = 400; const t1 = th.getBoundingClientRect().top - s.getBoundingClientRect().top;
      const name = s.querySelector('tbody tr[data-id] td.t'), nl = name.getBoundingClientRect().left - s.getBoundingClientRect().left;
      const pin = s.querySelector('thead tr.pin.left'), pv = pin.getBoundingClientRect();
      const r = { scrolled: s.scrollTop > 0, headTop0: Math.round(t0), headTop: Math.round(t1), nameLeft: Math.round(nl), pinIn: pv.top >= s.getBoundingClientRect().top - 1 && pv.bottom <= s.getBoundingClientRect().bottom };
      s.scrollTop = 0; s.scrollLeft = 0; return r; });
    chk(`A · ${w}: scrolled down and across, the column heads and the pinned lines stay in view and the requirement’s name stays at the left`,
      st.scrolled && Math.abs(st.headTop - st.headTop0) <= 2 && st.pinIn && Math.abs(st.nameLeft) <= 40, JSON.stringify(st));
    await shot(p, `sheet-${w}`);
    await press(p, '#allocView .avgrp button:nth-child(2)', 400);    // One lane
    const g = await fits(p);
    chk(`A · ${w}: One lane inside the window, no sideways scroll, nothing cut`, g.shown && g.pageSide <= 0 && g.right <= g.W && g.nCut === 0 && g.boxes > 20, JSON.stringify(g));
    await shot(p, `lane-${w}`);
    chk(`A · ${w}: nothing threw`, errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`A · ${w}: the section ran`, false, String(e.message || e).split('\n')[0].slice(0, 200)); }
}

// ── B. Present at 1920 ───────────────────────────────────────────────────────────────────────────────────────────────────
try {
  const { p, ctx, errs } = await open(1920, 1080);
  await press(p, '#uiNav_alloc', 600);
  await press(p, '#allocView .avbar .avgrp:nth-of-type(2) button:nth-child(2)', 400);
  const f = await fits(p);
  const ty = await p.evaluate(() => { const c = document.querySelector('#allocView .avs tbody td.tot'), r = document.querySelector('#allocView .avro');
    return { inputs: document.querySelectorAll('#allocView input, #allocView select').length, font: parseFloat(getComputedStyle(c).fontSize), ro: !!r,
      pres: document.getElementById('allocView').classList.contains('avpres') }; });
  chk('B · 1920: Present is the same Sheet, read only (no box, no field), in larger type', ty.pres && ty.ro && ty.inputs === 0 && ty.font >= 15, JSON.stringify(ty));
  chk('B · 1920: nothing cut, no sideways scroll of the page', f.pageSide <= 0 && f.nCut === 0 && f.right <= f.W, JSON.stringify(f));
  await shot(p, 'present-1920');
  await press(p, '#allocView .avbar .avgrp:nth-of-type(1) button:nth-child(2)', 400);
  await shot(p, 'present-lane-1920');
  chk('B · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
  await ctx.close();
} catch (e) { chk('B · the section ran', false, String(e.message || e).split('\n')[0].slice(0, 200)); }

// ── C, D, F. the keyboard, the clipboard, leaving ────────────────────────────────────────────────────────────────────────
try {
  const { p, ctx, errs } = await open(1440, 900);
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await press(p, '#uiNav_alloc', 600);
  const k0 = await p.evaluate(() => { const i = document.querySelector('#allocView input.avin'); i.focus(); return { k: i.getAttribute('data-k'), r: i.getAttribute('data-r'), c: i.getAttribute('data-c') }; });
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(80);
  const k1 = await p.evaluate(() => ({ k: document.activeElement.getAttribute('data-k'), r: document.activeElement.getAttribute('data-r'), c: document.activeElement.getAttribute('data-c') }));
  chk('C · ArrowDown moves to the same column one row down', k1.c === k0.c && +k1.r > +k0.r, JSON.stringify([k0, k1]));
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(80);
  const k2 = await p.evaluate(() => ({ r: document.activeElement.getAttribute('data-r'), c: document.activeElement.getAttribute('data-c') }));
  chk('C · ArrowRight (the figure selected) moves to the next box in the row', k2.r === k1.r && +k2.c > +k1.c, JSON.stringify(k2));
  await p.keyboard.press('ArrowUp'); await p.waitForTimeout(80);
  const k3 = await p.evaluate(() => document.activeElement.getAttribute('data-k'));
  await p.keyboard.type('123456'); await p.waitForTimeout(60);
  const mid = await p.evaluate(() => avChangeN());
  await p.keyboard.press('Tab'); await p.waitForTimeout(250);
  const after = await p.evaluate(k => ({ n: avChangeN(), v: AV.draft[k], active: document.activeElement && document.activeElement.getAttribute('data-k'), cls: document.querySelector('#allocView input.avin[data-k="' + CSS.escape(k) + '"]').className }), k3);
  chk('C · digits typed with the keyboard are not taken per keystroke; Tab takes them into the draft and the keyboard lands on the next box',
    mid === 0 && after.n === 1 && after.v === 123456 && !!after.active && after.active !== k3 && /chg/.test(after.cls), JSON.stringify({ mid, ...after }));
  // D. paste a block
  const tgt = await p.evaluate(() => { const i = [...document.querySelectorAll('#allocView input.avin')][8]; i.focus(); i.select(); return i.getAttribute('data-k'); });
  let via = 'clipboard';
  const okClip = await p.evaluate(async () => { try { await navigator.clipboard.writeText('1,000\t2,000\nabc\t3000\n'); return true; } catch (e) { return false; } });
  if (okClip) { await p.keyboard.press('Control+V'); await p.waitForTimeout(300); }
  let n = await p.evaluate(() => avChangeN());
  if (!okClip || n < 3) { via = 'a paste event (the clipboard was not offered)';
    await p.evaluate(k => { const i = document.querySelector('#allocView input.avin[data-k="' + CSS.escape(k) + '"]'); const dt = new DataTransfer(); dt.setData('text/plain', '1,000\t2,000\nabc\t3000\n');
      i.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); }, tgt); await p.waitForTimeout(300); }
  const pd = await p.evaluate(k => ({ n: avChangeN(), v: AV.draft[k], bad: Object.keys(AV.bad).length, said: document.getElementById('shareStat').textContent }), tgt);
  chk(`D · a block pasted (${via}) fills from the box pasted into: three figures taken, the cell that is not one named`,
    pd.n >= 4 && pd.v === 1000 && pd.bad === 1 && /row 2, column 1/.test(pd.said), JSON.stringify(pd));
  // F. leaving with a draft asks; Cancel stays
  p.__dialog = 'dismiss';
  await press(p, '#uiNav_req', 400);
  const lv = await p.evaluate(() => ({ mode: uiMode, n: avChangeN() }));
  chk('F · leaving Allocate with changes not saved asks; Cancel stays, the changes kept', lv.mode === 'alloc' && lv.n >= 4, JSON.stringify(lv));
  p.__dialog = 'accept';
  await p.evaluate(() => { avDiscardAll(); avDraw(); });
  chk('C, D, F · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
  await ctx.close();
} catch (e) { chk('C, D, F · the section ran', false, String(e.message || e).split('\n')[0].slice(0, 200)); }

// ── E. the mandatory switch and its box ──────────────────────────────────────────────────────────────────────────────────
for (const [w, h] of [[1440, 900], [1024, 768]]) {
  try {
    const { p, ctx, errs } = await open(w, h);
    await press(p, '#uiNav_alloc', 600);
    const st0 = await p.evaluate(() => JSON.stringify(MS.years));
    await press(p, '#allocView .avmand', 500);
    const bx = await p.evaluate(() => { const bg = document.getElementById('avMandPanel'), m = bg && bg.querySelector('.modal'), r = m && m.getBoundingClientRect();
      return { open: !!bg && dlgIsOpen(bg), inside: !!bg && bg.contains(document.activeElement), rows: bg ? bg.querySelectorAll('.mandlist tbody tr').length : 0,
        fits: !!r && r.left >= 0 && r.right <= innerWidth && r.top >= 0, side: !!m && m.scrollWidth <= m.clientWidth + 1 }; });
    chk(`E · ${w}: turning mandatory off opens the box, the keyboard inside it, the box inside the window`, bx.open && bx.inside && bx.rows >= 4 && bx.fits && bx.side, JSON.stringify(bx));
    await shot(p, `mandbox-${w}`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    const es = await p.evaluate(s0 => ({ open: dlgIsOpen(document.getElementById('avMandPanel')), same: JSON.stringify(MS.years) === s0, on: mandOn() }), st0);
    chk(`E · ${w}: Esc closes it and nothing changes`, !es.open && es.same && es.on, JSON.stringify(es));
    await press(p, '#allocView .avmand', 500);
    await press(p, '#avMandPanel input[value="move"]', 300);
    await press(p, '#avMandPanel .avbtns .btn.pri', 700);
    const off = await p.evaluate(() => ({ on: mandOn(), mandCols: /Mand/.test((document.querySelector('#allocView .avs thead tr.h2') || {}).textContent || 'Mand'),
      mBoxes: document.querySelectorAll('#allocView input.avin[data-k*="|m|"]').length, drawn: Object.keys(tiers()).filter(k => k !== '__rem').some(k => tiers()[k].mT > 0.5) }));
    chk(`E · ${w}: Move and turn off: off, no Mandatory column or box in the Sheet, nothing drawn as mandatory`, !off.on && !off.mandCols && off.mBoxes === 0 && !off.drawn, JSON.stringify(off));
    if (w === 1440) await shot(p, 'sheet-mandoff-1440');
    await press(p, '#allocView .avgrp button:nth-child(2)', 400);
    const ln = await p.evaluate(() => ({ mBoxes: document.querySelectorAll('#allocView input.avin[data-k*="|m|"]').length, head: document.querySelector('#allocView .avl thead').textContent }));
    chk(`E · ${w}: One lane has no Mandatory box or column`, ln.mBoxes === 0 && !/Mandatory/.test(ln.head), JSON.stringify(ln).slice(0, 200));
    await press(p, '#uiNav_fund', 600);
    const fd = await p.evaluate(() => {
      const hd = document.querySelector('#gridHead .mandc'), row = document.querySelector('#list .row'), cell = row && row.querySelector('.mandc');
      const cs = [...document.getElementById('gridHead').children].filter(e => getComputedStyle(e).display !== 'none');
      const rc = [...row.children].filter(e => getComputedStyle(e).display !== 'none');
      const al = cs.slice(0, 7).map((c, i) => rc[i] ? Math.abs(Math.round(c.getBoundingClientRect().left - rc[i].getBoundingClientRect().left)) : 99);
      const t = [...document.querySelectorAll('#uiKpis .k')].length;
      // the row template has exactly as many tracks as cells shown: a Mandatory track left in would leave an empty track at the end
      const tracks = getComputedStyle(row).gridTemplateColumns.trim().split(/\s+/).length;
      return { headHidden: !hd || getComputedStyle(hd).display === 'none', cellHidden: !cell || getComputedStyle(cell).display === 'none', align: al, tracks, cells: rc.length,
        side: document.scrollingElement.scrollWidth - document.scrollingElement.clientWidth, tiles: t, mandTile: !!document.querySelector('#posture .ppt.mand') };
    });
    chk(`E · ${w}: Fund mode: the Mandatory column is gone and every cell still lines up with its head; the Funding page has no Mandatory tile`,
      fd.headHidden && fd.cellHidden && fd.align.every(x => x <= 12) && fd.tracks === fd.cells && fd.side <= 0 && !fd.mandTile, JSON.stringify(fd));
    await press(p, '#uiNav_req', 600);
    const kp = await p.evaluate(() => ({ n: document.querySelectorAll('#uiKpis .k').length, cut: [...document.querySelectorAll('#uiKpis .k .v')].some(e => e.scrollWidth > e.clientWidth + 1) }));
    chk(`E · ${w}: the Requirements tiles are three, nothing cut`, kp.n === 3 && !kp.cut, JSON.stringify(kp));
    chk(`E · ${w}: nothing threw`, errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`E · ${w}: the section ran`, false, String(e.message || e).split('\n')[0].slice(0, 200)); }
}

await b.close();
console.log(bad ? `\n${bad} FAILING CHECK(S)` : '\nALL CHECKS PASSED');
process.exit(bad ? 1 : 0);
