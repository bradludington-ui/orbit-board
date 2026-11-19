// §33 PUBLISH SPEND PLAN (Brad, 16 and 17 Nov 2026). PDFs "that can be pushed out for each appropriation and each PMO by
// appropriation", laid out like his Consolidated Template: per CCaR record a title, a description, its award dates and a
// row per service of Required, Approved, Obligated, Remaining and Delta. His rules, in his words:
//   - Required "is tracked separately": "the delta between what's in the spend plan and what's on our unfunded list becomes
//     the total requirement value". So Required = Approved + the unfunded list's amount, Delta = Approved - Required.
//   - Approved is the "CCaR amount in plan event"; Obligated is the rows CCaR marks Actual Execution, as everywhere in APEX.
//   - One requirement is one CCaR record (its CCaR number).
//   - "Primes should still sit in a Prime Contracts section first": the Special CCaRs of Settings.
//   - A consolidated plan per appropriation with each fiscal year its own section; a plan per PMO holding only that PMO's
//     data; the stoplight at the front of each, "filtered to what's being presented", one only for a PMO.
//   - An unfunded line whose CCaR record has no plan event still appears (Approved $0), and each file ends with the
//     unfunded list "filtered to what that spend plan file is presenting".
// Three parts, each pure (nothing here reads the page, a clock or the store):
//   SP.readUfr(workbook, fileName)        the UFR tracker workbook -> its lines (§33.1)
//   SP.publishData(model, ufr, pub, opts) every document's figures (§33.2, §33.3)
//   SP.publishPages(doc, ctx)             a document's pages, as SP.pdfBytes draws them (§33.4)
// The model given is one built with every switch on: a published plan with a service switched off on somebody's screen
// would be a smaller plan with nothing on it saying so.

const PB_NSVC = SP.SERVICES.length;                    // 6, and index 6 is money no service column carries
const PB_SVC_LABEL = Object.freeze(['USAF', 'USAF ANG', 'USAF AFRC', 'USMC (F-35B)', 'USMC (F-35C)', 'USN', 'Service not identified']);
const PB_PRIME = 'Prime Contracts';
function pb_zeros() { return new Array(PB_NSVC + 1).fill(0); }
function pb_cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
function pb_tally(map, s) { map.set(s, (map.get(s) || 0) + 1); }
// the spelling most rows use; a tie goes to the one that sorts first, so two people publishing the same data get the same title
function pb_major(map, blank) {
  let best = null, n = -1;
  for (const [s, c] of map) if (s !== '' && (c > n || (c === n && s < best))) { best = s; n = c; }
  return best === null ? blank : best;
}
function pb_txt(v) { return v === null || v === undefined ? '' : String(v).replace(/\s+/g, ' ').trim(); }
function pb_apLabel(ap) { const a = SP.APS.find(x => x.id === ap); return a ? a.label : String(ap); }
const PB_AP_LONG = Object.freeze({ om: 'Operations & Maintenance', ff: 'Full Fund', sp: 'Initial Spares', opn: 'Other Procurement, Navy (OPN)' });
SP.PUBLISH_SVC_LABELS = PB_SVC_LABEL;
// §33.9 THE COLOUR DOWN THE LEFT SIDE (Brad, 17 Nov 2026: "Let's vary the Prime Contract and PMO colors on the left side.
// Let's keep them uniform or standardized across all versions"). Prime Contracts has its own colour and each PMO has its
// own, the same in every document and every time: a PMO's is fixed by its place in the tool's own list of PMOs, never by
// which PMOs happen to be in the plan, so Propulsion is the same colour in the O&M plan, in its own plan and next year. A
// PMO the tool does not know takes one of four further colours by its name, so it too is the same wherever it is printed.
// Every colour is light enough for the black label on it to read (each clears 7:1 against black).
const PB_PRIME_COLOR = '#8EAADB';                       // the header band's blue: the primes lead the plan
const PB_PMO_COLORS = Object.freeze(['#B9D7B0', '#EBD79B', '#CDBFE3', '#A8D5D3', '#F0C2A6', '#E9B9C4', '#C9D29B']);   // in SP.PMO_ORDER's order
const PB_OTHER_COLORS = Object.freeze(['#D3D7DC', '#D9C9B4', '#BFD0E6', '#DADFB6']);
SP.publishColor = function publishColor(pmoKey, prime) {
  if (prime) return PB_PRIME_COLOR;
  const k = SP.normKey(pmoKey), i = SP.PMO_ORDER.findIndex(n => SP.normKey(n) === k);
  if (i >= 0) return PB_PMO_COLORS[i % PB_PMO_COLORS.length];
  let h = 0;
  for (let j = 0; j < k.length; j++) h = (h * 31 + k.charCodeAt(j)) % 9973;
  return PB_OTHER_COLORS[h % PB_OTHER_COLORS.length];
};

// ---------------------------------------------------------------------------------------------------------------
// §33.1 THE UNFUNDED LIST. The UFR tracker is one workbook per fiscal year with a tab per appropriation (O&M, Full Fund,
// Initial Spares, OPN); every other tab (SUMMARY, VISUALS, MASTER...) is left alone. Read by its TITLES, never by position:
// the heading row is on row 8 of one tab and row 9 of the others, and O&M alone has ANG and AFRC columns.
//   -> { ok: true, fy, unit, name, tabs: [{ap, sheet, lines, cents}], lines: [...], notes: [text], ignored: [sheet names] }
//    | { ok: false, why }
//   a line: { ap, fy, sheet, row, rank, title, pmo, ccar, cents: [7], total, status, exec, sfcb }
// Amounts are in the unit the Total Amount heading names ($K on Brad's tracker), turned into whole cents.
// A file is taken whole or not at all: a tracker read with one tab missing would understate every Required on it.
// ---------------------------------------------------------------------------------------------------------------
const PB_UFR_TITLE = /FY\s*(\d{4})\s+UNFUNDED\s+REQUIREMENTS/i;
const PB_UFR_COLS = Object.freeze([['usaf', 0], ['ang', 1], ['afrc', 2], ['stovl', 3], ['usmc cv', 4], ['usn cv', 5]]);
function pb_hkey(v) { return pb_txt(v).toLowerCase(); }
function pb_ufrAp(sheetName, title) {
  const n = pb_hkey(sheetName), t = pb_hkey(title);
  if (n === 'o&m' || n === 'om') return 'om';
  if (n === 'full fund' || n === 'ff') return 'ff';
  if (n === 'initial spares' || n === 'spares') return 'sp';
  if (n === 'opn') return 'opn';
  if (/operations\s*&\s*maintenance|\(o&m\)/.test(t)) return 'om';
  if (/full fund/.test(t)) return 'ff';
  if (/initial spares/.test(t)) return 'sp';
  if (/\(opn\)|other procurement/.test(t)) return 'opn';
  return null;
}
// a cell -> whole cents of `unit` dollars; null when it holds something that is not an amount
function pb_ufrAmt(v, unit) {
  if (v === null || v === undefined || v === '') return 0;
  let n;
  if (typeof v === 'number') n = v;
  else {
    let t = String(v).trim().replace(/^−/, '-');
    if (t === '' || t === '-' || t === '–' || t === '—') return 0;
    let neg = false;
    if (/^\(.*\)$/.test(t)) { neg = true; t = t.slice(1, -1); }
    t = t.replace(/[$,\s]/g, '');
    if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return null;
    n = Number(t) * (neg ? -1 : 1);
  }
  if (!isFinite(n)) return null;
  const c = Math.round(Number((n * unit * 100).toPrecision(15)));
  return Number.isSafeInteger(c) ? (c === 0 ? 0 : c) : null;
}
function pb_usdText(c) { return SP.fmtUsd(c); }
SP.readUfr = function readUfr(wb, fileName) {
  const sheets = wb && Array.isArray(wb.sheets) ? wb.sheets : null;
  if (!sheets) return { ok: false, why: 'it is not a workbook this page can read' };
  const tabs = [], lines = [], notes = [], ignored = [];
  let fy = null, unitAll = null;
  for (const sh of sheets) {
    const rows = Array.isArray(sh.rows) ? sh.rows : [];
    const rno = i => (Array.isArray(sh.rowNo) && sh.rowNo[i]) || i + 1;
    // the title line: within the first six rows, a cell that says FY#### UNFUNDED REQUIREMENTS
    let title = '', tfy = null;
    for (let i = 0; i < Math.min(rows.length, 6) && tfy === null; i++) {
      for (const c of rows[i]) { const m = PB_UFR_TITLE.exec(pb_txt(c)); if (m) { tfy = Number(m[1]); title = pb_txt(c); break; } }
    }
    const ap = pb_ufrAp(sh.name, title);
    if (tfy === null || !ap) { ignored.push(String(sh.name)); continue; }
    // the heading row: the first, within thirty rows, that names both a Requirement Title and a CCaR Record
    let hi = -1;
    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      const ks = rows[i].map(pb_hkey);
      if (ks.includes('requirement title') && ks.includes('ccar record')) { hi = i; break; }
    }
    const where = 'the “' + sh.name + '” tab';
    if (hi < 0) return { ok: false, why: where + ' is titled as a UFR tracker but has no heading row naming Requirement Title and CCaR Record' };
    if (tabs.some(t => t.ap === ap)) return { ok: false, why: 'two tabs are for ' + pb_apLabel(ap) + ' (“' + tabs.find(t => t.ap === ap).sheet + '” and “' + sh.name + '”)' };
    if (fy !== null && tfy !== fy) return { ok: false, why: 'its tabs are for different fiscal years (FY' + fy + ' and FY' + tfy + '): load one tracker per fiscal year' };
    fy = tfy;
    const head = rows[hi].map(pb_hkey), col = {};
    head.forEach((k, i) => {
      const put = name => { if (col[name] === undefined) col[name] = i; };
      if (k === 'rank') put('rank');
      else if (k === 'requirement title') put('title');
      else if (k === 'pmo') put('pmo');
      else if (k === 'ccar record') put('ccar');
      else if (k.startsWith('total amount')) put('total');
      else if (k === 'funding status') put('status');
      else if (k.startsWith('exec ready')) put('exec');
      else if (k === 'sfcb action') put('sfcb');
      else for (const [h, si] of PB_UFR_COLS) if (k === h) put('s' + si);
    });
    const svcCols = PB_UFR_COLS.filter(([, si]) => col['s' + si] !== undefined);
    if (col.pmo === undefined) return { ok: false, why: where + ' has no PMO column' };
    if (!svcCols.length) return { ok: false, why: where + ' has no service column (USAF, ANG, AFRC, STOVL, USMC CV, USN CV)' };
    // the unit: what the Total Amount heading says, else what the rows above the headings say of their own figures
    const unitOf = s => /\(\s*\$\s*k\s*\)/i.test(s) ? 1000 : /\(\s*\$\s*m\s*\)/i.test(s) ? 1000000 : null;
    let unit = col.total !== undefined ? unitOf(pb_txt(rows[hi][col.total])) : null;
    for (let i = 0; i < hi && unit === null; i++) for (const c of rows[i]) { const u = unitOf(pb_txt(c)); if (u) { unit = u; break; } }
    if (unit === null) unit = 1;
    if (unitAll !== null && unit !== unitAll) return { ok: false, why: 'its tabs give their amounts in different units' };
    unitAll = unit;
    let n = 0, sum = 0, end = -1;
    for (let i = hi + 1; i < rows.length; i++) {
      const r = rows[i];
      if (r.slice(0, 4).some(c => /^totals?$/.test(pb_hkey(c)))) { end = i; break; }
      const cell = k => (col[k] === undefined ? '' : r[col[k]]);
      const title2 = pb_txt(cell('title')), ccar = pb_txt(cell('ccar'));
      const cents = pb_zeros();
      let bad = null, any = false;
      for (const [h, si] of svcCols) {
        const a = pb_ufrAmt(cell('s' + si), unit);
        if (a === null) { bad = bad || h.toUpperCase(); continue; }
        cents[si] = a; if (a !== 0) any = true;
      }
      const tot = col.total === undefined ? 0 : pb_ufrAmt(cell('total'), unit);
      if (tot === null) bad = bad || 'Total Amount';
      if (!title2 && !ccar && !any && !tot && !bad) continue;                       // an empty row of the table
      const at = sh.name + ' row ' + rno(i);
      if (bad) notes.push(at + ': the ' + bad + ' cell is not an amount; it is counted as $0.');
      let svcSum = 0;
      for (const c of cents) svcSum += c;
      if (svcSum === 0 && tot) {
        cents[PB_NSVC] = tot; svcSum = tot;
        notes.push(at + ': ' + pb_usdText(tot) + ' is in Total Amount with nothing under any service; it is shown as “' + PB_SVC_LABEL[PB_NSVC] + '”.');
      } else if (tot && tot !== svcSum) {
        notes.push(at + ': the services add to ' + pb_usdText(svcSum) + ', its Total Amount says ' + pb_usdText(tot) + '; the services are used.');
      }
      if (!ccar) notes.push(at + ' (“' + (title2 || 'no title') + '”) has no CCaR Record: it is listed by its title and cannot be matched to the spend plan.');
      lines.push({ ap, fy: tfy, sheet: String(sh.name), row: rno(i), rank: pb_txt(cell('rank')), title: title2, pmo: pb_txt(cell('pmo')), ccar,
        cents, total: svcSum, status: pb_txt(cell('status')), exec: pb_txt(cell('exec')), sfcb: pb_txt(cell('sfcb')) });
      n++; sum += svcSum;
    }
    if (end >= 0 && col.total !== undefined) {
      const t = pb_ufrAmt(rows[end][col.total], unit);
      if (t !== null && t !== 0 && t !== sum) notes.push(sh.name + ': its TOTALS row says ' + pb_usdText(t) + ', its lines add to ' + pb_usdText(sum) + '.');
    }
    tabs.push({ ap, sheet: String(sh.name), lines: n, cents: sum });
  }
  if (!tabs.length) return { ok: false, why: 'no tab in it is a UFR tracker tab (a title reading “FY#### UNFUNDED REQUIREMENTS (UFR) TRACKER” over an appropriation’s table)' };
  tabs.sort((a, b) => SP.APS.findIndex(x => x.id === a.ap) - SP.APS.findIndex(x => x.id === b.ap));
  return { ok: true, fy, unit: unitAll, name: String(fileName || ''), tabs, lines, notes, ignored };
};

// ---------------------------------------------------------------------------------------------------------------
// §33.2 THE DOCUMENTS' FIGURES.
//   M     a model built with every switch on
//   ufr   the saved unfunded lists, { '<fy>': {fy, lines, ...} }, or nothing
//   pub   { desc: { <CCaR number, normKey> : text } }
//   opts  { fys: [years] }  the fiscal years to publish; absent: every year the model or the unfunded lists hold
//   -> { fys, allFys, docs: [doc], records: [{key, ccar, title, desc, n}], flags: [text], ufrSkipped: [{fy, ap, n}] }
//   doc: { id, kind: 'ap'|'pmo', ap, pmoKey, label, code, file, stoplight: {rows, total, pmoRows},
//          sections: [{ap, apLabel, fy, total: Fig, groups: [{label, prime, records: [Rec]}], n}],
//          ufr: [line + {pmoLabel}], nRecords, missing: n }
//   Rec: { key, ccar, title, desc (the one typed, or ''), events: [its plan events' titles, in date order], dates: [text, each a month 'Dec-2025', in order, then 'No date'], svc: [Fig x 6 or 7], total: Fig, ufrOnly }
//   Fig: { required, approved, obligated, remaining, delta }   whole cents
// A record is a CCaR number inside an appropriation, a fiscal year and a PMO; under Prime Contracts in an appropriation's
// document it is the CCaR number over every PMO, as the Award calendar's one line is (§22).
// ---------------------------------------------------------------------------------------------------------------
function pb_fig(app, obl, ufr) { return { required: app + ufr, approved: app, obligated: obl, remaining: app - obl, delta: -ufr }; }
function pb_dateWords(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m && Number(m[2]) >= 1 && Number(m[2]) <= 12 ? Number(m[3]) + ' ' + SP.CAL_MONTHS[Number(m[2]) - 1] + ' ' + m[1] : '';
}
SP.publishDateWords = pb_dateWords;
// AN AWARD DATE IS ITS MONTH (Brad, 17 Nov 2026: "let's just do the format of mmm-yyyy. I'd like to leave out the actual day
// … this will help negate any issues with having multiple days within the month"). 'YYYY-MM' -> 'Dec-2025'; a record's plan
// events of one month are one entry.
function pb_monthWords(ym) {
  const m = /^(\d{4})-(\d{2})/.exec(String(ym || ''));
  return m && Number(m[2]) >= 1 && Number(m[2]) <= 12 ? SP.CAL_MONTHS[Number(m[2]) - 1] + '-' + m[1] : '';
}
function pb_fileSafe(s) { return String(s).replace(/[\\/:*?"<>|\u0000-\u001F]+/g, '-').replace(/\s+/g, ' ').trim(); }

SP.publishData = function publishData(M, ufr, pub, opts) {
  const special = new Set(Array.isArray(M.special) ? M.special : []);
  const NODATE = SP.COL_IDS.indexOf('nodate');
  const desc = pub && pub.desc && typeof pub.desc === 'object' ? pub.desc : {};
  const descOf = k => (k && Object.prototype.hasOwnProperty.call(desc, k) && typeof desc[k] === 'string' ? desc[k] : '');
  // the PMOs: the model's, in its order, then any the tool knows by name, so "AV" on the tracker is Air Vehicle (AV)
  const pmoLabel = new Map(), pmoOrder = [], byName = new Map();
  const addPmo = (key, label) => {
    if (!pmoLabel.has(key)) { pmoLabel.set(key, label); pmoOrder.push(key); }
    if (!byName.has(SP.normKey(label))) byName.set(SP.normKey(label), key);
    const code = SP.normKey(SP.pmoCode(label));
    if (code && !byName.has(code)) byName.set(code, key);
  };
  for (const p of M.pmos || []) addPmo(p.key, p.label);
  for (const name of SP.PMO_ORDER) addPmo(SP.normKey(name), name);
  const leftOut = new Set(typeof SP.leftOutOf === 'function' ? SP.leftOutOf(opts && opts.settings) : []);
  const ufrLines = [];
  for (const k of Object.keys(ufr && typeof ufr === 'object' ? ufr : {}).sort()) {
    const f = ufr[k];
    if (f && Array.isArray(f.lines)) for (const l of f.lines) ufrLines.push(l);
  }
  const allFys = [...new Set((M.blocks || []).map(b => b.fy).concat(ufrLines.filter(l => l.fy >= M.firstFY).map(l => l.fy)))].sort((a, b) => a - b);
  const want = opts && Array.isArray(opts.fys) ? new Set(opts.fys.map(Number)) : null;
  const fys = allFys.filter(y => !want || want.has(y));
  const fySet = new Set(fys);

  // every counted row into its atom: appropriation, fiscal year, PMO, CCaR number (a row with no number goes by its title)
  const atoms = new Map();
  const atom = (ap, fy, pmoKey, ccarKey, titleKey) => {
    const rk = ccarKey !== '' ? ccarKey : '\u0001' + titleKey;
    const k = ap + '|' + fy + '|' + pmoKey + '|' + rk;
    let a = atoms.get(k);
    if (!a) atoms.set(k, (a = { k, ap, fy, pmoKey, rk, ccarKey, title: new Map(), ccar: new Map(), app: pb_zeros(), obl: pb_zeros(), ufr: pb_zeros(),
      dates: new Set(), nodate: false, rows: 0, pes: new Map(), ufrLines: [], ufrTitle: '', ufrCcar: '' }));
    return a;
  };
  for (const b of M.blocks || []) {
    if (!fySet.has(b.fy)) continue;
    for (const r of b.rows || []) {
      const d = r.d, a = atom(b.ap, b.fy, d.k.pmo, d.k.ccar, d.k.title);
      pb_tally(a.title, pb_txt(d.title)); pb_tally(a.ccar, pb_txt(d.ccar));
      let si = SP.SERVICES.indexOf(d.svc);
      if (si < 0) si = PB_NSVC;
      a.app[si] += r.cents;
      if (d.status === 'exec') a.obl[si] += r.cents;
      if (r.col !== NODATE && typeof d.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d.date)) a.dates.add(d.date.slice(0, 7));
      else a.nodate = true;
      // its plan events, each with its spellings and its earliest date: the description a record prints by default (§33.10)
      { let e = a.pes.get(d.k.pe); if (!e) a.pes.set(d.k.pe, (e = { sp: new Map(), first: '' }));
        pb_tally(e.sp, pb_txt(d.pe));
        const dt = r.col !== NODATE && typeof d.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d.date) ? d.date.slice(0, 10) : '';
        if (dt && (e.first === '' || dt < e.first)) e.first = dt; }
      a.rows++;
    }
  }
  // the PMO each CCaR number sits under in the plan, per appropriation: what a line with an unknown PMO is placed by
  const planPmo = new Map();
  for (const a of atoms.values()) {
    if (a.ccarKey === '') continue;
    const k = a.ap + '|' + a.ccarKey;
    if (!planPmo.has(k)) planPmo.set(k, new Set());
    planPmo.get(k).add(a.pmoKey);
  }
  const flags = [], skipped = new Map(), ufrKept = [];
  for (const l of ufrLines) {
    if (l.fy < M.firstFY || leftOut.has(l.ap + '|' + l.fy) || !fySet.has(l.fy)) {
      if (l.fy < M.firstFY || leftOut.has(l.ap + '|' + l.fy)) {
        const k = l.ap + '|' + l.fy;
        skipped.set(k, (skipped.get(k) || 0) + 1);
      }
      continue;
    }
    const ccarKey = SP.normKey(l.ccar), where = pb_apLabel(l.ap) + ' FY' + l.fy + ' “' + (l.title || '(no title)') + '”' + (l.ccar ? ' (CCaR ' + l.ccar + ')' : '');
    const inPlan = planPmo.get(l.ap + '|' + ccarKey);
    let pk = byName.get(SP.normKey(l.pmo));
    if (pk === undefined && l.pmo) { const c = SP.normKey(SP.pmoCode(l.pmo)); if (c && byName.has(c)) pk = byName.get(c); }
    if (pk === undefined) {
      if (inPlan && inPlan.size === 1) {
        pk = [...inPlan][0];
        flags.push(where + ': its PMO “' + l.pmo + '” is not one APEX knows; it is placed under ' + pmoLabel.get(pk) + ', where the spend plan has that CCaR record.');
      } else {
        pk = SP.normKey(l.pmo);
        addPmo(pk, l.pmo || '(no PMO)');
        flags.push(where + ': its PMO “' + (l.pmo || '') + '” is not one APEX knows; it is listed under that name.');
      }
    } else if (inPlan && !inPlan.has(pk)) {
      flags.push(where + ': the unfunded list says ' + pmoLabel.get(pk) + ', the spend plan has that CCaR record under '
        + [...inPlan].map(x => pmoLabel.get(x)).join(' and ') + '; the unfunded amount is placed under ' + pmoLabel.get(pk) + '.');
    }
    const a = atom(l.ap, l.fy, pk, ccarKey, SP.normKey(l.title));
    for (let i = 0; i <= PB_NSVC; i++) a.ufr[i] += l.cents[i] || 0;
    if (!a.ufrTitle) { a.ufrTitle = l.title; a.ufrCcar = l.ccar; }
    const line = Object.assign({}, l, { pmoKey: pk, pmoLabel: pmoLabel.get(pk) });
    a.ufrLines.push(line); ufrKept.push(line);
    if (!a.rows && !a.flagged) { a.flagged = true; flags.push(where + ': no plan event in the spend plan carries that CCaR record; it is shown with Approved $0.'); }
  }
  const ufrSkipped = [...skipped].map(([k, n]) => { const i = k.indexOf('|'); return { ap: k.slice(0, i), fy: Number(k.slice(i + 1)), n }; });

  // records out of atoms. `merge` joins atoms of several PMOs (a prime in an appropriation's document)
  const record = list => {
    const title = new Map(), ccar = new Map(), dates = new Set(), app = pb_zeros(), obl = pb_zeros(), uf = pb_zeros(), pes = new Map();
    let nodate = false, rows = 0, ufrTitle = '', ufrCcar = '';
    for (const a of list) {
      for (const [s, c] of a.title) title.set(s, (title.get(s) || 0) + c);
      for (const [s, c] of a.ccar) ccar.set(s, (ccar.get(s) || 0) + c);
      for (const d of a.dates) dates.add(d);
      for (const [k, e] of a.pes) {
        let q = pes.get(k); if (!q) pes.set(k, (q = { sp: new Map(), first: '' }));
        for (const [sp, c] of e.sp) q.sp.set(sp, (q.sp.get(sp) || 0) + c);
        if (e.first && (q.first === '' || e.first < q.first)) q.first = e.first;
      }
      for (let i = 0; i <= PB_NSVC; i++) { app[i] += a.app[i]; obl[i] += a.obl[i]; uf[i] += a.ufr[i]; }
      nodate = nodate || a.nodate; rows += a.rows;
      if (!ufrTitle) { ufrTitle = a.ufrTitle; ufrCcar = a.ufrCcar; }
    }
    const unknown = app[PB_NSVC] !== 0 || obl[PB_NSVC] !== 0 || uf[PB_NSVC] !== 0;
    const n = unknown ? PB_NSVC + 1 : PB_NSVC, svc = [];
    let A = 0, O = 0, U = 0;
    for (let i = 0; i < n; i++) { svc.push(pb_fig(app[i], obl[i], uf[i])); A += app[i]; O += obl[i]; U += uf[i]; }
    const ck = list[0].ccarKey;
    const dl = [...dates].sort().map(pb_monthWords);
    if (nodate && rows) dl.push('No date');
    // the plan events' titles, in the order they fall (the earliest date of each; one with no date last), then by name
    const events = [...pes.values()].map(e => ({ name: pb_major(e.sp, '(no plan event)'), first: e.first }))
      .sort((x, y) => (x.first === '') - (y.first === '') || pb_cmp(x.first, y.first) || pb_cmp(SP.normKey(x.name), SP.normKey(y.name))).map(e => e.name);
    return { key: ck, ccar: pb_major(ccar, ufrCcar || ''), title: pb_major(title, ufrTitle || '(no title)'), desc: descOf(ck), events, dates: dl,
      svc, total: pb_fig(A, O, U), ufrOnly: rows === 0, special: special.has(ck) && ck !== '' };
  };
  const recSort = (x, y) => pb_cmp(SP.normKey(x.title), SP.normKey(y.title)) || pb_cmp(x.key, y.key);
  const sumFig = recs => {
    const n = recs.some(r => r.svc.length > PB_NSVC) ? PB_NSVC + 1 : PB_NSVC, svc = [];
    for (let i = 0; i < n; i++) svc.push(pb_fig(0, 0, 0));
    const tot = pb_fig(0, 0, 0), add = (t, f) => { for (const k of ['required', 'approved', 'obligated', 'remaining', 'delta']) t[k] += f[k]; };
    for (const r of recs) { r.svc.forEach((f, i) => add(svc[i], f)); add(tot, r.total); }
    return { svc, total: tot };
  };
  // one section: the atoms of an appropriation and fiscal year, either every PMO's (pmoKey null) or one PMO's
  const section = (ap, fy, pmoKey) => {
    const mine = [...atoms.values()].filter(a => a.ap === ap && a.fy === fy && (pmoKey === null || a.pmoKey === pmoKey));
    if (!mine.length) return null;
    const groups = [];
    const primes = new Map();
    for (const a of mine) if (a.ccarKey !== '' && special.has(a.ccarKey)) { if (!primes.has(a.ccarKey)) primes.set(a.ccarKey, []); primes.get(a.ccarKey).push(a); }
    if (primes.size) groups.push({ label: PB_PRIME, prime: true, color: SP.publishColor('', true), records: [...primes.values()].map(record).sort(recSort) });
    for (const pk of pmoOrder) {
      const rest = mine.filter(a => a.pmoKey === pk && !(a.ccarKey !== '' && special.has(a.ccarKey)));
      if (rest.length) groups.push({ label: pmoLabel.get(pk), prime: false, pmoKey: pk, color: SP.publishColor(pk, false), records: rest.map(a => record([a])).sort(recSort) });
    }
    const all = groups.flatMap(g => g.records), s = sumFig(all);
    return { ap, apLabel: pb_apLabel(ap), fy, groups, total: s.total, svc: s.svc, n: all.length };
  };
  const ufrSort = (x, y) => SP.APS.findIndex(a => a.id === x.ap) - SP.APS.findIndex(a => a.id === y.ap) || x.fy - y.fy
    || (Number(x.rank) || 1e9) - (Number(y.rank) || 1e9) || pb_cmp(SP.normKey(x.title), SP.normKey(y.title)) || x.row - y.row;
  const stopTotal = rows => {
    const t = { approved: 0, authorized: 0, obligated: 0, unobligated: 0 };
    for (const r of rows) { t.approved += r.approved; t.authorized += r.authorized; t.obligated += r.obligated; t.unobligated += r.unobligated; }
    t.oblPct = t.approved !== 0 ? t.obligated / t.approved : null;
    return t;
  };
  const docs = [], names = new Set();
  const finish = d => {
    d.nRecords = d.sections.reduce((n, s) => n + s.n, 0);
    const seen = new Set(); let missing = 0;
    for (const s of d.sections) for (const g of s.groups) for (const r of g.records) {
      if (r.key === '' || seen.has(r.key)) continue;
      seen.add(r.key); if (!r.desc) missing++;
    }
    d.missing = missing; d.nDesc = seen.size;
    let f = pb_fileSafe(d.file), i = 2;
    while (names.has(f.toLowerCase())) f = pb_fileSafe(d.file) + ' (' + (i++) + ')';
    names.add(f.toLowerCase()); d.file = f + '.pdf';
    if (d.sections.length) docs.push(d);
  };
  for (const a of SP.APS) {
    const sections = fys.map(fy => section(a.id, fy, null)).filter(Boolean);
    const blocks = ((M.aps || []).find(x => x.ap === a.id) || { blocks: [] }).blocks.filter(b => fySet.has(b.fy));
    const pmoRows = [];
    for (const p of M.pmos || []) for (const r of p.rows) if (r.ap === a.id && fySet.has(r.fy)) pmoRows.push(Object.assign({ pmoLabel: p.label }, r));
    finish({ id: 'ap:' + a.id, kind: 'ap', ap: a.id, pmoKey: null, label: a.label, long: PB_AP_LONG[a.id] || a.label, code: a.label, file: 'APEX Spend Plan - ' + a.label,
      sections, stoplight: { rows: blocks, total: stopTotal(blocks), pmoRows },
      ufr: ufrKept.filter(l => l.ap === a.id).sort(ufrSort) });
  }
  for (const pk of pmoOrder) {
    const sections = [];
    for (const a of SP.APS) for (const fy of fys) { const s = section(a.id, fy, pk); if (s) sections.push(s); }
    if (!sections.length) continue;
    const p = (M.pmos || []).find(x => x.key === pk);
    const rows = p ? p.rows.filter(r => fySet.has(r.fy)).slice().sort((x, y) => SP.APS.findIndex(a => a.id === x.ap) - SP.APS.findIndex(a => a.id === y.ap) || x.fy - y.fy) : [];
    const label = pmoLabel.get(pk), code = SP.pmoCode(label);
    finish({ id: 'pmo:' + pk, kind: 'pmo', ap: null, pmoKey: pk, label, long: label, code, file: 'APEX Spend Plan - PMO ' + (code || label),
      sections, stoplight: { rows, total: stopTotal(rows), pmoRows: [] },
      ufr: ufrKept.filter(l => l.pmoKey === pk).sort(ufrSort) });
  }
  // every CCaR record published, once, for the Descriptions list: by title, then number
  const recs = new Map();
  for (const d of docs) if (d.kind === 'ap') for (const s of d.sections) for (const g of s.groups) for (const r of g.records) {
    if (r.key === '') continue;
    const q = recs.get(r.key);
    if (!q) recs.set(r.key, { key: r.key, ccar: r.ccar, title: r.title, desc: r.desc, n: 1 }); else q.n++;
  }
  const records = [...recs.values()].sort((x, y) => pb_cmp(SP.normKey(x.title), SP.normKey(y.title)) || pb_cmp(x.key, y.key));
  return { fys, allFys, docs, records, flags, ufrSkipped, ufrLines: ufrKept.length };
};

// ---------------------------------------------------------------------------------------------------------------
// §33.4 THE PAGES. Letter, landscape, in points. Every page carries the CUI marking top and bottom, the document's name
// and "Page n of N". A record's block of service rows is never split across pages.
//   ctx: { program, fm: {om, ff, sp, opn: each appropriation's FM Lead}, asOfLabel, today ('YYYY-MM-DD'), uploaded (text), emblem (Uint8Array of a JPEG, or null),
//          bae (a BAE report is loaded), marks: {text for each mark printed}, ufrFiles: [{fy, name, day}] }
// Whole dollars, as the template prints them: each figure is rounded from its own exact cents, a total from its exact
// sum, so a total can differ by a dollar from the rounded figures above it. The stoplight page says so.
// ---------------------------------------------------------------------------------------------------------------
// THE PAGE IS USED TO ITS EDGES (Brad, 17 Nov 2026: "I want to maximize the landscape of each PDF"): a quarter-inch margin
// left and right, which is as close as an office printer prints, and the body runs down to the CUI line.
const PB = Object.freeze({ W: 792, H: 612, L: 18, R: 774, bodyEnd: 592, rowH: 9.5,
  band: '#8EAADB', deep: '#2A5BA8', rule: '#555555', soft: '#EEF1F5', head: '#CBD9E8', red: '#B00000', ink: '#000000', mut: '#444444',
  status: Object.freeze({ green: '#00B050', yellow: '#FFD700', red: '#C00000' }),
  statusInk: Object.freeze({ green: '#FFFFFF', yellow: '#000000', red: '#FFFFFF' }) });
// whole dollars: 123456789 cents -> '1,234,568'; negative in parentheses; zero '-'
SP.fmtWhole = function fmtWhole(cents) {
  if (typeof cents !== 'number' || !isFinite(cents)) return '';
  const d = Math.round(Math.abs(cents) / 100);
  if (d === 0) return '-';
  const s = String(d).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return cents < 0 ? '(' + s + ')' : s;
};
// a colour between two, t from 0 (the first) to 1 (the second)
function pb_mix(a, b, t) {
  const h = (c, i) => parseInt(c.slice(1 + i * 2, 3 + i * 2), 16);
  return '#' + [0, 1, 2].map(i => Math.round(h(a, i) + (h(b, i) - h(a, i)) * t).toString(16).padStart(2, '0')).join('').toUpperCase();
}
function pb_isoWords(iso) { return pb_dateWords(iso) || String(iso || ''); }

// the plan event titles as a record's list prints them: where EVERY title begins with the same short tag and a dash
// ("OGC - CAD/PAD Shipping", "OGC - CAD/PAD Seat Cartridges"), the tag is left off each. One title that differs, or a
// title that is nothing but the tag, and they are printed as they are.
SP.publishEventNames = function publishEventNames(events) {
  const list = (events || []).map(e => String(e));
  const tag = e => { const m = /^\s*([A-Za-z0-9&/]{1,10})\s+-\s+(\S.*)$/.exec(e); return m ? [m[1].toLowerCase(), m[2].trim()] : null; };
  const t = list.map(tag);
  if (!list.length || t.some(x => !x) || t.some(x => x[0] !== t[0][0])) return list;
  return t.map(x => x[1]);
};
SP.publishPages = function publishPages(doc, ctx) {
  const C = ctx || {};
  const pages = [];
  let pg = null, y = 0;
  const T = (x, yy, s, o) => pg.ops.push(Object.assign({ t: 'text', x, y: yy, s: String(s) }, o || {}));
  const Rc = (x, yy, w, h, o) => pg.ops.push(Object.assign({ t: 'rect', x, y: yy, w, h }, o || {}));
  const Ln = (x1, y1, x2, y2, o) => pg.ops.push(Object.assign({ t: 'line', x1, y1, x2, y2, stroke: PB.rule, lw: 0.4 }, o || {}));
  const newPage = () => { pg = { w: PB.W, h: PB.H, ops: [] }; pages.push(pg); y = 24; };
  const fyy = fy => 'FY' + String(fy % 100).padStart(2, '0');
  const prog = pb_txt(C.program);
  const docLine = doc.kind === 'ap' ? doc.long : doc.label;
  // THE FM LEAD IS THE APPROPRIATION'S (Brad, 18 Nov 2026: "let's switch to Appropriation FM Lead. I have a different name for
  // each Appropriation, so I need to input four names. I don't need the extra BFM input"). A page about one appropriation
  // names that appropriation's FM Lead; a PMO's stoplight page, which covers several, names each of theirs.
  const fmOf = ap => pb_txt(C.fm && typeof C.fm === 'object' ? C.fm[ap] : '');
  const whoOf = aps => { const one = aps.length === 1; return aps.filter(ap => fmOf(ap)).map(ap => (one ? pb_apLabel(ap) + ' FM Lead: ' : pb_apLabel(ap) + ': ') + fmOf(ap)); };
  const whoText = aps => { const w = whoOf(aps); return !w.length ? '' : aps.length === 1 ? w[0] : 'FM Leads: ' + w.join(' | '); };
  const asOf = ['Data as of: ' + pb_isoWords(C.today), C.asOfLabel ? 'Data through ' + C.asOfLabel : ''].filter(Boolean).join('  |  ');

  // on a page with no full header (a continued page, the unfunded list) the emblem is small, at the top left, and the
  // page's heading starts to its right: "the top left of every spend plan" is every page of it
  const emblemAt = (x, yy, box) => {
    const info = SP.jpegInfo(C.emblem) || { w: 1, h: 1 }, k = Math.min(box / info.w, box / info.h);
    pg.ops.push({ t: 'img', name: 'emblem', x: x + (box - info.w * k) / 2, y: yy + (box - info.h * k) / 2, w: info.w * k, h: info.h * k });
  };
  const mini = () => { if (!C.emblem) return PB.L; emblemAt(PB.L, 21, 20); return PB.L + 25; };
  // the full header: emblem, two title lines, the band, who and when. `right` is where the title area ends
  const header = (line1, line2, bandText, right, who) => {
    const hasEmb = !!C.emblem;
    const xl = hasEmb ? PB.L + 62 : PB.L, cx = (xl + right) / 2;
    T(cx, 37, line1, { size: 12, bold: true, align: 'c' });
    T(cx, 51, line2, { size: 12, bold: true, align: 'c' });
    if (hasEmb) {
      // THE EMBLEM SITS IN THE BAND, not beside it (Brad, 17 Nov 2026: "make it fit seamlessly so that it doesn't stick out like
      // a sore thumb with color fading"). The band runs out from behind the emblem, starting in the emblem's own blue and
      // fading into the band's colour over its first 150 points, so the two read as one piece. The fade is thin strips, each
      // lapping the next by half a point: two that only touch show a hairline between them in some readers.
      const x0 = PB.L + 27, fade = 150, n = 30, w = fade / n;
      for (let i = 0; i < n; i++) Rc(x0 + i * w, 57, w + 0.5, 12, { fill: pb_mix(PB.deep, PB.band, i / (n - 1)) });
      Rc(x0 + fade, 57, right - x0 - fade, 12, { fill: PB.band });
      emblemAt(PB.L, 24, 54);
    } else Rc(xl, 57, right - xl, 12, { fill: PB.band });
    T(cx, 66, bandText, { size: 8.5, bold: true, align: 'c' });
    if (who) T(xl, 79, who, { size: 7 });
    T(xl, who ? 88 : 79, asOf, { size: 7 });
    y = 98;
  };
  const money = (x, w, yy, cents, o) => {
    const s = SP.fmtWhole(cents), col = o && o.red && cents < 0 ? PB.red : PB.ink, size = (o && o.size) || 6.5, bold = !!(o && o.bold);
    if (s !== '-' && !(o && o.bare)) T(x + 2.5, yy, '$', { size, bold, color: col });
    T(x + w - 2.5, yy, s, { size, bold, color: col, align: 'r' });
  };
  const FIGS = ['required', 'approved', 'obligated', 'remaining', 'delta'];
  const FIG_HEAD = ['Required', 'Approved', 'Obligated', 'Remaining', 'Delta (+/-)'];

  // ---- the stoplight page ----
  newPage();
  header((prog ? prog + ' - ' : '') + 'Spend Plan', docLine, 'Execution status' + (doc.sections.length ? ' - ' + [...new Set(doc.sections.map(s => 'FY' + s.fy))].join(', ') : ''), PB.R,
    whoText(doc.kind === 'ap' ? [doc.ap] : SP.APS.map(a => a.id).filter(ap => doc.sections.some(x => x.ap === ap))));
  const need = h => { if (y + h > PB.bodyEnd) { newPage(); T(mini(), 36, docLine + ' - execution status (continued)', { size: 9, bold: true }); y = 46; } };
  const stopTable = (title, cols, rows) => {
    need(30);
    T(PB.L, y + 8, title, { size: 8, bold: true }); y += 12;
    const headRow = () => {
      let x = PB.L;
      for (const c of cols) { Rc(x, y, c.w, 12, { fill: PB.head, stroke: PB.rule, lw: 0.4 }); T(x + c.w / 2, y + 8.5, c.h, { size: 7, bold: true, align: 'c' }); x += c.w; }
      y += 12;
    };
    headRow();
    for (const r of rows) {
      if (y + 11 > PB.bodyEnd) { need(1e9); headRow(); }
      let x = PB.L;
      for (const c of cols) {
        const v = c.v(r);
        if (c.status) {
          const st = r.status;
          Rc(x, y, c.w, 11, { fill: st && PB.status[st] ? PB.status[st] : (r.total ? PB.soft : null), stroke: PB.rule, lw: 0.4 });
          if (st && PB.status[st]) T(x + c.w / 2, y + 8, SP.statusWord(st), { size: 7, bold: true, align: 'c', color: PB.statusInk[st] });
        } else {
          Rc(x, y, c.w, 11, { fill: r.total ? PB.soft : null, stroke: PB.rule, lw: 0.4 });
          if (c.left) T(x + 4, y + 8, v, { size: 7, bold: true }); else T(x + c.w - 4, y + 8, v, { size: 7, bold: !!r.total, align: 'r' });
        }
        x += c.w;
      }
      y += 11;
    }
    y += 10;
  };
  const marks = new Set();
  const mApp = r => { const m = r.total ? '' : SP.approvedMark(r, C.model); if (m) marks.add(m); return SP.fmtM(r.approved) + m; };
  const mAuth = r => { const m = r.total ? '' : SP.authMark(r, C.model); if (m) marks.add(m); return SP.fmtM(r.authorized) + m; };
  const figCols = [
    { h: 'Approved ($M)', w: 78, v: mApp }, { h: 'Authorized ($M)', w: 78, v: mAuth }, { h: 'Obligated ($M)', w: 78, v: r => SP.fmtM(r.obligated) },
    { h: 'Unobligated ($M)', w: 82, v: r => SP.fmtM(r.unobligated) }, { h: 'Obl %', w: 56, v: r => (r.oblPct === null || r.oblPct === undefined ? '' : SP.fmtPct(r.oblPct)) },
    { h: 'OSD Goal %', w: 60, v: r => (r.total || r.goal === null || r.goal === undefined ? '' : SP.fmtPct(r.goal)) },
    { h: 'Delta (pp)', w: 56, v: r => (r.total || r.delta === null || r.delta === undefined ? '' : SP.fmtDelta(r.delta)) },
    { h: 'Status', w: 64, status: true, v: () => '' }];
  const S = doc.stoplight;
  const totalRow = Object.assign({ total: true, fyText: 'Total', apLabel: 'Total', pmoLabel: 'Total' }, S.total);
  if (!S.rows.length) { T(PB.L, y + 8, 'No plan event in the spend plan is under this ' + (doc.kind === 'pmo' ? 'PMO' : 'appropriation') + ': there is no execution status to show.', { size: 8 }); y += 20; }
  else if (doc.kind === 'ap') {
    stopTable(doc.label + ' by fiscal year', [{ h: 'FY', w: 60, left: true, v: r => (r.total ? 'Total' : 'FY' + r.fy) }].concat(figCols), S.rows.concat([totalRow]));
    if (S.pmoRows.length) stopTable('Each PMO in ' + doc.label, [{ h: 'PMO', w: 170, left: true, v: r => r.pmoLabel }, { h: 'FY', w: 40, left: true, v: r => 'FY' + r.fy }]
      .concat(figCols.filter(c => c.h !== 'Authorized ($M)' && c.h !== 'Unobligated ($M)')), S.pmoRows);
  } else {
    stopTable(doc.label + ' by appropriation and fiscal year', [{ h: 'Appropriation', w: 90, left: true, v: r => (r.total ? 'Total' : r.apLabel) },
      { h: 'FY', w: 40, left: true, v: r => (r.total ? '' : 'FY' + r.fy) }].concat(figCols), S.rows.concat([totalRow]));
  }
  const noteLines = [];
  noteLines.push(SP.STATUS_LEGEND_TEXT);
  for (const m of ['†', '‡', '§']) if (marks.has(m)) noteLines.push(m + ' ' + SP.markText(m, C.model));
  if (C.bae) noteLines.push('On this page Approved and Authorized are the BAE report’s where it covers a block, as on the APEX Summary. The spend plan pages list the CCaR plan events.');
  if (C.uploaded) noteLines.push(C.uploaded);
  noteLines.push('How to read the spend plan pages: Approved is the CCaR amount in the record’s plan events; Obligated is what CCaR marks Actual Execution; '
    + 'Remaining = Approved - Obligated; Required = Approved + the unfunded list’s amount for that CCaR record; Delta = Approved - Required.');
  noteLines.push('Figures on the spend plan pages are whole dollars, each rounded from its exact cents, so a total can differ by a dollar from the figures above it.');
  noteLines.push((C.ufrFiles && C.ufrFiles.length ? 'Unfunded list: ' + C.ufrFiles.map(f => 'FY' + f.fy + ' loaded ' + pb_isoWords(f.day) + (f.name ? ' (' + f.name + ')' : '')).join('; ') + '.'
    : 'No unfunded list is loaded: Required equals Approved on every line.'));
  for (const n of noteLines) for (const l of SP.pdfWrap(n, 7, false, PB.R - PB.L)) { need(10); T(PB.L, y + 7, l, { size: 7, color: PB.mut }); y += 9; }

  // ---- the spend plan sections ----
  const X = [18, 76, 204, 338, 424, 484, 542, 600, 658, 716, 774];
  const colHead = () => {
    const hs = [doc.kind === 'ap' ? 'PMO' : 'Group', 'Requirement Title', 'Description', 'Award Date', 'Service'].concat(FIG_HEAD);
    hs.forEach((h, i) => T((X[i] + X[i + 1]) / 2, y + 8.5, h, { size: 7, bold: true, align: 'c' }));
    Ln(PB.L, y + 12, PB.R, y + 12, { stroke: PB.ink, lw: 0.8 });
    y += 13;
  };
  const dateH = 7.4;
  for (const sec of doc.sections) {
    const line1 = (prog ? prog + ' - ' : '') + fyy(sec.fy) + ' Spend Plan';
    const line2 = doc.kind === 'ap' ? doc.long : doc.label + ' - ' + (PB_AP_LONG[sec.ap] || sec.apLabel);
    // EVERY PAGE OF A SECTION CARRIES ITS FULL HEADER AND ITS COLUMN HEADINGS (Brad, 17 Nov 2026: "I always need the header at
    // the top that has the summary information to be there. I also need the header labels to stay static"): the emblem,
    // the titles, the band, who and when, the section's totals by service at the top right, then the column headings. A
    // page after the first says "(continued)" in its band.
    const tx = 450, lw = 54, cw = 54, nS = sec.svc.length, rh = 8.6;
    const band = doc.kind === 'ap' ? 'Consolidated Sustainment Spend Plan' : 'PMO Spend Plan - ' + sec.apLabel + ' FY' + sec.fy;
    const top = contd => {
      newPage();
      FIG_HEAD.forEach((h, i) => T(tx + lw + cw * i + cw / 2, 31, h, { size: 6.5, bold: true, align: 'c' }));
      for (let i = 0; i <= nS; i++) {
        const tot = i === nS, f = tot ? sec.total : sec.svc[i], yy = 34 + rh * i;
        Rc(tx, yy, lw, rh, { fill: tot ? PB.soft : null, stroke: PB.rule, lw: 0.4 });
        T(tx + lw / 2, yy + 6.4, tot ? 'TOTAL' : PB_SVC_LABEL[i], { size: i === PB_NSVC ? 5.2 : 6.3, bold: tot, align: 'c' });
        FIGS.forEach((k, j) => { Rc(tx + lw + cw * j, yy, cw, rh, { fill: tot ? PB.soft : null, stroke: PB.rule, lw: 0.4 }); money(tx + lw + cw * j, cw, yy + 6.4, f[k], { red: k === 'delta', bold: tot, size: 6.3 }); });
      }
      header(line1, line2, band + (contd ? ' (continued)' : ''), tx - 8, whoText([sec.ap]));
      y = Math.max(y, 34 + rh * (nS + 1) + 6);
      colHead();
    };
    // A BREAK PAGE OPENS EACH SECTION (Brad, 18 Nov 2026: "Let's add a break page in between appropriations and/or fiscal years
    // in the pdf"). A page of its own that says which appropriation and fiscal year the pages after it are, with the
    // section's size and totals, so a reader leafing through a printed plan sees where one ends and the next begins.
    {
      newPage(); pg.kind = 'break';
      const cx = PB.W / 2;
      if (C.emblem) emblemAt(cx - 60, 136, 120);
      const y0 = C.emblem ? 290 : 230;
      if (prog) T(cx, y0, prog, { size: 16, bold: true, align: 'c', color: PB.mut });
      T(cx, y0 + 40, 'FY' + sec.fy + ' Spend Plan', { size: 34, bold: true, align: 'c' });
      const bw = 520, bx = cx - bw / 2, n = 40, w = bw / 2 / n;
      // the band, fading in from both ends to the emblem's blue at the middle
      for (let i = 0; i < n; i++) { const c = pb_mix(PB.band, PB.deep, i / (n - 1)); Rc(bx + i * w, y0 + 56, w + 0.5, 30, { fill: c }); Rc(bx + bw - (i + 1) * w - 0.5, y0 + 56, w + 0.5, 30, { fill: c }); }
      T(cx, y0 + 78, PB_AP_LONG[sec.ap] || sec.apLabel, { size: 20, bold: true, align: 'c', color: '#FFFFFF' });
      if (doc.kind === 'pmo') T(cx, y0 + 108, doc.label, { size: 15, bold: true, align: 'c' });
      const yy = y0 + (doc.kind === 'pmo' ? 132 : 112);
      const w1 = whoText([sec.ap]);
      if (w1) T(cx, yy, w1, { size: 10, align: 'c' });
      T(cx, yy + (w1 ? 16 : 0), SP.fmtInt(sec.n) + ' requirement' + (sec.n === 1 ? '' : 's') + '   |   Required $' + SP.fmtWhole(sec.total.required).replace(/^-$/, '0') + '   |   Approved $' + SP.fmtWhole(sec.total.approved).replace(/^-$/, '0')
        + '   |   Obligated $' + SP.fmtWhole(sec.total.obligated).replace(/^-$/, '0'), { size: 9, align: 'c', color: PB.mut });
      T(cx, yy + (w1 ? 30 : 14), asOf, { size: 8, align: 'c', color: PB.mut });
    }
    top(false);
    const cont = () => top(true);
    let run = null;                          // the group band being drawn on this page: {label, y0}
    const closeRun = () => {
      if (!run) return;
      const h = y - run.y0;
      Rc(X[0], run.y0, X[1] - X[0], h, { fill: run.color || PB.band, stroke: PB.rule, lw: 0.4 });
      const ls = SP.pdfWrap(run.label, 7, true, X[1] - X[0] - 6, Math.max(1, Math.floor((h - 4) / 8.2)));
      ls.forEach((l, i) => T((X[0] + X[1]) / 2, run.y0 + h / 2 - (ls.length * 8.2) / 2 + 6.4 + i * 8.2, l, { size: 7, bold: true, align: 'c' }));
      run = null;
    };
    let dividerDone = false;
    for (const g of sec.groups) {
      if (!g.prime && !dividerDone && sec.groups.some(q => q.prime)) {
        dividerDone = true;
        if (y + 13 + 70 > PB.bodyEnd) cont();
        T(PB.L, y + 9, 'All Other ' + sec.apLabel + ' Contracts' + (doc.kind === 'ap' ? ' - separated by PMO' : ''), { size: 7.5, bold: true });
        y += 13;
      }
      for (const r of g.records) {
        const nRows = r.svc.length + 1;
        // A RECORD'S BLOCK IS ITS ROWS AND NO TALLER (Brad, 18 Nov 2026: "I don't want the Total row to be extended"; then, of rows
        // made to share a taller block, "Don't adjust the row heights"). Every row is PB.rowH, so the block is its service
        // rows and its Total. What sits beside them is cut to fit that height, and says so: the award months past what two
        // columns hold end "+N more", and so does the plan-event list.
        const h = nRows * PB.rowH;
        const dateFit = 2 * Math.max(1, Math.floor((h - 5) / dateH));
        const shown = r.dates.length > dateFit ? r.dates.slice(0, dateFit - 1).concat(['+' + (r.dates.length - dateFit + 1) + ' more']) : r.dates;
        // THE DESCRIPTION (§33.10). Unless one was typed:
        //   - a prime contract's is its Requirement Title (Brad, 18 Nov 2026, of a prime listing sixty CLIN-level plan events:
        //     "My prime contracts are too wordy with all the CLIN information in there. Let's just carry the Requirement
        //     Title over for those");
        //   - any other record's is its plan event titles, as a bulleted list in the order they fall ("let's default to the
        //     Plan Event Title and have them listed"; then, of the first layout, "let's find a better way to list the Plan
        //     Events"). Each title has its own bullet and wraps squarely under itself, with a little air between titles, so
        //     where one ends and the next begins is plain. The tag every title of the record begins with ("OGC - ") is
        //     said once by the Requirement Title beside it and is left off the list (SP.publishEventNames). The list holds
        //     as many titles as fit the block; when some do not, its last line says how many more there are.
        const dW = X[3] - X[2] - 8, evH = 7.4, evGap = 1.2, evRoom = h - 5;
        const descText = r.desc || (g.prime ? r.title : '');
        let evLines = null, evTall = 0;
        if (!descText && Array.isArray(r.events) && r.events.length) {
          evLines = [];
          const names = SP.publishEventNames(r.events);
          let left = names.length;
          for (const e of names) {
            const ls = SP.pdfWrap(e, 6.3, false, dW - 7);
            // room for this title, and, unless it is the last, for the line that says how many are left
            const need = (evLines.length ? evGap : 0) + ls.length * evH + (left > 1 ? evGap + evH : 0);
            if (evTall + need > evRoom && evLines.length) break;
            if (evLines.length) evTall += evGap;
            ls.slice(0, Math.max(1, Math.floor((evRoom - evTall) / evH))).forEach((l, k) => { evLines.push({ s: l, first: k === 0, dy: evTall }); evTall += evH; });
            left--;
          }
          if (left > 0) { evTall += evGap; evLines.push({ s: '+' + left + ' more plan event' + (left === 1 ? '' : 's'), more: true, dy: evTall }); evTall += evH; }
        }
        if (y + h > PB.bodyEnd) { closeRun(); cont(); }
        if (!run) run = { label: g.label, y0: y, color: g.color };
        // title and CCaR number
        const tl = SP.pdfWrap(r.title, 7, true, X[2] - X[1] - 8, Math.max(1, Math.floor((h - 14) / 8.2)));
        const th = tl.length * 8.2 + (r.ccar ? 8 : 0);
        Rc(X[1], y, X[2] - X[1], h, { stroke: PB.rule, lw: 0.4 });
        tl.forEach((l, i) => T((X[1] + X[2]) / 2, y + h / 2 - th / 2 + 6.4 + i * 8.2, l, { size: 7, bold: true, align: 'c' }));
        if (r.ccar) T((X[1] + X[2]) / 2, y + h / 2 - th / 2 + 6.4 + tl.length * 8.2, 'CCaR ' + r.ccar, { size: 6, align: 'c', color: PB.mut });
        // description
        Rc(X[2], y, X[3] - X[2], h, { stroke: PB.rule, lw: 0.4 });
        if (evLines) {
          const y0 = y + h / 2 - evTall / 2 + 5.6;
          for (const l of evLines) {
            if (l.first) T(X[2] + 4, y0 + l.dy, '\u2022', { size: 6.3 });
            T(X[2] + (l.more ? 4 : 10), y0 + l.dy, l.s, { size: 6.3, color: l.more ? PB.mut : PB.ink });
          }
        } else {
          const dl = SP.pdfWrap(descText, 6.5, false, dW, Math.max(1, Math.floor((h - 5) / 7.6)));
          dl.forEach((l, i) => T((X[2] + X[3]) / 2, y + h / 2 - (dl.length * 7.6) / 2 + 5.8 + i * 7.6, l, { size: 6.5, align: 'c' }));
        }
        // award dates, in order, down then across
        Rc(X[3], y, X[4] - X[3], h, { stroke: PB.rule, lw: 0.4 });
        const perCol = Math.max(1, Math.floor((h - 5) / dateH)), nc = Math.max(1, Math.ceil(shown.length / perCol)), cwD = (X[4] - X[3]) / nc;
        const used = Math.min(perCol, shown.length);
        shown.forEach((d, i) => T(X[3] + cwD * Math.floor(i / perCol) + cwD / 2, y + h / 2 - (used * dateH) / 2 + 5.6 + (i % perCol) * dateH, d, { size: 6, align: 'c' }));
        // the service rows and the Total
        for (let i = 0; i < nRows; i++) {
          const tot = i === nRows - 1, f = tot ? r.total : r.svc[i], hh = PB.rowH, yy = y + hh * i, pad = 0;
          for (let c = 4; c < 10; c++) Rc(X[c], yy, X[c + 1] - X[c], hh, { fill: tot ? PB.soft : null, stroke: PB.rule, lw: 0.4 });
          T((X[4] + X[5]) / 2, yy + pad + 6.9, tot ? 'Total' : PB_SVC_LABEL[i], { size: i === PB_NSVC && !tot ? 5 : 6.5, bold: tot, align: 'c' });
          FIGS.forEach((k, j) => money(X[5 + j], X[6 + j] - X[5 + j], yy + pad + 6.9, f[k], { red: k === 'delta', bold: tot }));
          if (tot) Ln(X[4], yy, X[10], yy, { stroke: PB.ink, lw: 0.9 });
        }
        y += h;
      }
      closeRun();
    }
  }

  // ---- the unfunded list, filtered to this document ----
  const U = doc.ufr;
  const ux = [18, 44, 68, 210, 270, 322, 364, 406, 448, 490, 532, 574, 624, 680, 722, 774];
  const uHead = ['FY', 'Rank', 'Requirement Title', doc.kind === 'ap' ? 'PMO' : 'Appropriation', 'CCaR Record', 'USAF', 'ANG', 'AFRC', 'STOVL', 'USMC CV', 'USN CV', 'Total',
    'Funding Status', 'Exec Ready?', 'SFCB Action'];
  const uTop = contd => {
    newPage();
    const ex = mini();
    T(ex, 35, 'Unfunded requirements' + (contd ? ' (continued)' : ''), { size: 11, bold: true });
    T(ex, 45, (doc.kind === 'ap' ? doc.long : doc.label) + ': the unfunded list, filtered to what this spend plan presents. Whole dollars.', { size: 7, color: PB.mut });
    y = 56;
    uHead.forEach((h, i) => { Rc(ux[i], y, ux[i + 1] - ux[i], 12, { fill: PB.head, stroke: PB.rule, lw: 0.4 }); T((ux[i] + ux[i + 1]) / 2, y + 8.3, h, { size: 6, bold: true, align: 'c' }); });
    y += 12;
  };
  uTop(false);
  if (!U.length) {
    T(PB.L, y + 12, C.ufrFiles && C.ufrFiles.length ? 'The unfunded list holds no line for what this spend plan presents.' : 'No unfunded list is loaded.', { size: 8 });
  } else {
    const sumRow = (label, ls, strong) => {
      if (y + 11 > PB.bodyEnd) uTop(true);
      Rc(ux[0], y, ux[5] - ux[0], 11, { fill: PB.soft, stroke: PB.rule, lw: 0.4 });
      T(ux[5] - 4, y + 7.8, label, { size: 6.5, bold: true, align: 'r' });
      for (let i = 0; i < 7; i++) {
        const v = i < 6 ? ls.reduce((n, l) => n + l.cents[i], 0) : ls.reduce((n, l) => n + l.total, 0);
        Rc(ux[5 + i], y, ux[6 + i] - ux[5 + i], 11, { fill: PB.soft, stroke: PB.rule, lw: 0.4 });
        money(ux[5 + i], ux[6 + i] - ux[5 + i], y + 7.8, v, { bare: true, bold: true, size: 6 });
      }
      Rc(ux[12], y, ux[15] - ux[12], 11, { fill: PB.soft, stroke: PB.rule, lw: 0.4 });
      if (strong) Ln(ux[0], y, ux[15], y, { stroke: PB.ink, lw: 0.9 });
      y += 11;
    };
    let cur = null, part = [];
    const closePart = () => { if (cur !== null && part.length) sumRow('Subtotal - ' + cur, part, false); part = []; };
    for (const l of U) {
      const k = pb_apLabel(l.ap) + ' FY' + l.fy;
      if (k !== cur) {
        closePart(); cur = k;
        if (y + 11 + 12 > PB.bodyEnd) uTop(true);
        Rc(ux[0], y, ux[15] - ux[0], 11, { fill: PB.band, stroke: PB.rule, lw: 0.4 });
        T(ux[0] + 4, y + 7.8, k, { size: 7, bold: true }); y += 11;
      }
      const tl = SP.pdfWrap(l.title || '(no title)', 6.3, false, ux[3] - ux[2] - 6, 3);
      const sl = SP.pdfWrap(l.status, 6, false, ux[13] - ux[12] - 4, 3), al = SP.pdfWrap(l.sfcb, 6, false, ux[15] - ux[14] - 4, 3);
      const pl = SP.pdfWrap(doc.kind === 'ap' ? l.pmoLabel : pb_apLabel(l.ap), 6, false, ux[4] - ux[3] - 4, 3);
      const h = Math.max(10, Math.max(tl.length, sl.length, al.length, pl.length) * 7.2 + 3.5);
      if (y + h > PB.bodyEnd) { uTop(true); Rc(ux[0], y, ux[15] - ux[0], 11, { fill: PB.band, stroke: PB.rule, lw: 0.4 }); T(ux[0] + 4, y + 7.8, k + ' (continued)', { size: 7, bold: true }); y += 11; }
      for (let i = 0; i < 15; i++) Rc(ux[i], y, ux[i + 1] - ux[i], h, { stroke: PB.rule, lw: 0.4 });
      const mid = y + 7.2;
      T((ux[0] + ux[1]) / 2, mid, 'FY' + String(l.fy % 100).padStart(2, '0'), { size: 6, align: 'c' });
      T((ux[1] + ux[2]) / 2, mid, l.rank, { size: 6, align: 'c' });
      tl.forEach((s, i) => T(ux[2] + 3, mid + i * 7.2, s, { size: 6.3 }));
      pl.forEach((s, i) => T(ux[3] + 2, mid + i * 7.2, s, { size: 6 }));
      T(ux[4] + 2, mid, SP.pdfWrap(l.ccar, 6, false, ux[5] - ux[4] - 4, 1)[0] || '', { size: 6 });
      for (let i = 0; i < 6; i++) money(ux[5 + i], ux[6 + i] - ux[5 + i], mid, l.cents[i], { bare: true, size: 6 });
      money(ux[11], ux[12] - ux[11], mid, l.total, { bare: true, size: 6, bold: true });
      sl.forEach((s, i) => T(ux[12] + 2, mid + i * 7.2, s, { size: 6 }));
      T((ux[13] + ux[14]) / 2, mid, SP.pdfWrap(l.exec, 6, false, ux[14] - ux[13] - 4, 1)[0] || '', { size: 6, align: 'c' });
      al.forEach((s, i) => T(ux[14] + 2, mid + i * 7.2, s, { size: 6 }));
      part.push(l); y += h;
    }
    closePart();
    sumRow('Total unfunded', U, true);
    if (U.some(l => l.cents[PB_NSVC])) { y += 4; T(PB.L, y + 7, 'A Total larger than its services holds an amount the tracker gave under no service.', { size: 6.5, color: PB.mut }); }
  }

  // ---- the frame of every page ----
  const N = pages.length, cui = String(C.cui === undefined ? SP.CUI : C.cui), name = doc.file.replace(/\.pdf$/i, '');
  pages.forEach((p, i) => {
    p.ops.push({ t: 'text', x: PB.W / 2, y: 15, s: cui, size: 8, bold: true, align: 'c' });
    p.ops.push({ t: 'text', x: PB.W / 2, y: 603, s: cui, size: 8, bold: true, align: 'c' });
    p.ops.push({ t: 'text', x: PB.L, y: 603, s: name, size: 6.5, color: PB.mut });
    p.ops.push({ t: 'text', x: PB.R, y: 603, s: 'Page ' + (i + 1) + ' of ' + N, size: 6.5, color: PB.mut, align: 'r' });
  });
  return { title: name, pages, images: C.emblem ? { emblem: C.emblem } : {} };
};
SP.publishPdf = function publishPdf(doc, ctx) { return SP.pdfBytes(SP.publishPages(doc, ctx)); };

// ---------------------------------------------------------------------------------------------------------------
// §33.6 A LIST OF DESCRIPTIONS, from a file. Brad: each CCaR record "has a short description in it. That could be pulled
// from a separate import or typed. Once typed, I'd want it saved". Any sheet whose heading row names a CCaR number and a
// description is read; a number given twice keeps its first description that is not blank.
//   wb: {sheets: [{name, rows}]}   ->  { ok: true, map: {normKey(CCaR number): text}, n, sheet } | { ok: false, why }
// ---------------------------------------------------------------------------------------------------------------
const PB_DESC_CCAR = ['ccar record', 'ccar no', 'ccar no.', 'ccar number', 'ccar #', 'ccar'];
const PB_DESC_TEXT = ['short description', 'description', 'ccar description', 'record description'];
SP.readDescriptions = function readDescriptions(wb) {
  const sheets = wb && Array.isArray(wb.sheets) ? wb.sheets : [];
  for (const sh of sheets) {
    const rows = Array.isArray(sh.rows) ? sh.rows : [];
    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      const ks = rows[i].map(pb_hkey);
      const ci = PB_DESC_CCAR.map(k => ks.indexOf(k)).find(x => x >= 0), di = PB_DESC_TEXT.map(k => ks.indexOf(k)).find(x => x >= 0);
      if (ci === undefined || di === undefined) continue;
      const map = {};
      let n = 0;
      for (let j = i + 1; j < rows.length; j++) {
        const k = SP.normKey(rows[j][ci]), t = pb_txt(rows[j][di]);
        if (k === '' || t === '' || Object.prototype.hasOwnProperty.call(map, k)) continue;
        map[k] = t; n++;
      }
      return { ok: true, map, n, sheet: String(sh.name || '') };
    }
  }
  return { ok: false, why: 'no sheet in it has a heading row naming both a CCaR number (CCaR Record or CCaR No) and a Description' };
};

// ---------------------------------------------------------------------------------------------------------------
// §37 THE UNFUNDED LIST ON SCREEN (Brad, 19 Nov 2026: "we need to create a UFR section under Browse. Once I upload the UFR
// listing, I want the list to be seen there with other features like filtering, PMO filter, etc."). Everything the
// Unfunded (UFR) view draws, worked out here so the view only draws. Nothing is a new rule: a line's PMO and its place in
// the spend plan are SP.publishData's (the same record a published plan puts it on), so the screen and the PDFs cannot
// say different things about one unfunded line.
//   Mfull   the model with every switch on (as SP.publishData takes)
//   view    this browser's switches: a service switched off is left out of every amount, column and total here, as it is
//           on every other view. The lanes do not apply: the tracker has none.
//   F       { pmo, ap, fy, status, exec, q }   each null/'' for all
//   -> { files: [{fy, name, at}], all (lines before the pickers), n, svc: [{i, label}], picks: {pmos, aps, fys, statuses, execs},
//        groups: [{ap, apLabel, fy, lines}], lines: [line + {amt: [cents by shown service], sum, plan: null | {approved, obligated}}],
//        total: {amt, sum}, tiles: {sum, n, aps, exec: {sum, n}, sfcb: {sum, n}, only}, byPmo: [{key, label, sum, color}],
//        bySvc: [{label, sum}], skipped }
// "Exec ready" counts a line whose Exec Ready? cell begins with Y; "SFCB approved" one whose SFCB Action says approv(ed).
// ---------------------------------------------------------------------------------------------------------------
const PB_UFR_SVC = Object.freeze(['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC CV', 'USN CV', 'No service']);
// whole thousands of dollars, as the tracker is kept: 1234567800 cents -> '12,346'; negative in parentheses; zero '-'
SP.fmtK = function fmtK(cents) {
  if (typeof cents !== 'number' || !isFinite(cents)) return '';
  const k = Math.round(Math.abs(cents) / 100000);
  if (k === 0) return '-';
  const t = String(k).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return cents < 0 ? '(' + t + ')' : t;
};
SP.ufrView = function ufrView(Mfull, view, ufr, pub, settings, F) {
  const f = F || {};
  const D = SP.publishData(Mfull, ufr, pub, { settings });
  const on = i => { const name = i < PB_NSVC ? SP.SERVICES[i] : SP.SVC_UNKNOWN; return !(view && view.svc && view.svc[name] === false); };
  // the record each line sits on in the spend plan, as an appropriation's published plan has it
  const recs = new Map();
  for (const d of D.docs) if (d.kind === 'ap') for (const sec of d.sections) for (const g of sec.groups) for (const r of g.records)
    recs.set(sec.ap + '|' + sec.fy + '|' + (g.prime ? '*' : g.pmoKey) + '|' + (r.key !== '' ? r.key : '\u0001' + SP.normKey(r.title)), r);
  const special = new Set(Array.isArray(Mfull.special) ? Mfull.special : []);
  const svcIdx = [];
  const raw = D.docs.filter(d => d.kind === 'ap').flatMap(d => d.ufr);
  for (let i = 0; i <= PB_NSVC; i++) if (on(i) && (i < PB_NSVC || raw.some(l => l.cents[PB_NSVC]))) svcIdx.push(i);
  const all = raw.map(l => {
    const ck = SP.normKey(l.ccar), prime = ck !== '' && special.has(ck);
    const r = recs.get(l.ap + '|' + l.fy + '|' + (prime ? '*' : l.pmoKey) + '|' + (ck !== '' ? ck : '\u0001' + SP.normKey(l.title)));
    const amt = svcIdx.map(i => l.cents[i] || 0);
    let plan = null;
    if (r && !r.ufrOnly) { plan = { approved: 0, obligated: 0 }; r.svc.forEach((x, i) => { if (on(i)) { plan.approved += x.approved; plan.obligated += x.obligated; } }); }
    return Object.assign({}, l, { amt, sum: amt.reduce((a, b) => a + b, 0), plan, prime,
      execReady: /^\s*y/i.test(l.exec), sfcbApproved: /approv/i.test(l.sfcb), id: l.ap + '|' + l.fy + '|' + l.sheet + '|' + l.row });
  });
  const uniq = (list, key, label) => { const m = new Map(); for (const x of list) { const k = key(x); if (k !== '' && k !== null && k !== undefined && !m.has(k)) m.set(k, label(x)); } return [...m]; };
  const picks = {
    pmos: uniq(all, l => l.pmoKey, l => l.pmoLabel).sort((a, b) => pb_cmp(SP.normKey(a[1]), SP.normKey(b[1]))),
    aps: SP.APS.filter(a => all.some(l => l.ap === a.id)).map(a => [a.id, a.label]),
    fys: uniq(all, l => String(l.fy), l => 'FY' + l.fy).sort((a, b) => Number(a[0]) - Number(b[0])),
    statuses: uniq(all, l => l.status, l => l.status).sort((a, b) => pb_cmp(SP.normKey(a[0]), SP.normKey(b[0]))),
    execs: uniq(all, l => l.exec, l => l.exec).sort((a, b) => pb_cmp(SP.normKey(a[0]), SP.normKey(b[0]))),
  };
  const q = SP.normKey(f.q);
  const lines = all.filter(l => (f.pmo === null || f.pmo === undefined || l.pmoKey === f.pmo) && (!f.ap || l.ap === f.ap) && (!f.fy || String(l.fy) === String(f.fy))
    && (f.status === null || f.status === undefined || f.status === '' || l.status === f.status) && (f.exec === null || f.exec === undefined || f.exec === '' || l.exec === f.exec)
    && (q === '' || SP.normKey(l.title).includes(q) || SP.normKey(l.ccar).includes(q)));
  const sumOf = ls => ls.reduce((n, l) => n + l.sum, 0);
  const groups = [];
  for (const l of lines) { const g = groups[groups.length - 1]; if (g && g.ap === l.ap && g.fy === l.fy) g.lines.push(l); else groups.push({ ap: l.ap, apLabel: pb_apLabel(l.ap), fy: l.fy, lines: [l] }); }
  const byPmo = picks.pmos.map(([key, label]) => ({ key, label, sum: sumOf(lines.filter(l => l.pmoKey === key)), color: SP.publishColor(key, false) })).filter(x => x.sum !== 0)
    .sort((a, b) => b.sum - a.sum || pb_cmp(a.label, b.label));
  const files = Object.keys(ufr && typeof ufr === 'object' ? ufr : {}).sort().map(k => ({ fy: ufr[k].fy, name: ufr[k].name || '', at: ufr[k].importedAt || '' }));
  return { files, all: all.length, n: lines.length, svc: svcIdx.map(i => ({ i, label: PB_UFR_SVC[i] })), picks, groups, lines,
    total: { amt: svcIdx.map((_, k) => lines.reduce((n, l) => n + l.amt[k], 0)), sum: sumOf(lines) },
    tiles: { sum: sumOf(lines), n: lines.length, aps: new Set(lines.map(l => l.ap)).size, exec: { sum: sumOf(lines.filter(l => l.execReady)), n: lines.filter(l => l.execReady).length },
      sfcb: { sum: sumOf(lines.filter(l => l.sfcbApproved)), n: lines.filter(l => l.sfcbApproved).length }, only: lines.filter(l => !l.plan).length },
    byPmo, bySvc: svcIdx.map((i, k) => ({ label: PB_UFR_SVC[i], sum: lines.reduce((n, l) => n + l.amt[k], 0) })),
    skipped: D.ufrSkipped.reduce((n, x) => n + x.n, 0) };
};

