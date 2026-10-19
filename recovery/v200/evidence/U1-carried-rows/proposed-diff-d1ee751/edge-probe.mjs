// edge-probe.mjs <copyRoot> -- U1's one decision edge, measured (changes nothing). The board still holds an O&M FY26 plan
// (USAF 70,000,000 + ANG 30,000,000; e.g. kept after the base moved to FY27) and FY26 is outside the window, no row filed
// under it. E3: only Initial Spares carries into FY26 (O&M counts nothing there). E1: O&M carries too. Literal sums only.
const T = process.argv[2]; delete process.env.BOARD;
await import(T + '/runtime-encoding-shim.mjs');
const { boot, seed, bootRelease } = await import(T + '/tools/export-audit/boot.mjs');
const row = (fy, title, budget, amt, office) => { const r = Array(32).fill(''); r[0] = fy; r[1] = fy + '-03'; r[2] = 'E'; r[3] = title;
  r[4] = budget; r[7] = 'Event ' + title; r[9] = amt; r[10] = 'Allocated'; r[18] = office; return r; };
const OM_ORD = row(2025, 'Ordinary FY25 Support', 'ANG O&M Discretionary', 40000000, 'Program (TSS)');
const OM_CARRY = row(2025, 'Carried Support', 'USAF O&M OBBBA', 100000000, 'Program (PSM)');
const SP_CARRY = row(2025, 'Carried Spares', 'USAF Spares Initial Mandatory PSM', 20000000, 'Program (ATL)');
const item = { id:'F1', grp:'PSM', team:'PSM', sect:'', custom:false, title:'Req F1', event:'Ev F1', ccar:'CCF1', fy26:[0,0], ask:[350000000,150000000], alloc:null };
const out = {};
for (const [k, om] of [['E3', [OM_ORD]], ['E1', [OM_ORD, OM_CARRY]]]) {
  const X = boot(); const { ev } = X;
  seed(ev, { services:['USAF','ANG'], items:[item], disc:[350000000,150000000], mand:[0,0], order:['F1'] });
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.bm={disc:[350000000,150000000],mand:[0,0],adds:[]}; MS.base=2027; MS.cur=2027; MS.years={2027:S};
    var st=JSON.parse(JSON.stringify(S)); st.bm={disc:[70000000,30000000],mand:[0,0],adds:[]}; st.discSvc=[70000000,30000000]; MS.years[2026]=st;
    applyState(S); MS.years[2027]=S;
    EXDB.all=${JSON.stringify({ om:{ asOf:'2026-09', hdr:[], read:1, noFy:0, rows:{2025:om} }, sp:{ asOf:'2026-09', hdr:[], read:1, noFy:0, rows:{2025:[SP_CARRY]} } })}; EXDB.ts=1;
    var C=flowCfg(); C.pseudo={on:true, label:'OBBBA', token:'OBBBA, Mandatory', from:2025, to:2026, col:4}; C.other={}; C.fys=null; C.aps=null; 'ok'`);
  const r = fys => JSON.parse(ev(`(function(){ flowCfg().fys=${JSON.stringify(fys)}; var F=flowCalc(); return JSON.stringify({sel:flowSelYears(), t:[F.tot,F.execV,F.planV], appn:F.appn, label:F.label}); })()`));
  out[k] = { offered: JSON.parse(ev('JSON.stringify(flowYears())')), all: r(null), fy26: r([2026]), kind26om: ev(`flowYearKind(2026,'om')`), errors: X.errors };
  bootRelease(0);
}
// Literal readings. E3 under the existing per-year rule (a year with no O&M execution reads O&M's plan): FY26 = 20 + 70 + 30 = 120;
// ALL = 40 + 20 + 70 + 30 + 350 + 150 = 660. Carried rows only, plan not read: ALL = 40 + 20 + 350 + 150 = 560.
// E1 (O&M executes in FY26, so execution wins): FY26 = 100 + 20 = 120; ALL = 40 + 100 + 20 + 350 + 150 = 660; the FY26 plan never read.
console.log(JSON.stringify(out, null, 1));
console.log('E3 ALL', out.E3.all.t[0], '| existing rule (plan read) 660000000:', out.E3.all.t[0] === 660000000, '| carried-only 560000000:', out.E3.all.t[0] === 560000000);
console.log('E1 ALL', out.E1.all.t[0], '| execution wins 660000000:', out.E1.all.t[0] === 660000000, '| FY26 120000000:', out.E1.fy26.t[0] === 120000000);
