// After the refused import, does 💾 Save in the blank v2.13 tab write over ORBIT Live.html when this browser remembers that file?
// The remembered handle (IndexedDB 'prio-fh', key FNAME, the same in every version) is stood in by setting FH from page code:
// a test handle cannot be put in IndexedDB. Everything else is the board's own code.
import { chromium } from '/home/user/orbit-board/node_modules/playwright-core/index.mjs';
import { CHROME } from '/home/user/orbit-board/tools/chrome.mjs';
import { copyFileSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
const D = dirname(new URL(import.meta.url).pathname), W = join(D, '..', 'workaround');
const RUN = join(D, 'run', 'save'); mkdirSync(RUN, { recursive: true });
copyFileSync(join(W, 'out', 'e-v212.html'), join(RUN, 'ORBIT Live.html'));
copyFileSync(join(W, 'prog', 'v213.html'), join(RUN, 'ORBIT v2.13.html'));
writeFileSync(join(RUN, 'blank.html'), '<!doctype html><meta charset="utf-8"><body>blank</body>');
const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const dialogs = [];
const hook = (p, tag) => p.on('dialog', async d => { dialogs.push(tag + ' ' + d.type() + ': ' + d.message().slice(0, 220)); if (d.type() === 'prompt') await d.accept('Brad'); else await d.accept(); });
const fake = async (p, text) => p.evaluate(t => {
  window.__wrote = null;
  FH = { name: 'ORBIT Live.html', kind: 'file', requestPermission: async () => 'granted', queryPermission: async () => 'granted',
    getFile: async () => new File([t], 'ORBIT Live.html', { type: 'text/html' }),
    createWritable: async () => { const parts = []; return { write: async d => { parts.push(typeof d === 'string' ? d : await new Blob([d]).text()); }, close: async () => { window.__wrote = parts.join(''); } }; } };
}, text);
const stateOf = html => { const m = html.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/); const st = JSON.parse(m[1]);
  const om = st && st.appns && st.appns.om ? st.appns.om : st; const yrs = om && om.years ? Object.keys(om.years) : [];
  const y = om && om.years ? om.years[om.cur] || {} : {};
  return { build: (html.match(/const BUILD='([^']+)'/) || [])[1], omYears: yrs, omOrder: (y.order || []).length, omNotes: Object.keys(y.notes || {}).length,
    omDesc: Object.keys(y.desc || {}).length, appns: st && st.appns ? Object.keys(st.appns) : null, writer: st && st.writer ? st.writer.by : null, bytes: html.length }; };
const r = {};
let p = await ctx.newPage(); hook(p, 'A');
await p.goto('file://' + join(RUN, 'blank.html'));
// A: the old board, opened from its file and saved in place once in this browser (as Brad does): it becomes the writer
await p.goto('file://' + join(RUN, 'ORBIT Live.html')); await p.waitForTimeout(5000);
await fake(p, readFileSync(join(RUN, 'ORBIT Live.html'), 'utf8'));
await p.evaluate(() => saveInPlace()); await p.waitForTimeout(4000);
const savedA = await p.evaluate(() => window.__wrote);
r.A = { stat: await p.evaluate(() => document.getElementById('shareStat').textContent.slice(0, 200)), wrote: savedA ? stateOf(savedA) : null };
writeFileSync(join(RUN, 'ORBIT Live.html'), savedA);
await p.close();
// B: v2.13, the full import refused, then 💾 Save with the remembered handle
p = await ctx.newPage(); hook(p, 'B');
await p.goto('file://' + join(RUN, 'ORBIT v2.13.html')); await p.waitForTimeout(4000);
await p.setInputFiles('#fullFile', join(RUN, 'ORBIT Live.html')); await p.waitForTimeout(6000);
r.B_beforeSave = await p.evaluate(() => ({ saveState: document.getElementById('saveState').textContent, LASTKNOWN, base: localStorage.getItem('prio27om.base') }));
await fake(p, readFileSync(join(RUN, 'ORBIT Live.html'), 'utf8'));
await p.evaluate(() => saveInPlace()); await p.waitForTimeout(5000);
const wroteB = await p.evaluate(() => window.__wrote);
r.B = { stat: await p.evaluate(() => document.getElementById('shareStat').textContent.slice(0, 300)), wrote: wroteB ? stateOf(wroteB) : 'NOTHING WRITTEN' };
if (wroteB) writeFileSync(join(RUN, 'after-B-save.html'), wroteB);
r.dialogs = dialogs;
writeFileSync(join(RUN, 'result.json'), JSON.stringify(r, null, 1)); console.log(JSON.stringify(r, null, 1));
await browser.close();
