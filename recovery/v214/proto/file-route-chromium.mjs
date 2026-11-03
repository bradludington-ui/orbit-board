// THROWAWAY (outside the tree) for the proposed tools/import-file.mjs, run on v2.13: the over-quota board is BUILT here (a small
// board saved by the board's own code, with a cost estimate padded past browser storage), never read from a committed file.
// Storage is seeded from page code after load (never an init script). The stand-in save picker EMPTIES an existing file the
// moment it is chosen, as Chromium does (measured 8,793,759 -> 0 with the real GTK dialog).
import { chromium } from '/home/user/orbit-board/node_modules/playwright-core/index.mjs';
import { CHROME } from '/home/user/orbit-board/tools/chrome.mjs';
import { boot, seed } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os'; import { join } from 'node:path';
const PROGF = process.argv[2] || '/home/user/orbit-board/prioritization-board-grid.html';
const PROG = readFileSync(PROGF, 'utf8');
const dir = mkdtempSync(join(tmpdir(), 'orbit-fileroute-'));
process.on('exit', () => { try { rmSync(dir, { recursive: true, force: true }); } catch {} });
const t0 = Date.now();
const SVC = ['USAF', 'ANG', 'AFRC'];
const mk = (id, ask) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Req ' + id, event: 'E' + id, ccar: '', fy26: [0, 0, 0], ask, alloc: null });
const B = boot({ html: PROG });
seed(B.ev, { services: SVC, items: ['A', 'B', 'C'].map((x, i) => mk(x, [900 + i, 200, 100])), disc: [2000, 600, 300], mand: [500, 150, 80], order: ['A', 'B', 'C'] });
B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); S.notes.A='kept note'; save(); 'ok'`);
// the cost estimate, padded past what browser storage holds, in pieces under the import check's 200,000-character text limit
B.ev(`(function(){ const blob=[]; for(let i=0;i<29;i++) blob.push('a'+String(i).padStart(4,'0')+'x'.repeat(189995)); ACEDB={ts:Date.now(), sets:{'2026ACE':{label:'2026ACE', ts:Date.now(), blob:blob}}}; return 'ok'; })()`);
const board = B.ev('buildSavedHtml()');
writeFileSync(join(dir, 'ORBIT Live.html'), board);
writeFileSync(join(dir, 'ORBIT v2.13.html'), PROG);
writeFileSync(join(dir, 'seed.html'), '<!doctype html><meta charset="utf-8"><title>seed</title>');
const R = { built_ms: Date.now() - t0, boardChars: board.length };
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await b.newContext();
const sp = await ctx.newPage(); await sp.goto('file://' + join(dir, 'seed.html'));
await sp.evaluate(() => { localStorage.clear(); localStorage.setItem('prio27who', 'Brad'); }); await sp.close();
const p = await ctx.newPage(); const dialogs = []; p.on('dialog', async d => { dialogs.push(d.type() + ': ' + d.message()); await d.accept(); });
await p.goto('file://' + join(dir, 'ORBIT v2.13.html'));
await p.waitForFunction(() => typeof render === 'function', null, { timeout: 40000 }); await p.waitForTimeout(800);
// the stand-in picker, installed from page code after load: one file per name in a page-held map that EMPTIES on pick
await p.evaluate(() => { window.__files = { 'ORBIT Live.html': 'SOURCE BYTES' }; window.__picks = [];
  class H { constructor(n) { this.name = n; } async requestPermission() { return 'granted'; } async queryPermission() { return 'granted'; }
    async getFile() { const t = window.__files[this.name] || ''; return { text: async () => t, size: t.length }; }
    async createWritable() { let buf = ''; const n = this.name; return { write: async x => { buf += String(x); }, close: async () => { window.__files[n] = buf; } }; } }
  window.showSaveFilePicker = async o => { const n = window.__pickAs || (o && o.suggestedName) || 'new.html'; window.__picks.push([o && o.suggestedName, n]);
    if (n in window.__files) window.__files[n] = '';     // Chromium empties an existing file the moment it is chosen
    return new H(n); }; });
// the picker stand-in's own self-test: choosing the existing source empties it before the page can read it
R.standin_empties = await p.evaluate(async () => { window.__pickAs = 'ORBIT Live.html'; const h = await window.showSaveFilePicker({ suggestedName: 'x.html' });
  const t = await (await h.getFile()).text(); window.__pickAs = null; return t.length === 0 && window.__files['ORBIT Live.html'] === ''; });
const before = await p.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k).length; } return o; });
dialogs.length = 0; const t1 = Date.now();
await p.setInputFiles('#fullFile', join(dir, 'ORBIT Live.html'));
for (let i = 0; i < 120 && !dialogs.some(d => /^alert/.test(d)); i++) await p.waitForTimeout(250);
await p.waitForTimeout(500);
R.import_ms = Date.now() - t1;
R.alert = (dialogs.find(d => /^alert/.test(d)) || '').slice(0, 220);
R.brads_alert = /^alert: Nothing was imported from “ORBIT Live\.html” — browser storage refused the cost estimates \(QuotaExceededError\)\.\n\nThis board is exactly as it was\.$/.test(R.alert || '');
const after = await p.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k).length; } return o; });
R.storage_byte_identical = JSON.stringify(before) === JSON.stringify(after);
R.unsaved_after_refusal = await p.evaluate(() => unsavedNow());     // item 140 (c): should be false
// THE CHECK'S FIRST ASSERTION: the refusal offers to write the imported board into a new file
R.offers_file_route = await p.evaluate(() => [...document.querySelectorAll('button')].some(x => /Write the imported board into a new file/.test(x.textContent)));
R.verdict_on_this_board = R.offers_file_route ? 'pass' : 'FAIL (no file route offered)';
await b.close();
console.log(JSON.stringify(R, null, 1));
