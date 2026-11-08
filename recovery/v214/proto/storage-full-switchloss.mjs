// Storage full: an edit storage refused, then the Appropriation box is switched away and back (switching reopens the page).
import { chromium } from '/home/user/orbit-board/node_modules/playwright-core/index.mjs';
import { CHROME } from '/home/user/orbit-board/tools/chrome.mjs';
import { readFileSync, copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
const D = '/tmp/claude-0/-home-user/25675cae-e62d-54ec-be43-d816f1dff607/scratchpad/quota/workaround', RUN = '/tmp/claude-0/-home-user/25675cae-e62d-54ec-be43-d816f1dff607/scratchpad/v214/map-storage-full/sw/run'; mkdirSync(RUN, { recursive: true });
copyFileSync(join(D, 'run', 'fitB', 'saved-inplace.html'), join(RUN, 'ORBIT migrated.html'));
writeFileSync(join(RUN, 'blank.html'), '<!doctype html><meta charset="utf-8"><body>blank</body>');
const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage(); const dialogs = []; page.on('dialog', async d => { dialogs.push(d.type() + ': ' + d.message().slice(0, 150)); await d.accept(); });
await page.goto('file://' + join(RUN, 'blank.html'));
const L = JSON.parse(readFileSync(join(D, 'run', 'fitB', 'ls-after.json'), 'utf8'));
await page.evaluate(L => { Object.keys(L).forEach(k => localStorage.setItem(k, L[k])); let t = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); t += k.length + localStorage.getItem(k).length; } localStorage.setItem('another-local-tool', 'f'.repeat(5242880 - t - 'another-local-tool'.length)); }, L);
await page.goto('file://' + join(RUN, 'ORBIT migrated.html')); await page.waitForTimeout(4000);
const id = await page.evaluate(() => S.order[1]);
const NOTE = 'Typed while storage was full. ' + 'Words '.repeat(80);
await page.evaluate(id => { setCur(id); openEdit(id, 'notes'); }, id);
await page.locator('#erNote').waitFor(); await page.locator('#erNote').fill(NOTE); await page.click('#erSaveBtn'); await page.waitForTimeout(600);
const r = { afterEdit: await page.evaluate(([id, t]) => ({ noteOnScreen: String(S.notes[id] || '').indexOf(t.trim()) >= 0, persistFail: _persistFail, unsaved: unsavedNow() }), [id, NOTE]) };
r.boxOpen = await page.evaluate(() => { const b = document.getElementById('editPanel'); return b ? b.className : 'none'; });
r.appnStored = await page.evaluate(() => localStorage.getItem('prio27appn'));
await page.evaluate(() => { try { drawerClose(); } catch (e) {} });
// the Appropriation box: Full Fund, then back to O&M
let nav = page.waitForEvent('load', { timeout: 15000 }).catch(() => 'no load'); await page.selectOption('#appnSel', 'FULL FUND'); r.firstSwitch = await nav; await page.waitForTimeout(3000);
r.onFullFund = await page.evaluate(() => APPN);
r.appnStoredAfter = await page.evaluate(() => localStorage.getItem('prio27appn'));
r.noteAfterFirstSwitch = await page.evaluate(([id, t]) => ({ appn: APPN, note: String(S.notes[id] || '').indexOf(t.trim()) >= 0 }), [id, NOTE]);
if (r.onFullFund === 'FULL FUND') { nav = page.waitForEvent('load', { timeout: 15000 }).catch(() => 'no load'); await page.selectOption('#appnSel', 'O&M'); await nav; await page.waitForTimeout(3000); }
r.backOnOM = await page.evaluate(([id, t]) => ({ appn: APPN, noteStillThere: String(S.notes[id] || '').indexOf(t.trim()) >= 0 }), [id, NOTE]);
r.dialogs = dialogs;
console.log(JSON.stringify(r, null, 1)); writeFileSync(join(RUN, 'result.json'), JSON.stringify(r, null, 1));
await browser.close();
