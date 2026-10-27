// Skeptic's own repro: two tabs of ONE real Chromium context (one localStorage), the board's shared file on disk.
// Ann: unsaved note on R1 in tab 1. Kim saves the shared file. Ann opens the file in tab 2 (kept aside). Back in tab 1 Ann
// changes R2's allocation and description. Both tabs closed. Kim saves again. Ann opens the file next morning.
import { chromium } from '/home/user/orbit-board/node_modules/playwright-core/index.mjs';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { boot, seed } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
import { CHROME } from '/home/user/orbit-board/tools/chrome.mjs';
const W = '/tmp/claude-0/-home-user/792dafeb-d944-5a2a-8cfa-66d1840065b4/scratchpad/v209/';
const BOARDS = { fix: W + 'rev/board-d3ce17d.html', pre: W + 'rev/board-ba3c294.html', v208: W + 'board-ebe702e.html' };
const WHICH = process.env.WHICH || 'fix', BOARD = BOARDS[WHICH];
const HERE = '/tmp/claude-0/-home-user/792dafeb-d944-5a2a-8cfa-66d1840065b4/scratchpad/v209/rev3/save/skeptic-two-tabs-unsaved-work-recorded-clean/';
const dir = mkdtempSync(HERE + 'ch-');
const SVC = ['USAF', 'ANG'];
const items = ['R1', 'R2', 'R3'].map((id, i) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Req ' + id, event: 'E-' + id, ccar: '', fy26: [0, 0], ask: [400000 * (i + 1), 50000], alloc: null }));
const b0 = boot({ html: readFileSync(BOARD, 'utf8') });
seed(b0.ev, { services: SVC, items, disc: [1500000, 60000], mand: [500000, 0], order: items.map(x => x.id) });
b0.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`);
const F0 = b0.ev('buildSavedHtml()');
const kim = boot({ html: F0 }); kim.ev(`try{ localStorage.setItem('prio27who','Kim'); }catch(e){} 'ok'`);
const file = join(dir, 'shared-board.html');
writeFileSync(file, F0);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: CHROME, args: ['--allow-file-access-from-files'] });
const ctx = await br.newContext();
const open = async () => { const pg = await ctx.newPage(); pg.on('dialog', d => d.accept()); await pg.goto('file://' + file); await pg.waitForTimeout(900); return pg; };
const state = pg => pg.evaluate(() => {
  const k = _AP.key, st = JSON.parse(localStorage.getItem(k) || 'null'), kr = localStorage.getItem(k + '.kept');
  const ks = kr ? JSON.parse(kr.slice(kr.indexOf('\n') + 1)) : null;
  const y = s => s ? (s.years[s.cur] || {}) : {};
  const al = s => { const a = (y(s).alloc || {}).R2; return a == null ? null : JSON.stringify(a); };
  return { screen: { noteR1: (S.desc || {}).R1 || null, descR2: (S.desc || {}).R2 || null, allocR2: S.alloc && S.alloc.R2 ? JSON.stringify(S.alloc.R2) : null, kimA: (S.desc || {}).R3 || null },
    storage: { descR1: (y(st).desc || {}).R1 || null, descR2: (y(st).desc || {}).R2 || null, allocR2: al(st) },
    kept: ks ? { descR1: (y(ks).desc || {}).R1 || null, descR2: (y(ks).desc || {}).R2 || null, allocR2: al(ks) } : null,
    base: localStorage.getItem(k + '.base'), baseDirtyCached: _baseDirty, DIRTY };
});
const line = pg => pg.evaluate(() => (document.getElementById('shareStat') || {}).textContent || '');
// day 1, tab 1
const t1 = await open();
await t1.evaluate(() => { localStorage.setItem('prio27who', 'Ann'); setDesc('R1', 'ANN-1 unsaved'); });
console.log(WHICH, '[a] tab 1 after first edit:', JSON.stringify(await state(t1)));
await sleep(40); kim.ev(`setDesc('R3','KIM-1'); 'ok'`); writeFileSync(file, kim.ev('buildSavedHtml()'));
const t2 = await open();
console.log(WHICH, '[b] tab 2 opened Kim-1:', JSON.stringify(await state(t2)));
console.log(WHICH, '    tab 2 line:', (await line(t2)).slice(0, 220));
// back in tab 1 (still showing ANN-1)
await t1.bringToFront();
await t1.evaluate(() => { setDesc('R2', 'ANN-2 typed in tab 1 after'); try{ setAlloc('R2', '123456'); }catch(e){} });
console.log(WHICH, '[c] tab 1 after second edit:', JSON.stringify(await state(t1)));
await t2.close(); await t1.close();
await sleep(40); kim.ev(`setDesc('R3','KIM-2'); 'ok'`); writeFileSync(file, kim.ev('buildSavedHtml()'));
const t3 = await open();
console.log(WHICH, '[d] next opening of Kim-2:', JSON.stringify(await state(t3)));
console.log(WHICH, '    line:', (await line(t3)).slice(0, 260));
// does anything still hold ANN-2? (all storage keys scanned)
const anywhere = await t3.evaluate(() => { const o = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if ((localStorage.getItem(k) || '').includes('ANN-2')) o.push(k); } return o; });
console.log(WHICH, '    keys holding ANN-2:', JSON.stringify(anywhere));
// before any action: edit one thing in tab 3, then check again
await t3.evaluate(() => { setDesc('R3', 'ANN edits Kim-2'); });
const after = await t3.evaluate(() => { const o = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if ((localStorage.getItem(k) || '').includes('ANN-2')) o.push(k); } return o; });
console.log(WHICH, '[e] after one edit in tab 3, keys holding ANN-2:', JSON.stringify(after));
await br.close();
rmSync(dir, { recursive: true, force: true });
