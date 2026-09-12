// What can you actually DO to a requirement row? Enumerate it from the rendered page rather than
// from anyone's memory of the template, so "the grid keeps every control the cards had" is a
// measured claim. Also useful on its own: it is the inventory of the row's affordances.
//
//   node tools/row-controls.mjs [path-to-html]           print the inventory
//   node tools/row-controls.mjs --diff A.html B.html     compare two builds
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';

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
  return page.evaluate(() => {
    const row = document.getElementById('row-A');
    if (!row) return null;
    const out = [];
    row.querySelectorAll('*').forEach(el => {
      const interactive = el.tagName === 'BUTTON' || el.tagName === 'INPUT' || el.tagName === 'SELECT'
        || el.hasAttribute('onclick') || el.hasAttribute('onchange') || el.hasAttribute('draggable');
      if (!interactive) return;
      // Identify by what it DOES, not where it sits: the handler name plus its label. A control
      // that moves to another column is the same control; one whose handler vanished is not.
      const h = (el.getAttribute('onclick') || el.getAttribute('onchange') || '')
        .replace(/'[^']*'/g, "'…'").replace(/\s+/g, ' ').trim();
      out.push([el.tagName.toLowerCase(), h || '(' + (el.getAttribute('draggable') ? 'draggable' : el.type || '') + ')',
                (el.getAttribute('title') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 44)].join(' | '));
    });
    return out.sort();
  });
}

const args = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1700, height: 1000 } });

if (args[0] === '--diff') {
  const a = await inventory(page, resolve(args[1])); const b = await inventory(page, resolve(args[2]));
  if (!a || !b) { console.error('row-A did not render in one of the builds'); process.exit(2); }
  const sa = new Set(a), sb = new Set(b);
  const lost = a.filter(x => !sb.has(x)), gained = b.filter(x => !sa.has(x));
  console.log(`\nrow controls — ${args[1].split('/').pop()} vs ${args[2].split('/').pop()}`);
  console.log(`  ${a.length} controls before · ${b.length} after`);
  if (lost.length)   { console.log(`\n  LOST (${lost.length}) —`);   lost.forEach(x => console.log('    FAIL  ' + x)); }
  if (gained.length) { console.log(`\n  added (${gained.length}) —`); gained.forEach(x => console.log('    new   ' + x)); }
  await browser.close();
  if (lost.length) { console.log('\n  the grid build must not drop a control the cards had\n'); process.exit(1); }
  console.log('\n  no control lost\n');
} else {
  const file = args[0] || HERE + '../prioritization-board.html';
  const inv = await inventory(page, resolve(file));
  console.log(`\n${inv.length} interactive controls on a requirement row:\n`);
  inv.forEach(x => console.log('  ' + x));
  await browser.close();
}
