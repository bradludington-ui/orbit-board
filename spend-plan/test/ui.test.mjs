// The screens (CONTRACT §9), in Chromium: the page is opened from file:// as Brad opens it, the synthetic fixture is
// imported through the real file input, and every view is drawn, read and pressed.
//
// What it holds the page to:
//   - every view draws with no console error, no page error and no dialog;
//   - the figures on screen are the oracle's (test/fixture/oracle.py, which never reads the tool): the Summary to the
//     cent through each money cell's data-c, and turning USAF off lowers Approved by exactly what the oracle's
//     usaf-off scenario says;
//   - the tree opens and closes, row by row and by "Expand to", and opened all the way holds every node the oracle has;
//   - Data through redraws the page; a settings edit shows Unsaved changes, a switch does not;
//   - hostile names (a title holding <b>&"', plan events holding a closing script tag and an image tag) show as text:
//     no img element ever exists, no dialog opens;
//   - the keyboard reaches every control on a view and operates them, with the focus ring visible on each;
//   - at 1366x768 and 1920x1080 no view scrolls sideways, and the top bar stays on screen;
//   - a block of about 1,400 tree rows opens to CCaR quickly.
// Screenshots of every view at 1366x768 go to the scratchpad for the lead (outside the repository).
//
//   node spend-plan/test/ui.test.mjs              the real store when it provides its API, else the stand-in
//   UI_STANDIN=1 node spend-plan/test/ui.test.mjs  always the stand-in (test/ui-store-standin.js): the screens alone
import { chromium } from 'playwright-core';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CHROME } from '../../tools/chrome.mjs';
import { pageHtml, loadTool, scratchDir, checks } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const C = checks('ui');
const tmp = scratchDir('sfcbsp-ui-');
const SHOTS = process.env.UI_SHOTS
  || '/tmp/claude-0/-home-user/b811ed9c-8dc4-55a9-9818-6ddf3724fb6e/scratchpad/wb/shots/ui';
const NOW = '2026-11-09T12:00:00.000Z';
const VIEWS = ['summary', 'slides', 'om', 'ff', 'sp', 'opn', 'pmos', 'na', 'report', 'changes', 'settings'];
const HOSTILE = ['Ventral <b>&"\' Fairing Study', 'Close-out </script> review', '"><img src=x onerror=alert(1)>'];
const WORD = { green: 'On track', yellow: 'Within 10', red: 'Behind' };
const pct = x => (x === null ? '' : (Math.round(x * 10000) / 100).toFixed(2) + '%');   // the oracle's goals are typed to 4 places
const byKey = o => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));   // key order means nothing here

// ------------------------------------------------------------------------------------------------- the fixture
function py(args) {
  const r = spawnSync('python3', ['-I', ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error('python3 ' + args[0] + ' failed: ' + r.stderr.slice(-800));
  return r;
}
const FX = join(tmp.dir, 'fx');
mkdirSync(FX);
py([join(HERE, 'fixture', 'make_fixture.py'), '--out', FX]);
const oracle = sc => { const out = join(tmp.dir, sc + '.json'); py([join(HERE, 'fixture', 'oracle.py'), '--scenario', sc, '--fixture', FX, '--out', out]); return JSON.parse(readFileSync(out, 'utf8')); };
const O = { all: oracle('all'), usafOff: oracle('usaf-off'), asof: oracle('asof-2026-03') };

// --------------------------------------------------------------------- which modules: the real ones that load
// A module another builder is still writing may not load yet. Each optional one is loaded on its own first; one that
// reports a script error is left out and named, so this suite tests the screens rather than a half-written file.
const BASE = ['util', 'xlsx-read', 'import', 'engine'];
const used = BASE.slice(), notes = [];
for (const m of ['xlsx-write', 'export', 'pictures', 'store']) {
  let t;
  try { t = loadTool({ modules: used.concat([m]) }); } catch (e) { notes.push(m + ' not loaded: ' + e.message); continue; }
  if (t.errors.length) notes.push(m + ' left out: it reports ' + t.errors[0]);
  else used.push(m);
  t.close();
}
const probe = loadTool({ modules: used });
const API = ['storeInit', 'getView', 'setView', 'applyImport', 'setSettings', 'isDirty', 'onStateChange', 'saveFile', 'saveCopy',
  'exportExcel', 'copyBlockPicture', 'blockPng', 'allPicturesZip'];
const have = Object.fromEntries(API.map(n => [n, typeof probe.SP[n] === 'function']));
probe.close();
const STANDIN = !!process.env.UI_STANDIN || !(have.storeInit && have.applyImport && have.setSettings && have.getView);
if (STANDIN) { const i = used.indexOf('store'); if (i >= 0) used.splice(i, 1); for (const n of API.slice(0, 9)) have[n] = true; }
// UI_STUBS=1: stand-ins for the export and picture calls not yet written (test/ui-api-standin.js), to prove the
// screens' handling of their results; without it a missing call must say "not available yet"
const STUBS = !!process.env.UI_STUBS && API.slice(9).some(n => !have[n]);
const stubbed = STUBS ? API.slice(9).filter(n => !have[n]) : [];
stubbed.forEach(n => { have[n] = true; });
console.log('ui: modules ' + used.join(', ') + ', ui' + (STANDIN ? ' + the TEST STAND-IN store (test/ui-store-standin.js)' : ' (the real store)')
  + (stubbed.length ? ' + TEST STAND-INS for ' + stubbed.join(', ') + ' (test/ui-api-standin.js)' : ''));
notes.forEach(n => console.log('ui: note: ' + n));
const missing = API.filter(n => !have[n]);
if (missing.length) console.log('ui: not written yet, so those controls must say "not available yet": ' + missing.join(', '));

function page(state) {
  let html = pageHtml({ modules: used.concat(['ui']), state });
  const inject = (STANDIN ? [readFileSync(join(HERE, 'ui-store-standin.js'), 'utf8')] : [])
    .concat(STUBS ? [readFileSync(join(HERE, 'ui-api-standin.js'), 'utf8')] : []);
  if (inject.length) html = html.replace('</body>', () => inject.map(s => '<script>\n' + s + '\n<\/script>\n').join('') + '</body>');
  const f = join(tmp.dir, 'page-' + Math.random().toString(36).slice(2) + '.html');
  writeFileSync(f, html);
  return pathToFileURL(f).href;
}

// a saved state, as the store writes it (§11), made from the fixture by the tool's own import in jsdom
async function savedState(pulls, extra = {}) {
  const t = loadTool({ modules: BASE });
  const b = readFileSync(join(FX, 'pull-all.xlsx'));
  const parsed = await t.SP.parseFiles([{ name: 'pull-all.xlsx', data: b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) }], { now: NOW });
  const st = JSON.parse(JSON.stringify({ v: 1, tool: 'sfcb-spend-plan', savedAt: '2026-11-09T12:30:00.000Z',
    settings: t.SP.defaultSettings('2026-11-09'), pulls: { current: pulls || parsed.pulls, previous: {} },
    history: [{ importedAt: NOW, aps: ['om', 'ff', 'sp', 'opn'], totals: {} }], lastImport: { report: parsed.report } }));
  t.close();
  return Object.assign(st, extra);
}

// ----------------------------------------------------------------------------------------------- the browser
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
const watch = [];
// a step that throws (a wait that runs out, a selector that is gone) is a FAILING CHECK naming where it stopped, with
// every check before it reported: a crash that only says "TimeoutError" tells nobody which promise the page broke
try {
async function open(url) {
  const p = await ctx.newPage();
  const w = { p, errors: [], dialogs: [], downloads: [] };
  p.on('pageerror', e => w.errors.push('page error: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') w.errors.push('console error: ' + m.text()); });
  p.on('dialog', d => { w.dialogs.push(d.type() + ': ' + d.message()); d.dismiss().catch(() => {}); });
  p.on('download', d => w.downloads.push(d));
  watch.push(w);
  await p.goto(url);
  await p.waitForSelector('#uiMain');
  return w;
}
const text = (p, sel) => p.$eval(sel, e => e.textContent).catch(() => null);
// a redraw after a typed box is left waits a task (90-ui.js ui_schedule); a check waits for it rather than racing it
const until = (p, fn, arg) => p.waitForFunction(fn, arg, { timeout: 5000 }).then(() => true, () => false);
const cents = (p, sel) => p.$eval(sel, e => Number(e.getAttribute('data-c'))).catch(() => NaN);
const view = async (p, v) => { await p.click('[data-act=view][data-v="' + v + '"]'); };
const noImg = async (w, where) => C.chk('no img element (' + where + ')', (await w.p.$$eval('img', l => l.length)) === 0);
async function clean(w, where) {
  C.chk('no error: ' + where, !w.errors.length, w.errors.join(' | '));
  C.chk('no dialog: ' + where, !w.dialogs.length, w.dialogs.join(' | '));
  w.errors.length = 0; w.dialogs.length = 0;
}
// the page scrolls only up and down, and after scrolling to the bottom the top bar is still on screen
async function fits(p, where) {
  const r = await p.evaluate(() => {
    const d = document.documentElement;
    window.scrollTo(0, d.scrollHeight);
    const bar = document.querySelector('.bar1').getBoundingClientRect();
    const cui = document.querySelector('.cui-top').getBoundingClientRect();
    const cuiB = document.querySelector('.cui-bottom').getBoundingClientRect();
    const out = { sw: d.scrollWidth, cw: d.clientWidth, top: bar.top, bottom: bar.bottom, h: innerHeight, cuiTop: cui.top, cuiB: cuiB.bottom };
    window.scrollTo(0, 0);
    return out;
  });
  C.chk('no sideways scroll: ' + where, r.sw <= r.cw, 'scrollWidth ' + r.sw + ' > clientWidth ' + r.cw);
  C.chk('top bar on screen after scrolling down: ' + where, r.top >= 0 && r.bottom <= r.h && r.top < 60, JSON.stringify(r));
  // the bottom line ends at the window's bottom, to within the fraction of a pixel a scrolled page can sit at
  C.chk('both CUI lines on screen: ' + where, r.cuiTop >= 0 && r.cuiB <= r.h + 0.5 && r.cuiB >= r.h - 2, JSON.stringify(r));
}

// ================================================================================== A. a fresh page, imported
const A = await open(page(null));
const P = A.p;
C.chk('the page title', (await P.title()) === 'SFCB Spend Plan');
C.chk('no data yet: the one panel says what to import', /No data yet/.test(await text(P, '#uiMain'))
  && /one file per appropriation, or one file holding all four/.test(await text(P, '#uiMain')));
C.chk('no data yet: no views and no switches', (await P.$$('[data-act=view]')).length === 0 && (await P.$$('[data-act=svc]')).length === 0);
await clean(A, 'boot');
mkdirSync(SHOTS, { recursive: true });
await P.screenshot({ path: join(SHOTS, '00-no-data.png') });

// a first import with no usable sheet is refused; the no-data page keeps saying what to do, and why it was refused
writeFileSync(join(tmp.dir, 'notes.csv'), 'Owner,Remark\nNobody,"not a pull"\n');
await P.setInputFiles('#uiFile', join(tmp.dir, 'notes.csv'));
await until(P, () => document.querySelector('#uiMsg').classList.contains('msg-err'));
C.chk('a refused first import: the reason is in the message line', /notes\.csv/.test(await text(P, '#uiMsg')), await text(P, '#uiMsg'));
C.chk('a refused first import: the no-data page names it, and nothing was imported', /The last import was refused/.test(await text(P, '#uiMain'))
  && /No data yet/.test(await text(P, '#uiMain')) && (await P.$$('[data-act=view]')).length === 0);
await clean(A, 'a refused first import');

// Import through the real file input
await P.setInputFiles('#uiFile', join(FX, 'pull-all.xlsx'));
await P.waitForSelector('[data-act=view][data-v=summary]', { timeout: 20000 });
await P.waitForFunction(() => !document.querySelector('#uiMsg').textContent.startsWith('Reading'));
C.chk('import: the message line says what was imported', /\S/.test(await text(P, '#uiMsg')) && !(await P.$('.msg-err')), await text(P, '#uiMsg'));
C.chk('import: Unsaved changes', (await text(P, '#uiSave')) === 'Unsaved changes', await text(P, '#uiSave'));
C.chk('import: the four pull dates are shown', /O&M pulled .*Full Fund pulled .*Initial Spares pulled .*OPN pulled/.test(await text(P, '#uiPulls')), await text(P, '#uiPulls'));
// the as-of month an import picks is the last full month before today; the oracle's is 2026-10, so it is set to that
await P.fill('#uiAsOf', '2026-10');
await P.waitForFunction(() => document.querySelector('#uiEy').textContent === 'FY2027');
await clean(A, 'import');

// ------------------------------------------------------------------------ the Summary against the oracle
async function summaryMatches(E, label) {
  for (const [k, b] of Object.entries(E.blocks)) {
    const row = 'tr[data-bk="' + k + '"]';
    const got = await P.$$eval(row + ' td.n[data-c]', l => l.map(e => Number(e.getAttribute('data-c'))));
    C.eq(label + ' ' + k + ': approved, authorized, obligated, unobligated', got.slice(0, 4), [b.approved, b.authorized, b.obligated, b.approved - b.obligated]);
    const st = await P.$eval(row + ' td.st', e => e.textContent).catch(() => null);
    C.chk(label + ' ' + k + ': status word', st === (b.status ? WORD[b.status] : ''), st + ' vs ' + b.status);
    const cellsTxt = await P.$$eval(row + ' td.n', l => l.map(e => e.textContent));
    C.chk(label + ' ' + k + ': OSD goal %', cellsTxt[5] === pct(b.goal), cellsTxt[5] + ' vs ' + pct(b.goal));
  }
  const t = await P.$$eval('tr[data-bk=total] td.n[data-c]', l => l.map(e => Number(e.getAttribute('data-c'))));
  C.eq(label + ' TOTAL: approved, authorized, obligated, unobligated', t, [E.summary.approved, E.summary.authorized, E.summary.obligated, E.summary.approved - E.summary.obligated]);
}
await view(P, 'summary');
await summaryMatches(O.all, 'summary (all)');
C.chk('summary title: FY27Q1', /Top-Line Snapshot \(FY27Q1\)/.test(await text(P, 'h2.title')), await text(P, 'h2.title'));
C.chk('summary: the legend gives each colour its word', /On track[\s\S]*Within 10[\s\S]*Behind/.test(await text(P, 'table.legend')));
C.chk('summary: † marks Authorized not entered', (await P.$$('tr[data-bk] .dag')).length === Object.keys(O.all.blocks).length);

// ------------------------------------------------------------------------------ every view, both window sizes
for (const v of VIEWS) {
  await view(P, v);
  const pressed = await P.$eval('[data-act=view][data-v="' + v + '"]', e => e.getAttribute('aria-pressed'));
  C.chk('view ' + v + ': its button is pressed', pressed === 'true');
  const main = await text(P, '#uiMain');
  C.chk('view ' + v + ': draws', main && main.length > 40, main && main.slice(0, 80));
  C.chk('view ' + v + ': no error drawn', (await P.$$('#uiMain .err')).length === 0, await text(P, '#uiMain .err'));
  await noImg(A, 'view ' + v);
  await fits(P, v + ' at 1366x768');
  await P.screenshot({ path: join(SHOTS, String(VIEWS.indexOf(v) + 1).padStart(2, '0') + '-' + v + '.png') });
  await clean(A, 'view ' + v);
}
await P.setViewportSize({ width: 1920, height: 1080 });
for (const v of VIEWS) { await view(P, v); await fits(P, v + ' at 1920x1080'); }
await P.click('[data-act=help]');
C.chk('help: the guide is drawn and its button pressed', /Where this differs from v12/.test(await text(P, '#uiMain'))
  && (await P.$eval('#uiHelp', e => e.getAttribute('aria-pressed'))) === 'true');
await fits(P, 'help at 1920x1080');
await P.setViewportSize({ width: 1366, height: 768 });
await fits(P, 'help at 1366x768');
await P.screenshot({ path: join(SHOTS, '12-help.png') });
await P.click('[data-act=help]');
C.chk('help: pressed again, back to the view it came from', (await P.$eval('[data-act=view][data-v=settings]', e => e.getAttribute('aria-pressed'))) === 'true');
await clean(A, 'window sizes');

// --------------------------------------------------------------------------------------------- the switches
await view(P, 'summary');
const before = await cents(P, 'tr[data-bk=total] td.n');
await P.click('[data-act=svc][data-i="0"]');      // USAF
C.chk('USAF off: the switch line says what is shown', await until(P, () => /Services shown/.test(document.querySelector('.shownline').textContent)));
const after = await cents(P, 'tr[data-bk=total] td.n');
C.chk('USAF off: Summary Approved falls by exactly what the oracle says', before - after === O.all.summary.approved - O.usafOff.summary.approved,
  'fell ' + (before - after) + ', oracle ' + (O.all.summary.approved - O.usafOff.summary.approved));
await summaryMatches(O.usafOff, 'summary (usaf-off)');
C.chk('USAF off: the Summary says what it shows', /Services shown: USAF ANG/.test(await text(P, '.l3')), await text(P, '.l3'));
for (const v of VIEWS) {
  await view(P, v);
  C.chk('USAF off: view ' + v + ' says what it shows', /Services shown:/.test(await text(P, '#uiMain')));
}
await view(P, 'summary');
await P.click('[data-act=svc][data-i="0"]');
C.chk('USAF back on: the switch line says all', await until(P, () => /All services, both lanes/.test(document.querySelector('.shownline').textContent)));
C.chk('USAF back on: Approved is back', (await cents(P, 'tr[data-bk=total] td.n')) === O.all.summary.approved);
await P.click('[data-act=lane][data-l=disc]');
C.chk('Discretionary off: Approved changes', (await cents(P, 'tr[data-bk=total] td.n')) !== O.all.summary.approved);
await P.click('[data-act=lane][data-l=disc]');
C.chk('Discretionary back on', (await cents(P, 'tr[data-bk=total] td.n')) === O.all.summary.approved);
const unkRows = Object.values(O.all.crossChecks.bySvc).some(m => Object.prototype.hasOwnProperty.call(m, 'Service not identified'));
C.chk('a seventh switch, Service not identified, exactly when such rows exist', (await P.$$('[data-act=svc]')).length === (unkRows ? 7 : 6),
  (await P.$$('[data-act=svc]')).length + ' switches; rows with no service: ' + unkRows);
await clean(A, 'switches');

// ----------------------------------------------------------------------------------- the tree: open and close
await view(P, 'om');
const omKeys = Object.keys(O.all.blocks).filter(k => k.startsWith('om|'));
const treeRows = () => P.$$eval('#uiMain section.blk-sec:first-of-type table.tree tbody tr[class^=lv]', l => l.length);
const n0 = await treeRows();
const tg = await P.$('#uiMain section.blk-sec:first-of-type button.tg');
C.chk('tree: opens at PMO and Title (the first PMO is open)', (await tg.getAttribute('aria-expanded')) === 'true');
await tg.click();
const tg1 = await P.$('#uiMain section.blk-sec:first-of-type button.tg');
const n1 = await treeRows();
C.chk('tree: closing a PMO hides its titles', n1 < n0 && (await tg1.getAttribute('aria-expanded')) === 'false', n0 + ' -> ' + n1);
C.chk('tree: the keyboard stays on the row just closed', await P.evaluate(() => document.activeElement && document.activeElement.classList.contains('tg')
  && document.activeElement.getAttribute('aria-expanded') === 'false'));
await tg1.click();
C.chk('tree: opening it again shows them again', (await treeRows()) === n0);
// open to CCaR: every node the oracle has, and every PMO row's total is the oracle's
await P.selectOption('#uiMain section.blk-sec:first-of-type select[data-act=lvl]', '4');
const k0 = omKeys[0], E0 = O.all.blocks[k0];
const want = Object.keys(E0.pmos).length + Object.keys(E0.titles).length + Object.keys(E0.pes).length + Object.keys(E0.ccars).length;
C.chk('tree: Expand to CCaR draws every node of ' + k0, (await treeRows()) === want, (await treeRows()) + ' rows, oracle ' + want);
const pmoTot = await P.$$eval('#uiMain section.blk-sec:first-of-type table.tree tbody tr.lv1', l => l.map(r => [r.querySelector('th').textContent.replace(/^[▸▾]/, ''), Number(r.querySelector('td.n').getAttribute('data-c'))]));
C.eq('tree: each PMO row total is the oracle\'s', byKey(Object.fromEntries(pmoTot)), byKey(Object.fromEntries(Object.entries(E0.pmos).map(([l, x]) => [l, x.total]))));
const ccarLabels = await P.$$eval('#uiMain section.blk-sec:first-of-type table.tree tbody tr.lv4 th', l => l.map(e => e.textContent));
const wantCc = Object.keys(E0.ccars).map(k => k.split('|')[3]);
C.chk('tree: the CCaR rows show their numbers', wantCc.every(c => ccarLabels.includes(c)), JSON.stringify(wantCc.filter(c => !ccarLabels.includes(c)).slice(0, 5)));
await P.selectOption('#uiMain section.blk-sec:first-of-type select[data-act=lvl]', '1');
C.chk('tree: Expand to PMO shows only the PMO rows', (await treeRows()) === Object.keys(E0.pmos).length);
// every O&M block opened to Plan Event: the hostile title and plan event read as text
for (let i = 0; i < omKeys.length; i++) await P.selectOption('#uiMain section.blk-sec >> nth=' + i + ' >> select[data-act=lvl]', '3');
const omText = await text(P, '#uiMain');
C.chk('hostile: the title holding <b>&"\' reads as text', omText.includes(HOSTILE[0]));
C.chk('hostile: the plan event holding a closing script tag reads as text', omText.includes(HOSTILE[1]));
C.chk('hostile: no b element was made from a title', (await P.$$('#uiMain b')).length === 0);
await noImg(A, 'O&M opened to Plan Event');
await view(P, 'na');
C.chk('hostile: the image-tag plan event reads as text in Not Allocated', (await text(P, '#uiMain')).includes(HOSTILE[2]));
await noImg(A, 'Not Allocated');
await view(P, 'slides');
C.chk('hostile: and on the slide blocks', (await text(P, '#uiMain')).includes(HOSTILE[2]) && (await text(P, '#uiMain')).includes(HOSTILE[1]));
await noImg(A, 'Slide blocks');
await clean(A, 'tree and hostile names');

// ------------------------------------------------------------------- Not Allocated filters, PMO picker, Settings
await view(P, 'na');
const naAll = await P.$$eval('#uiMain table.na tbody tr', l => l.length);
await P.selectOption('select[data-act=naf][data-f=ap]', 'ff');
const naFf = await P.$$eval('#uiMain table.na tbody tr td:first-child', l => l.map(e => e.textContent));
C.chk('Not Allocated: the appropriation filter keeps only Full Fund', naFf.length > 0 && naFf.length < naAll && naFf.every(t => t === 'Full Fund'), naFf.length + ' of ' + naAll);
await P.click('[data-act=naclear]');
C.chk('Not Allocated: Clear filters', (await P.$$eval('#uiMain table.na tbody tr', l => l.length)) === naAll);
await view(P, 'pmos');
const opts = await P.$$eval('select[data-act=pmo] option', l => l.map(o => o.textContent));
C.chk('PMOs: the picker lists every PMO the oracle has', Object.keys(O.all.pmoTabs).every(l => opts.includes(l)), JSON.stringify(opts));
await P.selectOption('select[data-act=pmo]', String(opts.length - 1));
C.chk('PMOs: picking another redraws its tab', (await text(P, 'h2.title')).includes(opts[opts.length - 1]));
const pTabs = O.all.pmoTabs[opts[opts.length - 1]];
const pRows = await P.$$eval('#uiMain table.top tbody tr[data-bk]:not([data-bk=total])', l => l.map(r => [r.getAttribute('data-bk'), Number(r.querySelector('td.n').getAttribute('data-c'))]));
C.eq('PMOs: each row\'s Approved is the oracle\'s', byKey(Object.fromEntries(pRows)), byKey(Object.fromEntries(Object.entries(pTabs).map(([k, x]) => [k, x.approved]))));
await clean(A, 'filters and picker');

// ------------------------------------------------------------------------------------ Data through redraws
await P.fill('#uiAsOf', '2026-03');
C.chk('Data through 2026-03: the execution year is FY2026', await until(P, () => document.querySelector('#uiEy').textContent === 'FY2026'));
await view(P, 'summary');
C.chk('Data through 2026-03: the Summary is FY26Q2', /\(FY26Q2\)/.test(await text(P, 'h2.title')), await text(P, 'h2.title'));
await summaryMatches(O.asof, 'summary (asof-2026-03)');
await P.fill('#uiAsOf', '2026-10');
C.chk('Data through 2026-10: back to FY2027', await until(P, () => document.querySelector('#uiEy').textContent === 'FY2027'));
await P.fill('#uiFirst', '2026');
await P.press('#uiFirst', 'Tab');
await until(P, () => !document.querySelector('tr[data-bk="om|2025"]'));
C.chk('First FY 2026: FY2025 blocks leave the Summary', !(await P.$('tr[data-bk="om|2025"]')) && !!(await P.$('tr[data-bk="om|2026"]')));
await P.fill('#uiFirst', '2025');
await P.press('#uiFirst', 'Tab');
C.chk('First FY 2025: FY2025 blocks come back', await until(P, () => !!document.querySelector('tr[data-bk="om|2025"]')));
await P.fill('#uiFirst', '1066');
await P.press('#uiFirst', 'Tab');
C.chk('First FY 1066 is refused with a reason', /First FY must be a year/.test(await text(P, '#uiMsg')) && (await P.inputValue('#uiFirst')) === '2025');
await clean(A, 'data through');

// ------------------------------------------------------------- the controls other builders' code sits behind
// download: the control must hand the browser a file. The download event is awaited, never sampled after the message:
// a check that looks for a download that has not arrived yet would quietly skip, and pass.
async function pressed(sel, label, fn, download) {
  if (!have[fn]) {
    await P.click(sel);
    C.chk(label + ': says "not available yet" while SP.' + fn + ' is missing', /not available yet/.test(await text(P, '#uiMsg')), await text(P, '#uiMsg'));
    return null;
  }
  const dl = download ? P.waitForEvent('download', { timeout: 60000 }).catch(() => null) : null;
  await P.click(sel);
  await until(P, () => { const t = document.querySelector('#uiMsg').textContent; return t && !/…$/.test(t); });
  C.chk(label + ': says what it did', /\S/.test(await text(P, '#uiMsg')) && !/…$/.test(await text(P, '#uiMsg')), await text(P, '#uiMsg'));
  if (!download) return null;
  const d = await dl;
  C.chk(label + ': the browser is handed a file', !!d, await text(P, '#uiMsg'));
  return d;
}
await view(P, 'summary');
const xl = await pressed('[data-act=export]', 'Export Excel', 'exportExcel', true);
if (xl) C.chk('Export Excel: a .xlsx named for the plan', /^SFCB Spend Plan FY2027 - data through Oct-2026 - \d{4}-\d{2}-\d{2}\.xlsx$/.test(xl.suggestedFilename()), xl.suggestedFilename());
await view(P, 'slides');
const png = await pressed('[data-act=savepic][data-b="0"]', 'Save picture', 'blockPng', true);
if (png) {
  const f = join(tmp.dir, 'pic.png'); await png.saveAs(f);
  C.chk('Save picture: a PNG named for its block', /^O&M FY\d{4}\.png$/.test(png.suggestedFilename()) && readFileSync(f).subarray(1, 4).toString() === 'PNG', png.suggestedFilename());
}
const zip = await pressed('[data-act=zip]', 'Save all pictures', 'allPicturesZip', true);
if (zip) { const f = join(tmp.dir, 'pics.zip'); await zip.saveAs(f); C.chk('Save all pictures: a zip', readFileSync(f).subarray(0, 2).toString() === 'PK'); }
await pressed('[data-act=copypic][data-b="0"]', 'Copy picture', 'copyBlockPicture');
if (STANDIN) {
  await pressed('[data-act=save]', 'Save', 'saveFile');
  C.chk('Save: Saved', (await text(P, '#uiSave')) === 'Saved');
}
await noImg(A, 'after the pictures');
await clean(A, 'export, pictures and save');

// ------------------------------------------------------------------------------------------------ the keyboard
// Tab from the top of the page; every visible control must be reached, with a visible focus ring on each
async function tabWalk(label) {
  const n = await P.evaluate(() => {
    const vis = e => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
    window.__ctl = [...document.querySelectorAll('button, input, select, textarea, a[href]')].filter(e => !e.disabled && vis(e) && e.tabIndex >= 0);
    window.scrollTo(0, 0);
    return window.__ctl.length;
  });
  await P.mouse.click(5, 5);    // the CUI line: nothing focusable, so Tab starts from the top
  const seen = new Set(); const noRing = [];
  // A month box takes two Tab stops (month, then year) on ONE element, so "back at the first control" means arriving
  // there from somewhere else, after the walk has left it; staying on it is not a lap.
  let first = null, prev = null, left = false;
  for (let i = 0; i < 2 * n + 60; i++) {
    await P.keyboard.press('Tab');
    const r = await P.evaluate(() => {
      const a = document.activeElement, cs = getComputedStyle(a);
      return { i: window.__ctl.indexOf(a), ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 && cs.outlineColor !== 'rgba(0, 0, 0, 0)', tag: a.tagName, key: a.getAttribute('data-fkey') };
    });
    if (r.i !== first && first !== null) left = true;
    if (r.i === first && left && prev !== first) break;
    prev = r.i;
    if (r.i < 0) continue;
    if (first === null) first = r.i;
    seen.add(r.i);
    if (!r.ring) noRing.push(r.key || r.tag);
  }
  const lost = await P.evaluate(s => window.__ctl.map((e, i) => s.includes(i) ? null : (e.getAttribute('data-fkey') || e.outerHTML.slice(0, 60))).filter(Boolean), [...seen]);
  C.chk('keyboard: Tab reaches every control on ' + label + ' (' + n + ')', !lost.length, lost.length + ' missed: ' + lost.slice(0, 6).join(', '));
  C.chk('keyboard: the focus ring is visible on every control on ' + label, !noRing.length, noRing.slice(0, 6).join(', '));
}
for (const v of ['summary', 'om', 'slides', 'pmos', 'na', 'settings', 'changes']) { await view(P, v); await tabWalk(v); }
// and operates them
await P.focus('[data-act=view][data-v=settings]'); await P.keyboard.press('Enter');
C.chk('keyboard: Enter on a view button opens it', (await P.$eval('[data-act=view][data-v=settings]', e => e.getAttribute('aria-pressed'))) === 'true');
await P.focus('[data-act=view][data-v=summary]'); await P.keyboard.press('Space');
C.chk('keyboard: Space on a view button opens it, and keeps the keyboard there', (await P.$eval('[data-act=view][data-v=summary]', e => e.getAttribute('aria-pressed'))) === 'true'
  && await P.evaluate(() => document.activeElement.getAttribute('data-fkey') === 'view:summary'));
await P.focus('[data-act=svc][data-i="0"]'); await P.keyboard.press('Space');
C.chk('keyboard: Space on the USAF switch turns it off', (await cents(P, 'tr[data-bk=total] td.n')) === O.usafOff.summary.approved
  && await P.evaluate(() => document.activeElement.getAttribute('data-fkey') === 'svc:0'));
await P.keyboard.press('Space');
C.chk('keyboard: and on again', (await cents(P, 'tr[data-bk=total] td.n')) === O.all.summary.approved);
await view(P, 'om');
await P.selectOption('#uiMain section.blk-sec:first-of-type select[data-act=lvl]', '2');
await P.focus('#uiMain section.blk-sec:first-of-type button.tg');
await P.keyboard.press('Enter');
C.chk('keyboard: Enter closes a tree row, and the keyboard stays on it', await P.evaluate(() => document.activeElement.classList.contains('tg') && document.activeElement.getAttribute('aria-expanded') === 'false'));
await P.keyboard.press('Space');
C.chk('keyboard: Space opens it again', await P.evaluate(() => document.activeElement.getAttribute('aria-expanded') === 'true'));
await P.focus('#uiMain section.blk-sec:first-of-type select[data-act=lvl]');
await P.keyboard.press('ArrowDown');
C.chk('keyboard: an arrow key on Expand to opens to Plan Event', (await P.$eval('#uiMain section.blk-sec:first-of-type select[data-act=lvl]', e => e.value)) === '3'
  && (await P.$$('#uiMain section.blk-sec:first-of-type tr.lv3')).length > 0);
await P.focus('#uiHelp'); await P.keyboard.press('Enter');
C.chk('keyboard: Enter on Help opens the guide', /Where this differs from v12/.test(await text(P, '#uiMain')));
await P.keyboard.press('Enter');
await clean(A, 'keyboard');

// ------------------------------------- the rows no appropriation claims are each named in the Import report (review XP-8)
{
  await view(P, 'report');
  const rt = await text(P, '#uiMain');
  const man = JSON.parse(readFileSync(join(FX, 'manifest.json'), 'utf8'));
  const unid = man.gen1.filter(i => i.ap === null);
  const miss = unid.filter(u => !['“' + u.ccar + '”', '“' + u.title + '”', '“' + u.budget + '”', '“' + u.pe + '”', 'FY' + u.fy].every(w => rt.includes(w)));
  C.chk('the Import report names every row whose appropriation is not identified', unid.length === 2 && !miss.length,
    miss.map(u => u.id).join(', ') + ' not named');
}

// -------------------------------------------------------------- a refused import changes nothing, and says why
await view(P, 'summary');
const tot0 = await cents(P, 'tr[data-bk=total] td.n');
await P.setInputFiles('#uiFile', [join(FX, 'pull-all.xlsx'), join(FX, 'pull-all.xlsx')]);
await until(P, () => document.querySelector('#uiMsg').classList.contains('msg-err'));
C.chk('a refused import: the message line gives the reason', /twice/.test(await text(P, '#uiMsg')), await text(P, '#uiMsg'));
C.chk('a refused import changes nothing', (await cents(P, 'tr[data-bk=total] td.n')) === tot0);
await view(P, 'report');
C.chk('a refused import is named in the Import report', /The last import was refused, so nothing changed/.test(await text(P, '#uiMain')));
await clean(A, 'a refused import');

// ------------------------------------------------------------------ a second pull: What changed, against the oracle
const G = oracle('gen2');
await P.setInputFiles('#uiFile', [join(FX, 'gen2', 'pull-om.xlsx'), join(FX, 'gen2', 'pull-ff.csv')]);
// the gen2 fixture carries rows that count nowhere (an unreadable Amount, rows no appropriation claims), so its import is
// a warning, not a plain success (review F4, DL-2): wait for the import's own words, then hold its class
C.chk('gen2: the import lands, and its message names the rows that count nowhere as a warning',
  await until(P, () => /^Imported O&M/.test(document.querySelector('#uiMsg').textContent)
    && document.querySelector('#uiMsg').classList.contains('msg-warn') && /counted nowhere/.test(document.querySelector('#uiMsg').textContent)),
  await text(P, '#uiMsg'));
await P.fill('#uiAsOf', '2026-10');
await view(P, 'summary');
await summaryMatches(G, 'summary (gen2)');
C.chk('gen2: the refusal is forgotten once an import lands', !(await view(P, 'report')) && !/The last import was refused/.test(await text(P, '#uiMain')));
await view(P, 'changes');
for (const [ap, d] of Object.entries(G.diff)) {
  const S = 'section.chg[data-ap="' + ap + '"]';
  C.chk('What changed: a section for ' + ap, !!(await P.$(S)));
  for (const [k, x] of Object.entries(d.byBlock)) {
    const got = await P.$$eval(S + ' tr[data-bk="' + k + '"] td.n', l => l.map(e => Number(e.getAttribute('data-c'))));
    C.eq('What changed ' + k + ': approved and obligated, before, after, change', got,
      [x.approved[0], x.approved[1], x.approved[1] - x.approved[0], x.obligated[0], x.obligated[1], x.obligated[1] - x.obligated[0]]);
  }
  for (const [list, want] of [['new', d.ccarsNew.length], ['gone', d.ccarsGone.length], ['moves', d.pmoMoves.length]]) {
    const n = await P.$eval(S + ' [data-list="' + list + '"]', e => Number(e.getAttribute('data-n'))).catch(() => NaN);
    C.chk('What changed ' + ap + ': CCaRs ' + list + ' (' + want + ')', n === want, 'got ' + n);
  }
}
const firstAp = Object.keys(G.diff)[0];
const showBtn = 'section.chg[data-ap="' + firstAp + '"] button[data-act=diff]:not([disabled])';
const nLeaves = Number(((await text(P, showBtn)) || '').replace(/[^0-9]+/g, ' ').trim().split(' ')[0]);
await P.click(showBtn);
const leafTable = await P.$$eval('section.chg[data-ap="' + firstAp + '"] table[data-leaves] tbody tr', l => l.length);
C.chk('What changed: Show draws the leaf list, and every leaf it counted', leafTable === nLeaves && nLeaves > 0
  && (await P.$eval(showBtn, e => e.getAttribute('aria-expanded'))) === 'true', leafTable + ' rows, button said ' + nLeaves);
await P.click(showBtn);
C.chk('What changed: Hide takes it away', (await P.$$('section.chg[data-ap="' + firstAp + '"] table[data-leaves]')).length === 0);
await tabWalk('changes after a second pull');
await fits(P, 'changes after a second pull at 1366x768');
await P.screenshot({ path: join(SHOTS, '13-changes-gen2.png') });
await clean(A, 'a second pull');

// ================================================================== B. a saved file: Saved, until a setting moves
const B = await open(page(await savedState()));
const Q = B.p;
await Q.waitForSelector('tr[data-bk=total]');
C.chk('saved file: opens Saved', (await text(Q, '#uiSave')) === 'Saved', await text(Q, '#uiSave'));
C.chk('saved file: the Summary is the oracle\'s', (await cents(Q, 'tr[data-bk=total] td.n')) === O.all.summary.approved);
await Q.click('[data-act=svc][data-i="0"]');
C.chk('saved file: a switch does not make the file unsaved', (await text(Q, '#uiSave')) === 'Saved' && (await cents(Q, 'tr[data-bk=total] td.n')) === O.usafOff.summary.approved);
await Q.click('[data-act=svc][data-i="0"]');
await Q.click('[data-act=view][data-v=settings]');
await Q.fill('input[data-act=auth][data-i="0"]', '1,234.567891');
await Q.press('input[data-act=auth][data-i="0"]', 'Tab');
await until(Q, () => document.querySelector('#uiSave').textContent === 'Unsaved changes');
C.chk('saved file: an Authorized typed in Settings shows Unsaved changes', (await text(Q, '#uiSave')) === 'Unsaved changes', await text(Q, '#uiSave'));
C.chk('saved file: the keyboard moved on to the next box', await Q.evaluate(() => document.activeElement.getAttribute('data-fkey') === 'auth:1'));
await Q.click('[data-act=view][data-v=summary]');
const k1 = Object.keys(O.all.blocks)[0];
C.chk('Authorized $M is read to the cent, and its † goes', (await cents(Q, 'tr[data-bk="' + k1 + '"] td.n >> nth=1')) === 123456789100
  && !(await Q.$('tr[data-bk="' + k1 + '"] .dag')));
await Q.click('[data-act=view][data-v=settings]');
await Q.fill('input[data-act=auth][data-i="0"]', 'twelve');
await Q.press('input[data-act=auth][data-i="0"]', 'Tab');
C.chk('Authorized: words are refused with a reason', /not an amount/.test(await text(Q, '#uiMsg')) && (await Q.inputValue('input[data-act=auth][data-i="0"]')) === '1,234.567891');
await Q.fill('input[data-act=auth][data-i="0"]', '');
await Q.press('input[data-act=auth][data-i="0"]', 'Tab');
await Q.click('[data-act=view][data-v=summary]');
C.chk('Authorized: a blank box clears it', !!(await Q.$('tr[data-bk="' + k1 + '"] .dag')));
// a goal edit moves a status; Reset puts v12's back
await Q.click('[data-act=view][data-v=settings]');
await Q.fill('input[data-act=goal][data-curve=om1][data-i="1"]', '99');
await Q.press('input[data-act=goal][data-curve=om1][data-i="1"]', 'Tab');
C.chk('a goal typed as 99 is kept as 99', (await Q.inputValue('input[data-act=goal][data-curve=om1][data-i="1"]')) === '99');
await Q.fill('input[data-act=goal][data-curve=om1][data-i="1"]', '150');
await Q.press('input[data-act=goal][data-curve=om1][data-i="1"]', 'Tab');
C.chk('a goal over 100 is refused with a reason', /percentage from 0 to 100/.test(await text(Q, '#uiMsg')));
await Q.click('[data-act=goalreset]');
C.chk('Reset to v12\'s curves', (await Q.inputValue('input[data-act=goal][data-curve=om1][data-i="1"]')) === '8.33');
// a special CCaR, a budget override
await Q.fill('#uiSpecNew', 'JSF9402');
await Q.press('#uiSpecNew', 'Enter');
C.chk('a special CCaR is added with Enter', (await text(Q, '.speclist')).includes('JSF9402'));
await Q.click('[data-act=specreset]');
C.chk('special CCaRs reset', !(await text(Q, '.speclist')).includes('JSF9402'));
const unk = await Q.$$eval('.budgets tr.unknown select[data-act=bsvc]', l => l.map(e => e.getAttribute('data-i')));
C.chk('the budget table marks a name no rule knows', unk.length > 0);
if (unk.length) {
  await Q.selectOption('.budgets select[data-act=bsvc][data-i="' + unk[0] + '"]', '0');
  C.chk('a budget overridden to USAF is no longer marked', (await Q.$$('.budgets tr.unknown')).length === unk.length - 1);
}
await clean(B, 'saved file and settings');
await noImg(B, 'saved file');

// ============================================== C. about 1,400 tree rows: drawn closed, opened to CCaR quickly
{
  const t = loadTool({ modules: BASE });
  const H = t.SP.RAW_HEADERS, ix = n => H.indexOf(n);
  const rows = [];
  let n = 0;
  for (let pm = 0; pm < 7; pm++) for (let ti = 0; ti < 20; ti++) for (let pe = 0; pe < 5; pe++) for (let cc = 0; cc < 2; cc++) for (let r = 0; r < 2; r++) {
    const c = new Array(32).fill('');
    c[ix('FY')] = 2026; c[ix('Month')] = ''; c[ix('CCaR No')] = 'SYN' + pm + ti + pe + cc; c[ix('Title')] = 'Synthetic title ' + pm + '-' + ti;
    c[ix('Budget')] = 'USAF O&M- Fixture Line Discretionary AV'; c[ix('Plan Event')] = 'Synthetic event ' + pm + '-' + ti + '-' + pe;
    c[ix('Date')] = '2026-0' + (1 + (n % 9)) + '-15'; c[ix('Amount')] = 100000 + n; c[ix('Alloc')] = r ? 'Not Allocated' : 'Actual Execution';
    c[ix('PMO')] = t.SP.PMO_ORDER[pm];
    rows.push({ c, x: {}, src: [0, 'O&M Raw Data', ++n + 2] });
  }
  t.close();
  const big = { om: { rows, headers: H.slice(), files: [{ name: 'synthetic.xlsx', sheets: ['O&M Raw Data'] }], importedAt: NOW } };
  const W = await open(page(await savedState(big)));
  const R = W.p;
  await R.waitForSelector('tr[data-bk=total]');
  const t0 = Date.now();
  await R.click('[data-act=view][data-v=om]');
  const tView = Date.now() - t0;
  const closed = await R.$$eval('table.tree tr[class^=lv]', l => l.length);
  C.chk('1,400 rows: the view draws only the open rows (7 PMOs and their 140 titles)', closed === 147, closed + ' rows');
  const t1 = Date.now();
  await R.selectOption('select[data-act=lvl]', '4');
  const tOpen = Date.now() - t1;
  const opened = await R.$$eval('table.tree tr[class^=lv]', l => l.length);
  C.chk('1,400 rows: opened to CCaR, every node is drawn', opened === 7 + 140 + 700 + 1400, opened + ' rows');
  C.chk('1,400 rows: the view opens in under 1.5 s and Expand to CCaR in under 2 s', tView < 1500 && tOpen < 2000, tView + ' ms, ' + tOpen + ' ms');
  console.log('ui: 1,400-row block: view ' + tView + ' ms, Expand to CCaR ' + tOpen + ' ms (' + opened + ' rows)');
  await clean(W, 'the big tree');
}

} catch (e) {
  const at = ((e && e.stack) || '').split('\n').find(l => l.includes('ui.test.mjs')) || '';
  C.chk('the run stopped before the end: ' + String((e && e.message) || e).split('\n')[0] + ' ' + at.trim(), false);
} finally {
  await browser.close().catch(() => {});
  tmp.rm();
}
C.done();
