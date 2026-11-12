// Saving (CONTRACT §11), in Chromium. The page is opened from file:// as Brad opens it, and the browser's file windows
// are stood in for by handles backed by REAL temporary files (page.exposeFunction reads and writes them), so every check
// reads the bytes on disk, never the tool's own idea of what it wrote.
//
// What it holds Save to:
//   - the first Save asks the person to pick this file, and the window names it; a second Save asks nothing;
//   - a file that is not this tool, holds another tool's data, holds data that cannot be read, or cannot be read at all,
//     is refused and left byte for byte as it was, and the next Save asks again;
//   - a file saved by someone else since this page last read or wrote it is written over only after a question that
//     says when; Cancel writes nothing;
//   - Save a copy writes a new file that opens with the same state, and leaves this page's own file alone;
//   - with neither file window available, Save downloads the page under its own name, and the download opens with the
//     same state; Save a copy downloads a copy.
//
//   node scope/test/save.test.mjs
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CHROME } from '../../tools/chrome.mjs';
import { pageHtml, loadTool, checks, scratchDir } from './harness.mjs';

const C = checks('save');
const tmp = scratchDir('sfcbsp-save-');
const MODS = ['util', 'xlsx-read', 'import', 'engine', 'store'];
const J = o => JSON.stringify(o);
const OPENED_AT = '2026-11-09T12:30:00.000Z';
const pad = n => String(n).padStart(2, '0');
// 'YYYY-MM-DD HH:MM' in this machine's time zone, the browser's too: the time the question must name
const localWhen = iso => { const d = new Date(iso); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
// the saved state in a page's text, read the way any reader of the file would, never through the tool
function stateIn(path) {
  const m = /<script id="spState" type="application\/json">([\s\S]*?)<\/script>/.exec(readFileSync(path, 'utf8'));
  return m ? JSON.parse(m[1]) : undefined;
}
const without = (st, ...keys) => { const o = JSON.parse(J(st)); for (const k of keys) delete o[k]; return o; };

// a small but real state, made by the store itself from an import of synthetic rows (no fixture file needed)
async function makeState() {
  const t = loadTool({ modules: MODS });
  t.SP.storeInit();
  const csv = 'FY,CCaR No,Title,Budget,Plan Event,Date,Amount,Alloc,PMO\r\n'
    + '2026,ZZ-101,Fixture Title A,USAF O&M Fixture Line Discretionary,Close-out </script> review,2026-01-15,1234.56,Actual Execution,Air Vehicle (AV)\r\n'
    + '2026,ZZ-102,Fixture Title B,USAF O&M Fixture Line Discretionary,"Kept <!-- not a comment --> event",2026-05-15,(99.50),Not Allocated,Propulsion (PP)\r\n'
    + '2027,ZZ-103,Fixture Title C,Navy OPN Discretionary,Plain event,2026-11-01,5000,Forecast,Training Systems (TSS)\r\n';
  t.SP.applyImport(await t.SP.parseFiles([{ name: 'fixture.csv', data: csv }], { now: '2026-11-09T12:00:00.000Z' }));
  const st = JSON.parse(J(t.SP.state));
  t.close();
  st.savedAt = OPENED_AT;
  return st;
}
// The browser's file windows, stood in for: each pick takes the next answer the test queued ({path} or {abort:true});
// a handle reads and writes the real file through the functions the test exposes. Every call is recorded.
const STANDIN = `(() => {
  const fs = window.__fs = { picks: [], openCalls: [], saveCalls: [], perm: 'granted' };
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
    async queryPermission() { return fs.perm; },
    async requestPermission() { return fs.perm; },
    async isSameEntry(o) { return !!o && o.__path === path; },
  });
  const next = (calls, opts) => {
    calls.push(JSON.parse(JSON.stringify(opts || {})));
    const a = fs.picks.shift();
    if (!a || a.abort) throw new DOMException('The user aborted a request.', 'AbortError');
    return a.path;
  };
  window.showOpenFilePicker = async opts => [handle(next(fs.openCalls, opts))];
  window.showSaveFilePicker = async opts => handle(next(fs.saveCalls, opts));
})();`;

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
try {
  const VALID = await makeState();
  const program = pageHtml({ modules: MODS, state: VALID });
  const F = join(tmp.dir, 'sfcb-spend-plan.html');
  writeFileSync(F, program);

  const ctx = await browser.newContext({ acceptDownloads: true });
  await ctx.exposeFunction('__fsRead', p => (existsSync(p) ? readFileSync(p, 'utf8') : null));
  await ctx.exposeFunction('__fsWrite', (p, text) => { writeFileSync(p, text); return true; });
  await ctx.addInitScript(STANDIN);
  // a page opened from a file, with every dialog recorded and answered as the test says
  async function open(c, path) {
    const p = await c.newPage();
    const w = { p, errors: [], dialogs: [], answer: 'dismiss' };
    p.on('pageerror', e => w.errors.push(e.message));
    p.on('dialog', d => { w.dialogs.push(d.type() + ': ' + d.message()); (w.answer === 'accept' ? d.accept() : d.dismiss()).catch(() => {}); });
    await p.goto(pathToFileURL(path).href);
    w.init = await p.evaluate(() => SP.storeInit());
    return w;
  }
  const ev = (w, fn, arg) => w.p.evaluate(fn, arg);
  const pick = (w, ...answers) => ev(w, a => { window.__fs.picks.push(...a); }, answers);
  const save = w => ev(w, () => SP.saveFile());
  const calls = w => ev(w, () => ({ open: window.__fs.openCalls.length, save: window.__fs.saveCalls.length, last: window.__fs.openCalls.slice(-1)[0] || null }));
  const stateOf = w => ev(w, () => JSON.parse(JSON.stringify(SP.state)));
  const dirty = w => ev(w, () => SP.isDirty());
  const edit = (w, patch) => ev(w, p => SP.setSettings(p), patch);
  // a file opened in a fresh page reads back as exactly this state
  async function reopensAs(name, path, want, minus = []) {
    const w = await open(ctx, path);
    C.chk(name + ': the file opens', w.init.ok === true, J(w.init));
    const got = await stateOf(w);
    C.eq(name + ': the file opens with the same state', J(without(got, ...minus)), J(without(want, ...minus)));
    await w.p.close();
  }

  // ============================================================================ the first Save, and the next
  const A = await open(ctx, F);
  C.chk('the page opens with its saved state', A.init.ok === true && A.errors.length === 0, J(A.init) + ' ' + A.errors.join(' | '));
  await pick(A, { path: F });
  let r = await save(A);
  let k = await calls(A);
  C.chk('first Save: it succeeds', r.ok === true, J(r));
  C.eq('first Save: it asks the person to pick a file, once, in an Open window', [k.open, k.save], [1, 0]);
  C.chk('first Save: the window names this page’s file', k.last && J(k.last.types).includes('sfcb-spend-plan.html'), J(k.last));
  C.eq('first Save: no question was asked (the file is the one this page opened)', A.dialogs, []);
  let sA = await stateOf(A);
  C.chk('first Save: the page’s state carries the new save time', typeof sA.savedAt === 'string' && sA.savedAt !== OPENED_AT);
  C.eq('first Save: the file on disk holds the page’s state', J(stateIn(F)), J(sA));
  C.chk('first Save: nothing is unsaved', (await dirty(A)) === false);
  await reopensAs('first Save', F, sA);

  await edit(A, { firstFY: 2024 });
  C.chk('an edit is unsaved work', (await dirty(A)) === true);
  r = await save(A);
  k = await calls(A);
  C.chk('second Save: it succeeds', r.ok === true, J(r));
  C.eq('second Save: it asks nothing (the file is remembered for the session)', [k.open, A.dialogs.length], [1, 0]);
  C.eq('second Save: the edit is in the file', stateIn(F).settings.firstFY, 2024);
  sA = await stateOf(A);

  // ================================================================== saved by someone else since (§11)
  const B = await open(ctx, F);
  await edit(B, { firstFY: 2026 });
  await pick(B, { path: F });
  r = await save(B);
  C.chk('someone else (another page) saves the same file', r.ok === true, J(r));
  const theirs = readFileSync(F, 'utf8');
  const theirAt = stateIn(F).savedAt;
  await edit(A, { asOf: '2026-09' });
  A.answer = 'dismiss';
  r = await save(A);
  C.eq('saved by someone else since: Save asks first', A.dialogs.length, 1);
  C.chk('the question says when the file was saved', (A.dialogs[0] || '').includes(localWhen(theirAt)), (A.dialogs[0] || '') + ' / want ' + localWhen(theirAt));
  C.chk('the question says it was someone else and that their save would be lost', /someone else/.test(A.dialogs[0] || '') && /lost/.test(A.dialogs[0] || ''));
  C.chk('Cancel: the result says nothing was written', r.ok === false && /Nothing was written/.test(r.message), J(r));
  C.chk('Cancel: the file is byte for byte as the other page saved it', readFileSync(F, 'utf8') === theirs);
  C.chk('Cancel: the work is still unsaved', (await dirty(A)) === true);
  A.answer = 'accept';
  r = await save(A);
  C.eq('asked again on the next Save', A.dialogs.length, 2);
  C.chk('OK: it is written over', r.ok === true && stateIn(F).settings.asOf === '2026-09' && stateIn(F).settings.firstFY === 2024, J(r));
  r = await save(A);
  C.chk('after writing over it, the next Save asks nothing', r.ok === true && A.dialogs.length === 2, J(r) + ' ' + A.dialogs.length);
  sA = await stateOf(A);
  await B.p.close();

  // ================================================================== Save a copy (§11)
  const before = readFileSync(F, 'utf8');
  await edit(A, { firstFY: 2025 });
  const K = join(tmp.dir, 'a copy of the plan.html');
  await pick(A, { path: K });
  r = await ev(A, () => SP.saveCopy());
  k = await calls(A);
  C.chk('Save a copy: it succeeds and names the new file', r.ok === true && r.message.includes('a copy of the plan.html'), J(r));
  C.eq('Save a copy: it uses a Save window, not the Open window', [k.save, k.open], [1, 1]);
  C.chk('Save a copy: the window suggests an .html name', /\.html$/.test((await ev(A, () => window.__fs.saveCalls[0].suggestedName)) || ''));
  C.chk('Save a copy: the new file exists', existsSync(K));
  sA = await stateOf(A);
  await reopensAs('Save a copy', K, sA, ['savedAt']);
  C.chk('Save a copy: the copy carries its own save time', typeof stateIn(K).savedAt === 'string' && stateIn(K).savedAt !== sA.savedAt);
  C.chk('Save a copy: this page’s own file is untouched', readFileSync(F, 'utf8') === before);
  C.chk('Save a copy: the work is still unsaved in this page’s own file', (await dirty(A)) === true);
  await pick(A, { abort: true });
  r = await ev(A, () => SP.saveCopy());
  C.chk('Save a copy, cancelled: nothing is written and it says so', r.ok === false && /No copy was saved/.test(r.message), J(r));

  // ================================================================== files that must never be written over
  const G = join(tmp.dir, 'second-plan.html');
  writeFileSync(G, program);
  const D = await open(ctx, G);
  const N1 = join(tmp.dir, 'notes.html'), N2 = join(tmp.dir, 'other-tool.html'), N3 = join(tmp.dir, 'unreadable-state.html');
  writeFileSync(N1, '<!DOCTYPE html><html><head><title>Notes</title></head><body><p>Not a plan.</p></body></html>');
  writeFileSync(N2, program.replace(/<script id="spState" type="application\/json">[\s\S]*?<\/script>/,
    () => '<script id="spState" type="application/json">' + J({ v: 1, tool: 'some-other-tool', savedAt: OPENED_AT }) + '<' + '/script>'));
  writeFileSync(N3, program.replace(/<script id="spState" type="application\/json">[\s\S]*?<\/script>/,
    () => '<script id="spState" type="application/json">{"v":1,"tool":"sfcb-<' + '/script>'));
  const N4 = join(tmp.dir, 'gone.html');
  const refusals = [['a page that is not this tool', N1, /is not a SCOPE file/],
    ['this tool holding another tool’s data', N2, /another tool/],
    ['this tool holding data that cannot be read', N3, /cannot be read/],
    ['a file that cannot be read at all', N4, /could not be read/]];
  let opens = 0;
  for (const [what, path, re] of refusals) {
    const was = existsSync(path) ? readFileSync(path, 'utf8') : null;
    await pick(D, { path });
    r = await save(D);
    opens++;
    C.chk('refused (' + what + '): not saved, and why', r.ok === false && re.test(r.message) && /not written over/.test(r.message), J(r));
    C.chk('refused (' + what + '): the file is byte for byte as it was', (existsSync(path) ? readFileSync(path, 'utf8') : null) === was);
    C.eq('refused (' + what + '): the next Save asks which file again', (await calls(D)).open, opens);
  }
  await pick(D, { abort: true });
  r = await save(D);
  C.chk('a picker cancelled: not saved, and says no file was picked', r.ok === false && /no file was picked/.test(r.message), J(r));
  C.eq('nothing refused asked a question', D.dialogs, []);
  C.chk('the page’s own file is untouched by every refusal', readFileSync(G, 'utf8') === program);
  await ev(D, () => { window.__fs.perm = 'denied'; });
  await pick(D, { path: G });
  r = await save(D);
  C.chk('write permission refused: not saved, and says so', r.ok === false && /not allowed/.test(r.message) && readFileSync(G, 'utf8') === program, J(r));
  await ev(D, () => { window.__fs.perm = 'granted'; });
  await pick(D, { path: G });
  r = await save(D);
  C.chk('then its own file: saved', r.ok === true && stateIn(G).savedAt === (await stateOf(D)).savedAt, J(r));
  C.eq('no script error in any page', [A.errors, D.errors], [[], []]);
  await D.p.close();

  // ======================================================== a page whose saved data was refused on opening
  const R = join(tmp.dir, 'refused.html');
  writeFileSync(R, program.replace('"v":1,', '"v":2,'));
  const E = await open(ctx, R);
  C.chk('a state of a newer version: the page opens empty and says why', E.init.ok === false && /newer version/.test(E.init.message), J(E.init));
  E.answer = 'dismiss';
  await pick(E, { path: R });
  r = await save(E);
  C.chk('Save over the refused data asks first, naming why it was refused', E.dialogs.length === 1 && /newer version/.test(E.dialogs[0]) && /lost/.test(E.dialogs[0]), E.dialogs.join(' | '));
  C.chk('Cancel: the refused data is left as it was', r.ok === false && readFileSync(R, 'utf8') === program.replace('"v":1,', '"v":2,'), J(r));
  await E.p.close();
  // refused data with no save time at all: still never written over unasked
  const R2 = join(tmp.dir, 'refused-untimed.html');
  const untimed = pageHtml({ modules: MODS, state: Object.assign({}, VALID, { v: 2, savedAt: null }) });
  writeFileSync(R2, untimed);
  const E2 = await open(ctx, R2);
  E2.answer = 'dismiss';
  await pick(E2, { path: R2 });
  r = await save(E2);
  C.chk('refused data with no save time: Save still asks first', E2.dialogs.length === 1 && /newer version/.test(E2.dialogs[0]), E2.dialogs.join(' | '));
  C.chk('refused data with no save time: Cancel leaves it as it was', r.ok === false && readFileSync(R2, 'utf8') === untimed, J(r));
  await E2.p.close();

  // =================================================== review S1: the question says which file, and which save came first
  // Every other save time used to read "saved …, after this page was opened — by someone else, or in another window", and
  // the page's own file name was never compared with the one picked: OK wrote this page over another team's plan.
  const hourAgo = new Date(Date.now() - 3600e3).toISOString(), halfAgo = new Date(Date.now() - 1800e3).toISOString();
  const OT = join(tmp.dir, 'other-team-plan.html');
  const otherHtml = pageHtml({ modules: MODS, state: Object.assign({}, VALID, { savedAt: hourAgo }) });
  writeFileSync(OT, otherHtml);
  // (a) a page opened with no saved plan; its first Save picks the other team's plan, saved before the page opened
  const FR = join(tmp.dir, 'fresh-page.html');
  writeFileSync(FR, pageHtml({ modules: MODS }));
  const Fa = await open(ctx, FR);
  await edit(Fa, { firstFY: 2026 });
  Fa.answer = 'dismiss';
  await pick(Fa, { path: OT });
  r = await save(Fa);
  const qa = Fa.dialogs[0] || '';
  C.chk('S1 (a): the question names the file picked and this page’s own file', qa.includes('“other-team-plan.html”') && qa.includes('not “fresh-page.html”'), qa);
  C.chk('S1 (a): it says the plan was saved BEFORE this page was opened, when', /before this page was opened/.test(qa) && qa.includes(localWhen(hourAgo)) && !/after this page/.test(qa), qa);
  C.chk('S1 (a): it does not call another plan "someone else, or another window"', !/someone else|another window/.test(qa), qa);
  C.chk('S1 (a): Cancel writes nothing, and the result names both files', r.ok === false && readFileSync(OT, 'utf8') === otherHtml
    && /other-team-plan\.html/.test(r.message) && /fresh-page\.html/.test(r.message) && /Nothing was written/.test(r.message), J(r));
  await Fa.p.close();
  // (b) a page opened from its own plan; its first Save picks the other team's plan, saved before this page's
  const OW = join(tmp.dir, 'own-plan.html');
  writeFileSync(OW, pageHtml({ modules: MODS, state: Object.assign({}, VALID, { savedAt: halfAgo }) }));
  const Fb = await open(ctx, OW);
  await edit(Fb, { firstFY: 2026 });
  Fb.answer = 'dismiss';
  await pick(Fb, { path: OT });
  r = await save(Fb);
  const qb = Fb.dialogs[0] || '';
  C.chk('S1 (b): the question names this page’s own file', qb.includes('not “own-plan.html”, the file this page was opened from'), qb);
  C.chk('S1 (b): it says the picked plan was saved before this page’s, with both times', /before the plan this page opened or last saved/.test(qb)
    && qb.includes(localWhen(hourAgo)) && qb.includes(localWhen(halfAgo)) && !/after this page/.test(qb), qb);
  C.chk('S1 (b): Cancel leaves both files as they were', r.ok === false && readFileSync(OT, 'utf8') === otherHtml, J(r));
  Fb.answer = 'accept';
  await pick(Fb, { path: OT });
  r = await save(Fb);
  C.chk('S1 (b): OK writes there, and the result says this page’s own file does not have the work', r.ok === true && stateIn(OT).settings.firstFY === 2026
    && /own-plan\.html/.test(r.message) && /does not have this work/.test(r.message), J(r));
  await Fb.p.close();
  writeFileSync(OT, otherHtml);
  // (c) this page's own file, put back as an older copy: "before", an older copy, never "someone else"
  const OW2 = join(tmp.dir, 'own-plan-2.html');
  writeFileSync(OW2, pageHtml({ modules: MODS, state: Object.assign({}, VALID, { savedAt: halfAgo }) }));
  const Fc = await open(ctx, OW2);
  writeFileSync(OW2, pageHtml({ modules: MODS, state: Object.assign({}, VALID, { savedAt: hourAgo }) }));
  await edit(Fc, { firstFY: 2026 });
  Fc.answer = 'dismiss';
  await pick(Fc, { path: OW2 });
  r = await save(Fc);
  const qc = Fc.dialogs[0] || '';
  C.chk('S1 (c): an older copy of this page’s own file: "before", and no word of another file or someone else',
    /before the plan this page opened or last saved/.test(qc) && /older copy/.test(qc) && !/someone else|You picked/.test(qc), qc);
  await Fc.p.close();
  // (d) two saves in one minute: the times carry their seconds, so which came first can be read
  const OW3 = join(tmp.dir, 'own-plan-3.html');
  const tMine = '2026-11-09T11:00:10.000Z', tTheirs = '2026-11-09T11:00:45.000Z';
  writeFileSync(OW3, pageHtml({ modules: MODS, state: Object.assign({}, VALID, { savedAt: tMine }) }));
  const Fd = await open(ctx, OW3);
  writeFileSync(OW3, pageHtml({ modules: MODS, state: Object.assign({}, VALID, { savedAt: tTheirs }) }));
  Fd.answer = 'dismiss';
  await pick(Fd, { path: OW3 });
  r = await save(Fd);
  const qd = Fd.dialogs[0] || '';
  C.chk('S1 (d): two saves in one minute are told apart by their seconds', qd.includes(localWhen(tTheirs) + ':45') && qd.includes(localWhen(tMine) + ':10')
    && /after this page last opened or saved/.test(qd) && /someone else/.test(qd), qd);
  await Fd.p.close();
  // (e) another file holding no plan at all: asked before this page's plan goes there, and Cancel writes nothing
  const BL = join(tmp.dir, 'blank-copy.html');
  const blankHtml = pageHtml({ modules: MODS });
  writeFileSync(BL, blankHtml);
  const Fe = await open(ctx, OW);
  Fe.answer = 'dismiss';
  await pick(Fe, { path: BL });
  r = await save(Fe);
  C.chk('S1 (e): another file with no plan in it: asked first, naming both, and Cancel writes nothing',
    Fe.dialogs.length === 1 && /not “own-plan\.html”/.test(Fe.dialogs[0]) && /holds no saved plan/.test(Fe.dialogs[0]) && r.ok === false
    && readFileSync(BL, 'utf8') === blankHtml, Fe.dialogs.join(' | ') + ' ' + J(r));
  C.eq('S1: no script error', [Fa.errors, Fb.errors, Fc.errors, Fd.errors, Fe.errors], [[], [], [], [], []]);
  await Fe.p.close();
  await ctx.close();

  // ===================================================== no file windows at all: Save downloads (§11)
  const ctx2 = await browser.newContext({ acceptDownloads: true });
  await ctx2.addInitScript(() => { window.showOpenFilePicker = undefined; window.showSaveFilePicker = undefined; });
  const H = join(tmp.dir, 'sfcb-spend-plan.html');
  writeFileSync(H, program);
  const P = await open(ctx2, H);
  await edit(P, { firstFY: 2026 });
  const [dl, res] = await Promise.all([P.p.waitForEvent('download', { timeout: 10000 }), save(P)]);
  C.chk('no file windows: Save says it downloaded, and that the shared copy is not updated', res.ok === true && /downloaded/.test(res.message)
    && /shared copy is not updated/.test(res.message), J(res));
  C.eq('no file windows: the download carries the page’s own name', dl.suggestedFilename(), 'sfcb-spend-plan.html');
  const got = join(tmp.dir, 'downloaded.html');
  await dl.saveAs(got);
  const sP = await stateOf(P);
  C.eq('no file windows: the download holds the page’s state', J(stateIn(got)), J(sP));
  const ctx3 = await browser.newContext();
  const Q = await open(ctx3, got);
  C.eq('no file windows: the download opens with the same state', J(await stateOf(Q)), J(sP));
  await ctx3.close();
  const [dl2, res2] = await Promise.all([P.p.waitForEvent('download', { timeout: 10000 }), ev(P, () => SP.saveCopy())]);
  C.chk('no file windows: Save a copy downloads a copy', res2.ok === true && /copy/.test(dl2.suggestedFilename()) && /\.html$/.test(dl2.suggestedFilename()),
    J(res2) + ' ' + dl2.suggestedFilename());
  C.eq('no file windows: no question, no error', [P.dialogs, P.errors], [[], []]);
  // review S8: the download is not this page's own file. Marked clean, the page read "Saved" and closed without a
  // question while the file it was opened from still lacked the work.
  await edit(P, { firstFY: 2024 });
  const [dl3, res3] = await Promise.all([P.p.waitForEvent('download', { timeout: 10000 }), save(P)]);
  C.eq('S8: after Save downloads, the work still counts as unsaved, and says it was downloaded',
    [res3.ok, !!dl3, await dirty(P), await ev(P, () => SP.saveStatus())], [true, true, true, 'downloaded']);
  C.chk('S8: the message says the page still asks before it is closed', /asks before it is closed/.test(res3.message), J(res3));
  P.answer = 'dismiss';
  await P.p.close({ runBeforeUnload: true });
  await new Promise(res => setTimeout(res, 500));
  C.chk('S8: leaving asks', P.dialogs.some(d => d.startsWith('beforeunload')), J(P.dialogs));
  const P2 = await open(ctx2, H);
  await edit(P2, { firstFY: 2024 });
  await Promise.all([P2.p.waitForEvent('download', { timeout: 10000 }), save(P2)]);
  await edit(P2, { firstFY: 2026 });
  C.eq('S8: an edit after the download is plain unsaved work', await ev(P2, () => SP.saveStatus()), 'unsaved');
  await ctx2.close();
} catch (e) {
  C.chk('the test ran to the end', false, (e && e.stack) || String(e));
} finally {
  await browser.close();
  tmp.rm();
  C.done();
}
