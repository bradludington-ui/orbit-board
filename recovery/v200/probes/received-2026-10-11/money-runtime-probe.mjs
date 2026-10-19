import './runtime-encoding-shim.mjs';
import { boot, seed, bootRelease } from './tools/export-audit/boot.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const MAIN = 'f9b441365551cd691a20a8f0b08a374a92a12f0e';
const html = readFileSync(new URL('./prioritization-board-grid.html', import.meta.url));
const sourceBlob = createHash('sha1').update(`blob ${html.length}\0`).update(html).digest('hex');
const X = boot();
const { ev, w } = X;
const results = [];
const check = (name, actual, expected, kind='control') => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({name, kind, expected, actual, status:ok?'passed':'failed'});
};
const get = expr => JSON.parse(ev(`JSON.stringify(${expr})`));
const item = { id:'F1', grp:'PSM', team:'PSM', sect:'', custom:false,
  title:'Synthetic planned requirement', event:'Synthetic planned event', ccar:'SYN-F1',
  fy26:[0,0], ask:[350000000,150000000], alloc:null };
// Expectations below are literal fixture arithmetic, independent of ORBIT helpers.
seed(ev, {services:['USAF','ANG'],items:[item],disc:[350000000,150000000],mand:[0,0],order:['F1']});
ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
  S.bm={disc:[350000000,150000000],mand:[0,0],adds:[]};
  MS.base=2025; MS.cur=2026;
  MS.years={2025:JSON.parse(JSON.stringify(S)),2026:S};
  applyState(S); MS.years[2026]=S; 'ok'`);

const row = (fy,title,budget,amount,office) => {
  const r = Array(32).fill('');
  r[0]=fy; r[1]=`${fy}-03`; r[2]='SYN-EXEC'; r[3]=title; r[4]=budget;
  r[7]='Synthetic execution event'; r[9]=amount; r[10]='Allocated'; r[18]=office;
  return r;
};
const carry = row(2025,'Synthetic carryover requirement','USAF O&M Mandatory',100000000,'Program (PSM)');
const ff = row(2026,'Synthetic FF requirement','USAF Full Fund',7000000,'Program (ATL)');
const ordinary = row(2026,'Synthetic ordinary execution','ANG O&M Discretionary',40000000,'Program (TSS)');
const initial = {om:{asOf:'2026-09',hdr:[],read:1,noFy:0,rows:{2025:[carry]}},
  ff:{asOf:'2026-09',hdr:[],read:1,noFy:0,rows:{2026:[ff]}}};
ev(`EXDB.all=${JSON.stringify(initial)}; EXDB.ts=1;
  flowCfg().other={}; flowCfg().fys=[2026]; flowCfg().aps=['om']; flowPseudo().on=true; 'ok'`);
const rawBefore = get('EXDB.all');
const readFlow = () => get(`(function(){var F=flowCalc(), rows=F.prime.LM.rows.concat(F.prime.PW.rows);
  F.ext.keys.forEach(function(k){rows=rows.concat(F.ext.by[k].rows);});
  return {total:F.tot,executed:F.execV,planned:F.planV,appropriations:F.appn,mixedYears:F.mixYs,label:F.label,
    rows:rows.map(function(r){return {appropriation:r.ap,effectiveFY:r.fy,service:r.svc,office:r.pmo,
      requirement:r.ttl,amount:r.v,planned:!!r.plan};})};})()`);
const carryActual = readFlow();
check('R1 carried FY25 execution replaces O&M FY26 plan',
  [carryActual.total,carryActual.executed,carryActual.planned], [100000000,100000000,0], 'defect');
check('R1 selected appropriation excludes Full Fund',carryActual.appropriations.ff,0);
check('R1 execution retains service appropriation effective FY and office',
  carryActual.rows.filter(r=>!r.planned).map(r=>[r.appropriation,r.effectiveFY,r.service,r.office,r.requirement,r.amount]),
  [['om',2026,'USAF','PSM','Synthetic carryover requirement',100000000]]);
check('coherent FY26 budget components were seeded explicitly',
  get('[MS.years[2026].bm.disc, MS.years[2026].discSvc]'),
  [[350000000,150000000],[350000000,150000000]]);

// Drive the real panel and real workbook writer/reader. Only download click/object URL are boot stubs.
ev(`flowOpen=true; flowBody(); 'ok'`);
const panelText = w.document.getElementById('flowBody').textContent;
const panelButtons = [...w.document.getElementById('flowBody').querySelectorAll('button')]
  .filter(b=>/FY26/.test(b.textContent)).map(b=>({text:b.textContent,title:b.title}));
const book = JSON.parse(await w.eval(`(async function(){ var cap=null, orig=window.Blob;
  window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new orig(p,o); };
  try { exportFlow(); } finally { window.Blob=orig; }
  if(!cap) throw Error('no workbook emitted');
  var ab=cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength);
  return JSON.stringify(await xlsxRead(ab)); })()`));
const flowSheet=book['Funds Flow'];
const label=v=>String(v&&typeof v==='object'?v.v:v??'');
const totalRows=flowSheet.filter(r=>label(r[0])==='TOTAL FUNDING');
const exportedTotals=totalRows.map(r=>r[1]).filter(v=>typeof v==='number');
check('R1 exported TOTAL FUNDING agrees with independent carryover expectation',exportedTotals,[100000000,100000000],'defect');
check('R1 exported O&M agrees with independent carryover expectation',
  flowSheet.filter(r=>label(r[0])==='O&M').map(r=>r[1]),[100000000],'defect');

// Fresh healthy controls distinguish the two source paths.
ev(`flowPseudo().on=false; 'ok'`);
const off=readFlow();
check('carryover off FY26 O&M is its own $500M plan',
  [off.total,off.executed,off.planned],[500000000,0,500000000]);
check('planned funded dollars retain service office and requirement ownership',
  off.rows.map(r=>[r.appropriation,r.effectiveFY,r.service,r.office,r.requirement,r.amount,r.planned]),
  [['om',2026,'USAF','PSM','Synthetic planned requirement',350000000,true],
   ['om',2026,'ANG','PSM','Synthetic planned requirement',150000000,true]]);
ev(`flowPseudo().on=true; EXDB.all.om.rows[2026]=${JSON.stringify([ordinary])}; 'ok'`);
const withRaw=readFlow();
check('raw FY26 O&M execution suppresses the whole FY26 O&M plan',
  [withRaw.total,withRaw.executed,withRaw.planned],[140000000,140000000,0]);
check('executed service split is $100M USAF plus $40M ANG',
  withRaw.rows.map(r=>[r.service,r.office,r.amount]),[['USAF','PSM',100000000],['ANG','TSS',40000000]]);
ev(`delete EXDB.all.om.rows[2026]; flowCfg().aps=['ff']; 'ok'`);
const ffOnly=readFlow();
check('Full Fund selection retains its own service and office',
  [ffOnly.total,ffOnly.executed,ffOnly.planned,ffOnly.rows.map(r=>[r.appropriation,r.effectiveFY,r.service,r.office,r.amount])],
  [7000000,7000000,0,[['ff',2026,'USAF','ATL',7000000]]]);
check('flow source inspection and export preserve raw execution rows',get('EXDB.all'),rawBefore);
check('whole-board boot has no jsdom script errors',X.errors,[]);

const summary={mainSHA:MAIN,sourceBlob,evidenceKind:'fresh whole-board jsdom synthetic runtime',
  runtimeStubs:['Node TextEncoder/Decoder installed into jsdom windows','boot.mjs standard alert/confirm/prompt/download stubs',
    'boot.mjs standard FYDP frame jsdom adapter; not invoked by flow export'],
  independentExpected:'literal whole-dollar fixture sums; no ORBIT helper used for expectations',
  fixture:{planUSAFAmount:350000000,planANGAmount:150000000,carryoverUSAFAmount:100000000,fullFundUSAFAmount:7000000},
  carryoverActual:carryActual,panelButtons,panelText,flowWorkbook:book,results,
  passed:results.filter(r=>r.status==='passed').length,failed:results.filter(r=>r.status==='failed').length};
writeFileSync(new URL('../money-runtime-results.json',import.meta.url),JSON.stringify(summary,null,2)+'\n');
results.forEach(r=>console.log(JSON.stringify(r)));
console.log(JSON.stringify({passed:summary.passed,failed:summary.failed,sourceBlob,mainSHA:MAIN}));
bootRelease(0);
process.exit(summary.failed?1:0);
