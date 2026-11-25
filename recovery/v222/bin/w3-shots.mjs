// v2.22 W3: photograph the RECORD card (docked and sliding) and the edit box, in Harbor, at 1440 and 1024.
//   node recovery/v222/bin/w3-shots.mjs OUTDIR [--board FILE] [--id R001]
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CHROME } from '../../../tools/chrome.mjs';
import { buildRecordBoard } from '../../../tools/record-card-fixture.mjs';

const args = process.argv.slice(2);
const out = resolve(args[0] || 'shots');
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const BOARD = resolve(opt('--board', new URL('../../../prioritization-board-grid.html', import.meta.url).pathname));
const ID = opt('--id', 'R001');
mkdirSync(out, { recursive: true });
const B = buildRecordBoard(readFileSync(BOARD, 'utf8'));
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const shots = [];
for (const [w, h] of [[1440, 900], [1024, 768]]) for (const docked of [false, true]) {
  if (docked && w <= 1400) continue;   // docked is a choice above 1400px only; below it the record always slides
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(d => { try { localStorage.setItem('spmtTheme', 'harbor'); localStorage.setItem('prio27uiDock', d ? '1' : '0'); } catch (e) {} }, docked);
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + B.file);
  await p.waitForFunction(() => document.querySelectorAll('#list .row').length > 0, null, { timeout: 40000 });
  await p.waitForTimeout(300);
  for (const id of [ID, 'R002', 'R003', 'R004', 'R005']) {
    await p.click('#row-' + id + ' .tt', { position: { x: 10, y: 8 } }).catch(async () => { await p.evaluate(i => setCur(i), id); });
    await p.waitForTimeout(350);
    const f = join(out, `record-${id}-${w}-${docked ? 'docked' : 'sliding'}.png`);
    await p.screenshot({ path: f }); shots.push(f);
    if (id === ID || id === 'R002' || id === 'R004') {
      // the whole record, scrolled to its foot
      await p.evaluate(() => { const i = document.getElementById('inspector'); i.scrollTop = i.scrollHeight; });
      await p.waitForTimeout(150);
      const g = join(out, `record-${id}-${w}-${docked ? 'docked' : 'sliding'}-foot.png`);
      await p.screenshot({ path: g }); shots.push(g);
      await p.evaluate(() => { const i = document.getElementById('inspector'); i.scrollTop = 0; });
    }
    if (!docked) { await p.keyboard.press('Escape'); await p.waitForTimeout(250); }
  }
  if (!docked) {
    await p.evaluate(i => { setCur(i); openEdit(i, 'rec'); }, ID);
    await p.waitForTimeout(300);
    const e = join(out, `editbox-${w}.png`);
    await p.screenshot({ path: e }); shots.push(e);
  }
  if (errs.length) console.log(`  ${w} ${docked ? 'docked' : 'sliding'}: page errors`, errs.slice(0, 3));
  await ctx.close();
}
await b.close(); B.done();
shots.forEach(s => console.log('  ' + s));
