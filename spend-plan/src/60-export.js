// §8 EXPORT — the Excel workbook (CONTRACT §8).
//
//   await SP.excelBytes(model, pulls, settings, meta)  -> Uint8Array, the workbook
//   SP.excelSpec(model, pulls, settings, meta)         -> the spec SP.writeXlsx is given (what the tests read before bytes)
//   SP.excelFileName(model, today)                     -> 'SFCB Spend Plan FY2027 - data through Oct-2026 - 2026-11-09.xlsx'
//   await SP.exportExcel()                             -> {ok, message, name}: the UI action (build, download, say what)
//
//   meta = {report?: the last import's report, today?: 'YYYY-MM-DD' (the date in the file name; this browser's today),
//           bae?: the BAE report the model was built with (SP.state.bae.current), whose rows the BAE Report sheet prints}
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
// appropriation and FY as a whole, while some switch is off or with a BAE report loaded (SP.authMark); a TOTAL carries
// each mark its rows do. A format, not text, so the cell is still the number (anyone summing the column gets the right
// total) and the mark shows.
// § is on an APPROVED figure, with a BAE report loaded only (§14.5, SP.approvedMark): the report has no figure for that
// block, so its Approved is the CCaR plan while the rows around it are the report's.
function ex_markFmt(mark) { return '#,##0.00"' + mark + '";(#,##0.00)"' + mark + '";-"' + mark + '"'; }
const EX_MARKS = ['†', '‡', '†‡', '§'];
const EX_FP = '0.00%', EX_FD = '+0.00%;-0.00%;0.00%', EX_FUSD = '#,##0.00', EX_FYF = '"FY"0';
// §2: "nothing non-zero reads as zero". #,##0.00 shows a non-zero amount under $5,000 as 0.00 or (0.00), where the screens
// and the pictures print fmtM's '<0.01' for the same figure (review XP-6). Such a cell keeps its number and takes this
// format instead, marked as its column is (ex_mc).
function ex_tinyFmt(mark) { return mark ? '"<0.01' + mark + '";"(<0.01)' + mark + '";-"' + mark + '"' : '"<0.01";"(<0.01)";-'; }
// A literal '&' in a header is an Excel code; SP.CUI has none, and doubling keeps it so if the marking ever gains one.
const EX_CUI = String(SP.CUI).replace(/&/g, '&&');
const EX_HEADER = '&C&"Calibri,Bold"' + EX_CUI;
const EX_FOOTER = '&C&"Calibri,Bold"' + EX_CUI + '&RPage &P of &N';
const EX_PAGE = Object.freeze({ orientation: 'landscape', paper: 'letter', fitWidth: 1, fitHeight: 0 });
const EX_PAGE_DATA = Object.freeze({ orientation: 'landscape', paper: 'letter' });
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
  // titles and lines under them. v12's sheet title (style 58) is 16 pt bold navy TEXT with no fill: the white-on-navy
  // look belongs to the block bars and the TOTAL row, and a title drawn as a bar was the plainest difference from v12 on
  // every sheet (review XP-4). Its subtitles (styles 65, 68) are 11 pt italic grey, centred.
  X.title = ex_s(f({ b: true, sz: 16, color: EX_NAVY }), null, null, f({ h: 'center', v: 'center' }));
  X.sub = ex_s(f({ i: true, sz: 11, color: EX_SUB }), null, null, f({ h: 'center', v: 'center', wrap: true }));
  X.shown = ex_s(f({ b: true, sz: 10, color: EX_NAVY }), null, null, f({ h: 'left', v: 'center', indent: 1 }));
  // the CUI marking inside a slide block's picture range, centred over the block as the picture's own bands are
  X.cui = ex_s(f({ b: true, sz: 10, color: '000000' }), null, null, f({ h: 'center', v: 'center' }));
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
  // v12 centres its money and its outline labels vertically; at the bottom (the default) a figure beside a wrapped label
  // sat a line or two below it (review XP-5)
  const right = f({ h: 'right', v: 'center' });
  X.treeLab = fonts.map((fo, k) => ex_s(fo, null, null, f(indent[k] ? { h: 'left', v: 'center', wrap: true, indent: indent[k] } : { h: 'left', v: 'center', wrap: true }), EX_THIN));
  // [kind][closed 0|1]: a month cell; treeTot[kind]: a Total cell (bold below the Title, as v12 printed them)
  X.treeCell = fonts.map(fo => [ex_s(fo, null, EX_FM, right, EX_THIN), ex_s(fo, EX_CLOSED, EX_FM, right, EX_THIN)]);
  X.treeTot = bold.map(fo => ex_s(fo, null, EX_FM, right, EX_THIN));
  X.treeSz = [11, 10, 10, 9];
  X.treeIndent = indent;
  // the totals band
  const bf = f({ b: true, sz: 10, color: EX_NAVY }), center = f({ h: 'center', v: 'center' });
  X.bandLab = ex_s(bf, null, null, f({ h: 'right', v: 'center', indent: 1 }), EX_THIN);
  // the Obligation % label when it needs two lines: right-aligned text past the first column has nowhere to run, so it is cut
  X.bandLabW = ex_s(bf, null, null, f({ h: 'right', v: 'center', indent: 1, wrap: true }), EX_THIN);
  X.bandM = [ex_s(bf, null, EX_FM, right, EX_THIN), ex_s(bf, EX_CLOSED, EX_FM, right, EX_THIN)];
  X.bandP = [ex_s(bf, null, EX_FP, center, EX_THIN), ex_s(bf, EX_CLOSED, EX_FP, center, EX_THIN)];
  // plan cells of Obligation % and Status are italic and grey: a planned percentage is not an obligation
  const planF = f({ b: true, i: true, sz: 10, color: EX_PLAN });
  X.bandPlan = ex_s(planF, null, EX_FP, center, EX_THIN);
  X.bandStatus = {};
  // a PLAN status keeps its fill and its readable ink, and is italic: grey on the red or green fill measured about
  // 1.5:1 and could not be read on a slide. Grey stays on the Obligation % plan cells, which have no fill (CONTRACT §8,
  // where the ruling now stands, review XP-10; the same in the screens and the pictures).
  for (const st of ['green', 'yellow', 'red']) {
    X.bandStatus[st] = [ex_s(f({ b: true, sz: 10, color: EX_STATUS_INK[st] }), EX_STATUS_FILL[st], null, center, EX_THIN),
      ex_s(f({ b: true, i: true, sz: 10, color: EX_STATUS_INK[st] }), EX_STATUS_FILL[st], null, center, EX_THIN)];
  }
  // No status (no goal, or the No date column) has no fill of its own, only the closed months' grey, as the goal cells
  // above it and the screens draw it. It was v12's base fill for the row, FFE699, a word-less near-yellow beside the
  // FFD700 of "Within 10" that read as a status by colour alone; v12 never showed one, because its FY27+ column, the only
  // one with no goal, was hidden (review S9).
  // the FY tables at the top of the Summary, appropriation and PMO sheets
  const t10 = f({ sz: 10, color: EX_INK }), b10 = f({ b: true, sz: 10, color: EX_INK });
  X.tApLab = ex_s(f({ b: true, sz: 11, color: EX_NAVY }), null, null, f({ h: 'left', v: 'center', wrap: true, indent: 1 }), EX_THIN);
  // The FY is a number, shown as v12 wrote it, FY2025, so it still sorts and filters as one (review XP-5). On an
  // appropriation sheet's own table it is the row's label, as v12's is: 11 pt bold navy.
  X.tFy = ex_s(t10, null, EX_FYF, center, EX_THIN);
  X.tFyAp = ex_s(f({ b: true, sz: 11, color: EX_NAVY }), null, EX_FYF, center, EX_THIN);
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
  // v12's labels: TOTAL - Sustainment on the Summary left-aligned; Total - All FYs and Total - All centred (review XP-5)
  X.totLab = ex_s(tw, EX_NAVY, null, f({ h: 'left', v: 'center', wrap: true }), EX_THIN);
  X.totLabC = ex_s(tw, EX_NAVY, null, f({ h: 'center', v: 'center', wrap: true }), EX_THIN);
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
  X.lFyY = ex_s(t10, null, EX_FYF, f({ h: 'center', v: 'top' }), EX_THIN);
  X.lM = ex_s(t10, null, EX_FM, f({ h: 'right', v: 'top' }), EX_THIN);
  // the Settings sheet's Used column, marked as the screen marks it (§14.6, review P4-7): a format, as on every FY table
  X.lMMark = Object.fromEntries(EX_MARKS.map(m => [m, ex_s(t10, null, ex_markFmt(m), f({ h: 'right', v: 'top' }), EX_THIN)]));
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
// a money cell: cents as $M, in style s, or in s's '<0.01' twin when the amount is non-zero and under $5,000 (fmtM's rule)
const ex_tinyOf = new Map();
function ex_mc(c, s) {
  const v = ex_M(c);
  if (v === null || !s || c === 0 || Math.abs(c) >= 500000) return ex_cell(v, s);
  let t = ex_tinyOf.get(s);
  if (!t) {
    const mark = EX_MARKS.find(m => s.fmt === ex_markFmt(m)) || '';
    t = Object.freeze(Object.assign({}, s, { fmt: ex_tinyFmt(mark) }));
    ex_tinyOf.set(s, t);
  }
  return ex_cell(v, t);
}
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
// an import time -> 'YYYY-MM-DD HH:MM' in this computer's time, as the Import Report writes every import's time
function ex_localWhen(iso) {
  const t = typeof iso === 'string' ? Date.parse(iso) : NaN;
  if (isNaN(t)) return '';
  const d = new Date(t);
  return ex_today(d) + ' ' + ex_pad2(d.getHours()) + ':' + ex_pad2(d.getMinutes());
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
// a BAE report of budgets is loaded (§14): only then does any product print a §, the report's words or its sheet
function ex_hasBae(M) { return !!(M && M.bae && M.bae.present); }

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
  return ex_span(K, text, EXS.sub, 0, K.W - 1, { ht: ex_ht(ex_lines(text, ex_widthOf(K, 0, K.W - 1), 11), 11) });
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
  const cells = [{ v: label, s: labS }, ex_mc(total, totS)];
  for (const i of K.dc) cells.push(ex_mc(cols[i], cellS[K.closed[i] ? 1 : 0]));
  cells.push(ex_mc(total, totS));
  return ex_push(K, cells, opts);
}
// The tree, PMO -> Title -> Plan Event -> CCaR. `base` is the outline level of the PMO row: 0 on every sheet, as v12 had
// it (CONTRACT §8.5, §8.6), so Excel draws the four outline buttons each bar names and button 4 opens the CCaRs. With the
// PMO at level 1 the appropriation sheets had five, and their button 4 stopped at Plan Event (review XP-1). Plan Event and
// CCaR rows are hidden, so a sheet opens at PMO and Title.
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
// Approved, then its Obl %, goal and status, the figures the Summary row prints (§4.5). With a BAE report loaded they
// carry the CCaR PLAN's headline instead (§14.3, rule 6: a band measures the plan by month, and its months add to the
// plan, never to a report's Approved), read through SP.plannedOf and SP.slideOf; with none the two are the same figures.
function ex_band(K, M, b) {
  const L = EXS.bandLab;
  const plan = SP.plannedOf(b), sl = SP.slideOf(b);
  ex_moneyRow(K, 'Monthly Totals', L, b.cols, plan, EXS.bandM, EXS.bandM[0]);
  // Cumulative's Total is the whole block, as v12's was: No date is outside the running sum, never outside the total
  ex_moneyRow(K, 'Cumulative Totals', L, b.cum, plan, EXS.bandM, EXS.bandM[0]);
  const pct = ex_num(sl.oblPct), goal = ex_num(sl.goal);
  // the label in the words the screen and the picture use (SP.oblLabel, review R7)
  // A label longer than its column wraps in a row as tall as its lines: right-aligned in the first column, the overflow
  // has no cell to run into and Excel cuts it. "actual through the 2026-10-05 import" (review BP-3) beside an Approved over
  // $10,000M is wider than the 70-wide column.
  const lab = SP.oblLabel(b, M), labLines = ex_lines(lab, K.widths[0], 10, 1);
  const obl = [{ v: lab, s: labLines > 1 ? EXS.bandLabW : L },
    ex_cell(pct, EXS.bandP[0])];
  for (const i of K.dc) {
    const o = b.obl[i] || {};
    obl.push(ex_cell(ex_num(o.v), o.kind === 'plan' ? EXS.bandPlan : EXS.bandP[K.closed[i] ? 1 : 0]));
  }
  obl.push(ex_cell(pct, EXS.bandP[0]));
  ex_push(K, obl, { ht: ex_ht(labLines, 10) });
  const g = [{ v: 'OSD Goal %', s: L }, ex_cell(goal, EXS.bandP[0])];
  for (const i of K.dc) g.push(ex_cell(ex_num(b.goalC[i]), EXS.bandP[K.closed[i] ? 1 : 0]));
  g.push(ex_cell(goal, EXS.bandP[0]));
  ex_push(K, g);
  const sc = (status, plan, closed) => {
    if (!status || !EXS.bandStatus[status]) return ex_cell(null, EXS.bandP[closed ? 1 : 0]);
    return ex_cell(ex_statusWord(status), EXS.bandStatus[status][plan ? 1 : 0]);
  };
  const s = [{ v: 'OSD Status', s: L }, sc(sl.status, false, false)];
  for (const i of K.dc) { const x = b.statusC[i] || {}; s.push(sc(x.status, x.kind === 'plan', !!K.closed[i])); }
  s.push(sc(sl.status, false, false));
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
// mark: '', '†' or '‡' (SP.authMark) on Authorized; on a TOTAL also '†‡'. amark: '' or '§' (SP.approvedMark) on Approved,
// only ever '§' with a BAE report loaded
function ex_figCells(r, mark, amark) {
  const st = r.status && EXS.tStatus[r.status] ? r.status : null;
  return [ex_mc(r.approved, EXS.tMMark[amark] || EXS.tM), ex_mc(r.authorized, EXS.tMMark[mark] || EXS.tM),
    ex_mc(r.obligated, EXS.tM), ex_mc(r.unobligated, EXS.tM), ex_cell(ex_num(r.oblPct), EXS.tPct),
    // a delta within SP.DELTA_ZERO of zero is written 0, as the screen prints it '0.00%': the format chooses its section by
    // the sign, so a -1e-13 left by a division showed '-0.00%' beside On track (review M5)
    ex_cell(ex_num(r.goal), EXS.tGoal), ex_cell(SP.deltaShown(r.delta), EXS.tDelta),
    st ? { v: ex_statusWord(st), s: EXS.tStatus[st] } : { s: EXS.tBlank }];
}
// a TOTAL row: the sums and their Obl %; no goal, delta or status (§8.1). amark '§' when a row it adds carries it.
function ex_totCells(t, mark, amark) {
  return [ex_mc(t.approved, EXS.totMMark[amark] || EXS.totM), ex_mc(t.authorized, EXS.totMMark[mark] || EXS.totM),
    ex_mc(t.obligated, EXS.totM), ex_mc(t.unobligated, EXS.totM), ex_cell(ex_num(t.oblPct), EXS.totP),
    { s: EXS.totBlank }, { s: EXS.totBlank }, { s: EXS.totBlank }];
}
// rows grouped by appropriation, the label merged down its rows. rows: [{apLabel, fy, figures…, mark, amark}]. -> the
// last row
function ex_apFyRows(K, rows) {
  let r0 = 0, prev = null, last = 0;
  rows.forEach((x, j) => {
    const startsGroup = x.apLabel !== prev;
    const cells = [startsGroup ? { v: x.apLabel, s: EXS.tApLab } : { s: EXS.tApLab }, { v: x.fy, s: EXS.tFy }].concat(ex_figCells(x, x.mark, x.amark));
    last = ex_push(K, cells);
    if (startsGroup) { if (prev !== null && last - 1 > r0) K.sh.merges.push(ex_rng(r0, 0, last - 1, 0)); r0 = last; prev = x.apLabel; }
  });
  if (prev !== null && last > r0) K.sh.merges.push(ex_rng(r0, 0, last, 0));
  return last;
}
// a TOTAL's mark: each mark its rows carry (on Authorized), and § (on Approved) when a row carries it
function ex_totMark(am) { return (am.dag ? '†' : '') + (am.ddag ? '‡' : ''); }
function ex_totAMark(am) { return am.sect ? '§' : ''; }
// a line per mark used, saying what it means (SP.markText: the words the screen uses, which with a BAE report loaded say
// what † means then, §14.5). § first, as Approved is the column before Authorized. Each row is as tall as its words need
// across B:D: Excel never fits a row's height to a merged cell, so with no height the row stayed one line and showed
// "Authorized as entered, for the appropriation and", hiding the half of ‡ that says why (review XP2-1). LibreOffice
// sizes such a row itself, which is why its PDF never showed it.
function ex_markLines(K, am, M) {
  for (const m of ['§', '†', '‡']) {
    if (!(m === '§' ? am.sect : m === '†' ? am.dag : am.ddag)) continue;
    const text = SP.markText(m, M);
    const r = ex_push(K, [{ v: m, s: EXS.lineB }, { v: text, s: EXS.text }, { s: EXS.text }, { s: EXS.text }],
      { ht: ex_ht(ex_lines(text, ex_widthOf(K, 1, 3), 10), 10) });
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
  // line 2 in the one wording the screen prints (SP.summaryLine2): §8.1's, or with a BAE report §14.5's
  ex_subLine(K, SP.summaryLine2(M));
  ex_shownLine(K, M);
  ex_headRow(K, ['Appropriation', 'FY'].concat(EX_FIG_HEADS), 30.75);
  ex_apFyRows(K, M.summary.rows.map(b => Object.assign({}, b, { mark: SP.authMark(b, M), amark: SP.approvedMark(b, M) })));
  const am = SP.authMarks(M.summary.rows, M);
  ex_push(K, [{ v: 'TOTAL - Sustainment', s: EXS.totLab }, { s: EXS.totBlank }].concat(ex_totCells(M.summary.total, ex_totMark(am), ex_totAMark(am))));
  ex_blank(K);
  ex_push(K, [{ v: 'Legend (OSD Status):', s: EXS.h11 }]);
  for (const g of SP.STATUS_LEGEND) {
    const r = ex_push(K, [{ v: g.word, s: EXS.tStatus[g.status] }, { v: g.colour + ' — ' + g.meaning, s: EXS.text }, { s: EXS.text }, { s: EXS.text }]);
    K.sh.merges.push(ex_rng(r, 1, r, 3));
  }
  ex_markLines(K, am, M);
  if (M.summary.notes.length) {
    ex_blank(K);
    ex_push(K, [{ v: 'Notes:', s: EXS.h11 }]);
    for (const n of M.summary.notes) ex_span(K, n, EXS.text, 0, K.W - 1, { ht: ex_ht(ex_lines(n, ex_widthOf(K, 0, K.W - 1), 10), 10) });
  }
  return K.sh;
}

// ---------------------------------------------------------------------------------------------------------------
// §8.2 SLIDE SNAPSHOTS: each block from the CUI line above its bar through the CUI line under OSD Status is the
// picture region
// ---------------------------------------------------------------------------------------------------------------
// Line 2. It said "Each block is sized for a 13.33 in x 4.5 in slide region", which v12 said and was never so: a block
// here is about 19 x 3.4 in (5.7 : 1, review XP-3), a 70-wide label column and the money columns. The dashboard's
// pictures are drawn to that region; a block copied from this sheet is not, and the line says so.
const EX_SLIDES_HOW = 'The dashboard’s pictures fit a 13.33 in x 4.5 in slide region and are marked CUI: Slide blocks > Copy picture'
  + ' or Save pictures. To copy a block from this sheet instead, select it from the CUI line above its title through the CUI line'
  + ' under OSD Status and use Copy as Picture; it is wider for its height than that region, so size it by its width.';
function ex_slides(M) {
  const K = ex_blockSheet('Slide Snapshots', M);
  ex_title(K, 'Slide Snapshots - picture-ready blocks for PowerPoint');
  ex_subLine(K, EX_SLIDES_HOW);
  ex_shownLine(K, M);
  // rule 6 with a BAE report loaded: the blocks below add up the plan while the Summary's Approved is the report's. The
  // Slide blocks view said so and this sheet did not (review P4-6); one sentence, SP.SLIDES_PLAN_NOTE, for both
  if (ex_hasBae(M)) ex_span(K, SP.SLIDES_PLAN_NOTE, EXS.note, 0, K.W - 1, { ht: ex_ht(ex_lines(SP.SLIDES_PLAN_NOTE, ex_widthOf(K, 0, K.W - 1), 10), 10) });
  ex_blank(K);
  // Printed, each block after the first starts a page. The sheet fits one page wide and pages broke wherever one filled,
  // so a block printed for a meeting came out in two halves, its PMO rows on one page and Obligation % and OSD Status on
  // the next, under no month headings (review XP2-6). A block is about 3.4 in tall at full size and half that fitted, so
  // one always fits a page; its Not Allocated lines may run on, and the next block still starts a page of its own.
  const breaks = [];
  for (const b of M.blocks) {
    // The marking and the filter go INSIDE the range line 2 tells people to copy. A range picture takes the cells and
    // nothing else: the sheet's CUI header and footer, and its line 3, never reach the slide, so a block copied as v12
    // laid it out was an unmarked CUI picture, and on a filtered workbook one that did not say services were hidden
    // (review XP-2). The dashboard's own pictures carry both, top and bottom; so does this range.
    const top = ex_span(K, SP.CUI, EXS.cui, 0, K.W - 1);
    if (b !== M.blocks[0]) breaks.push(top);
    if (!M.shown.all) ex_shownLine(K, M);
    ex_bar(K, b.apLabel + ' FY' + b.fy + ' - Spend Plan (PMO Summary, slide-ready)', EXS.barSlide, 25.5);
    ex_blockHead(K, M, 'PMO');
    for (const p of b.pmoRows) {
      ex_moneyRow(K, p.label, EXS.treeLab[0], p.cols, p.total, EXS.treeCell[0], EXS.treeTot[0],
        { ht: ex_ht(ex_lines(p.label, K.widths[0], 11), 11) });
    }
    ex_blank(K);
    ex_band(K, M, b);
    ex_span(K, SP.CUI, EXS.cui, 0, K.W - 1);
    ex_na(K, M, b.na);
    ex_blank(K); ex_blank(K);
  }
  if (breaks.length) K.sh.breaks = breaks;
  return K.sh;
}

// ---------------------------------------------------------------------------------------------------------------
// §8.3–§8.5 ONE SHEET PER APPROPRIATION: the FY table, then each FY's full tree
// ---------------------------------------------------------------------------------------------------------------
function ex_apSheet(M, a, pulls) {
  const K = ex_blockSheet(a.label, M, { outlineAbove: true });
  const p = pulls && pulls[a.ap];
  const when = ex_localDate(p && p.importedAt);
  // the title says where the figures come from (SP.apTitle, the screen's words): with a BAE report loaded, its Approved and
  // Authorized are the report's wherever it covers a block (§14.3), so "from the CCaR pull" alone would not be true of them
  ex_title(K, SP.apTitle(a.label, when, M, true));
  ex_shownLine(K, M);
  ex_headRow(K, ['FY'].concat(EX_FIG_HEADS), 30);
  for (const b of a.blocks) ex_push(K, [{ v: b.fy, s: EXS.tFyAp }].concat(ex_figCells(b, SP.authMark(b, M), SP.approvedMark(b, M))));
  const am = SP.authMarks(a.blocks, M);
  const tr = ex_push(K, [{ v: 'Total - All FYs', s: EXS.totLabC }].concat(ex_totCells(a.total, ex_totMark(am), ex_totAMark(am))));
  K.sh.freeze = 'A' + (tr + 1);
  // each mark is said under the table it marks: this sheet has no Summary notes beside it (review R3). † too: on the
  // normal workbook, nothing entered, every Authorized here carried a † that only the Summary explained, so this sheet
  // printed or sent on its own carried a mark with no key (review XP2-4)
  ex_markLines(K, am, M);
  ex_blank(K);
  for (const b of a.blocks) {
    ex_bar(K, 'FY' + b.fy + ' - Spend Plan by PMO / Title / Plan Event / CCaR  (1/2/3/4 in left margin)', EXS.barAp, 21.75);
    ex_blockHead(K, M, 'PMO / Title / Plan Event / CCaR');
    ex_tree(K, b.tree, 0);
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
  const bae = ex_hasBae(M);
  if (!bae) {
    // with no BAE report a PMO row never carries a mark: its Authorized is Approved, and the note under the table says so
    ex_apFyRows(K, p.rows.map(r => Object.assign({}, r, { mark: '' })));
    const tr = ex_push(K, [{ v: 'Total - All', s: EXS.totLabC }, { s: EXS.totBlank }].concat(ex_totCells(p.total, '')));
    K.sh.freeze = 'A' + (tr + 1);
    ex_span(K, 'Authorized is entered by appropriation and FY; a PMO row shows Approved.', EXS.note, 0, 9);
  } else {
    // §14.4 with a BAE report: a row the report covers is the budgets' figures and carries no mark; a row it does not
    // cover is §4.6's, its Approved the plan (§) and its Authorized that Approved (†), marked as the screen marks them
    ex_apFyRows(K, p.rows.map(r => Object.assign({}, r, { mark: SP.authMark(r, M), amark: SP.approvedMark(r, M) })));
    const am = SP.authMarks(p.rows, M);
    const tr = ex_push(K, [{ v: 'Total - All', s: EXS.totLabC }, { s: EXS.totBlank }].concat(ex_totCells(p.total, ex_totMark(am), ex_totAMark(am))));
    K.sh.freeze = 'A' + (tr + 1);
    ex_markLines(K, am, M);
    // what the figures count, that a typed Authorized is never split among the PMOs, and, where a row is §4.6's, the
    // no-report note said of those rows only (SP.pmoTabLines: the screen's lines, word for word and in the same order)
    const notes = SP.pmoTabLines(p, M);
    for (const n of notes) ex_span(K, n, EXS.note, 0, 9, { ht: ex_ht(ex_lines(n, ex_widthOf(K, 0, 9), 10), 10) });
  }
  ex_blank(K);
  for (const b of p.blocks) {
    ex_bar(K, b.apLabel + ' - FY' + b.fy, EXS.barPmo, 21.75);
    ex_blockHead(K, M, 'PMO / Title / Plan Event / CCaR');
    // the strip is the table's row for this block (§14.4), so it carries that row's marks; none with no report. One
    // wording with the screen's (SP.pmoStrip), which printed the figures and not the marks (review M4-5, P4-5)
    ex_span(K, SP.pmoStrip(b, M), EXS.strip, 0, K.W - 1, { ht: 21.75 });
    ex_tree(K, b.tree, 0);
    ex_blank(K);
    ex_band(K, M, b);
    ex_na(K, M, b.na);
    ex_blank(K); ex_blank(K);
  }
  return K.sh;
}

// v12's PMO tabs run AV, BOP, CDS, MxS, PP, PSM, TSS: Propulsion before Product Support, though a block's PMO rows put
// PSM first (SP.PMO_ORDER, §4.4). The tabs keep v12's order (review XP-5); any other PMO follows in the model's order (by
// label, '(no PMO)' last).
const EX_PMO_TABS = ['AV', 'BOP', 'CDS', 'MxS', 'PP', 'PSM', 'TSS']
  .map(code => SP.normKey(SP.PMO_ORDER.find(n => n.endsWith('(' + code + ')')) || ''));
function ex_pmoTabs(pmos) {
  const rank = p => { const i = EX_PMO_TABS.indexOf(SP.normKey(p.label)); return i < 0 ? EX_PMO_TABS.length : i; };
  return pmos.map((p, j) => [p, j]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(x => x[0]);
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
    ex_push(K, [{ v: it.apLabel, s: EXS.lText }, { v: it.fy, s: EXS.lFyY }, { v: col ? col.label : it.col, s: EXS.lText },
      { v: String(it.label ?? ''), s: EXS.lText }, { v: String(it.statusLabel ?? ''), s: EXS.lText },
      { v: (it.ccars || []).join('; '), s: EXS.lText }, { v: (it.pmos || []).join('; '), s: EXS.lText },
      { v: (it.titles || []).join('; '), s: EXS.lText }, ex_mc(it.cents, EXS.lM)]);
  }
  return K.sh;
}

// Why a row counts in no figure, by the first §4.3 condition it fails; 'Yes' when it counts.
function ex_counted(d, M, svcOn, laneOn) {
  if (d.bad || !Number.isInteger(d.fy) || !Number.isSafeInteger(d.cents)) {
    return 'No: could not be read (' + (d.bad && d.bad.length ? d.bad.join('; ') : 'FY or Amount') + ')';
  }
  if (d.fy < M.firstFY) return 'No: FY' + d.fy + ' is before the first FY shown (FY' + M.firstFY + ')';
  // §15.2 condition 4, after condition 3: a FY2025 OBBBA row under a later First FY is before the First FY
  if (SP.isObbba25(d.budget, d.fy)) return 'No: ' + SP.OBBBA_WHY;
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
  // A data sheet prints at full size across pages, as v12's raw tabs had no fit: 36 columns are about 44 in wide, and
  // fitted to one page wide they printed at 23%, 10 pt text at 2.3 pt (review XP-11). The reports fit one page wide.
  const K = ex_sheet(a.rawSheet, widths, { freeze: 'A2', page: EX_PAGE_DATA });
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

// ---------------------------------------------------------------------------------------------------------------
// §14.6 THE BAE REPORT SHEET: every row of the report in file order, every column as the file has it, then what the tool
// made of each row (CONTRACT §14.6). It is to the report what a raw data sheet is to a pull: the one place every row of
// it can be found, counted or not, with the reason.
// ---------------------------------------------------------------------------------------------------------------
const EX_BAE_TAIL = ['Appropriation', 'Service', 'Lane', 'PMO', 'Counted'];
// the report's own total row is a row of the report too: written where the file has it, never counted (§14.1)
const EX_BAE_TOTAL_WHY = 'No: the report’s own total row, never counted (the Import Report checks it against the rows)';
function ex_baeSheet(M, bae) {
  if (!bae || !Array.isArray(bae.rows)) {
    throw new Error('its figures were worked out from a BAE report, but the report itself was not given to the workbook, so its sheet cannot be written.');
  }
  const rows = bae.rows;
  const der = M.bae && Array.isArray(M.bae.derived) ? M.bae.derived : [];
  // derived[i] is rows[i] as the model read it (SP.buildModel derives the report's rows in file order); a report other
  // than the model's would put one row's reading beside another row's figures, so it is refused rather than written
  if (der.length !== rows.length) {
    throw new Error('the BAE report given to the workbook (' + SP.fmtInt(rows.length) + ' rows) is not the one its figures were worked out from ('
      + SP.fmtInt(der.length) + ' rows).');
  }
  // the four columns read, by the names the report gives them (SP.baeCols: found among its headers when a report saved by
  // hand or another version does not record them, review I4-7). Without them every row's four values went unwritten; a
  // name none of the headers has is added after them below, so the four are always written
  const cols = (typeof SP.baeCols === 'function' ? SP.baeCols(bae) : Array.isArray(bae.cols) ? bae.cols : []).map(h => String(h ?? ''));
  // every column the file has, in its order (bae.headers); the four read are always among them, and a column a row
  // holds that the list lacks (a report saved by another version) is added after, so no value goes unwritten
  const heads = Array.isArray(bae.headers) ? bae.headers.map(h => String(h ?? '')) : [];
  const seen = new Set(heads);
  const add = h => { if (!seen.has(h)) { seen.add(h); heads.push(h); } };
  for (const h of cols) add(h);
  const tr = bae.total && typeof bae.total === 'object' ? bae.total : null;
  for (const r of rows.concat(tr ? [tr] : [])) if (r && r.x && typeof r.x === 'object') for (const h of Object.keys(r.x)) add(h);
  const nh = heads.length;
  const widths = heads.map(h => { const k = cols.indexOf(h); return k === 0 ? 48 : k === 1 ? 9.95 : k >= 2 ? 18.02 : 14.93; })
    .concat([16.01, 18.02, 13.99, 32, 30]);
  const K = ex_sheet('BAE Report', widths, { freeze: 'A2', page: EX_PAGE_DATA });
  delete K.sh.grid;   // a data sheet keeps its gridlines, as the raw data sheets do
  ex_push(K, heads.concat(EX_BAE_TAIL).map(t => ({ v: t, s: EXS.rHead })), { ht: 21.75 });
  // one row's cells across the file's columns. c: [name, fy, approvedCents, authorizedCents] (null where it could not be
  // read); raw: the text as written for a value that could not be read, red so it is not mistaken for a figure; x: every
  // other column, the text as the file held it
  const fileCells = (c, raw, x) => heads.map(h => {
    const k = cols.indexOf(h);
    const rawText = raw && typeof raw === 'object' && ex_own(raw, h) ? { v: String(raw[h]), s: EXS.rBad } : null;
    if (k === 0) { const v = c[0]; return typeof v === 'string' && v !== '' ? { v, s: EXS.rText } : rawText || { s: EXS.rText }; }
    if (k === 1) return Number.isInteger(c[1]) ? { v: c[1], s: EXS.rNum } : rawText || { s: EXS.rText };
    if (k === 2 || k === 3) return Number.isSafeInteger(c[k]) ? { v: c[k] / 100, s: EXS.rAmt } : rawText || { s: EXS.rText };
    const v = x && typeof x === 'object' && ex_own(x, h) ? x[h] : '';
    return v === '' || v === null || v === undefined ? { s: EXS.rText } : { v: String(v), s: EXS.rText };
  });
  const txt = v => (v === '' || v === null || v === undefined ? { s: EXS.rText } : { v: String(v), s: EXS.rText });
  const tot = () => {
    const c = ['', null, Number.isSafeInteger(tr.approved) ? tr.approved : null, Number.isSafeInteger(tr.authorized) ? tr.authorized : null];
    const cells = fileCells(c, tr.raw, tr.x);
    cells.push(txt(''), txt(''), txt(''), txt(''), txt(EX_BAE_TOTAL_WHY));
    ex_push(K, cells);
  };
  let totDone = !tr;
  rows.forEach((row, i) => {
    const d = der[i], rn = d && Number.isInteger(d.rowNo) ? d.rowNo : null;
    if (!totDone && rn !== null && Number.isInteger(tr.rowNo) && rn > tr.rowNo) { tot(); totDone = true; }
    const c = row && Array.isArray(row.c) ? row.c : [];
    const cells = fileCells(c, row && row.raw, row && row.x);
    cells.push(txt(d.apLabel), txt(d.svc), txt(SP.LANE_WORDS[d.lane] || d.lane), txt(d.pmoLabel), txt(d.why));
    ex_push(K, cells);
  });
  if (!totDone) tot();
  if (!nh) ex_span(K, 'The BAE report holds no columns.', EXS.text, 0, K.W - 1);
  return K.sh;
}

// §14.6 the Import Report's BAE section as the MODEL reads the report: each row by what it is, the sustainment budgets'
// money by appropriation and FY, the blocks whose CCaR plan is under half the report's Approved (rule 5: flagged, never
// hidden), the budgets the pull counts with no report row and the report's sustainment budgets with money and no pull
// row. The import's own part (file, sheet, date, rows read and skipped, conversions, unreadable rows, the total row's
// check) is SP.importReportLines' and SP.baeKeptLines'. Dollars are exact (SP.fmtUsd), as the import's lines are, so the
// two can be read against each other. [] with no report. Exported, so a screen can print the same lines.
SP.baeModelLines = function baeModelLines(M) {
  const X = M && M.bae && M.bae.present ? M.bae : null;
  if (!X) return [];
  const L = [];
  const rw = n => SP.fmtInt(n) + (n === 1 ? ' row' : ' rows');
  const apL = ap => { const a = SP.APS.find(x => x.id === ap); return a ? a.label : String(ap); };
  const q = s => '“' + String(s ?? '') + '”';
  const r = X.rows || {};
  // The planShort blocks, the pull's budgets with no report row and the money a covered block's Approved leaves out are
  // worked out on the blocks as the switches leave them (§14.8), beside lines that cover every service and lane. Said on
  // each such line when the switches hide something: with USN off the two OPN flags vanished from this sheet and O&M FY2028
  // took their place, under nothing that said a switch had moved them (review P4-4, §4.3).
  const sw = M.shown && !M.shown.all ? ', with the switches as they are (' + M.shown.text + ')' : '';
  L.push('The BAE report of budgets ' + X.of + (X.file ? ' (' + q(X.file) + ')' : '') + ', as the figures read it:');
  // §15.3: FY2025 OBBBA funding is a kind of its own, said only when such a row is loaded (r.obbba is there only then)
  L.push('  Rows by what they are (every FY, whatever the switches show): ' + rw(r.in || 0) + ' of sustainment budgets (their names place '
    + 'them in O&M, Full Fund, Initial Spares or OPN); counted nowhere, ' + rw(r.flyaway || 0) + ' of Full Fund Flyaway (aircraft production), '
    + rw(r.noap || 0) + ' naming no appropriation' + ('obbba' in r ? ', ' + rw(r.obbba) + ' of ' + SP.OBBBA_WHY : '') + ' and ' + rw(r.bad || 0) + ' that could not be read.');
  const bb = X.byBlock && typeof X.byBlock === 'object' ? Object.keys(X.byBlock) : [];
  L.push('  The sustainment budgets’ Approved and Authorized by appropriation and FY (every FY, every service and lane, whatever the switches show):'
    + (bb.length ? '' : ' none.'));
  for (const k of bb) {
    const v = X.byBlock[k], i = k.indexOf('|');
    // §15.4 an (ap, fy) whose only pull rows are FY2025 OBBBA funding: the words the view's table says of it
    const ob = SP.isObbbaNoBlock(M, k);
    L.push('    ' + apL(k.slice(0, i)) + ' FY' + k.slice(i + 1) + ': Approved ' + SP.fmtUsd(v.approved) + ', Authorized ' + SP.fmtUsd(v.authorized)
      + (ob ? '; ' + SP.OBBBA_NOBLOCK_WHERE : '') + '.');
  }
  const ps = Array.isArray(X.planShort) ? X.planShort : [];
  L.push('  Blocks whose CCaR plan is under half the BAE report’s Approved (flagged, never hidden: Obl % is measured against the report’s figure)' + sw + ': '
    + (ps.length ? SP.fmtInt(ps.length) + '.' : 'none.'));
  for (const b of ps) {
    L.push('    ' + apL(b.ap) + ' FY' + b.fy + ': the CCaR plan ' + SP.fmtUsd(b.planned) + ' is ' + SP.planShortPct(b.planned, b.approved)
      + ' of the report’s Approved ' + SP.fmtUsd(b.approved) + '.');
  }
  const po = Array.isArray(X.pullOnlyNames) ? X.pullOnlyNames : [];
  L.push('  Budgets the CCaR pull counts that have no row in the BAE report' + sw + ': ' + (po.length ? SP.fmtInt(po.length) + '.' : 'none.'));
  for (const n of po) L.push('    ' + q(n));
  const ro = Array.isArray(X.reportOnlyNames) ? X.reportOnlyNames : [];
  L.push('  Sustainment budgets the BAE report holds money for, FY' + M.firstFY + ' to FY' + M.E + ', that no CCaR pull row names (every service and lane, '
    + 'whatever the switches show): ' + (ro.length ? SP.fmtInt(ro.length) + '.' : 'none.'));
  for (const n of ro) L.push('    ' + q(n));
  // review M4-6: money a covered block's plan and Obligated count that its Approved never can (the screen's list, in its order)
  const off = Array.isArray(X.offReport) ? X.offReport : [];
  const items = off.flatMap(o => (Array.isArray(o.budgets) ? o.budgets : []).map(t => ({ o, t })));
  L.push('  Budgets the CCaR pull counts on a block the BAE report covers, which its Approved leaves out (Flyaway (production), a budget that names '
    + 'no appropriation, or a row with no Budget: the plan and Obligated count them, Approved never can)' + sw + ': ' + (items.length ? SP.fmtInt(items.length) + '.' : 'none.'));
  for (const { o, t } of items) {
    L.push('    ' + apL(o.ap) + ' FY' + o.fy + ': ' + (t.name === '' ? '(no Budget, ' + rw(t.rows) + ')' : q(t.name)) + ' (' + (SP.OFF_REPORT_KIND[t.kind] || t.kind)
      + '): CCaR plan ' + SP.fmtUsd(t.planned) + ', obligated ' + SP.fmtUsd(t.obligated) + '.');
  }
  return L;
};

function ex_reportSheet(M, pulls, meta) {
  const K = ex_sheet('Import Report', [180]);
  ex_title(K, 'Import Report');
  ex_push(K, [{ v: ex_hasBae(M) ? 'The pulls and the BAE report of budgets in this workbook:' : 'The pulls in this workbook:', s: EXS.lineB }]);
  for (const a of SP.APS) {
    const p = pulls && pulls[a.id];
    if (!p || !Array.isArray(p.rows)) continue;
    const files = (p.files || []).map(f => '“' + f.name + '”' + (f.sheets && f.sheets.length ? ' › ' + f.sheets.map(s => '“' + s + '”').join(', ') : '')).join('; ');
    ex_push(K, [{ v: '  ' + a.label + ': ' + SP.fmtInt(p.rows.length) + (p.rows.length === 1 ? ' row' : ' rows') + ', imported '
      + (ex_localDate(p.importedAt) || 'on an unknown date') + (files ? ', from ' + files : '') + '.', s: EXS.line }]);
  }
  // §14.6 the BAE report of budgets, beside the pulls, when one is loaded
  const bae = ex_hasBae(M) ? M.bae : null;
  if (bae) {
    ex_push(K, [{ v: '  BAE report of budgets: “' + bae.file + '” › “' + bae.sheet + '”, ' + (bae.stamp ? 'dated ' + bae.stamp + ' by its file name'
      : 'with no date in its file name') + ', imported ' + (ex_localWhen(bae.importedAt) || 'at a time not recorded') + '.', s: EXS.line }]);
  }
  const un = pulls && pulls.unidentified;
  if (un && Array.isArray(un.rows) && un.rows.length) {
    ex_push(K, [{ v: '  Appropriation not identified: ' + SP.fmtInt(un.rows.length) + (un.rows.length === 1 ? ' row' : ' rows')
      + ', counted nowhere.', s: EXS.line }]);
  }
  // each such row, named: they are on no raw sheet, and the Summary sends the reader here for them (review XP-8)
  const unl = typeof SP.unidentifiedLines === 'function' ? SP.unidentifiedLines(pulls) : [];
  if (unl.length) {
    ex_blank(K);
    for (const line of unl) ex_push(K, [{ v: line, s: line.startsWith(' ') ? EXS.line : EXS.lineB }]);
  }
  ex_blank(K);
  const rep = meta && meta.report;
  if (!rep) ex_push(K, [{ v: 'No import report is held for the last import.', s: EXS.line }]);
  else {
    ex_push(K, [{ v: 'The last import:', s: EXS.lineB }]);
    for (const line of SP.importReportLines(rep)) ex_push(K, [{ v: line, s: EXS.line }]);
  }
  // the pulls the last import did not replace, listed from their own rows: the Summary's notes count their unreadable
  // rows, and the last import's report alone said "none" (review IMP-2)
  const kept = typeof SP.keptPullLines === 'function' ? SP.keptPullLines(pulls, rep || null) : [];
  if (kept.length) {
    ex_blank(K);
    ex_push(K, [{ v: 'Pulls in this workbook from earlier imports (' + (rep ? 'the last import did not replace them' : 'no report is held for them')
      + '); what each holds that counts nowhere:', s: EXS.lineB }]);
    for (const line of kept) ex_push(K, [{ v: line, s: EXS.line }]);
  }
  // §15.4 FY2025 OBBBA funding, left out: the view's section, line for line (SP.obbbaLines), when any is loaded
  const obl = SP.obbbaLines(M);
  if (obl.length) {
    ex_blank(K);
    ex_push(K, [{ v: SP.OBBBA_HEAD, s: EXS.lineB }]);
    for (const line of obl) ex_push(K, [{ v: '  ' + line, s: EXS.line }]);
  }
  if (bae) {
    // the report on screen when the last import did not bring it: its own section, from its stored rows (SP.baeKeptLines),
    // or its unreadable rows and its total row's check would be listed nowhere in this workbook
    const kb = typeof SP.baeKeptLines === 'function' ? SP.baeKeptLines(meta && meta.bae, rep || null) : [];
    if (kb.length) {
      ex_blank(K);
      for (const line of kb) ex_push(K, [{ v: line, s: EXS.line }]);
    }
    ex_blank(K);
    SP.baeModelLines(M).forEach((line, i) => ex_push(K, [{ v: line, s: i ? EXS.line : EXS.lineB }]));
  }
  return K.sh;
}

// The seventh switch's line when it has no box (§9): no row that would count has no service. That is not "no such
// rows": rows with no service can sit before the first FY, or fail to read, and the raw data sheets list them with
// Service "Service not identified". With First FY 2027 the Settings sheet said "No such rows" beside a raw sheet naming
// two (review SEAM-9). They are counted here by the reason the raw sheets' Counted column gives (ex_counted), with every
// switch on, because no switch can reach them.
function ex_noSwitchLine(M, pulls, settings) {
  const allSvc = new Set(SP.SERVICES.concat([SP.SVC_UNKNOWN])), allLane = new Set(['disc', 'mand']);
  let before = 0, unread = 0, unid = 0, obbba = 0;
  const each = (rows, f) => { for (const row of Array.isArray(rows) ? rows : []) if (row && Array.isArray(row.c)) f(SP.deriveRow(row, settings)); };
  for (const a of SP.APS) {
    each(pulls && pulls[a.id] && pulls[a.id].rows, d => {
      if (d.svc !== SP.SVC_UNKNOWN) return;
      const why = ex_counted(d, M, allSvc, allLane);
      if (/^No: could not be read/.test(why)) unread++;
      else if (why === 'No: ' + SP.OBBBA_WHY) obbba++;          // §15.2: left out by its own rule, not before the First FY
      else if (why !== 'Yes') before++;
    });
  }
  each(pulls && pulls.unidentified && pulls.unidentified.rows, d => { if (d.svc === SP.SVC_UNKNOWN) unid++; });
  // §14.2: a BAE report's rows have a service by the same rules, and one with none that could count makes the switch
  // exist (SP.buildModel); with no switch, every such row of the report counts nowhere, and the BAE Report sheet says why
  const baeRows = ex_hasBae(M) && Array.isArray(M.bae.derived) ? M.bae.derived.filter(d => d.svc === SP.SVC_UNKNOWN).length : 0;
  const n = before + unread + unid + baeRows + obbba;
  if (!n) return 'No such rows (no switch)';
  const rw = k => SP.fmtInt(k) + (k === 1 ? ' row' : ' rows');
  const parts = [];
  if (before) parts.push(rw(before) + ' before the first FY shown (FY' + M.firstFY + ')');
  if (obbba) parts.push(rw(obbba) + ' of ' + SP.OBBBA_WHY);
  if (unread) parts.push(rw(unread) + ' that could not be read');
  if (unid) parts.push(rw(unid) + ' whose appropriation was not identified (see the Import Report)');
  if (baeRows) parts.push(rw(baeRows) + ' of the BAE report (each with its reason in the Counted column of the BAE Report sheet)');
  return 'No switch: no row that counts has no service. ' + (n === 1 ? 'The 1 row' : 'The ' + SP.fmtInt(n) + ' rows') + ' with no service '
    + (n === 1 ? 'counts' : 'count') + ' nowhere: ' + parts.join('; ') + '.';
}
// §14.6 the Settings sheet with a BAE report loaded: the report (its file, date and import), then Authorized by block as
// Block, Typed, BAE report, Used, where Used is the figure every table prints. A typed figure is listed for an
// appropriation and FY the pull has no block for, too, so nothing typed goes unsaid.
//   auth: the keys of the typed figures; kv: the sheet's label | value row
function ex_settingsBae(K, M, s, auth, kv) {
  const X = M.bae;
  ex_push(K, [{ v: 'BAE report of budgets (Approved and Authorized come from it wherever it has figures for a block)', s: EXS.h11 }]);
  kv('File', X.file || '(not recorded)');
  kv('Sheet', X.sheet || '(not recorded)');
  kv('Date', X.stamp ? X.stamp + ' (from its file name)' : 'None in its file name: it is known by the day it was imported');
  kv('Imported', X.importedAt ? (ex_localWhen(X.importedAt) || X.importedAt) + ' (this computer’s time)' : 'At a time not recorded');
  ex_blank(K);
  ex_push(K, [{ v: 'Authorized by block ($M): typed, in the BAE report, and the figure used', s: EXS.h11 }]);
  ex_headRow(K, ['Block', 'Typed', 'BAE report', 'Used']);
  const apL = ap => { const a = SP.APS.find(x => x.id === ap); return a ? a.label : ap; };
  const typed = new Set(auth);
  // Used carries the mark every table prints beside that Authorized (SP.authMark: ‡ typed, † Approved standing in), with a
  // line for each mark used under the table, as the Settings view draws it. It was a plain figure here under a note that
  // promised marks, while the screen marked it (review P4-7). No §: the table has no Approved column.
  const used = { dag: false, ddag: false };
  for (const b of M.blocks) {
    const k = b.ap + '|' + b.fy;
    typed.delete(k);
    const m = SP.authMark(b, M);
    if (m === '†') used.dag = true;
    if (m === '‡') used.ddag = true;
    ex_push(K, [{ v: b.apLabel + ' FY' + b.fy, s: EXS.lText }, ex_mc(auth.includes(k) ? s.authorized[k] : null, EXS.lM),
      typeof b.reportAuthorized === 'number' ? ex_mc(b.reportAuthorized, EXS.lM) : { v: 'No figure', s: EXS.lText }, ex_mc(b.authorized, EXS.lMMark[m] || EXS.lM)]);
  }
  // typed for an appropriation and FY with no block: kept in the file, used nowhere until the pull has a block for it
  for (const k of [...typed].sort()) {
    const [ap, fy] = k.split('|');
    ex_push(K, [{ v: apL(ap) + ' FY' + fy, s: EXS.lText }, ex_mc(s.authorized[k], EXS.lM), { s: EXS.lText }, { v: 'No block in the pull', s: EXS.lText }]);
  }
  for (const [m, on] of [['†', used.dag], ['‡', used.ddag]]) {
    if (!on) continue;
    const line = m + ' ' + SP.markText(m, M);
    ex_span(K, line, EXS.text, 0, 4, { ht: ex_ht(ex_lines(line, ex_widthOf(K, 0, 4), 10), 10) });
  }
  // what Used is, in the marks the column above prints: ‡ on every typed figure with a report loaded (§14.5, review I4-4),
  // † where Approved, the CCaR plan, stands in. It said "marked ‡ when the switches hide some" and "(marked † and §)",
  // neither of which this column ever printed (review P4-7).
  const note = 'Used is the typed figure where one is typed (marked ‡: it covers every service and lane, whatever the switches show), else the BAE report’s'
    + ' (which counts only what the switches show), else Approved, which is then the CCaR plan (marked †). Typing a figure on the Settings view sets it;'
    + ' clearing it goes back to the BAE report’s.';
  ex_span(K, note, EXS.text, 0, 4, { ht: ex_ht(ex_lines(note, ex_widthOf(K, 0, 4), 10), 10) });
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
  // §15.4 the fixed rule, under First FY, when a row it leaves out is loaded (the view says it in the same words)
  if (SP.obbbaLoaded(M)) ex_push(K, [{ v: SP.OBBBA_RULE, s: EXS.line }]);
  ex_blank(K);
  // not "every figure": an entered Authorized and the notes on rows not counted cover every service and lane (review R3);
  // with a BAE report, so do the notes and the Import Report's figures on the report as a whole (§14.5)
  ex_push(K, [{ v: 'Switches (this browser’s view; every figure counts only what is shown, except an entered Authorized and the Summary’s notes on rows not counted,'
    + (ex_hasBae(M) ? ' and what the Summary’s note and the Import Report say of the BAE report as a whole,' : '')
    + ' which cover every service and lane)', s: EXS.h11 }]);
  const shownS = new Set(M.shown.services), shownL = new Set(M.shown.lanes);
  // the seventh switch exists only on a plan with rows that have no service (§9); on any other it hides nothing, and the
  // line says so rather than "Hidden" for a switch this plan has no box for (review S2)
  const hasUnknown = Array.isArray(M.present && M.present.services) && M.present.services.includes(SP.SVC_UNKNOWN);
  for (const sv of SP.SERVICES.concat([SP.SVC_UNKNOWN])) {
    kv(sv, sv === SP.SVC_UNKNOWN && !hasUnknown ? ex_noSwitchLine(M, pulls, settings) : shownS.has(sv) ? 'Shown' : 'Hidden');
  }
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
  const auth = s.authorized && typeof s.authorized === 'object' ? Object.keys(s.authorized).filter(k => Number.isSafeInteger(s.authorized[k])) : [];
  // with a BAE report the Authorized table is Block, Typed, BAE report, Used (§14.6); with none, §8.7's typed entries
  if (ex_hasBae(M)) ex_settingsBae(K, M, s, auth, kv);
  else {
    ex_push(K, [{ v: 'Authorized entered ($M)', s: EXS.h11 }]);
    if (!auth.length) ex_push(K, [{ v: 'None entered: Approved is shown in its place.', s: EXS.line }]);
    else {
      ex_headRow(K, ['Appropriation | FY', '$M']);
      auth.sort();
      for (const k of auth) {
        const [ap, fy] = k.split('|'), a = SP.APS.find(x => x.id === ap);
        ex_push(K, [{ v: (a ? a.label : ap) + ' FY' + fy, s: EXS.lText }, ex_mc(s.authorized[k], EXS.lM)]);
      }
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
    ex_push(K, [{ v: b.name === '' ? '(blank)' : String(b.name), s: EXS.lText }, { v: b.rows, s: EXS.lFy }, ex_mc(b.cents, EXS.lM),
      { v: b.svc + (b.unknown ? '  (no rule names a service: check this name)' : ''), s: EXS.lText },
      { v: SP.LANE_WORDS[b.lane] || b.lane, s: EXS.lText }, { v: ov, s: EXS.lText }]);
  }
  return K.sh;
}

// ---------------------------------------------------------------------------------------------------------------
// THE WORKBOOK
// ---------------------------------------------------------------------------------------------------------------
// every sheet of §8, in §8's order: Summary, Slide Snapshots, each appropriation, each PMO, Not Allocated, the raw data
// of each appropriation with a pull, with a BAE report loaded the BAE Report (§14.6), the Import Report and the Settings.
// meta.bae is the report the model was built with (SP.state.bae.current): the model holds what each of its rows means,
// the report holds the rows themselves, and the BAE Report sheet prints the two side by side.
SP.excelSpec = function excelSpec(model, pulls, settings, meta) {
  const M = model;
  if (!M || !Array.isArray(M.blocks)) throw new Error('The workbook needs a model; there is none to write.');
  pulls = pulls && typeof pulls === 'object' ? pulls : {};
  const sheets = [ex_summary(M), ex_slides(M)];
  for (const a of M.aps) sheets.push(ex_apSheet(M, a, pulls));
  for (const p of ex_pmoTabs(M.pmos)) sheets.push(ex_pmoSheet(M, p));
  sheets.push(ex_naSheet(M));
  for (const a of SP.APS) {
    const p = pulls[a.id];
    if (p && Array.isArray(p.rows)) sheets.push(ex_rawSheet(M, a, p, settings));
  }
  if (ex_hasBae(M)) sheets.push(ex_baeSheet(M, meta && meta.bae));
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
    const bae = st && st.bae ? st.bae.current : null;
    const model = SP.buildModel(pulls, settings, view, bae);
    const bytes = await SP.excelBytes(model, pulls, settings, { report: st.lastImport && st.lastImport.report, today, bae });
    const name = SP.excelFileName(model, today);
    SP.download(name, bytes, EX_MIME);
    const N = SP.lastXlsxNotes || { sheets: 0, messages: [] };
    // where it went, as the pictures' messages say it: the browser's download, so its downloads folder unless it asks.
    // "Wrote …" alone left the place unsaid beside "Save all pictures", which named it (review BP-9).
    let msg = 'Wrote “' + name + '” (' + N.sheets + ' sheets, ' + SP.fmtInt(Math.round(bytes.length / 1024)) + ' KB) as a download: '
      + SP.DOWNLOAD_WHERE;
    if (!model.shown.all) msg += ' It is filtered: ' + model.shown.text + '.';
    if (N.messages && N.messages.length) msg += ' ' + N.messages.join(' ');
    return { ok: true, message: msg, name, sheets: N.sheets, size: bytes.length };
  } catch (e) {
    return { ok: false, message: 'The workbook was not written: ' + ((e && e.message) || String(e)) };
  }
};
