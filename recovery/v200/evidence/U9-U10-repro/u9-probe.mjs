// U9 reproduction probe -- PMO split disagreement on a CLIN-split prime (synthetic, whole-board jsdom).
// argv: <copy root> <results json> <tree label>
// Reproduce and measure only. Nothing here changes the board's files; every board is booted in memory.
//
// Fixture (the review record's): USAF, O&M FY27, PRIME-3 marked PRIME, ask = discretionary funding = $A (one service,
// fully funded, no mandatory); its CLINs 0010 / 0002 / 0008 ask 1 / 2 / 3 on USAF. By the board's CLIN-number rule
// (pmoSharesOf) 0010 is MxS, 0002 is AV, 0008 is TSS, so the offices' weights are 1 : 2 : 3, in that order.
//
// EXPECTED, worked out here and nowhere else: BigInt largest remainder over the INTEGER weights 1:2:3 -- floor every
// exact share A*w/6, then hand the leftover dollars one at a time to the largest remainders, EQUAL REMAINDERS TO THE
// LOWER INDEX (the first CLIN / office in list order: MxS, then AV, then TSS). That tie rule is the one the CLIN source
// workbook (the Spend Plan Source export) uses: srcRowsOf -> clinSplit(pid, i, amt) -> apportion(amt, per), whose
// order sort is `(a.r<b.r)? 1 : (a.r>b.r)? -1 : (a.i-b.i)` -- descending remainder, ties by ascending index.
// No board helper is used to compute an expectation.
import { pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const outFile = process.argv[3];
const tree = process.argv[4] || '?';
const t0 = Date.now();
await import(pathToFileURL(path.join(root, 'runtime-encoding-shim.mjs')).href);
const BOOT = await import(pathToFileURL(path.join(root, 'tools/export-audit/boot.mjs')).href);
const { boot, seed, bootMark, bootRelease, BOARD } = BOOT;

const boardPath = path.join(root, 'prioritization-board-grid.html');
const html = readFileSync(boardPath);
const blob = createHash('sha1').update(`blob ${html.length}\0`).update(html).digest('hex');
const bootSelects = realpathSync(BOARD) === realpathSync(boardPath);

const results = [];
const check = (caseName, surface, name, actual, expected, kind) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ case: caseName, surface, name, kind, expected, actual, status: ok ? 'passed' : 'failed' });
  return ok;
};

// ---- the independent expectation ----------------------------------------------------------------------------
const OFFICES = ['MxS', 'AV', 'TSS'];
const CLIN_OFFICE = { '0010': 'MxS', '0002': 'AV', '0008': 'TSS' };   // literal, from the record and the CLIN-number rule
const WEIGHTS = [1n, 2n, 3n];
function lrBig(total, weights) {
  const T = BigInt(total), s = weights.reduce((a, b) => a + b, 0n);
  const q = [], r = [];
  weights.forEach(w => { const p = T * w; q.push(p / s); r.push(p % s); });   // all non-negative: truncation is floor
  let left = T - q.reduce((a, b) => a + b, 0n);
  const order = weights.map((_, i) => i).sort((a, b) => (r[a] === r[b] ? a - b : (r[a] > r[b] ? -1 : 1)));
  for (const i of order) { if (left <= 0n) break; q[i] += 1n; left -= 1n; }
  return { parts: q.map(Number), remainders: r.map(String), denominator: String(s) };
}

const cv = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c;
const num = c => { const v = cv(c); if (typeof v === 'number') return v; const n = parseFloat(String(v ?? '').replace(/[$,\s]/g, '')); return isFinite(n) ? n : null; };
const lbl = c => String(cv(c) ?? '').trim();

// What one export wrote, read back from its own bytes with the board's reader (as money-runtime-probe.mjs does).
const book = async (w, fn) => JSON.parse(await w.eval(`(async function(){
  var cap=null,_B=window.Blob,msg='';
  var _a=window.alert,_c=window.confirm;
  window.alert=function(m){ msg+=String(m); }; window.confirm=function(m){ msg+=String(m); return true; };
  window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
  try{ ${fn}(); }catch(e){ window.Blob=_B; window.alert=_a; window.confirm=_c; return JSON.stringify({__err:'threw '+String((e&&e.message)||e)}); }
  window.Blob=_B; window.alert=_a; window.confirm=_c;
  if(!cap) return JSON.stringify({__err:'no file: '+msg.slice(0,200)});
  var ab=cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength);
  var r=await xlsxRead(ab); r.__msg=msg.slice(0,400); return JSON.stringify(r); })()`));

const CASES = [
  { amt: 3, tie: true }, { amt: 9, tie: true },
  { amt: 5, tie: false }, { amt: 7, tie: false }, { amt: 100, tie: false },
];
const caseOut = [];

for (const C of CASES) {
  const name = '$' + C.amt + (C.tie ? ' (tie)' : ' (non-tie control)');
  const kindPmo = C.tie ? 'defect' : 'control';
  const mark = bootMark();
  const X = boot();
  const { ev, w } = X;
  seed(ev, {
    services: ['USAF'],
    items: [{ id: 'PRIME-3', grp: 'PRIMES', team: 'PRIMES', sect: '', custom: false, title: 'Synthetic prime PRIME-3',
      event: 'Synthetic prime event', ccar: '', fy26: [0], ask: [C.amt], alloc: null }],
    disc: [C.amt], mand: [0], order: ['PRIME-3'],
  });
  const fx = JSON.parse(ev(`(function(){
    BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    var hadData=!!DATA.clins, sameAtBoot=(DATA.clins===CLINS);
    if(!DATA.clins) DATA.clins=CLINS;
    CLINS['PRIME-3']=[{clin:'0010', desc:'Synthetic MxS line', ccar:'', ask:[1]},
                      {clin:'0002', desc:'Synthetic AV line',  ccar:'', ask:[2]},
                      {clin:'0008', desc:'Synthetic TSS line', ccar:'', ask:[3]}];
    DATA.clins['PRIME-3']=CLINS['PRIME-3'];
    S.ptype={'PRIME-3':'PRIME'};
    MS.years[MS.cur]=S; applyState(S); save();
    var T=tiers()['PRIME-3'];
    return JSON.stringify({hadData:hadData, sameAtBoot:sameAtBoot, sameNow:(DATA.clins===CLINS), slug:mySlug(), fy:FYL(), cur:MS.cur,
      svc:SVC.slice(), prime:clinApplies('PRIME-3'), clins:clinList('PRIME-3').map(function(c){ return [c.clin, c.ask]; }),
      d:T.d, m:T.m, u:T.u, ask:itemById('PRIME-3').ask, grp:grpOf(itemById('PRIME-3'))});
  })()`));
  const E = lrBig(C.amt, WEIGHTS);
  const exp = Object.fromEntries(OFFICES.map((g, k) => [g, E.parts[k]]));

  check(name, 'fixture', 'O&M FY27, one service USAF, PRIME-3 is a prime with CLINs 0010/0002/0008 asking 1/2/3',
    [fx.slug, fx.fy, fx.svc, fx.prime, fx.clins], ['om', 'FY27', ['USAF'], true, [['0010', [1]], ['0002', [2]], ['0008', [3]]]], 'control');
  check(name, 'fixture', 'PRIME-3 draws $' + C.amt + ' discretionary, $0 mandatory, nothing unfunded',
    [fx.d, fx.m, fx.ask], [[C.amt], [0], [C.amt]], 'control');

  // 1) the CLIN source workbook: the Spend Plan Source, read back from its own bytes
  const src = await book(w, 'exportSrc');
  const srcSheet = Object.keys(src).filter(k => !k.startsWith('__')).map(k => src[k]).find(rs => (rs || []).length > 1) || [];
  const srcHdr = (srcSheet[0] || []).map(lbl);
  const cAmt = srcHdr.indexOf('Amount'), cClin = srcHdr.indexOf('CLINs'), cPmo = srcHdr.indexOf('PMO');
  const srcRows = srcSheet.slice(1).map(r => ({ clin: lbl(r[cClin]), amount: num(r[cAmt]), pmoColumn: lbl(r[cPmo]) }));
  const srcBy = Object.fromEntries(OFFICES.map(g => [g, 0])); let srcUnmapped = 0;
  srcRows.forEach(r => { const g = CLIN_OFFICE[r.clin]; if (g) srcBy[g] += r.amount || 0; else srcUnmapped += r.amount || 0; });

  // 2) the PMO parts (pmoPartsOf on the board's own lane draw)
  const parts = JSON.parse(ev(`JSON.stringify(pmoPartsOf(itemById('PRIME-3'), tiers()['PRIME-3']).map(function(o){
    return {g:o.g, d:o.d[0], m:o.m[0], u:o.u[0], ask:o.ask[0]}; }))`));
  const partsBy = Object.fromEntries(parts.map(o => [o.g, o.d + o.m]));

  // 3) the forecast by PMO
  const fc = JSON.parse(ev(`(function(){ var F=forecast().byPMO, o={}; Object.keys(F).forEach(function(g){
    o[g]={tot:F[g].tot, unsch:F[g].unsch, months:F[g].m.reduce(function(a,b){ return a+b; },0)}; }); return JSON.stringify(o); })()`));
  const fcBy = Object.fromEntries(Object.keys(fc).map(g => [g, fc[g].tot]));

  // 4) the PMO Matrix of the Excel export, read back from its own bytes
  const xl = await book(w, 'exportExcel');
  const pm = xl['PMO Matrix'] || [];
  const h = pm.findIndex(r => (r || []).some(c => lbl(c) === 'PMO') && (r || []).some(c => lbl(c) === 'TOTAL Disc'));
  const col = n => (pm[h] || []).findIndex(c => lbl(c) === n);
  const pmBy = {}, pmRows = {};
  const pmEnd = h < 0 ? -1 : pm.findIndex((x, j) => j > h && /^TOTAL/.test(lbl((x || [])[0])));
  pm.forEach((r, j) => { if (j <= h || h < 0 || (pmEnd >= 0 && j >= pmEnd)) return; const g = lbl((r || [])[0]); if (!g || /^TOTAL/.test(g)) return;
    if (pmRows[g] === undefined && num(r[col('TOTAL Disc')]) !== null) { pmRows[g] = { usafDisc: num(r[col('USAF Disc')]), usafMand: num(r[col('USAF Mand')]), totalDisc: num(r[col('TOTAL Disc')]), totalMand: num(r[col('TOTAL Mand')]) };
      pmBy[g] = pmRows[g].totalDisc + (pmRows[g].totalMand || 0); } });
  const pmTotal = (() => { const r = pmEnd >= 0 ? pm[pmEnd] : null; return r ? { totalDisc: num(r[col('TOTAL Disc')]), totalMand: num(r[col('TOTAL Mand')]) } : null; })();

  const pick = by => OFFICES.map(g => by[g] === undefined ? null : by[g]);
  const others = by => Object.keys(by).filter(g => OFFICES.indexOf(g) < 0 && by[g]).map(g => [g, by[g]]);
  const sumAll = by => Object.values(by).reduce((a, b) => a + (b || 0), 0);
  const want = OFFICES.map(g => exp[g]);

  check(name, 'CLIN source workbook', 'per office MxS/AV/TSS (Spend Plan Source CLIN lines, by CLIN number)', pick(srcBy), want, 'control');
  check(name, 'CLIN source workbook', 'total balances to $' + C.amt, srcRows.reduce((a, r) => a + (r.amount || 0), 0), C.amt, 'control');
  check(name, 'PMO parts', 'per office MxS/AV/TSS (pmoPartsOf, disc+mand)', pick(partsBy), want, kindPmo);
  check(name, 'PMO parts', 'total balances to $' + C.amt + ', nothing on another office', [sumAll(partsBy), others(partsBy)], [C.amt, []], 'control');
  check(name, 'forecast', 'per office MxS/AV/TSS (forecast().byPMO tot)', pick(fcBy), want, kindPmo);
  check(name, 'forecast', 'total balances to $' + C.amt + ', nothing on another office', [sumAll(fcBy), others(fcBy)], [C.amt, []], 'control');
  check(name, 'PMO Matrix export', 'per office MxS/AV/TSS (TOTAL Disc + TOTAL Mand, read back)', pick(pmBy), want, kindPmo);
  check(name, 'PMO Matrix export', 'total balances to $' + C.amt + ', nothing on another office; TOTAL row agrees',
    [sumAll(pmBy), others(pmBy), pmTotal && pmTotal.totalDisc + (pmTotal.totalMand || 0)], [C.amt, [], C.amt], 'control');
  check(name, 'harness', 'both workbooks built and read back', [src.__err || 'ok', xl.__err || 'ok', h >= 0], ['ok', 'ok', true], 'control');
  check(name, 'harness', 'whole-board boot has no jsdom script errors', X.errors, [], 'control');

  // DIAGNOSTICS (board helpers, recorded as actuals only -- never used as an expectation): the weights the PMO path
  // hands to apportion, and what apportion makes of them against the integer weights.
  const diag = JSON.parse(ev(`(function(){ var sh=pmoSharesOf(itemById('PRIME-3'));
    var fr=sh.map(function(x){ return x[1]? x[1][0] : null; });
    return JSON.stringify({shares:sh.map(function(x){ return [x[0], x[1]? x[1].map(function(v){ return v.toPrecision(21); }) : null]; }),
      apExactOfShares:(typeof apExact==='function' && fr.every(function(v){ return v>0; }))? apExact(fr).map(String) : null,
      apportionFloatShares:apportion(${C.amt}, fr), apportionIntegerWeights:apportion(${C.amt}, [1,2,3])}); })()`));

  caseOut.push({ case: name, amount: C.amt, tie: C.tie, fixture: fx,
    expected: { byOffice: exp, remainders: E.remainders, denominator: E.denominator },
    actual: { clinSourceWorkbook: { byOffice: srcBy, unmapped: srcUnmapped, rows: srcRows },
      pmoParts: parts, forecast: fc, pmoMatrix: { rows: pmRows, total: pmTotal } },
    diagnostics: diag });
  bootRelease(mark);
}

const passed = results.filter(r => r.status === 'passed').length, failed = results.length - passed;
const summary = { finding: 'U9', tree, root, board: boardPath, boardBlob: blob, bootSelectsThisBoard: bootSelects,
  evidenceKind: 'fresh whole-board jsdom synthetic runtime (boot.mjs standard stubs + TextEncoder/Decoder shim)',
  tieRule: 'BigInt largest remainder over integer weights 1:2:3; equal remainders to the lower index (CLIN/office list order MxS, AV, TSS) -- the order apportion() sorts by, which clinSplit() uses for the Spend Plan Source',
  cases: caseOut, results, passed, failed,
  failedByKind: { defect: results.filter(r => r.status === 'failed' && r.kind === 'defect').length, control: results.filter(r => r.status === 'failed' && r.kind === 'control').length },
  seconds: (Date.now() - t0) / 1000 };
if (outFile) writeFileSync(outFile, JSON.stringify(summary, null, 2) + '\n');
results.forEach(r => console.log(JSON.stringify([r.status, r.case, r.surface, r.name, r.actual, r.expected])));
console.log(JSON.stringify({ tree, blob, bootSelects, passed, failed, failedByKind: summary.failedByKind, seconds: summary.seconds }));
bootRelease(0);
process.exit(failed ? 1 : 0);
