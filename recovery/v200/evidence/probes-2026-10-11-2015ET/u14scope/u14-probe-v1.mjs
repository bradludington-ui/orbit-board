// u14-probe.mjs -- U14 SCOPE MAP (read-only on the product; synthetic; bounded by run.sh). Maps what ALL YEARS and the year
// chips include TODAY, cell by cell, and what happens to explicit selections. It proposes and builds nothing.
//   usage: node u14-probe.mjs <copyRoot> <outJson> <label>
// The board booted is <copyRoot>/prioritization-board-grid.html: BOARD is unset and asserted; the copy's shim is imported first.
//
// EVERY EXPECTED VALUE IS A HAND-WRITTEN LITERAL (the EXP table and the scenario literals below). Board helpers are only READ
// for observed values. Money is whole dollars; M = 1,000,000 so the panel's $M-to-two-decimals figures are checkable.
//
// FIXTURE (synthetic): O&M board (mySlug 'om'), one service USAF, one requirement F1 (ask 1,000M).
//   own FY27 plan: pot 500M (always).            own FY26 plan: pot 300M (plan P) or no FY26 year state (plan p).
//   workbook rows (EXDB.all, 32-col CCaR rows, seeded at STATE level as carry-probe and u1demo did):
//     always: O&M filed FY2025 'USAF O&M Discretionary' 40M (ordinary; counts in FY25)
//     row n : nothing else
//     row c : + Initial Spares filed FY2025 'USAF Spares Initial Mandatory PSM' 100M (counts in FY26 only when the rule is ON)
//     row f : + Initial Spares filed FY2026 'USAF Spares Initial PSM' 7M (counts in FY26 whatever the rule)
//   window: base 2027 (FY27-FY31, FY26 outside) or base 2026 (FY26-FY30, FY26 inside); MS.cur = 2027 in every matrix cell.
//   carryover rule: OFF = the product default (no MS.flow.pseudo: flowPseudo() makes flowPseudoDef(), on:false);
//                   ON  = flowSetPseudo('on', true), the '+ OBBBA FY25' chip's own handler.
// PRODUCT PATHS: base via setBaseYear() (the 🗓 menu's "Set base year…", window.prompt answered); the FY26 plan via
//   setBaseYear 2026 -> switchYear(2026) answered Cancel (blank) -> restoreReq('F1') -> bmSetBase('disc',0,'300000000')
//   -> switchYear(2027) -> (base 2027 cells) setBaseYear 2027; selections by CLICKING the rendered chips (.click() on the
//   panel's own buttons); plan removal by resetYear() (confirm OK); reopen = boot(buildSavedHtml()).
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(process.argv[2]);
const outPath = resolve(process.argv[3]);
const boardLabel = process.argv[4] || '';
delete process.env.BOARD;
delete process.env.MUT_FIRST_FAIL;
await import(pathToFileURL(root + '/runtime-encoding-shim.mjs').href);
const { boot, seed, bootRelease, BOARD } = await import(pathToFileURL(root + '/tools/export-audit/boot.mjs').href);
const blobOf = buf => createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
const boardPath = root + '/prioritization-board-grid.html';
if (resolve(BOARD) !== boardPath) throw new Error(`boot.mjs BOARD is ${BOARD}, not ${boardPath}`);
const ident = { boardLabel, boardPath, bootBOARD: BOARD, boardBlob: blobOf(readFileSync(boardPath)),
  bootBlob: blobOf(readFileSync(root + '/tools/export-audit/boot.mjs')), shimBlob: blobOf(readFileSync(root + '/runtime-encoding-shim.mjs')),
  probeBlob: blobOf(readFileSync(new URL(import.meta.url))) };
const isAfter = boardLabel === 'after';
if (!['before', 'after'].includes(boardLabel)) throw new Error('label must be before|after');

const J = JSON.stringify;
const M = 1000000;
const results = [];
const check = (scn, id, name, actual, expected) => { const ok = J(actual) === J(expected);
  results.push({ scenario: scn, id, name, expected, actual, status: ok ? 'passed' : 'failed' }); return ok; };
const note = (scn, id, name, actual) => results.push({ scenario: scn, id, name, actual, status: 'recorded' });
const getter = X => expr => JSON.parse(X.ev(`JSON.stringify(${expr})`));
const installConfirm = (w, ans) => { w.__cc = 0; w.__ccMsgs = []; w.__ccAns = ans;
  w.confirm = function (m) { w.__cc++; w.__ccMsgs.push(String(m).slice(0, 80)); return w.__ccAns; }; };

// ------------------------------------------------------------------------------------------------ fixture
const row = (fy, title, budget, amt, office) => { const r = Array(32).fill(''); r[0] = fy; r[1] = fy + '-03'; r[2] = 'SYN-EXEC';
  r[3] = title; r[4] = budget; r[7] = 'Event ' + title; r[9] = amt; r[10] = 'Allocated'; r[18] = office; return r; };
const ITEM = { id: 'F1', grp: 'PSM', team: 'PSM', sect: '', custom: false, title: 'Synthetic planned requirement',
  event: 'Synthetic planned event', ccar: 'SYN-F1', fy26: [0], ask: [1000 * M], alloc: null };
const WB = rowKind => {
  const a = { om: { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: [row(2025, 'Synthetic ordinary FY25 O&M requirement', 'USAF O&M Discretionary', 40 * M, 'Program (TSS)')] } } };
  if (rowKind === 'c') a.sp = { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: [row(2025, 'Synthetic carried spares requirement', 'USAF Spares Initial Mandatory PSM', 100 * M, 'Program (ATL)')] } };
  if (rowKind === 'f') a.sp = { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2026: [row(2026, 'Synthetic FY26-filed spares requirement', 'USAF Spares Initial PSM', 7 * M, 'Program (ATL)')] } };
  return a;
};
const setBase = (X, y) => { X.w.prompt = () => String(y); X.ev(`setBaseYear(); 'ok'`); X.w.prompt = () => null; };
// cfg: {base:2027|2026, rule:'off'|'on', plan:true|false, row:'n'|'c'|'f'}
const build = (scn, cfg) => {
  const X = boot(); const g = getter(X);
  seed(X.ev, { services: ['USAF'], items: [ITEM], disc: [500 * M], mand: [0], order: ['F1'] });
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.bm={disc:[${500 * M}], mand:[0], adds:[]}; MS.base=2027; MS.cur=2027; FYMON=fyMonths(2027); MS.years={2027:S};
    applyState(S); MS.years[2027]=S; EXDB.all=${J(WB(cfg.row))}; EXDB.ts=1;
    var C=flowCfg(); delete C.pseudo; C.other={}; C.fys=null; C.aps=null; save(); 'ok'`);
  installConfirm(X.w, false);
  const steps = [];
  if (cfg.plan || cfg.base === 2026) { setBase(X, 2026); steps.push(['setBaseYear 2026', g('MS.base')]); }
  if (cfg.plan) {
    X.ev(`switchYear(2026); 'ok'`);
    if (g('S.removed').indexOf('F1') >= 0) X.ev(`restoreReq('F1'); 'ok'`);
    X.ev(`bmSetBase('disc', 0, ${J(String(300 * M))}); switchYear(2027); 'ok'`);
    steps.push(['FY26 plan built (switchYear Cancel, restoreReq, bmSetBase, switchYear 2027)', g('MS.years[2026].discSvc'), X.w.__cc, X.w.__ccMsgs[0] || '']);
    if (cfg.base === 2027) { setBase(X, 2027); steps.push(['setBaseYear 2027', g('MS.base')]); }
  }
  if (cfg.rule === 'on') { X.ev(`flowSetPseudo('on', true); 'ok'`); steps.push(['flowSetPseudo on', g('flowPseudo().on')]); }
  const fx = g(`({base:MS.base, cur:MS.cur, years:Object.keys(MS.years).map(Number), d27:MS.years[2027].discSvc,
    d26:MS.years[2026]? MS.years[2026].discSvc : 'undefined', order26:MS.years[2026]? MS.years[2026].order : 'undefined',
    pseudo:flowPseudo(), wb:JSON.stringify(EXDB.all), fys:flowCfg().fys, slug:mySlug()})`);
  check(scn, 'fixture', 'fixture as built (base, cur, MS.years, FY27 500M, FY26 300M or none, rule, workbook, ALL YEARS selected, O&M board)',
    [fx.base, fx.cur, fx.years, fx.d27, fx.d26, cfg.plan ? fx.order26 : 'undefined', fx.pseudo, fx.wb === J(WB(cfg.row)), fx.fys, fx.slug],
    [cfg.base, 2027, cfg.plan ? [2026, 2027] : [2027], [500 * M], cfg.plan ? [300 * M] : 'undefined', cfg.plan ? ['F1'] : 'undefined',
      { on: cfg.rule === 'on', label: 'OBBBA', token: 'OBBBA, Mandatory', from: 2025, to: 2026, col: 4 }, true, null, 'om']);
  if (cfg.plan) check(scn, 'fixture', 'product path asked confirm exactly once, "FY26 has no data yet" (answered Cancel = blank)',
    [X.w.__cc, /^FY26 has no data yet/.test(X.w.__ccMsgs[0] || '')], [1, true]);
  note(scn, 'fixture', 'build steps', steps);
  installConfirm(X.w, true);   // during reads: OK (the roll-forward answer, the worst case), counted
  return X;
};

// ------------------------------------------------------------------------------------------------ readers
const readPanel = X => { X.ev(`flowOpen=true; flowSel=''; flowBody(); 'ok'`);
  const body = X.w.document.getElementById('flowBody'); const text = body.textContent;
  const tf = /total funding \$([\d,]+\.\d\d)M/.exec(text);
  const btns = [...body.querySelectorAll('button')];
  const chips = btns.filter(b => /^flowToggleYear\(\d+\)$/.test(b.getAttribute('onclick') || ''))
    .map(b => ({ fy: +/\d+/.exec(b.getAttribute('onclick'))[0], text: b.textContent, on: b.classList.contains('on'), title: b.getAttribute('title') || '' }));
  const all = btns.filter(b => b.getAttribute('onclick') === 'flowAllYears()').map(b => ({ text: b.textContent, on: b.classList.contains('on'), title: b.getAttribute('title') || '' }))[0] || null;
  const only = btns.filter(b => /^flowOneYear\(\d+\)$/.test(b.getAttribute('onclick') || '')).map(b => +/\d+/.exec(b.getAttribute('onclick'))[0]);
  return { total: tf ? tf[1] : null, chips, all, only, fy26InText: (text.match(/FY ?26|FY2026|2026/g) || []).length,
    fy26Snips: [...text.matchAll(/.{0,60}(FY ?26|FY2026).{0,60}/g)].map(m => m[0]).slice(0, 6) }; };
const readExport = async X => { const book = JSON.parse(await X.w.eval(`(async function(){ var cap=null, orig=window.Blob;
    window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new orig(p,o); };
    try { exportFlow(); } finally { window.Blob=orig; } if(!cap) throw Error('no workbook emitted');
    var ab=cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength); return JSON.stringify(await xlsxRead(ab)); })()`));
  const val = v => (v && typeof v === 'object' && 'v' in v) ? v.v : v; const ff = book['Funds Flow'] || [];
  return { tot: ff.filter(r => String(val(r[0])) === 'TOTAL FUNDING').map(r => val(r[1])).filter(v => typeof v === 'number'),
    scope: ff.map(r => String(val(r[0]) ?? '')).filter(s => /^Scope: /.test(s)) }; };
const flowNow = X => getter(X)(`(function(){ var F=flowCalc(); return {stored:flowCfg().fys, sel:flowSelYears(), offered:flowYears(),
  tot:F.tot, exec:F.execV, plan:F.planV, label:F.label}; })()`);
const click = (X, onclick) => { X.ev(`flowOpen=true; flowBody(); 'ok'`);
  const b = [...X.w.document.querySelectorAll('#flowBody button')].find(x => x.getAttribute('onclick') === onclick);
  if (!b) return false; b.click(); X.ev(`flowBody(); 'ok'`); return true; };
const reopen = X => { X.ev(`save(); 'ok'`); const R = boot({ html: X.ev('buildSavedHtml()') }); installConfirm(R.w, true); return R; };
const menuFy = X => { X.ev(`syncBtns(); 'ok'`); const d = X.w.document.getElementById('dd_fy'); return d ? d.textContent.replace(/\s+/g, ' ').trim() : null; };

// ------------------------------------------------------------------------------------------------ the CONTROL MATRIX (literal)
const O27 = [2025, 2027, 2028, 2029, 2030, 2031], O27w = [2025, 2026, 2027, 2028, 2029, 2030, 2031], O26 = [2025, 2026, 2027, 2028, 2029, 2030];
const T0 = 'FY2026 has no O&M execution imported, so O&M is answered from this board’s own allocation';
const T1 = T0 + '; other appropriations’ execution for it is read from their import';
// key base|rule|plan|row. off/all/missing per board: [before, after]. all = [total, executed, planned]. every = every dollar on the
// board. fy26 = [total, executed, planned] that FY26 holds (what an FY26 selection shows when FY26 is offered). fy25 = FY25 total.
// tip = FY26 chip tooltip when offered. Written by hand from the fixture amounts (40, 100, 7, 300, 500 $M).
const EXP = {
  '2027|off|P|n': { off: [O27, O27],   all: [[540, 40, 500], [540, 40, 500]],   every: 40 + 500 + 300,       fy26: [300, 0, 300], fy25: 40,  tip: T0 },
  '2027|off|p|n': { off: [O27, O27],   all: [[540, 40, 500], [540, 40, 500]],   every: 40 + 500,             fy26: [0, 0, 0],     fy25: 40,  tip: T0 },
  '2027|off|P|c': { off: [O27, O27],   all: [[640, 140, 500], [640, 140, 500]], every: 40 + 100 + 500 + 300, fy26: [300, 0, 300], fy25: 140, tip: T0 },
  '2027|off|p|c': { off: [O27, O27],   all: [[640, 140, 500], [640, 140, 500]], every: 40 + 100 + 500,       fy26: [0, 0, 0],     fy25: 140, tip: T0 },
  '2027|off|P|f': { off: [O27w, O27w], all: [[847, 47, 800], [847, 47, 800]],   every: 40 + 7 + 500 + 300,   fy26: [307, 7, 300], fy25: 40,  tip: T1 },
  '2027|off|p|f': { off: [O27w, O27w], all: [[547, 47, 500], [547, 47, 500]],   every: 40 + 7 + 500,         fy26: [7, 7, 0],     fy25: 40,  tip: T1 },
  '2027|on|P|n':  { off: [O27, O27],   all: [[540, 40, 500], [540, 40, 500]],   every: 40 + 500 + 300,       fy26: [300, 0, 300], fy25: 40,  tip: T0 },
  '2027|on|p|n':  { off: [O27, O27],   all: [[540, 40, 500], [540, 40, 500]],   every: 40 + 500,             fy26: [0, 0, 0],     fy25: 40,  tip: T0 },
  '2027|on|P|c':  { off: [O27, O27w],  all: [[540, 40, 500], [940, 140, 800]],  every: 40 + 100 + 500 + 300, fy26: [400, 100, 300], fy25: 40, tip: T1 },
  '2027|on|p|c':  { off: [O27, O27w],  all: [[540, 40, 500], [640, 140, 500]],  every: 40 + 100 + 500,       fy26: [100, 100, 0], fy25: 40,  tip: T1 },
  '2027|on|P|f':  { off: [O27w, O27w], all: [[847, 47, 800], [847, 47, 800]],   every: 40 + 7 + 500 + 300,   fy26: [307, 7, 300], fy25: 40,  tip: T1 },
  '2027|on|p|f':  { off: [O27w, O27w], all: [[547, 47, 500], [547, 47, 500]],   every: 40 + 7 + 500,         fy26: [7, 7, 0],     fy25: 40,  tip: T1 },
  '2026|off|P|n': { off: [O26, O26],   all: [[840, 40, 800], [840, 40, 800]],   every: 40 + 500 + 300,       fy26: [300, 0, 300], fy25: 40,  tip: T0 },
  '2026|off|p|n': { off: [O26, O26],   all: [[540, 40, 500], [540, 40, 500]],   every: 40 + 500,             fy26: [0, 0, 0],     fy25: 40,  tip: T0 },
  '2026|off|P|c': { off: [O26, O26],   all: [[940, 140, 800], [940, 140, 800]], every: 40 + 100 + 500 + 300, fy26: [300, 0, 300], fy25: 140, tip: T0 },
  '2026|off|p|c': { off: [O26, O26],   all: [[640, 140, 500], [640, 140, 500]], every: 40 + 100 + 500,       fy26: [0, 0, 0],     fy25: 140, tip: T0 },
  '2026|off|P|f': { off: [O26, O26],   all: [[847, 47, 800], [847, 47, 800]],   every: 40 + 7 + 500 + 300,   fy26: [307, 7, 300], fy25: 40,  tip: T1 },
  '2026|off|p|f': { off: [O26, O26],   all: [[547, 47, 500], [547, 47, 500]],   every: 40 + 7 + 500,         fy26: [7, 7, 0],     fy25: 40,  tip: T1 },
  '2026|on|P|n':  { off: [O26, O26],   all: [[840, 40, 800], [840, 40, 800]],   every: 40 + 500 + 300,       fy26: [300, 0, 300], fy25: 40,  tip: T0 },
  '2026|on|p|n':  { off: [O26, O26],   all: [[540, 40, 500], [540, 40, 500]],   every: 40 + 500,             fy26: [0, 0, 0],     fy25: 40,  tip: T0 },
  '2026|on|P|c':  { off: [O26, O26],   all: [[940, 140, 800], [940, 140, 800]], every: 40 + 100 + 500 + 300, fy26: [400, 100, 300], fy25: 40, tip: T1 },
  '2026|on|p|c':  { off: [O26, O26],   all: [[640, 140, 500], [640, 140, 500]], every: 40 + 100 + 500,       fy26: [100, 100, 0], fy25: 40,  tip: T1 },
  '2026|on|P|f':  { off: [O26, O26],   all: [[847, 47, 800], [847, 47, 800]],   every: 40 + 7 + 500 + 300,   fy26: [307, 7, 300], fy25: 40,  tip: T1 },
  '2026|on|p|f':  { off: [O26, O26],   all: [[547, 47, 500], [547, 47, 500]],   every: 40 + 7 + 500,         fy26: [7, 7, 0],     fy25: 40,  tip: T1 },
};
const bi = isAfter ? 1 : 0;
const mm = a => a.map(v => v * M);

async function cell(key) {
  const [base, rule, plan, rowK] = key.split('|');
  const cfg = { base: +base, rule, plan: plan === 'P', row: rowK };
  const scn = `${boardLabel}|M|${key}`;
  const E = EXP[key];
  const X = build(scn, cfg); const g = getter(X);
  const o = {};
  o.yearSets = g(`({workbook:flowExecYears(null,true), counted:flowExecYears(null), window:flowPlanYears(), msYears:Object.keys(MS.years).map(Number), offered:flowYears()})`);
  check(scn, 'offer', 'offered years (flowYears)', o.yearSets.offered, E.off[bi]);
  const A = flowNow(X);
  o.all = A;
  check(scn, 'all', 'ALL YEARS selected and [total, executed, planned]', [A.sel, A.tot, A.exec, A.plan], [E.off[bi], ...mm(E.all[bi])]);
  o.missing = (E.every - E.all[bi][0]);
  check(scn, 'all', `every dollar on the board ${E.every}M minus ALL YEARS = money in no offered year`, (E.every * M) - A.tot, o.missing * M);
  o.perYear = g(`flowYears().map(function(y){ var F=flowCalc(y); return [y, F.tot, F.execV, F.planV]; })`);
  check(scn, 'all', 'sum of the offered years one by one = ALL YEARS (nothing double counted)', o.perYear.reduce((s, r) => s + r[1], 0), E.all[bi][0] * M);
  o.direct26 = g(`(function(){ var F=flowCalc(2026); return [F.tot, F.execV, F.planV]; })()`);
  check(scn, 'fy26', 'flowCalc(2026) asked directly (bypasses the offer) = the money FY26 holds', o.direct26, mm(E.fy26));
  o.direct25 = g(`flowCalc(2025).tot`);
  check(scn, 'fy25', 'flowCalc(2025) = FY25 money', o.direct25, E.fy25 * M);
  const P = readPanel(X);
  o.panel = { total: P.total, all: P.all, chips: P.chips.map(c => [c.fy, c.text, c.on]), only: P.only, fy26InText: P.fy26InText };
  check(scn, 'panel', 'panel total funding $M = ALL YEARS', P.total, (E.all[bi][0]).toFixed(2));
  check(scn, 'panel', 'ALL YEARS chip on, its tooltip', [P.all && P.all.on, P.all && P.all.title], [true, 'Every year this board can answer for — executed and planned together']);
  const c26 = P.chips.find(c => c.fy === 2026) || null;
  o.chip26 = c26;
  const offered26 = E.off[bi].includes(2026);
  check(scn, 'chip26', 'FY26 chip present iff offered; text, tooltip', c26 ? [c26.text, c26.title] : null, offered26 ? ['FY26 · plan', E.tip] : null);
  const x = await readExport(X);
  o.export = x;
  check(scn, 'export', 'export TOTAL FUNDING (twice) = ALL YEARS', x.tot, [E.all[bi][0] * M, E.all[bi][0] * M]);
  o.menu = menuFy(X);
  o.menu26 = (o.menu || '').match(/FY26[^F]*/g) || [];
  // FY26 selected on the product path (its "only" button) -- possible only when offered
  if (offered26) {
    const ok = click(X, 'flowOneYear(2026)');
    const F = flowNow(X), P2 = readPanel(X);
    o.sel26 = { clicked: ok, ...F, panel: P2.total };
    check(scn, 'sel26', 'FY26 "only" clicked: stored [2026], selection [2026], [total, executed, planned], panel $M', [ok, F.stored, F.sel, F.tot, F.exec, F.plan, P2.total],
      [true, [2026], [2026], ...mm(E.fy26), E.fy26[0].toFixed(2)]);
    click(X, 'flowAllYears()');
    check(scn, 'sel26', 'ALL YEARS clicked back: stored null', getter(X)('flowCfg().fys'), null);
  } else {
    o.sel26 = { clicked: false, onlyButtons: P.only };
    check(scn, 'sel26', 'FY26 not offered: no FY26 chip and no FY26 "only" button to click', [c26, P.only.includes(2026)], [null, false]);
  }
  check(scn, 'control', 'window.confirm not called by any read; no jsdom errors; workbook unchanged',
    [X.w.__cc, X.errors, X.ev('JSON.stringify(EXDB.all)') === J(WB(cfg.row))], [0, [], true]);
  note(scn, 'record', 'cell observations', o);
  bootRelease(0);
  return o;
}

// ------------------------------------------------------------------------------------------------ EXPLICIT SELECTIONS
// Each: chosen by clicking the panel's own buttons, saved (save()), reopened (boot(buildSavedHtml())), read on both copies.
const selRead = (X) => { const F = flowNow(X), P = readPanel(X);
  return { stored: F.stored, sel: F.sel, offered: F.offered, tot: F.tot, exec: F.exec, plan: F.plan, label: F.label, panel: P.total,
    allOn: P.all && P.all.on, chipsOn: P.chips.filter(c => c.on).map(c => c.fy), fy26InText: P.fy26InText, fy26Snips: P.fy26Snips }; };
const SEL = {};
async function selScenario(name, cfg, fn) {
  const scn = `${boardLabel}|S|${name}`;
  try { SEL[name] = await fn(scn, build(scn, cfg)); }
  catch (e) { results.push({ scenario: scn, id: 'harness', name: 'scenario threw', actual: String((e && e.stack) || e).slice(0, 800), status: 'failed' }); }
  bootRelease(0);
}
const U14 = { base: 2027, rule: 'off', plan: true, row: 'c' };   // the ledger's U14 fixture

async function runSelections() {
  // S1 saved FY25-only (U14 fixture, rule OFF): FY25 = 40 + 100 (the carried row counts in FY25 when the rule is off)
  await selScenario('S1-FY25only-ruleOFF', U14, async (scn, X) => {
    const ok = click(X, 'flowOneYear(2025)'); const b = selRead(X); const R = reopen(X); const r = selRead(R);
    check(scn, 'S1', 'board: stored [2025], selection [2025], total 40+100', [ok, b.stored, b.sel, b.tot], [true, [2025], [2025], 140 * M]);
    check(scn, 'S1', 'reopened: stored [2025], selection [2025], total 140, panel $140.00M, ALL YEARS off, only FY25 on', [r.stored, r.sel, r.tot, r.panel, r.allOn, r.chipsOn], [[2025], [2025], 140 * M, '140.00', false, [2025]]);
    check(scn, 'S1', 'reopened: no confirm, no jsdom errors', [R.w.__cc, R.errors], [0, []]);
    return { board: b, reopened: r };
  });
  // S1b same, rule ON: FY25 = 40 (the carried 100 counts in FY26)
  await selScenario('S1b-FY25only-ruleON', { ...U14, rule: 'on' }, async (scn, X) => {
    const ok = click(X, 'flowOneYear(2025)'); const b = selRead(X); const R = reopen(X); const r = selRead(R);
    check(scn, 'S1b', 'board: stored [2025], selection [2025], total 40', [ok, b.stored, b.sel, b.tot], [true, [2025], [2025], 40 * M]);
    check(scn, 'S1b', 'reopened: stored [2025], selection [2025], total 40, panel $40.00M, only FY25 on', [r.stored, r.sel, r.tot, r.panel, r.allOn, r.chipsOn], [[2025], [2025], 40 * M, '40.00', false, [2025]]);
    return { board: b, reopened: r };
  });
  // S2 saved [FY25, FY27] (U14 fixture): 140 + 500 = 640 -- equal to this fixture's ALL YEARS, so the selection list is the test
  await selScenario('S2-FY25+FY27-U14', U14, async (scn, X) => {
    const ok = click(X, 'flowOneYear(2025)') && click(X, 'flowToggleYear(2027)'); const b = selRead(X); const R = reopen(X); const r = selRead(R);
    check(scn, 'S2', 'board: stored [2025,2027], selection [2025,2027], total 140+500', [ok, b.stored, b.sel, b.tot], [true, [2025, 2027], [2025, 2027], 640 * M]);
    check(scn, 'S2', 'reopened: stored [2025,2027], selection [2025,2027], total 640, ALL YEARS off, FY25+FY27 on', [r.stored, r.sel, r.tot, r.allOn, r.chipsOn], [[2025, 2027], [2025, 2027], 640 * M, false, [2025, 2027]]);
    return { board: b, reopened: r };
  });
  // S2f saved [FY25, FY27] where ALL YEARS differs: row f (FY26-filed 7), plan present, base 2027: [2025,2027] = 40+500 = 540; ALL = 847
  await selScenario('S2f-FY25+FY27-filed26', { base: 2027, rule: 'off', plan: true, row: 'f' }, async (scn, X) => {
    const ok = click(X, 'flowOneYear(2025)') && click(X, 'flowToggleYear(2027)'); const b = selRead(X); const R = reopen(X); const r = selRead(R);
    check(scn, 'S2f', 'board: stored [2025,2027], total 40+500', [ok, b.stored, b.sel, b.tot], [true, [2025, 2027], [2025, 2027], 540 * M]);
    check(scn, 'S2f', 'reopened: stored [2025,2027], selection [2025,2027], total 540 (not ALL YEARS 847)', [r.stored, r.sel, r.tot, r.panel], [[2025, 2027], [2025, 2027], 540 * M, '540.00']);
    return { board: b, reopened: r };
  });
  // S3 explicit FY26 selections
  await selScenario('S3a-FY26-U14-ruleOFF', U14, async (scn, X) => {
    const P = readPanel(X); const ok = click(X, 'flowOneYear(2026)');
    check(scn, 'S3a', 'U14 fixture: no FY26 chip and no FY26 "only" button: an FY26 selection cannot be made', [ok, P.chips.some(c => c.fy === 2026), P.only.includes(2026)], [false, false, false]);
    return { clicked: ok, chips: P.chips.map(c => c.fy) };
  });
  await selScenario('S3b-FY26-ruleON-base27', { ...U14, rule: 'on' }, async (scn, X) => {
    const ok = click(X, 'flowOneYear(2026)');
    if (!isAfter) { check(scn, 'S3b', 'before board: FY26 not offered, nothing to click', ok, false); return { clicked: ok }; }
    const b = selRead(X); const R = reopen(X); const r = selRead(R);
    check(scn, 'S3b', 'after board: stored [2026], total 100 carried + 300 plan', [ok, b.stored, b.sel, b.tot, b.exec, b.plan], [true, [2026], [2026], 400 * M, 100 * M, 300 * M]);
    check(scn, 'S3b', 'reopened: stored [2026], selection [2026], total 400, panel $400.00M, only FY26 on', [r.stored, r.sel, r.tot, r.panel, r.allOn, r.chipsOn], [[2026], [2026], 400 * M, '400.00', false, [2026]]);
    return { board: b, reopened: r };
  });
  await selScenario('S3c-FY26-ruleOFF-base26', { ...U14, base: 2026 }, async (scn, X) => {
    const ok = click(X, 'flowOneYear(2026)'); const b = selRead(X); const R = reopen(X); const r = selRead(R);
    check(scn, 'S3c', 'board: stored [2026], total 300 (all planned)', [ok, b.stored, b.sel, b.tot, b.exec, b.plan], [true, [2026], [2026], 300 * M, 0, 300 * M]);
    check(scn, 'S3c', 'reopened: stored [2026], selection [2026], total 300, panel $300.00M', [r.stored, r.sel, r.tot, r.panel, r.allOn, r.chipsOn], [[2026], [2026], 300 * M, '300.00', false, [2026]]);
    return { board: b, reopened: r };
  });
  await selScenario('S3d-FY26-filed26-base27', { base: 2027, rule: 'off', plan: true, row: 'f' }, async (scn, X) => {
    const ok = click(X, 'flowOneYear(2026)'); const b = selRead(X); const R = reopen(X); const r = selRead(R);
    check(scn, 'S3d', 'board: stored [2026], total 7 executed + 300 planned', [ok, b.stored, b.sel, b.tot, b.exec, b.plan], [true, [2026], [2026], 307 * M, 7 * M, 300 * M]);
    check(scn, 'S3d', 'reopened: stored [2026], selection [2026], total 307', [r.stored, r.sel, r.tot, r.panel], [[2026], [2026], 307 * M, '307.00']);
    return { board: b, reopened: r };
  });
  // S4 a saved selection holding a year that later stops being offered
  // S4a rule switched OFF after FY26 was selected (after board only: the before board never offers FY26 here)
  await selScenario('S4a-FY26-then-rule-OFF', { ...U14, rule: 'on' }, async (scn, X) => {
    const ok = click(X, 'flowOneYear(2026)');
    if (!isAfter) { check(scn, 'S4a', 'before board: FY26 not offered with the rule on at base 2027, so it cannot be selected', ok, false); return { clicked: ok }; }
    const b0 = selRead(X);
    const okRule = click(X, 'flowSetPseudo("on",false)');
    const b1 = selRead(X); const R = reopen(X); const r = selRead(R);
    check(scn, 'S4a', 'FY26 selected: [2026], 400', [ok, b0.stored, b0.sel, b0.tot], [true, [2026], [2026], 400 * M]);
    check(scn, 'S4a', 'rule switched off (its chip): FY26 no longer offered; stored [2026] kept; selection becomes ALL YEARS; total 40+100+500 = 640',
      [okRule, b1.offered, b1.stored, b1.sel, b1.tot, b1.allOn], [true, O27, [2026], O27, 640 * M, true]);
    check(scn, 'S4a', 'reopened: stored [2026], selection ALL YEARS, total 640, panel $640.00M, ALL YEARS chip on', [r.stored, r.sel, r.tot, r.panel, r.allOn, r.chipsOn], [[2026], O27, 640 * M, '640.00', true, []]);
    // the dormant selection: rule back on (reopened copy) -> FY26 offered again -> the stored [2026] applies again
    const okBack = click(R, 'flowSetPseudo("on",true)');
    const r2 = selRead(R);
    check(scn, 'S4a', 'reopened, rule switched back on: stored [2026] applies again, total 400', [okBack, r2.stored, r2.sel, r2.tot], [true, [2026], [2026], 400 * M]);
    return { board0: b0, board1: b1, reopened: r, reopenedRuleBack: r2 };
  });
  // S4b base moved 2026 -> 2027 after FY26 was selected (both boards)
  await selScenario('S4b-FY26-then-base27', { ...U14, base: 2026 }, async (scn, X) => {
    const ok = click(X, 'flowOneYear(2026)'); const b0 = selRead(X);
    setBase(X, 2027); X.ev(`flowBody(); 'ok'`);
    const b1 = selRead(X); const R = reopen(X); const r = selRead(R);
    check(scn, 'S4b', 'FY26 selected at base 2026: [2026], 300', [ok, b0.stored, b0.sel, b0.tot], [true, [2026], [2026], 300 * M]);
    check(scn, 'S4b', 'base moved to 2027 (Set base year): FY26 not offered; stored [2026] kept; selection becomes ALL YEARS; total 40+100+500 = 640 (the 300 is in no year)',
      [b1.offered, b1.stored, b1.sel, b1.tot, b1.allOn], [O27, [2026], O27, 640 * M, true]);
    check(scn, 'S4b', 'reopened: stored [2026], selection ALL YEARS, total 640, panel $640.00M, ALL YEARS chip on', [r.stored, r.sel, r.tot, r.panel, r.allOn, r.chipsOn], [[2026], O27, 640 * M, '640.00', true, []]);
    // a click while in the fallback: toggling FY27 starts from ALL YEARS and overwrites the stored [2026]
    const okT = click(R, 'flowToggleYear(2027)'); const r2 = selRead(R);
    check(scn, 'S4b', 'reopened, FY27 toggled from the fallback: stored = every offered year but FY27; [2026] is gone', [okT, r2.stored, r2.tot], [true, [2025, 2028, 2029, 2030, 2031], 140 * M]);
    return { board0: b0, board1: b1, reopened: r, afterToggle: r2 };
  });
  // S4c [FY25, FY26] then base moved: selection narrows to [FY25]
  await selScenario('S4c-FY25+FY26-then-base27', { ...U14, base: 2026 }, async (scn, X) => {
    const ok = click(X, 'flowOneYear(2025)') && click(X, 'flowToggleYear(2026)'); const b0 = selRead(X);
    setBase(X, 2027); const b1 = selRead(X); const R = reopen(X); const r = selRead(R);
    check(scn, 'S4c', 'selected [2025,2026] at base 2026: 140 + 300', [ok, b0.stored, b0.sel, b0.tot], [true, [2025, 2026], [2025, 2026], 440 * M]);
    check(scn, 'S4c', 'base moved to 2027: stored [2025,2026] kept; selection [2025]; total 140 (the 300 dropped)', [b1.stored, b1.sel, b1.tot, b1.allOn, b1.chipsOn], [[2025, 2026], [2025], 140 * M, false, [2025]]);
    check(scn, 'S4c', 'reopened: stored [2025,2026], selection [2025], total 140, panel $140.00M', [r.stored, r.sel, r.tot, r.panel], [[2025, 2026], [2025], 140 * M, '140.00']);
    return { board0: b0, board1: b1, reopened: r };
  });
  // S4d plan removed (resetYear) with FY26 selected at base 2026: FY26 stays offered (window); selection kept; total 0
  await selScenario('S4d-FY26-then-plan-reset', { ...U14, base: 2026 }, async (scn, X) => {
    const ok = click(X, 'flowOneYear(2026)'); const b0 = selRead(X);
    installConfirm(X.w, true); X.ev(`switchYear(2026); resetYear(); switchYear(2027); 'ok'`); const cc = [X.w.__cc, X.w.__ccMsgs[0] || ''];
    installConfirm(X.w, true);
    const b1 = selRead(X); const R = reopen(X); const r = selRead(R);
    check(scn, 'S4d', 'reset asked once ("Reset FY26 to BLANK?")', [cc[0], /^Reset FY26 to BLANK\?/.test(cc[1])], [1, true]);
    check(scn, 'S4d', 'after reset: FY26 still offered, stored [2026], selection [2026], total 0', [ok, b0.tot, b1.offered, b1.stored, b1.sel, b1.tot], [true, 300 * M, O26, [2026], [2026], 0]);
    check(scn, 'S4d', 'reopened: stored [2026], selection [2026], total 0, panel $0.00M', [r.stored, r.sel, r.tot, r.panel], [[2026], [2026], 0, '0.00']);
    return { board0: b0, board1: b1, reopened: r };
  });
  // S4e plan reset at base 2027 (U14 fixture): offering is unchanged by a plan's presence either way (recorded, both boards)
  await selScenario('S4e-U14-plan-reset-base27', U14, async (scn, X) => {
    const before = getter(X)('flowYears()');
    installConfirm(X.w, true); X.ev(`switchYear(2026); resetYear(); switchYear(2027); 'ok'`); installConfirm(X.w, true);
    const after = getter(X)('flowYears()'); const A = flowNow(X);
    check(scn, 'S4e', 'U14 fixture: FY26 not offered before or after the reset; ALL YEARS 640 before and after (the 300 was never in it)', [before, after, A.tot], [O27, O27, 640 * M]);
    return { before, after, all: A };
  });
  // X1 (recorded): the user WORKING in FY26 (MS.cur 2026) while the window is FY27-FY31 -- is the year being edited offered?
  await selScenario('X1-cur2026-outside-window', U14, async (scn, X) => {
    installConfirm(X.w, true); X.ev(`switchYear(2026); 'ok'`); const cc = X.w.__cc;
    const g = getter(X); const o = g(`({cur:MS.cur, base:MS.base, offered:flowYears(), window:flowPlanYears()})`); const A = flowNow(X);
    const d = g(`flowCalc(2026).tot`);
    check(scn, 'X1', 'switching to the existing FY26 asked nothing; MS.cur 2026; FY26 (the year being worked) not offered; ALL YEARS 640; FY26 asked directly 300',
      [cc, o.cur, o.offered, A.tot, d], [0, 2026, O27, 640 * M, 300 * M]);
    note(scn, 'X1', 'fydpWindow() for comparison (the FYDP report adds MS.cur)', g('fydpWindow()'));
    note(scn, 'X1', 'rlgAllYears() for comparison (realignment: window + every year with state + MS.cur)', g('rlgAllYears()'));
    return { ...o, all: A, direct26: d };
  });
}

const t0 = Date.now();
const out = { ...ident, matrix: {} };
for (const key of Object.keys(EXP)) {
  try { out.matrix[key] = await cell(key); }
  catch (e) { results.push({ scenario: `${boardLabel}|M|${key}`, id: 'harness', name: 'cell threw', actual: String((e && e.stack) || e).slice(0, 800), status: 'failed' }); bootRelease(0); }
}
await runSelections();
out.selections = SEL;
out.results = results;
out.passed = results.filter(r => r.status === 'passed').length;
out.failed = results.filter(r => r.status === 'failed').length;
out.recorded = results.filter(r => r.status === 'recorded').length;
out.totalMs = Date.now() - t0;
writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
results.filter(r => r.status === 'failed').forEach(r => console.log('FAILED |', r.scenario, '|', r.id, '|', r.name, '| expected', J(r.expected), '| actual', J(r.actual).slice(0, 500)));
console.log(J({ board: boardLabel, boardBlob: ident.boardBlob, probeBlob: ident.probeBlob, passed: out.passed, failed: out.failed, recorded: out.recorded, ms: out.totalMs }));
