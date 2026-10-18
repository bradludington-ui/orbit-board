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
// The five surfaces the register recorded as gaps need state the base fixture never carried: a
// reprogramming log, an imported estimate (two confirmed lines, one nobody confirms, one under a PMO
// no office reports under), a year override on one ask, the other funding sources typed in, and
// prime tokens that route two requirements to Lockheed and Pratt. Seeded BEFORE the figures and the
// workbook are read, so everything below sees the same board.
const dress2 = (ev) => ev(`
  var E=rpAll(); E.length=0;
  E.push({id:'RP1', ts:1, ap:mySlug(), fy:MS.cur, type:'BTR', svc:0, appn:'', pec:'', bpac:'', title:'BTR add USAF',      amtM:1.5,  dir:'add',    pool:'disc', status:'Pending', remarks:''});
  E.push({id:'RP2', ts:2, ap:mySlug(), fy:MS.cur, type:'BTR', svc:1, appn:'', pec:'', bpac:'', title:'BTR deduct ANG',   amtM:0.5,  dir:'deduct', pool:'mand', status:'Pending', remarks:''});
  E.push({id:'RP3', ts:3, ap:mySlug(), fy:MS.cur, type:'ATR', svc:0, appn:'', pec:'', bpac:'', title:'ATR add USAF',      amtM:2.0,  dir:'add',    pool:'disc', status:'Pending', remarks:''});
  E.push({id:'RP4', ts:4, ap:mySlug(), fy:MS.cur, type:'ATR', svc:3, appn:'', pec:'', bpac:'', title:'ATR deduct STOVL', amtM:0.25, dir:'deduct', pool:'disc', status:'Pending', remarks:''});
  ACEDB.sets={}; ACEDB.sets['2026ACE']={lines:[
    {ap:mySlug(), pmo:'PSM',    wbs:'1.1', v:{}}, {ap:mySlug(), pmo:'TSS', wbs:'2.2', v:{}},
    {ap:mySlug(), pmo:'ATL',    wbs:'9.9', v:{}}, {ap:mySlug(), pmo:'NOBODY', wbs:'7.7', v:{}} ]};
  var L=ACEDB.sets['2026ACE'].lines;
  L[0].v[MS.cur]=9500000; L[1].v[MS.cur]=1700000; L[2].v[MS.cur]=4000000; L[3].v[MS.cur]=333000;
  if(!S.wbs) S.wbs={}; if(!S.aceMap) S.aceMap={};
  S.wbs['A']=[{w:'1.1', v:[]}]; S.aceMap['A']={w:['1.1'], ok:true};
  S.wbs['C']=[{w:'2.2', v:[]}]; S.aceMap['C']={w:['2.2'], ok:true};
  S.asks['C']=[1300000, 300000, 150000, 333333, 200000, 100000];
  flowCfg().rules.lm='Req B'; flowCfg().rules.pw='Req D';
  flowCfg().other[MS.cur]={ip:1000000, fms:500000};
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

// ══ 9. THE DECK ════════════════════════════════════════════════════════════════════════════════
// The deck is what actually gets briefed. It rounds to $0.1M, so it is checked at that precision --
// but a rounded figure still has to be the SAME figure, and its three tables have to agree with
// each other as well as with the workbook. A deck that disagrees with the workbook it was exported
// beside is the single most expensive way for this to go wrong.
{
  const name = '9 the deck';
  try {
  const deck = (() => {
    ev(`globalThis.__t=[]; globalThis.__ti=[];
      if(!globalThis.__oT) globalThis.__oT=_pTbl; if(!globalThis.__oI) globalThis.__oI=_pTitle;
      _pTbl=function(){ var a=arguments; globalThis.__t.push(a[a.length-1]); return ''; };
      _pTitle=function(t){ globalThis.__ti.push(t); return globalThis.__oI.apply(null,arguments); };
      if(!globalThis.__oB) globalThis.__oB=buildPptx; buildPptx=function(){ return new Uint8Array(0); };
      exportPPT(); _pTbl=globalThis.__oT; _pTitle=globalThis.__oI; buildPptx=globalThis.__oB; 'ok'`);
    return { tables: JSON.parse(ev('JSON.stringify(globalThis.__t)')),
             titles: JSON.parse(ev('JSON.stringify(globalThis.__ti)')) };
  })();
  const cel = c => (c == null) ? '' : (typeof c === 'object' ? String(c.t ?? c.v ?? '') : String(c));
  // "$34.3M" -> 34300000.  The deck is the only artefact that prints millions, so the parse lives
  // here rather than in the shared helper.
  const dollars = v => { const m = /\$?\s*(-?[\d,.]+)\s*M/i.exec(String(v));
    return m ? parseFloat(m[1].replace(/,/g, '')) * 1e6 : null; };
  const findRow = (tbl, re) => (tbl || []).find(r => re.test((r || []).map(cel).join(' | ')));
  // EACH TABLE BY WHAT IT IS, NOT WHERE IT FALLS: v1.86 put the spend plan by month in as slide 3,
  // and every table after it moved up one. A table is named by a header only it carries, or a row.
  const hdrOf = t => ((t || [])[0] || []).map(cel).map(x => x.trim().toLowerCase());
  const tblBy = pred => { const i = deck.tables.findIndex(t => { try { return pred(t); } catch { return false; } }); return i < 0 ? null : i; };
  const TB = {
    title:  tblBy(t => !!findRow(t, /Mission Critical total/)),
    stream: tblBy(t => hdrOf(t).includes('disc funded')),
    pmo:    tblBy(t => hdrOf(t).includes('★ mc req')),
    mc:     tblBy(t => !!findRow(t, /TOTAL ★ MISSION CRITICAL/)),
    ufr:    tblBy(t => !!findRow(t, /TOTAL UNFUNDED/)) };
  const cellIn = (tbl, rowRe, head) => {
    const t = tbl == null ? null : deck.tables[tbl]; if (!t) return null;
    const hdr = (t[0] || []).map(cel).map(x => x.trim());
    const c = hdr.findIndex(x => x.toLowerCase() === head.toLowerCase());
    const row = findRow(t, rowRe);
    return (c < 0 || !row) ? null : dollars(cel(row[c]));
  };
  const R = Object.values(F.rows);
  const board = { ask: T(R.map(r => T(r.ask))), disc: T(R.map(r => T(r.d))),
    mand: T(R.map(r => T(r.m))), unf: T(R.map(r => T(r.unf))),
    // READING #1 board-wide: ask less DISCRETIONARY alone. The same per-row figure the MC shortage
    // is built from, summed over EVERY requirement rather than the starred ones.
    discUnf: T(R.map(r => T(r.discUnf))),
    mcValue: T(R.filter(r => r.mc).map(r => T(r.ask))),
    mcShort: T(R.filter(r => r.mc).map(r => T(r.discUnf))) };
  const near = (got, want, what, where) => chk(name, where, what,
    (got !== null && Math.abs(got - want) <= 50000) ? 'agrees'
      : `${got === null ? 'not found' : '$' + (got / 1e6).toFixed(1) + 'M'} vs $${(want / 1e6).toFixed(1)}M`,
    'agrees');
  chk(name, 'shape', 'the deck has its five slides', deck.titles.length >= 5 ? 'yes' : deck.titles.length, 'yes');
  chk(name, 'shape', 'each table is found, and each is a different one',
    JSON.stringify(Object.keys(TB).map(k => TB[k] == null ? k + ' missing' : new Set(Object.values(TB)).size === 5 ? 'ok' : k + ' shared')),
    JSON.stringify(Object.keys(TB).map(() => 'ok')));
  near(cellIn(TB.stream, /^TOTAL/, 'FY27 Ask'), board.ask, 'the stream table’s ask agrees with the board', 'Funding by Stream');
  near(cellIn(TB.stream, /^TOTAL/, 'Disc Funded'), board.disc, 'its discretionary agrees', 'Funding by Stream');
  near(cellIn(TB.stream, /^TOTAL/, 'Mand Drawn'), board.mand, 'its mandatory agrees', 'Funding by Stream');
  near(cellIn(TB.stream, /^TOTAL/, 'TOTAL Unf'), board.unf, 'its TOTAL unfunded agrees', 'Funding by Stream');
  near(cellIn(TB.stream, /^TOTAL/, 'Unf vs DISC'), board.discUnf,
    'its unfunded-vs-discretionary agrees', 'Funding by Stream');
  near(cellIn(TB.pmo, /^TOTAL/, 'FY27 Ask'), board.ask, 'the PMO table’s ask agrees', 'Funding by PMO');
  near(cellIn(TB.pmo, /^TOTAL/, 'Discretionary'), board.disc, 'its discretionary agrees', 'Funding by PMO');
  near(cellIn(TB.pmo, /^TOTAL/, 'Mandatory'), board.mand, 'its mandatory agrees', 'Funding by PMO');
  near(cellIn(TB.pmo, /^TOTAL/, 'Unfunded'), board.unf, 'its unfunded agrees', 'Funding by PMO');
  near(cellIn(TB.pmo, /^TOTAL/, '★ MC req'), board.mcValue, 'its MC memo agrees', 'Funding by PMO');
  near(cellIn(TB.pmo, /^TOTAL/, '★ MC short'), board.mcShort, 'its MC shortfall agrees', 'Funding by PMO');
  near(cellIn(TB.mc, /TOTAL ★ MISSION CRITICAL/, 'Requirement (must-pay)'), board.mcValue,
    'the MC slide agrees with the PMO slide', 'Mission Critical');
  near(cellIn(TB.mc, /TOTAL ★ MISSION CRITICAL/, 'Short vs Disc'), board.mcShort,
    'and so does its shortfall', 'Mission Critical');
  {
    const row = TB.ufr == null ? null : findRow(deck.tables[TB.ufr], /TOTAL UNFUNDED/);
    const v = row ? dollars((row || []).map(cel).filter(x => /\$/.test(x)).pop()) : null;
    near(v, board.unf, 'the UFR slide agrees with the stream table', 'Unfunded');
  }
  {
    const row = TB.title == null ? null : findRow(deck.tables[TB.title], /Mission Critical total/);
    const v = row ? dollars((row || []).map(cel).filter(x => /\$/.test(x)).pop()) : null;
    near(v, board.mcValue, 'and the title slide agrees with both', 'title slide');
  }
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

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
  const PRODUCTS = ['exportCSV', 'exportCoa', 'exportFlow', 'exportPlans', 'exportReprog', 'exportSrc'];
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

// ══ 12. THE FUNDS FLOW ═════════════════════════════════════════════════════════════════════════
// A plan year is answered from the board's own figures, and the figure has to be the one every
// other surface calls Funded. Measured before the fix on this very fixture: the flow printed
// 29,752,779 against a Funded of 23,300,000 -- the allocation, funded plus 6,452,779 beyond both
// lanes -- and with one requirement allocated at twice its ask it printed 4,875,000 above the total
// requirement. Recorded as a gap on 15 Sep: "the flow's own totals are compared to nothing".
{
  const name = 'the funds flow';
  try {
  const beyond = _sum(Object.keys(F.rows).map(id => _sum(F.rows[id].beyond)));
  chk(name, 'fixture', 'the fixture has dollars beyond both lanes, so the allocation and the draw differ',
    beyond > 0.5 ? 'yes' : 'no', 'yes');
  const flow = JSON.parse(ev(`(function(){ const F=flowCalc(MS.cur);
    return JSON.stringify({kind:flowYearKind(MS.cur), tot:F.tot, us:F.us, grand:F.grand, ip:F.ip, fms:F.fms, appn:F.appn,
      lm:F.prime.LM.v, pw:F.prime.PW.v, primeTot:F.primeTot, ogc:F.ext.v, upl:F.upl.v,
      cats:Object.keys(F.ext.by).map(function(k){ return F.ext.by[k].v; })}); })()`));
  chk(name, 'scope', 'the fixture year is a plan year, answered from the board', flow.kind, 'plan');
  chk(name, 'total', 'US service funding is the funded topline every other surface states', flow.tot, _funded);
  chk(name, 'total', 'every dollar is in exactly one appropriation', _sum(Object.values(flow.appn)), flow.tot);
  chk(name, 'total', 'and is either a prime’s or an other government cost', flow.primeTot + flow.ogc, flow.tot);
  chk(name, 'primes', 'Lockheed Martin is the requirement the LM rule matches', flow.lm, _fundedOf('B'));
  chk(name, 'primes', 'Pratt & Whitney is the requirement the PW rule matches', flow.pw, _fundedOf('D'));
  chk(name, 'primes', 'and the prime total is the two together', flow.primeTot, flow.lm + flow.pw);
  chk(name, 'ogc', 'the other government costs are everything else', flow.ogc, _fundedOf('A') + _fundedOf('C') + _fundedOf('E'));
  chk(name, 'ogc', 'and the categories add back to it', _sum(flow.cats), flow.ogc);
  chk(name, 'grand', 'total funding is US funding plus the other sources typed in', flow.grand, flow.tot + 1000000 + 500000);
  chk(name, 'grand', 'US funding is stated as itself', flow.us, flow.tot);
  // THE WORKBOOK SAYS THE SAME. Labels are read the way a person reads them, by the first cell.
  const got = JSON.parse(await grabX('exportFlow'));
  chk(name, 'workbook', 'the funds-flow workbook builds', got.state, 'ok');
  const sheet = Object.values(got.sheets || {}).find(rs => rs.some(r => (r || [])[0] === 'US SERVICE FUNDING')) || [];
  const cell = (label, col = 1) => { const r = sheet.find(r => String((r || [])[0] ?? '').trim() === label); return r ? num(r[col]) : null; };
  chk(name, 'workbook', 'US SERVICE FUNDING prints the funded topline', cell('US SERVICE FUNDING'), _funded);
  chk(name, 'workbook', 'Prime total prints the primes', cell('Prime total'), flow.primeTot);
  chk(name, 'workbook', 'OGC total prints the other government costs', cell('OGC total'), flow.ogc);
  chk(name, 'workbook', 'Other sources total prints IP + FMS', cell('Other sources total'), 1500000);
  const tf = sheet.filter(r => String((r || [])[0] ?? '').trim() === 'TOTAL FUNDING').map(r => num(r[1])).filter(v => v !== null);
  chk(name, 'workbook', 'TOTAL FUNDING prints the grand total everywhere it appears',
    tf.length && tf.every(v => Math.abs(v - flow.grand) <= 0.005) ? 'yes' : JSON.stringify(tf), 'yes');
  chk(name, 'workbook', 'and the reconciliation block closes: US + other = total',
    cell('US service appropriations') + cell('Other sources'), flow.grand);
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ══ 13. THE CHART OF ACCOUNTS ══════════════════════════════════════════════════════════════════
// The one money column it carries is the requirement, resolved the way applyState resolves it --
// the year's override where one exists. Recorded as a gap on 15 Sep: no comparison against a board
// figure. The override lives in two places. On the board's OWN appropriation applyState has already
// written it into the live item, so the sheet and the board agree by construction (the fixture
// overrides C for the year, and the sheet has to side with the board). In a CONSOLIDATED file the
// other appropriations arrive as shipped payloads with their state alongside, and coaAsk() is the
// only thing that applies that state: a mutation that ignored the override survived every check
// on the own appropriation, because there it changes nothing. So a Full Fund slot is stood up
// here with an override the payload does not carry, at Full Fund's own service count -- four, not
// this board's six -- and one override of the wrong length, which the sheet has to discard.
{
  const name = 'the chart of accounts';
  try {
  const askOf = id => _sum(F.rows[id].ask);
  const askTot = _sum(Object.keys(F.rows).map(askOf));
  const payloadC = _sum(sc.items.find(x => x.id === 'C').ask);
  chk(name, 'fixture', 'C’s ask is overridden this year, so payload and board differ', payloadC !== askOf('C') ? 'yes' : 'no', 'yes');
  const FF = { FF1: [400000, 30000, 20000, 10000], FF2: [250000, 25000, 5000, 5000] };   // as shipped
  const FF1_OVER = [700000, 30000, 20000, 10000];        // Full Fund's length: applies
  const FF2_WRONG = [1, 1, 1, 1, 1, 1];                  // this board's length, not Full Fund's: discarded
  const own = ev('APPN');
  ev(`(function(){ var P=APPNS['FULL FUND']; P.services.length=0; P.items.length=0;
    ['USAF','ANG','AFRC','USN'].forEach(function(s){ P.services.push(s); });
    P.items.push({id:'FF1', grp:'PSM', team:'PSM', sect:'', custom:false, title:'Req FF1', event:'Ev FF1', ccar:'CCFF1', fy26:[0,0,0,0], ask:${JSON.stringify(FF.FF1)}, alloc:null});
    P.items.push({id:'FF2', grp:'ATL', team:'ATL', sect:'', custom:false, title:'Req FF2', event:'Ev FF2', ccar:'CCFF2', fy26:[0,0,0,0], ask:${JSON.stringify(FF.FF2)}, alloc:null});
    var st={years:{}}; st.years[MS.cur]={asks:{FF1:${JSON.stringify(FF1_OVER)}, FF2:${JSON.stringify(FF2_WRONG)}}, order:['FF2','FF1']};
    localStorage.setItem(_SLUGMAP.ff.key, JSON.stringify(st)); return 'ok'; })()`);
  const got = JSON.parse(await grabX('exportCoa'));
  // the slot is cleared again, so nothing after this block sees a second appropriation
  ev(`(function(){ var P=APPNS['FULL FUND']; P.services.length=0; P.items.length=0; localStorage.removeItem(_SLUGMAP.ff.key); return 'ok'; })()`);
  chk(name, 'workbook', 'the chart of accounts builds', got.state, 'ok');
  const FY = ev('FYL()');
  const stand = got.sheets['Where we stand'] || [], chart = got.sheets['Chart of accounts'] || [];
  const hdr = headerRow(stand, 'Appropriation', 'Reqs');
  const cAsk = colOf(stand, hdr, FY + ' Requirement'), cN = colOf(stand, hdr, 'Reqs');
  const apRow = ap => stand.find((r, i) => i > hdr && (r || [])[0] === ap) || [];
  chk(name, 'summary', 'the board’s own appropriation row counts every requirement', num(apRow(own)[cN]), Object.keys(F.rows).length);
  chk(name, 'summary', 'its requirement total is the board’s ask, this year’s override included', num(apRow(own)[cAsk]), askTot);
  const h3 = headerRow(chart, 'Appropriation', 'PMO', 'Requirement');
  const c3 = colOf(chart, h3, FY + ' Requirement');
  // the sheet blanks a repeated appropriation, so the tree is read the way a person reads it
  const byAp = {}; let ap = '';
  chart.slice(h3 + 1).forEach(r => { r = r || []; if (String(r[0] ?? '').trim()) ap = String(r[0]).trim();
    const v = num(r[c3]); if (v !== null) (byAp[ap] ||= []).push({ req: String(r[2] ?? ''), ask: v }); });
  const ownRows = byAp[own] || [], ffRows = byAp['FULL FUND'] || [];
  chk(name, 'chart', 'one row per requirement on the board’s own appropriation', ownRows.length, Object.keys(F.rows).length);
  chk(name, 'chart', 'and the rows add back to its summary', _sum(ownRows.map(r => r.ask)), askTot);
  chk(name, 'chart', 'C’s row carries the overridden ask, not the payload’s',
    ownRows.some(r => Math.abs(r.ask - askOf('C')) <= 0.005) ? 'overridden' : 'payload', 'overridden');
  // the consolidated slot: the payload says one thing, its state another, and the state wins
  const ffAsk = req => (ffRows.find(r => r.req === req) || { ask: null }).ask;
  chk(name, 'consolidated', 'Full Fund’s rows are on the sheet, one per requirement', ffRows.length, 2);
  chk(name, 'consolidated', 'and in the slot’s own order, FF2 first', ffRows.map(r => r.req).join(','), 'Ev FF2,Ev FF1');
  chk(name, 'consolidated', 'FF1 prints the slot’s override, not the shipped ask', ffAsk('Ev FF1'), _sum(FF1_OVER));
  chk(name, 'consolidated', 'FF2’s override is the wrong length for Full Fund and is discarded: the shipped ask', ffAsk('Ev FF2'), _sum(FF.FF2));
  chk(name, 'consolidated', 'the Full Fund summary row counts two requirements', num(apRow('FULL FUND')[cN]), 2);
  chk(name, 'consolidated', 'and its requirement total is the two rows together', num(apRow('FULL FUND')[cAsk]), _sum(FF1_OVER) + _sum(FF.FF2));
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ══ 14. THE REPROGRAMMING LOG ══════════════════════════════════════════════════════════════════
// Every entry states money moving; the log subtotals each type net of deducts and nets it by
// service. Recorded as a gap on 15 Sep: "nothing re-derives those movements". The four seeded
// entries are re-derived here from their own amounts and signs.
{
  const name = 'the reprogramming log';
  try {
  const RP = [{ type: 'BTR', svc: 'USAF', amt: 1.5, dir: 'add' }, { type: 'BTR', svc: 'ANG', amt: 0.5, dir: 'deduct' },
              { type: 'ATR', svc: 'USAF', amt: 2.0, dir: 'add' }, { type: 'ATR', svc: 'STOVL', amt: 0.25, dir: 'deduct' }];
  const net = e => e.amt * (e.dir === 'deduct' ? -1 : 1);
  const netOf = (type, svc) => _sum(RP.filter(e => (!type || e.type === type) && (!svc || e.svc === svc)).map(net));
  const got = JSON.parse(await grabX('exportReprog'));
  chk(name, 'workbook', 'the log builds', got.state, 'ok');
  const sheet = Object.values(got.sheets || {})[0] || [];
  const sub = t => { const r = sheet.find(r => String((r || [])[0] ?? '').startsWith('Subtotal — ' + t)); return r ? num(r[7]) : null; };
  chk(name, 'subtotal', 'BTR net is adds less deducts', sub('BTR'), netOf('BTR'));
  chk(name, 'subtotal', 'ATR net likewise', sub('ATR'), netOf('ATR'));
  const h = headerRow(sheet, 'Service', 'BTR net', 'ATR net', 'Total net');
  const cB = colOf(sheet, h, 'BTR net'), cA = colOf(sheet, h, 'ATR net'), cT = colOf(sheet, h, 'Total net');
  const svcRow = sv => sheet.find((r, i) => i > h && (r || [])[0] === sv) || [];
  ['USAF', 'ANG', 'STOVL'].forEach(sv => {
    chk(name, 'by service', sv + ': BTR net', num(svcRow(sv)[cB]), netOf('BTR', sv));
    chk(name, 'by service', sv + ': ATR net', num(svcRow(sv)[cA]), netOf('ATR', sv));
    chk(name, 'by service', sv + ': total net is the two together', num(svcRow(sv)[cT]), netOf(null, sv));
  });
  chk(name, 'by service', 'a service with no entry nets to zero, not to a neighbour’s figure', num(svcRow('AFRC')[cT]), 0);
  const tot = sheet.find((r, i) => i > h && (r || [])[0] === 'TOTAL') || [];
  chk(name, 'total', 'TOTAL BTR is the BTR subtotal', num(tot[cB]), netOf('BTR'));
  chk(name, 'total', 'TOTAL ATR is the ATR subtotal', num(tot[cA]), netOf('ATR'));
  chk(name, 'total', 'and the grand net is every entry, deducts negative', num(tot[cT]), netOf());
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ══ 15. THE ACE TIE-OUT ════════════════════════════════════════════════════════════════════════
// Board funded per requirement is the lane draw; the estimate is the sum of the lines a requirement
// confirmed; the delta is funded less estimate. The per-PMO sheet reads the estimate from the
// estimate -- never by adding requirement rows, which would double a shared line -- and the board
// from the rows. Recorded as a gap on 15 Sep: "no mutation breaks the tie-out arithmetic". Found
// while building this: a confirmed line under a PMO no office aligns to was counted on the Mapping
// sheet and dropped from the per-PMO sheet, so two sheets of one export disagreed with nothing
// saying why. The sheet now states such lines and keeps them out of its total.
{
  const name = 'the ACE tie-out';
  try {
  const est = { PSM: 9500000, TSS: 1700000, ATL: 4000000, NOBODY: 333000 };
  const got = JSON.parse(await grabX('exportAceTieout'));
  chk(name, 'workbook', 'the tie-out builds against the seeded estimate', got.state, 'ok');
  const map = got.sheets['Mapping by Requirement'] || [], pmo = got.sheets['Reconciliation by PMO'] || [];
  const orphan = got.sheets['Lines Nothing Claims'] || [];
  const hm = headerRow(map, 'FY', 'PMO', 'Board funded', 'Estimate', 'Delta');
  const cF = colOf(map, hm, 'Board funded'), cE = colOf(map, hm, 'Estimate'), cD = colOf(map, hm, 'Delta');
  const cR = colOf(map, hm, 'Requirement (CCaR Record Name)');
  const rowOf = title => map.find((r, i) => i > hm && (r || [])[cR] === title) || [];
  chk(name, 'by requirement', 'A: board funded is the lane draw', num(rowOf('Req A')[cF]), _fundedOf('A'));
  chk(name, 'by requirement', 'A: the estimate is its confirmed line', num(rowOf('Req A')[cE]), est.PSM);
  chk(name, 'by requirement', 'A: delta is funded less estimate', num(rowOf('Req A')[cD]), _fundedOf('A') - est.PSM);
  chk(name, 'by requirement', 'C: delta likewise, negative when the estimate is the larger', num(rowOf('Req C')[cD]), _fundedOf('C') - est.TSS);
  chk(name, 'by requirement', 'B: unconfirmed, so no estimate is stated',
    num(rowOf('Req B')[cE]) === null ? 'blank' : String(rowOf('Req B')[cE]), 'blank');
  const tot = map.find((r, i) => i > hm && (r || [])[0] === 'TOTAL') || [];
  chk(name, 'total', 'board funded totals every requirement, confirmed or not', num(tot[cF]), _funded);
  chk(name, 'total', 'the estimate totals confirmed lines only', num(tot[cE]), est.PSM + est.TSS);
  chk(name, 'total', 'and the delta is the difference', num(tot[cD]), _funded - est.PSM - est.TSS);
  const hp = headerRow(pmo, 'FY', 'PMO', 'Estimate', 'Board funded', 'Delta');
  const pE = colOf(pmo, hp, 'Estimate'), pB = colOf(pmo, hp, 'Board funded'), pD = colOf(pmo, hp, 'Delta');
  const prow = p => pmo.find((r, i) => i > hp && String((r || [])[1] ?? '').split(' ')[0] === p) || [];
  chk(name, 'by PMO', 'PSM: the estimate is its line', num(prow('PSM')[pE]), est.PSM);
  chk(name, 'by PMO', 'PSM: board funded is its requirement', num(prow('PSM')[pB]), _fundedOf('A'));
  chk(name, 'by PMO', 'ATL: an estimate nobody confirmed is still reconciled', num(prow('ATL')[pE]), est.ATL);
  chk(name, 'by PMO', 'ATL: against the office’s funded requirement', num(prow('ATL')[pB]), _fundedOf('B'));
  const ptot = pmo.find((r, i) => i > hp && String((r || [])[0] ?? '').endsWith('TOTAL')) || [];
  chk(name, 'by PMO', 'the FY total estimate is every aligned PMO’s line', num(ptot[pE]), est.PSM + est.TSS + est.ATL);
  chk(name, 'by PMO', 'the FY total board funded is every requirement', num(ptot[pB]), _funded);
  chk(name, 'by PMO', 'and the delta closes', num(ptot[pD]), _funded - (est.PSM + est.TSS + est.ATL));
  // the line no office reports under is stated, not lost, and not added to anybody's total
  const stray = pmo.find((r, i) => i > hp && /^NOBODY/.test(String((r || [])[1] ?? ''))) || [];
  chk(name, 'stray line', 'an estimate PMO no office aligns to is stated on the sheet', num(stray[pE]), est.NOBODY);
  chk(name, 'stray line', 'and says why', /no office on this board reports under it/.test(String(stray[1] ?? '')), true);
  chk(name, 'orphans', 'the WBS lines nothing claims are listed',
    orphan.filter((r, i) => i > 2 && r && r.length && /^FY/.test(String(r[0]))).map(r => String(r[1])).sort().join(','), '7.7,9.9');
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

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
// One source, printed across its window. The working plan's column for the year on screen must be
// the engine -- tiers() and svcAlloc(), the authorities every other surface states, read here off
// boardFigures -- and a second planned year must be the engine under a year swap. A year the source
// never held prints an em dash, never 0, and stays outside the FYDP totals. PMO subtotals are their
// rows added, TOTAL is the subtotals added, By PMO IS the subtotals, By Service adds back to TOTAL
// with the pots beside it, and the panel prints the same total. Then PB is locked and a value
// changes: the locked cycle's report must still print the figure AS LOCKED while the working plan's
// prints the new one. E is moved into PSM for this block so one subtotal spans two rows.
{
  const name = 'the five-year spend plan';
  try {
  const cur = +ev('MS.cur'), key = 'PB|' + cur, fyl = y => 'FY' + (y % 100);
  const snap = ev('JSON.stringify(S)'), base0 = ev('JSON.stringify(MS.base===undefined? null : MS.base)');
  const A1 = [18000000, 4000000, 2000000, 8000000, 3000000, 5000002];      // A next year: doubled, odd dollar kept
  ev(`S.grp['E']='PSM'; applyState(S); MS.years[MS.cur]=S; MS.base=MS.cur+1;
      var y1=JSON.parse(JSON.stringify(S)); y1.asks={A:${JSON.stringify(A1)}}; delete y1.pmoOrder; MS.years[MS.cur+1]=y1; save(); 'ok'`);
  // the engine's reading of a year: the lane draw, the allocation, the per-service unfunded
  const ENGINE = `function(){ var T=tiers(), o={rows:{}, disc:(S.discSvc||[]).slice(), mand:(S.mandSvc||[]).slice()};
      S.order.forEach(function(id){ var it=itemById(id), p=T[id]; if(!it||!p) return;
        var d=SVC.map(function(_,i){ return p.d[i]||0; }), m=SVC.map(function(_,i){ return p.m[i]||0; });
        var fund=d.map(function(v,i){ return v+m[i]; });
        o.rows[id]={title:dispTitle(it), grp:grpOf(it), ask:it.ask.slice(), alloc:((S.fsrc||{})[id]? fund.slice() : svcAlloc(it).slice()), fund:fund, unf:unfSvcOf(it,p)}; });
      return JSON.stringify(o); }`;
  const E0 = JSON.parse(ev(`(${ENGINE})()`)), E1 = JSON.parse(ev(`aceWithYear(MS.cur+1, ${ENGINE})`));
  const ids = Object.keys(F.rows);
  ids.forEach(id => chk(name, 'authority', id + ': the engine read here is boardFigures’ lane draw', _sum(E0.rows[id].fund), _fundedOf(id)));
  chk(name, 'authority', 'next year differs from this year, so a report that reads one year twice cannot pass', _sum(E1.rows.A.ask) !== _sum(E0.rows.A.ask) ? 'yes' : 'no', 'yes');
  chk(name, 'fixture', 'the fixture allocates beyond the lanes somewhere, so Allocated and Funded differ',
    _sum(ids.map(id => _sum(F.rows[id].beyond))) > 0.5 ? 'yes' : 'no', 'yes');
  const y0 = cur, y1 = cur + 1, years = [cur, cur + 1, cur + 2, cur + 3, cur + 4, cur + 5];
  const want = {};   // per requirement: per year and across the FYDP
  ids.forEach(id => {
    const r0 = { ask: _sum(F.rows[id].ask), alloc: _sum(E0.rows[id].alloc), fund: _fundedOf(id), unf: _sum(F.rows[id].unf) };
    const r1 = { ask: _sum(E1.rows[id].ask), alloc: _sum(E1.rows[id].alloc), fund: _sum(E1.rows[id].fund), unf: _sum(E1.rows[id].unf) };
    want[id] = { [y0]: r0, [y1]: r1, fydp: { ask: r0.ask + r1.ask, alloc: r0.alloc + r1.alloc, fund: r0.fund + r1.fund, unf: r0.unf + r1.unf } };
  });
  const K = ['ask', 'alloc', 'fund', 'unf'], KL = { ask: 'Requirement', alloc: 'Allocated', fund: 'Funded', unf: 'Unfunded' };
  const sumOver = (some, y) => { const o = {}; K.forEach(k => { o[k] = _sum(some.map(id => (y === 'fydp' ? want[id].fydp : want[id][y])[k])); }); return o; };
  const groups = {}; ids.forEach(id => { (groups[E0.rows[id].grp] ||= []).push(id); });
  chk(name, 'fixture', 'PSM holds two requirements and the other offices one each', Object.keys(groups).map(g => g + ':' + groups[g].length).sort().join(' '), 'ATL:1 PSM:2 SE:1 TSS:1');
  // ---- the working plan
  ev(`fydpSrc='working'; 'ok'`);
  const W = JSON.parse(await grabX('exportFydpPlan'));
  chk(name, 'workbook', 'the working plan’s workbook builds', W.state, 'ok');
  const br = W.sheets['By Requirement'] || [], bp = W.sheets['By PMO'] || [], bs = W.sheets['By Service'] || [];
  chk(name, 'title', 'the title names the source and the span: the window from the base, plus the year on screen',
    String((br[0] || [])[0] ?? ''), 'ORBIT FYDP SPEND PLAN — THE WORKING PLAN — ' + fyl(cur) + '–' + fyl(cur + 5));
  chk(name, 'title', 'the note says which years are held', /Years held: FY\d\d, FY\d\d\./.test(String((br[1] || [])[0] ?? '')), true);
  const h = headerRow(br, 'PMO', 'Requirement', 'CCaR', 'Band');
  chk(name, 'shape', 'By Requirement has its header', h >= 0 ? 'yes' : 'no', 'yes');
  const col = (rows, hd, y, k) => colOf(rows, hd, (y === 'fydp' ? 'FYDP' : fyl(y)) + ' ' + KL[k]);
  const rowBy = (rows, hd, ci, v) => rows.find((r, i) => i > hd && String((r || [])[ci] ?? '') === v) || [];
  ids.forEach(id => {
    const row = rowBy(br, h, 1, E0.rows[id].title);
    chk(name, id, 'the row is on the sheet under its office', String(row[0] ?? ''), E0.rows[id].grp);
    K.forEach(k => chk(name, id, fyl(y0) + ' ' + KL[k] + ' is the engine’s for the year on screen', num(row[col(br, h, y0, k)]), want[id][y0][k]));
    K.forEach(k => chk(name, id, fyl(y1) + ' ' + KL[k] + ' is the engine’s under the year swap', num(row[col(br, h, y1, k)]), want[id][y1][k]));
    K.forEach(k => chk(name, id, 'FYDP ' + KL[k] + ' is the two held years added', num(row[col(br, h, 'fydp', k)]), want[id].fydp[k]));
    [cur + 2, cur + 5].forEach(y => chk(name, id, fyl(y) + ' is not held, so it prints — not 0', String(row[col(br, h, y, 'ask')] ?? ''), '—'));
  });
  Object.keys(groups).forEach(g => {
    const row = rowBy(br, h, 0, 'Subtotal — ' + g);
    [y0, y1, 'fydp'].forEach(y => K.forEach(k => chk(name, 'subtotal ' + g, (y === 'fydp' ? 'FYDP' : fyl(y)) + ' ' + KL[k] + ' is its rows added', num(row[col(br, h, y, k)]), sumOver(groups[g], y)[k])));
    chk(name, 'subtotal ' + g, 'a year not held prints —', String(row[col(br, h, cur + 3, 'fund')] ?? ''), '—');
  });
  const tot = rowBy(br, h, 0, 'TOTAL');
  [y0, y1, 'fydp'].forEach(y => K.forEach(k => chk(name, 'TOTAL', (y === 'fydp' ? 'FYDP' : fyl(y)) + ' ' + KL[k] + ' is the subtotals added', num(tot[col(br, h, y, k)]), sumOver(ids, y)[k])));
  chk(name, 'TOTAL', 'the year on screen states the funded topline every other surface states', num(tot[col(br, h, y0, 'fund')]), _funded);
  chk(name, 'TOTAL', 'a year not held prints —', String(tot[col(br, h, cur + 4, 'unf')] ?? ''), '—');
  // ---- by PMO: the subtotals, and a count
  const hp = headerRow(bp, 'PMO', 'Requirements');
  Object.keys(groups).forEach(g => {
    const row = rowBy(bp, hp, 0, g);
    chk(name, 'by PMO', g + ' counts its requirements', num(row[colOf(bp, hp, 'Requirements')]), groups[g].length);
    [y0, y1, 'fydp'].forEach(y => K.forEach(k => chk(name, 'by PMO', g + ': ' + (y === 'fydp' ? 'FYDP' : fyl(y)) + ' ' + KL[k] + ' is the subtotal', num(row[col(bp, hp, y, k)]), sumOver(groups[g], y)[k])));
  });
  const ptot = rowBy(bp, hp, 0, 'TOTAL');
  chk(name, 'by PMO', 'TOTAL counts every requirement', num(ptot[colOf(bp, hp, 'Requirements')]), ids.length);
  [y0, y1, 'fydp'].forEach(y => K.forEach(k => chk(name, 'by PMO', 'TOTAL ' + (y === 'fydp' ? 'FYDP' : fyl(y)) + ' ' + KL[k] + ' is By Requirement’s TOTAL', num(ptot[col(bp, hp, y, k)]), sumOver(ids, y)[k])));
  // ---- by service: the vectors added over requirements, the pots beside them
  const hs = headerRow(bs, 'Service', fyl(y0) + ' Requirement', fyl(y0) + ' Disc BA');
  const sv0 = {}, sv1 = {};
  F.svc.forEach((sv, i) => {
    sv0[sv] = { ask: _sum(ids.map(id => F.rows[id].ask[i] || 0)), fund: _sum(ids.map(id => (F.rows[id].d[i] || 0) + (F.rows[id].m[i] || 0))),
                unf: _sum(ids.map(id => F.rows[id].unf[i] || 0)), alloc: _sum(ids.map(id => E0.rows[id].alloc[i] || 0)), disc: F.discBA[i], mand: F.mandBA[i] };
    sv1[sv] = { ask: _sum(ids.map(id => E1.rows[id].ask[i] || 0)), fund: _sum(ids.map(id => E1.rows[id].fund[i] || 0)),
                unf: _sum(ids.map(id => E1.rows[id].unf[i] || 0)), alloc: _sum(ids.map(id => E1.rows[id].alloc[i] || 0)), disc: E1.disc[i] || 0, mand: E1.mand[i] || 0 };
  });
  const KS = { ask: 'Requirement', alloc: 'Allocated', fund: 'Funded', unf: 'Unfunded', disc: 'Disc BA', mand: 'Mand BA' };
  F.svc.forEach(sv => {
    const row = rowBy(bs, hs, 0, sv);
    Object.keys(KS).forEach(k => chk(name, 'by service', sv + ': ' + fyl(y0) + ' ' + KS[k] + ' is the engine’s, this service only', num(row[colOf(bs, hs, fyl(y0) + ' ' + KS[k])]), sv0[sv][k]));
    Object.keys(KS).forEach(k => chk(name, 'by service', sv + ': ' + fyl(y1) + ' ' + KS[k] + ' under the year swap', num(row[colOf(bs, hs, fyl(y1) + ' ' + KS[k])]), sv1[sv][k]));
    chk(name, 'by service', sv + ': FYDP Funded is the held years added', num(row[colOf(bs, hs, 'FYDP Funded')]), sv0[sv].fund + sv1[sv].fund);
    chk(name, 'by service', sv + ': a year not held prints —', String(row[colOf(bs, hs, fyl(cur + 2) + ' Funded')] ?? ''), '—');
  });
  const stot = rowBy(bs, hs, 0, 'TOTAL');
  chk(name, 'by service', 'TOTAL ' + fyl(y0) + ' Funded is the services added, and the funded topline', num(stot[colOf(bs, hs, fyl(y0) + ' Funded')]), _funded);
  chk(name, 'by service', 'TOTAL ' + fyl(y0) + ' Requirement is By Requirement’s TOTAL', num(stot[colOf(bs, hs, fyl(y0) + ' Requirement')]), sumOver(ids, y0).ask);
  chk(name, 'by service', 'TOTAL ' + fyl(y0) + ' Unfunded is By Requirement’s TOTAL', num(stot[colOf(bs, hs, fyl(y0) + ' Unfunded')]), sumOver(ids, y0).unf);
  chk(name, 'by service', 'TOTAL ' + fyl(y0) + ' Disc BA is the discretionary pots added', num(stot[colOf(bs, hs, fyl(y0) + ' Disc BA')]), _sum(F.discBA));
  chk(name, 'by service', 'TOTAL ' + fyl(y0) + ' Mand BA is the mandatory pots added', num(stot[colOf(bs, hs, fyl(y0) + ' Mand BA')]), _sum(F.mandBA));
  chk(name, 'by service', 'TOTAL FYDP Funded is both years’ funded', num(stot[colOf(bs, hs, 'FYDP Funded')]), sumOver(ids, 'fydp').fund);
  // ---- the panel prints the same total, and — for a year not held
  ev(`fydpOpen=true; fydpSrc='working'; fydpAce=''; render(); 'ok'`);   // the estimate column is proved in its own block
  const panel = ev(`document.getElementById('fydpBody').innerHTML`);
  const trow = (/<tr class="tot">([\s\S]*?)<\/tr>/.exec(panel) || [])[1] || '';
  const cells = (trow.match(/<td class="n">([\s\S]*?)<\/td>/g) || []).map(c => c.replace(/<\/?td[^>]*>/g, ''));
  const fm = n => ev(`fM(${n})`);
  chk(name, 'panel', 'the TOTAL row has three cells per window year and three for the FYDP', cells.length, years.length * 3 + 3);
  chk(name, 'panel', 'its ' + fyl(y0) + ' cells are requirement, funded, unfunded', cells.slice(0, 3).join('|'), [fm(sumOver(ids, y0).ask), fm(_funded), fm(sumOver(ids, y0).unf)].join('|'));
  chk(name, 'panel', 'its ' + fyl(y1) + ' cells likewise', cells.slice(3, 6).join('|'), [fm(sumOver(ids, y1).ask), fm(sumOver(ids, y1).fund), fm(sumOver(ids, y1).unf)].join('|'));
  chk(name, 'panel', 'a year not held prints — three times', cells.slice(6, 9).every(c => /—/.test(c)) ? 'yes' : cells.slice(6, 9).join('|'), 'yes');
  chk(name, 'panel', 'its FYDP cells are the two held years added', cells.slice(-3).join('|'), [fm(sumOver(ids, 'fydp').ask), fm(sumOver(ids, 'fydp').fund), fm(sumOver(ids, 'fydp').unf)].join('|'));
  chk(name, 'panel', 'PSM’s line counts its two requirements', /PSM \(2\)/.test(panel), true);
  ev(`fydpOpen=false; render(); 'ok'`);
  // ---- lock PB, then move a value: the locked report keeps the locked figure, the working plan follows the board
  ev(`blCyc='PB'; blYr=MS.cur; cycLock(); 'ok'`);
  chk(name, 'lock', 'PB is locked over both planned years', ev(`cycHeld('${key}').join(',')`), y0 + ',' + y1);
  const bAsk0 = _sum(F.rows.B.ask), bNew = F.rows.B.ask.slice(); bNew[0] += 100000;
  ev(`S.asks['B']=${JSON.stringify(bNew)}; applyState(S); MS.years[MS.cur]=S; save(); 'ok'`);
  const W2 = JSON.parse(await grabX('exportFydpPlan'));
  chk(name, 'after', 'the working plan’s workbook builds again', W2.state, 'ok');
  const br2 = W2.sheets['By Requirement'] || [], h2 = headerRow(br2, 'PMO', 'Requirement', 'CCaR', 'Band');
  chk(name, 'after', 'the working plan is now labelled with its cycle tag', String((br2[0] || [])[0] ?? ''), 'ORBIT FYDP SPEND PLAN — THE WORKING PLAN (' + ev(`blLbl('${key}')`).toUpperCase() + ') — ' + fyl(cur) + '–' + fyl(cur + 5));
  chk(name, 'after', 'and B’s requirement on it moved with the board', num(rowBy(br2, h2, 1, E0.rows.B.title)[col(br2, h2, y0, 'ask')]), bAsk0 + 100000);
  chk(name, 'after', 'so did TOTAL', num(rowBy(br2, h2, 0, 'TOTAL')[col(br2, h2, y0, 'ask')]), sumOver(ids, y0).ask + 100000);
  ev(`fydpSrc='${key}'; 'ok'`);
  const C = JSON.parse(await grabX('exportFydpPlan'));
  chk(name, 'cycle', 'the locked cycle’s workbook builds', C.state, 'ok');
  const bc = C.sheets['By Requirement'] || [], hc = headerRow(bc, 'PMO', 'Requirement', 'CCaR', 'Band');
  chk(name, 'cycle', 'it is titled as the cycle, locked', String((bc[0] || [])[0] ?? ''), 'ORBIT FYDP SPEND PLAN — ' + ev(`blLbl('${key}')`).toUpperCase() + ' (LOCKED) — ' + fyl(cur) + '–' + fyl(cur + 5));
  chk(name, 'cycle', 'the note says when it was locked', /Locked /.test(String((bc[1] || [])[0] ?? '')), true);
  chk(name, 'cycle', 'B’s requirement is the figure AS LOCKED, not the board’s', num(rowBy(bc, hc, 1, E0.rows.B.title)[col(bc, hc, y0, 'ask')]), bAsk0);
  chk(name, 'cycle', 'and TOTAL is the locked total', num(rowBy(bc, hc, 0, 'TOTAL')[col(bc, hc, y0, 'ask')]), sumOver(ids, y0).ask);
  chk(name, 'cycle', 'the locked cycle’s next year is the engine under the swap, as locked', num(rowBy(bc, hc, 1, E0.rows.A.title)[col(bc, hc, y1, 'ask')]), want.A[y1].ask);
  chk(name, 'cycle', 'a year the lock never held prints —', String(rowBy(bc, hc, 0, 'TOTAL')[col(bc, hc, cur + 5, 'fund')] ?? ''), '—');
  // the panel offers the cycle as a source, and picks the working plan again when it is gone
  ev(`fydpOpen=true; render(); 'ok'`);
  chk(name, 'source', 'the panel offers the locked cycle as a source', new RegExp('<option value="' + key.replace('|', '\\|') + '"[^>]*selected').test(ev(`document.getElementById('fydpBody').innerHTML`)), true);
  ev(`fydpOpen=false; blLock('${key}', false); blDelete('${key}'); fydpOpen=true; render(); 'ok'`);
  chk(name, 'source', 'a cycle deleted falls back to the working plan', ev('fydpSrc'), 'working');
  // put the board back: nothing after this block sees a second year, a base, a lock or the moved value
  ev(`fydpOpen=false; MS.cycle=''; MS.cycleRef=''; delete MS.years[MS.cur+1]; MS.base=${base0 === 'null' ? 'undefined' : base0};
      applyState(JSON.parse(${JSON.stringify(snap)})); MS.years[MS.cur]=S; save(); render(); 'ok'`);
  chk(name, 'restore', 'the board is as it was', _sum(JSON.parse(ev(`JSON.stringify(itemById('B').ask)`))), bAsk0);
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
  ev(`cycCmpOpen=false; blCyc='BES'; blYr=MS.cur+1; cycLock(); 'ok'`);
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

// ══ 19. THE PPBE POSITION BESIDE THE PLAN ══════════════════════════════════════════════════════
// The official position logged under the plan's cycle (🏛 PPBE Budget Positions) is printed beside
// the plan on the By Service sheet, by service and year, as it stands -- a lock never copies it,
// because it is the comptroller's figure and not the board's. Re-derived here from the values
// typed in: the position per service and year, the requirement less it, the services added for
// TOTAL, a service or year with nothing logged printed as an em dash and kept out of the FYDP
// position, the same figures on the locked cycle's report after the working plan is retagged, and
// none at all for a working plan with no cycle tag.
{
  const name = 'the PPBE position beside the plan';
  try {
  const cur = +ev('MS.cur'), key = 'PB|' + cur, fyl = y => 'FY' + (y % 100);
  const snap = ev('JSON.stringify(S)'), base0 = ev('JSON.stringify(MS.base===undefined? null : MS.base)'), pp0 = ev('JSON.stringify(MS.ppbe||{})');
  try {
  const A1 = [18000000, 4000000, 2000000, 8000000, 3000000, 5000002];
  ev(`MS.years[MS.cur]=S; MS.base=MS.cur+1;
      var y1=JSON.parse(JSON.stringify(S)); y1.asks={A:${JSON.stringify(A1)}}; delete y1.pmoOrder; MS.years[MS.cur+1]=y1; save(); 'ok'`);
  // the position, typed the way the panel types it: dollars per service and year, discretionary and mandatory
  ev(`ppCyc='PB'; ppYr=MS.cur;
      ppSetV('USAF','_all',MS.cur,'d','1000000'); ppSetV('USAF','_all',MS.cur,'m','200000');
      ppSetV('ANG','_all',MS.cur,'d','300000'); ppSetV('USAF','_all',MS.cur+1,'d','1500000');
      MS.cycle='${key}'; save(); 'ok'`);
  const POS = { [cur]: { USAF: 1200000, ANG: 300000 }, [cur + 1]: { USAF: 1500000 } };
  chk(name, 'fixture', 'the position is logged under the working plan’s tag', ev(`JSON.stringify(Object.keys(MS.ppbe))`) + ' ' + ev('MS.cycle'), JSON.stringify([key]) + ' ' + key);
  chk(name, 'fixture', 'and reads back per service and year', ev(`ppSvcFy(MS.ppbe['${key}'],'USAF',MS.cur).t+':'+ppSvcFy(MS.ppbe['${key}'],'ANG',MS.cur).t+':'+ppSvcFy(MS.ppbe['${key}'],'USAF',MS.cur+1).t`), '1200000:300000:1500000');
  const askSv = { [cur]: {}, [cur + 1]: {} };
  F.svc.forEach((sv, i) => { askSv[cur][sv] = _sum(Object.keys(F.rows).map(id => F.rows[id].ask[i] || 0)); });
  const asks1 = JSON.parse(ev(`aceWithYear(MS.cur+1, function(){ return JSON.stringify(S.order.map(function(id){ return itemById(id).ask; })); })`));
  F.svc.forEach((sv, i) => { askSv[cur + 1][sv] = _sum(asks1.map(a => a[i] || 0)); });
  const posOf = (y, sv) => (POS[y] || {})[sv] === undefined ? null : POS[y][sv];
  const cellOf = (row, h, sheet, y, what) => { const c = colOf(sheet, h, (y === 'fydp' ? 'FYDP' : fyl(y)) + ' ' + what); return c < 0 ? undefined : row[c]; };
  const readSheet = async (label) => {
    const W = JSON.parse(await grabX('exportFydpPlan'));
    chk(name, label, 'the workbook builds', W.state, 'ok');
    const bs = W.sheets['By Service'] || [], hs = headerRow(bs, 'Service', fyl(cur) + ' PPBE position', fyl(cur) + ' Requirement − position');
    chk(name, label, 'By Service carries the position columns', hs >= 0 ? 'yes' : 'no', 'yes');
    return { bs, hs, note: String((bs[1] || [])[0] ?? ''), row: sv => bs.find((r, i) => i > hs && String((r || [])[0] ?? '') === sv) || [] };
  };
  // ---- the working plan, tagged PB
  ev(`fydpSrc='working'; 'ok'`);
  const W = await readSheet('working');
  chk(name, 'working', 'the note names the cycle the position is read under', /logged under PB\d\d/.test(W.note), true);
  F.svc.forEach(sv => {
    const row = W.row(sv);
    [cur, cur + 1].forEach(y => {
      const p = posOf(y, sv);
      chk(name, sv, fyl(y) + ' PPBE position is what was typed, or — when nothing was', p === null ? String(cellOf(row, W.hs, W.bs, y, 'PPBE position') ?? '') : num(cellOf(row, W.hs, W.bs, y, 'PPBE position')), p === null ? '—' : p);
      chk(name, sv, fyl(y) + ' Requirement − position is the plan’s requirement less it, or —', p === null ? String(cellOf(row, W.hs, W.bs, y, 'Requirement − position') ?? '') : num(cellOf(row, W.hs, W.bs, y, 'Requirement − position')), p === null ? '—' : askSv[y][sv] - p);
    });
    chk(name, sv, fyl(cur + 2) + ' is not held, so the position prints —', String(cellOf(row, W.hs, W.bs, cur + 2, 'PPBE position') ?? ''), '—');
    const both = posOf(cur, sv) !== null && posOf(cur + 1, sv) !== null;
    chk(name, sv, 'the FYDP position is printed only when every held year logs one', both ? num(cellOf(row, W.hs, W.bs, 'fydp', 'PPBE position')) : String(cellOf(row, W.hs, W.bs, 'fydp', 'PPBE position') ?? ''), both ? posOf(cur, sv) + posOf(cur + 1, sv) : '—');
    if (both) chk(name, sv, 'and the FYDP gap is the two years’ requirement less the two positions', num(cellOf(row, W.hs, W.bs, 'fydp', 'Requirement − position')), askSv[cur][sv] + askSv[cur + 1][sv] - posOf(cur, sv) - posOf(cur + 1, sv));
  });
  const tot = W.row('TOTAL');
  const totAsk = y => _sum(F.svc.map(sv => askSv[y][sv]));
  chk(name, 'TOTAL', fyl(cur) + ' position is the services that log one, added', num(cellOf(tot, W.hs, W.bs, cur, 'PPBE position')), 1500000);
  chk(name, 'TOTAL', fyl(cur) + ' Requirement − position follows', num(cellOf(tot, W.hs, W.bs, cur, 'Requirement − position')), totAsk(cur) - 1500000);
  chk(name, 'TOTAL', fyl(cur + 1) + ' position likewise', num(cellOf(tot, W.hs, W.bs, cur + 1, 'PPBE position')), 1500000);
  chk(name, 'TOTAL', 'the FYDP position is both years’', num(cellOf(tot, W.hs, W.bs, 'fydp', 'PPBE position')), 3000000);
  chk(name, 'TOTAL', 'and the FYDP gap is the requirement over both years less it', num(cellOf(tot, W.hs, W.bs, 'fydp', 'Requirement − position')), totAsk(cur) + totAsk(cur + 1) - 3000000);
  // ---- the panel
  ev(`fydpOpen=true; render(); 'ok'`);
  const panel = ev(`document.getElementById('fydpBody').innerHTML`);
  const fm = n => ev(`fM(${n})`);
  chk(name, 'panel', 'the panel names the cycle and prints the position per held year', /PPBE position <b>PB\d\d<\/b> beside the plan/.test(panel) && panel.indexOf(fyl(cur) + ' ' + fm(1500000)) >= 0 && panel.indexOf(fyl(cur + 1) + ' ' + fm(1500000)) >= 0, true);
  chk(name, 'panel', 'and the requirement less it', panel.indexOf('requirement − position ' + ev(`cycSgn(${totAsk(cur) - 1500000})`)) >= 0, true);
  ev(`fydpOpen=false; render(); 'ok'`);
  // ---- lock PB, retag the working plan BES: the locked report keeps PB’s position, the working plan has none to print
  ev(`blCyc='PB'; blYr=MS.cur; cycLock(); MS.cycle='BES|'+(MS.cur+1); save(); fydpSrc='${key}'; 'ok'`);
  const L = await readSheet('locked');
  chk(name, 'locked', 'PB’s report reads PB’s position whatever the working plan is tagged', num(cellOf(L.row('USAF'), L.hs, L.bs, cur, 'PPBE position')) + ':' + num(cellOf(L.row('TOTAL'), L.hs, L.bs, cur, 'PPBE position')), '1200000:1500000');
  chk(name, 'locked', 'and says so', /logged under PB\d\d/.test(L.note), true);
  ev(`fydpSrc='working'; 'ok'`);
  const B = await readSheet('retagged');
  chk(name, 'retagged', 'the working plan, tagged BES with no position logged, prints —', String(cellOf(B.row('USAF'), B.hs, B.bs, cur, 'PPBE position') ?? '') + ':' + String(cellOf(B.row('TOTAL'), B.hs, B.bs, cur, 'PPBE position') ?? ''), '—:—');
  chk(name, 'retagged', 'and names BES', /logged under BES\d\d/.test(B.note), true);
  ev(`MS.cycle=''; save(); 'ok'`);
  const U = await readSheet('untagged');
  chk(name, 'untagged', 'with no cycle tag there is no position to read, and the note says why', String(cellOf(U.row('USAF'), U.hs, U.bs, cur, 'PPBE position') ?? '') + ' ' + (/none is set/.test(U.note)), '— true');
  ev(`fydpOpen=true; render(); 'ok'`);
  chk(name, 'untagged', 'the panel says so too', /No cycle tag on the working plan/.test(ev(`document.getElementById('fydpBody').innerHTML`)), true);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  } finally {
    try {
      ev(`fydpOpen=false; fydpSrc='working'; if(blGet('${key}')){ blLock('${key}', false); blDelete('${key}'); }
          MS.ppbe=JSON.parse(${JSON.stringify(pp0)}); MS.cycle=''; MS.cycleRef=''; delete MS.years[MS.cur+1]; MS.base=${base0 === 'null' ? 'undefined' : base0};
          applyState(JSON.parse(${JSON.stringify(snap)})); MS.years[MS.cur]=S; save(); render(); 'ok'`);
    } catch (e) { failures.push({ scenario: name, where: 'harness', what: 'the restore threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' }); }
    chk(name, 'restore', 'the board is as it was', ev(`S.order.join(',')`) + ' ' + ev(`blList().length`) + ' ' + ev(`Object.keys(MS.ppbe||{}).length`), 'A,B,C,D,E 0 0');
  }
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

// ══ 20. THE COST ESTIMATE BESIDE THE PLAN ═════════════════════════════════════════════════════
// The chosen estimate's lines for this appropriation, printed beside the plan per year on every
// sheet and on the panel: by requirement only what it confirmed in the tie-out (blank otherwise,
// and never a child line swept in by a prefix), by PMO the estimate's own PMO through the
// alignment, with two board PMOs that share one printed once and named on the other, by service
// the line's own service, and the appropriation on TOTAL -- never another appropriation's lines,
// never a year the estimate does not carry as 0, and every figure printed for a year the plan does
// not hold. Re-derived here from the lines seeded. 'none' prints no column. A locked cycle's report
// reads the estimate live, as it stands.
{
  const name = 'the cost estimate beside the plan';
  const cur = +ev('MS.cur'), key = 'PB|' + cur, fyl = y => 'FY' + (y % 100), AK = '2027ACE';
  const snap = ev('JSON.stringify(S)'), base0 = ev('JSON.stringify(MS.base===undefined? null : MS.base)');
  try {
  const M = 1000000;
  const L = [ { ap: 'om', pmo: 'PSM', svc: 'USAF', wbs: '1.1',   v: { [cur]: 9.5 * M, [cur + 1]: 9.7 * M } },
              { ap: 'om', pmo: 'PSM', svc: 'ANG',  wbs: '1.1.1', v: { [cur]: 0.25 * M } },                    // a child of A's line: never A's
              { ap: 'om', pmo: 'TSS', svc: 'USAF', wbs: '2.2',   v: { [cur]: 1.7 * M, [cur + 2]: 1.8 * M } },  // a year the plan does not hold
              { ap: 'om', pmo: 'ATL', svc: 'STOVL', wbs: '9.9',  v: { [cur]: 4 * M, [cur + 1]: 4.1 * M } },
              { ap: 'om', pmo: 'LOG', svc: 'USN',  wbs: '5.5',   v: { [cur]: 0.6 * M } },
              { ap: 'sp', pmo: 'PSM', svc: 'USAF', wbs: '1.1',   v: { [cur]: 77 * M } } ];                     // another appropriation
  const A1 = [18000000, 4000000, 2000000, 8000000, 3000000, 5000002];
  ev(`MS.years[MS.cur]=S; MS.base=MS.cur+1;
      var y1=JSON.parse(JSON.stringify(S)); y1.asks={A:${JSON.stringify(A1)}}; delete y1.pmoOrder; MS.years[MS.cur+1]=y1;
      ACEDB.sets[${JSON.stringify(AK)}]={lines:${JSON.stringify(L).replace(/"ap":"om"/g, '"ap":mySlug()')}, locked:true};
      if(!MS.aceAlign) MS.aceAlign={}; MS.aceAlign[${JSON.stringify(AK)}]={SE:'LOG'};
      S.aceMap['B']={w:['9.9'], ok:false}; save(); fydpAce=${JSON.stringify(AK)}; fydpSrc='working'; 'ok'`);
  chk(name, 'fixture', 'the set is the latest and chosen; A and C confirmed, B suggested only', ev(`fydpAceKey()+' '+aceIsConfirmed('A')+' '+aceIsConfirmed('C')+' '+aceIsConfirmed('B')`), AK + ' true true false');
  const own = ev('mySlug()');
  const sum = (pick, y) => { const vs = L.filter(l => l.ap === own && pick(l)).map(l => l.v[y]).filter(v => v !== undefined); return vs.length ? vs.reduce((a, b) => a + b, 0) : null; };
  const W = JSON.parse(await grabX('exportFydpPlan'));
  chk(name, 'workbook', 'the workbook builds with the estimate', W.state, 'ok');
  const br = W.sheets['By Requirement'] || [], bp = W.sheets['By PMO'] || [], bs = W.sheets['By Service'] || [];
  const hr = headerRow(br, 'PMO', 'Requirement', 'CCaR', fyl(cur) + ' ACE estimate');
  chk(name, 'shape', 'By Requirement carries the estimate column', hr >= 0 ? 'yes' : 'no', 'yes');
  const rd = (rows, h, ci, v) => rows.find((r, i) => i > h && String((r || [])[ci] ?? '') === v) || [];
  const est = (row, rows, h, y) => { const c = colOf(rows, h, (y === 'fydp' ? 'FYDP' : fyl(y)) + ' ACE estimate'); return c < 0 ? undefined : row[c]; };
  const asNum = v => num(v), asTxt = v => String(v ?? '');
  const title = id => ev(`dispTitle(itemById('${id}'))`);
  // by requirement: confirmed lines only, that year's own state, never a child swept in
  chk(name, 'A', fyl(cur) + ' is its confirmed line, not the child beneath it', asNum(est(rd(br, hr, 1, title('A')), br, hr, cur)), 9.5 * M);
  chk(name, 'A', fyl(cur + 1) + ' is the line’s next-year figure', asNum(est(rd(br, hr, 1, title('A')), br, hr, cur + 1)), 9.7 * M);
  chk(name, 'A', 'the FYDP estimate is the years the line carries, added', asNum(est(rd(br, hr, 1, title('A')), br, hr, 'fydp')), 19.2 * M);
  chk(name, 'B', 'a suggested but unconfirmed mapping prints —', asTxt(est(rd(br, hr, 1, title('B')), br, hr, cur)), '—');
  chk(name, 'C', fyl(cur) + ' is its confirmed line', asNum(est(rd(br, hr, 1, title('C')), br, hr, cur)), 1.7 * M);
  chk(name, 'C', fyl(cur + 2) + ' prints — on the row: the plan holds no state for that year to confirm anything', asTxt(est(rd(br, hr, 1, title('C')), br, hr, cur + 2)), '—');
  chk(name, 'D', 'a requirement with no mapping prints —', asTxt(est(rd(br, hr, 1, title('D')), br, hr, cur)), '—');
  // subtotals and TOTAL read the estimate's own PMO and appropriation, not the rows
  chk(name, 'subtotal', 'PSM is both PSM lines, more than its confirmed row', asNum(est(rd(br, hr, 0, 'Subtotal — PSM'), br, hr, cur)), sum(l => l.pmo === 'PSM', cur));
  chk(name, 'subtotal', 'TSS ' + fyl(cur + 2) + ' prints the estimate for a year the plan does not hold', asNum(est(rd(br, hr, 0, 'Subtotal — TSS'), br, hr, cur + 2)), 1.8 * M);
  chk(name, 'subtotal', 'a year the estimate does not carry prints —', asTxt(est(rd(br, hr, 0, 'Subtotal — TSS'), br, hr, cur + 1)), '—');
  chk(name, 'TOTAL', fyl(cur) + ' is this appropriation’s lines, and no other’s', asNum(est(rd(br, hr, 0, 'TOTAL'), br, hr, cur)), sum(() => true, cur));
  chk(name, 'TOTAL', fyl(cur + 1) + ' likewise', asNum(est(rd(br, hr, 0, 'TOTAL'), br, hr, cur + 1)), sum(() => true, cur + 1));
  chk(name, 'TOTAL', 'the FYDP estimate adds every window year the estimate carries', asNum(est(rd(br, hr, 0, 'TOTAL'), br, hr, 'fydp')), sum(() => true, cur) + sum(() => true, cur + 1) + sum(() => true, cur + 2));
  // by PMO: the alignment, and one figure for two board PMOs that share an estimate PMO
  const hp = headerRow(bp, 'PMO', 'Requirements', fyl(cur) + ' ACE estimate');
  chk(name, 'by PMO', 'PSM reads its estimate PMO', asNum(est(rd(bp, hp, 0, 'PSM'), bp, hp, cur)), sum(l => l.pmo === 'PSM', cur));
  chk(name, 'by PMO', 'ATL likewise', asNum(est(rd(bp, hp, 0, 'ATL'), bp, hp, cur)), 4 * M);
  const se = est(rd(bp, hp, 0, 'SE'), bp, hp, cur), lg = est(rd(bp, hp, 0, 'LOG'), bp, hp, cur);
  chk(name, 'by PMO', 'SE is aligned to LOG’s estimate: one prints the figure, the other names it', [se, lg].map(v => typeof v === 'number' ? 'n' : asTxt(v)).sort().join(' | '), '(with LOG) | n'.split(' | ').sort().join(' | ') === [se, lg].map(v => typeof v === 'number' ? 'n' : asTxt(v)).sort().join(' | ') ? [se, lg].map(v => typeof v === 'number' ? 'n' : asTxt(v)).sort().join(' | ') : '(with SE) | n');
  chk(name, 'by PMO', 'and the figure printed is LOG’s line', (typeof se === 'number' ? se : lg), 0.6 * M);
  chk(name, 'by PMO', 'TOTAL is the appropriation, shared PMOs counted once', asNum(est(rd(bp, hp, 0, 'TOTAL'), bp, hp, cur)), sum(() => true, cur));
  // by service: the line's own service
  const hs = headerRow(bs, 'Service', fyl(cur) + ' ACE estimate');
  chk(name, 'by service', 'USAF is the USAF lines', asNum(est(rd(bs, hs, 0, 'USAF'), bs, hs, cur)), sum(l => l.svc === 'USAF', cur));
  chk(name, 'by service', 'ANG is the child line alone', asNum(est(rd(bs, hs, 0, 'ANG'), bs, hs, cur)), 0.25 * M);
  chk(name, 'by service', 'a service with no line prints —', asTxt(est(rd(bs, hs, 0, 'AFRC'), bs, hs, cur)), '—');
  chk(name, 'by service', 'USAF ' + fyl(cur + 1), asNum(est(rd(bs, hs, 0, 'USAF'), bs, hs, cur + 1)), 9.7 * M);
  chk(name, 'by service', 'TOTAL is the services added, and the appropriation', asNum(est(rd(bs, hs, 0, 'TOTAL'), bs, hs, cur)), sum(() => true, cur));
  chk(name, 'by service', 'the FYDP estimate on TOTAL', asNum(est(rd(bs, hs, 0, 'TOTAL'), bs, hs, 'fydp')), sum(() => true, cur) + sum(() => true, cur + 1) + sum(() => true, cur + 2));
  chk(name, 'note', 'the note names the estimate', new RegExp('ACE estimate: ' + AK).test(String((br[1] || [])[0] ?? '')), true);
  // the panel
  ev(`fydpOpen=true; render(); 'ok'`);
  const panel = ev(`document.getElementById('fydpBody').innerHTML`);
  const trow = (/<tr class="tot">([\s\S]*?)<\/tr>/.exec(panel) || [])[1] || '';
  const cells = (trow.match(/<td class="n">([\s\S]*?)<\/td>/g) || []).map(c => c.replace(/<\/?td[^>]*>/g, ''));
  const fm = n => ev(`fM(${n})`);
  chk(name, 'panel', 'the picker offers the estimate and shows it chosen', new RegExp('<option value="' + AK + '" selected').test(panel), true);
  chk(name, 'panel', 'the TOTAL row has four cells per window year and four for the FYDP', cells.length, 6 * 4 + 4);
  chk(name, 'panel', 'its ' + fyl(cur) + ' estimate cell is the appropriation’s', cells[3], fm(sum(() => true, cur)));
  chk(name, 'panel', 'a year the plan does not hold still shows the estimate beside three dashes', cells.slice(8, 12).map(c => /—/.test(c) ? '—' : c).join('|'), '—|—|—|' + fm(1.8 * M));
  chk(name, 'panel', 'the FYDP estimate cell', cells[cells.length - 1], fm(sum(() => true, cur) + sum(() => true, cur + 1) + sum(() => true, cur + 2)));
  ev(`fydpOpen=false; render(); 'ok'`);
  // none chosen: no column anywhere
  ev(`fydpAce=''; 'ok'`);
  const W0 = JSON.parse(await grabX('exportFydpPlan'));
  chk(name, 'none', 'with none chosen no sheet carries an estimate column', ['By Requirement', 'By PMO', 'By Service'].map(n => (W0.sheets[n] || []).some(r => (r || []).some(c => /ACE estimate/.test(String(c ?? ''))))).join(','), 'false,false,false');
  chk(name, 'none', 'and the note says so', /No cost estimate is selected/.test(String(((W0.sheets['By Requirement'] || [])[1] || [])[0] ?? '')), true);
  ev(`fydpOpen=true; render(); 'ok'`);
  chk(name, 'none', 'the panel is back to three cells per year', ((/<tr class="tot">([\s\S]*?)<\/tr>/.exec(ev(`document.getElementById('fydpBody').innerHTML`)) || [])[1] || '').match(/<td class="n">/g).length, 6 * 3 + 3);
  ev(`fydpOpen=false; fydpAce=${JSON.stringify(AK)}; 'ok'`);
  // a locked cycle's report reads the estimate live, from the locked year's own mapping
  ev(`blCyc='PB'; blYr=MS.cur; cycLock(); fydpSrc='${key}'; 'ok'`);
  const WL = JSON.parse(await grabX('exportFydpPlan'));
  const bl = WL.sheets['By Requirement'] || [], hl = headerRow(bl, 'PMO', 'Requirement', 'CCaR', fyl(cur) + ' ACE estimate');
  chk(name, 'locked', 'A’s confirmed line on the locked cycle’s report', asNum(est(rd(bl, hl, 1, title('A')), bl, hl, cur)), 9.5 * M);
  chk(name, 'locked', 'and TOTAL', asNum(est(rd(bl, hl, 0, 'TOTAL'), bl, hl, cur)), sum(() => true, cur));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  } finally {
    try {
      ev(`fydpOpen=false; fydpSrc='working'; fydpAce=null; if(blGet('${key}')){ blLock('${key}', false); blDelete('${key}'); }
          delete ACEDB.sets[${JSON.stringify(AK)}]; if(MS.aceAlign) delete MS.aceAlign[${JSON.stringify(AK)}];
          MS.cycle=''; MS.cycleRef=''; delete MS.years[MS.cur+1]; MS.base=${base0 === 'null' ? 'undefined' : base0};
          applyState(JSON.parse(${JSON.stringify(snap)})); MS.years[MS.cur]=S; save(); render(); 'ok'`);
    } catch (e) { failures.push({ scenario: name, where: 'harness', what: 'the restore threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' }); }
    chk(name, 'restore', 'the board is as it was', ev(`S.order.join(',')`) + ' ' + ev(`blList().length`) + ' ' + ev(`aceSetKeys().join(',')`), 'A,B,C,D,E 0 2026ACE');
  }
}

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
    ACEDB.sets={}; ACEDB.sets['2026ACE']={lines:[{ap:mySlug(), pmo:'AV', wbs:'1.1', v:{}}]};
    ACEDB.sets['2026ACE'].lines[0].v[MS.cur]=111; ACEDB.sets['2026ACE'].lines[0].v[MS.cur+1]=222; ACEDB.sets['2026ACE'].lines[0].v[MS.cur+2]=333;
    if(!S.aceMap) S.aceMap={}; S.aceMap['MOVE']={w:['1.1'], ok:true}; save(); 'ok'`);
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
  // the workbook, as its sheets
  const book = src => JSON.parse(bev(`(function(){ fydpSrc=${J(src)}; fydpAce=null; var got=null, _b=buildXlsx;
      buildXlsx=function(sh){ got=JSON.stringify(sh); return new Uint8Array(0); };
      try{ exportFydpPlan(); }catch(e){ got=JSON.stringify({threw:String((e&&e.message)||e)}); }
      buildXlsx=_b; return got||'null'; })()`));
  const cv = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c;
  const sheet = (S, n) => ((S || []).find(s => s.name === n) || { rows: [] }).rows.map(r => (r || []).map(cv));
  const hdrOf = (rows, a, b) => rows.findIndex(r => r[0] === a && r[1] === b);
  const at = (rows, h, k) => rows[h].indexOf(k);
  const W = book('working');
  const bp = sheet(W, 'By PMO'), hp = hdrOf(bp, 'PMO', 'Requirements');
  const line = (rows, h, lbl) => rows.slice(h + 1).find(r => r[0] === lbl) || [];
  const pmoFig = (rows, h, g) => { const r = line(rows, h, g); return Y.map(y => K.map(k => r[at(rows, h, fyl(y) + ' ' + KL[k])])); };
  const wantFig = g => Y.map(y => K.map(k => (want[g][y] || { ask: 0, alloc: 0, fund: 0, unf: 0 })[k]));
  chk(name, 'By PMO', 'each PMO, each year: Requirement, Allocated, Funded and Unfunded are that year’s projection for that PMO',
    J(['AV', 'TSS'].map(g => pmoFig(bp, hp, g))), J(['AV', 'TSS'].map(wantFig)));
  chk(name, 'By PMO', 'a requirement that changed PMO counts under each PMO that held it; TOTAL counts each requirement once',
    J(['AV', 'TSS', 'TOTAL'].map(g => line(bp, hp, g)[1])), J([4, 2, 5]));
  // CONTROL (passes on v1.94 too: the totals are what they were) -- TOTAL is every requirement, every year
  const all = Y.map(y => K.map(k => s2(P[y].reqs.map(r => fig(r)[k]))));
  chk(name, 'control', 'CONTROL — TOTAL, each year, is every requirement of that year’s projection (passes on v1.94: totals unchanged)',
    J(pmoFig(bp, hp, 'TOTAL')), J(all));
  // By Requirement: MOVE under AV with FY27 and FY29, under TSS with FY28; the estimate it confirmed beside the year it is in
  const br = sheet(W, 'By Requirement'), hr = hdrOf(br, 'PMO', 'Requirement');
  const moveRows = br.slice(hr + 1).filter(r => r[1] === 'Ev MOVE').map(r => [r[0]].concat(Y.map(y => [r[at(br, hr, fyl(y) + ' Allocated')], r[at(br, hr, fyl(y) + ' ACE estimate')]])));
  const mv = y => fig(P[y].reqs.filter(r => r.id === 'MOVE')[0]).alloc;
  chk(name, 'By Requirement', 'MOVE is listed under AV for FY27 and FY29 and under TSS for FY28, its estimate on the row of the year it is in',
    J(moveRows), J([['AV', [mv(cur), 111], ['—', '—'], [mv(cur + 2), 333]], ['TSS', ['—', '—'], [mv(cur + 1), 222], ['—', '—']]]));
  // the PMO tabs: this appropriation's block total, each year, is that PMO's year
  const tabTot = g => { const rows = sheet(W, g); const h = rows.findIndex(r => r[0] === 'CCaR record'); const t = rows.find(r => /^Total — /.test(String(r[0] || ''))) || [];
    return h < 0 ? null : Y.map(y => [t[at(rows, h, fyl(y) + ' Requirement')], t[at(rows, h, fyl(y) + ' Allocation')]]); };
  chk(name, 'PMO tabs', 'the AV and TSS tabs file each year under the PMO that year assigns',
    J(['AV', 'TSS'].map(tabTot)), J(['AV', 'TSS'].map(g => Y.map(y => [(want[g][y] || {}).ask ?? 0, (want[g][y] || {}).alloc ?? 0]))));
  // the panel on screen counts and adds the same way
  bev(`fydpOpen=true; fydpSrc='working'; fydpAce=''; render(); 'ok'`);
  const panel = bev(`document.getElementById('fydpBody').textContent`);
  chk(name, 'panel', 'the five-year plan on screen lists AV (4) and TSS (2)', /AV \(4\)/.test(panel) && /TSS \(2\)/.test(panel), true);
  bev(`fydpOpen=false; render(); 'ok'`);
  // and a cycle locked from this plan: its By PMO is its own PMO roll-up, as locked, to the dollar
  bev(`blCyc='PB'; blYr=MS.cur; blNote=''; cycLock(); 'ok'`);
  const key = 'PB|' + cur;
  const lockRoll = JSON.parse(bev(`JSON.stringify([${Y.join(',')}].map(function(y){ var p=cycProj(${J(key)}, y).pmo;
      return ['AV','TSS'].map(function(g){ var x=p[g]||{}; var s=function(a){ return (a||[]).reduce(function(t,v){ return t+v; },0); }; return [s(x.ask), s(x.alloc), s(x.fund)]; }); }))`));
  const C = book(key);
  const bc = sheet(C, 'By PMO'), hc = hdrOf(bc, 'PMO', 'Requirements');
  chk(name, 'the lock', 'the locked cycle’s By PMO is the cycle’s own PMO roll-up, each year, to the dollar',
    J(Y.map(y => ['AV', 'TSS'].map(g => { const r = line(bc, hc, g); return ['ask', 'alloc', 'fund'].map(k => r[at(bc, hc, fyl(y) + ' ' + KL[k])]); }))), J(lockRoll));
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
  bev(`blCyc='BES'; blYr=${cur + 1}; blNote=''; cycLock(); 'ok'`);
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
  const name = 'W6 — the priority drill, the deck and the synopsis: every requirement, service and lane';
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
  // ---- the deck: the stream table service by service, both lanes and both pots; the PMO and unfunded slides line by line
  {
    X.ev(`globalThis.__w6t=[]; if(!globalThis.__w6oT) globalThis.__w6oT=_pTbl; if(!globalThis.__w6oB) globalThis.__w6oB=buildPptx;
      _pTbl=function(){ var a=arguments; globalThis.__w6t.push(a[a.length-1]); return ''; }; buildPptx=function(){ return new Uint8Array(0); };
      try{ exportPPT(); } finally { _pTbl=globalThis.__w6oT; buildPptx=globalThis.__w6oB; } 'ok'`);
    const tables = JSON.parse(X.ev('JSON.stringify(globalThis.__w6t)'));
    const ct = c => String((c && typeof c === 'object') ? (c.t ?? c.v ?? '') : (c ?? '')).trim();
    const fSM = v => X.ev(`fSM(${v})`), show = v => v > 0.5 ? fSM(v) : '—';
    const tbl = pred => tables.find(t => { try { return pred((t || []).map(r => (r || []).map(ct))); } catch { return false; } }) || [];
    const at = (t, k) => ((t[0] || []).map(ct)).indexOf(k);
    const st = tbl(t => t[0][0] === 'Service' && t[0].includes('Disc Funded'));
    const sk = { [FY + ' Ask']: svcSum(() => true, 'ask'), 'Disc BA': G.discBA, 'Disc Funded': svcSum(() => true, 'd'), 'Mand BA': G.mandBA,
      'Mand Drawn': svcSum(() => true, 'm'), 'Unf vs DISC': svcSum(() => true, 'du'), 'TOTAL Unf': svcSum(() => true, 'unf') };
    SV.forEach((sv, i) => { const row = st.find(r => ct(r[0]) === sv) || [];
      Object.keys(sk).forEach(k => chk(name, 'deck · Funding by Stream · ' + sv, k, ct(row[at(st, k)]), fSM(sk[k][i]))); });
    const pt = tbl(t => t[0][0] === 'PMO' && t[0].includes('★ MC req'));
    grps.forEach(g => { const row = pt.find(r => ct(r[0]) === g) || [], mem = ids.filter(id => R[id].grp === g);
      [[FY + ' Ask', w6S(mem.map(id => R[id].askT)), fSM], ['Discretionary', w6S(mem.map(id => R[id].dT)), fSM], ['Mandatory', w6S(mem.map(id => R[id].mT)), fSM],
       ['Unfunded', w6S(mem.map(id => R[id].unfT)), show], ['★ MC req', w6S(mem.filter(id => R[id].mc).map(id => R[id].askT)), show],
       ['★ MC short', w6S(mem.filter(id => R[id].mc).map(id => R[id].duT)), show]]
        .forEach(([k, want, f]) => chk(name, 'deck · Funding by PMO · ' + g, k, ct(row[at(pt, k)]), f(want))); });
    const ut = tbl(t => t.some(r => /^TOTAL UNFUNDED/.test(r[2] || '')));
    const listed = ut.filter(r => ids.some(id => R[id].ev === ct(r[2])));
    chk(name, 'deck · Unfunded', 'lists every requirement still short, and only those', listed.map(r => ids.find(id => R[id].ev === ct(r[2]))).sort().join(','),
      ids.filter(id => R[id].unfT > 0.005).sort().join(','));
    listed.forEach(r => { const id = ids.find(x => R[x].ev === ct(r[2]));
      chk(name, 'deck · Unfunded · ' + id, FY + ' Ask', ct(r[at(ut, FY + ' Ask')]), fSM(R[id].askT));
      chk(name, 'deck · Unfunded · ' + id, 'Unfunded', ct(r[at(ut, 'Unfunded')]), fSM(R[id].unfT)); });
  }
  // ---- the Executive Funding Synopsis, read off the CSV it writes
  {
    X.ev(`globalThis.__w6csv=''; var oB=Blob; Blob=function(p){ globalThis.__w6csv=String((p&&p[0])||''); return new oB(p); };
      try{ execSynopsis(); } finally { Blob=oB; } 'ok'`);
    const csv = X.ev('globalThis.__w6csv').replace(/^﻿/, '').split('\r\n').map(line => { const out = []; let cur = '', q = false;
      for (let k = 0; k < line.length; k++) { const c = line[k];
        if (q) { if (c === '"') { if (line[k + 1] === '"') { cur += '"'; k++; } else q = false; } else cur += c; }
        else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c; }
      out.push(cur); return out; });
    const nums = r => (r || []).map(x => String(x).trim() === '' ? null : Number(x));
    const after = re => csv.findIndex(r => re.test(String(r[0] || '')));
    const dN = ids.filter(id => R[id].dT > 0.005), fN = ids.filter(id => R[id].fT > 0.005), uN = ids.filter(id => R[id].unfT > 0.005);
    const d = svcSum(() => true, 'd'), m = svcSum(() => true, 'm'), f = svcSum(() => true, 'f');
    const line = (lab) => csv.find(r => String(r[0] || '').trim() === lab || String(r[1] || '').trim() === lab) || [];
    chk(name, 'synopsis', 'budget authority: discretionary, mandatory, whole', [line('Discretionary Budget Authority')[2], line('Mandatory Budget Authority')[2], line('Whole Budget')[2]].map(Number).join('|'),
      [w6S(G.discBA), w6S(G.mandBA), w6S(G.discBA) + w6S(G.mandBA)].join('|'));
    const s1 = after(/^1 — FUNDED WITH DISCRETIONARY /);
    chk(name, 'synopsis · discretionary', 'requirements touched, the total, and each service', JSON.stringify(nums(csv[s1 + 2]).slice(1)), JSON.stringify([dN.length, w6S(d), ...d]));
    chk(name, 'synopsis · discretionary', 'remaining across the lanes', Number(line('Discretionary remaining across lanes')[2]), w6S(G.discBA.map((b, i) => Math.max(0, b - d[i]))));
    const s2 = after(/^2 — FUNDED WITH DISCRETIONARY \+ MANDATORY/);
    chk(name, 'synopsis · both lanes', 'requirements funded, the total, and each service', JSON.stringify(nums(csv[s2 + 2]).slice(1)), JSON.stringify([fN.length, w6S(f), ...f]));
    chk(name, 'synopsis · mandatory', 'drawn from mandatory, the total and each service', JSON.stringify(nums(csv[s2 + 3]).slice(2)), JSON.stringify([w6S(m), ...m]));
    chk(name, 'synopsis · mandatory', 'remaining across the lanes', Number(line('Mandatory remaining across lanes')[2]), w6S(G.mandBA.map((b, i) => Math.max(0, b - m[i]))));
    const mc = ids.filter(id => R[id].mc), mcAsk = svcSum(id => R[id].mc, 'ask'), mcDu = svcSum(id => R[id].mc, 'du');
    const mr = csv.find(r => String(r[1] || '').trim() === '★ MC requirements') || [];
    chk(name, 'synopsis · mission critical', 'count, value and each service', JSON.stringify([Number(mr[2]), ...nums(mr).slice(5)]), JSON.stringify([mc.length, w6S(mcAsk), ...mcAsk]));
    const sr = csv.find(r => /short of the discretionary lane/.test(String(r[1] || ''))) || [];
    chk(name, 'synopsis · mission critical', 'short of discretionary, the total and each service', JSON.stringify(nums(sr).slice(5)), JSON.stringify([w6S(mcDu), ...mcDu]));
    chk(name, 'synopsis · mission critical', 'PROGRAM FLOOR', Number((csv.find(r => /PROGRAM FLOOR/.test(String(r[1] || ''))) || [])[3]), w6S(G.discBA) + w6S(mcDu));
    const hi = csv.findIndex(r => String(r[1] || '') === 'Rank' && String(r[3] || '') === 'Requirement');
    const items = csv.slice(hi + 1).filter(r => /^\d+$/.test(String(r[1] || '').trim()));
    chk(name, 'synopsis · mission critical', 'a line for every starred requirement still short', items.map(r => ids.find(id => R[id].rank === +r[1])).sort().join(','),
      mc.filter(id => R[id].duT > 0.005).sort().join(','));
    items.forEach(r => { const id = ids.find(x => R[x].rank === +r[1]);
      chk(name, 'synopsis · mission critical · ' + id, 'PMO, value, short and each service', JSON.stringify([r[2], ...nums(r).slice(4)]), JSON.stringify([R[id].grp, R[id].askT, R[id].duT, ...R[id].du])); });
    const ur = csv.find(r => String(r[1] || '').trim() === 'Requirements with unfunded portions') || [];
    chk(name, 'synopsis · unfunded', 'count and total, floored per service', Number(ur[2]) + '|' + Number(ur[5]), uN.length + '|' + w6S(ids.map(id => R[id].unfT)));
  }
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

// ══ W6.4 THE FUNDS FLOW — every appropriation, and every requirement and service on its detail sheets ═════
await (async () => {
  const name = 'W6 — the funds flow: every appropriation, requirement and service, and another plan year';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const X = w6Fresh(), G = boardFigures(X.ev), meta = w6Meta(X.ev);
  const { R, ids } = w6Truth(G, meta), SV = G.svc;
  const own = X.ev('mySlug()'), slugs = JSON.parse(X.ev('JSON.stringify(APPN_SLUGS)')), lbl = JSON.parse(X.ev('JSON.stringify(APPN_LBL)'));
  const funded = w6S(ids.map(id => R[id].fT));
  const F = JSON.parse(X.ev(`JSON.stringify(flowCalc(MS.cur).appn)`));
  chk(name, 'appropriation', 'the board’s own appropriation carries every funded dollar, the others none (no execution imported)',
    JSON.stringify(slugs.map(s => F[s])), JSON.stringify(slugs.map(s => s === own ? funded : 0)));
  const wb = JSON.parse(await w6Book(X.w, 'exportFlow'));
  chk(name, 'workbook', 'the funds flow builds and reads back', wb.__err || 'ok', 'ok');
  const ff = Object.values(wb).find(rs => (rs || []).some(r => w6Lbl(r) === 'US SERVICE FUNDING')) || [];
  const ha = ff.findIndex(r => w6Lbl(r) === 'Appropriation' && String((r || [])[1] ?? '') === 'Amount');
  slugs.forEach(s => chk(name, 'workbook · by appropriation', lbl[s], num((ff.find((r, j) => j > ha && w6Lbl(r) === lbl[s]) || [])[1]), s === own ? funded : 0));
  // the detail: one line per requirement per service that carries money, on exactly one of the two lists
  const lines = rows => (rows || []).slice(1).filter(r => r && w6Lbl(r)).map(r => ({ t: String(r[0]), ap: String(r[2]), pmo: String(r[3]), sv: String(r[4]), v: num(r[5]) }));
  const key = l => l.t + '|' + l.sv;
  const want = {}; ids.forEach(id => SV.forEach((sv, i) => { if (R[id].f[i] > 0) want[R[id].title + '|' + sv] = { id, v: R[id].f[i], pmo: R[id].grp }; }));
  const P = lines(wb['Prime Detail']), O = lines(wb['OGC Detail']);
  chk(name, 'detail', 'every requirement-and-service line is on Prime Detail or OGC Detail, once', P.concat(O).map(key).sort().join(','), Object.keys(want).sort().join(','));
  P.concat(O).forEach(l => { const w = want[key(l)]; if (!w) return;
    chk(name, 'detail · ' + w.id + ' · ' + l.sv, 'amount, appropriation and office', [l.v, l.ap, l.pmo].join('|'), [w.v, lbl[own], w.pmo].join('|')); });
  chk(name, 'detail', 'the primes are the lines of B and D, the requirements the LM and PW rules name', [...new Set(P.map(l => want[key(l)] && want[key(l)].id))].sort().join(','), 'B,D');
  const cats = Object.keys(wb).filter(k => !['Funds Flow', 'Prime Detail', 'OGC Detail'].includes(k));
  chk(name, 'detail', 'each OGC line sits on exactly one category sheet', cats.reduce((a, k) => a.concat(lines(wb[k])), []).map(key).sort().join(','), O.map(key).sort().join(','));
  // ANOTHER PLAN YEAR is answered from THAT year's own state: next year A asks twice as much; the flow for it is the
  // lane walk of next year, requirement by requirement, and this year's flow does not move
  const A1 = [18000000, 4000000, 2000000, 8000000, 3000000, 5000002];
  X.ev(`MS.years[MS.cur]=S; var y1=JSON.parse(JSON.stringify(S)); y1.asks=Object.assign({}, y1.asks||{}, {A:${JSON.stringify(A1)}}); delete y1.pmoOrder; MS.years[MS.cur+1]=y1; save(); 'ok'`);
  const E1 = JSON.parse(X.ev(`aceWithYear(MS.cur+1, function(){ var T=tiers(), o={}; S.order.forEach(function(id){ var p=T[id]; o[id]=SVC.map(function(_,i){ return (p.d[i]||0)+(p.m[i]||0); }); }); return JSON.stringify(o); })`));
  const f1 = w6S(Object.values(E1).map(w6S));
  chk(name, 'next year', 'the fixture: the lanes bind, so next year funds the same total but A takes more of it',
    (f1 === funded) + ' ' + (w6S(E1.A) > R.A.fT) + ' ' + ids.some(id => id !== 'A' && w6S(E1[id]) < R[id].fT), 'true true true');
  chk(name, 'next year', 'flowCalc for next year is next year’s lane walk, and this year’s is unchanged',
    X.ev(`flowCalc(MS.cur+1).tot+'|'+flowCalc(MS.cur+1).appn[mySlug()]+'|'+flowCalc(MS.cur).tot`), [f1, f1, funded].join('|'));
  X.ev(`flowCfg().fys=[MS.cur+1]; flowCfg().aps=null; 'ok'`);   // v1.99 (item 92): the export writes the panel's selection
  const wb1 = JSON.parse(await w6Book(X.w, 'exportFlow'));
  X.ev(`flowCfg().fys=null; 'ok'`);
  const ff1 = Object.values(wb1).find(rs => (rs || []).some(r => w6Lbl(r) === 'US SERVICE FUNDING')) || [];
  chk(name, 'next year · workbook', 'US SERVICE FUNDING is next year’s funded topline', num((ff1.find(r => w6Lbl(r) === 'US SERVICE FUNDING') || [])[1]), f1);
  const want1 = {}; ids.forEach(id => SV.forEach((sv, i) => { if (E1[id][i] > 0) want1[R[id].title + '|' + sv] = E1[id][i]; }));
  const L1 = lines(wb1['Prime Detail']).concat(lines(wb1['OGC Detail']));
  chk(name, 'next year · workbook', 'every requirement-and-service line, at next year’s figure', JSON.stringify(L1.map(l => [key(l), l.v]).sort()), JSON.stringify(Object.keys(want1).map(k => [k, want1[k]]).sort()));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm); await settleBoards();
})();

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

// ══ W7.1 F1 — THE $M AND $K FILES: the Two-Plan Forecast month by month and plan by plan, the ATR/BTR log, the 1A9A ═══
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
    var E=rpAll(); E.length=0;
    E.push({id:'RP1', ts:1, ap:mySlug(), fy:MS.cur, type:'BTR', svc:0, appn:'', pec:'', bpac:'', title:'W7 odd add', amtM:1.2345, dir:'add', pool:'disc', status:'Pending', remarks:''});
    E.push({id:'RP2', ts:2, ap:mySlug(), fy:MS.cur, type:'BTR', svc:0, appn:'', pec:'', bpac:'', title:'W7 odd deduct', amtM:0.000101, dir:'deduct', pool:'disc', status:'Pending', remarks:''});
    E.push({id:'RP3', ts:3, ap:mySlug(), fy:MS.cur, type:'ATR', svc:1, appn:'', pec:'', bpac:'', title:'W7 odd ATR', amtM:2.718281, dir:'add', pool:'mand', status:'Pending', remarks:''});
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
  // THE ATR/BTR LOG keeps what was typed ($M), and its nets are made from it
  const rp = JSON.parse(await w6Book(X.w, 'exportReprog')), lg = rp['ATR-BTR Log'] || [];
  chk(name, 'ATR/BTR log', 'the log builds and reads back', rp.__err || (lg.length ? 'ok' : 'no ATR-BTR Log sheet'), 'ok');
  const typed = { 'W7 odd add': 1234500, 'W7 odd deduct': 101, 'W7 odd ATR': 2718281 };
  Object.keys(typed).forEach(t => chk(name, 'ATR/BTR log · ' + t, 'Total ($M), in dollars', num((lg.find(r => String((r || [])[7] ?? '') === t) || [])[8]) * 1e6, typed[t]));
  const sub = t => num((lg.find(r => w6Lbl(r) === 'Subtotal — ' + t + ' (net $M)') || [])[7]) * 1e6;
  chk(name, 'ATR/BTR log', 'the BTR subtotal (net), in dollars', sub('BTR'), 1234500 - 101);
  chk(name, 'ATR/BTR log', 'the ATR subtotal (net), in dollars', sub('ATR'), 2718281);
  const net = { STOVL: [1234500 - 101, 0], 'USMC-C': [0, 2718281], USN: [0, 0] };
  const sh = lg.findIndex(r => w6Lbl(r) === 'Service' && String((r || [])[1] ?? '') === 'BTR net');
  SVx.forEach(sv => { const row = lg.find((r, j) => j > sh && w6Lbl(r) === sv) || [];
    chk(name, 'ATR/BTR log · net by service · ' + sv, 'BTR net, ATR net, total net, in dollars', [row[1], row[2], row[3]].map(v => Math.round(num(v) * 1e6 * 100) / 100).join('|'),
      [net[sv][0], net[sv][1], net[sv][0] + net[sv][1]].join('|')); });
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
  const SHOW = { [FY + ' Two-Plan Forecast']: '#,##0.00', 'ATR-BTR Log': '#,##0.00', 'O&M,N': '"$"#,##0.0' };
  [['exportExcel', FY + ' Two-Plan Forecast'], ['exportReprog', 'ATR-BTR Log'], ['crExport', 'O&M,N']].forEach(([fn, sn]) => {
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
  // undated line is its UNSCHEDULED), the deck's spend plan by pot, and the CR half-month windows
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
  const SP = JSON.parse(X.ev('JSON.stringify(spendPlanByMonth())'));
  ['disc', 'mand'].forEach(ln => {
    const mine = l => l.key.endsWith('|' + ln);
    chk(name, 'spend plan by pot · ' + ln, 'each month, and what is undated, is the lane’s lines',
      JSON.stringify(M.map(k => w7S(got.filter(l => mine(l) && l.dt !== AUG31 && l.dt.slice(0, 7) === k).map(l => l.amt))).concat([w7S(got.filter(l => mine(l) && l.dt === AUG31).map(l => l.amt))])),
      JSON.stringify((ln === 'disc' ? SP.d : SP.m).concat([ln === 'disc' ? SP.ud : SP.um])));
  });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm); await settleBoards();
})();

// ══ W7.4 F3 — THE EXECUTIVE SYNOPSIS is titled and named for the year on screen, and carries that year's money ═══════
await (async () => {
  const name = 'W7 — F3: the Executive Synopsis is titled and named for the year on screen';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  // Everything is funded (the pots are wide), so each year's funded money is its asks: FY27 [350, 120], FY28 [570, 190]
  const SVx = ['USAF', 'ANG'];
  const X = boot();
  seed(X.ev, { services: SVx, items: [it('A', 'PSM', [300, 100]), it('B', 'ATL', [50, 20])], disc: [5000, 5000], mand: [0, 0], order: ['A', 'B'] });
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); MS.years[MS.cur]=S;
    var y=JSON.parse(JSON.stringify(S)); y.asks=Object.assign({}, y.asks||{}, {A:[500,150], B:[70,40]}); MS.years[MS.cur+1]=y; save(); 'ok'`);
  const synopsis = () => JSON.parse(X.ev(`(function(){ var csv='', dl=''; var oB=Blob, oc=HTMLAnchorElement.prototype.click;
    Blob=function(p){ csv=String((p&&p[0])||''); return new oB(p); }; HTMLAnchorElement.prototype.click=function(){ dl=this.download||''; };
    try{ execSynopsis(); } finally { Blob=oB; HTMLAnchorElement.prototype.click=oc; }
    return JSON.stringify({csv:csv, dl:dl, fy:FYL()}); })()`));
  const read = s => { const rows = s.csv.replace(/^﻿/, '').split('\r\n').map(l => l.split(',').map(c => c.replace(/^"|"$/g, '')));
    const at = rows.findIndex(r => /^2 — FUNDED WITH DISCRETIONARY \+ MANDATORY/.test(r[0] || ''));
    return { head: rows[0][0], funded: (rows[at + 2] || []).slice(1).map(Number) }; };
  const s27 = synopsis();
  X.ev(`switchYear(MS.cur+1); 'ok'`);
  const s28 = synopsis();
  chk(name, 'fixture', 'the year on screen moved to FY28', s27.fy + ' ' + s28.fy, 'FY27 FY28');
  [[s27, 'FY27', [2, 470, 350, 120]], [s28, 'FY28', [2, 760, 570, 190]]].forEach(([s, fy, money]) => {
    const r = read(s);
    chk(name, fy, 'its first line names the year on screen', r.head, fy + ' EXECUTIVE FUNDING SYNOPSIS');
    chk(name, fy, 'and so does its file name', s.dl.startsWith(fy + ' Exec Funding Synopsis '), true);
    chk(name, fy, 'control: the money is that year’s -- requirements funded, the total and each service', JSON.stringify(r.funded), JSON.stringify(money));
  });
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
// The ATR/BTR log is shared by all four appropriations. Every expectation below is worked out HERE from the fixture's
// own rows and lists -- each row's service from its own appropriation's list, each amount in whole dollars, deducts
// negative -- and the export is read back from its bytes and held to it to the dollar. Nothing asks the board.
// SUITE_CHECKS=<file> records every check of these blocks with its verdict (as audit-import does), for fail-before runs.
import { appendFileSync as _w5Append } from 'node:fs';
const w5Chk = (scenario, where, what, got, want) => {
  if (process.env.SUITE_CHECKS) _w5Append(process.env.SUITE_CHECKS, JSON.stringify([scenario, where, what, String(got) === String(want), String(got).slice(0, 300)]) + '\n');
  chk(scenario, where, String(what), String(got), String(want));
};
// A $M cell as dollars, EXACTLY: a whole D is printed as D/1e6, and anything else is not whole dollars.
const w5Dol = v => { if (typeof v !== 'number' || !isFinite(v)) return 'not a figure: ' + JSON.stringify(v);
  const d = Math.round(v * 1e6); return d / 1e6 === v ? d : 'not whole dollars: ' + v; };
// Whole dollars as a person types them in $M, by string arithmetic: 250001 is 0.250001
const w5Typed = d => { const s = String(Math.abs(d)).padStart(7, '0'); return (d < 0 ? '-' : '') + s.slice(0, -6) + '.' + s.slice(-6); };
const w5Sum = a => a.reduce((x, y) => x + y, 0);
// One export of the log under a filter, read back from its bytes: each type's rows under its own header (by column
// name), each type's subtotal, the summary's lines and TOTAL, and the line naming what is to check.
const w5Read = async (W, ap, fy) => {
  W.eval(`rpAp=${JSON.stringify(ap)}; rpFy=${JSON.stringify(fy)}; 'ok'`);
  const bk = JSON.parse(await w6Book(W, 'exportReprog'));
  const lg = bk['ATR-BTR Log'] || [];
  const out = { err: bk.__err || (lg.length ? '' : 'no ATR-BTR Log sheet'), rows: { BTR: [], ATR: [] }, sub: {}, sum: [], total: null, note: '' };
  let type = null, hdr = null, inSum = false;
  lg.forEach(r => {
    const l = String((r || [])[0] ?? '').trim();
    const m = /^(BTR|ATR)s\s+\(\d+\)$/.exec(l); if (m) { type = m[1]; hdr = null; return; }
    if (type && l === 'Appropriation') { hdr = r.map(c => String(c ?? '').trim()); return; }
    const s = /^Subtotal — (BTR|ATR) \(net \$M\)$/.exec(l);
    if (s) { out.sub[s[1]] = r[7]; type = null; hdr = null; return; }             // the subtotal sits where it always has
    if (type && hdr) { if (l) { const o = {}; hdr.forEach((h, j) => { o[h] = r[j]; }); out.rows[type].push(o); } return; }
    if (l === 'Service' && String((r || [])[1] ?? '') === 'BTR net') { inSum = true; return; }
    if (inSum && l === 'TOTAL') { out.total = [r[1], r[2], r[3]]; inSum = false; return; }
    if (inSum && l) { out.sum.push([l, r[1], r[2], r[3]]); return; }
    if (/^⚠ \d+ entr/.test(l)) out.note = l;
  });
  return out;
};
// What the Check column says of a row, reduced to the claim: '' (nothing to check), 'position N', 'unresolved', 'fraction'
const w5Mark = t => { t = String(t ?? ''); const out = [];
  if (/unresolved/i.test(t)) out.push('unresolved'); else { const p = /position (\d+) of/.exec(t); if (p) out.push('position ' + p[1]); }
  if (/not a whole number of dollars/i.test(t)) out.push('fraction');
  return out.join(' + '); };

// THE FIXTURE. Four appropriations, four different service lists -- the board's own (O&M), Full Fund's in the file's
// slot (PUBS), Initial Spares' in this browser's stored board (with the file's slot naming other services, which must not
// be read: the browser's copy is what that board opens with), and OPN, a board with no data pack that keeps its own list.
// The same position names different services in each: position 2 is ANG on O&M, USAF on Full Fund, ANG on Spares.
const W5L = { 'O&M': ['USAF', 'ANG', 'AFRC'], 'FULL FUND': ['USN', 'USAF', 'STOVL', 'ANG'], 'INITIAL SPARES': ['CV', 'ANG', 'USAF'], 'OPN': ['USCG', 'USAF'] };
const W5AP = ['O&M', 'FULL FUND', 'INITIAL SPARES', 'OPN'];
// Every row a different whole-dollar amount; three fiscal years; both types; deducts and adds. `pick` is chosen in the
// picker (the real path); `idx` is a row an older version wrote, holding only a position; neither is a row with none.
const W5ROWS = [
  { id: 'W5-OM-1', ap: 'O&M', fy: 2027, type: 'BTR', dir: 'add', pick: 'ANG', d: 1500000 },
  { id: 'W5-OM-2', ap: 'O&M', fy: 2026, type: 'ATR', dir: 'deduct', idx: 2, d: 250001 },
  { id: 'W5-OM-3', ap: 'O&M', fy: 2025, type: 'BTR', dir: 'deduct', idx: 0, d: 2222222 },
  { id: 'W5-FF-1', ap: 'FULL FUND', fy: 2027, type: 'BTR', dir: 'add', idx: 1, d: 1000000 },
  { id: 'W5-FF-2', ap: 'FULL FUND', fy: 2025, type: 'ATR', dir: 'add', pick: 'STOVL', d: 3333333 },
  { id: 'W5-FF-3', ap: 'FULL FUND', fy: 2027, type: 'BTR', dir: 'deduct', idx: 3, d: 777777 },
  { id: 'W5-FF-4', ap: 'FULL FUND', fy: 2026, type: 'BTR', dir: 'add', idx: 9, d: 123457 },
  { id: 'W5-FF-5', ap: 'FULL FUND', fy: 2027, type: 'ATR', dir: 'deduct', pick: 'USN', d: 1010101 },
  { id: 'W5-SP-1', ap: 'INITIAL SPARES', fy: 2027, type: 'ATR', dir: 'deduct', idx: 0, d: 4200001 },
  { id: 'W5-SP-2', ap: 'INITIAL SPARES', fy: 2026, type: 'BTR', dir: 'add', pick: 'USAF', d: 98765 },
  { id: 'W5-OPN-1', ap: 'OPN', fy: 2025, type: 'BTR', dir: 'add', idx: 1, d: 5000003 },
  { id: 'W5-OPN-2', ap: 'OPN', fy: 2027, type: 'ATR', dir: 'add', d: 64000 },
];
const w5Svc = e => e.pick || ((Number.isInteger(e.idx) && e.idx < W5L[e.ap].length) ? W5L[e.ap][e.idx] : 'Unresolved');
const w5Want = e => e.pick ? '' : (w5Svc(e) === 'Unresolved' ? 'unresolved' : 'position ' + (e.idx + 1));
const w5Net = es => w5Sum(es.map(e => e.dir === 'deduct' ? -e.d : e.d));
const w5Board = () => {
  const X = boot();
  seed(X.ev, { services: W5L['O&M'], items: [it('A', 'PSM', [300, 200, 100])], disc: [600, 400, 200], mand: [0, 0, 0], order: ['A'] });
  X.ev(`PUBS.ff={ts:5, years:{}, dataPack:{services:${JSON.stringify(W5L['FULL FUND'])}, items:[{id:'F1', ask:[1,2,3,4]}], budget:[]}};
    PUBS.sp={ts:9, years:{}, dataPack:{services:['ZZA','ZZB','ZZC'], items:[{id:'S0', ask:[1,1,1]}], budget:[]}};
    localStorage.setItem(_SLUGMAP.sp.key, JSON.stringify({ts:3, years:{}, dataPack:{services:${JSON.stringify(W5L['INITIAL SPARES'])}, items:[{id:'S1', ask:[1,2,3]}], budget:[]}}));
    PUBS.opn={ts:2, years:{}, svc:${JSON.stringify(W5L['OPN'])}};
    var E=rpAll(); E.length=0;
    ${JSON.stringify(W5ROWS)}.forEach(function(e,k){
      var r={id:e.id, ts:k+1, ap:e.ap, fy:e.fy, type:e.type, appn:'', pec:'', bpac:'', title:e.id, amtM:0, dir:e.dir, pool:'disc', status:'Pending', remarks:''};
      if(e.idx!==undefined) r.svc=e.idx;
      E.push(r); });
    'ok'`);
  // the picked services and every amount go in the way a person puts them in: the picker, and the $M field, typed
  W5ROWS.forEach(e => {
    if (e.pick) X.ev(`rpSetField(${JSON.stringify(e.id)}, 'svc', ${JSON.stringify(e.pick)}); 'ok'`);
    X.ev(`rpSetField(${JSON.stringify(e.id)}, 'amtM', ${JSON.stringify(w5Typed(e.d))}); 'ok'`);
  });
  return X;
};

// ══ v1.97 W5.1 — THE LOG BY APPROPRIATION, YEAR AND SERVICE, ALL AND FILTERED, TO THE DOLLAR (items 81, 62) ═══════════
await (async () => {
  const name = 'v1.97 W5 — the ATR/BTR log by appropriation, fiscal year and service, all and filtered, to the dollar';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  // CONTROL: the fixture can catch a swap -- every appropriation, year, service and type nets to its own figure
  const nets = [...W5AP.map(a => w5Net(W5ROWS.filter(e => e.ap === a))), ...[2025, 2026, 2027].map(y => w5Net(W5ROWS.filter(e => e.fy === y))),
    ...[...new Set(W5ROWS.map(w5Svc))].map(s => w5Net(W5ROWS.filter(e => w5Svc(e) === s))), ...['BTR', 'ATR'].map(t => w5Net(W5ROWS.filter(e => e.type === t)))];
  w5Chk(name, 'fixture', 'control: every appropriation, year, service and type nets to a figure no other has', new Set(nets).size, nets.length);
  const X = w5Board();
  const SCOPES = [['ALL', 'ALL'], ['FULL FUND', 'ALL'], ['ALL', 2027], ['INITIAL SPARES', 'ALL'], ['OPN', 'ALL'], ['FULL FUND', 2026], ['ALL', 2025], ['O&M', 'ALL']];
  for (const [ap, fy] of SCOPES) {
    const at = ap + ' × ' + (fy === 'ALL' ? 'all years' : 'FY' + (fy % 100));
    const es = W5ROWS.filter(e => (ap === 'ALL' || e.ap === ap) && (fy === 'ALL' || e.fy === fy));
    const g = await w5Read(X.w, ap, fy);
    w5Chk(name, at, 'control: the log builds and reads back', g.err || 'ok', 'ok');
    // THE DETAIL: every entry of this scope and no other, in its type's table, with its own appropriation and year, the
    // service its own appropriation's list names, its dollars, its direction, and what is to check about it
    const det = t => es.filter(e => e.type === t).map(e => [e.id, e.ap, 'FY' + (e.fy % 100), w5Svc(e), e.d, e.dir === 'deduct' ? 'Deduct' : 'Add', w5Want(e)]);
    const got = t => g.rows[t].map(o => [o['Requirement Short Title'], o['Appropriation'], o['FY'], o['Service'], w5Dol(o['Total ($M)']), o['Add/Deduct'], w5Mark(o['Check'])]);
    w5Chk(name, at + ' · detail', 'every entry in its type’s table, with its appropriation, year, its own appropriation’s service, dollars, direction and what is to check',
      JSON.stringify({ BTR: got('BTR'), ATR: got('ATR') }), JSON.stringify({ BTR: det('BTR'), ATR: det('ATR') }));
    // THE SUMMARY: a line for every service of the appropriations in scope, from their own lists, to the dollar
    const bT = w5Net(es.filter(e => e.type === 'BTR')), aT = w5Net(es.filter(e => e.type === 'ATR'));
    const lines = []; (ap === 'ALL' ? W5AP : [ap]).forEach(a => W5L[a].forEach(n => { if (!lines.includes(n)) lines.push(n); }));
    if (es.some(e => w5Svc(e) === 'Unresolved')) lines.push('Unresolved');
    const wantSum = lines.map(n => { const s = es.filter(e => w5Svc(e) === n);
      return [n, w5Net(s.filter(e => e.type === 'BTR')), w5Net(s.filter(e => e.type === 'ATR')), w5Net(s)]; });
    w5Chk(name, at + ' · summary', 'a line for every service of the appropriations in scope, each from its own list, Unresolved last when any; BTR | ATR | total, to the dollar',
      JSON.stringify(g.sum.map(r => [r[0], w5Dol(r[1]), w5Dol(r[2]), w5Dol(r[3])])), JSON.stringify(wantSum));
    // DETAIL NET EQUALS SUMMARY NET, EXACTLY: each subtotal and TOTAL to the dollar, the subtotal the very figure TOTAL
    // prints, and the summary's lines adding to it
    const T = g.total || [], lineD = k => w5Sum(g.sum.map(r => { const v = w5Dol(r[k]); return typeof v === 'number' ? v : NaN; }));
    w5Chk(name, at + ' · detail = summary', 'subtotals BTR | ATR and TOTAL BTR | ATR | net to the dollar; each subtotal is TOTAL’s own figure; the lines add to TOTAL',
      JSON.stringify([w5Dol(g.sub.BTR), w5Dol(g.sub.ATR), w5Dol(T[0]), w5Dol(T[1]), w5Dol(T[2]), g.sub.BTR === T[0], g.sub.ATR === T[1], lineD(1), lineD(2), lineD(3)]),
      JSON.stringify([bT, aT, bT, aT, bT + aT, true, true, bT, aT, bT + aT]));
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();

// ══ v1.97 W5.2 — THE REVIEW'S CASE: a Full Fund row on an O&M board whose file holds no Full Fund list (R10) ══════════
await (async () => {
  const name = 'v1.97 W5 — a row whose service cannot be read is Unresolved, and still counted (R10)';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  // Reproduced on v1.96: a $1M FULL FUND row at position 2, exported from an O&M board with one service, printed no
  // service, and the summary by service totalled $0 while the detail held $1M.
  const X = boot();
  seed(X.ev, { services: ['USAF'], items: [it('A', 'PSM', [1])], disc: [0], mand: [0], order: ['A'] });
  X.ev(`RPDB.entries=[{id:'RP1', ts:1, ap:'FULL FUND', fy:2027, type:'BTR', svc:1, title:'R10 row', amtM:1, dir:'add', pool:'disc', status:'Pending'}]; 'ok'`);
  const g = await w5Read(X.w, 'ALL', 'ALL');
  const r = g.rows.BTR[0] || {};
  w5Chk(name, 'detail', 'the row prints Unresolved, not a blank, and its Check says why', [r['Service'], w5Mark(r['Check'])].join(' | '), 'Unresolved | unresolved');
  w5Chk(name, 'summary', 'an Unresolved line carries its $1,000,000, and TOTAL is the detail’s $1,000,000',
    JSON.stringify([g.sum.filter(l => l[0] === 'Unresolved').map(l => [w5Dol(l[1]), w5Dol(l[3])]), (g.total || []).map(w5Dol)]), JSON.stringify([[[1000000, 1000000]], [1000000, 0, 1000000]]));
  w5Chk(name, 'summary', 'and the export says an entry is to check', /^⚠ 1 entry to check/.test(g.note), true);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();

// ══ v1.97 W5.3 — THE TRACKER: each row's picker is its own appropriation's, a row read by position says so, and picking confirms ═
await (async () => {
  const name = 'v1.97 W5 — the tracker offers each row its own appropriation’s services, and marks a row read by position until picked';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const X = w5Board();
  // the row's service picker, found by the row's title, read as its options and the one selected
  const picker = id => JSON.parse(X.ev(`(function(){ rpAp='ALL'; rpFy='ALL'; rpOpen=true; rpView='log'; render();
    var tr=[...document.querySelectorAll('#rpBody tr')].find(function(t){ return [...t.querySelectorAll('input')].some(function(i){ return i.value===${JSON.stringify(id)}; }); });
    var s=tr? tr.children[3].querySelector('select') : null;
    return JSON.stringify(s? {opts:[...s.options].map(function(o){ return o.value; }), shown:s.options[s.selectedIndex].textContent} : null); })()`));
  const ff = picker('W5-FF-2'), sp = picker('W5-SP-1');
  w5Chk(name, 'Full Fund row', 'its picker offers Full Fund’s services, not the O&M board’s on screen', JSON.stringify((ff || {}).opts), JSON.stringify(W5L['FULL FUND']));
  w5Chk(name, 'Spares row read by position', 'its picker offers Spares’ services, and shows its service as read by position, to confirm',
    JSON.stringify(sp && [sp.opts.filter(Boolean), /^⚠ CV \(by position\)$/.test(sp.shown)]), JSON.stringify([W5L['INITIAL SPARES'], true]));
  const un = picker('W5-FF-4');
  w5Chk(name, 'Full Fund row at a position its list does not have', 'it shows as Unresolved', un && /Unresolved/.test(un.shown), true);
  // PICKING CONFIRMS: the row now names its service, its mark is gone, and the export no longer asks
  X.ev(`rpSetField('W5-SP-1', 'svc', 'ANG'); 'ok'`);
  const sp2 = picker('W5-SP-1'), g = await w5Read(X.w, 'INITIAL SPARES', 'ALL');
  const row = g.rows.ATR.find(o => o['Requirement Short Title'] === 'W5-SP-1') || {};
  w5Chk(name, 'picked', 'the row names ANG, picked; its picker shows ANG; the export prints ANG with nothing to check',
    JSON.stringify([X.ev(`(function(){ var r=rpAll().find(function(x){ return x.id==='W5-SP-1'; }); return r.svcName+'|'+r.svcBy; })()`), sp2 && sp2.shown, row['Service'], w5Mark(row['Check'])]),
    JSON.stringify(['ANG|pick', 'ANG', 'ANG', '']));
  // A NEW ENTRY on the Full Fund filter takes Full Fund's first service, by name
  X.ev(`rpAp='FULL FUND'; rpFy=2027; rpAddEntry(); 'ok'`);
  w5Chk(name, 'a new Full Fund entry', 'it starts on Full Fund’s first service, by name',
    X.ev(`(function(){ var r=rpAll()[rpAll().length-1]; return r.ap+'|'+r.svcName+'|'+(typeof rpSvcOf==='function'? rpSvcOf(r).name : 'no reader'); })()`), 'FULL FUND|USN|USN');
  // MOVING A ROW TO ANOTHER APPROPRIATION keeps the service it showed: Full Fund's position 2 is USAF, O&M's is ANG
  X.ev(`rpSetField('W5-FF-1', 'ap', 'O&M'); 'ok'`);
  w5Chk(name, 'moved to O&M', 'a row read by position keeps the service it showed (USAF), still to confirm, not O&M’s position 2 (ANG)',
    X.ev(`(function(){ var r=rpAll().find(function(x){ return x.id==='W5-FF-1'; }); if(typeof rpSvcOf!=='function') return 'no reader: svc '+r.svc;
      var s=rpSvcOf(r); return s.name+'|'+s.how; })()`), 'USAF|pos');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();

// ══ v1.97 W5.4 — WHOLE DOLLARS IN THE $M FIELD (Brad, 5 Oct 2026: "no fractional values") ═════════════════════════════════
await (async () => {
  const name = 'v1.97 W5 — the $M field takes whole dollars only, refuses anything finer with its dollar figure, and keeps what it had';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const X = boot();
  seed(X.ev, { services: ['USAF', 'ANG'], items: [it('A', 'PSM', [300, 200])], disc: [600, 400], mand: [0, 0], order: ['A'] });
  X.ev(`RPDB.entries=[{id:'RPW', ts:1, ap:APPN, fy:2027, type:'BTR', svc:0, title:'whole', amtM:2.5, dir:'add', pool:'disc', status:'Pending'}]; persistRp(); 'ok'`);
  const state = () => X.ev(`(function(){ var r=rpAll()[0]; return JSON.stringify([r.amtM, r.ts, localStorage.getItem('prio27reprog')]); })()`);
  const typed = t => { const before = state(); X.ev(`rpSetField('RPW', 'amtM', ${JSON.stringify(t)}); 'ok'`);
    return { same: state() === before, amt: X.ev(`String(rpAll()[0].amtM)`), stat: X.ev(`(document.getElementById('shareStat')||{}).textContent||''`) }; };
  // REFUSED, each with the row, its stamp and the stored log untouched
  const fr = typed('1.2345678');
  w5Chk(name, '1.2345678', 'refused: it is $1,234,567.8, not whole dollars; the row keeps 2.5, unstamped and unsaved, and the message says the dollar figure',
    JSON.stringify([fr.same, fr.amt, /\$1,234,567\.8\b/.test(fr.stat), /not a whole number of dollars/.test(fr.stat)]), JSON.stringify([true, '2.5', true, true]));
  const tiny = typed('0.0000001');
  w5Chk(name, '0.0000001', 'refused: it is $0.1', JSON.stringify([tiny.same, /\$0\.1\b/.test(tiny.stat)]), JSON.stringify([true, true]));
  ['100oops', '1.2.3', '1e3', '1,50', '$', '10000000.000001'].forEach(t => {
    const r = typed(t);
    w5Chk(name, t, 'not an amount in whole dollars within the bound: refused, and the entry keeps 2.5 untouched', JSON.stringify([r.same, r.amt, /not recorded/i.test(r.stat)]), JSON.stringify([true, '2.5', true]));
  });
  // ACCEPTED: whole dollars in every form the field reads (a control: v1.96 read these the same)
  const ok = ['$1.5M', '1,500', '0.000001', '-2.25', ' 3 ', '7.000000'].map(t => { typed(t); return X.ev(`String(rpAll()[0].amtM)`); });
  w5Chk(name, 'whole dollars', 'control: $1.5M, 1,500, 0.000001, -2.25, 3 and 7.000000 are recorded as 1.5, 1500, 0.000001, -2.25, 3 and 7',
    JSON.stringify(ok), JSON.stringify(['1.5', '1500', '0.000001', '-2.25', '3', '7']));
  // and each accepted figure is said in dollars, so a $M slip shows at once
  typed('1,500');
  w5Chk(name, '1,500', 'recorded, and the message gives it in dollars: $1,500,000,000', /\$1,500,000,000\b/.test(X.ev(`(document.getElementById('shareStat')||{}).textContent||''`)), true);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();

// ══ v1.97 W5.5 — AN ENTRY ALREADY SAVED WITH A FRACTION OF A DOLLAR: kept, marked, named, and counted exactly ═══════════
await (async () => {
  const name = 'v1.97 W5 — an entry saved with a fraction of a dollar is kept as it is, marked, named by the export and counted exactly';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const X = boot();
  seed(X.ev, { services: ['USAF', 'ANG'], items: [it('A', 'PSM', [300, 200])], disc: [600, 400], mand: [0, 0], order: ['A'] });
  // $100,000.1 and $200,000.2 -- saved before v1.97, when the field took any fraction -- and a whole $3 deducted
  X.ev(`RPDB.entries=[
    {id:'RF1', ts:1, ap:APPN, fy:2027, type:'BTR', svc:0, svcName:'USAF', svcPos:0, svcBy:'pick', title:'frac one', amtM:0.1000001, dir:'add', pool:'disc', status:'Pending'},
    {id:'RF2', ts:2, ap:APPN, fy:2027, type:'BTR', svc:1, svcName:'ANG', svcPos:1, svcBy:'pick', title:'frac two', amtM:0.2000002, dir:'add', pool:'disc', status:'Pending'},
    {id:'RF3', ts:3, ap:APPN, fy:2027, type:'BTR', svc:1, svcName:'ANG', svcPos:1, svcBy:'pick', title:'whole', amtM:0.000003, dir:'deduct', pool:'disc', status:'Pending'}]; 'ok'`);
  const before = X.ev(`JSON.stringify(RPDB.entries)`);
  // THE TRACKER marks each one, with its dollar figure, and not the whole one
  const marks = JSON.parse(X.ev(`(function(){ rpAp='ALL'; rpFy='ALL'; rpOpen=true; rpView='log'; render();
    return JSON.stringify(['frac one','frac two','whole'].map(function(t){
      var tr=[...document.querySelectorAll('#rpBody tr')].find(function(x){ return [...x.querySelectorAll('input')].some(function(i){ return i.value===t; }); });
      var c=tr? tr.children[8] : null, m=c? c.querySelector('[title*="whole number of dollars"]') : null;
      return m? m.getAttribute('title') : ''; })); })()`));
  w5Chk(name, 'tracker', 'each fraction is marked with the dollar figure it holds, the whole one is not',
    JSON.stringify(marks.map(t => (/\$100,000\.1\b/.test(t) && 'marked $100,000.1') || (/\$200,000\.2\b/.test(t) && 'marked $200,000.2') || t)), JSON.stringify(['marked $100,000.1', 'marked $200,000.2', '']));
  const g = await w5Read(X.w, 'ALL', 'ALL');
  w5Chk(name, 'export', 'the Check column names each fraction, and nothing else',
    JSON.stringify(g.rows.BTR.map(o => [o['Requirement Short Title'], w5Mark(o['Check']), /\$\d[\d,]*\.\d/.test(String(o['Check'] ?? '')) ? 'with its dollars' : ''])),
    JSON.stringify([['frac one', 'fraction', 'with its dollars'], ['frac two', 'fraction', 'with its dollars'], ['whole', '', '']]));
  // COUNTED EXACTLY: 100,000.1 + 200,000.2 - 3 = 299,997.3 dollars, 0.2999973 $M, in the subtotal, the summary and TOTAL alike
  const exact = Number('0.2999973');
  // A CONTROL: v1.96 summed these in floating point, and the file's fifteen digits hide the difference at this size; the
  // check holds the exact sum against a rule that drops or rounds the fraction.
  w5Chk(name, 'export', 'control: each kept as it was saved, and the subtotal, the summary’s lines and TOTAL hold the exact 0.2999973 ($299,997.3)',
    JSON.stringify([g.rows.BTR.map(o => o['Total ($M)']), g.sub.BTR === exact, (g.total || [])[0] === exact, (g.total || [])[2] === exact,
      g.sum.map(l => [l[0], l[1]])]),
    JSON.stringify([[0.1000001, 0.2000002, 0.000003], true, true, true, [['USAF', 0.1000001], ['ANG', Number('0.1999972')]]]));
  w5Chk(name, 'export', 'and says how many are not whole dollars', /1 entr|2 entries/.test(g.note) && /2 not a whole number of dollars/.test(g.note), true);
  w5Chk(name, 'nothing rewritten', 'control: tracking and exporting change no entry', X.ev(`JSON.stringify(RPDB.entries)`), before);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
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

// v1.97 W6.2 THE FUNDS FLOW -- every appropriation and every fiscal year. Execution imported for four appropriations
// across two executed years, one amount per row and every one different; the OBBBA carry-over moves the FY25
// mandatory rows into FY26; an unfunded-priority-list row rides under Lockheed; FY27 and FY28 are PLANNED years
// answered from each year's own board, and FY29 is a year nobody has planned. Each year's workbook is held to the
// fixture's rows for that year: every appropriation's line, the US total, the other sources typed in for THAT year,
// the carry-over and UPL notes, the primes and OGCs, and every detail line's appropriation, service and dollars --
// then the two executed years together, where a carried row counts once. ORACLE — passes on v1.96 because the export
// was already right along both dimensions; its mutations prove each guard bites.
await (async () => {
  const name = 'v1.97 W6 — the funds flow: every appropriation and every fiscal year, executed, carried over and planned';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const J = JSON.stringify, S_ = a => a.reduce((x, y) => x + y, 0);
  const SV = ['USAF', 'ANG', 'AFRC', 'USN'];
  const ASK = { 2027: { F1: [310000, 47000, 23000, 19000], F2: [128000, 36000, 54000, 61000] },
                2028: { F1: [290000, 51000, 25000, 17000], F2: [133000, 34000, 58000, 63000] } };
  const DISC = [400000, 60000, 50000, 70000], MAND = [90000, 40000, 45000, 30000];
  // [appropriation, year, title, budget cell, service, dollars, prime ('LM' | 'PW' | ''), UPL]
  const ROWS = [
    ['om', 2025, 'LM Air Vehicle Support', 'USAF O&M- CAM Discretionary AV', 'USAF', 1234567, 'LM', false],
    ['om', 2025, 'Depot Repair Pods', 'ANG O&M Discretionary', 'ANG', 345679, '', false],
    ['om', 2025, 'Initial Spares Kit', 'USN O&M OBBBA Mandatory', 'USN', 222223, '', false],
    ['om', 2026, 'Software Sustainment', 'AFRC O&M Discretionary', 'AFRC', 456781, '', false],
    ['om', 2026, 'PW Engine Support', 'USAF O&M Discretionary', 'USAF', 987653, 'PW', false],
    ['ff', 2025, 'Workforce Travel', 'USAF Full Fund', 'USAF', 111119, '', false],
    ['ff', 2025, 'Mandatory Spares', 'USN Full Fund Mandatory', 'USN', 77771, '', false],
    ['ff', 2026, 'LM Modifications', 'ANG Full Fund', 'ANG', 654329, 'LM', false],
    ['sp', 2026, 'Spares Kit', 'USAF Initial Spares', 'USAF', 299993, '', false],
    ['sp', 2026, 'Unfunded Pods', 'AFRC Initial Spares', 'AFRC', 50021, 'LM', true],
    ['opn', 2025, 'Support Equipment', 'USN OPN', 'USN', 433337, '', false],
  ];
  const OTHER = { 2025: { ip: 1100003, fms: 250007 }, 2026: { ip: 900011, fms: 410009 }, 2027: { ip: 520013, fms: 130027 } };
  const carried = r => r[1] === 2025 && /OBBBA|Mandatory/.test(r[3]);          // the carry-over rule, FY25 -> FY26
  const effFy = r => carried(r) ? 2026 : r[1];
  const X = boot();
  seed(X.ev, { services: SV, items: [it('F1', 'PSM', ASK[2027].F1), it('F2', 'TSS', ASK[2027].F2)], disc: DISC, mand: MAND, order: ['F1', 'F2'] });
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    MS.years[MS.cur]=S; var y1=JSON.parse(JSON.stringify(S)); y1.asks=${J(ASK[2028])}; MS.years[MS.cur+1]=y1;
    (function(){ var R=${J(ROWS)}, all={};
      R.forEach(function(x,n){ var r=[]; for(var c=0;c<32;c++) r.push('');
        r[0]=x[1]; r[1]=x[1]+'-03'; r[2]='JSF'+(100+n); r[3]=x[2]; r[4]=x[3]; r[7]='Event '+x[2]; r[9]=x[5]; r[10]='Allocated';
        r[17]=x[7]? 'UPL' : ''; r[18]='Program (PSM)';
        var a=all[x[0]]||(all[x[0]]={asOf:'2026-09', hdr:[], read:1, noFy:0, rows:{}}); (a.rows[x[1]]||(a.rows[x[1]]=[])).push(r); });
      EXDB.all=all; EXDB.ts=Date.now(); })();
    var C=flowCfg(); C.pseudo={on:true, label:'OBBBA', token:'OBBBA, Mandatory', from:2025, to:2026, col:4}; C.other=${J(OTHER)};
    save(); 'ok'`);
  const slugs = JSON.parse(X.ev('JSON.stringify(APPN_SLUGS)')), lbl = JSON.parse(X.ev('JSON.stringify(APPN_LBL)')), own = X.ev('mySlug()');
  chk(name, 'fixture', 'every row, every year’s ask, every lane and every other source is a different amount',
    (() => { const v = ROWS.map(r => r[5]).concat(DISC, MAND, ...Object.values(ASK).map(y => Object.values(y).flat()), ...Object.values(OTHER).map(o => [o.ip, o.fms]));
      return new Set(v).size === v.length; })(), true);
  chk(name, 'fixture', 'FY25 and FY26 are executed, FY27–FY29 planned, and both planned years’ lanes cover every ask',
    X.ev(`[2025,2026,2027,2028,2029].map(flowYearKind).join(',')`) + ' ' + [2027, 2028].every(y => SV.every((_, i) => ASK[y].F1[i] + ASK[y].F2[i] <= DISC[i] + MAND[i])),
    'exec,exec,plan,plan,plan true');
  // what one year's workbook must hold, from the fixture alone
  const expect = fy => {
    const L = [];
    if (fy === 2025 || fy === 2026) ROWS.filter(r => effFy(r) === fy).forEach(r => L.push({ t: r[2], ap: r[0], sv: r[4], v: r[5], prime: !!r[6], upl: r[7] }));
    else if (ASK[fy]) ['F1', 'F2'].forEach(id => SV.forEach((sv, i) => { if (ASK[fy][id][i] > 0) L.push({ t: 'Req ' + id, ap: own, sv, v: ASK[fy][id][i], prime: false, upl: false }); }));
    return L;
  };
  const key = l => [l.t, lbl[l.ap], l.sv, l.v].join('|');
  const read = wb => { const ff = wb['Funds Flow'] || [];
    const all = lab => ff.filter(r => w6Lbl(r) === lab).map(r => num(r[1]));
    const one = lab => { const a = all(lab); return a.length ? a[0] : null; };
    const ha = ff.findIndex(r => w6Lbl(r) === 'Appropriation' && String((r || [])[1] ?? '') === 'Amount');
    const appn = slugs.map(s => num((ff.find((r, j) => j > ha && w6Lbl(r) === lbl[s]) || [])[1]));
    const det = sh => (wb[sh] || []).slice(1).filter(r => r && w6Lbl(r)).map(r => [String(r[0]), String(r[2]), String(r[4]), num(r[5])].join('|'));
    return { ff, all, one, appn, scope: w6Lbl(ff[1]), notes: ff.filter(r => /^NOTE:/.test(w6Lbl(r))).map(w6Lbl), prime: det('Prime Detail'), ogc: det('OGC Detail'), upl: det('Unfunded (UPL)') };
  };
  const yearCheck = (fy, G, L, other, multi) => {
    const where = (multi ? 'FY25 + FY26' : 'FY' + (fy % 100)) + ' · ';
    const us = S_(L.map(l => l.v)), byAp = slugs.map(s => S_(L.filter(l => l.ap === s).map(l => l.v)));
    chk(name, where + 'appropriation', 'each appropriation’s line is its own rows for the year, the others nothing', J(G.appn), J(byAp));
    chk(name, where + 'appropriation', 'US SERVICE FUNDING is every appropriation together', G.one('US SERVICE FUNDING'), us);
    chk(name, where + 'fiscal year', 'US service appropriations, wherever it is stated', J(G.all('US service appropriations')), J([us, us]));
    chk(name, where + 'fiscal year', 'the other sources typed in for this year', J([G.one('International Partners'), G.one('Foreign Military Sales'), G.one('Other sources total')]),
      J([other.ip, other.fms, other.ip + other.fms]));
    chk(name, where + 'fiscal year', 'TOTAL FUNDING, wherever it is stated, is US funding plus this year’s other sources',
      J(G.all('TOTAL FUNDING').filter(v => v !== null)), J([us + other.ip + other.fms, us + other.ip + other.fms]));
    chk(name, where + 'fiscal year', 'the primes and the other government costs are this year’s rows',
      J([G.one('Prime total'), G.one('OGC total')]), J([S_(L.filter(l => l.prime).map(l => l.v)), S_(L.filter(l => !l.prime).map(l => l.v))]));
    chk(name, where + 'appropriation · fiscal year', 'every detail line: its appropriation, service and dollars, on Prime Detail or OGC Detail, once',
      J(G.prime.concat(G.ogc).sort()), J(L.map(key).sort()));
    chk(name, where + 'appropriation · fiscal year', 'the primes’ lines are the LM, PW and UPL rows', J(G.prime.slice().sort()), J(L.filter(l => l.prime).map(key).sort()));
    chk(name, where + 'fiscal year', 'the unfunded priority list states its own rows', J(G.upl.slice().sort()), J(L.filter(l => l.upl).map(key).sort()));
  };
  for (const fy of [2025, 2026, 2027, 2028, 2029]) {
    X.ev(`flowCfg().fys=[${fy}]; flowCfg().aps=null; 'ok'`);   // v1.99 (item 92): the panel's selection, one year
    const wb = JSON.parse(await w6Book(X.w, 'exportFlow'));
    chk(name, 'FY' + (fy % 100), 'the funds flow builds and reads back', wb.__err || 'ok', 'ok');
    const G = read(wb), L = expect(fy);
    chk(name, 'FY' + (fy % 100) + ' · fiscal year', 'the workbook states the year it holds, and nothing else',
      G.scope.replace(/ · \+ OBBBA FY25$/, '').replace(/ · PLANNED \(board allocation, O&M\)$/, ''), 'Scope: FY' + (fy % 100) + ' · all appropriations');
    yearCheck(fy, G, L, OTHER[fy] || { ip: 0, fms: 0 }, false);
    const moved = ROWS.filter(r => carried(r)), mv = S_(moved.map(r => r[5]));
    chk(name, 'FY' + (fy % 100) + ' · fiscal year', 'the carry-over is stated where it lands, with its dollars and rows, and nowhere else',
      J(G.notes.filter(n => /appropriated in FY/.test(n))), J(fy === 2026 ? ['NOTE: includes ' + mv + ' of OBBBA appropriated in FY2025 and counted here as FY2026 (' + moved.length
        + ' plan events). Each row is counted in one fiscal year only.'] : []));
    chk(name, 'FY' + (fy % 100) + ' · fiscal year', 'the unfunded priority list inside the total is stated in the year it is in',
      J(G.notes.filter(n => /UNFUNDED requirements/.test(n)).map(n => num((/includes (\d+)/.exec(n) || [])[1]))), J(fy === 2026 ? [50021] : []));
  }
  // the two executed years together: a carried row counts once, in neither year twice, and the year note says so
  X.ev(`flowCfg().fys=[2025,2026]; flowCfg().aps=null; 'ok'`);
  const wbm = JSON.parse(await w6Book(X.w, 'exportFlow'));
  X.ev(`flowCfg().fys=null; 'ok'`);
  const Gm = read(wbm), Lm = expect(2025).concat(expect(2026));
  chk(name, 'FY25 + FY26 · fiscal year', 'the scope is the two years', Gm.scope, 'Scope: FY25, FY26 · all appropriations');
  yearCheck(null, Gm, Lm, { ip: OTHER[2025].ip + OTHER[2026].ip, fms: OTHER[2025].fms + OTHER[2026].fms }, true);
  chk(name, 'FY25 + FY26 · fiscal year', 'it says the years are added together, and claims no carry-over (both years are in it)',
    J([Gm.notes.some(n => n.indexOf('Fiscal years included: FY2025, FY2026.') > 0), Gm.notes.some(n => /appropriated in FY/.test(n))]), J([true, false]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();

// v1.97 W6.3 THE ACE TIE-OUT -- every fiscal year held to that year's own board and estimate. Two active years with
// different asks, budget authority, allocations, WBS and confirmations, against one estimate whose every line states
// a different figure in each year; the tie-out spans both (All active years). Each year's board funded is that year's
// lane walk, done here from the fixture; its estimate is the lines that year confirms, read from that year's column;
// the PMO blocks, the stray line, the lines nothing claims, the across-years matrix and the alignment breakout are each
// held year by year. The breakout's lines carry the requirement's ALLOCATION, and its note now says so: it said they
// add up to "what the board funds", which on this fixture is short of them by every dollar beyond both lanes (FAILS ON
// v1.96 for that sentence only); every figure is ORACLE — passes on v1.96 because the export was already right by year.
await (async () => {
  const name = 'v1.97 W6 — the ACE tie-out: every fiscal year held to that year’s own board and estimate';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const J = JSON.stringify, S_ = a => a.reduce((x, y) => x + y, 0);
  const SV = ['USAF', 'ANG', 'AFRC', 'USN'], ids = ['A1', 'A2', 'A3', 'A4'];
  const PMO = { A1: 'PSM', A2: 'TSS', A3: 'ATL', A4: 'AV' };
  const Y = {
    2027: { ask: { A1: [210000, 31000, 17000, 9000], A2: [87000, 26000, 14000, 33000], A3: [64000, 11000, 53000, 7000], A4: [46000, 19000, 8000, 27000] },
            alloc: {}, disc: [300000, 61000, 71000, 51000], mand: [56000, 22000, 10000, 30000],
            wbs: { A1: '1.1', A2: '2.2', A3: '3.3' }, ok: { A1: true, A2: true } },
    2028: { ask: { A1: [190000, 43000, 21000, 12000], A2: [99000, 28000, 16000, 35000], A3: [72000, 13000, 48000, 5000], A4: [57000, 18000, 6000, 29000] },
            alloc: { A2: [91000, 28000, 16000, 32000] }, disc: [280000, 90000, 62000, 44000], mand: [100000, 4000, 24000, 25000],
            wbs: { A1: '1.1', A2: '2.2', A3: '3.3', A4: '4.4' }, ok: { A1: true, A3: true, A4: true } } };
  const LINES = [['PSM', '1.1', 205000, 233000], ['TSS', '2.2', 151000, 98000], ['ATL', '3.3', 73000, 77000], ['AV', '4.4', 15000, 101000], ['NOBODY', '9.9', 3000, 34000]];
  const est = (w, fy) => { const l = LINES.find(x => x[1] === w); return l ? l[fy === 2027 ? 2 : 3] : 0; };
  // each year's lane walk, here: per service, discretionary until dry, then mandatory, then beyond
  const funded = fy => { const y = Y[fy], dR = y.disc.slice(), mR = y.mand.slice(), o = {};
    ids.forEach(id => { const b = (y.alloc[id] || y.ask[id]).map((v, i) => Math.min(v, y.ask[id][i]));
      o[id] = S_(b.map((v, i) => { const d = Math.min(v, Math.max(0, dR[i])); dR[i] -= d; const m = Math.min(v - d, Math.max(0, mR[i])); mR[i] -= m; return d + m; })); });
    return o; };
  const F = { 2027: funded(2027), 2028: funded(2028) };
  const X = boot();
  seed(X.ev, { services: SV, items: ids.map(id => it(id, PMO[id], Y[2027].ask[id])), disc: Y[2027].disc, mand: Y[2027].mand, order: ids });
  const stOf = fy => { const y = Y[fy], wbs = {}, map = {}, alloc = {};
    Object.keys(y.wbs).forEach(id => { wbs[id] = [{ w: y.wbs[id], v: [] }]; if (y.ok[id]) map[id] = { w: [y.wbs[id]], ok: true }; });
    Object.keys(y.alloc).forEach(id => { alloc[id] = { m: 's', v: y.alloc[id] }; });
    return { wbs, map, alloc }; };
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    var a=${J(stOf(2027))}; S.wbs=a.wbs; S.aceMap=a.map; S.alloc=a.alloc;
    MS.years[MS.cur]=S; var y1=JSON.parse(JSON.stringify(S)), b=${J(stOf(2028))};
    y1.asks=${J(Y[2028].ask)}; y1.discSvc=${J(Y[2028].disc)}; y1.mandSvc=${J(Y[2028].mand)};
    y1.bm={disc:${J(Y[2028].disc)}, mand:${J(Y[2028].mand)}, adds:[]}; y1.wbs=b.wbs; y1.aceMap=b.map; y1.alloc=b.alloc;
    MS.years[MS.cur+1]=y1;
    ACEDB.sets={'2027ACE':{lines:${J(LINES)}.map(function(l){ var v={}; v[2027]=l[2]; v[2028]=l[3]; return {ap:mySlug(), pmo:l[0], wbs:l[1], v:v}; })}};
    aceYr='all'; save(); 'ok'`);
  chk(name, 'fixture', 'every ask, allocation, lane and estimate figure differs across requirements, services and years',
    (() => { const v = [].concat(...[2027, 2028].map(fy => [].concat(...ids.map(id => Y[fy].ask[id]), Y[fy].disc, Y[fy].mand)), Y[2028].alloc.A2.filter((x, i) => x !== Y[2028].ask.A2[i]), ...LINES.map(l => [l[2], l[3]]));
      return new Set(v).size === v.length; })(), true);
  chk(name, 'fixture', 'the tie-out spans both years, and in each a requirement is funded short of its allocation',
    X.ev('JSON.stringify(aceScopeYears())') + ' ' + [2027, 2028].every(fy => ids.some(id => F[fy][id] < S_(Y[fy].alloc[id] || Y[fy].ask[id]))), '[2027,2028] true');
  const bk = JSON.parse(await w6Book(X.w, 'exportAceTieout'));
  chk(name, 'workbook', 'the tie-out builds and reads back', bk.__err || 'ok', 'ok');
  const FYL2 = fy => 'FY' + (fy % 100), YRS = [2027, 2028];
  const eOf = (fy, id) => Y[fy].ok[id] ? est(Y[fy].wbs[id], fy) : null;
  // ---- Mapping by Requirement: one row per requirement per year
  {
    const map = bk['Mapping by Requirement'] || [], h = headerRow(map, 'FY', 'PMO', 'Board funded', 'Estimate', 'Delta');
    const c = k => colOf(map, h, k);
    const rows = map.slice(h + 1).filter(r => /^FY\d\d$/.test(w6Lbl(r)));
    const got = rows.map(r => [w6Lbl(r), String(r[c('PMO')]), String(r[c('Requirement (CCaR Record Name)')]), String(r[c('Match')]),
      num(r[c('Board funded')]), num(r[c('Estimate')]), num(r[c('Delta')])]);
    const want = [].concat(...YRS.map(fy => ids.map(id => { const e = eOf(fy, id);
      return [FYL2(fy), PMO[id], 'Req ' + id, Y[fy].ok[id] ? 'Confirmed - exact line' : (Y[fy].wbs[id] ? 'Suggested - NOT confirmed' : 'No match'),
        F[fy][id], e, e === null ? null : F[fy][id] - e]; })));
    chk(name, 'Mapping by Requirement · fiscal year', 'each year’s row of each requirement: that year’s mapping, board funded, estimate and delta', J(got), J(want));
    const T = map.find((r, j) => j > h && w6Lbl(r) === 'TOTAL') || [];
    const bT = S_(YRS.map(fy => S_(ids.map(id => F[fy][id])))), eT = S_(YRS.map(fy => S_(ids.map(id => eOf(fy, id) || 0))));
    chk(name, 'Mapping by Requirement · fiscal year', 'TOTAL: every year’s board funded, confirmed estimate and delta', J([num(T[c('Board funded')]), num(T[c('Estimate')]), num(T[c('Delta')])]), J([bT, eT, bT - eT]));
  }
  // ---- Reconciliation by PMO: a block per year, each PMO's estimate read from that year's column
  {
    const pmo = bk['Reconciliation by PMO'] || [], h = headerRow(pmo, 'FY', 'PMO', 'Estimate', 'Board funded', 'Delta');
    // v1.99 (item 94): each year's block ends with the estimate accounted for -- checked below, apart from the office rows
    const idn = r => /^Estimate for this appropriation = the TOTAL/.test(String(r[1] ?? ''));
    const got = pmo.slice(h + 1).filter(r => /^FY\d\d/.test(w6Lbl(r)) && !idn(r)).map(r => [w6Lbl(r), String(r[1] ?? '').split('   ')[0], num(r[2]), num(r[3]), num(r[4]), num(r[5]), num(r[6])]);
    chk(name, 'Reconciliation by PMO · fiscal year', 'v1.99 (item 94): each year’s estimate, accounted for: the office rows plus the stray line, and it ties',
      J(pmo.slice(h + 1).filter(idn).map(r => [w6Lbl(r), num(r[2]), /DOES NOT TIE/.test(String(r[1]))])),
      J(YRS.map(fy => [FYL2(fy), S_(LINES.map(l => l[fy === 2027 ? 2 : 3])), false])));
    const want = [].concat(...YRS.map(fy => {
      const L = ['ATL', 'AV', 'PSM', 'TSS'].map(p => { const mine = ids.filter(id => PMO[id] === p), e = S_(LINES.filter(l => l[0] === p).map(l => l[fy === 2027 ? 2 : 3])), b = S_(mine.map(id => F[fy][id]));
        return [FYL2(fy), p, e, b, b - e, mine.filter(id => Y[fy].ok[id]).length, mine.length]; });
      const eY = S_(L.map(r => r[2])), bY = S_(L.map(r => r[3]));
      return L.concat([[FYL2(fy), 'NOBODY', est('9.9', fy), null, null, null, null], [FYL2(fy) + ' TOTAL', '', eY, bY, bY - eY, ids.filter(id => Y[fy].ok[id]).length, ids.length]]); }));
    chk(name, 'Reconciliation by PMO · fiscal year', 'each year’s block: every office’s estimate and board funded, the stray line, the year’s total', J(got), J(want));
  }
  // ---- Lines Nothing Claims: per year, the lines that year's confirmations leave, at that year's figure
  {
    const orph = bk['Lines Nothing Claims'] || [];
    const got = orph.filter(r => /^FY\d\d$/.test(w6Lbl(r))).map(r => [w6Lbl(r), String(r[1]), num(r[2])]);
    const want = [].concat(...YRS.map(fy => LINES.filter(l => !ids.some(id => Y[fy].ok[id] && Y[fy].wbs[id] === l[1]))
      .map(l => [FYL2(fy), l[1], est(l[1], fy)]).sort((a, b) => b[2] - a[2])));
    chk(name, 'Lines Nothing Claims · fiscal year', 'each year’s unclaimed lines, at that year’s figure', J(got), J(want));
  }
  // ---- Across Active Years: a row per requirement, a column triple per year, and the years together
  {
    const ac = bk['Across Active Years'] || [], h = ac.findIndex(r => w6Lbl(r) === 'PMO');
    const got = ac.slice(h + 1).filter(r => r && w6Lbl(r)).map(r => r.slice(0, 9).map((v, k) => k < 2 ? String(v) : (v === '' || v == null ? null : num(v))));
    const want = ids.map(id => [PMO[id], 'Req ' + id].concat(...YRS.map(fy => { const e = eOf(fy, id); return [F[fy][id], e, e === null ? null : F[fy][id] - e]; }), [F[2027][id] + F[2028][id]]));
    chk(name, 'Across Active Years · fiscal year', 'every requirement: each year’s board funded, estimate and delta under that year, and the years together', J(got), J(want));
  }
  // ---- the alignment breakout: each year's lines carry that year's allocation, and the note says what they add up to
  {
    const al = bk['Alignment Breakout'] || [], h = headerRow(al, 'FY', 'PMO', 'Line total');
    const got = al.slice(h + 1).filter(r => /^FY\d\d$/.test(w6Lbl(r))).map(r => [w6Lbl(r), String(r[2]), String(r[4]), num(r[5]), num(r[6]), num(r[7])]);
    const want = [].concat(...YRS.map(fy => ids.map(id => { const a = (Y[fy].alloc[id] || Y[fy].ask[id]);
      return [FYL2(fy), 'Req ' + id, Y[fy].wbs[id] || '(no WBS)', S_(a), a[0] + a[1] + a[2], a[3]]; })));
    chk(name, 'Alignment Breakout · fiscal year', 'each year’s line of each requirement: that year’s allocation, by the services each code governs', J(got), J(want));
    const note = al.map(w6Lbl).find(t => /Every line here is a funding line/.test(t)) || '';
    chk(name, 'Alignment Breakout · fiscal year', 'its note says the lines carry the allocation, not what the lanes pay — which they exceed here',
      J([/Line total column carries the requirement’s allocation/.test(note), /not what the lanes pay/.test(note), /adds up to what the board funds/.test(note)]), J([true, true, false]));
  }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
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
      S.wbs={R:[{w:'2.2', v:[]}]}; S.aceMap={PRIME_P:{w:['1.1'], ok:true}, R:{w:['2.2'], ok:true}};
      ACEDB.sets={'2027ACE':{lines:[{ap:mySlug(), pmo:'AV', wbs:'1.1', v:{}}, {ap:mySlug(), pmo:'AV', wbs:'2.2', v:{}}]}};
      ACEDB.sets['2027ACE'].lines[0].v[MS.cur]=900; ACEDB.sets['2027ACE'].lines[1].v[MS.cur]=600; aceYr='all';`);
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
    // ---- the ACE tie-out: the alignment breakout splits a line whose services differ; the mapping counts the combinations
    const ab = JSON.parse(await w6Book(X.w, 'exportAceTieout'));
    chk(name, 'ACE tie-out', 'the tie-out builds and reads back', ab.__err || 'ok', 'ok');
    const al = ab['Alignment Breakout'] || [], ah = headerRow(al, 'FY', 'PMO', 'Line total');
    const ac = k => colOf(al, ah, k);
    const lines = al.slice(ah + 1).filter(r => /^FY\d\d$/.test(w6Lbl(r))).map(r => [String(r[2]), String(r[3] ?? ''), String(r[4] ?? ''), num(r[5]), num(r[6]), num(r[7]), String(r[ac('RCN')] ?? ''), String(r[ac('EEIC')] ?? '')]);
    chk(name, 'ACE · alignment breakout', 'P’s CLIN 0001 is a line per combination and its Navy money a line of its own; CLIN 0002 one line; R a line per combination; the lines add to each CLIN',
      J(lines), J([['Req PRIME_P', '0001', '(no WBS)', 652, 652, 0, '11111', 'AAAAA'], ['Req PRIME_P', '0001', '(no WBS)', 31, 31, 0, '33333', 'CCCCC'], ['Req PRIME_P', '0001', '(no WBS)', 41, 0, 41, '', ''],
        ['Req PRIME_P', '0002', '(no WBS)', 358, 358, 0, '44444', 'DDDDD'],
        ['Req R', '', '2.2', 503, 503, 0, '11111', 'AAAAA'], ['Req R', '', '2.2', 127, 127, 0, '22222', 'BBBBB'], ['Req Q', '', '(no WBS)', 71, 71, 0, '', '']]));
    const mp = ab['Mapping by Requirement'] || [], mh = headerRow(mp, 'FY', 'PMO', 'Board funded');
    const codes = mp.slice(mh + 1).filter(r => /^FY\d\d$/.test(w6Lbl(r))).map(r => [String(r[colOf(mp, mh, 'Requirement (CCaR Record Name)')]), String(r[colOf(mp, mh, 'RCN')] ?? ''), String(r[colOf(mp, mh, 'EEIC')] ?? '')]);
    chk(name, 'ACE · mapping by requirement', 'P rides three combinations and R two, so both send the reader to the breakout; Q has none',
      J(codes), J([['Req PRIME_P', '(3 combinations)', '(see breakout)'], ['Req R', '(2 combinations)', '(see breakout)'], ['Req Q', '', '']]));
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
    w5Chk(name, 'a typed budget total, $100,000,000', 'the base and the live lane hold the exact split of the base’s shape',
      J(ev(`(function(){ S.bm={disc:${J(W)}, mand:[0,0,0], adds:[]}; applyBudget(); setBATot('disc','$100,000,000'); return JSON.stringify([S.bm.disc, S.discSvc]); })()`)), J([E8, E8]));
    w5Chk(name, 'a typed budget total, $10,000,000 over 1 : 1 : 4', 'the tie goes to the lower service',
      J(ev(`(function(){ S.bm={disc:[1000,1000,4000], mand:[0,0,0], adds:[]}; applyBudget(); setBATot('disc','$10,000,000'); var r=S.bm.disc.slice();
        S.bm={disc:[1e9,1e9,1e9], mand:[0,0,0], adds:[]}; applyBudget(); return JSON.stringify(r); })()`)), J(TIE));
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
// ==== v1.99 item 87 (review N03): the reprogramming $M field reads the whole entry ====
// FAILS ON v1.98, which cut the entry to 60 characters before reading it: "1", 59 spaces and "oops" was $1M (over this $5M
// row it replaced the figure and stamped the row), and "0.000001", 52 zeros and "1" -- not whole dollars -- was $1.
await (async () => {
  const name = 'v1.99 item 87 — the $M field reads the whole entry, however long, and a refused one changes nothing';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
  const J = JSON.stringify;
  const X = boot();
  seed(X.ev, { services: ['USAF', 'ANG'], items: [it('A', 'PSM', [300, 200])], disc: [600, 400], mand: [0, 0], order: ['A'] });
  X.ev(`RPDB.entries=[{id:'RPW', ts:1, ap:APPN, fy:2027, type:'BTR', svc:0, title:'whole', amtM:5, dir:'add', pool:'disc', status:'Pending'}]; RPDB.ts=1; persistRp(); 'ok'`);
  // the row's figure, the row's stamp, the log's stamp and the stored bytes
  const state = () => X.ev(`(function(){ var r=rpAll()[0]; return JSON.stringify([r.amtM, r.ts, RPDB.ts, localStorage.getItem('prio27reprog')]); })()`);
  const typed = t => { const before = state(); X.ev(`rpSetField('RPW', 'amtM', ${J(t)}); 'ok'`);
    const r = { same: state() === before, amt: X.ev(`String(rpAll()[0].amtM)`), stat: X.ev(`(document.getElementById('shareStat')||{}).textContent||''`) };
    X.ev(`(function(){ var r=rpAll()[0]; r.amtM=5; r.ts=1; RPDB.ts=1; persistRp(); })(); 'ok'`);   // the row as it was, for the next case
    return r; };
  // [what, entry, refused?, what it is recorded as when taken, the message (refused)]
  const CASES = [
    ['64 characters: "1", 59 spaces, "oops"', '1' + ' '.repeat(59) + 'oops', true, null, /does not read as an amount/],
    ['61 characters: "0.000001", 52 zeros, "1" (not whole dollars)', '0.000001' + '0'.repeat(52) + '1', true, null, /not a whole number of dollars/],
    ['64 characters: a valid start, a bad end', '4.5' + '0'.repeat(60) + 'x', true, null, /does not read as an amount/],
    ['63 characters: a nonzero digit past the sixth decimal', '2.000000' + '0'.repeat(54) + '7', true, null, /not a whole number of dollars/],
    ['73 characters: a sign, then spaces, then a stray digit', '-1' + ' '.repeat(70) + '2', true, null, /does not read as an amount/],
    ['201 characters', '6.' + '0'.repeat(199), true, null, /201 characters long/],
    ['CONTROL — 59 characters: "1", spaces, "M"', '1' + ' '.repeat(57) + 'M', false, '1', null],
    ['CONTROL — 60 characters: "2." and zeros', '2.' + '0'.repeat(58), false, '2', null],
    ['CONTROL — 61 characters: "3." and zeros (the whole entry is whole dollars)', '3.' + '0'.repeat(59), false, '3', null],
    ['CONTROL — 200 characters: "6." and zeros', '6.' + '0'.repeat(198), false, '6', null],
    ['CONTROL — over $10 trillion', '10000001', true, null, /more than the \$10,000,000,000,000/],
    ['CONTROL — blank is a clear', '   ', false, '0', null],
  ];
  CASES.forEach(([lbl, t, refused, amt, msg]) => {
    const r = typed(t);
    if (refused) w5Chk(name, lbl, 'refused: the row’s figure, its stamp, the log’s stamp and the stored bytes are unchanged, and the message says why',
      J([r.same, r.amt, msg.test(r.stat)]), J([true, '5', true]));
    else w5Chk(name, lbl, 'recorded as the whole entry reads', r.amt, amt);
  });
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v1.99 item 87 ====
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
// ==== end v1.99 item 88 ====
// ==== v1.99 items 92 and 93 (from item 82): the funds-flow export writes the panel's selection; execution by appropriation and year ====
// Execution: O&M FY25 $1,000 (USAF) and FY26 $2,000 (ANG); Full Fund FY26 $500 and FY27 $800 (USAF). Partner money typed
// for FY25 $100 and FY26 $200. The board is on O&M; its FY27 plan asks $5,000 and both lanes cover it. Every expected
// figure below is the fixture's own arithmetic.
// ITEM 92 -- the panel set to FY25 + FY26, O&M only: the export says so and holds O&M's $3,000, the partner $300 once,
// labelled portfolio-wide, $3,300 in all, and no Full Fund line. FAILS ON v1.98: it wrote the last year on screen across
// every appropriation (FY26 · all appropriations, $2,500).
// ITEM 93 -- FY27, every appropriation: O&M planned ($5,000) and Full Fund executed ($800), $5,800, and the scope names
// which is which. FAILS ON v1.98: any execution made the whole year executed, so O&M's plan was not read ($800).
await (async () => {
  const name = 'v1.99 items 92–93 — the funds-flow export is the panel’s selection, and execution is decided per appropriation and year';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const X = boot();
    seed(X.ev, { services: ['USAF', 'ANG'], items: [it('F1', 'PSM', [5000, 0])], disc: [10000, 10000], mand: [0, 0], order: ['F1'] });
    const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    const ROWS = [['om', 2025, 'Depot Pods', 'USAF O&M Discretionary', 1000], ['om', 2026, 'Software', 'ANG O&M Discretionary', 2000],
                  ['ff', 2026, 'Travel', 'USAF Full Fund', 500], ['ff', 2027, 'Spares', 'USAF Full Fund', 800]];
    ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      MS.cur=2027; MS.years[2027]=S;
      (function(){ var R=${J(ROWS)}, all={};
        R.forEach(function(x,n){ var r=[]; for(var c=0;c<32;c++) r.push('');
          r[0]=x[1]; r[1]=x[1]+'-03'; r[2]='JSF'+(200+n); r[3]=x[2]; r[4]=x[3]; r[7]='Event '+x[2]; r[9]=x[4]; r[10]='Allocated'; r[18]='Program (PSM)';
          var a=all[x[0]]||(all[x[0]]={asOf:'2026-09', hdr:[], read:1, noFy:0, rows:{}}); (a.rows[x[1]]||(a.rows[x[1]]=[])).push(r); });
        EXDB.all=all; EXDB.ts=Date.now(); })();
      var C=flowCfg(); C.other={2025:{ip:100, fms:0}, 2026:{ip:200, fms:0}}; save(); 'ok'`);
    const own = ev('mySlug()'), lbl = JSON.parse(ev('JSON.stringify(APPN_LBL)'));
    const esc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), MIX = new RegExp('FY27: ' + esc(lbl.om) + ' planned, ' + esc(lbl.ff) + ' executed');
    w5Chk(name, 'fixture', 'CONTROL — the board is on O&M, in FY27', own + '|' + ev('MS.cur'), 'om|2027');
    const read = wb => { const ff = wb['Funds Flow'] || [];
      const one = lab => { const r = ff.find(x => w6Lbl(x) === lab); return r ? num(r[1]) : null; };
      const ha = ff.findIndex(r => w6Lbl(r) === 'Appropriation' && String((r || [])[1] ?? '') === 'Amount');
      const ap = ha < 0 ? [] : ff.slice(ha + 1).filter(r => Object.values(lbl).includes(w6Lbl(r))).map(r => [w6Lbl(r), num(r[1])]);
      const tot = ff.filter(x => w6Lbl(x) === 'TOTAL FUNDING').map(x => num(x[1])).filter(v => v !== null);
      return { scope: w6Lbl(ff[1] || []), us: one('US SERVICE FUNDING'), ip: one('International Partners'), tot: tot.length ? tot[0] : null, ap,
               wide: ff.some(r => /PORTFOLIO-WIDE/.test(w6Lbl(r))), note: ff.some(r => /counted once, for the years in scope/.test(w6Lbl(r))),
               mixed: ff.filter(r => MIX.test(w6Lbl(r))).length }; };
    // ── ITEM 92: FY25 + FY26, O&M only ──
    // as a person does it: the selection made on the panel, the panel on screen, then ⬇ Export (v1.98 took the export's
    // year from the panel's last drawing -- one year, every appropriation)
    ev(`flowCfg().fys=[2025,2026]; flowCfg().aps=['om']; flowOpen=true; flowBody(); 'ok'`);
    const P = JSON.parse(ev(`JSON.stringify((function(){ var F=flowCalc(); return [F.tot, F.ip, F.grand, F.label]; })())`));
    w5Chk(name, 'item 92 · the panel', 'CONTROL — the panel: US $3,000, partner $300, $3,300, FY25, FY26 · O&M', J(P), J([3000, 300, 3300, 'FY25, FY26 · O&M']));
    const G = read(JSON.parse(await w6Book(X.w, 'exportFlow')));
    w5Chk(name, 'item 92 · the export', 'states the panel’s scope: FY25, FY26 · O&M', G.scope, 'Scope: FY25, FY26 · O&M');
    w5Chk(name, 'item 92 · the export', 'US $3,000 (O&M’s two years), partner $300 once, TOTAL $3,300', J([G.us, G.ip, G.tot]), J([3000, 300, 3300]));
    w5Chk(name, 'item 92 · the export', 'by appropriation: O&M $3,000 alone; Full Fund, switched off, is left out', J(G.ap), J([[lbl.om, 3000]]));
    w5Chk(name, 'item 92 · the export', 'the partner money is labelled portfolio-wide, and the note says the selection does not change it', J([G.wide, G.note]), J([true, true]));
    const pan = ev(`flowOpen=true; flowBody(); document.getElementById('flowBody').textContent`);
    w5Chk(name, 'item 92 · the panel', 'says the same: portfolio-wide, counted once, not changed by the appropriation selection',
      J([/PORTFOLIO-WIDE/.test(pan), /counted once, for the years in scope/.test(pan)]), J([true, true]));
    // ── ITEM 93: FY27, every appropriation ──
    ev(`flowCfg().fys=[2027]; flowCfg().aps=null; flowOpen=true; flowBody(); 'ok'`);
    const Q = JSON.parse(ev(`JSON.stringify((function(){ var F=flowCalc(); return [F.tot, F.appn.om, F.appn.ff, F.execV, F.planV, F.label]; })())`));
    w5Chk(name, 'item 93 · FY27', 'O&M planned $5,000 and Full Fund executed $800: $5,800, each counted its own way',
      J(Q.slice(0, 5)), J([5800, 5000, 800, 800, 5000]));
    w5Chk(name, 'item 93 · FY27', 'the scope names the mix: FY27: O&M planned, Full Fund executed', MIX.test(Q[5]), true);
    const G2 = read(JSON.parse(await w6Book(X.w, 'exportFlow')));
    w5Chk(name, 'item 93 · the export', 'US $5,800; by appropriation O&M $5,000 and Full Fund $800; the mix stated',
      J([G2.us, G2.ap.filter(r => r[1]), MIX.test(G2.scope) || G2.mixed > 0]), J([5800, [[lbl.om, 5000], [lbl.ff, 800]], true]));
    // a year executed for O&M too is executed for both (a CONTROL: one kind of money, said as before)
    w5Chk(name, 'item 93 · FY26', 'CONTROL — FY26 is executed for both: O&M $2,000 and Full Fund $500',
      ev(`JSON.stringify((function(){ var F=flowCalc(2026); return [F.tot, F.appn.om, F.appn.ff]; })())`), J([2500, 2000, 500]));
    ev(`flowCfg().fys=null; flowCfg().aps=null; 'ok'`);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v1.99 items 92–93 ====
// ==== v1.99 item 94 (from item 82): an office with only estimate lines is in the ACE reconciliation ====
// The estimate: PSM $900 (1.1), TSS $400 (2.2), ATL $250 (3.3) and $100 under a PMO no office reports under (NOBODY, 9.9).
// The board: R1 (PSM) funded $1,000 and confirmed on 1.1; R2 (TSS) funded $300 and confirmed on 2.2; no requirement is ATL's.
// Expected: PSM 900 / 1,000 / +100; TSS 400 / 300 / −100; ATL 250 / 0 / −250 (estimate only); TOTAL 1,550 / 1,300 / −250;
// and 1,550 + 100 = 1,650, the estimate. FAILS ON v1.98: ATL was left off the block and its total (TOTAL 1,300 / 1,300).
await (async () => {
  const name = 'v1.99 item 94 — an office with only estimate lines is a row of the ACE reconciliation, and the estimate is accounted for';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const X = boot();
    seed(X.ev, { services: ['USAF', 'ANG'], items: [it('R1', 'PSM', [600, 400]), it('R2', 'TSS', [300, 0])], disc: [10000, 10000], mand: [0, 0], order: ['R1', 'R2'] });
    const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    const LINES = [['PSM', '1.1', 900], ['TSS', '2.2', 400], ['ATL', '3.3', 250], ['NOBODY', '9.9', 100]];
    ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.wbs={R1:[{w:'1.1', v:[]}], R2:[{w:'2.2', v:[]}]}; S.aceMap={R1:{w:['1.1'], ok:true}, R2:{w:['2.2'], ok:true}}; MS.years[MS.cur]=S;
      ACEDB.sets={'2027ACE':{lines:${J(LINES)}.map(function(l){ var v={}; v[MS.cur]=l[2]; return {ap:mySlug(), pmo:l[0], wbs:l[1], v:v}; })}};
      spAce='2027ACE'; aceYr=MS.cur; save(); 'ok'`);
    w5Chk(name, 'fixture', 'CONTROL — R1 is funded $1,000 and R2 $300', ev(`(function(){ var T=tiers(); return [T.R1.dT+T.R1.mT, T.R2.dT+T.R2.mT].join('|'); })()`), '1000|300');
    const bk = JSON.parse(await w6Book(X.w, 'exportAceTieout'));
    const pmo = bk['Reconciliation by PMO'] || [];
    const FY = 'FY' + (Number(ev('MS.cur')) % 100);
    const rows = pmo.filter(r => w6Lbl(r) === FY || w6Lbl(r) === FY + ' TOTAL').map(r => [w6Lbl(r), String(r[1] ?? '').split('   ')[0], num(r[2]), r[3] === '' || r[3] == null ? null : num(r[3]), r[4] === '' || r[4] == null ? null : num(r[4])]);
    const off = rows.filter(r => ['ATL', 'PSM', 'TSS'].includes(r[1]));
    w5Chk(name, 'Reconciliation by PMO', 'each office: ATL 250 / 0 / −250 (estimate only), PSM 900 / 1,000 / +100, TSS 400 / 300 / −100',
      J(off), J([[FY, 'ATL', 250, 0, -250], [FY, 'PSM', 900, 1000, 100], [FY, 'TSS', 400, 300, -100]]));
    w5Chk(name, 'Reconciliation by PMO', 'the TOTAL is the three offices: 1,550 / 1,300 / −250', J(rows.filter(r => r[0] === FY + ' TOTAL').map(r => [r[2], r[3], r[4]])), J([[1550, 1300, -250]]));
    w5Chk(name, 'Reconciliation by PMO', 'CONTROL — the $100 under no office is stated beside it, outside the TOTAL', J(rows.filter(r => r[1] === 'NOBODY').map(r => r[2])), J([100]));
    const idn = pmo.find(r => /^Estimate for this appropriation = the TOTAL/.test(String((r || [])[1] ?? '')));
    w5Chk(name, 'Reconciliation by PMO', 'the estimate, accounted for: 1,550 + 100 = 1,650, each line once, and it ties',
      J(idn ? [num(idn[2]), /DOES NOT TIE/.test(String(idn[1]))] : 'no such line'), J([1650, false]));
    const pan = ev(`aceOpen=true; aceBody(); JSON.stringify([document.querySelectorAll('#aceBody tr.aceestonly').length, (document.querySelector('#aceBody .aceacct')||{}).textContent||''])`);
    let pj; try { pj = JSON.parse(pan); } catch { pj = [0, pan]; }
    w5Chk(name, 'the panel', 'ATL has its estimate-only row, and the estimate is stated as the TOTAL plus the lines under no office',
      J([pj[0], /= the TOTAL/.test(pj[1]) && !/does not tie/.test(pj[1])]), J([1, true]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
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
    const p = JSON.parse(ev(`(function(){ matBulkF='RCN / EEIC'; matBulkV='K2'; matBody(); const P=matBulkPreview();
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
    w5Chk(name, 'item 98 · the PPBE cycles panel', 'says what it keeps, and that it does not keep every list it is read through',
      J([/RCN \/ EEIC list/.test(cj[0]), /does not keep every list/.test(cj[0])]), J([true, true]));
    w5Chk(name, 'item 98 · the PPBE cycles panel', 'names what it still reads as it is now: destinations, decision bands, a budget set by rule, requirement detail',
      J(['destination list', 'decision bands', 'BAE budget set by rule', 'requirement detail'].map(t => cj[0].includes(t))), J([true, true, true, true]));
    w5Chk(name, 'item 98 · Help', 'the five-year plan’s Help says the same', J(['keeps', 'destination list', 'decision bands', 'BAE budget set by rule'].map(t => cj[1].includes(t))), J([true, true, true, true]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v1.99 items 97–98 ====
// ==== v2.00 (R1): funds flow -- execution precedence by appropriation and EFFECTIVE fiscal year ====
// The board is on O&M, its five-year plan from FY26; FY25 is offered because the workbook files rows under it. Each year's pot
// is its own, set in that year's S.bm (applyState rebuilds the lanes from it): FY25 $300M, FY26 $500M, one service, one
// requirement asking $900M, so each year's plan is its whole pot. The OBBBA rule is on: an FY25 O&M row whose Budget cell
// says OBBBA counts as FY26. Every expected figure below is the fixture's own arithmetic.
// VARIANT B -- O&M's only FY25 row is the $100M OBBBA one. FY25 reads its $300M plan; FY26 reads $100M executed and $0 planned;
// FY25 + FY26 = $400M, $100M executed and $300M planned, said as such on the panel and in the export (US SERVICE FUNDING
// 400000000 and a NOTE: planned and executed money in one total). Saved FY25-only and reopened, the selection stays FY25.
// VARIANT A -- FY25 also holds a $40M ordinary row: FY25 = $40M executed (a CONTROL), FY26 = $100M executed, FY25 + FY26 =
// $140M executed, and the export agrees with no planned-and-executed NOTE.
// Raw execution (EXDB.all) is read, never rewritten; the matching rules no longer claim the total is unchanged.
// FAILS ON 9b27e80, except the two CONTROLs and the raw-history guards: execution was decided by the workbook's year, so FY26
// read its $500M plan beside the $100M carried ($600M) and FY25 was "executed" with nothing left in it ($0).
await (async () => {
  const name = 'v2.00 (R1) — execution precedence by appropriation and effective year';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const POT = { 2025: 300000000, 2026: 500000000 };
    const row = (n, title, budget, amt) => { const r = Array(32).fill(''); r[0] = 2025; r[1] = '2025-03'; r[2] = 'JSF' + (300 + n); r[3] = title;
      r[4] = budget; r[7] = 'Event ' + title; r[9] = amt; r[10] = 'Allocated'; r[18] = 'Program (PSM)'; return r; };
    const CARRY = row(1, 'Carried Support', 'USAF O&M OBBBA Mandatory', 100000000), OWN = row(2, 'Depot Pods', 'USAF O&M Discretionary', 40000000);
    const open = rows => {
      const X = boot();
      seed(X.ev, { services: ['USAF'], items: [it('F1', 'PSM', [900000000])], disc: [POT[2026]], mand: [0], order: ['F1'] });
      const ALL = { om: { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: rows } } };
      X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
        var POT=${J(POT)}; MS.base=2026; MS.cur=2026; FYMON=fyMonths(2026); MS.years={};
        [2025,2026].forEach(function(y){ var st=JSON.parse(JSON.stringify(S)); st.bm={disc:[POT[y]], mand:[0], adds:[]}; st.discSvc=[POT[y]]; MS.years[y]=st; });
        applyState(MS.years[2026]); MS.years[2026]=S;
        EXDB.all=${J(ALL)}; EXDB.ts=1;
        var C=flowCfg(); C.pseudo={on:true, label:'OBBBA', token:'OBBBA, Mandatory', from:2025, to:2026, col:4}; C.other={}; C.fys=null; C.aps=['om'];
        save(); 'ok'`);
      return { X, ALL };
    };
    const calc = (X, fys) => JSON.parse(X.ev(`(function(){ if(${J(fys)}) flowCfg().fys=${J(fys)}; var F=flowCalc();
      return JSON.stringify({sel:flowSelYears(), t:[F.tot, F.execV, F.planV], label:F.label}); })()`));
    const panel = X => JSON.parse(X.ev(`(function(){ flowOpen=true; flowRuleOpen=true; flowBody(); var b=document.getElementById('flowBody'), m=b.querySelector('.flowmix');
      var chips=[].slice.call(b.querySelectorAll('button')).filter(function(x){ return /^FY\\d\\d/.test(x.textContent); })
        .map(function(x){ return x.textContent+(x.classList.contains('on')? ' [on]' : ''); });
      var pl=/(FY\\d\\d(?:, FY\\d\\d)*) (?:is|are) PLANNED, not executed/.exec(b.textContent);
      return JSON.stringify({mix:m? m.textContent : '', planned:pl? pl[1] : '', chips:chips, text:b.textContent}); })()`));
    const book = async X => { const wb = JSON.parse(await w6Book(X.w, 'exportFlow')), ff = wb['Funds Flow'] || [];
      const all = lab => ff.filter(r => w6Lbl(r) === lab).map(r => num(r[1])).filter(v => v !== null);
      return { err: wb.__err || 'ok', scope: w6Lbl(ff[1] || []), us: all('US SERVICE FUNDING'), tot: all('TOTAL FUNDING'), om: all('O&M'),
               mixNote: ff.map(w6Lbl).filter(t => /^NOTE: planned and executed money in one total/.test(t)) }; };
    // ── VARIANT B: the only FY25 O&M row is carried to FY26 ──
    const B = open([CARRY]);
    w5Chk(name, 'variant B · fixture', 'CONTROL — the board is on O&M, its plan from FY26; FY25 and FY26 each hold their own pot',
      B.X.ev(`mySlug()+'|'+MS.base+'|'+MS.cur+'|'+MS.years[2025].bm.disc[0]+'|'+MS.years[2026].bm.disc[0]`), 'om|2026|2026|300000000|500000000');
    w5Chk(name, 'variant B · FY25', 'FY25 reads its $300M plan: $300M, $0 executed, $300M planned, labelled planned',
      J(calc(B.X, [2025])), J({ sel: [2025], t: [300000000, 0, 300000000], label: 'FY25 · O&M · PLANNED (board allocation, O&M)' }));
    w5Chk(name, 'variant B · FY26', 'FY26 = $100M executed, $0 planned, $100M total, the carried OBBBA named',
      J(calc(B.X, [2026])), J({ sel: [2026], t: [100000000, 100000000, 0], label: 'FY26 · O&M · + OBBBA FY25' }));
    const GB26 = await book(B.X);
    w5Chk(name, 'variant B · FY26 · the export', 'US SERVICE FUNDING 100000000, O&M 100000000, TOTAL FUNDING 100000000 twice, no planned-and-executed NOTE',
      J([GB26.err, GB26.scope, GB26.us, GB26.om, GB26.tot, GB26.mixNote]), J(['ok', 'Scope: FY26 · O&M · + OBBBA FY25', [100000000], [100000000], [100000000, 100000000], []]));
    w5Chk(name, 'variant B · FY25 + FY26', 'FY25 + FY26 = $400M: $100M executed, $300M planned, labelled planned + executed',
      J(calc(B.X, [2025, 2026])), J({ sel: [2025, 2026], t: [400000000, 100000000, 300000000], label: 'FY25, FY26 · O&M · FY25 planned, the rest executed' }));
    const PB = panel(B.X);
    w5Chk(name, 'variant B · FY25 + FY26 · the panel', 'says planned and executed money in one total, year by year, with each amount',
      J([/^Planned and executed money in one total\. FY25: O&M planned; FY26: O&M executed\./.test(PB.mix), /\$100\.00M executed, \$300\.00M planned\./.test(PB.mix)]), J([true, true]));
    w5Chk(name, 'variant B · FY25 + FY26 · the panel', 'the year chips agree: FY25 marked plan, FY26 not; and beside executed money no year is called PLANNED, not executed (Brad, 11 Oct)',
      J([PB.chips.filter(c => / \[on\]$/.test(c)), PB.planned]), J([['FY25 · plan [on]', 'FY26 [on]'], '']));
    const GB = await book(B.X);
    w5Chk(name, 'variant B · FY25 + FY26 · the export', 'US SERVICE FUNDING 400000000, O&M 400000000, TOTAL FUNDING 400000000 twice, the scope as the panel',
      J([GB.err, GB.scope, GB.us, GB.om, GB.tot]), J(['ok', 'Scope: FY25, FY26 · O&M · FY25 planned, the rest executed', [400000000], [400000000], [400000000, 400000000]]));
    w5Chk(name, 'variant B · FY25 + FY26 · the export', 'and a NOTE: planned and executed money in one total, FY25 planned, FY26 executed',
      J(GB.mixNote.map(t => t.startsWith('NOTE: planned and executed money in one total — FY25: O&M planned; FY26: O&M executed.'))), J([true]));
    w5Chk(name, 'variant B · wording', 'the matching rules no longer say the total is unchanged: each row once, in its effective year, execution never also from the plan',
      J([/total is unchanged/.test(PB.text), /Each row is counted once, in its effective year/.test(PB.text), /never also from the plan/.test(PB.text)]), J([false, true, true]));
    // saved with FY25 alone, reopened: still FY25, still planned, and the export writes the same scope
    B.X.ev(`flowCfg().fys=[2025]; save(); 'ok'`);
    const R = boot({ html: B.X.ev('buildSavedHtml()') });
    const RS = JSON.parse(R.ev(`(function(){ var F=flowCalc(); return JSON.stringify({saved:flowCfg().fys, sel:flowSelYears(), t:[F.tot, F.execV, F.planV], label:F.label}); })()`));
    w5Chk(name, 'variant B · saved FY25 only, reopened', 'the selection stays FY25 (never silently all years), $300M planned, labelled planned',
      J(RS), J({ saved: [2025], sel: [2025], t: [300000000, 0, 300000000], label: 'FY25 · O&M · PLANNED (board allocation, O&M)' }));
    const PR = panel(R), GR = await book(R);
    w5Chk(name, 'variant B · saved FY25 only, reopened', 'the FY25 chip is there, on, marked plan; the export writes the same scope and $300M',
      J([PR.chips.filter(c => / \[on\]$/.test(c)), GR.scope, GR.us]), J([['FY25 · plan [on]'], 'Scope: FY25 · O&M · PLANNED (board allocation, O&M)', [300000000]]));
    w5Chk(name, 'variant B · raw history', 'the execution rows are exactly as imported, in the board and in the reopened copy',
      J([B.X.ev('JSON.stringify(EXDB.all)') === J(B.ALL), R.ev('JSON.stringify(EXDB.all)') === J(B.ALL)]), J([true, true]));
    // ── VARIANT A: FY25 also holds a $40M row of its own ──
    const A = open([OWN, CARRY]);
    w5Chk(name, 'variant A · FY25', 'CONTROL — FY25 = $40M executed, $0 planned',
      J(calc(A.X, [2025])), J({ sel: [2025], t: [40000000, 40000000, 0], label: 'FY25 · O&M' }));
    w5Chk(name, 'variant A · FY26', 'FY26 = $100M executed, $0 planned',
      J(calc(A.X, [2026])), J({ sel: [2026], t: [100000000, 100000000, 0], label: 'FY26 · O&M · + OBBBA FY25' }));
    w5Chk(name, 'variant A · FY25 + FY26', 'FY25 + FY26 = $140M executed, $0 planned',
      J(calc(A.X, [2025, 2026])), J({ sel: [2025, 2026], t: [140000000, 140000000, 0], label: 'FY25, FY26 · O&M' }));
    const PA = panel(A.X), GA = await book(A.X);
    w5Chk(name, 'variant A · FY25 + FY26 · the panel', 'one kind of money: no planned-and-executed note, no year called PLANNED, neither chip marked plan',
      J([PA.mix, PA.planned, PA.chips.filter(c => / \[on\]$/.test(c))]), J(['', '', ['FY25 [on]', 'FY26 [on]']]));
    w5Chk(name, 'variant A · FY25 + FY26 · the export', 'the export agrees: US SERVICE FUNDING 140000000, O&M 140000000, TOTAL FUNDING 140000000 twice, no planned-and-executed NOTE',
      J([GA.err, GA.scope, GA.us, GA.om, GA.tot, GA.mixNote]), J(['ok', 'Scope: FY25, FY26 · O&M', [140000000], [140000000], [140000000, 140000000], []]));
    w5Chk(name, 'variant A · raw history', 'the execution rows are exactly as imported', A.X.ev('JSON.stringify(EXDB.all)') === J(A.ALL), true);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.00 (R1) ====
// ==== v2.00 (R1, Brad's decisions of 11 Oct): a mixed total is said by its money, with its amounts; stored rows apart from their effective year ====
// Brad, 11 Oct: "keep the mixed-funding export NOTE whenever the selected total includes both executed and planned money,
// including all-years views. Replace any contradictory whole-total 'PLANNED, not executed' box with accurate executed/planned
// amounts. Make the tooltip distinguish stored FY25 rows from their effective FY26 treatment."
// The R1 fixture: the board is on O&M, its five-year plan FY26-FY30; FY25 is offered because the workbook files rows under it.
// FY25's pot is $300M, FY26's $500M, FY27-FY30 were never planned and hold $0. One service, one requirement asking $900M, so a
// planned year reads its whole pot. The OBBBA rule is on: an FY25 O&M row whose Budget cell says OBBBA counts as FY26.
// E -- FY25 holds a $40M ordinary row. ALL YEARS = $40M executed (FY25) + $500M planned (FY26) = $540M: the export's NOTE and the
//      panel's box, a line per year; no box calls anything "PLANNED, not executed"; the panel says $40.00M and $500.00M.
// A -- FY25 holds the $40M row and a $100M OBBBA row. ALL YEARS = $140M executed and $0 planned: no NOTE, no box.
// B -- FY25 holds only the $100M OBBBA row. FY26 + FY27 = $100M executed, $0 planned: no NOTE. FY25 + FY26 = $100M executed and
//      $300M planned, said with both amounts, not "FY25 is PLANNED, not executed". FY25 alone = $300M, all planned, and still
//      says so (a CONTROL). The planned note and the FY25 button say its rows are stored under FY25 and counted in FY26.
// Every expected figure is the fixture's own arithmetic. FAILS ON e635775 for what the decisions change; CONTROLs pass there.
await (async () => {
  const name = 'v2.00 (R1) — mixed totals are said with their amounts, and stored rows apart from their effective year';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const POT = { 2025: 300000000, 2026: 500000000 };
    const row = (n, title, budget, amt) => { const r = Array(32).fill(''); r[0] = 2025; r[1] = '2025-03'; r[2] = 'JSF' + (400 + n); r[3] = title;
      r[4] = budget; r[7] = 'Event ' + title; r[9] = amt; r[10] = 'Allocated'; r[18] = 'Program (PSM)'; return r; };
    const CARRY = row(1, 'Carried Support', 'USAF O&M OBBBA Mandatory', 100000000), OWN = row(2, 'Depot Pods', 'USAF O&M Discretionary', 40000000);
    const open = rows => {
      const X = boot();
      seed(X.ev, { services: ['USAF'], items: [it('F1', 'PSM', [900000000])], disc: [POT[2026]], mand: [0], order: ['F1'] });
      X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
        var POT=${J(POT)}; MS.base=2026; MS.cur=2026; FYMON=fyMonths(2026); MS.years={};
        [2025,2026].forEach(function(y){ var st=JSON.parse(JSON.stringify(S)); st.bm={disc:[POT[y]], mand:[0], adds:[]}; st.discSvc=[POT[y]]; MS.years[y]=st; });
        applyState(MS.years[2026]); MS.years[2026]=S;
        EXDB.all=${J({ om: { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: rows } } })}; EXDB.ts=1;
        var C=flowCfg(); C.pseudo={on:true, label:'OBBBA', token:'OBBBA, Mandatory', from:2025, to:2026, col:4}; C.other={}; C.fys=null; C.aps=['om'];
        save(); 'ok'`);
      return X;
    };
    // the scope set as the year buttons leave it (null = ALL YEARS), then the total, the panel and the export of that scope
    const look = async (X, fys) => {
      const P = JSON.parse(X.ev(`(function(){ flowCfg().fys=${J(fys)}; var F=flowCalc(); flowOpen=true; flowBody(); var b=document.getElementById('flowBody'), m=b.querySelector('.flowmix');
        var pl=/(FY\\d\\d(?:, FY\\d\\d)*) (?:is|are) PLANNED, not executed/.exec(b.textContent);
        var note=[].slice.call(b.querySelectorAll('div')).filter(function(d){ return /A planned year covers/.test(d.textContent) && !d.querySelector('div'); }).map(function(d){ return d.textContent; });
        var tips={}; [].slice.call(b.querySelectorAll('button')).forEach(function(x){ if(/^FY\\d\\d/.test(x.textContent)) tips[x.textContent.slice(0,4)]=x.title; });
        return JSON.stringify({sel:flowSelYears(), t:[F.tot, F.execV, F.planV], mix:m? m.textContent : '', planned:pl? pl[1] : '', note:note, tips:tips}); })()`));
      const wb = JSON.parse(await w6Book(X.w, 'exportFlow')), ff = wb['Funds Flow'] || [];
      P.err = wb.__err || 'ok';
      P.us = ff.filter(r => w6Lbl(r) === 'US SERVICE FUNDING').map(r => num(r[1])).filter(v => v !== null);
      P.mixNote = ff.map(w6Lbl).filter(t => /^NOTE: planned and executed money in one total/.test(t));
      return P;
    };
    const ALLY = [2025, 2026, 2027, 2028, 2029, 2030];
    // ── E: FY25 executed, the later years planned, ALL YEARS ──
    const E = await look(open([OWN]), null);
    w5Chk(name, 'E · ALL YEARS', 'CONTROL — every year in scope; $540M = $40M executed (FY25) + $500M planned (FY26)',
      J([E.sel, E.t]), J([ALLY, [540000000, 40000000, 500000000]]));
    w5Chk(name, 'E · ALL YEARS · the export', 'kept: US SERVICE FUNDING 540000000 and the NOTE, a line per year in scope',
      J([E.err, E.us, E.mixNote]), J(['ok', [540000000], ['NOTE: planned and executed money in one total — FY25: O&M executed; FY26: O&M planned; '
        + 'FY27: O&M planned; FY28: O&M planned; FY29: O&M planned; FY30: O&M planned. Executed is the imported CCaR QPE; planned is O&M’s own allocation.']]));
    w5Chk(name, 'E · ALL YEARS · the panel', 'kept: the box says planned and executed money in one total, a line per year, $40.00M executed and $500.00M planned',
      E.mix, 'Planned and executed money in one total. FY25: O&M executed; FY26: O&M planned; FY27: O&M planned; FY28: O&M planned; '
        + 'FY29: O&M planned; FY30: O&M planned. Executed money is the imported CCaR QPE; planned money is O&M’s own allocation. $40.00M executed, $500.00M planned.');
    w5Chk(name, 'E · ALL YEARS · the panel', 'no year is called PLANNED, not executed beside $40M executed; the planned note states $40.00M executed and $500.00M planned',
      J([E.planned, E.note.length, E.note.map(t => t.startsWith('This total holds $40.00M executed and $500.00M planned. FY26, FY27, FY28, FY29, FY30 are planned years. '
        + 'Nothing in scope has executed in those years yet, so the chart reads O&M’s own allocation for them'))]), J(['', 1, [true]]));
    // ── A: every dollar executed; the planned years hold $0 ──
    const A = await look(open([OWN, CARRY]), null);
    w5Chk(name, 'A · ALL YEARS', 'CONTROL — $140M = $40M + $100M executed, $0 planned', J([A.sel, A.t]), J([ALLY, [140000000, 140000000, 0]]));
    w5Chk(name, 'A · ALL YEARS · the export', 'planned years holding $0 do not make a mix: US SERVICE FUNDING 140000000 and no planned-and-executed NOTE',
      J([A.err, A.us, A.mixNote]), J(['ok', [140000000], []]));
    w5Chk(name, 'A · ALL YEARS · the panel', 'no planned-and-executed box, no year called PLANNED, not executed; the planned note states $140.00M executed and $0.00M planned',
      J([A.mix, A.planned, A.note.map(t => t.startsWith('This total holds $140.00M executed and $0.00M planned. FY27, FY28, FY29, FY30 are planned years.'))]), J(['', '', [true]]));
    // ── B: the only FY25 O&M row is carried to FY26 ──
    const BX = open([CARRY]);
    const B67 = await look(BX, [2026, 2027]);
    w5Chk(name, 'B · FY26 + FY27', 'CONTROL — $100M executed (carried into FY26), $0 planned (FY27 never planned)',
      J([B67.sel, B67.t]), J([[2026, 2027], [100000000, 100000000, 0]]));
    w5Chk(name, 'B · FY26 + FY27 · the export', 'a planned year holding $0 beside an executed one: US SERVICE FUNDING 100000000 and no planned-and-executed NOTE',
      J([B67.err, B67.us, B67.mixNote]), J(['ok', [100000000], []]));
    w5Chk(name, 'B · FY26 + FY27 · the panel', 'no planned-and-executed box, no year called PLANNED, not executed; the planned note states $100.00M executed and $0.00M planned',
      J([B67.mix, B67.planned, B67.note.map(t => t.startsWith('This total holds $100.00M executed and $0.00M planned. FY27 is a planned year. Nothing in scope has executed in that year yet'))]),
      J(['', '', [true]]));
    const B56 = await look(BX, [2025, 2026]);
    w5Chk(name, 'B · FY25 + FY26', 'CONTROL — $400M = $100M executed + $300M planned', J([B56.sel, B56.t]), J([[2025, 2026], [400000000, 100000000, 300000000]]));
    w5Chk(name, 'B · FY25 + FY26 · the panel', 'not "FY25 is PLANNED, not executed" beside $100M executed: $100.00M executed and $300.00M planned, the FY25 rows stored under FY25 and counted in FY26',
      J([B56.planned, B56.note]), J(['', ['This total holds $100.00M executed and $300.00M planned. FY25 is a planned year. The rows stored under FY25 are counted in FY26 (OBBBA), '
        + 'so the chart reads O&M’s own allocation for it — what the board intends to fund, one line per requirement per funded service, the same grain the Spend Plan '
        + 'Source export uses. A planned year covers O&M only — another appropriation’s requirements are not reachable from this board.']]));
    w5Chk(name, 'B · FY25 + FY26', 'CONTROL — still said as both on the panel and in the export (the R1 block holds their words)',
      J([/\$100\.00M executed, \$300\.00M planned\.$/.test(B56.mix), B56.us, B56.mixNote.length]), J([true, [400000000], 1]));
    const B5 = await look(BX, [2025]);
    w5Chk(name, 'B · FY25 alone', 'CONTROL — $300M, all planned, and still called PLANNED, not executed; no planned-and-executed box or NOTE',
      J([B5.sel, B5.t, B5.planned, B5.mix, B5.us, B5.mixNote]), J([[2025], [300000000, 0, 300000000], 'FY25', '', [300000000], []]));
    w5Chk(name, 'B · FY25 alone · the planned note', 'says the rows stored under FY25 are counted in FY26, not that nothing has executed in it',
      J([B5.note.map(t => t.startsWith('FY25 is PLANNED, not executed. The rows stored under FY25 are counted in FY26 (OBBBA), so the chart reads O&M’s own allocation for it')),
        B5.note.some(t => /Nothing in scope has executed/.test(t))]), J([[true], false]));
    w5Chk(name, 'B · the FY25 button', 'its tooltip says the O&M rows are stored under FY25 and counted in FY26, so FY25 is read from its plan (never "no O&M execution imported")',
      B5.tips.FY25, 'FY2025: the O&M rows imported for it are stored under FY2025 and counted in FY2026 (OBBBA), so FY2025 O&M is read from its plan — this board’s own allocation');
    w5Chk(name, 'B · the FY26 and FY27 buttons', 'CONTROL — FY26 is answered from the import; FY27, with no rows stored under it, has no O&M execution imported',
      J([B5.tips.FY26, B5.tips.FY27]), J(['FY2026 is answered from the imported CCaR QPE', 'FY2027 has no O&M execution imported, so O&M is answered from this board’s own allocation']));
    // ── S: O&M has no FY25 rows; INITIAL SPARES' only FY25 row ("… Mandatory") is carried to FY26; both in scope, FY25 alone ──
    // The planned note explains why O&M's FY25 is read from its plan. It asks O&M's own rows, as the FY25 button does: Spares' carried
    // row is not that reason, and nothing in scope has executed in FY25 (adversarial review of this follow-up, 11 Oct).
    const SX = open([]);
    SX.ev(`EXDB.all.sp=${J({ asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: [row(3, 'Spares Kit', 'USAF Spares Initial Mandatory PSM', 70000000)] } })}; flowCfg().aps=['om','sp']; 'ok'`);
    const S5 = await look(SX, [2025]);
    w5Chk(name, 'S · O&M with no FY25 rows, Spares\' FY25 row carried · FY25 alone', 'CONTROL — $300M, all O&M planned (Spares\' $70M counts in FY26)',
      J([S5.sel, S5.t]), J([[2025], [300000000, 0, 300000000]]));
    w5Chk(name, 'S · O&M with no FY25 rows, Spares\' FY25 row carried · FY25 alone · the planned note', 'nothing in scope has executed in FY25; another appropriation\'s carried rows are not given as O&M\'s reason',
      J([S5.note.map(t => t.startsWith('FY25 is PLANNED, not executed. Nothing in scope has executed in that year yet')), S5.note.some(t => /stored under/.test(t))]), J([[true], false]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.00 (R1, Brad's decisions of 11 Oct) ====
// ==== v2.00 (U1): a row carried into a year neither imported nor planned is offered, and counted in ALL YEARS ====
// The board is on O&M, two services, its five-year plan FY27-FY31 (MS.base 2027); FY27's pot is USAF $350M + ANG $150M and one
// requirement asks more, so FY27 reads $500M planned; FY28-FY31 were never planned and hold $0. The OBBBA rule is on (FY25 ->
// FY26, Budget cell). No row is filed under FY26 and FY26 is outside the window. FY25 rows, each filed under FY25:
//   O&M  'Ordinary FY25 Support'  ANG O&M Discretionary        $40,000,000   Program (TSS)  -- counts in FY25
//   O&M  'Carried Support'        USAF O&M OBBBA               $100,000,000  Program (PSM)  -- counts in FY26
//   SP   'Carried Spares'         USAF Spares Initial Mandatory $20,000,000  Program (ATL)  -- counts in FY26
// Every expected figure is the fixture's own arithmetic. VARIANT A holds all three: ALL YEARS = 40 + 100 + 20 + 350 + 150 =
// $660M, $160M executed and $500M planned; FY26 alone = 100 + 20 = $120M. A2: every FY25 row is carried ($620M). A2P: A2 with an
// FY25 plan of USAF $30M + ANG $15M ($665M). A3: only Initial Spares carries ($560M). V4: only O&M carries, its carried row filed
// BEHIND an ordinary one ($640M) -- the money-level guard on the year scan stopping early. Saved FY26 alone and reopened, the
// selection stays FY26; saved FY25 alone (A, and A2P where every FY25 row is carried) or FY25 + FY27, it stays exactly that.
// CONTROLS: FY26 already offered (C(ii) window from FY26, C(iii) an O&M FY26 row, C(iii-b) a Full Fund FY26 row), and the rule
// off (C(iv)). Raw execution (EXDB.all) is read, never rewritten.
// THE INDEPENDENT ARITHMETIC AND THE SAVED-SELECTION CONTROLS (Brad, 12 Oct, 6:11 AM ET: "Preserve the independent arithmetic
// and saved-selection controls"). The U1 demonstration's board: O&M, one service, F1 asking $1,000M; plan window FY27-FY31,
// FY27's pot $500M, and a GENUINE own FY26 plan of $300M made the way a person makes one (switchYear(2026) answered Cancel, a
// blank year; F1 restored; its pot set; back to FY27). Workbook: Initial Spares FY25 'USAF Spares Initial Mandatory PSM' $100M,
// counted in FY26; O&M FY25 'USAF O&M Discretionary' $40M, counted in FY25. FY26 x {O&M, Initial Spares} = 300 + 100 = $400M,
// x O&M = $300M, x Initial Spares = $100M, each read three times on its own: the calculation, the panel's printed total and
// the exported workbook. Those reads answer window.confirm OK (a roll-forward copy, the worst case) and count it: it is never
// asked. The plan removed by the board's own 🗑 Reset FY26 to blank (resetYear), and separately as a year the board does not
// hold: 100 / 0 / 100, with no cloned budget (no figure of FY27's $500M, no plan row, the year not made), on the board and on a
// reopened copy. Saved FY25 alone, reopened, stays FY25 alone ($40M), with the plan held and after each removal. A DETECTOR
// CONTROL: a roll-forward clone made on purpose (switchYear answered OK) is seen by the same no-clone checks. Where EVERY FY25
// row is counted in FY26 (no O&M row at all), saved FY25 alone still reopens as FY25 alone: the case the R1 raw-years line in
// flowYears() is for (v200-r1-saved-year-widens).
// FAILS ON 4a6f7c7, 0c6ff00 and 63bd8b0 (U13), except the CONTROLs and the raw-history guards (in the demonstration, also the
// checks that nothing is asked or made, and Initial Spares alone holding no FY27 money): FY26 was not offered, so ALL YEARS was
// $540M and the $120M carried was in no year, on screen or in the export, and a saved FY26 selection silently became all years.
await (async () => {
  const name = 'v2.00 (U1) — a carried row is counted in an offered year and in ALL YEARS';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const row = (fy, title, budget, amt, office) => { const r = Array(32).fill(''); r[0] = fy; r[1] = fy + '-03'; r[2] = 'U1' + fy; r[3] = title;
      r[4] = budget; r[7] = 'Event ' + title; r[9] = amt; r[10] = 'Allocated'; r[18] = office; return r; };
    const OM_ORD = row(2025, 'Ordinary FY25 Support', 'ANG O&M Discretionary', 40000000, 'Program (TSS)');
    const OM_CARRY = row(2025, 'Carried Support', 'USAF O&M OBBBA', 100000000, 'Program (PSM)');
    const SP_CARRY = row(2025, 'Carried Spares', 'USAF Spares Initial Mandatory PSM', 20000000, 'Program (ATL)');
    const OM_26 = row(2026, 'FY26 Support', 'USAF O&M Discretionary', 7000000, 'Program (LOG)');
    const FF_26 = row(2026, 'FY26 Full Fund Buy', 'USAF Full Fund', 3000000, 'Program (ATL)');
    const CARRIED = ['Carried Spares', 'Carried Support'];
    // rows by appropriation, each in its own workbook year, in the order given
    const open = (rows, o = {}) => {
      const X = boot();
      seed(X.ev, { services: ['USAF', 'ANG'], items: [it('F1', 'PSM', [350000000, 150000000])], disc: [350000000, 150000000], mand: [0, 0], order: ['F1'] });
      const ALL = {};
      Object.keys(rows).forEach(a => { const by = {}; rows[a].forEach(r => { (by[r[0]] ||= []).push(r); }); ALL[a] = { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: by }; });
      X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
        S.bm={disc:[350000000,150000000], mand:[0,0], adds:[]}; MS.base=${o.base || 2027}; MS.cur=2027; FYMON=fyMonths(2027); MS.years={2027:S};
        var p25=${J(o.plan25 || null)}; if(p25){ var st=JSON.parse(JSON.stringify(S)); st.bm={disc:p25, mand:[0,0], adds:[]}; st.discSvc=p25.slice(); MS.years[2025]=st; }
        applyState(S); MS.years[2027]=S;
        EXDB.all=${J(ALL)}; EXDB.ts=1;
        var C=flowCfg(); C.pseudo={on:${o.off ? 'false' : 'true'}, label:'OBBBA', token:'OBBBA, Mandatory', from:2025, to:2026, col:4}; C.other={}; C.fys=null; C.aps=null;
        save(); 'ok'`);
      return { X, ALL };
    };
    const calc = (X, fys, aps) => JSON.parse(X.ev(`(function(){ flowCfg().fys=${J(fys)}; flowCfg().aps=${J(aps || null)}; flowSel=''; var F=flowCalc();
      return JSON.stringify({sel:flowSelYears(), t:[F.tot, F.execV, F.planV], appn:F.appn, label:F.label}); })()`));
    const offered = X => JSON.parse(X.ev(`JSON.stringify(flowYears())`));
    const recs = X => JSON.parse(X.ev(`(function(){ var F=flowCalc(), rows=F.prime.LM.rows.concat(F.prime.PW.rows);
      F.ext.keys.forEach(function(k){ rows=rows.concat(F.ext.by[k].rows); });
      return JSON.stringify(rows.filter(function(r){ return ${J(CARRIED)}.indexOf(r.ttl)>=0; })
        .map(function(r){ return [r.ttl, r.ap, r.fy, r.svc, r.pmoFull, r.v, !!r.plan]; }).sort()); })()`));
    const panel = X => JSON.parse(X.ev(`(function(){ flowOpen=true; flowSel=''; flowBody(); var b=document.getElementById('flowBody'), m=b.querySelector('.flowmix');
      var chips=[].slice.call(b.querySelectorAll('button')).filter(function(x){ return /^FY\\d\\d/.test(x.textContent); })
        .map(function(x){ return x.textContent+(x.classList.contains('on')? ' [on]' : ''); });
      var tf=/total funding \\$([\\d,]+\\.\\d\\d)M/.exec(b.textContent);
      return JSON.stringify({chips:chips, total:tf? tf[1] : '', mix:m? m.textContent : ''}); })()`));
    const cell = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c;
    const book = async X => { const wb = JSON.parse(await w6Book(X.w, 'exportFlow')), ff = wb['Funds Flow'] || [];
      const all = lab => ff.filter(r => w6Lbl(r) === lab).map(r => num(cell(r[1]))).filter(v => v !== null);
      const det = s => (wb[s] || []).slice(1).map(r => r.map(cell)).filter(r => CARRIED.indexOf(r[0]) >= 0);
      return { err: wb.__err || 'ok', scope: w6Lbl(ff[1] || []), tot: all('TOTAL FUNDING'), us: all('US SERVICE FUNDING'), usAp: all('US service appropriations'),
               lines: [all('O&M'), all('FULL FUND'), all('INITIAL SPARES'), all('OPN')], notes: ff.map(w6Lbl).filter(t => /^NOTE: /.test(t)),
               carried: det('Prime Detail').concat(det('OGC Detail')).sort() }; };
    const reopen = (X, fys) => { X.ev(`flowCfg().fys=${J(fys)}; flowCfg().aps=null; save(); 'ok'`); return boot({ html: X.ev('buildSavedHtml()') }); };
    const saved = R => JSON.parse(R.ev(`(function(){ var F=flowCalc(); return JSON.stringify({saved:flowCfg().fys, sel:flowSelYears(), t:[F.tot, F.execV, F.planV], label:F.label}); })()`));
    const CHIPS = ['FY25', 'FY26', 'FY27 · plan', 'FY28 · plan', 'FY29 · plan', 'FY30 · plan', 'FY31 · plan'];
    const YEARS = '[2025,2026,2027,2028,2029,2030,2031]';
    // ── VARIANT A: ordinary O&M, carried O&M behind it, carried Initial Spares ──
    const A = open({ om: [OM_ORD, OM_CARRY], sp: [SP_CARRY] });
    w5Chk(name, 'variant A · fixture', 'CONTROL — the board is on O&M, its plan from FY27; FY27 holds USAF $350M + ANG $150M; the rule carries FY25 OBBBA to FY26',
      A.X.ev(`mySlug()+'|'+MS.base+'|'+MS.cur+'|'+MS.years[2027].bm.disc.join('|')+'|'+flowPseudo().on+'|'+flowPseudo().from+'>'+flowPseudo().to`), 'om|2027|2027|350000000|150000000|true|2025>2026');
    w5Chk(name, 'variant A · year availability', 'FY26 is offered beside FY25 and the window, unmarked: O&M execution is counted in it',
      J([offered(A.X), panel(A.X).chips]), J([JSON.parse(YEARS), CHIPS]));
    w5Chk(name, 'variant A · ALL YEARS', 'ALL YEARS = 40 + 100 + 20 + 350 + 150 = $660M: $160M executed, $500M planned; O&M 640, Initial Spares 20',
      J(calc(A.X, null)), J({ sel: JSON.parse(YEARS), t: [660000000, 160000000, 500000000], appn: { om: 640000000, ff: 0, sp: 20000000, opn: 0 },
        label: 'FY25–FY31 · all years · all appropriations · FY27, FY28, FY29, FY30, FY31 planned, the rest executed' }));
    const PA = panel(A.X);
    w5Chk(name, 'variant A · ALL YEARS · the panel', 'total funding $660.00M; the planned-and-executed box names FY26 and says $160.00M executed, $500.00M planned',
      J([PA.total, /FY26: O&M, INITIAL SPARES executed/.test(PA.mix), /\$160\.00M executed, \$500\.00M planned\.$/.test(PA.mix)]), J(['660.00', true, true]));
    const GA = await book(A.X);
    w5Chk(name, 'variant A · ALL YEARS · the export', 'TOTAL FUNDING 660000000 twice, US SERVICE FUNDING 660000000, US service appropriations twice; O&M 640000000, FULL FUND 0, INITIAL SPARES 20000000, OPN 0',
      J([GA.err, GA.tot, GA.us, GA.usAp, GA.lines]), J(['ok', [660000000, 660000000], [660000000], [660000000, 660000000], [[640000000], [0], [20000000], [0]]]));
    w5Chk(name, 'variant A · ALL YEARS · the export', 'the years-added NOTE lists FY2026, and the planned-and-executed NOTE names it',
      J([GA.notes.some(t => /Fiscal years included: FY2025, FY2026, FY2027, FY2028, FY2029, FY2030, FY2031\.$/.test(t)),
         GA.notes.some(t => t.startsWith('NOTE: planned and executed money in one total') && /FY26: O&M, INITIAL SPARES executed/.test(t))]), J([true, true]));
    w5Chk(name, 'variant A · ownership', 'each carried row is counted once, in FY26, on its own appropriation, service, office and amount — in the calculation and the export detail',
      J([recs(A.X), GA.carried]), J([[['Carried Spares', 'sp', 2026, 'USAF', 'Program (ATL)', 20000000, false], ['Carried Support', 'om', 2026, 'USAF', 'Program (PSM)', 100000000, false]],
        [['Carried Spares', 'Event Carried Spares', 'INITIAL SPARES', 'ATL', 'USAF', 20000000, 'OBLIGATED'], ['Carried Support', 'Event Carried Support', 'O&M', 'PSM', 'USAF', 100000000, 'OBLIGATED']]]));
    w5Chk(name, 'variant A · each year alone', 'the offered years one at a time: 40 + 120 + 500 + 0 + 0 + 0 + 0 = $660M, each carried dollar in FY26 only',
      J(JSON.parse(YEARS).map(y => calc(A.X, [y]).t[0])), J([40000000, 120000000, 500000000, 0, 0, 0, 0]));
    w5Chk(name, 'variant A · ALL YEARS · O&M', 'O&M alone = 40 + 100 + 350 + 150 = $640M: $140M executed, $500M planned',
      J(calc(A.X, null, ['om']).t), J([640000000, 140000000, 500000000]));
    // saved FY26 alone, reopened: still FY26, its carried money, and the OBBBA NOTE
    const R26 = reopen(A.X, [2026]);
    w5Chk(name, 'variant A · saved FY26 only, reopened', 'the selection stays FY26 (never silently all years): 100 + 20 = $120M executed, the carried OBBBA named',
      J(saved(R26)), J({ saved: [2026], sel: [2026], t: [120000000, 120000000, 0], label: 'FY26 · all appropriations · + OBBBA FY25' }));
    const G26 = await book(R26);
    w5Chk(name, 'variant A · saved FY26 only, reopened · the export', 'the same scope, TOTAL FUNDING 120000000 twice, INITIAL SPARES 20000000, and the OBBBA NOTE with the amount',
      J([G26.err, G26.scope, G26.tot, G26.lines[2], G26.notes.some(t => t.startsWith('NOTE: includes 120000000 of OBBBA appropriated in FY2025 and counted here as FY2026'))]),
      J(['ok', 'Scope: FY26 · all appropriations · + OBBBA FY25', [120000000, 120000000], [20000000], true]));
    // saved FY25 alone, reopened: still FY25 alone -- FY26 is not added and the carried rows stay out of it
    const R25 = reopen(A.X, [2025]);
    w5Chk(name, 'variant A · saved FY25 only, reopened', 'CONTROL — the selection stays FY25 alone: $40M executed, the carried rows not in it',
      J([saved(R25), recs(R25)]), J([{ saved: [2025], sel: [2025], t: [40000000, 40000000, 0], label: 'FY25 · all appropriations' }, []]));
    const P25 = panel(R25), G25 = await book(R25);
    w5Chk(name, 'variant A · saved FY25 only, reopened', 'CONTROL — only the FY25 chip is on; the export writes the same scope, TOTAL FUNDING 40000000 twice, no carried row',
      J([P25.chips.filter(c => / \[on\]$/.test(c)), G25.scope, G25.tot, G25.carried]), J([['FY25 [on]'], 'Scope: FY25 · all appropriations', [40000000, 40000000], []]));
    // a list saved before FY26 was offered keeps exactly its years
    const R2527 = reopen(A.X, [2025, 2027]);
    w5Chk(name, 'variant A · saved FY25 + FY27, reopened', 'CONTROL — the selection stays FY25 + FY27 (FY26 not added): 40 + 500 = $540M',
      J([saved(R2527).sel, saved(R2527).t, panel(R2527).chips.filter(c => / \[on\]$/.test(c))]), J([[2025, 2027], [540000000, 40000000, 500000000], ['FY25 [on]', 'FY27 · plan [on]']]));
    w5Chk(name, 'variant A · raw history', 'the execution rows are exactly as imported, in the board and in each reopened copy',
      J([A.X, R26, R25, R2527].map(B => B.ev('JSON.stringify(EXDB.all)') === J(A.ALL))), J([true, true, true, true]));
    // ── A2: every FY25 row is carried ──
    const A2 = open({ om: [OM_CARRY], sp: [SP_CARRY] });
    w5Chk(name, 'A2 · ALL YEARS', 'every FY25 row carried: FY25 offered (marked plan), FY26 offered; 100 + 20 + 350 + 150 = $620M, $120M executed; O&M 600, Initial Spares 20',
      J([panel(A2.X).chips, calc(A2.X, null).t, calc(A2.X, null).appn]),
      J([['FY25 · plan', 'FY26', 'FY27 · plan', 'FY28 · plan', 'FY29 · plan', 'FY30 · plan', 'FY31 · plan'], [620000000, 120000000, 500000000], { om: 600000000, ff: 0, sp: 20000000, opn: 0 }]));
    // ── A2P: A2 with an FY25 plan; saved FY25 alone and reopened ──
    const A2P = open({ om: [OM_CARRY], sp: [SP_CARRY] }, { plan25: [30000000, 15000000] });
    w5Chk(name, 'A2P · ALL YEARS', 'FY25 reads its plan (every FY25 row counts in FY26): 100 + 20 + 30 + 15 + 350 + 150 = $665M, $120M executed, $545M planned',
      J(calc(A2P.X, null).t), J([665000000, 120000000, 545000000]));
    const RP = reopen(A2P.X, [2025]);
    w5Chk(name, 'A2P · saved FY25 only, reopened', 'CONTROL — the selection stays FY25 alone (never all years, never FY26): its $45M plan, the carried rows not in it',
      J([saved(RP), recs(RP)]), J([{ saved: [2025], sel: [2025], t: [45000000, 0, 45000000], label: 'FY25 · all appropriations · PLANNED (board allocation, O&M)' }, []]));
    const PP = panel(RP), GP = await book(RP);
    w5Chk(name, 'A2P · saved FY25 only, reopened', 'CONTROL — only the FY25 chip is on, marked plan; the export writes the same scope and TOTAL FUNDING 45000000 twice, no carried row',
      J([PP.chips.filter(c => / \[on\]$/.test(c)), GP.scope, GP.tot, GP.carried]),
      J([['FY25 · plan [on]'], 'Scope: FY25 · all appropriations · PLANNED (board allocation, O&M)', [45000000, 45000000], []]));
    // ── A3: only Initial Spares carries ──
    const A3 = open({ om: [OM_ORD], sp: [SP_CARRY] });
    w5Chk(name, 'A3 · ALL YEARS', 'only another appropriation carries: FY26 offered, marked plan for O&M; 40 + 20 + 350 + 150 = $560M, $60M executed; Initial Spares 20',
      J([panel(A3.X).chips[1], calc(A3.X, null).t, calc(A3.X, null).appn.sp]), J(['FY26 · plan', [560000000, 60000000, 500000000], 20000000]));
    // ── V4: only O&M carries, its carried row behind an ordinary one ──
    const V4 = open({ om: [OM_ORD, OM_CARRY] });
    w5Chk(name, 'V4 · ALL YEARS', 'the carried row is behind an ordinary one and nothing else carries: FY26 offered; 40 + 100 + 350 + 150 = $640M, $140M executed; FY26 alone $100M',
      J([offered(V4.X), calc(V4.X, null).t, calc(V4.X, [2026]).t]), J([JSON.parse(YEARS), [640000000, 140000000, 500000000], [100000000, 100000000, 0]]));
    const GV = await book(V4.X);
    w5Chk(name, 'V4 · FY26 · the export', 'TOTAL FUNDING 100000000 twice, O&M 100000000, the carried row in the detail',
      J([GV.err, GV.tot, GV.lines[0], GV.carried.map(r => r[0])]), J(['ok', [100000000, 100000000], [100000000], ['Carried Support']]));
    // ── CONTROLS: FY26 already offered, or the rule off ──
    const Cii = open({ om: [OM_CARRY, OM_ORD], sp: [SP_CARRY] }, { base: 2026 });
    w5Chk(name, 'C(ii) · window from FY26', 'CONTROL — ALL YEARS $660M; FY26 $120M',
      J([calc(Cii.X, null).t[0], calc(Cii.X, [2026]).t[0]]), J([660000000, 120000000]));
    const Ciii = open({ om: [OM_CARRY, OM_ORD, OM_26], sp: [SP_CARRY] });
    w5Chk(name, 'C(iii) · an O&M FY26 row', 'CONTROL — ALL YEARS 660 + 7 = $667M; FY26 100 + 20 + 7 = $127M',
      J([calc(Ciii.X, null).t[0], calc(Ciii.X, [2026]).t[0]]), J([667000000, 127000000]));
    const Ciiib = open({ om: [OM_CARRY, OM_ORD], sp: [SP_CARRY], ff: [FF_26] });
    w5Chk(name, 'C(iii-b) · a Full Fund FY26 row', 'CONTROL — ALL YEARS 660 + 3 = $663M; FY26 100 + 20 + 3 = $123M',
      J([calc(Ciiib.X, null).t[0], calc(Ciiib.X, [2026]).t[0]]), J([663000000, 123000000]));
    const Civ = open({ om: [OM_CARRY, OM_ORD], sp: [SP_CARRY] }, { off: true });
    w5Chk(name, 'C(iv) · the rule off', 'CONTROL — nothing carries: FY26 not offered; ALL YEARS $660M; FY25 100 + 40 + 20 = $160M',
      J([offered(Civ.X), calc(Civ.X, null).t[0], calc(Civ.X, [2025]).t[0]]), J([[2025, 2027, 2028, 2029, 2030, 2031], 660000000, 160000000]));
    // ── THE INDEPENDENT ARITHMETIC: a genuine own FY26 plan beside another appropriation's carried row ──
    const NM = { om: 'O&M', sp: 'Initial Spares' }, nm = aps => aps.map(a => NM[a]).join(' + ');
    const DEMO_SP = row(2025, 'Demo Carried Spares', 'USAF Spares Initial Mandatory PSM', 100000000, 'Program (ATL)');
    const DEMO_OM = row(2025, 'Demo Ordinary Support', 'USAF O&M Discretionary', 40000000, 'Program (TSS)');
    const demo = withOm => {
      const X = boot();
      seed(X.ev, { services: ['USAF'], items: [it('F1', 'PSM', [1000000000])], disc: [500000000], mand: [0], order: ['F1'] });
      const ALL = { sp: { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: [DEMO_SP] } } };
      if (withOm) ALL.om = { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: [DEMO_OM] } };
      X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
        S.bm={disc:[500000000], mand:[0], adds:[]}; MS.base=2027; MS.cur=2027; FYMON=fyMonths(2027); MS.years={2027:S};
        applyState(S); MS.years[2027]=S;
        EXDB.all=${J(ALL)}; EXDB.ts=1;
        var C=flowCfg(); C.pseudo={on:true, label:'OBBBA', token:'OBBBA, Mandatory', from:2025, to:2026, col:4}; C.other={}; C.fys=null; C.aps=null;
        save(); 'ok'`);
      return { X, ALL };
    };
    // window.confirm answering `ans`, every question counted and kept
    const counted = (w, ans) => { w.__cc = 0; w.__ccMsgs = []; w.confirm = m => { w.__cc++; w.__ccMsgs.push(String(m)); return ans; }; };
    // the exported workbook read back from its bytes; window.confirm is left as it is, so the count covers the export too
    const dBook = async X => { const wb = JSON.parse(await X.w.eval(`(async function(){ var cap=null, _B=window.Blob;
        window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
        try{ exportFlow(); }catch(e){ window.Blob=_B; return JSON.stringify({__err:'threw '+String((e&&e.message)||e)}); }
        window.Blob=_B; if(!cap) return JSON.stringify({__err:'no file'});
        var ab=cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength); return JSON.stringify(await xlsxRead(ab)); })()`));
      const ff = wb['Funds Flow'] || [], all = lab => ff.filter(r => w6Lbl(r) === lab).map(r => num(cell(r[1]))).filter(v => v !== null);
      return { err: wb.__err || 'ok', scope: w6Lbl(ff[1] || []), tot: all('TOTAL FUNDING'), us: all('US SERVICE FUNDING'), om: all('O&M'), sp: all('INITIAL SPARES'),
               nums: Object.keys(wb).filter(s => s !== '__err').flatMap(s => wb[s].flatMap(r => (r || []).map(cell).filter(v => typeof v === 'number'))) }; };
    // the calculation's own figures and rows, and the panel's $M figures, for "no figure is FY27's $500M"
    const dNums = X => JSON.parse(X.ev(`(function(){ var F=flowCalc(), rows=F.prime.LM.rows.concat(F.prime.PW.rows);
      F.ext.keys.forEach(function(k){ rows=rows.concat(F.ext.by[k].rows); });
      return JSON.stringify({nums:[F.tot,F.grand,F.us,F.execV,F.planV].concat(Object.keys(F.appn).map(function(k){ return F.appn[k]; })).concat(rows.map(function(r){ return r.v; })),
        plan:rows.filter(function(r){ return !!r.plan; }).length, titles:rows.map(function(r){ return r.ttl; }).sort()}); })()`));
    const dPanelM = X => { X.ev(`flowOpen=true; flowSel=''; flowBody(); 'ok'`);
      return [...X.w.document.getElementById('flowBody').textContent.matchAll(/\$([\d,]+\.\d\d)M/g)].map(m => m[1]); };
    const y26 = X => JSON.parse(X.ev(`JSON.stringify(MS.years[2026]? {disc:MS.years[2026].discSvc, order:MS.years[2026].order, removed:MS.years[2026].removed, own:MS.years[2026]!==MS.years[2027]} : 'not held')`));
    const D = demo(true), DX = D.X;
    counted(DX.w, false);                                   // "FY26 has no data yet": Cancel, a BLANK year
    DX.ev(`switchYear(2026); 'ok'`);
    if (JSON.parse(DX.ev('JSON.stringify(S.removed)')).indexOf('F1') >= 0) DX.ev(`restoreReq('F1'); 'ok'`);
    DX.ev(`bmSetBase('disc', 0, '300000000'); switchYear(2027); 'ok'`);
    w5Chk(name, 'demo · fixture', 'CONTROL — a genuine own FY26 plan made on the product path: one question (FY26 has no data yet), answered Cancel; FY26 pot $300M in its own year, F1 on it; FY27 pot $500M; the workbook files FY25 only',
      J([DX.w.__cc, /^FY26 has no data yet/.test(DX.w.__ccMsgs[0] || ''), y26(DX), JSON.parse(DX.ev('JSON.stringify([MS.years[2027].discSvc, flowExecYears(null, true)])'))]),
      J([1, true, { disc: [300000000], order: ['F1'], removed: [], own: true }, [[500000000], [2025]]]));
    counted(DX.w, true);                                    // from here on every question is answered OK -- a roll-forward copy -- and counted
    const ARITH = [[['om', 'sp'], [400000000, 100000000, 300000000], { om: 300000000, ff: 0, sp: 100000000, opn: 0 }, '400.00', [300000000], [100000000]],
                   [['om'], [300000000, 0, 300000000], { om: 300000000, ff: 0, sp: 0, opn: 0 }, '300.00', [300000000], []],
                   [['sp'], [100000000, 100000000, 0], { om: 0, ff: 0, sp: 100000000, opn: 0 }, '100.00', [], [100000000]]];
    for (const [aps, t, appn, pm, om, sp] of ARITH) {
      const F = calc(DX, [2026], aps), P = panel(DX), B = await dBook(DX), tot = t[0];
      w5Chk(name, 'demo · FY26 × ' + nm(aps), `the calculation: ${tot} ($${t[1]} executed, $${t[2]} planned), by appropriation`,
        J([F.sel, F.t, F.appn]), J([[2026], t, appn]));
      w5Chk(name, 'demo · FY26 × ' + nm(aps), `read on its own from the panel: total funding $${pm}M; and from the exported workbook: TOTAL FUNDING ${tot} twice, US SERVICE FUNDING ${tot}, O&M ${J(om)}, INITIAL SPARES ${J(sp)}`,
        J([P.total, B.err, B.tot, B.us, B.om, B.sp]), J([pm, 'ok', [tot, tot], [tot], om, sp]));
    }
    const DA = calc(DX, null, null), DAB = await dBook(DX);
    w5Chk(name, 'demo · ALL YEARS with the plan', 'ALL YEARS = 40 + 100 + 300 + 500 = $940M: $140M executed, $800M planned; the export TOTAL FUNDING 940000000 twice',
      J([DA.t, DAB.tot]), J([[940000000, 140000000, 800000000], [940000000, 940000000]]));
    w5Chk(name, 'demo · the reads asked nothing', 'window.confirm was not called by any of these reads (the calculation, the panel, the export), and FY26 and FY27 are as they were',
      J([DX.w.__cc, y26(DX), JSON.parse(DX.ev('JSON.stringify(MS.years[2027].discSvc)'))]), J([0, { disc: [300000000], order: ['F1'], removed: [], own: true }, [500000000]]));
    // saved FY25 alone, reopened, with the plan held: FY25 alone
    const DR25 = reopen(DX, [2025]); counted(DR25.w, true);
    const DP25 = panel(DR25), DB25 = await dBook(DR25);
    w5Chk(name, 'demo · saved FY25 only, reopened', 'CONTROL — the selection stays FY25 alone: $40M executed, the carried row not in it; only the FY25 chip on; the export writes the same scope and TOTAL FUNDING 40000000 twice',
      J([saved(DR25), dNums(DR25).titles, DP25.chips.filter(c => / \[on\]$/.test(c)), DB25.scope, DB25.tot, DR25.w.__cc]),
      J([{ saved: [2025], sel: [2025], t: [40000000, 40000000, 0], label: 'FY25 · all appropriations' }, ['Demo Ordinary Support'], ['FY25 [on]'], 'Scope: FY25 · all appropriations', [40000000, 40000000], 0]));
    // the plan removed by the board's own 🗑 Reset FY26 to blank
    counted(DX.w, true);
    DX.ev(`flowCfg().fys=null; flowCfg().aps=null; switchYear(2026); 'ok'`); const askSwitch = DX.w.__cc;
    DX.ev(`resetYear(); 'ok'`); const askReset = DX.w.__cc, msgReset = DX.w.__ccMsgs[0] || '';
    DX.ev(`switchYear(2027); 'ok'`);
    w5Chk(name, 'demo · removed by 🗑 Reset FY26 to blank', 'CONTROL — switching to the existing FY26 asked nothing; Reset asked once ("Reset FY26 to BLANK?"); FY26 is blank -- pot 0, no requirement, F1 in Removed -- and still its own year; back on FY27',
      J([askSwitch, askReset, /^Reset FY26 to BLANK\?/.test(msgReset), DX.w.__cc, JSON.parse(DX.ev('MS.cur')), y26(DX)]),
      J([0, 1, true, 1, 2027, { disc: [0], order: [], removed: ['F1'], own: true }]));
    const removedReads = async (B, tag, held) => {
      counted(B.w, true);
      for (const [aps, tot, pm] of [[['om', 'sp'], 100000000, '100.00'], [['om'], 0, '0.00'], [['sp'], 100000000, '100.00']]) {
        const F = calc(B, [2026], aps), P = panel(B), X2 = await dBook(B), N = dNums(B), M = dPanelM(B);
        w5Chk(name, `demo · ${tag} · FY26 × ${nm(aps)}`, `${tot} in the calculation (all executed), the panel ($${pm}M) and the export (TOTAL FUNDING twice)`,
          J([F.sel, F.t, P.total, X2.err, X2.tot]), J([[2026], [tot, tot, 0], pm, 'ok', [tot, tot]]));
        w5Chk(name, `demo · ${tag} · FY26 × ${nm(aps)}`, 'no cloned budget: no figure is FY27\'s $500M -- the calculation, every exported cell, the panel\'s $M figures -- and no plan row',
          J([N.nums.filter(v => v === 500000000), X2.nums.filter(v => v === 500000000), M.filter(m => m === '500.00'), N.plan]), J([[], [], [], 0]));
      }
      const A = calc(B, null, null);
      w5Chk(name, `demo · ${tag} · ALL YEARS`, 'ALL YEARS = 40 + 100 + 500 = $640M: $140M executed, $500M planned', J(A.t), J([640000000, 140000000, 500000000]));
      w5Chk(name, `demo · ${tag} · nothing made`, `no FY26 plan record; FY26 ${held ? 'still the blank year Reset left' : 'still not a year the board holds'}; window.confirm not called by the reads`,
        J([JSON.parse(B.ev(`JSON.stringify(flowPlanRecs(2026,'om'))`)), y26(B), B.w.__cc]),
        J([[], held ? { disc: [0], order: [], removed: ['F1'], own: true } : 'not held', 0]));
    };
    // saved FY25 alone, reopened, after the plan is removed: still FY25 alone, $40M (the second half of the saved-FY25 control)
    const removed25 = async (B, tag, held) => {
      const R = reopen(B, [2025]); counted(R.w, true);
      const P = panel(R), G = await dBook(R);
      w5Chk(name, `demo · ${tag} · saved FY25 only, reopened`, 'CONTROL — the selection stays FY25 alone: $40M executed, the carried row not in it; only the FY25 chip on; the export writes the same scope and TOTAL FUNDING 40000000 twice; nothing asked',
        J([saved(R), dNums(R).titles, P.chips.filter(c => / \[on\]$/.test(c)), G.err, G.scope, G.tot, R.w.__cc]),
        J([{ saved: [2025], sel: [2025], t: [40000000, 40000000, 0], label: 'FY25 · all appropriations' }, ['Demo Ordinary Support'], ['FY25 [on]'], 'ok', 'Scope: FY25 · all appropriations', [40000000, 40000000], 0]));
      w5Chk(name, `demo · ${tag} · saved FY25 only, reopened`, `CONTROL — the reopened copy holds FY26 as the board left it (${held ? 'the blank year Reset left' : 'not a year it holds'}); the execution rows exactly as imported; no error`,
        J([y26(R), R.ev('JSON.stringify(EXDB.all)') === J(D.ALL), R.errors.length]), J([held ? { disc: [0], order: [], removed: ['F1'], own: true } : 'not held', true, 0]));
    };
    await removedReads(DX, 'reset to blank', true);
    DX.ev(`flowCfg().fys=null; flowCfg().aps=null; save(); 'ok'`);
    const DRR = boot({ html: DX.ev('buildSavedHtml()') });
    await removedReads(DRR, 'reset to blank, reopened', true);
    await removed25(DX, 'reset to blank', true);
    // the plan removed as a year the board does not hold (no product path deletes a year; the state is removed and saved)
    const E = demo(true), EX = E.X;
    counted(EX.w, false); EX.ev(`switchYear(2026); 'ok'`);
    if (JSON.parse(EX.ev('JSON.stringify(S.removed)')).indexOf('F1') >= 0) EX.ev(`restoreReq('F1'); 'ok'`);
    EX.ev(`bmSetBase('disc', 0, '300000000'); switchYear(2027); delete MS.years[2026]; save(); 'ok'`);
    await removedReads(EX, 'not held', false);
    EX.ev(`flowCfg().fys=null; flowCfg().aps=null; save(); 'ok'`);
    const ERR = boot({ html: EX.ev('buildSavedHtml()') });
    await removedReads(ERR, 'not held, reopened', false);
    await removed25(EX, 'not held', false);
    w5Chk(name, 'demo · raw history', 'the execution rows are exactly as imported, and no board or reopened copy reported an error',
      J([[DX, DR25, DRR, EX, ERR].map(B => B.ev('JSON.stringify(EXDB.all)') === J(D.ALL)), [DX, DR25, DRR, EX, ERR].map(B => B.errors.length)]),
      J([[true, true, true, true, true], [0, 0, 0, 0, 0]]));
    // DETECTOR CONTROL: a cloned budget, when one IS made, is seen by the same checks. On the board where FY26 is not held,
    // switchYear(2026) answered OK -- the roll-forward copy of FY27 -- and back to FY27: FY26 is held again, holding FY27's $500M.
    counted(EX.w, true); EX.ev(`switchYear(2026); switchYear(2027); 'ok'`); const askClone = EX.w.__cc;
    const CF = calc(EX, [2026], ['om']), CN = dNums(EX), CB = await dBook(EX), CM = dPanelM(EX);
    w5Chk(name, 'demo · detector control · a roll-forward clone made on purpose', 'CONTROL — switching to FY26 asked once, answered OK, and the reads after it asked nothing; FY26 is now held, a copy of FY27: pot $500M, F1 on it',
      J([askClone, EX.w.__cc, y26(EX)]), J([1, 1, { disc: [500000000], order: ['F1'], removed: [], own: true }]));
    w5Chk(name, 'demo · detector control · a roll-forward clone made on purpose', 'the no-clone checks see it: FY26 × O&M = $500M planned, and a figure of $500M in the calculation, in the export and on the panel, and a plan row',
      J([CF.t, CN.nums.indexOf(500000000) >= 0, CB.nums.indexOf(500000000) >= 0, CM.indexOf('500.00') >= 0, CN.plan > 0]), J([[500000000, 0, 500000000], true, true, true, true]));
    // From here on EX holds the FY26 clone made above, on purpose; nothing below reads EX.
    // ── SAVED FY25 ALONE WHERE EVERY FY25 ROW IS COUNTED IN FY26 (no O&M row at all) ──
    const H = demo(false), HX = H.X;
    w5Chk(name, 'demo · every FY25 row carried · fixture', 'CONTROL — the workbook files FY25 only, and holds no O&M row',
      HX.ev(`JSON.stringify([flowExecYears(null, true), !!EXDB.all.om])`), J([[2025], false]));
    const HR = reopen(HX, [2025]); counted(HR.w, true);
    const HP = panel(HR);
    w5Chk(name, 'demo · every FY25 row carried · saved FY25 only, reopened', 'CONTROL — still FY25 alone (never all years): $0, its only row is counted in FY26, and O&M FY25 is read from its plan, which holds none; only the FY25 chip on, marked plan',
      J([saved(HR), HP.chips.filter(c => / \[on\]$/.test(c)), HR.errors.length, HR.w.__cc]),
      J([{ saved: [2025], sel: [2025], t: [0, 0, 0], label: 'FY25 · all appropriations · PLANNED (board allocation, O&M)' }, ['FY25 · plan [on]'], 0, 0]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.00 (U1) ====
// ==== v2.00 (U14): ALL YEARS holds every plan the board holds; a saved year selection is kept, never swapped for ALL YEARS ====
// Brad, 12 Oct, 6:00 AM ET: "For U14, I choose ALL YEARS to include genuine stored plans and execution by effective year within
// the selected appropriations. Never create or copy a budget merely because a year becomes available. Explicit saved selections
// must never silently switch to ALL YEARS; retain an unavailable selection with a clear notice."
// The board is on O&M, one service, F1 asking $1,000M; the year worked is FY27, pot $500M. Its own FY26 plan, $300M, is made the
// way a person makes one: base year 2026 (Set base year), switchYear(2026) answered Cancel (a blank year), F1 restored, the pot
// set, back to FY27, and the base year moved back to 2027 where the cell says so. Workbook: O&M FY25 'USAF O&M Discretionary'
// $40M, always; by cell, Initial Spares FY25 'USAF Spares Initial Mandatory PSM' $100M, counted in FY26 only with the carryover
// rule on. Every expected figure is the fixture's own arithmetic; the panel, the export and the calculation are read apart.
// THE MONEY, window FY27-FY31, FY26 outside it: the plan held, FY26 is offered and its $300M counted -- 40 + 300 + 500 = $840M,
// and 40 + 100 + 300 + 500 = $940M with the carried row (rule off or on). No plan held, FY26 is offered only where a row is
// counted in it (U1). Each year alone adds up to ALL YEARS. NOTHING IS MADE: MS.years is byte-identical across every read --
// the calculation, the panel, the export -- the reads never ask window.confirm, and 🗑 Reset FY26 to blank and the base-year
// move make no year. A year Reset to blank is still a year the board holds: offered, $0.
// THE LABEL: "FY25, FY27–FY31 · all years" where FY26 is not offered -- never a dash across it -- and "the rest executed" only
// of years with execution counted in them.
// THE SAVED SELECTION: a saved FY26 stays FY26 ($300M) when the base year moves or the rule is switched off while the plan is held.
// Where FY26 is then not available at all (no plan held, no row filed or counted in it, outside the window), the saved FY26 is
// KEPT in the saved selection, byte for byte through reads, save and reopen; it is not counted, and it is said -- in the label
// (the panel, the chart, the export's Scope line), the panel's notice and the export's NOTE -- with what is counted instead.
// While a saved year is kept so, a toggle starts from the saved selection and never drops it -- a year switched on (S5b, S5c) or
// off (S5c, S5d) -- the years counted beside it stay lit, and only ALL YEARS (S5b) or a year's "only" (S5c) chooses again, as the
// notice says. Two such years are said in the plural, "keeps them" (S5d). (With no such year, every offered year switched on is
// ALL YEARS, as before.)
// CONTROL: the window from FY26, where nothing is outside it.
// FAILS ON 0c6ff00 and 63bd8b0 (U13) alike, and on the U1 commit, wherever the behaviour changed: the FY26 plan was in no year
// ($540M or $640M), the label's dash ran across FY26, a saved FY26 (or FY24 + FY26) became ALL YEARS with nothing said, a saved
// FY25 + FY26 lost FY26 and $300M with nothing said, a toggle on or off dropped a saved FY26, and the first read of a year wrote
// an empty mark list into it -- so every cell's nothing-made check fails on all three, the CONTROL cell's too, and S5d's.
// Passing on all three: each cell's fixture, the no-plan cells' money and FY26 (not their label), the CONTROL cell's money,
// label and FY26, Reset's one question (S4e), the checks that the base-year move, Reset and the S5a sequence make no year, and
// a year's "only" beside the saved FY26 (S5c: it chose again before U14 too; the notice now promises it). On the U1 commit
// also: the plan held with a carried row and the rule on (FY26 offered by the row), and S5a's rule back on.
await (async () => {
  const name = 'v2.00 (U14) — ALL YEARS holds every plan the board holds; a saved year selection is kept and said';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify, M = 1000000;
    const row = (fy, title, budget, amt, office) => { const r = Array(32).fill(''); r[0] = fy; r[1] = fy + '-03'; r[2] = 'U14' + fy; r[3] = title;
      r[4] = budget; r[7] = 'Event ' + title; r[9] = amt; r[10] = 'Allocated'; r[18] = office; return r; };
    const WB = carried => { const a = { om: { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: [row(2025, 'Ordinary Support', 'USAF O&M Discretionary', 40 * M, 'Program (TSS)')] } } };
      if (carried) a.sp = { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: [row(2025, 'Carried Spares', 'USAF Spares Initial Mandatory PSM', 100 * M, 'Program (ATL)')] } };
      return a; };
    // window.confirm answering `ans`, every question counted and kept
    const counted = (w, ans) => { w.__cc = 0; w.__ccMsgs = []; w.confirm = m => { w.__cc++; w.__ccMsgs.push(String(m)); return ans; }; };
    const setBase = (X, y) => { X.w.prompt = () => String(y); X.ev(`setBaseYear(); 'ok'`); X.w.prompt = () => null; };
    // { base: 2027|2026, rule: true|false, plan: true|false, carried: true|false }
    const build = c => {
      const X = boot();
      seed(X.ev, { services: ['USAF'], items: [it('F1', 'PSM', [1000 * M])], disc: [500 * M], mand: [0], order: ['F1'] });
      X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
        S.bm={disc:[${500 * M}], mand:[0], adds:[]}; MS.base=2027; MS.cur=2027; FYMON=fyMonths(2027); MS.years={2027:S};
        applyState(S); MS.years[2027]=S; EXDB.all=${J(WB(c.carried))}; EXDB.ts=1;
        var C=flowCfg(); delete C.pseudo; C.other={}; C.fys=null; C.aps=null; save(); 'ok'`);
      counted(X.w, false);                                  // "FY26 has no data yet": Cancel, a BLANK year
      if (c.plan || c.base === 2026) setBase(X, 2026);
      if (c.plan) {
        X.ev(`switchYear(2026); 'ok'`);
        if (JSON.parse(X.ev('JSON.stringify(S.removed)')).indexOf('F1') >= 0) X.ev(`restoreReq('F1'); 'ok'`);
        X.ev(`bmSetBase('disc', 0, '${300 * M}'); switchYear(2027); 'ok'`);
        if (c.base === 2027) setBase(X, 2027);
      }
      if (c.rule) X.ev(`flowSetPseudo('on', true); 'ok'`);
      const asked = X.w.__cc;
      counted(X.w, true);                                   // from here on every question is answered OK -- a roll-forward copy -- and counted
      return { X, asked, wb: J(WB(c.carried)) };
    };
    const ms = X => X.ev('JSON.stringify(MS.years)');
    const fys = X => X.ev('JSON.stringify(flowCfg().fys)');
    const now = X => JSON.parse(X.ev(`(function(){ var F=flowCalc(); return JSON.stringify({stored:flowCfg().fys, offered:flowYears(), sel:flowSelYears(),
      t:[F.tot, F.execV, F.planV], label:F.label}); })()`));
    const panel = X => { X.ev(`flowOpen=true; flowSel=''; flowBody(); 'ok'`);
      const b = X.w.document.getElementById('flowBody'), btn = [...b.querySelectorAll('button')], n = b.querySelector('.flowunavail'), svg = b.querySelector('#flowSvg');
      const tf = /total funding \$([\d,]+\.\d\d)M/.exec(b.textContent);
      return { total: tf ? tf[1] : '', allOn: btn.filter(x => x.getAttribute('onclick') === 'flowAllYears()').map(x => x.classList.contains('on'))[0],
        chips: btn.filter(x => /^flowToggleYear\(\d+\)$/.test(x.getAttribute('onclick') || '')).map(x => x.textContent + (x.classList.contains('on') ? ' [on]' : '')),
        notice: n ? n.textContent : '', chart: svg ? svg.getAttribute('aria-label') : '', drawn: svg ? svg.textContent : '' }; };
    const cell = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c;
    // the exported workbook read back from its bytes; window.confirm is left as it is, so the count covers the export too
    const book = async X => { const wb = JSON.parse(await X.w.eval(`(async function(){ var cap=null, _B=window.Blob;
        window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
        try{ exportFlow(); }catch(e){ window.Blob=_B; return JSON.stringify({__err:'threw '+String((e&&e.message)||e)}); }
        window.Blob=_B; if(!cap) return JSON.stringify({__err:'no file'});
        var ab=cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength); return JSON.stringify(await xlsxRead(ab)); })()`));
      const ff = wb['Funds Flow'] || [], all = lab => ff.filter(r => w6Lbl(r) === lab).map(r => num(cell(r[1]))).filter(v => v !== null);
      return { err: wb.__err || 'ok', scope: w6Lbl(ff[1] || []), tot: all('TOTAL FUNDING'), notes: ff.map(w6Lbl).filter(t => /^NOTE: /.test(t)) }; };
    const click = (X, onclick) => { X.ev(`flowOpen=true; flowBody(); 'ok'`);
      const b = [...X.w.document.querySelectorAll('#flowBody button')].find(x => x.getAttribute('onclick') === onclick);
      if (!b) return false; b.click(); return true; };
    const reopen = X => { X.ev(`save(); 'ok'`); const R = boot({ html: X.ev('buildSavedHtml()') }); counted(R.w, true); return R; };
    const O27 = [2025, 2027, 2028, 2029, 2030, 2031], O27W = [2025, 2026, 2027, 2028, 2029, 2030, 2031], O26 = [2025, 2026, 2027, 2028, 2029, 2030];
    const PL = 'PLANNED (board allocation, O&M)';
    const N26 = 'The saved year selection includes FY26, which this board cannot answer for now: it holds no plan for that year, no imported row is filed or counted in it, and it is outside the plan window (FY27–FY31). It stays in the saved selection';
    const X26 = 'NOTE: The saved year selection includes FY2026, which this board cannot answer for now: it holds no plan for that year, no imported row is filed or counted in it, and it is outside the plan window (FY2027–FY2031). It stays in the saved selection';
    // ── ALL YEARS, cell by cell: [where, the cell, offered, [total, executed, planned], FY26 alone, the label] ──
    const CELLS = [
      ['the plan held, rule off', { base: 2027, rule: false, plan: true, carried: false }, O27W, [840, 40, 800], [300, 0, 300],
        'FY25–FY31 · all years · all appropriations · FY26, FY27, FY28, FY29, FY30, FY31 planned, the rest executed'],
      ['no plan, rule off', { base: 2027, rule: false, plan: false, carried: false }, O27, [540, 40, 500], null,
        'FY25, FY27–FY31 · all years · all appropriations · FY27, FY28, FY29, FY30, FY31 planned, the rest executed'],
      ['the plan held, a carried row, rule off', { base: 2027, rule: false, plan: true, carried: true }, O27W, [940, 140, 800], [300, 0, 300],
        'FY25–FY31 · all years · all appropriations · FY26, FY27, FY28, FY29, FY30, FY31 planned, the rest executed'],
      ['the plan held, rule on', { base: 2027, rule: true, plan: true, carried: false }, O27W, [840, 40, 800], [300, 0, 300],
        'FY25–FY31 · all years · all appropriations · FY26, FY27, FY28, FY29, FY30, FY31 planned, the rest executed'],
      ['the plan held, a carried row, rule on', { base: 2027, rule: true, plan: true, carried: true }, O27W, [940, 140, 800], [400, 100, 300],
        'FY25–FY31 · all years · all appropriations · FY26: O&M planned, INITIAL SPARES executed, FULL FUND, OPN not in this total · FY27, FY28, FY29, FY30, FY31 planned'],
      ['no plan, a carried row, rule off', { base: 2027, rule: false, plan: false, carried: true }, O27, [640, 140, 500], null,
        'FY25, FY27–FY31 · all years · all appropriations · FY27, FY28, FY29, FY30, FY31 planned, the rest executed'],
      ['CONTROL — the window from FY26, the plan held', { base: 2026, rule: false, plan: true, carried: false }, O26, [840, 40, 800], [300, 0, 300],
        'FY25–FY30 · all years · all appropriations · FY26, FY27, FY28, FY29, FY30 planned, the rest executed'],
    ];
    for (const [where, c, off, t, t26, label] of CELLS) {
      const { X, asked, wb } = build(c);
      const held = J(c.plan ? [2026, 2027] : [2027]), ms0 = ms(X);
      w5Chk(name, where + ' · fixture', `CONTROL — base FY${c.base % 100}, the rule ${c.rule ? 'on' : 'off'}; MS.years holds ${held}${c.plan ? ' (FY26 pot $300M, F1 on it; one question, answered Cancel)' : ''}; FY27 pot $500M; ALL YEARS selected`,
        X.ev(`JSON.stringify([MS.base, MS.cur, Object.keys(MS.years).map(Number), MS.years[2026]? MS.years[2026].discSvc : null, MS.years[2026]? MS.years[2026].order : null, MS.years[2027].discSvc, flowPseudo().on, flowCfg().fys])`) + '|' + asked,
        J([c.base, 2027, JSON.parse(held), c.plan ? [300 * M] : null, c.plan ? ['F1'] : null, [500 * M], c.rule, null]) + '|' + (c.plan ? 1 : 0));
      const A = now(X), P = panel(X), B = await book(X);
      const each = JSON.parse(X.ev(`JSON.stringify(flowYears().map(function(y){ return flowCalc(y).tot; }))`));
      const t26r = JSON.parse(X.ev(`(function(){ var F=flowCalc(2026); return JSON.stringify([F.tot, F.execV, F.planV]); })()`));
      w5Chk(name, where + ' · ALL YEARS', `offered ${J(off.map(y => y % 100))}; ALL YEARS = $${t[0]}M ($${t[1]}M executed, $${t[2]}M planned), the panel $${t[0]}.00M and the export ${t[0] * M} twice; each year alone adds up to it`,
        J([A.offered, A.sel, A.t, P.total, P.allOn, B.err, B.tot, each.reduce((s, v) => s + v, 0)]),
        J([off, off, t.map(v => v * M), t[0].toFixed(2), true, 'ok', [t[0] * M, t[0] * M], t[0] * M]));
      w5Chk(name, where + ' · ALL YEARS · the label', 'the scope names only the years in the total, in runs; the export\'s Scope line and the chart say the same',
        J([A.label, B.scope, P.chart]), J([label, 'Scope: ' + label, 'funds flow, ' + label]));
      w5Chk(name, where + ' · FY26', t26 ? `FY26 is offered, marked plan, and holds $${t26[0]}M` : 'FY26 is not offered (no plan held, no row counted in it, outside the window), and holds nothing',
        J([P.chips.filter(x => /^FY26/.test(x)), t26r]), J([t26 ? ['FY26 · plan'] : [], (t26 || [0, 0, 0]).map(v => v * M)]));
      w5Chk(name, where + ' · nothing made', 'MS.years is byte-identical across the reads (the calculation, each year alone, the panel, the export); window.confirm never asked; the workbook as imported',
        J([ms(X) === ms0, X.w.__cc, X.ev('JSON.stringify(EXDB.all)') === wb, X.errors.length]), J([true, 0, true, 0]));
    }
    // ── SAVED SELECTIONS ──
    // S3a: the U14 state itself -- FY26 can now be chosen, and its $300M is what it holds
    {
      const { X } = build({ base: 2027, rule: false, plan: true, carried: true });
      const ok = click(X, 'flowOneYear(2026)'), b = now(X), R = reopen(X), r = now(R), P = panel(R);
      w5Chk(name, 'S3a · FY26 chosen, the plan held outside the window', 'its "only" button: saved [2026], $300M, all planned; the same reopened, the panel $300.00M',
        J([ok, b.stored, b.sel, b.t, r.stored, r.sel, r.t, r.label, P.total]),
        J([true, [2026], [2026], [300 * M, 0, 300 * M], [2026], [2026], [300 * M, 0, 300 * M], 'FY26 · all appropriations · ' + PL, '300.00']));
    }
    // S4a: FY26 chosen with the rule on ($400M), then the rule switched off: the plan is held, so FY26 stays FY26 ($300M)
    {
      const { X } = build({ base: 2027, rule: true, plan: true, carried: true });
      const ok = click(X, 'flowOneYear(2026)'), b0 = now(X), okOff = click(X, 'flowSetPseudo("on",false)'), b1 = now(X);
      const R = reopen(X), r = now(R), P = panel(R), B = await book(R), okOn = click(R, 'flowSetPseudo("on",true)'), r2 = now(R);
      w5Chk(name, 'S4a · saved FY26, the rule switched off', 'FY26 chosen: $400M; the rule off: still FY26 (never ALL YEARS), $300M planned; reopened the same, ALL YEARS not lit, the export 300000000 twice under the same scope; the rule back on: $400M',
        J([ok, b0.t[0], okOff, b1.offered, b1.stored, b1.sel, b1.t, r.stored, r.sel, r.t[0], P.allOn, P.chips.filter(x => / \[on\]$/.test(x)), B.tot, B.scope, okOn, r2.sel, r2.t[0]]),
        J([true, 400 * M, true, O27W, [2026], [2026], [300 * M, 0, 300 * M], [2026], [2026], 300 * M, false, ['FY26 · plan [on]'], [300 * M, 300 * M], 'Scope: FY26 · all appropriations · ' + PL, true, [2026], 400 * M]));
    }
    // S4b: FY26 chosen on the FY26 window ($300M), then Set base year 2027: still FY26; a toggle of FY27 adds to it
    {
      const { X } = build({ base: 2026, rule: false, plan: true, carried: true });
      const ok = click(X, 'flowOneYear(2026)'), b0 = now(X), ms0 = ms(X);
      setBase(X, 2027);
      const b1 = now(X), ms1 = ms(X), R = reopen(X), msR = ms(R), r = now(R), B = await book(R), okT = click(R, 'flowToggleYear(2027)'), r2 = now(R);
      w5Chk(name, 'S4b · saved FY26, the base year moved to 2027', 'FY26 chosen: $300M; the base moved: still FY26, $300M (never ALL YEARS); reopened the same and the export 300000000 twice; FY27 toggled on: [2026, 2027], $800M',
        J([ok, b0.t[0], b1.stored, b1.sel, b1.t[0], r.stored, r.sel, r.t[0], B.tot, okT, r2.stored, r2.t[0]]),
        J([true, 300 * M, [2026], [2026], 300 * M, [2026], [2026], 300 * M, [300 * M, 300 * M], true, [2026, 2027], 800 * M]));
      w5Chk(name, 'S4b · nothing made', 'the base-year move made, copied and changed no year: MS.years byte-identical before and after it, holding FY26 and FY27 only; the save and the reopen carry it byte for byte, and the reopened copy\'s reads and toggle leave it so; nothing asked',
        J([ms1 === ms0, Object.keys(JSON.parse(ms1)).map(Number), msR === ms1, ms(R) === msR, X.w.__cc, R.w.__cc]), J([true, [2026, 2027], true, true, 0, 0]));
    }
    // S4c: FY25 + FY26 chosen on the FY26 window ($440M), then the base moved: both kept, $440M
    {
      const { X } = build({ base: 2026, rule: false, plan: true, carried: true });
      const ok = click(X, 'flowOneYear(2025)') && click(X, 'flowToggleYear(2026)'), b0 = now(X);
      setBase(X, 2027);
      const b1 = now(X), R = reopen(X), r = now(R);
      w5Chk(name, 'S4c · saved FY25 + FY26, the base year moved to 2027', 'chosen: 140 + 300 = $440M; the base moved: still FY25 + FY26, $440M (never narrowed); the same reopened',
        J([ok, b0.stored, b0.t[0], b1.stored, b1.sel, b1.t[0], r.stored, r.sel, r.t[0]]),
        J([true, [2025, 2026], 440 * M, [2025, 2026], [2025, 2026], 440 * M, [2025, 2026], [2025, 2026], 440 * M]));
    }
    // S4e: the plan Reset to blank on the FY27 window: FY26 is still a year the board holds -- offered, $0 -- and nothing is made
    {
      const { X } = build({ base: 2027, rule: false, plan: true, carried: true });
      const a0 = now(X);
      X.ev(`switchYear(2026); 'ok'`); const askSwitch = X.w.__cc; X.ev(`resetYear(); 'ok'`); const askReset = X.w.__cc, msg = X.w.__ccMsgs[0] || ''; X.ev(`switchYear(2027); 'ok'`);
      counted(X.w, true);
      const ms0 = ms(X), a1 = now(X), P = panel(X), B = await book(X), t26 = JSON.parse(X.ev(`flowCalc(2026).tot`));
      w5Chk(name, 'S4e · the plan Reset to blank', 'CONTROL — switching to FY26 asked nothing; Reset asked once ("Reset FY26 to BLANK?"); FY26 is blank -- pot $0, no requirement -- and still held',
        J([askSwitch, askReset, /^Reset FY26 to BLANK\?/.test(msg), JSON.parse(X.ev('JSON.stringify([Object.keys(MS.years).map(Number), MS.years[2026].discSvc, MS.years[2026].order])'))]),
        J([0, 1, true, [[2026, 2027], [0], []]]));
      w5Chk(name, 'S4e · the plan Reset to blank', 'ALL YEARS $940M before; after, FY26 is still offered (a year the board holds) and reads $0: 140 + 0 + 500 = $640M, the panel and the export the same',
        J([a0.t[0], a1.offered, a1.t, P.chips.filter(x => /^FY26/.test(x)), t26, P.total, B.tot]),
        J([940 * M, O27W, [640 * M, 140 * M, 500 * M], ['FY26 · plan'], 0, '640.00', [640 * M, 640 * M]]));
      w5Chk(name, 'S4e · nothing made', 'after the reset, MS.years is byte-identical across the reads; nothing asked', J([ms(X) === ms0, X.w.__cc]), J([true, 0]));
    }
    // X1: the year worked is FY26, outside the FY27 window: it is offered, and ALL YEARS holds it
    {
      const { X } = build({ base: 2027, rule: false, plan: true, carried: true });
      X.ev(`switchYear(2026); 'ok'`);
      const a = now(X);
      w5Chk(name, 'X1 · working in FY26, the window FY27-FY31', 'switching asked nothing; FY26, the year on screen, is offered; ALL YEARS 140 + 300 + 500 = $940M',
        J([X.w.__cc, JSON.parse(X.ev('MS.cur')), a.offered, a.t]), J([0, 2026, O27W, [940 * M, 140 * M, 800 * M]]));
    }
    // S5a: FY26 chosen where only a carried row puts it on offer ($100M), then the rule off: FY26 is not available at all
    {
      const { X } = build({ base: 2027, rule: true, plan: false, carried: true });
      const ok = click(X, 'flowOneYear(2026)'), b0 = now(X), okOff = click(X, 'flowSetPseudo("on",false)');
      const s0 = fys(X), ms0 = ms(X), b1 = now(X), P = panel(X), B = await book(X), s1 = fys(X), ms1 = ms(X);
      const R = reopen(X), r = now(R), RP = panel(R), RB = await book(R), s2 = fys(R);
      const L0 = 'no year counted · all appropriations · saved FY26 not available, not counted';
      w5Chk(name, 'S5a · saved FY26, then not available', 'FY26 chosen: $100M executed; the rule off: FY26 is offered no more, the saved [2026] is KEPT and nothing is counted -- never ALL YEARS',
        J([ok, b0.sel, b0.t, okOff, b1.offered, b1.stored, b1.sel, b1.t, b1.label]), J([true, [2026], [100 * M, 100 * M, 0], true, O27, [2026], [], [0, 0, 0], L0]));
      w5Chk(name, 'S5a · saved FY26, then not available · the panel', 'the notice names FY26, why, and that nothing is counted; ALL YEARS is not lit, no year is on; total funding $0.00M; the chart (and so its image) prints the same scope',
        J([P.notice, P.allOn, P.chips.filter(x => / \[on\]$/.test(x)), P.total, P.chart, P.drawn.indexOf(L0.toUpperCase()) >= 0]),
        J([N26 + ', and nothing is counted. Click ALL YEARS, or a year’s only, to choose again; switching a year on or off keeps it.', false, [], '0.00', 'funds flow, ' + L0, true]));
      w5Chk(name, 'S5a · saved FY26, then not available · the export', 'the Scope line says it, the first NOTE says it in the panel\'s words, TOTAL FUNDING 0 twice',
        J([B.err, B.scope, B.notes[0], B.tot]), J(['ok', 'Scope: ' + L0, X26 + ', and nothing is counted.', [0, 0]]));
      w5Chk(name, 'S5a · saved FY26, then not available · reopened', 'the saved [2026] byte-identical through the reads, the save and the reopen; the reopened copy says the same on the panel and in the export',
        J([s0, s1, s2, r.stored, r.sel, r.t, r.label, RP.notice === P.notice, RP.allOn, RB.scope, RB.notes[0], RB.tot]),
        J(['[2026]', '[2026]', '[2026]', [2026], [], [0, 0, 0], L0, true, false, 'Scope: ' + L0, X26 + ', and nothing is counted.', [0, 0]]));
      const okOn = click(R, 'flowSetPseudo("on",true)'), r2 = now(R);
      w5Chk(name, 'S5a · saved FY26, then not available · the rule back on', 'FY26 is offered again and the saved [2026] counts again: $100M', J([okOn, r2.sel, r2.t[0]]), J([true, [2026], 100 * M]));
      w5Chk(name, 'S5a · nothing made', 'MS.years byte-identical across the reads; the board holds FY27 only; nothing asked', J([ms1 === ms0, Object.keys(JSON.parse(ms1)).map(Number), X.w.__cc, R.w.__cc]), J([true, [2027], 0, 0]));
    }
    // S5b: FY26 chosen on the FY26 window with no FY26 plan ($0), then the base moved: not available; FY27 toggled on keeps FY26
    {
      const { X } = build({ base: 2026, rule: false, plan: false, carried: true });
      const ok = click(X, 'flowOneYear(2026)'), b0 = now(X);
      setBase(X, 2027);
      const b1 = now(X), okT = click(X, 'flowToggleYear(2027)'), b2 = now(X), P = panel(X), B = await book(X);
      const R = reopen(X), r = now(R), okAll = click(R, 'flowAllYears()'), r2 = now(R);
      const L2 = 'FY27 · all appropriations · ' + PL + ' · saved FY26 not available, not counted';
      w5Chk(name, 'S5b · saved FY26, the base year moved, no plan held', 'FY26 chosen: $0; the base moved: FY26 kept and not counted, nothing counted (never ALL YEARS $640M)',
        J([ok, b0.sel, b0.t[0], b1.offered, b1.stored, b1.sel, b1.t[0]]), J([true, [2026], 0, O27, [2026], [], 0]));
      w5Chk(name, 'S5b · FY27 toggled on', 'the toggle starts from the saved selection: [2026, 2027] saved, FY27 counted ($500M planned), FY26 still named, in the panel and the export',
        J([okT, b2.stored, b2.sel, b2.t, b2.label, P.notice, P.allOn, P.chips.filter(x => / \[on\]$/.test(x)), B.scope, B.notes[0], B.tot]),
        J([true, [2026, 2027], [2027], [500 * M, 0, 500 * M], L2, N26 + ' and is not counted: this total counts FY27 only. Click ALL YEARS, or a year’s only, to choose again; switching a year on or off keeps it.', false, ['FY27 · plan [on]'],
          'Scope: ' + L2, X26 + ' and is not counted: this total counts FY2027 only.', [500 * M, 500 * M]]));
      w5Chk(name, 'S5b · reopened, then ALL YEARS clicked', 'reopened: [2026, 2027] saved, $500M; ALL YEARS only on its own click: nothing saved, every offered year, 140 + 500 = $640M',
        J([r.stored, r.sel, r.t[0], okAll, r2.stored, r2.sel, r2.t]), J([[2026, 2027], [2027], 500 * M, true, null, O27, [640 * M, 140 * M, 500 * M]]));
    }
    // S5c: FY25 + FY26 chosen on the FY26 window with no FY26 plan, then the base moved: FY25 counted, FY26 kept and said
    {
      const { X } = build({ base: 2026, rule: false, plan: false, carried: true });
      const ok = click(X, 'flowOneYear(2025)') && click(X, 'flowToggleYear(2026)'), b0 = now(X);
      setBase(X, 2027);
      const b1 = now(X), P = panel(X), okOff = click(X, 'flowToggleYear(2025)'), b2 = now(X), okT = click(X, 'flowToggleYear(2027)'), b3 = now(X), R = reopen(X), r = now(R);
      const L1 = 'FY25 · all appropriations · saved FY26 not available, not counted';
      w5Chk(name, 'S5c · saved FY25 + FY26, the base year moved, no plan held', 'chosen: 140 + 0 = $140M; the base moved: [2025, 2026] kept, FY25 counted, FY26 said -- never narrowed in silence',
        J([ok, b0.stored, b0.t[0], b1.stored, b1.sel, b1.t[0], b1.label, P.notice, P.allOn, P.chips.filter(x => / \[on\]$/.test(x))]),
        J([true, [2025, 2026], 140 * M, [2025, 2026], [2025], 140 * M, L1, N26 + ' and is not counted: this total counts FY25 only. Click ALL YEARS, or a year’s only, to choose again; switching a year on or off keeps it.', false, ['FY25 [on]']]));
      w5Chk(name, 'S5c · toggles', 'FY25 toggled off is refused as the last year counted (the saved selection unchanged); FY27 toggled on: [2025, 2026, 2027], 140 + 500 = $640M, FY26 still said; the same reopened',
        J([okOff, b2.stored, b2.sel, okT, b3.stored, b3.sel, b3.t[0], b3.label, r.stored, r.sel, r.t[0]]),
        J([true, [2025, 2026], [2025], true, [2025, 2026, 2027], [2025, 2027], 640 * M, 'FY25, FY27 · all appropriations · FY27 planned, the rest executed · saved FY26 not available, not counted',
          [2025, 2026, 2027], [2025, 2027], 640 * M]));
      // every offered year switched on, one by one, beside the saved FY26: never collapsed to ALL YEARS, never called all years
      const ok4 = ['flowToggleYear(2028)', 'flowToggleYear(2029)', 'flowToggleYear(2030)'].every(k => click(R, k)), r4 = now(R);
      const ok5 = click(R, 'flowToggleYear(2031)'), r5 = now(R), P5 = panel(R);
      w5Chk(name, 'S5c · every offered year switched on beside the saved FY26', 'six years saved with FY26 among them is not ALL YEARS: kept as chosen; then all six offered years on: still the saved list, ALL YEARS not lit and not said',
        J([ok4, r4.stored, r4.sel, ok5, r5.stored, r5.sel, r5.t[0], r5.label, P5.allOn]),
        J([true, [2025, 2026, 2027, 2028, 2029, 2030], [2025, 2027, 2028, 2029, 2030], true, [2025, 2026, 2027, 2028, 2029, 2030, 2031], O27, 640 * M,
          'FY25, FY27, FY28, FY29, FY30, FY31 \u00b7 all appropriations \u00b7 FY27, FY28, FY29, FY30, FY31 planned, the rest executed \u00b7 saved FY26 not available, not counted', false]));
      w5Chk(name, 'S5c · every offered year switched on beside the saved FY26 · the year buttons', 'each of the six years counted is lit, though the saved FY26 is not among them; the notice still names FY26 and what is counted',
        J([P5.chips.filter(x => / \[on\]$/.test(x)), P5.notice]),
        J([['FY25 [on]', 'FY27 · plan [on]', 'FY28 · plan [on]', 'FY29 · plan [on]', 'FY30 · plan [on]', 'FY31 · plan [on]'],
          N26 + ' and is not counted: this total counts FY25, FY27, FY28, FY29, FY30, FY31 only. Click ALL YEARS, or a year’s only, to choose again; switching a year on or off keeps it.']));
      // a year switched OFF while another stays counted keeps the saved FY26 too, as the notice says: never narrowed in silence
      const okOff6 = click(R, 'flowToggleYear(2031)'), r6 = now(R), P6 = panel(R);
      w5Chk(name, 'S5c · a year switched off beside the saved FY26', 'FY31 switched off, five years still counted: FY26 stays in the saved selection, $640M; the label, the lit years and the notice still name FY26 and what is counted',
        J([okOff6, r6.stored, r6.sel, r6.t[0], r6.label, P6.allOn, P6.chips.filter(x => / \[on\]$/.test(x)), P6.notice]),
        J([true, [2025, 2026, 2027, 2028, 2029, 2030], [2025, 2027, 2028, 2029, 2030], 640 * M,
          'FY25, FY27, FY28, FY29, FY30 \u00b7 all appropriations \u00b7 FY27, FY28, FY29, FY30 planned, the rest executed \u00b7 saved FY26 not available, not counted', false,
          ['FY25 [on]', 'FY27 · plan [on]', 'FY28 · plan [on]', 'FY29 · plan [on]', 'FY30 · plan [on]'],
          N26 + ' and is not counted: this total counts FY25, FY27, FY28, FY29, FY30 only. Click ALL YEARS, or a year’s only, to choose again; switching a year on or off keeps it.']));
      // a year's "only" chooses again, as the notice says: the saved FY26 goes, and the notice with it
      const okOne = click(R, 'flowOneYear(2027)'), r7 = now(R), P7 = panel(R);
      w5Chk(name, 'S5c · a year\'s only beside the saved FY26', 'FY27\'s only chooses again: [2027] saved, $500M planned, no saved year left that is not available, no notice; the label FY27 alone, only FY27 lit',
        J([okOne, r7.stored, r7.sel, r7.t, r7.label, P7.notice, P7.chips.filter(x => / \[on\]$/.test(x))]),
        J([true, [2027], [2027], [500 * M, 0, 500 * M], 'FY27 · all appropriations · ' + PL, '', ['FY27 · plan [on]']]));
    }
    // S5d: TWO saved years the board cannot answer for -- FY24 + FY26, chosen on the FY24 window, then the base moved to 2027:
    // both kept, neither counted, and said in the plural ("They stay ... keeps them"); years switched on, then one off, keep both
    {
      const { X } = build({ base: 2027, rule: false, plan: false, carried: false });
      const ms0 = ms(X);
      setBase(X, 2024);
      const ok = click(X, 'flowOneYear(2024)') && click(X, 'flowToggleYear(2026)'), b0 = now(X);
      setBase(X, 2027);
      const b1 = now(X), P1 = panel(X), B1 = await book(X);
      const okOn = click(X, 'flowToggleYear(2027)') && click(X, 'flowToggleYear(2025)'), okOff = click(X, 'flowToggleYear(2027)');
      const b2 = now(X), P2 = panel(X), B2 = await book(X);
      const L3 = 'no year counted · all appropriations · saved FY24, FY26 not available, not counted';
      const L4 = 'FY25 · all appropriations · saved FY24, FY26 not available, not counted';
      const N2 = 'The saved year selection includes FY24, FY26, which this board cannot answer for now: it holds no plan for those years, no imported row is filed or counted in them, and they are outside the plan window (FY27–FY31). They stay in the saved selection';
      const X2 = 'NOTE: The saved year selection includes FY2024, FY2026, which this board cannot answer for now: it holds no plan for those years, no imported row is filed or counted in them, and they are outside the plan window (FY2027–FY2031). They stay in the saved selection';
      w5Chk(name, 'S5d · saved FY24 + FY26, the base year moved, no plan held', 'chosen on the FY24 window: [2024, 2026], $0; the base moved: both kept, neither counted, nothing counted (never ALL YEARS $540M)',
        J([ok, b0.stored, b0.offered, b0.sel, b0.t[0], b1.offered, b1.stored, b1.sel, b1.t, b1.label]),
        J([true, [2024, 2026], [2024, 2025, 2026, 2027, 2028], [2024, 2026], 0, O27, [2024, 2026], [], [0, 0, 0], L3]));
      w5Chk(name, 'S5d · two saved years not available · the panel and the export', 'the notice names both, in the plural, and says switching a year on or off keeps them; no year lit, ALL YEARS not lit, $0.00M; the export\'s Scope line and first NOTE say the same, TOTAL FUNDING 0 twice',
        J([P1.notice, P1.allOn, P1.chips.filter(x => / \[on\]$/.test(x)), P1.total, B1.err, B1.scope, B1.notes[0], B1.tot]),
        J([N2 + ', and nothing is counted. Click ALL YEARS, or a year’s only, to choose again; switching a year on or off keeps them.', false, [], '0.00', 'ok', 'Scope: ' + L3, X2 + ', and nothing is counted.', [0, 0]]));
      w5Chk(name, 'S5d · years switched on, then one off, beside the two saved years', 'FY27 and FY25 on, then FY27 off with FY25 still counted: FY24 and FY26 both kept and named, FY25 counted ($40M executed), on the panel and in the export',
        J([okOn, okOff, b2.stored, b2.sel, b2.t, b2.label, P2.notice, P2.chips.filter(x => / \[on\]$/.test(x)), B2.scope, B2.notes[0], B2.tot]),
        J([true, true, [2024, 2025, 2026], [2025], [40 * M, 40 * M, 0], L4,
          N2 + ' and are not counted: this total counts FY25 only. Click ALL YEARS, or a year’s only, to choose again; switching a year on or off keeps them.', ['FY25 [on]'],
          'Scope: ' + L4, X2 + ' and are not counted: this total counts FY2025 only.', [40 * M, 40 * M]]));
      w5Chk(name, 'S5d · nothing made', 'MS.years byte-identical from the start through both base-year moves, the clicks and the reads, holding FY27 only; nothing asked; no error',
        J([ms(X) === ms0, Object.keys(JSON.parse(ms(X))).map(Number), X.w.__cc, X.errors.length]), J([true, [2027], 0, 0]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.00 (U14) ====
// ==== v2.00 (U34): a saved year selection this board did not write is read as no year, kept as saved and said -- never as ALL YEARS ====
// Codex's review, as Brad supplied it on 12 Oct: "the malformed saved-year selection"; Brad: "record the malformed saved-year
// selection ... explicitly". U14 keeps a saved year the board cannot answer for and says it; this is the selection the board
// never writes at all, as a hand-edited or damaged saved file carries it. The board writes null (ALL YEARS) or a list of whole
// years from its own buttons, and nothing else. The board is U14's no-plan fixture: O&M, one service, F1 asking $1,000M, base
// year 2027, FY27 pot $500M, MS.years {2027}, the rule off; workbook O&M FY25 'USAF O&M Discretionary' $40M. Offered: FY25,
// FY27-FY31; ALL YEARS = 40 + 500 = $540M. Its saved file is built once (buildSavedHtml); for each shape, the file's own
// appropriation's flow.fys is replaced AS TEXT, the file is opened through the board's opening path (boot({html})), read
// apart in the calculation, the panel and the export (its bytes read back), then saved and opened again.
// A SHAPE THE BOARD DID NOT WRITE -- not a list ("2026", {}, 2027), an empty list, or entries that are not whole numbers
// ("2027", 2026.5, null, true, text) -- counts no year from what it cannot read; it is never read as ALL YEARS, never as a
// year it is not, and it is said: the scope label (the panel, the chart, the export's Scope line), the panel's notice
// (quoting the file, escaped) and the export's NOTE, with what is counted instead. It is kept as saved (the same value)
// through the reads, the save and the reopen, until a person chooses again; a year switched on starts from the years it could
// read. CONTROLS (as before): no key and null are ALL YEARS; duplicates are read once and an unsorted list in order, with
// nothing said; a whole year no appropriation offers is U14's notice.
// AND (the verifiers' round, 13 Oct): "", 0 and false are not lists either. A quoted entry is cut at 40 characters, between
// characters, and U+FFFE / U+FFFF are quoted as their escape -- XML 1.0 forbids both -- so every shape's export is a
// well-formed workbook, every part read as XML (w7Pkg). Every offered year beside an entry it cannot read is not ALL YEARS: the
// chip is not lit, the label does not say "all years" (U14's rule). A year U14 says beside an entry U34 says: both said, U14's
// NOTE first. The NOTE is ADDED to the export: every other row is as without the entry. CONTROL: a whole year the board offers
// outside 2000-2099 (FY1999 rows) is a year -- a year need not be in 2000-2099.
// AND (the verifiers' second round, 13 Oct): two characters XML forbids in one entry are both quoted as their escape; a quote of
// exactly 40 characters is shown whole and one of 41 is cut at 40. Partner and FMS money typed in is counted for the years read
// only: none beside "2026", FY27's beside [2027, "x"]. CONTROL: -2027 is a whole number, so a year as the board reads it (U14's
// notice, "FY-27") -- a year need not have four digits, nor be above zero.
// FAILS ON d66dd60 (U14; records head 7ee498a): every shape the board did not write -- "2026", {}, 2027, [], "", 0 and false read
// as ALL YEARS $540M, ALL YEARS lit, nothing said; ["2027"] as FY27 $500M; [2026.5], 5,000 × "x", 120 × "A", 38 × "B", 39 × "C"
// and "\ufffe" as ALL YEARS; [null] and [true] as "saved FY0 / FY1 not available"; [2025, 2026.5], ["<b>x</b>", 2027],
// ["\uffff", 2027], ["\uffff\ufffe", 2027] and 45 emoji beside 2027 counted their one whole year with nothing said; [2040, "x"]
// said FY40 only; [2025, 2027-2031, "x"] read as ALL YEARS; so the export carried no U34 NOTE (both whole-export checks); FY27
// switched on beside "2026" switched it OFF from every year ($40M); and "2026" counted FY25's $3M partner and FY27's $2M FMS
// money ($545M). Passing there too: the eight controls, and FY27 switched on beside [2025, 2026.5], ALL YEARS and a year's only
// on "2026".
await (async () => {
  const name = 'v2.00 (U34) — a saved year selection this board did not write is never read as ALL YEARS; it is kept and said';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify, M = 1000000;
    const row = (fy, title, budget, amt, office) => { const r = Array(32).fill(''); r[0] = fy; r[1] = fy + '-03'; r[2] = 'U14' + fy; r[3] = title;
      r[4] = budget; r[7] = 'Event ' + title; r[9] = amt; r[10] = 'Allocated'; r[18] = office; return r; };
    const WB = { om: { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: [row(2025, 'Ordinary Support', 'USAF O&M Discretionary', 40 * M, 'Program (TSS)')] } } };
    // window.confirm answering `ans`, every question counted and kept
    const counted = (w, ans) => { w.__cc = 0; w.__ccMsgs = []; w.confirm = m => { w.__cc++; w.__ccMsgs.push(String(m)); return ans; }; };
    const X = boot();
    seed(X.ev, { services: ['USAF'], items: [it('F1', 'PSM', [1000 * M])], disc: [500 * M], mand: [0], order: ['F1'] });
    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.bm={disc:[${500 * M}], mand:[0], adds:[]}; MS.base=2027; MS.cur=2027; FYMON=fyMonths(2027); MS.years={2027:S};
      applyState(S); MS.years[2027]=S; EXDB.all=${J(WB)}; EXDB.ts=1;
      var C=flowCfg(); delete C.pseudo; C.other={}; C.fys=null; C.aps=null; save(); 'ok'`);
    counted(X.w, true);
    const slug = JSON.parse(X.ev('JSON.stringify(_AP.slug)')), html0 = X.ev('buildSavedHtml()');
    const RE = /(<script type="application\/json" id="pubState">)([\s\S]*?)(<\/script>)/;
    // the saved file with its own appropriation's flow.fys replaced by `text`, as a hand edit leaves it (undefined: no key);
    // `more`, when given, changes the rest of the saved state first (the FY1999 control's rows)
    const withFys = (text, more) => html0.replace(RE, (m, a, b, c) => {
      const P = JSON.parse(b), F = P.appns[slug].flow;
      if (more) more(P);
      if (text === undefined) delete F.fys; else F.fys = '__FYS__';
      let s = J(P).replace(/</g, '\\u003c');
      if (text !== undefined) s = s.replace('"__FYS__"', () => text);
      return a + s + c; });
    const fileFys = h => { const F = JSON.parse(RE.exec(h)[2]).appns[slug].flow; return 'fys' in F ? J(F.fys) : '(no key)'; };
    const now = R => JSON.parse(R.ev(`(function(){ var F=flowCalc(); return JSON.stringify({stored:String(JSON.stringify(flowCfg().fys)),
      sel:flowSelYears(), t:[F.tot, F.execV, F.planV], label:F.label}); })()`));
    const panel = R => { R.ev(`flowOpen=true; flowSel=''; flowBody(); 'ok'`);
      const b = R.w.document.getElementById('flowBody'), btn = [...b.querySelectorAll('button')], n = b.querySelector('.flowunread'), u = b.querySelector('.flowunavail');
      const tf = /total funding \$([\d,]+\.\d\d)M/.exec(b.textContent);
      return { total: tf ? tf[1] : '', allOn: btn.filter(x => x.getAttribute('onclick') === 'flowAllYears()').map(x => x.classList.contains('on'))[0],
        lit: btn.filter(x => /^flowToggleYear\(\d+\)$/.test(x.getAttribute('onclick') || '') && x.classList.contains('on')).map(x => x.textContent),
        notice: n ? n.textContent : '', html: n ? n.innerHTML : '', unavail: u ? u.textContent : '' }; };
    const cell = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c;
    // the exported workbook read back from its bytes
    const book = async R => { const wb = JSON.parse(await R.w.eval(`(async function(){ var cap=null, _B=window.Blob;
        window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
        try{ exportFlow(); }catch(e){ window.Blob=_B; return JSON.stringify({__err:'threw '+String((e&&e.message)||e)}); }
        window.Blob=_B; if(!cap) return JSON.stringify({__err:'no file'});
        var ab=cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength); return JSON.stringify(await xlsxRead(ab)); })()`));
      const ff = wb['Funds Flow'] || [], all = lab => ff.filter(r => w6Lbl(r) === lab).map(r => num(cell(r[1]))).filter(v => v !== null);
      return { err: wb.__err || 'ok', scope: w6Lbl(ff[1] || []), tot: all('TOTAL FUNDING'),
        notes: ff.map(w6Lbl).filter(t => /^NOTE: The saved year selection (is|holds) /.test(t)) }; };
    // the exported Funds Flow sheet, every row as its cells' values
    const flowRows = async R => { const wb = JSON.parse(await R.w.eval(`(async function(){ var cap=null, _B=window.Blob;
        window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
        try{ exportFlow(); }catch(e){ window.Blob=_B; return '{}'; }
        window.Blob=_B; if(!cap) return '{}';
        var ab=cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength); return JSON.stringify(await xlsxRead(ab)); })()`));
      return (wb['Funds Flow'] || []).map(r => (r || []).map(cell)); };
    // one shape, opened: what it counts and says everywhere, and what the save and the reopen carry; last, the export's
    // package, every part read as XML (w7Pkg) -- a workbook that is not well-formed is not an export
    const look = async (text, more) => {
      const R = boot({ html: withFys(text, more) }); counted(R.w, true);
      const a = now(R), P = panel(R), B = await book(R), h2 = R.ev('buildSavedHtml()'), R2 = boot({ html: h2 }), r = now(R2), cc = R.w.__cc;
      return [a.stored, a.sel, a.t, a.label, P.total, P.allOn, P.lit, P.notice, P.unavail, B.err, B.scope, B.tot, B.notes,
        fileFys(h2) === (text === undefined ? '(no key)' : J(JSON.parse(text))), r.stored === a.stored, r.sel, r.t[0], cc, R.errors.length + R2.errors.length,
        w7Ok(w7Pkg(R.w, 'exportFlow'))]; };
    // the same, expected -- every value a literal
    const want = (stored, sel, t, label, total, allOn, lit, notice, unavail, notes) =>
      [stored, sel, t, label, total, allOn, lit, notice, unavail, 'ok', 'Scope: ' + label, [t[0], t[0]], notes, true, true, sel, t[0], 0, 0,
        'ok · every part reads · every count holds'];
    const ALL = 'FY25, FY27–FY31 · all years · all appropriations · FY27, FY28, FY29, FY30, FY31 planned, the rest executed';
    const L0 = 'no year counted · all appropriations · saved year selection not a list of years, not counted';
    const L1 = 'no year counted · all appropriations · 1 saved entry not a year, not counted';
    const O = [2025, 2027, 2028, 2029, 2030, 2031], T540 = [540 * M, 40 * M, 500 * M], T500 = [500 * M, 0, 500 * M], T0 = [0, 0, 0];
    const TAIL = ' Click ALL YEARS, a year’s only, or a year to switch it on or off, to choose again; any of these replaces what cannot be read.';
    const WH = q => 'The saved year selection is ' + q + ', not a list of years this board can read. It is kept as saved, and nothing is counted.';
    const H1 = q => 'The saved year selection holds ' + q + ', which this board cannot read as a year. It is kept as saved, and nothing is counted.';
    // `stored`: the value as the board writes it back, when the file's text spells it otherwise ("\uffff" for the character)
    const whole = (q, text, stored = text) => [text, J(want(stored, [], T0, L0, '0.00', false, [], WH(q) + TAIL, '', ['NOTE: ' + WH(q)]))];
    const one = (q, text) => [text, J(want(text, [], T0, L1, '0.00', false, [], H1(q) + TAIL, '', ['NOTE: ' + H1(q)]))];
    // one entry it cannot read beside 2027: FY27 counted, $500M, the entry said
    const L27 = 'FY27 · all appropriations · PLANNED (board allocation, O&M) · 1 saved entry not a year, not counted';
    const H27 = (q, fy) => 'The saved year selection holds ' + q + ', which this board cannot read as a year. It is kept as saved and not counted: this total counts ' + fy + ' only.';
    const by27 = (q, text, stored = text) => [text, J(want(stored, [2027], T500, L27, '500.00', false, ['FY27 · plan'], H27(q, 'FY27') + TAIL, '', ['NOTE: ' + H27(q, 'FY2027')]))];
    const E = '\u{1F600}';
    const U40 = 'The saved year selection includes FY40, which this board cannot answer for now: it holds no plan for that year, no imported row is filed or counted in it, and it is outside the plan window (FY27–FY31). It stays in the saved selection, and nothing is counted. Click ALL YEARS, or a year’s only, to choose again; switching a year on or off keeps it.';
    const SHAPES = [
      // [where, what is promised, the text in the file, expected]
      ['a string', 'the saved selection "2026", not a list: no year counted (never ALL YEARS $540M), ALL YEARS not lit, said on the panel and in the export, kept through the save and the reopen', ...whole('"2026"', '"2026"')],
      ['an object', '{}: no year counted, said, kept', ...whole('{}', '{}')],
      ['a bare number', '2027 alone, not in a list: no year counted (never ALL YEARS, never a guess at FY27), said, kept', ...whole('2027', '2027')],
      ['an empty list', '[]: names no year -- no year counted (never ALL YEARS), said, kept', ...whole('[]', '[]')],
      ['a year as text', '["2027"]: text is not a year the board writes -- not counted as FY27 (no guess), said, kept', ...one('"2027"', '["2027"]')],
      ['not a whole number', '[2026.5]: not counted, never ALL YEARS, said, kept', ...one('2026.5', '[2026.5]')],
      ['null in the list', '[null] (NaN, as a saved file writes it): not read as a year "FY0", said as it is saved, kept', ...one('null', '[null]')],
      ['true in the list', '[true]: not read as a year "FY1", said as it is saved, kept', ...one('true', '[true]')],
      ['one whole year, one not', '[2025, 2026.5]: FY25 counted ($40M executed), 2026.5 said and not counted, kept',
        '[2025,2026.5]', J(want('[2025,2026.5]', [2025], [40 * M, 40 * M, 0], 'FY25 · all appropriations · 1 saved entry not a year, not counted', '40.00', false, ['FY25'],
          'The saved year selection holds 2026.5, which this board cannot read as a year. It is kept as saved and not counted: this total counts FY25 only.' + TAIL, '',
          ['NOTE: The saved year selection holds 2026.5, which this board cannot read as a year. It is kept as saved and not counted: this total counts FY2025 only.']))],
      ['text that is markup', '["<b>x</b>", 2027]: FY27 counted ($500M), the text quoted as saved and shown as text, never as markup',
        '["<b>x</b>",2027]', J(want('["<b>x</b>",2027]', [2027], T500, 'FY27 · all appropriations · PLANNED (board allocation, O&M) · 1 saved entry not a year, not counted', '500.00', false, ['FY27 · plan'],
          'The saved year selection holds "<b>x</b>", which this board cannot read as a year. It is kept as saved and not counted: this total counts FY27 only.' + TAIL, '',
          ['NOTE: The saved year selection holds "<b>x</b>", which this board cannot read as a year. It is kept as saved and not counted: this total counts FY2027 only.']))],
      ['an enormous list', '5,000 entries of "x": no year counted, never ALL YEARS; three quoted and the rest counted, said in the plural, kept',
        '[' + Array(5000).fill('"x"').join(',') + ']', J(want('[' + Array(5000).fill('"x"').join(',') + ']', [], T0, 'no year counted · all appropriations · 5000 saved entries not years, not counted', '0.00', false, [],
          'The saved year selection holds "x", "x", "x" and 4997 more, which this board cannot read as years. They are kept as saved, and nothing is counted.' + TAIL, '',
          ['NOTE: The saved year selection holds "x", "x", "x" and 4997 more, which this board cannot read as years. They are kept as saved, and nothing is counted.']))],
      // the verifiers' round: falsy values are not lists either
      ['an empty string', '"": not a list -- no year counted (never ALL YEARS $540M), ALL YEARS not lit, said, kept', ...whole('""', '""')],
      ['zero', '0: not a list -- no year counted (never ALL YEARS), said, kept', ...whole('0', '0')],
      ['false', 'false: not a list -- no year counted (never ALL YEARS), said, kept', ...whole('false', 'false')],
      // the quote: cut at 40 characters, between characters, and never carrying what XML 1.0 forbids (the package, last value)
      ['a long entry', '[120 × "A"]: not counted; quoted as its first 40 characters and "…" on the panel and in the NOTE; kept whole',
        '["' + 'A'.repeat(120) + '"]', J(want('["' + 'A'.repeat(120) + '"]', [], T0, L1, '0.00', false, [], H1('"' + 'A'.repeat(39) + '…') + TAIL, '', ['NOTE: ' + H1('"' + 'A'.repeat(39) + '…')]))],
      ['U+FFFF in an entry', '["\\uffff", 2027], as a damaged file holds it: FY27 counted, the entry quoted as the file\'s own escape "\\uffff" -- never the character XML 1.0 forbids, so the workbook is well-formed; kept',
        ...by27('"\\uffff"', '["\\uffff",2027]', '["\uffff",2027]')],
      ['U+FFFE as the whole value', '"\\ufffe": not a list; quoted as "\\ufffe", and the workbook is well-formed; kept', ...whole('"\\ufffe"', '"\\ufffe"', '"\ufffe"')],
      ['45 emoji in an entry', 'an entry of 45 emoji beside 2027: quoted as its first 40 characters -- the opening quote and 39 emoji -- and "…", never cut inside one (no half on the panel, no U+FFFD in the export); kept',
        ...by27('"' + E.repeat(39) + '…', J([E.repeat(45), 2027]))],
      // the verifiers' second round: every forbidden character escaped, and the cut's edge (40 whole, 41 cut)
      ['two characters XML forbids in one entry', '["\\uffff\\ufffe", 2027]: FY27 counted; both quoted as their escape -- every one, not the first only -- so the workbook is well-formed; kept',
        ...by27('"\\uffff\\ufffe"', '["\\uffff\\ufffe",2027]', '["\uffff\ufffe",2027]')],
      ['a quote of exactly 40 characters', '[38 × "B"]: its quote is 40 characters -- shown whole, with no "…"; kept', ...one('"' + 'B'.repeat(38) + '"', '["' + 'B'.repeat(38) + '"]')],
      ['a quote of 41 characters', '[39 × "C"]: its quote is 41 characters -- cut at 40, then "…"; kept', ...one('"' + 'C'.repeat(39) + '…', '["' + 'C'.repeat(39) + '"]')],
      // both findings at once, and every offered year beside an entry it cannot read
      ['beside a year U14 says', '[2040, "x"]: both said -- the label carries both, both notices are on the panel, the U34 NOTE is in the export; kept', '[2040,"x"]',
        J(want('[2040,"x"]', [], T0, 'no year counted · all appropriations · saved FY40 not available, not counted · 1 saved entry not a year, not counted', '0.00', false, [],
          H1('"x"') + TAIL, U40, ['NOTE: ' + H1('"x"')]))],
      ['every offered year beside an entry it cannot read', '[2025, 2027-2031, "x"]: every offered year counted, $540M, but it is not ALL YEARS -- ALL YEARS not lit, the six years lit, the label never "all years"; said, kept',
        '[2025,2027,2028,2029,2030,2031,"x"]', J(want('[2025,2027,2028,2029,2030,2031,"x"]', O, T540,
          'FY25, FY27, FY28, FY29, FY30, FY31 · all appropriations · FY27, FY28, FY29, FY30, FY31 planned, the rest executed · 1 saved entry not a year, not counted', '540.00', false,
          ['FY25', 'FY27 · plan', 'FY28 · plan', 'FY29 · plan', 'FY30 · plan', 'FY31 · plan'],
          'The saved year selection holds "x", which this board cannot read as a year. It is kept as saved and not counted: this total counts FY25, FY27, FY28, FY29, FY30, FY31 only.' + TAIL, '',
          ['NOTE: The saved year selection holds "x", which this board cannot read as a year. It is kept as saved and not counted: this total counts FY2025, FY2027, FY2028, FY2029, FY2030, FY2031 only.']))],
      ['CONTROL — no key', 'no saved selection is ALL YEARS: $540M, ALL YEARS lit, nothing said', undefined, J(want('undefined', O, T540, ALL, '540.00', true, [], '', '', []))],
      ['CONTROL — null', 'null, the board\'s own ALL YEARS: $540M, ALL YEARS lit, nothing said', 'null', J(want('null', O, T540, ALL, '540.00', true, [], '', '', []))],
      ['CONTROL — duplicates', '[2027, 2027]: FY27 once, $500M, nothing said, kept as saved', '[2027,2027]',
        J(want('[2027,2027]', [2027], T500, 'FY27 · all appropriations · PLANNED (board allocation, O&M)', '500.00', false, ['FY27 · plan'], '', '', []))],
      ['CONTROL — out of order', '[2031, 2025, 2027]: read in order, $540M, nothing said, kept as saved', '[2031,2025,2027]',
        J(want('[2031,2025,2027]', [2025, 2027, 2031], T540, 'FY25, FY27, FY31 · all appropriations · FY27, FY31 planned, the rest executed', '540.00', false, ['FY25', 'FY27 · plan', 'FY31 · plan'], '', '', []))],
      ['CONTROL — an enormous list of one year', '2027 five thousand times: FY27, $500M, nothing said, kept as saved', '[' + Array(5000).fill('2027').join(',') + ']',
        J(want('[' + Array(5000).fill('2027').join(',') + ']', [2027], T500, 'FY27 · all appropriations · PLANNED (board allocation, O&M)', '500.00', false, ['FY27 · plan'], '', '', []))],
      ['CONTROL — a whole year no appropriation offers', '[2040]: U14\'s notice, nothing counted, nothing else said', '[2040]',
        J(want('[2040]', [], T0, 'no year counted · all appropriations · saved FY40 not available, not counted', '0.00', false, [], '',
          'The saved year selection includes FY40, which this board cannot answer for now: it holds no plan for that year, no imported row is filed or counted in it, and it is outside the plan window (FY27–FY31). It stays in the saved selection, and nothing is counted. Click ALL YEARS, or a year’s only, to choose again; switching a year on or off keeps it.', []))],
      ['CONTROL — a year the board offers outside 2000–2099', '[1999] on a board holding $7M of FY1999 rows: a whole number is a year, as the board writes it -- FY99 counted, nothing said, kept (a year need not be in 2000–2099)',
        '[1999]', J(want('[1999]', [1999], [7 * M, 7 * M, 0], 'FY99 · all appropriations', '7.00', false, ['FY99'], '', '', [])),
        P => { P.execDb.all.om.rows[1999] = [row(1999, 'Old Support', 'USAF O&M Discretionary', 7 * M, 'Program (TSS)')]; }],
      ['CONTROL — a whole number no year could be', '[-2027]: a whole number is a year, as the board reads it -- U14\'s notice ("FY-27"), nothing counted, no U34 notice (a year need not have four digits, nor be above zero)',
        '[-2027]', J(want('[-2027]', [], T0, 'no year counted · all appropriations · saved FY-27 not available, not counted', '0.00', false, [], '',
          'The saved year selection includes FY-27, which this board cannot answer for now: it holds no plan for that year, no imported row is filed or counted in it, and it is outside the plan window (FY27–FY31). It stays in the saved selection, and nothing is counted. Click ALL YEARS, or a year’s only, to choose again; switching a year on or off keeps it.', []))],
    ];
    for (const [where, what, text, exp, more] of SHAPES) {
      w5Chk(name, where, what, J(await look(text, more)), exp);
      bootRelease(__bm, [X.w]);
    }
    // both NOTEs in the export, in order: U14's first under the Scope line, then U34's, each with its blank row
    {
      const R = boot({ html: withFys('[2040,"x"]') }); counted(R.w, true); const ff = await flowRows(R);
      w5Chk(name, 'beside a year U14 says · the NOTEs in order', 'the export\'s NOTE rows: U14\'s at row 4 (index 3), U34\'s at index 5, each followed by a blank row',
        J(ff.map((r, i) => [i, String(r[0] ?? '')]).filter(x => /^NOTE: /.test(x[1]))),
        J([[3, 'NOTE: The saved year selection includes FY2040, which this board cannot answer for now: it holds no plan for that year, no imported row is filed or counted in it, and it is outside the plan window (FY2027–FY2031). It stays in the saved selection, and nothing is counted.'],
          [5, 'NOTE: The saved year selection holds "x", which this board cannot read as a year. It is kept as saved, and nothing is counted.']]));
      bootRelease(__bm, [X.w]);
    }
    // the NOTE is ADDED: [2027, "x"] exports every row [2027] exports, in order, but its Scope line, and a NOTE with its blank row
    {
      const Ra = boot({ html: withFys('[2027]') }); counted(Ra.w, true); const a = (await flowRows(Ra)).map(r => J(r));
      const Rb = boot({ html: withFys('[2027,"x"]') }); counted(Rb.w, true); const b = (await flowRows(Rb)).map(r => J(r));
      const nx = b.findIndex(r => r.indexOf('NOTE: The saved year selection holds') >= 0);
      const rest = b.filter((r, i) => i !== 1 && i !== nx && i !== nx + 1), same = a.filter((r, i) => i !== 1);
      w5Chk(name, 'the export beside the NOTE', '[2027, "x"] exports every row [2027] exports, in the same order, but its Scope line; the NOTE and a blank row are added at index 3, under the Source line',
        J([a.length > 20, b.length - a.length, nx, b[nx + 1], J(rest) === J(same)]), J([true, 2, 3, '[]', true]));
      bootRelease(__bm, [X.w]);
    }
    // the markup is text on the panel: escaped in the notice's HTML, no element made from it
    {
      const R = boot({ html: withFys('["<b>x</b>",2027]') }); counted(R.w, true); const P = panel(R);
      w5Chk(name, 'text that is markup · escaped', 'the notice\'s HTML carries "&lt;b&gt;x&lt;/b&gt;" (text, as the DOM writes it back), and its only <b> elements are the board\'s own three -- none is made from the file',
        J([P.html.indexOf('"&lt;b&gt;x&lt;/b&gt;"') >= 0, (P.html.match(/<b[ >]/g) || []).length]), J([true, 3]));
      bootRelease(__bm, [X.w]);
    }
    // a person's click on such a selection chooses again, as the notice says
    const click = (R, onclick) => { R.ev(`flowOpen=true; flowBody(); 'ok'`);
      const b = [...R.w.document.querySelectorAll('#flowBody button')].find(x => x.getAttribute('onclick') === onclick);
      if (!b) return false; b.click(); return true; };
    {
      const R = boot({ html: withFys('"2026"') }); counted(R.w, true);
      const ok = click(R, 'flowToggleYear(2027)'), a = now(R), P = panel(R);
      w5Chk(name, '"2026", then FY27 switched on', 'the toggle starts from the years it could read -- none -- so FY27 is the selection: [2027] saved, $500M, no notice (never every year but FY27)',
        J([ok, a.stored, a.sel, a.t, P.notice, P.lit, R.errors.length]), J([true, '[2027]', [2027], T500, '', ['FY27 · plan'], 0]));
      bootRelease(__bm, [X.w]);
    }
    {
      const R = boot({ html: withFys('[2025,2026.5]') }); counted(R.w, true);
      const ok = click(R, 'flowToggleYear(2027)'), a = now(R), P = panel(R);
      w5Chk(name, '[2025, 2026.5], then FY27 switched on', 'CONTROL — FY25 kept and FY27 added: [2025, 2027] saved, $540M; what could not be read is replaced, and the notice goes',
        J([ok, a.stored, a.sel, a.t, P.notice, R.errors.length]), J([true, '[2025,2027]', [2025, 2027], T540, '', 0]));
      bootRelease(__bm, [X.w]);
    }
    {
      const R = boot({ html: withFys('"2026"') }); counted(R.w, true);
      const okA = click(R, 'flowAllYears()'), a = now(R), okO = click(R, 'flowOneYear(2027)'), b = now(R);
      w5Chk(name, '"2026", then ALL YEARS, then FY27\'s only', 'CONTROL — ALL YEARS on its own click: null saved, $540M; then FY27\'s only: [2027], $500M',
        J([okA, a.stored, a.t, okO, b.stored, b.t, R.errors.length]), J([true, 'null', T540, true, '[2027]', T500, 0]));
      bootRelease(__bm, [X.w]);
    }
    // partner and FMS money is typed per fiscal year and counted for the years in scope (flowOtherNote), so none of it is
    // counted for what cannot be read: FY25 International Partners $3M and FY27 Foreign Military Sales $2M typed in, "2026"
    // counts none of it ($0 total funding, as "no year counted" says), and [2027, "x"] counts FY27's $2M only ($502M)
    {
      const other = P => { P.appns[slug].flow.other = { 2025: { ip: 3 * M }, 2027: { fms: 2 * M } }; };
      const got = [];
      for (const text of ['"2026"', '[2027,"x"]']) {
        const R = boot({ html: withFys(text, other) }); counted(R.w, true);
        const c = JSON.parse(R.ev(`(function(){ var F=flowCalc(); return JSON.stringify([F.ip, F.fms, F.grand]); })()`));
        const ff = await flowRows(R), line = lab => ff.filter(r => String(r[0] ?? '').trim() === lab).map(r => num(r[1])).filter(v => v !== null);
        got.push([c, line('International Partners'), line('Foreign Military Sales'), line('TOTAL FUNDING')]);
        bootRelease(__bm, [X.w]);
      }
      w5Chk(name, 'partner and FMS money', '"2026": no partner or FMS money counted, $0 total funding in the calculation and the export; [2027, "x"]: FY27\'s $2M FMS only, $502M total funding',
        J(got), J([[[0, 0, 0], [0, 0], [0, 0], [0, 0]], [[0, 2000000, 502000000], [0, 0], [2000000, 2000000], [502000000, 502000000]]]));
    }
    w5Chk(name, 'nothing asked', 'the base board asked nothing while its file was built', J([X.w.__cc, X.errors.length]), J([0, 0]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
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
    const field = B => B.w.document.querySelector('#recBody select[onchange^="setSi("]');
    const choose = (B, id, v) => { B.ev(`recOpen=${J(id)}; render(); 'ok'`); const f = field(B);
      if (f) { f.value = v; f.dispatchEvent(new B.w.Event('change', { bubbles: true })); } return !!f; };
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
        B.ev(`JSON.stringify([recOpen, (function(){ var s=document.querySelector('#recBody select[onchange^="setSi("]'); return s? [s.value, s.options[s.selectedIndex].text, Array.from(s.options).map(function(o){ return o.value; }), document.activeElement===s] : 'NO FIELD'; })()])`),
        J(['R1', ['at', '“at” — not one of the five, kept as saved', ['', 'at', 'LA', 'EN', 'OT', 'FL', 'AT'], true]]));
      B.ev(`recOpen=null; render(); 'ok'`);
      w5Chk(name, where, 'a bulk write of AT on all nine counts R1 and R9 as answers it would overwrite: blank 1, same 1, differ 7',
        B.ev(`(function(){ matBulkF='Navy SI code'; matBulkV='AT'; matPmo='ALL'; matMissing=''; var P=matBulkPreview(); return JSON.stringify([P.n, P.blank, P.same, P.differ]); })()`),
        J([9, 1, 1, 7]));
      B.ev(`siShown=true; siOpen=true; siMatrix(); 'ok'`);
      w5Chk(name, where, 'the Special Interest overview: LA is R3’s $50,000 alone; R1’s and R9’s money is in the no recognized code row, 63.4%',
        B.ev(`JSON.stringify(Array.from(document.querySelectorAll('#siBody tr')).slice(1).map(function(r){ return Array.from(r.cells).map(function(c){ return c.textContent; }).join(' | '); }))`),
        J(['LA Airframe | — | — | $50,000 | $50,000 | 2.6%', 'EN Engine | — | $100,000 | $340,000 | $440,000 | 23.0%',
          'OT Other Government Costs | — | — | $60,000 | $60,000 | 3.1%', 'FL Fuel | — | — | $70,000 | $70,000 | 3.7%',
          'AT Audit | — | — | $80,000 | $80,000 | 4.2%', '— no recognized code — | — | $290,000 | $920,000 | $1,210,000 | 63.4%',
          'TOTAL | $0 | $390,000 | $1,520,000 | $1,910,000 | ']));
      w5Chk(name, where, 'the overview’s note says how much of that row is under a code the board does not recognize, and how much has none',
        J(['$1,210,000 carries no recognized code: $1,120,000 of it is on 2 requirements whose SI code from a file is not one of LA, EN, OT, FL or AT (kept as saved, listed in Needs attention) and $90,000 carries no code yet — set one from a requirement’s ⋯ menu.',
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
        ' 1 with no SI code — those cells are blank; set them from each row’s ⋯ menu. 2 with an SI code from a file that is not one of LA, EN, OT, FL or AT (kept as saved, listed in Needs attention) — their cells are blank too.');
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
      ' 6 with an SI code from a file that is not one of LA, EN, OT, FL or AT (kept as saved, listed in Needs attention) — their cells are blank.');
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
    NR.ev(`recOpen='R1'; render(); 'ok'`);
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
    w5Chk(name, 'locked cycle view', 'AT chosen there is refused: the code stays as saved, and the status line says R1 keeps it',
      J([pickedL, JSON.parse(LR.ev('JSON.stringify(S.si)')),
         LR.ev(`(document.getElementById('shareStat')||{}).textContent||''`).replace(/^🔒 Not kept — PB27 is a locked view\. /, '')]),
      J([true, { R1: 'at', R2: 'EN' }, '🏷 Ev R1 keeps SI “at” as saved, not one of LA, EN, OT, FL or AT. The CR cash export leaves the cell blank.']));
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
// ==== v2.00 (U42): a funds-flow sheet name never ends in half a character or begins or ends with an apostrophe ====
// On the destination axis each destination gets a sheet named by exportFlow's tabName, cut to 28 UTF-16 units (26 when it
// numbers a repeat). A cut through an emoji left its first half at the end, which the workbook wrote as U+FFFD; a name
// with an apostrophe at either end, or a cut that left one there, became a sheet name a spreadsheet may not have.
// THE BOARD: USAF/ANG/AFRC, R1 AV [900,000, 200,000, 0], funded, going to the last of seven destinations added by hand:
//   D x27 + 😀 + "tail"        -> "D" x27            (the 28-unit cut ended on the emoji's first half)
//   'Quoted depot'            -> Quoted depot       (an apostrophe at each end)
//   E x25 + 😀 + "A-one"       -> E x25 + 😀 + "A"   (the emoji fits whole: kept)
//   E x25 + 😀 + "A-two"       -> E x25 + " 2"       (a repeat of the one above; the 26-unit cut ended on the first half)
//   F x27 + "'tail"           -> "F" x27            (the cut left an apostrophe at the end)
//   O'Brien, Plain depot      -> unchanged          (an apostrophe inside a name is allowed)
// Read from the workbook's own bytes (xl/workbook.xml), working and after a save and reopen: no U+FFFD anywhere in it,
// every name 31 units or fewer and unique, the part parses. CONTROLS: the money (Funds Flow TOTAL FUNDING 1,100,000 =
// 900,000 + 200,000, and R1's two rows on Plain depot's sheet) and the seven names as saved, never cut.
// FAILS ON 7ee498a: the D, E-repeat and F names, Quoted depot, and U+FFFD in the part; the controls pass there too.
await (async () => {
  const name = 'v2.00 (U42) — a funds-flow sheet name never ends in half a character or begins or ends with an apostrophe';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  const keepBoards = () => [];
  try {
    const J = JSON.stringify, K = 1000;
    const { inflateRawSync } = await import('node:zlib');
    const cell = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c;
    const D27 = 'D'.repeat(27), E25 = 'E'.repeat(25), F27 = 'F'.repeat(27);
    const names = [D27 + '\u{1F600}tail', "'Quoted depot'", E25 + '\u{1F600}A-one', E25 + '\u{1F600}A-two', F27 + "'tail", "O'Brien", 'Plain depot'];
    const X = boot();
    seed(X.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('R1', 'AV', [900 * K, 200 * K, 0])], disc: [5000 * K, 5000 * K, 5000 * K], mand: [0, 0, 0], order: ['R1'] });
    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      applyState(S); save(); ${J(names)}.forEach(function(n){ flowAddEnt(); flowSetEnt(flowEnts().length-1,'n',n); });
      S.dest={R1:{to:flowEnts()[flowEnts().length-1].k,end:''}}; flowSetAxis('dest'); 'ok'`);
    const html = X.ev('buildSavedHtml()');
    // the workbook's bytes (base64), and what the board's own reader makes of them
    const flowBook = async B => JSON.parse(await B.w.eval(`(async function(){ var cap=null, _B=window.Blob;
      window.alert=function(){}; window.confirm=function(){ return true; };
      window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
      try{ exportFlow(); }catch(e){ window.Blob=_B; return JSON.stringify({err:'threw '+String((e&&e.message)||e)}); }
      window.Blob=_B; if(!cap) return JSON.stringify({err:'no file'});
      var u=cap instanceof Uint8Array? cap : new Uint8Array(cap), s='';
      for(var i=0;i<u.length;i+=8192) s+=String.fromCharCode.apply(null, Array.from(u.subarray(i,i+8192)));
      return JSON.stringify({b64:btoa(s), book:await xlsxRead(u.buffer.slice(u.byteOffset,u.byteOffset+u.byteLength))}); })()`));
    // one part of a ZIP, by its local headers (stored or deflated)
    const part = (b64, want) => { const u = Buffer.from(b64, 'base64'); let i = 0;
      while (i + 30 <= u.length && u.readUInt32LE(i) === 0x04034b50) {
        const m = u.readUInt16LE(i + 8), sz = u.readUInt32LE(i + 18), nl = u.readUInt16LE(i + 26), xl = u.readUInt16LE(i + 28);
        const d = u.subarray(i + 30 + nl + xl, i + 30 + nl + xl + sz);
        if (u.subarray(i + 30, i + 30 + nl).toString('utf8') === want) return m === 0 ? d : inflateRawSync(d);
        i += 30 + nl + xl + sz; }
      return null; };
    for (const [where, B] of [['working', X], ['saved and reopened', boot({ html })]]) {
      const got = await flowBook(B);
      const wb = got.b64 ? part(got.b64, 'xl/workbook.xml') : null;
      const doc = wb ? new B.w.DOMParser().parseFromString(wb.toString('utf8'), 'application/xml') : null;
      const nm = doc ? Array.from(doc.getElementsByTagName('sheet')).map(x => x.getAttribute('name')) : [];
      w5Chk(name, where, 'the 28-unit cut through an emoji drops its first half: the sheet is "D" x27',
        J(nm.filter(n => n.startsWith('DDDD'))), J([D27]));
      w5Chk(name, where, 'xl/workbook.xml holds no U+FFFD (EF BF BD)', wb ? wb.includes(Buffer.from([0xef, 0xbf, 0xbd])) : 'NO PART', false);
      w5Chk(name, where, 'an apostrophe at each end of a name, and one the cut left at the end, are gone: no name begins or ends with one',
        J([nm.filter(n => /Quoted|^FFFF/.test(n)), nm.filter(n => /^'|'$/.test(n))]), J([['Quoted depot', F27], []]));
      w5Chk(name, where, 'a repeat whose 26-unit cut ends on an emoji’s first half is "E" x25 + " 2"; the first, where the emoji fits, keeps it',
        J(nm.filter(n => n.startsWith('EEEE'))), J([E25 + '\u{1F600}A', E25 + ' 2']));
      w5Chk(name, where, 'CONTROL — an apostrophe inside a name stays, and Plain depot is unchanged',
        J(nm.filter(n => n === "O'Brien" || n === 'Plain depot')), J(["O'Brien", 'Plain depot']));
      w5Chk(name, where, 'CONTROL — the part parses; every name is 31 units or fewer and unique (any case); the first three are the summary sheets',
        J([doc ? doc.getElementsByTagName('parsererror').length : 'NO PART', nm.every(n => n.length <= 31), new Set(nm.map(n => n.toLowerCase())).size === nm.length, nm.slice(0, 3)]),
        J([0, true, true, ['Funds Flow', 'Prime Detail', 'OGC Detail']]));
      const ff = (got.book || {})['Funds Flow'] || [], plain = (got.book || {})['Plain depot'] || [];
      w5Chk(name, where, 'CONTROL — Funds Flow TOTAL FUNDING is 900,000 + 200,000 = 1,100,000',
        J(ff.filter(r => cell((r || [])[0]) === 'TOTAL FUNDING' && typeof cell(r[1]) === 'number').slice(-1).map(r => cell(r[1]))), J([1100 * K]));
      w5Chk(name, where, 'CONTROL — Plain depot’s sheet holds R1’s two service rows, its money unchanged',
        J(plain.slice(1).filter(r => cell(r[0]) === 'Req R1').map(r => [cell(r[2]), cell(r[3]), cell(r[4]), cell(r[5])])),
        J([['O&M', 'AV', 'USAF', 900 * K], ['O&M', 'AV', 'ANG', 200 * K]]));
      w5Chk(name, where, 'CONTROL — the seven destinations keep their whole names in the board’s data',
        B.ev('JSON.stringify(flowEnts().slice(-7).map(function(e){ return e.n; }))'), J(names));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
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
      S.wbs={R:[{w:'2.2', v:[]}]}; S.aceMap={PRIME_P:{w:['1.1'], ok:true}, R:{w:['2.2'], ok:true}};
      ACEDB.sets={'2027ACE':{lines:[{ap:mySlug(), pmo:'AV', wbs:'1.1', v:{}}, {ap:mySlug(), pmo:'AV', wbs:'2.2', v:{}}]}};
      ACEDB.sets['2027ACE'].lines[0].v[MS.cur]=900; ACEDB.sets['2027ACE'].lines[1].v[MS.cur]=600; aceYr='all';
      MS.pmos=GROUPS.concat(['ZED']); S.grp={Q:'ZED'};`;
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
      const ab = JSON.parse(await w6Book(W, 'exportAceTieout'));
      const al = ab['Alignment Breakout'] || [], ah = headerRow(al, 'FY', 'PMO', 'Line total');
      const mp = ab['Mapping by Requirement'] || [], mh = headerRow(mp, 'FY', 'PMO', 'Board funded');
      return {
        files: [bk.__err || 'ok', sb.__err || 'ok', ab.__err || 'ok'],
        summary: v198Sec(rc, 0, iReq).map(r => r.slice(0, 3)), requirements: v198Sec(rc, iReq, iPr), primes: v198Sec(rc, iPr, rc.length).map(r => r.slice(0, 3)),
        source: src.map(r => [num(r[9]), String(r[25] ?? ''), String(r[26] ?? ''), String(r[27] ?? ''), String(r[18] ?? '')]).sort((a, b) => a[0] - b[0]),
        alignment: al.slice(ah + 1).filter(r => /^FY\d\d$/.test(w6Lbl(r))).map(r => [w6Lbl(r), String(r[2]), String(r[3] ?? ''), num(r[5]), String(r[colOf(al, ah, 'RCN')] ?? ''), String(r[colOf(al, ah, 'EEIC')] ?? '')]),
        mapping: mp.slice(mh + 1).filter(r => /^FY\d\d$/.test(w6Lbl(r))).map(r => [w6Lbl(r), String(r[colOf(mp, mh, 'PMO')] ?? ''), String(r[colOf(mp, mh, 'Requirement (CCaR Record Name)')]), String(r[colOf(mp, mh, 'RCN')] ?? ''), String(r[colOf(mp, mh, 'EEIC')] ?? '')]),
        workbook: [cells.filter(t => /77777|YYYYY|99999|ZZZZZ|Renamed|WRK/.test(t)).length, 'PMO ZED' in bk, cells.filter(t => t === 'ZED').length] };
    };
    const exportsNow = () => exportsOf(X.w);
    const L = v198Lab, N = v198NONE;
    // THE CYCLE'S OWN CODES, as item 83's table has them; ZED holds Q; no cell names a code PB27 does not hold
    const ALIGN = fy => [[fy, 'Req PRIME_P', '0001', 652, '11111', 'AAAAA'], [fy, 'Req PRIME_P', '0001', 31, '33333', 'CCCCC'], [fy, 'Req PRIME_P', '0001', 41, '', ''],
      [fy, 'Req PRIME_P', '0002', 358, '44444', 'DDDDD'], [fy, 'Req R', '', 503, '11111', 'AAAAA'], [fy, 'Req R', '', 127, '22222', 'BBBBB'], [fy, 'Req Q', '', 71, '', '']];
    const MAP = fy => [[fy, 'AV', 'Req PRIME_P', '(3 combinations)', '(see breakout)'], [fy, 'AV', 'Req R', '(2 combinations)', '(see breakout)'], [fy, 'ZED', 'Req Q', '', '']];
    const LOCKED = { files: ['ok', 'ok', 'ok'],
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
      alignment: ALIGN('FY27').concat(ALIGN('FY28')), mapping: MAP('FY27').concat(MAP('FY28')), workbook: [0, true, 8] };
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
    w5Chk(name, 'the record’s steps: saved, reopened, PB27 viewed, 77777 typed', 'refused; RCN-EEIC by Month, the Spend Plan Source and the ACE tie-out (on its own year, FY27, as a reopened board shows it) carry the cycle’s own codes; no cell names 77777',
      J([rv, rk, rx]),
      J(['fired', true, Object.assign({}, LOCKED, { alignment: ALIGN('FY27'), mapping: MAP('FY27') })]));
    // ---- CONTROL: the working plan, no view -- an edit is allowed, and every export carries it
    fire('K4', 'rcn', '55555'); ev(`if(rcnOpen) toggleRcn(); 'ok'`);
    const w = await exportsNow(), WK = '99999 / ZZZZZ', W5 = '55555 / DDDDD';
    const WALIGN = fy => [[fy, 'Req PRIME_P', '0001', 724, '99999', 'ZZZZZ'], [fy, 'Req PRIME_P', '0002', 358, '55555', 'DDDDD'], [fy, 'Req R', '', 503, '99999', 'ZZZZZ'],
      [fy, 'Req R', '', 127, '22222', 'BBBBB'], [fy, 'Req Q', '', 71, '', '']];
    w5Chk(name, 'the working plan · K4 renumbered 55555 (allowed)', 'CONTROL — every export carries 55555 / DDDDD, and the working list (K3 removed: CLIN 0001’s AFRC on its standard, K1)',
      J([w.files, w.summary, w.primes, w.source, w.alignment]),
      J([['ok', 'ok', 'ok'], [['USAF', WK, 904], ['USAF', W5, 299], ['USAF', N, 71], ['USAF', 'USAF TOTAL', 1274], ['ANG', WK, 251], ['ANG', L('K2'), 127], ['ANG', 'ANG TOTAL', 378],
        ['AFRC', WK, 31], ['AFRC', W5, 59], ['AFRC', 'AFRC TOTAL', 90]],
        [['USAF', 'Req PRIME_P   (2 CLINs funded)', 700], ['USAF', 'CLIN 0001   ' + WK, 401], ['USAF', 'CLIN 0002   ' + W5, 299], ['USAF', 'USAF — PRIMES TOTAL', 700],
          ['ANG', 'Req PRIME_P   (1 CLIN funded)', 251], ['ANG', 'CLIN 0001   ' + WK, 251], ['ANG', 'ANG — PRIMES TOTAL', 251],
          ['AFRC', 'Req PRIME_P   (2 CLINs funded)', 90], ['AFRC', 'CLIN 0001   ' + WK, 31], ['AFRC', 'CLIN 0002   ' + W5, 59], ['AFRC', 'AFRC — PRIMES TOTAL', 90]],
        [[31, '0001', 'ZZZZZ', '99999', 'AV'], [41, '0001', '', '', 'AV'], [59, '0002', 'DDDDD', '55555', 'AV'], [71, '', '', '', 'ZED'], [127, '', 'BBBBB', '22222', 'AV'],
          [251, '0001', 'ZZZZZ', '99999', 'AV'], [299, '0002', 'DDDDD', '55555', 'AV'], [401, '0001', 'ZZZZZ', '99999', 'AV'], [503, '', 'ZZZZZ', '99999', 'AV']],
        WALIGN('FY27').concat(WALIGN('FY28'))]));
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
    const flowSheets = async () => { const bk = JSON.parse(await w6Book(X.w, 'exportFlow')); return [bk.__err || 'ok', Object.keys(bk).filter(k => !k.startsWith('__'))]; };
    ev(`cycView(${J(key)}); 'ok'`);
    const b0 = await bandCells(), f0 = await flowSheets();
    ev(`bandSet(0,'n','RENAMED BAND'); 'ok'`); const nk1 = notKept(), b1 = await bandCells();
    ev(`flowSetAxis('dest'); 'ok'`); const nk2 = notKept(), f1 = await flowSheets();
    ev(`cycLeave(); 'ok'`);
    // band 0 as the workbook prints it, and the funds-flow sheets cut by what the money buys: typed here
    const BANDS = ['ok', ['Decision Bands: Net Funding Available', 'Decision Bands: BAND 0 — NET FUNDING AVAILABLE  ·  fund in full  ·  counts toward the stoppage gap  ·  organization standard  ·  3 requirements',
      'Decision Bands: Net Funding Available', 'Decision Bands: Net Funding Available', 'Decision Bands: Net Funding Available']];
    const FLOW = ['ok', ['Funds Flow', 'Prime Detail', 'OGC Detail', 'Workforce & Travel', 'Depot, Repair & Materiel', 'Software, IT & Cyber', 'Engineering, Projects & Stud', 'Program Operations & Support']];
    w5Chk(name, 'PB27 viewed, nothing changed', 'CONTROL — the workbook names band 0 as locked, and the funds-flow export is cut by what the money buys', J([b0, f0]), J([BANDS, FLOW]));
    w5Chk(name, 'PB27 viewed · band 0 renamed RENAMED BAND (refused)', 'refused and said so; the workbook still names band 0 as it was locked', J([nk1, b1]), J([true, BANDS]));
    w5Chk(name, 'PB27 viewed · funds-flow axis set to destinations (refused)', 'refused and said so; the funds-flow export is still cut by what the money buys', J([nk2, f1]), J([true, FLOW]));
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
      S.wbs={A:[{w:'1.1', v:[]}]}; S.aceMap={A:{w:['1.1'], ok:true}}; S.dest={R:{to:'lm'}};
      ACEDB.sets={'2027ACE':{lines:[{ap:mySlug(), pmo:'AV', wbs:'1.1', v:{}}], locked:true, by:'Approver', ts:1, file:'2027 ACE approved.xlsx'}};
      ACEDB.sets['2027ACE'].lines[0].v[MS.cur]=900; aceYr='all'; persistAce(); applyState(S); save(); flowSetAxis('dest');
      globalThis.__wb=function(sheets, name){ var b=buildXlsx(sheets); return {name:name, arrayBuffer: async function(){ return b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength); }}; };
      globalThis.__aceRows=function(){ var rows=[[],[],[],[],[]]; rows[4][ACE_COL.y0]=2027; var r=[]; r[ACE_COL.appn]='O&M'; r[ACE_COL.svc]='USAF';
        r[ACE_COL.managed]='Y'; r[ACE_COL.pmo]='AIR VEHICLE'; r[ACE_COL.y0]=4.321; r[ACE_COL.ce]='CE1'; rows.push(r);
        rows.forEach(function(x){ for(var i=0;i<x.length;i++) if(x[i]===undefined) x[i]=''; }); return rows; };
      'ok'`);
    const key = ev(`window.confirm=function(){ return true; }; MS.base=MS.cur; MS.years[MS.cur]=S; save(); blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
    // after the lock: the working plan adds Depot X, a government activity, and sends R's money there (PB27 still sends it to Lockheed Martin)
    ev(`flowAddEnt(); (function(){ var L=flowEnts(); flowSetEnt(L.length-1,'n','Depot X'); flowSetEnt(L.length-1,'kind','gov'); })();
      setDest('R','to',destByName('Depot X').k); 'ok'`);
    const said = () => ev(`(document.getElementById('shareStat')||{}).textContent||''`);
    const spy = () => ev(`window.__asked=[]; window.confirm=function(m){ window.__asked.push(String(m).slice(0,70)); return true; };
      window.alert=function(m){ window.__asked.push('alert: '+String(m).slice(0,70)); }; 'ok'`);
    const asked = () => JSON.parse(ev(`JSON.stringify(window.__asked||[])`));
    const lists = () => JSON.parse(ev(`JSON.stringify((function(){ var s=ACEDB.sets['2027ACE'];
      return [s? [s.file||'', !!s.locked, s.lines.map(function(l){ return [l.pmo, l.wbs, (l.v||{})[MS.cur]]; })] : null,
        (BUDDB.rows||[]).map(function(b){ return b.n; }), flowEnts().map(function(e){ return e.n; })]; })())`));
    const stored = () => JSON.parse(ev(`JSON.stringify((function(){ var a=JSON.parse(localStorage.getItem('prio27acedb')||'null'), b=JSON.parse(localStorage.getItem('prio27buddb')||'null'),
      d=JSON.parse(localStorage.getItem(DEST_KEY)||'null'), s=a&&a.sets&&a.sets['2027ACE'];
      return [s? [s.file||'', !!s.locked, (s.lines||[]).map(function(l){ return [l.pmo, l.wbs, (l.v||{})[MS.cur]]; })] : null,
        b? (b.rows||[]).map(function(x){ return x.n; }) : null, d? (d.ents||[]).map(function(e){ return e.n; }) : null]; })())`));
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
      const ab = JSON.parse(await w6Book(X.w, 'exportAceTieout')), mp = ab['Mapping by Requirement'] || [], mh = hdr(mp, 'FY', 'PMO', 'Board funded');
      const rc = ab['Reconciliation by PMO'] || [], rh = hdr(rc, 'FY', 'PMO', 'Estimate');
      const fb = JSON.parse(await w6Book(X.w, 'exportFydpPlan')), bp = fb['By PMO'] || [], bh = hdr(bp, 'PMO', 'Requirements');
      const sb = JSON.parse(await w6Book(X.w, 'exportSrc')), s = Object.keys(sb).filter(k => !k.startsWith('__')).map(k => sb[k]).find(rs => Array.isArray(rs) && rs.length > 1) || [];
      const ff = JSON.parse(await w6Book(X.w, 'exportFlow'));
      return {
        files: [ab.__err || 'ok', fb.__err || 'ok', sb.__err || 'ok', ff.__err || 'ok'],
        mapping: mp.slice(mh + 1).filter(r => /^FY\d\d$/.test(w6Lbl(r))).map(r => ['Requirement (CCaR Record Name)', 'Match', 'WBS claimed', 'Board funded', 'Estimate', 'Delta'].map(n => r[col(mp, mh, n)] ?? '')),
        reconciliation: rc.slice(rh + 1).filter(r => w6Lbl(r) === 'FY27' && String(r[1] ?? '') === 'AV').map(r => [r[0], r[1], r[2], r[3], r[4]]),
        fydp: bp.slice(bh + 1).filter(r => w6Lbl(r) === 'AV').map(r => [r[0], r[col(bp, bh, 'FY27 ACE estimate')], r[col(bp, bh, 'FYDP ACE estimate')]]),
        source: [String((s[0] || [])[4] ?? ''), String((s[0] || [])[12] ?? ''), s.slice(1).map(r => [String(r[2] ?? ''), String(r[3] ?? ''), num(r[9]), String(r[4] ?? ''), String(r[12] ?? '')]).sort()],
        flow: (ff['Funds Flow'] || []).filter(r => (r || []).length >= 5 && ['Lockheed Martin', 'Depot X', 'Depot Z', 'Not yet assigned', 'RENAMED DEST', 'New destination'].includes(w6Lbl(r))).map(r => [w6Lbl(r), num(r[1]), num(r[4])]) };
    };
    // BY HAND. The view: R goes to Lockheed Martin (PB27's); the working plan: R goes to Depot X. A's $1,100 goes nowhere yet. The
    // estimate is the approved one: A confirmed on 1.1, $900 against A's $1,100; AV $900 against $1,730 funded. No budget, no records.
    const MAPPING = [['Req A', 'Confirmed - exact line', '1.1', 1100, 900, 200], ['Req R', 'No match', '', 630, '', '']];
    const SOURCE = ['Budget', 'OPR', [['CCA', 'Ev A', 200, '', ''], ['CCA', 'Ev A', 900, '', ''], ['CCR', 'Ev R', 127, '', ''], ['CCR', 'Ev R', 503, '', '']]];
    const VIEW = { files: ['ok', 'ok', 'ok', 'ok'], mapping: MAPPING, reconciliation: [['FY27', 'AV', 900, 1730, 830]], fydp: [['AV', 900, 900]], source: SOURCE,
      flow: [['Lockheed Martin', 630, 2], ['Depot X', 0, 0], ['Not yet assigned', 1100, 2]] };
    const WORK = Object.assign({}, VIEW, { flow: [['Lockheed Martin', 0, 0], ['Depot X', 630, 2], ['Not yet assigned', 1100, 2]] });
    const DEST = ['Lockheed Martin', 'Pratt & Whitney', 'NAWCAD Patuxent River', 'NAWCWD China Lake', 'FRC East, Cherry Point', 'NAWCAD Lakehurst', 'Defense Logistics Agency', 'OC-ALC Oklahoma City', 'Depot X'];
    const ACE0 = ['2027 ACE approved.xlsx', true, [['AV', '1.1', 900]]];
    const LISTS = [ACE0, [], DEST], STORED = [ACE0, null, DEST];
    const PANEL = ['Defense Logistics Agency', 'Depot X', 'FRC East, Cherry Point', 'Lockheed Martin', 'NAWCAD Lakehurst', 'NAWCAD Patuxent River', 'NAWCWD China Lake', 'OC-ALC Oklahoma City', 'Pratt & Whitney'];
    const OFF = what => '🔒 ' + what + ' is off while PB27 is on screen. It is a locked cycle, read only — the change was not kept. ↩ Leave the view to work the plan.';
    const view = () => ev(`cycView(${J(key)}); 'ok'`), leave = () => ev(`if(entOpen) toggleEnt(); cycLeave(); 'ok'`);
    const Rto = () => ev(`flowEntName(destOf(itemById('R')).to)`);
    // ---- CONTROL: PB27 viewed, nothing done; then the working plan
    view();
    w5Chk(name, 'PB27 viewed, nothing done', 'CONTROL — the lists, browser storage and the panel as they are; every export carries PB27’s own figures (R to Lockheed Martin)',
      J([lists(), stored(), panel(), await exportsNow()]), J([LISTS, STORED, PANEL, VIEW]));
    leave();
    w5Chk(name, 'the working plan, nothing done', 'CONTROL — R goes to Depot X, and every export says so', J([Rto(), await exportsNow()]), J(['Depot X', WORK]));
    // ---- EACH DOOR, with PB27 on screen
    const DOORS = [
      ['a cost estimate imported (2027 ACE.xlsx, AV $4.321M; the approved 2027ACE is loaded)', 'Importing a cost estimate', () => ev(`importAce({files:[__wb([{name:'ACE', rows:__aceRows()}], '2027 ACE.xlsx')], value:''})`)],
      ['a BAE list imported (an ANG budget for AV)', 'Importing a BAE budget list', () => ev(`importBud({files:[__wb([{name:'BAE', rows:[['Budget Name'], ['USAF O&M - ANG CAM ZZ9 Discretionary AV']]}], 'BAE.xlsx')], value:''})`)],
      ['a CCaR Records file imported (titles and OPR for CCA and CCR)', 'Importing CCaR records', () => ev(`importCcarRecs({files:[__wb([{name:'CCaR', rows:[['CCaR No','Title','OPR','PMO','Control No'],
        ['CCA','REFUSED TITLE A','REFUSED OPR','AV','7001'], ['CCR','REFUSED TITLE R','REFUSED OPR','AV','7002']]}], 'ccar-records.xlsx')], value:''})`)],
      ['Lockheed Martin renamed RENAMED DEST in its name field', 'Changing a destination', () => fireDest('name', 'Lockheed Martin', 'RENAMED DEST')],
      ['+ add a destination', 'Adding a destination', () => fireDest('flowAddEnt()')],
      ['Depot X removed with its ✕, answered OK', 'Removing a destination', () => fireDest('del', 'Depot X')],
      ['reset the list, answered OK', 'Resetting the destination list', () => fireDest('flowResetEnts()')]];
    for (const [what, door, act] of DOORS) {
      view(); panel(); spy();
      const r = await act(), st = said(), q = asked(), fired = (r === undefined || r === 'fired') ? 'ran' : String(r);
      w5Chk(name, 'PB27 viewed · ' + what, 'refused before anything is read or asked, and the status line says so', J([fired, st, q]), J(['ran', OFF(door), []]));
      w5Chk(name, 'PB27 viewed · ' + what, 'the lists, browser storage and the panel as they were; every export from the view carries PB27’s own figures',
        J([lists(), stored(), panel(), await exportsNow()]), J([LISTS, STORED, PANEL, VIEW]));
      leave();
      w5Chk(name, 'PB27 viewed · ' + what + ' · the view left', 'the working plan’s lists, R’s destination and every export are its own, as before',
        J([lists(), stored(), Rto(), await exportsNow()]), J([LISTS, STORED, 'Depot X', WORK]));
    }
    // ---- CONTROLS: on the working plan each door is open, and every export carries what it did (typed from the files)
    spy(); await ev(`importAce({files:[__wb([{name:'ACE', rows:__aceRows()}], '2027 ACE.xlsx')], value:''})`);
    const qa = asked().map(m => m.split('\n')[0]), la = lists(), sa = stored(), xa = await exportsNow();
    w5Chk(name, 'the working plan · a cost estimate imported (allowed)', 'CONTROL — it asks before replacing the approved 2027ACE, replaces it (AV $4,321,000, no WBS), and the tie-out and FYDP Spend Plan read it',
      J([qa, la[0], sa[0], xa.mapping, xa.reconciliation, xa.fydp]),
      J([['⚠ 2027ACE is already loaded and LOCKED.'], ['2027 ACE.xlsx', true, [['AV', '', 4321000]]], ['2027 ACE.xlsx', true, [['AV', '', 4321000]]],
        [['Req A', 'Confirmed', '1.1', 1100, 0, 1100], ['Req R', 'No match', '', 630, '', '']], [['FY27', 'AV', 4321000, 1730, -4319270]], [['AV', 4321000, 4321000]]]));
    await ev(`importBud({files:[__wb([{name:'BAE', rows:[['Budget Name'], ['USAF O&M - ANG CAM ZZ9 Discretionary AV']]}], 'BAE.xlsx')], value:''})`);
    const lb = lists(), sbud = stored(), xb = await exportsNow(), BUD = 'USAF O&M - ANG CAM ZZ9 Discretionary AV';
    w5Chk(name, 'the working plan · a BAE list imported (allowed)', 'CONTROL — the list is kept, and the Spend Plan Source names the ANG budget on A’s and R’s ANG lines',
      J([lb[1], sbud[1], xb.source]), J([[BUD], [BUD], ['Budget', 'OPR', [['CCA', 'Ev A', 200, BUD, ''], ['CCA', 'Ev A', 900, '', ''], ['CCR', 'Ev R', 127, BUD, ''], ['CCR', 'Ev R', 503, '', '']]]]));
    // + add a destination, named Depot Z in its name field, and R sent there: what the view refused, on the working plan
    const fa = fireDest('flowAddEnt()'), fd = fireDest('name', 'New destination', 'Depot Z');
    ev(`setDest('R','to',destByName('Depot Z').k); 'ok'`);
    const pd = panel(), ld = lists(), sd = stored(), xd = await exportsNow();
    ev(`if(entOpen) toggleEnt(); 'ok'`);
    w5Chk(name, 'the working plan · + add a destination, named Depot Z, R sent there (allowed)', 'CONTROL — the list, browser storage and the panel carry Depot Z, and the funds flow puts R’s $630 under it',
      J([fa, fd, pd.includes('Depot Z'), ld[2].slice(-1), sd[2].slice(-1), Rto(), xd.flow.filter(r => r[0] === 'Depot Z' || r[0] === 'Not yet assigned')]),
      J(['fired', 'fired', true, ['Depot Z'], ['Depot Z'], 'Depot Z', [['Depot Z', 630, 2], ['Not yet assigned', 1100, 2]]]));
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
    ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.wbs={A:[{w:'1.1', v:[]}]}; S.aceMap={A:{w:['1.1'], ok:true}};
      ACEDB.sets={'2027ACE':{lines:[{ap:mySlug(), pmo:'AV', wbs:'1.1', v:{}}], locked:true, by:'Approver', ts:2, file:'2027 ACE approved.xlsx'},
        '2026ACE':{lines:[{ap:mySlug(), pmo:'AV', wbs:'1.1', v:{}}], locked:true, by:'Approver', ts:1, file:'2026 ACE approved.xlsx'}};
      ACEDB.sets['2027ACE'].lines[0].v[MS.cur]=900; ACEDB.sets['2026ACE'].lines[0].v[MS.cur]=333; aceYr='all';
      persistAce(); applyState(S); save(); setSpAce('2027ACE');
      cycSetWorking('PB', MS.cur); ppCyc='PB'; ppYr=MS.cur; ppLineAdd('USAF'); ppSetV('USAF', ppLines(ppPos(),'USAF')[0].k, MS.cur, 'd', '1000'); 'ok'`);
    const key = ev(`window.confirm=function(){ return true; }; MS.base=MS.cur; MS.years[MS.cur]=S; save(); blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
    const notKept = () => /the change was not kept|Not kept/.test(ev(`(document.getElementById('shareStat')||{}).textContent||''`));
    // the Spend Plan as drawn on screen: its Cost data choice, and which of By PMO / By Service / ◀ prior 2 FY is pressed
    const onScreen = () => JSON.parse(ev(`(function(){ if(!spOpen){ spOpen=true; render(); }
      var s=[].slice.call(document.querySelectorAll('select')).filter(function(e){ return (e.getAttribute('onchange')||'')==='setSpAce(this.value)'; }).map(function(e){ return e.value; });
      var b=[].slice.call(document.querySelectorAll('button')).filter(function(e){ return /^setSp(By|Prior)\\(/.test(e.getAttribute('onclick')||'') && e.classList.contains('on'); }).map(function(e){ return e.textContent; });
      return JSON.stringify([s, b]); })()`));
    // a control the Spend Plan renders: the Cost data select (a value chosen, change fired) or a button (clicked)
    const press = (on, value) => ev(`(function(){ if(!spOpen){ spOpen=true; render(); } var el=[].slice.call(document.querySelectorAll('select, button')).filter(function(e){
      return (e.getAttribute('onchange')||e.getAttribute('onclick')||'')===${J(on)}; })[0]; if(!el) return 'no control';
      if(el.tagName==='SELECT'){ el.value=${J(value || '')}; el.dispatchEvent(new Event('change', {bubbles:true})); } else el.click(); return 'fired'; })()`);
    const hdr = (rows, ...must) => rows.findIndex(r => must.every(m => (r || []).some(c => String(c ?? '').trim() === m)));
    const col = (rows, h, n) => (rows[h] || []).findIndex(c => String(c ?? '').trim() === n);
    // the ACE tie-out and the FYDP Spend Plan, read from their bytes
    const tie = async () => { const ab = JSON.parse(await w6Book(X.w, 'exportAceTieout')), mp = ab['Mapping by Requirement'] || [], mh = hdr(mp, 'FY', 'PMO', 'Board funded');
      const rc = ab['Reconciliation by PMO'] || [], rh = hdr(rc, 'FY', 'PMO', 'Estimate');
      return [ab.__err || 'ok', w6Lbl(mp[0]), mp.slice(mh + 1).filter(r => /^FY\d\d$/.test(w6Lbl(r))).map(r => ['Requirement (CCaR Record Name)', 'Board funded', 'Estimate', 'Delta'].map(n => r[col(mp, mh, n)] ?? '')),
        rc.slice(rh + 1).filter(r => w6Lbl(r) === 'FY27' && String(r[1] ?? '') === 'AV').map(r => [r[0], r[1], r[2], r[3], r[4]])]; };
    const pos = async () => { const fb = JSON.parse(await w6Book(X.w, 'exportFydpPlan')), bs = fb['By Service'] || [], h = hdr(bs, 'Service'), c = col(bs, h, 'FY27 PPBE position');
      return [fb.__err || 'ok', bs.slice(h + 1).filter(r => ['USAF', 'ANG', 'AFRC', 'TOTAL'].includes(w6Lbl(r))).map(r => [w6Lbl(r), r[c]])]; };
    const stored = () => ev(`(JSON.parse(localStorage.getItem(_AP.key)||'{}')||{}).spAce||''`);
    // BY HAND. 2027ACE: A's $1,100 funded against $900 on 1.1 (delta 200); AV $900 against $1,730 funded (A 1,100 + R 630; delta 830).
    // 2026ACE: $333 against the same (767; 1,397). USAF's FY27 position $1,000; no other service logs one.
    const T900 = ['ok', 'ACE TIE-OUT - MAPPING BY REQUIREMENT  (2027ACE, FY27)', [['Req A', 1100, 900, 200], ['Req R', 630, '', '']], [['FY27', 'AV', 900, 1730, 830]]];
    const T333 = ['ok', 'ACE TIE-OUT - MAPPING BY REQUIREMENT  (2026ACE, FY27)', [['Req A', 1100, 333, 767], ['Req R', 630, '', '']], [['FY27', 'AV', 333, 1730, 1397]]];
    const POS = ['ok', [['USAF', 1000], ['ANG', '—'], ['AFRC', '—'], ['TOTAL', 1000]]];
    const SCREEN = [['2027ACE'], ['By PMO']];
    const view = () => ev(`cycView(${J(key)}); 'ok'`), leave = () => ev(`cycLeave(); 'ok'`);
    // ---- CONTROL: PB27 viewed, nothing chosen
    view();
    w5Chk(name, 'PB27 viewed, nothing chosen', 'CONTROL — the Spend Plan shows 2027ACE by PMO; the ACE tie-out ties out 2027ACE ($900); the FYDP Spend Plan prints USAF’s FY27 position, $1,000',
      J([onScreen(), await tie(), await pos()]), J([SCREEN, T900, POS]));
    // ---- EACH CHOICE, with PB27 on screen; the status line is read at once ('Not kept' is put in front of a message for 1.5 s only)
    const fa = press('setSpAce(this.value)', '2026ACE'), ka = notKept();
    w5Chk(name, 'PB27 viewed · Cost data set to 2026ACE in its select', 'refused and said so; the Spend Plan still shows 2027ACE, and the ACE tie-out taken from the view ties out 2027ACE ($900)',
      J([fa, ka, onScreen(), await tie()]), J(['fired', true, SCREEN, T900]));
    const fb = press("setSpBy('svc')"), kb = notKept(), fp = press('setSpPrior(!spPrior)'), kp = notKept();
    w5Chk(name, 'PB27 viewed · By Service, then ◀ prior 2 FY, pressed', 'each refused and said so; the Spend Plan is still by PMO, without the prior years',
      J([fb, kb, fp, kp, onScreen()]), J(['fired', true, 'fired', true, SCREEN]));
    ev(`setSpPmo('AV'); setSpSvc('USAF'); setSpDrillSvc('USAF'); 'ok'`); const kf = notKept();
    w5Chk(name, 'PB27 viewed · the PMO filter, the service filter and the PMO drill’s service set (the handlers their controls call)', 'each refused and said so; each is still all',
      J([kf, ev('JSON.stringify([spPmo, spSvc, spDrillSvc])')]), J([true, J(['ALL', 'ALL', 'ALL'])]));
    ev(`ppCyc='PB'; ppYr=MS.cur; ppSetV('USAF', ppLines(ppPos(),'USAF')[0].k, MS.cur, 'd', '5000'); 'ok'`); const kv = notKept();
    w5Chk(name, 'PB27 viewed · USAF’s FY27 PPBE position typed as $5,000', 'refused and said so; the FYDP Spend Plan taken from the view prints the position as logged, $1,000',
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
    w5Chk(name, 'PB27 viewed · each choice refused · the view left', 'the working plan’s Spend Plan shows 2027ACE by PMO, browser storage keeps 2027ACE, and its ACE tie-out ties out 2027ACE ($900)',
      J([onScreen(), stored(), await tie()]), J([SCREEN, '2027ACE', T900]));
    // ---- CONTROL: on the working plan the choice is open, kept, and the tie-out reads it
    const fw = press('setSpAce(this.value)', '2026ACE');
    w5Chk(name, 'the working plan · Cost data set to 2026ACE (allowed)', 'CONTROL — the Spend Plan’s Cost data shows 2026ACE, browser storage keeps it, and the ACE tie-out ties out 2026ACE ($333)',
      J([fw, onScreen()[0], stored(), await tie()]), J(['fired', ['2026ACE'], '2026ACE', T333]));
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
        S.wbs={A:[{w:'1.1', v:[]}]}; S.aceMap={A:{w:['1.1'], ok:true}};
        ACEDB.sets={'2027ACE':{lines:[{ap:mySlug(), pmo:'AV', wbs:'1.1', v:{}}], locked:true, by:'Approver', ts:1, file:'2027 ACE approved.xlsx'}};
        ACEDB.sets['2027ACE'].lines[0].v[MS.cur]=900; aceYr='all'; persistAce(); applyState(S); save(); 'ok'`);
      const ls = JSON.parse(X0.ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
      const X = boot({ ls }); boards.push(X);
      const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
      ev(`globalThis.__wb=function(sheets, name){ var b=buildXlsx(sheets); return {name:name, arrayBuffer: async function(){ __reads++; return b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength); }}; };
        globalThis.__reads=0;
        globalThis.__aceRows=function(){ var rows=[[],[],[],[],[]]; rows[4][ACE_COL.y0]=2027; var r=[]; r[ACE_COL.appn]='O&M'; r[ACE_COL.svc]='USAF';
          r[ACE_COL.managed]='Y'; r[ACE_COL.pmo]='AIR VEHICLE'; r[ACE_COL.y0]=4.321; r[ACE_COL.ce]='CE1'; rows.push(r);
          rows.forEach(function(x){ for(var i=0;i<x.length;i++) if(x[i]===undefined) x[i]=''; }); return rows; };
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
    // the ACE tie-out's Mapping by Requirement: [requirement, match, WBS, board funded, estimate, delta]
    const tie = async W => { const ab = JSON.parse(await w6Book(W, 'exportAceTieout')), mp = ab['Mapping by Requirement'] || [], mh = hdr(mp, 'FY', 'PMO', 'Board funded');
      return [ab.__err || 'ok', mp.slice(mh + 1).filter(r => /^FY\d\d$/.test(w6Lbl(r))).map(r => ['Requirement (CCaR Record Name)', 'Match', 'WBS claimed', 'Board funded', 'Estimate', 'Delta'].map(n => r[col(mp, mh, n)] ?? ''))]; };
    // BY HAND. A's $1,100 sits on 11111 / AAAAA (USAF 900, ANG 200); R's $630 on no code (USAF 503, ANG 127); AFRC carries nothing,
    // and its section prints a total of 0. The approved 2027ACE ties out A: $900 against $1,100 on 1.1, delta 200.
    const N = v198NONE, K1 = '11111 / AAAAA';
    const CODES = ['ok', 'ok', [['USAF', K1, 900], ['USAF', N, 503], ['USAF', 'USAF TOTAL', 1403], ['ANG', K1, 200], ['ANG', N, 127], ['ANG', 'ANG TOTAL', 327], ['AFRC', 'AFRC TOTAL', 0]],
      [[127, '', ''], [200, 'AAAAA', '11111'], [503, '', ''], [900, 'AAAAA', '11111']]];
    const TIE = ['ok', [['Req A', 'Confirmed - exact line', '1.1', 1100, 900, 200], ['Req R', 'No match', '', 630, '', '']]];
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

    // ==== 2. a state file carrying a cost estimate beside its years (SF4)
    {
      const { X, ev, key } = mk();
      const stf = JSON.parse(ev(`JSON.stringify(MS)`));
      stf.aceDb = { sets: { '2028ACE': { lines: [{ ap: 'om', pmo: 'AV', wbs: '1.1', v: { [String(stf.cur)]: 4321000 } }], locked: true, by: 'Someone', ts: 9, file: '2028 ACE.xlsx' } } };
      const sets = () => ev(`JSON.stringify([Object.keys(ACEDB.sets||{}).sort(), Object.keys((JSON.parse(localStorage.getItem('prio27acedb')||'{}').sets)||{}).sort()])`);
      ev(`cycView(${J(key)}); 'ok'`); spy(ev); fileOf(ev, J(stf), 'board-state.json');
      ev(`importState({files:[__f], value:''}); 'ok'`); const st2 = said(ev); await wait(X, 2000);
      w5Chk(name, 'PB27 viewed · a state file carrying a 2028 estimate ($4,321,000 on 1.1) taken through Import one appropriation', 'refused before the file is read; the estimates in the board and in browser storage are 2027ACE alone, and the ACE tie-out from the view ties out $900',
        J([st2, asked(ev), sets(), await tie(X.w)]), J([OFF('Importing a file'), [], J([['2027ACE'], ['2027ACE']]), TIE]));
      ev(`cycLeave(); 'ok'`);
      w5Chk(name, 'PB27 viewed · the state file refused · the view left', 'the working plan’s estimates are 2027ACE alone, and its ACE tie-out ties out $900',
        J([sets(), await tie(X.w)]), J([J([['2027ACE'], ['2027ACE']]), TIE]));
      // CONTROL: on the working plan the state file is taken (asked first) with the estimate it carries
      spy(ev); ev(`importState({files:[__f], value:''}); 'ok'`); await wait(X, 2000);
      w5Chk(name, 'the working plan · the state file taken (allowed)', 'CONTROL — asked, taken: the board and browser storage hold 2027ACE and 2028ACE',
        J([asked(ev).length, sets()]), J([1, J([['2027ACE', '2028ACE'], ['2027ACE', '2028ACE']])]));
    }

    // ==== 3. the workbook imports: refused before the file is read in a view, and once it is read when a view was put on screen meanwhile
    {
      const { X, ev, key } = mk();
      const lists = () => JSON.parse(ev(`JSON.stringify((function(){ var s=ACEDB.sets['2027ACE'], a=JSON.parse(localStorage.getItem('prio27acedb')||'null'), b=JSON.parse(localStorage.getItem('prio27buddb')||'null'), t=a&&a.sets&&a.sets['2027ACE'];
        return [s? [s.file||'', s.lines.map(function(l){ return (l.v||{})[MS.cur]; })] : null, t? [t.file||'', t.lines.map(function(l){ return (l.v||{})[MS.cur]; })] : null,
          (BUDDB.rows||[]).map(function(r){ return r.n; }), b? (b.rows||[]).map(function(r){ return r.n; }) : null]; })())`));
      const LISTS = [['2027 ACE approved.xlsx', [900]], ['2027 ACE approved.xlsx', [900]], [], null];
      const FILES = {
        ace: ['Importing a cost estimate', `importAce({files:[__wb([{name:'ACE', rows:__aceRows()}], '2027 ACE.xlsx')], value:''})`],
        bud: ['Importing a BAE budget list', `importBud({files:[__wb([{name:'BAE', rows:[['Budget Name'], ['USAF O&M - ANG CAM ZZ9 Discretionary AV']]}], 'BAE.xlsx')], value:''})`],
        ccar: ['Importing CCaR records', `importCcarRecs({files:[__wb([{name:'CCaR', rows:[['CCaR No','Title','OPR','PMO','Control No'], ['CCA','REFUSED TITLE A','REFUSED OPR','AV','7001']]}], 'ccar-records.xlsx')], value:''})`] };
      // with PB27 on screen: the file is never read
      for (const k of ['ace', 'bud', 'ccar']) {
        const [door, code] = FILES[k];
        ev(`cycView(${J(key)}); __reads=0; 'ok'`); spy(ev);
        await ev(code);
        w5Chk(name, 'PB27 viewed · ' + door.toLowerCase().replace(/^importing /, '') + ' imported', 'refused before the file is read (it is read 0 times, nothing asked); the lists in the board and in browser storage as they were',
          J([said(ev), ev('__reads'), asked(ev), lists()]), J([OFF(door), 0, [], LISTS]));
        ev(`cycLeave(); 'ok'`);
      }
      // started on the working plan; PB27 put on screen before the file has been read (the import's first wait)
      for (const k of ['ace', 'bud', 'ccar']) {
        const [door, code] = FILES[k];
        spy(ev);
        await ev(`(function(){ var p=${code}; cycView(${J(key)}); return p; })()`);
        w5Chk(name, 'an import of ' + door.toLowerCase().replace(/^importing /, '') + ' started on the working plan, PB27 put on screen while the file is read', 'refused once it is read, nothing asked; the lists as they were, and the ACE tie-out from the view ties out $900',
          J([said(ev), asked(ev), lists(), await tie(X.w)]), J([OFF(door), [], LISTS, TIE]));
        ev(`cycLeave(); 'ok'`);
      }
      w5Chk(name, 'the three races · the view left', 'the working plan’s lists as they were, and its ACE tie-out ties out $900', J([lists(), await tie(X.w)]), J([LISTS, TIE]));

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
    }

    // ==== 6. the shared state file loaded (adoptShared), with work in this browser no saved copy has
    {
      const { ev, key } = mk();
      ev(`SHARED=JSON.parse(JSON.stringify(MS)); SHARED.ts=MS.ts+60000; SHARED.by='Colleague C'; SHARED.years[String(MS.cur)].desc={R:'SHARED DESC R'}; baseSet({dirty:true}); DIRTY=false; 'ok'`);
      ev(`cycView(${J(key)}); 'ok'`); spy(ev); ev(`adoptShared(); 'ok'`);
      w5Chk(name, 'PB27 viewed · the shared state file loaded (adoptShared)', 'refused, and the status line says so; nothing is kept aside, and the work is still this browser’s unsaved work',
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
          return { kind: 'file', name: n, getFile: async () => { const c = files[n]; return { text: async () => c }; },
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
      ev(`cycView(${J(key)}); 'ok'`); spy(ev);
      const p1 = await X.ev('driveStorePull(true)');
      w5Chk(name, 'PB27 viewed · a Live refresh finds Colleague C’s newer copy in the shared folder', 'nothing loaded, nothing kept aside, and the work is still this browser’s unsaved work',
        J([pushed, p1, keptAside(ev), own(ev), ev('!!baseGet().dirty')]), J([true, false, 'none', [['11111'], 'MY UNSAVED A', ''], true]));
      const p2 = await X.ev('driveStorePull(false)');
      w5Chk(name, 'PB27 viewed · 📡 Connect (a refresh that speaks)', 'refused, and the status line says so', J([p2, said(ev)]), J([false, OFF('Loading from the shared folder')]));
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
// ==== end v2.00 (U10, the files, packages, ladder and shared copies) ====
// ==== v2.00 (U10, the funds flow's money): partner money, FMS money or a year refused in a locked view is in no total and no export ====
// Ledger U49 (the YEARSEL money review, round 3, SF1, probe P4; the lead put it in U10's track on 13 Oct): the funds flow's
// partner and FMS money and its year selection are kept beside the years (MS.flow), so only a refusal that makes the whole copy
// again puts them back. The blocks above read the funds flow's axis and its destinations, never its money. On P4's board -- one
// O&M requirement, F1 (PSM, $1,000,000,000 asked), $500,000,000 discretionary in FY27, an imported FY25 row of $40,000,000 -- with
// the funds flow's saved selection FY27, PB27 is locked and viewed. International Partners and Foreign Military Sales are typed in
// the fields the funds-flow panel draws for FY27, and FY25 is clicked in its year buttons; each is refused. After each, in the view:
// the status line, the calculation, the panel's total funding, the field on screen, and the Funds Flow export (its name, TOTAL
// FUNDING, US SERVICE FUNDING, International Partners, Foreign Military Sales). FAILS ON 7ee498a (board fce8a391): the status line
// says the change was not kept, yet the calculation and the export labelled "[PB27 LOCKED]" carry International Partners
// $3,000,000 and TOTAL FUNDING $503,000,000 (with FY25 clicked, $543,000,000) -- money neither the lock nor the plan holds.
// CONTROLS: PB27 viewed, nothing typed; the view left (the working plan holds no partner money, before this version too); on the
// working plan the same figure and the same click are allowed, and the export carries them. Every figure is typed here.
await (async () => {
  const name = 'v2.00 (U10) — partner money, FMS money or a year refused in a locked view is in no total and no export';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify, M = 1000000;
    const row = (fy, title, budget, amt, office) => { const r = Array(32).fill(''); r[0] = fy; r[1] = fy + '-03'; r[2] = 'U49' + fy; r[3] = title;
      r[4] = budget; r[7] = 'Event ' + title; r[9] = amt; r[10] = 'Allocated'; r[18] = office; return r; };
    const WB = { om: { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: [row(2025, 'Ordinary Support', 'USAF O&M Discretionary', 40 * M, 'Program (TSS)')] } } };
    const X = boot();
    seed(X.ev, { services: ['USAF'], items: [it('F1', 'PSM', [1000 * M])], disc: [500 * M], mand: [0], order: ['F1'] });
    const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.bm={disc:[${500 * M}], mand:[0], adds:[]}; MS.base=2027; MS.cur=2027; FYMON=fyMonths(2027); MS.years={2027:S};
      applyState(S); MS.years[2027]=S; EXDB.all=${J(WB)}; EXDB.ts=1;
      var C=flowCfg(); delete C.pseudo; C.other={}; C.fys=[2027]; C.aps=null; save(); 'ok'`);
    const key = ev(`window.confirm=function(){ return true; }; blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
    const notKept = () => /the change was not kept|Not kept/.test(ev(`(document.getElementById('shareStat')||{}).textContent||''`));
    // the calculation: [total, executed, planned, partners, FMS, grand], the years counted, and what is stored
    const calc = () => JSON.parse(ev(`(function(){ var F=flowCalc(); return JSON.stringify([[F.tot, F.execV, F.planV, F.ip, F.fms, F.grand], flowSelYears(),
      JSON.stringify(flowCfg().other), JSON.stringify(flowCfg().fys)]); })()`));
    // the panel as drawn on screen: its total funding, and the FY27 partner and FMS fields
    const panel = () => JSON.parse(ev(`(function(){ flowOpen=true; flowSel=''; flowBody(); var b=document.getElementById('flowBody');
      var t=/total funding \\$([\\d,]+\\.\\d\\d)M/.exec(b.textContent), f=function(k){ var i=[].slice.call(b.querySelectorAll('input')).filter(function(e){
        return (e.getAttribute('onchange')||'')==='flowSetOther(2027,"'+k+'",this.value)'; })[0]; return i? i.value : 'no field'; };
      return JSON.stringify([t? t[1] : '', f('ip'), f('fms')]); })()`));
    // a field the panel draws (a figure typed, change fired), or a year button (clicked)
    const type = (k, v) => ev(`(function(){ flowOpen=true; flowBody(); var i=[].slice.call(document.querySelectorAll('#flowBody input')).filter(function(e){
      return (e.getAttribute('onchange')||'')==='flowSetOther(2027,"${k}",this.value)'; })[0]; if(!i) return 'no control';
      i.value=${J(v)}; i.dispatchEvent(new Event('change', {bubbles:true})); return 'fired'; })()`);
    const click = on => ev(`(function(){ flowOpen=true; flowBody(); var b=[].slice.call(document.querySelectorAll('#flowBody button')).filter(function(e){
      return (e.getAttribute('onclick')||'')===${J(on)}; })[0]; if(!b) return 'no control'; b.click(); return 'fired'; })()`);
    // the Funds Flow export, read from its bytes: its name (the date taken out), and the money lines on the Funds Flow sheet
    const book = async () => { const r = JSON.parse(await X.w.eval(`(async function(){ var cap=null, _B=window.Blob, dl='';
        var _ck=HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click=function(){ dl=this.download; };
        window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
        try{ exportFlow(); }catch(e){ window.Blob=_B; HTMLAnchorElement.prototype.click=_ck; return JSON.stringify({__err:'threw '+String((e&&e.message)||e)}); }
        window.Blob=_B; HTMLAnchorElement.prototype.click=_ck; if(!cap) return JSON.stringify({__err:'no file'});
        return JSON.stringify({dl:dl, wb:await xlsxRead(cap.buffer.slice(cap.byteOffset, cap.byteOffset+cap.byteLength))}); })()`));
      if (r.__err) return [r.__err];
      const ff = (r.wb['Funds Flow'] || []).map(x => (x || []).map(c => (c && typeof c === 'object' && 'v' in c) ? c.v : c));
      const all = lab => ff.filter(x => w6Lbl(x) === lab).map(x => num(x[1])).filter(v => v !== null);
      return ['ok', String(r.dl).replace(/ 20\d\d-\d\d-\d\d/, ''), String((ff[1] || [])[0] ?? ''), all('TOTAL FUNDING'), all('US SERVICE FUNDING'),
        all('International Partners'), all('Foreign Military Sales')]; };
    const cyc0 = ev('JSON.stringify(CYCDB)'), ls0 = ev('localStorage.getItem(_AP.key)');
    // BY HAND. FY27 counts F1's planned $500,000,000 and nothing else; FY25's imported $40,000,000 only when FY25 is counted.
    const NAME = 'ORBIT Funds Flow - FY27 all appropriations PLANNED board allocation O M';
    const SCOPE = 'Scope: FY27 · all appropriations · PLANNED (board allocation, O&M)';
    const CALC = [[500000000, 0, 500000000, 0, 0, 500000000], [2027], '{}', '[2027]'];
    const BOOK = ['ok', NAME + ' [PB27 LOCKED].xlsx', SCOPE, [500000000, 500000000], [500000000], [0, 0], [0, 0]];
    const PANEL = ['500.00', '', ''];
    // ---- CONTROL: PB27 viewed, nothing typed
    ev(`cycView(${J(key)}); 'ok'`);
    w5Chk(name, 'PB27 viewed, nothing typed', 'CONTROL — the calculation, the panel and the export count FY27’s $500,000,000 and no partner or FMS money',
      J([ev('CYCVIEW'), calc(), panel(), await book()]), J([key, CALC, PANEL, BOOK]));
    // ---- EACH CHANGE, with PB27 on screen; the status line is read at once ('Not kept' is put in front of a message for 1.5 s only)
    const CHANGES = [['International Partners for FY27 typed as 3 ($M) in its field', () => type('ip', '3')],
      ['Foreign Military Sales for FY27 typed as 2 ($M) in its field', () => type('fms', '2')],
      ['FY25 clicked in the funds flow’s year buttons', () => click('flowToggleYear(2025)')]];
    for (const [what, act] of CHANGES) {
      const fired = act(), nk = notKept();
      w5Chk(name, 'PB27 viewed · ' + what, 'refused and said so; the calculation, the panel and the export labelled [PB27 LOCKED] count FY27’s $500,000,000 and nothing else',
        J([fired, nk, calc(), panel(), await book()]), J(['fired', true, CALC, PANEL, BOOK]));
    }
    // ---- CONTROL: the view left -- the working plan holds no partner money (it held none on 7ee498a either), and nothing durable moved
    ev(`cycLeave(); 'ok'`);
    w5Chk(name, 'each change refused · the view left', 'CONTROL — the working plan counts FY27’s $500,000,000 and stores no partner money; the cycle store and browser storage are byte for byte as they were',
      J([ev('CYCVIEW'), calc(), await book(), ev('JSON.stringify(CYCDB)') === cyc0, ev('localStorage.getItem(_AP.key)') === ls0]),
      J(['', CALC, ['ok', NAME + '.xlsx', SCOPE, [500000000, 500000000], [500000000], [0, 0], [0, 0]], true, true]));
    // ---- CONTROL: on the working plan the same figure and the same click are allowed, and the export carries them
    const wi = type('ip', '3'), ci = calc(), bi = await book();
    const wy = click('flowToggleYear(2025)'), cy = calc(), by = await book();
    w5Chk(name, 'the working plan · International Partners 3, then FY25 clicked (allowed)', 'CONTROL — $503,000,000 with $3,000,000 of partners; then FY25 and FY27, $543,000,000, and the export carries each',
      J([wi, ci, bi, wy, cy, by]),
      J(['fired', [[500000000, 0, 500000000, 3000000, 0, 503000000], [2027], '{"2027":{"ip":3000000}}', '[2027]'],
        ['ok', NAME + '.xlsx', SCOPE, [503000000, 503000000], [500000000], [3000000, 3000000], [0, 0]],
        'fired', [[540000000, 40000000, 500000000, 3000000, 0, 543000000], [2025, 2027], '{"2027":{"ip":3000000}}', '[2025,2027]'],
        ['ok', 'ORBIT Funds Flow - FY25 FY27 all appropriations FY27 planned the rest executed.xlsx', 'Scope: FY25, FY27 · all appropriations · FY27 planned, the rest executed',
          [543000000, 543000000], [540000000], [3000000, 3000000], [0, 0]]]));
    w5Chk(name, 'harness', 'CONTROL — no jsdom script errors', J(X.errors.length), J(0));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.00 (U10, the funds flow's money) ====

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
