// SAVE WRITES ONLY TO ITS OWN FILE, IN A REAL BROWSER (v2.14 W1, item 140 -- found 2 Nov 2026 while diagnosing item 141).
// jsdom has no IndexedDB at all, so the measured case lives here: every ORBIT file a browser opens shares one handle store
// (IndexedDB prio-fh), and until v2.14 the board kept its save file there under FNAME, the same key in every version. A v2.13
// program tab whose full import was refused found the old board's handle and wrote 3,878,541 characters of O&M-only board over
// an 8,781,027-character board file, with no window and no question. This holds the fix in Chromium, with the real IndexedDB:
//
//   A. THE MEASURED CASE. The old board (the v2.12 program, four appropriations, each with a locked PB27, a cost estimate,
//      execution data and a BAE list -- built here in jsdom, never committed) is saved in place once, as it saves: its handle
//      under FNAME. The board under test, opened as a program in another folder of the same browser, has its full import
//      refused (browser storage refuses the cost estimates, forced from page code through the same all-or-nothing write), then
//      💾 Save is pressed: the Open window is offered once, nothing is written (the window is cancelled), the old file is byte
//      for byte as it was, and the page's handle-store log never names FNAME. On v2.13 it writes the old file over.
//   B. THE OPEN WINDOW RETURNS THE OLD BOARD: read, checked, and the question names Full Fund, Initial Spares and OPN, whole, and
//      their locked cycles; Cancel writes nothing and remembers nothing.
//   C. THE OPEN WINDOW RETURNS THE PROGRAM'S OWN FILE (an ORBIT program with no board, item 141 D): written in place, the writer
//      claimed, no question.
//   D. A BOARD FILE'S FIRST SAVE PICKS ITSELF: no question, written; the second Save writes with no window.
//   E. (INT: needs W4's record writer, baseMarkDirty.) A blank v2.14 tab's change, then the v2.12 old board's Save in the same
//      browser: it asks (HOLD ON) and, cancelled, writes nothing. On v2.13 it writes the near-empty plan over its file silently.
//      Runs when the board under test has baseMarkDirty (after integration) or with --int; otherwise it says it was skipped.
//   F. AN FNAME ENTRY NAMING THE NEW FILE (as a v2.13 page's _fhPut leaves it): after a v2.14 Save of that file it is gone, and
//      the v2.12 board's next Save opens its window instead of writing over it.
//
// THE STAND-INS. A file handle cannot be made for a test (the origin-private file system is refused on file://), so the handle
// store keeps a token ({__standin: name}) and each page turns it back into a stand-in handle that reads and writes the real file
// on disk through functions this script exposes. Every stand-in is installed from page code after the page has loaded -- never
// from an init script, which touches storage while a file:// document is still being created (the v2.12 pmo-save finding) --
// and both windows are stood in (contract C14). A file chosen in the Save window is emptied the moment it is chosen, as
// Chromium does (measured: 8,793,759 characters to 0).
//
//   node tools/save-target.mjs [--board FILE] [--int]
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { boot, seed } from './export-audit/boot.mjs';
import { CHROME } from './chrome.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const bi = process.argv.indexOf('--board');
const FILE = resolve(bi >= 0 ? process.argv[bi + 1] : join(ROOT, 'prioritization-board-grid.html'));
const FORCE_INT = process.argv.includes('--int');
const FNAME = 'FY27 Consolidated Prioritization Board.html';
const OLDREF = 'd630240';      // v2.12 on main (the build Brad's board file was saved by)
let bad = 0;
const chk = (what, ok, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail && !ok ? '   ' + String(detail).slice(0, 300) : ''}`); };
const J = JSON.stringify;
// the rule above, held: an init script in this file stops the run before it opens a browser
{ const self = readFileSync(new URL(import.meta.url), 'utf8'), at = new RegExp('\\.addInit' + 'Script\\(', 'g');
  if (at.test(self)) { console.log('save-target: this file calls addInitScript -- seed and stand in from page code after load'); process.exit(2); } }

// ── the old board: the v2.12 program, four appropriations, each with a locked PB27, and the board-wide lists ──────────────
let V212;
try { V212 = execFileSync('git', ['show', OLDREF + ':prioritization-board-grid.html'], { cwd: ROOT, maxBuffer: 64 << 20 }).toString('utf8'); }
catch (e) { console.log(`save-target: cannot read the v2.12 program (${OLDREF}) from git -- in a shallow clone, run git fetch --unshallow first`); process.exit(2); }
const SVC3 = ['USAF', 'ANG', 'AFRC'];
const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Req ' + id, event: 'Ev ' + id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
const APS = [['FULL FUND', 'ff', ['F1', 'F2', 'F3']], ['INITIAL SPARES', 'sp', ['S1', 'S2']], ['OPN', 'opn', ['P1']], ['O&M', 'om', ['A', 'B', 'C', 'D']]];
let OLDHTML = V212;
for (const [appn, slug, ids] of APS) {
  const B = boot({ html: OLDHTML, appn });
  seed(B.ev, { services: SVC3, items: ids.map((id, i) => it(id, i % 2 ? 'PSM' : 'AV', [100 * (i + 1), 20, 10])),
    disc: [5000, 500, 500], mand: [500, 50, 50], order: ids });
  B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S);
    S.notes=S.notes||{}; S.notes[${J(ids[0])}]='kept in ${slug}'; MS.years[MS.cur]=S; save(); blCyc='PB'; blYr=MS.cur; cycLock(); save(); 'ok'`);
  if (slug === 'om') B.ev(`(function(){ const t=Date.now();
    BUDDB={ts:t, rows:[{ap:'om', svc:'USAF', name:'USAF O&M AV', amt:1}, {ap:'ff', svc:'USAF', name:'USAF PROC AV', amt:2}], files:['bae.xlsx']}; persistBud();
    EXDB={ts:t, all:{om:{fy:2027, rows:[['JSF1', 5000]]}, ff:{fy:2027, rows:[['JSF2', 6000]]}}}; persistExdb();
    ACEDB={ts:t, sets:{'2026ACE':{fp:'fp-2026', locked:true, appn:{om:{pmo:{AV:{2027:900}}}}, lines:[{n:'2026'}]}}}; persistAce();
    save(); return 'ok'; })()`);
  OLDHTML = B.ev('buildSavedHtml()');
}
const pubOf = html => { const m = /<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/.exec(String(html)); try { return JSON.parse(m[1]); } catch { return null; } };
const OLDST = pubOf(OLDHTML);
console.log('save-target: the board under test ' + FILE.split('/').pop() + '; the old board, v2.12 (' + OLDREF + '), ' + OLDHTML.length + ' characters, appropriations '
  + Object.keys((OLDST && OLDST.appns) || {}).join(', '));

// ── the run's folders: the old board, the board under test as a program, a blank page for the browser to start on ──────────
const dir = mkdtempSync(join(tmpdir(), 'save-target-'));
for (const d of ['old', 'new', 'd', 'e']) mkdirSync(join(dir, d));
const DISK = { 'ORBIT Live.html': join(dir, 'old', 'ORBIT Live.html'), 'ORBIT new.html': join(dir, 'new', 'ORBIT new.html'),
  'ORBIT board.html': join(dir, 'd', 'ORBIT board.html'), 'ORBIT e.html': join(dir, 'e', 'ORBIT e.html') };
writeFileSync(DISK['ORBIT Live.html'], OLDHTML);
copyFileSync(FILE, DISK['ORBIT new.html']);
copyFileSync(FILE, DISK['ORBIT e.html']);
const BLANK = join(dir, 'blank.html'); writeFileSync(BLANK, '<!doctype html><meta charset="utf-8"><title>blank</title><body>blank</body>');
const rd = n => readFileSync(DISK[n], 'utf8');

// ── a page, its dialogs answered by policy and recorded; the stand-ins installed from its own code after load ─────────────
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const idbLog = [];
const page = async (ctx, n, tag, answer) => {
  const p = await ctx.newPage(); const errs = [], dialogs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', async d => { dialogs.push(d.message()); if (answer(d.message())) await d.accept(); else await d.dismiss(); });
  await p.exposeFunction('__dRead', x => readFileSync(DISK[x], 'utf8'));
  await p.exposeFunction('__dWrite', (x, t) => { writeFileSync(DISK[x], t); return t.length; });
  await p.exposeFunction('__log', s => { idbLog.push(tag + ' ' + s); });
  await p.goto('file://' + BLANK);
  await p.goto('file://' + DISK[n]);
  await p.waitForFunction(() => typeof render === 'function' && typeof saveInPlace === 'function' && document.documentElement.classList.contains('ui-on'), null, { timeout: 60000 });
  await p.waitForTimeout(600);
  return { p, errs, dialogs, tag };
};
// open: the name the Open window returns (null: cancelled); save: the name the Save window returns (null: cancelled)
const install = (P, cfg) => P.p.evaluate(cfg => {
  const mk = n => ({ name: n, kind: 'file', __standin: n,
    isSameEntry: async o => !!(o && o.__standin === n),
    queryPermission: async () => 'granted', requestPermission: async () => 'granted',
    getFile: async () => { const t = await window.__dRead(n); return new File([t], n, { type: 'text/html' }); },
    createWritable: async () => { let buf = ''; return { write: async d => { buf += (typeof d === 'string' ? d : await new Blob([d]).text()); },
      close: async () => { await window.__dWrite(n, buf); } }; } });
  window.__mk = mk;
  if (!window.__idbPatched) {
    window.__idbPatched = true;
    const P = IDBObjectStore.prototype, put0 = P.put, get0 = P.get, del0 = P.delete;
    P.put = function (v, k) { window.__log('put ' + k); return put0.call(this, v && v.__standin ? { __standin: v.__standin } : v, k); };
    P.delete = function (k) { window.__log('delete ' + k); return del0.call(this, k); };
    P.get = function (k) { window.__log('get ' + k); const req = get0.call(this, k);
      return new Proxy(req, { get(t, q) { if (q === 'result') { const x = t.result; return x && x.__standin ? mk(x.__standin) : x; }
        const v = t[q]; return typeof v === 'function' ? v.bind(t) : v; }, set(t, q, v) { t[q] = v; return true; } }); };
  }
  const abort = () => { const e = new Error('The user aborted a request.'); e.name = 'AbortError'; return e; };
  window.__picks = { open: 0, save: [] };
  window.showOpenFilePicker = async () => { window.__picks.open++; if (cfg.open) return [mk(cfg.open)]; throw abort(); };
  window.showSaveFilePicker = async o => { window.__picks.save.push(o && o.suggestedName);
    if (!cfg.save) throw abort(); await window.__dWrite(cfg.save, ''); return mk(cfg.save); };   // emptied on pick, as Chromium does
}, cfg);
const save = async (P) => { await P.p.evaluate(() => Promise.resolve(saveInPlace()).catch(() => {})); await P.p.waitForTimeout(800); };
const stat = P => P.p.evaluate(() => (document.getElementById('shareStat') || {}).textContent || '');
const picks = P => P.p.evaluate(() => window.__picks);
const idbKeys = P => P.p.evaluate(() => new Promise(res => { const r = indexedDB.open('prio-fh', 1);
  r.onupgradeneeded = () => { try { r.result.createObjectStore('h'); } catch (e) {} };
  r.onsuccess = () => { try { const q = r.result.transaction('h', 'readonly').objectStore('h').getAllKeys(); q.onsuccess = () => res(q.result.map(String)); } catch (e) { res(['ERR ' + e.message]); } };
  r.onerror = () => res(['ERR open']); }));
const idbPutToken = (P, key, name) => P.p.evaluate(([k, n]) => new Promise(res => { const r = indexedDB.open('prio-fh', 1);
  r.onupgradeneeded = () => { try { r.result.createObjectStore('h'); } catch (e) {} };
  r.onsuccess = () => { const tx = r.result.transaction('h', 'readwrite'); tx.objectStore('h').put({ __standin: n }, k); tx.oncomplete = () => res(true); };
  r.onerror = () => res(false); }), [key, name]);
const ffName = { om: 'O&M', ff: 'Full Fund', sp: 'Initial Spares', opn: 'OPN' };
const idsOf = pl => { const s = new Set(); Object.values((pl && pl.years) || {}).forEach(y => { (y.order || []).forEach(x => s.add(x)); (y.custom || []).forEach(c => s.add(c && c.id)); }); return s; };
const plural = (n, a, z) => n + ' ' + (n === 1 ? a : z);

const ctx = await b.newContext({ viewport: { width: 1500, height: 950 } });
let OLDBYTES = '';
// ── A: the measured case ─────────────────────────────────────────────────────────────────────────────────────────────────
console.log('\nA · the measured case: a program tab, its full import refused, then 💾 Save');
try {
  const O = await page(ctx, 'ORBIT Live.html', 'v2.12', () => true);
  await install(O, { save: 'ORBIT Live.html' });
  await save(O);
  OLDBYTES = rd('ORBIT Live.html');
  const ost = pubOf(OLDBYTES);
  chk('A · the old board saved in place once, as v2.12 saves: its handle under the shared file name (the fixture)',
    idbLog.includes('v2.12 put ' + FNAME) && !!(ost && ost.appns && ost.appns.ff && ost.appns.sp && ost.appns.opn), J({ log: idbLog, aps: ost && Object.keys(ost.appns || {}) }));
  await O.p.close();
  const N = await page(ctx, 'ORBIT new.html', 'new', () => true);
  await N.p.evaluate(() => { const si = Storage.prototype.setItem; window.__si0 = si;
    Storage.prototype.setItem = function (k, v) { if (k === 'prio27acedb') throw new DOMException('The quota has been exceeded.', 'QuotaExceededError'); return si.call(this, k, v); }; });
  await N.p.setInputFiles('#fullFile', DISK['ORBIT Live.html']); await N.p.waitForTimeout(7000);
  await N.p.evaluate(() => { Storage.prototype.setItem = window.__si0; });
  chk('A · the full import was refused, and the board says so (the fixture)', /Nothing was imported|not imported/i.test(await stat(N)), (await stat(N)).slice(0, 200));
  const l0 = idbLog.length;
  await install(N, { open: null, save: null });
  await save(N);
  const pk = await picks(N), nl = idbLog.slice(l0).filter(l => l.startsWith('new '));
  chk('A · 💾 Save offers the Open window once, never the Save window', pk.open === 1 && pk.save.length === 0, J(pk));
  chk('A · the old board file is byte for byte as it was', rd('ORBIT Live.html') === OLDBYTES, 'it now holds ' + rd('ORBIT Live.html').length + ' characters, was ' + OLDBYTES.length);
  chk('A · the page’s handle-store log never names the shared file name', !nl.some(l => l.indexOf(FNAME) >= 0) && nl.length > 0, J(nl));
  chk('A · nothing threw', N.errs.length === 0, N.errs.slice(0, 2).join(' | '));
  // ── B: the Open window returns the old board ───────────────────────────────────────────────────────────────────────────
  console.log('\nB · the Open window returns the old board: read, checked, asked about; Cancel writes nothing');
  N.dialogs.length = 0;
  const answerNo = () => false;
  N.p.removeAllListeners('dialog'); N.p.on('dialog', async d => { N.dialogs.push(d.message()); if (answerNo()) await d.accept(); else await d.dismiss(); });
  await install(N, { open: 'ORBIT Live.html', save: null });
  await save(N);
  const q = N.dialogs.filter(m => /holds what the board on screen does not carry/.test(m));
  const want = ['ff', 'sp', 'opn'].map(k => ffName[k] + ' — ' + plural(idsOf(OLDST.appns[k]).size, 'requirement', 'requirements') + ', '
    + plural(Object.keys(OLDST.appns[k].years || {}).length, 'year', 'years'));
  const lines = (q[0] || '').split('\n').filter(l => /^  • /.test(l)).map(l => l.slice(4));
  chk('B · one question, naming Full Fund, Initial Spares and OPN whole, with their requirements and years', q.length === 1 && want.every(w => lines.includes(w)), J({ want, lines, dialogs: N.dialogs.map(m => m.slice(0, 80)) }));
  const cyc = lines.find(l => /^Locked PPBE cycles?: /.test(l)) || '';
  chk('B · and their locked cycles', ['Full Fund PB27', 'Initial Spares PB27', 'OPN PB27'].every(c => cyc.indexOf(c) >= 0), cyc);
  chk('B · O&M, which the board on screen carries, is not named whole', !lines.some(l => /^O&M — /.test(l)), J(lines));
  chk('B · Cancel writes nothing, and remembers nothing for this page', rd('ORBIT Live.html') === OLDBYTES
    && !(await idbKeys(N)).some(k => k.indexOf('ORBIT%20new.html') >= 0 || k.indexOf('ORBIT new.html') >= 0), J(await idbKeys(N)));
  // ── C: the Open window returns the program's own file ──────────────────────────────────────────────────────────────────
  console.log('\nC · the Open window returns the program’s own file: written in place, no question (item 141 D)');
  N.dialogs.length = 0;
  const prog0 = rd('ORBIT new.html');
  chk('C · the program’s file carries no board (the fixture)', pubOf(prog0) === null, String(pubOf(prog0)).slice(0, 60));
  await install(N, { open: 'ORBIT new.html', save: null });
  await save(N);
  const pst = pubOf(rd('ORBIT new.html')), cs = await stat(N);
  chk('C · written in place, once, asking nothing: the file now carries the board', N.dialogs.length === 0 && !!(pst && pst.appns && pst.appns.om), J({ dialogs: N.dialogs.map(m => m.slice(0, 80)), stat: cs.slice(0, 160) }));
  chk('C · the writer is claimed, as for a new file', /You are now this board’s writer/.test(cs) && !!(pst && pst.writer && pst.writer.fp), cs.slice(0, 200));
  await N.p.close();
} catch (e) { chk('A–C · the section ran', false, String(e.message || e).split('\n')[0]); }

// ── D: a board file's first Save picks itself; the second writes with no window ─────────────────────────────────────────
console.log('\nD · a board file’s first Save picks itself: no question; the second Save writes with no window');
let DP = null;
try {
  writeFileSync(DISK['ORBIT board.html'], rd('ORBIT new.html'));
  DP = await page(ctx, 'ORBIT board.html', 'board', () => false);
  await install(DP, { open: 'ORBIT board.html', save: null });
  const d0 = rd('ORBIT board.html');
  await DP.p.evaluate(() => { setDesc('A', 'D ' + Date.now()); });
  await save(DP);
  const d1 = rd('ORBIT board.html'), p1 = await picks(DP);
  chk('D · the first Save opens the Open window once, asks nothing, and writes the file', p1.open === 1 && p1.save.length === 0 && DP.dialogs.length === 0 && d1 !== d0,
    J({ picks: p1, dialogs: DP.dialogs.map(m => m.slice(0, 80)), stat: (await stat(DP)).slice(0, 160) }));
  await save(DP);
  const p2 = await picks(DP);
  chk('D · the second Save writes it again with no window', p2.open === 1 && rd('ORBIT board.html') !== d1 && DP.dialogs.length === 0, J({ picks: p2, stat: (await stat(DP)).slice(0, 160) }));
  chk('D · nothing threw', DP.errs.length === 0, DP.errs.slice(0, 2).join(' | '));
} catch (e) { chk('D · the section ran', false, String(e.message || e).split('\n')[0]); }

// ── F: a shared entry naming the file just written is released; the v2.12 board then asks ───────────────────────────────
console.log('\nF · the shared entry naming the new file is released after a v2.14 Save of it; the v2.12 board’s next Save opens its window');
try {
  if (!DP) throw new Error('D did not open the board file');
  await idbPutToken(DP, FNAME, 'ORBIT board.html');              // as a v2.13 page's _fhPut leaves it, naming this file
  chk('F · the shared entry names the board file (the fixture)', (await idbKeys(DP)).includes(FNAME), J(await idbKeys(DP)));
  await save(DP); await DP.p.waitForTimeout(500);
  chk('F · after a v2.14 Save of that file, the shared entry is gone', !(await idbKeys(DP)).includes(FNAME), J(await idbKeys(DP)));
  const before = rd('ORBIT board.html');
  await DP.p.close();
  const O2 = await page(ctx, 'ORBIT Live.html', 'v2.12', () => true);
  await install(O2, { save: null, open: null });
  await save(O2);
  const pk = await picks(O2);
  chk('F · the v2.12 board’s next Save opens its own window, and the board file is not written', pk.save.length === 1 && rd('ORBIT board.html') === before, J({ picks: pk }));
  await O2.p.close();
} catch (e) { chk('F · the section ran', false, String(e.message || e).split('\n')[0]); }
await ctx.close();

// ── E (INT): a blank v2.14 tab's change, then the v2.12 old board's Save ────────────────────────────────────────────────
console.log('\nE · (INT) a blank tab’s change, then the old board’s Save in the same browser: asked, and not written when cancelled');
try {
  const ctxE = await b.newContext({ viewport: { width: 1500, height: 950 } });
  // the old board opened (its record names its file) and its handle under the shared entry, as its last Save left it
  writeFileSync(DISK['ORBIT Live.html'], OLDHTML);
  const O = await page(ctxE, 'ORBIT Live.html', 'E-v2.12', () => true);
  await idbPutToken(O, FNAME, 'ORBIT Live.html');
  await O.p.close();
  const E = await page(ctxE, 'ORBIT e.html', 'E-blank', () => true);
  const hasWriter = await E.p.evaluate(() => typeof baseMarkDirty === 'function');
  if (!hasWriter && !FORCE_INT) {
    console.log('  skip E is an integration check: this board has no baseMarkDirty (W4\'s record writer) -- run after integration, or with --int');
  } else {
    await E.p.evaluate(() => { switchYear(MS.cur + 1); }); await E.p.waitForTimeout(800);
    await E.p.close();
    const O3 = await page(ctxE, 'ORBIT Live.html', 'E-v2.12b', m => !/^⚠ HOLD ON/.test(m));
    await install(O3, { save: null, open: null });
    const e0 = rd('ORBIT Live.html');
    await save(O3);
    chk('E · the old board asks (HOLD ON) before writing over its file', O3.dialogs.some(m => /^⚠ HOLD ON/.test(m)), J(O3.dialogs.map(m => m.slice(0, 80))));
    chk('E · cancelled, nothing is written', rd('ORBIT Live.html') === e0, 'written: ' + rd('ORBIT Live.html').length + ' characters');
    await O3.p.close();
  }
  await ctxE.close();
} catch (e) { chk('E · the section ran', false, String(e.message || e).split('\n')[0]); }

await b.close();
rmSync(dir, { recursive: true, force: true });
console.log(bad ? `\n${bad} FAILING CHECK(S)` : '\nall save-target checks passed');
process.exit(bad ? 1 : 0);
