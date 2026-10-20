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
import { CHROME } from './chrome.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const SVCN = ['USAF', 'ANG', 'AFRC'];
const items = Array.from({ length: 8 }, (_, i) => ({
  id: 'R' + i, grp: ['PSM', 'ATL'][i % 2], team: 't', sect: '', custom: false,
  title: 'Requirement ' + i, event: 'Ev ' + i, ccar: 'CC' + i,
  fy26: SVCN.map(() => 0), ask: SVCN.map((_, j) => (i + 1) * (j + 1) * 100000), alloc: null }));
const sc = { services: SVCN, items, disc: [5000000, 1000000, 500000],
             mand: [1000000, 300000, 200000], order: items.map(x => x.id), mc: { R0: true } };

// The toolbar menus, by the label a message would use for each.
// v1.90 (item 27): the Active year, Budget year, FYDP, Tools and Export menus became Reports & exports,
// Data and Setup, and the mode tools in the task bar (t_*), which are always in the page.
// v2.00 (menu, 19 Oct): Reports & exports, Data, Setup and File left the toolbar for the LEFT MENU, and each item of File
// went to one place there: Imports & exports, Program offices, Audit, History & recovery, Setup, or Save's ▾. A path names
// the left-menu entry; what it holds is read from the list the board draws for it (a box's or a flyout's), and FYDP ▸,
// Execution ▸ and History & recovery ▸, which draw their own, are drawn into the page to be read (FLYDRAW).
const MENUS = {
  'Reports &amp; exports': 'dd_reports',
  'Reports & exports':     'dd_reports',
  'Data':        'dd_data',
  'Setup':       'dd_setup',
  'Imports &amp; exports': 'dd_boards',
  'Imports & exports':     'dd_boards',
  'Program offices':       'dd_offices',
  'Audit':       'dd_audit',
  'History &amp; recovery': 'mp_fly_hist',
  'History & recovery':     'mp_fly_hist',
  'FYDP':        'mp_fly_fydp',
  'Execution':   'mp_fly_exec',
  'Filter':      'm_view',
  'PMO':         'm_pmo',
  'Fiscal year': 'm_fy',
  'Spend plan basis': 'm_basis',
  'Review':      't_review',
  'Rank':        't_rank',
  'Fund':        't_fund',
  'Compare':     't_compare',
  'Brief':       't_brief',
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
  .replace(/&amp;/g, '&')   // messages written as HTML spell & as &amp;
  .replace(/<\/?[a-z]+>/gi, ' ')
  .replace(/[^\p{L}\p{N} ()\/&-]/gu, ' ')
  .replace(/\s+/g, ' ').trim();

// v2.00 (menu): the left menu's flyouts that draw their own items (uiFlyItems), drawn into hidden lists in the page so a path
// to them is read like any other; History & recovery's own list holds the work kept aside it shows (dd_kept)
const FLYDRAW = () => { if (typeof uiFlyItems !== 'function') return;
  ['fydp', 'exec', 'hist'].forEach(k => { let d = document.getElementById('mp_fly_' + k);
    if (!d) { d = document.createElement('div'); d.id = 'mp_fly_' + k; d.hidden = true; document.body.appendChild(d); }
    d.innerHTML = uiFlyItems(k);
    d.querySelectorAll('[data-host]').forEach(h => { const src = document.getElementById(h.getAttribute('data-host')); h.innerHTML = src ? src.innerHTML : ''; }); }); };
// v1.96 (item 65): a menu as a person meets it -- the items on it, and its folded groups by title.
// v2.00 (menu): and a box's sections (Reports & exports' six groups, laid out side by side) by their headings.
const READ_SHAPE = ids => {
  const out = {};
  for (const [label, id] of Object.entries(ids)) {
    const c = document.getElementById(id); if (!c) { out[label] = null; continue; }
    const clone = c.cloneNode(true); clone.querySelectorAll('.gbody, .gh').forEach(e => e.remove());
    out[label] = { top: (clone.textContent || '').replace(/\s+/g, ' '),
      groups: [...c.querySelectorAll('.gh')].map(h => { const b = document.getElementById(h.getAttribute('aria-controls'));
        return { title: (h.querySelector('span:nth-child(2)') || h).textContent, text: b ? (b.textContent || '').replace(/\s+/g, ' ') : '' }; })
        .concat([...c.querySelectorAll('.uiRs')].map(x => ({ title: (x.querySelector('h4') || x).textContent, text: (x.textContent || '').replace(/\s+/g, ' ') }))) };
  }
  return out;
};
// Is <item> where the path says? With a group named, the item must be in that group; with none, it must be on the menu
// itself -- a path to a folded item that does not name its group sends the reader to an item they cannot see.
const placed = (sh, group, item) => {
  if (!sh) return 'no such menu';
  const needle = strip(item).split(' ').slice(0, 3).join(' ').toLowerCase();
  if (needle.length < 3) return 'could not read an item name';
  const inG = sh.groups.filter(g => strip(g.text).toLowerCase().includes(needle));
  if (group) {
    const g = sh.groups.find(x => strip(x.title).toLowerCase().startsWith(strip(group).toLowerCase()));
    if (!g) return 'the menu has no group "' + strip(group) + '"' + (sh.groups.length ? ' (it has: ' + sh.groups.map(x => strip(x.title)).join(', ') + ')' : '');
    return strip(g.text).toLowerCase().includes(needle) ? '' : 'not in "' + strip(g.title) + '"' + (inG.length ? ' but in "' + strip(inG[0].title) + '"' : '');
  }
  if (strip(sh.top).toLowerCase().includes(needle)) return '';
  return inG.length ? 'it is folded under "' + strip(inG[0].title) + '": the path must name that group' : 'not in that menu';
};

let bad = 0;
const chk = (what, ok, detail) => { if (!ok) bad++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? '   ' + detail : ''}`); };

const dir = mkdtempSync(join(tmpdir(), 'spmt-menu-'));
process.on('exit', () => { try { rmSync(dir, { recursive: true, force: true }); } catch {} });   // the copies are scratch; leave nothing behind
const b = await chromium.launch({ executablePath: CHROME,
                                  args: ['--no-sandbox'] });
for (const f of ['prioritization-board-grid.html']) {
  console.log('\n' + f);
  const src = readFileSync(resolve(ROOT, f), 'utf8');
  const { ev } = boot({ html: src });
  seed(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      applyState(S); save(); 'ok'`);
  const file = join(dir, f);
  writeFileSync(file, ev('buildSavedHtml()'));
  // and a PMO copy of it, published the way the menu publishes one: the guide's office part names
  // the copy's controls, and some of them -- ✉ Submit input under File, the bar's buttons -- exist
  // only in a copy
  const copyHtml = ev(`(function(){ let cap=null; const _B=window.Blob;
    window.Blob=function(pt,o){ if(!cap && o && o.type==='text/html') cap=String(pt[0]); return new _B(pt,o); };
    window.confirm=function(){ return true; }; try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
    try{ publishPmoCopy(); }catch(e){} window.Blob=_B; return cap||''; })()`);
  const copyFile = join(dir, 'copy-' + f);
  writeFileSync(copyFile, copyHtml);

  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  await p.goto('file://' + file);
  await p.waitForFunction(() => typeof render === 'function' && document.querySelectorAll('.row').length > 0,
    null, { timeout: 40000 });
  // What each menu actually contains, read from the rendered dropdown -- and, since v1.96 (item 65), which items sit in a
  // folded group and which are on the menu itself. A folded group's items are in the page, hidden, until it opens.
  await p.evaluate(`(${FLYDRAW.toString()})()`);
  const contents = await p.evaluate(ids => {
    const out = {};
    for (const [label, id] of Object.entries(ids)) {
      const c = document.getElementById(id);
      out[label] = c ? (c.textContent || '').replace(/\s+/g, ' ') : null;
    }
    return out;
  }, MENUS);
  const shape = await p.evaluate(READ_SHAPE, MENUS);
  await ctx.close();

  for (const [label, id] of Object.entries(MENUS))
    chk(`the ${label} menu is in the page`, contents[label] !== null, contents[label] === null ? '#' + id + ' missing' : '');

  // Every "<menu> › <item>" the source tells a reader to follow.
  const refs = [];
  const RE = new RegExp('(' + Object.keys(MENUS).map(k => k.replace(/[&;]/g, c => '\\' + c)).join('|') + ')\\s*\\\\u203a\\s*([^\'"]{3,110})', 'g');
  let m;
  while ((m = RE.exec(src))) {
    const menu = m[1];
    // v1.96 (item 65): "<menu> › <group> › <item>" names the group an item is folded in
    const parts = m[2].split(/\s*\\u203a\s*/);
    const group = parts.length > 1 ? strip(parts[0]) : null;
    // The item name ends at the first sentence break or markup.
    // Cut at the end of the item name: a sentence break, markup, or a dash introducing prose.
    const item = strip(parts[parts.length - 1].split(/\\n|<\/b>|\. |, and |\\u2014|—/)[0]).slice(0, 40);
    if (item.length >= 3) refs.push({ menu, group, item });
  }
  chk('the source names at least one menu path', refs.length > 0, refs.length + ' reference(s)');
  const seen = new Set();
  for (const { menu, group, item } of refs) {
    const key = menu + '|' + group + '|' + item;
    if (seen.has(key)) continue;
    seen.add(key);
    // Match on the item's first few words: the message may abbreviate the rest.
    const why = placed(shape[menu], group, item);
    chk(`"${menu} › ${group ? group + ' › ' : ''}${item}" is really there`, !why, why);
  }

  // THE GUIDE INSIDE THE FILE (v1.86) NAMES MENU PATHS AND BUTTONS, and each must exist in this build:
  // the portfolio team's part on the board, the offices' part in a PMO copy. It is marked up for this:
  // a path is .mp with the menu in data-m and the item after its last "›"; a button is .bt, found by
  // data-q. Checked against the rendered page, both builds. It must also never open by itself.
  for (const [where, url, part] of [['board', file, 'team'], ['PMO copy', copyFile, 'office']]) {
    const ctx2 = await b.newContext({ viewport: { width: 1920, height: 1080 } });
    const p2 = await ctx2.newPage();
    await p2.goto('file://' + url);
    await p2.waitForFunction(() => typeof render === 'function' && document.querySelectorAll('.row').length > 0, null, { timeout: 40000 });
    await p2.waitForTimeout(300);
    await p2.evaluate(`(${FLYDRAW.toString()})()`);
    // v2.00 (menu): a guide path's data-m names a toolbar menu (m_<data-m>) or a left-menu entry, read from its list
    const LEFTM = { rep: 'dd_reports', data: 'dd_data', setup: 'dd_setup', imp: 'dd_boards', offices: 'dd_offices', aud: 'dd_audit',
                    hist: 'mp_fly_hist', fydp: 'mp_fly_fydp', exec: 'mp_fly_exec' };
    const g = await p2.evaluate(([part, LEFTM]) => {
      const shut = !/\bopen\b/.test((document.getElementById('helpPanel') || {}).className || '');
      const secs = (typeof helpSections === 'function') ? helpSections().filter(s => s.part === part) : [];
      const menus = {}; document.querySelectorAll('.menu').forEach(m => { menus[m.id] = (m.textContent || '').replace(/\s+/g, ' '); });
      const ids = {}; document.querySelectorAll('.menu[id]').forEach(m => { ids[m.id] = m.id; });
      Object.entries(LEFTM).forEach(([k, id]) => { const c = document.getElementById(id); if (c) { menus['m_' + k] = (c.textContent || '').replace(/\s+/g, ' '); ids['m_' + k] = id; } });
      const vis = el => { if (!el) return false; const c = el.getBoundingClientRect(); return c.width > 0 && c.height > 0; };
      const paths = [], btns = [];
      secs.forEach(s => {
        s.el.querySelectorAll('.mp').forEach(e => paths.push({ sec: s.t, m: e.getAttribute('data-m'), text: e.textContent }));
        s.el.querySelectorAll('.bt').forEach(e => { const q = e.getAttribute('data-q'); const t = document.querySelector(q);
          btns.push({ sec: s.t, q, text: e.textContent, have: t ? (t.textContent || '').replace(/\s+/g, ' ') : null, shown: vis(t) }); });
      });
      return { shut, n: secs.length, menus, ids, paths, btns };
    }, [part, LEFTM]);
    const gshape = await p2.evaluate(READ_SHAPE, g.ids);
    await ctx2.close();
    chk(`${where}: the guide does not open by itself`, g.shut);
    chk(`${where}: the guide’s ${part} part is in the file`, g.n > 0, g.n + ' section(s)');
    for (const r of g.paths) {
      const parts = r.text.split('›'), item = parts[parts.length - 1], group = parts.length > 2 ? parts[1] : null;
      const why = g.menus['m_' + r.m] === undefined ? 'no menu #m_' + r.m : placed(gshape['m_' + r.m], group, item);
      chk(`${where} guide, “${r.sec}”: ${r.text.replace(/\s+/g, ' ').trim()}`, !why, why);
    }
    for (const r of g.btns) {
      const want = strip(r.text);
      chk(`${where} guide, “${r.sec}”: the ${r.text.trim()} button`, !!r.have && r.shown && strip(r.have).toLowerCase().includes(want.toLowerCase()),
        r.have === null ? r.q + ' missing' : (!r.shown ? 'not shown' : ''));
    }
  }
}
await b.close();
console.log(bad ? `\n${bad} menu-path check(s) failed\n` : '\nEvery menu path a message names is really in that menu\n');
process.exit(bad ? 1 : 0);
