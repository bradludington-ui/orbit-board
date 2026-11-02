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
//   M. The Add box (v2.07, item 121): Enter on Add requirement opens it with the keyboard inside, the office question is
//      answered from the keyboard, Tab reaches every field, the tabs and the Prime/OGC switch work with Enter and Space,
//      Add pressed early sends the keyboard to the first field still needed, and Esc asks before typing is lost.
//   R. FYDP Disconnects (v2.10, item 130): opened from FYDP ▸ by Enter with the keyboard inside, Tab walks its pickers, Export and
//      its sheet tabs, Enter presses a tab, an International figure typed and left with Tab is taken and the keyboard goes on to
//      the next year, one left by clicking the next box (or a sheet tab) with the mouse leaves the keyboard where the click put
//      it (v2.10 review, A-2), and Esc closes it with the keyboard back on FYDP ▸.
//   T. A WBS paragraph picked from the keyboard (v2.12, item 132): Needs attention's ▦ entry, its Go to it and the edit box's
//      WBS field by the keys, the estimate's list (the CCaR record's paragraph first), the name under a code typed, a code the
//      estimate does not hold refused on Save with the text kept, one it holds saved; the Add box's field and Classify's quick box.
//   V. The PPBE cycle at the top (v2.13, item 136): on a board whose appropriations are on different cycles, Tab reaches it and
//      the figure beside it (Enter opens Fit to the PPBE position); Enter opens its list, Esc closes it back on the button; and
//      Enter on a "Put every appropriation on …" item, OK to its question, puts every appropriation's stored plan on that cycle
//      with the keyboard left on the button.
//
//   node tools/keyboard-reach.mjs [--board FILE]
import { chromium } from 'playwright-core';
import { resolve, join } from 'node:path';
import { buildPopulated } from './ia-fixture.mjs';
import { CHROME } from './chrome.mjs';
import { ACE_REP_SEED, ACE_HDR_2026 } from './ace-seed.mjs';   // v2.12 (item 132): S
import { CYC_TAG_SEED, CYC_KEY, cycOtherStore, seedLs } from './cyc-seed.mjs';   // v2.13 (item 136): V

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
    // Tab takes. v2.00 (UI S4, fix round): the Tab starts from the context bar's first control, named here -- not found on
    // the page as the control just before the message, which made the check pass by construction (one Tab) -- so it crosses
    // the appropriation, the fiscal year and the PMO menu on its way, as it crossed Filter from the search box before.
    // v2.13 (item 136): the injected Cycle button (#uiCycBtn) that stood first is gone; the context bar's first control is the
    // appropriation picker, and the walk now crosses the fiscal year, the PPBE cycle (#b_cyc) and the PMO menu.
    const from = '#appnSel';
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
      // v2.08 (item 122): each opens the edit box at its field; the value is typed there and saved with the box's Save
      ['CCaR record', '#inspector [onclick^="openEdit("][onclick*=\'"ccar"\']', 'JSF9911', id => S.ccar[id]],
      ['PID', '#inspector [onclick^="openEdit("][onclick*=\'"pid"\']', 'PID7733', id => S.pid[id]],
      ['rename', '#inspector [onclick^="openEdit("][onclick*=\'"titles"\']', 'Renamed from the keyboard', id => S.titles[id]]]) {
      const shape = await p.evaluate(s => { const e = document.querySelector(s); return e ? { tag: e.tagName, tab: e.tabIndex } : null; }, sel);
      // a keyboard user arriving in the panel starts at its top (the rename pencil sits above the editors)
      await p.evaluate(() => { const i = document.getElementById('inspector'); i.setAttribute('tabindex', '-1'); });
      const steps = await tabTo(p, '#inspector', sel, 60);
      if (steps >= 0) { await p.keyboard.press('Enter'); await p.waitForTimeout(250);
        // the box opens with the field's text selected: type over it, then Tab to Save and press Enter
        await p.keyboard.type(value);
        for (let k = 0; k < 80 && !(await p.evaluate(() => (document.activeElement || {}).id === 'erSaveBtn')); k++) await p.keyboard.press('Tab');
        await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
      const got = await p.evaluate(({ id, src }) => (new Function('id', 'return (' + src + ')(id)'))(id), { id, src: read.toString() });
      chk(`D · ${what} is a button, reached with Tab and changed from the keyboard (${pass})`, !!shape && shape.tag === 'BUTTON' && steps >= 0 && got === value,
        `${shape ? shape.tag : 'missing'} · ${steps >= 0 ? steps + ' Tab(s)' : 'never reached'} · now ${JSON.stringify(got)}`);
      // the next field is reached from the panel's top again; put the panel back on screen after the box
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
    // v2.13 (item 136): and the PPBE cycle (#m_cyc), beside the fiscal year; V drives it on a board where it has more to say
    const MENUS = await p.evaluate(() => [...document.querySelectorAll('.tbar .menu[id^="m_"], .ctxbar .menu[id^="m_"], #topStack .menu[id^="m_"], #uiPage .menu[id^="m_"]')]
      .filter(m => m.getClientRects().length && m.id !== 'm_modetools' && m.id !== 'm_basis').map(m => m.id.slice(2)));
    chk('G · the toolbar has its menus to check: PPBE cycle, Fiscal year, PMO and Filter', MENUS.slice().sort().join() === 'cyc,fy,pmo,view', MENUS.join(', '));
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
    // v2.03: six since v2.02 removed the ATR/BTR Log workbook with the tracker. This check is outside verify:grid's run
    // once layout stops it (the 8 carried D results), so it read seven, failing, from v2.02 until v2.03.
    // v2.05 (item 114): nine -- "(Excel)" left the titles for the XLSX tag, and Find reads the tag's words, so every workbook is
    // found, the Priority Drill, the 1A9A and the IDS file among them
    chk('G2 · Find is the first stop in Reports & exports; typing "excel" shows the nine workbooks, and Tab goes to the first',
      first === 'mFind' && shown.length === 9 && next === shown[0], JSON.stringify({ first, n: shown.length, next }));
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
    chk('K · Setup › Save diagnostics is reached by keyboard and opens with Save focused', steps > 0 && o.open && o.focus === 'diagSave',
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

// ── M. THE ADD BOX, FROM THE KEYBOARD (v2.07, item 121) ─────────────────────────────────────────────────
// The whole record is typed in one box, so all of it has to be there for the keyboard: Enter on Add requirement opens it
// with the keyboard inside -- on the office question while every office shows, and that question answered from the
// keyboard moves on to the plan event; Tab reaches every field, each service's budget picker and the two OGC fields
// included; the two tabs and the Prime/OGC switch are buttons that Enter and Space press (no ARIA tabs claimed); Add pressed
// early sends the keyboard to the first field still needed and says what is missing, inside the box; Esc asks before what
// was typed is lost, Cancel keeps it, OK closes and hands the keyboard back to Add requirement.
{
  try {
    const { p, ctx, errs } = await open('review');
    const asked = []; let answer = false;
    p.on('dialog', d => { asked.push(d.message()); return answer ? d.accept() : d.dismiss(); });
    // what the box offers has to be on the board to be reached: a BAE list with PSM's names for two services
    await p.evaluate(() => { BUDDB = { ts: Date.now(), files: [], rows: [{ n: 'USAF O&M NON AFRC NON ANG CAM Discretionary PSM' },
      { n: 'USAF O&M - ANG CAM Discretionary PSM' }] }; persistBud(); _budRegCache = null; setPmoFilter('ALL'); });
    const act = () => p.evaluate(() => { const a = document.activeElement;
      return { id: a ? (a.id || a.tagName.toLowerCase()) : null, inBox: !!(a && a.closest && a.closest('#addPanel')) }; });
    const isOpen = () => p.evaluate(() => document.getElementById('addPanel').classList.contains('open'));
    // with every office showing: the box opens on the office question, answered from the keyboard
    await p.focus('#uiAddBtn'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    let a = await act();
    chk('M · Enter on Add requirement opens the box with the keyboard in it -- on the office question while every office shows',
      (await isOpen()) && a.inBox && a.id === 'arOffice', JSON.stringify(a));
    const want = await p.evaluate(() => [...document.getElementById('arOffice').options].findIndex(o => o.value === 'PSM'));
    for (let i = 0; i < want; i++) await p.keyboard.press('ArrowDown');
    await p.waitForTimeout(200);
    // a move only moves (v2.07 review): Chromium fires change on every arrow key of a closed select, and the first one used
    // to choose the first office and send the keyboard on, so no other office could be reached from the keyboard
    a = await act();
    const moved = await p.evaluate(() => ({ off: arOff, at: document.getElementById('arOffice').value }));
    chk('M · moving through the offices with the arrow keys chooses none of them: the question keeps the keyboard',
      moved.off === '' && moved.at === 'PSM' && a.id === 'arOffice', JSON.stringify({ office: moved.off, at: moved.at, focus: a.id }));
    await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    a = await act();
    const off = await p.evaluate(() => arOff);
    chk('M · Enter chooses the office moved to: the box is locked to it, and the keyboard goes on to the plan event',
      off === 'PSM' && a.id === 'arEvent', JSON.stringify({ office: off, focus: a.id }));
    // the rest from the box as one office chosen at the top opens it: closed (asked first: the office answer was typed),
    // PSM chosen at the top, then Enter on Add requirement opens it straight on its form, the keyboard on the plan event
    answer = true; await p.keyboard.press('Escape'); await p.waitForTimeout(200); answer = false;
    if (await isOpen()) await p.evaluate(() => arHide());
    await p.evaluate(() => setPmoFilter('PSM'));
    await p.focus('#uiAddBtn'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    a = await act();
    chk('M · with one office chosen at the top, Enter opens the box on its form with the keyboard on the plan event',
      (await isOpen()) && a.id === 'arEvent' && (await p.evaluate(() => arOff)) === 'PSM', JSON.stringify(a));
    // the Prime/OGC switch: Space and Enter press each, and the one pressed says so
    const pt = () => p.evaluate(() => ({ v: document.getElementById('arPtype').value, p: document.getElementById('arPtP').getAttribute('aria-pressed'),
      o: document.getElementById('arPtO').getAttribute('aria-pressed'), tag: document.getElementById('arPtO').tagName }));
    await p.focus('#arPtO'); await p.keyboard.press(' '); await p.waitForTimeout(80);
    const r1 = await pt();
    await p.focus('#arPtP'); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
    const r2 = await pt();
    await p.focus('#arPtO'); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
    const r3 = await pt();
    chk('M · the Prime/OGC switch is two buttons: Space and Enter press each, and the pressed one says so',
      r1.tag === 'BUTTON' && r1.v === 'OGC' && r1.o === 'true' && r1.p === 'false' && r2.v === 'PRIME' && r2.p === 'true' && r2.o === 'false' && r3.v === 'OGC',
      JSON.stringify([r1, r2, r3]));
    // typed from the keyboard: the plan event and two services' values -- their budget pickers appear; a destination that
    // is not a prime -- the two OGC fields appear
    await p.focus('#arEvent'); await p.keyboard.type('Depot support');
    await p.focus('#arV0'); await p.keyboard.type('1,000,000');
    await p.focus('#arV1'); await p.keyboard.type('250K');
    const gov = await p.evaluate(() => (flowEntsAZ().filter(e => e.kind !== 'prime')[0] || {}).k || '');
    await p.selectOption('#arTo', gov); await p.waitForTimeout(120);
    for (const sel of ['#arB0', '#arB1']) { await p.focus(sel); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(80); }
    // Tab reaches every field, forward, without leaving the box
    const NAMED = ['arTabNew', 'arTabYr', 'arEvent', 'arPtP', 'arPtO', 'arCcar', 'arPid', 'arOb', 'arWbs', 'arV0', 'arV1', 'arV2', 'arV3', 'arV4',
      'arV5', 'arB0', 'arB1', 'arSpread', 'arTo', 'arEnd', 'arMipr', 'arDesc', 'arCons', 'arNote', 'arAddOpen', 'arAddBtn'];
    const shown = await p.evaluate(ids => ids.filter(id => { const e = document.getElementById(id); return !!e && !e.disabled && e.getClientRects().length > 0; }), NAMED);
    const missing = NAMED.filter(id => shown.indexOf(id) < 0);
    chk('M · every field is on screen to be reached: the tabs, the record, each service’s value and the budget pickers typed for, the OGC fields, Add',
      !missing.length, missing.length ? 'not on screen: ' + missing.join(', ') : NAMED.length + ' controls');
    const all = await p.evaluate(() => [...document.querySelectorAll('#addPanel .modal button, #addPanel .modal input, #addPanel .modal select, #addPanel .modal textarea')]
      .filter(e => !e.disabled && e.type !== 'hidden' && e.getClientRects().length > 0).length);
    await p.focus('#arTabNew');
    const seen = new Set(); let left = null;
    for (let i = 0; i < all + 4; i++) { await p.keyboard.press('Tab'); const s = await act(); if (!s.inBox) { left = s.id; break; } seen.add(s.id); }
    const notReached = NAMED.filter(id => !seen.has(id));
    chk('M · Tab reaches every field of the box, and never leaves it', !notReached.length && !left,
      left ? 'Tab left the box, to ' + left : notReached.length ? 'never reached: ' + notReached.join(', ') : `${seen.size} controls reached in ${all + 4} Tab(s)`);
    // the two tabs: Enter and Space press them, and each shows its own part
    const tabs = () => p.evaluate(() => ({ yr: document.getElementById('arTabYr').getAttribute('aria-pressed'), nw: document.getElementById('arTabNew').getAttribute('aria-pressed'),
      yrShown: !document.getElementById('arYr').hidden, nwShown: !document.getElementById('arNew').hidden,
      roles: document.querySelectorAll('#addPanel [role="tablist"], #addPanel [role="tab"], #addPanel [role="tabpanel"]').length }));
    await p.focus('#arTabYr'); await p.keyboard.press('Enter'); await p.waitForTimeout(120);
    const t1 = await tabs();
    await p.focus('#arTabNew'); await p.keyboard.press(' '); await p.waitForTimeout(120);
    const t2 = await tabs();
    const kept = await p.evaluate(() => document.getElementById('arEvent').value);
    chk('M · the two tabs are buttons Enter and Space press, each shows its own part, no ARIA tabs are claimed, and what was typed stays',
      t1.yr === 'true' && t1.nw === 'false' && t1.yrShown && !t1.nwShown && t2.nw === 'true' && t2.nwShown && !t2.yrShown && t1.roles === 0 && kept === 'Depot support',
      JSON.stringify({ t1, t2, kept }));
    // Add pressed early: the keyboard goes to the first field still needed, which is marked, and the box says what is missing
    await p.focus('#arAddBtn'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    a = await act();
    const early = await p.evaluate(() => ({ msg: document.getElementById('arMsg').textContent, inv: document.getElementById('arOb').getAttribute('aria-invalid'),
      added: S.order.filter(id => /^NEW-/.test(id)).length }));
    chk('M · Add pressed early sends the keyboard to the first field still needed (the obligation category), marked, and says what is missing in the box',
      a.id === 'arOb' && early.inv === 'true' && /still needed/.test(early.msg) && early.added === 0, JSON.stringify({ focus: a.id, ...early }));
    // Esc asks; Cancel keeps the box and the text; OK closes it and hands the keyboard back to Add requirement
    asked.length = 0; answer = false;
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    const k1 = { asked: asked.some(m => /Discard what you typed\?/.test(m)), open: await isOpen(), text: await p.evaluate(() => (document.getElementById('arEvent') || {}).value) };
    chk('M · Esc asks before what was typed is lost, and Cancel keeps the box with the text in it', k1.asked && k1.open && k1.text === 'Depot support', JSON.stringify(k1));
    answer = true; await p.keyboard.press('Escape'); await p.waitForTimeout(250); answer = false;
    a = await act();
    chk('M · OK closes it and hands the keyboard back to Add requirement', !(await isOpen()) && a.id === 'uiAddBtn', JSON.stringify(a));
    await p.evaluate(() => setPmoFilter('ALL'));
    chk('M · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`M · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

// ── P. A REDRAW WHILE A RECORD PANEL FIGURE IS TYPED (v2.08, F2; the second review) ─────────────────────────────────
// Chromium fires change on a focused field as innerHTML removes it, and the page hears it: the half-typed figure was
// committed inside the redraw, the panel drew the figure from before, the keyboard fell to the page and the rest of the
// typing went nowhere. jsdom fires nothing on removal, so only a browser can hold this. A redraw (render(), what a Live
// view tick does) in the middle of typing must commit nothing and keep the typing and the keyboard; Tab commits it whole.
{
  try {
    const { p, ctx, errs } = await open('review', 1920);
    const id = await p.evaluate(() => { const id = S.order[3]; setCur(id); render(); return id; });
    const sel = '#inspector input[onchange^="setFsrcSvc("]';
    const read = () => p.evaluate(([id, sel]) => { const inp = document.querySelector(sel), f = (S.fsrc || {})[id];
      return { stored: f && f.dv ? f.dv[0] : null, field: inp ? inp.value : null, kb: document.activeElement === inp }; }, [id, sel]);
    const r0 = await read();
    await p.click(sel, { clickCount: 3 }); await p.keyboard.type('25');
    await p.evaluate(() => render());
    const r1 = await read();
    chk('P · a redraw while a RECORD panel figure is typed commits nothing, and the typing and the keyboard stay',
      r1.stored === r0.stored && r1.field === '25' && r1.kb, JSON.stringify({ before: r0, mid: r1 }));
    await p.keyboard.type('00000'); await p.keyboard.press('Tab'); await p.waitForTimeout(200);
    const r2 = await read();
    chk('P · leaving the field commits the whole figure', r2.stored === 2500000, JSON.stringify(r2));
    chk('P · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`P · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

// ── Q. CLASSIFY'S OFFICE CELL: AN ARROW KEY, THEN A CLICK ELSEWHERE (v2.08, the second review) ──────────────────────
// An arrow key in the office cell only moves; leaving the cell chooses. Chosen as the blur came -- on the mousedown of a
// click elsewhere -- the move redrew Classify before mouseup, the control pressed was gone, and its click did nothing. Now
// the click happens and the office is chosen after it; and a press on the cell itself lets a mouse pick choose at once.
{
  try {
    const run = async (arrow, target) => {
      const { p, ctx, errs } = await open('review', 1600);
      p.on('dialog', d => d.accept());
      await p.evaluate(() => { try { localStorage.setItem('prio27who', 'BLL'); } catch (e) {} });
      const ids = await p.evaluate(() => { matOpen = true; render(); matSet('bulkF', 'obCat'); matSet('bulkV', OB_CATS[1]); return [S.order[0], S.order[1]]; });
      const cell = `#matBody select[onchange*='setGrp('][onchange*='"${ids[0]}"']`;
      const g0 = await p.evaluate(id => grpOf(itemById(id)), ids[0]);
      await p.focus(cell);
      if (arrow) await p.keyboard.press('ArrowDown');
      const shown = await p.evaluate(c => document.querySelector(c).value, cell);
      const n0 = await p.evaluate(() => S.order.filter(x => obCatOf(x) === OB_CATS[1]).length);
      if (target === 'apply') await p.click('#matBody button[onclick="matApplyBulk()"]');
      else if (target === 'ptype') await p.click(`#matBody button[onclick^="togglePtype("][onclick*='"${ids[1]}"']`);
      await p.waitForTimeout(250);
      const r = await p.evaluate(([a, b2, ob]) => ({ office: grpOf(itemById(a)), n: S.order.filter(x => obCatOf(x) === ob).length, pt2: ptypeOf(b2) }),
        [ids[0], ids[1], await p.evaluate(() => OB_CATS[1])]);
      await ctx.close();
      return { g0, shown, n0, ...r, errs: errs.length };
    };
    const a = await run(true, 'apply');
    chk('Q · an arrow key in the office cell, then a click on bulk Apply: the Apply runs, and the office is chosen after it',
      a.n > a.n0 && a.office === a.shown && a.office !== a.g0 && !a.errs, JSON.stringify(a));
    const t = await run(true, 'ptype');
    chk('Q · an arrow key, then a click on another row’s Prime / OGC: the click lands, and the office is chosen',
      t.pt2 !== '' && t.office === t.shown && t.office !== t.g0 && !t.errs, JSON.stringify(t));
    // a press on the cell after an arrow key: the mouse's pick chooses at once, with the keyboard still in the cell
    {
      const { p, ctx, errs } = await open('review', 1600);
      const id = await p.evaluate(() => { matOpen = true; render(); return S.order[0]; });
      const cell = `#matBody select[onchange*='setGrp('][onchange*='"${id}"']`;
      const g0 = await p.evaluate(x => grpOf(itemById(x)), id);
      const pick = await p.evaluate(([x, g]) => GROUPS.filter(o => o !== g).slice(-1)[0], [id, g0]);
      await p.focus(cell); await p.keyboard.press('ArrowDown');
      await p.dispatchEvent(cell, 'mousedown'); await p.selectOption(cell, pick); await p.waitForTimeout(150);
      const g1 = await p.evaluate(x => grpOf(itemById(x)), id);
      chk('Q · after an arrow key, a pick with the mouse chooses at once', g1 === pick, JSON.stringify({ from: g0, pick, now: g1 }));
      chk('Q · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
      await ctx.close();
    }
  } catch (e) { chk(`Q · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

// ── R. FYDP DISCONNECTS, FROM THE KEYBOARD (v2.10, item 130) ─────────────────────────────────────────────────────
// FYDP ▸ by Enter, then its item by Enter: the box opens with the keyboard inside. Tab reaches the two pickers, Export and the
// five sheet tabs; Enter on a tab presses it alone. On the Summary an International figure is typed and Tab leaves it: it is
// taken in $M, the figures it moves are drawn again in place, and the keyboard is on the next year's box -- the redraw does not
// take it (a whole redraw at that moment would). Esc closes the box with the keyboard back on FYDP ▸. A cost estimate and a
// BES28 position are put on the board first: bare, the box has no tables to reach.
{
  try {
    const { p, ctx, errs } = await open('review');
    await p.evaluate(() => { const Y = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033], S6 = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'], L = [];
      ['om', 'ff', 'sp'].forEach((ap, a) => S6.forEach((sv, s) => { const v = {}; Y.forEach(y => { v[y] = (a + 1) * 9e8 + (s + 1) * 4e7 + (y - 2020) * 3e6; }); L.push({ ap, pmo: 'AV', svc: sv, v }); }));
      ACEDB.sets['2025ACE'] = { label: '2025ACE', ts: Date.now(), years: Y, lines: L, appn: {}, skip: {} };
      const val = {}, lines = {}; S6.forEach((sv, s) => { lines[sv] = [{ k: '_all', all: true }]; val[sv] = { _all: {} };
        [2027, 2028, 2029, 2030, 2031, 2032].forEach(y => { val[sv]._all[y] = { d: (s + 1) * 1.3e8 + (y - 2027) * 2e6, m: y === 2027 ? 5e6 : 0 }; }); });
      MS.ppbe = MS.ppbe || {}; MS.ppbe['BES|2028'] = { v: 2, split: true, lines, val }; MS.cycle = 'BES|2028'; });
    await p.focus('#uiNav_fydp'); await p.keyboard.press('Enter'); await p.waitForTimeout(120);
    let found = -1;
    for (let i = 0; i < 8; i++) { if (await p.evaluate(() => /toggleFdc/.test((document.activeElement || {}).getAttribute ? document.activeElement.getAttribute('onclick') || '' : ''))) { found = i; break; } await p.keyboard.press('Tab'); }
    await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    const o = await p.evaluate(() => ({ open: document.getElementById('fdcPanel').classList.contains('open'), inBox: !!(document.activeElement && document.activeElement.closest('#fdcPanel')) }));
    chk('R · FYDP ▸, then FYDP Disconnects… by Enter: the box opens with the keyboard inside', found >= 0 && o.open && o.inBox, JSON.stringify({ found, ...o }));
    // Tab from the estimate picker reaches the cycle picker, Export and every tab, in that order
    const order = [];
    await p.focus('#fdcAce');
    for (let i = 0; i < 8; i++) { order.push(await p.evaluate(() => document.activeElement.id)); await p.keyboard.press('Tab'); }
    chk('R · Tab walks the estimate, the cycle, Export to Excel and the five sheet tabs, in that order',
      JSON.stringify(order) === JSON.stringify(['fdcAce', 'fdcCyc', 'fdcExport', 'fdcTab_0', 'fdcTab_1', 'fdcTab_2', 'fdcTab_3', 'fdcTab_4']), JSON.stringify(order));
    await p.focus('#fdcTab_2'); await p.keyboard.press('Enter'); await p.waitForTimeout(120);
    const tb = await p.evaluate(() => ({ pressed: [...document.querySelectorAll('#fdcBody .fdctabs button')].map(b => b.getAttribute('aria-pressed')).join(),
      sub: document.querySelector('#fdcPage .fdct2').textContent, focus: document.activeElement.id }));
    chk('R · Enter on STOVL presses it alone, shows its sheet, and the keyboard stays on it',
      tb.pressed === 'false,false,true,false,false' && /USMC STOVL/.test(tb.sub) && tb.focus === 'fdcTab_2', JSON.stringify(tb));
    await p.focus('#fdcTab_0'); await p.keyboard.press('Enter'); await p.waitForTimeout(120);
    const cell = () => p.evaluate(() => document.querySelector('#fdcPage tbody tr:nth-child(2) td:nth-child(3)').textContent);
    const c0 = await cell();
    await p.focus('#fdcIn_ir_om_2028'); await p.keyboard.press('Control+a'); await p.keyboard.type('250'); await p.keyboard.press('Tab'); await p.waitForTimeout(150);
    const r = await p.evaluate(() => ({ focus: document.activeElement.id, val: document.getElementById('fdcIn_ir_om_2028').value,
      kept: FDC_INTL.ir.om[2028], cell: document.querySelector('#fdcPage tbody tr:nth-child(2) td:nth-child(3)').textContent }));
    chk('R · an International figure typed and left with Tab is taken in $M, its requirement drawn again, and the keyboard is on the next year',
      r.focus === 'fdcIn_ir_om_2029' && r.val === '$250' && r.kept === 250000000 && r.cell !== c0, JSON.stringify({ before: c0, ...r }));
    // v2.10 review (A-2): the same figure left with a CLICK, a real mouse on the next box. Chromium fires the change with the
    // keyboard nowhere and the click's focus still to land, and a figure drawn again at that moment had the box controller hand
    // the keyboard back to the year just left: the next figure typed went into it (FY28 read $2,507M, FY30 $0). And a sheet tab
    // clicked after a figure is typed keeps the keyboard (it was left on the estimate picker).
    await p.click('#fdcIn_ir_om_2030'); await p.keyboard.press('Control+a'); await p.keyboard.type('7');
    await p.click('#fdcIn_ir_om_2031'); await p.waitForTimeout(150);
    await p.keyboard.press('Control+a'); await p.keyboard.type('3');
    const k1 = await p.evaluate(() => ({ focus: document.activeElement.id, intl: JSON.stringify(FDC_INTL.ir.om) }));
    chk('R · a figure typed and left by clicking the next box: the keyboard is on the box clicked, and the next figure goes there',
      k1.focus === 'fdcIn_ir_om_2031' && k1.intl === JSON.stringify({ 2028: 250000000, 2030: 7000000 }), JSON.stringify(k1));
    await p.click('#fdcTab_1'); await p.waitForTimeout(200);
    const k2 = await p.evaluate(() => ({ focus: document.activeElement.id, intl: JSON.stringify(FDC_INTL.ir.om),
      pressed: [...document.querySelectorAll('#fdcBody .fdctabs button')].map(b => b.getAttribute('aria-pressed')).join() }));
    chk('R · then a sheet tab clicked: the tab is pressed and has the keyboard, and the figure typed is taken for its own year',
      k2.focus === 'fdcTab_1' && k2.pressed === 'false,true,false,false,false' && k2.intl === JSON.stringify({ 2028: 250000000, 2030: 7000000, 2031: 3000000 }), JSON.stringify(k2));
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    const e = await p.evaluate(() => ({ open: document.getElementById('fdcPanel').classList.contains('open'), focus: document.activeElement && document.activeElement.id }));
    chk('R · Esc closes it, the keyboard back on FYDP ▸', !e.open && e.focus === 'uiNav_fydp', JSON.stringify(e));
    chk('R · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`R · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

// ── S. THE COST ESTIMATE IMPORT: ITS MAPPING BOX AND ITS REPORT, FROM THE KEYBOARD (v2.12, item 132) ─────────────────────
// A 2026 file whose two titles were renamed, picked (the file dialog is the browser's own): the mapping box opens with the keyboard
// inside, on the first field. Each column is chosen with the keyboard (a letter picks the file's own heading by its column), Tab
// reaches Import, and Enter imports it: the report opens with the keyboard inside, and says the two were answered in the box. Esc
// closes it. Then Data on the left menu by Enter, its Import report… by Enter: the report opens again with the keyboard inside, and
// the year picker, moved with an arrow key, redraws the figures and keeps the keyboard. Esc on the mapping box of a second file
// imports nothing.
{
  try {
    const { p, ctx, errs } = await open('review');
    const mkBook = hdr => p.evaluate(hdr => {
      const row = (o) => hdr.map(t => (Object.prototype.hasOwnProperty.call(o, t) ? o[t] : ''));
      const base = { 'PALS/O&S': '', 'Account Family (PALS or O&S)': 'O&S', '$ Type': 'TY$', 'US/PTN/FMS': 'US', Service: 'USAF', 'T/M/S': 'F-35A', 'Roll-up Flag': 'No',
        'JPO Managed': 'Yes', 'Appropriation (US Only)': 'O&M', 'Support Line Category': 'O&S', PMO: 'Air Vehicle' };
      const rows = [['PMO Database Output'], [], hdr.slice(),
        row(Object.assign({}, base, { 'Work Breakdown Structure': '1.2.1.1', Level: 4, CES1: 'Manpower', CES2: 'Maintenance', CES3: 'Organizational', CES4: 'Officer', 2027: 1.25 })),
        row(Object.assign({}, base, { 'Work Breakdown Structure': '1.2', Level: 2, CES1: 'Manpower', CES2: 'Maintenance', 'Roll-up Flag': 'Yes', 2027: 1.25 }))];
      const bytes = buildXlsx([{ name: 'Cover', rows: [['2026 SUST ACE COMPLETE']] }, { name: 'PMO Database Output', rows }]);
      return Array.from(bytes); }, hdr);
    const HDR = ACE_HDR_2026.map(t => t === 'PALS/O&S' ? 'Index 2' : t);
    const book = await mkBook(HDR), book2 = await mkBook(HDR.concat(['A column added this year']));   // the second: another layout
    const pick = async (name, bk = book) => { await p.setInputFiles('#aceFile', { name, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from(bk) });
      await p.waitForTimeout(500); };
    await pick('2026 SUST ACE COMPLETE Detail File.xlsx');
    const a = await p.evaluate(() => ({ open: document.getElementById('aceColPanel').classList.contains('open'), focus: document.activeElement && document.activeElement.id,
      asked: [...document.querySelectorAll('#aceColBody select')].map(s => s.id) }));
    chk('S · a file with two renamed titles: the mapping box opens with the keyboard inside, on the first field asked',
      a.open && a.focus === 'aceCol_roll' && JSON.stringify(a.asked) === JSON.stringify(['aceCol_roll', 'aceCol_pals']), JSON.stringify(a));
    await p.keyboard.type('h'); await p.keyboard.press('Tab'); await p.keyboard.type('ar', { delay: 40 });
    const ch = await p.evaluate(() => [document.getElementById('aceCol_roll'), document.getElementById('aceCol_pals')].map(s => s.options[s.selectedIndex].textContent));
    chk('S · each column is chosen with the keyboard, by the letter of its column: H for Roll-up Flag, AR for the account family',
      JSON.stringify(ch) === JSON.stringify(['H · Roll-up Flag', 'AR · Account Family (PALS or O&S)']), JSON.stringify(ch));
    let k = -1; for (let i = 0; i < 4; i++) { await p.keyboard.press('Tab'); if (await p.evaluate(() => /aceColApply/.test((document.activeElement && document.activeElement.getAttribute('onclick')) || ''))) { k = i; break; } }
    await p.keyboard.press('Enter'); await p.waitForTimeout(400);
    const r = await p.evaluate(() => { const s = ACEDB.sets['2026ACE'] || {}; return { box: document.getElementById('aceColPanel').classList.contains('open'),
      rep: document.getElementById('aceRepPanel').classList.contains('open'), inRep: !!(document.activeElement && document.activeElement.closest('#aceRepPanel')),
      lines: (s.lines || []).length, how: ((s.rep || {}).map || {}).roll && s.rep.map.roll.how, said: /answered in the mapping box/.test(document.getElementById('aceRepBody').textContent) }; });
    chk('S · Tab reaches Import, and Enter imports it: the report opens with the keyboard inside, the rollup left out, the two titles answered in the box',
      k >= 0 && !r.box && r.rep && r.inRep && r.lines === 1 && r.how === 'asked' && r.said, JSON.stringify({ k, ...r }));
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    const c = await p.evaluate(() => document.getElementById('aceRepPanel').classList.contains('open'));
    chk('S · Esc closes the report', !c, String(c));
    // from the Data box: Import report… by Enter
    await p.evaluate(ACE_SEED => { (0, eval)(ACE_SEED); render(); }, ACE_REP_SEED);
    await p.focus('#uiNav_data'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    let f = -1; for (let i = 0; i < 30; i++) { if (await p.evaluate(() => /aceRepShow/.test((document.activeElement && document.activeElement.getAttribute('onclick')) || ''))) { f = i; break; } await p.keyboard.press('Tab'); }
    await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    const o = await p.evaluate(() => ({ open: document.getElementById('aceRepPanel').classList.contains('open'), inBox: !!(document.activeElement && document.activeElement.closest('#aceRepPanel')), k: aceRepK }));
    chk('S · Data, then Import report… by Enter: the newest estimate’s report opens with the keyboard inside', f >= 0 && o.open && o.inBox && o.k === '2026ACE', JSON.stringify({ f, ...o }));
    await p.focus('#aceRepYrSel');
    const y0 = await p.evaluate(() => document.querySelector('#aceRepBody .acerep-why tr th:nth-child(3)').textContent);
    await p.keyboard.press('ArrowDown'); await p.waitForTimeout(250);
    const y1 = await p.evaluate(() => ({ th: document.querySelector('#aceRepBody .acerep-why tr th:nth-child(3)').textContent, focus: document.activeElement && document.activeElement.id }));
    chk('S · the year picker, moved with an arrow key, redraws the year’s figures and keeps the keyboard', y1.th !== y0 && y1.focus === 'aceRepYrSel', JSON.stringify({ y0, ...y1 }));
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    // the same layout again is read without asking (the answers are remembered); a file laid out differently is asked about,
    // and Esc on its mapping box imports nothing
    await pick('2027 ACE same layout.xlsx');
    const same = await p.evaluate(() => ({ open: document.getElementById('aceColPanel').classList.contains('open'), how: ((((ACEDB.sets['2027ACE'] || {}).rep || {}).map || {}).roll || {}).how }));
    chk('S · the same layout again is read without asking, by the answers remembered', !same.open && same.how === 'remembered', JSON.stringify(same));
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    const before = await p.evaluate(() => JSON.stringify(ACEDB));
    await pick('2028 ACE another layout.xlsx', book2);
    const askd = await p.evaluate(() => document.getElementById('aceColPanel').classList.contains('open'));
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    const z = await p.evaluate(b0 => ({ open: document.getElementById('aceColPanel').classList.contains('open'), same: JSON.stringify(ACEDB) === b0,
      said: /canceled/.test(document.getElementById('shareStat').textContent) }), before);
    chk('S · Esc on the mapping box imports nothing, and says so', askd && !z.open && z.same && z.said, JSON.stringify({ askd, ...z }));
    chk('S · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`S · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

// ── U. FIT TO THE PPBE POSITION, FROM THE KEYBOARD (v2.12, item 134) ──────────────────────────────────────────────
// The plan tagged with a position that gives its first service $1 of discretionary this year, and the first requirement
// directing its whole value there on a Split: an over. In Fund, Needs attention's 🏛 entry is reached with Tab and Enter opens the
// box with the keyboard inside; Esc closes it back on the entry. FYDP ▸, then Fit to the PPBE position… by Enter, opens it too;
// Tab reaches the over's Go to it, and Enter on it closes the box and selects that requirement.
{
  try {
    const { p, ctx, errs } = await open('fund');
    const id = await p.evaluate(() => { const id = S.order[0], it = itemById(id);
      MS.ppbe = MS.ppbe || {}; MS.ppbe['POM|2099'] = { v: 2, split: true, lines: {}, val: { [SVC[0]]: { _all: { [MS.cur]: { d: 1, m: 0 } } } } };
      MS.cycle = 'POM|2099'; S.fsrc[id] = { m: 'split', dv: it.ask.slice(), mv: SVC.map(() => 0) };
      baLiveAll(); save(); render(); return id; });
    // v2.13 (item 136): from the PPBE cycle in the context bar (the injected #uiCycBtn it replaced is gone)
    const steps = await tabTo(p, '#b_cyc', '#posture .fitatt', 120);
    await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    const a = await p.evaluate(() => ({ open: document.getElementById('fitPanel').classList.contains('open'), inBox: !!(document.activeElement && document.activeElement.closest('#fitPanel')),
      entry: (document.querySelector('#posture .fitatt') || {}).textContent || '' }));
    // v2.12 RV3 (R20, K10): the entry names what the overs are against -- here one is against POM99 and the rest against the
    // services' own bases, so it says how many are against POM99
    chk('U · Needs attention’s 🏛 entry is reached with Tab, and Enter opens the fit box with the keyboard inside', steps >= 0 && a.open && a.inBox && /🏛 \d+ over (POM99|budget authority \(\d+ against POM99\))/.test(a.entry), JSON.stringify({ steps, ...a }));
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    const e1 = await p.evaluate(() => ({ open: document.getElementById('fitPanel').classList.contains('open'), cls: (document.activeElement || {}).className || '' }));
    chk('U · Esc closes it, the keyboard back on the entry', !e1.open && /fitatt/.test(e1.cls), JSON.stringify(e1));
    await p.focus('#uiNav_fydp'); await p.keyboard.press('Enter'); await p.waitForTimeout(120);
    let found = -1;
    for (let i = 0; i < 10; i++) { if (await p.evaluate(() => /toggleFit/.test((document.activeElement || {}).getAttribute ? document.activeElement.getAttribute('onclick') || '' : ''))) { found = i; break; } await p.keyboard.press('Tab'); }
    await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    const o = await p.evaluate(() => ({ open: document.getElementById('fitPanel').classList.contains('open'), inBox: !!(document.activeElement && document.activeElement.closest('#fitPanel')) }));
    chk('U · FYDP ▸, then Fit to the PPBE position… by Enter: the box opens with the keyboard inside', found >= 0 && o.open && o.inBox, JSON.stringify({ found, ...o }));
    let go = -1;
    for (let i = 0; i < 60; i++) { if (await p.evaluate(() => (document.activeElement || {}).classList && document.activeElement.classList.contains('fitgo'))) { go = i; break; } await p.keyboard.press('Tab'); }
    await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    const g = await p.evaluate(() => ({ open: document.getElementById('fitPanel').classList.contains('open'), cur: curRow }));
    chk('U · Tab reaches the over’s Go to it, and Enter closes the box and selects the requirement', go >= 0 && !g.open && g.cur === id, JSON.stringify({ go, ...g, want: id }));
    chk('U · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`U · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

// ── T. A WBS PARAGRAPH PICKED FROM THE KEYBOARD (v2.12, item 132) ───────────────────────────────────────────────────
// A paragraph is picked from the cost estimate's WBS tree: a text field with a list of "code — path". On this board with an
// estimate holding four paragraphs, and the requirement's CCaR record on one of its lines: Needs attention's ▦ entry, its
// list's Go to it and the edit box's WBS field are reached with the keys, the field reads the list with the CCaR record's
// paragraph first, a code typed shows its name under the field, a code the estimate does not hold is refused on Save with
// the text kept and the keyboard back on the field, and one it holds is saved by Enter on Save. The Add box's field and the
// quick box Classify's WBS cell opens read the same list and name the paragraph typed. Chromium draws a datalist's
// suggestions outside the page and automated Chromium does not open them from the keys (measured: ArrowDown and Enter
// leave the field as typed), so a pick is stood in for by what a pick does: the option's whole text put in the field as
// one input -- the field then holds the code alone.
{
  try {
    // the funding posture strip, and with it Needs attention, shows in Funding and Brief only (L): the edit box is reached from
    // there; the Add box and Classify are Review's
    const SEED = () => {
      const free = S.order.filter(x => !clinApplies(x) && itemById(x));
      const id = free[0], id2 = free[1];
      S.ccar = S.ccar || {}; S.ccar[id] = 'JSF7001'; S.wbs = S.wbs || {}; delete S.wbs[id]; delete S.wbs[id2];
      ACEDB.sets['T26'] = { label: 'T26', ts: 1700000000099, years: [MS.cur], appn: {}, skip: {},
        lines: [{ ap: mySlug(), pmo: grpOf(itemById(id)), svc: SVC[0], wbs: '1.2.2', ccar: 'JSF7001', v: {} }],
        wbs: { [mySlug()]: { '1': { n: 'Sustainment', lv: 1, up: '' }, '1.2': { n: 'Depot Maintenance', lv: 2, up: '1' },
          '1.2.1': { n: 'Engine Repair', lv: 3, up: '1.2' }, '1.2.2': { n: 'Support Equipment', lv: 3, up: '1.2' } } } };
      save(); render(); return [id, id2];
    };
    let { p, ctx, errs } = await open('fund');
    p.on('dialog', d => d.accept());
    const [id, id2] = await p.evaluate(SEED);
    const PATH = { '1.2': 'Sustainment › Depot Maintenance', '1.2.1': 'Sustainment › Depot Maintenance › Engine Repair',
      '1.2.2': 'Sustainment › Depot Maintenance › Support Equipment' };
    const fld = (fid) => p.evaluate(fid => { const f = document.getElementById(fid), n = document.getElementById(fid + 'Note') || document.getElementById('uipNote');
      const dl = f && document.getElementById(f.getAttribute('list') || '-');
      return { value: f ? f.value : null, note: n ? n.textContent : null, kb: document.activeElement === f,
        first: dl && dl.options[0] ? [dl.options[0].value.split(' — ')[0], dl.options[0].getAttribute('label') || ''] : null, n: dl ? dl.options.length : 0 }; }, fid);
    const pickIn = async (fid, code) => { await p.focus('#' + fid); await p.keyboard.press('Control+a'); await p.keyboard.press('Delete');
      await p.keyboard.insertText(code + ' — ' + PATH[code]); await p.waitForTimeout(120); };
    // Needs attention's ▦ entry, by Enter: its list opens; Tab reaches this requirement's Go to it; Enter opens the edit box
    // at the WBS with the keyboard on it
    const entry = await tabTo(p, '#helpBtn', 'button.e[onclick=\'attShow("wbs")\']', 60);
    if (entry >= 0) { await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
    let steps = -1;
    for (let i = 0; i < 300 && entry >= 0; i++) {
      if (await p.evaluate(id => { const a = document.activeElement; return !!(a && /attGo\("wbs",/.test(a.getAttribute('onclick') || '') && (a.getAttribute('onclick') || '').indexOf(JSON.stringify(id)) > 0); }, id)) { steps = i; break; }
      await p.keyboard.press('Tab');
    }
    if (steps >= 0) { await p.keyboard.press('Enter'); await p.waitForTimeout(300); }
    let r = await fld('erWbs');
    const box = await p.evaluate(() => document.getElementById('editPanel').classList.contains('open'));
    chk('T · Needs attention’s ▦ without a WBS, its list and Go to it, by Enter: the edit box opens at the WBS with the keyboard on it',
      entry >= 0 && steps >= 0 && box && r.kb, JSON.stringify({ entry, steps, box, kb: r.kb }));
    chk('T · the field reads the estimate’s paragraphs, the CCaR record’s first and marked suggested',
      r.n === 4 && r.first && r.first[0] === '1.2.2' && /suggested/.test(r.first[1]), JSON.stringify({ n: r.n, first: r.first }));
    // a code typed: its name under the field
    await p.keyboard.type('1.2.1'); await p.waitForTimeout(120);
    r = await fld('erWbs');
    chk('T · a code typed shows its name under the field', r.value === '1.2.1' && r.note === '1.2.1 — ' + PATH['1.2.1'], JSON.stringify(r));
    // a pick (the option's whole text, as one input): the field holds the code alone, its name under it
    await pickIn('erWbs', '1.2.2'); r = await fld('erWbs');
    chk('T · a pick leaves the code alone in the field and its name under it', r.value === '1.2.2' && r.note === '1.2.2 — ' + PATH['1.2.2'], JSON.stringify(r));
    // a code the estimate does not hold: Enter on Save refuses it, keeps the text, and the keyboard goes back to the field
    await p.focus('#erWbs'); await p.keyboard.press('Control+a'); await p.keyboard.type('9.9');
    let s = await tabTo(p, '#erWbs', '#erSaveBtn', 80);
    if (s >= 0) { await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
    r = await fld('erWbs');
    const kept = await p.evaluate(id => ({ open: document.getElementById('editPanel').classList.contains('open'), stored: JSON.stringify((S.wbs || {})[id] || null),
      say: (document.getElementById('erMsg') || { textContent: '' }).textContent }), id);
    chk('T · a code the estimate does not hold is refused on Save: nothing stored, the text kept, the keyboard back on the field',
      s >= 0 && kept.open && kept.stored === 'null' && r.value === '9.9' && r.kb && /Nothing was saved.*9\.9.*not a paragraph of the T26 estimate/.test(kept.say), JSON.stringify({ s, ...kept, value: r.value, kb: r.kb }));
    // one it holds: Enter on Save stores it
    await p.keyboard.press('Control+a'); await p.keyboard.type('1.2.1');
    s = await tabTo(p, '#erWbs', '#erSaveBtn', 80);
    if (s >= 0) { await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
    const saved = await p.evaluate(id => ({ open: document.getElementById('editPanel').classList.contains('open'), w: ((S.wbs || {})[id] || []).map(x => x.w) }), id);
    chk('T · a paragraph the estimate holds is saved by Enter on Save', s >= 0 && !saved.open && JSON.stringify(saved.w) === '["1.2.1"]', JSON.stringify({ s, ...saved }));
    const errs1 = errs.slice(); await ctx.close();
    // the Add box: Enter on Add requirement, Tab to its WBS field -- the same list, and the paragraph typed named under it
    ({ p, ctx, errs } = await open('review'));
    // v2.12 RV2 (K02): every question is accepted, but one -- the quick box's, on Esc -- is answered Cancel, and each is kept
    let dlgDismiss = false; const dlgSeen = [];
    p.on('dialog', d => { dlgSeen.push(d.message()); return dlgDismiss ? d.dismiss() : d.accept(); });
    await p.evaluate(SEED);
    await p.evaluate(id => setPmoFilter(grpOf(itemById(id))), id);
    await p.focus('#uiAddBtn'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    s = await tabTo(p, '#arEvent', '#arWbs', 60);
    await p.keyboard.type('1.2'); await p.waitForTimeout(120);
    const a1 = await fld('arWbs');
    await pickIn('arWbs', '1.2.1'); const a2 = await fld('arWbs');
    chk('T · the Add box’s WBS field is reached with Tab, reads the same list, and names the paragraph typed or picked',
      s >= 0 && a1.n === 4 && a1.note === '1.2 — ' + PATH['1.2'] && a2.value === '1.2.1' && a2.note === '1.2.1 — ' + PATH['1.2.1'], JSON.stringify({ s, a1, a2 }));
    await p.evaluate(() => { if (arOn()) arHide(); });
    // Classify's WBS cell, by Enter: the quick box opens with the keyboard on its field, reads the list, names what is typed,
    // and Enter takes it
    await p.evaluate(() => { setPmoFilter('ALL'); matOpen = true; render(); });
    const cell = await p.evaluate(id2 => { const b = [...document.querySelectorAll('#matPanel button')].find(x => (x.getAttribute('onclick') || '') === 'wbsQuick(' + JSON.stringify(id2) + ')');
      if (b) b.id = b.id || 'tWbsCell'; return b ? b.id : ''; }, id2);
    if (cell) { await p.focus('#' + cell); await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
    const q0 = await fld('uipVal');
    await p.keyboard.type('1.2.2'); await p.waitForTimeout(120);
    const q1 = await fld('uipVal');
    // v2.12 RV2 (K02): Esc with the typing there asks first (the box is saved only by its own OK); Cancel keeps the box, the typing
    // and the keyboard -- a stray key loses nothing
    dlgDismiss = true; dlgSeen.length = 0;
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    const qe = await p.evaluate(() => ({ open: /\bopen\b/.test(document.getElementById('uipPanel').className), v: document.getElementById('uipVal').value,
      kb: document.activeElement && document.activeElement.id }));
    dlgDismiss = false;
    chk('T · the quick box: Esc with a paragraph typed asks first, and Cancel keeps the box, the typing and the keyboard',
      dlgSeen.some(m => /Discard what you typed\?/.test(m)) && qe.open && qe.v === '1.2.2' && qe.kb === 'uipVal', JSON.stringify({ asked: dlgSeen.slice(0, 1), ...qe }));
    await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    const qs = await p.evaluate(id2 => ((S.wbs || {})[id2] || []).map(x => x.w), id2);
    chk('T · Classify’s WBS cell opens the quick box by Enter: the keyboard on its field, the same list, the paragraph typed named, and Enter takes it',
      !!cell && q0.kb && q0.n === 4 && q1.note === '1.2.2 — ' + PATH['1.2.2'] && JSON.stringify(qs) === '["1.2.2"]', JSON.stringify({ cell, kb: q0.kb, n: q0.n, note: q1.note, stored: qs }));
    errs.unshift(...errs1);
    chk('T · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`T · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

// ── V. THE PPBE CYCLE AT THE TOP, FROM THE KEYBOARD (v2.13, item 136) ──────────────────────────────────────────────────
// O&M (this board) is on BES28, its BES28 controls leaving the year on screen both unallocated and over (tools/cyc-seed.mjs), and
// Full Fund's plan in this browser is on PB27 -- put in browser storage by a seed page before the board opens, never by an init
// script (tools/pmo-save.mjs says why). So the PPBE cycle reads ⚠ Mixed, and the figure beside it is on screen as the board
// opens. Tab from the context bar's first control reaches the PPBE cycle; Tab from it reaches the figure, and Enter opens Fit to
// the PPBE position with the keyboard inside, Esc closing it back on the figure. Enter on the PPBE cycle opens its list, naming
// each appropriation's cycle (⚠ on the one off the latest); Esc from inside it closes it with the keyboard back on the button.
// Opened again, Tab reaches the first "Put every appropriation on …" item -- the cycle after the latest any is on, so BOTH
// appropriations move -- and Enter on it, its one question answered OK, puts each one's stored plan on that cycle (this board's
// and Full Fund's, in browser storage), with a journal line in each, and leaves the keyboard on the PPBE cycle, which then names
// that cycle. (The figure is read as the board opens: v2.13's first cut opened it hidden until the first redraw.)
{
  try {
    const LIVEC = buildPopulated(FILE, CYC_TAG_SEED);
    const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
    await seedLs(ctx, { spmtTheme: 'harbor', spmtMode: 'review', prio27who: 'Pat', [CYC_KEY.ff]: cycOtherStore('PB|2027') }, [CYC_KEY.om, CYC_KEY.sp, CYC_KEY.opn]);
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    const asked = []; p.on('dialog', d => { asked.push(d.type() + ': ' + d.message()); d.accept(); });
    await p.goto('file://' + LIVEC);
    await p.waitForFunction(() => typeof render === 'function' && document.querySelectorAll('#list .row').length > 0, null, { timeout: 40000 });
    await p.waitForTimeout(300);
    const st0 = await p.evaluate(() => { const f = document.getElementById('cycFit');
      return { seeded: !!localStorage.getItem('prio27ff'), own: MS.cycle, btn: document.getElementById('b_cyc').textContent, fit: f.hidden ? null : f.textContent }; });
    // beside a Mixed bar the figure names the cycle it is against (cycFitTxt)
    chk('V · the board opens with its appropriations on different cycles: the PPBE cycle reads ⚠ Mixed, and the figure beside it states what BES28’s controls leave, unallocated and over',
      st0.seeded && st0.own === 'BES|2028' && st0.btn === '⚠ Mixed ▾' && /^BES28 · FY\d\d · \$[\d.]+[KMB] unallocated · ⚠ \$[\d.]+[KMB] over$/.test(st0.fit || ''), JSON.stringify(st0));
    const s1 = await tabTo(p, '#appnSel', '#b_cyc', 10);
    chk('V · Tab from the context bar’s first control reaches the PPBE cycle', s1 > 0, s1 > 0 ? `${s1} Tab(s)` : 'never reached');
    // the figure: Tab reaches it, Enter opens Fit to the PPBE position with the keyboard inside, Esc closes it back on the figure
    const s2 = await tabTo(p, '#b_cyc', '#cycFit', 10);
    if (s2 > 0) { await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
    const f1 = await p.evaluate(() => ({ open: document.getElementById('fitPanel').classList.contains('open'), inBox: !!(document.activeElement && document.activeElement.closest('#fitPanel')) }));
    chk('V · Tab reaches the figure beside it, and Enter opens Fit to the PPBE position with the keyboard inside', s2 > 0 && f1.open && f1.inBox, JSON.stringify({ steps: s2, ...f1 }));
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    const f2 = await p.evaluate(() => ({ open: document.getElementById('fitPanel').classList.contains('open'), focus: document.activeElement && document.activeElement.id }));
    chk('V · Esc closes it, the keyboard back on the figure', !f2.open && f2.focus === 'cycFit', JSON.stringify(f2));
    // Enter opens the list; Esc from inside it closes it, the keyboard back on the button
    await p.focus('#b_cyc'); await p.keyboard.press('Enter'); await p.waitForTimeout(120);
    const m1 = await p.evaluate(() => ({ open: openMenu, exp: document.getElementById('b_cyc').getAttribute('aria-expanded'),
      rows: [...document.querySelectorAll('#dd_cyc .cycall-row')].map(r => r.getAttribute('data-ap') + ':' + r.querySelector('span').textContent.replace(/\s+/g, ' ').trim()) }));
    chk('V · Enter opens the PPBE cycle’s list and says so, naming each appropriation’s cycle and marking ⚠ the one off the latest',
      m1.open === 'cyc' && m1.exp === 'true' && m1.rows.some(r => /^om:BES28 \(this board\)$/.test(r)) && m1.rows.some(r => /^ff:PB27 ⚠$/.test(r)), JSON.stringify(m1));
    await p.keyboard.press('Tab');
    const inList = await p.evaluate(() => !!(document.activeElement && document.activeElement.closest('#dd_cyc')));
    await p.keyboard.press('Escape'); await p.waitForTimeout(120);
    const m2 = await p.evaluate(() => ({ open: openMenu, focus: document.activeElement && document.activeElement.id, exp: document.getElementById('b_cyc').getAttribute('aria-expanded') }));
    chk('V · Esc from inside the list closes it, the keyboard back on the PPBE cycle', inList && m2.open === null && m2.focus === 'b_cyc' && m2.exp === 'false', JSON.stringify({ inList, ...m2 }));
    // opened again: Tab to the first "Put every appropriation on …" item, Enter on it, OK to its one question
    await p.keyboard.press('Enter'); await p.waitForTimeout(120);
    let key = '', s3 = -1;
    for (let i = 0; i < 12; i++) {
      await p.keyboard.press('Tab');
      key = await p.evaluate(() => { const a = document.activeElement, h = (a && a.closest('#dd_cyc') && a.getAttribute('onclick')) || '';
        const m = /cycApplyAll\("([^"]+)"\)/.exec(h); return m ? m[1] : ''; });
      if (key) { s3 = i + 1; break; }
    }
    if (s3 > 0) { await p.keyboard.press('Enter'); await p.waitForTimeout(600); }
    const a = await p.evaluate(() => { const rd = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
      const om = rd('prio27om'), ff = rd('prio27ff'), jl = st => ((st && st.jrnl) || []).filter(e => e && e.p && e.p[0] === '(cycle)').map(e => (e.a || '') + '>' + (e.b || ''));
      return { MS: MS.cycle, om: om && om.cycle, ff: ff && ff.cycle, jom: jl(om), jff: jl(ff), mixed: cycAll().mixed,
        btn: document.getElementById('b_cyc').textContent, focus: document.activeElement && document.activeElement.id, open: openMenu }; });
    const want = key ? key.split('|')[0] + key.split('|')[1].slice(-2) : '';
    chk('V · Tab reaches the first “Put every appropriation on …” item -- a cycle neither appropriation is on, so both must move',
      s3 > 0 && /^(POM|BES|DoN|PB)\|\d{4}$/.test(key) && key !== 'BES|2028' && key !== 'PB|2027', JSON.stringify({ steps: s3, key }));
    chk('V · Enter on it asks once, naming both appropriations, and OK puts every appropriation’s stored plan on that cycle, each with its journal line',
      asked.length === 1 && /^confirm: Put every appropriation on /.test(asked[0]) && asked[0].indexOf(want + '?') > 0 && /O&M \(this board\) — BES28 → /.test(asked[0]) && /Full Fund — PB27 → /.test(asked[0])
      && a.MS === key && a.om === key && a.ff === key && !a.mixed && a.jom.indexOf('BES|2028>' + key) >= 0 && a.jff.indexOf('PB|2027>' + key) >= 0,
      JSON.stringify({ asked: asked.map(x => x.slice(0, 90)), ...a }));
    chk('V · and the keyboard is back on the PPBE cycle, which names that cycle', a.open === null && a.focus === 'b_cyc' && a.btn === want + ' ▾', JSON.stringify({ focus: a.focus, btn: a.btn, want }));
    chk('V · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } catch (e) { chk(`V · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 140)); }
}

await b.close();
console.log(bad ? `\n${bad} keyboard check(s) failed\n` : '\nThe keyboard reaches the message, the record fields, the kept-aside put-back, the modes, every menu item and every folded group, Find, the Funding detail headers, the fit chips, the row menu and a row field typed into and left, Save diagnostics, the repaired-award controls, the Add box, FYDP Disconnects, the cost estimate import’s mapping box and report, the fit to the PPBE position, a WBS paragraph picked and the PPBE cycle at the top, and each one works\n');
process.exit(bad ? 1 : 0);
