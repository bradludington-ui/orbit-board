// What can you actually DO to a requirement? Enumerate it from the rendered page rather than from
// anyone's memory of the template, and hold it against a RECORDED list, so "no control vanished"
// is a measured claim. Also useful on its own: it is the inventory of a requirement's affordances.
//
// SCOPE IS THE REQUIREMENT, NOT THE ROW. The grid build keeps every edit of the selected
// requirement on the docked RECORD inspector, so the inventory counts the row plus the inspector --
// exactly the surface a user reaches for one requirement. A control that moves is fine; one whose
// handler vanished is not.
//
// ONE BUILD SINCE v1.88. This used to compare the card build against the grid build. With the card
// build retired, the grid is held against its own recorded list (tools/row-controls.json): a control
// that disappears, or one that appears without being recorded, fails. A deliberate change is made
// by re-recording, which puts the before and after in the commit's diff.
//
//   node tools/row-controls.mjs [--board FILE]            print the inventory
//   node tools/row-controls.mjs --check [--board FILE]    compare against the recorded list
//   node tools/row-controls.mjs --record [--board FILE]   write the recorded list (a deliberate change)
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const HERE = new URL('.', import.meta.url).pathname;

const it = (id, grp, title, ask) => ({ id, grp, team: grp, sect: '', custom: false, title,
  event: title, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
const SEED = {
  services: ['STOVL', 'USMC CV', 'USN'],
  items: [it('A', 'PSM', 'Engine depot overhaul', [42, 18, 26]),
          it('B', 'AV', 'Avionics spares replenishment', [31, 22, 14]),
          it('C', 'ATL', 'Airframe structural repair', [28, 11, 19]),
          it('D', 'MxS', 'Support equipment refresh', [22, 9, 13])],
  disc: [100, 45, 55], mand: [40, 20, 25], order: ['A', 'B', 'C', 'D'], mc: { A: true, C: true },
};

async function inventory(page, file) {
  await page.goto('file://' + file);
  await page.evaluate(() => localStorage.setItem('spmtTheme', 'harbor'));
  await page.reload();
  await page.waitForTimeout(600);
  await page.evaluate(sc => {
    SVC.length = 0; sc.services.forEach(s => SVC.push(s)); DATA.services = SVC;
    MS.cur = 2027; MS.base = 2027;
    const st = { order: sc.order, alloc: {}, mc: sc.mc, fsrc: {}, custom: [], removed: [],
                 discSvc: sc.disc, mandSvc: sc.mand };
    MS.years['2027'] = st; applyState(st);
    DATA.items.length = 0; sc.items.forEach(i => DATA.items.push(i));
    S.discSvc = sc.disc; S.mandSvc = sc.mand; S.order = sc.order;
    S.fsrc = {}; S.mc = sc.mc; S.alloc = {};
    render();
  }, SEED);
  await page.waitForTimeout(300);
  // Row A is the first row and is Mission Critical, so its inventory includes the MC-on state.
  // Select row A so the inspector is showing it, then read both surfaces as one inventory.
  await page.evaluate(() => { if (typeof setCur === 'function') setCur('A'); });
  await page.waitForTimeout(200);
  return page.evaluate(() => {
    const row = document.getElementById('row-A');
    if (!row) return null;
    const out = [];
    const insp = document.getElementById('inspector');
    const scope = insp ? [row, insp] : [row];
    scope.forEach(r => r.querySelectorAll('*').forEach(el => {
      const interactive = el.tagName === 'BUTTON' || el.tagName === 'INPUT' || el.tagName === 'SELECT'
        || el.hasAttribute('onclick') || el.hasAttribute('onchange') || el.hasAttribute('draggable');
      if (!interactive) return;
      // Identify by what it DOES, not where it sits: the handler name plus its label. A control
      // that moves to another column is the same control; one whose handler vanished is not.
      const h = (el.getAttribute('onclick') || el.getAttribute('onchange') || '')
        .replace(/'[^']*'/g, "'…'").replace(/\s+/g, ' ').trim();
      out.push([el.tagName.toLowerCase(), h || '(' + (el.getAttribute('draggable') ? 'draggable' : el.type || '') + ')',
                (el.getAttribute('title') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 44)].join(' | '));
    }));
    return out.sort();
  });
}

const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const FILE = resolve(opt('--board') || HERE + '../prioritization-board-grid.html');
const RECORD = HERE + 'row-controls.json';
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1700, height: 1000 } });
const inv = await inventory(page, FILE);
await browser.close();
if (!inv) { console.error('row-A did not render'); process.exit(2); }

// Compare on the HANDLER, not the whole line: a control that is re-worded or moved is the same
// control while it still calls the same function. Every quoted argument is folded, so an id or a
// field name in a handler never makes two builds of the same control look different. A MULTISET,
// not a set: the split editor carries two inputs per service with the same handler, and losing one
// of the pair is losing a control.
const fold = h => h.replace(/"[^"]*"/g, '"…"').replace(/'[^']*'/g, "'…'");
const unwrap = h => { const m = /^rowMenuRun\([^,]+,\(\)=>\{(.+)\}\)$/.exec(h); return m ? m[1].trim() : h; };
const fn = x => fold(unwrap(x.split(' | ')[1]));
const tally = list => list.reduce((m, x) => (m[fn(x)] = (m[fn(x)] || 0) + 1, m), {});
const build = (/const BUILD='([^']+)'/.exec(readFileSync(FILE, 'utf8')) || [])[1] || '?';

if (args.includes('--record')) {
  writeFileSync(RECORD, JSON.stringify({ note: 'The controls a user reaches for ONE requirement (row + RECORD '
    + 'inspector) on the grid build, seeded with the row-controls.mjs fixture. Written by `node tools/row-controls.mjs '
    + '--record`; checked by `npm run controls`. Re-record only for a deliberate change, and say why in the commit.',
    board: FILE.split('/').pop(), build, controls: inv }, null, 1) + '\n');
  console.log(`\nrecorded ${inv.length} controls from ${FILE.split('/').pop()} (${build}) -> tools/row-controls.json\n`);
} else if (args.includes('--check')) {
  let rec = null;
  try { rec = JSON.parse(readFileSync(RECORD, 'utf8')); } catch { rec = null; }
  if (!rec || !Array.isArray(rec.controls)) { console.log('\n  FAIL  tools/row-controls.json is missing or unreadable\n'); process.exit(1); }
  const was = tally(rec.controls), now = tally(inv);
  const lost = [], added = [];
  for (const k of new Set([...Object.keys(was), ...Object.keys(now)])) {
    const d = (now[k] || 0) - (was[k] || 0);
    if (d < 0) lost.push([k, -d]); else if (d > 0) added.push([k, d]);
  }
  console.log(`\nrequirement controls — ${FILE.split('/').pop()} (${build}) against the list recorded from ${rec.build}`);
  console.log(`  ${rec.controls.length} recorded · ${inv.length} now`);
  if (lost.length)  { console.log(`\n  LOST (${lost.length}) —`);  lost.forEach(([k, n]) => console.log(`    FAIL  ${k}${n > 1 ? '  ×' + n : ''}`)); }
  if (added.length) { console.log(`\n  NOT RECORDED (${added.length}) —`); added.forEach(([k, n]) => console.log(`    FAIL  ${k}${n > 1 ? '  ×' + n : ''}`)); }
  if (lost.length || added.length) {
    console.log('\n  a requirement control changed. If that was deliberate, re-record with');
    console.log('  `node tools/row-controls.mjs --record` and say why in the commit; if not, it is a lost control.\n');
    process.exit(1);
  }
  console.log('\n  every recorded control is present, and nothing unrecorded appeared\n');
} else {
  console.log(`\n${inv.length} interactive controls on a requirement row:\n`);
  inv.forEach(x => console.log('  ' + x));
}
