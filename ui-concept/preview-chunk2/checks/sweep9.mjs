// Nine-digit money: layout-fits J's own "cut in its cell" and "past the row" tests, base vs new, every width it lists
import { chromium } from '/home/user/orbit-ui/node_modules/playwright-core/index.mjs';
import { pathToFileURL } from 'node:url';
const SP1 = '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk1';
const BOARDS = { base: SP1 + '/rv-base.html', neu: process.argv[2] || '/home/user/orbit-ui/prioritization-board-grid.html' };
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const items = Array.from({ length: 6 }, (_, i) => ({ id: 'R0' + (i + 1), grp: ['AV','PSM','TSS'][i % 3], team: ['AV','PSM','TSS'][i % 3], sect: '', custom: false, title: 'Synthetic nine-digit ' + i, event: 'e' + i, ccar: 'SYN-' + i, fy26: [0,0,0],
  ask: i === 0 ? [100000000, 20000000, 3456789] : [(9 + i) * 1e6, 2e6, 1e6], alloc: null }));
async function open(file) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage();
  page.on('dialog', d => d.dismiss().catch(() => {}));
  await page.goto(pathToFileURL(file).href); await page.waitForTimeout(400);
  await page.evaluate(items => { SVC.length = 0; ['USAF', 'ANG', 'AFRC'].forEach(s => SVC.push(s)); DATA.services = SVC; MS.cur = 2027; MS.base = 2027;
    const order = items.map(i => i.id); const st = { order, alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [], discSvc: [150e6, 30e6, 5e6], mandSvc: [9e6, 2e6, 1e6] };
    MS.years['2027'] = st; applyState(st); DATA.items.length = 0; items.forEach(i => DATA.items.push(i)); BASE_ITEMS.length = 0; DATA.items.forEach(i => { BASE_ITEMS.push(i); BASE_ASK[i.id] = i.ask.slice(); });
    S.discSvc = st.discSvc; S.mandSvc = st.mandSvc; S.order = order; S.bm = { disc: st.discSvc, mand: st.mandSvc, adds: [] }; render(); }, items);
  return page;
}
const M = () => { const out = [];
  for (const row of document.querySelectorAll('#list .row')) { const rr = row.getBoundingClientRect();
    for (const c of row.querySelectorAll(':scope > *, button, input, select')) { const b = c.getBoundingClientRect(); if (!b.width || !b.height) continue; if (b.right > rr.right + 1 || b.left < rr.left - 1) { out.push('past'); break; } }
    for (const c of row.querySelectorAll('.num, .amt, .acts.alloc input')) { if (!c.getBoundingClientRect().width) continue; if (c.scrollWidth > c.clientWidth + 1) { out.push('cut:' + c.className.split(' ')[0]); break; } } }
  if (document.documentElement.scrollWidth > innerWidth) out.push('page');
  return [...new Set(out)].join(','); };
const widths = []; for (let w = 700; w <= 1900; w += (w < 1200 ? 3 : 10)) widths.push(w);
const res = {};
for (const [lbl, file, cfg] of [['base', BOARDS.base, null], ['open', BOARDS.neu, { rail: false }], ['rail', BOARDS.neu, { rail: true }], ['dock', BOARDS.neu, { rail: false, dock: true }]]) {
  const p = await open(file);
  if (cfg) await p.evaluate(c => { UI2.rail = c.rail; UI2.dock = !!c.dock; uiRailApply(); uiSync(); uiCols(); }, cfg);
  for (const m of ['review', 'rank', 'fund', 'compare', 'brief']) {
    await p.evaluate(m => { uiSetMode(m); render(); }, m);
    const bad = [];
    for (const w of widths) { await p.setViewportSize({ width: w, height: 800 }); await p.evaluate(() => { window.dispatchEvent(new Event('resize')); render(); }); await p.waitForTimeout(40);
      const r = await p.evaluate(M); if (r) bad.push(w + ':' + r); }
    // compress to ranges
    const rng = []; let a = null, prev = null, k = null;
    for (const b of bad) { const [w, r] = [+b.split(':')[0], b.slice(b.indexOf(':') + 1)];
      if (a !== null && r === k && w - prev <= 10) { prev = w; continue; }
      if (a !== null) rng.push(a + '-' + prev + ' ' + k); a = w; prev = w; k = r; }
    if (a !== null) rng.push(a + '-' + prev + ' ' + k);
    res[lbl + ' ' + m] = rng;
  }
  await p.context().close();
}
await browser.close();
for (const [k, v] of Object.entries(res)) console.log(k.padEnd(14), v.join(' | ') || '-');
