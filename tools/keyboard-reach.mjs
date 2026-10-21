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
//   G2. A long menu's folded groups (v1.96, item 65): Tab reaches each heading, Enter opens it in place and says so,
//      Tab then reaches every item in it; opening the next closes the first. Find in Reports & exports narrows the
//      menu as you type, and Tab goes straight to what it found.
//   G3. (v2.00, menu) THE LEFT MENU'S FLYOUTS, held to G and G2: Enter on an entry opens its flyout and says so, Tab reaches
//      every item, leaving it closes it, Esc closes it with focus back on the entry; Setup's folded groups as G2's; and a
//      mouse click on the page closes a flyout, as a menu.
//   L. The repaired-award controls (v1.96, item 64): the 🔧 entry under Needs attention, its list, Go to it, and
//      ✓ Checked in the award block, each reached and used from the keyboard. The board this runs on carries two
//      awards the board repaired when it opened, so these controls are on screen to be checked.
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
  + 'History & recovery › Put back work kept aside restores it. Nothing was written over.';

const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
// v2.00 (UI S4): docked -- the RECORD panel docked beside the table, set as View › Record panel › Docked beside the table
// sets it (prio27uiDock = '1' in this browser). Without it the panel slides over the table, the board's default.
const open = async (mode, w = 1440, docked = false) => {
  const ctx = await b.newContext({ viewport: { width: w, height: 1000 } });
  await ctx.addInitScript(m => { try { localStorage.setItem('spmtTheme', 'harbor'); if (m !== null) localStorage.setItem('spmtMode', m); } catch (e) {} }, mode === undefined ? null : mode);
  if (docked) await ctx.addInitScript(() => { try { localStorage.setItem('prio27uiDock', '1'); } catch (e) {} });
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
    // v2.00 (UI S4): the search box moved to the page's toolbar, below the context bar and after the message in the order
    // Tab takes. v2.00 (UI S4, fix round): the Tab starts from the context bar's first control, the cycle button, named
    // here -- not found on the page as the control just before the message, which made the check pass by construction
    // (one Tab) -- so it crosses the appropriation, the fiscal year and the PMO menu on its way, as it crossed Filter from
    // the search box before.
    const from = '#uiCycBtn';
    const steps = await tabTo(p, from, '#statBtn');
    chk('A · the Message button is reached with Tab from the context bar’s first control', steps > 0, (steps > 0 ? `${steps} Tab(s)` : 'never reached') + ' from ' + from);
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
// v2.00 (UI S4): twice, the panel sliding over the table (the default) and docked beside it. Sliding over, the panel is
// closed with Esc before its row is picked again: open, its scrim takes the click meant for the row.
for (const [pass, docked] of [['sliding over', false], ['docked', true]]) {
  try {
    const { p, ctx, errs } = await open('review', 1440, docked);
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
      chk(`D · ${what} is a button, reached with Tab and changed from the keyboard (${pass})`, !!shape && shape.tag === 'BUTTON' && steps >= 0 && got === value,
        `${shape ? shape.tag : 'missing'} · ${steps >= 0 ? steps + ' Tab(s)' : 'never reached'} · now ${JSON.stringify(got)}`);
      // the next field is reached from the panel's top again; put the panel back on screen after the prompt
      if (!docked) { await p.keyboard.press('Escape'); await p.waitForTimeout(250); }
      await p.click('#row-' + id + ' .t1'); await p.waitForTimeout(200);
    }
    const pos = await p.evaluate(() => getComputedStyle(document.getElementById('inspector')).position);
    chk(`D · the panel was ${docked ? 'docked beside the table' : 'a drawer over the table'} (${pass})`, docked ? pos !== 'fixed' : pos === 'fixed', 'position: ' + pos);
    chk(`D · nothing threw (${pass})`, errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`D · the section ran on this board (${pass})`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

// ── D2. THE LANE-WALK PIN CHIP, FROM THE KEYBOARD ──────────────────────────────────────────────────────
// v2.00 (UI S4): twice, sliding over and docked, as D
for (const [pass, docked] of [['sliding over', false], ['docked', true]]) {
  try {
    const { p, ctx, errs } = await open('review', 1440, docked);
    // every fixture requirement is pinned, so one is put back on the automatic lane walk first
    const id = await p.evaluate(() => { const i = gridRows()[2].id.replace(/^row-/, ''); delete S.fsrc[i]; render(); return i; });
    {
      await p.click('#row-' + id + ' .t1'); await p.waitForTimeout(250);
      // v2.00 (UI S4, fix round): where the panel is, as D checks it -- the docked pass stands on its own
      const pos = await p.evaluate(() => getComputedStyle(document.getElementById('inspector')).position);
      chk(`D2 · the panel was ${docked ? 'docked beside the table' : 'a drawer over the table'} (${pass})`, docked ? pos !== 'fixed' : pos === 'fixed', 'position: ' + pos);
      const sel = '#inspector [onclick^="setFsrc("]';
      const tag = await p.evaluate(s => { const e = document.querySelector(s); return e ? e.tagName : 'missing'; }, sel);
      await p.evaluate(() => document.getElementById('inspector').setAttribute('tabindex', '-1'));
      const steps = await tabTo(p, '#inspector', sel, 60);
      if (steps >= 0) { await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
      const r = await p.evaluate(({ id, s }) => ({ fsrc: ((S.fsrc || {})[id] || {}).m || '', chip: !!document.querySelector(s) }), { id, s: sel });
      chk(`D2 · the lane-walk pin chip is a button, reached with Tab and used with Enter (${pass})`, tag === 'BUTTON' && steps >= 0 && r.fsrc === 'split' && !r.chip,
        `${tag} · ${steps >= 0 ? steps + ' Tab(s)' : 'never reached'} · ${JSON.stringify(r)}`);
    }
    chk(`D2 · nothing threw (${pass})`, errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`D2 · the section ran on this board (${pass})`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
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
    // v2.00 (UI S4): the mode switch is the sidebar's now -- Requirements, Funding, Cycles & compare, Brief -- and the task bar
    // keeps Requirements' own Review / Rank pair. Tab and Enter there change the mode; the board's pressed button follows,
    // and so does the sidebar's current section. A board without the sidebar is checked on its task bar, as before.
    const side = await p.evaluate(() => { const e = document.getElementById('uiNav_fund'); return !!(e && e.getClientRects().length); });
    const steps = side ? await tabTo(p, '#uiNav_req', '#uiNav_fund', 8) : await tabTo(p, '#tab_review', '#tab_fund', 8);
    await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    const cur = () => p.evaluate(() => ({ mode: uiMode, pressed: [...document.querySelectorAll('.tbar .tabs button[aria-pressed="true"]')].map(b => b.id),
      current: [...document.querySelectorAll('#uiSide [aria-current="page"]')].map(b => b.id) }));
    const r = await cur();
    chk('F · Tab and Enter change the mode, and the pressed button follows', steps > 0 && r.mode === 'fund' && r.pressed.join() === 'tab_fund'
      && (!side || r.current.join() === 'uiNav_fund'), (side ? 'the sidebar: ' : 'the task bar: ') + JSON.stringify(r));
    if (side) {
      await p.focus('#uiNav_req'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
      const steps2 = await tabTo(p, '#tab_review', '#tab_rank', 4);
      await p.keyboard.press('Enter'); await p.waitForTimeout(250);
      const r2 = await cur();
      chk('F · in Requirements, Tab and Enter move from Review to Rank on the task bar, and the sidebar stays on Requirements',
        steps2 > 0 && r2.mode === 'rank' && r2.pressed.join() === 'tab_rank' && r2.current.join() === 'uiNav_req', JSON.stringify(r2));
    }
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
    // v2.00 (menu, 19 Oct): File, Reports & exports, Data and Setup left the toolbar for the left menu (G3 below); the menus that
    // stay are the context bar's and the table toolbar's -- Fiscal year, PMO and Filter -- named here, so one gone fails
    const MENUS = await p.evaluate(() => [...document.querySelectorAll('.tbar .menu[id^="m_"], .ctxbar .menu[id^="m_"], #topStack .menu[id^="m_"], #uiPage .menu[id^="m_"]')]
      .filter(m => m.getClientRects().length && m.id !== 'm_modetools' && m.id !== 'm_basis').map(m => m.id.slice(2)));
    chk('G · the toolbar has its menus to check: Fiscal year, PMO and Filter', MENUS.slice().sort().join() === 'fy,pmo,view', MENUS.join(', '));
    for (const k of MENUS) {
      await p.evaluate(() => { openMenu = null; syncBtns(); });
      await p.focus('#b_' + k); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
      // v1.96 (item 65): what Tab can reach in an open menu -- its items, its group headings and its Find box -- and not
      // the items of a group that is folded, which are in the page but hidden
      const o = await p.evaluate(k => ({ open: openMenu === k, exp: document.getElementById('b_' + k).getAttribute('aria-expanded'),
        items: [...document.querySelectorAll('#dd_' + k + ' button, #dd_' + k + ' input')].filter(e => e.getClientRects().length > 0).length }), k);
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
    // (v2.03: the item driven here was "☰ By-service detail on every row", which the card build's rows read and the grid's
    // never did; it went with the card leftovers. Fully discretionary only is a filter, shown in the open Funding group.)
    await p.evaluate(() => { openMenu = null; laneFilter = ''; menuGrpOpen.view = 'fund'; syncBtns(); render(); });
    await p.focus('#b_view'); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
    const steps = await tabTo(p, '#b_view', `#dd_view [onclick*="laneFilter=laneFilter==='disc'?'':'disc'"]`, 12);
    if (steps >= 0) { await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
    const r = await p.evaluate(() => ({ laneFilter, open: openMenu, focus: document.activeElement && document.activeElement.id }));
    await p.evaluate(() => { laneFilter = ''; render(); });
    chk('G · Enter on a menu item runs it, closes the menu and leaves focus on the menu button', steps > 0 && r.laneFilter === 'disc' && r.open === null && r.focus === 'b_view',
      `${steps >= 0 ? steps + ' Tab(s)' : 'never reached'} · ${JSON.stringify(r)}`);
    // a MOUSE press on the page that closes a menu leaves focus there: only a key hands it back to the button
    await p.click('#b_pmo'); await p.waitForTimeout(80);
    await p.mouse.click(700, 600); await p.waitForTimeout(150);
    const m = await p.evaluate(() => ({ open: openMenu, focus: document.activeElement && document.activeElement.id }));
    chk('G · a mouse click on the page closes a menu without moving focus to its button', m.open === null && m.focus !== 'b_pmo', JSON.stringify(m));
    chk('G · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`G · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

// ── G2. A LONG MENU'S FOLDED GROUPS, AND FIND (v1.96, item 65) ─────────────────────────────────────────
{
  try {
    const { p, ctx, errs } = await open('review');
    await p.evaluate(() => { try { localStorage.removeItem('spmtMenuGroups'); } catch (e) {} menuGrpOpen = {}; openMenu = null; syncBtns(); });
    const GROUPED = await p.evaluate(() => [...document.querySelectorAll('.menu[id^="m_"]')].filter(m => m.querySelector('.gh') && m.getClientRects().length)
      .map(m => ({ k: m.id.slice(2), gs: [...m.querySelectorAll('.gh')].map(h => h.getAttribute('data-g')) })));
    // v2.00 (menu): of the toolbar's menus Filter still folds; Setup folds on the left menu (G3), and Reports & exports lays its
    // groups out side by side in its box (Find, below)
    chk('G2 · the long toolbar menu has folded groups: Filter', GROUPED.map(x => x.k).sort().join() === 'view',
      GROUPED.map(x => x.k + ':' + x.gs.length).join(' '));
    let groups = 0, items = 0; const miss = [];
    for (const { k, gs } of GROUPED) {
      await p.evaluate(() => { openMenu = null; syncBtns(); });
      await p.focus('#b_' + k); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
      for (const g of gs) {
        const steps = await tabTo(p, '#b_' + k, `#dd_${k} .gh[data-g="${g}"]`, 30);
        if (steps < 0) { miss.push(`${k}/${g}: heading never reached`); continue; }
        await p.keyboard.press('Enter'); await p.waitForTimeout(80);
        const st = await p.evaluate(([k, g]) => { const h = document.querySelector(`#dd_${k} .gh[data-g="${g}"]`), b = document.getElementById('mg_' + k + '_' + g);
          return { open: openMenu === k, exp: h && h.getAttribute('aria-expanded'), focus: document.activeElement === h, shown: !!b && !b.hidden,
            n: b ? b.querySelectorAll('.mi').length : 0, others: [...document.querySelectorAll(`#dd_${k} .gbody`)].filter(x => x !== b && !x.hidden).length }; }, [k, g]);
        if (!(st.open && st.exp === 'true' && st.focus && st.shown && st.others === 0)) { miss.push(`${k}/${g}: Enter ${JSON.stringify(st)}`); continue; }
        let reached = 0;
        for (let i = 0; i < st.n; i++) {
          await p.keyboard.press('Tab');
          if (await p.evaluate(([k, g]) => { const a = document.activeElement, b = document.getElementById('mg_' + k + '_' + g); return !!(b && a && b.contains(a)); }, [k, g])) reached++;
        }
        groups++; items += reached;
        if (reached !== st.n) miss.push(`${k}/${g}: Tab reached ${reached} of ${st.n}`);
      }
      await p.keyboard.press('Escape'); await p.waitForTimeout(60);
    }
    chk('G2 · Tab reaches every heading, Enter opens it in place and says so (one group open at a time), and Tab reaches every item in it',
      miss.length === 0 && groups > 0, miss.length ? miss.slice(0, 4).join(' | ') : `${groups} group(s), ${items} item(s)`);
    // FIND: the first stop in Reports & exports; typing narrows it, and the next Tab is the first thing it found.
    // v2.00 (menu): Reports & exports is a box on the left menu, and Enter on its entry puts the keyboard in Find
    await p.evaluate(() => { openMenu = null; syncBtns(); });
    await p.focus('#uiNav_rep'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    const first = await p.evaluate(() => document.activeElement && document.activeElement.id);
    await p.keyboard.type('excel'); await p.waitForTimeout(120);
    const shown = await p.evaluate(() => [...document.querySelectorAll('#dd_reports .mi')].filter(e => e.getClientRects().length > 0).map(e => e.textContent.trim().slice(0, 30)));
    await p.keyboard.press('Tab');
    const next = await p.evaluate(() => { const a = document.activeElement; return a ? a.textContent.trim().slice(0, 30) : null; });
    chk('G2 · Find is the first stop in Reports & exports; typing "excel" shows the seven workbooks, and Tab goes to the first',
      first === 'mFind' && shown.length === 7 && next === shown[0], JSON.stringify({ first, n: shown.length, next }));
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    const shut = await p.evaluate(() => ({ open: document.getElementById('uiRepPanel').classList.contains('open'), focus: document.activeElement && document.activeElement.id }));
    await p.focus('#uiNav_rep'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    const cleared = await p.evaluate(() => document.getElementById('mFind').value);
    chk('G2 · Esc closes it onto its entry, and Find is empty when it opens again', cleared === '' && !shut.open && shut.focus === 'uiNav_rep', JSON.stringify({ cleared, ...shut }));
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    chk('G2 · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`G2 · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

// ── G3. THE LEFT MENU'S FLYOUTS, FROM THE KEYBOARD (v2.00, menu) ─────────────────────────────────────────
// What G holds every toolbar menu to, for each flyout that took a toolbar menu's items: Program offices, Audit, History &
// recovery, Setup and Save's ▾, with FYDP and Execution; and G2's folded groups, for Setup's. Work kept aside is set, so
// History & recovery draws its items.
{
  try {
    const { p, ctx, errs } = await open('review');
    await p.evaluate(() => { try { localStorage.removeItem('spmtMenuGroups'); } catch (e) {} menuGrpOpen = {}; _keptMeta = { t: Date.now(), why: 'folder' }; syncBtns(); });
    const FLY = await p.evaluate(() => (typeof UI_FLY !== 'undefined' ? UI_FLY : []).filter(k => { const e = document.getElementById('uiNav_' + k); return e && e.getClientRects().length; }));
    chk('G3 · the left menu has its flyouts to check: FYDP, Execution, Program offices, Audit, History & recovery, Setup and Save’s ▾',
      FLY.join() === 'fydp,exec,pmo,aud,hist,setup,save', FLY.join(', '));
    for (const k of FLY) {
      await p.evaluate(() => uiFlyClose());
      await p.focus('#uiNav_' + k); await p.keyboard.press('Enter'); await p.waitForTimeout(120);
      const o = await p.evaluate(k => ({ open: UI2.fly === k && document.getElementById('uiFly').classList.contains('open'), exp: document.getElementById('uiNav_' + k).getAttribute('aria-expanded'),
        items: [...document.querySelectorAll('#uiFly button, #uiFly input')].filter(e => e.getClientRects().length > 0 && !e.disabled).length,
        first: document.getElementById('uiFly').contains(document.activeElement) }), k);
      // the keyboard is on its first item: Tab from there reaches every other, in order, and Tab past the last closes it
      let reached = o.first ? 1 : 0, left = false;
      for (let i = 0; i < o.items + 2; i++) {
        await p.keyboard.press('Tab');
        const w = await p.evaluate(k => ({ inFly: document.getElementById('uiFly').contains(document.activeElement), open: UI2.fly === k }), k);
        if (w.inFly) reached++; else { left = !w.open; break; }
      }
      chk(`G3 · ${k}: Enter opens it and says so, Tab reaches all ${o.items} item(s), and leaving it closes it`,
        o.open && o.exp === 'true' && o.items > 0 && reached === o.items && left, JSON.stringify({ ...o, reached, left }));
      // Esc from inside it: Enter left the keyboard on its first item (Save's ▾ has one item, so a Tab would already leave it)
      await p.focus('#uiNav_' + k); await p.keyboard.press('Enter'); await p.waitForTimeout(120);
      await p.keyboard.press('Escape'); await p.waitForTimeout(100);
      const e = await p.evaluate(k => ({ open: UI2.fly, focus: document.activeElement && document.activeElement.id,
        exp: document.getElementById('uiNav_' + k).getAttribute('aria-expanded') }), k);
      chk(`G3 · ${k}: Esc closes it and leaves focus on its entry`, e.open === '' && e.focus === 'uiNav_' + k && e.exp === 'false', JSON.stringify(e));
    }
    // Setup's folded groups, as G2 holds a toolbar menu's
    await p.evaluate(() => uiFlyClose());
    await p.focus('#uiNav_setup'); await p.keyboard.press('Enter'); await p.waitForTimeout(120);
    const gs = await p.evaluate(() => [...document.querySelectorAll('#uiFly .gh')].map(h => h.getAttribute('data-g')));
    let groups = 0, items = 0; const miss = [];
    for (const g of gs) {
      const steps = await tabTo(p, '#uiFly .gh[data-g="' + gs[0] + '"]', `#uiFly .gh[data-g="${g}"]`, 30);
      if (steps < 0) { miss.push(`setup/${g}: heading never reached`); continue; }
      await p.keyboard.press('Enter'); await p.waitForTimeout(80);
      const st = await p.evaluate(g => { const h = document.querySelector(`#uiFly .gh[data-g="${g}"]`), b = document.getElementById('mg_setup_' + g);
        return { open: UI2.fly === 'setup', exp: h && h.getAttribute('aria-expanded'), focus: document.activeElement === h, shown: !!b && !b.hidden,
          n: b ? b.querySelectorAll('.mi').length : 0, others: [...document.querySelectorAll('#uiFly .gbody')].filter(x => x !== b && !x.hidden).length }; }, g);
      if (!(st.open && st.exp === 'true' && st.focus && st.shown && st.others === 0)) { miss.push(`setup/${g}: Enter ${JSON.stringify(st)}`); continue; }
      let reached = 0;
      for (let i = 0; i < st.n; i++) {
        await p.keyboard.press('Tab');
        if (await p.evaluate(g => { const a = document.activeElement, b = document.getElementById('mg_setup_' + g); return !!(b && a && b.contains(a)); }, g)) reached++;
      }
      groups++; items += reached;
      if (reached !== st.n) miss.push(`setup/${g}: Tab reached ${reached} of ${st.n}`);
    }
    chk('G3 · Setup: Tab reaches every heading, Enter opens it in place and says so (one group open at a time), and Tab reaches every item in it',
      miss.length === 0 && groups === 3, miss.length ? miss.slice(0, 4).join(' | ') : `${groups} group(s), ${items} item(s)`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(80);
    // a mouse press on the page closes a flyout, and leaves focus there
    await p.click('#uiNav_aud'); await p.waitForTimeout(100);
    await p.mouse.click(700, 600); await p.waitForTimeout(150);
    const m = await p.evaluate(() => ({ open: UI2.fly, focus: document.activeElement && document.activeElement.id }));
    chk('G3 · a mouse click on the page closes a flyout without moving focus to its entry', m.open === '' && m.focus !== 'uiNav_aud', JSON.stringify(m));
    chk('G3 · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`G3 · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

// ── L. THE REPAIRED-AWARD CONTROLS, FROM THE KEYBOARD (v1.96, item 64) ─────────────────────────────────
// v2.00 (UI S4): the funding posture strip, and with it Needs attention, shows in Funding and Brief only, so this runs in
// Funding, and the Tab starts from the context bar's last control -- Help since v2.00 (menu), 📁 File before -- before the task bar and the strip in the order
// Tab takes (the search box, where it started, moved below the strip). Twice, the RECORD panel sliding over and docked.
// v1.95 drew them only when an award had been repaired on opening, and the board every browser check loads held none:
// nothing checked that a keyboard could reach them. That board now carries two.
for (const [pass, docked] of [['sliding over', false], ['docked', true]]) {
  try {
    const { p, ctx, errs } = await open('fund', 1440, docked);
    const have = await p.evaluate(() => ({ list: attLists().awfix.length, entry: !!document.querySelector('button.e[onclick=\'attShow("awfix")\']') }));
    chk(`L · the board opens with two awards it repaired, and Needs attention offers the 🔧 entry (${pass})`, have.list === 2 && have.entry, JSON.stringify(have));
    const steps = await tabTo(p, '#helpBtn', 'button.e[onclick=\'attShow("awfix")\']', 60);
    if (steps >= 0) { await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
    const box = await p.evaluate(() => ({ open: attOpen, title: (document.getElementById('attTitle') || {}).textContent || '',
      inBox: !!document.getElementById('attPanel').contains(document.activeElement) }));
    chk(`L · the 🔧 entry is reached with Tab and Enter opens its list, with the keyboard inside it (${pass})`,
      steps >= 0 && box.open === 'awfix' && /REPAIRED/.test(box.title) && box.inBox, `${steps >= 0 ? steps + ' Tab(s)' : 'never reached'} · ${JSON.stringify(box)}`);
    const go = await tabTo(p, '#attPanel button', '#attPanel button.attgo', 20);
    if (go >= 0) { await p.keyboard.press('Enter'); await p.waitForTimeout(300); }
    const at = await p.evaluate(() => ({ open: attOpen, cur: curRow, fix: !!((S.awards || {})[curRow] || {}).fix }));
    chk(`L · Go to it is reached and, with Enter, closes the list and selects the requirement whose award was repaired (${pass})`,
      go >= 0 && at.open === null && at.fix, `${go >= 0 ? go + ' Tab(s)' : 'never reached'} · ${JSON.stringify(at)}`);
    // v2.00 (UI S4, fix round): where the panel holding the award block is, as D checks it -- the docked pass stands on its own
    const pos = await p.evaluate(() => getComputedStyle(document.getElementById('inspector')).position);
    chk(`L · the panel was ${docked ? 'docked beside the table' : 'a drawer over the table'} (${pass})`, docked ? pos !== 'fixed' : pos === 'fixed', 'position: ' + pos);
    const before = await p.evaluate(() => attLists().awfix.length);
    const ok = await tabTo(p, '#inspector button, #inspector input', 'button[onclick^="awdFixOk"]', 80);
    if (ok >= 0) { await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
    const after = await p.evaluate(id => ({ n: attLists().awfix.length, checked: !!(((S.awards || {})[id] || {}).fix || {}).ok }), at.cur);
    chk(`L · ✓ Checked is a button in the award block, reached with Tab, and Enter takes the award off the 🔧 list (${pass})`,
      ok >= 0 && after.checked && after.n === before - 1, `${ok >= 0 ? ok + ' Tab(s)' : 'never reached'} · ${before} → ${JSON.stringify(after)}`);
    chk(`L · nothing threw (${pass})`, errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`L · the section ran on this board (${pass})`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
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
// A real script error that names a requirement and a figure; the item reached from Setup on the left menu (📁 File until
// v2.00, menu) by keyboard; Esc
// writes nothing; Enter on Save downloads a file that is exactly what the box showed, with the error in it
// and neither the title nor the figure.
{
  try {
    const { p, ctx } = await open('review');
    const title = await p.evaluate(() => dispTitle(itemById(gridRows()[0].id.replace(/^row-/, ''))));
    await p.evaluate(t => { setTimeout(function(){ throw new Error('cannot total ' + t + ' at $7,654,321'); }, 0); }, title);
    await p.waitForTimeout(150);
    let dls = 0; p.on('download', () => { dls++; });
    await p.focus('#uiNav_setup'); await p.keyboard.press('Enter'); await p.waitForTimeout(120);
    const steps = 1 + await tabTo(p, '#uiFly .gh', '#uiFly [onclick="mRun(toggleDiag)"]', 30);
    if (steps >= 0) { await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
    const o = await p.evaluate(() => ({ open: diagOpen, focus: document.activeElement && document.activeElement.id,
      text: document.getElementById('diagPre').textContent }));
    chk('K · Setup › 🩺 Save diagnostics is reached by keyboard and opens with Save focused', steps > 0 && o.open && o.focus === 'diagSave',
      `${steps >= 0 ? steps + ' Tab(s)' : 'never reached'} · ${JSON.stringify({ open: o.open, focus: o.focus })}`);
    chk('K · the real script error is in it, without the title or the figure', /ERROR {4}.*cannot total … at \$#/.test(o.text)
      && o.text.indexOf(title) < 0 && !/7,654,321/.test(o.text), (o.text.split('\n').filter(l => /ERROR {4}/.test(l))[0] || 'no ERROR line').trim().slice(0, 120));
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    const e = await p.evaluate(() => ({ open: diagOpen, focus: document.activeElement && document.activeElement.id }));
    chk('K · Esc closes it, writes nothing, and hands focus back to Setup', !e.open && e.focus === 'uiNav_setup' && dls === 0, JSON.stringify({ ...e, downloads: dls }));
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
console.log(bad ? `\n${bad} keyboard check(s) failed\n` : '\nThe keyboard reaches the message, the record fields, the kept-aside put-back, the modes, every menu item and every folded group, Find, the Funding detail headers, the fit chips, the row menu and a row field typed into and left, Save diagnostics, and the repaired-award controls, and each one works\n');
process.exit(bad ? 1 : 0);
