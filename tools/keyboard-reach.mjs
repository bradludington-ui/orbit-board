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

await b.close();
console.log(bad ? `\n${bad} keyboard check(s) failed\n` : '\nThe keyboard reaches the message, the record fields, the kept-aside put-back and the modes, and each one works\n');
process.exit(bad ? 1 : 0);
