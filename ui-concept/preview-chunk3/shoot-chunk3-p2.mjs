// shoot-chunk3-p2.mjs <board.html> <outDir> -- chunk 3 part 2 (S1-S5): screenshots of the ACTUAL board with SYNTHETIC data
// seeded at run time only (chunk 2's seed, preview-chunk2/shoot-chunk2.mjs). Every setting is made as a person makes it:
// the sidebar's own ‹ button, View › Record panel › Docked beside the table, a click on a row, Esc, the toolbar's buttons.
// Each shot also records what it measured (shots.json): the rows, the RECORD panel's money inputs, the posture strip's
// controls, an open menu's items, the controls at the top, the keyboard's place.
import { chromium } from '/home/user/orbit-ui/node_modules/playwright-core/index.mjs';
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
const [board, out] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errs = [];
async function open(w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('dialog', d => d.dismiss().catch(() => {}));
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(board).href);
  await page.waitForTimeout(600);
  const PM = ['PSM', 'ATL', 'TSS', 'AV', 'MxS', 'LOG'];
  const NAMES = ['Depot pod overhaul', 'Engine spares pool', 'Training system refresh', 'Avionics software drop', 'Maintenance data link',
    'Logistics IT sustainment', 'Support equipment buy', 'Simulator concurrency', 'Field service reps', 'Repair network stand-up',
    'Tech data update', 'Obsolescence redesign', 'Test equipment recal', 'Packaging & shipping'];
  const items = NAMES.map((n, i) => ({ id: 'S' + String(i + 1).padStart(2, '0'), grp: PM[i % PM.length], team: PM[i % PM.length], sect: '', custom: false,
    title: 'Synthetic — ' + n, event: n, ccar: 'SYN-' + (100 + i), fy26: [0, 0, 0],
    ask: [ (9 + (i * 7) % 23) * 1e6, (2 + (i * 3) % 7) * 1e6, (1 + (i * 5) % 4) * 1e6 ], alloc: null }));
  await page.evaluate(({ items }) => {
    SVC.length = 0; ['USAF', 'ANG', 'AFRC'].forEach(s => SVC.push(s)); DATA.services = SVC;
    MS.cur = 2027; MS.base = 2027;
    const order = items.map(i => i.id);
    const st = { order, alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [], discSvc: [180e6, 40e6, 22e6], mandSvc: [25e6, 6e6, 3e6] };
    MS.years['2027'] = st; applyState(st);
    DATA.items.length = 0; items.forEach(i => DATA.items.push(i));
    BASE_ITEMS.length = 0; DATA.items.forEach(i => { BASE_ITEMS.push(i); BASE_ASK[i.id] = i.ask.slice(); });
    S.discSvc = st.discSvc; S.mandSvc = st.mandSvc; S.order = order; S.fsrc = {}; S.mc = {}; S.alloc = {};
    S.bm = { disc: st.discSvc, mand: st.mandSvc, adds: [] };
    try { localStorage.setItem('prio27who', 'Synthetic user'); } catch (e) {}
    render();
  }, { items });
  await page.evaluate(() => { try { uiSetMode('review'); } catch (e) {} render(); window.scrollTo(0, 0); });
  await page.waitForTimeout(400);
  return page;
}
// what a shot shows, measured
const measure = page => page.evaluate(() => {
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
  const hit = e => { const c = e.getBoundingClientRect(), t = document.elementFromPoint(c.left + Math.min(c.width / 2, 20), c.top + c.height / 2); return !!t && (t === e || e.contains(t)); };
  const lbl = e => (e.id ? '#' + e.id : (e.textContent || e.tagName).replace(/\s+/g, ' ').trim().slice(0, 30));
  const rows = [...document.querySelectorAll('#list .row')].filter(vis);
  const ins = document.getElementById('inspector'), IR = ins.getBoundingClientRect();
  const shown = getComputedStyle(ins).display !== 'none' && (ins.classList.contains('open') || getComputedStyle(ins).position !== 'fixed');
  const money = shown ? [...ins.querySelectorAll('input')].filter(e => vis(e) && /\d/.test(e.value || '')) : [];
  const post = document.getElementById('posture');
  const strip = post && getComputedStyle(post).display !== 'none'
    ? [...post.querySelectorAll('button, select, input')].filter(vis).map(e => ({ c: lbl(e), onScreen: e.getBoundingClientRect().right <= innerWidth + 0.5, clickable: hit(e) })) : null;
  const dd = document.querySelector('.menu.open > .mdd'), side = document.getElementById('uiSide');
  const menu = dd ? { left: Math.round(dd.getBoundingClientRect().left), sidebarEdge: Math.round(side.getBoundingClientRect().right),
    items: [...dd.querySelectorAll('.mi, button, input')].filter(e => e.offsetParent !== null).map(e => { e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); return hit(e); }) } : null;
  const top = [...document.querySelectorAll('#topStack button, #topStack input, #topStack select, #uiPage button, #uiPage input, #uiPage select')]
    .filter(e => e.type !== 'file' && !e.closest('.mdd, .uiPop') && vis(e));
  return { w: innerWidth, cls: document.documentElement.className, mode: uiMode,
    rowsOver: rows.filter(r => r.scrollWidth > r.clientWidth).length, pageSideways: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    panel: shown ? (getComputedStyle(ins).position === 'fixed' ? 'slide-over' : 'docked') : 'closed', panelInWindow: shown ? (IR.left >= -1 && IR.right <= innerWidth + 1) : null,
    moneyInputs: money.length, moneyInputsClipped: money.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.value),
    strip, stripLines: post && getComputedStyle(post).display !== 'none' ? Math.round(post.getBoundingClientRect().height) : null,
    menu: menu ? { left: menu.left, sidebarEdge: menu.sidebarEdge, items: menu.items.length, clickable: menu.items.filter(Boolean).length } : null,
    topControls: top.length, topClickable: top.filter(e => { const c = e.getBoundingClientRect(); return c.right <= innerWidth + 0.5 && hit(e); }).length,
    hdrHeight: Math.round(document.querySelector('.hdr').getBoundingClientRect().height),
    keyboardOn: document.activeElement && (document.activeElement.id || document.activeElement.tagName),
    importOpen: document.getElementById('uiImpPanel').classList.contains('open'),
    ls: Object.keys(localStorage).filter(k => /^prio27ui/.test(k)).sort().map(k => k + '=' + localStorage.getItem(k)) };
});
const shots = {};
const shot = async (page, name) => { await page.waitForTimeout(350); shots[name] = await measure(page); await page.screenshot({ path: `${out}/${name}.png` }); };
const railBtn = async (p, want) => { const is = await p.evaluate(() => document.documentElement.classList.contains('ui-rail') && !document.documentElement.classList.contains('ui-narrow')); if (is !== want) { await p.click('#uiCollapse'); await p.waitForTimeout(150); } };
const dockBtn = async (p, on) => { await p.click('#uiDensBtn'); await p.waitForTimeout(80);
  await p.click(`#uiDensPop button.o:has-text("${on ? 'Docked beside the table' : 'Slides over the table'}")`); await p.waitForTimeout(150); };
const pickRow = async p => {
  if (await p.evaluate(() => document.documentElement.classList.contains('ui-peek'))) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); }   // the sidebar over the page closes first
  const id = await p.evaluate(() => gridIds()[2]); await p.click('#row-' + id + ' .t1'); await p.waitForTimeout(450); };
const mode = async (p, nav) => { await p.click('#uiNav_' + nav); await p.waitForTimeout(300); await p.evaluate(() => window.scrollTo(0, 0)); };

// THE WIDTH MATRIX: 1000, 1050, 1440 and a narrow 760 -- sidebar open / collapsed, record drawer closed / open (opened by a
// click on a row, closed with Esc). At 760 "open" is the sidebar laid over the page by its ‹ button; the click on a row
// closes it, as any click outside it does.
for (const w of [1000, 1050, 1440, 760]) {
  for (const sb of ['sidebar-open', 'sidebar-collapsed']) {
    const p = await open(w, 860);
    if (w > 900) await railBtn(p, sb === 'sidebar-collapsed');
    else if (sb === 'sidebar-open') { await p.click('#uiCollapse'); await p.waitForTimeout(150); }
    await shot(p, `m-${w}-${sb}-drawer-closed`);
    await pickRow(p);
    await shot(p, `m-${w}-${sb}-drawer-open`);
    await p.context().close();
  }
}
// DOCKED AT 1440: View › Record panel › Docked beside the table, then a row picked; sidebar open and collapsed
for (const sb of ['sidebar-open', 'sidebar-collapsed']) {
  const p = await open(1440, 860);
  await railBtn(p, sb === 'sidebar-collapsed'); await dockBtn(p, true); await pickRow(p);
  await shot(p, `d-1440-docked-${sb}`);
  await p.context().close();
}
// S1: THE POSTURE STRIP AT 1440, in Funding and Brief: sidebar open, as the rail, docked
for (const [nav, tag] of [['fund', 'f'], ['brief', 'b']]) for (const [cfg, rail, dock] of [['sidebar-open', false, false], ['rail', true, false], ['docked', false, true]]) {
  const p = await open(1440, 860);
  await railBtn(p, rail); if (dock) await dockBtn(p, true); await mode(p, nav);
  await shot(p, `${tag}-1440-${nav === 'fund' ? 'funding' : 'brief'}-posture-strip-${cfg}`);
  await p.context().close();
}
// S5: REPORTS & EXPORTS AT 760 AND 1000, each long group unfolded from its heading: sidebar open and as the rail
for (const w of [760, 1000]) for (const [cfg, rail] of [['sidebar-open', false], ['rail', true]]) for (const g of ['fydp', 'ccar']) {
  const p = await open(w, 860);
  if (w > 900) await railBtn(p, rail); else if (!rail) { await p.click('#uiCollapse'); await p.waitForTimeout(150); }
  await p.click('#b_reports'); await p.waitForTimeout(150);
  await p.click(`#dd_reports .gh[data-g="${g}"]`); await p.waitForTimeout(200);
  await p.evaluate(() => { const dd = document.querySelector('.menu.open > .mdd'); if (dd) dd.scrollTop = 0; });
  await shot(p, `r-${w}-${cfg}-reports-${g === 'fydp' ? 'five-years-ppbe' : 'ccar-accounting'}-unfolded`);
  await p.context().close();
}
// S4: THE IMPORT BOX, opened from the toolbar's Import; then closed with Esc -- the keyboard back on Import (its focus ring)
{
  const p = await open(1440, 860);
  await p.focus('#uiImpBtn'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  await shot(p, 'i-1440-import-box-open');
  await p.click('#uiImpC_pmo'); await p.waitForTimeout(150);
  await shot(p, 'i-1440-import-box-pmo-import');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await shot(p, 'i-1440-import-box-closed-keyboard-back-on-import');
  await p.context().close();
}
// S4: THE TOP OF THE BOARD AT 1152, where the context bar wraps beside the sidebar: every control on screen and clickable
for (const nav of ['req', 'fund']) {
  const p = await open(1152, 860);
  if (nav === 'fund') await mode(p, 'fund');
  await shot(p, `t-1152-${nav === 'req' ? 'review' : 'funding'}-context-bar-wraps-every-control-usable`);
  await p.context().close();
}
await browser.close();
writeFileSync(`${out}/shots.json`, JSON.stringify({ board, shots, errors: errs }, null, 1));
console.log(JSON.stringify({ shots: Object.keys(shots).length, errors: errs }));
