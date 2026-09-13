// What can you actually DO to a requirement? Enumerate it from the rendered page rather than from
// anyone's memory of the template, so "the grid keeps every control the cards had" is a measured
// claim. Also useful on its own: it is the inventory of a requirement's affordances.
//
// SCOPE IS THE REQUIREMENT, NOT THE ROW. The grid build moved every edit of the selected
// requirement onto the docked RECORD inspector, so comparing row-to-row reported relocated
// controls as lost. What must never happen is a control disappearing from the BUILD, so the grid
// side counts the row plus the inspector -- which is exactly the surface a user reaches for one
// requirement. A control that moves is fine; one whose handler vanished is not.
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
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1700, height: 1000 } });

if (args[0] === '--diff') {
  const a = await inventory(page, resolve(args[1])); const b = await inventory(page, resolve(args[2]));
  if (!a || !b) { console.error('row-A did not render in one of the builds'); process.exit(2); }
  // Compare on the HANDLER, not the whole line: a control that moved to the inspector is wrapped
  // in different markup and re-worded, but it is the same control while it still calls the same
  // function. A handler that appears on neither surface is a control the build lost.
  // rowMenuRun(id, ()=>{X}) is only the menu's invocation wrapper -- the control is X. Unwrap it so
  // a control that moved OUT of the menu still matches the one that used to sit in it.
  const unwrap = h => { const m = /^rowMenuRun\([^,]+,\(\)=>\{(.+)\}\)$/.exec(h);
                        return m ? m[1].trim() : h; };
  const fn = x => unwrap(x.split(' | ')[1]);
  // Controls the grid build RETIRED rather than moved. Named with a reason, so a disappearance is
  // a decision on the record rather than something a loose comparison quietly absorbed.
  // Controls the grid REPLACED with a different handler that does the same job. The capability has
  // to still be present -- the replacement is looked up in the other build, so this cannot hide a
  // control that simply vanished.
  const REPLACED = {};
  REPLACED['toggleChip("fund","A",event)'] = ["setFsrc('\u2026','\u2026')",
    'the row picker offered one option once auto (lanes) was dropped, so the inspector converts a '
    + 'requirement to Split in a single click instead'];
  const RETIRED = {};
  RETIRED["toggleDetail('\u2026')"] = 'the row expander is retired in the grid build; everything it '
    + 'edited moved to the docked inspector, so the disclosure toggle has nothing left to disclose';
  const sa = new Set(a.map(fn)), sb = new Set(b.map(fn));
  const replacedBy = x => { const r = REPLACED[fn(x)]; return (r && sb.has(r[0])) ? r : null; };
  const lost     = a.filter(x => !sb.has(fn(x)) && !RETIRED[fn(x)] && !replacedBy(x));
  const retired  = a.filter(x => !sb.has(fn(x)) &&  RETIRED[fn(x)]);
  const replaced = a.filter(x => !sb.has(fn(x)) && !RETIRED[fn(x)] &&  replacedBy(x));
  const gained  = b.filter(x => !sa.has(fn(x)));
  console.log(`\nrow controls — ${args[1].split('/').pop()} vs ${args[2].split('/').pop()}`);
  console.log(`  ${a.length} controls before · ${b.length} after`);
  if (lost.length)   { console.log(`\n  LOST (${lost.length}) —`);   lost.forEach(x => console.log('    FAIL  ' + x)); }
  if (retired.length){ console.log(`\n  retired on purpose (${retired.length}) —`);
    retired.forEach(x => console.log('    ok    ' + x + '\n            ' + RETIRED[fn(x)])); }
  if (replaced.length){ console.log(`\n  replaced (${replaced.length}) —`);
    replaced.forEach(x => console.log('    ok    ' + x + '\n            → ' + replacedBy(x)[0]
      + '  ' + replacedBy(x)[1])); }
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
