// Lead's independent R1 cross-check (not one of the received probes). Board = $BOARD (via boot.mjs). Expected
// figures are literal fixture arithmetic. Variant B: FY25 plans $300M and its only execution is carried to FY26
// ($100M); Variant A: FY25 also executed $40M of its own. Reads flowCalc for [2025], [2026] and [2025,2026].
const T = process.argv[2];                       // path to a copy root holding tools/ and runtime-encoding-shim.mjs
await import(T + '/runtime-encoding-shim.mjs');
const { boot, seed, bootRelease } = await import(T + '/tools/export-audit/boot.mjs');
const out = {};
for (const variant of ['B', 'A']) {
  const X = boot(); const { ev } = X;
  const get = e => JSON.parse(ev(`JSON.stringify(${e})`));
  const item = { id:'F1', grp:'PSM', team:'PSM', sect:'', custom:false, title:'Synthetic planned requirement', event:'E',
    ccar:'SYN-F1', fy26:[0,0], ask:[350000000,150000000], alloc:null };
  seed(ev, { services:['USAF','ANG'], items:[item], disc:[350000000,150000000], mand:[0,0], order:['F1'] });
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.bm={disc:[350000000,150000000],mand:[0,0],adds:[]}; MS.base=2025; MS.cur=2026;
    var y25=JSON.parse(JSON.stringify(S)); y25.bm={disc:[300000000,0],mand:[0,0],adds:[]}; y25.discSvc=[300000000,0];
    MS.years={2025:y25,2026:S}; applyState(S); MS.years[2026]=S; 'ok'`);
  const row = (fy, title, budget, amount, office) => { const r = Array(32).fill(''); r[0]=fy; r[1]=fy+'-03'; r[2]='SYN-EXEC';
    r[3]=title; r[4]=budget; r[7]='E'; r[9]=amount; r[10]='Allocated'; r[18]=office; return r; };
  const rows25 = [row(2025, 'Synthetic carryover', 'USAF O&M Mandatory', 100000000, 'Program (PSM)')];
  if (variant === 'A') rows25.push(row(2025, 'Synthetic FY25 own execution', 'ANG O&M Discretionary', 40000000, 'Program (TSS)'));
  ev(`EXDB.all=${JSON.stringify({ om:{ asOf:'2026-09', hdr:[], read:1, noFy:0, rows:{2025:rows25} } })}; EXDB.ts=1;
    flowCfg().other={}; flowCfg().aps=['om']; flowPseudo().on=true; 'ok'`);
  const raw0 = get('EXDB.all');
  const read = fys => { ev(`flowCfg().fys=${JSON.stringify(fys)}; 'ok'`);
    return get(`(function(){ var F=flowCalc(); return {fys:F.fys, tot:F.tot, exec:F.execV, plan:F.planV, label:F.label, mix:F.mixYs}; })()`); };
  out[variant] = { fy25: read([2025]), fy26: read([2026]), both: read([2025, 2026]),
    rawUnchanged: JSON.stringify(get('EXDB.all')) === JSON.stringify(raw0), errors: X.errors };
  bootRelease(0);
}
const want = { B: { fy25: [300000000, 0, 300000000], fy26: [100000000, 100000000, 0], both: [400000000, 100000000, 300000000] },
               A: { fy25: [40000000, 40000000, 0], fy26: [100000000, 100000000, 0], both: [140000000, 140000000, 0] } };
let bad = 0;
for (const v of ['B', 'A']) for (const k of ['fy25', 'fy26', 'both']) {
  const g = out[v][k], got = [g.tot, g.exec, g.plan], ok = JSON.stringify(got) === JSON.stringify(want[v][k]); if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} Variant ${v} ${k}: got [tot, exec, plan] ${JSON.stringify(got)} want ${JSON.stringify(want[v][k])} | fys ${JSON.stringify(g.fys)} | ${g.label} | mixed ${JSON.stringify(g.mix)}`);
}
for (const v of ['B', 'A']) { console.log(`${out[v].rawUnchanged ? 'ok  ' : 'FAIL'} Variant ${v} raw execution unchanged; script errors ${JSON.stringify(out[v].errors)}`); if (!out[v].rawUnchanged) bad++; }
console.log(bad ? `${bad} FAILING` : 'ALL OK'); process.exit(bad ? 1 : 0);
