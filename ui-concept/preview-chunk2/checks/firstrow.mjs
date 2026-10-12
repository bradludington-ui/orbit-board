import { chromium } from '/home/user/orbit-ui/node_modules/playwright-core/index.mjs';
import { pathToFileURL } from 'node:url';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const items = Array.from({ length: 14 }, (_, i) => ({ id: 'S' + (i + 10), grp: ['AV','PSM','TSS'][i % 3], team: ['AV','PSM','TSS'][i % 3], sect: '', custom: false, title: 'Synthetic ' + i, event: 'e' + i, ccar: 'SYN-' + i, fy26: [0,0,0], ask: [9e6, 2e6, 1e6], alloc: null }));
const out = {};
for (const [lbl, f] of [['base', process.argv[2]], ['chunk1', process.argv[3]], ['chunk2', process.argv[4]]]) for (const [w, h] of [[1920, 1080], [1440, 1000], [1366, 768], [1024, 768]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } }); const page = await ctx.newPage();
  await page.goto(pathToFileURL(f).href); await page.waitForTimeout(400);
  const r = await page.evaluate(items => { SVC.length = 0; ['USAF', 'ANG', 'AFRC'].forEach(s => SVC.push(s)); DATA.services = SVC; MS.cur = 2027; MS.base = 2027;
    const order = items.map(i => i.id); const st = { order, alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [], discSvc: [150e6, 30e6, 5e6], mandSvc: [9e6, 2e6, 1e6] };
    MS.years['2027'] = st; applyState(st); DATA.items.length = 0; items.forEach(i => DATA.items.push(i)); BASE_ITEMS.length = 0; DATA.items.forEach(i => { BASE_ITEMS.push(i); BASE_ASK[i.id] = i.ask.slice(); });
    S.discSvc = st.discSvc; S.mandSvc = st.mandSvc; S.order = order; S.bm = { disc: st.discSvc, mand: st.mandSvc, adds: [] }; render(); window.scrollTo(0, 0);
    return Math.round(document.querySelector('#list .row').getBoundingClientRect().top); }, items);
  out[lbl + ' ' + w + 'x' + h] = r; await ctx.close();
}
await browser.close(); console.log(JSON.stringify(out));
