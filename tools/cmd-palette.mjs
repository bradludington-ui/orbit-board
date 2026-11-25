// CTRL K, THE LIST'S SEARCH AND START HERE, IN A REAL BROWSER WITH REAL KEYS (v2.22 W2, contract §1.2; Brad, 25 Nov 2026).
// jsdom has no layout and fires no browser shortcut, so what is about keys, focus, the window and what shows on it is held here,
// on a populated board (tools/ia-fixture.mjs) in Harbor, and on the program with no board in it:
//
//   A. Ctrl K opens the palette from the page and from inside a field, the keyboard in its search; ⌘K (Meta) too.
//   B. Typing finds requirements; Down and Up move the active option (named to the search box); Enter selects the requirement, scrolls
//      its row into the window and opens its RECORD; the palette closes.
//   C. Tab and Shift+Tab never take the keyboard out of the open palette.
//   D. Esc closes it and the keyboard goes back where it was (the list's search box, a left-menu entry).
//   E. "> change journal" and Enter: Audit's own item runs, the journal opens with the keyboard in it.
//   F. The list's search: the ✕ is 24×24 and inside the box; scrolled down with a search on, the note under the header shows what is
//      searched, inside the window and below the header; its Clear the search clears; scrolled back up the note goes.
//   G. The palette fits the window at 1440, 1024 and 390 wide; nothing scrolls sideways.
//   H. The program with no board in it: one Start here block with its three buttons on screen, whole, at 1440 and 1024; the opening
//      line waits behind the Message button.
//
//   node tools/cmd-palette.mjs [--board FILE] [--shots DIR]     (--shots writes the screenshots the build notes keep)
import { chromium } from 'playwright-core';
import { resolve, join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { buildPopulated } from './ia-fixture.mjs';
import { CHROME } from './chrome.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const bi = args.indexOf('--board'), si = args.indexOf('--shots');
const FILE = resolve(bi >= 0 ? args[bi + 1] : join(ROOT, 'prioritization-board-grid.html'));
const SHOTS = si >= 0 ? resolve(args[si + 1]) : '';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const LIVE = buildPopulated(FILE);

let bad = 0;
const J = JSON.stringify;
const chk = (what, ok, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${!ok && detail ? '   ' + detail : ''}`); };
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const open = async (file, w = 1440, h = 900) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(() => { try { localStorage.setItem('spmtTheme', 'harbor'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.dismiss());
  await p.goto('file://' + file);
  await p.waitForFunction(() => typeof render === 'function' && document.documentElement.classList.contains('ui-on'), null, { timeout: 40000 });
  await p.waitForTimeout(400);
  return { p, ctx, errs };
};
const st = p => p.evaluate(() => ({ open: typeof cmdIsOpen === 'function' && cmdIsOpen(), focus: document.activeElement && document.activeElement.id,
  inBox: !!(document.activeElement && document.activeElement.closest && document.activeElement.closest('#cmdPanel')) }));
const shot = async (p, n) => { if (SHOTS) await p.screenshot({ path: join(SHOTS, n) }); };

// ── A-E, G at 1440 ──────────────────────────────────────────────────────────────────────────────────────────────────────────
for (const w of [1440, 1024]) {
  const { p, ctx, errs } = await open(LIVE, w);
  try {
    await p.locator('#uiNav_req').focus();
    await p.keyboard.press('Control+k'); await p.waitForTimeout(200);
    chk(`A ${w} · Ctrl K from the page opens the palette with the keyboard in its search`, J(await st(p)) === J({ open: true, focus: 'cmdQ', inBox: true }), J(await st(p)));
    await p.keyboard.type('OGC Engine'); await p.waitForTimeout(200);
    const r1 = await p.evaluate(() => ({ n: CMD.rows.filter(r => r.kind === 'req').length, act: document.getElementById('cmdQ').getAttribute('aria-activedescendant'),
      t1: (document.querySelector('#cmdO_0 .cmd-t1') || {}).textContent }));
    chk(`B ${w} · typing finds the requirements, the first one active`, r1.n >= 2 && r1.act === 'cmdO_0' && /Engine Module/.test(r1.t1 || ''), J(r1));
    await shot(p, `palette-${w}.png`);
    await p.keyboard.press('ArrowDown'); await p.waitForTimeout(80);
    const pick = await p.evaluate(() => ({ act: document.getElementById('cmdQ').getAttribute('aria-activedescendant'), id: CMD.rows[1] && CMD.rows[1].id,
      on: (document.querySelector('#cmdList .cmd-o.on') || {}).id }));
    chk(`B ${w} · Down moves to the second, named to the search box`, pick.act === 'cmdO_1' && pick.on === 'cmdO_1', J(pick));
    // C. the keyboard stays in the box
    const seen = [];
    for (let i = 0; i < 6; i++) { await p.keyboard.press(i < 3 ? 'Tab' : 'Shift+Tab'); seen.push((await st(p)).inBox); }
    chk(`C ${w} · Tab and Shift+Tab never leave the open palette`, seen.every(Boolean), J(seen));
    await p.locator('#cmdQ').focus();
    await p.keyboard.press('Enter'); await p.waitForTimeout(500);
    const g = await p.evaluate(id => { const r = document.getElementById('row-' + id), R = r ? r.getBoundingClientRect() : null;
      return { open: cmdIsOpen(), cur: curRow, inWin: !!(R && R.top >= 0 && R.bottom <= innerHeight),
        rec: !!(document.getElementById('inspector') && document.getElementById('inspector').textContent.indexOf(dispTitle(itemById(id)).slice(0, 12)) >= 0) }; }, pick.id);
    chk(`B ${w} · Enter selects that requirement: its row in the window, its RECORD on screen, the palette closed`, J(g) === J({ open: false, cur: pick.id, inWin: true, rec: true }), J(g));
    // D. Esc gives the keyboard back: from the list's search box
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);   // the record's drawer, where it slid over
    await p.locator('#q').focus();
    await p.keyboard.press('Control+k'); await p.waitForTimeout(200);
    chk(`A ${w} · Ctrl K from inside the list's search box opens it too`, (await st(p)).focus === 'cmdQ', J(await st(p)));
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    chk(`D ${w} · Esc closes it, and the keyboard is back in the list's search box`, J(await st(p)) === J({ open: false, focus: 'q', inBox: false }), J(await st(p)));
    await p.keyboard.press('Meta+k'); await p.waitForTimeout(200);
    chk(`A ${w} · ⌘K opens it`, (await st(p)).open === true, J(await st(p)));
    // E. an action runs from its own menu item
    await p.keyboard.type('>change journal'); await p.waitForTimeout(150);
    await p.keyboard.press('Enter'); await p.waitForTimeout(500);
    const e = await p.evaluate(() => ({ pal: cmdIsOpen(), jrnl: !!jrnlOpen, inJ: !!(document.activeElement && document.activeElement.closest && document.activeElement.closest('#jrnlPanel')) }));
    chk(`E ${w} · "> change journal" and Enter: the journal opens (Audit's own item), the keyboard in it`, J(e) === J({ pal: false, jrnl: true, inJ: true }), J(e));
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    chk(`E ${w} · Esc closes the journal back onto Audit, where the item lives`, (await p.evaluate(() => document.activeElement && document.activeElement.id)) === 'uiNav_aud',
      await p.evaluate(() => document.activeElement && document.activeElement.id));
    // G. the palette fits the window
    await p.keyboard.press('Control+k'); await p.keyboard.type('o'); await p.waitForTimeout(200);
    const f = await p.evaluate(() => { const m = document.querySelector('#cmdPanel .modal').getBoundingClientRect();
      return { inside: m.left >= 0 && m.right <= innerWidth && m.top >= 0 && m.bottom <= innerHeight, side: document.documentElement.scrollWidth <= innerWidth,
        rows: [...document.querySelectorAll('#cmdList .cmd-o')].slice(0, 4).every(o => { const r = o.getBoundingClientRect(); return r.height >= 24 && r.width > 200; }) }; });
    chk(`G ${w} · the palette is inside the window, nothing scrolls sideways, its rows at least 24px high`, J(f) === J({ inside: true, side: true, rows: true }), J(f));
    await p.keyboard.press('Escape');
    chk(`${w} · nothing threw`, errs.length === 0, errs.slice(0, 2).join(' | '));
  } catch (x) { chk(`${w} · the section ran`, false, String(x.message || x).split('\n')[0].slice(0, 200)); }
  await ctx.close();
}

// ── F. the list's search, scrolled away ───────────────────────────────────────────────────────────────────────────────────
{
  const { p, ctx, errs } = await open(LIVE, 1440, 800);
  try {
    await p.locator('#q').click(); await p.keyboard.type('OGC'); await p.waitForTimeout(300);
    const c = await p.evaluate(() => { const b = document.getElementById('qClr'), r = b.getBoundingClientRect(), q = document.getElementById('q').getBoundingClientRect();
      return { shown: !b.hidden, size: r.width >= 24 && r.height >= 24, inside: r.left >= q.left && r.right <= q.right + 0.5, note: document.getElementById('qAway').hidden }; });
    chk('F · a search on: the ✕ is shown inside its box, 24×24 at least; the box is in sight, so no note under the header', J(c) === J({ shown: true, size: true, inside: true, note: true }), J(c));
    await p.evaluate(() => window.scrollTo(0, 1600)); await p.waitForTimeout(300);
    const n = await p.evaluate(() => { const a = document.getElementById('qAway'), r = a.getBoundingClientRect();
      const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdrH')) || 0;
      return { shown: !a.hidden, below: r.top >= top - 1 && r.top <= top + 40, text: a.textContent.replace(/\s+/g, ' ').trim().slice(0, 24),
        hdr: (() => { const h = document.querySelector('.gridhead').getBoundingClientRect(); return h.top >= r.bottom - 1; })() }; });
    chk('F · scrolled down: the note shows under the header, the column heads below it', J(n) === J({ shown: true, below: true, text: 'Searching for “ogc” — 36', hdr: true }), J(n));
    await shot(p, 'search-away-1440.png');
    await p.locator('#qAway button').click(); await p.waitForTimeout(300);
    const after = await p.evaluate(() => ({ q: document.getElementById('q').value, rows: document.querySelectorAll('#list .row').length, note: document.getElementById('qAway').hidden }));
    chk('F · its Clear the search clears: every row back, the note gone', J(after) === J({ q: '', rows: 36, note: true }), J(after));
    await p.locator('#q').fill('zzzz'); await p.locator('#q').dispatchEvent('input'); await p.waitForTimeout(300);
    const nm = await p.evaluate(() => ({ cut: document.querySelectorAll('#list .cutline').length, say: (document.querySelector('#list .listempty') || {}).textContent }));
    chk('F · a search that finds nothing: no cutline left alone on screen, and No requirements match with its way back', nm.cut === 0 && /^No requirements match the search “zzzz”\.Clear the search$/.test(nm.say || ''), J(nm));
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    chk('F · Esc in the box clears it', (await p.evaluate(() => document.querySelectorAll('#list .row').length)) === 36);
    chk('F · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
  } catch (x) { chk('F · the section ran', false, String(x.message || x).split('\n')[0].slice(0, 200)); }
  await ctx.close();
}

// ── G at 390: the palette on a phone's width ──────────────────────────────────────────────────────────────────────────────
{
  const { p, ctx, errs } = await open(LIVE, 390, 800);
  try {
    await p.keyboard.press('Control+k'); await p.keyboard.type('engine'); await p.waitForTimeout(250);
    const f = await p.evaluate(() => { const m = document.querySelector('#cmdPanel .modal').getBoundingClientRect();
      return { open: cmdIsOpen(), inside: m.left >= 0 && m.right <= innerWidth + 0.5, side: document.documentElement.scrollWidth <= innerWidth }; });
    chk('G 390 · the palette opens inside a phone’s width, nothing scrolls sideways', J(f) === J({ open: true, inside: true, side: true }), J(f));
    chk('G 390 · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
  } catch (x) { chk('G 390 · the section ran', false, String(x.message || x).split('\n')[0].slice(0, 200)); }
  await ctx.close();
}

// ── H. the program with no board in it ────────────────────────────────────────────────────────────────────────────────────
for (const w of [1440, 1024]) {
  const { p, ctx, errs } = await open(FILE, w);
  try {
    const h = await p.evaluate(() => { const s = document.querySelector('#driveBar .starthere');
      if (!s) return { block: false };
      const W = innerWidth, bs = [...s.querySelectorAll('button')];
      return { block: true, n: bs.length, whole: bs.every(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.left >= 0 && r.right <= W && x.scrollWidth <= x.clientWidth + 1; }),
        fresh: document.getElementById('statWrap').classList.contains('fresh'), side: document.documentElement.scrollWidth <= W }; });
    chk(`H ${w} · the program: one Start here block, its three buttons whole on screen; the opening line waits; nothing scrolls sideways`,
      J(h) === J({ block: true, n: 3, whole: true, fresh: false, side: true }), J(h));
    await shot(p, `start-here-${w}.png`);
    chk(`H ${w} · nothing threw`, errs.length === 0, errs.slice(0, 2).join(' | '));
  } catch (x) { chk(`H ${w} · the section ran`, false, String(x.message || x).split('\n')[0].slice(0, 200)); }
  await ctx.close();
}

// the Add box for the notes' screenshots (not a check): PSM chosen, the form part filled
if (SHOTS) for (const w of [1440, 1024]) {
  const { p, ctx } = await open(LIVE, w);
  try {
    await p.evaluate(() => { setPmoFilter('PSM'); toggleAdd(); const s = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };
      s('arEvent', 'Depot field team travel, FY28'); s('arV0', '250000'); });
    await p.waitForTimeout(300); await shot(p, `add-box-${w}.png`);
  } catch (x) {}
  await ctx.close();
}

await b.close();
console.log(bad ? `\n${bad} CHECK(S) FAILED` : '\nCtrl K, the search and Start here hold');
process.exit(bad ? 1 : 0);
