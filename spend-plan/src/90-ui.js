// §9 THE SCREENS. One page, drawn from SP.buildModel's result and nothing else, so a figure on screen is the figure in
// the workbook and on the slide picture: this module formats, it never adds up a dollar of its own (CONTRACT §9).
//
// Three rules hold every line below:
//   - Every value that came out of a pull is escaped (SP.esc) where it reaches markup. A plan event may be
//     "><img src=x onerror=…> or hold a closing script tag; drawn raw, it would run as code in a page that is also the file's
//     database. No inline handler exists anywhere: controls carry data-act plus an INDEX into a registry built while
//     drawing, never a name from the data, and one listener on #app does the rest.
//   - A redraw puts the keyboard back where it was. Every control carries data-fkey, a key made from indices and
//     hashes, never from data; after innerHTML is replaced the control with the same key gets focus again, so a
//     keyboard user who expands a row or ticks a switch does not land back at the top of the page.
//   - A tree only draws what is open. The children of a collapsed node are never put in the page, so a block with
//     1,400 nodes costs one row per PMO until someone opens it.

const UI_SVC = SP.SERVICES.concat([SP.SVC_UNKNOWN]);
const UI_LANES = [['disc', 'Discretionary'], ['mand', 'Mandatory']];
const UI_LEVELS = ['PMO', 'Title', 'Plan Event', 'CCaR'];
const UI_AP_LABEL = Object.fromEntries(SP.APS.map(a => [a.id, a.label]));
const UI_VIEWS = [['summary', 'Summary'], ['slides', 'Slide blocks']]
  .concat(SP.APS.map(a => [a.id, a.label]))
  .concat([['pmos', 'PMOs'], ['na', 'Not Allocated'], ['report', 'Import report'], ['changes', 'What changed'], ['settings', 'Settings']]);
const UI_CURVES = [
  ['om1', 'O&M, first year'], ['om2', 'O&M, second year or later (expired: fully obligated)'],
  ['p1', 'Procurement, first year'], ['p2', 'Procurement, second year'], ['p3', 'Procurement, third year'],
  ['p4', 'Procurement, fourth year or later']];
const UI_NODATA = 'Each file is a CCaR export laid out like v12’s Raw Data tabs; import one file per appropriation, or one file '
  + 'holding all four. Rows are placed by their Budget name.';

// what the page remembers between draws. None of it is saved in the file or in browser storage: only the switches are
// this browser's to keep (§11), and they belong to the store.
const ui = {
  view: 'summary', back: 'summary',
  model: null, modelErr: null, pending: false,
  open: new Map(),          // scope -> Map(path key -> true/false): a node opened or closed by hand
  level: new Map(),         // scope -> 1..4: the "Expand to" choice; 2 (PMO and Title, as v12 opens) until changed
  pmoKey: null,             // the PMO picked on the PMOs view, by its normKey, so a rebuilt model keeps the choice
  pmoLabel: '',             // its name, for when the switches leave it with no money to name it
  naF: { ap: '', fy: '', pmo: '', pmoLabel: '' },   // pmoLabel: the chosen PMO's name, for when it has no item to name it
  diffOpen: new Set(),      // 'ap|new' etc.: leaf lists the person asked to see
  refused: null,            // the last import that was refused: {message, report, at}. Nothing changed; it is said
  busy: '',
  localView: null,          // only when the store is missing: the switches still work for the session
  reg: null,                // this draw's registry: what each data-id / data-i / data-s points at
  els: null,
  focusTo: null,            // the data-fkey the keyboard goes to when its own control is gone after the next draw
  asOfHint: false,          // the message line holds the note about a Data through still being typed
  topH: 0,                  // the sticky top's height as last measured: what a top that grows has just covered
};

// ---------------------------------------------------------------------------------------------------------------
// SMALL HELPERS
// ---------------------------------------------------------------------------------------------------------------
function ui_e(s) { return SP.esc(s); }
function ui_pad(n) { return String(n).padStart(2, '0'); }
// an ISO timestamp -> this computer's calendar day, which is the day the person imported it
function ui_day(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso).slice(0, 10);
  return d.getFullYear() + '-' + ui_pad(d.getMonth() + 1) + '-' + ui_pad(d.getDate());
}
function ui_today() { return ui_day(new Date().toISOString()); }
// this computer's 'YYYY-MM-DD HH:MM', with the seconds when asked
function ui_when(iso, sec) {
  const d = new Date(iso);
  if (!iso || isNaN(d.getTime())) return ui_day(iso);
  return ui_day(iso) + ' ' + ui_pad(d.getHours()) + ':' + ui_pad(d.getMinutes()) + (sec ? ':' + ui_pad(d.getSeconds()) : '');
}
// two imports named so they can be told apart: by day, else by time, else to the second ("pull of 2026-11-09 → pull of
// 2026-11-09" said nothing when both came in on one day, review S11)
function ui_pullPair(a, b) {
  if (ui_day(a) !== ui_day(b)) return [ui_day(a), ui_day(b)];
  if (ui_when(a) !== ui_when(b)) return [ui_when(a), ui_when(b)];
  return [ui_when(a, true), ui_when(b, true)];
}
// Several imports named so each can be told apart: a day where no other import shares it, else the time, else the time
// to the second. The top bar said "imported 2026-11-09" for all four appropriations after two imports that day, so it
// could not say which pulls were the older ones (review SCR2-11); the list of imports read the same (review BP-6).
function ui_whens(isos) {
  const xs = [...new Set(isos.filter(x => typeof x === 'string' && x))];
  const clash = (f, x) => xs.some(y => y !== x && f(y) === f(x));
  return iso => (!iso ? '' : !clash(ui_day, iso) ? ui_day(iso) : !clash(y => ui_when(y), iso) ? ui_when(iso) : ui_when(iso, true));
}
function ui_fn(name) { return typeof SP[name] === 'function'; }
// a control whose code another builder has not written yet says so in the message line: never a click that does nothing
function ui_need(name, what) {
  if (ui_fn(name)) return true;
  ui_say(what + ' is not available yet (SP.' + name + ' is missing). Nothing was changed.', 'err');
  return false;
}
// FNV-1a over a string -> a short id. The registry resolves it back; a hash keeps data out of the DOM entirely.
function ui_hash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}
function ui_state() { return SP.state && typeof SP.state === 'object' ? SP.state : null; }
function ui_pulls() {
  const st = ui_state();
  return st && st.pulls && st.pulls.current && typeof st.pulls.current === 'object' ? st.pulls.current : {};
}
function ui_hasData() {
  const p = ui_pulls();
  return SP.APS.some(a => p[a.id] && Array.isArray(p[a.id].rows)) || !!(p.unidentified && Array.isArray(p.unidentified.rows) && p.unidentified.rows.length);
}
function ui_settings() {
  const st = ui_state();
  return st && st.settings && typeof st.settings === 'object' ? st.settings : SP.defaultSettings(ui_today());
}
function ui_view() {
  if (ui_fn('getView')) { try { const v = SP.getView(); if (v && typeof v === 'object') return v; } catch (e) {} }
  return ui.localView || (ui.localView = SP.defaultView());
}
function ui_setView(v) {
  if (ui_fn('setView')) SP.setView(v);
  else ui.localView = v;
}
function ui_copy(o) { return JSON.parse(JSON.stringify(o === undefined ? null : o)); }
// THE BAE REPORT OF BUDGETS on screen (CONTRACT §14.7: SP.state.bae.current), or the one it replaced ('previous'), or null.
// A state with no bae (a file saved before §14, the screens' test stand-in) is a page with no report, and with none
// nothing on any view changes (§14): every line below that speaks of a report is drawn only when this, or the model's
// bae, says one is loaded.
function ui_bae(side) {
  const st = ui_state();
  const b = st && st.bae && typeof st.bae === 'object' ? st.bae[side || 'current'] : null;
  return b && typeof b === 'object' && !Array.isArray(b) && Array.isArray(b.rows) ? b : null;
}
// the model was built with a report (§14.5 model.bae)
function ui_rep(M) { return !!(M && M.bae && M.bae.present); }

// the model, built once per change of data, settings or switches; a view change or a row opened reuses it
function ui_model() {
  if (ui.model || ui.modelErr || !ui_hasData()) return ui.model;
  try { ui.model = SP.buildModel(ui_pulls(), ui_settings(), ui_view(), ui_bae()); }
  catch (e) { ui.modelErr = (e && e.message) || String(e); ui.model = null; }
  return ui.model;
}
function ui_invalidate() { ui.model = null; ui.modelErr = null; }

// ---------------------------------------------------------------------------------------------------------------
// THE MESSAGE LINE: every result and every error is said here, with its reason; nothing is swallowed
// ---------------------------------------------------------------------------------------------------------------
function ui_say(text, kind) {
  const el = ui.els && ui.els.msg;
  if (!el) return;
  el.textContent = text ? String(text) : '';
  el.className = 'msg' + (text ? ' msg-' + (kind || 'info') : '');
  // A message stays until the next one, inside the sticky top: a refused import naming its sheets made the top 167 px
  // of a 768 px window, on every view, with no way to put it away (review S7). Dismiss takes it off; its reason is kept
  // where it belongs (a refused import in the Import report). The button sits outside the live region, so it is not read
  // out with every message.
  if (ui.els.msgx) ui.els.msgx.hidden = !text;
  ui_layout();
}

// ---------------------------------------------------------------------------------------------------------------
// CELLS. Money cells carry their exact cents in data-c (a number from the model, never pull text), so a check can
// compare a figure to the dollar where the screen shows it to $0.01M.
// ---------------------------------------------------------------------------------------------------------------
function ui_vis(M) { return M.cols.filter(c => c.id !== 'nodate' || M.showNoDate); }
function ui_m(c, cls) {
  const ok = typeof c === 'number' && isFinite(c);
  return '<td class="n' + (cls ? ' ' + cls : '') + '"' + (ok ? ' data-c="' + c + '"' : '') + '>' + (ok ? ui_e(SP.fmtM(c)) : '') + '</td>';
}
function ui_p(x, cls) { return '<td class="n' + (cls ? ' ' + cls : '') + '">' + (x === null || x === undefined ? '' : ui_e(SP.fmtPct(x))) + '</td>'; }
function ui_d(x) { return '<td class="n">' + (x === null || x === undefined ? '' : ui_e(SP.fmtDelta(x))) + '</td>'; }
// a status is always its colour AND its word. A plan cell (a month after the as-of month) is a forecast of the
// status: its fill and word in italic, as the workbook and the pictures print it (CONTRACT §8: grey words on
// the red or green fill could not be read).
function ui_st(st, plan, cls) {
  if (!st) return '<td class="st' + (cls ? ' ' + cls : '') + '"></td>';
  const w = ui_e(SP.statusWord(st));
  if (plan) return '<td class="st st-' + st + ' plan' + (cls ? ' ' + cls : '') + '">' + w + '</td>';
  return '<td class="st st-' + st + (cls ? ' ' + cls : '') + '">' + w + '</td>';
}
// A MARK'S WORDS depend on the model (SP.markText): with a BAE report loaded, † is "neither entered nor in the BAE report",
// ‡ is on every entered figure (review I4-4), and § exists (§14.5). With no report they are SP.AUTH_MARK_TEXT's, word for
// word, so nothing on a page without one moves.
function ui_markText(m, M) { return typeof SP.markText === 'function' ? SP.markText(m, M) : SP.AUTH_MARK_TEXT[m] || ''; }
const UI_MARK_CLASS = { '†': 'dag', '‡': 'ddag', '§': 'sect' };
function ui_markSpan(m, M) { return '<span class="' + UI_MARK_CLASS[m] + '" title="' + ui_e(ui_markText(m, M)) + '">' + m + '</span>'; }
// mark: '†' not entered, '‡' entered while some switch is off, or with a BAE report loaded (SP.authMark), or '' / '†‡' on a
// TOTAL (SP.authMarks)
function ui_auth(cents, mark, M) {
  const m = String(mark || '');
  return '<td class="n" data-c="' + cents + '">' + ui_e(SP.fmtM(cents))
    + (m.includes('†') ? ui_markSpan('†', M) : '') + (m.includes('‡') ? ui_markSpan('‡', M) : '') + '</td>';
}
// §14.5 an APPROVED cell, marked § where the BAE report has no figure for the block and Approved is the CCaR plan. With no
// mark it is ui_m's cell exactly, so a page with no report draws the very markup it drew before.
function ui_appr(cents, mark, M) {
  if (!String(mark || '').includes('§')) return ui_m(cents);
  return '<td class="n" data-c="' + cents + '">' + ui_e(SP.fmtM(cents)) + ui_markSpan('§', M) + '</td>';
}
// the line under a table for each mark it prints (§8, §14.5), § first because Approved comes before Authorized
function ui_markNotes(am, M) {
  return (am.sect ? '<p class="note mark-note" data-mark="sect">§ ' + ui_e(ui_markText('§', M)) + '</p>' : '')
    + (am.dag ? '<p class="note mark-note" data-mark="dag">† ' + ui_e(ui_markText('†', M)) + '</p>' : '')
    + (am.ddag ? '<p class="note mark-note" data-mark="ddag">‡ ' + ui_e(ui_markText('‡', M)) + '</p>' : '');
}
// `every`: what a view the switches do not reach covers instead. Its headline says so: under the bold "Showing only part of
// the data." the Import report and What changed said in small print that they show every row, and a reader skimming the
// bold words took a What changed figure to leave out the services switched off (review SCR2-7).
function ui_shown(M, extra, every) {
  if (M.shown.all) return '';
  if (every) return '<p class="shown every"><strong>This view shows every row, whatever the switches: ' + ui_e(every) + '.</strong> '
    + 'The other views show only part of the data (' + ui_e(M.shown.text) + ').</p>';
  return '<p class="shown"><strong>Showing only part of the data.</strong> ' + ui_e(M.shown.text) + '. '
    + ui_e(extra || 'Every figure on this view counts only these.') + '</p>';
}

// ---------------------------------------------------------------------------------------------------------------
// A BLOCK'S TABLE: header, body rows, the totals band. One shape for the slides, the appropriation trees and the PMO
// blocks, so the three cannot drift apart on what a column holds.
// ---------------------------------------------------------------------------------------------------------------
function ui_hdr(M, first) {
  return '<tr class="hd"><th scope="col" class="lab">' + ui_e(first) + '</th><th scope="col" class="n tot">Total</th>'
    + ui_vis(M).map(c => '<th scope="col" class="n' + (c.closed ? ' cl' : '') + '">' + ui_e(c.label) + '</th>').join('')
    + '<th scope="col" class="n tot">Total</th></tr>';
}
function ui_ncols(M) { return ui_vis(M).length + 3; }
function ui_colsRow(M, labelHtml, cols, total, cls) {
  return '<tr class="' + (cls || '') + '"><th scope="row" class="lab">' + labelHtml + '</th>' + ui_m(total, 'tot')
    + ui_vis(M).map(c => ui_m(cols[c.index], c.closed ? 'cl' : '')).join('') + ui_m(total, 'tot') + '</tr>';
}
// THE TOTALS BAND MEASURES THE CCaR PLAN BY MONTH (rule 6, CONTRACT §14.3): its Total column prints the plan and the
// plan's Obl %, goal and status (SP.plannedOf, SP.slideOf), never the BAE report's Approved beside a month row that adds
// up to the plan. With no report the two are the block's Approved and headline, exactly as before.
function ui_band(M, b) {
  const V = ui_vis(M);
  const out = [];
  const P = SP.plannedOf(b), sl = SP.slideOf(b);
  out.push(ui_colsRow(M, 'Monthly Totals', b.cols, P, 'band'));
  // Cumulative's Total cells print Approved (the plan), as v12's did (=O53) and as the workbook and the pictures print it:
  // No date is outside the running sum, never outside the total (integration ruling, so the three products agree)
  out.push('<tr class="band"><th scope="row" class="lab">Cumulative Totals</th>' + ui_m(P, 'tot')
    + V.map(c => (c.id === 'nodate' ? '<td></td>' : ui_m(b.cum[c.index], c.closed ? 'cl' : ''))).join('') + ui_m(P, 'tot') + '</tr>');
  // the label's words are SP.oblLabel's, the workbook's and the picture's too (review R7); &nbsp; keeps its two spaces
  out.push('<tr class="band"><th scope="row" class="lab">' + ui_e(SP.oblLabel(b, M)).replace(/ {2}/g, '&nbsp; ') + '</th>' + ui_p(sl.oblPct, 'tot')
    + V.map(c => { const o = b.obl[c.index] || {}; return ui_p(o.v, (c.closed ? 'cl' : '') + (o.kind === 'plan' ? ' plan' : '')); }).join('')
    + ui_p(sl.oblPct, 'tot') + '</tr>');
  out.push('<tr class="band"><th scope="row" class="lab">OSD Goal %</th>' + ui_p(sl.goal, 'tot')
    + V.map(c => ui_p(b.goalC[c.index], c.closed ? 'cl' : '')).join('') + ui_p(sl.goal, 'tot') + '</tr>');
  out.push('<tr class="band stband"><th scope="row" class="lab">OSD Status</th>' + ui_st(sl.status, false, 'tot')
    + V.map(c => { const s = b.statusC[c.index] || {}; return ui_st(s.status, s.kind === 'plan', c.closed ? 'cl' : ''); }).join('')
    + ui_st(sl.status, false, 'tot') + '</tr>');
  return out.join('');
}

// ---------------------------------------------------------------------------------------------------------------
// TREES (§4.4) with their open/closed state, keyed by the node's path of normKeys inside a scope
// ---------------------------------------------------------------------------------------------------------------
function ui_pk(n) { return n.path.join('\u0000'); }
function ui_isOpen(scope, n) {
  const o = ui.open.get(scope);
  const pk = ui_pk(n);
  if (o && o.has(pk)) return o.get(pk);
  return n.level < (ui.level.get(scope) || 2);
}
function ui_nodeId(scope, n) {
  const R = ui.reg, pk = ui_pk(n);
  let id = 'n' + ui_hash(scope + '\u0001' + pk), k = 1;
  while (R.nodes.has(id) && (R.nodes.get(id).scope !== scope || R.nodes.get(id).pk !== pk)) id = 'n' + ui_hash(scope + '\u0001' + pk) + '_' + (k++);
  R.nodes.set(id, { scope, pk });
  return id;
}
function ui_tree(M, scope, nodes, out) {
  for (const n of nodes) {
    const kids = n.children && n.children.length;
    const open = kids && ui_isOpen(scope, n);
    let lab;
    if (kids) {
      const id = ui_nodeId(scope, n);
      lab = '<button type="button" class="tg" data-act="tg" data-id="' + id + '" data-fkey="tg:' + id + '" aria-expanded="' + (open ? 'true' : 'false')
        + '"><span class="arr" aria-hidden="true">' + (open ? '▾' : '▸') + '</span>' + ui_e(n.label) + '</button>';
    } else lab = '<span class="leaf">' + ui_e(n.label) + '</span>';
    out.push('<tr class="lv' + n.level + '"><th scope="row" class="lab lv' + n.level + '">' + lab + '</th>' + ui_m(n.total, 'tot')
      + ui_vis(M).map(c => ui_m(n.cols[c.index], c.closed ? 'cl' : '')).join('') + ui_m(n.total, 'tot') + '</tr>');
    if (open) ui_tree(M, scope, n.children, out);
  }
}
function ui_levelPick(scope, label) {
  const R = ui.reg, i = R.scopes.length;
  R.scopes.push(scope);
  const cur = ui.level.get(scope) || 2;
  // the accessible name starts with the words on screen, then says which block: named "Expand O&M FY2025 to", a person
  // speaking "click Expand to" reached nothing (WCAG 2.5.3, review SCR2-10)
  return '<label class="lvl">Expand to <select data-act="lvl" data-s="' + i + '" data-fkey="lvl:' + i + '" aria-label="Expand to (' + ui_e(label) + ')">'
    + UI_LEVELS.map((t, k) => '<option value="' + (k + 1) + '"' + (cur === k + 1 ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></label>';
}

// the §5 items as a table: the appropriation views
function ui_naTable(M, items, withBlock) {
  if (!items.length) return '<p class="none">No Not Allocated requirements.</p>';
  const head = (withBlock ? '<th scope="col">Appropriation</th><th scope="col">FY</th>' : '')
    + '<th scope="col">Column</th><th scope="col">Item</th><th scope="col">Status</th><th scope="col">CCaR(s)</th><th scope="col">PMO(s)</th>'
    + (withBlock ? '<th scope="col">Title(s)</th>' : '') + '<th scope="col" class="n">$M</th>';
  const body = items.map(it => '<tr>' + (withBlock ? '<td>' + ui_e(it.apLabel) + '</td><td>FY' + ui_e(it.fy) + '</td>' : '')
    + '<td>' + ui_e(M.cols[it.colIndex] ? M.cols[it.colIndex].label : it.col) + '</td><td class="wrap">' + ui_e(it.label) + '</td><td>' + ui_e(it.statusLabel)
    + '</td><td class="wrap">' + ui_e(it.ccars.join('; ')) + '</td><td class="wrap">' + ui_e(it.pmos.join('; ')) + '</td>'
    + (withBlock ? '<td class="wrap">' + ui_e(it.titles.join('; ')) + '</td>' : '') + ui_m(it.cents) + '</tr>').join('');
  return '<div class="tw"><table class="grid na"><thead><tr class="hd">' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>';
}
// the §5 one-line-per-month text: the slides and the PMO blocks, as v12 and the workbook print it
function ui_naLines(M, items) {
  const lines = SP.naLines(items, M.cols);
  return '<div class="nabar">Not Allocated Requirements</div>'
    + (lines.length ? '<table class="nalines"><tbody>' + lines.map(l => '<tr><th scope="row">' + ui_e(l.label) + '</th><td>' + ui_e(l.text) + '</td></tr>').join('')
      + '</tbody></table>' : '<p class="none">None.</p>');
}

// a top table: one row per block, with a Total row that has no goal (§8.1, §8.3, §8.6)
function ui_topTable(rows, opts) {
  const withAp = opts.withAp;
  const head = (withAp ? '<th scope="col">Appropriation</th>' : '') + '<th scope="col">FY</th><th scope="col" class="n">Approved ($M)</th>'
    + '<th scope="col" class="n">Authorized ($M)</th><th scope="col" class="n">Obligated ($M)</th><th scope="col" class="n">Unobligated ($M)</th>'
    + '<th scope="col" class="n">Obl %</th><th scope="col" class="n">OSD Goal %</th><th scope="col" class="n">Delta (pp)</th><th scope="col">Status</th>';
  const body = [];
  let i = 0;
  while (i < rows.length) {
    let j = i;
    if (withAp && opts.mergeAp) while (j + 1 < rows.length && rows[j + 1].ap === rows[i].ap) j++;
    for (let k = i; k <= j; k++) {
      const r = rows[k];
      const apCell = !withAp ? '' : !opts.mergeAp ? '<td>' + ui_e(UI_AP_LABEL[r.ap] || r.ap) + '</td>'
        : k === i ? '<th scope="rowgroup" rowspan="' + (j - i + 1) + '" class="apg">' + ui_e(UI_AP_LABEL[r.ap] || r.ap) + '</th>' : '';
      // § beside an Approved that is the CCaR plan because the BAE report has no figure for that block (§14.5); never
      // with no report, where every Approved is the plan and no row has an approvedSrc
      body.push('<tr data-bk="' + ui_e(SP.blockKey(r.ap, r.fy)) + '">' + apCell + '<td>FY' + ui_e(r.fy) + '</td>'
        + ui_appr(r.approved, opts.authAlways ? '' : SP.approvedMark(r, opts.model), opts.model)
        + ui_auth(r.authorized, opts.authAlways ? '' : SP.authMark(r, opts.model), opts.model) + ui_m(r.obligated) + ui_m(r.unobligated) + ui_p(r.oblPct) + ui_p(r.goal)
        + ui_d(r.delta) + ui_st(r.status, false) + '</tr>');
    }
    i = j + 1;
  }
  const t = opts.total;
  // A TOTAL carries each mark its rows carry (SP.authMarks), as the workbook's TOTAL does: it adds in an Authorized the
  // switches do not reach (‡, review R3), and Approved for every row where none was entered (†). It carried only ‡, so
  // with nothing entered thirteen rows read 161.64† above a bare TOTAL that the workbook printed 2,214.43†: one figure,
  // two claims about what it is (review SEAM-8).
  // With a BAE report loaded, its Approved carries § when a row's does: it adds in the CCaR plan of a block the report has
  // no figure for (§14.5), beside report figures (sect is false on every row with none).
  const am = opts.authAlways ? { dag: false, ddag: false, sect: false } : SP.authMarks(rows, opts.model);
  body.push('<tr class="total" data-bk="total"><th scope="row"' + (withAp ? ' colspan="2"' : '') + '>' + ui_e(opts.totalLabel) + '</th>'
    + ui_appr(t.approved, am.sect ? '§' : '', opts.model) + ui_auth(t.authorized, (am.dag ? '†' : '') + (am.ddag ? '‡' : ''), opts.model)
    + ui_m(t.obligated) + ui_m(t.unobligated) + ui_p(t.oblPct) + '<td></td><td></td><td></td></tr>');
  // each mark used is said under the table, as each workbook sheet says it (review M4): an appropriation view's † had
  // only a tooltip to explain it
  return '<div class="tw"><table class="grid top"><thead><tr class="hd">' + head + '</tr></thead><tbody>' + body.join('') + '</tbody></table></div>'
    + ui_markNotes(am, opts.model);
}

// ---------------------------------------------------------------------------------------------------------------
// THE VIEWS
// ---------------------------------------------------------------------------------------------------------------
function ui_quarter(M) { return Math.ceil(M.asOfIndex / 3); }
function ui_vSummary(M) {
  const legend = '<table class="legend"><caption>Status</caption><tbody>' + SP.STATUS_LEGEND.map(l =>
    '<tr><td class="st st-' + l.status + '">' + ui_e(l.word) + '</td><td>' + ui_e(l.colour) + ' — ' + ui_e(l.meaning) + '</td></tr>').join('')
    + '</tbody></table>';
  const notes = M.summary.notes.length
    ? '<h3 class="sub">Notes</h3><ul class="notes">' + M.summary.notes.map(n => '<li>' + ui_e(n) + '</li>').join('') + '</ul>' : '';
  // Line 2 with a BAE report loaded is SP.summaryLine2's, the workbook's words (§14.5), with the screen's own quotation
  // marks; with none it is §8.1's as this view has always drawn it
  const l2 = ui_rep(M) ? ui_e(SP.summaryLine2(M).replace('"Actual Execution"', '“Actual Execution”'))
    : 'Data through ' + ui_e(M.asOfLabel) + ' | Approved = total planned ($M from the CCaR pull) | Authorized = entered, else Approved'
      + ' | Obligated = CCaR status “Actual Execution” | Unobligated = Approved - Obligated | Delta = Obl% - OSD%';
  return '<h2 class="title">F-35 Sustainment Financial Execution - Top-Line Snapshot (FY' + ui_pad(M.E % 100) + 'Q' + ui_quarter(M) + ')</h2>'
    + '<p class="l2">' + l2 + '</p>'
    + '<p class="l3' + (M.shown.all ? '' : ' filtered') + '">' + ui_e(M.shown.text) + '</p>'
    + (M.blocks.length ? ui_topTable(M.summary.rows, { model: M, withAp: true, mergeAp: true, total: M.summary.total, totalLabel: 'TOTAL - Sustainment' })
      : '<p class="none">No appropriation and FY has rows to show.</p>')
    + legend + notes;
}

function ui_pictureName(b) { return b.apLabel + ' FY' + b.fy + '.png'; }
function ui_vSlides(M) {
  const R = ui.reg;
  const out = ['<h2 class="title">Slide Snapshots - picture-ready blocks for PowerPoint</h2>',
    '<p class="l2">Each block is sized for a 13.33 in x 4.5 in slide region. <strong>Copy picture</strong> puts a block on the clipboard;'
    + ' <strong>Save picture</strong> saves it as a PNG. The picture runs from the block’s title through OSD Status.</p>',
    '<p class="l3' + (M.shown.all ? '' : ' filtered') + '">' + ui_e(M.shown.text) + '</p>',
    // rule 6 (§14.3): with a BAE report loaded the Summary's Approved is the report's, and a block here still adds up the
    // plan; said once, so a slide's Total is not taken for a figure that disagrees with the Summary. The Slide Snapshots
    // sheet says it in the same words (SP.SLIDES_PLAN_NOTE, review P4-6)
    ui_rep(M) ? '<p class="note bae-plan">' + ui_e(SP.SLIDES_PLAN_NOTE) + '</p>' : '',
    '<p class="acts"><button type="button" data-act="zip" data-fkey="zip">Save all pictures (.zip)</button></p>'];
  if (!M.blocks.length) out.push('<p class="none">No appropriation and FY has rows to show.</p>');
  M.blocks.forEach((b, i) => {
    R.blocks[i] = b;
    const name = b.apLabel + ' FY' + b.fy;
    out.push('<section class="slide" aria-label="' + ui_e(name) + '">'
      + '<div class="slidebtns"><button type="button" data-act="copypic" data-b="' + i + '" data-fkey="cp:' + i + '" aria-label="Copy picture of ' + ui_e(name) + '">Copy picture</button>'
      + '<button type="button" data-act="savepic" data-b="' + i + '" data-fkey="sp:' + i + '" aria-label="Save picture of ' + ui_e(name) + '">Save picture</button></div>'
      + '<div class="bar">' + ui_e(name) + ' - Spend Plan (PMO Summary, slide-ready)</div>'
      + '<div class="tw"><table class="grid blk"><thead>' + ui_hdr(M, 'PMO') + '</thead><tbody>'
      + b.pmoRows.map(p => ui_colsRow(M, ui_e(p.label), p.cols, p.total, 'pmo')).join('')
      + '<tr class="spacer"><td colspan="' + ui_ncols(M) + '"></td></tr>' + ui_band(M, b) + '</tbody></table></div>'
      + ui_naLines(M, b.na) + '</section>');
  });
  return out.join('');
}

function ui_vAp(M, ap) {
  const label = UI_AP_LABEL[ap];
  const A = M.aps.find(a => a.ap === ap);
  const p = ui_pulls()[ap];
  const when = p && p.importedAt ? ui_day(p.importedAt) : '';
  // the title in the workbook's words (SP.apTitle): with a BAE report loaded it names the report beside the pull, since
  // the table under it is the report's figures (review BP4-1, P4-6). A view with no table names no report, as before.
  const out = ['<h2 class="title">' + ui_e(SP.apTitle(label, when, A ? M : null, false)) + '</h2>',
    '<p class="l3' + (M.shown.all ? '' : ' filtered') + '">' + ui_e(M.shown.text) + '</p>'];
  if (!A) {
    out.push('<p class="none">' + (p ? 'No ' + ui_e(label) + ' rows from FY' + ui_e(M.firstFY) + ' on in the current pull.' : 'No ' + ui_e(label) + ' pull has been imported yet.') + '</p>');
    return out.join('');
  }
  out.push(ui_topTable(A.blocks, { model: M, withAp: false, total: A.total, totalLabel: 'Total - All FYs' }));
  for (const b of A.blocks) {
    const scope = 'ap|' + b.key;
    const rows = [];
    ui_tree(M, scope, b.tree, rows);
    out.push('<section class="blk-sec" aria-label="' + ui_e(label + ' FY' + b.fy) + '">'
      + '<div class="bar">FY' + ui_e(b.fy) + ' - Spend Plan by PMO / Title / Plan Event / CCaR</div>'
      + '<div class="blkctl">' + ui_levelPick(scope, label + ' FY' + b.fy) + '</div>'
      + '<div class="tw treew"><table class="grid blk tree"><thead>' + ui_hdr(M, 'PMO / Title / Plan Event / CCaR') + '</thead><tbody>'
      + (rows.length ? rows.join('') : '<tr><td colspan="' + ui_ncols(M) + '" class="none">No rows shown.</td></tr>')
      + ui_band(M, b) + '</tbody></table></div>'
      + '<h3 class="nabar">Not Allocated Requirements — ' + ui_e(label) + ' FY' + ui_e(b.fy) + '</h3>' + ui_naTable(M, b.na, false) + '</section>');
  }
  return out.join('');
}

function ui_vPmos(M) {
  if (!M.pmos.length) return '<h2 class="title">PMOs</h2><p class="none">No PMO has rows to show.</p>';
  const R = ui.reg;
  // The PMO picked stays picked while the switches leave it with no money, as the Not Allocated filter does (review
  // SEAM-10): it was overwritten with the first PMO, so after a switch was turned off and on again another PMO's tab was
  // on screen. Until one is picked, the first is shown.
  if (ui.pmoKey === null || ui.pmoKey === undefined) { ui.pmoKey = M.pmos[0].key; ui.pmoLabel = M.pmos[0].label; }
  const P = M.pmos.find(x => x.key === ui.pmoKey);
  const opts = M.pmos.map((x, i) => { R.pmos[i] = x.key; return '<option value="' + i + '"' + (x === P ? ' selected' : '') + '>' + ui_e(x.label) + '</option>'; });
  if (!P) { R.pmos.push(ui.pmoKey); opts.push('<option value="' + (R.pmos.length - 1) + '" selected>' + ui_e(ui.pmoLabel || '(the PMO chosen)') + ' (no money shown)</option>'); }
  const pick = '<p class="acts"><label>PMO <select data-act="pmo" data-fkey="pmo">' + opts.join('') + '</select></label></p>';
  if (!P) {
    return pick + '<h2 class="title">PMO: ' + ui_e(ui.pmoLabel || '(the PMO chosen)') + ' - Sustainment Spend Plan (Cross-Appropriation Detail)</h2>'
      + '<p class="l3' + (M.shown.all ? '' : ' filtered') + '">' + ui_e(M.shown.text) + '</p>'
      + '<p class="none lost">' + ui_e(ui.pmoLabel || 'The PMO chosen') + ' has no money that counts with these switches. It stays chosen, so its tab comes back when'
      + ' they show it; pick another PMO to see that one.</p>';
  }
  ui.pmoLabel = P.label;
  // WITH A BAE REPORT LOADED a PMO row of a block the report covers is the budgets' figures (§14.4): its Authorized is the
  // report's, not Approved, so the rows carry their own marks (§ and † on a block the report has no figure for, nothing on
  // the budgets') and the words under the table are SP.pmoTabLines', the workbook's, in its order. "A PMO row shows Approved"
  // is said only of the rows it is true of. With no report the table and its note are §8.6's, unchanged.
  const rep = ui_rep(M);
  const notes = SP.pmoTabLines(P, M);
  const out = [pick, '<h2 class="title">PMO: ' + ui_e(P.label) + ' - Sustainment Spend Plan (Cross-Appropriation Detail)</h2>',
    '<p class="l3' + (M.shown.all ? '' : ' filtered') + '">' + ui_e(M.shown.text) + '</p>',
    ui_topTable(P.rows, { model: M, withAp: true, mergeAp: false, authAlways: !rep, total: P.total, totalLabel: 'Total - All' }),
    notes.map(n => '<p class="note' + (rep ? ' pmo-note' : '') + '">' + ui_e(n) + '</p>').join('')];
  for (const b of P.blocks) {
    const scope = 'pmo|' + P.key + '|' + b.key;
    const rows = [];
    ui_tree(M, scope, b.tree, rows);
    // the stoplight row's figures for this block, with that row's marks (SP.pmoStripParts, the workbook's strip): with a
    // report loaded, § and † on a block the report has no figure for, as in the table above; none with no report (M4-5)
    const sp = SP.pmoStripParts(b, M);
    const strip = ui_e(sp.head) + sp.parts.map(([w, c, mk]) => '&nbsp; | &nbsp;' + w + ' ' + ui_e(SP.fmtMText(c)) + 'M' + (mk ? ui_markSpan(mk, M) : '')).join('');
    out.push('<section class="blk-sec" aria-label="' + ui_e(b.apLabel + ' FY' + b.fy) + '">'
      + '<div class="bar bar2">' + ui_e(b.apLabel) + ' - FY' + ui_e(b.fy) + '</div>'
      + '<div class="blkctl">' + ui_levelPick(scope, P.label + ', ' + b.apLabel + ' FY' + b.fy) + '</div>'
      + '<div class="tw treew"><table class="grid blk tree"><thead>' + ui_hdr(M, 'PMO / Title / Plan Event / CCaR') + '</thead><tbody>'
      + '<tr class="strip"><td colspan="' + ui_ncols(M) + '">' + strip + '</td></tr>'
      + rows.join('') + ui_band(M, b) + '</tbody></table></div>' + ui_naLines(M, b.na) + '</section>');
  }
  return out.join('');
}

// The PMO filter shows a PMO's OWN items: the lists its PMO tab prints (§5, "PMO blocks list only that PMO's items"),
// keyed by the PMO's normKey (§4.4). It used to keep every naAll item whose PMO names held the chosen spelling, and a
// §5 item groups rows by plan event across PMOs, so (review R2):
//   - a shared item counted whole under every PMO it named: on the real pull one PMO showed another's money, named on
//     it only by a $0.00 row, and its total disagreed with its own tab;
//   - one PMO spelled two ways was two choices, each with part of its money.
function ui_vNa(M) {
  const R = ui.reg, F = ui.naF;
  const all = M.naAll;
  // each PMO's own items, its blocks in the model's block order (appropriation, then FY) so they read as naAll does
  const apAt = new Map(SP.APS.map((a, i) => [a.id, i]));
  const own = new Map();
  for (const p of M.pmos) {
    const list = [];
    for (const pb of p.blocks.slice().sort((a, b) => apAt.get(a.ap) - apAt.get(b.ap) || a.fy - b.fy)) {
      for (const it of pb.na) list.push(Object.assign({ ap: pb.ap, apLabel: pb.apLabel, fy: pb.fy, blockKey: pb.key }, it));
    }
    if (list.length) own.set(p.key, { label: p.label, items: list });
  }
  // the appropriation and FY choices offer every block either list has: a PMO's part can be non-zero in a block where
  // the item it belongs to nets to $0 across PMOs, and so is not in naAll
  const pool = all.concat(...[...own.values()].map(o => o.items));
  const aps = SP.APS.filter(a => pool.some(it => it.ap === a.id));
  const fys = [...new Set(pool.map(it => it.fy))].sort((a, b) => a - b);
  // F.pmo is 'k:' + the PMO's key, '' for All: the key of '(no PMO)' is the empty text, which would otherwise read as All
  const pm = [...own.keys()];
  // A CHOICE IS KEPT while nothing it names is shown. It was set back to All whenever a switch left the chosen PMO (or
  // appropriation, or FY) with no item, so turning the switch back on showed every PMO's list where the person had been
  // reading one PMO's, with nothing saying the filter was gone (review SEAM-10). It stays chosen, offered as "(no items
  // shown)", and the list says so; Clear filters takes it off.
  const lostAp = F.ap && !aps.some(a => a.id === F.ap), lostFy = F.fy && !fys.includes(Number(F.fy));
  const lostPmo = F.pmo && !own.has(F.pmo.slice(2));
  if (lostPmo && !pm.includes(F.pmo.slice(2))) pm.push(F.pmo.slice(2));
  R.naPmos = pm.map(k => 'k:' + k);
  R.naPmoLabels = pm.map(k => (own.has(k) ? own.get(k).label : F.pmoLabel || '(the PMO chosen)'));
  const P = F.pmo ? own.get(F.pmo.slice(2)) || { label: F.pmoLabel || '(the PMO chosen)', items: [] } : null;
  const src = P ? P.items : all;
  const items = src.filter(it => (!F.ap || it.ap === F.ap) && (!F.fy || it.fy === Number(F.fy)));
  let cents = 0;
  for (const it of items) cents += it.cents;
  const none = ' (no items shown)';
  const apOpts = aps.slice();
  if (lostAp) apOpts.push({ id: F.ap, label: (UI_AP_LABEL[F.ap] || F.ap) + none });
  const fyOpts = fys.slice();
  if (lostFy) fyOpts.push(Number(F.fy));
  const filt = '<div class="acts filt" role="group" aria-label="Filter the list">'
    + '<label>Appropriation <select data-act="naf" data-f="ap" data-fkey="naf:ap"><option value="">All</option>'
    + apOpts.map(a => '<option value="' + ui_e(a.id) + '"' + (F.ap === a.id ? ' selected' : '') + '>' + ui_e(a.label) + '</option>').join('') + '</select></label>'
    + '<label>FY <select data-act="naf" data-f="fy" data-fkey="naf:fy"><option value="">All</option>'
    + fyOpts.map(y => '<option value="' + ui_e(y) + '"' + (String(F.fy) === String(y) ? ' selected' : '') + '>FY' + ui_e(y) + (lostFy && String(F.fy) === String(y) ? none : '')
      + '</option>').join('') + '</select></label>'
    + '<label>PMO <select data-act="naf" data-f="pmo" data-fkey="naf:pmo"><option value="">All</option>'
    + pm.map((k, i) => '<option value="' + i + '"' + (F.pmo === 'k:' + k ? ' selected' : '') + '>' + ui_e(R.naPmoLabels[i]) + (own.has(k) ? '' : none) + '</option>').join('')
    + '</select></label>'
    + '<button type="button" data-act="naclear" data-fkey="naclear">Clear filters</button></div>';
  const lost = [lostAp ? UI_AP_LABEL[F.ap] || F.ap : '', lostFy ? 'FY' + F.fy : '', lostPmo ? P.label : ''].filter(Boolean);
  return '<h2 class="title">Not Allocated Requirements - every appropriation and FY</h2>'
    + ui_shown(M, 'Only rows those switches show are listed.')
    + '<p class="l2">Rows that count and are not marked Actual Execution, grouped by column, status and plan event (a special CCaR is one item).'
    + ' Largest first within each column; items of $0 are left out.</p>' + filt
    + (P ? '<p class="note">' + ui_e(P.label) + '’s own items, as its PMO tab lists them: where other PMOs share a plan event, only '
      + ui_e(P.label) + '’s rows are counted.</p>' : '')
    + (lost.length ? '<p class="note lost" data-lost="' + ui_e(lost.join('|')) + '">The filter chosen, ' + ui_e(lost.join(', ')) + ', has no Not Allocated item that counts '
      + 'with these switches. It stays chosen, so the list comes back when they show it; Clear filters takes it off.</p>' : '')
    // $0.00M, never "$-M": fmtM's lone dash is a table cell's zero, and in a sentence it reads as a figure left out (S11, review SCR2-8)
    + '<p class="count" aria-live="polite">' + ui_e(SP.fmtInt(items.length)) + ' of ' + ui_e(SP.fmtInt(src.length)) + ' items, $' + ui_e(SP.fmtMText(cents)) + 'M</p>'
    + ui_naTable(M, items, true);
}

function ui_reportLines(rep) {
  let lines = [];
  try { lines = SP.importReportLines(rep); } catch (e) { lines = ['The report could not be drawn: ' + ((e && e.message) || e)]; }
  return ui_lines(lines);
}
function ui_lines(lines) {
  return '<div class="report">' + lines.map(l => {
    const m = /^( *)/.exec(l), ind = Math.min(6, (m ? m[1].length : 0) / 2);
    return '<div class="rl" style="padding-left:' + (ind * 1.5) + 'em">' + ui_e(l.trim()) + '</div>';
  }).join('') + '</div>';
}
function ui_vReport(M) {
  const st = ui_state();
  // With a BAE report loaded, three of its lists below are worked out on the blocks as the switches leave them (§14.8) and
  // say so where they are; the heading says it too, or it claimed every row of a view whose flags a switch had moved (P4-4)
  const out = ['<h2 class="title">Import report</h2>', M ? ui_shown(M, '', 'it covers every row each file held'
    + (ui_rep(M) ? ', except the BAE report’s lists that say they are counted with the switches as they are' : '')) : ''];
  if (ui.refused) {
    out.push('<div class="refused" role="note"><p><strong>The last import was refused, so nothing changed.</strong> ' + ui_e(ui.refused.message) + '</p>'
      + (ui.refused.report ? '<h3 class="sub">What that import held</h3>' + ui_reportLines(ui.refused.report) : '') + '</div>');
  }
  const rep = st && st.lastImport && st.lastImport.report;
  // Only the last import's report is kept, but the pulls it did not replace are on screen too: they are listed from their
  // own rows, so a row the Summary says counts nowhere is always found here (review IMP-2)
  let kept = [];
  if (typeof SP.keptPullLines === 'function') {
    try { kept = SP.keptPullLines(st && st.pulls && st.pulls.current, rep || null); }
    catch (e) { kept = ['The pulls kept from earlier imports could not be listed: ' + ((e && e.message) || e)]; }
  }
  // After a refusal, "the last import" is the refused one, named so in the box above: the report held is of the one before
  // it, the last that was taken. Headed "The last import" too, one screen used one phrase for two imports, and "its report
  // above" could mean either (review F8).
  const lastTaken = ui.refused ? 'The last import taken' : 'The last import';
  if (rep) out.push('<h3 class="sub">' + (kept.length ? lastTaken + (ui.refused ? ', before the one refused' : '')
    : 'The import the data on screen came from') + '</h3>' + ui_reportLines(rep));
  else if (!ui.refused) out.push('<p class="none">No import report is held in this file.</p>');
  // the rows no appropriation claims, each named: the Summary sends the reader here for them, and they are in no other
  // view (review XP-8)
  let unid = [];
  if (typeof SP.unidentifiedLines === 'function') {
    try { unid = SP.unidentifiedLines(st && st.pulls && st.pulls.current); }
    catch (e) { unid = ['The rows whose appropriation is not identified could not be listed: ' + ((e && e.message) || e)]; }
  }
  if (unid.length) out.push('<h3 class="sub">Rows whose appropriation is not identified</h3>' + ui_lines(unid));
  if (kept.length) {
    out.push('<h3 class="sub">Pulls on screen from earlier imports</h3><p class="l2">' + (rep ? lastTaken + ' did not replace these, so its report above '
      + 'does not cover them' + (ui.refused ? ', and the refused one changed nothing' : '') + '.' : 'No report is held for them.')
      + ' What each holds that counts nowhere is listed from its own rows.</p>' + ui_lines(kept));
  }
  // A BAE REPORT KEPT OVER A LATER IMPORT of pulls only: the last import's report has no section for it, so its rows,
  // unreadable ones in full, and its total check are listed from the stored report (SP.baeKeptLines; [] when the last
  // import brought it, or with none)
  let baeKept = [];
  if (typeof SP.baeKeptLines === 'function') {
    try { baeKept = SP.baeKeptLines(ui_bae(), rep || null); }
    catch (e) { baeKept = ['The BAE report kept from an earlier import could not be listed: ' + ((e && e.message) || e)]; }
  }
  if (baeKept.length) out.push('<h3 class="sub">The BAE report on screen, from an earlier import</h3>' + ui_lines(baeKept));
  // §15.4 FY2025 OBBBA funding, left out: the sheet's section, line for line (SP.obbbaLines), when any is loaded
  const obl = M ? SP.obbbaLines(M) : [];
  if (obl.length) out.push('<section class="obbba" aria-labelledby="ui-obbba-h"><h3 class="sub" id="ui-obbba-h">' + ui_e(SP.OBBBA_HEAD) + '</h3>' + ui_lines(obl) + '</section>');
  out.push(ui_baeRead(M));
  return out.join('');
}

// THE BAE REPORT AS THE FIGURES READ IT (CONTRACT §14.6). The import's own section (above) says what the file held; this
// says what the rules make of it on this page, which depends on the pull on screen and on the rules, so it is worked out
// from the model every time: the report's rows by scope, its sustainment budgets' Approved and Authorized by appropriation
// and FY, each block whose CCaR plan is under half the report's Approved (rule 5: flagged, never hidden), the budgets the
// pull counts that the report has no row for, and the report's sustainment budgets with money that no pull row names.
// Drawn only with a report loaded.
function ui_baeRead(M) {
  if (!ui_rep(M)) return '';
  const X = M.bae, r = X.rows;
  const rows = n => ui_e(ui_rowsN(n));
  const usd = c => '$' + ui_e(SP.fmtMText(c)) + 'M';
  const before = X.derived.filter(d => d.why === SP.BAE_COUNTED_WHY.first).length;
  const off = X.derived.filter(d => d.why === SP.BAE_COUNTED_WHY.off).length;
  const out = ['<section class="baeread" aria-labelledby="ui-baeread-h"><h3 class="sub" id="ui-baeread-h">The BAE report as the figures read it</h3>',
    '<p class="l2">A budget row counts in Approved and Authorized when its name places it in O&amp;M, Full Fund, Initial Spares or OPN, it is not Flyaway '
    + '(production), its FY is FY' + ui_e(M.firstFY) + ' or later' + (r.obbba ? ', it is not ' + ui_e(SP.OBBBA_WHY) : '')
    + ', and the switches show its service and lane. A PMO’s row counts the budgets whose name ends in '
    + 'that PMO’s code, and the (no PMO) row those whose name ends in none.</p>',
    '<ul class="notes baerows">'
    + '<li data-scope="in">Sustainment budgets: ' + rows(r.in) + ' (' + ui_e(SP.fmtInt(X.budgetsIn)) + (X.budgetsIn === 1 ? ' budget' : ' budgets') + '), Approved '
    + usd(X.cents.approved) + ' and Authorized ' + usd(X.cents.authorized) + ' over every FY'
    + (before ? '; of them, ' + rows(before) + ' before FY' + ui_e(M.firstFY) + ' count nowhere' : '')
    + (off ? '; ' + rows(off) + ' of a service or lane switched off ' + (off === 1 ? 'is' : 'are') + ' not counted while the switches show what they do' : '') + '.</li>'
    + '<li data-scope="flyaway">Flyaway (production), counted nowhere: ' + rows(r.flyaway) + '.</li>'
    + '<li data-scope="noap">Naming no appropriation (Advance Procurement, Modifications, RDT&amp;E, squadron budgets), counted nowhere: ' + rows(r.noap) + '.</li>'
    // §15.3: said only when the report holds some (r.obbba is there only then)
    + (r.obbba ? '<li data-scope="obbba">' + ui_e(SP.OBBBA_WHY) + ', counted nowhere: ' + rows(r.obbba) + '.</li>' : '')
    + '<li data-scope="bad">Could not be read, counted nowhere: ' + rows(r.bad) + (r.bad ? ' (each is listed in the report’s own section)' : '') + '.</li>'
    + '</ul>'];
  // in scope, every FY, no switches (§14.5 byBlock), with where each one stands on this page
  const blocks = new Map(M.blocks.map(b => [b.key, b]));
  const keys = Object.keys(X.byBlock);
  out.push('<h4 class="sub">Sustainment budgets by appropriation and FY, every service and lane</h4>' + (keys.length
    ? '<div class="tw"><table class="grid baeblocks"><thead><tr class="hd"><th scope="col">Appropriation</th><th scope="col">FY</th><th scope="col" class="n">Approved ($M)</th>'
      + '<th scope="col" class="n">Authorized ($M)</th><th scope="col">On this page</th></tr></thead><tbody>'
      + keys.map(k => {
        const [ap, fy] = k.split('|'), x = X.byBlock[k], b = blocks.get(k);
        // the flag compares the block's Approved under the switches, not this row's every-service figure: said so when they
        // differ (review P4-4)
        const where = b ? 'Its figures fill this block' + (b.planShort ? (M.shown.all ? ' (the CCaR plan is under half of it)'
          : ' (with the switches as they are, the CCaR plan is under half the block’s Approved)') : '')
          : Number(fy) < M.firstFY ? 'Before FY' + M.firstFY + ': counted nowhere'
            // §15.4: its only pull rows are FY2025 OBBBA funding, which is left out (the sheet's line says the same)
            : SP.isObbbaNoBlock(M, k) ? SP.OBBBA_NOBLOCK_WHERE
            : 'The CCaR pull has no rows for it, so no block is shown';
        return '<tr data-bk="' + ui_e(k) + '"><td>' + ui_e(UI_AP_LABEL[ap] || ap) + '</td><td>FY' + ui_e(fy) + '</td>' + ui_m(x.approved) + ui_m(x.authorized)
          + '<td class="wrap">' + ui_e(where) + '</td></tr>';
      }).join('') + '</tbody></table></div>'
    : '<p class="none">The report holds no sustainment budget that could be read.</p>'));
  if (X.planShort.length) {
    // worked out with the switches as they are, as the pull-only list below says of itself (review P4-4): with USN off the
    // two OPN flags went and O&M FY2028 came, under a heading that said the view covers every row
    out.push('<h4 class="sub">Blocks whose CCaR plan is under half the BAE report’s Approved</h4>'
      + (M.shown.all ? '' : '<p class="note">Counted with the switches as they are: a block’s Approved and its CCaR plan count only the services and lanes shown, '
        + 'so a switch can flag a block here or take its flag away.</p>')
      + '<ul class="notes planshort">' + X.planShort.map(p =>
      '<li data-bk="' + ui_e(p.ap + '|' + p.fy) + '">' + ui_e((UI_AP_LABEL[p.ap] || p.ap) + ' FY' + p.fy + ': the CCaR plan is $' + SP.fmtMText(p.planned) + 'M, the report’s Approved $'
        + SP.fmtMText(p.approved) + 'M. Obl % is measured against the report’s figure; the slide block measures the plan.') + '</li>').join('') + '</ul>');
  }
  // a name list as the files spell them
  const names = (list, cls, none) => list.length
    ? '<ul class="notes ' + cls + '">' + list.map(n => '<li>' + ui_e(n) + '</li>').join('') + '</ul>' : '<p class="none">' + ui_e(none) + '</p>';
  out.push('<h4 class="sub" data-n="' + X.pullOnly.length + '">Budgets the CCaR pull counts that have no row in the BAE report: ' + ui_e(SP.fmtInt(X.pullOnly.length)) + '</h4>'
    + (M.shown.all ? '' : '<p class="note">Counted with the switches as they are: a budget of a service or lane switched off is not listed.</p>')
    + names(X.pullOnlyNames, 'pullonly', 'None: every budget the pull counts has a row in the report.'));
  out.push('<h4 class="sub" data-n="' + X.reportOnly.length + '">Sustainment budgets of the BAE report with money for FY' + ui_e(M.firstFY) + ' to FY' + ui_e(M.E)
    + ' that no CCaR pull row names: ' + ui_e(SP.fmtInt(X.reportOnly.length)) + '</h4>'
    + names(X.reportOnlyNames, 'reportonly', 'None: every such budget is named on a row of the pull.'));
  // review M4-6: a covered block's plan and Obligated count every row the pull places in it, while its Approved holds the
  // report's sustainment budgets alone; the money on a budget that can never be among them is listed, block by block
  const offRep = Array.isArray(X.offReport) ? X.offReport : [];
  const offItems = offRep.flatMap(o => o.budgets.map(t => ({ o, t })));
  out.push('<h4 class="sub" data-n="' + offItems.length + '">Budgets the CCaR pull counts on a block the BAE report covers, which its Approved leaves out: '
    + ui_e(SP.fmtInt(offItems.length)) + '</h4>'
    + '<p class="note">Flyaway (production), a budget that names no appropriation (placed by the sheet it came on), and a row with no Budget: '
    + 'the block’s CCaR plan and Obligated count them, its Approved never can, so Obl % counts their obligations against an Approved without them.</p>'
    + (M.shown.all ? '' : '<p class="note">Counted with the switches as they are: a row of a service or lane switched off is not listed.</p>')
    + (offItems.length ? '<ul class="notes offreport">' + offItems.map(({ o, t }) => '<li data-bk="' + ui_e(o.ap + '|' + o.fy) + '" data-kind="' + ui_e(t.kind) + '">'
      + ui_e((UI_AP_LABEL[o.ap] || o.ap) + ' FY' + o.fy + ': ' + (t.name === '' ? '(no Budget, ' + ui_rowsN(t.rows) + ')' : t.name) + ' ('
        + (SP.OFF_REPORT_KIND[t.kind] || t.kind) + '): CCaR plan $' + SP.fmtMText(t.planned) + 'M, obligated $' + SP.fmtMText(t.obligated) + 'M.') + '</li>').join('') + '</ul>'
      : '<p class="none">None: every row the pull counts on a covered block is on a budget the report’s Approved can hold.</p>'));
  out.push('</section>');
  return out.join('');
}

function ui_dRow(label, pair) {
  return '<tr><th scope="row">' + ui_e(label) + '</th>' + ui_m(pair[0]) + ui_m(pair[1]) + ui_m(pair[1] - pair[0]) + '</tr>';
}
function ui_rowsN(n) { return SP.fmtInt(n) + (n === 1 ? ' row' : ' rows'); }
function ui_ymLabel(ym) { return ym ? SP.asOfLabel(ym) : 'No date'; }
// a line's months in words: "Jun-2026" for one, "Jun-2026 (1.00), Jul-2026 (0.27)" for several
function ui_yms(list) {
  return list.length === 1 ? ui_ymLabel(list[0].ym) : list.map(x => ui_ymLabel(x.ym) + ' (' + SP.fmtMText(x.cents) + ')').join(', ');
}
// What changed in a line, in words: the amount (its own columns show by how much), the obligated dollars, the money that
// moved between months, and rows that could not be read on either side (review BP-2, M1)
function ui_leafWhat(l) {
  const w = [];
  if (l.what.includes('amount')) w.push('amount');
  if (l.what.includes('obligated')) w.push('obligated ' + SP.fmtMText(l.obligated[0]) + ' → ' + SP.fmtMText(l.obligated[1]));
  if (l.what.includes('dates')) w.push(SP.fmtMText(l.moved.cents) + ' moved from ' + ui_yms(l.moved.from) + ' to ' + ui_yms(l.moved.to));
  if (l.unread[0] || l.unread[1]) {
    const u = [];
    if (l.unread[0]) u.push(ui_rowsN(l.unread[0]) + ' in the earlier pull');
    if (l.unread[1]) u.push(ui_rowsN(l.unread[1]) + ' in this pull');
    w.push(u.join(' and ') + ' could not be read (counted in no figure)');
  }
  return w.join('; ');
}
function ui_vChanges(M) {
  const st = ui_state();
  const out = ['<h2 class="title">What changed between the last two different pulls</h2>',
    '<p class="l2">Every row of every FY is compared, whatever the switches show and whatever the First FY, because the question is what the new pull holds.'
    + ' A row that could not be read (FY or Amount) counts in no figure, here as everywhere, but it is still in its pull: its CCaR and its line are not'
    + ' called new or gone because of it.</p>', ui_shown(M, '', 'it compares every row of the two pulls')];
  const hist = st && Array.isArray(st.history) ? st.history : [];
  if (hist.length) {
    // an import that placed no row in an appropriation (only rows no appropriation claims) read "2026-11-04: " with
    // nothing after it, as if the list had failed to draw (review SEAM-7); two imports on one day read alike (review BP-6)
    const when = ui_whens(hist.map(h => h.importedAt));
    out.push('<h3 class="sub">Imports this file holds</h3><ul class="notes">' + hist.map(h => {
      const aps = (Array.isArray(h.aps) ? h.aps : []).map(a => UI_AP_LABEL[a] || a);
      // an import that brought a BAE report says so (§14.7): one holding only a report placed no pull row, and read as
      // "no pull (only rows whose appropriation was not identified)" it named rows it never brought
      if (h.bae && typeof h.bae === 'object') aps.push('BAE report' + (Number.isInteger(h.bae.rows) ? ' (' + SP.fmtInt(h.bae.rows) + ' readable ' + (h.bae.rows === 1 ? 'row' : 'rows') + ')' : ''));
      return '<li>' + ui_e(when(h.importedAt) || 'date unknown') + ': ' + ui_e(aps.length ? aps.join(', ') : 'no pull (only rows whose appropriation was not identified)') + '</li>';
    }).join('') + '</ul>');
  }
  // the BAE report's section (§14.6) stands beside the pulls' whatever they hold: a report imported twice has a change to
  // show on a page whose pulls have none; '' with no report
  const baeSec = ui_baeChanges();
  let D = {};
  if (!ui_fn('diffPulls')) return out.concat(['<p class="none">What changed is not available yet (SP.diffPulls is missing).</p>', baeSec]).join('');
  try { D = SP.diffPulls((st && st.pulls && st.pulls.previous) || {}, ui_pulls(), ui_settings()); }
  catch (e) { return out.concat(['<p class="err">What changed could not be worked out: ' + ui_e((e && e.message) || e) + '</p>', baeSec]).join(''); }
  const aps = Object.keys(D);
  if (!aps.length) { out.push('<p class="none">Only one pull so far. After the next import of an appropriation, this view shows what changed in it.</p>', baeSec); return out.join(''); }
  // A pull's section compares the pulls themselves (SP.diffPulls: every row, no switches), so its figure is the CCaR plan.
  // With a BAE report loaded, "Approved" on every other view is the report's (§14.3, answer 2), and headed "Approved" here
  // the plan read 423.70 for O&M FY2026 beside 520.28 on the Summary and in the BAE section below, one word for two
  // figures (review P4-2). So with a report it is named what it is, the CCaR plan, as §14.5 names it beside a covered
  // block's Approved, and the view says why once. With none the plan IS Approved, and the words are as they were.
  const planW = ui_rep(M) ? 'CCaR plan' : 'Approved';
  if (ui_rep(M)) {
    out.push('<p class="note plan">A BAE report is loaded, so Approved on the other views is the BAE report’s (the CCaR plan only on a block the report has'
      + ' no figure for, marked §). Each pull’s section below compares the two pulls themselves, every row whatever the switches, so its figures are the'
      + ' CCaR plan, and are named so. What changed in the BAE report is in its own section at the end.</p>');
  }
  for (const ap of aps) {
    const d = D[ap];
    // A pull imported again, the same row for row, keeps the comparison it had (review IMP-11) and says so: shown as the
    // newest pull, its changes read as this week's when they were last week's (review BP-1). The section is named by the
    // pull those rows first came in, and the import that brought them again is said under it.
    const cur = ui_pulls()[ap] || {};
    const since = typeof cur.sameSince === 'string' && cur.sameSince ? cur.sameSince : null;
    const [w0, w1] = ui_pullPair(d.importedAt[0], since || d.importedAt[1]);
    out.push('<section class="chg" data-ap="' + ui_e(ap) + '"><h3 class="bar">' + ui_e(d.label) + ': pull of ' + ui_e(w0 || 'unknown') + ' → pull of '
      + ui_e(w1 || 'unknown') + '</h3>');
    if (since) {
      const [s1, s2] = ui_pullPair(since, d.importedAt[1]);
      out.push('<p class="l2 same" data-same="' + ui_e(ap) + '"><strong>Nothing changed in the ' + ui_e(d.label) + ' pull imported ' + ui_e(s2 || 'later')
        + ':</strong> it is the same, row for row, as the pull of ' + ui_e(s1) + '. What follows is what the pull of ' + ui_e(s1)
        + ' changed, against the one before it.</p>');
    }
    // rows that could not be read, said where the figures they are missing from are (review M1): the import's message
    // said so too, but it can be dismissed and is not on this view
    const un = Array.isArray(d.unread) ? d.unread : [0, 0];
    if (un[0] || un[1]) {
      out.push('<p class="note unread" data-unread="' + ui_e(un[0] + '|' + un[1]) + '">' + ui_e(ui_rowsN(un[1])) + ' in this pull and ' + ui_e(ui_rowsN(un[0]))
        + ' in the earlier one could not be read (FY or Amount): they count in no figure below (see the Import report). Their CCaRs and lines are still in'
        + ' the pulls, so none is called new or gone because of them; the lines they belong to are listed apart.</p>');
    }
    out.push('<div class="tw"><table class="grid"><thead><tr class="hd"><th scope="col">All FYs</th><th scope="col" class="n">Before ($M)</th><th scope="col" class="n">After ($M)</th><th scope="col" class="n">Change ($M)</th></tr></thead><tbody>'
      + ui_dRow(planW, d.totals.approved) + ui_dRow('Obligated', d.totals.obligated) + '</tbody></table></div>');
    const bk = Object.keys(d.byBlock);
    out.push('<div class="tw"><table class="grid"><thead><tr class="hd"><th scope="col">FY</th><th scope="col" class="n">' + planW + ' before</th><th scope="col" class="n">' + planW + ' after</th>'
      + '<th scope="col" class="n">Change</th><th scope="col" class="n">Obligated before</th><th scope="col" class="n">Obligated after</th><th scope="col" class="n">Change</th></tr></thead><tbody>'
      + bk.map(k => { const x = d.byBlock[k]; return '<tr data-bk="' + ui_e(k) + '"><th scope="row">FY' + ui_e(x.fy) + '</th>' + ui_m(x.approved[0]) + ui_m(x.approved[1]) + ui_m(x.approved[1] - x.approved[0])
        + ui_m(x.obligated[0]) + ui_m(x.obligated[1]) + ui_m(x.obligated[1] - x.obligated[0]) + '</tr>'; }).join('') + '</tbody></table></div>');
    const ccTable = (title, list, kind) => '<h4 class="sub" data-n="' + list.length + '" data-list="' + kind + '">' + ui_e(title) + ': ' + ui_e(SP.fmtInt(list.length)) + '</h4>' + (list.length
      ? '<div class="tw"><table class="grid"><thead><tr class="hd"><th scope="col">CCaR</th><th scope="col">PMO</th><th scope="col" class="n">$M</th></tr></thead><tbody>'
        + list.map(c => '<tr><td>' + ui_e(c.label) + (c.unread ? ' (' + ui_e(ui_rowsN(c.unread)) + ' that could not be read)' : '') + '</td><td>' + ui_e(c.pmo) + '</td>'
          + ui_m(c.cents) + '</tr>').join('') + '</tbody></table></div>' : '');
    out.push(ccTable('CCaRs new in this pull', d.ccarsNew, 'new'), ccTable('CCaRs gone from this pull', d.ccarsGone, 'gone'));
    out.push('<h4 class="sub" data-n="' + d.pmoMoves.length + '" data-list="moves">CCaRs that moved to another PMO: ' + ui_e(SP.fmtInt(d.pmoMoves.length)) + '</h4>' + (d.pmoMoves.length
      ? '<div class="tw"><table class="grid"><thead><tr class="hd"><th scope="col">CCaR</th><th scope="col">From</th><th scope="col">To</th><th scope="col" class="n">$M</th></tr></thead><tbody>'
        + d.pmoMoves.map(c => '<tr><td>' + ui_e(c.label) + '</td><td>' + ui_e(c.from) + '</td><td>' + ui_e(c.to) + '</td>' + ui_m(c.cents) + '</tr>').join('') + '</tbody></table></div>' : ''));
    // LINES, not rows: each is every row of one FY, PMO, Title, Plan Event and CCaR added together, so a row taken from a
    // line that stays changes the line. Called "rows", a pull that lost four rows read "1 row gone" (review BP-6).
    out.push('<h4 class="sub">Lines by PMO / Title / Plan Event / CCaR</h4><p class="note lines">A line is every row of one FY, PMO, Title, Plan Event and CCaR, added'
      + ' together: a row added to a line that was there, or taken from one that stays, changes that line; it is not a new or gone line. A line changes'
      + ' when its amount changes, when its money becomes obligated (Actual Execution) or stops being, or when its money moves to another month. A row of'
      + ' $0 changes none of those.</p>');
    // words that agree with their count: "Show the 12 changed amount" was one of them (review S11)
    const kinds = [['changed', 'changed line', 'changed lines'], ['new', 'new line', 'new lines'], ['gone', 'line gone', 'lines gone'],
      ['unread', 'line with a row that could not be read', 'lines with a row that could not be read']];
    for (const [kind, one, many] of kinds) {
      const list = (d.leaves && d.leaves[kind]) || [];
      if (kind === 'unread' && !list.length) continue;
      const key = ap + '|' + kind, open = ui.diffOpen.has(key), words = list.length === 1 ? one : many;
      const R = ui.reg, i = R.diff.length;
      R.diff.push(key);
      out.push('<p class="acts"><button type="button" data-act="diff" data-i="' + i + '" data-fkey="diff:' + ui_e(key) + '" aria-expanded="' + (open ? 'true' : 'false') + '"'
        + (list.length ? '' : ' disabled') + '>' + (open ? 'Hide' : 'Show') + ' the ' + ui_e(SP.fmtInt(list.length)) + ' ' + ui_e(words) + ' (largest change first)</button></p>');
      if (open && list.length) {
        out.push('<div class="tw"><table class="grid" data-leaves="' + kind + '"><thead><tr class="hd"><th scope="col">FY</th><th scope="col">PMO</th><th scope="col">Title</th><th scope="col">Plan Event</th>'
          + '<th scope="col">CCaR</th><th scope="col" class="n">Before</th><th scope="col" class="n">After</th><th scope="col" class="n">Change</th>'
          + '<th scope="col" class="n">Obligated before</th><th scope="col" class="n">Obligated after</th><th scope="col">What changed</th></tr></thead><tbody>'
          + list.map(l => '<tr><td>FY' + ui_e(l.fy) + '</td><td class="wrap">' + ui_e(l.pmo) + '</td><td class="wrap">' + ui_e(l.title) + '</td><td class="wrap">' + ui_e(l.pe)
            + '</td><td>' + ui_e(l.ccar) + '</td>' + ui_m(l.before) + ui_m(l.after) + ui_m(l.change) + ui_m(l.obligated[0]) + ui_m(l.obligated[1])
            + '<td class="wrap what">' + ui_e(ui_leafWhat(l)) + '</td></tr>').join('') + '</tbody></table></div>');
      }
    }
    out.push('</section>');
  }
  out.push(baeSec);
  return out.join('');
}

// WHAT CHANGED IN THE BAE REPORT (CONTRACT §14.6, SP.diffBae): the report on screen against the one it replaced, over its
// sustainment budgets, every FY and every row, whatever the switches: the question is what the new report says, as it is
// for a pull. A report imported again row for row keeps the comparison it had and says so, as a pull does (review BP-1).
// '' with no report on screen, so a page without one draws What changed exactly as before.
function ui_baeChanges() {
  const cur = ui_bae(), prev = ui_bae('previous');
  if (!cur) return '';
  const since = typeof cur.sameSince === 'string' && cur.sameSince ? cur.sameSince : null;
  const head = t => '<section class="chg bae" data-ap="bae"><h3 class="bar">' + ui_e(t) + '</h3>';
  if (!prev) {
    return head('BAE report') + '<p class="none">Only one BAE report so far' + (since ? ' (the newest import brought it again, row for row)' : '')
      + '. After the next import of a BAE report, this view shows what changed in it.</p></section>';
  }
  if (!ui_fn('diffBae')) return head('BAE report') + '<p class="none">What changed in the BAE report is not available yet (SP.diffBae is missing).</p></section>';
  let D;
  try { D = SP.diffBae(prev, cur, ui_settings()); }
  catch (e) { return head('BAE report') + '<p class="err">What changed in the BAE report could not be worked out: ' + ui_e((e && e.message) || e) + '</p></section>'; }
  // each report named by its date (from its file name), its file and when it came in, the import times told apart as
  // two pulls' are (review S11)
  const [i0, i1] = ui_pullPair(prev.importedAt, since || cur.importedAt);
  const lab = (b, i) => {
    const st = typeof b.stamp === 'string' && b.stamp ? b.stamp : '', f = String(b.file ?? '');
    return (st || 'imported ' + (i || 'at a time not recorded')) + ' (“' + f + '”' + (st ? ', imported ' + (i || 'at a time not recorded') : '') + ')';
  };
  const out = [head('BAE report: ' + lab(prev, i0) + ' → ' + lab(cur, i1))];
  if (since) {
    const [s1, s2] = ui_pullPair(since, cur.importedAt);
    out.push('<p class="l2 same" data-same="bae"><strong>Nothing changed in the BAE report imported ' + ui_e(s2 || 'later') + ':</strong> it is the same, row for row, as '
      + 'the report imported ' + ui_e(s1) + '. What follows is what that report changed, against the one before it.</p>');
  }
  // §15.3: SP.diffBae leaves FY2025 OBBBA funding out as it leaves Flyaway out; said only when either report holds some
  const obIn = [prev, cur].some(b => Array.isArray(b.rows) && b.rows.some(r => { try { return SP.baeDerive(r, ui_settings()).scope === 'obbba'; } catch (e) { return false; } }));
  out.push('<p class="note">Its sustainment budgets are compared, every FY and every row, whatever the switches show; Flyaway' + (obIn ? ', ' + ui_e(SP.OBBBA_WHY) + ',' : '')
    + ' and the budgets that name no '
    + 'appropriation are left out, as they are from every figure. A row that could not be read counts in no figure, but its budget is still in its report, '
    + 'so it is never called new, gone or changed because of it: a budget with such a row is listed apart.</p>');
  // rows that could not be read, said where the figures they are missing from are, as for a pull (review M1): the import's
  // message said so, but it can be dismissed and is not on this view, and a budget whose row stopped reading read as cut
  // to $0 (review I4-3)
  const un = Array.isArray(D.unread) ? D.unread : [0, 0];
  if (un[0] || un[1]) {
    out.push('<p class="note unread" data-unread="' + ui_e(un[0] + '|' + un[1]) + '">' + ui_e(ui_rowsN(un[1])) + ' of this report’s sustainment budgets and '
      + ui_e(ui_rowsN(un[0])) + ' of the earlier one’s could not be read (Budget Name, FY or an amount): they count in no figure below (see the Import report). '
      + 'Their budgets are still in the reports, so none is called new, gone or changed because of them; those budgets are listed apart.</p>');
  }
  const bb = Object.values(D.byBlock);
  const tot = f => [0, 1].map(k => bb.reduce((a, x) => a + x[f][k], 0));
  out.push('<div class="tw"><table class="grid baetot"><thead><tr class="hd"><th scope="col">All FYs</th><th scope="col" class="n">Before ($M)</th><th scope="col" class="n">After ($M)</th>'
    + '<th scope="col" class="n">Change ($M)</th></tr></thead><tbody>' + ui_dRow('Approved', tot('approved')) + ui_dRow('Authorized', tot('authorized')) + '</tbody></table></div>');
  out.push('<div class="tw"><table class="grid baeby"><thead><tr class="hd"><th scope="col">Appropriation</th><th scope="col">FY</th><th scope="col" class="n">Approved before</th>'
    + '<th scope="col" class="n">Approved after</th><th scope="col" class="n">Change</th><th scope="col" class="n">Authorized before</th><th scope="col" class="n">Authorized after</th>'
    + '<th scope="col" class="n">Change</th></tr></thead><tbody>'
    + Object.keys(D.byBlock).map(k => { const x = D.byBlock[k]; return '<tr data-bk="' + ui_e(k) + '"><td>' + ui_e(UI_AP_LABEL[x.ap] || x.ap) + '</td><th scope="row">FY' + ui_e(x.fy) + '</th>'
      + ui_m(x.approved[0]) + ui_m(x.approved[1]) + ui_m(x.approved[1] - x.approved[0]) + ui_m(x.authorized[0]) + ui_m(x.authorized[1]) + ui_m(x.authorized[1] - x.authorized[0]) + '</tr>'; }).join('')
    + '</tbody></table></div>');
  // a budget's FYs in words: those that moved, for a changed budget; those it holds, for one new or gone
  const fys = (e, kind) => Object.keys(e.byFy).map(fy => {
    const f = e.byFy[fy], ma = f.approved[0] !== f.approved[1], mu = f.authorized[0] !== f.authorized[1];
    if (kind === 'new' || kind === 'gone') { const k = kind === 'new' ? 1 : 0; return 'FY' + fy + ' Approved ' + SP.fmtMText(f.approved[k]) + ', Authorized ' + SP.fmtMText(f.authorized[k]); }
    if (!ma && !mu) return '';
    return 'FY' + fy + (ma ? ' Approved ' + SP.fmtMText(f.approved[0]) + ' → ' + SP.fmtMText(f.approved[1]) : '')
      + (ma && mu ? ',' : '') + (mu ? ' Authorized ' + SP.fmtMText(f.authorized[0]) + ' → ' + SP.fmtMText(f.authorized[1]) : '');
  }).filter(Boolean).join('; ');
  // a budget listed apart says first how many of its rows each report could not read: its figures are only the rows that read
  const what = (e, kind) => {
    const w = fys(e, kind);
    if (kind !== 'unread') return w;
    const u = Array.isArray(e.unread) ? e.unread : [0, 0];
    return 'Rows that could not be read: ' + SP.fmtInt(u[0]) + ' → ' + SP.fmtInt(u[1]) + (w ? '; the rows that read: ' + w : '');
  };
  const kinds = [['changed', D.budgetsChanged, 'changed budget', 'changed budgets'], ['new', D.budgetsNew, 'budget new in this report', 'budgets new in this report'],
    ['gone', D.budgetsGone, 'budget gone from this report', 'budgets gone from this report'],
    ['unread', Array.isArray(D.budgetsUnread) ? D.budgetsUnread : [], 'budget with a row that could not be read', 'budgets with a row that could not be read']];
  for (const [kind, list, one, many] of kinds) {
    if (kind === 'unread' && !list.length) continue;
    const key = 'bae|' + kind, open = ui.diffOpen.has(key), R = ui.reg, i = R.diff.length;
    R.diff.push(key);
    out.push('<h4 class="sub" data-n="' + list.length + '" data-list="bae-' + kind + '">' + ui_e(many.charAt(0).toUpperCase() + many.slice(1)) + ': ' + ui_e(SP.fmtInt(list.length)) + '</h4>');
    if (!list.length) continue;
    out.push('<p class="acts"><button type="button" data-act="diff" data-i="' + i + '" data-fkey="diff:' + ui_e(key) + '" aria-expanded="' + (open ? 'true' : 'false') + '">'
      + (open ? 'Hide' : 'Show') + ' the ' + ui_e(SP.fmtInt(list.length)) + ' ' + ui_e(list.length === 1 ? one : many) + ' (largest change first)</button></p>');
    if (open) {
      out.push('<div class="tw"><table class="grid" data-budgets="' + kind + '"><thead><tr class="hd"><th scope="col">Budget</th><th scope="col" class="n">Approved before</th>'
        + '<th scope="col" class="n">Approved after</th><th scope="col" class="n">Change</th><th scope="col" class="n">Authorized before</th><th scope="col" class="n">Authorized after</th>'
        + '<th scope="col" class="n">Change</th><th scope="col">' + (kind === 'changed' ? 'The FYs that changed ($M)' : kind === 'unread' ? 'What changed ($M)' : 'Its FYs ($M)') + '</th></tr></thead><tbody>'
        + list.map(e => '<tr><td class="wrap">' + ui_e(e.name) + '</td>' + ui_m(e.approved[0]) + ui_m(e.approved[1]) + ui_m(e.approved[1] - e.approved[0])
          + ui_m(e.authorized[0]) + ui_m(e.authorized[1]) + ui_m(e.authorized[1] - e.authorized[0]) + '<td class="wrap what">' + ui_e(what(e, kind)) + '</td></tr>').join('')
        + '</tbody></table></div>');
    }
  }
  out.push('</section>');
  return out.join('');
}

// $M text <-> cents for Authorized. Typed through parseAmount (so "$1,234.50", "(12.5)" and blanks read as everywhere
// else), then worked out from the typed digits: parseAmount alone would round a $M figure to the hundredth, $10,000.
function ui_mText(c) {
  if (typeof c !== 'number' || !isFinite(c)) return '';
  const a = Math.abs(c), w = Math.floor(a / 1e8);
  let f = String(a % 1e8).padStart(8, '0').replace(/0+$/, '');
  if (f.length < 2) f = f.padEnd(2, '0');
  return (c < 0 ? '-' : '') + String(w).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + f;
}
function ui_readM(text) {
  const p = SP.parseAmount(text);
  if (p.how === 'blank') return { blank: true };
  if (p.cents === null) return { err: '“' + String(text).trim() + '” is not an amount in $M.' };
  const digits = String(text).replace(/[\s$,()+−-]/g, '');
  const n = Number(digits);
  if (!isFinite(n)) return { err: '“' + String(text).trim() + '” is not an amount in $M.' };
  const neg = /[-−(]/.test(String(text));
  const raw = n * 1e8;
  const cents = Math.round(raw);
  if (!Number.isSafeInteger(cents)) return { err: '“' + String(text).trim() + '” is too large.' };
  return { cents: neg && cents ? -cents : cents, rounded: Math.abs(raw - cents) > 1e-6 };
}
function ui_pctText(x) { return typeof x === 'number' && isFinite(x) ? String(Number((x * 100).toPrecision(12))) : ''; }

// THE BAE REPORT ON SCREEN, for Settings (§14.6): which file, its date, when it came in, and the report it replaced. A
// report is replaced by importing another (it covers every appropriation, §14.7); there is nothing else to set here.
function ui_baeAbout() {
  const b = ui_bae(), p = ui_bae('previous');
  if (!b) return '';
  const n = b.rows.length, bad = b.rows.filter(r => r && Array.isArray(r.bad) && r.bad.length).length;
  const stamp = typeof b.stamp === 'string' && b.stamp ? b.stamp : '';
  const at = typeof b.importedAt === 'string' && b.importedAt ? b.importedAt : '';
  const since = typeof b.sameSince === 'string' && b.sameSince ? b.sameSince : '';
  const pLab = p ? (typeof p.stamp === 'string' && p.stamp ? 'of ' + p.stamp : 'imported ' + (ui_when(p.importedAt) || 'at a time not recorded')) + ' (“' + String(p.file ?? '') + '”)' : '';
  return '<h3 class="sub">BAE report of budgets</h3><ul class="notes baeabout">'
    + '<li>File “' + ui_e(String(b.file ?? '')) + '”, sheet “' + ui_e(String(b.sheet ?? '')) + '”.</li>'
    + '<li>' + (stamp ? 'Dated ' + ui_e(stamp) + ' by its file name.' : 'No date in its file name (it does not end _YYYY-MM-DD_HHMMSS), so it is known by the day it was imported.') + '</li>'
    + '<li>Imported ' + ui_e(at ? ui_when(at) + ' (this computer’s time)' : 'at a time not recorded') + (since ? '; the same, row for row, as the report imported ' + ui_e(ui_when(since)) : '') + '.</li>'
    + '<li>' + ui_e(ui_rowsN(n)) + (bad ? ', ' + ui_e(SP.fmtInt(n - bad)) + ' of them readable (the Import report lists the others)' : '') + '.</li>'
    + (p ? '<li>The report it replaced, ' + ui_e(pLab) + ', is kept for What changed.</li>' : '')
    + '</ul><p class="note">It fills Approved and Authorized wherever it has figures for a block. To replace it, import a newer BAE report with '
    + '<strong>Import CCaR pull…</strong>: a report replaces the one on screen whole.</p>';
}
// Block, Typed, BAE report, Used (§14.6). Typed is the box; BAE report is what the report holds for the block with the
// switches as they are (SP's reportAuthorized, there even while a typed figure wins over it), or "no figure" (§); Used
// is the block's Authorized as every table prints it, with its mark. The box carries the same data-act, index and key as
// the table with no report, so typing, clearing and the keyboard's place work as they always have.
function ui_authBae(M, au) {
  // no § here: the table has no Approved column; a block the report has no figure for says so, and its Used is Approved (†)
  const marks = { dag: false, ddag: false, sect: false };
  const body = M.blocks.map((b, i) => {
    const has = Object.prototype.hasOwnProperty.call(au, b.key) && Number.isSafeInteger(au[b.key]);
    const name = b.apLabel + ' FY' + b.fy, m = SP.authMark(b, M);
    if (m === '†') marks.dag = true;
    if (m === '‡') marks.ddag = true;
    const src = b.authorizedSrc === 'entered' ? 'typed' : b.authorizedSrc === 'report' ? 'BAE report' : 'Approved';
    return '<tr data-bk="' + ui_e(b.key) + '"><th scope="row">' + ui_e(name) + '</th>'
      + '<td><input type="text" inputmode="decimal" class="amt" data-act="auth" data-i="' + i + '" data-fkey="auth:' + i + '" value="'
      + (has ? ui_e(ui_mText(au[b.key])) : '') + '" placeholder="' + (b.covered ? '(BAE report)' : '(Approved)') + '" aria-label="Authorized for ' + ui_e(name) + ', $M"></td>'
      + (b.covered ? ui_m(b.reportAuthorized) : '<td class="n nofig">no figure</td>')
      + ui_auth(b.authorized, m, M).replace('<td class="n"', '<td class="n used" data-src="' + ui_e(src) + '" title="' + ui_e('From ' + (src === 'typed' ? 'the figure typed here' : src === 'BAE report' ? 'the BAE report' : 'Approved, standing in')) + '"')
      + '</tr>';
  }).join('');
  return '<div class="tw"><table class="grid auth authbae"><thead><tr class="hd"><th scope="col">Block</th><th scope="col">Typed ($M)</th>'
    + '<th scope="col" class="n">BAE report ($M)</th><th scope="col" class="n">Used ($M)</th></tr></thead><tbody>' + body + '</tbody></table></div>'
    + ui_markNotes(marks, M);
}

function ui_vSettings(M) {
  const S = ui_settings(), R = ui.reg;
  const g = S.goals && typeof S.goals === 'object' ? S.goals : SP.goalsDefault();
  const out = ['<h2 class="title">Settings (saved in this file)</h2>',
    '<p class="l2">Data through and First FY are in the top bar. The service and lane switches are this browser’s view and are not saved in the file.</p>',
    // §15.4 the fixed rule, under First FY, when a row it leaves out is loaded (the sheet says it in the same words)
    M && SP.obbbaLoaded(M) ? '<p class="note obbba-rule">' + ui_e(SP.OBBBA_RULE) + '</p>' : '',
    M ? ui_shown(M, (ui_rep(M) ? 'The BAE report’s figures beside Authorized, and Approved where the report has none, count only these' : 'The Approved figures beside Authorized count only these')
      + '; an Authorized you enter is for the appropriation and FY as a whole, every service and lane; the budget names list every row.') : ''];
  // goals
  out.push('<h3 class="sub" id="ui-goals">OSD goal curves (%, by year of availability)</h3>'
    + '<p class="note">Each value is the share of Approved that should be obligated by the end of that column. A blank cell has no goal, so no status.</p>'
    + '<div class="tw"><table class="grid goals" aria-describedby="ui-goals"><thead><tr class="hd"><th scope="col">Curve</th><th scope="col">Prior Yr</th>'
    + SP.MONTHS.map(m => '<th scope="col">' + m + '</th>').join('') + '</tr></thead><tbody>'
    + UI_CURVES.map(([k, words]) => {
      const row = Array.isArray(g[k]) ? g[k] : SP.GOALS_DEFAULT[k];
      return '<tr><th scope="row">' + ui_e(words) + '</th>' + Array.from({ length: 13 }, (_, i) =>
        '<td><input type="text" inputmode="decimal" class="pct" data-act="goal" data-curve="' + k + '" data-i="' + i + '" data-fkey="goal:' + k + ':' + i
        + '" value="' + ui_e(ui_pctText(row[i])) + '" aria-label="' + ui_e(words + ', ' + (i ? SP.MONTHS[i - 1] : 'Prior Yr') + ', percent') + '"></td>').join('') + '</tr>';
    }).join('') + '</tbody></table></div>'
    + '<p class="acts"><button type="button" data-act="goalreset" data-fkey="goalreset">Reset to v12’s curves</button></p>');
  // authorized
  R.auth = M ? M.blocks.map(b => b.key) : [];
  const au = S.authorized && typeof S.authorized === 'object' ? S.authorized : {};
  // WITH A BAE REPORT LOADED (§14.6) the table is Block, Typed, BAE report, Used: a typed figure wins over the report's for
  // its block (rule 8), and a blank box goes back to the report's, or to Approved where the report has no figure. With
  // none it is the table this view has always drawn.
  if (ui_rep(M)) {
    out.push(ui_baeAbout());
    out.push('<h3 class="sub">Authorized by appropriation and FY ($M)</h3><p class="note">A figure typed here is used for its block in place of the BAE report’s, '
      + 'and is for the appropriation and FY as a whole. Leave a box blank to use the BAE report’s figure, or Approved where the report has none.</p>');
    out.push(!M.blocks.length ? '<p class="none">No block to enter Authorized for.</p>' : ui_authBae(M, au));
  } else {
    out.push('<h3 class="sub">Authorized by appropriation and FY ($M)</h3><p class="note">Leave a box blank to show Approved in its place.</p>');
    out.push(!M || !M.blocks.length ? '<p class="none">No block to enter Authorized for.</p>'
      : '<div class="tw"><table class="grid auth"><thead><tr class="hd"><th scope="col">Appropriation</th><th scope="col">FY</th><th scope="col" class="n">Approved ($M)</th>'
        + '<th scope="col">Authorized ($M)</th></tr></thead><tbody>' + M.blocks.map((b, i) => {
          const has = Object.prototype.hasOwnProperty.call(au, b.key) && Number.isSafeInteger(au[b.key]);
          return '<tr><td>' + ui_e(b.apLabel) + '</td><td>FY' + ui_e(b.fy) + '</td>' + ui_m(b.approved) + '<td><input type="text" inputmode="decimal" class="amt" data-act="auth" data-i="' + i
            + '" data-fkey="auth:' + i + '" value="' + (has ? ui_e(ui_mText(au[b.key])) : '') + '" placeholder="(Approved)" aria-label="Authorized for ' + ui_e(b.apLabel + ' FY' + b.fy) + ', $M"></td></tr>';
        }).join('') + '</tbody></table></div>');
  }
  // special CCaRs
  const sp = Array.isArray(S.special) ? S.special : [];
  R.special = sp.slice();
  out.push('<h3 class="sub">Special CCaRs</h3><p class="note">On the Not Allocated lists, a special CCaR is one item, named by its title, whatever plan events it carries.</p>'
    + (sp.length ? '<ul class="speclist">' + sp.map((s, i) => '<li><span>' + ui_e(s) + '</span> <button type="button" data-act="specdel" data-i="' + i + '" data-fkey="specdel:' + i
      + '" aria-label="Remove ' + ui_e(s) + '">Remove</button></li>').join('') + '</ul>' : '<p class="none">None.</p>')
    + '<p class="acts"><label>Add a CCaR <input type="text" id="uiSpecNew" data-fkey="specnew" maxlength="200"></label>'
    + '<button type="button" data-act="specadd" data-fkey="specadd">Add</button>'
    + '<button type="button" data-act="specreset" data-fkey="specreset">Reset to ' + ui_e(SP.SPECIAL_CCARS_DEFAULT.join(', ')) + '</button></p>');
  // budget names
  let bt = [];
  try { bt = SP.budgetTable(ui_pulls(), S); } catch (e) { out.push('<p class="err">The budget names could not be read: ' + ui_e((e && e.message) || e) + '</p>'); }
  R.budgets = bt;
  out.push('<h3 class="sub">Budget names: service and lane</h3><p class="note">The rules read each Budget name. Choose a service or lane here only where a rule is wrong; '
    + '“By rule” takes the choice off again. A name no rule knows is marked.</p>'
    // §14.2: a budget's report rows go by its override as its pull rows do; the table lists the pull's names only
    + (ui_rep(M) ? '<p class="note bae-budgets">A choice here moves the budget’s BAE report rows too. A budget only the BAE report names goes by the rules '
      + '(the Import report lists such budgets).</p>' : ''));
  if (bt.length) {
    out.push('<div class="tw"><table class="grid budgets"><thead><tr class="hd"><th scope="col">Budget name</th><th scope="col">Appropriation</th><th scope="col" class="n">Rows</th>'
      + '<th scope="col" class="n">$M</th><th scope="col">Service</th><th scope="col">Lane</th></tr></thead><tbody>'
      + bt.map((b, i) => {
        const ov = b.override || {};
        // each picker is named by its budget, escaped: "Service for budget row 12" never said which name was being
        // overridden to someone hearing the page (review S10)
        const who = '“' + (b.name || '(blank)') + '”';
        const svcSel = '<select data-act="bsvc" data-i="' + i + '" data-fkey="bsvc:' + i + '" aria-label="' + ui_e('Service for budget ' + who) + '">'
          + '<option value="">By rule: ' + ui_e(b.svcRule) + '</option>'
          + UI_SVC.map((s, k) => '<option value="' + k + '"' + (ov.svc === s ? ' selected' : '') + '>' + ui_e(s) + '</option>').join('') + '</select>';
        const laneSel = '<select data-act="blane" data-i="' + i + '" data-fkey="blane:' + i + '" aria-label="' + ui_e('Lane for budget ' + who) + '">'
          + '<option value="">By rule: ' + ui_e(SP.LANE_WORDS[b.laneRule] || b.laneRule) + '</option>'
          + UI_LANES.map(([l, w]) => '<option value="' + l + '"' + (ov.lane === l ? ' selected' : '') + '>' + w + '</option>').join('') + '</select>';
        return '<tr' + (b.unknown ? ' class="unknown"' : '') + '><td class="wrap">' + ui_e(b.name || '(blank)')
          + (b.unknown ? ' <span class="flag">Service not identified</span>' : '') + '</td><td>' + ui_e(b.aps.map(a => UI_AP_LABEL[a] || 'not identified').join(', '))
          + '</td><td class="n">' + ui_e(SP.fmtInt(b.rows)) + '</td>' + ui_m(b.cents) + '<td>' + svcSel + '</td><td>' + laneSel + '</td></tr>';
      }).join('') + '</tbody></table></div>');
  } else out.push('<p class="none">No budget names yet.</p>');
  return out.join('');
}

function ui_vHelp() {
  const li = a => '<ul>' + a.map(x => '<li>' + x + '</li>').join('') + '</ul>';
  return '<h2 class="title">Help</h2><div class="help">'
    + '<h3 class="sub">What this is</h3><p>The SFCB Spend Plan replaces the Spend Plan Workbook (v12). Import the CCaR pull; every product the workbook made is drawn here, '
    + 'and <strong>Export Excel</strong> writes them as a workbook of values. The file is its own database: <strong>Save</strong> writes the data and the settings into this file.</p>'
    + '<h3 class="sub">Importing</h3>' + li([
      'Each file is a CCaR export laid out like v12’s Raw Data tabs (.xlsx or .csv). Import one file per appropriation, or one file holding all four.',
      'A .csv may be UTF-8, Windows-1252 or UTF-16 (“Unicode”), and must be separated by commas: one separated by tabs or semicolons is refused, saying so. '
      + 'A file that is not a workbook (an encrypted one, an old .xls, a web page saved as .xls) is named for what it is.',
      'Columns are found by their header names, in any order. Rows are placed in O&amp;M, Full Fund, Initial Spares or OPN by their Budget name.',
      'An import replaces the appropriations it holds. The pull it replaces is kept for <strong>What changed</strong>; appropriations it does not hold keep theirs.',
      'Each import that brings a pull sets <strong>Data through</strong> to the last full month before the import; one that places no row in any appropriation '
      + 'leaves it where it was. Change it in the top bar.',
      'A row whose FY or Amount cannot be read is kept, counted nowhere, and listed in the Import report.',
      'The page asks before an import replaces a pull when every row of one appropriation sits on a sheet named for another (an O&amp;M tab holding the '
      + 'only Full Fund row, say), or when the new pull would keep fewer than half the readable rows of the one on screen (a misfiled row, a file cut '
      + 'short, a filtered pull). Cancel changes nothing. A misfiled row is put right by correcting its Budget, or by taking it out of the file: '
      + 'its own appropriation’s pull is imported whole.',
      'The same pull imported again keeps what <strong>What changed</strong> compares, and What changed says the newest import changed nothing. '
      + 'Rows whose appropriation is not identified stay while a pull from the same import is on screen.',
      'To move a plan into a new copy of this tool, import the saved plan’s .html file on its own: the page takes its pulls, earlier pulls, history and settings, '
      + 'and works every figure out again by its own rules. Save to keep it.'])
    + '<h3 class="sub">Which rows count</h3>' + li([
      'A row counts when its FY and Amount read, its appropriation is identified, its FY is at least <strong>First FY</strong>, it is not FY' + SP.OBBBA_FY
      + ' OBBBA funding, and the switches show its service and lane.',
      // §15.1: the fixed rule, stated always
      '<strong>FY' + SP.OBBBA_FY + ' OBBBA funding is left out</strong> of every figure, block, list and picture, whatever the switches show: a row whose Budget '
      + '(a BAE report row’s Budget Name) holds the word OBBBA and whose FY is ' + SP.OBBBA_FY + '. FY' + SP.OBBBA_FY + ' is not a reporting year (Brad, '
      + '11 Nov 2026). It is a fixed rule, not a setting: an OBBBA budget of any other FY counts as any row does. Where such rows are loaded, the Summary’s '
      + 'notes, Settings and the Import report say how much is left out, and an appropriation and FY whose only rows they are has no block. Under a later '
      + 'First FY they are before the First FY instead.',
      'The service and lane switches are this browser’s view, not saved in the file. They drive every figure and every list on every view, the export and the '
      + 'pictures, with two exceptions that cover every service and lane: an entered Authorized, which is entered for an appropriation and FY as a whole and saved '
      + 'in the file (marked ‡ while some switch is off), and the notes on rows not counted (money before First FY, FY' + SP.OBBBA_FY + ' OBBBA funding, rows whose appropriation is not identified, '
      + 'rows that could not be read). The Import report and What changed show every row, whatever the switches.'])
    + '<h3 class="sub">The figures</h3>' + li([
      '<strong>Columns:</strong> Prior Yr (dated before the execution year), Oct to Sep of the execution year, the next-year column, and No date. Total is the sum of all of them.',
      '<strong>Approved</strong> is every counted row (the BAE report’s figure where one is loaded: below). <strong>Obligated</strong> is the rows CCaR marks “Actual Execution”, whatever their date. <strong>Unobligated</strong> = Approved − Obligated.',
      '<strong>Authorized</strong> is what you enter in Settings; where nothing is entered, it is the BAE report’s where one is loaded (below), else Approved, marked †. An entered Authorized is for the appropriation and FY '
      + 'as a whole, so while a switch is off it is marked ‡: it still counts every service and lane. A total carries each mark its rows carry.',
      '<strong>Data through</strong> is one month for every appropriation. An appropriation whose pull was imported before that month ended (one kept from an '
      + 'earlier import) cannot hold all of it: its Obligation % lines say “actual through the … import” and the Summary’s notes name it.',
      '<strong>Obl %</strong> = Obligated ÷ Approved. The <strong>OSD goal</strong> comes from the curve for the money’s year of availability, at the data-through month.',
      '<strong>Status</strong>: On track (green) at or above the goal; Within 10 (yellow) within 10 points of it; Behind (red) more than 10 points behind.',
      'In the monthly rows, months up to Data through are actual (executed rows dated by then); later months are the plan, shown in italic.'])
    + '<h3 class="sub">The BAE report of budgets</h3>' + li([
      'The BAE report (the budgets’ Approved and Authorized by FY) comes in through <strong>Import CCaR pull…</strong>, alone or with the pulls: it is known by '
      + 'its column headings. Its amounts are read as dollars; a new report replaces the one on screen whole, and <strong>What changed</strong> compares the two.',
      'Where it has figures for an appropriation and FY, <strong>Approved</strong> and <strong>Authorized</strong> in the Summary and the appropriation and PMO '
      + 'tables are the report’s, from its sustainment budgets: every budget whose name places it in O&amp;M, Full Fund, Initial Spares or OPN, except Full '
      + 'Fund Flyaway and FY' + SP.OBBBA_FY + ' OBBBA funding. Obl %, Unobligated and Status are measured against that Approved. The switches reach the report’s budgets as they reach the pull’s rows.',
      'A PMO’s row counts the budgets whose name ends in its code (“… Discretionary AV”), and the obligated rows of those budgets; the (no PMO) row counts the budgets '
      + 'whose name ends in no PMO’s code (“… CAM”, “… SUPT”). The detail below each still lists rows by their own PMO.',
      'The CCaR plan and Obligated count every row of the pull, Flyaway budgets, budgets that name no appropriation and rows with no Budget included, which the '
      + 'report’s Approved never holds: each block with such money is named in the Summary’s notes, each budget in the Import report, and a PMO table says how '
      + 'much of its Obligated it is.',
      'The slide blocks and the totals band under each tree still measure the CCaR plan by month: their Obligation % says “CCaR plan” where the report covers the block. '
      + '<strong>What changed</strong> compares the pulls themselves, so a pull’s section there names its figures the CCaR plan, never Approved.',
      'A block the report has no figure for keeps the CCaR plan as Approved, marked §. A block whose plan is under half the report’s Approved is named in the '
      + 'Summary’s notes and the Import report. An Authorized typed in Settings wins over the report for its block; clear it to go back to the report’s.',
      'With no BAE report loaded, nothing on any view changes.'])
    + '<h3 class="sub">Not Allocated</h3>' + li([
      'Every counted row not marked Actual Execution, grouped by column, status and plan event. A special CCaR (Settings) is one item, named by its title.',
      'Unprogrammed, Forecast and other statuses are tagged. Items of $0 are left out. There is no limit on the number of items.'])
    + '<h3 class="sub">Where this differs from v12, on purpose</h3>' + li([
      'Detail rows are built from the data, so nothing falls out: no fixed row list, no 80-character cut, and names differing only in capitals or spaces are one row.',
      'Every PMO row is a sum over the data. Obligated is CCaR’s status, not “dated before 1 May”.',
      'Prior Yr, the next-year column and No date are shown on every block, O&amp;M included.',
      'A Budget name no rule knows is “Service not identified”, not USAF: OPN and the Navy APN CONG lines go to USN.',
      'One set of switches drives everything, and there are new lane switches (Discretionary, Mandatory).',
      'Status is worked out every time and always has its word. The Not Allocated lists have no cap, tag their statuses, and every PMO has one.',
      'There are no row limits. Goals come from Settings; O&amp;M in its second year uses the expired curve; v12’s −93.33% typo is gone.',
      'Each slide block lists every PMO with money. The CCaR row shows its number. Authorized can be entered. The CUI marking is on every screen, sheet and picture.'])
    + '<h3 class="sub">Keyboard</h3><p>Tab moves through every control; Enter or Space presses a button or opens a row; arrow keys change a list choice.</p></div>';
}

function ui_vNoData() {
  // a BAE report imported before any pull is held, and says so: its figures fill the pull's blocks, and a report never adds
  // a block of its own (§14.3), so until a pull comes in there is nothing to draw them in
  const B = ui_bae();
  return '<section class="nodata" aria-labelledby="ui-nodata-h"><h2 id="ui-nodata-h" class="title">No data yet</h2>'
    + '<p>Import the CCaR pull to see the spend plan. ' + ui_e(UI_NODATA) + '</p>'
    + (B ? '<p class="baewait">The BAE report “' + ui_e(String(B.file ?? '')) + '” is loaded. Its Approved and Authorized appear once a CCaR pull is '
      + 'imported: they fill the pull’s appropriation and FY blocks, and the report adds no block of its own.</p>' : '')
    + '<p class="acts"><button type="button" data-act="import" data-fkey="import2">Import CCaR pull…</button>'
    + '<button type="button" data-act="help" data-fkey="help2">Help</button></p>'
    // a first import that was refused is the one time someone is on this page needing the reason in full
    + (ui.refused ? '<div class="refused" role="note"><p><strong>The last import was refused, so nothing changed.</strong> ' + ui_e(ui.refused.message) + '</p>'
      + (ui.refused.report ? ui_reportLines(ui.refused.report) : '') + '</div>' : '')
    + ui_noDataBaeReport(B)
    + '</section>';
}
// THE IMPORT REPORT OF A BAE REPORT HELD BEFORE ANY PULL. The views, the Import report among them, are drawn only once a pull
// is on screen, yet the import's message sends the reader to "the Import report" for the rows that could not be read and
// the total-row check: on this page they were listed nowhere (review I4-5, BP4-7). So the report's own lines are drawn here,
// under the same heading: the last import's report when it brought this report, else the lines kept with it
// (SP.baeKeptLines). '' with no report.
function ui_noDataBaeReport(B) {
  if (!B) return '';
  const st = ui_state(), rep = st && st.lastImport && st.lastImport.report ? st.lastImport.report : null;
  let kept = [];
  if (typeof SP.baeKeptLines === 'function') {
    try { kept = SP.baeKeptLines(B, rep); }
    catch (e) { kept = ['The BAE report could not be listed: ' + ((e && e.message) || e)]; }
  }
  const body = kept.length ? ui_lines(kept) : rep ? ui_reportLines(rep) : '';
  return body ? '<div class="baerep"><h3 class="sub">Import report</h3>' + body + '</div>' : '';
}

// ---------------------------------------------------------------------------------------------------------------
// DRAWING THE PAGE
// ---------------------------------------------------------------------------------------------------------------
function ui_skeleton() {
  const app = document.getElementById('app');
  app.innerHTML = '<header class="top" id="uiTop">'
    + '<div class="bar1">'
    + '<h1 class="brand">SFCB Spend Plan <span class="ey" id="uiEy"></span></h1>'
    + '<label class="fld">Data through <input type="month" id="uiAsOf" data-fkey="asof" min="1990-01" max="2100-12"></label>'
    + '<label class="fld">First FY <input type="number" id="uiFirst" data-fkey="first" min="1990" max="2100" step="1"></label>'
    + '<span class="grow"></span>'
    + '<button type="button" data-act="import" data-fkey="import">Import CCaR pull…</button>'
    + '<button type="button" data-act="save" data-fkey="save">Save</button>'
    + '<button type="button" data-act="savecopy" data-fkey="savecopy">Save a copy…</button>'
    + '<button type="button" data-act="export" data-fkey="export">Export Excel</button>'
    + '<button type="button" data-act="help" data-fkey="help" id="uiHelp" aria-pressed="false">Help</button>'
    + '<span class="savest" id="uiSave" role="status"></span>'
    + '</div>'
    + '<div class="pulls" id="uiPulls"></div>'
    + '<div class="msgrow"><div class="msg" id="uiMsg" role="status" aria-live="polite"></div>'
    + '<button type="button" class="msgx" id="uiMsgX" data-act="msgx" data-fkey="msgx" hidden>Dismiss</button></div>'
    + '<nav class="views" id="uiNav" aria-label="Views"></nav>'
    + '</header>'
    + '<div class="printhead" id="uiPrintHead" aria-hidden="true"></div>'
    + '<div id="uiFilters"></div>'
    + '<main id="uiMain" tabindex="-1"></main>'
    + '<input type="file" id="uiFile" multiple accept=".xlsx,.csv,.html,.htm" hidden>';
  ui.els = {
    app, top: document.getElementById('uiTop'), ey: document.getElementById('uiEy'), asOf: document.getElementById('uiAsOf'),
    first: document.getElementById('uiFirst'), save: document.getElementById('uiSave'), help: document.getElementById('uiHelp'),
    pulls: document.getElementById('uiPulls'), msg: document.getElementById('uiMsg'), nav: document.getElementById('uiNav'),
    filters: document.getElementById('uiFilters'), main: document.getElementById('uiMain'), file: document.getElementById('uiFile'),
    msgx: document.getElementById('uiMsgX'), printHead: document.getElementById('uiPrintHead'),
  };
}

// ---------------------------------------------------------------------------------------------------------------
// WHAT THE STICKY TOP COVERS. The CUI line, the top bar, the pulls line, the message line and the view buttons stay at
// the top of the window, about 135 px at 1366 x 768 and more with a long message. A control the keyboard moves to was
// scrolled only to the window's edge, under them (or under the bottom CUI line), so the keyboard's place could not be
// seen (review S5, WCAG 2.2 2.4.11): the page's scroll padding is set to what they cover, measured, because the top
// grows and shrinks with the message line and the window's width. And a tree opened to CCaR runs 16,000 px with its
// column headings at the top only, so a figure's month could not be read once scrolled (review S6): a tree that fits
// its box keeps its headings under the sticky top; one wider than the window scrolls inside a box of its own, under
// headings that stay at that box's top.
// ---------------------------------------------------------------------------------------------------------------
function ui_layout() {
  const E = ui.els;
  if (!E || !E.top || !E.main) return;
  try {
    const cui = document.querySelector('.cui-top');
    const topH = Math.ceil((cui ? cui.offsetHeight : 0) + E.top.offsetHeight);
    let headH = 0;
    for (const tw of E.main.querySelectorAll('.tw.treew')) {
      const t = tw.querySelector('table');
      if (!t) continue;
      const fit = t.offsetWidth <= tw.clientWidth + 1;
      tw.classList.toggle('fit', fit);
      tw.classList.toggle('box', !fit);
      if (fit && !headH) { const h = t.querySelector('thead'); headH = h ? Math.ceil(h.offsetHeight) : 0; }
    }
    const root = document.documentElement.style;
    root.setProperty('--topH', topH + 'px');
    root.setProperty('--theadH', headH + 'px');
    // THE TOP GREW OVER THE KEYBOARD'S PLACE. Scroll padding only steers scrolls still to come: a picker reached with the
    // keyboard sits just under the top, and the message its own change writes makes the top a line taller, over the very
    // picker being changed, with nothing to scroll it back (review SCR2-1). The control the top has just covered is
    // brought back into view, now and again after the frame (the browser's scroll anchoring may move it after this runs).
    const prev = ui.topH;
    ui.topH = topH;
    if (prev && topH > prev) {
      ui_unhide(prev);
      const later = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : f => setTimeout(f, 16);
      later(() => ui_unhide(prev));
    }
  } catch (e) { /* a page that cannot be measured keeps the stylesheet's defaults */ }
}
// the focused control, if the top (now ui.topH tall, before `prev`) covers part of it that was below the top: scrolled
// into view, which the page's scroll padding puts just under the top. A control scrolled away before the top grew is left
// where the person scrolled it, and one in the top itself is never covered by it.
function ui_unhide(prev) {
  try {
    const E = ui.els, a = document.activeElement;
    if (!E || !a || a === document.body || a === document.documentElement || a === E.main || E.top.contains(a)) return;
    if (a.closest && a.closest('.cui')) return;
    const r = a.getBoundingClientRect();
    if (!r.width && !r.height) return;
    if (r.bottom > prev && r.top < ui.topH && r.top < (window.innerHeight || 0)) a.scrollIntoView({ block: 'nearest' });
  } catch (e) { /* nothing to scroll */ }
}
// a new view starts at its top: the old view's scroll offset, cut to the new page's height, opened it mid-page or at its
// bottom with its title and filters thousands of pixels above the window (review S4)
function ui_toTop() { try { window.scrollTo(0, 0); } catch (e) { /* nothing to scroll */ } }

// 'saved' | 'unsaved' | 'downloaded': a Save that could only download leaves this page's own file without the work (S8)
function ui_saveText() {
  if (ui_fn('saveStatus')) { try { const v = SP.saveStatus(); if (v === 'saved' || v === 'unsaved' || v === 'downloaded') return v; } catch (e) {} }
  let d = false;
  if (ui_fn('isDirty')) { try { d = !!SP.isDirty(); } catch (e) { d = false; } }
  return d ? 'unsaved' : 'saved';
}
function ui_drawTop(M) {
  const E = ui.els, has = ui_hasData(), S = ui_settings();
  const ey = M ? M.E : SP.execYear(S.asOf);
  E.ey.textContent = has && ey ? 'FY' + ey : '';
  // a box being typed in keeps what is being typed; the redraw writes it only when the person is elsewhere
  if (document.activeElement !== E.asOf) E.asOf.value = has && S.asOf ? S.asOf : '';
  if (document.activeElement !== E.first) E.first.value = has ? String(Number.isInteger(S.firstFY) ? S.firstFY : (M ? M.firstFY : 2025)) : '';
  E.asOf.disabled = !has; E.first.disabled = !has;
  const st = ui_saveText();
  E.save.textContent = st === 'saved' ? 'Saved' : st === 'downloaded' ? 'Downloaded, not in the file yet' : 'Unsaved changes';
  E.save.className = 'savest ' + (st === 'saved' ? 'clean' : 'dirty');
  E.help.setAttribute('aria-pressed', ui.view === 'help' ? 'true' : 'false');
  const P = ui_pulls();
  // "imported", never "pulled": the date is when the pull came into this page, which is not when CCaR made it (a pull
  // taken on Friday and imported on Monday read "pulled Monday", review BP-3)
  // and to the minute where two pulls came in on one day, so the older ones can be told from the newer (review SCR2-11)
  const shown = SP.APS.filter(a => P[a.id]);
  // the BAE report's import is told apart from the pulls' the same way (§14.7: it can come in alone, on the same day)
  const B = ui_bae();
  const when = ui_whens(shown.map(a => P[a.id].importedAt).concat(B ? [B.importedAt] : []));
  const bits = shown.map(a => ui_e(a.label) + ' imported <span class="d" title="' + ui_e(ui_when(P[a.id].importedAt) || 'date unknown') + '">'
    + ui_e(when(P[a.id].importedAt) || 'date unknown') + '</span>');
  E.pulls.innerHTML = (bits.length ? 'Pulls: ' + bits.join(' · ') : 'No CCaR pull imported yet.') + (B ? ui_baeTop(B, when) : '');
  // on paper only (the top bar is not printed): what the printed figures are, and what they leave out
  if (E.printHead) {
    E.printHead.textContent = has ? 'SFCB Spend Plan' + (ey ? ' FY' + ey : '') + ' · Data through ' + (S.asOf ? SP.asOfLabel(S.asOf) : 'not set') + ' · '
      + E.pulls.textContent + (M ? ' · ' + M.shown.text : '') : '';
  }
}
// the BAE report in the top bar (§14.7): its file, its date from the file name (the date its figures are of, which is what
// line 2 says), and the day it came into this page, as each pull's is said
function ui_baeTop(B, when) {
  const st = typeof B.stamp === 'string' && B.stamp ? B.stamp : '';
  const at = typeof B.importedAt === 'string' ? B.importedAt : '';
  return ' · <span class="baetop">BAE report “' + ui_e(String(B.file ?? '')) + '” ' + (st ? 'of <span class="d">' + ui_e(st) + '</span>, ' : '')
    + 'imported <span class="d" title="' + ui_e(ui_when(at) || 'date unknown') + '">' + ui_e(when(at) || 'date unknown') + '</span>'
    + (st ? '' : ' (no date in its file name)') + '</span>';
}
function ui_drawNav(has) {
  const E = ui.els;
  if (!has) { E.nav.innerHTML = ''; E.nav.hidden = true; return; }
  E.nav.hidden = false;
  E.nav.innerHTML = UI_VIEWS.map(([id, label]) => '<button type="button" data-act="view" data-v="' + id + '" data-fkey="view:' + id + '" aria-pressed="'
    + (ui.view === id ? 'true' : 'false') + '">' + ui_e(label) + '</button>').join('');
}
function ui_drawFilters(M) {
  const E = ui.els;
  if (!M) { E.filters.innerHTML = ''; return; }
  const v = ui_view();
  const on = (o, k) => !(o && Object.prototype.hasOwnProperty.call(o, k) && !o[k]);
  const svc = UI_SVC.map((s, i) => (i < 6 || M.present.services.includes(s))
    ? '<label class="chk"><input type="checkbox" data-act="svc" data-i="' + i + '" data-fkey="svc:' + i + '"' + (on(v.svc, s) ? ' checked' : '') + '> ' + ui_e(s) + '</label>' : '').join('');
  const lanes = UI_LANES.map(([l, w]) => '<label class="chk"><input type="checkbox" data-act="lane" data-l="' + l + '" data-fkey="lane:' + l + '"'
    + (on(v.lane, l) ? ' checked' : '') + '> ' + w + '</label>').join('');
  E.filters.innerHTML = '<div class="filters" role="group" aria-label="Switches: which services and lanes are counted">'
    + '<span class="fl" aria-hidden="true">Services</span>' + svc + '<span class="fl" aria-hidden="true">Lanes</span>' + lanes
    + '<span class="shownline' + (M.shown.all ? '' : ' filtered') + '">' + ui_e(M.shown.text) + '</span></div>';
}
function ui_drawMain(M) {
  const v = ui.view;
  if (v === 'help') return ui_vHelp();
  if (!ui_hasData()) return ui_vNoData();
  if (!M) return '<p class="err">The figures could not be worked out: ' + ui_e(ui.modelErr || 'unknown reason') + '</p>'
    + (v === 'settings' ? ui_vSettings(null) : v === 'report' ? ui_vReport() : '');
  if (v === 'summary') return ui_vSummary(M);
  if (v === 'slides') return ui_vSlides(M);
  if (UI_AP_LABEL[v]) return ui_vAp(M, v);
  if (v === 'pmos') return ui_vPmos(M);
  if (v === 'na') return ui_vNa(M);
  if (v === 'report') return ui_vReport(M);
  if (v === 'changes') return ui_vChanges(M);
  if (v === 'settings') return ui_vSettings(M);
  return ui_vSummary(M);
}

function ui_render() {
  ui.pending = false;
  if (!ui.els) return;
  const ae = document.activeElement;
  const fk = ae && ae.getAttribute ? ae.getAttribute('data-fkey') : null;
  const inMain = !!(ae && ui.els.main.contains(ae));
  ui.reg = { nodes: new Map(), scopes: [], blocks: [], pmos: [], naPmos: [], naPmoLabels: [], auth: [], special: [], budgets: [], diff: [] };
  const has = ui_hasData();
  const M = has ? ui_model() : null;
  if (has && ui.modelErr && ui.view !== 'help') ui_say('The figures could not be worked out: ' + ui.modelErr, 'err');
  ui_drawTop(M);
  ui_drawNav(has);
  ui_drawFilters(M);
  let html;
  try { html = ui_drawMain(M); }
  catch (e) { html = '<p class="err">This view could not be drawn: ' + ui_e((e && e.message) || e) + '</p>'; }
  ui.els.main.innerHTML = html;
  ui_layout();
  // the keyboard goes back to the control it was on; if that control is gone, to the one the action named (ui.focusTo),
  // else to the view itself, never to the top
  const to = ui.focusTo;
  ui.focusTo = null;
  const byKey = k => [...ui.els.app.querySelectorAll('[data-fkey]')].find(x => x.getAttribute('data-fkey') === k && !x.disabled && !x.hidden);
  if (fk) {
    const el = byKey(fk) || (to ? byKey(to) : null);
    if (el) { if (el !== document.activeElement) el.focus({ preventScroll: true }); }
    else if (inMain) ui.els.main.focus({ preventScroll: true });
  }
}
// a TASK, not a microtask: a box typed in and left with Tab fires its change before the keyboard reaches the next box,
// and a microtask would redraw inside that change, handing the keyboard back to the box just left. A synchronous
// ui_render() in between clears `pending`, so a redraw that already happened is not done twice.
function ui_schedule() {
  if (ui.pending) return;
  ui.pending = true;
  setTimeout(() => { if (ui.pending) ui_render(); }, 0);
}
// the store says the state changed (an import, a setting, a save): the figures are rebuilt and the page redrawn
function ui_stateChanged() { ui_invalidate(); ui_schedule(); }

// ---------------------------------------------------------------------------------------------------------------
// ACTIONS
// ---------------------------------------------------------------------------------------------------------------
async function ui_busy(what, fn) {
  if (ui.busy) { ui_say('Still working on: ' + ui.busy + '. Try again in a moment.', 'info'); return; }
  ui.busy = what;
  try { await fn(); }
  catch (e) { ui_say(what + ' failed: ' + ((e && e.message) || e), 'err'); }
  finally { ui.busy = ''; }
}
function ui_result(r, fallback) {
  if (r && typeof r === 'object') ui_say(r.message || fallback, r.ok === false ? 'err' : 'ok');
  else ui_say(fallback, 'ok');
}

async function ui_import(fileList) {
  const files = [...(fileList || [])];
  if (!files.length) return;
  await ui_busy('the import', async () => {
    ui_say('Reading ' + files.map(f => '“' + f.name + '”').join(', ') + '…', 'info');
    // A SAVED PLAN is taken whole, on its own, never mixed with pulls: it is how a plan reaches a new copy of the tool
    // (review IMP-7). Read as a pull it was refused as a "truncated" workbook.
    const plans = files.filter(f => /\.html?$/i.test(String(f.name)));
    if (plans.length) {
      if (files.length > 1) {
        ui_say('Nothing was imported: a saved plan (' + plans.map(f => '“' + f.name + '”').join(', ') + ') is taken on its own, never with pulls '
          + 'or another plan. Import it by itself.', 'err');
        return;
      }
      if (!ui_need('takePlan', 'Taking a saved plan')) return;
      const text = new TextDecoder('utf-8').decode(await files[0].arrayBuffer());
      const r = SP.takePlan(text, files[0].name);
      if (r && r.ok) {
        ui.refused = null;
        ui_invalidate();
        if (ui.view === 'help' || !UI_VIEWS.some(([id]) => id === ui.view)) ui.view = 'summary';
      }
      ui_say((r && r.message) || 'The plan was not taken.', r && r.ok ? 'ok' : 'err');
      ui_render();
      return;
    }
    if (!ui_need('parseFiles', 'Import')) return;
    const items = [];
    for (const f of files) items.push({ name: f.name, data: await f.arrayBuffer() });
    let parsed;
    try { parsed = await SP.parseFiles(items); }
    catch (e) {
      // a refused import changes nothing; the reason is said here and kept for the Import report view
      ui.refused = { message: (e && e.message) || String(e), report: (e && e.report) || null, at: new Date().toISOString() };
      ui_say((e && e.message) || String(e), 'err');
      ui_render();
      return;
    }
    if (!ui_need('applyImport', 'Import')) return;
    const r = await SP.applyImport(parsed);
    if (r && r.ok === false) {
      // the person declined the import's question (rows that look misfiled): nothing changed, as with a refusal
      ui.refused = { message: r.message, report: parsed.report || null, at: new Date().toISOString() };
      ui_say(r.message, 'err');
      ui_render();
      return;
    }
    ui.refused = null;
    ui_invalidate();
    if (ui.view === 'help' || !UI_VIEWS.some(([id]) => id === ui.view)) ui.view = 'summary';
    // an import that refused a file or placed rows that look misfiled is not a plain success, and does not look like one
    ui_say((r && r.message) || 'Imported.', r && r.warn ? 'warn' : 'ok');
    ui_render();
  });
  if (ui.els && ui.els.file) ui.els.file.value = '';   // the same file can be chosen again after a fix
}

// defer: for a text box left with Tab (see ui_schedule): the redraw waits until the keyboard has reached the next box
function ui_setSettings(patch, said, defer) {
  if (!ui_need('setSettings', 'Changing a setting')) { ui_render(); return false; }
  SP.setSettings(patch);
  ui_invalidate();
  // a change that puts the settings back as this file holds them leaves nothing unsaved, and the message says so: "Data
  // through set to Oct-2026" alone, with the month the file already had, read as a change to save (review SCR2-5)
  let clean = false;
  if (ui_fn('isDirty')) { try { clean = !SP.isDirty(); } catch (e) { clean = false; } }
  if (said) ui_say(said + (clean ? ' The settings are now as this file holds them: nothing is unsaved.' : ''), 'ok');
  if (defer) ui_schedule();
  else ui_render();
  return true;
}

// DATA THROUGH is a month from Jan-1990 to Dec-2100, the box's own min and max. A browser's month box fires a change on
// every key of a year being typed (0002-10, 0020-10, 0202-10, 2025-10), so each partial year rebuilt every figure, marked
// the file unsaved, and was what stayed if the box was left early: "202" and Tab set the execution year to FY203 and
// blanked every goal (review S3). A month outside the range is never taken. While the box still has the keyboard it may
// be a year half typed, so it is only noted on the message line; when the box is left (ui_asOfLeft), whatever it holds that was not taken
// is put back to the month the figures use, and the reason is said in the box's own words (review S12: a cleared box
// stayed blank while the figures went on using the old month, and the message named a YYYY-MM form the box never shows).
const UI_ASOF_MIN = '1990-01', UI_ASOF_MAX = '2100-12';
function ui_asOfOk(v) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(v) && v >= UI_ASOF_MIN && v <= UI_ASOF_MAX; }
function ui_asOfChanged() {
  const v = String(ui.els.asOf.value || '').trim();
  const cur = ui_settings().asOf;
  if (!ui_asOfOk(v)) {
    if (document.activeElement !== ui.els.asOf) { ui_asOfRefuse(v); return; }
    // still being typed (Tab inside the box moves between its month, its year and its calendar button): said, not taken
    ui.asOfHint = true;
    ui_say('Data through needs a month and a year from 1990 to 2100; until it has one, the figures use ' + (cur ? SP.asOfLabel(cur) : 'the month they had') + '.', 'info');
    return;
  }
  if (v === cur) {
    // typed back to the month in use: the note about a half-typed year no longer applies
    if (ui.asOfHint) { ui.asOfHint = false; ui_say(''); }
    return;
  }
  ui.asOfHint = false;
  ui_setSettings({ asOf: v }, 'Data through set to ' + SP.asOfLabel(v) + '; the execution year is FY' + SP.execYear(v) + '.');
}
function ui_asOfRefuse(v) {
  const cur = ui_settings().asOf;
  ui.asOfHint = false;
  ui.els.asOf.value = ui_hasData() && cur ? cur : '';
  ui_say('Data through must be a month and year from January 1990 to December 2100' + (v ? '' : '; the box was left empty')
    + '. It was not changed: it stays ' + (cur ? SP.asOfLabel(cur) : 'as it was') + '.', 'err');
}
function ui_asOfLeft() {
  const v = String(ui.els.asOf.value || '').trim();
  if (!ui_hasData()) return;
  if (v === ui_settings().asOf) { if (ui.asOfHint) { ui.asOfHint = false; ui_say(''); } return; }
  if (!ui_asOfOk(v)) ui_asOfRefuse(v);
  else ui_asOfChanged();     // a month typed in full and left without a change event (some browsers): taken now
}
function ui_firstChanged() {
  const raw = String(ui.els.first.value || '').trim();
  const n = Number(raw);
  if (!/^\d{4}$/.test(raw) || !Number.isInteger(n) || n < 1990 || n > 2100) {
    ui_say('First FY must be a year from 1990 to 2100. It was not changed.', 'err'); ui_drawTop(ui_model()); return;
  }
  if (n === ui_settings().firstFY) return;
  ui_setSettings({ firstFY: n }, 'First FY set to FY' + n + '. Money for earlier years is counted nowhere and named in the Summary’s notes.');
}

function ui_goalChanged(el) {
  const k = el.getAttribute('data-curve'), i = Number(el.getAttribute('data-i'));
  if (!Object.prototype.hasOwnProperty.call(SP.GOALS_DEFAULT, k) || !(i >= 0 && i < 13)) return;
  const S = ui_settings();
  const goals = ui_copy(S.goals && typeof S.goals === 'object' ? S.goals : SP.goalsDefault());
  if (!Array.isArray(goals[k]) || goals[k].length !== 13) goals[k] = SP.GOALS_DEFAULT[k].slice();
  const t = String(el.value).trim().replace(/%$/, '').trim();
  let val;
  if (t === '') val = null;
  else {
    const n = Number(t);
    if (!/^[-+]?\d*\.?\d+$/.test(t) || !isFinite(n) || n < 0 || n > 100) {
      ui_say('A goal is a percentage from 0 to 100; “' + el.value + '” was not taken.', 'err');
      el.value = ui_pctText(goals[k][i]);
      return;
    }
    val = Number((n / 100).toPrecision(12));   // 8.33 -> 0.0833 exactly as typed, not 0.08330000000000001
  }
  if (goals[k][i] === val) {
    // said, so a refusal of an earlier value does not stay on the message line as if it were about this one (review S11)
    el.value = ui_pctText(val);
    ui_say('Goal unchanged: ' + (val === null ? 'that cell is blank (no goal)' : 'it is already ' + ui_pctText(val) + '%') + '.', 'info');
    return;
  }
  // named as the Authorized message names its block: which curve and column, what it was, what it is (review BP-9)
  const was = goals[k][i];
  goals[k][i] = val;
  const words = (UI_CURVES.find(c => c[0] === k) || [k, k])[1], col = i ? SP.MONTHS[i - 1] : 'Prior Yr';
  const pc = x => (x === null || x === undefined ? 'blank (no goal)' : ui_pctText(x) + '%');
  ui_setSettings({ goals }, 'OSD goal for ' + words + ', ' + col + ', set to ' + pc(val) + ' (was ' + pc(was) + '). The statuses are worked out again.', true);
}
function ui_authChanged(el) {
  const key = ui.reg.auth[Number(el.getAttribute('data-i'))];
  if (!key) return;
  const r = ui_readM(el.value);
  const S = ui_settings();
  const au = ui_copy(S.authorized && typeof S.authorized === 'object' ? S.authorized : {});
  if (r.err) { ui_say(r.err + ' Authorized was not changed.', 'err'); el.value = Object.prototype.hasOwnProperty.call(au, key) ? ui_mText(au[key]) : ''; return; }
  const [ap, fy] = key.split('|'), name = (UI_AP_LABEL[ap] || ap) + ' FY' + fy;
  // With a BAE report loaded, what stands in for a typed figure is the report's where it has one for the block (rule 8),
  // so the message says which, and how much: "Approved is shown in its place" would be untrue there. Whether the report
  // covers a block, and its figure, do not depend on what is typed, so the model on screen answers both.
  const M = ui_model(), b = ui_rep(M) ? M.blocks.find(x => x.key === key) : null;
  const repFig = b && b.covered ? '$' + SP.fmtMText(b.reportAuthorized) + 'M' : '';
  if (r.blank) {
    if (!Object.prototype.hasOwnProperty.call(au, key)) return;
    delete au[key];
    ui_setSettings({ authorized: au }, 'Authorized for ' + name + ' cleared; ' + (repFig ? 'the BAE report’s figure, ' + repFig + ', is used again.'
      : b ? 'the BAE report has no figure for it, so Approved is shown in its place.' : 'Approved is shown in its place.'), true);
    return;
  }
  // $0.00M, never "$-M": fmtM's lone dash is a table cell's zero, and inside a sentence it reads as a figure left out; a
  // negative Authorized (typed with a minus or in parentheses) is taken, as parseAmount reads it, and said to be one (S11)
  const said = '$' + SP.fmtMText(r.cents) + 'M' + (r.cents < 0 ? ', a negative amount' : '');
  if (au[key] === r.cents) { ui_say('Authorized for ' + name + ' unchanged: it is already ' + said + '.', 'info'); return; }
  au[key] = r.cents;
  ui_setSettings({ authorized: au }, 'Authorized for ' + name + ' set to ' + said + (r.rounded ? ' (rounded to the cent)' : '')
    + (repFig ? '; it is used in place of the BAE report’s ' + repFig : '') + '.', true);
}
function ui_specAdd() {
  const inp = document.getElementById('uiSpecNew');
  const v = inp ? String(inp.value).trim() : '';
  if (!v) { ui_say('Type a CCaR number to add.', 'err'); return; }
  const cur = Array.isArray(ui_settings().special) ? ui_settings().special.slice() : [];
  if (cur.some(x => SP.normKey(x) === SP.normKey(v))) { ui_say('“' + v + '” is already a special CCaR.', 'err'); return; }
  cur.push(v);
  ui_setSettings({ special: cur }, '“' + v + '” added to the special CCaRs.');
}
function ui_budgetChanged(el, what) {
  const b = ui.reg.budgets[Number(el.getAttribute('data-i'))];
  if (!b) return;
  const S = ui_settings();
  const all = ui_copy(S.budgets && typeof S.budgets === 'object' ? S.budgets : {});
  const cur = Object.prototype.hasOwnProperty.call(all, b.key) && all[b.key] && typeof all[b.key] === 'object' ? all[b.key] : {};
  if (what === 'svc') {
    const s = el.value === '' ? null : UI_SVC[Number(el.value)];
    if (s) cur.svc = s; else delete cur.svc;
  } else {
    const l = el.value === 'disc' || el.value === 'mand' ? el.value : null;
    if (l) cur.lane = l; else delete cur.lane;
  }
  if (cur.svc || cur.lane) all[b.key] = cur; else delete all[b.key];
  ui_setSettings({ budgets: all }, 'Budget “' + (b.name || '(blank)') + '”: ' + (what === 'svc' ? 'service ' + (cur.svc || 'by rule') : 'lane ' + (cur.lane ? SP.LANE_WORDS[cur.lane] : 'by rule')) + '.');
}

async function ui_picture(kind, i) {
  const M = ui_model(), b = ui.reg.blocks[i];
  if (!M || !b) return;
  if (kind === 'copy') {
    if (!ui_need('copyBlockPicture', 'Copy picture')) return;
    await ui_busy('copying the picture', async () => {
      ui_say('Drawing ' + b.apLabel + ' FY' + b.fy + '…', 'info');
      ui_result(await SP.copyBlockPicture(b, M), 'The picture of ' + b.apLabel + ' FY' + b.fy + ' is on the clipboard.');
    });
  } else {
    if (!ui_need('blockPng', 'Save picture')) return;
    await ui_busy('saving the picture', async () => {
      const blob = await SP.blockPng(b, M);
      const name = SP.download(ui_pictureName(b), blob, 'image/png');
      ui_say('Saved “' + name + '” as a download: ' + SP.DOWNLOAD_WHERE, 'ok');
    });
  }
}
async function ui_zip() {
  const M = ui_model();
  if (!M) return;
  if (!ui_need('allPicturesZip', 'Save all pictures')) return;
  await ui_busy('saving the pictures', async () => {
    ui_say('Drawing ' + M.blocks.length + ' pictures…', 'info');
    const blob = await SP.allPicturesZip(M);
    const name = SP.download('SFCB Spend Plan pictures FY' + M.E + ' - data through ' + M.asOfLabel + ' - ' + ui_today()
      + (M.shown.all ? '' : ' [filtered]') + '.zip', blob, 'application/zip');
    ui_say('Saved “' + name + '” (' + M.blocks.length + ' pictures) as a download: ' + SP.DOWNLOAD_WHERE, 'ok');
  });
}

function ui_onClick(ev) {
  const t = ev.target && ev.target.closest ? ev.target.closest('[data-act]') : null;
  if (!t || !ui.els.app.contains(t) || t.tagName === 'SELECT' || t.tagName === 'INPUT') return;
  const act = t.getAttribute('data-act');
  switch (act) {
    case 'view': {
      const v = t.getAttribute('data-v'), moved = v !== ui.view;
      ui.view = v;
      ui_render();
      if (moved) ui_toTop();
      break;
    }
    case 'help':
      if (ui.view === 'help') ui.view = ui.back || 'summary';
      else { ui.back = ui.view; ui.view = 'help'; }
      ui_render();
      ui_toTop();
      break;
    case 'msgx': {
      ui_say('');
      // the button is gone: the keyboard goes to the view it was reading, never back to the top of the page
      const at = ui.els.nav.querySelector('[aria-pressed="true"]') || (ui.view === 'help' ? ui.els.help : null);
      (at || ui.els.main).focus({ preventScroll: true });
      break;
    }
    case 'import':
      if (!ui_fn('applyImport')) { ui_need('applyImport', 'Import'); break; }
      ui.els.file.click();
      break;
    case 'save': if (ui_need('saveFile', 'Save')) ui_busy('saving', async () => { ui_say('Saving…', 'info'); ui_result(await SP.saveFile(), 'Saved.'); ui_render(); }); break;
    case 'savecopy': if (ui_need('saveCopy', 'Save a copy')) ui_busy('saving a copy', async () => { ui_say('Saving a copy…', 'info'); ui_result(await SP.saveCopy(), 'Saved a copy.'); ui_render(); }); break;
    case 'export':
      if (!ui_hasData()) { ui_say('Import a CCaR pull first: there is nothing to export yet.', 'err'); break; }
      if (ui_need('exportExcel', 'Export Excel')) ui_busy('the export', async () => { ui_say('Writing the workbook…', 'info'); ui_result(await SP.exportExcel(), 'The workbook was written.'); });
      break;
    case 'tg': {
      const n = ui.reg.nodes.get(t.getAttribute('data-id'));
      if (!n) break;
      if (!ui.open.has(n.scope)) ui.open.set(n.scope, new Map());
      ui.open.get(n.scope).set(n.pk, t.getAttribute('aria-expanded') !== 'true');
      ui_render();
      break;
    }
    case 'copypic': ui_picture('copy', Number(t.getAttribute('data-b'))); break;
    case 'savepic': ui_picture('save', Number(t.getAttribute('data-b'))); break;
    case 'zip': ui_zip(); break;
    case 'naclear': ui.naF = { ap: '', fy: '', pmo: '', pmoLabel: '' }; ui_render(); break;
    case 'diff': {
      const k = ui.reg.diff[Number(t.getAttribute('data-i'))];
      if (k) { if (ui.diffOpen.has(k)) ui.diffOpen.delete(k); else ui.diffOpen.add(k); ui_render(); }
      break;
    }
    case 'goalreset': ui_setSettings({ goals: SP.goalsDefault() }, 'Goals reset to v12’s curves.'); break;
    case 'specadd': ui_specAdd(); break;
    case 'specdel': {
      const s = ui.reg.special[Number(t.getAttribute('data-i'))];
      if (s === undefined) break;
      const cur = (Array.isArray(ui_settings().special) ? ui_settings().special : []).filter(x => x !== s);
      // the Remove that was pressed is gone, or now names the next CCaR: the keyboard goes to the Remove in its place,
      // else the last one, else the box that adds one (review S10; it used to drop to the top of the view, WCAG 2.4.3)
      const i = Number(t.getAttribute('data-i'));
      ui.focusTo = cur.length ? 'specdel:' + Math.min(i, cur.length - 1) : 'specnew';
      ui_setSettings({ special: cur }, '“' + s + '” is no longer a special CCaR.');
      break;
    }
    case 'specreset': ui_setSettings({ special: SP.SPECIAL_CCARS_DEFAULT.slice() }, 'Special CCaRs reset to ' + SP.SPECIAL_CCARS_DEFAULT.join(', ') + '.'); break;
  }
}
function ui_onChange(ev) {
  const t = ev.target;
  if (!t || !ui.els) return;
  if (t === ui.els.file) { ui_import(t.files); return; }
  if (t === ui.els.asOf) { ui_asOfChanged(); return; }
  if (t === ui.els.first) { ui_firstChanged(); return; }
  const act = t.getAttribute && t.getAttribute('data-act');
  switch (act) {
    case 'svc': case 'lane': {
      const v = ui_copy(ui_view()) || {};
      if (act === 'svc') { const s = UI_SVC[Number(t.getAttribute('data-i'))]; if (!s) return; (v.svc = v.svc || {})[s] = !!t.checked; }
      else { const l = t.getAttribute('data-l'); if (l !== 'disc' && l !== 'mand') return; (v.lane = v.lane || {})[l] = !!t.checked; }
      ui_setView(v);
      ui_invalidate();
      ui_render();
      break;
    }
    case 'lvl': {
      const scope = ui.reg.scopes[Number(t.getAttribute('data-s'))];
      const n = Number(t.value);
      if (!scope || !(n >= 1 && n <= 4)) return;
      ui.level.set(scope, n);
      ui.open.delete(scope);          // "Expand to" is the whole block: rows opened or closed by hand follow it
      ui_render();
      break;
    }
    case 'pmo': { const k = ui.reg.pmos[Number(t.value)]; if (k !== undefined) { ui.pmoKey = k; ui_render(); } break; }
    case 'naf': {
      const f = t.getAttribute('data-f');
      if (f === 'ap') ui.naF.ap = t.value;
      else if (f === 'fy') ui.naF.fy = t.value;
      // 'k:' + the PMO's normKey, never its spelling: one PMO is one choice however its rows write it (§4.4)
      else if (f === 'pmo') {
        ui.naF.pmo = t.value === '' ? '' : (ui.reg.naPmos[Number(t.value)] ?? '');
        ui.naF.pmoLabel = t.value === '' ? '' : (ui.reg.naPmoLabels[Number(t.value)] ?? '');
      }
      ui_render();
      break;
    }
    case 'goal': ui_goalChanged(t); break;
    case 'auth': ui_authChanged(t); break;
    case 'bsvc': ui_budgetChanged(t, 'svc'); break;
    case 'blane': ui_budgetChanged(t, 'lane'); break;
  }
}
function ui_onKey(ev) {
  // Enter in the "Add a CCaR" box adds it, as a form would; there is no form, so nothing is ever submitted anywhere
  if (ev.key === 'Enter' && ev.target && ev.target.id === 'uiSpecNew') { ev.preventDefault(); ui_specAdd(); }
}

// ---------------------------------------------------------------------------------------------------------------
// BOOT. The store goes first: it captures the page as it was loaded, before anything is drawn, because that capture
// is what Save writes back (§11). Then the page is drawn once and waits for the person.
// ---------------------------------------------------------------------------------------------------------------
function ui_boot() {
  if (ui.els) return;
  let r = null;
  if (ui_fn('storeInit')) {
    try { r = SP.storeInit(); }
    catch (e) { r = { ok: false, message: 'The saved data could not be opened: ' + ((e && e.message) || e) }; }
  } else r = { ok: false, message: 'The store is not available yet (SP.storeInit is missing), so nothing can be imported or saved.' };
  ui_skeleton();
  const app = ui.els.app;
  app.addEventListener('click', ui_onClick);
  app.addEventListener('change', ui_onChange);
  app.addEventListener('keydown', ui_onKey);
  app.addEventListener('focusout', ev => { if (ui.els && ev.target === ui.els.asOf) ui_asOfLeft(); });
  if (ui_fn('onStateChange')) { try { SP.onStateChange(ui_stateChanged); } catch (e) {} }
  // the top's height moves with the window's width (its bars wrap) and with the message line: measured again each time
  window.addEventListener('resize', ui_layout);
  if (typeof ResizeObserver === 'function') { try { new ResizeObserver(() => ui_layout()).observe(ui.els.top); } catch (e) {} }
  ui_render();
  if (r && r.message) ui_say(r.message, r.ok === false ? 'err' : 'info');
}
SP.uiRender = function uiRender() { ui_invalidate(); ui_render(); };
// the store says things while a file window is up (the first Save names the file to pick); the message line says them
SP.say = ui_say;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ui_boot);
else ui_boot();
