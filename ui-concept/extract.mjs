// extract.mjs <board.html> <out.json> -- the REAL board's own figures for the synthetic seed used by mock.mjs (read only).
import { chromium } from '/home/user/orbit-board/node_modules/playwright-core/index.mjs';
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync } from 'node:fs';
const [board, out] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
page.on('dialog', d => d.dismiss().catch(() => {}));
await page.goto(pathToFileURL(board).href); await page.waitForTimeout(500);
const src = readFileSync(new URL('./mock.mjs', import.meta.url), 'utf8');
const PM = ['PSM', 'ATL', 'TSS', 'AV', 'MxS', 'LOG'];
const NAMES = ['Depot pod overhaul', 'Engine spares pool', 'Training system refresh', 'Avionics software drop', 'Maintenance data link',
  'Logistics IT sustainment', 'Support equipment buy', 'Simulator concurrency', 'Field service reps', 'Repair network stand-up',
  'Tech data update', 'Obsolescence redesign', 'Test equipment recal', 'Packaging & shipping'];
const items = NAMES.map((n, i) => ({ id: 'S' + String(i + 1).padStart(2, '0'), grp: PM[i % PM.length], team: PM[i % PM.length], sect: '', custom: false,
  title: 'Synthetic — ' + n, event: n, ccar: 'SYN-' + (100 + i), fy26: [0, 0, 0],
  ask: [ (9 + (i * 7) % 23) * 1e6, (2 + (i * 3) % 7) * 1e6, (1 + (i * 5) % 4) * 1e6 ], alloc: null }));
const r = await page.evaluate(({ items }) => {
  SVC.length = 0; ['USAF', 'ANG', 'AFRC'].forEach(s => SVC.push(s)); DATA.services = SVC;
  MS.cur = 2027; MS.base = 2027;
  const order = items.map(i => i.id);
  const st = { order, alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [], discSvc: [180e6, 40e6, 22e6], mandSvc: [25e6, 6e6, 3e6] };
  MS.years['2027'] = st; applyState(st);
  DATA.items.length = 0; items.forEach(i => DATA.items.push(i));
  BASE_ITEMS.length = 0; DATA.items.forEach(i => { BASE_ITEMS.push(i); BASE_ASK[i.id] = i.ask.slice(); });
  S.discSvc = st.discSvc; S.mandSvc = st.mandSvc; S.order = order; S.fsrc = {}; S.mc = {}; S.alloc = {};
  S.bm = { disc: st.discSvc, mand: st.mandSvc, adds: [] };
  render();
  const T = tiers(); const sum = a => (a || []).reduce((x, y) => x + y, 0); let cum = 0;
  const rows = S.order.map((id, k) => { const it = itemById(id), t = T[id]; const ask = sum(it.ask); cum += ask;
    return { rank: k + 1, id, ccar: it.ccar, name: it.event, pmo: grpOf(it), ask, d: sum(t.d), m: sum(t.m), u: sum(t.u),
             svc: SVC.map((s, i) => ({ s, ask: it.ask[i], d: t.d[i] || 0, m: t.m[i] || 0, u: t.u[i] || 0 })), cum,
             lane: (document.querySelector('#row-' + id) || {}).textContent ? (document.querySelector('#row-' + id).textContent.match(/Discretionary|Mandatory|Both|Unfunded/) || [''])[0] : '' }; });
  const tot = k => rows.reduce((x, r) => x + r[k], 0);
  return { ba: { disc: sum(S.discSvc), mand: sum(S.mandSvc) }, totals: { ask: tot('ask'), d: tot('d'), m: tot('m'), u: tot('u') }, rows,
           appn: (document.getElementById('appnSel') || {}).value, fy: MS.cur, save: (document.getElementById('saveState') || {}).textContent };
}, { items });
writeFileSync(out, JSON.stringify(r, null, 1)); console.log(JSON.stringify({ ba: r.ba, totals: r.totals, first: r.rows[0], save: r.save }));
await browser.close();
