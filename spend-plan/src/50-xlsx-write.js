// §7 XLSX-WRITE — the .xlsx writer and the zip (CONTRACT §7).
//
//   await SP.writeXlsx(spec)   -> Uint8Array, a workbook Excel and LibreOffice open with no repair prompt
//   await SP.zipFiles(files)   -> Uint8Array, a zip of [{name, data}] (the slide pictures, §10)
//   SP.lastXlsxNotes           what the last writeXlsx changed on the way out, with counts and sentences
//
// Written after ORBIT's buildXlsx (prioritization-board-grid.html: buildXlsx, _stylesXml, _zipStore, _xesc, _colL), whose
// comments record the failures each rule prevents. This one adds row outline levels and hidden rows, summary-above
// outlines, hidden columns, a header and footer on any sheet, page setup, a tab colour and a style registry.
//
// A SPEC MISTAKE THROWS; A DATA VALUE NEVER DOES. The spec's shape (style keys, colours, levels, merges) is written by the
// export's code, so a typo there -- {font:{bold:true}} for {font:{b:true}} -- must be loud, not a workbook that quietly
// looks wrong. A value from a pull is never refused: a character XML cannot carry, a number that is not finite, a date
// that is not a date, a text too long for a cell are each written the nearest safe way and counted in SP.lastXlsxNotes,
// so the export can say what it did.

SP.lastXlsxNotes = null;

// ---------------------------------------------------------------------------------------------------------------
// TEXT
// ---------------------------------------------------------------------------------------------------------------
// XML 1.0 cannot carry C0 controls other than tab, line feed and carriage return, nor U+FFFE, U+FFFF or half of a
// surrogate pair. One of them in a part makes it not well-formed: LibreOffice then drops the rest of the sheet without a
// word, and Excel offers to "repair" it. Each becomes U+FFFD and is counted. The pair alternative comes first so a whole
// emoji is kept; there is deliberately no lookbehind, which an older browser cannot parse at all (the whole page would die).
const xw_BADQ = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF\uD800-\uDFFF]/;
const xw_BADG = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF\uD800-\uDFFF]/g;
function xw_clean(s, N) {
  if (!xw_BADQ.test(s)) return s;
  return s.replace(xw_BADG, m => (m.length === 2 ? m : (N.replaced++, '\uFFFD')));
}
// A spreadsheet reads _xHHHH_ in text as the one character it spells (LibreOffice shows "_x0041_" as "A"), so a title
// holding those seven characters would not say what the pull said. OOXML's own escape for an underscore that would begin
// one is _x005F_; with it the text reads back exactly as written.
function xw_unx(s) { return s.indexOf('_x') < 0 ? s : s.replace(/_(?=x[0-9A-Fa-f]{4}_)/g, '_x005F_'); }
// Element text. A carriage return goes as &#13;: an XML reader turns a raw CR (and CR LF) into a line feed before anything
// sees the text, so "a\rb" would read back as "a\nb" (ORBIT v2.01, D4-1). ">" is escaped too, which keeps "]]>" legal.
const xw_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\r': '&#13;', '\n': '&#10;', '\t': '&#9;' };
function xw_escT(s) { return /[&<>\r]/.test(s) ? s.replace(/[&<>\r]/g, c => xw_ESC[c]) : s; }
// Attribute text. Tab, LF and CR are written as references because attribute-value normalisation would turn them into spaces.
function xw_escA(s) { return /[&<>"\r\n\t]/.test(s) ? s.replace(/[&<>"\r\n\t]/g, c => xw_ESC[c]) : s; }
// any program-made text (a font name, a format code, a header): cleaned, escaped, the _x escape applied
function xw_txt(s, N) { return xw_escT(xw_unx(xw_clean(String(s), N))); }
function xw_att(s, N) { return xw_escA(xw_unx(xw_clean(String(s), N))); }
// Cut to n UTF-16 units without leaving half a surrogate pair at the end (which would itself be a forbidden character).
function xw_cutTo(s, n) {
  if (s.length <= n) return s;
  const c = s.charCodeAt(n - 1);
  return s.slice(0, c >= 0xD800 && c <= 0xDBFF ? n - 1 : n);
}
// Excel holds at most 32,767 characters in a cell; a longer string makes it refuse the part.
const xw_CELL_MAX = 32767;

// ---------------------------------------------------------------------------------------------------------------
// REFERENCES
// ---------------------------------------------------------------------------------------------------------------
const xw_MAXR = 1048576, xw_MAXC = 16384;
const xw_letters = [];
function xw_col(i) {   // zero-based column -> letters, memoised: every cell asks
  let s = xw_letters[i];
  if (s === undefined) {
    let n = i + 1; s = '';
    while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; }
    xw_letters[i] = s;
  }
  return s;
}
function xw_ref(ref, what) {   // 'B12' -> {c:1, r:11}; anything else is a spec mistake
  const m = /^([A-Za-z]{1,3})([1-9][0-9]{0,6})$/.exec(String(ref ?? '').trim());
  if (!m) throw new Error('writeXlsx: ' + what + ' "' + ref + '" is not a cell reference such as A5');
  let c = 0; const L = m[1].toUpperCase();
  for (let i = 0; i < L.length; i++) c = c * 26 + (L.charCodeAt(i) - 64);
  const r = +m[2];
  if (c > xw_MAXC || r > xw_MAXR) throw new Error('writeXlsx: ' + what + ' "' + ref + '" is outside a worksheet');
  return { c: c - 1, r: r - 1 };
}
function xw_keys(o, allowed, what) {   // an unknown key is a typo the writer would otherwise ignore in silence
  for (const k in o) if (!allowed.includes(k)) throw new Error('writeXlsx: ' + what + ' has no "' + k + '" (it takes ' + allowed.join(', ') + ')');
}
function xw_hex(c, what) {
  const s = String(c ?? '').replace(/^#/, '');
  if (!/^[0-9A-Fa-f]{6}$/.test(s)) throw new Error('writeXlsx: ' + what + ' "' + c + '" is not an RRGGBB colour');
  return 'FF' + s.toUpperCase();
}
function xw_num(v, lo, hi, what) {
  if (typeof v !== 'number' || !isFinite(v) || v < lo || v > hi) throw new Error('writeXlsx: ' + what + ' "' + v + '" is not a number from ' + lo + ' to ' + hi);
  return v;
}

// ---------------------------------------------------------------------------------------------------------------
// DATES. A date is an Excel serial in the 1900 date system. Excel counts a 29 February 1900 that never was, so every date
// before 1 March 1900 is one lower than a plain day count from 30 Dec 1899 gives; before 1 Jan 1900 there is no serial.
// ---------------------------------------------------------------------------------------------------------------
const xw_EPOCH = Date.UTC(1899, 11, 30);
function xw_serial(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3], t = Date.UTC(y, mo - 1, d), dt = new Date(t);
  // a calendar check, not a pattern check: 2026-02-30 would otherwise be written as 2 March
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d || y < 1900) return null;
  const n = Math.round((t - xw_EPOCH) / 864e5);
  return n < 61 ? n - 1 : n;
}

// ---------------------------------------------------------------------------------------------------------------
// STYLES. Every font, fill, border, number format and cell format is written once, however many cells ask for it and
// however many separate-but-equal style objects they hand in. Excel caps a workbook at 64,000 cell formats; one per cell
// would pass that on the raw data tabs alone.
// ---------------------------------------------------------------------------------------------------------------
const xw_STYLE_KEYS = ['font', 'fill', 'fmt', 'border', 'align'];
const xw_FONT_KEYS = ['b', 'i', 'sz', 'color', 'name'];
const xw_ALIGN_KEYS = ['h', 'v', 'wrap', 'indent'];
const xw_BORDER_KEYS = ['t', 'b', 'l', 'r'];
const xw_H = ['general', 'left', 'center', 'right', 'fill', 'justify', 'centerContinuous', 'distributed'];
const xw_V = ['top', 'center', 'bottom', 'justify', 'distributed'];
const xw_BSTYLE = ['thin', 'medium', 'thick', 'dashed', 'dotted', 'double', 'hair', 'mediumDashed', 'dashDot',
  'mediumDashDot', 'dashDotDot', 'mediumDashDotDot', 'slantDashDot'];
// The format codes whose built-in ids mean the same thing in every locale. Anything else is declared from 164 up.
const xw_BUILTIN_FMT = { 'General': 0, '0': 1, '0.00': 2, '#,##0': 3, '#,##0.00': 4, '0%': 9, '0.00%': 10, '@': 49 };
const xw_DATE_FMT = 'yyyy-mm-dd';

function xw_Styles(N) {
  const S = {
    N,
    font: new Map([['0|0|11||Calibri', 0]]), fontXml: ['<font><sz val="11"/><name val="Calibri"/></font>'],
    // Excel requires the first two fills to be none and gray125, whatever any cell uses
    fill: new Map([['', 0]]), fillXml: ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'],
    border: new Map([['', 0]]), borderXml: ['<border><left/><right/><top/><bottom/><diagonal/></border>'],
    fmt: new Map(), fmtXml: [], nextFmt: 164,
    xf: new Map([['0|0|0|0|', 0]]), xfXml: ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'],
    // by the style object itself: a spec is built before it is written, so an object has one state for the whole write
    byObj: new Map(), byObjDate: new Map(),
    sAttr: [],   // '" s="12', made once per cell format
  };
  return S;
}
function xw_fontId(S, f) {
  if (f == null) return 0;
  if (typeof f !== 'object') throw new Error('writeXlsx: a style font must be {b, i, sz, color, name}');
  xw_keys(f, xw_FONT_KEYS, 'a style font');
  const b = f.b ? 1 : 0, i = f.i ? 1 : 0;
  const sz = f.sz == null ? 11 : xw_num(f.sz, 1, 409, 'a font size');
  const color = f.color == null ? '' : xw_hex(f.color, 'a font colour');
  const name = f.name == null ? 'Calibri' : String(f.name);
  if (!name.trim() || name.length > 31) throw new Error('writeXlsx: a font name must be 1 to 31 characters');
  const key = b + '|' + i + '|' + sz + '|' + color + '|' + name;
  let id = S.font.get(key);
  if (id === undefined) {
    id = S.fontXml.length; S.font.set(key, id);
    S.fontXml.push('<font>' + (b ? '<b/>' : '') + (i ? '<i/>' : '') + '<sz val="' + sz + '"/>'
      + (color ? '<color rgb="' + color + '"/>' : '') + '<name val="' + xw_att(name, S.N) + '"/></font>');
  }
  return id;
}
function xw_fillId(S, f) {
  if (f == null || f === false || f === '') return 0;
  const c = xw_hex(f, 'a fill');
  let id = S.fill.get(c);
  if (id === undefined) {
    id = S.fillXml.length; S.fill.set(c, id);
    S.fillXml.push('<fill><patternFill patternType="solid"><fgColor rgb="' + c + '"/><bgColor indexed="64"/></patternFill></fill>');
  }
  return id;
}
function xw_borderId(S, b) {
  if (b == null) return 0;
  if (typeof b !== 'object') throw new Error('writeXlsx: a style border must be {t, b, l, r: [style, colour]}');
  xw_keys(b, xw_BORDER_KEYS, 'a style border');
  let key = '', xml = '';
  // the schema's order inside <border> is left, right, top, bottom, diagonal
  for (const [k, tag] of [['l', 'left'], ['r', 'right'], ['t', 'top'], ['b', 'bottom']]) {
    const e = b[k];
    if (e == null || e === false) { key += '|'; xml += '<' + tag + '/>'; continue; }
    const arr = Array.isArray(e) ? e : [e];
    if (!xw_BSTYLE.includes(arr[0])) throw new Error('writeXlsx: border style "' + arr[0] + '" is not one of ' + xw_BSTYLE.join(', '));
    const col = arr[1] == null ? '' : xw_hex(arr[1], 'a border colour');
    key += arr[0] + ':' + col + '|';
    xml += '<' + tag + ' style="' + arr[0] + '">' + (col ? '<color rgb="' + col + '"/>' : '') + '</' + tag + '>';
  }
  if (key === '||||') return 0;
  let id = S.border.get(key);
  if (id === undefined) {
    id = S.borderXml.length; S.border.set(key, id);
    S.borderXml.push('<border>' + xml + '<diagonal/></border>');
  }
  return id;
}
function xw_fmtId(S, code) {
  if (code == null || code === '') return 0;
  if (typeof code !== 'string') throw new Error('writeXlsx: a number format must be text, such as #,##0.00');
  if (Object.prototype.hasOwnProperty.call(xw_BUILTIN_FMT, code)) return xw_BUILTIN_FMT[code];
  let id = S.fmt.get(code);
  if (id === undefined) {
    id = S.nextFmt++; S.fmt.set(code, id);
    S.fmtXml.push('<numFmt numFmtId="' + id + '" formatCode="' + xw_att(code, S.N) + '"/>');
  }
  return id;
}
function xw_alignXml(a) {
  if (a == null) return '';
  if (typeof a !== 'object') throw new Error('writeXlsx: a style align must be {h, v, wrap, indent}');
  xw_keys(a, xw_ALIGN_KEYS, 'a style align');
  let h = a.h == null ? '' : a.h;
  if (h && !xw_H.includes(h)) throw new Error('writeXlsx: horizontal alignment "' + h + '" is not one of ' + xw_H.join(', '));
  const v = a.v == null ? '' : a.v;
  if (v && !xw_V.includes(v)) throw new Error('writeXlsx: vertical alignment "' + v + '" is not one of ' + xw_V.join(', '));
  const ind = a.indent == null ? 0 : xw_num(a.indent, 0, 250, 'an indent');
  if (!Number.isInteger(ind)) throw new Error('writeXlsx: an indent must be a whole number');
  // Excel and LibreOffice draw an indent only beside a horizontal alignment; with none named the indented outline rows
  // printed flush with their parents (ORBIT v2.10 review, WB-1)
  if (ind && !h) h = 'left';
  const x = (h ? ' horizontal="' + h + '"' : '') + (v ? ' vertical="' + v + '"' : '') + (ind ? ' indent="' + ind + '"' : '') + (a.wrap ? ' wrapText="1"' : '');
  return x ? '<alignment' + x + '/>' : '';
}
// the cell format index for a style object; isDate gives an unformatted date the yyyy-mm-dd format
function xw_xfId(S, s, isDate) {
  const cache = isDate ? S.byObjDate : S.byObj;
  if (s == null) {
    if (!isDate) return 0;
    s = xw_DATE_STYLE;
  }
  let id = cache.get(s);
  if (id !== undefined) return id;
  if (typeof s !== 'object' || Array.isArray(s)) throw new Error('writeXlsx: a cell style must be {font, fill, fmt, border, align}');
  xw_keys(s, xw_STYLE_KEYS, 'a cell style');
  const fo = xw_fontId(S, s.font), fi = xw_fillId(S, s.fill), bo = xw_borderId(S, s.border);
  const nf = xw_fmtId(S, (s.fmt == null || s.fmt === '') && isDate ? xw_DATE_FMT : s.fmt);
  const al = xw_alignXml(s.align);
  const key = fo + '|' + fi + '|' + bo + '|' + nf + '|' + al;
  id = S.xf.get(key);
  if (id === undefined) {
    id = S.xfXml.length; S.xf.set(key, id);
    S.xfXml.push('<xf numFmtId="' + nf + '" fontId="' + fo + '" fillId="' + fi + '" borderId="' + bo + '" xfId="0"'
      + (nf ? ' applyNumberFormat="1"' : '') + (fo ? ' applyFont="1"' : '') + (fi ? ' applyFill="1"' : '')
      + (bo ? ' applyBorder="1"' : '') + (al ? ' applyAlignment="1">' + al + '</xf>' : '/>'));
  }
  cache.set(s, id);
  return id;
}
const xw_DATE_STYLE = {};
function xw_stylesXml(S) {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    // the schema's order: numFmts, fonts, fills, borders, cellStyleXfs, cellXfs, cellStyles
    + (S.fmtXml.length ? '<numFmts count="' + S.fmtXml.length + '">' + S.fmtXml.join('') + '</numFmts>' : '')
    + '<fonts count="' + S.fontXml.length + '">' + S.fontXml.join('') + '</fonts>'
    + '<fills count="' + S.fillXml.length + '">' + S.fillXml.join('') + '</fills>'
    + '<borders count="' + S.borderXml.length + '">' + S.borderXml.join('') + '</borders>'
    + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
    + '<cellXfs count="' + S.xfXml.length + '">' + S.xfXml.join('') + '</cellXfs>'
    + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
    + '</styleSheet>';
}

// ---------------------------------------------------------------------------------------------------------------
// SHEET NAMES. Excel refuses a name over 31 characters, one holding [ ] : * ? / \, one beginning or ending with an
// apostrophe, a blank one, two that differ only in case, and "History" (it keeps that one for itself). Each is made
// legal -- a forbidden character becomes "_", a clash takes " (2)", " (3)"... -- and every change is noted.
// ---------------------------------------------------------------------------------------------------------------
function xw_sheetNames(names, N) {
  const used = new Set(['history']);
  return names.map((raw, i) => {
    const given = raw == null ? '' : String(raw);
    let s = xw_clean(given, N).replace(/[\t\n\r]/g, ' ').replace(/[[\]:*?/\\]/g, '_');
    const trimQ = t => t.replace(/^'+/, '').replace(/'+$/, '');
    s = trimQ(xw_cutTo(trimQ(s), 31));   // trimmed again after the cut, which can leave one at the end
    if (!s.trim()) s = 'Sheet' + (i + 1);
    let name = s;
    for (let k = 2; used.has(name.toLowerCase()); k++) {
      const suf = ' (' + k + ')';
      name = trimQ(xw_cutTo(s, 31 - suf.length)) + suf;
    }
    used.add(name.toLowerCase());
    if (name !== given) N.renamed.push({ from: given, to: name });
    return name;
  });
}

// ---------------------------------------------------------------------------------------------------------------
// ONE SHEET
// ---------------------------------------------------------------------------------------------------------------
const xw_SPEC_KEYS = ['creator', 'sheets'];
const xw_SHEET_KEYS = ['name', 'tabColor', 'grid', 'freeze', 'outlineAbove', 'page', 'header', 'footer', 'cols', 'rows', 'merges'];
const xw_ROW_KEYS = ['cells', 'ht', 'level', 'hidden'];
const xw_COL_KEYS = ['w', 'hidden'];
const xw_PAGE_KEYS = ['orientation', 'paper', 'fitWidth', 'fitHeight'];
const xw_PAPER = { letter: 1, tabloid: 3, legal: 5, a4: 9, a3: 8 };

const xw_NO_ROW = Object.freeze({});
function xw_note(list, at) { list.count++; if (list.at.length < 20) list.at.push(at); }
// '<c r="AB' for column 27, made once per column: the start of every cell in it
const xw_cpre = [];
function xw_cp(ci) { return (xw_cpre[ci] = '<c r="' + xw_col(ci)); }
// a text's index in the shared-string table, as the text the cell writes; cleaned, and cut where Excel would refuse it
// Looked up by the text as given (most texts repeat, and are then neither cleaned nor measured again); the table itself is
// keyed by what is written, so two texts that clean to one share one entry. A text that had characters replaced or was cut
// is remembered as such, so every cell holding it is counted and named, not just the first.
function xw_sst(SST, v, N, name, ci, rs) {
  let k = SST.map.get(v);
  if (k === undefined) {
    const before = N.replaced;
    let s = xw_clean(v, N), cut = false;
    if (s.length > xw_CELL_MAX) { cut = true; s = xw_cutTo(s, xw_CELL_MAX); }
    k = SST.byOut.get(s);
    if (k === undefined) { k = String(SST.list.length); SST.byOut.set(s, k); SST.list.push(s); }
    SST.map.set(v, k);
    if (cut || N.replaced !== before) SST.odd.set(v, { bad: N.replaced - before, cut });
    if (cut) xw_note(N.cut, name + '!' + xw_col(ci) + rs);
  } else if (SST.odd.size) {
    const o = SST.odd.get(v);
    if (o) { N.replaced += o.bad; if (o.cut) xw_note(N.cut, name + '!' + xw_col(ci) + rs); }
  }
  SST.count++;
  return k;
}

function xw_sheetXml(sh, name, idx, S, SST, N) {
  if (!sh || typeof sh !== 'object') throw new Error('writeXlsx: sheet ' + (idx + 1) + ' is not an object');
  xw_keys(sh, xw_SHEET_KEYS, 'sheet "' + name + '"');
  const where = 'sheet "' + name + '"';
  const rows = sh.rows == null ? [] : sh.rows;
  if (!Array.isArray(rows)) throw new Error('writeXlsx: ' + where + ' rows must be a list');
  if (rows.length > xw_MAXR) throw new Error('writeXlsx: ' + where + ' has more rows than a worksheet holds (1,048,576)');
  const above = !!sh.outlineAbove;
  // levels and hidden first: the collapsed mark on a summary row depends on the row beside it
  const lev = new Array(rows.length), hid = new Array(rows.length);
  for (let ri = 0; ri < rows.length; ri++) {
    const r = rows[ri];
    if (r == null) { lev[ri] = 0; hid[ri] = false; continue; }
    if (typeof r !== 'object' || Array.isArray(r)) throw new Error('writeXlsx: ' + where + ' row ' + (ri + 1) + ' must be {cells, ht, level, hidden}');
    xw_keys(r, xw_ROW_KEYS, where + ' row ' + (ri + 1));
    const L = r.level == null ? 0 : r.level;
    if (!Number.isInteger(L) || L < 0 || L > 7) throw new Error('writeXlsx: ' + where + ' row ' + (ri + 1) + ' level "' + r.level + '" is not 0 to 7');
    lev[ri] = L; hid[ri] = !!r.hidden;
  }
  let maxLevel = 0, maxR = -1, maxC = -1;
  // The page's globals, held here: in some hosts (a frame, the test harness's jsdom) every global name is looked up
  // through the window object, and the loop below asks for them about ten million times on a 50,000-row sheet.
  const isArr = Array.isArray, isInt = Number.isInteger, sst = xw_sst, xfId = xw_xfId, cpre = xw_cpre, cp = xw_cp,
    fin = isFinite, str = String, serial = xw_serial, note = xw_note, keysOf = Object.keys;
  // One piece per cell, and every 512 rows the pieces become bytes. On a 50,000-row sheet the time is as much the garbage
  // collector's as the writer's: kept until one join at the end, 1.8 million small strings were walked by every major
  // collection, then the 64 MB sheet was copied twice more as a string before it was encoded. In blocks, they die young.
  const enc = new TextEncoder(), out = [], done = [];
  for (let ri = 0; ri < rows.length; ri++) {
    if ((ri & 511) === 511 && out.length) { done.push(enc.encode(out.join(''))); out.length = 0; }
    // a blank row is an empty one, not nothing: as the summary row of a hidden group it still carries the collapsed mark
    const r = rows[ri] == null ? xw_NO_ROW : rows[ri];
    const rn = ri + 1, rs = String(rn);
    const cells = r.cells == null ? [] : r.cells;
    if (!Array.isArray(cells)) throw new Error('writeXlsx: ' + where + ' row ' + rn + ' cells must be a list');
    if (cells.length > xw_MAXC) throw new Error('writeXlsx: ' + where + ' row ' + rn + ' has more cells than a worksheet holds (16,384)');
    const at = out.length;
    out.push('');   // the row's own tag, written once its cells are known
    for (let ci = 0; ci < cells.length; ci++) {
      const c = cells[ci];
      if (c == null) continue;
      if (typeof c !== 'object' || isArr(c)) throw new Error('writeXlsx: ' + where + ' cell ' + xw_col(ci) + rn + ' must be {v, s}');
      // a misspelt key ({value:…}, {style:…}) would otherwise write an empty or plain cell and say nothing
      for (const k in c) if (k !== 'v' && k !== 's') throw new Error('writeXlsx: ' + where + ' cell ' + xw_col(ci) + rn + ' has no "' + k + '" (it takes v, s)');
      const v = c.v;
      let body = null, t = '', isDate = false;
      if (typeof v === 'string') {
        if (v !== '') { t = '" t="s'; body = sst(SST, v, N, name, ci, rs); }
      } else if (typeof v === 'number') {
        // At full precision: an integer as it is, anything else to 15 significant digits (Excel's own), which also drops
        // float noise such as 0.30000000000000004 without moving a figure. A shortest form of 15 characters or fewer
        // already has 15 digits or fewer, so it IS that rounding's answer; only a longer one is rounded, which keeps
        // toPrecision off the money cells of a large sheet (the commonest cell there is a figure).
        if (fin(v)) { body = str(v); if (body.length > 15 && !isInt(v)) body = str(+v.toPrecision(15)); }
        else note(N.nonFinite, name + '!' + xw_col(ci) + rs);   // Excel has no NaN or infinity: left empty, and said
      } else if (typeof v === 'boolean') {
        t = '" t="b'; body = v ? '1' : '0';
      } else if (v && typeof v === 'object' && !isArr(v) && 'date' in v && keysOf(v).length === 1) {
        const d = v.date;
        if (d != null && d !== '') {
          const n = serial(d);
          if (n === null) {   // not a real date on or after 1 Jan 1900: kept as the text it was, never a wrong day
            xw_note(N.badDates, name + '!' + xw_col(ci) + rs);
            t = '" t="s'; body = sst(SST, str(d), N, name, ci, rs);
          } else { body = str(n); isDate = true; }
        }
      } else if (v !== undefined && v !== null) {
        throw new Error('writeXlsx: ' + where + ' cell ' + xw_col(ci) + rs + ' value must be text, a number, true/false or {date:"YYYY-MM-DD"}');
      }
      const st = xfId(S, c.s, isDate);
      if (body === null && !st) continue;   // nothing to say and nothing to paint
      out.push((cpre[ci] || cp(ci)) + rs + (st ? S.sAttr[st] || (S.sAttr[st] = '" s="' + st) : '') + t
        + (body === null ? '"/>' : '"><v>' + body + '</v></c>'));
      N.cells++;
      if (ci > maxC) maxC = ci;
      if (ri > maxR) maxR = ri;
    }
    const L = lev[ri], H = hid[ri];
    let ht = '';
    if (r.ht != null) ht = ' ht="' + xw_num(r.ht, 0, 409, where + ' row ' + rn + ' height') + '" customHeight="1"';
    // Excel puts the outline's +/- button on the summary row, and reads whether the group is shut from collapsed="1" there:
    // above its detail when outlineAbove, below otherwise. Without it a hidden group shows a "-" that opens nothing.
    const nb = above ? ri + 1 : ri - 1;
    const coll = nb >= 0 && nb < rows.length && lev[nb] > L && hid[nb];
    if (L > maxLevel) maxLevel = L;
    if (out.length === at + 1 && !ht && !L && !H && !coll) { out.length = at; continue; }
    out[at] = '<row r="' + rs + '"' + ht + (H ? ' hidden="1"' : '') + (L ? ' outlineLevel="' + L + '"' : '')
      + (coll ? ' collapsed="1"' : '') + '>';
    out.push('</row>');
  }

  // sheetPr: tabColor, outlinePr, pageSetUpPr, in that order
  const page = sh.page == null ? null : sh.page;
  let pr = '';
  if (sh.tabColor != null) pr += '<tabColor rgb="' + xw_hex(sh.tabColor, where + ' tab colour') + '"/>';
  if (above) pr += '<outlinePr summaryBelow="0"/>';
  let fit = false;
  if (page) {
    if (typeof page !== 'object') throw new Error('writeXlsx: ' + where + ' page must be {orientation, paper, fitWidth, fitHeight}');
    xw_keys(page, xw_PAGE_KEYS, where + ' page');
    fit = page.fitWidth != null || page.fitHeight != null;
    if (fit) pr += '<pageSetUpPr fitToPage="1"/>';
  }
  const parts = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'];
  if (pr) parts.push('<sheetPr>' + pr + '</sheetPr>');
  parts.push('<dimension ref="' + (maxR < 0 || maxC < 0 ? 'A1' : 'A1:' + xw_col(maxC) + (maxR + 1)) + '"/>');

  // sheetViews: gridlines, the first tab selected, a frozen pane
  let pane = '';
  if (sh.freeze != null && sh.freeze !== '') {
    const f = xw_ref(sh.freeze, where + ' freeze');
    if (f.c > 0 || f.r > 0) {
      const tl = xw_col(f.c) + (f.r + 1), ap = f.c > 0 && f.r > 0 ? 'bottomRight' : (f.c > 0 ? 'topRight' : 'bottomLeft');
      pane = '<pane' + (f.c > 0 ? ' xSplit="' + f.c + '"' : '') + (f.r > 0 ? ' ySplit="' + f.r + '"' : '')
        + ' topLeftCell="' + tl + '" activePane="' + ap + '" state="frozen"/><selection pane="' + ap + '" activeCell="' + tl + '" sqref="' + tl + '"/>';
    }
  }
  parts.push('<sheetViews><sheetView' + (sh.grid === false ? ' showGridLines="0"' : '') + (idx === 0 ? ' tabSelected="1"' : '')
    + ' workbookViewId="0"' + (pane ? '>' + pane + '</sheetView>' : '/>') + '</sheetViews>');
  parts.push('<sheetFormatPr defaultRowHeight="15"' + (maxLevel ? ' outlineLevelRow="' + maxLevel + '"' : '') + '/>');

  // cols: a width and whether hidden; a column with neither keeps the sheet's default
  if (sh.cols != null) {
    if (!Array.isArray(sh.cols)) throw new Error('writeXlsx: ' + where + ' cols must be a list');
    if (sh.cols.length > xw_MAXC) throw new Error('writeXlsx: ' + where + ' has more columns than a worksheet holds (16,384)');
    let cx = '';
    sh.cols.forEach((c, j) => {
      if (c == null) return;
      if (typeof c !== 'object' || Array.isArray(c)) throw new Error('writeXlsx: ' + where + ' column ' + xw_col(j) + ' must be {w, hidden}');
      xw_keys(c, xw_COL_KEYS, where + ' column ' + xw_col(j));
      if (c.w == null && !c.hidden) return;
      const w = c.w == null ? null : xw_num(c.w, 0, 255, where + ' column ' + xw_col(j) + ' width');
      // a hidden column with no width of its own is given Calibri 11's default, so it comes back that wide when shown
      cx += '<col min="' + (j + 1) + '" max="' + (j + 1) + '" width="' + (w == null ? 9.140625 : w) + '"'
        + (w == null ? '' : ' customWidth="1"') + (c.hidden ? ' hidden="1"' : '') + '/>';
    });
    if (cx) parts.push('<cols>' + cx + '</cols>');
  }
  if (out.length) done.push(enc.encode(out.join('')));
  const head = parts.join('') + '<sheetData>';
  parts.length = 0;
  parts.push('</sheetData>');

  // mergeCells comes AFTER sheetData: placed before it, Excel refuses the part and the file does not open.
  // Overlapping ranges make Excel "repair" the sheet by dropping merges, so they are refused here instead.
  if (sh.merges != null) {
    if (!Array.isArray(sh.merges)) throw new Error('writeXlsx: ' + where + ' merges must be a list such as ["A1:Q1"]');
    const taken = new Map(), mx = [];
    for (const m of sh.merges) {
      const p = String(m ?? '').split(':');
      if (p.length !== 2) throw new Error('writeXlsx: ' + where + ' merge "' + m + '" is not a range such as A1:Q1');
      const a = xw_ref(p[0], where + ' merge'), b = xw_ref(p[1], where + ' merge');
      const r1 = Math.min(a.r, b.r), r2 = Math.max(a.r, b.r), c1 = Math.min(a.c, b.c), c2 = Math.max(a.c, b.c);
      // one cell merged with itself merges nothing (an appropriation with one FY, its label "merged down" one row);
      // Excel would flag it, so it is simply not written
      if (r1 === r2 && c1 === c2) continue;
      for (let r = r1; r <= r2; r++) {
        const spans = taken.get(r) || [];
        for (const [x1, x2, was] of spans) if (c1 <= x2 && x1 <= c2) throw new Error('writeXlsx: ' + where + ' merge "' + m + '" overlaps "' + was + '"');
        spans.push([c1, c2, m]); taken.set(r, spans);
      }
      mx.push('<mergeCell ref="' + xw_col(c1) + (r1 + 1) + ':' + xw_col(c2) + (r2 + 1) + '"/>');
    }
    if (mx.length) parts.push('<mergeCells count="' + mx.length + '">' + mx.join('') + '</mergeCells>');
  }

  // the printed page: margins (Excel's own defaults), the paper and fit, then the header and footer, in schema order
  parts.push('<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>');
  if (page) {
    const or = page.orientation == null ? 'portrait' : page.orientation;
    if (or !== 'portrait' && or !== 'landscape') throw new Error('writeXlsx: ' + where + ' orientation "' + or + '" is not portrait or landscape');
    const pk = page.paper == null ? 'letter' : String(page.paper).toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(xw_PAPER, pk)) throw new Error('writeXlsx: ' + where + ' paper "' + page.paper + '" is not one of ' + Object.keys(xw_PAPER).join(', '));
    let ps = '<pageSetup paperSize="' + xw_PAPER[pk] + '" orientation="' + or + '"';
    if (fit) {
      // Excel's default for each is 1, so 0 ("as many pages as it takes") has to be written out
      const fw = page.fitWidth == null ? 1 : xw_num(page.fitWidth, 0, 32767, where + ' fitWidth');
      const fh = page.fitHeight == null ? 1 : xw_num(page.fitHeight, 0, 32767, where + ' fitHeight');
      ps += ' fitToWidth="' + Math.round(fw) + '" fitToHeight="' + Math.round(fh) + '"';
    }
    parts.push(ps + '/>');
  }
  if (sh.header != null || sh.footer != null) {
    const hf = (tag, v) => {
      if (v == null || v === '') return '';
      if (typeof v !== 'string') throw new Error('writeXlsx: ' + where + ' ' + tag + ' must be text');
      // Excel refuses a header or footer longer than 255 characters (codes included) and says the file is damaged
      if (v.length > 255) throw new Error('writeXlsx: ' + where + ' ' + tag + ' is ' + v.length + ' characters; Excel allows 255');
      return '<' + tag + '>' + xw_txt(v, N) + '</' + tag + '>';
    };
    const x = hf('oddHeader', sh.header) + hf('oddFooter', sh.footer);
    if (x) parts.push('<headerFooter>' + x + '</headerFooter>');
  }
  parts.push('</worksheet>');
  // the part as a list of byte chunks, in order: the zip CRCs and compresses them one after another
  return [enc.encode(head), ...done, enc.encode(parts.join(''))];
}

// ---------------------------------------------------------------------------------------------------------------
// THE WORKBOOK
// ---------------------------------------------------------------------------------------------------------------
// SP.writeXlsx: a named function expression, never a top-level declaration, so the name cannot collide with another module's
SP.writeXlsx = async function writeXlsx(spec) {
  if (!spec || typeof spec !== 'object') throw new Error('writeXlsx: the spec must be {creator, sheets:[…]}');
  xw_keys(spec, xw_SPEC_KEYS, 'the spec');
  const sheets = spec.sheets;
  // Excel refuses a workbook with no sheet at all
  if (!Array.isArray(sheets) || !sheets.length) throw new Error('writeXlsx: the spec has no sheets');
  const N = { replaced: 0, cut: { count: 0, at: [] }, nonFinite: { count: 0, at: [] }, badDates: { count: 0, at: [] },
    renamed: [], deflated: false, sheets: sheets.length, cells: 0, bytes: 0, messages: [] };
  SP.lastXlsxNotes = N;   // a write that fails part-way leaves no older write's notes behind to be misread as its own
  const names = xw_sheetNames(sheets.map(s => (s && typeof s === 'object') ? s.name : null), N);
  const S = xw_Styles(N), SST = { map: new Map(), byOut: new Map(), odd: new Map(), list: [], count: 0 };
  const sheetXml = sheets.map((sh, i) => xw_sheetXml(sh, names[i], i, S, SST, N));
  const creator = xw_txt(spec.creator == null ? 'SFCB Spend Plan' : spec.creator, N);
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const XH = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const CT = 'application/vnd.openxmlformats-officedocument.spreadsheetml.';
  const n = sheets.length, hasS = SST.list.length > 0;
  const files = [];
  const add = (name, text) => files.push({ name, data: new TextEncoder().encode(text) });
  add('[Content_Types].xml', XH + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/xl/workbook.xml" ContentType="' + CT + 'sheet.main+xml"/>'
    + sheetXml.map((x, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="' + CT + 'worksheet+xml"/>').join('')
    + '<Override PartName="/xl/styles.xml" ContentType="' + CT + 'styles+xml"/>'
    + (hasS ? '<Override PartName="/xl/sharedStrings.xml" ContentType="' + CT + 'sharedStrings+xml"/>' : '')
    + '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
    + '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
    + '</Types>');
  add('_rels/.rels', XH + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="' + REL + '/officeDocument" Target="xl/workbook.xml"/>'
    + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
    + '<Relationship Id="rId3" Type="' + REL + '/extended-properties" Target="docProps/app.xml"/>'
    + '</Relationships>');
  add('docProps/core.xml', XH + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"'
    + ' xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"'
    + ' xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
    + '<dc:creator>' + creator + '</dc:creator><cp:lastModifiedBy>' + creator + '</cp:lastModifiedBy>'
    + '<dcterms:created xsi:type="dcterms:W3CDTF">' + now + '</dcterms:created>'
    + '<dcterms:modified xsi:type="dcterms:W3CDTF">' + now + '</dcterms:modified></cp:coreProperties>');
  add('docProps/app.xml', XH + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">'
    + '<Application>' + creator + '</Application></Properties>');
  add('xl/workbook.xml', XH + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="' + REL + '">'
    + '<workbookPr/><bookViews><workbookView activeTab="0"/></bookViews><sheets>'
    + names.map((nm, i) => '<sheet name="' + xw_escA(xw_unx(nm)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('')
    + '</sheets></workbook>');
  add('xl/_rels/workbook.xml.rels', XH + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + sheetXml.map((x, i) => '<Relationship Id="rId' + (i + 1) + '" Type="' + REL + '/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('')
    + '<Relationship Id="rId' + (n + 1) + '" Type="' + REL + '/styles" Target="styles.xml"/>'
    + (hasS ? '<Relationship Id="rId' + (n + 2) + '" Type="' + REL + '/sharedStrings" Target="sharedStrings.xml"/>' : '')
    + '</Relationships>');
  add('xl/styles.xml', xw_stylesXml(S));
  if (hasS) {
    // xml:space="preserve" where it matters: without it a reader may drop a leading or trailing space, or a tab or line
    // break, and "  Title" would no longer be the title the pull spelled
    const pre = /^[ \t\n\r]|[ \t\n\r]$|[\t\n\r]| {2}/;
    add('xl/sharedStrings.xml', XH + '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="' + SST.count
      + '" uniqueCount="' + SST.list.length + '">'
      + SST.list.map(s => '<si><t' + (pre.test(s) ? ' xml:space="preserve"' : '') + '>' + xw_escT(xw_unx(s)) + '</t></si>').join('')
      + '</sst>');
  }
  sheetXml.forEach((x, i) => files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: x }));
  const z = await xw_zip(files, true);
  N.deflated = z.deflated; N.bytes = z.bytes.length;
  // the same facts as sentences, for the export's status line
  const M = N.messages, fi = l => l.at.join(', ') + (l.count > l.at.length ? ' and ' + (l.count - l.at.length) + ' more' : '');
  if (N.replaced) M.push(N.replaced + (N.replaced === 1 ? ' character' : ' characters') + ' a workbook cannot hold ' + (N.replaced === 1 ? 'was' : 'were') + ' written as U+FFFD, the replacement character.');
  if (N.cut.count) M.push(N.cut.count + (N.cut.count === 1 ? ' cell was' : ' cells were') + ' longer than Excel’s 32,767 characters and cut there: ' + fi(N.cut) + '.');
  if (N.nonFinite.count) M.push(N.nonFinite.count + (N.nonFinite.count === 1 ? ' figure was' : ' figures were') + ' not a number and left empty: ' + fi(N.nonFinite) + '.');
  if (N.badDates.count) M.push(N.badDates.count + (N.badDates.count === 1 ? ' date was' : ' dates were') + ' not a date Excel can hold and written as text: ' + fi(N.badDates) + '.');
  N.renamed.forEach(r => M.push('Sheet “' + r.from + '” is named “' + r.to + '”: Excel does not allow the name as given.'));
  return z.bytes;
};

// ---------------------------------------------------------------------------------------------------------------
// THE ZIP. Each member is DEFLATEd through the browser's CompressionStream('deflate-raw') where it has one, and stored
// where it has not (or where deflate would not make it smaller); either way the file opens. No ZIP64: a member or a whole
// archive past 4 GB is refused rather than written with sizes that wrap.
// ---------------------------------------------------------------------------------------------------------------
// CRC-32 eight bytes a step (slicing-by-8): a byte at a time it took a third of a second on a 64 MB sheet.
const xw_CRC = (() => {
  const t = new Int32Array(256 * 8);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  for (let n = 0; n < 256; n++) for (let k = 1; k < 8; k++) t[k * 256 + n] = (t[(k - 1) * 256 + n] >>> 8) ^ t[t[(k - 1) * 256 + n] & 0xFF];
  return t;
})();
// the running CRC (start at 0xFFFFFFFF, finish with ^ 0xFFFFFFFF) over u8[from, to)
function xw_crcRun(c, u8, from, to) {
  const T = xw_CRC;
  let i = from;
  for (const end8 = to - 8; i <= end8; i += 8) {
    const a = c ^ (u8[i] | (u8[i + 1] << 8) | (u8[i + 2] << 16) | (u8[i + 3] << 24));
    c = T[1792 + (a & 0xFF)] ^ T[1536 + ((a >>> 8) & 0xFF)] ^ T[1280 + ((a >>> 16) & 0xFF)] ^ T[1024 + (a >>> 24)]
      ^ T[768 + u8[i + 4]] ^ T[512 + u8[i + 5]] ^ T[256 + u8[i + 6]] ^ T[u8[i + 7]];
  }
  for (; i < to; i++) c = T[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
  return c;
}
// raw DEFLATE, or null where the browser cannot (no CompressionStream, or one that does not know 'deflate-raw').
// between(): called after each compressed chunk is read, while the stream works on the next one. The CRC is computed
// there, so wherever the stream compresses off the main thread (Node does) it costs no time at all, and elsewhere no more.
async function xw_deflate(chunks, between) {
  const CS = (typeof window !== 'undefined' && window.CompressionStream) || null;
  if (typeof CS !== 'function') return null;
  let cs;
  try { cs = new CS('deflate-raw'); } catch (e) { return null; }
  try {
    const w = cs.writable.getWriter(), rd = cs.readable.getReader(), outs = [];
    const wrote = (async () => { for (const ch of chunks) await w.write(ch); await w.close(); })();
    // A write the stream refuses must end the read too: otherwise the read below waits for an end that never comes, and
    // the export hangs with nothing said. (The catch also keeps the refusal from being an unhandled rejection.)
    wrote.catch(e => { rd.cancel(e).catch(() => {}); });
    let len = 0;
    for (;;) {
      const { done, value } = await rd.read();
      if (done) break;
      outs.push(value); len += value.length;
      if (between) between();
    }
    await wrote;
    const out = new Uint8Array(len);
    let o = 0;
    for (const c of outs) { out.set(c, o); o += c.length; }
    return out;
  } catch (e) {
    return null;   // a stream that fails part-way: the member is stored, which still opens
  }
}
// files: [{name, data}], data a Uint8Array or a list of them in order. fixed: date every member 1 Jan 1980, as Excel dates
// its own parts; otherwise now (the pictures, which a person extracts and sorts by date).
async function xw_zip(files, fixed) {
  if (files.length > 65535) throw new Error('zip: more than 65,535 files');
  const d = fixed ? null : new Date();
  const dosTime = d ? (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1) : 0;
  const dosDate = d ? (Math.max(0, d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate() : (0 << 9) | (1 << 5) | 1;
  const ents = [];
  let deflated = false;
  for (const f of files) {
    const nb = new TextEncoder().encode(f.name);
    // a member's bytes are one Uint8Array, or (a worksheet) a list of them in order
    const parts = Array.isArray(f.data) ? f.data : [f.data];
    let L = 0;
    for (const p of parts) L += p.length;
    let c = -1, k = 0;
    const step = () => { if (k < parts.length) { c = xw_crcRun(c, parts[k], 0, parts[k].length); k++; } };
    let method = 0, body = null;
    const z = await xw_deflate(parts, step);
    while (k < parts.length) step();
    const crc = (c ^ -1) >>> 0;
    if (z && z.length < L) { body = z; method = 8; deflated = true; }
    else if (parts.length === 1) body = parts[0];
    else { body = new Uint8Array(L); let o = 0; for (const p of parts) { body.set(p, o); o += p.length; } }
    // bit 11: the name is UTF-8, so a picture named for "Initial Spares" or an accented title extracts as named
    const flags = /[^\x00-\x7F]/.test(f.name) ? 0x0800 : 0;
    ents.push({ nb, crc, body, size: L, method, flags });
  }
  let total = 22, cd = 0;
  for (const e of ents) { total += 30 + e.nb.length + e.body.length + 46 + e.nb.length; cd += 46 + e.nb.length; }
  if (total > 0xFFFFFFFE) throw new Error('zip: the archive would be larger than 4 GB, which this writer cannot hold');
  const out = new Uint8Array(total), dv = new DataView(out.buffer);
  let o = 0;
  const u16 = v => { dv.setUint16(o, v, true); o += 2; }, u32 = v => { dv.setUint32(o, v >>> 0, true); o += 4; };
  for (const e of ents) {
    e.off = o;
    u32(0x04034b50); u16(20); u16(e.flags); u16(e.method); u16(dosTime); u16(dosDate);
    u32(e.crc); u32(e.body.length); u32(e.size); u16(e.nb.length); u16(0);
    out.set(e.nb, o); o += e.nb.length; out.set(e.body, o); o += e.body.length;
  }
  const cdStart = o;
  for (const e of ents) {
    u32(0x02014b50); u16(20); u16(20); u16(e.flags); u16(e.method); u16(dosTime); u16(dosDate);
    u32(e.crc); u32(e.body.length); u32(e.size); u16(e.nb.length); u16(0); u16(0); u16(0); u16(0); u32(0); u32(e.off);
    out.set(e.nb, o); o += e.nb.length;
  }
  u32(0x06054b50); u16(0); u16(0); u16(ents.length); u16(ents.length); u32(cd); u32(cdStart); u16(0);
  return { bytes: out, deflated };
}
// files: [{name, data}] where data is a Uint8Array (an ArrayBuffer, another typed array or a Blob is taken as its bytes).
// A name that would extract outside its folder, or a second file under a name already used (the first picture would be
// overwritten on extraction), is refused.
SP.zipFiles = async function zipFiles(files) {
  if (!Array.isArray(files)) throw new Error('zipFiles: give a list of {name, data}');
  const seen = new Set(), list = [];
  for (const f of files) {
    if (!f || typeof f !== 'object') throw new Error('zipFiles: each file must be {name, data}');
    const name = String(f.name ?? '');
    if (!name || name.length > 1000 || /^[/\\]|\\|[\u0000-\u001F]|(^|\/)\.\.(\/|$)/.test(name) || /\/$/.test(name))
      throw new Error('zipFiles: the file name "' + name + '" is not one a zip can safely hold');
    const k = name.toLowerCase();
    if (seen.has(k)) throw new Error('zipFiles: two files are named "' + name + '"');
    seen.add(k);
    // by tag, never instanceof: bytes made in another frame (or the test harness's realm) are not instances of this one's
    let data = f.data;
    const tag = Object.prototype.toString.call(data);
    if (tag === '[object Uint8Array]') { /* as it is */ }
    else if (tag === '[object ArrayBuffer]') data = new Uint8Array(data);
    else if (data && ArrayBuffer.isView(data)) data = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    else if (data && typeof data.arrayBuffer === 'function') data = new Uint8Array(await data.arrayBuffer());   // a Blob
    else throw new Error('zipFiles: "' + name + '" has no bytes (data must be a Uint8Array)');
    list.push({ name, data });
  }
  return (await xw_zip(list, false)).bytes;
};
