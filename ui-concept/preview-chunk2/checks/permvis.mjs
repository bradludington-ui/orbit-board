// Chromium: is Add requirement / the PMO Import card VISIBLE in each mode, on the working board, under a locked cycle,
// and in a PMO copy -- beside what the board's own surfaces offer (#toolAdd, File ▾ Program offices)
import { chromium } from '/home/user/orbit-ui/node_modules/playwright-core/index.mjs';
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
const SP = '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk2';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errs = [];
async function open(file) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage();
  page.on('dialog', d => d.accept().catch(() => {})); page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(file).href); await page.waitForTimeout(500);
  await page.evaluate(() => { SVC.length = 0; ['USAF', 'ANG', 'AFRC'].forEach(s => SVC.push(s)); DATA.services = SVC; MS.cur = 2027; MS.base = 2027;
    const items = [0,1,2].map(i => ({ id: 'S0' + (i+1), grp: ['AV','PSM','TSS'][i], team: ['AV','PSM','TSS'][i], sect: '', custom: false, title: 'Synthetic ' + i, event: 'e' + i, ccar: 'SYN-' + i, fy26: [0,0,0], ask: [5e6, 1e6, 1e6], alloc: null }));
    const order = items.map(i => i.id); const st = { order, alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [], discSvc: [10e6, 2e6, 2e6], mandSvc: [1e6, 1e6, 1e6] };
    MS.years['2027'] = st; applyState(st); DATA.items.length = 0; items.forEach(i => DATA.items.push(i)); BASE_ITEMS.length = 0; DATA.items.forEach(i => { BASE_ITEMS.push(i); BASE_ASK[i.id] = i.ask.slice(); });
    S.discSvc = st.discSvc; S.mandSvc = st.mandSvc; S.order = order; S.bm = { disc: st.discSvc, mand: st.mandSvc, adds: [] }; render(); });
  return page;
}
const look = page => page.evaluate(() => { const vis = e => !!e && e.offsetParent !== null && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden';
  uiImpOpen(); const pmoCard = vis(document.getElementById('uiImpC_pmo')); uiImpClose();
  toggleMenu('share'); const offices = document.getElementById('dd_share').innerHTML.indexOf('Program offices') >= 0; toggleMenu('share');
  return { uiAdd: vis(document.getElementById('uiAddBtn')), baseToolAdd: vis(document.getElementById('toolAdd')) || document.getElementById('dd_modetools').innerHTML.indexOf('toggleAdd') >= 0,
    uiImport: vis(document.getElementById('uiImpBtn')), pmoCard, fileMenuOffices: offices }; });
const res = {};
const p = await open('/home/user/orbit-ui/prioritization-board-grid.html');
for (const m of ['review','rank','fund','compare','brief']) { await p.evaluate(m => { uiSetMode(m); render(); }, m); res['working ' + m] = await look(p); }
await p.evaluate(() => { window.confirm = () => true; window.prompt = () => ''; blCyc = 'PB'; blYr = MS.cur; cycLock(); uiCycGo(uiCycKeys()[0]); });
for (const m of ['review','fund','brief']) { await p.evaluate(m => { uiSetMode(m); render(); }, m); res['locked cycle ' + m] = await look(p); }
await p.evaluate(() => uiCycGo(''));
const copy = await p.evaluate(() => pmoCopyHtml({ sandbox: true, by: 'T', ts: 1790000000000, fy: MS.cur, ap: APPN, base: pmoBaseline(), pv: PMO_PV, ord: {} }));
writeFileSync(SP + '/pmo-copy.html', copy);
const c = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const cp = await c.newPage(); cp.on('pageerror', e => errs.push(String(e)));
await cp.goto(pathToFileURL(SP + '/pmo-copy.html').href); await cp.waitForTimeout(600);
for (const m of ['review','fund','brief']) { await cp.evaluate(m => { uiSetMode(m); render(); }, m); res['PMO copy ' + m] = await look(cp); }
await cp.evaluate(() => { uiSetMode('review'); render(); uiImpOpen(); }); await cp.waitForTimeout(300);
await cp.screenshot({ path: SP + '/pmo-copy-import-box.png' });
await browser.close();
console.log(JSON.stringify({ res, errs }, null, 1));
