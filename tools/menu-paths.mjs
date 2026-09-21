// A MESSAGE THAT NAMES A MENU PATH MUST NAME ONE THAT EXISTS.
//
// "Put your name in first — ⚒ Tools › ✎ My editor name…" sent every programme office to the one
// menu without that entry, on the FIRST step of the submittal workflow: the item lives in
// 📁 File › Team. Two more pointed at ⬇ Export for items that are in ⚒ Tools. Nothing could catch
// these, because a menu path in a string is just a string -- until you open the menu and look.
//
// This opens every toolbar menu in a real browser, reads what is actually in it, and then checks
// every "<menu> › <item>" reference in the source against that.
//
//   node tools/menu-paths.mjs
import { chromium } from 'playwright-core';
import { boot, seed } from './export-audit/boot.mjs';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SVCN = ['USAF', 'ANG', 'AFRC'];
const items = Array.from({ length: 8 }, (_, i) => ({
  id: 'R' + i, grp: ['PSM', 'ATL'][i % 2], team: 't', sect: '', custom: false,
  title: 'Requirement ' + i, event: 'Ev ' + i, ccar: 'CC' + i,
  fy26: SVCN.map(() => 0), ask: SVCN.map((_, j) => (i + 1) * (j + 1) * 100000), alloc: null }));
const sc = { services: SVCN, items, disc: [5000000, 1000000, 500000],
             mand: [1000000, 300000, 200000], order: items.map(x => x.id), mc: { R0: true } };

// The toolbar menus, by the label a message would use for each.
const MENUS = {
  'Tools':       'm_tools',
  'Export':      'm_export',
  'File':        'm_share',
  'Filter':      'm_view',
  'Active year': 'm_ay',
  'Budget year': 'm_by',
  'FYDP':        'm_fydp',
  'PMO':         'm_pmo',
};
// The source stores these as escape sequences inside string literals, so decode before comparing.
// Otherwise the check reports an item missing from a menu that plainly contains it, and a check
// that cries wolf is a check that gets switched off.
const unesc = s => s
  .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
// Keep letters, digits and the few marks an item name really uses; drop emoji, the separator,
// ellipses, quotes and any markup the string was embedded in.
const strip = s => unesc(s)
  .replace(/<\/?[a-z]+>/gi, ' ')
  .replace(/[^\p{L}\p{N} ()\/&-]/gu, ' ')
  .replace(/\s+/g, ' ').trim();

let bad = 0;
const chk = (what, ok, detail) => { if (!ok) bad++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? '   ' + detail : ''}`); };

const dir = mkdtempSync(join(tmpdir(), 'spmt-menu-'));
process.on('exit', () => { try { rmSync(dir, { recursive: true, force: true }); } catch {} });   // the copies are scratch; leave nothing behind
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
                                  args: ['--no-sandbox'] });
for (const f of ['prioritization-board.html', 'prioritization-board-grid.html']) {
  console.log('\n' + f);
  const src = readFileSync(resolve(ROOT, f), 'utf8');
  const { ev } = boot({ html: src });
  seed(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      applyState(S); save(); 'ok'`);
  const file = join(dir, f);
  writeFileSync(file, ev('buildSavedHtml()'));

  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  await p.goto('file://' + file);
  await p.waitForFunction(() => typeof render === 'function' && document.querySelectorAll('.row').length > 0,
    null, { timeout: 40000 });
  // What each menu actually contains, read from the rendered dropdown.
  const contents = await p.evaluate(ids => {
    const out = {};
    for (const [label, id] of Object.entries(ids)) {
      const c = document.getElementById(id);
      out[label] = c ? (c.textContent || '').replace(/\s+/g, ' ') : null;
    }
    return out;
  }, MENUS);
  await ctx.close();

  for (const [label, id] of Object.entries(MENUS))
    chk(`the ${label} menu is on the toolbar`, contents[label] !== null, contents[label] === null ? '#' + id + ' missing' : '');

  // Every "<menu> › <item>" the source tells a reader to follow.
  const refs = [];
  const RE = new RegExp('(' + Object.keys(MENUS).join('|') + ')\\s*\\\\u203a\\s*([^\'"]{3,50})', 'g');
  let m;
  while ((m = RE.exec(src))) {
    const menu = m[1];
    // The item name ends at the first sentence break or markup.
    // Cut at the end of the item name: a sentence break, markup, or a dash introducing prose.
    const item = strip(m[2].split(/\\n|<\/b>|\. |, and |\\u2014|—/)[0]).slice(0, 40);
    if (item.length >= 3) refs.push({ menu, item });
  }
  chk('the source names at least one menu path', refs.length > 0, refs.length + ' reference(s)');
  const seen = new Set();
  for (const { menu, item } of refs) {
    const key = menu + '|' + item;
    if (seen.has(key)) continue;
    seen.add(key);
    const have = strip(contents[menu] || '');
    // Match on the item's first few words: the message may abbreviate the rest.
    const needle = strip(item).split(' ').slice(0, 3).join(' ');
    chk(`"${menu} › ${item}" is really in that menu`,
      needle.length >= 3 && have.toLowerCase().includes(needle.toLowerCase()),
      needle.length >= 3 ? '' : 'could not read an item name');
  }
}
await b.close();
console.log(bad ? `\n${bad} menu-path check(s) failed\n` : '\nEvery menu path a message names is really in that menu\n');
process.exit(bad ? 1 : 0);
