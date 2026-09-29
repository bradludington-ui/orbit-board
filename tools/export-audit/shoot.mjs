// Render the real board in Chromium and photograph it.
//
//   node tools/export-audit/shoot.mjs <out.png> [--board FILE] [--tools] [--width N] [--full]
//
// Seeds the same kind of board the audits use, so the screenshot shows a populated dashboard
// rather than the empty shell. This is the only way to check anything about LAYOUT from here —
// the audits verify arithmetic and cannot see a panel at all.
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const out = args[0] || 'board.png';
const flag = n => args.includes('--' + n);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const BOARD = resolve(opt('board', join(HERE, '..', '..', 'prioritization-board-grid.html')));

const SVC = ['STOVL', 'USMC CV', 'USN'];
const mk = (id, grp, ask) => ({
  id, grp, team: grp, sect: '', custom: false,
  title: id, event: id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null,
});
const ITEMS = [
  mk('Engine depot overhaul', 'PSM', [42, 18, 26]),
  mk('Avionics spares replenishment', 'AV', [31, 22, 14]),
  mk('Airframe structural repair', 'ATL', [28, 11, 19]),
  mk('Support equipment refresh', 'MxS', [22, 9, 13]),
  mk('Training device sustainment', 'TSS', [17, 12, 8]),
  mk('Software maintenance release', 'CDS', [15, 7, 11]),
  mk('Tooling and GSE calibration', 'PP', [12, 6, 5]),
];

const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: Number(opt('width', 1500)), height: 1000 } });
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.setContent(readFileSync(BOARD, 'utf8'), { waitUntil: 'load' });

// NOTE: the board's globals are `const`/`let` declarations, which live in the global LEXICAL
// environment and are NOT properties of window. They must be reached by bare identifier, and the
// payload must not shadow their names.
await page.evaluate(({ svcList, itemList }) => {
  SVC.length = 0; svcList.forEach(s => SVC.push(s));
  DATA.services = SVC;
  if (typeof MS === 'undefined' || !MS) MS = { base: 2027, cur: 2027, ts: 0, years: {} };
  MS.cur = 2027; MS.base = 2027;
  const st = {
    order: itemList.map(i => i.id), alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [],
    discSvc: [95, 45, 60], mandSvc: [40, 20, 25],
  };
  MS.years['2027'] = st;
  applyState(st);
  DATA.items.length = 0; itemList.forEach(i => DATA.items.push(i));
  S.order = itemList.map(i => i.id);
  S.discSvc = [95, 45, 60]; S.mandSvc = [40, 20, 25];
  S.mc = { 'Engine depot overhaul': true, 'Airframe structural repair': true };
  render();
}, { svcList: SVC, itemList: ITEMS });

if (flag('tools')) { await page.evaluate(() => toggleMenu('tools')); }
await page.waitForTimeout(400);
await page.screenshot({ path: out, fullPage: flag('full') });
console.log(`${out}   ${errs.length ? 'page errors: ' + errs.slice(0, 2).join(' | ') : 'no page errors'}`);
await browser.close();
