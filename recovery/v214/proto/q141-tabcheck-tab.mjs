// Does a blank v2.13 tab, after the refused full import, harm the old board in the same browser?
import { chromium } from '/home/user/orbit-board/node_modules/playwright-core/index.mjs';
import { CHROME } from '/home/user/orbit-board/tools/chrome.mjs';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
const D = dirname(new URL(import.meta.url).pathname), W = join(D, '..', 'workaround');
const variant = process.argv[2] || 'none';
const RUN = join(D, 'run', variant); mkdirSync(RUN, { recursive: true });
copyFileSync(join(W, 'out', 'e-v212.html'), join(RUN, 'ORBIT Live.html'));
copyFileSync(join(W, 'prog', 'v213.html'), join(RUN, 'ORBIT v2.13.html'));
writeFileSync(join(RUN, 'blank.html'), '<!doctype html><meta charset="utf-8"><body>blank</body>');
const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const dialogs = [];
const hook = p => p.on('dialog', async d => { dialogs.push(d.type() + ': ' + d.message().slice(0, 160)); await d.accept(); });
const look = async p => p.evaluate(() => {
  const yrs = Object.keys(MS.years || {});
  const cnt = o => o ? Object.keys(o).length : 0;
  let notes = 0, desc = 0, cons = 0;
  yrs.forEach(y => { const s = MS.years[y] || {}; notes += cnt(s.notes); desc += cnt(s.desc); cons += cnt(s.cons); });
  return { build: BUILD, appn: APPN, order: (S.order || []).length, years: yrs, notes, desc, cons, jrnl: (MS.jrnl || []).length,
    stat: (document.getElementById('shareStat') || {}).textContent || '', saveState: (document.getElementById('saveState') || {}).textContent || '',
    unsaved: typeof unsavedNow === 'function' ? unsavedNow() : null };
});
const lsSizes = async p => p.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k).length; } return o; });
const r = { variant };
let p = await ctx.newPage(); hook(p);
await p.goto('file://' + join(RUN, 'blank.html'));
// A: the old board, opened from its file
await p.goto('file://' + join(RUN, 'ORBIT Live.html')); await p.waitForTimeout(5000);
r.oldFirst = await look(p); r.lsAfterOld = await lsSizes(p); await p.close();
// B: the v2.13 file, the full import refused
p = await ctx.newPage(); hook(p);
await p.goto('file://' + join(RUN, 'ORBIT v2.13.html')); await p.waitForTimeout(4000);
await p.setInputFiles('#fullFile', join(RUN, 'ORBIT Live.html')); await p.waitForTimeout(6000);
r.v213afterRefusal = await look(p);
if (variant === 'year') { await p.evaluate(() => switchYear(MS.cur + 1)); await p.waitForTimeout(1500); }
if (variant === 'note') { await p.evaluate(() => { try { setNote && 0; } catch (e) {} save(); }); await p.waitForTimeout(800); }
r.v213afterAction = await look(p); r.lsAfterV213 = await lsSizes(p); await p.close();
// C: the old board again, same browser
p = await ctx.newPage(); hook(p);
await p.goto('file://' + join(RUN, 'ORBIT Live.html')); await p.waitForTimeout(5000);
r.oldAgain = await look(p); r.lsAfterOldAgain = await lsSizes(p);
r.dialogs = dialogs;
writeFileSync(join(RUN, 'result.json'), JSON.stringify(r, null, 1)); console.log(JSON.stringify(r, null, 1));
await browser.close();
