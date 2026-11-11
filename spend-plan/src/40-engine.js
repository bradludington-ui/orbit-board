// §4–§6 ENGINE — the model. Every figure on every screen, sheet and picture is read from SP.buildModel's result, so a
// screen and the workbook cannot disagree about a dollar: there is one place each figure is worked out (CONTRACT §4–§6).
//
// Two rules govern every line below:
//   - Money is whole CENTS and is only ever added as integers. A float of dollars summed over a few thousand rows drifts
//     by fractions of a cent, and then a tree whose children "add to the parent" fails by 0.0000001 and nobody can say
//     which figure is right.
//   - The model is built from SP.deriveRow's output and nothing else, so a rule fixed in the import (a service rule, a
//     status pattern) applies to every pull already saved the next time the page draws.

const ENG_COL_IDS = ['prior', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12', 'next', 'nodate'];
const ENG_NC = 15, ENG_NEXT = 13, ENG_NODATE = 14;          // prior is 0, m1..m12 are 1..12
const ENG_AP_IDS = SP.APS.map(a => a.id);
const ENG_AP_LABEL = Object.fromEntries(SP.APS.map(a => [a.id, a.label]));
const ENG_AP_TYPE = Object.fromEntries(SP.APS.map(a => [a.id, a.type]));
const ENG_PMO_TAB_ORDER = ['ff', 'sp', 'om', 'opn'];   // v12's PMO tabs list Full Fund first (§4.6, §8.6)
const ENG_LANES = ['disc', 'mand'];
const ENG_ALL_SVC = SP.SERVICES.concat([SP.SVC_UNKNOWN]);
const ENG_BLANK = { pmo: '(no PMO)', title: '(no title)', pe: '(no plan event)', ccar: '(no CCaR)' };
const ENG_KINDS = ['pmo', 'title', 'pe', 'ccar'];
const ENG_PMO_RANK = new Map(SP.PMO_ORDER.map((p, i) => [SP.normKey(p), i]));
const ENG_EPS = 1e-12;
const ENG_ISO = /^(\d{4})-(\d{2})-\d{2}$/;
function eng_zeros() { return new Array(ENG_NC).fill(0); }
// plain code-unit order: the same on every machine. localeCompare would sort "(no PMO)" and accented names differently
// in different browsers, and then two people's exports would list the same PMOs in different orders.
function eng_cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
function eng_own(o, k) { return !!o && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k); }

// ---------------------------------------------------------------------------------------------------------------
// PUBLIC CONSTANTS AND SMALL HELPERS (for the screens, the workbook and the pictures, so each prints the same words)
// ---------------------------------------------------------------------------------------------------------------
SP.COL_IDS = Object.freeze(ENG_COL_IDS.slice());
SP.LANE_WORDS = Object.freeze({ disc: 'Discretionary', mand: 'Mandatory' });
// a colour never stands alone (§4.5): each status has its word, and the legend says what the colours mean
SP.STATUS_WORDS = Object.freeze({ green: 'On track', yellow: 'Within 10', red: 'Behind' });
SP.STATUS_LEGEND = Object.freeze([
  Object.freeze({ status: 'green', colour: 'Green', word: 'On track', meaning: 'at or above the OSD goal' }),
  Object.freeze({ status: 'yellow', colour: 'Yellow', word: 'Within 10', meaning: 'within 10 points of it' }),
  Object.freeze({ status: 'red', colour: 'Red', word: 'Behind', meaning: 'more than 10 points behind' })]);
SP.STATUS_LEGEND_TEXT = 'Green — at or above the OSD goal; Yellow — within 10 points of it; Red — more than 10 points behind.';
SP.statusWord = function statusWord(status) { return eng_own(SP.STATUS_WORDS, status) ? SP.STATUS_WORDS[status] : ''; };

// §4.5 and §4.3: the mark beside an Authorized figure, and what it means. An entered Authorized is typed for an
// appropriation and FY as a whole, so no switch can reach it; printed unmarked beside an Approved the switches have cut,
// it read on the real pull as a gap of over a billion dollars that was only the switch (review R3). The mark sits beside the figure,
// on every product, because a note three screens down is not where a reader looks.
// A TOTAL carries each mark its rows carry (SP.authMarks), so the words for † read true beside a total too: a total
// adds in Approved for every row marked †.
SP.AUTH_MARK_TEXT = Object.freeze({
  '†': 'Authorized was not entered; Approved is shown in its place (on a total, for the rows marked †).',
  '‡': 'Authorized as entered, for the appropriation and FY as a whole: it covers every service and lane, while the switches show only some.',
  // §14.5: printed only with a BAE report loaded, beside an Approved the report has no figure for
  '§': 'Approved is the CCaR plan: the BAE report has no figure for this block.',
});
// §14.5: with a BAE report loaded an Authorized can also come from the report, so † no longer means only "not entered",
// and ‡ is on every entered figure, whatever the switches (answer 8: a typed Authorized wins over the report, "marked as
// entered"; review I4-4). The words a mark carries therefore depend on the model; SP.markText gives the right ones, and
// with no report they are SP.AUTH_MARK_TEXT's, word for word.
SP.AUTH_MARK_TEXT_BAE = Object.freeze({
  '†': 'Authorized was neither entered nor in the BAE report; Approved is shown in its place (on a total, for the rows marked †).',
  '‡': 'Authorized as entered, for the appropriation and FY as a whole: it is used in place of the BAE report’s figure, where the report has one, '
    + 'and covers every service and lane, whatever the switches show.',
  '§': SP.AUTH_MARK_TEXT['§'],
});
SP.markText = function markText(mark, model) {
  const T = model && model.bae && model.bae.present ? SP.AUTH_MARK_TEXT_BAE : SP.AUTH_MARK_TEXT;
  return eng_own(T, mark) ? T[mark] : '';
};
// '†' not entered (Approved stands in); '‡' entered while some switch is off; '' entered with everything shown.
// With a BAE report loaded (§14.5), an Authorized taken from the report follows the switches exactly, as the rows do, so
// it carries no mark, and an entered one is '‡' whatever the switches (review I4-4). With none loaded no row has an
// authorizedSrc, and this reads as it always did.
SP.authMark = function authMark(row, model) {
  if (!row) return '';
  if (row.authorizedSrc === 'report') return '';
  if (row.authorizedSrc === 'entered') return '‡';
  if (!row.authorizedEntered) return '†';
  return model && model.shown && !model.shown.all ? '‡' : '';
};
// §14.5 the mark beside an APPROVED figure: '§' on a block (or a PMO row of a block) the BAE report has no figure for, so
// its Approved is the CCaR plan while the rows around it are the report's. approvedSrc is set only with a report loaded,
// so with none this is never '§'.
SP.approvedMark = function approvedMark(row, model) {
  return row && row.approvedSrc === 'plan' ? '§' : '';
};
// the marks a TOTAL over these rows carries: it adds whatever its rows are, so it carries each of their marks
SP.authMarks = function authMarks(rows, model) {
  const m = (rows || []).map(r => SP.authMark(r, model));
  return { dag: m.includes('†'), ddag: m.includes('‡'), sect: (rows || []).some(r => SP.approvedMark(r, model) === '§') };
};

// §8's "Obligation %  (Approved X.XXM; …)" and the PMO strip: $M inside a sentence. The screen wrote it with fmtM,
// the workbook as v12's TEXT(x,"#,##0.00") and the picture with fmtM but 0.00 for zero, so one block's label read
// "Approved -M", "Approved 0.00M" and "-1,234.57M" against "(1,234.57)M" across the three (review R7). One wording now:
// fmtM's, so a negative is in parentheses as in every cell beside it and nothing non-zero reads as zero (§2), with zero
// written 0.00, because a lone dash inside a sentence reads as a figure left out.
SP.fmtMText = function fmtMText(cents) {
  return typeof cents === 'number' && isFinite(cents) && Math.round(cents) === 0 ? '0.00' : SP.fmtM(cents);
};
// A block whose pull was imported before the data-through month ended cannot hold that whole month: "actual through
// Oct" over a pull imported on 5 October put a month of actuals on a slide that had five days of them, and read its
// goal and status at the end of October (review BP-3). Its label names where its actuals stop instead (model.stale).
// §14.5: the Obligation % row of a slide block and of a totals band measures the CCaR plan by month (rule 6), so X is
// always the plan (`planned`). Where a BAE report covers the block, its Approved is the report's, so the word is
// "CCaR plan" and the figure is not read as the Approved two columns away; elsewhere the plan IS Approved.
SP.oblLabel = function oblLabel(block, model) {
  const c = model && Array.isArray(model.cols) ? model.cols[model.asOfIndex] : null;
  const st = block && model && Array.isArray(model.stale) ? model.stale.find(s => s.ap === block.ap) : null;
  return 'Obligation %  (' + (block && block.covered ? 'CCaR plan ' : 'Approved ') + SP.fmtMText(SP.plannedOf(block)) + 'M; actual through '
    + (st ? 'the ' + st.day + ' import' : c ? c.label : '') + ', plan after)';
};
// §14.3 what a block (or a PMO block) measures its slide and its totals band against: the CCaR plan. With a BAE report
// loaded that is `planned`, beside an `approved` that may be the report's; with none there is only `approved`, which is
// the plan. The products read these two, never the fields, so they need not ask whether a report is loaded.
SP.plannedOf = function plannedOf(block) {
  return block && (typeof block.planned === 'number' ? block.planned : block.approved);
};
// {basis, oblPct, goal, delta, status}: what a slide block's and a totals band's Total column prints (§14.3)
SP.slideOf = function slideOf(block) {
  if (!block) return null;
  return block.slide || { basis: block.approved, oblPct: block.oblPct, goal: block.goal, delta: block.delta, status: block.status };
};
// §14.5 the Summary's line 2, in the one wording the screen and the workbook print. With no report it is §8.1's.
SP.summaryLine2 = function summaryLine2(model) {
  const asOf = model && model.asOfLabel ? model.asOfLabel : '';
  const tail = ' | Obligated = CCaR status "Actual Execution" | Unobligated = Approved - Obligated | Delta = Obl% - OSD%';
  if (model && model.bae && model.bae.present) {
    return 'Data through ' + asOf + ' | Approved, Authorized = BAE report ' + model.bae.of + ' (sustainment budgets)' + tail;
  }
  return 'Data through ' + asOf + ' | Approved = total planned ($M from the CCaR pull) | Authorized = entered, else Approved' + tail;
};
// §8.3 an appropriation's title, in the one wording the screen and the workbook print. With a BAE report loaded its
// Approved and Authorized are the report's wherever it covers a block (§14.3), so "from the CCaR pull" alone would not be
// true of them, and the title names the report too. The workbook named it and the screen did not, so on screen a table
// headed "from the CCaR pull" disagreed with the pull's own Monthly Totals under it, with nothing to say why (review
// BP4-1, P4-6). day: the pull's import day, or '' when not known. always: write "(from …)" when the day is not known (the
// workbook says "on an unknown date"; the screen, with no report, leaves the parenthesis out as it always has).
SP.apTitle = function apTitle(label, day, model, always) {
  const rep = !!(model && model.bae && model.bae.present);
  const base = 'F-35 Sustainment ' + label + ' - Spend Plan & FY Summary';
  if (!day && !always && !rep) return base;
  return base + ' (from the CCaR pull imported ' + (day || 'on an unknown date') + (rep ? ' and the BAE report ' + model.bae.of : '') + ')';
};
// §14.6 rule 6, said once on the Slide blocks view and on the Slide Snapshots sheet: with a BAE report loaded the Summary's
// Approved is the report's, and a slide block still adds up the plan. The screen said so and the sheet did not, so a block
// copied off the sheet beside the Summary read as a figure that disagreed with it (review P4-6).
SP.SLIDES_PLAN_NOTE = 'The slide blocks measure the CCaR plan by month, as they always have: where the BAE report has figures for a block, '
  + 'its Approved on the Summary is the report’s, and the block’s Obligation % row says “CCaR plan” beside the plan it measures.';
// §15.4 FY2025 OBBBA FUNDING (SP.isObbba25), in the one wording each product prints, the screen and the workbook alike:
// why such a row counts nowhere (a Counted column), the Import report's section on it, the Settings line, and what the BAE
// report's table by appropriation and FY says of an (ap, fy) whose only pull rows it leaves out. SP.obbbaLines gives the
// section's lines, and the Summary's two notes are worked out once, in the model.
const ENG_OBBBA = 'FY' + SP.OBBBA_FY + ' OBBBA';
SP.OBBBA_WHY = ENG_OBBBA + ' funding (not a reporting year)';
SP.OBBBA_HEAD = ENG_OBBBA + ' funding, left out (not a reporting year)';
SP.OBBBA_RULE = ENG_OBBBA + ' funding is left out of every figure: it is not a reporting year (Brad, 11 Nov 2026).';
SP.OBBBA_NOBLOCK_WHERE = ENG_OBBBA + ' funding is left out (not a reporting year), so no block is shown';

// §4.5. The 1e-12 lets a ratio that is the goal exactly, but arrived at through a division, count as on the goal.
SP.statusOf = function statusOf(pct, goal) {
  if (typeof pct !== 'number' || typeof goal !== 'number' || !isFinite(pct) || !isFinite(goal)) return null;
  if (pct >= goal - ENG_EPS) return 'green';
  if (goal - pct <= 0.10 + ENG_EPS) return 'yellow';
  return 'red';
};

SP.blockKey = function blockKey(ap, fy) { return ap + '|' + fy; };

// 'YYYY-MM' -> {y, m} or null
function eng_ym(asOf) {
  const m = typeof asOf === 'string' && /^(\d{4})-(0[1-9]|1[0-2])$/.exec(asOf);
  return m ? { y: Number(m[1]), m: Number(m[2]) } : null;
}
// the execution year: the FY of the as-of month (October to December belong to the next FY)
SP.execYear = function execYear(asOf) { const a = eng_ym(asOf); return a ? (a.m >= 10 ? a.y + 1 : a.y) : null; };
// '2026-10' -> 'Oct-2026', as v12 wrote "Data through May-2026"
SP.asOfLabel = function asOfLabel(asOf) { const a = eng_ym(asOf); return a ? SP.CAL_MONTHS[a.m - 1] + '-' + a.y : ''; };
// The Next column is labelled with the two-digit year, as v12's "FY27+" and §5's 'FY28+:' are.
function eng_nextLabel(E) { return 'FY' + String((E + 1) % 100).padStart(2, '0') + '+'; }

// the last full month before a date. A full timestamp is read in this browser's time zone: imported at 9 pm on 31
// October in Virginia is 1 November in UTC, and October is not over there yet.
SP.lastFullMonth = function lastFullMonth(when) {
  let y, m;
  const plain = typeof when === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(when.trim());
  if (plain) { y = Number(plain[1]); m = Number(plain[2]); }
  else {
    let d = null;
    if (Object.prototype.toString.call(when) === '[object Date]' && !isNaN(when.getTime())) d = when;
    else if (typeof when === 'string' && !isNaN(Date.parse(when))) d = new Date(Date.parse(when));
    if (!d) d = new Date();
    y = d.getFullYear(); m = d.getMonth() + 1;
  }
  if (!(m >= 1 && m <= 12)) { const d = new Date(); y = d.getFullYear(); m = d.getMonth() + 1; }
  return m === 1 ? (y - 1) + '-12' : y + '-' + String(m - 1).padStart(2, '0');
};

// §4.1 the settings a new import starts from. Fresh copies, so editing one never edits the defaults.
SP.defaultSettings = function defaultSettings(importDateIso) {
  return { asOf: SP.lastFullMonth(importDateIso), firstFY: 2025, goals: SP.goalsDefault(), authorized: {},
    special: SP.SPECIAL_CCARS_DEFAULT.slice(), budgets: {} };
};
// §4.1 every switch on
SP.defaultView = function defaultView() {
  const svc = {};
  for (const s of ENG_ALL_SVC) svc[s] = true;
  return { svc, lane: { disc: true, mand: true } };
};

// §4.6 code: the text inside the PMO name's first parentheses ('AV' for 'Air Vehicle (AV)'), else its first 12 characters
SP.pmoCode = function pmoCode(label) {
  const s = String(label ?? '');
  const m = /\(([^()]*)\)/.exec(s);
  return m ? m[1] : s.slice(0, 12);
};

// ---------------------------------------------------------------------------------------------------------------
// SETTINGS AND VIEW, read defensively. A saved file is input like any other: a goal typed as text, an Authorized that
// is not a whole number of cents, a missing curve. Each is read as "not there" rather than throwing, except the as-of
// month, without which no column can be placed at all.
// ---------------------------------------------------------------------------------------------------------------
function eng_goals(g) {
  const out = {};
  for (const k of Object.keys(SP.GOALS_DEFAULT)) {
    const v = eng_own(g, k) ? g[k] : null;
    // a cell that is not a number has no goal, so its status is blank rather than judged against a goal of 0
    out[k] = Array.isArray(v) && v.length === 13
      ? v.map(x => (typeof x === 'number' && isFinite(x) ? x : null))
      : SP.GOALS_DEFAULT[k].slice();
  }
  return out;
}
function eng_settings(s, needAsOf) {
  s = s && typeof s === 'object' ? s : {};
  const ym = eng_ym(s.asOf);
  if (!ym && needAsOf) throw new Error('The data-through month must be a month written YYYY-MM; it is ' + JSON.stringify(s.asOf ?? null) + '.');
  const fy = typeof s.firstFY === 'string' && /^\s*\d{4}\s*$/.test(s.firstFY) ? Number(s.firstFY) : s.firstFY;
  const special = Array.isArray(s.special) ? s.special : SP.SPECIAL_CCARS_DEFAULT;
  return {
    raw: s, asOf: ym ? s.asOf : null, ym, firstFY: Number.isInteger(fy) ? fy : 2025,
    goals: eng_goals(s.goals),
    authorized: s.authorized && typeof s.authorized === 'object' ? s.authorized : {},
    special: [...new Set(special.map(x => SP.normKey(x)).filter(x => x !== ''))].sort(eng_cmp),
  };
}
// a switch hides only when it is there and off: a service added to the rules later is shown until someone turns it off
function eng_view(v) {
  v = v && typeof v === 'object' ? v : {};
  const svcOn = s => !(eng_own(v.svc, s) && !v.svc[s]);
  const laneOn = l => !(eng_own(v.lane, l) && !v.lane[l]);
  const services = ENG_ALL_SVC.filter(svcOn), lanes = ENG_LANES.filter(laneOn);
  return { svc: new Set(services), lane: new Set(lanes), svcOn, laneOn };
}
// What every product says it shows (§4.3), over the switches that EXIST on this plan: the six services always, and
// "Service not identified" only when some row would count but for the switches and has no service (§9 draws its box
// only then). The switches live in this browser, not in the plan, so one turned off on a plan that has such rows stayed
// off on a plan that has none: there it hides nothing and has no box to turn it back on, yet every sheet, picture and
// file name said "filtered", and with USAF off the list named a service no box offered (review S2).
function eng_shown(V, present) {
  const exist = ENG_ALL_SVC.filter(s => s !== SP.SVC_UNKNOWN || present.svc.has(s));
  const services = exist.filter(V.svcOn), lanes = ENG_LANES.filter(V.laneOn);
  const all = services.length === exist.length && lanes.length === ENG_LANES.length;
  let text = 'All services, both lanes';
  if (!all) {
    const sv = services.length === exist.length ? 'all' : services.length ? services.join(', ') : 'none';
    const ln = lanes.length ? lanes.map(l => SP.LANE_WORDS[l]).join(', ') : 'none';
    text = 'Services shown: ' + sv + '; lanes shown: ' + ln;
  }
  return { services, lanes, all, text };
}

// the calendar of one as-of month: the execution year, the window, the columns and which of them are closed
function eng_ctx(S) {
  const { y, m } = S.ym;
  const E = m >= 10 ? y + 1 : y;
  const asOfIndex = ((m + 2) % 12) + 1;                       // October is m1, September m12
  const asOfNext = m === 12 ? (y + 1) + '-01-01' : y + '-' + String(m + 1).padStart(2, '0') + '-01';
  const cols = ENG_COL_IDS.map((id, i) => ({
    id, index: i,
    label: i === 0 ? 'Prior Yr' : i <= 12 ? SP.MONTHS[i - 1] : i === ENG_NEXT ? eng_nextLabel(E) : 'No date',
    closed: i === 0 || (i >= 1 && i <= asOfIndex),
  }));
  return { E, asOfIndex, asOfNext, wstart: (E - 1) + '-10-01', wend: E + '-10-01', cols,
    closed: cols.map(c => c.closed), firstFY: S.firstFY };
}
// a date -> its column. Dates are ISO text, so they compare as text; anything else is treated as no date at all, the
// column §3 puts an unreadable date in, rather than as a date that would land somewhere arbitrary.
function eng_colOf(date, cx) {
  const m = typeof date === 'string' && ENG_ISO.exec(date);
  if (!m) return ENG_NODATE;
  if (date < cx.wstart) return 0;
  if (date >= cx.wend) return ENG_NEXT;
  return (Number(m[1]) - (cx.E - 1)) * 12 + (Number(m[2]) - 10) + 1;
}
function eng_curve(ap, n) {
  if (!(n >= 1)) return null;                                 // money for a later year has no curve yet
  if (ENG_AP_TYPE[ap] === 'om') return n === 1 ? 'om1' : 'om2';
  return 'p' + Math.min(n, 4);
}
function eng_readable(d) { return !d.bad && Number.isInteger(d.fy) && Number.isSafeInteger(d.cents); }

// ---------------------------------------------------------------------------------------------------------------
// LABELS (§4.4): a node is named by the spelling most of its rows use; a tie goes to the spelling met first. The counts
// are kept in a Map in first-met order, so scanning it with a strict ">" settles a tie the way the rule says.
// ---------------------------------------------------------------------------------------------------------------
function eng_tally(map, s) { map.set(s, (map.get(s) || 0) + 1); }
function eng_major(map, blank) {
  let best = '', n = -1;
  for (const [s, c] of map) if (c > n) { n = c; best = s; }
  return best === '' ? blank : best;
}
function eng_txt(v) { return v === null || v === undefined ? '' : String(v); }

// ---------------------------------------------------------------------------------------------------------------
// FIGURES (§4.5) over a set of counted rows: a whole block, or one PMO's rows in it
// ---------------------------------------------------------------------------------------------------------------
function eng_figures(rows, ap, fy, cx, S, auth) {
  const cols = eng_zeros(), exec = eng_zeros();
  let approved = 0, unprog = 0, obligated = 0, after = 0, afterRows = 0, noDate = 0, noDateRows = 0;
  for (const r of rows) {
    const c = r.cents;
    cols[r.col] += c; approved += c;
    if (r.d.status === 'unprog') unprog += c;
    if (r.d.status === 'exec') {
      // obligated is the status, whatever the date (Brad, 28 Oct, item 133); a date after the as-of month is only said
      obligated += c; exec[r.col] += c;
      if (r.col !== ENG_NODATE && r.d.date >= cx.asOfNext) { after += c; afterRows++; }
      // and so is a date that is blank or could not be read: it is obligated, but no month's actual Obligation % can
      // hold it, so the headline stood above the as-of column with nothing saying why (review R5)
      if (r.col === ENG_NODATE) { noDate += c; noDateRows++; }
    }
  }
  const cum = new Array(ENG_NC);
  let run = 0;
  for (let i = 0; i < ENG_NODATE; i++) { run += cols[i]; cum[i] = run; }
  cum[ENG_NODATE] = null;                                     // No date has no place in a running sum by date
  const n = cx.E - fy + 1, curve = eng_curve(ap, n);
  const goals = curve ? S.goals[curve] : null;
  const goal = goals ? goals[cx.asOfIndex] : null;
  const oblPct = approved !== 0 ? obligated / approved : null;
  const delta = oblPct !== null && goal !== null ? oblPct - goal : null;
  const obl = new Array(ENG_NC), goalC = new Array(ENG_NC), statusC = new Array(ENG_NC);
  let ex = 0;
  for (let i = 0; i < ENG_NODATE; i++) {
    let v, kind;
    if (cx.closed[i]) {
      // actual: what CCaR says was executed and dated before the column ends. exec[] partitions the dated rows by
      // column, so its running sum through i is exactly "dated before the end of column i"; No date never enters it.
      ex += exec[i];
      v = approved !== 0 ? ex / approved : null; kind = 'actual';
    } else {
      v = approved !== 0 ? cum[i] / approved : null; kind = 'plan';   // the plan, as v12 drew it
    }
    obl[i] = { v, kind };
    goalC[i] = goals && i <= 12 ? goals[i] : null;
    statusC[i] = { status: SP.statusOf(v, goalC[i]), kind };
  }
  obl[ENG_NODATE] = { v: null, kind: null }; goalC[ENG_NODATE] = null; statusC[ENG_NODATE] = { status: null, kind: null };
  const authorized = auth.entered ? auth.cents : approved;
  return { key: ap + '|' + fy, ap, apLabel: ENG_AP_LABEL[ap], fy, n, curve, approved, unprog, obligated,
    unobligated: approved - obligated, authorized, authorizedEntered: auth.entered, oblPct, goal, delta,
    status: SP.statusOf(oblPct, goal), execAfterAsOf: after, execAfterAsOfRows: afterRows, execNoDate: noDate,
    execNoDateRows: noDateRows, nRows: rows.length,
    cols, cum, obl, goalC, statusC };
}

// ---------------------------------------------------------------------------------------------------------------
// THE TREE (§4.4): PMO -> Title -> Plan Event -> CCaR, grouped by normKey. Every row is added to one node at each level,
// so every row lands in exactly one leaf and each node's children add to the node, column by column, by construction.
// ---------------------------------------------------------------------------------------------------------------
function eng_pmoSort(a, b) {
  const ra = ENG_PMO_RANK.has(a.key) ? 0 : a.key === '' ? 2 : 1, rb = ENG_PMO_RANK.has(b.key) ? 0 : b.key === '' ? 2 : 1;
  if (ra !== rb) return ra - rb;
  if (ra === 0) return ENG_PMO_RANK.get(a.key) - ENG_PMO_RANK.get(b.key);
  return eng_cmp(a.label, b.label) || eng_cmp(a.key, b.key);
}
// the same PMO order by key alone, for a choice that must not depend on how a pull spells or lists anything: a PMO on
// SP.PMO_ORDER first, in that order; any other by its normalised name; (no PMO), whose key is '', last
function eng_pmoKeyCmp(a, b) {
  const ra = ENG_PMO_RANK.has(a) ? 0 : a === '' ? 2 : 1, rb = ENG_PMO_RANK.has(b) ? 0 : b === '' ? 2 : 1;
  if (ra !== rb) return ra - rb;
  return ra === 0 ? ENG_PMO_RANK.get(a) - ENG_PMO_RANK.get(b) : eng_cmp(a, b);
}
function eng_sizeSort(a, b) { return b.total - a.total || eng_cmp(a.label, b.label) || eng_cmp(a.key, b.key); }
function eng_tree(rows) {
  const top = new Map();
  for (const r of rows) {
    const k = r.d.k, keys = [k.pmo, k.title, k.pe, k.ccar];
    const spell = [eng_txt(r.d.pmo), eng_txt(r.d.title), eng_txt(r.d.pe), eng_txt(r.d.ccar)];
    let map = top;
    for (let L = 0; L < 4; L++) {
      let node = map.get(keys[L]);
      if (!node) {
        node = { level: L + 1, kind: ENG_KINDS[L], key: keys[L], path: keys.slice(0, L + 1), label: '', cols: eng_zeros(),
          total: 0, n: 0, children: L < 3 ? new Map() : null, sp: new Map() };
        map.set(keys[L], node);
      }
      node.cols[r.col] += r.cents; node.total += r.cents; node.n++;
      eng_tally(node.sp, spell[L]);
      map = node.children;
    }
  }
  const fin = (map, L) => {
    const out = [];
    for (const node of map.values()) {
      node.label = eng_major(node.sp, ENG_BLANK[ENG_KINDS[L]]);
      delete node.sp;
      node.children = node.children ? fin(node.children, L + 1) : [];
      out.push(node);
    }
    return out.sort(L === 0 ? eng_pmoSort : eng_sizeSort);
  };
  return fin(top, 0);
}

// ---------------------------------------------------------------------------------------------------------------
// NOT ALLOCATED (§5): counted rows that are not executed, by column, status group and item. An item is its plan event,
// except under a special CCaR, which is one item however many plan events it carries (named by its title, as v12 did).
// ---------------------------------------------------------------------------------------------------------------
const ENG_NA_TAG = { na: '', unprog: ' [Unprogrammed]', fcst: ' [Forecast]' };
function eng_distinct(map, blank) {     // key -> spellings Map  ->  each key's label, in first-met order
  const out = [];
  for (const sp of map.values()) out.push(eng_major(sp, blank));
  return out;
}
function eng_na(rows, S) {
  const special = S.specialSet;
  const byCol = new Array(ENG_NC);
  for (const r of rows) {
    const d = r.d;
    if (d.status === 'exec') continue;
    const group = d.status === 'na' || d.status === 'unprog' || d.status === 'fcst' ? d.status : 'other:' + eng_txt(d.statusLabel);
    const isCc = special.has(d.k.ccar);
    const key = isCc ? 'CC:' + d.k.ccar : 'PE:' + d.k.pe;
    // nested maps, not a joined string key: a plan event can hold any character, so no separator is safe
    const byGroup = byCol[r.col] || (byCol[r.col] = new Map());
    let byKey = byGroup.get(group);
    if (!byKey) byGroup.set(group, (byKey = new Map()));
    let it = byKey.get(key);
    if (!it) {
      it = { col: ENG_COL_IDS[r.col], colIndex: r.col, group, status: d.status, statusLabel: eng_txt(d.statusLabel), key,
        special: isCc, cents: 0, n: 0, lab: new Map(), cc: new Map(), pm: new Map(), ti: new Map() };
      byKey.set(key, it);
    }
    it.cents += r.cents; it.n++;
    eng_tally(it.lab, isCc ? eng_txt(d.title) : eng_txt(d.pe));
    for (const [m, k, s] of [[it.cc, d.k.ccar, d.ccar], [it.pm, d.k.pmo, d.pmo], [it.ti, d.k.title, d.title]]) {
      let sp = m.get(k);
      if (!sp) m.set(k, (sp = new Map()));
      eng_tally(sp, eng_txt(s));
    }
  }
  const items = [];
  for (const byGroup of byCol) {
    if (!byGroup) continue;
    for (const byKey of byGroup.values()) for (const it of byKey.values()) {
      if (it.cents === 0) continue;                             // a $0 item says nothing (v12 listed 50 of them)
      items.push({ col: it.col, colIndex: it.colIndex, group: it.group, status: it.status, statusLabel: it.statusLabel,
        key: it.key, special: it.special, label: eng_major(it.lab, it.special ? ENG_BLANK.title : ENG_BLANK.pe),
        cents: it.cents, n: it.n, ccars: eng_distinct(it.cc, ENG_BLANK.ccar), pmos: eng_distinct(it.pm, ENG_BLANK.pmo),
        titles: eng_distinct(it.ti, ENG_BLANK.title) });
    }
  }
  items.sort((a, b) => a.colIndex - b.colIndex || b.cents - a.cents || eng_cmp(a.label, b.label)
    || eng_cmp(a.group, b.group) || eng_cmp(a.key, b.key));
  return items;
}
// ' [Unprogrammed]', ' [Forecast]', ' [<the Alloc text>]', or '' for Not Allocated
SP.naTag = function naTag(item) {
  if (!item) return '';
  if (eng_own(ENG_NA_TAG, item.status)) return ENG_NA_TAG[item.status];
  return ' [' + eng_txt(item.statusLabel) + ']';
};
// 'label ($x.xxM)' with its tag: one item as the one-line-per-month text writes it
SP.naItemText = function naItemText(item) {
  return eng_txt(item.label) + ' ($' + SP.fmtM(item.cents) + 'M)' + SP.naTag(item);
};
// §5 one line per column that has items: [{col, label: 'Oct:', text, items}], in column order. No cap on the items.
SP.naLines = function naLines(items, cols) {
  const lab = new Map();
  (Array.isArray(cols) ? cols : []).forEach(c => { if (c && c.id) lab.set(c.id, c.label); });
  const dflt = { prior: 'Prior Yr', next: 'Next FY+', nodate: 'No date' };
  const by = new Map();
  for (const it of items || []) {
    if (!by.has(it.col)) by.set(it.col, []);
    by.get(it.col).push(it);
  }
  const out = [];
  ENG_COL_IDS.forEach((id, i) => {
    const its = by.get(id);
    if (!its) return;
    const label = lab.has(id) ? lab.get(id) : dflt[id] || SP.MONTHS[i - 1];
    out.push({ col: id, label: label + ':', text: its.map(SP.naItemText).join('; '), items: its });
  });
  return out;
};

// a tree in reading order (each node, then its children), down to maxLevel (1 PMO … 4 CCaR)
SP.treeRows = function treeRows(tree, maxLevel) {
  const out = [], lim = maxLevel || 4;
  const walk = nodes => { for (const n of nodes) { out.push(n); if (n.level < lim) walk(n.children); } };
  walk(tree || []);
  return out;
};

// ---------------------------------------------------------------------------------------------------------------
// ONE BLOCK: figures, the tree, the PMO rows and the Not Allocated items, over one set of counted rows
// ---------------------------------------------------------------------------------------------------------------
function eng_block(rows, ap, fy, cx, S, auth) {
  const b = eng_figures(rows, ap, fy, cx, S, auth);
  b.tree = eng_tree(rows);
  b.pmoRows = b.tree.map(n => ({ pmo: n.key, label: n.label, code: SP.pmoCode(n.label), cols: n.cols, total: n.total }));
  b.na = eng_na(rows, S);
  return b;
}
function eng_tot(list, auth) {
  const t = { approved: 0, authorized: 0, obligated: 0, unobligated: 0, unprog: 0, execAfterAsOf: 0 };
  for (const b of list) {
    t.approved += b.approved; t.authorized += auth ? b.approved : b.authorized; t.obligated += b.obligated;
    t.unobligated += b.unobligated; t.unprog += b.unprog; t.execAfterAsOf += b.execAfterAsOf;
  }
  t.oblPct = t.approved !== 0 ? t.obligated / t.approved : null;
  return t;
}
// an import time -> its day in this computer's time ('YYYY-MM-DD'), as the sheet titles and the top bar print it; a
// plain 'YYYY-MM-DD' is that day as written (read as a timestamp it would be UTC midnight, the day before west of
// Greenwich); anything unreadable is ''
function eng_localDay(iso) {
  if (typeof iso !== 'string' || !iso) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const t = Date.parse(iso);
  if (isNaN(t)) return '';
  const d = new Date(t);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function eng_fyName(b) { return ENG_AP_LABEL[b.ap] + ' FY' + b.fy; }
function eng_dollars(c) { return '$' + SP.fmtM(c) + 'M'; }
function eng_rowsWord(n) { return SP.fmtInt(n) + (n === 1 ? ' row' : ' rows'); }
// '$0.00M' for zero inside a sentence (SP.fmtMText), where '$-M' would read as a figure left out
function eng_dollarsT(c) { return '$' + SP.fmtMText(c) + 'M'; }
// 'A', 'A and B', 'A, B and C'
function eng_and(list) { return list.length > 1 ? list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1] : list.join(''); }

// ---------------------------------------------------------------------------------------------------------------
// §14 THE BAE REPORT OF BUDGETS: Approved and Authorized by budget and FY, beside the CCaR pull (Brad, 10 Nov 2026).
// A stored report row is {c:[name, fy, approvedCents, authorizedCents], x, src:[file, sheet, rowNo], bad?} (§14.1). Like a
// pull row it is derived again on every build (SP.baeDerive), so a rule fixed later reaches a report already saved.
// ---------------------------------------------------------------------------------------------------------------
const ENG_BUDGET_COL = SP.RAW_HEADERS.indexOf('Budget');
// §14.6 the BAE Report sheet's Counted column: 'Yes', or the first reason a row counts nowhere, in §4.3's order. §15.3: a
// FY2025 OBBBA row comes after Before the first FY and before Switch off, as its condition does in §4.3.
const ENG_BAE_WHY = Object.freeze({ bad: 'Could not be read', flyaway: 'Flyaway (production)', noap: 'Names no appropriation',
  first: 'Before the first FY', obbba: SP.OBBBA_WHY, off: 'Switch off', yes: 'Yes' });
SP.BAE_COUNTED_WHY = ENG_BAE_WHY;
// the word Flyaway, in any case, as every name rule of §3 is read: aircraft production, never sustainment (rule 1)
const ENG_FLYAWAY = /\bflyaway\b/i;
// A budget's service and lane are the pull's own (§14.2): read through SP.deriveRow on a row holding only that Budget,
// so the override and the rules a budget's pull rows go by are the very function its report row goes by, never a copy
// that could drift from it. An override set for a budget then moves its pull rows and its report row together.
function eng_svcLaneOf(name, settings) {
  const c = new Array(SP.RAW_HEADERS.length).fill('');
  c[ENG_BUDGET_COL] = name;
  const d = SP.deriveRow({ c, x: {} }, settings);
  return { svc: d.svc, lane: d.lane };
}
// §14.2 the PMOs a budget's last word is compared with, in this order: SP.PMO_ORDER's, as the list writes them, then every
// other PMO named on any row of the four pulls (whatever its FY, whether it reads and whatever the switches show, so no
// switch can move a budget to another PMO), in §4.4's order, named by the spelling most of its rows use.
//   allSpell: PMO key -> spellings, over every row of the four pulls in row order (or null). -> [{key, label, code}]
function eng_pmoIndex(allSpell) {
  const idx = SP.PMO_ORDER.map(l => ({ key: SP.normKey(l), label: l, code: SP.pmoCode(l) }));
  const others = [];
  if (allSpell) for (const [k, sp] of allSpell) if (k !== '' && !ENG_PMO_RANK.has(k)) others.push({ key: k, label: eng_major(sp, ENG_BLANK.pmo) });
  others.sort(eng_pmoSort);
  for (const o of others) idx.push({ key: o.key, label: o.label, code: SP.pmoCode(o.label) });
  return idx;
}
// the last word of the trimmed name against each code, without case: the first PMO whose code it is, else '' (no PMO).
// A name with no word has no PMO, even beside a PMO whose code is empty.
function eng_budgetPmoKey(name, idx) {
  const w = String(name ?? '').trim().split(/\s+/);
  const last = w[w.length - 1].toLowerCase();
  if (last === '') return '';
  for (const p of idx) if (String(p.code).toLowerCase() === last) return p.key;
  return '';
}
// §14.2 the budget's PMO, as a PMO KEY (its normKey, as pmos[].pmo and a pull row's k.pmo are), '' for (no PMO). `model`
// is a model built with a report (its bae.pmoIndex) or such an index itself; with neither, only SP.PMO_ORDER's codes are
// known, so a budget ending in the code of a PMO only the pull names reads as (no PMO).
SP.budgetPmo = function budgetPmo(name, model) {
  const idx = Array.isArray(model) ? model : model && model.bae && Array.isArray(model.bae.pmoIndex) ? model.bae.pmoIndex : eng_pmoIndex(null);
  return eng_budgetPmoKey(name, idx);
};
// §14.2 a report row as the rules read it. `model` is as for SP.budgetPmo. readable: its name, FY and both amounts read
// (§14.1); a row a saved file damaged (an amount that is not whole cents, say) is unreadable rather than a guess.
SP.baeDerive = function baeDerive(row, settings, model) {
  const c = row && Array.isArray(row.c) ? row.c : [];
  const name = eng_txt(c[0]).trim();
  const fy = Number.isInteger(c[1]) ? c[1] : null;
  const approved = Number.isSafeInteger(c[2]) ? c[2] : null, authorized = Number.isSafeInteger(c[3]) ? c[3] : null;
  const bad = row && Array.isArray(row.bad) && row.bad.length ? row.bad : null;
  const ap = name !== '' ? SP.apOfBudget(name) : null;           // the §3 Budget rule alone: a report has no sheet to place it
  // §15.3: FY2025 OBBBA funding is its own scope, after Flyaway and naming no appropriation: it never counts and never makes
  // a block covered. Like the others it is read off the name and the FY alone, so it is what a row IS, whatever First FY.
  const scope = ENG_FLYAWAY.test(name) ? 'flyaway' : !ap ? 'noap' : SP.isObbba25(name, fy) ? 'obbba' : 'in';
  const sl = eng_svcLaneOf(name, settings);
  const src = row && Array.isArray(row.src) ? row.src : null;
  return { name, key: SP.normKey(name), fy, approved, authorized, ap, scope, svc: sl.svc, lane: sl.lane, pmo: SP.budgetPmo(name, model),
    bad, readable: !bad && name !== '' && fy !== null && approved !== null && authorized !== null,
    rowNo: src && Number.isInteger(src[2]) ? src[2] : null, src };
};
// §14.2 why a report row counts or not: the first reason in §4.3's order, as a key of ENG_BAE_WHY ('bad', 'flyaway', 'noap',
// 'first', 'obbba', 'off', or 'yes' when it counts). V is eng_view's. The one judgement the model makes of each row and the
// import's message counts by (SP.baeTally), so the two never count different rows. A FY2025 OBBBA row under a First FY
// after 2025 is before the First FY (§15.2: each row is set aside for the first condition it fails).
function eng_baeWhyKey(x, firstFY, V) {
  if (!x.readable) return 'bad';
  if (x.scope === 'flyaway') return 'flyaway';
  if (x.scope === 'noap') return 'noap';
  if (x.fy < firstFY) return 'first';
  if (x.scope === 'obbba') return 'obbba';
  if (!V.svc.has(x.svc) || !V.lane.has(x.lane)) return 'off';
  return 'yes';
}
// §14.7 a report's rows by why each counts or not, under these settings (First FY, the budget table) and switches: what the
// import's message names. The message gave rows READ and the money of the whole report, Flyaway, RDT&E and the years
// before First FY included, so its headline Approved matched nothing a stoplight table shows (review I4-6).
//   -> {rows, yes, bad, flyaway, noap, first, obbba, off, firstFY}
SP.baeTally = function baeTally(bae, settings, view) {
  const S = eng_settings(settings, false), V = eng_view(view);
  const t = { rows: 0, yes: 0, bad: 0, flyaway: 0, noap: 0, first: 0, obbba: 0, off: 0, firstFY: S.firstFY };
  const B = eng_baeOf(bae);
  if (!B) return t;
  for (const row of B.rows) { t.rows++; t[eng_baeWhyKey(SP.baeDerive(row, settings), S.firstFY, V)]++; }
  return t;
};
// the report a build is given, or null: a value that is not a report (no list of rows) is no report, as a pull that is
// not one is no pull, so a damaged state never half-applies one
function eng_baeOf(bae) {
  return bae && typeof bae === 'object' && !Array.isArray(bae) && Array.isArray(bae.rows) ? bae : null;
}
// what a report is called in a sentence: its date from the file name, else the day it was imported, in this computer's time
SP.baeWhen = function baeWhen(bae) {
  if (!bae || typeof bae !== 'object') return null;
  if (typeof bae.stamp === 'string' && bae.stamp) return bae.stamp;
  return eng_localDay(bae.importedAt) || null;
};
function eng_sumOf(list, f) { let s = 0; for (const x of list) s += x[f]; return s; }
// Unobligated, Obl %, Delta and Status against Approved (rule 3), once Approved (or a PMO row's Obligated) has changed
function eng_againstApproved(b) {
  b.unobligated = b.approved - b.obligated;
  b.oblPct = b.approved !== 0 ? b.obligated / b.approved : null;
  b.delta = b.oblPct !== null && b.goal !== null ? b.oblPct - b.goal : null;
  b.status = SP.statusOf(b.oblPct, b.goal);
}
// §14.3 a block with a report loaded. b holds §4.5's figures over its counted rows: `planned` keeps their sum, and the
// slide, the per-column figures and the tree stay on them (rule 6), so they are left as §4.5 worked them out. Approved,
// Authorized and what they feed are the report's where it covers the block.
//   rep: the block's counting report rows; cov: covered; auth: {entered, cents}
function eng_baeBlock(b, rep, cov, auth) {
  const planned = b.approved;
  b.planned = planned;
  b.covered = cov;
  b.slide = { basis: planned, oblPct: b.oblPct, goal: b.goal, delta: b.delta, status: b.status };
  b.approved = cov ? eng_sumOf(rep, 'approved') : planned;
  b.approvedSrc = cov ? 'report' : 'plan';
  // what the report holds for the block, whether or not a typed figure wins over it (the Settings table shows both)
  b.reportAuthorized = cov ? eng_sumOf(rep, 'authorized') : null;
  if (auth.entered) { b.authorized = auth.cents; b.authorizedSrc = 'entered'; }
  else if (cov) { b.authorized = b.reportAuthorized; b.authorizedSrc = 'report'; }
  else { b.authorized = b.approved; b.authorizedSrc = 'approved'; }
  eng_againstApproved(b);
  b.planShort = cov && b.approved > 0 && 2 * planned < b.approved;
  // ‡ on every entered figure with a report loaded, whatever the switches (Brad, answer 8: "marked as entered"). Line 2 then
  // says Authorized is the BAE report's, so an entered figure left unmarked with every switch on read as the report's: a
  // typed $398.77M printed where the report says $520.28M (review I4-4). With no report, ‡ stays §8's (a switch off).
  b.marks = { sect: !cov, dagger: b.authorizedSrc === 'approved', ddagger: !!auth.entered };
}
// §14.4 a PMO's row in a block with a report loaded. pb holds §4.5's figures over the PMO's rows by their PMO column: the
// detail its tab lists below the table (tree, columns, Not Allocated, the totals band), and those stay, on the plan.
// Where the report covers the block, the stoplight figures are the budgets': Approved and Authorized of the counting
// report rows whose budget's PMO is this PMO, and Obligated of the block's executed rows whose BUDGET names it (bpmo,
// rule 7), so the four measure the same money. A typed Authorized is for the whole block and is never split: the row
// keeps the report's. Elsewhere the row is §4.6's, Authorized = Approved (†).
// §14.3 KEEPS A COVERED BLOCK'S PULL ROWS WHATEVER THEIR BUDGET (planned and Obligated are §4.5's), while its Approved is
// the report's sustainment budgets alone. So money on a budget the report's Approved can never hold sits on one side of
// Obl % only: a Flyaway budget (aircraft production, rule 1), one whose name places it in no appropriation (counted here
// by the sheet it came on), and a row with no Budget at all (the report has no row without a name). It is not a figure to
// change, but a difference to name: a Full Fund block read Obl % 280%, On track, against an Approved that left out the
// very production money its Obligated counted, and nothing on any page said why (review M4-6).
//   -> 'flyaway' | 'noap' | 'blank' | null (null: the report's own rules can count a row of that budget)
function eng_offKind(budget) {
  const s = eng_txt(budget).trim();
  if (s === '') return 'blank';
  if (ENG_FLYAWAY.test(s)) return 'flyaway';
  return SP.apOfBudget(s) ? null : 'noap';
}
// a covered block's counted pull rows on such budgets, one entry per budget (its first spelling, in row order) with its
// rows, plan and obligated dollars: {planned, obligated, budgets:[{key, name, kind, rows, planned, obligated}]}, or null
// when none carries a dollar. Every row with no Budget is one entry (key and name '').
function eng_offReport(rows, kindOf) {
  const by = new Map();
  for (const r of rows) {
    const kind = kindOf(r.d.budget);
    if (!kind) continue;
    const key = SP.normKey(r.d.budget);
    if (!by.has(key)) by.set(key, { key, name: eng_txt(r.d.budget).trim(), kind, rows: 0, planned: 0, obligated: 0 });
    const t = by.get(key);
    t.rows++; t.planned += r.cents;
    if (r.d.status === 'exec') t.obligated += r.cents;
  }
  const budgets = [...by.values()].filter(t => t.planned !== 0 || t.obligated !== 0);
  return budgets.length ? { planned: eng_sumOf(budgets, 'planned'), obligated: eng_sumOf(budgets, 'obligated'), budgets } : null;
}
// how a sentence names such budgets: '1 Flyaway (production) budget and 2 budgets that name no appropriation'; the rows
// with no Budget are counted as rows, since they are no budget
const ENG_OFF_WORD = { flyaway: ['Flyaway (production) budget', 'Flyaway (production) budgets'],
  noap: ['budget that names no appropriation', 'budgets that name no appropriation'], blank: ['row with no Budget', 'rows with no Budget'] };
SP.OFF_REPORT_KIND = Object.freeze({ flyaway: 'Flyaway (production)', noap: 'Names no appropriation', blank: 'No Budget' });
function eng_offWords(budgets) {
  const out = [];
  for (const k of ['flyaway', 'noap', 'blank']) {
    const of = budgets.filter(t => t.kind === k), n = k === 'blank' ? eng_sumOf(of, 'rows') : of.length;
    if (n) out.push(SP.fmtInt(n) + ' ' + ENG_OFF_WORD[k][n === 1 ? 0 : 1]);
  }
  return eng_and(out);
}
function eng_baePmo(pb, cov, rep, obl) {
  const planned = pb.approved;
  pb.planned = planned;
  pb.covered = cov;
  pb.slide = { basis: planned, oblPct: pb.oblPct, goal: pb.goal, delta: pb.delta, status: pb.status };
  if (cov) {
    pb.approved = eng_sumOf(rep, 'approved');
    pb.authorized = eng_sumOf(rep, 'authorized');
    pb.obligated = obl;
    eng_againstApproved(pb);
  }
  pb.approvedSrc = cov ? 'report' : 'plan';
  pb.authorizedSrc = cov ? 'report' : 'approved';
  pb.basis = cov ? 'budget' : 'row';
  pb.sect = !cov;
  pb.marks = { sect: !cov, dagger: !cov, ddagger: false };
}
// a total of blocks or rows (§14.3): planned added up, and each mark any of them carries
function eng_baeTot(t, list) {
  t.planned = eng_sumOf(list, 'planned');
  t.marks = { sect: list.some(b => b.marks.sect), dagger: list.some(b => b.marks.dagger), ddagger: list.some(b => b.marks.ddagger) };
  return t;
}

// ---------------------------------------------------------------------------------------------------------------
// THE MODEL (§4.6)
// ---------------------------------------------------------------------------------------------------------------
// bae: the BAE report on screen (SP.state.bae.current), or null/absent. With none, the model is exactly §4's: not one
// field §14 adds is set, so every product, test and saved comparison made before §14 reads it unchanged.
SP.buildModel = function buildModel(pulls, settings, view, bae) {
  const S = eng_settings(settings, true);
  S.specialSet = new Set(S.special);
  const V = eng_view(view);
  const cx = eng_ctx(S);
  const B = eng_baeOf(bae);
  pulls = pulls && typeof pulls === 'object' ? pulls : {};
  const rowsByAp = {};
  const excluded = { beforeFirst: { cents: 0, rows: 0, byFy: {}, rowsByFy: {} }, unidentified: { cents: 0, rows: 0 },
    unreadable: { rows: 0 }, obbba: { rows: 0, cents: 0, obligated: 0, blocks: [], budgets: [] } };
  // §15.2 FY2025 OBBBA funding, set aside as a row before First FY is: by (ap, fy) and by budget (its normKey, first
  // spelling, in row order); and every (ap, fy) such a row would have named, readable or not (obGone), whose only pull
  // rows they are when it ends with no block
  const obBlocks = new Map(), obBudgets = new Map(), obGone = new Set();
  // whether any row the predicate names is loaded at all (a pull row of any appropriation, unidentified ones too, or a
  // report row, read or not, whatever First FY): only then does model.bae.rows carry obbba, so a model with none is the
  // model before §15 (§15.1)
  let obLoaded = false;
  const blockRows = new Map();          // 'ap|fy' -> counted rows, in pull order
  const blockOf = new Map();            // 'ap|fy' -> {ap, fy}
  const pmoSpell = new Map();           // PMO key -> spellings over every counted row, in row order (its tab's label)
  const present = { svc: new Set(), lane: new Set() };
  // §14 only (null with no report): every PMO named on any row of the four pulls, as the PMOs a budget's code is read
  // against and a PMO's name where no counted row gives one; each Budget name of the four pulls (its first spelling);
  // every Budget name in any pull, unidentified rows' too (what the report holds that no pull row names); and each
  // Budget name of a counted row (what the pull counts that the report has no row for)
  const allSpell = B ? new Map() : null, pullBudget = B ? new Map() : null, pullKeys = B ? new Set() : null, countedKeys = B ? new Set() : null;
  let showNoDate = false;
  const ensure = (ap, fy) => {
    const key = ap + '|' + fy;
    if (!blockRows.has(key)) { blockRows.set(key, []); blockOf.set(key, { ap, fy }); }
    return blockRows.get(key);
  };
  // Rows count under the appropriation of the pull they are stored in, never re-decided here: an import replaces an
  // appropriation's pull whole (§11), which only holds if a row cannot drift into another appropriation afterwards.
  for (const ap of ENG_AP_IDS) {
    const p = pulls[ap];
    if (!p || !Array.isArray(p.rows)) continue;
    rowsByAp[ap] = p.rows.length;
    for (const row of p.rows) {
      const d = SP.deriveRow(row, settings);
      if (!obLoaded && SP.isObbba25(d.budget, d.fy)) obLoaded = true;
      if (B) {
        let sp = allSpell.get(d.k.pmo);
        if (!sp) allSpell.set(d.k.pmo, (sp = new Map()));
        eng_tally(sp, eng_txt(d.pmo));
        const bk = SP.normKey(d.budget);
        if (!pullBudget.has(bk)) pullBudget.set(bk, eng_txt(d.budget));
        pullKeys.add(bk);
      }
      if (!eng_readable(d)) {
        excluded.unreadable.rows++;
        // a row whose FY reads still names its block: a block does not vanish because its one row's amount is damaged.
        // §15.2: except FY2025 OBBBA funding, which would be left out if it read, so names no block, as a row before
        // First FY names none
        if (Number.isInteger(d.fy) && d.fy >= S.firstFY) {
          if (SP.isObbba25(d.budget, d.fy)) obGone.add(ap + '|' + d.fy);
          else ensure(ap, d.fy);
        }
        continue;
      }
      if (d.fy < S.firstFY) {
        const b = excluded.beforeFirst, k = String(d.fy);
        b.cents += d.cents; b.rows++;
        b.byFy[k] = (b.byFy[k] || 0) + d.cents; b.rowsByFy[k] = (b.rowsByFy[k] || 0) + 1;
        continue;
      }
      // §4.3 condition 4 (§15.2), after condition 3: counted in no figure, block or list, whatever the switches show
      if (SP.isObbba25(d.budget, d.fy)) {
        const key = ap + '|' + d.fy, obl = d.status === 'exec' ? d.cents : 0;
        obGone.add(key);
        const o = excluded.obbba;
        o.rows++; o.cents += d.cents; o.obligated += obl;
        let t = obBlocks.get(key);
        if (!t) obBlocks.set(key, (t = { ap, fy: d.fy, rows: 0, cents: 0, obligated: 0 }));
        t.rows++; t.cents += d.cents; t.obligated += obl;
        const bk = SP.normKey(d.budget);
        let u = obBudgets.get(bk);
        if (!u) obBudgets.set(bk, (u = { key: bk, name: eng_txt(d.budget).trim(), ap, rows: 0, cents: 0, obligated: 0 }));
        u.rows++; u.cents += d.cents; u.obligated += obl;
        continue;
      }
      const list = ensure(ap, d.fy);
      present.svc.add(d.svc); present.lane.add(d.lane);
      if (!V.svc.has(d.svc) || !V.lane.has(d.lane)) continue;    // §4.3: the switches, the only filter there is
      const r = { d, cents: d.cents, col: eng_colOf(d.date, cx) };
      if (r.col === ENG_NODATE) showNoDate = true;
      list.push(r);
      let sp = pmoSpell.get(d.k.pmo);
      if (!sp) pmoSpell.set(d.k.pmo, (sp = new Map()));
      eng_tally(sp, eng_txt(d.pmo));
      // a Flyaway budget is aircraft production, never sustainment, so no report row is owed for it (rule 1)
      if (B && !ENG_FLYAWAY.test(eng_txt(d.budget))) countedKeys.add(SP.normKey(d.budget));
    }
  }
  const un = pulls.unidentified;
  if (un && Array.isArray(un.rows)) {
    rowsByAp.unidentified = un.rows.length;
    for (const row of un.rows) {
      const d = SP.deriveRow(row, settings);
      if (!obLoaded && SP.isObbba25(d.budget, d.fy)) obLoaded = true;
      if (B) pullKeys.add(SP.normKey(d.budget));
      if (!eng_readable(d)) excluded.unreadable.rows++;
      else { excluded.unidentified.cents += d.cents; excluded.unidentified.rows++; }
    }
  }
  // §15.2: blocks in model order (appropriation order then FY), budgets in row order; and the (ap, fy) such rows would
  // have named that have no block, whatever the switches (a block never depends on them)
  const obRank = (x, y) => ENG_AP_IDS.indexOf(x.ap) - ENG_AP_IDS.indexOf(y.ap) || x.fy - y.fy;
  excluded.obbba.blocks = [...obBlocks.values()].sort(obRank);
  excluded.obbba.budgets = [...obBudgets.values()];
  const obbbaNoBlock = [...obGone].filter(k => !blockOf.has(k)).map(k => { const i = k.indexOf('|'); return { ap: k.slice(0, i), fy: Number(k.slice(i + 1)) }; })
    .sort(obRank);
  // §14.2 THE REPORT'S ROWS, each derived and judged once, in file order. A report row counts when it reads, is a
  // sustainment budget (scope 'in'), is of firstFY or later, and the switches show its service and lane: the switches
  // reach it as they reach a pull row. So such a row makes its service's switch exist (§9) as a pull row does, or a
  // switch left off on another plan could hide its money with no box on screen to turn it back on (review S2).
  let R = null, idx = null;
  const covered = new Set(), repBy = new Map();   // 'ap|fy' covered whatever the switches; 'ap|fy' -> counting report rows
  if (B) {
    idx = eng_pmoIndex(allSpell);
    R = B.rows.map(row => {
      const x = SP.baeDerive(row, settings, idx);
      if (!obLoaded && SP.isObbba25(x.name, x.fy)) obLoaded = true;
      const why = eng_baeWhyKey(x, S.firstFY, V);
      x.counts = why === 'yes'; x.why = ENG_BAE_WHY[why];
      // §15.3: FY2025 OBBBA funding never makes a block covered, as Flyaway never does
      if (why === 'bad' || why === 'flyaway' || why === 'noap' || why === 'obbba') return x;
      const key = x.ap + '|' + x.fy;
      covered.add(key);                                 // §14.3: covered whatever the switches show
      if (why === 'first') return x;
      present.svc.add(x.svc); present.lane.add(x.lane);
      if (why === 'off') return x;
      if (!repBy.has(key)) repBy.set(key, []);
      repBy.get(key).push(x);
      return x;
    });
  }
  const shown = eng_shown(V, present);
  // a pull row's bpmo: the PMO its Budget's name ends in (§14.2), the PMO rule 7 counts its obligated dollars under. One
  // reading per distinct Budget text, since a pull repeats a few dozen budgets over thousands of rows.
  const bpCache = new Map();
  const bpmoOf = name => { const s = eng_txt(name); let k = bpCache.get(s); if (k === undefined) bpCache.set(s, (k = eng_budgetPmoKey(s, idx))); return k; };
  const okCache = new Map();
  const offKindOf = name => { const s = eng_txt(name); let k = okCache.get(s); if (k === undefined) okCache.set(s, (k = eng_offKind(s))); return k; };
  // the blocks, appropriation order then FY
  const keys = [...blockOf.keys()].sort((a, b) => {
    const x = blockOf.get(a), y = blockOf.get(b);
    return ENG_AP_IDS.indexOf(x.ap) - ENG_AP_IDS.indexOf(y.ap) || x.fy - y.fy;
  });
  const blocks = [], pmoBlocks = new Map();   // PMO key -> [PmoBlock]
  for (const key of keys) {
    const { ap, fy } = blockOf.get(key), rows = blockRows.get(key);
    const entered = eng_own(S.authorized, key) && Number.isSafeInteger(S.authorized[key]);
    const auth = { entered, cents: entered ? S.authorized[key] : 0 };
    const b = eng_block(rows, ap, fy, cx, S, auth);
    const cov = !!B && covered.has(key), rep = cov ? repBy.get(key) || [] : [];
    if (B) {
      eng_baeBlock(b, rep, cov, auth);
      // only where Approved is the report's can the two sides differ (elsewhere Approved IS the plan)
      b.offReport = cov ? eng_offReport(rows, offKindOf) : null;
    }
    blocks.push(b);
    // each PMO's own block: the same figures over only its rows, Authorized = Approved (§8.6)
    const byPmo = new Map();
    for (const r of rows) {
      let l = byPmo.get(r.d.k.pmo);
      if (!l) byPmo.set(r.d.k.pmo, (l = []));
      l.push(r);
    }
    // §14.4: in a block the report covers, a PMO has a row also when only a budget naming it counts there, or only
    // executed rows whose budget names it; such a row's detail (its rows by their own PMO column) is empty
    // and, of a PMO's Obligated by bpmo, the part on budgets the report's Approved can never hold (eng_offKind)
    const repPmo = new Map(), oblPmo = new Map(), offPmo = new Map();
    if (B) for (const r of rows) r.d.bpmo = bpmoOf(r.d.budget);
    if (cov) {
      for (const x of rep) { if (!repPmo.has(x.pmo)) repPmo.set(x.pmo, []); repPmo.get(x.pmo).push(x); }
      for (const r of rows) {
        if (r.d.status !== 'exec') continue;
        oblPmo.set(r.d.bpmo, (oblPmo.get(r.d.bpmo) || 0) + r.cents);
        if (offKindOf(r.d.budget)) offPmo.set(r.d.bpmo, (offPmo.get(r.d.bpmo) || 0) + r.cents);
      }
      for (const pk of [...repPmo.keys(), ...oblPmo.keys()]) if (!byPmo.has(pk)) byPmo.set(pk, []);
    }
    for (const [pk, prs] of byPmo) {
      const pb = eng_block(prs, ap, fy, cx, S, { entered: false, cents: 0 });
      if (B) { eng_baePmo(pb, cov, repPmo.get(pk) || [], oblPmo.get(pk) || 0); pb.offObligated = offPmo.get(pk) || 0; }
      if (!pmoBlocks.has(pk)) pmoBlocks.set(pk, []);
      pmoBlocks.get(pk).push(pb);
    }
  }
  const naAll = [];
  for (const b of blocks) for (const it of b.na) naAll.push(Object.assign({ ap: b.ap, apLabel: b.apLabel, fy: b.fy, blockKey: b.key }, it));
  const aps = [];
  for (const ap of ENG_AP_IDS) {
    const list = blocks.filter(b => b.ap === ap);
    if (list.length) aps.push({ ap, label: ENG_AP_LABEL[ap], blocks: list, total: B ? eng_baeTot(eng_tot(list), list) : eng_tot(list) });
  }
  // a PMO's name: the spelling most of its counted rows use. With a report, a PMO with a row only through its budgets is
  // named as the pull names it on any row, else as SP.PMO_ORDER writes it (§14.4).
  const pmoLabel = pk => {
    if (pmoSpell.has(pk)) return eng_major(pmoSpell.get(pk), ENG_BLANK.pmo);
    if (allSpell && allSpell.has(pk)) return eng_major(allSpell.get(pk), ENG_BLANK.pmo);
    return SP.PMO_ORDER.find(x => SP.normKey(x) === pk) || ENG_BLANK.pmo;
  };
  // the PMOs, in PMO order by the label over every counted row; each with its blocks in v12's PMO-tab order
  const tabOrder = (a, b) => ENG_PMO_TAB_ORDER.indexOf(a.ap) - ENG_PMO_TAB_ORDER.indexOf(b.ap) || a.fy - b.fy;
  const pmos = [];
  for (const [pk, pbs] of pmoBlocks) {
    const label = B ? pmoLabel(pk) : eng_major(pmoSpell.get(pk) || new Map(), ENG_BLANK.pmo);
    pbs.sort(tabOrder);
    pmos.push({ pmo: pk, key: pk, label, code: SP.pmoCode(label), blocks: pbs,
      rows: pbs.map(pb => {
        const row = { ap: pb.ap, apLabel: pb.apLabel, fy: pb.fy, key: pb.key, approved: pb.approved,
          authorized: pb.authorized, obligated: pb.obligated, unobligated: pb.unobligated, unprog: pb.unprog, oblPct: pb.oblPct,
          goal: pb.goal, delta: pb.delta, status: pb.status, execAfterAsOf: pb.execAfterAsOf, execNoDate: pb.execNoDate };
        if (B) Object.assign(row, { planned: pb.planned, covered: pb.covered, approvedSrc: pb.approvedSrc, authorizedSrc: pb.authorizedSrc,
          basis: pb.basis, sect: pb.sect, marks: pb.marks, offObligated: pb.offObligated });
        return row;
      }),
      // with a report, a PMO row's Authorized is the report's where it covers the block, so the total adds Authorized
      total: B ? eng_baeTot(eng_tot(pbs), pbs) : eng_tot(pbs, true) });
  }
  pmos.sort(eng_pmoSort);
  const execAfter = { cents: 0, rows: 0 }, execNoDate = { cents: 0, rows: 0 };
  for (const b of blocks) {
    execAfter.cents += b.execAfterAsOf; execAfter.rows += b.execAfterAsOfRows;
    execNoDate.cents += b.execNoDate; execNoDate.rows += b.execNoDateRows;
  }
  // §4.6 stale: each appropriation shown whose pull was imported before the data-through month ended (its import day,
  // in this computer's time, before the first of the next month). An import made after the month ended can hold all of
  // it; one made during it cannot, and was kept from an earlier import while another appropriation moved Data through
  // on (review BP-3). A pull with no import time says nothing, rather than a guess.
  const stale = [];
  for (const a of aps) {
    const day = eng_localDay(pulls[a.ap] && pulls[a.ap].importedAt);
    if (day && day < cx.asOfNext) stale.push({ ap: a.ap, label: a.label, day });
  }
  const model = {
    asOf: S.asOf, asOfLabel: SP.asOfLabel(S.asOf), E: cx.E, firstFY: S.firstFY, window: { start: cx.wstart, end: cx.wend },
    cols: cx.cols, asOfIndex: cx.asOfIndex, showNoDate, shown, special: S.special,
    present: { services: ENG_ALL_SVC.filter(s => present.svc.has(s)), lanes: ENG_LANES.filter(l => present.lane.has(l)) },
    blocks, aps, pmos, naAll, excluded, execAfterAsOf: execAfter, execNoDate, rowsByAp, stale, obbbaNoBlock,
    summary: { rows: blocks, total: B ? eng_baeTot(eng_tot(blocks), blocks) : eng_tot(blocks), notes: [] },
  };
  if (B) model.bae = eng_baeModel(B, R, idx, { S, cx, blocks, pmoLabel, bpmoOf, pullBudget, pullKeys, countedKeys, obbbaNoBlock, obLoaded });
  model.summary.notes = eng_notes(model);
  return model;
};

// §14.5 model.bae: the report as the model reads it. Its counts and dollars are over every FY and take no switch (the
// report as a whole); noBlock, planShort and pullOnly follow the switches, as the blocks they speak of do.
//   K: {S, cx, blocks, pmoLabel, bpmoOf, pullBudget (key -> first spelling, four pulls), pullKeys (every pull row's
//       budget key, unidentified rows' too), countedKeys (each counted row's budget key, Flyaway left out),
//       obbbaNoBlock (each (ap, fy) whose only pull rows are FY2025 OBBBA funding, §15.2), obLoaded (any row SP.isObbba25
//       names is loaded, a pull's or the report's, read or not)}
function eng_baeModel(B, R, idx, K) {
  const { S, cx, blocks } = K;
  const good = R.filter(x => x.readable), ins = good.filter(x => x.scope === 'in');
  const rank = ap => ENG_AP_IDS.indexOf(ap);
  const byKey = (a, b) => rank(a.ap) - rank(b.ap) || a.fy - b.fy;
  // in scope, every FY, no switches: Approved and Authorized per (ap, fy), in model order
  const bb = new Map();
  for (const x of ins) {
    const k = x.ap + '|' + x.fy;
    if (!bb.has(k)) bb.set(k, { ap: x.ap, fy: x.fy, approved: 0, authorized: 0 });
    const t = bb.get(k);
    t.approved += x.approved; t.authorized += x.authorized;
  }
  const byBlock = {};
  for (const t of [...bb.values()].sort(byKey)) byBlock[t.ap + '|' + t.fy] = { approved: t.approved, authorized: t.authorized };
  // §14.1 the report's own total row, checked against the rows that read: it is a sum of floating-point dollars, so each
  // figure agrees within $1. A total row whose figure could not be read is not checked (null), and says so.
  const tr = B.total && typeof B.total === 'object' ? B.total : null;
  const totalRow = tr ? { approved: Number.isSafeInteger(tr.approved) ? tr.approved : null,
    authorized: Number.isSafeInteger(tr.authorized) ? tr.authorized : null, rowNo: Number.isInteger(tr.rowNo) ? tr.rowNo : null } : null;
  let total = null;
  if (totalRow && totalRow.approved !== null && totalRow.authorized !== null) {
    const diff = { approved: totalRow.approved - eng_sumOf(good, 'approved'), authorized: totalRow.authorized - eng_sumOf(good, 'authorized') };
    total = { ok: Math.abs(diff.approved) <= 100 && Math.abs(diff.authorized) <= 100, diff };
  }
  // an (ap, fy) the report holds counting money for, from firstFY to the execution year, with no block in the pull:
  // named, never added as a block (§14.3)
  const blockKeys = new Set(blocks.map(b => b.key));
  const nb = new Map();
  for (const x of R) {
    if (!x.counts || x.fy > cx.E) continue;
    const k = x.ap + '|' + x.fy;
    if (blockKeys.has(k)) continue;
    if (!nb.has(k)) nb.set(k, { ap: x.ap, fy: x.fy, approved: 0, authorized: 0, money: false });
    const t = nb.get(k);
    t.approved += x.approved; t.authorized += x.authorized;
    if (x.approved !== 0 || x.authorized !== 0) t.money = true;
  }
  // §15.3: one whose pull rows were all FY2025 OBBBA funding would have had a block; it says so (obbba:true), and its money
  // is still not shown. The flag is there only when true, so a model with no such rows is the one before §15.
  const obGone = new Set((K.obbbaNoBlock || []).map(t => t.ap + '|' + t.fy));
  const noBlock = [...nb.values()].filter(t => t.money).sort(byKey).map(t => Object.assign({ ap: t.ap, fy: t.fy, approved: t.approved, authorized: t.authorized },
    obGone.has(t.ap + '|' + t.fy) ? { obbba: true } : {}));
  const reportKeys = new Set(R.filter(x => x.name !== '').map(x => x.key));
  const pullOnly = [...K.countedKeys].filter(k => !reportKeys.has(k)).sort(eng_cmp);
  const reportOnly = [...new Set(ins.filter(x => x.fy >= S.firstFY && x.fy <= cx.E && (x.approved !== 0 || x.authorized !== 0) && !K.pullKeys.has(x.key))
    .map(x => x.key))].sort(eng_cmp);
  const lbl = pk => (pk ? K.pmoLabel(pk) : ENG_BLANK.pmo);
  const budgets = {};
  for (const x of R) {
    if (x.name === '' || eng_own(budgets, x.key)) continue;
    // a budget's scope is its NAME's: 'obbba' belongs to a row (its name and its FY), so a budget whose first row is FY2025
    // OBBBA funding is still a sustainment budget ('in'), as its FY2026 rows are (§15.3)
    budgets[x.key] = { name: x.name, ap: x.ap, scope: x.scope === 'obbba' ? 'in' : x.scope, svc: x.svc, lane: x.lane, pmo: lbl(x.pmo) };
  }
  const pullBudgetPmo = {};
  for (const [k, name] of K.pullBudget) pullBudgetPmo[k] = lbl(K.bpmoOf(name));
  const when = SP.baeWhen(B);
  return {
    present: true, file: eng_txt(B.file), sheet: eng_txt(B.sheet), stamp: typeof B.stamp === 'string' && B.stamp ? B.stamp : null,
    importedAt: typeof B.importedAt === 'string' ? B.importedAt : null, when, of: when ? 'of ' + when : 'with no date recorded',
    // §15.3: the readable rows of FY2025 OBBBA funding, by scope as the others are; there only when such a row is loaded
    // (in a pull or the report), so a plan with none reads as it did before §15
    rows: Object.assign({ in: ins.length, flyaway: good.filter(x => x.scope === 'flyaway').length, noap: good.filter(x => x.scope === 'noap').length,
      bad: R.length - good.length }, K.obLoaded ? { obbba: good.filter(x => x.scope === 'obbba').length } : {}),
    budgetsIn: new Set(ins.map(x => x.key)).size,
    cents: { approved: eng_sumOf(ins, 'approved'), authorized: eng_sumOf(ins, 'authorized') },
    total, totalRow, byBlock,
    uncovered: blocks.filter(b => !b.covered).map(b => ({ ap: b.ap, fy: b.fy })),
    noBlock,
    planShort: blocks.filter(b => b.planShort).map(b => ({ ap: b.ap, fy: b.fy, planned: b.planned, approved: b.approved })),
    // each covered block's counted pull money on budgets the report's Approved can never hold (eng_offKind), in model order;
    // like the blocks it speaks of, it follows the switches
    offReport: blocks.filter(b => b.offReport).map(b => ({ ap: b.ap, fy: b.fy, planned: b.offReport.planned, obligated: b.offReport.obligated,
      budgets: b.offReport.budgets.map(t => Object.assign({}, t)) })),
    // the names as the files spell them, beside the keys: the pull's first spelling, the report's first
    pullOnly, pullOnlyNames: pullOnly.map(k => K.pullBudget.get(k) || k), reportOnly, reportOnlyNames: reportOnly.map(k => budgets[k] ? budgets[k].name : k),
    unreadable: R.filter(x => !x.readable).map(x => ({ rowNo: x.rowNo, name: x.name, fields: eng_baeBadFields(x), bad: x.bad ? x.bad.slice() : [] })),
    counted: R.map(x => [x.rowNo, x.why]),
    // each report row as §14.2 reads it, in file order: what the BAE Report sheet prints after the file's own columns
    derived: R.map(x => ({ rowNo: x.rowNo, name: x.name, key: x.key, fy: x.fy, approved: x.approved, authorized: x.authorized, ap: x.ap,
      apLabel: x.ap ? ENG_AP_LABEL[x.ap] : '', scope: x.scope, svc: x.svc, lane: x.lane, pmo: x.pmo, pmoLabel: lbl(x.pmo),
      readable: x.readable, counts: x.counts, why: x.why })),
    budgets, pullBudgetPmo, pmoIndex: idx,
  };
}
// which of the four a row could not read: 'Budget Name', 'FY', 'Approved', 'Authorized'. The import's own words say why
// (row.bad); these say what, so a list of them can be compared and counted.
function eng_baeBadFields(x) {
  const f = [];
  if (x.name === '') f.push('Budget Name');
  if (x.fy === null) f.push('FY');
  if (x.approved === null) f.push('Approved');
  if (x.authorized === null) f.push('Authorized');
  return f;
}

// §4.6 the Summary's notes, each only when it has something to say.
// Under a switch, a note must not claim more than is true (§4.3: "each product states what it shows when not
// everything is shown"). Two things here do not follow the switches, by their own rules: an entered Authorized (§4.5,
// typed for an appropriation and FY as a whole) and the rows not counted (each is named by the FIRST §4.3 condition it
// fails, and the switches come last). "Every figure counts only these" stood beside both, and with USAF off the
// before-FY2025 note on the real pull still counted every dollar of USAF's FY2024 money (review R3). So the claim names its exceptions, and
// each of those notes says it covers every service and lane.
function eng_notes(M) {
  const notes = [];
  const filtered = !M.shown.all;
  const every = filtered ? ' This counts every service and lane, whatever the switches show.' : '';
  const authAll = filtered ? M.blocks.filter(b => b.authorizedEntered) : [];
  const bf = M.excluded.beforeFirst, ui = M.excluded.unidentified, ur = M.excluded.unreadable.rows;
  // §15.2 FY2025 OBBBA funding, set aside as money before First FY is (a model built before §15 has none)
  const ob = M.excluded.obbba && M.excluded.obbba.rows ? M.excluded.obbba : null;
  const X = M.bae && M.bae.present ? M.bae : null;
  if (filtered) {
    const ex = [];
    if (authAll.length) ex.push('an entered Authorized (marked ‡)');
    if (bf.rows || ui.rows || ur || ob) ex.push('the notes below on rows not counted');
    // the report's own totals (§14.5 cents: in scope, every FY, no switches) describe the report, not what is shown
    if (X) ex.push('the note below on the BAE report as a whole');
    notes.push(M.shown.text + '. Every figure counts only these' + (ex.length ? ', except ' + eng_and(ex) + ', which cover every service and lane' : '') + '.');
  }
  // a pull kept from an import made before the data-through month ended (review BP-3): Line 2's "Data through" is one
  // month for every row below it, so the rows that cannot reach it are named here, on the Summary, as well as in their
  // own blocks' Obligation % lines
  const stl = Array.isArray(M.stale) ? M.stale : [];
  if (stl.length) {
    const one = stl.length === 1, s0 = stl[0];
    const names = stl.map(s => s.label), list = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0];
    notes.push('The ' + list + (one ? ' pull was imported ' + s0.day + ',' : ' pulls were imported') + ' before the end of ' + M.asOfLabel + ', the data-through month'
      + (one ? '' : ' (' + stl.map(s => s.label + ' ' + s.day).join('; ') + ')') + ': ' + (one ? 'its actual obligations stop at that import' : 'their actual obligations stop at those imports') + ', while '
      + (one ? 'its' : 'their') + ' goals and statuses are read at ' + M.asOfLabel + '. '
      + (one ? 'Its Obligation % lines say “actual through the ' + s0.day + ' import”' : 'Their Obligation % lines name the import their actuals stop at')
      + '. Import a newer pull to bring ' + (one ? 'it' : 'them') + ' up to date.');
  }
  if (X) eng_baeNotes(M, X, notes, every);
  // Unprogrammed money sits in the CCaR plan; with no report, or on a block the report does not cover, that plan IS
  // Approved, while on a covered block Approved is the report's and the plan is what the slide measures (§14.5)
  const up = M.blocks.filter(b => b.unprog !== 0 && !b.covered), upC = M.blocks.filter(b => b.unprog !== 0 && b.covered);
  if (up.length) notes.push('Unprogrammed money is counted in Approved: ' + up.map(b => eng_fyName(b) + ' ' + eng_dollars(b.unprog)).join('; ') + '.');
  if (upC.length) notes.push('Unprogrammed money is counted in the CCaR plan: ' + upC.map(b => eng_fyName(b) + ' ' + eng_dollars(b.unprog)).join('; ') + '.');
  // † : with no report, Authorized not entered; with one, neither entered nor in the report (§14.5)
  const noAuth = X ? M.blocks.filter(b => b.authorizedSrc === 'approved') : M.blocks.filter(b => !b.authorizedEntered);
  if (noAuth.length) {
    notes.push('Authorized was ' + (X ? 'neither entered nor in the BAE report' : 'not entered') + ' for ' + (noAuth.length === M.blocks.length ? 'any block'
      : noAuth.map(eng_fyName).join(', ')) + '; Approved is shown in its place (marked †).');
  }
  if (authAll.length) {
    notes.push('Authorized is entered for an appropriation and FY as a whole, so it counts every service and lane: '
      + authAll.map(eng_fyName).join(', ') + ' ' + (authAll.length === 1 ? 'shows its' : 'show their') + ' entered Authorized (marked ‡) beside an Approved,'
      + ' Obligated and Unobligated that count only the services and lanes shown, and the totals add ' + (authAll.length === 1 ? 'it' : 'them') + ' in.');
  }
  if (bf.rows) {
    const fys = Object.keys(bf.byFy).sort();
    notes.push('Money before FY' + M.firstFY + ' is not shown: ' + fys.map(k => 'FY' + k + ' ' + eng_dollars(bf.byFy[k])
      + ' (' + eng_rowsWord(bf.rowsByFy[k]) + ')').join('; ') + '.' + every);
  }
  // §15.4 after the note on money before First FY, and like it counting every service and lane: the rule comes before the
  // switches in §4.3, so no switch reaches these rows
  if (ob) {
    const nb = ob.budgets.length;
    notes.push(ENG_OBBBA + ' funding is left out of every figure: it is not a reporting year. The CCaR pull holds ' + eng_rowsWord(ob.rows) + ' of it on '
      + SP.fmtInt(nb) + (nb === 1 ? ' budget' : ' budgets') + ' (' + ob.blocks.map(eng_fyName).join(', ') + '), ' + eng_dollarsT(ob.cents) + ' planned, '
      + eng_dollarsT(ob.obligated) + ' of it obligated. See the Import report.' + every);
  }
  if (ui.rows) notes.push(eng_rowsWord(ui.rows) + ' (' + eng_dollars(ui.cents) + ') carry a Budget name that names no appropriation, on a sheet whose name does not name one either; '
    + (ui.rows === 1 ? 'it is' : 'they are') + ' counted nowhere. See the Import report.' + every);
  if (ur) notes.push(eng_rowsWord(ur) + ' could not be read (FY or Amount) and ' + (ur === 1 ? 'is' : 'are') + ' counted nowhere. See the Import report.' + every);
  const ea = M.execAfterAsOf;
  if (ea.rows) notes.push(eng_rowsWord(ea.rows) + ' marked Actual Execution (' + eng_dollars(ea.cents) + ') ' + (ea.rows === 1 ? 'is' : 'are')
    + ' dated after ' + M.asOfLabel + ', the data-through month; ' + (ea.rows === 1 ? 'it is' : 'they are') + ' counted as obligated.');
  // the other half of why a block's headline Obl % differs from its as-of column: Obligated counts these, and no
  // month can, because they have no date to be placed by
  const nd = M.execNoDate;
  if (nd && nd.rows) notes.push(eng_rowsWord(nd.rows) + ' marked Actual Execution (' + eng_dollars(nd.cents) + ') ' + (nd.rows === 1 ? 'has' : 'have')
    + ' no readable date; ' + (nd.rows === 1 ? 'it is' : 'they are') + ' counted as obligated (Obligated and the Obl % beside it), but in no month’s actual Obligation %,'
    + ' so the headline Obl % and the data-through month’s differ by ' + (nd.rows === 1 ? 'it' : 'them') + '.');
  return notes;
}
// §14.5 the Summary's notes on the BAE report, each only when it applies: the report itself (its date, the budgets in it,
// those left out by kind, and its total row checked), the blocks it has no figure for (§), each block whose CCaR plan is
// under half the report's Approved (rule 5: flagged, never hidden), and the report's money for a year the pull has no
// block for (named, never added as a block).
//   every: the sentence a note ends with when it counts every service and lane while the switches show only some
// §14.5 how a planShort block's plan is said against the report's Approved: a whole percent, as §14.5's example rounds
// it (3.57% is "4%"), except that a block flagged as UNDER half is never said to be 50% of it. A plan from 49.5% up to
// half rounds to 50, and "is 50% of the BAE report's Approved" stood under "under half" (review P4-9); there it is
// "under 50%". Flooring instead would break the example. One wording, for the Summary's note and the Import report.
SP.planShortPct = function planShortPct(planned, approved) {
  const p = Math.round(100 * planned / approved);
  return (p >= 50 && 2 * planned < approved ? 'under 50' : String(p)) + '%';
};
function eng_baeNotes(M, X, notes, every) {
  const r = X.rows;
  const before = X.derived.filter(d => d.why === ENG_BAE_WHY.first).length;
  const out = [];
  if (r.flyaway) out.push(SP.fmtInt(r.flyaway) + ' Flyaway (production) ' + (r.flyaway === 1 ? 'row' : 'rows'));
  if (r.noap) out.push(eng_rowsWord(r.noap) + ' naming no appropriation');
  if (r.bad) out.push(eng_rowsWord(r.bad) + ' that could not be read');
  if (before) out.push(eng_rowsWord(before) + ' before FY' + M.firstFY);
  // §15.3: the rows the rule leaves out (by why, as the rows before First FY are: under a later First FY they are those)
  const obN = X.derived.filter(d => d.why === ENG_BAE_WHY.obbba).length;
  if (obN) out.push(SP.fmtInt(obN) + ' ' + ENG_OBBBA + (obN === 1 ? ' row' : ' rows'));
  let check;
  if (X.total) {
    check = X.total.ok ? 'Its total row agrees with the rows read.'
      : 'Its total row differs from the rows read by ' + SP.fmtUsd(X.total.diff.approved) + ' Approved and ' + SP.fmtUsd(X.total.diff.authorized)
        + ' Authorized; see the Import report.';
  } else check = X.totalRow ? 'Its total row could not be read, so it was not checked.' : 'It has no total row to check against.';
  notes.push('Approved and Authorized come from the BAE report ' + X.of + (X.file ? ' (' + X.file + ')' : '') + ' wherever it has figures for a block: it holds '
    + eng_rowsWord(r.in) + ' of sustainment budgets (' + SP.fmtInt(X.budgetsIn) + (X.budgetsIn === 1 ? ' budget' : ' budgets') + '), '
    + eng_dollarsT(X.cents.approved) + ' Approved and ' + eng_dollarsT(X.cents.authorized) + ' Authorized over every FY. '
    + (out.length ? 'Counted nowhere: ' + eng_and(out) + '. ' : '') + check + every);
  const unc = M.blocks.filter(b => !b.covered);
  if (unc.length) notes.push('The BAE report has no figure for ' + eng_and(unc.map(eng_fyName)) + ': Approved there is the CCaR plan (marked §).');
  for (const b of M.blocks.filter(x => x.planShort)) {
    notes.push(eng_fyName(b) + ': the CCaR plan (' + eng_dollarsT(b.planned) + ') is ' + SP.planShortPct(b.planned, b.approved) + ' of the BAE report’s Approved ('
      + eng_dollarsT(b.approved) + '); Obl % is measured against the report’s figure.');
  }
  // review M4-6: a covered block's plan and Obligated hold money its Approved leaves out by rule; named, never moved (§14.3)
  for (const o of X.offReport) {
    const b = { ap: o.ap, fy: o.fy };
    notes.push(eng_fyName(b) + ': the CCaR plan counts ' + eng_dollarsT(o.planned) + ' on ' + eng_offWords(o.budgets) + ', which the BAE report’s Approved leaves out'
      + (o.obligated !== 0 ? '; ' + eng_dollarsT(o.obligated) + ' of it is obligated, so Obligated and Obl % count money that Approved does not.'
        : ', so the plan counts money that Approved does not.') + ' See the Import report.');
  }
  // §15.4: an (ap, fy) whose only pull rows are FY2025 OBBBA funding is said in its own words, in place of these
  const nbo = X.noBlock.filter(t => !t.obbba);
  if (nbo.length) {
    const one = nbo.length === 1;
    notes.push('The BAE report holds money for ' + nbo.map(t => ENG_AP_LABEL[t.ap] + ' FY' + t.fy + ' (' + eng_dollarsT(t.approved) + ' Approved, '
      + eng_dollarsT(t.authorized) + ' Authorized)').join('; ') + ', which the CCaR pull has no rows for: no block is shown for ' + (one ? 'it' : 'them') + '.');
  }
  for (const t of X.noBlock.filter(x => x.obbba)) {
    notes.push(eng_fyName(t) + ' has no block: its only CCaR pull rows are ' + ENG_OBBBA + ' funding, which is left out. The BAE report’s '
      + eng_dollarsT(t.approved) + ' Approved and ' + eng_dollarsT(t.authorized) + ' Authorized for it are not shown.');
  }
}
// §15.4 THE IMPORT REPORT'S SECTION ON FY2025 OBBBA FUNDING (headed SP.OBBBA_HEAD), for the view and the sheet alike:
// each pull budget the rule leaves out, with its appropriation, rows, plan and obligated, their total, and the BAE report's
// rows of it. Shown when any such row is loaded, that is, left out by the rule: under a First FY after 2025 they are
// before the First FY instead, and said so where those are. Dollars are exact (SP.fmtUsd), as the Import report's are.
SP.obbbaLoaded = function obbbaLoaded(M) {
  const ob = M && M.excluded && M.excluded.obbba;
  if (ob && ob.rows > 0) return true;
  return !!(M && M.bae && M.bae.present && Array.isArray(M.bae.derived) && M.bae.derived.some(d => d.why === ENG_BAE_WHY.obbba));
};
// §15.4 whether an (ap, fy) has no block because its only pull rows are FY2025 OBBBA funding (model.obbbaNoBlock, whatever
// the switches): what the BAE report's table by appropriation and FY says of it, on the view and the sheet alike
SP.isObbbaNoBlock = function isObbbaNoBlock(M, key) {
  return !!(M && Array.isArray(M.obbbaNoBlock) && M.obbbaNoBlock.some(t => t.ap + '|' + t.fy === key));
};
SP.obbbaLines = function obbbaLines(M) {
  if (!SP.obbbaLoaded(M)) return [];
  const ob = M.excluded.obbba && M.excluded.obbba.rows > 0 ? M.excluded.obbba : null;
  const L = ['A row whose budget name holds the word OBBBA and whose FY is ' + SP.OBBBA_FY + ' counts in no figure, block, list or picture, whatever the '
    + 'switches show: FY' + SP.OBBBA_FY + ' is not a reporting year (Brad, 11 Nov 2026).'];
  if (!ob) L.push('In the CCaR pulls: none.');
  else {
    const nb = ob.budgets.length;
    L.push('In the CCaR pulls: ' + eng_rowsWord(ob.rows) + ' on ' + SP.fmtInt(nb) + (nb === 1 ? ' budget' : ' budgets') + ' ('
      + ob.blocks.map(eng_fyName).join(', ') + '):');
    for (const t of ob.budgets) {
      L.push('  “' + t.name + '” (' + ENG_AP_LABEL[t.ap] + '): ' + eng_rowsWord(t.rows) + ', plan ' + SP.fmtUsd(t.cents) + ', obligated ' + SP.fmtUsd(t.obligated) + '.');
    }
    L.push('  Total: ' + eng_rowsWord(ob.rows) + ', plan ' + SP.fmtUsd(ob.cents) + ', obligated ' + SP.fmtUsd(ob.obligated) + '.');
  }
  if (M.bae && M.bae.present) {
    const rr = (Array.isArray(M.bae.derived) ? M.bae.derived : []).filter(d => d.why === ENG_BAE_WHY.obbba);
    L.push('In the BAE report: ' + (rr.length ? eng_rowsWord(rr.length) + ', Approved ' + SP.fmtUsd(eng_sumOf(rr, 'approved')) + ', Authorized '
      + SP.fmtUsd(eng_sumOf(rr, 'authorized')) + '.' : 'none.'));
  }
  return L;
};
// §14.4 the lines under a PMO tab's table with a BAE report loaded, in the one wording the screen and the workbook print:
// what its figures count where they are the budgets', and, where a typed Authorized stands on a block the tab shows,
// that it is never split among PMOs. [] with no report, or for a PMO none of whose rows is on the budgets.
SP.pmoTabNotes = function pmoTabNotes(pmo, model) {
  if (!pmo || !model || !model.bae || !model.bae.present) return [];
  const rows = Array.isArray(pmo.rows) ? pmo.rows : [];
  const bud = rows.filter(r => r.basis === 'budget');
  if (!bud.length) return [];
  // (no PMO) has no code of its own: SP.pmoCode reads 'no PMO' out of its label, and no budget ends in that. Its row counts
  // the budgets whose last word is NO PMO's code (§14.2: CAM, SUPT, Initial, a Budget left blank), the ones every other
  // tab leaves, so it says that; filling §14.4's sentence in with its "code" told a reader the opposite of the rule, on
  // the tab that holds over half the real report's sustainment Approved (review M4-3)
  const what = pmo.key === '' ? 'whose name does not end in any PMO’s code, which no other PMO’s tab counts'
    : 'whose name ends in this PMO’s code (' + pmo.code + ')';
  const out = ['Approved, Authorized and Obligated count the budgets ' + what + '; the detail below lists rows by their own PMO.'];
  // rule 7 counts a PMO row's Obligated by the budget's PMO, Flyaway and budgets that name no appropriation included, while
  // its Approved is the sustainment budgets alone; where that leaves money on one side only, the tab says how much (M4-6)
  const off = bud.filter(r => Number.isSafeInteger(r.offObligated) && r.offObligated !== 0);
  if (off.length) {
    out.push('Obligated includes money executed on budgets the BAE report’s Approved leaves out (Flyaway (production), a budget that names no '
      + 'appropriation, or no Budget at all): ' + off.map(r => eng_fyName(r) + ' ' + eng_dollarsT(r.offObligated)).join('; ')
      + '. Obl % there counts it against an Approved that does not.');
  }
  const typed = bud.filter(r => (model.blocks || []).some(b => b.key === r.key && b.authorizedSrc === 'entered'));
  if (typed.length) {
    out.push('Authorized is entered for ' + eng_and(typed.map(eng_fyName)) + ' as a whole and is never split among the PMOs: this tab shows the BAE report’s Authorized for '
      + (typed.length === 1 ? 'that block' : 'those blocks') + '.');
  }
  return out;
};
// EVERY LINE UNDER A PMO TAB'S TABLE, in order, for the screen and the workbook alike: they were written apart and said the
// same thing in two wordings and two orders (integration, §14.4). With no report it is §8.6's one note, word for word. With
// one, it is SP.pmoTabNotes' lines, then §8.6's note narrowed to the rows it is still true of: a row the report covers
// shows the budgets' Authorized, so "a PMO row shows Approved" is said only when a row is §4.6's.
SP.pmoTabLines = function pmoTabLines(pmo, model) {
  if (!model || !model.bae || !model.bae.present) return ['Authorized is entered by appropriation and FY; a PMO row shows Approved.'];
  const rows = pmo && Array.isArray(pmo.rows) ? pmo.rows : [];
  return SP.pmoTabNotes(pmo, model).concat(rows.some(r => r.basis !== 'budget')
    ? ['Authorized is entered by appropriation and FY; where the BAE report has no figure for a block, its PMO row shows Approved.'] : []);
};
// THE STRIP OVER A PMO TAB'S BLOCK (§8.6 item 3), for the screen and the workbook alike: the stoplight row's figures for
// that block, each with the mark that row carries in the table above (§14.4, §14.5). They were written apart, and only the
// workbook carried the marks: on screen a block the report has no figure for read "Approved 24.85M | Authorized 24.85M",
// with nothing to say the first was the plan and the second stood in for it (review M4-5, P4-5). With no report a PMO row
// carries no mark (its Authorized is Approved, and the note under the table says so), so the strip carries none either.
//   -> {head: 'Full Fund FY2025 Summary', parts: [[word, cents, mark] x4]}; SP.pmoStrip joins them as the workbook prints
SP.pmoStripParts = function pmoStripParts(b, model) {
  const rep = !!(model && model.bae && model.bae.present);
  return { head: b.apLabel + ' FY' + b.fy + ' Summary', parts: [['Approved', b.approved, rep ? SP.approvedMark(b, model) : ''],
    ['Authorized', b.authorized, rep ? SP.authMark(b, model) : ''], ['Obligated', b.obligated, ''], ['Unobligated', b.unobligated, '']] };
};
SP.pmoStrip = function pmoStrip(b, model) {
  const s = SP.pmoStripParts(b, model);
  return s.head + s.parts.map(([w, c, m]) => '  |  ' + w + ' ' + SP.fmtMText(c) + 'M' + m).join('');
};

// ---------------------------------------------------------------------------------------------------------------
// WHAT CHANGED (§4.6 diffPulls): every row of every FY, with no switches and no first FY, because the question is what the
// new pull holds that the old one did not, not what this browser happens to be showing.
//
// A row that cannot be read (its FY or Amount) is counted in no dollar figure here, as everywhere, but it is still IN the
// pull: its CCaR is there, and so is its line when its FY reads. Dropped from the comparison, a CCaR whose one row turned
// unreadable read "gone from this pull" with its dollars taken off Approved, while the row sat in the pull (review M1);
// the other way round it read "new". Such lines are listed apart, with what each side could read.
//
// A LINE is every row of one appropriation, FY, PMO, Title, Plan Event and CCaR, added together. It changes when its
// amount changes, when its money becomes obligated (Actual Execution) or stops being, or when its money moves to another
// month: a pull in which five rows were obligated and three slipped from Jun to Sep, no amount changed, listed no line at
// all while Obligated rose and two month columns moved (review BP-2).
// ---------------------------------------------------------------------------------------------------------------
function eng_ccarNew() { return { cents: 0, unread: 0, sp: new Map(), usp: new Map(), pmoKeys: new Map(), upmoKeys: new Map(), pmoSp: new Map() }; }
function eng_diffSide(rows, ap, settings) {
  const blocks = new Map(), ccars = new Map(), leaves = new Map();
  let unread = 0;
  for (const row of rows || []) {
    const d = SP.deriveRow(row, settings);
    const ok = eng_readable(d);
    if (!ok) unread++;
    // the CCaR is in the pull whether or not its row reads; its dollars, PMO and spelling come from the rows that read,
    // and from the others only when none reads
    let c = ccars.get(d.k.ccar);
    if (!c) ccars.set(d.k.ccar, (c = eng_ccarNew()));
    eng_tally(ok ? c.sp : c.usp, eng_txt(d.ccar));
    eng_tally(ok ? c.pmoKeys : c.upmoKeys, d.k.pmo);
    let ps = c.pmoSp.get(d.k.pmo);
    if (!ps) c.pmoSp.set(d.k.pmo, (ps = new Map()));
    eng_tally(ps, eng_txt(d.pmo));
    if (ok) c.cents += d.cents; else c.unread++;
    // a row whose FY does not read has no line to belong to: it is counted on its CCaR and in `unread` only
    if (!Number.isInteger(d.fy)) continue;
    const parts = [ap, String(d.fy), d.k.pmo, d.k.title, d.k.pe, d.k.ccar];
    const lk = JSON.stringify(parts);      // grouped by the parts, never by a joined string a '|' in a name could fake
    let l = leaves.get(lk);
    if (!l) leaves.set(lk, (l = { parts, fy: d.fy, cents: 0, exec: 0, unread: 0, ym: new Map(), sp: [new Map(), new Map(), new Map(), new Map()] }));
    [d.pmo, d.title, d.pe, d.ccar].forEach((s, i) => eng_tally(l.sp[i], eng_txt(s)));
    if (!ok) { l.unread++; continue; }
    const bk = ap + '|' + d.fy;
    let f = blocks.get(bk);
    if (!f) blocks.set(bk, (f = { fy: d.fy, approved: 0, obligated: 0 }));
    f.approved += d.cents;
    if (d.status === 'exec') { f.obligated += d.cents; l.exec += d.cents; }
    l.cents += d.cents;
    // the month the row is dated in ('' for no date): money that moves between months is a change of its own
    const ym = /^\d{4}-\d{2}/.test(d.date) ? d.date.slice(0, 7) : '';
    l.ym.set(ym, (l.ym.get(ym) || 0) + d.cents);
  }
  for (const c of ccars.values()) {
    // a CCaR's PMO is the one most of its rows carry, named the way most of those rows spell it. Where PMOs carry as
    // many rows, it is the first of them in the PMO order, never the PMO of whichever row the pull lists first: settled
    // by row order, a CCaR with one AV row and one PSM row "moved to another PMO" when a pull listed the same two rows
    // the other way round, with no row and no dollar changed (second review M3)
    const keys = c.pmoKeys.size ? c.pmoKeys : c.upmoKeys;
    let pk = '', n = -1;
    for (const [k, m] of keys) if (m > n || (m === n && eng_pmoKeyCmp(k, pk) < 0)) { n = m; pk = k; }
    c.pmo = pk; c.pmoLabel = eng_major(c.pmoSp.get(pk) || new Map(), ENG_BLANK.pmo); c.label = eng_major(c.sp.size ? c.sp : c.usp, ENG_BLANK.ccar);
  }
  return { blocks, ccars, leaves, unread };
}
// what moved between months: the months that lost money and the months that gained it, and the dollars that changed
// month (half of what every month moved, less the change in the line's amount)
function eng_moved(a, b, change) {
  // a line in one pull only has nothing to move: it is new or gone, whatever months its rows sit in
  if (!a || !b) return { cents: 0, from: [], to: [] };
  const yms = [...new Set([...a.ym.keys(), ...b.ym.keys()])].sort();
  const from = [], to = [];
  let abs = 0;
  for (const ym of yms) {
    const x = a.ym.get(ym) || 0, y = b.ym.get(ym) || 0;
    if (x === y) continue;
    abs += Math.abs(y - x);
    (y < x ? from : to).push({ ym, cents: Math.abs(y - x) });
  }
  const cents = Math.max(0, (abs - Math.abs(change)) / 2);
  // money that only grew or shrank in place moved nowhere: no month is named for it
  return cents ? { cents, from, to } : { cents: 0, from: [], to: [] };
}
function eng_leafOut(o, l) {
  const s = l || o;
  const blank = [ENG_BLANK.pmo, ENG_BLANK.title, ENG_BLANK.pe, ENG_BLANK.ccar];
  // a line's names are the spelling most of its rows use, over both pulls' rows
  const sp = s.sp.map((m, i) => { const t = new Map(m); if (o && l) for (const [k, n] of o.sp[i]) t.set(k, (t.get(k) || 0) + n); return t; });
  const [pmo, title, pe, ccar] = sp.map((m, i) => eng_major(m, blank[i]));
  const before = o ? o.cents : 0, after = l ? l.cents : 0, change = after - before;
  const obligated = [o ? o.exec : 0, l ? l.exec : 0];
  const moved = eng_moved(o, l, change);
  const unread = [o ? o.unread : 0, l ? l.unread : 0];
  const what = [];
  if (change) what.push('amount');
  if (obligated[0] !== obligated[1]) what.push('obligated');
  if (moved.cents) what.push('dates');
  if (unread[0] !== unread[1]) what.push('unread');
  return { key: s.parts.join('|'), parts: s.parts, ap: s.parts[0], fy: s.fy, pmo, title, pe, ccar, before, after, change, obligated, moved, unread, what,
    size: Math.max(Math.abs(change), Math.abs(obligated[1] - obligated[0]), moved.cents) };
}
// largest change first: the largest of the change in amount, in obligated and in dollars moved between months
function eng_bigFirst(a, b) { return b.size - a.size || eng_cmp(a.key, b.key); }
SP.diffPulls = function diffPulls(prevPulls, curPulls, settings) {
  const out = {};
  for (const ap of ENG_AP_IDS) {
    const p0 = prevPulls && prevPulls[ap], p1 = curPulls && curPulls[ap];
    if (!p0 || !p1 || !Array.isArray(p0.rows) || !Array.isArray(p1.rows)) continue;
    const a = eng_diffSide(p0.rows, ap, settings), b = eng_diffSide(p1.rows, ap, settings);
    const fys = [...new Set([...a.blocks.values(), ...b.blocks.values()].map(f => f.fy))].sort((x, y) => x - y);
    const byBlock = {}, totals = { approved: [0, 0], obligated: [0, 0] };
    for (const fy of fys) {
      const k = ap + '|' + fy, x = a.blocks.get(k) || { approved: 0, obligated: 0 }, y = b.blocks.get(k) || { approved: 0, obligated: 0 };
      byBlock[k] = { fy, approved: [x.approved, y.approved], obligated: [x.obligated, y.obligated] };
      totals.approved[0] += x.approved; totals.approved[1] += y.approved;
      totals.obligated[0] += x.obligated; totals.obligated[1] += y.obligated;
    }
    const ccarOut = c => ({ key: c.k, label: c.label, cents: c.cents, pmo: c.pmoLabel, unread: c.unread });
    const ccarsNew = [], ccarsGone = [], pmoMoves = [];
    for (const [k, c] of b.ccars) if (!a.ccars.has(k)) ccarsNew.push(ccarOut(Object.assign({ k }, c)));
    for (const [k, c] of a.ccars) if (!b.ccars.has(k)) ccarsGone.push(ccarOut(Object.assign({ k }, c)));
    for (const [k, c] of b.ccars) {
      const o = a.ccars.get(k);
      if (o && o.pmo !== c.pmo) pmoMoves.push({ key: k, label: c.label, from: o.pmoLabel, to: c.pmoLabel, cents: c.cents });
    }
    [ccarsNew, ccarsGone, pmoMoves].forEach(l => l.sort((x, y) => eng_cmp(x.key, y.key)));
    const lNew = [], lGone = [], lChanged = [], lUnread = [];
    for (const k of new Set([...a.leaves.keys(), ...b.leaves.keys()])) {
      const o = a.leaves.get(k), l = b.leaves.get(k);
      const x = eng_leafOut(o, l);
      // a line with a row that could not be read, on either side, is neither new nor gone because of it
      if ((o && o.unread) || (l && l.unread)) { if (x.what.length) lUnread.push(x); continue; }
      if (!o) lNew.push(x);
      else if (!l) lGone.push(x);
      else if (x.what.length) lChanged.push(x);
    }
    [lNew, lGone, lChanged, lUnread].forEach(l => l.sort(eng_bigFirst));
    out[ap] = { ap, label: ENG_AP_LABEL[ap], importedAt: [p0.importedAt || null, p1.importedAt || null], byBlock, totals,
      ccarsNew, ccarsGone, pmoMoves, unread: [a.unread, b.unread], leaves: { new: lNew, gone: lGone, changed: lChanged, unread: lUnread } };
  }
  return out;
};

// ---------------------------------------------------------------------------------------------------------------
// WHAT CHANGED IN THE BAE REPORT (§14.6 SP.diffBae): the report that replaced another, against it, over its sustainment
// budgets (scope 'in'), every FY and every row, with no switches: the question is what the new report says that the old
// one did not, not what this browser shows. A budget is IN a report when it has an in-scope row there, readable or not,
// as a CCaR whose rows do not read is still in its pull (§4.6): so a row that turned unreadable never makes a budget
// gone, and its dollars, like every unreadable row's, count nowhere. A budget changed when any FY's Approved or
// Authorized moved. Each list is largest change first: the change summed over its FYs, Approved or Authorized,
// whichever is larger; ties by name (its normKey).
// A BUDGET WITH A ROW THAT COULD NOT BE READ, on either side, is listed apart (budgetsUnread), as the pull's lines with
// such a row are (§4.6, review M1), with how many rows each side could not read: listed as changed, a budget whose one
// Authorized cell turned to "n/a" read "Approved 500.00 → -", cut to $0, though its Approved cell held the same figure
// in both files, and nothing on the view said a row could not be read (review I4-3). `unread` counts every such row.
// ---------------------------------------------------------------------------------------------------------------
function eng_baeSide(bae, settings) {
  const blocks = new Map(), figs = new Map(), names = new Map(), unread = new Map();
  let unreadN = 0;
  for (const row of bae && Array.isArray(bae.rows) ? bae.rows : []) {
    const x = SP.baeDerive(row, settings);
    if (x.name === '' || x.scope !== 'in') continue;
    if (!names.has(x.key)) names.set(x.key, x.name);
    if (!figs.has(x.key)) figs.set(x.key, new Map());
    if (!x.readable) { unread.set(x.key, (unread.get(x.key) || 0) + 1); unreadN++; continue; }
    const bk = x.ap + '|' + x.fy;
    if (!blocks.has(bk)) blocks.set(bk, { ap: x.ap, fy: x.fy, approved: 0, authorized: 0 });
    const t = blocks.get(bk);
    t.approved += x.approved; t.authorized += x.authorized;
    const f = figs.get(x.key), fk = String(x.fy);
    if (!f.has(fk)) f.set(fk, [0, 0]);
    f.get(fk)[0] += x.approved; f.get(fk)[1] += x.authorized;
  }
  return { blocks, figs, names, unread, unreadN };
}
function eng_baeWho(bae) {
  const b = bae && typeof bae === 'object' ? bae : {};
  const when = SP.baeWhen(b);
  return { file: eng_txt(b.file), stamp: typeof b.stamp === 'string' && b.stamp ? b.stamp : null,
    importedAt: typeof b.importedAt === 'string' ? b.importedAt : null, when,
    label: (when || 'no date recorded') + (b.file ? ' (' + eng_txt(b.file) + ')' : '') };
}
SP.diffBae = function diffBae(prev, cur, settings) {
  const a = eng_baeSide(prev, settings), b = eng_baeSide(cur, settings);
  const rank = ap => ENG_AP_IDS.indexOf(ap);
  const keys = new Map([...a.blocks.values(), ...b.blocks.values()].map(t => [t.ap + '|' + t.fy, t]));
  const byBlock = {};
  for (const [k, t] of [...keys].sort((x, y) => rank(x[1].ap) - rank(y[1].ap) || x[1].fy - y[1].fy)) {
    const p = a.blocks.get(k) || { approved: 0, authorized: 0 }, q = b.blocks.get(k) || { approved: 0, authorized: 0 };
    byBlock[k] = { ap: t.ap, fy: t.fy, approved: [p.approved, q.approved], authorized: [p.authorized, q.authorized] };
  }
  const entry = k => {
    const f0 = a.figs.get(k) || new Map(), f1 = b.figs.get(k) || new Map();
    const fys = [...new Set([...f0.keys(), ...f1.keys()])].sort(eng_cmp);
    const byFy = {};
    let da = 0, du = 0;
    const approved = [0, 0], authorized = [0, 0];
    for (const fy of fys) {
      const x = f0.get(fy) || [0, 0], y = f1.get(fy) || [0, 0];
      byFy[fy] = { approved: [x[0], y[0]], authorized: [x[1], y[1]] };
      da += Math.abs(y[0] - x[0]); du += Math.abs(y[1] - x[1]);
      approved[0] += x[0]; approved[1] += y[0]; authorized[0] += x[1]; authorized[1] += y[1];
    }
    const e = { key: k, name: b.names.get(k) ?? a.names.get(k), size: Math.max(da, du), approved, authorized, byFy };
    if (unr(k)) e.unread = [a.unread.get(k) || 0, b.unread.get(k) || 0];
    return e;
  };
  // two budgets' figures are the same when they hold the same FYs with the same two figures in each
  const same = (f0, f1) => f0.size === f1.size && [...f0].every(([fy, v]) => f1.has(fy) && f1.get(fy)[0] === v[0] && f1.get(fy)[1] === v[1]);
  const ranked = ks => ks.map(entry).sort((x, y) => y.size - x.size || eng_cmp(x.key, y.key));
  const unr = k => a.unread.has(k) || b.unread.has(k);
  const all = [...new Set([...b.names.keys(), ...a.names.keys()])];
  // listed apart when anything about it differs: in one report only, its figures, or how many of its rows could not be read
  const differs = k => !a.names.has(k) || !b.names.has(k) || (a.unread.get(k) || 0) !== (b.unread.get(k) || 0)
    || !same(a.figs.get(k) || new Map(), b.figs.get(k) || new Map());
  return {
    from: eng_baeWho(prev), to: eng_baeWho(cur),
    title: 'BAE report: ' + eng_baeWho(prev).label + ' → ' + eng_baeWho(cur).label,
    byBlock,
    unread: [a.unreadN, b.unreadN],
    budgetsNew: ranked([...b.names.keys()].filter(k => !a.names.has(k) && !unr(k))),
    budgetsGone: ranked([...a.names.keys()].filter(k => !b.names.has(k) && !unr(k))),
    budgetsChanged: ranked([...b.names.keys()].filter(k => a.names.has(k) && !unr(k) && !same(a.figs.get(k), b.figs.get(k)))),
    budgetsUnread: ranked(all.filter(k => unr(k) && differs(k))),
  };
};
