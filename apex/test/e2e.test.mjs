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
//   - with a BAE report of budgets imported beside the pull (CONTRACT §14), through the same file input: the Summary's
//     figures, its § and † marks and their words, line 2 and the notes are the oracle's (bae-all); the PMO tab says the
//     same lines under its table as the workbook's PMO sheet; the workbook carries the same Summary, its marks, and a BAE
//     Report sheet after OPN Raw Data; Save keeps the report and the reopened file shows it; a later import of gen2's
//     pulls and report makes What changed's BAE section the oracle's diffBae (bae-gen2).
//   - with the obbba pulls and their report (CONTRACT §15, §16; bae-obbba): O&M FY2025, whose only rows are FY2025 OBBBA
//     funding, has no Summary row; the Summary's note and the obbba noBlock note say so in §15.4's words and Settings
//     states the rule; two PMO tabs that share a budget by their plan events are the oracle's; Save keeps all of it, the
//     saved file opens showing it, and its workbook says the same.
//   - with the obbba2 pulls and their report (CONTRACT §17; bae-obbba2): the report's Budget Flex 02 marks O&M FY2025
//     budgets whose names do not hold the word, so their pull rows are left out with it (O&M FY2025 keeps its block, its
//     plan less exactly that money), while Initial Spares FY2025's OBBBA money counts and is listed as such; the Summary,
//     the Import report's two sections and Settings say so in §17.3's words; Save keeps it, the saved file opens showing
//     it, and its workbook's raw O&M sheet, Import Report and Settings say the same.
//
//   node apex/test/e2e.test.mjs                      the page assembled from the sources (as build.mjs writes it)
//   E2E_FILE=apex/apex.html node …        the built file itself
import { chromium } from 'playwright-core';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
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
const oracle = sc => { const f = join(tmp.dir, sc + '.json'); py([join(HERE, 'fixture', 'oracle.py'), '--scenario', sc, '--fixture', FX, '--out', f]); return JSON.parse(readFileSync(f, 'utf8')); };
const OB = oracle('bae-all'), OG = oracle('bae-gen2');
// The report is known by its headers, never its name (§14.8), so it is imported under the real report's kind of name,
// which carries its date (§14.1): the date then reaches line 2, the top bar and What changed's title.
const BAE1 = join(tmp.dir, 'Report__BAE_ALL_Services_USAF_and_DoN_2026-01-31_120000.xlsx');
const BAE2 = join(tmp.dir, 'Report__BAE_ALL_Services_USAF_and_DoN_2026-02-28_093000.xlsx');
copyFileSync(join(FX, 'bae.xlsx'), BAE1);
copyFileSync(join(FX, 'gen2', 'bae.xlsx'), BAE2);

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
  await p.waitForSelector('#uiMain'); await p.evaluate(() => { const b = document.getElementById('uiManageBtn'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); });   // these checks drive the controls a keeper of the plan uses: the Manage data bar is opened (CONTRACT §20)
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
// APEX opens on the Overview (CONTRACT §18): each wait for the Summary's table below first opens the Summary
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
  C.chk('the import lands (the Summary shows a table)', await until(A.p, () => (b => { if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return !!document.querySelector('#uiMain table.top'); })(document.querySelector('[data-act=view][data-v=summary]'))));
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
    C.chk('the workbook is named for the plan', /^APEX FY2027 - data through Oct-2026 - \d{4}-\d{2}-\d{2}\.xlsx$/.test(xl.name), xl.name);
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
  await until(B.p, () => (b => { if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return !!document.querySelector('#uiMain table.top'); })(document.querySelector('[data-act=view][data-v=summary]')));
  C.chk('the saved file opens as Saved', /Saved/.test(await B.p.textContent('#uiSave')) && !/Unsaved/.test(await B.p.textContent('#uiSave')));
  C.chk('the saved file opens with Data through and First FY as saved',
    (await B.p.$eval('#uiAsOf', e => e.value)) === '2026-10' && (await B.p.$eval('#uiFirst', e => e.value)) === '2025');
  const after = await summaryShown(B.p);
  C.eq('the reopened Summary is the same, figure for figure', after, before);
  for (const v of VIEWS) { await view(B.p, v); if (v === 'help') await view(B.p, 'help'); }
  C.chk('the reopened page draws every view with no error', !B.errors.length, B.errors.join(' | '));

  // ============================================================================ a BAE report beside the pull (§14)
  // A fresh page of its own, so the report arrives the way Brad's first one will: in the same import as a pull.
  const PAGE2 = join(tmp.dir, 'bae-page.html');
  writeFileSync(PAGE2, process.env.E2E_FILE ? readFileSync(resolve(process.env.E2E_FILE), 'utf8') : pageHtml());
  const D = await open(PAGE2);
  await D.p.setInputFiles('#uiFile', [join(FX, 'pull-all.xlsx'), BAE1]);
  C.chk('BAE: the import with a report lands', await until(D.p, () => (b => { if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return !!document.querySelector('#uiMain table.top'); })(document.querySelector('[data-act=view][data-v=summary]')) && !!(SP.state.bae && SP.state.bae.current)));
  const mb = await msg(D.p);
  // §14.7: the message line names the report, its date and its rows, and warns: the fixture's report has a row that
  // could not be read
  C.chk('BAE: the message names the report and its date, as a warning', /msg-warn/.test(mb.cls) && /BAE report “Report__BAE_ALL_Services_USAF_and_DoN_2026-01-31_120000\.xlsx”/.test(mb.text)
    && /2026-01-31 12:00/.test(mb.text), J(mb));
  await D.p.fill('#uiAsOf', '2026-10'); await D.p.dispatchEvent('#uiAsOf', 'change');
  await D.p.fill('#uiFirst', '2025'); await D.p.dispatchEvent('#uiFirst', 'change');
  await until(D.p, () => document.querySelector('#uiAsOf').value === '2026-10' && document.querySelector('#uiFirst').value === '2025');
  C.chk('BAE: the top bar names the report and its date', /BAE report “Report__BAE_ALL_Services_USAF_and_DoN_2026-01-31_120000\.xlsx” of 2026-01-31 12:00/.test(await D.p.textContent('#uiTop')));

  // every row of a FY table on screen: its block, the four money cells' cents, Obl %, status word and marks (§14.5)
  const topRead = p => p.$$eval('#uiMain table.top tr[data-bk]', trs => trs.map(tr => {
    const tds = [...tr.children].filter(e => e.tagName === 'TD');
    const money = tds.filter(td => td.hasAttribute('data-c')).slice(0, 4);
    const after = money.length ? tds[tds.indexOf(money[money.length - 1]) + 1] : null;
    const st = tr.querySelector('td.st');
    return { k: tr.getAttribute('data-bk'), c: money.map(td => Number(td.getAttribute('data-c'))), pct: after ? after.textContent.trim() : '',
      st: st ? st.textContent.trim() : '', sect: !!(money[0] && money[0].querySelector('span.sect')),
      dag: !!(money[1] && money[1].querySelector('span.dag')), ddag: !!(money[1] && money[1].querySelector('span.ddag')) };
  }));
  const WORD = { green: 'On track', yellow: 'Within 10', red: 'Behind' };
  const pctOk = (t, x) => (x === null ? t === '' : Math.abs(Number(t.replace('%', '')) - x * 100) <= 0.005 + 1e-9);
  // the words of §14.5, restated from the contract
  const SECT = 'Approved is the CCaR plan: the BAE report has no figure for this block.';
  const DAG_BAE = 'Authorized was neither entered nor in the BAE report; Approved is shown in its place (on a total, for the rows marked †).';
  const AP = { om: 'O&M', ff: 'Full Fund', sp: 'Initial Spares', opn: 'OPN' };
  const fyName = k => AP[k.split('|')[0]] + ' FY' + k.split('|')[1];
  function summaryMatches(rows, X, what) {
    const keys = Object.keys(X.blocks), bad = [];
    const got = rows.filter(r => r.k !== 'total');
    if (J(got.map(r => r.k)) !== J(keys)) bad.push('rows ' + J(got.map(r => r.k)) + ' want ' + J(keys));
    for (const r of got) {
      const b = X.blocks[r.k];
      if (!b) continue;
      if (J(r.c) !== J([b.approved, b.authorized, b.obligated, b.unobligated])) bad.push(r.k + ' ' + J(r.c) + ' want ' + J([b.approved, b.authorized, b.obligated, b.unobligated]));
      if (!pctOk(r.pct, b.oblPct) || r.st !== (b.status ? WORD[b.status] : '')) bad.push(r.k + ' Obl % / status ' + r.pct + ' ' + r.st);
      if (r.sect !== b.marks.sect || r.dag !== b.marks.dagger || r.ddag !== b.marks.ddagger) bad.push(r.k + ' marks ' + J([r.sect, r.dag, r.ddag]) + ' want ' + J(b.marks));
    }
    const t = rows.find(r => r.k === 'total'), T = X.summary;
    if (!t) bad.push('no TOTAL');
    else {
      if (J(t.c) !== J([T.approved, T.authorized, T.obligated, T.unobligated])) bad.push('TOTAL ' + J(t.c));
      const any = f => Object.values(X.blocks).some(b => b.marks[f]);
      if (t.sect !== any('sect') || t.dag !== any('dagger') || t.ddag !== any('ddagger')) bad.push('TOTAL marks ' + J([t.sect, t.dag, t.ddag]));
    }
    C.chk(what, !bad.length, bad.slice(0, 5).join('; '));
  }
  await view(D.p, 'summary');
  const SB = await topRead(D.p);
  summaryMatches(SB, OB, 'BAE: every Summary row and the TOTAL are the oracle’s bae-all: figures, Obl %, status and the § † ‡ marks');
  C.chk('BAE: the fixture reaches both kinds of block (covered, and § on the plan)', Object.values(OB.blocks).some(b => b.marks.sect)
    && Object.values(OB.blocks).some(b => b.covered && b.approved !== b.planned));
  const markNotes = await D.p.$$eval('#uiMain p.mark-note', ps => ps.map(e => e.textContent.trim()));
  C.eq('BAE: under the Summary, § and † said in §14.5’s words', markNotes, ['§ ' + SECT, '† ' + DAG_BAE]);
  const l2 = (await D.p.textContent('#uiMain p.l2')).replace(/\s+/g, ' ');
  C.chk('BAE: line 2 says Approved and Authorized are the BAE report of its date (§14.5)', l2 === 'Data through Oct-2026 | Approved, Authorized = BAE report of 2026-01-31 12:00 (sustainment budgets)'
    + ' | Obligated = CCaR status “Actual Execution” | Unobligated = Approved - Obligated | Delta = Obl% - OSD%', l2);
  const notes = await D.p.$$eval('#uiMain ul.notes li', ls => ls.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
  const unc = OB.bae.uncovered.map(x => fyName(x.ap + '|' + x.fy));
  C.chk('BAE: a note names every block the report does not cover, as marked §', unc.length > 0
    && notes.some(n => /^The BAE report has no figure for /.test(n) && unc.every(u => n.includes(u)) && /\(marked §\)/.test(n)), notes.join(' / '));
  C.chk('BAE: a note flags every block whose CCaR plan is under half the report’s Approved (rule 5)', OB.bae.planShort.length > 0
    && OB.bae.planShort.every(x => notes.some(n => n.startsWith(fyName(x.ap + '|' + x.fy) + ': the CCaR plan (') && /of the BAE report’s Approved/.test(n)))
    && notes.filter(n => /: the CCaR plan \(.*\) is \d+% of the BAE report’s Approved/.test(n)).length === OB.bae.planShort.length, notes.join(' / '));
  C.chk('BAE: the report’s own note says its total row agrees', notes.some(n => /^Approved and Authorized come from the BAE report of 2026-01-31 12:00/.test(n)
    && /Its total row agrees with the rows read\./.test(n)) === OB.bae.total.ok, notes.join(' / '));

  // the PMO tab: its table, and the lines under it, which the workbook's PMO sheet must print word for word
  await view(D.p, 'pmos');
  const pmoOpts = await D.p.$$eval('#uiMain select[data-act=pmo] option', os => os.map(o => ({ v: o.value, t: o.textContent.trim() })));
  const avOpt = pmoOpts.find(o => o.t === 'Air Vehicle (AV)');
  let screenPmoNotes = null;
  if (C.chk('BAE: the PMO tab offers Air Vehicle (AV)', !!avOpt, J(pmoOpts))) {
    await D.p.selectOption('#uiMain select[data-act=pmo]', avOpt.v);
    await until(D.p, () => /PMO: Air Vehicle \(AV\)/.test(document.querySelector('#uiMain h2.title').textContent));
    const tab = OB.pmoTabs['Air Vehicle (AV)'], pr = (await topRead(D.p)).filter(r => r.k !== 'total');
    const bad = pr.filter(r => !tab[r.k] || J(r.c) !== J([tab[r.k].approved, tab[r.k].authorized, tab[r.k].obligated, tab[r.k].unobligated])
      || r.sect !== tab[r.k].sect || r.dag !== tab[r.k].sect).map(r => r.k + ' ' + J(r.c) + ' § ' + r.sect);
    C.chk('BAE: the AV tab’s rows are the oracle’s (its share of the budgets its plan events use where covered, § and † where not; §16.1)', pr.length === Object.keys(tab).length && !bad.length
      && pr.some(r => tab[r.k].basis === 'planEvent') && pr.some(r => tab[r.k].basis === 'row'), bad.join('; ') + ' rows ' + pr.length);
    screenPmoNotes = await D.p.$$eval('#uiMain p.note.pmo-note', ps => ps.map(e => e.textContent.trim()));
  }
  C.chk('no script error and no dialog on the BAE views', !D.errors.length && !D.dialogs.length, D.errors.concat(D.dialogs).join(' | '));

  // Export Excel with the report loaded
  await view(D.p, 'summary');
  n = D.downloads.length;
  await D.p.click('[data-act=export]');
  const xb = await download(D, n, 'BAE: Export Excel');
  if (xb) {
    const R = JSON.parse(py([join(HERE, 'export-read.py'), xb.path]));
    const sh = R.sheets, styles = R.styles, names = sh.map(x => x.name);
    const fmt = c => (styles[c[2]] || [])[4] || '';
    const sum = sh.find(x => x.name === 'Summary');
    if (C.chk('BAE: the workbook has a Summary sheet', !!sum)) {
      const fyRows = sum.rows.filter(r => r.cells.some(c => c[0] === 1 && typeof c[1] === 'number' && c[1] > 1990));
      const keys = Object.keys(OB.blocks), bad = [];
      if (fyRows.length !== keys.length) bad.push(fyRows.length + ' FY rows, want ' + keys.length);
      fyRows.forEach((r, i) => {
        const b = OB.blocks[keys[i]], at = col => r.cells.find(c => c[0] === col);
        if (!b) return;
        const cents = [2, 3, 4, 5].map(col => (at(col) ? Math.round(at(col)[1] * 1e8) : null));
        if (J(cents) !== J([b.approved, b.authorized, b.obligated, b.unobligated])) bad.push(keys[i] + ' ' + J(cents));
        if (/§/.test(fmt(at(2) || [])) !== b.marks.sect || /†/.test(fmt(at(3) || [])) !== b.marks.dagger) bad.push(keys[i] + ' marks ' + fmt(at(2) || []) + ' / ' + fmt(at(3) || []));
      });
      C.chk('BAE: the workbook’s Summary rows are the oracle’s, each with its § and † marks', !bad.length, bad.slice(0, 4).join('; '));
      const texts = sum.rows.flatMap(r => r.cells.filter(c => typeof c[1] === 'string').map(c => c[1]));
      C.chk('BAE: the workbook says § and † in §14.5’s words, and line 2 names the report', texts.includes(SECT) && texts.includes(DAG_BAE)
        && texts.some(t => t.startsWith('Data through Oct-2026 | Approved, Authorized = BAE report of 2026-01-31 12:00 (sustainment budgets)')));
    }
    const ib = names.indexOf('BAE Report');
    C.chk('BAE: the workbook has a BAE Report sheet, right after OPN Raw Data', ib > 0 && names[ib - 1] === 'OPN Raw Data', J(names));
    if (ib > 0) {
      const head = sh[ib].rows[0].cells.map(c => c[1]);
      const ci = head.indexOf('Counted');
      const counted = sh[ib].rows.slice(1).map(r => (r.cells.find(c => c[0] === ci) || [])[1]).filter(v => v !== undefined);
      const want = OB.bae.counted.map(c => c[1]);
      C.chk('BAE: its sheet has every report row and the total row, each with Counted', counted.length === want.length + (OB.bae.totalRow ? 1 : 0)
        && counted.filter(v => v === 'Yes').length === want.filter(v => v === 'Yes').length, counted.length + ' vs ' + want.length);
      // §16.2 its PMO column says where each counting row's money goes, as the oracle works it out (blank where a row does not count)
      const pi = head.indexOf('PMO');
      const goes = sh[ib].rows.slice(1).filter(r => (r.cells.find(c => c[0] === ci) || [])[1] !== undefined && !/^No: the report’s own total row/.test((r.cells.find(c => c[0] === ci) || [])[1]))
        .map(r => (r.cells.find(c => c[0] === pi) || [])[1] ?? '');
      C.eq('BAE: its PMO column is the PMOs whose plan events share each budget, by their plan, or “No plan event uses it” (§16.2)', goes, OB.bae.pmoColumn.map(c => c[1]));
    }
    const avSheet = sh.find(x => x.name === 'PMO AV');
    if (screenPmoNotes && C.chk('BAE: the workbook has the PMO AV sheet', !!avSheet)) {
      const sheetLines = avSheet.rows.flatMap(r => r.cells.filter(c => c[0] === 0 && typeof c[1] === 'string').map(c => c[1]));
      const lines = sheetLines.filter(t => screenPmoNotes.includes(t));
      // one source for both (SP.pmoTabLines): each line the screen prints under the table is on the sheet, in its order
      C.eq('BAE: the PMO tab says the lines under its table that the workbook’s PMO sheet says, in the same order', lines, screenPmoNotes);
      // §16.2: what its figures count, the report money no plan event uses on its covered blocks (from the oracle), then
      // §8.6's note narrowed to the rows the report does not cover
      const tab = OB.pmoTabs['Air Vehicle (AV)'];
      // (the blocks in the tab's own row order, restated from §8.6: Full Fund, Initial Spares, O&M, OPN, then FY)
      const TAB_AP = ['ff', 'sp', 'om', 'opn'];
      const unK = Object.keys(tab).sort((a, b) => TAB_AP.indexOf(a.split('|')[0]) - TAB_AP.indexOf(b.split('|')[0]) || Number(a.split('|')[1]) - Number(b.split('|')[1]))
        .filter(k => tab[k].basis === 'planEvent').map(k => OB.bae.unassigned.find(u => u.ap + '|' + u.fy === k)).filter(u => u && (u.approved || u.authorized));
      C.chk('BAE: the PMO tab’s lines say what its figures count, the money no plan event uses, and narrow §8.6’s note', unK.length > 0 && screenPmoNotes[0]
        === 'Approved and Authorized are the BAE report’s figures for the budgets this PMO’s plan events are assigned to; a budget the plan events of several PMOs use is split among them by each one’s CCaR plan on it. Obligated counts this PMO’s plan events.'
        && screenPmoNotes[1] === unK.map(u => fyName(u.ap + '|' + u.fy) + ' $' + (u.approved / 1e8).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'M').join('; ')
          + ' of the BAE report’s Approved is on budgets no plan event uses; it is in the Summary and on no PMO tab (see the Import report).'
        && screenPmoNotes[screenPmoNotes.length - 1] === 'Authorized is entered by appropriation and FY; where the BAE report has no figure for a block, its PMO row shows Approved.', J(screenPmoNotes));
    }
  }
  C.chk('no script error during the BAE export', !D.errors.length, D.errors.join(' | '));

  // Save, and open the saved file: the report is kept with the pull
  await view(D.p, 'summary');
  const beforeB = await topRead(D.p);
  await D.p.evaluate(path => window.__fs.picks.push(path), PAGE2);
  await D.p.click('[data-act=save]');
  C.chk('BAE: Save says it saved', await until(D.p, () => /Saved/.test(document.querySelector('#uiSave').textContent) && /msg-ok/.test(document.querySelector('#uiMsg').className)), J(await msg(D.p)));
  const disk2 = readFileSync(PAGE2, 'utf8');
  const m2 = /<script id="spState" type="application\/json">([\s\S]*?)<\/script>/.exec(disk2);
  const st2 = m2 ? JSON.parse(m2[1]) : null;
  C.chk('BAE: the saved file carries the report, every row, and no previous one', !!(st2 && st2.bae && st2.bae.current && st2.bae.previous === null
    && st2.bae.current.rows.length === OB.bae.rows.in + OB.bae.rows.flyaway + OB.bae.rows.noap + OB.bae.rows.bad
    && st2.bae.current.stamp === '2026-01-31 12:00'), st2 && st2.bae && J({ n: st2.bae.current && st2.bae.current.rows.length, prev: st2.bae.previous }));
  const E2 = await open(PAGE2);
  await until(E2.p, () => (b => { if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return !!document.querySelector('#uiMain table.top'); })(document.querySelector('[data-act=view][data-v=summary]')));
  C.chk('BAE: the saved file opens as Saved', /Saved/.test(await E2.p.textContent('#uiSave')) && !/Unsaved/.test(await E2.p.textContent('#uiSave')));
  C.eq('BAE: the reopened Summary is the same, figure for figure and mark for mark', await topRead(E2.p), beforeB);
  await view(E2.p, 'settings');
  C.chk('BAE: the reopened Settings name the report it holds', /File “Report__BAE_ALL_Services_USAF_and_DoN_2026-01-31_120000\.xlsx”/.test(await E2.p.textContent('#uiMain'))
    && (await E2.p.$$('#uiMain table.authbae tr[data-bk]')).length === Object.keys(OB.blocks).length);
  C.chk('BAE: the reopened page has no script error and no dialog', !E2.errors.length && !E2.dialogs.length, E2.errors.concat(E2.dialogs).join(' | '));

  // gen2: a later pull of O&M and Full Fund with a later report (§14.6 What changed, SP.diffBae)
  await E2.p.setInputFiles('#uiFile', [join(FX, 'gen2', 'pull-om.xlsx'), join(FX, 'gen2', 'pull-ff.csv'), BAE2]);
  C.chk('BAE: the gen2 import lands, the first report kept as previous', await until(E2.p, () => !!(SP.state.bae && SP.state.bae.previous && SP.state.bae.current
    && SP.state.bae.current.stamp === '2026-02-28 09:30')), J(await msg(E2.p)));
  await E2.p.fill('#uiAsOf', '2026-10'); await E2.p.dispatchEvent('#uiAsOf', 'change');
  await E2.p.fill('#uiFirst', '2025'); await E2.p.dispatchEvent('#uiFirst', 'change');
  await until(E2.p, () => document.querySelector('#uiAsOf').value === '2026-10' && document.querySelector('#uiFirst').value === '2025');
  await view(E2.p, 'summary');
  summaryMatches(await topRead(E2.p), OG, 'BAE gen2: every Summary row and the TOTAL are the oracle’s bae-gen2');
  await view(E2.p, 'changes');
  const sec = await E2.p.$('#uiMain section.chg.bae');
  if (C.chk('BAE gen2: What changed has a BAE report section', !!sec)) {
    const title = (await sec.$eval('h3.bar', e => e.textContent)).replace(/\s+/g, ' ');
    C.chk('BAE gen2: it is titled by both reports’ dates, old → new', /^BAE report: 2026-01-31 12:00 \(“Report__BAE_ALL_Services_USAF_and_DoN_2026-01-31_120000\.xlsx”.*\) → 2026-02-28 09:30 \(/.test(title), title);
    const by = await sec.$$eval('table.baeby tr[data-bk]', trs => trs.map(tr => ({ k: tr.getAttribute('data-bk'),
      c: [...tr.querySelectorAll('td[data-c]')].map(td => Number(td.getAttribute('data-c'))) })));
    const D2 = OG.diffBae.byBlock, dk = Object.keys(D2);
    const bad = by.filter(r => !D2[r.k] || J([r.c[0], r.c[1], r.c[3], r.c[4]]) !== J([D2[r.k].approved[0], D2[r.k].approved[1], D2[r.k].authorized[0], D2[r.k].authorized[1]])).map(r => r.k);
    // the oracle writes its keys sorted; the screen lists them in model order (§14.8: appropriations as SP.APS, then FY)
    const AT = { om: 0, ff: 1, sp: 2, opn: 3 };
    const inModel = dk.slice().sort((a, b) => AT[a.split('|')[0]] - AT[b.split('|')[0]] || Number(a.split('|')[1]) - Number(b.split('|')[1]));
    C.chk('BAE gen2: Approved and Authorized before and after, by appropriation and FY, are the oracle’s, in model order', J(by.map(r => r.k)) === J(inModel) && !bad.length,
      bad.join(', ') + ' ' + J(by.map(r => r.k)));
    // review I4-3: the budgets with a row that could not be read are listed apart, as the oracle lists them
    for (const [kind, list] of [['changed', OG.diffBae.budgetsChanged], ['new', OG.diffBae.budgetsNew], ['gone', OG.diffBae.budgetsGone], ['unread', OG.diffBae.budgetsUnread]]) {
      // found again each time: a Show button redraws the view, and the section found above with it
      const nShown = await E2.p.$eval('#uiMain section.chg.bae h4[data-list="bae-' + kind + '"]', e => Number(e.getAttribute('data-n'))).catch(() => null);
      C.chk('BAE gen2: budgets ' + kind + ': the oracle’s count', nShown === list.length && list.length > 0, nShown + ' vs ' + list.length);
      const btn = await E2.p.$('#uiMain [data-act=diff][data-fkey="diff:bae|' + kind + '"]');
      if (btn) {
        await btn.click();
        await until(E2.p, k => !!document.querySelector('#uiMain table[data-budgets="' + k + '"]'), kind);
        const shown = await E2.p.$$eval('#uiMain table[data-budgets="' + kind + '"] tbody tr', trs => trs.map(tr => tr.querySelector('td').textContent.trim()));
        C.eq('BAE gen2: budgets ' + kind + ', largest change first, are the oracle’s', shown, list.map(e => e.name));
      } else C.chk('BAE gen2: budgets ' + kind + ' has its Show button', false);
    }
  }
  C.chk('BAE gen2: no script error and no dialog', !E2.errors.length && !E2.dialogs.length, E2.errors.concat(E2.dialogs).join(' | '));

  // ============================================================================ FY2025 OBBBA funding left out (§15), a split budget (§16)
  // A fresh page, the obbba pulls and their report in one import (bae-obbba): O&M FY2025 holds only FY2025 OBBBA rows, so it
  // has no block and is named by the obbba noBlock note; the Summary's note says what was left out; a budget the plan events
  // of two PMOs use is split between their tabs by their plan. Save keeps all of it, and the saved file opens showing it.
  const OO = oracle('bae-obbba');
  const PAGE3 = join(tmp.dir, 'obbba-page.html');
  writeFileSync(PAGE3, process.env.E2E_FILE ? readFileSync(resolve(process.env.E2E_FILE), 'utf8') : pageHtml());
  const F = await open(PAGE3);
  await F.p.setInputFiles('#uiFile', [join(FX, 'obbba', 'pull-om.xlsx'), join(FX, 'obbba', 'pull-ff.csv'), join(FX, 'obbba', 'bae.xlsx')]);
  C.chk('OBBBA: the import of the obbba pulls and report lands', await until(F.p, () => (b => { if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return !!document.querySelector('#uiMain table.top'); })(document.querySelector('[data-act=view][data-v=summary]')) && !!(SP.state.bae && SP.state.bae.current)));
  await F.p.fill('#uiAsOf', '2026-10'); await F.p.dispatchEvent('#uiAsOf', 'change');
  await F.p.fill('#uiFirst', '2025'); await F.p.dispatchEvent('#uiFirst', 'change');
  await until(F.p, () => document.querySelector('#uiAsOf').value === '2026-10' && document.querySelector('#uiFirst').value === '2025');
  // restated from §2 and §15.4, every figure the oracle's
  const mT = c => { if (c === 0) return '0.00'; const a = Math.abs(c); let h = Math.floor(a / 1e6); if (a - h * 1e6 >= 500000) h++;
    const b = a < 500000 ? '<0.01' : String(Math.floor(h / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + String(h % 100).padStart(2, '0'); return c < 0 ? '(' + b + ')' : b; };
  const ob = OO.excluded.obbba, rws = n => n + (n === 1 ? ' row' : ' rows');
  // §17.3: the words say FY2025 O&M OBBBA funding
  const OB_NOTE = 'FY2025 O&M OBBBA funding is left out of every figure: it is not a reporting year. The CCaR pull holds ' + rws(ob.rows) + ' of it on ' + ob.budgets.length
    + (ob.budgets.length === 1 ? ' budget' : ' budgets') + ' (' + ob.blocks.map(b => fyName(b.ap + '|' + b.fy)).join(', ') + '), $' + mT(ob.cents) + 'M planned, $' + mT(ob.obligated)
    + 'M of it obligated. See the Import report.';
  const nb = OO.bae.noBlock.filter(t => t.obbba);
  const NB_NOTES = nb.map(t => fyName(t.ap + '|' + t.fy) + ' has no block: its only CCaR pull rows are FY2025 O&M OBBBA funding, which is left out. The BAE report’s $'
    + mT(t.approved) + 'M Approved and $' + mT(t.authorized) + 'M Authorized for it are not shown.');
  const RULE = 'FY2025 O&M OBBBA funding is left out of every figure: it is not a reporting year. OBBBA funding of every other appropriation counts '
    + 'like any other money (Brad, 11 Nov 2026).';
  // §17: the rule is O&M's alone, so Full Fund FY2025's OBBBA rows count and only O&M FY2025 is left out
  C.chk('OBBBA: the fixture leaves out a whole block (O&M FY2025, named by the report); Full Fund FY2025 keeps its OBBBA rows (§17)', !OO.blocks['om|2025'] && !!OO.blocks['ff|2025']
    && J(ob.blocks.map(b => b.ap + '|' + b.fy)) === J(['om|2025']) && J(nb.map(t => t.ap + '|' + t.fy)) === J(['om|2025']), J(ob.blocks) + J(nb));
  const obScreen = async (w, what) => {
    await view(w.p, 'summary');
    await until(w.p, () => !!document.querySelector('#uiMain ul.notes'));
    const rows = await topRead(w.p);
    summaryMatches(rows, OO, what + ': every Summary row and the TOTAL are the oracle’s bae-obbba, with no row for O&M FY2025');
    const ns = await w.p.$$eval('#uiMain ul.notes li', ls => ls.map(e => e.textContent));
    C.chk(what + ': the Summary’s note on FY2025 O&M OBBBA funding, and the obbba noBlock note for O&M FY2025, in §17.3’s words', ns.includes(OB_NOTE) && NB_NOTES.every(n => ns.includes(n)), J(ns));
    await view(w.p, 'settings');
    C.eq(what + ': Settings says the rule under First FY', await w.p.$eval('#uiMain p.obbba-rule', e => e.textContent).catch(() => null), RULE);
    return rows;
  };
  const obBefore = await obScreen(F, 'OBBBA');

  // §16: a PMO tab whose row takes its share of a budget the plan events of two PMOs use, as the oracle splits it
  const sp = OO.bae.split.find(e => e.pmos.length >= 2 && e.pmos.every(p => OO.pmoTabs[p.pmo] && OO.pmoTabs[p.pmo][e.ap + '|' + e.fy]));
  if (C.chk('OBBBA: the oracle splits a budget between two PMOs in a covered block', !!sp, J(OO.bae.split.map(e => e.key)))) {
    const k = sp.ap + '|' + sp.fy;
    for (const p of sp.pmos.slice(0, 2)) {
      await view(F.p, 'pmos');
      const opts = await F.p.$$eval('#uiMain select[data-act=pmo] option', os => os.map(o => ({ v: o.value, t: o.textContent.trim() })));
      const o = opts.find(x => x.t === p.pmo);
      if (!C.chk('OBBBA: the PMO tab offers ' + p.pmo, !!o, J(opts))) continue;
      await F.p.selectOption('#uiMain select[data-act=pmo]', o.v);
      await until(F.p, t => document.querySelector('#uiMain h2.title').textContent.includes('PMO: ' + t), p.pmo);
      const tab = OO.pmoTabs[p.pmo], pr = (await topRead(F.p)).filter(r => r.k !== 'total');
      const bad = pr.filter(r => !tab[r.k] || J(r.c) !== J([tab[r.k].approved, tab[r.k].authorized, tab[r.k].obligated, tab[r.k].unobligated])).map(r => r.k + ' ' + J(r.c));
      C.chk('OBBBA: ' + p.pmo + '’s tab is the oracle’s, its ' + fyName(k) + ' row on its plan events with its share of “' + sp.name + '” (§16.1)',
        pr.length === Object.keys(tab).length && !bad.length && tab[k].basis === 'planEvent' && tab[k].approved >= p.approved && pr.some(r => r.k === k), bad.join('; ') + ' rows ' + pr.length);
    }
    await view(F.p, 'report');
    const li = await F.p.$eval('#uiMain ul.pmosplit li[data-key="' + sp.key.replace(/"/g, '\\"') + '"][data-bk="' + k + '"]', e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => null);
    C.chk('OBBBA: the Import report lists that budget among those split, each PMO with its plan and shares (§16.2)', !!li && sp.pmos.every(p => li.includes(p.pmo + ', plan ')), li);
  }
  C.chk('OBBBA: no script error and no dialog', !F.errors.length && !F.dialogs.length, F.errors.concat(F.dialogs).join(' | '));

  // Save, and open the saved file: O&M FY2025 is still gone, the notes and the rule still said
  await F.p.evaluate(path => window.__fs.picks.push(path), PAGE3);
  await F.p.click('[data-act=save]');
  C.chk('OBBBA: Save says it saved', await until(F.p, () => /Saved/.test(document.querySelector('#uiSave').textContent) && /msg-ok/.test(document.querySelector('#uiMsg').className)), J(await msg(F.p)));
  const F2 = await open(PAGE3);
  await until(F2.p, () => (b => { if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return !!document.querySelector('#uiMain table.top'); })(document.querySelector('[data-act=view][data-v=summary]')));
  C.chk('OBBBA: the saved file opens as Saved, on the same Data through and First FY', /Saved/.test(await F2.p.textContent('#uiSave')) && !/Unsaved/.test(await F2.p.textContent('#uiSave'))
    && (await F2.p.$eval('#uiAsOf', e => e.value)) === '2026-10' && (await F2.p.$eval('#uiFirst', e => e.value)) === '2025');
  const obAfter = await obScreen(F2, 'OBBBA reopened');
  C.eq('OBBBA reopened: the Summary is the same, figure for figure', obAfter, obBefore);
  // and its workbook: no O&M FY2025 row, the note on the Summary sheet, the rule on the Settings sheet
  await view(F2.p, 'summary');
  n = F2.downloads.length;
  await F2.p.click('[data-act=export]');
  const xo = await download(F2, n, 'OBBBA reopened: Export Excel');
  if (xo) {
    const R = JSON.parse(py([join(HERE, 'export-read.py'), xo.path]));
    const cellsOf = name => { const s = R.sheets.find(x => x.name === name); return s ? s.rows.map(r => r.cells) : []; };
    const sum = cellsOf('Summary'), texts = sum.flatMap(cs => cs.filter(c => typeof c[1] === 'string').map(c => c[1]));
    const fys = sum.filter(cs => cs.some(c => c[0] === 1 && typeof c[1] === 'number' && c[1] > 1990)).map(cs => [(cs.find(c => c[0] === 0) || [])[1] || null, cs.find(c => c[0] === 1)[1]]);
    C.eq('OBBBA reopened: the workbook’s Summary has the oracle’s blocks (no O&M FY2025)', fys.length, Object.keys(OO.blocks).length);
    C.chk('OBBBA reopened: … and says what was left out, as the screen does', texts.includes(OB_NOTE) && NB_NOTES.every(x => texts.includes(x)), J(texts.slice(-8)));
    C.chk('OBBBA reopened: the Settings sheet states the rule', cellsOf('Settings').some(cs => cs.some(c => c[1] === RULE)));
  }
  C.chk('OBBBA reopened: no script error and no dialog', !F2.errors.length && !F2.dialogs.length, F2.errors.concat(F2.dialogs).join(' | '));

  // ============================================================================ FY2025 O&M OBBBA funding marked in Budget Flex 02 (§17)
  // A fresh page, the obbba2 pulls and their report in one import (bae-obbba2). Every figure is the oracle's; the words are
  // §17.3's, restated.
  const O2 = oracle('bae-obbba2'), O2n = oracle('obbba2');
  const PAGE4 = join(tmp.dir, 'obbba2-page.html');
  writeFileSync(PAGE4, process.env.E2E_FILE ? readFileSync(resolve(process.env.E2E_FILE), 'utf8') : pageHtml());
  const G = await open(PAGE4);
  await G.p.setInputFiles('#uiFile', ['pull-om.xlsx', 'pull-ff.csv', 'pull-sp.xlsx', 'bae.xlsx'].map(f => join(FX, 'obbba2', f)));
  C.chk('OBBBA2: the import of the obbba2 pulls and report lands', await until(G.p, () => (b => { if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return !!document.querySelector('#uiMain table.top'); })(document.querySelector('[data-act=view][data-v=summary]')) && !!(SP.state.bae && SP.state.bae.current)));
  await G.p.fill('#uiAsOf', '2026-10'); await G.p.dispatchEvent('#uiAsOf', 'change');
  await G.p.fill('#uiFirst', '2025'); await G.p.dispatchEvent('#uiFirst', 'change');
  await until(G.p, () => document.querySelector('#uiAsOf').value === '2026-10' && document.querySelector('#uiFirst').value === '2025');
  const usd = c => (c < 0 ? '-' : '') + '$' + String(Math.floor(Math.abs(c) / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + String(Math.abs(c) % 100).padStart(2, '0');
  const o2 = O2.excluded.obbba, byRep = o2.budgets.filter(t => t.by === 'report'), repCents = byRep.reduce((a, t) => a + t.cents, 0);
  const WHY2 = 'FY2025 O&M OBBBA funding (not a reporting year)', WHY2_FLEX = WHY2 + ', marked in Budget Flex 02';
  const nName = O2.bae.counted.filter(([, w]) => w === WHY2).length, nFlex = O2.bae.counted.filter(([, w]) => w === WHY2_FLEX).length;
  const spE = (O2.obbbaElsewhere || []).find(e => e.ap === 'sp' && e.fy === 2025);
  C.chk('OBBBA2: the fixture leaves out O&M FY2025 money marked only in the report’s Budget Flex 02, O&M FY2025 keeps its block with its plan less exactly that, '
    + 'and Initial Spares FY2025’s OBBBA money counts', byRep.length > 0 && repCents > 0 && !!O2.blocks['om|2025'] && !!O2n.blocks['om|2025']
    && O2.blocks['om|2025'].planned === O2n.blocks['om|2025'].approved - repCents && !!O2.blocks['sp|2025'] && !!spE && spE.pull.rows > 0 && spE.report.byFlex02 > 0
    && nFlex > 0 && nName > 0, J([byRep, O2.blocks['om|2025'] && O2.blocks['om|2025'].planned, spE]));
  const OB2_NOTE = 'FY2025 O&M OBBBA funding is left out of every figure: it is not a reporting year. The CCaR pull holds ' + rws(o2.rows) + ' of it on ' + o2.budgets.length
    + (o2.budgets.length === 1 ? ' budget' : ' budgets') + ' (' + o2.blocks.map(b => fyName(b.ap + '|' + b.fy)).join(', ') + '), $' + mT(o2.cents) + 'M planned, $' + mT(o2.obligated)
    + 'M of it obligated. See the Import report.';
  // §17.3 the Import report's section names each budget the report marks as such, and counts the report's rows both ways
  const BUD_LINES = o2.budgets.map(t => '“' + t.name + '” (' + AP[t.ap] + ')' + (t.by === 'report' ? ', marked in the BAE report’s Budget Flex 02' : '') + ': '
    + rws(t.rows) + ', plan ' + usd(t.cents) + ', obligated ' + usd(t.obligated) + '.');
  const REP_TAIL = ' (named OBBBA: ' + rws(nName) + '; marked in Budget Flex 02 only: ' + rws(nFlex) + ').';
  const ELSE_HEAD = 'OBBBA funding outside O&M counts like any other money (Brad, 11 Nov 2026):';
  const SP_LINE = 'Initial Spares FY2025: in the CCaR pull, ' + rws(spE ? spE.pull.rows : 0) + ', plan ' + usd(spE ? spE.pull.cents : 0) + '; in the BAE report, '
    + rws(spE ? spE.report.rows : 0) + ' (named OBBBA: ' + rws(spE ? spE.report.byName : 0) + '; marked in Budget Flex 02 only: ' + rws(spE ? spE.report.byFlex02 : 0) + '), Approved '
    + usd(spE ? spE.report.approved : 0) + ', Authorized ' + usd(spE ? spE.report.authorized : 0) + '.';
  const ob2Screen = async (w, what) => {
    await view(w.p, 'summary');
    await until(w.p, () => !!document.querySelector('#uiMain ul.notes'));
    const rows = await topRead(w.p);
    summaryMatches(rows, O2, what + ': every Summary row and the TOTAL are the oracle’s bae-obbba2 (O&M FY2025 and Initial Spares FY2025 among them)');
    const ns = await w.p.$$eval('#uiMain ul.notes li', ls => ls.map(e => e.textContent));
    C.chk(what + ': the Summary’s note on FY2025 O&M OBBBA funding counts the rows the report marks too', ns.includes(OB2_NOTE), J(ns));
    await view(w.p, 'report');
    const sec = await w.p.$$eval('#uiMain section.obbba .rl', es => es.map(e => e.textContent.trim())).catch(() => []);
    C.chk(what + ': the Import report’s section names each budget left out, those the report marks as such, and the report’s rows named and marked in Budget Flex 02',
      BUD_LINES.every(l => sec.includes(l)) && sec.some(l => l.startsWith('In the BAE report: ') && l.endsWith(REP_TAIL)), J(sec));
    const els = await w.p.$$eval('#uiMain section.obbba-else', ss => ss.map(s => [s.querySelector('h3').textContent.trim()].concat([...s.querySelectorAll('.rl')].map(e => e.textContent.trim()))));
    C.chk(what + ': the Import report lists Initial Spares FY2025’s OBBBA money as counting (§17.3)', els.length === 1 && els[0][0] === ELSE_HEAD && els[0].includes(SP_LINE), J(els));
    await view(w.p, 'settings');
    C.eq(what + ': Settings says the rule under First FY', await w.p.$eval('#uiMain p.obbba-rule', e => e.textContent).catch(() => null), RULE);
    return { rows, sec, els };
  };
  const ob2Before = await ob2Screen(G, 'OBBBA2');
  C.chk('OBBBA2: no script error and no dialog', !G.errors.length && !G.dialogs.length, G.errors.concat(G.dialogs).join(' | '));
  await G.p.evaluate(path => window.__fs.picks.push(path), PAGE4);
  await G.p.click('[data-act=save]');
  C.chk('OBBBA2: Save says it saved', await until(G.p, () => /Saved/.test(document.querySelector('#uiSave').textContent) && /msg-ok/.test(document.querySelector('#uiMsg').className)), J(await msg(G.p)));
  const G2 = await open(PAGE4);
  await until(G2.p, () => (b => { if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return !!document.querySelector('#uiMain table.top'); })(document.querySelector('[data-act=view][data-v=summary]')));
  C.chk('OBBBA2: the saved file opens as Saved, on the same Data through and First FY', /Saved/.test(await G2.p.textContent('#uiSave')) && !/Unsaved/.test(await G2.p.textContent('#uiSave'))
    && (await G2.p.$eval('#uiAsOf', e => e.value)) === '2026-10' && (await G2.p.$eval('#uiFirst', e => e.value)) === '2025');
  C.eq('OBBBA2 reopened: the Summary, the Import report’s two sections and Settings are the same', await ob2Screen(G2, 'OBBBA2 reopened'), ob2Before);
  // and its workbook: O&M Raw Data says which rows were left out because the report marks their budget; the Import Report
  // sheet carries the same two sections; Settings the rule
  await view(G2.p, 'summary');
  n = G2.downloads.length;
  await G2.p.click('[data-act=export]');
  const x2 = await download(G2, n, 'OBBBA2 reopened: Export Excel');
  if (x2) {
    const R = JSON.parse(py([join(HERE, 'export-read.py'), x2.path]));
    const colA = name => { const s = R.sheets.find(x => x.name === name); return s ? s.rows.map(r => { const a = []; for (const [ci, v] of r.cells) a[ci] = v; return a; }) : []; };
    const raw = colA('O&M Raw Data'), ci = raw.length ? raw[0].indexOf('Counted') : -1;
    const want = (O2.rawCounted.om || []).map(z => z[3]);
    const got = raw.slice(1).map(r => r[ci]);
    C.eq('OBBBA2 reopened: O&M Raw Data’s Counted marks a row left out by the report’s Budget Flex 02 exactly where the oracle does',
      got.map(w => w === 'No: ' + WHY2 + ', marked in the BAE report’s Budget Flex 02' ? 'obbbaReport' : w === 'No: ' + WHY2 ? 'obbba' : '-'),
      want.map(w => w === 'obbbaReport' || w === 'obbba' ? w : '-'));
    C.chk('OBBBA2 reopened: … and there are such rows', want.includes('obbbaReport'));
    const IR = colA('Import Report').map(r => r[0]).filter(v => typeof v === 'string');
    C.chk('OBBBA2 reopened: the Import Report sheet carries the section’s budgets and the list of OBBBA money outside O&M, as the screen does',
      BUD_LINES.every(l => IR.includes('    ' + l)) && IR.includes(ELSE_HEAD) && IR.includes('  ' + SP_LINE), J(IR.filter(l => /OBBBA|Initial Spares FY2025/.test(l))));
    C.chk('OBBBA2 reopened: the Summary sheet’s note and the Settings sheet’s rule', colA('Summary').some(r => r[0] === OB2_NOTE) && colA('Settings').some(r => r.includes(RULE)));
  }
  C.chk('OBBBA2 reopened: no script error and no dialog', !G2.errors.length && !G2.dialogs.length, G2.errors.concat(G2.dialogs).join(' | '));
} catch (e) {
  C.chk('the run reached its end', false, (e && e.stack) || String(e));
} finally {
  await browser.close();
  tmp.rm();
}
C.done();
