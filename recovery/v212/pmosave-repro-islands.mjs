// STANDALONE REPRO -- why tools/pmo-save.mjs's sections G, I, J and K fail some runs, on v2.11 and v2.12 alike.
//
// No board is needed. In one Playwright browser context, six tiny file:// tabs are opened one after another; each writes its
// own key into localStorage as it loads, and then every tab counts how many of the six keys it can see. Every tab should see
// all six. It is run three ways:
//
//   none      no init script                                                   -> every tab sees all six
//   start     an init script that READS localStorage as the document is made   -> now and then one tab sees only its own key,
//             (what pmo-save.mjs's addInitScript does, writing prio27who etc.)     and no other tab sees it: a storage island
//   loaded    the same access deferred to DOMContentLoaded                      -> every tab sees all six
//
// A tab on an island keeps working -- it reads back its own writes -- but nothing it writes reaches the other tabs, and it
// never sees theirs. When that tab is a board, its save to browser storage is invisible to the next tab, which opens the
// file's own snapshot instead (K, J), and a choice of office made there is not "the browser's setting" (G, I).
//
//   node recovery/v212/pmosave-repro-islands.mjs [--n 30] [--board FILE]     (--board: every tab is that board file instead of a tiny page)
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const { CHROME } = await import(new URL('../../tools/chrome.mjs', import.meta.url).href);
const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d; };
const N = +arg('--n', '30'), P = 6, BOARD = arg('--board', '');
const dir = mkdtempSync(join(tmpdir(), 'islands-'));
process.on('exit', () => { try { rmSync(dir, { recursive: true, force: true }); } catch {} });
for (let i = 0; i < P; i++) writeFileSync(join(dir, 't' + i + '.html'), BOARD ? readFileSync(resolve(BOARD), 'utf8')
  : `<!doctype html><title>t${i}</title><body>t${i}</body>`);
const INIT = {
  none: null,
  start: () => { if (location.protocol === 'file:') { try { localStorage.getItem('prio27who'); } catch (e) {} } },
  loaded: () => { document.addEventListener('DOMContentLoaded', () => { try { localStorage.getItem('prio27who'); } catch (e) {} }); },
};
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
for (const [how, init] of Object.entries(INIT)) {
  let ctxs = 0, islands = 0;
  for (let k = 0; k < N; k++) {
    const ctx = await b.newContext(); if (init) await ctx.addInitScript(init);
    const pages = [];
    for (let i = 0; i < P; i++) { const p = await ctx.newPage(); pages.push(p); await p.goto('file://' + join(dir, 't' + i + '.html'));
      await p.evaluate(i => localStorage.setItem('t' + i, '1'), i); }      // the tab's own key, written after it has loaded
    await new Promise(r => setTimeout(r, 300));
    const sees = await Promise.all(pages.map(p => p.evaluate(n => { let c = 0; for (let i = 0; i < n; i++) if (localStorage.getItem('t' + i)) c++; return c; }, P)));
    const alone = sees.filter(c => c === 1).length;
    if (sees.some(c => c < P)) { ctxs++; islands += alone; console.log(`  ${how}: context ${k}: keys each tab sees: ${sees.join(' ')}`); }
    await ctx.close();
  }
  console.log(`${how.padEnd(7)} ${N} contexts x ${P} tabs${BOARD ? ' (each the board)' : ''}: ${ctxs} context(s) split, ${islands} tab(s) on an island of their own`);
}
await b.close();
