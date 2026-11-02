// THE LAYOUT HOLDS ITS PROMISES (v1.90, item 27).
//
// The redesign put the requirements on the screen and the money in a strip at the top. Each promise it
// made is checked here in a real browser, on a populated board, because none of them can be seen by
// the audits -- jsdom has no layout:
//
//   A. The funding posture prints EXACTLY the scorecards' figures, and its unfunded-by-service figures
//      are the Funding by service table's and add up to the scorecard's TOTAL. Money: a can't-fail.
//   B. Every item of the v1.89 menus (Active year, Budget year, FYDP, Tools, Export) is still reachable,
//      by the same call, in the new menus or on a mode's tools. Nothing was lost in the regrouping.
//   C. No row control is clipped or pushed off the grid, at any width from 1024 to 1920, in any mode that
//      edits. (v1.89 clipped the ⋯ menu on every row between about 1401 and 1745px.)
//   D. The first requirement is on the screen when the board opens.
//   E. Brief carries no editing control, and no RECORD panel.
//   F. Fund's Discretionary, Mandatory and Unfunded columns print what the RECORD panel prints.
//   G. Changing mode, density or Funding detail changes no data.
//   H. The selected row and the keyboard-focused row look different, and the focus ring is the keyboard's.
//   I. (v1.91, item 28) Every "lane short" figure in the RECORD panel's By service table is read WHOLE:
//      the note fits its cell for every requirement, at every width and density -- a nine-digit figure
//      included. It used to lose its last digits in the 78px UFR column on 115 of 121 notes.
//   J. (v1.91, item 31) Between 761 and 1023px -- a tablet, a window beside another -- at EVERY width, in
//      every mode, in Harbor and Parchment: the page never scrolls sideways, every cell and control of every
//      row sits inside its row, no money figure is cut inside its cell, and nothing in the top bars runs
//      past the window. The drawer's three editors are on screen at 900 and 768, and a phone (390) opens.
//      v1.90 pushed Fund's allocation box off the row at 761-884px and Rank's star at 761-804, cut Brief's
//      last money column, and scrolled sideways at 761-808; nothing looked below 1024.
//
//   K. (v2.01, Brad 20 Oct: "no unreadable areas in the record panel") Nothing in the RECORD panel is cut or hidden, for any
//      requirement, at 1920, 1440, 1366, 1280 and 1024 in every density, sliding over and docked: the panel never scrolls sideways; no text
//      is clipped, ends in an ellipsis or spills out of its cell; nothing sits past the panel's edge; no field cuts its value; no picker cuts the name it
//      shows. On a board with a BAE list and a requirement short by ten-digit figures in every service. It used to print the UFR
//      total as "$655,479,0..." and cut the budget pickers' names.
//
//   M. (v2.07, item 121) The Add box fits whole -- nothing scrolls, nothing is cut, nothing runs off the window -- at 1366 x 657 and
//      1920 x 969, with six services, a budget picker on each, the OGC fields and what is still needed showing, on both tabs and
//      with one brought in being finished, in Harbor and Midnight and in the Segoe stand-in; below 1366 it is one column that
//      scrolls.
//   R. (v2.12, item 134) Fit to the PPBE position and the UPL line under the last row are read whole, with an over and a
//      nine-figure UPL, from 1920 to 800, in Harbor and Midnight and in the Segoe stand-in.
//
//   Q. (v2.12, item 132) A WBS paragraph picked in the Add box, the edit box and the WBS panel: the field reads the estimate's
//      list, the pick leaves the code in the field, and its name -- the paragraph's path, ~160 characters -- is under it whole,
//      each box still whole, at 1366 x 657 and 1920 x 969, Harbor and Midnight, this font and the Segoe stand-in.
//
//   v2.00 (UI S4, fix round): C, D, E, F AND I TWICE -- the RECORD panel sliding over the table (the board's default now)
//   and docked beside it (View › Record panel › Docked beside the table, prio27uiDock = '1' in this browser). Docked above
//   1400px is the layout these checks were written against (v1.89 clipped the row menus there), and beside the sidebar it
//   is the narrowest grid the board has (248-982px at 1440). Each pass also checks where the panel is, so a docked pass
//   that ran with the panel sliding over says so and fails. A, B and G read figures, calls and data, not where anything is
//   drawn; H reads two rows' styles; J's widths (761-1023) have the panel as a drawer, docked or not: each runs once.
//
//   P. (v2.12, item 132) The cost estimate import's report and its mapping box fit: at 1920, 1440, 1366, 1024 and 800, Harbor and
//      Midnight, this font and the Segoe stand-in, neither box nor the page scrolls sideways, nothing runs past the box's edge, no
//      cell cuts its text, and no picker cuts the name it shows -- the report with every reason, 38 named rows, long names and
//      dollars in the billions; the mapping box with a 2026 file's whole header in each picker.
//
//   node tools/layout-fits.mjs [--board FILE]
import { chromium } from 'playwright-core';
import { boot, seed } from './export-audit/boot.mjs';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { CHROME } from './chrome.mjs';
import { withStandin, standinProblem } from './font-standin.mjs';
import { ACE_REP_SEED, ACE_COL_ASK } from './ace-seed.mjs';   // v2.12 (item 132): P

const ROOT = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const FILE = resolve(opt('--board') || join(ROOT, 'prioritization-board-grid.html'));

// A populated board: six services, seven offices, every band, must-pays funded and not, split, mandatory
// and unfunded requirements, a trimmed allocation (so the two unfunded readings differ), a figure typed
// higher than it draws, and a band that needs an impact statement nobody wrote.
const SVCN = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'];
const PMOS = ['PSM', 'AV', 'ATL', 'MxS', 'CDS', 'TSS', 'PP'];
const items = Array.from({ length: 18 }, (_, i) => ({
  id: 'R' + String(i + 1).padStart(3, '0'), grp: PMOS[i % 7], team: PMOS[i % 7], sect: '', custom: false,
  title: 'Requirement ' + (i + 1), event: 'Requirement ' + (i + 1), ccar: '', fy26: SVCN.map(() => 0),
  ask: SVCN.map((_, j) => Math.round([2400, 380, 210, 1150, 420, 640][j] * 1000 * (1 + ((i * 7 + j) % 5) / 4))),
  alloc: null }));
// v1.91: a requirement nothing can pay, last in the order, so one service is short by a nine-digit figure
// ($123,456,789) -- the widest "lane short" the By service table has to print whole (check I).
items.push({ id: 'R019', grp: 'PSM', team: 'PSM', sect: '', custom: false, title: 'Requirement 19', event: 'Requirement 19',
  ccar: '', fy26: SVCN.map(() => 0), ask: [123456789, 0, 0, 0, 0, 0], alloc: null });
const sc = { services: SVCN, items, disc: [9200000, 1450000, 860000, 4150000, 1760000, 2500000],
  mand: [1700000, 270000, 160000, 760000, 320000, 460000], order: items.map(x => x.id),
  mc: { R001: true, R002: true, R005: true, R010: true, R015: true } };

let bad = 0;
const chk = (what, ok, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? '   ' + detail : ''}`); };

const dir = mkdtempSync(join(tmpdir(), 'spmt-layout-'));
process.on('exit', () => { try { rmSync(dir, { recursive: true, force: true }); } catch {} });
const { ev } = boot({ html: readFileSync(FILE, 'utf8') });
seed(ev, sc);
ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
  var B=['safety','pdm','netavail','ktlo','pdm','liab','liab','netavail','netavail','safety','netavail','ktlo','netavail','netavail','safety','netavail','netavail','netavail'];
  S.order.forEach(function(id,i){ S.band[id]=B[i]; if(i!==17){ S.ccar[id]='JSF'+(7100+i*7); S.pid[id]='PID'+(4200+i*3); } });
  S.cons.R001='Line stops in March.'; S.cons.R010='Tails grounded.'; S.cons.R015='Stays with the OEM.';
  S.fsrc.R006={m:'mand'}; S.fsrc.R012={m:'mand'};
  applyState(S);
  seedSplit('R005'); seedSplit('R009');
  S.fsrc.R013={m:'split', dv:SVC.map(function(){ return 400000; }), mv:SVC.map(function(){ return 0; })};
  S.alloc.R003={m:'t', v:Math.round(askTot(itemById('R003'))*0.6)};
  applyState(S); save(); 'ok'`);
const file = join(dir, 'board.html');
writeFileSync(file, ev('buildSavedHtml()'));
// K's board (v2.01): the same, with a BAE list whose names run long, a choice made, and a requirement no lane can reach that
// is short by ten-digit figures in every service -- the widest money and the longest names the RECORD panel has to print
ev(`DATA.items.push({id:'R020', grp:'PSM', team:'PSM', sect:'', custom:false, title:'Requirement 20 with a long title that runs on past one line',
    event:'Requirement 20', ccar:'', fy26:SVC.map(function(){ return 0; }), ask:[9876543210, 1234567890, 2345678901, 3456789012, 4567890123, 5678901234], alloc:null});
  BASE_ITEMS.push(DATA.items[DATA.items.length-1]); BASE_ASK.R020=DATA.items[DATA.items.length-1].ask.slice(); S.order.push('R020'); S.band.R020='safety';
  S.ccar.R020='JSF9999'; S.pid.R020='PID-'+'7'.repeat(31);
  BUDDB={ts:1700000000041, files:[], rows:['USAF O&M- CAM Discretionary PSM', 'USAF O&M - CAM OBBBA Mandatory PSM', 'USAF O&M- CAM CONG PSM',
    'USAF O&M - ANG CAM Discretionary PSM', 'USAF O&M - ANG CAM OBBBA Mandatory PSM', 'USMC STOVL O&M -1A9A FL Discretionary PSM',
    'USN O&M CV Discretionary PSM'].map(budParseName).filter(Boolean)}; _budRegCache=null;
  if(!S.budgetAsg) S.budgetAsg={}; S.budgetAsg.R020={'USAF|disc':'USAF O&M- CAM CONG PSM'}; S.budgetAsg.R001={'USAF|disc':'USAF O&M- CAM CONG PSM'};
  applyState(S); save(); 'ok'`);
const fileK = join(dir, 'board-k.html');
writeFileSync(fileK, ev('buildSavedHtml()'));

const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
// v2.00 (UI S4, fix round): docked -- the RECORD panel docked beside the table, set as View › Record panel › Docked beside
// the table sets it (prio27uiDock = '1' in this browser). Without it the panel slides over the table, the board's default.
const PASSES = [['sliding over', false], ['docked', true]];
const open = async (w, h, mode, density, docked = false, at = file, theme = 'harbor') => {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(([m, d, t]) => { try { localStorage.setItem('spmtTheme', t);
    if (m) localStorage.setItem('spmtMode', m); if (d) localStorage.setItem('spmtDensity', d); } catch (e) {} }, [mode || '', density || '', theme]);
  if (docked) await ctx.addInitScript(() => { try { localStorage.setItem('prio27uiDock', '1'); } catch (e) {} });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + at);
  await p.waitForFunction(() => typeof render === 'function' && document.querySelectorAll('#list .row').length > 0, null, { timeout: 40000 });
  await p.waitForTimeout(250);
  return { p, ctx, errs };
};
// v2.00 (UI S4, fix round): where the RECORD panel is -- docked beside the grid (in the page, to the grid's right) or a
// drawer (fixed, over the table) -- and whether the docked setting is on. `placed` judges it against what the pass asks.
const where = () => { const i = document.getElementById('inspector'), cs = getComputedStyle(i), r = i.getBoundingClientRect(),
  g = document.querySelector('.gridwrap').getBoundingClientRect();
  return { fixed: cs.position === 'fixed', shown: cs.display !== 'none' && r.width > 0, beside: r.left >= g.right - 1,
    dock: document.documentElement.classList.contains('ui-dock'), grid: [Math.round(g.left), Math.round(g.right)] }; };
// docked: beside the grid above 1400px, a drawer at 1400 and narrower (the board's own breakpoint); sliding over: a drawer
const placed = (r, w, docked) => {
  if (r.dock !== docked) return docked ? 'the docked setting did not take' : 'the panel is docked without the setting';
  const want = docked && w > 1400 ? 'docked beside the grid' : 'a drawer';
  const got = !r.fixed && r.shown && r.beside ? 'docked beside the grid' : (r.fixed ? 'a drawer' : 'neither docked beside the grid nor a drawer');
  return got === want ? '' : `the RECORD panel is ${got}, not ${want}`;
};

console.log('\n' + FILE.split('/').pop());

// ── A. THE POSTURE PRINTS THE SCORECARDS' FIGURES ────────────────────────────────────────────────────
{
  const { p, ctx, errs } = await open(1440, 1000);
  for (const [label, setup] of [['as it opens', ''], ['with the discretionary-only what-if', "setScen('disc');"],
                                ['with a must-pay trimmed to nothing', "S.alloc.R010={m:'t',v:0}; render();"]]) {
    const r = await p.evaluate(setup => {
      if (setup) (0, eval)(setup);
      const n = t => Number(String(t || '').replace(/[^0-9.-]/g, '')) || 0;
      const card = c => (document.querySelector('#scores .sc.' + c) || {}).textContent || '';
      const grab = (s, re) => { const m = s.replace(/\s+/g, ' ').match(re); return m ? n(m[1]) : null; };
      const D = card('disc'), M = card('mand'), C = card('mc'), W = card('whole');
      const pv = sel => [...document.querySelectorAll('#posture ' + sel)].map(e => n(e.getAttribute('data-v')));
      const lanes = pv('.pplanes [data-v]');
      const svc = pv('.ppsvc [data-v]');
      // the Funding by service table's UNFUNDED column, service by service
      const gs = [...document.querySelectorAll('#gsBody table tr')].map(tr => [...tr.children].map(td => td.textContent.trim()))
        .filter(r => r.length > 3 && SVC.indexOf(r[0]) >= 0).map(r => ({ s: r[0], u: n(r[r.length - 1]) }));
      return {
        dBA: [lanes[0], grab(D, /BA: \$([\d,]+)/)], dLeft: [lanes[1], grab(D, /\$([\d,]+) left/)],
        mBA: [lanes[2], grab(M, /BA: \$([\d,]+)/)], mLeft: [lanes[3], grab(M, /\$([\d,]+) left/)],
        mcUnf: [pv('.pp.mc .v')[0], grab(C, /⚠ \$([\d,]+) of the must-pay/) || 0],
        total: [pv('.pp:nth-child(3) .v')[0], grab(W, /TOTAL \$([\d,]+)/)],
        svcSum: svc.reduce((a, b) => a + b, 0), svc, gs,
      };
    }, setup);
    const eq = ([a, b2]) => a !== null && b2 !== null && Math.abs(a - b2) < 0.5;
    chk(`A · ${label}: discretionary BA and left are the card's`, eq(r.dBA) && eq(r.dLeft), `${r.dBA} · ${r.dLeft}`);
    chk(`A · ${label}: mandatory BA and left are the card's`, eq(r.mBA) && eq(r.mLeft), `${r.mBA} · ${r.mLeft}`);
    chk(`A · ${label}: mission critical unfunded is the card's`, eq(r.mcUnf), String(r.mcUnf));
    chk(`A · ${label}: whole-budget unfunded is the card's TOTAL`, eq(r.total), String(r.total));
    chk(`A · ${label}: unfunded by service adds up to that TOTAL`, Math.abs(r.svcSum - r.total[1]) < 1, `${r.svcSum} vs ${r.total[1]}`);
    chk(`A · ${label}: and each service is the Funding by service table's UNFUNDED`,
      r.gs.length === r.svc.length && r.gs.every((g, i) => Math.abs(g.u - r.svc[i]) < 1), JSON.stringify(r.gs.map(g => g.u)) + ' vs ' + JSON.stringify(r.svc));
  }
  chk('A · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
  await ctx.close();
}

// ── B. EVERY v1.89 MENU ITEM IS STILL REACHABLE, BY THE SAME CALL ─────────────────────────────────────
{
  // The calls the Active year, Budget year, FYDP, Tools and Export menus made in v1.89, as they read -- less toggleRp and
  // exportReprog, removed with the ATR/BTR tracker in v2.02 (Brad, 21 Oct 2026), and toggleEd, exportPPT and execSynopsis, removed
  // with Executive Decision, the PowerPoint deck and the Executive Synopsis in v2.05 (item 114; Brad, 23 Oct 2026).
  const OLD = {
    'Active year': ['toggleEx', "getElementById('srcFile').click()", 'toggleQpe', 'toggleDiv'],
    'Budget year': ['toggleFc', 'toggleCr', 'toggleAdd', 'toggleBm', 'convertAllToSplit', 'togglePlans', "setScen('disc')",
                    "setScen('')", 'toggleCycChg', 'toggleBl', 'togglePos', 'toggleBands', 'togglePreviewOrder', 'resetOrder'],
    'FYDP': ['toggleSp', 'toggleFydp', 'toggleCycCmp', 'toggleP2', 'toggleAce', "getElementById('aceFile').click()"],
    'Tools': ['toggleSvcPanel', 'togglePmo', 'toggleCoa', 'toggleEnt', 'toggleRcn', 'toggleSi', 'toggleRlg', 'toggleExw', 'toggleMat',
              'toggleFlow', 'themeSetIdx(0)', 'themeSetIdx(1)', 'themeSetIdx(2)', 'themeSetIdx(3)', 'themeSetIdx(4)',
              "getElementById('budFile').click()", 'toggleBudReg', "getElementById('ccarFile').click()"],
    // v2.04 (item 112): the five-year workbook is reached through its plan picker (fydpPickExport), which exports it
    'Export': ['togglePf', 'exportExcel', 'exportAceTieout', 'fydpPickExport', 'exportCycCompare', 'exportCoa', 'exportCSV',
               'exportSrc', 'crExport', 'toggleIds', 'linkOpen', 'linkSet'],
  };
  const { p, ctx } = await open(1440, 1000);
  const calls = await p.evaluate(() => {
    try { syncBtns(); } catch (e) {}
    const out = [];
    // v2.00 (menu, 19 Oct): the left menu is a home too -- its boxes' and flyouts' lists, and the flyouts FYDP ▸, Execution ▸
    // and History & recovery ▸ draw for themselves (uiFlyItems)
    ['dd_reports', 'dd_data', 'dd_setup', 'dd_boards', 'dd_offices', 'dd_audit', 'dd_kept', 'dd_save', 'dd_basis', 'dd_fy',
     't_review', 't_rank', 't_fund', 't_compare', 't_brief'].forEach(id => {
      const el = document.getElementById(id); if (!el) return;
      el.querySelectorAll('[onclick]').forEach(e => out.push(e.getAttribute('onclick')));
    });
    if (typeof uiFlyItems === 'function') ['fydp', 'exec', 'hist'].forEach(k => { const d = document.createElement('div'); d.innerHTML = uiFlyItems(k);
      d.querySelectorAll('[onclick]').forEach(e => out.push(e.getAttribute('onclick'))); });
    return out.join('\n');
  });
  for (const [menu, list] of Object.entries(OLD)) {
    const missing = list.filter(c => calls.indexOf(c) < 0);
    chk(`B · everything ${menu} held is still on a menu, the left menu or a mode's tools`, missing.length === 0, missing.length ? 'missing: ' + missing.join(', ') : list.length + ' items');
  }
  await ctx.close();
}

// ── C. NO ROW CONTROL IS CLIPPED, AT ANY WIDTH ────────────────────────────────────────────────────────
// v2.00 (UI S4, fix round): twice, the RECORD panel sliding over and docked; each width also says where the panel was
for (const [pass, docked] of PASSES)
for (const mode of ['review', 'rank', 'fund']) {
  const fails = [], misplaced = []; let narrow = null;
  for (const w of [1920, 1745, 1680, 1600, 1536, 1440, 1401, 1366, 1280, 1152, 1024]) {
    const { p, ctx } = await open(w, 900, mode, undefined, docked);
    const r = await p.evaluate(() => {
      const gw = document.querySelector('.gridwrap').getBoundingClientRect();
      const out = [];
      document.querySelectorAll('#list .row').forEach(row => row.querySelectorAll('button, input, select').forEach(c => {
        if (c.closest('.mdd')) return;
        const b = c.getBoundingClientRect(); if (!b.width) return;
        if (b.right > gw.right + 1 || b.left < gw.left - 1) out.push(row.id + ' ' + (c.className || c.tagName));
      }));
      return { out, docW: document.documentElement.scrollWidth, winW: innerWidth };
    });
    if (r.out.length || r.docW > r.winW) fails.push(`${w}px: ${r.out.length} clipped${r.out.length ? ' (' + r.out[0] + ')' : ''}${r.docW > r.winW ? ', page ' + r.docW + 'px wide' : ''}`);
    const at = await p.evaluate(where), why = placed(at, w, docked);
    if (why) misplaced.push(`${w}px: ${why}`);
    if (w > 1400 && (!narrow || at.grid[1] - at.grid[0] < narrow[1])) narrow = [w, at.grid[1] - at.grid[0], at.grid.join('-')];
    await ctx.close();
  }
  chk(`C · ${mode}: every row control inside the grid at 1024-1920px (${pass})`, fails.length === 0,
    fails.length ? fails.slice(0, 3).join('; ') : (narrow ? `the grid ${narrow[2]}px at ${narrow[0]}, its narrowest above 1400` : ''));
  chk(`C · ${mode}: the RECORD panel was ${docked ? 'docked beside the grid above 1400px, a drawer at 1400 and below' : 'a drawer at every width'} (${pass})`,
    misplaced.length === 0, misplaced.slice(0, 3).join('; '));
}

// ── D. THE FIRST REQUIREMENT IS ON THE SCREEN WHEN THE BOARD OPENS ────────────────────────────────────
// v2.00 (UI S4, fix round): twice, sliding over and docked -- docked above 1400px the rows have the narrower room beside the panel
for (const [pass, docked] of PASSES) {
const misplaced = [];
for (const [w, h] of [[1920, 1080], [1440, 1000], [1366, 768], [1024, 768]]) {
  const { p, ctx } = await open(w, h, undefined, undefined, docked);
  const r = await p.evaluate(() => { const rows = [...document.querySelectorAll('#list .row')];
    const b = rows[0].getBoundingClientRect();
    return { top: Math.round(b.top), bottom: Math.round(b.bottom), inView: rows.filter(x => { const c = x.getBoundingClientRect(); return c.top >= 0 && c.bottom <= innerHeight; }).length }; });
  chk(`D · ${w}×${h}: the first requirement is on screen as it opens (${pass})`, r.bottom <= h && r.top < 320, `top ${r.top}px · ${r.inView} rows in view`);
  const why = placed(await p.evaluate(where), w, docked);
  if (why) misplaced.push(`${w}px: ${why}`);
  await ctx.close();
}
chk(`D · the RECORD panel was ${docked ? 'docked beside the grid at 1920 and 1440, a drawer at 1366 and 1024' : 'a drawer at every size'} (${pass})`,
  misplaced.length === 0, misplaced.slice(0, 3).join('; '));
}

// ── E. BRIEF IS READ-ONLY ─────────────────────────────────────────────────────────────────────────────
// v2.00 (UI S4, fix round): twice, sliding over and docked -- at 1440 docked is the panel beside the rows, which Brief hides
for (const [pass, docked] of PASSES) {
  const { p, ctx } = await open(1440, 900, 'brief', undefined, docked);
  const r = await p.evaluate(() => ({
    controls: document.querySelectorAll('#list .row input, #list .row select, #list .row button, #list .row [onchange], #list .row [onmousedown], #list .row [onclick]').length,
    drag: document.querySelectorAll('#list .row[draggable]').length,
    panel: getComputedStyle(document.getElementById('inspector')).display, dock: document.documentElement.classList.contains('ui-dock') }));
  chk(`E · Brief draws no control on any row (${pass})`, r.controls === 0 && r.drag === 0, `${r.controls} control(s), ${r.drag} draggable row(s)`);
  chk(`E · and no RECORD panel (${pass})`, r.panel === 'none', r.panel);
  chk(`E · the docked setting was ${docked ? 'on' : 'off'} (${pass})`, r.dock === docked, 'ui-dock ' + r.dock);
  await ctx.close();
}

// ── F. FUND'S COLUMNS ARE THE RECORD PANEL'S FIGURES ──────────────────────────────────────────────────
// v2.00 (UI S4, fix round): twice, sliding over and docked, and where the panel the figures were read from was
for (const [pass, docked] of PASSES) {
  const { p, ctx } = await open(1440, 1000, 'fund', undefined, docked);
  const r = await p.evaluate(() => {
    const out = [];
    const fv = lbl => { const f = [...document.querySelectorAll('#inspector .insp-f')].find(x => (x.querySelector('.fl') || {}).textContent === lbl);
      return f ? f.querySelector('.fv').textContent.trim() : null; };
    document.querySelectorAll('#list .row').forEach(row => {
      const id = row.id.replace(/^row-/, '');
      const a = [...row.querySelectorAll('.amt')].map(x => x.textContent.trim());
      setCur(id);
      const want = [fv('Discretionary'), fv('Mandatory'), fv('Unfunded')];
      const same = (x, y) => (x === '—' ? '$0' : x) === (y === '—' ? '$0' : y);
      if (!(a.length === 3 && a.every((x, i) => same(x, want[i])))) out.push(id + ' row ' + a.join('/') + ' panel ' + want.join('/'));
    });
    return { n: document.querySelectorAll('#list .row').length, out };
  });
  chk(`F · every row's Discretionary, Mandatory and Unfunded are the RECORD panel's (${r.n} rows) (${pass})`, r.out.length === 0, r.out.slice(0, 2).join('; '));
  const why = placed(await p.evaluate(where), 1440, docked);
  chk(`F · the RECORD panel was ${docked ? 'docked beside the grid' : 'a drawer'} at 1440 (${pass})`, !why, why);
  await ctx.close();
}

// ── G. MODES, DENSITIES AND FUNDING DETAIL CHANGE NO DATA ─────────────────────────────────────────────
{
  const { p, ctx } = await open(1440, 1000);
  const r = await p.evaluate(() => {
    const snap = () => JSON.stringify({ ms: MS, s: S });
    const before = snap();
    ['rank', 'fund', 'compare', 'brief', 'review'].forEach(m => { uiSetMode(m); ['compact', 'presentation', 'comfortable'].forEach(d => uiSetDensity(d)); });
    fundDetailToggle(); fundDetailToggle();
    const after = snap();
    const saved = buildSavedHtml();
    // the saved state -- and the other data blocks the file carries -- never the program's own source
    const data = [...saved.matchAll(/<script type="application\/json" id="[A-Za-z]+">([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
    return { same: before === after, blocks: data.length, leaks: /spmtMode|spmtDensity|spmtDetail|uiMode|uiDensity|"(review|rank|fund|compare|brief|compact|comfortable|presentation)"/.test(data),
             keys: Object.keys(localStorage).filter(k => /^spmt(Mode|Density|Detail)$/.test(k)).sort() };
  });
  chk('G · every mode, density and Funding detail leaves the board’s data exactly as it was', r.same);
  chk('G · they are this browser’s settings, kept under their own keys', r.keys.join(',') === 'spmtDensity,spmtDetail,spmtMode', r.keys.join(','));
  chk('G · and nothing of them is written into the saved file', r.blocks > 0 && !r.leaks, r.blocks + ' characters of saved data read');
  await ctx.close();
}

// ── H. SELECTION AND KEYBOARD FOCUS LOOK DIFFERENT ────────────────────────────────────────────────────
{
  const { p, ctx } = await open(1440, 1000);
  await p.evaluate(() => setCur('R005'));
  await p.focus('#row-R003 .rank input');
  const r = await p.evaluate(() => {
    const cs = (id, pseudo) => getComputedStyle(document.getElementById(id), pseudo || null);
    return { selBar: cs('row-R005', '::after').backgroundColor, selTint: cs('row-R005').backgroundColor,
             selRing: cs('row-R005').outlineStyle, focRing: cs('row-R003').outlineStyle, focW: cs('row-R003').outlineWidth,
             plain: cs('row-R004').backgroundColor };
  });
  chk('H · the selected row carries a bar and a tint, and no ring', r.selBar !== 'rgba(0, 0, 0, 0)' && r.selTint !== r.plain && r.selRing === 'none', JSON.stringify(r));
  chk('H · the row holding keyboard focus carries a ring', r.focRing === 'solid' && r.focW === '2px', `${r.focRing} ${r.focW}`);
  await ctx.close();
}

// ── I. EVERY "LANE SHORT" FIGURE IS READ WHOLE (v1.91, item 28) ─────────────────────────────────────────
// v2.00 (UI S4, fix round): twice, sliding over and docked; each page also says where the panel the figures were read in was
for (const [pass, docked] of PASSES) {
  const fails = [], misplaced = []; let notes = 0, big = 0;
  for (const [w, h] of [[1920, 1000], [1440, 900], [1024, 768]]) for (const d of ['compact', 'comfortable', 'presentation']) {
    const { p, ctx } = await open(w, h, 'review', d, docked);
    const r = await p.evaluate(async () => {
      const out = []; let n = 0, whole = 0;
      for (const row of [...document.querySelectorAll('#list .row')]) {
        row.click(); await new Promise(res => setTimeout(res, 10));
        for (const note of document.querySelectorAll('#inspector .insp-split .drew')) {
          if (!/lane short/.test(note.textContent)) continue;
          n++;
          const td = note.closest('td'), nb = note.getBoundingClientRect(), tb = td.getBoundingClientRect();
          // the note's own box is inside its cell, and nothing inside the note is wider than the note
          if (note.scrollWidth > note.clientWidth + 0.5 || nb.right > tb.right + 0.5 || nb.left < tb.left - 0.5)
            out.push(row.id + ' "' + note.textContent.replace(/\s+/g, ' ').trim() + '" ' + note.scrollWidth + '>' + note.clientWidth);
          if (/\$123,456,789/.test(note.textContent)) whole++;
        }
      }
      return { out, n, whole };
    });
    notes += r.n; big += r.whole;
    r.out.slice(0, 2).forEach(x => fails.push(`${w}px ${d}: ${x}`));
    const why = placed(await p.evaluate(where), w, docked);
    if (why) misplaced.push(`${w}px ${d}: ${why}`);
    await ctx.close();
  }
  chk(`I · every "lane short" figure fits its cell, whole, at 1920, 1440 and 1024 in every density (${pass})`, fails.length === 0 && notes > 0,
    fails.length ? fails.slice(0, 3).join('; ') : `${notes} notes read`);
  chk(`I · and the nine-digit one is printed whole (${pass})`, big >= 9, `$123,456,789 seen ${big} time(s)`);
  chk(`I · the figures were read in the RECORD panel ${docked ? 'docked beside the grid at 1920 and 1440, a drawer at 1024' : 'as a drawer at every width'} (${pass})`,
    misplaced.length === 0, misplaced.slice(0, 3).join('; '));
}

// ── K. NOTHING IN THE RECORD PANEL IS CUT OR HIDDEN (v2.01) ─────────────────────────────────────────────
// Read in the page, after each requirement is selected: what a person would see cut, said by element and text.
const unreadable = () => {
  const ins = document.getElementById('inspector'), out = [];
  const ir = ins.getBoundingClientRect(), right = ir.left + ins.clientWidth;
  const say = e => { const t = (e.value !== undefined && e.tagName !== 'SELECT' ? e.value : e.textContent || '').replace(/\s+/g, ' ').trim();
    return (e.className && typeof e.className === 'string' ? e.tagName.toLowerCase() + '.' + e.className.split(' ')[0] : e.tagName.toLowerCase())
      + ' "' + t.slice(0, 50) + '"'; };
  const cv = document.createElement('canvas').getContext('2d');
  for (const e of [ins, ...ins.querySelectorAll('*')]) {
    const b = e.getBoundingClientRect(); if (!b.width || !b.height) continue;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden') continue;
    if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && e.scrollWidth > e.clientWidth + 1) { out.push('scrolls sideways: ' + say(e) + ' ' + e.scrollWidth + '>' + e.clientWidth); continue; }
    if (e.tagName === 'SELECT') {
      const o = e.options[e.selectedIndex]; if (!o) continue;
      cv.font = cs.font; const tw = cv.measureText(o.text).width;
      const room = e.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 20;
      if (tw > room + 1) out.push('picker cuts its name: "' + o.text.slice(0, 60) + '" ' + Math.round(tw) + '>' + Math.round(room));
      continue;
    }
    if (e.tagName === 'INPUT' && /^(text|search|number|)$/.test(e.type) && e.scrollWidth > e.clientWidth + 1) { out.push('field cuts its value: ' + say(e)); continue; }
    const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (own && (cs.textOverflow === 'ellipsis' || /hidden|clip/.test(cs.overflowX)) && e.scrollWidth > e.clientWidth + 1) { out.push('text cut: ' + say(e) + ' ' + e.scrollWidth + '>' + e.clientWidth); continue; }
    if ((own || /^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(e.tagName)) && (b.right > right + 1 || b.left < ir.left - 1)) { out.push('past the panel edge: ' + say(e) + ' ends at ' + Math.round(b.right) + ' of ' + Math.round(right)); continue; }
    // text that is not cut can still spill out of its cell, over its neighbour's
    const cell = own && e.closest('td, th');
    if (cell && cell !== e && ins.contains(cell)) { const c = cell.getBoundingClientRect();
      if (b.right > c.right + 1 || b.left < c.left - 1) out.push('spills out of its cell: ' + say(e) + ' ' + Math.round(b.left) + '-' + Math.round(b.right) + ' in ' + Math.round(c.left) + '-' + Math.round(c.right)); }
    else if (own && /^(TD|TH)$/.test(e.tagName) && e.scrollWidth > e.clientWidth + 1) out.push('spills out of its cell: ' + say(e) + ' ' + e.scrollWidth + '>' + e.clientWidth);
  }
  return [...new Set(out)];
};
for (const [pass, docked] of PASSES) {
  const fails = []; let seen = 0, big = 0;
  for (const [w, h] of [[1920, 1000], [1440, 900], [1366, 768], [1280, 800], [1024, 768]]) for (const d of ['compact', 'comfortable', 'presentation']) {
    const { p, ctx } = await open(w, h, 'review', d, docked, fileK);
    const r = await p.evaluate(async (fn) => {
      const look = (0, eval)('(' + fn + ')'), out = []; let n = 0, whole = 0;
      for (const row of [...document.querySelectorAll('#list .row')]) {
        row.click(); await new Promise(res => setTimeout(res, 10)); n++;
        look().forEach(x => out.push(row.id + ': ' + x));
        if (/\$9,876,543,210/.test(document.getElementById('inspector').textContent)) whole++;
      }
      return { out, n, whole };
    }, unreadable.toString());
    seen += r.n; big += r.whole;
    r.out.slice(0, 3).forEach(x => fails.push(`${w}px ${d}: ${x}`));
    await ctx.close();
  }
  chk(`K · nothing in the RECORD panel is cut or hidden, for any requirement, at 1920, 1440, 1366, 1280 and 1024 in every density (${pass})`,
    fails.length === 0 && seen > 0, fails.length ? `${fails.length} found, e.g. ${fails.slice(0, 4).join('; ')}` : `${seen} records read`);
  chk(`K · the ten-digit shortfall was on the board, and read (${pass})`, big >= 15, `$9,876,543,210 seen ${big} time(s)`);
}

// ── J. 761-1023px, EVERY WIDTH, EVERY MODE (v1.91, item 31) ─────────────────────────────────────────────
{
  const measure = () => {
    const W = innerWidth, out = [];
    if (document.documentElement.scrollWidth > W) out.push('page ' + document.documentElement.scrollWidth + 'px wide');
    for (const row of document.querySelectorAll('#list .row')) {
      const rr = row.getBoundingClientRect();
      for (const c of row.querySelectorAll(':scope > *, button, input, select')) {
        const b = c.getBoundingClientRect(); if (!b.width || !b.height) continue;
        if (b.right > rr.right + 1 || b.left < rr.left - 1) { out.push(row.id + ' ' + (c.className || c.tagName).split(' ')[0] + ' past the row (' + Math.round(b.right) + '>' + Math.round(rr.right) + ')'); break; }
      }
      for (const c of row.querySelectorAll('.num, .amt, .acts.alloc input')) {
        if (!c.getBoundingClientRect().width) continue;
        if (c.scrollWidth > c.clientWidth + 1) { out.push(row.id + ' "' + (c.value || c.textContent).trim() + '" cut in its cell'); break; }
      }
      if (out.length > 3) break;
    }
    for (const e of document.querySelectorAll('#topStack *')) {
      const b = e.getBoundingClientRect(); if (!b.width) continue;
      if (b.right > W + 1) { let q = e; while (q && !q.id) q = q.parentElement; out.push('top: ' + ((q && q.id) || e.className) + ' ends at ' + Math.round(b.right)); break; }
    }
    return out;
  };
  for (const theme of ['harbor', 'parchment']) for (const mode of ['review', 'rank', 'fund', 'compare', 'brief']) {
    const ctx = await b.newContext({ viewport: { width: 1023, height: 900 } });
    await ctx.addInitScript(([t, m]) => { try { localStorage.setItem('spmtTheme', t); localStorage.setItem('spmtMode', m); } catch (e) {} }, [theme, mode]);
    const p = await ctx.newPage();
    await p.goto('file://' + file);
    await p.waitForFunction(() => typeof render === 'function' && document.querySelectorAll('#list .row').length > 0, null, { timeout: 40000 });
    await p.waitForTimeout(250);
    const fails = [];
    for (let w = 1023; w >= 761; w--) {
      await p.setViewportSize({ width: w, height: 900 });
      await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      const o = await p.evaluate(measure);
      if (o.length) fails.push(w + 'px: ' + o[0]);
    }
    chk(`J · ${theme} ${mode}: every width 761-1023 fits`, fails.length === 0,
      fails.length ? `${fails.length} width(s), e.g. ${fails.slice(0, 2).join('; ')}` : '263 widths');
    await ctx.close();
  }
  for (const [w, h] of [[900, 900], [768, 1024]]) {
    const { p, ctx } = await open(w, h, 'review');
    const id = await p.evaluate(() => document.querySelectorAll('#list .row')[1].id);
    await p.click('#' + id + ' .t1'); await p.waitForTimeout(400);
    const r = await p.evaluate(() => { const bs = [...document.querySelectorAll('#inspector .insp-act')];
      return { n: bs.length, onScreen: bs.filter(e => { const c = e.getBoundingClientRect(); return c.width > 0 && c.left >= -1 && c.right <= innerWidth + 1 && c.top >= 0 && c.bottom <= innerHeight; }).length }; });
    chk(`J · ${w}×${h}: the drawer opens with its three editors on screen`, r.n === 3 && r.onScreen === 3, `${r.onScreen}/${r.n}`);
    await ctx.close();
  }
  {
    const { p, ctx } = await open(390, 844, 'review');
    const r = await p.evaluate(() => ({ docW: document.documentElement.scrollWidth, rows: document.querySelectorAll('#list .row').length }));
    const id = await p.evaluate(() => document.querySelectorAll('#list .row')[0].id);
    await p.click('#' + id + ' .t1'); await p.waitForTimeout(400);
    const d = await p.evaluate(() => { const i = document.getElementById('inspector').getBoundingClientRect(); return i.left >= -1 && i.right <= innerWidth + 1 && i.width > 200; });
    chk('J · a phone (390×844) opens: no sideways scroll, the rows, and the drawer on screen', r.docW <= 390 && r.rows > 0 && d, `page ${r.docW}px · ${r.rows} rows · drawer ${d ? 'on screen' : 'NOT on screen'}`);
    await ctx.close();
  }
}

// ── L. PPBE BUDGET POSITIONS: EACH RCN / EEIC LINE ON ONE ROW (v2.06, item 118) ─────────────────────────────
// .fctab is table-layout:fixed, where min-width is ignored; the line-label column took an equal share with the years and
// "RCN [box] EEIC [box] ✕" wrapped onto a second row, so two lines read as four (Brad's photo, BES28 USAF). Two lines with
// ten-digit figures, one figure per line and split, at four widths: every line's RCN box, EEIC box and ✕ share one row,
// no box cuts its value, and a line's year boxes sit on its label's row.
{
  const fails = []; let lines = 0;
  for (const split of [false, true]) for (const w of [1920, 1440, 1366, 1024]) {
    const { p, ctx } = await open(w, 900, 'review');
    const r = await p.evaluate((sp) => {
      window.confirm = () => true; MS.ppbe = MS.ppbe || {}; ppCyc = 'BES'; ppYr = 2028; ppSvcIdx = 0;
      ppLineAdd('USAF'); ppLineAdd('USAF'); const L = ppPos().lines.USAF;
      ppLineSet('USAF', L[0].k, 'rcn', '41392'); ppLineSet('USAF', L[0].k, 'eeic', '57811');
      ppLineSet('USAF', L[1].k, 'rcn', '41395'); ppLineSet('USAF', L[1].k, 'eeic', '57815');
      [2026, 2027, 2028, 2029, 2030, 2031, 2032].forEach((y, i) => { ppSetV('USAF', L[0].k, y, 'd', String(2280000000 + i)); ppSetV('USAF', L[1].k, y, 'd', String(15828000 + i)); });
      ppSplitSet(sp); ppOpen = false; toggleP2();
      const out = [], tb = document.querySelector('#ppBody table.fctab'); let n = 0;
      for (const td of [...tb.querySelectorAll('td')].filter(c => c.querySelector('input[onchange^="ppLineSet"]'))) {   // by what it holds, not its class
        n++;
        const parts = [...td.querySelectorAll('input, button')].map(e => e.getBoundingClientRect());
        const tops = parts.map(b => Math.round(b.top));
        if (Math.max(...tops) - Math.min(...tops) > 1) out.push('line ' + n + ': its RCN, EEIC and ✕ are on ' + new Set(tops).size + ' rows');
        for (const i of td.querySelectorAll('input')) if (i.scrollWidth > i.clientWidth + 1) out.push('line ' + n + ': "' + i.value + '" cut');
        const row = td.parentElement, rows = sp ? [row.nextElementSibling, row.nextElementSibling && row.nextElementSibling.nextElementSibling] : [row];
        for (const rr of rows) for (const i of rr.querySelectorAll('input[onchange^="ppSetV"]')) {
          if (i.scrollWidth > i.clientWidth + 1) out.push('line ' + n + ': year box "' + i.value + '" cut');
          if (!sp && Math.abs(i.getBoundingClientRect().top - parts[0].top) > 6) out.push('line ' + n + ': a year box is off its row');
        }
      }
      return { out, n };
    }, split);
    lines += r.n; r.out.forEach(o => fails.push(`${w}px${split ? ' split' : ''}: ${o}`));
    await ctx.close();
  }
  chk('L · PPBE Budget Positions: every RCN / EEIC line on one row, nothing cut, at 1920, 1440, 1366 and 1024, split and not',
    fails.length === 0 && lines === 16, fails.length ? `${fails.length} found, e.g. ${fails.slice(0, 3).join('; ')}` : `${lines} lines read`);
}

// ── M. THE ADD BOX FITS WHOLE (v2.07, item 121) ──────────────────────────────────────────────────────────────
// Brad: "everything legible and not running off the screen or needing to scroll". The box that builds the whole record is
// measured with all of it showing -- six services' values, a budget picker on each (the longest name chosen), the two OGC
// fields, the CCaR record's title read in, Add pressed early so the missing fields are marked and the box says what is
// missing -- then on From another year with that year's rows, then with one brought in being finished. At 1366 x 657 (a
// 1366 x 768 laptop's window) and 1920 x 969, in Harbor and Midnight, in this machine's font and in the Segoe stand-in: the
// box sits inside the window, nothing in it scrolls or is cut below, no field cuts its value, no picker cuts the name it
// shows, no label, rail line or text is cut or past the box's edge. Below 1366 (1280 x 720) it is one column and the box
// scrolls, and still nothing is cut sideways.
const boxUnreadable = (sel) => {
  const m = document.querySelector(sel || '#addPanel .modal'), out = [];
  if (!m) return ['no box'];
  const mr = m.getBoundingClientRect();
  if (mr.top < -1 || mr.left < -1 || mr.bottom > innerHeight + 1 || mr.right > innerWidth + 1)
    out.push(`the box runs off the window: ${Math.round(mr.left)},${Math.round(mr.top)}-${Math.round(mr.right)},${Math.round(mr.bottom)} in ${innerWidth}x${innerHeight}`);
  const say = e => { const t = String(/^(INPUT|TEXTAREA)$/.test(e.tagName) ? e.value : e.textContent || '').replace(/\s+/g, ' ').trim();
    return (e.id ? '#' + e.id : (e.className && typeof e.className === 'string' ? e.tagName.toLowerCase() + '.' + e.className.split(' ')[0] : e.tagName.toLowerCase()))
      + ' "' + t.slice(0, 40) + '"'; };
  const cv = document.createElement('canvas').getContext('2d');
  for (const e of [m, ...m.querySelectorAll('*')]) {
    const b = e.getBoundingClientRect(); if (!b.width || !b.height) continue;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || e.closest('.sr')) continue;
    if (e.tagName !== 'TEXTAREA' && e.tagName !== 'SELECT' && /auto|scroll|hidden|clip/.test(cs.overflowY + cs.overflowX)) {
      if (e.scrollHeight > e.clientHeight + 1 && !/ellipsis/.test(cs.textOverflow)) out.push('scrolls or cuts below: ' + say(e) + ' ' + e.scrollHeight + '>' + e.clientHeight);
      if (e.scrollWidth > e.clientWidth + 1 && /auto|scroll/.test(cs.overflowX)) out.push('scrolls sideways: ' + say(e) + ' ' + e.scrollWidth + '>' + e.clientWidth);
    }
    if (e.tagName === 'SELECT') {
      const o = e.options[e.selectedIndex]; if (!o) continue;
      cv.font = cs.font; const tw = cv.measureText(o.text).width;
      const room = e.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 20;
      if (tw > room + 1) out.push('picker cuts its name: ' + say(e) + ' "' + o.text.slice(0, 50) + '" ' + Math.round(tw) + '>' + Math.round(room));
      continue;
    }
    if (e.tagName === 'INPUT' && /^(text|search|number|)$/.test(e.type) && e.scrollWidth > e.clientWidth + 1) { out.push('field cuts its value: ' + say(e)); continue; }
    const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (own && (cs.textOverflow === 'ellipsis' || /hidden|clip/.test(cs.overflowX)) && e.scrollWidth > e.clientWidth + 1) { out.push('text cut: ' + say(e) + ' ' + e.scrollWidth + '>' + e.clientWidth); continue; }
    if ((own || /^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(e.tagName)) && (b.right > mr.right + 1 || b.left < mr.left - 1 || b.bottom > mr.bottom + 1))
      { out.push('past the box’s edge: ' + say(e)); continue; }
    const cell = own && e.closest('td, th');
    if (cell && cell !== e && m.contains(cell)) { const c = cell.getBoundingClientRect();
      if (b.right > c.right + 1 || b.left < c.left - 1) out.push('spills out of its cell: ' + say(e)); }
    else if (own && /^(TD|TH)$/.test(e.tagName) && e.scrollWidth > e.clientWidth + 1) out.push('spills out of its cell: ' + say(e));
  }
  return [...new Set(out)];
};
// the box in each of its three states; returns what is not shown that should be, and what is unreadable
const BOX_STATES = [
  ['New requirement, filled, Add pressed early', () => {
    setPmoFilter('PSM'); if (arOn()) arHide(); toggleAdd();
    const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
    set('arEvent', 'Depot tooling for the F135 engine line'); arPt('OGC'); set('arCcar', 'JSF3087'); set('arPid', 'PID-' + '4'.repeat(31));
    [123456789, 98765432, 87654321, 76543210, 65432109, 54321098].forEach((v, i) => set('arV' + i, v.toLocaleString('en-US')));
    SVC.forEach((s, i) => { const sel = document.getElementById('arB' + i); if (!sel) return;
      const o = [...sel.options].filter(x => x.value).sort((a, c) => c.value.length - a.value.length)[0]; if (o) set('arB' + i, o.value); });
    const g = flowEntsAZ().filter(e => e.kind !== 'prime').sort((a, c) => c.n.length - a.n.length)[0];
    set('arTo', g ? g.k : ''); set('arEnd', g ? g.k : ''); set('arWbs', '1.2.3.4.5.6.7.8.9.10.11.12.13.14.15.16'); set('arDesc', 'Tooling the F135 line cannot run without; replaces 1990s fixtures at end of life.');
    arAdd(false);
    const sh = id => { const e = document.getElementById(id); return !!e && e.getClientRects().length > 0; };
    return ['arB0', 'arB1', 'arB2', 'arB3', 'arB4', 'arB5', 'arEnd', 'arMipr', 'arMsg'].filter(id => !sh(id) || (id === 'arMsg' && !/still needed/.test(document.getElementById(id).textContent)));
  }],
  ['From another year, a year’s rows', () => {
    arTab('yr'); naFromPick(String(MS.cur - 1)); naFromTick('NEW-91', true);
    const n = document.querySelectorAll('#naFromWrap tr[data-id]').length;
    return n >= 5 ? [] : ['the other year’s rows (' + n + ')'];
  }],
  ['one brought in being finished', () => {
    // the form still holds what the first state typed, so bringing one in to finish asks first (v2.07 review): answered OK, as
    // a person who wants it finished would
    const c0 = window.confirm; window.confirm = () => true;
    try { naFromAdd(); } finally { window.confirm = c0; }
    const fb = document.getElementById('arFinBar');
    return fb && !fb.hidden && arTabOn === 'new' ? [] : ['the bar of the one being finished'];
  }],
];
{
  // the K board, and: every service with a budget for PSM under a long name, the CCaR records list with a long record title,
  // and the year before holding PSM's requirements -- three added ones not in this year, one of them complete
  ev(`BUDDB.rows=BUDDB.rows.concat(['USAF O&M NON AFRC NON ANG CAM Discretionary PSM', 'USAF O&M - AFRC CAM Discretionary PSM',
      'USMC CV O&M -1A9A FL Discretionary PSM'].map(budParseName).filter(Boolean)); BUDDB.ts=1700000000051; _budRegCache=null;
    MS.ccarIdx={ts:1700000000052, file:'ccar.xlsx', n:1, rows:{JSF3087:{t:'F-35 propulsion depot activation, support equipment and tooling for the F135 line', o:'', p:'PSM', k:'3087',
      s:'Depot activation tooling', d:1}}};
    var Y=MS.cur-1, T={order:S.order.filter(function(id){ return grpOf(itemById(id))==='PSM'; }), alloc:{}, mc:{}, removed:[], custom:[], titles:{}, ccar:{}, pid:{},
      ptype:{}, obCat:{}, wbs:{}, dest:{}, desc:{}, cons:{}, budgetAsg:{}, discSvc:SVC.map(function(){ return 0; }), mandSvc:SVC.map(function(){ return 0; })};
    [['NEW-91','Engine module repair capacity, FY26 surge'], ['NEW-92','Low observable restoration kits'], ['NEW-93','Supply chain data analytics']]
      .forEach(function(x, i){ T.custom.push({id:x[0], grp:'PSM', team:'PSM', sect:'new', custom:true, title:'', event:x[1], ccar:'', fy26:SVC.map(function(){ return 0; }),
        ask:SVC.map(function(s, j){ return (i+1)*(j+3)*1234567; }), alloc:null}); T.order.push(x[0]); T.ccar[x[0]]='JSF'+(3090+i); T.pid[x[0]]='PID-'+(5100+i); });
    T.desc['NEW-91']='Keeps the line open'; T.cons['NEW-91']='Engines wait for repair into FY28.';
    MS.years[Y]=T; applyState(S); save(); 'ok'`);
  const fileM = join(dir, 'board-m.html'), fileMS = join(dir, 'board-m-segoe.html');
  writeFileSync(fileM, ev('buildSavedHtml()'));
  writeFileSync(fileMS, withStandin(readFileSync(fileM, 'utf8')));
  const fails = [], notShown = []; let read = 0;
  for (const [font, at] of [['this machine’s font', fileM], ['the Segoe stand-in', fileMS]])
    for (const theme of ['harbor', ''])
      for (const [w, h] of [[1366, 657], [1920, 969]]) {
        const { p, ctx } = await open(w, h, 'review', '', false, at, theme);
        if (at === fileMS) { const why = await standinProblem(p); if (why) { fails.push(`${w}x${h} ${font}: ${why}`); await ctx.close(); continue; } }
        const tag = `${w}x${h} ${theme || 'midnight'} ${font}`;
        for (const [state, fn] of BOX_STATES) {
          const r = await p.evaluate(([fn, look]) => { const miss = (0, eval)('(' + fn + ')')(); return { miss, bad: (0, eval)('(' + look + ')')() }; },
            [fn.toString(), boxUnreadable.toString()]);
          read++;
          r.miss.forEach(x => notShown.push(`${tag}, ${state}: ${x}`));
          r.bad.slice(0, 4).forEach(x => fails.push(`${tag}, ${state}: ${x}`));
        }
        await ctx.close();
      }
  chk('M · the Add box shows all of itself in every state measured: six budget pickers, the OGC fields, what is missing, another year’s rows, one being finished',
    notShown.length === 0 && read === 24, notShown.length ? `not shown: ${notShown.slice(0, 4).join('; ')}` : `${read} states`);
  chk('M · the Add box fits whole at 1366x657 and 1920x969, Harbor and Midnight, this font and the Segoe stand-in: nothing scrolls, nothing is cut, nothing runs off',
    fails.length === 0, fails.length ? `${fails.length} found, e.g. ${fails.slice(0, 5).join('; ')}` : `${read} states read`);
  // below 1366: one column, and the box scrolls -- and still nothing is cut sideways
  const { p, ctx } = await open(1280, 720, 'review', '', false, fileM);
  const r = await p.evaluate(([fn, look]) => { (0, eval)('(' + fn + ')')();
    const m = document.querySelector('#addPanel .modal'), cols = [...document.querySelectorAll('#arNew .ar-col')].map(c => Math.round(c.getBoundingClientRect().left));
    const ft = document.getElementById('arAddBtn').getBoundingClientRect();
    return { cols, scrolls: m.scrollHeight > m.clientHeight + 1, foot: ft.bottom <= innerHeight + 1 && ft.top >= 0,
      side: (0, eval)('(' + look + ')')().filter(x => !/^scrolls or cuts below: (#addPanel|div\.modal)|^past the box’s edge: .*/.test(x) || /sideways|cuts its|cut:|spills/.test(x)) };
  }, [BOX_STATES[0][1].toString(), boxUnreadable.toString()]);
  await ctx.close();
  chk('M · below 1366 (1280x720) the box is one column that scrolls, with Add on screen, and nothing is cut sideways',
    r.cols.length === 3 && new Set(r.cols).size === 1 && r.scrolls && r.foot && !r.side.length, JSON.stringify(r).slice(0, 300));
}

// ── N. THE EDIT BOX FITS WHOLE (v2.08, item 122) ─────────────────────────────────────────────────────────────
// The box that edits the whole record, measured as M measures the Add box (no layout check measured it, the review found): on
// the M board, a requirement given a plan event, a 35-character PID, a CCaR record whose title is long, the longest
// government activity for Goes to and Which awards to with a MIPR type, a paragraph in each written field, and its per-service
// RCN / EEIC rows open where it has them. The plan event is M's: it has no length limit, and a one-line field shows what fits,
// in both boxes alike. At 1366 x 657 and 1920 x 969, Harbor and Midnight, this font and the Segoe stand-in:
// the box sits inside the window, nothing in it scrolls or is cut, no field cuts its value, no picker its name.
const ER_STATE = () => {
  setPmoFilter('ALL'); if (typeof erOn === 'function' && erOn()) erClose();
  const id = S.order.filter(x => ptypeOf(x) !== 'PRIME')[0];
  if (typeof rcnSvcOpen !== 'undefined') rcnSvcOpen[id] = true;
  // stored values the lists do not hold, kept as saved: the option said "— not on the list, kept as saved" and a closed
  // select cannot wrap, so the value was cut (v2.08 second review)
  S.obCat = S.obCat || {}; S.obCat[id] = 'Contract services (FY24 file)';
  S.rcnSvc = S.rcnSvc || {}; S.rcnSvc[id] = {}; rcnFundedSvcs(id).forEach(sv => { S.rcnSvc[id][sv] = 'R8|E8'; });
  setCur(id); openEdit(id, 'rec');
  const set = (eid, v) => { const e = document.getElementById(eid); if (!e) return; e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
  set('erEvent', 'Depot tooling for the F135 engine line'); erPt('OGC'); set('erCcar', 'JSF3087'); set('erPid', 'PID-' + '4'.repeat(31));
  const g = flowEntsAZ().filter(e => e.kind !== 'prime').sort((a, c) => c.n.length - a.n.length)[0];
  set('erTo', g ? g.k : ''); set('erEnd', g ? g.k : ''); set('erMipr', 'reimb'); set('erWbs', '1.2.3.4.5.6.7.8.9.10.11.12.13.14.15.16');
  const para = 'Tooling the F135 line cannot run without; it replaces 1990s fixtures at the end of their life and keeps two test cells open. ';
  set('erDesc', para + para); set('erCons', 'If this is not funded the line stops in March and forty engines wait into FY28. ' + para); set('erNote', 'Agreed at the September SFWG.');
  const sh = eid => { const e = document.getElementById(eid); return !!e && e.getClientRects().length > 0; };
  const kept = eid => { const e = document.getElementById(eid); return !!e && / \(kept\)$/.test((e.options[e.selectedIndex] || {}).text || ''); };
  return ['erEnd', 'erMipr', 'erChk', 'erSaveBtn', 'erToPanel'].filter(eid => !sh(eid))
    .concat(kept('erOb') ? [] : ['the kept obligation category']).concat(document.querySelector('#erRcnSvcRows select') && !document.querySelector('#erRcnSvcRows option[title]') ? ['the kept per-service RCN / EEIC'] : []);
};
{
  const fails = [], notShown = []; let read = 0;
  const fileM = join(dir, 'board-m.html'), fileMS = join(dir, 'board-m-segoe.html');
  for (const [font, at] of [['this machine’s font', fileM], ['the Segoe stand-in', fileMS]])
    for (const theme of ['harbor', ''])
      for (const [w, h] of [[1366, 657], [1920, 969]]) {
        const { p, ctx } = await open(w, h, 'review', '', false, at, theme);
        if (at === fileMS) { const why = await standinProblem(p); if (why) { fails.push(`${w}x${h} ${font}: ${why}`); await ctx.close(); continue; } }
        const tag = `${w}x${h} ${theme || 'midnight'} ${font}`;
        const r = await p.evaluate(([fn, look]) => { const miss = (0, eval)('(' + fn + ')')(); return { miss, bad: (0, eval)('(' + look + ')')('#editPanel .modal') }; },
          [ER_STATE.toString(), boxUnreadable.toString()]);
        read++;
        r.miss.forEach(x => notShown.push(`${tag}: ${x}`));
        r.bad.slice(0, 4).forEach(x => fails.push(`${tag}: ${x}`));
        await ctx.close();
      }
  chk('N · the edit box shows all of itself: the OGC fields, the required list, Save, the way to the RECORD panel and values kept as saved',
    notShown.length === 0 && read === 8, notShown.length ? `not shown: ${notShown.slice(0, 4).join('; ')}` : `${read} states`);
  chk('N · the edit box fits whole at 1366x657 and 1920x969, Harbor and Midnight, this font and the Segoe stand-in: nothing scrolls, nothing is cut, nothing runs off',
    fails.length === 0, fails.length ? `${fails.length} found, e.g. ${fails.slice(0, 6).join('; ')}` : `${read} states read`);
  // below 1366: one column, and the box scrolls -- with Save on screen, and nothing cut sideways (as M holds the Add box)
  const { p, ctx } = await open(1280, 720, 'review', '', false, fileM);
  const r = await p.evaluate(([fn, look]) => { (0, eval)('(' + fn + ')')();
    const m = document.querySelector('#editPanel .modal'), cols = [...document.querySelectorAll('#erMain .ar-col')].map(c => Math.round(c.getBoundingClientRect().left));
    const ft = document.getElementById('erSaveBtn').getBoundingClientRect();
    return { cols, scrolls: m.scrollHeight > m.clientHeight + 1, foot: ft.bottom <= innerHeight + 1 && ft.top >= 0,
      side: (0, eval)('(' + look + ')')('#editPanel .modal').filter(x => !/^scrolls or cuts below: (#editPanel|div\.modal)|^past the box’s edge: .*/.test(x) || /sideways|cuts its|cut:|spills/.test(x)) };
  }, [ER_STATE.toString(), boxUnreadable.toString()]);
  await ctx.close();
  chk('N · below 1366 (1280x720) the box is one column that scrolls, with Save on screen, and nothing is cut sideways',
    r.cols.length === 3 && new Set(r.cols).size === 1 && r.scrolls && r.foot && !r.side.length, JSON.stringify(r).slice(0, 300));
}

// ── O. FYDP DISCONNECTS: THE TABLE FITS AT 1366, AND SCROLLS INSIDE ITS BOX BELOW (v2.10, item 130) ───────────────────
// The Summary and the USAF sheet, with figures as wide as the slides carry (a requirement in the tens of billions, a shortfall in
// red parentheses) and an International figure typed. At 1920, 1440 and 1366 the table is whole in its box: no cell cuts a
// label or a figure, no box cuts its value, the pickers and the tabs sit inside the box, nothing scrolls sideways. Narrower
// than the table's own 900px (800 wide) it scrolls sideways INSIDE its own frame and nothing else does -- not the box, not the
// page; at 1024 it does whichever it needs, and still cuts nothing. Harbor and Midnight, this font and the Segoe stand-in. The
// box scrolls down, as every tall box does; that is not measured here.
{
  ev(`(function(){ var Y=[2026,2027,2028,2029,2030,2031,2032,2033], S6=['USAF','ANG','AFRC','STOVL','USMC-C','USN'], L=[];
      ['om','ff','sp'].forEach(function(ap,a){ S6.forEach(function(sv,s){ var v={}; Y.forEach(function(y){ v[y]=(a+1)*4.4e9+(s+1)*6.1e8+(y-2020)*3.3e7+0.4; }); L.push({ap:ap,pmo:'AV',svc:sv,v:v}); }); });
      ACEDB.sets['2025ACE']={label:'2025ACE', ts:1700000000061, years:Y, lines:L, appn:{}, skip:{}};
      var val={}, lines={}; S6.forEach(function(sv,s){ lines[sv]=[{k:'_all',all:true}]; val[sv]={_all:{}};
        [2027,2028,2029,2030,2031,2032].forEach(function(y){ val[sv]._all[y]={d:(s+1)*3.1e8+(y-2027)*2e6, m:y===2027? 5e6 : 0}; }); });
      MS.ppbe=MS.ppbe||{}; MS.ppbe['BES|2028']={v:2, split:true, lines:lines, val:val}; MS.cycle='BES|2028'; save(); })(); 'ok'`);
  const fileO = join(dir, 'board-o.html'), fileOS = join(dir, 'board-o-segoe.html');
  writeFileSync(fileO, ev('buildSavedHtml()'));
  writeFileSync(fileOS, withStandin(readFileSync(fileO, 'utf8')));
  const LOOK = () => {
    const m = document.querySelector('#fdcPanel .modal'), w = m && m.querySelector('.fdcwrap'), out = [];
    if (!m || !w || !document.getElementById('fdcPanel').classList.contains('open')) return { out: ['the box or its table is not on screen'], wrap: false, rows: 0 };
    const mr = m.getBoundingClientRect(), say = e => '"' + String(e.value || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) + '"';
    if (mr.left < -1 || mr.right > innerWidth + 1) out.push(`the box runs off the window sideways: ${Math.round(mr.left)}-${Math.round(mr.right)} in ${innerWidth}`);
    if (m.scrollWidth > m.clientWidth + 1) out.push(`the box scrolls sideways: ${m.scrollWidth}>${m.clientWidth}`);
    const de = document.documentElement; if (de.scrollWidth > de.clientWidth + 1) out.push(`the page scrolls sideways: ${de.scrollWidth}>${de.clientWidth}`);
    for (const c of m.querySelectorAll('#fdcPage td, #fdcPage th')) if (c.scrollWidth > c.clientWidth + 1) out.push('cut in its cell: ' + say(c));
    for (const i of m.querySelectorAll('input')) if (i.scrollWidth > i.clientWidth + 1) out.push('the box cuts its value: ' + say(i));
    const cv = document.createElement('canvas').getContext('2d');
    for (const s of m.querySelectorAll('select')) { const o = s.options[s.selectedIndex]; if (!o) continue; const cs = getComputedStyle(s); cv.font = cs.font;
      if (cv.measureText(o.text).width > s.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 20 + 1) out.push('the picker cuts its name: ' + say(o)); }
    for (const e of m.querySelectorAll('.fdcbar > *, .fdctabs button, h3 .x')) { const r = e.getBoundingClientRect();
      if (r.width && (r.right > mr.right + 1 || r.left < mr.left - 1)) out.push('past the box’s edge: ' + say(e)); }
    return { out, wrap: w.scrollWidth > w.clientWidth + 1, rows: m.querySelectorAll('#fdcPage tbody tr').length };
  };
  const OPEN = (tab) => { if (!fdcOpen) toggleFdc(); fdcTab(tab);
    if (tab === 0) { const e = document.getElementById('fdcIn_ir_om_2028'); if (e) { e.value = '12,345.6'; e.dispatchEvent(new Event('change', { bubbles: true })); } } };
  const fails = [], scroll = []; let read = 0;
  for (const [font, at] of [['this machine’s font', fileO], ['the Segoe stand-in', fileOS]])
    for (const theme of ['harbor', ''])
      for (const [w, h] of [[1920, 969], [1440, 900], [1366, 657], [1024, 700], [800, 700]]) {
        const { p, ctx } = await open(w, h, 'review', '', false, at, theme);
        if (at === fileOS) { const why = await standinProblem(p); if (why) { fails.push(`${w}x${h} ${font}: ${why}`); await ctx.close(); continue; } }
        for (const tab of [0, 1]) {
          const r = await p.evaluate(([o, look, tb]) => { (0, eval)('(' + o + ')')(tb); return (0, eval)('(' + look + ')')(); }, [OPEN.toString(), LOOK.toString(), tab]);
          read++;
          const tag = `${w}x${h} ${theme || 'midnight'} ${font} ${tab ? 'USAF' : 'Summary'}`;
          if (r.rows < 20) fails.push(`${tag}: only ${r.rows} rows on screen`);
          r.out.slice(0, 4).forEach(x => fails.push(`${tag}: ${x}`));
          if (w >= 1366 && r.wrap) scroll.push(`${tag}: the table scrolls sideways at a width it fits`);
          if (w === 800 && !r.wrap) scroll.push(`${tag}: the table does not scroll inside its frame, narrower than it`);
        }
        await ctx.close();
      }
  chk('O · FYDP Disconnects: nothing cut, nothing past the box, neither the box nor the page scrolls sideways (1920 to 800, Harbor and Midnight, this font and the Segoe stand-in, Summary and USAF)',
    fails.length === 0 && read === 40, fails.length ? `${fails.length} found, e.g. ${fails.slice(0, 5).join('; ')}` : `${read} states read`);
  chk('O · the table fits whole at 1920, 1440 and 1366, and scrolls sideways inside its own frame at 800, narrower than it',
    scroll.length === 0 && read === 40, scroll.slice(0, 4).join('; '));
}

// ── P. THE COST ESTIMATE IMPORT'S REPORT AND MAPPING BOX (v2.12, item 132) ─────────────────────────────────────────────
// The report as the 2026 file makes it: every reason, its rows and its dollars in the billions, 38 named rows and the rest, two
// conflicting names (one long), the columns read; then the mapping box asking for two renamed titles, each picker listing the
// file's own 44 headers. Each must be whole in the window: no sideways scroll (box or page), nothing past the box's edge, no cell
// cutting its text, no picker cutting the name it shows. The box scrolls down, as every tall box does; that is not measured.
{
  ev(ACE_REP_SEED + `save(); 'ok'`);
  const fileP = join(dir, 'board-p.html'), filePS = join(dir, 'board-p-segoe.html');
  writeFileSync(fileP, ev('buildSavedHtml()'));
  writeFileSync(filePS, withStandin(readFileSync(fileP, 'utf8')));
  const LOOK = (id) => {
    const bg = document.getElementById(id), m = bg && bg.querySelector('.modal'), out = [];
    if (!m || !bg.classList.contains('open')) return { out: ['the box is not on screen'], rows: 0 };
    const mr = m.getBoundingClientRect(), say = e => '"' + String(e.value || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) + '"';
    if (mr.left < -1 || mr.right > innerWidth + 1) out.push(`the box runs off the window sideways: ${Math.round(mr.left)}-${Math.round(mr.right)} in ${innerWidth}`);
    if (m.scrollWidth > m.clientWidth + 1) out.push(`the box scrolls sideways: ${m.scrollWidth}>${m.clientWidth}`);
    const de = document.documentElement; if (de.scrollWidth > de.clientWidth + 1) out.push(`the page scrolls sideways: ${de.scrollWidth}>${de.clientWidth}`);
    for (const c of m.querySelectorAll('td, th, summary, .hint')) if (c.scrollWidth > c.clientWidth + 1) out.push('cut in its cell: ' + say(c));
    const cv = document.createElement('canvas').getContext('2d');
    for (const sl of m.querySelectorAll('select')) { const o = sl.options[sl.selectedIndex]; if (!o) continue; const cs = getComputedStyle(sl); cv.font = cs.font;
      if (cv.measureText(o.text).width > sl.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 20 + 1) out.push('the picker cuts its name: ' + say(o)); }
    for (const e of m.querySelectorAll('table, select, button, h3 .x')) { const r = e.getBoundingClientRect();
      if (r.width && (r.right > mr.right + 1 || r.left < mr.left - 1)) out.push('past the box’s edge: ' + say(e)); }
    return { out, rows: m.querySelectorAll('tr').length };
  };
  const fails = []; let read = 0;
  for (const [font, at] of [['this machine’s font', fileP], ['the Segoe stand-in', filePS]])
    for (const theme of ['harbor', ''])
      for (const [w, h] of [[1920, 969], [1440, 900], [1366, 657], [1024, 700], [800, 700]]) {
        const { p, ctx } = await open(w, h, 'review', '', false, at, theme);
        if (at === filePS) { const why = await standinProblem(p); if (why) { fails.push(`${w}x${h} ${font}: ${why}`); await ctx.close(); continue; } }
        for (const [box, how, want] of [['aceRepPanel', `aceRepShow('2026ACE')`, 60], ['aceColPanel', ACE_COL_ASK, 3]]) {
          const r = await p.evaluate(([how, look, box]) => { (0, eval)(how); render(); return (0, eval)('(' + look + ')')(box); }, [how, LOOK.toString(), box]);
          read++;
          const tag = `${w}x${h} ${theme || 'midnight'} ${font} ${box}`;
          if (r.rows < want) fails.push(`${tag}: only ${r.rows} rows on screen`);
          r.out.slice(0, 4).forEach(x => fails.push(`${tag}: ${x}`));
          await p.evaluate(() => { aceRepOpen = false; ACECOL = null; aceColOpen = false; render(); });
        }
        await ctx.close();
      }
  chk('P · the cost estimate import’s report and mapping box: nothing cut, nothing past the box, neither the box nor the page scrolls sideways (1920 to 800, Harbor and Midnight, this font and the Segoe stand-in)',
    fails.length === 0 && read === 40, fails.length ? `${fails.length} found, e.g. ${fails.slice(0, 5).join('; ')}` : `${read} states read`);
}

// ── R. FIT TO THE PPBE POSITION: THE BOX AND THE UPL LINE ARE READ WHOLE (v2.12, item 134) ─────────────────────────────
// O left the plan tagged BES28 with O&M's position. Here the first service gets $1 of discretionary in the year on screen and the
// first requirement directs its whole value there on a Split -- an over, with its requirement list -- and a mandatory add of
// $987,654,321 on the second service nobody holds -- a nine-figure UPL, on the board's last line and in the box. At 1920, 1366,
// 1024 and 800, Harbor and Midnight, this font and the Segoe stand-in: no cell of the box cuts a figure or a label, nothing sits
// past the box, the page never scrolls sideways (a table narrower than its box scrolls inside its own frame), and the UPL line
// under the last row sits inside the list.
{
  ev(`(function(){ MS.ppbe['BES|2028'].val[SVC[0]]._all[MS.cur]={d:1, m:0}; var id=S.order[0];
      S.fsrc[id]={m:'split', dv:itemById(id).ask.slice(), mv:SVC.map(function(){ return 0; })};
      S.bm.adds=(S.bm.adds||[]).concat([{name:'Congressional add', pool:'mand', vec:SVC.map(function(_,i){ return i===1? 987654321 : 0; })}]);
      applyBudget(); baLiveAll(); save(); })(); 'ok'`);
  const fileR = join(dir, 'board-r.html'), fileRS = join(dir, 'board-r-segoe.html');
  writeFileSync(fileR, ev('buildSavedHtml()'));
  writeFileSync(fileRS, withStandin(readFileSync(fileR, 'utf8')));
  const LOOK = () => {
    const out = [], say = e => '"' + String(e.value || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) + '"';
    const de = document.documentElement; if (de.scrollWidth > de.clientWidth + 1) out.push(`the page scrolls sideways: ${de.scrollWidth}>${de.clientWidth}`);
    // the UPL line, with the box closed
    const u = document.querySelector('#list .uplline'), L = document.getElementById('list');
    if (!u) out.push('no UPL line under the last row');
    else { const ur = u.getBoundingClientRect(), lr = L.getBoundingClientRect();
      if (ur.right > lr.right + 1 || ur.left < lr.left - 1) out.push(`the UPL line runs past the list: ${Math.round(ur.left)}-${Math.round(ur.right)} in ${Math.round(lr.left)}-${Math.round(lr.right)}`);
      for (const x of u.querySelectorAll('.u')) { const r = x.getBoundingClientRect(); if (r.right > lr.right + 1) out.push('a UPL figure past the list: ' + say(x)); } }
    fitShow();
    const m = document.querySelector('#fitPanel .modal');
    if (!m || !document.getElementById('fitPanel').classList.contains('open')) return { out: out.concat(['the box is not on screen']), overs: 0, rows: 0 };
    const mr = m.getBoundingClientRect();
    if (mr.left < -1 || mr.right > innerWidth + 1) out.push(`the box runs off the window sideways: ${Math.round(mr.left)}-${Math.round(mr.right)} in ${innerWidth}`);
    if (m.scrollWidth > m.clientWidth + 1) out.push(`the box scrolls sideways: ${m.scrollWidth}>${m.clientWidth}`);
    if (de.scrollWidth > de.clientWidth + 1) out.push(`the page scrolls sideways with the box open: ${de.scrollWidth}>${de.clientWidth}`);
    for (const c of m.querySelectorAll('#fitBody td, #fitBody th')) if (c.scrollWidth > c.clientWidth + 1) out.push('cut in its cell: ' + say(c));
    for (const e of m.querySelectorAll('.fityr, .fitover, .fithint, h3 .x')) { const r = e.getBoundingClientRect();
      if (r.width && (r.right > mr.right + 1 || r.left < mr.left - 1)) out.push('past the box’s edge: ' + say(e)); }
    return { out, overs: m.querySelectorAll('#fitBody .fitover').length, rows: m.querySelectorAll('#fitBody table.fitrows tr').length };
  };
  const fails = []; let read = 0;
  for (const [font, at] of [['this machine’s font', fileR], ['the Segoe stand-in', fileRS]])
    for (const theme of ['harbor', ''])
      for (const [w, h] of [[1920, 969], [1366, 657], [1024, 700], [800, 700]]) {
        const { p, ctx } = await open(w, h, 'review', '', false, at, theme);
        if (at === fileRS) { const why = await standinProblem(p); if (why) { fails.push(`${w}x${h} ${font}: ${why}`); await ctx.close(); continue; } }
        const r = await p.evaluate(look => (0, eval)('(' + look + ')')(), LOOK.toString());
        read++;
        const tag = `${w}x${h} ${theme || 'midnight'} ${font}`;
        if (!r.overs || r.rows < 2) fails.push(`${tag}: the over and its requirement list are not on screen (${r.overs} over, ${r.rows} rows)`);
        r.out.slice(0, 4).forEach(x => fails.push(`${tag}: ${x}`));
        await ctx.close();
      }
  chk('R · Fit to the PPBE position: nothing cut, nothing past the box, the page never scrolls sideways, and the UPL line sits inside the list (1920 to 800, Harbor and Midnight, this font and the Segoe stand-in)',
    fails.length === 0 && read === 16, fails.length ? `${fails.length} found, e.g. ${fails.slice(0, 5).join('; ')}` : `${read} states read`);
}

// ── Q. A WBS PARAGRAPH IS PICKED, AND ITS NAME IS READ WHOLE (v2.12, item 132) ───────────────────────────────────────────
// A paragraph is picked from the estimate's WBS tree: a text field with a list of "code — path", the field then showing the code
// alone and its name -- its path in the estimate, top heading first -- under it. On the M board with an estimate whose deepest
// paragraph's path runs to about 160 characters (four headings, each named at length -- the names are invented: no estimate
// with names had been seen when this was written): the Add box and the edit box with that paragraph picked, and the WBS panel
// with it on one line of a split and a paragraph the estimate does not hold on the other. At 1366 x 657 and 1920 x 969, Harbor
// and Midnight, this font and the Segoe stand-in: the field reads the list, the CCaR record's paragraph first; the pick leaves
// the code in the field; the name is beside it whole (under the field; in the edit box, on its label's line) -- never cut,
// never past its box -- and each box still fits whole by M's and N's measure. The edit box shows the WBS first of its
// Accounting lines, in its widest column: under the field in the first column a long path ran that column past the box at
// 1366 x 657, and so did a section of its own in the middle column, until the Navy SI code moved to Classification and the
// name moved up to the label's line. The edit box is measured as N fills it with its per-service RCN / EEIC rows folded, as
// the box opens them. The limit, measured: in N's fullest state (those rows open too) at 1366 x 657 the name has the label's
// line and no more in the Segoe stand-in (about 85 characters), two lines in this font; a longer one makes the middle column
// scroll there.
{
  ev(`(function(){
    ACEDB.sets['2026ACE']={label:'2026ACE', ts:1700000000071, years:[MS.cur], appn:{}, skip:{},
      lines:[{ap:'om', pmo:'PSM', svc:'USAF', wbs:'P6.2.2.1E', ccar:'JSF3087', v:{}}],
      wbs:{om:{'P6':{n:'Depot Standup and Activation', lv:1, up:''},
        'P6.2':{n:'CONUS Depot Standup for the F135 Propulsion System', lv:2, up:'P6'},
        'P6.2.2E':{n:'ECU Repair Line, Tooling and Test Stands', lv:3, up:'P6.2'},
        'P6.2.2.1E':{n:'Government Depot Labor at OC-ALC', lv:4, up:'P6.2.2E'}}}};
    var id=S.order.filter(function(x){ return ptypeOf(x)!=='PRIME'; })[1];
    S.wbs=S.wbs||{}; S.wbs[id]=[{w:'P6.2.2.1E', v:SVC.map(function(){ return 1000; })}, {w:'9.9.9', v:SVC.map(function(){ return 500; })}];
    MS.wbsQ=id; save(); })(); 'ok'`);
  const fileQ = join(dir, 'board-q.html'), fileQS = join(dir, 'board-q-segoe.html');
  writeFileSync(fileQ, ev('buildSavedHtml()'));
  writeFileSync(fileQS, withStandin(readFileSync(fileQ, 'utf8')));
  const PATH = 'Depot Standup and Activation › CONUS Depot Standup for the F135 Propulsion System'
    + ' › ECU Repair Line, Tooling and Test Stands › Government Depot Labor at OC-ALC';
  const WANT = 'P6.2.2.1E — ' + PATH;
  // a field's note, read whole: its text, whether it is cut, and whether it sits inside the box
  const NOTE = (box, fid) => { const f = document.getElementById(fid), n = document.getElementById(fid + 'Note'), m = document.querySelector(box + ' .modal');
    const nr = n.getBoundingClientRect(), mr = m.getBoundingClientRect(), dl = document.getElementById(f.getAttribute('list') || '-');
    return { value: f.value, list: !!dl, first: dl && dl.options[0] ? [dl.options[0].value.split(' — ')[0], dl.options[0].getAttribute('label') || ''] : null,
      note: n.textContent, cut: n.scrollWidth > n.clientWidth + 1 || n.scrollHeight > n.clientHeight + 1,
      inside: nr.left >= mr.left - 1 && nr.right <= mr.right + 1 && nr.top >= mr.top - 1 && nr.bottom <= mr.bottom + 1 && nr.bottom <= innerHeight + 1 };
  };
  const PICK = (fid) => { const e = document.getElementById(fid); e.value = 'P6.2.2.1E — ' + wbsPick().path['P6.2.2.1E'];
    e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
  const fails = []; let read = 0;
  for (const [font, at] of [['this machine’s font', fileQ], ['the Segoe stand-in', fileQS]])
    for (const theme of ['harbor', ''])
      for (const [w, h] of [[1366, 657], [1920, 969]]) {
        const { p, ctx, errs } = await open(w, h, 'review', '', false, at, theme);
        if (at === fileQS) { const why = await standinProblem(p); if (why) { fails.push(`${w}x${h} ${font}: ${why}`); await ctx.close(); continue; } }
        const tag = `${w}x${h} ${theme || 'midnight'} ${font}`;
        // a board without the pickers throws in here: said as a finding of this state, so the run goes on and Q fails by name
        try {
        // the Add box, filled as M fills it, the paragraph then picked
        const a = await p.evaluate(([st, pick, note, look]) => { (0, eval)('(' + st + ')')(); (0, eval)('(' + pick + ')')('arWbs');
          return { n: (0, eval)('(' + note + ')')('#addPanel', 'arWbs'), bad: (0, eval)('(' + look + ')')('#addPanel .modal') }; },
          [BOX_STATES[0][1].toString(), PICK.toString(), NOTE.toString(), boxUnreadable.toString()]);
        // the edit box, filled as N fills it with its per-service RCN / EEIC rows folded as the box opens them, the paragraph then
        // picked (in N's fullest state the name has one line to itself; see above)
        const e = await p.evaluate(([st, pick, note, look]) => { if (arOn()) arHide(); (0, eval)('(' + st + ')')();
          if (rcnSvcOpen[erOpen]) erRcnSvcToggle(); (0, eval)('(' + pick + ')')('erWbs');
          return { n: (0, eval)('(' + note + ')')('#editPanel', 'erWbs'), bad: (0, eval)('(' + look + ')')('#editPanel .modal') }; },
          [ER_STATE.toString(), PICK.toString(), NOTE.toString(), boxUnreadable.toString()]);
        // the WBS panel on the split: each line's field reads the list, and its name is under it whole
        const wp = await p.evaluate(() => { if (erOn()) erClose(); toggleWbs('req', MS.wbsQ, '');
          const m = document.querySelector('#wbsPanel .modal'), mr = m.getBoundingClientRect(), tw = m.querySelector('#wbsBody > div[style*="overflow"]');
          const ins = [...m.querySelectorAll('#wbsBody table input.btn')];
          return { lists: ins.map(i => i.getAttribute('list')), cutField: ins.filter(i => i.scrollWidth > i.clientWidth + 1).map(i => i.value),
            names: [...m.querySelectorAll('.wbsnm')].map(n => { const r = n.getBoundingClientRect();
              return { t: n.textContent, cut: n.scrollWidth > n.clientWidth + 1, inside: r.left >= mr.left - 1 && r.right <= mr.right + 1 }; }),
            sideways: tw ? tw.scrollWidth > tw.clientWidth + 1 : true, off: mr.left < -1 || mr.right > innerWidth + 1 }; });
        read++;
        for (const [box, r] of [['Add box', a], ['edit box', e]]) {
          if (!(r.n.list && r.n.first && r.n.first[0] === 'P6.2.2.1E' && /suggested/.test(r.n.first[1]))) fails.push(`${tag}, ${box}: the field does not read the list with JSF3087’s paragraph first (${JSON.stringify(r.n.first)})`);
          if (r.n.value !== 'P6.2.2.1E') fails.push(`${tag}, ${box}: the pick left "${r.n.value.slice(0, 40)}…" in the field, not the code`);
          if (r.n.note !== WANT) fails.push(`${tag}, ${box}: the name under the field is not the whole path ("${r.n.note.slice(0, 60)}…")`);
          if (r.n.cut || !r.n.inside) fails.push(`${tag}, ${box}: the name is ${r.n.cut ? 'cut' : 'past the box'}`);
          r.bad.slice(0, 3).forEach(x => fails.push(`${tag}, ${box}: ${x}`));
        }
        if (JSON.stringify(wp.lists) !== JSON.stringify(['wbsDl', 'wbsDl'])) fails.push(`${tag}, WBS panel: the lines do not read the list (${JSON.stringify(wp.lists)})`);
        if (wp.cutField.length) fails.push(`${tag}, WBS panel: a line cuts its paragraph (${wp.cutField.join(', ')})`);
        if (!wp.names[0] || wp.names[0].t !== PATH) fails.push(`${tag}, WBS panel: the first line’s name is not the whole path`);
        if (!wp.names[1] || !/not a paragraph of the 2026ACE estimate for O&M — kept as stored/.test(wp.names[1].t)) fails.push(`${tag}, WBS panel: the line the estimate does not hold is not flagged`);
        wp.names.forEach((n, i) => { if (n.cut || !n.inside) fails.push(`${tag}, WBS panel: line ${i + 1}’s name is ${n.cut ? 'cut' : 'past the box'}`); });
        if (wp.sideways || wp.off) fails.push(`${tag}, WBS panel: ${wp.off ? 'the box runs off the window' : 'the table scrolls sideways'}`);
        } catch (e) { fails.push(`${tag}: the state could not be read -- ${String(e.message || e).split('\n')[0].slice(0, 120)}`); }
        if (errs.length) fails.push(`${tag}: ${errs[0]}`);
        await ctx.close();
      }
  chk('Q · a WBS paragraph picked in the Add box, the edit box and the WBS panel: the list (the CCaR record’s paragraph first), the code alone in the field, its ~160-character name beside it whole, each box still whole -- 1366x657 and 1920x969, Harbor and Midnight, this font and the Segoe stand-in',
    fails.length === 0 && read === 8, fails.length ? `${fails.length} found, e.g. ${fails.slice(0, 5).join('; ')}` : `${read} states read`);
}

await b.close();
console.log(bad ? `\n${bad} layout check(s) failed\n` : '\nThe layout holds: the posture is the scorecards, no menu item was lost, nothing is clipped, the requirements are on screen, Brief is read-only, and the modes change no data'
  + ' -- with the RECORD panel sliding over and docked\n');
process.exit(bad ? 1 : 0);
