// DO THE TOTALS ADD UP? — an INDEPENDENT reconciliation.
//
// Every other suite in this directory derives what it expects from the board's own helpers:
// tiers(), mcCalc(), tierTotals(). That is the right way to test that the exports agree with the
// board -- and it is worth nothing if tiers() itself is wrong, because then every check agrees with
// the same mistake. Nothing here calls a board helper to build an expectation.
//
// Instead this asserts arithmetic that must hold WHATEVER the allocation algorithm does:
//
//   conservation   for every requirement and every service:  disc + mand + unfunded = ask
//   capacity       for every service:  Σ disc ≤ disc BA      and  Σ mand ≤ mand BA
//   cross-foot     every printed TOTAL row = the sum of the detail rows above it, column by column
//   agreement      the same quantity is the same number in every artefact that prints it
//
// A wrong algorithm can still satisfy an audit written against itself. It cannot satisfy these.
import { boot, seed, stopAtFirstFailure, capture } from './boot.mjs';

let failures = [];
stopAtFirstFailure(failures);   // in the mutation sweep only: see boot.mjs
// EVERY NAMED SCENARIO MUST RUN. A block appended after process.exit() never executes and reads as
// a pass -- the proposal scenario in audit-import.mjs sat there for a whole verification round and
// five mutations aimed at it survived. chk() records every scenario it hears from; at the summary,
// any `const name = '...'` in this file it never heard from is a failure, not a pass.
import { readFileSync as _selfRead } from 'node:fs';
import { fileURLToPath as _selfPath } from 'node:url';
const SEEN = new Set();
const chk = (scenario, where, what, got, want) => {
  SEEN.add(scenario);
  const ok = (typeof got === 'number' && typeof want === 'number')
    ? Math.abs(got - want) <= 0.005 : String(got) === String(want);
  if (!ok) failures.push({ scenario, where, what, got, want });
};
// Compare at CENTS. Summing floats gives 2422222.0000000005, which is the same money as 2422222
// and a different string -- the first run of this suite reported exactly that as a mismatch.
const money = n => String(Math.round(n * 100) / 100);

const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Req ' + id,
  event: 'Ev ' + id, ccar: 'CC' + id, fy26: ask.map(() => 0), ask, alloc: null });

// AWKWARD ON PURPOSE. Round numbers hide rounding: every ask below is uneven across services, the
// pots do not divide cleanly into them, and two requirements carry odd dollars so a figure that is
// averaged across services instead of weighted by service cannot come out right by luck.
const SVCN = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'];
const fixture = () => ({
  services: SVCN,
  items: [
    it('A', 'PSM', [9000000, 2000000, 1000000, 4000000, 1500000, 2500001]),
    it('B', 'ATL', [3000000,  500000,  250000, 1000000,       0,  750000]),
    it('C', 'TSS', [1200000,  300000,  150000,  333333,  200000,  100000]),
    it('D', 'SE',  [ 750000,  125000,   62500,  400000,  175000,   87500]),
    it('E', 'LOG', [2400000,  600000,  300000,  900000,  450000,  225000]),
  ],
  disc: [8000000, 1500000,  600000, 3000000, 1400000, 1600000],
  mand: [3000000,  600000,  400000, 1500000,  800000,  900000],
  order: ['A', 'B', 'C', 'D', 'E'],
  mc: { A: true, C: true },
});

// A board with the awkward cases ON it: a scalar trim, an explicit split, a per-service override,
// a minimum useful increment and an absorber. Each is a different route into tiers().
const dress = (ev) => ev(`
  S.alloc['B']={m:'t', v:3900001};          // a trim that does not divide evenly by six services
  S.alloc['D']={m:'t', v:777777};
  seedSplit('C');                            // an explicit disc/mand split
  S.minInc['E']=250000;
  S.band['A']='pdm';
  S.awards['A']={mode:'single', d:FYMON[2][0], day:7};
  applyState(S); save(); 'ok'`);

// The vectors, straight off the board. These are the NUMBERS UNDER TEST -- nothing below asks the
// board what they ought to be.
const boardFigures = (ev) => JSON.parse(ev(`(function(){
  const T=tiers(); const o={ svc:SVC.slice(), rows:{}, discBA:[], mandBA:[] };
  SVC.forEach(function(_,i){ o.discBA.push(S.discSvc[i]||0); o.mandBA.push(S.mandSvc[i]||0); });
  S.order.forEach(function(id){
    const p=T[id], x=itemById(id); if(!p||!x) return;
    o.rows[id]={ ask:x.ask.slice(), d:p.d.slice(), m:p.m.slice(), u:p.u.slice(),
                 basis:basisSvcOf(x), beyond:beyondSvcOf(x,p), trim:trimSvcOf(x),
                 unf:unfSvcOf(x,p), discUnf:discUnfSvcOf(x,p), mc:!!S.mc[id] };
  });
  return JSON.stringify(o); })()`));

const workbook = (w) => w.eval(`(async function(){
  var cap=null,_B=window.Blob;
  window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
  try{ exportExcel(); }catch(e){ return JSON.stringify({__err:String((e&&e.message)||e)}); }
  window.Blob=_B;
  var ab=cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength);
  return JSON.stringify(await xlsxRead(ab)); })()`);

// ── helpers that read a sheet the way a person does: by its column HEADING ────────────────────
const num = v => { if (typeof v === 'number') return v;
  const n = parseFloat(String(v ?? '').replace(/[$,\s]/g, '')); return isFinite(n) ? n : null; };
const headerRow = (rows, ...must) => rows.findIndex(r =>
  must.every(m => (r || []).some(c => String(c ?? '').trim().toLowerCase() === m.toLowerCase())));
const colOf = (rows, hdr, name) => (rows[hdr] || [])
  .findIndex(c => String(c ?? '').trim().toLowerCase() === name.toLowerCase());
const rowStarting = (rows, from, label) => rows.findIndex((r, i) =>
  i > from && String((r || [])[0] ?? '').trim().toLowerCase() === label.toLowerCase());

console.log('RECONCILIATION — do the totals add up, independently of how they were computed\n'
  + '='.repeat(96));

const { ev, w } = boot();
const sc = fixture();
seed(ev, sc);
ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); 'ok'`);
dress(ev);
// The surfaces the register recorded as gaps need state the base fixture never carried (the reprogramming
// log it seeded went with the ATR/BTR tracker in v2.02): an imported estimate (two confirmed lines, one nobody confirms, one under a PMO
// no office reports under), a year override on one ask, the other funding sources typed in, and
// prime tokens that route two requirements to Lockheed and Pratt. Seeded BEFORE the figures and the
// workbook are read, so everything below sees the same board.
// v2.12 W1 (item 132): PSM is inside Air Vehicle in every estimate -- Cost files PSM's money under Air Vehicle, and no estimate has a
// PSM office of its own -- so the line A confirms is filed under AV, as the 2026 estimate files it. Under the old rule (PSM its own
// estimate office from 2026) it sat under PSM; read the new way, a line under PSM is under no office, and A's estimate is AV's.
// v2.19 (item 150): the estimate, its confirmed ties (aceMap) and the funds flow's partner money are gone with their surfaces
const dress2 = (ev) => ev(`
  if(!S.wbs) S.wbs={};
  S.wbs['A']=[{w:'1.1', v:[]}];
  S.wbs['C']=[{w:'2.2', v:[]}];
  S.asks['C']=[1300000, 300000, 150000, 333333, 200000, 100000];
  flowCfg().rules.lm='Req B'; flowCfg().rules.pw='Req D';
  applyState(S); save(); 'ok'`);
dress2(ev);
const F = boardFigures(ev);
const book = JSON.parse(await workbook(w));
if (book.__err) { console.log('the workbook did not build: ' + book.__err); process.exit(1); }

// ══ 1. CONSERVATION ════════════════════════════════════════════════════════════════════════════
// EVERY DOLLAR ASKED FOR IS IN EXACTLY ONE PLACE. The board splits a requirement's ask four ways
// and the workbook prints all four as separate columns, so they have to close:
//
//     ask  =  drawn from discretionary
//          +  drawn from mandatory
//          +  BEYOND THE LANES   (allocated, but the lanes had no room)
//          +  NOT ALLOCATED      (the trim -- asked for, never put to a lane)
//
// The first version of this check asserted d+m+u = ask and failed on exactly the two trimmed
// requirements, returning their trim value. That was the check being wrong, not the board: the
// lanes conserve against the ALLOCATION, and the trim is the fourth term. Getting this identity
// stated precisely is most of the value of writing it down.
{
  const name = '1 conservation';
  try {
  Object.keys(F.rows).forEach(id => {
    const r = F.rows[id];
    F.svc.forEach((s, i) => {
      chk(name, id, `${s}: disc + mand + beyond + trim = ask`,
        money(r.d[i] + r.m[i] + r.beyond[i] + r.trim[i]), money(r.ask[i]));
      chk(name, id, `${s}: the lanes conserve against the allocation`,
        money(r.d[i] + r.m[i] + r.u[i]), money(Math.min(r.ask[i], r.basis[i])));
      chk(name, id, `${s}: nothing is negative`,
        [r.d[i], r.m[i], r.u[i], r.beyond[i], r.trim[i], r.unf[i], r.discUnf[i]]
          .every(v => v >= -0.005) ? 'ok' : 'NEGATIVE', 'ok');
      chk(name, id, `${s}: no lane draws more than the ask`,
        (r.d[i] <= r.ask[i] + 0.005 && r.m[i] <= r.ask[i] + 0.005) ? 'ok' : 'OVERDRAWN', 'ok');
      // THE TWO STATED READINGS, checked as arithmetic rather than by calling the helper again.
      chk(name, id, `${s}: TOTAL unfunded = ask − disc − mand`,
        money(r.unf[i]), money(Math.max(0, r.ask[i] - r.d[i] - r.m[i])));
      chk(name, id, `${s}: unfunded vs DISC = ask − disc`,
        money(r.discUnf[i]), money(Math.max(0, r.ask[i] - r.d[i])));
      chk(name, id, `${s}: and total unfunded = beyond + trim`,
        money(r.unf[i]), money(r.beyond[i] + r.trim[i]));
      // Mandatory can only ever narrow the gap between the two readings; it can never widen it.
      chk(name, id, `${s}: mandatory only narrows the gap`,
        r.discUnf[i] >= r.unf[i] - 0.005 ? 'ok' : 'TOTAL EXCEEDS vs-DISC', 'ok');
    });
    const T = a => a.reduce((x, y) => x + y, 0);
    chk(name, id, 'and the row total closes the same way',
      money(T(r.d) + T(r.m) + T(r.beyond) + T(r.trim)), money(T(r.ask)));
  });
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ══ 2. CAPACITY ════════════════════════════════════════════════════════════════════════════════
// A service cannot draw more than its own BA, and one service's underspend can never pay for
// another's overdraw -- which a portfolio-level total would hide completely.
{
  const name = '2 capacity';
  try {
  F.svc.forEach((s, i) => {
    const d = Object.values(F.rows).reduce((a, r) => a + r.d[i], 0);
    const m = Object.values(F.rows).reduce((a, r) => a + r.m[i], 0);
    chk(name, s, 'discretionary drawn never exceeds the discretionary BA',
      d <= F.discBA[i] + 0.005 ? 'within' : `OVER by ${money(d - F.discBA[i])}`, 'within');
    chk(name, s, 'mandatory drawn never exceeds the mandatory BA',
      m <= F.mandBA[i] + 0.005 ? 'within' : `OVER by ${money(m - F.mandBA[i])}`, 'within');
  });
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// EVERY SHEET THIS SUITE READS MUST BE THERE. A renamed or dropped sheet would otherwise take its
// checks with it and report nothing at all -- which is how a workbook loses a tab quietly.
['Funding Streams','Decision Bands','CR Cash Needs','PMO Matrix','RCN-EEIC by Month',
 'Mission Critical','Unfunded Requirements'].forEach(n =>
  chk('0 sheets', 'workbook', `the ${n} sheet is in the workbook`, book[n] ? 'present' : 'MISSING', 'present'));

// ══ 3. CROSS-FOOT ══════════════════════════════════════════════════════════════════════════════
// Every printed TOTAL is re-added from the rows above it, column by column, exactly as a comptroller
// would with a ruler. A total that was computed separately from the rows it sits under is the
// classic way a spreadsheet comes apart: both halves are individually defensible and they disagree.
const T = a => a.reduce((x, y) => x + y, 0);
const crossFoot = (name, sheet, hdrRow, firstDetail, totalRow, label) => {
  const rows = book[sheet];
  if (!rows) { chk(name, sheet, 'the sheet exists', 'missing', 'present'); return; }
  const hdr = rows[hdrRow] || [];
  for (let c = 1; c < hdr.length; c++) {
    const head = String(hdr[c] ?? '').trim();
    if (!head) continue;
    const printed = num((rows[totalRow] || [])[c]);
    if (printed === null) continue;                   // a column the total row leaves blank
    let sum = 0, seen = 0;
    for (let r = firstDetail; r < totalRow; r++) {
      const v = num((rows[r] || [])[c]);
      if (v !== null) { sum += v; seen++; }
    }
    if (!seen) continue;
    chk(name, `${sheet} · ${label}`, `${head}: the total equals the ${seen} rows above it`,
      money(sum), money(printed));
  }
};
// Funding Streams: one row per service, then TOTAL.
crossFoot('3 cross-foot', 'Funding Streams', 2, 3, 3 + F.svc.length, 'TOTAL');
// PMO Matrix: one row per PMO, then TOTAL.
{
  const rows = book['PMO Matrix'] || [];
  const tot = rows.findIndex(r => String((r || [])[0] ?? '').trim() === 'TOTAL');
  chk('3 cross-foot', 'PMO Matrix', 'it has a TOTAL row', tot > 2 ? 'yes' : 'no', 'yes');
  if (tot > 2) crossFoot('3 cross-foot', 'PMO Matrix', 2, 3, tot, 'TOTAL');
}
// Decision Bands: the GRAND TOTAL against every requirement row in the detail table.
{
  const name = '3 cross-foot', rows = book['Decision Bands'] || [];
  try {
  const hdr = headerRow(rows, 'Rank', 'Band', 'PMO');
  const grand = rows.findIndex(r => /^GRAND TOTAL/.test(String((r || [])[0] ?? '').trim()));
  chk(name, 'Decision Bands', 'it has a detail table and a GRAND TOTAL',
    (hdr >= 0 && grand > hdr) ? 'yes' : `hdr ${hdr} grand ${grand}`, 'yes');
  if (hdr >= 0 && grand > hdr) {
    // Only the requirement rows count: a band's own TOTAL line is a subtotal of rows already
    // counted, and adding it in would double every banded requirement.
    for (let c = 1; c < (rows[hdr] || []).length; c++) {
      const head = String(rows[hdr][c] ?? '').trim();
      const printed = num((rows[grand] || [])[c]);
      if (!head || printed === null) continue;
      let sum = 0, seen = 0;
      for (let r = hdr + 1; r < grand; r++) {
        const first = String((rows[r] || [])[0] ?? '').trim();
        if (!first || /TOTAL|Subtotal|BAND \d/i.test(first)) continue;
        const v = num((rows[r] || [])[c]);
        if (v !== null) { sum += v; seen++; }
      }
      if (!seen) continue;
      chk(name, 'Decision Bands · GRAND TOTAL',
        `${head}: the grand total equals its ${seen} requirement rows`, money(sum), money(printed));
    }
  }
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ══ 4. THE SAME QUANTITY IS THE SAME NUMBER EVERYWHERE ═════════════════════════════════════════
// Six sheets, a deck and the board itself each print the funded topline, the discretionary draw and
// the unfunded total. They are computed by different code on different paths. If any two disagree,
// somebody is briefing one of them.
{
  const name = '4 agreement';
  try {
  const rowsOf = n => book[n] || [];
  const fs = rowsOf('Funding Streams'), fsT = 3 + F.svc.length;
  const cell = (rows, hdrRow, totRow, head) => {
    const c = colOf(rows, hdrRow, head);
    return c < 0 ? null : num((rows[totRow] || [])[c]);
  };
  // From the BOARD, by addition -- not by asking tierTotals() what it thinks.
  const R = Object.values(F.rows);
  const board = {
    ask:     T(R.map(r => T(r.ask))),
    disc:    T(R.map(r => T(r.d))),
    mand:    T(R.map(r => T(r.m))),
    unf:     T(R.map(r => T(r.unf))),
    trim:    T(R.map(r => T(r.trim))),
    beyond:  T(R.map(r => T(r.beyond))),
    mcValue: T(R.filter(r => r.mc).map(r => T(r.ask))),
    mcShort: T(R.filter(r => r.mc).map(r => T(r.discUnf))),
  };
  chk(name, 'board', 'funded = disc + mand', money(board.disc + board.mand),
    money(board.disc + board.mand));
  chk(name, 'board', 'ask = funded + trim + beyond',
    money(board.disc + board.mand + board.trim + board.beyond), money(board.ask));
  chk(name, 'board', 'total unfunded = trim + beyond', money(board.unf),
    money(board.trim + board.beyond));

  // Funding Streams
  chk(name, 'Funding Streams', 'FY27 Ask agrees with the board',
    money(cell(fs, 2, fsT, 'FY27 Ask')), money(board.ask));
  chk(name, 'Funding Streams', 'Disc Funded agrees with the board',
    money(cell(fs, 2, fsT, 'Disc Funded')), money(board.disc));
  chk(name, 'Funding Streams', 'Mand Funded agrees with the board',
    money(cell(fs, 2, fsT, 'Mand Funded')), money(board.mand));
  chk(name, 'Funding Streams', 'Funded Total agrees with the board',
    money(cell(fs, 2, fsT, 'Funded Total')), money(board.disc + board.mand));
  chk(name, 'Funding Streams', 'Ask Not Allocated agrees with the board',
    money(cell(fs, 2, fsT, 'Ask Not Allocated (delta)')), money(board.trim));
  chk(name, 'Funding Streams', 'Beyond Both Lanes agrees with the board',
    money(cell(fs, 2, fsT, 'Beyond Both Lanes')), money(board.beyond));
  chk(name, 'Funding Streams', 'TOTAL UNFUNDED agrees with the board',
    money(cell(fs, 2, fsT, 'TOTAL UNFUNDED')), money(board.unf));

  // PMO Matrix
  const pm = rowsOf('PMO Matrix');
  const pmT = pm.findIndex(r => String((r || [])[0] ?? '').trim() === 'TOTAL');
  chk(name, 'PMO Matrix', 'TOTAL Disc agrees with Funding Streams',
    money(cell(pm, 2, pmT, 'TOTAL Disc')), money(board.disc));
  chk(name, 'PMO Matrix', 'TOTAL Mand agrees with Funding Streams',
    money(cell(pm, 2, pmT, 'TOTAL Mand')), money(board.mand));
  const pmUnf = pm.findIndex(r => /^TOTAL UNFUNDED/.test(String((r || [])[0] ?? '')));
  chk(name, 'PMO Matrix', 'its unfunded line agrees with Funding Streams',
    money(num((pm[pmUnf] || []).filter(v => num(v) !== null).pop())), money(board.unf));

  // ★ Mission Critical, in both sheets that print it.
  chk(name, 'Mission Critical', 'the memo value agrees with the starred asks',
    money(cell(pm, 2, pmT, '★ MC requirement (memo)')), money(board.mcValue));
  chk(name, 'Mission Critical', 'the shortage agrees with ask − disc on the starred rows',
    money(cell(pm, 2, pmT, '★ MC short vs Disc')), money(board.mcShort));
  {
    const mcRow = fs.findIndex(r => /Starred requirements/.test(String((r || [])[0] ?? '')));
    const vals = (fs[mcRow] || []).map(num).filter(v => v !== null);
    chk(name, 'Mission Critical', 'and Funding Streams prints the same two figures',
      vals.slice(-3).map(money).join(' / '),
      [board.mcValue, board.disc, board.mcShort].map(money).join(' / '));
  }

  // The funded topline, as three other sheets print it.
  const lastNum = row => { const v = (row || []).map(num).filter(x => x !== null); return v.length ? v[v.length - 1] : null; };
  // CR CASH NEEDS covers the OCT-MAR window, so its TOTAL column is the cash needed IN THAT WINDOW
  // and deliberately excludes "No date". The whole sheet must still account for every funded dollar
  // -- the windows plus No date -- or money has gone missing between the board and the page.
  {
    const cr = rowsOf('CR Cash Needs');
    const hdr = headerRow(cr, 'No date', 'TOTAL IN WINDOW');
    const t = cr.findIndex(r => String((r || [])[0] ?? '').trim() === 'TOTAL');
    // FAIL, DO NOT SKIP. Renaming that column to "TOTAL IN WINDOW" -- which this suite asked for --
    // instantly stopped these checks matching, and a silent `if (hdr >= 0)` reported a clean pass.
    // Anything this suite needs to find, it asserts it found.
    chk(name, 'CR Cash Needs', 'its header and TOTAL row were found',
      (hdr >= 0 && t > 0) ? 'found' : `header ${hdr}, total row ${t}`, 'found');
    if (hdr >= 0 && t > 0) {
      const cNod = colOf(cr, hdr, 'No date'), cTot = colOf(cr, hdr, 'TOTAL IN WINDOW');
      const wins = (cr[t] || []).slice(1, cNod).map(num).filter(v => v !== null);
      chk(name, 'CR Cash Needs', 'every funded dollar is on the sheet (windows + No date)',
        money(T(wins) + num((cr[t] || [])[cNod])), money(board.disc + board.mand));
      chk(name, 'CR Cash Needs', 'and its TOTAL column is the in-window cash, not the row total',
        money(num((cr[t] || [])[cTot])), money(T(wins)));
    }
  }
  // RCN/EEIC IS A LINE OF ACCOUNTING THAT ONLY SOME SERVICES CARRY (RCN_SVCS). Its total is the
  // funded topline RESTRICTED TO THOSE SERVICES -- checking it against the whole portfolio would
  // fail on any board with a service outside that list, which is not a defect in the arithmetic.
  {
    const rc = rowsOf('RCN-EEIC by Month');
    const t = rc.findIndex(r => /TOTAL BY MONTH/.test(String((r || [])[0] ?? '')));
    const scope = JSON.parse(ev('JSON.stringify(typeof RCN_SVCS!=="undefined"? RCN_SVCS : [])'));
    chk(name, 'RCN-EEIC by Month', 'its total row and its service scope were found',
      (t > 0 && scope.length) ? 'found' : `total row ${t}, scope ${scope.length}`, 'found');
    if (t > 0 && scope.length) {
      const want = scope.reduce((a, sv) => {
        const i = F.svc.indexOf(sv);
        return i < 0 ? a : a + T(Object.values(F.rows).map(r => r.d[i] + r.m[i])); }, 0);
      chk(name, 'RCN-EEIC by Month', `its total is the funded topline for ${scope.join(', ')}`,
        money(lastNum(rc[t])), money(want));
      // ...and the sheet must SAY that is its scope. A row labelled "ALL SERVICES" on a board with
      // services outside the list sends a reader hunting for money that was never in scope.
      const label = String((rc[t] || [])[0] ?? '');
      const covers = scope.length === F.svc.length;
      chk(name, 'RCN-EEIC by Month', 'and its total row names the scope it actually covers',
        (covers || !/ALL SERVICES/.test(label) || scope.every(sv => label.includes(sv)))
          ? 'named' : `claims "${label.trim()}" but covers only ${scope.join(', ')}`, 'named');
    }
  }
  {
    // The forecast prints $M to one decimal, so compare at that precision and say so.
    const fcName = Object.keys(book).filter(k => /Forecast/.test(k))[0] || '';
    chk(name, 'Forecast', 'the forecast sheet was found', fcName || 'MISSING', fcName || 'a sheet');
    const fc = rowsOf(fcName);
    const tots = fc.filter(r => String((r || [])[0] ?? '').trim() === 'TOTAL').map(lastNum);
    chk(name, 'Forecast', 'a PLAN A total matches the discretionary draw, in $M',
      tots.some(v => Math.abs(v - board.disc / 1e6) < 0.06) ? 'matches' : `none of ${tots.join(', ')}`,
      'matches');
    chk(name, 'Forecast', 'a PLAN B total matches the funded topline, in $M',
      tots.some(v => Math.abs(v - (board.disc + board.mand) / 1e6) < 0.06) ? 'matches'
        : `none of ${tots.join(', ')}`, 'matches');
  }
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ══ 5. EVERY ROW CHECKS ITSELF ═════════════════════════════════════════════════════════════════
// Most sheets print a figure and then break it out per service. Wherever that shape appears, the
// breakout must add back to the figure beside it -- on EVERY row, not just the total. This is the
// check that catches a per-service vector that was written from one requirement and a total that
// was written from another: both are individually plausible and the row does not close.
const rowCloses = (name, wb) => {
  let rowsChecked = 0, sheetsChecked = 0;
  for (const [sheet, rows] of Object.entries(wb)) {
    (rows || []).forEach((hdrRow, h) => {
      const hdr = (hdrRow || []).map(c => String(c ?? '').trim());
      // A header row for this purpose: it names EVERY service of the board, in order, ending the
      // run. The cell immediately before that run is the figure they break out.
      // A run of service columns, either bare ("USAF") or suffixed ("USAF funded"). The suffixed
      // form is how the spend plans break out, and matching only the bare form left those sheets
      // unexamined -- which is how six columns named "<SVC> allocated" came to disagree with the
      // Allocated column beside them by 6.25M without any check noticing.
      const runAt = (k0) => {
        const c0 = String(hdr[k0] ?? '');
        if (!c0.startsWith(F.svc[0])) return null;
        const suffix = c0.slice(F.svc[0].length);
        return F.svc.every((sv, k) => String(hdr[k0 + k] ?? '') === sv + suffix) ? suffix : null;
      };
      // A ROW CAN CARRY SEVERAL RUNS. The spend plans carry two -- "<SVC> asked" and "<SVC> funded"
      // -- and the first version stopped at the first run it could not resolve a total column for,
      // abandoning the row and never looking at the second. It reported "0 breakout blocks" on the
      // very sheet whose breakout had just been found wrong.
      const runs = [];
      for (let k = 1; k < hdr.length; k++) {
        const sfx = runAt(k);
        if (sfx === null) continue;
        let totCol = k - 1;
        if (sfx.trim()) {
          const want = sfx.trim().toLowerCase();
          let named = hdr.findIndex((h, j) => j < k && String(h ?? '').trim().toLowerCase() === want);
          if (named < 0) named = hdr.findIndex((h, j) => j < k
            && new RegExp('^' + want + '\\b', 'i').test(String(h ?? '').trim()));
          if (named < 0) continue;                 // nothing on this row claims to be its total
          totCol = named;
        }
        if (!hdr[totCol] || /^(PID|CCaR|Plan Event|PMO|Rank|Status|Band)/i.test(hdr[totCol])) continue;
        runs.push({ first: k, suffix: sfx, totCol });
        k += F.svc.length - 1;
      }
      if (!runs.length) return;
      runs.forEach(({ first, suffix, totCol }) => {
      sheetsChecked++;
      for (let r = h + 1; r < rows.length; r++) {
        const row = rows[r] || [];
        const label = String(row[0] ?? '').trim();
        if (!label) break;                                  // the block ended
        if (/^(Rank|Service)$/i.test(label)) break;         // a new header: a different block
        const tot = num(row[totCol]);
        const parts = F.svc.map((_, k) => num(row[first + k]));
        if (tot === null || parts.some(v => v === null)) continue;
        rowsChecked++;
        chk(name, `${sheet} · ${hdr[totCol]}`,
          `row "${label.slice(0, 30)}": its ${F.svc.length} "${(F.svc[0] + suffix)}" columns add back to it`,
          money(T(parts)), money(tot));
      }
      });
    });
  }
  return { rowsChecked, sheetsChecked };
};
{
  const r = rowCloses('5 row closes', book);
  chk('5 row closes', 'coverage', 'the check found breakout blocks to examine',
    r.sheetsChecked > 0 ? 'found' : 'NONE', 'found');
  console.log(`  [row closes] exportExcel: ${r.rowsChecked} row(s) across ${r.sheetsChecked} block(s)`);
}

// ══ 6. THE UNFUNDED SHEET IS THE ONE LEADERSHIP READS ══════════════════════════════════════════
// It states the same decomposition as Funding Streams in different words, so the two must agree
// exactly -- and its own columns must close.
{
  const name = '6 unfunded sheet';
  try {
  const rows = book['Unfunded Requirements'] || [];
  const hdr = headerRow(rows, 'FY27 Ask', 'Allocated');
  const tot = rows.findIndex(r => String((r || [])[0] ?? '').trim() === 'TOTAL');
  chk(name, 'shape', 'the sheet has a header and a TOTAL',
    (hdr >= 0 && tot > hdr) ? 'yes' : `hdr ${hdr} total ${tot}`, 'yes');
  if (hdr >= 0 && tot > hdr) {
    const g = h => { const c = colOf(rows, hdr, h); return c < 0 ? null : num((rows[tot] || [])[c]); };
    const R = Object.values(F.rows);
    const ask = T(R.map(r => T(r.ask))), trim = T(R.map(r => T(r.trim)));
    const beyond = T(R.map(r => T(r.beyond))), unf = T(R.map(r => T(r.unf)));
    const disc = T(R.map(r => T(r.d)));
    chk(name, 'identity', 'Ask = Allocated + Trim', money(g('Allocated') + g('Trim, by service')), money(g('FY27 Ask')));
    chk(name, 'identity', 'TOTAL Unfunded = Trim + Beyond',
      money(g('Trim, by service') + g('Beyond Both Lanes')), money(g('TOTAL Unfunded')));
    chk(name, 'agreement', 'its Ask agrees with the board', money(g('FY27 Ask')), money(ask));
    chk(name, 'agreement', 'its Trim agrees with the board', money(g('Trim, by service')), money(trim));
    chk(name, 'agreement', 'its Beyond agrees with the board', money(g('Beyond Both Lanes')), money(beyond));
    chk(name, 'agreement', 'its TOTAL Unfunded agrees with the board', money(g('TOTAL Unfunded')), money(unf));
    chk(name, 'agreement', 'its Unfunded vs DISC is ask − disc', money(g('Unfunded vs DISC')), money(ask - disc));
  }
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ══ 7. MISSION CRITICAL, WHICH IS A MEMO AND MUST NEVER BE ADDED TO A LANE ═════════════════════
{
  const name = '7 mission critical';
  try {
  const rows = book['Mission Critical'] || [];
  const hdr = headerRow(rows, 'Rank', 'PMO');
  const tot = rows.findIndex(r => String((r || [])[0] ?? '').trim() === 'TOTAL');
  chk(name, 'shape', 'the sheet has a header and a TOTAL',
    (hdr >= 0 && tot > hdr) ? 'yes' : `hdr ${hdr} total ${tot}`, 'yes');
  if (hdr >= 0 && tot > hdr) {
    const R = Object.values(F.rows).filter(r => r.mc);
    const g = h => { const c = colOf(rows, hdr, h); return c < 0 ? null : num((rows[tot] || [])[c]); };
    chk(name, 'agreement', 'the memo value is the starred requirements’ own value',
      money(g('MC requirement (memo — not additive)')), money(T(R.map(r => T(r.ask)))));
    chk(name, 'agreement', 'the shortfall is measured against DISCRETIONARY alone',
      money(g('★ Short vs DISC')), money(T(R.map(r => T(r.discUnf)))));
    // THE RULE, as arithmetic: mandatory is never netted off the star. If it were, the shortfall
    // would come out as ask − disc − mand, which is the OTHER reading and a smaller number.
    const netted = T(R.map(r => T(r.unf)));
    chk(name, 'rule', 'mandatory is NOT netted off the star',
      (Math.abs(g('★ Short vs DISC') - netted) < 0.005
        && Math.abs(T(R.map(r => T(r.discUnf))) - netted) > 0.005) ? 'NETTED' : 'not netted',
      'not netted');
  }
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ══ 8. THE SAME TOTALS SURVIVE A SAVE, A REOPEN AND A PMO COPY ═════════════════════════════════
// Arithmetic that is right on this board and different after a round trip is still a wrong number
// in front of someone. Same figures, three files.
{
  const name = '8 survives the file';
  try {
  const topline = ev(`(function(){ const T=tiers(), t=tierTotals(T);
    return [Math.round(t.dUsed), Math.round(t.mUsed), Math.round(t.uAmt)].join('/'); })()`);
  const reopened = boot({ html: ev('buildSavedHtml()') });
  chk(name, 'save → reopen', 'the toplines are identical after a reopen',
    reopened.ev(`(function(){ const T=tiers(), t=tierTotals(T);
      return [Math.round(t.dUsed), Math.round(t.mUsed), Math.round(t.uAmt)].join('/'); })()`), topline);
  const copy = boot({ html: ev(String.raw`(function(){
    const mode={sandbox:true, by:'BLL', ts:1763078400000, fy:MS.cur, ap:APPN, base:pmoBaseline()};
    return buildSavedHtml().replace(/(<script type="application\/json" id="pubMode">)[\s\S]*?(<\/script>)/,
      function(m,a,b){ return a + JSON.stringify(mode).replace(/</g,'\\u003c') + b; }); })()`) });
  chk(name, 'PMO copy', 'and identical in the PMO copy',
    copy.ev(`(function(){ const T=tiers(), t=tierTotals(T);
      return [Math.round(t.dUsed), Math.round(t.mUsed), Math.round(t.uAmt)].join('/'); })()`), topline);
  // The copy must also EXPORT the same figures, not merely hold them.
  const copyBook = JSON.parse(await workbook(copy.w));
  const fsRow = 3 + F.svc.length;
  const cOf = (rows, head) => { const c = colOf(rows, 2, head); return c < 0 ? null : num((rows[fsRow] || [])[c]); };
  chk(name, 'PMO copy', 'and its workbook prints the same funded topline',
    money(cOf(copyBook['Funding Streams'] || [], 'Funded Total')),
    money(cOf(book['Funding Streams'] || [], 'Funded Total')));
  chk(name, 'PMO copy', 'and the same unfunded total',
    money(cOf(copyBook['Funding Streams'] || [], 'TOTAL UNFUNDED')),
    money(cOf(book['Funding Streams'] || [], 'TOTAL UNFUNDED')));
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ══ 9. (v2.05, item 114: the deck's block went with the PowerPoint deck.) ═════════════════════════════════════

// ══ 10. THE SAME IDENTITIES ON BOARD SHAPES THAT BREAK DIFFERENT THINGS ════════════════════════
// One fixture proves one arrangement. These are deliberately awkward in different ways: a service
// with NO discretionary at all, a requirement that asks on only one service, an absorber, and a
// board where the pots are larger than the asks so nothing is short.
{
  const shapes = {
    'a service with no discretionary BA': {
      sc: { services: ['USAF', 'ANG', 'AFRC'],
        items: [it('A', 'PSM', [5000000, 2000000, 1000000]), it('B', 'ATL', [1000000, 500000, 250000])],
        disc: [4000000, 0, 600000], mand: [1000000, 900000, 200000], order: ['A', 'B'], mc: { A: true } },
      dress: e => e(`applyState(S); save(); 'ok'`) },
    'a requirement asking on one service only': {
      sc: { services: ['USAF', 'ANG', 'AFRC'],
        items: [it('A', 'PSM', [7000000, 0, 0]), it('B', 'ATL', [0, 1500000, 0]),
                it('C', 'TSS', [0, 0, 900000])],
        disc: [3000000, 1000000, 400000], mand: [1000000, 300000, 200000], order: ['A', 'B', 'C'], mc: { B: true } },
      dress: e => e(`applyState(S); save(); 'ok'`) },
    'pots larger than the asks': {
      sc: { services: ['USAF', 'ANG'],
        items: [it('A', 'PSM', [1000000, 500000]), it('B', 'ATL', [250000, 125000])],
        disc: [9000000, 9000000], mand: [9000000, 9000000], order: ['A', 'B'], mc: { A: true } },
      dress: e => e(`applyState(S); save(); 'ok'`) },
    'an absorber carrying the shortfall': {
      sc: { services: ['USAF', 'ANG', 'AFRC'],
        items: [it('A', 'PSM', [6000000, 1200000, 800000]), it('B', 'ATL', [2000000, 400000, 300000]),
                it('C', 'TSS', [1000000, 200000, 150000])],
        disc: [5000000, 900000, 500000], mand: [1500000, 300000, 200000], order: ['A', 'B', 'C'] },
      dress: e => e(`S.absorb='C'; S.absorbFloor=0; applyState(S); save(); 'ok'`) },
  };
  for (const [label, { sc: s2, dress: d2 }] of Object.entries(shapes)) {
    const B = boot();
    seed(B.ev, s2);
    B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); 'ok'`);
    d2(B.ev);
    const G = boardFigures(B.ev);
    const name = '10 ' + label;
    Object.keys(G.rows).forEach(id => {
      const r = G.rows[id];
      G.svc.forEach((sv, i) => {
        chk(name, id, `${sv}: disc + mand + beyond + trim = ask`,
          money(r.d[i] + r.m[i] + r.beyond[i] + r.trim[i]), money(r.ask[i]));
        chk(name, id, `${sv}: TOTAL unfunded = ask − disc − mand`,
          money(r.unf[i]), money(Math.max(0, r.ask[i] - r.d[i] - r.m[i])));
        chk(name, id, `${sv}: unfunded vs DISC = ask − disc`,
          money(r.discUnf[i]), money(Math.max(0, r.ask[i] - r.d[i])));
        chk(name, id, `${sv}: nothing is negative`,
          [r.d[i], r.m[i], r.beyond[i], r.trim[i], r.unf[i]].every(v => v >= -0.005) ? 'ok' : 'NEGATIVE', 'ok');
      });
    });
    G.svc.forEach((sv, i) => {
      const d = Object.values(G.rows).reduce((a, r) => a + r.d[i], 0);
      const m = Object.values(G.rows).reduce((a, r) => a + r.m[i], 0);
      chk(name, sv, 'discretionary drawn never exceeds the BA',
        d <= G.discBA[i] + 0.005 ? 'within' : `OVER by ${money(d - G.discBA[i])}`, 'within');
      chk(name, sv, 'mandatory drawn never exceeds the BA',
        m <= G.mandBA[i] + 0.005 ? 'within' : `OVER by ${money(m - G.mandBA[i])}`, 'within');
    });
    // ...and the workbook it exports still prints those same figures.
    const bk = JSON.parse(await workbook(B.w));
    const fs = bk['Funding Streams'] || [], tr = 3 + G.svc.length;
    const c = h => { const i = colOf(fs, 2, h); return i < 0 ? null : num((fs[tr] || [])[i]); };
    const RR = Object.values(G.rows);
    chk(name, 'workbook', 'its ask agrees with the board', money(c('FY27 Ask')), money(T(RR.map(r => T(r.ask)))));
    chk(name, 'workbook', 'its funded total agrees', money(c('Funded Total')),
      money(T(RR.map(r => T(r.d))) + T(RR.map(r => T(r.m)))));
    chk(name, 'workbook', 'its unfunded agrees', money(c('TOTAL UNFUNDED')), money(T(RR.map(r => T(r.unf)))));
  }
}

// ══ 11. EVERY OTHER EXPORTABLE PRODUCT ═════════════════════════════════════════════════════════
// exportExcel and the deck are not the only things that leave this board. There are thirteen export
// paths plus the change report, and anything with a figure on it can be briefed. Each one that
// produces a workbook is read back and put through the same two rules: a per-service breakout adds
// back to the figure it breaks out, and a portfolio total is the portfolio's total.
//
// This is how six columns headed "<SVC> allocated" on the Two Spend Plans were found disagreeing
// with the "Allocated" column beside them by $6.25M. Both were right; they were different
// quantities sharing a word, and no check had ever opened that workbook.
{
  const name = '11 every product';
  try {
  const R = Object.values(F.rows);
  const truth = {
    ask:    T(R.map(r => T(r.ask))),
    disc:   T(R.map(r => T(r.d))),
    mand:   T(R.map(r => T(r.m))),
    funded: T(R.map(r => T(r.d))) + T(R.map(r => T(r.m))),
    unf:    T(R.map(r => T(r.unf))),
    // READING #1 board-wide: ask less DISCRETIONARY alone.
    discUnf: T(R.map(r => T(r.discUnf))),
  };
  const grab = (fn) => w.eval(`(async function(){
    var cap=null,_B=window.Blob,msg='';
    window.alert=function(m){ msg+=String(m); }; window.confirm=function(){ return true; };
    window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
    try{ if(typeof ${fn}!=='function') { window.Blob=_B; return JSON.stringify({state:'absent'}); }
         ${fn}(); }catch(e){ window.Blob=_B; return JSON.stringify({state:'threw', msg:String((e&&e.message)||e)}); }
    window.Blob=_B;
    if(!cap) return JSON.stringify({state:'refused', msg:msg.slice(0,80)});
    var ab=cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength);
    try{ return JSON.stringify({state:'ok', sheets: await xlsxRead(ab)}); }
    catch(e){ return JSON.stringify({state:'unreadable', msg:String((e&&e.message)||e)}); } })()`);

  // Products that carry money and produce a workbook. Each is named so a new export added to the
  // board and left off this list shows up as a gap rather than as silence.
  // EXPORT EACH PRODUCT EXACTLY ONCE and check off that capture. Exporting a second time later in
  // the run is not free: several of these set view state on the way through, and the first version
  // of this block re-ran exportCSV after five other exports and read a different workbook back.
  const PRODUCTS = ['exportCSV', 'exportPlans', 'exportSrc'];   // v2.19 (item 150): the chart of accounts and the funds flow are gone
  const made = {};
  for (const fn of PRODUCTS) {
    const got = JSON.parse(await grab(fn));
    made[fn] = got;
    // A product that refuses because its input is absent is behaving correctly -- but it must SAY
    // so rather than emit an empty file, and the suite records which it was.
    chk(name, fn, 'it either produced a readable workbook or refused with a reason',
      (got.state === 'ok' || (got.state === 'refused' && got.msg)) ? 'ok' : `${got.state} ${got.msg || ''}`, 'ok');
    if (got.state !== 'ok') { console.log(`  [${fn}] ${got.state}${got.msg ? ': ' + got.msg.slice(0, 60) : ''}`); continue; }
    const r = rowCloses(`11 ${fn}`, got.sheets);
    console.log(`  [${fn}] ${Object.keys(got.sheets).length} sheet(s), `
      + `${r.rowsChecked} breakout row(s) across ${r.sheetsChecked} block(s)`);
  }

  // ── THE PRIORITY DRILL is a briefing product in its own right, and it states the portfolio.
  {
    const got = made['exportCSV'] || {};
    chk(name, 'exportCSV', 'the priority drill builds', got.state, 'ok');
    if (got.state === 'ok') {
      const sheets = got.sheets;
      const band = sheets['1-N by Band'] || [];
      // THIS TAB HAS NO GRAND TOTAL: it prints one subtotal per band and one for the unbanded, and
      // together they are the portfolio. So add them up -- which is also the check that no
      // requirement is counted twice or dropped between bands.
      const hdr = band.findIndex(r => String((r || [])[0] ?? '').trim() === 'Rank');
      const subs = band.filter(r => /^Subtotal/.test(String((r || [])[0] ?? '')));
      chk(name, 'exportCSV', 'its 1-N by Band tab has a header and band subtotals',
        (hdr >= 0 && subs.length) ? 'found' : `hdr ${hdr}, ${subs.length} subtotals`, 'found');
      if (hdr >= 0 && subs.length) {
        // By column NAME, and never the percentage column -- adding percentages is meaningless and
        // would make this check pass or fail for the wrong reason.
        const colSum = h => { const c = colOf(band, hdr, h);
          return c < 0 ? null : T(subs.map(r => num(r[c]) || 0)); };
        chk(name, 'exportCSV', 'the band subtotals add to the portfolio ask',
          money(colSum('FY27 Requirement')), money(truth.ask));
        chk(name, 'exportCSV', 'and to the discretionary draw',
          money(colSum('Discretionary')), money(truth.disc));
        chk(name, 'exportCSV', 'and to the mandatory draw',
          money(colSum('Mandatory')), money(truth.mand));
        chk(name, 'exportCSV', 'and to the funded topline',
          money(colSum('Funded')), money(truth.funded));
        chk(name, 'exportCSV', 'and to the unfunded total',
          money(colSum('Unfunded')), money(truth.unf));
        // BOTH READINGS on the drill's subtotals. 'Unfunded vs DISC' is a MONEY column, so padding
        // it in the subtotal row instead of printing a figure leaves the second reading blank on
        // every band while the first stays filled -- the tab still opens and still cross-foots.
        chk(name, 'exportCSV', 'and to the unfunded-vs-discretionary total',
          money(colSum('Unfunded vs DISC')), money(truth.discUnf));
        chk(name, 'exportCSV', 'its two unfunded readings differ by the mandatory draw',
          money(colSum('Unfunded vs DISC') - colSum('Unfunded')), money(truth.mand));
        // Funded must also equal Discretionary + Mandatory on the tab's own figures.
        chk(name, 'exportCSV', 'its Funded is its own Discretionary + Mandatory',
          money(colSum('Discretionary') + colSum('Mandatory')), money(colSum('Funded')));
      }
      // The per-PMO tabs must add back to the portfolio, or a PMO is briefing a share of a
      // different board.
      const pmoTabs = Object.keys(sheets).filter(k => !/^Summary$|^1-N by Band$/.test(k));
      const byCol = {};
      pmoTabs.forEach(k => {
        const s2 = sheets[k] || [];
        const row = s2.find(r => /^Subtotal/.test(String((r || [])[0] ?? '')));
        (row || []).forEach((c, i) => { const v = num(c); if (v !== null) (byCol[i] ||= []).push(v); });
      });
      chk(name, 'exportCSV', 'it has a tab per PMO', pmoTabs.length > 0 ? 'yes' : 'none', 'yes');
      const sums = Object.values(byCol).map(a => Math.round(T(a)));
      chk(name, 'exportCSV', 'the PMO tabs’ asks add back to the portfolio ask',
        sums.includes(Math.round(truth.ask)) ? 'adds back' : `no column sums to ${Math.round(truth.ask)}`, 'adds back');
      chk(name, 'exportCSV', 'and their funded adds back to the funded topline',
        sums.includes(Math.round(truth.funded)) ? 'adds back' : 'does not', 'adds back');
    }
  }

  // ── THE TWO SPEND PLANS. Its own note promises two identities; hold it to both.
  {
    const got = made['exportPlans'] || {};
    chk(name, 'exportPlans', 'the two spend plans build', got.state, 'ok');
    if (got.state === 'ok') {
      Object.entries(got.sheets).forEach(([sheet, rows]) => {
        const hdr = headerRow(rows, 'Rank', 'Allocated');
        const tot = rows.findIndex(r => /^TOTAL/.test(String((r || [])[0] ?? '')));
        if (/^A vs B$/.test(sheet)) return;      // the comparison tab is a summary: no TOTAL row
        chk(name, `exportPlans · ${sheet}`, 'its header and TOTAL row were found',
          (hdr >= 0 && tot > hdr) ? 'found' : `hdr ${hdr}, total ${tot}`, 'found');
        if (hdr < 0 || tot < 0) return;
        const g = h => { const c = colOf(rows, hdr, h); return c < 0 ? null : num((rows[tot] || [])[c]); };
        // The sheet's own words: "DISC ALLOCATED plus MAND ALLOCATED always adds back to it".
        // ON EVERY ROW, not only the total. The total is summed independently of the detail rows,
        // so a detail row can be wrong while the total stays right -- both halves individually
        // defensible, which is how a spreadsheet comes apart in front of a room.
        {
          const cA = colOf(rows, hdr, 'Allocated'), cD = colOf(rows, hdr, 'Disc allocated'),
                cM = colOf(rows, hdr, 'Mand allocated');
          chk(name, `exportPlans · ${sheet}`, 'the three allocation columns are present',
            (cA >= 0 && cD >= 0 && cM >= 0) ? 'present' : `${cA}/${cD}/${cM}`, 'present');
          let seen = 0;
          for (let r = hdr + 1; r <= tot; r++) {
            const row = rows[r] || [];
            const a = num(row[cA]), d = num(row[cD]), m = num(row[cM]);
            if (a === null || d === null || m === null) continue;
            seen++;
            chk(name, `exportPlans · ${sheet}`,
              `row ${r}: Disc allocated + Mand allocated = Allocated`, money(d + m), money(a));
          }
          chk(name, `exportPlans · ${sheet}`, 'and there were rows to check',
            seen > 1 ? 'checked ' + seen : `only ${seen}`, 'checked ' + seen);
        }
        // ...and the per-service ASKED columns are this plan's own base: funded + short.
        const fundedCol = (rows[hdr] || []).findIndex(c => /^Funded from/i.test(String(c ?? '')));
        const funded = fundedCol < 0 ? null : num((rows[tot] || [])[fundedCol]);
        const short = g('Short');
        const asked = F.svc.map(sv => { const c = colOf(rows, hdr, sv + ' asked');
          return c < 0 ? null : num((rows[tot] || [])[c]); });
        chk(name, `exportPlans · ${sheet}`, 'the per-service asked columns are named for what they hold',
          asked.every(v => v !== null) ? 'named' : 'missing "<service> asked"', 'named');
        if (asked.every(v => v !== null) && funded !== null && short !== null)
          chk(name, `exportPlans · ${sheet}`, 'per service, asked = funded + short',
            money(T(asked)), money(funded + short));
        const fundedSvc = F.svc.map(sv => { const c = colOf(rows, hdr, sv + ' funded');
          return c < 0 ? null : num((rows[tot] || [])[c]); });
        if (fundedSvc.every(v => v !== null) && funded !== null)
          chk(name, `exportPlans · ${sheet}`, 'and the per-service funded columns add back to Funded',
            money(T(fundedSvc)), money(funded));
      });
    }
  }
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}


// ── shared by the blocks below ─────────────────────────────────────────────────────────────────
const _sum = a => a.reduce((x, y) => x + y, 0);
const _fundedOf = id => _sum(F.rows[id].d) + _sum(F.rows[id].m);
const _funded = _sum(Object.keys(F.rows).map(_fundedOf));
const grabX = (fn) => w.eval(`(async function(){
  var cap=null,_B=window.Blob,msg='';
  window.alert=function(m){ msg+=String(m); }; window.confirm=function(){ return true; };
  window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
  try{ ${fn}(); }catch(e){ window.Blob=_B; return JSON.stringify({state:'threw', msg:String((e&&e.message)||e)}); }
  window.Blob=_B;
  if(!cap) return JSON.stringify({state:'refused', msg:msg.slice(0,80)});
  var ab=cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength);
  try{ return JSON.stringify({state:'ok', sheets: await xlsxRead(ab)}); }
  catch(e){ return JSON.stringify({state:'unreadable', msg:String((e&&e.message)||e)}); } })()`);

// v2.19 (item 150): removed with its feature -- the funds flow

// v2.19 (item 150): removed with its feature -- the chart of accounts

// (14, the reprogramming log, went with the ATR/BTR tracker in v2.02: exportReprog no longer exists.)

// v2.19 (item 150): removed with its feature -- the ACE tie-out

// ══ 16. CR CASH NEEDS — THE SHEET CROSS-FOOTS ══════════════════════════════════════════════════
// crData()'s own arithmetic -- the twelve half-month windows, the flip to 16-EOM, increments and
// the no-date bucket -- is proved in audit-board.mjs on a fixture built for it. This is the sheet
// that prints it: every service row is crData's, TOTAL is the services added, CUMULATIVE runs.
{
  const name = 'CR cash needs — the sheet cross-foots';
  try {
  const cr = book['CR Cash Needs'] || [];
  const crd = JSON.parse(ev(`JSON.stringify(crData().map(function(s){ return {win:s.win, nodate:s.nodate, tot:s.tot}; }))`));
  const hdr = headerRow(cr, 'Service / Requirement', 'No date', 'TOTAL IN WINDOW');
  const cND = colOf(cr, hdr, 'No date'), cT = colOf(cr, hdr, 'TOTAL IN WINDOW');
  chk(name, 'shape', 'the sheet has its header', hdr >= 0 ? 'yes' : 'no', 'yes');
  F.svc.forEach((sv, i) => {
    const row = cr.find((r, j) => j > hdr && (r || [])[0] === sv) || [];
    for (let w = 0; w < 12; w++) chk(name, sv, 'window ' + (w + 1) + ' is crData’s', num(row[1 + w]), crd[i].win[w]);
    chk(name, sv, 'No date is crData’s', num(row[cND]), crd[i].nodate);
    chk(name, sv, 'its total is the sum of its windows', num(row[cT]), _sum(crd[i].win));
  });
  const tot = cr.find((r, j) => j > hdr && (r || [])[0] === 'TOTAL') || [];
  for (let w = 0; w < 12; w++) chk(name, 'TOTAL', 'window ' + (w + 1) + ' is the services added', num(tot[1 + w]), _sum(crd.map(s => s.win[w])));
  chk(name, 'TOTAL', 'No date is the services added', num(tot[cND]), _sum(crd.map(s => s.nodate)));
  const cum = cr.find((r, j) => j > hdr && String((r || [])[0] ?? '').startsWith('CUMULATIVE')) || [];
  let run = 0;
  for (let w = 0; w < 12; w++) { run += _sum(crd.map(s => s.win[w])); chk(name, 'CUMULATIVE', 'through window ' + (w + 1), num(cum[1 + w]), run); }
  // only A carries an award date on this board; every other funded dollar has no date
  chk(name, 'No date', 'is the funded money of every requirement without an award date',
    num(tot[cND]), _sum(['B', 'C', 'D', 'E'].map(_fundedOf)));
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ══ 17. THE FIVE-YEAR SPEND PLAN ═══════════════════════════════════════════════════════════════
// v2.04, item 112 (Brad, 22 Oct 2026): a Summary, a tab per appropriation, per service and per PMO; the base year and the
// next four; Requirement and Allocated (discretionary + mandatory drawn, every service added) in $M; the requirements in
// 1-N order under their CCaR record, printed once, "No CCaR record" last; line totals at the right, TOTAL at the bottom.
// Every figure is re-derived here from the engine -- tiers() and the asks, read year by year through aceWithYear, the
// figures a lock takes -- and the tab is read back from the workbook's own bytes as blocks of lines, so a line out of
// order, a record printed twice, a service's dollars on the wrong tab or a year read twice all fail. A year the plan does
// not hold prints —, never 0. C moves office in the second year: a PMO tab carries a requirement for the years its office
// held it, 0 for the others. Then PB is locked and a value moves: the locked plan prints the figure AS LOCKED, and the
// picker starts on the plan on screen.
{
  const name = 'the five-year spend plan';
  try {
  const cur = +ev('MS.cur'), key = 'PB|' + cur, fyl = y => 'FY' + (y % 100), J = JSON.stringify;
  const snap = ev('JSON.stringify(S)'), base0 = ev('JSON.stringify(MS.base===undefined? null : MS.base)');
  const A1 = [18000000, 4000000, 2000000, 8000000, 3000001, 0];      // A next year: doubled, odd dollar kept
  const cGrp0 = ev(`grpOf(itemById('C'))`), cGrp1 = cGrp0 === 'ATL' ? 'TSS' : 'ATL';
  const dCcar0 = ev(`JSON.stringify([itemById('D').ccar, (S.ccar||{}).D===undefined? null : S.ccar.D])`);   // D carries no record here
  const bAskOrig = _sum(JSON.parse(ev(`JSON.stringify(itemById('B').ask)`)));
  // the last service carries nothing in this block, in either year: a service with no money gets no tab
  ev(`S.grp['E']='PSM'; itemById('D').ccar=''; if(S.ccar) delete S.ccar.D;
      S.order.forEach(function(id){ var a=itemById(id).ask.slice(); a[a.length-1]=0; S.asks[id]=a; }); applyState(S); MS.years[MS.cur]=S; MS.base=MS.cur;
      var y1=JSON.parse(JSON.stringify(S)); y1.asks=Object.assign({}, y1.asks||{}, {A:${J(A1)}}); y1.grp=Object.assign({}, y1.grp||{}, {C:${J(cGrp1)}}); delete y1.pmoOrder;
      MS.years[MS.cur+1]=y1; save(); 'ok'`);
  // the engine's reading of a year: per requirement its office, CCaR, title and the per-service ask and lane draw
  const ENGINE = `function(){ var T=tiers(), o={svc:SVC.slice(), order:S.order.slice(), rows:{}};
      S.order.forEach(function(id){ var it=itemById(id), p=T[id]; if(!it||!p) return;
        o.rows[id]={title:dispTitle(it), grp:grpOf(it), ccar:String(ccarOf(it)||'').replace(/\\s+/g,' ').trim(), ask:SVC.map(function(_,i){ return it.ask[i]||0; }),
          fund:SVC.map(function(_,i){ return (p.d[i]||0)+(p.m[i]||0); })}; });
      return JSON.stringify(o); }`;
  const Y = [cur, cur + 1, cur + 2, cur + 3, cur + 4], held = [cur, cur + 1], span = fyl(Y[0]) + '–' + fyl(Y[4]);
  const E = { [cur]: JSON.parse(ev(`(${ENGINE})()`)), [cur + 1]: JSON.parse(ev(`aceWithYear(MS.cur+1, ${ENGINE})`)) };
  const ids = E[cur].order, SV = E[cur].svc;
  chk(name, 'fixture', 'the fixture allocates beyond the lanes somewhere, so Requirement and Allocated differ',
    ids.some(id => _sum(E[cur].rows[id].ask) !== _sum(E[cur].rows[id].fund)) ? 'yes' : 'no', 'yes');
  chk(name, 'fixture', 'C moves office in the second year', E[cur].rows.C.grp + '→' + E[cur + 1].rows.C.grp, cGrp0 + '→' + cGrp1);
  chk(name, 'fixture', 'next year differs from this year, so a report that reads one year twice cannot pass', _sum(E[cur + 1].rows.A.ask) !== _sum(E[cur].rows.A.ask), true);
  chk(name, 'fixture', 'some requirement carries no CCaR record and two share none', ids.filter(id => !E[cur].rows[id].ccar).length >= 1, true);
  // ---- the oracle: a block of lines under a filter, in whole dollars
  const val = (id, y, f) => { if (held.indexOf(y) < 0) return null; const r = E[y].rows[id]; if (!r) return [0, 0];
    if (f && f.pmo !== undefined) return r.grp === f.pmo ? [_sum(r.ask), _sum(r.fund)] : [0, 0];
    if (f && f.svc !== undefined) { const i = SV.indexOf(f.svc); return [r.ask[i] || 0, r.fund[i] || 0]; }
    return [_sum(r.ask), _sum(r.fund)]; };
  const has = (id, f) => held.some(y => { const r = E[y].rows[id]; if (!r) return false;
    if (f && f.pmo !== undefined) return r.grp === f.pmo;
    if (f && f.svc !== undefined) { const v = val(id, y, f); return v[0] !== 0 || v[1] !== 0; }
    return true; });
  const expBlock = f => {
    const these = ids.filter(id => has(id, f)), recs = [], by = {}, loose = [];
    these.forEach(id => { const c = E[cur + 1].rows[id].ccar; if (!c) { loose.push(id); return; } const k = c.toUpperCase(); if (!by[k]) { by[k] = { rec: c, ids: [] }; recs.push(k); } by[k].ids.push(id); });
    const groups = recs.map(k => by[k]); if (loose.length) groups.push({ rec: 'No CCaR record', ids: loose });
    const lines = [], tot = { fy: {}, t: [0, 0] };
    Y.forEach(y => { tot.fy[y] = held.indexOf(y) < 0 ? '—' : [0, 0]; });
    groups.forEach(g => g.ids.forEach((id, n) => { const L = { rec: n ? '' : g.rec, title: E[cur + 1].rows[id].title, fy: {}, t: [0, 0] };
      Y.forEach(y => { const v = val(id, y, f); L.fy[y] = v || '—'; if (v) { L.t[0] += v[0]; L.t[1] += v[1]; tot.fy[y][0] += v[0]; tot.fy[y][1] += v[1]; } });
      tot.t[0] += L.t[0]; tot.t[1] += L.t[1]; lines.push(L); }));
    return { lines, tot };
  };
  // ---- reading the workbook back: a block is its two heading rows, its lines, its TOTAL
  const $ = v => { const n = num(v); return n === null ? String(v ?? '') : Math.round(n * 1e6); };
  const figsAt = (rows, h, r) => { const o = {}; Y.forEach(y => { const c = rows[h].indexOf(fyl(y)); o[y] = c < 0 ? 'no column' : (String(r[c] ?? '') === '—' ? '—' : [$(r[c]), $(r[c + 1])]); });
    const ct = rows[h].indexOf('TOTAL ' + span); return { fy: o, t: ct < 0 ? 'no column' : [$(r[ct]), $(r[ct + 1])] }; };
  const blocksOf = rows => rows.map((r, i) => i).filter(i => String((rows[i] || [])[0] ?? '') === 'CCaR Record' && String((rows[i] || [])[1] ?? '') === 'Requirement Title').map(h => {
    const lines = []; let i = h + 2, tot = null;
    for (; i < rows.length; i++) { const r = rows[i] || [];
      if (String(r[0] ?? '') === 'TOTAL') { tot = figsAt(rows, h, r); break; }
      const g = figsAt(rows, h, r); lines.push({ rec: String(r[0] ?? ''), title: String(r[1] ?? ''), fy: g.fy, t: g.t }); }
    return { lines, tot: tot ? { fy: tot.fy, t: tot.t } : 'no TOTAL row' }; });
  const rollsOf = (rows, lbl) => rows.map((r, i) => i).filter(i => String((rows[i] || [])[0] ?? '') === lbl && !String((rows[i] || [])[1] ?? '')).map(h => {
    const out = {}; for (let i = h + 2; i < rows.length; i++) { const r = rows[i] || []; const n = String(r[0] ?? ''); if (!n) break; out[n] = figsAt(rows, h, r); if (n === 'TOTAL') break; }
    return out; });
  const expRoll = items => { const o = {}; const T = { fy: {}, t: [0, 0] }; Y.forEach(y => { T.fy[y] = held.indexOf(y) < 0 ? '—' : [0, 0]; });
    items.forEach(([n, b]) => { o[n] = { fy: b.tot.fy, t: b.tot.t }; Y.forEach(y => { if (T.fy[y] !== '—') { T.fy[y][0] += b.tot.fy[y][0]; T.fy[y][1] += b.tot.fy[y][1]; } }); T.t[0] += b.tot.t[0]; T.t[1] += b.tot.t[1]; });
    o.TOTAL = T; return o; };
  // ---- the working plan
  const app = ev(`appnName(mySlug())`);
  ev(`fydpSrc='working'; 'ok'`);
  const W = JSON.parse(await grabX('exportFydpPlan'));
  chk(name, 'workbook', 'the working plan’s workbook builds', W.state, 'ok');
  const names = Object.keys(W.sheets || {});
  const svcs = SV.filter(s => ids.some(id => has(id, { svc: s }))), offices = [...new Set(held.flatMap(y => ids.map(id => E[y].rows[id].grp)))];
  const offOrder = JSON.parse(ev(`JSON.stringify(pmoKeys(${J(Object.fromEntries(offices.map(g => [g, 1])))}))`));
  chk(name, 'tabs', 'Summary first, then this appropriation, then a tab per service with money, then a tab per office',
    J(names.filter(n => n === 'Summary' || n === app || SV.indexOf(n) >= 0 || offices.indexOf(n) >= 0)), J(['Summary', app].concat(svcs).concat(offOrder)));
  chk(name, 'tabs', 'no tab for a sheet the new workbook replaced', names.filter(n => /^(By Requirement|By PMO|By Service)$/.test(n)).length, 0);
  const at = W.sheets[app] || [];
  chk(name, 'title', 'the appropriation tab is titled with its appropriation', String((at[0] || [])[0] ?? ''), 'FYDP SPEND PLAN — ' + app.toUpperCase());
  chk(name, 'title', 'the subtitle names the plan, the span and the units', /^the working plan  ·  /.test(String((at[1] || [])[0] ?? '')) && String((at[1] || [])[0]).indexOf(span + '  ·  $ in millions') > 0, true);
  const ab = blocksOf(at);
  chk(name, 'appropriation', 'the tab holds one block', ab.length, 1);
  chk(name, 'appropriation', 'every requirement, 1-N under its CCaR record printed once, no record last; each year Requirement and Allocated (d+m), — for a year not held; line totals; TOTAL',
    J(ab[0]), J(expBlock(null)));
  chk(name, 'appropriation', 'TOTAL in the year on screen is the funded topline every other surface states', (ab[0] && ab[0].tot.fy && ab[0].tot.fy[cur] || [])[1],
    +ev(`(function(){ var T=tiers(), t=0; S.order.forEach(function(id){ var p=T[id]; if(p) SVC.forEach(function(_,i){ t+=(p.d[i]||0)+(p.m[i]||0); }); }); return t; })()`));
  // services: a roll-up by appropriation, then the block; a requirement the service does not carry is not on it
  svcs.forEach(s => { const rows = W.sheets[s] || [], b = blocksOf(rows), e = expBlock({ svc: s });
    chk(name, 'service ' + s, 'its block is the service’s own dollars, only the requirements it carries', J(b), J([e]));
    chk(name, 'service ' + s, 'its roll-up by appropriation is that block’s total', J(rollsOf(rows, 'Appropriation')), J([expRoll([[app, e]])])); });
  chk(name, 'fixture', 'one service carries nothing, so a service tab can be wrongly drawn for it', SV.length - svcs.length, 1);
  SV.filter(s => svcs.indexOf(s) < 0).forEach(s => chk(name, 'service ' + s, 'a service with no money gets no tab', names.indexOf(s), -1));
  // offices: by each year's office
  offices.forEach(g => { const rows = W.sheets[g] || [], e = expBlock({ pmo: g });
    chk(name, 'PMO ' + g, 'its block files each year under the office that year assigns', J(blocksOf(rows)), J([e])); });
  chk(name, 'PMO', 'C is on both offices’ tabs, with 0 in the year it sat elsewhere',
    J([cGrp0, cGrp1].map(g => (blocksOf(W.sheets[g] || [])[0] || { lines: [] }).lines.filter(L => L.title === E[cur].rows.C.title).map(L => [L.fy[cur], L.fy[cur + 1]]))),
    J([[[val('C', cur, { pmo: cGrp0 }), [0, 0]]], [[[0, 0], val('C', cur + 1, { pmo: cGrp1 })]]]));
  // the service tabs and the office tabs each partition the appropriation's money
  const eAll = expBlock(null);
  chk(name, 'partition', 'the service totals add to the appropriation, each held year',
    J(held.map(y => [0, 1].map(k => _sum(svcs.map(s => expBlock({ svc: s }).tot.fy[y][k]))))), J(held.map(y => eAll.tot.fy[y])));
  // the Summary: by appropriation, the portfolio by year, by service, by PMO
  const sm = W.sheets.Summary || [];
  chk(name, 'summary', 'By appropriation is this appropriation’s block total', J(rollsOf(sm, 'Appropriation')), J([expRoll([[app, eAll]])]));
  chk(name, 'summary', 'By service is each service’s total', J(rollsOf(sm, 'Service')), J([expRoll(svcs.map(s => [s, expBlock({ svc: s })]))]));
  chk(name, 'summary', 'By PMO is each office’s total', J(rollsOf(sm, 'PMO')), J([expRoll(offOrder.map(g => [g, expBlock({ pmo: g })]))]));
  const fh = sm.findIndex(r => String((r || [])[0] ?? '') === 'Fiscal year');
  chk(name, 'summary', 'the portfolio by fiscal year is the TOTAL by year, — for a year not held, and TOTAL',
    J(fh < 0 ? 'no table' : Y.concat(['TOTAL']).map((y, i) => { const r = sm[fh + 1 + i] || []; return [String(r[0] ?? '')].concat(String(r[2] ?? '') === '—' ? ['—'] : [$(r[2]), $(r[3])]); })),
    J(Y.map(y => [fyl(y)].concat(eAll.tot.fy[y] === '—' ? ['—'] : eAll.tot.fy[y])).concat([['TOTAL'].concat(eAll.tot.t)])));
  // ---- the panel prints the same figures, in $M to three decimals
  ev(`fydpOpen=true; fydpSrc='working'; fydpView='sum'; render(); 'ok'`);
  const f3 = v => ev(`fM3(${v})`), panelTot = html => { const t = (/<tr class="tot">([\s\S]*?)<\/tr>/.exec(html) || [])[1] || '';
    return (t.match(/<td class="n[^"]*">([\s\S]*?)<\/td>/g) || []).map(c => c.replace(/<[^>]+>/g, '')); };
  const expCells = b => Y.flatMap(y => b.tot.fy[y] === '—' ? ['—', '—'] : b.tot.fy[y].map(f3)).concat(b.tot.t.map(f3));
  chk(name, 'panel', 'the Summary’s By appropriation TOTAL is the workbook’s, in $M', J(panelTot(ev(`document.getElementById('fydpBody').innerHTML`))), J(expCells(eAll)));
  ev(`fydpSetView('p:'+${J(cGrp1)}); 'ok'`);
  chk(name, 'panel', 'an office’s view is its block, filed by year', J(panelTot(ev(`document.getElementById('fydpBody').innerHTML`))), J(expCells(expBlock({ pmo: cGrp1 }))));
  ev(`fydpSetView('s:'+${J(svcs[0])}); 'ok'`);
  chk(name, 'panel', 'a service’s view is its block', J(panelTot(ev(`document.getElementById('fydpBody').innerHTML`))), J(expCells(expBlock({ svc: svcs[0] }))));
  ev(`fydpOpen=false; render(); 'ok'`);
  // ---- lock PB, then move a value: the locked plan keeps the locked figure, the working plan follows the board
  ev(`blCyc='PB'; blYr=MS.cur; cycLock(); 'ok'`);
  const bAsk0 = _sum(E[cur].rows.B.ask), bNew = E[cur].rows.B.ask.slice(); bNew[0] += 100000;
  ev(`S.asks['B']=${J(bNew)}; applyState(S); MS.years[MS.cur]=S; save(); 'ok'`);
  const bLine = (Wb, y) => { const b = blocksOf(Wb.sheets[app] || [])[0]; const L = b && b.lines.find(L => L.title === E[cur].rows.B.title); return L ? L.fy[y][0] : 'missing'; };
  const W2 = JSON.parse(await grabX('exportFydpPlan'));
  chk(name, 'after', 'the working plan’s B moved with the board', bLine(W2, cur), bAsk0 + 100000);
  ev(`fydpSrc='${key}'; 'ok'`);
  const C = JSON.parse(await grabX('exportFydpPlan'));
  chk(name, 'cycle', 'the locked cycle’s workbook builds', C.state, 'ok');
  chk(name, 'cycle', 'its subtitle names the lock', /^PB\S* \(locked/.test(String(((C.sheets[app] || [])[1] || [])[0] ?? '')), true);
  chk(name, 'cycle', 'B’s requirement is the figure AS LOCKED, not the board’s', bLine(C, cur), bAsk0);
  chk(name, 'cycle', 'and its block is the plan as it was, every figure', J(blocksOf(C.sheets[app] || [])), J([eAll]));
  // ---- the picker starts on the plan on screen: a locked view, else the working plan
  ev(`fydpSrc='working'; cycView('${key}'); fydpOpen=false; toggleFydp(); 'ok'`);
  chk(name, 'picker', 'opened on a locked view, the panel picks the locked cycle', ev('fydpSrc'), key);
  ev(`fydpOpen=false; cycLeave(true); fydpSrc='${key}'; fydpPickExport(); 'ok'`);
  chk(name, 'picker', 'on the working plan, 📊 FYDP Spend Plan (Excel) opens the picker on the working plan', ev('fydpSrc') + ' ' + ev('fydpOpen'), 'working true');
  ev(`fydpOpen=true; fydpSrc='${key}'; render(); 'ok'`);
  chk(name, 'source', 'the panel offers the locked cycle as a source', new RegExp('<option value="' + key.replace('|', '\\|') + '"[^>]*selected').test(ev(`document.getElementById('fydpBody').innerHTML`)), true);
  ev(`fydpOpen=false; blLock('${key}', false); blDelete('${key}'); fydpOpen=true; render(); 'ok'`);
  chk(name, 'source', 'a cycle deleted falls back to the working plan', ev('fydpSrc'), 'working');
  // put the board back: nothing after this block sees a second year, a base, a lock or the moved value
  ev(`fydpOpen=false; MS.cycle=''; MS.cycleRef=''; delete MS.years[MS.cur+1]; MS.base=${base0 === 'null' ? 'undefined' : base0};
      itemById('D').ccar=${dCcar0}[0];
      applyState(JSON.parse(${J(snap)})); MS.years[MS.cur]=S; save(); render(); 'ok'`);
  chk(name, 'restore', 'the board is as it was', _sum(JSON.parse(ev(`JSON.stringify(itemById('B').ask)`))) + ' ' + ev(`ccarOf(itemById('D'))`),
    bAskOrig + ' ' + (JSON.parse(dCcar0)[1] || JSON.parse(dCcar0)[0] || ''));
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ══ 18. COMPARING TWO CYCLES ═══════════════════════════════════════════════════════════════════
// A and B are read through the five-year plan's one shape, so every A-side figure is the engine
// as it stood when A was locked and every B-side figure is the engine now (or as B was locked).
// Both are re-derived here from the engine before and after the changes, requirement by
// requirement, per year; the kinds (added, removed, changed, same) from what was done; and the
// conservation rule that makes the sheet briefable -- Σ row deltas = the total delta, per year,
// per column -- is asserted from the data, on the sheet and on the panel. For the year on screen
// the deltas must also agree with cycDelta (stage 3): two paths, one answer. Then B is locked too,
// the working plan moves again, and a comparison of the two locks must not follow it; and a year
// only one side holds is stated, never compared.
{
  const name = 'comparing two cycles';
  try {
  const cur = +ev('MS.cur'), keyA = 'PB|' + cur, keyB = 'BES|' + (cur + 1), fyl = y => 'FY' + (y % 100);
  const snap = ev('JSON.stringify(S)'), base0 = ev('JSON.stringify(MS.base===undefined? null : MS.base)');
  // A missing year or row is a FAILING CHECK, never a throw: a suite that dies proves nothing, and
  // the sweep reports it as CRASHED rather than caught. The block is also wrapped so that anything
  // unforeseen is reported as a failure with its message, and the board is put back regardless.
  const fyOf = (Dd, y) => (Dd && Dd.fy && Dd.fy[y]) || { rows: {}, ids: [], tot: {}, rowsD: {}, pots: { disc: {}, mand: {} }, closes: 'missing', nAdded: 'missing', nRemoved: 'missing', nChanged: 'missing', nSame: 'missing' };
  const rowOf = (Y, id) => (Y.rows && Y.rows[id]) || { d: {}, what: [], kind: 'missing', a: null, b: null };
  const totOf = (Y, k) => (Y.tot && Y.tot[k]) || {};
  const cmpOf = (a, b) => JSON.parse(ev(`JSON.stringify(cycCmpData(${JSON.stringify(a)}, ${JSON.stringify(b)}))`)) || { years: [], onlyA: [], onlyB: [], fy: {}, rows: {}, order: [] };
  try {
  const A1 = [18000000, 4000000, 2000000, 8000000, 3000000, 5000002];
  ev(`MS.years[MS.cur]=S; MS.base=MS.cur+1;
      var y1=JSON.parse(JSON.stringify(S)); y1.asks={A:${JSON.stringify(A1)}}; delete y1.pmoOrder; MS.years[MS.cur+1]=y1; save(); 'ok'`);
  const ENGINE = `function(){ var T=tiers(), o={rows:{}, order:S.order.slice(), disc:(S.discSvc||[]).slice(), mand:(S.mandSvc||[]).slice()};
      var s=function(a){ return a.reduce(function(x,y){ return x+(+y||0); },0); };
      S.order.forEach(function(id,i){ var it=itemById(id), p=T[id]; if(!it||!p) return;
        var d=SVC.map(function(_,k){ return p.d[k]||0; }), m=SVC.map(function(_,k){ return p.m[k]||0; });
        var fund=d.map(function(v,k){ return v+m[k]; });
        var alloc=(S.fsrc||{})[id]? fund.slice() : svcAlloc(it).slice();
        o.rows[id]={title:dispTitle(it), grp:grpOf(it), rank:i+1, band:BAND_OF(id)||'', mc:!!S.mc[id], ask:s(it.ask), alloc:s(alloc), fund:s(fund),
          unf:s(SVC.map(function(_,k){ return Math.max(0,(it.ask[k]||0)-fund[k]); }))}; });
      o.discT=s(o.disc); o.mandT=s(o.mand);
      return JSON.stringify(o); }`;
  const before = { [cur]: JSON.parse(ev(`(${ENGINE})()`)), [cur + 1]: JSON.parse(ev(`aceWithYear(MS.cur+1, ${ENGINE})`)) };
  ev(`blCyc='PB'; blYr=MS.cur; cycLock(); 'ok'`);
  chk(name, 'lock A', 'A is locked over both planned years', ev(`cycHeld('${keyA}').join(',')`), cur + ',' + (cur + 1));
  // the working plan moves on. This year: a value, a band, a star, one removed (the last, so no rank
  // shifts), one added at the end, a pot. Next year: A and B swap places, and no money is typed.
  const bNew = JSON.parse(ev(`JSON.stringify(itemById('B').ask)`)); bNew[0] += 100000;
  ev(`S.asks['B']=${JSON.stringify(bNew)}; S.band['D']='pdm'; S.mc['B']=true;
      S.removed.push('E'); S.order=S.order.filter(function(id){ return id!=='E'; });
      S.custom.push({id:'NEW-1', grp:'ATL', sect:'new', custom:true, title:'Added since PB', event:'Added since PB', ccar:'CCNEW', fy26:[0,0,0,0,0,0], ask:[10000,5000,0,0,0,0], alloc:null});
      S.order.push('NEW-1');
      if(S.bm && S.bm.disc){ S.bm.disc[0]=(S.bm.disc[0]||0)+500000; } else { S.discSvc[0]=(S.discSvc[0]||0)+500000; }   // the pot is derived from the budget mix where one is held
      applyState(S); MS.years[MS.cur]=S; save(); render();
      (function(){ var y1=MS.years[MS.cur+1], i=y1.order.indexOf('A'), j=y1.order.indexOf('B'); y1.order[i]='B'; y1.order[j]='A'; })(); 'ok'`);
  const after = { [cur]: JSON.parse(ev(`(${ENGINE})()`)), [cur + 1]: JSON.parse(ev(`aceWithYear(MS.cur+1, ${ENGINE})`)) };
  const K = ['ask', 'alloc', 'fund', 'unf'], KL = { ask: 'Requirement', alloc: 'Allocated', fund: 'Funded', unf: 'Unfunded' };
  const flags = { [cur]: { B: ['requirement', 'starred'], D: ['band'] }, [cur + 1]: { A: ['rank'], B: ['rank'] } };
  const expect = {};
  [cur, cur + 1].forEach(y => {
    const bf = before[y].rows, af = after[y].rows, ids = [...new Set([...Object.keys(af), ...Object.keys(bf)])], o = { rows: {}, tot: {} };
    K.forEach(k => { o.tot[k] = { a: _sum(Object.values(bf).map(r => r[k])), b: _sum(Object.values(af).map(r => r[k])) }; o.tot[k].d = o.tot[k].b - o.tot[k].a; });
    ids.forEach(id => { const r = {}; K.forEach(k => { r[k] = (af[id] ? af[id][k] : 0) - (bf[id] ? bf[id][k] : 0); });
      r.kind = af[id] && bf[id] ? ((K.some(k => Math.abs(r[k]) > 0.5) || (flags[y][id] || []).length) ? 'changed' : 'same') : (af[id] ? 'added' : 'removed');
      o.rows[id] = r; });
    o.pots = { disc: after[y].discT - before[y].discT, mand: after[y].mandT - before[y].mandT };
    expect[y] = o;
  });
  chk(name, 'fixture', 'this year removes E and adds NEW-1; next year swaps A and B', Object.keys(expect[cur].rows).filter(id => expect[cur].rows[id].kind !== 'same').sort().join(',').length > 0 && expect[cur].rows.E.kind + ':' + expect[cur].rows['NEW-1'].kind, 'removed:added');
  chk(name, 'fixture', 'and the pot moved', expect[cur].pots.disc, 500000);
  // ---- the comparison, A against the working plan
  const D = cmpOf(keyA, 'working');
  chk(name, 'years', 'the years compared are the two both hold, and none is only on one side', D.years.join(',') + '|' + D.onlyA.join(',') + '|' + D.onlyB.join(','), cur + ',' + (cur + 1) + '||');
  [cur, cur + 1].forEach(y => {
    const Y = fyOf(D, y), X = expect[y];
    Object.keys(X.rows).forEach(id => {
      chk(name, fyl(y) + ' ' + id, 'is on the comparison', !!Y.rows[id], true);
      if (!Y.rows[id]) return;
      K.forEach(k => chk(name, fyl(y) + ' ' + id, 'Δ ' + KL[k] + ' is the engine after less the engine before', Y.rows[id].d[k], X.rows[id][k]));
      chk(name, fyl(y) + ' ' + id, 'is ' + X.rows[id].kind, Y.rows[id].kind, X.rows[id].kind);
      (flags[y][id] || []).forEach(f => chk(name, fyl(y) + ' ' + id, 'says what changed: ' + f, Y.rows[id].what.indexOf(f) >= 0, true));
    });
    K.forEach(k => { chk(name, fyl(y) + ' total', 'A ' + KL[k] + ' is the engine before the lock', totOf(Y, k).a, X.tot[k].a);
      chk(name, fyl(y) + ' total', 'B ' + KL[k] + ' is the engine now', totOf(Y, k).b, X.tot[k].b);
      chk(name, fyl(y) + ' total', 'Δ ' + KL[k] + ' is B less A', totOf(Y, k).d, X.tot[k].d);
      chk(name, fyl(y) + ' total', 'and the rows account for it: Σ rows Δ ' + KL[k], Y.rowsD[k], X.tot[k].d); });
    chk(name, fyl(y) + ' pots', 'the pots moved by what was typed', Y.pots.disc.d + ':' + Y.pots.mand.d, X.pots.disc + ':' + X.pots.mand);
    chk(name, fyl(y) + ' closes', 'the comparison says the rows account for the totals', Y.closes, true);
    chk(name, fyl(y) + ' counts', 'added, removed, changed and same are counted', Y.nAdded + ':' + Y.nRemoved + ':' + Y.nChanged + ':' + Y.nSame,
      ['added', 'removed', 'changed', 'same'].map(kd => Object.keys(X.rows).filter(id => X.rows[id].kind === kd).length).join(':'));
  });
  chk(name, fyl(cur + 1) + ' same', 'a year where only the order moved keeps at least one requirement the same', fyOf(D, cur + 1).nSame >= 1, true);
  const Y0 = fyOf(D, cur);
  // ---- two paths, one answer: the year on screen agrees with the stage-3 deltas
  const S3 = JSON.parse(ev(`JSON.stringify((function(){ _cycDeltaCache=null; var d=cycDelta(MS.cur); return d? {ref:d.ref, rows:d.rows, removed:d.removed, tot:d.tot} : null; })())`));
  chk(name, 'stage 3', 'the on-screen deltas read A as the reference', S3 && S3.ref, keyA);
  if (S3) {
    Object.keys(S3.rows).forEach(id => ['ask', 'alloc', 'fund'].forEach(k => chk(name, 'stage 3', id + ': Δ ' + KL[k] + ' agrees with cycDelta', rowOf(Y0, id).d[k], S3.rows[id][k])));
    S3.removed.forEach(r => chk(name, 'stage 3', r.id + ': the removed requirement’s locked figure agrees', -rowOf(Y0, r.id).d.ask, r.askWas));
    chk(name, 'stage 3', 'the total Δ agrees', totOf(Y0, 'ask').d + ':' + totOf(Y0, 'fund').d, S3.tot.ask + ':' + S3.tot.fund);
  }
  // ---- the workbook
  ev(`cycCmpA='${keyA}'; cycCmpB='working'; 'ok'`);
  const W = JSON.parse(await grabX('exportCycCompare'));
  chk(name, 'workbook', 'the comparison builds', W.state, 'ok');
  const cs = W.sheets['Compare'] || [], ch = W.sheets['Changes'] || [], bp = W.sheets['By PMO'] || [];
  const la = ev(`blLbl('${keyA}')`), lb = 'WORKING';
  chk(name, 'title', 'the title names A, B and the span', String((cs[0] || [])[0] ?? ''), 'ORBIT CYCLE COMPARISON — ' + la + ' ⇄ ' + lb + ' — ' + fyl(cur) + '–' + fyl(cur + 1));
  const h = headerRow(cs, 'PMO', 'Requirement', 'CCaR', fyl(cur) + ' Δ Requirement');
  chk(name, 'shape', 'Compare has its header', h >= 0 ? 'yes' : 'no', 'yes');
  const colC = (rows, hd, y, side, k) => colOf(rows, hd, fyl(y) + ' ' + (side === 'd' ? 'Δ' : (side === 'a' ? la : lb)) + ' ' + KL[k]);
  const rowC = (ci, v) => cs.find((r, i) => i > h && String((r || [])[ci] ?? '') === v) || [];
  const title = id => (before[cur].rows[id] || after[cur].rows[id]).title;
  Object.keys(expect[cur].rows).forEach(id => { const row = rowC(1, title(id));
    chk(name, 'sheet ' + id, 'is on the sheet under its office', String(row[0] ?? ''), (after[cur].rows[id] || before[cur].rows[id]).grp);
    K.forEach(k => { chk(name, 'sheet ' + id, fyl(cur) + ' Δ ' + KL[k] + ' is the engine’s difference', num(row[colC(cs, h, cur, 'd', k)]), expect[cur].rows[id][k]);
      chk(name, 'sheet ' + id, fyl(cur + 1) + ' Δ ' + KL[k] + ' likewise, or — when the requirement is in neither side that year', num(row[colC(cs, h, cur + 1, 'd', k)]), expect[cur + 1].rows[id] ? expect[cur + 1].rows[id][k] : null); }); });
  chk(name, 'sheet', 'an added requirement has no A figure, and Δ is its whole B figure', String(rowC(1, title('NEW-1'))[colC(cs, h, cur, 'a', 'ask')]) + ':' + num(rowC(1, title('NEW-1'))[colC(cs, h, cur, 'd', 'ask')]), '—:' + after[cur].rows['NEW-1'].ask);
  chk(name, 'sheet', 'a removed requirement has no B figure, and Δ is minus its whole A figure', String(rowC(1, title('E'))[colC(cs, h, cur, 'b', 'ask')]) + ':' + num(rowC(1, title('E'))[colC(cs, h, cur, 'd', 'ask')]), '—:' + (-before[cur].rows.E.ask));
  const tot = rowC(0, 'TOTAL');
  [cur, cur + 1].forEach(y => K.forEach(k => { chk(name, 'sheet TOTAL', fyl(y) + ' A ' + KL[k], num(tot[colC(cs, h, y, 'a', k)]), expect[y].tot[k].a);
    chk(name, 'sheet TOTAL', fyl(y) + ' B ' + KL[k], num(tot[colC(cs, h, y, 'b', k)]), expect[y].tot[k].b);
    chk(name, 'sheet TOTAL', fyl(y) + ' Δ ' + KL[k], num(tot[colC(cs, h, y, 'd', k)]), expect[y].tot[k].d); }));
  const check = rowC(0, 'CHECK — the rows account for the totals');
  chk(name, 'sheet CHECK', 'every Δ column closes', [cur, cur + 1].every(y => K.every(k => /^✓/.test(String(check[colC(cs, h, y, 'd', k)] ?? '')))) ? 'yes' : 'no', 'yes');
  const subATL = rowC(0, 'Subtotal — ATL');
  chk(name, 'sheet subtotal', 'ATL’s Δ requirement is B’s change plus the added requirement', num(subATL[colC(cs, h, cur, 'd', 'ask')]), expect[cur].rows.B.ask + expect[cur].rows['NEW-1'].ask);
  chk(name, 'sheet subtotal', 'and its A side is B alone', num(subATL[colC(cs, h, cur, 'a', 'ask')]), before[cur].rows.B.ask);
  // the Changes sheet
  const hc = headerRow(ch, 'FY', 'Kind', 'PMO', 'Requirement', 'What changed');
  const chRows = ch.filter((r, i) => i > hc && String((r || [])[0] ?? '') === fyl(cur));
  const chRow = t => chRows.find(r => String((r || [])[3] ?? '') === t) || [];
  chk(name, 'changes', 'the added requirement is ADDED, not in A', chRow(title('NEW-1'))[1] + ' / ' + chRow(title('NEW-1'))[5], 'ADDED / not in ' + la);
  chk(name, 'changes', 'the removed one is REMOVED, not in B', chRow(title('E'))[1] + ' / ' + chRow(title('E'))[5], 'REMOVED / not in ' + lb);
  chk(name, 'changes', 'B is CHANGED, and says what: its requirement and the star', chRow(title('B'))[1] + ' ' + (/requirement/.test(String(chRow(title('B'))[5])) && /starred/.test(String(chRow(title('B'))[5]))), 'CHANGED true');
  chk(name, 'changes', 'D is CHANGED by band, from none to pdm', chRow(title('D'))[1] + ' ' + (/band/.test(String(chRow(title('D'))[5]))) + ' ' + chRow(title('D'))[colOf(ch, hc, la + ' Band')] + '→' + chRow(title('D'))[colOf(ch, hc, lb + ' Band')], 'CHANGED true —→pdm');
  chk(name, 'changes', 'the star is shown on B’s side', chRow(title('B'))[colOf(ch, hc, la + ' ★')] + '/' + chRow(title('B'))[colOf(ch, hc, lb + ' ★')], '/★');
  chk(name, 'changes', 'nothing is listed as the same', chRows.filter(r => String((r || [])[1] ?? '') === 'SAME').length, 0);
  const sr = chRows.find(r => String((r || [])[1] ?? '') === 'Σ ROWS') || [], tr = chRows.find(r => String((r || [])[1] ?? '') === 'TOTAL Δ') || [], ck = chRows.find(r => String((r || [])[1] ?? '') === 'CHECK') || [];
  const cD = k => colOf(ch, hc, 'Δ ' + KL[k]), cA = k => colOf(ch, hc, la + ' ' + KL[k]), cB = k => colOf(ch, hc, lb + ' ' + KL[k]);
  K.forEach(k => { chk(name, 'changes Σ', 'Σ rows Δ ' + KL[k] + ' is the engine’s total difference', num(sr[cD(k)]), expect[cur].tot[k].d);
    chk(name, 'changes TOTAL', 'TOTAL Δ ' + KL[k] + ' is B less A', num(tr[cD(k)]), expect[cur].tot[k].d);
    chk(name, 'changes TOTAL', 'A ' + KL[k], num(tr[cA(k)]), expect[cur].tot[k].a);
    chk(name, 'changes TOTAL', 'B ' + KL[k], num(tr[cB(k)]), expect[cur].tot[k].b); });
  chk(name, 'changes CHECK', 'says the rows account for the totals', /^✓/.test(String(ck[5] ?? '')), true);
  const pd = chRows.find(r => String((r || [])[1] ?? '') === 'Discretionary BA') || [];
  chk(name, 'changes pots', 'the discretionary pot is A, B and the difference', num(pd[6]) + ':' + num(pd[7]) + ':' + num(pd[8]), before[cur].discT + ':' + after[cur].discT + ':' + (after[cur].discT - before[cur].discT));
  const chRows1 = ch.filter((r, i) => i > hc && String((r || [])[0] ?? '') === fyl(cur + 1));
  chk(name, 'changes ' + fyl(cur + 1), 'A and B are CHANGED by rank, and the ranks are printed', ['A', 'B'].map(id => { const r = chRows1.find(r => String((r || [])[3] ?? '') === title(id)) || [];
    return r[1] + '/' + (/rank/.test(String(r[5] ?? '')) ? 'rank' : 'no-rank') + '/' + r[colOf(ch, hc, la + ' Rank')] + '→' + r[colOf(ch, hc, lb + ' Rank')]; }).join(' '), 'CHANGED/rank/1→2 CHANGED/rank/2→1');
  chk(name, 'changes ' + fyl(cur + 1), 'nothing is added or removed', chRows1.filter(r => /^(ADDED|REMOVED)$/.test(String((r || [])[1] ?? ''))).length, 0);
  // by PMO
  const hp = headerRow(bp, 'PMO', 'Requirements', fyl(cur) + ' Δ Requirement');
  const prow = g => bp.find((r, i) => i > hp && String((r || [])[0] ?? '') === g) || [];
  chk(name, 'by PMO', 'ATL counts B and the added requirement', num(prow('ATL')[colOf(bp, hp, 'Requirements')]), 2);
  chk(name, 'by PMO', 'ATL’s Δ requirement is the subtotal', num(prow('ATL')[colC(bp, hp, cur, 'd', 'ask')]), expect[cur].rows.B.ask + expect[cur].rows['NEW-1'].ask);
  chk(name, 'by PMO', 'LOG’s Δ is minus the removed requirement', num(prow('LOG')[colC(bp, hp, cur, 'd', 'ask')]), -before[cur].rows.E.ask);
  K.forEach(k => chk(name, 'by PMO', 'TOTAL Δ ' + KL[k] + ' is B less A', num(prow('TOTAL')[colC(bp, hp, cur, 'd', k)]), expect[cur].tot[k].d));
  chk(name, 'by PMO', 'TOTAL counts every requirement on either side', num(prow('TOTAL')[colOf(bp, hp, 'Requirements')]), Object.keys(expect[cur].rows).length);
  // ---- the panel
  ev(`cycCmpOpen=true; render(); 'ok'`);
  const panel = ev(`document.getElementById('cycCmpBody').innerHTML`);
  chk(name, 'panel', 'the year’s counts are stated', new RegExp(fyl(cur) + ' — 1 added · 1 removed · ' + fyOf(D, cur).nChanged + ' changed · ' + fyOf(D, cur).nSame + ' unchanged').test(panel), true);
  chk(name, 'panel', 'and both years say the rows account for the totals', (panel.match(/✓ the rows account for the totals/g) || []).length, 2);
  const totTbl = (panel.match(/<table class="po cmptot">[\s\S]*?<\/table>/g) || [])[0] || '';
  const reqRow = (/<tr><td><b>Requirement<\/b><\/td>([\s\S]*?)<\/tr>/.exec(totTbl) || [])[1] || '';
  const fm = n => ev(`fM(${n})`), sgn = d => Math.abs(d) < 0.5 ? '<span class="z">—</span>' : ev(`cycSgn(${d})`);
  chk(name, 'panel', 'this year’s requirement line is A, B and Δ', reqRow, '<td class="n">' + fm(expect[cur].tot.ask.a) + '</td><td class="n">' + fm(expect[cur].tot.ask.b) + '</td><td class="n">' + sgn(expect[cur].tot.ask.d) + '</td>');
  chk(name, 'panel', 'the added and the removed are named', /ADDED/.test(panel) && /REMOVED/.test(panel) && new RegExp(title('NEW-1')).test(panel) && new RegExp(title('E')).test(panel), true);
  // ---- B locked too; the working plan moves again; the two locks do not follow it
  ev(`cycCmpOpen=false; blCyc='BES'; blYr=MS.cur+1; /* v2.15 W1 (item 139): a lock as v2.14 took it (w1LockAsBefore) */ ${w1LockAsBefore()} 'ok'`);
  chk(name, 'lock B', 'B is locked over both years', ev(`cycHeld('${keyB}').join(',')`), cur + ',' + (cur + 1));
  const cNew = JSON.parse(ev(`JSON.stringify(itemById('C').ask)`)); cNew[1] += 70000;
  ev(`S.asks['C']=${JSON.stringify(cNew)}; applyState(S); MS.years[MS.cur]=S; var y2=JSON.parse(JSON.stringify(S)); delete y2.pmoOrder; MS.years[MS.cur+2]=y2; save(); 'ok'`);
  const DL = cmpOf(keyA, keyB);
  chk(name, 'two locks', 'PB against BES compares the same two years', DL.years.join(','), cur + ',' + (cur + 1));
  chk(name, 'two locks', 'C did not move between the locks, though it has since', rowOf(fyOf(DL, cur), 'C').d.ask, 0);
  chk(name, 'two locks', 'B’s change is what the locks hold', rowOf(fyOf(DL, cur), 'B').d.ask, expect[cur].rows.B.ask);
  chk(name, 'two locks', 'and the total is the two locks’', totOf(fyOf(DL, cur), 'ask').d, expect[cur].tot.ask.d);
  const DW = cmpOf(keyA, 'working');
  chk(name, 'a year on one side', 'the working plan now holds a year PB never did, and it is stated, not compared', DW.years.join(',') + '|' + DW.onlyB.join(','), cur + ',' + (cur + 1) + '|' + (cur + 2));
  chk(name, 'a year on one side', 'against the working plan C has moved', rowOf(fyOf(DW, cur), 'C').d.ask, 70000);
  ev(`cycCmpA='${keyA}'; cycCmpB='${keyB}'; 'ok'`);
  const W2 = JSON.parse(await grabX('exportCycCompare'));
  chk(name, 'two locks', 'the workbook builds for two locks', W2.state, 'ok');
  const cs2 = W2.sheets['Compare'] || [], h2 = headerRow(cs2, 'PMO', 'Requirement', 'CCaR', fyl(cur) + ' Δ Requirement');
  const lB = ev(`blLbl('${keyB}')`);
  chk(name, 'two locks', 'titled as the two cycles', String((cs2[0] || [])[0] ?? ''), 'ORBIT CYCLE COMPARISON — ' + la + ' ⇄ ' + lB + ' — ' + fyl(cur) + '–' + fyl(cur + 1));
  chk(name, 'two locks', 'C’s row shows no change', num((cs2.find((r, i) => i > h2 && String((r || [])[1] ?? '') === title('C')) || [])[colOf(cs2, h2, fyl(cur) + ' Δ Requirement')]), 0);
  ev(`cycCmpB='working'; 'ok'`);
  const W3 = JSON.parse(await grabX('exportCycCompare'));
  const cs3 = W3.sheets['Compare'] || [], h3 = headerRow(cs3, 'PMO', 'Requirement', 'CCaR', fyl(cur) + ' Δ Requirement');
  chk(name, 'a year on one side', 'the sheet carries the year as not in PB, with no figures', String((cs3[h3] || []).find(c => /not in/.test(String(c ?? ''))) ?? ''), fyl(cur + 2) + ' — not in ' + la);
  chk(name, 'a year on one side', 'and its cells are —', String((cs3.find((r, i) => i > h3 && String((r || [])[0] ?? '') === 'TOTAL') || [])[(cs3[h3] || []).findIndex(c => /not in/.test(String(c ?? '')))] ?? ''), '—');
  chk(name, 'a year on one side', 'the span runs to it', String((cs3[0] || [])[0] ?? ''), 'ORBIT CYCLE COMPARISON — ' + la + ' ⇄ WORKING — ' + fyl(cur) + '–' + fyl(cur + 2));
  chk(name, 'a year on one side', 'the Changes sheet says so', (W3.sheets['Changes'] || []).some(r => String((r || [])[0] ?? '') === fyl(cur + 2) && String((r || [])[1] ?? '') === 'not in ' + la), true);
  // ---- the same source twice, and no A
  ev(`cycCmpA='working'; cycCmpB='working'; cycCmpOpen=true; render(); 'ok'`);
  chk(name, 'guard', 'the same source twice is refused on the panel', /Pick two different sources/.test(ev(`document.getElementById('cycCmpBody').innerHTML`)), true);
  chk(name, 'guard', 'and in the workbook', JSON.parse(await grabX('exportCycCompare')).state, 'refused');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  } finally {
    // put the board back: nothing after this block sees the locks, the years, the base or the moves
    try {
      ev(`cycCmpOpen=false; cycCmpA=''; cycCmpB='working';
          ['${keyB}','${keyA}'].forEach(function(k){ if(blGet(k)){ blLock(k, false); blDelete(k); } });
          MS.cycle=''; MS.cycleRef=''; delete MS.years[MS.cur+1]; delete MS.years[MS.cur+2]; MS.base=${base0 === 'null' ? 'undefined' : base0};
          applyState(JSON.parse(${JSON.stringify(snap)})); MS.years[MS.cur]=S; save(); render(); 'ok'`);
    } catch (e) { failures.push({ scenario: name, where: 'harness', what: 'the restore threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' }); }
    chk(name, 'restore', 'the board is as it was', ev(`S.order.join(',')`) + ' ' + ev(`blList().length`), 'A,B,C,D,E 0');
  }
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ══ 19, 20 — RETIRED in v2.04 (item 112): the PPBE position and the cost estimate beside the five-year plan. Brad, 22 Oct
// 2026: "Drop both". The estimate is still proved where it is printed (the ACE Tie-Out, 15), the positions in PPBE Budget
// Positions; the five-year workbook carries neither, so there is nothing here for these blocks to hold.

// ==== v1.95 W4: journal by year, PMO drill and PMO by year (items 54, 55) ====
// v1.95, ITEM 55, BRAD'S Q2 (3 Oct 2026): "PMOs can change under reorganizations, leave the PMO assigned
// by year, as it's reported as that PMO in that year." The FYDP workbook filed every year of a
// requirement under its LATEST year's PMO, so FY27 money for a requirement moved in FY28 showed under
// the FY28 office and disagreed with the FY27 lock. Here MOVE is AV in FY27, TSS in FY28 and AV again in
// FY29: each PMO's figures, each year, must be that year's projection by PMO and the locked cycle's PMO
// roll-up, to the dollar; MOVE is listed under each office for the years it held it; every total is
// what it was. The oracle is each year's projection read through aceWithYear -- what a lock takes --
// grouped here by the projection's own PMO, never by the code under test.
const { bootMark: _w4Mark, bootRelease: _w4Release, settleBoards: _w4Settle } = await import('./boot.mjs');
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = _w4Mark();
  const name = 'v1.95 — the five-year plan files each year under that year’s PMO';
  try {
  const J = JSON.stringify, M = 1e6;
  const B = boot();
  const bev = B.ev;
  seed(bev, { services: ['USAF', 'ANG'],
    items: [it('A', 'AV', [10 * M, 5 * M]), it('MOVE', 'AV', [5 * M, 3 * M]), it('STAY', 'TSS', [7 * M, 2 * M]),
            it('ODD', 'AV', [100, 100]), it('UFR', 'AV', [4 * M, 1 * M])],
    disc: [20 * M, 6 * M], mand: [2 * M, 1 * M], order: ['A', 'MOVE', 'STAY', 'ODD', 'UFR'] });
  bev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); MS.years[MS.cur]=S;
    save(); 'ok'`);   // v2.19 (item 150): the estimate and MOVE's tie to it are gone
  const cur = +bev('MS.cur'), Y = [cur, cur + 1, cur + 2], fyl = y => 'FY' + (y % 100);
  bev(`setAlloc('ODD','101'); setFsrc('UFR','ufr'); 'ok'`);
  bev(`switchYear(${cur + 1}); setGrp('MOVE','TSS'); switchYear(${cur + 2}); setGrp('MOVE','AV'); switchYear(${cur}); 'ok'`);
  // each year's projection, grouped by its own PMO: the truth every sheet is held to
  const proj = y => JSON.parse(bev(`JSON.stringify(aceWithYear(${y}, cycProjOf))`));
  const P = {}; Y.forEach(y => { P[y] = proj(y); });
  const K = ['ask', 'alloc', 'fund', 'unf'], KL = { ask: 'Requirement', alloc: 'Allocated', fund: 'Funded', unf: 'Unfunded' };
  const s2 = a => (a || []).reduce((x, v) => x + (+v || 0), 0);
  const fig = r => ({ ask: s2(r.ask), alloc: s2(r.alloc), fund: s2(r.fund || r.alloc),
                      unf: (r.ask || []).reduce((u, a, i) => u + Math.max(0, a - ((r.fund || r.alloc || [])[i] || 0)), 0) });
  const want = {};   // want[g][y] = {ask, alloc, fund, unf}
  Y.forEach(y => P[y].reqs.forEach(r => { const f = fig(r); const w = ((want[r.grp] ||= {})[y] ||= { ask: 0, alloc: 0, fund: 0, unf: 0 });
    K.forEach(k => { w[k] += f[k]; }); }));
  chk(name, 'fixture', 'CONTROL — the fixture: MOVE is AV in FY27, TSS in FY28, AV in FY29, and Allocated and Funded differ (passes on v1.94)',
    J(Y.map(y => P[y].reqs.filter(r => r.id === 'MOVE')[0].grp)) + ' ' + (want.AV[cur].alloc !== want.AV[cur].fund),
    J(['AV', 'TSS', 'AV']) + ' true');
  // the workbook, as its sheets (v2.04: a Summary, a tab per appropriation, service and PMO; Requirement and Allocated,
  // Allocated the lane draw d+m, in $M). Read here in whole dollars.
  const book = src => JSON.parse(bev(`(function(){ fydpSrc=${J(src)}; var got=null, _b=buildXlsx;
      buildXlsx=function(sh){ got=JSON.stringify(sh); return new Uint8Array(0); };
      try{ exportFydpPlan(); }catch(e){ got=JSON.stringify({threw:String((e&&e.message)||e)}); }
      buildXlsx=_b; return got||'null'; })()`));
  const cv = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c;
  const sheet = (S, n) => ((Array.isArray(S) ? S : []).find(s => s.name === n) || { rows: [] }).rows.map(r => (r || []).map(cv));
  const $ = v => typeof v === 'number' ? Math.round(v * M) : v;
  const span = fyl(cur) + '–' + fyl(cur + 4);
  const figs = (rows, h, r) => Y.map(y => { const c = rows[h].indexOf(fyl(y)); return [$(r[c]), $(r[c + 1])]; });
  const rollRow = (rows, hdr, lbl) => { const h = rows.findIndex(r => r[0] === hdr && !r[1]); const r = h < 0 ? [] : (rows.slice(h + 2).find(x => x[0] === lbl) || []); return h < 0 ? 'no table' : figs(rows, h, r); };
  const W = book('working');
  const sm = sheet(W, 'Summary');
  const wantFig = g => Y.map(y => { const w = want[g][y] || { ask: 0, fund: 0 }; return [w.ask, w.fund]; });
  chk(name, 'Summary', 'each PMO, each year: Requirement and Allocated (the lane draw) are that year’s projection for that PMO',
    J(['AV', 'TSS'].map(g => rollRow(sm, 'PMO', g))), J(['AV', 'TSS'].map(wantFig)));
  // CONTROL (passes on v1.94 too: the totals are what they were) -- TOTAL is every requirement, every year
  const all = Y.map(y => ['ask', 'fund'].map(k => s2(P[y].reqs.map(r => fig(r)[k]))));
  chk(name, 'control', 'CONTROL — TOTAL, each year, is every requirement of that year’s projection (passes on v1.94: totals unchanged)',
    J(rollRow(sm, 'PMO', 'TOTAL')), J(all));
  // the PMO tabs: MOVE is on AV's for FY27 and FY29 and on TSS's for FY28, 0 in the years it sat elsewhere
  const mv = y => { const f = fig(P[y].reqs.filter(r => r.id === 'MOVE')[0]); return [f.ask, f.fund]; };
  const moveOn = g => { const rows = sheet(W, g), h = rows.findIndex(r => r[0] === 'CCaR Record' && r[1] === 'Requirement Title');
    return h < 0 ? 'no block' : rows.slice(h + 2).filter(r => r[1] === 'Ev MOVE').map(r => figs(rows, h, r)); };
  chk(name, 'PMO tabs', 'MOVE is on the AV tab for FY27 and FY29 and on the TSS tab for FY28, 0 in the years it sat elsewhere',
    J(['AV', 'TSS'].map(moveOn)), J([[[mv(cur), [0, 0], mv(cur + 2)]], [[[0, 0], mv(cur + 1), [0, 0]]]]));
  chk(name, 'PMO tabs', 'a PMO tab’s roll-up is that PMO’s year, each year',
    J(['AV', 'TSS'].map(g => rollRow(sheet(W, g), 'Appropriation', 'TOTAL'))), J(['AV', 'TSS'].map(wantFig)));
  // the panel on screen files the same way
  bev(`fydpOpen=true; fydpSrc='working'; fydpView='p:TSS'; render(); 'ok'`);
  const panel = bev(`document.getElementById('fydpBody').innerHTML`);
  const ptot = ((/<tr class="tot">([\s\S]*?)<\/tr>/.exec(panel) || [])[1] || '').match(/<td class="n[^"]*">([\s\S]*?)<\/td>/g) || [];
  chk(name, 'panel', 'the panel’s TSS view is TSS by year, in $M',
    J(ptot.slice(0, 6).map(c => c.replace(/<[^>]+>/g, ''))), J(wantFig('TSS').slice(0, 3).flat().map(v => bev(`fM3(${v})`))));
  bev(`fydpOpen=false; render(); 'ok'`);
  // and a cycle locked from this plan: its Summary By PMO is its own PMO roll-up, as locked, to the dollar
  bev(`blCyc='PB'; blYr=MS.cur; blNote=''; cycLock(); 'ok'`);
  const key = 'PB|' + cur;
  const lockRoll = JSON.parse(bev(`JSON.stringify(['AV','TSS'].map(function(g){ return [${Y.join(',')}].map(function(y){ var P=cycProj(${J(key)}, y);
      if(!P) return null; var x=P.pmo[g]||{}; var s=function(a){ return (a||[]).reduce(function(t,v){ return t+v; },0); }; return [s(x.ask), s(x.fund)]; }); }))`));
  const C = book(key);
  chk(name, 'the lock', 'the locked cycle’s Summary By PMO is the cycle’s own PMO roll-up, each year, to the dollar',
    J(['AV', 'TSS'].map(g => rollRow(sheet(C, 'Summary'), 'PMO', g).slice(0, 3))), J(lockRoll.map(a => a.slice(0, 3))));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  _w4Release(__bm, []);
  await _w4Settle();
})();

// v1.95, ITEM 55, BRAD'S Q2, THE CYCLE COMPARISON: ⇄ Compare two cycles filed a requirement's rows under
// the PMO it had in the first year compared, so its Compare subtotals and By PMO sheet disagreed with
// both cycles' own PMO roll-ups for every later year it sat elsewhere. Two cycles are locked here: PB
// with MOVE in AV, TSS, AV over three years, and BES after MOVE is put back in AV for the middle year
// (the two cycles then disagree about that year) and one ask is raised. Each PMO's A and B, each year,
// must be that cycle's own PMO roll-up; the totals and the Changes sheet's Σ rows = Δ are unchanged.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = _w4Mark();
  const name = 'v1.95 — the cycle comparison files each year under that year’s PMO';
  try {
  const J = JSON.stringify, M = 1e6;
  const B = boot();
  const bev = B.ev;
  seed(bev, { services: ['USAF', 'ANG'],
    items: [it('A', 'AV', [10 * M, 5 * M]), it('MOVE', 'AV', [5 * M, 3 * M]), it('STAY', 'TSS', [7 * M, 2 * M]),
            it('ODD', 'AV', [100, 100]), it('UFR', 'AV', [4 * M, 1 * M])],
    disc: [20 * M, 6 * M], mand: [2 * M, 1 * M], order: ['A', 'MOVE', 'STAY', 'ODD', 'UFR'] });
  bev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); MS.years[MS.cur]=S; save(); 'ok'`);
  const cur = +bev('MS.cur'), Y = [cur, cur + 1, cur + 2], fyl = y => 'FY' + (y % 100);
  bev(`setAlloc('ODD','101'); setFsrc('UFR','ufr'); 'ok'`);
  bev(`switchYear(${cur + 1}); setGrp('MOVE','TSS'); switchYear(${cur + 2}); setGrp('MOVE','AV'); switchYear(${cur}); 'ok'`);
  const kA = 'PB|' + cur, kB = 'BES|' + (cur + 1);
  bev(`blCyc='PB'; blYr=${cur}; blNote=''; cycLock(); 'ok'`);
  bev(`setAsk('A',0,'11000000'); switchYear(${cur + 1}); setGrp('MOVE','AV'); switchYear(${cur}); 'ok'`);
  bev(`blCyc='BES'; blYr=${cur + 1}; blNote=''; /* v2.15 W1 (item 139): a lock as v2.14 took it (w1LockAsBefore) */ ${w1LockAsBefore()} 'ok'`);
  const K = ['ask', 'alloc', 'fund', 'unf'], KL = { ask: 'Requirement', alloc: 'Allocated', fund: 'Funded', unf: 'Unfunded' };
  // each cycle's own PMO roll-up, each year, read from the lock: ask, alloc and fund are its pmo block,
  // unfunded its rows floored per service -- grouped here by each row's own PMO
  const roll = key => JSON.parse(bev(`JSON.stringify([${Y.join(',')}].map(function(y){ var P=cycProj(${J(key)}, y), o={};
      var s=function(a){ return (a||[]).reduce(function(t,v){ return t+v; },0); };
      P.reqs.forEach(function(r){ var g=r.grp, x=o[g]||(o[g]={ask:0, alloc:0, fund:0, unf:0});
        x.ask+=s(r.ask); x.alloc+=s(r.alloc); x.fund+=s(r.fund||r.alloc);
        (r.ask||[]).forEach(function(a,i){ x.unf+=Math.max(0, a-((r.fund||r.alloc||[])[i]||0)); }); });
      Object.keys(P.pmo).forEach(function(g){ var p=P.pmo[g]; o[g].lock=[s(p.ask), s(p.alloc), s(p.fund)]; });
      return o; }))`));
  const RA = roll(kA), RB = roll(kB);
  chk(name, 'control', 'CONTROL — the fixture: MOVE is TSS in PB’s middle year and AV in BES’s, and each lock’s pmo block is its rows (passes on v1.94)',
    J([bev(`cycProj(${J(kA)}, ${cur + 1}).reqs.filter(function(r){ return r.id==='MOVE'; })[0].grp`), bev(`cycProj(${J(kB)}, ${cur + 1}).reqs.filter(function(r){ return r.id==='MOVE'; })[0].grp`),
       [RA, RB].every(R => R.every(o => Object.keys(o).every(g => J(o[g].lock) === J([o[g].ask, o[g].alloc, o[g].fund]))))]),
    J(['TSS', 'AV', true]));
  const book = JSON.parse(bev(`(function(){ cycCmpA=${J(kA)}; cycCmpB=${J(kB)}; var got=null, _b=buildXlsx;
      buildXlsx=function(sh){ got=JSON.stringify(sh); return new Uint8Array(0); };
      try{ exportCycCompare(); }catch(e){ got=JSON.stringify({threw:String((e&&e.message)||e)}); }
      buildXlsx=_b; return got||'null'; })()`));
  const cv = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c;
  const sheet = n => ((Array.isArray(book) ? book : []).find(s => s.name === n) || { rows: [] }).rows.map(r => (r || []).map(cv));
  const la = bev(`blLbl(${J(kA)})`), lb = bev(`blLbl(${J(kB)})`);
  const col = (rows, h, y, side, k) => rows[h].indexOf(fyl(y) + ' ' + (side === 'a' ? la : side === 'b' ? lb : 'Δ') + ' ' + KL[k]);
  const bp = sheet('By PMO'), hp = bp.findIndex(r => r[0] === 'PMO' && r[1] === 'Requirements');
  const line = (rows, h, lbl) => rows.slice(h + 1).find(r => r[0] === lbl) || [];
  const got = g => Y.map(y => ['a', 'b', 'd'].map(sd => K.map(k => line(bp, hp, g)[col(bp, hp, y, sd, k)])));
  const want = g => Y.map((y, i) => { const a = RA[i][g] || { ask: 0, alloc: 0, fund: 0, unf: 0 }, b = RB[i][g] || { ask: 0, alloc: 0, fund: 0, unf: 0 };
    return [K.map(k => a[k]), K.map(k => b[k]), K.map(k => b[k] - a[k])]; });
  chk(name, 'By PMO', 'each PMO, each year: A is PB’s own PMO roll-up, B is BES’s, Δ is B less A',
    J(['AV', 'TSS'].map(got)), J(['AV', 'TSS'].map(want)));
  chk(name, 'By PMO', 'a requirement counts under each PMO either cycle files it under; TOTAL counts each requirement once',
    J(['AV', 'TSS', 'TOTAL'].map(g => line(bp, hp, g)[1])), J([4, 2, 5]));
  const cs = sheet('Compare'), hc = cs.findIndex(r => r[0] === 'PMO' && r[1] === 'Requirement');
  const moveRows = cs.slice(hc + 1).filter(r => r[1] === 'Ev MOVE').map(r => [r[0]].concat(Y.map(y => ['a', 'b'].map(sd => r[col(cs, hc, y, sd, 'alloc')]))));
  const mv = (R, i) => R === 'A' ? bev(`(function(){ var r=cycProj(${J(kA)}, ${Y[i]}).reqs.filter(function(x){ return x.id==='MOVE'; })[0]; return r.alloc.reduce(function(t,v){ return t+v; },0); })()`)
                                 : bev(`(function(){ var r=cycProj(${J(kB)}, ${Y[i]}).reqs.filter(function(x){ return x.id==='MOVE'; })[0]; return r.alloc.reduce(function(t,v){ return t+v; },0); })()`);
  chk(name, 'Compare', 'MOVE is under AV for every year either cycle had it there, and under TSS only for PB’s middle year',
    J(moveRows), J([['AV', [+mv('A', 0), +mv('B', 0)], ['—', +mv('B', 1)], [+mv('A', 2), +mv('B', 2)]], ['TSS', ['—', '—'], [+mv('A', 1), '—'], ['—', '—']]]));
  // CONTROL (passes on v1.94 too: the totals are what they were) -- TOTAL and the Changes sheet's Σ rows = Δ
  const tot = (R, i, k) => Object.values(R[i]).reduce((t, o) => t + o[k], 0);
  const ch = sheet('Changes');
  chk(name, 'control', 'CONTROL — By PMO TOTAL is each cycle’s whole year, and every Changes CHECK closes (passes on v1.94: totals unchanged)',
    J([Y.map(y => ['a', 'b'].map(sd => K.map(k => line(bp, hp, 'TOTAL')[col(bp, hp, y, sd, k)]))), ch.filter(r => r[1] === 'CHECK').map(r => r[5])]),
    J([Y.map((y, i) => [K.map(k => tot(RA, i, k)), K.map(k => tot(RB, i, k))]), Y.map(() => '✓ the rows account for the totals')]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  _w4Release(__bm, []);
  await _w4Settle();
})();
// ==== end W4 ====

// ==== v1.95 W6: money reconciliation coverage map (item 59) ====
// ITEM 59 — THE MONEY MAP'S CHEAP CLOSES. tools/money-map.mjs maps every registered money surface against
// seven dimensions; these blocks close the cells it found OPEN that a test alone could prove. Each block
// builds its own copy of this suite's fixture (fixture() + dress + dress2), so nothing above can leave it
// changed, and asserts EVERY figure a sheet prints at the grain it prints it -- every requirement row,
// every service column, every lane -- never a total alone: a total can be right while two cells
// beneath it have swapped. Expectations come from the lane vectors (tiers' d and m, the clamped basis,
// the fixture's asks, budget authority and award dates), with the formulas written out here.
// tools/money-map.json cites these scenario names; renaming one fails the map.
const w6Fresh = () => {
  const X = boot();
  seed(X.ev, fixture());
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); 'ok'`);
  dress(X.ev); dress2(X.ev);
  return X;
};
// What one window's export wrote, read back from its bytes with the board's own reader.
const w6Book = (W, fn) => W.eval(`(async function(){
  var cap=null,_B=window.Blob,msg='';
  window.alert=function(m){ msg+=String(m); }; window.confirm=function(){ return true; };
  window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
  try{ ${fn}(); }catch(e){ window.Blob=_B; return JSON.stringify({__err:'threw '+String((e&&e.message)||e)}); }
  window.Blob=_B;
  if(!cap) return JSON.stringify({__err:'no file: '+msg.slice(0,80)});
  var ab=cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength);
  return JSON.stringify(await xlsxRead(ab)); })()`);
const w6S = a => a.reduce((x, y) => x + y, 0);
// Every vector a requirement has, from the board's lane walk; the readings are computed HERE from them.
const w6Truth = (G, meta) => {
  const n = G.svc.length, R = {};
  Object.keys(G.rows).forEach(id => {
    const r = G.rows[id], z = k => G.svc.map((_, i) => k(i));
    const v = {
      ask: z(i => r.ask[i] || 0), d: z(i => r.d[i] || 0), m: z(i => r.m[i] || 0), basis: z(i => r.basis[i] || 0),
      mc: r.mc, grp: meta[id].grp, title: meta[id].title, ev: meta[id].ev, rank: meta[id].rank, band: meta[id].band };
    v.f = z(i => v.d[i] + v.m[i]);
    v.unf = z(i => Math.max(0, v.ask[i] - v.d[i] - v.m[i]));
    v.du = z(i => Math.max(0, v.ask[i] - v.d[i]));
    v.trim = z(i => Math.max(0, v.ask[i] - v.basis[i]));
    v.beyond = z(i => Math.max(0, Math.min(v.ask[i], v.basis[i]) - v.d[i] - v.m[i]));
    ['ask', 'd', 'm', 'f', 'unf', 'du', 'trim', 'beyond', 'basis'].forEach(k => { v[k + 'T'] = w6S(v[k]); });
    R[id] = v;
  });
  const ids = Object.keys(R).sort((a, b) => R[a].rank - R[b].rank);
  const svcSum = (pick, k) => G.svc.map((_, i) => w6S(ids.filter(pick).map(id => R[id][k][i])));
  return { R, ids, n, svcSum };
};
const w6Meta = ev => JSON.parse(ev(`JSON.stringify((function(){ var o={};
  S.order.forEach(function(id,i){ var it=itemById(id); o[id]={grp:grpOf(it), title:(recName(it)||dispTitle(it)), ev:dispTitle(it), rank:i+1,
    band:(BAND_OF(id)===null? null : BAND_IDX(BAND_OF(id)))}; }); return o; })())`));
// A sheet's rows under a header: the header found by the cells it must carry, a column by its name.
const w6Hdrs = (rows, ...must) => rows.map((r, i) => i).filter(i => must.every(m => (rows[i] || []).some(c => String(c ?? '').trim() === m)));
const w6Col = (rows, h, name) => (rows[h] || []).findIndex(c => String(c ?? '').trim() === name);
const w6ColLike = (rows, h, re) => (rows[h] || []).findIndex(c => re.test(String(c ?? '').trim()));
const w6Lbl = r => String((r || [])[0] ?? '').trim();

// ══ W6.1 THE BREAKOUTS WORKBOOK — every requirement, service and lane, the months and the CR windows ══════
await (async () => {
  const name = 'W6 — the breakouts workbook: every requirement, service, lane, month and window';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const X = w6Fresh(), G = boardFigures(X.ev), meta = w6Meta(X.ev);
  const { R, ids, svcSum } = w6Truth(G, meta), SV = G.svc, FY = X.ev('FYL()');
  const bk = JSON.parse(await workbook(X.w));
  chk(name, 'workbook', 'the workbook builds and reads back', bk.__err || 'ok', 'ok');
  chk(name, 'fixture', 'A alone carries an award date, in December (1–15)', X.ev(`JSON.stringify(Object.keys(S.awards))+' '+S.awards.A.d+' '+S.awards.A.day`), '["A"] ' + X.ev('FYMON[2][0]') + ' 7');
  chk(name, 'fixture', 'every requirement is funded somewhere, and two are trimmed', ids.filter(id => R[id].fT > 0.5).length + ':' + ids.filter(id => R[id].trimT > 0.5).length, '5:3');
  const cell = (rows, h, row, col) => { const c = w6Col(rows, h, col); return c < 0 ? 'no column ' + col : num((row || [])[c]); };

  // ---- Funding Streams: every service row, every column
  {
    const fs = bk['Funding Streams'] || [], h = w6Hdrs(fs, 'Service', 'Disc Funded')[0];
    const ask = svcSum(() => true, 'ask'), d = svcSum(() => true, 'd'), m = svcSum(() => true, 'm');
    const tr = svcSum(() => true, 'trim'), by = svcSum(() => true, 'beyond'), du = svcSum(() => true, 'du'), un = svcSum(() => true, 'unf');
    SV.forEach((sv, i) => {
      const row = fs.find((r, j) => j > h && w6Lbl(r) === sv);
      const want = { [FY + ' Ask']: ask[i], 'Disc BA': G.discBA[i], 'Disc Funded': d[i], 'Disc Remaining': Math.max(0, G.discBA[i] - d[i]),
        'Mand BA': G.mandBA[i], 'Mand Funded': m[i], 'Mand Remaining': Math.max(0, G.mandBA[i] - m[i]), 'Funded Total': d[i] + m[i],
        'Ask Not Allocated (delta)': tr[i], 'Beyond Both Lanes': by[i], 'Unfunded vs DISC': du[i], 'TOTAL UNFUNDED': un[i] };
      Object.keys(want).forEach(k => chk(name, 'Funding Streams · ' + sv, k, cell(fs, h, row, k), want[k]));
    });
  }

  // ---- Decision Bands: every requirement row, per service and lane; the band summary; the running total in a band
  {
    const db = bk['Decision Bands'] || [], hs = w6Hdrs(db, 'Rank', 'Band', 'PMO');
    chk(name, 'Decision Bands', 'a detail table per band in use', hs.length, 2);
    const seen = [];
    const cum = {};
    hs.forEach(h => {
      const tc = w6ColLike(db, h, /^Requirement/);
      for (let j = h + 1; j < db.length && w6Lbl(db[j]) && !/^Subtotal/.test(w6Lbl(db[j])); j++) {
        const row = db[j], id = ids.find(x => R[x].title === String(row[tc] ?? '').trim()); if (!id) continue;
        seen.push(id); const v = R[id], b = String(v.band);
        cum[b] = (cum[b] || 0) + v.fT;
        const want = { [FY + ' Requirement']: v.askT, 'DISC TOTAL': v.dT, 'MAND TOTAL': v.mT, 'FUNDED TOTAL': v.fT, 'UNFUNDED TOTAL': v.unfT,
          'UNFUNDED vs DISC': v.duT, 'Cum funded in band': cum[b] };
        SV.forEach((sv, i) => { want[sv + ' Disc'] = v.d[i]; want[sv + ' Mand'] = v.m[i]; want[sv + ' Funded'] = v.f[i]; want[sv + ' Unfunded'] = v.unf[i]; });
        Object.keys(want).forEach(k => chk(name, 'Decision Bands · ' + id, k, cell(db, h, row, k), want[k]));
      }
    });
    chk(name, 'Decision Bands', 'every requirement is a row, once', seen.slice().sort().join(','), ids.slice().sort().join(','));
    const hb = w6Hdrs(db, 'Band', 'Band name', 'Reqs')[0];
    [['1', id => R[id].band === 1], ['—', id => R[id].band === null]].forEach(([lbl, pick]) => {
      const row = db.find((r, j) => j > hb && w6Lbl(r) === lbl), mem = ids.filter(pick);
      const want = { Reqs: mem.length, [FY + ' Requirement']: w6S(mem.map(id => R[id].askT)), Disc: w6S(mem.map(id => R[id].dT)), Mand: w6S(mem.map(id => R[id].mT)),
        Funded: w6S(mem.map(id => R[id].fT)), Unfunded: w6S(mem.map(id => R[id].unfT)), 'Unfunded vs DISC': w6S(mem.map(id => R[id].duT)) };
      Object.keys(want).forEach(k => chk(name, 'Decision Bands · band ' + lbl, k, cell(db, hb, row, k), want[k]));
    });
  }

  // ---- the three per-requirement lists and the unfunded sheet: who is listed, and every service column
  {
    const list = (sheet, amt, pick, perSvc, total) => {
      const rows = bk[sheet] || [], h = w6Hdrs(rows, 'Rank', amt)[0], tc = w6ColLike(rows, h, /^Requirement/);
      const got = [];
      rows.forEach((row, j) => { if (j <= h) return; const id = ids.find(x => R[x].title === String((row || [])[tc] ?? '').trim()); if (!id) return;
        got.push(id); chk(name, sheet + ' · ' + id, amt, cell(rows, h, row, amt), total(R[id]));
        Object.keys(perSvc).forEach(lab => SV.forEach((sv, i) => chk(name, sheet + ' · ' + id, lab.replace('#', sv), cell(rows, h, row, lab.replace('#', sv)), perSvc[lab](R[id])[i]))); });
      chk(name, sheet, 'lists exactly the requirements it is for', got.sort().join(','), ids.filter(id => pick(R[id])).sort().join(','));
      return { rows, h, got };
    };
    list('Funded - Discretionary', 'Disc portion', v => v.dT > 0.005, { '#': v => v.d }, v => v.dT);
    list('Funded - Mandatory', 'Mand portion', v => v.mT > 0.005, { '#': v => v.m }, v => v.mT);
    const mc = list('Mission Critical', 'MC requirement (memo — not additive)', v => v.mc && v.duT > 0.005, { '#': v => v.ask, 'Short #': v => v.du }, v => v.askT);
    mc.got.forEach(id => chk(name, 'Mission Critical · ' + id, '★ Short vs DISC', cell(mc.rows, mc.h, mc.rows.find(r => (r || []).includes(R[id].title)), '★ Short vs DISC'), R[id].duT));
    const uf = list('Unfunded Requirements', 'TOTAL Unfunded', v => v.duT > 0.005 || v.unfT > 0.005, { 'Unf #': v => v.unf }, v => v.unfT);
    uf.got.forEach(id => { const row = uf.rows.find(r => (r || []).includes(R[id].title)), v = R[id];
      [[FY + ' Ask', v.askT], ['Allocated', v.basisT], ['Trim, by service', v.trimT], ['Beyond Both Lanes', v.beyondT], ['Unfunded vs DISC', v.duT]]
        .forEach(([k, want]) => chk(name, 'Unfunded Requirements · ' + id, k, cell(uf.rows, uf.h, row, k), want)); });
  }

  // ---- the PMO Matrix: every office, every service, both lanes; the budget-authority and unfunded blocks by service
  {
    const pm = bk['PMO Matrix'] || [], h = w6Hdrs(pm, 'PMO', 'TOTAL Disc')[0];
    const grps = [...new Set(ids.map(id => R[id].grp))];
    grps.forEach(g => {
      const row = pm.find((r, j) => j > h && w6Lbl(r) === g), mem = ids.filter(id => R[id].grp === g);
      const want = { 'TOTAL Disc': w6S(mem.map(id => R[id].dT)), 'TOTAL Mand': w6S(mem.map(id => R[id].mT)),
        '★ MC requirement (memo)': w6S(mem.filter(id => R[id].mc).map(id => R[id].askT)), '★ MC short vs Disc': w6S(mem.filter(id => R[id].mc).map(id => R[id].duT)) };
      SV.forEach((sv, i) => { want[sv + ' Disc'] = w6S(mem.map(id => R[id].d[i])); want[sv + ' Mand'] = w6S(mem.map(id => R[id].m[i])); });
      Object.keys(want).forEach(k => chk(name, 'PMO Matrix · ' + g, k, cell(pm, h, row, k), want[k]));
    });
    const block = (lbl, perSvc, lane) => {
      const row = pm.find((r, j) => j > h && w6Lbl(r).startsWith(lbl));
      SV.forEach((sv, i) => chk(name, 'PMO Matrix · ' + lbl, sv + ' ' + lane, cell(pm, h, row, sv + ' ' + lane), perSvc[i]));
    };
    const d = svcSum(() => true, 'd'), m = svcSum(() => true, 'm');
    block('BUDGET AUTHORITY', G.discBA, 'Disc'); block('BUDGET AUTHORITY', G.mandBA, 'Mand');
    block('REMAINING', G.discBA.map((b, i) => Math.max(0, b - d[i])), 'Disc'); block('REMAINING', G.mandBA.map((b, i) => Math.max(0, b - m[i])), 'Mand');
    block('UNFUNDED (beyond both lanes)', svcSum(() => true, 'beyond'), 'Disc');
    block('ASK NOT ALLOCATED', svcSum(() => true, 'trim'), 'Disc');
    block('TOTAL UNFUNDED', svcSum(() => true, 'unf'), 'Disc');
    block('UNFUNDED vs DISC', svcSum(() => true, 'du'), 'Disc');
  }

  // ---- every PMO tab: its four portion sections and its obligation report, every requirement, service and month
  {
    const PORTION = { 'Disc portion': ['d', v => v.dT > 0.005], 'Mand portion': ['m', v => v.mT > 0.005],
      'MC requirement (memo — not additive)': ['ask', v => v.mc && v.duT > 0.005], 'Total Unfunded (delta + beyond lanes)': ['unf', v => v.unfT > 0.005] };
    const decIdx = 2;                                     // A's award: December, FYMON[2]
    const grps = [...new Set(ids.map(id => R[id].grp))];
    grps.forEach(g => {
      const rows = bk['PMO ' + g] || [], mem = ids.filter(id => R[id].grp === g);
      chk(name, 'PMO ' + g, 'the tab is in the workbook', rows.length > 0, true);
      Object.keys(PORTION).forEach(amt => {
        const [k, pick] = PORTION[amt], h = w6Hdrs(rows, 'Rank', amt)[0], want = mem.filter(id => pick(R[id]));
        if (h === undefined) { chk(name, 'PMO ' + g + ' · ' + amt, 'the section is there when the office has such a requirement', want.length, 0); return; }
        const tc = w6ColLike(rows, h, /^Requirement/), got = [];
        for (let j = h + 1; j < rows.length && !/^Subtotal/.test(w6Lbl(rows[j])) && w6Lbl(rows[j]); j++) {
          const id = ids.find(x => R[x].title === String(rows[j][tc] ?? '').trim()); if (!id) continue; got.push(id);
          chk(name, 'PMO ' + g + ' · ' + id, amt, cell(rows, h, rows[j], amt), w6S(R[id][k]));
          SV.forEach((sv, i) => chk(name, 'PMO ' + g + ' · ' + id, amt + ' — ' + sv, cell(rows, h, rows[j], sv), R[id][k][i]));
        }
        chk(name, 'PMO ' + g + ' · ' + amt, 'lists exactly its requirements', got.sort().join(','), want.sort().join(','));
      });
      const h = w6Hdrs(rows, 'Rank', 'Total (Disc+Mand)')[0];
      chk(name, 'PMO ' + g, 'the obligation report is on the tab', h !== undefined, true);
      if (h === undefined) return;
      const tc = w6ColLike(rows, h, /^Requirement/), m0 = w6Col(rows, h, 'OCT 26'), un = w6Col(rows, h, 'Unscheduled');
      chk(name, 'PMO ' + g, 'twelve month columns, then Unscheduled', un - m0, 12);
      const got = [];
      for (let j = h + 1; j < rows.length && w6Lbl(rows[j]) && !/^TOTAL/.test(w6Lbl(rows[j])); j++) {
        const id = ids.find(x => R[x].title === String(rows[j][tc] ?? '').trim()); if (!id) continue; got.push(id);
        const v = R[id], row = rows[j];
        const want = { [FY + ' Ask']: v.askT, 'Disc allocated': v.dT, 'Total (Disc+Mand)': v.fT, 'UFR (Unfunded Requirement)': v.unfT };
        SV.forEach((sv, i) => { want[sv + ' Disc'] = v.d[i]; want[sv + ' Mand'] = v.m[i]; });
        Object.keys(want).forEach(k => chk(name, 'PMO ' + g + ' · report · ' + id, k, cell(rows, h, row, k), want[k]));
        // WHERE THE MONEY LANDS, from the fixture's own dates: A's award is in December, nobody else has one
        for (let k = 0; k < 12; k++) chk(name, 'PMO ' + g + ' · report · ' + id, 'month ' + String(rows[h][m0 + k]), num(row[m0 + k]), (id === 'A' && k === decIdx) ? v.fT : 0);
        chk(name, 'PMO ' + g + ' · report · ' + id, 'Unscheduled', num(row[un]), id === 'A' ? 0 : v.fT);
      }
      chk(name, 'PMO ' + g + ' · report', 'every funded requirement of the office is a row', got.sort().join(','), mem.filter(id => R[id].fT > 0.005).sort().join(','));
    });
  }

  // ---- CR Cash Needs: every requirement line under every service, window by window
  {
    const cr = bk['CR Cash Needs'] || [], h = w6Hdrs(cr, 'Service / Requirement', 'No date')[0];
    const tw = w6Col(cr, h, 'TOTAL IN WINDOW');
    SV.forEach((sv, i) => {
      const at = cr.findIndex((r, j) => j > h && w6Lbl(r) === sv);
      const lines = [];
      for (let j = at + 1; j < cr.length && /^#/.test(w6Lbl(cr[j])); j++) lines.push(cr[j]);
      const fa = R.A.f[i];
      chk(name, 'CR Cash Needs · ' + sv, 'one requirement line when A is funded here, none otherwise', lines.length, fa > 0.005 ? 1 : 0);
      lines.forEach(row => {
        chk(name, 'CR Cash Needs · ' + sv, 'the line is A’s', /^#1 /.test(w6Lbl(row)), true);
        for (let w = 0; w < 12; w++) chk(name, 'CR Cash Needs · ' + sv + ' · A', 'window ' + (w + 1), num(row[1 + w]), w === 4 ? fa : 0);
        chk(name, 'CR Cash Needs · ' + sv + ' · A', 'TOTAL IN WINDOW', num(row[tw]), fa);
      });
    });
  }

  // ---- the RCN-EEIC and SI Codes month sheets: every service block, month by month; the requirement lines
  {
    const decIdx = 2;
    const sheets = JSON.parse(X.ev(`JSON.stringify({'RCN-EEIC by Month':RCN_SVCS.map(function(s){ return [s,s]; }), 'SI Codes by Month':CR_SVCS.map(function(s){ return [s, crSvcName(s)]; })})`));
    Object.keys(sheets).forEach(sn => {
      const rows = bk[sn] || [];
      chk(name, sn, 'the sheet is in the workbook', rows.length > 0, true);
      sheets[sn].forEach(([sv, lab]) => {
        const i = SV.indexOf(sv); if (i < 0) return;
        const want = Array(12).fill(0); want[decIdx] = R.A.f[i];
        const nod = w6S(ids.filter(id => id !== 'A').map(id => R[id].f[i]));
        chk(name, sn + ' · ' + lab, 'the service’s TOTAL rows are on the sheet (a block, and on RCN its requirement section)',
          rows.filter(row => w6Lbl(row) === lab + ' TOTAL').length, sn === 'RCN-EEIC by Month' ? 2 : 1);
        rows.forEach((row, j) => { if (w6Lbl(row) !== lab + ' TOTAL') return;
          for (let k = 0; k < 12; k++) chk(name, sn + ' · ' + lab + ' (row ' + j + ')', 'month ' + (k + 1), num(row[1 + k]), want[k]);
          chk(name, sn + ' · ' + lab + ' (row ' + j + ')', 'NO DATE', num(row[13]), nod);
          chk(name, sn + ' · ' + lab + ' (row ' + j + ')', 'TOTAL', num(row[14]), want[decIdx] + nod); });
      });
      if (sn !== 'RCN-EEIC by Month') return;
      // WHICH REQUIREMENTS SIT UNDER EACH COMBINATION: a line per funded requirement, the unfunded asks listed below
      sheets[sn].forEach(([sv]) => {
        const i = SV.indexOf(sv);
        const h = rows.findIndex((r, j) => j > 0 && w6Lbl(r) === sv && /^Combination/.test(w6Lbl(rows[j + 1])));
        chk(name, sn + ' · ' + sv, 'the requirement section is there', h > 0, true);
        if (h <= 0) return;
        const hh = h + 1, fa = w6Col(rows, hh, FY + ' Ask');
        const funded = [], unfunded = [];
        let notFunded = false;
        for (let j = hh + 1; j < rows.length && w6Lbl(rows[j]) !== SV[i + 1] && !(j > hh + 1 && /^Combination/.test(w6Lbl(rows[j]))); j++) {
          const lb = w6Lbl(rows[j]); if (/^NOT FUNDED/.test(lb)) notFunded = true;
          const mt = /^#(\d+)\s+(.*)$/.exec(lb); if (!mt) continue;
          const id = ids.find(x => R[x].rank === +mt[1]); if (!id) continue;
          (notFunded ? unfunded : funded).push(id);
          chk(name, sn + ' · ' + sv + ' · ' + id, FY + ' Ask', num(rows[j][fa]), R[id].ask[i]);
          if (notFunded) continue;
          for (let k = 0; k < 12; k++) chk(name, sn + ' · ' + sv + ' · ' + id, 'month ' + (k + 1), num(rows[j][1 + k]), (id === 'A' && k === decIdx) ? R[id].f[i] : 0);
          chk(name, sn + ' · ' + sv + ' · ' + id, 'NO DATE', num(rows[j][13]), id === 'A' ? 0 : R[id].f[i]);
        }
        chk(name, sn + ' · ' + sv, 'a line for every requirement funded on the service', funded.sort().join(','), ids.filter(id => R[id].f[i] > 0.005).sort().join(','));
        chk(name, sn + ' · ' + sv, 'and every unfunded ask on it listed below', unfunded.sort().join(','), ids.filter(id => R[id].f[i] <= 0.005 && R[id].ask[i] > 0.005).sort().join(','));
      });
    });
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm); await settleBoards();
})();

// ══ W6.2 THE PRIORITY DRILL, THE DECK AND THE EXECUTIVE SYNOPSIS — every requirement and service ═════════
await (async () => {
  const name = 'W6 — the priority drill: every requirement, service and lane';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const X = w6Fresh(), G = boardFigures(X.ev), meta = w6Meta(X.ev);
  const { R, ids, svcSum } = w6Truth(G, meta), SV = G.svc, FY = X.ev('FYL()');
  const cell = (rows, h, row, col) => { const c = w6Col(rows, h, col); return c < 0 ? 'no column ' + col : num((row || [])[c]); };
  const grps = [...new Set(ids.map(id => R[id].grp))];
  // ---- the Priority Drill, read back from its bytes
  const dk = JSON.parse(await w6Book(X.w, 'exportCSV'));
  chk(name, 'drill', 'the priority drill builds and reads back', dk.__err || 'ok', 'ok');
  const reqRow = (rows, v) => {
    const h = w6Hdrs(rows, 'Rank', 'Funded').filter(x => rows.slice(x + 1).some(r => (r || []).some(c => String(c ?? '').trim() === v.title)))[0];
    const tc = h === undefined ? -1 : w6ColLike(rows, h, /^Requirement/);
    return { h, row: h === undefined ? null : rows.slice(h + 1).find(r => String((r || [])[tc] ?? '').trim() === v.title) };
  };
  const drillRow = (rows, where, id) => {
    const v = R[id], { h, row } = reqRow(rows, v);
    chk(name, where + ' · ' + id, 'the requirement is a row', !!row, true); if (!row) return;
    const want = { [FY + ' Requirement']: v.askT, Allocated: v.basisT, Discretionary: v.dT, Mandatory: v.mT, Funded: v.fT, Unfunded: v.unfT, 'Unfunded vs DISC': v.duT };
    SV.forEach((sv, i) => { want[sv + ' funded'] = v.f[i]; });
    Object.keys(want).forEach(k => chk(name, where + ' · ' + id, k, cell(rows, h, row, k), want[k]));
  };
  ids.forEach(id => drillRow(dk['1-N by Band'] || [], '1-N by Band', id));
  grps.forEach(g => {
    const rows = dk[g] || [], mem = ids.filter(id => R[id].grp === g);
    mem.forEach(id => drillRow(rows, 'drill tab ' + g, id));
    const h = w6Hdrs(rows, 'Rank', 'Funded')[0], all = rows.find(r => w6Lbl(r) === g + ' — all bands');
    [[FY + ' Requirement', 'askT'], ['Discretionary', 'dT'], ['Mandatory', 'mT'], ['Funded', 'fT'], ['Unfunded', 'unfT'], ['Unfunded vs DISC', 'duT']]
      .forEach(([k, f]) => chk(name, 'drill tab ' + g, g + ' — all bands: ' + k, cell(rows, h, all, k), w6S(mem.map(id => R[id][f]))));
  });
  {
    const sm = dk.Summary || [], ba = sm.findIndex(r => w6Lbl(r) === 'BUDGET AUTHORITY');
    const hb = sm[ba] || [], vb = sm[ba + 1] || [];
    const at = k => hb.findIndex(c => String(c ?? '').trim() === k);
    chk(name, 'drill Summary', 'budget authority: discretionary, mandatory, whole', [num(vb[at('Discretionary')]), num(vb[at('Mandatory')]), num(vb[at('Whole budget')])].join('|'),
      [w6S(G.discBA), w6S(G.mandBA), w6S(G.discBA) + w6S(G.mandBA)].join('|'));
    const h = w6Hdrs(sm, 'Band', 'Band name', 'Reqs')[0];
    [['1', id => R[id].band === 1], ['—', id => R[id].band === null]].forEach(([lbl, pick]) => {
      const row = sm.find((r, j) => j > h && w6Lbl(r) === lbl), mem = ids.filter(pick);
      [['Reqs', mem.length], [FY + ' Requirement', w6S(mem.map(id => R[id].askT))], ['Discretionary', w6S(mem.map(id => R[id].dT))], ['Mandatory', w6S(mem.map(id => R[id].mT))],
       ['Funded', w6S(mem.map(id => R[id].fT))], ['Unfunded', w6S(mem.map(id => R[id].unfT))]].forEach(([k, want]) => chk(name, 'drill Summary · band ' + lbl, k, cell(sm, h, row, k), want));
    });
    const hp = w6Hdrs(sm, 'PMO', 'unbanded', 'TOTAL')[0];
    grps.forEach(g => { const row = sm.find((r, j) => j > hp && w6Lbl(r) === g), mem = ids.filter(id => R[id].grp === g);
      chk(name, 'drill Summary · funded by PMO and band', g + ': Band 1', cell(sm, hp, row, 'Band 1'), w6S(mem.filter(id => R[id].band === 1).map(id => R[id].fT)));
      chk(name, 'drill Summary · funded by PMO and band', g + ': unbanded', cell(sm, hp, row, 'unbanded'), w6S(mem.filter(id => R[id].band === null).map(id => R[id].fT)));
      chk(name, 'drill Summary · funded by PMO and band', g + ': TOTAL', cell(sm, hp, row, 'TOTAL'), w6S(mem.map(id => R[id].fT))); });
  }
  // (v2.05, item 114: the deck's tables and the Executive Funding Synopsis were checked here, and went with them.)
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm); await settleBoards();
})();

// ══ W6.3 TRIM ABSORPTION — every requirement and service, by a walk written here ═════════════════════════
// The board suite holds trimAbsorb to its identities (trim = take + beyond, the lane never overdrawn, the
// earliest row first). This holds every figure to a walk done here from the fixture: the lanes as the walk
// leaves them, then each trim in priority order taking what its own service's lane still has.
await (async () => {
  const name = 'W6 — trim absorption: every requirement and service, from the fixture';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const SVx = ['USAF', 'ANG', 'AFRC'];
  const sc2 = { services: SVx,
    items: [it('A', 'ATL', [100, 50, 40]), it('B', 'PSM', [80, 30, 20]), it('C', 'AV', [400, 20, 60]), it('D', 'MxS', [40, 10, 10]), it('E', 'TSS', [30, 25, 0])],
    disc: [200, 125, 85], mand: [0, 0, 0], order: ['A', 'B', 'C', 'D', 'E'],
    alloc: { A: { m: 's', v: [70, 40, 30] }, B: { m: 's', v: [50, 20, 10] }, C: { m: 's', v: [30, 10, 20] }, E: { m: 's', v: [10, 5, 0] } } };
  const X = boot(); seed(X.ev, sc2);
  // the walk, here: each service's lane pays each allocation in order until it is dry
  const rem = sc2.disc.slice(), basis = {}, trim = {};
  sc2.order.forEach(id => { const a = sc2.items.find(x => x.id === id).ask, al = (sc2.alloc[id] || {}).v || a;
    basis[id] = a.map((v, i) => Math.min(v, al[i])); trim[id] = a.map((v, i) => Math.max(0, v - basis[id][i]));
    basis[id].forEach((b, i) => { rem[i] -= Math.min(b, Math.max(0, rem[i])); }); });
  const start = rem.slice(), left = rem.slice(), take = {};
  sc2.order.forEach(id => { take[id] = trim[id].map((t, i) => { const k = Math.min(t, Math.max(0, left[i])); left[i] -= k; return k; }); });
  const listed = sc2.order.filter(id => w6S(trim[id]) > 0.005);
  chk(name, 'fixture', 'two services have lane left, so the order and the per-service rule both matter', start.filter(v => v > 0).length, 2);
  chk(name, 'fixture', 'several trimmed rows take from one lane, and one of them only in part',
    listed.filter(id => take[id][1] > 0).length + ':' + listed.some(id => SVx.some((_, i) => take[id][i] > 0 && trim[id][i] - take[id][i] > 0)), '4:true');
  const A = JSON.parse(X.ev(`(function(){ var A=trimAbsorb(tiers()); return JSON.stringify({start:A.start, left:A.left, taken:A.taken,
    rows:A.rows.map(function(x){ return {id:x.id, trim:x.trim, take:x.take, beyond:x.beyond}; })}); })()`));
  chk(name, 'lane', 'what each service’s lane still holds after the walk', JSON.stringify(A.start), JSON.stringify(start));
  chk(name, 'lane', 'and what it holds once the trims have taken their share', JSON.stringify(A.left), JSON.stringify(left));
  chk(name, 'lane', 'taken, per service', JSON.stringify(A.taken), JSON.stringify(start.map((s, i) => s - left[i])));
  chk(name, 'rows', 'every trimmed requirement, in priority order', A.rows.map(r => r.id).join(','), listed.join(','));
  A.rows.forEach(r => SVx.forEach((sv, i) => {
    chk(name, r.id + ' · ' + sv, 'trimmed by', r.trim[i], trim[r.id][i]);
    chk(name, r.id + ' · ' + sv, 'could be funded now from the lane', r.take[i], take[r.id][i]);
    chk(name, r.id + ' · ' + sv, 'still beyond the lane', r.beyond[i], trim[r.id][i] - take[r.id][i]);
  }));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm); await settleBoards();
})();

// v2.19 (item 150): removed with its feature -- W6 — the funds flow: every appropriation, requirement and service, and another plan year

// ══ W6.5 MISSION CRITICAL BY SERVICE — mcCalc and the scoreboard tile that prints it ═════════════════════
await (async () => {
  const name = 'W6 — mission critical by service: mcCalc and the scoreboard';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const X = w6Fresh(), G = boardFigures(X.ev), meta = w6Meta(X.ev);
  const { R, svcSum } = w6Truth(G, meta), SV = G.svc;
  const tot = svcSum(id => R[id].mc, 'ask'), need = svcSum(id => R[id].mc, 'du');
  const M = JSON.parse(X.ev(`JSON.stringify(mcCalc(tiers()).bySvc)`));
  SV.forEach((sv, i) => chk(name, 'mcCalc · ' + sv, 'must-pay value, need above discretionary, and the lane’s BA',
    [M[i].s, M[i].tot, M[i].need, M[i].ba].join('|'), [sv, tot[i], need[i], G.discBA[i]].join('|')));
  chk(name, 'fixture', 'more than one service has an MC need', need.filter(v => v > 0.5).length > 1, true);
  const tip = X.ev(`(function(){ render(); var e=document.querySelector('#scores .sc.mc .sub'); return e? e.getAttribute('title')||'' : ''; })()`);
  const fM = v => X.ev(`fM(${v})`);
  SV.forEach((sv, i) => {
    const seg = tip.split(' · ').find(s => s.startsWith(sv + ':')) || '';
    chk(name, 'scoreboard · ' + sv, 'the tile states its must-pay, its BA and its need', seg,
      sv + ': must-pay ' + fM(tot[i]) + ' vs disc BA ' + fM(G.discBA[i]) + (need[i] > 0.5 ? ' → need ' + fM(need[i]) : (tot[i] > G.discBA[i] ? ' (lane not spent out — no need)' : '')));
  });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm); await settleBoards();
})();

// ══ W6.6 A LOCK KEEPS EACH LANE APART, THE COMPARISON STATES BOTH POTS, THE VIEW IS THE LOCK ═════════════
await (async () => {
  const name = 'W6 — a lock keeps each lane apart, the comparison states both pots, and the view is the lock';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const SVx = ['USAF', 'ANG', 'AFRC'];
  const X = boot();
  seed(X.ev, { services: SVx, items: [it('A', 'PSM', [900, 200, 100]), it('B', 'ATL', [300, 50, 25]), it('C', 'TSS', [120, 30, 15])],
    disc: [800, 150, 60], mand: [300, 60, 40], order: ['A', 'B', 'C'] });
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); MS.years[MS.cur]=S; save(); 'ok'`);
  const T0 = JSON.parse(X.ev(`(function(){ var T=tiers(), o={}; S.order.forEach(function(id){ o[id]={d:T[id].d.slice(), m:T[id].m.slice()}; }); return JSON.stringify(o); })()`));
  chk(name, 'fixture', 'A draws both lanes on every service; B only mandatory', JSON.stringify([T0.A.d.every(v => v > 0) && T0.A.m.every(v => v > 0), w6S(T0.B.d), w6S(T0.B.m) > 0]), '[true,0,true]');
  X.ev(`blCyc='PB'; blYr=MS.cur; cycLock(); 'ok'`);
  const key = 'PB|' + X.ev('MS.cur');
  const P = JSON.parse(X.ev(`JSON.stringify(blGet('${key}').proj[MS.cur].reqs.map(function(r){ return {id:r.id, d:r.d, m:r.m}; }))`));
  ['A', 'B', 'C'].forEach(id => { const p = P.find(r => r.id === id) || { d: [], m: [] };
    chk(name, 'lock · ' + id, 'discretionary by service, as the lane walk drew it', JSON.stringify(p.d), JSON.stringify(T0[id].d));
    chk(name, 'lock · ' + id, 'mandatory by service, as the lane walk drew it', JSON.stringify(p.m), JSON.stringify(T0[id].m)); });
  // the working plan moves both pots (held in the budget mix, which the pots are derived from); the comparison's
  // Changes sheet states each pot, A, B and the difference
  X.ev(`S.bm.disc[1]+=7000; S.bm.mand[2]+=3000; applyState(S); MS.years[MS.cur]=S; save(); cycCmpA='${key}'; cycCmpB='working'; 'ok'`);
  const wb = JSON.parse(await w6Book(X.w, 'exportCycCompare'));
  chk(name, 'workbook', 'the comparison builds and reads back', wb.__err || 'ok', 'ok');
  const ch = wb.Changes || [], fy = X.ev('FYL()');
  const pot = lab => (ch.find(r => String((r || [])[0] ?? '') === fy && String((r || [])[1] ?? '') === lab) || []).slice(6, 9).map(num).join(':');
  chk(name, 'Changes · pots', 'Discretionary BA: A, B and the difference', pot('Discretionary BA'), [1010, 8010, 7000].join(':'));
  chk(name, 'Changes · pots', 'Mandatory BA: A, B and the difference', pot('Mandatory BA'), [400, 3400, 3000].join(':'));
  // THE LOCKED VIEW IS THE LOCK. The working plan has moved (pots, and B's requirement below); put the lock on the
  // drill and every requirement's requirement, discretionary and mandatory, service by service, is the lock's projection
  X.ev(`S.asks=S.asks||{}; S.asks.B=[350,50,25]; applyState(S); MS.years[MS.cur]=S; save(); 'ok'`);
  const V = JSON.parse(X.ev(`(function(){ cycView('${key}'); var T=tiers(), o={view:CYCVIEW, pots:[discTot(), mandTot()], rows:{}};
    S.order.forEach(function(id){ var it=itemById(id); o.rows[id]={ask:it.ask.slice(), d:T[id].d.slice(), m:T[id].m.slice()}; });
    cycLeave(); o.left=CYCVIEW; return JSON.stringify(o); })()`));
  const PJ = JSON.parse(X.ev(`JSON.stringify(blGet('${key}').proj[MS.cur])`));
  chk(name, 'locked view', 'the view opened on the lock and closed again', V.view + '|' + V.left, key + '|');
  chk(name, 'locked view', 'the pots on the view are the lock’s, not the moved ones', V.pots.join(':'), [w6S(PJ.disc), w6S(PJ.mand)].join(':'));
  chk(name, 'locked view', 'every requirement on the view, as locked', Object.keys(V.rows).sort().join(','), PJ.reqs.map(r => r.id).sort().join(','));
  PJ.reqs.forEach(p => { const v = V.rows[p.id] || {};
    chk(name, 'locked view · ' + p.id, 'requirement, discretionary and mandatory, service by service, are the projection’s', JSON.stringify([v.ask, v.d, v.m]), JSON.stringify([p.ask, p.d, p.m])); });
  chk(name, 'locked view', 'and B’s requirement on the view is the locked one, not the working plan’s', JSON.stringify((V.rows.B || {}).ask), JSON.stringify([300, 50, 25]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm); await settleBoards();
})();
// ══ W6.7 THE COST-ELEMENT SHEETS — every cost element, service and lane (a board that carries them) ═══════
// The Cost Element Matrix and CE by PMO appear only on a board with cost elements. audit.mjs holds the
// matrix's discretionary columns and MC rules in total; this holds every cost element's row, both lanes,
// every service, and the office lines beneath it, to the lane walk.
await (async () => {
  const name = 'W6 — the cost-element sheets: every cost element, service and lane';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const SVx = ['STOVL', 'CV', 'CTOL'];
  const X = boot();
  X.ev(`DATA.costElems = true; 'ok'`);
  seed(X.ev, { services: SVx, items: [it('A', 'ATL', [50, 20, 10]), it('B', 'PSM', [40, 30, 5]), it('C', 'AV', [30, 10, 20]), it('D', 'MxS', [25, 15, 5])],
    disc: [60, 25, 12], mand: [40, 20, 10], order: ['A', 'B', 'C', 'D'], mc: { C: true, D: true }, alloc: { B: { m: 's', v: [30, 20, 3] } } });
  X.ev(`S.costElem = {A:'Airframe PGSE', B:'Engine PGSE', C:'Airframe PGSE', D:'Avionics PGSE'}; 'ok'`);
  const G = boardFigures(X.ev), meta = w6Meta(X.ev);
  const { R, ids, svcSum } = w6Truth(G, meta);
  const ce = JSON.parse(X.ev('JSON.stringify(S.costElem)'));
  const bk = JSON.parse(await workbook(X.w));
  chk(name, 'workbook', 'the workbook builds and reads back, with both cost-element sheets', [bk.__err || 'ok', !!bk['Cost Element Matrix'], !!bk['CE by PMO']].join(' '), 'ok true true');
  const cell = (rows, h, row, col) => { const c = w6Col(rows, h, col); return c < 0 ? 'no column ' + col : num((row || [])[c]); };
  const cm = bk['Cost Element Matrix'] || [], h = w6Hdrs(cm, 'Cost Element', 'TOTAL Disc')[0];
  [...new Set(Object.values(ce))].forEach(k => {
    const row = cm.find((r, j) => j > h && w6Lbl(r) === k), mem = ids.filter(id => ce[id] === k);
    const want = { 'TOTAL Disc': w6S(mem.map(id => R[id].dT)), 'TOTAL Mand': w6S(mem.map(id => R[id].mT)),
      '★ MC requirement (memo)': w6S(mem.filter(id => R[id].mc).map(id => R[id].askT)), '★ MC short vs Disc': w6S(mem.filter(id => R[id].mc).map(id => R[id].duT)) };
    SVx.forEach((sv, i) => { want[sv + ' Disc'] = w6S(mem.map(id => R[id].d[i])); want[sv + ' Mand'] = w6S(mem.map(id => R[id].m[i])); });
    Object.keys(want).forEach(c => chk(name, 'Cost Element Matrix · ' + k, c, cell(cm, h, row, c), want[c]));
  });
  const d = svcSum(() => true, 'd'), m = svcSum(() => true, 'm');
  [['BUDGET AUTHORITY', G.discBA, 'Disc'], ['BUDGET AUTHORITY', G.mandBA, 'Mand'], ['REMAINING', G.discBA.map((b, i) => Math.max(0, b - d[i])), 'Disc'],
   ['REMAINING', G.mandBA.map((b, i) => Math.max(0, b - m[i])), 'Mand'], ['UNFUNDED (beyond both lanes)', svcSum(() => true, 'beyond'), 'Disc'],
   ['ASK NOT ALLOCATED', svcSum(() => true, 'trim'), 'Disc'], ['TOTAL UNFUNDED', svcSum(() => true, 'unf'), 'Disc'], ['UNFUNDED vs DISC', svcSum(() => true, 'du'), 'Disc']]
    .forEach(([lbl, v, lane]) => { const row = cm.find((r, j) => j > h && w6Lbl(r).startsWith(lbl));
      SVx.forEach((sv, i) => chk(name, 'Cost Element Matrix · ' + lbl, sv + ' ' + lane, cell(cm, h, row, sv + ' ' + lane), v[i])); });
  const cp = bk['CE by PMO'] || [], hp = w6Hdrs(cp, 'PMO / Cost Element', 'Reqs')[0];
  const cAmt = re => w6ColLike(cp, hp, re);
  const COLS = [['Reqs', /^Reqs$/, mem => mem.length], ['FY27 Ask', /Ask$/, mem => w6S(mem.map(id => R[id].askT))], ['Disc portion', /^Disc portion$/, mem => w6S(mem.map(id => R[id].dT))],
    ['MC requirement', /^★ MC requirement/, mem => w6S(mem.filter(id => R[id].mc).map(id => R[id].askT))], ['MC short', /^★ MC short/, mem => w6S(mem.filter(id => R[id].mc).map(id => R[id].duT))],
    ['Mand portion', /^Mand portion$/, mem => w6S(mem.map(id => R[id].mT))], ['Unfunded', /^Unfunded/, mem => w6S(mem.map(id => R[id].unfT))]];
  chk(name, 'CE by PMO', 'every money column is found by its heading', COLS.map(([k, re]) => cAmt(re) >= 0 ? k : 'MISSING ' + k).join(','), COLS.map(([k]) => k).join(','));
  let office = null, lines = 0;
  cp.forEach((row, j) => { if (j <= hp) return; const raw = String((row || [])[0] ?? ''), lb = raw.trim(); if (!lb || !COLS.every(([, re]) => cAmt(re) >= 0)) return;
    const isCe = /^\s/.test(raw); if (!isCe) office = lb;
    const mem = ids.filter(id => R[id].grp === office && (!isCe || ce[id] === lb));
    if (!mem.length) return;
    lines++;
    COLS.forEach(([k, re, f]) => chk(name, 'CE by PMO · ' + office + (isCe ? ' · ' + lb : ''), k, num(row[cAmt(re)]), f(mem))); });
  chk(name, 'CE by PMO', 'every office and every cost element under it is a line, and was held to the walk', lines + ':' + cp.filter((r, j) => j > hp && w6Lbl(r) && !/^Disc \+ Mand/.test(w6Lbl(r))).length,
    (n => n + ':' + n)(new Set(ids.map(id => R[id].grp)).size + new Set(ids.map(id => R[id].grp + '|' + ce[id])).size));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm); await settleBoards();
})();
// ==== end W6 ====

// ==== v1.95 W7: export defects the map found (item 60) ====
// ITEM 60 — THE FIVE EXPORT DEFECTS THE MONEY MAP FOUND (F1–F5). Each block reads what the export wrote back from its
// own bytes -- the board's reader (xlsxRead), or the package's parts themselves where the question is how a cell is
// stored and shown -- and holds every figure TO THE DOLLAR against numbers worked out here from the fixture (a $M
// cell is scaled to dollars first: compared in $M, the suite's 0.005 would be $5,000). Where the item asks for it,
// the file is held to the board's own placement as well (the forecast, the CR windows). A check that would pass on
// v1.94 too is labelled a control. tools/money-map.json cites these scenario names; renaming one fails the map.
const w7S = a => a.reduce((x, y) => x + y, 0);
// LARGEST REMAINDER, written here: floor every share, then a dollar each to the biggest fractions, ties to the first
const w7Lr = (total, w) => { const s = w7S(w), raw = w.map(x => s > 0 ? total * x / s : total / w.length), out = raw.map(Math.floor);
  let left = total - w7S(out);
  raw.map((v, i) => ({ i, f: v - Math.floor(v) })).sort((a, b) => (b.f - a.f) || (a.i - b.i)).forEach(o => { if (left > 0) { out[o.i]++; left--; } });
  return out; };
// the parts of a whole spread across the offices: each takes lr(total, w) (or tgt), each part by what each still has to take
const w7Split = (w, parts, tgt) => { const left = tgt ? tgt.slice() : w7Lr(w7S(parts), w);
  return parts.map(v => { const x = w7Lr(v, left); x.forEach((y, k) => { left[k] -= y; }); return x; }); };
// THE PACKAGE ITSELF: what an export wrote, part by part, parsed as XML by the board's window. Returns every part's
// well-formedness, the styles (number formats, cell formats, and the counts each list declares against what it holds)
// and, per sheet, every number cell as [ref, style, the text stored].
const w7Pkg = (W, fn) => JSON.parse(W.eval(`(function(){
  var cap=null,_B=window.Blob,msg='';
  window.alert=function(m){ msg+=String(m); }; window.confirm=function(){ return true; };
  window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
  try{ ${fn}(); }catch(e){ window.Blob=_B; return JSON.stringify({err:'threw '+String((e&&e.message)||e)}); }
  window.Blob=_B; if(!cap) return JSON.stringify({err:'no file: '+msg.slice(0,80)});
  var u=new Uint8Array(cap.buffer, cap.byteOffset, cap.byteLength), dv=new DataView(u.buffer, u.byteOffset, u.byteLength);
  var td=new TextDecoder(), parts={}, at=0;
  while(at+30<=u.length && dv.getUint32(at,true)===0x04034b50){
    var n=dv.getUint16(at+26,true), x=dv.getUint16(at+28,true), sz=dv.getUint32(at+18,true);
    parts[td.decode(u.subarray(at+30, at+30+n))]=td.decode(u.subarray(at+30+n+x, at+30+n+x+sz)); at+=30+n+x+sz; }
  var P=new DOMParser(), bad=[], doc={};
  Object.keys(parts).forEach(function(k){ var d=P.parseFromString(parts[k],'application/xml');
    if(d.getElementsByTagName('parsererror').length) bad.push(k); doc[k]=d; });
  var kids=function(e, t){ return e? [].filter.call(e.childNodes, function(c){ return c.nodeName===t; }) : []; };
  var st=doc['xl/styles.xml'], one=function(t){ return st.getElementsByTagName(t)[0]; };
  var nf={}; [].forEach.call(st.getElementsByTagName('numFmt'), function(e){ nf[e.getAttribute('numFmtId')]=e.getAttribute('formatCode'); });
  var xfs=kids(one('cellXfs'),'xf').map(function(e){ return {nf:e.getAttribute('numFmtId')||'0', font:e.getAttribute('fontId')||'0', fill:e.getAttribute('fillId')||'0'}; });
  var cnt=function(t, c){ var e=one(t); return [e? +e.getAttribute('count') : -1, kids(e, c).length]; };
  var counts={numFmts:cnt('numFmts','numFmt'), fonts:cnt('fonts','font'), fills:cnt('fills','fill'), cellXfs:cnt('cellXfs','xf')};
  var fills=kids(one('fills'),'fill').map(function(f){ var c=f.getElementsByTagName('fgColor')[0]; return c? c.getAttribute('rgb') : ''; });
  var names=[].map.call(doc['xl/workbook.xml'].getElementsByTagName('sheet'), function(e){ return e.getAttribute('name'); });
  var sheets={};
  names.forEach(function(nm, i){ var d=doc['xl/worksheets/sheet'+(i+1)+'.xml'], cells=[];
    if(d) [].forEach.call(d.getElementsByTagName('c'), function(c){ var v=c.getElementsByTagName('v')[0];
      if(v && !c.getAttribute('t')) cells.push([c.getAttribute('r'), +(c.getAttribute('s')||0), v.textContent]); });
    sheets[nm]=cells; });
  return JSON.stringify({bad:bad, nf:nf, xfs:xfs, fills:fills, counts:counts, sheets:sheets}); })()`));
// What a number cell's format shows: the built-in ids the writer uses, and the codes the package declares
const w7Fmt = (pk, s) => { const x = (pk.xfs || [])[s]; if (!x) return 'no style ' + s;
  return ({ 0: 'General', 2: '0.00', 4: '#,##0.00' })[x.nf] || pk.nf[x.nf] || ('id ' + x.nf); };
const w7Ser = n => new Date((n - 25569) * 86400000).toISOString().slice(0, 10);
const w7Ok = pk => [pk.err || 'ok', pk.bad && pk.bad.length ? 'unreadable ' + pk.bad.join(',') : 'every part reads',
  Object.entries(pk.counts || {}).filter(([, c]) => c[0] !== c[1]).map(([k, c]) => k + ' says ' + c[0] + ' holds ' + c[1]).join(';') || 'every count holds'].join(' · ');

// ══ W7.1 F1 — THE $M AND $K FILES: the Two-Plan Forecast month by month and plan by plan, the 1A9A (the ATR/BTR log went in v2.02) ═══
await (async () => {
  const name = 'W7 — F1: the $M and $K files hold the exact figure, and show it as before';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  // Odd dollars on purpose: $85,069 is 0.09 at two decimals of $M, $124,465 is 124.47 at two of $K. The pots bind,
  // so PLAN A (discretionary alone) and PLAN B (both pots) differ, and B and C draw both lanes on the board.
  const SVx = ['STOVL', 'USMC-C', 'USN'], ORD = ['A', 'B', 'C'];
  const ASK = { A: [123457, 1001, 7], B: [85069, 333, 0], C: [70001, 5003, 11] }, GRP = { A: 'AV', B: 'PSM', C: 'ATL' };
  const DISC = [150000, 1200, 10], MAND = [100000, 500, 10];
  const X = boot();
  seed(X.ev, { services: SVx, items: ORD.map(id => it(id, GRP[id], ASK[id])), disc: DISC, mand: MAND, order: ORD });
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.awards={A:{mode:'single', d:FYMON[2][0], day:3}, B:{mode:'single', d:FYMON[0][0], day:20}, C:{mode:'single', d:FYMON[2][0], day:18}};
    applyState(S); save(); 'ok'`);
  const MON = { A: 2, B: 0, C: 2 };                    // each award's fiscal month: A and C December, B October
  // THE TWO PLANS, walked here: each requirement takes its ask, service by service, while the pot lasts
  const walk = bud => { const rem = bud.slice(), got = {}; ORD.forEach(id => { got[id] = ASK[id].map((v, i) => { const g = Math.max(0, Math.min(v, rem[i])); rem[i] -= g; return g; }); }); return got; };
  const PLAN = { A: walk(DISC), B: walk(DISC.map((v, i) => v + MAND[i])) };
  chk(name, 'fixture', 'the pots bind: plan A funds less than plan B, and B is cut in plan A', [w7S(ORD.map(id => w7S(PLAN.A[id]))), w7S(ORD.map(id => w7S(PLAN.B[id]))), w7S(PLAN.A.B) < w7S(ASK.B)].join(' '), '151210 251718 true');
  const bk = JSON.parse(await workbook(X.w));
  chk(name, 'workbook', 'the workbook builds and reads back', bk.__err || 'ok', 'ok');
  const FY = X.ev('FYL()'), MN = JSON.parse(X.ev('JSON.stringify(FYMON.map(function(x){ return x[1]; }))'));
  const tp = bk[FY + ' Two-Plan Forecast'] || [];
  chk(name, 'Two-Plan Forecast', 'the sheet is in the workbook', tp.length > 0, true);
  // a row of the plan as dollars: twelve months, UNSCH, TOTAL
  const bag = ids => { const m = Array(12).fill(0); ids.forEach(([id, P]) => { m[MON[id]] += w7S(P[id]); }); return m.concat([0, w7S(m)]); };
  ['A', 'B'].forEach((pl, b) => {
    const top = tp.findIndex(r => new RegExp('^PLAN ' + pl + ' ').test(w6Lbl(r)));
    const end = b === 0 ? tp.findIndex((r, j) => j > top && /^PLAN B /.test(w6Lbl(r))) : tp.length;
    const hs = w6Hdrs(tp.slice(0, end), MN[0], 'UNSCH', 'TOTAL').filter(h => h > top);
    chk(name, 'Two-Plan Forecast · plan ' + pl, 'its ROLLUP and BY PMO tables are there', hs.length, 2);
    const P = PLAN[pl], want = [
      [hs[0], 'Miscellaneous OGC Efforts', bag(ORD.map(id => [id, P]))], [hs[0], 'TOTAL', bag(ORD.map(id => [id, P]))],
      ...ORD.map(id => [hs[1], GRP[id], bag([[id, P]])]), [hs[1], 'TOTAL', bag(ORD.map(id => [id, P]))]];
    want.forEach(([h, lbl, v]) => {
      const row = tp.find((r, j) => j > h && w6Lbl(r) === lbl);
      chk(name, 'Two-Plan Forecast · plan ' + pl + ' · ' + lbl, 'the row is there', !!row, true); if (!row) return;
      v.forEach((d, k) => chk(name, 'Two-Plan Forecast · plan ' + pl + ' · ' + lbl, (k < 12 ? MN[k] : (k === 12 ? 'UNSCH' : 'TOTAL')) + ', in dollars', num(row[1 + k]) * 1e6, d));
    });
  });
  // THE 1A9A ($K): each requirement's window, from the board's own lane walk written here, and the TOTAL
  const funded = {}; { const dr = DISC.slice(), mr = MAND.slice();
    ORD.forEach(id => { funded[id] = ASK[id].map((v, i) => { const d = Math.min(v, dr[i]); dr[i] -= d; const m = Math.min(v - d, mr[i]); mr[i] -= m; return d + m; }); }); }
  const WIN = { A: 4, B: 1, C: 5 };                    // Dec 1–15 (the 3rd), Oct 16–31 (the 20th), Dec 16–31 (the 18th)
  const cr = JSON.parse(await w6Book(X.w, 'crExport')), cs = Object.values(cr)[0] || [];
  chk(name, '1A9A', 'the return builds and reads back', cr.__err || (cs.length ? 'ok' : 'empty'), 'ok');
  const tot = Array(12).fill(0);
  ORD.forEach(id => { const row = cs.find(r => w6Lbl(r) === 'Ev ' + id) || [], f = w7S(funded[id]); tot[WIN[id]] += f;
    for (let w = 0; w < 12; w++) chk(name, '1A9A · ' + id, 'window ' + (w + 1) + ', in dollars', (num(row[7 + w]) || 0) * 1000, w === WIN[id] ? f : 0); });
  const tr = cs.find(r => w6Lbl(r) === 'TOTAL') || [];
  for (let w = 0; w < 12; w++) chk(name, '1A9A · TOTAL', 'window ' + (w + 1) + ', in dollars', (num(tr[7 + w]) || 0) * 1000, tot[w]);
  // SHOWN AS BEFORE (controls: v1.94 shows the same). The package opens -- every part reads and every list holds what
  // it says -- and every fraction in these files sits in a style whose format shows it as it always did.
  const SHOW = { [FY + ' Two-Plan Forecast']: '#,##0.00', 'O&M,N': '"$"#,##0.0' };
  [['exportExcel', FY + ' Two-Plan Forecast'], ['crExport', 'O&M,N']].forEach(([fn, sn]) => {
    const pk = w7Pkg(X.w, fn);
    chk(name, 'package · ' + fn, 'control: it is a well-formed package', w7Ok(pk), 'ok · every part reads · every count holds');
    const fr = ((pk.sheets || {})[sn] || []).filter(c => !Number.isInteger(+c[2]));
    chk(name, 'package · ' + sn, 'control: it has fractions to show', fr.length > 0, true);
    chk(name, 'package · ' + sn, 'control: each is shown by its format, as before', [...new Set(fr.map(c => w7Fmt(pk, c[1])))].join(' / '), SHOW[sn]);
  });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm); await settleBoards();
})();

// ══ W7.2 F1 — THE WRITER: the figure goes in as it is; a fraction in a General style gets that style's two-decimal twin ═
await (async () => {
  const name = 'W7 — F1: the writer stores every figure as it is, and a fraction in a plain style shows two decimals';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const X = boot();
  const XE = +X.ev('XF_EXTRA0');
  // one row: a fraction plain, one bold, float noise in a plain cell and in a whole-number cell, a fraction in a bold
  // per-export style with no format, a whole number in it, and a fraction in a per-export style that has a format
  X.ev(`globalThis.__w7x=function(){ var b=buildXlsx([{name:'W7', rows:[[0.085069, {v:1.2345, s:1}, {v:0.1+0.2, s:0}, {v:2422222.0000000005, s:3},
      {v:124.458, s:${XE}}, {v:7, s:${XE}}, {v:1/3, s:${XE + 1}}, {v:-0.5, s:2}]]}], [{fill:false, bold:true}, {fill:false, fmt:'0.000'}]);
    var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([b])); }; 'ok'`);
  const pk = w7Pkg(X.w, 'globalThis.__w7x');
  chk(name, 'package', 'control: it is a well-formed package, every count holding what it says', w7Ok(pk), 'ok · every part reads · every count holds');
  const cells = Object.fromEntries(((pk.sheets || {}).W7 || []).map(c => [c[0], c]));
  // C1, D1 and F1 are float noise and whole numbers, H1 a half: v1.94 stored those right too (controls)
  const STORED = { A1: '0.085069', B1: '1.2345', C1: '0.3', D1: '2422222', E1: '124.458', F1: '7', G1: '0.333333333333333', H1: '-0.5' };
  Object.keys(STORED).forEach(r => chk(name, 'stored · ' + r, (/^[CDFH]/.test(r) ? 'control: ' : '') + 'the figure as it is (15 significant digits, float noise dropped)', (cells[r] || [])[2], STORED[r]));
  const xf = r => (pk.xfs || [])[(cells[r] || [])[1]] || {};
  // the twins: the same font and fill as the style they stand in for, shown "0.00"
  const TWIN = { A1: ['0.00', '0', 'none'], B1: ['0.00', '1', 'none'], C1: ['0.00', '0', 'none'], E1: ['0.00', '1', 'none'], H1: ['0.00', '2', 'FF1B2A4A'] };
  Object.keys(TWIN).forEach(r => { const x = xf(r);
    chk(name, 'shown · ' + r, 'a fraction in a plain style: shown two decimals, in the same font and fill',
      [w7Fmt(pk, (cells[r] || [])[1]), x.font, (pk.fills || [])[+x.fill] || 'none'].join(' | '), TWIN[r].join(' | ')); });
  chk(name, 'shown · twins', 'control: one twin per style, reused', new Set(['A1', 'C1'].map(r => (cells[r] || [])[1])).size, 1);
  [['D1', 3], ['F1', XE], ['G1', XE + 1]].forEach(([r, s]) => chk(name, 'shown · ' + r, 'control: a whole figure, or a style with a format of its own, keeps its style', (cells[r] || [])[1], s));
  chk(name, 'shown · G1', 'control: whose format is its own', w7Fmt(pk, (cells.G1 || [])[1]), '0.000');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm); await settleBoards();
})();

// ══ W7.3 F2 — THE SPEND PLAN SOURCE: a line per increment, each with its own date and its own part of the lane ═════════
await (async () => {
  const name = 'W7 — F2: the Spend Plan Source dates an incremental award a line per increment';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  // A: $400 USAF ($250 discretionary, $150 mandatory) and $100 ANG, awarded in increments STORED OUT OF ORDER:
  //    March the 3rd (USAF $100) first, November the 9th (USAF $200, ANG $100) second. By date, discretionary fills
  //    November $200 then March $50; mandatory fills from the last, March's other $50, and its $100 the awards do not
  //    cover is undated. B: one award date (December the 4th), $60 mandatory -- one line, as always. C: no award.
  //    D: one increment on the 31st of November, which has 30 days -- the line is dated the 30th.
  const SVx = ['USAF', 'ANG'];
  const X = boot();
  seed(X.ev, { services: SVx, items: [it('A', 'AV', [400, 100]), it('B', 'AV', [60, 0]), it('C', 'AV', [20, 30]), it('D', 'AV', [40, 0])],
    disc: [250, 1000], mand: [500, 500], order: ['A', 'B', 'C', 'D'] });
  const BUD = { 'USAF|disc': 'USAF O&M- CAM Discretionary AV', 'USAF|mand': 'USAF O&M - CAM OBBBA Mandatory AV',
    'ANG|disc': 'USAF O&M - ANG CAM Discretionary AV', 'ANG|mand': 'USAF O&M - ANG CAM OBBBA Mandatory AV' };
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.awards={A:{mode:'inc', inc:[{d:FYMON[5][0], day:3, sv:[100,0]}, {d:FYMON[1][0], day:9, sv:[200,100]}]},
              B:{mode:'single', d:FYMON[2][0], day:4}, D:{mode:'inc', inc:[{d:FYMON[1][0], day:31, sv:[40,0]}]}};
    BUDDB={ts:1700000000060, files:[], rows:${JSON.stringify(Object.values(BUD))}.map(budParseName).filter(Boolean)}; _budRegCache=null;
    applyState(S); save(); 'ok'`);
  const M = JSON.parse(X.ev('JSON.stringify(FYMON.map(function(x){ return x[0]; }))')), FYn = +X.ev('MS.cur');
  const day = (k, d) => M[k] + '-' + String(d).padStart(2, '0'), AUG31 = FYn + '-08-31';
  chk(name, 'fixture', 'the lanes: A USAF 250 disc + 150 mand, ANG 100 disc; B 60 mand; C 20 mand, 30 disc; D 40 mand',
    X.ev(`(function(){ var T=tiers(); return ['A','B','C','D'].map(function(id){ return T[id].d.join('/')+'+'+T[id].m.join('/'); }).join(' '); })()`), '250/100+150/0 0/0+60/0 0/30+20/0 0/0+40/0');
  // EVERY LINE: requirement, service and lane (its BAE budget, verbatim), date, amount
  const WANT = [
    ['A', 'USAF', 'disc', day(1, 9), 200], ['A', 'USAF', 'disc', day(5, 3), 50],
    ['A', 'USAF', 'mand', day(5, 3), 50], ['A', 'USAF', 'mand', AUG31, 100], ['A', 'ANG', 'disc', day(1, 9), 100],
    ['B', 'USAF', 'mand', day(2, 4), 60], ['C', 'USAF', 'mand', AUG31, 20], ['C', 'ANG', 'disc', AUG31, 30], ['D', 'USAF', 'mand', day(1, 30), 40]];
  const bk = JSON.parse(await w6Book(X.w, 'exportSrc'));
  chk(name, 'workbook', 'the Spend Plan Source builds and reads back', bk.__err || 'ok', 'ok');
  const src = Object.values(bk).find(rs => (rs || []).length > 1) || [];
  const HDR = JSON.parse(X.ev('JSON.stringify(SRC_HDR)'));
  chk(name, 'layout', 'the same columns, in the same order', JSON.stringify((src[0] || []).map(c => String(c ?? ''))), JSON.stringify(HDR));
  const svcOf = b => Object.keys(BUD).find(k => BUD[k] === b);
  const got = src.slice(1).map(r => { const k = svcOf(String(r[4] ?? '')) || ('no budget ' + r[4]);
    return { id: String(r[7] ?? '').replace(/^Ev /, ''), key: k, mon: typeof r[1] === 'number' ? w7Ser(r[1]) : String(r[1]), dt: typeof r[8] === 'number' ? w7Ser(r[8]) : String(r[8]), amt: num(r[9]), row: r }; });
  const fmt = l => [l.id, l.key, l.dt, l.amt].join(' ');
  chk(name, 'lines', 'every line: requirement, service and lane, date and amount -- a line per increment, nothing else',
    JSON.stringify(got.map(fmt).sort()), JSON.stringify(WANT.map(([id, sv, ln, dt, a]) => [id, sv + '|' + ln, dt, a].join(' ')).sort()));
  got.forEach(l => chk(name, 'lines · ' + fmt(l), 'its Month is the 1st of its date’s month', l.mon, l.dt.slice(0, 8) + '01'));
  // THE LINES OF AN AWARD ADD UP TO ITS ONE LINE BEFORE: per requirement, service and lane, the lane's draw
  const T = JSON.parse(X.ev(`JSON.stringify(tiers())`));
  ['A', 'B', 'C', 'D'].forEach(id => SVx.forEach((sv, i) => ['disc', 'mand'].forEach(ln => {
    const draw = (ln === 'disc' ? T[id].d : T[id].m)[i] || 0; if (!draw) return;
    chk(name, 'adds up · ' + id + ' · ' + sv + ' ' + ln, 'its lines add up to what the lane paid', w7S(got.filter(l => l.id === id && l.key === sv + '|' + ln).map(l => l.amt)), draw); })));
  // EVERY OTHER COLUMN of an increment's line is its service-and-lane line's: one budget, one title, one event, one PMO
  const same = ['A|USAF|disc', 'A|USAF|mand'].map(k => got.filter(l => l.id + '|' + l.key === k).map(l => JSON.stringify(l.row.filter((c, j) => ![1, 8, 9].includes(j)))));
  chk(name, 'layout', 'an increment’s lines differ only in Month, Date and Amount', same.map(s => s.length + ':' + new Set(s).size).join(' '), '2:1 2:1');
  // AGREEMENT with the board's own placement, service by service and lane by lane: the forecast's months (an
  // undated line is its UNSCHEDULED) and the CR half-month windows
  SVx.forEach((sv, i) => {
    const F = JSON.parse(X.ev(`JSON.stringify(forecast(null, {svc:${i}}).bySvc[${i}])`));
    const mine = l => l.key.startsWith(sv + '|');
    const byMon = M.map(k => w7S(got.filter(l => mine(l) && l.dt !== AUG31 && l.dt.slice(0, 7) === k).map(l => l.amt)));
    chk(name, 'forecast · ' + sv, 'each month, and UNSCHEDULED, is the lines dated in it', JSON.stringify(byMon.concat([w7S(got.filter(l => mine(l) && l.dt === AUG31).map(l => l.amt))])),
      JSON.stringify(F.m.concat([F.unsch])));
    const C = JSON.parse(X.ev(`JSON.stringify(crData()[${i}].items.map(function(r){ return [r.id, r.wins]; }))`));
    ['A', 'B', 'D'].forEach(id => {
      const w = Array(12).fill(0);
      got.filter(l => mine(l) && l.id === id && l.dt !== AUG31).forEach(l => { const k = M.indexOf(l.dt.slice(0, 7)); if (k >= 0 && k < 6) w[k * 2 + (+l.dt.slice(8) > 15 ? 1 : 0)] += l.amt; });
      chk(name, 'CR windows · ' + sv + ' · ' + id, 'each half-month window is the lines dated in it', JSON.stringify(w), JSON.stringify(((C.find(c => c[0] === id) || [])[1]) || Array(12).fill(0)));
    });
  });
  // (v2.05, item 114: the deck's spend plan by pot was held to the lines here, and went with the deck.)
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm); await settleBoards();
})();

// ══ W7.4 F3 (v2.05, item 114: the Executive Synopsis's title and file name were held here, and went with it.) ═══════

// ══ v2.02 (E7, ledger U9 and U43) — A TIE BETWEEN CLIN OFFICES GOES TO THE EARLIER CLIN; AN OFFICE ONLY A CLIN NAMES IS A ROW ══
// PRIME-3 (homed to MxS) draws USAF $D discretionary over CLINs 0010 (MxS) asking 1, 0002 (AV) asking 2 and a third asking 3.
// Worked out by hand, by exact largest remainder with ties to the earlier CLIN:
//   D = 3: shares 0.5, 1, 1.5 -> floors 0, 1, 1; the leftover dollar to the 0.5/0.5 tie's earlier CLIN -> $1 / $1 / $1.
//   D = 9: shares 1.5, 3, 4.5 -> floors 1, 3, 4; the leftover to the earlier of the tie -> $2 / $3 / $4.
// Run A: the third CLIN is 0008 (TSS). Run B: it is 0001 (PRIMES), an office no requirement is homed to (U43); a requirement B on
// AV ($1, no money: its lane is dry) keeps AV on the office list. U9 FAILS ON c357911: $0/$1/$2 and $1/$3/$5, the split made by
// the floating-point fraction (1/6 just under a sixth). U43 FAILS ON c357911: the PMO funding panel has no PRIMES row and its
// TOTAL Disc reads $1 for the $3 drawn ($4 for $9), and the CR view by PMO has no PRIMES key.
await (async () => {
  const name = 'v2.02 (E7) — U9/U43: a tie between CLIN offices goes to the earlier CLIN, and an office only a CLIN names is a row';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const run = (D, third) => {
    const X = boot();
    seed(X.ev, { services: ['USAF'], items: [it('PRIME-3', 'MxS', [D]), it('B', 'AV', [1])], disc: [D], mand: [0], order: ['PRIME-3', 'B'] });
    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      DATA.clins={'PRIME-3':[{clin:'0010', ask:[1]}, {clin:'0002', ask:[2]}, {clin:'${third}', ask:[3]}]};
      S.awards={'PRIME-3':{mode:'single', d:FYMON[0][0], day:5}}; applyState(S); save(); pmoSumOpen=true; pmoMatrix(); 'ok'`);
    return JSON.parse(X.ev(`(function(){ var T=tiers(), it=itemById('PRIME-3');
      var parts={}; pmoPartsOf(it, T['PRIME-3']).forEach(function(o){ parts[o.g]=o.d[0]; });
      var fc={}, F=forecast().byPMO; Object.keys(F).forEach(function(k){ fc[k]=Math.round(F[k].tot); });
      var rows=[].map.call(document.querySelectorAll('#pmBody tr'), function(tr){ return [].map.call(tr.children, function(td){ return td.textContent.trim(); }); });
      var cr=crBuckets(null, 'pmo');
      return JSON.stringify({draw:T['PRIME-3'].d[0], parts:parts, fc:fc, rows:rows, cr:cr.keys}); })()`));
  };
  const panel = (R, lbl) => { const r = R.rows.find(c => c[0] && c[0].split(/\s/)[0] === lbl); return r ? r[1] : '(no row)'; };
  for (const [D, want] of [[3, [1, 1, 1]], [9, [2, 3, 4]]]) {
    const A = run(D, '0008');
    const sc = 'run A, $' + D + ' over asks 1:2:3 (MxS, AV, TSS)';
    chk(name, sc, 'CONTROL — PRIME-3 draws the whole $' + D, A.draw, D);
    chk(name, sc, 'each office’s part (pmoPartsOf): MxS, AV, TSS', JSON.stringify(['MxS', 'AV', 'TSS'].map(g => A.parts[g])), JSON.stringify(want));
    chk(name, sc, 'the forecast by office, the same dollars', JSON.stringify(['MxS', 'AV', 'TSS'].map(g => A.fc[g])), JSON.stringify(want));
    chk(name, sc, 'the PMO funding panel’s USAF Disc, the same dollars', JSON.stringify(['MxS', 'AV', 'TSS'].map(g => panel(A, g))), JSON.stringify(want.map(v => '$' + v)));
  }
  for (const [D, want] of [[3, [1, 1, 1]], [9, [2, 3, 4]]]) {
    const B = run(D, '0001');
    const sc = 'run B, $' + D + ', the third CLIN PRIMES’s (no requirement homed there)';
    chk(name, sc, 'the PMO funding panel has a PRIMES row, and every office’s USAF Disc: MxS, AV, PRIMES', JSON.stringify(['MxS', 'AV', 'PRIMES'].map(g => panel(B, g))), JSON.stringify(want.map(v => '$' + v)));
    chk(name, sc, 'the panel’s TOTAL USAF Disc is the $' + D + ' drawn', panel(B, 'TOTAL'), '$' + D);
    chk(name, sc, 'the CR view by PMO lists PRIMES', B.cr.includes('PRIMES'), true);
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm); await settleBoards();
})();

// ══ v2.02 (E6, the cross-track export review) — AN OFFICE'S NAME IS MADE A SHEET NAME, NOT COPIED INTO ONE ══════════════════
// The workbook's PMO tabs ('PMO '+office, cut at 31) and the Priority Drill's office tabs (the office, cut at 31) took the name as
// it was. Two offices whose names begin alike for 31 characters made two sheets of one name, and ORBIT's own reader then kept
// one -- an office's obligation report gone; "R&D/Test [Ops]" wrote characters a sheet name may not hold; an office named
// "Matrix" made a second "PMO Matrix". Now both go through sheetNamer, the funds flow's namer shared: characters a sheet name
// may not hold become spaces, a repeat is numbered. Expected names worked out by hand:
//   "PMO Sustainment Logistics Office East" -> 'PMO Sustainment Logistics Offic' (31); "… West" -> 'PMO Sustainment Logistics Off 2'
//   "R&D/Test [Ops]" -> 'PMO R&D Test  Ops'; "Matrix" -> 'PMO Matrix 2' (the PMO Matrix sheet holds 'PMO Matrix').
//   The drill's own tabs carry no prefix, so the two offices already differ within 31 ('…Office Ea', '…Office We'); 'R&D Test  Ops'.
// FAILS ON c357911: the names are copied, two sheets share one, and the reader returns fewer sheets than were written.
await (async () => {
  const name = 'v2.02 (E6) — an office’s name is made a sheet name: no repeat, no character a sheet name may not hold';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const OFF = ['Sustainment Logistics Office East', 'Sustainment Logistics Office West', 'R&D/Test [Ops]', 'Matrix'];
  const X = boot();
  seed(X.ev, { services: ['USAF', 'ANG'], items: OFF.map((g, k) => it('R' + k, g, [100 * (k + 1), 0])), disc: [5000, 0], mand: [0, 0], order: ['R0', 'R1', 'R2', 'R3'] });
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`);
  const names = fn => JSON.parse(X.ev(`(function(){ var got=null, _bx=buildXlsx; buildXlsx=function(sh, x){ got=sh.map(function(s){ return s.name; }); return _bx(sh, x); };
    try{ ${fn}(); }catch(e){ got=['threw: '+((e&&e.message)||e)]; } buildXlsx=_bx; return JSON.stringify(got||[]); })()`));
  const xl = names('exportExcel'), dr = names('exportCSV');
  const uniq = L => new Set(L.map(n => String(n).toLowerCase())).size === L.length;
  const clean = L => L.every(n => !/[\\\/?*\[\]:\u0000-\u001F]/.test(n) && n.length <= 31 && !/^'|'$/.test(n));
  chk(name, 'exportExcel', 'the four offices’ tabs, named as worked out', JSON.stringify(xl.filter(n => /^PMO /.test(n) && n !== 'PMO Matrix')),
    JSON.stringify(['PMO Sustainment Logistics Offic', 'PMO Sustainment Logistics Off 2', 'PMO R&D Test  Ops', 'PMO Matrix 2']));
  chk(name, 'exportExcel', 'every sheet name differs from every other, ignoring case, and holds nothing a sheet name may not', JSON.stringify([uniq(xl), clean(xl)]), JSON.stringify([true, true]));
  chk(name, 'exportCSV', 'the Priority Drill’s office tabs, named as worked out', JSON.stringify(dr.filter(n => /Sustain|R&D|Matrix/.test(n))),
    JSON.stringify(['Sustainment Logistics Office Ea', 'Sustainment Logistics Office We', 'R&D Test  Ops', 'Matrix']));
  chk(name, 'exportCSV', 'every sheet name differs from every other, ignoring case, and holds nothing a sheet name may not', JSON.stringify([uniq(dr), clean(dr)]), JSON.stringify([true, true]));
  const bk = JSON.parse(await workbook(X.w));
  chk(name, 'exportExcel', 'reading the workbook back finds every sheet written: none lost to a repeated name', Object.keys(bk).filter(k => k !== '__err').length, xl.length);
  chk(name, 'exportExcel', 'each office’s tab carries its own office’s report', JSON.stringify(['PMO Sustainment Logistics Offic', 'PMO Sustainment Logistics Off 2'].map(t => (bk[t] || []).some(r => (r || []).some(c => /Req R0/.test(String(c)))) + '/' + (bk[t] || []).some(r => (r || []).some(c => /Req R1/.test(String(c)))))),
    JSON.stringify(['true/false', 'false/true']));
  chk(name, 'sheetNamer', 'a carriage return or other control character in a name becomes a space (a funds-flow category name, the review’s note)',
    X.ev(`sheetNamer([], 28)('Line1\\rLine2\\u0007', 'x')`), 'Line1 Line2');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm); await settleBoards();
})();

// ══ v2.02 (E5, ledger U9L) — AN OFFICE'S PLANNING SHARE AND THE SPEND PLAN SOURCE'S CLIN AMOUNTS, NAMED APART AND RECONCILED ══
// Brad, 13 Oct 2026: label both, reconcile them, move no dollar; 20 Oct: the reconciliation is a workbook sheet. PRIME-3 (home
// office PRIMES) has CLINs 0010 (MxS) asking USAF 1 and 0002 (AV) asking USAF 3 and ANG 2. It draws USAF $2 discretionary, paid
// by two $1 increments, and ANG $4 mandatory, with no award of its own. Worked out by hand:
//   PLANNING SHARE  USAF $2 by asks 1:3 = 0.5 and 1.5 -> $0 and $1, the leftover dollar to the tie's lower office: MxS $1, AV $1.
//                   ANG $4 by asks 0:2 -> AV $4.
//   CLIN AMOUNTS    each $1 increment by 1:3 = 0.25 and 0.75 -> the dollar to AV, twice: MxS $0, AV $2. ANG $4 -> AV $4.
//   DIFFERENCE      Disc: MxS +$1, AV -$1, requirement 0. Mand: 0.
// A (ATL, $5 USAF discretionary, no CLINs) is wholly its own office's on both readings: counted, not listed.
// FAILS ON c357911: the workbook has no "Office share vs CLIN" sheet, and its by-office sheets carry no planning-share label.
await (async () => {
  const name = 'v2.02 (E5) — an office’s planning share and the Spend Plan Source’s CLIN amounts, named apart and reconciled';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const X = boot();
  seed(X.ev, { services: ['USAF', 'ANG'], items: [it('PRIME-3', 'PRIMES', [2, 4]), it('A', 'ATL', [5, 0])],
    disc: [10, 0], mand: [0, 4], order: ['PRIME-3', 'A'] });
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    CLINS['PRIME-3']=[{clin:'0010', ask:[1,0]}, {clin:'0002', ask:[3,2]}]; DATA.clins=CLINS; S.ptype={'PRIME-3':'PRIME'};
    S.awards={'PRIME-3':{mode:'inc', inc:[{d:FYMON[2][0], day:5, sv:[1,0]}, {d:FYMON[4][0], day:5, sv:[1,0]}]}};
    applyState(S); save(); 'ok'`);
  chk(name, 'fixture', 'CONTROL — PRIME-3 is a prime drawing USAF $2 disc and ANG $4 mand; A draws USAF $5 disc',
    X.ev(`(function(){ var T=tiers(); return clinApplies('PRIME-3')+' '+T['PRIME-3'].d.join('/')+'+'+T['PRIME-3'].m.join('/')+' '+T.A.d.join('/')+'+'+T.A.m.join('/'); })()`), 'true 2/0+0/4 5/0+0/0');
  const R = JSON.parse(X.ev(`JSON.stringify(officeClinRecon())`));
  chk(name, 'officeClinRecon', 'one requirement listed, by office: [office, planning disc, CLIN disc, planning mand, CLIN mand]',
    JSON.stringify(R.reqs.map(q => [q.id, q.offices.map(o => [o.g, o.pd, o.cd, o.pm, o.cm])])), JSON.stringify([['PRIME-3', [['MxS', 1, 0, 0, 0], ['AV', 1, 2, 4, 4]]]]));
  chk(name, 'officeClinRecon', 'every other requirement counted, not listed: [n, disc, mand]', JSON.stringify([R.other.n, R.other.d, R.other.m]), JSON.stringify([1, 5, 0]));
  const bk = JSON.parse(await workbook(X.w));
  chk(name, 'workbook', 'the workbook builds and reads back', bk.__err || 'ok', 'ok');
  const oc = bk['Office share vs CLIN'] || [];
  chk(name, 'Office share vs CLIN', 'the sheet is in the workbook', oc.length > 0, true);
  const hi = oc.findIndex(r => (r || [])[0] === 'Requirement');
  const H = oc[hi] || [], col = h => H.indexOf(h);
  const HD = ['Requirement', 'CCaR', 'Office', 'Disc — planning share', 'Disc — CLIN amounts', 'Disc — difference', 'Mand — planning share', 'Mand — CLIN amounts', 'Mand — difference'];
  chk(name, 'Office share vs CLIN', 'its headings', JSON.stringify(H.slice(0, 9)), JSON.stringify(HD));
  const body = oc.slice(hi + 1).filter(r => r && r.length > 3);
  const pick = r => [r[col('Office')] || r[col('Requirement')], ...HD.slice(3).map(h => num(r[col(h)]))];
  chk(name, 'Office share vs CLIN', 'MxS, AV, the requirement total and TOTAL, each lane: planning, CLIN amounts, difference',
    JSON.stringify(body.map(pick)), JSON.stringify([['MxS', 1, 0, 1, 0, 0, 0], ['AV', 1, 2, -1, 4, 4, 0], ['Requirement total', 2, 2, 0, 4, 4, 0], ['TOTAL', 2, 2, 0, 4, 4, 0]]));
  const notes = oc.slice(hi + 1).filter(r => r && r.length === 1).map(r => String(r[0]));
  chk(name, 'Office share vs CLIN', 'it says what each figure is, that the Spend Plan Source lists every line under the requirement’s own office (the E6 review), that no dollar is moved, and counts A', JSON.stringify([
    notes.some(t => /^PLANNING SHARE is the office figure/.test(t) && /CLIN AMOUNTS are what the Spend Plan Source sends/.test(t) && /No dollar is moved/.test(t)
      && /the Spend Plan Source itself lists every line under the requirement’s own office, in its PMO column/.test(t)),
    notes.some(t => t === '1 other requirement is wholly its own office’s on both readings and is not listed: Disc $5, Mand $0.')]), JSON.stringify([true, true]));
  const has = (sheet, re) => (bk[sheet] || []).some(r => (r || []).some(c => re.test(String(c))));
  chk(name, 'the labels', 'the PMO Matrix and each office’s tab say their office figures are planning shares',
    JSON.stringify(['PMO Matrix', 'PMO MxS', 'PMO AV'].map(sh => [sh, has(sh, /PLANNING SHARE/)])), JSON.stringify([['PMO Matrix', true], ['PMO MxS', true], ['PMO AV', true]]));
  chk(name, 'the labels', 'CONTROL — the Spend Plan Source is unchanged: its PRIME-3 lines still send USAF $2 and ANG $4',
    X.ev(`(function(){ var rec=[]; srcRowsOf(MS.cur, S, tiers(), rec); var t={}; rec.forEach(function(r){ if(r.id==='PRIME-3') t[r.svc]=(t[r.svc]||0)+r.amt; }); return JSON.stringify(t); })()`), JSON.stringify({ USAF: 2, ANG: 4 }));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm); await settleBoards();
})();

// ══ W7.5 F4 — AN OFFICE'S SHARE OF A CLIN-SPLIT REQUIREMENT IS WHOLE DOLLARS, and the same on every surface ═══════════
await (async () => {
  const name = 'W7 — F4: an office’s share of a CLIN-split requirement is whole dollars, the same on every surface';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  // PRIME-3's CLINs put STOVL 1 : 2 between MxS (…10) and AV (…2), CV all with AV; no CLIN covers CTOL, which stays with
  // its own office, PRIMES. On STOVL it draws $70 discretionary and $20 mandatory of a $100 ask ($10 unfunded); its
  // awards, stored out of order, are December the 3rd (STOVL $50, CTOL $20) and February the 20th (STOVL $40, CV $10),
  // so STOVL places discretionary December $50, February $20, and mandatory February $20. A (ATL) is not split.
  const SVx = ['STOVL', 'CV', 'CTOL'];
  const X = boot();
  seed(X.ev, { services: SVx, items: [it('PRIME-3', 'PRIMES', [100, 10, 20]), it('A', 'ATL', [20, 10, 5])],
    disc: [70, 1000, 1000], mand: [20, 0, 0], order: ['PRIME-3', 'A'], mc: { 'PRIME-3': true } });
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    DATA.clins={'PRIME-3':[{clin:'0010', ask:[1,0,0]}, {clin:'0002', ask:[2,10,0]}]};
    S.awards={'PRIME-3':{mode:'inc', inc:[{d:FYMON[4][0], day:20, sv:[40,10,0]}, {d:FYMON[2][0], day:3, sv:[50,0,20]}]}, A:{mode:'single', d:FYMON[3][0], day:5}};
    applyState(S); save(); 'ok'`);
  chk(name, 'fixture', 'PRIME-3 draws STOVL 70 + 20 of 100; A has nothing on STOVL',
    X.ev(`(function(){ var T=tiers(); return T['PRIME-3'].d.join('/')+'+'+T['PRIME-3'].m.join('/')+' '+T.A.d.join('/')+'+'+T.A.m.join('/'); })()`), '70/10/20+20/0/0 0/10/5+0/0/0');
  // EACH OFFICE'S DOLLARS, worked out here by the stated rule: per service the ask is split by the CLIN weights, then
  // discretionary, mandatory and unfunded each by what each office still has to take; the months the same way, award
  // by award (in date order) against the office's discretionary, then its mandatory.
  const OFF = ['MxS', 'AV', 'PRIMES'], W = [[1, 2, 0], [0, 1, 0], [0, 0, 1]];         // per service: MxS, AV, PRIMES
  const ASK = [100, 10, 20], D = [70, 10, 20], Mn = [20, 0, 0];
  const O = Object.fromEntries(OFF.map(g => [g, { ask: [], d: [], m: [], u: [], mon: Array(12).fill(0) }]));
  const CELLS = [{ dc: [50, 20, 0], mc: [0, 20, 0] }, { dc: [0, 10, 0], mc: [0, 0, 0] }, { dc: [20, 0, 0], mc: [0, 0, 0] }];  // [Dec, Feb, undated]
  SVx.forEach((sv, i) => {
    const X3 = w7Split(W[i], [D[i], Mn[i], ASK[i] - D[i] - Mn[i]]);
    OFF.forEach((g, k) => { O[g].d[i] = X3[0][k]; O[g].m[i] = X3[1][k]; O[g].u[i] = X3[2][k]; O[g].ask[i] = X3[0][k] + X3[1][k] + X3[2][k]; });
    const dd = w7Split(W[i], CELLS[i].dc, OFF.map(g => O[g].d[i])), mm = w7Split(W[i], CELLS[i].mc, OFF.map(g => O[g].m[i]));
    OFF.forEach((g, k) => { O[g].mon[2] += dd[0][k] + mm[0][k]; O[g].mon[4] += dd[1][k] + mm[1][k]; });
  });
  chk(name, 'rule', 'the $100 STOVL ask is $33 and $67, never $33.33 and $66.67', O.MxS.ask[0] + ' ' + O.AV.ask[0], '33 67');
  chk(name, 'rule', 'each office: discretionary, mandatory, unfunded on STOVL', OFF.map(g => g + ' ' + [O[g].d[0], O[g].m[0], O[g].u[0]].join('/')).join(', '), 'MxS 23/7/3, AV 47/13/7, PRIMES 0/0/0');
  chk(name, 'rule', 'and the months, December and February', OFF.map(g => g + ' ' + O[g].mon[2] + '/' + O[g].mon[4]).join(', '), 'MxS 16/14, AV 34/36, PRIMES 20/0');
  const A = { ask: [20, 10, 5], d: [0, 10, 5], m: [0, 0, 0], u: [20, 0, 0], mon: Array(12).fill(0) }; A.mon[3] = 15;
  const ALL = Object.assign({}, O, { ATL: A }), KEYS = ['MxS', 'AV', 'PRIMES', 'ATL'];
  // ---- the PMO Matrix: every office, service and lane, and the MC memo
  const bk = JSON.parse(await workbook(X.w));
  chk(name, 'workbook', 'the workbook builds and reads back', bk.__err || 'ok', 'ok');
  const cell = (rows, h, row, col) => { const c = w6Col(rows, h, col); return c < 0 ? 'no column ' + col : num((row || [])[c]); };
  { const pm = bk['PMO Matrix'] || [], h = w6Hdrs(pm, 'PMO', 'TOTAL Disc')[0];
    KEYS.forEach(g => { const row = pm.find((r, j) => j > h && w6Lbl(r) === g), v = ALL[g];
      chk(name, 'PMO Matrix · ' + g, 'the office is a row', !!row, true);
      const want = { 'TOTAL Disc': w7S(v.d), 'TOTAL Mand': w7S(v.m), '★ MC requirement (memo)': g === 'ATL' ? 0 : w7S(v.ask), '★ MC short vs Disc': g === 'ATL' ? 0 : w7S(v.m) + w7S(v.u) };
      SVx.forEach((sv, i) => { want[sv + ' Disc'] = v.d[i]; want[sv + ' Mand'] = v.m[i]; });
      Object.keys(want).forEach(k => chk(name, 'PMO Matrix · ' + g, k, cell(pm, h, row, k), want[k])); }); }
  // ---- every PMO tab: the portions, service by service, and the obligation report with its months
  KEYS.forEach(g => {
    const rows = bk['PMO ' + g] || [], v = ALL[g], who = g === 'ATL' ? 'Req A' : 'Req PRIME-3';
    chk(name, 'PMO ' + g, 'the tab is in the workbook', rows.length > 0, true);
    [['Disc portion', 'd'], ['Mand portion', 'm'], ['MC requirement (memo — not additive)', 'ask'], ['Total Unfunded (delta + beyond lanes)', 'u']].forEach(([amt, k]) => {
      const want = g === 'ATL' && k === 'ask' ? null : v[k];
      const h = w6Hdrs(rows, 'Rank', amt)[0];
      if (!want || !w7S(want)) { chk(name, 'PMO ' + g + ' · ' + amt, 'no section when the office holds none of it', h === undefined || !rows.slice(h + 1).some(r => (r || []).includes(who)), true); return; }
      const row = h === undefined ? null : rows.slice(h + 1).find(r => (r || []).includes(who));
      chk(name, 'PMO ' + g + ' · ' + amt, 'the requirement is listed', !!row, true); if (!row) return;
      chk(name, 'PMO ' + g + ' · ' + amt, 'the amount', cell(rows, h, row, amt), w7S(want));
      SVx.forEach((sv, i) => chk(name, 'PMO ' + g + ' · ' + amt, sv, cell(rows, h, row, sv), want[i])); });
    const h = w6Hdrs(rows, 'Rank', 'Total (Disc+Mand)')[0], row = h === undefined ? null : rows.slice(h + 1).find(r => (r || []).includes(who));
    chk(name, 'PMO ' + g + ' · report', 'the requirement is a row', !!row, true); if (!row) return;
    const FY = X.ev('FYL()'), m0 = w6Col(rows, h, 'OCT 26');
    const want = { [FY + ' Ask']: w7S(v.ask), 'Disc allocated': w7S(v.d), 'Total (Disc+Mand)': w7S(v.d) + w7S(v.m), 'UFR (Unfunded Requirement)': w7S(v.u), Unscheduled: 0 };
    SVx.forEach((sv, i) => { want[sv + ' Disc'] = v.d[i]; want[sv + ' Mand'] = v.m[i]; });
    Object.keys(want).forEach(k => chk(name, 'PMO ' + g + ' · report', k, cell(rows, h, row, k), want[k]));
    for (let k = 0; k < 12; k++) chk(name, 'PMO ' + g + ' · report', 'month ' + rows[h][m0 + k], num(row[m0 + k]), v.mon[k]);
  });
  // ---- the forecast by PMO, on the board and in the export of the view (the whole portfolio, then MxS alone)
  const F = JSON.parse(X.ev(`JSON.stringify(forecast().byPMO)`));
  KEYS.forEach(g => chk(name, 'forecast · ' + g, 'its months, UNSCHEDULED and TOTAL', JSON.stringify(F[g] ? F[g].m.concat([F[g].unsch, F[g].tot]) : null),
    JSON.stringify(ALL[g].mon.concat([0, w7S(ALL[g].mon)]))));
  const fcv = async (v, lbl, want) => {
    X.ev(`fcView=${JSON.stringify(v)}; 'ok'`);
    const fb = JSON.parse(await w6Book(X.w, 'exportFcView'));
    X.ev(`fcView=''; 'ok'`);
    const rows = Object.values(fb)[0] || [];
    chk(name, 'exported view ' + (v || 'whole'), 'it builds and reads back', fb.__err || (rows.length ? 'ok' : 'empty'), 'ok');
    const hs = w6Hdrs(rows, 'UNSCHEDULED', 'TOTAL'), h = hs[hs.length - 1];
    Object.keys(want).forEach(k => { const row = rows.find((r, j) => j > h && w6Lbl(r) === k);
      chk(name, 'exported view ' + (v || 'whole') + ' · ' + lbl + ' ' + k, 'its months, UNSCHEDULED and TOTAL', JSON.stringify(row ? row.slice(1, 15).map(num) : null), JSON.stringify(want[k].concat([0, w7S(want[k])]))); });
  };
  await fcv('', 'by PMO', Object.fromEntries(KEYS.map(g => [g, ALL[g].mon])));
  const mx = { STOVL: O.MxS.mon };                     // MxS holds STOVL only
  await fcv('p:MxS', 'by service', mx);
  // ---- the CR windows by PMO: every window of every office
  const CRP = JSON.parse(X.ev(`JSON.stringify((function(){ var R=crBuckets(null,'pmo'), o={}; R.keys.forEach(function(k,i){ o[k]=R.data[i].win; }); return o; })())`));
  const WIN = { 2: 4, 3: 6, 4: 9 };                    // Dec the 3rd, Jan the 5th, Feb the 20th
  KEYS.forEach(g => { const w = Array(12).fill(0); Object.keys(WIN).forEach(k => { w[WIN[k]] += ALL[g].mon[k]; });
    chk(name, 'CR by PMO · ' + g, 'each half-month window', JSON.stringify(CRP[g] || null), JSON.stringify(w)); });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm); await settleBoards();
})();

// ══ W7.6 F5 — THE CR CASH NEEDS FOOTNOTE states the rule since v1.94 ═════════════════════════════════════════════════
await (async () => {
  const name = 'W7 — F5: the CR Cash Needs footnote states the rule since v1.94';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const X = boot();
  seed(X.ev, { services: ['STOVL', 'USMC-C'], items: [it('A', 'AV', [100, 50])], disc: [1000, 1000], mand: [0, 0], order: ['A'] });
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.awards={A:{mode:'single', d:FYMON[1][0], day:20}}; applyState(S); save(); 'ok'`);
  const bk = JSON.parse(await workbook(X.w)), cr = bk['CR Cash Needs'] || [];
  chk(name, 'workbook', 'the CR Cash Needs sheet builds and reads back', bk.__err || (cr.length ? 'ok' : 'no sheet'), 'ok');
  const text = cr.map(r => (r || []).map(c => String(c ?? '')).join(' ')).join('\n');
  const foot = cr.map(r => w6Lbl(r)).filter(t => /"No date"/.test(t))[0] || '';
  chk(name, 'footnote', 'it says each award sits in the half of the month its own date falls in', /each award.s dollars sit in the half of the month its own date falls in/i.test(foot), true);
  chk(name, 'footnote', 'and nothing on the sheet says to flip a half by hand', /flip|16–EOM|16-EOM/i.test(text), false);
  // control: the award on the 20th is in the second half of November, as the footnote says
  const h = w6Hdrs(cr, 'Service / Requirement', 'No date')[0], row = cr.find((r, j) => j > h && /^#1 /.test(w6Lbl(r))) || [];
  chk(name, 'footnote', 'control: the award on the 20th sits in November 16–30', JSON.stringify(row.slice(1, 13).map(v => num(v) || 0)), JSON.stringify([0, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0, 0]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm); await settleBoards();
})();
// ITEM 60, F6 (found in integration, from W7's notes): A PRIME'S CLIN LINES IN WHOLE DOLLARS. clinSplit prorated
// each service's amount by each CLIN's share of the grid -- amount × share, the last CLIN taking the rest -- so $100
// across CLINs asking 1 and 2 went out as $33.333… and $66.666… on the Spend Plan Source (v1.94's writer showed
// $33.33 and $66.67). The RCN/EEIC monthly tab splits each month through the same function. A whole-dollar amount
// is now split by largest remainder: whole dollars adding to it exactly. Read back from the file's own bytes.
await (async () => {
  const name = 'W7 — F6: a prime’s CLIN lines are whole dollars that add up';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const X = boot();
  seed(X.ev, { services: ['USAF', 'ANG'], items: [it('PRIME-3', 'AV', [100, 101])], disc: [1000, 1000], mand: [0, 0], order: ['PRIME-3'] });
  const BUD = { 'USAF|disc': 'USAF O&M- CAM Discretionary AV', 'USAF|mand': 'USAF O&M - CAM OBBBA Mandatory AV',
    'ANG|disc': 'USAF O&M - ANG CAM Discretionary AV', 'ANG|mand': 'USAF O&M - ANG CAM OBBBA Mandatory AV' };
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    CLINS['PRIME-3']=[{clin:'0010', ask:[1,1]}, {clin:'0002', ask:[2,1]}, {clin:'0003', ask:[0,1]}]; S.ptype={'PRIME-3':'PRIME'};
    BUDDB={ts:1700000000061, files:[], rows:${JSON.stringify(Object.values(BUD))}.map(budParseName).filter(Boolean)}; _budRegCache=null;
    applyState(S); save(); 'ok'`);
  chk(name, 'fixture', 'CONTROL — PRIME-3 is a prime, all discretionary: USAF 100, ANG 101',
    X.ev(`(function(){ var T=tiers(); return clinApplies('PRIME-3')+' '+T['PRIME-3'].d.join('/')+'+'+T['PRIME-3'].m.join('/'); })()`), 'true 100/101+0/0');
  const bk = JSON.parse(await w6Book(X.w, 'exportSrc'));
  chk(name, 'workbook', 'the Spend Plan Source builds and reads back', bk.__err || 'ok', 'ok');
  const src = Object.values(bk).find(rs => (rs || []).length > 1) || [];
  const svcOf = b => (Object.keys(BUD).find(k => BUD[k] === b) || ('no budget ' + b)).split('|')[0];
  const got = src.slice(1).map(r => [svcOf(String(r[4] ?? '')), String(r[25] ?? ''), num(r[9])]);
  // BY HAND: USAF 100 across 1:2:0 -> 33.33, 66.67 -> 33 and 67; ANG 101 across 1:1:1 -> 33.67 each -> 34, 34, 33
  chk(name, 'lines', 'each CLIN’s line, in whole dollars', JSON.stringify(got.map(g => g.join(' ')).sort()),
    JSON.stringify(['ANG 0002 34', 'ANG 0003 33', 'ANG 0010 34', 'USAF 0002 67', 'USAF 0010 33'].sort()));
  chk(name, 'adds up', 'per service, the CLIN lines add up to what the lane paid', JSON.stringify(['USAF', 'ANG'].map(sv => w7S(got.filter(g => g[0] === sv).map(g => g[2])))), JSON.stringify([100, 101]));
  // A modelled shape is not whole dollars and keeps its share (unchanged)
  chk(name, 'control', 'CONTROL — an amount that is not whole dollars is still split by share, adding to it',
    X.ev(`JSON.stringify(clinSplit('PRIME-3', 0, 100.5).map(function(p){ return Math.round(p.part*1e6)/1e6; }))`), JSON.stringify([33.5, 67, 0]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// v1.95 (integration), F2's neighbour: A SINGLE AWARD ON A DAY PAST ITS MONTH'S END KEEPS ITS MONTH on the Spend Plan
// Source. W7 dates an increment on the 31st of November the 30th; a single award date went through srcSerial as
// stored, and Date.UTC rolled the 31st of November into the 1st of December -- a month the forecast, the CR views and
// the 1A9A do not put it in. A day of 31 passes every door (days 1 to 31), so a file can hold one.
await (async () => {
  const name = 'W7 — F2: a single award on a day past its month’s end keeps its month';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const X = boot();
  seed(X.ev, { services: ['USAF', 'ANG'], items: [it('B', 'AV', [60, 0])], disc: [1000, 1000], mand: [0, 0], order: ['B'] });
  const BUD = { 'USAF|disc': 'USAF O&M- CAM Discretionary AV', 'ANG|disc': 'USAF O&M - ANG CAM Discretionary AV' };
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.awards={B:{mode:'single', d:FYMON[1][0], day:31}};
    BUDDB={ts:1700000000062, files:[], rows:${JSON.stringify(Object.values(BUD))}.map(budParseName).filter(Boolean)}; _budRegCache=null;
    applyState(S); save(); 'ok'`);
  const M = JSON.parse(X.ev('JSON.stringify(FYMON.map(function(x){ return x[0]; }))'));
  chk(name, 'fixture', 'CONTROL — B’s award is the 31st of November, which has 30 days', X.ev(`S.awards.B.d+'-'+S.awards.B.day`), M[1] + '-31');
  const bk = JSON.parse(await w6Book(X.w, 'exportSrc'));
  const src = Object.values(bk).find(rs => (rs || []).length > 1) || [];
  const got = src.slice(1).map(r => [typeof r[1] === 'number' ? w7Ser(r[1]) : String(r[1]), typeof r[8] === 'number' ? w7Ser(r[8]) : String(r[8]), num(r[9])]);
  chk(name, 'line', 'one line, dated the 30th of November, its Month November', JSON.stringify(got), JSON.stringify([[M[1] + '-01', M[1] + '-30', 60]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end W7 ====
// ==== v1.97 W1: money entry and the engine (items 72, 73, 74, 75) ====
// ==== end v1.97 W1 ====
// ==== v1.97 W2: every edit the saved file carries marks the board unsaved (item 76) ====
// ==== end v1.97 W2 ====
// ==== v1.97 W3: batch import, Put this back, folder save history (items 77, 78, 79) ====
// ==== end v1.97 W3 ====
// ==== v1.97 W4: a board’s own service list moves dollars with it (item 80) ====
// ==== end v1.97 W4 ====
// ==== v1.97 W5: the reprogramming log by service and in whole dollars, and its money-map cells (items 81, 62) ====
// v2.02: the five reprogramming scenarios and their fixture went with the ATR/BTR tracker (exportReprog, rpSetField and the
// panel no longer exist). w5Chk stays: every later block records its checks through it.
// SUITE_CHECKS=<file> records every check of these blocks with its verdict (as audit-import does), for fail-before runs.
import { appendFileSync as _w5Append } from 'node:fs';
const w5Chk = (scenario, where, what, got, want) => {
  if (process.env.SUITE_CHECKS) _w5Append(process.env.SUITE_CHECKS, JSON.stringify([scenario, where, what, String(got) === String(want), String(got).slice(0, 300)]) + '\n');
  chk(scenario, where, String(what), String(got), String(want));
};
// ==== end v1.97 W5 ====
// ==== v1.97 W6: the money map’s nine open cells, except the reprogramming log (item 62) ====
// ITEM 62 — SIX OF THE MONEY MAP'S NINE OPEN CELLS, each held by an INDEPENDENT ORACLE in whole dollars (the review's
// R12: "verify exports against those oracles, not against their own generating helpers"). Nothing below asks the
// board what a figure ought to be: the two spend plans are walked HERE from the fixture's asks, allocations and budget
// authority; the funds flow's executed years are the fixture's own rows, by appropriation and by effective year; the
// ACE tie-out's years are each year's own lane walk and estimate column, worked out here. Every amount differs -- by
// service, requirement, lane, appropriation and year -- so a swap cannot hide in a total, and every figure is read
// back from the workbook's own bytes and compared at the dollar. tools/money-map.json cites these scenario names.
//
// v1.97 W6.1 THE TWO SPEND PLANS -- every service, requirement and lane, from a walk done here.
// The plan rules, as the board states them (planWant, fsDirected, basisSvcOf): each requirement asks a plan for its
// ALLOCATION CLAMPED TO WHAT IT ASKS FOR (the basis -- "nobody is short of money they did not ask for"); a split asks
// Plan A for its discretionary dollars and Plan B for both, inside the basis, discretionary first; a source forced to
// Disc or Mand directs the ALLOCATION to that pot ("a trim is a trim however it was funded"), UFR nothing. Plan A walks
// the discretionary budget authority alone, Plan B both pots, service lane by service lane, in priority order, each
// row taking what it asks or what the lane has left. ALLOCATED, DISC and MAND ALLOCATED are the directed split where one
// is set and the lane engine's own draw where none is -- and that draw is walked here too (disc then mand per service,
// a directed row drawing its directed lanes). FAILS ON v1.96: the plans read the raw allocation and the raw split and
// gave a forced row its whole ask, so a service allocated above its ask was funded above it, a trimmed forced row asked
// for its trim, and every row below them was walked against the wrong lane balance.
await (async () => {
  const name = 'v1.97 W6 — the two spend plans: every service, requirement and lane, from an independent walk';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const J = JSON.stringify, S_ = a => a.reduce((x, y) => x + y, 0);
  const SV = ['USAF', 'ANG', 'AFRC', 'USN'], Z = () => SV.map(() => 0);
  const PL = { services: SV,
    items: [it('P1', 'PSM', [410000, 52000, 31000, 27000]), it('P2', 'ATL', [230000, 61000, 18000, 44000]),
            it('P3', 'TSS', [150000, 37000, 26000, 39000]), it('P4', 'AV',  [120000, 24000, 36000, 20000]),
            it('P5', 'MxS', [ 88000, 13000, 47000, 22000]), it('P6', 'CDS', [ 55000,  9000, 14000,  6000]),
            it('P7', 'BOP', [ 64000, 32000, 16000,  8000]), it('P8', 'PP',  [140000, 33000, 21000, 48000])],
    disc: [700000, 180000, 95000, 66000], mand: [280000, 61000, 52000, 73000],
    order: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'],
    // P2 is allocated ABOVE its ask in USAF and below it elsewhere; P4 and P7 are trimmed by a total that divides
    // their ask exactly (three quarters); P5 and P8 by service, P8 to nothing in ANG
    alloc: { P2: { m: 's', v: [260000, 40000, 18000, 30000] }, P4: { m: 't', v: 150000 }, P5: { m: 's', v: [70000, 13000, 30000, 22000] },
             P7: { m: 't', v: 90000 }, P8: { m: 's', v: [140000, 0, 21000, 48000] } },
    // P3 is directed above its ask in USAF (90 + 70 against 150) and in ANG (41 against 37); P4 forced to Disc and
    // P5 to Mand, each with its trim; P6 forced to UFR
    fsrc: { P3: { m: 'split', dv: [90000, 41000, 10000, 0], mv: [70000, 0, 9000, 25000] }, P4: { m: 'disc' }, P5: { m: 'mand' }, P6: { m: 'ufr' } } };
  const X = boot(); seed(X.ev, PL);
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); 'ok'`);
  // ---- the oracle, from PL alone
  const ids = PL.order, itemOf = id => PL.items.find(x => x.id === id), ask = id => itemOf(id).ask;
  const allocOf = id => { const a = PL.alloc[id], f = PL.fsrc[id];
    if (f && f.m === 'split') return SV.map((_, i) => f.dv[i] + f.mv[i]);
    if (!a) return ask(id).slice();
    if (a.m === 's') return a.v.slice();
    return ask(id).map(v => v * a.v / S_(ask(id))); };
  const basisOf = id => allocOf(id).map((v, i) => Math.min(v, ask(id)[i]));
  const dirOf = id => { const f = PL.fsrc[id], b = basisOf(id); if (!f) return null;
    if (f.m === 'ufr') return { d: Z(), m: Z() };
    if (f.m === 'disc') return { d: b, m: Z() };
    if (f.m === 'mand') return { d: Z(), m: b };
    const d = b.map((v, i) => Math.min(f.dv[i], v)); return { d, m: b.map((v, i) => Math.min(f.mv[i], v - d[i])) }; };
  const lane = {}; { const dR = PL.disc.slice(), mR = PL.mand.slice();
    ids.forEach(id => { const b = basisOf(id), f = PL.fsrc[id], dr = dirOf(id), d = Z(), m = Z();
      SV.forEach((_, i) => {
        d[i] = Math.min(f && f.m === 'split' ? Math.min(f.dv[i], b[i]) : dr ? dr.d[i] : b[i], Math.max(0, dR[i])); dR[i] -= d[i];
        m[i] = Math.min(f && f.m === 'split' ? Math.min(f.mv[i], b[i] - d[i]) : dr ? dr.m[i] : b[i] - d[i], Math.max(0, mR[i])); mR[i] -= m[i]; });
      lane[id] = { d, m }; }); }
  const walk = (bud, wantOf) => { const rem = bud.slice(), o = {}; let cut = null;
    ids.forEach((id, k) => { const want = wantOf(id), got = want.map((w, i) => { const g = Math.min(w, Math.max(0, rem[i])); rem[i] -= g; return g; });
      const wantT = S_(want), gotT = S_(got), st = wantT <= 0 ? 'none' : gotT <= 0 ? 'cut' : gotT >= wantT ? 'full' : 'part';
      if (!cut && (st === 'cut' || st === 'part')) cut = { rank: k + 1, id };
      o[id] = { want, got, wantT, gotT, st }; });
    return { rows: o, rem, cut }; };
  const both = PL.disc.map((v, i) => v + PL.mand[i]);
  const PA = walk(PL.disc, id => { const dr = dirOf(id); return dr ? dr.d : basisOf(id); });
  const PB = walk(both, id => { const dr = dirOf(id); return dr ? dr.d.map((v, i) => v + dr.m[i]) : basisOf(id); });
  const alc = id => { const dr = dirOf(id); return dr ? [S_(dr.d), S_(dr.m)] : [S_(lane[id].d), S_(lane[id].m)]; };
  const unf = (P, id) => ask(id).map((v, i) => v - P.rows[id].got[i]);   // nothing is funded above its ask, so no floor
  const stLbl = (P, id) => (PA.rows[id].st === 'none' && PB.rows[id].st === 'none')
    ? (S_(ask(id)) > 0 ? 'NOT FUNDED — either plan' : 'NO REQUIREMENT')
    : ({ full: 'Funded', part: 'PARTIAL', cut: 'NOT FUNDED', none: 'NOT IN THIS PLAN' })[P.rows[id].st];
  // ---- the fixture does what it is for
  const cells = PL.items.reduce((a, x) => a.concat(x.ask), []);
  chk(name, 'fixture', 'every requirement’s ask differs in every service, and so does every lane’s budget authority',
    new Set(cells).size + ':' + new Set(PL.disc.concat(PL.mand)).size, cells.length + ':' + 2 * SV.length);
  chk(name, 'fixture', 'P2 is allocated above its ask, P3 directed above it, P4 and P5 forced with a trim',
    J([allocOf('P2')[0] > ask('P2')[0], PL.fsrc.P3.dv[0] + PL.fsrc.P3.mv[0] > ask('P3')[0] && PL.fsrc.P3.dv[1] > ask('P3')[1],
       S_(basisOf('P4')) < S_(ask('P4')), S_(basisOf('P5')) < S_(ask('P5'))]), J([true, true, true, true]));
  chk(name, 'fixture', 'Plan A has a full, a partial, a cut, a not-in-this-plan and a neither row; both plans leave ANG money on the table',
    J([['full', 'part', 'cut', 'none'].map(s => ids.some(id => PA.rows[id].st === s)), ids.some(id => PA.rows[id].st === 'none' && PB.rows[id].st === 'none'),
       PA.rem[1] > 0, PB.rem[1] > 0, ids.some(id => PB.rows[id].st === 'part')]), J([[true, true, true, true], true, true, true, true]));
  const bk = JSON.parse(await w6Book(X.w, 'exportPlans'));
  chk(name, 'workbook', 'the two spend plans build and read back', bk.__err || 'ok', 'ok');
  const FY = X.ev('FYL()');
  // ---- the two plan tabs
  [['a', 'PLAN A — Discretionary only', PA, PL.disc, 'DISCRETIONARY ONLY'],
   ['b', 'PLAN B — Disc + Mandatory', PB, both, 'DISCRETIONARY + MANDATORY']].forEach(([key, tab, P, bud, pot]) => {
    const rows = bk[tab] || [];
    chk(name, tab, 'the tab is in the workbook', rows.length > 0, true);
    chk(name, tab + ' · lane', 'it says which pot funds it', rows.some(r => w6Lbl(r) === 'Every figure on this tab is funded from ' + pot + '.'), true);
    const vec = lbl => { const r = rows.find(x => w6Lbl(x) === lbl) || []; return SV.map((_, i) => num(r[1 + i])).concat([num(r[1 + SV.length])]); };
    const withT = v => J(v.concat([S_(v)]));
    const per = f => SV.map((_, i) => S_(ids.map(id => f(id, i))));
    chk(name, tab + ' · service · lane', 'TOP LINE: this plan’s budget authority, service by service', J(vec('TOP LINE')), withT(bud));
    chk(name, tab + ' · service', 'FUNDED BY THIS PLAN, service by service', J(vec('FUNDED BY THIS PLAN')), withT(per((id, i) => P.rows[id].got[i])));
    chk(name, tab + ' · service', 'LEFT ON THE TABLE, service by service', J(vec('LEFT ON THE TABLE')), withT(P.rem.map(v => Math.max(0, v))));
    chk(name, tab + ' · service', 'NOT COVERED, service by service', J(vec('NOT COVERED')), withT(per((id, i) => P.rows[id].want[i] - P.rows[id].got[i])));
    chk(name, tab + ' · service', FY + ' REQUIREMENT, service by service', J(vec(FY + ' REQUIREMENT')), withT(per((id, i) => ask(id)[i])));
    chk(name, tab + ' · service', 'UNFUNDED, service by service: the requirement less what this plan funds', J(vec('UNFUNDED')), withT(per((id, i) => unf(P, id)[i])));
    chk(name, tab + ' · requirement', 'where the plan runs out', rows.some(r => w6Lbl(r) === 'The plan runs out at #' + P.cut.rank + ' — Ev ' + P.cut.id), true);
    const h = headerRow(rows, 'Rank', 'Allocated'), tot = rows.findIndex((r, j) => j > h && /^TOTAL/.test(w6Lbl(r)));
    const det = rows.slice(h + 1, tot).filter(r => r && w6Lbl(r) !== '');
    chk(name, tab + ' · requirement', 'every requirement is a row, once, in rank order', J(det.map(r => [num(r[colOf(rows, h, 'Rank')]), String(r[colOf(rows, h, 'Requirement')])])),
      J(ids.map((id, k) => [k + 1, 'Ev ' + id])));
    const want = id => { const o = P.rows[id], a = alc(id), w = { PMO: itemOf(id).grp, [FY + ' Requirement']: S_(ask(id)), Allocated: a[0] + a[1],
      'Disc allocated': a[0], 'Mand allocated': a[1], ['Funded from ' + pot]: o.gotT, Short: o.wantT - o.gotT, Unfunded: S_(unf(P, id)), Status: stLbl(P, id) };
      SV.forEach((sv, i) => { w[sv + ' asked'] = o.want[i]; w[sv + ' funded'] = o.got[i]; }); return w; };
    det.forEach(r => { const id = String(r[colOf(rows, h, 'Requirement')]).replace(/^Ev /, ''); if (!P.rows[id]) return;
      const w = want(id);
      Object.keys(w).forEach(k => { const c = colOf(rows, h, k);
        chk(name, tab + ' · ' + id, k, c < 0 ? 'no column ' + k : (typeof w[k] === 'number' ? num(r[c]) : String(r[c] ?? '')), w[k]); });
      // THE IDENTITIES, read off the row itself: no service funded above its ask; Unfunded is the requirement less Funded
      SV.forEach((sv, i) => chk(name, tab + ' · ' + id + ' · ' + sv, 'IDENTITY — funded never above the ask', num(r[colOf(rows, h, sv + ' funded')]) <= ask(id)[i], true));
      chk(name, tab + ' · ' + id, 'IDENTITY — Unfunded = ' + FY + ' Requirement − Funded', num(r[colOf(rows, h, 'Unfunded')]),
        num(r[colOf(rows, h, FY + ' Requirement')]) - num(r[colOf(rows, h, 'Funded from ' + pot)])); });
    const T = rows[tot] || [], tw = {};
    ['FY Requirement', 'Allocated', 'Disc allocated', 'Mand allocated', 'Funded', 'Short', 'Unfunded'].forEach(k => { tw[k] = 0; });
    ids.forEach(id => { const w = want(id); tw['FY Requirement'] += w[FY + ' Requirement']; tw.Allocated += w.Allocated; tw['Disc allocated'] += w['Disc allocated'];
      tw['Mand allocated'] += w['Mand allocated']; tw.Funded += w['Funded from ' + pot]; tw.Short += w.Short; tw.Unfunded += w.Unfunded; });
    chk(name, tab + ' · requirement', 'the TOTAL line counts every requirement and the one funded by neither', w6Lbl(T), 'TOTAL — 8 of 8 requirements (1 funded by neither plan)');
    const tc = { 'FY Requirement': FY + ' Requirement', Allocated: 'Allocated', 'Disc allocated': 'Disc allocated', 'Mand allocated': 'Mand allocated',
      Funded: 'Funded from ' + pot, Short: 'Short', Unfunded: 'Unfunded' };
    Object.keys(tc).forEach(k => chk(name, tab + ' · TOTAL', k, num(T[colOf(rows, h, tc[k])]), tw[k]));
    SV.forEach((sv, i) => {
      chk(name, tab + ' · TOTAL · ' + sv, 'asked', num(T[colOf(rows, h, sv + ' asked')]), S_(ids.map(id => P.rows[id].want[i])));
      chk(name, tab + ' · TOTAL · ' + sv, 'funded', num(T[colOf(rows, h, sv + ' funded')]), S_(ids.map(id => P.rows[id].got[i])));
    });
  });
  // ---- A vs B: what the mandatory top line changes, row by row and lane by lane
  {
    const cmp = bk['A vs B'] || [];
    const ln = lbl => num((cmp.find(r => w6Lbl(r) === lbl) || [])[3]);
    const aT = S_(ids.map(id => PA.rows[id].gotT)), bT = S_(ids.map(id => PB.rows[id].gotT));
    chk(name, 'A vs B · lane', 'Plan A buys (the discretionary pot), Plan B buys (both), and the difference is what mandatory pays for',
      J([ln('Plan A buys'), ln('Plan B buys'), ln('Difference — what mandatory pays for')]), J([aT, bT, bT - aT]));
    const h = headerRow(cmp, 'Rank', 'Allocated');
    const det = cmp.slice(h + 1).filter(r => r && /^\d+$/.test(w6Lbl(r)));
    chk(name, 'A vs B · requirement', 'every requirement is a row, once, in rank order', J(det.map(r => [num(r[0]), String(r[colOf(cmp, h, 'Requirement')])])),
      J(ids.map((id, k) => [k + 1, 'Ev ' + id])));
    det.forEach(r => { const id = String(r[colOf(cmp, h, 'Requirement')]).replace(/^Ev /, ''); if (!PA.rows[id]) return;
      const a = alc(id), w = { PMO: itemOf(id).grp, [FY + ' Requirement']: S_(ask(id)), Allocated: a[0] + a[1], 'Disc allocated': a[0], 'Mand allocated': a[1],
        'A funded (disc)': PA.rows[id].gotT, 'B funded (disc + mand)': PB.rows[id].gotT, 'B unfunded': S_(unf(PB, id)),
        'A status': stLbl(PA, id), 'B status': stLbl(PB, id) };
      Object.keys(w).forEach(k => { const c = colOf(cmp, h, k);
        chk(name, 'A vs B · ' + id, k, c < 0 ? 'no column ' + k : (typeof w[k] === 'number' ? num(r[c]) : String(r[c] ?? '')), w[k]); }); });
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();

// v2.19 (item 150): removed with its feature -- v1.97 W6 — the funds flow: every appropriation and every fiscal year, executed, carried over and planned

// v2.19 (item 150): removed with its feature -- v1.97 W6 — the ACE tie-out: every fiscal year held to that year’s own board and estimate
// v1.97 INTEGRATION: A LEGACY SPLIT ASKS EACH PLAN FOR WHAT THE LANE ENGINE PLACES. W1 (item 73) places a legacy
// whole-requirement split {d, mnd} with mandatory against what discretionary leaves; W6 (item 62) made the Two Spend
// Plans read what was directed, but left a legacy split asking for its whole basis. One helper now places it for both
// (scalarSrcVec). Worked by hand: ask [100, 60], split d 90 / mnd 50. Discretionary 90 over [100, 60] is 56.25 / 33.75,
// whole dollars 56 / 34 (the larger remainder takes the dollar); mandatory 50 over what is left, [44, 26], is 31.43 /
// 18.57, so 31 / 19. Plan A asks 56 / 34; Plan B 87 / 53; with lanes to spare the engine draws d 56 / 34, m 31 / 19 and
// leaves 13 / 7 unfunded. FAILS ON v1.96: both plans asked for the whole ask (100 / 60). The engine line is a CONTROL:
// this fixture has no tie, so v1.96's engine placed it the same way; item 73's own checks (audit-board) hold the tie.
await (async () => {
  const name = 'v1.97 integration — a legacy split asks each spend plan for what the lane engine places';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const X = boot();
    seed(X.ev, { services: ['A', 'B'], items: [it('L1', 'PSM', [100, 60])], disc: [1000, 1000], mand: [1000, 1000],
                 order: ['L1'], fsrc: { L1: { m: 'split', d: 90, mnd: 50 } } });
    const got = JSON.parse(X.ev(`(function(){ const it=itemById('L1'), t=tiers().L1;
      return JSON.stringify({a:planWant(it,'a'), b:planWant(it,'b'), d:t.d, m:t.m, u:t.u}); })()`));
    chk(name, 'Two Spend Plans · Plan A', 'a legacy split asks Plan A for its discretionary dollars, placed as the lane engine places them', J(got.a), J([56, 34]));
    chk(name, 'Two Spend Plans · Plan B', 'and Plan B for both lanes, inside the basis', J(got.b), J([87, 53]));
    chk(name, 'lane engine', 'CONTROL — the engine draws the same placement where the lanes can pay: d, m and what is left unfunded', J([got.d, got.m, got.u]), J([[56, 34], [31, 19], [13, 7]]));
    // The Excel workbook's Two-Plan Forecast tab says how each kind of requirement asks the plans. It said one forced to
    // MANDATORY "still competes for discretionary in Plan A" -- untrue since 7 Sep: it asks Plan A for nothing (W6's
    // finding 4). FAILS ON v1.96.
    const sh = JSON.parse(capture(X.ev)) || [];
    const fc = sh.find(t => / Two-Plan Forecast$/.test(t.name));
    const note = fc ? fc.rows.map(r => (r && r[0] && typeof r[0] === 'object') ? r[0].v : r && r[0]).filter(v => typeof v === 'string').find(v => /^TWO INDEPENDENT WALKS/.test(v)) || '' : '';
    chk(name, 'Excel · Two-Plan Forecast · note', 'says a requirement forced to Mandatory asks Plan A for nothing, and no longer that it competes for discretionary there',
      J([/forced to MANDATORY asks Plan A for nothing/.test(note), /competes for discretionary/.test(note)]), J([true, false]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v1.97 W6 ====
// ==== v1.98 item 83: RCN/EEIC by service on a prime's CLINs; every RCN/EEIC surface reads one rule ====
// THE ORACLE IS THIS TABLE, typed from the fixture's own numbers. A prime P with two CLINs and a different amount on every
// service of every CLIN; a requirement R with its own ANG combination; Q with none. Which combination each dollar is on
// (Brad, 5 Oct 2026: the CLIN wins): the CLIN's choice for the service, then the CLIN's standard, then the requirement's
// choice for the service, then the requirement's own.
//   P: requirement K4, its ANG K2.  CLIN 0001: standard K1, AFRC K3.  CLIN 0002: nothing of its own.
//      CLIN 0001: USAF 401 K1 · ANG 251 K1 (the CLIN wins over P's ANG K2) · AFRC 31 K3 · USN 41 (Navy: no RCN/EEIC)
//      CLIN 0002: USAF 299 K4 (P's own) · AFRC 59 K4
//   R: K1, its ANG K2 -- USAF 503 K1 · ANG 127 K2.   Q: nothing -- USAF 71 on no combination.
// FAILS ON v1.97: the RCN-EEIC by Month summary filed P's money under P's own (USAF 700 K4, ANG 251 K2, AFRC 90 K4); the
// Spend Plan Source put CLIN 0001's AFRC on K1; the ACE breakout printed one code per line (K1 beside ANG's and AFRC's
// money on CLIN 0001, K1 beside R's ANG) and the mapping counted P's combinations as 2 and R's as 1.
const v198K = { K1: ['11111', 'AAAAA'], K2: ['22222', 'BBBBB'], K3: ['33333', 'CCCCC'], K4: ['44444', 'DDDDD'] };
const v198Lab = k => v198K[k][0] + ' / ' + v198K[k][1];
const v198NONE = '— no RCN/EEIC assigned —';
const v198Board = (state) => {
  const X = boot();
  seed(X.ev, { services: ['USAF', 'ANG', 'AFRC', 'USN'], items: [it('PRIME_P', 'AV', [700, 251, 90, 41]), it('R', 'AV', [503, 127, 0, 0]), it('Q', 'AV', [71, 0, 0, 0])],
    disc: [5000, 5000, 5000, 5000], mand: [0, 0, 0, 0], order: ['PRIME_P', 'R', 'Q'] });
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.ptype={PRIME_P:'PRIME'};
    S.clinNew={PRIME_P:[{key:'n1',clin:'0001',desc:'air vehicle',ccar:'',ask:[401,251,31,41]},{key:'n2',clin:'0002',desc:'engines',ccar:'',ask:[299,0,59,0]}]};
    S.clinAlloc={PRIME_P:{n1:[401,251,31,41], n2:[299,0,59,0]}};
    MS.rcn=${JSON.stringify(Object.keys(v198K).map(k => ({ k, rcn: v198K[k][0], eeic: v198K[k][1], t: '', svc: k === 'K2' ? ['ANG'] : (k === 'K3' ? ['AFRC'] : ['USAF', 'ANG', 'AFRC']) })))};
    ${state}
    applyState(S); save(); 'ok'`);
  return X;
};
// Read one section of the RCN-EEIC by Month tab: [service, label, TOTAL, the Ask column] for every row that carries money.
const v198Sec = (rc, a, b) => { const out = []; let sv = null;
  for (let j = a; j < b; j++) { const L = w6Lbl(rc[j]);
    if (['USAF', 'ANG', 'AFRC'].includes(L)) { sv = L; continue; }
    if (/TOTAL BY MONTH$/.test(L)) { sv = null; continue; }
    if (!sv || num((rc[j] || [])[14]) === null) continue;
    out.push([sv, L.replace(/\s+⚠ rides several combinations.*$/, ' ⚠'), num(rc[j][14]), num((rc[j] || [])[15])]); }
  return out; };
await (async () => {
  const name = 'v1.98 item 83 — a prime’s CLINs put each service’s money on its own RCN/EEIC, and the summary, the CLIN breakout, the Spend Plan Source and the ACE breakout agree';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const X = v198Board(`S.rcnAsg={PRIME_P:'K4', R:'K1'}; S.rcnSvc={PRIME_P:{ANG:'K2'}, R:{ANG:'K2'}};
      S.clinRcn={PRIME_P:{n1:'K1'}}; S.clinRcnSvc={PRIME_P:{n1:{AFRC:'K3'}}};
      S.wbs={R:[{w:'2.2', v:[]}]};`);   // v2.19 (item 150): the estimate and the ACE tie-out are gone
    chk(name, 'fixture', 'every requirement is funded in full on every service (discretionary)',
      X.ev(`(function(){ var T=tiers(); return JSON.stringify(['PRIME_P','R','Q'].map(function(id){ return T[id].d.concat(T[id].m); })); })()`),
      J([[700, 251, 90, 41, 0, 0, 0, 0], [503, 127, 0, 0, 0, 0, 0, 0], [71, 0, 0, 0, 0, 0, 0, 0]]));
    // ---- RCN-EEIC by Month, from the workbook's bytes
    const bk = JSON.parse(await w6Book(X.w, 'exportExcel'));
    chk(name, 'workbook', 'the Excel workbook builds and reads back', bk.__err || 'ok', 'ok');
    const rc = bk['RCN-EEIC by Month'] || [];
    const iReq = rc.findIndex(r => w6Lbl(r) === 'WHICH REQUIREMENTS SIT UNDER EACH COMBINATION');
    const iPr = rc.findIndex(r => w6Lbl(r) === 'PRIME CONTRACTS, BROKEN OUT BY CLIN');
    chk(name, 'RCN-EEIC by Month', 'the summary, the requirements and the prime contracts sections are all there', iReq > 0 && iPr > iReq, true);
    chk(name, 'RCN-EEIC by Month · summary', 'each service’s money on the combination each CLIN puts it on; Q on none; each service total is its funded money',
      J(v198Sec(rc, 0, iReq).map(r => r.slice(0, 3))),
      J([['USAF', v198Lab('K1'), 401 + 503], ['USAF', v198Lab('K4'), 299], ['USAF', v198NONE, 71], ['USAF', 'USAF TOTAL', 700 + 503 + 71],
        ['ANG', v198Lab('K1'), 251], ['ANG', v198Lab('K2'), 127], ['ANG', 'ANG TOTAL', 251 + 127],
        ['AFRC', v198Lab('K3'), 31], ['AFRC', v198Lab('K4'), 59], ['AFRC', 'AFRC TOTAL', 90]]));
    chk(name, 'RCN-EEIC by Month · requirements', 'P under each combination its CLINs use, with that share of its money and its ask, marked; the rows add to their combination',
      J(v198Sec(rc, iReq, iPr)),
      J([['USAF', v198Lab('K1') + '   (2 requirements)', 904, null], ['USAF', '#1  Req PRIME_P ⚠', 401, 401], ['USAF', '#2  Req R', 503, 503],
        ['USAF', v198Lab('K4') + '   (1 requirement)', 299, null], ['USAF', '#1  Req PRIME_P ⚠', 299, 299],
        ['USAF', v198NONE + '   — 1 requirement still to assign', 71, null], ['USAF', '#3  Req Q', 71, 71], ['USAF', 'USAF TOTAL', 1274, null],
        ['ANG', v198Lab('K1') + '   (1 requirement)', 251, null], ['ANG', '#1  Req PRIME_P', 251, 251],
        ['ANG', v198Lab('K2') + '   (1 requirement)', 127, null], ['ANG', '#2  Req R', 127, 127], ['ANG', 'ANG TOTAL', 378, null],
        ['AFRC', v198Lab('K3') + '   (1 requirement)', 31, null], ['AFRC', '#1  Req PRIME_P ⚠', 31, 31],
        ['AFRC', v198Lab('K4') + '   (1 requirement)', 59, null], ['AFRC', '#1  Req PRIME_P ⚠', 59, 59], ['AFRC', 'AFRC TOTAL', 90, null]]));
    chk(name, 'RCN-EEIC by Month · prime contracts', 'each CLIN’s money on each service, under that service’s combination on that CLIN',
      J(v198Sec(rc, iPr, rc.length).map(r => r.slice(0, 3))),
      J([['USAF', 'Req PRIME_P   (2 CLINs funded)', 700], ['USAF', 'CLIN 0001   ' + v198Lab('K1'), 401], ['USAF', 'CLIN 0002   ' + v198Lab('K4'), 299], ['USAF', 'USAF — PRIMES TOTAL', 700],
        ['ANG', 'Req PRIME_P   (1 CLIN funded)', 251], ['ANG', 'CLIN 0001   ' + v198Lab('K1'), 251], ['ANG', 'ANG — PRIMES TOTAL', 251],
        ['AFRC', 'Req PRIME_P   (2 CLINs funded)', 90], ['AFRC', 'CLIN 0001   ' + v198Lab('K3'), 31], ['AFRC', 'CLIN 0002   ' + v198Lab('K4'), 59], ['AFRC', 'AFRC — PRIMES TOTAL', 90]]));
    // ---- the Spend Plan Source: every line, by its amount (each is unique), with its CLIN and its EEIC and RCN
    const sb = JSON.parse(await w6Book(X.w, 'exportSrc'));
    chk(name, 'Spend Plan Source', 'the file builds and reads back', sb.__err || 'ok', 'ok');
    const src = (Object.values(sb).find(rs => (rs || []).length > 1) || []).slice(1);
    const got = src.map(r => [num(r[9]), String(r[25] ?? ''), String(r[26] ?? ''), String(r[27] ?? '')]).sort((a, b) => a[0] - b[0]);
    const want = [[31, '0001', 'CCCCC', '33333'], [41, '0001', '', ''], [59, '0002', 'DDDDD', '44444'], [71, '', '', ''], [127, '', 'BBBBB', '22222'],
      [251, '0001', 'AAAAA', '11111'], [299, '0002', 'DDDDD', '44444'], [401, '0001', 'AAAAA', '11111'], [503, '', 'AAAAA', '11111']];
    chk(name, 'Spend Plan Source', 'every line: amount, CLIN, EEIC and RCN -- each service on each CLIN on its own combination', J(got), J(want));
    // ---- AGREEMENT: the summary's combination totals are the source file's lines on those combinations, service by service
    const srcBy = {}; [[401, 'USAF'], [299, 'USAF'], [503, 'USAF'], [71, 'USAF'], [251, 'ANG'], [127, 'ANG'], [31, 'AFRC'], [59, 'AFRC']].forEach(([a, sv]) => {
      const l = got.find(x => x[0] === a); const lab = l && l[3] ? l[3] + ' / ' + l[2] : v198NONE; srcBy[sv + '|' + lab] = (srcBy[sv + '|' + lab] || 0) + a; });
    const rollBy = {}; v198Sec(rc, 0, iReq).filter(r => !/TOTAL$/.test(r[1])).forEach(r => { rollBy[r[0] + '|' + r[1]] = r[2]; });
    chk(name, 'agreement', 'the summary and the Spend Plan Source put the same dollars on the same combinations', J(Object.keys(rollBy).sort().map(k => [k, rollBy[k]])), J(Object.keys(srcBy).sort().map(k => [k, srcBy[k]])));
    // v2.19 (item 150): the ACE tie-out's alignment breakout and mapping, which read the same rule, are gone with it
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// A CLIN STILL POINTING AT A COMBINATION THAT WAS REMOVED (v1.97's ✕ left the CLINs' pointers behind) is money on no
// combination. The summary prints only the list's combinations and the not-assigned row, so once it reads the CLINs
// (this version) a pointer to anything else would put that money in no row and no total: the service totals below guard
// it (a CONTROL on v1.97, whose summary read only the requirement). FAILS ON v1.97: the summary filed P under its own
// (none) rather than CLIN 0002's K1, and the CLIN breakout named CLIN 0001's combination "(blank combo)".
await (async () => {
  const name = 'v1.98 item 83 — a CLIN pointing at a removed combination: its money is not assigned, never out of the totals';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const X = v198Board(`S.clinRcn={PRIME_P:{n1:'GONE', n2:'K1'}}; S.rcnAsg={R:'K1'};`);
    const bk = JSON.parse(await w6Book(X.w, 'exportExcel'));
    const rc = bk['RCN-EEIC by Month'] || [];
    const iReq = rc.findIndex(r => w6Lbl(r) === 'WHICH REQUIREMENTS SIT UNDER EACH COMBINATION');
    chk(name, 'RCN-EEIC by Month · summary', 'USAF: K1 is CLIN 0002 and R; CLIN 0001’s money and Q’s are not assigned; the total is every funded dollar',
      J(v198Sec(rc, 0, iReq).filter(r => r[0] === 'USAF').map(r => r.slice(0, 3))),
      J([['USAF', v198Lab('K1'), 299 + 503], ['USAF', v198NONE, 401 + 71], ['USAF', 'USAF TOTAL', 700 + 503 + 71]]));
    chk(name, 'RCN-EEIC by Month · summary', 'ANG and AFRC on CLIN 0001 are not assigned either, and every service total is its funded money',
      J(v198Sec(rc, 0, iReq).filter(r => r[0] !== 'USAF' && /TOTAL$/.test(r[1])).map(r => r.slice(0, 3))),
      J([['ANG', 'ANG TOTAL', 251 + 127], ['AFRC', 'AFRC TOTAL', 90]]));
    const iPr = rc.findIndex(r => w6Lbl(r) === 'PRIME CONTRACTS, BROKEN OUT BY CLIN');
    chk(name, 'RCN-EEIC by Month · prime contracts', 'CLIN 0001 reads as not assigned on every service; CLIN 0002 is K1',
      J(v198Sec(rc, iPr, rc.length).filter(r => /^CLIN /.test(r[1])).map(r => r.slice(0, 3))),
      J([['USAF', 'CLIN 0001   ' + v198NONE, 401], ['USAF', 'CLIN 0002   ' + v198Lab('K1'), 299], ['ANG', 'CLIN 0001   ' + v198NONE, 251],
        ['AFRC', 'CLIN 0001   ' + v198NONE, 31], ['AFRC', 'CLIN 0002   ' + v198Lab('K1'), 59]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// A PRIME FUNDED NOTHING still needs its combinations: the NOT FUNDED list under each service names it under the
// combination each CLIN puts that service on, with that CLIN grid's share of its ask, and the shares add to the ask.
// FAILS ON v1.97: it was listed once, under the requirement's own combination (K4), with the whole ask.
await (async () => {
  const name = 'v1.98 item 83 — a prime funded nothing is listed under each CLIN’s combination, with its share of the ask';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const X = v198Board(`S.order=['R','Q','PRIME_P']; S.rcnAsg={PRIME_P:'K4', R:'K1'}; S.clinRcn={PRIME_P:{n1:'K1'}};
      S.discSvc=[574,127,0,0]; S.mandSvc=[0,0,0,0]; S.bm={disc:[574,127,0,0], mand:[0,0,0,0], adds:[]};`);
    chk(name, 'fixture', 'R and Q, ranked above P, take the whole budget; P is funded nothing',
      X.ev(`(function(){ var T=tiers(); return JSON.stringify([T.R.d, T.Q.d, T.PRIME_P.d.concat(T.PRIME_P.m)]); })()`), J([[503, 127, 0, 0], [71, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0]]));
    const bk = JSON.parse(await w6Book(X.w, 'exportExcel'));
    const rc = bk['RCN-EEIC by Month'] || [];
    const iReq = rc.findIndex(r => w6Lbl(r) === 'WHICH REQUIREMENTS SIT UNDER EACH COMBINATION');
    const iPr = rc.findIndex(r => w6Lbl(r) === 'PRIME CONTRACTS, BROKEN OUT BY CLIN');
    const nf = []; let sv = null, on = false;
    for (let j = iReq; j < (iPr > 0 ? iPr : rc.length); j++) { const L = w6Lbl(rc[j]);
      if (['USAF', 'ANG', 'AFRC'].includes(L)) { sv = L; on = false; continue; }
      if (/^A requirement appears once/.test(L)) break;        // the section's note, after the last service
      if (/^NOT FUNDED/.test(L)) { on = true; nf.push([sv, 'NOT FUNDED', num((rc[j] || [])[15])]); continue; }
      if (on && L) nf.push([sv, L.replace(/\s+⚠ rides several combinations.*$/, ' ⚠'), num((rc[j] || [])[15])]); }
    chk(name, 'RCN-EEIC by Month · not funded', 'USAF: P under K1 (CLIN 0001, 401) and K4 (CLIN 0002, 299), marked; AFRC: K1 31 and K4 59; ANG: K1 251 -- each service’s shares add to its ask',
      J(nf), J([['USAF', 'NOT FUNDED', 700], ['USAF', v198Lab('K1') + '   (1)', 401], ['USAF', '#3  Req PRIME_P ⚠', 401], ['USAF', v198Lab('K4') + '   (1)', 299], ['USAF', '#3  Req PRIME_P ⚠', 299],
        ['ANG', 'NOT FUNDED', 251], ['ANG', v198Lab('K1') + '   (1)', 251], ['ANG', '#3  Req PRIME_P', 251],
        ['AFRC', 'NOT FUNDED', 90], ['AFRC', v198Lab('K1') + '   (1)', 31], ['AFRC', '#3  Req PRIME_P ⚠', 31], ['AFRC', v198Lab('K4') + '   (1)', 59], ['AFRC', '#3  Req PRIME_P ⚠', 59]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v1.98 item 83 ====
// ==== v1.99 item 85 (review N01): a split total gives each odd dollar to the service it belongs to ====
// THE ORACLE IS INTEGER ARITHMETIC, written here and not read from the board: every weight is made an exact fraction by
// doubling it until it is whole (a different route from the board's, which reads the number's bits), put over one
// denominator, and each share is the exact quotient with its exact remainder; leftover dollars go to the largest
// remainders, ties to the lower service. No weight: evenly.
// FAILS ON v1.98, which worked each share out in floating point: $100,000,000 over [19,698,320, 191,126,895, 89,174,792]
// gave [6,566,107, 63,708,963, 29,724,930] -- the first service $1 of the second's (remainders 154,037,258 and
// 154,037,259 of 300,000,007) -- and $10,000,000 over 1 : 1 : 4 gave [1,666,667, 1,666,666, 6,666,667], the tie to the
// third service.
const v199Exact = (T, w) => {
  const fr = w.map(x => { x = (Number.isFinite(x) && x > 0) ? x : 0; let d = 1n, v = x; while (!Number.isInteger(v)) { v *= 2; d *= 2n; } return [BigInt(v), d]; });
  const F = fr.some(f => f[0] > 0n) ? fr : fr.map(() => [1n, 1n]);
  const L = F.reduce((a, f) => (a > f[1] ? a : f[1]), 1n), W = F.map(f => f[0] * (L / f[1])), s = W.reduce((a, b) => a + b, 0n), t = BigInt(Math.round(T));
  const q = [], r = []; W.forEach(x => { const p = t * x; let d = p / s, m = p - d * s; if (m < 0n) { d -= 1n; m += s; } q.push(d); r.push(m); });
  let left = t - q.reduce((a, b) => a + b, 0n);
  const ord = r.map((v, i) => ({ i, v })).sort((a, b) => (a.v < b.v ? 1 : a.v > b.v ? -1 : a.i - b.i));
  for (let k = 0; left > 0n; k++, left--) q[ord[k].i]++;
  return q.map(Number); };
// Near-ties at budget size, built on purpose: with T and the sum s coprime, w2 = w1 + T^-1 (mod s) has a remainder exactly
// one more than w1's. Random figures almost never land this close; the board must still be exact when they do.
const v199Inv = (a, m) => { let [r0, r1, s0, s1] = [m, a % m, 0n, 1n]; while (r1) { const q = r0 / r1; [r0, r1] = [r1, r0 - q * r1]; [s0, s1] = [s1, s0 - q * s1]; } return ((s0 % m) + m) % m; };
const v199NearTies = n => { const out = [];
  for (const [T, s] of [[100000000, 300000007], [250000000, 600000001], [1000000000, 900000011], [2500000000, 300000007]]) {
    const Ti = v199Inv(BigInt(T) % BigInt(s), BigInt(s));
    for (let k = 0; k < n / 4; k++) {
      const w1 = BigInt(1000003 + k * 99991) % BigInt(s), w2 = (w1 + Ti) % BigInt(s), w3 = BigInt(s) - w1 - w2;
      if (w3 < 0n) continue;
      out.push([T, (k % 2) ? [Number(w2), Number(w1), Number(w3)] : [Number(w1), Number(w2), Number(w3)]]); } }
  return out; };
await (async () => {
  const name = 'v1.99 item 85 — a split total gives each odd dollar to the service it belongs to: exact, ties to the lower service';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const W = [19698320, 191126895, 89174792], E8 = v199Exact(100000000, W), TIE = v199Exact(10000000, [1000, 1000, 4000]);
    w5Chk(name, 'oracle', 'CONTROL — the oracle’s own answers: the near-tie and the tie (worked by hand in the comment)',
      J([E8, TIE]), J([[6566106, 63708964, 29724930], [1666667, 1666667, 6666666]]));
    const X = boot();
    seed(X.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('A', 'AV', W), it('B', 'AV', [1000, 1000, 4000]), it('L', 'AV', W), it('P', 'AV', [300000007, 0, 0])],
      disc: [1e9, 1e9, 1e9], mand: [0, 0, 0], order: ['A', 'B', 'L', 'P'] });
    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.alloc={A:{m:'t', v:100000000}, B:{m:'t', v:10000000}, P:{m:'s', v:[100000000,0,0]}};
      S.fsrc={L:{m:'split', d:100000000, mnd:0}};
      S.ptype={P:'PRIME'};
      S.clinNew={P:[{key:'n1',clin:'0001',desc:'one',ccar:'',ask:[19698320,0,0]},{key:'n2',clin:'0002',desc:'two',ccar:'',ask:[191126895,0,0]},{key:'n3',clin:'0003',desc:'three',ccar:'',ask:[89174792,0,0]}]};
      S.clinAlloc={P:{n1:[19698320,0,0], n2:[191126895,0,0], n3:[89174792,0,0]}};
      applyState(S); save(); 'ok'`);
    // ---- the helper: named cases, then a sweep -- every service's dollars, not the total
    const ap = cases => JSON.parse(X.ev(`JSON.stringify(${J(cases)}.map(function(c){ return apportion(c[0], c[1]); }))`));
    const NAMED = [['the review’s case, $7,652,408,746,072', 7652408746072, [8028733825777, 532030733303, 817029632163]],
      ['a near-tie at budget size, $100,000,000', 100000000, W], ['an exact tie, $10,000,000 over 1 : 1 : 4', 10000000, [1000, 1000, 4000]],
      ['an exact tie, $2 over 1 : 3 : 10', 2, [1, 3, 10]], ['a deduction, -$7 over 1 : 2 : 4', -7, [1, 2, 4]], ['a deduction that does not divide, -$1 over three equal services', -1, [1, 1, 1]], ['no weight: $7 evenly', 7, [0, 0, 0]],
      ['fractional weights, $100 over 0.1 : 0.2 : 0.3', 100, [0.1, 0.2, 0.3]], ['$10,000,000,000,000 over six equal services', 1e13, [1, 1, 1, 1, 1, 1]],
      ['weights 600 orders apart', 1, [1e-300, 1e300]], ['weights the board does not take (Infinity, NaN, negative)', 5, [Infinity, NaN, -3, 2]]];
    const got = ap(NAMED.map(c => [c[1], c[2]]));
    // the first four fail on v1.98; the rest are CONTROLS (v1.98 already had them right) that hold the edges
    NAMED.forEach((c, i) => w5Chk(name, 'apportion: ' + c[0], (i >= 4 ? 'CONTROL — ' : '') + 'every service’s dollars are the exact split, ties to the lower service', J(got[i]), J(v199Exact(c[1], c[2]))));
    let seedN = 20261006; const rnd = () => { seedN = (seedN * 1103515245 + 12345) % 2147483648; return seedN / 2147483648; };
    const SWEEP = v199NearTies(400);
    for (let a = 1; a <= 12; a++) for (let b = 1; b <= 12; b++) for (let c = 1; c <= 12; c += 3) SWEEP.push([1 + ((a * b * c) % 97), [a, b, c]]);
    for (let i = 0; i < 600; i++) { const k = 2 + Math.floor(rnd() * 5), mag = 10 ** (3 + Math.floor(rnd() * 10));
      SWEEP.push([Math.floor(rnd() * mag), Array.from({ length: k }, () => (rnd() < 0.15 ? 0 : rnd() < 0.2 ? rnd() * mag : Math.floor(rnd() * mag)))]); }
    const sg = ap(SWEEP);
    const bad = SWEEP.map((c, i) => [c, sg[i], v199Exact(c[0], c[1])]).filter(x => J(x[1]) !== J(x[2]));
    w5Chk(name, 'apportion: ' + SWEEP.length + ' cases -- built near-ties, small ties, random to $10 trillion', 'none differs from the exact split, service by service',
      bad.length ? bad.length + ' differ, e.g. ' + J(bad[0]) : 'none', 'none');
    // ---- every surface that spreads a total by it, read where the board keeps the result
    const ev = c => { try { return JSON.parse(X.ev(c)); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    // (v2.03, item 104: the typed budget total went with the command bar, the only thing that could call setBATot.)
    w5Chk(name, 'a total allocation, $100,000,000 on A', 'each service’s allocation is the exact split in the shape of the ask', J(ev(`JSON.stringify(svcAlloc(itemById('A')))`)), J(E8));
    w5Chk(name, 'a total allocation, $10,000,000 on B (1 : 1 : 4)', 'the tie goes to the lower service', J(ev(`JSON.stringify(svcAlloc(itemById('B')))`)), J(TIE));
    w5Chk(name, 'an old-style split, $100,000,000 discretionary on L', 'the lane engine funds each service its exact share', J(ev(`JSON.stringify(tiers().L.d)`)), J(E8));
    w5Chk(name, 'a prime’s CLINs, $100,000,000 on USAF', 'each CLIN’s part is the exact split by the CLIN grid',
      J(ev(`JSON.stringify(clinSplit('P', 0, 100000000).map(function(x){ return x.part; }))`)), J(E8));
    const sb = JSON.parse(await w6Book(X.w, 'exportSrc'));
    w5Chk(name, 'Spend Plan Source', 'CONTROL — the file builds and reads back', sb.__err || 'ok', 'ok');
    const src = (Object.values(sb).find(rs => (rs || []).length > 1) || []).slice(1);
    const pl = ['0001', '0002', '0003'].map(c => src.filter(r => String(r[25] ?? '') === c).reduce((a, r) => a + (num(r[9]) || 0), 0));
    w5Chk(name, 'Spend Plan Source', 'P’s USAF lines, CLIN by CLIN, carry the exact split', J(pl), J(E8));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v1.99 item 85 ====
// (v1.99 item 87, the reprogramming $M field, went with the ATR/BTR tracker in v2.02.)
// ==== v1.99 item 88 (review N04): a locked cycle keeps the RCN / EEIC list it was locked with ====
// On v1.98's fixture: P's CLIN 0001 is on K1 (11111 / AAAAA) with its AFRC on K3 (33333 / CCCCC). Lock the window; then,
// in the working list, give K1 new codes (99999 / ZZZZZ) and remove K3. FAILS ON v1.98: the cycle's view read today's
// list, so its RCN-EEIC tab printed 99999 / ZZZZZ for the money locked on 11111 / AAAAA, and filed K3's money under
// "no RCN/EEIC assigned"; the Spend Plan Source taken from the view did the same.
await (async () => {
  const name = 'v1.99 item 88 — a locked cycle’s view and every report from it read the RCN / EEIC list it was locked with';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const X = v198Board(`S.rcnAsg={PRIME_P:'K4', R:'K1'}; S.rcnSvc={PRIME_P:{ANG:'K2'}, R:{ANG:'K2'}};
      S.clinRcn={PRIME_P:{n1:'K1'}}; S.clinRcnSvc={PRIME_P:{n1:{AFRC:'K3'}}};`);
    const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    const key = ev(`window.confirm=function(){ return true; }; MS.base=MS.cur; blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
    w5Chk(name, 'lock', 'CONTROL — the window is locked', ev(`!!(blGet(${J(key)}) && blGet(${J(key)}).locked)`), 'true');
    // the working list changes: K1 renumbered, K3 removed (its pointers in the working plan cleared, as rcnDel does)
    ev(`(function(){ var L=rcnReg(), i=L.findIndex(function(e){ return e.k==='K1'; }); rcnSet(i,'rcn','99999'); rcnSet(i,'eeic','ZZZZZ');
      rcnDel(rcnReg().findIndex(function(e){ return e.k==='K3'; })); })(); 'ok'`);
    const summary = async () => { const bk = JSON.parse(await w6Book(X.w, 'exportExcel')); const rc = bk['RCN-EEIC by Month'] || [];
      const iReq = rc.findIndex(r => w6Lbl(r) === 'WHICH REQUIREMENTS SIT UNDER EACH COMBINATION');
      return { rows: v198Sec(rc, 0, iReq).map(r => r.slice(0, 3)), title: w6Lbl(rc[0] || []) }; };
    const srcLines = async () => { const sb = JSON.parse(await w6Book(X.w, 'exportSrc'));
      const src = (Object.values(sb).find(rs => (rs || []).length > 1) || []).slice(1);
      return src.map(r => [num(r[9]), String(r[25] ?? ''), String(r[26] ?? ''), String(r[27] ?? '')]).sort((a, b) => a[0] - b[0]); };
    const LOCKED = [['USAF', v198Lab('K1'), 401 + 503], ['USAF', v198Lab('K4'), 299], ['USAF', v198NONE, 71], ['USAF', 'USAF TOTAL', 1274],
      ['ANG', v198Lab('K1'), 251], ['ANG', v198Lab('K2'), 127], ['ANG', 'ANG TOTAL', 378],
      ['AFRC', v198Lab('K3'), 31], ['AFRC', v198Lab('K4'), 59], ['AFRC', 'AFRC TOTAL', 90]];
    const LOCKED_SRC = [[31, '0001', 'CCCCC', '33333'], [41, '0001', '', ''], [59, '0002', 'DDDDD', '44444'], [71, '', '', ''], [127, '', 'BBBBB', '22222'],
      [251, '0001', 'AAAAA', '11111'], [299, '0002', 'DDDDD', '44444'], [401, '0001', 'AAAAA', '11111'], [503, '', 'AAAAA', '11111']];
    // THE WORKING PLAN takes the change (a CONTROL: v1.98 did this too)
    const w = await summary();
    w5Chk(name, 'the working plan', 'CONTROL — K1’s money prints 99999 / ZZZZZ, and K3’s, its pointer cleared, falls to the CLIN’s standard',
      J(w.rows.filter(r => r[0] === 'USAF' || r[0] === 'AFRC').map(r => r[1])), J(['99999 / ZZZZZ', v198Lab('K4'), v198NONE, 'USAF TOTAL', '99999 / ZZZZZ', v198Lab('K4'), 'AFRC TOTAL']));
    // THE CYCLE'S VIEW: every code as locked
    ev(`cycView(${J(key)}); 'ok'`);
    const v = await summary();
    w5Chk(name, 'the cycle’s view · RCN-EEIC by Month', 'every dollar on the code it was locked on: K1 still 11111 / AAAAA, K3 still 33333 / CCCCC', J(v.rows), J(LOCKED));
    w5Chk(name, 'the cycle’s view · Spend Plan Source', 'every line’s EEIC and RCN as locked', J(await srcLines()), J(LOCKED_SRC));
    w5Chk(name, 'the cycle’s view', 'CONTROL — it says nothing about today’s list: this cycle kept its own',
      J([/today’s list/.test(ev(`(document.getElementById('shareStat')||{}).textContent||''`)), /today’s list/.test(v.title)]), J([false, false]));
    ev(`cycLeave(); 'ok'`);
    const w2 = await summary();
    w5Chk(name, 'back on the working plan', 'CONTROL — today’s codes again', J(w2.rows), J(w.rows));
    // SAVED AND REOPENED: the cycle's list is in the file
    const R = boot({ html: ev('buildSavedHtml()') });
    const rv = (() => { try { R.ev(`cycView(${J(key)}); 'ok'`); return 'ok'; } catch (e) { return 'threw'; } })();
    const rb = JSON.parse(await w6Book(R.w, 'exportExcel')); const rrc = rb['RCN-EEIC by Month'] || [];
    w5Chk(name, 'saved and reopened, the cycle’s view', 'still every code as locked',
      J([rv, v198Sec(rrc, 0, rrc.findIndex(r => w6Lbl(r) === 'WHICH REQUIREMENTS SIT UNDER EACH COMBINATION')).map(r => r.slice(0, 3))]), J(['ok', LOCKED]));
    // A CYCLE LOCKED BEFORE v1.99 kept no list: read against today's, and said so -- in the view, on its line, on the tab
    ev(`delete blGet(${J(key)}).rcn; cycView(${J(key)}); 'ok'`);
    const o = await summary();
    w5Chk(name, 'a cycle locked before v1.99', 'its view says its codes are read against today’s list',
      /read against today’s list/.test(ev(`(document.getElementById('shareStat')||{}).textContent||''`)), true);
    w5Chk(name, 'a cycle locked before v1.99', 'the RCN-EEIC tab’s title says so', /read against today’s list/.test(o.title), true);
    w5Chk(name, 'a cycle locked before v1.99', 'CONTROL — and no code is made up: it prints today’s', J(o.rows.filter(r => r[0] === 'USAF').map(r => r[1])),
      J(['99999 / ZZZZZ', v198Lab('K4'), v198NONE, 'USAF TOTAL']));
    ev(`cycLeave(); blOpen=true; blBody(); 'ok'`);
    w5Chk(name, 'a cycle locked before v1.99', 'its line under PPBE cycles says (RCN / EEIC: today’s list)',
      /\(RCN \/ EEIC: today’s list\)/.test(ev(`document.getElementById('blBody').textContent`)), true);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// v2.19 (item 150): removed with its feature -- v1.99 items 92–93 — the funds-flow export is the panel’s selection, and execution is decided per appropriation and year
// v2.19 (item 150): removed with its feature -- v1.99 item 94 — an office with only estimate lines is a row of the ACE reconciliation, and the estimate is accounted for
// ==== end v1.99 item 94 ====
// ==== v1.99 items 97 and 98 (from items 84 and 89): what the Classify grid sets, and what a locked cycle keeps ====
// ITEM 97 -- on v1.98's fixture PRIME_P's CLIN 0001 carries its own RCN / EEIC and 0002 does not. The Classify grid's
// RCN / EEIC column sets the requirement's own combination (the default a CLIN with none uses); it now says, on the prime's
// row, that 1 of 2 CLINs carries its own, and the bulk preview says those CLINs keep theirs. The setter is unchanged: a
// bulk set changes the requirements' own combination and no CLIN's (a CONTROL). ITEM 98 -- the PPBE cycles panel no longer
// says a locked cycle "still reads correctly after requirements are renamed, re-banded or removed"; it and Help say what
// the cycle keeps and which lists it still reads as they are now. FAILS ON v1.98 except the CONTROLs.
await (async () => {
  const name = 'v1.99 items 97–98 — the Classify grid says a prime’s CLINs keep their own RCN / EEIC; the cycles panel says what a cycle keeps';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const X = v198Board(`S.rcnAsg={PRIME_P:'K4', R:'K1'}; S.clinRcn={PRIME_P:{n1:'K1'}};`);
    const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    const g = JSON.parse(ev(`(function(){ matOpen=true; matBulkF=''; matBulkV=''; matBody();
      const rows=[].slice.call(document.querySelectorAll('#matBody tr')), own=rows.filter(function(r){ return /PRIME_P|Req PRIME_P/.test(r.textContent); })
        .map(function(r){ const n=r.querySelector('.mat-clinown'); return n? n.textContent : ''; });
      const others=rows.filter(function(r){ return !/PRIME_P/.test(r.textContent); }).map(function(r){ return r.querySelectorAll('.mat-clinown').length; });
      return JSON.stringify({own:own, others:others.reduce(function(a,b){ return a+b; },0)}); })()`) || '{}');
    w5Chk(name, 'item 97 · the Classify grid', 'the prime’s RCN / EEIC cell says 1 of 2 CLINs carries its own', J(g.own), J(['1 of 2 CLINs carries its own']));
    w5Chk(name, 'item 97 · the Classify grid', 'CONTROL — a requirement with no CLINs says nothing of them', J(g.others), J(0));
    const p = JSON.parse(ev(`(function(){ matBulkF='rcnAsg'; matBulkV='K2'; matBody(); const P=matBulkPreview();
      return JSON.stringify([P.clinOwn, (document.querySelector('#matBody .mat-prev .mat-clinown')||{}).textContent||'', (document.querySelector('#matBody .mat-rcnnote')||{}).textContent||'']); })()`) || '[]');
    w5Chk(name, 'item 97 · the bulk preview', 'it counts the prime whose CLINs keep their own, and says so', J([p[0], p[1]]), J([1, '1 prime has CLINs with their own, which keep it']));
    w5Chk(name, 'item 97 · the bulk preview', 'and says what the column sets: the requirement’s own, not a CLIN’s', /not changed here/.test(p[2]) && /default a CLIN with none/.test(p[2]), true);
    const w = ev(`(function(){ window.confirm=function(){ return true; }; matApplyBulk(); return JSON.stringify([S.rcnAsg.PRIME_P, S.rcnAsg.R, S.clinRcn.PRIME_P.n1, rcnOfClinSvc('PRIME_P','n1','USAF'), rcnOfClinSvc('PRIME_P','n2','USAF')]); })()`);
    w5Chk(name, 'item 97 · the setter, unchanged', 'CONTROL — the bulk set writes the requirements’ own (K2); CLIN 0001 keeps K1, and 0002, with none of its own, follows K2',
      w, J(['K2', 'K2', 'K1', 'K1', 'K2']));
    // ITEM 98
    const c = ev(`(function(){ window.confirm=function(){ return true; }; MS.base=MS.cur; blCyc='PB'; blYr=MS.cur; cycLock();
      blOpen=true; blBody(); const h=(document.querySelector('#blBody .cyc-keeps')||{}).textContent||'';
      const T=document.getElementById('helpDoc'), help=((T && T.content && T.content.querySelector('section[data-id="t-fydp"] .cyc-keeps'))||{}).textContent||'';
      return JSON.stringify([h, help, (document.getElementById('blBody')||{}).textContent||'']); })()`);
    let cj; try { cj = JSON.parse(c); } catch { cj = ['', '', c]; }
    w5Chk(name, 'item 98 · the PPBE cycles panel', 'no longer claims the cycle reads correctly after re-banding', /still reads correctly after/.test(cj[2]), false);
    // v2.02 (item 89): a cycle locked from v2.02 keeps the lists v1.99 named as read today; the hint and Help say so, name what
    // an older cycle still reads as it is now, and what every cycle does (changed on purpose: the cycle now keeps them)
    w5Chk(name, 'item 98 · the PPBE cycles panel', 'says what it keeps: the RCN / EEIC list, and from v2.02 every other list it is read through',
      J([/RCN \/ EEIC list/.test(cj[0]), /every other list it is read through/.test(cj[0])]), J([true, true]));
    w5Chk(name, 'item 98 · the PPBE cycles panel', 'names each list kept: destinations, decision bands, the BAE budget list, the PMO list, requirement data, destination rules (v2.19: the funds flow is gone)',
      J(['destination list', 'decision bands', 'BAE budget list', 'PMO list', 'requirement data', 'destination rules'].map(t => cj[0].includes(t))), J([true, true, true, true, true, true]));
    w5Chk(name, 'item 98 · the PPBE cycles panel', 'and what is still read as it is now: an older cycle’s lists, and for every cycle execution data and positions',
      J([/locked before v2.02 kept none of them, and still reads them as they are now/.test(cj[0]), /Execution data/.test(cj[0]), /PPBE positions/.test(cj[0])]), J([true, true, true]));
    w5Chk(name, 'item 98 · Help', 'the five-year plan’s Help says the same', J(['keeps', 'destination list', 'decision bands', 'BAE budget list', 'PMO list', 'destination rules', 'before v2.02'].map(t => cj[1].includes(t))), J([true, true, true, true, true, true, true]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// v2.19 (item 150): removed with its feature -- v2.00 (R1) — execution precedence by appropriation and effective year
// v2.19 (item 150): removed with its feature -- v2.00 (R1) — mixed totals are said with their amounts, and stored rows apart from their effective year
// v2.19 (item 150): removed with its feature -- v2.00 (U1) — a carried row is counted in an offered year and in ALL YEARS
// v2.19 (item 150): removed with its feature -- v2.00 (U14) — ALL YEARS holds every plan the board holds; a saved year selection is kept and said
// v2.19 (item 150): removed with its feature -- v2.00 (U34) — a saved year selection this board did not write is never read as ALL YEARS; it is kept and said
// ==== end v2.00 (U34) ====
// ==== v2.00 (U36): an RCN / EEIC title over 80 characters is refused, never cut ====
// The registry-text review (U35): rcnSet cut a typed title to its first 80 characters without a word -- "kept" text the
// person never saw go -- and the cut counted the two halves an emoji is stored as, so 79 letters and an emoji were kept as
// 79 letters and HALF the emoji, which the workbook then printed as a replacement mark. Item 91 already refuses a code over
// its limit rather than cutting it; the title now gets the same rule: refused, the list keeps what it had, the field keeps
// what was typed, marked, and the status says the title was not changed. The limit is counted by Unicode code point, so an
// emoji stored as two halves counts once (a joined emoji, a flag or a letter with a separate accent mark counts as several).
// Once a value is kept in the list, that refusal leaves the status line, which would otherwise go on saying "not changed"
// of a title just changed; any other message stays.
// THE BOARD: O&M, services USAF / ANG / AFRC, one requirement R1 asking USAF 900, ANG 200, AFRC 0, pots of 5,000 each, so it
// is funded in full; its award is in FYMON[2]. The list holds one combination, K1 = 11111 / AAAAA titled "base", and R1 is on
// it, so RCN-EEIC by Month prints "11111 / AAAAA  base" (two spaces before the title) with USAF 900 and ANG 200 against it.
// Each case types into a field of its own, the list put back to "base" first. Expected values are literals.
// CONTROLS: an 80-letter title is kept, and so are 80 letters typed with spaces around them (the limit is on the title as
// it is kept, trimmed); a padded title is kept trimmed; a title of markup and a leading = is kept and printed in the
// workbook as the very text it is (it never begins a cell there: the codes come first); a title within the limit typed in
// the panel is saved and drawn again, and the field has no maxlength; an empty title is kept empty; two spaces inside a
// title are kept; a message other than the title's refusal stays on the line when a title is kept; and codes typed as
// "=1+1" and "@a1", each a cell of its own in the Spend Plan Source, go out as text: no part of that file holds a formula.
// FAILS ON d66dd60 (U14, the board of 7ee498a), 14 of its 24 checks: every over-80 title was cut to 80, saved, and nothing
// was said, the field was not marked (the panel's own field redrawn), the 80-character emoji title was kept as 79 letters
// and half an emoji, the workbook printed the cut titles, the saved file kept them, a file's 100-letter title was cut
// to 80 by its first edit, and an over-80 title typed in the panel was cut where it should be refused and then corrected.
// The 10 CONTROLS pass there and here.
await (async () => {
  const name = 'v2.00 (U36) — an RCN / EEIC title over 80 characters is refused, never cut';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const X = boot();
    seed(X.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('R1', 'AV', [900, 200, 0])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['R1'] });
    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.awards={R1:{mode:'single', d:FYMON[2][0], day:3}}; MS.rcn=[{k:'K1', rcn:'11111', eeic:'AAAAA', t:'base', svc:['USAF','ANG','AFRC']}];
      S.rcnAsg={R1:'K1'}; applyState(S); save(); 'ok'`);
    // [the title kept, the field marked, the field still holds what was typed, the status line]
    const typed = t => JSON.parse(X.ev(`JSON.stringify((function(){ MS.rcn[0].t='base'; setStat(''); var el=document.createElement('input');
      el.value=${J(t)}; rcnSet(0,'t',el.value,el);
      return [MS.rcn[0].t, el.getAttribute('aria-invalid'), el.value===${J(t)}, document.getElementById('shareStat').textContent]; })())`));
    // the workbook's RCN-EEIC by Month, from its bytes: [row label, TOTAL] for each combination row above the breakout
    const sheet = async (W) => {
      const bk = JSON.parse(await w6Book(W, 'exportExcel')); if (bk.__err) return bk.__err;
      const rc = bk['RCN-EEIC by Month'] || [], iReq = rc.findIndex(r => w6Lbl(r) === 'WHICH REQUIREMENTS SIT UNDER EACH COMBINATION');
      return rc.slice(0, iReq < 0 ? rc.length : iReq).filter(r => /^11111 \/ AAAAA/.test(w6Lbl(r))).map(r => [w6Lbl(r), num(r[14])]);
    };
    const A81 = 'A'.repeat(81), E80 = 'a'.repeat(79) + '\u{1F600}', E81 = 'a'.repeat(80) + '\u{1F600}', B200 = 'B'.repeat(200);
    const no = (shown, n) => '⚠ RCN / EEIC title not changed. The title “' + shown + '…” is ' + n + ' characters; it can be at most 80. Nothing was changed.';
    w5Chk(name, 'title typed as 81 letters', 'refused: the list keeps "base", the field keeps what was typed, marked, and the status says the title was not changed',
      J(typed(A81)), J(['base', 'true', true, no('A'.repeat(60), 81)]));
    w5Chk(name, 'title typed as 200 letters', 'refused, the same: nothing is cut to 80 and kept',
      J(typed(B200)), J(['base', 'true', true, no('B'.repeat(60), 200)]));
    w5Chk(name, 'title typed as 80 letters and an emoji', '81 characters (82 halves): refused, said as 81 characters',
      J(typed(E81)), J(['base', 'true', true, no('a'.repeat(60), 81)]));
    w5Chk(name, 'the workbook after the refusals', 'RCN-EEIC by Month still prints K1 as "11111 / AAAAA  base": USAF 900, ANG 200',
      J(await sheet(X.w)), J([['11111 / AAAAA  base', 900], ['11111 / AAAAA  base', 200]]));
    // A REFUSAL SAVES NOTHING: the board is not marked changed and its save stamp is not moved, so nothing reads as an edit
    const quiet = JSON.parse(X.ev(`JSON.stringify((function(){ MS.rcn[0].t='base'; DIRTY=false; MS.ts=1; var el=document.createElement('input');
      el.value=${J(A81)}; rcnSet(0,'t',el.value,el); return [MS.rcn[0].t, DIRTY, MS.ts]; })())`));
    w5Chk(name, 'a refused title saves nothing', '81 letters typed: the list keeps "base", the board is not marked changed, its save stamp stays 1',
      J(quiet), J(['base', false, 1]));
    w5Chk(name, 'title typed as 79 letters and an emoji', '80 characters: kept whole, the emoji too (no half of one), the field not marked, nothing said',
      J(typed(E80)), J([E80, null, true, '']));
    w5Chk(name, 'the workbook with that title', 'RCN-EEIC by Month prints it whole, emoji and all: USAF 900, ANG 200',
      J(await sheet(X.w)), J([['11111 / AAAAA  ' + E80, 900], ['11111 / AAAAA  ' + E80, 200]]));
    const R = boot({ html: X.ev('buildSavedHtml()') });
    w5Chk(name, 'saved and reopened', 'the file keeps the title whole, emoji and all',
      J(JSON.parse(R.ev(`JSON.stringify(rcnReg().map(function(e){ return [e.k, e.t]; }))`))), J([['K1', E80]]));
    // THE PANEL'S OWN FIELD: Setup's RCN / EEIC list, its title field changed the way a person changes it
    const pf = JSON.parse(X.ev(`JSON.stringify((function(){ MS.rcn[0].t='base'; save(); rcnOpen=true; render();
      var el=document.querySelector('#rcnBody input[placeholder="what this line funds"]'); if(!el) return 'no title field';
      el.value=${J(A81)}; el.dispatchEvent(new Event('change'));
      var r=[MS.rcn[0].t, el.getAttribute('aria-invalid'), el.value===${J(A81)}, el.isConnected]; rcnOpen=false; render(); return r; })())`));
    w5Chk(name, 'the title field in the RCN / EEIC panel', '81 letters typed there: refused, and that same field stays on screen holding them, marked',
      J(pf), J(['base', 'true', true, true]));
    // THE LIMIT IS ON THE TITLE AS IT IS KEPT, trimmed, and the refusal quotes it so
    w5Chk(name, 'title typed as 81 letters with spaces before them', 'refused, said as 81 characters, the status quoting the title trimmed, as it would be kept',
      J(typed('   ' + 'A'.repeat(81))), J(['base', 'true', true, no('A'.repeat(60), 81)]));
    // A TITLE THAT ARRIVED IN A FILE OVER 80 (kept whole on opening, U38) is shown whole in the panel, and retyping it there is
    // held to the same limit: refused, the file's title kept. Before, any edit of it cut it to 80, and the next save kept the cut.
    const L100 = 'L'.repeat(100), M100 = 'M'.repeat(100);
    const FF = boot({ html: X.ev(`(function(){ MS.rcn[0].t=${J(L100)}; var h=buildSavedHtml(); MS.rcn[0].t='base'; return h; })()`) });
    const ff = JSON.parse(FF.ev(`JSON.stringify((function(){ setStat(''); rcnOpen=true; render();
      var el=document.querySelector('#rcnBody input[placeholder="what this line funds"]'); if(!el) return 'no title field';
      var shown=el.value; el.value=${J(M100)}; el.dispatchEvent(new Event('change'));
      var r=[shown===${J(L100)}, rcnReg()[0].t===${J(L100)}, el.getAttribute('aria-invalid'), document.getElementById('shareStat').textContent];
      rcnOpen=false; render(); return r; })())`));
    w5Chk(name, 'a 100-letter title from a file, retyped in the panel', 'the field shows all 100; 100 other letters typed there are refused, said as 100 characters, and the file\'s title is kept',
      J(ff), J([true, true, 'true', no('M'.repeat(60), 100)]));
    w5Chk(name, 'that file saved and reopened', 'its title is still the 100 letters it arrived with',
      J(JSON.parse(boot({ html: FF.ev('buildSavedHtml()') }).ev(`JSON.stringify(rcnReg().map(function(e){ return [e.k, e.t]; }))`))), J([['K1', L100]]));
    // THE COUNT IS BY CODE POINT, as the release notes say: a letter written with a separate accent mark counts as two
    w5Chk(name, 'title typed as 41 letters, each with a separate accent mark', '82 code points: refused, said as 82 characters (a reader sees 41)',
      J(typed('e\u0301'.repeat(41))), J(['base', 'true', true, no('e\u0301'.repeat(30), 82)]));
    // A REFUSAL IS NOT LEFT STANDING once the title is corrected where it is: refused in the panel's own field, then corrected
    // there. The corrected title is kept and drawn again, unmarked, and the status line no longer says the title was not changed.
    const fx = JSON.parse(X.ev(`JSON.stringify((function(){ MS.rcn[0].t='base'; save(); setStat(''); rcnOpen=true; render();
      var el=document.querySelector('#rcnBody input[placeholder="what this line funds"]'); if(!el) return 'no title field';
      el.value=${J(A81)}; el.dispatchEvent(new Event('change')); var said=document.getElementById('shareStat').textContent;
      el.value='good title'; el.dispatchEvent(new Event('change'));
      var el2=document.querySelector('#rcnBody input[placeholder="what this line funds"]');
      var r=[said, MS.rcn[0].t, el2? el2.value : null, el2? el2.getAttribute('aria-invalid') : 'no field', document.getElementById('shareStat').textContent];
      rcnOpen=false; render(); return r; })())`));
    w5Chk(name, 'a refused title corrected in its field', '81 letters refused there, then "good title" typed in the same field: kept, drawn again unmarked, and the refusal is gone from the status line',
      J(fx), J([no('A'.repeat(60), 81), 'good title', 'good title', null, '']));
    // CONTROLS
    w5Chk(name, 'title typed as 80 letters with spaces around them', 'CONTROL — 80 once trimmed: kept as the 80 letters, the field not marked, nothing said',
      J(typed('  ' + 'y'.repeat(80) + '  ')), J(['y'.repeat(80), null, true, '']));
    w5Chk(name, 'title typed as 80 letters', 'CONTROL — kept exactly, the field not marked, nothing said',
      J(typed('x'.repeat(80))), J(['x'.repeat(80), null, true, '']));
    w5Chk(name, 'title typed as "  padded title  "', 'CONTROL — kept trimmed, as before',
      J(typed('  padded title  ')), J(['padded title', null, true, '']));
    const F = '=HYPERLINK("http://example.invalid","x") <b>&amp;';
    w5Chk(name, 'title typed as markup and a leading =', 'CONTROL — kept exactly as typed, the field not marked, nothing said',
      J(typed(F)), J([F, null, true, '']));
    w5Chk(name, 'the workbook with that title', 'CONTROL — RCN-EEIC by Month prints it as the very text it is: USAF 900, ANG 200',
      J(await sheet(X.w)), J([['11111 / AAAAA  ' + F, 900], ['11111 / AAAAA  ' + F, 200]]));
    // A TITLE WITHIN THE LIMIT, typed in the panel's own field, is saved and drawn: the board is marked changed, its save stamp
    // moves, and the panel is drawn again holding the new title. The field has no maxlength (a browser would cut a paste there).
    const kp = JSON.parse(X.ev(`JSON.stringify((function(){ MS.rcn[0].t='base'; save(); rcnOpen=true; render();
      var el=document.querySelector('#rcnBody input[placeholder="what this line funds"]'); if(!el) return 'no title field';
      var ml=el.hasAttribute('maxlength'); DIRTY=false; MS.ts=1; el.value='kept title'; el.dispatchEvent(new Event('change'));
      var el2=document.querySelector('#rcnBody input[placeholder="what this line funds"]');
      var r=[MS.rcn[0].t, DIRTY, MS.ts>1, el.isConnected, el2? el2.value : null, ml]; rcnOpen=false; render(); return r; })())`));
    w5Chk(name, 'a title within the limit, typed in the panel', 'CONTROL — kept, saved (the board marked changed, its save stamp moved) and drawn again; the field has no maxlength',
      J(kp), J(['kept title', true, true, false, 'kept title', false]));
    w5Chk(name, 'title cleared', 'CONTROL — an empty title is kept empty, nothing said',
      J(typed('')), J(['', null, true, '']));
    w5Chk(name, 'title typed with two spaces inside it', 'CONTROL — kept exactly as typed, the two spaces too',
      J(typed('two  spaces')), J(['two  spaces', null, true, '']));
    // ONLY THE TITLE'S OWN REFUSAL LEAVES THE LINE: any other message stays when a title is kept
    const om = JSON.parse(X.ev(`JSON.stringify((function(){ MS.rcn[0].t='base'; setStat('✓ Saved to the shared folder automatically — 9:05 AM.');
      var el=document.createElement('input'); el.value='other title'; rcnSet(0,'t',el.value,el);
      return [MS.rcn[0].t, document.getElementById('shareStat').textContent]; })())`));
    w5Chk(name, 'a title kept under another message', 'CONTROL — kept, and a message that is not the title\'s refusal stays on the line',
      J(om), J(['other title', '✓ Saved to the shared folder automatically — 9:05 AM.']));
    // A CELL THAT BEGINS WITH = OR @ GOES OUT AS TEXT, never a formula. A title never begins a cell (RCN-EEIC by Month puts the
    // codes first), so the codes are used: an RCN typed as "=1+1" and an EEIC typed as "@a1" are kept (code text is warned
    // about, never blocked), and each is a cell of its own in the Spend Plan Source. Every part of that file is read from its
    // bytes: [formula elements, compressed parts (which could hide one), the cells that are exactly the two codes].
    const fm = JSON.parse(X.ev(`JSON.stringify((function(){ MS.rcn[0].t='base'; setStat(''); var el=document.createElement('input');
      rcnSet(0,'rcn','=1+1',el); rcnSet(0,'eeic','@a1',el); return [MS.rcn[0].rcn, MS.rcn[0].eeic, el.getAttribute('aria-invalid')]; })())`));
    const sp = JSON.parse(await X.w.eval(`(async function(){
      var cap=null,_B=window.Blob; window.alert=function(){}; window.confirm=function(){ return true; };
      window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
      try{ exportSrc(); }catch(e){ window.Blob=_B; return JSON.stringify('threw '+String((e&&e.message)||e)); }
      window.Blob=_B; if(!cap) return JSON.stringify('no file');
      var u=cap instanceof Uint8Array? cap : new Uint8Array(cap.buffer||cap), i=0, dec=new TextDecoder('utf-8'), f=0, packed=0, cells=[];
      while(i+30<=u.length && u[i]===0x50 && u[i+1]===0x4b && u[i+2]===0x03 && u[i+3]===0x04){
        var m=u[i+8]|(u[i+9]<<8), csz=(u[i+18]|(u[i+19]<<8)|(u[i+20]<<16)|(u[i+21]<<24))>>>0, nl=u[i+26]|(u[i+27]<<8), xl=u[i+28]|(u[i+29]<<8);
        if(m) packed++; f+=(dec.decode(u.subarray(i+30+nl+xl, i+30+nl+xl+csz)).match(/<f[ >]/g)||[]).length; i+=30+nl+xl+csz; }
      var rd=await xlsxRead(u.buffer.slice(u.byteOffset,u.byteOffset+u.byteLength));
      Object.keys(rd).forEach(function(sn){ (rd[sn]||[]).forEach(function(r){ (r||[]).forEach(function(c){ if((c==='=1+1'||c==='@A1') && cells.indexOf(c)<0) cells.push(c); }); }); });
      return JSON.stringify([f, packed, cells.sort()]); })()`));
    w5Chk(name, 'codes typed as "=1+1" and "@a1", in the Spend Plan Source', 'CONTROL — kept as =1+1 and @A1; the file holds no formula, and each is a cell of exactly that text',
      J([fm, sp]), J([['=1+1', '@A1', null], [0, 0, ['=1+1', '@A1']]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.00 (U36) ====
// ==== v2.00 (U41): an SI code a file carried that is not one of the five is kept, listed and never guessed ====
// applyState deleted any S.si value outside LA/EN/OT/FL/AT, so a year's file holding one opened without it and saved
// without it, with nothing said, and the requirement fell back to its derived code (siOf -> siDefault): an LM prime's
// money moved to LA in the Special Interest overview, the workbook's SI tab and the CR cash return.
// THE FILE: O&M, services STOVL / USMC-C / USN, every ask funded (pots $5,000,000 each), every award in November.
//   R1 AV, an LM prime (derived LA), si 'at'   [0, 200,000, 900,000]     R2 AV si 'EN' [0, 100,000, 300,000]
//   R3 AV si 'LA' [0, 0, 50,000]   R4 'OT' [0, 0, 60,000]   R5 'FL' [0, 0, 70,000]   R6 'AT' [0, 0, 80,000]
//   R7 AV si '' (none, by hand) [0, 90,000, 0]   R8 PP, no si (derived EN) [0, 0, 40,000]   R9 AV si 'ZZ' [0, 0, 20,000]
//   USMC CV 200 + 100 + 90 = 390 thousand; USN 900 + 300 + 50 + 60 + 70 + 80 + 40 + 20 = 1,520 thousand; 1,910 in all.
// KEPT: both codes stay exactly as saved, opened and after a save and reopen; neither is the derived code.
// COUNTED: R1's and R9's money is under no recognized code, never LA: USMC CV 200 + 90 (R7) = 290, USN 900 + 20 = 920,
//   1,210 = 63.4% of 1,910; LA is R3's 50 alone (2.6%); EN 100 + 340 = 440 (23.0%), OT 60 (3.1%), FL 70 (3.7%), AT 80 (4.2%).
//   Of the 1,210, 1,120 is R1's and R9's and 90 is R7's, and the overview says so. The workbook's row and the overview's
//   row say "no recognized" code. The CR cash return prints both SI cells blank and says 1 with no SI code and 2 with a
//   code that is not one of the five.
// SAID AND CHOSEN AGAIN: Needs attention (its entry on the strip, its list) and Pre-flight name both, as saved; Go to it
//   opens the RECORD panel at the Navy SI code, which shows "at" selected; a bulk write counts it as an answer it would
//   overwrite (blank 1, same 1, differ 7 for AT on all nine). Choosing AT for R1 and none for R9 in the field: saved and
//   reopened, the list is empty, R1's money is under AT (USN 80 + 900 = 980, USMC CV 200), the rows say "no SI code set"
//   again, and the journal holds R1's change from "at" to AT.
// OTHER VALUES: 'LA ', 'la', '__proto__', 7, {"x":1} and null are each kept as saved and listed, none read as a code, and the
//   CR cash return counts all six apart: "6 with an SI code from a file that is not one of ..." -- no "no SI code", no "too".
// FULL FUND: SI codes are an O&M classification -- the value is kept, nothing lists it.
// A USAF/ANG/AFRC requirement holding such a code (no Navy or Marine money) still has the field, and choosing AT there
//   saves and reopens; an unrelated blank one gains no field.
// A LOCKED CYCLE holding R1 'at': in its view the code is kept and listed; choosing AT there is refused, the code stays,
//   and the status line says R1 keeps SI "at" (never "has no SI code"); left, the working plan still holds it.
// FAILS ON 7ee498a: the codes are gone (opened and reopened), R1 reads LA and its 1,100 thousand is under LA (1,150), no
// list, no Pre-flight row, no field value, the bulk question counts R1 as LA and R9 as blank, the journal never had "at",
// the other values are gone, Full Fund drops it, the non-Navy requirement has no field, the view drops it and its status
// line names LA. Passing there too: the controls (the five codes, blank, derived EN, ownership, the CR total, Full Fund's
// EN, the blank USAF requirement, the locked cycle's own copy).
await (async () => {
  const name = 'v2.00 (U41) — an SI code a file carried that is not one of the five is kept, listed, counted under no recognized code and chosen again in its field';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  const keepBoards = () => [];
  try {
    const J = JSON.stringify, K = 1000;
    const cell = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c;
    // an export read back from its bytes, with the status line it left
    const book = async (B, fn) => JSON.parse(await B.w.eval(`(async function(){ var cap=null, _B=window.Blob;
      window.alert=function(){}; window.confirm=function(){ return true; };
      window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
      try{ ${fn}(); }catch(e){ window.Blob=_B; return JSON.stringify({err:'threw '+String((e&&e.message)||e)}); }
      window.Blob=_B; if(!cap) return JSON.stringify({err:'no file'});
      return JSON.stringify({book:await xlsxRead(cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength)),
        stat:document.getElementById('shareStat').textContent}); })()`));
    const siTab = async B => { const b = await book(B, 'exportExcel');
      return (((b.book || {})['SI Codes by Month']) || []).filter(r => r && typeof cell(r[14]) === 'number').map(r => [cell(r[0]), cell(r[14])]); };
    const field = B => B.w.document.querySelector('#erSi');
    // v2.08 (item 122): the code is chosen in the edit box and written on its Save
    const choose = (B, id, v) => { B.ev(`openEdit(${J(id)},'si'); 'ok'`); const f = field(B);
      if (f) { f.value = v; f.dispatchEvent(new B.w.Event('change', { bubbles: true })); B.ev(`erSave(); 'ok'`); } return !!f; };
    const X = boot();
    seed(X.ev, { services: ['STOVL', 'USMC-C', 'USN'], items: [
      it('R1', 'AV', [0, 200 * K, 900 * K]), it('R2', 'AV', [0, 100 * K, 300 * K]), it('R3', 'AV', [0, 0, 50 * K]),
      it('R4', 'AV', [0, 0, 60 * K]), it('R5', 'AV', [0, 0, 70 * K]), it('R6', 'AV', [0, 0, 80 * K]),
      it('R7', 'AV', [0, 90 * K, 0]), it('R8', 'PP', [0, 0, 40 * K]), it('R9', 'AV', [0, 0, 20 * K])],
      disc: [5000 * K, 5000 * K, 5000 * K], mand: [0, 0, 0], order: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9'] });
    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      flowCfg().rules.lm='Req R1'; S.ptype={R1:'PRIME'};
      S.order.forEach(function(id){ S.awards[id]={mode:'single', d:FYMON[1][0], day:5}; });
      applyState(S); save(); 'ok'`);
    // the file carries the map as written; nothing on this board runs applyState over it before it is saved
    X.ev(`S.si={R1:'at',R2:'EN',R3:'LA',R4:'OT',R5:'FL',R6:'AT',R7:'',R9:'ZZ'}; MS.years[MS.cur]=S; 'ok'`);
    const html = X.ev('buildSavedHtml()');
    const R = boot({ html }), Q = boot({ html: R.ev('buildSavedHtml()') });
    const L1 = 'SI “at” is not one of LA, EN, OT, FL or AT', L9 = 'SI “ZZ” is not one of LA, EN, OT, FL or AT';
    for (const [where, B] of [['opened', R], ['saved and reopened', Q]]) {
      w5Chk(name, where, 'both codes are kept exactly as saved, beside the five and the blank',
        B.ev('JSON.stringify(S.si)'), J({ R1: 'at', R2: 'EN', R3: 'LA', R4: 'OT', R5: 'FL', R6: 'AT', R7: '', R9: 'ZZ' }));
      w5Chk(name, where, 'R1, whose derived code is LA, has no code: never LA, never AT',
        B.ev(`JSON.stringify([siOf(itemById('R1')), siOf(itemById('R9'))])`), J(['', '']));
      w5Chk(name, where, 'CONTROL — R2-R6 read as set, R7 none by hand, R8 its derived EN',
        B.ev(`JSON.stringify(['R2','R3','R4','R5','R6','R7','R8'].map(function(id){ return siOf(itemById(id)); }))`),
        J(['EN', 'LA', 'OT', 'FL', 'AT', '', 'EN']));
      w5Chk(name, where, 'CONTROL — R1 keeps its office and its money: AV, disc [0, 200,000, 900,000], mand 0',
        B.ev(`JSON.stringify((function(){ var p=tiers().R1; return [grpOf(itemById('R1')), p.d, p.m]; })())`), J(['AV', [0, 200 * K, 900 * K], [0, 0, 0]]));
      B.ev(`render(); 'ok'`);
      w5Chk(name, where, 'Needs attention: an entry on the strip, and a list naming each as saved',
        J([B.ev(`(function(){ var b=document.querySelector('button.e[onclick=\\'attShow("si")\\']'); return b? b.textContent : 'NO ENTRY'; })()`),
           JSON.parse(B.ev(`JSON.stringify((attLists().si||[]).map(function(r){ return [r.id, r.n]; }))`))]),
        J(['🏷 2 SI codes to repair', [['R1', [L1]], ['R9', [L9]]]]));
      w5Chk(name, where, 'Pre-flight lists both, to fix, with the same words',
        B.ev(`JSON.stringify(preflight().find.filter(function(f){ return f.k==='si'; }).map(function(f){ return [f.sev, f.t, f.rows.map(function(r){ return [r.id, r.label, r.sub]; })]; }))`),
        J([['fix', 'SI codes the board does not recognize', [['R1', 'Ev R1', L1], ['R9', 'Ev R9', L9]]]]));
      B.ev(`attShow('si'); 'ok'`);
      w5Chk(name, where, 'the list as shown: its title, and each row with its rank, office and the code as saved',
        B.ev(`JSON.stringify([document.getElementById('attTitle').textContent, Array.from(document.querySelectorAll('#attBody tr')).slice(1,3).map(function(r){ return Array.from(r.cells).slice(0,4).map(function(c){ return c.textContent; }); })])`),
        J(['🏷 SI CODES TO REPAIR', [['1', 'Ev R1', 'AV', L1], ['9', 'Ev R9', 'AV', L9]]]));
      B.ev(`attGo('si','R1'); 'ok'`);
      w5Chk(name, where, 'Go to it opens the RECORD panel at the Navy SI code, which shows "at" selected and has the keyboard',
        B.ev(`JSON.stringify([erOpen, (function(){ var s=document.querySelector('#erSi'); return s? [s.value, s.options[s.selectedIndex].text, Array.from(s.options).map(function(o){ return o.value; }), document.activeElement===s] : 'NO FIELD'; })()])`),
        J(['R1', ['at', '“at” — not one of the five, kept as saved', ['', 'at', 'LA', 'EN', 'OT', 'FL', 'AT'], true]]));
      B.ev(`erClose(); render(); 'ok'`);
      w5Chk(name, where, 'a bulk write of AT on all nine counts R1 and R9 as answers it would overwrite: blank 1, same 1, differ 7',
        B.ev(`(function(){ matBulkF='si'; matBulkV='AT'; matPmo='ALL'; matMissing=''; var P=matBulkPreview(); return JSON.stringify([P.n, P.blank, P.same, P.differ]); })()`),
        J([9, 1, 1, 7]));
      B.ev(`siShown=true; siOpen=true; siMatrix(); 'ok'`);
      w5Chk(name, where, 'the Special Interest overview: LA is R3’s $50,000 alone; R1’s and R9’s money is in the no recognized code row, 63.4%',
        B.ev(`JSON.stringify(Array.from(document.querySelectorAll('#siBody tr')).slice(1).map(function(r){ return Array.from(r.cells).map(function(c){ return c.textContent; }).join(' | '); }))`),
        J(['LA Airframe | — | — | $50,000 | $50,000 | 2.6%', 'EN Engine | — | $100,000 | $340,000 | $440,000 | 23.0%',
          'OT Other Government Costs | — | — | $60,000 | $60,000 | 3.1%', 'FL Fuel | — | — | $70,000 | $70,000 | 3.7%',
          'AT Audit | — | — | $80,000 | $80,000 | 4.2%', '— no recognized code — | — | $290,000 | $920,000 | $1,210,000 | 63.4%',
          'TOTAL | $0 | $390,000 | $1,520,000 | $1,910,000 | ']));
      // v2.09 W4: the note sends the reader to the edit box (item 128): the row's ⋯ menu has had no SI entry since v2.08
      w5Chk(name, where, 'the overview’s note says how much of that row is under a code the board does not recognize, and how much has none',
        // v2.18 (item 149.17): the message says where Needs attention is
        J(['$1,210,000 carries no recognized code: $1,120,000 of it is on 2 requirements whose SI code from a file is not one of LA, EN, OT, FL or AT (kept as saved, listed in Needs attention, on the Funding page) and $90,000 carries no code yet — set one in a requirement’s 📋 Requirement edit, at its Navy SI code.',
           '1 of 6 coded requirements take a derived code'].map(s => B.ev(`(document.querySelector('#siBody .hint')||{}).textContent||''`).includes(s))),
        J([true, true]));
      w5Chk(name, where, 'the workbook’s SI Codes by Month tab, from its bytes: LA only $50,000 on USN, the rest of R1’s and R9’s money in the no recognized SI code rows',
        J(await siTab(B)),
        J([['STOVL TOTAL', 0], ['EN  Engine', 100 * K], ['— no recognized SI code —', 290 * K], ['USMC CV TOTAL', 390 * K],
          ['LA  Airframe', 50 * K], ['EN  Engine', 340 * K], ['OT  Other Government Costs', 60 * K], ['FL  Fuel', 70 * K], ['AT  Audit', 80 * K],
          ['— no recognized SI code —', 920 * K], ['USN TOTAL', 1520 * K], ['ALL SERVICES — TOTAL BY MONTH', 1910 * K]]));
      const cr = await book(B, 'crExport'), crRows = (((cr.book || {})['O&M,N']) || []);
      w5Chk(name, where, 'the CR cash return prints R1’s and R9’s SI code blank, never LA',
        J(crRows.filter(r => /^Ev R\d$/.test(String(cell((r || [])[0])))).map(r => [cell(r[0]), cell(r[4])])),
        J([['Ev R1', ''], ['Ev R2', 'EN'], ['Ev R3', 'LA'], ['Ev R4', 'OT'], ['Ev R5', 'FL'], ['Ev R6', 'AT'], ['Ev R7', ''], ['Ev R8', 'EN'], ['Ev R9', '']]));
      w5Chk(name, where, 'its status line counts R7 as no SI code and R1, R9 apart, as codes that are not one of the five',
        String(cr.stat || cr.err).replace(/^.*Oct–Mar\./, ''),
        // v2.09 W4: the status line names the edit box (item 128), where the code has been set since v2.08
        ' 1 with no SI code — those cells are blank; set them in each requirement’s 📋 Requirement edit, at its Navy SI code. 2 with an SI code from a file that is not one of LA, EN, OT, FL or AT (kept as saved, listed in Needs attention, on the Funding page) — their cells are blank too.');
      w5Chk(name, where, 'CONTROL — the CR cash return’s TOTAL row still adds to 1,910 ($K)',
        J(crRows.filter(r => cell((r || [])[0]) === 'TOTAL').map(r => r.slice(7).map(cell).reduce((a, v) => a + (typeof v === 'number' ? v : 0), 0))), J([1910]));
    }
    // CHOSEN AGAIN in the field: AT for R1, none for R9; saved and reopened
    const C = boot({ html });
    const picked = [choose(C, 'R1', 'AT'), choose(C, 'R9', '')];
    const C2 = boot({ html: C.ev('buildSavedHtml()') });
    w5Chk(name, 'chosen in the field, saved and reopened', 'CONTROL — R1 is AT, R9’s code is gone by choice, the list and the Pre-flight row are empty',
      J([picked, JSON.parse(C2.ev(`JSON.stringify([Object.keys(S.si).sort().map(function(k){ return [k, S.si[k]]; }), (attLists().si||[]).length, preflight().find.filter(function(f){ return f.k==='si'; }).length])`))]),
      J([[true, true], [[['R1', 'AT'], ['R2', 'EN'], ['R3', 'LA'], ['R4', 'OT'], ['R5', 'FL'], ['R6', 'AT'], ['R7', '']], 0, 0]]));
    w5Chk(name, 'chosen in the field, saved and reopened', 'the journal holds R1’s change from the code as saved, so it can be put back',
      C2.ev(`JSON.stringify((MS.jrnl||[]).filter(function(e){ return e.p && e.p[0]==='si' && e.p[1]==='R1'; }).map(function(e){ return [e.a, e.b]; }).slice(-1))`),
      J([['at', 'AT']]));
    w5Chk(name, 'chosen in the field, saved and reopened', 'CONTROL — the workbook: R1’s money under AT (USMC CV 200,000, USN 80,000 + 900,000), the rows say no SI code set again',
      J(await siTab(C2)),
      J([['STOVL TOTAL', 0], ['EN  Engine', 100 * K], ['AT  Audit', 200 * K], ['— no SI code set —', 90 * K], ['USMC CV TOTAL', 390 * K],
        ['LA  Airframe', 50 * K], ['EN  Engine', 340 * K], ['OT  Other Government Costs', 60 * K], ['FL  Fuel', 70 * K], ['AT  Audit', 980 * K],
        ['— no SI code set —', 20 * K], ['USN TOTAL', 1520 * K], ['ALL SERVICES — TOTAL BY MONTH', 1910 * K]]));
    // OTHER VALUES a file can hold, each kept and listed, none read as a code
    const V = boot();
    seed(V.ev, { services: ['USN'], items: [it('V1', 'AV', [10 * K]), it('V2', 'AV', [10 * K]), it('V3', 'AV', [10 * K]), it('V4', 'AV', [10 * K]),
      it('V5', 'AV', [10 * K]), it('V6', 'AV', [10 * K])], disc: [500 * K], mand: [0], order: ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'] });
    V.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.order.forEach(function(id){ S.awards[id]={mode:'single', d:FYMON[1][0], day:5}; }); applyState(S); save();
      S.si={V1:'LA ', V2:'la', V3:'__proto__', V4:7, V5:{x:1}, V6:null}; MS.years[MS.cur]=S; 'ok'`);
    const VR = boot({ html: V.ev('buildSavedHtml()') });
    w5Chk(name, 'other values', '"LA ", "la", "__proto__", 7, {"x":1} and null are kept as saved, none read as a code, each listed',
      VR.ev(`JSON.stringify([S.si, S.order.map(function(id){ return siOf(itemById(id)); }), (attLists().si||[]).map(function(r){ return r.n[0]; })])`),
      J([{ V1: 'LA ', V2: 'la', V3: '__proto__', V4: 7, V5: { x: 1 }, V6: null }, ['', '', '', '', '', ''],
        ['SI “LA ” is not one of LA, EN, OT, FL or AT', 'SI “la” is not one of LA, EN, OT, FL or AT', 'SI “__proto__” is not one of LA, EN, OT, FL or AT',
         'SI “7” is not one of LA, EN, OT, FL or AT', 'SI “{"x":1}” is not one of LA, EN, OT, FL or AT', 'SI “null” is not one of LA, EN, OT, FL or AT']]));
    const vcr = await book(VR, 'crExport');
    w5Chk(name, 'other values', 'the CR cash return counts all six as codes that are not one of the five: blank cells, none of them "no SI code", and never "Every row carries an SI code"',
      String(vcr.stat || vcr.err).replace(/^.*Oct–Mar\./, ''),
      ' 6 with an SI code from a file that is not one of LA, EN, OT, FL or AT (kept as saved, listed in Needs attention, on the Funding page) — their cells are blank.');
    // FULL FUND: nothing reads an SI code there; the value is kept and nothing lists it
    const F = boot({ appn: 'FULL FUND' });
    seed(F.ev, { services: ['STOVL', 'USMC-C', 'USN'], items: [it('R1', 'AV', [0, 200 * K, 900 * K]), it('R2', 'AV', [0, 100 * K, 300 * K])],
      disc: [5000 * K, 5000 * K, 5000 * K], mand: [0, 0, 0], order: ['R1', 'R2'] });
    F.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save();
      S.si={R1:'at', R2:'EN'}; MS.years[MS.cur]=S; 'ok'`);
    const FR = boot({ html: F.ev('buildSavedHtml()'), appn: 'FULL FUND' }), FQ = boot({ html: FR.ev('buildSavedHtml()'), appn: 'FULL FUND' });
    w5Chk(name, 'Full Fund', 'the code is kept, opened and after a save and reopen, and nothing lists it (SI codes are an O&M classification)',
      J([JSON.parse(FR.ev(`JSON.stringify([mySlug(), S.si, (attLists().si||[]).length, preflight().find.filter(function(f){ return f.k==='si'; }).length])`)),
         JSON.parse(FQ.ev('JSON.stringify(S.si)'))]),
      J([['ff', { R1: 'at', R2: 'EN' }, 0, 0], { R1: 'at', R2: 'EN' }]));
    // A REQUIREMENT WITH NO NAVY OR MARINE MONEY still has the field
    const N = boot();
    seed(N.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('R1', 'AV', [900 * K, 200 * K, 0]), it('R2', 'AV', [300 * K, 0, 0])],
      disc: [5000 * K, 5000 * K, 5000 * K], mand: [0, 0, 0], order: ['R1', 'R2'] });
    N.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save();
      S.si={R1:'at'}; MS.years[MS.cur]=S; 'ok'`);
    const NR = boot({ html: N.ev('buildSavedHtml()') });
    NR.ev(`openEdit('R1','si'); 'ok'`);
    w5Chk(name, 'no Navy or Marine money', 'R1 (USAF/ANG only) has the Navy SI code field, showing "at"; CONTROL — blank R2 gains none',
      J([field(NR) ? field(NR).value : 'NO FIELD', NR.ev(`siEligible(itemById('R2'))`)]), J(['at', false]));
    const picked2 = choose(NR, 'R1', 'AT');
    const NQ = boot({ html: NR.ev('buildSavedHtml()') });
    w5Chk(name, 'no Navy or Marine money', 'AT chosen there saves and reopens, the list is empty, and R1 keeps its office and money',
      J([picked2, JSON.parse(NQ.ev(`JSON.stringify([S.si, (attLists().si||[]).length, (function(){ var p=tiers().R1; return [grpOf(itemById('R1')), p.d, p.m]; })()])`))]),
      J([true, [{ R1: 'AT' }, 0, ['AV', [900 * K, 200 * K, 0], [0, 0, 0]]]]));
    // A LOCKED CYCLE whose plan holds R1 'at' (the cycle is in the file): put on screen, a choice is refused there
    const Lk = boot();
    seed(Lk.ev, { services: ['STOVL', 'USMC-C', 'USN'], items: [it('R1', 'AV', [0, 200 * K, 900 * K]), it('R2', 'AV', [0, 100 * K, 300 * K])],
      disc: [5000 * K, 5000 * K, 5000 * K], mand: [0, 0, 0], order: ['R1', 'R2'] });
    Lk.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      flowCfg().rules.lm='Req R1'; S.ptype={R1:'PRIME'}; applyState(S); save(); S.si={R1:'at', R2:'EN'}; MS.years[MS.cur]=S;
      blStore()['PB|2027']={ts:1700000000000, locked:true, by:'suite', base:MS.base, years:JSON.parse(JSON.stringify(MS.years))}; 'ok'`);
    const LR = boot({ html: Lk.ev('buildSavedHtml()') });
    LR.ev(`cycView('PB|2027'); 'ok'`);
    w5Chk(name, 'locked cycle view', 'the view holds R1’s code as saved, reads it as no code (never LA) and lists it',
      LR.ev(`JSON.stringify([CYCVIEW, S.si, siOf(itemById('R1')), (attLists().si||[]).map(function(r){ return r.id; })])`),
      J(['PB|2027', { R1: 'at', R2: 'EN' }, '', ['R1']]));
    const pickedL = choose(LR, 'R1', 'AT');
    // v2.08 (item 122): the record is edited in the edit box, which does not open on a locked view (cycBlock) -- the code
    // stays as saved and the status line says why, where the RECORD panel's select once took the choice and save() refused it
    w5Chk(name, 'locked cycle view', 'AT cannot be chosen there: the edit box does not open, the code stays as saved, and the status line says why',
      J([pickedL, JSON.parse(LR.ev('JSON.stringify(S.si)')),
         /^🔒 Editing a requirement’s record is off while PB27 is on screen/.test(LR.ev(`(document.getElementById('shareStat')||{}).textContent||''`))]),
      J([false, { R1: 'at', R2: 'EN' }, true]));
    LR.ev(`cycLeave(true); 'ok'`);
    w5Chk(name, 'locked cycle view', 'left, the working plan still holds R1’s code as saved',
      LR.ev(`JSON.stringify([CYCVIEW, S.si])`), J(['', { R1: 'at', R2: 'EN' }]));
    w5Chk(name, 'locked cycle view', 'CONTROL — the locked cycle’s own copy of the plan still holds both codes',
      LR.ev(`JSON.stringify((function(){ var c=blGet('PB|2027'); return c.years[Object.keys(c.years)[0]].si; })())`), J({ R1: 'at', R2: 'EN' }));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (U41) ====
// ==== v2.00 (U56/U57): a saved SI value that is not text is an answer a bulk write overwrites, and its field opens ====
// Codex's batch C5 (18 Oct), for its C1b findings C3-1 and C3-2. U41 keeps a saved SI value that is not one of the five as
// saved. The bulk write's question (matBulk's getter) and the Navy SI code field's "kept as saved" choice (recFields) put
// it through String(): a saved [] or [null] read as no answer yet and ["AT"] as already AT, and {"toString":null}, which
// is valid JSON, could not be turned into text at all, so the question and Go to it threw.
// THE FILE: O&M, services USAF / STOVL / USMC-C / USN, every ask funded, every award in November.
//   A, an LM prime, holds the value: [101, 0, 203, 307]   B si '' (none, by hand) [0, 0, 409, 503]   C si 'EN' [0, 0, 0, 601]
// OVERWRITTEN: for [], ["AT"] and [null], AT on all three asks [n, blank, same, differ] = [3, 1, 0, 2], and the line after
//   the approved write says 2 were overwritten. The file keeps the value exactly and A reads no code; after the write, saved
//   and reopened, all three are AT and every service keeps its dollars.
// {"toString":null}: the question runs ([3, 1, 0, 2]); Go to it opens A's field, showing “{"toString":null}” kept as
//   saved; the value survives a save and reopen, A reads no code and its $611 stays funded.
// CONTROLS also: A 'AT' with C 'other' asks [3, 1, 1, 1]; a plain unrecognized string shows as “other” kept as saved.
// FAILS ON 96877da and 254f29c (U41 as committed, before and after U10): [3, 2, 0, 1] for [] and [null], [3, 1, 1, 1] for
// ["AT"], "1 had a different answer" after each write, and both reads of {"toString":null} throw. The 9 controls pass there.
// TWO CONTROLS added after the reviews of U56/U57 (round 1; track u41c). They pass on eef8874 and pin it: a saved bare null
//   is an answer the write overwrites ([3, 1, 0, 2]; a getter reading null, 0 or false as no answer passed every check above),
//   and the kept choice chosen again writes nothing over [] or ["AT"] (on 254f29c its value was "" and "AT", which setSi
//   wrote over the saved list).
await (async () => {
  const name = 'v2.00 (U56/U57) — a saved SI value that is not text counts as an answer a bulk write overwrites, and Go to it opens its field';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  const keepBoards = () => [];
  try {
    const J = JSON.stringify;
    const make = raw => {
      const X = boot();
      seed(X.ev, { services: ['USAF', 'STOVL', 'USMC-C', 'USN'], items: [
        it('A', 'AV', [101, 0, 203, 307]), it('B', 'AV', [0, 0, 409, 503]), it('C', 'AV', [0, 0, 0, 601])],
        disc: [10000, 10000, 10000, 10000], mand: [0, 0, 0, 0], order: ['A', 'B', 'C'] });
      X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
        S.order.forEach(function(id){ S.awards[id]={mode:'single',d:FYMON[1][0],day:5}; });
        flowCfg().rules.lm='Req A'; S.ptype={A:'PRIME'}; applyState(S); save();
        S.si={A:${J(raw)},B:'',C:'EN'}; MS.years[MS.cur]=S; 'ok'`);
      const R = boot({ html: X.ev('buildSavedHtml()') });
      R.ev(`matBulkF='si'; matBulkV='AT'; matPmo='ALL'; matMissing=''; 'ok'`);
      return R;
    };
    const preview = R => { try { return R.ev(`JSON.stringify((function(){ var p=matBulkPreview(); return [p.n,p.blank,p.same,p.differ]; })())`); }
      catch (e) { return 'threw: ' + e.message; } };
    const field = R => { try { R.ev(`attGo('si','A'); 'ok'`);
        const f = R.w.document.querySelector('#erSi');
        return J([R.ev('erOpen'), f ? f.options[f.selectedIndex].textContent : 'NO FIELD']);
      } catch (e) { return 'threw: ' + e.message; } };
    for (const [where, raw, stored] of [['empty list', [], '{"A":[],"B":"","C":"EN"}'],
      ['code inside a list', ['AT'], '{"A":["AT"],"B":"","C":"EN"}'],
      ['null inside a list', [null], '{"A":[null],"B":"","C":"EN"}']]) {
      const R = make(raw);
      w5Chk(name, where, 'AT preview: three rows, one blank, none already AT, two answers overwritten', preview(R), '[3,1,0,2]');
      w5Chk(name, where, 'CONTROL — file keeps the exact raw answer and no code is guessed',
        J([R.ev('JSON.stringify(S.si)'), R.ev("siOf(itemById('A'))")]), J([stored, '']));
      R.w.confirm = () => true;
      R.ev(`matApplyBulk(); 'ok'`);
      w5Chk(name, where, 'completion counts both overwritten answers', R.w.document.getElementById('shareStat').textContent,
        '✓ Navy SI code set to AT on 3 requirements — 2 had a different answer and were overwritten.');
      const Q = boot({ html: R.ev('buildSavedHtml()') });
      w5Chk(name, where, 'CONTROL — explicit bulk choice survives save/reopen and every service keeps its dollars',
        Q.ev(`JSON.stringify([S.si,(function(){ var t=tiers(); return [t.A.d,t.B.d,t.C.d,t.A.m,t.B.m,t.C.m]; })()])`),
        J([{A:'AT',B:'AT',C:'AT'}, [[101,0,203,307],[0,0,409,503],[0,0,0,601],[0,0,0,0],[0,0,0,0],[0,0,0,0]]]));
    }
    const O = make({toString:null});
    w5Chk(name, 'object with non-callable toString', 'preview runs and counts the object as an answer to overwrite', preview(O), '[3,1,0,2]');
    w5Chk(name, 'object with non-callable toString', 'Go to it opens A and the field shows its JSON as kept as saved', field(O),
      J(['A', '“{"toString":null}” — not one of the five, kept as saved']));
    // Closing the panel also lets the unfixed board build its saved file, so retention is an independent control.
    O.ev(`erClose(); 'ok'`);
    const OQ = boot({ html: O.ev('buildSavedHtml()') });
    w5Chk(name, 'object with non-callable toString', 'CONTROL — object survives save/reopen, its code stays blank and $611 stays funded',
      OQ.ev(`JSON.stringify([S.si,siOf(itemById('A')),tiers().A.dT])`), J([{A:{toString:null},B:'',C:'EN'},'',611]));
    // a saved null was read as text before (String(null) is "null") and must stay an answer to overwrite
    const Nl = make(null);
    w5Chk(name, 'null alone', 'CONTROL — a saved null is an answer a bulk write overwrites, as before', preview(Nl), '[3,1,0,2]');
    // the kept choice, chosen again as drawn, is refused by setSi: the saved list stays exactly as it was
    const again = R => { try { R.ev(`attGo('si','A'); 'ok'`);
        const f = R.w.document.querySelector('#erSi'); if (!f) return 'NO FIELD';
        f.dispatchEvent(new R.w.Event('change', { bubbles: true })); R.ev(`erSave(); 'ok'`); return R.ev('JSON.stringify(S.si)');
      } catch (e) { return 'threw: ' + e.message; } };
    w5Chk(name, 'the kept choice chosen again', 'CONTROL — choosing “[]” or “["AT"]” again in A’s field writes nothing over the saved list',
      J([again(make([])), again(make(['AT']))]), J(['{"A":[],"B":"","C":"EN"}', '{"A":["AT"],"B":"","C":"EN"}']));
    const C = make('AT');
    C.ev(`S.si.C='other'; 'ok'`);
    w5Chk(name, 'valid, blank and plain unrecognized string', 'CONTROL — valid AT is same, explicit blank is blank, plain string differs', preview(C), '[3,1,1,1]');
    C.ev(`S.si.A='other'; 'ok'`);
    w5Chk(name, 'plain unrecognized string', 'CONTROL — raw text is displayed as kept as saved', field(C),
      J(['A', '“other” — not one of the five, kept as saved']));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (U56/U57) ====
// ==== v2.00 (U58/U59): the change journal and the submittal review show a saved SI value that is not text as saved ====
// The money review of U56/U57 (round 1, 18 Oct): two more places read a saved SI value U41 keeps as text. The change
// journal's Was and Became cells (jrnlShow) joined a list's items: ["AT"] read AT, [] and [null] nothing, a saved 7 the
// money "$7"; and [{"toString":null}] could not be drawn, so once Go to it or a bulk write repaired it the journal threw
// on opening and on every redraw while open, and its Put back was out of reach. The PMO submittal review's "On the board
// now" (pmoFmtVal's String(), in the panel and in the exported review workbook) read ["AT"] as AT and [null] as nothing,
// and {"toString":null} made the panel and the workbook throw, so no held submittal could be reviewed or exported.
// THE FILE: U56/U57's (A, an LM prime, holding the value [101, 0, 203, 307]; B none by hand [0, 0, 409, 503]; C EN
//   [0, 0, 0, 601]; every ask funded), with the journal its save wrote ("not set" to the value, for each).
// THE JOURNAL, read as drawn (What | Was | Became, newest first). ["AT"], AT chosen in A's field: Was “["AT"]”, Became AT;
//   ↶ Put back on that line brings ["AT"] back exactly, and its own line reads Was AT, Became “["AT"]”. [] after the bulk
//   write of AT: Was “[]”. A saved 7: Was “7”, never $7; true: “true”, never yes; {"toString":null} in the same quotes; a
//   list holding markup as text. [{"toString":null}], AT chosen in the field: the journal opens and reads
//   Was “[{"toString":null}]”, a redraw with it open works, its ↶ Put back brings the list back exactly, and the bulk write
//   after that is read the same way. An object with its own "_b" key is the value, not the journal's size mark (which the
//   journal only ever writes as a number over 300): {"_b":{"toString":null}} reads by its JSON and the journal opens and
//   redraws (the size mark's esc() threw on it), and {"_b":5} reads “{"_b":5}”, never "5 characters".
// THE REVIEW: a held submittal from AV proposes EN for A. "On the board now" reads “["AT"]”, “[null]”, “7” and
//   “{"toString":null}”, beside "EN — Engine", in the panel and in the review workbook read from its bytes; a list whose
//   JSON is longer than Needs attention's 60-character label reads whole, as the review prints text (a cut there splits
//   the emoji at character 60 into a replacement mark in the workbook), and so does one longer than 120.
// CONTROLS: text reads as before -- 'other' in the journal and the review, a recognized 'LA' in the review (LA — Airframe),
//   C's EN in the journal after the bulk write; a list longer than the 300 characters the journal keeps reads as its size,
//   324 characters, with no Put back, as for every field; the review applies nothing (S.si and every service's dollars).
// FAILS ON eef8874 (U56/U57 as committed): Was AT, blank, $7, yes, the object without quotes, the markup list's contents,
//   "5 characters"; the journal throws for [{"toString":null}] and {"_b":{"toString":null}} and offers no Put back; the
//   review reads AT, blank, 7 and the long lists' contents, and throws for the object. The 7 controls pass there.
await (async () => {
  const name = 'v2.00 (U58/U59) — the change journal and the PMO submittal review show a saved SI value that is not text as saved, by its JSON';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  const keepBoards = () => [];
  try {
    const J = JSON.stringify;
    const cell = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c;
    const make = raw => {
      const X = boot();
      seed(X.ev, { services: ['USAF', 'STOVL', 'USMC-C', 'USN'], items: [
        it('A', 'AV', [101, 0, 203, 307]), it('B', 'AV', [0, 0, 409, 503]), it('C', 'AV', [0, 0, 0, 601])],
        disc: [10000, 10000, 10000, 10000], mand: [0, 0, 0, 0], order: ['A', 'B', 'C'] });
      X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
        S.order.forEach(function(id){ S.awards[id]={mode:'single',d:FYMON[1][0],day:5}; });
        flowCfg().rules.lm='Req A'; S.ptype={A:'PRIME'}; applyState(S); save();
        S.si={A:${J(raw)},B:'',C:'EN'}; MS.years[MS.cur]=S; 'ok'`);
      const R = boot({ html: X.ev('buildSavedHtml()') });
      R.w.confirm = () => true;
      return R;
    };
    const tryEv = (R, s) => { try { return R.ev(s); } catch (e) { return 'threw: ' + e.message; } };
    // AT chosen in A's field as Go to it draws it, the record panel closed after
    const choose = R => tryEv(R, `(function(){ attGo('si','A'); var f=document.querySelector('#erSi');
      if(!f) return 'NO FIELD'; f.value='AT'; f.dispatchEvent(new Event('change', {bubbles:true})); erSave(); return 'chosen'; })()`);
    const bulk = R => tryEv(R, `jrnlOpen=false; matBulkF='si'; matBulkV='AT'; matPmo='ALL'; matMissing=''; matApplyBulk(); 'written'`);
    // the change journal opened as a person opens it; one requirement's lines as drawn: What | Was | Became, newest first
    const journal = (R, id) => tryEv(R, `(function(){ jrnlOpen=false; toggleJrnl();
      return JSON.stringify(Array.from(document.querySelectorAll('#jrnlBody tr')).filter(function(t){ return t.cells.length>4 && t.cells[2].textContent==='sustainment indicator — Ev ${id}'; })
        .map(function(t){ return Array.from(t.cells).slice(2,5).map(function(c){ return c.textContent; }); })); })()`);
    // ↶ Put back pressed on A's newest line as drawn (its question answered OK)
    const putBack = R => tryEv(R, `(function(){ var t=Array.from(document.querySelectorAll('#jrnlBody tr')).filter(function(t){ return t.cells.length>4 && t.cells[2].textContent==='sustainment indicator — Ev A'; })[0];
      var b=t? t.querySelector('button') : null; if(!b) return 'NO PUT BACK'; b.click(); return JSON.stringify(S.si); })()`);
    // a submittal from AV proposing EN for A, held for review; the panel's row for it: Field | On the board now | Proposed
    const review = R => tryEv(R, `(function(){ PMOSUBS=[{pmo:'AV', by:'suite', ts:1760000000000, items:{A:{si:'EN'}}, baseSeen:{}, forFy:MS.cur, added:[]}]; PMOPICK={};
      subOpenReview(); return JSON.stringify(Array.from(document.querySelectorAll('#subBody tr')).filter(function(t){ return t.cells.length===6 && /Navy SI code/.test(t.cells[3].textContent); })
        .map(function(t){ return Array.from(t.cells).slice(3).map(function(c){ return c.textContent; }); })); })()`);
    // the review workbook (Export change report) read back from its bytes: the same row's cells, and the status line it left
    const workbook = async R => { const x = JSON.parse(await R.w.eval(`(async function(){ var cap=null, _B=window.Blob;
        window.alert=function(){}; window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
        try{ pmoReport(); }catch(e){ window.Blob=_B; return JSON.stringify({err:'threw: '+String((e&&e.message)||e)}); }
        window.Blob=_B; if(!cap) return JSON.stringify({err:'no file'});
        return JSON.stringify({book:await xlsxRead(cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength)), stat:document.getElementById('shareStat').textContent}); })()`));
      if (x.err) return x.err;
      return J([((x.book || {})['Proposed changes'] || []).filter(r => r && cell(r[5]) === 'Navy SI code').map(r => r.slice(5, 8).map(cell)), x.stat]); };
    const sent = '📄 Change report exported — 1 proposed change. Nothing has been applied.';
    // ["AT"]: the review first (it applies nothing), then AT chosen in the field, the journal, and ↶ Put back
    const L = make(['AT']);
    w5Chk(name, 'code inside a list', 'the review panel: On the board now reads “["AT"]” as saved, never AT', review(L),
      J([['Navy SI code', '“["AT"]”', 'EN — Engine']]));
    w5Chk(name, 'code inside a list', 'the review workbook, from its bytes: On the board now “["AT"]”', await workbook(L),
      J([[['Navy SI code', '“["AT"]”', 'EN — Engine']], sent]));
    L.ev(`subClose(); 'ok'`);
    choose(L);
    w5Chk(name, 'code inside a list', 'AT chosen in the field: the journal reads Was “["AT"]”, Became AT; the file’s own line Became “["AT"]”', journal(L, 'A'),
      J([['sustainment indicator — Ev A', '“["AT"]”', 'AT'], ['sustainment indicator — Ev A', 'not set', '“["AT"]”']]));
    w5Chk(name, 'code inside a list', 'CONTROL — ↶ Put back on that line brings ["AT"] back exactly', putBack(L), J({ A: ['AT'], B: '', C: 'EN' }));
    w5Chk(name, 'code inside a list', 'the Put back’s own line reads Was AT, Became “["AT"]”', journal(L, 'A'),
      J([['sustainment indicator — Ev A', 'AT', '“["AT"]”'], ['sustainment indicator — Ev A', '“["AT"]”', 'AT'], ['sustainment indicator — Ev A', 'not set', '“["AT"]”']]));
    // []: the bulk write of AT on all three
    const E = make([]);
    bulk(E);
    w5Chk(name, 'empty list', 'after the bulk write the journal reads Was “[]”, never blank', journal(E, 'A'),
      J([['sustainment indicator — Ev A', '“[]”', 'AT'], ['sustainment indicator — Ev A', 'not set', '“[]”']]));
    w5Chk(name, 'empty list', 'CONTROL — C’s recognized code reads as before: Was EN, Became AT', journal(E, 'C'),
      J([['sustainment indicator — Ev C', 'EN', 'AT'], ['sustainment indicator — Ev C', 'not set', 'EN']]));
    // [null]: the review
    const N = make([null]);
    w5Chk(name, 'null inside a list', 'the review panel: On the board now reads “[null]”, never blank', review(N),
      J([['Navy SI code', '“[null]”', 'EN — Engine']]));
    w5Chk(name, 'null inside a list', 'the review workbook, from its bytes: On the board now “[null]”', await workbook(N),
      J([[['Navy SI code', '“[null]”', 'EN — Engine']], sent]));
    // a list longer than the 60-character label, an emoji where the label cuts: the review prints it whole
    N.ev(`subClose(); S.si.A=[${J('x'.repeat(57) + '😀')}]; 'ok'`);
    w5Chk(name, 'a long list', 'the review workbook prints the whole list, its emoji intact, never cut', await workbook(N),
      J([[['Navy SI code', '“["xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx😀"]”', 'EN — Engine']], sent]));
    // a list whose JSON is 129 characters: the panel and the workbook print all of it
    N.ev(`S.si.A=${J(['a sustainment indicator typed in by hand', 'another one, and a third, all kept as saved', 'so the list runs past 120 characters'])}; 'ok'`);
    w5Chk(name, 'a list longer than 120 characters', 'the review panel and workbook print all of it', J([review(N), await workbook(N)]),
      J([J([['Navy SI code', '“["a sustainment indicator typed in by hand","another one, and a third, all kept as saved","so the list runs past 120 characters"]”', 'EN — Engine']]),
        J([[['Navy SI code', '“["a sustainment indicator typed in by hand","another one, and a third, all kept as saved","so the list runs past 120 characters"]”', 'EN — Engine']], sent])]));
    // 7: the review, then AT chosen in the field
    const S7 = make(7);
    w5Chk(name, 'a number', 'the review panel: On the board now reads “7”, as Needs attention lists it', review(S7),
      J([['Navy SI code', '“7”', 'EN — Engine']]));
    S7.ev(`subClose(); 'ok'`);
    choose(S7);
    w5Chk(name, 'a number', 'the journal reads a saved 7 as “7”, never the money $7', journal(S7, 'A'),
      J([['sustainment indicator — Ev A', '“7”', 'AT'], ['sustainment indicator — Ev A', 'not set', '“7”']]));
    // [{"toString":null}]: AT chosen in the field, the journal, a redraw, ↶ Put back, then the bulk write
    const O = make([{ toString: null }]);
    choose(O);
    w5Chk(name, 'object inside a list', 'AT chosen in the field: the journal opens and reads Was “[{"toString":null}]”, Became AT', journal(O, 'A'),
      J([['sustainment indicator — Ev A', '“[{"toString":null}]”', 'AT'], ['sustainment indicator — Ev A', 'not set', '“[{"toString":null}]”']]));
    w5Chk(name, 'object inside a list', 'a redraw with the journal open draws every panel', tryEv(O, `render(); 'drawn'`), 'drawn');
    w5Chk(name, 'object inside a list', '↶ Put back on that line brings [{"toString":null}] back exactly', putBack(O), J({ A: [{ toString: null }], B: '', C: 'EN' }));
    bulk(O);
    w5Chk(name, 'object inside a list', 'the bulk write after it: the journal opens and its newest line reads Was “[{"toString":null}]”, Became AT',
      (r => { try { return J(JSON.parse(r)[0]); } catch (e) { return r; } })(journal(O, 'A')),
      J(['sustainment indicator — Ev A', '“[{"toString":null}]”', 'AT']));
    // {"_b":{"toString":null}} and {"_b":5}: an object of its own with a "_b" key is the value, not the journal's size mark
    const K = make({ _b: { toString: null } });
    choose(K);
    w5Chk(name, 'object with its own _b key', 'AT chosen in the field: the journal opens and reads Was “{"_b":{"toString":null}}”, Became AT, and a redraw with it open draws',
      J([journal(K, 'A'), tryEv(K, `render(); 'drawn'`)]),
      J([J([['sustainment indicator — Ev A', '“{"_b":{"toString":null}}”', 'AT'], ['sustainment indicator — Ev A', 'not set', '“{"_b":{"toString":null}}”']]), 'drawn']));
    const K5 = make({ _b: 5 });
    choose(K5);
    w5Chk(name, 'object with its own _b key', 'a saved {"_b":5}: the journal reads Was “{"_b":5}”, never 5 characters', journal(K5, 'A'),
      J([['sustainment indicator — Ev A', '“{"_b":5}”', 'AT'], ['sustainment indicator — Ev A', 'not set', '“{"_b":5}”']]));
    // a list whose JSON is longer than the 300 characters the journal keeps: the journal's size mark, as for every field
    const Lg = make(['x'.repeat(320)]);
    choose(Lg);
    w5Chk(name, 'a list longer than the journal keeps', 'CONTROL — Was reads 324 characters, the journal’s size mark, never a value, and no Put back is offered',
      J([journal(Lg, 'A'), putBack(Lg)]),
      J([J([['sustainment indicator — Ev A', '324 characters', 'AT'], ['sustainment indicator — Ev A', 'not set', '324 characters']]), 'NO PUT BACK']));
    // a list holding markup, and true: AT chosen in the field
    const Mk = make(['<b>x</b>']);
    choose(Mk);
    w5Chk(name, 'a list holding markup', 'the journal reads Was “["<b>x</b>"]” as text', journal(Mk, 'A'),
      J([['sustainment indicator — Ev A', '“["<b>x</b>"]”', 'AT'], ['sustainment indicator — Ev A', 'not set', '“["<b>x</b>"]”']]));
    const Tr = make(true);
    choose(Tr);
    w5Chk(name, 'true', 'the journal reads a saved true as “true”, never yes', journal(Tr, 'A'),
      J([['sustainment indicator — Ev A', '“true”', 'AT'], ['sustainment indicator — Ev A', 'not set', '“true”']]));
    // {"toString":null}: the review, then AT chosen in the field and the journal
    const B = make({ toString: null });
    w5Chk(name, 'object', 'the review panel draws, and On the board now reads “{"toString":null}”', review(B),
      J([['Navy SI code', '“{"toString":null}”', 'EN — Engine']]));
    w5Chk(name, 'object', 'the review workbook builds: On the board now “{"toString":null}”, and the line after says so', await workbook(B),
      J([[['Navy SI code', '“{"toString":null}”', 'EN — Engine']], sent]));
    tryEv(B, `subOpen=false; 'ok'`);
    w5Chk(name, 'object', 'CONTROL — the review applies nothing: the value as saved and every service’s dollars as before',
      tryEv(B, `JSON.stringify([S.si,(function(){ var t=tiers(); return [t.A.d,t.B.d,t.C.d]; })()])`),
      J([{ A: { toString: null }, B: '', C: 'EN' }, [[101, 0, 203, 307], [0, 0, 409, 503], [0, 0, 0, 601]]]));
    choose(B);
    w5Chk(name, 'object', 'AT chosen in the field: the journal reads Was “{"toString":null}”, Became AT', journal(B, 'A'),
      J([['sustainment indicator — Ev A', '“{"toString":null}”', 'AT'], ['sustainment indicator — Ev A', 'not set', '“{"toString":null}”']]));
    // text, unchanged: 'other' in the review and the journal; a recognized 'LA' in the review, with its label
    const T = make('other');
    w5Chk(name, 'plain unrecognized string', 'CONTROL — the review panel and workbook read other, as before', J([review(T), await workbook(T)]),
      J([J([['Navy SI code', 'other', 'EN — Engine']]), J([[['Navy SI code', 'other', 'EN — Engine']], sent])]));
    T.ev(`subClose(); 'ok'`);
    choose(T);
    w5Chk(name, 'plain unrecognized string', 'CONTROL — the journal reads Was other, Became AT, as before', journal(T, 'A'),
      J([['sustainment indicator — Ev A', 'other', 'AT'], ['sustainment indicator — Ev A', 'not set', 'other']]));
    const Ls = make('LA');
    w5Chk(name, 'recognized code', 'CONTROL — the review panel and workbook read LA — Airframe, as before', J([review(Ls), await workbook(Ls)]),
      J([J([['Navy SI code', 'LA — Airframe', 'EN — Engine']]), J([[['Navy SI code', 'LA — Airframe', 'EN — Engine']], sent])]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// v2.19 (item 150): removed with its feature -- v2.00 (U42) — a funds-flow sheet name never ends in half a character or begins or ends with an apostrophe
// ==== end v2.00 (U42) ====
// ==== v2.00 (U10): a refused edit in a locked cycle's view changes no code any export carries ====
// The review of main (Codex), as Brad supplied it on 11 Oct: lock PB27 with RCN / EEIC 11111 / AAAAA, move the working codes on,
// view PB27 and type 77777 in the enabled RCN field. Save said "the change was not kept", and RCN-EEIC by Month then exported
// PB27's dollars under 77777 / AAAAA, labelled LOCKED VIEW: a refused write put back the year on screen and nothing beside it.
// On v1.98 item 83's board (K1-K4, P's two CLINs, the ACE set), with a second held year (FY28, a copy of FY27) and an office ZED
// holding Q. PB27 is locked; the working list then moves on as v1.99 item 88's does (K1 renumbered 99999 / ZZZZZ, K3 removed).
// Each edit is made through the control the board renders for it -- the RCN / EEIC panel's three fields, its ✕ (answered OK),
// its + Add and a service box, and Setup › PMOs' ✎ (answered WRK) -- from a fresh view of PB27. After each, every export that
// carries a code is read from its bytes: RCN-EEIC by Month (summary, requirements, prime contracts), the Spend Plan Source
// (amount, CLIN, EEIC, RCN, PMO), the ACE tie-out (alignment breakout and mapping, FY27 and FY28) and the whole workbook (no
// cell names a code the cycle does not hold; the office ZED is everywhere it was). Every expected code and figure is the
// cycle's own, typed here: item 83's table. The record's own steps (saved, reopened, viewed, 77777 typed) are checked as well,
// and so is a cycle locked before v1.99, which kept no list: its view reads today's list (item 88), and a refusal leaves it so.
// FAILS ON 7ee498a (board fce8a391, U14's): each edit stays on the view's copy -- 77777, YYYYY and "Renamed" in every export
// that prints the code; K3 removed, so CLIN 0001's AFRC $31 is on no combination in FY27 and falls to K1 in FY28; ZED renamed,
// so Q's $71 is filed under AV; the older cycle's RCN-EEIC tab prints 77777 / ZZZZZ. CONTROLS: an edit to the year's own
// assignments (put back before as well), the cycle store and browser storage byte for byte, leaving the view, and an allowed
// edit on the working plan, which every export carries.
await (async () => {
  const name = 'v2.00 (U10) — a refused edit in a locked cycle’s view changes no code any export carries';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const ST = `S.rcnAsg={PRIME_P:'K4', R:'K1'}; S.rcnSvc={PRIME_P:{ANG:'K2'}, R:{ANG:'K2'}};
      S.clinRcn={PRIME_P:{n1:'K1'}}; S.clinRcnSvc={PRIME_P:{n1:{AFRC:'K3'}}};
      S.wbs={R:[{w:'2.2', v:[]}]};
      MS.pmos=GROUPS.concat(['ZED']); S.grp={Q:'ZED'};`;   // v2.19 (item 150): the estimate and the ACE tie-out are gone
    const X = v198Board(ST);
    const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    const key = ev(`window.confirm=function(){ return true; }; window.prompt=function(){ return 'WRK'; };
      MS.base=MS.cur; MS.years[MS.cur]=S; MS.years[MS.cur+1]=JSON.parse(JSON.stringify(S)); save();
      blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
    w5Chk(name, 'fixture', 'CONTROL — PB27 is locked, holding FY27 and FY28, with the list K1-K4; Q is in ZED',
      J([key, ev(`JSON.stringify([!!(blGet('PB|2027')||{}).locked, Object.keys((blGet('PB|2027')||{}).years||{})])`), ev(`GROUPS.indexOf('ZED')>=0`), ev(`grpOf(itemById('Q'))`)]),
      J(['PB|2027', '[true,["2027","2028"]]', true, 'ZED']));
    // the working list moves on after the lock (item 88's own change)
    ev(`(function(){ var L=rcnReg(), i=L.findIndex(function(e){ return e.k==='K1'; }); rcnSet(i,'rcn','99999'); rcnSet(i,'eeic','ZZZZZ');
      rcnDel(rcnReg().findIndex(function(e){ return e.k==='K3'; })); })(); 'ok'`);
    const reg = () => JSON.parse(ev(`JSON.stringify(rcnReg().map(function(e){ return [e.rcn, e.eeic, e.t, (e.svc||[]).join('+')]; }))`));
    w5Chk(name, 'fixture', 'CONTROL — the working list is now 99999 / ZZZZZ, 22222 / BBBBB, 44444 / DDDDD',
      J(reg()), J([['99999', 'ZZZZZ', '', 'USAF+ANG+AFRC'], ['22222', 'BBBBB', '', 'ANG'], ['44444', 'DDDDD', '', 'USAF+ANG+AFRC']]));
    const cyc0 = ev('JSON.stringify(CYCDB)'), ls0 = ev('localStorage.getItem(_AP.key)');
    // the panel as drawn on screen: each combination's RCN | EEIC | title | USAF ANG AFRC boxes
    const panel = () => JSON.parse(ev(`JSON.stringify([].slice.call(document.querySelectorAll('#rcnBody tr')).slice(1).map(function(tr){
      return [].slice.call(tr.querySelectorAll('input')).map(function(i){ return i.type==='checkbox'? (i.checked?'x':'-') : i.value; }).join('|'); }))`));
    // a control the panel renders for one combination: its field (typed, change fired), a service box, its ✕, or + Add
    const fire = (k, kind, value) => ev(`(function(){ if(!rcnOpen) toggleRcn(); var i=rcnReg().findIndex(function(e){ return e.k===${J(k)}; });
      var els=[].slice.call(document.querySelectorAll('#rcnBody input, #rcnBody button')), on=function(e, a){ return e.getAttribute(a)||''; }, el=null;
      if(${J(kind)}==='add') el=els.filter(function(e){ return /^rcnAdd\\(/.test(on(e, 'onclick')); })[0];
      else if(${J(kind)}==='del') el=els.filter(function(e){ return on(e, 'onclick')==='rcnDel('+i+')'; })[0];
      else if(${J(kind)}==='svc') el=els.filter(function(e){ return on(e, 'onchange').indexOf('rcnToggleSvc('+i+',')===0 && on(e, 'onchange').indexOf(${J(value)})>0; })[0];
      else el=els.filter(function(e){ return on(e, 'onchange').indexOf('rcnSet('+i+',"'+${J(kind)}+'"')===0; })[0];
      if(!el) return 'no control';
      if(${J(kind)}==='add' || ${J(kind)}==='del') el.click();
      else if(${J(kind)}==='svc'){ el.checked=!el.checked; el.dispatchEvent(new Event('change', {bubbles:true})); }
      else { el.value=${J(value)}; el.dispatchEvent(new Event('change', {bubbles:true})); }
      return 'fired'; })()`);
    const notKept = () => /the change was not kept|Not kept/.test(ev(`(document.getElementById('shareStat')||{}).textContent||''`));
    // every export that carries a code, read from its bytes
    const exportsOf = async W => {
      const bk = JSON.parse(await w6Book(W, 'exportExcel')), rc = bk['RCN-EEIC by Month'] || [];
      const iReq = rc.findIndex(r => w6Lbl(r) === 'WHICH REQUIREMENTS SIT UNDER EACH COMBINATION'), iPr = rc.findIndex(r => w6Lbl(r) === 'PRIME CONTRACTS, BROKEN OUT BY CLIN');
      const cells = []; Object.keys(bk).filter(k => !k.startsWith('__')).forEach(sh => (bk[sh] || []).forEach(r => (r || []).forEach(c => cells.push(String(c ?? '').trim()))));
      const sb = JSON.parse(await w6Book(W, 'exportSrc')), src = (Object.values(sb).find(rs => (rs || []).length > 1) || []).slice(1);
      return {
        files: [bk.__err || 'ok', sb.__err || 'ok'],
        summary: v198Sec(rc, 0, iReq).map(r => r.slice(0, 3)), requirements: v198Sec(rc, iReq, iPr), primes: v198Sec(rc, iPr, rc.length).map(r => r.slice(0, 3)),
        source: src.map(r => [num(r[9]), String(r[25] ?? ''), String(r[26] ?? ''), String(r[27] ?? ''), String(r[18] ?? '')]).sort((a, b) => a[0] - b[0]),
        workbook: [cells.filter(t => /77777|YYYYY|99999|ZZZZZ|Renamed|WRK/.test(t)).length, 'PMO ZED' in bk, cells.filter(t => t === 'ZED').length] };
    };
    const exportsNow = () => exportsOf(X.w);
    const L = v198Lab, N = v198NONE;
    // THE CYCLE'S OWN CODES, as item 83's table has them; ZED holds Q; no cell names a code PB27 does not hold
    const ALIGN = fy => [[fy, 'Req PRIME_P', '0001', 652, '11111', 'AAAAA'], [fy, 'Req PRIME_P', '0001', 31, '33333', 'CCCCC'], [fy, 'Req PRIME_P', '0001', 41, '', ''],
      [fy, 'Req PRIME_P', '0002', 358, '44444', 'DDDDD'], [fy, 'Req R', '', 503, '11111', 'AAAAA'], [fy, 'Req R', '', 127, '22222', 'BBBBB'], [fy, 'Req Q', '', 71, '', '']];
    const MAP = fy => [[fy, 'AV', 'Req PRIME_P', '(3 combinations)', '(see breakout)'], [fy, 'AV', 'Req R', '(2 combinations)', '(see breakout)'], [fy, 'ZED', 'Req Q', '', '']];
    const LOCKED = { files: ['ok', 'ok'],
      summary: [['USAF', L('K1'), 904], ['USAF', L('K4'), 299], ['USAF', N, 71], ['USAF', 'USAF TOTAL', 1274], ['ANG', L('K1'), 251], ['ANG', L('K2'), 127], ['ANG', 'ANG TOTAL', 378],
        ['AFRC', L('K3'), 31], ['AFRC', L('K4'), 59], ['AFRC', 'AFRC TOTAL', 90]],
      requirements: [['USAF', L('K1') + '   (2 requirements)', 904, null], ['USAF', '#1  Req PRIME_P ⚠', 401, 401], ['USAF', '#2  Req R', 503, 503],
        ['USAF', L('K4') + '   (1 requirement)', 299, null], ['USAF', '#1  Req PRIME_P ⚠', 299, 299],
        ['USAF', N + '   — 1 requirement still to assign', 71, null], ['USAF', '#3  Req Q', 71, 71], ['USAF', 'USAF TOTAL', 1274, null],
        ['ANG', L('K1') + '   (1 requirement)', 251, null], ['ANG', '#1  Req PRIME_P', 251, 251],
        ['ANG', L('K2') + '   (1 requirement)', 127, null], ['ANG', '#2  Req R', 127, 127], ['ANG', 'ANG TOTAL', 378, null],
        ['AFRC', L('K3') + '   (1 requirement)', 31, null], ['AFRC', '#1  Req PRIME_P ⚠', 31, 31],
        ['AFRC', L('K4') + '   (1 requirement)', 59, null], ['AFRC', '#1  Req PRIME_P ⚠', 59, 59], ['AFRC', 'AFRC TOTAL', 90, null]],
      primes: [['USAF', 'Req PRIME_P   (2 CLINs funded)', 700], ['USAF', 'CLIN 0001   ' + L('K1'), 401], ['USAF', 'CLIN 0002   ' + L('K4'), 299], ['USAF', 'USAF — PRIMES TOTAL', 700],
        ['ANG', 'Req PRIME_P   (1 CLIN funded)', 251], ['ANG', 'CLIN 0001   ' + L('K1'), 251], ['ANG', 'ANG — PRIMES TOTAL', 251],
        ['AFRC', 'Req PRIME_P   (2 CLINs funded)', 90], ['AFRC', 'CLIN 0001   ' + L('K3'), 31], ['AFRC', 'CLIN 0002   ' + L('K4'), 59], ['AFRC', 'AFRC — PRIMES TOTAL', 90]],
      source: [[31, '0001', 'CCCCC', '33333', 'AV'], [41, '0001', '', '', 'AV'], [59, '0002', 'DDDDD', '44444', 'AV'], [71, '', '', '', 'ZED'], [127, '', 'BBBBB', '22222', 'AV'],
        [251, '0001', 'AAAAA', '11111', 'AV'], [299, '0002', 'DDDDD', '44444', 'AV'], [401, '0001', 'AAAAA', '11111', 'AV'], [503, '', 'AAAAA', '11111', 'AV']],
      workbook: [0, true, 8] };
    const LIST = [['11111', 'AAAAA', '', 'USAF+ANG+AFRC'], ['22222', 'BBBBB', '', 'ANG'], ['33333', 'CCCCC', '', 'AFRC'], ['44444', 'DDDDD', '', 'USAF+ANG+AFRC']];
    const PANEL = ['11111|AAAAA||x|x|x', '22222|BBBBB||-|x|-', '33333|CCCCC||-|-|x', '44444|DDDDD||x|x|x'];
    const view = () => ev(`cycView(${J(key)}); 'ok'`), leave = () => ev(`if(rcnOpen) toggleRcn(); if(pmoOpen) togglePmo(); cycLeave(); 'ok'`);
    // ---- CONTROL: PB27 viewed, nothing typed
    view();
    w5Chk(name, 'PB27 viewed, nothing typed', 'CONTROL — every export carries the cycle’s own codes', J(await exportsNow()), J(LOCKED));
    leave();
    // ---- EACH EDIT THE RCN / EEIC PANEL OFFERS, refused. `exp`: the exports differed on 7ee498a (a combination with no money,
    // and the services a combination is set up for, are printed by no export: those two are CONTROLs there)
    const EDITS = [['RCN 77777 typed into K1’s field', () => fire('K1', 'rcn', '77777'), true], ['EEIC YYYYY typed into K1’s field', () => fire('K1', 'eeic', 'YYYYY'), true],
      ['title “Renamed” typed into K4’s field', () => fire('K4', 't', 'Renamed'), true], ['K3 removed with its ✕, answered OK', () => fire('K3', 'del'), true],
      ['+ Add RCN / EEIC', () => fire('K1', 'add'), false], ['K1’s ANG box switched off', () => fire('K1', 'svc', 'ANG'), false]];
    for (const [what, act, exp] of EDITS) {
      view(); const fired = act();
      w5Chk(name, 'PB27 viewed · ' + what, 'refused and said so; the list in the view, and the panel redrawn on screen, are the cycle’s: K1-K4 as locked',
        J([fired, notKept(), reg(), panel()]), J(['fired', true, LIST, PANEL]));
      w5Chk(name, 'PB27 viewed · ' + what, (exp ? '' : 'CONTROL — ') + 'every export carries the cycle’s own codes, as before the edit', J(await exportsNow()), J(LOCKED));
      leave();
    }
    // ---- ANOTHER YEAR THE CYCLE HOLDS: K3's ✕ clears its pointers in every year; refused on FY27, FY28 is read next
    view(); fire('K3', 'del'); ev(`if(rcnOpen) toggleRcn(); switchYear(MS.cur+1); 'ok'`);
    w5Chk(name, 'PB27 viewed · K3 removed on FY27, then FY28 on screen', 'FY28 still holds CLIN 0001’s AFRC on K3, and the list is the cycle’s',
      J([ev('MS.cur'), ev(`JSON.stringify(S.clinRcnSvc)`), reg()]), J([2028, J({ PRIME_P: { n1: { AFRC: 'K3' } } }), LIST]));
    w5Chk(name, 'PB27 viewed · K3 removed on FY27, then FY28 on screen', 'every export of FY28 carries the cycle’s own codes', J(await exportsNow()), J(LOCKED));
    leave();
    // ---- A REFUSAL WHILE FY28 IS ON SCREEN puts the copy back on FY28, not on the year the view opened on
    view(); ev(`switchYear(MS.cur+1); 'ok'`); const f28 = fire('K1', 'rcn', '77777');
    w5Chk(name, 'PB27 viewed · FY28 on screen, RCN 77777 typed into K1’s field', 'refused; still FY28, on FY28’s months; the list and the panel are the cycle’s',
      J([f28, notKept(), ev('MS.cur'), ev('FYMON[0][0]'), reg(), panel()]), J(['fired', true, 2028, '2027-10', LIST, PANEL]));
    w5Chk(name, 'PB27 viewed · FY28 on screen, RCN 77777 typed into K1’s field', 'every export of FY28 carries the cycle’s own codes', J(await exportsNow()), J(LOCKED));
    leave();
    // ---- THE PMO LIST: ZED renamed WRK with its ✎, refused (the rename moves every year's offices first)
    view();
    const fz = ev(`(function(){ if(!pmoOpen) togglePmo(); var b=[].slice.call(document.querySelectorAll('#pmoList button')).filter(function(e){
      return (e.getAttribute('onclick')||'')==='pmoRename('+GROUPS.indexOf('ZED')+')'; })[0]; if(!b) return 'no control'; b.click(); return 'fired'; })()`);
    w5Chk(name, 'PB27 viewed · ZED renamed WRK with its ✎', 'refused and said so; the list on screen still ends ZED; Q is in ZED in FY27 and FY28',
      J([fz, notKept(), ev(`[].slice.call(document.querySelectorAll('#pmoList .fr > div > b')).map(function(b){ return b.textContent; }).join(',')`), ev(`grpOf(itemById('Q'))`), ev(`JSON.stringify(MS.years[MS.cur+1].grp)`)]),
      J(['fired', true, 'ATL,PSM,PP,AV,MxS,CDS,TSS,BOP,ZED', 'ZED', J({ Q: 'ZED' })]));
    w5Chk(name, 'PB27 viewed · ZED renamed WRK with its ✎', 'every export carries the cycle’s own offices and codes: Q’s $71 under ZED', J(await exportsNow()), J(LOCKED));
    leave();
    // ---- CONTROL: an edit to the year's own assignments, refused (the year was put back before this version too)
    view(); ev(`setRcnAsg('Q','K2'); 'ok'`);
    w5Chk(name, 'PB27 viewed · Q given K2 (the year’s own assignment)', 'CONTROL — refused, and every export carries the cycle’s own codes',
      J([notKept(), await exportsNow()]), J([true, LOCKED]));
    leave();
    // ---- CONTROL: nothing durable moved, and leaving the view gives back the working plan
    w5Chk(name, 'after every refusal, the view left', 'CONTROL — the cycle store and browser storage are byte for byte as they were; the working list, ZED and Q are the working plan’s',
      J([ev('JSON.stringify(CYCDB)') === cyc0, ev('localStorage.getItem(_AP.key)') === ls0, ev('CYCVIEW'), reg(), ev(`GROUPS.join(',')`), ev(`grpOf(itemById('Q'))`)]),
      J([true, true, '', [['99999', 'ZZZZZ', '', 'USAF+ANG+AFRC'], ['22222', 'BBBBB', '', 'ANG'], ['44444', 'DDDDD', '', 'USAF+ANG+AFRC']], 'ATL,PSM,PP,AV,MxS,CDS,TSS,BOP,ZED', 'ZED']));
    // ---- THE RECORD'S OWN STEPS: the board saved and reopened, PB27 viewed, 77777 typed into the RCN field, Excel exported
    const R = boot({ html: ev('buildSavedHtml()') });
    const rv = (() => { try { return R.ev(`cycView(${J(key)}); (function(){ if(!rcnOpen) toggleRcn(); var el=[].slice.call(document.querySelectorAll('#rcnBody input')).filter(function(e){
      return (e.getAttribute('onchange')||'').indexOf('rcnSet(0,"rcn"')===0; })[0]; if(!el) return 'no control'; el.value='77777'; el.dispatchEvent(new Event('change', {bubbles:true}));
      return 'fired'; })()`); } catch (e) { return 'threw'; } })();
    // the status line is read at once: 'Not kept' is put in front of a message for 1.5 s after a refusal, and the exports write their own
    const rk = /the change was not kept|Not kept/.test(R.ev(`(document.getElementById('shareStat')||{}).textContent||''`));
    const rx = await exportsOf(R.w);
    w5Chk(name, 'the record’s steps: saved, reopened, PB27 viewed, 77777 typed', 'refused; RCN-EEIC by Month and the Spend Plan Source carry the cycle’s own codes; no cell names 77777',
      J([rv, rk, rx]),
      J(['fired', true, LOCKED]));
    // ---- CONTROL: the working plan, no view -- an edit is allowed, and every export carries it
    fire('K4', 'rcn', '55555'); ev(`if(rcnOpen) toggleRcn(); 'ok'`);
    const w = await exportsNow(), WK = '99999 / ZZZZZ', W5 = '55555 / DDDDD';
    const WALIGN = fy => [[fy, 'Req PRIME_P', '0001', 724, '99999', 'ZZZZZ'], [fy, 'Req PRIME_P', '0002', 358, '55555', 'DDDDD'], [fy, 'Req R', '', 503, '99999', 'ZZZZZ'],
      [fy, 'Req R', '', 127, '22222', 'BBBBB'], [fy, 'Req Q', '', 71, '', '']];
    w5Chk(name, 'the working plan · K4 renumbered 55555 (allowed)', 'CONTROL — every export carries 55555 / DDDDD, and the working list (K3 removed: CLIN 0001’s AFRC on its standard, K1)',
      J([w.files, w.summary, w.primes, w.source]),
      J([['ok', 'ok'], [['USAF', WK, 904], ['USAF', W5, 299], ['USAF', N, 71], ['USAF', 'USAF TOTAL', 1274], ['ANG', WK, 251], ['ANG', L('K2'), 127], ['ANG', 'ANG TOTAL', 378],
        ['AFRC', WK, 31], ['AFRC', W5, 59], ['AFRC', 'AFRC TOTAL', 90]],
        [['USAF', 'Req PRIME_P   (2 CLINs funded)', 700], ['USAF', 'CLIN 0001   ' + WK, 401], ['USAF', 'CLIN 0002   ' + W5, 299], ['USAF', 'USAF — PRIMES TOTAL', 700],
          ['ANG', 'Req PRIME_P   (1 CLIN funded)', 251], ['ANG', 'CLIN 0001   ' + WK, 251], ['ANG', 'ANG — PRIMES TOTAL', 251],
          ['AFRC', 'Req PRIME_P   (2 CLINs funded)', 90], ['AFRC', 'CLIN 0001   ' + WK, 31], ['AFRC', 'CLIN 0002   ' + W5, 59], ['AFRC', 'AFRC — PRIMES TOTAL', 90]],
        [[31, '0001', 'ZZZZZ', '99999', 'AV'], [41, '0001', '', '', 'AV'], [59, '0002', 'DDDDD', '55555', 'AV'], [71, '', '', '', 'ZED'], [127, '', 'BBBBB', '22222', 'AV'],
          [251, '0001', 'ZZZZZ', '99999', 'AV'], [299, '0002', 'DDDDD', '55555', 'AV'], [401, '0001', 'ZZZZZ', '99999', 'AV'], [503, '', 'ZZZZZ', '99999', 'AV']]]));
    // ---- A CYCLE LOCKED BEFORE v1.99 kept no list (item 88's own reading of one: the lock's list taken away), so its view reads
    // today's -- 99999 / ZZZZZ, 22222 / BBBBB, 55555 / DDDDD. 77777 typed into K1's field there is refused like any other.
    ev(`delete blGet(${J(key)}).rcn; 'ok'`);
    view(); const fo = fire('K1', 'rcn', '77777'), fk = notKept(), o = await exportsNow();
    w5Chk(name, 'a cycle locked before v1.99, viewed · RCN 77777 typed into K1’s field', 'refused; the view’s list and RCN-EEIC by Month are today’s list as it is',
      J([fo, fk, reg(), o.summary.filter(r => r[0] === 'USAF').map(r => r[1])]),
      J(['fired', true, [['99999', 'ZZZZZ', '', 'USAF+ANG+AFRC'], ['22222', 'BBBBB', '', 'ANG'], ['55555', 'DDDDD', '', 'USAF+ANG+AFRC']], [WK, W5, N, 'USAF TOTAL']]));
    leave();
    w5Chk(name, 'harness', 'CONTROL — no jsdom script errors on either board', J([X.errors.length, R.errors.length]), J([0, 0]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.00 (U10) ====
// ==== v2.00 (U10, beside the codes): a refusal in a locked view puts back the plan's settings, the year on screen, the CCaR records and the base year ====
// The U10 block above reads the codes. A refusal makes the whole copy again, so what the board keeps beside the codes comes back
// with it, and this block reads that in the exports (the U10 round-1 test review's cases, 13 Oct). On v1.98 item 83's board with
// every requirement in band 0, PB27 locked and viewed: band 0 renamed (bandSet, the handler the ✎ prompt calls) and the funds-flow
// axis set to destinations (flowSetAxis), each refused. A held year that is not a copy of the first: PB27's FY28 files R on K4,
// 77777 typed there. A CCaR Records file imported in the view (its Title and OPR are kept beside the years, in MS.ccarIdx, and the
// Spend Plan Source prints them). The cycle's own FYDP window after a refusal, when the working plan's base year has moved on.
// FAILS ON 7ee498a (board fce8a391): the workbook names band 0 RENAMED BAND, the funds-flow export is cut by destination, and the
// Spend Plan Source titles R and Q REFUSED TITLE R / Q with OPR REFUSED OPR. The FY28 case fails there too (77777 stays in the
// view's list, and RCN-EEIC by Month files K1's money under 77777). CONTROLS: nothing changed; nothing imported; the same CCaR
// file imported on the working plan, which the Source prints; the cycle's FYDP window (the year-only put-back never touched the
// base year); no jsdom errors. Every name, code and figure expected is typed here.
await (async () => {
  const name = 'v2.00 (U10) — a refusal in a locked view puts back the plan’s settings, the year on screen, the CCaR records and the cycle’s base year';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const X = v198Board(`S.band={PRIME_P:BANDS_LIST()[0].id, R:BANDS_LIST()[0].id, Q:BANDS_LIST()[0].id};`);
    const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    const key = ev(`window.confirm=function(){ return true; }; MS.base=MS.cur; MS.years[MS.cur]=S; save(); blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
    const notKept = () => /the change was not kept|Not kept/.test(ev(`(document.getElementById('shareStat')||{}).textContent||''`));
    const bandCells = async () => { const bk = JSON.parse(await w6Book(X.w, 'exportExcel')), o = [];
      Object.keys(bk).filter(k => !k.startsWith('__')).forEach(sh => (bk[sh] || []).forEach(r => (r || []).forEach(c => {
        const t = String(c ?? '').trim(); if (/NET FUNDING AVAILABLE|RENAMED/i.test(t)) o.push(sh + ': ' + t); }))); return [bk.__err || 'ok', o]; };
    // v2.19 (item 150): the funds flow, and its axis, are gone; the band's refusal stays
    ev(`cycView(${J(key)}); 'ok'`);
    const b0 = await bandCells();
    ev(`bandSet(0,'n','RENAMED BAND'); 'ok'`); const nk1 = notKept(), b1 = await bandCells();
    ev(`cycLeave(); 'ok'`);
    // band 0 as the workbook prints it, and the funds-flow sheets cut by what the money buys: typed here
    const BANDS = ['ok', ['Decision Bands: Net Funding Available', 'Decision Bands: BAND 0 — NET FUNDING AVAILABLE  ·  fund in full  ·  counts toward the stoppage gap  ·  organization standard  ·  3 requirements',
      'Decision Bands: Net Funding Available', 'Decision Bands: Net Funding Available', 'Decision Bands: Net Funding Available']];
    w5Chk(name, 'PB27 viewed, nothing changed', 'CONTROL — the workbook names band 0 as locked', J(b0), J(BANDS));
    w5Chk(name, 'PB27 viewed · band 0 renamed RENAMED BAND (refused)', 'refused and said so; the workbook still names band 0 as it was locked', J([nk1, b1]), J([true, BANDS]));
    // A HELD YEAR THAT DIFFERS FROM THE ONE THE VIEW OPENS ON: PB27's FY28 files R on K4 (FY27 files it on K1). The U10 block's FY28 is a
    // copy of FY27, so a refusal that put FY27's plan in FY28's place would read the same there. By hand (item 83's table, R on K4 in FY28):
    // USAF -- K1 401 (CLIN 0001's standard), K4 802 (CLIN 0002's 299 + R's 503), none 71 (Q), total 1274.
    const Y = v198Board(`S.rcnAsg={PRIME_P:'K4', R:'K1'}; S.rcnSvc={PRIME_P:{ANG:'K2'}, R:{ANG:'K2'}}; S.clinRcn={PRIME_P:{n1:'K1'}};`);
    const yv = c => { try { return Y.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    const k2 = yv(`window.confirm=function(){ return true; }; MS.base=MS.cur; MS.years[MS.cur]=S; MS.years[MS.cur+1]=JSON.parse(JSON.stringify(S));
      MS.years[MS.cur+1].rcnAsg={PRIME_P:'K4', R:'K4'}; save(); blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
    yv(`cycView(${J(k2)}); switchYear(MS.cur+1); if(!rcnOpen) toggleRcn(); (function(){ var i=rcnReg().findIndex(function(e){ return e.k==='K1'; });
      var el=[].slice.call(document.querySelectorAll('#rcnBody input')).filter(function(e){ return (e.getAttribute('onchange')||'').indexOf('rcnSet('+i+',"rcn"')===0; })[0];
      el.value='77777'; el.dispatchEvent(new Event('change', {bubbles:true})); })(); 'ok'`);
    const yk = /the change was not kept|Not kept/.test(yv(`(document.getElementById('shareStat')||{}).textContent||''`)), ycur = yv('MS.cur');
    const ybk = JSON.parse(await w6Book(Y.w, 'exportExcel')), yrc = ybk['RCN-EEIC by Month'] || [];
    const yreq = yrc.findIndex(r => w6Lbl(r) === 'WHICH REQUIREMENTS SIT UNDER EACH COMBINATION');
    const ysum = v198Sec(yrc, 0, yreq).filter(r => r[0] === 'USAF').map(r => r.slice(0, 3));
    yv(`if(rcnOpen) toggleRcn(); cycLeave(); 'ok'`);
    w5Chk(name, 'PB27 viewed · FY28 (R on K4) on screen, RCN 77777 typed into K1’s field', 'refused; still FY28, and RCN-EEIC by Month files FY28’s USAF money as FY28 holds it',
      J([yk, ycur, ysum]), J([true, 2028, [['USAF', '11111 / AAAAA', 401], ['USAF', '44444 / DDDDD', 802], ['USAF', v198NONE, 71], ['USAF', 'USAF TOTAL', 1274]]]));
    // A CCaR RECORDS FILE IMPORTED WHILE PB27 IS ON SCREEN. R and Q carry CCaR numbers CCR and CCQ (the suite's it()); the import wrote
    // the index the working plan keeps beside its years, then saved, which the view refused (now it is refused before the file is read:
    // the shared-lists block below). By hand: the Spend Plan Source's Title column is the requirement's own name ("Ev R", "Ev Q") and
    // its OPR blank until a records file is kept.
    const CCAR = (t, o) => J([['CCaR No', 'Title', 'OPR', 'PMO', 'Control No'], ['CCR', t + ' R', o, 'AV', '7001'], ['CCQ', t + ' Q', o, 'AV', '7002']]);
    const ccarImp = rows => X.w.eval(`(async function(){ var b=buildXlsx([{name:'CCaR', cols:[12,30,14,8,10], rows:${rows}}]);
      var ab=b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength);
      await importCcarRecs({files:[{name:'ccar-records.xlsx', arrayBuffer:async function(){ return ab; }}]}); return 'ok'; })()`);
    const srcTitles = async () => { const sb = JSON.parse(await w6Book(X.w, 'exportSrc'));
      const s = Object.keys(sb).filter(k => !k.startsWith('__')).map(k => sb[k]).find(rs => Array.isArray(rs) && rs.length > 1) || [], seen = {};
      s.slice(1).forEach(r => { const k = String((r || [])[2] ?? ''); if (k === 'CCR' || k === 'CCQ') seen[[k, String(r[3] ?? ''), String(r[12] ?? '')].join(' | ')] = 1; });
      return [sb.__err || 'ok', String((s[0] || [])[3] ?? ''), String((s[0] || [])[12] ?? ''), Object.keys(seen).sort()]; };
    ev(`cycView(${J(key)}); 'ok'`);
    const s0 = await srcTitles();
    await ccarImp(CCAR('REFUSED TITLE', 'REFUSED OPR')); const nk3 = notKept(), s1 = await srcTitles();
    ev(`cycLeave(); 'ok'`);
    await ccarImp(CCAR('RECORD TITLE', 'RECORD OPR')); const s2 = await srcTitles();
    const SRC0 = ['ok', 'Title', 'OPR', ['CCQ | Ev Q | ', 'CCR | Ev R | ']];
    w5Chk(name, 'PB27 viewed, nothing imported', 'CONTROL — the Spend Plan Source titles R and Q by their own names, OPR blank', J(s0), J(SRC0));
    w5Chk(name, 'PB27 viewed · CCaR Records file imported (refused)', 'refused and said so; the Spend Plan Source still titles R and Q by their own names, OPR blank', J([nk3, s1]), J([true, SRC0]));
    w5Chk(name, 'the working plan · the same file imported (allowed)', 'CONTROL — the Spend Plan Source prints the records’ Title and OPR',
      J(s2), J(['ok', 'Title', 'OPR', ['CCQ | RECORD TITLE Q | RECORD OPR', 'CCR | RECORD TITLE R | RECORD OPR']]));
    // THE CYCLE'S OWN BASE YEAR. The working plan's FYDP window moves on after the lock (base FY28); PB27 was locked on FY27.
    // By hand: the view's window is FY27-FY31 before and after a refusal; the working plan's is FY28-FY32 with FY27 (on screen) beside it.
    ev(`MS.base=MS.cur+1; save(); cycView(${J(key)}); 'ok'`);
    const w0 = ev('JSON.stringify(fydpWindow())');
    ev(`bandSet(0,'n','RENAMED AGAIN'); 'ok'`); const nk4 = notKept(), w1 = ev('JSON.stringify(fydpWindow())');
    ev(`cycLeave(); 'ok'`); const w2 = ev('JSON.stringify(fydpWindow())');
    w5Chk(name, 'working base year moved to FY28 · PB27 viewed · band 0 renamed (refused)', 'CONTROL — the view keeps the cycle’s FYDP window FY27–FY31 after the refusal; the working plan’s is FY28–FY32',
      J([w0, nk4, w1, w2]), J(['[2027,2028,2029,2030,2031]', true, '[2027,2028,2029,2030,2031]', '[2027,2028,2029,2030,2031,2032]']));
    w5Chk(name, 'harness', 'CONTROL — no jsdom script errors', J([X.errors.length, Y.errors.length]), J([0, 0]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.00 (U10, beside the codes) ====
// ==== v2.00 (U10, the shared lists): a cost estimate, a BAE list, CCaR records or a destination change is refused in a locked view before anything is kept ====
// The lists every appropriation shares -- the cost estimates, the BAE budget list, the destination list -- are no part of a locked
// view's copy, so making the copy again (the blocks above) cannot put them back. On 7ee498a each door wrote its list first and then
// saved, which the view refused: the board said "Not kept" and kept it (the U10 round-1 money review, 13 Oct). Now each is refused
// before the file is read or a question asked, and says so. A board of two requirements in AV -- A (USAF 900, ANG 200, confirmed on
// WBS 1.1) and R (USAF 503, ANG 127) -- with an approved 2027 estimate (AV, 1.1, $900) and the funds flow grouped by where the money
// goes. PB27 is locked with R going to Lockheed Martin; the working plan then adds Depot X (a government activity) and sends R there.
// With PB27 on screen, each door is used through the handler its control calls (the file pickers' importAce / importBud /
// importCcarRecs, with a workbook the board builds) or through the control Setup › Destinations renders (a name typed, + add,
// ✕ answered OK, reset answered OK). After each, in the view and again on the working plan after leaving: the status line, the
// questions asked, the three lists in the board and in browser storage, the panel, and the cells of the ACE tie-out, the FYDP
// Spend Plan, the Spend Plan Source and the funds flow -- every figure typed here. FAILS ON 7ee498a (board fce8a391): the approved
// estimate is replaced after "should not change. Replace it?" and the tie-out reads $4,321,000; the Source names the BAE budget
// and the refused CCaR titles; Lockheed Martin is RENAMED DEST in the funds flow; "Remove Depot X? Nothing points at it." is asked
// and, back on the working plan, R's $630 is not yet assigned. CONTROLS: PB27 viewed, nothing done; on the working plan each door
// is open -- the estimate replaced (asked first), the BAE list kept, a destination added and named -- and every export carries it.
await (async () => {
  const name = 'v2.00 (U10) — a cost estimate, a BAE list, CCaR records or a destination change is refused in a locked view before anything is kept';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const X = boot();
    seed(X.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('A', 'AV', [900, 200, 0]), it('R', 'AV', [503, 127, 0])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['A', 'R'] });
    const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.wbs={A:[{w:'1.1', v:[]}]}; S.dest={R:{to:'lm'}};
      applyState(S); save();   // v2.19 (item 150): the estimate and the funds flow are gone; the BAE list, the CCaR records and the destinations stay
      globalThis.__wb=function(sheets, name){ var b=buildXlsx(sheets); return {name:name, arrayBuffer: async function(){ return b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength); }}; };
      'ok'`);
    const key = ev(`window.confirm=function(){ return true; }; MS.base=MS.cur; MS.years[MS.cur]=S; save(); blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
    // after the lock: the working plan adds Depot X, a government activity, and sends R's money there (PB27 still sends it to Lockheed Martin)
    ev(`flowAddEnt(); (function(){ var L=flowEnts(); flowSetEnt(L.length-1,'n','Depot X'); flowSetEnt(L.length-1,'kind','gov'); })();
      setDest('R','to',destByName('Depot X').k); 'ok'`);
    const said = () => ev(`(document.getElementById('shareStat')||{}).textContent||''`);
    const spy = () => ev(`window.__asked=[]; window.confirm=function(m){ window.__asked.push(String(m).slice(0,70)); return true; };
      window.alert=function(m){ window.__asked.push('alert: '+String(m).slice(0,70)); }; 'ok'`);
    const asked = () => JSON.parse(ev(`JSON.stringify(window.__asked||[])`));
    const lists = () => JSON.parse(ev(`JSON.stringify([(BUDDB.rows||[]).map(function(b){ return b.n; }), flowEnts().map(function(e){ return e.n; })])`));
    const stored = () => JSON.parse(ev(`JSON.stringify((function(){ var b=JSON.parse(localStorage.getItem('prio27buddb')||'null'), d=JSON.parse(localStorage.getItem(DEST_KEY)||'null');
      return [b? (b.rows||[]).map(function(x){ return x.n; }) : null, d? (d.ents||[]).map(function(e){ return e.n; }) : null]; })())`));
    // Setup › Destinations as drawn on screen: each destination's name field, A to Z
    const panel = () => JSON.parse(ev(`(function(){ if(!entOpen) toggleEnt(); return JSON.stringify([].slice.call(document.querySelectorAll('#entBody input')).filter(function(i){
      return /^flowSetEnt\\(\\d+,"n",/.test(i.getAttribute('onchange')||''); }).map(function(i){ return i.value; })); })()`));
    // a control Setup › Destinations renders for one destination: its name field (typed, change fired), its ✕, + add, or reset
    const fireDest = (kind, nm, value) => ev(`(function(){ if(!entOpen) toggleEnt(); var i=flowEnts().findIndex(function(e){ return e.n===${J(nm)}; });
      var els=[].slice.call(document.querySelectorAll('#entBody input, #entBody button')), on=function(e, a){ return e.getAttribute(a)||''; }, el=null;
      if(${J(kind)}==='name') el=els.filter(function(e){ return on(e, 'onchange')==='flowSetEnt('+i+',"n",this.value)'; })[0];
      else if(${J(kind)}==='del') el=els.filter(function(e){ return on(e, 'onclick')==='flowDelEnt('+i+')'; })[0];
      else el=els.filter(function(e){ return on(e, 'onclick')===${J(kind)}; })[0];
      if(!el) return 'no control';
      if(${J(kind)}==='name'){ el.value=${J(value || '')}; el.dispatchEvent(new Event('change', {bubbles:true})); } else el.click();
      return 'fired'; })()`);
    const hdr = (rows, ...must) => rows.findIndex(r => must.every(m => (r || []).some(c => String(c ?? '').trim() === m)));
    const col = (rows, h, n) => (rows[h] || []).findIndex(c => String(c ?? '').trim() === n);
    // every export that carries the estimate, the budget names, the CCaR titles or the destinations, read from its bytes
    const exportsNow = async () => {
      const fb = JSON.parse(await w6Book(X.w, 'exportFydpPlan'));   // v2.04 (item 112): it builds; it no longer carries the estimate
      const sb = JSON.parse(await w6Book(X.w, 'exportSrc')), s = Object.keys(sb).filter(k => !k.startsWith('__')).map(k => sb[k]).find(rs => Array.isArray(rs) && rs.length > 1) || [];
      return {
        files: [fb.__err || 'ok', sb.__err || 'ok'],
        source: [String((s[0] || [])[4] ?? ''), String((s[0] || [])[12] ?? ''), s.slice(1).map(r => [String(r[2] ?? ''), String(r[3] ?? ''), num(r[9]), String(r[4] ?? ''), String(r[12] ?? '')]).sort()],
      };
    };
    // BY HAND. The view: R goes to Lockheed Martin (PB27's); the working plan: R goes to Depot X. A's $1,100 goes nowhere yet. The
    // estimate is the approved one: A confirmed on 1.1, $900 against A's $1,100; AV $900 against $1,730 funded. No budget, no records.
    const SOURCE = ['Budget', 'OPR', [['CCA', 'Ev A', 200, '', ''], ['CCA', 'Ev A', 900, '', ''], ['CCR', 'Ev R', 127, '', ''], ['CCR', 'Ev R', 503, '', '']]];
    const VIEW = { files: ['ok', 'ok'], source: SOURCE };
    const WORK = VIEW;
    const DEST = ['Lockheed Martin', 'Pratt & Whitney', 'NAWCAD Patuxent River', 'NAWCWD China Lake', 'FRC East, Cherry Point', 'NAWCAD Lakehurst', 'Defense Logistics Agency', 'OC-ALC Oklahoma City', 'Depot X'];
    const LISTS = [[], DEST], STORED = [null, DEST];
    const PANEL = ['Defense Logistics Agency', 'Depot X', 'FRC East, Cherry Point', 'Lockheed Martin', 'NAWCAD Lakehurst', 'NAWCAD Patuxent River', 'NAWCWD China Lake', 'OC-ALC Oklahoma City', 'Pratt & Whitney'];
    // v2.02 (item 89): the view reads the destination list PB27 was locked with -- Depot X, added since, is not on it (changed on purpose)
    const LISTS_V = [[], DEST.filter(n => n !== 'Depot X')], PANEL_V = PANEL.filter(n => n !== 'Depot X');
    const OFF = what => '🔒 ' + what + ' is off while PB27 is on screen. It is a locked cycle, read only — the change was not kept. ↩ Leave the view to work the plan.';
    const view = () => ev(`cycView(${J(key)}); 'ok'`), leave = () => ev(`if(entOpen) toggleEnt(); cycLeave(); 'ok'`);
    const Rto = () => ev(`flowEntName(destOf(itemById('R')).to)`);
    // ---- CONTROL: PB27 viewed, nothing done; then the working plan
    view();
    w5Chk(name, 'PB27 viewed, nothing done', 'CONTROL — the lists, browser storage and the panel as they are; every export carries PB27’s own figures (R to Lockheed Martin)',
      J([lists(), stored(), panel(), await exportsNow()]), J([LISTS_V, STORED, PANEL_V, VIEW]));
    leave();
    w5Chk(name, 'the working plan, nothing done', 'CONTROL — R goes to Depot X, and every export says so', J([Rto(), await exportsNow()]), J(['Depot X', WORK]));
    // ---- EACH DOOR, with PB27 on screen
    const DOORS = [
      ['a BAE list imported (an ANG budget for AV)', 'Importing a BAE budget list', () => ev(`importBud({files:[__wb([{name:'BAE', rows:[['Budget Name'], ['USAF O&M - ANG CAM ZZ9 Discretionary AV']]}], 'BAE.xlsx')], value:''})`)],
      ['a CCaR Records file imported (titles and OPR for CCA and CCR)', 'Importing CCaR records', () => ev(`importCcarRecs({files:[__wb([{name:'CCaR', rows:[['CCaR No','Title','OPR','PMO','Control No'],
        ['CCA','REFUSED TITLE A','REFUSED OPR','AV','7001'], ['CCR','REFUSED TITLE R','REFUSED OPR','AV','7002']]}], 'ccar-records.xlsx')], value:''})`)],
      ['Lockheed Martin renamed RENAMED DEST in its name field', 'Changing a destination', () => fireDest('name', 'Lockheed Martin', 'RENAMED DEST')],
      ['+ add a destination', 'Adding a destination', () => fireDest('flowAddEnt()')],
      // v2.02 (item 89): Depot X is not on PB27's list, so the view is asked to remove Pratt & Whitney, which is
      ['Pratt & Whitney removed with its ✕, answered OK', 'Removing a destination', () => fireDest('del', 'Pratt & Whitney')],
      ['reset the list, answered OK', 'Resetting the destination list', () => fireDest('flowResetEnts()')]];
    for (const [what, door, act] of DOORS) {
      view(); panel(); spy();
      const r = await act(), st = said(), q = asked(), fired = (r === undefined || r === 'fired') ? 'ran' : String(r);
      w5Chk(name, 'PB27 viewed · ' + what, 'refused before anything is read or asked, and the status line says so', J([fired, st, q]), J(['ran', OFF(door), []]));
      w5Chk(name, 'PB27 viewed · ' + what, 'the lists, browser storage and the panel as they were; every export from the view carries PB27’s own figures',
        J([lists(), stored(), panel(), await exportsNow()]), J([LISTS_V, STORED, PANEL_V, VIEW]));
      leave();
      w5Chk(name, 'PB27 viewed · ' + what + ' · the view left', 'the working plan’s lists, R’s destination and every export are its own, as before',
        J([lists(), stored(), Rto(), await exportsNow()]), J([LISTS, STORED, 'Depot X', WORK]));
    }
    // ---- CONTROLS: on the working plan each door is open, and every export carries what it did (typed from the files)
    await ev(`importBud({files:[__wb([{name:'BAE', rows:[['Budget Name'], ['USAF O&M - ANG CAM ZZ9 Discretionary AV']]}], 'BAE.xlsx')], value:''})`);
    const lb = lists(), sbud = stored(), xb = await exportsNow(), BUD = 'USAF O&M - ANG CAM ZZ9 Discretionary AV';
    w5Chk(name, 'the working plan · a BAE list imported (allowed)', 'CONTROL — the list is kept, and the Spend Plan Source names the ANG budget on A’s and R’s ANG lines',
      J([lb[0], sbud[0], xb.source]), J([[BUD], [BUD], ['Budget', 'OPR', [['CCA', 'Ev A', 200, BUD, ''], ['CCA', 'Ev A', 900, '', ''], ['CCR', 'Ev R', 127, BUD, ''], ['CCR', 'Ev R', 503, '', '']]]]));
    // + add a destination, named Depot Z in its name field, and R sent there: what the view refused, on the working plan
    const fa = fireDest('flowAddEnt()'), fd = fireDest('name', 'New destination', 'Depot Z');
    ev(`setDest('R','to',destByName('Depot Z').k); 'ok'`);
    const pd = panel(), ld = lists(), sd = stored(), xd = await exportsNow();
    ev(`if(entOpen) toggleEnt(); 'ok'`);
    w5Chk(name, 'the working plan · + add a destination, named Depot Z, R sent there (allowed)', 'CONTROL — the list, browser storage and the panel carry Depot Z, and R goes there',
      J([fa, fd, pd.includes('Depot Z'), ld[1].slice(-1), sd[1].slice(-1), Rto(), xd.files]),
      J(['fired', 'fired', true, ['Depot Z'], ['Depot Z'], 'Depot Z', ['ok', 'ok']]));
    w5Chk(name, 'harness', 'CONTROL — no jsdom script errors', J(X.errors.length), J(0));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.00 (U10, the shared lists) ====
// ==== v2.00 (U10, the spend plan's choices): a spend-plan choice, a PPBE position or a destination's kind refused in a locked view leaves no trace ====
// The Spend Plan's choices -- its Cost data (the estimate the ACE tie-out ties out), By PMO / By Service and the two prior years --
// were set on the page first and then saved, which the view refused: the board said "the change was not kept" and kept the choice,
// so the ACE tie-out taken from the view, and from the working plan after leaving it, tied out the estimate chosen in the view (the
// U10 round-2 test review, 13 Oct). A PPBE position is kept beside the years (MS.ppbe), so only a refusal that makes the whole copy
// again puts it back (the blocks above read the codes, the bands and the funds flow, not the positions). A destination's kind is
// changed through a field of its own, which the shared-lists block above does not use (it renames). A board of two AV
// requirements -- A (USAF 900, ANG 200, confirmed on WBS 1.1) and R (USAF 503, ANG 127) -- with two approved estimates, 2027ACE (AV,
// 1.1, $900) and 2026ACE (AV, 1.1, $333 for FY27), the Spend Plan on 2027ACE by PMO, and the working plan tagged PB27 with USAF's
// FY27 position logged at $1,000. PB27 is locked and viewed; each choice is made through the control the Spend Plan renders, and
// the position through the handler its cell calls. FAILS ON 7ee498a (board fce8a391) and on the U10 commits: the Spend Plan shows
// 2026ACE by Service with the prior years, and the ACE tie-out from the view and from the working plan ties out 2026ACE ($333);
// on 7ee498a the FYDP Spend Plan from the view also prints the refused $5,000 position, and Lockheed Martin is kept a government
// activity for every appropriation and in browser storage. CONTROLS: PB27 viewed, nothing chosen; on
// the working plan the Cost data choice is open, kept, and the tie-out reads it; no jsdom errors. Every figure is typed here.
await (async () => {
  const name = 'v2.00 (U10) — a spend-plan choice, a PPBE position or a destination’s kind refused in a locked view leaves no trace';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const X = boot();
    seed(X.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('A', 'AV', [900, 200, 0]), it('R', 'AV', [503, 127, 0])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['A', 'R'] });
    const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    // v2.19 (item 150): the Spruills' choices and the ACE tie-out are gone; the PPBE position and a destination's kind stay
    ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.wbs={A:[{w:'1.1', v:[]}]}; applyState(S); save();
      cycSetWorking('PB', MS.cur); ppCyc='PB'; ppYr=MS.cur; ppLineAdd('USAF'); ppSetV('USAF', ppLines(ppPos(),'USAF')[0].k, MS.cur, 'd', '1000'); 'ok'`);
    const key = ev(`window.confirm=function(){ return true; }; MS.base=MS.cur; MS.years[MS.cur]=S; save(); blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
    const notKept = () => /the change was not kept|Not kept/.test(ev(`(document.getElementById('shareStat')||{}).textContent||''`));
    // v2.04 (item 112): the five-year workbook no longer prints the position, so the position is read where it is logged
    const pos = async () => { const fb = JSON.parse(await w6Book(X.w, 'exportFydpPlan'));
      return [fb.__err || 'ok', JSON.parse(ev(`JSON.stringify(['USAF','ANG','AFRC'].map(function(sv){ return [sv, ppSvcFy(MS.ppbe['PB|'+MS.cur]||{}, sv, MS.cur).t]; }))`))]; };
    const POS = ['ok', [['USAF', 1000], ['ANG', 0], ['AFRC', 0]]];
    const view = () => ev(`cycView(${J(key)}); 'ok'`), leave = () => ev(`cycLeave(); 'ok'`);
    // ---- CONTROL: PB27 viewed, nothing typed
    view();
    w5Chk(name, 'PB27 viewed, nothing chosen', 'CONTROL — USAF’s FY27 position is $1,000 as logged, and the FYDP Spend Plan builds', J(await pos()), J(POS));
    ev(`ppCyc='PB'; ppYr=MS.cur; ppSetV('USAF', ppLines(ppPos(),'USAF')[0].k, MS.cur, 'd', '5000'); 'ok'`); const kv = notKept();
    w5Chk(name, 'PB27 viewed · USAF’s FY27 PPBE position typed as $5,000', 'refused and said so; the position is $1,000 as logged, and the FYDP Spend Plan taken from the view builds',
      J([kv, await pos()]), J([true, POS]));
    const fd = ev(`(function(){ if(!entOpen) toggleEnt(); var i=flowEnts().findIndex(function(e){ return e.n==='Lockheed Martin'; });
      var s=[].slice.call(document.querySelectorAll('#entBody select')).filter(function(e){ return (e.getAttribute('onchange')||'')==='flowSetEnt('+i+',"kind",this.value)'; })[0];
      if(!s) return 'no control'; s.value='gov'; s.dispatchEvent(new Event('change', {bubbles:true})); return 'fired'; })()`), kd = notKept();
    const kinds = ev(`JSON.stringify([flowEnts().filter(function(e){ return e.n==='Lockheed Martin'; }).map(function(e){ return e.kind; }),
      ((JSON.parse(localStorage.getItem(DEST_KEY)||'null')||{}).ents||[]).filter(function(e){ return e.n==='Lockheed Martin'; }).map(function(e){ return e.kind; })])`);
    ev(`if(entOpen) toggleEnt(); 'ok'`);
    w5Chk(name, 'PB27 viewed · Lockheed Martin’s kind set to government in Setup › Destinations', 'refused and said so; it is still a prime contractor, in the board and in browser storage',
      J([fd, kd, kinds]), J(['fired', true, J([['prime'], ['prime']])]));
    leave();
    w5Chk(name, 'PB27 viewed · each choice refused · the view left', 'the working plan’s USAF FY27 position is $1,000 as logged', J(await pos()), J(POS));
    w5Chk(name, 'harness', 'CONTROL — no jsdom script errors', J(X.errors.length), J(0));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.00 (U10, the spend plan's choices) ====
// ==== v2.00 (U10, the files, packages, ladder and shared copies): a file, a package, the ladder or a shared copy is refused in a locked view before anything is kept ====
// The doors the round-2 reviews of 13 Oct and the builder's second door scan found beside the ones the blocks above close. Each
// wrote something no part of the view's copy -- this appropriation's browser storage, another appropriation's board, a list every
// appropriation shares, a kept-aside copy, the shared folder's record -- or handed a file out, and only then met the view's
// refusal, so the board said "Not kept" and kept it: a returned package taken through Import one appropriation put 77777 for K1
// into every export once the board reopened, and the work typed after the save was in no copy; a state file carrying cost
// estimates kept them (the ACE tie-out read $4,321,000 for $900); the band ladder copied to Full Fund replaced its own; a package
// issued, returned or sent back carried the cycle as the board; the shared state file kept the cycle aside as this browser's work;
// a Live refresh from the shared folder did the same and recorded the folder's newer copy as the one the work came from, so the
// first refresh after leaving the view replaced that work, kept nowhere. A cost estimate, BAE list or CCaR file whose import
// started on the working plan, with PB27 put on screen while it was read, was kept too. Boards of two AV requirements -- A (USAF 900, ANG 200, on RCN 11111 / EEIC AAAAA, confirmed on WBS
// 1.1) and R (USAF 503, ANG 127, no code) -- with an approved 2027 estimate (AV, 1.1, $900); PB27 locked; then the working plan
// gives A the description WORK DESC A. Each door is used through the handler its control calls, with PB27 on screen (or put on
// screen while the file is read), and then the status line, the questions asked, browser storage, the file handed out and the
// cells of the exports the door reaches are read -- every figure typed here. FAILS ON 7ee498a (board fce8a391) and on U10 1-3.
// CONTROLS: on the working plan each door is open and does what it did before.
await (async () => {
  const name = 'v2.00 (U10) — a file, a package, the band ladder or a shared copy is refused in a locked view before anything is kept';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  const boards = [];
  try {
    const J = JSON.stringify;
    // one board, booted twice so it holds requirement data of its own (not the empty template), PB27 locked, then WORK DESC A
    const mk = () => {
      const X0 = boot(); boards.push(X0);
      seed(X0.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('A', 'AV', [900, 200, 0]), it('R', 'AV', [503, 127, 0])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['A', 'R'] });
      X0.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
        MS.rcn=[{k:'K1', rcn:'11111', eeic:'AAAAA', t:'', svc:['USAF','ANG','AFRC']}]; S.rcnAsg={A:'K1'};
        S.wbs={A:[{w:'1.1', v:[]}]}; applyState(S); save(); 'ok'`);   // v2.19 (item 150): the estimate, this block's old canary, is gone
      const ls = JSON.parse(X0.ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
      const X = boot({ ls }); boards.push(X);
      const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
      ev(`globalThis.__wb=function(sheets, name){ var b=buildXlsx(sheets); return {name:name, arrayBuffer: async function(){ __reads++; return b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength); }}; };
        globalThis.__reads=0;
        // what a download hands out: the text of every Blob made while the code runs
        globalThis.__handed=function(code){ var got=[], _B=window.Blob;
          window.Blob=function(p,o){ try{ (p||[]).forEach(function(x){ if(typeof x==='string' && x.indexOf('spmtPkg')>=0) got.push(x); }); }catch(e){} return new _B(p,o); };
          try{ (0,eval)(code); }catch(e){ got.push('threw '+String((e&&e.message)||e)); } window.Blob=_B; return JSON.stringify(got); };
        'ok'`);
      const key = ev(`window.confirm=function(){ return true; }; MS.base=MS.cur; MS.years[MS.cur]=S; save(); blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
      ev(`setDesc('A','WORK DESC A'); 'ok'`);
      return { X, ev, key };
    };
    const said = ev => ev(`(document.getElementById('shareStat')||{}).textContent||''`);
    const spy = ev => ev(`window.__asked=[]; window.confirm=function(m){ window.__asked.push(String(m).split('\\n')[0].slice(0,70)); return true; };
      window.alert=function(m){ window.__asked.push('alert: '+String(m).split('\\n')[0].slice(0,70)); }; 'ok'`);
    const asked = ev => JSON.parse(ev(`JSON.stringify(window.__asked||[])`));
    const wait = (X, ms) => X.ev(`new Promise(function(r){ setTimeout(r, ${ms}); })`);
    const fileOf = (ev, text, nm) => ev(`(function(){ globalThis.__f=new File([${J(text)}], ${J(nm)}, {type:'application/json'}); return 'ok'; })()`);
    // this appropriation's own copy in browser storage: its RCN codes and its descriptions
    const own = ev => JSON.parse(ev(`(function(){ var s=JSON.parse(localStorage.getItem(_AP.key)||'null'); if(!s) return 'null';
      var y=(s.years||{})[String(s.cur)]||{}; return JSON.stringify([(s.rcn||[]).map(function(e){ return e.rcn; }), (y.desc||{}).A||'', (y.desc||{}).R||'']); })()`));
    const keptAside = ev => ev(`(function(){ var k=localStorage.getItem(_AP.key+'.kept'); if(!k) return 'none'; var i=k.indexOf('\\n'), m=JSON.parse(k.slice(0,i)), s=JSON.parse(k.slice(i+1));
      var y=(s.years||{})[String(s.cur)]||{}; return JSON.stringify([m.why, (y.desc||{}).A||'']); })()`);
    const hdr = (rows, ...must) => rows.findIndex(r => must.every(m => (r || []).some(c => String(c ?? '').trim() === m)));
    const col = (rows, h, n) => (rows[h] || []).findIndex(c => String(c ?? '').trim() === n);
    // the codes every export carries: RCN-EEIC by Month's summary, and the Spend Plan Source's lines [$, EEIC, RCN]
    const codes = async W => { const bk = JSON.parse(await w6Book(W, 'exportExcel')), rc = bk['RCN-EEIC by Month'] || [];
      const iReq = rc.findIndex(r => w6Lbl(r) === 'WHICH REQUIREMENTS SIT UNDER EACH COMBINATION');
      const sb = JSON.parse(await w6Book(W, 'exportSrc')), src = (Object.values(sb).find(rs => (rs || []).length > 1) || []).slice(1);
      return [bk.__err || 'ok', sb.__err || 'ok', v198Sec(rc, 0, iReq).map(r => r.slice(0, 3)),
        src.map(r => [num(r[9]), String(r[26] ?? ''), String(r[27] ?? '')]).sort((a, b) => a[0] - b[0])]; };
    // BY HAND. A's $1,100 sits on 11111 / AAAAA (USAF 900, ANG 200); R's $630 on no code (USAF 503, ANG 127); AFRC carries nothing,
    // and its section prints a total of 0. The approved 2027ACE ties out A: $900 against $1,100 on 1.1, delta 200.
    const N = v198NONE, K1 = '11111 / AAAAA';
    const CODES = ['ok', 'ok', [['USAF', K1, 900], ['USAF', N, 503], ['USAF', 'USAF TOTAL', 1403], ['ANG', K1, 200], ['ANG', N, 127], ['ANG', 'ANG TOTAL', 327], ['AFRC', 'AFRC TOTAL', 0]],
      [[127, '', ''], [200, 'AAAAA', '11111'], [503, '', ''], [900, 'AAAAA', '11111']]];
    const OFF = what => '🔒 ' + what + ' is off while PB27 is on screen. It is a locked cycle, read only — the change was not kept. ↩ Leave the view to work the plan.';

    // ==== 1. a returned package, through Import one appropriation (MF1), and the same with PB27 put on screen while it is read
    {
      const { X, ev, key } = mk();
      const issued = JSON.parse(ev(`__handed("pkgIssue(mySlug(), true)")`)).map(t => JSON.parse(t))[0];
      const ret = JSON.parse(J(issued)); ret.dir = 'return'; ret.by = 'Manager M'; ret.ts = Date.now() + 1000;
      ret.ms.rcn = [{ k: 'K1', rcn: '77777', eeic: 'AAAAA', t: '', svc: ['USAF', 'ANG', 'AFRC'] }];
      ret.ms.years[String(ret.ms.cur)].desc = Object.assign({}, ret.ms.years[String(ret.ms.cur)].desc || {}, { R: 'MGR DESC R' });
      const fileHtml = ev(`buildSavedHtml()`);                 // the board saved to its file
      ev(`setDesc('A','UNSAVED EDIT A'); 'ok'`);                 // then one more edit, in browser storage only
      const OWN = [['11111'], 'UNSAVED EDIT A', ''];
      ev(`cycView(${J(key)}); 'ok'`); spy(ev); fileOf(ev, J(ret), 'ORBIT PACKAGE - O&M - return 1.json');
      ev(`importState({files:[__f], value:''}); 'ok'`); const st1 = said(ev); await wait(X, 2000);
      w5Chk(name, 'PB27 viewed · the manager’s return (K1 → 77777, MGR DESC R) taken through Import one appropriation', 'refused before the file is read or a question asked, and the status line says so; browser storage still holds 11111 and UNSAVED EDIT A',
        J([st1, asked(ev), own(ev)]), J([OFF('Importing a file'), [], OWN]));
      ev(`cycLeave(); 'ok'`);
      w5Chk(name, 'PB27 viewed · the return refused · the view left', 'the working plan’s exports carry 11111 for A and no 77777; browser storage as it was',
        J([await codes(X.w), own(ev)]), J([CODES, OWN]));
      // the same browser, reopened over the file saved before the view
      const lsNow = JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
      const Y = boot({ html: fileHtml, ls: lsNow }); boards.push(Y);
      w5Chk(name, 'PB27 viewed · the return refused · the browser reopened over the saved file', 'the board reopens on the work typed after the save (UNSAVED EDIT A), and its exports carry 11111 for A, no 77777',
        J([Y.ev(`(S.desc||{}).A||''`), await codes(Y.w)]), J(['UNSAVED EDIT A', CODES]));
      // started on the working plan; PB27 put on screen before the file is read
      spy(ev); fileOf(ev, J(ret), 'ORBIT PACKAGE - O&M - return 1.json');
      ev(`importState({files:[__f], value:''}); cycView(${J(key)}); 'ok'`); await wait(X, 2000);
      w5Chk(name, 'the return taken on the working plan, PB27 put on screen before the file is read', 'refused once it is read, nothing asked; browser storage still holds 11111 and UNSAVED EDIT A',
        J([said(ev), asked(ev), own(ev)]), J([OFF('Importing a file'), [], OWN]));
      ev(`cycLeave(); 'ok'`);
      // CONTROL: on the working plan the return is merged (asked first), and every export carries 77777 for A
      spy(ev); fileOf(ev, J(ret), 'ORBIT PACKAGE - O&M - return 1.json');
      ev(`importState({files:[__f], value:''}); 'ok'`); await wait(X, 2000);
      const q = asked(ev).map(m => m.split(' — ')[0].split(' the returned')[0]);
      w5Chk(name, 'the working plan · the return taken (allowed)', 'CONTROL — asked (the conflict, then the merge), merged: browser storage and every export carry 77777 for A, and MGR DESC R',
        J([q, own(ev), await codes(X.w)]),
        J([['CONFLICT', 'Merge'], [['77777'], 'WORK DESC A', 'MGR DESC R'],
          ['ok', 'ok', [['USAF', '77777 / AAAAA', 900], ['USAF', N, 503], ['USAF', 'USAF TOTAL', 1403], ['ANG', '77777 / AAAAA', 200], ['ANG', N, 127], ['ANG', 'ANG TOTAL', 327], ['AFRC', 'AFRC TOTAL', 0]],
            [[127, '', ''], [200, 'AAAAA', '77777'], [503, '', ''], [900, 'AAAAA', '77777']]]]));
    }

    // ==== 2. v2.19 (item 150): a state file carrying a cost estimate -- the estimate is gone, and so is this part

    // ==== 3. the workbook imports: refused before the file is read in a view, and once it is read when a view was put on screen meanwhile
    {
      const { X, ev, key } = mk();
      const lists = () => JSON.parse(ev(`JSON.stringify((function(){ var b=JSON.parse(localStorage.getItem('prio27buddb')||'null');
        return [(BUDDB.rows||[]).map(function(r){ return r.n; }), b? (b.rows||[]).map(function(r){ return r.n; }) : null]; })())`));
      const LISTS = [[], null];
      const FILES = {
        bud: ['Importing a BAE budget list', `importBud({files:[__wb([{name:'BAE', rows:[['Budget Name'], ['USAF O&M - ANG CAM ZZ9 Discretionary AV']]}], 'BAE.xlsx')], value:''})`],
        ccar: ['Importing CCaR records', `importCcarRecs({files:[__wb([{name:'CCaR', rows:[['CCaR No','Title','OPR','PMO','Control No'], ['CCA','REFUSED TITLE A','REFUSED OPR','AV','7001']]}], 'ccar-records.xlsx')], value:''})`] };
      // with PB27 on screen: the file is never read
      for (const k of ['bud', 'ccar']) {
        const [door, code] = FILES[k];
        ev(`cycView(${J(key)}); __reads=0; 'ok'`); spy(ev);
        await ev(code);
        w5Chk(name, 'PB27 viewed · ' + door.toLowerCase().replace(/^importing /, '') + ' imported', 'refused before the file is read (it is read 0 times, nothing asked); the lists in the board and in browser storage as they were',
          J([said(ev), ev('__reads'), asked(ev), lists()]), J([OFF(door), 0, [], LISTS]));
        ev(`cycLeave(); 'ok'`);
      }
      // started on the working plan; PB27 put on screen before the file has been read (the import's first wait)
      for (const k of ['bud', 'ccar']) {
        const [door, code] = FILES[k];
        spy(ev);
        await ev(`(function(){ var p=${code}; cycView(${J(key)}); return p; })()`);
        w5Chk(name, 'an import of ' + door.toLowerCase().replace(/^importing /, '') + ' started on the working plan, PB27 put on screen while the file is read', 'refused once it is read, nothing asked; the lists as they were, and the ACE tie-out from the view ties out $900',
          J([said(ev), asked(ev), lists()]), J([OFF(door), [], LISTS]));
        ev(`cycLeave(); 'ok'`);
      }
      w5Chk(name, 'the two races · the view left', 'the working plan’s lists as they were', J(lists()), J(LISTS));

      // ==== 4. the band ladder copied to the other appropriations (MF2): Full Fund's own ladder is "FF ONLY BAND", F1 banded in it
      ev(`localStorage.setItem(_SLUGMAP.ff.key, JSON.stringify({base:2027, cur:2027, ts:5, years:{'2027':{order:[], band:{F1:'ffb'}}}, bands:[{id:'ffb', n:'FF ONLY BAND', rule:'', c:'#336699'}], bandsTs:5})); 'ok'`);
      const ff = () => ev(`JSON.stringify([((JSON.parse(localStorage.getItem(_SLUGMAP.ff.key))||{}).bands||[]).map(function(b){ return b.n; }), localStorage.getItem(BAND_PEND_KEY('ff'))===null])`);
      ev(`cycView(${J(key)}); 'ok'`); spy(ev);
      ev(`bandCopyAll(); 'ok'`);
      w5Chk(name, 'PB27 viewed · ⇉ Copy to the other appropriations', 'refused before anything is asked; Full Fund keeps its own ladder, and no ladder is held for it',
        J([said(ev), asked(ev), ff()]), J([OFF('Copying the band ladder'), [], J([['FF ONLY BAND'], true])]));
      ev(`cycLeave(); 'ok'`);

      // ==== 5. the packages: issued, pushed, returned, sent back (SF1)
      ev(`MS.pkg={ap:mySlug(), seq:3, baseSig:'SIG3', by:'Lead L', ts:1}; save(); 'ok'`);
      const seq = () => ev(`(JSON.parse(localStorage.getItem(_AP.key)||'{}').sync||{}).seq||0`);
      const PKGS = [['pkgIssue(mySlug(), true)', 'Issuing a package'], ['pkgPushAll()', 'Pushing baselines to the managers'],
        ['pkgReturn()', 'Saving a return package'], ['pkgSendBack(mySlug())', 'Sending a package back']];
      for (const [code, door] of PKGS) {
        ev(`cycView(${J(key)}); 'ok'`); spy(ev);
        const handed = JSON.parse(ev(`__handed(${J(code)})`)); await wait(X, 600);
        w5Chk(name, 'PB27 viewed · ' + code, 'refused before anything is asked or handed out; no file, and the package record as it was',
          J([said(ev), asked(ev), handed.length, seq()]), J([OFF(door), [], 0, 0]));
        ev(`cycLeave(); 'ok'`);
      }
      // CONTROL: on the working plan each hands out the working plan (A described WORK DESC A)
      spy(ev);
      const hw = ['pkgIssue(mySlug(), true)', 'pkgReturn()', 'pkgSendBack(mySlug())'].map(c => JSON.parse(ev(`__handed(${J(c)})`)).map(t => { const p = JSON.parse(t);
        return [p.dir, ((p.ms.years[String(p.ms.cur)] || {}).desc || {}).A || '']; }));
      w5Chk(name, 'the working plan · a package issued, a return saved, the appropriation sent back (allowed)', 'CONTROL — each hands out one file carrying the working plan (WORK DESC A)',
        J(hw), J([[['issue', 'WORK DESC A']], [['return', 'WORK DESC A']], [['return', 'WORK DESC A']]]));

      // CONTROL: on the working plan the ladder is copied, and Full Fund takes it
      ev(`bandCopyAll(); 'ok'`);
      w5Chk(name, 'the working plan · ⇉ Copy to the other appropriations (allowed)', 'CONTROL — Full Fund’s ladder is now this one (no FF ONLY BAND), and one is held for it',
        J([JSON.parse(ff())[0].includes('FF ONLY BAND'), JSON.parse(ff())[0].length > 1, JSON.parse(ff())[1]]), J([false, true, false]));

      // ==== 4b. v2.00 (Codex D3-1): ⚙ Install standard and ⬆ Import ladder with PB27 on screen. save() refused each, but each then
      // said "⚖ Standard bands 0–4 installed on O&M" / "⚖ Ladder imported — 1 bands on O&M". Each is now refused before it asks
      // or reads the file. The working ladder is one band of this office's own, KEPT BAND (#123456, skip); the view, the working
      // plan and the copy in browser storage all keep it.
      ev(`MS.stdVer=STD_VER; bandSave([{id:'kept', n:'KEPT BAND', d:'', rule:'skip', c:'#123456'}]); 'ok'`);
      const ladder = () => ev(`JSON.stringify(BANDS_LIST().map(function(b){ return [b.n, b.c, b.rule]; }))`);
      const stored = () => ev(`JSON.stringify((JSON.parse(localStorage.getItem(_AP.key)||'{}').bands||[]).map(function(b){ return [b.n, b.c, b.rule]; }))`);
      const KEPT = J([['KEPT BAND', '#123456', 'skip']]);
      w5Chk(name, 'the working plan · the ladder saved', 'CONTROL — the ladder and its copy in browser storage are KEPT BAND alone', J([ladder(), stored()]), J([KEPT, KEPT]));
      ev(`cycView(${J(key)}); 'ok'`); spy(ev);
      // v2.02 (item 89): the view reads the ladder PB27 was locked with, not KEPT BAND, saved since; each refusal leaves it as it is
      const VL = ladder();
      w5Chk(name, 'PB27 viewed', 'CONTROL — the view reads the ladder PB27 was locked with, not KEPT BAND', VL !== KEPT && JSON.parse(VL).length > 1, true);
      ev(`bandStd(); 'ok'`);
      w5Chk(name, 'PB27 viewed · ⚙ Install standard', 'refused before anything is asked, and the status line says only that; the ladder in the view is still PB27’s and in browser storage still KEPT BAND',
        J([said(ev), asked(ev), ladder(), stored()]), J([OFF('Installing the standard bands'), [], VL, KEPT]));
      spy(ev);
      fileOf(ev, J({ bands: [{ id: 'imp', n: 'IMPORTED BAND', rule: 'full', c: '#654321' }] }), 'F4 ladder.json');
      ev(`globalThis.__rd=0; globalThis.__rdT=FileReader.prototype.readAsText; FileReader.prototype.readAsText=function(){ __rd++; return __rdT.apply(this, arguments); };
        globalThis.__inp={files:[__f], value:'F4 ladder.json'}; bandImport(__inp); 'ok'`);
      await wait(X, 400);
      const imp = [said(ev), asked(ev), ev(`__rd`), ev(`__inp.value`), ladder(), stored()];
      ev(`FileReader.prototype.readAsText=__rdT; 'ok'`);
      w5Chk(name, 'PB27 viewed · ⬆ Import ladder', 'refused before the file is read or anything is asked, the file choice cleared, and the status line says only that; the ladder still KEPT BAND',
        J(imp), J([OFF('Importing a band ladder'), [], 0, '', VL, KEPT]));
      ev(`cycLeave(); 'ok'`);
      w5Chk(name, 'the two remedies · the view left', 'the working plan’s ladder and its copy in browser storage are still KEPT BAND', J([ladder(), stored()]), J([KEPT, KEPT]));
      // CONTROL: on the working plan Install standard asks, and installs the standard bands above KEPT BAND
      spy(ev); ev(`bandStd(); 'ok'`);
      const L2 = JSON.parse(ladder());
      w5Chk(name, 'the working plan · ⚙ Install standard (allowed)', 'CONTROL — it asks once, says the standard bands are installed, and KEPT BAND stays below them, last',
        J([asked(ev).length, /^⚖ Standard bands .* installed on O&M\./.test(said(ev)), L2.length > 1, J(L2[L2.length - 1])]), J([1, true, true, J(['KEPT BAND', '#123456', 'skip'])]));
    }

    // ==== 6. the shared state file loaded (adoptShared), with work in this browser no saved copy has
    {
      const { ev, key } = mk();
      ev(`SHARED=JSON.parse(JSON.stringify(MS)); SHARED.ts=MS.ts+60000; SHARED.by='Colleague C'; SHARED.years[String(MS.cur)].desc={R:'SHARED DESC R'}; baseSet({dirty:true}); DIRTY=false; 'ok'`);
      ev(`cycView(${J(key)}); 'ok'`); spy(ev); ev(`adoptShared(); 'ok'`);
      w5Chk(name, 'PB27 viewed · the shared state file loaded (adoptShared)', 'refused, and the status line says so; nothing is kept aside, and the work is still this browser’s unsaved work',
        J([said(ev), keptAside(ev), own(ev), ev('!!baseGet().dirty')]), J([OFF('Loading the shared state file'), 'none', [['11111'], 'WORK DESC A', ''], true]));
      ev(`cycLeave(); 'ok'`);
      // v2.00 (U10, fix round 3): the same file answering at opening (sharedArrived), with PB27 put on screen before it arrived. Both
      // reach sharedKeepMine, where the gate is; one on adoptShared alone kept the cycle aside here as this browser's work.
      ev(`cycView(${J(key)}); 'ok'`); spy(ev); ev(`sharedArrived(SHARED); 'ok'`);
      w5Chk(name, 'PB27 viewed · the shared state file answers at opening (sharedArrived)', 'refused, and the status line says so; nothing is kept aside, and the work is still this browser’s unsaved work',
        J([said(ev), keptAside(ev), own(ev), ev('!!baseGet().dirty')]), J([OFF('Loading the shared state file'), 'none', [['11111'], 'WORK DESC A', ''], true]));
      ev(`cycLeave(); 'ok'`);
    }
    {
      // CONTROL, on a board of its own: on the working plan the shared state file is loaded, the work kept aside first
      const { ev } = mk();
      ev(`SHARED=JSON.parse(JSON.stringify(MS)); SHARED.ts=MS.ts+60000; SHARED.by='Colleague C'; SHARED.years[String(MS.cur)].desc={R:'SHARED DESC R'}; baseSet({dirty:true}); DIRTY=false;
        adoptShared(); 'ok'`);
      w5Chk(name, 'the working plan · the shared state file loaded (allowed)', 'CONTROL — the work is kept aside first (WORK DESC A), and the shared copy is loaded (SHARED DESC R)',
        J([keptAside(ev), own(ev)]), J([J(['sidecar', 'WORK DESC A']), [['11111'], '', 'SHARED DESC R']]));
    }

    // ==== 7. a Live refresh from the shared folder finding a colleague's newer copy, with work in this browser no saved copy has
    {
      const { X, ev, key } = mk();
      const files = {};
      const dir = { kind: 'directory', name: 'shared', queryPermission: async () => 'granted', requestPermission: async () => 'granted',
        getFileHandle: async (n, o) => { if (!(n in files)) { if (o && o.create) files[n] = ''; else { const e = new Error('not found'); e.name = 'NotFoundError'; throw e; } }
          return { kind: 'file', name: n, getFile: async () => { const h = X.w.__duringRead; X.w.__duringRead = null; if (h) h(); const c = files[n]; return { text: async () => c }; },
            createWritable: async () => { let buf = ''; return { write: async x => { buf += String(x); }, close: async () => { files[n] = buf; } }; } }; },
        getDirectoryHandle: async () => dir, removeEntry: async n => { delete files[n]; },
        values: async function* () { for (const n of Object.keys(files)) yield { kind: 'file', name: n, getFile: async () => ({ text: async () => files[n] }) }; } };
      X.w.__fold = dir;
      ev(`_liveCfg=Object.assign(liveCfg(), {store:true, mode:'drive', on:false}); _driveDir=globalThis.__fold; 'ok'`);
      const pushed = await X.ev('driveStorePush(false)');
      const fn = Object.keys(files).find(n => /^spmt-2027-om\.json$/.test(n));
      const j = JSON.parse(files[fn]); j.store.ts = (+j.store.ts || 0) + 60000; j.ts = j.store.ts; j.by = 'Colleague C'; j.store.by = 'Colleague C';
      j.store.years[String(j.store.cur)].desc = Object.assign({}, j.store.years[String(j.store.cur)].desc || {}, { R: 'COLLEAGUE DESC R' });
      files[fn] = J(j);
      ev(`setDesc('A','MY UNSAVED A'); DIRTY=false; 'ok'`);        // typed, kept in browser storage only; then a new session
      // v2.00 (U10, the round-3 test review): a Live refresh started on the working plan, PB27 put on screen while the folder's copy
      // is read. The gate is checked after the last wait, so this is refused as well; one checked before the waits let it through.
      X.w.__duringRead = () => ev(`cycView(${J(key)}); 'ok'`);
      const p0 = await X.ev('driveStorePull(true)');
      w5Chk(name, 'a Live refresh started on the working plan, PB27 put on screen while the folder’s copy is read', 'nothing loaded, nothing kept aside, and the work is still this browser’s unsaved work',
        J([p0, ev('CYCVIEW'), keptAside(ev), own(ev), ev('!!baseGet().dirty')]), J([false, 'PB|2027', 'none', [['11111'], 'MY UNSAVED A', ''], true]));
      ev(`cycLeave(); 'ok'`);
      ev(`cycView(${J(key)}); 'ok'`); spy(ev);
      const s1a = said(ev), p1 = await X.ev('driveStorePull(true)'), s1b = said(ev);
      w5Chk(name, 'PB27 viewed · a Live refresh finds Colleague C’s newer copy in the shared folder', 'nothing loaded, nothing kept aside, and the work is still this browser’s unsaved work',
        J([pushed, p1, keptAside(ev), own(ev), ev('!!baseGet().dirty')]), J([true, false, 'none', [['11111'], 'MY UNSAVED A', ''], true]));
      // v2.00 (U10, the round-3 test review): the Live timer's quiet refresh changed nothing, and says nothing
      w5Chk(name, 'PB27 viewed · a Live refresh (quiet) finds Colleague C’s newer copy', 'the status line is as it was: nothing was changed, so nothing is said', J(s1b === s1a), J(true));
      const p2 = await X.ev('driveStorePull(false)');
      w5Chk(name, 'PB27 viewed · 📡 Connect (a refresh that speaks)', 'refused, and the status line says so', J([p2, said(ev)]), J([false, OFF('Loading O&M FY27 from the shared folder')]));
      ev(`cycLeave(); 'ok'`);
      const p3 = await X.ev('driveStorePull(true)');
      w5Chk(name, 'PB27 viewed · the view left · the next Live refresh', 'the work (MY UNSAVED A) is kept aside first, and Colleague C’s copy is loaded (COLLEAGUE DESC R)',
        J([p3, keptAside(ev), own(ev)]), J([true, J(['folder', 'MY UNSAVED A']), [['11111'], 'WORK DESC A', 'COLLEAGUE DESC R']]));
    }
    w5Chk(name, 'harness', 'CONTROL — no jsdom script errors', J(boards.reduce((n, B) => n + B.errors.length, 0)), J(0));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// v2.19 (item 150): removed with its feature -- v2.00 (U10) — partner money, FMS money or a year refused in a locked view is in no total and no export
// ==== end v2.00 (U10, the funds flow's money) ====
// ==== v2.00 (U10, Load theirs): a view put on screen while Load theirs reads the shared folder keeps nothing aside ====
// The U10 money review, round 3 (probe P9, 13 Oct): Load theirs (the choice the board offers when a colleague saved a newer copy
// and this browser holds unsaved work) was refused up front in a view, but not once the folder had been read. Started on the
// working plan with PB27 put on screen while the folder was read, it kept the locked cycle aside as this browser's work and then
// said "Loading a board is off … the change was not kept"; back on the working plan, Load theirs was refused because work was
// already kept aside, and "put it back" made PB27's plan the working plan ("Put back the work kept aside"), with the real work
// swapped into the kept slot. The same door the shared folder's refresh closes in the U10 doors block ("the files, packages,
// ladder and shared copies"), section 7: the board, its helpers and the fake shared folder are that section's own, with one
// hook: reading the folder's copy puts PB27 on screen.
// By hand: nothing is kept aside, and the work typed (MY UNSAVED A) is still this browser's unsaved work; after leaving the
// view, Load theirs keeps MY UNSAVED A aside first and loads Colleague C's copy (COLLEAGUE DESC R).
// FAILS ON 7ee498a (board fce8a391) and on U10 1-4: the cycle is kept aside (A's description blank, as PB27 holds it), and
// Load theirs after leaving the view is refused ("this browser already keeps earlier work aside"). CONTROLS: the folder copy
// written by this board's own save; no jsdom errors.
await (async () => {
  const name = 'v2.00 (U10) — a view put on screen while Load theirs reads the shared folder keeps nothing aside';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  const boards = [];
  try {
    const J = JSON.stringify;
    // one board, booted twice so it holds requirement data of its own (not the empty template), PB27 locked, then WORK DESC A
    const mk = () => {
      const X0 = boot(); boards.push(X0);
      seed(X0.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('A', 'AV', [900, 200, 0]), it('R', 'AV', [503, 127, 0])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['A', 'R'] });
      X0.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
        MS.rcn=[{k:'K1', rcn:'11111', eeic:'AAAAA', t:'', svc:['USAF','ANG','AFRC']}]; S.rcnAsg={A:'K1'};
        S.wbs={A:[{w:'1.1', v:[]}]}; applyState(S); save(); 'ok'`);   // v2.19 (item 150): the estimate, this block's old canary, is gone
      const ls = JSON.parse(X0.ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
      const X = boot({ ls }); boards.push(X);
      const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
      ev(`globalThis.__wb=function(sheets, name){ var b=buildXlsx(sheets); return {name:name, arrayBuffer: async function(){ __reads++; return b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength); }}; };
        globalThis.__reads=0;
        // what a download hands out: the text of every Blob made while the code runs
        globalThis.__handed=function(code){ var got=[], _B=window.Blob;
          window.Blob=function(p,o){ try{ (p||[]).forEach(function(x){ if(typeof x==='string' && x.indexOf('spmtPkg')>=0) got.push(x); }); }catch(e){} return new _B(p,o); };
          try{ (0,eval)(code); }catch(e){ got.push('threw '+String((e&&e.message)||e)); } window.Blob=_B; return JSON.stringify(got); };
        'ok'`);
      const key = ev(`window.confirm=function(){ return true; }; MS.base=MS.cur; MS.years[MS.cur]=S; save(); blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
      ev(`setDesc('A','WORK DESC A'); 'ok'`);
      return { X, ev, key };
    };
    const said = ev => ev(`(document.getElementById('shareStat')||{}).textContent||''`);
    const spy = ev => ev(`window.__asked=[]; window.confirm=function(m){ window.__asked.push(String(m).split('\\n')[0].slice(0,70)); return true; };
      window.alert=function(m){ window.__asked.push('alert: '+String(m).split('\\n')[0].slice(0,70)); }; 'ok'`);
    // this appropriation's own copy in browser storage: its RCN codes and its descriptions
    const own = ev => JSON.parse(ev(`(function(){ var s=JSON.parse(localStorage.getItem(_AP.key)||'null'); if(!s) return 'null';
      var y=(s.years||{})[String(s.cur)]||{}; return JSON.stringify([(s.rcn||[]).map(function(e){ return e.rcn; }), (y.desc||{}).A||'', (y.desc||{}).R||'']); })()`));
    const keptAside = ev => ev(`(function(){ var k=localStorage.getItem(_AP.key+'.kept'); if(!k) return 'none'; var i=k.indexOf('\\n'), m=JSON.parse(k.slice(0,i)), s=JSON.parse(k.slice(i+1));
      var y=(s.years||{})[String(s.cur)]||{}; return JSON.stringify([m.why, (y.desc||{}).A||'']); })()`);
    const OFF = what => '🔒 ' + what + ' is off while PB27 is on screen. It is a locked cycle, read only — the change was not kept. ↩ Leave the view to work the plan.';
    const { X, ev, key } = mk();
    const files = {};
    const dir = { kind: 'directory', name: 'shared', queryPermission: async () => 'granted', requestPermission: async () => 'granted',
      getFileHandle: async (n, o) => { if (!(n in files)) { if (o && o.create) files[n] = ''; else { const e = new Error('not found'); e.name = 'NotFoundError'; throw e; } }
        return { kind: 'file', name: n, getFile: async () => { const c = files[n]; if (X.w.__onRead && /^spmt-2027-om\.json$/.test(n)) { const f = X.w.__onRead; X.w.__onRead = null; f(); } return { text: async () => c }; },
          createWritable: async () => { let buf = ''; return { write: async x => { buf += String(x); }, close: async () => { files[n] = buf; } }; } }; },
      getDirectoryHandle: async () => dir, removeEntry: async n => { delete files[n]; },
      values: async function* () { for (const n of Object.keys(files)) yield { kind: 'file', name: n, getFile: async () => ({ text: async () => files[n] }) }; } };
    X.w.__fold = dir;
    ev(`_liveCfg=Object.assign(liveCfg(), {store:true, mode:'drive', on:false}); _driveDir=globalThis.__fold; 'ok'`);
    const pushed = await X.ev('driveStorePush(false)');
    const fn = Object.keys(files).find(n => /^spmt-2027-om\.json$/.test(n));
    w5Chk(name, 'fixture', 'CONTROL — this board saved its copy to the shared folder', J([pushed, !!fn]), J([true, true]));
    const j = JSON.parse(files[fn]); j.store.ts = (+j.store.ts || 0) + 60000; j.ts = j.store.ts; j.by = 'Colleague C'; j.store.by = 'Colleague C';
    j.store.years[String(j.store.cur)].desc = Object.assign({}, j.store.years[String(j.store.cur)].desc || {}, { R: 'COLLEAGUE DESC R' });
    files[fn] = J(j);
    ev(`setDesc('A','MY UNSAVED A'); DIRTY=false; 'ok'`);        // typed, kept in browser storage only; then a new session
    spy(ev);
    X.w.__onRead = () => X.w.eval(`cycView(${J(key)})`);           // PB27 put on screen while the folder's copy is read
    const r1 = await X.ev(`driveResolve('theirs')`);
    w5Chk(name, 'Load theirs on the working plan · PB27 put on screen while the folder is read', 'refused, and the status line says so; nothing is kept aside, and the work is still this browser’s unsaved work',
      J([r1, ev('CYCVIEW'), said(ev), keptAside(ev), own(ev), ev('!!baseGet().dirty')]), J([false, 'PB|2027', OFF('Loading a board'), 'none', [['11111'], 'MY UNSAVED A', ''], true]));
    ev(`cycLeave(); 'ok'`);
    const r2 = await X.ev(`driveResolve('theirs')`);
    w5Chk(name, 'Load theirs on the working plan · PB27 put on screen while the folder is read · the view left, Load theirs again', 'the work (MY UNSAVED A) is kept aside first, and Colleague C’s copy is loaded (COLLEAGUE DESC R)',
      J([r2, keptAside(ev), own(ev)]), J([true, J(['folder', 'MY UNSAVED A']), [['11111'], 'WORK DESC A', 'COLLEAGUE DESC R']]));
    // ---- v2.00 (U10, Save yours over theirs): the same race for the other choice (the U10 money review, round 4, SF1; the test
    // review, round 4, m2). Colleague C saves again (COLLEAGUE DESC R2) and this browser types MY SECOND A; Save yours over theirs
    // is pressed on the working plan, and PB27 is put on screen while the folder's copy is read. By hand: refused as a save is
    // ("Writing to the shared folder is off"), before its question -- nothing asked, nothing written to the folder or its history,
    // the folder's copy still Colleague C's, the work still unsaved. FAILS ON 7ee498a and on U10 1-5 of 9: the question is asked
    // and Colleague C's copy is written to the folder's history before the save is refused; on U10 6 and 7 of 9 nothing is asked or
    // written, but the refusal names Load theirs' door ("Loading a board is off"). CONTROL: after leaving the view the same choice
    // asks once, keeps Colleague C's copy in the history and writes this browser's work over it.
    const j2 = JSON.parse(files[fn]); j2.store.ts = (+j2.store.ts || 0) + 60000; j2.ts = j2.store.ts;
    j2.store.years[String(j2.store.cur)].desc = Object.assign({}, j2.store.years[String(j2.store.cur)].desc || {}, { R: 'COLLEAGUE DESC R2' });
    files[fn] = J(j2);
    const f2 = files[fn], n2 = Object.keys(files).length;
    ev(`setDesc('A','MY SECOND A'); 'ok'`);
    spy(ev);
    X.w.__onRead = () => X.w.eval(`cycView(${J(key)})`);           // PB27 put on screen while the folder's copy is read
    const r3 = await X.ev(`driveResolve('mine')`);
    w5Chk(name, 'Save yours over theirs on the working plan · PB27 put on screen while the folder is read', 'refused as a save is, before its question; nothing is written to the folder or its history, and the work is still this browser’s unsaved work',
      J([r3, ev('CYCVIEW'), said(ev), ev('JSON.stringify(window.__asked)'), files[fn] === f2, Object.keys(files).length === n2, own(ev), ev('!!baseGet().dirty')]),
      J([false, 'PB|2027', OFF('Writing to the shared folder'), '[]', true, true, [['11111'], 'MY SECOND A', 'COLLEAGUE DESC R'], true]));
    ev(`cycLeave(); 'ok'`);
    spy(ev);
    const r4 = await X.ev(`driveResolve('mine')`), now = JSON.parse(files[fn]).store;
    const inHist = Object.keys(files).filter(n => n !== fn && String(files[n]).indexOf('COLLEAGUE DESC R2') >= 0).length;
    w5Chk(name, 'Save yours over theirs on the working plan · PB27 put on screen while the folder is read · the view left, Save yours over theirs again', 'CONTROL — asked once; Colleague C’s copy is kept in the folder’s history and this browser’s work (MY SECOND A) is written over it',
      J([r4, JSON.parse(ev('JSON.stringify(window.__asked)')).length, inHist > 0, ((now.years[String(now.cur)] || {}).desc || {}).A || '', ev('!!baseGet().dirty')]),
      J([true, 1, true, 'MY SECOND A', false]));
    // ---- v2.00 (U10, Save yours over theirs drawn by a Connect in the view): the U10 money review, round 5, probe P15. Colleague C
    // saves 5 ms after the copy this browser wrote (COLLEAGUE DESC R3), this browser then types MY THIRD A, PB27 is put on screen
    // and the shared folder's Connect is pressed: the folder's copy is no newer than what is on screen but is not the copy the work
    // came from, so the clash is drawn, with both choices, in the view. Save yours over theirs pressed there is refused as a save
    // is ("Writing to the shared folder is off"), nothing asked or written, the work still unsaved. FAILS ON 7ee498a and on U10 1-10
    // of 12: the same press is refused in Load theirs' words ("Loading a board is off"), by driveResolve's own gate. CONTROL: the
    // Connect draws the clash, with both choices, while PB27 is on screen.
    await new Promise(r => setTimeout(r, 20));    // the board's own deferred timers (the opening's folder connect) run first, on its own copy
    const j3 = JSON.parse(files[fn]); j3.store.ts = (+j3.store.ts || 0) + 5; j3.ts = j3.store.ts;
    j3.store.years[String(j3.store.cur)].desc = Object.assign({}, j3.store.years[String(j3.store.cur)].desc || {}, { R: 'COLLEAGUE DESC R3' });
    files[fn] = J(j3);
    const f3 = files[fn], n3 = Object.keys(files).length;
    ev(`setDesc('A','MY THIRD A'); cycView(${J(key)}); _liveCfg=Object.assign(liveCfg(), {folder:'shared'}); 'ok'`);
    spy(ev);
    await X.ev(`driveConnectNow()`);
    w5Chk(name, 'PB27 viewed · the shared folder’s Connect pressed', 'CONTROL — the clash is drawn in the view, with Load theirs and Save yours over theirs',
      J([ev('CYCVIEW'), ev(`JSON.stringify([].slice.call(document.querySelectorAll('#shareStat button')).map(function(b){ return b.getAttribute('onclick')||''; }))`)]),
      J(['PB|2027', J(["driveResolve('theirs')", "driveResolve('mine')"])]));
    const p5 = ev(`(function(){ var b=[].slice.call(document.querySelectorAll('#shareStat button')).filter(function(x){ return (x.getAttribute('onclick')||'')==="driveResolve('mine')"; })[0]; if(!b) return 'no button'; b.click(); return 'pressed'; })()`);
    await new Promise(r => setTimeout(r, 30));
    w5Chk(name, 'PB27 viewed · the shared folder’s Connect pressed · Save yours over theirs pressed in the view', 'refused as a save is; nothing asked, nothing written to the folder or its history, and the work is still this browser’s unsaved work',
      J([p5, ev('CYCVIEW'), said(ev), ev('JSON.stringify(window.__asked)'), files[fn] === f3, Object.keys(files).length === n3, own(ev), ev('!!baseGet().dirty')]),
      J(['pressed', 'PB|2027', OFF('Writing to the shared folder'), '[]', true, true, [['11111'], 'MY THIRD A', 'COLLEAGUE DESC R'], true]));
    ev(`cycLeave(); 'ok'`);
    // ---- v2.00 (U10, Load theirs without keeping yours): the same race for the third choice (the U10 test review, round 5, m1).
    // "Load theirs without keeping yours" (offered when there is no room to keep this browser's work aside) is pressed on the working
    // plan, and PB27 is put on screen while the folder's copy is read. By hand: refused as Load theirs is ("Loading a board is off"),
    // before its question -- nothing asked, nothing loaded or written, the work still unsaved. FAILS ON 7ee498a and on U10 1-5 of 12:
    // its question ("Load …’s copy of O&M FY27 and replace what is on screen?") is asked before the load is refused.
    const f4 = files[fn], n4 = Object.keys(files).length;
    spy(ev);
    X.w.__onRead = () => X.w.eval(`cycView(${J(key)})`);           // PB27 put on screen while the folder's copy is read
    const r6 = await X.ev(`driveResolve('theirs!')`);
    w5Chk(name, 'Load theirs without keeping yours on the working plan · PB27 put on screen while the folder is read', 'refused as Load theirs is, before its question; nothing is loaded or written, and the work is still this browser’s unsaved work',
      J([r6, ev('CYCVIEW'), said(ev), ev('JSON.stringify(window.__asked)'), files[fn] === f4, Object.keys(files).length === n4, own(ev), ev('!!baseGet().dirty')]),
      J([false, 'PB|2027', OFF('Loading a board'), '[]', true, true, [['11111'], 'MY THIRD A', 'COLLEAGUE DESC R'], true]));
    ev(`cycLeave(); 'ok'`);
    // ---- v2.00 (U10, Save yours over theirs queued behind a save): the U10 money review, round 5, SF1, at the last of the three
    // gates. Save yours over theirs is pressed on the working plan while a save is under way, so it waits; PB27 is put on screen
    // before that save finishes. By hand: refused as a save is ("Writing to the shared folder is off"), before its question --
    // nothing asked, nothing written to the folder or its history, the work still unsaved. FAILS ON 7ee498a and on U10 1-10 of 12:
    // refused in Load theirs' words ("Loading a board is off"). CONTROL: the press waited for that save.
    const f5 = files[fn], n5 = Object.keys(files).length;
    spy(ev);
    ev(`window.__hold=saveSerial(function(){ return new Promise(function(r){ window.__rel=r; }); }); 'ok'`);    // a save under way
    await new Promise(r => setTimeout(r, 0));
    ev(`window.__q=driveResolve('mine'); 'ok'`);
    const s7 = said(ev);
    ev(`cycView(${J(key)}); window.__rel(true); 'ok'`);              // PB27 put on screen, then that save finishes
    const r7 = await X.w.__q;
    w5Chk(name, 'Save yours over theirs pressed on the working plan while a save is under way', 'CONTROL — it waits for that save, and says so',
      J(s7), J('⏳ A save is already under way — this one runs as soon as it finishes.'));
    w5Chk(name, 'Save yours over theirs pressed on the working plan while a save is under way · PB27 put on screen before it runs', 'refused as a save is, before its question; nothing is written to the folder or its history, and the work is still this browser’s unsaved work',
      J([r7, ev('CYCVIEW'), said(ev), ev('JSON.stringify(window.__asked)'), files[fn] === f5, Object.keys(files).length === n5, own(ev), ev('!!baseGet().dirty')]),
      J([false, 'PB|2027', OFF('Writing to the shared folder'), '[]', true, true, [['11111'], 'MY THIRD A', 'COLLEAGUE DESC R'], true]));
    ev(`cycLeave(); 'ok'`);
    w5Chk(name, 'harness', 'CONTROL — no jsdom script errors', J(boards.reduce((n, B) => n + B.errors.length, 0)), J(0));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.00 (U10, Load theirs) ====
// ==== v2.00 (U10, the change journal): ↶ Put back in a locked view is refused before the journal is touched ====
// The U10 money review, round 4 (probe P11): the change journal's ↶ Put back is a write a locked view refuses -- its save() is --
// but before that save it re-takes the journal's shadow (jrnlSync) from the copy on screen, the locked cycle's years. The refusal
// puts the copy back and not the shadow, so the first save on the working plan after leaving the view wrote every difference
// between the cycle and the working plan into the journal as a change made then, by whoever saved. The journal travels in every
// saved board and shared-folder copy, and the PPBE cycle's changes table names its newest entry as who changed a requirement.
// On an O&M board of two requirements (F1 PSM, $1,000,000,000 asked; F2 PSM, $200,000,000) PB27 is locked; then, on the working
// plan, Colleague C asks $1,200,000,000 for F1 and writes a note on F1. Me M views PB27 and presses ↶ Put back on Colleague C's
// note (answered OK): refused. Back on the working plan Me M writes a note on F2, and it is saved. FAILS ON 7ee498a (board
// fce8a391) and on U10 1-6 of 6: that save records three entries by Me M -- F1's note, F1's $1,200,000,000 and F2's note --
// the board file carries them, the cycle's table credits Me M with F1, and ↶ Put back is offered on an entry saying Me M asked
// $1,200,000,000 for F1. CONTROLS: the fixture; on the working plan (no view) ↶ Put back on the same note is allowed and
// recorded once; F1's requirement is the working plan's $1,200,000,000 throughout. Every expected entry and figure is typed here.
await (async () => {
  const name = 'v2.00 (U10) — ↶ Put back in a locked view is refused and leaves the change journal as it was';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify, M = 1000000;
    const X = boot();
    seed(X.ev, { services: ['USAF'], items: [it('F1', 'PSM', [1000 * M]), it('F2', 'PSM', [200 * M])], disc: [500 * M], mand: [0], order: ['F1', 'F2'] });
    const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    ev(`window.confirm=function(){ return true; };
      BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      MS.base=2027; MS.cur=2027; FYMON=fyMonths(2027); MS.years={2027:S}; applyState(S); MS.years[2027]=S;
      localStorage.setItem('prio27who','Colleague C'); jrnlSync(); save(); 'ok'`);
    const key = ev(`blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
    // after the lock, on the working plan: Colleague C's two changes, each saved
    ev(`setAsk('F1', 0, '1200000000'); S.notes.F1='after the lock'; save(); 'ok'`);
    // the journal: [who, field, was, became] for each entry
    const jr = () => JSON.parse(ev(`JSON.stringify((MS.jrnl||[]).map(function(e){ return [e.by, (e.p||[]).join('.'), e.a, e.b]; }))`));
    const notKept = () => /the change was not kept|Not kept/.test(ev(`(document.getElementById('shareStat')||{}).textContent||''`));
    const ask = () => ev(`String(itemById('F1').ask[0])`);
    // the ↶ Put back the journal panel draws for the newest entry by `who` on `field`
    const putBack = (who, field) => ev(`(function(){ if(!jrnlOpen) toggleJrnl(); var L=MS.jrnl||[], i=-1;
      for(var k=L.length-1; k>=0; k--) if(L[k].by===${J(who)} && (L[k].p||[]).join('.')===${J(field)}){ i=k; break; }
      var b=[].slice.call(document.querySelectorAll('#jrnlBody button')).filter(function(e){ return (e.getAttribute('onclick')||'')==='jrnlUndo('+i+')'; })[0];
      if(!b) return 'no control'; b.click(); return 'fired'; })()`);
    const shut = () => ev(`if(jrnlOpen) toggleJrnl(); 'ok'`);
    // v2.13 (item 136): the lock tags the untagged plan PB27, and every change of cycle is a journal line now (cycJrnlLine)
    const C2 = [['Colleague C', '(cycle)', null, 'PB|2027'], ['Colleague C', 'asks.F1', null, [1200000000]], ['Colleague C', 'notes.F1', null, 'after the lock']];
    w5Chk(name, 'fixture', 'CONTROL — PB27 is locked; Colleague C’s two changes are the journal, and F1 asks $1,200,000,000',
      J([key, jr(), ask()]), J(['PB|2027', C2, '1200000000']));
    // ---- PB27 viewed; Me M presses ↶ Put back on Colleague C's note (answered OK) -- refused
    ev(`localStorage.setItem('prio27who','Me M'); cycView(${J(key)}); 'ok'`);
    ev(`window.__asked=[]; window.confirm=function(m){ window.__asked.push(String(m).split('\\n')[0].slice(0,70)); return true; }; 'ok'`);
    const pf = putBack('Colleague C', 'notes.F1'), pk = notKept();
    const ps = ev(`(document.getElementById('shareStat')||{}).textContent||''`), pa = ev('JSON.stringify(window.__asked)');
    w5Chk(name, 'PB27 viewed · ↶ Put back on Colleague C’s note on F1, answered OK', 'refused and said so; the view holds the cycle’s F1 ($1,000,000,000, no note) and the journal is as it was',
      J([pf, pk, ev('CYCVIEW'), ev(`String(itemById('F1').ask[0])`), ev(`String((S.notes||{}).F1||'')`), jr()]), J(['fired', true, 'PB|2027', '1000000000', '', C2]));
    // v2.00 (U10, the test review of round 5): refused up front -- before its question, in its own words. A put-back that asked first,
    // or ran on to its own save and said "↶ Put back: … recorded in the journal" under the view's mark, passed every check above.
    w5Chk(name, 'PB27 viewed · ↶ Put back on Colleague C’s note on F1', 'refused before its question, in its own words: nothing is asked, and nothing says the put-back was recorded',
      J([ps, pa]), J(['🔒 Putting a change back is off while PB27 is on screen. It is a locked cycle, read only — the change was not kept. ↩ Leave the view to work the plan.', '[]']));
    shut(); ev(`cycLeave(); 'ok'`);
    // ---- back on the working plan, Me M writes a note on F2: the save records that one change, and nothing of the cycle's
    const n0 = jr().length;
    ev(`S.notes.F2='mine'; save(); 'ok'`);
    w5Chk(name, 'the view left · Me M’s note on F2 saved', 'the journal records one change, Me M’s note on F2 -- nothing credited to Me M on F1',
      J([jr().slice(n0), ask()]), J([[['Me M', 'notes.F2', null, 'mine']], '1200000000']));
    // the board file the working plan saves, read from its bytes: every journal entry it carries by Me M
    const file = ev(`(function(){ var h=buildSavedHtml(), m=/<script type="application\\/json" id="pubState">([\\s\\S]*?)<\\/script>/.exec(h);
      if(!m) return '"no state"'; var st=(JSON.parse(m[1]).appns||{})[mySlug()]||{};
      return JSON.stringify((st.jrnl||[]).filter(function(e){ return e.by==='Me M'; }).map(function(e){ return [(e.p||[]).join('.'), e.a, e.b]; })); })()`);
    // the PPBE cycle's changes table: who changed F1 since PB27; and whether ↶ Put back is offered on any entry by Me M naming F1
    const who = ev(`cycWho('F1', (blGet(${J(key)})||{}).ts||0, 2027)`).split(' · ')[0];
    const offered = ev(`(function(){ if(!jrnlOpen) toggleJrnl(); var L=MS.jrnl||[];
      return [].slice.call(document.querySelectorAll('#jrnlBody button')).filter(function(b){ var m=/^jrnlUndo\\((\\d+)\\)$/.exec(b.getAttribute('onclick')||'');
        var e=m? L[+m[1]] : null; return e && e.by==='Me M' && (e.p||[]).indexOf('F1')>=0; }).length; })()`);
    shut();
    w5Chk(name, 'the view left · Me M’s note on F2 saved', 'the board file carries only Me M’s note on F2; the cycle’s table credits Colleague C with F1; no ↶ Put back is offered on an entry by Me M about F1',
      J([JSON.parse(file), who, offered]), J([[['notes.F2', null, 'mine']], 'Colleague C', 0]));
    // ---- CONTROL: on the working plan, the same ↶ Put back is allowed, and the journal records it once
    const n1 = jr().length, wf = putBack('Colleague C', 'notes.F1'), wk = notKept();
    shut();
    w5Chk(name, 'the working plan · ↶ Put back on Colleague C’s note on F1 (allowed)', 'CONTROL — the note is gone, the journal records Me M putting it back, and F1 still asks $1,200,000,000',
      J([wf, wk, ev(`String((S.notes||{}).F1||'')`), jr().slice(n1), ask()]), J(['fired', false, '', [['Me M', 'notes.F1', 'after the lock', null]], '1200000000']));
    w5Chk(name, 'harness', 'CONTROL — no jsdom script errors', J(X.errors.length), J(0));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// v2.19 (item 150): removed with its feature -- v2.00 (U10) — an appropriation button, the pseudo year, a prime rule or a category refused in a locked view moves no money in any total or export
// v2.19 (item 150): removed with its feature -- v2.00 (U10) — holding the unfunded list outside the flow, refused in a locked view, moves no money in any total or export
// ==== end v2.00 (U10, the unfunded list's place) ====
// ==== v2.00 (U10, the work kept aside): “↶ work kept aside” pressed in a locked view is refused before anything is asked or kept ====
// The U10 money review, round 5 (probe P14, 14 Oct): the top bar offers "↶ work kept aside" while a locked cycle is on screen.
// Pressed there, it asked "Put back the work this browser kept aside …? … What is on screen now has changes no saved copy has, so
// it is kept aside in its place — nothing is lost", though what is on screen is the locked cycle; wrote the cycle into the kept
// slot over the kept work; met the view's refusal ("Loading a board is off"); and only then wrote the kept work back. Nothing was
// lost while that last write succeeded, but the answer to its question was thrown away -- and had browser storage refused that
// write, the kept work was gone and the slot held the locked cycle, which "put it back" would make the working plan.
// Work is kept aside (KEPT NOTE on F1, kept when Colleague C's copy displaced it) and the working plan holds unsaved work of its
// own (MINE NOTE on F2); PB27 is locked earlier and viewed, and the top bar's "↶ work kept aside" is pressed (answered OK). By
// hand: refused before its question -- nothing asked, the kept slot never written, browser storage byte for byte as it was.
// FAILS ON 7ee498a (board fce8a391) and on U10 1-11 of 12: the question is asked and the slot is written twice (the cycle, then
// the kept work back). CONTROLS: the fixture; the button drawn in the view; the view left (MINE NOTE on the working plan,
// unsaved; KEPT NOTE still kept); on the working plan the same button puts KEPT NOTE back, asked once, and keeps MINE NOTE aside
// in its place. Every expected value is typed here.
await (async () => {
  const name = 'v2.00 (U10) — “↶ work kept aside” pressed in a locked view is refused before anything is asked or kept';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify, M = 1000000;
    const X = boot();
    seed(X.ev, { services: ['USAF'], items: [it('F1', 'PSM', [1000 * M]), it('F2', 'PSM', [200 * M])], disc: [500 * M], mand: [0], order: ['F1', 'F2'] });
    const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    ev(`window.confirm=function(){ return true; };
      BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      MS.base=2027; MS.cur=2027; FYMON=fyMonths(2027); MS.years={2027:S}; applyState(S); MS.years[2027]=S;
      localStorage.setItem('prio27who','Me M'); save(); 'ok'`);
    const key = ev(`blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
    // the work kept aside: the board as it stood, with KEPT NOTE on F1, kept when Colleague C's copy displaced it
    const kp = ev(`(function(){ var k=JSON.parse(JSON.stringify(MS)); k.years[2027].notes={F1:'KEPT NOTE'};
      return String(keepAside(k, {why:'folder', by:'Colleague C', ts:Date.now()}, baseGet())); })()`);
    // then unsaved work on the working plan
    ev(`S.notes.F2='MINE NOTE'; save(); DIRTY=true; render(); 'ok'`);
    // the kept slot: [why it was kept, the FY27 notes it holds]; the notes on screen; this appropriation's own copy's FY27 notes
    const slot = () => JSON.parse(ev(`(function(){ var s=localStorage.getItem(_AP.key+'.kept'); if(!s) return '"none"'; var i=s.indexOf('\\n'), m=JSON.parse(s.slice(0,i)), st=JSON.parse(s.slice(i+1));
      return JSON.stringify([m.why, ((st.years||{})['2027']||{}).notes||null]); })()`));
    const screen = () => JSON.parse(ev('JSON.stringify(S.notes||null)'));
    const stored = () => JSON.parse(ev(`JSON.stringify((((JSON.parse(localStorage.getItem(_AP.key)||'null')||{}).years||{})['2027']||{}).notes||null)`));
    // the kept slot and this appropriation's own copy, byte for byte
    const raw = () => ev(`String(localStorage.getItem(_AP.key+'.kept'))+'\\n----\\n'+String(localStorage.getItem(_AP.key))`);
    const said = () => ev(`(document.getElementById('shareStat')||{}).textContent||''`);
    // the top bar's button, pressed as a person would; every question asked (its first words) and every write to the kept slot
    const press = () => ev(`(function(){ var b=document.querySelector('#saveState button.keptbtn'); if(!b) return 'no button'; b.click(); return 'pressed'; })()`);
    const spy = () => ev(`window.__asked=[]; window.confirm=function(m){ window.__asked.push(String(m).split('\\n')[0].slice(0,44)); return true; };
      window.__slotW=[]; if(!window.__setI){ window.__setI=Storage.prototype.setItem; window.__remI=Storage.prototype.removeItem;
        Storage.prototype.setItem=function(k,v){ if(/\\.kept$/.test(String(k))) window.__slotW.push('set'); return window.__setI.apply(this, arguments); };
        Storage.prototype.removeItem=function(k){ if(/\\.kept$/.test(String(k))) window.__slotW.push('remove'); return window.__remI.apply(this, arguments); }; } 'ok'`);
    w5Chk(name, 'fixture', 'CONTROL — PB27 is locked; KEPT NOTE is kept aside; the working plan holds MINE NOTE, unsaved',
      J([key, kp, slot(), screen(), stored(), ev('String(DIRTY)')]),
      J(['PB|2027', 'true', ['folder', { F1: 'KEPT NOTE' }], { F2: 'MINE NOTE' }, { F2: 'MINE NOTE' }, 'true']));
    const ls0 = raw();
    // ---- CONTROL: PB27 viewed -- the top bar still offers the button
    ev(`cycView(${J(key)}); 'ok'`);
    w5Chk(name, 'PB27 viewed', 'CONTROL — the cycle is on screen (no notes), and the top bar offers “↶ work kept aside”',
      J([ev('CYCVIEW'), screen(), ev(`document.querySelectorAll('#saveState button.keptbtn').length`)]), J(['PB|2027', {}, 1]));
    // ---- PB27 viewed: "↶ work kept aside" pressed, answered OK -- refused up front
    spy();
    const pv = press(), sv = said();
    w5Chk(name, 'PB27 viewed · “↶ work kept aside” pressed, answered OK', 'refused before its question, in its own words: nothing asked, the kept slot never written, browser storage as it was, the cycle still on screen',
      J([pv, sv, ev('JSON.stringify(window.__asked)'), ev('JSON.stringify(window.__slotW)'), raw() === ls0, ev('CYCVIEW'), screen()]),
      J(['pressed', '🔒 Putting back the work kept aside is off while PB27 is on screen. It is a locked cycle, read only — the change was not kept. ↩ Leave the view to work the plan.',
        '[]', '[]', true, 'PB|2027', {}]));
    // ---- CONTROL: the view left -- the working plan as it was, and the kept work still kept
    ev(`cycLeave(); 'ok'`);
    w5Chk(name, 'refused · the view left', 'CONTROL — the working plan holds MINE NOTE, unsaved, and KEPT NOTE is still kept aside',
      J([ev('CYCVIEW'), screen(), stored(), ev('String(DIRTY)'), slot()]),
      J(['', { F2: 'MINE NOTE' }, { F2: 'MINE NOTE' }, 'true', ['folder', { F1: 'KEPT NOTE' }]]));
    // ---- CONTROL: on the working plan the same button is allowed: KEPT NOTE comes back, and MINE NOTE is kept aside in its place
    spy();
    const pw = press();
    w5Chk(name, 'the working plan · “↶ work kept aside” pressed, answered OK (allowed)', 'CONTROL — asked once; KEPT NOTE is put back on screen and in browser storage, and MINE NOTE is kept aside in its place',
      J([pw, ev('JSON.stringify(window.__asked)'), screen(), stored(), slot()]),
      J(['pressed', J(['Put back the work this browser kept aside on']), { F1: 'KEPT NOTE' }, { F1: 'KEPT NOTE' }, ['swap', { F2: 'MINE NOTE' }]]));
    ev(`if(window.__setI){ Storage.prototype.setItem=window.__setI; Storage.prototype.removeItem=window.__remI; } 'ok'`);
    w5Chk(name, 'harness', 'CONTROL — no jsdom script errors', J(X.errors.length), J(0));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.00 (U10, the work kept aside) ====
// ==== v2.00 (U32, U33): an RCN / EEIC list that repeats a key, or holds “__none__” or a key that is not text, never counts money twice; a file handed over with one is refused, and the user’s own board comes across saying what it holds ====
// Codex, 12 Oct (P1), as Brad supplied it: "Duplicate K1 registry entries." and "One registry entry named __none__." "Both accept an
// imported cycle and export USAF $1,800 / ANG $400 from independently expected $900 / $200. Preserve those expectations, include
// ordinary-key controls, and verify actual XLSX after import and reopening."
// THE MONEY, BY HAND: O&M, services USAF / ANG / AFRC, one requirement R1 asking USAF 900, ANG 200, AFRC 0. FUNDED: pots of 5,000 on
// each service, so discretionary funds all of it -- USAF 900, ANG 200, AFRC 0. Its one award is in FYMON[2], so every dollar sits in
// that month's column (the sheet's column 3) and none in NO DATE. R1 is the only requirement, so each service total is R1's money on
// it -- USAF 900, ANG 200, AFRC 0 -- and the grand total by month is 900 + 200 + 0 = 1,100. UNFUNDED: pots of 0, so R1 draws nothing
// and is listed under NOT FUNDED with its ask, the only figure there (the sheet's column 15): USAF 900, ANG 200 (AFRC asks 0, so it
// is not listed), every total 0. A list entry is a NAME for a combination: naming K1 twice adds no money, and no entry can add money
// that sits on no combination. The row R1 sits under is the entry the board shows R1 on: the FIRST entry whose key is R1's pointer
// exactly -- the number 1 is not the text "1" -- as the screen and the Spend Plan Source find it; none, when no entry's is.
// THE CASES: the user's own board -- R1, the list [K1] -- then that board's file with a list replaced. PB27's own list (Codex): [K1, K1]
// with R1 on K1 (Codex 1); [K1, “__none__”] with R1 on none (Codex 2), and with R1 on “__none__”. The working plan's list (the first
// round of verification): [K1, K1]; [1, "1"] -- a number, and the same name as text -- with R1 on "1"; and that list read by PB27 locked
// before v1.99, which kept no list of its own (an imported cycle). R1 UNFUNDED on [K1, K1] (the NOT FUNDED Ask). The second round of
// verification: R1 on the NUMBER 1 beside [1] and [1, "1"] (under 11111 / AAAAA, as the screen shows it -- d66dd60 got [1] right);
// [1] with R1 on "1" (no entry is "1": not assigned); [K1, K1] on two codes (the first row's); PB27 [K1, K1, “__none__”] (the full
// import names both); PB27 [null, K1] (the user's own board is taken: a cycle's reader leaves null out); and a hand-made file whose
// list has an entry keyed “constructor” (d66dd60's export threw). The third round: [K1, an entry keyed “”] with R1 on none (no
// pointer is on no combination, never on that entry); the working plan's [“K9”, K1] (the user's own board is taken: its readers
// stop only at null); PB27's [the number 1] with R1 on the number 1 (a locked cycle's list leaves that entry out, and the full
// import says so). The fourth round: the full import's words, written out whole and true for each requirement (Codex B2, 13 Oct,
// P2) -- PB27's [{k: 1, 99999 / ZZZZZ}] with R1 on the number 1, which reads none there, beside K1; the working plan's [{k: 0},
// K1] with R1 on the number 0, which no list reads; the working plan's [0, K1] and [[], K1] (the user's own board is taken); the
// user's own board holding PB27 [K1, K1], and what it writes -- its saved file and its one-appropriation file refused in words
// true for a file this version saved, its package taken; a file naming an earlier version, and a state file naming none. The
// fifth round: the user's own board whose working plan's list and PB27's both repeat K1 (a board that locked PB27 while its list
// repeated K1 holds both) -- its files are refused naming the locked cycle too, and only the ways that work; ✕ on the working plan's
// row leaves them refused, for PB27; its package is refused until that row goes, then taken; ⬇ Export one appropriation names no way
// back that refuses the file it wrote; the working plan's list kept as the file holds it through the full import ([K1, K1 on two
// codes], "K9", 0, []); a file whose working plan's list repeats K1 beside PB27's ordinary [K1] (the working plan's advice); PB27's
// [K1, K1, the number 1] (the full import says both); a board .html refused for "K9" or 0 in its working plan, told the ways that take
// it; a PMO copy, told no way that would put its reference of PB27 in place of the board's own; the help for Import one appropriation.
// The sixth round: a null entry in the working plan's list, refused among several files by ⇊ Import several boards -- the batch adds
// how many were not taken, and the words still name no way (beside PB27 [K1, K1], that locked cycle too); the user's own board whose
// working plan lists K1 twice, no locked cycle amiss -- ⬇ Export one appropriation's line before and after ✕, and an ordinary
// board's; a file whose working plan holds "K9" beside PB27 [K1, K1], and one whose working plan repeats K1 beside PB27 [null, K1],
// each told of the locked cycle too; a package and a PMO copy refused for "K9" in the working plan's list, told ✕, and for 0, no way.
// The seventh round: a lock while the working plan's list repeats K1, or holds "K9" -- the question says what the list it keeps holds,
// and that every file carrying the cycle will be refused, which holds after the lock and after ✕; ✕ on the repeated row first, and
// the lock asks what it always did; the ✕ way for every kind of entry it is said or not said for -- never for a locked cycle's "K9",
// not for false or "", but for 5 and [] (✕ clicked in the panel); a null entry among three files.
// The eighth round: the user's own board holding PB27 [K1, K1] unlocks it -- its saved file is refused in words that say only what
// holds, never that no board changes the list -- then deletes it, or locks over it, and the file written again is taken; a lock while
// the working plan's list holds the number 1 as a key, or “__none__”, says so first, as the door says it.
// CONTROLS: the same money on ordinary distinct keys, which every route exports right here and on d66dd60.
// THE ROUTES: (a) the door a file handed over passes (inboundCheck): refused, saying which list, what it holds and why. (a2) ⬅ Import
// one appropriation with that file: refused whole, in true words, browser storage byte-identical; (a3) ⇊ Import several boards, the
// same. (b) ⬅ Import a full board into the
// user's own board: taken -- an ORBIT before this one took such a list without a word and saved it, so refusing kept a whole board out
// of the new version -- and the question asked before anything is replaced says what the list holds; (b2) the same browser reopened,
// which says it again, PB27 (or the working plan) exported and the workbook read back from its bytes; (b3) saved, reopened, exported.
// (c) The file opened as a board (no door), exported; (c2) saved, reopened, exported. Then: a null entry in the working plan's list,
// refused at the door and by the full import; the door on a key repeated apart, three times, beginning with two underscores,
// missing, not text; the team's own copies -- the shared folder's, the sidecar's -- read with their lists as before; ✕ on a row
// that repeats a key; and Add
// RCN / EEIC in one millisecond, after a removal; ✕ on the FIRST of two rows with one key (as d66dd60: every assignment cleared).
// The third round: the door on keys every object answers to (refused in words, never a throw); the team's own copies holding
// null, then K1 (read as before); a full import that stops early (not a board, or answered no) leaves the next file handed over
// held to the whole rule; ✕ on a row that repeats a key is saved.
// FAILS ON d66dd60 (U14, the board of 7ee498a), 177 of its 288 checks: the door passes every list; Import one appropriation and Import
// several boards take the file; the full import takes it without a word; PB27 and the working plan export USAF 1,800 / ANG 400 / 2,200 --
// K1's row twice, the money on no combination under “__none__”'s codes and again as not assigned, 1 and "1" printed as two rows -- and
// the NOT FUNDED Ask USAF 1,800 / ANG 400; [1] with R1 on "1" prints under the number's codes, which the screen does not show it on; the
// “constructor” file's export throws; ✕ on the repeated row clears R1's assignment, and the same browser reopened has R1 off it;
// adds in one millisecond after a removal share a key; “constructor” twice is not refused; the words are not said; a file this
// version saved is taken by Import one appropriation and Import several boards, and its one-appropriation file prints 1,800 / 400;
// ⬇ Export one appropriation says to take that file back by Import one appropriation; the help says nothing of such a file; a
// package or a PMO copy whose working plan's list holds "K9", 0, false, "", 5 or [] is taken; a lock asks nothing of the list it keeps.
// Its 111 passes are the fixtures, the CONTROLS and the GUARDS' money, lists and reading -- what d66dd60 did right: the
// GUARDS' door, full-import and statement checks fail there.
await (async () => {
  const name = 'v2.00 (U32, U33) — an RCN / EEIC list that repeats a key, or holds “__none__” or a key that is not text, never counts money twice: a file handed over with one is refused, and the user’s own board comes across saying what it holds';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const SV = ['USAF', 'ANG', 'AFRC'];
    const E = (k, rcn, eeic) => { const e = { rcn, eeic, t: '', svc: SV.slice() }; if (k !== undefined) e.k = k; return e; };
    const K1 = E('K1', '11111', 'AAAAA'), K2 = E('K2', '22222', 'BBBBB'), NN = E('__none__', '22222', 'BBBBB'),
      N1 = E(1, '11111', 'AAAAA'), T1 = E('1', '22222', 'BBBBB'), K1b = E('K1', '22222', 'BBBBB');
    // the user's own board: R1, the list [K1], R1 on `asg`, PB27 locked when the case has a cycle; then its file, PB27's list replaced
    // (`cyc`; 'pre199': locked before v1.99, no list kept) and the working plan's (`plan`)
    const make = o => {
      const X = boot();
      seed(X.ev, { services: SV, items: [it('R1', 'AV', [900, 200, 0])], disc: o.disc || [5000, 5000, 5000], mand: [0, 0, 0], order: ['R1'] });
      X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
        S.awards={R1:{mode:'single', d:FYMON[2][0], day:3}}; MS.rcn=${J([K1])}; S.rcnAsg=${J(o.asg ? { R1: o.asg } : {})};
        applyState(S); save(); window.confirm=function(){ return true; }; ${o.cyc ? "MS.base=MS.cur; blCyc='PB'; blYr=MS.cur; cycLock();" : ''} 'ok'`);
      const fund = X.ev(`JSON.stringify([tiers().R1.d, tiers().R1.m])`), own = X.ev('buildSavedHtml()');
      if (o.cyc === 'pre199') X.ev(`delete blGet('PB|2027').rcn; persistCyc(); 'ok'`);
      else if (o.cyc) X.ev(`blGet('PB|2027').rcn=${J(o.cyc)}; persistCyc(); 'ok'`);
      if (o.plan) X.ev(`MS.rcn=${J(o.plan)}; save(); 'ok'`);
      return { fund, own, file: X.ev('buildSavedHtml()') };
    };
    const lsOf = ev => JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
    const moved = (a, b) => Object.keys(Object.assign({}, a, b)).filter(k => a[k] !== b[k]).sort();
    // the RCN-EEIC sheet from the workbook's bytes, PB27 on screen or the working plan: [service, row, the award month's cell, NO DATE,
    // TOTAL] for every row up to the breakout, then the TOTAL of every "<SERVICE> TOTAL" row in the whole sheet (the summary's and the
    // breakout's)
    const sheet = async (W, ev, view) => {
      const on = view ? ev(`cycView('${view}'); CYCVIEW||'not on screen'`) : 'the working plan';
      const bk = JSON.parse(await w6Book(W, 'exportExcel')); if (view) ev(`cycLeave(); 'ok'`);
      const rc = bk['RCN-EEIC by Month'] || [], iReq = rc.findIndex(r => w6Lbl(r) === 'WHICH REQUIREMENTS SIT UNDER EACH COMBINATION');
      const rows = []; let sv = null;
      for (let j = 0; j < (iReq < 0 ? rc.length : iReq); j++) { const L = w6Lbl(rc[j]);
        if (SV.includes(L)) { sv = L; continue; }
        if (num((rc[j] || [])[14]) === null) continue;
        rows.push([/TOTAL BY MONTH$/.test(L) ? 'ALL' : sv, L, num(rc[j][3]), num(rc[j][13]), num(rc[j][14])]); }
      const tot = SV.map(s => rc.filter(r => w6Lbl(r) === s + ' TOTAL').map(r => num(r[14])));
      return J({ on, err: bk.__err || '', rows, tot });
    };
    // NOT FUNDED, from the bytes: each "NOT FUNDED — asks on <SERVICE>" row and the rows under it, as [row, Ask]; every service total
    const notFunded = async (W, ev) => {
      const bk = JSON.parse(await w6Book(W, 'exportExcel'));
      const rc = bk['RCN-EEIC by Month'] || [], nf = [];
      rc.forEach((r, j) => { if (/^NOT FUNDED — asks on /.test(w6Lbl(r))) for (let i = j; i < rc.length && w6Lbl(rc[i]); i++) nf.push([w6Lbl(rc[i]), num((rc[i] || [])[15])]); });
      const tot = SV.map(s => rc.filter(r => w6Lbl(r) === s + ' TOTAL').map(r => num(r[14])));
      return J({ err: bk.__err || '', sheet: !!bk['RCN-EEIC by Month'], nf, tot });
    };
    const ROWS = lab => [['USAF', lab, 900, 0, 900], ['USAF', 'USAF TOTAL', 900, 0, 900], ['ANG', lab, 200, 0, 200], ['ANG', 'ANG TOTAL', 200, 0, 200],
      ['AFRC', 'AFRC TOTAL', 0, 0, 0], ['ALL', 'ALL SERVICES — TOTAL BY MONTH', 1100, 0, 1100]];
    const WANT = (on, lab) => J({ on, err: '', rows: ROWS(lab), tot: [[900, 900], [200, 200], [0, 0]] });
    const NF_HEAD = sv => 'NOT FUNDED — asks on ' + sv + ' and draws nothing, so it is not in the total above   (1 requirement)';
    const WANT_NF = lab => J({ err: '', sheet: true, nf: [[NF_HEAD('USAF'), 900], [lab, 900], ['#1  Req R1', 900], [NF_HEAD('ANG'), 200], [lab, 200], ['#1  Req R1', 200]],
      tot: [[0, 0], [0, 0], [0, 0]] });
    const ON_K1 = '11111 / AAAAA', ON_K2 = '22222 / BBBBB', ON_NONE = '— no RCN/EEIC assigned —';
    // ⬅ Import a full board, every question answered yes and kept; ⬅ Import one appropriation with the file, every alert kept
    const full = (ev, file) => JSON.parse(ev(`(function(){ var qs=[], al=[]; window.confirm=function(q){ qs.push(String(q)); return true; };
      window.alert=function(m){ al.push(String(m)); };
      var ret, threw=''; try{ ret=fullImportText(${J(file)}, 'cycle.html'); }catch(e){ threw=String((e&&e.message)||e); }
      return JSON.stringify({ret:ret, threw:threw, qs:qs, al:al, stat:(document.getElementById('shareStat')||{}).textContent||''}); })()`));
    const one = (ev, file) => ev(`new Promise(function(res){ var al=[]; window.alert=function(m){ al.push(String(m)); };
      window.confirm=function(){ return true; }; window.prompt=function(){ return '1'; };
      var inp={files:[new File([${J(file)}], 'cycle.html')], value:'x'};
      try{ importState(inp); }catch(e){ al.push('THREW '+e.message); }
      (function wait(n){ if(inp.value==='' || n>600) return res(JSON.stringify(al)); setTimeout(function(){ wait(n+1); }, 5); })(0); })`);
    // ⇊ Import several boards with the file alone, every alert kept
    const several = (ev, file) => ev(`new Promise(function(res){ var al=[]; window.alert=function(m){ al.push(String(m)); };
      window.confirm=function(){ return true; };
      var inp={files:[new File([${J(file)}], 'cycle.html')], value:'x'};
      try{ importBoards(inp); }catch(e){ al.push('THREW '+e.message); }
      (function wait(n){ if(inp.value==='' || n>600) return res(JSON.stringify(al)); setTimeout(function(){ wait(n+1); }, 5); })(0); })`);
    const QLINE = q => (String(q || '').split('\n').find(l => l.startsWith('  • RCN / EEIC lists')) || '');
    const SAID = s => ((String(s).match(/RCN \/ EEIC lists as the file holds them[^]*?only as not assigned\./) || [''])[0]);
    const SAYS = (what, cy) => 'RCN / EEIC lists as the file holds them, which a file handed over is refused for: ' + what + '. A requirement on a key '
      + 'that is text (not empty) reads the first entry with that key, as the ORBIT that saved the file did.'
      + (cy ? ' A locked cycle’s entry whose key is not text is kept but not read, as in every ORBIT since v1.99: a requirement on it shows no code there, '
        + 'and its money is on no combination.' : '')
      + ' The RCN-EEIC sheet counts each key once and money on no combination only as not assigned';
    // the refusal's words: the rule; who saved the file, as the file says it (a fixture is saved by the board under test);
    // and a way that works for that kind of file -- a locked cycle's list is never put right on a board
    const RULE = 'An RCN / EEIC list names each combination once, by a text key of its own.';
    // the version is the board under test's own stamp, read from its source: a literal pinned to one release broke at the next BUILD
    const SAVED_BY = (await import('node:fs')).readFileSync((await import('./boot.mjs')).BOARD, 'utf8').match(/const BUILD='(v\d+\.\d+)/)[1];
    const NOW = 'This file says ORBIT ' + SAVED_BY + ' saved it, from a board that held such a list.';
    const OLD = 'An ORBIT before this one took such a list without a word and could save it with its board.';
    const PLAN = 'A list that is not a locked cycle’s can be put right on a board of this version, in 🗂 RCN / EEIC, where ✕ on a row marked ⚠ repeats '
      + 'removes that row alone, and the file written again.';
    const CYCLE = 'A locked cycle’s list stays as it was locked, so ⬅ Import one appropriation and ⇊ Import several boards '
      + 'refuse every file that carries that cycle. The file itself opens as a board.';
    const FULL = 'A whole board of your own comes across with its lists as they are by Imports & exports → ⬅ Import a full board, which says first what they '
      + 'hold. That replaces this board’s whole BAE list and execution data with the file’s, when it carries them, so it is not the way to take one '
      + 'appropriation.';
    // a file that also carries a locked cycle whose list a file handed over is refused for; a board .html opens as a board
    const TOO = 'This file also carries a locked cycle whose RCN / EEIC list a file handed over is refused for.';
    const OPENS = 'The file itself opens as a board.';
    // a locked cycle's words for a file that is not said to open as a board (a null entry in its working plan's list)
    const CYCLE_ONLY = 'A locked cycle’s list stays as it was locked, so ⬅ Import one appropriation and ⇊ Import several '
      + 'boards refuse every file that carries that cycle.';
    const LIST_TAIL = why => RULE + ' ' + NOW + ' ' + (/\.cycles\./.test(why) ? CYCLE : PLAN) + ' ' + FULL;
    const ENTRY_TAIL = 'An RCN / EEIC list holds combinations and nothing else. No ORBIT makes such an entry. This file says ORBIT ' + SAVED_BY + ' saved it, '
      + 'from a board that held one.';
    const AT_PB = 'the RCN / EEIC list at the saved state.cycDb.byAp.om.cycles.PB|2027.rcn ', AT_WP = 'the RCN / EEIC list at the saved state.appns.om.rcn ';
    const TWICE = 'holds the key “K1” twice (rcn[0] and rcn[1]); a key names one combination';
    const NOT_TEXT = 'holds a key that is not text (rcn[0].k is the number 1); a key is text';
    const ALL = ['door', 'one', 'several', 'full', 'reopened', 'saved', 'opened', 'opened-saved'];
    const R6 = ['door', 'full', 'reopened', 'saved', 'opened', 'opened-saved'];
    const WP_NT = 'O&M working plan’s list holds a key that is not text (rcn[0].k is the number 1)';
    const CASES = [
      { c: 'Codex 1 · PB27 lists K1 twice', o: { asg: 'K1', cyc: [K1, K1] }, view: 'PB|2027', lab: ON_K1, why: AT_PB + TWICE,
        says: 'O&M PB27’s list holds the key “K1” twice (rcn[0] and rcn[1])', routes: ALL },
      { c: 'Codex 2 · PB27 lists K1 and an entry named “__none__”, R1 on none', o: { asg: '', cyc: [K1, NN] }, view: 'PB|2027', lab: ON_NONE,
        why: AT_PB + 'holds the key “__none__” (rcn[1]); a key beginning with two underscores is one the board keeps for its own bookkeeping',
        says: 'O&M PB27’s list holds the key “__none__” (rcn[1])', routes: ALL },
      { c: 'CONTROL · PB27 lists ordinary K1, K2, R1 on K1', o: { asg: 'K1', cyc: [K1, K2] }, view: 'PB|2027', lab: ON_K1, why: '', says: '', routes: ALL },
      { c: 'CONTROL · PB27 lists ordinary K1, K2, R1 on none', o: { asg: '', cyc: [K1, K2] }, view: 'PB|2027', lab: ON_NONE, why: '', says: '',
        routes: ['door', 'full', 'reopened', 'saved', 'opened', 'opened-saved'] },
      { c: 'Codex 2 · R1 on the entry named “__none__”', o: { asg: '__none__', cyc: [K1, NN] }, view: 'PB|2027', lab: ON_K2, routes: ['opened', 'opened-saved'] },
      { c: 'CONTROL · PB27 lists ordinary K1, K2, R1 on K2', o: { asg: 'K2', cyc: [K1, K2] }, view: 'PB|2027', lab: ON_K2, routes: ['opened'] },
      { c: 'PB27 lists K1 twice and an entry named “__none__”', o: { asg: 'K1', cyc: [K1, K1, NN] }, view: 'PB|2027', lab: ON_K1, why: AT_PB + TWICE,
        says: 'O&M PB27’s list holds the key “K1” twice (rcn[0] and rcn[1]), holds the key “__none__” (rcn[2])', routes: ['door', 'full', 'reopened', 'opened'] },
      { c: 'PB27 lists K1 twice, then the number 1, R1 on K1', o: { asg: 'K1', cyc: [K1, K1, N1] }, view: 'PB|2027', lab: ON_K1, why: AT_PB + TWICE,
        says: 'O&M PB27’s list holds the key “K1” twice (rcn[0] and rcn[1]), holds a key that is not text (rcn[2].k is the number 1)', cyNT: true,
        routes: ['door', 'full', 'reopened'] },
      { c: 'GUARD on the money (d66dd60 took this board and exported it right) · PB27’s list holds null, then K1, R1 on K1', o: { asg: 'K1', cyc: [null, K1] }, view: 'PB|2027', lab: ON_K1,
        why: 'the RCN / EEIC entry at the saved state.cycDb.byAp.om.cycles.PB|2027.rcn[0] is not a combination (“null”); a list holds combinations and nothing else',
        says: 'O&M PB27’s list holds rcn[0], which is not a combination (“null”)', routes: ['door', 'full', 'reopened', 'saved', 'opened'] },
      { c: 'GUARD on the money (d66dd60 printed this right) · PB27’s list holds the number 1 alone, R1 on the number 1, which a locked cycle’s list leaves out', o: { asg: 1, cyc: [N1] }, view: 'PB|2027', lab: ON_NONE,
        why: AT_PB + NOT_TEXT, says: 'O&M PB27’s list holds a key that is not text (rcn[0].k is the number 1)', cyNT: true, routes: ['door', 'full', 'reopened', 'opened'] },
      { c: 'GUARD on the money (d66dd60 took this board and exported it right) · the working plan’s list holds “K9”, then K1, R1 on K1', o: { asg: 'K1', plan: ['K9', K1] }, view: '', lab: ON_K1,
        why: 'the RCN / EEIC entry at the saved state.appns.om.rcn[0] is not a combination (“"K9"”); a list holds combinations and nothing else',
        says: 'O&M working plan’s list holds rcn[0], which is not a combination (“"K9"”)', tail: ENTRY_TAIL + ' ' + OPENS + ' ' + FULL,
        routes: ['door', 'one', 'full', 'reopened', 'saved', 'opened'] },
      { c: 'GUARD on the money (d66dd60 took this board and exported it right) · the working plan’s list holds the number 0, then K1, R1 on K1', o: { asg: 'K1', plan: [0, K1] }, view: '', lab: ON_K1,
        why: 'the RCN / EEIC entry at the saved state.appns.om.rcn[0] is not a combination (“0”); a list holds combinations and nothing else',
        says: 'O&M working plan’s list holds rcn[0], which is not a combination (“0”)', tail: ENTRY_TAIL + ' ' + OPENS + ' ' + FULL,
        routes: ['door', 'one', 'full', 'reopened', 'saved'] },
      { c: 'GUARD on the money (d66dd60 took this board and exported it right) · the working plan’s list holds [], then K1, R1 on K1', o: { asg: 'K1', plan: [[], K1] }, view: '', lab: ON_K1,
        why: 'the RCN / EEIC entry at the saved state.appns.om.rcn[0] is not a combination (“[]”); a list holds combinations and nothing else',
        says: 'O&M working plan’s list holds rcn[0], which is not a combination (“[]”)', routes: ['door', 'full', 'reopened', 'saved'] },
      { c: 'the working plan lists K1 twice', o: { asg: 'K1', plan: [K1, K1] }, view: '', lab: ON_K1, why: AT_WP + TWICE,
        says: 'O&M working plan’s list holds the key “K1” twice (rcn[0] and rcn[1])', routes: ['door', 'one', 'full', 'reopened', 'opened', 'opened-saved'] },
      { c: 'the working plan lists K1 twice beside PB27’s ordinary [K1]', o: { asg: 'K1', plan: [K1, K1], cyc: [K1] }, view: '', lab: ON_K1, why: AT_WP + TWICE,
        routes: ['door', 'one', 'several'] },
      { c: 'the working plan and PB27 each list K1 twice', o: { asg: 'K1', plan: [K1, K1], cyc: [K1, K1] }, view: '', lab: ON_K1, why: AT_WP + TWICE,
        tail: RULE + ' ' + NOW + ' ' + TOO + ' ' + CYCLE + ' ' + FULL, routes: ['door', 'one', 'several'] },
      { c: 'the working plan holds “K9”, then K1, beside PB27 [K1, K1]', o: { asg: 'K1', plan: ['K9', K1], cyc: [K1, K1] }, view: '', lab: ON_K1,
        why: 'the RCN / EEIC entry at the saved state.appns.om.rcn[0] is not a combination (“"K9"”); a list holds combinations and nothing else',
        tail: ENTRY_TAIL + ' ' + TOO + ' ' + CYCLE + ' ' + FULL, routes: ['door', 'one'] },
      { c: 'the working plan lists K1 twice beside PB27 [null, K1]', o: { asg: 'K1', plan: [K1, K1], cyc: [null, K1] }, view: '', lab: ON_K1, why: AT_WP + TWICE,
        tail: RULE + ' ' + NOW + ' ' + TOO + ' ' + CYCLE + ' ' + FULL, routes: ['door', 'one'] },
      { c: 'CONTROL · the working plan lists ordinary K1, K2', o: { asg: 'K1', plan: [K1, K2] }, view: '', lab: ON_K1, why: '', routes: ['door', 'opened'] },
      { c: 'CONTROL (as d66dd60) · the working plan lists K1 and an entry keyed “”, R1 on none', o: { asg: '', plan: [K1, E('', '33333', 'CCCCC')] }, view: '', lab: ON_NONE,
        why: '', routes: ['door', 'opened'] },
      { c: 'the working plan lists K1 twice, on two codes, R1 on K1', o: { asg: 'K1', plan: [K1, K1b] }, view: '', lab: ON_K1, why: AT_WP + TWICE,
        says: 'O&M working plan’s list holds the key “K1” twice (rcn[0] and rcn[1])', routes: ['door', 'full', 'reopened', 'opened', 'opened-saved'] },
      { c: 'the working plan lists 1 and “1”, R1 on “1”', o: { asg: '1', plan: [N1, T1] }, view: '', lab: ON_K2, why: AT_WP + NOT_TEXT,
        says: 'O&M working plan’s list holds a key that is not text (rcn[0].k is the number 1)', routes: ['door', 'full', 'reopened', 'saved', 'opened', 'opened-saved'] },
      { c: 'CONTROL · the working plan lists ordinary “1”, K1, R1 on “1”', o: { asg: '1', plan: [T1, K1] }, view: '', lab: ON_K2, why: '', routes: ['door', 'opened'] },
      { c: 'the working plan lists 1 and “1”, R1 on the number 1', o: { asg: 1, plan: [N1, T1] }, view: '', lab: ON_K1, why: AT_WP + NOT_TEXT, says: WP_NT, routes: R6 },
      { c: 'GUARD (d66dd60 printed this right) · the working plan lists the number 1 alone, R1 on the number 1', o: { asg: 1, plan: [N1] }, view: '', lab: ON_K1, why: AT_WP + NOT_TEXT, says: WP_NT, routes: R6 },
      { c: 'the working plan lists the number 1 alone, R1 on “1”', o: { asg: '1', plan: [N1] }, view: '', lab: ON_NONE, why: AT_WP + NOT_TEXT, says: WP_NT, routes: R6 },
      { c: 'a hand-made file: the working plan lists K1 and an entry keyed “constructor”, R1 on K1', o: { asg: 'K1', plan: [K1, E('constructor', '33333', 'CCCCC')] }, view: '',
        lab: ON_K1, routes: ['opened', 'opened-saved'] },
      { c: 'PB27 locked before v1.99 reads today’s list, 1 and “1”', o: { asg: '1', plan: [N1, T1], cyc: 'pre199' }, view: 'PB|2027', lab: ON_K2, why: AT_WP + NOT_TEXT,
        says: 'O&M working plan’s list holds a key that is not text (rcn[0].k is the number 1)', routes: ['door', 'full', 'reopened', 'opened'] },
      { c: 'CONTROL · PB27 locked before v1.99 reads today’s ordinary “1”, K1', o: { asg: '1', plan: [T1, K1], cyc: 'pre199' }, view: 'PB|2027', lab: ON_K2, routes: ['opened'] },
      { c: 'NOT FUNDED · the working plan lists K1 twice, R1 on K1', o: { asg: 'K1', plan: [K1, K1], disc: [0, 0, 0] }, nf: true, lab: ON_K1 + '   (1)', routes: ['opened', 'opened-saved'] },
      { c: 'CONTROL · NOT FUNDED, ordinary K1, K2, R1 on K1', o: { asg: 'K1', plan: [K1, K2], disc: [0, 0, 0] }, nf: true, lab: ON_K1 + '   (1)', routes: ['opened'] },
      { c: 'CONTROL · NOT FUNDED, R1 on no combination', o: { asg: '', plan: [K1, K2], disc: [0, 0, 0] }, nf: true, lab: ON_NONE + '   — 1 still to assign', routes: ['opened'] },
    ];
    for (const C of CASES) {
      const mk = bootMark();
      const F = make(C.o), has = r => C.routes.includes(r);
      const read = (W, ev) => C.nf ? notFunded(W, ev) : sheet(W, ev, C.view);
      const want = C.nf ? WANT_NF(C.lab) : WANT(C.view || 'the working plan', C.lab);
      const what = C.nf ? 'the RCN-EEIC sheet’s NOT FUNDED list, read from the workbook’s bytes: R1 once under each service, Ask USAF 900, ANG 200, every total 0'
        : 'the RCN-EEIC sheet, read from the workbook’s bytes: USAF 900, ANG 200, all services 1,100, each once, in the award month, under the entry the board shows R1 on';
      w5Chk(name, C.c + ' · fixture', 'CONTROL — ' + (C.nf ? 'pots of 0: R1 draws nothing' : 'R1 funded in full, discretionary: USAF 900, ANG 200, AFRC 0'),
        F.fund, J(C.nf ? [[0, 0, 0], [0, 0, 0]] : [[900, 200, 0], [0, 0, 0]]));
      // (a) the door, (b) Import a full board: into the user's own board
      const T = (has('door') || has('full')) ? boot({ html: F.own }) : null;
      if (has('door')) w5Chk(name, C.c + ' · the door', C.why ? 'a file handed over is refused, saying which list, what it holds and why' : 'CONTROL — the file passes',
        T.ev(`inboundCheck(${J(F.file)})`), C.why);
      // (a2) Import one appropriation: a file handed over
      if (has('one')) {
        const T1b = boot({ html: F.own }), held = lsOf(T1b.ev), al = JSON.parse(await one(T1b.ev, F.file)), mv = moved(held, lsOf(T1b.ev));
        if (C.why) w5Chk(name, C.c + ' · ⬅ Import one appropriation', 'refused whole, in true words -- the file says this version saved it, from a board that held such a list, and the way named works for it -- and browser storage is byte-identical',
          J([al, mv]), J([['“cycle.html” was not imported: ' + C.why + '.\n\n' + (C.tail || LIST_TAIL(C.why)) + ' Nothing on this board was changed.'], []]));
        else w5Chk(name, C.c + ' · ⬅ Import one appropriation', 'CONTROL — taken: nothing refused, and the plan is written', J([al, mv.includes('prio27om')]), J([[], true]));
      }
      // (a3) ⇊ Import several boards with that file alone: a file handed over
      if (has('several')) {
        const T3 = boot({ html: F.own }), held = lsOf(T3.ev), al = JSON.parse(await several(T3.ev, F.file)), mv = moved(held, lsOf(T3.ev));
        if (C.why) w5Chk(name, C.c + ' · ⇊ Import several boards', 'the batch is refused whole, in true words, and browser storage is byte-identical',
          J([al, mv]), J([['“cycle.html” was not imported: ' + C.why + '.\n\n' + (C.tail || LIST_TAIL(C.why)) + ' Nothing on this board was changed.'], []]));
        else w5Chk(name, C.c + ' · ⇊ Import several boards', 'CONTROL — taken: nothing refused, and the plan is written', J([al, mv.includes('prio27om')]), J([[], true]));
      }
      if (has('full')) {
        const held = lsOf(T.ev), r = full(T.ev, F.file), after = lsOf(T.ev), mv = moved(held, after);
        w5Chk(name, C.c + ' · ⬅ Import a full board', C.says ? 'the user’s own board is taken, and the question asked before anything is replaced says what the list holds'
          : 'CONTROL — taken, and the question says nothing about the lists',
          J([r.ret, r.threw, r.al, QLINE(r.qs[r.qs.length - 1]), mv.includes('prio27om') && (!C.view || mv.includes('prio27om-cyc'))]),
          J([true, '', [], C.says ? '  • ' + SAYS(C.says, C.cyNT) : '', true]));
        const R = boot({ html: F.own, ls: after });
        if (has('reopened')) {
          w5Chk(name, C.c + ' · imported, the same browser reopened', C.says ? 'the reopened board says what the list holds' : 'CONTROL — and says nothing about the lists',
            SAID(R.ev(`(document.getElementById('shareStat')||{}).textContent||''`)), C.says ? SAYS(C.says, C.cyNT) + '.' : '');
          w5Chk(name, C.c + ' · imported, the same browser reopened', what, await read(R.w, R.ev), want);
        }
        if (has('saved')) { const R2 = boot({ html: R.ev('buildSavedHtml()') });
          w5Chk(name, C.c + ' · imported, saved and reopened', 'the same, from the saved file', await read(R2.w, R2.ev), want); }
      }
      // (c) the file opened as a board: no door
      if (has('opened')) {
        const O = boot({ html: F.file });
        w5Chk(name, C.c + ' · the file opened', what, await read(O.w, O.ev), want);
        if (has('opened-saved')) { const O2 = boot({ html: O.ev('buildSavedHtml()') });
          w5Chk(name, C.c + ' · the file opened, saved and reopened', 'the same, from the saved file', await read(O2.w, O2.ev), want); }
      }
      bootRelease(mk, []); await settleBoards();
    }
    // THE FULL IMPORT'S WORDS, TRUE FOR EACH REQUIREMENT (Codex B2, 13 Oct, P2), written out whole. PB27's list holds {k: 1,
    // 99999 / ZZZZZ} and R1 is on the number 1: a locked cycle reads only the entries whose key is text (cycRcnOf, as every ORBIT
    // since v1.99), so in PB27 the list read is [], R1 shows no code and its USAF 900 / ANG 200 print as not assigned -- and the list
    // itself is kept exactly as the file holds it, written by the import, reopened, saved and reopened. "Each requirement reads the
    // first entry with its key" was untrue of R1, with round 3's parenthesis or without it. Beside it K1, with R1 on K1, reads
    // 11111 / AAAAA. The working plan's [{k: 0}, K1] with R1 on the number 0: no list reads a pointer of 0 (rcnAsgOf), and the words
    // claim nothing of it.
    {
      const Z1 = E(1, '99999', 'ZZZZZ'), Z0 = E(0, '99999', 'ZZZZZ');
      const RAW_N = '[{"rcn":"99999","eeic":"ZZZZZ","t":"","svc":["USAF","ANG","AFRC"],"k":1}]';
      const RAW_M = '[{"rcn":"99999","eeic":"ZZZZZ","t":"","svc":["USAF","ANG","AFRC"],"k":1},{"rcn":"11111","eeic":"AAAAA","t":"","svc":["USAF","ANG","AFRC"],"k":"K1"}]';
      const SAY_N = 'RCN / EEIC lists as the file holds them, which a file handed over is refused for: O&M PB27’s list holds a key that is not text '
        + '(rcn[0].k is the number 1). A requirement on a key that is text (not empty) reads the first entry with that key, as the ORBIT that saved the '
        + 'file did. A locked cycle’s entry whose key is not text is kept but not read, as in every ORBIT since v1.99: a requirement on it shows no code '
        + 'there, and its money is on no combination. The RCN-EEIC sheet counts each key once and money on no combination only as not assigned';
      for (const [c, asg, L, raw, read, lab] of [
        ['PB27 holds {k: 1} alone, R1 on the number 1', 1, [Z1], RAW_N, { pointer: 1, list: [], label: '' }, ON_NONE],
        ['PB27 holds {k: 1}, then K1, R1 on K1', 'K1', [Z1, K1], RAW_M, { pointer: 'K1', list: ['K1'], label: ON_K1 }, ON_K1]]) {
        const mk = bootMark(), at = 'the words · ' + c;
        const F = make({ asg, cyc: L }), T = boot({ html: F.own }), r = full(T.ev, F.file), after = lsOf(T.ev);
        w5Chk(name, at + ' · ⬅ Import a full board', 'taken, and the question is true for each requirement: a requirement on a key that is text reads the first entry with it; a locked cycle’s entry whose key is not text is kept but not read, and a requirement on it shows no code',
          J([r.ret, r.threw, r.al, QLINE(r.qs[r.qs.length - 1])]), J([true, '', [], '  • ' + SAY_N]));
        w5Chk(name, at + ' · ⬅ Import a full board', 'GUARD (as d66dd60) — the locked list is written to browser storage exactly as the file holds it',
          J((JSON.parse(after['prio27om-cyc'] || '{"cycles":{}}').cycles['PB|2027'] || {}).rcn), raw);
        const R = boot({ html: F.own, ls: after });
        w5Chk(name, at + ' · imported, the same browser reopened', 'the reopened board says the same', SAID(R.ev(`(document.getElementById('shareStat')||{}).textContent||''`)), SAY_N + '.');
        w5Chk(name, at + ' · imported, the same browser reopened', 'GUARD (as d66dd60) — the locked list as the file holds it; in PB27, R1’s pointer, the keys the cycle reads and the code R1 shows',
          R.ev(`(function(){ var kept=JSON.stringify(blGet('PB|2027').rcn); cycView('PB|2027'); var o=JSON.stringify([kept, {pointer:rcnAsgOf('R1'), list:rcnReg().map(function(e){ return e.k; }), label:rcnLabel(rcnAsgOf('R1'))}]); cycLeave(); return o; })()`),
          J([raw, read]));
        w5Chk(name, at + ' · imported, the same browser reopened', 'GUARD (as d66dd60) — the RCN-EEIC sheet, read from the workbook’s bytes: USAF 900, ANG 200, all services 1,100, each once, in the award month, under the code R1 shows',
          await sheet(R.w, R.ev, 'PB|2027'), WANT('PB|2027', lab));
        const R2 = boot({ html: R.ev('buildSavedHtml()') });
        w5Chk(name, at + ' · imported, saved and reopened', 'GUARD (as d66dd60) — the locked list as the file holds it', R2.ev(`JSON.stringify(blGet('PB|2027').rcn)`), raw);
        bootRelease(mk, []); await settleBoards();
      }
      // the working plan's [{k: 0}, K1], R1 on the number 0 -- rcnAsgOf reads a pointer of 0 as none, in every list
      const mk = bootMark();
      const X = boot();
      seed(X.ev, { services: SV, items: [it('R1', 'AV', [900, 200, 0])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['R1'] });
      X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
        S.awards={R1:{mode:'single', d:FYMON[2][0], day:3}}; MS.rcn=${J([K1])}; S.rcnAsg={}; applyState(S); save(); 'ok'`);
      const own0 = X.ev('buildSavedHtml()');
      X.ev(`MS.rcn=${J([Z0, K1])}; S.rcnAsg={R1:0}; applyState(S); save(); 'ok'`);
      const T0 = boot({ html: own0 }), r0 = full(T0.ev, X.ev('buildSavedHtml()')), R0 = boot({ html: own0, ls: lsOf(T0.ev) });
      const SAY_0 = 'RCN / EEIC lists as the file holds them, which a file handed over is refused for: O&M working plan’s list holds a key that is not '
        + 'text (rcn[0].k is the number 0). A requirement on a key that is text (not empty) reads the first entry with that key, as the ORBIT that saved '
        + 'the file did. The RCN-EEIC sheet counts each key once and money on no combination only as not assigned';
      w5Chk(name, 'the words · the working plan holds {k: 0}, then K1, R1 on the number 0 · ⬅ Import a full board', 'taken, and the question claims nothing of a requirement on a key that is not text -- R1 on 0 reads none',
        J([r0.ret, r0.threw, r0.al, QLINE(r0.qs[r0.qs.length - 1])]), J([true, '', [], '  • ' + SAY_0]));
      w5Chk(name, 'the words · the working plan holds {k: 0}, then K1, R1 on the number 0 · imported, the same browser reopened', 'the reopened board says the same',
        SAID(R0.ev(`(document.getElementById('shareStat')||{}).textContent||''`)), SAY_0 + '.');
      w5Chk(name, 'the words · the working plan holds {k: 0}, then K1, R1 on the number 0 · imported, the same browser reopened', 'CONTROL (as d66dd60) — the list and R1’s pointer kept as the file holds them; R1 shows no code',
        R0.ev(`JSON.stringify([JSON.stringify(MS.rcn), JSON.stringify((S.rcnAsg||{}).R1), rcnLabel(rcnAsgOf('R1'))])`),
        J(['[{"rcn":"99999","eeic":"ZZZZZ","t":"","svc":["USAF","ANG","AFRC"],"k":0},{"rcn":"11111","eeic":"AAAAA","t":"","svc":["USAF","ANG","AFRC"],"k":"K1"}]', '0', '']));
      w5Chk(name, 'the words · the working plan holds {k: 0}, then K1, R1 on the number 0 · imported, the same browser reopened', 'CONTROL (as d66dd60) — the RCN-EEIC sheet, read from the workbook’s bytes: USAF 900, ANG 200, all services 1,100, each once, in the award month, as not assigned',
        await sheet(R0.w, R0.ev, ''), WANT('the working plan', ON_NONE));
      bootRelease(mk, []); await settleBoards();
    }
    // THE USER'S OWN BOARD HOLDING SUCH A CYCLE, AND WHAT IT WRITES (the lead, 13 Oct, from U44's round-1 money M1). PB27's list holds
    // K1 twice, taken whole by ⬅ Import a full board and the browser reopened. Brad (13 Oct): a locked cycle's list stays as it was
    // locked, and a way to correct one is deferred -- so the board's saved file and its one-appropriation file are refused by
    // ⬅ Import one appropriation and ⇊ Import several boards, on this very board as well, in words true for a file this version
    // saved: never "an ORBIT before this one", and a way that works for that file. What it can send is taken: its saved file by
    // ⬅ Import a full board, its package, which carries no locked cycle. Its one-appropriation file, opened, prints the money once.
    {
      const mk = bootMark();
      const F = make({ asg: 'K1', cyc: [K1, K1] }), T = boot({ html: F.own }); full(T.ev, F.file);
      const R = boot({ html: F.own, ls: lsOf(T.ev) });
      const saved = R.ev('buildSavedHtml()'), oneAp = R.ev(`oneAppnHtml(mySlug())||''`);
      const pkg = R.ev(`(function(){ var cap=null, _B=window.Blob; window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
        window.confirm=function(){ return true; }; window.alert=function(){}; try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
        try{ pkgIssue(mySlug(), true); }catch(e){ cap='threw: '+e.message; } window.Blob=_B; return cap||''; })()`);
      const at = 'the user’s own board holding PB27 [K1, K1] · ', why = AT_PB + TWICE;
      // what it says when it writes the one-appropriation file: no way back that refuses it -- why, and what works
      const stat1 = R.ev(`(function(){ var _P=window.uiPrompt; window.uiPrompt=function(m,d,cb){ cb('1'); }; window.alert=function(){};
        try{ exportOneAppn(); }finally{ window.uiPrompt=_P; } return (document.getElementById('shareStat')||{}).textContent||''; })()`);
      w5Chk(name, at + '⬇ Export one appropriation', 'the status line names no way back that refuses the file: Import one appropriation and Import several boards refuse it, and it says why and what works',
        stat1, '⬇ O&M exported as a working board of its own — its plan, its locked cycles, its execution data and its BAE rows, with the destination list, '
          + 'cost estimates and reprogramming log. It is not taken back by ⬅ Import one appropriation or ⇊ Import several boards, which refuse it: ' + why + '. '
          + RULE + ' ' + NOW + ' ' + CYCLE + ' ' + FULL);
      const told = '“cycle.html” was not imported: ' + why + '.\n\n' + RULE + ' ' + NOW + ' ' + CYCLE + ' ' + FULL + ' Nothing on this board was changed.';
      const held = lsOf(R.ev), al = JSON.parse(await one(R.ev, saved)), mv = moved(held, lsOf(R.ev));
      w5Chk(name, at + 'its saved file, ⬅ Import one appropriation on the same board', 'refused whole, in words true for a file this version saved -- never “an ORBIT before this one” -- naming a way that works for it; browser storage is byte-identical',
        J([al, mv]), J([[told], []]));
      const held2 = lsOf(R.ev), al2 = JSON.parse(await several(R.ev, oneAp)), mv2 = moved(held2, lsOf(R.ev));
      w5Chk(name, at + 'its one-appropriation file, ⇊ Import several boards on the same board', 'refused whole, in the same words; browser storage is byte-identical',
        J([al2, mv2]), J([[told], []]));
      // three files at once, the refused one between two clean boards that say v1.99 saved them: the refusal is of the file it
      // names, told who saved THAT file, whichever of the three was read last
      // (v2.01) any version: a pattern pinned to one stopped matching at the next BUILD and left the file saying this version
      const clean = F.own.replace(/const BUILD='v\d+\.\d+[^']*'/, "const BUILD='v1.99 (6 Oct 2026)'");
      w5Chk(name, at + 'the clean files say v1.99 saved them', 'the fixture really does carry the older version', String(clean.includes("const BUILD='v1.99 (6 Oct 2026)'")), 'true');
      const held3 = lsOf(R.ev), al3 = JSON.parse(await R.ev(`new Promise(function(res){ var al=[]; window.alert=function(m){ al.push(String(m)); };
        window.confirm=function(){ return true; };
        var inp={files:[new File([${J(clean)}], 'a.html'), new File([${J(oneAp)}], 'cycle.html'), new File([${J(clean)}], 'c.html')], value:'x'};
        try{ importBoards(inp); }catch(e){ al.push('THREW '+e.message); }
        (function wait(n){ if(inp.value==='' || n>600) return res(JSON.stringify(al)); setTimeout(function(){ wait(n+1); }, 5); })(0); })`));
      w5Chk(name, at + 'its one-appropriation file between two boards an earlier version saved, ⇊ Import several boards on the same board',
        'the batch is refused whole, the refusal telling who saved the file it names; browser storage is byte-identical',
        J([al3, moved(held3, lsOf(R.ev))]), J([['“cycle.html” was not imported: ' + why + ' (so none of the 3 files was taken).\n\n' + RULE + ' ' + NOW + ' '
          + CYCLE + ' ' + FULL + ' Nothing on this board was changed.'], []]));
      const O = boot({ html: oneAp });
      w5Chk(name, at + 'its one-appropriation file, opened', 'the RCN-EEIC sheet of PB27, read from the workbook’s bytes: USAF 900, ANG 200, all services 1,100, each once, under 11111 / AAAAA',
        await sheet(O.w, O.ev, 'PB|2027'), WANT('PB|2027', ON_K1));
      const P = boot(), heldP = lsOf(P.ev), alP = JSON.parse(await one(P.ev, pkg)), mvP = moved(heldP, lsOf(P.ev));
      w5Chk(name, at + 'its package, File → Import on a new board', 'CONTROL (as d66dd60) — taken: a package carries the working plan’s list [K1] and no locked cycle',
        J([alP.filter(a => /was not imported/.test(a)), mvP.includes('prio27om')]), J([[], true]));
      const r = full(R.ev, saved);
      w5Chk(name, at + 'its saved file, ⬅ Import a full board on the same board', 'CONTROL (as d66dd60) — taken whole, as the advice says', J([r.ret, r.threw, r.al]), J([true, '', []]));
      bootRelease(mk, []); await settleBoards();
    }
    // THE USER'S OWN BOARD WHOSE WORKING PLAN'S LIST AND PB27'S BOTH LIST K1 TWICE -- a board that locked PB27 while its list repeated
    // K1 holds both -- taken whole and the browser reopened (verification round 5, money MF1). The door names the working plan's list,
    // the first it meets; the refusal says the file also carries a locked cycle whose list is refused, and names only the ways that
    // work for such a file -- not ✕ and the file written again, which leaves it refused, for PB27's list, as the board then says. Its
    // package carries the working plan's list alone: refused until ✕ on the repeated row, then taken. The money is printed once.
    {
      const mk = bootMark();
      const F = make({ asg: 'K1', plan: [K1, K1], cyc: [K1, K1] }), T = boot({ html: F.own }); full(T.ev, F.file);
      const R = boot({ html: F.own, ls: lsOf(T.ev) });
      const at = 'the user’s own board whose working plan and PB27 each list K1 twice · ', why = AT_WP + TWICE;
      const tail = RULE + ' ' + NOW + ' ' + TOO + ' ' + CYCLE + ' ' + FULL;
      const pkgOf = ev => ev(`(function(){ var cap=null, _B=window.Blob; window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
        window.confirm=function(){ return true; }; window.alert=function(){}; try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
        try{ pkgIssue(mySlug(), true); }catch(e){ cap='threw: '+e.message; } window.Blob=_B; return cap||''; })()`);
      w5Chk(name, at + 'the working plan, exported', 'the RCN-EEIC sheet, read from the workbook’s bytes: USAF 900, ANG 200, all services 1,100, each once, under 11111 / AAAAA',
        await sheet(R.w, R.ev, ''), WANT('the working plan', ON_K1));
      w5Chk(name, at + 'PB27, exported', 'the RCN-EEIC sheet, read from the workbook’s bytes: USAF 900, ANG 200, all services 1,100, each once, under 11111 / AAAAA',
        await sheet(R.w, R.ev, 'PB|2027'), WANT('PB|2027', ON_K1));
      const stat1 = R.ev(`(function(){ var _P=window.uiPrompt; window.uiPrompt=function(m,d,cb){ cb('1'); }; window.alert=function(){};
        try{ exportOneAppn(); }finally{ window.uiPrompt=_P; } return (document.getElementById('shareStat')||{}).textContent||''; })()`);
      w5Chk(name, at + '⬇ Export one appropriation', 'the status line names no way back that refuses the file, and says the file also carries a locked cycle whose list is refused',
        stat1, '⬇ O&M exported as a working board of its own — its plan, its locked cycles, its execution data and its BAE rows, with the destination list, '
          + 'cost estimates and reprogramming log. It is not taken back by ⬅ Import one appropriation or ⇊ Import several boards, which refuse it: ' + why + '. ' + tail);
      const saved = R.ev('buildSavedHtml()'), oneAp = R.ev(`oneAppnHtml(mySlug())||''`), pkg = pkgOf(R.ev);
      const told = '“cycle.html” was not imported: ' + why + '.\n\n' + tail + ' Nothing on this board was changed.';
      const held = lsOf(R.ev), al = JSON.parse(await one(R.ev, saved)), mv = moved(held, lsOf(R.ev));
      w5Chk(name, at + 'its saved file, ⬅ Import one appropriation on the same board', 'refused whole, naming the locked cycle whose list is refused as well, and only the ways that work for such a file; browser storage is byte-identical',
        J([al, mv]), J([[told], []]));
      const held2 = lsOf(R.ev), al2 = JSON.parse(await several(R.ev, oneAp)), mv2 = moved(held2, lsOf(R.ev));
      w5Chk(name, at + 'its one-appropriation file, ⇊ Import several boards on the same board', 'refused whole, in the same words; browser storage is byte-identical',
        J([al2, mv2]), J([[told], []]));
      const P = boot(), heldP = lsOf(P.ev), alP = JSON.parse(await one(P.ev, pkg)), mvP = moved(heldP, lsOf(P.ev));
      w5Chk(name, at + 'its package, File → Import on a new board', 'refused whole: a package carries the working plan’s list and no locked cycle, so the way named is ✕ and the file written again; browser storage is byte-identical',
        J([alP, mvP]), J([['“cycle.html” was not imported: the RCN / EEIC list at the file.ms.rcn holds the key “K1” twice (rcn[0] and rcn[1]); a key names one combination.\n\n'
          + RULE + ' ' + PLAN + ' Nothing on this board was changed.'], []]));
      // its PMO copy carries the working plan's list and only the reference of PB27 (no list): refused for the working plan's list,
      // and told only the way that works for a PMO copy -- not Import a full board, which would put the copy's reference of PB27 in
      // place of the board's own
      const pmo = R.ev(`(function(){ var cap=null, _B=window.Blob; window.Blob=function(pt,o){ if(!cap && o && o.type==='text/html') cap=String(pt[0]); return new _B(pt,o); };
        window.confirm=function(){ return true; }; window.alert=function(){}; try{ publishPmoCopy(); }catch(e){ cap='threw: '+e.message; } window.Blob=_B; return cap||''; })()`);
      const PM = boot(), heldM = lsOf(PM.ev), alM = JSON.parse(await one(PM.ev, pmo)), mvM = moved(heldM, lsOf(PM.ev));
      w5Chk(name, at + 'its PMO copy, File → Import on a new board', 'refused whole, told only the way that works for a PMO copy -- the list put right and the copy published again, not Import a full board; browser storage is byte-identical',
        J([alM, mvM]), J([['“cycle.html” was not imported: ' + why + '.\n\n' + RULE + ' ' + NOW + ' ' + PLAN + ' Nothing on this board was changed.'], []]));
      // ✕ on the working plan's repeated row: its saved file is refused still, now for PB27's list; its package is taken
      const keys = R.ev(`(function(){ window.confirm=function(){ return true; }; rcnDel(1); return JSON.stringify([rcnReg().map(function(e){ return e.k; }), rcnAsgOf('R1')]); })()`);
      const saved2 = R.ev('buildSavedHtml()'), held3 = lsOf(R.ev), al3 = JSON.parse(await one(R.ev, saved2)), mv3 = moved(held3, lsOf(R.ev));
      w5Chk(name, at + '✕ on the working plan’s row 2, then its saved file, ⬅ Import one appropriation on the same board', 'R1 stays on K1; the file is refused still, now for PB27’s list, as the words said; browser storage is byte-identical',
        J([JSON.parse(keys), al3, mv3]), J([[['K1'], 'K1'], ['“cycle.html” was not imported: ' + AT_PB + TWICE + '.\n\n' + RULE + ' ' + NOW + ' ' + CYCLE + ' ' + FULL
          + ' Nothing on this board was changed.'], []]));
      const P2 = boot(), heldP2 = lsOf(P2.ev), alP2 = JSON.parse(await one(P2.ev, pkgOf(R.ev))), mvP2 = moved(heldP2, lsOf(P2.ev));
      w5Chk(name, at + '✕ on the working plan’s row 2, then its package, File → Import on a new board', 'CONTROL (as d66dd60) — taken: the package’s list is [K1]',
        J([alP2.filter(a => /was not imported/.test(a)), mvP2.includes('prio27om')]), J([[], true]));
      bootRelease(mk, []); await settleBoards();
    }
    // THE USER'S OWN BOARD WHOSE WORKING PLAN LISTS K1 TWICE, NO LOCKED CYCLE AMISS, taken whole and the browser reopened (verification
    // round 6, tests S1). ⬇ Export one appropriation names no way back that refuses the file it wrote: it says why, and the working
    // plan's way -- ✕ on the repeated row, and the file written again. After ✕ it says to take the file back, and a board takes it.
    // CONTROL: an ordinary board's export says to take its file back, as d66dd60's did.
    {
      const mk = bootMark();
      const EXP = '⬇ O&M exported as a working board of its own — its plan, its locked cycles, its execution data and its BAE rows, with the destination list, '
        + 'cost estimates and reprogramming log. ';
      const BACK = 'Take it back with Imports & exports → ⬅ Import one appropriation.';
      const NOT_BACK = 'It is not taken back by ⬅ Import one appropriation or ⇊ Import several boards, which refuse it: ';
      const stat = ev => ev(`(function(){ var _P=window.uiPrompt; window.uiPrompt=function(m,d,cb){ cb('1'); }; window.alert=function(){};
        try{ exportOneAppn(); }finally{ window.uiPrompt=_P; } return (document.getElementById('shareStat')||{}).textContent||''; })()`);
      const F = make({ asg: 'K1', plan: [K1, K1] }), T = boot({ html: F.own }); full(T.ev, F.file);
      const R = boot({ html: F.own, ls: lsOf(T.ev) });
      const at = 'the user’s own board whose working plan lists K1 twice, no locked cycle amiss · ', why = AT_WP + TWICE;
      w5Chk(name, at + '⬇ Export one appropriation', 'the status line names no way back that refuses the file: it says why, and the working plan’s way -- ✕, and the file written again',
        stat(R.ev), EXP + NOT_BACK + why + '. ' + RULE + ' ' + NOW + ' ' + PLAN + ' ' + FULL);
      const oneAp = R.ev(`oneAppnHtml(mySlug())||''`), held = lsOf(R.ev), al = JSON.parse(await one(R.ev, oneAp)), mv = moved(held, lsOf(R.ev));
      w5Chk(name, at + 'its one-appropriation file, ⬅ Import one appropriation on the same board', 'refused whole, as the status line said; browser storage is byte-identical',
        J([al, mv]), J([['“cycle.html” was not imported: ' + why + '.\n\n' + RULE + ' ' + NOW + ' ' + PLAN + ' ' + FULL + ' Nothing on this board was changed.'], []]));
      const keys = R.ev(`(function(){ window.confirm=function(){ return true; }; rcnDel(1); return JSON.stringify([rcnReg().map(function(e){ return e.k; }), rcnAsgOf('R1')]); })()`);
      w5Chk(name, at + '✕ on row 2, then ⬇ Export one appropriation', 'R1 stays on K1, and the status line says to take the file back',
        J([JSON.parse(keys), stat(R.ev)]), J([[['K1'], 'K1'], EXP + BACK]));
      const P = boot(), heldP = lsOf(P.ev), alP = JSON.parse(await one(P.ev, R.ev(`oneAppnHtml(mySlug())||''`))), mvP = moved(heldP, lsOf(P.ev));
      w5Chk(name, at + '✕ on row 2, then its one-appropriation file, ⬅ Import one appropriation on a new board', 'CONTROL (as d66dd60) — taken, as the status line says',
        J([alP.filter(a => /was not imported/.test(a)), mvP.includes('prio27om')]), J([[], true]));
      const K = make({ asg: 'K1', cyc: [K1] }), O = boot({ html: K.file });
      w5Chk(name, 'CONTROL (as d66dd60) · an ordinary board, PB27 [K1] · ⬇ Export one appropriation', 'the status line says to take the file back by Import one appropriation',
        stat(O.ev), EXP + BACK);
      bootRelease(mk, []); await settleBoards();
    }
    // A PACKAGE OR A PMO COPY REFUSED FOR AN ENTRY IN THE WORKING PLAN'S LIST THAT IS NOT ONE (verification round 6, money SF1). The
    // user's own board takes its working plan's ["K9", K1], or [0, K1], whole and the browser is reopened; its package and its PMO copy
    // are handed to a new board. Neither is a board of one's own, so neither is told it opens as one. ✕ on its row removes "K9", so
    // that way is named, and after it the door passes both; ✕ does nothing on 0 (rcnDel stops at it), so no way is named, and the
    // package is refused still.
    {
      const ENTRY = 'An RCN / EEIC list holds combinations and nothing else. No ORBIT makes such an entry.';
      const ENTRYX = 'It can be taken out on a board of this version, in 🗂 RCN / EEIC, where ✕ on its row removes it, and the file written again.';
      const pkgOf = ev => ev(`(function(){ var cap=null, _B=window.Blob; window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
        window.confirm=function(){ return true; }; window.alert=function(){}; try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
        try{ pkgIssue(mySlug(), true); }catch(e){ cap='threw: '+e.message; } window.Blob=_B; return cap||''; })()`);
      const pmoOf = ev => ev(`(function(){ var cap=null, _B=window.Blob; window.Blob=function(pt,o){ if(!cap && o && o.type==='text/html') cap=String(pt[0]); return new _B(pt,o); };
        window.confirm=function(){ return true; }; window.alert=function(){}; try{ publishPmoCopy(); }catch(e){ cap='threw: '+e.message; } window.Blob=_B; return cap||''; })()`);
      const W1 = '{"rcn":"11111","eeic":"AAAAA","t":"","svc":["USAF","ANG","AFRC"],"k":"K1"}';
      for (const [c, plan, shown, gone] of [['“K9”', ['K9', K1], '“"K9"”', true], ['the number 0', [0, K1], '“0”', false]]) {
        const mk = bootMark();
        const F = make({ asg: 'K1', plan }), T = boot({ html: F.own }); full(T.ev, F.file);
        const R = boot({ html: F.own, ls: lsOf(T.ev) });
        const at = 'the user’s own board whose working plan holds ' + c + ', then K1 · ';
        const told = (p, tail) => '“cycle.html” was not imported: the RCN / EEIC entry at ' + p + '.rcn[0] is not a combination (' + shown
          + '); a list holds combinations and nothing else.\n\n' + tail + ' Nothing on this board was changed.';
        const pkg = pkgOf(R.ev), pmo = pmoOf(R.ev);
        const P = boot(), heldP = lsOf(P.ev), alP = JSON.parse(await one(P.ev, pkg)), mvP = moved(heldP, lsOf(P.ev));
        w5Chk(name, at + 'its package, File → Import on a new board', gone ? 'refused whole, told the way that works: ✕ on its row, and the file written again; browser storage is byte-identical'
          : 'refused whole, told no way: ✕ does nothing on 0, and a package is not a board; browser storage is byte-identical',
          J([alP, mvP]), J([[told('the file.ms', gone ? ENTRY + ' ' + ENTRYX : ENTRY)], []]));
        const M = boot(), heldM = lsOf(M.ev), alM = JSON.parse(await one(M.ev, pmo)), mvM = moved(heldM, lsOf(M.ev));
        w5Chk(name, at + 'its PMO copy, File → Import on a new board', gone ? 'refused whole, told the way that works for a PMO copy: ✕ on its row, and the copy written again; browser storage is byte-identical'
          : 'refused whole, told no way: ✕ does nothing on 0, and a PMO copy is not a board of one’s own; browser storage is byte-identical',
          J([alM, mvM]), J([[told('the saved state.appns.om', gone ? ENTRY_TAIL + ' ' + ENTRYX : ENTRY_TAIL)], []]));
        const L = R.ev(`(function(){ window.confirm=function(){ return true; }; rcnDel(0); return JSON.stringify(rcnReg()); })()`);
        if (gone) {
          const pkg2 = pkgOf(R.ev), P2 = boot(), heldP2 = lsOf(P2.ev), alP2 = JSON.parse(await one(P2.ev, pkg2)), mvP2 = moved(heldP2, lsOf(P2.ev));
          w5Chk(name, at + '✕ on row 1, then its package and its PMO copy', 'CONTROL (as d66dd60) — the row is gone; the door passes both, and a new board takes the package',
            J([L, P2.ev(`inboundCheck(${J(pkg2)})`), P2.ev(`inboundCheck(${J(pmoOf(R.ev))})`), alP2.filter(a => /was not imported/.test(a)), mvP2.includes('prio27om')]),
            J(['[' + W1 + ']', '', '', [], true]));
        } else {
          const P2 = boot(), heldP2 = lsOf(P2.ev), alP2 = JSON.parse(await one(P2.ev, pkgOf(R.ev))), mvP2 = moved(heldP2, lsOf(P2.ev));
          w5Chk(name, at + '✕ on row 1, then its package, File → Import on a new board', 'the row stays, as ✕ does nothing on 0; the package is refused still, in the same words; browser storage is byte-identical',
            J([L, alP2, mvP2]), J(['[0,' + W1 + ']', [told('the file.ms', ENTRY)], []]));
        }
        bootRelease(mk, []); await settleBoards();
      }
    }
    // THE ✕ WAY, FOR EVERY KIND OF ENTRY IT IS SAID OR NOT SAID FOR (verification round 7, tests S1). A locked cycle's entry that ✕
    // would remove from a working plan ("K9" in PB27) is never told ✕ -- a locked cycle's list stays as it was locked -- by ⬅ Import one
    // appropriation or ⇊ Import several boards. A package or a PMO copy refused for false or "" (rcnDel stops at them) is told no way;
    // for 5 or [] it is told ✕, and ✕ clicked on that row in 🗂 RCN / EEIC takes it out, after which a new board takes the package. A
    // null entry among three files through ⇊ Import several boards is told no way, as among two.
    {
      const ENTRY = 'An RCN / EEIC list holds combinations and nothing else. No ORBIT makes such an entry.';
      const ENTRYX = 'It can be taken out on a board of this version, in 🗂 RCN / EEIC, where ✕ on its row removes it, and the file written again.';
      const W1 = '{"rcn":"11111","eeic":"AAAAA","t":"","svc":["USAF","ANG","AFRC"],"k":"K1"}';
      const pkgOf = ev => ev(`(function(){ var cap=null, _B=window.Blob; window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
        window.confirm=function(){ return true; }; window.alert=function(){}; try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
        try{ pkgIssue(mySlug(), true); }catch(e){ cap='threw: '+e.message; } window.Blob=_B; return cap||''; })()`);
      const pmoOf = ev => ev(`(function(){ var cap=null, _B=window.Blob; window.Blob=function(pt,o){ if(!cap && o && o.type==='text/html') cap=String(pt[0]); return new _B(pt,o); };
        window.confirm=function(){ return true; }; window.alert=function(){}; try{ publishPmoCopy(); }catch(e){ cap='threw: '+e.message; } window.Blob=_B; return cap||''; })()`);
      // ✕ on row 1, clicked in the open 🗂 RCN / EEIC panel, every question answered yes; the list after
      const clickX = ev => ev(`(function(){ window.confirm=function(){ return true; }; if(!rcnOpen) toggleRcn();
        var b=document.querySelectorAll('#rcnBody button.qb'), r=b.length? (b[0].click(), JSON.stringify(rcnReg())) : 'no ✕ button';
        if(rcnOpen) toggleRcn(); return r; })()`);
      {
        const mk = bootMark();
        const C = make({ asg: 'K1', cyc: ['K9', K1] });
        const whyC = 'the RCN / EEIC entry at the saved state.cycDb.byAp.om.cycles.PB|2027.rcn[0] is not a combination (“"K9"”); a list holds combinations and nothing else';
        for (const [rt, fn] of [['⬅ Import one appropriation', one], ['⇊ Import several boards', several]]) {
          const P = boot(), h = lsOf(P.ev), al = JSON.parse(await fn(P.ev, C.file)), mv = moved(h, lsOf(P.ev));
          w5Chk(name, 'the user’s own board whose PB27 holds “K9”, then K1 · its saved file, ' + rt + ' on a new board', 'refused whole, told the locked cycle’s words and never ✕; browser storage is byte-identical',
            J([al, mv]), J([['“cycle.html” was not imported: ' + whyC + '.\n\n' + ENTRY_TAIL + ' ' + CYCLE_ONLY + ' ' + OPENS + ' ' + FULL + ' Nothing on this board was changed.'], []]));
        }
        bootRelease(mk, []); await settleBoards();
      }
      for (const [c, plan, shown, gone, raw] of [['false', [false, K1], '“false”', false, '[false,' + W1 + ']'], ['“”', ['', K1], '“""”', false, '["",' + W1 + ']'],
        ['the number 5', [5, K1], '“5”', true, ''], ['[]', [[], K1], '“[]”', true, '']]) {
        const mk = bootMark();
        const F = make({ asg: 'K1', plan }), T = boot({ html: F.own }); full(T.ev, F.file);
        const R = boot({ html: F.own, ls: lsOf(T.ev) });
        const at = 'the user’s own board whose working plan holds ' + c + ', then K1 · ';
        const told = (p, tail) => '“cycle.html” was not imported: the RCN / EEIC entry at ' + p + '.rcn[0] is not a combination (' + shown
          + '); a list holds combinations and nothing else.\n\n' + tail + ' Nothing on this board was changed.';
        const pkg = pkgOf(R.ev), pmo = pmoOf(R.ev);
        const P = boot(), heldP = lsOf(P.ev), alP = JSON.parse(await one(P.ev, pkg)), mvP = moved(heldP, lsOf(P.ev));
        w5Chk(name, at + 'its package, File → Import on a new board', gone ? 'refused whole, told ✕ on its row and the file written again; browser storage is byte-identical'
          : 'refused whole, told no way: ✕ does nothing there; browser storage is byte-identical', J([alP, mvP]), J([[told('the file.ms', gone ? ENTRY + ' ' + ENTRYX : ENTRY)], []]));
        const M = boot(), heldM = lsOf(M.ev), alM = JSON.parse(await one(M.ev, pmo)), mvM = moved(heldM, lsOf(M.ev));
        w5Chk(name, at + 'its PMO copy, File → Import on a new board', gone ? 'refused whole, told ✕ on its row and the copy written again; browser storage is byte-identical'
          : 'refused whole, told no way; browser storage is byte-identical', J([alM, mvM]), J([[told('the saved state.appns.om', gone ? ENTRY_TAIL + ' ' + ENTRYX : ENTRY_TAIL)], []]));
        const after = clickX(R.ev);
        const P2 = boot(), held2 = lsOf(P2.ev), al2 = JSON.parse(await one(P2.ev, pkgOf(R.ev))), mv2 = moved(held2, lsOf(P2.ev));
        if (gone) w5Chk(name, at + '✕ clicked on row 1 in 🗂 RCN / EEIC, then its package, File → Import on a new board', 'CONTROL (as d66dd60) — the row is gone, and the package is taken',
          J([after, al2.filter(a => /was not imported/.test(a)), mv2.includes('prio27om')]), J(['[' + W1 + ']', [], true]));
        else w5Chk(name, at + '✕ clicked on row 1 in 🗂 RCN / EEIC, then its package, File → Import on a new board', 'the row stays, as ✕ does nothing there; the package is refused still, in the same words; browser storage is byte-identical',
          J([after, al2, mv2]), J([raw, [told('the file.ms', ENTRY)], []]));
        bootRelease(mk, []); await settleBoards();
      }
      {
        const mk = bootMark();
        const F = make({ asg: 'K1', plan: [null, K1] });
        const three = ev => ev(`new Promise(function(res){ var al=[]; window.alert=function(m){ al.push(String(m)); }; window.confirm=function(){ return true; };
          var inp={files:[new File([${J(F.file)}], 'cycle.html'), new File([${J(F.own)}], 'a.html'), new File([${J(F.own)}], 'b.html')], value:'x'};
          try{ importBoards(inp); }catch(e){ al.push('THREW '+e.message); }
          (function wait(n){ if(inp.value==='' || n>600) return res(JSON.stringify(al)); setTimeout(function(){ wait(n+1); }, 5); })(0); })`);
        const P = boot(), h = lsOf(P.ev), al = JSON.parse(await three(P.ev)), mv = moved(h, lsOf(P.ev));
        w5Chk(name, 'an entry that is not one · beside two board files, ⇊ Import several boards', 'the batch of three is refused whole, naming no way; browser storage is byte-identical',
          J([al, mv]), J([['“cycle.html” was not imported: the RCN / EEIC entry at the saved state.appns.om.rcn[0] is not a combination (“null”); a list holds combinations and nothing else'
            + ' (so none of the 3 files was taken).\n\n' + ENTRY_TAIL + ' Nothing on this board was changed.'], []]));
        bootRelease(mk, []); await settleBoards();
      }
    }
    // A LOCK WHILE THE WORKING PLAN'S LIST BREAKS THE RULE (verification round 7, money MF1). A lock keeps the list as it is, and a
    // locked cycle's list stays as it was locked. The user's own board took its file whole -- its working plan listing K1 twice -- and
    // locked POM27, and was asked nothing of the list; every file of that board was then refused by ⬅ Import one appropriation and
    // ⇊ Import several boards, for POM27, though ✕ on the repeated row put the working plan right. The question now says so first, and
    // what it says holds: Cancel locks nothing; answered yes, POM27 keeps [K1, K1] and exports R1's money once, and the saved file is
    // refused on a new board and on the same one, before ✕ and after it. ✕ on the repeated row first, and the lock asks what it
    // always did, POM27 keeps [K1], and a new board takes the saved file. An entry that is not one ("K9") is said as the door says it.
    // CONTROL: an ordinary [K1, K2] is asked what it always was.
    {
      const Q = 'Lock O&M’s FYDP window as POM27?\n\nThis locks O&M alone; each appropriation is locked on its own board.\n\nFY27 — every requirement, its value, allocation and funding by service, the PMO roll-up and the '
        + 'budget authority of each year — are copied whole and LOCKED.\n\nFY28, FY29, FY30, FY31 hold no plan yet and will be recorded as such.';
      const QEND = '\n\nThe working board is not changed.';
      const KEEPS = what => '\n\nThe RCN / EEIC list it keeps ' + what + '. A locked cycle’s list stays as it was locked, so ⬅ Import one '
        + 'appropriation and ⇊ Import several boards will refuse every file that carries this cycle, on every board of this version.';
      // Lock POM27 (FY27), every question kept and answered `yes`; whether POM27 is there after, and the list it keeps
      const lock = (ev, yes) => JSON.parse(ev(`(function(){ var qs=[]; window.confirm=function(q){ qs.push(String(q)); return ${yes}; };
        window.alert=function(){}; blCyc='POM'; blYr=2027; /* v2.15 W1 (item 139): a lock as v2.14 took it (w1LockAsBefore) */ ${w1LockAsBefore()} var c=blGet('POM|2027'); return JSON.stringify({qs:qs, made:!!c, rcn:c? c.rcn : null}); })()`));
      const at = 'the user’s own board whose working plan lists K1 twice, taken whole · ';
      {
        const mk = bootMark();
        const F = make({ asg: 'K1', cyc: [K1], plan: [K1, K1] }), T = boot({ html: F.own }); full(T.ev, F.file);
        const R = boot({ html: F.own, ls: lsOf(T.ev) });
        const held = lsOf(R.ev), c0 = lock(R.ev, false);
        w5Chk(name, at + 'Lock POM27, answered Cancel', 'the question says what the list it keeps holds, and that every file carrying the cycle will be refused; nothing is locked, and browser storage is byte-identical',
          J([c0.qs, c0.made, moved(held, lsOf(R.ev))]), J([[Q + KEEPS(TWICE) + QEND], false, []]));
        const c1 = lock(R.ev, true);
        w5Chk(name, at + 'Lock POM27, answered yes', 'GUARD (as d66dd60) — asked once; POM27 keeps the list as it is', J([c1.qs.length, c1.made, c1.rcn]), J([1, true, [K1, K1]]));
        w5Chk(name, at + 'Lock POM27, answered yes, then POM27 exported', 'the RCN-EEIC sheet, read from the workbook’s bytes: USAF 900, ANG 200, all services 1,100, each once, under 11111 / AAAAA',
          await sheet(R.w, R.ev, 'POM|2027'), WANT('POM|2027', ON_K1));
        const told = '“cycle.html” was not imported: ' + AT_WP + TWICE + '.\n\n' + RULE + ' ' + NOW + ' ' + TOO + ' ' + CYCLE + ' ' + FULL + ' Nothing on this board was changed.';
        const sv = R.ev('buildSavedHtml()'), P = boot(), hP = lsOf(P.ev), alP = JSON.parse(await one(P.ev, sv)), mvP = moved(hP, lsOf(P.ev));
        const hR = lsOf(R.ev), alR = JSON.parse(await several(R.ev, sv)), mvR = moved(hR, lsOf(R.ev));
        w5Chk(name, at + 'Lock POM27, answered yes, then its saved file, ⬅ Import one appropriation on a new board and ⇊ Import several boards on the same one',
          'refused whole by each, as the question said; browser storage is byte-identical', J([alP, mvP, alR, mvR]), J([[told], [], [told], []]));
        R.ev(`(function(){ window.confirm=function(){ return true; }; rcnDel(1); return 'ok'; })()`);
        const sv2 = R.ev('buildSavedHtml()'), P2 = boot(), h2 = lsOf(P2.ev), al2 = JSON.parse(await one(P2.ev, sv2)), mv2 = moved(h2, lsOf(P2.ev));
        w5Chk(name, at + 'Lock POM27, answered yes, then ✕ on row 2, then its saved file, ⬅ Import one appropriation on a new board',
          'the working plan is put right, and the file is refused still, for POM27’s list, which stays as it was locked; browser storage is byte-identical',
          J([R.ev(`JSON.stringify(rcnReg().map(function(e){ return e.k; }))`), al2, mv2]),
          J(['["K1"]', ['“cycle.html” was not imported: the RCN / EEIC list at the saved state.cycDb.byAp.om.cycles.POM|2027.rcn ' + TWICE + '.\n\n' + RULE + ' '
            + NOW + ' ' + CYCLE + ' ' + FULL + ' Nothing on this board was changed.'], []]));
        bootRelease(mk, []); await settleBoards();
      }
      {
        const mk = bootMark();
        const F = make({ asg: 'K1', cyc: [K1], plan: [K1, K1] }), T = boot({ html: F.own }); full(T.ev, F.file);
        const R = boot({ html: F.own, ls: lsOf(T.ev) });
        const keys = R.ev(`(function(){ window.confirm=function(){ return true; }; rcnDel(1); return JSON.stringify([rcnReg().map(function(e){ return e.k; }), rcnAsgOf('R1')]); })()`);
        w5Chk(name, at + '✕ on row 2 first', 'the row goes, and R1 stays on K1', keys, J([['K1'], 'K1']));
        const c = lock(R.ev, true);
        w5Chk(name, at + '✕ on row 2 first, then Lock POM27', 'CONTROL (as d66dd60) — the lock asks what it always did, and POM27 keeps [K1]', J([c.qs, c.made, c.rcn]), J([[Q + QEND], true, [K1]]));
        w5Chk(name, at + '✕ on row 2 first, then Lock POM27, then POM27 exported', 'the RCN-EEIC sheet, read from the workbook’s bytes: USAF 900, ANG 200, all services 1,100, each once, under 11111 / AAAAA',
          await sheet(R.w, R.ev, 'POM|2027'), WANT('POM|2027', ON_K1));
        const P = boot(), hP = lsOf(P.ev), alP = JSON.parse(await one(P.ev, R.ev('buildSavedHtml()'))), mvP = moved(hP, lsOf(P.ev));
        w5Chk(name, at + '✕ on row 2 first, then Lock POM27, then its saved file, ⬅ Import one appropriation on a new board', 'CONTROL (as d66dd60) — taken',
          J([alP.filter(a => /was not imported/.test(a)), mvP.includes('prio27om')]), J([[], true]));
        bootRelease(mk, []); await settleBoards();
      }
      {
        const mk = bootMark();
        const O = boot({ html: make({ asg: 'K1', cyc: [K1], plan: ['K9', K1] }).file }), held = lsOf(O.ev), c = lock(O.ev, false);
        w5Chk(name, 'a board whose working plan holds “K9”, then K1, opened from its file · Lock POM27, answered Cancel',
          'the question says the entry as the door says it, and that every file carrying the cycle will be refused; nothing is locked, and browser storage is byte-identical',
          J([c.qs, c.made, moved(held, lsOf(O.ev))]),
          J([[Q + KEEPS('holds rcn[0], which is not a combination (“"K9"”); a list holds combinations and nothing else') + QEND], false, []]));
        const N = boot({ html: make({ asg: 'K1', cyc: [K1], plan: [K1, K2] }).file }), d = lock(N.ev, true);
        w5Chk(name, 'CONTROL (as d66dd60) · a board whose working plan lists ordinary K1, K2, opened from its file · Lock POM27', 'the lock asks what it always did, and POM27 keeps [K1, K2]',
          J([d.qs, d.made, d.rcn]), J([[Q + QEND], true, [K1, K2]]));
        bootRelease(mk, []); await settleBoards();
      }
      // v2.00 (U32, U33; verification round 8): THE QUESTION FOR THE OTHER WAYS A LIST BREAKS THE RULE. The lock asks when the list it
      // keeps breaks the rule in any way the door refuses -- a key that is not text, and a key beginning with two underscores, as
      // well as a key repeated and an entry that is not one -- and says it as the door says it; answered yes, POM27 keeps the list as
      // it is, and the saved file is refused, as the question said.
      {
        const mk = bootMark();
        for (const [c, plan, what] of [['the number 1 as a key', [N1, K1], NOT_TEXT],
          ['an entry named “__none__”', [NN, K1], 'holds the key “__none__” (rcn[0]); a key beginning with two underscores is one the board keeps for its own bookkeeping']]) {
          const at2 = 'a board whose working plan holds ' + c + ', then K1, opened from its file · ';
          const O = boot({ html: make({ asg: 'K1', cyc: [K1], plan }).file }), held = lsOf(O.ev), c0 = lock(O.ev, false);
          w5Chk(name, at2 + 'Lock POM27, answered Cancel', 'the question says what the list it keeps holds, as the door says it; nothing is locked, and browser storage is byte-identical',
            J([c0.qs, c0.made, moved(held, lsOf(O.ev))]), J([[Q + KEEPS(what) + QEND], false, []]));
          const c1 = lock(O.ev, true), P = boot(), hP = lsOf(P.ev), alP = JSON.parse(await one(P.ev, O.ev('buildSavedHtml()'))), mvP = moved(hP, lsOf(P.ev));
          w5Chk(name, at2 + 'Lock POM27, answered yes, then its saved file, ⬅ Import one appropriation on a new board',
            'POM27 keeps the list as it is, and the file is refused, as the question said; browser storage is byte-identical',
            J([c1.rcn, alP, mvP]), J([plan, ['“cycle.html” was not imported: ' + AT_WP + what + '.\n\n' + RULE + ' ' + NOW + ' ' + TOO + ' ' + CYCLE + ' '
              + FULL + ' Nothing on this board was changed.'], []]));
        }
        bootRelease(mk, []); await settleBoards();
      }
    }
    // A LOCKED CYCLE UNLOCKED, THEN DELETED OR LOCKED OVER (verification round 8, money MF1). The refusal said of such a cycle's
    // list "and no board changes it", and the board that wrote the file changes it: 🔓 Unlock asks "Unlocking lets it be overwritten
    // or deleted", and then 🗑 Delete removes the cycle, or 🔒 Lock over it replaces it with the working plan's. So the refusal says
    // only what holds: a locked cycle's list stays as it was locked. The user's own board holding PB27 [K1, K1], taken whole and the
    // browser reopened: PB27 unlocked, its saved file carries PB27 unlocked, [K1, K1], and is refused by ⬅ Import one appropriation on
    // a new board in those words, browser storage byte-identical; then PB27 deleted -- or, on a second such board, locked over, its
    // list now the working plan's [K1] -- and the saved file written again is taken. That gives up PB27 as it was locked.
    {
      const UNLOCK = 'Unlock PB27?\n\nA locked cycle is meant to be a fixed point in time. Unlocking lets it be overwritten or deleted. The unlock is '
        + 'stamped with your name.';
      const QPB = 'Lock O&M’s FYDP window as PB27?\n\nThis locks O&M alone; each appropriation is locked on its own board.\n\nFY27 — every requirement, its value, allocation and funding by service, the PMO roll-up and the '
        + 'budget authority of each year — are copied whole and LOCKED.\n\nFY28, FY29, FY30, FY31 hold no plan yet and will be recorded as such.'
        + '\n\nThis replaces the existing O&M PB27 cycle.\n\nThe working board is not changed.';
      const told = '“cycle.html” was not imported: ' + AT_PB + TWICE + '.\n\n' + RULE + ' ' + NOW + ' ' + CYCLE + ' ' + FULL + ' Nothing on this board was changed.';
      // every question `code` asks, kept and answered yes, and what `out` reads after
      const asked = (ev, code, out) => JSON.parse(ev(`(function(){ var qs=[]; window.confirm=function(q){ qs.push(String(q)); return true; };
        window.alert=function(){}; ${code} return JSON.stringify({qs:qs, out:${out}}); })()`));
      // PB27 as the saved file carries it: [locked, its list]
      const pb27 = file => { const st = JSON.parse(file.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/)[1]) || {};
        const c = ((((st.cycDb || {}).byAp || {}).om || {}).cycles || {})['PB|2027']; return c ? [c.locked, c.rcn] : null; };
      for (const way of ['🗑 Delete PB27', '🔒 Lock PB27 over it']) {
        const mk = bootMark();
        const F = make({ asg: 'K1', cyc: [K1, K1] }), T = boot({ html: F.own }); full(T.ev, F.file);
        const R = boot({ html: F.own, ls: lsOf(T.ev) });
        const at = (way === '🗑 Delete PB27' ? 'the user’s own board holding PB27 [K1, K1], taken whole' : 'a second such board') + ' · 🔓 Unlock PB27, ';
        const u = asked(R.ev, `blLock('PB|2027', false);`, `blGet('PB|2027').locked`), sv = R.ev('buildSavedHtml()');
        const P = boot(), hP = lsOf(P.ev), alP = JSON.parse(await one(P.ev, sv)), mvP = moved(hP, lsOf(P.ev));
        w5Chk(name, at + 'then its saved file, ⬅ Import one appropriation on a new board',
          'unlocked, as its question says; the file carries PB27 unlocked, [K1, K1], and is refused whole in words true after it -- never that no board changes the list; browser storage is byte-identical',
          J([u.qs, u.out, pb27(sv), alP, mvP]), J([[UNLOCK], false, [false, [K1, K1]], [told], []]));
        if (way === '🗑 Delete PB27') {
          const d = asked(R.ev, `blDelete('PB|2027');`, `!blGet('PB|2027')`);
          w5Chk(name, at + 'then 🗑 Delete PB27', 'CONTROL (as d66dd60) — asked, and PB27 is gone', J([d.qs, d.out]), J([['Delete the PB27 cycle?\n\nIt cannot be recovered.'], true]));
        } else {
          const c = asked(R.ev, `blCyc='PB'; blYr=2027; cycLock();`, `(function(c){ return c? [c.locked, c.rcn] : null; })(blGet('PB|2027'))`);
          w5Chk(name, at + 'then 🔒 Lock PB27 over it', 'CONTROL (as d66dd60) — asked once, as for any cycle it replaces; PB27 is locked again, its list the working plan’s [K1]',
            J([c.qs, c.out]), J([[QPB], [true, [K1]]]));
          w5Chk(name, at + 'then 🔒 Lock PB27 over it, then PB27 exported', 'GUARD (as d66dd60) — the RCN-EEIC sheet, read from the workbook’s bytes: USAF 900, ANG 200, all services 1,100, each once, under 11111 / AAAAA',
            await sheet(R.w, R.ev, 'PB|2027'), WANT('PB|2027', ON_K1));
        }
        const sv2 = R.ev('buildSavedHtml()'), P2 = boot(), h2 = lsOf(P2.ev), al2 = JSON.parse(await one(P2.ev, sv2)), mv2 = moved(h2, lsOf(P2.ev));
        w5Chk(name, at + 'then ' + way + ', then its saved file written again, ⬅ Import one appropriation on a new board', 'CONTROL (as d66dd60) — taken: the file no longer carries PB27 as it was locked',
          J([pb27(sv2), al2.filter(a => /was not imported/.test(a)), mv2.includes('prio27om')]), J([way === '🗑 Delete PB27' ? null : [true, [K1]], [], true]));
        bootRelease(mk, []); await settleBoards();
      }
    }
    // WHO SAVED THE FILE, AS THE FILE SAYS IT: Codex 1's file naming v1.99 is from an ORBIT before this one, and is told so; a state
    // file (.json) names no version and is said to come from none, and is told only of the way that works for it -- the working
    // plan's list put right, the file saved again -- never of Import a full board or opening it, which take a board .html alone.
    {
      const mk = bootMark();
      const F = make({ asg: 'K1', cyc: [K1, K1] }), T = boot({ html: F.own });
      const old = F.file.replace(/const BUILD='v\d+\.\d+[^']*'/, "const BUILD='v1.99 (6 Oct 2026)'");
      w5Chk(name, 'a file that says v1.99 saved it · the fixture', 'the fixture really does carry the older version', String(old.includes("const BUILD='v1.99 (6 Oct 2026)'")), 'true');
      const heldO = lsOf(T.ev), alO = JSON.parse(await one(T.ev, old)), mvO = moved(heldO, lsOf(T.ev));
      w5Chk(name, 'a file that says v1.99 saved it · ⬅ Import one appropriation', 'refused whole: an ORBIT before this one took such a list, and the way named works for a locked cycle’s; browser storage is byte-identical',
        J([alO, mvO]), J([['“cycle.html” was not imported: ' + AT_PB + TWICE + '.\n\n' + RULE + ' ' + OLD + ' ' + CYCLE + ' ' + FULL + ' Nothing on this board was changed.'], []]));
      const W = make({ asg: 'K1', plan: [K1, K1] });
      const st = JSON.parse(W.file.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/)[1]);
      const heldJ = lsOf(T.ev), alJ = JSON.parse(await one(T.ev, J(st.appns ? st.appns.om : st))), mvJ = moved(heldJ, lsOf(T.ev));
      w5Chk(name, 'a state file (.json) of the working plan’s [K1, K1] · File → Import', 'refused whole: it names no version and is not said to come from one; only the way that works for it is named; browser storage is byte-identical',
        J([alJ, mvJ]), J([['“cycle.html” was not imported: the RCN / EEIC list at the file.rcn holds the key “K1” twice (rcn[0] and rcn[1]); a key names one combination.\n\n'
          + RULE + ' ' + PLAN + ' Nothing on this board was changed.'], []]));
      bootRelease(mk, []); await settleBoards();
    }
    // THE WORKING PLAN'S LIST AS THE FILE HOLDS IT (verification round 5, tests S1). The full import says "RCN / EEIC lists as the file
    // holds them": a list that repeats a key on two codes, or holds an entry that is not one, comes across row for row -- written,
    // reopened, saved and reopened. GUARD: d66dd60 kept them too; a full import that tidied the list would lose a row of the user's own
    // board without a word, and the money would not show it (the first row wins).
    {
      const W1 = '{"rcn":"11111","eeic":"AAAAA","t":"","svc":["USAF","ANG","AFRC"],"k":"K1"}', W2 = '{"rcn":"22222","eeic":"BBBBB","t":"","svc":["USAF","ANG","AFRC"],"k":"K1"}';
      for (const [c, plan, raw] of [['K1 twice, on two codes', [K1, K1b], '[' + W1 + ',' + W2 + ']'], ['“K9”, then K1', ['K9', K1], '["K9",' + W1 + ']'],
        ['the number 0, then K1', [0, K1], '[0,' + W1 + ']'], ['[], then K1', [[], K1], '[[],' + W1 + ']']]) {
        const mk = bootMark(), F = make({ asg: 'K1', plan }), T = boot({ html: F.own }), r = full(T.ev, F.file), after = lsOf(T.ev);
        const R = boot({ html: F.own, ls: after }), R2 = boot({ html: R.ev('buildSavedHtml()') });
        w5Chk(name, 'the working plan’s list holds ' + c + ' · ⬅ Import a full board into the user’s own board', 'GUARD (as d66dd60) — the list is kept as the file holds it: written, the same browser reopened, saved and reopened',
          J([r.ret, J((JSON.parse(after.prio27om || '{}')).rcn), R.ev('JSON.stringify(MS.rcn)'), R2.ev('JSON.stringify(MS.rcn)')]), J([true, raw, raw, raw]));
        bootRelease(mk, []); await settleBoards();
      }
    }
    // a null entry in the working plan's list: every reader of that list stops at it, so even the user's own board is refused for it
    {
      const mk = bootMark();
      const F = make({ asg: 'K1', plan: [null, K1] }), T = boot({ html: F.own });
      const why = 'the RCN / EEIC entry at the saved state.appns.om.rcn[0] is not a combination (“null”); a list holds combinations and nothing else';
      w5Chk(name, 'an entry that is not one · the door', 'a file handed over is refused, saying where', T.ev(`inboundCheck(${J(F.file)})`), why);
      const held = lsOf(T.ev), r = full(T.ev, F.file), mv = moved(held, lsOf(T.ev));
      w5Chk(name, 'an entry that is not one · ⬅ Import a full board', 'refused whole, in true words, and browser storage is byte-identical',
        J([r.ret, r.threw, r.al, r.stat, mv]),
        J([false, '', ['“cycle.html” was not imported: ' + why + '.\n\n' + ENTRY_TAIL + ' Nothing on this board was changed.'], '⚠ Nothing imported — “cycle.html” was refused: ' + why + '.', []]));
      // beside the user's own board file, through ⇊ Import several boards (verification round 6, MF1 of both lenses): the batch adds how
      // many files were not taken to the reason, and the refusal still names no way -- not that the file opens as a board, nor ⬅ Import
      // a full board, which refuses it as above. A file that also carries PB27 [K1, K1] is told of that locked cycle too, and no way.
      const two = (ev, a, b) => ev(`new Promise(function(res){ var al=[]; window.alert=function(m){ al.push(String(m)); };
        window.confirm=function(){ return true; };
        var inp={files:[new File([${J(a)}], 'cycle.html'), new File([${J(b)}], 'a.html')], value:'x'};
        try{ importBoards(inp); }catch(e){ al.push('THREW '+e.message); }
        (function wait(n){ if(inp.value==='' || n>600) return res(JSON.stringify(al)); setTimeout(function(){ wait(n+1); }, 5); })(0); })`);
      const Q = boot(), heldQ = lsOf(Q.ev), alQ = JSON.parse(await two(Q.ev, F.file, F.own)), mvQ = moved(heldQ, lsOf(Q.ev));
      w5Chk(name, 'an entry that is not one · beside the user’s own board file, ⇊ Import several boards', 'the batch is refused whole, naming no way -- not opening the file, nor ⬅ Import a full board, which refuses it; browser storage is byte-identical',
        J([alQ, mvQ]), J([['“cycle.html” was not imported: ' + why + ' (so none of the 2 files was taken).\n\n' + ENTRY_TAIL + ' Nothing on this board was changed.'], []]));
      const F2 = make({ asg: 'K1', plan: [null, K1], cyc: [K1, K1] });
      const Q1 = boot(), held1 = lsOf(Q1.ev), al1 = JSON.parse(await several(Q1.ev, F2.file)), mv1 = moved(held1, lsOf(Q1.ev));
      w5Chk(name, 'an entry that is not one, beside PB27 [K1, K1] · ⇊ Import several boards', 'refused whole, naming the locked cycle too, and no way; browser storage is byte-identical',
        J([al1, mv1]), J([['“cycle.html” was not imported: ' + why + '.\n\n' + ENTRY_TAIL + ' ' + TOO + ' ' + CYCLE_ONLY + ' Nothing on this board was changed.'], []]));
      const Q2 = boot(), held2 = lsOf(Q2.ev), al2 = JSON.parse(await two(Q2.ev, F2.file, F2.own)), mv2 = moved(held2, lsOf(Q2.ev));
      w5Chk(name, 'an entry that is not one, beside PB27 [K1, K1] · beside the user’s own board file, ⇊ Import several boards', 'the batch is refused whole, in the same words; browser storage is byte-identical',
        J([al2, mv2]), J([['“cycle.html” was not imported: ' + why + ' (so none of the 2 files was taken).\n\n' + ENTRY_TAIL + ' ' + TOO + ' ' + CYCLE_ONLY + ' Nothing on this board was changed.'], []]));
      bootRelease(mk, []); await settleBoards();
    }
    // the help for Import one appropriation: which files it refuses, whichever board saved them, and what takes them
    {
      const X = boot();
      w5Chk(name, 'the help · ⬅ Import one appropriation', 'it says a file carrying a locked cycle whose list breaks the rule is refused, whichever board saved it, and what takes it',
        X.ev(`(function(){ var s=helpSections().filter(function(x){ return x.id==='t-one'; })[0]; if(!s) return 'no section';
          var p=[].slice.call(s.el.querySelectorAll('p')).filter(function(p){ return /Import one appropriation…/.test(p.textContent); })[0]; return p? p.textContent : 'no paragraph'; })()`),
        'Imports & exports › Import one appropriation… takes appropriations back from any board file. It lists what the file holds and '
          + 'takes only what you name; each one is checked for work this board did meanwhile and previewed before it replaces anything, and its locked '
          + 'cycles come with it. Nothing else on the board changes. A file that carries a locked cycle whose RCN / EEIC list breaks the rule for one — a '
          + 'key repeated, missing, not text or beginning with two underscores, or something in it that is not an entry — is refused, whichever board saved '
          + 'it: a locked cycle’s list stays as it was locked. Such a file opens as a board, and Imports & exports › Import a full '
          + 'board (new version)… takes it whole.');
    }
    // the door on the rest of the rule
    {
      const X = boot(), at = 'the RCN / EEIC list at the file.rcn ';
      const door = L => X.ev(`inboundCheck(${J(J({ rcn: L }))})`);
      [[[K1, K2, K1], 'holds the key “K1” twice (rcn[0] and rcn[2]); a key names one combination', 'K1 repeated apart'],
       [[K1, K1, K1], 'holds the key “K1” 3 times (rcn[0], rcn[1] and rcn[2]); a key names one combination', 'K1 three times'],
       [[E('__x', '33333', 'CCCCC')], 'holds the key “__x” (rcn[0]); a key beginning with two underscores is one the board keeps for its own bookkeeping', 'a key beginning with two underscores, not “__none__”'],
       [[E(undefined, '33333', 'CCCCC')], 'holds an entry with no key (rcn[0]); a key is text', 'an entry with no key'],
       [[E(true, '33333', 'CCCCC')], 'holds a key that is not text (rcn[0].k is the value true); a key is text', 'a key that is not text']]
        .forEach(([L, w, c]) => w5Chk(name, 'the door · ' + c, 'refused, saying what the list holds and why', door(L), at + w));
      // keys every object answers to: refused in words, never a throw -- once each by the rule every key value meets, twice as repeated
      const doorT = L => X.ev(`(function(){ try{ return inboundCheck(${J(J({ rcn: L }))}); }catch(e){ return 'threw: '+e.message; } })()`);
      w5Chk(name, 'the door · keys every object answers to, each once', 'CONTROL (as d66dd60) — refused in words, by the rule every key value meets',
        doorT([K1, E('constructor', '33333', 'CCCCC'), E('toString', '44444', 'DDDDD'), E('valueOf', '55555', 'EEEEE')]),
        'the k at the file.rcn[1] is “constructor”, a name the board keeps for itself or every object already answers to');
      w5Chk(name, 'the door · “constructor” twice', 'refused, saying what the list holds and why',
        doorT([E('constructor', '33333', 'CCCCC'), E('constructor', '44444', 'DDDDD')]),
        at + 'holds the key “constructor” twice (rcn[0] and rcn[1]); a key names one combination');
    }
    // a full import that stops early -- the file is not a board, or the answer is no -- leaves nothing behind: the next file handed
    // over is held to the whole rule
    {
      const mk = bootMark();
      const F = make({ asg: 'K1', cyc: [K1, K1] }), T = boot({ html: F.own });
      const al = T.ev(`(function(){ var al=[]; window.alert=function(m){ al.push(String(m).split('\\n')[0]); }; fullImportText('{"x":1}', 'notes.json'); return JSON.stringify(al); })()`);
      w5Chk(name, 'after ⬅ Import a full board of a file that is not a board', 'it says so, and the next file handed over is refused for K1 twice',
        J([al, T.ev(`inboundCheck(${J(F.file)})`)]), J([J(['“notes.json” is not a board file.']), AT_PB + TWICE]));
      T.ev(`window.confirm=function(){ return false; }; window.alert=function(){}; fullImportText(${J(F.file)}, 'cycle.html'); 'ok'`);
      w5Chk(name, 'after ⬅ Import a full board answered no', 'the next file handed over is refused for K1 twice', T.ev(`inboundCheck(${J(F.file)})`), AT_PB + TWICE);
      bootRelease(mk, []); await settleBoards();
    }
    // the team's own copies: a copy in the shared folder and the sidecar were written by a board -- a list an earlier ORBIT took
    // and saved is read as it is, never refused (refused, every later Save to the folder was refused and the work stayed unsaved)
    {
      const mk = bootMark();
      const F = make({ asg: 'K1', plan: [K1, K1] }), T = boot({ html: F.own });
      const st = JSON.parse(F.file.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/)[1]), om = st.appns ? st.appns.om : st;
      const copy = J({ store: om, by: 'Teammate', ts: 1 });
      w5Chk(name, 'the team’s own copies · the shared folder’s', 'CONTROL (d66dd60 has no list rule) — read, its list [K1, K1] as a board saved it',
        T.ev(`(function(){ try{ return JSON.stringify(driveParse(${J(copy)}).store.rcn.map(function(e){ return e.k; })); }catch(e){ return 'threw: '+e.message; } })()`), J(['K1', 'K1']));
      w5Chk(name, 'the team’s own copies · the same text, handed over', 'refused', T.ev(`inboundCheck(${J(copy)})`),
        'the RCN / EEIC list at the file.store.rcn holds the key “K1” twice (rcn[0] and rcn[1]); a key names one combination');
      w5Chk(name, 'the team’s own copies · the sidecar beside the board', 'CONTROL (d66dd60 has no list rule) — read, its list [K1, K1] as a board saved it',
        await T.ev(`new Promise(function(res){ var f0=window.fetch; window.fetch=function(){ return Promise.resolve({ok:true, text:function(){ return Promise.resolve(${J(J(om))}); }}); };
          loadShared(function(s){ window.fetch=f0; res(s && s.rcn? JSON.stringify(s.rcn.map(function(e){ return e.k; })) : String(s)); }); })`), J(['K1', 'K1']));
      // a list holding null, then K1, which even the user's own board is refused for: the team's copies are read as before all the same
      const Fn = make({ asg: 'K1', plan: [null, K1] }), Tn = boot({ html: Fn.own });
      const stn = JSON.parse(Fn.file.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/)[1]), omn = stn.appns ? stn.appns.om : stn;
      w5Chk(name, 'the team’s own copies, null then K1 · the shared folder’s', 'CONTROL (as d66dd60) — read, its list [null, K1] as a board saved it',
        Tn.ev(`(function(){ try{ return JSON.stringify(driveParse(${J(J({ store: omn, by: 'Teammate', ts: 1 }))}).store.rcn.map(function(e){ return e && e.k; })); }catch(e){ return 'threw: '+e.message; } })()`), J([null, 'K1']));
      w5Chk(name, 'the team’s own copies, null then K1 · the sidecar beside the board', 'CONTROL (as d66dd60) — read, its list [null, K1] as a board saved it',
        await Tn.ev(`new Promise(function(res){ var f0=window.fetch; window.fetch=function(){ return Promise.resolve({ok:true, text:function(){ return Promise.resolve(${J(J(omn))}); }}); };
          loadShared(function(s){ window.fetch=f0; res(s && s.rcn? JSON.stringify(s.rcn.map(function(e){ return e && e.k; })) : String(s)); }); })`), J([null, 'K1']));
      bootRelease(mk, []); await settleBoards();
    }
    // ✕ on a row that repeats a key: the list [K1 11111 / AAAAA, K1 22222 / BBBBB], R1 on K1 -- which the board shows as 11111 / AAAAA
    {
      const mk = bootMark();
      const FR = make({ asg: 'K1', plan: [K1, K1b] }), O = boot({ html: FR.file });
      w5Chk(name, 'a row that repeats a key · the RCN / EEIC panel', 'the second row says it repeats the first; the first is used by R1',
        O.ev(`(function(){ rcnOpen=true; render(); return JSON.stringify([].slice.call(document.querySelectorAll('#rcnBody tr')).slice(1).map(function(tr){ return tr.cells[6].textContent; })); })()`),
        J(['1', '⚠ repeats row 1']));
      w5Chk(name, 'a row that repeats a key · ✕ on row 2', 'that row alone goes, R1 stays on K1 (11111 / AAAAA, where the board showed it), and the question says so',
        O.ev(`(function(){ var qs=[]; window.confirm=function(q){ qs.push(String(q)); return true; }; rcnDel(1);
          return JSON.stringify({qs:qs, list:rcnReg().map(function(e){ return [e.k, e.rcn]; }), r1:rcnAsgOf('R1'), label:rcnLabel(rcnAsgOf('R1'))}); })()`),
        J({ qs: ['Remove RCN 22222 / EEIC BBBBB?\n\nIt has the same key as row 1 (11111 / AAAAA), and every assignment to that key reads row 1, which stays. No assignment is changed.'],
          list: [['K1', '11111']], r1: 'K1', label: ON_K1 }));
      const OR = boot({ html: FR.file, ls: lsOf(O.ev) });
      w5Chk(name, 'a row that repeats a key · ✕ on row 2, the same browser reopened', 'saved: the list is [K1 11111 / AAAAA] and R1 is still on K1',
        OR.ev(`JSON.stringify({list:rcnReg().map(function(e){ return [e.k, e.rcn]; }), r1:rcnAsgOf('R1')})`), J({ list: [['K1', '11111']], r1: 'K1' }));
      const O1 = boot({ html: make({ asg: 'K1', plan: [K1, K1b] }).file });
      w5Chk(name, 'a row that repeats a key · ✕ on row 1', 'CONTROL (as d66dd60) — row 1 goes, and every assignment to K1 is cleared, as the question says: none is moved onto row 2’s codes',
        O1.ev(`(function(){ var qs=[]; window.confirm=function(q){ qs.push(String(q)); return true; }; rcnDel(0);
          return JSON.stringify({qs:qs, list:rcnReg().map(function(e){ return [e.k, e.rcn]; }), r1:rcnAsgOf('R1')}); })()`),
        J({ qs: ['Remove RCN 11111 / EEIC AAAAA?\n\n1 assignment (requirements, services and CLINs) point at it across all fiscal years. Every one is cleared -- none is left pointing at something that no longer exists.'],
          list: [['K1', '22222']], r1: '' }));
      bootRelease(mk, []); await settleBoards();
    }
    // Add RCN / EEIC twice in one millisecond, the first removed, then once more in the same millisecond
    {
      const X = boot();
      seed(X.ev, { services: SV, items: [it('R1', 'AV', [900, 200, 0])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['R1'] });
      const k = JSON.parse(X.ev(`(function(){ var _n=Date.now; Date.now=function(){ return 1760000000000; }; window.confirm=function(){ return true; };
        MS.rcn=[]; rcnAdd(); rcnAdd(); var kept=rcnReg()[1].k; rcnDel(0); rcnAdd(); Date.now=_n;
        return JSON.stringify({kept:kept, keys:rcnReg().map(function(e){ return e.k; })}); })()`));
      w5Chk(name, 'Add RCN / EEIC', 'two entries, two keys: the one kept keeps its key and the new one has a key of its own',
        J([k.keys.length, new Set(k.keys).size, k.keys[0] === k.kept]), J([2, 2, true]));
      const k4 = JSON.parse(X.ev(`(function(){ var _n=Date.now; Date.now=function(){ return 1760000000000; }; window.confirm=function(){ return true; };
        MS.rcn=[]; rcnAdd(); rcnAdd(); rcnAdd(); rcnAdd(); rcnDel(0); rcnDel(0); rcnAdd(); Date.now=_n;
        return JSON.stringify(rcnReg().map(function(e){ return e.k; })); })()`));
      w5Chk(name, 'Add RCN / EEIC, two keys in use', 'four added in one millisecond, the first two removed, one more: three entries, three keys',
        J([k4.length, new Set(k4).size]), J([3, 3]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// v2.19 (item 150): removed with its feature -- v2.02 (D5a) — the ACE alignment breakout prints Funded beside each line’s allocation
// ==== end v2.02 (D5a) ====

// v2.19 (item 150): removed with its feature -- v2.00 (U61) — an RCN / EEIC pointer of "__proto__" never loses or doubles money in the alignment lines or the ACE tie-out
// ==== end v2.00 (U61) ====
// ==== v2.00 (U37): no export writes a character XML 1.0 forbids; it is refused before a byte, and says where ====
// _xesc escaped & < > " only, so U+0000-U+0008, U+000B, U+000C, U+000E-U+001F, U+FFFE and U+FFFF went into a workbook's or the
// deck's part raw, and the part was not well-formed. An ordinary paste puts them there (Chromium 141 keeps U+000B, U+0001,
// U+0007 and U+001F pasted into a text field). Measured on the base 7ee498a with LibreOffice 24.2: such a workbook opens with
// its sheet cut off at that cell, the deck with the rest of the Mission Critical table gone, its totals with it, and nothing is
// said. A literal _x0041_ in a workbook cell LibreOffice reads as "A" (_X0041_, _x41_ and _x0041 it reads as written); the
// deck it shows as typed.
// A  THE WRITER: each of the 31 characters in a cell is refused before a byte (_zipStore is never reached), naming the sheet,
//    the cell and the character; the words once, whole; a sheet name; a literal _xHHHH_ in a cell and in a sheet name.
//    The words say ORBIT cannot write the character without damaging the file (a workbook can hold U+000B, as _x000B_; this
//    writer cannot), and send the person to where the text was entered: the board, or the file it was imported from.
//    CONTROLS: escape-like text a spreadsheet reads as written; a workbook of ordinary text, a TAB, a line break, an emoji and
//    half of one is made, every part parses, and the board's own reader gives the text back (the half as U+FFFD, which is
//    what the encoder writes: refusing it would refuse the board's own cuts of a whole emoji, at 44, 56 and 31 characters);
//    a sheet name whose character lies past the 31 letters written; a carriage return, which XML allows.
// B  THE DECK: a Mission Critical Plan Event typed through the pen as Plan<U+000B>event -- no deck; slide 5, its title and the
//    text named; nothing on the board changed, the Plan Event as typed. CONTROL: a Plan Event "_x0041_ deck" makes the deck,
//    every part parses, and slide 5 carries it as typed.
// C  WHERE A PERSON MEETS IT: that Plan Event and an RCN title holding U+0001 -- exportExcel, exportCSV, exportSrc; a funds-flow
//    destination named Ctl<U+000B> -- exportFlow; the IDS export with that Plan Event on a contribution it does not upload, a new
//    ORG typed. Each is refused: nothing built, no Blob, no download, the place named, nothing on the board changed, the ORG
//    not kept. Each place named is where the base wrote the character, read off the base's own file (H18 of Decision Bands, E5
//    of 1-N by Band, D2 of O&M Raw Data, A40 of Funds Flow, C24 of Missing data and anomalies). And from the open IDS box, as
//    a person uses it: a first try with no reason is refused by the prompt and the box says so; the reason given, the second
//    try is refused here, and the box no longer gives the missing reason as the reason. The funds-flow chart, its panel open,
//    draws that destination; Save as image reads the drawing back as an XML image, and is refused before its Blob, naming
//    the text (on the base the drawing went into a Blob, and a browser could not render it: "Could not render", nothing named).
// D  EVERY CALLER: the 16 routes that write a workbook, and the deck, each run on ordinary data (CONTROL: the file is made), then
//    with the writer's check standing in as a refusal: the route stops there -- no Blob, no download, no word after the
//    refusal, nothing on the board changed (the IDS: the ORG typed is not kept). The chart image: a CONTROL only, its
//    drawing's Blob made on ordinary data.
// REVIEW ROUND 1 (13 Oct): A8 a styled cell ({v, s}) is checked as a plain one; A3c U+000B as the 31st character of a sheet
//    name, the last one written; A9 the status line shows markup in the refused text as text; A10 a long text is quoted
//    around the character; a literal _xHHHH_ is named by the character a spreadsheet reads it as (A4, A10). B3 the deck quotes
//    the text, not its markup. C: an RCN / EEIC title holding U+0001, which exportExcel writes only in styled cells; a refusal
//    is taken down when a workbook is made after it (the Excel export says nothing of its own), the chart image's too, while
//    a line said after it stays and the deck says its own word; a cycle locked while the Plan Event held U+000B keeps it, so
//    the FYDP spend plan taken from it is refused after the working plan is retyped, and the words say a locked cycle keeps
//    its text; U+FFFF in a saved prime-match token and in a saved OGC category name, carried in a board file (ledger U46).
//    E2: no page error on the boards the review added.
// REVIEW ROUND 2 (14 Oct): A4c a literal _xHHHH_ spelled with upper-case hex; A11 a style's fill colour and number format,
//    which go into xl/styles.xml outside every cell and sheet name (a colour that is not six hex digits, U+000B in it or a
//    quote, and a format holding U+0001, each refused; CONTROL: a colour with its # and in lower case, a source format with
//    quotes, no fill, the default fill); C: a band colour holding U+000B, U+FFFF or a quote, carried in a board file, reaches
//    the Priority drill's xl/styles.xml as its banner fill -- refused, the band and the colour named (CONTROL: the file as saved).
// REVIEW ROUND 3 (14 Oct): A11b a fill colour is six hex digits from its first character to its last -- a character before
//    the six (U+000B, a quote) and a colour of three or of eight hex digits are refused too, as the drafts say; C: a
//    sub-band's colour is named by the sub-band's label (0a), not by its place in the ladder.
//    C (the builder, money review S2): a band's colour has no field on the board, so its refusal says so and names what can
//    be done, with what each way costs -- and each way, done, makes the drill: for a standard band, ⚙ Install standard puts
//    its colour back; for any band, ⬆ Import ladder takes a corrected ladder file, drops the sub-band filing and cuts a long
//    name and description, as the words say.
// REVIEW ROUND 4 (14 Oct, money review): ⚙ Install standard puts every standard band back at the top of the ladder in the
//    standard order, filed under nothing, a removed one included, with both its ticks as issued -- the words say so, and a
//    standard sub-band (0a) and a reordered ladder are each put back as they say.
// REVIEW ROUND 4 (18 Oct, tests review): C: "This is a standard band" is said of a band ⚙ Install standard puts back -- its
//    id is the standard's -- and of no other, whatever its place, its header, its name or a file's mark; and the words name
//    the button as the panel shows it (0–3 when a standard band is a sub-band).
// FIX ROUND 4 (18 Oct, the builder, money review r4 S2): a sub-band that loses its filing -- ⚙ Install standard's or ⬆ Import
//    ladder's -- takes its money out of its header's total, and both sentences say so; done, each way leaves no total row for
//    a header whose sub-band it un-filed, in the drill or its Summary.
// REVIEW ROUND 5 (18 Oct, money review): two bands holding a refused colour -- a sub-band of the office's own that took band
//    0's colour -- are both named, ⚙ Install standard is not offered (it would leave the sub-band refused), and the import's
//    file with each colour corrected makes the drill; two standard bands so refused are both named and Install standard clears them.
// REVIEW ROUND 5 (18 Oct, tests review): A12 text that reads as a number is checked as text -- "2027" with U+000B after it,
//    U+000C before "12", a lone U+000B (JavaScript reads both as white space, so a test for a number lets them through); C: a
//    funds-flow destination named 2027<U+000B>, which the destinations list keeps as typed -- exportFlow refused, the place named.
// FIX ROUND 5 (18 Oct, the builder, tests review r5 minor 2): A11c a fill colour with a # inside its digits (#1B#2A#4A) is
//    refused -- the check strips the first # only, as the writer does, so what it passes is what the writer writes.
// FIX ROUND 5 (18 Oct, the builder): C: in a locked cycle's view a refused band colour's words say nothing done there is kept
//    and where to do it (⚙ Install standard or ⬆ Import ladder done in the view leaves the colour refused); on the working plan
//    they do not; done there, the view's drill is made.
// REVIEW ROUND 6 (18 Oct, tests review): C: three bands holding a refused colour -- band 0 and band 1 (standard) and band 6
//    (the office's own) -- both others named, in the plural, and ⚙ Install standard not offered; the band named first the
//    office's own and the other standard -- Install standard not offered; two bands so refused in a locked cycle's view -- both
//    named, and the view's sentence after them.
// REVIEW ROUND 7 (18 Oct, tests review): B4 the deck refuses U+FFFF, and C the chart image does, as the workbook does (A1 runs
//    every character through the workbook only); C a cell past column Z is named by its two letters (an RCN code holding U+000B,
//    O&M Raw Data AB2); A13 CONTROL the C1 controls U+007F-U+009F, which XML 1.0 allows, are written and read back.
// FAILS ON 7ee498a (product d66dd60): every A, B and C check but the CONTROLs, and every D refusal (each route writes its file).
await (async () => {
  const name = 'v2.00 (U37) — no export writes a character XML 1.0 forbids; it is refused before a byte, and says where';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify, VT = String.fromCharCode(11), SOH = String.fromCharCode(1);
    // In the board: run one call, counting the writer's zip, the Blobs and the downloads, keeping what was alerted, the status
    // line, the first Blob's bytes, and whether MS, S, DIRTY or browser storage changed.
    const HELP = `window.__u37=function(call){
      var zips=0, blobs=0, dl=0, msg='', cap=null, oz=_zipStore, ob=window.Blob, oa=window.alert, oc=HTMLAnchorElement.prototype.click, ret, err='';
      var snap=function(){ return JSON.stringify([MS, S, DIRTY, Object.keys(localStorage).sort().map(function(k){ return [k, localStorage.getItem(k)]; })]); };
      _zipStore=function(f){ zips++; return oz(f); };
      window.Blob=function(p,o){ blobs++; if(!cap && p && p[0] && p[0].byteLength) cap=p[0]; return new ob(p,o); };
      window.alert=function(m){ msg+=String(m); }; HTMLAnchorElement.prototype.click=function(){ dl++; };
      var st0=snap();
      try{ ret=(0,eval)(call); }catch(e){ err='threw '+String((e&&e.message)||e); }
      finally{ _zipStore=oz; window.Blob=ob; window.alert=oa; HTMLAnchorElement.prototype.click=oc; }
      return {zips:zips, blobs:blobs, dl:dl, msg:msg, err:err, ret:ret, cap:cap, same:snap()===st0, stat:(document.getElementById('shareStat')||{}).textContent||''}; };
    window.__u37parts=function(b){
      var u=new Uint8Array(b.buffer? b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength) : b), dv=new DataView(u.buffer), at=0, td=new TextDecoder(), P={}, bad=[];
      while(at+30<=u.length && dv.getUint32(at,true)===0x04034b50){
        var sz=dv.getUint32(at+18,true), nl=dv.getUint16(at+26,true), xl=dv.getUint16(at+28,true);
        var k=td.decode(u.subarray(at+30,at+30+nl)), t=td.decode(u.subarray(at+30+nl+xl,at+30+nl+xl+sz)); P[k]=t;
        if(/\\.(xml|rels)$/.test(k) && new DOMParser().parseFromString(t,'application/xml').getElementsByTagName('parsererror').length) bad.push(k);
        at+=30+nl+xl+sz; }
      return {n:Object.keys(P).length, bad:bad, P:P}; }; 'ok'`;
    // v2.08 (item 122): through the edit box's one writer (reqApply) -- the box's text field would strip the line break before
    // the writer saw it (an <input> holds one line), and the break is what this proves the workbooks keep
    const typed = (Y, id, v) => JSON.parse(Y.ev(`(function(){ reqApply(${J(id)}, {titles:${J(v)}}, {}); save(); return JSON.stringify((S.titles||{})[${J(id)}]); })()`));
    const X = boot();
    seed(X.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('R1', 'AV', [900, 200, 0])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['R1'] });
    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.awards={R1:{mode:'single', d:FYMON[2][0], day:3}}; applyState(S); S.mc={R1:true}; save(); 'ok'`);
    X.ev(HELP);
    // the writer called directly: was a workbook made, did it reach the zip, what was said, did anything change
    // (round 2) the writer called with a style list too: the same, and xl/styles.xml as written
    // (round 3) fills: the fgColors after the first three, which are the writer's own (_STYLES_HEAD's) -- the styles' own fills
    const writeS = (sheets, extra) => JSON.parse(X.ev(`(function(){ window.__in=${J(sheets)}; window.__ex=${J(extra)};
      var r=__u37('buildXlsx(window.__in, window.__ex)'), q=r.ret? __u37parts(r.ret) : null;
      return JSON.stringify({made:!!r.ret, zips:r.zips, msg:r.msg, err:r.err, same:r.same, bad:q? q.bad : null, n:q? q.n : 0,
        fills:q? (q.P['xl/styles.xml'].match(/<fgColor rgb="[^"]*"/g)||[]).slice(3) : null}); })()`));
    const write = sheets => JSON.parse(X.ev(`(function(){ window.__in=${J(sheets)}; var r=__u37('buildXlsx(window.__in)'), q=r.ret? __u37parts(r.ret) : null;
      return JSON.stringify({made:!!r.ret, zips:r.zips, msg:r.msg, stat:r.stat, err:r.err, same:r.same, bad:q? q.bad : null, n:q? q.n : 0}); })()`));

    // ---- A. THE WRITER ----
    const UNITS = ['0000', '0001', '0002', '0003', '0004', '0005', '0006', '0007', '0008', '000B', '000C', '000E', '000F', '0010', '0011',
      '0012', '0013', '0014', '0015', '0016', '0017', '0018', '0019', '001A', '001B', '001C', '001D', '001E', '001F', 'FFFE', 'FFFF'];
    for (const h of UNITS) {
      const r = write([{ name: 'U37', rows: [[900, 'a' + String.fromCharCode(parseInt(h, 16)) + 'b']] }]);
      w5Chk(name, 'A1 · U+' + h + ' in a cell', 'no workbook, nothing built (the zip never reached); the sheet, the cell and the character named; nothing changed',
        J([r.made, r.zips, r.msg.indexOf('Excel workbook not exported: sheet “U37”, cell B1 holds character U+' + h + ', which ORBIT cannot write into a workbook without damaging it. It reads “a[U+' + h + ']b”.') === 0, r.same, r.err]),
        J([false, 0, true, true, '']));
    }
    const A2 = write([{ name: 'U37', rows: [[900, 'Plan' + VT + 'event']] }]);
    w5Chk(name, 'A2 · the words', 'the alert and the status line say what was refused, where, the text, and that nothing was made or changed',
      J([A2.msg, A2.stat]),
      J(['Excel workbook not exported: sheet “U37”, cell B1 holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “Plan[U+000B]event”. No file was made, and the text on the board is unchanged. Change that text where it was entered — on the board, or in the file it was imported from — and export again. A locked cycle keeps the text it was locked with: a file taken from one that holds it stays refused.',
        '⚠ Excel workbook not exported — sheet “U37”, cell B1 holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “Plan[U+000B]event”. No file was made; the text on the board is unchanged.']));
    const A3 = write([{ name: 'Fine', rows: [['x']] }, { name: 'Dest' + VT, rows: [['y']] }]);
    w5Chk(name, 'A3 · a sheet name', 'the second sheet named Dest<U+000B>: no workbook, nothing built; the name of sheet 2 and the character named',
      J([A3.made, A3.zips, A3.msg.split('. No file was made')[0]]),
      J([false, 0, 'Excel workbook not exported: the name of sheet 2 holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “Dest[U+000B]”']));
    const A3b = write([{ name: 'N'.repeat(31) + VT, rows: [['x']] }]);
    w5Chk(name, 'A3b · CONTROL a sheet name whose character lies past the 31 written', 'the name is written cut to its first 31 letters, without it: made, one zip, nothing said, every part parses',
      J([A3b.made, A3b.zips, A3b.msg, A3b.bad, A3b.n]), J([true, 1, '', [], 6]));
    const A4 = write([{ name: 'U37', rows: [['_x0041_ is A']] }]), A4b = write([{ name: 'T _x00e9_', rows: [['x']] }]);
    w5Chk(name, 'A4 · a literal _xHHHH_', 'in a cell and in a sheet name (lower-case hex too): no workbook, nothing built; the text named, and why',
      J([A4.made, A4.zips, A4.msg.split('. No file was made')[0], A4b.made, A4b.zips, A4b.msg.split('. No file was made')[0]]),
      J([false, 0, 'Excel workbook not exported: sheet “U37”, cell A1 holds the text _x0041_, which a spreadsheet would read as the single character U+0041. It reads “_x0041_ is A”',
        false, 0, 'Excel workbook not exported: the name of sheet 1 holds the text _x00e9_, which a spreadsheet would read as the single character U+00E9. It reads “T _x00e9_”']));
    // A4c (verify-tests r2): a literal _xHHHH_ spelled with upper-case hex letters is read by a spreadsheet as the character
    // too (LibreOffice shows _x000B_ as U+000B and _x00E9_ as é), so it is refused as the lower-case one is
    const A4c = write([{ name: 'U37', rows: [['_x000B_ and _x00E9_']] }]);
    w5Chk(name, 'A4c · a literal _xHHHH_ with upper-case hex', 'no workbook, nothing built; the text named, and the character a spreadsheet reads it as',
      J([A4c.made, A4c.zips, A4c.msg.split('. No file was made')[0]]),
      J([false, 0, 'Excel workbook not exported: sheet “U37”, cell A1 holds the text _x000B_, which a spreadsheet would read as the single character U+000B. It reads “_x000B_ and _x00E9_”']));
    const A5 = write([{ name: 'U37', rows: [['_X0041_', '_x41_', '_x0041', 'x0041_', '_x005F']] }]);
    w5Chk(name, 'A5 · CONTROL escape-like text read as written', 'made, one zip, nothing said, every part parses',
      J([A5.made, A5.zips, A5.msg, A5.bad, A5.n]), J([true, 1, '', [], 6]));
    const HALF = String.fromCharCode(0xD83D), REP = String.fromCharCode(0xFFFD), ROCKET = String.fromCodePoint(0x1F680);
    const A6 = write([{ name: 'U37', rows: [[900, 'O&M <b> "q" é — ' + ROCKET, 'tab\there', 'line\ntwo', 'half ' + HALF + ' end'], [200, 1100]] }]);
    const A6r = JSON.parse(await X.w.eval(`(async function(){ var b=buildXlsx(window.__in); if(!b) return JSON.stringify('no workbook'); return JSON.stringify((await xlsxRead(b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength))).U37); })()`));
    w5Chk(name, 'A6 · CONTROL ordinary text', 'made, one zip, nothing said, every part parses; the board reads back the text and $900 / $200 / $1,100 (half an emoji as U+FFFD)',
      J([A6.made, A6.zips, A6.msg, A6.bad, A6.n, A6r]),
      J([true, 1, '', [], 6, [[900, 'O&M <b> "q" é — ' + ROCKET, 'tab\there', 'line\ntwo', 'half ' + REP + ' end'], [200, 1100]]]));
    const A7 = write([{ name: 'U37', rows: [['carriage\rreturn']] }]);
    w5Chk(name, 'A7 · CONTROL a carriage return', 'XML allows it, so it is not refused: made, one zip, nothing said, every part parses',
      J([A7.made, A7.zips, A7.msg, A7.bad, A7.n]), J([true, 1, '', [], 6]));
    // A12 (verify-tests r5): text that reads as a number is still text. "2027" with U+000B after it, U+000C before "12" and a lone
    // U+000B each read as a number to JavaScript, which takes U+000B and U+000C for white space -- the cell is checked as the text it is
    const FF = String.fromCharCode(12);
    const A12a = write([{ name: 'U37', rows: [['2027' + VT]] }]), A12b = write([{ name: 'U37', rows: [[900, FF + '12']] }]), A12c = write([{ name: 'U37', rows: [[VT]] }]);
    w5Chk(name, 'A12 · text that reads as a number, holding U+000B or U+000C', 'each refused: no workbook, nothing built, the cell and the character named, nothing changed',
      J([A12a.made, A12a.zips, A12a.msg.split('. No file was made')[0], A12a.same, A12b.made, A12b.zips, A12b.msg.split('. No file was made')[0], A12b.same,
        A12c.made, A12c.zips, A12c.msg.split('. No file was made')[0], A12c.same, [A12a.err, A12b.err, A12c.err]]),
      J([false, 0, 'Excel workbook not exported: sheet “U37”, cell A1 holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “2027[U+000B]”', true,
        false, 0, 'Excel workbook not exported: sheet “U37”, cell B1 holds character U+000C, which ORBIT cannot write into a workbook without damaging it. It reads “[U+000C]12”', true,
        false, 0, 'Excel workbook not exported: sheet “U37”, cell A1 holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “[U+000B]”', true,
        ['', '', '']]));

    // A8-A10 (review): a STYLED cell ({v, s}) is checked as a plain one is -- the workbook writes a person's text that way too
    // (exportExcel's RCN-EEIC by Month titles); the 31st character of a sheet name, the last one written; the status line
    // shows the refused text as text, never as markup; a long text is quoted around the character, not from its start.
    const A8 = write([{ name: 'U37', rows: [[{ v: 'a' + VT + 'b', s: 1 }]] }]);
    w5Chk(name, 'A8 · a styled cell', 'a cell written with its style is checked as a plain one is: no workbook, nothing built; the cell named',
      J([A8.made, A8.zips, A8.msg.split('. No file was made')[0]]),
      J([false, 0, 'Excel workbook not exported: sheet “U37”, cell A1 holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “a[U+000B]b”']));
    const A3c = write([{ name: 'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNN' + VT + 'tail', rows: [['x']] }]);
    w5Chk(name, 'A3c · a sheet name whose 31st character, the last one written, is U+000B', 'no workbook, nothing built; the name of sheet 1 named',
      J([A3c.made, A3c.zips, A3c.msg.split('. No file was made')[0]]),
      J([false, 0, 'Excel workbook not exported: the name of sheet 1 holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “NNNNNNNNNNNNNNNNNNNNNNNNNNNNNN[U+000B]”']));
    const A9 = write([{ name: 'U37', rows: [['<i id="u37inj">x</i>' + VT]] }]);
    w5Chk(name, 'A9 · the status line shows markup in the refused text as text', 'the text is quoted as typed, angle brackets and all; nothing in it becomes part of the page',
      J([A9.stat]),
      J(['⚠ Excel workbook not exported — sheet “U37”, cell A1 holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “<i id="u37inj">x</i>[U+000B]”. No file was made; the text on the board is unchanged.']));
    const A10 = write([{ name: 'U37', rows: [['AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' + VT + 'tail']] }]),
      A10b = write([{ name: 'U37', rows: [['AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_x0041_ tail']] }]);
    w5Chk(name, 'A10 · a long text is quoted around the character', '120 letters before it: the quote starts 30 letters before the character (or the _xHHHH_) and shows it',
      J([A10.msg.split('. No file was made')[0], A10b.msg.split('. No file was made')[0]]),
      J(['Excel workbook not exported: sheet “U37”, cell A1 holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “…AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA[U+000B]tail”',
        'Excel workbook not exported: sheet “U37”, cell A1 holds the text _x0041_, which a spreadsheet would read as the single character U+0041. It reads “…AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_x0041_ tail”']));
    // A14, A15 (v2.02, E6: the U37 tests review, round 8). A14 CONTROL: U+2028 and U+2029 are characters XML allows; refusing them
    // would be a wrong fix no check saw. A15: a text holding a literal _xHHHH_ AND, 80 letters on, U+000B is named by the U+000B
    // and quoted around IT, not around the literal -- the quote it gave could leave out the character it named.
    // Both pass on c357911 too: they close a test gap (the board was right), and each catches its own mutation (v202-e6-u37-*).
    const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
    const A14 = write([{ name: 'U37', rows: [['a' + LS + 'b' + PS + 'c']] }]);
    const A14r = JSON.parse(await X.w.eval(`(async function(){ var b=buildXlsx(window.__in); if(!b) return JSON.stringify('no workbook'); return JSON.stringify((await xlsxRead(b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength))).U37); })()`));
    w5Chk(name, 'A14 · CONTROL U+2028 and U+2029, which XML 1.0 allows', 'made, one zip, nothing said, every part parses; the cell reads back as the five characters written',
      J([A14.made, A14.zips, A14.msg, A14.bad, A14.n, A14r]), J([true, 1, '', [], 6, [['a' + LS + 'b' + PS + 'c']]]));
    const A15 = write([{ name: 'U37', rows: [['_x0041_' + 'y'.repeat(80) + VT + 'end']] }]);
    w5Chk(name, 'A15 · a literal _xHHHH_ and, later, a forbidden character', 'the character is named, and the quote is around it, not around the literal',
      A15.msg.split('. No file was made')[0],
      'Excel workbook not exported: sheet “U37”, cell A1 holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “…' + 'y'.repeat(30) + '[U+000B]end”');

    // A11 (round 2): a style's fill colour and number format go into xl/styles.xml, outside every cell and sheet name, the
    // colour unescaped. A colour that is not six hex digits -- U+000B in it, or a quote -- and a format holding U+0001 are
    // refused, nothing built, the colour or the format named. CONTROL: a colour with its # and one in lower case, a source
    // format with quotes, a format-only style, the default fill: made, every part parses, the fills written as RRGGBB.
    const A11rows = [{ name: 'U37', rows: [['x']] }];
    const A11a = writeS(A11rows, [{ fill: '1B2A4A' + VT, white: true, bold: true }]), A11b = writeS(A11rows, [{ fill: '1B2A4A"' }]),
      A11c = writeS(A11rows, [{ fill: false, fmt: '#,##0' + SOH }]),
      A11d = writeS(A11rows, [{ fill: '#1B2A4A', white: true, bold: true }, { fill: '8892a4' }, { fill: false, fmt: '"$"#,##0.00_);\\("$"#,##0.00\\)' }, { fill: false }, {}]);
    w5Chk(name, 'A11 · a style\'s fill colour and number format', 'a colour holding U+000B, a colour holding a quote, a format holding U+0001: no workbook, nothing built, the colour or the format named, nothing changed; CONTROL a colour with its # and in lower case, a source format, no fill, the default fill: made, every part parses, the fills written as RRGGBB',
      J([A11a.made, A11a.zips, A11a.msg.split('. No file was made')[0], A11a.same, A11b.made, A11b.zips, A11b.msg.split('. No file was made')[0], A11b.same,
        A11c.made, A11c.zips, A11c.msg.split('. No file was made')[0], A11c.same, A11d.made, A11d.zips, A11d.msg, A11d.bad, A11d.fills, [A11a.err, A11b.err, A11c.err, A11d.err]]),
      J([false, 0, 'Excel workbook not exported: a cell fill colour holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “1B2A4A[U+000B]”', true,
        false, 0, 'Excel workbook not exported: a cell fill colour is not six hex digits (#RRGGBB), the only form of colour ORBIT writes into a workbook. It reads “1B2A4A"”', true,
        false, 0, 'Excel workbook not exported: a number format holds character U+0001, which ORBIT cannot write into a workbook without damaging it. It reads “#,##0[U+0001]”', true,
        true, 1, '', [], ['<fgColor rgb="FF1B2A4A"', '<fgColor rgb="FF8892A4"', '<fgColor rgb="FFD9DDE5"'], ['', '', '', '']]));

    // A11b (verify-tests r3): the six hex digits run from the colour's first character to its last. A character before them
    // (U+000B, a quote) is refused as one after them is, and so is a colour of three or of eight hex digits -- forms the
    // board's import door accepts (#RGB to #RRGGBBAA) and the base wrote as given (FFABC), which a workbook cannot read
    const A11e = writeS(A11rows, [{ fill: VT + '1B2A4A' }]), A11f = writeS(A11rows, [{ fill: '"1B2A4A' }]),
      A11g = writeS(A11rows, [{ fill: '#abc' }]), A11h = writeS(A11rows, [{ fill: 'FF1B2A4A' }]);
    w5Chk(name, 'A11b · a fill colour with the character before its six digits, and one of three or eight hex digits', 'each refused: no workbook, nothing built, the colour named, nothing changed',
      J([A11e.made, A11e.zips, A11e.msg.split('. No file was made')[0], A11e.same, A11f.made, A11f.zips, A11f.msg.split('. No file was made')[0], A11f.same,
        A11g.made, A11g.zips, A11g.msg.split('. No file was made')[0], A11g.same, A11h.made, A11h.zips, A11h.msg.split('. No file was made')[0], A11h.same,
        [A11e.err, A11f.err, A11g.err, A11h.err]]),
      J([false, 0, 'Excel workbook not exported: a cell fill colour holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “[U+000B]1B2A4A”', true,
        false, 0, 'Excel workbook not exported: a cell fill colour is not six hex digits (#RRGGBB), the only form of colour ORBIT writes into a workbook. It reads “"1B2A4A”', true,
        false, 0, 'Excel workbook not exported: a cell fill colour is not six hex digits (#RRGGBB), the only form of colour ORBIT writes into a workbook. It reads “#abc”', true,
        false, 0, 'Excel workbook not exported: a cell fill colour is not six hex digits (#RRGGBB), the only form of colour ORBIT writes into a workbook. It reads “FF1B2A4A”', true,
        ['', '', '', '']]));
    // A11c (fix round 5): the check strips the colour's first # only, as the writer does (it writes FF and the rest). A colour
    // with a # inside its digits -- a band's colour from a board file can be one -- is refused as not six hex digits, not passed
    // by a check that strips every # and then written as FF1B#2A#4A, which is not #RRGGBB either
    const A11i = writeS(A11rows, [{ fill: '#1B#2A#4A' }]);
    w5Chk(name, 'A11c · a fill colour with a # inside its digits', 'refused: no workbook, nothing built, the colour named as it reads, nothing changed',
      J([A11i.made, A11i.zips, A11i.msg.split('. No file was made')[0], A11i.same, A11i.fills, A11i.err]),
      J([false, 0, 'Excel workbook not exported: a cell fill colour is not six hex digits (#RRGGBB), the only form of colour ORBIT writes into a workbook. It reads “#1B#2A#4A”', true, null, '']));

    // ---- B. (v2.05, item 114: the deck's refusal was held here, and went with the deck.) The Plan Event, typed through the pen as is ----
    const t1 = typed(X, 'R1', 'Plan' + VT + 'event');
    w5Chk(name, 'B · a Mission Critical Plan Event holding U+000B', 'typed through the pen as is', J(t1), J('Plan' + VT + 'event'));

    // ---- C. WHERE A PERSON MEETS IT ----
    X.ev(`MS.rcn=[{k:'K1', rcn:'11111', eeic:'AAAAA', t:${J('bad' + SOH + 'char')}, svc:['USAF','ANG','AFRC']}]; S.rcnAsg={R1:'K1'}; save(); 'ok'`);
    const route = (Y, call) => JSON.parse(Y.ev(`(function(){ var r=__u37(${J(call)});
      return JSON.stringify({zips:r.zips, blobs:r.blobs, dl:r.dl, msg:r.msg.split('. No file was made')[0], same:r.same, err:r.err, ret:r.ret===undefined? 'none' : r.ret}); })()`));
    for (const [fn, place] of [['exportExcel()', 'sheet “Decision Bands”, cell H18'], ['exportCSV()', 'sheet “1-N by Band”, cell E5'], ['exportSrc()', 'sheet “O&M Raw Data”, cell D2']]) {
      const r = route(X, fn);
      w5Chk(name, 'C · ' + fn + ', the Plan Event Plan<U+000B>event', 'nothing built, no Blob, no download; the place the base wrote it named, with the text; nothing changed',
        J([r.zips, r.blobs, r.dl, r.msg, r.same, r.err]),
        J([0, 0, 0, 'Excel workbook not exported: ' + place + ' holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “Plan[U+000B]event”', true, '']));
    }
    // v2.19 (item 150): the funds flow (its export and its chart image) and the IDS export are gone, and their routes here with them

    // (v2.05, item 114: B2 and B3, the deck's control and its quoting, went with the deck.)
    // C8 (review): an RCN / EEIC title holding U+0001 with the Plan Event ordinary -- exportExcel writes that title only in
    // styled cells of RCN-EEIC by Month; the base wrote it at A5 (read off its own file)
    typed(X, 'R1', 'Plan event');
    const C8 = route(X, 'exportExcel()');
    w5Chk(name, 'C · exportExcel(), an RCN / EEIC title holding U+0001 (a styled cell)', 'nothing built, no Blob, no download; the place the base wrote it named, with the text; nothing changed',
      J([C8.zips, C8.blobs, C8.dl, C8.msg, C8.same, C8.err]),
      J([0, 0, 0, 'Excel workbook not exported: sheet “RCN-EEIC by Month”, cell A5 holds character U+0001, which ORBIT cannot write into a workbook without damaging it. It reads “11111 / AAAAA  bad[U+0001]char”', true, '']));

    // ---- C (review round 1). THE WORDS ONCE THE PERSON ACTS ON THEM ----
    // A refusal stood on the status line after the next workbook was made, still saying no file was made: the Excel export
    // says nothing of its own. Refused, the title retyped through the board's own field, exported again:
    // the workbook is made and the refusal is gone. The chart image's refusal goes when a workbook is made; a line said after
    // a refusal stays.
    const shown = Y => Y.ev(`(document.getElementById('shareStat')||{}).textContent||''`);
    const C9a = route(X, 'exportExcel()'), s9a = shown(X);
    X.ev(`rcnSet(0, 't', 'good char'); 'ok'`);
    const C9b = route(X, 'exportExcel()'), s9b = shown(X);
    w5Chk(name, 'C · exportExcel() refused, the RCN / EEIC title retyped, exported again', 'the refusal said on the status line; retyped through the board\'s own field, the workbook is made and the status line no longer says it was not',
      J([C9a.zips, s9a, C9b.zips, C9b.blobs, C9b.dl, C9b.msg, s9b, C9b.err]),
      J([0, '⚠ Excel workbook not exported — sheet “RCN-EEIC by Month”, cell A5 holds character U+0001, which ORBIT cannot write into a workbook without damaging it. It reads “11111 / AAAAA  bad[U+0001]char”. No file was made; the text on the board is unchanged.', 1, 1, 1, '', '', '']));
    // v2.19 (item 150): the chart image and the funds-flow export, the refusals C10, C11 and C13 read, are gone
    // A cycle locked while the Plan Event held U+000B keeps it. The working plan retyped, its own workbook is made; the FYDP
    // spend plan taken from the cycle is still refused (By Requirement B7, where the base wrote it), and so is the Excel
    // export in the cycle's view, where the text cannot be changed -- and the words say that a locked cycle keeps its text.
    const XL = boot();
    seed(XL.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('R1', 'AV', [900, 200, 0]), it('R2', 'PSM', [300, 0, 50])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['R1', 'R2'] });
    XL.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.awards={R1:{mode:'single', d:FYMON[2][0], day:3}}; applyState(S); S.mc={R1:true}; save(); 'ok'`);
    XL.ev(HELP);
    typed(XL, 'R1', 'Plan' + VT + 'event');
    const cyc = XL.ev(`MS.years[MS.cur]=S; blCyc='PB'; blYr=MS.cur; cycLock(); Object.keys(blStore()).join(',')`);
    const retyped = typed(XL, 'R1', 'Plan event');
    const L1 = route(XL, 'exportExcel()');
    XL.ev(`fydpSrc=${J(cyc)}; 'ok'`);
    const L2 = JSON.parse(XL.ev(`(function(){ var r=__u37('exportFydpPlan()'); return JSON.stringify({zips:r.zips, blobs:r.blobs, dl:r.dl, msg:r.msg, same:r.same, err:r.err}); })()`));
    XL.ev(`fydpSrc='working'; cycView(${J(cyc)}); 'ok'`);
    const L3 = route(XL, 'exportExcel()'), inView = JSON.parse(XL.ev(`JSON.stringify((S.titles||{}).R1)`));
    XL.ev(`cycLeave(); 'ok'`);
    w5Chk(name, 'C · a cycle locked while the Plan Event held U+000B, the working plan retyped', 'the working plan\'s workbook is made; the FYDP spend plan taken from the cycle is refused, the place named, and the words say a locked cycle keeps its text; nothing changed; in the cycle\'s view the text is as locked and the Excel export is refused',
      J([cyc, retyped, L1.zips, L1.dl, L2.zips, L2.blobs, L2.dl, L2.msg, L2.same, inView, L3.zips, L3.msg, L1.err, L2.err, L3.err]),
      J(['PB|2027', 'Plan event', 1, 1, 0, 0, 0, 'Excel workbook not exported: sheet “O&M”, cell B6 holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “Plan[U+000B]event”. No file was made, and the text on the board is unchanged. Change that text where it was entered — on the board, or in the file it was imported from — and export again. A locked cycle keeps the text it was locked with: a file taken from one that holds it stays refused.',
        true, 'Plan' + VT + 'event', 0, 'Excel workbook not exported: sheet “Decision Bands”, cell H18 holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “Plan[U+000B]event”', '', '', '']));
    // Ledger U46: v2.19 (item 150): the funds-flow workbook it reached is gone

    // REVIEW ROUND 2 (both reviews, M1): a band's colour reaches xl/styles.xml as the Priority drill's banner fill, outside every
    // cell and sheet name, unescaped. The ladder import holds it to #RRGGBB; a board file carries it as written (the board has
    // no colour field). The base wrote U+000B, U+FFFF or a quote there raw, xl/styles.xml not well-formed, and said "Priority
    // drill exported". Each is refused before a byte, the band and its colour named, and the board holds the colour as the
    // file carried it. CONTROL: the file as saved. (From the money review's demonstrated check, round 2; the quote case from
    // the tests review's probe.)
    const bLadder = JSON.parse(XU.ev('JSON.stringify(BANDS_LIST())'));
    const bFile = (at, c) => uHtml.replace(uRE, (m, a, b, z) => { const P = JSON.parse(b);
      P.appns[uSlug].bands = bLadder.map((x, i) => i === at ? Object.assign({}, x, { c }) : x); return a + J(P).replace(/</g, '\\u003c') + z; });
    const bOpen = (html, at) => { const R = boot({ html }); R.w.confirm = () => true; R.ev(HELP);
      return Object.assign(route(R, 'exportCSV()'), { held: JSON.parse(R.ev(`JSON.stringify(BANDS_LIST()[${at}].c)`)), errs: R.errors.length }); };
    const BC0 = bOpen(uHtml, 0), BC1 = bOpen(bFile(0, '#1B2A4A' + VT), 0), BC2 = bOpen(bFile(0, '#1B2A4A' + uFF), 0), BC3 = bOpen(bFile(1, '#FF6B81"'), 1);
    w5Chk(name, 'C · exportCSV(), a band colour holding U+000B, U+FFFF or a quote, carried in a board file', 'the file as saved makes the Priority drill (CONTROL); each file whose band colour carries the character opens holding it, and is refused: nothing built, no Blob, no download, the band and its colour named; nothing changed',
      J([BC0.zips, BC0.dl, BC0.msg, BC1.held, BC1.zips, BC1.blobs, BC1.dl, BC1.msg, BC1.same, BC2.held, BC2.zips, BC2.blobs, BC2.dl, BC2.msg, BC2.same,
        BC3.held, BC3.zips, BC3.blobs, BC3.dl, BC3.msg, BC3.same, [BC0.err, BC1.err, BC2.err, BC3.err], [BC0.errs, BC1.errs, BC2.errs, BC3.errs]]),
      J([1, 1, '', '#1B2A4A' + VT, 0, 0, 0, 'Excel workbook not exported: the colour of band 0 “Net Funding Available” (its banner on the Priority drill) holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “1B2A4A[U+000B]”', true,
        '#1B2A4A' + uFF, 0, 0, 0, 'Excel workbook not exported: the colour of band 0 “Net Funding Available” (its banner on the Priority drill) holds character U+FFFF, which ORBIT cannot write into a workbook without damaging it. It reads “1B2A4A[U+FFFF]”', true,
        '#FF6B81"', 0, 0, 0, 'Excel workbook not exported: the colour of band 1 “PDM-Directed Funding” (its banner on the Priority drill) is not six hex digits (#RRGGBB), the only form of colour ORBIT writes into a workbook. It reads “FF6B81"”', true,
        ['', '', '', ''], [0, 0, 0, 0]]));

    // (verify-tests r3) a sub-band is named by its label: PDM-Directed Funding filed under band 0 is band 0a, the second in the
    // ladder; its colour holding U+000B is refused naming 0a, not "band 1"
    const bSub = uHtml.replace(uRE, (m, a, b, z) => { const P = JSON.parse(b);
      P.appns[uSlug].bands = bLadder.map((x, i) => i === 1 ? Object.assign({}, x, { of: bLadder[0].id, c: '#FF6B81' + VT }) : x); return a + J(P).replace(/</g, '\\u003c') + z; });
    const BS = bOpen(bSub, 1), BSl = (() => { const R = boot({ html: bSub }); R.w.confirm = () => true; return JSON.parse(R.ev('JSON.stringify(bandLabels().slice(0, 3))')); })();
    w5Chk(name, 'C · exportCSV(), a sub-band\'s colour holding U+000B, carried in a board file', 'the sub-band labelled 0a; refused, nothing built, no Blob, no download, the sub-band named by its label; nothing changed',
      J([BSl, BS.held, BS.zips, BS.blobs, BS.dl, BS.msg, BS.same, BS.err, BS.errs]),
      J([['0', '0a', '1'], '#FF6B81' + VT, 0, 0, 0, 'Excel workbook not exported: the colour of band 0a “PDM-Directed Funding” (its banner on the Priority drill) holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “FF6B81[U+000B]”', true, '', 0]));

    // (round 3, money review S2) a band's colour has no field on the board: the refusal says so, in place of "change that text
    // where it was entered", and names what can be done with what each way costs -- and each way, done, makes the drill, and
    // costs what the words say. A standard band (band 0, Net Funding Available, #abc): ⚙ Install standard puts the standard
    // colour back. A band of this office's own (band 5, a quote after its colour, a name of 81 letters, a description of 130,
    // Program health filed under it as 5a): ⬇ Export ladder, the colour corrected in that file, ⬆ Import ladder -- 5a becomes
    // band 6 and the bands below it are renumbered, the name is cut to 60 letters and the description to 120.
    const wName = 'Readiness degradation, measured against the unit readiness floors set in the plan';
    const wFile = fn => uHtml.replace(uRE, (m, a, b, z) => { const P = JSON.parse(b); P.appns[uSlug].bands = fn(JSON.parse(J(bLadder))); return a + J(P).replace(/</g, '\\u003c') + z; });
    const wOpen = html => { const R = boot({ html }); R.w.confirm = () => true; R.ev(HELP); return R; };
    const wDrill = R => JSON.parse(R.ev(`(function(){ var r=__u37('exportCSV()'); return JSON.stringify({zips:r.zips, blobs:r.blobs, dl:r.dl, msg:r.msg, stat:r.stat, same:r.same, err:r.err}); })()`));
    const WS = wOpen(wFile(L0 => { L0[0].c = '#abc'; return L0; }));
    const WS0 = wDrill(WS), WSstd = JSON.parse(WS.ev(`(function(){ var r=__u37('bandStd()'); return JSON.stringify([r.err, r.msg]); })()`));
    const WSb = JSON.parse(WS.ev('JSON.stringify([BANDS_LIST()[0].c, BANDS_LIST()[0].n, bandLabels()])')), WS1 = wDrill(WS);
    const WL = wOpen(wFile(L0 => { L0[5].c = '#4f8fd6"'; L0[5].n = wName; L0[5].d = 'D'.repeat(130); L0[6].of = L0[5].id; return L0; }));
    const WLa = JSON.parse(WL.ev('JSON.stringify(bandLabels())')), WL0 = wDrill(WL);
    const WLpack = JSON.parse(await WL.w.eval(`(async function(){ var got=null, ob=window.Blob, oc=HTMLAnchorElement.prototype.click;
      window.Blob=function(p,o){ got=p; return new ob(p,o); }; HTMLAnchorElement.prototype.click=function(){};
      try{ bandExport(); } finally { window.Blob=ob; HTMLAnchorElement.prototype.click=oc; } return got[0]; })()`));
    WLpack.bands[5].c = '#4f8fd6';
    WL.w.__u37pack = J(WLpack);
    const WLin = await WL.w.eval(`(async function(){ var inp={files:[new File([window.__u37pack], 'ladder.json', {type:'application/json'})], value:'x'};
      bandImport(inp); for(var i=0;i<100 && inp.value;i++) await new Promise(function(r){ setTimeout(r, 20); }); return inp.value; })()`);
    const WLb = JSON.parse(WL.ev('JSON.stringify([bandLabels(), BANDS_LIST()[5].c, BANDS_LIST()[5].n, BANDS_LIST()[5].d.length, BANDS_LIST()[6].of||""])')), WL1 = wDrill(WL);
    const wTail = 'A band’s colour has no field on the board: it came in as written, with a board file or a ladder from another appropriation. ';
    const wStd = 'This is a standard band: ⚖ Bands › ⚙ Install standard ';
    const wStdTail = ' puts the organization’s standard bands back as issued — colour, name, description, rule, whether each counts toward the stoppage gap and needs a consequence, a removed one included — at the top of the ladder in the standard order, and files none of them under another band (a standard sub-band becomes a band of its own, its money no longer in its header’s total, and the bands below it are renumbered). It asks first. ';
    const wImp = '⬆ Import ladder takes a ladder file with the colour corrected to #RRGGBB (⬇ Export ladder makes one), but drops every sub-band filing — each sub-band becomes a band of its own, its money no longer in its header’s total, and the bands below it are renumbered — and cuts a band’s name to 60 characters and its description to 120.';
    w5Chk(name, 'C · exportCSV(), a refused band colour: the words say what can be done, and each way works as they say', 'a standard band (#abc) and a band of this office\'s own (a quote, a sub-band, a long name): the alert says the colour has no field on the board, names ⚙ Install standard for the standard band and ⬆ Import ladder with what it costs for both, and nothing is built or changed; ⚙ Install standard puts the colour back and the drill is made; ⬇ Export ladder, corrected, ⬆ Import ladder: the drill is made, 5a reads 6, the name is cut to 60 letters and the description to 120',
      J([WS0.zips, WS0.blobs, WS0.dl, WS0.msg, WS0.stat, WS0.same, WSstd, WSb, WS1.zips, WS1.dl, WS1.msg,
        WLa, WL0.zips, WL0.blobs, WL0.dl, WL0.msg, WL0.same, WLin, WLb, WL1.zips, WL1.dl, WL1.msg, [WS0.err, WS1.err, WL0.err, WL1.err], [WS.errors.length, WL.errors.length]]),
      J([0, 0, 0, 'Excel workbook not exported: the colour of band 0 “Net Funding Available” (its banner on the Priority drill) is not six hex digits (#RRGGBB), the only form of colour ORBIT writes into a workbook. It reads “abc”. No file was made, and nothing on the board is changed. '
          + wTail + wStd + '0–4' + wStdTail + wImp,
        '⚠ Excel workbook not exported — the colour of band 0 “Net Funding Available” (its banner on the Priority drill) is not six hex digits (#RRGGBB), the only form of colour ORBIT writes into a workbook. It reads “abc”. No file was made; the text on the board is unchanged.',
        true, ['', ''], ['#5aa87a', 'Net Funding Available', ['0', '1', '2', '3', '4', '5', '6', '7']], 1, 1, '',
        ['0', '1', '2', '3', '4', '5', '5a', '6'], 0, 0, 0,
        'Excel workbook not exported: the colour of band 5 “' + wName + '” (its banner on the Priority drill) is not six hex digits (#RRGGBB), the only form of colour ORBIT writes into a workbook. It reads “4f8fd6"”. No file was made, and nothing on the board is changed. ' + wTail + wImp,
        true, '', [['0', '1', '2', '3', '4', '5', '6', '7'], '#4f8fd6', 'Readiness degradation, measured against the unit readiness f', 120, ''], 1, 1, '',
        ['', '', '', ''], [0, 0]]));

    // (verify-money r4) ⚙ Install standard costs what the words say. A standard sub-band -- PDM-Directed Funding filed under band
    // 0, so 0a, its colour holding U+000B -- is told that Install standard files no standard band under another; done, 0a reads
    // 1 and the drill is made. A ladder with Incurred Financial Liabilities removed, Readiness degradation moved above
    // Safety-Critical and PDM-Directed Funding no longer counting toward the stoppage gap (band 0's colour #abc): done, the
    // standard bands are back on top in the standard order, Liabilities among them, and PDM-Directed Funding counts again.
    const SU = wOpen(wFile(L0 => { L0[1].of = L0[0].id; L0[1].c = '#FF6B81' + VT; return L0; }));
    const SUa = JSON.parse(SU.ev('JSON.stringify(bandLabels())')), SU0 = wDrill(SU);
    const SUstd = JSON.parse(SU.ev(`(function(){ var r=__u37('bandStd()'); return JSON.stringify([r.err, r.msg]); })()`));
    const SUb = JSON.parse(SU.ev('JSON.stringify([bandLabels(), BANDS_LIST()[1].id, BANDS_LIST()[1].of||"", BANDS_LIST()[1].c])')), SU1 = wDrill(SU);
    const SO = wOpen(wFile(L0 => { const L = L0.filter(b => b.id !== 'liab'), r = L.splice(L.findIndex(b => b.id === 'rdns'), 1)[0];
      L.splice(L.findIndex(b => b.id === 'safety'), 0, r); L.find(b => b.id === 'pdm').crit = false; L[0].c = '#abc'; return L; }));
    const wIds = 'JSON.stringify(BANDS_LIST().map(function(b){ return b.id+(b.crit? "*" : ""); }))';
    const SOa = JSON.parse(SO.ev(wIds)), SO0 = wDrill(SO);
    const SOstd = JSON.parse(SO.ev(`(function(){ var r=__u37('bandStd()'); return JSON.stringify([r.err, r.msg]); })()`));
    const SOb = JSON.parse(SO.ev(wIds)), SO1 = wDrill(SO);
    w5Chk(name, 'C · exportCSV(), a refused standard band: ⚙ Install standard costs what the words say', 'a standard sub-band (0a) and a reordered ladder missing a standard band, one tick cleared: the alert says Install standard puts the standard bands back on top in the standard order, a removed one included, both ticks as issued, none filed under another band; nothing built or changed; done, 0a reads 1, the order and the tick are the standard\'s, and the drill is made',
      J([SUa, SU0.zips, SU0.blobs, SU0.dl, SU0.msg, SU0.same, SUstd, SUb, SU1.zips, SU1.dl, SU1.msg,
        SOa, SO0.zips, SO0.blobs, SO0.dl, SO0.msg, SO0.same, SOstd, SOb, SO1.zips, SO1.dl, SO1.msg, [SU0.err, SU1.err, SO0.err, SO1.err], [SU.errors.length, SO.errors.length]]),
      J([['0', '0a', '1', '2', '3', '4', '5', '6'], 0, 0, 0,
        'Excel workbook not exported: the colour of band 0a “PDM-Directed Funding” (its banner on the Priority drill) holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “FF6B81[U+000B]”. No file was made, and nothing on the board is changed. '
          + wTail + wStd + '0–3' + wStdTail + wImp,
        true, ['', ''], [['0', '1', '2', '3', '4', '5', '6', '7'], 'pdm', '', '#ff6b81'], 1, 1, '',
        ['netavail*', 'pdm', 'ktlo*', 'rdns', 'safety*', 'health', 'defer'], 0, 0, 0,
        'Excel workbook not exported: the colour of band 0 “Net Funding Available” (its banner on the Priority drill) is not six hex digits (#RRGGBB), the only form of colour ORBIT writes into a workbook. It reads “abc”. No file was made, and nothing on the board is changed. '
          + wTail + wStd + '0–4' + wStdTail + wImp,
        true, ['', ''], ['netavail*', 'pdm*', 'ktlo*', 'liab*', 'safety*', 'rdns', 'health', 'defer'], 1, 1, '',
        ['', '', '', ''], [0, 0]]));

    // (verify-money r5) TWO BANDS HOLDING A REFUSED COLOUR. A sub-band takes its header's colour (＋ab), so band 0's colour as a
    // board file carried it (U+000B) is Readiness degradation's too, filed under band 0 as 0a. The refusal names both; ⚙ Install
    // standard, which puts back only band 0, is not offered; ⬇ Export ladder, each named colour corrected, ⬆ Import ladder: the
    // drill is made (0a a band of its own, as the words say). CONTROL: band 0 and band 1 (both standard) so refused are both named,
    // ⚙ Install standard is offered, and done, the drill is made.
    const wImpEach = '⬆ Import ladder takes a ladder file with each of these colours corrected to #RRGGBB (⬇ Export ladder makes one), but drops every sub-band filing — each sub-band becomes a band of its own, its money no longer in its header’s total, and the bands below it are renumbered — and cuts a band’s name to 60 characters and its description to 120.';
    const TW = wOpen(wFile(L0 => { const r = L0.splice(L0.findIndex(b => b.id === 'rdns'), 1)[0]; L0[0].c = '#5aa87a' + VT; r.of = L0[0].id; r.c = L0[0].c;
      L0.splice(1, 0, r); return L0; }));
    const TWa = JSON.parse(TW.ev('JSON.stringify(bandLabels())')), TW0 = wDrill(TW);
    const TWpack = JSON.parse(await TW.w.eval(`(async function(){ var got=null, ob=window.Blob, oc=HTMLAnchorElement.prototype.click;
      window.Blob=function(p,o){ got=p; return new ob(p,o); }; HTMLAnchorElement.prototype.click=function(){};
      try{ bandExport(); } finally { window.Blob=ob; HTMLAnchorElement.prototype.click=oc; } return got[0]; })()`));
    TWpack.bands[0].c = '#5aa87a'; TWpack.bands[1].c = '#5aa87a';
    TW.w.__u37pack = J(TWpack);
    const TWin = await TW.w.eval(`(async function(){ var inp={files:[new File([window.__u37pack], 'ladder.json', {type:'application/json'})], value:'x'};
      bandImport(inp); for(var i=0;i<100 && inp.value;i++) await new Promise(function(r){ setTimeout(r, 20); }); return inp.value; })()`);
    const TWb = JSON.parse(TW.ev('JSON.stringify(bandLabels())')), TW1 = wDrill(TW);
    const TS = wOpen(wFile(L0 => { L0[0].c = '#5aa87a' + VT; L0[1].c = '#ff6b81' + VT; return L0; }));
    const TS0 = wDrill(TS), TSstd = JSON.parse(TS.ev(`(function(){ var r=__u37('bandStd()'); return JSON.stringify([r.err, r.msg]); })()`)), TS1 = wDrill(TS);
    w5Chk(name, 'C · exportCSV(), two bands holding a refused colour: both named, and the way offered clears both', 'band 0 and its sub-band 0a (a band of the office\'s own that took its colour): both named, Install standard not offered, the import of the file with each colour corrected makes the drill; band 0 and band 1, both standard: both named, Install standard offered, and done, the drill is made',
      J([TWa, TW0.zips, TW0.blobs, TW0.dl, TW0.msg, TW0.same, TWin, TWb, TW1.zips, TW1.dl, TW1.msg, TS0.zips, TS0.msg, TS0.same, TSstd, TS1.zips, TS1.dl, TS1.msg,
        [TW0.err, TW1.err, TS0.err, TS1.err], [TW.errors.length, TS.errors.length]]),
      J([['0', '0a', '1', '2', '3', '4', '5', '6'], 0, 0, 0,
        'Excel workbook not exported: the colour of band 0 “Net Funding Available” (its banner on the Priority drill) holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “5aa87a[U+000B]”. No file was made, and nothing on the board is changed. The colour of band 0a “Readiness degradation” is refused too, and each has to be put right. A band’s colour has no field on the board: it came in as written, with a board file or a ladder from another appropriation. ' + wImpEach,
        true, '', ['0', '1', '2', '3', '4', '5', '6', '7'], 1, 1, '',
        0, 'Excel workbook not exported: the colour of band 0 “Net Funding Available” (its banner on the Priority drill) holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “5aa87a[U+000B]”. No file was made, and nothing on the board is changed. The colour of band 1 “PDM-Directed Funding” is refused too, and each has to be put right. A band’s colour has no field on the board: it came in as written, with a board file or a ladder from another appropriation. This is a standard band: ⚖ Bands › ⚙ Install standard 0–4 puts the organization’s standard bands back as issued — colour, name, description, rule, whether each counts toward the stoppage gap and needs a consequence, a removed one included — at the top of the ladder in the standard order, and files none of them under another band (a standard sub-band becomes a band of its own, its money no longer in its header’s total, and the bands below it are renumbered). It asks first. ' + wImpEach,
        true, ['', ''], 1, 1, '',
        ['', '', '', ''], [0, 0]]));

    // (fix round 5, the builder) IN A LOCKED CYCLE'S VIEW. The view reads the bands from the working plan and keeps nothing done
    // in it: ⚙ Install standard or ⬆ Import ladder done there leaves the working plan's colour refused (measured, probe8/view8.mjs:
    // with U10 the view is put back at once; before it, the view's copy changed and was dropped on leaving). So in a view the
    // words say so and where to do it, and on the working plan they do not; ⚙ Install standard done on the working plan, the
    // view put on screen again makes the drill. Band 0 #abc, a standard band.
    const wView = ' In a locked cycle’s view nothing done is kept: ↩ Leave the view and do it on the working plan, whose bands the view reads.';
    // v2.02 (item 89): a cycle locked from v2.02 keeps its ladder, so its view reads the colour it was locked with (changed on purpose)
    const wViewKept = ' In a locked cycle’s view nothing done is kept, and this cycle reads the bands it was locked with: put the colour right on the working plan, then reopen the cycle (🔓) and lock it again.';
    const wAbc = 'Excel workbook not exported: the colour of band 0 “Net Funding Available” (its banner on the Priority drill) is not six hex digits (#RRGGBB), the only form of colour ORBIT writes into a workbook. It reads “abc”. No file was made, and nothing on the board is changed. ';
    const VW = wOpen(wFile(L0 => { L0[0].c = '#abc'; return L0; }));
    const VWk = VW.ev(`(function(){ MS.years[MS.cur]=S; blCyc='PB'; blYr=MS.cur; cycLock(); var k=Object.keys(blStore())[0]; cycView(k); return k; })()`);
    const VWv = VW.ev('String(CYCVIEW)'), VW0 = wDrill(VW);
    VW.ev(`cycLeave(); 'ok'`);
    const VWp = wDrill(VW), VWstd = JSON.parse(VW.ev(`(function(){ var r=__u37('bandStd()'); return JSON.stringify([r.err, r.msg, BANDS_LIST()[0].c, CYCVIEW]); })()`));
    VW.ev(`cycView(${J(VWk)}); 'ok'`);
    const VWv1 = VW.ev('String(CYCVIEW)'), VW1 = wDrill(VW);
    // v2.02 (item 89): PB27 kept its ladder, #abc and all -- the fix on the working plan does not reach it, and its words say so;
    // the same cycle with its kept lists taken away (locked before v2.02) reads the working plan's ladder, and makes the drill
    VW.ev(`cycLeave(); delete blGet(${J(VWk)}).keep; cycView(${J(VWk)}); 'ok'`);
    const VW2 = wDrill(VW);
    VW.ev(`cycLeave(); 'ok'`);
    w5Chk(name, 'C · exportCSV() in a locked cycle\'s view, a refused band colour: the words say nothing done there is kept, and where to do it', 'in the view: refused, nothing built, no Blob, no download, nothing changed, the words with the view\'s sentence; on the working plan the words without it; ⚙ Install standard done there, the view of PB27, which kept its ladder, still refuses with its words; a cycle locked before v2.02 makes the drill',
      J([VWv, VW0.zips, VW0.blobs, VW0.dl, VW0.msg, VW0.same, VWp.zips, VWp.msg, VWstd, VWv1, VW1.zips, VW1.dl, VW1.msg, VW2.zips, VW2.dl, VW2.msg, [VW0.err, VWp.err, VW1.err, VW2.err], VW.errors.length]),
      J(['PB|2027', 0, 0, 0, wAbc + wTail + wStd + '0–4' + wStdTail + wImp + wViewKept, true, 0, wAbc + wTail + wStd + '0–4' + wStdTail + wImp,
        ['', '', '#5aa87a', ''], 'PB|2027', 0, 0, wAbc + wTail + wStd + '0–4' + wStdTail + wImp + wViewKept, 1, 1, '', ['', '', '', ''], 0]));
    // (verify-tests r6) THE "REFUSED TOO" WORDS, PAST TWO BANDS AND IN A VIEW. Two other bands are named in the plural, each by its
    // label, and ⚙ Install standard is offered only when every band refused is standard -- the one named first as well as the
    // others; in a locked cycle's view the view's sentence follows the "refused too" words. Band 0 and band 1 (standard) and band
    // 6, Program health (the office's own), each holding U+000B: both others named, and Install standard not offered (it leaves
    // band 6 refused). Readiness degradation (the office's own) moved above Safety-Critical & Must Fix (standard), both refused:
    // the band named first is the office's own, so Install standard is not offered. Band 0 and its sub-band 0a (as above) in
    // PB's view: both named, and the view's sentence at the end.
    const wB0 = 'Excel workbook not exported: the colour of band 0 “Net Funding Available” (its banner on the Priority drill) holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “5aa87a[U+000B]”. No file was made, and nothing on the board is changed. ';
    const T3 = wOpen(wFile(L0 => { L0[0].c = '#5aa87a' + VT; L0[1].c = '#ff6b81' + VT; L0[6].c = '#7a6fd0' + VT; return L0; }));
    const T3a = JSON.parse(T3.ev('JSON.stringify(bandLabels())')), T30 = wDrill(T3);
    w5Chk(name, 'C · exportCSV(), three bands holding a refused colour, one of them the office\'s own: both others named, and Install standard not offered', 'band 0, band 1 (standard) and band 6 (the office\'s own): refused, nothing built, no Blob, no download, nothing changed; band 1 and band 6 named in the plural, and only ⬆ Import ladder offered',
      J([T3a, T30.zips, T30.blobs, T30.dl, T30.msg, T30.same, T30.err, T3.errors.length]),
      J([['0', '1', '2', '3', '4', '5', '6', '7'], 0, 0, 0,
        wB0 + 'The colours of band 1 “PDM-Directed Funding” and band 6 “Program health” are refused too, and each has to be put right. ' + wTail + wImpEach,
        true, '', 0]));
    const TR = wOpen(wFile(L0 => { const r = L0.splice(L0.findIndex(b => b.id === 'rdns'), 1)[0]; r.c = '#4f8fd6' + VT;
      L0.splice(L0.findIndex(b => b.id === 'safety'), 0, r); L0.find(b => b.id === 'safety').c = '#e0703a' + VT; return L0; }));
    const TRa = JSON.parse(TR.ev(wIds)), TR0 = wDrill(TR);
    w5Chk(name, 'C · exportCSV(), the band named first the office\'s own and the other standard: Install standard not offered', 'Readiness degradation above Safety-Critical & Must Fix, both refused: nothing built, no Blob, no download, nothing changed; the standard band named too, and only ⬆ Import ladder offered',
      J([TRa, TR0.zips, TR0.blobs, TR0.dl, TR0.msg, TR0.same, TR0.err, TR.errors.length]),
      J([['netavail*', 'pdm*', 'ktlo*', 'liab*', 'rdns', 'safety*', 'health', 'defer'], 0, 0, 0,
        'Excel workbook not exported: the colour of band 4 “Readiness degradation” (its banner on the Priority drill) holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “4f8fd6[U+000B]”. No file was made, and nothing on the board is changed. The colour of band 5 “Safety-Critical & Must Fix” is refused too, and each has to be put right. ' + wTail + wImpEach,
        true, '', 0]));
    const TV = wOpen(wFile(L0 => { const r = L0.splice(L0.findIndex(b => b.id === 'rdns'), 1)[0]; L0[0].c = '#5aa87a' + VT; r.of = L0[0].id; r.c = L0[0].c;
      L0.splice(1, 0, r); return L0; }));
    const TVk = TV.ev(`(function(){ MS.years[MS.cur]=S; blCyc='PB'; blYr=MS.cur; cycLock(); var k=Object.keys(blStore())[0]; cycView(k); return k; })()`);
    const TVv = TV.ev('String(CYCVIEW)'), TV0 = wDrill(TV);
    TV.ev(`cycLeave(); 'ok'`);
    w5Chk(name, 'C · exportCSV() in a locked cycle\'s view, two bands holding a refused colour: both named, and the view\'s sentence after them', 'band 0 and its sub-band 0a in PB\'s view: refused, nothing built, no Blob, no download, nothing changed; 0a named, and the words end with the view\'s sentence',
      J([TVk, TVv, TV0.zips, TV0.blobs, TV0.dl, TV0.msg, TV0.same, TV0.err, TV.errors.length]),
      J(['PB|2027', 'PB|2027', 0, 0, 0,
        wB0 + 'The colour of band 0a “Readiness degradation” is refused too, and each has to be put right. ' + wTail + wImpEach + wViewKept,
        true, '', 0]));
    // (verify-tests r7) THE DECK AND THE CHART IMAGE REFUSE U+FFFF AS THE WORKBOOK DOES; A CELL PAST COLUMN Z IS NAMED BY ITS TWO
    // LETTERS; THE C1 CONTROLS, WHICH XML 1.0 ALLOWS, ARE WRITTEN. A1 runs the 31 characters through the workbook only, and the deck
    // and the chart image were checked with U+000B only, every named cell in column A to H: a deck or a chart image checked for the
    // C0 controls alone, a column spelled A to Z only, and a pattern that also refuses U+007F-U+009F (XML 1.1's restricted set)
    // passed every check. On a board of its own: a Mission Critical Plan Event holding U+FFFF, typed through the pen -- no deck,
    // slide 5 named (the base wrote slide5.xml not well-formed); a funds-flow destination named Ctl<U+FFFF>, the chart drawn -- no
    // image (the base made its Blob); an RCN code holding U+000B, typed through the registry's own setter -- the Spend Plan Source
    // refused at O&M Raw Data AB2, the RCN column. CONTROL: a cell holding U+0085, U+007F and U+009F is written, every part parses
    // and the board reads the text back; a Plan Event holding U+0085 makes the Excel export.
    const X7 = boot();
    seed(X7.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('R1', 'AV', [900, 200, 0])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['R1'] });
    X7.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.awards={R1:{mode:'single', d:FYMON[2][0], day:3}}; applyState(S); S.mc={R1:true}; save(); 'ok'`);
    X7.ev(HELP);
    const NCH = String.fromCharCode(0xFFFF);
    // (v2.05, item 114: B4, the deck refusing U+FFFF, went with the deck.)
    // v2.19 (item 150): the funds-flow chart, whose image refused U+FFFF here, is gone
    X7.ev(`MS.rcn=[{k:'K1', rcn:'11111', eeic:'AAAAA', t:'good title', svc:['USAF','ANG','AFRC']}]; S.rcnAsg={R1:'K1'}; save(); rcnSet(0, 'rcn', ${J('111' + VT + '11')}); 'ok'`);
    const R7e = JSON.parse(X7.ev('JSON.stringify(MS.rcn[0].rcn)')), R7f = route(X7, 'exportSrc()');
    X7.ev(`rcnSet(0, 'rcn', '11111'); 'ok'`);
    w5Chk(name, 'C · exportSrc(), an RCN code holding U+000B, in a column past Z', 'the code kept as typed; nothing built, no Blob, no download; the cell named by its two letters, AB2 (the RCN column), with the text; nothing changed',
      J([R7e, R7f.zips, R7f.blobs, R7f.dl, R7f.msg, R7f.same, R7f.err]),
      J(['111\u000B11', 0, 0, 0, 'Excel workbook not exported: sheet “O&M Raw Data”, cell AB2 holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “111[U+000B]11”', true, '']));
    const R7g = JSON.parse(X7.ev(`(function(){ window.__in=${J([{ name: 'U37', rows: [['a\u0085b', 'c\u007Fd', 'e\u009Ff']] }])}; var r=__u37('buildXlsx(window.__in)'), q=r.ret? __u37parts(r.ret) : null;
      return JSON.stringify({made:!!r.ret, zips:r.zips, msg:r.msg, err:r.err, same:r.same, bad:q? q.bad : null, n:q? q.n : 0}); })()`));
    const R7h = JSON.parse(await X7.w.eval(`(async function(){ var b=buildXlsx(window.__in); if(!b) return JSON.stringify('no workbook'); return JSON.stringify((await xlsxRead(b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength))).U37); })()`));
    const R7i = typed(X7, 'R1', 'Plan\u0085event'), R7j = route(X7, 'exportExcel()');
    typed(X7, 'R1', 'Plan event');
    w5Chk(name, 'A13 · CONTROL the C1 controls, which XML 1.0 allows', 'a cell holding U+0085, U+007F and U+009F: made, one zip, nothing said, every part parses, the board reads the text back; a Plan Event holding U+0085: the Excel export is made',
      J([R7g.made, R7g.zips, R7g.msg, R7g.bad, R7g.n, R7h, R7i, R7j.zips, R7j.blobs, R7j.dl, R7j.msg, [R7g.err, R7j.err], X7.errors.length]),
      J([true, 1, '', [], 6, [['a\u0085b', 'c\u007Fd', 'e\u009Ff']], 'Plan\u0085event', 1, 1, 1, '', ['', ''], 0]));

    // (verify-tests r4) "This is a standard band" is said of the bands ⚙ Install standard puts back -- a band whose id is the
    // standard's -- and of no other. Not of a band of this office's own filed under band 0 (0a, second in the ladder), nor of
    // one named PDM-Directed Funding, nor of one a file marked standard: for each, ⚙ Install standard, done, leaves its colour
    // and the drill still refused. Of band 0 whose file dropped its standard mark it is said, and done, the drill is made. The
    // words name the button as the panel shows it: ⚙ Install standard 0–3 when PDM-Directed Funding is filed under band 0.
    const kStd = R => JSON.parse(R.ev(`(function(){ var r=__u37('bandStd()'); return JSON.stringify([r.err, r.msg]); })()`));
    const kSay = m => (m.split('This is a standard band: ')[1] || '').split(' puts')[0], kCut = m => m.split('. No file was made')[0];
    const kBtn = R => R.ev(`(function(){ bandPanelOpen=true; bandPanelBody(); var b=[].slice.call(document.querySelectorAll('#bandList button'))
      .filter(function(x){ return /Install standard/.test(x.textContent); }), t=b.length? b[0].textContent : ''; bandPanelOpen=false; bandPanelBody(); return t; })()`);
    const KA = wOpen(wFile(L0 => { const r = L0.splice(5, 1)[0]; r.of = L0[0].id; r.c = '#4f8fd6' + VT; L0.splice(1, 0, r); return L0; }));
    const KAa = JSON.parse(KA.ev('JSON.stringify(bandLabels())')), KA0 = wDrill(KA), KAs = kStd(KA), KA1 = wDrill(KA);
    const KB = wOpen(wFile(L0 => { L0[6].n = 'PDM-Directed Funding'; L0[6].c = '#7a6fd0' + VT; return L0; }));
    const KB0 = wDrill(KB), KBs = kStd(KB), KB1 = wDrill(KB);
    const KC = wOpen(wFile(L0 => { L0[7].std = true; L0[7].c = '#8892a4' + VT; return L0; }));
    const KC0 = wDrill(KC), KCs = kStd(KC), KC1 = wDrill(KC);
    const KD = wOpen(wFile(L0 => { L0[1].of = L0[0].id; L0[1].c = '#FF6B81' + VT; return L0; }));
    const KD0 = wDrill(KD), KDb = kBtn(KD);
    const KE = wOpen(wFile(L0 => { L0[0].std = false; L0[0].c = '#5aa87a' + VT; return L0; }));
    const KE0 = wDrill(KE), KEs = kStd(KE), KE1 = wDrill(KE);
    w5Chk(name, 'C · exportCSV(), a refused band colour: "a standard band" is said of a band ⚙ Install standard puts back, and of no other', 'a band of this office\'s own filed under band 0, one named PDM-Directed Funding and one a file marked standard: refused with the import\'s words only, and ⚙ Install standard, done, leaves each refused; band 0 with its standard mark dropped: told it is a standard band, and Install standard, done, makes the drill; the button named as the panel shows it, 0–3 when a standard band is a sub-band; nothing built or changed',
      J([KAa, KA0.zips, KA0.blobs, KA0.dl, KA0.msg, KA0.same, KAs, KA1.zips, kCut(KA1.msg),
        KB0.zips, KB0.msg, KB0.same, KBs, KB1.zips, kCut(KB1.msg),
        KC0.zips, KC0.msg, KC0.same, KCs, KC1.zips, kCut(KC1.msg),
        KD0.zips, kSay(KD0.msg), KD0.same, KDb,
        KE0.zips, kCut(KE0.msg), kSay(KE0.msg), KE0.same, KEs, KE1.zips, KE1.dl, KE1.msg,
        [KA0.err, KA1.err, KB0.err, KB1.err, KC0.err, KC1.err, KD0.err, KE0.err, KE1.err], [KA.errors.length, KB.errors.length, KC.errors.length, KD.errors.length, KE.errors.length]]),
      J([['0', '0a', '1', '2', '3', '4', '5', '6'], 0, 0, 0,
        'Excel workbook not exported: the colour of band 0a “Readiness degradation” (its banner on the Priority drill) holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “4f8fd6[U+000B]”. No file was made, and nothing on the board is changed. ' + wTail + wImp,
        true, ['', ''], 0, 'Excel workbook not exported: the colour of band 0a “Readiness degradation” (its banner on the Priority drill) holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “4f8fd6[U+000B]”',
        0, 'Excel workbook not exported: the colour of band 6 “PDM-Directed Funding” (its banner on the Priority drill) holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “7a6fd0[U+000B]”. No file was made, and nothing on the board is changed. ' + wTail + wImp,
        true, ['', ''], 0, 'Excel workbook not exported: the colour of band 6 “PDM-Directed Funding” (its banner on the Priority drill) holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “7a6fd0[U+000B]”',
        0, 'Excel workbook not exported: the colour of band 7 “Deferrable” (its banner on the Priority drill) holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “8892a4[U+000B]”. No file was made, and nothing on the board is changed. ' + wTail + wImp,
        true, ['', ''], 0, 'Excel workbook not exported: the colour of band 7 “Deferrable” (its banner on the Priority drill) holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “8892a4[U+000B]”',
        0, '⚖ Bands › ⚙ Install standard 0–3', true, '⚙ Install standard 0–3',
        0, 'Excel workbook not exported: the colour of band 0 “Net Funding Available” (its banner on the Priority drill) holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “5aa87a[U+000B]”',
        '⚖ Bands › ⚙ Install standard 0–4', true, ['', ''], 1, 1, '',
        ['', '', '', '', '', '', '', '', ''], [0, 0, 0, 0, 0]]));

    // (fix round 4, money review r4 S2) a sub-band that loses its filing takes its money out of its header's total -- the row
    // the board calls the figure people brief from -- and the words say so of both ways. Requirements of 400,000 in band 0,
    // 300,000 in PDM-Directed Funding filed under it (0a), 200,000 in Readiness degradation and 100,000 in Program health filed
    // under it (4a). CONTROL: colours as saved, the drill's Summary and 1-N by Band carry band 0's total (700,000) and band 4's
    // (300,000). PDM's colour holding U+000B: refused, the words say a standard sub-band's money leaves its header's total; ⚙
    // Install standard done, the drill is made with no band-0 total, Readiness's (now band 5, still with 5a) kept. Readiness's
    // colour with a quote: refused, the import's words say each sub-band's money leaves its header's total; ⬇ Export ladder,
    // corrected, ⬆ Import ladder: the drill is made with no total row at all.
    const XR = boot();
    seed(XR.ev, { services: ['USAF'], items: [it('Q1', 'AV', [400000]), it('Q2', 'PSM', [300000]), it('Q3', 'AV', [200000]), it('Q4', 'PSM', [100000])],
      disc: [600000], mand: [0], order: ['Q1', 'Q2', 'Q3', 'Q4'] });
    XR.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); MS.years[MS.cur]=S;
      BANDS_LIST(); S.band={Q1:'netavail', Q2:'pdm', Q3:'rdns', Q4:'health'}; S.order=['Q1','Q2','Q3','Q4']; save(); 'ok'`);
    const rSlug = JSON.parse(XR.ev('JSON.stringify(_AP.slug)')), rHtml = XR.ev('buildSavedHtml()');
    const rFile = fn => rHtml.replace(uRE, (m, a, b, z) => { const P = JSON.parse(b), L = P.appns[rSlug].bands, at = id => L.find(x => x.id === id);
      at('pdm').of = 'netavail'; at('health').of = 'rdns'; fn(at); return a + J(P).replace(/</g, '\\u003c') + z; });
    // the drill's total rows, read from the sheets the writer was given -- only when it made the file
    const rRoll = R => JSON.parse(R.ev(`(function(){ var sh=null, ox=buildXlsx, oc=HTMLAnchorElement.prototype.click, oa=window.alert, m='';
      buildXlsx=function(s,e){ var b=ox(s,e); if(b) sh=s; return b; }; HTMLAnchorElement.prototype.click=function(){}; window.alert=function(x){ m+=String(x); };
      try{ exportCSV(); } finally { buildXlsx=ox; HTMLAnchorElement.prototype.click=oc; window.alert=oa; }
      var out=[]; (sh||[]).forEach(function(s){ (s.rows||[]).forEach(function(r){ var c=r&&r[0], t=(c&&typeof c==='object')? String(c.v) : String(c==null? '' : c),
        v=function(k){ var x=r[k]; return (x&&typeof x==='object')? x.v : x; };
        if(/^BAND \\S+ TOTAL/.test(t)) out.push([s.name, t, v(11)]); else if(/^\\S+ total$/.test(t)) out.push([s.name, t, v(1), v(4)]); }); });
      return JSON.stringify([!!sh, out, m]); })()`));
    const RC = wOpen(rFile(at => {})), RCr = rRoll(RC);
    const RS = wOpen(rFile(at => { at('pdm').c = '#FF6B81' + VT; })), RS0 = wDrill(RS), RSs = kStd(RS), RS1 = rRoll(RS);
    const RI = wOpen(rFile(at => { at('rdns').c = '#4f8fd6"'; })), RI0 = wDrill(RI);
    const RIpack = JSON.parse(await RI.w.eval(`(async function(){ var got=null, ob=window.Blob, oc=HTMLAnchorElement.prototype.click;
      window.Blob=function(p,o){ got=p; return new ob(p,o); }; HTMLAnchorElement.prototype.click=function(){};
      try{ bandExport(); } finally { window.Blob=ob; HTMLAnchorElement.prototype.click=oc; } return got[0]; })()`));
    RIpack.bands.find(b => b.id === 'rdns').c = '#4f8fd6';
    RI.w.__u37pack = J(RIpack);
    const RIin = await RI.w.eval(`(async function(){ var inp={files:[new File([window.__u37pack], 'ladder.json', {type:'application/json'})], value:'x'};
      bandImport(inp); for(var i=0;i<100 && inp.value;i++) await new Promise(function(r){ setTimeout(r, 20); }); return inp.value; })()`);
    const RI1 = rRoll(RI);
    w5Chk(name, 'C · exportCSV(), a sub-band un-filed by either way the words name: its money leaves its header\'s total, as they say', 'band 0 with PDM-Directed Funding as 0a and band 4 with Program health as 4a: the drill carries both totals (CONTROL); a refused colour of 0a and one of band 4 each say a sub-band\'s money leaves its header\'s total, nothing built or changed; ⚙ Install standard done, no band-0 total, band 4\'s kept as band 5\'s; ⬇ Export ladder, corrected, ⬆ Import ladder done, no total at all',
      J([RCr, RS0.zips, RS0.blobs, RS0.dl, RS0.msg, RS0.same, RSs, RS1, RI0.zips, RI0.blobs, RI0.dl, RI0.msg, RI0.same, RIin, RI1,
        [RS0.err, RI0.err], [RC.errors.length, RS.errors.length, RI.errors.length]]),
      J([[true, [['Summary', '0 total', 'NET FUNDING AVAILABLE — with its 1 sub-band', 700000], ['Summary', '4 total', 'READINESS DEGRADATION — with its 1 sub-band', 300000],
          ['1-N by Band', 'BAND 0 TOTAL  —  NET FUNDING AVAILABLE  (with its 1 sub-band)', 700000], ['1-N by Band', 'BAND 4 TOTAL  —  READINESS DEGRADATION  (with its 1 sub-band)', 300000]], ''],
        0, 0, 0,
        'Excel workbook not exported: the colour of band 0a “PDM-Directed Funding” (its banner on the Priority drill) holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “FF6B81[U+000B]”. No file was made, and nothing on the board is changed. '
          + wTail + wStd + '0–3' + wStdTail + wImp,
        true, ['', ''],
        [true, [['Summary', '5 total', 'READINESS DEGRADATION — with its 1 sub-band', 300000], ['1-N by Band', 'BAND 5 TOTAL  —  READINESS DEGRADATION  (with its 1 sub-band)', 300000]], ''],
        0, 0, 0,
        'Excel workbook not exported: the colour of band 4 “Readiness degradation” (its banner on the Priority drill) is not six hex digits (#RRGGBB), the only form of colour ORBIT writes into a workbook. It reads “4f8fd6"”. No file was made, and nothing on the board is changed. '
          + wTail + wImp,
        true, '', [true, [], ''],
        ['', ''], [0, 0, 0]]));

    // ---- D. EVERY CALLER ----
    const XD = boot();
    seed(XD.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('R1', 'AV', [900, 200, 0]), it('R2', 'PSM', [300, 0, 50])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['R1', 'R2'] });
    XD.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.awards={R1:{mode:'single', d:FYMON[2][0], day:3}}; applyState(S); save();
      MS.years[MS.cur]=S; blCyc='PB'; blYr=MS.cur; cycLock(); cycCmpA='PB|'+MS.cur; cycCmpB='working';
      var xr=function(ym, t, a){ var r=[]; for(var i=0;i<26;i++) r.push(''); r[1]=ym; r[2]='J1'; r[3]=t; r[4]='USAF X'; r[7]='EV '+t; r[9]=a; r[10]='Not Allocated'; r[18]='Office (AV)'; return r; };
      EXDB.all={}; EXDB.all[mySlug()]={rows:{}}; EXDB.all[mySlug()].rows[MS.cur]=[xr(MS.cur+'-05', 'Exec line one', 400000), xr(MS.cur+'-08', 'Exec line two', 300000)];
      rlgSrc='exec'; rlgTarget=0.2;
      pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:MS.cur,ts:Date.now(),by:'PMO Lead',fromTs:1, svc:SVC.slice(), items:{R1:{cons:'Their wording.'}}, base:{R1:{cons:null}}},'s.json');
      fcView='p:AV'; exView='summary'; 'ok'`);
    XD.ev(HELP);
    const XO = boot({ appn: 'O&M' });
    seed(XO.ev, { services: ['STOVL', 'USMC CV', 'USN'], items: [it('R1', 'AV', [900, 200, 100])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['R1'] });
    XO.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.awards={R1:{mode:'single', d:FYMON[2][0], day:3}}; applyState(S); save(); 'ok'`);
    XO.ev(HELP);
    // v2.19 (item 150): the IDS file, the funds flow, the ACE tie-out and the chart of accounts are gone from the routes
    const ROUTES = [[XD, 'exportRlgPlan()'], [XD, 'pmoReport()'], [XO, 'crExport()'], [XD, 'exportExView()'],
      [XD, 'exportSrc()'], [XD, 'exportPlans()'], [XD, 'exportFydpPlan()'], [XD, 'exportCycCompare()'], [XD, 'exportFcView()'],
      [XD, 'exportCSV()'], [XD, 'exportExcel()']];   // v2.05 (item 114): the deck went
    const callOf = (c) => c;
    for (const [Y, c] of ROUTES) {
      const r = route(Y, callOf(c, '21'));
      w5Chk(name, 'D · ' + c + ' CONTROL', 'on ordinary data the file is made: one zip, one Blob, one download, nothing alerted',
        J([r.zips, r.blobs, r.dl, r.msg, r.err]), J([1, 1, 1, '', '']));
    }
    const stand = (Y, on) => Y.ev(on
      ? `window.__u37n=0; window.__u37x=window._xlsxRefused;
         _xlsxRefused=function(){ __u37n++; return true; }; 'ok'`
      : `_xlsxRefused=window.__u37x; 'ok'`);
    [XD, XO].forEach(Y => stand(Y, true));
    for (const [Y, c] of ROUTES) {
      Y.ev(`__u37n=0; setStat('U37-MARK'); 'ok'`);
      const r = route(Y, callOf(c, '44'));
      w5Chk(name, 'D · ' + c + ' refused', 'the writer refuses once and the route stops there: no Blob, no download, no word after the refusal, nothing on the board changed',
        J([Y.ev('String(__u37n)'), r.zips, r.blobs, r.dl, Y.ev(`(document.getElementById('shareStat')||{}).textContent`), r.same, r.err]),
        J(['1', 0, 0, 0, 'U37-MARK', true, '']));
    }
    [XD, XO].forEach(Y => stand(Y, false));
    w5Chk(name, 'E · no page error', 'none of the three boards reported an error', J([X.errors.length, XD.errors.length, XO.errors.length]), J([0, 0, 0]));
    w5Chk(name, 'E2 · no page error on the review\'s boards', 'the board the review round added reported no error', J([XL.errors.length]), J([0]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// v2.19 (item 150): removed with its feature -- v2.00 (U44) — a destination list that repeats a key, or holds a key the funds flow keeps for its own rows, never prints money twice: a file handed over with one is refused, and the user’s own board is put right as it comes across
// v2.19 (item 150): removed with its feature -- v2.00 (U44) — a “what the money buys” category list that repeats a key prints that category’s row once
// ==== end v2.00 (U44) — buys ====
// ==== v2.01 (D4-1): a carriage return in a person's text reaches every export as a carriage return ====
// Found by Codex batch D4 (20 Oct): _xesc escaped & < > " and wrote a CR raw. XML allows the character, so nothing was refused
// (U37's A7 CONTROL) -- but an XML reader turns a raw CR into a line feed before anything sees the text, so a Plan Event typed as
// "carriage<CR>return" opened as "carriage<LF>return" in the Spend Plan Source (O&M Raw Data D2), the Priority Drill (1-N by Band
// E5) and the deck (slide 5). ORBIT's own reader (_xunesc) kept the CR, which is why every round trip here passed.
// THE CHECK reads each file the way another program does: the bytes the export handed to its Blob, unzipped, every part parsed
// with the page's DOMParser, and every text run (<t>, <a:t>) holding "carriage" collected. Expected, as a literal: that text
// exactly, CR and all, and nothing else. The workbook (exportExcel) too, since it writes the Plan Event on Decision Bands.
// FAILS ON c6ba63f: every route reads "carriage\nreturn". CONTROL: a Plan Event holding a line feed reads back as one.
await (async () => {
  const name = 'v2.01 (D4-1) — a carriage return in a Plan Event reaches every export as a carriage return, not a line feed';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const X = boot();
    seed(X.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('R1', 'AV', [900, 200, 0])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['R1'] });
    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.awards={R1:{mode:'single', d:FYMON[2][0], day:3}}; applyState(S); S.mc={R1:true}; save(); 'ok'`);
    // the Plan Event typed through the pen, as a person types it
    // v2.08 (item 122): through the edit box's one writer, reqApply (an <input> would strip the line break first)
    const typed = v => JSON.parse(X.ev(`(function(){ reqApply('R1', {titles:${J(v)}}, {}); save(); return JSON.stringify((S.titles||{}).R1); })()`));
    // run one export; unzip the first Blob it made; every text run holding "carriage", as a standard XML reader reads it
    const read = call => JSON.parse(X.ev(`(function(){
      var cap=null, ob=window.Blob, oc=HTMLAnchorElement.prototype.click, err='';
      window.Blob=function(p,o){ if(!cap && p && p[0] && p[0].byteLength) cap=p[0]; return new ob(p,o); };
      HTMLAnchorElement.prototype.click=function(){};
      try{ (0,eval)(${J(call)}); }catch(e){ err=String((e&&e.message)||e); }
      finally{ window.Blob=ob; HTMLAnchorElement.prototype.click=oc; }
      if(!cap) return JSON.stringify({err:err||'no file', runs:[]});
      var u=new Uint8Array(cap.buffer? cap.buffer.slice(cap.byteOffset, cap.byteOffset+cap.byteLength) : cap), dv=new DataView(u.buffer), at=0, td=new TextDecoder(), runs=[], bad=[];
      while(at+30<=u.length && dv.getUint32(at,true)===0x04034b50){
        var sz=dv.getUint32(at+18,true), nl=dv.getUint16(at+26,true), xl=dv.getUint16(at+28,true);
        var k=td.decode(u.subarray(at+30,at+30+nl)), t=td.decode(u.subarray(at+30+nl+xl,at+30+nl+xl+sz));
        if(/\\.xml$/.test(k)){
          var d=new DOMParser().parseFromString(t,'application/xml');
          if(d.getElementsByTagName('parsererror').length) bad.push(k);
          var all=d.getElementsByTagName('*');
          for(var i=0;i<all.length;i++){ var el=all[i]; if(el.localName==='t' && el.textContent.indexOf('carriage')>=0 && runs.indexOf(el.textContent)<0) runs.push(el.textContent); }
        }
        at+=30+nl+xl+sz; }
      return JSON.stringify({err:err, bad:bad, runs:runs}); })()`));
    // the workbook writes the Plan Event twice: on its own, and in a line that names the rank and the record
    const ROUTES = [['exportSrc()', 'the Spend Plan Source', t => [t]], ['exportCSV()', 'the Priority Drill', t => [t]],
      ['exportExcel()', 'the workbook', t => [t, '    #1 ' + t + ' [CCR1]']]];
    const CR = 'carriage\rreturn', LF = 'carriage\nreturn';
    w5Chk(name, 'the Plan Event as typed', 'the pen keeps the carriage return', J(typed(CR)), J(CR));
    for (const [fn, what, want] of ROUTES) {
      const r = read(fn);
      w5Chk(name, fn + ' · ' + what + ', a carriage return', 'made, every part parses; read as another program reads it, the text holds the carriage return, not a line feed',
        J([r.err, r.bad, r.runs]), J(['', [], want(CR)]));
    }
    w5Chk(name, 'CONTROL · the Plan Event as typed, a line feed', 'the pen keeps the line feed', J(typed(LF)), J(LF));
    for (const [fn, what, want] of ROUTES) {
      const r = read(fn);
      w5Chk(name, 'CONTROL · ' + fn + ' · ' + what + ', a line feed', 'made, every part parses; a line feed reads back as a line feed',
        J([r.err, r.bad, r.runs]), J(['', [], want(LF)]));
    }
    w5Chk(name, 'no page error', 'the board reported no error', J(X.errors.length), J(0));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.01 (D4-1) ====

// ==== v2.09 W1 (item 125): CLIN amounts and the row controls, by pointer ====
// ==== end v2.09 W1 ====

// ==== v2.09 W2 (item 126): a PMO copy's five years ====
// ==== end v2.09 W2 ====

// ==== v2.09 W3 (item 127): Save in a PMO copy; the board refuses a copy at its other doors ====
// ==== end v2.09 W3 ====

// ==== v2.09 W4 (item 128): the SI tab's requirements by code ====
// ITEM 128 (Brad, 26 Oct 2026): "For the Excel Workbook export, the SI tab needs a new area below what we already have that
// shows the requirements and amounts allocated by SI. I need an EN section that shows each requirement assigned to EN and
// then the amounts for STOVL, USMC CV, and USN." His decisions: every code (LA, EN, OT, FL, AT, then the tab's no-code
// label); the figure is FUNDED -- discretionary + mandatory drawn, NO DATE included, following the ◨ view -- headed so,
// never "Allocated"; the requirement value beside it in columns that enter no total; every requirement asking on STOVL,
// USMC CV or USN listed, an unfunded one at $0; a prime's row, then a line per CLIN in whole dollars adding to the prime; a
// TOTAL per code equal to that code's rows in the service blocks above and a grand total equal to the roll-up; priority
// order with the master rank. Everything below is read back from the workbook's BYTES.
// THE FIXTURE MAKES THE READINGS DISAGREE. Every requirement is on a Split (convertAllToSplit), so the allocation and the
// draw coincide -- except on a not-drawn line, which this board has two of. O&M, six services; pots STOVL 1,000k disc +
// 400k mand, USMC-C 600k disc, USN 1,500k disc + 300k mand, USAF 1,000k disc. In priority order (STOVL / USMC-C / USN):
//   A  PP, EN by the PP rule        asks 300 / 100 / 200 k            funded the same, December
//   B  AV, EN by hand               asks 200 / 150 / 0 k (+ USAF 500k) allocation trimmed to 150 k on STOVL: funded 150 / 150 / 0
//   C  an LM prime, LA derived      asks 550 / 100 / 600 k            allocation trimmed to 500 k on USN: funded 550 / 100 / 500;
//      CLIN 0001 asks STOVL 100 k, USN 360 k; CLIN 0002 STOVL 200 k, USN 240 k; neither USMC-C
//   D  AV, EN by hand               asks 400 k STOVL, no award date   STOVL's discretionary is gone: all mandatory, NO DATE
//   E  AV, OT by hand               asks 1,200 k USN                  directed 850 k disc + 300 k mand; the lane has 800 k left:
//      FUNDED 1,100 k, ALLOCATION 1,150 k, REQUIREMENT VALUE 1,200 k -- three readings, three figures
//   F  PP, EN by the PP rule        asks 250 k USN                    directed 250 k disc on a dry lane: FUNDED $0, allocation 250 k
//   G  AV, no SI code               asks 200 k USMC-C                 funded, November
//   H  PP, EN by the PP rule        asks USAF 400 k only              out of scope: no SI money, not listed
// SO: LA = C; EN = A, B, D, F in priority order (by size it would be A, D, B, F); OT = E; FL and AT empty; no code = G.
//   C's CLINs: STOVL 550 k split 1:2 = 183,333 / 366,667 (whole dollars, adding to it); USN 500 k funded = 300 / 200 k and its
//   600 k value = 360 / 240 k; USMC-C's 100 k has no grid share and is on a line of its own.
//   Service totals STOVL 1,400 k, USMC CV 550 k, USN 1,800 k; the roll-up 3,750 k. Under ◨: D draws nothing (listed at $0),
//   E draws 800 k; STOVL 1,000 k, USN 1,500 k, the roll-up 3,050 k; the same requirements listed.
// A SECOND BOARD, STOVL / USMC-C / USN only, with asks and nothing funded: the tab stays, listing them at $0 -- one under a
// code from a file the board does not recognize, so its heading says so, and an LM prime whose CLIN lines read $0 funded
// and split its value. Nothing else in that workbook reads the prime's CLINs, so reading them must leave its CLIN
// containers as they were (CONTROL: v2.08 never read them).
// THE RCN-EEIC TAB IS UNCHANGED: the same fixture on the v2.08 board (ebe702e, read from the repository with git show) builds
// the same RCN tab, cell and style, and the same SI tab above the new section. CONTROL (it holds on v2.08 by construction).
// Only those two are held to v2.08 here: a later version changing another sheet on purpose must not fail item 128's check.
// A version that changes the RCN tab on purpose moves W4_BASE to the board it was built on.
// The stale words fixed with it: the Special Interest overview's note and the CR cash return's status line name the edit box
// (📋 Requirement edit, at the Navy SI code), and Needs attention's Go to it says it opens the edit box.
// FAILS ON ebe702e (v2.08): there is no section, the second board has no SI tab, and the words still name the ⋯ menu and
// the RECORD panel. Passing there too: the CONTROLs.
await (async () => {
  const name = 'v2.09 W4 (item 128) — the SI tab lists the requirements under each SI code';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify, K = 1000;
    const cv = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c;
    const lbl = r => String(cv((r || [])[0]) ?? '').trim();
    const val = c => { const v = cv(c); return (v === undefined || v === null) ? '' : v; };   // a blank cell reads ''
    const isNum = v => typeof v === 'number';
    const SVN = ['STOVL', 'USMC CV', 'USN'];
    const W4_BASE = 'ebe702e';            // the v2.08 board this version was built on
    const build = (html, view) => {
      const X = html ? boot({ html }) : boot();
      seed(X.ev, { services: ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'], items: [
        it('A', 'PP', [0, 0, 0, 300 * K, 100 * K, 200 * K]), it('B', 'AV', [500 * K, 0, 0, 200 * K, 150 * K, 0]),
        it('C', 'PRIMES', [0, 0, 0, 550 * K, 100 * K, 600 * K]), it('D', 'AV', [0, 0, 0, 400 * K, 0, 0]),
        it('E', 'AV', [0, 0, 0, 0, 0, 1200 * K]), it('F', 'PP', [0, 0, 0, 0, 0, 250 * K]),
        it('G', 'AV', [0, 0, 0, 0, 200 * K, 0]), it('H', 'PP', [400 * K, 0, 0, 0, 0, 0])],
        disc: [1000 * K, 0, 0, 1000 * K, 600 * K, 1500 * K], mand: [0, 0, 0, 400 * K, 0, 300 * K],
        order: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        alloc: { B: { m: 's', v: [500 * K, 0, 0, 150 * K, 150 * K, 0] }, C: { m: 's', v: [0, 0, 0, 550 * K, 100 * K, 500 * K] } } });
      X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
        flowCfg().rules.lm='Req C'; S.ptype={C:'PRIME'};
        CLINS['C']=[{clin:'0001', desc:'Air vehicle', ask:[0,0,0,100000,0,360000]},{clin:'0002', desc:'Support equipment', ask:[0,0,0,200000,0,240000]}];
        DATA.clins=CLINS;
        MS.rcn=[{k:'rW4', rcn:'12345', eeic:'ABC12', t:'W4 combo', svc:['USAF','ANG','AFRC']}]; S.rcnAsg={B:'rW4'};
        S.si={B:'EN', D:'EN', E:'OT'};
        S.awards={A:{mode:'single', d:FYMON[2][0], day:10},
          B:{mode:'inc', inc:[{d:FYMON[1][0], day:5, sv:[300000,0,0,100000,100000,0]},{d:FYMON[4][0], day:20, sv:[200000,0,0,50000,50000,0]}]},
          C:{mode:'single', d:FYMON[4][0], day:3}, E:{mode:'single', d:FYMON[6][0], day:12},
          F:{mode:'single', d:FYMON[3][0], day:1}, G:{mode:'single', d:FYMON[1][0], day:9}, H:{mode:'single', d:FYMON[2][0], day:2}};
        applyState(S); save(); window.confirm=function(){ return true; }; window.alert=function(){};
        convertAllToSplit();
        setFsrcSvc('E','d',SVC.indexOf('USN'),'850000'); setFsrcSvc('F','d',SVC.indexOf('USN'),'250000');
        ${view ? "setScen('disc');" : "setScen('');"} render(); 'ok'`);
      return X;
    };
    // the workbook as the program handed it to the writer (cells and styles), and as the file reads back
    const sheetsOf = X => JSON.parse(X.ev(`(function(){ var got=null, ob=buildXlsx;
      buildXlsx=function(sh,x,h){ got=JSON.parse(JSON.stringify(sh)); return ob(sh,x,h); };
      try{ exportExcel(); } finally{ buildXlsx=ob; } return JSON.stringify(got); })()`));
    const bytesOf = async X => JSON.parse(await w6Book(X.w, 'exportExcel'));

    // ---- read the SI tab: the service blocks, the roll-up, and the section, by label and by heading
    const readSi = rows => {
      const out = { blocks: {}, svcTot: {}, roll: null, title: -1, codes: [], grand: null, col14: [], labels: [], hdrBad: [] };
      const sec = rows.findIndex(r => /^REQUIREMENTS UNDER EACH SI CODE/.test(lbl(r)));
      out.title = sec; out.titleText = sec >= 0 ? lbl(rows[sec]) : '';
      const top = sec < 0 ? rows.length : sec;
      let cur = null;
      for (let j = 0; j < top; j++) {
        const l = lbl(rows[j]);
        if (SVN.includes(l)) { cur = l; out.blocks[cur] = {}; continue; }
        if (cur && l === cur + ' TOTAL') { out.svcTot[cur] = cv(rows[j][14]); cur = null; continue; }
        if (cur && l && isNum(cv(rows[j][14]))) out.blocks[cur][l] = cv(rows[j][14]);
        if (/— TOTAL BY MONTH$/.test(l)) out.roll = cv(rows[j][14]);
      }
      if (sec < 0) return out;
      let code = null, hdr = null;
      for (let j = sec + 1; j < rows.length; j++) {
        const r = rows[j] || [], l = lbl(r);
        if (l) out.labels.push(l);
        if (r.length > 14 && cv(r[14]) !== '' && cv(r[14]) != null) out.col14.push(l);
        let m;
        if ((m = /^(LA|EN|OT|FL|AT)  .+   \((\d+) requirements?\)$/.exec(l)) || (m = /^(— no (?:recognized )?SI code(?: set)? —)   \((\d+) requirements?, still to code\)$/.exec(l))) {
          code = { code: m[1], n: +m[2], rows: [], clins: [], total: null, head: l }; out.codes.push(code); hdr = null; continue; }
        if (code && l === 'Requirement / CLIN') {
          const h = r.map(c => String(cv(c) ?? '').trim());
          const at = n => { const k = h.indexOf(n); if (k < 0) out.hdrBad.push(n); return k; };
          hdr = { f: SVN.map(s => at(s + ' funded')), t: at('Total funded'), a: SVN.map(s => at(s + ' requirement value')), all: h };
          continue; }
        if (/^TOTAL — every requirement above/.test(l)) { out.grand = { f: hdr ? hdr.f.map(k => val(r[k])) : [], t: hdr ? val(r[hdr.t]) : null,
          a: hdr ? hdr.a.map(k => val(r[k])) : [] }; code = null; continue; }
        if (!code || !hdr) continue;
        const fig = { f: hdr.f.map(k => val(r[k])), t: val(r[hdr.t]), a: hdr.a.map(k => val(r[k])), label: l };
        if (/^TOTAL — /.test(l)) { code.total = fig; continue; }
        if ((m = /^#(\d+)  (.+)$/.exec(l))) { fig.rank = +m[1]; fig.title = m[2]; code.rows.push(fig); continue; }
        if (/^(CLIN |not on a CLIN)/.test(l)) { fig.of = code.rows.length ? code.rows[code.rows.length - 1].rank : null; code.clins.push(fig); continue; }
      }
      return out;
    };
    const meta = X => JSON.parse(X.ev(`JSON.stringify((function(){ var o={}; S.order.forEach(function(id,i){ var it=itemById(id);
      o[id]={rank:i+1, title:(recName(it)||dispTitle(it))}; }); return o; })())`));

    // ---- the fixture does what it says
    const X = build(null, '');
    const M = meta(X);
    const byRank = rk => Object.keys(M).find(id => M[id].rank === rk);
    w5Chk(name, 'fixture', 'CONTROL — E and F are not drawn: the lanes could not pay what was typed (so the allocation and the draw disagree on them)',
      X.ev(`JSON.stringify(ndData().list.map(function(l){ return [l.id, l.lane, l.typed, l.drew]; }))`),
      J([['E', 'd', 850 * K, 800 * K], ['F', 'd', 250 * K, 0]]));
    w5Chk(name, 'fixture', 'CONTROL — the three readings differ: on E the allocation is 1,150,000 against 1,100,000 funded and 1,200,000 asked; on F 250,000 against $0',
      X.ev(`JSON.stringify(['E','F'].map(function(id){ var it=itemById(id), p=tiers()[id], u=SVC.indexOf('USN');
        return [basisSvcOf(it)[u], p.d[u]+p.m[u], it.ask[u]]; }))`), J([[1150 * K, 1100 * K, 1200 * K], [250 * K, 0, 250 * K]]));
    w5Chk(name, 'fixture', 'CONTROL — D is paid by mandatory alone and has no award date; C is a prime with two CLINs; H asks on USAF only',
      X.ev(`JSON.stringify([tiers().D.d[SVC.indexOf('STOVL')], tiers().D.m[SVC.indexOf('STOVL')], !!(S.awards||{}).D, clinApplies('C'), clinList('C').length, itemById('H').ask.slice(3)])`),
      J([0, 400 * K, false, true, 2, [0, 0, 0]]));

    // ---- the section, from the bytes, in each view
    const WANT = {
      '': { f: { A: [300, 100, 200], B: [150, 150, 0], C: [550, 100, 500], D: [400, 0, 0], E: [0, 0, 1100], F: [0, 0, 0], G: [0, 200, 0] },
        svc: [1400, 550, 1800], roll: 3750 },
      disc: { f: { A: [300, 100, 200], B: [150, 150, 0], C: [550, 100, 500], D: [0, 0, 0], E: [0, 0, 800], F: [0, 0, 0], G: [0, 200, 0] },
        svc: [1000, 550, 1500], roll: 3050 } };
    const ASK = { A: [300, 100, 200], B: [200, 150, 0], C: [550, 100, 600], D: [400, 0, 0], E: [0, 0, 1200], F: [0, 0, 250], G: [0, 200, 0] };
    const CODES = { LA: ['C'], EN: ['A', 'B', 'D', 'F'], OT: ['E'], FL: [], AT: [], none: ['G'] };
    const k$ = v => v.map(x => x * K);
    const LABEL = { LA: 'LA  Airframe', EN: 'EN  Engine', OT: 'OT  Other Government Costs', FL: 'FL  Fuel', AT: 'AT  Audit', none: '— no SI code set —' };
    for (const view of ['', 'disc']) {
      const B = view ? build(null, 'disc') : X, where = view ? '◨ discretionary only' : 'the funded plan', W = WANT[view];
      const bk = await bytesOf(B);
      w5Chk(name, where, 'CONTROL — the workbook builds and reads back, with its SI tab', J([bk.__err || 'ok', Array.isArray(bk['SI Codes by Month'])]), J(['ok', true]));
      const rows = bk['SI Codes by Month'] || [], P = readSi(rows);
      w5Chk(name, where, 'below the roll-up and its note, the section title, carrying the view’s mark exactly when the view is on',
        J([P.title > 0 && rows.slice(0, P.title).some(r => /— TOTAL BY MONTH$/.test(lbl(r))), /◨ DISCRETIONARY ONLY/.test(P.titleText)]), J([true, !!view]));
      w5Chk(name, where, 'every code in the tab’s order, then the requirements carrying none, each with its count',
        J(P.codes.map(c => [c.code, c.n])), J([['LA', 1], ['EN', 4], ['OT', 1], ['FL', 0], ['AT', 0], ['— no SI code set —', 1]]));
      w5Chk(name, where, 'each code’s heading is not the rollup’s code row, and the column headings say funded, never allocated',
        J(P.title > 0 ? [P.codes.every(c => !Object.keys(LABEL).some(k => LABEL[k] === c.head)), P.hdrBad, rows.slice(P.title).some(r => (r || []).some(c => /allocat/i.test(String(val(c)))))] : 'NO SECTION'),
        J([true, [], false]));
      // which requirements, in what order, with what rank: priority order, never size; F at $0; H nowhere
      w5Chk(name, where, 'under each code its requirements in priority order with the master rank: EN is A, B, D, F (by size it would be A, D, B, F); H (USAF only) is listed nowhere',
        J(P.codes.map(c => c.rows.map(r => [byRank(r.rank), r.title === (M[byRank(r.rank)] || {}).title]))),
        J(['LA', 'EN', 'OT', 'FL', 'AT', 'none'].map(k => CODES[k].map(id => [id, true]))));
      const all = [].concat(...P.codes.map(c => c.rows));
      all.forEach(r => {
        const id = byRank(r.rank);
        w5Chk(name, where + ' · ' + id, 'funded on STOVL / USMC CV / USN: the lanes’ draw, NO DATE included (never the allocation)', J(r.f), J(k$(W.f[id] || [])));
        w5Chk(name, where + ' · ' + id, 'the row adds across: STOVL + USMC CV + USN = its Total funded', J(r.t), J(r.f.reduce((a, b) => a + (+b || 0), 0)));
        w5Chk(name, where + ' · ' + id, 'the requirement value on each service, beside it: the fixture’s own asks', J(r.a), J(k$(ASK[id] || [])));
      });
      w5Chk(name, where, 'F, which drew nothing, is listed at $0 funded with its 250,000 value; under ◨ D, which only mandatory paid, is listed at $0 too',
        J(['F', 'D'].map(id => { const r = all.find(x => byRank(x.rank) === id); return r ? [r.t, r.a.reduce((a, b) => a + b, 0)] : 'NOT LISTED'; })),
        J([[0, 250 * K], [view ? 0 : 400 * K, 400 * K]]));
      // each code's TOTAL: its rows, and that code's row in each service block above
      P.codes.forEach(c => {
        const key = c.code.startsWith('—') ? 'none' : c.code, rl = LABEL[key];
        const sum = SVN.map((_, g) => c.rows.reduce((a, r) => a + (+r.f[g] || 0), 0));
        w5Chk(name, where + ' · ' + key + ' TOTAL', 'the code’s TOTAL is the rows under it, on each service and in Total funded',
          J(c.total ? [c.total.f, c.total.t] : 'NO TOTAL'), J([sum, sum.reduce((a, b) => a + b, 0)]));
        w5Chk(name, where + ' · ' + key + ' TOTAL', 'and equals that code’s row in each service block above (no row there: 0)',
          J(c.total ? c.total.f : 'NO TOTAL'), J(SVN.map(s => (P.blocks[s] || {})[rl] || 0)));
        w5Chk(name, where + ' · ' + key + ' TOTAL', 'the requirement value is in no total: the TOTAL row leaves those columns empty',
          J(c.total ? c.total.a.map(v => v === '' || v === null || v === undefined) : 'NO TOTAL'), J([true, true, true]));
      });
      w5Chk(name, where, 'the last TOTAL: each service’s block total, and the roll-up (every dollar on the tab sits on one requirement row)',
        J(P.grand ? [P.grand.f, P.grand.t, P.grand.a.every(v => v === '' || v == null)] : 'NO GRAND TOTAL'),
        J([SVN.map(s => P.svcTot[s]), P.roll, true]));
      w5Chk(name, where, 'CONTROL — the blocks and the roll-up are the fixture’s own: STOVL / USMC CV / USN and the roll-up',
        J([SVN.map(s => P.svcTot[s]), P.roll]), J([k$(W.svc), W.roll * K]));
      // the prime's CLIN lines
      const cl = (P.codes.find(c => c.code === 'LA') || { clins: [] }).clins;
      w5Chk(name, where + ' · C', 'C’s CLIN lines: 183,333 / 366,667 on STOVL (550,000 split 1:2), 300,000 / 200,000 funded and 360,000 / 240,000 value on USN, USMC CV’s 100,000 on a line of its own',
        J(cl.map(r => [r.label, r.f, r.t, r.a])),
        J([['CLIN 0001   Air vehicle', [183333, '', 300 * K], 483333, [183333, '', 360 * K]],
           ['CLIN 0002   Support equipment', [366667, '', 200 * K], 566667, [366667, '', 240 * K]],
           ['not on a CLIN — the CLIN grid holds nothing for USMC CV', ['', 100 * K, ''], 100 * K, ['', 100 * K, '']]]));
      const cRow = all.find(r => byRank(r.rank) === 'C');
      w5Chk(name, where + ' · C', 'the CLIN lines add to the prime’s row, funded and value, on every service',
        J(cRow ? [SVN.map((_, g) => cl.reduce((a, r) => a + (+r.f[g] || 0), 0)), SVN.map((_, g) => cl.reduce((a, r) => a + (+r.a[g] || 0), 0))] : 'NO ROW'),
        J(cRow ? [cRow.f, cRow.a] : 'a row'));
      const figs = [P.codes.map(c => [].concat(c.rows, c.clins, c.total ? [c.total] : []).map(r => [r.f, r.t, r.a])), P.grand ? [P.grand.f, P.grand.t] : []].flat(4).filter(isNum);
      w5Chk(name, where, 'every figure in the section is a whole dollar (Number.isInteger, not a tolerance)', J([figs.length > 40, figs.filter(v => !Number.isInteger(v))]), J([true, []]));
      w5Chk(name, where, 'the rollup’s TOTAL column is empty on every row of the section', J(P.title > 0 ? P.col14 : 'NO SECTION'), J([]));
      w5Chk(name, where, 'no section label reads “<SVC> TOTAL” or ends “TOTAL BY MONTH”, which name the rollup’s rows',
        J(P.labels.length > 20 ? P.labels.filter(l => SVN.some(s => l === s + ' TOTAL') || /TOTAL BY MONTH$/.test(l)) : 'NO SECTION'), J([]));
    }

    // ---- the tab is kept when asks exist and nothing is funded on these services. A STOVL / USMC-C / USN board, so there is
    // no RCN tab, and nothing funded, so the Spend Plan Source splits no prime: this section is the only reader of R's CLINs.
    {
      const Y = boot();
      seed(Y.ev, { services: ['STOVL', 'USMC-C', 'USN'], items: [
        it('P', 'PP', [50 * K, 0, 0]), it('Q', 'AV', [0, 0, 70 * K]), it('R', 'PRIMES', [0, 0, 90 * K])],
        disc: [0, 0, 0], mand: [0, 0, 0], order: ['P', 'Q', 'R'] });
      Y.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
        flowCfg().rules.lm='Req R'; S.ptype={R:'PRIME'};
        CLINS['R']=[{clin:'0001', desc:'one', ask:[0,0,30000]},{clin:'0002', desc:'two', ask:[0,0,60000]}]; DATA.clins=CLINS;
        applyState(S); S.si={Q:'zz'}; save(); render(); 'ok'`);
      const clinBoxes = () => Y.ev(`JSON.stringify(['clinMeta','clinNew','clinRm','clinAlloc'].map(function(n){ return [n, Object.prototype.hasOwnProperty.call(S, n), S[n]]; }))`);
      const before = clinBoxes();
      const bk = await bytesOf(Y), rows = bk['SI Codes by Month'], P = readSi(rows || []);
      w5Chk(name, 'nothing funded on STOVL, USMC CV or USN', 'the SI tab is still in the workbook, its roll-up 0', J([Array.isArray(rows), P.roll]), J([true, 0]));
      w5Chk(name, 'nothing funded on STOVL, USMC CV or USN', 'and lists all three at $0 with their values; Q under the tab’s own “no recognized SI code” heading',
        J(P.codes.filter(c => c.rows.length).map(c => [c.code, c.rows.map(r => [r.rank, r.t, r.a])])),
        J([['LA', [[3, 0, [0, 0, 90 * K]]]], ['EN', [[1, 0, [50 * K, 0, 0]]]], ['— no recognized SI code —', [[2, 0, [0, 0, 70 * K]]]]]));
      w5Chk(name, 'nothing funded on STOVL, USMC CV or USN', 'the unfunded prime R’s CLIN lines: $0 funded, its 90,000 value split 30,000 / 60,000 by its grid',
        J((P.codes.find(c => c.code === 'LA') || { clins: [] }).clins.map(r => [r.label, r.f, r.t, r.a])),
        J([['CLIN 0001   one', ['', '', 0], 0, ['', '', 30 * K]], ['CLIN 0002   two', ['', '', 0], 0, ['', '', 60 * K]]]));
      w5Chk(name, 'nothing funded on STOVL, USMC CV or USN', 'CONTROL — reading R’s CLINs left the board as it was: no CLIN container made, no default share written',
        clinBoxes(), before);
      w5Chk(name, 'nothing funded on STOVL, USMC CV or USN', 'Needs attention’s Go to it says it opens the edit box at the Navy SI code, and it does',
        J([/opens the requirement’s 📋 Requirement edit at its Navy SI code/.test(Y.ev('ATT_KIND.si.why')), /RECORD panel/.test(Y.ev('ATT_KIND.si.why')),
          Y.ev(`(function(){ attGo('si','Q'); return String(erOpen); })()`)]), J([true, false, 'Q']));
    }

    // ---- the words fixed with it: the overview's note and the CR cash return's status line name the edit box
    {
      X.ev(`siShown=true; siOpen=true; siMatrix(); 'ok'`);
      const note = X.ev(`(document.querySelector('#siBody .hint')||{}).textContent||''`);
      w5Chk(name, 'the Special Interest overview', 'its note sends the reader to the edit box for G’s $200,000, not to the row’s ⋯ menu',
        J([note.includes('$200,000 carries no code yet — set one in a requirement’s 📋 Requirement edit, at its Navy SI code.'), note.includes('⋯')]), J([true, false]));
      const cr = JSON.parse(await X.w.eval(`(async function(){ var _B=window.Blob; window.Blob=function(p,o){ return new _B(p,o); };
        try{ crExport(); }catch(e){ window.Blob=_B; return JSON.stringify('threw '+e.message); } window.Blob=_B;
        return JSON.stringify(document.getElementById('shareStat').textContent); })()`));
      w5Chk(name, 'the CR cash return', 'its status line names the edit box for the requirement with no SI code',
        J([cr.includes('1 with no SI code — those cells are blank; set them in each requirement’s 📋 Requirement edit, at its Navy SI code.'), cr.includes('⋯')]), J([true, false]));
    }

    // ---- the RCN-EEIC tab, and the SI tab above the section, as the v2.08 board builds them
    {
      let old = '';
      try { const { execFileSync } = await import('node:child_process');
        old = execFileSync('git', ['show', W4_BASE + ':prioritization-board-grid.html'], { cwd: new URL('../..', import.meta.url).pathname, maxBuffer: 1 << 28 }).toString(); } catch (e) { old = ''; }
      w5Chk(name, 'v2.08 (' + W4_BASE + ')', 'CONTROL — the v2.08 board is read from the repository (a shallow clone needs git fetch --unshallow)', J(old.length > 1e6), J(true));
      if (old) {
        for (const view of ['', 'disc']) {
          // fresh boards on both sides: the blocks above ran the overview and the CR return on X
          const mine = sheetsOf(build(null, view)), base = sheetsOf(build(old, view));
          const of = (L, n) => L.find(s => s.name === n) || null;
          const where = 'v2.08 against this board · ' + (view ? '◨ discretionary only' : 'the funded plan');
          w5Chk(name, where, 'CONTROL — the RCN-EEIC tab is the same sheet: every cell, its style and the column widths',
            J([!!of(base, 'RCN-EEIC by Month'), J(of(mine, 'RCN-EEIC by Month')) === J(of(base, 'RCN-EEIC by Month'))]), J([true, true]));
          const sm = of(mine, 'SI Codes by Month'), sb = of(base, 'SI Codes by Month');
          w5Chk(name, where, 'CONTROL — the SI tab above the section is v2.08’s whole tab, row for row, cell and style',
            J(sm && sb ? J(sm.rows.slice(0, sb.rows.length)) === J(sb.rows) : 'missing'), J(true));
          w5Chk(name, where, 'and only the label column is wider (34 to 52), for the requirement titles',
            J(sm && sb ? sb.cols.map((c, i) => c === sm.cols[i] ? null : [i, c, sm.cols[i]]).filter(Boolean) : 'missing'), J([[0, 34, 52]]));
        }
      }
    }
    w5Chk(name, 'no page error', 'CONTROL — the boards reported no error', J(X.errors.length), J(0));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.09 W4 ====

// ==== v2.10 A (item 130): FYDP Disconnects -- the figures and the box ====
// ==== end v2.10 A ====

// ==== v2.10 B (item 130): FYDP Disconnects -- the workbook ====
// ==== end v2.10 B ====

// v2.19 (item 150): removed with its feature -- v2.12 W1 — PSM is inside Air Vehicle, and each office’s part of the estimate is the lines only its requirements claim, up the WBS tree
// ==== end v2.12 W1 ====

// ==== v2.12 W2 (item 132): a WBS paragraph on every requirement, picked; the Spend Plan Source carries it; the FYDP plan joins STOVL ====
// ==== end v2.12 W2 ====

// ==== v2.12 W3 (item 134): every year's budget is the PPBE position; over and under flagged; unallocated added funds as UPL ====
// ==== end v2.12 W3 ====

// ==== v2.14 W1 (item 140; item 141 D): Save writes only to its own file, and asks before writing over what it does not carry ====
// ==== end v2.14 W1 ====

// ==== v2.14 W2 (item 141): a full import too big for browser storage goes into a new file ====
// ==== end v2.14 W2 ====

// ==== v2.14 W3 (item 141 F, G; item 140 c): browser storage refused or full ====
// ==== end v2.14 W3 ====

// ==== v2.14 W4 (items 129, 124; ledger U63, U64, U35): the held findings ====
// ==== end v2.14 W4 ====

// ==== v2.14 integration (the lead) ====
// ==== end v2.14 integration ====

// ==== v2.15 W1 (items 137, 138, 139: the context bar, a package under the receiving cycle, retag every locked appropriation) ====
// v2.15 W1 (item 139): LOCK AS A BUILD BEFORE v2.15 LOCKED. Lock now refuses a plan tagged with another cycle (it would keep that cycle's
// controls under the lock's name). Older fixtures here lock a cycle on a plan tagged with another -- a lock a file still carries -- so this
// takes it the way v2.14 did: under the lock's key for the moment, with the position of the cycle the plan is on, then the tag put back
// and the lock's record set as v2.14 wrote it (pos: the plan's tag and its position; from: the plan's tag). Where the plan is untagged or
// on the lock's own cycle it is cycLock() itself. A function declaration, so every block above the slot can call it (it is hoisted).
function w1LockAsBefore() {
  return `(function(){ var K=blKey(blCyc, blYr||MS.cur), t0=(typeof MS.cycle==='string')? MS.cycle : '';
    if(!t0 || t0===K){ cycLock(); return; }
    MS.ppbe=MS.ppbe||{}; var P0=MS.ppbe[t0], had=Object.prototype.hasOwnProperty.call(MS.ppbe, K)? MS.ppbe[K] : undefined, c0=blGet(K);
    if(P0!==undefined) MS.ppbe[K]=P0; else delete MS.ppbe[K];
    MS.cycle=K; cycLock(); MS.cycle=t0;
    if(had===undefined) delete MS.ppbe[K]; else MS.ppbe[K]=had;
    var c=blGet(K); baLiveAll(); if(c && c!==c0){ c.pos={key:t0, P:P0? JSON.parse(JSON.stringify(ppNorm(P0))) : null}; c.from=t0; persistCyc(); save(); } })();`;
}
// ==== end v2.15 W1 ====
// ==== v2.15 W2 (items 142, 143, 145; item 131 FDC listener: the copy that opens, Save records what it wrote, two tabs) ====
// ==== end v2.15 W2 ====
// ==== v2.15 W3 (items 144, 146 (storage writes, Save and import wording, test gaps)) ====
// ==== end v2.15 W3 ====
// ==== v2.15 W4 (items 131, 135 and the handoff small fixes: folder reads, house indents, CLIN request, guide, drill, Funded) ====
// ==== end v2.15 W4 ====
// ==== v2.15 integration (the lead) ====
// ==== end v2.15 integration ====
// ==== v2.15 review RV-A ====
// ==== end v2.15 review RV-A ====
// ==== v2.15 review RV-B ====
// ==== end v2.15 review RV-B ====
// ==== v2.15 review RV-C ====
// ==== end v2.15 review RV-C ====
// ==== v2.15 review RV-D ====
// ==== end v2.15 review RV-D ====
// ==== v2.16 (item 148) ====
// Brad, 19 Nov 2026, from the real board: "GEX/GATES is somehow being confused with the Option Year requirement in the five year
// spend plan export." An added requirement is numbered within its own year, and the five-year plan joined the years by that number:
// FY28's NEW-1 (LM) and FY29's NEW-1 (GEX) became one line, FY28's dollars under FY29's name. Every expectation here is the
// fixture's own typed figures and titles, never read back from the model under test.
await (async () => {
  const { bootMark: _m, bootRelease: _r } = await import('./boot.mjs');
  const __bm = _m();
  const name = 'v2.16 — the five-year plan joins the years by the work, never by the number (item 148)';
  try {
  const J = JSON.stringify;
  const B = boot(); const bev = B.ev;
  seed(bev, { services: ['USAF', 'ANG'], items: [it('BASE', 'PSM', [100, 50])], disc: [1e11, 1e11], mand: [0, 0], order: ['BASE'] });
  bev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); MS.years[MS.cur]=S; save(); 'ok'`);
  const cur = +bev('MS.cur');
  const add = (t, a, from) => `reqCreate('PSM',{title:${J(t)},event:${J(t)},ask:${J(a)}}${from ? ',' + J(from) : ''})`;
  // year 1: LM then GEX (NEW-1, NEW-2), and LINK, carried on below
  bev(`${add('LM Option Year', [2560000000, 0])}; ${add('GEX/GATES', [58580, 0])}; ${add('LINK carried', [700, 7])}; save(); 'ok'`);
  const ids1 = JSON.parse(bev(`JSON.stringify(S.custom.map(x=>[x.id,x.title]))`));
  // year 2, blank: GEX then LM (so the numbers cross), LINK brought in From another year twice (two copies of one requirement)
  // (a filler first, so the requirement carried From another year is numbered differently in each year: only its link can join it)
  // v2.17 (149.4): a blank year is Cancel to roll forward, then OK to start it empty
  bev(`window.confirm=m=>/^Start FY\\d+ EMPTY\\?/.test(String(m)); switchYear(${cur + 1}); ${add('GEX/GATES', [60000, 0])}; ${add('LM Option Year', [2600000000, 0])};
    ${add('Filler', [1, 0])}; ${add('LINK carried', [800, 8], { y: cur, id: ids1[2][0] })}; ${add('LINK second copy', [900, 9], { y: cur, id: ids1[2][0] })}; save(); 'ok'`);
  const ids2 = JSON.parse(bev(`JSON.stringify(S.custom.map(x=>[x.id,x.title]))`));
  // year 3, a ROLL FORWARD of year 2 (every id kept, no links): each line carries on
  bev(`window.confirm=()=>true; switchYear(${cur + 2}); setAsk(${J(ids2[0][0])},0,'61000'); save(); window.confirm=()=>false; switchYear(${cur}); 'ok'`);
  chk(name, 'fixture', 'CONTROL — the numbers cross: year 1 NEW-1 is LM, year 2 NEW-1 is GEX (passes on v2.15)',
    J([ids1[0], ids2[0]]), J([['NEW-1', 'LM Option Year'], ['NEW-1', 'GEX/GATES']]));
  chk(name, 'fixture', 'CONTROL — the requirement carried From another year has another number there (passes on v2.15)',
    J([ids1[2][0], (ids2.find(p => p[1] === 'LINK carried') || [])[0]]), J(['NEW-3', 'NEW-4']));
  const model = JSON.parse(bev(`(function(){ const D=fydpData('working'), Y=fydpBookYears(D), M=fydpBookApp(D, Y);
    return JSON.stringify(M.order.map(function(k){ const q=M.reqs[k]; return {id:q.id, t:q.title, fy:Y.filter(y=>q.fy[y]).map(y=>[y, q.fy[y].ask.reduce((a,b)=>a+b,0)])}; })); })()`));
  const lineOf = t => model.filter(l => l.t === t);
  const yr = (l, y) => ((l.fy.find(p => p[0] === y)) || [0, null])[1];
  // LM: year 1 and year 2 are separate added requirements with no link -- each is its own line, never GEX's dollars
  chk(name, 'Brad’s case', 'no LM line carries a GEX figure, and no GEX line carries an LM figure',
    J(model.filter(l => /LM|GEX/.test(l.t)).map(l => l.t + ':' + l.fy.map(p => p[1]).join('/')).sort()),
    J(['GEX/GATES:58580', 'GEX/GATES:60000/61000', 'LM Option Year:2560000000', 'LM Option Year:2600000000/2600000000'].sort()));
  chk(name, 'Brad’s case', 'year 1 LM is $2,560,000,000 on an LM line, year 1 GEX $58,580 on a GEX line',
    J([lineOf('LM Option Year').map(l => yr(l, cur)).filter(v => v !== null), lineOf('GEX/GATES').map(l => yr(l, cur)).filter(v => v !== null)]),
    J([[2560000000], [58580]]));
  chk(name, 'rolled year', 'CONTROL (holds on v2.15 too; guards the fix) — a year started as a roll forward keeps each requirement on its line (GEX year 2 and 3 one line, the year-3 figure as typed)',
    J(lineOf('GEX/GATES').map(l => [yr(l, cur + 1), yr(l, cur + 2)]).filter(p => p[0] !== null)), J([[60000, 61000]]));
  chk(name, 'From another year', 'CONTROL (holds on v2.15 too; guards the fix) — a requirement brought in From another year is the same line as the one it continues',
    J(lineOf('LINK carried').map(l => l.fy)), J([[[cur, 707], [cur + 1, 808], [cur + 2, 808]]]));
  chk(name, 'two copies', 'CONTROL (holds on v2.15 too; guards the fix) — a second requirement continuing the same one, in the same year, is a line of its own',
    J(lineOf('LINK second copy').map(l => l.fy)), J([[[cur + 1, 909], [cur + 2, 909]]]));
  chk(name, 'board data', 'CONTROL — the board-data requirement (in year 1 only: year 2 started blank) is one line (passes on v2.15)',
    J(model.filter(l => l.id === 'BASE').map(l => l.fy)), J([[[cur, 150]]]));
  // every year's lines add to that year's projection, and no requirement's dollars are lost or counted twice
  const yTot = JSON.parse(bev(`JSON.stringify([${cur},${cur + 1},${cur + 2}].map(y=>aceWithYear(y, cycProjOf).reqs.reduce((a,r)=>a+r.ask.reduce((x,v)=>x+v,0),0)))`));
  chk(name, 'totals', 'CONTROL (holds on v2.15 too; guards the fix) — each year’s lines add to that year’s projection',
    J([cur, cur + 1, cur + 2].map(y => model.reduce((a, l) => a + (yr(l, y) || 0), 0))), J(yTot));
  // a projection taken before v2.16 carries neither custom nor prior: NEW- ids are read as added, and with no link the rolled-year
  // rule decides -- crossed numbers are never one line
  const old = JSON.parse(bev(`(function(){ const X={proj:{}}, Y=[${cur},${cur + 1}];
    X.proj[${cur}]={svc:['USAF','ANG'], reqs:[{id:'NEW-1', title:'LM Option Year', grp:'PSM', ccar:'', ask:[2560000000,0], alloc:[0,0], fund:[0,0]}]};
    X.proj[${cur + 1}]={svc:['USAF','ANG'], reqs:[{id:'NEW-1', title:'GEX/GATES', grp:'PSM', ccar:'', ask:[60000,0], alloc:[0,0], fund:[0,0]},
                                             {id:'NEW-2', title:'LM Option Year', grp:'PSM', ccar:'', ask:[2600000000,0], alloc:[0,0], fund:[0,0]}]};
    const M=fydpBookApp(X, Y); return JSON.stringify(M.order.map(k=>M.reqs[k].title+':'+Y.filter(y=>M.reqs[k].fy[y]).map(y=>M.reqs[k].fy[y].ask[0]).join('/'))); })()`));
  chk(name, 'a lock before v2.16', 'a projection with no flags never puts year 1 LM under year 2 GEX',
    J(old.slice().sort()), J(['GEX/GATES:60000', 'LM Option Year:2560000000', 'LM Option Year:2600000000'].sort()));
  // the workbook itself: the O&M tab's line named GEX carries GEX's figure in year 1, in $M as printed
  const book = JSON.parse(bev(`(function(){ fydpSrc='working'; var got=null, _b=buildXlsx;
      buildXlsx=function(sh){ got=JSON.stringify(sh); return new Uint8Array(0); };
      try{ exportFydpPlan(); }catch(e){ got=JSON.stringify({threw:String((e&&e.message)||e)}); }
      buildXlsx=_b; return got||'null'; })()`));
  const cv = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c;
  const rows = ((Array.isArray(book) ? book : []).find(s => /O&M/.test(s.name)) || { rows: [] }).rows.map(r => (r || []).map(cv));
  const hdr = rows.findIndex(r => r.some(c => c === 'FY' + (cur % 100)));
  const col = hdr < 0 ? -1 : rows[hdr].indexOf('FY' + (cur % 100));
  const gexRows = rows.filter(r => r.some(c => c === 'GEX/GATES'));
  chk(name, 'the workbook', 'the O&M tab’s GEX/GATES lines carry $0.059M (year 1) and the LM lines never sit under GEX',
    J(gexRows.map(r => r[col]).filter(v => typeof v === 'number' && v > 0).map(v => Math.round(v * 1e6))), J([58580]));
  // v2.19 (item 150): the AI review request, which read the years the same way, is gone
  } catch (e) { failures.push({ scenario: name, where: 'block', what: 'the block threw: ' + ((e && e.message) || e), got: '', want: '' }); }
  _r(__bm);
})();
// ==== end v2.16 (item 148) ====

{
  const src = _selfRead(_selfPath(import.meta.url), 'utf8');
  const named = [...src.matchAll(/^  const name = '([^']+)'/gm)].map(m => m[1]);   // a scenario's own line, never this one
  // A name built by concatenation ('convert to split — ' + label) is heard only in its finished
  // forms, so a literal that any heard scenario STARTS WITH has run. A dead block's literal has none.
  named.forEach(n => { if (![...SEEN].some(s => s === n || s.startsWith(n))) failures.push({ scenario: n, where: 'harness',
    what: 'this scenario never ran — is its block after process.exit()?', got: 'never ran', want: 'ran' }); });
}
console.log('\n' + '='.repeat(96));
if (!failures.length) { console.log('ALL CHECKS PASSED'); process.exit(0); }
const by = {};
failures.forEach(f => { const k = f.scenario + ' | ' + f.where; (by[k] ||= []).push(f); });
console.log(`${failures.length} FAILING CHECK(S)\n`);
for (const [k, fs] of Object.entries(by)) {
  console.log(`--- ${k}`);
  fs.forEach(f => console.log(`    ${f.what}\n        got ${f.got}   want ${f.want}`));
}
process.exit(1);
