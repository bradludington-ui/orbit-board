// verify-probe.mjs -- an INDEPENDENT second fixture for CARRY-1 (adversarial verification; changes nothing).
//   usage: node verify-probe.mjs <copyRoot> <outJson> [label]
// Different from carry-probe.mjs on purpose: other amounts (odd, all distinct), other appropriations carrying (Full Fund and
// OPN, then O&M), another rule (label BRIDGE, token "BRIDGE, Supplemental", FY2028 -> FY2029), another window (MS.base=2030),
// decoys (a token row filed under a non-"from" year; a token in the title only), and a workbook year below the window (FY27).
// Every expected value is a hand-written literal sum of the fixture amounts. No ORBIT helper computes an expectation.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(process.argv[2]); const outPath = resolve(process.argv[3]); const boardLabel = process.argv[4] || '';
delete process.env.BOARD; delete process.env.MUT_FIRST_FAIL;
await import(pathToFileURL(root + '/runtime-encoding-shim.mjs').href);
const { boot, seed, bootRelease, BOARD } = await import(pathToFileURL(root + '/tools/export-audit/boot.mjs').href);
const blobOf = b => createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
if (resolve(BOARD) !== root + '/prioritization-board-grid.html') throw new Error('BOARD mismatch ' + BOARD);
const boardBlob = blobOf(readFileSync(BOARD));

const RULE = { on:true, label:'BRIDGE', token:'BRIDGE, Supplemental', from:2028, to:2029, col:4 };
const ITEM = { id:'F1', grp:'TSS', team:'TSS', sect:'', custom:false, title:'Verify planned requirement', event:'Verify planned event',
  ccar:'VER-F1', fy26:[0,0], ask:[12345678,1000001], alloc:null };
const ROWS = {   // ap, filed fy, title, budget (r[4]), amount, office
  ffCarry:   { ap:'ff',  fy:2028, title:'Verify carried Full Fund buy',      budget:'AFRC Full Fund BRIDGE', v:7654321, office:'Program (ATL)' },
  opnCarry:  { ap:'opn', fy:2028, title:'Verify carried OPN kit',            budget:'ANG OPN Supplemental',  v:2500003, office:'Program (LOG)' },
  omOrd28:   { ap:'om',  fy:2028, title:'Verify ordinary FY28 O&M',          budget:'USAF O&M Discretionary', v:333333, office:'Program (TSS)' },
  ffOrd27:   { ap:'ff',  fy:2027, title:'Verify ordinary FY27 Full Fund',    budget:'USAF Full Fund',        v:1111111, office:'Program (ATL)' },
  omDecoy27: { ap:'om',  fy:2027, title:'Verify FY27 O&M with token',        budget:'USAF O&M BRIDGE',       v:555555,  office:'Program (PSM)' },
  opnTitle28:{ ap:'opn', fy:2028, title:'Verify BRIDGE named OPN',           budget:'USAF OPN',              v:66666,   office:'Program (LOG)' },
  omCarry28: { ap:'om',  fy:2028, title:'Verify carried O&M BRIDGE',         budget:'ANG O&M BRIDGE',        v:4040404, office:'Program (PSM)' },
  spOdd29:   { ap:'sp',  fy:2029, title:'Verify FY29 spares',                budget:'USAF Initial Spares',   v:9,       office:'Program (ATL)' },
};
const CARRIED = ['ffCarry','opnCarry','omCarry28'];
const LBL = { om:'O&M', ff:'FULL FUND', sp:'INITIAL SPARES', opn:'OPN' };
const SVC_OF = { ffCarry:'AFRC', opnCarry:'ANG', omCarry28:'ANG' };      // literal, from the Budget cell
const PMO_OF = { ffCarry:'ATL', opnCarry:'LOG', omCarry28:'PSM' };
// FY30 plan (O&M only): 12,345,678 + 1,000,001 = 13,345,679. VE adds an FY29 plan pot 3,000,003 + 400,004 = 3,400,007 (pot < ask).
const V_ROWS = ['ffCarry','opnCarry','omOrd28','ffOrd27','omDecoy27','opnTitle28'];
const CASES = [
  { id:'V', kind:'defect', base:2030, on:true, rows:V_ROWS,
    offeredCorrect:[2027,2028,2029,2030,2031,2032,2033,2034],
    // 7,654,321 + 2,500,003 + 333,333 + 1,111,111 + 555,555 + 66,666 + 12,345,678 + 1,000,001
    all:{ tot:25566668, exec:12220989, plan:13345679, appn:{ om:333333+555555+13345679, ff:7654321+1111111, sp:0, opn:2500003+66666 } },
    fy29:{ tot:10154324, appn:{ om:0, ff:7654321, sp:0, opn:2500003 } }, carried:10154324 },
  { id:'V2', kind:'defect', base:2030, on:true, rows:V_ROWS.concat(['omCarry28']),
    offeredCorrect:[2027,2028,2029,2030,2031,2032,2033,2034],
    all:{ tot:25566668+4040404, exec:12220989+4040404, plan:13345679, appn:{ om:333333+555555+13345679+4040404, ff:7654321+1111111, sp:0, opn:2500003+66666 } },
    fy29:{ tot:10154324+4040404, appn:{ om:4040404, ff:7654321, sp:0, opn:2500003 } }, carried:10154324+4040404 },
  { id:'V3', kind:'defect', base:2030, on:true, rows:['omCarry28','ffOrd27','opnCarry'],      // every FY28 O&M row is carried (A2 analogue)
    offeredCorrect:[2027,2028,2029,2030,2031,2032,2033,2034],
    all:{ tot:4040404+1111111+2500003+13345679, exec:4040404+1111111+2500003, plan:13345679, appn:{ om:4040404+13345679, ff:1111111, sp:0, opn:2500003 } },
    fy29:{ tot:4040404+2500003, appn:{ om:4040404, ff:0, sp:0, opn:2500003 } }, carried:4040404+2500003 },
  // O&M alone carries, its carried row BEHIND an ordinary one in FY28 (guards the early-stopping year scan at money level)
  { id:'V4', kind:'defect', base:2030, on:true, rows:['omOrd28','omCarry28','ffOrd27'],
    offeredCorrect:[2027,2028,2029,2030,2031,2032,2033,2034],
    // 333,333 + 4,040,404 + 1,111,111 + 12,345,678 + 1,000,001
    all:{ tot:18830527, exec:5484848, plan:13345679, appn:{ om:333333+4040404+13345679, ff:1111111, sp:0, opn:0 } },
    fy29:{ tot:4040404, appn:{ om:4040404, ff:0, sp:0, opn:0 } }, carried:4040404 },
  { id:'VC1', kind:'control', base:2030, on:false, rows:V_ROWS, offeredCorrect:[2027,2028,2030,2031,2032,2033,2034],
    all:{ tot:25566668, exec:12220989, plan:13345679, appn:{ om:333333+555555+13345679, ff:7654321+1111111, sp:0, opn:2500003+66666 } },
    fy28:{ tot:333333+66666+7654321+2500003 }, carried:0 },
  { id:'VC2', kind:'control', base:2029, on:true, rows:V_ROWS, offeredCorrect:[2027,2028,2029,2030,2031,2032,2033],
    all:{ tot:25566668, exec:12220989, plan:13345679, appn:{ om:333333+555555+13345679, ff:7654321+1111111, sp:0, opn:2500003+66666 } },
    fy29:{ tot:10154324, appn:{ om:0, ff:7654321, sp:0, opn:2500003 } }, carried:10154324 },
  { id:'VC3', kind:'control', base:2030, on:true, rows:V_ROWS.concat(['spOdd29']), offeredCorrect:[2027,2028,2029,2030,2031,2032,2033,2034],
    all:{ tot:25566668+9, exec:12220989+9, plan:13345679, appn:{ om:333333+555555+13345679, ff:7654321+1111111, sp:9, opn:2500003+66666 } },
    fy29:{ tot:10154324+9, appn:{ om:0, ff:7654321, sp:9, opn:2500003 } }, carried:10154324 },
  // EDGE (informational): V plus an O&M plan held for the carry year FY29 (pot 3,000,003 + 400,004, below the ask).
  { id:'VE', kind:'edge', base:2030, on:true, rows:V_ROWS, plan29:[3000003,400004], offeredCorrect:[2027,2028,2029,2030,2031,2032,2033,2034],
    all:{ tot:25566668+3400007, exec:12220989, plan:13345679+3400007, appn:{ om:333333+555555+13345679+3400007, ff:7654321+1111111, sp:0, opn:2500003+66666 } },
    fy29:{ tot:10154324+3400007, appn:{ om:3400007, ff:7654321, sp:0, opn:2500003 } }, carried:10154324 },
  // EDGE: V2 (O&M also carries into FY29) plus an O&M FY29 plan: execution must win -- the plan is NOT read beside the carried row
  { id:'VE2', kind:'edge', base:2030, on:true, rows:V_ROWS.concat(['omCarry28']), plan29:[3000003,400004], offeredCorrect:[2027,2028,2029,2030,2031,2032,2033,2034],
    all:{ tot:25566668+4040404, exec:12220989+4040404, plan:13345679, appn:{ om:333333+555555+13345679+4040404, ff:7654321+1111111, sp:0, opn:2500003+66666 } },
    fy29:{ tot:10154324+4040404, appn:{ om:4040404, ff:7654321, sp:0, opn:2500003 } }, carried:10154324+4040404 },
  // EDGE control: the same FY29 plan with a 9-dollar spares row making FY29 a workbook year (today's rule, any board)
  { id:'VE3', kind:'edge', base:2030, on:true, rows:V_ROWS.concat(['spOdd29']), plan29:[3000003,400004], offeredCorrect:[2027,2028,2029,2030,2031,2032,2033,2034],
    all:{ tot:25566668+9+3400007, exec:12220989+9, plan:13345679+3400007, appn:{ om:333333+555555+13345679+3400007, ff:7654321+1111111, sp:9, opn:2500003+66666 } },
    fy29:{ tot:10154324+9+3400007, appn:{ om:3400007, ff:7654321, sp:9, opn:2500003 } }, carried:10154324 },
];
// Independent model of the rule (not a board helper): a row filed under RULE.from whose Budget cell holds a token as a whole word.
const effFy = (R, on) => (on && R.fy === RULE.from && /(^|[^A-Z0-9&])(BRIDGE|SUPPLEMENTAL)([^A-Z0-9&]|$)/.test(R.budget.toUpperCase())) ? RULE.to : R.fy;

const results = [];
const check = (name, actual, expected, kind) => { const ok = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ name, kind, expected, actual, status: ok ? 'passed' : 'failed' }); return ok; };
const row32 = R => { const r = Array(32).fill(''); r[0] = R.fy; r[1] = `${R.fy}-04`; r[2] = 'VER'; r[3] = R.title; r[4] = R.budget;
  r[7] = R.title + ' event'; r[9] = R.v; r[10] = 'Allocated'; r[18] = R.office; return r; };
const M = v => '$' + (v / 1e6).toFixed(2) + 'M';
const cases = [];
for (const C of CASES) {
  const X = boot(); const { ev, w } = X; const get = e => JSON.parse(ev(`JSON.stringify(${e})`));
  seed(ev, { services:['USAF','ANG'], items:[ITEM], disc:[12345678,1000001], mand:[0,0], order:['F1'] });
  const all = {}; C.rows.forEach(k => { const R = ROWS[k]; all[R.ap] = all[R.ap] || { asOf:'2026-09', hdr:[], read:1, noFy:0, rows:{} };
    (all[R.ap].rows[R.fy] = all[R.ap].rows[R.fy] || []).push(row32(R)); });
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.bm={disc:[12345678,1000001],mand:[0,0],adds:[]};
    MS.base=${C.base}; MS.cur=2030; FYMON=fyMonths(2030); MS.years={2030:S};
    ${C.plan29 ? `var st=JSON.parse(JSON.stringify(S)); st.bm={disc:${JSON.stringify(C.plan29)},mand:[0,0],adds:[]}; st.discSvc=${JSON.stringify(C.plan29)}; MS.years[2029]=st;` : ''}
    applyState(S); MS.years[2030]=S;
    EXDB.all=${JSON.stringify(all)}; EXDB.ts=1;
    var c=flowCfg(); c.pseudo=${JSON.stringify({ ...RULE, on:C.on })}; c.other={}; c.fys=null; c.aps=null; flowSel=''; 'ok'`);
  const raw0 = get('EXDB.all');
  const tag = C.id, K = C.kind === 'control' ? 'control' : (C.kind === 'edge' ? 'edge' : 'defect');
  check(`${tag} · fixture · FY30 O&M plan is USAF 12,345,678 + ANG 1,000,001`, get(`flowPlanRecs(2030,'om').map(function(r){return [r.svc,r.v];})`),
    [['USAF',12345678],['ANG',1000001]], 'fixture');
  if (C.plan29) check(`${tag} · fixture · FY29 O&M plan is the pot USAF 3,000,003 + ANG 400,004`, get(`flowPlanRecs(2029,'om').map(function(r){return [r.svc,r.v];})`),
    [['USAF',3000003],['ANG',400004]], 'fixture');
  // independent: every effective year a row lands in, by my model
  const effYears = [...new Set(C.rows.map(k => effFy(ROWS[k], C.on)))].sort();
  const offered = get('flowYears()');
  check(`${tag} · every year a row counts in (independent model: ${effYears.join(',')}) is offered`, effYears.filter(y => offered.indexOf(y) < 0), [], K);
  check(`${tag} · offered years = workbook ∪ window ∪ every counted year`, offered, C.offeredCorrect, K);
  const flow = () => get(`(function(){ var F=flowCalc(), rows=F.prime.LM.rows.concat(F.prime.PW.rows); F.ext.keys.forEach(function(k){ rows=rows.concat(F.ext.by[k].rows); });
    return {sel:flowSelYears(), label:F.label, tot:F.tot, execV:F.execV, planV:F.planV, appn:F.appn, rows:rows.map(function(r){ return [r.ttl,r.ap,r.fy,r.svc,r.pmo,r.v,!!r.plan]; })}; })()`);
  const panel = () => { ev(`flowOpen=true; flowSel=''; flowBody(); 'ok'`); const b = w.document.getElementById('flowBody');
    const btn = [...b.querySelectorAll('button')].map(x => ({ t:x.textContent, title:x.getAttribute('title')||'', oc:x.getAttribute('onclick')||'' }));
    return { text:b.textContent, titles:btn.map(x => x.title), chips:btn.filter(x => /^flowToggleYear\(/.test(x.oc)).map(x => x.t),
      tips:btn.filter(x => /^flowToggleYear\(/.test(x.oc)).map(x => x.title), total:(/total funding (\$[\d,]+\.\d\dM)/.exec(b.textContent)||[])[1]||null }; };
  const book = async () => { const bk = JSON.parse(await w.eval(`(async function(){ var cap=null, orig=window.Blob;
      window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new orig(p,o); };
      try { exportFlow(); } finally { window.Blob=orig; } if(!cap) throw Error('no workbook');
      return JSON.stringify(await xlsxRead(cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength))); })()`));
    const v = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c; const fs = bk['Funds Flow'] || [];
    const by = l => fs.filter(r => String(v(r[0]) ?? '') === l).map(r => v(r[1])).filter(x => typeof x === 'number');
    return { tf:by('TOTAL FUNDING'), us:by('US SERVICE FUNDING'), usa:by('US service appropriations'),
      appn:Object.fromEntries(Object.entries(LBL).map(([k, l]) => [k, by(l)])),
      notes:fs.map(r => String(v(r[0]) ?? '')).filter(s => /^NOTE|^Scope/.test(s)),
      detail:['Prime Detail','OGC Detail'].flatMap(s => (bk[s] || []).slice(1).map(r => r.map(v))),
      cells:Object.values(bk).flatMap(s => s.flatMap(r => r.map(c => String(v(c) ?? '')))) }; };
  const out = { id:C.id, kind:C.kind, base:C.base, rule:{ ...RULE, on:C.on }, rows:C.rows, offered, effYearsModel:effYears, scopes:{} };
  // ALL YEARS
  const F = flow(), P = panel(), B = await book(), E = C.all;
  check(`${tag} · ALL · flowCalc total = literal ${E.tot}`, F.tot, E.tot, K);
  check(`${tag} · ALL · executed / planned = literal`, [F.execV, F.planV], [E.exec, E.plan], K);
  check(`${tag} · ALL · per appropriation = literal`, F.appn, E.appn, K);
  check(`${tag} · ALL · panel total funding = ${M(E.tot)}`, P.total, M(E.tot), K);
  check(`${tag} · ALL · export TOTAL FUNDING x2 / US SERVICE FUNDING / US service appropriations x2 = literal`, [B.tf, B.us, B.usa], [[E.tot,E.tot],[E.tot],[E.tot,E.tot]], K);
  check(`${tag} · ALL · export appropriation lines = literal`, B.appn, Object.fromEntries(Object.keys(LBL).map(k => [k, [E.appn[k]]])), K);
  check(`${tag} · ALL · surfaces agree with each other`, [F.tot, B.tf[0], B.tf[1], B.us[0], B.usa[0], Object.values(B.appn).reduce((t, a) => t + (a[0]||0), 0), F.execV + F.planV],
    Array(7).fill(F.tot), 'control');
  // ownership of each carried row (literal), wherever counted
  const carriedHere = C.rows.filter(k => CARRIED.includes(k) && effFy(ROWS[k], C.on) !== ROWS[k].fy);
  const ownFlow = F.rows.filter(r => carriedHere.some(k => ROWS[k].title === r[0])).sort();
  const ownExp = carriedHere.map(k => [ROWS[k].title, ROWS[k].ap, RULE.to, SVC_OF[k], PMO_OF[k], ROWS[k].v, false]).sort();
  check(`${tag} · ALL · flowCalc holds each carried row once, own appropriation/service/PMO/amount, effective FY${RULE.to % 100}`, ownFlow, ownExp, K);
  const ownX = B.detail.filter(r => carriedHere.some(k => ROWS[k].title === r[0])).map(r => [r[0], r[2], r[3], r[4], r[5], r[6]]).sort();
  check(`${tag} · ALL · export detail holds each carried row once with its ownership`, ownX,
    carriedHere.map(k => [ROWS[k].title, LBL[ROWS[k].ap], PMO_OF[k], SVC_OF[k], ROWS[k].v, 'OBLIGATED']).sort(), K);
  // disclosure: any statement of a carried amount (whole, comma-grouped, $x.xxM) on the panel or in the file
  const amts = [...new Set(carriedHere.map(k => ROWS[k].v).concat(C.carried ? [C.carried] : []))];
  const says = (texts, a) => texts.some(t => String(t).includes(String(a)) || String(t).includes(a.toLocaleString('en-US')) || String(t).includes(M(a)));
  out.disclosure = { amounts:amts, panel:amts.filter(a => says([P.text].concat(P.titles), a)), export:amts.filter(a => says(B.cells, a)) };
  out.scopes.ALL = { flow:F, panelTotal:P.total, chips:P.chips, tips:P.tips, export:{ tf:B.tf, us:B.us, usa:B.usa, appn:B.appn, notes:B.notes } };
  // explicit carry year
  ev(`flowCfg().fys=[${RULE.to}]; flowSel=''; 'ok'`);
  const F29 = flow(), B29 = await book();
  if (C.fy29) {
    check(`${tag} · FY29 explicit · selection honoured`, F29.sel, [2029], K);
    check(`${tag} · FY29 explicit · total / appropriations = literal`, [F29.tot, F29.appn], [C.fy29.tot, C.fy29.appn], K);
    check(`${tag} · FY29 explicit · export TOTAL FUNDING = literal`, B29.tf, [C.fy29.tot, C.fy29.tot], K);
  }
  out.scopes.FY29 = { flow:F29, export:{ tf:B29.tf, notes:B29.notes } };
  if (C.id === 'V') {   // saved with FY29 alone, reopened from the saved file
    ev(`save(); 'ok'`); const R = boot({ html: ev('buildSavedHtml()') });
    const RS = JSON.parse(R.ev(`(function(){ var F=flowCalc(); return JSON.stringify({saved:flowCfg().fys, sel:flowSelYears(), tot:F.tot, raw:JSON.stringify(EXDB.all)===${JSON.stringify(JSON.stringify(raw0))}}); })()`));
    check(`${tag} · FY29 saved alone and reopened · selection kept, total = literal 10,154,324, raw rows intact`, RS, { saved:[2029], sel:[2029], tot:10154324, raw:true }, K);
    out.reopened = RS;
  }
  if (C.fy28) { ev(`flowCfg().fys=[2028]; 'ok'`); const F28 = flow(); check(`${tag} · FY28 alone (rule off) = literal`, F28.tot, C.fy28.tot, K); out.scopes.FY28 = { flow:F28 }; }
  // each offered year alone adds up to ALL YEARS; carried dollars counted once across offered years
  const sweep = get(`(function(){ var o=[]; flowYears().forEach(function(y){ flowCfg().fys=[y]; var F=flowCalc(), rows=F.prime.LM.rows.concat(F.prime.PW.rows);
    F.ext.keys.forEach(function(k){ rows=rows.concat(F.ext.by[k].rows); }); o.push([y, F.tot, rows.filter(function(r){ return ${JSON.stringify(carriedHere.map(k => ROWS[k].title))}.indexOf(r.ttl)>=0; }).reduce(function(t,r){ return t+r.v; },0)]); });
    flowCfg().fys=null; return o; })()`);
  check(`${tag} · offered years alone add to ALL YEARS`, sweep.reduce((t, s) => t + s[1], 0), F.tot, 'control');
  check(`${tag} · carried dollars counted exactly once across offered years = literal ${C.carried}`, sweep.reduce((t, s) => t + s[2], 0),
    C.on ? C.carried : 0, K);
  out.perYear = sweep;
  out.internal2029 = get(`(function(){ var F=flowCalc(2029); return [F.tot, F.appn]; })()`);
  check(`${tag} · source rows untouched`, get('EXDB.all'), raw0, 'control');
  check(`${tag} · no jsdom errors`, X.errors, [], 'control');
  bootRelease(0); cases.push(out);
}
const sum = { board:boardLabel, boardBlob, probeBlob:blobOf(readFileSync(new URL(import.meta.url))), cases, results,
  byKind:['defect','control','fixture','edge'].reduce((o, k) => (o[k] = { passed:results.filter(r => r.kind === k && r.status === 'passed').length,
    failed:results.filter(r => r.kind === k && r.status === 'failed').length }, o), {}) };
writeFileSync(outPath, JSON.stringify(sum, null, 2) + '\n');
results.filter(r => r.status === 'failed').forEach(r => console.log('FAIL', r.kind, '|', r.name, '| exp', JSON.stringify(r.expected), '| got', JSON.stringify(r.actual)));
console.log(JSON.stringify({ board:boardLabel, boardBlob, byKind:sum.byKind }));
bootRelease(0);
process.exit(sum.byKind.control.failed || sum.byKind.fixture.failed ? 3 : 0);
