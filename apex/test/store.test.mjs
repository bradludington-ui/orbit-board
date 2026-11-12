// The store (CONTRACT §11), in jsdom: opening the state baked into the page, an import, the settings, this browser's
// switches, and the page as a saved file.
//
// What it holds the store to:
//   - a page with no state, a valid state, and states that must be refused (another tool, JSON that does not parse, a
//     wrong version, pulls of the wrong shape): the right message, and an empty state that still takes an import;
//   - an import replaces only its own appropriations, the replaced pull becomes previous, the history grows by one with
//     totals worked out HERE from the rows (never read from the tool), and Data through resets to the new default and
//     the message says so, while every other setting a person chose stays;
//   - savedHtml, reopened in a fresh jsdom, gives the same state, deeply equal, with plan events holding a closing
//     script tag and an HTML comment opener; the saved page has #app back to the shell's boot note even after a draw;
//   - the switches live in this browser only (localStorage 'sfcbsp.view'), never mark the file unsaved, and a page
//     whose storage is refused still works;
//   - leaving with unsaved work asks; the program as committed still carries a null state.
//
//   node apex/test/store.test.mjs
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { loadTool, pageHtml, checks, scratchDir } from './harness.mjs';
import { assemble } from '../build.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const C = checks('store');
const tmp = scratchDir('sfcbsp-store-');
const MODS = ['util', 'xlsx-read', 'import', 'engine', 'store'];
const NOW1 = '2026-11-09T12:00:00.000Z', NOW2 = '2026-12-15T12:00:00.000Z';
// restated from CONTRACT §11, never read from the tool; §14.7 adds bae, the BAE report on screen and the one it replaced,
// both null with no report (the one expectation of this file that section changes)
const EMPTY = { v: 1, tool: 'sfcb-spend-plan', savedAt: null, settings: null, pulls: { current: {}, previous: {} }, history: [], lastImport: null,
  bae: { current: null, previous: null } };
const NULL_TAG = '<script id="spState" type="application/json">null</script>';
const J = o => JSON.stringify(o);
const ab = p => { const b = readFileSync(p); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };
const FX = join(tmp.dir, 'fx');
mkdirSync(FX);

function py(args) {
  const r = spawnSync('python3', ['-I', ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error('python3 ' + args[0] + ' failed: ' + r.stderr.slice(-800));
  return r;
}
async function parse(t, names, now) {
  return t.SP.parseFiles(names.map(n => ({ name: n.split('/').pop(), data: ab(join(FX, n)) })), { now });
}
// the page with a state tag holding exactly `text`, as a file holding it would be read
function withTagText(text) {
  const html = pageHtml({ modules: MODS });
  if (!html.includes(NULL_TAG)) throw new Error('the shell has lost its null state tag');
  return html.replace(NULL_TAG, () => '<script id="spState" type="application/json">' + text + '<' + '/script>');
}
// approved and obligated per 'ap|fy' over the readable rows, restated from §4.5 and §11 for the history check: FY is
// c[0], Amount c[9] in cents, Alloc c[10]; obligated means Alloc starts "Actual Execution"
function totalsOf(pulls, aps) {
  const out = {};
  for (const ap of aps) for (const r of pulls[ap].rows) {
    if (r.bad && r.bad.length) continue;
    if (!Number.isInteger(r.c[0]) || !Number.isSafeInteger(r.c[9])) continue;
    const k = ap + '|' + r.c[0];
    const t = out[k] || (out[k] = { approved: 0, obligated: 0 });
    t.approved += r.c[9];
    if (/^actual execution/i.test(String(r.c[10] ?? '').trim())) t.obligated += r.c[9];
  }
  return out;
}
const sortKeys = o => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

try {
  py([join(HERE, 'fixture', 'make_fixture.py'), '--out', FX]);

  // ============================================================================================ opening (§11)
  {
    const t = loadTool({ modules: MODS });
    C.eq('the store boots with no script errors', t.errors, []);
    C.eq('before storeInit, SP.state is the empty state', J(t.SP.state), J(EMPTY));
    const r = t.SP.storeInit();
    C.eq('no state: storeInit says nothing is wrong', [r.ok, r.message], [true, '']);
    C.eq('no state: SP.state is the empty state', J(t.SP.state), J(EMPTY));
    C.chk('no state: nothing is unsaved', t.SP.isDirty() === false);
    const r2 = t.SP.storeInit();
    C.chk('a second storeInit changes nothing and is not an error', r2.ok === true && J(t.SP.state) === J(EMPTY));
    // "working": the empty state takes an import
    const parsed = await parse(t, ['pull-all.xlsx'], NOW1);
    t.SP.applyImport(parsed);
    C.chk('no state: an import afterwards fills the state', !!t.SP.state.pulls.current.om && t.SP.state.history.length === 1);
    t.close();
  }
  let VALID;   // a state as the store writes it, made by the store itself from the fixture
  {
    const t = loadTool({ modules: MODS });
    t.SP.storeInit();
    t.SP.applyImport(await parse(t, ['pull-all.xlsx'], NOW1));
    VALID = JSON.parse(J(t.SP.state));
    VALID.savedAt = '2026-11-09T12:30:00.000Z';
    t.close();
    const t2 = loadTool({ modules: MODS, state: VALID });
    const r = t2.SP.storeInit();
    C.chk('a valid state opens', r.ok === true, J(r));
    C.chk('a valid state: the message says when it was saved', /saved \d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(r.message), r.message);
    C.eq('a valid state: SP.state is the saved state, deeply equal', J(t2.SP.state), J(VALID));
    C.chk('a valid state: nothing is unsaved on opening', t2.SP.isDirty() === false);
    t2.close();
  }
  // states that must be refused: each opens empty, says why, and still takes an import
  const pullsOf = cur => ({ current: cur, previous: {} });
  const row31 = JSON.parse(J(VALID.pulls.current.om.rows[0])); row31.c.pop();
  const rowObj = JSON.parse(J(VALID.pulls.current.om.rows[0])); rowObj.c[3] = { html: 1 };
  const BAD = [
    ['another tool', J(Object.assign({}, VALID, { tool: 'prioritization-board' })), /another tool/],
    ['no tool at all', J({ v: 1, pulls: VALID.pulls }), /another tool/],
    ['bad JSON', '{"v":1,"tool":"sfcb-spend-plan","pulls":', /cannot be read/],
    ['a newer version', J(Object.assign({}, VALID, { v: 2 })), /newer version/],
    ['a version written as text', J(Object.assign({}, VALID, { v: '1' })), /format/],
    ['pulls as a list', J(Object.assign({}, VALID, { pulls: [] })), /pulls/],
    ['current pulls as a list', J(Object.assign({}, VALID, { pulls: { current: [], previous: {} } })), /current pulls/],
    ['no previous pulls', J(Object.assign({}, VALID, { pulls: { current: VALID.pulls.current } })), /previous pulls/],
    ['a pull with no rows list', J(Object.assign({}, VALID, { pulls: pullsOf({ om: { rows: 'all of them' } }) })), /O&M pull has no list of rows/],
    ['a pull under an unknown name', J(Object.assign({}, VALID, { pulls: pullsOf({ navy: VALID.pulls.current.om }) })), /“navy”/],
    ['a row of 31 values', J(Object.assign({}, VALID, { pulls: pullsOf({ om: { rows: [row31] } }) })), /row 1, has 31 values/],
    ['a value that is an object', J(Object.assign({}, VALID, { pulls: pullsOf({ om: { rows: [rowObj] } }) })), /Title that is neither text nor a number/],
    ['a Data through that is not a month', J(Object.assign({}, VALID, { settings: Object.assign({}, VALID.settings, { asOf: 'October' }) })), /Data through/],
    ['a state that is a list', '[1,2,3]', /not a saved plan/],
  ];
  for (const [what, text, re] of BAD) {
    const t = loadTool({ html: withTagText(text.replace(/</g, '\\u003c')) });
    const r = t.SP.storeInit();
    C.chk('refused (' + what + '): storeInit says it was not used', r.ok === false && re.test(r.message), J(r));
    C.chk('refused (' + what + '): the message says the page opened empty', /opened empty/.test(r.message), r.message);
    C.eq('refused (' + what + '): SP.state is the empty state', J(t.SP.state), J(EMPTY));
    C.chk('refused (' + what + '): nothing is unsaved', t.SP.isDirty() === false);
    t.SP.applyImport(await parse(t, ['pull-ff.csv'], NOW1));
    C.chk('refused (' + what + '): the empty state still takes an import', !!t.SP.state.pulls.current.ff && t.SP.state.history.length === 1);
    t.close();
  }

  // ================================================================= the BAE reports, on opening and saving (§14.7)
  {
    // A file saved before §14 has no bae: it opens as one with no report, the rest exactly as saved, nothing unsaved
    const old = JSON.parse(J(VALID));
    delete old.bae;
    const t0 = loadTool({ modules: MODS, state: old });
    const r0 = t0.SP.storeInit();
    C.chk('a file saved before §14 (no bae) opens', r0.ok === true, J(r0));
    C.eq('… with no report: bae is {current: null, previous: null}', J(t0.SP.state.bae), J({ current: null, previous: null }));
    C.eq('… and everything else as saved', J(Object.assign({}, t0.SP.state, { bae: undefined })), J(old));
    C.chk('… with nothing unsaved', t0.SP.isDirty() === false);
    C.chk('… and says nothing of a report', !/BAE/.test(r0.message), r0.message);
    t0.close();
    // a state with reports, as the store writes them (restated from CONTRACT §14.1, never read from the tool)
    const H = ['Budget Name', 'Budget FY Numeric', 'Budget Approved Amount ($M)', 'Budget Authorized Amount ($M)', 'Note'];
    const BAE1 = { headers: H, cols: H.slice(0, 4), rows: [
      { c: ['USAF O&M- Synthetic Line Discretionary AV', 2026, 100000000, 90000000], x: { Note: 'a </script> note' }, src: [0, 'Sheet1', 2] },
      { c: ['', 2026, 5, 5], x: {}, src: [0, 'Sheet1', 3], bad: ['Budget Name is blank'], raw: {} },
      { c: ['USN APN Full Fund Synthetic Discretionary PP', null, null, 0], x: {}, src: [0, 'Sheet1', 4],
        bad: ['Budget FY Numeric is blank', 'Budget Approved Amount ($M) “$1.000” is text, not a number'], raw: { 'Budget Approved Amount ($M)': '$1.000' } } ],
      file: 'Report__BAE_synthetic_2026-01-31_120000.xlsx', sheet: 'Sheet1', stamp: '2026-01-31 12:00',
      total: { approved: 100000005, authorized: 90000005, rowNo: 5 }, importedAt: NOW1 };
    const BAE0 = Object.assign(JSON.parse(J(BAE1)), { stamp: null, total: null, importedAt: '2026-10-01T12:00:00.000Z', sameSince: '2026-09-01T12:00:00.000Z' });
    const WITH = Object.assign(JSON.parse(J(VALID)), { bae: { current: BAE1, previous: BAE0 } });
    const t1 = loadTool({ modules: MODS, state: WITH });
    const r1 = t1.SP.storeInit();
    C.chk('a file with reports opens', r1.ok === true, J(r1));
    C.eq('… with both reports, deeply equal', J(t1.SP.state), J(WITH));
    C.chk('… the opening message names the report', /It holds the BAE report “Report__BAE_synthetic_2026-01-31_120000\.xlsx” › “Sheet1” \(dated 2026-01-31 12:00\)\./.test(r1.message), r1.message);
    const html1 = t1.SP.savedHtml();
    const t2 = loadTool({ html: html1 });
    t2.SP.storeInit();
    C.eq('… saved and reopened, the reports come back deeply equal', J(t2.SP.state.bae), J(WITH.bae));
    C.eq('… and saved again, the page is the same, byte for byte', t2.SP.savedHtml(), html1);
    t1.close(); t2.close();
    // reports of the wrong shape: the page opens empty and says why, as for pulls of the wrong shape
    const bad = (side, f) => { const s = JSON.parse(J(WITH)); f(s.bae, s); return J(s); };
    const BADBAE = [
      ['bae that is not a pair', bad(0, (b, s) => { s.bae = null; }), /BAE reports are not a current and a previous report/],
      ['bae as a list', bad(0, (b, s) => { s.bae = [BAE1]; }), /BAE reports are not a current and a previous report/],
      ['bae holding a third report', bad(0, b => { b.older = BAE0; }), /“older”, which is neither the current nor the previous report/],
      ['a current report that is a list', bad(0, b => { b.current = []; }), /the current BAE report is not a report/],
      ['no headers', bad(0, b => { delete b.current.headers; }), /current BAE report has no list of column headers/],
      ['no rows', bad(0, b => { b.previous.rows = 'many'; }), /previous BAE report has no list of rows/],
      ['a row of 3 values', bad(0, b => { b.current.rows[0].c.pop(); }), /current BAE report, row 1, has 3 values, not 4/],
      ['an FY written as text', bad(0, b => { b.current.rows[0].c[1] = '2026'; }), /row 1, has an FY that is not a year/],
      ['an amount with a fraction of a cent', bad(0, b => { b.current.rows[0].c[2] = 1.5; }), /row 1, has an Approved amount that is not whole cents/],
      ['a readable row with no amount', bad(0, b => { b.current.rows[0].c[3] = null; }), /row 1, is missing its FY or an amount, and does not say why/],
      ['a Budget Name that is a number', bad(0, b => { b.current.rows[0].c[0] = 7; }), /row 1, has a Budget Name that is not text/],
      ['columns that are a list', bad(0, b => { b.current.rows[0].x = ['a']; }), /row 1, has columns that are not a list of named values/],
      ['no file', bad(0, b => { delete b.current.file; }), /current BAE report does not name its file/],
      ['a total that is not one', bad(0, b => { b.current.total = { approved: 'x', authorized: 1, rowNo: 5 }; }), /current BAE report has a total row that is not one/],
      ['a date that is a number', bad(0, b => { b.current.stamp = 20260131; }), /current BAE report has a date that is not a date/],
      ['an import time that is a number', bad(0, b => { b.previous.sameSince = 1; }), /previous BAE report has an import time that is not a time/],
      ['a last import report whose BAE part is a list', bad(0, (b, s) => { s.lastImport.report.bae = []; }), /BAE report part is not a table/],
    ];
    for (const [what, text, re] of BADBAE) {
      const t = loadTool({ html: withTagText(text.replace(/</g, '\\u003c')) });
      const r = t.SP.storeInit();
      C.chk('refused (' + what + '): storeInit says why, and the page opened empty', r.ok === false && re.test(r.message) && /opened empty/.test(r.message), J(r));
      C.eq('refused (' + what + '): SP.state is the empty state', J(t.SP.state), J(EMPTY));
      t.close();
    }
  }

  // ============================================================================================ imports (§11)
  {
    const t = loadTool({ modules: MODS });
    const SP = t.SP;
    SP.storeInit();
    let fired = 0;
    const off = SP.onStateChange(() => { fired++; });
    const p1 = await parse(t, ['pull-all.xlsx'], NOW1);
    const want1 = JSON.parse(J(p1.pulls));
    const r1 = SP.applyImport(p1);
    C.eq('import 1: the four appropriations are current, as parsed', J(SP.state.pulls.current), J(want1));
    C.eq('import 1: nothing is previous yet', J(SP.state.pulls.previous), '{}');
    C.eq('import 1: one history entry', SP.state.history.length, 1);
    C.eq('import 1: the history entry names the import and its appropriations',
      [SP.state.history[0].importedAt, SP.state.history[0].aps], [NOW1, ['om', 'ff', 'sp', 'opn']]);
    C.eq('import 1: the history totals are every readable row, per ap|fy',
      J(sortKeys(SP.state.history[0].totals)), J(sortKeys(totalsOf(want1, ['om', 'ff', 'sp', 'opn']))));
    C.eq('import 1: Data through is the last full month before the import', SP.state.settings.asOf, '2026-10');
    C.chk('import 1: the message says Data through was set to Oct-2026', /Data through set to Oct-2026/.test(r1.message), r1.message);
    C.chk('import 1: the message names each appropriation with its rows',
      ['O&M', 'Full Fund', 'Initial Spares', 'OPN'].every(l => r1.message.includes(l + ' (')), r1.message);
    C.eq('import 1: the last import report is the parse report', J(SP.state.lastImport), J({ report: p1.report }));
    C.chk('import 1: the state is unsaved', SP.isDirty() === true);
    C.eq('import 1: listeners are told once', fired, 1);

    // a person's settings, then the second generation (O&M and FF only)
    SP.setSettings({ asOf: '2026-03' });
    SP.setSettings({ authorized: { 'om|2026': 123456789 }, special: ['PP 2000', 'JSF6654', 'CT-0001'] });
    C.eq('setSettings: each change is told', fired, 3);
    const before = JSON.parse(J(SP.state.pulls.current));
    const p2 = await parse(t, ['gen2/pull-om.xlsx', 'gen2/pull-ff.csv'], NOW2);
    const want2 = JSON.parse(J(p2.pulls));
    const r2 = SP.applyImport(p2);
    C.eq('import 2: O&M is the new pull', J(SP.state.pulls.current.om), J(want2.om));
    C.eq('import 2: Full Fund is the new pull', J(SP.state.pulls.current.ff), J(want2.ff));
    C.eq('import 2: Initial Spares keeps the first pull', J(SP.state.pulls.current.sp), J(before.sp));
    C.eq('import 2: OPN keeps the first pull', J(SP.state.pulls.current.opn), J(before.opn));
    C.eq('import 2: the replaced O&M pull is previous', J(SP.state.pulls.previous.om), J(before.om));
    C.eq('import 2: the replaced Full Fund pull is previous', J(SP.state.pulls.previous.ff), J(before.ff));
    C.chk('import 2: Initial Spares and OPN were not replaced, so have no previous', !SP.state.pulls.previous.sp && !SP.state.pulls.previous.opn);
    if (want2.unidentified) {
      C.eq('import 2: its unidentified rows replace the first import’s', J(SP.state.pulls.current.unidentified), J(want2.unidentified));
      C.eq('import 2: the first import’s unidentified rows are previous', J(SP.state.pulls.previous.unidentified), J(before.unidentified));
    }
    C.eq('import 2: the history grew by one', SP.state.history.length, 2);
    C.eq('import 2: the new entry names only O&M and Full Fund', [SP.state.history[1].importedAt, SP.state.history[1].aps], [NOW2, ['om', 'ff']]);
    C.eq('import 2: its totals are O&M and Full Fund only',
      J(sortKeys(SP.state.history[1].totals)), J(sortKeys(totalsOf(want2, ['om', 'ff']))));
    C.eq('import 2: the first entry is untouched', SP.state.history[0].aps, ['om', 'ff', 'sp', 'opn']);
    C.eq('import 2: Data through is reset to the new default', SP.state.settings.asOf, '2026-11');
    C.chk('import 2: the message says Data through was reset, and from what', /Data through reset to Nov-2026.*\(it was Mar-2026\)/.test(r2.message), r2.message);
    C.chk('import 2: the message says Initial Spares and OPN keep their pulls, and from when',
      /Initial Spares and OPN keep their pulls of \d{4}-\d{2}-\d{2}/.test(r2.message), r2.message);
    C.chk('import 2: the message says the replaced pulls are kept', /O&M and Full Fund pulls it replaces are kept/.test(r2.message), r2.message);
    C.eq('import 2: every other setting a person chose is kept',
      [SP.state.settings.authorized, SP.state.settings.special], [{ 'om|2026': 123456789 }, ['PP 2000', 'JSF6654', 'CT-0001']]);
    C.eq('import 2: listeners are told', fired, 4);
    off();
    SP.setSettings({ firstFY: 2024 });
    C.eq('an unsubscribed listener is not told', fired, 4);
    // a setting set to what it already is changes nothing, so it is not unsaved work
    const t3 = loadTool({ modules: MODS, state: VALID });
    t3.SP.storeInit();
    t3.SP.setSettings({ asOf: VALID.settings.asOf });
    C.chk('setSettings with no change does not mark the file unsaved', t3.SP.isDirty() === false);
    t3.SP.setSettings({ firstFY: 2026 });
    C.chk('setSettings with a change marks the file unsaved', t3.SP.isDirty() === true);
    // an import that holds nothing is refused and changes nothing
    const was = J(t3.SP.state);
    let threw = '';
    try { t3.SP.applyImport({ pulls: {}, report: {} }); } catch (e) { threw = e.message; }
    C.chk('an import with no pulls is refused with a reason', /nothing was changed/.test(threw), threw);
    C.eq('an import with no pulls changes nothing', J(t3.SP.state), was);
    t3.close();

    // ========================================================================================= the saved page
    // plan events the state tag must survive: a closing script tag and an HTML comment opener
    const hostile = ['Close-out </script> review', 'Kept <!-- not a comment --> event', 'Both </SCRIPT ><!--<script> at once'];
    const csv = 'FY,CCaR No,Title,Budget,Plan Event,Date,Amount,Alloc,PMO\r\n'
      + hostile.map((pe, i) => '2026,ZZ-' + (900 + i) + ',Fixture Title,Navy OPN Discretionary,"' + pe.replace(/"/g, '""') + '",2026-01-1' + i + ',10' + i + '.25,Actual Execution,Propulsion (PP)').join('\r\n') + '\r\n';
    SP.applyImport(await SP.parseFiles([{ name: 'hostile.csv', data: csv }], { now: NOW2 }));
    const pes = SP.state.pulls.current.opn.rows.map(r => r.c[7]);
    C.eq('the hostile plan events are in the state as typed', pes, hostile);
    // the UI draws into #app after storeInit: the saved file must not carry that drawing
    t.window.document.getElementById('app').innerHTML = '<div id="drawnByUi">a drawn screen ' + hostile[0] + '</div>';
    const html = SP.savedHtml();
    const dom = new JSDOM(html);   // read as markup only: scripts do not run
    const scripts = dom.window.document.querySelectorAll('script');
    C.eq('the saved page has exactly its two scripts (no plan event ended the state tag)', scripts.length, 2);
    const tagText = dom.window.document.getElementById('spState').textContent;
    C.chk('the state tag holds no "<" at all: every one is written \\u003c', !tagText.includes('<') && tagText.includes('\\u003c'));
    C.eq('the state tag parses to the state', J(JSON.parse(tagText)), J(SP.state));
    const shellApp = new JSDOM(readFileSync(join(HERE, '..', 'src', 'shell.html'), 'utf8')).window.document.getElementById('app').innerHTML;
    C.eq('the saved page’s #app is the shell’s boot note, not the drawn screen', dom.window.document.getElementById('app').innerHTML, shellApp);
    C.chk('the drawn screen is nowhere in the saved page', !html.includes('drawnByUi'));
    C.chk('the saved page keeps the program meta', /<meta name="sfcb-spend-plan"/.test(html));
    C.chk('the saved page starts with its doctype', html.startsWith('<!DOCTYPE html>\n<html'));
    const re = loadTool({ html });
    C.eq('the saved page reopens with no script errors', re.errors, []);
    const rr = re.SP.storeInit();
    C.chk('the saved page reopens: storeInit accepts its state', rr.ok === true, J(rr));
    C.eq('the saved page reopens with the same state, deeply equal', J(re.SP.state), J(SP.state));
    C.eq('the reopened state still holds the hostile plan events as typed', re.SP.state.pulls.current.opn.rows.map(r => r.c[7]), hostile);
    // a save of a reopened page is the same page again: nothing drifts from save to save
    C.eq('saved, reopened and saved again, the page is the same', re.SP.savedHtml(), html);
    re.close();

    // ===================================================================================== leaving (§11)
    const ev = new t.window.Event('beforeunload', { cancelable: true });
    t.window.dispatchEvent(ev);
    C.chk('leaving with unsaved work asks', ev.defaultPrevented === true);
    t.close();
    const tc = loadTool({ modules: MODS, state: VALID });
    tc.SP.storeInit();
    const ev2 = new tc.window.Event('beforeunload', { cancelable: true });
    tc.window.dispatchEvent(ev2);
    C.chk('leaving with nothing unsaved does not ask', ev2.defaultPrevented === false);
    tc.close();
  }

  // ============================================ the whole page: the screens draw, and the capture came first (§11)
  {
    const t = loadTool({ state: VALID });    // every module, the UI's boot included: it calls storeInit, then draws
    await new Promise(r => setTimeout(r, 200));
    C.eq('the whole page (every module) boots with no script errors', t.errors, []);
    const drawn = t.window.document.getElementById('app').innerHTML;
    C.chk('the screens have drawn into #app', !/boot-note/.test(drawn) && drawn.length > 200);
    const html = t.SP.savedHtml();
    const app = new JSDOM(html).window.document.getElementById('app');
    C.chk('saved from the drawn page, #app is still the boot note', app && app.children.length === 1 && app.firstElementChild.classList.contains('boot-note'),
      app ? app.innerHTML.slice(0, 200) : 'no #app');
    C.eq('saved from the drawn page, the state is the opened one', J(JSON.parse(new JSDOM(html).window.document.getElementById('spState').textContent)), J(VALID));
    t.close();
  }

  // ============================================================================ a page with no #app (§11)
  {
    const html = pageHtml({ modules: MODS, state: VALID }).replace(/<div id="app">[\s\S]*?<\/div>/, '');
    const t = loadTool({ html });
    let r, err = '';
    try { r = t.SP.storeInit(); } catch (e) { err = e.message; }
    C.chk('storeInit is safe on a page with no #app', !err && r && r.ok === true, err || J(r));
    const saved = t.SP.savedHtml();
    const re = loadTool({ html: saved });
    re.SP.storeInit();
    C.eq('a page with no #app still saves and reopens with its state', J(re.SP.state), J(VALID));
    re.close(); t.close();
  }

  // ======================================================================== the switches (§9, §11)
  {
    const URL = 'http://localhost/sfcb-spend-plan.html';   // jsdom gives file:// no storage; an http origin has it
    const t = loadTool({ modules: MODS, state: VALID, url: URL });
    t.window.localStorage.setItem('sfcbsp.view', J({ svc: { USAF: false, 'Not a service': false, 'USN (USN CV)': 'no' }, lane: { mand: false } }));
    t.SP.storeInit();
    const v = t.SP.getView();
    C.eq('stored switches are read at opening: USAF off, Mandatory off',
      [v.svc.USAF, v.lane.mand, v.lane.disc, v.svc['USAF ANG']], [false, false, true, true]);
    C.chk('a stored switch nobody draws is dropped', !('Not a service' in v.svc));
    C.chk('a stored switch that is not true or false is left on', v.svc['USN (USN CV)'] === true);
    v.svc['USAF ANG'] = false;
    C.chk('getView gives a copy: editing it changes nothing until setView', t.SP.getView().svc['USAF ANG'] === true);
    t.SP.setView(v);
    C.eq('setView keeps the switches in this browser', JSON.parse(t.window.localStorage.getItem('sfcbsp.view')).svc['USAF ANG'], false);
    C.chk('setView does not mark the file unsaved', t.SP.isDirty() === false);
    C.chk('the switches are not in the saved file', !/sfcbsp\.view/.test(J(t.SP.state)) && J(JSON.parse(J(t.SP.state))) === J(VALID));
    const keys = Object.keys(t.window.localStorage);
    C.chk('browser storage holds only sfcbsp. keys', keys.length > 0 && keys.every(k => k.startsWith('sfcbsp.')), J(keys));
    t.close();
    const tb = loadTool({ modules: MODS, url: URL });
    tb.window.localStorage.setItem('sfcbsp.view', '{not json');
    tb.SP.storeInit();
    C.eq('unreadable stored switches: every switch on', J(tb.SP.getView()), J(tb.SP.defaultView()));
    tb.close();
    // file:// in jsdom refuses storage outright: the page must work without it
    const tf = loadTool({ modules: MODS, state: VALID });
    let err = '';
    try {
      tf.SP.storeInit();
      const w = tf.SP.getView(); w.lane.disc = false; tf.SP.setView(w);
    } catch (e) { err = e.message; }
    C.chk('with storage refused, the switches still work in the page', !err && tf.SP.getView().lane.disc === false, err);
    tf.close();
  }

  // ===================================================================== the program as committed (§11)
  {
    const shell = readFileSync(join(HERE, '..', 'src', 'shell.html'), 'utf8');
    C.chk('src/shell.html carries a null state', shell.includes(NULL_TAG));
    C.chk('the page the sources build carries a null state', assemble().includes(NULL_TAG));
    const built = join(HERE, '..', 'apex.html');
    if (existsSync(built)) C.chk('the built apex.html carries a null state', readFileSync(built, 'utf8').includes(NULL_TAG));
  }

  // ===================================================================== no row limits (§6 item 9)
  {
    const t = loadTool({ modules: MODS });
    t.SP.storeInit();
    const p = await parse(t, ['pull-all.xlsx'], NOW1);
    const one = p.pulls.om.rows;
    const big = [];
    while (big.length < 50000) for (const r of one) { if (big.length >= 50000) break; big.push(r); }
    p.pulls.om.rows = big;
    const t0 = Date.now();
    t.SP.applyImport(p);
    const html = t.SP.savedHtml();
    const re = loadTool({ html });
    re.SP.storeInit();
    const s = (Date.now() - t0) / 1000;
    C.eq('50,000 O&M rows: saved and reopened whole', re.SP.state.pulls.current.om.rows.length, 50000);
    C.chk('50,000 O&M rows: import, save and reopen take under 30 s (' + s.toFixed(1) + ' s)', s < 30);
    console.log('store: 50,000 rows imported, saved (' + (html.length / 1e6).toFixed(1) + ' MB) and reopened in ' + s.toFixed(1) + ' s');
    re.close(); t.close();
  }
} catch (e) {
  C.chk('the test ran to the end', false, (e && e.stack) || String(e));
} finally {
  tmp.rm();
  C.done();
}
