// The second review's Save findings, in Chromium. The page is opened from file:// as Brad opens it, and the browser's
// file windows are stood in for by handles backed by REAL temporary files, so every check reads the bytes on disk.
//
// What it holds Save to:
//   DL-1    a page that opened a saved plan, picking a file of the same name that holds no plan (a copy of the tool in a
//           Downloads folder), is asked before its plan goes there; an older same-named save is not called "put back"
//   DL-3    the file is read again after a question or the browser's write prompt: a colleague's save made meanwhile is
//           asked about, never written over unasked
//   DL-4    where writing is refused (a policy, a site setting, a frame), Save and Save a copy… offer a download instead
//   DL-6    a page that opened data it could not read at all asks before writing over exactly that data (it refused for
//           ever, and sent the person to pick the same file again); other unreadable data is still refused
//   DL-7    a download's message allows for the browser's numbered name ("… (1).html")
//   SEAM-4  a file holding the very plan this page took is written without the false "not the one on screen" / "lost"
//   SEAM-5  Save a copy… onto this page's own file before any Save does not say the file lacks the work, and the next Save
//           does not call that copy "someone else's" save
//
//   node spend-plan/test/save-review2.test.mjs
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CHROME } from '../../tools/chrome.mjs';
import { pageHtml, loadTool, checks, scratchDir } from './harness.mjs';

const C = checks('save-review2');
const tmp = scratchDir('sfcbsp-saverev2-');
const MODS = ['util', 'xlsx-read', 'import', 'engine', 'store'];
const J = o => JSON.stringify(o);
const S0 = '2026-11-09T12:30:00.000Z';
const pad = n => String(n).padStart(2, '0');
const localWhen = iso => { const d = new Date(iso); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
function stateIn(path) {
  const m = /<script id="spState" type="application\/json">([\s\S]*?)<\/script>/.exec(readFileSync(path, 'utf8'));
  return m ? JSON.parse(m[1]) : undefined;
}
const dir = name => { const d = join(tmp.dir, name); mkdirSync(d, { recursive: true }); return d; };

async function makeState() {
  const t = loadTool({ modules: MODS });
  t.SP.storeInit();
  const csv = 'FY,CCaR No,Title,Budget,Plan Event,Date,Amount,Alloc,PMO\r\n'
    + '2026,ZZ-101,Fixture Title A,USAF O&M Fixture Line Discretionary,Event one,2026-01-15,1234.56,Actual Execution,Air Vehicle (AV)\r\n'
    + '2027,ZZ-103,Fixture Title C,Navy OPN Discretionary,Plain event,2026-11-01,5000,Forecast,Training Systems (TSS)\r\n';
  t.SP.applyImport(await t.SP.parseFiles([{ name: 'fixture.csv', data: csv }], { now: '2026-11-09T12:00:00.000Z' }));
  const st = JSON.parse(J(t.SP.state));
  t.close();
  st.savedAt = S0;
  return st;
}
// The file windows, stood in for. Each pick takes the next answer queued: {path}, {abort:true}, or {throw:'NotAllowedError'}
// (a window the browser refuses to open). queryPermission answers fs.query (else fs.perm); requestPermission, the browser's
// own prompt, first runs fs.onPrompt in Node (a colleague saving while the prompt is open), then answers fs.perm.
const STANDIN = `(() => {
  const fs = window.__fs = { picks: [], perm: 'granted', query: null, onPrompt: null };
  const handle = path => ({
    kind: 'file', name: path.replace(/^.*[\\\\/]/, ''), __path: path,
    async getFile() {
      const t = await window.__fsRead(path);
      if (t === null) throw new DOMException('A requested file or directory could not be found.', 'NotFoundError');
      return new File([t], this.name, { type: 'text/html' });
    },
    async createWritable() {
      let parts = [];
      return { async write(d) { parts.push(typeof d === 'string' ? d : await new Blob([d]).text()); },
        async close() { await window.__fsWrite(path, parts.join('')); }, async abort() { parts = []; } };
    },
    async queryPermission() { return fs.query || fs.perm; },
    async requestPermission() { if (fs.onPrompt) { const o = fs.onPrompt; fs.onPrompt = null; await window.__fsWrite(o.path, o.text); } return fs.perm; },
    async isSameEntry(o) { return !!o && o.__path === path; },
  });
  const next = () => {
    const a = fs.picks.shift();
    if (!a || a.abort) throw new DOMException('The user aborted a request.', 'AbortError');
    if (a.throw) throw new DOMException('The request is not allowed by the user agent or the platform in the current context.', a.throw);
    return a.path;
  };
  window.showOpenFilePicker = async () => [handle(next())];
  window.showSaveFilePicker = async () => handle(next());
})();`;

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
try {
  const VALID = await makeState();
  const program = pageHtml({ modules: MODS, state: VALID });
  const blank = pageHtml({ modules: MODS });
  const withState = (st) => pageHtml({ modules: MODS, state: st });
  const ctx = await browser.newContext({ acceptDownloads: true });
  await ctx.exposeFunction('__fsRead', p => (existsSync(p) ? readFileSync(p, 'utf8') : null));
  await ctx.exposeFunction('__fsWrite', (p, text) => { writeFileSync(p, text); return true; });
  await ctx.addInitScript(STANDIN);
  const pages = [];
  async function open(c, path) {
    const p = await c.newPage();
    const w = { p, errors: [], dialogs: [], answer: 'dismiss', answers: [], onDialog: null, downloads: [] };
    p.on('pageerror', e => w.errors.push(e.message));
    p.on('download', d => w.downloads.push(d));
    p.on('dialog', d => {
      w.dialogs.push(d.message());
      if (w.onDialog) { const f = w.onDialog; w.onDialog = null; f(d.message()); }
      const a = w.answers.length ? w.answers.shift() : w.answer;
      (a === 'accept' ? d.accept() : d.dismiss()).catch(() => {});
    });
    await p.goto(pathToFileURL(path).href);
    w.init = await p.evaluate(() => SP.storeInit());
    pages.push(w);
    return w;
  }
  const ev = (w, fn, arg) => w.p.evaluate(fn, arg);
  const pick = (w, ...answers) => ev(w, a => { window.__fs.picks.push(...a); }, answers);
  const save = w => ev(w, () => SP.saveFile());
  const copy = w => ev(w, () => SP.saveCopy());
  const status = w => ev(w, () => SP.saveStatus());
  const edit = (w, patch) => ev(w, p => SP.setSettings(p), patch);
  const fsSet = (w, o) => ev(w, o => Object.assign(window.__fs, o), o);
  const waitDl = async (w, n, ms = 5000) => { const t0 = Date.now(); while (w.downloads.length < n && Date.now() - t0 < ms) await new Promise(r => setTimeout(r, 50)); return w.downloads[n - 1] || null; };

  // ============================================================================ DL-1: a same-named file holding no plan
  {
    const SH = join(dir('share'), 'sfcb-spend-plan.html'), DL = join(dir('downloads'), 'sfcb-spend-plan.html');
    writeFileSync(SH, program); writeFileSync(DL, blank);
    const A = await open(ctx, SH);
    await edit(A, { firstFY: 2024 });
    await pick(A, { path: DL });
    let r = await save(A);
    const q = A.dialogs[0] || '';
    C.chk('DL-1: a page that opened a saved plan is asked before its first Save goes into a same-named file holding no plan',
      A.dialogs.length === 1 && /holds no saved plan/.test(q) && /this is not the file this page was opened from/.test(q) && /another folder/.test(q), A.dialogs.join(' | '));
    C.chk('DL-1: the question names the save the page opened', q.includes(localWhen(S0)), q);
    C.chk('DL-1: Cancel writes nothing, says why, and the work is still unsaved', r.ok === false && /Nothing was written/.test(r.message)
      && readFileSync(DL, 'utf8') === blank && readFileSync(SH, 'utf8') === program && (await status(A)) === 'unsaved', J(r));
    A.answer = 'accept';
    await pick(A, { path: DL });
    r = await save(A);
    C.chk('DL-1: OK writes there, and the message says the file it was opened from does not have this work',
      r.ok === true && stateIn(DL).settings.firstFY === 2024 && /the file it was opened from does not have this work/.test(r.message) && readFileSync(SH, 'utf8') === program, J(r));
    // the older same-named save: not "an older copy put back", which invited OK
    const OLD = join(dir('old'), 'sfcb-spend-plan.html');
    writeFileSync(OLD, withState(Object.assign({}, VALID, { savedAt: '2026-11-08T09:00:00.000Z' })));
    const B = await open(ctx, SH);
    await edit(B, { firstFY: 2026 });
    await pick(B, { path: OLD });
    r = await save(B);
    const qb = B.dialogs[0] || '';
    C.chk('DL-1: an older save of the same name is said to be perhaps in another folder, not this page’s file',
      /before the plan this page opened or last saved/.test(qb) && /it is not the file this page last saved/.test(qb) && /perhaps in another folder/.test(qb), qb);
    // control: a fresh page (no saved plan) saving into a same-named copy that holds none is the first save of a new copy
    const FR = join(dir('fresh'), 'sfcb-spend-plan.html'), FR2 = join(dir('fresh2'), 'sfcb-spend-plan.html');
    writeFileSync(FR, blank); writeFileSync(FR2, blank);
    const F = await open(ctx, FR);
    await edit(F, { firstFY: 2026 });
    await pick(F, { path: FR2 });
    r = await save(F);
    C.chk('DL-1 (control): a page that opened no plan saves into a same-named file holding none, asking nothing', r.ok === true && F.dialogs.length === 0, J(r) + F.dialogs.join(' | '));
  }

  // ============================================================================ DL-3: the file changes while Save waits
  {
    const F = join(dir('race'), 'sfcb-spend-plan.html');
    writeFileSync(F, program);
    const B = await open(ctx, F);
    await edit(B, { firstFY: 2026 });
    // a colleague saved after B opened (S1), and saves again (S2) while B's question about S1 is open
    const S1 = '2026-11-09T13:00:00.000Z', S2 = '2026-11-09T13:30:00.000Z';
    writeFileSync(F, withState(Object.assign({}, VALID, { savedAt: S1, settings: Object.assign({}, VALID.settings, { firstFY: 2030 }) })));
    const theirs2 = withState(Object.assign({}, VALID, { savedAt: S2, settings: Object.assign({}, VALID.settings, { firstFY: 2031 }) }));
    B.onDialog = () => writeFileSync(F, theirs2);
    B.answers = ['accept', 'dismiss'];
    await pick(B, { path: F });
    let r = await save(B);
    C.eq('DL-3: asked about the first save, then again about the one made while that question was open', B.dialogs.length, 2);
    C.chk('DL-3: the second question says the file was saved again, and when', /saved again while you were answering/.test(B.dialogs[1] || '')
      && (B.dialogs[1] || '').includes(localWhen(S2)), B.dialogs[1]);
    C.chk('DL-3: Cancel on it: the colleague’s later save is in the file, byte for byte', r.ok === false && readFileSync(F, 'utf8') === theirs2, J(r));
    // the browser's own write prompt: no question of the page's, a colleague saves while it is open
    const G = join(dir('race2'), 'sfcb-spend-plan.html');
    writeFileSync(G, program);
    const E = await open(ctx, G);
    await edit(E, { firstFY: 2026 });
    const theirs3 = withState(Object.assign({}, VALID, { savedAt: S1, settings: Object.assign({}, VALID.settings, { firstFY: 2032 }) }));
    await fsSet(E, { query: 'prompt', onPrompt: { path: G, text: theirs3 } });
    await pick(E, { path: G });
    r = await save(E);
    C.chk('DL-3: a save made while the browser’s write prompt was open is asked about', E.dialogs.length === 1 && /someone else/.test(E.dialogs[0] || '')
      && (E.dialogs[0] || '').includes(localWhen(S1)), E.dialogs.join(' | '));
    C.chk('DL-3: Cancel: the colleague’s save is in the file, byte for byte', r.ok === false && readFileSync(G, 'utf8') === theirs3, J(r));
    // control: the prompt opens and nothing changes: written, no question
    const H = join(dir('race3'), 'sfcb-spend-plan.html');
    writeFileSync(H, program);
    const K = await open(ctx, H);
    await edit(K, { firstFY: 2026 });
    await fsSet(K, { query: 'prompt' });
    await pick(K, { path: H });
    r = await save(K);
    C.chk('DL-3 (control): nothing changed while the prompt was open: saved, no question', r.ok === true && K.dialogs.length === 0 && stateIn(H).settings.firstFY === 2026, J(r));
  }

  // ============================================================================ DL-4: writing refused, a download instead
  {
    const H = join(dir('refused-write'), 'c.html');
    writeFileSync(H, program);
    const P = await open(ctx, H);
    await edit(P, { firstFY: 2026 });
    await fsSet(P, { perm: 'denied' });
    P.answer = 'accept';
    await pick(P, { path: H });
    let r = await save(P);
    const d1 = await waitDl(P, 1);
    C.chk('DL-4: write refused: Save asks to download instead, and does', P.dialogs.length === 1 && /not allowed/.test(P.dialogs[0]) && /Download the plan instead/.test(P.dialogs[0])
      && !!d1 && d1.suggestedFilename() === 'c.html', P.dialogs.join(' | '));
    C.chk('DL-4: the message says it was downloaded, the file is unchanged, and the work counts as unsaved',
      r.ok === true && /downloaded instead/.test(r.message) && readFileSync(H, 'utf8') === program && (await status(P)) === 'downloaded', J(r));
    if (d1) { const got = join(tmp.dir, 'dl4.html'); await d1.saveAs(got); C.eq('DL-4: the download holds the work', stateIn(got).settings.firstFY, 2026); }
    // Save a copy…: the Save window refused
    await pick(P, { throw: 'NotAllowedError' });
    r = await copy(P);
    const d2 = await waitDl(P, 2);
    C.chk('DL-4: Save a copy… refused: a copy is downloaded instead', r.ok === true && /downloaded instead/.test(r.message) && !!d2 && /copy/.test(d2.suggestedFilename()), J(r));
    // Save: the Open window refused
    await pick(P, { throw: 'SecurityError' });
    r = await save(P);
    const d3 = await waitDl(P, 3);
    C.chk('DL-4: Save, its window refused: the plan is downloaded instead', r.ok === true && !!d3 && d3.suggestedFilename() === 'c.html', J(r));
    // declined: nothing at all, and it says so
    P.answer = 'dismiss';
    await pick(P, { path: H });
    r = await save(P);
    await new Promise(res => setTimeout(res, 300));
    C.chk('DL-4 (control): declined, nothing is downloaded, and it says writing was not allowed', r.ok === false && /not allowed/.test(r.message) && P.downloads.length === 3, J(r));
  }

  // ============================================================================ DL-6: the data this page could not read
  {
    const cut = program.replace(/<script id="spState" type="application\/json">[\s\S]*?<\/script>/, () => '<script id="spState" type="application/json">{"v":1,"tool":"sfcb-<' + '/script>');
    const R = join(dir('unreadable'), 'sfcb-spend-plan.html');
    writeFileSync(R, cut);
    const U = await open(ctx, R);
    C.chk('DL-6: (the page opens empty and says Save asks first)', U.init.ok === false && /Save asks before writing over it/.test(U.init.message), J(U.init));
    await edit(U, { firstFY: 2026 });
    await pick(U, { path: R });
    let r = await save(U);
    C.chk('DL-6: Save asks before writing over the data it could not read, saying it is lost', U.dialogs.length === 1 && /was not opened/.test(U.dialogs[0])
      && /cannot be read/.test(U.dialogs[0]) && /lost/.test(U.dialogs[0]), U.dialogs.join(' | '));
    C.chk('DL-6: Cancel leaves it as it was', r.ok === false && readFileSync(R, 'utf8') === cut, J(r));
    U.answer = 'accept';
    await pick(U, { path: R });
    r = await save(U);
    C.chk('DL-6: OK writes this page’s plan over it, and the page is saved', r.ok === true && stateIn(R).settings.firstFY === 2026 && (await status(U)) === 'saved', J(r));
    // control: another file holding OTHER data that cannot be read is still refused, without a question
    const R2 = join(dir('unreadable2'), 'other.html');
    const cut2 = program.replace(/<script id="spState" type="application\/json">[\s\S]*?<\/script>/, () => '<script id="spState" type="application/json">{"v":1,"tool":"zz<' + '/script>');
    writeFileSync(R2, cut2);
    const U2 = await open(ctx, R);   // R is now a sound plan; open the cut copy afresh below
    await U2.p.close();
    writeFileSync(R, cut);
    const U3 = await open(ctx, R);
    await edit(U3, { firstFY: 2026 });
    await pick(U3, { path: R2 });
    r = await save(U3);
    C.chk('DL-6 (control): other unreadable data is refused, no question, nothing written', r.ok === false && /cannot be read/.test(r.message) && U3.dialogs.length === 0
      && readFileSync(R2, 'utf8') === cut2, J(r) + U3.dialogs.join(' | '));
  }

  // ============================================================================ SEAM-4: the plan this page took
  {
    const SH = join(dir('take-share'), 'sfcb-spend-plan.html'), NW = join(dir('take-new'), 'sfcb-spend-plan.html');
    const shared = withState(Object.assign({}, VALID, { savedAt: '2026-11-01T15:00:00.000Z' }));
    writeFileSync(SH, shared); writeFileSync(NW, blank);
    const N = await open(ctx, NW);
    let r = await ev(N, t => SP.takePlan(t, 'sfcb-spend-plan.html'), shared);
    C.chk('SEAM-4: (a new copy takes the plan in the shared file)', r.ok === true, J(r));
    await pick(N, { path: SH });
    r = await save(N);
    C.chk('SEAM-4: saving it back into the file it took the plan from asks nothing (nothing there is lost)', r.ok === true && N.dialogs.length === 0, J(r) + N.dialogs.join(' | '));
    C.eq('SEAM-4: the file holds the plan', stateIn(SH).pulls, VALID.pulls);
    // a page takes the plan a colleague saved into its own file since it opened
    const OW = join(dir('take-own'), 'sfcb-spend-plan.html');
    writeFileSync(OW, program);
    const O = await open(ctx, OW);
    const theirs = withState(Object.assign({}, VALID, { savedAt: '2026-11-09T16:00:00.000Z', settings: Object.assign({}, VALID.settings, { firstFY: 2030 }) }));
    writeFileSync(OW, theirs);
    O.answer = 'accept';
    r = await ev(O, t => SP.takePlan(t, 'sfcb-spend-plan.html'), theirs);
    const n0 = O.dialogs.length;
    await pick(O, { path: OW });
    r = await save(O);
    C.chk('SEAM-4: after taking a colleague’s save from this page’s own file, Save does not call it someone else’s, lost', r.ok === true && O.dialogs.length === n0, J(r) + O.dialogs.slice(n0).join(' | '));
    // control: a file holding another plan altogether is still asked about, naming the plan taken
    const N2 = await open(ctx, NW);
    await ev(N2, t => SP.takePlan(t, 'shared.html'), shared);
    const OT = join(dir('take-other'), 'sfcb-spend-plan.html');
    writeFileSync(OT, withState(Object.assign({}, VALID, { savedAt: '2026-11-05T10:00:00.000Z' })));
    await pick(N2, { path: OT });
    r = await save(N2);
    C.chk('SEAM-4 (control): another plan is still asked about, and the question names the plan this page took',
      r.ok === false && N2.dialogs.length === 1 && /This page took the plan in “shared\.html”/.test(N2.dialogs[0]) && /lost/.test(N2.dialogs[0]), N2.dialogs.join(' | '));
  }

  // ============================================================================ SEAM-5: Save a copy… onto this page's own file
  {
    const FR = join(dir('copy-own'), 'sfcb-spend-plan.html');
    writeFileSync(FR, blank);
    const A = await open(ctx, FR);
    await edit(A, { firstFY: 2026 });
    await pick(A, { path: FR });
    let r = await copy(A);
    C.chk('SEAM-5: a copy given this page’s own file’s name does not say that file lacks the work', r.ok === true && !/does not have this work/.test(r.message)
      && /the name of this page’s own file/.test(r.message), J(r));
    C.chk('SEAM-5: (the file does hold the work, and the page, unable to tell, still counts it unsaved)', stateIn(FR).settings.firstFY === 2026 && (await status(A)) === 'unsaved');
    await pick(A, { path: FR });
    r = await save(A);
    C.chk('SEAM-5: the next Save does not call that copy someone else’s save', r.ok === true && A.dialogs.length === 0 && (await status(A)) === 'saved', J(r) + A.dialogs.join(' | '));
    // a page that opened a saved plan: the same
    const OW = join(dir('copy-own2'), 'sfcb-spend-plan.html');
    writeFileSync(OW, program);
    const B = await open(ctx, OW);
    await edit(B, { firstFY: 2026 });
    await pick(B, { path: OW });
    await copy(B);
    await pick(B, { path: OW });
    r = await save(B);
    C.chk('SEAM-5: after a page with a saved plan copies onto its own file, Save asks nothing', r.ok === true && B.dialogs.length === 0, J(r) + B.dialogs.join(' | '));
    // control: a copy made elsewhere still leaves the own file older: Save writes without asking (the file holds this page's base)
    const OW3 = join(dir('copy-own3'), 'sfcb-spend-plan.html'), K3 = join(dir('copy-own3'), 'kept.html');
    writeFileSync(OW3, program);
    const D = await open(ctx, OW3);
    await edit(D, { firstFY: 2026 });
    await pick(D, { path: K3 });
    r = await copy(D);
    C.chk('SEAM-5 (control): a copy under another name says this page’s own file lacks the work', /does not have this work yet/.test(r.message), J(r));
  }
  C.eq('no script error in any page', pages.map(w => w.errors).flat(), []);
  await ctx.close();

  // ============================================================================ DL-7: where Save downloads
  {
    const ctx2 = await browser.newContext({ acceptDownloads: true });
    await ctx2.addInitScript(() => { window.showOpenFilePicker = undefined; window.showSaveFilePicker = undefined; });
    const H = join(dir('nofs'), 'sfcb-spend-plan.html');
    writeFileSync(H, program);
    const P = await open(ctx2, H);
    await edit(P, { firstFY: 2026 });
    const [, r1] = await Promise.all([P.p.waitForEvent('download', { timeout: 10000 }), save(P)]);
    C.chk('DL-7: the download message allows for the browser’s numbered name', /with a number added, such as “sfcb-spend-plan \(1\)\.html”/.test(r1.message), J(r1));
    const [, r2] = await Promise.all([P.p.waitForEvent('download', { timeout: 10000 }), copy(P)]);
    C.chk('DL-7: so does Save a copy’s', /with a number added/.test(r2.message), J(r2));
    await ctx2.close();
  }
} catch (e) {
  C.chk('the test ran to the end', false, (e && e.stack) || String(e));
} finally {
  await browser.close();
  tmp.rm();
  C.done();
}
