// §8 EXPORT — the Excel workbook (CONTRACT §8).
//
//   await SP.excelBytes(model, pulls, settings, meta)  -> Uint8Array, the workbook
//   SP.excelSpec(model, pulls, settings, meta)         -> the spec SP.writeXlsx is given (what the tests read before bytes)
//   SP.excelFileName(model, today)                     -> 'SFCB Spend Plan FY2027 - data through Oct-2026 - 2026-11-09.xlsx'
//   await SP.exportExcel()                             -> {ok, message, name}: the UI action (build, download, say what)
//
//   meta = {report?: the last import's report, today?: 'YYYY-MM-DD' (the date in the file name; this browser's today)}
//
// Every figure here is READ from the model, never worked out again: the workbook, the screens and the pictures all print
// SP.buildModel's numbers, so they cannot disagree about a dollar. This module only lays them out, in v12's look.
//
// VALUES ONLY. v12's formulas were how its defects spread (a SUMIFS with no service criterion, a hand-typed goal), and a
// formula that reads a raw tab breaks the moment someone sorts it. A value is what the tool worked out, and stays that.

// ---------------------------------------------------------------------------------------------------------------
// THE LOOK (CONTRACT §8, FINDINGS "### look"): v12's colours and number formats, by role
// ---------------------------------------------------------------------------------------------------------------
const EX_NAVY = '1F3A68', EX_MID = '305496', EX_STRIP = 'BDD7EE', EX_GOLD = 'FFE699', EX_BOXC = '404040', EX_GRIDC = '808080',
  EX_INK = '1A1A1A', EX_SUB = '707070', EX_CLOSED = 'F2F2F2', EX_PLAN = '808080', EX_WHITE = 'FFFFFF';
const EX_STATUS_FILL = { green: '00B050', yellow: 'FFD700', red: 'C00000' };
// white on red and green, black on yellow: the word must be readable on its own colour (a colour never stands alone)
const EX_STATUS_INK = { green: 'FFFFFF', yellow: '000000', red: 'FFFFFF' };
const EX_FM = '#,##0.00;(#,##0.00);-';     // $M, negatives in parentheses, zero as '-'
// The same figure marked: † Authorized not entered, so Approved stands in; ‡ Authorized as entered, for the
// appropriation and FY as a whole, while some switch is off (SP.authMark); a TOTAL carries each mark its rows do. A
// format, not text, so the cell is still the number (anyone summing the column gets the right total) and the mark shows.
function ex_markFmt(mark) { return '#,##0.00"' + mark + '";(#,##0.00)"' + mark + '";-"' + mark + '"'; }
const EX_MARKS = ['†', '‡', '†‡'];
const EX_FP = '0.00%', EX_FD = '+0.00%;-0.00%;0.00%', EX_FUSD = '#,##0.00';
// A literal '&' in a header is an Excel code; SP.CUI has none, and doubling keeps it so if the marking ever gains one.
const EX_CUI = String(SP.CUI).replace(/&/g, '&&');
const EX_HEADER = '&C&"Calibri,Bold"' + EX_CUI;
const EX_FOOTER = '&C&"Calibri,Bold"' + EX_CUI + '&RPage &P of &N';
const EX_PAGE = Object.freeze({ orientation: 'landscape', paper: 'letter', fitWidth: 1, fitHeight: 0 });
const EX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
// A Not Allocated month is split across rows at about this many characters. One cell can hold 32,767 and one row can be
// 409 points tall (about 30 lines); a no-cap month on the real pull would otherwise be clipped in its row, or cut by the
// writer, and an item nobody sees is the defect §6.8 removed.
const EX_NA_CHUNK = 4000;

// A style is a plain object, made once and handed to the writer by reference: the writer files each object once, so a
// constant reused on a 50,000-cell sheet costs one lookup per cell instead of comparing its contents every time.
function ex_s(font, fill, fmt, align, border) {
  const s = {};
  if (font) s.font = font;
  if (fill) s.fill = fill;
  if (fmt) s.fmt = fmt;
  if (align) s.align = align;
  if (border) s.border = border;
  return Object.freeze(s);
}
const EX_THIN = Object.freeze({ t: ['thin', EX_GRIDC], b: ['thin', EX_GRIDC], l: ['thin', EX_GRIDC], r: ['thin', EX_GRIDC] });
const EX_BOX = Object.freeze({ t: ['medium', EX_BOXC], b: ['medium', EX_BOXC], l: ['medium', EX_BOXC], r: ['medium', EX_BOXC] });
const EXS = (() => {
  const X = {};
  const f = (o) => Object.freeze(o);
  // titles and lines under them
  X.title = ex_s(f({ b: true, sz: 16, color: EX_WHITE }), EX_NAVY, null, f({ h: 'center', v: 'center' }));
  X.sub = ex_s(f({ i: true, sz: 10, color: EX_SUB }), null, null, f({ h: 'left', v: 'top', wrap: true }));
  X.shown = ex_s(f({ b: true, sz: 10, color: EX_NAVY }), null, null, f({ h: 'left', v: 'center', indent: 1 }));
  // column headers: light gold, a medium box
  X.head = ex_s(f({ b: true, sz: 11, color: EX_INK }), EX_GOLD, null, f({ h: 'center', v: 'center', wrap: true }), EX_BOX);
  // block bars: the first cell boxes the left, the last the right, every cell the top and bottom (a merge is painted from
  // each cell underneath it, so a bar whose middle cells carry no border prints with gaps)
  const bar = (fill, sz) => {
    const fo = f({ b: true, sz, color: EX_WHITE }), al = f({ h: 'left', v: 'center', indent: 1 });
    const m = ['medium', EX_BOXC];
    return { first: ex_s(fo, fill, null, al, f({ t: m, b: m, l: m })), mid: ex_s(fo, fill, null, al, f({ t: m, b: m })),
      last: ex_s(fo, fill, null, al, f({ t: m, b: m, r: m })), only: ex_s(fo, fill, null, al, EX_BOX) };
  };
  X.barSlide = bar(EX_NAVY, 14);
  X.barAp = bar(EX_NAVY, 12);
  X.barPmo = bar(EX_MID, 12);
  X.barNa = bar(EX_NAVY, 11);
  X.strip = ex_s(f({ b: true, sz: 11, color: EX_NAVY }), EX_STRIP, null, f({ h: 'center', v: 'center' }),
    f({ t: ['medium', EX_BOXC], b: ['thin', EX_GRIDC] }));
  // the outline: PMO 11 bold navy; Title 10 bold, indent 2; Plan Event 10, indent 4; CCaR 9, indent 6
  const fonts = [f({ b: true, sz: 11, color: EX_NAVY }), f({ b: true, sz: 10, color: EX_INK }), f({ sz: 10, color: EX_INK }), f({ sz: 9, color: EX_INK })];
  const bold = [fonts[0], fonts[1], f({ b: true, sz: 10, color: EX_INK }), f({ b: true, sz: 9, color: EX_INK })];
  const indent = [0, 2, 4, 6];
  const right = f({ h: 'right' });
  X.treeLab = fonts.map((fo, k) => ex_s(fo, null, null, f(indent[k] ? { h: 'left', v: 'top', wrap: true, indent: indent[k] } : { h: 'left', v: 'top', wrap: true }), EX_THIN));
  // [kind][closed 0|1]: a month cell; treeTot[kind]: a Total cell (bold below the Title, as v12 printed them)
  X.treeCell = fonts.map(fo => [ex_s(fo, null, EX_FM, right, EX_THIN), ex_s(fo, EX_CLOSED, EX_FM, right, EX_THIN)]);
  X.treeTot = bold.map(fo => ex_s(fo, null, EX_FM, right, EX_THIN));
  X.treeSz = [11, 10, 10, 9];
  X.treeIndent = indent;
  // the totals band
  const bf = f({ b: true, sz: 10, color: EX_NAVY }), center = f({ h: 'center', v: 'center' });
  X.bandLab = ex_s(bf, null, null, f({ h: 'right', v: 'center', indent: 1 }), EX_THIN);
  X.bandM = [ex_s(bf, null, EX_FM, right, EX_THIN), ex_s(bf, EX_CLOSED, EX_FM, right, EX_THIN)];
  X.bandP = [ex_s(bf, null, EX_FP, center, EX_THIN), ex_s(bf, EX_CLOSED, EX_FP, center, EX_THIN)];
  // plan cells of Obligation % and Status are italic and grey: a planned percentage is not an obligation
  const planF = f({ b: true, i: true, sz: 10, color: EX_PLAN });
  X.bandPlan = ex_s(planF, null, EX_FP, center, EX_THIN);
  X.bandStatus = {};
  // a PLAN status keeps its fill and its readable ink, and is italic: grey on the red or green fill measured about
  // 1.5:1 and could not be read on a slide. Grey stays on the Obligation % plan cells, which have no fill (integration
  // ruling, the same in the screens and the pictures).
  for (const st of ['green', 'yellow', 'red']) {
    X.bandStatus[st] = [ex_s(f({ b: true, sz: 10, color: EX_STATUS_INK[st] }), EX_STATUS_FILL[st], null, center, EX_THIN),
      ex_s(f({ b: true, i: true, sz: 10, color: EX_STATUS_INK[st] }), EX_STATUS_FILL[st], null, center, EX_THIN)];
  }
  // no status (no goal, or the No date column): v12's base fill for the row, and no word
  X.bandStatus.none = [ex_s(bf, EX_GOLD, null, center, EX_THIN), ex_s(planF, EX_GOLD, null, center, EX_THIN)];
  // the FY tables at the top of the Summary, appropriation and PMO sheets
  const t10 = f({ sz: 10, color: EX_INK }), b10 = f({ b: true, sz: 10, color: EX_INK });
  X.tApLab = ex_s(f({ b: true, sz: 11, color: EX_NAVY }), null, null, f({ h: 'left', v: 'center', wrap: true, indent: 1 }), EX_THIN);
  X.tFy = ex_s(t10, null, '0', center, EX_THIN);
  X.tM = ex_s(t10, null, EX_FM, right, EX_THIN);
  X.tMMark = Object.fromEntries(EX_MARKS.map(m => [m, ex_s(t10, null, ex_markFmt(m), right, EX_THIN)]));
  X.tPct = ex_s(b10, null, EX_FP, center, EX_THIN);
  X.tGoal = ex_s(t10, null, EX_FP, center, EX_THIN);
  X.tDelta = ex_s(b10, null, EX_FD, center, EX_THIN);
  X.tBlank = ex_s(t10, null, null, center, EX_THIN);
  X.tStatus = {};
  for (const st of ['green', 'yellow', 'red']) X.tStatus[st] = ex_s(f({ b: true, sz: 10, color: EX_STATUS_INK[st] }), EX_STATUS_FILL[st], null, center, EX_THIN);
  // the TOTAL row: navy, white, bold
  const tw = f({ b: true, sz: 11, color: EX_WHITE });
  X.totLab = ex_s(tw, EX_NAVY, null, f({ h: 'left', v: 'center', indent: 1 }), EX_THIN);
  X.totM = ex_s(tw, EX_NAVY, EX_FM, right, EX_THIN);
  X.totMMark = Object.fromEntries(EX_MARKS.map(m => [m, ex_s(tw, EX_NAVY, ex_markFmt(m), right, EX_THIN)]));
  X.totP = ex_s(tw, EX_NAVY, EX_FP, center, EX_THIN);
  X.totBlank = ex_s(tw, EX_NAVY, null, center, EX_THIN);
  // legend, notes, plain text
  X.h11 = ex_s(f({ b: true, sz: 11, color: EX_INK }));
  X.text = ex_s(t10, null, null, f({ h: 'left', v: 'top', wrap: true }));
  X.line = ex_s(t10);
  X.lineB = ex_s(b10);
  X.note = ex_s(f({ i: true, sz: 10, color: EX_SUB }), null, null, f({ h: 'left', v: 'top', wrap: true }));
  // Not Allocated lines: the month label in A, the items in B merged across, wrapped
  X.naLab = ex_s(b10, null, null, f({ h: 'right', v: 'top', indent: 1 }));
  X.naText = ex_s(t10, null, null, f({ h: 'left', v: 'top', wrap: true, indent: 1 }));
  // list tables (Not Allocated, raw data, settings)
  X.lText = ex_s(t10, null, null, f({ h: 'left', v: 'top', wrap: true }), EX_THIN);
  X.lFy = ex_s(t10, null, '0', f({ h: 'center', v: 'top' }), EX_THIN);
  X.lM = ex_s(t10, null, EX_FM, f({ h: 'right', v: 'top' }), EX_THIN);
  X.lPct = ex_s(t10, null, EX_FP, center, EX_THIN);
  X.rText = ex_s(t10, null, null, null, EX_THIN);
  X.rNum = ex_s(t10, null, '0', null, EX_THIN);
  X.rMonth = ex_s(t10, null, 'yyyy-mm', null, EX_THIN);
  X.rDate = ex_s(t10, null, 'yyyy-mm-dd', null, EX_THIN);
  X.rAmt = ex_s(t10, null, EX_FUSD, null, EX_THIN);
  // a value the import could not read, kept as the text the pull held: red, so it is not mistaken for a figure
  X.rBad = ex_s(f({ sz: 10, color: 'C00000' }), null, null, null, EX_THIN);
  X.rHead = ex_s(f({ b: true, sz: 11, color: EX_INK }), EX_GOLD, null, f({ h: 'center', v: 'center', wrap: true }), EX_BOX);
  return X;
})();

// v12's widths: a 70-character label column, then the money columns (FINDINGS "### look" §5)
const EX_W_LABEL = 69.949, EX_W_TOTAL = 13.047, EX_W_MONTH = 11.027, EX_W_EDGE = 11.973;
const EX_RAW_W = [6.05, 11.97, 11.97, 34.97, 34.97, 6.05, 6.05, 34.97, 11.97, 13.99, 7.93, 30.00, 9.95, 18.02, 14.93, 14.93,
  14.93, 18.02, 27.98, 16.01, 16.01, 13.99, 13.99, 13.99, 9.95, 7.93, 7.93, 9.95, 9.95, 9.95, 13.99, 13.99];   // the 32
const EX_CURVES = [['om1', 'O&M, first year'], ['om2', 'O&M, second year or later'], ['p1', 'Procurement, first year'],
  ['p2', 'Procurement, second year'], ['p3', 'Procurement, third year'], ['p4', 'Procurement, fourth year or later']];

// ---------------------------------------------------------------------------------------------------------------
// SMALL HELPERS
// ---------------------------------------------------------------------------------------------------------------
// cents -> $M as the cell's number. A missing figure is an empty cell, never 0: "no goal" and "a goal of 0%" differ.
function ex_M(c) { return typeof c === 'number' && isFinite(c) ? c / 1e8 : null; }
function ex_num(x) { return typeof x === 'number' && isFinite(x) ? x : null; }
function ex_cell(v, s) {
  if (v === null || v === undefined || (typeof v === 'number' && !isFinite(v))) return s ? { s } : null;
  return s ? { v, s } : { v };
}
function ex_pad2(n) { return String(n).padStart(2, '0'); }
// this browser's calendar date: a file exported at 9 pm in Virginia is dated that day, not tomorrow's in UTC
function ex_today(d) {
  d = d instanceof Date && !isNaN(d.getTime()) ? d : new Date();
  return d.getFullYear() + '-' + ex_pad2(d.getMonth() + 1) + '-' + ex_pad2(d.getDate());
}
// an import time -> its local date; a plain 'YYYY-MM-DD' is that date as written
function ex_localDate(iso) {
  if (typeof iso !== 'string') return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const t = Date.parse(iso);
  return isNaN(t) ? '' : ex_today(new Date(t));
}
function ex_rng(r1, c1, r2, c2) { return SP.colLetter(c1) + r1 + ':' + SP.colLetter(c2) + r2; }
function ex_own(o, k) { return !!o && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k); }
// How many lines a wrapped text takes in a width of w (Excel's units, one '0' of Calibri 11). Calibri 10 fits about 1.15
// characters to a unit; this errs a little wide of that, because a row cut short hides words and one a line too tall
// only shows white. Explicit line breaks count.
function ex_lines(text, w, sz, indent) {
  const per = Math.max(8, Math.floor(w * 1.08 * (10 / (sz || 10))) - (indent || 0) * 2);
  let n = 0;
  for (const p of String(text).split('\n')) n += Math.max(1, Math.ceil(p.length / per));
  return n;
}
// a row's height for that many lines (Excel caps a row at 409 points); undefined (the default 15) for one line
function ex_ht(lines, sz) {
  if (lines <= 1) return undefined;
  return Math.min(409, Math.round((lines * (sz || 10) * 1.32 + 3) * 4) / 4);
}
function ex_statusWord(st) { return st ? SP.statusWord(st) : ''; }

// ---------------------------------------------------------------------------------------------------------------
// A SHEET UNDER CONSTRUCTION. K.sh is exactly what the writer is given (it refuses any key it does not know, so nothing of
// this module's own rides on it); K holds the layout facts the row builders share.
// ---------------------------------------------------------------------------------------------------------------
function ex_sheet(name, widths, opts) {
  const sh = { name, grid: false, page: EX_PAGE, header: EX_HEADER, footer: EX_FOOTER, cols: widths.map(w => ({ w })),
    rows: [], merges: [] };
  Object.assign(sh, opts || {});
  return { sh, W: widths.length, widths };
}
function ex_push(K, cells, opts) {
  const r = { cells };
  if (opts) {
    if (opts.ht !== undefined) r.ht = opts.ht;
    if (opts.level) r.level = opts.level;
    if (opts.hidden) r.hidden = true;
  }
  K.sh.rows.push(r);
  return K.sh.rows.length;   // the row's number, 1-based
}
function ex_blank(K, opts) { return ex_push(K, [], opts); }
// a text across columns c1..c2 of a new row: merged, every covered cell painted with the same style
function ex_span(K, text, s, c1, c2, opts) {
  const cells = [];
  for (let i = 0; i < c1; i++) cells.push(null);
  cells.push({ v: text, s });
  for (let i = c1 + 1; i <= c2; i++) cells.push({ s });
  const r = ex_push(K, cells, opts);
  if (c2 > c1) K.sh.merges.push(ex_rng(r, c1, r, c2));
  return r;
}
function ex_widthOf(K, c1, c2) { let w = 0; for (let i = c1; i <= c2; i++) w += K.widths[i] || EX_W_MONTH; return w; }
// a sheet's title, merged across its width
function ex_title(K, text) { return ex_span(K, text, EXS.title, 0, K.W - 1, { ht: 27.75 }); }
// an explanatory line: italic grey, wrapped, as tall as its words need
function ex_subLine(K, text) {
  return ex_span(K, text, EXS.sub, 0, K.W - 1, { ht: ex_ht(ex_lines(text, ex_widthOf(K, 0, K.W - 1), 10), 10) });
}
// the line every report sheet carries: what the switches show (§4.3)
function ex_shownLine(K, M) { return ex_span(K, M.shown.text, EXS.shown, 0, K.W - 1); }
function ex_bar(K, text, set, ht) {
  const cells = [];
  for (let i = 0; i < K.W; i++) cells.push({ s: K.W === 1 ? set.only : i === 0 ? set.first : i === K.W - 1 ? set.last : set.mid });
  cells[0].v = text;
  const r = ex_push(K, cells, { ht });
  if (K.W > 1) K.sh.merges.push(ex_rng(r, 0, r, K.W - 1));
  return r;
}
function ex_headRow(K, labels, ht) { return ex_push(K, labels.map(t => ({ v: t, s: EXS.head })), { ht }); }

// ---------------------------------------------------------------------------------------------------------------
// THE SPEND-PLAN BLOCKS: label | Total | Prior Yr | Oct … Sep | FY{E+1}+ | [No date] | Total
// ---------------------------------------------------------------------------------------------------------------
// the model columns a block shows: all but No date, which only when some shown row has no date (§4.2)
function ex_dcols(M) { const d = []; for (let i = 0; i < 14; i++) d.push(i); if (M.showNoDate) d.push(14); return d; }
function ex_blockWidths(M) {
  const w = [EX_W_LABEL, EX_W_TOTAL];
  for (const i of ex_dcols(M)) w.push(i === 0 || i === 13 ? EX_W_EDGE : EX_W_MONTH);
  w.push(EX_W_TOTAL);
  return w;
}
function ex_blockSheet(name, M, opts) {
  const K = ex_sheet(name, ex_blockWidths(M), opts);
  K.dc = ex_dcols(M);
  K.closed = M.cols.map(c => !!c.closed);
  return K;
}
function ex_blockHead(K, M, first) {
  return ex_headRow(K, [first, 'Total'].concat(K.dc.map(i => M.cols[i].label), ['Total']), 24);
}
// one money row: label, Total, each shown column, Total
function ex_moneyRow(K, label, labS, cols, total, cellS, totS, opts) {
  const tv = ex_M(total);
  const cells = [{ v: label, s: labS }, ex_cell(tv, totS)];
  for (const i of K.dc) cells.push(ex_cell(ex_M(cols[i]), cellS[K.closed[i] ? 1 : 0]));
  cells.push(ex_cell(tv, totS));
  return ex_push(K, cells, opts);
}
// The tree, PMO -> Title -> Plan Event -> CCaR. `base` is the outline level of the PMO row: 1 on the appropriation sheets,
// 0 on a PMO tab (CONTRACT §8.5, §8.6). Plan Event and CCaR rows are hidden, so a sheet opens at PMO and Title.
function ex_tree(K, tree, base) {
  for (const n of SP.treeRows(tree, 4)) {
    const k = n.level - 1;
    const sz = EXS.treeSz[k];
    const lines = ex_lines(n.label, K.widths[0], sz, EXS.treeIndent[k]);
    ex_moneyRow(K, n.label, EXS.treeLab[k], n.cols, n.total, EXS.treeCell[k], EXS.treeTot[k],
      { level: n.level - 1 + base, hidden: n.level >= 3, ht: ex_ht(lines, sz) });
  }
}
// Monthly Totals, Cumulative Totals, Obligation %, OSD Goal %, OSD Status. The Total columns carry the block's headline:
// Approved, then its Obl %, goal and status, the figures the Summary row prints (§4.5).
function ex_band(K, M, b) {
  const L = EXS.bandLab;
  ex_moneyRow(K, 'Monthly Totals', L, b.cols, b.approved, EXS.bandM, EXS.bandM[0]);
  // Cumulative's Total is the whole block, as v12's was: No date is outside the running sum, never outside the total
  ex_moneyRow(K, 'Cumulative Totals', L, b.cum, b.approved, EXS.bandM, EXS.bandM[0]);
  const pct = ex_num(b.oblPct), goal = ex_num(b.goal);
  // the label in the words the screen and the picture use (SP.oblLabel, review R7)
  const obl = [{ v: SP.oblLabel(b, M), s: L },
    ex_cell(pct, EXS.bandP[0])];
  for (const i of K.dc) {
    const o = b.obl[i] || {};
    obl.push(ex_cell(ex_num(o.v), o.kind === 'plan' ? EXS.bandPlan : EXS.bandP[K.closed[i] ? 1 : 0]));
  }
  obl.push(ex_cell(pct, EXS.bandP[0]));
  ex_push(K, obl);
  const g = [{ v: 'OSD Goal %', s: L }, ex_cell(goal, EXS.bandP[0])];
  for (const i of K.dc) g.push(ex_cell(ex_num(b.goalC[i]), EXS.bandP[K.closed[i] ? 1 : 0]));
  g.push(ex_cell(goal, EXS.bandP[0]));
  ex_push(K, g);
  const sc = (status, plan) => {
    const set = EXS.bandStatus[status && EXS.bandStatus[status] ? status : 'none'];
    return ex_cell(status ? ex_statusWord(status) : null, set[plan ? 1 : 0]);
  };
  const s = [{ v: 'OSD Status', s: L }, sc(b.status, false)];
  for (const i of K.dc) { const x = b.statusC[i] || {}; s.push(sc(x.status, x.kind === 'plan')); }
  s.push(sc(b.status, false));
  ex_push(K, s);
}
// §5's one line per month, under its bar. A month longer than EX_NA_CHUNK continues on the next row with its label
// blank, so every item is printed whole and none is clipped by a row height.
function ex_na(K, M, items) {
  ex_bar(K, 'Not Allocated Requirements', EXS.barNa, 19.5);
  const lines = SP.naLines(items, M.cols);
  const tw = ex_widthOf(K, 1, K.W - 1);
  const row = (label, text) => {
    const cells = [label ? { v: label, s: EXS.naLab } : null, { v: text, s: EXS.naText }];
    for (let i = 2; i < K.W; i++) cells.push({ s: EXS.naText });
    const r = ex_push(K, cells, { ht: ex_ht(ex_lines(text, tw, 10, 1), 10) });
    if (K.W > 2) K.sh.merges.push(ex_rng(r, 1, r, K.W - 1));
  };
  if (!lines.length) { row('', 'None.'); return; }
  for (const ln of lines) {
    let chunk = '', first = true;
    for (const it of ln.items) {
      const t = SP.naItemText(it);
      if (chunk && chunk.length + 2 + t.length > EX_NA_CHUNK) { row(first ? ln.label : '', chunk); first = false; chunk = ''; }
      chunk = chunk ? chunk + '; ' + t : t;
    }
    if (chunk) row(first ? ln.label : '', chunk);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// THE FY TABLES (Summary, appropriation sheets, PMO tabs)
// ---------------------------------------------------------------------------------------------------------------
// the cells after Appropriation/FY: Approved, Authorized, Obligated, Unobligated, Obl %, OSD Goal %, Delta (pp), Status
// mark: '', '†' or '‡' (SP.authMark); on a TOTAL also '†‡'
function ex_figCells(r, mark) {
  const st = r.status && EXS.tStatus[r.status] ? r.status : null;
  return [ex_cell(ex_M(r.approved), EXS.tM), ex_cell(ex_M(r.authorized), EXS.tMMark[mark] || EXS.tM),
    ex_cell(ex_M(r.obligated), EXS.tM), ex_cell(ex_M(r.unobligated), EXS.tM), ex_cell(ex_num(r.oblPct), EXS.tPct),
    ex_cell(ex_num(r.goal), EXS.tGoal), ex_cell(ex_num(r.delta), EXS.tDelta),
    st ? { v: ex_statusWord(st), s: EXS.tStatus[st] } : { s: EXS.tBlank }];
}
// a TOTAL row: the sums and their Obl %; no goal, delta or status (§8.1)
function ex_totCells(t, mark) {
  return [ex_cell(ex_M(t.approved), EXS.totM), ex_cell(ex_M(t.authorized), EXS.totMMark[mark] || EXS.totM),
    ex_cell(ex_M(t.obligated), EXS.totM), ex_cell(ex_M(t.unobligated), EXS.totM), ex_cell(ex_num(t.oblPct), EXS.totP),
    { s: EXS.totBlank }, { s: EXS.totBlank }, { s: EXS.totBlank }];
}
// rows grouped by appropriation, the label merged down its rows. rows: [{apLabel, fy, figures…, mark}]. -> the last row
function ex_apFyRows(K, rows) {
  let r0 = 0, prev = null, last = 0;
  rows.forEach((x, j) => {
    const startsGroup = x.apLabel !== prev;
    const cells = [startsGroup ? { v: x.apLabel, s: EXS.tApLab } : { s: EXS.tApLab }, { v: x.fy, s: EXS.tFy }].concat(ex_figCells(x, x.mark));
    last = ex_push(K, cells);
    if (startsGroup) { if (prev !== null && last - 1 > r0) K.sh.merges.push(ex_rng(r0, 0, last - 1, 0)); r0 = last; prev = x.apLabel; }
  });
  if (prev !== null && last > r0) K.sh.merges.push(ex_rng(r0, 0, last, 0));
  return last;
}
// a TOTAL's mark: each mark its rows carry
function ex_totMark(am) { return (am.dag ? '†' : '') + (am.ddag ? '‡' : ''); }
// a line per mark used, saying what it means (SP.AUTH_MARK_TEXT, the words the screen uses)
function ex_markLines(K, am) {
  for (const m of ['†', '‡']) {
    if (!(m === '†' ? am.dag : am.ddag)) continue;
    const r = ex_push(K, [{ v: m, s: EXS.lineB }, { v: SP.AUTH_MARK_TEXT[m], s: EXS.text }, { s: EXS.text }, { s: EXS.text }]);
    K.sh.merges.push(ex_rng(r, 1, r, 3));
  }
}
const EX_FIG_HEADS = ['Approved ($M)', 'Authorized ($M)', 'Obligated ($M)', 'Unobligated ($M)', 'Obl %', 'OSD Goal %', 'Delta (pp)', 'Status'];

// ---------------------------------------------------------------------------------------------------------------
// §8.1 SUMMARY
// ---------------------------------------------------------------------------------------------------------------
function ex_summary(M) {
  const K = ex_sheet('Summary', [22.059, 7.934, 16.008, 16.008, 16.008, 16.008, 11.027, 13.047, 13.047, 13.047], { freeze: 'A5' });
  const E2 = ex_pad2(((M.E % 100) + 100) % 100), q = Math.ceil(M.asOfIndex / 3);
  ex_title(K, 'F-35 Sustainment Financial Execution - Top-Line Snapshot (FY' + E2 + 'Q' + q + ')');
  ex_subLine(K, 'Data through ' + M.asOfLabel + ' | Approved = total planned ($M from the CCaR pull) | Authorized = entered, else Approved'
    + ' | Obligated = CCaR status "Actual Execution" | Unobligated = Approved - Obligated | Delta = Obl% - OSD%');
  ex_shownLine(K, M);
  ex_headRow(K, ['Appropriation', 'FY'].concat(EX_FIG_HEADS), 30.75);
  ex_apFyRows(K, M.summary.rows.map(b => Object.assign({}, b, { mark: SP.authMark(b, M) })));
  const am = SP.authMarks(M.summary.rows, M);
  ex_push(K, [{ v: 'TOTAL - Sustainment', s: EXS.totLab }, { s: EXS.totBlank }].concat(ex_totCells(M.summary.total, ex_totMark(am))));
  ex_blank(K);
  ex_push(K, [{ v: 'Legend (OSD Status):', s: EXS.h11 }]);
  for (const g of SP.STATUS_LEGEND) {
    const r = ex_push(K, [{ v: g.word, s: EXS.tStatus[g.status] }, { v: g.colour + ' — ' + g.meaning, s: EXS.text }, { s: EXS.text }, { s: EXS.text }]);
    K.sh.merges.push(ex_rng(r, 1, r, 3));
  }
  ex_markLines(K, am);
  if (M.summary.notes.length) {
    ex_blank(K);
    ex_push(K, [{ v: 'Notes:', s: EXS.h11 }]);
    for (const n of M.summary.notes) ex_span(K, n, EXS.text, 0, K.W - 1, { ht: ex_ht(ex_lines(n, ex_widthOf(K, 0, K.W - 1), 10), 10) });
  }
  return K.sh;
}

// ---------------------------------------------------------------------------------------------------------------
// §8.2 SLIDE SNAPSHOTS: each block from its bar through OSD Status is the picture region
// ---------------------------------------------------------------------------------------------------------------
function ex_slides(M) {
  const K = ex_blockSheet('Slide Snapshots', M);
  ex_title(K, 'Slide Snapshots - picture-ready blocks for PowerPoint');
  ex_subLine(K, 'Each block is sized for a 13.33 in x 4.5 in slide region. In the dashboard, Slide blocks > Copy picture or Save'
    + ' pictures makes the picture; or select a block here from its title through OSD Status and use Copy as Picture.');
  ex_shownLine(K, M);
  ex_blank(K);
  for (const b of M.blocks) {
    ex_bar(K, b.apLabel + ' FY' + b.fy + ' - Spend Plan (PMO Summary, slide-ready)', EXS.barSlide, 25.5);
    ex_blockHead(K, M, 'PMO');
    for (const p of b.pmoRows) {
      ex_moneyRow(K, p.label, EXS.treeLab[0], p.cols, p.total, EXS.treeCell[0], EXS.treeTot[0],
        { ht: ex_ht(ex_lines(p.label, K.widths[0], 11), 11) });
    }
    ex_blank(K);
    ex_band(K, M, b);
    ex_na(K, M, b.na);
    ex_blank(K); ex_blank(K);
  }
  return K.sh;
}

// ---------------------------------------------------------------------------------------------------------------
// §8.3–§8.5 ONE SHEET PER APPROPRIATION: the FY table, then each FY's full tree
// ---------------------------------------------------------------------------------------------------------------
function ex_apSheet(M, a, pulls) {
  const K = ex_blockSheet(a.label, M, { outlineAbove: true });
  const p = pulls && pulls[a.ap];
  const when = ex_localDate(p && p.importedAt);
  ex_title(K, 'F-35 Sustainment ' + a.label + ' - Spend Plan & FY Summary (from the CCaR pull imported ' + (when || 'on an unknown date') + ')');
  ex_shownLine(K, M);
  ex_headRow(K, ['FY'].concat(EX_FIG_HEADS), 30);
  for (const b of a.blocks) ex_push(K, [{ v: b.fy, s: EXS.tFy }].concat(ex_figCells(b, SP.authMark(b, M))));
  const am = SP.authMarks(a.blocks, M);
  const tr = ex_push(K, [{ v: 'Total - All FYs', s: EXS.totLab }].concat(ex_totCells(a.total, ex_totMark(am))));
  K.sh.freeze = 'A' + (tr + 1);
  // ‡ is said under the table it marks: this sheet has no Summary notes beside it (review R3)
  if (am.ddag) ex_markLines(K, { ddag: true });
  ex_blank(K);
  for (const b of a.blocks) {
    ex_bar(K, 'FY' + b.fy + ' - Spend Plan by PMO / Title / Plan Event / CCaR  (1/2/3/4 in left margin)', EXS.barAp, 21.75);
    ex_blockHead(K, M, 'PMO / Title / Plan Event / CCaR');
    ex_tree(K, b.tree, 1);
    ex_blank(K);
    ex_band(K, M, b);
    ex_na(K, M, b.na);
    ex_blank(K); ex_blank(K);
  }
  return K.sh;
}

// ---------------------------------------------------------------------------------------------------------------
// §8.6 ONE TAB PER PMO, across appropriations (Full Fund, Initial Spares, O&M, OPN, as v12 ordered them)
// ---------------------------------------------------------------------------------------------------------------
function ex_pmoSheet(M, p) {
  const K = ex_blockSheet('PMO ' + p.code, M, { outlineAbove: true });
  ex_title(K, 'PMO: ' + p.label + ' - Sustainment Spend Plan (Cross-Appropriation Detail)');
  ex_shownLine(K, M);
  ex_headRow(K, ['Appropriation', 'FY'].concat(EX_FIG_HEADS), 30);
  ex_apFyRows(K, p.rows.map(r => Object.assign({}, r, { mark: '' })));
  const tr = ex_push(K, [{ v: 'Total - All', s: EXS.totLab }, { s: EXS.totBlank }].concat(ex_totCells(p.total, '')));
  K.sh.freeze = 'A' + (tr + 1);
  ex_span(K, 'Authorized is entered by appropriation and FY; a PMO row shows Approved.', EXS.note, 0, 9);
  ex_blank(K);
  for (const b of p.blocks) {
    ex_bar(K, b.apLabel + ' - FY' + b.fy, EXS.barPmo, 21.75);
    ex_blockHead(K, M, 'PMO / Title / Plan Event / CCaR');
    ex_span(K, b.apLabel + ' FY' + b.fy + ' Summary  |  Approved ' + SP.fmtMText(b.approved) + 'M  |  Authorized ' + SP.fmtMText(b.authorized)
      + 'M  |  Obligated ' + SP.fmtMText(b.obligated) + 'M  |  Unobligated ' + SP.fmtMText(b.unobligated) + 'M', EXS.strip, 0, K.W - 1, { ht: 21.75 });
    ex_tree(K, b.tree, 0);
    ex_blank(K);
    ex_band(K, M, b);
    ex_na(K, M, b.na);
    ex_blank(K); ex_blank(K);
  }
  return K.sh;
}

// ---------------------------------------------------------------------------------------------------------------
// §8.7 THE OTHER SHEETS
// ---------------------------------------------------------------------------------------------------------------
function ex_naSheet(M) {
  const K = ex_sheet('Not Allocated', [16, 7.934, 11.027, 60, 22, 18, 32, 48, 13.047]);
  ex_title(K, 'Not Allocated - every item, by appropriation and FY (largest first within each month)');
  ex_shownLine(K, M);
  const hr = ex_headRow(K, ['Appropriation', 'FY', 'Column', 'Item', 'Status', 'CCaR(s)', 'PMO(s)', 'Title(s)', '$M'], 24);
  K.sh.freeze = 'A' + (hr + 1);
  if (!M.naAll.length) { ex_span(K, 'No Not Allocated items.', EXS.text, 0, K.W - 1); return K.sh; }
  for (const it of M.naAll) {
    const col = M.cols[it.colIndex];
    ex_push(K, [{ v: it.apLabel, s: EXS.lText }, { v: it.fy, s: EXS.lFy }, { v: col ? col.label : it.col, s: EXS.lText },
      { v: String(it.label ?? ''), s: EXS.lText }, { v: String(it.statusLabel ?? ''), s: EXS.lText },
      { v: (it.ccars || []).join('; '), s: EXS.lText }, { v: (it.pmos || []).join('; '), s: EXS.lText },
      { v: (it.titles || []).join('; '), s: EXS.lText }, ex_cell(ex_M(it.cents), EXS.lM)]);
  }
  return K.sh;
}

// Why a row counts in no figure, by the first §4.3 condition it fails; 'Yes' when it counts.
function ex_counted(d, M, svcOn, laneOn) {
  if (d.bad || !Number.isInteger(d.fy) || !Number.isSafeInteger(d.cents)) {
    return 'No: could not be read (' + (d.bad && d.bad.length ? d.bad.join('; ') : 'FY or Amount') + ')';
  }
  if (d.fy < M.firstFY) return 'No: FY' + d.fy + ' is before the first FY shown (FY' + M.firstFY + ')';
  if (!svcOn.has(d.svc)) return 'No: service switched off (' + d.svc + ')';
  if (!laneOn.has(d.lane)) return 'No: lane switched off (' + (SP.LANE_WORDS[d.lane] || d.lane) + ')';
  return 'Yes';
}
// every row of one appropriation's pull, in pull order: the 32, the extra columns, then what the tool made of it
function ex_rawSheet(M, a, p, settings) {
  const extras = Array.isArray(p.headers) ? p.headers.slice(SP.RAW_HEADERS.length) : [];
  if (!Array.isArray(p.headers)) {
    const seen = new Set();
    for (const row of p.rows) if (row && row.x) for (const k of Object.keys(row.x)) if (!seen.has(k)) { seen.add(k); extras.push(k); }
  }
  const heads = SP.RAW_HEADERS.concat(extras, ['Service', 'Lane', 'Status', 'Counted']);
  const widths = EX_RAW_W.concat(extras.map(() => 16), [18, 13.99, 24, 40]);
  const K = ex_sheet(a.rawSheet, widths, { freeze: 'A2' });
  delete K.sh.grid;   // a data sheet keeps its gridlines, as v12's raw tabs did
  ex_push(K, heads.map(t => ({ v: t, s: EXS.rHead })), { ht: 21.75 });
  const svcOn = new Set(M.shown.services), laneOn = new Set(M.shown.lanes);
  const nx = extras.length;
  for (const row of p.rows) {
    if (!row || !Array.isArray(row.c)) continue;
    const c = row.c, raw = row.raw || {}, cells = new Array(heads.length);
    for (let k = 0; k < 32; k++) {
      const v = c[k];
      if (k === 0) cells[k] = typeof v === 'number' ? { v, s: EXS.rNum } : ex_own(raw, 'FY') ? { v: String(raw.FY), s: EXS.rBad } : { s: EXS.rText };
      else if (k === 1 || k === 8) {
        const h = SP.RAW_HEADERS[k];
        if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) cells[k] = { v: { date: v }, s: k === 1 ? EXS.rMonth : EXS.rDate };
        else if (ex_own(raw, h)) cells[k] = { v: String(raw[h]), s: EXS.rBad };
        else cells[k] = { s: EXS.rText };
      } else if (k === 9) {
        // whole dollars as a number with cents, as v12's raw tabs held them; an unreadable amount keeps the text it had
        cells[k] = typeof v === 'number' ? { v: v / 100, s: EXS.rAmt } : ex_own(raw, 'Amount') ? { v: String(raw.Amount), s: EXS.rBad } : { s: EXS.rText };
      } else cells[k] = v === null || v === undefined || v === '' ? { s: EXS.rText } : { v: String(v), s: EXS.rText };
    }
    for (let j = 0; j < nx; j++) {
      const v = row.x && ex_own(row.x, extras[j]) ? row.x[extras[j]] : '';
      cells[32 + j] = v === '' || v === null || v === undefined ? { s: EXS.rText } : { v: String(v), s: EXS.rText };
    }
    const d = SP.deriveRow(row, settings);
    cells[32 + nx] = { v: d.svc, s: EXS.rText };
    cells[33 + nx] = { v: SP.LANE_WORDS[d.lane] || d.lane, s: EXS.rText };
    cells[34 + nx] = { v: d.statusLabel || d.status, s: EXS.rText };
    cells[35 + nx] = { v: ex_counted(d, M, svcOn, laneOn), s: EXS.rText };
    ex_push(K, cells);
  }
  return K.sh;
}

function ex_reportSheet(M, pulls, meta) {
  const K = ex_sheet('Import Report', [180]);
  ex_title(K, 'Import Report');
  ex_push(K, [{ v: 'The pulls in this workbook:', s: EXS.lineB }]);
  for (const a of SP.APS) {
    const p = pulls && pulls[a.id];
    if (!p || !Array.isArray(p.rows)) continue;
    const files = (p.files || []).map(f => '“' + f.name + '”' + (f.sheets && f.sheets.length ? ' › ' + f.sheets.map(s => '“' + s + '”').join(', ') : '')).join('; ');
    ex_push(K, [{ v: '  ' + a.label + ': ' + SP.fmtInt(p.rows.length) + (p.rows.length === 1 ? ' row' : ' rows') + ', imported '
      + (ex_localDate(p.importedAt) || 'on an unknown date') + (files ? ', from ' + files : '') + '.', s: EXS.line }]);
  }
  const un = pulls && pulls.unidentified;
  if (un && Array.isArray(un.rows) && un.rows.length) {
    ex_push(K, [{ v: '  Appropriation not identified: ' + SP.fmtInt(un.rows.length) + (un.rows.length === 1 ? ' row' : ' rows')
      + ', counted nowhere.', s: EXS.line }]);
  }
  ex_blank(K);
  const rep = meta && meta.report;
  if (!rep) { ex_push(K, [{ v: 'No import report is held for the last import.', s: EXS.line }]); return K.sh; }
  ex_push(K, [{ v: 'The last import:', s: EXS.lineB }]);
  for (const line of SP.importReportLines(rep)) ex_push(K, [{ v: line, s: EXS.line }]);
  return K.sh;
}

function ex_settingsSheet(M, pulls, settings) {
  const s = settings && typeof settings === 'object' ? settings : {};
  const widths = [60].concat(new Array(13).fill(11.027));
  const K = ex_sheet('Settings', widths);
  ex_title(K, 'Settings used for this workbook');
  const kv = (k, v, sv) => ex_push(K, [{ v: k, s: EXS.lineB }, ex_cell(v, sv || EXS.line)]);
  kv('Data through', M.asOfLabel + ' (' + M.asOf + ')');
  kv('Execution year', 'FY' + M.E + ': ' + M.window.start + ' up to ' + M.window.end);
  kv('First FY shown', M.firstFY, EXS.line);
  ex_blank(K);
  // not "every figure": an entered Authorized and the notes on rows not counted cover every service and lane (review R3)
  ex_push(K, [{ v: 'Switches (this browser’s view; every figure counts only what is shown, except an entered Authorized and the Summary’s notes on rows not counted,'
    + ' which cover every service and lane)', s: EXS.h11 }]);
  const shownS = new Set(M.shown.services), shownL = new Set(M.shown.lanes);
  for (const sv of SP.SERVICES.concat([SP.SVC_UNKNOWN])) kv(sv, shownS.has(sv) ? 'Shown' : 'Hidden');
  for (const l of ['disc', 'mand']) kv(SP.LANE_WORDS[l] + ' lane', shownL.has(l) ? 'Shown' : 'Hidden');
  kv('In words', M.shown.text);
  ex_blank(K);
  ex_push(K, [{ v: 'OSD goal curves', s: EXS.h11 }]);
  ex_headRow(K, ['Curve', 'Prior Yr'].concat(SP.MONTHS));
  for (const [key, name] of EX_CURVES) {
    const g = s.goals && Array.isArray(s.goals[key]) && s.goals[key].length === 13 ? s.goals[key] : SP.GOALS_DEFAULT[key];
    ex_push(K, [{ v: name + ' (' + key + ')', s: EXS.lText }].concat(g.map(x => ex_cell(ex_num(x), EXS.lPct))));
  }
  ex_blank(K);
  ex_push(K, [{ v: 'Authorized entered ($M)', s: EXS.h11 }]);
  const auth = s.authorized && typeof s.authorized === 'object' ? Object.keys(s.authorized).filter(k => Number.isSafeInteger(s.authorized[k])) : [];
  if (!auth.length) ex_push(K, [{ v: 'None entered: Approved is shown in its place.', s: EXS.line }]);
  else {
    ex_headRow(K, ['Appropriation | FY', '$M']);
    auth.sort();
    for (const k of auth) {
      const [ap, fy] = k.split('|'), a = SP.APS.find(x => x.id === ap);
      ex_push(K, [{ v: (a ? a.label : ap) + ' FY' + fy, s: EXS.lText }, ex_cell(ex_M(s.authorized[k]), EXS.lM)]);
    }
  }
  ex_blank(K);
  ex_push(K, [{ v: 'Special CCaRs (a Not Allocated item under one of these is named by its Title)', s: EXS.h11 }]);
  const sp = Array.isArray(s.special) ? s.special : SP.SPECIAL_CCARS_DEFAULT;
  if (!sp.length) ex_push(K, [{ v: 'None.', s: EXS.line }]);
  for (const x of sp) ex_push(K, [{ v: String(x ?? ''), s: EXS.line }]);
  ex_blank(K);
  ex_push(K, [{ v: 'Budgets (every Budget name in the pulls)', s: EXS.h11 }]);
  ex_headRow(K, ['Name', 'Rows', '$M', 'Service', 'Lane', 'Override']);
  const bt = SP.budgetTable ? SP.budgetTable(pulls || {}, s) : [];
  for (const b of bt) {
    const ov = b.override ? [b.override.svc ? 'Service: ' + b.override.svc : '', b.override.lane ? 'Lane: ' + SP.LANE_WORDS[b.override.lane] : '']
      .filter(Boolean).join('; ') : '';
    ex_push(K, [{ v: b.name === '' ? '(blank)' : String(b.name), s: EXS.lText }, { v: b.rows, s: EXS.lFy }, ex_cell(ex_M(b.cents), EXS.lM),
      { v: b.svc + (b.unknown ? '  (no rule names a service: check this name)' : ''), s: EXS.lText },
      { v: SP.LANE_WORDS[b.lane] || b.lane, s: EXS.lText }, { v: ov, s: EXS.lText }]);
  }
  return K.sh;
}

// ---------------------------------------------------------------------------------------------------------------
// THE WORKBOOK
// ---------------------------------------------------------------------------------------------------------------
// every sheet of §8, in §8's order: Summary, Slide Snapshots, each appropriation, each PMO, Not Allocated, the raw data
// of each appropriation with a pull, the Import Report and the Settings
SP.excelSpec = function excelSpec(model, pulls, settings, meta) {
  const M = model;
  if (!M || !Array.isArray(M.blocks)) throw new Error('The workbook needs a model; there is none to write.');
  pulls = pulls && typeof pulls === 'object' ? pulls : {};
  const sheets = [ex_summary(M), ex_slides(M)];
  for (const a of M.aps) sheets.push(ex_apSheet(M, a, pulls));
  for (const p of M.pmos) sheets.push(ex_pmoSheet(M, p));
  sheets.push(ex_naSheet(M));
  for (const a of SP.APS) {
    const p = pulls[a.id];
    if (p && Array.isArray(p.rows)) sheets.push(ex_rawSheet(M, a, p, settings));
  }
  sheets.push(ex_reportSheet(M, pulls, meta || {}));
  sheets.push(ex_settingsSheet(M, pulls, settings));
  return { creator: 'SFCB Spend Plan', sheets };
};
SP.excelBytes = async function excelBytes(model, pulls, settings, meta) {
  return SP.writeXlsx(SP.excelSpec(model, pulls, settings, meta));
};
// 'SFCB Spend Plan FY2027 - data through Oct-2026 - 2026-11-09.xlsx', and ' [filtered]' before the extension when the
// switches hide anything: a filtered workbook emailed on must say so in the one place everyone reads, its name
SP.excelFileName = function excelFileName(model, today) {
  const day = typeof today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(today) ? today : ex_today();
  return 'SFCB Spend Plan FY' + model.E + ' - data through ' + model.asOfLabel + ' - ' + day
    + (model.shown && model.shown.all ? '' : ' [filtered]') + '.xlsx';
};

// The UI action: the model from the saved state and this browser's switches, the workbook, the download, and a sentence
// saying what was written. A failure is said, never thrown past the button.
SP.exportExcel = async function exportExcel() {
  try {
    const st = SP.state && typeof SP.state === 'object' ? SP.state : null;
    const pulls = st && st.pulls && st.pulls.current && typeof st.pulls.current === 'object' ? st.pulls.current : {};
    if (!SP.APS.some(a => pulls[a.id] && Array.isArray(pulls[a.id].rows))) {
      return { ok: false, message: 'There is nothing to export yet: import a CCaR pull first.' };
    }
    const today = ex_today();
    const settings = st.settings && typeof st.settings === 'object' ? st.settings : SP.defaultSettings(today);
    let view = null;
    if (typeof SP.getView === 'function') { try { view = SP.getView(); } catch (e) { view = null; } }
    if (!view || typeof view !== 'object') view = SP.defaultView();
    const model = SP.buildModel(pulls, settings, view);
    const bytes = await SP.excelBytes(model, pulls, settings, { report: st.lastImport && st.lastImport.report, today });
    const name = SP.excelFileName(model, today);
    SP.download(name, bytes, EX_MIME);
    const N = SP.lastXlsxNotes || { sheets: 0, messages: [] };
    let msg = 'Wrote “' + name + '”: ' + N.sheets + ' sheets, ' + SP.fmtInt(Math.round(bytes.length / 1024)) + ' KB.';
    if (!model.shown.all) msg += ' It is filtered: ' + model.shown.text + '.';
    if (N.messages && N.messages.length) msg += ' ' + N.messages.join(' ');
    return { ok: true, message: msg, name, sheets: N.sheets, size: bytes.length };
  } catch (e) {
    return { ok: false, message: 'The workbook was not written: ' + ((e && e.message) || String(e)) };
  }
};
