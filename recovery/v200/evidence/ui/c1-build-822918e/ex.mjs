// UI-C1: exercise the five affected controls (ten checker hits) in the actual program, in Chromium.
//   node ex.mjs <label> <board.html> <outDir>
// Three browser contexts, each fresh (empty storage), viewport 1600x1000, clock fixed at 1790000000000 (the
// same clock rv-smoke.mjs uses):
//   A  the board file itself: opening recorded, then the synthetic seed (rv-smoke.mjs's, in memory only),
//      then the person's clicks below, then a census of every rendered handler at the five sites in every mode.
//   S  the board file, the same seed, then the board's own "Save a copy" (publishState) -> the downloaded bytes.
//   R  that downloaded (saved) file reopened: opening recorded, the same clicks, the same census.
// Recorded per step: the clicked control's handler attribute as the browser holds it, every Storage write
// (wrapped before the page's own script runs), every input.click() the page makes, file choosers, page errors,
// console errors, dialogs, a state snapshot, and the whole DOM (script text emptied) with its on* attributes.
import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const WT = '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/ui-c1-wt';
const { chromium } = await import(WT + '/node_modules/playwright-core/index.mjs');
const { seed } = await import(WT + '/tools/export-audit/boot.mjs');
const [label, boardPath, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const sha = s => createHash('sha256').update(s).digest('hex');
const CLOCK = 1790000000000;
const REOPEN = '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/reopen';

// the synthetic seed, exactly as uichunk1/rv-smoke.mjs builds it
const PM = ['PSM', 'ATL', 'TSS', 'AV', 'MxS', 'LOG'];
const NAMES = ['Depot pod overhaul', 'Engine spares pool', 'Training system refresh', 'Avionics software drop', 'Maintenance data link', 'Logistics IT sustainment', 'Support equipment buy', 'Simulator concurrency', 'Field service reps', 'Repair network stand-up', 'Tech data update', 'Obsolescence redesign', 'Test equipment recal', 'Packaging & shipping'];
const items = NAMES.map((n, i) => ({ id: 'S' + String(i + 1).padStart(2, '0'), grp: PM[i % PM.length], team: PM[i % PM.length], sect: '', custom: false, title: 'Synthetic — ' + n, event: n, ccar: 'SYN-' + (100 + i), fy26: [0, 0, 0], ask: [(9 + (i * 7) % 23) * 1e6, (2 + (i * 3) % 7) * 1e6, (1 + (i * 5) % 4) * 1e6], alloc: null }));
const sc = { services: ['USAF', 'ANG', 'AFRC'], items, disc: [180e6, 40e6, 22e6], mand: [25e6, 6e6, 3e6], order: items.map(i => i.id) };
let SEED = ''; seed(c => { SEED = c; }, sc);
const SEED2 = `BASE_ITEMS.length=0; DATA.items.forEach(i=>{ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); S.bm={disc:S.discSvc,mand:S.mandSvc,adds:[]}; render(); 1`;

const INIT = `(() => {
  window.__ph = 'opening'; window.__log = []; window.__clk = [];
  const SP = Storage.prototype, oSet = SP.setItem, oRem = SP.removeItem, oClr = SP.clear;
  const area = s => { try { return s === window.sessionStorage ? 'session' : 'local'; } catch (e) { return '?'; } };
  SP.setItem = function (k, v) { window.__log.push({ ph: window.__ph, op: 'set', a: area(this), k: String(k), v: String(v) }); return oSet.apply(this, arguments); };
  SP.removeItem = function (k) { window.__log.push({ ph: window.__ph, op: 'remove', a: area(this), k: String(k) }); return oRem.apply(this, arguments); };
  SP.clear = function () { window.__log.push({ ph: window.__ph, op: 'clear', a: area(this) }); return oClr.apply(this, arguments); };
  const oClick = HTMLInputElement.prototype.click;
  HTMLInputElement.prototype.click = function () { window.__clk.push({ ph: window.__ph, id: this.id, type: this.type }); return oClick.apply(this, arguments); };
})();`;

const SNAP = () => {
  const q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
  const g = f => { try { return f(); } catch (e) { return 'ERR:' + e.message; } };
  const t = e => (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50);
  const ae = document.activeElement;
  const state = {
    uiMode: g(() => uiMode), uiDensity: g(() => uiDensity), UI_DTAB: g(() => UI_DTAB), openMenu: g(() => openMenu), curRow: g(() => curRow),
    UI2: g(() => { const o = Object.assign({}, UI2); delete o.t; return JSON.stringify(o); }),
    htmlClass: document.documentElement.className, bodyClass: document.body.className,
    rowcols: document.documentElement.style.getPropertyValue('--rowcols'),
    colsCss: g(() => q('#uiColsCss').textContent),
    popsOpen: qa('.uiPop.open').map(e => e.id),
    flyOpen: g(() => q('#uiFly').classList.contains('open')), flyItems: qa('#uiFly button').map(b => t(b) + (b.disabled ? ' [disabled]' : '')),
    colsBoxes: qa('#uiColsPop input[type=checkbox]').map(b => t(b.parentNode) + '=' + b.checked),
    densPressed: qa('#uiDensPop button').map(b => t(b) + '=' + b.getAttribute('aria-pressed')),
    dtabs: qa('#inspector .uiDTabs button').map(b => b.getAttribute('data-k') + '=' + b.getAttribute('aria-pressed')),
    expanded: qa('[aria-expanded]').map(b => (b.id || t(b)) + '=' + b.getAttribute('aria-expanded')),
    menuEls: qa('[id^="m_"]').map(e => e.id + ':' + e.className + ':' + (e.offsetParent ? 'shown' : 'hidden')),
    inspector: g(() => q('#inspector').className), inspScroll: g(() => [q('#inspector').scrollTop, (q('#inspector .insp-bd') || {}).scrollTop]),
    winScroll: [window.scrollX, window.scrollY],
    scrolled: qa('*').filter(e => e.scrollTop > 0 || e.scrollLeft > 0).map(e => (e.id || e.tagName + '.' + e.className) + ':' + e.scrollTop + ',' + e.scrollLeft),
    active: ae ? (ae.id || (ae.tagName + ':' + t(ae))) : null,
    status: g(() => t(q('#stat') || q('#status') || document.body)).slice(0, 50),
  };
  const all = [...document.querySelectorAll('*')];
  const handlers = [];
  all.forEach((e, i) => { for (const a of e.getAttributeNames()) if (/^on/.test(a)) handlers.push([i, e.tagName, e.id || '', a, e.getAttribute(a)]); });
  const c = document.documentElement.cloneNode(true);
  c.querySelectorAll('script').forEach(s => { s.textContent = ''; });
  c.querySelectorAll('*').forEach(e => { for (const a of e.getAttributeNames()) if (/^on/.test(a)) e.setAttribute(a, ''); });
  return { state, handlers, domNoHandlers: c.outerHTML };
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true });
const result = { label, boardPath, boardSha: null, clock: CLOCK, contexts: {} };
result.boardSha = sha((await import('node:fs')).readFileSync(boardPath));

async function openCtx(name, url) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, acceptDownloads: true });
  await ctx.clock.setFixedTime(new Date(CLOCK));
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const R = { name, url, errors: [], dialogs: [], choosers: [], steps: [] };
  let ph = 'opening';
  page.on('pageerror', e => R.errors.push({ ph, kind: 'pageerror', msg: String(e && e.message || e) }));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') R.errors.push({ ph, kind: 'console.' + m.type(), msg: m.text() }); });
  page.on('dialog', d => { R.dialogs.push({ ph, type: d.type(), msg: d.message() }); d.dismiss().catch(() => {}); });
  page.on('filechooser', async fc => { let id = null; try { id = await fc.element().getAttribute('id'); } catch (e) { id = 'ERR'; } R.choosers.push({ ph, id, multiple: fc.isMultiple() }); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  const setPh = async n => { ph = n; await page.evaluate(x => { window.__ph = x; }, n); };
  let nSnap = 0;
  const snapTo = async (stepName) => {
    const s = await page.evaluate(SNAP);
    const n = String(nSnap++).padStart(2, '0');
    writeFileSync(`${outDir}/dom-${name}-${n}.html`, s.domNoHandlers);
    writeFileSync(`${outDir}/handlers-${name}-${n}.json`, JSON.stringify(s.handlers));
    return { n, state: s.state, domSha: sha(s.domNoHandlers), domLen: s.domNoHandlers.length, handlersSha: sha(JSON.stringify(s.handlers)), nHandlers: s.handlers.length };
  };
  const flush = async (stepName) => page.evaluate(n => ({ writes: window.__log.filter(x => x.ph === n), clicks: window.__clk.filter(x => x.ph === n) }), stepName);
  // the opening
  const op = await flush('opening');
  R.opening = { writes: op.writes, clicks: op.clicks, storage: await page.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; }),
    uiOn: await page.evaluate(() => document.documentElement.classList.contains('ui-on')), snap: await snapTo('opening') };
  async function step(stepName, fn) {
    await setPh(stepName);
    let info = null, err = null;
    try { info = await fn(); } catch (e) { err = String(e && e.message || e).split('\n')[0]; }
    await page.waitForTimeout(400);
    const f = await flush(stepName);
    R.steps.push({ step: stepName, info, harnessError: err, writes: f.writes, clicks: f.clicks, snap: await snapTo(stepName) });
  }
  return { ctx, page, R, step, setPh, flush, snapTo };
}

// the person's clicks on the five affected controls (and what it takes to reach them)
async function exercise(C) {
  const { page, step } = C;
  const attr = async (loc, a) => loc.getAttribute(a);
  await step('cols:open', async () => { await page.click('#uiColsBtn'); return null; });
  const nBoxes = await page.locator('#uiColsPop input[type=checkbox]').count();
  for (const phase of ['hide', 'show']) for (let i = 0; i < nBoxes; i++) {
    const box = page.locator('#uiColsPop input[type=checkbox]').nth(i);
    const lbl = ((await box.locator('xpath=..').textContent()) || '').trim();
    await step(`cols:${phase}:${lbl}`, async () => { const h = await attr(box, 'onchange'); await box.click(); return { onchange: h }; });
  }
  for (const [n, txt] of [['compact', 'Compact'], ['comfortable', 'Comfortable']]) {
    await step('dens:open:' + n, async () => { await page.click('#uiDensBtn'); return null; });
    await step('dens:' + n, async () => { const b = page.locator('#uiDensPop button', { hasText: new RegExp('^' + txt + '$') }); const h = await attr(b, 'onclick'); await b.click(); return { onclick: h }; });
  }
  const flyItem = async (nav, text, stepName) => {
    await step('fly:open:' + nav + ':' + stepName, async () => { await page.click('#uiNav_' + nav); return null; });
    await step(stepName, async () => { const b = page.locator('#uiFly button', { hasText: text }); const h = await attr(b, 'onclick'); await b.click(); return { onclick: h }; });
  };
  await flyItem('fydp', 'Reports & exports', 'fly:menu:reports');
  await step('esc:after-reports', async () => { await page.keyboard.press('Escape'); return null; });
  await flyItem('exec', 'Data ▾', 'fly:menu:data');
  await step('esc:after-data', async () => { await page.keyboard.press('Escape'); return null; });
  await flyItem('exec', 'Import CCaR QPE', 'fly:file:srcFile');
  await step('row:pick', async () => { const r = page.locator('#list .row').nth(2).getByText('Synthetic', { exact: false }).first(); await r.click(); return { row: await page.evaluate(() => curRow) }; });
  for (const k of ['funding', 'history', 'overview']) {
    await step('dtab:' + k, async () => { const b = page.locator(`#inspector .uiDTabs button[data-k="${k}"]`); const h = await attr(b, 'onclick'); await b.click(); return { onclick: h }; });
  }
}
// every handler the five sites render, in every mode (after the clicks; not a person's action)
async function census(C) {
  await C.setPh('census');
  return C.page.evaluate(() => {
    const out = { cols: {}, dens: {}, fly: {}, dtabs: null };
    const pick = (root, a) => [...root.querySelectorAll('[' + a + ']')].map(e => e.getAttribute(a));
    out.dtabs = pick(document.getElementById('inspector'), 'onclick').filter(h => /uiDTab\(/.test(h));   // before any mode change redraws the panel
    UI_MODES.forEach(m => { uiSetMode(m); uiPopFill('uiColsPop'); uiPopFill('uiDensPop');
      out.cols[m] = pick(document.getElementById('uiColsPop'), 'onchange');
      out.dens[m] = pick(document.getElementById('uiDensPop'), 'onclick').filter(h => /uiSetDensity/.test(h)); });
    ['fydp', 'exec', 'hist'].forEach(k => { const t = document.createElement('template'); t.innerHTML = uiFlyItems(k);
      out.fly[k] = pick(t.content, 'onclick').filter(h => /getElementById|uiMenuSoon/.test(h)); });
    uiPopsClose();
    return out;
  });
}

// A: the board itself
{
  const C = await openCtx('A', 'file://' + boardPath);
  await C.setPh('seed');
  await C.page.evaluate(c => (0, eval)(c), SEED); await C.page.evaluate(c => (0, eval)(c), SEED2);
  await C.page.waitForTimeout(300);
  const f = await C.flush('seed'); C.R.seed = { writes: f.writes.map(w => ({ ...w, v: w.v === undefined ? undefined : (w.v.length > 200 ? 'sha256:' + sha(w.v) + ' len ' + w.v.length : w.v) })) };
  await exercise(C);
  C.R.census = await census(C);
  C.R.censusWrites = (await C.flush('census')).writes.map(w => ({ op: w.op, k: w.k, v: w.v && w.v.length > 200 ? 'len ' + w.v.length : w.v }));
  result.contexts.A = C.R; await C.ctx.close();
}
// S: the same seed, then the board's own Save a copy
let savedPath = null;
{
  const C = await openCtx('S', 'file://' + boardPath);
  await C.setPh('seed');
  await C.page.evaluate(c => (0, eval)(c), SEED); await C.page.evaluate(c => (0, eval)(c), SEED2);
  await C.page.waitForTimeout(300);
  await C.setPh('save');
  const dlP = C.page.waitForEvent('download', { timeout: 30000 });
  await C.page.evaluate(() => { publishState(); });
  const dl = await dlP;
  // reopened from ONE fixed place for every run (same directory, the board's own suggested name), so the
  // before and after reopenings differ in nothing but the file's bytes; copied into outDir afterwards
  mkdirSync(REOPEN, { recursive: true });
  savedPath = REOPEN + '/' + dl.suggestedFilename();
  await dl.saveAs(savedPath);
  const bytes = (await import('node:fs')).readFileSync(savedPath);
  C.R.saved = { suggestedFilename: dl.suggestedFilename(), path: savedPath, bytes: bytes.length, sha256: sha(bytes),
    status: await C.page.evaluate(() => { const e = document.getElementById('stat'); return e ? e.textContent.slice(0, 160) : null; }) };
  C.R.saveWrites = (await C.flush('save')).writes.map(w => ({ op: w.op, k: w.k, v: w.v && w.v.length > 200 ? 'sha256:' + sha(w.v) + ' len ' + w.v.length : w.v }));
  result.contexts.S = C.R; await C.ctx.close();
}
// R: the saved file reopened
{
  const C = await openCtx('R', 'file://' + savedPath);
  C.R.pubStateByReader = await C.page.evaluate(() => document.getElementById('pubState').textContent);
  writeFileSync(`${outDir}/pubstate-reader.txt`, C.R.pubStateByReader);
  C.R.pubStateByReaderSha = sha(C.R.pubStateByReader); delete C.R.pubStateByReader;
  C.R.rows = await C.page.evaluate(() => document.querySelectorAll('#list .row').length);
  await exercise(C);
  C.R.census = await census(C);
  result.contexts.R = C.R; await C.ctx.close();
}
await browser.close();
copyFileSync(savedPath, `${outDir}/saved.html`);
writeFileSync(`${outDir}/result.json`, JSON.stringify(result, null, 1));
const errs = Object.values(result.contexts).flatMap(c => c.errors);
const hErr = Object.values(result.contexts).flatMap(c => c.steps.filter(s => s.harnessError).map(s => c.name + ' ' + s.step + ': ' + s.harnessError));
console.log(JSON.stringify({ label, boardSha: result.boardSha, steps: Object.fromEntries(Object.entries(result.contexts).map(([k, c]) => [k, c.steps.length])), pageErrors: errs.length, harnessErrors: hErr, saved: result.contexts.S.saved }, null, 1));
