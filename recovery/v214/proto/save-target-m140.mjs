// Throwaway (outside the tree): item 140's measured case, with a REAL IndexedDB 'prio-fh' and the board's own _fhGet/_fhPut.
// A file handle cannot be structured-cloned unless it is real, so the handle store keeps a token ({__standin:name}) and each
// page turns it back into a stand-in handle reading and writing the real file on disk through exposed Node functions.
// argv[2] = the program file to test as "the new version" (default: the v2.13 board in the repo).
import { chromium } from '/home/user/orbit-board/node_modules/playwright-core/index.mjs';
import { CHROME } from '/home/user/orbit-board/tools/chrome.mjs';
import { copyFileSync, mkdirSync, writeFileSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
const D = dirname(new URL(import.meta.url).pathname);
const Q = '/tmp/claude-0/-home-user/25675cae-e62d-54ec-be43-d816f1dff607/scratchpad/quota/workaround';
const NEWPROG = process.argv[2] || '/home/user/orbit-board/prioritization-board-grid.html';
const RUN = join(D, 'run'); mkdirSync(join(RUN, 'old'), { recursive: true }); mkdirSync(join(RUN, 'new'), { recursive: true });
const OLD = join(RUN, 'old', 'ORBIT Live.html'), NEW = join(RUN, 'new', 'ORBIT new.html');
copyFileSync(join(Q, 'out', 'e-v212.html'), OLD); copyFileSync(NEWPROG, NEW);
writeFileSync(join(RUN, 'blank.html'), '<!doctype html><meta charset="utf-8"><body>blank</body>');
const DISK = { 'ORBIT Live.html': OLD, 'ORBIT new.html': NEW };
const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const r = { idb: [] };
const dialogs = [];
let answer = true;
const wire = async (p, tag) => {
  p.on('dialog', async d => { dialogs.push(tag + ' ' + d.type() + ': ' + d.message().slice(0, 300)); if (d.type() === 'prompt') await d.accept('Brad'); else if (answer) await d.accept(); else await d.dismiss(); });
  await p.exposeFunction('__dRead', n => readFileSync(DISK[n], 'utf8'));
  await p.exposeFunction('__dWrite', (n, t) => { writeFileSync(DISK[n], t); return t.length; });
  await p.exposeFunction('__log', s => { r.idb.push(tag + ' ' + s); });
};
// installed from page code after the page has loaded (never from an init script)
const install = (p, pick) => p.evaluate(pick => {
  const mk = n => ({ name: n, kind: 'file', __standin: n, requestPermission: async () => 'granted', queryPermission: async () => 'granted',
    getFile: async () => { const t = await window.__dRead(n); return new File([t], n, { type: 'text/html' }); },
    createWritable: async () => { let b = ''; return { write: async d => { b += (typeof d === 'string' ? d : await new Blob([d]).text()); }, close: async () => { await window.__dWrite(n, b); } }; } });
  window.__mk = mk;
  const P = IDBObjectStore.prototype, put0 = P.put, get0 = P.get, del0 = P.delete;
  P.put = function (v, k) { window.__log('put ' + k + ' = ' + (v && v.__standin ? v.__standin : JSON.stringify(v))); return put0.call(this, v && v.__standin ? { __standin: v.__standin } : v, k); };
  P.delete = function (k) { window.__log('delete ' + k); return del0.call(this, k); };
  P.get = function (k) { window.__log('get ' + k); const req = get0.call(this, k);
    return new Proxy(req, { get(t, q) { if (q === 'result') { const x = t.result; return x && x.__standin ? mk(x.__standin) : x; } const v = t[q]; return typeof v === 'function' ? v.bind(t) : v; },
      set(t, q, v) { t[q] = v; return true; } }); };
  window.__picks = [];
  window.showSaveFilePicker = async o => { window.__picks.push(o && o.suggestedName); if (pick) return mk(pick); const e = new Error('cancelled'); e.name = 'AbortError'; throw e; };
}, pick);
const stateOf = html => { const m = html.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/); const st = JSON.parse(m[1]);
  const om = st && st.appns && st.appns.om ? st.appns.om : st;
  return { build: (html.match(/const BUILD='([^']+)'/) || [])[1], appns: st && st.appns ? Object.keys(st.appns) : null,
    omOrder: om && om.years ? ((om.years[om.cur] || {}).order || []).length : null, bytes: html.length }; };
// A: the old board (v2.12), opened from its file and saved in place once (it picks its own file the first time)
let p = await ctx.newPage(); await wire(p, 'A');
await p.goto('file://' + join(RUN, 'blank.html'));
await p.goto('file://' + OLD); await p.waitForTimeout(5000);
await install(p, 'ORBIT Live.html');
await p.evaluate(() => saveInPlace()); await p.waitForTimeout(5000);
r.A = { stat: await p.evaluate(() => document.getElementById('shareStat').textContent.slice(0, 160)), file: stateOf(readFileSync(OLD, 'utf8')) };
const oldBytes = readFileSync(OLD, 'utf8');
await p.close();
// B: the new version, its full import refused, then 💾 Save; every question is answered Cancel
answer = true;
p = await ctx.newPage(); await wire(p, 'B');
await p.goto('file://' + NEW); await p.waitForTimeout(4000);
await p.setInputFiles('#fullFile', OLD); await p.waitForTimeout(7000);
r.B_afterRefusal = await p.evaluate(() => ({ saveState: document.getElementById('saveState').textContent, DIRTY, LASTKNOWN, base: localStorage.getItem('prio27om.base') }));
await install(p, null);
answer = false;
const nd = dialogs.length;
await p.evaluate(() => saveInPlace()); await p.waitForTimeout(6000);
const after = readFileSync(OLD, 'utf8');
r.B = { picks: await p.evaluate(() => window.__picks), questions: dialogs.slice(nd),
  stat: await p.evaluate(() => document.getElementById('shareStat').textContent.slice(0, 240)),
  oldFileUnchanged: after === oldBytes, oldFileNow: stateOf(after) };
r.dialogs = dialogs;
r.verdict = (r.B.oldFileUnchanged && (r.B.picks.length > 0 || r.B.questions.length > 0)) ? 'PASS: nothing written unasked' : 'FAIL: written over without asking';
writeFileSync(join(RUN, 'result.json'), JSON.stringify(r, null, 1)); console.log(JSON.stringify(r, null, 1));
await browser.close();
