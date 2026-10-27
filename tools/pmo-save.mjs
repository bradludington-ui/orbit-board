// SAVE IN A PMO COPY, IN A REAL BROWSER (v2.09, item 127 -- Brad, 26 Oct 2026: "I need a save button at the bottom left of
// the menu bar above the Submit button"). jsdom has no layout, no focus ring and no IndexedDB, so this opens a published copy
// in Chromium beside the board it came from -- two files in two folders, as an office and the portfolio team keep them, which
// share one origin (file://) and so one handle store and one browser storage -- and checks what only a browser can show:
//
//   A. THE FOOT, at 1366×768 and 1366×657, in Harbor and Midnight: 💾 Save, its ▾ beside it, the save state, then ✉ Submit
//      input, top to bottom, each at least 24×24 and inside the left menu; nothing scrolls sideways; at 657, where the menu
//      already scrolls, the foot is reached by scrolling and shows whole.
//   B. FOLDED TO ICONS: Save an icon of its own, 24×24 or more, above its ▾ and above Submit; unsaved work a dot on it.
//   C. 1.4.11 / 1.4.3: Save's edge and its words against the left menu, measured as painted.
//   D. THE KEYBOARD: Tab from the last left-menu entry reaches Save, then its ▾, then Submit, each with a visible focus ring;
//      Enter on Save saves: the picker opens once, suggesting a new name with the office in it -- never the board's file
//      name, never the copy's own -- and the file is written; Ctrl+S saves again into the same file, asking nothing.
//   E. THE HANDLE STORE: the board's own entry (under its file name) is as the board left it; the copy's is under a key of
//      its own, naming this copy and this office.
//   F. THE BOARD (a CONTROL): its foot is as it was -- no copy Save, Tab goes from Setup to 💾 Save.
//   G. TWO TABS, ONE BROWSER (v2.09 review): PSM's file in one tab, AV's in another, one storage between them -- the second
//      leaves the first on PSM and writes nothing into the browser's office setting; the person's own choice still does,
//      and the copy as published opened next follows it (a CONTROL).
//   H. A FILE MOVED AFTER ITS FIRST SAVE (v2.09 review), with a real file handle (the origin-private file system, so the page
//      is served from 127.0.0.1): the browser reads the moved file's handle as NotFoundError; Save says so and forgets the
//      handle, and after a reopen it asks where the file is -- the copy's Save and the board's.
//   I. A PAGE THAT SAVED KEEPS ITS OFFICE (v2.09 second review): the copy as published, its office read from the browser's
//      setting, saves for ATL; a choice of PSM in a second tab then leaves it on ATL, Submit and the next Save with it.
//   J. A NEWER OFFICE FILE, THEN THE COPY AS PUBLISHED (v2.09 second review), in one browser: opening the newer file leaves in
//      browser storage what it put on screen, so the copy opened next shows that save and this browser's unsaved work only in
//      the kept slot, said not to be on screen; put back, it is on its own office.
//   K. A NEWER OFFICE FILE OPENED ONLY TO LOOK (v2.09 third review), in one browser holding no unsaved work: browser storage is
//      left as it was, so her own office file and the copy as published then open on her own work, under her own office, and
//      ✉ Submit sends that office's package.
//
//   node tools/pmo-save.mjs [--board FILE]
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { boot, seed } from './export-audit/boot.mjs';
import { CHROME } from './chrome.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const bi = process.argv.indexOf('--board');
const FILE = resolve(bi >= 0 ? process.argv[bi + 1] : join(ROOT, 'prioritization-board-grid.html'));
const FNAME = 'FY27 Consolidated Prioritization Board.html';
let bad = 0;
const chk = (what, ok, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail && !ok ? '   ' + detail : ''}`); };
const J = JSON.stringify;

// the board and a copy published from it, the way Program offices › Publish PMO copy… publishes one
const dir = mkdtempSync(join(tmpdir(), 'orbit-pmosave-'));
process.on('exit', () => { try { rmSync(dir, { recursive: true, force: true }); } catch {} });
const SVCN = ['USAF', 'ANG', 'AFRC'];
const items = Array.from({ length: 8 }, (_, i) => ({ id: 'R' + i, grp: ['PSM', 'ATL'][i % 2], team: 't', sect: '', custom: false,
  title: 'Requirement ' + i, event: 'Ev ' + i, ccar: 'CC' + i, fy26: SVCN.map(() => 0), ask: SVCN.map((_, j) => (i + 1) * (j + 1) * 100000), alloc: null }));
const { ev } = boot({ html: readFileSync(FILE, 'utf8') });
seed(ev, { services: SVCN, items, disc: [5000000, 1000000, 500000], mand: [1000000, 300000, 200000], order: items.map(x => x.id) });
ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`);
const boardHtml = ev('buildSavedHtml()');
const copyHtml = ev(`(function(){ let cap=null; const _B=window.Blob;
  window.Blob=function(pt,o){ if(!cap && o && o.type==='text/html') cap=String(pt[0]); return new _B(pt,o); };
  window.confirm=function(){ return true; }; try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
  try{ publishPmoCopy(); }catch(e){} window.Blob=_B; return cap||''; })()`);
const MODE = (() => { const m = /<script type="application\/json" id="pubMode">([\s\S]*?)<\/script>/.exec(copyHtml); try { return JSON.parse(m[1]); } catch { return null; } })();
mkdirSync(join(dir, 'team')); mkdirSync(join(dir, 'office'));
const boardFile = join(dir, 'team', FNAME), copyFile = join(dir, 'office', 'FY27 O&M PMO COPY.html');
writeFileSync(boardFile, boardHtml); writeFileSync(copyFile, copyHtml);
chk('a PMO copy was published from a board with requirements on it (the fixture)', !!(MODE && MODE.sandbox && MODE.ts) && copyHtml.length > 100000, 'length ' + copyHtml.length);

const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctxOf = async (w, h, theme) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(t => { try { localStorage.setItem('spmtTheme', t); localStorage.removeItem('prio27uiRail');
    localStorage.setItem('prio27who', 'Pat'); localStorage.setItem('prio27pmo', 'PSM'); } catch (e) {} }, theme);
  return ctx;
};
const openIn = async (ctx, file) => {
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + file);
  await p.waitForFunction(() => typeof render === 'function' && document.documentElement.classList.contains('ui-on') && document.querySelectorAll('#list .row').length > 0, null, { timeout: 40000 });
  await p.waitForTimeout(300);
  return { p, errs };
};
// a save-file handle the browser can keep in its handle store: its methods live on its class, so a structured clone (what the
// store keeps) carries its name and nothing else, and the page that made it still writes through it
const STANDIN = () => {
  window.__disk = { content: '', writes: 0 }; window.__picked = [];
  class StandIn { constructor(n) { this.name = n; } async requestPermission() { return 'granted'; }
    async getFile() { return { text: async () => window.__disk.content }; }
    async createWritable() { let buf = ''; return { write: async x => { buf += String(x); }, close: async () => { window.__disk.content = buf; window.__disk.writes++; } }; } }
  window.showSaveFilePicker = async o => { window.__picked.push(o && o.suggestedName); return new StandIn('PSM file.html'); };
};
const idbAll = p => p.evaluate(() => new Promise(res => { const r = indexedDB.open('prio-fh', 1);
  r.onupgradeneeded = () => { try { r.result.createObjectStore('h'); } catch (e) {} };
  r.onsuccess = () => { try { const st = r.result.transaction('h', 'readonly').objectStore('h'), out = {};
    const k = st.getAllKeys(), v = st.getAll(); v.onsuccess = () => { k.result.forEach((key, i) => { out[key] = v.result[i]; }); res(out); }; } catch (e) { res({ err: e.message }); } };
  r.onerror = () => res({ err: 'open' }); }));
const geom = p => p.evaluate(() => {
  const side = document.getElementById('uiSide'), sr = side.getBoundingClientRect();
  const box = id => { const e = document.getElementById(id); if (!e || !e.getClientRects().length) return null; const r = e.getBoundingClientRect();
    return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; };
  return { side: { l: Math.round(sr.left), r: Math.round(sr.right), t: Math.round(sr.top), b: Math.round(sr.bottom), sw: side.scrollWidth, cw: side.clientWidth, sh: side.scrollHeight, ch: side.clientHeight },
    save: box('pmoSaveBtn'), more: box('uiNav_save'), state: box('saveState'), submit: box('saveBtn'), doc: document.documentElement.scrollWidth <= document.documentElement.clientWidth };
});

// ── A, B, C: the foot, opened and folded, in two themes and two heights ──────────────────────────────────────────────────
for (const theme of ['harbor', '']) for (const h of [768, 657]) {
  const tag = (theme || 'midnight') + ' 1366×' + h;
  const ctx = await ctxOf(1366, h, theme); const { p, errs } = await openIn(ctx, copyFile);
  try {
    await p.evaluate(() => { const e = document.getElementById('saveBtn'); if (e) e.scrollIntoView({ block: 'end' }); });
    await p.waitForTimeout(150);
    const g = await geom(p);
    const ok24 = x => !!x && x.w >= 24 && x.h >= 24;
    const inside = x => !!x && x.l >= g.side.l - 0.5 && x.r <= g.side.r + 0.5 && x.t >= g.side.t - 0.5 && x.b <= g.side.b + 0.5;
    chk(`A · ${tag}: Save, the save state and ✉ Submit input, top to bottom, the ▾ on Save’s line`,
      !!(g.save && g.state && g.submit && g.more) && g.save.b <= g.state.t + 1 && g.state.b <= g.submit.t + 1 && g.more.t < g.save.b && g.more.b > g.save.t && g.more.l >= g.save.r - 1, J(g));
    chk(`A · ${tag}: each is 24×24 or more, and shows whole inside the left menu once it is scrolled to`, [g.save, g.more, g.submit].every(x => ok24(x) && inside(x)), J(g));
    chk(`A · ${tag}: nothing scrolls sideways, neither the menu nor the page (a CONTROL: it held before item 127, and the new row keeps it)`, g.side.sw <= g.side.cw && g.doc, J(g.side));
    if (h === 657) chk(`A · ${tag}: the menu scrolls, and the foot is reached by scrolling (a CONTROL: it already scrolled before item 127)`, g.side.sh > g.side.ch, J(g.side));
    // C: Save's edge and words against the menu, as painted
    const c = await p.evaluate(() => {
      const rgb = s => { const m = /rgba?\(([^)]+)\)/.exec(s); if (!m) return null; const a = m[1].split(',').map(x => parseFloat(x)); return a.length > 3 && a[3] === 0 ? null : a.slice(0, 3); };
      const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
      const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
      const bgOf = e => { for (let n = e; n; n = n.parentElement) { const v = rgb(getComputedStyle(n).backgroundColor); if (v) return v; } return [255, 255, 255]; };
      const e = document.getElementById('pmoSaveBtn'), cs = getComputedStyle(e), bg = bgOf(e.parentElement);
      return { edge: +ratio(rgb(cs.borderTopColor) || bg, bg).toFixed(2), text: +ratio(rgb(cs.color), bgOf(e)).toFixed(2) };
    });
    chk(`C · ${tag}: Save’s edge clears 3:1 against the menu (1.4.11) and its words 4.5:1 (1.4.3)`, c.edge >= 3 && c.text >= 4.5, J(c));
    // B: folded to icons
    await p.evaluate(() => { uiRailToggle(); }); await p.waitForTimeout(250);
    await p.evaluate(() => { const e = document.getElementById('saveBtn'); if (e) e.scrollIntoView({ block: 'end' }); }); await p.waitForTimeout(100);
    const r = await geom(p);
    const dot = await p.evaluate(() => { const sb = document.getElementById('pmoSaveBtn');
      const on = () => { const c = getComputedStyle(sb, '::after'); return c.content !== 'none' && c.content !== 'normal' && parseFloat(c.width) > 0; };
      DIRTY = false; _baseDirty = false; syncBtns(); const clean = on(); DIRTY = true; syncBtns(); const dirty = on(); DIRTY = false; syncBtns();
      return { clean, dirty, words: !!(sb.querySelector('.uiSvT') || {}).getClientRects().length }; });
    chk(`B · ${tag}, folded: Save is an icon of its own, 24×24 or more, above its ▾ and ✉ Submit input, inside the menu`,
      J([r.side.r - r.side.l, ok24(r.save) && r.save.w <= 48, ok24(r.more), ok24(r.submit), r.save && r.more && r.submit && r.save.b <= r.more.t + 1 && r.more.b <= r.submit.t + 1, [r.save, r.more, r.submit].every(x => !!x && x.l >= r.side.l && x.r <= r.side.r)])
        === J([64, true, true, true, true, true]), J(r));
    chk(`B · ${tag}, folded: its words are hidden, and unsaved work shows as a dot on it`, J(dot) === J({ clean: false, dirty: true, words: false }), J(dot));
    chk(`A–C · ${tag}: nothing threw`, errs.length === 0, errs.slice(0, 2).join(' | '));
  } catch (e) { chk(`A–C · ${tag}: the section ran on the copy`, false, String(e.message || e).split('\n')[0].slice(0, 160)); }
  await ctx.close();
}

// ── D, E: the keyboard, the picker and the handle store, with the board opened first in the same browser ─────────────────
{
  const ctx = await ctxOf(1366, 768, 'harbor');
  try {
    // the portfolio team's browser: the board, opened from its own folder, keeps its file's handle as its Save does
    const B = await openIn(ctx, boardFile);
    await B.p.evaluate(() => new Promise(res => { _fhPut({ name: 'THE BOARD FILE' }); setTimeout(res, 200); }));
    const before = await idbAll(B.p);
    chk('E · the board’s handle is in this browser’s handle store, under the board’s file name (the fixture)', J(before[FNAME]) === J({ name: 'THE BOARD FILE' }), J(before));
    const { p, errs } = await openIn(ctx, copyFile);
    await p.evaluate(STANDIN);
    await p.evaluate(() => { const e = document.getElementById('saveBtn'); if (e) e.scrollIntoView({ block: 'end' }); });
    await p.focus('#uiNav_setup');
    const walk = [];
    for (let i = 0; i < 3; i++) { await p.keyboard.press('Tab'); walk.push(await p.evaluate(() => { const a = document.activeElement;
      const cs = a ? getComputedStyle(a) : null; return a ? a.id + (cs && cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 ? '' : ' (no focus ring)') : null; })); }
    chk('D · Tab from Setup reaches 💾 Save, then its ▾, then ✉ Submit input, each with a focus ring', J(walk) === J(['pmoSaveBtn', 'uiNav_save', 'saveBtn']), J(walk));
    await p.evaluate(() => { setDesc('R0', 'typed in the copy'); });
    await p.focus('#pmoSaveBtn'); await p.keyboard.press('Enter'); await p.waitForTimeout(600);
    const s1 = await p.evaluate(() => ({ picked: window.__picked.slice(), writes: window.__disk.writes, state: document.getElementById('saveState').textContent,
      mode: (/<script type="application\/json" id="pubMode">([\s\S]*?)<\/script>/.exec(window.__disk.content) || [])[1] || null }));
    const want = 'FY27 O&M Prioritization Board (Consolidated) — PMO COPY — PSM — ' + new Date(MODE.ts).toISOString().slice(0, 10) + '.html';
    chk('D · Enter on Save opens the picker once, on a new name with the office in it', J(s1.picked) === J([want]), J(s1.picked));
    chk('D · never the board’s file name, never the copy’s own', s1.picked.length === 1 && s1.picked[0] !== FNAME && s1.picked[0] !== 'FY27 O&M PMO COPY.html', J(s1.picked));
    chk('D · the file is written, carrying the copy’s mode as published, and the work reads Saved',
      s1.writes === 1 && s1.mode === J(MODE).replace(/</g, '\\u003c') && /^Saved/.test(s1.state), J({ writes: s1.writes, state: s1.state, same: s1.mode === J(MODE) }));
    await p.evaluate(() => { setDesc('R0', 'typed again'); window.__al = []; window.confirm = function (m) { window.__al.push(String(m)); return true; }; });
    await p.focus('#uiNav_req'); await p.keyboard.press('Control+s'); await p.waitForTimeout(600);
    const s2 = await p.evaluate(() => ({ picked: window.__picked.length, writes: window.__disk.writes, asked: window.__al.length, state: document.getElementById('saveState').textContent }));
    chk('E · Ctrl+S is the copy’s Save: the same file again, no picker, nothing asked', J([s2.picked, s2.writes, s2.asked, /^Saved/.test(s2.state)]) === J([1, 2, 0, true]), J(s2));
    const after = await idbAll(p);
    const mine = Object.keys(after).filter(k => k !== FNAME);
    chk('E · the board’s entry in the handle store is as the board left it', J(after[FNAME]) === J({ name: 'THE BOARD FILE' }), J(after));
    chk('E · the copy’s handle is under one key of its own, naming this copy and this office',
      mine.length === 1 && mine[0].indexOf(String(MODE.ts)) >= 0 && /PSM/.test(mine[0]) && J(after[mine[0]]) === J({ name: 'PSM file.html' }), J(mine));
    chk('D–E · nothing threw', errs.length === 0 && B.errs.length === 0, [...errs, ...B.errs].slice(0, 2).join(' | '));
  } catch (e) { chk('D–E · the section ran', false, String(e.message || e).split('\n')[0].slice(0, 160)); }
  await ctx.close();
}

// ── F: the board's foot, as it was (a CONTROL) ──────────────────────────────────────────────────────────────────────────
{
  const ctx = await ctxOf(1366, 768, 'harbor');
  try {
    const { p, errs } = await openIn(ctx, boardFile);
    const r = await p.evaluate(() => ({ row: !!(document.getElementById('pmoSaveRow') || {}).hidden || !document.getElementById('pmoSaveRow'),
      save: (document.getElementById('saveBtn') || {}).getAttribute && document.getElementById('saveBtn').getAttribute('onclick') }));
    await p.focus('#uiNav_setup'); await p.keyboard.press('Tab');
    const next = await p.evaluate(() => document.activeElement && document.activeElement.id);
    chk('F · on the board there is no copy Save, the foot’s Save is the board’s, and Tab goes from Setup to it (a CONTROL)', J([r.row, r.save, next]) === J([true, 'saveInPlace()', 'saveBtn']), J([r, next]));
    chk('F · nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
  } catch (e) { chk('F · the section ran on the board', false, String(e.message || e).split('\n')[0].slice(0, 160)); }
  await ctx.close();
}

// ── G: two tabs, one browser (v2.09 review) ──────────────────────────────────────────────────────────────────────────────
// PSM's file and AV's file of the copy, each built as the copy's Save builds it (the board's own assembly, the office's mark set
// as Save sets it), and opened in two tabs of one browser, which share one storage as every file:// page does
{
  const officeFile = (off, desc) => { const X = boot({ html: copyHtml }); X.ev(`setDesc('R0', ${J(desc)}); MS.pmoFor={pmo:${J(off)}}; 'ok'`); return X.ev('buildSavedHtml()'); };
  const psmFile = join(dir, 'office', 'PSM file.html'), avFile = join(dir, 'office', 'AV file.html');
  writeFileSync(psmFile, officeFile('PSM', 'PSM wrote R0')); writeFileSync(avFile, officeFile('ATL', 'ATL wrote R0'));
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('prio27who', 'Helper'); } catch (e) {} });
  try {
    const T1 = await openIn(ctx, psmFile);
    const at = p => p.evaluate(() => ({ off: myPmo(), banner: (document.getElementById('subBanner') || {}).textContent || '', add: arOfficeStart().g,
      setting: localStorage.getItem('prio27pmo') }));
    const a1 = await at(T1.p);
    chk('G · the first tab opens PSM’s file on PSM (a CONTROL: the file’s office, Brad’s rule)', a1.off === 'PSM' && /\u{1F3E2} PSM/u.test(a1.banner), J(a1));
    const T2 = await openIn(ctx, avFile);
    const a2 = await at(T2.p);
    chk('G · the second tab opens ATL’s file on ATL (a CONTROL)', a2.off === 'ATL', J(a2));
    const b1 = await at(T1.p);
    chk('G · the first tab stays on PSM, its bar and its Add box with it, and the browser’s office setting is untouched',
      J([b1.off, /\u{1F3E2} PSM/u.test(b1.banner), b1.add, b1.setting]) === J(['PSM', true, 'PSM', null]), J(b1));
    // the person's own choice, in the second tab: written for the browser, as it always was -- the first tab keeps its office
    await T2.p.evaluate(() => { window.prompt = () => 'ATL'; pickMyPmo(); });
    const c1 = await at(T1.p);
    chk('G · a choice made in the second tab is the browser’s setting (a CONTROL), and the first tab keeps PSM', J([c1.setting, c1.off, c1.add]) === J(['ATL', 'PSM', 'PSM']), J(c1));
    const T3 = await openIn(ctx, copyFile);
    const a3 = await at(T3.p);
    chk('G · the copy as published, opened next, follows that choice (a CONTROL: as in v2.08)', a3.off === 'ATL', J(a3));
    chk('G · nothing threw', [T1, T2, T3].every(t => t.errs.length === 0), [...T1.errs, ...T2.errs, ...T3.errs].slice(0, 2).join(' | '));
  } catch (e) { chk('G · the section ran', false, String(e.message || e).split('\n')[0].slice(0, 160)); }
  await ctx.close();
}

// ── H: a file moved after its first Save, with a real file handle (v2.09 review) ──────────────────────────────────────────
// The origin-private file system gives the page real file handles it can move a file from, and a page served from 127.0.0.1
// has one; a file:// page has none. The handle the board keeps in its store is then a real one, kept across a reopen.
{
  const { createServer } = await import('node:http');
  const pages = { '/copy.html': copyHtml, '/board.html': boardHtml };
  const srv = createServer((q, s) => { const t = pages[String(q.url).split('?')[0]];
    if (!t) { s.statusCode = 404; s.end(''); return; } s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(t); }).listen(0, '127.0.0.1');
  await new Promise(r => srv.on('listening', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  // the picker hands back the file named, made in the page's own file system if it is not there
  const PICKER = name => { window.__picked = window.__picked || [];
    window.showSaveFilePicker = async o => { window.__picked.push(o && o.suggestedName);
      const root = await navigator.storage.getDirectory(); return root.getFileHandle(name, { create: true }); }; };
  const readF = (p, name) => p.evaluate(async n => { try { const root = await navigator.storage.getDirectory();
    return await (await (await root.getFileHandle(n)).getFile()).text(); } catch (e) { return 'ERR ' + e.name; } }, name);
  const move = (p, from, to) => p.evaluate(async ([a, z]) => { const root = await navigator.storage.getDirectory();
    const t = await (await (await root.getFileHandle(a)).getFile()).text();
    const h = await root.getFileHandle(z, { create: true }), w = await h.createWritable(); await w.write(t); await w.close();
    await root.removeEntry(a); }, [from, to]);
  const stat = p => p.evaluate(() => (document.getElementById('shareStat') || {}).textContent || '');
  const open = async (ctx, path) => { const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
    await p.goto(base + path);
    await p.waitForFunction(() => typeof render === 'function' && document.documentElement.classList.contains('ui-on') && document.querySelectorAll('#list .row').length > 0, null, { timeout: 40000 });
    await p.waitForTimeout(300); return { p, errs }; };
  for (const [who, path, saveFn, file, moved, key] of [
    ['the copy', '/copy.html', 'pmoSaveCopy()', 'PSM file.html', 'PSM file (moved).html', 'pmo-copy|'],
    ['the board', '/board.html', 'saveInPlace()', 'board.html', 'board (moved).html', FNAME]]) {
    // a browser of its own each: this Chromium dies outright when a page uses a kept handle whose file has gone (measured on the
    // board before the fix, which kept it), and a death must fail this section, not every one after it
    const hb = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
    let died = false; hb.on('disconnected', () => { died = true; });
    try {
      const ctx = await hb.newContext({ viewport: { width: 1366, height: 768 } });
      await ctx.addInitScript(() => { try { localStorage.setItem('prio27who', 'Pat'); localStorage.setItem('prio27pmo', 'PSM'); } catch (e) {} });
      let P = await open(ctx, path);
      await P.p.evaluate(PICKER, file);
      await P.p.evaluate(fn => { setDesc('R0', 'MARK-ONE'); return eval(fn); }, saveFn); await P.p.waitForTimeout(700);
      const s1 = await P.p.evaluate(() => window.__picked.length);
      chk(`H · ${who}: the first Save writes a real file, picked once (the fixture)`, s1 === 1 && /MARK-ONE/.test(await readF(P.p, file)), J([s1, (await stat(P.p)).slice(0, 120)]));
      await move(P.p, file, moved);
      await P.p.evaluate(fn => { setDesc('R0', 'MARK-TWO'); return eval(fn); }, saveFn); await P.p.waitForTimeout(700);
      const st = await stat(P.p), all = await idbAll(P.p), kept = Object.keys(all).filter(k => k.indexOf(key) === 0 && all[k]);
      chk(`H · ${who}: moved, the browser cannot read the handle; Save writes nothing, says the file is no longer where it was saved, and forgets the handle`,
        /no longer where it was saved/.test(st) && !/MARK-TWO/.test(await readF(P.p, moved)) && kept.length === 0, J([st.slice(0, 160), kept]));
      await P.p.close();
      // reopened in the same browser: the next Save asks where the file is, and writes the one picked
      P = await open(ctx, path);
      await P.p.evaluate(PICKER, moved);
      await P.p.evaluate(fn => { setDesc('R0', 'MARK-THREE'); return eval(fn); }, saveFn); await P.p.waitForTimeout(700);
      const s3 = await P.p.evaluate(() => window.__picked.length);
      chk(`H · ${who}: reopened, the next Save asks where the file is, and writes the file picked`, s3 === 1 && /MARK-THREE/.test(await readF(P.p, moved)), J([s3, (await stat(P.p)).slice(0, 160)]));
      chk(`H · ${who}: nothing threw`, P.errs.length === 0, P.errs.slice(0, 2).join(' | '));
    } catch (e) { chk(`H · ${who}: the section ran`, false, (died? 'the browser died on a handle it kept to the moved file: ' : '')
      + String(e.message || e).split('\n')[0].slice(0, 160)); }
    await hb.close().catch(() => {});
  }
  srv.close();
}

// ── I: a page that saved keeps the office it saved for (v2.09 second review) ─────────────────────────────────────────────
// The copy as published, opened in a browser whose office setting says ATL, nobody choosing in it: its office is the setting's.
// Once it has saved for ATL, a choice of PSM in a second tab of the same browser must not re-point it.
{
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('prio27who', 'Sue'); } catch (e) {} });
  try {
    const T1 = await openIn(ctx, copyFile);
    await T1.p.evaluate(STANDIN);
    const at = p => p.evaluate(() => ({ off: myPmo(), banner: (document.getElementById('subBanner') || {}).textContent || '', add: arOfficeStart().g,
      setting: localStorage.getItem('prio27pmo'), mark: pmoForOf(MS) }));
    await T1.p.evaluate(() => { localStorage.setItem('prio27pmo', 'ATL'); setDesc('R1', 'Sue for ATL'); });
    const a0 = await at(T1.p);
    chk('I · the copy as published takes its office from the browser’s setting, nobody having chosen in it (a CONTROL)', a0.off === 'ATL' && a0.mark === '', J(a0));
    await T1.p.evaluate(() => pmoSaveCopy()); await T1.p.waitForTimeout(600);
    const s1 = await T1.p.evaluate(() => ({ writes: window.__disk.writes, mark: pmoForOf(MS) }));
    chk('I · its Save writes ATL’s file and marks the work ATL’s (the fixture)', J(s1) === J({ writes: 1, mark: 'ATL' }), J(s1));
    const T2 = await openIn(ctx, copyFile);
    await T2.p.evaluate(() => { window.prompt = () => 'PSM'; pickMyPmo(); });
    const a1 = await at(T1.p);
    chk('I · a choice of PSM in a second tab is the browser’s setting (a CONTROL), and the page that saved stays on ATL, its bar and its Add box with it',
      J([a1.setting, a1.off, /\u{1F3E2} ATL/u.test(a1.banner), a1.add]) === J(['PSM', 'ATL', true, 'ATL']), J(a1));
    await T1.p.evaluate(() => { setDesc('R1', 'Sue for ATL, again'); window.__al = []; window.confirm = m => { window.__al.push(String(m)); return true; };
      window.alert = m => { window.__al.push(String(m)); }; });
    const blocked = await T1.p.evaluate(() => pmoForBlock());
    await T1.p.evaluate(() => pmoSaveCopy()); await T1.p.waitForTimeout(600);
    const s2 = await T1.p.evaluate(() => ({ writes: window.__disk.writes, asked: window.__al.length, picked: window.__picked.length }));
    chk('I · its Submit is not refused, and its next Save asks nothing and writes ATL’s file again', J([blocked, s2.asked, s2.picked, s2.writes]) === J([false, 0, 1, 2]), J([blocked, s2]));
    const T3 = await openIn(ctx, copyFile);
    chk('I · nothing threw', [T1, T2, T3].every(t => t.errs.length === 0), [...T1.errs, ...T2.errs, ...T3.errs].slice(0, 2).join(' | '));
  } catch (e) { chk('I · the section ran', false, String(e.message || e).split('\n')[0].slice(0, 160)); }
  await ctx.close();
}

// ── J: a newer office file, the copy as published, then the newer file again, in one browser (v2.09 second review) ─────────
// Opening the newer file must leave in browser storage what it put on screen, so the next opening reads this browser's own
// unsaved work as kept aside, never as saved; it is put back on the office it belongs to.
{
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('prio27who', 'Ann'); } catch (e) {} });
  try {
    const look = p => p.evaluate(() => { const d = (st, id) => { try { return String(((st.years[st.cur] || {}).desc || {})[id]); } catch (e) { return 'ERR'; } };
      let ls = null; try { ls = JSON.parse(localStorage.getItem(_AP.key)); } catch (e) { ls = null; }
      const k = keptCopy(); let ks = null; try { ks = k ? JSON.parse(k.raw) : null; } catch (e) { ks = null; }
      return { R0: String((S.desc || {}).R0), R1: String((S.desc || {}).R1), lsR0: ls ? d(ls, 'R0') : null, lsR1: ls ? d(ls, 'R1') : null,
        keptR1: ks ? d(ks, 'R1') : null, dirty: !!baseGet().dirty, off: myPmo(), line: (document.getElementById('shareStat') || {}).textContent || '' }; });
    const T1 = await openIn(ctx, copyFile);
    await T1.p.evaluate(() => { localStorage.setItem('prio27pmo', 'ATL'); setDesc('R1', 'Ann for ATL, unsaved'); });
    await T1.p.close();
    await new Promise(r => setTimeout(r, 20));
    const X = boot({ html: copyHtml }); X.ev(`setDesc('R0','PSM wrote R0, later'); MS.pmoFor={pmo:'PSM'}; 'ok'`);
    const psmLater = join(dir, 'office', 'PSM file, later.html'); writeFileSync(psmLater, X.ev('buildSavedHtml()'));
    const T2 = await openIn(ctx, psmLater);
    const j2 = await look(T2.p);
    chk('J · PSM’s newer file opens, and Ann’s unsaved work is kept aside (a CONTROL)', J([j2.R0, j2.keptR1]) === J(['PSM wrote R0, later', 'Ann for ATL, unsaved']), J(j2));
    chk('J · browser storage holds what is now on screen, so the record calling it clean is true', J([j2.lsR0, j2.lsR1, j2.dirty]) === J(['PSM wrote R0, later', 'undefined', false]), J(j2));
    await T2.p.close();
    const T3 = await openIn(ctx, copyFile);
    const j3 = await look(T3.p);
    chk('J · the copy as published opens the newer save, and Ann’s work is only in the kept slot, which the line says is not on screen',
      J([j3.R0, j3.R1, j3.keptR1, /PSM’s work/.test(j3.line), /is not what is on screen/.test(j3.line)]) === J(['PSM wrote R0, later', 'undefined', 'Ann for ATL, unsaved', true, true]), J(j3));
    await T3.p.evaluate(() => { window.confirm = () => true; keptPutBack(); });
    const j4 = await look(T3.p);
    chk('J · put back, her work is on screen on her own office, ATL', J([j4.R1, j4.off]) === J(['Ann for ATL, unsaved', 'ATL']), J(j4));
    chk('J · nothing threw', [T2, T3].every(t => t.errs.length === 0), [...T2.errs, ...T3.errs].slice(0, 2).join(' | '));
  } catch (e) { chk('J · the section ran', false, String(e.message || e).split('\n')[0].slice(0, 160)); }
  await ctx.close();
}

// ── K: a newer office file opened only to look, then her own file, in one browser (v2.09 third review) ───────────────────
// With nothing unsaved in this browser, nothing is kept aside and opening the newer file must write nothing into browser
// storage: her own office file, opened next, then shows her own work under her own office, and ✉ Submit sends that office's.
{
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('prio27who', 'Ann'); } catch (e) {} });
  try {
    const look = p => p.evaluate(() => ({ R0: String((S.desc || {}).R0), R1: String((S.desc || {}).R1), plan: localStorage.getItem(_AP.key),
      kept: !!keptCopy(), dirty: !!baseGet().dirty, off: myPmo(), mark: pmoForOf(MS) }));
    const T1 = await openIn(ctx, copyFile);
    await T1.p.evaluate(STANDIN);
    await T1.p.evaluate(() => { localStorage.setItem('prio27pmo', 'ATL'); setDesc('R1', 'Ann for ATL, saved'); });
    await T1.p.evaluate(() => pmoSaveCopy()); await T1.p.waitForTimeout(600);
    const k1 = await look(T1.p), atlHtml = await T1.p.evaluate(() => window.__disk.content);
    chk('K · Ann’s Save writes ATL’s file, and this browser holds no work that file lacks (the fixture)', J([k1.mark, k1.dirty, atlHtml.length > 100000]) === J(['ATL', false, true]), J([k1.mark, k1.dirty, atlHtml.length]));
    await T1.p.close();
    const atlFile = join(dir, 'office', 'ATL file.html'); writeFileSync(atlFile, atlHtml);
    await new Promise(r => setTimeout(r, 20));
    const X = boot({ html: copyHtml }); X.ev(`setDesc('R0','PSM wrote R0, newest'); MS.pmoFor={pmo:'PSM'}; 'ok'`);
    const psmNewest = join(dir, 'office', 'PSM file, newest.html'); writeFileSync(psmNewest, X.ev('buildSavedHtml()'));
    const T2 = await openIn(ctx, psmNewest);
    const k2 = await look(T2.p);
    chk('K · PSM’s newer file opens on PSM, nothing kept aside (a CONTROL)', J([k2.R0, k2.off, k2.kept]) === J(['PSM wrote R0, newest', 'PSM', false]), J([k2.R0, k2.off, k2.kept]));
    chk('K · browser storage still holds Ann’s save, byte for byte: opening a file only to look writes nothing there', k2.plan === k1.plan, k2.plan === k1.plan ? '' : 'storage changed');
    await T2.p.close();
    for (const [at, file] of [['her own ATL file', atlFile], ['the copy as published', copyFile]]) {
      const T3 = await openIn(ctx, file);
      const k3 = await look(T3.p);
      chk(`K · ${at} opens on her own work, under ATL, never PSM’s`, J([k3.R1, k3.R0 === 'PSM wrote R0, newest', k3.off, k3.mark]) === J(['Ann for ATL, saved', false, 'ATL', 'ATL']), J([k3.R1, k3.R0, k3.off, k3.mark]));
      const sub = await T3.p.evaluate(() => { let cap = null; const _B = window.Blob;
        window.Blob = function (pt, o) { if (!cap && o && o.type === 'application/json') cap = String(pt[0]); return new _B(pt, o); };
        try { pmoSubmit(); } catch (e) {} window.Blob = _B; const pk = cap ? JSON.parse(cap) : {}; const it = pk.items || {};
        return { pmo: pk.pmo || null, R1: (it.R1 || {}).desc || null, R0: !!it.R0 }; });
      chk(`K · ${at}: ✉ Submit sends ATL’s package, with her change and nothing of PSM’s`, J(sub) === J({ pmo: 'ATL', R1: 'Ann for ATL, saved', R0: false }), J(sub));
      chk(`K · ${at}: nothing threw`, T3.errs.length === 0, T3.errs.slice(0, 2).join(' | '));
      await T3.p.close();
    }
    chk('K · nothing threw', T2.errs.length === 0, T2.errs.slice(0, 2).join(' | '));
  } catch (e) { chk('K · the section ran', false, String(e.message || e).split('\n')[0].slice(0, 160)); }
  await ctx.close();
}

await b.close();
console.log(bad ? `\n${bad} PMO-copy Save check(s) failed\n` : '\nA PMO copy saves its office’s own file: the foot, the keyboard, the picker and the handle store hold\n');
process.exit(bad ? 1 : 0);
