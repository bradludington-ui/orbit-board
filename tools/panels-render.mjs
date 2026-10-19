// EVERY PANEL MUST OPEN, AND NOTHING ON IT MAY SHOW AN ESCAPED ENTITY.
//
// Two failures this file exists to stop, both found by photographing the board panel by panel:
//
//  1. A panel that does not open. Nothing else here can see it — the export suites read the
//     workbook, the board audit reads the engine, and a modal that never appears is invisible to
//     both. The one that started this showed the board's OWN requirements as $0.00M.
//  2. Text escaped twice. chip() in the funds-flow panel escapes its own label, and two callers
//     escaped first, so every category with an ampersand read "Workforce &amp; Travel" on screen.
//     No total was wrong, so no arithmetic check could ever have noticed.
//
// Each panel is opened the way the product opens it, read back from the LIVE DOM rather than from
// the serialized source, and a panel that fails to appear is a FAILURE — never a skip.
//
//   node tools/panels-render.mjs
import { chromium } from 'playwright-core';
import { boot, seed } from './export-audit/boot.mjs';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { CHROME } from './chrome.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const SVCN = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'];
const items = Array.from({ length: 12 }, (_, i) => ({
  id: 'R' + i, grp: ['PSM', 'AV', 'MxS'][i % 3], team: 'PSM', sect: '', custom: false,
  title: 'OGC - Requirement ' + i, event: 'Ev ' + i, ccar: 'JSF' + (5000 + i),
  fy26: SVCN.map(() => 0), ask: SVCN.map((_, j) => (i + 1) * (j + 2) * 250000), alloc: null }));
const sc = { services: SVCN, items,
  disc: [620, 120, 60, 100, 40, 60].map(p => p * 1e6),
  mand: [62, 12, 6, 10, 4, 6].map(p => p * 1e6),
  order: items.map(x => x.id), mc: { R0: true, R3: true } };

// Panels whose opener is not reachable from the backdrop's own onclick: they need a context —
// a drilled-down cell, a selected requirement, a pending submittal. Drive each the way the
// product does. A panel added to the file without an entry here is caught by the generic sweep.
const SPECIAL = {
  matPanel:  `matOpen=true; matBody();`,
  rollPanel: `rollOpen=true; rollBody();`,
  recPanel:  `recOpen=S.order[0]; recBody();`,
  wbsPanel:  `toggleWbs('req', S.order[0], '');`,
  subPanel:  `subOpenReview();`,
  // The pop-up editor for the three written fields. It needs a requirement to be editing.
  fldPanel:  `openFld(S.order[0], 'cons');`,
  // v1.86: the fix list for what is set higher than it draws -- a split typed past the requirement
  // value on the last row, so the panel has a line to show -- and the guide, open on its contents.
  ndPanel:   `S.fsrc[S.order[S.order.length-1]]={m:'split', dv:SVC.map(function(){ return 9e11; }), mv:SVC.map(function(){ return 0; })};
              ndOpen=true; render();`,
  helpPanel: `openHelp('');`,
  // v1.93 (item 42): a Needs attention list -- the missing obligation dates, which the fixture has
  attPanel:  `attShow('oblig');`,
  // v2.00 (UI S4): the Import box -- its backdrop runs uiImpClose(); it is opened by uiImpOpen(), as Import and Imports do
  uiImpPanel: `uiImpOpen();`,
  // uiPrompt only falls through to this panel where window.prompt throws (Electron). A browser
  // answers the native prompt, so drive the fallback path itself.
  uipPanel:  `_uipCb=function(){}; document.getElementById('uipMsg').textContent='Name this scenario';
              document.getElementById('uipVal').value='FY27 POM Draft';
              document.getElementById('uipPanel').className='modal-bg open';`,
};
// Inline panels: class "addp", shown with style.display, not a modal backdrop.
const INLINE = {
  addPanel: `toggleAdd();`,
  rmPanel:  `rmOpen=true; render();`,
};
// v1.90 (item 27): Active year, Budget year, FYDP, Tools and Export became Reports & exports, Data and
// Setup; the Fund tools carry the spend plan basis menu, and below 1100px (or when the task bar is too
// full) the mode's tools fold into one menu. PREP puts the board in the state each one is shown in.
const MENUS = { reports: 'Reports & exports', data: 'Data', setup: 'Setup', share: 'File', view: 'Filter',
                fy: 'FY', pmo: 'PMO', basis: 'Spend plan basis', modetools: 'Mode tools' };
const PREP = { basis: `uiMode='fund'; uiApply(); render();`,
               modetools: `uiMode='fund'; uiApply(); render();` };   // and a 1000px window: see below
// Visible text that should never contain an escape sequence. "&amp;" on screen means something
// escaped text that was escaped already; "\\u{1F553}" means a JS escape was written straight into
// markup, where nothing interprets it -- the Change Journal heading read exactly that for a while.
const ENTS = /&(amp|lt|gt|quot|#\d+|#x[0-9a-fA-F]+);|\\u\{?[0-9a-fA-F]{4}/;

let bad = 0;
const chk = (what, ok, detail) => { if (!ok) bad++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? '   ' + detail : ''}`); };

const dir = mkdtempSync(join(tmpdir(), 'spmt-panels-'));
process.on('exit', () => { try { rmSync(dir, { recursive: true, force: true }); } catch {} });   // the copies are scratch; leave nothing behind
const b = await chromium.launch({ executablePath: CHROME,
                                  args: ['--no-sandbox'] });
for (const f of ['prioritization-board-grid.html']) {
  console.log('\n' + f);
  const { ev } = boot({ html: readFileSync(resolve(ROOT, f), 'utf8') });
  seed(ev, sc);
  // rmPanel only appears when something HAS been removed, and addPanel needs a service list, so
  // the board this runs on carries both. A panel that cannot be opened because the fixture is
  // empty is a check that passes while covering nothing.
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.order.forEach(function(id,i){ if(i%3===0) S.band[id]='pdm'; S.pid[id]='PID'+(9000+i); });
      ['R9','R10','R11'].forEach(function(id){ var k=S.order.indexOf(id);
        if(k>=0){ S.order.splice(k,1); S.removed.push(id); } });
      applyState(S); save(); 'ok'`);
  const file = join(dir, f);
  writeFileSync(file, ev('buildSavedHtml()'));

  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const pageErrs = [];
  p.on('pageerror', e => pageErrs.push(e.message.slice(0, 140)));
  await p.goto('file://' + file);
  await p.waitForFunction(() => typeof render === 'function' && document.querySelectorAll('.row').length > 0,
    null, { timeout: 40000 });

  // v1.92 (item 36): EVERY CONTROL INSIDE A BOX IS ONE THE KEYBOARD REACHES. The static rule in
  // check.mjs reads the markup; this reads what each box actually drew. A visible element with a
  // click handler must be a native control or carry role and tabindex="0" -- a <div onclick> or a
  // <span onclick> is a control a keyboard user can see and cannot use. Backdrops and handlers that
  // only stop a click travelling to the backdrop are not controls.
  await p.evaluate(() => {
    const NATIVE = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY', 'OPTION']);
    window.__kbOff = root => {
      const out = [];
      if (!root) return out;
      root.querySelectorAll('[onclick]').forEach(el => {
        const h = (el.getAttribute('onclick') || '').trim();
        if (/^event\.stopPropagation\(\);?$/.test(h)) return;
        if (el.classList.contains('modal-bg')) return;
        if (!el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') return;
        if (NATIVE.has(el.tagName) || (el.tagName === 'A' && el.hasAttribute('href'))) return;
        if (el.tabIndex >= 0 && el.getAttribute('role')) return;
        out.push('<' + el.tagName.toLowerCase() + '> "' + (el.textContent || el.getAttribute('title') || '')
          .replace(/\s+/g, ' ').trim().slice(0, 30) + '" → ' + h.slice(0, 40));
      });
      return out;
    };
  });

  // Closing is not a matter of removing the class: render() reads each panel's OPEN FLAG and puts
  // it straight back. Reset the flags, re-render, then strip whatever survived.
  const FALSE = ['aceOpen','bandPanelOpen','blOpen','bmOpen','budOpen','coaPanelOpen','crOpen','divOpen',
    'edOpen','entOpen','exOpen','exwOpen','fcOpen','flowEntOpen','flowOpen','flowRepOpen','flowRuleOpen',
    'hardOpen','idsOpen','jrnlOpen','liveOpen','matOpen','pfOpen','pkgOpen','planOpen','pmoOpen','poOpen',
    'posOpen','ppOpen','qpeOpen','rcnOpen','rlgOpen','rollOpen','rpOpen','rmOpen','spOpen','subOpen',
    'svcPanelOpen','addOpen','budRegOpen','diagOpen'];
  const NUL = ['recOpen', 'wbsOpen', 'attOpen'];
  const closeAll = () => p.evaluate(({ F, N }) => {
    const set = (n, v) => { try { (0, eval)(n + '=' + v); } catch (_) {} };
    F.forEach(n => set(n, 'false')); N.forEach(n => set(n, 'null'));
    try { render(); } catch (_) {}
    document.querySelectorAll('.modal-bg').forEach(e => { e.className = 'modal-bg'; e.style.display = ''; });
    document.querySelectorAll('.menu.open').forEach(m => m.classList.remove('open'));
  }, { F: FALSE, N: NUL });

  // Read every modal and its opener off the LIVE DOM.
  const panels = await p.evaluate(() => [...document.querySelectorAll('.modal-bg')].map(el => {
    const m = (el.getAttribute('onclick') || '').match(/([A-Za-z_$][\w$]*)\s*\(\s*\)/);
    return { id: el.id, fn: m ? m[1] : null };
  }));
  chk('the file has modal panels to check', panels.length > 0, panels.length + ' found');

  // NOT EVERY PANEL IS A MODAL. addPanel and rmPanel are inline, class "addp", toggled by
  // style.display rather than a class -- so a sweep over .modal-bg alone silently skipped two
  // panels and reported itself complete. Anything ending in "Panel" has to be accounted for.
  const everyPanel = await p.evaluate(() =>
    [...document.querySelectorAll('[id$="Panel"]')].map(e => e.id));
  const covered = new Set(panels.map(x => x.id).concat(Object.keys(INLINE)));
  const missed = everyPanel.filter(id => !covered.has(id));
  chk('every panel in the file is covered by this sweep', missed.length === 0,
    missed.length ? 'not covered: ' + missed.join(', ') : everyPanel.length + ' panels');

  for (const [id, setup] of Object.entries(INLINE)) {
    await closeAll();
    const r = await p.evaluate(({ id, setup }) => {
      try { (0, eval)(setup); } catch (e) { return { err: String(e.message).slice(0, 120) }; }
      const el = document.getElementById(id); if (!el) return { err: 'no #' + id };
      const cs = getComputedStyle(el);
      const clipped = [];
      el.querySelectorAll('input').forEach(inp => {
        if (inp.type === 'checkbox' || inp.type === 'radio' || !inp.value) return;
        if (inp.scrollWidth - inp.clientWidth > 1)
          clipped.push(`"${inp.value}" needs ${inp.scrollWidth}px in ${inp.clientWidth}px`);
      });
      return { disp: cs.display, h: el.getBoundingClientRect().height,
               text: el.innerText || '', clipped, kb: window.__kbOff(el) };
    }, { id, setup });
    const open = !r.err && r.disp !== 'none' && r.h > 10;
    chk(`${id} opens`, open, r.err || (open ? '' : `display:${r.disp} height:${r.h}`));
    if (!open) continue;
    const ent = ENTS.exec(r.text || '');
    chk(`${id} shows no escaped entity`, !ent,
      ent ? `"${(r.text.slice(Math.max(0, ent.index - 26), ent.index + 26)).replace(/\s+/g, ' ')}"` : '');
    chk(`${id} clips none of its own fields`, r.clipped.length === 0, r.clipped.slice(0, 3).join('; '));
    chk(`${id}: every control in it is one the keyboard reaches`, r.kb.length === 0, r.kb.slice(0, 3).join('; '));
  }

  for (const { id, fn } of panels) {
    await closeAll();
    const setup = SPECIAL[id] || (fn ? `${fn}();` : null);
    if (!setup) { chk(`${id} can be opened`, false, 'no opener — add it to SPECIAL'); continue; }
    const r = await p.evaluate(({ id, setup }) => {
      try { (0, eval)(setup); } catch (e) { return { err: String(e.message).slice(0, 120) }; }
      const el = document.getElementById(id); if (!el) return { err: 'no #' + id };
      const cs = getComputedStyle(el), md = el.querySelector('.modal');
      // A field narrower than the value inside it hides part of that value with no sign that
      // anything is missing. Six of the eight standard destinations read "Defense Logistics A",
      // "OC-ALC Oklahoma", "NAWCWD China La" in their own edit boxes, and the allocation field on
      // the row clipped its dollars the same way.
      const clipped = [];
      if (md) md.querySelectorAll('input').forEach(inp => {
        if (inp.type === 'checkbox' || inp.type === 'radio' || !inp.value) return;
        const over = inp.scrollWidth - inp.clientWidth;
        if (over > 1) clipped.push(`"${inp.value}" needs ${inp.scrollWidth}px in ${inp.clientWidth}px`);
      });
      return { disp: cs.display, vis: cs.visibility, h: md ? md.getBoundingClientRect().height : 0,
               text: md ? (md.innerText || '') : '', clipped, kb: window.__kbOff(md) };
    }, { id, setup });
    const open = !r.err && r.disp !== 'none' && r.vis !== 'hidden' && r.h > 10;
    chk(`${id} opens`, open, r.err || (open ? '' : `display:${r.disp} height:${r.h}`));
    if (!open) continue;
    const ent = ENTS.exec(r.text || '');
    chk(`${id} shows no escaped entity`, !ent,
      ent ? `"${(r.text.slice(Math.max(0, ent.index - 26), ent.index + 26)).replace(/\s+/g, ' ')}"` : '');
    chk(`${id} clips none of its own fields`, r.clipped.length === 0, r.clipped.slice(0, 3).join('; '));
    chk(`${id}: every control in it is one the keyboard reaches`, r.kb.length === 0, r.kb.slice(0, 3).join('; '));
  }
  await closeAll();

  for (const [k, label] of Object.entries(MENUS)) {
    await closeAll();
    // the folded mode-tools menu is there only when the window is too narrow for the tools
    const vp = p.viewportSize();
    if (k === 'modetools') { await p.setViewportSize({ width: 1000, height: vp.height }); await p.waitForTimeout(150); }
    const r = await p.evaluate(([k, prep]) => {
      try { if (prep) (0, eval)(prep); toggleMenu(k); } catch (e) { return { err: String(e.message).slice(0, 120) }; }
      const c = document.getElementById('m_' + k), dd = document.getElementById('dd_' + k);
      if (!c || !dd) return { err: 'no #m_' + k };
      const out = { open: c.classList.contains('open'), h: dd.getBoundingClientRect().height,
               text: dd.innerText || '', kb: window.__kbOff(dd) };
      if (prep) { uiMode = 'review'; uiApply(); }
      return out;
    }, [k, PREP[k] || '']);
    if (k === 'modetools') { await p.setViewportSize(vp); await p.waitForTimeout(150); }
    const open = !r.err && r.open && r.h > 10;
    chk(`the ${label} menu opens`, open, r.err || (open ? '' : `height:${r.h}`));
    if (!open) continue;
    const ent = ENTS.exec(r.text || '');
    chk(`the ${label} menu shows no escaped entity`, !ent,
      ent ? `"${(r.text.slice(Math.max(0, ent.index - 26), ent.index + 26)).replace(/\s+/g, ' ')}"` : '');
    chk(`the ${label} menu: every item in it is one the keyboard reaches`, r.kb.length === 0, r.kb.slice(0, 3).join('; '));
  }
  chk('nothing threw while opening them', pageErrs.length === 0, pageErrs.slice(0, 2).join(' | '));
  // EVERY MENU IN THE FILE IS IN THE MAP ABOVE. The PMO menu was added to the toolbar in v1.67 and
  // to neither this map nor the board's own list, so it never opened and this check never looked:
  // a check with a hand-kept list is a check that cannot fail on what the list forgot.
  const inFile = await p.evaluate(() => [...document.querySelectorAll('.menu[id^="m_"]')].map(e => e.id.slice(2)));
  const unlisted = inFile.filter(k => !(k in MENUS));
  chk('every toolbar menu in the file is covered by this sweep', unlisted.length === 0,
    unlisted.length ? 'not covered: ' + unlisted.join(', ') : inFile.length + ' menus');
  await ctx.close();
}
await b.close();
console.log(bad ? `\n${bad} panel check(s) failed\n`
                : '\nEvery panel and menu opens, nothing shows an escaped entity, no field clips its own value, and the keyboard reaches every control in them\n');
process.exit(bad ? 1 : 0);
