// After a full import that lands with little room left, does the reopened board work? Opening, then edits.
// Storage is seeded from page code after load (never an init script).
import { chromium } from '/home/user/orbit-board/node_modules/playwright-core/index.mjs';
import { CHROME } from '/home/user/orbit-board/tools/chrome.mjs';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const S = '/tmp/claude-0/-home-user/25675cae-e62d-54ec-be43-d816f1dff607/scratchpad/quota';
const RUN = join(S, 'critic/run/headroom'); mkdirSync(RUN, { recursive: true });
copyFileSync('/home/user/orbit-board/prioritization-board-grid.html', join(RUN, 'ORBIT v2.13.html'));
copyFileSync(join(S, 'sizes/out/c-v213.html'), join(RUN, 'ORBIT Live.html'));
writeFileSync(join(RUN, 'blank.html'), '<!doctype html><meta charset="utf-8"><title>blank</title><body>blank</body>');
const FMAX = 3133265; // largest filler that still imports board c (sizes/run/thresh-fresh-c)
const HS = (process.argv[2] || '0,500,2000,10000,50000').split(',').map(Number);
const total = p => p.evaluate(() => { let t = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); t += k.length + localStorage.getItem(k).length; } return t; });
const browser = await chromium.launch({ executablePath: CHROME });
const out = [];
for (const H of HS) {
  const ctx = await browser.newContext(); const dlg = [];
  ctx.on('page', p => p.on('dialog', async d => { dlg.push(d.type() + ': ' + d.message().slice(0, 140)); await d.accept(); }));
  const b = await ctx.newPage(); await b.goto('file://' + join(RUN, 'blank.html'));
  await b.evaluate(n => localStorage.setItem('another-file-page', 'f'.repeat(n)), FMAX - H);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e.message).slice(0, 160)));
  await p.goto('file://' + join(RUN, 'ORBIT v2.13.html')); await p.waitForTimeout(1500);
  const reload = p.waitForEvent('load', { timeout: 30000 }).catch(() => null);
  await p.setInputFiles('#fullFile', join(RUN, 'ORBIT Live.html'));
  const r = await reload; await p.waitForTimeout(2500);
  const row = { H, reloaded: !!r, dialogs: dlg.slice() };
  if (r) {
    row.open = await p.evaluate(() => ({ n: S.order.length, refused: DIAG.refused.map(x => x.what + ' — ' + x.why), persistFail: _persistFail, unsaved: unsavedNow(), stat: (document.getElementById('shareStat') || {}).textContent.slice(0, 200) }));
    row.totalAfterOpen = await total(p); row.freeAfterOpen = 5242880 - row.totalAfterOpen;
    row.edits = [];
    for (let i = 0; i < 4; i++) {
      const e = await p.evaluate(i => { const k = _AP.key, before = (localStorage.getItem(k) || '').length; const id = S.order[i];
        setNote(id, 'A note typed after the import, number ' + i + ' — about the size of an ordinary note on this board.');
        const after = (localStorage.getItem(k) || '').length; const mem = JSON.stringify(MS).length;
        return { i, persistFail: _persistFail, storedGrew: after - before, memMinusStored: mem - after, refused: DIAG.refused.length }; }, i);
      row.edits.push(e);
    }
    row.totalEnd = await total(p);
  }
  row.errors = errs; out.push(row); console.log(JSON.stringify(row));
  await ctx.close();
}
writeFileSync(join(RUN, 'result.json'), JSON.stringify(out, null, 1));
await browser.close();
