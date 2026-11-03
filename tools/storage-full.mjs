// BROWSER STORAGE FULL, IN A REAL BROWSER (v2.14 W3, item 141 F). jsdom stands a quota in by hand and dispatches a
// beforeunload nobody can see; this opens a board in Chromium, fills browser storage the way another file:// page or a big
// board fills it, and checks what only a browser can show:
//
//   A. AN EDIT STORAGE REFUSES, THEN THE TAB IS CLOSED. The note is typed for real into the edit box (#erNote) and saved there;
//      storage refuses it. Closing the page then raises the browser's own "Leave site?" question (a 'beforeunload' dialog);
//      dismissed, the page stays and the note is on screen. Measured on v2.13: no question, and the edit gone on reopen.
//   B. THE SAME EDIT, THEN THE APPROPRIATION BOX. Picking Full Fund in #appnSel loads nothing within 5 s; the box reads O&M
//      again (the box, never APPN: a box left on the refused name is the defect); the note is on screen; the message says
//      "⛔ Not switched." Measured on v2.13: the page reopened and the edit was gone.
//   B2. A CLEAN BOARD, STORAGE FULL TO THE LAST CHARACTER. Picking Full Fund loads nothing, the box reads O&M, and the message
//      says "Not switched. Browser storage is full". Measured on v2.13: the choice was refused unseen, the page reopened on
//      O&M, and the switch was silently undone.
//   W. TWO SAVES IN A FULL BROWSER, no writer key and no editor name stored: both write the file (a stand-in handle installed
//      from page code; both windows stood in, the Save window emptying what it picks, as Chromium does), the name is asked
//      once, and the second is "💾 Saved in place by BL". Measured on v2.13: the second was refused, "unknown holds the pen".
//
// Storage is seeded from a page of its own after it has loaded -- never by an init script (see tools/pmo-save.mjs's header: in
// Chromium 153 an init script's storage access can cut a tab off from its browser's storage) -- and the board's tab is checked to
// see what the seed page wrote. It is FILLED from the board's own tab, once that has loaded, by page code: a filler written from
// a second file:// tab was seen by the board's tab in one run and not in the next (measured here: the board read 61 characters
// in use beside a full seed page), so the room a section asks for is made, and measured, where the board is. The filler is
// found by asking the browser, not by assuming its limit: the largest value that still fits, less the room the section wants.
//
//   node tools/storage-full.mjs [--board FILE]
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { boot, seed } from './export-audit/boot.mjs';
import { CHROME } from './chrome.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const bi = process.argv.indexOf('--board');
const FILE = resolve(bi >= 0 ? process.argv[bi + 1] : join(ROOT, 'prioritization-board-grid.html'));
let bad = 0;
const chk = (what, ok, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail && !ok ? '   ' + detail : ''}`); };
const J = JSON.stringify;
// the rule above, held: an init script in this file that touches storage stops the run before it opens a browser
{ const self = readFileSync(new URL(import.meta.url), 'utf8'), at = new RegExp('\\.addInit' + 'Script\\(', 'g'); let m, hit = 0;
  while ((m = at.exec(self))) if (/localStorage|sessionStorage/.test(self.slice(m.index, m.index + 600))) hit++;
  if (hit) { console.log(`\n${hit} init script(s) in tools/storage-full.mjs touch browser storage: seed it from a page instead (see the header)\n`); process.exit(1); } }

// THE BOARD, built from the program as a person's saved board would be: two requirements, saved
const dir = mkdtempSync(join(tmpdir(), 'orbit-storagefull-'));
process.on('exit', () => { try { rmSync(dir, { recursive: true, force: true }); } catch {} });
const SVCN = ['USAF', 'ANG'];
const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Requirement ' + id, event: 'Event ' + id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
const items = [it('A', 'AV', [100000, 20000]), it('B', 'PSM', [50000, 10000])];
const { ev } = boot({ html: readFileSync(FILE, 'utf8') });
seed(ev, { services: SVCN, items, disc: [120000, 20000], mand: [30000, 10000], order: ['A', 'B'] });
ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`);
const boardFile = join(dir, 'ORBIT Board.html');
writeFileSync(boardFile, ev('buildSavedHtml()'));
const SEEDF = join(dir, 'seed.html');
writeFileSync(SEEDF, '<!doctype html><meta charset="utf-8"><title>seed</title><body>seed</body>');
console.log(`board  ${FILE}\nbuilt  ${boardFile}`);

const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
console.log(`chromium ${b.version()}`);
// a context whose storage holds `set` and not `rm`, set by a page of its own; every dialog is recorded and answered by `answer`
const ctxOf = async (set = {}, rm = []) => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); await p.goto('file://' + SEEDF);
  await p.evaluate(([set, rm]) => { rm.forEach(k => localStorage.removeItem(k)); Object.keys(set).forEach(k => localStorage.setItem(k, set[k])); }, [set, rm]);
  await p.close();
  return ctx;
};
// fill browser storage from the board's own tab, leaving `room` characters (keys and values, as the browser counts them): the
// largest filler that still fits is found by asking, then cut by `room`; then the room is measured -- `room` characters of a
// probe fit and one more does not. The probe is removed.
const fill = async (p, room) => {
  const r = await p.evaluate(room => {
    const K = 'another-file-page', P = 'zz-probe'; localStorage.removeItem(K);
    const fits = (k, n) => { try { localStorage.setItem(k, 'f'.repeat(n)); localStorage.removeItem(k); return true; } catch (e) { return false; } };
    let lo = 0, hi = 6000000;
    while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (fits(K, mid)) lo = mid; else hi = mid - 1; }
    localStorage.setItem(K, 'f'.repeat(Math.max(0, lo - room)));
    return { room: [room < P.length || fits(P, room - P.length), !fits(P, Math.max(0, room - P.length) + 1)] };
  }, room);
  chk('harness · the board’s tab has ' + room + ' characters of browser storage free, and no more', r.room[0] && r.room[1], J(r));
};
const openBoard = async (ctx, seeded) => {
  const p = await ctx.newPage(); const errs = []; const dialogs = [];
  p.on('pageerror', e => errs.push(String(e.message).slice(0, 200)));
  p.on('dialog', async d => { dialogs.push({ type: d.type(), msg: d.message().slice(0, 200) });
    if (d.type() === 'beforeunload') await d.dismiss(); else if (d.type() === 'prompt') await d.accept('BL'); else await d.accept(); });
  await p.goto('file://' + boardFile);
  await p.waitForFunction(() => typeof render === 'function' && document.querySelectorAll('#list .row').length > 0, null, { timeout: 40000 });
  await p.waitForTimeout(400);
  // a tab the browser gave a storage area of its own cannot see the seed page's name: say so, rather than blame the board
  if (seeded !== undefined) { const got = await p.evaluate(() => localStorage.getItem('prio27who'));
    if (got !== seeded) chk('harness · this tab shares its browser’s storage with the seed page (what follows in this section proves nothing about the board)', false, J({ seeded, read: got })); }
  return { p, errs, dialogs };
};
const stat = p => p.evaluate(() => (document.getElementById('shareStat') || {}).textContent || '');
const NOTE = 'typed while browser storage is full';
// the edit, as a person makes it: the edit box opened on A's note, the text typed, Save pressed in the box
const typeNote = async p => {
  await p.evaluate(() => openEdit('A', 'notes'));
  await p.waitForSelector('#erNote', { state: 'visible', timeout: 10000 });
  await p.click('#erNote');
  await p.keyboard.type(NOTE);
  await p.click('#erSaveBtn');
  await p.waitForTimeout(300);
};
const noteOn = p => p.evaluate(() => String((S.notes || {}).A || ''));
// a load within ms, or none
const loadWithin = (p, ms) => p.waitForEvent('load', { timeout: ms }).then(() => true).catch(() => false);

try {
  // ---------------------------------------------------------------- A
  console.log('\nA. an edit storage refuses, then the tab is closed');
  { const ctx = await ctxOf({ prio27who: 'Pat' }, ['prio27appn']);
    const { p, errs, dialogs } = await openBoard(ctx, 'Pat');
    await fill(p, 60);
    await typeNote(p);
    const r = await p.evaluate(() => ({ fail: _persistFail, dirty: DIRTY, refused: DIAG.refused.map(x => x.what + ' — ' + x.why) }));
    chk('the note typed in the edit box is refused by storage, and counted', r.fail === true && r.refused.includes('O&M board data — QuotaExceededError'), J(r));
    chk('the note is on screen', (await noteOn(p)) === NOTE, await noteOn(p));
    dialogs.length = 0;
    await p.close({ runBeforeUnload: true });
    await new Promise(res => setTimeout(res, 1500));
    chk('closing the page raises the browser’s own question first (a beforeunload dialog)', dialogs.some(d => d.type === 'beforeunload'), J(dialogs));
    chk('dismissed, the page stays open', !p.isClosed());
    if (!p.isClosed()) chk('and the note is still on screen', (await noteOn(p)) === NOTE, await noteOn(p));
    chk('no page error', errs.length === 0, J(errs));
    await ctx.close(); }
  // ---------------------------------------------------------------- B
  console.log('\nB. the same edit, then Full Fund picked in the appropriation box');
  { const ctx = await ctxOf({ prio27who: 'Pat' }, ['prio27appn']);
    const { p, errs } = await openBoard(ctx, 'Pat');
    await fill(p, 60);
    await typeNote(p);
    const [loaded] = await Promise.all([loadWithin(p, 5000), p.selectOption('#appnSel', 'FULL FUND')]);
    chk('nothing loads within 5 s', !loaded);
    chk('the box reads O&M again', (await p.$eval('#appnSel', s => s.value)) === 'O&M', await p.$eval('#appnSel', s => s.value));
    chk('the note is still on screen', (await noteOn(p)) === NOTE, await noteOn(p));
    chk('the message says why: “⛔ Not switched.”, the changes on screen only', /^⛔ Not switched\. Your latest changes are on screen only/.test(await stat(p)), await stat(p));
    chk('no page error', errs.length === 0, J(errs));
    await ctx.close(); }
  // ---------------------------------------------------------------- B2
  console.log('\nB2. a clean board, browser storage full to the last character');
  { const ctx = await ctxOf({ prio27who: 'Pat' }, ['prio27appn']);
    const { p, errs } = await openBoard(ctx, 'Pat');
    await fill(p, 0);
    const clean = await p.evaluate(() => [DIRTY, typeof memOnlyNow === 'function' ? memOnlyNow() : 'none']);
    chk('the board is clean, nothing on screen only (a CONTROL)', clean[0] === false && clean[1] === false, J(clean));
    const [loaded] = await Promise.all([loadWithin(p, 5000), p.selectOption('#appnSel', 'FULL FUND')]);
    chk('nothing loads within 5 s', !loaded);
    chk('the box reads O&M again', (await p.$eval('#appnSel', s => s.value)) === 'O&M', await p.$eval('#appnSel', s => s.value));
    chk('the message says “Not switched. Browser storage is full”', /^⛔ Not switched\. Browser storage is full/.test(await stat(p)), await stat(p));
    chk('and the refusal is counted', await p.evaluate(() => DIAG.refused.some(x => x.what === 'Which appropriation this browser opens' && x.why === 'QuotaExceededError')));
    chk('no page error', errs.length === 0, J(errs));
    await ctx.close(); }
  // ---------------------------------------------------------------- W
  console.log('\nW. two Saves in a full browser, no writer key and no editor name stored');
  { const ctx = await ctxOf({}, ['prio27appn', 'prio27writerKey', 'prio27who']);
    const { p, errs, dialogs } = await openBoard(ctx, null);
    // the board file, stood in from page code: a handle remembered for this page, and both windows answering with it (the Save
    // window empties what it picks, as Chromium does)
    await p.evaluate(() => {
      window.__disk = { content: '', writes: 0 };
      const h = { kind: 'file', name: 'ORBIT Board.html',
        queryPermission: async () => 'granted', requestPermission: async () => 'granted',
        isSameEntry: async o => o === h,
        getFile: async () => ({ name: 'ORBIT Board.html', size: window.__disk.content.length, lastModified: 1, text: async () => window.__disk.content }),
        createWritable: async () => { let buf = ''; return { write: async x => { buf += String(x); }, close: async () => { window.__disk.content = buf; window.__disk.writes++; } }; } };
      window.showOpenFilePicker = async () => [h];
      window.showSaveFilePicker = async () => { window.__disk.content = ''; return h; };
      FH = h;
    });
    await fill(p, 0);
    dialogs.length = 0;
    await p.evaluate(() => { S.notes.A = 'first'; save(); render(); });
    await p.evaluate(() => saveInPlaceFile());
    const s1 = await stat(p);
    await p.evaluate(() => { S.notes.A = 'second'; save(); render(); });
    await p.evaluate(() => saveInPlaceFile());
    const s2 = await stat(p);
    const w = await p.evaluate(() => ({ writes: window.__disk.writes, pen: uiPenOther(), by: MS.by, key: localStorage.getItem('prio27writerKey') }));
    chk('both Saves write the file', w.writes === 2, J(w));
    chk('the second is “💾 Saved in place by BL”', /^💾 Saved in place by BL/.test(s2), s2);
    chk('the pen is this browser’s own, and the board is stamped BL', w.pen === '' && w.by === 'BL', J(w));
    chk('the editor name was asked once', dialogs.filter(d => d.type === 'prompt').length === 1, J(dialogs));
    chk('the first Save says storage would not keep the writer key', /would not keep this browser’s writer key/.test(s1), s1);
    chk('the writer key is not in storage (it is kept for the page)', w.key === null, J(w));
    chk('no page error', errs.length === 0, J(errs));
    await ctx.close(); }
} catch (e) {
  chk('the run threw: ' + String((e && e.message) || e).slice(0, 300), false);
}
await b.close();
console.log(bad ? `\n${bad} FAILING CHECK(S)` : '\nall storage-full checks passed');
process.exit(bad ? 1 : 0);
