// What ORBIT v2.13 does today when browser storage cannot hold the open board (Chromium, file://).
// usage: node hazards.mjs <program-or-board.html> <label>
// Storage is seeded from page code on a blank file:// page after it loads (never an init script).
// Cases:
//  A  an edit storage refuses, then a reload (closing the tab, F5)       -> is the edit kept? is the person warned first?
//  B  an edit storage refuses, then switching appropriation             -> is the edit kept?
//  C  storage holds an older copy marked unsaved, and has no room to keep it aside -> which board opens?
import { chromium } from '/home/user/orbit-board/node_modules/playwright-core/index.mjs';
import { CHROME } from '/home/user/orbit-board/tools/chrome.mjs';
import { copyFileSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
const D = dirname(new URL(import.meta.url).pathname);
const SRC = process.argv[2], LABEL = process.argv[3] || 'run';
const RUN = join(D, 'run', LABEL); mkdirSync(RUN, { recursive: true });
const BOARDF = join(RUN, 'ORBIT Live.html');
copyFileSync(SRC, BOARDF);
writeFileSync(join(RUN, 'blank.html'), '<!doctype html><meta charset="utf-8"><title>blank</title><body>blank</body>');
const Q = 5242880;
const used = p => p.evaluate(() => { let t = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); t += k.length + localStorage.getItem(k).length; } return t; });
const keys = p => p.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k).length; } return o; });
const stat = p => p.evaluate(() => { const e = document.getElementById('shareStat'); return e ? e.textContent.replace(/\s+/g, ' ').slice(0, 500) : ''; });
const out = { label: LABEL, src: SRC.split('/').pop() };
const browser = await chromium.launch({ executablePath: CHROME });
out.chromium = browser.version();

async function fresh(room, seed) {
  const ctx = await browser.newContext();
  const dialogs = [];
  ctx.on('page', p => p.on('dialog', async d => { dialogs.push({ type: d.type(), msg: d.message().slice(0, 300) }); await d.accept(); }));
  const blank = await ctx.newPage();
  await blank.goto('file://' + join(RUN, 'blank.html'));
  if (seed) await blank.evaluate(seed => { for (const k in seed) localStorage.setItem(k, seed[k]); }, seed);
  // a filler that leaves `room` characters free (another page's key, as any local HTML tool might leave)
  const u = await used(blank);
  const fill = Q - u - room - 'another-file-page'.length;
  if (fill > 0) await blank.evaluate(n => localStorage.setItem('another-file-page', 'f'.repeat(n)), fill);
  return { ctx, dialogs, blank };
}
async function openBoard(ctx) {
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e.message).slice(0, 200)));
  await page.goto('file://' + BOARDF);
  await page.waitForTimeout(2500);
  return { page, errs };
}
const look = (page, id) => page.evaluate(id => ({
  appn: APPN, n: S.order.length, note: (S.notes || {})[id] || null, dirty: DIRTY, persistFail: _persistFail,
  refused: DIAG.refused.map(r => r.what + ' — ' + r.why), base: localStorage.getItem(_AP.key + '.base'),
  bootHeld: _bootHeld, kept: !!localStorage.getItem(_AP.key + '.kept'), ms_ts: MS.ts, pub_ts: (PUB && PUB.ts) || 0,
  beforeunloadHandler: typeof window.onbeforeunload === 'function'
}), id);

// ---- A: an edit storage refuses, then the page is closed / reloaded
{
  const { ctx, dialogs, blank } = await fresh(200000);
  const { page, errs } = await openBoard(ctx);
  const r = { roomBefore: Q - await used(page), open: await stat(page) };
  const id = await page.evaluate(() => S.order[0]);
  r.id = id;
  await page.evaluate(id => { S.notes[id] = 'EDIT-A typed after opening'; save(); render(); }, id);
  r.afterEdit = await look(page, id); r.afterEditSays = await stat(page);
  // would the browser warn before the tab closes? (Playwright surfaces a 'beforeunload' dialog only if the page asks for one)
  dialogs.length = 0;
  await page.close({ runBeforeUnload: true });
  await new Promise(res => setTimeout(res, 800));
  r.closeDialogs = dialogs.slice();
  const again = await openBoard(ctx);
  r.reopened = await look(again.page, id); r.reopenSays = await stat(again.page);
  r.errors = errs.concat(again.errs);
  out.A = r; await ctx.close();
}
// ---- B: an edit storage refuses, then switching appropriation and back
{
  const { ctx, dialogs, blank } = await fresh(200000);
  const { page, errs } = await openBoard(ctx);
  const id = await page.evaluate(() => S.order[0]);
  await page.evaluate(id => { S.notes[id] = 'EDIT-B typed before switching'; save(); render(); }, id);
  const r = { afterEdit: await look(page, id) };
  dialogs.length = 0;
  r.firstNav = await Promise.all([page.waitForEvent('load', { timeout: 5000 }).then(() => 'load').catch(() => 'no load'), page.evaluate(() => switchAppn('FULL FUND'))]).then(x => x[0]);
  await page.waitForTimeout(1000);
  r.saysAfterSwitch = await stat(page);
  r.onFF = await page.evaluate(() => ({ appn: APPN, n: S.order.length }));
  r.switchDialogs = dialogs.slice();
  if (r.onFF.appn !== 'O&M') await Promise.all([page.waitForEvent('load'), page.evaluate(() => switchAppn('O&M'))]);
  await page.waitForTimeout(2000);
  r.back = await look(page, id); r.backSays = await stat(page);
  r.errors = errs;
  out.B = r; await ctx.close();
}
/* C skipped in this copy */ if (0) // ---- C: storage holds an OLDER copy of O&M marked unsaved, and no room to keep it aside
{
  const html = readFileSync(BOARDF, 'utf8');
  const st = JSON.parse(html.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/)[1]);
  const om = st.appns.om; const fts = om.ts;
  const old = JSON.parse(JSON.stringify(om)); old.ts = fts - 3600e3;
  const y = old.years[old.cur]; const id = y.order[0];
  y.notes = y.notes || {}; y.notes[id] = 'STALE copy in browser storage';
  const seed = { prio27appn: 'O&M', prio27om: JSON.stringify(old), 'prio27om.base': JSON.stringify({ file: fts - 7200e3, dirty: true }) };
  const { ctx, dialogs } = await fresh(300000, seed);
  const { page, errs } = await openBoard(ctx);
  out.C = { seededOld: seed.prio27om.length, opened: await look(page, id), says: await stat(page), errors: errs, fileNote: (om.years[om.cur].notes || {})[id] || null };
  await ctx.close();
}
await browser.close();
writeFileSync(join(RUN, 'result.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
