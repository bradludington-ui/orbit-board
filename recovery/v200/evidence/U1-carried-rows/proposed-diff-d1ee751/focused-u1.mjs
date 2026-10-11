// FOCUSED HARNESS (U1 draft): audit-recon preamble helpers, the R1 and R1-follow-up blocks and the guard, VERBATIM from the suite; then the draft U1 block.
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
const num = v => { if (typeof v === 'number') return v;
  const n = parseFloat(String(v ?? '').replace(/[$,\s]/g, '')); return isFinite(n) ? n : null; };
const w6Book = (W, fn) => W.eval(`(async function(){
  var cap=null,_B=window.Blob,msg='';
  window.alert=function(m){ msg+=String(m); }; window.confirm=function(){ return true; };
  window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
  try{ ${fn}(); }catch(e){ window.Blob=_B; return JSON.stringify({__err:'threw '+String((e&&e.message)||e)}); }
  window.Blob=_B;
  if(!cap) return JSON.stringify({__err:'no file: '+msg.slice(0,80)});
  var ab=cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength);
  return JSON.stringify(await xlsxRead(ab)); })()`);
const w6Lbl = r => String((r || [])[0] ?? '').trim();
import { appendFileSync as _w5Append } from 'node:fs';
const w5Chk = (scenario, where, what, got, want) => {
  if (process.env.SUITE_CHECKS) _w5Append(process.env.SUITE_CHECKS, JSON.stringify([scenario, where, what, String(got) === String(want), String(got).slice(0, 300)]) + '\n');
  chk(scenario, where, String(what), String(got), String(want));
};
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
// FAILS ON 4a6f7c7, except the CONTROLs and the raw-history guards: FY26 was not offered, so ALL YEARS was $540M and the $120M
// carried was in no year, on screen or in the export, and a saved FY26 selection silently became all years.
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
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.00 (U1) ====

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
