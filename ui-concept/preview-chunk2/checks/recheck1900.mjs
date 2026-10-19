import { chromium } from '/home/user/orbit-ui/node_modules/playwright-core/index.mjs';
import { pathToFileURL } from 'node:url';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const items = Array.from({ length: 14 }, (_, i) => ({ id: 'S' + (i + 10), grp: ['AV','PSM','TSS'][i % 3], team: ['AV','PSM','TSS'][i % 3], sect: '', custom: false, title: 'Synthetic ' + i, event: 'e' + i, ccar: 'SYN-' + i, fy26: [0,0,0], ask: [9e6, 2e6, 1e6], alloc: null }));
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage();
await page.goto(pathToFileURL('/home/user/orbit-ui/prioritization-board-grid.html').href); await page.waitForTimeout(400);
await page.evaluate(items => { SVC.length = 0; ['USAF', 'ANG', 'AFRC'].forEach(s => SVC.push(s)); DATA.services = SVC; MS.cur = 2027; MS.base = 2027;
    const order = items.map(i => i.id); const st = { order, alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [], discSvc: [150e6, 30e6, 5e6], mandSvc: [9e6, 2e6, 1e6] };
    MS.years['2027'] = st; applyState(st); DATA.items.length = 0; items.forEach(i => DATA.items.push(i)); BASE_ITEMS.length = 0; DATA.items.forEach(i => { BASE_ITEMS.push(i); BASE_ASK[i.id] = i.ask.slice(); });
    S.discSvc = st.discSvc; S.mandSvc = st.mandSvc; S.order = order; S.bm = { disc: st.discSvc, mand: st.mandSvc, adds: [] }; render(); uiSetMode('compare'); render(); }, items);
const out = [];
for (const w of [1880, 1900]) for (let rep = 0; rep < 3; rep++) {
  await page.setViewportSize({ width: w, height: 900 }); await page.evaluate(() => { window.dispatchEvent(new Event('resize')); render(); drawerClose(); });
  await page.waitForTimeout(300);
  await page.evaluate(() => setCur(gridIds()[2]));
  const samples = [];
  for (const t of [100, 260, 600]) { await page.waitForTimeout(t === 100 ? 100 : t - (t === 260 ? 100 : 260)); samples.push(await page.evaluate(() => { const r = document.getElementById('inspector').getBoundingClientRect(); return Math.round(r.left) + '..' + Math.round(r.right) + '/' + innerWidth; })); }
  out.push(w + ' ' + samples.join(' '));
}
await browser.close(); console.log(out.join('\n'));
