// THE RECORD CARD, BY KEYBOARD AND POINTER (v2.22 W3; item 155 and the review of 21 Nov 2026, 149.18-149.50).
//
// What is about where things are, what has the keyboard, and what a real pointer does cannot be seen in jsdom; this checks it in
// Chromium, on the board tools/record-card-fixture.mjs builds, with real clicks (page.mouse at an element's centre) and real keys:
//   A. (149.19, 149.42) The pinned bar -- position, ‹ Previous, Next ›, and ✕ Close where the record slides -- and the name under
//      it stay at the top of the record however far it is scrolled; the record never scrolls sideways; a record opened after a
//      scrolled one starts at its top. Docked at 1600, sliding at 1440 and 1024.
//   B. (149.18) Sliding over the table: a click on another row moves the record to it (the scrim no longer takes it), and Next ›,
//      ‹ Previous, J and K step through the list with the keyboard left on the button pressed.
//   C. (149.23) In the By service table the Down and Up arrows go down and up a column, the figure typed applied on the way.
//   D. (149.27) A figure the board refuses is said inside the record, and the sentence goes once a figure is taken.
//   E. (149.28) Docked: a figure typed in the record and left by a click on another row -- the row is selected, the figure kept.
//   F. (149.33) Funding and History land just under the pinned head, Overview at the top, and the highlight follows the scroll.
//   G. (149.20) The record's ★ switch sets Mission Critical, by the row's own call, and says so on the row.
//   H. (149.50) The requirement's other years: FY28's button opens the same requirement in FY28.
//   I. (149.21) What is still needed opens the edit box at that field; Save and next saves and opens the next requirement.
//   J. (149.43) Every award block and its buttons sit inside the record, at 1024 sliding and 1600 docked.
//
//   node tools/record-card.mjs [--board FILE]
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
const chk = (what, ok, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? '   ' + detail : ''}`); };
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const open = async (w, h, docked) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(d => { try { localStorage.setItem('spmtTheme', 'harbor'); localStorage.setItem('prio27uiDock', d ? '1' : '0'); localStorage.setItem('prio27who', 'Pat'); } catch (e) {} }, docked);
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.accept());
  await p.goto('file://' + B.file);
  await p.waitForFunction(() => typeof render === 'function' && document.querySelectorAll('#list .row').length > 0, null, { timeout: 40000 });
  await p.waitForTimeout(300);
  return { p, ctx, errs };
};
// a real click at an element's centre
const press = async (p, sel, wait = 250) => { const l = p.locator(sel).first(); await l.scrollIntoViewIfNeeded(); const bb = await l.boundingBox();
  if (!bb) throw new Error('nothing to press: ' + sel); await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(wait); };
const rowTitle = id => `[id="row-${id}"] .tt`;
const cur = p => p.evaluate(() => curRow);
const head = p => p.evaluate(() => {
  const ins = document.getElementById('inspector'), ir = ins.getBoundingClientRect(), h = ins.querySelector('.rechead');
  const bar = ins.querySelector('.recbar'), nm = ins.querySelector('.rechead .insp-ttl');
  const vis = e => { if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.top >= ir.top - 1 && r.bottom <= ir.bottom + 1; };
  const btn = t => [...ins.querySelectorAll('.recbar button')].find(x => x.textContent.includes(t));
  return { scrollTop: ins.scrollTop, max: ins.scrollHeight - ins.clientHeight, side: ins.scrollWidth - ins.clientWidth,
    bar: vis(bar), name: vis(nm), barTop: bar ? Math.round(bar.getBoundingClientRect().top - ir.top) : null,
    prev: vis(btn('Previous')), next: vis(btn('Next')), close: !!btn('Close') && getComputedStyle(btn('Close')).display !== 'none' && vis(btn('Close')),
    pos: (ins.querySelector('.recpos') || {}).textContent || '' };
});

for (const [w, h, docked] of [[1600, 1000, true], [1440, 900, false], [1024, 768, false]]) {
  const lay = `${w} ${docked ? 'docked' : 'sliding'}`;
  try {
    const { p, ctx, errs } = await open(w, h, docked);
    // ── A. the pinned bar and the name, scrolled to the foot; no sideways scroll; a fresh record starts at the top
    await press(p, rowTitle('R002'));
    const a0 = await head(p);
    await p.evaluate(() => { const i = document.getElementById('inspector'); i.scrollTop = i.scrollHeight; });
    await p.waitForTimeout(150);
    const a1 = await head(p);
    chk(`A · ${lay}: the record scrolled to its foot still shows its bar (position, ‹ Previous, Next ›${docked ? '' : ', ✕ Close'}) and its name at the top`,
      a0.max > 50 && a1.scrollTop > 50 && a1.bar && a1.name && a1.prev && a1.next && (docked ? !a1.close : a1.close) && Math.abs(a1.barTop) <= 12 && /#2/.test(a1.pos), JSON.stringify(a1));
    chk(`A · ${lay}: the record never scrolls sideways (149.42)`, a0.side <= 0 && a1.side <= 0, `${a0.side}, ${a1.side}`);
    if (!docked) { await p.keyboard.press('Escape'); await p.waitForTimeout(250); }
    await press(p, rowTitle('R003'));
    chk(`A · ${lay}: a record opened after a scrolled one starts at its top (149.19)`, (await head(p)).scrollTop === 0 && await cur(p) === 'R003', String((await head(p)).scrollTop));
    if (!docked) {
      // ── B. a click on another row moves the record; Next, Previous, J and K
      await press(p, rowTitle('R006'));
      const bOpen = await p.evaluate(() => document.getElementById('inspector').classList.contains('open'));
      chk(`B · ${lay}: with the record open over the table, one click on another row moves the record to it (149.18)`, await cur(p) === 'R006' && bOpen, await cur(p));
      await press(p, '#inspector .recbar [data-step="1"]');
      const nb = await p.evaluate(() => [curRow, (document.activeElement || {}).getAttribute && document.activeElement.getAttribute('data-step')]);
      chk(`B · ${lay}: Next › is a button: R007, the keyboard still on Next ›`, nb[0] === 'R007' && nb[1] === '1', JSON.stringify(nb));
      await p.keyboard.press('Enter'); await p.waitForTimeout(200);
      chk(`B · ${lay}: Enter on it steps again: R008`, await cur(p) === 'R008', await cur(p));
      await press(p, '#inspector .recbar [data-step="-1"]');
      chk(`B · ${lay}: ‹ Previous: R007`, await cur(p) === 'R007', await cur(p));
      await p.keyboard.press('j'); await p.waitForTimeout(200);
      const j = await cur(p);
      await p.keyboard.press('k'); await p.keyboard.press('k'); await p.waitForTimeout(200);
      chk(`B · ${lay}: J and K take the same step: J to R008, K K to R006`, j === 'R008' && await cur(p) === 'R006', j + ' ' + await cur(p));
      // the dimmed page still gets its click: the Filter button opens its menu with the record open
      // (where Filter is not under the record itself: at 1024 the record covers it)
      const fl = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Filter/.test(x.textContent) && x.getBoundingClientRect().width > 0);
        return !!b && b.getBoundingClientRect().right < document.getElementById('inspector').getBoundingClientRect().left; });
      if (fl) {
        const before = await p.evaluate(() => document.querySelectorAll('.uiPop.open, .mdd.open, .menu.open').length);
        await press(p, 'button:has-text("Filter")');
        const after = await p.evaluate(() => document.querySelectorAll('.uiPop.open, .mdd.open, .menu.open').length);
        chk(`B · ${lay}: with the record open, one click on Filter opens it (it only closed the record)`, after > before, `${before} -> ${after}`);
        await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      }
    }
    // ── C. Down and Up go down a column
    if (!docked) { await p.keyboard.press('Escape'); await p.waitForTimeout(250); }
    await press(p, rowTitle('R002'));
    await press(p, '#inspector .insp-split input[data-col="q"][data-si="0"]', 100);
    await p.keyboard.press('Control+a'); await p.keyboard.type('3,700,000');
    await p.keyboard.press('ArrowDown'); await p.waitForTimeout(300);
    const c1 = await p.evaluate(() => ({ ask: itemById('R002').ask[0], col: document.activeElement.getAttribute('data-col'), si: document.activeElement.getAttribute('data-si'), cur: curRow }));
    await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp'); await p.waitForTimeout(200);
    const c2 = await p.evaluate(() => [document.activeElement.getAttribute('data-col'), document.activeElement.getAttribute('data-si')]);
    chk(`C · ${lay}: Down from USAF's Requirement applies 3,700,000 and goes to ANG's Requirement; Down, Up, Up back to USAF (149.23)`,
      c1.ask === 3700000 && c1.col === 'q' && c1.si === '1' && c1.cur === 'R002' && c2[0] === 'q' && c2[1] === '0', JSON.stringify([c1, c2]));
    await press(p, '#inspector .insp-split input[data-col="d"][data-si="0"]', 100);
    await p.keyboard.press('ArrowDown'); await p.waitForTimeout(200);
    chk(`C · ${lay}: and down the Disc column`, await p.evaluate(() => document.activeElement.getAttribute('data-col') + document.activeElement.getAttribute('data-si')) === 'd1');
    // ── D. a refused figure, said in the record, and gone once a figure is taken
    await press(p, '#inspector .insp-split input[data-col="q"][data-si="2"]', 100);
    await p.keyboard.press('Control+a'); await p.keyboard.type('12x'); await p.keyboard.press('Tab'); await p.waitForTimeout(300);
    const d1 = await p.evaluate(() => { const m = document.getElementById('recMsg'); return { said: m ? m.textContent : null, shown: !!(m && m.getBoundingClientRect().height > 0) }; });
    chk(`D · ${lay}: "12x" refused: the sentence is inside the record (149.27)`, d1.shown && /was not changed/.test(d1.said || ''), JSON.stringify(d1));
    await press(p, '#inspector .insp-split input[data-col="q"][data-si="2"]', 100);
    await p.keyboard.press('Control+a'); await p.keyboard.type('430,000'); await p.keyboard.press('Tab'); await p.waitForTimeout(300);
    const d2 = await p.evaluate(() => ({ said: (document.getElementById('recMsg') || {}).textContent, ask: itemById('R002').ask[2] }));
    chk(`D · ${lay}: a figure taken after it clears the sentence`, d2.ask === 430000 && !d2.said, JSON.stringify(d2));
    if (docked) {
      // ── E. docked: type, then click another row
      await press(p, '#inspector .insp-split input[data-col="q"][data-si="3"]', 100);
      await p.keyboard.press('Control+a'); await p.keyboard.type('1,250,000');
      await press(p, rowTitle('R006'), 400);
      chk(`E · ${lay}: a figure typed and left by a click on another row: the row is selected, the figure kept (149.28)`,
        await cur(p) === 'R006' && await p.evaluate(() => itemById('R002').ask[3]) === 1250000, await cur(p));
    }
    // ── F. the strip's jumps
    if (!docked) { await p.keyboard.press('Escape'); await p.waitForTimeout(250); }
    await press(p, rowTitle('R001'));
    const tab = k => p.evaluate(k => { const b = document.querySelector('#inspector .uiDTabs [data-k="' + k + '"]'); return b && b.getAttribute('aria-pressed'); }, k);
    const under = sel => p.evaluate(sel => { const i = document.getElementById('inspector'), h = i.querySelector('.rechead'), e = i.querySelector(sel);
      return e ? Math.round(e.getBoundingClientRect().top - h.getBoundingClientRect().bottom) : null; }, sel);
    await press(p, '#inspector .uiDTabs [data-k="funding"]', 500);
    const f1 = await under('.insp-lbl.svclbl'), ft = await tab('funding');
    chk(`F · ${lay}: Funding lands just under the pinned head, its heading and the table's showing, and is highlighted (149.33)`, f1 !== null && f1 >= 0 && f1 <= 14 && ft === 'true', `${f1}px, ${ft}`);
    await press(p, '#inspector .uiDTabs [data-k="history"]', 500);
    chk(`F · ${lay}: History is highlighted, and its section is on screen`, await tab('history') === 'true' && await p.evaluate(() => { const i = document.getElementById('inspector'), e = i.querySelector('.uiDHist'); const r = e.getBoundingClientRect(), q = i.getBoundingClientRect(); return r.top < q.bottom && r.bottom > q.top; }));
    await press(p, '#inspector .uiDTabs [data-k="overview"]', 500);
    chk(`F · ${lay}: Overview goes back to the top`, (await head(p)).scrollTop === 0 && await tab('overview') === 'true');
    await p.mouse.move(w - 100, 400); await p.mouse.wheel(0, 4000); await p.waitForTimeout(700);
    chk(`F · ${lay}: scrolled to the foot by hand, the highlight follows to History`, await tab('history') === 'true', await tab('history'));
    await p.mouse.wheel(0, -8000); await p.waitForTimeout(700);
    chk(`F · ${lay}: and back to Overview at the top`, await tab('overview') === 'true', await tab('overview'));
    // ── G. the ★ switch
    const g0 = await p.evaluate(() => !!S.mc.R001);
    await press(p, '#inspector .recmc');
    const g1 = await p.evaluate(() => ({ mc: !!S.mc.R001, row: document.querySelector('#row-R001 .mcb').getAttribute('aria-pressed'), sw: document.querySelector('#inspector .recmc').getAttribute('aria-pressed') }));
    chk(`G · ${lay}: the record's ★ switch sets Mission Critical, and the row says so (149.20)`, g0 === true && g1.mc === false && g1.row === 'false' && g1.sw === 'false', JSON.stringify(g1));
    await press(p, '#inspector .recmc');
    // ── J. the award blocks fit
    for (const id of ['R002', 'R004']) {
      if (!docked) { await p.keyboard.press('Escape'); await p.waitForTimeout(250); }
      await press(p, rowTitle(id));
      const jx = await p.evaluate(() => { const i = document.getElementById('inspector'), r = i.getBoundingClientRect().left + i.clientWidth, out = [];
        i.querySelectorAll('.awdblk button, .awdblk input, .awdblk td, .awdblk th, .awdblk .awdorig').forEach(e => { const b = e.getBoundingClientRect(); if (b.width && b.right > r + 1) out.push((e.className || e.tagName) + ' ' + Math.round(b.right) + '>' + Math.round(r)); });
        return { n: i.querySelectorAll('.awdblk button, .awdblk input').length, out }; });
      chk(`J · ${lay}: every award control and figure of ${id} is inside the record (149.43)`, jx.n > 3 && !jx.out.length, JSON.stringify(jx).slice(0, 200));
    }
    // ── H. the other years
    if (!docked) { await p.keyboard.press('Escape'); await p.waitForTimeout(250); }
    await press(p, rowTitle('R001'));
    const hy = await p.evaluate(() => [...document.querySelectorAll('#inspector .recyrs .recyr')].map(e => e.tagName + ':' + e.textContent));
    await press(p, '#inspector .recyrs button.recyr', 600);
    const hx = await p.evaluate(() => [MS.cur, curRow, (document.querySelector('#inspector .recyrs .recyr.cur') || {}).textContent]);
    chk(`H · ${lay}: the requirement by year, FY27 on screen and FY28 a button; FY28 opens R001 there (149.50)`,
      hy.length === 2 && /SPAN:FY27/.test(hy[0]) && /BUTTON:FY28/.test(hy[1]) && hx[0] === 2028 && hx[1] === 'R001' && /FY28/.test(hx[2] || ''), JSON.stringify([hy, hx]));
    await p.evaluate(() => { switchYear(2027); render(); });
    // ── I. what is still needed, and Save and next
    if (!docked) { await p.keyboard.press('Escape'); await p.waitForTimeout(250); }
    await press(p, rowTitle('R002'));
    await press(p, '#inspector .recneed button:has-text("Obligation category")', 400);
    const i1 = await p.evaluate(() => [erOn() && erOpen, (document.activeElement || {}).id]);
    chk(`I · ${lay}: "Obligation category" under the three buttons opens the edit box at it (149.21)`, i1[0] === 'R002' && i1[1] === 'erOb', JSON.stringify(i1));
    await p.fill('#erNote', 'Checked by the record-card tool');
    await press(p, '#erSaveNext', 400);
    const i2 = await p.evaluate(() => [((S.notes || {}).R002 || ''), erOn() && erOpen]);
    chk(`I · ${lay}: Save and next saves the note and opens the next requirement in the box`, i2[0] === 'Checked by the record-card tool' && i2[1] === 'R003', JSON.stringify(i2));
    await p.evaluate(() => { erClose(); });
    chk(`· ${lay}: nothing threw`, errs.length === 0, errs.slice(0, 3).join(' | '));
    await ctx.close();
  } catch (e) { chk(`${lay}: the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 160)); }
}
await b.close();
console.log(bad ? `\n${bad} record check(s) failed\n` : '\nThe record card holds its bar and name, moves to a row clicked, steps by button and key, goes down a column, says a refusal, keeps a click after typing, lands its jumps, sets ★, opens another year, and fits its awards\n');
process.exit(bad ? 1 : 0);
