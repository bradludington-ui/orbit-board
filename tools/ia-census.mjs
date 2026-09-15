// IA CENSUS — what is clickable on this board, where it lives, and how it is grouped.
//
// This tool states FACTS and nothing else. It measures the information architecture as rendered in a
// real browser: every toolbar menu, every group label inside it, every item in order, what each item
// actually calls, whether it carries a hint, and where the surfaces live that items open. It makes
// no recommendation and passes no judgement -- a census that editorialises is one you cannot check.
//
// The nightly review reads this and proposes changes. Keeping the two apart is the point: a
// suggestion is only worth reading if the reader can see the evidence it was drawn from, and the
// person acting on it needs to know which parts were MEASURED and which were INFERRED.
//
//   node tools/ia-census.mjs                    human-readable
//   node tools/ia-census.mjs --json out.json    machine-readable, for the nightly agent
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const jsonAt = (() => { const i = process.argv.indexOf('--json'); return i > 0 ? process.argv[i + 1] : null; })();
const BOARD = process.env.BOARD_HTML || join(ROOT, 'prioritization-board-grid.html');
const src = readFileSync(join(ROOT, 'prioritization-board.html'), 'utf8');
// Measure a POPULATED board: the bare file has no requirements, so the surfaces that only exist
// beside data are not in the DOM to be measured or photographed.
import { buildPopulated } from './ia-fixture.mjs';
const LIVE = buildPopulated(BOARD);


// Menus are discovered from the DOM, not from a list here: a list of menus goes stale the day one is
// added, and a census that silently omits a menu is worse than no census.
const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto('file://' + LIVE);
await page.waitForFunction(() => typeof render === 'function', null, { timeout: 40000 });
await page.waitForTimeout(600);

const census = await page.evaluate(() => {
  const txt = e => (e.textContent || '').replace(/\s+/g, ' ').trim();
  // A menu is a toolbar container holding a button and a dropdown. Found structurally.
  const menus = [...document.querySelectorAll('[id^="m_"]')]
    .filter(c => c.querySelector('.mdd'))
    .map(c => {
      const btn = c.querySelector('button, .btn');
      const dd = c.querySelector('.mdd');
      const box = btn ? btn.getBoundingClientRect() : null;
      let group = '(ungrouped)', pos = 0;
      const groups = [], items = [];
      for (const el of dd.children) {
        const cls = el.className || '';
        if (cls.includes('mlbl')) { group = txt(el); if (!groups.includes(group)) groups.push(group); pos = 0; continue; }
        if (cls.includes('msep')) continue;
        if (!cls.includes('mi')) continue;
        // An item is <span.chk></span> LABEL TEXT <span.sub>hint</span>. The label is the element's
        // OWN text nodes: taking innerText and splitting on newlines ran the two together, which
        // reported every item as having no hint while the hint sat inside the label.
        const sub = el.querySelector('.sub');
        const label = [...el.childNodes].filter(n => n.nodeType === 3)
          .map(n => n.textContent).join(' ').replace(/\s+/g, ' ').trim();
        items.push({
          group, posInGroup: ++pos,
          label: label || txt(el),
          hint: sub ? txt(sub) : null,
          // EVERY item carries a .chk span; only a state-bearing one that is currently ON has a
          // tick in it (measured: 542 empty, 4 ticked). So this records "shows a tick right now",
          // which is a fact. It does NOT claim to identify toggles: an OFF toggle and a one-shot
          // action are identical in the DOM, and a census must not guess at what it cannot see.
          ticked: !!(el.querySelector('.chk') || {}).textContent?.trim(),
          action: el.getAttribute('onclick') || null,
          disabled: cls.includes('dis') || el.hasAttribute('disabled'),
        });
      }
      return {
        id: c.id, header: btn ? txt(btn) : null,
        x: box ? Math.round(box.x) : null, width: box ? Math.round(box.width) : null,
        groups, items,
      };
    });
  // Every panel the board can open, and whether anything visibly points at it.
  const panels = [...document.querySelectorAll('[id$="Panel"]')].map(p => p.id);
  // Row-level and panel-level clickables: what a user can click without opening a menu.
  const chips = [...document.querySelectorAll('[onclick]')]
    .filter(e => !e.closest('.mdd') && !e.id?.startsWith('m_'))
    .map(e => ({ tag: e.tagName, cls: (e.className || '').toString().slice(0, 40),
                 label: txt(e).slice(0, 40), action: (e.getAttribute('onclick') || '').slice(0, 60) }));
  return { menus, panels, chips };
});

await ctx.close(); await browser.close();

// ---- derived measurements (still facts, just counted) ---------------------------------------------
const allItems = census.menus.flatMap(m => m.items.map(i => ({ ...i, menu: m.header })));
// What a menu item actually calls. THE SHAPES ARE REAL AND THERE ARE THREE: `mRun(exportExcel)`
// passes the function by NAME with no call parens, `toggleMat()` calls directly, and
// `mRun(function(){ foo(); })` wraps a body. The first version stripped a leading "mRun(" and then
// looked for an identifier followed by "(", which matches NONE of the first shape -- so every export
// came back unreachable and `document.getElementById(...)` in an inline handler was reported as a
// menu item calling a function named getElementById. A census that invents fourteen orphans sends
// its reader hunting ghosts, which is worse than reporting nothing.
const fnOf = a => {
  const s = String(a || '').trim();
  let m = /^mRun\(\s*([A-Za-z0-9_$]+)\s*\)/.exec(s);                    // mRun(exportExcel)
  if (m) return m[1];
  m = /^mRun\(\s*function\s*\([^)]*\)\s*\{\s*([A-Za-z0-9_$]+)\s*\(/.exec(s);  // mRun(function(){ foo(
  if (m) return m[1];
  m = /^([A-Za-z0-9_$]+)\s*\(/.exec(s);                                  // toggleMat(...)
  return (m && m[1] !== 'mRun') ? m[1] : null;
};

const byAction = {};
for (const it of allItems) { const f = fnOf(it.action); if (f) (byAction[f] ||= []).push(`${it.menu} › ${it.label}`); }
const reachableTwice = Object.entries(byAction).filter(([, w]) => w.length > 1);

const labelCounts = {};
for (const it of allItems) {
  const k = it.label.replace(/^[^\w(]+/, '').toLowerCase().replace(/[….]+$/, '').trim();
  (labelCounts[k] ||= []).push(`${it.menu} › ${it.label}`);
}
const dupLabels = Object.entries(labelCounts).filter(([, w]) => w.length > 1);

// Menu items whose action the board does not define, and exported functions no menu reaches.
// `async function` counts as defined. Missing the keyword reported saveInPlace() -- the Save button
// on the toolbar -- as a menu item calling a function the board does not have.
const defined = new Set([...src.matchAll(/^(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/gm)].map(m => m[1]));
const deadActions = [...new Set(allItems.map(i => fnOf(i.action)).filter(f => f && !defined.has(f)))];
const exportFns = [...new Set([...src.matchAll(/^(?:async\s+)?function\s+(export[A-Za-z0-9_]*|execSynopsis)\s*\(/gm)].map(m => m[1]))];
// TWO DIFFERENT FINDINGS, and collapsing them reported six healthy exports as orphans. An export
// reached by a BUTTON but not by a menu item is an information-architecture observation -- worth a
// reviewer's attention, not a defect. An export reached by NOTHING clickable is a defect: a feature
// that exists and cannot be run. exportFlow is the first kind (onclick="exportFlow()" on a panel).
// A panel empties its innerHTML while closed, so its buttons are NOT in the DOM to be found -- the
// live sweep sees only what happens to be open. Reading the source's own handlers as well is what
// makes "nothing reaches this" a claim worth printing: exportFlow lives behind onclick="exportFlow()"
// on a panel that was shut when the page was measured, and six healthy exports were reported as
// orphans until this was added. A census must not assert absence it cannot actually observe.
const srcHandlers = new Set();
for (const m of src.matchAll(/on[a-z]+\s*=\s*(["'])([\s\S]*?)\1/g)) {
  for (const id of String(m[2]).matchAll(/([A-Za-z0-9_$]+)\s*[(),]/g)) srcHandlers.add(id[1]);
}
const clickableFns = new Set([...census.chips.map(c => fnOf(c.action)).filter(Boolean), ...srcHandlers]);
const onlyOutsideMenus = exportFns.filter(f => !byAction[f] && clickableFns.has(f));
const unreachableExports = exportFns.filter(f => !byAction[f] && !clickableFns.has(f));

const stats = census.menus.map(m => ({
  menu: m.header, id: m.id, x: m.x, width: m.width,
  items: m.items.length, groups: m.groups.length,
  ungrouped: m.items.filter(i => i.group === '(ungrouped)').length,
  largestGroup: Math.max(0, ...m.groups.map(g => m.items.filter(i => i.group === g).length)),
  noHint: m.items.filter(i => !i.hint).length,
  ticked: m.items.filter(i => i.ticked).length,
  disabled: m.items.filter(i => i.disabled).length,
  longestLabel: Math.max(0, ...m.items.map(i => i.label.length)),
}));

const out = {
  measuredAt: new Date().toISOString(), board: BOARD,
  totals: {
    menus: census.menus.length, items: allItems.length,
    groups: census.menus.reduce((a, m) => a + m.groups.length, 0),
    panels: census.panels.length, clickablesOutsideMenus: census.chips.length,
    itemsWithoutHint: allItems.filter(i => !i.hint).length,
  },
  menus: census.menus, stats,
  sameActionInTwoPlaces: reachableTwice.map(([f, w]) => ({ action: f, at: w })),
  duplicateLabels: dupLabels.map(([l, w]) => ({ label: l, at: w })),
  deadActions, unreachableExports, onlyOutsideMenus,
  panels: census.panels,
};

if (jsonAt) { writeFileSync(jsonAt, JSON.stringify(out, null, 2)); }

// ---- human-readable ------------------------------------------------------------------------------
const P = console.log;
P('IA CENSUS — what is clickable, where it lives, how it is grouped');
P('='.repeat(104));
P(`${out.totals.menus} menus · ${out.totals.items} menu items · ${out.totals.groups} groups · `
  + `${out.totals.panels} panels · ${out.totals.clickablesOutsideMenus} clickables outside the menus\n`);

P('PER MENU');
P('  ' + 'menu'.padEnd(16) + 'x'.padStart(5) + 'w'.padStart(5) + 'items'.padStart(7)
  + 'groups'.padStart(8) + 'ungrp'.padStart(7) + 'biggest'.padStart(9) + 'no hint'.padStart(9)
  + 'ticked'.padStart(8) + '  longest label');
for (const s of stats)
  P('  ' + String(s.menu).slice(0, 15).padEnd(16) + String(s.x).padStart(5) + String(s.width).padStart(5)
    + String(s.items).padStart(7) + String(s.groups).padStart(8) + String(s.ungrouped).padStart(7)
    + String(s.largestGroup).padStart(9) + String(s.noHint).padStart(9)
    + String(s.ticked).padStart(8) + '  ' + s.longestLabel);

P('\nGROUPING, MENU BY MENU');
for (const m of census.menus) {
  P(`\n  ${m.header}   (${m.items.length} items)`);
  let g = null;
  for (const it of m.items) {
    if (it.group !== g) { g = it.group; P(`    [${g}]`); }
    P(`      ${String(it.posInGroup).padStart(2)}. ${it.label}`
      + (it.ticked ? '  [on]' : '') + (it.disabled ? '  (disabled)' : '')
      + (it.hint ? `\n          ${it.hint}` : '   <- NO HINT'));
  }
}

const sect = (title, rows, fmt) => {
  P(`\n${title}`);
  if (!rows.length) { P('  none'); return; }
  rows.forEach(r => P('  ' + fmt(r)));
};
sect('THE SAME ACTION REACHABLE FROM MORE THAN ONE PLACE',
  out.sameActionInTwoPlaces, r => `${r.action}\n      ` + r.at.join('\n      '));
sect('LABELS THAT READ THE SAME IN TWO MENUS',
  out.duplicateLabels, r => `"${r.label}"\n      ` + r.at.join('\n      '));
sect('MENU ITEMS WHOSE ACTION THE BOARD DOES NOT DEFINE', out.deadActions, r => r);
sect('EXPORTS REACHABLE ONLY OUTSIDE THE TOOLBAR MENUS (a placement question, not a defect)',
  out.onlyOutsideMenus, r => r);
sect('EXPORTS NOTHING CLICKABLE REACHES (a feature that cannot be run)', out.unreachableExports, r => r);

P('\n' + '='.repeat(104));
P('This is a census. It measures and does not advise — the nightly review reads it and proposes.');
if (jsonAt) P(`json: ${jsonAt}`);
