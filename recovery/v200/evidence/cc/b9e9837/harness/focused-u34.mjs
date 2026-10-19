// FOCUSED HARNESS: audit-recon preamble helpers, w7Pkg/w7Ok, the blocks v2.00 (U14) | v2.00 (U34) and the guard, VERBATIM from after/tools/export-audit/audit-recon.mjs
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
const w7Ok = pk => [pk.err || 'ok', pk.bad && pk.bad.length ? 'unreadable ' + pk.bad.join(',') : 'every part reads',
  Object.entries(pk.counts || {}).filter(([, c]) => c[0] !== c[1]).map(([k, c]) => k + ' says ' + c[0] + ' holds ' + c[1]).join(';') || 'every count holds'].join(' · ');
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
