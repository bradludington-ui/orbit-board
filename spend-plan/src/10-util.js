// §1 UTIL — shared constants and helpers. Every module after this one adds its public functions to SP.
"use strict";
const SP = (window.SP = window.SP || {});

// ---------------------------------------------------------------------------------------------------------------
// CONSTANTS (CONTRACT §2). Frozen, arrays included: a settings editor that copied GOALS_DEFAULT shallowly and then typed
// into a curve would otherwise rewrite the default itself, and "Reset to v12's curves" would reset to the edited curve.
// A write to a frozen array throws in strict mode, which is the loud failure that bug deserves. Take a copy to edit:
// SP.goalsDefault() is a deep one.
// ---------------------------------------------------------------------------------------------------------------
function ut_freeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(ut_freeze); }
  return o;
}
SP.APS = ut_freeze([   // order everywhere a list of appropriations is printed, except PMO tabs (§8.6)
  {id:'om',  label:'O&M',            type:'om',   rawSheet:'O&M Raw Data'},
  {id:'ff',  label:'Full Fund',      type:'proc', rawSheet:'FF Raw Data'},
  {id:'sp',  label:'Initial Spares', type:'proc', rawSheet:'Spares Raw Data'},
  {id:'opn', label:'OPN',            type:'proc', rawSheet:'OPN Raw Data'} ]);
SP.SERVICES = ut_freeze(['USAF','USAF ANG','USAF AFRC','USMC B (STOVL)','USMC C (USMC CV)','USN (USN CV)']);
SP.SVC_UNKNOWN = 'Service not identified';
SP.PMO_ORDER = ut_freeze(['Air Vehicle (AV)','Business Operations (BOP)','Combat Data Systems (CDS)','Maintenance Systems (MxS)',
                'Product Support Management (PSM)','Propulsion (PP)','Training Systems (TSS)']);
SP.RAW_HEADERS = ut_freeze(['FY','Month','CCaR No','Title','Budget','C/L','SB','Plan Event','Date','Amount','Alloc','Event Description',
  'OPR','PMT PID#','Contracting POC','Material Lead','PM/TPOC','Obligation Category','PMO','Sub-PMO','Category','Navy SI Code',
  'IPT','Spares WBS','Quantity','CLINs','AF EEIC','RCN','PSR','CSR','Contract Mod','Cost Element']);   // the 32, in this order
SP.REQUIRED = ut_freeze(['FY','CCaR No','Title','Budget','Plan Event','Date','Amount','Alloc','PMO']);
SP.SPECIAL_CCARS_DEFAULT = ut_freeze(['PP 2000','JSF6654']);
SP.MONTHS = ut_freeze(['Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep']);
SP.CUI = 'CUI//REL TO US DoW';
SP.GOALS_DEFAULT = ut_freeze({   // [Prior, Oct..Sep]: 13 values each, exactly as v12 typed them
  om1: [0, .0833,.1667,.25,.3333,.4167,.5,.5833,.6667,.75,.8333,.9167,1],
  om2: [1, 1,1,1,1,1,1,1,1,1,1,1,1],                 // O&M in its second year or later (expired): fully obligated
  p1:  [0, .0667,.1333,.2,.2667,.3333,.4,.4667,.5333,.6,.6667,.7333,.8],
  p2:  [.8, .8083,.8167,.825,.8333,.8417,.85,.8583,.8667,.875,.8833,.8917,.9],
  p3:  [.9, .9083,.9167,.925,.9333,.9417,.95,.9583,.9667,.975,.9833,.9917,1],
  p4:  [1, 1,1,1,1,1,1,1,1,1,1,1,1] });              // procurement in its fourth year or later
// a deep, editable copy of the default curves
SP.goalsDefault = () => JSON.parse(JSON.stringify(SP.GOALS_DEFAULT));
// Month abbreviations by calendar month (index 0 = January), for "Nov-2025"-style labels
SP.CAL_MONTHS = ut_freeze(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']);

// ---------------------------------------------------------------------------------------------------------------
// TEXT
// ---------------------------------------------------------------------------------------------------------------
// The single quote matters as much as the double: a value drawn into a single-quoted attribute would otherwise end it.
SP.esc = function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};
// The grouping key for names (§4.4). \s in a JavaScript pattern covers the non-breaking space CCaR exports carry, so
// "Air Vehicle\u00a0(AV)" and "Air Vehicle (AV)" are one node, not two that each look complete.
SP.normKey = function normKey(s) {
  return String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
};
// 1875 -> '1,875' (counts in messages and the import report)
SP.fmtInt = function fmtInt(n) {
  if (typeof n !== 'number' || !isFinite(n)) return '';
  const neg = n < 0, s = ut_commas(String(Math.trunc(Math.abs(n))));
  return neg ? '-' + s : s;
};
function ut_commas(digits) { return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
// zero-based column index -> spreadsheet letters (0 -> 'A', 27 -> 'AB'); used to name a column that has no header
SP.colLetter = function colLetter(i) {
  let n = Math.floor(i) + 1, s = '';
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
};

// ---------------------------------------------------------------------------------------------------------------
// MONEY. Every figure inside the tool is whole cents. Amounts are read from their DECIMAL TEXT, never by multiplying a
// float by 100: 1234.56 * 100 is 123455.99999999999, and rounding that is only right by luck; a half cent read through
// a float rounds whichever way the binary happens to fall.
// ---------------------------------------------------------------------------------------------------------------
// digits before and after the point (strings, no sign) -> {cents, rounded} or null when it cannot be held exactly
function ut_decToCents(intDigits, fracDigits) {
  const i = intDigits.replace(/^0+(?=\d)/, '') || '0';
  const f = (fracDigits || '');
  let cents = Number(i) * 100 + Number((f + '00').slice(0, 2));
  const rest = f.slice(2);
  const rounded = /[1-9]/.test(rest);
  // half away from zero, on the exact decimal: the third decimal decides, whatever follows it
  if (rounded && rest.charCodeAt(0) >= 53) cents += 1;   // '5'..'9'
  if (!Number.isSafeInteger(cents) || i.length > 16) return null;
  return { cents, rounded };
}
// a finite number -> its 15-significant-digit decimal text (what Excel shows), expanded out of exponent form
function ut_numDecimal(n) {
  const s = String(Number(Math.abs(n).toPrecision(15)));
  const m = /^(\d+)(?:\.(\d+))?(?:e([+-]\d+))?$/i.exec(s);
  if (!m) return null;
  let ip = m[1], fp = m[2] || '', ex = m[3] ? Number(m[3]) : 0;
  if (ex > 0) { fp = fp + '0'.repeat(Math.max(0, ex - fp.length)); ip = ip + fp.slice(0, ex); fp = fp.slice(ex); }
  else if (ex < 0) { ip = '0'.repeat(Math.max(0, -ex - ip.length + 1)) + ip; const k = ip.length + ex; fp = ip.slice(k) + fp; ip = ip.slice(0, k); }
  return { ip, fp };
}
const UT_NUM_TEXT = /^(?:(\d{1,3}(?:,\d{3})+)|(\d+))?(?:\.(\d*))?$/;   // commas only between groups of three
// {cents, how}: cents is a whole number or null; how is number|blank|text|dollar|paren|bad|subcent (CONTRACT §2)
SP.parseAmount = function parseAmount(v) {
  if (v === null || v === undefined) return { cents: 0, how: 'blank' };
  if (typeof v === 'number') {
    if (!isFinite(v)) return { cents: null, how: 'bad' };
    const d = ut_numDecimal(v), r = d && ut_decToCents(d.ip, d.fp);
    if (!r) return { cents: null, how: 'bad' };
    const cents = v < 0 ? -r.cents : r.cents;
    return { cents: cents === 0 ? 0 : cents, how: r.rounded ? 'subcent' : 'number' };
  }
  if (typeof v !== 'string') return { cents: null, how: 'bad' };
  let t = v.trim();
  if (t === '') return { cents: 0, how: 'blank' };
  t = t.replace(/^\u2212/, '-');   // a typographic minus sign, as some exports write it
  let neg = false, sign = false, paren = false, dollar = false;
  // the prefixes, in any order, each at most once: $, a sign, an opening parenthesis (whose closing one ends the text).
  // A sign and parentheses together are a double negative nobody means, so they are not guessed at.
  for (;;) {
    const ch = t.charAt(0);
    if (ch === '$') { if (dollar) return { cents: null, how: 'bad' }; dollar = true; t = t.slice(1).trim(); continue; }
    if (ch === '-' || ch === '+') {
      if (sign || paren) return { cents: null, how: 'bad' };
      sign = true; neg = ch === '-'; t = t.slice(1).trim(); continue;
    }
    if (ch === '(') {
      if (paren || sign || !t.endsWith(')')) return { cents: null, how: 'bad' };
      paren = true; neg = true; t = t.slice(1, -1).trim(); continue;
    }
    break;
  }
  const m = UT_NUM_TEXT.exec(t);
  if (!m || !/\d/.test(t)) return { cents: null, how: 'bad' };
  const r = ut_decToCents((m[1] || m[2] || '0').replace(/,/g, ''), m[3] || '');
  if (!r) return { cents: null, how: 'bad' };
  const cents = neg && r.cents ? -r.cents : r.cents;
  // one kind per value, the one the report most needs to say: a rounding first, then the parentheses, then the $
  return { cents, how: r.rounded ? 'subcent' : paren ? 'paren' : dollar ? 'dollar' : 'text' };
};
// cents -> $M to two decimals: 1234567 -> '0.01'; negative in parentheses; zero '-'; non-zero under $5,000 '<0.01'.
// Integer arithmetic throughout, so 0.005M rounds up every time instead of whichever way its binary falls.
SP.fmtM = function fmtM(cents) {
  if (typeof cents !== 'number' || !isFinite(cents)) return '—';
  const c = Math.round(cents);
  if (c === 0) return '-';
  const a = Math.abs(c);
  let body;
  if (a < 500000) body = '<0.01';
  else {
    let q = Math.floor(a / 1e6);
    if (a - q * 1e6 >= 500000) q += 1;   // hundredths of $M, half away from zero
    body = ut_commas(String(Math.floor(q / 100))) + '.' + String(q % 100).padStart(2, '0');
  }
  return c < 0 ? '(' + body + ')' : body;
};
// cents -> '$1,234.56' / '-$1,234.56' (the import report's dollars)
SP.fmtUsd = function fmtUsd(cents) {
  if (typeof cents !== 'number' || !isFinite(cents)) return '—';
  const a = Math.abs(Math.round(cents));
  const s = '$' + ut_commas(String(Math.floor(a / 100))) + '.' + String(a % 100).padStart(2, '0');
  return cents < 0 && a ? '-' + s : s;
};
// a fraction -> hundredths of a percent, half away from zero; toPrecision(12) first, so 0.12345 (stored as
// 0.123449999…) rounds as the 12.345 it was written as
function ut_pctHundredths(x) {
  const a = Math.abs(x) * 100 * 100;
  return Math.round(Number(a.toPrecision(12)));
}
function ut_pctText(h) { return ut_commas(String(Math.floor(h / 100))) + '.' + String(h % 100).padStart(2, '0') + '%'; }
SP.fmtPct = function fmtPct(x) {
  if (typeof x !== 'number' || !isFinite(x)) return '—';
  const h = ut_pctHundredths(x);
  return (x < 0 && h ? '-' : '') + ut_pctText(h);
};
// '+20.90%' / '-15.03%'; a delta that rounds to zero is '0.00%', as the workbook's +0.00%;-0.00%;0.00% shows it
SP.fmtDelta = function fmtDelta(x) {
  if (typeof x !== 'number' || !isFinite(x)) return '—';
  const h = ut_pctHundredths(x);
  return (h === 0 ? '' : x < 0 ? '-' : '+') + ut_pctText(h);
};

// ---------------------------------------------------------------------------------------------------------------
// DATES are ISO 'YYYY-MM-DD' strings everywhere inside the tool: they sort, compare and travel in JSON as themselves,
// and no time zone can move one by a day.
// ---------------------------------------------------------------------------------------------------------------
// y, m (1-12), d -> 'YYYY-MM-DD', or '' when no such day exists (30 February is not quietly 2 March)
SP.isoDate = function isoDate(y, m, d) {
  y = Number(y); m = Number(m); d = Number(d);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d) || y < 1 || y > 9999 || m < 1 || m > 12 || d < 1) return '';
  const dim = [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  if (d > dim) return '';
  return String(y).padStart(4, '0') + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
};
SP.ymOf = function ymOf(date) {
  return typeof date === 'string' && /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : '';
};
// October to December belong to the next fiscal year
SP.fyOf = function fyOf(date) {
  const m = typeof date === 'string' && /^(\d{4})-(\d{2})/.exec(date);
  if (!m) return null;
  return Number(m[1]) + (Number(m[2]) >= 10 ? 1 : 0);
};
// An Excel serial day -> ISO. The 1900 system counts the 29 February 1900 that never was (serial 60), so days before it
// sit one later than a plain count from 1899-12-30 would put them; serial 60 itself is no date and reads as ''.
// The 1904 system counts plainly from 1904-01-01. The fraction of a day is the time, which the tool does not use.
SP.excelSerialToIso = function excelSerialToIso(n, date1904) {
  if (typeof n !== 'number' || !isFinite(n)) return '';
  const day = Math.floor(n);
  let ms;
  if (date1904) { if (day < 0) return ''; ms = Date.UTC(1904, 0, 1) + day * 86400000; }
  else {
    if (day < 1 || day === 60) return '';
    ms = (day < 60 ? Date.UTC(1899, 11, 31) : Date.UTC(1899, 11, 30)) + day * 86400000;
  }
  const d = new Date(ms);
  if (isNaN(d.getTime()) || d.getUTCFullYear() > 9999) return '';
  return d.toISOString().slice(0, 10);
};

// ---------------------------------------------------------------------------------------------------------------
// DOWNLOAD (for the UI): a Blob URL clicked through a temporary anchor. The URL is revoked a minute later, not at once:
// revoked in the same turn as the click, some browsers have not yet started reading it and save an empty file.
// ---------------------------------------------------------------------------------------------------------------
SP.download = function download(name, bytesOrBlob, mime) {
  const isBlob = bytesOrBlob && typeof bytesOrBlob === 'object' && typeof bytesOrBlob.arrayBuffer === 'function'
    && typeof bytesOrBlob.size === 'number';
  const blob = isBlob ? bytesOrBlob : new Blob([bytesOrBlob], { type: mime || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = String(name || 'download');
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  try { a.click(); } finally { a.remove(); setTimeout(() => { try { URL.revokeObjectURL(url); } catch (e) {} }, 60000); }
  return a.download;
};
