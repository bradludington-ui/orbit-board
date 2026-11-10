// End to end, in Chromium, the way Brad uses the tool: the built page opened from file://, the synthetic fixture imported
// through the page's own file input, every view drawn, the workbook exported, every picture made, the page Saved over its
// own file (the browser's file windows stood in for by handles on REAL temporary files), and the saved file opened again.
//
// It holds the joins between modules, which no module's own test can see:
//   - the import the screens start lands in the store, and the figures on the Summary are the oracle's;
//   - every view draws with no script error and no "could not be drawn";
//   - the workbook the button downloads, read back with openpyxl, carries the oracle's Summary totals;
//   - the screen, the workbook and the picture agree on the integration rulings: a Cumulative Totals Total is Approved,
//     and a plan status cell keeps its colour and word, in italic;
//   - Save a picture downloads a PNG, Save all pictures a zip with one PNG per block;
//   - Save writes the page's own file, and that file opens again showing the same Summary, figure for figure, and the
//     same Data through and First FY.
//
//   node spend-plan/test/e2e.test.mjs                      the page assembled from the sources (as build.mjs writes it)
//   E2E_FILE=spend-plan/sfcb-spend-plan.html node …        the built file itself
import { chromium } from 'playwright-core';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CHROME } from '../../tools/chrome.mjs';
import { pageHtml, scratchDir, checks } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const C = checks('e2e');
const tmp = scratchDir('sfcbsp-e2e-');
const J = o => JSON.stringify(o);

function py(args) {
  const r = spawnSync('python3', ['-I', ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error('python3 ' + args[0] + ' failed: ' + r.stderr.slice(-800));
  return r.stdout;
}
const FX = join(tmp.dir, 'fx');
mkdirSync(FX);
py([join(HERE, 'fixture', 'make_fixture.py'), '--out', FX]);
const ORA = join(tmp.dir, 'all.json');
py([join(HERE, 'fixture', 'oracle.py'), '--scenario', 'all', '--fixture', FX, '--out', ORA]);
const O = JSON.parse(readFileSync(ORA, 'utf8'));

// the page, as Brad copies it to the share: a file of its own, opened from file://
const PAGE = join(tmp.dir, 'sfcb-spend-plan.html');
writeFileSync(PAGE, process.env.E2E_FILE ? readFileSync(resolve(process.env.E2E_FILE), 'utf8') : pageHtml());

// The browser's file windows, stood in for: each pick takes the next path the test queued; a handle reads and writes
// the real file through functions the test exposes. (The same stand-in save.test.mjs uses.)
const STANDIN = `(() => {
  const fs = window.__fs = { picks: [], openCalls: 0, saveCalls: 0 };
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
    async queryPermission() { return 'granted'; },
    async requestPermission() { return 'granted'; },
    async isSameEntry(o) { return !!o && o.__path === path; },
  });
  const next = () => { const a = fs.picks.shift(); if (!a) throw new DOMException('The user aborted a request.', 'AbortError'); return a; };
  window.showOpenFilePicker = async () => { fs.openCalls++; return [handle(next())]; };
  window.showSaveFilePicker = async () => { fs.saveCalls++; return handle(next()); };
})();`;

const VIEWS = ['summary', 'slides', 'om', 'ff', 'sp', 'opn', 'pmos', 'na', 'report', 'changes', 'settings', 'help'];
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, acceptDownloads: true });
await ctx.exposeFunction('__fsRead', p => (existsSync(p) ? readFileSync(p, 'utf8') : null));
await ctx.exposeFunction('__fsWrite', (p, text) => { writeFileSync(p, text); return true; });
await ctx.addInitScript(STANDIN);
const pages = [];
async function open(path) {
  const p = await ctx.newPage();
  const w = { p, errors: [], dialogs: [], downloads: [] };
  p.on('pageerror', e => w.errors.push('page error: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') w.errors.push('console error: ' + m.text()); });
  p.on('dialog', d => { w.dialogs.push(d.type() + ': ' + d.message()); d.dismiss().catch(() => {}); });
  p.on('download', d => w.downloads.push(d));
  pages.push(w);
  await p.goto(pathToFileURL(path).href);
  await p.waitForSelector('#uiMain');
  return w;
}
const until = (p, fn, arg, ms = 15000) => p.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
const msg = p => p.$eval('#uiMsg', e => ({ text: e.textContent, cls: e.className }));
const view = async (p, v) => {
  if (v === 'help') await p.click('#uiHelp');
  else await p.click('[data-act=view][data-v="' + v + '"]');
};
// what the Summary shows: every row's cells as text, and every money cell's exact cents
const summaryShown = p => p.$$eval('#uiMain table.top tr', trs => trs.map(tr => [...tr.children].map(td =>
  (td.getAttribute('data-c') !== null ? 'c' + td.getAttribute('data-c') + ' ' : '') + td.textContent.trim())));
async function download(w, n0, what) {
  const t0 = Date.now();
  while (w.downloads.length <= n0 && Date.now() - t0 < 30000) await new Promise(r => setTimeout(r, 100));
  const d = w.downloads[n0];
  if (!C.chk(what + ': a file was downloaded', !!d)) return null;
  const f = join(tmp.dir, 'dl-' + n0 + '-' + d.suggestedFilename().replace(/[^\w.\- \[\]&]/g, '_'));
  await d.saveAs(f);
  return { path: f, name: d.suggestedFilename() };
}

try {
  // ============================================================================ open, import, set the as-of and first FY
  const A = await open(PAGE);
  C.chk('a fresh page shows the no-data panel', /Import a CCaR pull|CCaR export laid out like v12/.test(await A.p.textContent('#uiMain')));
  await A.p.setInputFiles('#uiFile', [join(FX, 'pull-all.xlsx')]);
  C.chk('the import lands (the Summary shows a table)', await until(A.p, () => !!document.querySelector('#uiMain table.top')));
  const m1 = await msg(A.p);
  // the fixture holds rows that count nowhere on purpose (an unreadable Amount, rows no appropriation claims): the message
  // names them, and reads as a warning, never as a plain success (review F4, DL-2)
  C.chk('the import says so in the message line, as a warning that names the rows counted nowhere',
    /msg-warn/.test(m1.cls) && /^Imported O&M/.test(m1.text) && /could not be read \(FY or Amount\)/.test(m1.text) && /appropriation was not identified/.test(m1.text), J(m1));
  C.chk('the save state is Unsaved changes after an import', /Unsaved/.test(await A.p.textContent('#uiSave')));
  // the as-of default follows today's date; the oracle's scenario is 2026-10 and FY2025, so they are set as a person would
  await A.p.fill('#uiAsOf', '2026-10'); await A.p.dispatchEvent('#uiAsOf', 'change');
  await A.p.fill('#uiFirst', '2025'); await A.p.dispatchEvent('#uiFirst', 'change');
  await until(A.p, () => document.querySelector('#uiAsOf').value === '2026-10' && document.querySelector('#uiFirst').value === '2025');
  C.chk('Data through and First FY take', (await A.p.$eval('#uiAsOf', e => e.value)) === '2026-10' && (await A.p.$eval('#uiFirst', e => e.value)) === '2025');

  // ============================================================================ the Summary against the oracle
  await view(A.p, 'summary');
  const S1 = await summaryShown(A.p);
  const totRow = S1.find(r => r.some(c => /TOTAL - Sustainment/.test(c)));
  const centsIn = r => r.filter(c => /^c-?\d+ /.test(c)).map(c => Number(c.split(' ')[0].slice(1)));
  if (C.chk('the Summary has its TOTAL row', !!totRow)) {
    const [ap, au, ob, un] = centsIn(totRow);
    C.eq('Summary TOTAL: approved, authorized, obligated, unobligated are the oracle\'s', [ap, au, ob, un],
      [O.summary.approved, O.summary.authorized, O.summary.obligated, O.summary.unobligated]);
  }
  const blockRows = S1.filter(r => r.some(c => /^FY?\d{4}$/.test(c) || /^\d{4}$/.test(c)) && centsIn(r).length >= 4);
  C.chk('the Summary has a row for every block', blockRows.length === Object.keys(O.blocks).length, blockRows.length + ' vs ' + Object.keys(O.blocks).length);

  // ============================================================================ every view draws
  for (const v of VIEWS) {
    await view(A.p, v);
    const t = await A.p.textContent('#uiMain');
    C.chk('view ' + v + ': draws something', t && t.trim().length > 20, t && t.slice(0, 80));
    C.chk('view ' + v + ': no "could not be drawn"', !/could not be drawn|could not be worked out/.test(t + (await msg(A.p)).text));
    if (v === 'help') await view(A.p, 'help');   // Help toggles back
  }
  C.chk('no script error and no dialog while viewing', !A.errors.length && !A.dialogs.length, A.errors.concat(A.dialogs).join(' | '));
  // every appropriation view opened to CCaR level: the deepest tree draws too
  for (const ap of ['om', 'ff', 'sp', 'opn']) {
    await view(A.p, ap);
    // each choice redraws the view, so every select is found again by its place
    const k = (await A.p.$$('#uiMain select[data-act=lvl]')).length;
    for (let i = 0; i < k; i++) await A.p.locator('#uiMain select[data-act=lvl]').nth(i).selectOption('4');
    C.chk('view ' + ap + ' expanded to CCaR: no error', !A.errors.length, A.errors.join(' | '));
  }

  // ============================================================================ the integration rulings, on screen
  await view(A.p, 'slides');
  const band = await A.p.$$eval('#uiMain section.slide', ss => ss.map(s => {
    const rows = [...s.querySelectorAll('tr.band')];
    const cum = rows.find(r => /Cumulative Totals/.test(r.textContent));
    const mon = rows.find(r => /Monthly Totals/.test(r.textContent));
    const st = rows.find(r => /OSD Status/.test(r.textContent));
    const plans = st ? [...st.querySelectorAll('td.st.plan')].map(td => ({ cls: td.className, word: td.textContent.trim(),
      style: getComputedStyle(td).fontStyle, bg: getComputedStyle(td).backgroundColor })) : [];
    return { cumTot: cum ? [...cum.querySelectorAll('td.tot')].map(t => t.getAttribute('data-c')) : null,
      monTot: mon ? mon.querySelector('td.tot').getAttribute('data-c') : null, plans };
  }));
  C.chk('every slide block on screen: Cumulative Totals\' Total cells print Approved', band.length > 0
    && band.every(b => b.cumTot && b.cumTot.length === 2 && b.cumTot.every(x => x === b.monTot)), J(band.slice(0, 2)));
  const plans = band.flatMap(b => b.plans).filter(x => /st-(green|yellow|red)/.test(x.cls));
  C.chk('the fixture has plan status cells to judge', plans.length > 0);
  C.chk('a plan status cell on screen keeps its fill and word, in italic', plans.every(x => x.style === 'italic'
    && x.bg !== 'rgba(0, 0, 0, 0)' && x.bg !== 'rgb(255, 255, 255)' && /On track|Within 10|Behind/.test(x.word)), J(plans.slice(0, 3)));

  // ============================================================================ Export Excel
  let n = A.downloads.length;
  await A.p.click('[data-act=export]');
  const xl = await download(A, n, 'Export Excel');
  if (xl) {
    C.chk('the workbook is named for the plan', /^SFCB Spend Plan FY2027 - data through Oct-2026 - \d{4}-\d{2}-\d{2}\.xlsx$/.test(xl.name), xl.name);
    const R = JSON.parse(py([join(HERE, 'export-read.py'), xl.path]));
    const sheets = R.sheets || R;
    const sum = (Array.isArray(sheets) ? sheets : Object.values(sheets)).find(s => s.name === 'Summary');
    if (C.chk('the workbook has a Summary sheet', !!sum)) {
      const row = sum.rows.find(r => r.cells.some(c => c[1] === 'TOTAL - Sustainment'));
      if (C.chk('the Summary sheet has its TOTAL row', !!row)) {
        const nums = row.cells.filter(c => typeof c[1] === 'number').map(c => Math.round(c[1] * 1e8));
        C.eq('the Summary sheet TOTAL ($M, to the cent) is the oracle\'s', nums.slice(0, 4),
          [O.summary.approved, O.summary.authorized, O.summary.obligated, O.summary.unobligated]);
      }
    }
    const snaps = (Array.isArray(sheets) ? sheets : Object.values(sheets)).find(s => s.name === 'Slide Snapshots');
    if (C.chk('the workbook has Slide Snapshots', !!snaps)) {
      const cum = snaps.rows.filter(r => r.cells.some(c => c[1] === 'Cumulative Totals'));
      const mon = snaps.rows.filter(r => r.cells.some(c => c[1] === 'Monthly Totals'));
      C.chk('the workbook\'s Cumulative Totals Total is Monthly Totals\' Total (Approved), on every slide block', cum.length > 0 && cum.length === mon.length
        && cum.every((r, i) => r.cells.find(c => c[0] === 1) && mon[i].cells.find(c => c[0] === 1) && r.cells.find(c => c[0] === 1)[1] === mon[i].cells.find(c => c[0] === 1)[1]));
    }
  }
  C.chk('no script error during the export', !A.errors.length, A.errors.join(' | '));

  // ============================================================================ pictures
  await view(A.p, 'slides');
  // With the Slide blocks view on screen, Chromium's toBlob on a canvas not in the page waited about a second for idle
  // time on every picture (17 s for the real workbook's 11). The pictures must not wait on the browser's idle time.
  const picMs = await A.p.evaluate(async () => {
    const M = SP.buildModel(SP.state.pulls.current, SP.state.settings, SP.getView());
    const t = performance.now();
    for (const b of M.blocks.slice(0, 3)) await SP.blockPng(b, M);
    return Math.round(performance.now() - t);
  });
  C.chk('three pictures are made in under 1.5 s with the Slide blocks view on screen', picMs < 1500, picMs + ' ms');
  n = A.downloads.length;
  await A.p.click('[data-act=savepic][data-b="0"]');
  const png = await download(A, n, 'Save picture');
  if (png) {
    const b = readFileSync(png.path);
    C.chk('Save picture downloads a PNG', b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), png.name);
    C.chk('the PNG is 2000 x 675', b.readUInt32BE(16) === 2000 && b.readUInt32BE(20) === 675, b.readUInt32BE(16) + 'x' + b.readUInt32BE(20));
  }
  n = A.downloads.length;
  await A.p.click('[data-act=zip]');
  const zip = await download(A, n, 'Save all pictures');
  if (zip) {
    const list = JSON.parse(spawnSync('python3', ['-I', '-c', 'import zipfile,sys,json;z=zipfile.ZipFile(sys.argv[1]);print(json.dumps([i.filename for i in z.infolist()]));z.testzip()', zip.path], { encoding: 'utf8' }).stdout || '[]');
    C.chk('the zip holds one PNG per block', list.length === Object.keys(O.blocks).length && list.every(x => /\.png$/.test(x)), J(list));
  }
  C.chk('no script error while making pictures', !A.errors.length, A.errors.join(' | '));

  // ============================================================================ Save, then open the saved file again
  await view(A.p, 'summary');
  const before = await summaryShown(A.p);
  await A.p.evaluate(path => window.__fs.picks.push(path), PAGE);
  await A.p.click('[data-act=save]');
  C.chk('Save says it saved', await until(A.p, () => /Saved/.test(document.querySelector('#uiSave').textContent) && /msg-ok/.test(document.querySelector('#uiMsg').className)),
    J(await msg(A.p)));
  C.chk('the first Save asked for this file once', (await A.p.evaluate(() => window.__fs.openCalls)) === 1);
  const onDisk = readFileSync(PAGE, 'utf8');
  const m = /<script id="spState" type="application\/json">([\s\S]*?)<\/script>/.exec(onDisk);
  const st = m ? JSON.parse(m[1]) : null;
  C.chk('the file on disk carries the state', !!(st && st.tool === 'sfcb-spend-plan' && st.savedAt && st.settings && st.settings.asOf === '2026-10'));
  C.chk('the saved file opens like a fresh page (#app is the boot note)', /<div id="app"><p class="boot-note">/.test(onDisk));
  C.chk('no script error and no dialog while saving', !A.errors.length && !A.dialogs.length, A.errors.concat(A.dialogs).join(' | '));

  const B = await open(PAGE);
  await until(B.p, () => !!document.querySelector('#uiMain table.top'));
  C.chk('the saved file opens as Saved', /Saved/.test(await B.p.textContent('#uiSave')) && !/Unsaved/.test(await B.p.textContent('#uiSave')));
  C.chk('the saved file opens with Data through and First FY as saved',
    (await B.p.$eval('#uiAsOf', e => e.value)) === '2026-10' && (await B.p.$eval('#uiFirst', e => e.value)) === '2025');
  const after = await summaryShown(B.p);
  C.eq('the reopened Summary is the same, figure for figure', after, before);
  for (const v of VIEWS) { await view(B.p, v); if (v === 'help') await view(B.p, 'help'); }
  C.chk('the reopened page draws every view with no error', !B.errors.length, B.errors.join(' | '));
} catch (e) {
  C.chk('the run reached its end', false, (e && e.stack) || String(e));
} finally {
  await browser.close();
  tmp.rm();
}
C.done();
