// §11 STORE — the state, opening it, saving it, and this browser's switches (CONTRACT §11).
//
//   SP.storeInit()            -> {ok, message}   read the state baked into this page; call ONCE, before the UI draws
//   SP.state                  the state (CONTRACT §11): {v, tool, savedAt, settings, pulls:{current, previous}, history, lastImport}
//   SP.getView() / SP.setView(view)              this browser's switches (localStorage 'sfcbsp.view'), never the file's
//   SP.applyImport(parsed)    -> {message}       SP.parseFiles's result, put into the state
//   SP.setSettings(patch)                        merge into settings; marks the file unsaved when anything changed
//   SP.isDirty()              -> bool            work this page holds that its file does not
//   SP.onStateChange(fn)      -> unsubscribe     called after an import, a settings change or a save
//   await SP.saveFile()       -> {ok, message}   write this page's own file (or download it where the browser cannot)
//   await SP.saveCopy()       -> {ok, message}   write a new file
//   SP.savedHtml()            -> string          the page as a file: the captured page, the state in its tag, #app reset
//
// THE FILE IS THE DATABASE. The state lives in <script id="spState" type="application/json"> and nowhere else: browser
// storage holds only the switches, because the file is what travels on the share and what anyone else opens. A value
// that is not in the file is not saved, whatever this browser remembers.

// ---------------------------------------------------------------------------------------------------------------
// WHAT THE STATE IS
// ---------------------------------------------------------------------------------------------------------------
const ST_TOOL = 'sfcb-spend-plan';
const ST_V = 1;
const ST_VIEW_KEY = 'sfcbsp.view';     // ORBIT's prio27*/spmt* share this file:// origin; ours never collide with them
const ST_PULL_KEYS = ['om', 'ff', 'sp', 'opn', 'unidentified'];
// What #app holds in the shell before the UI draws. Used only when the page was captured after the UI had drawn (a
// late storeInit), so a saved file still opens like a fresh one instead of showing yesterday's screen frozen in place.
const ST_BOOT_NOTE = '<p class="boot-note">Opening the SFCB Spend Plan…</p>';
// The page's own file was opened with saved data this page refused (wrong version, wrong shape). It never equals a
// savedAt, so Save cannot treat that file as "the one this page opened with" and write over data it could not read.
const ST_REFUSED = Object.freeze({ refused: true });

function st_empty() {
  return { v: ST_V, tool: ST_TOOL, savedAt: null, settings: null, pulls: { current: {}, previous: {} }, history: [], lastImport: null };
}
// A deep copy through JSON: what is held in memory is exactly what a reopened file would hold (no undefined, no
// prototype-less maps, no shared references), so "save, then reopen" can never come back different from the screen.
function st_clone(o) { return o === undefined ? undefined : JSON.parse(JSON.stringify(o)); }
function st_isObj(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
function st_own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }

SP.state = st_empty();
let st_dirty = false;
let st_gen = 0;                  // moves on every change; a save marks the page clean only if nothing moved while it wrote
let st_base = null;              // the savedAt of this page's own file as last read or written: Save's collision check
let st_baseWhy = '';             // why the opened state was refused (ST_REFUSED), for the question Save then asks
let st_handle = null;            // this page's own file, once picked and checked; remembered for the session only
let st_openedAt = null;          // when this page was opened: what a file's save time is "before" or "after"
let st_dlOnly = false;           // the last Save was a download: this page's own file still lacks the work (review S8)
let st_refusedRaw = null;        // the saved-data text this page opened and could not read at all: Save asks before writing
                                 // over exactly that, rather than refusing for ever (review DL-6)
let st_taken = null;             // {at, name}: the save time of the plan this page took from a file (takePlan), until it saves
// The save times of the files this page wrote that are not its own (Save a copy…, a download), with each file's name. A
// file holding one of them holds this page's own work: Save never calls it "someone else's" (review SEAM-5, DL-5, BP-7).
const st_copies = new Map();
let st_busy = false;
let st_inited = false;
let st_cap = null;               // the page as captured at boot: {html, stateAt, stateLen, stateOpen, appAt, appLen, appOpen, boot}
let st_view = null;
let st_unloadOn = false;
const st_subs = [];

function st_changed() {
  st_gen++;
  st_dirty = true;
  st_dlOnly = false;
  st_fire();
}
function st_fire() {
  for (const f of st_subs.slice()) { try { f(); } catch (e) { /* a broken listener must not stop a save or an import */ } }
}

// ---------------------------------------------------------------------------------------------------------------
// SMALL WORDS
// ---------------------------------------------------------------------------------------------------------------
function st_pad(n) { return String(n).padStart(2, '0'); }
// an ISO timestamp -> this browser's local 'YYYY-MM-DD' (an import at 9 pm in Virginia is that day, not tomorrow in UTC)
function st_day(iso) {
  const d = new Date(Date.parse(iso));
  if (isNaN(d.getTime())) return typeof iso === 'string' ? iso.slice(0, 10) : '';
  return d.getFullYear() + '-' + st_pad(d.getMonth() + 1) + '-' + st_pad(d.getDate());
}
function st_when(iso) {
  const d = new Date(Date.parse(iso));
  if (isNaN(d.getTime())) return String(iso);
  return st_day(iso) + ' ' + st_pad(d.getHours()) + ':' + st_pad(d.getMinutes());
}
function st_apLabel(ap) {
  const a = SP.APS.find(x => x.id === ap);
  return a ? a.label : ap;
}
function st_list(words) {
  if (words.length <= 1) return words.join('');
  return words.slice(0, -1).join(', ') + ' and ' + words[words.length - 1];
}
function st_rows(n) { return (SP.fmtInt ? SP.fmtInt(n) : String(n)) + (n === 1 ? ' row' : ' rows'); }
// the name of the file this page was opened from: what Save asks the person to pick, and what a download is called
function st_pageName() {
  let n = '';
  try { n = decodeURIComponent(String(location.pathname || '').split('/').pop() || ''); } catch (e) { n = ''; }
  return /\.html?$/i.test(n) ? n : 'sfcb-spend-plan.html';
}
// the page's own file name when its address names one, else '' (a name Save cannot compare a picked file with)
function st_pageNameKnown() {
  let n = '';
  try { n = decodeURIComponent(String(location.pathname || '').split('/').pop() || ''); } catch (e) { n = ''; }
  return /\.html?$/i.test(n) ? n : '';
}
// two file names that are one file on a share: Windows does not tell capitals apart
function st_sameName(a, b) {
  const k = x => String(x || '').normalize('NFC').trim().toLowerCase();
  return k(a) === k(b);
}
// two save times, each to the minute, or to the second when the minutes are the same: two saves a few seconds apart read
// as one time, and "saved 18:57, after … (18:57)" could not be told from "before" (review S1)
function st_whenPair(a, b) {
  const wa = st_when(a), wb = st_when(b);
  if (wa !== wb) return [wa, wb];
  const sec = iso => { const d = new Date(Date.parse(iso)); return isNaN(d.getTime()) ? '' : ':' + st_pad(d.getSeconds()); };
  return [wa + sec(a), wb + sec(b)];
}
function st_copyName() {
  const d = new Date();
  return st_pageName().replace(/\.html?$/i, '') + ' - copy ' + d.getFullYear() + '-' + st_pad(d.getMonth() + 1) + '-' + st_pad(d.getDate()) + '.html';
}
// Said while a file window is open, where the page has a way to say it (SP.say, when the screens provide one). The
// picker itself cannot carry a sentence, only the name of its file type, which names the file too.
function st_say(text) {
  if (typeof SP.say === 'function') { try { SP.say(text, 'info'); } catch (e) {} }
}

// ---------------------------------------------------------------------------------------------------------------
// IS THIS A STATE THIS PAGE CAN USE? '' when it is, else the reason in words. Checked on opening, before anything reads
// it: a file is input like any other, and a state that half-loads draws a board that looks complete and is not.
// ---------------------------------------------------------------------------------------------------------------
function st_checkRows(rows, where) {
  if (!Array.isArray(rows)) return where + ' has no list of rows';
  const N = SP.RAW_HEADERS.length;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!st_isObj(r) || !Array.isArray(r.c)) return where + ', row ' + (i + 1) + ', is not a row';
    if (r.c.length !== N) return where + ', row ' + (i + 1) + ', has ' + r.c.length + ' values, not ' + N;
    for (let k = 0; k < N; k++) {
      const v = r.c[k];
      if (v !== null && typeof v !== 'string' && !(typeof v === 'number' && isFinite(v))) {
        return where + ', row ' + (i + 1) + ', has a ' + SP.RAW_HEADERS[k] + ' that is neither text nor a number';
      }
    }
    if (r.x !== undefined && !st_isObj(r.x)) return where + ', row ' + (i + 1) + ', has extra columns that are not a list of named values';
    if (r.src !== undefined && !Array.isArray(r.src)) return where + ', row ' + (i + 1) + ', does not say where it came from';
    if (r.bad !== undefined && !Array.isArray(r.bad)) return where + ', row ' + (i + 1) + ', has reasons that are not a list';
  }
  return '';
}
function st_checkPulls(side, name) {
  if (!st_isObj(side)) return 'its ' + name + ' pulls are not a set of pulls';
  for (const k of Object.keys(side)) {
    if (!ST_PULL_KEYS.includes(k)) return 'its ' + name + ' pulls hold “' + k + '”, which is not an appropriation';
    const p = side[k];
    const where = 'the ' + name + ' ' + (k === 'unidentified' ? 'unidentified rows' : st_apLabel(k) + ' pull');
    if (!st_isObj(p)) return where + ' is not a pull';
    const bad = st_checkRows(p.rows, where);
    if (bad) return bad;
    if (p.importedAt !== undefined && p.importedAt !== null && typeof p.importedAt !== 'string') return where + ' has an import time that is not a time';
  }
  return '';
}
function st_checkSettings(s) {
  if (s === null || s === undefined) return '';
  if (!st_isObj(s)) return 'its settings are not a set of settings';
  // the model cannot place a single column without it, so a bad one would leave every screen blank
  if (!(typeof s.asOf === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(s.asOf))) return 'its Data through month (' + JSON.stringify(s.asOf ?? null) + ') is not a month written YYYY-MM';
  if (s.firstFY !== undefined && !Number.isInteger(s.firstFY)) return 'its First FY is not a year';
  for (const k of ['goals', 'authorized', 'budgets']) if (s[k] !== undefined && !st_isObj(s[k])) return 'its ' + k + ' setting is not a table';
  if (s.special !== undefined && !(Array.isArray(s.special) && s.special.every(x => typeof x === 'string'))) return 'its special CCaRs are not a list of names';
  return '';
}
// THE LAST IMPORT REPORT, in the shapes the Import report view and the workbook's Import Report sheet read. Checked only
// for being an object, a report whose files were text opened normally and then could not be drawn ("fr.notes is not
// iterable"), on the screen and in every export (review IMP-14). Its lists and tables are checked, then the report is
// read once the way those two read it, so whatever it holds that they cannot read is found here, on opening.
const ST_REP_LISTS = ['files', 'subcent', 'unreadable', 'dateUnreadable', 'disagreements', 'alloc', 'notes', 'refusedFiles',
  'ignoredSheets', 'extraOnly', 'strays'];
function st_checkReport(rep) {
  if (rep === null || rep === undefined) return '';
  const no = 'its last import report is not in the shape this page reads (';
  if (!st_isObj(rep)) return no + 'it is not a report)';
  for (const k of ST_REP_LISTS) if (rep[k] !== undefined && !Array.isArray(rep[k])) return no + 'its ' + k + ' is not a list)';
  for (const k of ['byAp', 'conversions', 'trimmedBy']) if (rep[k] !== undefined && !st_isObj(rep[k])) return no + 'its ' + k + ' is not a table)';
  for (const fr of rep.files || []) {
    if (!st_isObj(fr) || !Array.isArray(fr.sheets) || !Array.isArray(fr.notes) || !fr.sheets.every(st_isObj)) return no + 'a file in it is not a file)';
  }
  if (typeof SP.importReportLines === 'function') {
    try { SP.importReportLines(rep); } catch (e) { return no + st_err(e) + ')'; }
  }
  return '';
}
function st_check(st) {
  if (!st_isObj(st)) return 'it is not a saved plan';
  if (st.tool !== ST_TOOL) return 'it was saved by another tool' + (typeof st.tool === 'string' && st.tool ? ' (“' + st.tool + '”)' : '');
  if (st.v !== ST_V) {
    return typeof st.v === 'number' && st.v > ST_V
      ? 'it was saved by a newer version of this tool (format ' + st.v + '; this page reads format ' + ST_V + ')'
      : 'its format (' + JSON.stringify(st.v ?? null) + ') is not one this page reads';
  }
  if (st.savedAt !== null && st.savedAt !== undefined && typeof st.savedAt !== 'string') return 'its save time is not a time';
  if (!st_isObj(st.pulls)) return 'it holds no pulls in the shape this page reads';
  const bad = st_checkPulls(st.pulls.current, 'current') || st_checkPulls(st.pulls.previous, 'previous');
  if (bad) return bad;
  const sb = st_checkSettings(st.settings);
  if (sb) return sb;
  if (st.history !== undefined && !(Array.isArray(st.history) && st.history.every(st_isObj))) return 'its import history is not a list of imports';
  if (st.lastImport !== undefined && st.lastImport !== null && !st_isObj(st.lastImport)) return 'its last import report is not a report';
  if (st_isObj(st.lastImport)) { const rb = st_checkReport(st.lastImport.report); if (rb) return rb; }
  return '';
}

// ---------------------------------------------------------------------------------------------------------------
// CAPTURING THE PAGE. Save writes back the page as it was LOADED, never the page as it is now: by then the UI has drawn
// thousands of rows into #app, and a file saved with them would open showing a frozen screen under the live one. The
// state tag and #app are found by their own serialised text in the capture, so each is replaced exactly where it is.
// ---------------------------------------------------------------------------------------------------------------
function st_capture() {
  if (st_cap) return st_cap;
  const root = document.documentElement;
  const html = '<!DOCTYPE html>\n' + (root ? root.outerHTML : '');
  const cap = { html, stateAt: -1, stateOpen: '', stateLen: 0, appAt: -1, appOpen: '', appLen: 0, boot: ST_BOOT_NOTE };
  const app = document.getElementById('app');
  if (app) {
    const outer = app.outerHTML, inner = app.innerHTML;
    const at = html.indexOf(outer);
    if (at >= 0 && outer.endsWith(inner + '</div>')) {
      cap.appAt = at; cap.appLen = outer.length; cap.appOpen = outer.slice(0, outer.length - inner.length - '</div>'.length);
      // the shell's own boot note, as this browser serialises it, when the capture came before the UI drew
      const kids = [...app.childNodes].filter(n => !(n.nodeType === 3 && !n.textContent.trim()));
      if (kids.length === 1 && kids[0].nodeType === 1 && kids[0].classList && kids[0].classList.contains('boot-note')) cap.boot = inner;
    }
  }
  const tag = document.getElementById('spState');
  if (tag) {
    const outer = tag.outerHTML, text = tag.textContent;
    // searched for after #app, where the shell puts it: the program's own text can never hold a closing script tag
    const at = html.indexOf(outer, cap.appAt >= 0 ? cap.appAt + cap.appLen : 0);
    const close = '<' + '/script>';
    if (at >= 0 && outer.endsWith(text + close)) {
      cap.stateAt = at; cap.stateLen = outer.length; cap.stateOpen = outer.slice(0, outer.length - text.length - close.length);
    }
  }
  st_cap = cap;
  return cap;
}
// JSON with every '<' written as its JSON escape (a backslash, then u003c). Without it a plan event holding a closing
// script tag would end the tag there and truncate the file: the next opening would see half a state, or none.
function st_json(state) { return JSON.stringify(state).replace(/</g, '\\u003c'); }
function st_htmlFor(state) {
  const cap = st_capture();
  const close = '<' + '/script>';
  const tag = '<script id="spState" type="application/json">' + st_json(state) + close;
  let h = cap.html;
  // spliced from the end backwards, so the earlier position still holds after the later one changes length
  const parts = [];
  if (cap.stateAt >= 0) parts.push({ at: cap.stateAt, len: cap.stateLen, text: cap.stateOpen + st_json(state) + close });
  if (cap.appAt >= 0) parts.push({ at: cap.appAt, len: cap.appLen, text: cap.appOpen + cap.boot + '</div>' });
  parts.sort((a, b) => b.at - a.at);
  for (const p of parts) h = h.slice(0, p.at) + p.text + h.slice(p.at + p.len);
  if (cap.stateAt < 0) {
    // a page with no state tag (not one this build writes) still saves its data: the tag goes before the program
    const at = h.search(/<\/body>/i);
    h = at >= 0 ? h.slice(0, at) + tag + '\n' + h.slice(at) : h + tag;
  }
  return h;
}
SP.savedHtml = function savedHtml() { return st_htmlFor(SP.state); };

// ---------------------------------------------------------------------------------------------------------------
// OPENING
// ---------------------------------------------------------------------------------------------------------------
SP.storeInit = function storeInit() {
  // a second call must not capture again: by then the UI has drawn, and the capture is what every Save writes back
  if (st_inited) return { ok: true, message: '' };
  st_inited = true;
  st_capture();
  st_view = st_loadView();
  if (!st_unloadOn && typeof window.addEventListener === 'function') {
    window.addEventListener('beforeunload', st_beforeUnload);
    st_unloadOn = true;
  }
  SP.state = st_empty();
  st_dirty = false; st_base = null; st_baseWhy = ''; st_dlOnly = false; st_refusedRaw = null; st_taken = null; st_copies.clear();
  st_openedAt = new Date().toISOString();
  const tag = document.getElementById('spState');
  const text = tag ? String(tag.textContent || '').trim() : '';
  if (!tag || text === '' || text === 'null') return { ok: true, message: '' };
  let st;
  try { st = JSON.parse(text); }
  catch (e) {
    st_base = ST_REFUSED; st_baseWhy = 'its saved data cannot be read: ' + ((e && e.message) || e); st_refusedRaw = text;
    return { ok: false, message: 'The data saved in this file cannot be read (' + ((e && e.message) || e) + '), so the page opened empty. '
      + 'The file itself is unchanged; Save asks before writing over it.' };
  }
  if (st === null) return { ok: true, message: '' };
  const why = st_check(st);
  if (why) {
    st_base = ST_REFUSED; st_baseWhy = why;
    return { ok: false, message: 'The data saved in this file was not opened: ' + why + '. The page opened empty, and the file itself is '
      + 'unchanged; Save asks before writing over it.' };
  }
  if (!Array.isArray(st.history)) st.history = [];
  if (st.lastImport === undefined) st.lastImport = null;
  if (st.savedAt === undefined) st.savedAt = null;
  SP.state = st;
  st_base = st.savedAt;
  const aps = SP.APS.filter(a => st.pulls.current[a.id]).map(a => a.label);
  return { ok: true, message: (st.savedAt ? 'Opened the plan saved ' + st_when(st.savedAt) : 'Opened the saved plan')
    + (aps.length ? ' (' + st_list(aps) + ').' : '; it holds no pull yet.') };
};
function st_beforeUnload(ev) {
  if (!st_dirty) return undefined;
  // both, because browsers differ in which one they read; the text itself is never shown by a modern browser
  ev.preventDefault();
  ev.returnValue = '';
  return '';
}

// ---------------------------------------------------------------------------------------------------------------
// THE SWITCHES: this browser's view, kept in localStorage and never in the file. Storage may be refused (a private
// window, a locked-down profile, file:// in some browsers): every touch is in a try, and the page works without it.
// ---------------------------------------------------------------------------------------------------------------
function st_defaultView() {
  if (typeof SP.defaultView === 'function') return SP.defaultView();
  const svc = {};
  for (const s of SP.SERVICES.concat([SP.SVC_UNKNOWN])) svc[s] = true;
  return { svc, lane: { disc: true, mand: true } };
}
// only the known switches, only true or false: a stored view from another version cannot add a switch nothing draws
function st_cleanView(v) {
  const out = st_defaultView();
  if (!st_isObj(v)) return out;
  for (const k of Object.keys(out.svc)) if (st_isObj(v.svc) && st_own(v.svc, k) && typeof v.svc[k] === 'boolean') out.svc[k] = v.svc[k];
  for (const k of Object.keys(out.lane)) if (st_isObj(v.lane) && st_own(v.lane, k) && typeof v.lane[k] === 'boolean') out.lane[k] = v.lane[k];
  return out;
}
function st_loadView() {
  let raw = null;
  try { raw = window.localStorage.getItem(ST_VIEW_KEY); } catch (e) { raw = null; }
  if (!raw) return st_defaultView();
  try { return st_cleanView(JSON.parse(raw)); } catch (e) { return st_defaultView(); }
}
SP.getView = function getView() {
  if (!st_view) st_view = st_defaultView();
  return st_clone(st_view);
};
SP.setView = function setView(view) {
  st_view = st_cleanView(view);
  try { window.localStorage.setItem(ST_VIEW_KEY, JSON.stringify(st_view)); } catch (e) { /* the switches still apply to this page */ }
};

// ---------------------------------------------------------------------------------------------------------------
// AN IMPORT (CONTRACT §11): each appropriation in it replaces that appropriation's current pull, and the pull it
// replaces becomes previous (What changed reads the two). Appropriations not in it keep theirs. The unidentified rows
// are handled the same way: they are the import's, so a new import's replace the last import's.
// ---------------------------------------------------------------------------------------------------------------
// approved and obligated per 'ap|fy' over every readable row, whatever the switches or the first FY: what this pull
// held, the figures What changed compares
function st_totals(pulls, settings) {
  const out = {};
  for (const a of SP.APS) {
    const p = pulls[a.id];
    if (!p || !Array.isArray(p.rows)) continue;
    for (const row of p.rows) {
      const d = SP.deriveRow(row, settings);
      if (d.bad || !Number.isInteger(d.fy) || !Number.isSafeInteger(d.cents)) continue;
      const k = a.id + '|' + d.fy;
      const t = out[k] || (out[k] = { approved: 0, obligated: 0 });
      t.approved += d.cents;
      if (d.status === 'exec') t.obligated += d.cents;
    }
  }
  return out;
}
// the readable rows of a pull and their dollars (unreadable rows count in no figure)
function st_readable(p) {
  let rows = 0, cents = 0;
  for (const r of (p && Array.isArray(p.rows) ? p.rows : [])) {
    if (!(r.bad && r.bad.length) && Array.isArray(r.c) && typeof r.c[9] === 'number') { rows++; cents += r.c[9]; }
  }
  return { rows, cents };
}
function st_cents(p) { return st_readable(p).cents; }
function st_usd(c) { return SP.fmtUsd ? SP.fmtUsd(c) : String(c / 100); }
// The same pull, row for row: what each row holds, never where it was read from. A pull imported again (an easy slip in
// a downloads folder) moved the identical current pull into previous and threw away the one What changed compared with,
// while the message said "the pull it replaces is kept for What changed" (review IMP-11).
function st_sameRows(a, b) {
  if (!st_isObj(a) || !st_isObj(b) || !Array.isArray(a.rows) || !Array.isArray(b.rows) || a.rows.length !== b.rows.length) return false;
  if (JSON.stringify(a.headers || null) !== JSON.stringify(b.headers || null)) return false;
  const key = r => JSON.stringify([r.c, r.x || {}, r.bad || null, r.raw || null]);
  for (let i = 0; i < a.rows.length; i++) if (key(a.rows[i]) !== key(b.rows[i])) return false;
  return true;
}
// When the rows whose appropriation is not identified came in: the time a pull carries once it has been kept over a later
// import, else the last import's (they arrive with an import, which leaves them unstamped, as parseFiles gives them).
function st_unidAt(st) {
  const p = st.pulls.current.unidentified;
  if (p && typeof p.importedAt === 'string' && p.importedAt) return p.importedAt;
  const rep = st.lastImport && st_isObj(st.lastImport.report) ? st.lastImport.report : null;
  return rep && typeof rep.importedAt === 'string' ? rep.importedAt : null;
}
// A new pull with fewer than half the readable rows of the one on screen. A CCaR pull of a whole appropriation does not
// halve from one week to the next; one that does is a misfiled row, a file cut short, a pull filtered in CCaR, or Amounts
// saved as formulas without their results. Each of those replaced a 218-row Full Fund pull, or a whole O&M pull, with a
// row or with $0, under a message styled as a plain success, whatever the sheet was called (review SEAM-1, SEAM-2, F1,
// DL-2, F4): the misfiled-row question keyed on the sheet's NAME alone.
const ST_SHRINK = 0.5;
SP.applyImport = function applyImport(parsed) {
  if (!st_isObj(parsed) || !st_isObj(parsed.pulls)) throw new Error('There was nothing to import (the import gave no pulls), so nothing was changed.');
  const keys = Object.keys(parsed.pulls).filter(k => ST_PULL_KEYS.includes(k) && parsed.pulls[k] && Array.isArray(parsed.pulls[k].rows));
  if (!keys.length) throw new Error('The import held no rows, so nothing was changed.');
  if (typeof SP.defaultSettings !== 'function') throw new Error('The model is not loaded (SP.defaultSettings is missing), so nothing was imported.');
  const report = st_isObj(parsed.report) ? parsed.report : {};
  const importedAt = typeof report.importedAt === 'string' && report.importedAt ? report.importedAt : new Date().toISOString();
  const st = SP.state;
  const before = {};
  for (const a of SP.APS) if (st.pulls.current[a.id]) before[a.id] = st.pulls.current[a.id];
  const sheetFor = x => (typeof SP.sheetNamedFor === 'function' ? SP.sheetNamedFor(x) : st_apLabel(x.sheetAp));

  // BEFORE ANYTHING IS REPLACED: an appropriation whose every row sits on a sheet named for another (parseFiles records
  // them: one Full Fund row misfiled on the O&M tab replaced a 40-row Full Fund pull with itself, review IMP-1), and a
  // pull that would leave fewer than half the readable rows of the one it replaces (ST_SHRINK). The person is asked
  // first, as Save asks before writing over a file; declined, nothing changes.
  const strays = (Array.isArray(report.strays) ? report.strays : []).filter(x => st_isObj(x) && keys.includes(x.ap));
  const shrinks = [];
  for (const k of keys) {
    if (k === 'unidentified' || !before[k]) continue;
    const was = st_readable(before[k]), now = st_readable(parsed.pulls[k]);
    if (now.rows < was.rows * ST_SHRINK) shrinks.push({ ap: k, was, now, rows: parsed.pulls[k].rows.length });
  }
  const worry = SP.APS.map(a => a.id).filter(ap => strays.some(x => x.ap === ap) || shrinks.some(x => x.ap === ap));
  if (worry.length) {
    const para = ap => {
      const x = strays.find(y => y.ap === ap), z = shrinks.find(y => y.ap === ap), cur = before[ap], lab = st_apLabel(ap);
      const bits = [];
      let n = 0;
      if (x) {
        n = x.rows;
        bits.push('Every ' + lab + ' row in this import sits on “' + x.file + '” › “' + x.sheet + '”, a sheet named for ' + sheetFor(x) + ': '
          + st_rows(x.rows) + ', ' + st_usd(x.cents) + ', placed as ' + lab + ' by ' + (x.rows === 1 ? 'its' : 'their') + ' Budget name.');
      }
      if (z) {
        n = z.rows;
        const unread = z.rows - z.now.rows;
        bits.push('This import brings ' + st_rows(z.rows) + ' of ' + lab
          + (unread ? (z.now.rows ? ', and only ' + SP.fmtInt(z.now.rows) + ' of them can be read (' + st_usd(z.now.cents) + '): ' + SP.fmtInt(unread)
              : ', and none of them can be read: ' + (unread === 1 ? 'it' : 'all ' + SP.fmtInt(unread))) + ' could not be read (FY or Amount) and would count nowhere'
            : ' (' + st_usd(z.now.cents) + ')')
          + '. That is fewer than half the ' + SP.fmtInt(z.was.rows) + ' readable rows of the ' + lab + ' pull on screen.');
      }
      bits.push(cur ? 'Imported, ' + (n === 1 ? 'it replaces' : 'they replace') + ' the whole current ' + lab + ' pull (' + st_rows(cur.rows.length) + ', '
          + st_usd(st_cents(cur)) + ', imported ' + st_day(cur.importedAt) + ').'
        : 'Imported, ' + (n === 1 ? 'it becomes' : 'they become') + ' the whole ' + lab + ' pull.');
      return bits.join(' ');
    };
    const oneStray = strays.length === 1 && strays[0].rows === 1;
    const adv = [];
    // The advice used to be "move it to the right sheet": an O&M file has no Full Fund sheet, so the person made one, and
    // the row on its own tab replaced the whole Full Fund pull with no question (review SEAM-2). A row of another
    // appropriation is put right by its Budget, or by leaving it out of this file: its own pull is imported whole.
    if (strays.length) adv.push('If ' + (oneStray ? 'that row is' : 'those rows are') + ' misfiled, press Cancel: nothing is imported. Then correct '
      + (oneStray ? 'its' : 'their') + ' Budget, or take ' + (oneStray ? 'it' : 'them') + ' out of this file: a row belongs in its own '
      + 'appropriation’s pull, which is imported whole. Given a sheet of ' + (oneStray ? 'its' : 'their') + ' own in this file, '
      + (oneStray ? 'it' : 'they') + ' would still replace that whole pull.');
    const shrinkOnly = shrinks.filter(z => !strays.some(x => x.ap === z.ap)).map(z => st_apLabel(z.ap));
    if (shrinkOnly.length) adv.push('If ' + (shrinkOnly.length === 1 ? 'this is not the whole ' + shrinkOnly[0] + ' pull' : 'these are not the whole '
      + st_list(shrinkOnly) + ' pulls') + ' (a file cut short, a pull filtered in CCaR, a misfiled row, or Amounts saved as formulas without their '
      + 'results), press Cancel: nothing is imported, and the ' + (shrinkOnly.length === 1 ? 'pull' : 'pulls') + ' on screen stay.');
    const q = worry.map(para).join('\n\n') + '\n\n' + adv.join('\n\n') + '\n\nImport anyway?';
    let yes = false;
    try { yes = typeof window.confirm === 'function' && !!window.confirm(q); } catch (e) { yes = false; }
    if (!yes) {
      const why = worry.map(ap => {
        const x = strays.find(y => y.ap === ap), z = shrinks.find(y => y.ap === ap);
        if (x) return '“' + x.file + '” › “' + x.sheet + '”, a sheet named for ' + sheetFor(x) + ', holds every ' + st_apLabel(ap) + ' row in the import ('
          + st_rows(x.rows) + ', ' + st_usd(x.cents) + ')';
        return 'the import’s ' + st_apLabel(ap) + ' pull has ' + SP.fmtInt(z.now.rows) + ' readable row' + (z.now.rows === 1 ? '' : 's') + ' (' + st_usd(z.now.cents)
          + '), fewer than half the ' + SP.fmtInt(z.was.rows) + ' of the one on screen';
      });
      const w = why.join('; ');
      return { ok: false, message: 'Nothing was imported. ' + w.charAt(0).toUpperCase() + w.slice(1) + ', and you chose not to let ' + (worry.length === 1 ? 'it' : 'those')
        + ' replace ' + st_list(worry.map(ap => 'the ' + st_apLabel(ap) + ' pull')) + '.'
        + (strays.length ? ' If rows are misfiled, correct their Budget, or take them out of this file (each appropriation’s pull is imported whole), and import again.' : '')
        + (shrinkOnly.length ? ' Import the whole ' + st_list(shrinkOnly) + ' pull' + (shrinkOnly.length === 1 ? '' : 's') + ' when you have ' + (shrinkOnly.length === 1 ? 'it' : 'them') + '.' : '') };
    }
  }

  const unidWas = st.pulls.current.unidentified ? { p: st.pulls.current.unidentified, at: st_unidAt(st) } : null;
  const same = [];
  for (const k of keys) {
    const cur = st.pulls.current[k], nw = st_clone(parsed.pulls[k]);
    if (k !== 'unidentified' && cur && st_sameRows(cur, nw)) {
      // An identical pull leaves previous as it was: it is still the one What changed compares with. The new pull is
      // still THIS import's (its date is today's), and it records since when its rows have been on screen: What changed
      // went on showing last week's changes under "the last two pulls" as if this week's pull had brought them (review BP-1).
      same.push(k);
      const since = typeof cur.sameSince === 'string' && cur.sameSince ? cur.sameSince : cur.importedAt;
      if (typeof since === 'string' && since) nw.sameSince = since;
    } else if (cur) st.pulls.previous[k] = cur;
    st.pulls.current[k] = nw;
  }
  // THE ROWS WHOSE APPROPRIATION IS NOT IDENTIFIED stay as long as a pull the same import brought is on screen. They
  // used to go whenever an import held none: an import of Full Fund alone took away the rows of the very file O&M,
  // Spares and OPN still came from, and nothing said so (review SEAM-3). Once every pull their import brought has been
  // replaced, they go to previous, so the Summary never names rows of a file nothing on screen came from (review R6);
  // either way the message says what became of them.
  let unidSaid = '';
  if (!keys.includes('unidentified') && unidWas) {
    const stays = !!unidWas.at && SP.APS.some(a => !keys.includes(a.id) && st.pulls.current[a.id] && st.pulls.current[a.id].importedAt === unidWas.at);
    const n = Array.isArray(unidWas.p.rows) ? unidWas.p.rows.length : 0;
    const from = unidWas.at ? 'from the import of ' + st_day(unidWas.at) : 'from an earlier import';
    if (stays) {
      unidWas.p.importedAt = unidWas.at;
      if (n) unidSaid = 'The ' + st_rows(n) + ' whose appropriation was not identified, ' + from + ', ' + (n === 1 ? 'stays' : 'stay')
        + ' with the pulls it brought that are still on screen (see the Import report).';
    } else {
      st.pulls.previous.unidentified = unidWas.p;
      delete st.pulls.current.unidentified;
      if (n) unidSaid = 'The ' + st_rows(n) + ' whose appropriation was not identified, ' + from + ', ' + (n === 1 ? 'is' : 'are')
        + ' no longer on screen: every pull that import brought has now been replaced.';
    }
  }
  // The settings a person chose stay; only Data through follows the new pull (CONTRACT §4.1). An import that placed no
  // row in any appropriation brings no pull, so it leaves Data through where the person set it (review IMP-12).
  const aps = SP.APS.filter(a => keys.includes(a.id)).map(a => a.id);
  const def = SP.defaultSettings(importedAt);
  const first = !st_isObj(st.settings);
  const was = first ? null : st.settings.asOf;
  const moveAsOf = first || aps.length > 0;
  st.settings = first ? def : moveAsOf ? Object.assign({}, st.settings, { asOf: def.asOf }) : st.settings;
  st.history.push({ importedAt, aps, totals: st_totals(st_pick(st.pulls.current, aps), st.settings) });
  st.lastImport = { report: st_clone(report) };
  st_changed();

  // what the person needs to know, in the order they need it. A refused file, rows that count nowhere and dates that could
  // not be read used to reach the Import report only, while the message line read as a clean success (review IMP-4, IMP-9).
  // Rows that count nowhere make it a warning too: an import whose every Amount was unreadable put an appropriation at $0
  // in a green message (review F4, DL-2).
  const said = [];
  let warn = false;
  if (aps.length) {
    said.push('Imported ' + st_list(aps.map(ap => st_apLabel(ap) + ' (' + st_rows(st.pulls.current[ap].rows.length) + ')')) + '.');
  } else said.push('No row in this import could be placed in an appropriation.');
  const refused = (Array.isArray(report.refusedFiles) ? report.refusedFiles : []).filter(st_isObj);
  for (const f of refused) {
    warn = true;
    said.push('“' + f.file + '” was refused, so nothing in it was imported: ' + String(f.why).replace(/\.\s*$/, '') + '.');
  }
  for (const x of strays) {
    warn = true;
    said.push('Check: every ' + st_apLabel(x.ap) + ' row came from “' + x.file + '” › “' + x.sheet + '”, a sheet named for ' + sheetFor(x)
      + ' (' + st_rows(x.rows) + ', ' + st_usd(x.cents) + '), and ' + (x.rows === 1 ? 'it is' : 'they are') + ' now the whole ' + st_apLabel(x.ap) + ' pull.');
  }
  for (const z of shrinks) {
    warn = true;
    said.push('Check: the ' + st_apLabel(z.ap) + ' pull now has ' + SP.fmtInt(z.now.rows) + ' readable row' + (z.now.rows === 1 ? '' : 's') + ' (' + st_usd(z.now.cents)
      + '), where the pull it replaced had ' + SP.fmtInt(z.was.rows) + ' (' + st_usd(z.was.cents) + ').');
  }
  const replaced = aps.filter(ap => before[ap] && !same.includes(ap));
  if (replaced.length) said.push('The ' + st_list(replaced.map(st_apLabel)) + ' pull' + (replaced.length === 1 ? ' it replaces is' : 's it replaces are')
    + ' kept for What changed.');
  // "the earlier pull What changed compares with is kept" was said of a pull imported twice into a page that held no
  // earlier pull at all, and What changed then said "Only one pull so far" (review SEAM-6, F10, SCR2-6, BP-5)
  const sameWith = same.filter(k => st.pulls.previous[k]), sameAlone = same.filter(k => !st.pulls.previous[k]);
  const sameLead = ks => 'The ' + st_list(ks.map(st_apLabel)) + ' pull' + (ks.length === 1 ? ' is the same as the one' : 's are the same as the ones') + ' on screen, row for row';
  if (sameWith.length) said.push(sameLead(sameWith) + ', so What changed still compares ' + (sameWith.length === 1 ? 'it' : 'each')
    + ' with the pull before it, and says nothing changed since.');
  if (sameAlone.length) said.push(sameLead(sameAlone) + '; there is no earlier ' + (sameAlone.length === 1 ? 'pull' : 'pull of ' + (sameAlone.length === 2 ? 'either' : 'any'))
    + ' for What changed to compare with yet.');
  const kept = SP.APS.filter(a => before[a.id] && !aps.includes(a.id));
  if (kept.length) {
    const byDay = new Map();
    for (const a of kept) {
      const d = st_day(before[a.id].importedAt) || 'an unknown date';
      if (!byDay.has(d)) byDay.set(d, []);
      byDay.get(d).push(a.label);
    }
    said.push([...byDay].map(([d, l]) => st_list(l) + ' keep' + (l.length === 1 ? 's its pull' : ' their pulls') + ' of ' + d).join('; ') + '.');
  }
  if (unidSaid) said.push(unidSaid);
  const unread = aps.map(ap => [ap, st.pulls.current[ap].rows.filter(r => r.bad && r.bad.length).length]).filter(([, n]) => n);
  if (unread.length) {
    warn = true;
    const n = unread.reduce((a, [, k]) => a + k, 0);
    said.push(st_list(unread.map(([ap, k]) => SP.fmtInt(k) + ' ' + st_apLabel(ap))) + ' row' + (n === 1 ? '' : 's')
      + ' could not be read (FY or Amount): ' + (n === 1 ? 'it is' : 'they are') + ' kept and counted nowhere (see the Import report).');
  }
  const db = (Array.isArray(report.dateUnreadable) ? report.dateUnreadable : []).filter(st_isObj);
  const dDate = db.filter(d => d.column === 'Date').length, dMonth = db.filter(d => d.column === 'Month').length;
  if (dDate) said.push(st_rows(dDate) + ' ' + (dDate === 1 ? 'has a Date' : 'have a Date') + ' that could not be read: ' + (dDate === 1 ? 'it is' : 'they are')
    + ' in the No date column (see the Import report for the dates it reads).');
  if (dMonth) said.push(SP.fmtInt(dMonth) + ' Month value' + (dMonth === 1 ? '' : 's') + ' could not be read (see the Import report).');
  const un = keys.includes('unidentified') ? parsed.pulls.unidentified.rows.length : 0;
  if (un) {
    warn = true;
    said.push(st_rows(un) + ' whose appropriation was not identified ' + (un === 1 ? 'is' : 'are') + ' kept apart and counted nowhere (see the Import report).');
  }
  const lab = v => (SP.asOfLabel ? SP.asOfLabel(v) : v);
  if (moveAsOf) {
    said.push('Data through ' + (first ? 'set' : 'reset') + ' to ' + lab(def.asOf) + ', the last full month before this import'
      + (!first && was && was !== def.asOf ? ' (it was ' + lab(was) + ')' : '') + '; change it at the top if the pull runs later.');
  } else said.push('Data through stays ' + lab(was) + ': no pull came in to move it.');
  return { ok: true, warn, message: said.join(' ') };
};
function st_pick(current, aps) {
  const o = {};
  for (const ap of aps) o[ap] = current[ap];
  return o;
}

// TAKING A SAVED PLAN INTO THIS PAGE. Each copy of the tool holds its own data, so a plan could not reach a new or fixed
// copy: Import refused the .html as a "truncated" workbook, and re-importing the tool's own Excel export lost the
// Authorized entries, the special CCaRs, goal edits, budget overrides, the earlier pulls, the history and the unidentified
// rows (review IMP-7). The whole state is read from the file, checked exactly as an opening checks it, and becomes this
// page's, after a question when the page holds a plan or unsaved work. Every derived field is worked out again by THIS
// copy's rules (CONTRACT §3). This page's own file is not touched: Save writes it, through the same checks as ever.
//   text  the saved plan's HTML;  name  its file name, for the messages
SP.takePlan = function takePlan(text, name) {
  const fname = String(name || 'that file');
  const f = st_readFile(text);
  if (f.why) return { ok: false, message: 'Nothing was taken: “' + fname + '” ' + f.why + '.' };
  if (!f.state) return { ok: false, message: 'Nothing was taken: “' + fname + '” is an SFCB Spend Plan file with no plan saved in it.' };
  const why = st_check(f.state);
  if (why) return { ok: false, message: 'Nothing was taken from “' + fname + '”: ' + why + '.' };
  const inc = f.state;
  const aps = SP.APS.filter(a => inc.pulls.current[a.id]).map(a => a.label);
  if (!aps.length) return { ok: false, message: 'Nothing was taken: the plan in “' + fname + '” holds no pull.' };
  const st = SP.state;
  const mine = SP.APS.filter(a => st.pulls.current[a.id]).map(a => a.label);
  const saved = inc.savedAt ? ', saved ' + st_when(inc.savedAt) : '';
  if (mine.length || st_dirty) {
    const q = 'This page holds ' + (mine.length ? 'a plan (' + st_list(mine) + ')' : 'work') + (st_dirty ? ' with unsaved changes' : '') + '.\n\n'
      + 'Taking the plan in “' + fname + '” (' + st_list(aps) + saved + ') replaces it on this page: its pulls, earlier pulls, import '
      + 'history, settings and last import report. This page’s own file is not changed until you Save.\n\nTake it?';
    let yes = false;
    try { yes = typeof window.confirm === 'function' && !!window.confirm(q); } catch (e) { yes = false; }
    if (!yes) return { ok: false, message: 'Nothing was taken: you chose to keep this page’s plan, and “' + fname + '” was not read into it.' };
  }
  const next = st_clone(inc);
  if (!Array.isArray(next.history)) next.history = [];
  if (next.lastImport === undefined) next.lastImport = null;
  // the save time stays this page's: it is what this page's own file holds, and what Save checks that file against
  next.savedAt = st.savedAt === undefined ? null : st.savedAt;
  SP.state = next;
  // A file that holds the very plan taken holds nothing this page lacks: Save told the person that plan "is not the one
  // on screen", or was saved "by someone else", and "is lost" (review SEAM-4). Remembered until this page saves.
  st_taken = { at: typeof inc.savedAt === 'string' && inc.savedAt ? inc.savedAt : null, name: fname };
  st_changed();
  return { ok: true, message: 'Took the plan in “' + fname + '” (' + st_list(aps) + saved + '): its pulls, earlier pulls, import history, '
    + 'settings and last import report. Its figures are worked out by this copy of the tool. Save to keep it in this page’s file.' };
};

// ---------------------------------------------------------------------------------------------------------------
// SETTINGS (saved in the file, so a change is unsaved work)
// ---------------------------------------------------------------------------------------------------------------
SP.setSettings = function setSettings(patch) {
  if (!st_isObj(patch)) return;
  const st = SP.state;
  const base = st_isObj(st.settings) ? st.settings
    : (typeof SP.defaultSettings === 'function' ? SP.defaultSettings(new Date().toISOString()) : {});
  const next = Object.assign({}, base, st_clone(patch));
  if (JSON.stringify(next) === JSON.stringify(st.settings)) return;   // nothing changed: nothing to save
  st.settings = next;
  st_changed();
};
SP.isDirty = function isDirty() { return st_dirty; };
SP.onStateChange = function onStateChange(fn) {
  if (typeof fn !== 'function') return () => {};
  st_subs.push(fn);
  return () => { const i = st_subs.indexOf(fn); if (i >= 0) st_subs.splice(i, 1); };
};

// ---------------------------------------------------------------------------------------------------------------
// SAVING. The first Save in a page goes through the browser's OPEN window: a file picked there is read and checked
// before anything is written, where a Save window empties the file the moment it is picked (measured in Chromium for
// ORBIT, v2.14), so one wrong pick would lose a plan. A file that cannot be read, is not this tool, or holds another
// tool's data is never written over. One saved by someone else since this page last read or wrote it is written over
// only after the person says so.
// ---------------------------------------------------------------------------------------------------------------
const ST_TYPES = name => [{ description: 'SFCB Spend Plan — pick this file: ' + name, accept: { 'text/html': ['.html', '.htm'] } }];
// the file's text -> {state} (null when it holds none) or {why}: why it must not be written over. raw is the saved-data
// text as written, when there is a place for it: what tells the very data this page could not read from any other.
function st_readFile(txt) {
  if (typeof txt !== 'string' || !/<meta\s+name=["']?sfcb-spend-plan["'\s>]/i.test(txt)) return { why: 'is not an SFCB Spend Plan file' };
  const m = /<script\b[^>]*\bid=["']?spState["']?[^>]*>([\s\S]*?)<\/script\s*>/i.exec(txt);
  if (!m) return { why: 'is an SFCB Spend Plan page with no place for its data' };
  const raw = m[1].trim();
  let st;
  try { st = JSON.parse(raw || 'null'); } catch (e) { return { why: 'holds saved data that cannot be read', raw, unreadable: true }; }
  if (st === null) return { state: null, raw };
  if (!st_isObj(st)) return { why: 'holds saved data that is not a plan', raw };
  if (st.tool !== ST_TOOL) return { why: 'holds data saved by another tool', raw };
  return { state: st, raw };
}
function st_abortish(e) { return !!e && (e.name === 'AbortError'); }
function st_err(e) { return (e && e.message) || String(e); }
async function st_write(h, html) {
  const w = await h.createWritable();
  try { await w.write(html); await w.close(); }
  catch (e) { try { await w.abort(); } catch (e2) {} throw e; }
}
// -> {ok, asked}: asked when the browser had to put its own question ("Save changes to …?"), which can stay open as long
// as the person leaves it
async function st_permit(h) {
  let p = 'granted', asked = false;
  try {
    if (typeof h.queryPermission === 'function') p = await h.queryPermission({ mode: 'readwrite' });
    if (p !== 'granted' && typeof h.requestPermission === 'function') { asked = true; p = await h.requestPermission({ mode: 'readwrite' }); }
  } catch (e) { p = 'denied'; }
  return { ok: p === 'granted', asked };
}
function st_saved(now, gen, h) {
  SP.state.savedAt = now;
  st_base = now; st_baseWhy = ''; st_refusedRaw = null; st_taken = null;
  if (h) st_handle = h;
  if (gen === st_gen) { st_dirty = false; st_dlOnly = false; }   // an edit made while the file was being written is still unsaved
  st_fire();
}
// A Save that could only download: the work is in the download, not in this page's own file, until someone puts the
// download in its place. Marked clean, the page read "Saved" and let the tab close without a question while the file
// it was opened from still lacked the work (review S8). It stays unsaved, and says it was downloaded. This page's own
// file still holds what it held, so Save's check is still made against that (st_base does not move); the download's
// save time is remembered, so a download put in place reads as this page's own work, never "someone else's".
function st_downloaded(now, gen, name) {
  SP.state.savedAt = now;
  st_copies.set(now, name);
  if (gen === st_gen) st_dlOnly = true;
  st_fire();
}
// 'saved' | 'unsaved' | 'downloaded' (unsaved, but the last Save downloaded every change): what the top bar says
SP.saveStatus = function saveStatus() { return !st_dirty ? 'saved' : st_dlOnly ? 'downloaded' : 'unsaved'; };
// What a download is called is the browser's to decide: one that already holds the name adds a number ("… (1).html" in
// Chromium, "…(1).html" in Firefox). The message named the asked-for name, so following it put an OLDER download in place
// of the shared file (review DL-7).
function st_dlName(got) {
  return '“' + got + '” (or, if your downloads folder already holds that name, the newest download with a number added, such as “'
    + String(got).replace(/(\.html?)$/i, ' (1)$1') + '”)';
}

// WHERE WRITING IS REFUSED (a policy or site setting that blocks file editing, or a frame where the file windows throw),
// the work could not be kept at all: Save and Save a copy… each said so and offered nothing, and the settings typed into
// the page (Authorized, goals, special CCaRs, overrides) live nowhere else (review DL-4). A download is offered instead.
//   lead  'Not saved' / 'No copy was saved';  reason  why, as a clause;  name  the download's name;  own  the file it replaces
// -> the name downloaded under, or null when the person declined
function st_offerDownload(lead, reason, html, name, own) {
  const q = lead + ': ' + reason + '.\n\nDownload ' + (own ? 'the plan' : 'the copy') + ' instead, so this work is kept? The download is this page '
    + 'with the work in it' + (own ? '; put it in place of “' + own + '” to keep the work there.' : '.');
  let yes = false;
  try { yes = typeof window.confirm === 'function' && !!window.confirm(q); } catch (e) { yes = false; }
  return yes ? SP.download(name, html, 'text/html') : null;
}

SP.saveFile = async function saveFile() {
  if (st_busy) return { ok: false, message: 'A save is already running; nothing else was written.' };
  st_busy = true;
  try { return await st_saveFile(); }
  catch (e) { return { ok: false, message: 'Not saved: ' + st_err(e) + '. Nothing was written.' }; }
  finally { st_busy = false; }
};
async function st_readText(h) { return (await h.getFile()).text(); }
async function st_saveFile() {
  const name = st_pageName();
  const html0 = () => { const now = new Date().toISOString(); return { now, gen: st_gen, html: st_htmlFor(Object.assign({}, SP.state, { savedAt: now })) }; };
  // a download in place of a write the browser refused: the page stays unsaved and says it was downloaded
  const fallback = (reason) => {
    const w = html0();
    const got = st_offerDownload('Not saved', reason, w.html, name, name);
    if (got === null) return null;
    st_downloaded(w.now, w.gen, got);
    return { ok: true, message: 'The plan could not be saved to its file: ' + reason + '. It was downloaded instead, as ' + st_dlName(got) + '. The shared '
      + 'copy is not updated until you put the download in its place (replace “' + name + '” with it). Until then this page counts the work as '
      + 'unsaved, and asks before it is closed.' };
  };
  if (typeof window.showOpenFilePicker !== 'function') {
    // no way to write a file in place: the page is downloaded under its own name, and the person puts it in place
    const w = html0();
    const got = SP.download(name, w.html, 'text/html');
    st_downloaded(w.now, w.gen, got);
    return { ok: true, message: 'This browser cannot write to the file directly, so the plan was downloaded as ' + st_dlName(got) + '. '
      + 'The shared copy is not updated until you put the download in its place (replace “' + name + '” with it). '
      + 'Until then this page counts the work as unsaved, and asks before it is closed.' };
  }
  let h = st_handle, picked = false;
  if (!h) {
    st_say('Save: in the window that opened, pick this file — “' + name + '”, the one this page was opened from. Picking it changes '
      + 'nothing until it has been checked.');
    let hs;
    try { hs = await window.showOpenFilePicker({ multiple: false, types: ST_TYPES(name) }); }
    catch (e) {
      if (st_abortish(e)) return { ok: false, message: 'Not saved: no file was picked. Save again and pick “' + name + '”, the file this page was opened from.' };
      const why = 'the file window could not open (' + st_err(e) + ')';
      return fallback(why) || { ok: false, message: 'Not saved: ' + why + '. Nothing was written.' };
    }
    h = hs && hs[0];
    if (!h) return { ok: false, message: 'Not saved: no file was picked. Save again and pick “' + name + '”.' };
    picked = true;
  }
  const fname = h.name || name;
  const own = st_pageNameKnown();
  const other = picked && !!own && !st_sameName(fname, own);
  const cantRead = e => {
    // a file that cannot be read cannot be checked, so it is never written over; a remembered one that has gone is forgotten
    if (!picked && e && e.name === 'NotFoundError') st_handle = null;
    return { ok: false, message: 'Not saved: “' + fname + '” could not be read (' + st_err(e) + '), so it was not written over. '
      + (e && e.name === 'NotFoundError' ? 'Save again and pick where the file is now.' : 'If it is syncing, try again in a moment, or use Save a copy….') };
  };
  let txt;
  try { txt = await st_readText(h); } catch (e) { return cantRead(e); }
  // THE FILE IS CHECKED, THE PERSON MAY BE ASKED, THE BROWSER MAY ASK FOR WRITE ACCESS, and then the file is read AGAIN:
  // a colleague's save made while the question or the browser's own prompt was open was written over with no question,
  // and their page still read "Saved" (review DL-3). If it changed, the checks start again on what it holds now.
  let permitted = false, changedNote = '', blankOk = false, w = null;
  for (let round = 0; ; round++) {
    let waited = false;      // a question or the browser's own prompt was open: the file is read again before writing
    const f = st_readFile(txt);
    // the very data this page could not read on opening: written over only after the person says so, as data the page
    // refused for its shape always was (review DL-6: every Save refused it and sent the person to pick it again)
    const refusedRaw = !!f.unreadable && st_base === ST_REFUSED && st_refusedRaw !== null && f.raw === String(st_refusedRaw).trim();
    if (f.why && !refusedRaw) {
      if (!picked) st_handle = null;      // the next Save asks which file, rather than failing here again
      const ownName = st_sameName(fname, name);
      return { ok: false, message: changedNote + 'Not saved: “' + fname + '” ' + f.why + ', so it was not written over. '
        + (ownName ? 'If it is the file this page was opened from, use Save a copy… to keep this work, and put the copy in its place.'
          : 'Save again and pick “' + name + '”, the file this page was opened from, or use Save a copy….') };
    }
    const fs = refusedRaw ? null : f.state, fsAt = fs && typeof fs.savedAt === 'string' ? fs.savedAt : null;
    // the data this page refused on opening is still there (whatever its save time says, even none): never written over unasked
    const refusedHere = refusedRaw || (st_base === ST_REFUSED && !!fs && st_check(fs) !== '');
    // A FILE OTHER THAN THIS PAGE'S OWN, picked in the window that asked for this one. It is said in the question, never
    // left to a save time: an older plan of another team's read "saved … after this page was opened — by someone else, or in
    // another window", and OK wrote this page over it and remembered it for every later Save (review S1). A remembered file
    // was picked and confirmed already, and a page whose address names no file has nothing to compare it with.
    // Files this page wrote itself, and the plan it took, are not someone else's saves (review SEAM-4, SEAM-5).
    const copyName = fsAt !== null && st_copies.has(fsAt) ? st_copies.get(fsAt) : null;
    const tookIt = fsAt !== null && !!st_taken && st_taken.at === fsAt;
    const timed = !refusedHere && !!fs && fsAt !== null && fsAt !== st_base && copyName === null && !tookIt;
    // A PAGE THAT OPENED A SAVED PLAN was not opened from a file that holds none. A copy of the tool of the same name in
    // another folder (a Downloads folder, say) was written to with no question, the page read "Saved" and let the tab
    // close, and the shared file it came from never got the work (review DL-1).
    const blankElse = picked && !refusedHere && !fs && (typeof st_base === 'string' || st_base === ST_REFUSED);
    if (refusedHere || timed || other || blankElse) {
      const said = [];
      if (changedNote) said.push(changedNote.trim());
      if (other) said.push('You picked “' + fname + '”, not “' + own + '”, the file this page was opened from.');
      let after = false;
      if (refusedHere) {
        said.push('This page opened empty because the data saved in “' + fname + '” was not opened (' + (st_baseWhy || (fs ? st_check(fs) : ''))
          + ').\n\nSaving now writes over that data' + (fsAt ? ', saved ' + st_when(fsAt) : '') + ', and it is lost. Write over it?');
      } else if (timed) {
        // which came first is worked out, never assumed: the question used to call every other save time "after"
        const mine = typeof st_base === 'string' ? st_base : null;
        const ref = mine || st_openedAt;
        after = !!ref && Date.parse(fsAt) > Date.parse(ref);
        const [tf, tr] = ref ? st_whenPair(fsAt, ref) : [st_when(fsAt), ''];
        const who = other ? '' : after ? ' — by someone else, or in another window' : '';
        if (mine) {
          // "an older copy put back" invited OK; a same-named copy in another folder is the likelier file (review DL-1)
          said.push('“' + fname + '” holds a plan saved ' + tf + (after ? ', after this page last opened or saved its plan (' + tr + ')' + who + '.'
            : ', before the plan this page opened or last saved (' + tr + ')' + (other ? '.' : ': it is not the file this page last saved, but an older copy '
              + 'of it, or another plan saved under this name, perhaps in another folder.')));
        } else {
          said.push('“' + fname + '” holds a plan saved ' + tf + (after ? ', after this page was opened (' + tr + ')' + who + '.'
            : (ref ? ', before this page was opened (' + tr + ')' : '') + '. This page opened with no saved plan, so that plan is not the one on screen.'));
        }
        if (st_taken) said.push('(This page took the plan in “' + st_taken.name + '”' + (st_taken.at ? ', saved ' + st_when(st_taken.at) : '') + '; this is another.)');
        said.push('\nSaving now writes this page’s plan over it, and the plan saved in it is lost. Write over it?');
      } else if (copyName !== null) {
        said.push('It holds a copy of this page’s own work, saved ' + st_when(fsAt) + ' as “' + copyName + '”. Save this page’s plan into “' + fname + '” instead? '
          + 'This page then saves to “' + fname + '” until it is closed.');
      } else if (tookIt) {
        said.push('It holds the plan this page took from “' + st_taken.name + '”. Save this page’s plan into “' + fname + '” instead? This page then saves to “'
          + fname + '” until it is closed.');
      } else if (!fs) {
        if (other) said.push('It holds no saved plan. Save this page’s plan into “' + fname + '” instead? This page then saves to “' + fname + '” until it is closed.');
        else {
          said.push('“' + fname + '” holds no saved plan, but this page opened ' + (typeof st_base === 'string' ? 'the plan saved ' + st_when(st_base) : 'saved data it could not read')
            + ', so this is not the file this page was opened from: it may be another copy of the tool with the same name, in another folder (a Downloads '
            + 'folder, say). Save this page’s plan into it instead? This page then saves to it until it is closed, and the file it was opened from does not get this work.');
        }
      } else {
        said.push('It holds the same save as this page (' + st_when(fsAt) + '). Save this page’s plan into “' + fname + '” instead? This page then saves to “'
          + fname + '” until it is closed.');
      }
      if (!window.confirm(said.join('\n'))) {
        return { ok: false, message: changedNote + (refusedHere
          ? 'Not saved: you chose not to write over the data in “' + fname + '” that this page could not open. Nothing was written. To keep this work, use Save a copy…'
          : other
            ? 'Not saved: you chose not to write to “' + fname + '”, which is not “' + own + '”, the file this page was opened from. Nothing was written. '
              + 'Save again and pick “' + own + '”, or use Save a copy….'
            : timed
              ? 'Not saved: “' + fname + '” holds a plan saved ' + st_when(fsAt) + (after ? ' by someone else' : '') + ', and you chose not to write over it. '
                + 'Nothing was written. To keep both, use Save a copy…; to see ' + (after ? 'theirs' : 'it') + ', open the file.'
              : 'Not saved: “' + fname + '” holds no saved plan, so it is not the file this page was opened from, and you chose not to write to it. '
                + 'Nothing was written. Save again and pick the file this page was opened from, or use Save a copy….') };
      }
      blankOk = blankElse;
      waited = true;
    }
    if (!permitted) {
      const pm = await st_permit(h);
      if (!pm.ok) {
        const why = 'writing to “' + fname + '” was not allowed';
        return fallback(why) || { ok: false, message: 'Not saved: ' + why + '. Nothing was written.' };
      }
      permitted = true;
      if (pm.asked) waited = true;
    }
    w = html0();
    if (!waited) break;
    let txt2;
    try { txt2 = await st_readText(h); } catch (e) { return cantRead(e); }
    if (txt2 === txt) break;
    if (round >= 2) return { ok: false, message: 'Not saved: “' + fname + '” kept changing while this page was saving it (someone else is saving it now). '
      + 'Nothing was written. Try again in a moment, or use Save a copy….' };
    txt = txt2;
    changedNote = '“' + fname + '” was saved again while you were answering. ';
  }
  try { await st_write(h, w.html); }
  catch (e) {
    const why = '“' + fname + '” could not be written (' + st_err(e) + ')';
    return fallback(why) || { ok: false, message: 'Not saved: ' + why + '. Use Save a copy… to keep the work.' };
  }
  st_saved(w.now, w.gen, h);
  return { ok: true, message: 'Saved to “' + fname + '” at ' + st_when(w.now).slice(11) + '.'
    + (own && !st_sameName(fname, own) ? ' This page saves there until it is closed; “' + own + '”, the file it was opened from, does not have this work.'
      : blankOk ? ' This page saves there until it is closed; the file it was opened from does not have this work.' : '') };
}

SP.saveCopy = async function saveCopy() {
  if (st_busy) return { ok: false, message: 'A save is already running; nothing else was written.' };
  st_busy = true;
  try { return await st_saveCopy(); }
  catch (e) { return { ok: false, message: 'The copy was not saved: ' + st_err(e) + '.' }; }
  finally { st_busy = false; }
};
async function st_saveCopy() {
  const suggested = st_copyName();
  const now = new Date().toISOString(), gen = st_gen;
  const html = st_htmlFor(Object.assign({}, SP.state, { savedAt: now }));
  const dl = reason => {
    const got = st_offerDownload('No copy was saved', reason, html, suggested, '');
    if (got === null) return null;
    st_copies.set(now, got);
    return { ok: true, message: 'The copy could not be written to a file: ' + reason + '. It was downloaded instead, as ' + st_dlName(got) + '. This page still saves to “'
      + st_pageName() + '”.' };
  };
  if (typeof window.showSaveFilePicker !== 'function') {
    const got = SP.download(suggested, html, 'text/html');
    st_copies.set(now, got);
    return { ok: true, message: 'A copy was downloaded as ' + st_dlName(got) + '. This page still saves to “' + st_pageName() + '”.' };
  }
  let h;
  try {
    h = await window.showSaveFilePicker({ suggestedName: suggested,
      types: [{ description: 'SFCB Spend Plan (a new file)', accept: { 'text/html': ['.html', '.htm'] } }] });
  } catch (e) {
    if (st_abortish(e)) return { ok: false, message: 'No copy was saved: no file name was given.' };
    const why = 'the file window could not open (' + st_err(e) + ')';
    return dl(why) || { ok: false, message: 'No copy was saved: ' + why + '.' };
  }
  const cname = h.name || suggested;
  try { await st_write(h, html); }
  catch (e) {
    const why = '“' + cname + '” could not be written (' + st_err(e) + ')';
    return dl(why) || { ok: false, message: 'No copy was saved: ' + why + '.' };
  }
  st_copies.set(now, cname);
  // a copy written over this page's own file IS a save of it; anywhere else, this page's own file still lacks the work
  let own = false;
  if (st_handle && typeof h.isSameEntry === 'function') { try { own = await h.isSameEntry(st_handle); } catch (e) { own = false; } }
  if (own) { st_saved(now, gen, st_handle); return { ok: true, message: 'Saved to “' + cname + '” (this page’s own file).' }; }
  // Before the first Save this page holds no handle to its own file, so a copy given its file's name cannot be told from
  // a file of that name in another folder. It said "which does not have this work yet" of a file that had it (review
  // SEAM-5, DL-5, BP-7). It is never taken for the page's own on its name alone (marked saved, the page would let the tab
  // close while its real file lacked the work): the message says what is known, and Save no longer calls it someone else's.
  const pn = st_pageNameKnown();
  if (!st_handle && pn && st_sameName(cname, pn)) {
    return { ok: true, message: 'Saved a copy as “' + cname + '”, the name of this page’s own file. If it IS that file, it now has this work; '
      + 'this page cannot tell, so it still counts the work as unsaved. Save, and pick “' + pn + '”, to make sure: it will not ask about this copy.' };
  }
  return { ok: true, message: 'Saved a copy as “' + cname + '”. This page still saves to “' + st_pageName() + '”'
    + (st_dirty ? ', which does not have this work yet: use Save for that.' : '.') };
}
