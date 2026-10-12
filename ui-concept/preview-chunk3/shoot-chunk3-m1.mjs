// shoot-chunk3-m1.mjs <board.html> <outDir> -- the M1 messages of the ACTUAL board, in a real (headed) Chromium under Xvfb,
// with SYNTHETIC data seeded at run time only (the seed of preview-chunk2/shoot-chunk2.mjs). The batch's messages are the
// browser's own alert and confirm boxes, which a page screenshot cannot see, so each is photographed off the X display
// (ImageMagick `import`) while it is up; the page itself is photographed after it is answered. Every dialog's exact text,
// and what the board holds after each case, go into shots.json. Run: xvfb-run -a -s "-screen 0 1440x1000x24" node ...
// Two cases are FAULT-INJECTED, and say so in their names: the dry run is made to miss a question (the only way left to a
// Cancel part-way), and in one of them browser storage refuses the put-back.
import { chromium } from '/home/user/orbit-ui/node_modules/playwright-core/index.mjs';
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const [board, out] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: false,
  args: ['--window-position=0,0', '--window-size=1440,1000'] });
const PM = ['PSM', 'ATL', 'TSS', 'AV', 'MxS', 'LOG'];
const NAMES = ['Depot pod overhaul', 'Engine spares pool', 'Training system refresh', 'Avionics software drop', 'Maintenance data link',
  'Logistics IT sustainment', 'Support equipment buy', 'Simulator concurrency', 'Field service reps', 'Repair network stand-up',
  'Tech data update', 'Obsolescence redesign', 'Test equipment recal', 'Packaging & shipping'];
const items = NAMES.map((n, i) => ({ id: 'S' + String(i + 1).padStart(2, '0'), grp: PM[i % PM.length], team: PM[i % PM.length], sect: '', custom: false,
  title: 'Synthetic — ' + n, event: n, ccar: 'SYN-' + (100 + i), fy26: [0, 0, 0],
  ask: [(9 + (i * 7) % 23) * 1e6, (2 + (i * 3) % 7) * 1e6, (1 + (i * 5) % 4) * 1e6], alloc: null }));
const ask = id => items.find(i => i.id === id).ask;
const plus = (id, d) => { const a = ask(id).slice(); a[0] += d; return a; };
const sub = o => JSON.stringify(Object.assign({ spmtPkg: 1, dir: 'submit', ap: '', fy: 2027, ts: 1789000000000, svc: ['USAF', 'ANG', 'AFRC'] }, o));
const one = (pmo, id, d, cons, extra = {}, dest = null) => sub(Object.assign({ pmo, by: pmo ? 'PMO ' + pmo : 'Pat',
  dest: dest ? [{ k: dest[0], n: dest[1], kind: 'gov', t: '' }] : undefined,
  items: { [id]: Object.assign({ asks: plus(id, d), cons }, dest ? { dest: { to: dest[0], end: '' } } : {}) }, base: { [id]: { asks: ask(id) } } }, extra));
const F = {
  TSS: ['TSS.json', one('TSS', 'S03', 300000, 'TSS says')],
  AV: ['AV.json', one('AV', 'S04', 500000, 'AV says', {}, ['dZulu', 'Depot Zulu'])],
  NOFY: ['PSM-no-year.json', one('PSM', 'S01', 7000, 'no year', { fy: undefined }, ['dYank', 'Depot Yankee'])],
  FY28: ['ATL-FY28.json', one('ATL', 'S02', 8000, 'for FY28', { fy: 2028 }, ['dXray', 'Depot Xray'])],
  NOPMO: ['no-office.json', one(undefined, 'S07', 9000, 'no office', { pmo: undefined }, ['dWhis', 'Depot Whiskey'])],
};
const asFiles = list => list.map(([name, txt]) => ({ name, mimeType: 'application/json', buffer: Buffer.from(txt) }));
const shots = {}, errs = [];
async function open() {
  const ctx = await browser.newContext({ viewport: null });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(String(e)));
  const plan = { name: '', n: 0, answer: false, dialogs: [] };
  page.on('dialog', async d => {
    const i = ++plan.n; const rec = { type: d.type(), message: d.message() };
    if (plan.name) {
      await sleep(800);
      const png = `${plan.name}-${d.type() === 'confirm' ? 'question' : 'message'}-${i}.png`;
      execFileSync('import', ['-window', 'root', `${out}/${png}`], { timeout: 30000 });
      rec.png = png;
    }
    plan.dialogs.push(rec);
    if (d.type() === 'confirm' && !plan.answer) await d.dismiss(); else await d.accept();
  });
  await page.goto(pathToFileURL(board).href);
  await page.waitForTimeout(600);
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
    uiSetMode('review'); render(); window.scrollTo(0, 0);
  }, { items });
  // the review already holding TSS, one row ticked: loaded the way a person loads one file (⬅ Load a submittal file)
  await page.setInputFiles('#stateFile', asFiles([F.TSS]));
  await page.waitForFunction(() => PMOSUBS.length === 1);
  await page.evaluate(() => { subPick(0, 'S03', 'asks', true); });
  await page.waitForTimeout(300);
  return { page, plan };
}
const state = page => page.evaluate(() => ({ batch: UI_BATCH, offices: PMOSUBS.map(p => p.pmo || p.by), ticks: Object.keys(PMOPICK).filter(k => PMOPICK[k]),
  dest: DESTDB.ents.map(e => e.n), stored: (() => { try { return JSON.parse(localStorage.getItem('prio27destdb')).ents.map(e => e.n); } catch (e) { return null; } })(),
  status: (document.getElementById('shareStat') || {}).textContent || '', header: (document.getElementById('saveState') || {}).textContent || '' }));
async function run(name, list, { answer = false, before = null } = {}) {
  const { page, plan } = await open();
  shots[name] = { before: await state(page) };
  if (before) await page.evaluate(before);
  plan.name = name; plan.answer = answer;
  await page.evaluate(() => { window.__done = false; const own = uiSubMany; uiSubMany = async function (inp) { try { return await own(inp); } finally { window.__done = true; } }; });
  await page.setInputFiles('#uiSubMulti', asFiles(list));
  await page.waitForFunction(() => window.__done === true, null, { timeout: 30000 });
  plan.name = '';
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${name}-after-review.png` });     // the review, reopened by the batch's own redraw
  await page.evaluate(() => { subClose(); window.scrollTo(0, 0); });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${name}-after-board.png` });      // the board and its status line, on one line
  await page.click('#statBtn');                                            // More: the whole status line, as a person opens it
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${name}-after-status.png` });
  shots[name].files = list.map(f => f[0]); shots[name].dialogs = plan.dialogs; shots[name].after = await state(page);
  await page.context().close();
}
// THE IMPORT BOX: PMO Import, all submissions at once, with its new wording
{ const { page } = await open();
  await page.evaluate(() => { uiImpOpen(); uiImpPick('pmo'); UI2.pmoHow = 'all'; uiImpDraw(); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/m1-1440-import-box-all-submissions.png` });
  await page.context().close(); }
// REFUSED BEFORE ANYTHING LOADS: one file would ask; then three would
await run('m1-1440-refused-one-would-ask', [F.AV, F.NOFY]);
await run('m1-1440-refused-three-would-ask', [F.NOFY, F.AV, F.FY28, F.NOPMO]);
// FAULT-INJECTED: the dry run misses PSM's question, the real run asks it after AV's list is stored, and it is answered Cancel
const missAsks = () => { const own = uiTakeDry; uiTakeDry = function (p, n) { const r = own(p, n); r.asks = []; return r; }; };
await run('m1-1440-fault-cancel-part-way-put-back', [F.AV, F.NOFY], { before: missAsks });
// FAULT-INJECTED: as above, and browser storage then refuses to take the old destination list back
await run('m1-1440-fault-put-back-refused-by-storage', [F.AV, F.NOFY], { before: () => {
  const own = uiTakeDry; uiTakeDry = function (p, n) { const r = own(p, n); r.asks = []; return r; };
  const P = Object.getPrototypeOf(localStorage), set = P.setItem; let n = 0;
  P.setItem = function (k, v) { if (k === 'prio27destdb' && ++n > 1) { const e = new Error('refused'); e.name = 'QuotaExceededError'; throw e; } return set.call(this, k, v); };
} });
writeFileSync(`${out}/shots.json`, JSON.stringify({ board, errors: errs, shots }, null, 1));
await browser.close();
console.log(JSON.stringify({ errors: errs, cases: Object.keys(shots) }));
