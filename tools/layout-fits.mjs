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
//
//   node tools/layout-fits.mjs [--board FILE]
import { chromium } from 'playwright-core';
import { boot, seed } from './export-audit/boot.mjs';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

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

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const open = async (w, h, mode, density) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(([m, d]) => { try { localStorage.setItem('spmtTheme', 'harbor');
    if (m) localStorage.setItem('spmtMode', m); if (d) localStorage.setItem('spmtDensity', d); } catch (e) {} }, [mode || '', density || '']);
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + file);
  await p.waitForFunction(() => typeof render === 'function' && document.querySelectorAll('#list .row').length > 0, null, { timeout: 40000 });
  await p.waitForTimeout(250);
  return { p, ctx, errs };
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
  // The calls the Active year, Budget year, FYDP, Tools and Export menus made in v1.89, as they read.
  const OLD = {
    'Active year': ['toggleEx', 'toggleRp', "getElementById('srcFile').click()", 'toggleQpe', 'toggleDiv'],
    'Budget year': ['toggleFc', 'toggleCr', 'toggleAdd', 'toggleBm', 'convertAllToSplit', 'togglePlans', "setScen('disc')",
                    "setScen('')", 'toggleCycChg', 'toggleBl', 'togglePos', 'toggleEd', 'toggleBands', 'togglePreviewOrder', 'resetOrder'],
    'FYDP': ['toggleSp', 'toggleFydp', 'toggleCycCmp', 'toggleP2', 'toggleAce', "getElementById('aceFile').click()"],
    'Tools': ['toggleSvcPanel', 'togglePmo', 'toggleCoa', 'toggleEnt', 'toggleRcn', 'toggleSi', 'toggleRlg', 'toggleExw', 'toggleMat',
              'toggleFlow', 'themeSetIdx(0)', 'themeSetIdx(1)', 'themeSetIdx(2)', 'themeSetIdx(3)', 'themeSetIdx(4)',
              "getElementById('budFile').click()", 'toggleBudReg', "getElementById('ccarFile').click()"],
    'Export': ['togglePf', 'exportExcel', 'exportAceTieout', 'exportFydpPlan', 'exportCycCompare', 'exportCoa', 'exportPPT', 'exportCSV',
               'execSynopsis', 'exportReprog', 'exportSrc', 'crExport', 'toggleIds', 'linkOpen', 'linkSet'],
  };
  const { p, ctx } = await open(1440, 1000);
  const calls = await p.evaluate(() => {
    try { syncBtns(); } catch (e) {}
    const out = [];
    ['dd_reports', 'dd_data', 'dd_setup', 'dd_basis', 'dd_fy', 't_review', 't_rank', 't_fund', 't_compare', 't_brief'].forEach(id => {
      const el = document.getElementById(id); if (!el) return;
      el.querySelectorAll('[onclick]').forEach(e => out.push(e.getAttribute('onclick')));
    });
    return out.join('\n');
  });
  for (const [menu, list] of Object.entries(OLD)) {
    const missing = list.filter(c => calls.indexOf(c) < 0);
    chk(`B · everything ${menu} held is still on a menu or a mode's tools`, missing.length === 0, missing.length ? 'missing: ' + missing.join(', ') : list.length + ' items');
  }
  await ctx.close();
}

// ── C. NO ROW CONTROL IS CLIPPED, AT ANY WIDTH ────────────────────────────────────────────────────────
for (const mode of ['review', 'rank', 'fund']) {
  const fails = [];
  for (const w of [1920, 1745, 1680, 1600, 1536, 1440, 1401, 1366, 1280, 1152, 1024]) {
    const { p, ctx } = await open(w, 900, mode);
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
    await ctx.close();
  }
  chk(`C · ${mode}: every row control inside the grid at 1024-1920px`, fails.length === 0, fails.slice(0, 3).join('; '));
}

// ── D. THE FIRST REQUIREMENT IS ON THE SCREEN WHEN THE BOARD OPENS ────────────────────────────────────
for (const [w, h] of [[1920, 1080], [1440, 1000], [1366, 768], [1024, 768]]) {
  const { p, ctx } = await open(w, h);
  const r = await p.evaluate(() => { const rows = [...document.querySelectorAll('#list .row')];
    const b = rows[0].getBoundingClientRect();
    return { top: Math.round(b.top), bottom: Math.round(b.bottom), inView: rows.filter(x => { const c = x.getBoundingClientRect(); return c.top >= 0 && c.bottom <= innerHeight; }).length }; });
  chk(`D · ${w}×${h}: the first requirement is on screen as it opens`, r.bottom <= h && r.top < 320, `top ${r.top}px · ${r.inView} rows in view`);
  await ctx.close();
}

// ── E. BRIEF IS READ-ONLY ─────────────────────────────────────────────────────────────────────────────
{
  const { p, ctx } = await open(1440, 900, 'brief');
  const r = await p.evaluate(() => ({
    controls: document.querySelectorAll('#list .row input, #list .row select, #list .row button, #list .row [onchange], #list .row [onmousedown], #list .row [onclick]').length,
    drag: document.querySelectorAll('#list .row[draggable]').length,
    panel: getComputedStyle(document.getElementById('inspector')).display }));
  chk('E · Brief draws no control on any row', r.controls === 0 && r.drag === 0, `${r.controls} control(s), ${r.drag} draggable row(s)`);
  chk('E · and no RECORD panel', r.panel === 'none', r.panel);
  await ctx.close();
}

// ── F. FUND'S COLUMNS ARE THE RECORD PANEL'S FIGURES ──────────────────────────────────────────────────
{
  const { p, ctx } = await open(1440, 1000, 'fund');
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
  chk(`F · every row's Discretionary, Mandatory and Unfunded are the RECORD panel's (${r.n} rows)`, r.out.length === 0, r.out.slice(0, 2).join('; '));
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

await b.close();
console.log(bad ? `\n${bad} layout check(s) failed\n` : '\nThe layout holds: the posture is the scorecards, no menu item was lost, nothing is clipped, the requirements are on screen, Brief is read-only, and the modes change no data\n');
process.exit(bad ? 1 : 0);
