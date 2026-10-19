// shoot.mjs <board.html> <outDir> -- screenshots of the ACTUAL board with SYNTHETIC data seeded at runtime only.
import { chromium } from '/home/user/orbit-board/node_modules/playwright-core/index.mjs';
import { pathToFileURL } from 'node:url';
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
  // ── synthetic board: the SAME seed as uimock/mock.mjs ──
  const PM = ['PSM', 'ATL', 'TSS', 'AV', 'MxS', 'LOG'];
  const NAMES = ['Depot pod overhaul', 'Engine spares pool', 'Training system refresh', 'Avionics software drop', 'Maintenance data link',
    'Logistics IT sustainment', 'Support equipment buy', 'Simulator concurrency', 'Field service reps', 'Repair network stand-up',
    'Tech data update', 'Obsolescence redesign', 'Test equipment recal', 'Packaging & shipping'];
  const items = NAMES.map((n, i) => ({ id: 'S' + String(i + 1).padStart(2, '0'), grp: PM[i % PM.length], team: PM[i % PM.length], sect: '', custom: false,
    title: 'Synthetic — ' + n, event: n, ccar: 'SYN-' + (100 + i), fy26: [0, 0, 0],
    ask: [ (9 + (i * 7) % 23) * 1e6, (2 + (i * 3) % 7) * 1e6, (1 + (i * 5) % 4) * 1e6 ], alloc: null }));
  await page.evaluate(({ items }) => {
    SVC.length = 0; ['USAF', 'ANG', 'AFRC'].forEach(s => SVC.push(s)); DATA.services = SVC;
    if (typeof MS === 'undefined' || !MS) { MS = { base: 2027, cur: 2027, ts: 0, years: {} }; }
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
const shot = async (page, name) => { await page.waitForTimeout(300); await page.screenshot({ path: `${out}/${name}.png` }); };
const kpis = page => page.evaluate(() => [...document.querySelectorAll('#uiKpis .k .v')].map(e => e.textContent));
const sel = (page, n) => page.evaluate(n => { const ids = gridIds(); curRow = ids[n]; gridMark(); inspectorBody();
  try { drawerOpen(); } catch (e) {} const r = document.getElementById('row-' + curRow); if (r) r.scrollIntoView({ block: 'nearest' }); window.scrollTo(0, 0); }, n);

let p = await open(1440, 900);
const k = await kpis(p);
await sel(p, 2);
await shot(p, '1-sidebar-requirements-record');
await p.evaluate(() => uiRailToggle());
await shot(p, '2-sidebar-rail');
await p.hover('#uiNav_fund'); await shot(p, '2b-rail-tooltip');
await p.evaluate(() => uiRailToggle());
await p.evaluate(() => { uiImpOpen(); uiImpPick('pmo'); });
await shot(p, '3-import-pmo');
await p.evaluate(() => uiImpClose());
await p.evaluate(() => { uiColSet('band', true); uiColSet('cum', true); uiSetDensity('compact'); });
await p.click('#uiColsBtn');
await shot(p, '4-columns-density');
await p.evaluate(() => { uiColSet('band', false); uiColSet('cum', false); uiSetDensity('comfortable'); uiPopsClose(); });
await p.click('#uiNav_hist'); await shot(p, '6-history-flyout');
await p.context().close();

p = await open(1280, 800);
await sel(p, 2);
await shot(p, '5-drawer-1280');
await p.evaluate(() => uiDTab('funding'));
await shot(p, '5b-drawer-1280-funding-tab');
await p.context().close();
await browser.close();
console.log(JSON.stringify({ kpis: k, errs }));
