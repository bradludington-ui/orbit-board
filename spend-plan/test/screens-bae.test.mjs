// The screens with a BAE report of budgets loaded (CONTRACT §14.5–§14.7), first in jsdom through the page's own controls
// (the Import button's file input, the view buttons, the PMO picker, the Settings boxes and the switches, each with the
// event a person's click or typing fires), then in Chromium for what only a browser draws: the keyboard's place, the
// marks' colour on a TOTAL's navy, and no view scrolling sideways.
//
// Every figure expected here comes from test/fixture/oracle.py, which reads the same synthetic pull and report with
// Python and works §14 out from the contract alone (scenarios bae-all, bae-entered, bae-entered-off and bae-gen2). Every
// word expected is restated here from the contract, never read from the tool.
//
// What it holds the screens to:
//   §14.7  the report comes in through the Import button, alone or with pulls; the top bar names it and its date; an
//          import holding only a report is named as such in What changed's list of imports, and a page with a report
//          and no pull says the report is held
//   §14.3  the Summary's and the appropriation views' Approved, Authorized, Obligated, Unobligated, Obl % and Status are
//          the oracle's; the slide blocks and every totals band stay on the plan (their Total column is the plan's), and
//          their Obligation % reads "CCaR plan" where the report covers the block
//   §14.4  every PMO tab's table is the oracle's, its strip prints its stoplight row with that row's marks, in the
//          workbook's words (review M4-5), and it says what its figures count
//   §14.5  § on an Approved the report has no figure for, † on Authorized standing in, ‡ on a typed one while a switch
//          is off, a TOTAL carrying each, every mark's words under its table; line 2; the notes on the uncovered and the
//          planShort blocks
//   §14.6  an appropriation's title names the report beside the pull (review BP4-1); the Slide blocks view's note, in the
//          workbook's words (P4-6); the Import report's BAE section (rows by scope, Approved and Authorized by
//          appropriation and FY, planShort, the pull's budgets with no report row and the report's with no pull row, each
//          list the switches reach saying so when one is off (P4-4), and a report kept from an earlier import); Settings' report and its Authorized table (Block, Typed, BAE report, Used), typing a figure sets the
//          block's override, a blank clears it back to the report's, and the message names the block; What changed's
//          BAE section (SP.diffBae) with its budgets new, gone and changed, largest first
//   §14    every name from a report reaches the page as text; and WITH NO REPORT LOADED NOTHING CHANGES: every view, the
//          top bar and the switches draw byte for byte what the screens drew before §14 (commit 0c71592's 90-ui.js)
//
//   node spend-plan/test/screens-bae.test.mjs
import { chromium } from 'playwright-core';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CHROME } from '../../tools/chrome.mjs';
import { loadTool, pageHtml, checks, scratchDir } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');
const C = checks('screens-bae');
const tmp = scratchDir('sfcbsp-scrbae-');
const J = x => JSON.stringify(x);
const settle = (ms = 20) => new Promise(res => setTimeout(res, ms));
const STORE_MODS = ['util', 'xlsx-read', 'import', 'engine', 'store'];

// restated from CONTRACT §2, §8 and §14.5, never read from the tool
const AP = { om: 'O&M', ff: 'Full Fund', sp: 'Initial Spares', opn: 'OPN' };
const WORD = { green: 'On track', yellow: 'Within 10', red: 'Behind' };
const SECT = 'Approved is the CCaR plan: the BAE report has no figure for this block.';
const DAG_BAE = 'Authorized was neither entered nor in the BAE report; Approved is shown in its place (on a total, for the rows marked †).';
// with a BAE report loaded ‡ is on every typed figure, whatever the switches, and says so (answer 8, review I4-4)
const DDAG = 'Authorized as entered, for the appropriation and FY as a whole: it is used in place of the BAE report’s figure, where the report has one, and covers every service and lane, whatever the switches show.';
// §14.6 rule 6, said on the Slide blocks view and on the Slide Snapshots sheet in the same words (review P4-6)
const SLIDE_NOTE = 'The slide blocks measure the CCaR plan by month, as they always have: where the BAE report has figures for a block, its Approved on the '
  + 'Summary is the report’s, and the block’s Obligation % row says “CCaR plan” beside the plan it measures.';
// §14.6 What changed, with a report loaded: a pull's section names its figure the CCaR plan, and the view says why once
// (review P4-2)
const PLAN_NOTE = 'A BAE report is loaded, so Approved on the other views is the BAE report’s (the CCaR plan only on a block the report has no figure for, '
  + 'marked §). Each pull’s section below compares the two pulls themselves, every row whatever the switches, so its figures are the CCaR plan, and are '
  + 'named so. What changed in the BAE report is in its own section at the end.';
const normKey = s => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
const flat = s => String(s ?? '').replace(/\s+/g, ' ').trim();
const pad = n => String(n).padStart(2, '0');
const day = iso => { const d = new Date(iso); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
// $M in a sentence, as §2 shows it: two decimals, thousands separators, a non-zero amount under $5,000 as <0.01
const mText = c => (c !== 0 && Math.abs(c) < 500000 ? (c < 0 ? '(<0.01)' : '<0.01')
  : (c < 0 ? '(' : '') + (Math.abs(c) / 1e8).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + (c < 0 ? ')' : ''));

// §16.2 restated: a PMO tab's line on what its figures count, the money no plan event uses (on a tab, in the Summary's
// note) and the Import report's two lists, dollars exact as the Import report writes them
const PE_LINE = 'Approved and Authorized are the BAE report’s figures for the budgets this PMO’s plan events are assigned to; a budget the plan events of '
  + 'several PMOs use is split among them by each one’s CCaR plan on it. Obligated counts this PMO’s plan events.';
const usd16 = c => (c < 0 ? '-' : '') + '$' + String(Math.floor(Math.abs(c) / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + String(Math.abs(c) % 100).padStart(2, '0');
const figs16 = t => 'Approved ' + usd16(t.approved) + ', Authorized ' + usd16(t.authorized);
// a $M figure as the screen prints it, read back to within its last place: '(1.23)' and '<0.01' included
function mClose(text, cents) {
  const s = flat(text);
  if (/^\(?<0\.01\)?$/.test(s)) return cents !== 0 && Math.abs(cents) < 500000;
  if (s === '-' || s === '0.00') return Math.abs(cents) < 500000;
  const neg = /^\(.*\)$/.test(s), v = Number(s.replace(/[(),]/g, ''));
  return isFinite(v) && Math.abs((neg ? -v : v) * 1e8 - cents) <= 500000 + 1e-6;
}
// a percentage as the screen prints it, to within its last place
const pClose = (text, x) => (x === null ? flat(text) === '' : Math.abs(Number(flat(text).replace('%', '')) - x * 100) <= 0.005 + 1e-9);
// a section by its accessible name. Not by an attribute selector: jsdom's selector engine never matches a value holding
// "&" ("O&M FY2025"), and an O&M check that found no section would read as a missing one
const secBy = (root, cls, label) => [...root.querySelectorAll('section.' + cls)].find(e => e.getAttribute('aria-label') === label) || null;
// keys in model order, restated (§14.8: appropriations as SP.APS, then FY)
const AP_AT = { om: 0, ff: 1, sp: 2, opn: 3 };
const byModel = ks => ks.slice().sort((a, b) => AP_AT[a.split('|')[0]] - AP_AT[b.split('|')[0]] || Number(a.split('|')[1]) - Number(b.split('|')[1]));
const sorted = o => Object.fromEntries(Object.keys(o).sort().map(k => [k, o[k]]));

// ------------------------------------------------------------------------------------------------- the fixture
function py(args, input) {
  const r = spawnSync('python3', ['-I', ...args], { encoding: 'utf8', maxBuffer: 1 << 28, input });
  if (r.status !== 0) throw new Error('python3 ' + args[0] + ' failed: ' + (r.stderr || '').slice(-800));
  return r;
}
const FX = join(tmp.dir, 'fx');
mkdirSync(FX);
py([join(HERE, 'fixture', 'make_fixture.py'), '--out', FX]);
const oracle = sc => { const out = join(tmp.dir, sc + '.json'); py([join(HERE, 'fixture', 'oracle.py'), '--scenario', sc, '--fixture', FX, '--out', out]); return JSON.parse(readFileSync(out, 'utf8')); };
const O = { all: oracle('bae-all'), entered: oracle('bae-entered'), enteredOff: oracle('bae-entered-off'), gen2: oracle('bae-gen2') };
const ab = p => { const b = readFileSync(p); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };

// A small report written here by openpyxl, every name invented: budget names and a file name that hold markup. Its four
// columns are the report's own headers (§14.1), its amounts dollars, large enough not to read as $M.
const HOSTILE_NAME = 'USAF O&M- <img src=x onerror=alert(1)> Hostile Line Discretionary AV';
const HOSTILE_FILE = '"><img src=x onerror=alert(2)>_bae.xlsx';
py(['-c', String.raw`
import sys, openpyxl
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Report'
ws.append(['Budget Name', 'Budget FY Numeric', 'Budget Approved Amount ($M)', 'Budget Authorized Amount ($M)'])
ws.append([sys.argv[2], 2026, 125000000, 100000000])
ws.append(['USN O&M- Invented "Quoted" & Line Discretionary PP', 2027, 64000000, 0])
ws.append(['USAF O&M- Invented Second Line Discretionary PSM', 2026, 38000000, 38000000])
wb.save(sys.argv[1])
`, join(tmp.dir, 'hostile.xlsx'), HOSTILE_NAME]);

// ------------------------------------------------------------------------------------------------- the page in jsdom
// the page boots on DOMContentLoaded, a turn after jsdom has read it: a boot is done when #uiMain is there
async function boot({ state = null, html = null } = {}) {
  const t = loadTool(html ? { html } : { state });
  t.window.confirm = () => true;
  const W = t.window, doc = W.document;
  const T = {
    t, W, doc, SP: t.SP,
    main: () => doc.getElementById('uiMain'),
    msg: () => doc.getElementById('uiMsg').textContent,
    ev: e => t.ev(e),
    click(el) { el.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); },
    change(el, value) { if (value !== undefined) { if (el.type === 'checkbox') el.checked = value; else el.value = value; } el.dispatchEvent(new W.Event('change', { bubbles: true })); },
    async view(v) { T.click(doc.querySelector('[data-act=view][data-v="' + v + '"]')); await settle(); return T.main(); },
    // the Import button opens the file window (a click on the hidden file input); the files picked fire its change, which
    // is the path a person's import takes. The import is done when the page is no longer busy with it.
    async pick(files) {
      const inp = doc.getElementById('uiFile');
      Object.defineProperty(inp, 'files', { value: files.map(([name, data]) => ({ name, arrayBuffer: async () => data })), configurable: true });
      T.click(doc.querySelector('#uiTop [data-act=import]'));
      inp.dispatchEvent(new W.Event('change', { bubbles: true }));
      for (let i = 0; i < 400 && T.ev('ui.busy'); i++) await settle(10);
      await settle();
    },
    // Data through set in the top bar, as a person types it: the oracle's scenarios are read at Oct-2026, and an import
    // sets it to the month before the day the test runs
    async asOf(ym) {
      if (T.SP.state.settings && T.SP.state.settings.asOf === ym) return;
      T.change(doc.getElementById('uiAsOf'), ym);
      await settle();
    },
    errors: () => t.errors.filter(e => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click)/.test(String(e))),
  };
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  return T;
}
const file = n => [n.split('/').pop(), ab(join(FX, n))];
async function block(name, fn) {
  try { await fn(); } catch (e) { C.chk(name + ': the checks stopped part way: ' + String((e && e.stack) || e).split('\n').slice(0, 2).join(' | '), false); }
}

// ---------------------------------------------------------------------------------------------- reading a table
// a stoplight row: [Approved, Authorized, Obligated, Unobligated] (the cells carrying data-c, in order), then Obl %, OSD
// Goal %, Delta and Status as the last four cells (a TOTAL has its Obl % and three empty cells there)
function rowRead(tr) {
  const m = [...tr.querySelectorAll('td[data-c]')];
  const td = [...tr.querySelectorAll('td')];
  const tail = td.slice(-4);
  return { cents: m.slice(0, 4).map(x => Number(x.getAttribute('data-c'))), cells: m.slice(0, 4), obl: tail[0].textContent, status: tail[3].textContent,
    marks: m.slice(0, 2).map(x => (x.querySelector('.sect') ? '§' : '') + (x.querySelector('.dag') ? '†' : '') + (x.querySelector('.ddag') ? '‡' : '')) };
}
const wantMarks = mk => [mk.sect ? '§' : '', (mk.dagger ? '†' : '') + (mk.ddagger ? '‡' : '')];
// the Summary or an appropriation view's top table against the oracle's blocks
function topTable(where, main, X, keys) {
  const bad = [];
  for (const k of keys) {
    const x = X.blocks[k], tr = main.querySelector('table.top tr[data-bk="' + k + '"]');
    if (!tr) { bad.push(k + ' has no row'); continue; }
    const r = rowRead(tr);
    if (J(r.cents) !== J([x.approved, x.authorized, x.obligated, x.unobligated])) bad.push(k + ': ' + J(r.cents) + ' want ' + J([x.approved, x.authorized, x.obligated, x.unobligated]));
    if (!pClose(r.obl, x.oblPct)) bad.push(k + ': Obl % ' + r.obl + ' want ' + x.oblPct);
    if (flat(r.status) !== (x.status ? WORD[x.status] : '')) bad.push(k + ': status ' + r.status + ' want ' + x.status);
    if (J(r.marks) !== J(wantMarks(x.marks))) bad.push(k + ': marks ' + J(r.marks) + ' want ' + J(wantMarks(x.marks)));
  }
  C.chk(where + ': every row is the oracle’s, figures, status and marks', !bad.length, bad.slice(0, 6).join('; '));
}
function totalRow(where, main, t) {
  const tr = main.querySelector('table.top tr[data-bk=total]');
  const r = rowRead(tr);
  C.eq(where + ': the TOTAL is the oracle’s', r.cents, [t.approved, t.authorized, t.obligated, t.unobligated]);
  C.chk(where + ': the TOTAL’s Obl %', pClose(r.obl, t.oblPct), r.obl + ' want ' + t.oblPct);
  C.eq(where + ': the TOTAL carries each mark its rows carry', r.marks, wantMarks(t.marks));
}
// each mark the table prints is said under it, in the contract's words
function markNotes(where, main, marks) {
  const notes = [...main.querySelectorAll('.mark-note')].map(e => flat(e.textContent));
  const want = (marks.sect ? ['§ ' + SECT] : []).concat(marks.dagger ? ['† ' + DAG_BAE] : []).concat(marks.ddagger ? ['‡ ' + DDAG] : []);
  C.eq(where + ': under the table, a line for each mark used, in §14.5’s words', notes, want);
}
// a block's totals band (rule 6): Monthly Totals' Total is the plan, its Obligation % names the plan, and its Total column
// prints the plan's Obl %, goal and status
function band(where, sec, x, covered) {
  const rows = [...sec.querySelectorAll('tr.band')];
  const mt = rows.find(r => flat(r.querySelector('th').textContent) === 'Monthly Totals');
  const ob = rows.find(r => /^Obligation %/.test(flat(r.querySelector('th').textContent)));
  const st = rows.find(r => flat(r.querySelector('th').textContent) === 'OSD Status');
  const bad = [];
  if (!mt || !ob || !st) return C.chk(where + ': the totals band is there', false);
  const tds = r => [...r.querySelectorAll('td')];
  if (Number(tds(mt)[0].getAttribute('data-c')) !== x.slide.basis || Number(tds(mt).slice(-1)[0].getAttribute('data-c')) !== x.slide.basis) bad.push('Monthly Totals ' + tds(mt)[0].getAttribute('data-c') + ' want the plan ' + x.slide.basis);
  const lab = flat(ob.querySelector('th').textContent);
  const wantLab = 'Obligation % (' + (covered ? 'CCaR plan ' : 'Approved ') + mText(x.slide.basis) + 'M; actual through Oct, plan after)';
  if (lab !== wantLab) bad.push('label “' + lab + '” want “' + wantLab + '”');
  if (!pClose(tds(ob)[0].textContent, x.slide.oblPct)) bad.push('Obl % ' + tds(ob)[0].textContent + ' want the plan’s ' + x.slide.oblPct);
  if (flat(tds(st)[0].textContent) !== (x.slide.status ? WORD[x.slide.status] : '')) bad.push('status ' + tds(st)[0].textContent + ' want ' + x.slide.status);
  C.chk(where + ': the totals band measures the CCaR plan (rule 6)', !bad.length, bad.join('; '));
}
// review P4-2: a pull's section of What changed compares the pulls (SP.diffPulls: every row, no switches), so its figure is
// the CCaR plan. With a report loaded, Approved on every other view is the report's (§14.3, answer 2), so in a pull's
// section that figure is named the CCaR plan, and the view says why once: headed "Approved", O&M FY2026 read the plan
// under the word the Summary and the BAE section print as the report's. diff is the oracle's diffPulls, X the oracle's
// blocks for the report on screen; the figures are held to the oracle's plan, and the fixture is held to make the two differ.
function planSections(where, m, diff, X) {
  const notes = [...m.querySelectorAll('p.note.plan')].map(e => flat(e.textContent));
  C.eq(where + ': the view says once that a pull’s figures are the CCaR plan, and why', notes, [PLAN_NOTE]);
  for (const ap of Object.keys(diff)) {
    const sec = m.querySelector('section.chg[data-ap="' + ap + '"]');
    if (!sec) { C.chk(where + ': ' + ap + ' has a section', false); continue; }
    const [tot, by] = [...sec.querySelectorAll('table.grid')];
    const by0 = diff[ap].byBlock, ks = Object.keys(by0);
    const sum = k => ks.reduce((a, b) => a + by0[b].approved[k], 0);
    const cents = tr => [...tr.querySelectorAll('td[data-c]')].map(x => Number(x.getAttribute('data-c')));
    const totRows = [...tot.querySelectorAll('tbody tr')];
    C.eq(where + ': ' + ap + ' All FYs names its first figure the CCaR plan', totRows.map(tr => flat(tr.querySelector('th').textContent)), ['CCaR plan', 'Obligated']);
    C.eq(where + ': ' + ap + ' All FYs: the CCaR plan before, after and the change, every row of the two pulls', cents(totRows[0]), [sum(0), sum(1), sum(1) - sum(0)]);
    C.eq(where + ': ' + ap + ' by FY: the columns are the CCaR plan before and after', [...by.querySelectorAll('thead th')].map(e => flat(e.textContent)),
      ['FY', 'CCaR plan before', 'CCaR plan after', 'Change', 'Obligated before', 'Obligated after', 'Change']);
    const rows = [...by.querySelectorAll('tbody tr[data-bk]')];
    C.eq(where + ': ' + ap + ' by FY: and their figures are the pulls’ plans', Object.fromEntries(rows.map(tr => [tr.getAttribute('data-bk'), cents(tr).slice(0, 2)])),
      Object.fromEntries(ks.map(k => [k, by0[k].approved])));
    C.chk(where + ': ' + ap + ': the word Approved names no figure in a pull’s section', !/Approved/.test(tot.textContent + by.textContent), flat(tot.textContent + by.textContent).slice(0, 300));
  }
  // a fixture where the plan and the report's Approved agreed could not tell the two words apart
  const differ = Object.keys(diff).flatMap(ap => Object.keys(diff[ap].byBlock)).filter(k => X.blocks[k] && X.blocks[k].covered && X.blocks[k].approved !== diff[k.split('|')[0]].byBlock[k].approved[1]);
  C.chk(where + ': fixture: a covered block whose CCaR plan is not the report’s Approved', differ.length > 0);
}
const line2 = when => 'Data through Oct-2026 | Approved, Authorized = BAE report of ' + when + ' (sustainment budgets) | Obligated = CCaR status “Actual Execution”'
  + ' | Unobligated = Approved - Obligated | Delta = Obl% - OSD%';

try {
  // ===================================================================================================================
  // bae-all — the pull and the report through the Import button, every view against the oracle
  // ===================================================================================================================
  const X = O.all;
  const keys = Object.keys(X.blocks);
  await block('bae-all', async () => {
    const T = await boot();
    await T.pick([file('pull-all.xlsx'), file('bae.xlsx')]);
    await T.asOf('2026-10');
    // §14.7 the rows COUNTED, as the BAE Report sheet's Counted column says Yes, never the rows read and the whole report's money (review I4-6)
    const yes = X.bae.counted.filter(x => x[1] === 'Yes').length;
    C.chk('import: the message names the report and the rows it counts', T.msg().includes('Imported the BAE report “bae.xlsx” › “Sheet1”, which has no date in its file name: 119 rows, '
      + yes + ' of them counted (sustainment budgets of FY2025 or later); not counted: ') && yes > 0 && yes < 119 && !/Approved \$/.test(T.msg()), T.msg());
    const at = T.SP.state.bae.current.importedAt;
    const top = flat(T.doc.getElementById('uiPulls').textContent);
    C.chk('top bar: names the report, the day it came in, and that its name has no date', top.endsWith('· BAE report “bae.xlsx” imported ' + day(at) + ' (no date in its file name)'), top);

    // ------------------------------------------------------------- Summary
    let m = await T.view('summary');
    C.eq('summary: line 2 (§14.5)', flat(m.querySelector('p.l2').textContent), line2(day(at)));
    C.eq('summary: one row per block, the oracle’s blocks', [...m.querySelectorAll('table.top tr[data-bk]')].map(r => r.getAttribute('data-bk')).filter(k => k !== 'total'), keys);
    topTable('summary', m, X, keys);
    totalRow('summary', m, X.summary);
    markNotes('summary', m, X.summary.marks);
    C.chk('fixture: the report leaves blocks uncovered, so § and † are there to see', X.bae.uncovered.length > 0 && X.summary.marks.sect && X.summary.marks.dagger);
    const notes = [...m.querySelectorAll('ul.notes li')].map(e => flat(e.textContent));
    const unc = X.bae.uncovered.map(u => AP[u.ap] + ' FY' + u.fy);
    const uncWant = 'The BAE report has no figure for ' + (unc.length > 1 ? unc.slice(0, -1).join(', ') + ' and ' + unc[unc.length - 1] : unc[0]) + ': Approved there is the CCaR plan (marked §).';
    C.chk('summary notes: the blocks the report has no figure for (§)', notes.includes(uncWant), uncWant + ' | ' + notes.join(' / '));
    C.chk('fixture: the report has planShort blocks', X.bae.planShort.length > 0);
    for (const p of X.bae.planShort) {
      const want = AP[p.ap] + ' FY' + p.fy + ': the CCaR plan ($' + mText(p.planned) + 'M) is ' + Math.round(100 * p.planned / p.approved) + '% of the BAE report’s Approved ($'
        + mText(p.approved) + 'M); Obl % is measured against the report’s figure.';
      C.chk('summary notes: ' + p.ap + '|' + p.fy + ' is flagged, its plan under half the report’s Approved (rule 5)', notes.includes(want), want);
    }
    C.chk('summary notes: the report itself, by its date and file', notes.some(n => n.startsWith('Approved and Authorized come from the BAE report of ' + day(at) + ' (bae.xlsx)')), notes[0]);
    // review M4-6: each covered block whose plan and Obligated count money its Approved can never hold, named
    C.chk('fixture: a covered block counts money on a budget that names no appropriation', X.bae.offReport.length > 0);
    for (const o of X.bae.offReport) {
      const W = { flyaway: ['Flyaway (production) budget', 'Flyaway (production) budgets'], noap: ['budget that names no appropriation', 'budgets that name no appropriation'],
        blank: ['row with no Budget', 'rows with no Budget'] };
      const w = [];
      for (const k of ['flyaway', 'noap', 'blank']) {
        const of = o.budgets.filter(b => b.kind === k), c = k === 'blank' ? of.reduce((x, b) => x + b.rows, 0) : of.length;
        if (c) w.push(c + ' ' + W[k][c === 1 ? 0 : 1]);
      }
      const want = AP[o.ap] + ' FY' + o.fy + ': the CCaR plan counts $' + mText(o.planned) + 'M on ' + (w.length > 1 ? w.slice(0, -1).join(', ') + ' and ' + w[w.length - 1] : w[0])
        + ', which the BAE report’s Approved leaves out' + (o.obligated !== 0 ? '; $' + mText(o.obligated) + 'M of it is obligated, so Obligated and Obl % count money that Approved does not.'
          : ', so the plan counts money that Approved does not.') + ' See the Import report.';
      C.chk('summary notes: ' + o.ap + '|' + o.fy + ' names the money its Approved leaves out (M4-6)', notes.includes(want), want + ' | ' + notes.join(' / '));
    }
    // §16.2 the report money no plan event uses, from the oracle
    const unS = X.bae.unassigned.filter(u => u.approved !== 0 || u.authorized !== 0);
    C.eq('summary notes: the report money no plan event uses, so the PMO tabs add up to the Summary less it (§16.2)', notes.filter(n => n.startsWith('The PMO tabs share')),
      unS.length ? ['The PMO tabs share each budget’s Approved and Authorized among the PMOs whose plan events use it, by their CCaR plan on it. '
        + unS.map(u => AP[u.ap] + ' FY' + u.fy + ' $' + mText(u.approved) + 'M').join('; ') + ' of the BAE report’s Approved is on budgets no plan event uses, so the PMO tabs add up to the Summary less it.'] : []);

    // ------------------------------------------------------------- appropriation views
    for (const ap of Object.keys(AP)) {
      const ks = keys.filter(k => k.startsWith(ap + '|'));
      if (!ks.length) continue;
      m = await T.view(ap);
      // its table is the report's figures, so its title names the report beside the pull, as the workbook's does (BP4-1)
      C.eq(AP[ap] + ' view: the title names both sources of its figures (BP4-1)', flat(m.querySelector('h2.title').textContent), 'F-35 Sustainment ' + AP[ap]
        + ' - Spend Plan & FY Summary (from the CCaR pull imported ' + day(T.SP.state.pulls.current[ap].importedAt) + ' and the BAE report of ' + day(T.SP.state.bae.current.importedAt) + ')');
      topTable(AP[ap] + ' view', m, X, ks);
      totalRow(AP[ap] + ' view', m, X.aps[ap]);
      markNotes(AP[ap] + ' view', m, X.aps[ap].marks);
      for (const k of ks) {
        const sec = secBy(m, 'blk-sec', AP[ap] + ' FY' + k.split('|')[1]);
        if (!sec) { C.chk(k + ': its tree is drawn', false); continue; }
        band(AP[ap] + ' ' + k, sec, X.blocks[k], X.blocks[k].covered);
      }
    }

    // ------------------------------------------------------------- slide blocks, on the plan
    m = await T.view('slides');
    for (const k of keys) {
      const [ap, fy] = k.split('|');
      const sec = secBy(m, 'slide', AP[ap] + ' FY' + fy);
      if (!sec) { C.chk('slides: ' + k + ' is drawn', false); continue; }
      band('slides ' + k, sec, X.blocks[k], X.blocks[k].covered);
      const pmoSum = [...sec.querySelectorAll('tr.pmo')].reduce((a, r) => a + Number(r.querySelector('td[data-c]').getAttribute('data-c')), 0);
      C.chk('slides ' + k + ': the PMO rows add to the plan, as before §14', pmoSum === X.blocks[k].planned, pmoSum + ' want ' + X.blocks[k].planned);
    }
    C.eq('slides: the view says the blocks measure the CCaR plan, in the workbook’s words (P4-6)', flat((m.querySelector('p.bae-plan') || {}).textContent || ''), SLIDE_NOTE);

    // ------------------------------------------------------------- PMO tabs
    m = await T.view('pmos');
    const sel = () => T.main().querySelector('select[data-act=pmo]');
    const labels = [...sel().options].map(o => o.textContent);
    C.eq('PMOs: a tab for every PMO the oracle has, and no other', labels.slice().sort(), Object.keys(X.pmoTabs).sort());
    let unSeen = false, offSeen = false;
    for (const label of labels) {
      const o = [...sel().options].find(x => x.textContent === label);
      T.change(sel(), o.value);
      await settle();
      m = T.main();
      const tab = X.pmoTabs[label] || {};
      const bad = [];
      for (const [k, x] of Object.entries(tab)) {
        const tr = m.querySelector('table.top tr[data-bk="' + k + '"]');
        if (!tr) { bad.push(k + ' has no row'); continue; }
        const r = rowRead(tr);
        if (J(r.cents) !== J([x.approved, x.authorized, x.obligated, x.unobligated])) bad.push(k + ': ' + J(r.cents) + ' want ' + J([x.approved, x.authorized, x.obligated, x.unobligated]));
        if (!pClose(r.obl, x.oblPct) || flat(r.status) !== (x.status ? WORD[x.status] : '')) bad.push(k + ': Obl % / status ' + r.obl + ' ' + r.status);
        const mk = x.basis === 'row' ? ['§', '†'] : ['', ''];
        if (J(r.marks) !== J(mk)) bad.push(k + ': marks ' + J(r.marks) + ' want ' + J(mk));
        const [ap, fy] = k.split('|');
        const sec = secBy(m, 'blk-sec', AP[ap] + ' FY' + fy);
        const strip = sec && sec.querySelector('tr.strip td');
        const nums = strip ? [...flat(strip.textContent).matchAll(/(Approved|Authorized|Obligated|Unobligated) (\S+)M/g)].map(z => z[2]) : [];
        if (nums.length !== 4 || ![x.approved, x.authorized, x.obligated, x.unobligated].every((c, i) => mClose(nums[i], c))) bad.push(k + ': strip ' + (strip && flat(strip.textContent)));
        // the strip prints the row above with that row's marks, as the workbook's strip does: § and † on a block the report
        // has no figure for (review M4-5, P4-5). Read as the words on screen, so a mark left off cannot pass by the regex above
        const wantStrip = AP[ap] + ' FY' + fy + ' Summary | Approved ' + mText(x.approved) + 'M' + mk[0] + ' | Authorized ' + mText(x.authorized) + 'M' + mk[1]
          + ' | Obligated ' + mText(x.obligated) + 'M | Unobligated ' + mText(x.unobligated) + 'M';
        if (!strip || flat(strip.textContent) !== wantStrip) bad.push(k + ': strip “' + (strip && flat(strip.textContent)) + '” want “' + wantStrip + '”');
        const mt = sec && [...sec.querySelectorAll('tr.band')].find(r2 => flat(r2.querySelector('th').textContent) === 'Monthly Totals');
        if (!mt || Number(mt.querySelector('td[data-c]').getAttribute('data-c')) !== x.planned) bad.push(k + ': its totals band is not the plan by its PMO column');
      }
      C.chk('PMO ' + label + ': every row, strip and totals band is the oracle’s (§16.1)', !bad.length, bad.slice(0, 4).join('; '));
      const ns = [...m.querySelectorAll('p.note')].map(e => flat(e.textContent));
      const anyPE = Object.values(tab).some(x => x.basis === 'planEvent'), anyRow = Object.values(tab).some(x => x.basis === 'row');
      // §16.2: every tab, (no PMO) too, says the same of a covered row (§14.4's sentences on budget names went with rules 4
      // and 7), then the report money no plan event uses on the blocks it shows, in the tab's order, when there is some
      C.chk('PMO ' + label + ': says what its figures count, only where a row is on its plan events (§16.2)', ns.includes(PE_LINE) === anyPE
        && !ns.some(n => /end(s)? in (this|any) PMO’s code/.test(n)), ns.join(' / '));
      const rowK = [...m.querySelectorAll('table.top tr[data-bk]')].map(r => r.getAttribute('data-bk'));
      const unK = X.bae.unassigned.filter(u => (u.approved !== 0 || u.authorized !== 0) && tab[u.ap + '|' + u.fy] && tab[u.ap + '|' + u.fy].basis === 'planEvent');
      C.eq('PMO ' + label + ': names the report money no plan event uses on its blocks, only where there is some (§16.2)', ns.filter(n => n.endsWith('on no PMO tab (see the Import report).')),
        unK.length ? [unK.map(u => AP[u.ap] + ' FY' + u.fy + ' $' + mText(u.approved) + 'M').join('; ') + ' of the BAE report’s Approved is on budgets no plan event uses; it is in the Summary and on no PMO tab (see the Import report).'] : []);
      if (unK.length) unSeen = true;
      // review M4-6: the Obligated its Approved leaves out, block by block in the tab's order, only where there is some
      const offK = rowK.filter(k => tab[k] && tab[k].basis === 'planEvent' && tab[k].offObligated !== 0);
      C.eq('PMO ' + label + ': names the Obligated its Approved leaves out, only where there is some (M4-6)', ns.filter(n => n.startsWith('Obligated includes money executed')),
        offK.length ? ['Obligated includes money executed on budgets the BAE report’s Approved leaves out (Flyaway (production), a budget that names no appropriation, or no Budget at all): '
          + offK.map(k => AP[k.split('|')[0]] + ' FY' + k.split('|')[1] + ' $' + mText(tab[k].offObligated) + 'M').join('; ') + '. Obl % there counts it against an Approved that does not.'] : []);
      if (offK.length) offSeen = true;
      C.chk('PMO ' + label + ': never says every PMO row shows Approved', !ns.includes('Authorized is entered by appropriation and FY; a PMO row shows Approved.')
        && ns.some(n => n === 'Authorized is entered by appropriation and FY; where the BAE report has no figure for a block, its PMO row shows Approved.') === anyRow, ns.join(' / '));
    }

    C.chk('fixture: a PMO tab names the Obligated its Approved leaves out, and one the money no plan event uses, so both lines are there to see', offSeen && unSeen);

    // ------------------------------------------------------------- Import report
    m = await T.view('report');
    const rep = flat(m.textContent);
    C.chk('Import report: the report’s own section (file, sheet, total check)', /BAE report of budgets: “bae\.xlsx” › “Sheet1”/.test(rep) && /it agrees \(within \$1 each\)/.test(rep));
    const R = m.querySelector('section.baeread');
    C.chk('Import report: a section on the report as the figures read it', !!R);
    if (R) {
      const n = s => Number((flat(R.querySelector('li[data-scope=' + s + ']').textContent).match(/: ([\d,]+) rows?/) || [, 'NaN'])[1].replace(/,/g, ''));
      C.eq('Import report: rows by scope (in, Flyaway, naming no appropriation, unreadable)', ['in', 'flyaway', 'noap', 'bad'].map(n), [X.bae.rows.in, X.bae.rows.flyaway, X.bae.rows.noap, X.bae.rows.bad]);
      const by = [...R.querySelectorAll('table.baeblocks tr[data-bk]')];
      C.eq('Import report: in-scope Approved and Authorized by appropriation and FY, every service and lane', sorted(Object.fromEntries(by.map(tr =>
        [tr.getAttribute('data-bk'), (([a, u]) => ({ approved: a, authorized: u }))([...tr.querySelectorAll('td[data-c]')].map(x => Number(x.getAttribute('data-c'))))]))), sorted(X.bae.byBlock));
      C.eq('Import report: in model order', by.map(tr => tr.getAttribute('data-bk')), byModel(Object.keys(X.bae.byBlock)));
      C.eq('Import report: the planShort blocks are flagged', [...R.querySelectorAll('ul.planshort li')].map(e => e.getAttribute('data-bk')), X.bae.planShort.map(p => p.ap + '|' + p.fy));
      C.eq('Import report: the budgets the pull counts with no report row', [...R.querySelectorAll('ul.pullonly li')].map(e => normKey(e.textContent)), X.bae.pullOnly);
      C.eq('Import report: the report’s in-scope budgets with money and no pull row', [...R.querySelectorAll('ul.reportonly li')].map(e => normKey(e.textContent)), X.bae.reportOnly);
      // review M4-6: the money a covered block's plan and Obligated count that its Approved never can, budget by budget
      const KIND = { flyaway: 'Flyaway (production)', noap: 'Names no appropriation', blank: 'No Budget' };
      const offWant = X.bae.offReport.flatMap(o => o.budgets.map(b => [o.ap + '|' + o.fy, b.kind, AP[o.ap] + ' FY' + o.fy + ': ' + (b.name === '' ? '(no Budget, ' + b.rows + (b.rows === 1 ? ' row)' : ' rows)') : b.name)
        + ' (' + KIND[b.kind] + '): CCaR plan $' + mText(b.planned) + 'M, obligated $' + mText(b.obligated) + 'M.']));
      C.eq('Import report: the budgets a covered block counts that its Approved leaves out, each with its block, kind, plan and obligations (M4-6)',
        [...R.querySelectorAll('ul.offreport li')].map(e => [e.getAttribute('data-bk'), e.getAttribute('data-kind'), flat(e.textContent)]), offWant);
      const offH = [...R.querySelectorAll('h4.sub')].find(h => /which its Approved leaves out/.test(h.textContent));
      C.chk('Import report: … under a heading that counts them', !!offH && offH.getAttribute('data-n') === String(offWant.length) && flat(offH.textContent).endsWith(': ' + offWant.length), offH && offH.outerHTML);
      // §16.2 the two lists on how the PMO tabs share the report, in the oracle's figures and the sheet's words
      const spWant = X.bae.split.map(e => [e.ap + '|' + e.fy, e.key, null, AP[e.ap] + ' FY' + e.fy + ': “' + e.name + '” (' + figs16(e) + '), by each PMO’s CCaR plan on it, largest share first: '
        + e.pmos.map(p => p.pmo + ', plan ' + usd16(p.plan) + ': ' + figs16(p)).join('; ') + '.']);
      const unWant = X.bae.unassigned.flatMap(u => u.budgets.map(t => [u.ap + '|' + u.fy, t.key, t.why, AP[u.ap] + ' FY' + u.fy + ': “' + t.name + '” (' + figs16(t) + '): '
        + (t.why === 'nopull' ? 'no plan event uses it in this block' : 'its plan events’ plan is not above zero') + '.']));
      const items = cls => [...R.querySelectorAll('ul.' + cls + ' li')].map(e => [e.getAttribute('data-bk'), e.getAttribute('data-key'), e.getAttribute('data-why'), flat(e.textContent)]);
      C.eq('Import report: the budgets split among PMOs by their plan events, each PMO’s plan and shares (§16.2)', items('pmosplit'), spWant);
      C.eq('Import report: the report money no plan event uses, each budget and why (§16.2)', items('unassigned'), unWant);
      C.chk('fixture: both §16 lists hold something', spWant.length > 0 && unWant.length > 0);
      for (const [re, n] of [[/^Budgets split among PMOs by their plan events/, spWant.length], [/^BAE report money no plan event uses \(on no PMO tab\)/, unWant.length]]) {
        const h = [...R.querySelectorAll('h4.sub')].find(x => re.test(flat(x.textContent)));
        C.chk('Import report: … each under a heading that counts it (§16.2)', !!h && h.getAttribute('data-n') === String(n) && flat(h.textContent).endsWith(': ' + n), h && h.outerHTML);
      }
      C.chk('Import report: the rule says a PMO’s row takes the budgets its plan events use (§16.2), never a budget’s name', flat(R.querySelector('p.l2').textContent)
        .includes('A PMO’s row takes the budgets its plan events are assigned to; a budget the plan events of several PMOs use is split among them by each one’s CCaR plan on it')
        && !/name ends in/.test(R.querySelector('p.l2').textContent), flat(R.querySelector('p.l2').textContent));
    }
    C.chk('Import report: no report is said to be kept from an earlier import (the last import brought it)', !/from an earlier import/.test(rep));

    // ------------------------------------------------------------- Settings
    m = await T.view('settings');
    C.chk('Settings: the report, its file and its date', /File “bae\.xlsx”, sheet “Sheet1”\./.test(flat(m.textContent)) && /No date in its file name/.test(flat(m.textContent)));
    C.eq('Settings: the Authorized table is Block, Typed, BAE report, Used', [...m.querySelectorAll('table.authbae thead th')].map(e => e.textContent), ['Block', 'Typed ($M)', 'BAE report ($M)', 'Used ($M)']);
    const bad = [];
    for (const k of keys) {
      const x = X.blocks[k], tr = m.querySelector('table.authbae tr[data-bk="' + k + '"]');
      if (!tr) { bad.push(k + ' has no row'); continue; }
      const td = [...tr.querySelectorAll('td')];
      const repC = td[1], used = td[2];
      if (x.covered ? Number(repC.getAttribute('data-c')) !== x.authorized : flat(repC.textContent) !== 'no figure') bad.push(k + ': BAE report cell ' + flat(repC.textContent));
      if (Number(used.getAttribute('data-c')) !== x.authorized) bad.push(k + ': Used ' + used.getAttribute('data-c') + ' want ' + x.authorized);
      if (used.getAttribute('data-src') !== (x.authorizedSrc === 'report' ? 'BAE report' : 'Approved')) bad.push(k + ': source ' + used.getAttribute('data-src'));
      if (!!used.querySelector('.dag') !== x.marks.dagger) bad.push(k + ': † on Used');
      if (td[0].querySelector('input').value !== '') bad.push(k + ': a box holds a figure nobody typed');
    }
    C.chk('Settings: each block’s BAE report figure and the figure used are the oracle’s', !bad.length, bad.slice(0, 5).join('; '));

    // ------------------------------------------------------------- What changed
    m = await T.view('changes');
    const lis = [...m.querySelectorAll('ul.notes li')].map(e => flat(e.textContent));
    C.chk('What changed: the import is named with its BAE report', lis.length === 1 && lis[0].endsWith(': O&M, Full Fund, Initial Spares, OPN, BAE report ('
      + (X.bae.rows.in + X.bae.rows.flyaway + X.bae.rows.noap) + ' readable rows)'), J(lis));
    C.chk('What changed: only one BAE report so far', /Only one BAE report so far\./.test(flat(m.querySelector('section.chg[data-ap=bae]') && m.querySelector('section.chg[data-ap=bae]').textContent)));
    T.click(T.doc.querySelector('[data-act=help]'));
    await settle();
    const help = [...T.main().querySelectorAll('h3.sub')].find(h => h.textContent === 'The BAE report of budgets');
    C.chk('Help: a section on the BAE report, ending with what happens with none', !!help && /With no BAE report loaded, nothing on any view changes\.$/.test(flat(help.nextElementSibling.textContent)));
    C.chk('Help: a PMO’s tab is built from its plan events, a budget several PMOs use split by their CCaR plan, never by a budget’s name (§16.2)', !!help
      && flat(help.nextElementSibling.textContent).includes('A PMO’s tab is built from its plan events')
      && flat(help.nextElementSibling.textContent).includes('A budget the plan events of several PMOs use is split among them by each one’s CCaR plan on it, to the cent.')
      && flat(help.nextElementSibling.textContent).includes('Report money no plan event uses')
      && !/name ends in/.test(help.nextElementSibling.textContent), help && flat(help.nextElementSibling.textContent).slice(0, 300));
    // §16.2: the README gives the same account (rules 4 and 7 replaced)
    const rd = readFileSync(join(HERE, '..', 'README.md'), 'utf8').replace(/\s+/g, ' ');
    C.chk('README: a PMO’s row is built from its plan events, a shared budget split by each PMO’s CCaR plan, and the money no plan event uses named (§16.2)',
      rd.includes('**A PMO\'s row is built from its plan events**') && rd.includes('**A budget several PMOs use is split** among them by each one\'s CCaR plan on it')
      && rd.includes('**Report money no plan event uses**') && rd.includes('*No plan event uses it*') && !/counts the budgets whose name ends in/.test(rd));
    C.chk('Help: a pull’s section of What changed is said to be the CCaR plan (review P4-2)', !!help
      && flat(help.nextElementSibling.textContent).includes('What changed compares the pulls themselves, so a pull’s section there names its figures the CCaR plan, never Approved.'));
    T.click(T.doc.querySelector('[data-act=help]'));
    await settle();
    C.eq('bae-all: no script error on any view', T.errors(), []);
    T.t.close();
  });

  // ===================================================================================================================
  // bae-entered — Authorized typed in Settings wins over the report (rule 8); the switches; cleared back to the report's
  // ===================================================================================================================
  await block('bae-entered', async () => {
    const T = await boot();
    await T.pick([file('pull-all.xlsx'), file('bae.xlsx')]);
    await T.asOf('2026-10');
    const E = O.entered, typed = E.input.authorized;
    C.chk('fixture: one figure typed on a covered block and one on a block the report has no figure for', E.blocks['om|2026'].covered && !E.blocks['sp|2025'].covered && J(Object.keys(typed).sort()) === J(['om|2026', 'sp|2025']));
    await T.view('settings');
    const box = k => T.main().querySelector('table.authbae tr[data-bk="' + k + '"] input[data-act=auth]');
    T.change(box('om|2026'), String(typed['om|2026'] / 1e8));
    await settle();
    C.eq('typing on a covered block: the message names the block, the figure and the report’s it replaces', T.msg(),
      'Authorized for O&M FY2026 set to $' + mText(typed['om|2026']) + 'M; it is used in place of the BAE report’s $' + mText(O.all.blocks['om|2026'].authorized) + 'M.');
    T.change(box('sp|2025'), String(typed['sp|2025'] / 1e8));
    await settle();
    C.eq('typing on a block the report has no figure for: the message names the block', T.msg(), 'Authorized for Initial Spares FY2025 set to $' + mText(typed['sp|2025']) + 'M.');
    C.chk('typing marks the file unsaved', T.doc.getElementById('uiSave').textContent === 'Unsaved changes');
    const used = k => T.main().querySelector('table.authbae tr[data-bk="' + k + '"] td.used');
    C.eq('Settings: Used is the typed figure, said to be typed', ['om|2026', 'sp|2025'].map(k => [Number(used(k).getAttribute('data-c')), used(k).getAttribute('data-src')]),
      [[typed['om|2026'], 'typed'], [typed['sp|2025'], 'typed']]);
    C.chk('Settings: the BAE report column still shows the report’s figure beside a typed one', Number(T.main().querySelector('table.authbae tr[data-bk="om|2026"] td[data-c]').getAttribute('data-c')) === O.all.blocks['om|2026'].authorized);
    let m = await T.view('summary');
    topTable('bae-entered summary', m, E, Object.keys(E.blocks));
    totalRow('bae-entered summary', m, E.summary);
    markNotes('bae-entered summary', m, E.summary.marks);
    // the PMO tab of a PMO with a budget row on the typed block says the typed figure is never split
    const pmoTyped = Object.keys(E.pmoTabs).find(l => E.pmoTabs[l]['om|2026'] && E.pmoTabs[l]['om|2026'].basis === 'planEvent');
    m = await T.view('pmos');
    const sel = T.main().querySelector('select[data-act=pmo]');
    T.change(sel, [...sel.options].find(o => o.textContent === pmoTyped).value);
    await settle();
    m = T.main();
    C.chk('PMO ' + pmoTyped + ': its row of the typed block keeps the report’s Authorized (never split)', Number(rowRead(m.querySelector('table.top tr[data-bk="om|2026"]')).cents[1]) === E.pmoTabs[pmoTyped]['om|2026'].authorized);
    C.chk('PMO ' + pmoTyped + ': and says so under its table', [...m.querySelectorAll('p.note')].some(e => flat(e.textContent) === 'Authorized is entered for O&M FY2026 as a whole and is never split among the PMOs: this tab shows the BAE report’s Authorized for that block.'));
    // USN off: the typed figures cover every service and lane, so they are marked ‡ (bae-entered-off)
    T.change(T.doc.querySelector('input[data-act=svc][data-i="5"]'), false);
    await settle();
    m = await T.view('summary');
    const EO = O.enteredOff;
    C.chk('fixture: with USN off, the typed figures carry ‡', EO.blocks['om|2026'].marks.ddagger && EO.blocks['sp|2025'].marks.ddagger);
    topTable('bae-entered, USN off, summary', m, EO, Object.keys(EO.blocks));
    totalRow('bae-entered, USN off, summary', m, EO.summary);
    markNotes('bae-entered, USN off, summary', m, EO.summary.marks);
    // review P4-4: the Import report's flags follow the switches (§14.8); under a switch each list that does says so, and so
    // do the heading and the remark beside a flagged block, which was "under half of it" of a figure that covers every service
    const swNote = 'Counted with the switches as they are: a block’s Approved and its CCaR plan count only the services and lanes shown, so a switch can flag a block here or take its flag away.';
    const readRep = R => ({ heading: flat((R.querySelector('p.shown') || {}).textContent || ''), notes: [...R.querySelectorAll('section.baeread p.note')].map(e => flat(e.textContent)),
      flagged: [...R.querySelectorAll('ul.planshort li')].map(e => e.getAttribute('data-bk')),
      remarks: [...R.querySelectorAll('table.baeblocks tr[data-bk]')].map(r => [r.getAttribute('data-bk'), flat(r.lastElementChild.textContent)]).filter(([, t]) => /under half/.test(t)) });
    let rp = readRep(await T.view('report'));
    C.chk('fixture: USN off moves the flags, so what follows the switches can be told from what does not', J(EO.bae.planShort.map(p => p.ap + '|' + p.fy)) !== J(O.all.bae.planShort.map(p => p.ap + '|' + p.fy)));
    C.eq('Import report, USN off: the flagged blocks are the switches’ (§14.8)', rp.flagged, EO.bae.planShort.map(p => p.ap + '|' + p.fy));
    C.chk('Import report, USN off: the flags say they are counted with the switches as they are (P4-4)', rp.notes.includes(swNote), J(rp.notes));
    C.eq('Import report, USN off: beside a flagged block, the remark is said of the block as the switches leave it (P4-4)', rp.remarks,
      EO.bae.planShort.map(p => [p.ap + '|' + p.fy, 'Its figures fill this block (with the switches as they are, the CCaR plan is under half the block’s Approved)']));
    C.chk('Import report, USN off: the heading names the lists the switches count (P4-4)', rp.heading.startsWith('This view shows every row, whatever the switches: it covers every row each file held, '
      + 'except the BAE report’s lists that say they are counted with the switches as they are.'), rp.heading);
    T.change(T.doc.querySelector('input[data-act=svc][data-i="5"]'), true);
    await settle();
    rp = readRep(await T.view('report'));
    C.chk('Import report, every switch on: no switch note, and the remark as before (P4-4)', !rp.notes.includes(swNote) && rp.heading === ''
      && J(rp.remarks) === J(O.entered.bae.planShort.map(p => [p.ap + '|' + p.fy, 'Its figures fill this block (the CCaR plan is under half of it)'])), J(rp));
    // cleared: back to the report's figure, or to Approved where the report has none
    await T.view('settings');
    T.change(box('om|2026'), '');
    await settle();
    C.eq('clearing a covered block: back to the report’s figure, said with it', T.msg(), 'Authorized for O&M FY2026 cleared; the BAE report’s figure, $' + mText(O.all.blocks['om|2026'].authorized) + 'M, is used again.');
    T.change(box('sp|2025'), '');
    await settle();
    C.eq('clearing a block the report has no figure for: Approved stands in, said so', T.msg(), 'Authorized for Initial Spares FY2025 cleared; the BAE report has no figure for it, so Approved is shown in its place.');
    m = await T.view('summary');
    topTable('cleared again: summary', m, O.all, Object.keys(O.all.blocks));
    totalRow('cleared again: summary', m, O.all.summary);
    C.eq('bae-entered: no script error', T.errors(), []);
    T.t.close();
  });

  // ===================================================================================================================
  // bae-gen2 — a second report replaces the first: What changed's BAE section (SP.diffBae)
  // ===================================================================================================================
  await block('bae-gen2', async () => {
    const T = await boot();
    await T.pick([file('pull-all.xlsx'), file('bae.xlsx')]);
    await T.pick([file('gen2/pull-om.xlsx'), file('gen2/pull-ff.csv'), file('gen2/bae.xlsx')]);
    await T.asOf('2026-10');
    const G = O.gen2, D = G.diffBae;
    let m = await T.view('summary');
    const bad = Object.keys(G.blocks).filter(k => { const tr = m.querySelector('table.top tr[data-bk="' + k + '"]'); return !tr || rowRead(tr).cents[0] !== G.blocks[k].approved || rowRead(tr).cents[1] !== G.blocks[k].authorized; });
    C.chk('gen2 summary: Approved and Authorized are the new report’s', !bad.length, bad.join(', '));
    m = await T.view('changes');
    const lis = [...m.querySelectorAll('ul.notes li')].map(e => flat(e.textContent));
    C.chk('What changed: the second import is named with its BAE report', lis.length === 2 && / O&M, Full Fund, BAE report \(\d+ readable rows\)$/.test(lis[1]), J(lis));
    planSections('bae-gen2 What changed (P4-2)', m, G.diff, G);
    const S = m.querySelector('section.chg[data-ap=bae]');
    C.chk('What changed: a section for the BAE report', !!S);
    if (!S) return;
    C.chk('What changed: headed by the two reports, file and import', /^BAE report: imported .+ \(“bae\.xlsx”\) → imported .+ \(“bae\.xlsx”\)$/.test(flat(S.querySelector('h3.bar').textContent)), S.querySelector('h3.bar').textContent);
    const rows = [...S.querySelectorAll('table.baeby tr[data-bk]')];
    C.eq('What changed: Approved and Authorized before and after per appropriation and FY, in model order', rows.map(tr => tr.getAttribute('data-bk')), byModel(Object.keys(D.byBlock)));
    C.eq('What changed: and their figures', sorted(Object.fromEntries(rows.map(tr => { const c = [...tr.querySelectorAll('td[data-c]')].map(x => Number(x.getAttribute('data-c'))); return [tr.getAttribute('data-bk'), { approved: [c[0], c[1]], authorized: [c[3], c[4]] }]; }))), sorted(D.byBlock));
    C.chk('What changed: each change column is after less before', rows.every(tr => { const c = [...tr.querySelectorAll('td[data-c]')].map(x => Number(x.getAttribute('data-c'))); return c[2] === c[1] - c[0] && c[5] === c[4] - c[3]; }));
    const sum = (f, k) => Object.values(D.byBlock).reduce((a, x) => a + x[f][k], 0);
    C.eq('What changed: the All FYs totals', [...S.querySelectorAll('table.baetot td[data-c]')].map(x => Number(x.getAttribute('data-c'))),
      [sum('approved', 0), sum('approved', 1), sum('approved', 1) - sum('approved', 0), sum('authorized', 0), sum('authorized', 1), sum('authorized', 1) - sum('authorized', 0)]);
    C.chk('fixture: gen2 has budgets new, gone and changed, and budgets with a row that could not be read', D.budgetsNew.length && D.budgetsGone.length
      && D.budgetsChanged.length && D.budgetsUnread.length && D.unread[1]);
    // review I4-3: the rows that could not be read are counted on the view, as a pull's are, and their budgets listed apart
    const un = S.querySelector('p.note.unread');
    C.chk('What changed: the rows of either report that could not be read are counted there', un && un.getAttribute('data-unread') === D.unread.join('|')
      && flat(un.textContent).startsWith(D.unread[1] + (D.unread[1] === 1 ? ' row' : ' rows') + ' of this report’s sustainment budgets and ' + D.unread[0]
        + (D.unread[0] === 1 ? ' row' : ' rows') + ' of the earlier one’s could not be read'), un && un.textContent);
    for (const [kind, list] of [['new', D.budgetsNew], ['gone', D.budgetsGone], ['changed', D.budgetsChanged], ['unread', D.budgetsUnread]]) {
      const h = S.querySelector('h4[data-list="bae-' + kind + '"]');
      C.chk('What changed: the count of budgets ' + kind, h && Number(h.getAttribute('data-n')) === list.length && new RegExp(': ' + list.length + '$').test(flat(h.textContent)), h && h.textContent);
      const btn = () => T.doc.querySelector('[data-fkey="diff:bae|' + kind + '"]');
      C.chk('What changed: budgets ' + kind + ' start folded', btn() && btn().getAttribute('aria-expanded') === 'false' && !S.querySelector('table[data-budgets=' + kind + ']'));
      T.click(btn());
      await settle();
      const tb = T.main().querySelector('section.chg[data-ap=bae] table[data-budgets=' + kind + ']');
      C.chk('What changed: Show opens the budgets ' + kind, !!tb && btn().getAttribute('aria-expanded') === 'true');
      if (!tb) continue;
      const got = [...tb.querySelectorAll('tbody tr')].map(tr => { const c = [...tr.querySelectorAll('td[data-c]')].map(x => Number(x.getAttribute('data-c'))); return { key: normKey(tr.querySelector('td').textContent), approved: [c[0], c[1]], authorized: [c[3], c[4]] }; });
      C.eq('What changed: the budgets ' + kind + ', largest change first, with their figures', got, list.map(e => ({ key: e.key, approved: e.approved, authorized: e.authorized })));
      if (kind === 'unread') {
        C.eq('What changed: each budget listed apart says how many of its rows each report could not read',
          [...tb.querySelectorAll('tbody tr td.what')].map(td => flat(td.textContent).replace(/;.*$/, '')), list.map(e => 'Rows that could not be read: ' + e.unread[0] + ' → ' + e.unread[1]));
      }
      T.click(btn());
      await settle();
      C.chk('What changed: Hide folds the budgets ' + kind + ' again', !T.main().querySelector('section.chg[data-ap=bae] table[data-budgets=' + kind + ']'));
    }
    m = await T.view('settings');
    C.chk('Settings: the report it replaced is kept for What changed', /The report it replaced, imported .+ \(“bae\.xlsx”\), is kept for What changed\./.test(flat(m.textContent)));
    C.eq('bae-gen2: no script error', T.errors(), []);
    T.t.close();
  });

  // ===================================================================================================================
  // the same report imported again: What changed keeps the comparison it had and says the newest import changed nothing
  // (§14.7 sameSince, as a pull's). The imports are a week apart, so each is named by its day.
  // ===================================================================================================================
  // ===================================================================================================================
  // review P4-2, as found: one report, then a pull replaced. The BAE section has nothing to compare yet, and the pull's
  // section printed the CCaR plan as "Approved after" beside the Summary's Approved, the report's. O&M's diffPulls is
  // bae-gen2's (it reads the two O&M pulls alone, every row, no switches); the report on screen is bae-all's.
  // ===================================================================================================================
  await block('P4-2: one report, a pull replaced', async () => {
    const T = await boot();
    await T.pick([file('pull-all.xlsx'), file('bae.xlsx')]);
    await T.pick([file('gen2/pull-om.xlsx')]);
    await T.asOf('2026-10');
    let m = await T.view('summary');
    const om = Object.keys(O.gen2.diff.om.byBlock).filter(k => O.all.blocks[k] && O.all.blocks[k].covered);
    const sum = om.filter(k => { const tr = m.querySelector('table.top tr[data-bk="' + k + '"]'); return tr && rowRead(tr).cents[0] === O.all.blocks[k].approved; });
    C.eq('P4-2: the Summary’s Approved on the covered O&M blocks is the report’s', sum, om);
    m = await T.view('changes');
    C.chk('P4-2: only one BAE report so far', /Only one BAE report so far\./.test(flat(m.querySelector('section.chg[data-ap=bae]') && m.querySelector('section.chg[data-ap=bae]').textContent)));
    planSections('P4-2 What changed', m, { om: O.gen2.diff.om }, O.all);
    C.eq('P4-2: no script error', T.errors(), []);
    T.t.close();
  });

  await block('the same report again', async () => {
    const t = loadTool({ modules: STORE_MODS });
    t.window.confirm = () => true;
    const at = ['2026-11-09T12:00:00.000Z', '2026-11-16T12:00:00.000Z', '2026-11-23T12:00:00.000Z'];
    for (const [i, fs] of [['pull-all.xlsx', 'bae.xlsx'], ['gen2/bae.xlsx'], ['gen2/bae.xlsx']].entries()) {
      await t.SP.applyImport(await t.SP.parseFiles(fs.map(n => ({ name: n.split('/').pop(), data: ab(join(FX, n)) })), { now: at[i] }));
    }
    t.SP.setSettings({ asOf: '2026-10' });
    const st = JSON.parse(J(t.SP.state));
    st.savedAt = '2026-11-23T12:30:00.000Z';
    t.close();
    C.chk('fixture: the third import repeats the second report, row for row', st.bae.current.sameSince === at[1] && st.bae.previous && st.bae.previous.importedAt === at[0], J([st.bae.current.sameSince, st.bae.previous && st.bae.previous.importedAt]));
    const T = await boot({ state: st });
    const m = await T.view('changes');
    const S = m.querySelector('section.chg[data-ap=bae]');
    C.eq('What changed: headed by the report it replaced and the report whose rows are on screen, by their days', S && flat(S.querySelector('h3.bar').textContent),
      'BAE report: imported ' + day(at[0]) + ' (“bae.xlsx”) → imported ' + day(at[1]) + ' (“bae.xlsx”)');
    const same = S && S.querySelector('p.same');
    C.eq('What changed: says the newest import changed nothing', same && flat(same.textContent), 'Nothing changed in the BAE report imported ' + day(at[2]) + ': it is the same, row for row, as the report imported '
      + day(at[1]) + '. What follows is what that report changed, against the one before it.');
    const lis = [...m.querySelectorAll('ul.notes li')].map(e => flat(e.textContent));
    C.chk('What changed: the two imports of a report alone are named as the BAE report', lis.length === 3 && /^\S+: BAE report \(\d+ readable rows\)$/.test(lis[1]) && /^\S+: BAE report \(\d+ readable rows\)$/.test(lis[2]), J(lis));
    const s = flat((await T.view('settings')).textContent);
    C.chk('Settings: the report on screen says it repeats the one imported before', s.includes('; the same, row for row, as the report imported ' + day(at[1])), s.slice(s.indexOf('BAE report of budgets'), s.indexOf('BAE report of budgets') + 400));
    C.eq('the same report again: no script error', T.errors(), []);
    T.t.close();
  });

  // ===================================================================================================================
  // a report alone, before any pull and after one; a report kept over a later import of pulls; a dated file name
  // ===================================================================================================================
  await block('report alone', async () => {
    const T = await boot();
    await T.pick([file('bae.xlsx')]);
    const w = T.main().querySelector('p.baewait');
    C.chk('a report with no pull: No data yet says the report is held, and why nothing is drawn', !!w && /The BAE report “bae\.xlsx” is loaded\./.test(w.textContent), w && w.textContent);
    // review I4-5: the message sends the reader to the Import report for the rows that could not be read, and with no pull no
    // view is drawn, the Import report among them; so No data yet draws the report's own lines, under that heading
    const nd = T.main().querySelector('.baerep'), nt = nd ? flat(nd.textContent) : '';
    C.chk('a report with no pull: the message points to the Import report, and No data yet draws it: every unreadable row and the total check',
      /\(see the Import report\)/.test(T.msg()) && !!nd && [...nd.querySelectorAll('h3.sub')].some(h => h.textContent === 'Import report') && O.all.bae.unreadable.length > 0
      && O.all.bae.unreadable.every(u => nt.includes('row ' + u.rowNo + ':') && nt.includes(u.name)) && /Total row \(row \d+, the report’s own, never counted\)/.test(nt), nt.slice(0, 400));
    C.chk('a report with no pull: the top bar names it', /^No CCaR pull imported yet\. · BAE report “bae\.xlsx” imported /.test(flat(T.doc.getElementById('uiPulls').textContent)), T.doc.getElementById('uiPulls').textContent);
    await T.pick([file('pull-all.xlsx')]);
    await T.asOf('2026-10');
    let m = await T.view('summary');
    topTable('report first, pull after: summary', m, O.all, Object.keys(O.all.blocks));
    m = await T.view('changes');
    const lis = [...m.querySelectorAll('ul.notes li')].map(e => flat(e.textContent));
    C.chk('What changed: an import holding only a report is named as the BAE report, never as “no pull”', lis.length === 2 && /: BAE report \(118 readable rows\)$/.test(lis[0])
      && !/no pull/.test(lis[0]) && /: O&M, Full Fund, Initial Spares, OPN$/.test(lis[1]), J(lis));
    m = await T.view('report');
    const kept = [...m.querySelectorAll('h3.sub')].find(h => h.textContent === 'The BAE report on screen, from an earlier import');
    C.chk('Import report: the report kept from the earlier import has its own section', !!kept && /BAE report of budgets on screen, kept from an earlier import/.test(flat(kept.nextElementSibling.textContent))
      && /Unreadable rows \(kept, counted in no figure\): 1\./.test(flat(kept.nextElementSibling.textContent)));
    C.chk('Import report: and the section on what the figures read', !!m.querySelector('section.baeread'));
    C.eq('report alone: no script error', T.errors(), []);
    T.t.close();
  });
  // a report much smaller than the one on screen is asked about (§14.7); Cancel changes nothing, and the Import report shows
  // the refusal first with what that import held, its BAE section included
  await block('a report declined', async () => {
    const T = await boot();
    await T.pick([file('pull-all.xlsx'), file('bae.xlsx')]);
    let asked = '';
    T.W.confirm = q => { asked = String(q); return false; };
    await T.pick([['small.xlsx', ab(join(tmp.dir, 'hostile.xlsx'))]]);
    C.chk('declined: the question was about the BAE report', /BAE report/.test(asked), asked.slice(0, 200));
    C.chk('declined: the report on screen is still the one it was', T.SP.state.bae.current.file === 'bae.xlsx' && !T.SP.state.bae.previous);
    const m = await T.view('report');
    const ref = m.querySelector('.refused');
    C.chk('declined: the Import report shows the refusal first, with the BAE section of what that import held', !!ref && m.firstElementChild.nextElementSibling === ref
      && /BAE report of budgets: “small\.xlsx” › “Report”/.test(flat(ref.textContent)), ref && flat(ref.textContent).slice(0, 300));
    const below = ref ? [...m.children].slice([...m.children].indexOf(ref) + 1).map(e => e.textContent).join(' ') : '';
    C.chk('declined: the report taken before it is still described below the refusal', /BAE report of budgets: “bae\.xlsx” › “Sheet1”/.test(flat(below)), flat(below).slice(0, 200));
    T.t.close();
  });
  await block('a dated report', async () => {
    const T = await boot();
    const dated = 'Report__BAE_ALL_Services_USAF_and_DoN_2026-01-31_120000.xlsx';
    await T.pick([file('pull-all.xlsx'), [dated, ab(join(FX, 'bae.xlsx'))]]);
    await T.asOf('2026-10');
    C.chk('top bar: a dated report is named with its date', flat(T.doc.getElementById('uiPulls').textContent).includes('BAE report “' + dated + '” of 2026-01-31 12:00, imported '),
      T.doc.getElementById('uiPulls').textContent);
    const m = await T.view('summary');
    C.eq('summary line 2: the report’s own date', flat(m.querySelector('p.l2').textContent), line2('2026-01-31 12:00'));
    const s = flat((await T.view('settings')).textContent);
    C.chk('Settings: dated by its file name', /Dated 2026-01-31 12:00 by its file name\./.test(s));
    T.t.close();
  });

  // ===================================================================================================================
  // names from a report are text: a budget name and a file name holding markup
  // ===================================================================================================================
  await block('hostile names', async () => {
    const T = await boot();
    let alerts = 0;
    T.W.alert = () => { alerts++; };
    await T.pick([file('pull-all.xlsx'), file('bae.xlsx')]);
    await T.pick([[HOSTILE_FILE, ab(join(tmp.dir, 'hostile.xlsx'))]]);
    await T.asOf('2026-10');
    const imgs = () => T.doc.querySelectorAll('img').length;
    const seen = [];
    for (const v of ['summary', 'om', 'pmos', 'report', 'changes', 'settings']) {
      const m = await T.view(v);
      if (v === 'changes') for (const b of [...m.querySelectorAll('section.chg[data-ap=bae] button[data-act=diff]')]) { T.click(T.doc.querySelector('[data-fkey="' + b.getAttribute('data-fkey') + '"]')); await settle(); }
      if (T.main().textContent.includes(HOSTILE_NAME)) seen.push(v);
      C.chk('hostile: no img element on ' + v, imgs() === 0);
    }
    C.chk('hostile: the top bar shows the file name as text', T.doc.getElementById('uiPulls').textContent.includes(HOSTILE_FILE) && imgs() === 0);
    C.eq('hostile: the budget name is shown, as text, where it is listed', seen, ['report', 'changes']);
    C.chk('hostile: nothing ran', alerts === 0 && !T.errors().length, T.errors().join(' | '));
    T.t.close();
  });

  // ===================================================================================================================
  // WITH NO REPORT LOADED NOTHING CHANGES: the page before §14 (0c71592's 90-ui.js and style.css) and this one, on the
  // same plan with no report, draw every view, the top bar and the switches byte for byte alike. Help is left out: it
  // gains a section on the report whether or not one is loaded.
  // ===================================================================================================================
  await block('no report: nothing changes', async () => {
    const git = p => spawnSync('git', ['-C', REPO, 'show', '0c71592:spend-plan/src/' + p], { encoding: 'utf8', maxBuffer: 1 << 26 });
    const oldUi = git('90-ui.js'), oldCss = git('style.css');
    if (oldUi.status !== 0 || oldCss.status !== 0) {
      C.chk('no report: commit 0c71592 is readable (in a shallow clone, run git fetch --unshallow)', false, (oldUi.stderr || oldCss.stderr || '').trim());
      return;
    }
    const swap = (html, now, then) => {
      const a = now.replace(/\s*$/, ''), b = then.replace(/\s*$/, '');
      const parts = html.split(a);
      if (parts.length !== 2) throw new Error('the current source is not in the page exactly once');
      return parts.join(b);
    };
    const nowUi = readFileSync(join(HERE, '..', 'src', '90-ui.js'), 'utf8'), nowCss = readFileSync(join(HERE, '..', 'src', 'style.css'), 'utf8');
    C.chk('no report: the page compared with is not this one (the screens did change for §14)', nowUi !== oldUi.stdout);
    // two plans with no report, made by the tool's own import and store: one pull, and a pull then a second (What changed)
    const mk = async files => {
      const t = loadTool({ modules: STORE_MODS });
      t.window.confirm = () => true;
      for (const [i, fs] of files.entries()) {
        const parsed = await t.SP.parseFiles(fs.map(n => ({ name: n.split('/').pop(), data: ab(join(FX, n)) })), { now: ['2026-11-09T12:00:00.000Z', '2026-11-16T12:00:00.000Z'][i] });
        await t.SP.applyImport(parsed);
      }
      t.SP.setSettings({ asOf: '2026-10' });
      const st = JSON.parse(J(t.SP.state));
      st.savedAt = '2026-11-16T12:30:00.000Z';
      t.close();
      return st;
    };
    for (const [name, files] of [['one pull', [['pull-all.xlsx']]], ['two pulls', [['pull-all.xlsx'], ['gen2/pull-om.xlsx', 'gen2/pull-ff.csv']]]]) {
      const st = await mk(files);
      C.chk('no report (' + name + '): the plan holds no report', st.bae && st.bae.current === null && st.bae.previous === null, J(st.bae));
      const html = pageHtml({ state: st });
      const A = await boot({ html }), B = await boot({ html: swap(swap(html, nowUi, oldUi.stdout), nowCss, oldCss.stdout) });
      const same = (what, f) => { const a = f(A), b = f(B); C.chk('no report (' + name + '): ' + what + ' is drawn as before §14', a === b, a.length + ' vs ' + b.length + ' characters, first difference at ' + [...a].findIndex((ch, i) => ch !== b[i])); };
      same('the top', T => T.doc.getElementById('uiTop').innerHTML);
      same('the switches', T => T.doc.getElementById('uiFilters').innerHTML);
      for (const v of ['summary', 'slides', 'om', 'ff', 'sp', 'opn', 'na', 'report', 'changes', 'settings']) {
        await A.view(v); await B.view(v);
        if (v === 'changes') {
          for (const T of [A, B]) for (const b of [...T.main().querySelectorAll('button[data-act=diff]:not([disabled])')]) { T.click(T.doc.querySelector('[data-fkey="' + b.getAttribute('data-fkey') + '"]')); await settle(); }
        }
        if (v === 'om') {
          for (const T of [A, B]) { const s = T.main().querySelector('select[data-act=lvl]'); T.change(s, '4'); await settle(); }
        }
        same('the ' + v + ' view', T => T.main().innerHTML);
      }
      await A.view('pmos'); await B.view('pmos');
      const n = A.main().querySelector('select[data-act=pmo]').options.length;
      for (let i = 0; i < n; i++) {
        for (const T of [A, B]) { T.change(T.main().querySelector('select[data-act=pmo]'), String(i)); await settle(); }
        same('PMO tab ' + i, T => T.main().innerHTML);
      }
      // a typed Authorized, its message and the redraw; then cleared
      await A.view('settings'); await B.view('settings');
      for (const val of ['12.5', '']) {
        for (const T of [A, B]) { T.change(T.main().querySelector('input[data-act=auth][data-i="1"]'), val); await settle(); }
        same('Settings after typing “' + val + '”', T => T.main().innerHTML);
        same('the message after typing “' + val + '”', T => T.msg());
        await A.view('summary'); await B.view('summary');
        same('the Summary after typing “' + val + '”', T => T.main().innerHTML);
        await A.view('settings'); await B.view('settings');
      }
      C.eq('no report (' + name + '): no script error', A.errors().concat(B.errors()), []);
      A.t.close(); B.t.close();
    }
  });

  // ===================================================================================================================
  // CHROMIUM: what only a browser draws — the keyboard's place, the marks' colour, no sideways scroll
  // ===================================================================================================================
  await block('chromium', async () => {
    const t = loadTool({ modules: STORE_MODS });
    t.window.confirm = () => true;
    for (const [i, fs] of [['pull-all.xlsx', 'bae.xlsx'], ['gen2/pull-om.xlsx', 'gen2/pull-ff.csv', 'gen2/bae.xlsx']].entries()) {
      await t.SP.applyImport(await t.SP.parseFiles(fs.map(n => ({ name: n.split('/').pop(), data: ab(join(FX, n)) })), { now: ['2026-11-09T12:00:00.000Z', '2026-11-16T12:00:00.000Z'][i] }));
    }
    t.SP.setSettings({ asOf: '2026-10' });
    const st = JSON.parse(J(t.SP.state));
    st.savedAt = '2026-11-16T12:30:00.000Z';
    t.close();
    const f = join(tmp.dir, 'sfcb-spend-plan.html');
    writeFileSync(f, pageHtml({ state: st }));
    const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
    try {
      const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
      const p = await ctx.newPage();
      const errors = [];
      p.on('pageerror', e => errors.push(e.message));
      p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
      await p.goto(pathToFileURL(f).href);
      await p.waitForSelector('tr[data-bk=total]');
      // § and † on the TOTAL's navy read at 4.5:1 or more (as † and ‡ do, review SCR2-3)
      const ratio = await p.evaluate(() => {
        const lum = c => { const v = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(x => x / 255).map(x => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
        const s = document.querySelector('tr.total .sect'), td = s && s.closest('td');
        if (!s) return null;
        const a = lum(getComputedStyle(s).color), b = lum(getComputedStyle(td).backgroundColor);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      });
      C.chk('Chromium: § on the TOTAL row reads at 4.5:1 or more on its navy', ratio !== null && ratio >= 4.5, String(ratio));
      // the marks a PMO block's strip now carries (review M4-5) read at 4.5:1 or more on its blue: the PMOs, one by one, until
      // a strip carries §
      await p.click('[data-act=view][data-v=pmos]');
      const nPmo = await p.$$eval('select[data-act=pmo] option', o => o.length);
      let sr = null;
      for (let i = 0; i < nPmo && !sr; i++) {
        await p.selectOption('select[data-act=pmo]', String(i));
        await p.waitForTimeout(50);
        sr = await p.evaluate(() => {
          const lum = c => { const v = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(x => x / 255).map(x => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
          const out = [...document.querySelectorAll('tr.strip .sect, tr.strip .dag')].map(s => { const a = lum(getComputedStyle(s).color), b = lum(getComputedStyle(s.closest('td')).backgroundColor);
            return { mark: s.textContent, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }; });
          return out.length ? out : null;
        });
      }
      C.chk('Chromium: a PMO strip carries § and †, each reading at 4.5:1 or more on the strip’s blue (M4-5)', !!sr && sr.some(x => x.mark === '§') && sr.some(x => x.mark === '†')
        && sr.every(x => x.ratio >= 4.5), J(sr));
      for (const v of ['summary', 'om', 'pmos', 'report', 'changes', 'settings']) {
        await p.click('[data-act=view][data-v="' + v + '"]');
        const w = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
        C.chk('Chromium: the ' + v + ' view does not scroll sideways at 1366 px', w.sw <= w.cw, J(w));
      }
      // the keyboard: a budget list opened with Enter keeps the keyboard on its button
      await p.click('[data-act=view][data-v=changes]');
      await p.focus('[data-fkey="diff:bae|changed"]');
      await p.keyboard.press('Enter');
      await p.waitForSelector('table[data-budgets=changed]', { timeout: 5000 });
      const fk = await p.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-fkey'));
      C.eq('Chromium: Enter opens the changed budgets, and the keyboard stays on its button', fk, 'diff:bae|changed');
      // Settings: a figure typed and left with Tab is taken, and the keyboard goes on to the next box
      await p.click('[data-act=view][data-v=settings]');
      const b0 = 'table.authbae tr[data-bk="om|2026"] input[data-act=auth]';
      await p.focus(b0);
      await p.keyboard.type('398.7654321');
      await p.keyboard.press('Tab');
      await p.waitForFunction(() => SP.state.settings.authorized['om|2026'] === 39876543210, null, { timeout: 5000 });
      await p.waitForFunction(() => { const u = document.querySelector('table.authbae tr[data-bk="om|2026"] td.used'); return u && u.getAttribute('data-src') === 'typed'; }, null, { timeout: 5000 });
      const at = await p.evaluate(() => { const a = document.activeElement; return a && a.closest('tr') && a.closest('tr').getAttribute('data-bk'); });
      C.chk('Chromium: Tab out of a typed Authorized takes it, redraws, and the keyboard is on the next block’s box', at === 'om|2027', String(at));
      C.eq('Chromium: no page error', errors, []);
    } finally { await browser.close(); }
  });
} finally {
  tmp.rm();
}
C.done();
