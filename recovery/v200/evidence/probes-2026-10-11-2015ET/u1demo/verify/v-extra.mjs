// v-extra.mjs -- VERIFIER's supplementary probe for U1demo (read-only on the product; synthetic; bounded by vrun.sh).
//   usage: node v-extra.mjs <copyRoot> <outJson> <label>
// Three things the builder's probe does not do:
//   X1  PRODUCT-PATH REMOVAL: the genuine own FY26 plan (built on the product path exactly as the builder did) is removed with
//       the board's own "Reset FY26 to blank" (resetYear(), confirm answered OK), not with `delete MS.years[2026]`.
//       Expected (literal): FY26 x {O&M, IS} = 100, x {O&M} = 0, x {IS} = 100; ALL YEARS = 40 + 100 + 500 = 640; no figure = 500;
//       no FY26 plan row; window.confirm not called by the reads; the same on a copy reopened from buildSavedHtml().
//   X2  the window.confirm count during the reads made WHILE the plan is present (c1-c3 and ALL YEARS), which the builder's
//       probe counts but resets at removal without checking. Expected 0.
//   X3  SAVED FY25-ONLY when EVERY FY25 row is counted as FY26 (the case flowYears' raw line exists for): the builder's fixture
//       minus the O&M FY25 ordinary 40. Saved [2025], reopened: saved [2025], selection [2025], total 0, only the FY25 chip on.
// EVERY EXPECTED VALUE IS LITERAL ARITHMETIC OF THE FIXTURE AMOUNTS. Board helpers are only READ for observed values.
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
const ident = { boardLabel, boardPath, boardBlob: blobOf(readFileSync(boardPath)),
  bootBlob: blobOf(readFileSync(root + '/tools/export-audit/boot.mjs')), shimBlob: blobOf(readFileSync(root + '/runtime-encoding-shim.mjs')),
  probeBlob: blobOf(readFileSync(new URL(import.meta.url))) };
const J = JSON.stringify;
const K = 1e6;   // the panel prints $M to two decimals; at K=1e6 it is checkable
const results = [];
const check = (scn, id, name, actual, expected) => { const ok = J(actual) === J(expected);
  results.push({ scenario: scn, id, name, expected, actual, status: ok ? 'passed' : 'failed' }); return ok; };
const note = (scn, id, name, actual) => results.push({ scenario: scn, id, name, actual, status: 'recorded' });
const getter = X => expr => JSON.parse(X.ev(`JSON.stringify(${expr})`));
const installConfirm = (w, ans) => { w.__cc = 0; w.__ccMsgs = []; w.__ccAns = ans;
  w.confirm = function (m) { w.__cc++; w.__ccMsgs.push(String(m).slice(0, 80)); return w.__ccAns; }; };
const row = (fy, title, budget, amt, office) => { const r = Array(32).fill(''); r[0] = fy; r[1] = fy + '-03'; r[2] = 'SYN-EXEC';
  r[3] = title; r[4] = budget; r[7] = 'Event ' + title; r[9] = amt; r[10] = 'Allocated'; r[18] = office; return r; };
const ITEM = { id: 'F1', grp: 'PSM', team: 'PSM', sect: '', custom: false, title: 'Synthetic planned requirement',
  event: 'Synthetic planned event', ccar: 'SYN-F1', fy26: [0], ask: [1000 * K], alloc: null };
const ALL = withOm => {
  const a = { sp: { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: [row(2025, 'Synthetic carried spares requirement', 'USAF Spares Initial Mandatory PSM', 100 * K, 'Program (ATL)')] } } };
  if (withOm) a.om = { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: [row(2025, 'Synthetic ordinary FY25 O&M requirement', 'USAF O&M Discretionary', 40 * K, 'Program (TSS)')] } };
  return a;
};
const build = (withOm) => {
  const X = boot();
  seed(X.ev, { services: ['USAF'], items: [ITEM], disc: [500 * K], mand: [0], order: ['F1'] });
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.bm={disc:[${500 * K}], mand:[0], adds:[]}; MS.base=2027; MS.cur=2027; FYMON=fyMonths(2027); MS.years={2027:S};
    applyState(S); MS.years[2027]=S; EXDB.all=${J(ALL(withOm))}; EXDB.ts=1;
    var C=flowCfg(); C.pseudo={on:true, label:'OBBBA', token:'OBBBA, Mandatory', from:2025, to:2026, col:4}; C.other={}; C.fys=null; C.aps=null;
    save(); 'ok'`);
  return X;
};
const readFlow = (X, fys, aps) => getter(X)(`(function(){ flowCfg().fys=${J(fys)}; flowCfg().aps=${J(aps)}; flowSel=''; var F=flowCalc(),
    rows=F.prime.LM.rows.concat(F.prime.PW.rows); F.ext.keys.forEach(function(k){ rows=rows.concat(F.ext.by[k].rows); });
    return {selYears:flowSelYears(), selAppns:flowSelAppns(), label:F.label, tot:F.tot, execV:F.execV, planV:F.planV, appn:F.appn,
      nums:[F.tot,F.grand,F.us,F.execV,F.planV].concat(Object.keys(F.appn).map(function(k){return F.appn[k];})).concat(rows.map(function(r){return r.v;})),
      planRows:rows.filter(function(r){ return !!r.plan; }).length}; })()`);
const readPanel = X => { X.ev(`flowOpen=true; flowSel=''; flowBody(); 'ok'`);
  const body = X.w.document.getElementById('flowBody'); const text = body.textContent;
  const tf = /total funding \$([\d,]+\.\d\d)M/.exec(text);
  const chips = [...body.querySelectorAll('button')].filter(b => /^flowToggleYear\(\d+\)$/.test(b.getAttribute('onclick') || ''))
    .map(b => ({ text: b.textContent, on: b.classList.contains('on'), title: b.getAttribute('title') || '' }));
  return { total: tf ? tf[1] : null, moneyM: [...text.matchAll(/\$([\d,]+\.\d\d)M/g)].map(m => m[1]), chips }; };
const readExport = async X => { const book = JSON.parse(await X.w.eval(`(async function(){ var cap=null, orig=window.Blob;
    window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new orig(p,o); };
    try { exportFlow(); } finally { window.Blob=orig; } if(!cap) throw Error('no workbook emitted');
    var ab=cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength); return JSON.stringify(await xlsxRead(ab)); })()`));
  const val = v => (v && typeof v === 'object' && 'v' in v) ? v.v : v; const ff = book['Funds Flow'] || [];
  return { tot: ff.filter(r => String(val(r[0])) === 'TOTAL FUNDING').map(r => val(r[1])).filter(v => typeof v === 'number'),
    nums: Object.keys(book).flatMap(s => book[s].flatMap(r => r.map(val).filter(v => typeof v === 'number'))),
    scope: ff.map(r => String(val(r[0]) ?? '')).filter(s => /^Scope: /.test(s)) }; };
const y26 = X => getter(X)(`MS.years[2026]? {disc:(MS.years[2026].bm||{}).disc||null, discSvc:MS.years[2026].discSvc, order:MS.years[2026].order, removed:MS.years[2026].removed, same27:MS.years[2026]===MS.years[2027]} : 'undefined'`);

// ---------------------------------------------------------------------------------------------- X1 + X2
async function x1() {
  const scn = `${boardLabel}|X1-resetYear`;
  const X = build(true); const g = getter(X);
  installConfirm(X.w, false);
  X.ev(`switchYear(2026); 'ok'`);
  if (g('S.removed').indexOf('F1') >= 0) X.ev(`restoreReq('F1'); 'ok'`);
  X.ev(`bmSetBase('disc', 0, ${J(String(300 * K))}); switchYear(2027); 'ok'`);
  check(scn, 'fixture', 'product-path FY26 plan: pot 300 in its own year, F1 on it; FY27 pot 500; confirm asked once (Cancel)',
    [y26(X).discSvc, y26(X).order, y26(X).same27, g('MS.years[2027].discSvc'), X.w.__cc], [[300 * K], ['F1'], false, [500 * K], 1]);
  // X2: reads with the plan present, confirm answering OK (the roll-forward answer) and counted
  installConfirm(X.w, true);
  const w1 = readFlow(X, [2026], ['om', 'sp']); readPanel(X); await readExport(X);
  const w2 = readFlow(X, [2026], ['om']); readPanel(X); await readExport(X);
  const w3 = readFlow(X, [2026], ['sp']); readPanel(X); await readExport(X);
  const wa = readFlow(X, null, null); await readExport(X);
  check(scn, 'X2', 'with the plan: FY26 x {O&M,IS} / {O&M} / {IS} / ALL YEARS = 300+100 / 300 / 100 / 40+100+300+500',
    [w1.tot, w2.tot, w3.tot, wa.tot], [(300 + 100) * K, 300 * K, 100 * K, (40 + 100 + 300 + 500) * K]);
  check(scn, 'X2', 'window.confirm NOT called by the reads made while the plan is present (c1-c3 + ALL YEARS)', X.w.__cc, 0);
  // X1: remove the plan through the product: switch to FY26, Reset FY26 to blank (confirm OK), back to FY27
  installConfirm(X.w, true);
  X.ev(`switchYear(2026); 'ok'`);
  const ccSwitch = X.w.__cc;
  X.ev(`resetYear(); 'ok'`);
  const ccReset = X.w.__cc, msgReset = X.w.__ccMsgs.slice();
  X.ev(`switchYear(2027); 'ok'`);
  check(scn, 'fixture', 'removal on the product path: switching to an existing FY26 asked nothing; resetYear asked once ("Reset FY26 to BLANK?"); back on FY27',
    [ccSwitch, ccReset, /^Reset FY26 to BLANK\?/.test(msgReset[0] || ''), X.w.__cc, g('MS.cur')], [0, 1, true, 1, 2027]);
  const st = y26(X);
  note(scn, 'X1', 'FY26 year state after resetYear (it stays DEFINED, blank)', st);
  check(scn, 'X1', 'FY26 after resetYear: pot [0], no requirements, F1 in Removed, its own object', [st.discSvc, st.order, st.removed, st.same27], [[0], [], ['F1'], false]);
  const removedReads = async (B, tag) => {
    installConfirm(B.w, true);
    const out = {};
    const E = { a: [[2026], ['om', 'sp'], 100 * K, '100.00'], b: [[2026], ['om'], 0, '0.00'], c: [[2026], ['sp'], 100 * K, '100.00'] };
    for (const k of Object.keys(E)) { const [fys, aps, tot, pan] = E[k];
      const F = readFlow(B, fys, aps), P = readPanel(B), x = await readExport(B);
      out[k] = { tot: F.tot, exec: F.execV, plan: F.planV, label: F.label, panel: P.total, xl: x.tot, scope: x.scope };
      check(scn, 'X1', `${tag}: FY26 x ${J(aps)} = ${tot} in flowCalc, panel $${pan}M, export TOTAL FUNDING twice`,
        [F.selYears, F.tot, P.total, x.tot], [fys, tot, pan, [tot, tot]]);
      check(scn, 'X1', `${tag}: FY26 x ${J(aps)}: no figure equals ${500 * K} (FY27's pot) in flowCalc, export, panel; no plan row`,
        [F.nums.filter(v => v === 500 * K), x.nums.filter(v => v === 500 * K), P.moneyM.filter(m => m === '500.00'), F.planRows], [[], [], [], 0]);
    }
    const A = readFlow(B, null, null);
    check(scn, 'X1', `${tag}: ALL YEARS = 40 + 100 + 500 = ${(40 + 100 + 500) * K}`, A.tot, (40 + 100 + 500) * K);
    check(scn, 'X1', `${tag}: flowPlanRecs(2026,'om') empty; FY26 still pot [0] and blank; window.confirm not called by the reads`,
      [getter(B)(`flowPlanRecs(2026,'om').length`), y26(B).discSvc, y26(B).order, B.w.__cc], [0, [0], [], 0]);
    B.ev(`flowCfg().fys=null; flowCfg().aps=null; 'ok'`);
    out.chip26 = readPanel(B).chips.filter(c => /^FY26/.test(c.text))[0] || null;
    note(scn, 'X1', `${tag}: FY26 chip after the reset`, out.chip26);
    return out;
  };
  const onBoard = await removedReads(X, 'board');
  X.ev(`flowCfg().fys=null; flowCfg().aps=null; save(); 'ok'`);
  const R = boot({ html: X.ev('buildSavedHtml()') });
  const reopened = await removedReads(R, 'reopened');
  check(scn, 'c7', 'board and reopened copy: EXDB.all is the fixture, no jsdom errors',
    [X.ev('JSON.stringify(EXDB.all)') === J(ALL(true)), R.ev('JSON.stringify(EXDB.all)') === J(ALL(true)), X.errors, R.errors], [true, true, [], []]);
  bootRelease(0);
  return { onBoard, reopened, w: { w1: [w1.tot, w1.execV, w1.planV, w1.label], w2: [w2.tot, w2.label], w3: [w3.tot, w3.label], wa: wa.tot } };
}

// ---------------------------------------------------------------------------------------------- X3
async function x3() {
  const scn = `${boardLabel}|X3-FY25-all-carried`;
  const X = build(false); const g = getter(X);
  installConfirm(X.w, true);
  const offered = g('flowYears()');
  note(scn, 'X3', 'flowYears() with every FY25 row counted as FY26', offered);
  check(scn, 'X3', 'workbook years are FY2025 only; no O&M rows at all', [g('flowExecYears(null, true)'), g('!!EXDB.all.om')], [[2025], false]);
  X.ev(`flowCfg().fys=[2025]; flowCfg().aps=null; flowSel=''; save(); 'ok'`);
  const onBoard = g(`[flowCfg().fys, flowSelYears(), flowCalc().tot]`);
  check(scn, 'X3', 'board: saved [2025], selection [2025], total 0 (its only row is counted in FY26)', onBoard, [[2025], [2025], 0]);
  const R = boot({ html: X.ev('buildSavedHtml()') }); installConfirm(R.w, true);
  const gr = getter(R);
  const F = gr(`(function(){ var F=flowCalc(); return [flowCfg().fys, flowSelYears(), F.tot, F.label]; })()`);
  const P = readPanel(R);
  // no O&M row exists at all, so O&M FY25 is a PLANNED year under the product's rule (flowYearKind) and the label says so
  check(scn, 'X3', 'reopened: saved [2025], selection [2025], total 0, label "FY25 · all appropriations · PLANNED (board allocation, O&M)"', F,
    [[2025], [2025], 0, 'FY25 · all appropriations · PLANNED (board allocation, O&M)']);
  check(scn, 'X3', 'reopened: only the FY25 chip is on', P.chips.filter(c => c.on).map(c => c.text), ['FY25 · plan']);
  check(scn, 'X3', 'reopened: no jsdom errors; confirm not called', [R.errors, R.w.__cc], [[], 0]);
  note(scn, 'X3', 'reopened chips', P.chips.map(c => [c.text, c.on]));
  bootRelease(0);
  return { offered, onBoard, reopened: F };
}

const t0 = Date.now();
const out = { ...ident };
for (const [k, f] of [['x1', x1], ['x3', x3]]) {
  try { out[k] = await f(); }
  catch (e) { results.push({ scenario: `${boardLabel}|${k}`, id: 'harness', name: 'scenario threw', actual: String((e && e.stack) || e).slice(0, 800), status: 'failed' }); bootRelease(0); }
}
out.results = results;
out.passed = results.filter(r => r.status === 'passed').length; out.failed = results.filter(r => r.status === 'failed').length;
writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
results.filter(r => r.status !== 'passed').forEach(r => console.log(r.status.toUpperCase(), '|', r.scenario, '|', r.id, '|', r.name, '| expected', J(r.expected), '| actual', J(r.actual).slice(0, 400)));
console.log(J({ board: boardLabel, boardBlob: ident.boardBlob, probeBlob: ident.probeBlob, passed: out.passed, failed: out.failed, ms: Date.now() - t0 }));
