// FOCUSED HARNESS: audit-recon preamble helpers, the blocks v2.00 (R1): funds flow -- execution precedence by appropriation and EFFECTIVE fiscal year ==== | v2.00 (R1, Brad's decisions of 11 Oct): a mixed total is said by its money, with its amounts; stored rows apart from their effective year ==== | v2.00 (U1): a row carried into a year neither imported nor planned is offered, and counted in ALL YEARS ==== | v2.00 (U14): ALL YEARS holds every plan the board holds; a saved year selection is kept, never swapped for ALL YEARS ==== | v2.00 (U34): a saved year selection this board did not write is read as no year, kept as saved and said -- never as ALL YEARS ==== | v2.00 (U36): an RCN / EEIC title over 80 characters is refused, never cut ==== | v2.00 (U41): an SI code a file carried that is not one of the five is kept, listed and never guessed ==== | v2.00 (U56/U57): a saved SI value that is not text is an answer a bulk write overwrites, and its field opens ==== | v2.00 (U58/U59): the change journal and the submittal review show a saved SI value that is not text as saved ==== | v2.00 (U42): a funds-flow sheet name never ends in half a character or begins or ends with an apostrophe ==== | v2.00 (U10): a refused edit in a locked cycle's view changes no code any export carries ==== | v2.00 (U10, beside the codes): a refusal in a locked view puts back the plan's settings, the year on screen, the CCaR records and the base year ==== | v2.00 (U10, the shared lists): a cost estimate, a BAE list, CCaR records or a destination change is refused in a locked view before anything is kept ==== | v2.00 (U10, the spend plan's choices): a spend-plan choice, a PPBE position or a destination's kind refused in a locked view leaves no trace ==== | v2.00 (U10, the files, packages, ladder and shared copies): a file, a package, the ladder or a shared copy is refused in a locked view before anything is kept ==== | v2.00 (U10, the funds flow's money): partner money, FMS money or a year refused in a locked view is in no total and no export ==== | v2.00 (U10, Load theirs): a view put on screen while Load theirs reads the shared folder keeps nothing aside ==== | v2.00 (U10, the change journal): ↶ Put back in a locked view is refused before the journal is touched ==== | v2.00 (U10, the funds flow's settings): an appropriation button, the pseudo year, a prime rule or a category refused in a locked view moves no money in any total or export ==== | v2.00 (U10, the unfunded list's place): "hold the unfunded list outside the flow" refused in a locked view moves no money in any total or export ==== | v2.00 (U10, the work kept aside): “↶ work kept aside” pressed in a locked view is refused before anything is asked or kept ==== and the guard, VERBATIM from /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/d6fea76/after/tools/export-audit/audit-recon.mjs
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
      R.ev(`matBulkF='Navy SI code'; matBulkV='AT'; matPmo='ALL'; matMissing=''; 'ok'`);
      return R;
    };
    const preview = R => { try { return R.ev(`JSON.stringify((function(){ var p=matBulkPreview(); return [p.n,p.blank,p.same,p.differ]; })())`); }
      catch (e) { return 'threw: ' + e.message; } };
    const field = R => { try { R.ev(`attGo('si','A'); 'ok'`);
        const f = R.w.document.querySelector('#recBody select[onchange^="setSi("]');
        return J([R.ev('recOpen'), f ? f.options[f.selectedIndex].textContent : 'NO FIELD']);
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
    O.ev(`recOpen=null; 'ok'`);
    const OQ = boot({ html: O.ev('buildSavedHtml()') });
    w5Chk(name, 'object with non-callable toString', 'CONTROL — object survives save/reopen, its code stays blank and $611 stays funded',
      OQ.ev(`JSON.stringify([S.si,siOf(itemById('A')),tiers().A.dT])`), J([{A:{toString:null},B:'',C:'EN'},'',611]));
    // a saved null was read as text before (String(null) is "null") and must stay an answer to overwrite
    const Nl = make(null);
    w5Chk(name, 'null alone', 'CONTROL — a saved null is an answer a bulk write overwrites, as before', preview(Nl), '[3,1,0,2]');
    // the kept choice, chosen again as drawn, is refused by setSi: the saved list stays exactly as it was
    const again = R => { try { R.ev(`attGo('si','A'); 'ok'`);
        const f = R.w.document.querySelector('#recBody select[onchange^="setSi("]'); if (!f) return 'NO FIELD';
        f.dispatchEvent(new R.w.Event('change', { bubbles: true })); return R.ev('JSON.stringify(S.si)');
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
    const choose = R => tryEv(R, `(function(){ attGo('si','A'); var f=document.querySelector('#recBody select[onchange^="setSi("]');
      if(!f) return 'NO FIELD'; f.value='AT'; f.dispatchEvent(new Event('change', {bubbles:true})); recOpen=null; return 'chosen'; })()`);
    const bulk = R => tryEv(R, `jrnlOpen=false; matBulkF='Navy SI code'; matBulkV='AT'; matPmo='ALL'; matMissing=''; matApplyBulk(); 'written'`);
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
// ==== end v2.00 (U58/U59) ====
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
      J([ev('CYCVIEW'), calc(), panel(), await book()]), J(['PB|2027', CALC, PANEL, BOOK]));
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
    const C2 = [['Colleague C', 'asks.F1', null, [1200000000]], ['Colleague C', 'notes.F1', null, 'after the lock']];
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
// ==== end v2.00 (U10, the change journal) ====
// ==== v2.00 (U10, the funds flow's settings): an appropriation button, the pseudo year, a prime rule or a category refused in a locked view moves no money in any total or export ====
// The U10 test review, round 4 (MF1, SF1): the funds flow's settings are kept beside the years (MS.flow) with its money, and the
// view's whole copy, made again after a refusal, puts them back -- but no check read them: a refusal that kept the appropriation
// buttons, the pseudo year (OBBBA), the prime-matching rules or the OGC categories passed every check. Each one moves money. On
// P4's board -- one O&M requirement, F1 (PSM, $1,000,000,000 asked), $500,000,000 discretionary in FY27, the funds flow's saved
// selection FY27 -- with two FY25 rows imported (Ordinary Support, O&M Discretionary, $40,000,000; Carried Support, O&M Mandatory,
// $7,000,000) and the pseudo year set to count Mandatory money appropriated in FY25 as FY27, switched off, PB27 is locked and
// viewed. With the panel's own controls: O&M is clicked out of the appropriation buttons; the pseudo year's button is pressed; F1
// is typed as the Lockheed Martin token; F1 is typed as the title words of Depot, Repair & Materiel. Each is refused. After each,
// in the view: the status line, the calculation and the settings it stands on, the panel (total funding, the token field, the
// title words field, the pseudo year's button, ALL appropriations lit) and the Funds Flow export (its name, Scope line, TOTAL
// FUNDING, Lockheed Martin, Program Operations & Support, Depot Repair & Materiel, the prime token line, Depot's rule line, the
// pseudo year's NOTE). FAILS ON 7ee498a (board fce8a391): the status line says the change was not kept, yet each refused setting
// stays in the view and the export labelled "[PB27 LOCKED]" counts by it -- O&M clicked out leaves TOTAL FUNDING $0 under a
// "FULL FUND INITIAL SPARES OPN" name. CONTROLS: PB27 viewed, nothing changed; the view left; on the working plan the same four
// changes are allowed, one after another, and each moves money in the export. Every figure is typed here.
await (async () => {
  const name = 'v2.00 (U10) — an appropriation button, the pseudo year, a prime rule or a category refused in a locked view moves no money in any total or export';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify, M = 1000000;
    const row = (id, fy, title, budget, amt) => { const r = Array(32).fill(''); r[0] = fy; r[1] = fy + '-03'; r[2] = id; r[3] = title;
      r[4] = budget; r[7] = 'Event ' + title; r[9] = amt; r[10] = 'Allocated'; r[18] = 'Program (TSS)'; return r; };
    const WB = { om: { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: [row('U10S1', 2025, 'Ordinary Support', 'USAF O&M Discretionary', 40 * M),
      row('U10S2', 2025, 'Carried Support', 'USAF O&M Mandatory', 7 * M)] } } };
    const X = boot();
    seed(X.ev, { services: ['USAF'], items: [it('F1', 'PSM', [1000 * M])], disc: [500 * M], mand: [0], order: ['F1'] });
    const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.bm={disc:[${500 * M}], mand:[0], adds:[]}; MS.base=2027; MS.cur=2027; FYMON=fyMonths(2027); MS.years={2027:S};
      applyState(S); MS.years[2027]=S; EXDB.all=${J(WB)}; EXDB.ts=1;
      var C=flowCfg(); C.other={}; C.fys=[2027]; C.aps=null; C.rules={lm:'LM', pw:'PW, P&W, PRATT', where:'both'};
      C.pseudo={on:false, label:'OBBBA', token:'OBBBA, Mandatory', from:2025, to:2027, col:4}; save(); 'ok'`);
    const key = ev(`window.confirm=function(){ return true; }; blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
    const notKept = () => /the change was not kept|Not kept/.test(ev(`(document.getElementById('shareStat')||{}).textContent||''`));
    // the calculation: [total, executed, planned, Lockheed Martin, Program Operations & Support, Depot Repair & Materiel, total
    // funding], the years and appropriations counted, and the settings as stored: the pseudo year, the prime rules, Depot's title words
    const calc = () => JSON.parse(ev(`(function(){ var F=flowCalc(), C=flowCfg(); return JSON.stringify([[F.tot, F.execV, F.planV, F.prime.LM.v,
      F.ext.by.ops.v, F.ext.by.depot.v, F.grand], flowSelYears(), flowSelAppns(), JSON.stringify(C.pseudo), JSON.stringify(C.rules), C.cats[1].ttl]); })()`));
    // the panel as drawn, its matching rules open: total funding, the Lockheed Martin token field, Depot's title words field, what the
    // pseudo year's button does when pressed, and whether ALL appropriations is the button lit
    const panel = () => JSON.parse(ev(`(function(){ flowOpen=true; flowRuleOpen=true; flowSel=''; flowBody(); var b=document.getElementById('flowBody');
      var t=/total funding \\$([\\d,]+\\.\\d\\d)M/.exec(b.textContent), q=function(sel, a, v){ return [].slice.call(b.querySelectorAll(sel)).filter(function(e){
        return (e.getAttribute(a)||'').indexOf(v)===0; })[0]; };
      var lm=q('input', 'onchange', "flowSetRule('lm',"), ct=q('input', 'onchange', "flowSetCat(1,'ttl',"), ps=q('button', 'onclick', 'flowSetPseudo("on",'), al=q('button', 'onclick', 'flowAllAppns()');
      return JSON.stringify([t? t[1] : '', lm? lm.value : 'no field', ct? ct.value : 'no field', ps? ps.getAttribute('onclick') : 'no button', al? al.classList.contains('on') : 'no button']); })()`));
    // a field the panel draws (a value typed, change fired), or a button (clicked); the matching rules drawn open
    const type = (on, v) => ev(`(function(){ flowOpen=true; flowRuleOpen=true; flowBody(); var i=[].slice.call(document.querySelectorAll('#flowBody input')).filter(function(e){
      return (e.getAttribute('onchange')||'')===${J(on)}; })[0]; if(!i) return 'no control';
      i.value=${J(v)}; i.dispatchEvent(new Event('change', {bubbles:true})); return 'fired'; })()`);
    const click = on => ev(`(function(){ flowOpen=true; flowRuleOpen=true; flowBody(); var b=[].slice.call(document.querySelectorAll('#flowBody button')).filter(function(e){
      return (e.getAttribute('onclick')||'')===${J(on)}; })[0]; if(!b) return 'no control'; b.click(); return 'fired'; })()`);
    // the Funds Flow export, read from its bytes: its name (the date taken out), its Scope line, and on the Funds Flow sheet the money
    // lines, the prime token line, Depot's rule line ("2" in the rules table: name, category cell, title words) and the pseudo year's NOTE
    const book = async () => { const r = JSON.parse(await X.w.eval(`(async function(){ var cap=null, _B=window.Blob, dl='';
        var _ck=HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click=function(){ dl=this.download; };
        window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
        try{ exportFlow(); }catch(e){ window.Blob=_B; HTMLAnchorElement.prototype.click=_ck; return JSON.stringify({__err:'threw '+String((e&&e.message)||e)}); }
        window.Blob=_B; HTMLAnchorElement.prototype.click=_ck; if(!cap) return JSON.stringify({__err:'no file'});
        return JSON.stringify({dl:dl, wb:await xlsxRead(cap.buffer.slice(cap.byteOffset, cap.byteOffset+cap.byteLength))}); })()`));
      if (r.__err) return [r.__err];
      const ff = (r.wb['Funds Flow'] || []).map(x => (x || []).map(c => (c && typeof c === 'object' && 'v' in c) ? c.v : c));
      const all = lab => ff.filter(x => w6Lbl(x) === lab).map(x => num(x[1])).filter(v => v !== null);
      return ['ok', String(r.dl).replace(/ 20\d\d-\d\d-\d\d/, ''), String((ff[1] || [])[0] ?? ''), all('TOTAL FUNDING'), all('Lockheed Martin'),
        all('Program Operations & Support'), all('Depot, Repair & Materiel'), w6Lbl(ff.find(x => /^Prime match tokens/.test(w6Lbl(x)))),
        (ff.find(x => w6Lbl(x) === '2') || []).slice(1, 4).map(c => String(c ?? '')), ff.filter(x => /^NOTE: includes/.test(w6Lbl(x))).map(w6Lbl)]; };
    const cyc0 = ev('JSON.stringify(CYCDB)'), ls0 = ev('localStorage.getItem(_AP.key)');
    // BY HAND. FY27 counts F1's planned $500,000,000, under Program Operations & Support (no token or title word matches "Req F1");
    // the FY25 rows are not in FY27 while the pseudo year is off.
    const NAME = 'ORBIT Funds Flow - FY27 all appropriations PLANNED board allocation O M';
    const SCOPE = 'Scope: FY27 · all appropriations · PLANNED (board allocation, O&M)';
    const TOK = 'Prime match tokens — Lockheed Martin: LM · Pratt & Whitney: PW, P&W, PRATT · looked for in: requirement title + plan event';
    const TOK1 = 'Prime match tokens — Lockheed Martin: F1 · Pratt & Whitney: PW, P&W, PRATT · looked for in: requirement title + plan event';
    const DEPOT = ['Depot, Repair & Materiel', 'DLA, BTL, Depot', 'Depot, Repair, Overhaul, Reset, DLA, Materiel, Spares'];
    const DEPOT1 = ['Depot, Repair & Materiel', 'DLA, BTL, Depot', 'F1'];
    const PS0 = '{"on":false,"label":"OBBBA","token":"OBBBA, Mandatory","from":2025,"to":2027,"col":4}';
    const PS1 = '{"on":true,"label":"OBBBA","token":"OBBBA, Mandatory","from":2025,"to":2027,"col":4}';
    const RU0 = '{"lm":"LM","pw":"PW, P&W, PRATT","where":"both"}', RU1 = '{"lm":"F1","pw":"PW, P&W, PRATT","where":"both"}';
    const ALL4 = ['om', 'ff', 'sp', 'opn'];
    const CALC = [[500000000, 0, 500000000, 0, 500000000, 0, 500000000], [2027], ALL4, PS0, RU0, DEPOT[2]];
    const PANEL = ['500.00', 'LM', DEPOT[2], 'flowSetPseudo("on",true)', true];
    const BOOK = ['ok', NAME + ' [PB27 LOCKED].xlsx', SCOPE, [500000000, 500000000], [0], [500000000], [0], TOK, DEPOT, []];
    // ---- CONTROL: PB27 viewed, nothing changed
    ev(`cycView(${J(key)}); 'ok'`);
    w5Chk(name, 'PB27 viewed, nothing changed', 'CONTROL — the calculation, the panel and the export count FY27’s $500,000,000 under Program Operations & Support, every setting as the working plan holds it',
      J([ev('CYCVIEW'), calc(), panel(), await book()]), J(['PB|2027', CALC, PANEL, BOOK]));
    // ---- EACH CHANGE, with PB27 on screen; the status line is read at once ('Not kept' is put in front of a message for 1.5 s only)
    const CHANGES = [['O&M clicked out of the funds flow’s appropriation buttons', () => click('flowToggleAppn("om")')],
      ['the pseudo year’s button (+ OBBBA FY25, counted as FY27) pressed', () => click('flowSetPseudo("on",true)')],
      ['F1 typed as the Lockheed Martin token in the matching rules', () => type("flowSetRule('lm',this.value)", 'F1')],
      ['F1 typed as the title words of Depot, Repair & Materiel', () => type("flowSetCat(1,'ttl',this.value)", 'F1')]];
    for (const [what, act] of CHANGES) {
      const fired = act(), nk = notKept();
      w5Chk(name, 'PB27 viewed · ' + what, 'refused and said so; the calculation, the panel and the export labelled [PB27 LOCKED] count FY27’s $500,000,000 under Program Operations & Support, every setting as it was',
        J([fired, nk, calc(), panel(), await book()]), J(['fired', true, CALC, PANEL, BOOK]));
    }
    // ---- CONTROL: the view left -- the working plan holds every setting as it was, and nothing durable moved
    ev(`cycLeave(); 'ok'`);
    w5Chk(name, 'each change refused · the view left', 'CONTROL — the working plan counts FY27’s $500,000,000 under Program Operations & Support, every setting as it was; the cycle store and browser storage are byte for byte as they were',
      J([ev('CYCVIEW'), calc(), panel(), await book(), ev('JSON.stringify(CYCDB)') === cyc0, ev('localStorage.getItem(_AP.key)') === ls0]),
      J(['', CALC, PANEL, ['ok', NAME + '.xlsx', SCOPE, [500000000, 500000000], [0], [500000000], [0], TOK, DEPOT, []], true, true]));
    // ---- CONTROL: on the working plan the same four changes are allowed, one after another, and each moves money in the export.
    // BY HAND: F1 under Depot; then F1 a Lockheed Martin line; then FY27 read from the $7,000,000 carried from FY25 (a year with
    // execution counted in it is read from that execution, never also from its plan); then O&M out, and nothing counted.
    const w1 = type("flowSetCat(1,'ttl',this.value)", 'F1'), c1 = calc(), b1 = await book();
    w5Chk(name, 'the working plan · F1 typed as the title words of Depot, Repair & Materiel (allowed)', 'CONTROL — F1’s $500,000,000 moves from Program Operations & Support to Depot, Repair & Materiel, and the export carries it and the rule',
      J([w1, c1, b1]), J(['fired', [[500000000, 0, 500000000, 0, 0, 500000000, 500000000], [2027], ALL4, PS0, RU0, 'F1'],
        ['ok', NAME + '.xlsx', SCOPE, [500000000, 500000000], [0], [0], [500000000], TOK, DEPOT1, []]]));
    const w2 = type("flowSetRule('lm',this.value)", 'F1'), c2 = calc(), b2 = await book();
    w5Chk(name, 'the working plan · then F1 typed as the Lockheed Martin token (allowed)', 'CONTROL — F1’s $500,000,000 is a Lockheed Martin line, and the export carries it and the token',
      J([w2, c2, b2]), J(['fired', [[500000000, 0, 500000000, 500000000, 0, 0, 500000000], [2027], ALL4, PS0, RU1, 'F1'],
        ['ok', NAME + '.xlsx', SCOPE, [500000000, 500000000], [500000000], [0], [0], TOK1, DEPOT1, []]]));
    const w3 = click('flowSetPseudo("on",true)'), c3 = calc(), b3 = await book();
    w5Chk(name, 'the working plan · then the pseudo year’s button pressed (allowed)', 'CONTROL — FY27 is read from the $7,000,000 of Mandatory money carried in from FY25, in place of its plan, and the export names it',
      J([w3, c3, b3]), J(['fired', [[7000000, 7000000, 0, 0, 7000000, 0, 7000000], [2027], ALL4, PS1, RU1, 'F1'],
        ['ok', 'ORBIT Funds Flow - FY27 all appropriations OBBBA FY25.xlsx', 'Scope: FY27 · all appropriations · + OBBBA FY25', [7000000, 7000000], [0], [7000000], [0], TOK1, DEPOT1,
          ['NOTE: includes 7000000 of OBBBA appropriated in FY2025 and counted here as FY2027 (1 plan events). Each row is counted in one fiscal year only.']]]));
    const w4 = click('flowToggleAppn("om")'), c4 = calc(), b4 = await book();
    w5Chk(name, 'the working plan · then O&M clicked out (allowed)', 'CONTROL — no appropriation in scope holds money: nothing is counted, and the export names the appropriations it stands on',
      J([w4, c4, b4]), J(['fired', [[0, 0, 0, 0, 0, 0, 0], [2027], ['ff', 'sp', 'opn'], PS1, RU1, 'F1'],
        ['ok', 'ORBIT Funds Flow - FY27 FULL FUND INITIAL SPARES OPN PLANNED board allocation O M.xlsx', 'Scope: FY27 · FULL FUND + INITIAL SPARES + OPN · PLANNED (board allocation, O&M)',
          [0, 0], [0], [0], [0], TOK1, DEPOT1, []]]));
    w5Chk(name, 'harness', 'CONTROL — no jsdom script errors', J(X.errors.length), J(0));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.00 (U10, the funds flow's settings) ====
// ==== v2.00 (U10, the unfunded list's place): "hold the unfunded list outside the flow" refused in a locked view moves no money in any total or export ====
// The U10 test review, round 5: the funds flow keeps where the Unfunded Priority List goes (MS.flow.uplTo) beside its other settings,
// and the view's whole copy, made again after a refusal, puts it back -- but no check read it: a refusal that kept it passed every
// check, while the Funds Flow export labelled "[PB27 LOCKED]" counted by it. It moves money: counted as Lockheed Martin, a UPL row
// is in the total; held outside the flow, no total contains it. One O&M requirement, F1 (PSM, $1,000,000,000 asked; $500,000,000
// discretionary in FY27); FY25 imported: Ordinary Support (O&M Discretionary, $40,000,000) and Unfunded Ask (O&M Discretionary,
// $3,000,000, on the Unfunded Priority List); the funds flow's saved selection FY25; the unfunded list counted as Lockheed Martin
// (the default). PB27 is locked and viewed, and "Hold outside the flow" is chosen with the panel's own radio (the matching rules
// drawn open): refused. Read: the status line, the calculation (total, Lockheed Martin, the unfunded list, the part of the total it
// makes, where it goes, total funding, the years counted, the setting as stored), the radio that is checked, and the Funds Flow
// export from its bytes (its name, Scope line, TOTAL FUNDING, Lockheed Martin, the unfunded requirements line, the UPL NOTE).
// FAILS ON 7ee498a (board fce8a391): the status line says the change was not kept, yet the view holds the list outside the flow and
// the export labelled "[PB27 LOCKED]" reads TOTAL FUNDING $40,000,000 and Lockheed Martin $0 for $43,000,000 and $3,000,000.
// CONTROLS: the working plan; PB27 viewed, nothing changed; the view left; on the working plan the same radio is allowed and moves
// $3,000,000 out of the total. Every figure is typed here.
await (async () => {
  const name = 'v2.00 (U10) — holding the unfunded list outside the flow, refused in a locked view, moves no money in any total or export';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify, M = 1000000;
    const row = (id, fy, title, budget, amt, upl) => { const r = Array(32).fill(''); r[0] = fy; r[1] = fy + '-03'; r[2] = id; r[3] = title;
      r[4] = budget; r[7] = 'Event ' + title; r[9] = amt; r[10] = 'Allocated'; r[17] = upl ? 'UPL' : ''; r[18] = 'Program (TSS)'; return r; };
    const WB = { om: { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: [row('U10U1', 2025, 'Ordinary Support', 'USAF O&M Discretionary', 40 * M, false),
      row('U10U2', 2025, 'Unfunded Ask', 'USAF O&M Discretionary', 3 * M, true)] } } };
    const X = boot();
    seed(X.ev, { services: ['USAF'], items: [it('F1', 'PSM', [1000 * M])], disc: [500 * M], mand: [0], order: ['F1'] });
    const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.bm={disc:[${500 * M}], mand:[0], adds:[]}; MS.base=2027; MS.cur=2027; FYMON=fyMonths(2027); MS.years={2027:S};
      applyState(S); MS.years[2027]=S; EXDB.all=${J(WB)}; EXDB.ts=1;
      var C=flowCfg(); C.other={}; C.fys=[2025]; C.aps=null; save(); 'ok'`);
    const key = ev(`window.confirm=function(){ return true; }; blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
    const said = () => ev(`(document.getElementById('shareStat')||{}).textContent||''`);
    // the calculation: [total, Lockheed Martin, the unfunded list, the part of the total it makes, where it goes, total funding], the
    // years counted, and the setting as stored (null: never set, which counts it as Lockheed Martin)
    const calc = () => JSON.parse(ev(`(function(){ var F=flowCalc(); return JSON.stringify([[F.tot, F.prime.LM.v, F.upl.v, F.uplIn, F.uplTo, F.grand],
      flowSelYears(), flowCfg().uplTo||null]); })()`));
    // the radio the panel draws checked, the matching rules open
    const radio = () => ev(`(function(){ flowOpen=true; flowRuleOpen=true; flowBody(); var i=document.querySelector('#flowBody input[name="uplto"]:checked');
      return i? i.getAttribute('onchange') : 'none checked'; })()`);
    const choose = v => ev(`(function(){ flowOpen=true; flowRuleOpen=true; flowBody(); var i=[].slice.call(document.querySelectorAll('#flowBody input')).filter(function(e){
      return (e.getAttribute('onchange')||'')===${J("flowSetUplTo('aside')")}; })[0]; if(!i) return 'no control';
      i.checked=true; i.dispatchEvent(new Event('change', {bubbles:true})); return 'fired'; })()`);
    // the Funds Flow export, read from its bytes: its name (the date taken out), its Scope line, and on the Funds Flow sheet TOTAL
    // FUNDING, Lockheed Martin, the unfunded requirements line and the NOTE saying how much of the total is unfunded
    const book = async () => { const r = JSON.parse(await X.w.eval(`(async function(){ var cap=null, _B=window.Blob, dl='';
        var _ck=HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click=function(){ dl=this.download; };
        window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
        try{ exportFlow(); }catch(e){ window.Blob=_B; HTMLAnchorElement.prototype.click=_ck; return JSON.stringify({__err:'threw '+String((e&&e.message)||e)}); }
        window.Blob=_B; HTMLAnchorElement.prototype.click=_ck; if(!cap) return JSON.stringify({__err:'no file'});
        return JSON.stringify({dl:dl, wb:await xlsxRead(cap.buffer.slice(cap.byteOffset, cap.byteOffset+cap.byteLength))}); })()`));
      if (r.__err) return [r.__err];
      const ff = (r.wb['Funds Flow'] || []).map(x => (x || []).map(c => (c && typeof c === 'object' && 'v' in c) ? c.v : c));
      const all = lab => ff.filter(x => w6Lbl(x) === lab).map(x => num(x[1])).filter(v => v !== null);
      return ['ok', String(r.dl).replace(/ 20\d\d-\d\d-\d\d/, ''), String((ff[1] || [])[0] ?? ''), all('TOTAL FUNDING'), all('Lockheed Martin'),
        all('Unfunded requirements'), ff.filter(x => /^NOTE: the total below includes/.test(w6Lbl(x))).map(w6Lbl)]; };
    const cyc0 = ev('JSON.stringify(CYCDB)'), ls0 = ev('localStorage.getItem(_AP.key)');
    // BY HAND. FY25 counts its two imported rows: $40,000,000 (an OGC, Program Operations & Support) and the $3,000,000 UPL row,
    // counted as a Lockheed Martin line: total $43,000,000, Lockheed Martin $3,000,000, of which the whole is unfunded.
    const NAME = 'ORBIT Funds Flow - FY25 all appropriations', SCOPE = 'Scope: FY25 · all appropriations';
    const NOTE = 'NOTE: the total below includes 3000000 of UNFUNDED requirements (Unfunded Priority List, 0% allocated), counted under Lockheed Martin.';
    const CALC = [[43000000, 3000000, 3000000, 3000000, 'LM', 43000000], [2025], null];
    const LM = "flowSetUplTo('LM')";
    const BOOK = n => ['ok', n, SCOPE, [43000000, 43000000], [3000000], [3000000], [NOTE]];
    w5Chk(name, 'fixture', 'CONTROL — the working plan counts FY25’s $43,000,000, the $3,000,000 unfunded row as Lockheed Martin',
      J([calc(), radio(), await book()]), J([CALC, LM, BOOK(NAME + '.xlsx')]));
    // ---- CONTROL: PB27 viewed, nothing changed
    ev(`cycView(${J(key)}); 'ok'`);
    w5Chk(name, 'PB27 viewed, nothing changed', 'CONTROL — the calculation, the panel and the export count the same $43,000,000, the unfunded row as Lockheed Martin',
      J([ev('CYCVIEW'), calc(), radio(), await book()]), J(['PB|2027', CALC, LM, BOOK(NAME + ' [PB27 LOCKED].xlsx')]));
    // ---- PB27 viewed: "Hold outside the flow" chosen -- refused; the status line is read at once
    const fired = choose('aside'), s = said();
    w5Chk(name, 'PB27 viewed · “Hold outside the flow” chosen for the Unfunded Priority List', 'refused and said so; the calculation, the panel and the export labelled [PB27 LOCKED] count $43,000,000 with the unfunded row as Lockheed Martin',
      J([fired, s, calc(), radio(), await book()]),
      J(['fired', '🔒 Saving is off while PB27 is on screen. It is a locked cycle, read only — the change was not kept. ↩ Leave the view to work the plan.',
        CALC, LM, BOOK(NAME + ' [PB27 LOCKED].xlsx')]));
    // ---- CONTROL: the view left -- the working plan holds the setting as it was, and nothing durable moved
    ev(`cycLeave(); 'ok'`);
    w5Chk(name, 'refused · the view left', 'CONTROL — the working plan counts the same $43,000,000; the cycle store and browser storage are byte for byte as they were',
      J([ev('CYCVIEW'), calc(), radio(), await book(), ev('JSON.stringify(CYCDB)') === cyc0, ev('localStorage.getItem(_AP.key)') === ls0]),
      J(['', CALC, LM, BOOK(NAME + '.xlsx'), true, true]));
    // ---- CONTROL: on the working plan the same radio is allowed, and moves the $3,000,000 out of every total. BY HAND: total and total
    // funding $40,000,000; Lockheed Martin $0; the unfunded list still measured ($3,000,000) and in no total; no NOTE.
    const w1 = choose('aside');
    w5Chk(name, 'the working plan · “Hold outside the flow” chosen (allowed)', 'CONTROL — the $3,000,000 unfunded row leaves the total and Lockheed Martin, and the export says so',
      J([w1, calc(), radio(), await book()]),
      J(['fired', [[40000000, 0, 3000000, 0, 'aside', 40000000], [2025], 'aside'], "flowSetUplTo('aside')",
        ['ok', NAME + '.xlsx', SCOPE, [40000000, 40000000], [0], [3000000], []]]));
    w5Chk(name, 'harness', 'CONTROL — no jsdom script errors', J(X.errors.length), J(0));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
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
