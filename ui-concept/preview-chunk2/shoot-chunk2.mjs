// shoot-chunk2.mjs <board.html> <outDir> -- screenshots of the ACTUAL board with SYNTHETIC data seeded at runtime only
// (the same seed as preview-chunk1/shoot-chunk1.mjs). Each shot also records what it measured: the row's overflow, cells
// past the row's edge, the RECORD panel's money inputs that clip, the panel past the window edge, sideways page scroll.
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
const measure = page => page.evaluate(() => {
  const row = document.querySelector('#list .row'); const R = row ? row.getBoundingClientRect() : null;
  const out = row ? [...row.children].filter(c => c.offsetParent !== null).filter(c => c.getBoundingClientRect().right > R.right + 1).map(c => c.className.split(' ')[0]) : [];
  const ins = document.getElementById('inspector'); const IR = ins.getBoundingClientRect();
  const shown = getComputedStyle(ins).display !== 'none' && (ins.classList.contains('open') || getComputedStyle(ins).position !== 'fixed');
  const money = shown ? [...ins.querySelectorAll('input')].filter(e => e.offsetParent !== null && /\d/.test(e.value || '')) : [];
  const vis = id => { const e = document.getElementById(id); return !!e && e.offsetParent !== null && getComputedStyle(e).display !== 'none'; };
  return { w: innerWidth, cls: document.documentElement.className, rowOver: row ? Math.round(row.scrollWidth - row.clientWidth) : null, cellsOut: out,
    panel: shown ? (getComputedStyle(ins).position === 'fixed' ? 'slide-over' : 'docked') : 'closed',
    panelInWindow: shown ? (IR.left >= -1 && IR.right <= innerWidth + 1) : null,
    moneyInputs: money.length, moneyInputsClipped: money.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.value),
    pageSideways: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    addVisible: vis('uiAddBtn'), importVisible: vis('uiImpBtn'),
    kpis: [...document.querySelectorAll('#uiKpis .k .v')].map(e => e.textContent) };
});
const shots = {};
const shot = async (page, name) => { await page.waitForTimeout(350); await page.screenshot({ path: `${out}/${name}.png` }); shots[name] = await measure(page); };
const pick = (page, n) => page.evaluate(n => { const ids = gridIds(); setCur(ids[n]); window.scrollTo(0, 0); }, n);
const setUi = (page, c) => page.evaluate(c => { UI2.rail = !!c.rail; UI2.dock = !!c.dock; UI2.peek = !!c.peek; uiRailApply(); uiSync(); uiCols(); try { drawerClose(); } catch (e) {} try { fitTop(); syncSticky(); } catch (e) {} }, c);

// THE WIDTH MATRIX: 1000, 1050, 1440 and a narrow 760 -- sidebar open / collapsed, record drawer closed / open
for (const w of [1000, 1050, 1440, 760]) {
  const p = await open(w, 860);
  for (const [sb, cfg] of [['sidebar-open', w <= 900 ? { peek: true } : { rail: false }], ['sidebar-collapsed', { rail: true }]]) {
    await setUi(p, cfg);
    await shot(p, `m-${w}-${sb}-drawer-closed`);
    if (w <= 900 && cfg.peek) await setUi(p, { peek: false });   // at 900px and narrower the sidebar lies over the page: picking a row closes it
    await pick(p, 2);
    await shot(p, `m-${w}-${sb}-drawer-open`);
  }
  await p.context().close();
}
// THE DOCKED SETTING at 1440 (the person's choice in View): sidebar open and collapsed
{ const p = await open(1440, 860);
  for (const [sb, rail] of [['sidebar-open', false], ['sidebar-collapsed', true]]) {
    await setUi(p, { rail, dock: true }); await pick(p, 2); await shot(p, `d-1440-docked-${sb}`); }
  await p.evaluate(() => uiDockSet(false)); await setUi(p, { rail: false });
  await p.click('#uiDensBtn'); await shot(p, 'v-1440-view-menu-record-panel-choice');
  await p.context().close(); }
// BRIEF with the funding posture strip
{ const p = await open(1440, 900); await p.evaluate(() => { uiSetMode('brief'); render(); window.scrollTo(0, 0); }); await shot(p, 'b-1440-brief-posture-strip'); await p.context().close(); }
// THE FORCED CARD ERROR (probe only: the page's uiKpiCard is replaced in this browser to throw; nothing shipped)
{ const p = await open(1440, 900);
  await p.evaluate(() => { uiKpiCard = function () { throw new Error('forced card failure (screenshot probe)'); }; render(); });
  await shot(p, 'e-1440-forced-card-error-unavailable');
  await p.evaluate(() => { const ids = gridIds(); setCur(ids[2]); });
  await shot(p, 'e-1440-forced-card-error-board-still-works');
  await p.context().close(); }
// THE CYCLE CONTROL open (a cycle is locked in this browser, at run time, so there is one to view)
{ const p = await open(1440, 900);
  await p.evaluate(() => { window.confirm = () => true; window.prompt = () => ''; blCyc = 'PB'; blYr = MS.cur; cycLock(); render(); });
  await p.click('#uiCycBtn'); await shot(p, 'c-1440-cycle-control-open');
  await p.evaluate(k => uiCycGo(k), await p.evaluate(() => uiCycKeys()[0]));
  await p.waitForTimeout(200); await shot(p, 'c-1440-viewing-locked-cycle-read-only');
  await p.context().close(); }
// THE IMPORT BOX: PMO Import, All submissions at once; and Fund (no Add requirement)
{ const p = await open(1440, 900);
  await p.evaluate(() => { uiImpOpen(); uiImpPick('pmo'); UI2.pmoHow = 'all'; uiImpDraw(); });
  await shot(p, 'i-1440-import-box-pmo-all');
  await p.evaluate(() => { uiImpClose(); uiSetMode('fund'); render(); window.scrollTo(0, 0); });
  await shot(p, 'f-1440-fund-no-add-button');
  await p.context().close(); }
await browser.close();
writeFileSync(`${out}/shots.json`, JSON.stringify({ shots, errs }, null, 1));
console.log(JSON.stringify({ n: Object.keys(shots).length, errs }));
