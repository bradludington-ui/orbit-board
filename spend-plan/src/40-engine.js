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
SP.AUTH_MARK_TEXT = Object.freeze({
  '†': 'Authorized was not entered for this row; Approved is shown in its place.',
  '‡': 'Authorized as entered, for the appropriation and FY as a whole: it covers every service and lane, while the switches show only some.',
});
// '†' not entered (Approved stands in); '‡' entered while some switch is off; '' entered with everything shown
SP.authMark = function authMark(row, model) {
  if (!row) return '';
  if (!row.authorizedEntered) return '†';
  return model && model.shown && !model.shown.all ? '‡' : '';
};
// the marks a TOTAL over these rows carries: it adds whatever its rows are, so it carries each of their marks
SP.authMarks = function authMarks(rows, model) {
  const m = (rows || []).map(r => SP.authMark(r, model));
  return { dag: m.includes('†'), ddag: m.includes('‡') };
};

// §8's "Obligation %  (Approved X.XXM; …)" and the PMO strip: $M inside a sentence. The screen wrote it with fmtM,
// the workbook as v12's TEXT(x,"#,##0.00") and the picture with fmtM but 0.00 for zero, so one block's label read
// "Approved -M", "Approved 0.00M" and "-1,234.57M" against "(1,234.57)M" across the three (review R7). One wording now:
// fmtM's, so a negative is in parentheses as in every cell beside it and nothing non-zero reads as zero (§2), with zero
// written 0.00, because a lone dash inside a sentence reads as a figure left out.
SP.fmtMText = function fmtMText(cents) {
  return typeof cents === 'number' && isFinite(cents) && Math.round(cents) === 0 ? '0.00' : SP.fmtM(cents);
};
SP.oblLabel = function oblLabel(block, model) {
  const c = model && Array.isArray(model.cols) ? model.cols[model.asOfIndex] : null;
  return 'Obligation %  (Approved ' + SP.fmtMText(block && block.approved) + 'M; actual through ' + (c ? c.label : '') + ', plan after)';
};

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
function eng_fyName(b) { return ENG_AP_LABEL[b.ap] + ' FY' + b.fy; }
function eng_dollars(c) { return '$' + SP.fmtM(c) + 'M'; }
function eng_rowsWord(n) { return SP.fmtInt(n) + (n === 1 ? ' row' : ' rows'); }

// ---------------------------------------------------------------------------------------------------------------
// THE MODEL (§4.6)
// ---------------------------------------------------------------------------------------------------------------
SP.buildModel = function buildModel(pulls, settings, view) {
  const S = eng_settings(settings, true);
  S.specialSet = new Set(S.special);
  const V = eng_view(view);
  const cx = eng_ctx(S);
  pulls = pulls && typeof pulls === 'object' ? pulls : {};
  const rowsByAp = {};
  const excluded = { beforeFirst: { cents: 0, rows: 0, byFy: {}, rowsByFy: {} }, unidentified: { cents: 0, rows: 0 },
    unreadable: { rows: 0 } };
  const blockRows = new Map();          // 'ap|fy' -> counted rows, in pull order
  const blockOf = new Map();            // 'ap|fy' -> {ap, fy}
  const pmoSpell = new Map();           // PMO key -> spellings over every counted row, in row order (its tab's label)
  const present = { svc: new Set(), lane: new Set() };
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
      if (!eng_readable(d)) {
        excluded.unreadable.rows++;
        // a row whose FY reads still names its block: a block does not vanish because its one row's amount is damaged
        if (Number.isInteger(d.fy) && d.fy >= S.firstFY) ensure(ap, d.fy);
        continue;
      }
      if (d.fy < S.firstFY) {
        const b = excluded.beforeFirst, k = String(d.fy);
        b.cents += d.cents; b.rows++;
        b.byFy[k] = (b.byFy[k] || 0) + d.cents; b.rowsByFy[k] = (b.rowsByFy[k] || 0) + 1;
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
    }
  }
  const un = pulls.unidentified;
  if (un && Array.isArray(un.rows)) {
    rowsByAp.unidentified = un.rows.length;
    for (const row of un.rows) {
      const d = SP.deriveRow(row, settings);
      if (!eng_readable(d)) excluded.unreadable.rows++;
      else { excluded.unidentified.cents += d.cents; excluded.unidentified.rows++; }
    }
  }
  // the blocks, appropriation order then FY
  const keys = [...blockOf.keys()].sort((a, b) => {
    const x = blockOf.get(a), y = blockOf.get(b);
    return ENG_AP_IDS.indexOf(x.ap) - ENG_AP_IDS.indexOf(y.ap) || x.fy - y.fy;
  });
  const blocks = [], pmoBlocks = new Map();   // PMO key -> [PmoBlock]
  for (const key of keys) {
    const { ap, fy } = blockOf.get(key), rows = blockRows.get(key);
    const entered = eng_own(S.authorized, key) && Number.isSafeInteger(S.authorized[key]);
    const b = eng_block(rows, ap, fy, cx, S, { entered, cents: entered ? S.authorized[key] : 0 });
    blocks.push(b);
    // each PMO's own block: the same figures over only its rows, Authorized = Approved (§8.6)
    const byPmo = new Map();
    for (const r of rows) {
      let l = byPmo.get(r.d.k.pmo);
      if (!l) byPmo.set(r.d.k.pmo, (l = []));
      l.push(r);
    }
    for (const [pk, prs] of byPmo) {
      const pb = eng_block(prs, ap, fy, cx, S, { entered: false, cents: 0 });
      if (!pmoBlocks.has(pk)) pmoBlocks.set(pk, []);
      pmoBlocks.get(pk).push(pb);
    }
  }
  const naAll = [];
  for (const b of blocks) for (const it of b.na) naAll.push(Object.assign({ ap: b.ap, apLabel: b.apLabel, fy: b.fy, blockKey: b.key }, it));
  const aps = [];
  for (const ap of ENG_AP_IDS) {
    const list = blocks.filter(b => b.ap === ap);
    if (list.length) aps.push({ ap, label: ENG_AP_LABEL[ap], blocks: list, total: eng_tot(list) });
  }
  // the PMOs, in PMO order by the label over every counted row; each with its blocks in v12's PMO-tab order
  const tabOrder = (a, b) => ENG_PMO_TAB_ORDER.indexOf(a.ap) - ENG_PMO_TAB_ORDER.indexOf(b.ap) || a.fy - b.fy;
  const pmos = [];
  for (const [pk, pbs] of pmoBlocks) {
    const label = eng_major(pmoSpell.get(pk) || new Map(), ENG_BLANK.pmo);
    pbs.sort(tabOrder);
    pmos.push({ pmo: pk, key: pk, label, code: SP.pmoCode(label), blocks: pbs,
      rows: pbs.map(pb => ({ ap: pb.ap, apLabel: pb.apLabel, fy: pb.fy, key: pb.key, approved: pb.approved,
        authorized: pb.authorized, obligated: pb.obligated, unobligated: pb.unobligated, unprog: pb.unprog, oblPct: pb.oblPct,
        goal: pb.goal, delta: pb.delta, status: pb.status, execAfterAsOf: pb.execAfterAsOf, execNoDate: pb.execNoDate })),
      total: eng_tot(pbs, true) });
  }
  pmos.sort(eng_pmoSort);
  const execAfter = { cents: 0, rows: 0 }, execNoDate = { cents: 0, rows: 0 };
  for (const b of blocks) {
    execAfter.cents += b.execAfterAsOf; execAfter.rows += b.execAfterAsOfRows;
    execNoDate.cents += b.execNoDate; execNoDate.rows += b.execNoDateRows;
  }
  const model = {
    asOf: S.asOf, asOfLabel: SP.asOfLabel(S.asOf), E: cx.E, firstFY: S.firstFY, window: { start: cx.wstart, end: cx.wend },
    cols: cx.cols, asOfIndex: cx.asOfIndex, showNoDate, shown: eng_shown(V, present), special: S.special,
    present: { services: ENG_ALL_SVC.filter(s => present.svc.has(s)), lanes: ENG_LANES.filter(l => present.lane.has(l)) },
    blocks, aps, pmos, naAll, excluded, execAfterAsOf: execAfter, execNoDate, rowsByAp,
    summary: { rows: blocks, total: eng_tot(blocks), notes: [] },
  };
  model.summary.notes = eng_notes(model);
  return model;
};

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
  if (filtered) {
    const ex = [];
    if (authAll.length) ex.push('an entered Authorized (marked ‡)');
    if (bf.rows || ui.rows || ur) ex.push('the notes below on rows not counted');
    notes.push(M.shown.text + '. Every figure counts only these' + (ex.length ? ', except ' + ex.join(' and ') + ', which cover every service and lane' : '') + '.');
  }
  const up = M.blocks.filter(b => b.unprog !== 0);
  if (up.length) notes.push('Unprogrammed money is counted in Approved: ' + up.map(b => eng_fyName(b) + ' ' + eng_dollars(b.unprog)).join('; ') + '.');
  const noAuth = M.blocks.filter(b => !b.authorizedEntered);
  if (noAuth.length) {
    notes.push('Authorized was not entered for ' + (noAuth.length === M.blocks.length ? 'any block'
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

// ---------------------------------------------------------------------------------------------------------------
// WHAT CHANGED (§4.6 diffPulls): every readable row of every FY, with no switches and no first FY, because the question
// is what the new pull holds that the old one did not, not what this browser happens to be showing.
// ---------------------------------------------------------------------------------------------------------------
function eng_diffSide(rows, ap, settings) {
  const blocks = new Map(), ccars = new Map(), leaves = new Map();
  for (const row of rows || []) {
    const d = SP.deriveRow(row, settings);
    if (!eng_readable(d)) continue;
    const bk = ap + '|' + d.fy;
    let f = blocks.get(bk);
    if (!f) blocks.set(bk, (f = { fy: d.fy, approved: 0, obligated: 0 }));
    f.approved += d.cents;
    if (d.status === 'exec') f.obligated += d.cents;
    let c = ccars.get(d.k.ccar);
    if (!c) ccars.set(d.k.ccar, (c = { cents: 0, sp: new Map(), pmoKeys: new Map(), pmoSp: new Map() }));
    c.cents += d.cents;
    eng_tally(c.sp, eng_txt(d.ccar));
    eng_tally(c.pmoKeys, d.k.pmo);
    let ps = c.pmoSp.get(d.k.pmo);
    if (!ps) c.pmoSp.set(d.k.pmo, (ps = new Map()));
    eng_tally(ps, eng_txt(d.pmo));
    const parts = [ap, String(d.fy), d.k.pmo, d.k.title, d.k.pe, d.k.ccar];
    const lk = JSON.stringify(parts);      // grouped by the parts, never by a joined string a '|' in a name could fake
    let l = leaves.get(lk);
    if (!l) leaves.set(lk, (l = { parts, fy: d.fy, cents: 0, sp: [new Map(), new Map(), new Map(), new Map()] }));
    l.cents += d.cents;
    [d.pmo, d.title, d.pe, d.ccar].forEach((s, i) => eng_tally(l.sp[i], eng_txt(s)));
  }
  for (const c of ccars.values()) {
    // a CCaR's PMO is the one most of its rows carry, named the way most of those rows spell it
    let pk = '', n = -1;
    for (const [k, m] of c.pmoKeys) if (m > n) { n = m; pk = k; }
    c.pmo = pk; c.pmoLabel = eng_major(c.pmoSp.get(pk), ENG_BLANK.pmo); c.label = eng_major(c.sp, ENG_BLANK.ccar);
  }
  return { blocks, ccars, leaves };
}
function eng_leafOut(l, before, after) {
  const blank = [ENG_BLANK.pmo, ENG_BLANK.title, ENG_BLANK.pe, ENG_BLANK.ccar];
  const [pmo, title, pe, ccar] = l.sp.map((m, i) => eng_major(m, blank[i]));
  return { key: l.parts.join('|'), parts: l.parts, ap: l.parts[0], fy: l.fy, pmo, title, pe, ccar, before, after, change: after - before };
}
function eng_bigFirst(a, b) { return Math.abs(b.change) - Math.abs(a.change) || eng_cmp(a.key, b.key); }
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
    const ccarOut = c => ({ key: c.k, label: c.label, cents: c.cents, pmo: c.pmoLabel });
    const ccarsNew = [], ccarsGone = [], pmoMoves = [];
    for (const [k, c] of b.ccars) if (!a.ccars.has(k)) ccarsNew.push(ccarOut(Object.assign({ k }, c)));
    for (const [k, c] of a.ccars) if (!b.ccars.has(k)) ccarsGone.push(ccarOut(Object.assign({ k }, c)));
    for (const [k, c] of b.ccars) {
      const o = a.ccars.get(k);
      if (o && o.pmo !== c.pmo) pmoMoves.push({ key: k, label: c.label, from: o.pmoLabel, to: c.pmoLabel, cents: c.cents });
    }
    [ccarsNew, ccarsGone, pmoMoves].forEach(l => l.sort((x, y) => eng_cmp(x.key, y.key)));
    const lNew = [], lGone = [], lChanged = [];
    for (const [k, l] of b.leaves) {
      const o = a.leaves.get(k);
      if (!o) lNew.push(eng_leafOut(l, 0, l.cents));
      else if (o.cents !== l.cents) lChanged.push(eng_leafOut(l, o.cents, l.cents));
    }
    for (const [k, l] of a.leaves) if (!b.leaves.has(k)) lGone.push(eng_leafOut(l, l.cents, 0));
    [lNew, lGone, lChanged].forEach(l => l.sort(eng_bigFirst));
    out[ap] = { ap, label: ENG_AP_LABEL[ap], importedAt: [p0.importedAt || null, p1.importedAt || null], byBlock, totals,
      ccarsNew, ccarsGone, pmoMoves, leaves: { new: lNew, gone: lGone, changed: lChanged } };
  }
  return out;
};
