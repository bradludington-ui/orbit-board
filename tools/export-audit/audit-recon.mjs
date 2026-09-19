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
import { boot, seed } from './boot.mjs';

let failures = [];
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
}

// ══ 2. CAPACITY ════════════════════════════════════════════════════════════════════════════════
// A service cannot draw more than its own BA, and one service's underspend can never pay for
// another's overdraw -- which a portfolio-level total would hide completely.
{
  const name = '2 capacity';
  F.svc.forEach((s, i) => {
    const d = Object.values(F.rows).reduce((a, r) => a + r.d[i], 0);
    const m = Object.values(F.rows).reduce((a, r) => a + r.m[i], 0);
    chk(name, s, 'discretionary drawn never exceeds the discretionary BA',
      d <= F.discBA[i] + 0.005 ? 'within' : `OVER by ${money(d - F.discBA[i])}`, 'within');
    chk(name, s, 'mandatory drawn never exceeds the mandatory BA',
      m <= F.mandBA[i] + 0.005 ? 'within' : `OVER by ${money(m - F.mandBA[i])}`, 'within');
  });
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
}

// ══ 4. THE SAME QUANTITY IS THE SAME NUMBER EVERYWHERE ═════════════════════════════════════════
// Six sheets, a deck and the board itself each print the funded topline, the discretionary draw and
// the unfunded total. They are computed by different code on different paths. If any two disagree,
// somebody is briefing one of them.
{
  const name = '4 agreement';
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
}

// ══ 7. MISSION CRITICAL, WHICH IS A MEMO AND MUST NEVER BE ADDED TO A LANE ═════════════════════
{
  const name = '7 mission critical';
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
}

// ══ 8. THE SAME TOTALS SURVIVE A SAVE, A REOPEN AND A PMO COPY ═════════════════════════════════
// Arithmetic that is right on this board and different after a round trip is still a wrong number
// in front of someone. Same figures, three files.
{
  const name = '8 survives the file';
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
}

// ══ 9. THE DECK ════════════════════════════════════════════════════════════════════════════════
// The deck is what actually gets briefed. It rounds to $0.1M, so it is checked at that precision --
// but a rounded figure still has to be the SAME figure, and its three tables have to agree with
// each other as well as with the workbook. A deck that disagrees with the workbook it was exported
// beside is the single most expensive way for this to go wrong.
{
  const name = '9 the deck';
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
  const cellIn = (tbl, rowRe, head) => {
    const t = deck.tables[tbl]; if (!t) return null;
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
  near(cellIn(1, /^TOTAL/, 'FY27 Ask'), board.ask, 'the stream table’s ask agrees with the board', 'Funding by Stream');
  near(cellIn(1, /^TOTAL/, 'Disc Funded'), board.disc, 'its discretionary agrees', 'Funding by Stream');
  near(cellIn(1, /^TOTAL/, 'Mand Drawn'), board.mand, 'its mandatory agrees', 'Funding by Stream');
  near(cellIn(1, /^TOTAL/, 'TOTAL Unf'), board.unf, 'its TOTAL unfunded agrees', 'Funding by Stream');
  near(cellIn(1, /^TOTAL/, 'Unf vs DISC'), board.discUnf,
    'its unfunded-vs-discretionary agrees', 'Funding by Stream');
  near(cellIn(2, /^TOTAL/, 'FY27 Ask'), board.ask, 'the PMO table’s ask agrees', 'Funding by PMO');
  near(cellIn(2, /^TOTAL/, 'Discretionary'), board.disc, 'its discretionary agrees', 'Funding by PMO');
  near(cellIn(2, /^TOTAL/, 'Mandatory'), board.mand, 'its mandatory agrees', 'Funding by PMO');
  near(cellIn(2, /^TOTAL/, 'Unfunded'), board.unf, 'its unfunded agrees', 'Funding by PMO');
  near(cellIn(2, /^TOTAL/, '★ MC req'), board.mcValue, 'its MC memo agrees', 'Funding by PMO');
  near(cellIn(2, /^TOTAL/, '★ MC short'), board.mcShort, 'its MC shortfall agrees', 'Funding by PMO');
  near(cellIn(3, /TOTAL ★ MISSION CRITICAL/, 'Requirement (must-pay)'), board.mcValue,
    'the MC slide agrees with the PMO slide', 'Mission Critical');
  near(cellIn(3, /TOTAL ★ MISSION CRITICAL/, 'Short vs Disc'), board.mcShort,
    'and so does its shortfall', 'Mission Critical');
  {
    const row = findRow(deck.tables[4], /TOTAL UNFUNDED/);
    const v = row ? dollars((row || []).map(cel).filter(x => /\$/.test(x)).pop()) : null;
    near(v, board.unf, 'the UFR slide agrees with the stream table', 'Unfunded');
  }
  {
    const row = findRow(deck.tables[0], /Mission Critical total/);
    const v = row ? dollars((row || []).map(cel).filter(x => /\$/.test(x)).pop()) : null;
    near(v, board.mcValue, 'and the title slide agrees with both', 'title slide');
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
}

// ══ 14. THE REPROGRAMMING LOG ══════════════════════════════════════════════════════════════════
// Every entry states money moving; the log subtotals each type net of deducts and nets it by
// service. Recorded as a gap on 15 Sep: "nothing re-derives those movements". The four seeded
// entries are re-derived here from their own amounts and signs.
{
  const name = 'the reprogramming log';
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
}

// ══ 16. CR CASH NEEDS — THE SHEET CROSS-FOOTS ══════════════════════════════════════════════════
// crData()'s own arithmetic -- the twelve half-month windows, the flip to 16-EOM, increments and
// the no-date bucket -- is proved in audit-board.mjs on a fixture built for it. This is the sheet
// that prints it: every service row is crData's, TOTAL is the services added, CUMULATIVE runs.
{
  const name = 'CR cash needs — the sheet cross-foots';
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
}

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
