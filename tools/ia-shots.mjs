// IA SHOTS — the same views, photographed the same way, every night.
//
// The census measures structure; this photographs it. Both matter, because a menu can be perfectly
// grouped in the DOM and still read as a wall of text, and no count of items will tell you that.
//
// THE VIEWS ARE FIXED ON PURPOSE. A nightly review is only useful if last night and tonight are
// comparable, so the set does not vary with what happens to be open -- it is the toolbar, every
// dropdown, the scoreboard, the requirement list, the inspector, and the panels a user meets most.
//
//   node tools/ia-shots.mjs [--out DIR] [--board FILE]
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const OUT = arg('--out') || join(ROOT, '.ia-shots');
const BOARD = arg('--board') || process.env.BOARD_HTML || join(ROOT, 'prioritization-board-grid.html');
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
mkdirSync(OUT, { recursive: true });
// Measure a POPULATED board: the bare file has no requirements, so the surfaces that only exist
// beside data are not in the DOM to be measured or photographed.
import { buildPopulated } from './ia-fixture.mjs';
const LIVE = buildPopulated(BOARD);


const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message.slice(0, 140)));
await page.goto('file://' + LIVE);
await page.waitForFunction(() => typeof render === 'function', null, { timeout: 40000 });
await page.waitForTimeout(800);

const shots = [];
const snap = async (name, what, opts = {}) => {
  const path = join(OUT, name + '.png');
  try {
    if (opts.sel) { const el = await page.$(opts.sel); if (!el) { shots.push({ name, what, missing: opts.sel }); return; } await el.screenshot({ path }); }
    else await page.screenshot({ path, clip: opts.clip });
    shots.push({ name, what, path });
  } catch (e) { shots.push({ name, what, error: String(e.message).slice(0, 90) }); }
};

// close whatever a previous shot opened: state must not leak between views, or a screenshot shows
// last view's panel and the reviewer reads it as this one's
const closeAll = async () => { await page.evaluate(() => { try { menuOpen = ''; } catch (e) {}
  document.querySelectorAll('.modal-bg.open').forEach(m => m.classList.remove('open'));
  try { render(); } catch (e) {} }); await page.waitForTimeout(250); };

await snap('00-full-board', 'the whole board at 1920 — the first thing anyone sees');
await snap('01-toolbar', 'the toolbar: menu headers, their order and spacing', { clip: { x: 0, y: 0, width: 1920, height: 120 } });
await snap('02-scoreboard', 'the four funding tiles', { sel: '#scores' });
await snap('03-rows', 'the requirement list — what a row carries', { clip: { x: 0, y: 260, width: 1400, height: 560 } });

// every dropdown, opened one at a time
const menus = await page.evaluate(() => [...document.querySelectorAll('[id^="m_"]')]
  .filter(c => c.querySelector('.mdd'))
  .map(c => ({ id: c.id, label: (c.querySelector('button, .btn')?.textContent || '').trim() })));
let n = 4;
for (const m of menus) {
  await closeAll();
  const key = m.id.replace(/^m_/, '');
  await page.evaluate(k => { try { toggleMenu(k); } catch (e) {} }, key);
  await page.waitForTimeout(300);
  await snap(String(n++).padStart(2, '0') + '-menu-' + key,
    `the ${m.label} dropdown: grouping, order, label length, hint density`, { sel: '#' + m.id + ' .mdd' });
}
await closeAll();

// the surfaces a user spends time in
await snap(String(n++).padStart(2, '0') + '-inspector', 'the right-hand inspector — where editing lives', { sel: '#inspector' });
for (const [fn, id, what] of [
  ['toggleRec', 'recPanel', 'the requirement RECORD panel'],
  ['toggleMat', 'matPanel', 'the classification matrix'],
  ['togglePlans', 'planPanel', 'the two-plan comparison'],
]) {
  await closeAll();
  await page.evaluate(([f]) => { try { const id = S.order[0]; window[f](id); } catch (e) { try { window[f](); } catch (e2) {} } }, [fn]);
  await page.waitForTimeout(500);
  await snap(String(n++).padStart(2, '0') + '-' + id, what, { sel: '#' + id + ' .modal' });
}

await ctx.close(); await browser.close();
writeFileSync(join(OUT, 'index.json'), JSON.stringify({ at: new Date().toISOString(), board: BOARD, shots, pageErrors: errs }, null, 2));

console.log(`IA SHOTS — ${shots.filter(s => s.path).length} captured into ${OUT}`);
for (const s of shots)
  console.log(`  ${s.path ? 'ok  ' : 'MISS'}  ${s.name.padEnd(24)} ${s.what}`
    + (s.missing ? `   (no ${s.missing})` : '') + (s.error ? `   (${s.error})` : ''));
if (errs.length) { console.log('\n  page errors while capturing:'); errs.slice(0, 5).forEach(e => console.log('    ' + e)); }
console.log(`\nindex: ${join(OUT, 'index.json')}`);
