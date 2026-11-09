// A FULL IMPORT TOO BIG FOR BROWSER STORAGE, WRITTEN INTO A NEW FILE -- IN A REAL BROWSER (v2.14, item 141; Brad, 2 Nov 2026:
// "I'm unable to import my full board to the newest Orbit version"). jsdom has no IndexedDB of its own, no user activation, no
// downloads and no "Leave site?"; this opens the program in Chromium with browser storage seeded from a page of its own, imports a
// board built here every run (a small board saved by the board's own code, its cost estimate padded past the 5,242,880 characters
// a browser keeps, in pieces under the import check's 200,000-character text limit), and checks:
//
//   A. BRAD'S ALERT IS GONE: the import is refused exactly as before -- browser storage byte-identical -- and the box offers
//      "Write the imported board into a new file…" where v2.13 showed an alert and offered nothing.
//   B. WRITE, WITH THE NAME SUGGESTED: the save window is asked for inside the click (user activation); the file is written and
//      read back; the import's keys are cleared, the note is in, and the page reopens -- and says it is held. The written file,
//      opened in a second tab, prints every appropriation's figures as the board file opened directly in a fresh browser; an edit
//      there, 💾 Save (one window), Save again (none), reopened, and Full Fund too.
//   C. WRITTEN OVER THE PAGE THAT RAN IT: the program's own file chosen; the reload opens straight into the board, its report says
//      "into this file", and it takes the handle it was written through, so 💾 Save writes with no window.
//   D. A FAILURE AFTER THE PICK (the close rejects): nothing cleared, and both copies download with their exact bytes; and while a
//      write is held, closing the tab asks first (C23: W3's leave prompt reads impFileHolds).
//   E. TWO TABS: the importing page reopened is held -- its edit is not in browser storage -- and the written file opens as the
//      imported board.
//   F. NO SAVE WINDOW (showSaveFilePicker deleted): the board downloads; opened over ANOTHER board's older copy in this browser, it
//      shows its own requirement list and the engine's totals (the old copies are cleared before anything reads them).
//
//   --gtk: the REAL save dialog (GTK), headed under Xvfb (started on :97 when DISPLAY is unset), driven by tools/xkeys.py (XTest
//   through ctypes): Write, Control+a, the full path of the board being imported, Return -- the dialog asks to replace it, Return
//   again. createWritable is wrapped from page code to reject after that real pick. Asserts: the window was asked for with user
//   activation; the source on disk is 0 bytes (a CONTROL: Chromium emptied it); browser storage byte-identical; no reopening; no
//   note; "💾 the file you imported" downloads bytes whose sha256 is the source's; "💾 the imported board (new version)" a board
//   that passes the import check and carries its stamp. Run by hand, once a version (contract D11).
//
//   Browser storage is set by a page of its own after it has loaded (seedLs), never by an init script (v2.12: an init script can
//   give a file:// tab a storage area of its own); the run refuses to start if an init script here touches storage. Both save
//   windows are stood in where a section saves (C14); the Save window empties a file that exists the moment it is chosen, as
//   Chromium's does (measured 8,793,759 -> 0 bytes).
//
//   node tools/import-file.mjs [--board FILE] [--gtk]
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { boot, seed } from './export-audit/boot.mjs';
import { CHROME } from './chrome.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const bi = process.argv.indexOf('--board');
const FILE = resolve(bi >= 0 ? process.argv[bi + 1] : join(ROOT, 'prioritization-board-grid.html'));
const GTK = process.argv.includes('--gtk');
let bad = 0;
const chk = (what, ok, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail && !ok ? '   ' + detail : ''}`); };
const say = (what) => console.log(`  INT  ${what}`);
const J = JSON.stringify;
{ const self = readFileSync(new URL(import.meta.url), 'utf8'), at = new RegExp('\\.addInit' + 'Script\\(', 'g'); let m, hit = 0;
  while ((m = at.exec(self))) if (/localStorage|sessionStorage/.test(self.slice(m.index, m.index + 600))) hit++;
  if (hit) { console.log(`\n${hit} init script(s) in tools/import-file.mjs touch browser storage: set it with seedLs() instead (see the header)\n`); process.exit(1); } }

// ── THE BOARD, built here every run by the board's own code: O&M and Full Fund, a locked cycle, the estimate past the limit ──
const PROG = readFileSync(FILE, 'utf8');
const dir = mkdtempSync(join(tmpdir(), 'orbit-fileimport-'));
process.on('exit', () => { try { rmSync(dir, { recursive: true, force: true }); } catch {} });
const SVC = ['USAF', 'ANG', 'AFRC'];
const mk = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Req ' + id, event: 'E' + id, ccar: '', fy26: [0, 0, 0], ask, alloc: null });
const ap = (html, appn, items, disc) => {
  const B = boot({ html, appn });
  seed(B.ev, { services: SVC, items, disc, mand: [500, 150, 80], order: items.map(i => i.id) });
  B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); S.notes[${J(items[0].id)}]='kept note'; save(); blCyc='PB'; blYr=MS.cur; cycLock(); 'ok'`);
  return B;
};
const F = ap(PROG, 'FULL FUND', [mk('F1', 'AV', [700, 100, 60]), mk('F2', 'TSS', [500, 90, 30])], [900, 150, 60]);
const O = ap(F.ev('buildSavedHtml()'), 'O&M', [mk('A', 'AV', [900, 200, 100]), mk('B', 'PSM', [400, 100, 50]), mk('C', 'AV', [300, 50, 20])], [2000, 600, 300]);
O.ev(`(function(){ const blob=[]; for(let i=0;i<29;i++) blob.push('a'+String(i).padStart(4,'0')+'x'.repeat(189995));
  ACEDB={ts:Date.now(), sets:{'2026ACE':{label:'2026ACE', ts:Date.now(), blob:blob}}}; return 'ok'; })()`);
const SRC = O.ev('buildSavedHtml()');
const SRCN = 'ORBIT Live.html', PROGN = 'ORBIT v2.14.html';
writeFileSync(join(dir, SRCN), SRC);
writeFileSync(join(dir, 'seed.html'), '<!doctype html><meta charset="utf-8"><title>seed</title>');
// ANOTHER, OLDER BOARD (F): its own requirements (X, Y), clocks a day back, its data pack in its plan -- left in this browser
const X = boot({ html: PROG });
seed(X.ev, { services: SVC, items: [mk('X', 'AV', [50, 5, 5]), mk('Y', 'PSM', [30, 3, 3])], disc: [70, 7, 7], mand: [1, 1, 1], order: ['X', 'Y'] });
X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save();
  MS.dataPack=dataPackOf(); MS.ts=1700000000000; MS.years[MS.cur]=S; localStorage.setItem(_AP.key, JSON.stringify(MS)); 'ok'`);
const STALE = { prio27om: X.ev('localStorage.getItem(_AP.key)'), 'prio27om.base': J({ file: 1700000000000, folder: {}, dirty: false }) };
console.log(`\nthe board: ${SRC.length.toLocaleString()} characters, ${statSync(join(dir, SRCN)).size.toLocaleString()} bytes`);
chk('the fixture is past what browser storage holds (a CONTROL)', SRC.length > 5242880, SRC.length);

// --gtk: a headed browser needs a display -- Xvfb on :97 when none is set, started before the browser is
let XV = null;
if (GTK && !process.env.DISPLAY) {
  if (!existsSync('/usr/bin/Xvfb')) { console.log('  FAIL the harness: Xvfb is not installed (/usr/bin/Xvfb)'); process.exit(1); }
  XV = spawn('/usr/bin/Xvfb', [':97', '-screen', '0', '1280x900x24'], { stdio: 'ignore' }); await new Promise(r => setTimeout(r, 1000));
  process.env.DISPLAY = ':97';
  process.on('exit', () => { try { XV.kill(); } catch {} });
}
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'], headless: !GTK, env: GTK ? Object.assign({}, process.env) : undefined });
const newCtx = async (ls) => { const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); await p.goto('file://' + join(dir, 'seed.html'));
  await p.evaluate((ls) => { localStorage.clear(); localStorage.setItem('prio27who', 'Brad'); Object.keys(ls).forEach(k => localStorage.setItem(k, ls[k])); }, ls || {});
  await p.close(); return ctx; };
// the files the stand-in windows choose live on disk, in `dir`, reached from the page through exposed functions
const disk = async (p) => {
  await p.exposeFunction('__fsRead', n => { const f = join(dir, n); return existsSync(f) ? readFileSync(f, 'utf8') : ''; });
  await p.exposeFunction('__fsWrite', (n, t) => { writeFileSync(join(dir, n), t); return true; });
  await p.exposeFunction('__fsHas', n => existsSync(join(dir, n)));
};
const STANDIN = (o) => {
  window.__ua = []; window.__opens = 0; window.__saves = 0; window.__pickAs = o.pickAs || null; window.__failClose = !!o.failClose; window.__gate = null;
  class StandIn { constructor(n) { this.name = n; } async requestPermission() { return 'granted'; } async queryPermission() { return 'granted'; }
    async getFile() { const t = await window.__fsRead(this.name); return { text: async () => t, size: t.length }; }
    async createWritable() { const n = this.name; let buf = '';
      return { write: async x => { buf += String(x); },
        close: async () => { if (window.__gate) await window.__gate; if (window.__failClose) throw new DOMException('the disk said no', 'InvalidStateError'); await window.__fsWrite(n, buf); } }; } }
  window.__StandIn = StandIn;
  if (o.noSave) delete window.showSaveFilePicker;
  else window.showSaveFilePicker = function (opt) {
    window.__ua.push(!!(navigator.userActivation && navigator.userActivation.isActive)); window.__saves++;
    const n = window.__pickAs || (opt && opt.suggestedName) || 'new.html';
    return window.__fsHas(n).then(function (has) { return has ? window.__fsWrite(n, '') : true; }).then(function () { return new StandIn(n); });   // Chromium empties it
  };
  window.showOpenFilePicker = async function () { window.__opens++; return [new StandIn(window.__pickAs || 'x.html')]; };
};
const open = async (ctx, name, o = {}) => {
  const p = await ctx.newPage(); const dialogs = [], errs = [];
  p.on('dialog', async d => { dialogs.push(d.type() + ': ' + d.message()); try { await d.accept(); } catch {} });
  p.on('pageerror', e => errs.push(e.message));
  await disk(p);
  await p.goto(pathToFileURL(join(dir, name)).href);
  await p.waitForFunction(() => typeof render === 'function' && typeof saveInPlace === 'function', null, { timeout: 60000 });
  await p.waitForTimeout(400);
  await p.evaluate(STANDIN, o);
  return { p, dialogs, errs };
};
const lsOf = p => p.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });
// what storage holds, BYTE FOR BYTE; this browser's writer key aside (the write makes one where storage had none).
// v2.15 W3 (item 146, tests 1): it compared key names and value lengths (lens()) -- a list rewritten at the same length (a figure
// changed for another of the same width) passed "byte-identical".
const bytes = o => J(Object.keys(o).filter(k => k !== 'prio27writerKey').sort().map(k => [k, o[k]]));
const doImport = async (p, name) => { await p.setInputFiles('#fullFile', join(dir, name || SRCN)); await p.waitForFunction(() => /Nothing was imported|Full board imported/.test((document.getElementById('shareStat') || {}).textContent || ''), null, { timeout: 60000 }); await p.waitForTimeout(300); };
const writeBtn = p => p.$('#impFileGo');
// Write, pressed as a person presses it. Since W3's lsMarksBack is in (contract C2, C9), a refused import leaves the page as saved as
// it was, so step 1 (work this browser holds that no saved copy has) must not show for nothing; INT-2 holds the same in jsdom.
const goWrite = async (p) => {
  const step1 = await p.evaluate(() => /1\. This browser holds work/.test((document.getElementById('impFileBody') || {}).textContent || ''));
  chk('the refused import left the page as saved as it was: no step 1 for nothing', !step1);
  if (step1)
    await p.evaluate(() => { const c = document.getElementById('impFileSkip'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.click('#impFileGo');
};
const figures = p => p.evaluate(() => { const T = tiers(), X = tierTotals(T);
  return J({ ap: APPN, tot: [X.dUsed, X.mUsed, X.u1Amt, X.u2Amt].map(v => Math.round(+v || 0)), rows: S.order.map(function (id) { const p0 = T[id]; return [id, p0.d.map(Math.round), p0.m.map(Math.round)]; }) });
  function J(x) { return JSON.stringify(x); } });
const toAppn = async (p, label) => { const nav = p.waitForNavigation({ timeout: 60000 }).catch(() => null);
  await p.evaluate((v) => { const s = document.getElementById('appnSel'); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }, label);
  await nav; await p.waitForFunction(() => typeof render === 'function' && typeof saveInPlace === 'function', null, { timeout: 60000 }); await p.waitForTimeout(400); };
// the source file opened directly, in a fresh browser: the figures every route must print
const truth = {};
{ const ctx = await newCtx(); const { p } = await open(ctx, SRCN);
  truth.om = await figures(p); await toAppn(p, 'FULL FUND'); truth.ff = await figures(p); await ctx.close(); }

if (GTK) await gtk(); else {
// ── A ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
console.log('\nA. the refusal offers the file');
{ writeFileSync(join(dir, PROGN), PROG);
  const ctx = await newCtx(); const { p, dialogs } = await open(ctx, PROGN);
  const ls0 = await lsOf(p); await doImport(p);
  chk('A · Brad’s alert no longer appears', !dialogs.some(d => /^alert: Nothing was imported from “ORBIT Live\.html” — browser storage refused/.test(d)), J(dialogs));
  chk('A · storage byte-identical', bytes(await lsOf(p)) === bytes(ls0));
  const btn = await writeBtn(p);
  chk('A · the box offers Write the imported board into a new file…', !!btn && /Write the imported board into a new file/.test(await btn.textContent()));
  await ctx.close(); }
// ── B ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
console.log('\nB. written with the name suggested, opened, saved twice');
{ writeFileSync(join(dir, PROGN), PROG);
  const ctx = await newCtx(); const { p } = await open(ctx, PROGN);
  await doImport(p);
  const nav = p.waitForNavigation({ timeout: 60000 }).catch(() => null);
  await goWrite(p);
  await nav; await p.waitForFunction(() => typeof render === 'function', null, { timeout: 60000 }); await p.waitForTimeout(500);
  const name = await p.evaluate(() => { try { return JSON.parse(localStorage.getItem('prio27impFile')).name; } catch (e) { return null; } });
  const written = name ? readFileSync(join(dir, name), 'utf8') : '';
  chk('B · the file written carries the stamp the note names', !!name && written.includes('"impFile"'), name);
  const ls = await lsOf(p);
  chk('B · the import’s keys are cleared', !('prio27om' in ls) && !('prio27ff' in ls) && !('prio27acedb' in ls), J(Object.keys(ls)));
  chk('B · the page reopened and says it is held', /ORBIT wrote the imported board into “/.test(await p.textContent('#shareStat')));
  const { p: q } = await open(ctx, name, { pickAs: name });       // its first Save chooses the file itself
  chk('B · the written file says it is the import', /Full board imported into this file/.test(await q.textContent('#shareStat')));
  chk('B · O&M: its figures are the source file’s', await figures(q) === truth.om);
  await q.evaluate(() => { S.notes.A = 'EDITED IN THE WRITTEN FILE'; save(); render(); });
  await q.evaluate(() => saveInPlace()); await q.waitForTimeout(1500);
  const w1 = await q.evaluate(() => [window.__saves, window.__opens]);
  chk('B · 💾 Save asks for one window', w1[0] + w1[1] === 1, J(w1));
  await q.evaluate(() => saveInPlace()); await q.waitForTimeout(1500);
  const w2 = await q.evaluate(() => [window.__saves, window.__opens]);
  chk('B · Save again asks for none', w2[0] + w2[1] === 1, J(w2));
  chk('B · the edit is in the file', readFileSync(join(dir, name), 'utf8').includes('EDITED IN THE WRITTEN FILE'));
  await q.reload(); await q.waitForFunction(() => typeof render === 'function', null, { timeout: 60000 }); await q.waitForTimeout(400);
  await toAppn(q, 'FULL FUND');
  chk('B · reopened, Full Fund: its figures are the source file’s', await figures(q) === truth.ff);
  await ctx.close(); }
// ── C ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
console.log('\nC. written over the page that ran it');
{ writeFileSync(join(dir, PROGN), PROG);
  const ctx = await newCtx(); const { p } = await open(ctx, PROGN, { pickAs: PROGN });
  await doImport(p);
  const nav = p.waitForNavigation({ timeout: 60000 }).catch(() => null);
  await goWrite(p);
  await nav; await p.waitForFunction(() => typeof render === 'function', null, { timeout: 60000 }); await p.waitForTimeout(800);
  chk('C · the reload opens straight into the board, saying it is in this file', /Full board imported into this file, “ORBIT v2\.14\.html”/.test(await p.textContent('#shareStat')));
  chk('C · O&M: its figures are the source file’s', await figures(p) === truth.om);
  const fh = await p.evaluate(() => (typeof FH !== 'undefined' && FH) ? FH.name : null);
  chk('C · it took the handle it was written through', fh === PROGN, fh);
  // a structured clone keeps only the handle's name: the stand-in's methods are given back so it can write through it
  await p.evaluate(STANDIN, {}); await p.evaluate(() => { if (FH) Object.setPrototypeOf(FH, window.__StandIn.prototype); S.notes.A = 'SAVED OVER ITSELF'; save(); });
  await p.evaluate(() => saveInPlace()); await p.waitForTimeout(1500);
  chk('C · 💾 Save writes with no window', J(await p.evaluate(() => [window.__saves, window.__opens])) === '[0,0]' && readFileSync(join(dir, PROGN), 'utf8').includes('SAVED OVER ITSELF'));
  await ctx.close(); }
// ── D ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
console.log('\nD. a failure after the pick; leaving while a write is held');
{ writeFileSync(join(dir, PROGN), PROG);
  const ctx = await newCtx(); const { p } = await open(ctx, PROGN, { failClose: true });
  await doImport(p); const ls0 = await lsOf(p);
  await goWrite(p);
  await p.waitForFunction(() => /could not be written into/.test((document.getElementById('shareStat') || {}).textContent || ''), null, { timeout: 60000 });
  chk('D · nothing cleared, no note', bytes(await lsOf(p)) === bytes(ls0) && !(await p.evaluate(() => localStorage.getItem('prio27impFile'))));
  const got = {};
  for (const [re, k] of [[/the imported board \(new version\)/, 'html'], [/the file you imported/, 'inc']]) {
    const dl = p.waitForEvent('download', { timeout: 20000 });
    await p.evaluate((src) => { const b0 = [...document.querySelectorAll('#shareStat button')].find(x => new RegExp(src).test(x.textContent)); b0.click(); }, re.source);
    const d = await dl; const f = join(dir, 'dl-' + k + '.html'); await d.saveAs(f); got[k] = readFileSync(f, 'utf8'); }
  chk('D · “the file you imported” downloads byte for byte', got.inc === SRC);
  chk('D · “the imported board (new version)” downloads the board the write built', got.html === await p.evaluate(() => _impFile.rescue.html.text) && got.html.includes('"impFile"'));
  // a write held at its close: leaving the page asks (W3's prompt reads impFileHolds)
  await p.evaluate(() => { window.__failClose = false; let open; window.__gate = new Promise(r => { open = r; }); window.__open = open; });
  const btn = await writeBtn(p); await btn.click(); await p.waitForTimeout(400);
  chk('D · while the write is held, the file route holds the only copy', await p.evaluate(() => impFileHolds()) === true);
  const hasLeave = await p.evaluate(() => typeof memOnlyLeave === 'function');
  let asked = false; p.once('dialog', async d => { asked = d.type() === 'beforeunload'; try { await d.dismiss(); } catch {} });
  await p.close({ runBeforeUnload: true }); await new Promise(r => setTimeout(r, 800));
  chk('D · this board has the leave prompt (memOnlyLeave)', hasLeave);
  chk('D · closing the tab while it writes asks first (beforeunload)', asked);
  await ctx.close(); }
// ── E ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
console.log('\nE. two tabs: the importing page is held, the written file opens as the import');
{ writeFileSync(join(dir, PROGN), PROG);
  const ctx = await newCtx(); const { p } = await open(ctx, PROGN);
  await doImport(p);
  const nav = p.waitForNavigation({ timeout: 60000 }).catch(() => null);
  await goWrite(p); await nav;
  await p.waitForFunction(() => typeof render === 'function', null, { timeout: 60000 }); await p.waitForTimeout(500);
  const name = await p.evaluate(() => JSON.parse(localStorage.getItem('prio27impFile')).name);
  const { p: q } = await open(ctx, name);
  await p.waitForTimeout(300);
  await p.evaluate(() => { S.notes.A = 'EDIT IN THE HELD TAB'; save(); });
  chk('E · the held tab’s edit is not in browser storage', !((await p.evaluate(() => localStorage.getItem('prio27om'))) || '').includes('EDIT IN THE HELD TAB'));
  await q.reload(); await q.waitForFunction(() => typeof render === 'function', null, { timeout: 60000 }); await q.waitForTimeout(400);
  chk('E · the written file, reopened, is the imported board', await figures(q) === truth.om);
  await ctx.close(); }
// ── F ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
console.log('\nF. no save window: downloaded, and opened over another board’s older copy');
{ writeFileSync(join(dir, PROGN), PROG);
  const ctx = await newCtx(STALE); const { p } = await open(ctx, PROGN, { noSave: true });
  await doImport(p);
  const dl = p.waitForEvent('download', { timeout: 30000 });
  await goWrite(p);
  const d = await dl; const dn = d.suggestedFilename(); await d.saveAs(join(dir, dn));
  chk('F · one download, under the name suggested', /\(ORBIT v[0-9.]+\)\.html$/.test(dn), dn);
  const { p: q } = await open(ctx, dn);
  const ids = await q.evaluate(() => JSON.stringify(DATA.items.map(i => i.id).sort()));
  chk('F · opened over the older board’s copy, it shows its own requirement list', ids === '["A","B","C"]', ids);
  chk('F · and the engine’s totals', await figures(q) === truth.om);
  await ctx.close(); }
}

async function gtk() {
  console.log('\n--gtk: the real save dialog');
  const xv = null;     // started above, before the browser
  const XK = join(ROOT, 'tools', 'xkeys.py');
  const xkeys = (...a) => { const r = spawnSync('python3', ['-I', XK, ...a], { encoding: 'utf8', env: process.env }); if (r.status !== 0) throw new Error('xkeys: ' + (r.stderr || r.stdout)); return r.stdout; };
  try { xkeys('--check'); } catch (e) { console.log('  FAIL the harness: ' + e.message + ' (libXtst missing?)'); if (xv) xv.kill(); process.exit(1); }
  writeFileSync(join(dir, PROGN), PROG);
  const sha0 = createHash('sha256').update(readFileSync(join(dir, SRCN))).digest('hex');
  const ctx = await newCtx(); const p = await ctx.newPage(); const dialogs = [];
  p.on('dialog', async d => { dialogs.push(d.type()); try { await d.accept(); } catch {} });
  await p.goto(pathToFileURL(join(dir, PROGN)).href);
  await p.waitForFunction(() => typeof render === 'function' && typeof saveInPlace === 'function', null, { timeout: 60000 }); await p.waitForTimeout(400);
  await p.evaluate(() => { window.__ua = [];
    const real = window.showSaveFilePicker.bind(window);
    window.showSaveFilePicker = function (o) { window.__ua.push(!!(navigator.userActivation && navigator.userActivation.isActive)); return real(o); };
    FileSystemFileHandle.prototype.createWritable = async function () { throw new DOMException('the test refuses the write after the real pick', 'InvalidStateError'); }; });
  const ls0 = await lsOf(p);
  await doImport(p);
  const nav0 = p.url();
  await goWrite(p); await new Promise(r => setTimeout(r, 1500));
  // the moves measured on 2 Nov (proto q141-verify-fix-0): select the name, type the source's full path, Escape closes the
  // completion list, then the dialog's Save button (on a 1280×900 screen); Return as well, should a "replace?" question follow
  const shot = (n) => { const si = process.argv.indexOf('--shots'); if (si >= 0) spawnSync('import', ['-window', 'root', join(process.argv[si + 1], n + '.png')], { env: process.env }); };
  shot('1-dialog');
  xkeys('key', 'Control_L+a', 'type', join(dir, SRCN), 'key', 'Escape'); await new Promise(r => setTimeout(r, 800));
  shot('2-typed');
  xkeys('click', '1074,798'); await new Promise(r => setTimeout(r, 2500));
  shot('3-saved');
  if (!/could not be written into/.test(await p.textContent('#shareStat'))) { xkeys('key', 'Return'); await new Promise(r => setTimeout(r, 2000)); }
  await p.waitForFunction(() => /could not be written into/.test((document.getElementById('shareStat') || {}).textContent || ''), null, { timeout: 20000 }).catch(() => {});
  console.log('  …  the message line: ' + String(await p.textContent('#shareStat')).slice(0, 160));
  chk('gtk · the save window was asked for with user activation', J(await p.evaluate(() => window.__ua)) === '[true]');
  chk('gtk · the source on disk is 0 bytes now (a CONTROL: Chromium emptied it)', statSync(join(dir, SRCN)).size === 0, statSync(join(dir, SRCN)).size);
  chk('gtk · storage byte-identical, no note', bytes(await lsOf(p)) === bytes(ls0) && !(await p.evaluate(() => localStorage.getItem('prio27impFile'))));
  chk('gtk · no reopening', p.url() === nav0);
  const got = {};
  for (const [re, k] of [[/the imported board \(new version\)/, 'html'], [/the file you imported/, 'inc']]) {
    const dl = p.waitForEvent('download', { timeout: 20000 });
    await p.evaluate((src) => { const b0 = [...document.querySelectorAll('#shareStat button')].find(x => new RegExp(src).test(x.textContent)); b0.click(); }, re.source);
    const d = await dl; const f = join(dir, 'gtk-' + k + '.html'); await d.saveAs(f); got[k] = readFileSync(f); }
  chk('gtk · “the file you imported” downloads the source, sha256 for sha256', createHash('sha256').update(got.inc).digest('hex') === sha0);
  const nb = got.html.toString('utf8');
  chk('gtk · “the imported board (new version)” passes the import check and carries its stamp', nb.includes('"impFile"') && (await p.evaluate(t => inboundCheck(t), nb)) === '');
  await ctx.close(); if (xv) xv.kill();
}

await b.close();
console.log('\n' + '='.repeat(96));
if (bad) { console.log(`${bad} FAILING CHECK(S)`); process.exit(1); }
console.log('ALL CHECKS PASSED');
process.exit(0);      // --gtk's Xvfb is a child of this process: exit rather than wait on it
