// v-edge.mjs -- VERIFIER's edge observation (not one of Brad's requested checks): the same fixture and product-path genuine
// FY26 plan as u1demo, but with the OBBBA rule switched OFF (the product default, flowPseudoDef on:false).
//   usage: node v-edge.mjs <copyRoot> <outJson> <label>
// Literal expectations if ALL YEARS were to hold every dollar on the board: FY25 40 + 100 (rule off: the spares row counts in
// its own FY2025) + FY26 own plan 300 + FY27 500 = 940. Recorded, with FY26's offer and the FY26 x O&M figure.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = resolve(process.argv[2]); const outPath = resolve(process.argv[3]); const boardLabel = process.argv[4] || '';
delete process.env.BOARD; delete process.env.MUT_FIRST_FAIL;
await import(pathToFileURL(root + '/runtime-encoding-shim.mjs').href);
const { boot, seed, bootRelease, BOARD } = await import(pathToFileURL(root + '/tools/export-audit/boot.mjs').href);
const blobOf = buf => createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
if (resolve(BOARD) !== root + '/prioritization-board-grid.html') throw new Error('BOARD ' + BOARD);
const J = JSON.stringify, K = 1;
const row = (fy, title, budget, amt, office) => { const r = Array(32).fill(''); r[0] = fy; r[1] = fy + '-03'; r[2] = 'SYN-EXEC';
  r[3] = title; r[4] = budget; r[7] = 'Event ' + title; r[9] = amt; r[10] = 'Allocated'; r[18] = office; return r; };
const ALL = { sp: { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: [row(2025, 'Synthetic carried spares requirement', 'USAF Spares Initial Mandatory PSM', 100 * K, 'Program (ATL)')] } },
  om: { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: [row(2025, 'Synthetic ordinary FY25 O&M requirement', 'USAF O&M Discretionary', 40 * K, 'Program (TSS)')] } } };
const X = boot(); const g = e => JSON.parse(X.ev(`JSON.stringify(${e})`));
seed(X.ev, { services: ['USAF'], items: [{ id: 'F1', grp: 'PSM', team: 'PSM', sect: '', custom: false, title: 'Synthetic planned requirement',
  event: 'Synthetic planned event', ccar: 'SYN-F1', fy26: [0], ask: [1000 * K], alloc: null }], disc: [500 * K], mand: [0], order: ['F1'] });
X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
  S.bm={disc:[${500 * K}], mand:[0], adds:[]}; MS.base=2027; MS.cur=2027; FYMON=fyMonths(2027); MS.years={2027:S}; applyState(S); MS.years[2027]=S;
  EXDB.all=${J(ALL)}; EXDB.ts=1; var C=flowCfg(); C.pseudo={on:true, label:'OBBBA', token:'OBBBA, Mandatory', from:2025, to:2026, col:4}; C.other={}; C.fys=null; C.aps=null; save(); 'ok'`);
X.w.confirm = () => false; X.ev(`switchYear(2026); restoreReq('F1'); bmSetBase('disc',0,'${300 * K}'); switchYear(2027); 'ok'`); X.w.confirm = () => true;
const read = () => g(`(function(){ var o={offered:flowYears()}; flowCfg().fys=null; flowCfg().aps=null; var A=flowCalc(); o.all=[A.tot,A.execV,A.planV];
  flowCfg().fys=[2026]; flowCfg().aps=['om']; var F=flowCalc(); o.fy26om={sel:flowSelYears(), tot:F.tot}; flowCfg().fys=null; flowCfg().aps=null;
  o.plan26=MS.years[2026].discSvc; return o; })()`);
const on = read();
X.ev(`flowCfg().pseudo.on=false; save(); 'ok'`);
const off = read();
const out = { boardLabel, boardBlob: blobOf(readFileSync(root + '/prioritization-board-grid.html')), probeBlob: blobOf(readFileSync(new URL(import.meta.url))),
  ruleOn: on, ruleOff: off, everyDollarIfOff: (40 + 100 + 300 + 500) * K, errors: X.errors };
writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n'); console.log(J(out)); bootRelease(0);
