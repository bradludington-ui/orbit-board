// The screens and the workbook against the ORACLE on the synthetic fixture's §15 and §16 scenarios (CONTRACT §15.5,
// §16.4). obbba.test.mjs holds §15 on a hand-written plan and engine.test.mjs / engine-bae.test.mjs hold the model to the
// oracle; this file holds what a person reads, on the page and in the workbook the page's own Export writes, to what
// test/fixture/oracle.py works out from the fixture files alone, for every scenario no other product test reads:
//
//   obbba, obbba-usaf-off, obbba-first-2026   the obbba pulls (O&M FY2025 holding only FY2025 OBBBA rows, Full Fund
//                                             FY2025 mixing them with ordinary ones), a switch off, and a later First FY
//   bae-obbba                                 the same pulls with their BAE report (an obbba noBlock, §16 on its blocks)
//   bae-mand-only, bae-asof-2027-10, bae-gen2 §16's PMO tabs on the main fixture under a lane switch, a later as-of and a
//                                             second import (export-bae and screens-bae read bae-all and its typed kin)
//   obbba2, bae-obbba2,                       §17.4's pulls alone (each row judged by its own name), with their report
//   bae-obbba2-first-2026,                    (whose Budget Flex 02 marks O&M FY2025 budgets, so their pull rows go too,
//   bae-obbba2-usaf-off                       while Initial Spares, Full Fund and OPN FY2025 OBBBA money counts), under a
//                                             later First FY and with a service off
//
// For each: the Summary's rows and TOTAL; the Summary's notes (§15.4's, the obbba noBlock note, §16.2's); every PMO tab's
// figures (basis planEvent on a covered block) and its plan-event line; the Import report's section on FY2025 OBBBA funding,
// its BAE section's rows by scope, its table by appropriation and FY and §16.2's two lists; the Settings line; the raw data
// sheets' Counted, row by row, against the oracle's rawCounted; the BAE Report sheet's Counted and PMO columns, row by row,
// against the oracle's. The screen's notes and the sheet's are one list (§15.4: the same words on both).
//
// Every word expected is restated here from the contract (or, where the contract leaves the wording to the tool, from the
// tool's documented wording, restated, so a change on either side is a disagreement); every figure is the oracle's.
//
// §17 (Brad, 11 Nov 2026) narrows §15 to O&M and lets the BAE report's Budget Flex 02 mark a row: the words below are §17.3's,
// a budget or report row marked other than by its name is said so, and the OBBBA money outside O&M (oracle obbbaElsewhere,
// [] where it writes none) is held to the Import report's list of it. On the obbba2 scenarios the BAE Report sheet also keeps
// the report's own Budget Flex columns, row by row as the fixture wrote them (§14.6: every column the file has).
//
//   node apex/test/oracle-obbba-pmo.test.mjs
process.env.TZ = 'America/New_York';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTool, pageHtml, checks, scratchDir } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const READ = join(HERE, 'export-read.py');
const C = checks('oracle-obbba-pmo');
const tmp = scratchDir('sfcbsp-oop-');
const J = x => JSON.stringify(x);
const settle = (ms = 20) => new Promise(res => setTimeout(res, ms));
const NOW = '2026-11-09T12:00:00.000Z', NOW2 = '2026-12-02T15:00:00.000Z';

// ------------------------------------------------------------------------------------------------ restated from §15, §16
const WHY = 'FY2025 O&M OBBBA funding (not a reporting year)';
const WHY_FLEX = WHY + ', marked in Budget Flex 02';                        // a report row marked so and not by its name (§17.3)
const WHY_REP = WHY + ', marked in the BAE report’s Budget Flex 02';        // a pull row the report marks (§17.3)
const isWhy = w => w === WHY || w === WHY_FLEX;
const HEAD = 'FY2025 O&M OBBBA funding, left out (not a reporting year)';
const RULE = 'FY2025 O&M OBBBA funding is left out of every figure: it is not a reporting year. OBBBA funding of every other appropriation counts '
  + 'like any other money (Brad, 11 Nov 2026).';
const WHERE = 'FY2025 O&M OBBBA funding is left out (not a reporting year), so no block is shown';
const ELSE_HEAD = 'OBBBA funding outside O&M counts like any other money (Brad, 11 Nov 2026):';
const RAW_NO = 'No: ' + WHY, RAW_REP = 'No: ' + WHY_REP;
const EVERY = ' This counts every service and lane, whatever the switches show.';
// the section's first line, the tool's wording of §15.4's rule (restated)
const SECTION_RULE = 'An O&M row whose FY is 2025 and whose budget name holds the word OBBBA counts in no figure, block, list or picture, whatever '
  + 'the switches show, and so does one the BAE report marks OBBBA in its Budget Flex 02 column: a report row of O&M FY2025 so marked, and the CCaR pull’s '
  + 'O&M FY2025 rows of its budget. FY2025 is not a reporting year; OBBBA funding of every other appropriation counts like any other money (Brad, 11 Nov 2026).';
const PE_LINE = 'Approved and Authorized are the BAE report’s figures for the budgets this PMO’s plan events are assigned to; a budget the plan events of '
  + 'several PMOs use is split among them by each one’s CCaR plan on it. Obligated counts this PMO’s plan events.';
const AP = { om: 'O&M', ff: 'Full Fund', sp: 'Initial Spares', opn: 'OPN' };
const RAW_SHEET = { om: 'O&M Raw Data', ff: 'FF Raw Data', sp: 'Spares Raw Data', opn: 'OPN Raw Data' };
const TAB_AP = ['ff', 'sp', 'om', 'opn'];
const pad2 = n => String(n).padStart(2, '0');
const commas = d => d.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
// §2 $M in a sentence (zero 0.00), and exact dollars, restated
function mText(c) {
  if (c === 0) return '0.00';
  const a = Math.abs(c);
  let body;
  if (a < 500000) body = '<0.01';
  else { let h = Math.floor(a / 1e6); if (a - h * 1e6 >= 500000) h++; body = commas(String(Math.floor(h / 100))) + '.' + pad2(h % 100); }
  return c < 0 ? '(' + body + ')' : body;
}
const $M = c => '$' + mText(c) + 'M';
const usd = c => (c < 0 ? '-' : '') + '$' + commas(String(Math.floor(Math.abs(c) / 100))) + '.' + pad2(Math.abs(c) % 100);
const rows1 = n => commas(String(n)) + (n === 1 ? ' row' : ' rows');
const flat = s => String(s ?? '').replace(/\s+/g, ' ').trim();
const fyName = t => AP[t.ap] + ' FY' + t.fy;
const tabOrder = keys => keys.slice().sort((a, b) => TAB_AP.indexOf(a.split('|')[0]) - TAB_AP.indexOf(b.split('|')[0]) || Number(a.split('|')[1]) - Number(b.split('|')[1]));
const figs = t => 'Approved ' + usd(t.approved) + ', Authorized ' + usd(t.authorized);

// ------------------------------------------------------------------------------------------------ what the oracle says
// §15.4 is a row the rule leaves out loaded? (a pull row set aside for condition 4, or a report row counted as one)
const obLoaded = X => !!(X.excluded.obbba && X.excluded.obbba.rows > 0) || !!(X.bae && X.bae.counted.some(([, w]) => isWhy(w)));
// §15.4 the Summary's note
function obNote(X) {
  const o = X.excluded.obbba;
  if (!o || !o.rows) return null;
  const nb = o.budgets.length;
  return 'FY2025 O&M OBBBA funding is left out of every figure: it is not a reporting year. The CCaR pull holds ' + rows1(o.rows) + ' of it on ' + nb
    + (nb === 1 ? ' budget' : ' budgets') + ' (' + o.blocks.map(fyName).join(', ') + '), ' + $M(o.cents) + ' planned, ' + $M(o.obligated)
    + ' of it obligated. See the Import report.' + (X.shown.all ? '' : EVERY);
}
// §15.4 a noBlock entry with obbba, in place of the ordinary words
const noBlockNote = t => fyName(t) + ' has no block: its only CCaR pull rows are FY2025 O&M OBBBA funding, which is left out. The BAE report’s '
  + $M(t.approved) + ' Approved and ' + $M(t.authorized) + ' Authorized for it are not shown.';
// §16.2 the Summary's note on the report money no plan event uses
function unNote(X) {
  const us = X.bae ? X.bae.unassigned.filter(u => u.approved !== 0 || u.authorized !== 0) : [];
  // review P5-2: the unassigned Approved AND Authorized of each block; a typed Authorized (none in these scenarios) is named
  const typed = Object.keys(X.blocks).filter(k => X.blocks[k].authorizedEntered).map(k => fyName({ ap: k.split('|')[0], fy: k.split('|')[1] }));
  return us.length ? 'The PMO tabs share each budget’s Approved and Authorized among the PMOs whose plan events use it, by their CCaR plan on it. '
    + us.map(u => fyName(u) + ' ' + $M(u.approved) + ' Approved and ' + $M(u.authorized) + ' Authorized').join('; ')
    + ' of the BAE report’s money is on budgets no plan event uses, so the PMO tabs add up to the Summary less it.'
    + (typed.length ? ' An Authorized typed in Settings (marked ‡: ' + (typed.length > 1 ? typed.slice(0, -1).join(', ') + ' and ' + typed[typed.length - 1] : typed[0])
      + ') is for its block as a whole and is never shared among the PMOs, so there the PMO tabs’ Authorized need not add up to the Summary’s.' : '') : null;
}
// §15.4 the Import report's section, line by line (the sheet indents each by two spaces; the screen draws the indent)
function obLines(X, reportRow) {
  if (!obLoaded(X)) return [];
  const o = X.excluded.obbba && X.excluded.obbba.rows > 0 ? X.excluded.obbba : null;
  const L = [SECTION_RULE];
  if (!o) L.push('In the CCaR pulls: none.');
  else {
    const nb = o.budgets.length;
    L.push('In the CCaR pulls: ' + rows1(o.rows) + ' on ' + nb + (nb === 1 ? ' budget' : ' budgets') + ' (' + o.blocks.map(fyName).join(', ') + '):');
    for (const t of o.budgets) L.push('  “' + t.name + '” (' + AP[t.ap] + ')' + (t.by === 'report' ? ', marked in the BAE report’s Budget Flex 02' : '') + ': '
      + rows1(t.rows) + ', plan ' + usd(t.cents) + ', obligated ' + usd(t.obligated) + '.');
    L.push('  Total: ' + rows1(o.rows) + ', plan ' + usd(o.cents) + ', obligated ' + usd(o.obligated) + '.');
  }
  if (X.bae) {
    // the report's rows the oracle counts as FY2025 OBBBA funding, with their amounts as the fixture wrote them
    const rr = X.bae.counted.filter(([, w]) => isWhy(w)).map(([rn]) => reportRow(rn));
    const nn = X.bae.counted.filter(([, w]) => w === WHY).length;
    L.push('In the BAE report: ' + (rr.length ? rows1(rr.length) + ', Approved ' + usd(rr.reduce((a, r) => a + r.approved, 0)) + ', Authorized '
      + usd(rr.reduce((a, r) => a + r.authorized, 0)) + ' (named OBBBA: ' + rows1(nn) + '; marked in Budget Flex 02 only: ' + rows1(rr.length - nn) + ').' : 'none.'));
  }
  return L;
}
// §17.3 the Import report's list of the OBBBA money outside O&M, from the oracle's obbbaElsewhere ([] where it writes none)
const elseLines = X => (X.obbbaElsewhere || []).map(e => fyName(e) + ': in the CCaR pull, ' + (e.pull.rows ? rows1(e.pull.rows) + ', plan ' + usd(e.pull.cents) : 'none')
  + (X.bae ? '; in the BAE report, ' + (e.report.rows ? rows1(e.report.rows) + ' (named OBBBA: ' + rows1(e.report.byName) + '; marked in Budget Flex 02 only: '
    + rows1(e.report.byFlex02) + '), Approved ' + usd(e.report.approved) + ', Authorized ' + usd(e.report.authorized) : 'none') : '') + '.');
// §16.2 the Import report's two lists, from the oracle
const splitItems = X => X.bae.split.map(e => fyName(e) + ': “' + e.name + '” (' + figs(e) + '), by each PMO’s CCaR plan on it, largest share first: '
  + e.pmos.map(p => p.pmo + ', plan ' + usd(p.plan) + ': ' + figs(p)).join('; ') + '.');
const unItems = X => X.bae.unassigned.flatMap(u => u.budgets.map(t => fyName(u) + ': “' + t.name + '” (' + figs(t) + '): '
  + (t.why === 'nopull' ? 'no plan event uses it in this block' : 'its plan events’ plan is not above zero') + '.'));
// an (ap, fy) the report holds money for whose only pull rows are FY2025 OBBBA funding (§15.3 noBlock with obbba)
const obNoBlocks = X => (X.bae ? X.bae.noBlock.filter(t => t.obbba) : []);
// the raw data sheet's Counted, read back as the oracle's code: §15.4 spells the OBBBA words and Yes; the others are the
// tool's (the contract does not spell them), each recognised by its start
function rawCode(w) {
  if (w === 'Yes') return 'yes';
  if (w === RAW_NO) return 'obbba';
  if (w === RAW_REP) return 'obbbaReport';
  if (/^No: could not be read/.test(w)) return 'unreadable';
  if (/^No: FY\d{4} is before the first FY shown \(FY\d{4}\)$/.test(w)) return 'beforeFirst';
  if (/^No: (service|lane) switched off \(/.test(w)) return 'switch';
  return '?' + w;
}

// ------------------------------------------------------------------------------------------------ the tools
function py(args) { return spawnSync('python3', ['-I', ...args], { encoding: 'utf8', maxBuffer: 1 << 30 }); }
function readBook(file) {
  const r = py([READ, file]);
  if (r.status !== 0) throw new Error('export-read.py failed: ' + r.stderr.slice(-800));
  return JSON.parse(r.stdout);
}
function sheetRows(book, name) {
  const s = book.sheets.find(x => x.name === name);
  if (!s) return null;
  return s.rows.map(r => { const a = []; for (const [ci, v] of r.cells) a[ci] = v; return a; });
}
const moneyOk = (got, want) => typeof got === 'number' && Math.abs(got - want / 1e8) <= 1e-9;
const ab = p => { const b = readFileSync(p); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };
const FX = join(tmp.dir, 'fx');
const files = names => names.map(n => ({ name: n.split('/').pop(), data: ab(join(FX, n)) }));
async function block(name, fn) {
  try { await fn(); } catch (e) { C.chk(name + ': the checks stopped part way: ' + String((e && e.stack) || e).split('\n').slice(0, 3).join(' | '), false); }
}
// a plan made by the tool's own import and store, as a saved file holds it
async function planOf(imports, settings) {
  const tp = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine', 'store'] });
  tp.window.confirm = () => true;
  for (const [names, now] of imports) tp.SP.applyImport(await tp.SP.parseFiles(files(names), { now }));
  tp.SP.setSettings(settings);
  const state = JSON.parse(J(tp.SP.state));
  tp.close();
  return state;
}
// the whole page in jsdom, booted on the plan, with what a person uses
async function boot(state) {
  const t = loadTool({ html: pageHtml({ state }) });
  t.window.confirm = () => true;
  const W = t.window, doc = W.document;
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  const T = {
    t, W, doc, SP: t.SP,
    main: () => doc.getElementById('uiMain'),
    click(el) { el.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); },
    change(el, value) { if (value !== undefined) { if (el.type === 'checkbox') el.checked = value; else el.value = value; } el.dispatchEvent(new W.Event('change', { bubbles: true })); },
    async view(v) { T.click(doc.querySelector('[data-act=view][data-v="' + v + '"]')); await settle(); return T.main(); },
    errors: () => t.errors.filter(e => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click)/.test(String(e))),
  };
  return T;
}
// the workbook the page's own Export writes, read back with openpyxl
async function exportBook(T, name) {
  let got = null;
  const real = T.SP.download;
  T.SP.download = (n, bytes) => { got = { n, bytes }; return n; };
  const r = await T.SP.exportExcel();
  T.SP.download = real;
  if (!r.ok || !got) throw new Error('the export failed: ' + r.message);
  const f = join(tmp.dir, name + '.xlsx');
  writeFileSync(f, got.bytes);
  return readBook(f);
}

// ------------------------------------------------------------------------------------------------ the scenarios
const PULL_O = ['obbba/pull-om.xlsx', 'obbba/pull-ff.csv'];
const PULL_O2 = ['obbba2/pull-om.xlsx', 'obbba2/pull-ff.csv', 'obbba2/pull-sp.xlsx'];
const SCEN = [
  { name: 'obbba', imports: [[PULL_O, NOW]] },
  { name: 'obbba-usaf-off', imports: [[PULL_O, NOW]], svcOff: [0] },
  { name: 'obbba-first-2026', imports: [[PULL_O, NOW]], first: 2026 },
  { name: 'bae-obbba', imports: [[PULL_O.concat(['obbba/bae.xlsx']), NOW]] },
  { name: 'bae-mand-only', imports: [[['pull-all.xlsx', 'bae.xlsx'], NOW]], laneOff: ['disc'] },
  { name: 'bae-asof-2027-10', imports: [[['pull-all.xlsx', 'bae.xlsx'], NOW]], asOf: '2027-10' },
  { name: 'bae-gen2', imports: [[['pull-all.xlsx', 'bae.xlsx'], NOW], [['gen2/pull-om.xlsx', 'gen2/pull-ff.csv', 'gen2/bae.xlsx'], NOW2]] },
  // §17.4: marked in the name or in Budget Flex 02, O&M only
  { name: 'obbba2', imports: [[PULL_O2, NOW]], part: 'obbba2' },
  { name: 'bae-obbba2', imports: [[PULL_O2.concat(['obbba2/bae.xlsx']), NOW]], part: 'obbba2' },
  { name: 'bae-obbba2-first-2026', imports: [[PULL_O2.concat(['obbba2/bae.xlsx']), NOW]], first: 2026, part: 'obbba2' },
  { name: 'bae-obbba2-usaf-off', imports: [[PULL_O2.concat(['obbba2/bae.xlsx']), NOW]], svcOff: [0], part: 'obbba2' },
];

try {
  mkdirSync(FX);
  const mk = py([join(HERE, 'fixture', 'make_fixture.py'), '--out', FX]);
  if (mk.status !== 0) throw new Error('make_fixture failed: ' + mk.stderr);
  const manifest = JSON.parse(readFileSync(join(FX, 'manifest.json'), 'utf8'));
  // the obbba and obbba2 reports' rows as the fixture wrote them, by sheet row (the oracle names a row by it)
  const obReports = { obbba: new Map(manifest.obbba.bae.map(r => [r.row, r])), obbba2: new Map(manifest.obbba2.bae.map(r => [r.row, r])) };
  const reach = { obNote: 0, noBlock: 0, obSection: 0, inReport: 0, rawOb: 0, beforeFirst: 0, split: 0, unassigned: 0, planEvent: 0, sw: 0, elsewhere: 0,
    byReport: 0, rawObReport: 0, flexWhy: 0, elseFlex: 0, flexCols: 0 };

  for (const sc of SCEN) {
    await block(sc.name, async () => {
      const outX = join(tmp.dir, sc.name + '.json');
      const ro = py([join(HERE, 'fixture', 'oracle.py'), '--scenario', sc.name, '--fixture', FX, '--out', outX]);
      if (ro.status !== 0) throw new Error('the oracle failed: ' + ro.stderr.slice(-800));
      const X = JSON.parse(readFileSync(outX, 'utf8'));
      // §23: the obbba scenarios keep O&M FY2025 (the oracle's left_out=[]); the others leave it out, as the oracle does
      const state = await planOf(sc.imports, Object.assign({ asOf: sc.asOf || '2026-10', firstFY: sc.first || 2025 }, /obbba/.test(sc.name) ? { leftOut: [] } : {}));
      const T = await boot(state);
      C.eq(sc.name + ': the page boots on the plan with no script errors', T.errors(), []);
      // the switches, through the page's own boxes
      for (const i of sc.svcOff || []) { T.change(T.doc.querySelector('#uiFilters input[data-act=svc][data-i="' + i + '"]'), false); await settle(); }
      for (const l of sc.laneOff || []) { T.change(T.doc.querySelector('#uiFilters input[data-act=lane][data-l="' + l + '"]'), false); await settle(); }
      C.chk(sc.name + ': the page shows what the oracle was asked', J(T.SP.getView ? [T.SP.state.settings.asOf, T.SP.state.settings.firstFY] : null) === J([X.asOf, X.firstFY])
        && flat(T.doc.querySelector('#uiFilters .shownline').textContent).length > 0);
      const keys = Object.keys(X.blocks);
      const wantNotes = [obNote(X), unNote(X)].concat(obNoBlocks(X).map(noBlockNote)).filter(Boolean);
      const obReport = obReports[sc.part || 'obbba'];
      const lines = obLines(X, rn => obReport.get(rn));
      // §17's reaches: a budget left out because the report marks it, a report row so marked, OBBBA money outside O&M marked
      // in Budget Flex 02
      reach.byReport += lines.filter(l => /, marked in the BAE report’s Budget Flex 02: /.test(l)).length;
      if (X.bae) reach.flexWhy += X.bae.counted.filter(([, w]) => w === WHY_FLEX).length;
      reach.elseFlex += (X.obbbaElsewhere || []).filter(e => e.report.byFlex02 > 0).length;
      if (obNote(X)) reach.obNote++;
      reach.noBlock += obNoBlocks(X).length;
      if (lines.length) reach.obSection++;
      if (lines.some(l => /^In the BAE report: \d/.test(l))) reach.inReport++;
      if (!X.shown.all) reach.sw++;

      // ============================================================================== THE SCREENS
      // ---------------------------------------------------------------- Summary
      let m = await T.view('summary');
      C.eq(sc.name + ' screen, Summary: its rows are the oracle’s blocks (FY2025 OBBBA funding names none)', [...m.querySelectorAll('table.top tr[data-bk]')]
        .map(r => r.getAttribute('data-bk')).filter(k => k !== 'total'), keys);
      const cents = tr => [...tr.querySelectorAll('td[data-c]')].slice(0, 4).map(x => Number(x.getAttribute('data-c')));
      const badS = [];
      for (const k of keys) {
        const tr = m.querySelector('table.top tr[data-bk="' + k + '"]'), x = X.blocks[k];
        if (!tr || J(cents(tr)) !== J([x.approved, x.authorized, x.obligated, x.unobligated])) badS.push(k + ' ' + (tr ? J(cents(tr)) : 'missing'));
      }
      const tt = m.querySelector('table.top tr[data-bk=total]');
      if (!tt || J(cents(tt)) !== J([X.summary.approved, X.summary.authorized, X.summary.obligated, X.summary.unobligated])) badS.push('TOTAL ' + (tt ? J(cents(tt)) : 'missing'));
      C.chk(sc.name + ' screen, Summary: every row and the TOTAL are the oracle’s', !badS.length, badS.slice(0, 4).join('; '));
      const sNotes = [...m.querySelectorAll('ul.notes li')].map(li => li.textContent);
      for (const n of wantNotes) C.chk(sc.name + ' screen, Summary: the note “' + n.slice(0, 60) + '…”', sNotes.includes(n), J(sNotes));
      C.chk(sc.name + ' screen, Summary: no §15 note where the oracle sets nothing aside by the rule', !!obNote(X) || !sNotes.some(n => /^FY2025 O&M OBBBA funding is left out/.test(n)), J(sNotes));
      C.chk(sc.name + ' screen, Summary: §15.4’s note comes right after the note on money before First FY, where there is one',
        !obNote(X) || !sNotes.some(n => /^Money before FY/.test(n)) || sNotes.indexOf(obNote(X)) === sNotes.findIndex(n => /^Money before FY/.test(n)) + 1, J(sNotes));
      C.chk(sc.name + ' screen, Summary: the ordinary noBlock note names no (ap, fy) the obbba note names', !obNoBlocks(X).some(t => sNotes.some(n => n.startsWith('The BAE report holds money for')
        && n.includes(fyName(t) + ' ('))), J(sNotes));

      // ---------------------------------------------------------------- PMO tabs (§16.1 on a covered block)
      m = await T.view('pmos');
      const sel = () => T.main().querySelector('select[data-act=pmo]');
      const labels = [...sel().options].map(o => o.textContent);
      C.eq(sc.name + ' screen, PMOs: a tab for every PMO the oracle has, and no other', labels.slice().sort(), Object.keys(X.pmoTabs).sort());
      for (const label of labels) {
        T.change(sel(), [...sel().options].find(x => x.textContent === label).value);
        await settle();
        m = T.main();
        const tab = X.pmoTabs[label] || {}, bad = [];
        for (const [k, x] of Object.entries(tab)) {
          const tr = m.querySelector('table.top tr[data-bk="' + k + '"]');
          if (!tr || J(cents(tr)) !== J([x.approved, x.authorized, x.obligated, x.unobligated])) bad.push(k + ' ' + (tr ? J(cents(tr)) : 'missing') + ' want ' + J([x.approved, x.authorized, x.obligated, x.unobligated]));
          if (x.basis === 'planEvent') reach.planEvent++;
        }
        C.chk(sc.name + ' screen, PMO ' + label + ': every row is the oracle’s (§16.1)', !bad.length, bad.slice(0, 3).join('; '));
        const ns = [...m.querySelectorAll('p.note')].map(e => flat(e.textContent));
        C.eq(sc.name + ' screen, PMO ' + label + ': §16.2’s line, only where a row is on its plan events', ns.includes(PE_LINE), Object.values(tab).some(x => x.basis === 'planEvent'));
      }

      // ---------------------------------------------------------------- Import report
      m = await T.view('report');
      const sec = m.querySelector('section.obbba');
      C.eq(sc.name + ' screen, Import report: the section on FY2025 OBBBA funding, headed in §15.4’s words, only where a row it leaves out is loaded',
        sec ? flat(sec.querySelector('h3').textContent) : null, lines.length ? HEAD : null);
      if (sec) C.eq(sc.name + ' screen, Import report: its lines', [...sec.querySelectorAll('.rl')].map(e => e.textContent), lines.map(s => s.trim()));
      const els = m.querySelector('section.obbba-else');
      C.eq(sc.name + ' screen, Import report: OBBBA funding outside O&M, line by line, only where the oracle lists some (§17.3)',
        els ? [flat(els.querySelector('h3').textContent)].concat([...els.querySelectorAll('.rl')].map(e => e.textContent)) : [],
        elseLines(X).length ? [ELSE_HEAD].concat(elseLines(X)) : []);
      reach.elsewhere += elseLines(X).length;
      if (X.bae) {
        const R = m.querySelector('section.baeread');
        const li = R && R.querySelector('ul.baerows li[data-scope=obbba]');
        C.eq(sc.name + ' screen, Import report: rows by scope count FY2025 OBBBA, only where such a row is loaded', li ? li.textContent : null,
          'obbba' in X.bae.rows ? WHY + ', counted nowhere: ' + rows1(X.bae.rows.obbba) + '.' : null);
        for (const t of obNoBlocks(X)) {
          const td = R && R.querySelector('table.baeblocks tr[data-bk="' + t.ap + '|' + t.fy + '"] td.wrap');
          C.eq(sc.name + ' screen, Import report: ' + fyName(t) + ', On this page (§15.4)', td && td.textContent, WHERE);
        }
        const items = cls => [...R.querySelectorAll('ul.' + cls + ' li')].map(e => flat(e.textContent));
        C.eq(sc.name + ' screen, Import report: the budgets split among PMOs, each PMO’s plan and shares (§16.2)', items('pmosplit'), splitItems(X));
        C.eq(sc.name + ' screen, Import report: the report money no plan event uses, each budget and why (§16.2)', items('unassigned'), unItems(X));
        reach.split += X.bae.split.length; reach.unassigned += unItems(X).length;
      }

      // ---------------------------------------------------------------- Settings
      m = await T.view('settings');
      const rl = m.querySelector('p.obbba-rule');
      C.eq(sc.name + ' screen, Settings: the rule under First FY, only where a row it leaves out is loaded', rl && rl.textContent, obLoaded(X) ? RULE : null);

      // ============================================================================== THE WORKBOOK
      const B = await exportBook(T, sc.name);
      // ---------------------------------------------------------------- Summary
      const S = sheetRows(B, 'Summary');
      const tot = S.findIndex(r => r && r[0] === 'TOTAL - Sustainment');
      const data = S.slice(4, tot);
      let ap = null;
      const badW = [];
      const gotKeys = data.map(r => { if (r[0]) ap = Object.keys(AP).find(a => AP[a] === r[0]); return ap + '|' + r[1]; });
      C.eq(sc.name + ' Summary sheet: its rows are the oracle’s blocks', gotKeys, keys);
      data.forEach((r, j) => {
        const x = X.blocks[keys[j]];
        if (x && ![x.approved, x.authorized, x.obligated, x.unobligated].every((c, i) => moneyOk(r[2 + i], c))) badW.push(keys[j] + ' ' + J(r.slice(2, 6)));
      });
      if (tot < 0 || ![X.summary.approved, X.summary.authorized, X.summary.obligated, X.summary.unobligated].every((c, i) => moneyOk(S[tot][2 + i], c))) badW.push('TOTAL');
      C.chk(sc.name + ' Summary sheet: every row and the TOTAL are the oracle’s', !badW.length, badW.slice(0, 4).join('; '));
      const nAt = S.findIndex(r => r && r[0] === 'Notes:');
      const wNotes = nAt < 0 ? [] : S.slice(nAt + 1).map(r => r && r[0]).filter(v => typeof v === 'string');
      for (const n of wantNotes) C.chk(sc.name + ' Summary sheet: the note “' + n.slice(0, 60) + '…”', wNotes.includes(n), J(wNotes));
      C.eq(sc.name + ': the Summary’s notes are one list on the screen and in the workbook (§15.4)', wNotes, sNotes);

      // ---------------------------------------------------------------- the raw data sheets' Counted (§15.4)
      if (X.rawCounted) {
        for (const a of Object.keys(RAW_SHEET)) {
          const want = (X.rawCounted[a] || []).map(z => z[3]);
          const R = sheetRows(B, RAW_SHEET[a]);
          if (!want.length) { C.chk(sc.name + ' ' + RAW_SHEET[a] + ': no sheet where the oracle has no row', !R); continue; }
          if (!C.chk(sc.name + ' ' + RAW_SHEET[a] + ' exists', !!R)) continue;
          const ci = R[0].indexOf('Counted');
          const got = R.slice(1).map(r => rawCode(String(r[ci])));
          C.eq(sc.name + ' ' + RAW_SHEET[a] + ': Counted, row by row, is the oracle’s first §4.3 condition failed (§15.2: OBBBA after First FY)', got, want);
          reach.rawOb += want.filter(w => w === 'obbba').length;
          reach.rawObReport += want.filter(w => w === 'obbbaReport').length;
          reach.beforeFirst += want.filter(w => w === 'beforeFirst').length;
        }
      }

      // ---------------------------------------------------------------- Import Report
      const IR = sheetRows(B, 'Import Report').map(r => r && r[0]).filter(v => typeof v === 'string');
      const h = IR.indexOf(HEAD);
      C.eq(sc.name + ' Import Report sheet: the section on FY2025 OBBBA funding, only where a row it leaves out is loaded', h >= 0, lines.length > 0);
      if (h >= 0) C.eq(sc.name + ' Import Report sheet: its lines, the screen’s', IR.slice(h + 1, h + 1 + lines.length), lines.map(l => '  ' + l));
      const eh = IR.indexOf(ELSE_HEAD);
      C.eq(sc.name + ' Import Report sheet: OBBBA funding outside O&M, the screen’s lines (§17.3)', eh >= 0 ? IR.slice(eh + 1, eh + 1 + elseLines(X).length) : [],
        elseLines(X).map(l => '  ' + l));
      if (X.bae) {
        const r = X.bae.rows, rw = n => rows1(n || 0);
        C.chk(sc.name + ' Import Report sheet: rows by what they are, FY2025 OBBBA among them where loaded (§15.4)', IR.includes('  Rows by what they are (every FY, whatever the switches show): '
          + rw(r.in) + ' of sustainment budgets (their names place them in O&M, Full Fund, Initial Spares or OPN); counted nowhere, ' + rw(r.flyaway)
          + ' of Full Fund Flyaway (aircraft production), ' + rw(r.noap) + ' naming no appropriation' + ('obbba' in r ? ', ' + rw(r.obbba) + ' of ' + WHY : '')
          + ' and ' + rw(r.bad) + ' that could not be read.'), J(IR.filter(l => l.startsWith('  Rows by'))));
        const obK = new Set(obNoBlocks(X).map(t => t.ap + '|' + t.fy));
        const byWant = Object.entries(X.bae.byBlock).map(([k, v]) => '    ' + AP[k.split('|')[0]] + ' FY' + k.split('|')[1] + ': Approved ' + usd(v.approved) + ', Authorized '
          + usd(v.authorized) + (obK.has(k) ? '; ' + WHERE : '') + '.');
        const bh = IR.findIndex(l => l.startsWith('  The sustainment budgets’ Approved and Authorized by appropriation and FY'));
        C.eq(sc.name + ' Import Report sheet: by appropriation and FY, an obbba noBlock in §15.4’s words', bh < 0 ? null : IR.slice(bh + 1, bh + 1 + byWant.length).sort(), byWant.slice().sort());
        const sw = X.shown.all ? '' : ', with the switches as they are (';
        for (const [head, its] of [['Budgets split among PMOs by their plan events', splitItems(X)], ['BAE report money no plan event uses (on no PMO tab)', unItems(X)]]) {
          const at = IR.findIndex(l => l.startsWith('  ' + head));
          C.chk(sc.name + ' Import Report sheet: “' + head + '”, with the switch wording when one is off (§16.2)', at >= 0 && IR[at].startsWith('  ' + head + sw)
            && IR[at].endsWith(': ' + (its.length ? its.length + '.' : 'none.')), at >= 0 ? IR[at] : 'missing');
          if (at >= 0) C.eq(sc.name + ' Import Report sheet: “' + head + '”, item by item (§16.2)', IR.slice(at + 1, at + 1 + its.length), its.map(t => '    ' + t));
        }
      }

      // ---------------------------------------------------------------- Settings
      const ST = sheetRows(B, 'Settings').map(r => r && r[0]);
      const fa = ST.indexOf('First FY shown');
      C.eq(sc.name + ' Settings sheet: the rule right under First FY shown, only where a row it leaves out is loaded', fa >= 0 && ST[fa + 1] === RULE, obLoaded(X));
      C.chk(sc.name + ' Settings sheet: the rule once at most', ST.filter(v => v === RULE).length === (obLoaded(X) ? 1 : 0));

      // ---------------------------------------------------------------- BAE Report sheet: Counted and PMO, row by row
      if (X.bae) {
        const BR = B.sheets.find(x => x.name === 'BAE Report');
        if (C.chk(sc.name + ': the workbook has a BAE Report sheet', !!BR)) {
          const head = []; for (const [ci, v] of BR.rows[0].cells) head[ci] = v;
          const ci = head.indexOf('Counted'), pi = head.indexOf('PMO', ci - 2);
          C.chk(sc.name + ' BAE Report: its last columns are Appropriation, Service, Lane, PMO, Counted', ci === head.length - 1 && pi === ci - 1 && head[ci - 4] === 'Appropriation', J(head.slice(-6)));
          // the sheet writes the report's rows in file order under its header, leaving out the rows blank in all four
          // columns (the oracle skips them too) and keeping the report's own total row, which the oracle states apart: so the
          // sheet's n-th row other than the total row is the n-th row the oracle counts, by file row
          const rowsOf = BR.rows.slice(1).map(r => { const a = []; for (const [c, v] of r.cells) a[c] = v; return a; })
            .filter(a => !/^No: the report’s own total row/.test(String(a[ci])));
          const want = X.bae.counted.slice().sort((a, b) => a[0] - b[0]), goes = new Map(X.bae.pmoColumn);
          const bad = [];
          if (rowsOf.length !== want.length) bad.push(rowsOf.length + ' rows, the oracle counts ' + want.length);
          want.forEach(([rn, why], i) => {
            const a = rowsOf[i];
            if (!a) return;
            if (a[ci] !== why) bad.push('row ' + rn + ' Counted ' + J(a[ci]) + ' want ' + J(why));
            const g = goes.has(rn) ? goes.get(rn) : '';
            if ((a[pi] ?? '') !== g) bad.push('row ' + rn + ' PMO ' + J(a[pi]) + ' want ' + J(g));
          });
          C.chk(sc.name + ' BAE Report: every row’s Counted and PMO are the oracle’s, row by row in file order (§15.4, §16.2)', !bad.length && want.length > 0, bad.slice(0, 4).join('; '));
          C.eq(sc.name + ' BAE Report: Counted says FY2025 O&M OBBBA funding exactly as often as the oracle does, by name and by Budget Flex 02',
            [WHY, WHY_FLEX].map(x => rowsOf.filter(a => a[ci] === x).length), [WHY, WHY_FLEX].map(x => want.filter(([, w]) => w === x).length));
          // §17.1, §14.6: the report's own Budget Flex columns are on the sheet as the file has them, row by row, so a reader can
          // see the mark a row was left out for (the manifest's own record of each written cell, never the oracle's)
          if (sc.part === 'obbba2') {
            const fx = ['01', '02', '03'].map(n => head.indexOf('Budget Flex ' + n));
            const data = manifest.obbba2.bae.filter(r => r.kind === 'data').sort((a, b) => a.row - b.row);
            const badF = [];
            if (fx.some(i => i < 0)) badF.push('columns ' + J(fx));
            else data.forEach((r, i) => {
              const a = rowsOf[i];
              const got = fx.map(j => (a && a[j] !== undefined && a[j] !== null) ? String(a[j]) : '');
              if (J(got) !== J([r.flex01 || '', r.flex02 || '', r.flex03 || ''])) badF.push('row ' + r.row + ' ' + J(got) + ' want ' + J([r.flex01, r.flex02, r.flex03]));
            });
            C.chk(sc.name + ' BAE Report: Budget Flex 01, 02 and 03 are the file’s, row by row (the mark a row was left out for)', !badF.length && data.length === want.length, badF.slice(0, 4).join('; '));
            reach.flexCols++;
          }
        }
      }

      // ---------------------------------------------------------------- PMO sheets: the oracle's rows, §16.2's line
      for (const [label, tab] of Object.entries(X.pmoTabs)) {
        const name = 'PMO ' + X.pmoCodes[label], P = sheetRows(B, name);
        if (!C.chk(sc.name + ' ' + name + ' exists', !!P)) continue;
        const ks = tabOrder(Object.keys(tab)), bad = [];
        ks.forEach((k, j) => {
          const r = P[3 + j], x = tab[k];
          if (!r || r[1] !== Number(k.split('|')[1]) || ![x.approved, x.authorized, x.obligated, x.unobligated].every((c, i) => moneyOk(r[2 + i], c))) bad.push(k + ' ' + J(r && r.slice(1, 6)));
        });
        C.chk(sc.name + ' ' + name + ': every row is the oracle’s, in the tab’s order (§16.1)', !bad.length, bad.slice(0, 3).join('; '));
        C.eq(sc.name + ' ' + name + ': §16.2’s line, only where a row is on its plan events', P.some(r => r && r[0] === PE_LINE), Object.values(tab).some(x => x.basis === 'planEvent'));
      }
      T.t.close();
    });
  }

  // a fixture that could not reach a rule would make every check above pass for nothing
  C.chk('fixture: the scenarios reach §15’s note, an obbba noBlock, the section with the report’s rows, OBBBA and before-First-FY Counted, a switch',
    reach.obNote >= 3 && reach.noBlock >= 1 && reach.obSection >= 3 && reach.inReport >= 1 && reach.rawOb > 0 && reach.beforeFirst > 0 && reach.sw >= 2, J(reach));
  C.chk('fixture: and §16’s split budgets, unassigned money and PMO rows on plan events', reach.split > 0 && reach.unassigned > 0 && reach.planEvent > 0, J(reach));
  // §17: the obbba fixture's Full Fund FY2025 OBBBA rows count, so the list of OBBBA money outside O&M is drawn and held
  C.chk('fixture: and §17’s OBBBA money outside O&M', reach.elsewhere > 0, J(reach));
  // §17.4: the obbba2 scenarios reach a pull budget left out because the report marks it (its section line and its raw rows),
  // report rows marked in Budget Flex 02 alone, OBBBA money outside O&M marked so, and the Flex columns on the BAE Report sheet
  C.chk('fixture: and §17’s marks in Budget Flex 02: a pull budget the report marks, its raw rows, report rows, money outside O&M, the sheet’s columns',
    reach.byReport >= 2 && reach.rawObReport > 0 && reach.flexWhy >= 2 && reach.elseFlex >= 2 && reach.flexCols >= 3, J(reach));
} catch (e) {
  C.chk('the test ran to the end: ' + String((e && e.stack) || e).split('\n').slice(0, 3).join(' | '), false);
}
tmp.rm();
C.done();
