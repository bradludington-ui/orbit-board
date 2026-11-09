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
let st_busy = false;
let st_inited = false;
let st_cap = null;               // the page as captured at boot: {html, stateAt, stateLen, stateOpen, appAt, appLen, appOpen, boot}
let st_view = null;
let st_unloadOn = false;
const st_subs = [];

function st_changed() {
  st_gen++;
  st_dirty = true;
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
  st_dirty = false; st_base = null; st_baseWhy = '';
  const tag = document.getElementById('spState');
  const text = tag ? String(tag.textContent || '').trim() : '';
  if (!tag || text === '' || text === 'null') return { ok: true, message: '' };
  let st;
  try { st = JSON.parse(text); }
  catch (e) {
    st_base = ST_REFUSED; st_baseWhy = 'its saved data cannot be read';
    return { ok: false, message: 'The data saved in this file cannot be read (' + ((e && e.message) || e) + '), so the page opened empty. '
      + 'The file itself is unchanged; Save will not write over data it cannot read.' };
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
  for (const k of keys) {
    if (st.pulls.current[k]) st.pulls.previous[k] = st.pulls.current[k];
    st.pulls.current[k] = st_clone(parsed.pulls[k]);
  }
  // The unidentified rows are the import's, not an appropriation's: an import that holds none replaces the last one's
  // with none. Kept, they outlived it, and the Summary went on naming them and sending the reader to an Import report
  // (the new import's) that does not list them (review R6).
  if (!keys.includes('unidentified') && st.pulls.current.unidentified) {
    st.pulls.previous.unidentified = st.pulls.current.unidentified;
    delete st.pulls.current.unidentified;
  }
  // the settings a person chose stay; only Data through follows the new pull (CONTRACT §4.1)
  const def = SP.defaultSettings(importedAt);
  const first = !st_isObj(st.settings);
  const was = first ? null : st.settings.asOf;
  st.settings = first ? def : Object.assign({}, st.settings, { asOf: def.asOf });
  const aps = SP.APS.filter(a => keys.includes(a.id)).map(a => a.id);
  st.history.push({ importedAt, aps, totals: st_totals(st_pick(st.pulls.current, aps), st.settings) });
  st.lastImport = { report: st_clone(report) };
  st_changed();

  // what the person needs to know, in the order they need it
  const said = [];
  if (aps.length) {
    said.push('Imported ' + st_list(aps.map(ap => st_apLabel(ap) + ' (' + st_rows(st.pulls.current[ap].rows.length) + ')')) + '.');
  } else said.push('No row in this import could be placed in an appropriation.');
  const replaced = aps.filter(ap => before[ap]);
  if (replaced.length) said.push('The ' + st_list(replaced.map(st_apLabel)) + ' pull' + (replaced.length === 1 ? ' it replaces is' : 's it replaces are')
    + ' kept for What changed.');
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
  const un = keys.includes('unidentified') ? parsed.pulls.unidentified.rows.length : 0;
  if (un) said.push(st_rows(un) + ' whose appropriation was not identified ' + (un === 1 ? 'is' : 'are') + ' kept apart and counted nowhere (see the Import report).');
  const lab = SP.asOfLabel ? SP.asOfLabel(def.asOf) : def.asOf;
  said.push('Data through ' + (first ? 'set' : 'reset') + ' to ' + lab + ', the last full month before this import'
    + (!first && was && was !== def.asOf ? ' (it was ' + (SP.asOfLabel ? SP.asOfLabel(was) : was) + ')' : '') + '; change it at the top if the pull runs later.');
  return { message: said.join(' ') };
};
function st_pick(current, aps) {
  const o = {};
  for (const ap of aps) o[ap] = current[ap];
  return o;
}

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
// the file's text -> {state} (null when it holds none) or {why}: why it must not be written over
function st_readFile(txt) {
  if (typeof txt !== 'string' || !/<meta\s+name=["']?sfcb-spend-plan["'\s>]/i.test(txt)) return { why: 'is not an SFCB Spend Plan file' };
  const m = /<script\b[^>]*\bid=["']?spState["']?[^>]*>([\s\S]*?)<\/script\s*>/i.exec(txt);
  if (!m) return { why: 'is an SFCB Spend Plan page with no place for its data' };
  let st;
  try { st = JSON.parse(m[1].trim() || 'null'); } catch (e) { return { why: 'holds saved data that cannot be read' }; }
  if (st === null) return { state: null };
  if (!st_isObj(st)) return { why: 'holds saved data that is not a plan' };
  if (st.tool !== ST_TOOL) return { why: 'holds data saved by another tool' };
  return { state: st };
}
function st_abortish(e) { return !!e && (e.name === 'AbortError'); }
function st_err(e) { return (e && e.message) || String(e); }
async function st_write(h, html) {
  const w = await h.createWritable();
  try { await w.write(html); await w.close(); }
  catch (e) { try { await w.abort(); } catch (e2) {} throw e; }
}
async function st_permit(h) {
  let p = 'granted';
  try {
    if (typeof h.queryPermission === 'function') p = await h.queryPermission({ mode: 'readwrite' });
    if (p !== 'granted' && typeof h.requestPermission === 'function') p = await h.requestPermission({ mode: 'readwrite' });
  } catch (e) { p = 'denied'; }
  return p === 'granted';
}
function st_saved(now, gen, h) {
  SP.state.savedAt = now;
  st_base = now; st_baseWhy = '';
  if (h) st_handle = h;
  if (gen === st_gen) st_dirty = false;   // an edit made while the file was being written is still unsaved
  st_fire();
}

SP.saveFile = async function saveFile() {
  if (st_busy) return { ok: false, message: 'A save is already running; nothing else was written.' };
  st_busy = true;
  try { return await st_saveFile(); }
  catch (e) { return { ok: false, message: 'Not saved: ' + st_err(e) + '. Nothing was written.' }; }
  finally { st_busy = false; }
};
async function st_saveFile() {
  const name = st_pageName();
  if (typeof window.showOpenFilePicker !== 'function') {
    // no way to write a file in place: the page is downloaded under its own name, and the person puts it in place
    const now = new Date().toISOString(), gen = st_gen;
    const html = st_htmlFor(Object.assign({}, SP.state, { savedAt: now }));
    const got = SP.download(name, html, 'text/html');
    st_saved(now, gen, null);
    return { ok: true, message: 'This browser cannot write to the file directly, so the plan was downloaded as “' + got + '”. '
      + 'The shared copy is not updated until you put the download in its place (replace “' + name + '” with it).' };
  }
  let h = st_handle, picked = false;
  if (!h) {
    st_say('Save: in the window that opened, pick this file — “' + name + '”, the one this page was opened from. Picking it changes '
      + 'nothing until it has been checked.');
    let hs;
    try { hs = await window.showOpenFilePicker({ multiple: false, types: ST_TYPES(name) }); }
    catch (e) {
      if (st_abortish(e)) return { ok: false, message: 'Not saved: no file was picked. Save again and pick “' + name + '”, the file this page was opened from.' };
      return { ok: false, message: 'Not saved: the file window could not open (' + st_err(e) + '). Use Save a copy… instead.' };
    }
    h = hs && hs[0];
    if (!h) return { ok: false, message: 'Not saved: no file was picked. Save again and pick “' + name + '”.' };
    picked = true;
  }
  const fname = h.name || name;
  let txt;
  try { txt = await (await h.getFile()).text(); }
  catch (e) {
    // a file that cannot be read cannot be checked, so it is never written over; a remembered one that has gone is forgotten
    if (!picked && e && e.name === 'NotFoundError') st_handle = null;
    return { ok: false, message: 'Not saved: “' + fname + '” could not be read (' + st_err(e) + '), so it was not written over. '
      + (e && e.name === 'NotFoundError' ? 'Save again and pick where the file is now.' : 'If it is syncing, try again in a moment, or use Save a copy….') };
  }
  const f = st_readFile(txt);
  if (f.why) {
    if (!picked) st_handle = null;      // the next Save asks which file, rather than failing here again
    return { ok: false, message: 'Not saved: “' + fname + '” ' + f.why + ', so it was not written over. Save again and pick “' + name
      + '”, the file this page was opened from, or use Save a copy….' };
  }
  const fs = f.state, fsAt = fs && typeof fs.savedAt === 'string' ? fs.savedAt : null;
  // the data this page refused on opening is still there (whatever its save time says, even none): never written over unasked
  const refusedHere = st_base === ST_REFUSED && !!fs && st_check(fs) !== '';
  if (fs && (refusedHere || (fsAt !== null && fsAt !== st_base))) {
    let q;
    if (refusedHere) {
      q = 'This page opened empty because the data saved in “' + fname + '” was not opened (' + (st_baseWhy || st_check(fs)) + ').\n\nSaving now writes over '
        + 'that data' + (fsAt ? ', saved ' + st_when(fsAt) : '') + ', and it is lost. Write over it?';
    } else {
      q = '“' + fname + '” was saved ' + st_when(fsAt) + (st_base && st_base !== ST_REFUSED ? ', after this page last opened or saved it (' + st_when(st_base) + ')'
        : ', after this page was opened') + ' — by someone else, or in another window.\n\nSaving now writes over that save, and whatever it added is lost. Write over it?';
    }
    if (!window.confirm(q)) {
      return { ok: false, message: refusedHere
        ? 'Not saved: you chose not to write over the data in “' + fname + '” that this page could not open. Nothing was written. To keep this work, use Save a copy…'
        : 'Not saved: “' + fname + '” was saved ' + st_when(fsAt) + ' by someone else, and you chose not to write over it. '
          + 'Nothing was written. To keep both, use Save a copy…; to see theirs, open the file.' };
    }
  }
  if (!(await st_permit(h))) return { ok: false, message: 'Not saved: writing to “' + fname + '” was not allowed. Nothing was written.' };
  const now = new Date().toISOString(), gen = st_gen;
  const html = st_htmlFor(Object.assign({}, SP.state, { savedAt: now }));
  try { await st_write(h, html); }
  catch (e) { return { ok: false, message: 'Not saved: “' + fname + '” could not be written (' + st_err(e) + '). Use Save a copy… to keep the work.' }; }
  st_saved(now, gen, h);
  return { ok: true, message: 'Saved to “' + fname + '” at ' + st_when(now).slice(11) + '.' };
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
  if (typeof window.showSaveFilePicker !== 'function') {
    const got = SP.download(suggested, html, 'text/html');
    return { ok: true, message: 'A copy was downloaded as “' + got + '”. This page still saves to “' + st_pageName() + '”.' };
  }
  let h;
  try {
    h = await window.showSaveFilePicker({ suggestedName: suggested,
      types: [{ description: 'SFCB Spend Plan (a new file)', accept: { 'text/html': ['.html', '.htm'] } }] });
  } catch (e) {
    if (st_abortish(e)) return { ok: false, message: 'No copy was saved: no file name was given.' };
    return { ok: false, message: 'No copy was saved: the file window could not open (' + st_err(e) + ').' };
  }
  try { await st_write(h, html); }
  catch (e) { return { ok: false, message: 'No copy was saved: “' + (h.name || suggested) + '” could not be written (' + st_err(e) + ').' }; }
  // a copy written over this page's own file IS a save of it; anywhere else, this page's own file still lacks the work
  let own = false;
  if (st_handle && typeof h.isSameEntry === 'function') { try { own = await h.isSameEntry(st_handle); } catch (e) { own = false; } }
  if (own) { st_saved(now, gen, st_handle); return { ok: true, message: 'Saved to “' + (h.name || suggested) + '” (this page’s own file).' }; }
  return { ok: true, message: 'Saved a copy as “' + (h.name || suggested) + '”. This page still saves to “' + st_pageName() + '”'
    + (st_dirty ? ', which does not have this work yet: use Save for that.' : '.') };
}
