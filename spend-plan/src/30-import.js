// §3 IMPORT — reading CCaR pulls into typed rows, the import report, and the per-row derived fields (CONTRACT §3); and the
// BAE report of budgets read beside them (§14.1).
//
// The rule behind every line here: nothing a pull carries is dropped or changed silently. A value that cannot be read
// keeps its row (marked bad, counted in no figure, listed in the report with its file, sheet and row); a value that is
// converted (text to number, $ and parentheses, a sub-cent rounding, spaces trimmed) is counted by kind.

const IMP_N = SP.RAW_HEADERS.length;                                        // 32
const IMP_COL = new Map(SP.RAW_HEADERS.map((h, i) => [SP.normKey(h), i]));   // normKey(header) -> stored position
const IMP_FORMULA_COLS = new Map([['svc (auto)', 'Svc (auto)'], ['inc (auto)', 'Inc (auto)']]);   // v12's formula columns
// The four columns this tool's own Raw Data sheets append (§8.7). They are worked out again on every load, so a re-imported
// export reads them as nothing, like v12's formula columns. Kept as extras they came back as "Service (2)" … "Counted (2)"
// on the next round, and grew every round after (review IMP-7). Only all four together are the tool's: one alone may be a
// real column of someone's pull, and is kept.
const IMP_OWN_COLS = ['service', 'lane', 'status', 'counted'];
const IMP_FY = 0, IMP_MONTH = 1, IMP_CCAR = 2, IMP_TITLE = 3, IMP_BUDGET = 4, IMP_PE = 7, IMP_DATE = 8, IMP_AMT = 9,
  IMP_ALLOC = 10, IMP_PMO = 18;
const IMP_HDR_ROWS = 15;
const IMP_AP_IDS = SP.APS.map(a => a.id);
function imp_apLabel(id) { const a = SP.APS.find(x => x.id === id); return a ? a.label : id === 'unidentified' ? 'Appropriation not identified' : String(id); }
function imp_plural(n, one, many) { return SP.fmtInt(n) + ' ' + (n === 1 ? one : (many || one + 's')); }
function imp_isBlank(v) { return v === null || v === undefined || (typeof v === 'string' && v.trim() === ''); }
function imp_q(s) { return '“' + s + '”'; }
function imp_list(w) { return w.length <= 1 ? w.join('') : w.slice(0, -1).join(', ') + ' and ' + w[w.length - 1]; }
// a cell as text: numbers as Excel shows them (15 significant digits, so 0.1+0.2 is "0.3"), booleans as TRUE/FALSE
function imp_text(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number') return isFinite(v) ? (Number.isInteger(v) ? String(v) : String(Number(v.toPrecision(15)))) : '';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  return String(v).trim();
}
// the raw text of a value as the report quotes it (not trimmed: the spaces may be the problem)
function imp_raw(v) { return typeof v === 'string' ? v : imp_text(v); }

// ---------------------------------------------------------------------------------------------------------------
// FY AND DATES
// ---------------------------------------------------------------------------------------------------------------
// FY: a whole number 1990–2100, or text '2026', 'FY26', 'FY2026'. null when it is none of these.
SP.readFY = function readFY(v) {
  let y = null;
  if (typeof v === 'number') y = v;
  else if (typeof v === 'string') {
    const t = v.trim();
    let m;
    if ((m = /^(\d{4})$/.exec(t))) y = Number(m[1]);
    else if ((m = /^FY\s*(\d{4}|\d{2})$/i.exec(t))) y = m[1].length === 2 ? 2000 + Number(m[1]) : Number(m[1]);
  }
  return Number.isInteger(y) && y >= 1990 && y <= 2100 ? y : null;
};
const IMP_MON = (() => {
  const m = Object.create(null);
  ['january','february','march','april','may','june','july','august','september','october','november','december']
    .forEach((n, i) => { m[n] = i + 1; m[n.slice(0, 3)] = i + 1; });
  m.sept = 9;
  return m;
})();
// a time after the date is allowed and ignored: pandas writes "2025-11-26 00:00:00", Excel's CSV "11/26/2025 0:00"
const IMP_TIME = '(?:(?:T|\\s+)\\d{1,2}:\\d{2}(?::\\d{2}(?:\\.\\d+)?)?(?:\\s*[AP]M)?(?:Z|[+-]\\d{2}:?\\d{2})?)?';
const IMP_D_ISO = new RegExp('^(\\d{4})-(\\d{2})-(\\d{2})' + IMP_TIME + '$', 'i');
const IMP_D_US = new RegExp('^(\\d{1,2})/(\\d{1,2})/(\\d{4})' + IMP_TIME + '$', 'i');
const IMP_D_DMY = /^(\d{1,2})[ -]([A-Za-z]+)\.?[ -](\d{4})$/;
const IMP_D_MY = /^([A-Za-z]+)\.?[ -](\d{4})$/;
// Month and Date: an Excel serial (by the file's date system), a date cell, or text. '' for blank, null for a value
// that is there and is not a date (the import then keeps the row, places it in No date, and names it).
SP.readDate = function readDate(v, date1904) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return SP.excelSerialToIso(v, !!date1904) || null;
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (!t) return '';
  let m;
  if ((m = IMP_D_ISO.exec(t))) return SP.isoDate(m[1], m[2], m[3]) || null;
  if ((m = IMP_D_US.exec(t))) return SP.isoDate(m[3], m[1], m[2]) || null;
  if ((m = IMP_D_DMY.exec(t))) { const mo = IMP_MON[m[2].toLowerCase()]; return mo ? SP.isoDate(m[3], mo, m[1]) || null : null; }
  if ((m = IMP_D_MY.exec(t))) { const mo = IMP_MON[m[1].toLowerCase()]; return mo ? SP.isoDate(m[2], mo, 1) || null : null; }
  return null;
};

// ---------------------------------------------------------------------------------------------------------------
// APPROPRIATION, STATUS, SERVICE, LANE
// ---------------------------------------------------------------------------------------------------------------
function imp_apOfBudget(b) {
  const s = String(b ?? '');
  if (/spares/i.test(s)) return 'sp';
  if (/full\s*fund/i.test(s)) return 'ff';
  if (/\bopn\b/i.test(s)) return 'opn';
  if (/o&m/i.test(s)) return 'om';
  return null;
}
// FF and OPN count only as words of their own: "Staff" or "Office" holding the letters is not Full Fund
function imp_apOfSheet(name) {
  const s = String(name ?? '');
  if (SP.normKey(s) === 'o&m raw data') return 'om';
  if (/(^|[^a-z])ff([^a-z]|$)/i.test(s) || /full\s*fund/i.test(s)) return 'ff';
  if (/spares/i.test(s)) return 'sp';
  if (/(^|[^a-z])opn([^a-z]|$)/i.test(s)) return 'opn';
  return null;
}
function imp_budgetOf(row) {
  if (row && Array.isArray(row.c)) return row.c[IMP_BUDGET];
  if (Array.isArray(row)) return row[IMP_BUDGET];
  return row && row.budget;
}
// EVERY APPROPRIATION A SHEET'S NAME MENTIONS, for the misfiled-row question only (never for placing a row: that is
// imp_apOfSheet, CONTRACT §3). The placement rule reads O&M only from v12's exact tab name and takes the FIRST name it
// meets, so the question missed an O&M file named "O&M.csv", "om.csv" or "O&M Raw Data (2).csv" (Windows' name for a
// second download), and asked about a correct OPN pull named "FF and OPN pull.csv", calling it "a sheet named for Full
// Fund" (review F1, F5). A name that mentions a row's own appropriation is never "named for another".
function imp_apsNamedBy(name) {
  const s = String(name ?? '');
  const out = [];
  if (/o\s*&\s*m/i.test(s) || /(^|[^a-z])om([^a-z]|$)/i.test(s) || /(^|[^a-z])o and m([^a-z]|$)/i.test(s)) out.push('om');
  if (/(^|[^a-z])ff([^a-z]|$)/i.test(s) || /full\s*fund/i.test(s)) out.push('ff');
  if (/spares/i.test(s)) out.push('sp');
  if (/(^|[^a-z])opn([^a-z]|$)/i.test(s)) out.push('opn');
  return out;
}
SP.apsNamedBy = imp_apsNamedBy;
// "O&M", or "Full Fund and OPN": what a stray's sheet is named for, in words (a report saved before sheetAps has sheetAp)
SP.sheetNamedFor = function sheetNamedFor(x) {
  const ids = x && Array.isArray(x.sheetAps) && x.sheetAps.length ? x.sheetAps : [x && x.sheetAp];
  const w = ids.map(imp_apLabel);
  return w.length <= 1 ? w.join('') : w.slice(0, -1).join(', ') + ' and ' + w[w.length - 1];
};
// the Budget text decides; the sheet's name only when the Budget names no appropriation
SP.apOfRow = function apOfRow(row, sheetName) {
  return imp_apOfBudget(imp_budgetOf(row)) || imp_apOfSheet(sheetName);
};
// Alloc -> status, tested on its normKey so "Not  Allocated" with two spaces is still Not Allocated
SP.allocStatus = function allocStatus(alloc) {
  const k = SP.normKey(alloc);
  if (/^actual execution/.test(k)) return { status: 'exec', label: 'Actual Execution' };
  if (/^not allocated$/.test(k)) return { status: 'na', label: 'Not Allocated' };
  if (/^unprogrammed/.test(k)) return { status: 'unprog', label: 'Unprogrammed' };
  if (/^forecast/.test(k)) return { status: 'fcst', label: 'Forecast' };
  if (k === '') return { status: 'other', label: '(blank)' };
  return { status: 'other', label: String(alloc).trim() };
};
// The service a budget name gives by rule (CONTRACT §3). Deliberately not v12's: v12 sent every name it did not know to
// USAF, which filed all of OPN and the Navy APN CONG lines there; here a name no rule knows is said to be unknown.
SP.svcRule = function svcRule(budget) {
  const b = String(budget ?? '');
  if (/\bAFRC\b/i.test(b)) return 'USAF AFRC';
  if (/\bANG\b/i.test(b)) return 'USAF ANG';          // a word: CHANGE, RANGE and HANGAR are not ANG
  if (/STOVL/i.test(b)) return 'USMC B (STOVL)';
  if (/USMC\s+CV/i.test(b)) return 'USMC C (USMC CV)';
  if (/USN\s+CV/i.test(b)) return 'USN (USN CV)';
  if (/^\s*USN\b/i.test(b)) return 'USN (USN CV)';
  if (/^\s*USAF\b/i.test(b)) return 'USAF';
  return SP.SVC_UNKNOWN;
};
SP.laneRule = function laneRule(budget) { return /\bmandatory\b/i.test(String(budget ?? '')) ? 'mand' : 'disc'; };
// a budget override, read by OWN key: a budget named "constructor" or "__proto__" must find nothing, not a built-in
function imp_override(settings, budget) {
  const b = settings && settings.budgets;
  if (!b || typeof b !== 'object') return null;
  const k = SP.normKey(budget);
  if (!Object.prototype.hasOwnProperty.call(b, k)) return null;
  const o = b[k];
  if (!o || typeof o !== 'object') return null;
  const out = {};
  if (o.svc === SP.SVC_UNKNOWN || SP.SERVICES.includes(o.svc)) out.svc = o.svc;
  if (o.lane === 'disc' || o.lane === 'mand') out.lane = o.lane;
  return out.svc || out.lane ? out : null;
}

// Derived fields, recomputed on every load so a rule fix applies to old pulls. Beyond the contract's fields it carries
// statusLabel (the words for a status: '(blank)' or the Alloc text for 'other'), month, bad (null or the reasons the
// row counts nowhere) and src ([fileIndex, sheet, rowNo]).
SP.deriveRow = function deriveRow(row, settings) {
  const c = row.c;
  const st = SP.allocStatus(c[IMP_ALLOC]);
  const ov = imp_override(settings, c[IMP_BUDGET]);
  return {
    ap: SP.apOfRow(row, row.src ? row.src[1] : ''),
    fy: c[IMP_FY], ccar: c[IMP_CCAR], title: c[IMP_TITLE], budget: c[IMP_BUDGET], pe: c[IMP_PE],
    date: c[IMP_DATE] || '', month: c[IMP_MONTH] || '', cents: c[IMP_AMT], alloc: c[IMP_ALLOC], pmo: c[IMP_PMO],
    status: st.status, statusLabel: st.label,
    svc: ov && ov.svc ? ov.svc : SP.svcRule(c[IMP_BUDGET]),
    lane: ov && ov.lane ? ov.lane : SP.laneRule(c[IMP_BUDGET]),
    k: { pmo: SP.normKey(c[IMP_PMO]), title: SP.normKey(c[IMP_TITLE]), pe: SP.normKey(c[IMP_PE]), ccar: SP.normKey(c[IMP_CCAR]) },
    bad: row.bad && row.bad.length ? row.bad : null,
    src: row.src,
  };
};

// Every distinct budget name (by normKey) in the pulls: its rows, its dollars (readable rows), the service and lane the
// rules give, any override, and what applies. Sorted by name. A name whose service is unknown is flagged.
SP.budgetTable = function budgetTable(pulls, settings) {
  const by = new Map();
  const order = IMP_AP_IDS.concat(['unidentified']);
  for (const ap of order) {
    const p = pulls && pulls[ap];
    if (!p || !Array.isArray(p.rows)) continue;
    for (const row of p.rows) {
      const name = row.c[IMP_BUDGET] ?? '';
      const key = SP.normKey(name);
      let e = by.get(key);
      if (!e) { e = { key, spell: new Map(), rows: 0, cents: 0, aps: [] }; by.set(key, e); }
      e.rows++;
      e.spell.set(name, (e.spell.get(name) || 0) + 1);
      if (!(row.bad && row.bad.length) && typeof row.c[IMP_AMT] === 'number') e.cents += row.c[IMP_AMT];
      if (!e.aps.includes(ap)) e.aps.push(ap);
    }
  }
  const out = [];
  for (const e of by.values()) {
    let name = '', best = -1;
    for (const [s, n] of e.spell) if (n > best) { best = n; name = s; }   // most rows; ties to the first met
    const svcR = SP.svcRule(name), laneR = SP.laneRule(name), ov = imp_override(settings, name);
    const svc = ov && ov.svc ? ov.svc : svcR;
    out.push({ key: e.key, name, names: [...e.spell.keys()], rows: e.rows, cents: e.cents, aps: e.aps,
      svcRule: svcR, laneRule: laneR, override: ov, svc, lane: ov && ov.lane ? ov.lane : laneR, unknown: svc === SP.SVC_UNKNOWN });
  }
  out.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return out;
};

// ---------------------------------------------------------------------------------------------------------------
// READING A SHEET
// ---------------------------------------------------------------------------------------------------------------
// the header row: the first row numbered 1–15 holding every required header (by normKey); or, when none does, the row
// that comes closest, so the report can say which header a renamed column lost
function imp_findHeader(rows, rowNo) {
  let best = null;
  for (let i = 0; i < rows.length && rowNo[i] <= IMP_HDR_ROWS; i++) {
    const have = new Set((rows[i] || []).map(v => SP.normKey(imp_text(v))));
    const missing = SP.REQUIRED.filter(h => !have.has(SP.normKey(h)));
    if (!missing.length) return { i };
    if (!best || missing.length < best.missing.length) best = { rowNo: rowNo[i], missing };
  }
  return { i: -1, best };
}
// A CSV SEPARATED BY SOMETHING OTHER THAN COMMAS. Read as comma-separated, its whole header row is one cell, so the file
// was refused for lacking the column headers it has, and the closest-row hint (four headers or fewer missing) never came
// (review F2). The row's cells are joined back with the commas the reader split them at and tried against each separator.
// Such a file is refused, never read: a file separated by semicolons may write 1.234,56 for 1,234.56, and a separator
// guessed wrong would put money in the wrong cell. {rowNo, sep} or null.
const IMP_SEPS = [['\t', 'tabs'], [';', 'semicolons'], ['|', 'vertical bars']];
function imp_sepHeader(rows, rowNo) {
  const unq = s => SP.normKey(s.replace(/^\s*"([\s\S]*)"\s*$/, '$1'));
  for (let i = 0; i < rows.length && rowNo[i] <= IMP_HDR_ROWS; i++) {
    const line = (rows[i] || []).map(imp_text).join(',');
    for (const [sep, words] of IMP_SEPS) {
      if (line.indexOf(sep) < 0) continue;
      const have = new Set(line.split(sep).map(unq));
      const haveB = new Set(line.split(sep).map(x => imp_baeKey(x.replace(/^\s*"([\s\S]*)"\s*$/, '$1'))));
      if (SP.REQUIRED.every(h => have.has(SP.normKey(h)))) return { rowNo: rowNo[i], sep: words };
      // a BAE report's CSV separated so is the same mistake, and gets the same advice
      if (IMP_BAE_COLS.every(h => h.keys.some(k => haveB.has(k)))) return { rowNo: rowNo[i], sep: words };
    }
  }
  return null;
}

// One sheet -> {info, rows:[stored rows with their appropriation]}. acc collects the report's counts across the import.
function imp_sheet(fileIdx, fileName, kind, sh, date1904, acc) {
  const info = { name: sh.name, state: sh.state || 'visible', used: false, why: null, headerRow: null, rows: 0, blank: 0,
    byAp: {}, extras: [], ignoredCols: [], ownCols: [], missingCols: [], disagree: null, extraOnly: [],
    noResult: Array.isArray(sh.noResult) ? sh.noResult.slice() : [] };
  const out = [];
  if (sh.problem) { info.why = sh.problem; return { info, out }; }
  const rows = sh.rows, rowNo = sh.rowNo;
  const hdr = imp_findHeader(rows, rowNo);
  if (hdr.i < 0) {
    const sep = kind === 'csv' ? imp_sepHeader(rows, rowNo) : null;
    if (sep) {
      info.sep = sep.sep;
      info.why = 'its column headers are on row ' + sep.rowNo + ', but separated by ' + sep.sep + ', not commas. This tool reads CSV '
        + 'separated by commas only, and never guesses a separator (one separated by semicolons may write 1.234,56 for 1,234.56). '
        + 'Save it from Excel as “CSV (Comma delimited)” or as an Excel Workbook (.xlsx), and import that';
      return { info, out };
    }
    info.why = 'no row in the first ' + IMP_HDR_ROWS + ' holds all ' + SP.REQUIRED.length + ' required column headers ('
      + SP.REQUIRED.join(', ') + ')';
    if (hdr.best && hdr.best.missing.length <= 4)
      info.why += '; row ' + hdr.best.rowNo + ' comes closest but has no ' + hdr.best.missing.map(imp_q).join(' or ');
    return { info, out };
  }
  info.headerRow = rowNo[hdr.i];
  // columns BY HEADER NAME, never by position
  const head = rows[hdr.i];
  const col = new Array(IMP_N).fill(-1), named = new Set(), dup = [], extras = [], seenExtra = new Map();
  const ignored = new Set();   // columns read as nothing: v12's formula columns, this tool's own derived ones
  // THE TOOL'S OWN FOUR are the LAST column of each of those names, when all four are there in the order the export writes
  // them, after every extra (CONTRACT §8.7). The FIRST of each name was taken: a pull's own column named Status sits before
  // the tool's, so it was ignored as the tool's, and the tool's derived words came back under its name (review F7, XP2-2).
  const lastAt = new Map();
  head.forEach((h, j) => { const nk = SP.normKey(imp_text(h)); if (IMP_OWN_COLS.includes(nk)) lastAt.set(nk, j); });
  const ownJ = IMP_OWN_COLS.map(k => lastAt.get(k));
  const ownExport = ownJ.every((j, i) => j !== undefined && (i === 0 || j > ownJ[i - 1]));
  const ownCols = new Set(ownExport ? ownJ : []);
  head.forEach((h, j) => {
    const text = imp_text(h);
    if (text === '') return;
    const nk = SP.normKey(text);
    if (IMP_COL.has(nk)) {
      const k = IMP_COL.get(nk);
      if (col[k] >= 0) dup.push({ name: SP.RAW_HEADERS[k], a: col[k], b: j });
      else { col[k] = j; named.add(j); }
    } else if (IMP_FORMULA_COLS.has(nk)) { info.ignoredCols.push(text); named.add(j); ignored.add(j); }
    else if (ownCols.has(j)) { info.ownCols.push(text); named.add(j); ignored.add(j); }
    else {
      // two columns with one unknown header keep both, the second as "Name (2)", so neither overwrites the other
      const n = (seenExtra.get(nk) || 0) + 1;
      seenExtra.set(nk, n);
      extras.push({ name: n === 1 ? text : text + ' (' + n + ')', j });
      named.add(j);
    }
  });
  if (dup.length) {
    // which of two Amount columns is the real one is not something to guess with money
    info.why = dup.map(d => 'two columns are headed ' + imp_q(d.name) + ' (' + SP.colLetter(d.a) + ' and ' + SP.colLetter(d.b) + ')')
      .join('; ') + ', so the tool cannot tell which to read';
    return { info, out };
  }
  info.missingCols = SP.RAW_HEADERS.filter((h, k) => col[k] < 0);
  const isBlankRow = r => { for (let k = 0; k < IMP_N; k++) if (col[k] >= 0 && !imp_isBlank(r[col[k]])) return false; return true; };
  // A row with nothing in the 32 CCaR columns is skipped (CONTRACT §3), but one with something in another column is not
  // blank: it was counted as a blank row and its text was found nowhere (review IMP-13). It is still skipped, and it is
  // listed by row with what it held.
  const known = new Set(col.filter(j => j >= 0));
  const extraName = new Map();
  // A value in a column with no header is still data: it is kept as an extra column named by its letter, never dropped.
  const unnamed = new Set();
  for (let i = hdr.i + 1; i < rows.length; i++) {
    const r = rows[i];
    if (isBlankRow(r)) continue;
    for (let j = 0; j < r.length; j++) if (!named.has(j) && !unnamed.has(j) && !imp_isBlank(r[j])) unnamed.add(j);
  }
  for (const j of unnamed) extras.push({ name: 'Column ' + SP.colLetter(j), j });
  extras.sort((a, b) => a.j - b.j);
  info.extras = extras.map(e => e.name);
  for (const e of extras) extraName.set(e.j, e.name);
  const othersOf = r => {
    const o = [];
    for (let j = 0; j < r.length; j++) {
      if (known.has(j) || ignored.has(j) || imp_isBlank(r[j])) continue;
      o.push([extraName.get(j) || 'Column ' + SP.colLetter(j), imp_raw(r[j])]);
    }
    return o;
  };
  const sheetAp = imp_apOfSheet(sh.name);
  const csv = kind === 'csv';
  let disN = 0, disC = 0;
  const disBy = {};
  for (let i = hdr.i + 1; i < rows.length; i++) {
    const r = rows[i];
    if (isBlankRow(r)) {
      const o = othersOf(r);
      if (o.length) { info.extraOnly.push({ row: rowNo[i], values: o }); acc.extraOnly.push({ file: fileName, sheet: sh.name, row: rowNo[i], values: o }); }
      else info.blank++;
      continue;
    }
    const rn = rowNo[i];
    const c = new Array(IMP_N);
    const bad = [], raw = {};
    for (let k = 0; k < IMP_N; k++) {
      const j = col[k];
      const v = j >= 0 && r[j] !== undefined ? r[j] : '';
      if (typeof v === 'string' && v !== v.trim()) { acc.conv.trimmed++; acc.trimmedBy[SP.RAW_HEADERS[k]] = (acc.trimmedBy[SP.RAW_HEADERS[k]] || 0) + 1; }
      if (k === IMP_FY) {
        const y = SP.readFY(v);
        if (y === null) { bad.push(imp_isBlank(v) ? 'FY is blank' : 'FY ' + imp_q(imp_raw(v)) + ' is not a year'); raw.FY = imp_raw(v); }
        c[k] = y;
      } else if (k === IMP_MONTH || k === IMP_DATE) {
        const d = SP.readDate(v, date1904);
        if (d === null) {
          raw[SP.RAW_HEADERS[k]] = imp_raw(v);
          acc.dateBad.push({ file: fileName, sheet: sh.name, row: rn, column: SP.RAW_HEADERS[k], raw: imp_raw(v) });
        }
        c[k] = d || '';
      } else if (k === IMP_AMT) {
        const a = SP.parseAmount(v);
        if (a.cents === null) { bad.push('Amount ' + imp_q(imp_raw(v)) + ' is not an amount'); raw.Amount = imp_raw(v); c[k] = null; }
        else {
          // a CSV has no number type: a plain number in one is how a CSV writes a number, not a conversion
          const how = csv && a.how === 'text' && /^\s*-?\d+(\.\d+)?\s*$/.test(v) ? 'number' : a.how;
          acc.conv[how] = (acc.conv[how] || 0) + 1;
          if (how === 'subcent') acc.subcent.push({ file: fileName, sheet: sh.name, row: rn, raw: imp_raw(v), cents: a.cents });
          c[k] = a.cents;
        }
      } else c[k] = imp_text(v);
    }
    const x = Object.create(null);   // keyed by headers out of the file: a column headed __proto__ is a column
    for (const e of extras) {
      const v = r[e.j];
      if (imp_isBlank(v)) continue;
      x[e.name] = imp_text(v);
      if (typeof v === 'string' && v !== v.trim()) { acc.conv.trimmed++; acc.trimmedBy[e.name] = (acc.trimmedBy[e.name] || 0) + 1; }
    }
    const stored = { c, x, src: [fileIdx, sh.name, rn] };
    if (bad.length) stored.bad = bad;
    if (Object.keys(raw).length) stored.raw = raw;
    const byBudget = imp_apOfBudget(c[IMP_BUDGET]);
    const ap = byBudget || sheetAp || 'unidentified';
    if (byBudget && sheetAp && byBudget !== sheetAp) {
      disN++;
      if (!bad.length) disC += c[IMP_AMT];
      disBy[byBudget] = (disBy[byBudget] || 0) + 1;
    }
    if (bad.length) acc.unreadable.push({ file: fileName, sheet: sh.name, row: rn, ap, reasons: bad.slice(), raw,
      cents: typeof c[IMP_AMT] === 'number' ? c[IMP_AMT] : null });
    const at = acc.alloc.get(c[IMP_ALLOC]) || { text: c[IMP_ALLOC], rows: 0, cents: 0 };
    at.rows++;
    if (!bad.length) at.cents += c[IMP_AMT];
    acc.alloc.set(c[IMP_ALLOC], at);
    info.byAp[ap] = (info.byAp[ap] || 0) + 1;
    info.rows++;
    out.push({ ap, row: stored });
  }
  if (disN) info.disagree = { rows: disN, cents: disC, sheetAp, byBudget: disBy };
  if (!info.rows) { info.why = 'it has the column headers (row ' + info.headerRow + ') but no data rows below them'; return { info, out: [] }; }
  info.used = true;
  return { info, out };
}

// ---------------------------------------------------------------------------------------------------------------
// THE BAE REPORT OF BUDGETS (CONTRACT §14.1): each budget's Approved and Authorized amount by FY, beside the pull. It is
// read here and kept whole; what a row means (its appropriation, scope, service, lane, PMO) is worked out again on every
// load by the engine (§14.2), so a rule fix reaches an old report as it reaches an old pull.
// ---------------------------------------------------------------------------------------------------------------
// The four columns the tool reads, in the order a stored row's c holds them. The FY may be headed either way; where a
// sheet has both, Budget FY Numeric is read (it is the number) and Budget FY is kept as written, like any other column.
const IMP_BAE_COLS = [
  { keys: ['budget name'], label: 'Budget Name' },
  { keys: ['budget fy numeric', 'budget fy'], label: 'Budget FY Numeric (or Budget FY)' },
  { keys: ['budget approved amount'], label: 'Budget Approved Amount' },
  { keys: ['budget authorized amount'], label: 'Budget Authorized Amount' } ];
const IMP_BAE_NAME = 0, IMP_BAE_FY = 1, IMP_BAE_APP = 2, IMP_BAE_AUTH = 3;
// what a file refused for holding no usable sheet is told it might have held instead
const IMP_BAE_NONE = ', nor a BAE report of budgets (Budget Name, Budget FY Numeric, Budget Approved Amount, Budget Authorized Amount)';
// $100,000 in cents. Every non-zero amount under it means the figures were exported in $M (the report's own display),
// and read as the dollars they then claim to be, every block would be understated a millionfold.
const IMP_BAE_SMALL = 10000000;
// A header as the report's are compared: a trailing unit in parentheses taken off, then normKey. The report heads its
// amounts "Budget Approved Amount ($M)" though the cells hold dollars (the $M is the number format's), so the unit says
// nothing about the value and is not part of the name.
function imp_baeKey(v) { return SP.normKey(imp_text(v).replace(/\s*\([^()]*\)$/, '')); }
// the header row: the first row numbered 1–15 holding all four; or the row closest to it (two or more of the four), so a
// sheet that is nearly a report says which header it lacks
function imp_baeHeader(rows, rowNo) {
  let best = null;
  for (let i = 0; i < rows.length && rowNo[i] <= IMP_HDR_ROWS; i++) {
    const have = new Set((rows[i] || []).map(imp_baeKey));
    const missing = IMP_BAE_COLS.filter(h => !h.keys.some(k => have.has(k))).map(h => h.label);
    if (!missing.length) return { i };
    if (missing.length <= 2 && (!best || missing.length < best.missing.length)) best = { rowNo: rowNo[i], missing };
  }
  return { i: -1, best };
}
// A report's amount -> {cents, how}. A number cell holds dollars (the report SHOWS them as $M through its number format),
// read to the cent as CONTRACT §14.1 says, Math.round(v*100); a fraction of a cent is rounded and reported. Text is a
// figure whose unit cannot be known, since the $M display is the only text the report would carry, so it is read only
// when it is zero ("$0.000", the report's own zero, counted as a conversion); any other text makes the row unreadable.
// A CSV has no number type: there a plain number is how the file writes a number, as for a pull (§3), not text.
//   how: 'number' | 'subcent' | 'zero' (text read as zero) | 'blank' | 'text' (not zero: unreadable) | 'bad'
function imp_baeAmt(v, csv) {
  if (imp_isBlank(v)) return { cents: 0, how: 'blank' };
  let n = null;
  if (typeof v === 'number') n = v;
  else if (typeof v === 'string' && csv && /^\s*-?\d+(\.\d+)?\s*$/.test(v)) n = Number(v);
  if (n !== null) {
    if (!isFinite(n)) return { cents: null, how: 'bad' };
    const c = Math.round(n * 100);
    if (!Number.isSafeInteger(c)) return { cents: null, how: 'bad' };
    // a fraction of a cent, judged on the 15 significant digits Excel shows (n*100 itself carries binary noise)
    return { cents: c === 0 ? 0 : c, how: SP.parseAmount(n).how === 'subcent' ? 'subcent' : 'number' };
  }
  if (typeof v !== 'string') return { cents: null, how: 'bad' };
  const a = SP.parseAmount(v);
  if (a.cents === 0) return { cents: 0, how: 'zero' };
  return { cents: null, how: a.cents === null ? 'bad' : 'text' };
}
// the report's date from its file name: "…_2026-01-31_120000.xlsx" -> '2026-01-31 12:00', else null
SP.baeStampOf = function baeStampOf(fileName) {
  const base = String(fileName ?? '').replace(/^.*[\\/]/, '').replace(/\.[^.]*$/, '');
  const m = /_(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})(\d{2})$/.exec(base);
  if (!m || !SP.isoDate(m[1], m[2], m[3]) || Number(m[4]) > 23 || Number(m[5]) > 59 || Number(m[6]) > 59) return null;
  return m[1] + '-' + m[2] + '-' + m[3] + ' ' + m[4] + ':' + m[5];
};

// One report sheet -> {info, bae, part}: info for the file's sheet list, bae the stored report (CONTRACT §14.1), part the
// import report's BAE section. hi is the header row's index (imp_baeHeader). info.why is set when the sheet cannot be read
// as a report at all; the import is then refused, naming it (a report the person meant to bring is never left out quietly).
function imp_baeSheet(fileIdx, fileName, kind, sh, hi) {
  const rows = sh.rows, rowNo = sh.rowNo, csv = kind === 'csv';
  const info = { name: sh.name, state: sh.state || 'visible', used: false, bae: true, why: null, headerRow: rowNo[hi], rows: 0, blank: 0,
    byAp: {}, extras: [], ignoredCols: [], ownCols: [], missingCols: [], disagree: null, extraOnly: [],
    noResult: Array.isArray(sh.noResult) ? sh.noResult.slice() : [] };
  const head = rows[hi] || [];
  // COLUMNS BY HEADER NAME. Two columns that both answer to one of the four (an Approved in dollars beside one in $M, say)
  // cannot be told apart, and which one holds the money is not something to guess.
  const at = new Map();   // header key -> the columns headed so
  head.forEach((h, j) => { const k = imp_baeKey(h); if (k) { if (!at.has(k)) at.set(k, []); at.get(k).push(j); } });
  const col = [-1, -1, -1, -1], dup = [];
  IMP_BAE_COLS.forEach((d, n) => {
    // the first of its keys the sheet has: Budget FY Numeric before Budget FY, which is then kept as a column like any other
    const k = d.keys.find(x => at.has(x));
    const js = at.get(k);
    if (js.length > 1) dup.push({ label: n === IMP_BAE_FY ? (k === 'budget fy' ? 'Budget FY' : 'Budget FY Numeric') : d.label, a: js[0], b: js[1] });
    col[n] = js[0];
  });
  const fyBoth = at.has('budget fy numeric') && at.has('budget fy');
  if (dup.length) {
    info.why = dup.map(d => {
      const ta = imp_text(head[d.a]), tb = imp_text(head[d.b]), la = SP.colLetter(d.a), lb = SP.colLetter(d.b);
      return ta === tb ? 'two columns are headed ' + imp_q(ta) + ' (' + la + ' and ' + lb + ')'
        : 'two columns, ' + imp_q(ta) + ' (' + la + ') and ' + imp_q(tb) + ' (' + lb + '), are both the ' + d.label;
    }).join('; ') + ', so the tool cannot tell which to read';
    return { info, bae: null, part: null };
  }
  const isFour = r => col.every(j => imp_isBlank(r[j]));
  // EVERY COLUMN IS KEPT, in the file's order, under the file's own header (CONTRACT §14.1): the BAE Report sheet writes
  // them back. A column with no header that holds something is kept by its letter, and a second column of one header
  // name as "Name (2)", as the pull keeps its extras, so no value overwrites another.
  let width = head.length;
  for (let i = hi + 1; i < rows.length; i++) width = Math.max(width, (rows[i] || []).length);
  const used = new Set();
  for (let i = hi + 1; i < rows.length; i++) { const r = rows[i] || []; for (let j = 0; j < r.length; j++) if (!imp_isBlank(r[j])) used.add(j); }
  const headers = [], nameAt = new Map(), seen = new Map();
  for (let j = 0; j < width; j++) {
    let text = imp_text(head[j]);
    if (text === '' && !used.has(j)) continue;
    if (text === '') text = 'Column ' + SP.colLetter(j);
    const nk = SP.normKey(text), n = (seen.get(nk) || 0) + 1;
    seen.set(nk, n);
    const name = n === 1 ? text : text + ' (' + n + ')';
    headers.push(name);
    nameAt.set(j, name);
  }
  const cols = col.map(j => nameAt.get(j));
  const four = new Set(col);
  const extrasOf = r => {
    const x = Object.create(null);   // keyed by headers out of the file: a column headed __proto__ is a column
    for (let j = 0; j < r.length; j++) if (!four.has(j) && nameAt.has(j) && !imp_isBlank(r[j])) x[nameAt.get(j)] = imp_text(r[j]);
    return x;
  };
  const part = { file: fileName, sheet: sh.name, state: info.state, headerRow: info.headerRow, columns: headers.length, cols: cols.slice(),
    fyBoth, stamp: SP.baeStampOf(fileName), rowsRead: 0, readable: 0, blank: 0, cents: { approved: 0, authorized: 0 },
    conversions: { zero: 0, blank: 0, subcent: 0, trimmed: 0 }, subcent: [], unreadable: [], extraOnly: [], total: null,
    largest: 0, nonZero: 0 };
  const out = [];
  let total = null;
  // THE REPORT'S OWN TOTAL ROW: no Budget Name, no FY, amounts, after the last budget row. It is a sum of the rows and is
  // never counted; it is checked against them below.
  let lastNamed = -1;
  for (let i = hi + 1; i < rows.length; i++) if (!imp_isBlank((rows[i] || [])[col[IMP_BAE_NAME]])) lastNamed = i;
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i] || [], rn = rowNo[i];
    if (isFour(r)) {
      // blank in all four is skipped and counted; one holding something elsewhere is skipped too, and listed with what it held
      const o = [];
      for (let j = 0; j < r.length; j++) if (!four.has(j) && !imp_isBlank(r[j])) o.push([nameAt.get(j) || 'Column ' + SP.colLetter(j), imp_raw(r[j])]);
      if (o.length) { info.extraOnly.push({ row: rn, values: o }); part.extraOnly.push({ row: rn, values: o }); }
      else { info.blank++; part.blank++; }
      continue;
    }
    const v = col.map(j => r[j]);
    if (!total && i > lastNamed && imp_isBlank(v[IMP_BAE_NAME]) && imp_isBlank(v[IMP_BAE_FY])
      && !(imp_isBlank(v[IMP_BAE_APP]) && imp_isBlank(v[IMP_BAE_AUTH]))) {
      const a = imp_baeAmt(v[IMP_BAE_APP], csv), u = imp_baeAmt(v[IMP_BAE_AUTH], csv);
      total = { approved: a.cents, authorized: u.cents, rowNo: rn };
      const raw = {};
      if (a.cents === null) raw[cols[IMP_BAE_APP]] = imp_raw(v[IMP_BAE_APP]);
      if (u.cents === null) raw[cols[IMP_BAE_AUTH]] = imp_raw(v[IMP_BAE_AUTH]);
      if (Object.keys(raw).length) total.raw = raw;
      const x = extrasOf(r);
      if (Object.keys(x).length) total.x = x;
      continue;
    }
    const c = new Array(4), bad = [], raw = {};
    for (let n = 0; n < 4; n++) if (typeof v[n] === 'string' && v[n] !== v[n].trim()) part.conversions.trimmed++;
    c[IMP_BAE_NAME] = imp_text(v[IMP_BAE_NAME]);
    if (c[IMP_BAE_NAME] === '') bad.push(cols[IMP_BAE_NAME] + ' is blank');
    const fy = SP.readFY(v[IMP_BAE_FY]);
    if (fy === null) {
      bad.push(imp_isBlank(v[IMP_BAE_FY]) ? cols[IMP_BAE_FY] + ' is blank' : cols[IMP_BAE_FY] + ' ' + imp_q(imp_raw(v[IMP_BAE_FY])) + ' is not a year');
      if (!imp_isBlank(v[IMP_BAE_FY])) raw[cols[IMP_BAE_FY]] = imp_raw(v[IMP_BAE_FY]);
    }
    c[IMP_BAE_FY] = fy;
    for (const n of [IMP_BAE_APP, IMP_BAE_AUTH]) {
      const a = imp_baeAmt(v[n], csv);
      c[n] = a.cents;
      if (a.cents === null) {
        raw[cols[n]] = imp_raw(v[n]);
        bad.push(cols[n] + ' ' + imp_q(imp_raw(v[n])) + (a.how === 'text'
          ? ' is text, not a number: its unit cannot be known (the report’s amounts are dollars, shown as $M by their format)'
          : ' is not an amount'));
        continue;
      }
      if (a.how === 'zero') part.conversions.zero++;
      else if (a.how === 'blank') part.conversions.blank++;
      else if (a.how === 'subcent') { part.conversions.subcent++; part.subcent.push({ row: rn, column: cols[n], raw: imp_raw(v[n]), cents: a.cents }); }
      if (a.cents !== 0) { part.nonZero++; part.largest = Math.max(part.largest, Math.abs(a.cents)); }
    }
    for (let j = 0; j < r.length; j++) if (!four.has(j) && typeof r[j] === 'string' && r[j] !== r[j].trim() && r[j].trim() !== '') part.conversions.trimmed++;
    const stored = { c, x: extrasOf(r), src: [fileIdx, sh.name, rn] };
    if (bad.length) { stored.bad = bad; stored.raw = raw; }
    out.push(stored);
    part.rowsRead++;
    info.rows++;
    if (bad.length) {
      part.unreadable.push({ row: rn, reasons: bad.slice(), name: c[IMP_BAE_NAME], fy, approved: c[IMP_BAE_APP], authorized: c[IMP_BAE_AUTH], raw });
    } else {
      part.readable++;
      part.cents.approved += c[IMP_BAE_APP];
      part.cents.authorized += c[IMP_BAE_AUTH];
    }
  }
  // THE TOTAL ROW, CHECKED. It is a sum of floating-point dollars, so each figure agrees when it is within $1 of the
  // readable rows' sum; a figure that could not be read cannot agree.
  if (total) {
    const dA = total.approved === null ? null : total.approved - part.cents.approved;
    const dU = total.authorized === null ? null : total.authorized - part.cents.authorized;
    part.total = { rowNo: total.rowNo, approved: total.approved, authorized: total.authorized, sumApproved: part.cents.approved,
      sumAuthorized: part.cents.authorized, diffApproved: dA, diffAuthorized: dU,
      ok: dA !== null && dU !== null && Math.abs(dA) <= 100 && Math.abs(dU) <= 100 };
    if (total.raw) part.total.raw = total.raw;
  }
  info.used = true;
  const bae = { headers, cols, rows: out, file: fileName, sheet: sh.name, stamp: part.stamp, total };
  return { info, bae, part };
}

// ---------------------------------------------------------------------------------------------------------------
// THE IMPORT
// ---------------------------------------------------------------------------------------------------------------
function imp_bytes(data) {
  if (typeof data === 'string') return new TextEncoder().encode(data);
  if (Object.prototype.toString.call(data) === '[object ArrayBuffer]') return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  return null;
}
function imp_sameBytes(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
// how many well-formed UTF-8 multi-byte sequences a file holds, and how many bytes are not part of one
function imp_utf8Count(u) {
  let valid = 0, invalid = 0;
  for (let i = 0; i < u.length;) {
    const b = u[i];
    if (b < 0x80) { i++; continue; }
    const n = b >= 0xC2 && b <= 0xDF ? 1 : b >= 0xE0 && b <= 0xEF ? 2 : b >= 0xF0 && b <= 0xF4 ? 3 : 0;
    let ok = n > 0 && i + n < u.length;
    for (let k = 1; ok && k <= n; k++) if ((u[i + k] & 0xC0) !== 0x80) ok = false;
    if (ok) { valid++; i += n + 1; } else { invalid++; i++; }
  }
  return { valid, invalid };
}
function imp_hash(u) { let h = 0x811c9dc5; for (let i = 0; i < u.length; i++) { h ^= u[i]; h = Math.imul(h, 0x01000193); } return h >>> 0; }
// a refusal: nothing was imported, and the message says why in words a person can act on
function imp_refuse(msg, report) { const e = new Error(msg); e.refused = true; e.report = report || null; return e; }
function imp_where(s) { return imp_q(s.file) + ' › ' + imp_q(s.sheet); }
// An import's time in this computer's own time, 'YYYY-MM-DD HH:MM'. Printed as stored (UTC) it read
// '2026-11-09T19:07:23.967Z': a reader in Virginia after 7 pm saw tomorrow's date beside sheet titles dated today
// (review XP-9). Text that is not a time is printed as it is.
function imp_localWhen(iso) {
  const t = typeof iso === 'string' ? Date.parse(iso) : NaN;
  if (isNaN(t)) return String(iso ?? '');
  const d = new Date(t), p2 = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
}

// files: [{name, data: ArrayBuffer | typed array | string}] -> {pulls, bae, report}. A name ending .csv is read as CSV, any
// other as .xlsx. bae is the BAE report of budgets the import holds (CONTRACT §14.1), or null. Throws an Error with
// .refused = true (and .report) when the import as a whole is refused: nothing to change.
SP.parseFiles = async function parseFiles(files, opts) {
  opts = opts || {};
  if (!Array.isArray(files) || !files.length) throw imp_refuse('No file was given, so nothing was imported.');
  const importedAt = opts.now || new Date().toISOString();
  // THE SAME FILE TWICE is refused before anything is read: its rows would arrive twice, from two "sheets", and every
  // figure built on them would be double. Same bytes is the test, whatever the names say.
  const bytes = files.map(f => imp_bytes(f && f.data));
  const hashes = bytes.map(u => (u && u.length ? imp_hash(u) : null));
  for (let a = 0; a < files.length; a++) for (let b = a + 1; b < files.length; b++) {
    if (hashes[a] === null || hashes[a] !== hashes[b] || !imp_sameBytes(bytes[a], bytes[b])) continue;
    const na = String(files[a].name), nb = String(files[b].name);
    throw imp_refuse((na === nb ? imp_q(na) + ' was given twice' : imp_q(nb) + ' is the same file as ' + imp_q(na) + ' (identical bytes)')
      + ', so nothing was imported: its rows would have counted twice. Give each file once.');
  }
  // trimmedBy is keyed by column headers out of the file, so it has no prototype
  const acc = { conv: { number: 0, blank: 0, text: 0, dollar: 0, paren: 0, subcent: 0, trimmed: 0 }, trimmedBy: Object.create(null),
    subcent: [], unreadable: [], dateBad: [], alloc: new Map(), extraOnly: [] };
  const report = { importedAt, files: [], rowsRead: 0, rowsBlank: 0, byAp: {}, conversions: acc.conv, trimmedBy: acc.trimmedBy,
    subcent: acc.subcent, unreadable: acc.unreadable, dateUnreadable: acc.dateBad, disagreements: [], alloc: [], notes: [],
    extraOnly: acc.extraOnly, strays: [] };
  const got = [];   // {ap, row, file, sheet, fileIdx}
  const baeGot = [];   // the BAE report sheets: {fileIdx, file, sheet, state, why, bae, part}
  for (let fi = 0; fi < files.length; fi++) {
    const f = files[fi] || {};
    const name = String(f.name ?? 'file ' + (fi + 1));
    const kind = /\.csv$/i.test(name) ? 'csv' : 'xlsx';
    const fr = { name, kind, bytes: bytes[fi] ? bytes[fi].length : 0, refused: null, notes: [], date1904: false, sheets: [] };
    report.files.push(fr);
    if (!bytes[fi]) { fr.refused = 'nothing was given to read'; continue; }
    let sheets = [], date1904 = false;
    try {
      if (kind === 'csv') {
        let text = typeof f.data === 'string' ? f.data : null;
        let stray = 0;
        const notCsv = text === null ? SP.notCsvWhy(bytes[fi]) : '';
        if (notCsv) { fr.refused = notCsv; continue; }
        const t16 = text === null ? SP.utf16Of(bytes[fi]) : null;
        if (t16) {
          // UTF-16 says so with its byte-order mark, or by every other byte of its text being zero: read as UTF-8 or
          // Windows-1252 it was refused for "no header row" and reported as Windows-1252 (review F2)
          const nm = t16.enc === 'utf-16le' ? 'UTF-16LE' : 'UTF-16BE';
          fr.notes.push(t16.bom ? 'It is UTF-16 (Unicode) text, as its byte-order mark says, and was read as ' + nm + '.'
            : 'It is UTF-16 (Unicode) text with no byte-order mark (every other byte of its text is zero), and was read as ' + nm + '.');
          try { text = new TextDecoder(t16.enc, { fatal: true }).decode(bytes[fi]); }
          catch (e) {
            text = new TextDecoder(t16.enc).decode(bytes[fi]);
            fr.notes.push('Some of it is not well-formed ' + nm + ': each such character was read as � (the character for one that cannot be read).');
          }
        }
        if (text === null) {
          try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes[fi]); }
          catch (e) {
            // Excel's "CSV (Comma delimited)" is Windows-1252, not UTF-8; read as UTF-8 its accents would become U+FFFD. But
            // one stray byte in a UTF-8 file is not a Windows-1252 file: read so, its byte-order mark became "ï»¿" on the FY
            // header (and the file was refused for having no FY), and every –, ’ and é in it became two or three wrong
            // characters (review IMP-8). A byte-order mark, or more good UTF-8 sequences than bad bytes, says UTF-8.
            const u = bytes[fi], cnt = imp_utf8Count(u);
            const bom = u.length >= 3 && u[0] === 0xEF && u[1] === 0xBB && u[2] === 0xBF;
            if (bom || cnt.valid > cnt.invalid) { text = new TextDecoder('utf-8').decode(u); stray = cnt.invalid; }
            else {
              try { text = new TextDecoder('windows-1252').decode(u); fr.notes.push('It is not UTF-8 text; it was read as Windows-1252, the encoding Excel uses for CSV.'); }
              catch (e2) { text = new TextDecoder('utf-8').decode(u); fr.notes.push('It is not UTF-8 text; characters that could not be read show as \uFFFD.'); }
            }
          }
        }
        if (bytes[fi].length === 0) { fr.refused = 'the file is empty'; continue; }
        const rows = SP.readCsv(text);
        if (stray) {
          const at = [];
          rows.forEach((r, i) => { if (r.some(c => c.indexOf('\uFFFD') >= 0)) at.push(i + 1); });
          fr.notes.push('It is UTF-8 text, but ' + imp_plural(stray, 'byte in it is', 'bytes in it are') + ' not: each such byte '
            + 'was read as \uFFFD (the character for one that cannot be read), and the rest of the file as written'
            + (at.length ? ' (row' + (at.length === 1 ? ' ' : 's ') + at.slice(0, 10).join(', ') + (at.length > 10 ? ', …' : '') + ')' : '') + '.');
        }
        sheets = [{ name: name.replace(/^.*[\\/]/, '').replace(/\.csv$/i, ''), state: 'visible', rows, rowNo: rows.map((r, i) => i + 1) }];
      } else {
        const wb = await SP.readXlsx(bytes[fi]);
        sheets = wb.sheets; date1904 = wb.date1904;
        if (wb.esc && wb.esc.dec) fr.notes.push(imp_plural(wb.esc.dec, 'character was', 'characters were') + ' written in the file as _xHHHH_ codes and read as the characters they stand for.');
        if (wb.esc && wb.esc.kept) fr.notes.push(imp_plural(wb.esc.kept, '_xHHHH_ code stands', '_xHHHH_ codes stand') + ' for a character a workbook cannot hold and ' + (wb.esc.kept === 1 ? 'was' : 'were') + ' kept as written.');
      }
    } catch (e) { fr.refused = e && e.message ? e.message : String(e); continue; }
    fr.date1904 = date1904;
    for (const sh of sheets) {
      // A BAE REPORT SHEET is known by its four headers (CONTRACT §14.1), and is one even when it also holds a pull's
      const bh = sh.problem ? { i: -1 } : imp_baeHeader(sh.rows, sh.rowNo);
      if (bh.i >= 0) {
        const b = imp_baeSheet(fi, name, kind, sh, bh.i);
        fr.sheets.push(b.info);
        baeGot.push({ fileIdx: fi, file: name, sheet: sh.name, state: b.info.state, why: b.info.why, bae: b.bae, part: b.part });
        continue;
      }
      const { info, out } = imp_sheet(fi, name, kind, sh, date1904, acc);
      // a sheet that is nearly a report says which of the report's headers it lacks, as a nearly-pull sheet does
      if (!info.used && !info.headerRow && !info.sep && bh.best) {
        info.why += '; row ' + bh.best.rowNo + ' looks like a BAE report’s header but has no ' + bh.best.missing.map(imp_q).join(' or ');
      }
      fr.sheets.push(info);
      if (!info.used) continue;
      report.rowsRead += info.rows;
      report.rowsBlank += info.blank;
      if (info.disagree) report.disagreements.push(Object.assign({ file: name, sheet: sh.name }, info.disagree));
      for (const o of out) got.push({ ap: o.ap, row: o.row, file: name, sheet: sh.name, fileIdx: fi, state: info.state });
    }
    // a CSV whose headers are there, separated by tabs or semicolons, is said to be that: pointed at the column names, which
    // are right, the person had nothing to correct (review F2)
    const sepd = fr.sheets.find(s => s.sep);
    if (!fr.sheets.some(s => s.used)) fr.refused = sepd ? sepd.why : fr.sheets.length
      ? 'no sheet in it holds CCaR rows under the column headers ' + SP.REQUIRED.join(', ') + IMP_BAE_NONE
      : 'it holds no sheets';
  }
  report.alloc = [...acc.alloc.values()].sort((a, b) => b.rows - a.rows || (a.text < b.text ? -1 : a.text > b.text ? 1 : 0));
  // THE BAE REPORT, judged before anything else is: one report per import, readable, and in dollars. Each refusal refuses
  // the whole import and changes nothing (CONTRACT §14.1), as a split appropriation does: a report the person meant to
  // bring is never left out while the rest goes in.
  const baeOne = baeGot.length === 1 ? baeGot[0] : null;
  if (baeOne && baeOne.part) report.bae = baeOne.part;
  if (baeGot.length > 1) {
    throw imp_refuse('Nothing was imported. The import holds ' + baeGot.length + ' BAE reports of budgets, '
      + imp_list(baeGot.map(b => imp_where(b) + (b.state === 'visible' ? '' : b.state === 'veryHidden' ? ' (a very hidden sheet)' : ' (a hidden sheet)')))
      + ', and one import takes one report: it replaces the report on screen whole, so two would leave one of them out. Import the newest '
      + 'report on its own, or with the pull files.', report);
  }
  if (baeOne && baeOne.why) {
    throw imp_refuse('Nothing was imported. ' + imp_where(baeOne) + ' is a BAE report of budgets, but ' + baeOne.why + '. Rename or delete the '
      + 'column that is not the report’s own, and import again.', report);
  }
  if (baeOne && !baeOne.part.readable) {
    const p = baeOne.part;
    throw imp_refuse('Nothing was imported. The BAE report ' + imp_where(baeOne) + ' has no row that can be read: '
      + (p.rowsRead ? imp_plural(p.rowsRead, 'row is', 'rows are') + ' under its column headers (row ' + p.headerRow + '), and none has a '
        + 'Budget Name, a year in its FY and an Approved and Authorized amount read as dollars (see the Import report for each row and why)'
        : 'it has its column headers (row ' + p.headerRow + ') but no budget rows below them') + '.', report);
  }
  if (baeOne && baeOne.part.nonZero && baeOne.part.largest < IMP_BAE_SMALL) {
    throw imp_refuse('Nothing was imported. Every amount in the BAE report ' + imp_where(baeOne) + ' is under $100,000 (the largest is '
      + SP.fmtUsd(baeOne.part.largest) + '). The report’s cells hold dollars and show them as $M through their number format; figures this '
      + 'small mean they were exported in $M, and read as dollars every Approved and Authorized would be understated a millionfold. '
      + 'Export the report again with its amounts as dollars, as the report itself holds them, and import that.', report);
  }
  if (!report.files.some(fr => fr.sheets.some(s => s.used))) {
    throw imp_refuse('Nothing was imported. ' + report.files.map(fr => imp_q(fr.name) + ' was refused: '
      + String(fr.refused).replace(/\.\s*$/, '') + '.').join(' '), report);
  }
  // ONE SHEET PER APPROPRIATION PER IMPORT. A misfiled row (an O&M budget pasted onto the Full Fund tab) would otherwise
  // either split an appropriation across two sources, so that replacing the pull replaces half of it, or ride silently
  // into another appropriation's figures. The message names every sheet and its count, so the one stray row is found.
  const srcBy = new Map();
  for (const g of got) {
    if (g.ap === 'unidentified') continue;
    if (!srcBy.has(g.ap)) srcBy.set(g.ap, new Map());
    const m = srcBy.get(g.ap), key = g.fileIdx + '\u0000' + g.sheet;
    const e = m.get(key) || { file: g.file, sheet: g.sheet, state: g.state || 'visible', n: 0, cents: 0 };
    e.n++; if (!g.row.bad) e.cents += g.row.c[IMP_AMT];
    m.set(key, e);
  }
  // WHAT TO DO DEPENDS ON THE COUNTS. A few rows beside a whole pull are misfiled rows: move them, or correct their Budget.
  // (The advice once ended "or import the files one at a time": taken, the misfiled row became the whole of its
  // appropriation's pull and replaced that pull without a word, review IMP-1.) But two sources that each hold a whole pull,
  // or most of one (two months' exports, a combined export picked with a one-appropriation export, one pull as .xlsx and as
  // .csv, an old copy kept on a hidden sheet), hold no misfiled row: every such import was told to move "the small count"
  // across, which would count the rows twice (review SCR2-4, F9). And a hidden sheet is said to be hidden: Excel does not
  // show it, and the message sent the person to a tab they could not see.
  const clash = [];
  let fewRows = false, wholePulls = false, hidden = false, veryHidden = false;
  for (const ap of IMP_AP_IDS) {
    const m = srcBy.get(ap);
    if (!m || m.size < 2) continue;
    const es = [...m.values()], most = Math.max(...es.map(e => e.n));
    // a source holding a tenth of the largest's rows, or fewer, is "a few rows" beside it
    if (es.some(e => e.n * 10 <= most)) fewRows = true;
    if (es.filter(e => e.n * 10 > most).length >= 2) wholePulls = true;
    for (const e of es) { if (e.state !== 'visible') hidden = true; if (e.state === 'veryHidden') veryHidden = true; }
    clash.push(imp_apLabel(ap) + ' rows come from ' + m.size + ' sheets: '
      + es.map(e => imp_where(e) + (e.state === 'visible' ? '' : e.state === 'veryHidden' ? ' (a very hidden sheet)' : ' (a hidden sheet)')
        + ' holds ' + imp_plural(e.n, imp_apLabel(ap) + ' row')).join('; '));
  }
  if (clash.length) {
    const adv = [];
    if (wholePulls) adv.push('Where two of these each hold a whole pull, or most of one (two exports of one appropriation, a combined '
      + 'export picked with a one-appropriation export, one pull as .xlsx and as .csv, or an old copy kept on another sheet), leave '
      + 'all but the newest out of the import (pick only the newer file, or delete the old copy’s sheet): moving rows from one into '
      + 'the other would count them twice.');
    if (fewRows) adv.push('Where one holds only a few rows beside the others, each of them is most likely misfiled: rows are placed by '
      + 'their Budget name, so move it to the sheet of its own appropriation, or correct its Budget, and import again.');
    if (hidden) adv.push('Excel does not show a hidden sheet: right-click a sheet tab and choose Unhide to see it, and delete it if it '
      + 'is an old copy' + (veryHidden ? ' (a very hidden sheet is not offered there: it is shown from the Visual Basic editor, '
      + 'Alt+F11, by setting its Visible property)' : '') + '.');
    throw imp_refuse('Nothing was imported. Each appropriation’s rows must come from one sheet in one import, and '
      + clash.join('. ') + '. ' + adv.join(' '), report);
  }
  // AN APPROPRIATION ALL OF WHOSE ROWS SIT ON A SHEET NAMED FOR ANOTHER. The budget still wins (CONTRACT §3), but such rows
  // are the very shape of a misfiled row, and imported they become the WHOLE of their appropriation's pull: one Full Fund
  // row on the O&M tab, imported in an O&M-only file, replaced a 40-row Full Fund pull with itself (review IMP-1). They are
  // recorded here, so the store can ask before they replace a pull and say so after.
  for (const ap of IMP_AP_IDS) {
    const m = srcBy.get(ap);
    if (!m || m.size !== 1) continue;
    const e = [...m.values()][0], named = imp_apsNamedBy(e.sheet);
    if (named.length && !named.includes(ap)) {
      report.strays.push({ ap, label: imp_apLabel(ap), file: e.file, sheet: e.sheet, sheetAp: named[0], sheetAps: named, rows: e.n, cents: e.cents });
    }
  }
  // THE PULLS, in the order given: files, then sheets in workbook order, then rows top to bottom
  const pulls = {};
  for (const g of got) {
    let p = pulls[g.ap];
    if (!p) {
      p = pulls[g.ap] = { rows: [], headers: null, files: [], importedAt, extras: [] };
      if (g.ap === 'unidentified') delete p.importedAt;
    }
    p.rows.push(g.row);
    let fe = p.files.find(x => x.idx === g.fileIdx);
    if (!fe) { fe = { idx: g.fileIdx, name: g.file, sheets: [] }; p.files.push(fe); }
    if (!fe.sheets.includes(g.sheet)) {
      fe.sheets.push(g.sheet);
      const si = report.files[g.fileIdx].sheets.find(s => s.name === g.sheet && s.used);
      for (const x of (si ? si.extras : [])) if (!p.extras.includes(x)) p.extras.push(x);
    }
  }
  for (const ap of Object.keys(pulls)) {
    const p = pulls[ap];
    p.headers = SP.RAW_HEADERS.concat(p.extras);   // the 32, then the extra columns, in the order the sheet had them
    delete p.extras;
    p.files = p.files.map(f => ({ name: f.name, sheets: f.sheets }));
    let cents = 0, bad = 0, badCents = 0;
    for (const r of p.rows) { if (r.bad) { bad++; if (typeof r.c[IMP_AMT] === 'number') badCents += r.c[IMP_AMT]; } else cents += r.c[IMP_AMT]; }
    report.byAp[ap] = { label: imp_apLabel(ap), rows: p.rows.length, cents, unreadable: bad, unreadableCents: badCents,
      files: p.files };
  }
  // the order a reader expects: O&M, Full Fund, Initial Spares, OPN, then rows no appropriation could claim
  const ordered = {};
  for (const ap of IMP_AP_IDS.concat(['unidentified'])) if (pulls[ap]) ordered[ap] = pulls[ap];
  const byAp = {};
  for (const ap of Object.keys(ordered)) byAp[ap] = report.byAp[ap];
  report.byAp = byAp;
  report.ignoredSheets = [];
  for (const fr of report.files) for (const s of fr.sheets) if (!s.used) report.ignoredSheets.push({ file: fr.name, sheet: s.name, why: s.why });
  report.refusedFiles = report.files.filter(fr => fr.refused).map(fr => ({ file: fr.name, why: fr.refused }));
  return { pulls: ordered, bae: baeOne ? baeOne.bae : null, report };
};
// the Budget rule of CONTRACT §3, the one the pull places its rows by: the report's rows are placed by the same function
// (§14.2), never a copy of it, so a budget's pull rows and its report row can never be told apart by appropriation
SP.apOfBudget = imp_apOfBudget;

// DATES AND MONTHS THAT COULD NOT BE READ, under two headings. A row is placed by its Date (CONTRACT §4.2), never its
// Month: an unreadable Date puts the row in No date, an unreadable Month moves nothing. Listed together under "the row is
// placed in No date", a row whose Month read "Nov-25" and whose Date read 2026-01-10 was said to sit in No date while its
// money sat in Jan (review F11). The message line kept the two apart; the report now does too.
//   L  the lines;  pad  the indent;  dates, months  each item's line, without the indent
function imp_dateLines(L, pad, dates, months) {
  if (dates.length) {
    L.push(pad + 'Dates that could not be read (the row is kept and placed in No date): ' + SP.fmtInt(dates.length) + '.');
    for (const d of dates) L.push(pad + '  ' + d);
  }
  if (months.length) {
    L.push(pad + 'Month values that could not be read (the row is kept; a row is placed by its Date, never its Month, so this '
      + 'moves no money): ' + SP.fmtInt(months.length) + '.');
    for (const d of months) L.push(pad + '  ' + d);
  }
}

// The report as plain lines (the Import report view and the workbook's Import Report sheet both print these)
SP.importReportLines = function importReportLines(report) {
  const L = [];
  if (!report) return L;
  const hdrNote = s => {
    const bits = ['header on row ' + s.headerRow, imp_plural(s.rows, 'data row')];
    const aps = Object.keys(s.byAp).map(ap => imp_apLabel(ap) + ' ' + SP.fmtInt(s.byAp[ap]));
    if (aps.length) bits[1] += ' (' + aps.join(', ') + ')';
    if (s.blank) bits.push(imp_plural(s.blank, 'blank row') + ' skipped');
    if (s.ignoredCols.length) bits.push(s.ignoredCols.join(' and ') + ' ignored (the old workbook’s formula columns)');
    if (s.ownCols && s.ownCols.length) bits.push(s.ownCols.join(', ') + ' ignored (this tool’s own columns, the last of each name, worked out again on every load)');
    const nr = Array.isArray(s.noResult) ? s.noResult : [];
    if (nr.length) bits.push(imp_plural(nr.length, 'cell holds', 'cells hold') + ' a formula saved without its result ('
      + nr.slice(0, 10).join(', ') + (nr.length > 10 ? ', …' : '') + '): each is read as its formula’s text, so an Amount or FY '
      + 'written that way makes its row unreadable; open the file in Excel and save it, so the results are saved, and import it again');
    if (s.extraOnly && s.extraOnly.length) bits.push(imp_plural(s.extraOnly.length, 'row') + ' skipped with values only outside the CCaR columns');
    if (s.extras.length) bits.push('extra column' + (s.extras.length === 1 ? '' : 's') + ' kept: ' + s.extras.map(imp_q).join(', '));
    if (s.missingCols.length) bits.push('not in this sheet, read as blank: ' + s.missingCols.join(', '));
    return bits.join('; ');
  };
  L.push('Import of ' + imp_localWhen(report.importedAt) + ' (this computer’s time): ' + imp_plural(report.files.length, 'file') + '.');
  for (const fr of report.files) {
    L.push('File ' + imp_q(fr.name) + ' (' + (fr.kind === 'csv' ? 'CSV' : '.xlsx') + ', ' + imp_plural(fr.bytes, 'byte') + ')'
      + (fr.refused ? ': REFUSED — ' + fr.refused : fr.date1904 ? ': dates use the 1904 date system' : ''));
    for (const n of fr.notes) L.push('  ' + n);
    for (const s of fr.sheets) {
      L.push('  Sheet ' + imp_q(s.name) + (s.state !== 'visible' ? ' (' + s.state + ')' : '') + ': '
        + (s.bae ? (s.used ? 'the BAE report of budgets — ' + imp_baeNote(s) : 'a BAE report of budgets that cannot be read — ' + s.why)
          : s.used ? 'used — ' + hdrNote(s) : 'ignored — ' + s.why) + '.');
    }
  }
  // An import holding only a BAE report has no pull to report on: the pull's lines (rows read, conversions, Alloc values)
  // would all read none, beside a report that holds rows. Its own section follows instead.
  const pullSide = !report.bae || (report.files || []).some(fr => (fr.sheets || []).some(s => s && s.used && !s.bae));
  if (pullSide) imp_pullLines(L, report);
  imp_baeLines(L, report.bae);
  for (const n of report.notes || []) L.push(n);
  return L;
};
// a BAE report sheet in the file list: where its header is and what was read below it (the BAE section says the rest)
function imp_baeNote(s) {
  const bits = ['header on row ' + s.headerRow, imp_plural(s.rows, 'budget row')];
  if (s.blank) bits.push(imp_plural(s.blank, 'blank row') + ' skipped');
  const nr = Array.isArray(s.noResult) ? s.noResult : [];
  if (nr.length) bits.push(imp_plural(nr.length, 'cell holds', 'cells hold') + ' a formula saved without its result ('
    + nr.slice(0, 10).join(', ') + (nr.length > 10 ? ', …' : '') + '): each is read as its formula’s text, so an amount written that way '
    + 'makes its row unreadable; open the file in Excel and save it, so the results are saved, and import it again');
  if (s.extraOnly && s.extraOnly.length) bits.push(imp_plural(s.extraOnly.length, 'row') + ' skipped with values only outside the four columns read');
  return bits.join('; ') + ' (see the BAE report section)';
}
// the pull's part of the report (CONTRACT §3)
function imp_pullLines(L, report) {
  L.push('Rows read: ' + SP.fmtInt(report.rowsRead) + '. Blank rows skipped: ' + SP.fmtInt(report.rowsBlank) + '.');
  const xo = Array.isArray(report.extraOnly) ? report.extraOnly : [];
  if (xo.length) {
    L.push('Rows skipped because none of the 32 CCaR columns holds anything, though another column does (their text is here, '
      + 'and nowhere else): ' + SP.fmtInt(xo.length) + '.');
    for (const x of xo) L.push('  ' + imp_where(x) + ' row ' + x.row + ': ' + x.values.map(([h, v]) => h + ' ' + imp_q(v)).join(', ') + '.');
  }
  for (const ap of Object.keys(report.byAp || {})) {
    const b = report.byAp[ap];
    L.push(b.label + ': ' + imp_plural(b.rows, 'row') + ', ' + SP.fmtUsd(b.cents)
      + (b.unreadable ? ' (plus ' + imp_plural(b.unreadable, 'unreadable row') + ', counted in no figure)' : '')
      + (b.files && b.files.length ? ', from ' + b.files.map(f => f.sheets.map(sn => imp_where({ file: f.name, sheet: sn })).join(', ')).join(', ') : '') + '.');
  }
  const cv = report.conversions || {};
  const conv = [];
  if (cv.text) conv.push(imp_plural(cv.text, 'amount') + ' written as text and read as numbers');
  if (cv.dollar) conv.push(imp_plural(cv.dollar, 'amount') + ' written with $ (such as "$0.00")');
  if (cv.paren) conv.push(imp_plural(cv.paren, 'amount') + ' in parentheses, read as negative');
  if (cv.subcent) conv.push(imp_plural(cv.subcent, 'amount') + ' with fractions of a cent, rounded to the cent (half away from zero)');
  if (cv.blank) conv.push(imp_plural(cv.blank, 'blank amount') + ' read as $0');
  if (cv.trimmed) conv.push(imp_plural(cv.trimmed, 'value') + ' with spaces trimmed from the ends');
  L.push('Conversions: ' + (conv.length ? conv.join('; ') + '.' : 'none.'));
  const tb = Object.keys(report.trimmedBy || {});
  if (tb.length) L.push('  Spaces trimmed, by column: ' + tb.map(h => h + ' ' + SP.fmtInt(report.trimmedBy[h])).join(', ') + '.');
  for (const s of report.subcent || []) L.push('  Rounded: ' + imp_where(s) + ' row ' + s.row + ': ' + imp_q(s.raw) + ' read as ' + SP.fmtUsd(s.cents) + '.');
  const un = report.unreadable || [];
  L.push('Unreadable rows (kept, counted in no figure): ' + (un.length ? SP.fmtInt(un.length) + '.' : 'none.'));
  for (const u of un) L.push('  ' + imp_where(u) + ' row ' + u.row + ' (' + imp_apLabel(u.ap) + '): ' + u.reasons.join('; ')
    + (u.cents !== null ? '; amount ' + SP.fmtUsd(u.cents) : '') + '.');
  const db = Array.isArray(report.dateUnreadable) ? report.dateUnreadable : [];
  // each line names its own column, so a value under the wrong heading can be seen to be there
  imp_dateLines(L, '', db.filter(d => d && d.column !== 'Month').map(d => imp_where(d) + ' row ' + d.row + ': ' + (d.column || 'Date') + ' ' + imp_q(d.raw) + '.'),
    db.filter(d => d && d.column === 'Month').map(d => imp_where(d) + ' row ' + d.row + ': Month ' + imp_q(d.raw) + '.'));
  const dis = report.disagreements || [];
  L.push('Budget and sheet name disagree: ' + (dis.length ? '' : 'none.'));
  for (const d of dis) L.push('  ' + imp_where(d) + ' (by its name, ' + imp_apLabel(d.sheetAp) + '): ' + imp_plural(d.rows, 'row')
    + ', ' + SP.fmtUsd(d.cents) + ', placed by Budget as ' + Object.keys(d.byBudget).map(a => imp_apLabel(a) + ' ' + SP.fmtInt(d.byBudget[a])).join(', ') + '.');
  for (const x of Array.isArray(report.strays) ? report.strays : []) {
    // The advice used to be "move it to the Full Fund sheet": an O&M file has none, so the person made one, and the row
    // on its own tab became the whole Full Fund pull with no question at all (review SEAM-2). A lone row of another
    // appropriation is put right by its Budget, or by leaving it out of this file: it belongs in its own pull, whole.
    L.push('Every ' + x.label + ' row in this import sits on a sheet named for ' + SP.sheetNamedFor(x) + ': ' + imp_where(x) + ' holds '
      + imp_plural(x.rows, 'row') + ', ' + SP.fmtUsd(x.cents) + ', placed by Budget as ' + x.label + ', and ' + (x.rows === 1 ? 'it is' : 'they are')
      + ' the whole ' + x.label + ' pull this import brings. If ' + (x.rows === 1 ? 'it is' : 'they are') + ' misfiled, correct the Budget, or take '
      + (x.rows === 1 ? 'it' : 'them') + ' out of this file (the ' + x.label + ' pull is imported whole, from its own file or sheet), and import again.');
  }
  L.push('Alloc values:');
  for (const a of report.alloc || []) L.push('  ' + (a.text === '' ? '(blank)' : imp_q(a.text)) + ': ' + imp_plural(a.rows, 'row') + ', ' + SP.fmtUsd(a.cents) + '.');
}

// THE BAE REPORT'S PART OF THE IMPORT REPORT (CONTRACT §14.1): the file and sheet, rows read and skipped, every conversion,
// the unreadable rows in full and the check against the report's own total row. Read from a saved file too, so every value
// is taken as it may be (a report saved by another version draws, never throws).
//   b  report.bae (parseFiles' part), or null;  kept  the import time of a report kept from an earlier import (baeKeptLines),
//   whose blank rows and conversions were not kept and are not said
function imp_baeLines(L, b, kept) {
  if (!b || typeof b !== 'object') return;
  const num = v => (typeof v === 'number' && isFinite(v) ? v : 0);
  const arr = v => (Array.isArray(v) ? v : []);
  const usd = v => (typeof v === 'number' && isFinite(v) ? SP.fmtUsd(v) : '—');
  const signed = v => (typeof v === 'number' && isFinite(v) ? (v > 0 ? '+' : '') + SP.fmtUsd(v) : '—');
  const at = { file: String(b.file ?? '?'), sheet: String(b.sheet ?? '?') };
  const cols = arr(b.cols).map(String);
  const colName = (k, dflt) => (cols[k] !== undefined ? cols[k] : dflt);
  const bad = arr(b.unreadable), read = num(b.rowsRead);
  L.push((kept !== undefined ? 'BAE report of budgets on screen, kept from an earlier import (' + (kept ? imp_localWhen(kept) : 'at a time not recorded') + '): '
    : 'BAE report of budgets: ') + imp_where(at)
    + (b.state === 'hidden' ? ' (a hidden sheet)' : b.state === 'veryHidden' ? ' (a very hidden sheet)' : '') + ', '
    + (typeof b.stamp === 'string' && b.stamp ? 'dated ' + b.stamp + ' by its file name'
      : 'with no date in its file name (it does not end _YYYY-MM-DD_HHMMSS), so it is known by ' + (kept !== undefined ? 'its import’s date' : 'this import’s date'))
    + (kept !== undefined ? '.' : '; header on row ' + (b.headerRow ?? '?') + '.'));
  L.push('  Rows read: ' + SP.fmtInt(read) + (bad.length ? ' (' + SP.fmtInt(num(b.readable)) + ' readable, ' + SP.fmtInt(bad.length) + ' unreadable)' : '')
    + (kept !== undefined ? '.' : '. Blank rows skipped: ' + SP.fmtInt(num(b.blank)) + '.'));
  const c = b.cents && typeof b.cents === 'object' ? b.cents : {};
  L.push('  The readable rows hold Approved ' + usd(c.approved) + ' and Authorized ' + usd(c.authorized) + ': every budget in the report, '
    + 'before Flyaway and the budgets that name no appropriation are left out.');
  if (cols.length === 4) L.push('  Columns: ' + SP.fmtInt(num(b.columns)) + ', every one kept as the file has it. Read: ' + cols.map(imp_q).join(', ')
    + ' (amounts as dollars, to the cent).' + (b.fyBoth ? ' The FY is read from Budget FY Numeric; Budget FY is kept as written.' : ''));
  if (kept === undefined) {
    const cv = b.conversions && typeof b.conversions === 'object' ? b.conversions : {};
    const conv = [];
    if (cv.zero) conv.push(imp_plural(cv.zero, 'amount') + ' written as text that reads as zero (such as "$0.000", the report’s own zero) read as $0');
    if (cv.blank) conv.push(imp_plural(cv.blank, 'blank amount') + ' read as $0');
    if (cv.subcent) conv.push(imp_plural(cv.subcent, 'amount') + ' with fractions of a cent, rounded to the cent');
    if (cv.trimmed) conv.push(imp_plural(cv.trimmed, 'value') + ' with spaces trimmed from the ends');
    L.push('  Conversions: ' + (conv.length ? conv.join('; ') + '.' : 'none.'));
    for (const x of arr(b.subcent)) if (x && typeof x === 'object') {
      L.push('    Rounded: ' + imp_where(at) + ' row ' + x.row + ': ' + String(x.column ?? '') + ' ' + imp_q(String(x.raw ?? '')) + ' read as ' + usd(x.cents) + '.');
    }
  }
  L.push('  Unreadable rows (kept, counted in no figure): ' + (bad.length ? SP.fmtInt(bad.length) + '.' : 'none.'));
  for (const u of bad) {
    if (!u || typeof u !== 'object') continue;
    const raw = u.raw && typeof u.raw === 'object' ? u.raw : {};
    const val = (k, v, dflt, f) => {
      const h = colName(k, dflt);
      return h + ' ' + (Object.prototype.hasOwnProperty.call(raw, h) ? imp_q(String(raw[h])) : f(v));
    };
    L.push('    ' + imp_where(at) + ' row ' + u.row + ': ' + arr(u.reasons).map(String).join('; ') + '. The row: '
      + colName(0, 'Budget Name') + ' ' + imp_q(String(u.name ?? '')) + ', '
      + val(1, u.fy, 'Budget FY', v => (typeof v === 'number' ? String(v) : 'blank')) + ', '
      + val(2, u.approved, 'Budget Approved Amount', usd) + ', ' + val(3, u.authorized, 'Budget Authorized Amount', usd) + '.');
  }
  const xo = arr(b.extraOnly);
  if (xo.length) {
    L.push('  Rows skipped because none of the four columns read holds anything, though another column does (their text is here, '
      + 'and in no figure): ' + SP.fmtInt(xo.length) + '.');
    for (const x of xo) if (x && typeof x === 'object') {
      L.push('    ' + imp_where(at) + ' row ' + x.row + ': ' + arr(x.values).map(p => (Array.isArray(p) ? String(p[0]) + ' ' + imp_q(String(p[1])) : '')).join(', ') + '.');
    }
  }
  const t = b.total && typeof b.total === 'object' ? b.total : null;
  if (!t) {
    L.push('  Total row: none found (a row with no Budget Name and no FY that holds amounts, after the last budget row), so the rows '
      + 'were not checked against the report’s own total.');
  } else {
    const fig = (v, k, dflt) => (typeof v === 'number' ? SP.fmtUsd(v)
      : 'that could not be read (' + imp_q(String(t.raw && typeof t.raw === 'object' ? t.raw[colName(k, dflt)] ?? '' : '')) + ')');
    L.push('  Total row (row ' + t.rowNo + ', the report’s own, never counted): Approved ' + fig(t.approved, 2, 'Budget Approved Amount')
      + ', Authorized ' + fig(t.authorized, 3, 'Budget Authorized Amount') + '. The readable rows add up to Approved ' + usd(t.sumApproved)
      + ' and Authorized ' + usd(t.sumAuthorized) + ': ' + (t.ok ? 'it agrees (within $1 each).'
        : 'it differs, the total less the rows being ' + signed(t.diffApproved) + ' on Approved and ' + signed(t.diffAuthorized) + ' on Authorized'
          + (bad.length ? ' (the unreadable rows are not in the rows’ sum)' : '') + '.'));
  }
}

// THE BAE REPORT ON SCREEN THAT THE LAST IMPORT DID NOT BRING. Only the last import's report is kept (CONTRACT §11), so after
// an import of pulls alone the report's own section, and with it its unreadable rows, would be listed nowhere, as the pulls'
// were before keptPullLines (review IMP-2). These lines are worked out from the stored report, every row of which keeps
// its sheet, row number, reasons and text as written; the blank rows and conversions were the import's and are not said.
//   bae     SP.state.bae.current (or null);  report  the last import's report (or null)
SP.baeKeptLines = function baeKeptLines(bae, report) {
  const L = [];
  const b = bae && typeof bae === 'object' && !Array.isArray(bae) && Array.isArray(bae.rows) ? bae : null;
  if (!b) return L;
  // the last import's own report: its section is already in that import's report
  if (report && report.bae && typeof report.bae === 'object' && typeof b.importedAt === 'string' && report.importedAt === b.importedAt) return L;
  const okNum = v => typeof v === 'number' && Number.isSafeInteger(v);
  let readable = 0, approved = 0, authorized = 0;
  const unreadable = [];
  for (const r of b.rows) {
    if (!r || !Array.isArray(r.c)) continue;
    if (Array.isArray(r.bad) && r.bad.length) {
      unreadable.push({ row: Array.isArray(r.src) && r.src[2] !== undefined ? r.src[2] : '?', reasons: r.bad, name: r.c[0], fy: r.c[1],
        approved: r.c[2], authorized: r.c[3], raw: r.raw && typeof r.raw === 'object' ? r.raw : {} });
    } else if (okNum(r.c[2]) && okNum(r.c[3])) { readable++; approved += r.c[2]; authorized += r.c[3]; }
  }
  const t = b.total && typeof b.total === 'object' ? b.total : null;
  const dA = t && okNum(t.approved) ? t.approved - approved : null, dU = t && okNum(t.authorized) ? t.authorized - authorized : null;
  imp_baeLines(L, { file: b.file, sheet: b.sheet, stamp: b.stamp, cols: b.cols, columns: Array.isArray(b.headers) ? b.headers.length : 0,
    rowsRead: b.rows.length, readable, cents: { approved, authorized }, unreadable,
    total: t ? { rowNo: t.rowNo, approved: okNum(t.approved) ? t.approved : null, authorized: okNum(t.authorized) ? t.authorized : null,
      sumApproved: approved, sumAuthorized: authorized, diffApproved: dA, diffAuthorized: dU, raw: t.raw,
      ok: dA !== null && dU !== null && Math.abs(dA) <= 100 && Math.abs(dU) <= 100 } : null },
    typeof b.importedAt === 'string' ? b.importedAt : '');
  return L;
};

// THE ROWS WHOSE APPROPRIATION IS NOT IDENTIFIED, one line each. They are on no raw sheet (§8.7 has one per appropriation),
// and the Summary's note sends the reader to the Import report for them, which gave only their count and dollars: a reader
// could not find which rows they were (review XP-8). Each is named by where it was, and by what identifies it.
//   pulls   the current pulls
SP.unidentifiedLines = function unidentifiedLines(pulls) {
  const L = [];
  const p = pulls && typeof pulls === 'object' ? pulls.unidentified : null;
  if (!p || typeof p !== 'object' || !Array.isArray(p.rows) || !p.rows.length) return L;
  const files = Array.isArray(p.files) ? p.files.filter(f => f && typeof f === 'object') : [];
  // src[0] is the file's place in its IMPORT, not in this pull's file list (which holds only the files these rows came
  // from), so a row is matched to its file by its sheet's name; two files with a sheet of that name are both named
  const fileOf = r => {
    const sh = Array.isArray(r.src) ? String(r.src[1]) : '';
    const fs = files.length === 1 ? files : files.filter(f => Array.isArray(f.sheets) && f.sheets.map(String).includes(sh));
    return fs.length === 1 ? String(fs[0].name) : files.length ? 'one of ' + files.map(f => String(f.name)).join(', ') : 'a file not recorded';
  };
  const t = (r, k) => { const v = r.c[k]; return v === null || v === undefined ? '' : String(v); };
  L.push('Rows whose appropriation is not identified (their Budget names none, nor does their sheet), counted nowhere: ' + SP.fmtInt(p.rows.length) + '.');
  for (const r of p.rows) {
    if (!r || !Array.isArray(r.c)) continue;
    const raw = r.raw && typeof r.raw === 'object' ? r.raw : {};
    const fy = typeof r.c[IMP_FY] === 'number' ? 'FY' + r.c[IMP_FY] : 'FY ' + imp_q(Object.prototype.hasOwnProperty.call(raw, 'FY') ? String(raw.FY) : '') + ' not read';
    const amt = typeof r.c[IMP_AMT] === 'number' ? SP.fmtUsd(r.c[IMP_AMT]) : 'amount ' + imp_q(Object.prototype.hasOwnProperty.call(raw, 'Amount') ? String(raw.Amount) : '') + ' not read';
    L.push('  ' + imp_where({ file: fileOf(r), sheet: Array.isArray(r.src) && r.src[1] !== undefined ? String(r.src[1]) : '?' })
      + ' row ' + (Array.isArray(r.src) && r.src[2] !== undefined ? r.src[2] : '?') + ': CCaR ' + imp_q(t(r, IMP_CCAR)) + ', Title ' + imp_q(t(r, IMP_TITLE))
      + ', Budget ' + imp_q(t(r, IMP_BUDGET)) + ', Plan Event ' + imp_q(t(r, IMP_PE)) + ', ' + fy + ', ' + amt + '.');
  }
  return L;
};

// THE PULLS ON SCREEN THAT THE LAST IMPORT DID NOT BRING. Only the last import's report is kept (CONTRACT §11), but an
// appropriation it did not replace keeps its pull, and with it any rows that count nowhere. The Summary names those rows
// and sends the reader to the Import report, which (being the last import's) listed none of them and said "Unreadable
// rows: none." (review IMP-2). These lines are worked out from the pulls themselves, every row of which keeps its sheet,
// row number, reasons and raw text, so whatever the report a pull came with, what it holds is listed with it.
//   pulls   the current pulls; report  the last import's report (or null)
SP.keptPullLines = function keptPullLines(pulls, report) {
  const L = [];
  if (!pulls || typeof pulls !== 'object') return L;
  const by = report && report.byAp && typeof report.byAp === 'object' && !Array.isArray(report.byAp) ? report.byAp : {};
  const at = report ? report.importedAt : undefined;
  for (const ap of IMP_AP_IDS.concat(['unidentified'])) {
    const p = pulls[ap];
    if (!p || typeof p !== 'object' || !Array.isArray(p.rows)) continue;
    // unidentified rows carry no import time of their own: they are the last import's whenever its report counts some
    if (Object.prototype.hasOwnProperty.call(by, ap) && (ap === 'unidentified' || p.importedAt === at)) continue;
    const files = Array.isArray(p.files) ? p.files.filter(f => f && typeof f === 'object') : [];
    const fileOf = r => (files.length === 1 ? String(files[0].name) : files.length ? 'one of ' + files.map(f => String(f.name)).join(', ') : 'a file not recorded');
    const where = r => imp_where({ file: fileOf(r), sheet: Array.isArray(r.src) && r.src[1] !== undefined ? String(r.src[1]) : '?' })
      + ' row ' + (Array.isArray(r.src) && r.src[2] !== undefined ? r.src[2] : '?');
    let cents = 0;
    const bad = [], dates = [];
    for (const r of p.rows) {
      if (!r || !Array.isArray(r.c)) continue;
      const amt = r.c[IMP_AMT];
      if (Array.isArray(r.bad) && r.bad.length) bad.push(r);
      else if (typeof amt === 'number') cents += amt;
      const raw = r.raw && typeof r.raw === 'object' ? r.raw : {};
      for (const h of ['Month', 'Date']) if (Object.prototype.hasOwnProperty.call(raw, h)) dates.push([r, h, raw[h]]);
    }
    const src = files.map(f => (Array.isArray(f.sheets) && f.sheets.length ? f.sheets : ['?']).map(sn => imp_where({ file: String(f.name), sheet: String(sn) })).join(', ')).join(', ');
    if (ap === 'unidentified') {
      L.push(imp_apLabel(ap) + ': ' + imp_plural(p.rows.length, 'row') + ', ' + SP.fmtUsd(cents) + (src ? ', from ' + src : '') + ', counted nowhere.');
    } else {
      L.push(imp_apLabel(ap) + ': ' + imp_plural(p.rows.length, 'row') + ', ' + SP.fmtUsd(cents)
        + (bad.length ? ' (plus ' + imp_plural(bad.length, 'unreadable row') + ', counted in no figure)' : '')
        + ', imported ' + (typeof p.importedAt === 'string' && p.importedAt ? imp_localWhen(p.importedAt) : 'at a time not recorded') + (src ? ', from ' + src : '') + '.');
    }
    if (bad.length) {
      L.push('  Unreadable rows (kept, counted in no figure): ' + SP.fmtInt(bad.length) + '.');
      for (const r of bad) {
        const amt = r.c[IMP_AMT];
        L.push('    ' + where(r) + ': ' + r.bad.map(String).join('; ') + (typeof amt === 'number' ? '; amount ' + SP.fmtUsd(amt) : '') + '.');
      }
    }
    imp_dateLines(L, '  ', dates.filter(([, h]) => h === 'Date').map(([r, h, v]) => where(r) + ': ' + h + ' ' + imp_q(String(v)) + '.'),
      dates.filter(([, h]) => h === 'Month').map(([r, h, v]) => where(r) + ': ' + h + ' ' + imp_q(String(v)) + '.'));
  }
  return L;
};
