// THE KEYBOARD CAN DO WHAT THE MOUSE CAN (v1.91, items 29 and 30). In Chromium, on a populated board.
//
//   A. A long warning is cut off on one line; the Message button is reached with Tab, opens it whole with
//      Enter or Space, and Esc puts it back with focus left on the button.
//   B. ✕ hides it and hands focus to the button, which then brings it back whole. Hidden, the message is
//      still in the accessibility tree -- a role=status region that is display:none says nothing at all.
//   C. The quiet start-up line waits behind the button and is in the accessibility tree too.
//   D. The RECORD panel's CCaR record, PID and rename are buttons, reached and used from the keyboard alone:
//      each one changes its field. (Before v1.91 nothing but a mouse could change either figure.)
//      The lane-walk "pin these figures" chip in the same panel is a button too, and pins from the keyboard.
//   E. The "work kept aside" put-back in the save state is a button, not a link with no address.
//   F. The five workspace modes are buttons in a labelled group, one pressed; no ARIA tabs are claimed.
//      Tab and Enter change the mode, a reload keeps it, and a stored value that is not a mode opens Review.
//
//   node tools/keyboard-reach.mjs [--board FILE]
import { chromium } from 'playwright-core';
import { resolve, join } from 'node:path';
import { buildPopulated } from './ia-fixture.mjs';
import { CHROME } from './chrome.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const bi = args.indexOf('--board');
const FILE = resolve(bi >= 0 ? args[bi + 1] : join(ROOT, 'prioritization-board-grid.html'));
const LIVE = buildPopulated(FILE);

let bad = 0;
const chk = (what, ok, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? '   ' + detail : ''}`); };
const LONG = '⚠ The shared folder holds a newer save by K Jones (10:42). Your work is kept aside, not lost: '
  + 'File › Put back work kept aside restores it. Nothing was written over.';

const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const open = async (mode, w = 1440) => {
  const ctx = await b.newContext({ viewport: { width: w, height: 1000 } });
  await ctx.addInitScript(m => { try { localStorage.setItem('spmtTheme', 'harbor'); if (m !== null) localStorage.setItem('spmtMode', m); } catch (e) {} }, mode === undefined ? null : mode);
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + LIVE);
  await p.waitForFunction(() => typeof render === 'function' && document.querySelectorAll('#list .row').length > 0, null, { timeout: 40000 });
  await p.waitForTimeout(300);
  const cdp = await ctx.newCDPSession(p);
  const statusInTree = async () => (await cdp.send('Accessibility.getFullAXTree')).nodes
    .some(n => n.role && n.role.value === 'status' && !n.ignored);
  return { p, ctx, errs, statusInTree };
};
// Tab forward from a starting control until one matches, or give up: what a keyboard user does.
const tabTo = async (p, from, match, max = 40) => {
  await p.focus(from);
  for (let i = 0; i < max; i++) {
    if (await p.evaluate(m => { const a = document.activeElement; return !!(a && a.matches(m)); }, match)) return i;
    await p.keyboard.press('Tab');
  }
  return -1;
};

console.log('\n' + FILE.split('/').pop());

// ── A-C. THE STATUS MESSAGE ────────────────────────────────────────────────────────────────────────────
{
  try {
    const { p, ctx, errs, statusInTree } = await open('review');
    await p.evaluate(t => setStat(esc(t)), LONG);
    await p.waitForTimeout(100);
    const cut = await p.evaluate(() => { const s = document.getElementById('shareStat'); return s.scrollWidth > s.clientWidth + 1; });
    chk('A · a long warning is cut off on its one line', cut);
    const steps = await tabTo(p, '#q', '#statBtn');
    chk('A · the Message button is reached with Tab from the search box', steps > 0, steps > 0 ? `${steps} Tab(s)` : 'never reached');
    const st = () => p.evaluate(() => { const w = document.getElementById('statWrap'), s = document.getElementById('shareStat'), bt = document.getElementById('statBtn');
      return { big: w.classList.contains('big'), line: w.classList.contains('fresh'), exp: bt.getAttribute('aria-expanded'), label: bt.textContent,
        whole: s.scrollWidth <= s.clientWidth + 1 && s.getBoundingClientRect().height > 20, focus: document.activeElement && document.activeElement.id }; });
    await p.keyboard.press('Enter'); await p.waitForTimeout(80);
    let r = await st();
    chk('A · Enter opens it whole, and the button says it is open', r.big && r.whole && r.exp === 'true' && r.label === 'Less', JSON.stringify(r));
    await p.keyboard.press('Escape'); await p.waitForTimeout(80);
    r = await st();
    chk('A · Esc puts it back on one line and leaves focus on the button', !r.big && r.line && r.exp === 'false' && r.focus === 'statBtn', JSON.stringify(r));
    await p.keyboard.press(' '); await p.waitForTimeout(80);
    r = await st();
    chk('A · Space opens it too (a real button)', r.big && r.exp === 'true');
    // Esc pressed somewhere else belongs to whatever is there (a box, the drawer), and must not pull focus up
    await p.focus('#q'); await p.keyboard.press('Escape'); await p.waitForTimeout(80);
    r = await st();
    chk('A · Esc pressed elsewhere leaves focus where it is', r.focus === 'q' && r.big, JSON.stringify(r));
    await p.focus('#statBtn');
    // ✕, from the keyboard
    await p.keyboard.press('Tab');
    const onX = await p.evaluate(() => document.activeElement && document.activeElement.classList.contains('statx'));
    await p.keyboard.press('Enter'); await p.waitForTimeout(80);
    r = await st();
    chk('B · ✕ is reached and hides it, handing focus to the button', onX && !r.big && !r.line && r.focus === 'statBtn' && r.label === 'Message', JSON.stringify(r));
    chk('B · hidden, the message is still in the accessibility tree', await statusInTree());
    await p.keyboard.press('Enter'); await p.waitForTimeout(80);
    r = await st();
    chk('B · and the button brings it back, whole', r.big && r.whole, JSON.stringify(r));
    // the quiet start-up line
    await p.evaluate(() => { _statQuiet = true; setStat('Opened with the saved board state.'); _statQuiet = false; });
    await p.waitForTimeout(80);
    r = await st();
    const shown = await p.evaluate(() => !document.getElementById('statBtn').hidden);
    chk('C · the quiet start-up line waits behind the button', !r.line && !r.big && shown && r.label === 'Message', JSON.stringify(r));
    chk('C · and is in the accessibility tree', await statusInTree());
    chk('A-C · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`A-C · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

// ── D. THE RECORD PANEL'S CCaR RECORD, PID AND RENAME, FROM THE KEYBOARD ────────────────────────────────
{
  try {
    const { p, ctx, errs } = await open('review');
    const answers = [];
    p.on('dialog', d => d.type() === 'prompt' ? d.accept(answers.shift() || '') : d.accept());
    const id = await p.evaluate(() => gridRows()[1].id.replace(/^row-/, ''));
    await p.click('#row-' + id + ' .t1'); await p.waitForTimeout(250);
    for (const [what, sel, value, read] of [
      ['CCaR record', '#inspector [onclick^="editCcar("]', 'JSF9911', id => S.ccar[id]],
      ['PID', '#inspector [onclick^="editPid("]', 'PID7733', id => S.pid[id]],
      ['rename', '#inspector [onclick^="editTitle("]', 'Renamed from the keyboard', id => S.titles[id]]]) {
      const shape = await p.evaluate(s => { const e = document.querySelector(s); return e ? { tag: e.tagName, tab: e.tabIndex } : null; }, sel);
      // a keyboard user arriving in the panel starts at its top (the rename pencil sits above the editors)
      await p.evaluate(() => { const i = document.getElementById('inspector'); i.setAttribute('tabindex', '-1'); });
      const steps = await tabTo(p, '#inspector', sel, 60);
      answers.push(value);
      if (steps >= 0) { await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
      const got = await p.evaluate(({ id, src }) => (new Function('id', 'return (' + src + ')(id)'))(id), { id, src: read.toString() });
      chk(`D · ${what} is a button, reached with Tab and changed from the keyboard`, !!shape && shape.tag === 'BUTTON' && steps >= 0 && got === value,
        `${shape ? shape.tag : 'missing'} · ${steps >= 0 ? steps + ' Tab(s)' : 'never reached'} · now ${JSON.stringify(got)}`);
      // the next field is reached from the panel's top again; put the panel back on screen after the prompt
      await p.click('#row-' + id + ' .t1'); await p.waitForTimeout(200);
    }
    chk('D · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`D · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

// ── D2. THE LANE-WALK PIN CHIP, FROM THE KEYBOARD ──────────────────────────────────────────────────────
{
  try {
    const { p, ctx, errs } = await open('review');
    // every fixture requirement is pinned, so one is put back on the automatic lane walk first
    const id = await p.evaluate(() => { const i = gridRows()[2].id.replace(/^row-/, ''); delete S.fsrc[i]; render(); return i; });
    {
      await p.click('#row-' + id + ' .t1'); await p.waitForTimeout(250);
      const sel = '#inspector [onclick^="setFsrc("]';
      const tag = await p.evaluate(s => { const e = document.querySelector(s); return e ? e.tagName : 'missing'; }, sel);
      await p.evaluate(() => document.getElementById('inspector').setAttribute('tabindex', '-1'));
      const steps = await tabTo(p, '#inspector', sel, 60);
      if (steps >= 0) { await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
      const r = await p.evaluate(({ id, s }) => ({ fsrc: ((S.fsrc || {})[id] || {}).m || '', chip: !!document.querySelector(s) }), { id, s: sel });
      chk('D2 · the lane-walk pin chip is a button, reached with Tab and used with Enter', tag === 'BUTTON' && steps >= 0 && r.fsrc === 'split' && !r.chip,
        `${tag} · ${steps >= 0 ? steps + ' Tab(s)' : 'never reached'} · ${JSON.stringify(r)}`);
    }
    chk('D2 · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`D2 · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

// ── E. THE "WORK KEPT ASIDE" PUT-BACK ─────────────────────────────────────────────────────────────────
{
  try {
    const { p, ctx } = await open('review');
    const r = await p.evaluate(() => { _keptMeta = { t: Date.now() }; syncBtns();
      const e = document.querySelector('#saveState [onclick^="keptPutBack("]');
      if (!e) return null; e.focus(); return { tag: e.tagName, focused: document.activeElement === e }; });
    chk('E · the kept-aside put-back is a button the keyboard reaches', !!r && r.tag === 'BUTTON' && r.focused, JSON.stringify(r));
    chk('E · and the save state itself is plain text, not a click target', await p.evaluate(() => !document.getElementById('saveState').hasAttribute('onclick')));
    await ctx.close();
  } catch (e) { chk(`E · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

// ── F. THE WORKSPACE MODES ARE BUTTONS ────────────────────────────────────────────────────────────────
{
  try {
    const { p, ctx, errs } = await open('review');
    const shape = await p.evaluate(() => { const g = document.querySelector('.tbar .tabs');
      return { tablists: document.querySelectorAll('[role="tablist"],[role="tab"],[role="tabpanel"]').length,
        group: g && g.getAttribute('role'), label: g && g.getAttribute('aria-label'),
        pressed: [...document.querySelectorAll('.tbar .tabs button[aria-pressed="true"]')].map(b => b.id),
        buttons: [...document.querySelectorAll('.tbar .tabs button')].filter(b => b.hasAttribute('aria-pressed')).length }; });
    chk('F · no ARIA tabs are claimed', shape.tablists === 0, shape.tablists + ' tab role(s)');
    chk('F · five mode buttons in a group labelled Workspace, exactly one pressed', shape.group === 'group' && shape.label === 'Workspace'
      && shape.buttons === 5 && shape.pressed.length === 1 && shape.pressed[0] === 'tab_review', JSON.stringify(shape));
    const steps = await tabTo(p, '#tab_review', '#tab_fund', 8);
    await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    const r = await p.evaluate(() => ({ mode: uiMode, pressed: [...document.querySelectorAll('.tbar .tabs button[aria-pressed="true"]')].map(b => b.id) }));
    chk('F · Tab and Enter change the mode, and the pressed button follows', steps > 0 && r.mode === 'fund' && r.pressed.join() === 'tab_fund', JSON.stringify(r));
    chk('F · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
    for (const [stored, want] of [['fund', 'fund'], ['bogus', 'review'], ['', 'review']]) {
      const o = await open(stored);
      const m = await o.p.evaluate(() => ({ mode: uiMode, pressed: [...document.querySelectorAll('.tbar .tabs button[aria-pressed="true"]')].map(b => b.id).join() }));
      chk(`F · a stored mode of ${JSON.stringify(stored)} opens ${want}`, m.mode === want && m.pressed === 'tab_' + want, JSON.stringify(m));
      await o.ctx.close();
    }
  } catch (e) { chk(`F · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

// ── G. THE TOOLBAR MENUS, FROM THE KEYBOARD (v1.92, item 36) ──────────────────────────────────────────
// Every item in every menu was a <div onclick>: a keyboard user could open File and reach nothing in it.
{
  try {
    const { p, ctx, errs } = await open('review');
    const MENUS = await p.evaluate(() => [...document.querySelectorAll('.tbar .menu[id^="m_"], .ctxbar .menu[id^="m_"], #topStack .menu[id^="m_"]')]
      .filter(m => m.getClientRects().length && m.id !== 'm_modetools' && m.id !== 'm_basis').map(m => m.id.slice(2)));
    chk('G · the toolbar has menus to check', MENUS.length >= 6, MENUS.join(', '));
    for (const k of MENUS) {
      await p.evaluate(() => { openMenu = null; syncBtns(); });
      await p.focus('#b_' + k); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
      const o = await p.evaluate(k => ({ open: openMenu === k, exp: document.getElementById('b_' + k).getAttribute('aria-expanded'),
        items: document.querySelectorAll('#dd_' + k + ' [onclick]').length }), k);
      // Tab through the open menu: every item is reached, in order, and Tab past the last closes it
      let reached = 0, left = false;
      for (let i = 0; i < o.items + 2; i++) {
        await p.keyboard.press('Tab');
        const w = await p.evaluate(k => { const a = document.activeElement, dd = document.getElementById('dd_' + k);
          return { inMenu: !!(dd && a && dd.contains(a)), open: openMenu === k }; }, k);
        if (w.inMenu) reached++; else { left = !w.open; break; }
      }
      chk(`G · ${k}: Enter opens it and says so, Tab reaches all ${o.items} item(s), and leaving it closes it`,
        o.open && o.exp === 'true' && o.items > 0 && reached === o.items && left, JSON.stringify({ ...o, reached, left }));
      // Esc from inside the menu closes it with focus back on its button
      await p.focus('#b_' + k); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
      await p.keyboard.press('Tab'); await p.keyboard.press('Escape'); await p.waitForTimeout(80);
      const e = await p.evaluate(k => ({ open: openMenu, focus: document.activeElement && document.activeElement.id,
        exp: document.getElementById('b_' + k).getAttribute('aria-expanded') }), k);
      chk(`G · ${k}: Esc closes it and leaves focus on its button`, e.open === null && e.focus === 'b_' + k && e.exp === 'false', JSON.stringify(e));
    }
    // Enter on an item runs it, closes the menu and hands focus back to the menu's button
    await p.evaluate(() => { openMenu = null; svcAll = false; syncBtns(); render(); });
    await p.focus('#b_view'); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
    const steps = await tabTo(p, '#b_view', '#dd_view [onclick^="mRun(()=>{svcAll"], #dd_view [onclick*="svcAll=!svcAll"]', 12);
    if (steps >= 0) { await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
    const r = await p.evaluate(() => ({ svcAll, open: openMenu, focus: document.activeElement && document.activeElement.id }));
    chk('G · Enter on a menu item runs it, closes the menu and leaves focus on the menu button', steps > 0 && r.svcAll === true && r.open === null && r.focus === 'b_view',
      `${steps >= 0 ? steps + ' Tab(s)' : 'never reached'} · ${JSON.stringify(r)}`);
    // a MOUSE press on the page that closes a menu leaves focus there: only a key hands it back to the button
    await p.click('#b_share'); await p.waitForTimeout(80);
    await p.mouse.click(700, 600); await p.waitForTimeout(150);
    const m = await p.evaluate(() => ({ open: openMenu, focus: document.activeElement && document.activeElement.id }));
    chk('G · a mouse click on the page closes a menu without moving focus to its button', m.open === null && m.focus !== 'b_share', JSON.stringify(m));
    chk('G · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`G · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

// ── H. THE FUNDING DETAIL HEADERS AND A FIT CHIP (v1.92, item 36) ─────────────────────────────────────
{
  try {
    const { p, ctx, errs } = await open('fund');
    // Funding detail is shut on a new board; its own button opens it, and keeps the focus through the redraw
    const fd = '[onclick="fundDetailToggle()"]';
    await p.evaluate(() => { if (fundDetailOpen) fundDetailToggle(); });
    await p.focus(fd); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    const d = await p.evaluate(s => { const b = document.querySelector(s);
      return { open: fundDetailOpen, exp: b && b.getAttribute('aria-expanded'), focus: document.activeElement === b }; }, fd);
    chk('H · Enter on Funding detail opens it, says so, and focus stays on the button', d.open && d.exp === 'true' && d.focus, JSON.stringify(d));
    const hs = await p.evaluate(() => [...document.querySelectorAll('.sc-h, .gs-h')].filter(h => h.getClientRects().length)
      .map(h => ({ tag: h.tagName, arrow: (h.querySelector('[id$="Arrow"]') || {}).id || '' })));
    chk('H · every Funding detail header is a button', hs.length >= 2 && hs.every(h => h.tag === 'BUTTON'), hs.some(h => h.tag !== 'BUTTON') ? JSON.stringify(hs.filter(h => h.tag !== 'BUTTON')) : hs.length + ' header(s)');
    for (const h of hs.filter(h => h.arrow)) {
      const sel = `button:has(#${h.arrow})`;
      const before = await p.evaluate(s => { const b = document.querySelector(s); return b && b.getAttribute('aria-expanded'); }, sel);
      await p.focus(sel); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
      const after = await p.evaluate(s => { const b = document.querySelector(s), a = b && b.querySelector('[id$="Arrow"]');
        return { exp: b && b.getAttribute('aria-expanded'), arrow: a && a.textContent, focus: document.activeElement === b }; }, sel);
      const shows = /[▾▼]/.test(after.arrow || '') ? 'true' : 'false';
      chk(`H · ${h.arrow.replace('Arrow', '')}: Enter opens or closes it and aria-expanded follows`, !!before && after.exp !== before && after.exp === shows && after.focus,
        JSON.stringify({ before, ...after }));
      await p.keyboard.press('Enter'); await p.waitForTimeout(100);
    }
    // a service fit chip filters the list from the keyboard, says it is pressed, and keeps the focus
    const chip = '.fitchip';
    const n = await p.evaluate(s => document.querySelectorAll(s).length, chip);
    const steps = n ? await tabTo(p, fd, chip, 200) : -1;
    if (steps >= 0) { await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
    const r = await p.evaluate(s => { const a = document.activeElement;
      return { filter: svcFilter, pressed: [...document.querySelectorAll(s)].filter(c => c.getAttribute('aria-pressed') === 'true').length,
        focusOnChip: !!(a && a.matches(s)), focusPressed: !!(a && a.getAttribute('aria-pressed') === 'true') }; }, chip);
    chk('H · a fit chip is reached with Tab, filters with Enter, says it is pressed and keeps focus', steps >= 0 && r.filter === 0 && r.pressed === 1 && r.focusOnChip && r.focusPressed,
      `${steps >= 0 ? steps + ' Tab(s)' : 'never reached'} · ${JSON.stringify(r)}`);
    if (steps >= 0) { await p.keyboard.press(' '); await p.waitForTimeout(250); }
    const r2 = await p.evaluate(() => ({ filter: svcFilter }));
    chk('H · Space on it clears the filter again', steps >= 0 && r2.filter === -1, JSON.stringify(r2));
    chk('H · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`H · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

// ── I. A ROW'S ⋯ MENU, FROM THE KEYBOARD (v1.92, item 36) ─────────────────────────────────────────────
{
  try {
    const { p, ctx, errs } = await open('fund');
    const id = await p.evaluate(() => gridRows()[1].id.replace(/^row-/, ''));
    const btn = `#rm_${id} .rmbtn`;
    await p.focus(btn); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    const o = await p.evaluate(({ id, btn }) => ({ open: rowMenuId === id, focus: document.activeElement === document.querySelector(btn),
      items: document.querySelectorAll(`#rm_${id} .mdd [onclick]`).length }), { id, btn });
    await p.keyboard.press('Tab');
    const t = await p.evaluate(id => { const a = document.activeElement; return { tag: a && a.tagName, inMenu: !!(a && a.closest('#rm_' + id + ' .mdd')) }; }, id);
    chk('I · Enter opens the row menu, focus stays on ⋯, and Tab goes into its items', o.open && o.focus && o.items > 0 && t.inMenu && t.tag === 'BUTTON', JSON.stringify({ ...o, ...t }));
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    const e = await p.evaluate(({ btn }) => ({ open: rowMenuId, focus: document.activeElement === document.querySelector(btn) }), { btn });
    chk('I · Esc closes it with focus back on ⋯', e.open === null && e.focus, JSON.stringify(e));
    chk('I · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`I · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

// ── J. TYPING IN A ROW FIELD AND MOVING ON, FROM THE KEYBOARD (v1.92, item 36) ───────────────────────
// The change a field makes redraws its row, and Chrome fires it after focus has left: before v1.92 an
// allocation typed and Tabbed out of left focus on nothing, and the next Tab started from the toolbar.
{
  try {
    const { p, ctx, errs } = await open('fund');
    const desc = () => p.evaluate(() => { const a = document.activeElement, r = a && a.closest && a.closest('.row');
      return { row: r ? r.id : '', h: a ? (a.getAttribute('onchange') || a.getAttribute('onclick') || a.tagName).replace(/\(.*$/s, '') : '', body: a === document.body }; });
    // the tab order worked out here, not borrowed from the board: a helper that is wrong would agree with itself
    const neighbours = () => p.evaluate(() => { const t = [...document.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex]')]
        .filter(e => e.tabIndex >= 0 && !e.disabled && e.type !== 'hidden' && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden'),
      a = document.activeElement, i = t.indexOf(a);
      const d = e => { const r = e && e.closest('.row'); return e ? { row: r ? r.id : '', h: (e.getAttribute('onchange') || e.getAttribute('onclick') || e.tagName).replace(/\(.*$/s, '') } : null; };
      return { next: d(t[i + 1]), prev: d(t[i - 1]) }; });
    for (const [what, sel, val] of [['allocation', '#row-R001 input[onchange^="setAlloc"]', '1234567'], ['rank', '#row-R003 input[onchange^="setRank"]', '2']]) {
      await p.focus(sel);
      const nb = await neighbours();
      await p.keyboard.press('Control+A'); await p.keyboard.type(val);
      await p.keyboard.press('Tab'); await p.waitForTimeout(250);
      const after = await desc();
      chk(`J · ${what}: typed and Tabbed out of, focus goes on to the control after it`, !after.body && after.row === nb.next.row && after.h === nb.next.h,
        JSON.stringify({ want: nb.next, got: after }));
      await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(150);
      const back = await desc();
      chk(`J · ${what}: and Shift+Tab comes back to it`, back.h === (what === 'allocation' ? 'setAlloc' : 'setRank'), JSON.stringify(back));
    }
    {
      // Shift+Tab out of an edited field goes to the control before it
      const sel = '#row-R001 input[onchange^="setAlloc"]';
      await p.focus(sel); const nb = await neighbours();
      await p.keyboard.press('Control+A'); await p.keyboard.type('2345678');
      await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(250);
      const after = await desc();
      chk('J · Shift+Tab out of an edited field goes to the control before it', !after.body && after.row === nb.prev.row && after.h === nb.prev.h,
        JSON.stringify({ want: nb.prev, got: after }));
    }
    {
      // Enter applies the value and stays on the field
      const sel = '#row-R001 input[onchange^="setAlloc"]';
      await p.focus(sel); await p.keyboard.press('Control+A'); await p.keyboard.type('3456789');
      await p.keyboard.press('Enter'); await p.waitForTimeout(250);
      const after = await desc();
      const applied = await p.evaluate(() => { const i = BASE_ITEMS.concat(DATA.items).find(x => x.id === 'R001'); return JSON.stringify(S.alloc && S.alloc.R001 !== undefined ? S.alloc.R001 : i && i.alloc); });
      chk('J · Enter applies an allocation and stays on its field', after.row === 'row-R001' && after.h === 'setAlloc' && /3456789|3\.456789/.test(applied), JSON.stringify({ after, applied }));
    }
    {
      // A MOUSE PRESS ELSEWHERE IS NEVER OVERRIDDEN: typing must not land in the field just left
      const sel = '#row-R001 input[onchange^="setAlloc"]';
      await p.focus(sel); await p.keyboard.press('Control+A'); await p.keyboard.type('4567890');
      await p.click('#q'); await p.waitForTimeout(250);
      const after = await p.evaluate(() => document.activeElement && document.activeElement.id);
      chk('J · a click elsewhere after typing is left where it went', after === 'q', JSON.stringify(after));
    }
    chk('J · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`J · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

// ── K. SAVE DIAGNOSTICS, FROM THE KEYBOARD, IN CHROMIUM (v1.92, item 18) ──────────────────────────────
// A real script error that names a requirement and a figure; the item reached from 📁 File by keyboard; Esc
// writes nothing; Enter on Save downloads a file that is exactly what the box showed, with the error in it
// and neither the title nor the figure.
{
  try {
    const { p, ctx } = await open('review');
    const title = await p.evaluate(() => dispTitle(itemById(gridRows()[0].id.replace(/^row-/, ''))));
    await p.evaluate(t => { setTimeout(function(){ throw new Error('cannot total ' + t + ' at $7,654,321'); }, 0); }, title);
    await p.waitForTimeout(150);
    let dls = 0; p.on('download', () => { dls++; });
    await p.focus('#b_share'); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
    const steps = await tabTo(p, '#b_share', '#dd_share [onclick="mRun(toggleDiag)"]', 30);
    if (steps >= 0) { await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
    const o = await p.evaluate(() => ({ open: diagOpen, focus: document.activeElement && document.activeElement.id,
      text: document.getElementById('diagPre').textContent }));
    chk('K · 📁 File › 🩺 Save diagnostics is reached by keyboard and opens with Save focused', steps > 0 && o.open && o.focus === 'diagSave',
      `${steps >= 0 ? steps + ' Tab(s)' : 'never reached'} · ${JSON.stringify({ open: o.open, focus: o.focus })}`);
    chk('K · the real script error is in it, without the title or the figure', /ERROR {4}.*cannot total … at \$#/.test(o.text)
      && o.text.indexOf(title) < 0 && !/7,654,321/.test(o.text), (o.text.split('\n').filter(l => /ERROR {4}/.test(l))[0] || 'no ERROR line').trim().slice(0, 120));
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    const e = await p.evaluate(() => ({ open: diagOpen, focus: document.activeElement && document.activeElement.id }));
    chk('K · Esc closes it, writes nothing, and hands focus back to 📁 File', !e.open && e.focus === 'b_share' && dls === 0, JSON.stringify({ ...e, downloads: dls }));
    await p.evaluate(() => toggleDiag()); await p.waitForTimeout(100);
    const shown = await p.evaluate(() => document.getElementById('diagPre').textContent);
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }), p.keyboard.press('Enter')]);
    const { readFileSync } = await import('node:fs');
    const got = readFileSync(await dl.path(), 'utf8');
    chk('K · Enter on Save downloads one file, named for the day, exactly what the box showed',
      /^ORBIT diagnostics - \d{4}-\d{2}-\d{2}\.txt$/.test(dl.suggestedFilename()) && got === shown,
      `${dl.suggestedFilename()} · ${got === shown ? 'identical' : 'differs'}`);
    await ctx.close();
  } catch (e) { chk(`K · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

await b.close();
console.log(bad ? `\n${bad} keyboard check(s) failed\n` : '\nThe keyboard reaches the message, the record fields, the kept-aside put-back, the modes, every menu item, the Funding detail headers, the fit chips, the row menu and a row field typed into and left, and Save diagnostics, and each one works\n');
process.exit(bad ? 1 : 0);
