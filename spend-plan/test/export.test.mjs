// The Excel workbook (CONTRACT §8): SP.excelBytes, SP.excelSpec, SP.excelFileName, SP.exportExcel.
//
// The workbook is written from the synthetic fixture, then READ BACK with Python's openpyxl (test/export-read.py) and with
// LibreOffice, never with the tool's own reader, and every figure it prints is compared to test/fixture/oracle.py's
// expected.json, which works them out from the fixture files alone. So a figure the export misplaces, rounds, mislabels or
// drops is a disagreement with an independent answer, not an echo of the model it was written from. The raw data sheets
// are compared row by row to the fixture's own manifest (what each generated row is).
//
//   node spend-plan/test/export.test.mjs
// The test runs in a zone that is not UTC, so a time the workbook writes in UTC cannot pass for this computer's own (review
// XP-9): at 12:00Z it is 07:00 in New York. Set before any date is made; Node reads TZ again when it changes.
process.env.TZ = 'America/New_York';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTool, checks, scratchDir } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const MAKE = join(HERE, 'fixture', 'make_fixture.py');
const ORACLE = join(HERE, 'fixture', 'oracle.py');
const READ = join(HERE, 'export-read.py');
const C = checks('export');
const tmp = scratchDir('sfcbsp-export-');
const t = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine', 'xlsx-write', 'export'] });
const SP = t.SP;
const NOW = '2026-11-09T12:00:00.000Z', TODAY = '2026-11-09';

// ------------------------------------------------------------------------------------------------ restated from §2–§8
// Restated, never read from the tool: a change on either side is then a disagreement this test reports, not an echo.
const COLS = ['prior', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12', 'next', 'nodate'];
const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const AP_LABEL = { om: 'O&M', ff: 'Full Fund', sp: 'Initial Spares', opn: 'OPN' };
const AP_ORDER = ['om', 'ff', 'sp', 'opn'], PMO_TAB_ORDER = ['ff', 'sp', 'om', 'opn'];
const RAW_SHEET = { om: 'O&M Raw Data', ff: 'FF Raw Data', sp: 'Spares Raw Data', opn: 'OPN Raw Data' };
const RAW_HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];
const PMO_ORDER = ['air vehicle (av)', 'business operations (bop)', 'combat data systems (cds)', 'maintenance systems (mxs)',
  'product support management (psm)', 'propulsion (pp)', 'training systems (tss)'];
const SERVICES = ['USAF', 'USAF ANG', 'USAF AFRC', 'USMC B (STOVL)', 'USMC C (USMC CV)', 'USN (USN CV)', 'Service not identified'];
const STATUS_FILL = { green: '00B050', yellow: 'FFD700', red: 'C00000' };
const STATUS_WORD = { green: 'On track', yellow: 'Within 10', red: 'Behind' };
const STATUS_INK = { green: 'FFFFFF', yellow: '000000', red: 'FFFFFF' };
const CUI = 'CUI//REL TO US DoW';
const normKey = s => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const pad2 = n => String(n).padStart(2, '0');
const commas = d => d.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
// §2 fmtM, restated: $M to two decimals, '-' for zero, '<0.01' under $5,000, negatives in parentheses
function fmtM(c) {
  if (c === 0) return '-';
  const a = Math.abs(c);
  let body;
  if (a < 500000) body = '<0.01';
  else { let q = Math.floor(a / 1e6); if (a - q * 1e6 >= 500000) q++; body = commas(String(Math.floor(q / 100))) + '.' + pad2(q % 100); }
  return c < 0 ? '(' + body + ')' : body;
}
// $M inside a sentence (the Obligation % label, the PMO strip): §2's fmtM, with zero written 0.00 (a lone dash in a
// sentence reads as a figure left out). One wording on the screen, the workbook and the picture (review R7); it was
// v12's TEXT(x,"#,##0.00"), which printed -1,234.57 beside cells reading (1,234.57) and 0.00 for $3,000.
const mSent = c => (c === 0 ? '0.00' : fmtM(c));
// "#,##0.00" of $M, as a cell with that format displays it (the LibreOffice check of the TOTAL row)
function m2(c) {
  const a = Math.abs(c); let q = Math.floor(a / 1e6); if (a - q * 1e6 >= 500000) q++;
  return (c < 0 && q ? '-' : '') + commas(String(Math.floor(q / 100))) + '.' + pad2(q % 100);
}
// §5's tags and the Not Allocated sheet's Status words, from a status group
const tagOf = g => g === 'na' ? '' : g === 'unprog' ? ' [Unprogrammed]' : g === 'fcst' ? ' [Forecast]' : ' [' + g.slice(6) + ']';
const statusWordOf = g => g === 'na' ? 'Not Allocated' : g === 'unprog' ? 'Unprogrammed' : g === 'fcst' ? 'Forecast' : g.slice(6);
// §4.4 PMO order: the seven by the list, then the rest by label, '(no PMO)' last
function pmoSorted(labels) {
  const rank = l => { const i = PMO_ORDER.indexOf(normKey(l)); return i >= 0 ? [0, i] : l === '(no PMO)' ? [2, 0] : [1, 0]; };
  return labels.slice().sort((a, b) => { const x = rank(a), y = rank(b); return x[0] - y[0] || x[1] - y[1] || cmp(a, b); });
}
// v12's PMO TAB order, which is not its block order: its tabs run AV, BOP, CDS, MxS, PP, PSM, TSS (review XP-5), while a
// block's PMO rows put PSM before PP (§4.4). Any other PMO follows by label, '(no PMO)' last.
const PMO_TAB_SEQ = ['air vehicle (av)', 'business operations (bop)', 'combat data systems (cds)', 'maintenance systems (mxs)',
  'propulsion (pp)', 'product support management (psm)', 'training systems (tss)'];
function tabSorted(labels) {
  const rank = l => { const i = PMO_TAB_SEQ.indexOf(normKey(l)); return i >= 0 ? [0, i] : l === '(no PMO)' ? [2, 0] : [1, 0]; };
  return labels.slice().sort((a, b) => { const x = rank(a), y = rank(b); return x[0] - y[0] || x[1] - y[1] || cmp(a, b); });
}
// this computer's date and time, 'YYYY-MM-DD HH:MM', as the Import Report writes an import's time (review XP-9)
function localWhen(iso) {
  const d = new Date(iso);
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}
function shownText(X) {
  if (X.shown.all) return 'All services, both lanes';
  const sv = X.shown.services.length === SERVICES.length ? 'all' : X.shown.services.length ? X.shown.services.join(', ') : 'none';
  const ln = X.shown.lanes.length ? X.shown.lanes.map(l => (l === 'disc' ? 'Discretionary' : 'Mandatory')).join(', ') : 'none';
  return 'Services shown: ' + sv + '; lanes shown: ' + ln;
}

// ------------------------------------------------------------------------------------------------ the read-back
function py(args) { return spawnSync('python3', ['-I', ...args], { encoding: 'utf8', maxBuffer: 1 << 30 }); }
function readBook(file) {
  const r = py([READ, file]);
  if (r.status !== 0) throw new Error('export-read.py failed: ' + r.stderr.slice(-800));
  return JSON.parse(r.stdout);
}
// LibreOffice, with a profile of its own so another soffice on this machine (another builder's test) cannot collide
function soffice(args, out) {
  mkdirSync(out, { recursive: true });
  return spawnSync('soffice', ['-env:UserInstallation=file://' + join(tmp.dir, 'lo-profile'), '--headless', '--norestore', ...args,
    '--outdir', out], { encoding: 'utf8', timeout: 240000 });
}
// one sheet's rows as plain objects: cell(ci) -> {v, st} where st is [fill, fontColour, bold, italic, fmt, size, indent, h]
function sheetView(book, name) {
  const s = book.sheets.find(x => x.name === name);
  if (!s) return null;
  const rows = s.rows.map(r => {
    const m = new Map();
    for (const [ci, v, si] of r.cells) m.set(ci, { v, st: book.styles[si] });
    return { r: r.r, level: r.level, hidden: r.hidden, ht: r.ht, m, v: ci => (m.has(ci) ? m.get(ci).v : null), st: ci => (m.has(ci) ? m.get(ci).st : null) };
  });
  return { s, rows };
}
const isBlank = row => !row || [...row.m.values()].every(c => c.v === null || c.v === undefined || c.v === '');
// a money cell: want null -> no value; want cents -> the cell holds cents/1e8 to 1e-9
function moneyOk(got, want) {
  if (want === null || want === undefined) return got === null || got === undefined;
  return typeof got === 'number' && Math.abs(got - want / 1e8) <= 1e-9;
}
function pctOk(got, want) {
  if (want === null || want === undefined) return got === null || got === undefined;
  return typeof got === 'number' && Math.abs(got - want) <= 1e-12;
}
const show = v => JSON.stringify(v);
// §2: "nothing non-zero reads as zero". A money cell under $5,000 holds its number and shows '<0.01' or '(<0.01)' by its
// format; #,##0.00 showed 0.00, against the '<0.01' the screens and pictures print for the same cell (review XP-6)
const TINY_FM = '"<0.01";"(<0.01)";-';
const isTiny = v => typeof v === 'number' && v !== 0 && Math.abs(v) < 0.005;

// The block columns as the header row lays them out: A label, B Total, then Prior Yr … FY{E+1}+ [, No date], then Total
function blockLayout(X) {
  const ids = COLS.slice(0, 14).concat(X.showNoDate ? ['nodate'] : []);
  const at = {};
  ids.forEach((id, j) => { at[id] = 2 + j; });
  const labels = ['Prior Yr'].concat(MONTHS, ['FY' + pad2((X.E + 1) % 100) + '+'], X.showNoDate ? ['No date'] : []);
  return { ids, at, last: 2 + ids.length, labels, W: 3 + ids.length };
}

// ------------------------------------------------------------------------------------------------ comparing a block
function checkHeader(where, row, first, L) {
  const got = []; for (let i = 0; i < L.W; i++) got.push(row ? row.v(i) : null);
  C.eq(where + ': the header row', got, [first, 'Total'].concat(L.labels, ['Total']));
  C.chk(where + ': the header row is light gold', row && row.st(0) && row.st(0)[0] === 'FFE699', show(row && row.st(0)));
}
// a money row: label, its Total twice, every shown column
function checkMoneyRow(where, row, L, total, cols) {
  if (!C.chk(where + ' is there', !!row)) return;
  const bad = [];
  if (!moneyOk(row.v(1), total)) bad.push('Total (B) ' + row.v(1) + ' want ' + total / 1e8);
  if (!moneyOk(row.v(L.last), total)) bad.push('Total (last) ' + row.v(L.last));
  for (const id of L.ids) if (!moneyOk(row.v(L.at[id]), cols[id])) bad.push(id + ' ' + row.v(L.at[id]) + ' want ' + (cols[id] === null ? null : cols[id] / 1e8));
  for (const id of COLS) if (!(id in L.at) && cols[id] !== 0 && cols[id] !== null && cols[id] !== undefined) bad.push(id + ' holds ' + cols[id] + ' but is not shown');
  C.chk(where + ': every figure', !bad.length, bad.slice(0, 5).join('; '));
}
// Monthly Totals, Cumulative Totals, Obligation %, OSD Goal %, OSD Status, from the row labelled Monthly Totals
function checkBand(where, rows, i, L, X, x) {
  const mt = rows[i], cu = rows[i + 1], ob = rows[i + 2], go = rows[i + 3], stt = rows[i + 4];
  C.eq(where + ': the totals band labels', [mt, cu, go, stt].map(r => r && r.v(0)), ['Monthly Totals', 'Cumulative Totals', 'OSD Goal %', 'OSD Status']);
  checkMoneyRow(where + ' Monthly Totals', mt, L, x.approved, x.cols);
  checkMoneyRow(where + ' Cumulative Totals', cu, L, x.approved, x.cum);
  const lab = ob && ob.v(0);
  const actual = MONTHS[X.asOfIndex - 1];
  C.eq(where + ': the Obligation % label', lab, 'Obligation %  (Approved ' + mSent(x.approved) + 'M; actual through ' + actual + ', plan after)');
  const bad = [];
  for (const [r, k] of [[ob, 'obl'], [go, 'goal']]) {
    if (!r) { bad.push(k + ' row missing'); continue; }
    const tot = k === 'obl' ? x.oblPct : x.goal;
    if (!pctOk(r.v(1), tot) || !pctOk(r.v(L.last), tot)) bad.push(k + ' Total ' + r.v(1) + '/' + r.v(L.last) + ' want ' + tot);
    for (const id of L.ids) {
      const want = k === 'obl' ? x.obl[id][0] : x.goalC[id];
      if (!pctOk(r.v(L.at[id]), want)) bad.push(k + ' ' + id + ' ' + r.v(L.at[id]) + ' want ' + want);
    }
  }
  C.chk(where + ': Obligation % and OSD Goal % in every column', !bad.length, bad.slice(0, 5).join('; '));
  // the plan cells of Obligation % are italic and grey; the actual ones are not
  const pb = [];
  if (ob) for (const id of L.ids) {
    const kind = x.obl[id][1], st = ob.st(L.at[id]);
    // an empty cell (no Approved, so no percentage) has nothing to be italic: only a printed plan figure is judged
    if (kind === 'plan' && x.obl[id][0] !== null && !(st && st[3] && st[1] === '808080')) pb.push(id + ' plan, not italic grey');
    if (kind === 'actual' && st && st[3]) pb.push(id + ' actual, but italic');
  }
  C.chk(where + ': Obligation % plan cells are italic and grey, actual ones are not', !pb.length, pb.join('; '));
  // status: the word in the cell, on its colour; plan cells italic; no status, no word and no status colour
  const sb = [];
  const one = (cell, status, kind, what) => {
    const v = cell ? cell.v : null, st = cell ? cell.st : null;
    if (status) {
      if (v !== STATUS_WORD[status]) sb.push(what + ' word ' + show(v) + ' want ' + STATUS_WORD[status]);
      if (!st || st[0] !== STATUS_FILL[status]) sb.push(what + ' fill ' + (st && st[0]) + ' want ' + STATUS_FILL[status]);
      // a plan status is italic in the status's own ink (integration ruling: grey on the fill could not be read)
      if (kind === 'plan' && !(st && st[3] && st[1] === STATUS_INK[status])) sb.push(what + ' plan, not italic in ' + STATUS_INK[status]);
      if (kind !== 'plan' && st && (st[3] || st[1] !== STATUS_INK[status])) sb.push(what + ' ink ' + (st && st[1]) + ' want ' + STATUS_INK[status]);
    } else {
      if (v !== null && v !== undefined && v !== '') sb.push(what + ' has a word ' + show(v) + ' but no status');
      if (st && Object.values(STATUS_FILL).includes(st[0])) sb.push(what + ' has a status colour but no status');
      // review S9: no fill of its own, only the closed months' grey, as on the screen; v12's FFE699 base fill was a
      // word-less near-yellow beside "Within 10"
      if (st && st[0] && !(closedId && st[0] === 'F2F2F2')) sb.push(what + ' has no status but the fill ' + st[0]);
    }
  };
  let closedId = false;
  if (stt) {
    one(stt.m.get(1), x.status, 'actual', 'Total (B)');
    one(stt.m.get(L.last), x.status, 'actual', 'Total (last)');
    for (const id of L.ids) {
      closedId = id === 'prior' || (/^m\d+$/.test(id) && Number(id.slice(1)) <= X.asOfIndex);
      one(stt.m.get(L.at[id]), x.statusC[id][0], x.statusC[id][1], id);
    }
    closedId = false;
  }
  C.chk(where + ': OSD Status in every column (colour, word, plan italic)', !sb.length, sb.slice(0, 6).join('; '));
  // closed columns carry the light grey fill on Monthly Totals; open ones do not
  const cb = [];
  if (mt) for (const id of L.ids) {
    const closed = id === 'prior' || (/^m\d+$/.test(id) && Number(id.slice(1)) <= X.asOfIndex);
    const fill = mt.st(L.at[id]) && mt.st(L.at[id])[0];
    if (closed !== (fill === 'F2F2F2')) cb.push(id + (closed ? ' closed without' : ' open with') + ' the grey fill');
  }
  C.chk(where + ': closed columns are shaded, open ones are not', !cb.length, cb.join('; '));
  return i + 5;
}
// §5's lines as the sheet prints them: the bar, then 'Oct:' + text (a long month continues on rows with no label)
function readNa(rows, i) {
  const out = [];
  if (!rows[i] || rows[i].v(0) !== 'Not Allocated Requirements') return { out: null, next: i };
  let j = i + 1;
  for (; j < rows.length && !isBlank(rows[j]); j++) {
    const lab = rows[j].v(0), text = rows[j].v(1);
    if (lab) out.push([lab, String(text)]);
    else if (out.length) out[out.length - 1][1] += '; ' + text;
    else out.push(['', String(text)]);
  }
  return { out, next: j };
}
function wantNa(na, L) {
  const by = new Map();
  for (const [col, group, key, cents, label] of na) {
    if (!by.has(col)) by.set(col, []);
    by.get(col).push(label + ' ($' + fmtM(cents) + 'M)' + tagOf(group));
  }
  const out = [];
  COLS.forEach((id, k) => {
    if (!by.has(id)) return;
    const lab = k === 0 ? 'Prior Yr' : k <= 12 ? MONTHS[k - 1] : k === 13 ? L.labels[13] : 'No date';
    out.push([lab + ':', by.get(id).join('; ')]);
  });
  return out.length ? out : [['', 'None.']];
}
function checkNa(where, rows, i, na, L) {
  const { out, next } = readNa(rows, i);
  if (!C.chk(where + ': the Not Allocated bar follows the band', out !== null, 'row ' + (rows[i] && rows[i].r) + ' reads ' + show(rows[i] && rows[i].v(0)))) return i;
  const want = wantNa(na, L);
  const d = JSON.stringify(out) === JSON.stringify(want);
  C.chk(where + ': the Not Allocated lines', d, d ? '' : 'got ' + JSON.stringify(out).slice(0, 400) + ' want ' + JSON.stringify(want).slice(0, 400));
  return next;
}

// ------------------------------------------------------------------------------------------------ the fixture
const ab = p => { const b = readFileSync(p); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };
function oracle(sc, args) {
  const out = join(tmp.dir, 'exp-' + sc + '.json');
  const r = py([ORACLE, ...(args || ['--scenario', sc, '--fixture', tmp.dir]), '--out', out]);
  if (r.status !== 0) throw new Error('the oracle failed on ' + sc + ': ' + r.stderr.slice(-800));
  return JSON.parse(readFileSync(out, 'utf8'));
}

try {
  C.eq('the modules boot with no script errors', t.errors, []);
  const mk = py([MAKE, '--out', tmp.dir]);
  if (mk.status !== 0) throw new Error('make_fixture failed: ' + mk.stderr);
  const manifest = JSON.parse(readFileSync(join(tmp.dir, 'manifest.json'), 'utf8'));
  const intents = new Map(manifest.gen1.map(i => [i.id, i]));
  const parsed = await SP.parseFiles([{ name: 'pull-all.xlsx', data: ab(join(tmp.dir, 'pull-all.xlsx')) }], { now: NOW });

  // 'auth' is every switch on with Authorized entered for two blocks, one of them as $0 (an entered 0 is entered), so
  // the † and the entered figure are both read back; the oracle is given the same entries.
  const AUTH = { 'om|2026': 50000000000, 'ff|2025': 0 };
  writeFileSync(join(tmp.dir, 'auth.json'), JSON.stringify({ authorized: AUTH }));
  const SCENARIOS = [{ name: 'all', off: [] }, { name: 'usaf-off', off: ['USAF'] },
    { name: 'auth', off: [], auth: AUTH, args: ['--files', join(tmp.dir, 'pull-all.xlsx'), '--asof', '2026-10', '--first', '2025', '--settings', join(tmp.dir, 'auth.json')] }];
  let allFile = null, allSheetCount = 0, allX = null, allModel = null, allSettings = null, allTiny = [];
  for (const sc of SCENARIOS) {
    const X = oracle(sc.name, sc.args);
    const settings = SP.defaultSettings(TODAY);
    settings.asOf = X.asOf; settings.firstFY = X.firstFY;
    if (sc.auth) settings.authorized = JSON.parse(JSON.stringify(sc.auth));
    const view = SP.defaultView();
    for (const s of sc.off) view.svc[s] = false;
    const model = SP.buildModel(parsed.pulls, settings, view);
    const t0 = Date.now();
    const bytes = await SP.excelBytes(model, parsed.pulls, settings, { report: parsed.report, today: TODAY });
    const ms = Date.now() - t0;
    C.chk(sc.name + ': excelBytes gives a zip (PK)', bytes instanceof t.window.Uint8Array || bytes instanceof Uint8Array, typeof bytes);
    C.chk(sc.name + ': the bytes start with PK', bytes[0] === 0x50 && bytes[1] === 0x4b);
    C.eq(sc.name + ': the writer changed nothing on the way out', SP.lastXlsxNotes.messages, []);
    const file = join(tmp.dir, sc.name + '.xlsx');
    writeFileSync(file, bytes);
    const B = readBook(file);
    const names = B.sheets.map(s => s.name);
    const SX = shownText(X);

    // ------------------------------------------------------------------------------- the file name and the shown text
    const fname = SP.excelFileName(model, TODAY);
    C.eq(sc.name + ': the file name', fname, 'SFCB Spend Plan FY' + X.E + ' - data through Oct-' + (X.E - 1) + ' - ' + TODAY
      + (X.shown.all ? '' : ' [filtered]') + '.xlsx');
    if (sc.name === 'usaf-off') C.chk('usaf-off: the shown text says USAF is off', !SX.includes('USAF,') && SX.startsWith('Services shown: USAF ANG'), SX);

    // ------------------------------------------------------------------------------- the sheet list, in §8's order
    const apsWith = AP_ORDER.filter(ap => Object.keys(X.blocks).some(k => k.startsWith(ap + '|')));
    const pmoLabels = tabSorted(Object.keys(X.pmoTabs));
    const rawAps = AP_ORDER.filter(ap => X.rowsByAp[ap] !== undefined);
    C.eq(sc.name + ': the sheets, in order', names, ['Summary', 'Slide Snapshots'].concat(apsWith.map(ap => AP_LABEL[ap]),
      pmoLabels.map(l => 'PMO ' + X.pmoCodes[l]), ['Not Allocated'], rawAps.map(ap => RAW_SHEET[ap]), ['Import Report', 'Settings']));

    // ------------------------------------------------------------------------------- every sheet: CUI, page, gridlines
    const pb = [];
    for (const s of B.sheets) {
      const h = s.header.center, f = s.footer.center, fr = s.footer.right;
      if (!(h && h.text === CUI && /bold/i.test(h.font || ''))) pb.push(s.name + ' header ' + show(h));
      if (!(f && f.text === CUI && /bold/i.test(f.font || ''))) pb.push(s.name + ' footer ' + show(f));
      if (!(fr && fr.text === 'Page &P of &N')) pb.push(s.name + ' footer right ' + show(fr));
      if (s.orientation !== 'landscape' || String(s.paperSize) !== '1') pb.push(s.name + ' page ' + s.orientation + ' paper ' + s.paperSize);
      const raw = /Raw Data$/.test(s.name);
      // a raw data sheet is 36 columns, about 44 in wide: fitted to one page wide it printed at 23%, its 10 pt text at
      // 2.3 pt (review XP-11). It prints at full size across pages, as v12's raw tabs had no fit; reports fit one page wide.
      if (raw ? s.fitToPage : (!s.fitToPage || Number(s.fitToWidth) !== 1 || Number(s.fitToHeight) !== 0)) pb.push(s.name + ' fit ' + s.fitToPage + ' ' + s.fitToWidth + 'x' + s.fitToHeight);
      if (raw ? s.grid === false : s.grid !== false) pb.push(s.name + ' gridlines ' + s.grid);
      if (s.formulas) pb.push(s.name + ' holds formulas');
    }
    C.chk(sc.name + ': every sheet carries the CUI header and footer, letter landscape, reports fit to one page wide and raw data at full size, gridlines off on reports', !pb.length, pb.slice(0, 6).join('; '));
    C.eq(sc.name + ': no sheet holds a formula (values only)', B.sheets.filter(s => s.formulas).map(s => s.name), []);
    const L = blockLayout(X);

    // ------------------------------------------------------------------------------- §8.1 Summary
    {
      const S = sheetView(B, 'Summary'), rows = S.rows;
      C.eq(sc.name + ' Summary: title', rows[0].v(0), 'F-35 Sustainment Financial Execution - Top-Line Snapshot (FY' + pad2(X.E % 100) + 'Q' + Math.ceil(X.asOfIndex / 3) + ')');
      C.eq(sc.name + ' Summary: line 2 says the data-through month and the rules', rows[1].v(0), 'Data through Oct-' + (X.E - 1)
        + ' | Approved = total planned ($M from the CCaR pull) | Authorized = entered, else Approved | Obligated = CCaR status "Actual Execution"'
        + ' | Unobligated = Approved - Obligated | Delta = Obl% - OSD%');
      C.eq(sc.name + ' Summary: line 3 is the shown text', rows[2].v(0), SX);
      C.eq(sc.name + ' Summary: the header', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => rows[3].v(i)),
        ['Appropriation', 'FY', 'Approved ($M)', 'Authorized ($M)', 'Obligated ($M)', 'Unobligated ($M)', 'Obl %', 'OSD Goal %', 'Delta (pp)', 'Status']);
      C.eq(sc.name + ' Summary: frozen below the header', S.s.freeze, 'A5');
      const keys = Object.keys(X.blocks);
      const bad = [];
      let apNow = null, groupStart = 0;
      keys.forEach((k, j) => {
        const x = X.blocks[k], row = rows[4 + j];
        if (!row) { bad.push(k + ' has no row'); return; }
        if (x.ap !== apNow) {
          if (row.v(0) !== AP_LABEL[x.ap]) bad.push(k + ' label ' + row.v(0));
          apNow = x.ap; groupStart = 5 + j;
        } else if (row.v(0) !== null) bad.push(k + ' repeats its appropriation label');
        if (row.v(1) !== x.fy) bad.push(k + ' FY ' + row.v(1));
        // the FY is the number, shown as v12 shows it: FY2025 (review XP-5)
        if ((row.st(1) || [])[4] !== '"FY"0') bad.push(k + ' FY format ' + show(row.st(1)));
        if (!moneyOk(row.v(2), x.approved)) bad.push(k + ' approved ' + row.v(2));
        if (!moneyOk(row.v(3), x.authorized)) bad.push(k + ' authorized ' + row.v(3));
        if (!moneyOk(row.v(4), x.obligated)) bad.push(k + ' obligated ' + row.v(4));
        if (!moneyOk(row.v(5), x.unobligated)) bad.push(k + ' unobligated ' + row.v(5));
        if (!pctOk(row.v(6), x.oblPct)) bad.push(k + ' oblPct ' + row.v(6));
        if (!pctOk(row.v(7), x.goal)) bad.push(k + ' goal ' + row.v(7));
        if (!pctOk(row.v(8), x.delta)) bad.push(k + ' delta ' + row.v(8));
        const sw = row.v(9), sf = row.st(9) && row.st(9)[0];
        if (x.status ? sw !== STATUS_WORD[x.status] || sf !== STATUS_FILL[x.status] : (sw !== null || Object.values(STATUS_FILL).includes(sf))) bad.push(k + ' status ' + sw + '/' + sf);
        // † when Authorized was not entered: a number format, so the cell stays the figure
        const dag = (row.st(3) && row.st(3)[4] || '').includes('†');
        if (dag !== !x.authorizedEntered) bad.push(k + ' † ' + dag);
        if (row.st(8) && row.st(8)[4] !== '+0.00%;-0.00%;0.00%') bad.push(k + ' delta format ' + row.st(8)[4]);
        if (row.st(2) && row.st(2)[4] !== '#,##0.00;(#,##0.00);-' && row.st(2)[4] !== TINY_FM) bad.push(k + ' money format ' + row.st(2)[4]);
      });
      C.chk(sc.name + ' Summary: every block’s row against the oracle', !bad.length, bad.slice(0, 6).join('; '));
      // the appropriation label is merged down its rows
      const merges = new Set(S.s.merges);
      const groups = [];
      keys.forEach((k, j) => { const ap = X.blocks[k].ap; if (!groups.length || groups[groups.length - 1].ap !== ap) groups.push({ ap, a: 5 + j, b: 5 + j }); else groups[groups.length - 1].b = 5 + j; });
      C.eq(sc.name + ' Summary: each appropriation label is merged down its rows', groups.filter(g => g.b > g.a).map(g => merges.has('A' + g.a + ':A' + g.b)), groups.filter(g => g.b > g.a).map(() => true));
      const tot = rows[4 + keys.length], T = X.summary;
      C.chk(sc.name + ' Summary: TOTAL - Sustainment', tot && tot.v(0) === 'TOTAL - Sustainment' && moneyOk(tot.v(2), T.approved) && moneyOk(tot.v(3), T.authorized)
        && moneyOk(tot.v(4), T.obligated) && moneyOk(tot.v(5), T.unobligated) && pctOk(tot.v(6), T.oblPct) && [7, 8, 9].every(i => tot.v(i) === null),
        tot ? [0, 2, 3, 4, 5, 6, 7, 8, 9].map(i => tot.v(i)).join(' | ') : 'no row');
      C.chk(sc.name + ' Summary: the TOTAL row is navy, white, bold', tot && tot.st(0) && tot.st(0)[0] === '1F3A68' && tot.st(0)[1] === 'FFFFFF' && tot.st(0)[2]);
      // v12's TOTAL - Sustainment label is left-aligned with no indent (review XP-5)
      C.chk(sc.name + ' Summary: the TOTAL label is left-aligned, not indented, as v12’s', tot && tot.st(0) && tot.st(0)[7] === 'left' && !tot.st(0)[6], show(tot && tot.st(0)));
      const leg = rows.findIndex(r => r.v(0) === 'Legend (OSD Status):');
      C.eq(sc.name + ' Summary: the legend’s coloured cells and words', leg < 0 ? null : [1, 2, 3].map(d => [rows[leg + d].v(0), rows[leg + d].st(0) && rows[leg + d].st(0)[0], rows[leg + d].v(1)]),
        [['On track', '00B050', 'Green — at or above the OSD goal'], ['Within 10', 'FFD700', 'Yellow — within 10 points of it'], ['Behind', 'C00000', 'Red — more than 10 points behind']]);
      const notes = rows.findIndex(r => r.v(0) === 'Notes:');
      const ns = notes < 0 ? [] : rows.slice(notes + 1).map(r => r.v(0)).filter(Boolean);
      C.chk(sc.name + ' Summary: the notes name the money before the first FY, by FY', ns.some(n => /^Money before FY2025 is not shown: FY2024 \$/.test(n)), ns.join(' / '));
      C.chk(sc.name + ' Summary: the notes name the rows not counted', ns.some(n => /could not be read/.test(n)) && ns.some(n => /names no appropriation/.test(n)), ns.join(' / '));
      if (!X.shown.all) C.chk(sc.name + ' Summary: the notes say what is shown', ns.some(n => n.startsWith(SX)), ns.join(' / '));
    }

    // ------------------------------------------------------------------------------- §8.2 Slide Snapshots
    {
      const S = sheetView(B, 'Slide Snapshots'), rows = S.rows;
      C.eq(sc.name + ' Slides: title', rows[0].v(0), 'Slide Snapshots - picture-ready blocks for PowerPoint');
      // §8.2's line 2, restated. v12's "Each block is sized for a 13.33 in x 4.5 in slide region" was never so of the sheet
      // (review XP-3); the shape is measured below, against what this line says of it.
      C.eq(sc.name + ' Slides: line 2 says how to make the picture, and what a copied block is', rows[1].v(0),
        'The dashboard’s pictures fit a 13.33 in x 4.5 in slide region and are marked CUI: Slide blocks > Copy picture or Save pictures.'
        + ' To copy a block from this sheet instead, select it from the CUI line above its title through the CUI line under OSD Status'
        + ' and use Copy as Picture; it is wider for its height than that region, so size it by its width.');
      C.eq(sc.name + ' Slides: line 3 is the shown text', rows[2].v(0), SX);
      // Excel's own units: a column of width w is about 7w + 5 px at 96 dpi; a row is its height in points (15 if none)
      const colPx = S.s.colWidths.map(w => Math.trunc(7 * (w || 8.43) + 5));
      const merges = new Set(S.s.merges);
      const lastCol = String.fromCharCode(64 + L.W);
      const bars = rows.map((r, i) => [i, r.v(0)]).filter(([i, v]) => typeof v === 'string' && / - Spend Plan \(PMO Summary, slide-ready\)$/.test(v));
      C.eq(sc.name + ' Slides: one block per block, in model order', bars.map(b => b[1]),
        Object.values(X.blocks).map(x => AP_LABEL[x.ap] + ' FY' + x.fy + ' - Spend Plan (PMO Summary, slide-ready)'));
      const shapes = [];
      bars.forEach(([i], j) => {
        const k = Object.keys(X.blocks)[j], x = X.blocks[k], w = 'Slides ' + sc.name + ' ' + k;
        if (!x) return;
        // The range line 2 names starts at a CUI line, then (filtered) the shown text, then the bar: a range picture
        // carries no page header or footer and not line 3, so the marking and the filter must be inside it (review XP-2).
        const top = X.shown.all ? i - 1 : i - 2;
        const cuiAt = (rr, where) => {
          const row = rows[rr], st = row && row.st(0);
          C.chk(w + ': ' + where, row && row.v(0) === CUI && st && st[2] === true && st[7] === 'center'
            && merges.has('A' + row.r + ':' + lastCol + row.r), row ? show([row.v(0), st, row.r]) : 'no row');
        };
        cuiAt(top, 'the picture range opens with the CUI marking, bold, centred across the block');
        if (!X.shown.all) C.eq(w + ': the picture range states what is shown, under the marking', rows[i - 1] && rows[i - 1].v(0), SX);
        checkHeader(w, rows[i + 1], 'PMO', L);
        const want = Object.keys(x.pmos);
        let r = i + 2;
        const got = [];
        for (; r < rows.length && !isBlank(rows[r]); r++) got.push(rows[r]);
        C.eq(w + ': the PMO rows, every PMO with money, in order', got.map(g => g.v(0)), want);
        got.forEach(g => { if (x.pmos[g.v(0)]) checkMoneyRow(w + ' PMO ' + g.v(0), g, L, x.pmos[g.v(0)].total, x.pmos[g.v(0)].cols); });
        r++;
        C.eq(w + ': a blank row, then Monthly Totals', rows[r] && rows[r].v(0), 'Monthly Totals');
        r = checkBand(w, rows, r, L, X, x);
        cuiAt(r, 'the picture range closes with the CUI marking, under OSD Status');
        // the range's shape, CUI line to CUI line, as Excel would picture it
        const pxW = colPx.slice(0, L.W).reduce((a, b) => a + b, 0);
        let pt = 0; for (let q = top; q <= r; q++) pt += rows[q].ht || 15;
        shapes.push((pxW / 96) / (pt / 72));
        checkNa(w, rows, r + 1, x.na, L);
      });
      // what line 2 says of a block copied from here: wider for its height than the 13.33 x 4.5 in region (2.96 : 1)
      C.chk(sc.name + ' Slides: every block is wider for its height than the 13.33 x 4.5 in region, as line 2 says',
        shapes.length === bars.length && shapes.every(a => a > 13.33 / 4.5 * 1.2), show(shapes.map(a => a.toFixed(2))));
    }

    // ------------------------------------------------------------------------------- §8.3–8.5 the appropriation sheets
    for (const ap of apsWith) {
      const S = sheetView(B, AP_LABEL[ap]), rows = S.rows, w0 = sc.name + ' ' + AP_LABEL[ap];
      C.eq(w0 + ': title', rows[0].v(0), 'F-35 Sustainment ' + AP_LABEL[ap] + ' - Spend Plan & FY Summary (from the CCaR pull imported ' + TODAY + ')');
      C.eq(w0 + ': line 2 is the shown text', rows[1].v(0), SX);
      C.eq(w0 + ': the FY table header', [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => rows[2].v(i)),
        ['FY', 'Approved ($M)', 'Authorized ($M)', 'Obligated ($M)', 'Unobligated ($M)', 'Obl %', 'OSD Goal %', 'Delta (pp)', 'Status']);
      const keys = Object.keys(X.blocks).filter(k => X.blocks[k].ap === ap);
      const bad = [];
      keys.forEach((k, j) => {
        const x = X.blocks[k], row = rows[3 + j];
        if (!row || row.v(0) !== x.fy) { bad.push(k + ' FY ' + (row && row.v(0))); return; }
        // v12's FY cell here: FY2024, 11 pt bold navy (review XP-5)
        const fs = row.st(0) || [];
        if (!(fs[4] === '"FY"0' && fs[2] === true && fs[5] === 11 && fs[1] === '1F3A68')) bad.push(k + ' FY cell ' + show(fs));
        if (!moneyOk(row.v(1), x.approved) || !moneyOk(row.v(2), x.authorized) || !moneyOk(row.v(3), x.obligated) || !moneyOk(row.v(4), x.unobligated)) bad.push(k + ' money');
        if (!pctOk(row.v(5), x.oblPct) || !pctOk(row.v(6), x.goal) || !pctOk(row.v(7), x.delta)) bad.push(k + ' pct');
        const sw = row.v(8), sf = row.st(8) && row.st(8)[0];
        if (x.status ? sw !== STATUS_WORD[x.status] || sf !== STATUS_FILL[x.status] : sw !== null) bad.push(k + ' status ' + sw);
      });
      const tr = rows[3 + keys.length], A = X.aps[ap];
      if (!(tr && tr.v(0) === 'Total - All FYs' && moneyOk(tr.v(1), A.approved) && moneyOk(tr.v(2), A.authorized) && moneyOk(tr.v(3), A.obligated)
        && moneyOk(tr.v(4), A.unobligated) && pctOk(tr.v(5), A.oblPct) && tr.v(6) === null && tr.v(8) === null)) bad.push('Total - All FYs ' + (tr ? [0, 1, 3, 5, 6].map(i => tr.v(i)).join('|') : 'missing'));
      C.chk(w0 + ': the FY table against the oracle', !bad.length, bad.slice(0, 6).join('; '));
      C.chk(w0 + ': Total - All FYs is centred, as v12’s', tr && tr.st(0) && tr.st(0)[7] === 'center' && !tr.st(0)[6], show(tr && tr.st(0)));
      C.eq(w0 + ': summary rows sit above their detail', S.s.summaryBelow, false);
      // four outline buttons, as the bar's "(1/2/3/4 in left margin)" says and as v12 and the PMO tabs have: PMO rows at
      // level 0, so button 4 opens the CCaRs. With the PMO at level 1 Excel drew five, and button 4 stopped at Plan Event
      // (review XP-1).
      C.eq(w0 + ': four outline buttons (outline levels 0 to 3)', S.s.outlineLevelRow, 3);
      const bars = rows.map((r, i) => [i, r.v(0)]).filter(([i, v]) => typeof v === 'string' && /^FY\d{4} - Spend Plan by PMO \/ Title \/ Plan Event \/ CCaR {2}\(1\/2\/3\/4 in left margin\)$/.test(v));
      C.eq(w0 + ': one block per FY', bars.map(b => b[1].slice(2, 6)), keys.map(k => String(X.blocks[k].fy)));
      bars.forEach(([i], j) => {
        const k = keys[j], x = X.blocks[k], w = w0 + ' ' + k;
        if (!x) return;
        checkHeader(w, rows[i + 1], 'PMO / Title / Plan Event / CCaR', L);
        const T = { pmos: {}, titles: {}, pes: {}, ccars: {} }, path = [], ob = [];
        let r = i + 2;
        for (; r < rows.length && !isBlank(rows[r]); r++) {
          const row = rows[r], lev = row.level, lab = row.v(0);
          // the PMO row is told apart from the furniture at level 0 by its style: 11 pt bold navy, no fill
          const st0 = row.st(0) || [];
          const isPmo = lev === 0 && st0[5] === 11 && st0[2] === true && st0[1] === '1F3A68' && !st0[0];
          if (lev < 0 || lev > 3 || (lev === 0 && !isPmo)) { ob.push('row ' + row.r + ' at level ' + lev + ' ' + show(lab)); continue; }
          path.length = lev; path.push(lab);
          if ((lev >= 2) !== row.hidden) ob.push('row ' + row.r + ' level ' + lev + (row.hidden ? ' hidden' : ' shown'));
          const total = row.v(1);
          if (row.v(L.last) !== total) ob.push('row ' + row.r + ' Totals disagree');
          const key = path.join('|');
          if (lev === 0) T.pmos[lab] = row; else (lev === 1 ? T.titles : lev === 2 ? T.pes : T.ccars)[key] = total;
        }
        C.chk(w + ': the tree is PMO 0, Title 1, Plan Event 2 hidden, CCaR 3 hidden (v12’s levels: button 4 shows the CCaRs)', !ob.length, ob.slice(0, 5).join('; '));
        C.eq(w + ': the PMO rows', Object.keys(T.pmos), Object.keys(x.pmos));
        for (const [lab, row] of Object.entries(T.pmos)) if (x.pmos[lab]) checkMoneyRow(w + ' PMO ' + lab, row, L, x.pmos[lab].total, x.pmos[lab].cols);
        for (const [what, got, want] of [['Title', T.titles, x.titles], ['Plan Event', T.pes, x.pes], ['CCaR (labelled with its number)', T.ccars, x.ccars]]) {
          const gk = Object.keys(got).sort(), wk = Object.keys(want).sort();
          const miss = wk.filter(z => !(z in got)), extra = gk.filter(z => !(z in want));
          const off = wk.filter(z => z in got && !moneyOk(got[z], want[z]));
          C.chk(w + ': every ' + what + ' row against the oracle', !miss.length && !extra.length && !off.length,
            'missing ' + show(miss.slice(0, 3)) + ' extra ' + show(extra.slice(0, 3)) + ' wrong ' + show(off.slice(0, 3)));
        }
        r++;
        C.eq(w + ': a blank row, then Monthly Totals', rows[r] && rows[r].v(0), 'Monthly Totals');
        r = checkBand(w, rows, r, L, X, x);
        checkNa(w, rows, r, x.na, L);
      });
    }

    // ------------------------------------------------------------------------------- §8.6 the PMO tabs
    for (const label of pmoLabels) {
      const name = 'PMO ' + X.pmoCodes[label], S = sheetView(B, name), w0 = sc.name + ' ' + name;
      if (!C.chk(w0 + ' exists', !!S)) continue;
      const rows = S.rows, tab = X.pmoTabs[label];
      C.eq(w0 + ': title', rows[0].v(0), 'PMO: ' + label + ' - Sustainment Spend Plan (Cross-Appropriation Detail)');
      C.eq(w0 + ': line 2 is the shown text', rows[1].v(0), SX);
      const keys = Object.keys(tab).sort((a, b) => {
        const [pa, fa] = a.split('|'), [pb2, fb] = b.split('|');
        return PMO_TAB_ORDER.indexOf(pa) - PMO_TAB_ORDER.indexOf(pb2) || Number(fa) - Number(fb);
      });
      const bad = [];
      let apNow = null;
      keys.forEach((k, j) => {
        const x = tab[k], ap = k.split('|')[0], row = rows[3 + j];
        if (!row) { bad.push(k + ' missing'); return; }
        if (ap !== apNow) { if (row.v(0) !== AP_LABEL[ap]) bad.push(k + ' label ' + row.v(0)); apNow = ap; }
        if (row.v(1) !== Number(k.split('|')[1])) bad.push(k + ' FY ' + row.v(1));
        if ((row.st(1) || [])[4] !== '"FY"0') bad.push(k + ' FY format ' + show(row.st(1)));
        if (!moneyOk(row.v(2), x.approved) || !moneyOk(row.v(3), x.approved) || !moneyOk(row.v(4), x.obligated) || !moneyOk(row.v(5), x.unobligated)) bad.push(k + ' money ' + [2, 3, 4, 5].map(i => row.v(i)).join('|'));
        if (!pctOk(row.v(6), x.oblPct) || !pctOk(row.v(7), x.goal) || !pctOk(row.v(8), x.delta)) bad.push(k + ' pct');
        if (x.status ? row.v(9) !== STATUS_WORD[x.status] || (row.st(9) && row.st(9)[0]) !== STATUS_FILL[x.status] : row.v(9) !== null) bad.push(k + ' status ' + row.v(9));
      });
      const ta = keys.reduce((s, k) => s + tab[k].approved, 0), to = keys.reduce((s, k) => s + tab[k].obligated, 0);
      const tr = rows[3 + keys.length];
      if (!(tr && tr.v(0) === 'Total - All' && moneyOk(tr.v(2), ta) && moneyOk(tr.v(3), ta) && moneyOk(tr.v(4), to) && moneyOk(tr.v(5), ta - to)
        && pctOk(tr.v(6), ta ? to / ta : null))) bad.push('Total - All ' + (tr ? [0, 2, 4, 6].map(i => tr.v(i)).join('|') : 'missing'));
      C.chk(w0 + ': the table against the oracle (Authorized = Approved)', !bad.length, bad.slice(0, 6).join('; '));
      C.chk(w0 + ': Total - All is centred, as v12’s', tr && tr.st(0) && tr.st(0)[7] === 'center' && !tr.st(0)[6], show(tr && tr.st(0)));
      C.eq(w0 + ': the Authorized note', rows[4 + keys.length] && rows[4 + keys.length].v(0), 'Authorized is entered by appropriation and FY; a PMO row shows Approved.');
      C.eq(w0 + ': four outline buttons (outline levels 0 to 3), as on the appropriation sheets', S.s.outlineLevelRow, 3);
      const bars = rows.map((r, i) => [i, r.v(0), r.st(0)]).filter(([i, v, st]) => typeof v === 'string' && st && st[0] === '305496');
      C.eq(w0 + ': one block per block, in Full Fund, Spares, O&M, OPN then FY order', bars.map(b => b[1]),
        keys.map(k => AP_LABEL[k.split('|')[0]] + ' - FY' + k.split('|')[1]));
      bars.forEach(([i], j) => {
        const k = keys[j], x = tab[k], w = w0 + ' ' + k;
        if (!x) return;
        checkHeader(w, rows[i + 1], 'PMO / Title / Plan Event / CCaR', L);
        const ap = k.split('|')[0], fy = k.split('|')[1];
        C.eq(w + ': the summary strip', rows[i + 2].v(0), AP_LABEL[ap] + ' FY' + fy + ' Summary  |  Approved ' + mSent(x.approved) + 'M  |  Authorized '
          + mSent(x.approved) + 'M  |  Obligated ' + mSent(x.obligated) + 'M  |  Unobligated ' + mSent(x.unobligated) + 'M');
        C.chk(w + ': the strip is light blue', rows[i + 2].st(0) && rows[i + 2].st(0)[0] === 'BDD7EE');
        const pm = rows[i + 3];
        C.chk(w + ': the PMO row at outline level 0', pm && pm.v(0) === label && pm.level === 0 && !pm.hidden, pm && [pm.v(0), pm.level].join(' '));
        if (pm) checkMoneyRow(w + ' PMO row', pm, L, x.approved, x.cols);
        const ob = [];
        let r = i + 4;
        for (; r < rows.length && !isBlank(rows[r]); r++) {
          const row = rows[r];
          if (row.level < 1 || row.level > 3 || (row.level >= 2) !== row.hidden) ob.push('row ' + row.r + ' level ' + row.level + ' hidden ' + row.hidden);
        }
        C.chk(w + ': Title 1, Plan Event 2 hidden, CCaR 3 hidden', !ob.length, ob.slice(0, 4).join('; '));
        r++;
        // the band for a PMO block: Monthly Totals are its columns; Cumulative is their running sum, as §4.5 defines it
        const cum = {}; let run = 0;
        for (const id of COLS.slice(0, 14)) { run += x.cols[id]; cum[id] = run; }
        cum.nodate = null;
        checkMoneyRow(w + ' Monthly Totals', rows[r], L, x.approved, x.cols);
        checkMoneyRow(w + ' Cumulative Totals', rows[r + 1], L, x.approved, cum);
        C.chk(w + ': Obligation % Total is the PMO’s Obl %', rows[r + 2] && pctOk(rows[r + 2].v(1), x.oblPct) && pctOk(rows[r + 2].v(L.last), x.oblPct));
        C.chk(w + ': OSD Goal % Total is the goal', rows[r + 3] && pctOk(rows[r + 3].v(1), x.goal));
        C.eq(w + ': OSD Status Total', rows[r + 4] && rows[r + 4].v(1), x.status ? STATUS_WORD[x.status] : null);
        checkNa(w, rows, r + 5, x.na, L);
      });
    }

    // ------------------------------------------------------------------------------- §8.7 Not Allocated
    {
      const S = sheetView(B, 'Not Allocated'), rows = S.rows;
      C.eq(sc.name + ' Not Allocated: line 2 is the shown text', rows[1].v(0), SX);
      const h = rows.findIndex(r => r.v(0) === 'Appropriation');
      C.eq(sc.name + ' Not Allocated: the header', h < 0 ? null : [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => rows[h].v(i)),
        ['Appropriation', 'FY', 'Column', 'Item', 'Status', 'CCaR(s)', 'PMO(s)', 'Title(s)', '$M']);
      const want = [];
      for (const [k, x] of Object.entries(X.blocks)) {
        for (const [col, group, key, cents, label] of x.na) {
          const ci = COLS.indexOf(col);
          want.push([AP_LABEL[x.ap], x.fy, ci === 0 ? 'Prior Yr' : ci <= 12 ? MONTHS[ci - 1] : ci === 13 ? L.labels[13] : 'No date', label, statusWordOf(group), cents]);
        }
      }
      const got = rows.slice(h + 1).filter(r => !isBlank(r));
      const bad = [];
      if (got.length !== want.length) bad.push(got.length + ' rows, want ' + want.length);
      want.forEach((wr, j) => {
        const g = got[j];
        if (!g) return;
        const gv = [0, 1, 2, 3, 4].map(i => g.v(i));
        if (JSON.stringify(gv) !== JSON.stringify(wr.slice(0, 5)) || !moneyOk(g.v(8), wr[5])) bad.push('row ' + g.r + ' ' + show(gv.concat(g.v(8))) + ' want ' + show(wr));
        if (![5, 6, 7].every(i => typeof g.v(i) === 'string' && g.v(i).length)) bad.push('row ' + g.r + ' lacks its CCaR(s), PMO(s) or Title(s)');
        if ((g.st(1) || [])[4] !== '"FY"0') bad.push('row ' + g.r + ' FY format ' + show(g.st(1)));
      });
      C.chk(sc.name + ' Not Allocated: every item of every block, in §5 order, against the oracle', !bad.length, bad.slice(0, 4).join('; '));
    }

    // ------------------------------------------------------------------------------- §8.7 the raw data sheets
    for (const ap of rawAps) {
      const S = sheetView(B, RAW_SHEET[ap]), rows = S.rows, w = sc.name + ' ' + RAW_SHEET[ap];
      const head = []; for (let i = 0; i < rows[0].m.size + 2; i++) if (rows[0].v(i) !== null) head.push(rows[0].v(i));
      C.eq(w + ': the 32 headers, then Service, Lane, Status, Counted', head, RAW_HEADERS.concat(['Service', 'Lane', 'Status', 'Counted']));
      C.eq(w + ': frozen below row 1', S.s.freeze, 'A2');
      const data = rows.slice(1).filter(r => !isBlank(r));
      C.eq(w + ': one row per row of the pull', data.length, X.rowsByAp[ap]);
      const mine = manifest.gen1.filter(i => i.ap === ap);
      const wantCents = mine.reduce((s, i) => s + (i.cents === null ? 0 : i.cents), 0);
      let gotCents = 0, countedCents = 0;
      const bad = [];
      const seen = new Set();
      const iDesc = RAW_HEADERS.indexOf('Event Description'), iAmt = 9, iFy = 0, iDate = 8, base = RAW_HEADERS.length;
      // A row is keyed by the '<id>: ' its Event Description starts with. The fixture's multi-line descriptions (the CSV's
      // quoted line breaks) carry no id; such a row is matched to the one fixture row not yet seen with its CCaR, title,
      // plan event, amount and date, and a row that matches none, or several, fails.
      const iCcar = 2, iTitle = 3, iPe = 7;
      const keyed = [], loose = [];
      for (const r of data) {
        const id = (/^([A-Z]+-\d+): /.exec(String(r.v(iDesc) || '')) || [])[1];
        if (id && intents.get(id)) { keyed.push([r, intents.get(id)]); seen.add(id); } else loose.push(r);
      }
      for (const r of loose) {
        const cents = typeof r.v(iAmt) === 'number' ? Math.round(r.v(iAmt) * 100) : null, d = r.v(iDate);
        const cand = mine.filter(i => !seen.has(i.id) && i.ccar === (r.v(iCcar) || '') && i.title === (r.v(iTitle) || '') && i.pe === (r.v(iPe) || '')
          && i.cents === cents && (i.date ? d && d.date === i.date : true));
        if (cand.length !== 1) { bad.push('row ' + r.r + ' matches ' + cand.length + ' fixture rows'); continue; }
        keyed.push([r, cand[0]]); seen.add(cand[0].id);
      }
      for (const [r, it] of keyed) {
        const a = r.v(iAmt), id = it.id;
        if (typeof a === 'number') { gotCents += Math.round(a * 100); if (r.v(base + 3) === 'Yes') countedCents += Math.round(a * 100); }
        if (it.cents !== null ? Math.round(a * 100) !== it.cents : a !== String(it.forms.amount)) bad.push(id + ' amount ' + show(a));
        if (it.fy !== null ? r.v(iFy) !== it.fy : r.v(iFy) !== String(it.forms.fy)) bad.push(id + ' FY ' + show(r.v(iFy)));
        const d = r.v(iDate);
        if (it.date ? !(d && d.date === it.date) : (it.forms.dateKind === 'text' ? d !== String(it.forms.date) : d !== null)) bad.push(id + ' date ' + show(d));
        if (r.v(base) !== it.svc) bad.push(id + ' service ' + r.v(base));
        if (r.v(base + 1) !== (it.lane === 'mand' ? 'Mandatory' : 'Discretionary')) bad.push(id + ' lane ' + r.v(base + 1));
        if (r.v(base + 2) !== it.statusLabel) bad.push(id + ' status ' + r.v(base + 2));
        const counted = it.cents !== null && it.fy !== null && !(it.bad && it.bad.length) && it.fy >= X.firstFY && X.shown.services.includes(it.svc) && X.shown.lanes.includes(it.lane);
        if ((r.v(base + 3) === 'Yes') !== counted) bad.push(id + ' counted ' + r.v(base + 3));
      }
      C.chk(w + ': every row against the fixture (amount, FY, date, service, lane, status, counted)', !bad.length && seen.size === mine.length,
        bad.slice(0, 5).join('; ') + ' seen ' + seen.size + ' of ' + mine.length);
      C.eq(w + ': the Amount column adds to the fixture’s dollars', gotCents, wantCents);
      C.eq(w + ': the rows marked Counted add to the appropriation’s Approved', countedCents, X.aps[ap] ? X.aps[ap].approved : 0);
      C.chk(w + ': Amount is dollars with cents', data.every(r => typeof r.v(iAmt) !== 'number' || r.st(iAmt)[4] === '#,##0.00'));
    }

    // ------------------------------------------------------------------------------- Import Report and Settings
    {
      const IR = sheetView(B, 'Import Report').rows.map(r => r.v(0)).filter(Boolean);
      C.chk(sc.name + ' Import Report: the import report lines are there', IR.some(l => /^Rows read: /.test(l)) && IR.some(l => /^Unreadable rows/.test(l)), IR.slice(0, 5).join(' / '));
      C.chk(sc.name + ' Import Report: each pull is named with its rows', ['O&M', 'Full Fund', 'Initial Spares', 'OPN'].every(l => IR.some(x => x.startsWith('  ' + l + ': '))));
      // The Summary's note sends the reader here for the rows whose appropriation is not identified; each must be named
      // (where, CCaR, title, budget, plan event, FY, dollars), or nobody can find it: they are on no raw sheet (review XP-8).
      const unid = manifest.gen1.filter(i => i.ap === null);
      const ub = [];
      for (const u of unid) {
        const line = IR.find(l => l.includes('“' + u.ccar + '”') && l.includes('“' + u.title + '”'));
        if (!line) { ub.push(u.id + ' not listed'); continue; }
        for (const want of ['“' + u.budget + '”', '“' + u.pe + '”', 'FY' + u.fy, '$' + commas(String(Math.floor(u.cents / 100))) + '.' + pad2(u.cents % 100), 'row ']) {
          if (!line.includes(want)) ub.push(u.id + ' lacks ' + want + ': ' + line);
        }
      }
      C.chk(sc.name + ' Import Report: every row whose appropriation is not identified is listed, with what identifies it', unid.length === 2 && !ub.length, ub.slice(0, 3).join('; '));
      // the import's time in this computer's time, as the sheet titles' dates are, never UTC (review XP-9)
      C.eq(sc.name + ' Import Report: the import’s time is this computer’s', IR.find(l => /^Import of /.test(l)), 'Import of ' + localWhen(NOW) + ' (this computer’s time): 1 file.');
      const ST = sheetView(B, 'Settings').rows;
      const kv = k => { const r = ST.find(x => x.v(0) === k); return r ? r.v(1) : undefined; };
      C.eq(sc.name + ' Settings: data through, execution year, first FY', [kv('Data through'), String(kv('Execution year')).slice(0, 6), kv('First FY shown')],
        ['Oct-' + (X.E - 1) + ' (' + X.asOf + ')', 'FY' + X.E, X.firstFY]);
      C.eq(sc.name + ' Settings: the switches', SERVICES.map(s => kv(s)), SERVICES.map(s => (X.shown.services.includes(s) ? 'Shown' : 'Hidden')));
      const om1 = ST.find(x => x.v(0) === 'O&M, first year (om1)');
      C.eq(sc.name + ' Settings: the goal curve om1', om1 ? Array.from({ length: 13 }, (_, i) => om1.v(1 + i)) : null, [0, .0833, .1667, .25, .3333, .4167, .5, .5833, .6667, .75, .8333, .9167, 1]);
      C.chk(sc.name + ' Settings: the special CCaRs', ST.some(x => x.v(0) === 'PP 2000') && ST.some(x => x.v(0) === 'JSF6654'));
      const bh = ST.findIndex(x => x.v(0) === 'Name' && x.v(1) === 'Rows');
      const budgets = bh < 0 ? [] : ST.slice(bh + 1).filter(r => !isBlank(r));
      const wantBud = new Set(manifest.gen1.map(i => normKey(i.budget)));
      C.eq(sc.name + ' Settings: one budget row per budget name', budgets.length, wantBud.size);
    }

    // ------------------------------------------------------------------------------- v12's look, cell by cell
    {
      const tb = [], sb = [], vb = [], mb = [], tiny = [];
      const v12Sheets = new Set(['Summary', 'Slide Snapshots'].concat(apsWith.map(ap => AP_LABEL[ap]), pmoLabels.map(l => 'PMO ' + X.pmoCodes[l])));
      for (const nm of names) {
        if (/Raw Data$/.test(nm)) continue;
        const V = sheetView(B, nm);
        // v12's sheet title (style 58): 16 pt bold navy TEXT, no fill, centred; a white-on-navy bar was the block bars'
        // look, not the title's (review XP-4)
        const t0 = V.rows[0].st(0) || [];
        if (!(t0[0] === null && t0[1] === '1F3A68' && t0[2] === true && t0[5] === 16 && t0[7] === 'center')) tb.push(nm + ' ' + show(t0));
        for (const row of V.rows) for (const [ci, c] of row.m) {
          const st = c.st || [], fmt = String(st[4] || ''), money = fmt.includes('#,##0.00') || fmt.includes('<0.01');
          if (money && typeof c.v === 'number') {
            // the '<0.01' format exactly on the non-zero cells under $5,000, and #,##0.00 on every other
            if (isTiny(c.v) !== fmt.includes('<0.01') || (!isTiny(c.v) && !fmt.includes('#,##0.00'))) mb.push(nm + ' row ' + row.r + ' col ' + ci + ' ' + c.v + ' ' + fmt);
            if (isTiny(c.v)) tiny.push([nm, row.r, ci, c.v]);
          }
          // v12 centres money and the outline's labels vertically (review XP-5)
          if (v12Sheets.has(nm) && ((money && typeof c.v === 'number') || (ci === 0 && [2, 4, 6].includes(st[6]))) && st[8] !== 'center') vb.push(nm + ' row ' + row.r + ' col ' + ci + ' ' + show(st));
        }
      }
      for (const nm of ['Summary', 'Slide Snapshots']) {
        const st = sheetView(B, nm).rows[1].st(0) || [];
        // v12's subtitle (styles 65 and 68): 11 pt italic grey, centred
        if (!(st[3] === true && st[5] === 11 && st[1] === '707070' && st[7] === 'center')) sb.push(nm + ' ' + show(st));
      }
      C.chk(sc.name + ': every report sheet’s title is v12’s, 16 pt bold navy text with no fill', !tb.length, tb.slice(0, 3).join('; '));
      C.chk(sc.name + ': the subtitles are v12’s, 11 pt italic grey, centred', !sb.length, sb.join('; '));
      C.chk(sc.name + ': money and outline labels are centred vertically, as v12’s', !vb.length, vb.length + ': ' + vb.slice(0, 3).join('; '));
      C.chk(sc.name + ': a non-zero figure under $5,000 is shown as <0.01, every other as #,##0.00', !mb.length, mb.length + ': ' + mb.slice(0, 3).join('; '));
      if (sc.name === 'all') {
        // the fixture must hold such figures, or the check above passes by having nothing to look at
        C.chk('all: the fixture’s workbook holds non-zero figures under $5,000 (so the <0.01 check has something to read)', tiny.length > 0, String(tiny.length));
        allTiny = tiny;
      }
    }

    // shown text on every report sheet
    const sh = [];
    for (const nm of names) {
      if (/Raw Data$|^Import Report$|^Settings$/.test(nm)) continue;
      const rr = sheetView(B, nm).rows;
      if (!rr.slice(0, 3).some(r => r.v(0) === SX)) sh.push(nm);
    }
    C.eq(sc.name + ': every report sheet states what the switches show', sh, []);

    console.log('  ' + sc.name + ': ' + names.length + ' sheets, ' + Math.round(bytes.length / 1024) + ' KB, written in ' + ms + ' ms');
    if (sc.auth) {
      const ST = sheetView(B, 'Settings').rows;
      const got = Object.keys(sc.auth).map(k => { const r = ST.find(x => x.v(0) === AP_LABEL[k.split('|')[0]] + ' FY' + k.split('|')[1]); return r ? r.v(1) : null; });
      C.eq('auth Settings: each Authorized entry in $M', got, Object.values(sc.auth).map(c => c / 1e8));
      const SR = sheetView(B, 'Summary').rows;
      for (const k of Object.keys(sc.auth)) {
        const r = SR[4 + Object.keys(X.blocks).indexOf(k)];
        C.chk('auth Summary ' + k + ': an entered Authorized is the entered figure, unmarked', r && moneyOk(r.v(3), sc.auth[k]) && !((r.st(3) || [])[4] || '').includes('†'),
          r && show([r.v(3), r.st(3)]));
      }
    }
    if (sc.name === 'all') { allFile = file; allSheetCount = names.length; allX = X; allModel = model; allSettings = settings; }
  }

  // ------------------------------------------------------------------------------------------- a long month is split
  // No fixture month is long enough to need it, so the rule is exercised on the spec: one month given 400 items (about
  // 16,000 characters) prints on several rows, the first labelled, the rest not, every item once and whole, every row
  // short enough to show in a row's 409 points, and read back joined it is exactly §5's one line.
  {
    const b = allModel.blocks.find(x => x.na.length);
    const base = b.na[0];
    const many = [];
    for (let i = 0; i < 400; i++) many.push(Object.assign({}, base, { label: 'Synthetic item ' + String(i).padStart(3, '0') + ' with a long plan event name', cents: 9e8 - i * 1e6 }));
    const saved = b.na;
    b.na = many;
    const spec = SP.excelSpec(allModel, parsed.pulls, allSettings, { report: parsed.report, today: TODAY });
    b.na = saved;
    const sl = spec.sheets.find(x => x.name === 'Slide Snapshots').rows;
    const bar = b.apLabel + ' FY' + b.fy + ' - Spend Plan (PMO Summary, slide-ready)';
    const at = sl.findIndex(r => r.cells[0] && r.cells[0].v === bar);
    const na = sl.findIndex((r, i) => i > at && r.cells[0] && r.cells[0].v === 'Not Allocated Requirements');
    const lines = [];
    for (let i = na + 1; i < sl.length && sl[i].cells.length; i++) lines.push(sl[i]);
    const want = SP.naLines(many, allModel.cols)[0];
    const parts = lines.map(r => r.cells[1].v);
    C.chk('a long month prints on several rows, labelled once', lines.length >= 4 && lines[0].cells[0].v === want.label && lines.slice(1).every(r => !r.cells[0]),
      lines.length + ' rows; labels ' + show(lines.map(r => r.cells[0] && r.cells[0].v)));
    C.eq('a long month, joined back, is exactly the one line', parts.join('; '), want.text);
    C.chk('every row of a long month is short enough to show (≤ 4,000 characters, ≤ 409 points)', parts.every(p => p.length <= 4000) && lines.every(r => r.ht <= 409),
      show(parts.map(p => p.length)) + ' ' + show(lines.map(r => r.ht)));
  }

  // ------------------------------------------------------------------------------------------- '<0.01' at its edges
  // The fixture's small figures are a few dollars, so they cannot tell $5,000 from any lower edge: the rule is held at its
  // boundary on the spec. One PMO row is given $4,999.99, $5,000.00, a cent, minus $4,999.99, minus $5,000.00 and zero.
  {
    const b = allModel.blocks.find(x => x.pmoRows.length);
    const p = b.pmoRows[0], saved = p.cols.slice();
    const edge = [499999, 500000, 1, -499999, -500000, 0];
    edge.forEach((c, j) => { p.cols[1 + j] = c; });
    const spec = SP.excelSpec(allModel, parsed.pulls, allSettings, { report: parsed.report, today: TODAY });
    p.cols = saved;
    const sl = spec.sheets.find(x => x.name === 'Slide Snapshots').rows;
    const at = sl.findIndex(r => r.cells[0] && r.cells[0].v === b.apLabel + ' FY' + b.fy + ' - Spend Plan (PMO Summary, slide-ready)');
    const row = sl.find((r, i) => i > at && r.cells[0] && r.cells[0].v === p.label);
    // columns: A label, B Total, C Prior Yr, D Oct …: model column k is cell 2 + k
    const got = edge.map((c, j) => { const cell = row && row.cells[2 + 1 + j]; return cell && cell.s ? cell.s.fmt : null; });
    C.eq('<0.01 at its edges: under $5,000 and not zero takes it, $5,000 and zero do not', got,
      [TINY_FM, '#,##0.00;(#,##0.00);-', TINY_FM, TINY_FM, '#,##0.00;(#,##0.00);-', '#,##0.00;(#,##0.00);-']);
  }

  // ------------------------------------------------------------------------------------------- LibreOffice
  {
    const lo = join(tmp.dir, 'lo-csv');
    const r = soffice(['--convert-to', 'csv:Text - txt - csv (StarCalc):44,34,76,1,,0,false,true,true,false,false,-1', allFile], lo);
    const files = existsSync(lo) ? readdirSync(lo).filter(f => f.endsWith('.csv')) : [];
    C.chk('LibreOffice converts every sheet with no error', r.status === 0 && files.length === allSheetCount && !/\bError\b/.test((r.stdout || '') + (r.stderr || '')),
      'status ' + r.status + ', ' + files.length + ' of ' + allSheetCount + ' sheets; ' + ((r.stderr || '') + (r.stdout || '')).slice(-300));
    const CSV = JSON.parse(py([READ, 'csv', lo]).stdout || '{}');
    const sum = CSV[Object.keys(CSV).find(k => /Summary/.test(k))] || [];
    const tot = sum.find(row => row[0] === 'TOTAL - Sustainment');
    C.eq('LibreOffice shows the TOTAL row as the format says: Approved, and Authorized marked †', tot ? [tot[2], tot[3]] : null,
      [m2(allX.summary.approved), m2(allX.summary.authorized) + '†']);
    // the '<0.01' format, as another program shows it (review XP-6)
    const tb = [];
    for (const [nm, r, ci, v] of allTiny) {
      const key = Object.keys(CSV).find(k => k.endsWith('-' + nm + '.csv'));
      const got = key && CSV[key][r - 1] ? CSV[key][r - 1][ci] : undefined;
      if (got !== (v > 0 ? '<0.01' : '(<0.01)')) tb.push(nm + ' row ' + r + ' col ' + ci + ' shows ' + show(got));
    }
    C.chk('LibreOffice shows every non-zero figure under $5,000 as <0.01', allTiny.length > 0 && !tb.length, allTiny.length + ' cells; ' + tb.slice(0, 3).join('; '));
  }

  // ------------------------------------------------------------------------------------------- the UI action
  {
    const caught = [];
    const realDownload = SP.download;
    SP.download = (name, bytes, mime) => { caught.push({ name, bytes, mime }); return name; };
    SP.state = null;
    const none = await SP.exportExcel();
    C.chk('exportExcel with no data says so and writes nothing', none && none.ok === false && /nothing to export/i.test(none.message) && !caught.length, show(none));
    const settings = SP.defaultSettings(TODAY);
    SP.state = { v: 1, tool: 'sfcb-spend-plan', savedAt: null, settings, pulls: { current: parsed.pulls, previous: {} }, history: [], lastImport: { report: parsed.report } };
    const v = SP.defaultView(); v.svc.USAF = false;
    SP.getView = () => JSON.parse(JSON.stringify(v));
    const res = await SP.exportExcel();
    const d = new Date(), today = d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    C.chk('exportExcel downloads one workbook', caught.length === 1 && caught[0].bytes[0] === 0x50 && /spreadsheetml/.test(caught[0].mime), show(caught.map(c => c.name)));
    C.eq('exportExcel names it with the date, the data-through month and [filtered]', caught[0] && caught[0].name,
      'SFCB Spend Plan FY2027 - data through Oct-2026 - ' + today + ' [filtered].xlsx');
    C.chk('exportExcel says what it wrote, and that it is filtered', res && res.ok === true && res.message.includes(caught[0] && caught[0].name)
      && res.message.includes('filtered') && res.message.includes('Services shown: USAF ANG'), show(res));
    settings.asOf = 'October';
    const badRes = await SP.exportExcel();
    C.chk('exportExcel says why when the model cannot be built, and downloads nothing', badRes && badRes.ok === false && /not written/.test(badRes.message) && caught.length === 1, show(badRes));
    SP.download = realDownload;
  }
} catch (e) {
  C.chk('the test ran to the end', false, (e && e.stack) || String(e));
} finally {
  t.close();
  tmp.rm();
  C.done();
}
