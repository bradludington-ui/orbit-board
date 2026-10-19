// EVERY BOX TAKES THE KEYBOARD (v1.93, item 39). Measured on v1.92, of the 34 boxes that open from their own
// button: in 33 the keyboard stayed behind the box, in 31 Tab walked out onto the board, Esc closed two, closing
// dropped the keyboard at the top of the page, and two were named dialogs.
//
// This opens every box the way a person does -- the menu or button that opens it, by keyboard -- and for each:
//   - the keyboard is inside the box, and the box is a named dialog (role, aria-modal, a name);
//   - twice as many Tab presses as the box has controls, and as many Shift+Tab, never leave it;
//   - the board behind takes no focus, and nothing of it is under the pointer anywhere outside the box;
//   - Esc closes it, and the keyboard goes back to the control that opened it (or the menu button it came from);
//   - in a box with a text field: typing and then Esc, ✕ Close or a click outside each ASK first, Cancel keeps the
//     box open with the text, and OK on Esc then closes it.
// And one box opened from another: Esc closes the top one and hands the keyboard back to the one below.
//
//   node tools/dialogs-keyboard.mjs
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
import { CHROME } from './chrome.mjs';
import { buildPopulated } from './ia-fixture.mjs';

const BOARD = process.env.BOARD || resolve(new URL('..', import.meta.url).pathname, 'prioritization-board-grid.html');
const LIVE = buildPopulated(BOARD);
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
// v2.00 (UI S4, fix round): TWICE -- the RECORD panel sliding over the table (the board's default) and docked beside it,
// set as View › Record panel › Docked beside the table sets it (prio27uiDock = '1' in this browser). At 1600 docked is the
// panel beside the rows, where the panel's own boxes were opened from before the UI; every check below is made in each
// pass, and each pass first checks where the panel is. A problem found docked is marked so.
const bad = [], skipped = [];
for (const [pass, docked] of [['sliding over', false], ['docked', true]]) {
const n0 = bad.length;
const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
let confirmAnswer = false; const asked = [];
p.on('dialog', d => { const t = d.type(); if (t === 'prompt') return d.accept('Probe');
  if (t === 'confirm') { asked.push(d.message()); return confirmAnswer ? d.accept() : d.dismiss(); } return d.accept(); });
const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 140)));
await p.addInitScript(() => { try { localStorage.setItem('spmtTheme', 'harbor'); localStorage.setItem('prio27who', 'Probe'); } catch (e) {} });
if (docked) await p.addInitScript(() => { try { localStorage.setItem('prio27uiDock', '1'); } catch (e) {} });
await p.goto('file://' + LIVE); await p.waitForFunction(() => typeof render === 'function'); await p.waitForTimeout(600);
// a selected requirement, so the RECORD panel's own boxes have their buttons
await p.evaluate(() => { const r = gridRows()[0]; if (r) setCur(r.dataset.id || r.id.replace(/^row-/, '')); });
await p.waitForTimeout(200);
const place = await p.evaluate(() => ({ pos: getComputedStyle(document.getElementById('inspector')).position, dock: document.documentElement.classList.contains('ui-dock') }));
if (docked ? (place.pos === 'fixed' || !place.dock) : (place.pos !== 'fixed' || place.dock))
  bad.push(`the RECORD panel is not ${docked ? 'docked beside the table' : 'a drawer over the table'} (position ${place.pos}, docked setting ${place.dock ? 'on' : 'off'})`);

// how each box is opened: the code its backdrop runs to close it names the switch, and an opener runs the same
const BOXES = await p.evaluate(() => [...document.querySelectorAll('body > .modal-bg[id]')].map(bg => {
  const oc = bg.getAttribute('onclick') || '';
  let pat = (/this\)\s*([A-Za-z0-9_]+)\(/.exec(oc) || [])[1] || null;
  // v2.00 (UI S4): the Import box closes with uiImpClose() and opens with uiImpOpen(), from the toolbar's Import button
  const KNOWN = { helpClose: 'openHelp(', fldClose: 'toggleCons(', subClose: 'subOpenReview(', attClose: 'attShow(', uiImpClose: 'uiImpOpen(' };
  if (pat && KNOWN[pat]) pat = KNOWN[pat]; else if (pat) pat += '(';
  if (!pat) { const v = (/this\)\s*([A-Za-z0-9_]+)\s*=/.exec(oc) || [])[1];
    pat = ({ wbsOpen: 'toggleWbs(', matOpen: 'toggleMat(', rollOpen: 'toggleRoll(', recOpen: 'toggleRec(', ndOpen: 'ndOpen=true' })[v] || null; }
  return { id: bg.id, pat };
}));
const viaFn = [];
let opened = 0, typed = 0, impBack = 0;
const st = () => p.evaluate(() => { const a = document.activeElement;
  const bg = a && a.closest ? a.closest('body > .modal-bg') : null;
  return { in: bg ? bg.id : null, id: a ? (a.id || a.tagName.toLowerCase()) : null }; });
// open as the page shows it -- the check reads the page, not the board's own controller, so it runs on any build
const isOpen = id => p.evaluate(id => { const bg = document.getElementById(id); return getComputedStyle(bg).display !== 'none'; }, id);
// a point on the box's backdrop, clear of the box itself
const outside = id => p.evaluate(id => { const bg = document.getElementById(id), r = bg.querySelector('.modal').getBoundingClientRect();
  const tries = [[4, innerHeight - 4], [r.left - 6, r.top + 10], [r.right + 6, r.top + 10], [innerWidth / 2, r.bottom + 6], [innerWidth / 2, 4]];
  const ok = tries.find(([x, y]) => x >= 0 && y >= 0 && x < innerWidth && y < innerHeight && document.elementFromPoint(x, y) === bg);
  return ok || null; }, id);
// open it as a person does: the menu by its button and the item by Enter, or the button by Enter
const openBox = async box => {
  const how = await p.evaluate(pat => {
    // a menu item runs the switch through mRun(name), a button calls name(...): the name alone, as a word
    const nm = /\($/.test(pat) ? new RegExp('\\b' + pat.slice(0, -1) + '\\b') : null;
    const has = e => { const oc = e.getAttribute('onclick') || ''; return nm ? nm.test(oc) : oc.indexOf(pat) >= 0; };
    const mi = [...document.querySelectorAll('.menu[id^="m_"] .mdd button, .menu[id^="m_"] .mdd .mi')].find(has);
    if (mi) return { menu: mi.closest('.menu[id^="m_"]').id.slice(2) };
    const bt = [...document.querySelectorAll('button, [role="button"], a')].find(e => has(e) && e.getClientRects().length && !e.closest('.modal-bg'));
    if (bt) { bt.setAttribute('data-probe', '1'); return { btn: true }; }
    return null; }, box.pat);
  if (!how) return null;
  if (how.menu) {
    await p.focus('#b_' + how.menu); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
    const found = await p.evaluate(([pat, m]) => {
      const nm = /\($/.test(pat) ? new RegExp('\\b' + pat.slice(0, -1) + '\\b') : null;
      const mi = [...document.querySelectorAll('#m_' + m + ' .mdd button, #m_' + m + ' .mdd .mi')]
        .find(e => { const oc = e.getAttribute('onclick') || ''; return (nm ? nm.test(oc) : oc.indexOf(pat) >= 0) && e.getClientRects().length && !e.disabled; });
      if (mi) mi.setAttribute('data-probe', '1'); return !!mi; }, [box.pat, how.menu]);
    if (!found) { await p.keyboard.press('Escape'); return null; }
    await p.focus('[data-probe="1"]'); await p.keyboard.press('Enter');
  } else { await p.focus('[data-probe="1"]'); await p.keyboard.press('Enter'); }
  await p.waitForTimeout(250);
  await p.evaluate(() => { const e = document.querySelector('[data-probe]'); if (e) e.removeAttribute('data-probe'); });
  return how;
};
for (const box of BOXES) {
  if (box.id === 'uipPanel') { skipped.push('uipPanel (the in-app prompt opens only where the browser has no prompt of its own)'); continue; }
  if (!box.pat) { bad.push(`${box.id}: no way to open it found`); continue; }
  await p.evaluate(() => { window.scrollTo(0, 0); document.body.focus(); });
  let how = await openBox(box);
  if (!how || !(await isOpen(box.id))) {
    // not reachable from a control on this board as it stands (needs data the fixture lacks): open it by its switch
    await p.evaluate(pat => { try { (0, eval)(pat.replace(/\($/, '()').replace('ndOpen=true', 'ndOpen=true;render()').replace('attShow()', "attShow('oblig')")
      .replace('toggleCons()', 'toggleCons(curRow)').replace('toggleRec()', 'toggleRec(curRow)').replace('toggleWbs()', "toggleWbs('req',curRow,'')")); } catch (e) {} }, box.pat);
    await p.waitForTimeout(200);
    if (!(await isOpen(box.id))) { bad.push(`${box.id}: did not open`); continue; }
    viaFn.push(box.id); how = { fn: true };
  }
  opened++;
  const s0 = await st();
  if (s0.in !== box.id) bad.push(`${box.id}: the keyboard is not in the box when it opens (it is on ${s0.id})`);
  const meta = await p.evaluate(id => { const m = document.querySelector('#' + id + ' .modal');
    const lb = m.getAttribute('aria-labelledby'), nm = m.getAttribute('aria-label') || (lb && document.getElementById(lb) ? document.getElementById(lb).textContent : '');
    const N = [...m.querySelectorAll('button, [href], input, select, textarea, summary, [tabindex]')].filter(e => !e.disabled && e.getAttribute('tabindex') !== '-1' && e.getClientRects().length).length;
    const pt = document.elementFromPoint(3, innerHeight - 3);
    return { role: m.getAttribute('role'), modal: m.getAttribute('aria-modal'), name: (nm || '').trim(), N,
      under: pt ? (pt.id === id || (pt.closest && pt.closest('#' + id)) ? 'box' : (pt.id || pt.tagName)) : 'none',
      inert: !!document.querySelector('body > .hdr[inert], body > header[inert]') || [...document.body.children].some(c => c.id !== id && c.hasAttribute('inert')) }; }, box.id);
  if (meta.role !== 'dialog' || meta.modal !== 'true' || !meta.name) bad.push(`${box.id}: not a named dialog (role ${meta.role}, aria-modal ${meta.modal}, name "${meta.name}")`);
  if (meta.under !== 'box') bad.push(`${box.id}: outside the box the pointer reaches ${meta.under}, not the box’s backdrop`);
  if (!meta.inert) bad.push(`${box.id}: the board behind is not made inert`);
  const presses = Math.min(2 * meta.N + 2, 60);
  for (const key of ['Tab', 'Shift+Tab']) {
    for (let i = 0; i < presses; i++) { await p.keyboard.press(key);
      const s = await st(); if (s.in !== box.id) { bad.push(`${box.id}: ${key} #${i + 1} leaves the box (to ${s.id})`); break; } }
  }
  const behind = await p.evaluate(id => { const t = document.getElementById('saveBtn') || document.querySelector('#list button'); if (!t) return 'none'; t.focus(); const a = document.activeElement; return a === t ? 'took focus' : 'refused'; }, box.id);
  if (behind === 'took focus') bad.push(`${box.id}: a control behind the box took focus`);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  if (await isOpen(box.id)) { bad.push(`${box.id}: Esc did not close it`); await p.evaluate(id => { const bg = document.getElementById(id); bg.classList.remove('open'); bg.style.display = 'none';
    if (typeof dlgSync === 'function') dlgSync(); }, box.id); continue; }
  const s1 = await st();
  if (!how.fn) {
    const want = how.menu ? 'b_' + how.menu : null;
    if (s1.in || s1.id === 'body' || (want && s1.id !== want && !(await p.evaluate(() => !!document.activeElement.closest('.menu')))))
      bad.push(`${box.id}: closing left the keyboard on ${s1.id}${want ? ' (want ' + want + ' or its item)' : ''}`);
  }
  // TYPING IS NEVER LOST TO A STRAY KEY
  const reopen = async () => { if (how.fn) await p.evaluate(pat => { try { (0, eval)(pat.replace(/\($/, '()').replace('ndOpen=true', 'ndOpen=true;render()').replace('attShow()', "attShow('oblig')").replace('toggleCons()', 'toggleCons(curRow)').replace('toggleRec()', 'toggleRec(curRow)').replace('toggleWbs()', "toggleWbs('req',curRow,'')")); } catch (e) {} }, box.pat);
    else await openBox(box); await p.waitForTimeout(200); };
  const field = await (async () => { await reopen(); return p.evaluate(id => {
    const f = [...document.querySelectorAll('#' + id + ' .modal input, #' + id + ' .modal textarea')].find(e => !e.disabled && !e.readOnly
      && e.getClientRects().length && (e.tagName === 'TEXTAREA' || /^(text|search|)$/.test(e.getAttribute('type') || ''))
      && !(e.hasAttribute('oninput') && !e.hasAttribute('data-held')));     // a filter applied as typed has nothing to lose
    if (!f) return null; f.setAttribute('data-probe-f', '1'); return true; }, box.id); })();
  if (field) {
    typed++;
    await p.focus('[data-probe-f="1"]'); await p.keyboard.type('qz');
    const val = () => p.evaluate(() => { const f = document.querySelector('[data-probe-f="1"]'); return f ? f.value : null; });
    for (const how2 of ['Escape', 'close', 'outside']) {
      asked.length = 0; confirmAnswer = false;
      if (how2 === 'Escape') { await p.focus('[data-probe-f="1"]').catch(() => {}); await p.keyboard.press('Escape'); }
      else if (how2 === 'close') {
        const at = await p.evaluate(id => { const m = document.querySelector('#' + id + ' .modal'), bs = [...m.querySelectorAll('button')];
          const c = m.querySelector('h3 button.x') || bs.find(b => /^(✕\s*)?Close$/.test(b.textContent.trim())) || bs.find(b => b.textContent.trim() === 'Cancel');
          if (!c) return null; c.scrollIntoView({ block: 'nearest' });
          const r = c.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, box.id);
        if (!at) { bad.push(`${box.id}: no close control`); break; }
        await p.mouse.click(at[0], at[1]);
      } else {
        const at = await outside(box.id);
        if (!at) { bad.push(`${box.id}: no point on the backdrop outside the box`); break; }
        await p.mouse.click(at[0], at[1]);
      }
      await p.waitForTimeout(200);
      const v = await val();
      if (!asked.some(m => /Discard what you typed\?/.test(m))) bad.push(`${box.id}: typing, then ${how2}: it did not ask before discarding`);
      if (!(await isOpen(box.id)) || !(v || '').includes('qz')) bad.push(`${box.id}: typing, then ${how2}, Cancel: the box or the text was lost`);
      if (!(await isOpen(box.id))) break;
    }
    if (await isOpen(box.id)) {
      confirmAnswer = true; await p.focus('[data-probe-f="1"]').catch(() => {}); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      if (await isOpen(box.id)) bad.push(`${box.id}: typing, then Esc, OK: the box stayed open`);
      confirmAnswer = false;
    }
  } else if (await isOpen(box.id)) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); }
  await p.evaluate(() => { const f = document.querySelector('[data-probe-f]'); if (f) f.removeAttribute('data-probe-f'); });
}
// v2.00 (UI S4): THE IMPORT BOX HANDS THE KEYBOARD BACK TO THE CONTROL THAT OPENED IT -- the toolbar's Import or the
// sidebar's Imports -- on Esc, ✕ Close, Cancel and a click outside. Opened from the keyboard (Enter), and by a mouse click
// on a button that takes no focus from the click (as Safari's and Firefox's on a Mac do not: the press is held back here),
// with the keyboard last in the search box -- where it would be handed back to if the box did not know its opener.
if (await p.evaluate(() => !!document.getElementById('uiImpPanel'))) {
  for (const opener of ['#uiImpBtn', '#uiNav_imp']) for (const how of ['key', 'click']) for (const close of ['Escape', 'close', 'cancel', 'outside']) {
    await p.evaluate(() => { window.scrollTo(0, 0); });
    await p.focus('#q');
    if (how === 'key') { await p.focus(opener); await p.keyboard.press('Enter'); }
    else {
      await p.evaluate(sel => { const b = document.querySelector(sel); b.__noFocus = e => e.preventDefault(); b.addEventListener('mousedown', b.__noFocus); }, opener);
      await p.click(opener);
      await p.evaluate(sel => { const b = document.querySelector(sel); b.removeEventListener('mousedown', b.__noFocus); }, opener);
    }
    await p.waitForTimeout(200);
    const o = await st();
    if (!(await isOpen('uiImpPanel')) || o.in !== 'uiImpPanel') { bad.push(`uiImpPanel from ${opener} (${how}): did not open with the keyboard in it`); await p.evaluate(() => uiImpClose()); continue; }
    if (close === 'Escape') await p.keyboard.press('Escape');
    else if (close === 'close') await p.click('#uiImpPanel h3 button.x');
    else if (close === 'cancel') await p.click('#uiImpPanel .uiImpFoot button:has-text("Cancel")');
    else { const at = await outside('uiImpPanel'); if (!at) { bad.push('uiImpPanel: no point on the backdrop outside the box'); continue; } await p.mouse.click(at[0], at[1]); }
    await p.waitForTimeout(200);
    const c = await st();
    if (await isOpen('uiImpPanel')) { bad.push(`uiImpPanel from ${opener} (${how}): ${close} did not close it`); await p.evaluate(() => uiImpClose()); continue; }
    if ('#' + c.id !== opener) bad.push(`uiImpPanel from ${opener} (${how}): ${close} left the keyboard on ${c.id}, not on ${opener}`);
    else impBack++;
  }
}
// ONE BOX OPENED FROM ANOTHER: the top one closes first and the keyboard goes back into the one below
await p.evaluate(() => { document.body.focus(); togglePf(); });
await p.waitForTimeout(200);
await p.evaluate(() => { toggleJrnl(); }); await p.waitForTimeout(200);
const two = await st();
await p.keyboard.press('Escape'); await p.waitForTimeout(200);
const back = await st();
if (two.in !== 'jrnlPanel') bad.push(`stacked: the keyboard did not go into the box opened on top (it is on ${two.in || two.id})`);
if (back.in !== 'pfPanel' || !(await isOpen('pfPanel'))) bad.push(`stacked: Esc on the top box did not hand the keyboard back to the one below (it is on ${back.in || back.id})`);
await p.keyboard.press('Escape'); await p.waitForTimeout(200);
await ctx.close();
console.log(`\n${pass} -- boxes: ${opened} opened (${opened - viaFn.length} from their own menu or button by keyboard, ${viaFn.length} by their switch: ${viaFn.join(', ') || 'none'}), ${typed} with a text field typed in`);
if (impBack) console.log(`the Import box handed the keyboard back to its opener ${impBack} time(s) of 16 (two openers, by key and by a click that takes no focus, each way of closing it)`);
if (errs.length) bad.push('page errors: ' + errs.slice(0, 3).join(' | '));
if (docked) for (let i = n0; i < bad.length; i++) bad[i] = 'docked: ' + bad[i];
}
await b.close();
[...new Set(skipped)].forEach(x => console.log('  — skipped: ' + x));
if (bad.length) { console.log(`${bad.length} PROBLEM(S)`); bad.slice(0, 80).forEach(x => console.log('  ✗ ' + x)); process.exit(1); }
console.log('every box takes the keyboard, keeps it, gives it back, and asks before typing is lost -- with the RECORD panel sliding over and docked');
