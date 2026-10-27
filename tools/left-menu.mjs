// EVERY ACTION HAS ONE HOME, ON THE LEFT MENU (v2.00, menu -- Brad, 19 Oct 2026: "Move every top-right menu into the left
// menu, and remove every duplicate, so each action has exactly one home").
//
// Until then the board's actions lived in five places at the top right -- the 💾 Save button, Reports & exports ▾, Data ▾,
// Setup ▾ and 📁 File ▾ -- and three left-menu flyouts (FYDP ▸, Execution ▸, History & recovery ▸) repeated some of them and
// linked to the others. This boots the board in Chromium and checks, against values written out by hand:
//
//   A. REACHED FROM THE LEFT MENU, EXACTLY ONCE. Every left-menu entry is opened the way a person opens it (its flyout, its
//      box, every folded group in it), and every control in it is read for the call it makes. Each call the old menus made
//      (the inventory, $SP/rec/L8/menu/INVENTORY.md) is there exactly as often as WANT says: once, except the three reached two
//      ways on purpose, each named. Nothing else is there, so an item added twice, or a call nothing listed, fails by name.
//      Work kept aside is set, so its three items are drawn.
//   B. CTRL+S SAVES: the same call as the pinned 💾 Save (saveInPlace), and the browser's own "save this page" is held back.
//   C. THE FIVE TOP-BAR CONTROLS ARE GONE -- Save, Reports & exports ▾, Data ▾, Setup ▾, 📁 File ▾ -- and what stays there
//      stays: Appropriation, Fiscal year, the PMO filter, search, Filter, the message line and Help.
//   D. A PMO COPY: the Save spot is ✉ Submit input (pmoSubmit), reached once; Program offices is not shown and holds
//      nothing. v2.09 (item 127): the copy's own 💾 Save (pmoSaveCopy) sits above it, reached once, and its ▾ offers the
//      copy's own Save a copy (pmoSaveCopyDl), nothing of the board's -- they were listed there, off, until v2.09.
//   F. (Brad, 19 Oct) NO REPEAT ON THE TASK BAR: Bands is on no task-bar control in any mode, nor in its folded Tools menu --
//      the left menu (A) is its one home. (Executive decision, the PowerPoint deck and the Exec synopsis were held here too, until
//      v2.05 removed them, item 114.)
//   G. (v2.05, items 114 and 115; Brad, 23 Oct 2026) NOTHING ON THE LEFT MENU SCROLLS SIDEWAYS AND NO ITEM CARRIES AN ICON: every
//      side panel and box, every folded group in it opened in turn, at 1920, 1440, 1366 and 1024 wide, in the board's font and
//      in the Segoe stand-in -- its scroll width is its width, no item reaches past its edge, and no item's title starts with an
//      icon (a tick, ● and ○ for the theme in use, and … or ▸ at the end are not icons). Four side panels scrolled 6px on v2.04,
//      every hint 22px past its button.
//   E. FOLDED TO ICONS AND FROM THE KEYBOARD ALONE: ‹ folds the menu to 64px; every entry is still there, in order, named
//      for a screen reader and reached with Tab; Enter opens a flyout with the keyboard in it, Tab reaches its items, Esc
//      closes it with the keyboard back on its entry; Enter opens a box the same way; Enter on an item runs it and its
//      box gives the keyboard back to the entry; unsaved work shows as a dot on the Save icon.
//
//   node tools/left-menu.mjs [--board FILE]
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { boot, seed } from './export-audit/boot.mjs';
import { CHROME } from './chrome.mjs';
import { withStandin } from './font-standin.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const bi = process.argv.indexOf('--board');
const FILE = resolve(bi >= 0 ? process.argv[bi + 1] : join(ROOT, 'prioritization-board-grid.html'));

let bad = 0;
const chk = (what, ok, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail && !ok ? '   ' + detail : ''}`); };
const J = JSON.stringify;

// ── THE INVENTORY, BY HAND: each call the old menus made, and how many controls on the left menu make it now ─────────────
// A file picker is named by its input (#fullFile); a call with an argument keeps it (themeSetIdx(0)).
const WANT = {
  // Save, pinned at the foot (Ctrl+S is checked on its own, in B)
  saveInPlace: 1,
  // the ▾ beside Save
  publishState: 1,
  // History & recovery
  toggleLive: 2,          // TWO ON PURPOSE: History & recovery › Earlier copies… and Setup › Live view… open the same box (the copies are kept in Live view)
  keptPutBack: 2,         // TWO ON PURPOSE: History & recovery › Put back work kept aside…, and the save state's own "↶ work kept aside" notice at the foot, as it was in the context bar
  keptSaveFile: 1, keptDiscard: 1,
  // Program offices
  publishPmoCopy: 1, subOpenReview: 1, "uiPmoLoad('one')": 1, "uiPmoLoad('all')": 1,
  // Audit
  toggleJrnl: 1, showLog: 1, takePen: 1, 'whoAmI(true)': 1,
  // Imports & exports
  '#fullFile': 1, '#stateFile': 1, '#multiFile': 1, exportOneAppn: 1, togglePkg: 1,
  // Setup
  toggleSvcPanel: 1, togglePmo: 1, toggleEnt: 1, toggleBands: 1, toggleCoa: 1, toggleRcn: 1, toggleSi: 1,
  'themeSetIdx(0)': 1, 'themeSetIdx(1)': 1, 'themeSetIdx(2)': 1, 'themeSetIdx(3)': 1, 'themeSetIdx(4)': 1,
  'uiSetDensity("compact")': 1, 'uiSetDensity("comfortable")': 1, 'uiSetDensity("presentation")': 1,
  toggleDiag: 1,
  clearComputer: 1,       // v2.04 (item 106): Setup › Clear this computer…
  // Data
  '#srcFile': 1, '#ccarFile': 1, toggleExw: 1, '#aceFile': 1, toggleAce: 1, '#budFile': 1, toggleBudReg: 1,
  // Reports & exports
  togglePf: 1, togglePlans: 1, crExport: 1, exportExcel: 1, exportCSV: 1,   // v2.05 (item 114): the deck, the synopsis and Executive Decision are gone
  fydpPickExport: 1, exportCycCompare: 1,   // v2.04 (item 112): 📊 FYDP Spend Plan (Excel) opens the plan picker first
  exportSrc: 1, toggleIds: 1, exportCoa: 1, exportAceTieout: 1,
  linkOpen: 1, linkSet: 1,
  aiExport: 1, '#aiFile': 1, aiOpen: 1,   // v2.04 (item 109): Reports & exports › AI review (GenAI.mil)
  // FYDP ▸ (views only)
  toggleFydp: 1, toggleSp: 1, toggleP2: 1, toggleFlow: 1,
  toggleFdc: 1,           // v2.10 (item 130): FYDP › FYDP Disconnects…, beside the Spruills
  // Execution ▸ (views only; ⚖ Reprogramming Actions, and the ATR/BTR log export above, went with the tracker in v2.02)
  toggleEx: 1, toggleFc: 1, toggleCr: 1, toggleQpe: 1, toggleDiv: 1,
};
// The left menu's own furniture, which runs no action of the board's: opening and closing its entries and boxes, a group's
// heading, the fold.
const FURNITURE = /^(uiGo\(|uiRailToggle\(|uiImpClose\(|uiRepClose\(|uiDataClose\(|event\.stopPropagation\(\);menuGrp\()/;
// The call a control makes, as WANT names it
const callOf = h => {
  let s = String(h || '').replace(/\s+/g, ' ').trim().replace(/^uiFlyClose\(\);\s*/, '');
  const m = /^mRun\((.*)\)$/.exec(s); if (m) s = m[1].trim();
  let x;
  if ((x = /^\(\)=>document\.getElementById\('([^']+)'\)\.click\(\)$/.exec(s))) return '#' + x[1];
  if ((x = /^function\(\)\{ ?(themeSetIdx\(\d\)|uiSetDensity\("[a-z]+"\)) ?;?\}$/.exec(s))) return x[1];
  if (/^\(\)=>\{whoAmI\(true\);render\(\);\}$/.test(s)) return 'whoAmI(true)';
  if ((x = /^([A-Za-z_$][\w$]*)\(\)$/.exec(s))) return x[1];
  return s;
};

const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const open = async (file, w = 1440, init) => {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('spmtTheme', 'harbor'); localStorage.removeItem('prio27uiRail'); } catch (e) {} });
  if (init) await ctx.addInitScript(init);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.dismiss());
  await p.goto('file://' + file);
  await p.waitForFunction(() => typeof render === 'function' && document.documentElement.classList.contains('ui-on'), null, { timeout: 40000 });
  await p.waitForTimeout(400);
  return { p, ctx, errs };
};
const shut = p => p.evaluate(() => { try { uiFlyClose(); } catch (e) {} ['uiImpPanel', 'uiRepPanel', 'uiDataPanel'].forEach(id => { const e = document.getElementById(id); if (e) e.classList.remove('open'); }); });
// every entry opened as a person opens it, and every control in it read; a folded group is opened from its heading
const harvest = async p => {
  const got = [];
  const navs = await p.evaluate(() => [...document.querySelectorAll('#uiSide button[id^="uiNav_"]')].filter(e => e.getClientRects().length).map(e => e.id));
  const read = (sel) => p.evaluate(sel => [...document.querySelectorAll(sel)].filter(e => e.getClientRects().length && !e.disabled)
    .map(e => ({ h: e.getAttribute('onclick') || '', t: (e.textContent || '').trim().slice(0, 50) })), sel);
  for (const id of navs) {
    await shut(p);
    await p.click('#' + id); await p.waitForTimeout(120);
    const where = await p.evaluate(() => { const f = document.querySelector('#uiFly.open'); if (f) return '#uiFly';
      const m = document.querySelector('#uiImpPanel.open, #uiRepPanel.open, #uiDataPanel.open'); return m ? '#' + m.id : ''; });
    if (!where) continue;   // a view: it changes what is on screen, and runs nothing of the old menus'
    const seen = new Set();
    const take = async () => { for (const c of await read(where + ' button')) { const k = c.h + '|' + c.t; if (seen.has(k)) continue; seen.add(k); got.push({ from: id, ...c }); } };
    await take();
    const gs = await p.evaluate(w => [...document.querySelectorAll(w + ' .gh')].map(h => h.getAttribute('data-g')), where);
    for (const g of gs) {
      const was = await p.evaluate(([w, g]) => document.querySelector(w + ' .gh[data-g="' + g + '"]').getAttribute('aria-expanded'), [where, g]);
      if (was !== 'true') { await p.click(`${where} .gh[data-g="${g}"]`); await p.waitForTimeout(100); }
      await take();
    }
  }
  await shut(p);
  // the foot: Save, and whatever the save state offers
  for (const c of await read('#uiSide .uiSave button:not([id^="uiNav_"])')) got.push({ from: 'foot', ...c });
  return got;
};
const tally = got => { const n = {}; got.forEach(c => { const k = callOf(c.h); if (FURNITURE.test(c.h)) return; n[k] = (n[k] || 0) + 1; }); return n; };

const dir = mkdtempSync(join(tmpdir(), 'orbit-leftmenu-'));
process.on('exit', () => { try { rmSync(dir, { recursive: true, force: true }); } catch {} });

// ── A. every call the old menus made, reached from the left menu, as often as WANT says ──────────────────────────────────
{
  const { p, ctx, errs } = await open(FILE);
  try {
    await p.evaluate(() => { _keptMeta = { t: 1790000000000, why: 'folder', by: 'K Jones' }; syncBtns(); });
    const got = await harvest(p);
    const n = tally(got);
    const keys = [...new Set([...Object.keys(WANT), ...Object.keys(n)])].sort();
    const off = keys.filter(k => (n[k] || 0) !== (WANT[k] || 0)).map(k => `${k}: ${n[k] || 0} (want ${WANT[k] || 0})`
      + (n[k] ? ' — ' + got.filter(c => callOf(c.h) === k).map(c => c.from + ' “' + c.t + '”').join(', ') : ''));
    chk(`A · each of the ${Object.keys(WANT).length} calls the old menus made is on the left menu as often as the inventory says (once; twice for the two named), and nothing else is`,
      // v2.03: 67 since v2.02 removed the ATR/BTR tracker's two calls; this read 69, failing, from v2.02 (outside verify:grid's run)
      // v2.04: 71 -- the three AI review entries (item 109) and Clear this computer (item 106)
      // v2.05: 68 -- the PowerPoint deck, the Exec synopsis and Executive decision removed (item 114)
      // v2.10: 69 -- FYDP › FYDP Disconnects… (item 130)
      off.length === 0 && Object.keys(WANT).length === 69, off.slice(0, 12).join(' | '));
    chk('A · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
  } catch (e) { chk('A · the section ran on this board', false, String(e.message || e).split('\n')[0].slice(0, 160)); }
  await ctx.close();
}

// ── B. Ctrl+S, and the pinned button: the same call ────────────────────────────────────────────────────────────────────
{
  const { p, ctx, errs } = await open(FILE);
  try {
    await p.evaluate(() => { window.__saves = []; saveInPlace = function () { window.__saves.push('saveInPlace'); };
      window.__prevented = null; window.addEventListener('keydown', e => { if (e.key === 's' || e.key === 'S') window.__prevented = e.defaultPrevented; }); });
    await p.focus('#uiNav_req'); await p.keyboard.press('Control+s'); await p.waitForTimeout(80);
    const k = await p.evaluate(() => ({ saves: window.__saves.slice(), prevented: window.__prevented }));
    chk('B · Ctrl+S runs saveInPlace once, and the browser’s own save of the page is held back', J(k) === J({ saves: ['saveInPlace'], prevented: true }), J(k));
    await p.evaluate(() => { document.getElementById('q').focus(); });
    await p.keyboard.press('Control+s'); await p.waitForTimeout(80);
    chk('B · and from inside a field', J(await p.evaluate(() => window.__saves)) === J(['saveInPlace', 'saveInPlace']), J(await p.evaluate(() => window.__saves)));
    await p.click('#saveBtn'); await p.waitForTimeout(80);
    const c = await p.evaluate(() => ({ saves: window.__saves.length, onclick: document.getElementById('saveBtn').getAttribute('onclick'), text: document.getElementById('saveBtn').textContent.trim() }));
    chk('B · the pinned 💾 Save is the same call', J(c) === J({ saves: 3, onclick: 'saveInPlace()', text: 'Save' }), J(c));
    chk('B · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
  } catch (e) { chk('B · the section ran on this board', false, String(e.message || e).split('\n')[0].slice(0, 160)); }
  await ctx.close();
}

// ── C. the five top-bar controls are gone; what stays, stays ───────────────────────────────────────────────────────────
{
  const { p, ctx, errs } = await open(FILE);
  try {
    const r = await p.evaluate(() => {
      const gone = ['m_share', 'b_share', 'dd_share', 'm_reports', 'b_reports', 'm_data', 'b_data', 'm_setup', 'b_setup'].filter(id => document.getElementById(id));
      const top = document.getElementById('topStack');
      const sb = document.getElementById('saveBtn');
      const words = [...top.querySelectorAll('button')].filter(e => e.getClientRects().length).map(e => (e.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(t => /^(💾 ?)?Save\b|File ▾|Reports|^Data|^Setup/.test(t));
      const shown = id => { const e = document.getElementById(id); return !!(e && e.getClientRects().length); };
      return { gone, saveInTop: !!(sb && top.contains(sb)), saveAtFoot: !!(sb && sb.closest('#uiSide .uiSave')), stateAtFoot: !!document.querySelector('#uiSide .uiSave #saveState'), words,
        kept: ['appnSel', 'b_fy', 'b_pmo', 'q', 'b_view', 'helpBtn'].filter(shown), status: !!document.querySelector('#topStack #shareStat') && !!document.querySelector('#topStack #statBtn') };
    });
    chk('C · Save, Reports & exports ▾, Data ▾, Setup ▾ and 📁 File ▾ are not in the page, and no button at the top says them',
      J([r.gone, r.saveInTop, r.words]) === J([[], false, []]), J(r));
    chk('C · Save and the save state are at the left menu’s foot', r.saveAtFoot && r.stateAtFoot, J(r));
    chk('C · Appropriation, Fiscal year, the PMO filter, search, Filter, Help and the message line stay', J([r.kept, r.status]) === J([['appnSel', 'b_fy', 'b_pmo', 'q', 'b_view', 'helpBtn'], true]), J(r));
    chk('C · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
  } catch (e) { chk('C · the section ran on this board', false, String(e.message || e).split('\n')[0].slice(0, 160)); }
  await ctx.close();
}

// ── D. a PMO copy: Submit input in the Save spot; Program offices hidden ───────────────────────────────────────────────
{
  let copyFile = '';
  try {
    // a copy published the way Program offices › Publish PMO copy… publishes one, from a board with synthetic requirements
    const SVCN = ['USAF', 'ANG', 'AFRC'];
    const items = Array.from({ length: 6 }, (_, i) => ({ id: 'R' + i, grp: ['PSM', 'ATL'][i % 2], team: 't', sect: '', custom: false,
      title: 'Requirement ' + i, event: 'Ev ' + i, ccar: 'CC' + i, fy26: SVCN.map(() => 0), ask: SVCN.map((_, j) => (i + 1) * (j + 1) * 100000), alloc: null }));
    const { ev } = boot({ html: readFileSync(FILE, 'utf8') });
    seed(ev, { services: SVCN, items, disc: [5000000, 1000000, 500000], mand: [1000000, 300000, 200000], order: items.map(x => x.id) });
    ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`);
    const html = ev(`(function(){ let cap=null; const _B=window.Blob;
      window.Blob=function(pt,o){ if(!cap && o && o.type==='text/html') cap=String(pt[0]); return new _B(pt,o); };
      window.confirm=function(){ return true; }; try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
      try{ publishPmoCopy(); }catch(e){} window.Blob=_B; return cap||''; })()`);
    copyFile = join(dir, 'copy.html'); writeFileSync(copyFile, html);
    chk('D · a PMO copy was published from a board with synthetic requirements', /"sandbox"|pubMode/.test(html) && html.length > 100000, 'length ' + html.length);
  } catch (e) { chk('D · a PMO copy could be published', false, String(e.message || e).split('\n')[0].slice(0, 160)); }
  if (copyFile) {
    const { p, ctx, errs } = await open(copyFile);
    try {
      const r = await p.evaluate(() => {
        const sb = document.getElementById('saveBtn'), po = document.getElementById('uiNav_pmo');
        return { sandbox: !!SANDBOX, foot: !!(sb && sb.closest('#uiSide .uiSave')), text: sb && sb.textContent.trim(), onclick: sb && sb.getAttribute('onclick'),
          pmoShown: !!(po && po.getClientRects().length), offices: (document.getElementById('dd_offices') || {}).innerHTML };
      });
      chk('D · the copy opens as a PMO copy, and the Save spot at the foot is ✉ Submit input, pmoSubmit()',
        J(r.sandbox) === 'true' && r.foot && r.text === '✉ Submit input' && r.onclick === 'pmoSubmit()', J(r));
      chk('D · Program offices is not shown, and holds nothing', r.pmoShown === false && r.offices === '', J(r));
      const n = tally(await harvest(p));
      chk('D · ✉ Submit input is reached from the left menu once; Publish PMO copy, Review submittals and the submittal loading not at all',
        J([n.pmoSubmit || 0, n.publishPmoCopy || 0, n.subOpenReview || 0, n["uiPmoLoad('one')"] || 0, n["uiPmoLoad('all')"] || 0]) === J([1, 0, 0, 0, 0]), J(n));
      // v2.09 (item 127): the copy's own Save, once, and its own Save a copy, once; the board's Save and Save a copy not at all
      chk('D · the copy’s 💾 Save and its Save a copy are each reached once, the board’s Save and Save a copy not at all',
        J([n.pmoSaveCopy || 0, n.pmoSaveCopyDl || 0, n.saveInPlace || 0, n.publishState || 0]) === J([1, 1, 0, 0]), J(n));
      // v2.10 (item 130): FYDP Disconnects sets three appropriations side by side; a copy holds one, and does not offer it
      chk('D · FYDP › FYDP Disconnects… is not offered in a copy', (n.toggleFdc || 0) === 0, J(n));
      await p.click('#uiNav_save'); await p.waitForTimeout(120);
      const off = await p.evaluate(() => [...document.querySelectorAll('#uiFly.open button.mi')].map(e => [e.getAttribute('onclick'), (e.querySelector('.sub') || {}).textContent]));
      // v2.09 (item 127): it listed the board's Save and Save a copy, off ("turned off in a PMO copy"); the copy saves now
      chk('D · under ▾, the copy’s own Save a copy, which downloads the office’s file',
        J(off) === J([['mRun(pmoSaveCopyDl)', 'downloads your office’s file, to hand on or keep']]), J(off));
      chk('D · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
    } catch (e) { chk('D · the section ran on the copy', false, String(e.message || e).split('\n')[0].slice(0, 160)); }
    await ctx.close();
  }
}

// ── E. folded to icons, and from the keyboard alone ────────────────────────────────────────────────────────────────────
{
  const { p, ctx, errs } = await open(FILE);
  try {
    await p.focus('#uiCollapse'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    const r = await p.evaluate(() => {
      const s = document.getElementById('uiSide').getBoundingClientRect();
      const navs = [...document.querySelectorAll('#uiSide button[id^="uiNav_"]')].filter(e => e.getClientRects().length);
      return { rail: document.documentElement.classList.contains('ui-rail'), width: Math.round(s.width),
        order: navs.map(e => e.id.slice(6)),
        inside: navs.every(e => { const r = e.getBoundingClientRect(); return r.left >= s.left - 0.5 && r.right <= s.right + 0.5 && r.width >= 24 && r.height >= 24; }),
        labelsHidden: [...document.querySelectorAll('#uiSide .uiNi .t')].every(t => !t.getClientRects().length),
        named: navs.every(e => !!(e.getAttribute('data-tip') || e.getAttribute('aria-label'))) };
    });
    chk('E · ‹ from the keyboard folds the menu to 64px of icons, every entry still there in order, 24px or more, and named',
      J(r) === J({ rail: true, width: 64, order: ['req', 'fund', 'fydp', 'exec', 'cyc', 'brief', 'rep', 'imp', 'data', 'pmo', 'aud', 'hist', 'setup', 'save'], inside: true, labelsHidden: true, named: true }), J(r));
    // Tab walks the entries in order, then Save and its ▾
    await p.focus('#uiNav_req');
    const walk = ['uiNav_req'];
    for (let i = 0; i < 15; i++) { await p.keyboard.press('Tab'); walk.push(await p.evaluate(() => document.activeElement && document.activeElement.id)); }
    chk('E · Tab reaches every entry, then 💾 Save and its ▾, in that order', J(walk) === J(['uiNav_req', 'uiNav_fund', 'uiNav_fydp', 'uiNav_exec', 'uiNav_cyc', 'uiNav_brief', 'uiNav_rep',
      'uiNav_imp', 'uiNav_data', 'uiNav_pmo', 'uiNav_aud', 'uiNav_hist', 'uiNav_setup', 'saveBtn', 'uiNav_save', walk[15]]) && walk[15] !== 'uiNav_save', J(walk));
    // a flyout: Enter opens it with the keyboard inside, Tab reaches its items, Esc closes it back onto its entry. An item is named
    // by its own words, without the line under them.
    await p.evaluate(() => { window.own = e => [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim(); });
    await p.focus('#uiNav_aud'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    const f1 = await p.evaluate(() => ({ open: document.getElementById('uiFly').classList.contains('open'), exp: document.getElementById('uiNav_aud').getAttribute('aria-expanded'),
      inFly: document.getElementById('uiFly').contains(document.activeElement), first: own(document.activeElement),
      left: Math.round(document.getElementById('uiFly').getBoundingClientRect().left) }));
    const items = [];
    for (let i = 0; i < 3; i++) { await p.keyboard.press('Tab'); items.push(await p.evaluate(() => document.getElementById('uiFly').contains(document.activeElement) ? own(document.activeElement) : 'outside')); }
    await p.keyboard.press('Escape'); await p.waitForTimeout(120);
    const f2 = await p.evaluate(() => ({ open: document.getElementById('uiFly').classList.contains('open'), focus: document.activeElement && document.activeElement.id, exp: document.getElementById('uiNav_aud').getAttribute('aria-expanded') }));
    chk('E · Audit: Enter opens its flyout beside the icons with the keyboard on its first item; Tab reaches the rest; Esc closes it back onto Audit',
      J([f1, items, f2]) === J([{ open: true, exp: 'true', inFly: true, first: 'Change journal…', left: 70 }, ['Save history', 'Take the pen…', 'My editor name…']   /* v2.05 (item 114): no icons */, { open: false, focus: 'uiNav_aud', exp: 'false' }]), J([f1, items, f2]));
    // Enter on an item runs it: the flyout closes, its box opens with the keyboard in it, and Esc gives the keyboard back to Audit
    await p.focus('#uiNav_aud'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    await p.keyboard.press('Enter'); await p.waitForTimeout(400);
    const g1 = await p.evaluate(() => ({ fly: document.getElementById('uiFly').classList.contains('open'), jrnl: !!jrnlOpen,
      inBox: !!(document.activeElement && document.activeElement.closest && document.activeElement.closest('.modal-bg')) }));
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    const g2 = await p.evaluate(() => ({ jrnl: !!jrnlOpen, focus: document.activeElement && document.activeElement.id }));
    chk('E · Enter on Change journal… closes the flyout and opens the journal with the keyboard in it; Esc gives the keyboard back to Audit',
      J([g1, g2]) === J([{ fly: false, jrnl: true, inBox: true }, { jrnl: false, focus: 'uiNav_aud' }]), J([g1, g2]));
    // a box: Enter opens Reports & exports with the keyboard in Find; Esc closes it back onto its entry
    await p.focus('#uiNav_rep'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    const h1 = await p.evaluate(() => ({ open: document.getElementById('uiRepPanel').classList.contains('open'), focus: document.activeElement && document.activeElement.id }));
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    const h2 = await p.evaluate(() => ({ open: document.getElementById('uiRepPanel').classList.contains('open'), focus: document.activeElement && document.activeElement.id }));
    chk('E · Reports & exports: Enter opens the box with the keyboard in Find; Esc closes it back onto its entry',
      J([h1, h2]) === J([{ open: true, focus: 'mFind' }, { open: false, focus: 'uiNav_rep' }]), J([h1, h2]));
    // unsaved work: a dot on the Save icon
    const d = await p.evaluate(() => { const sb = document.getElementById('saveBtn');
      const dot = () => { const c = getComputedStyle(sb, '::after'); return c.content !== 'none' && c.content !== 'normal' && parseFloat(c.width) > 0; };
      DIRTY = false; syncBtns(); const clean = dot(); DIRTY = true; syncBtns(); const dirty = dot(); DIRTY = false; syncBtns();
      const r = sb.getBoundingClientRect(); return { clean, dirty, icon: r.width <= 48 && r.width >= 24 && r.height >= 24, text: !document.getElementById('saveBtn_t').getClientRects().length }; });
    chk('E · folded, 💾 Save is an icon, and unsaved work shows as a dot on it', J(d) === J({ clean: false, dirty: true, icon: true, text: true }), J(d));
    chk('E · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
  } catch (e) { chk('E · the section ran on this board', false, String(e.message || e).split('\n')[0].slice(0, 160)); }
  await ctx.close();
}

// ── F. the task bar repeats no left-menu item, in any mode, nor in its folded Tools menu ────────────────────────────────
{
  const { p, ctx, errs } = await open(FILE);
  try {
    const got = await p.evaluate(() => { const out = {};
      ['review', 'rank', 'fund', 'compare', 'brief'].forEach(m => { uiMode = m; uiApply(); syncBtns(); render();
        out[m] = [...document.querySelectorAll('.tbar [onclick]')].map(e => e.getAttribute('onclick')); });
      uiMode = 'review'; uiApply(); render(); return out; });
    const REPEATS = ['toggleBands'];
    const hits = []; Object.entries(got).forEach(([m, hs]) => hs.forEach(h => { const k = callOf(h); if (REPEATS.includes(k)) hits.push(m + ': ' + h); }));
    chk('F · Bands is on no task-bar control in any mode, nor in its folded Tools menu',
      J(hits) === J([]) && Object.keys(got).length === 5 && got.brief.some(h => callOf(h) === 'briefFull'), J(hits));
    chk('F · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
  } catch (e) { chk('F · the section ran on this board', false, String(e.message || e).split('\n')[0].slice(0, 160)); }
  await ctx.close();
}

// ── G. nothing on the left menu scrolls sideways, and no item carries an icon (v2.05, items 114 and 115) ─────────────────────
{
  const copy = join(dir, 'standin.html');
  writeFileSync(copy, withStandin(readFileSync(FILE, 'utf8')));
  const wide = [], icons = new Set(); let seen = 0;
  for (const [file, font] of [[FILE, 'board font'], [copy, 'Segoe stand-in']]) for (const w of [1920, 1440, 1366, 1024]) {
    const { p, ctx, errs } = await open(file, w);
    try {
      const measure = (where, tag) => p.evaluate(([where, tag]) => {
        const box = where === '#uiFly' ? document.querySelector('#uiFly') : document.querySelector(where + ' .modal');
        const out = { wide: [], icons: [], n: 0 }; if (!box) return out;
        if (box.scrollWidth > box.clientWidth) out.wide.push(tag + ': scrolls sideways, ' + box.scrollWidth + ' inside ' + box.clientWidth);
        const r0 = box.getBoundingClientRect(), right = r0.left + box.clientLeft + box.clientWidth;
        const ICON = /^(?:(?![●○$])[^\p{L}\p{N}\s"'“(])+\s/u;
        box.querySelectorAll('button').forEach(e => {
          if (!e.getClientRects().length) return; out.n++;
          e.querySelectorAll('*').forEach(c => { const r = c.getBoundingClientRect(); if (r.width && r.right > right + 0.5)
            out.wide.push(tag + ': “' + (e.textContent || '').trim().slice(0, 30) + '” reaches ' + Math.round(r.right - right) + 'px past the edge'); });
          if (e.classList.contains('gh') || e.classList.contains('x')) return;
          const b = e.querySelector(':scope > b');
          const t = b ? b.textContent : [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('');
          if (ICON.test(t.trim() + ' ')) out.icons.push(t.trim().slice(0, 30));
        });
        return out; }, [where, tag]);
      const navs = await p.evaluate(() => [...document.querySelectorAll('#uiSide button[id^="uiNav_"]')].filter(e => e.getClientRects().length).map(e => e.id));
      for (const id of navs) {
        await shut(p); await p.click('#' + id); await p.waitForTimeout(120);
        const where = await p.evaluate(() => { const f = document.querySelector('#uiFly.open'); if (f) return '#uiFly';
          const m = document.querySelector('#uiImpPanel.open, #uiRepPanel.open, #uiDataPanel.open'); return m ? '#' + m.id : ''; });
        if (!where) continue;
        const tag = font + ' ' + w + ' ' + id.replace('uiNav_', '');
        const take = r => { seen += r.n; wide.push(...r.wide); r.icons.forEach(i => icons.add(id.replace('uiNav_', '') + ': ' + i)); };
        take(await measure(where, tag));
        const gs = await p.evaluate(w => [...document.querySelectorAll(w + ' .gh')].map(h => h.getAttribute('data-g')), where);
        for (const g of gs) {
          const was = await p.evaluate(([w, g]) => document.querySelector(w + ' .gh[data-g="' + g + '"]').getAttribute('aria-expanded'), [where, g]);
          if (was !== 'true') { await p.click(`${where} .gh[data-g="${g}"]`); await p.waitForTimeout(100); }
          take(await measure(where, tag + ' › ' + g));
        }
      }
      await shut(p);
      if (errs.length) wide.push(tag0(font, w) + ': page error ' + errs[0]);
    } catch (e) { wide.push(font + ' ' + w + ': the section did not run: ' + String(e.message || e).split('\n')[0].slice(0, 120)); }
    await ctx.close();
  }
  chk('G · the side panels and boxes were opened and their items read', seen > 400, 'only ' + seen + ' items read');
  chk('G · nothing on the left menu scrolls sideways, and no item reaches past its edge, at 1920, 1440, 1366 and 1024 in both fonts',
    wide.length === 0, J([...new Set(wide)].slice(0, 6)) + (wide.length > 6 ? ' … ' + wide.length + ' in all' : ''));
  chk('G · no item on the left menu starts with an icon', icons.size === 0, J([...icons].slice(0, 8)) + (icons.size > 8 ? ' … ' + icons.size + ' in all' : ''));
}
function tag0(f, w) { return f + ' ' + w; }

await b.close();
console.log(bad ? `\n${bad} left-menu check(s) failed\n` : '\nEvery action has one home on the left menu, it works folded and from the keyboard, and the top bar keeps only what it should\n');
process.exit(bad ? 1 : 0);
