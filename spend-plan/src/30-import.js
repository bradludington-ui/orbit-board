// §3 IMPORT — reading CCaR pulls into typed rows, the import report, and the per-row derived fields (CONTRACT §3).
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
  const headKeys = new Set(head.map(h => SP.normKey(imp_text(h))));
  const ownExport = IMP_OWN_COLS.every(k => headKeys.has(k)), ownSeen = new Set();
  head.forEach((h, j) => {
    const text = imp_text(h);
    if (text === '') return;
    const nk = SP.normKey(text);
    if (IMP_COL.has(nk)) {
      const k = IMP_COL.get(nk);
      if (col[k] >= 0) dup.push({ name: SP.RAW_HEADERS[k], a: col[k], b: j });
      else { col[k] = j; named.add(j); }
    } else if (IMP_FORMULA_COLS.has(nk)) { info.ignoredCols.push(text); named.add(j); ignored.add(j); }
    else if (ownExport && IMP_OWN_COLS.includes(nk) && !ownSeen.has(nk)) { ownSeen.add(nk); info.ownCols.push(text); named.add(j); ignored.add(j); }
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

// files: [{name, data: ArrayBuffer | typed array | string}] -> {pulls, report}. A name ending .csv is read as CSV, any other
// as .xlsx. Throws an Error with .refused = true (and .report) when the import as a whole is refused: nothing to change.
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
      const { info, out } = imp_sheet(fi, name, kind, sh, date1904, acc);
      fr.sheets.push(info);
      if (!info.used) continue;
      report.rowsRead += info.rows;
      report.rowsBlank += info.blank;
      if (info.disagree) report.disagreements.push(Object.assign({ file: name, sheet: sh.name }, info.disagree));
      for (const o of out) got.push({ ap: o.ap, row: o.row, file: name, sheet: sh.name, fileIdx: fi });
    }
    if (!fr.sheets.some(s => s.used)) fr.refused = fr.sheets.length
      ? 'no sheet in it holds CCaR rows under the column headers ' + SP.REQUIRED.join(', ')
      : 'it holds no sheets';
  }
  report.alloc = [...acc.alloc.values()].sort((a, b) => b.rows - a.rows || (a.text < b.text ? -1 : a.text > b.text ? 1 : 0));
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
    const e = m.get(key) || { file: g.file, sheet: g.sheet, n: 0, cents: 0 };
    e.n++; if (!g.row.bad) e.cents += g.row.c[IMP_AMT];
    m.set(key, e);
  }
  const clash = [];
  for (const ap of IMP_AP_IDS) {
    const m = srcBy.get(ap);
    if (!m || m.size < 2) continue;
    clash.push(imp_apLabel(ap) + ' rows come from ' + m.size + ' sheets: '
      + [...m.values()].map(e => imp_where(e) + ' holds ' + imp_plural(e.n, imp_apLabel(ap) + ' row')).join('; '));
  }
  // The advice used to end "or import the files one at a time": taken, the misfiled row became the whole of its
  // appropriation's pull and replaced that pull without a word (review IMP-1). The row has to move, or its Budget change.
  if (clash.length) throw imp_refuse('Nothing was imported. Each appropriation’s rows must come from one sheet in one import, and '
    + clash.join('. ') + '. Rows are placed by their Budget name, so a row on the wrong tab shows here as a small count: move it '
    + 'to the sheet of its own appropriation, or correct its Budget, and import again.', report);
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
  return { pulls: ordered, report };
};

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
    if (s.ownCols && s.ownCols.length) bits.push(s.ownCols.join(', ') + ' ignored (this tool’s own columns, worked out again on every load)');
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
        + (s.used ? 'used — ' + hdrNote(s) : 'ignored — ' + s.why) + '.');
    }
  }
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
  const db = report.dateUnreadable || [];
  if (db.length) {
    L.push('Dates that could not be read (the row is kept and placed in No date): ' + SP.fmtInt(db.length) + '.');
    for (const d of db) L.push('  ' + imp_where(d) + ' row ' + d.row + ': ' + d.column + ' ' + imp_q(d.raw) + '.');
  }
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
  for (const n of report.notes || []) L.push(n);
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
    if (dates.length) {
      L.push('  Dates that could not be read (the row is kept and placed in No date): ' + SP.fmtInt(dates.length) + '.');
      for (const [r, h, v] of dates) L.push('    ' + where(r) + ': ' + h + ' ' + imp_q(String(v)) + '.');
    }
  }
  return L;
};
