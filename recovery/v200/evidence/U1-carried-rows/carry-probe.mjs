// carry-probe.mjs -- bounded, synthetic reproduction of the CARRIED-ROW OMISSION on the ORBIT funds flow.
// Reproduces and measures only; changes nothing in the board or its tools.
//
//   usage: node carry-probe.mjs <copyRoot> <outJson> [boardLabel]
//
// <copyRoot> is a git-archive copy holding prioritization-board-grid.html, tools/, package.json, a node_modules link and
// runtime-encoding-shim.mjs (byte-identical to recovery/v200/probes/received-2026-10-11/runtime-encoding-shim.mjs).
// The board booted is <copyRoot>/prioritization-board-grid.html (BOARD is unset and asserted).
//
// EVERY EXPECTED VALUE BELOW IS LITERAL ARITHMETIC OF THE FIXTURE AMOUNTS, written out by hand. No ORBIT helper is used to
// compute an expectation. Board helpers are only READ for observed values.
//
// Check kinds:
//   defect  -- the contract the finding says is broken ("every carried dollar is counted in an offered year, or plainly
//              disclosed"); expected to FAIL on a board that has the omission.
//   control -- must hold on every board (R1 behaviour, ownership where the dollars are counted, and surfaces agreeing).
//   fixture -- the synthetic board was seeded as intended.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(process.argv[2] || '.');
const outPath = resolve(process.argv[3] || 'carry-results.json');
const boardLabel = process.argv[4] || '';
delete process.env.BOARD;                       // boot.mjs must take the copy's own board
delete process.env.MUT_FIRST_FAIL;
await import(pathToFileURL(root + '/runtime-encoding-shim.mjs').href);
const { boot, seed, bootRelease, BOARD } = await import(pathToFileURL(root + '/tools/export-audit/boot.mjs').href);

const blobOf = buf => createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
const boardPath = root + '/prioritization-board-grid.html';
if (resolve(BOARD) !== boardPath) throw new Error(`boot.mjs BOARD is ${BOARD}, not ${boardPath}`);
const boardBlob = blobOf(readFileSync(boardPath));
const bootBlob = blobOf(readFileSync(root + '/tools/export-audit/boot.mjs'));
const shimBlob = blobOf(readFileSync(root + '/runtime-encoding-shim.mjs'));
const probeBlob = blobOf(readFileSync(new URL(import.meta.url)));

// ------------------------------------------------------------------------------------------------ the fixture (literal)
// Board plan: one O&M requirement F1, planned for FY27 only (MS.years holds 2027 alone): USAF 350,000,000 + ANG 150,000,000.
const PLAN_ITEM = { id:'F1', grp:'PSM', team:'PSM', sect:'', custom:false,
  title:'Synthetic planned requirement', event:'Synthetic planned event', ccar:'SYN-F1',
  fy26:[0,0], ask:[350000000,150000000], alloc:null };
// Workbook (CCaR) rows. Budget column (r[4]) decides the carryover: 'OBBBA' and 'Mandatory' are the default tokens.
const ROWS = {
  omCarry: { fy:2025, ap:'om', title:'Synthetic carried O&M requirement', event:'Synthetic carried O&M event',
             budget:'USAF O&M OBBBA', amount:100000000, office:'Program (PSM)' },
  omOrd:   { fy:2025, ap:'om', title:'Synthetic ordinary FY25 O&M requirement', event:'Synthetic ordinary FY25 O&M event',
             budget:'ANG O&M Discretionary', amount:40000000, office:'Program (TSS)' },
  spCarry: { fy:2025, ap:'sp', title:'Synthetic carried spares requirement', event:'Synthetic carried spares event',
             budget:'USAF Spares Initial Mandatory PSM', amount:20000000, office:'Program (ATL)' },
  om26:    { fy:2026, ap:'om', title:'Synthetic FY26 O&M requirement', event:'Synthetic FY26 O&M event',
             budget:'USAF O&M Discretionary', amount:7000000, office:'Program (LOG)' },
  ff26:    { fy:2026, ap:'ff', title:'Synthetic FY26 Full Fund requirement', event:'Synthetic FY26 Full Fund event',
             budget:'USAF Full Fund', amount:3000000, office:'Program (ATL)' },
};
const CARRIED_TITLES = [ROWS.omCarry.title, ROWS.spCarry.title];
// What each carried row must carry wherever it is counted (literal): flowCalc rec, panel drill row, export detail row.
const OWN = {
  omCarry: { ap:'om', svc:'USAF', pmo:'PSM', pmoFull:'Program (PSM)', ttl:'Synthetic carried O&M requirement',
             ev:'Synthetic carried O&M event', v:100000000, plan:false, ob:true,
             panel:['Synthetic carried O&M requirement','Synthetic carried O&M event','O&M','PSM','USAF','$100.00M','OBLIGATED'],
             xlsx:['Synthetic carried O&M requirement','Synthetic carried O&M event','O&M','PSM','USAF',100000000,'OBLIGATED'] },
  spCarry: { ap:'sp', svc:'USAF', pmo:'ATL', pmoFull:'Program (ATL)', ttl:'Synthetic carried spares requirement',
             ev:'Synthetic carried spares event', v:20000000, plan:false, ob:true,
             panel:['Synthetic carried spares requirement','Synthetic carried spares event','INITIAL SPARES','ATL','USAF','$20.00M','OBLIGATED'],
             xlsx:['Synthetic carried spares requirement','Synthetic carried spares event','INITIAL SPARES','ATL','USAF',20000000,'OBLIGATED'] },
};
const APPN_LABEL = { om:'O&M', ff:'FULL FUND', sp:'INITIAL SPARES', opn:'OPN' };   // literal export labels

// Expected values: literal sums of the fixture amounts above. `uncounted` = carried dollars a correct board must count or disclose.
const E = {
  A: {
    ALL:     { tot: 100000000 + 40000000 + 20000000 + 350000000 + 150000000,          // 660,000,000
               exec: 100000000 + 40000000 + 20000000, plan: 350000000 + 150000000,    // 160,000,000 / 500,000,000
               appn: { om: 100000000 + 40000000 + 350000000 + 150000000, ff: 0, sp: 20000000, opn: 0 },
               uncounted: 100000000 + 20000000, carriedFy: 2026 },
    ALLY_OM: { tot: 100000000 + 40000000 + 350000000 + 150000000,                       // 640,000,000
               exec: 100000000 + 40000000, plan: 350000000 + 150000000,
               appn: { om: 100000000 + 40000000 + 350000000 + 150000000, ff: 0, sp: 0, opn: 0 },
               uncounted: 100000000, carriedFy: 2026 },
    FY26:    { tot: 100000000 + 20000000, exec: 100000000 + 20000000, plan: 0,          // 120,000,000 if FY26 is honoured
               appn: { om: 100000000, ff: 0, sp: 20000000, opn: 0 }, uncounted: 100000000 + 20000000, carriedFy: 2026 },
    FY25:    { tot: 40000000, exec: 40000000, plan: 0,                                  // R1: carried rows count in FY26, not FY25
               appn: { om: 40000000, ff: 0, sp: 0, opn: 0 } },
  },
  A2: {
    ALL:     { tot: 100000000 + 20000000 + 350000000 + 150000000,                       // 620,000,000
               exec: 100000000 + 20000000, plan: 350000000 + 150000000,
               appn: { om: 100000000 + 350000000 + 150000000, ff: 0, sp: 20000000, opn: 0 },
               uncounted: 100000000 + 20000000, carriedFy: 2026 },
  },
  A3: {
    ALL:     { tot: 40000000 + 20000000 + 350000000 + 150000000,                        // 560,000,000
               exec: 40000000 + 20000000, plan: 350000000 + 150000000,
               appn: { om: 40000000 + 350000000 + 150000000, ff: 0, sp: 20000000, opn: 0 },
               uncounted: 20000000, carriedFy: 2026 },
  },
  Cii: {
    ALL:     { tot: 100000000 + 40000000 + 20000000 + 350000000 + 150000000,            // 660,000,000
               exec: 100000000 + 40000000 + 20000000, plan: 350000000 + 150000000,
               appn: { om: 100000000 + 40000000 + 350000000 + 150000000, ff: 0, sp: 20000000, opn: 0 }, carriedFy: 2026 },
    FY26:    { tot: 100000000 + 20000000, exec: 100000000 + 20000000, plan: 0,
               appn: { om: 100000000, ff: 0, sp: 20000000, opn: 0 }, carriedFy: 2026 },
  },
  Ciii: {
    ALL:     { tot: 100000000 + 40000000 + 20000000 + 7000000 + 350000000 + 150000000,  // 667,000,000
               exec: 100000000 + 40000000 + 20000000 + 7000000, plan: 350000000 + 150000000,
               appn: { om: 100000000 + 40000000 + 7000000 + 350000000 + 150000000, ff: 0, sp: 20000000, opn: 0 }, carriedFy: 2026 },
    FY26:    { tot: 100000000 + 20000000 + 7000000, exec: 100000000 + 20000000 + 7000000, plan: 0,
               appn: { om: 100000000 + 7000000, ff: 0, sp: 20000000, opn: 0 }, carriedFy: 2026 },
  },
  Ciiib: {
    ALL:     { tot: 100000000 + 40000000 + 20000000 + 3000000 + 350000000 + 150000000,  // 663,000,000
               exec: 100000000 + 40000000 + 20000000 + 3000000, plan: 350000000 + 150000000,
               appn: { om: 100000000 + 40000000 + 350000000 + 150000000, ff: 3000000, sp: 20000000, opn: 0 }, carriedFy: 2026 },
    FY26:    { tot: 100000000 + 20000000 + 3000000, exec: 100000000 + 20000000 + 3000000, plan: 0,
               appn: { om: 100000000, ff: 3000000, sp: 20000000, opn: 0 }, carriedFy: 2026 },
  },
  Civ: {
    ALL:     { tot: 100000000 + 40000000 + 20000000 + 350000000 + 150000000,            // 660,000,000
               exec: 100000000 + 40000000 + 20000000, plan: 350000000 + 150000000,
               appn: { om: 100000000 + 40000000 + 350000000 + 150000000, ff: 0, sp: 20000000, opn: 0 }, carriedFy: 2025 },
    FY25:    { tot: 100000000 + 40000000 + 20000000, exec: 100000000 + 40000000 + 20000000, plan: 0,
               appn: { om: 100000000 + 40000000, ff: 0, sp: 20000000, opn: 0 }, carriedFy: 2025 },
  },
};
// Offered years a correct board shows (literal): the workbook years, the plan window, and every year a row counts in.
const OFFER = {
  A:     [2025, 2026, 2027, 2028, 2029, 2030, 2031],
  A2:    [2025, 2026, 2027, 2028, 2029, 2030, 2031],
  A3:    [2025, 2026, 2027, 2028, 2029, 2030, 2031],
  Cii:   [2025, 2026, 2027, 2028, 2029, 2030],
  Ciii:  [2025, 2026, 2027, 2028, 2029, 2030, 2031],
  Ciiib: [2025, 2026, 2027, 2028, 2029, 2030, 2031],
  Civ:   [2025, 2027, 2028, 2029, 2030, 2031],
};

const CASES = [
  { id:'A', kind:'defect', what:'THE OMISSION: plan window FY27-FY31 (MS.base=2027); FY25 rows only (carried O&M, ordinary O&M, carried Initial Spares); no FY26 rows; carryover rule on',
    base:2027, on:true, rows:['omOrd','omCarry','spCarry'],
    scopes:[ { key:'ALL', fys:null, aps:null, surfaces:true, kind:'defect' },
             { key:'ALLY_OM', fys:null, aps:['om'], surfaces:true, kind:'defect' },
             { key:'FY26', fys:[2026], aps:null, surfaces:true, kind:'defect', note:'C(i): FY26 selected explicitly through flowCfg().fys=[2026]' },
             { key:'FY25', fys:[2025], aps:null, surfaces:true, kind:'control' } ] },
  { id:'A2', kind:'defect', what:'variant of A without the ordinary FY25 row: every FY25 row is carried (the R1b "stored under FY25" wording applies here)',
    base:2027, on:true, rows:['omCarry','spCarry'],
    scopes:[ { key:'ALL', fys:null, aps:null, surfaces:true, kind:'defect' } ] },
  { id:'A3', kind:'defect', what:'variant of A where only another appropriation carries: O&M has its ordinary FY25 row only, Initial Spares its carried FY25 row',
    base:2027, on:true, rows:['omOrd','spCarry'],
    scopes:[ { key:'ALL', fys:null, aps:null, surfaces:true, kind:'defect' } ] },
  { id:'Cii', kind:'control', what:'C(ii): the fixture of A with FY26 inside the plan window (MS.base=2026, window FY26-FY30)',
    base:2026, on:true, rows:['omCarry','omOrd','spCarry'],
    scopes:[ { key:'ALL', fys:null, aps:null, surfaces:true, kind:'control' },
             { key:'FY26', fys:[2026], aps:null, surfaces:true, kind:'control' } ] },
  { id:'Ciii', kind:'control', what:'C(iii): the fixture of A plus an O&M FY26 workbook row (7,000,000): FY26 is a workbook year',
    base:2027, on:true, rows:['omCarry','omOrd','spCarry','om26'],
    scopes:[ { key:'ALL', fys:null, aps:null, surfaces:true, kind:'control' },
             { key:'FY26', fys:[2026], aps:null, surfaces:true, kind:'control' } ] },
  { id:'Ciiib', kind:'control', what:'C(iii-b): the fixture of A plus a FULL FUND FY26 workbook row (3,000,000): another appropriation makes FY26 a workbook year',
    base:2027, on:true, rows:['omCarry','omOrd','spCarry','ff26'],
    scopes:[ { key:'ALL', fys:null, aps:null, surfaces:true, kind:'control' },
             { key:'FY26', fys:[2026], aps:null, surfaces:true, kind:'control' } ] },
  { id:'Civ', kind:'control', what:'C(iv): the fixture of A with the carryover rule off: the carried rows count in FY25',
    base:2027, on:false, rows:['omCarry','omOrd','spCarry'],
    scopes:[ { key:'ALL', fys:null, aps:null, surfaces:true, kind:'control' },
             { key:'FY25', fys:[2025], aps:null, surfaces:true, kind:'control' } ] },
];

// ------------------------------------------------------------------------------------------------ helpers
const results = [];
const check = (name, actual, expected, kind = 'control', extra = {}) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ name, kind, expected, actual, status: ok ? 'passed' : 'failed', ...extra });
  return ok;
};
const row32 = R => { const r = Array(32).fill(''); r[0] = R.fy; r[1] = `${R.fy}-03`; r[2] = 'SYN-EXEC'; r[3] = R.title;
  r[4] = R.budget; r[7] = R.event; r[9] = R.amount; r[10] = 'Allocated'; r[18] = R.office; return r; };
const exdbOf = keys => { const all = {};
  keys.forEach(k => { const R = ROWS[k];
    all[R.ap] = all[R.ap] || { asOf:'2026-09', hdr:[], read:1, noFy:0, rows:{} };
    (all[R.ap].rows[R.fy] = all[R.ap].rows[R.fy] || []).push(row32(R)); });
  return all; };
const label = v => String(v && typeof v === 'object' ? v.v : v ?? '');
const val = v => (v && typeof v === 'object' && 'v' in v) ? v.v : v;
const dollarsOfM = s => Math.round(parseFloat(String(s).replace(/,/g, '')) * 1e6);
const AMT_RX = n => { const d = String(n), c = Number(n).toLocaleString('en-US'), m = (n / 1e6).toFixed(2);
  return new RegExp(`(^|[^0-9.,])(${d}|${c.replace(/,/g, ',')}|\\$${m.replace('.', '\\.')}M)([^0-9]|$)`); };
const mentionsAmount = (texts, amounts) => amounts.filter(a => texts.some(t => AMT_RX(a).test(String(t))));

// ------------------------------------------------------------------------------------------------ one case, one fresh board
async function runCase(C) {
  const t0 = Date.now();
  const X = boot();
  const { ev, w } = X;
  const get = expr => JSON.parse(ev(`JSON.stringify(${expr})`));
  seed(ev, { services:['USAF','ANG'], items:[PLAN_ITEM], disc:[350000000,150000000], mand:[0,0], order:['F1'] });
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.bm={disc:[350000000,150000000],mand:[0,0],adds:[]};
    MS.base=${C.base}; MS.cur=2027;
    MS.years={2027:S};
    applyState(S); MS.years[2027]=S; 'ok'`);
  ev(`EXDB.all=${JSON.stringify(exdbOf(C.rows))}; EXDB.ts=1;
    flowCfg().other={}; flowCfg().fys=null; flowCfg().aps=null; flowPseudo().on=${C.on ? 'true' : 'false'}; flowSel=''; 'ok'`);
  const rawBefore = get('EXDB.all');
  const env = get(`{mySlug:mySlug(), base:MS.base, cur:MS.cur, years:Object.keys(MS.years).map(Number),
    pseudo:flowPseudo(), planYears:flowPlanYears(), workbookYears:flowExecYears(null,true),
    effectiveExecYears:{all:flowExecYears(null), om:flowExecYears('om'), ff:flowExecYears('ff'), sp:flowExecYears('sp'), opn:flowExecYears('opn')},
    offered:flowYears()}`);
  // fixture: the FY27 plan is USAF 350,000,000 + ANG 150,000,000 on O&M
  const planRecs = get(`flowPlanRecs(2027,'om').map(function(r){ return [r.svc,r.v,r.ttl,r.pmo]; })`);
  check(`${C.id} · fixture · FY27 O&M plan is USAF 350,000,000 + ANG 150,000,000 on F1 (PSM)`, planRecs,
    [['USAF',350000000,'Synthetic planned requirement','PSM'],['ANG',150000000,'Synthetic planned requirement','PSM']], 'fixture');
  check(`${C.id} · fixture · carryover rule ${C.on ? 'on' : 'off'}: OBBBA / "OBBBA, Mandatory" / FY2025 -> FY2026 / Budget column`,
    [env.pseudo.on, env.pseudo.label, env.pseudo.token, env.pseudo.from, env.pseudo.to, env.pseudo.col],
    [C.on, 'OBBBA', 'OBBBA, Mandatory', 2025, 2026, 4], 'fixture');
  check(`${C.id} · fixture · board is O&M (mySlug)`, env.mySlug, 'om', 'fixture');
  check(`${C.id} · years offered (flowYears) include every year a row counts in`, env.offered, OFFER[C.id], C.kind);

  const readFlow = () => get(`(function(){ var F=flowCalc(), rows=F.prime.LM.rows.concat(F.prime.PW.rows);
    F.ext.keys.forEach(function(k){ rows=rows.concat(F.ext.by[k].rows); });
    return {selYears:flowSelYears(), selAppns:flowSelAppns(), fys:F.fys, aps:F.aps, label:F.label,
      tot:F.tot, us:F.us, grand:F.grand, ip:F.ip, fms:F.fms, execV:F.execV, planV:F.planV, appn:F.appn,
      execYs:F.execYs, planYs:F.planYs, mixYs:F.mixYs, pseudo:F.pseudo, uplV:F.upl.v, nRows:F.rows,
      rows:rows.map(function(r){ return {ap:r.ap, fy:r.fy, svc:r.svc, pmo:r.pmo, pmoFull:r.pmoFull, ttl:r.ttl, ev:r.ev,
        v:r.v, plan:!!r.plan, ob:!!r.ob}; })}; })()`);
  const panel = () => {
    ev(`flowOpen=true; flowSel=''; flowBody(); 'ok'`);
    const body = w.document.getElementById('flowBody');
    const text = body.textContent;
    const buttons = [...body.querySelectorAll('button')].map(b => ({ text: b.textContent, title: b.getAttribute('title') || '',
      on: b.classList.contains('on'), onclick: b.getAttribute('onclick') || '' }));
    const yearButtons = buttons.filter(b => /^flowToggleYear\(\d+\)$/.test(b.onclick))
      .map(b => ({ fy: +/\d+/.exec(b.onclick)[0], text: b.text, title: b.title, on: b.on }));
    const allYears = buttons.filter(b => b.onclick === 'flowAllYears()').map(b => ({ text: b.text, on: b.on, title: b.title }))[0] || null;
    const pseudoChip = buttons.filter(b => /^flowSetPseudo\(/.test(b.onclick)).map(b => ({ text: b.text, on: b.on, title: b.title }))[0] || null;
    const totM = /total funding \$([\d,]+\.\d\d)M/.exec(text);
    const execM = [...text.matchAll(/\$([\d,]+\.\d\d)M executed/g)].map(m => dollarsOfM(m[1]));
    const planM = [...text.matchAll(/\$([\d,]+\.\d\d)M planned/g)].map(m => dollarsOfM(m[1]));
    const showing = (/Showing .*?(?= · total funding| · total funding)/.exec(text) || [''])[0];
    const boxes = [...body.querySelectorAll('div')].filter(d => /PLANNED, not executed|Planned and executed money in one total|This total holds/.test(d.textContent)
      && !d.querySelector('div')).map(d => d.textContent);
    // the roll-up drill: every OGC row and every prime row the panel lists
    const drill = sel => { ev(`flowSel=${JSON.stringify(sel)}; flowBody(); 'ok'`);
      const tabs = [...w.document.getElementById('flowBody').querySelectorAll('table.fctab')].filter(t => {
        const th = [...t.querySelectorAll('th')].map(x => x.textContent); return th[0] === 'Requirement' && th[th.length - 1] === 'Status'; });
      const rows = tabs.length ? [...tabs[tabs.length - 1].querySelectorAll('tr')].slice(1).map(tr => [...tr.querySelectorAll('td')].map(td => td.textContent)) : [];
      return rows; };
    const drillRows = drill('hub|ext').concat(drill('hub|prime'));
    ev(`flowSel=''; flowBody(); 'ok'`);
    return { text, yearButtons, allYears, pseudoChip, total: totM ? dollarsOfM(totM[1]) : null, executedStated: execM, plannedStated: planM,
      showing, boxes, drillRows, titles: buttons.map(b => b.title).filter(Boolean) };
  };
  const exportBook = async () => {
    const book = JSON.parse(await w.eval(`(async function(){ var cap=null, orig=window.Blob;
      window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new orig(p,o); };
      try { exportFlow(); } finally { window.Blob=orig; }
      if(!cap) throw Error('no workbook emitted');
      var ab=cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength);
      return JSON.stringify(await xlsxRead(ab)); })()`));
    const fs = book['Funds Flow'] || [];
    const by = l => fs.filter(r => label(r[0]) === l).map(r => val(r[1]));
    const detail = name => (book[name] || []).slice(1).map(r => r.map(val));
    const allCells = Object.keys(book).flatMap(s => book[s].flatMap(r => r.map(c => String(val(c) ?? ''))));
    return { sheets: Object.keys(book),
      scope: fs.map(r => label(r[0])).filter(s => /^Scope: /.test(s)),
      notes: fs.map(r => label(r[0])).filter(s => /^NOTE: /.test(s)),
      totalFunding: by('TOTAL FUNDING').filter(v => typeof v === 'number'),
      usServiceFunding: by('US SERVICE FUNDING').filter(v => typeof v === 'number'),
      usServiceAppropriations: by('US service appropriations').filter(v => typeof v === 'number'),
      appnLines: Object.fromEntries(Object.entries(APPN_LABEL).map(([k, l]) => [k, by(l).filter(v => typeof v === 'number')])),
      primeDetail: detail('Prime Detail'), ogcDetail: detail('OGC Detail'), allCells, book };
  };

  const scopes = {};
  for (const S of C.scopes) {
    ev(`flowCfg().fys=${JSON.stringify(S.fys)}; flowCfg().aps=${JSON.stringify(S.aps)}; flowSel=''; 'ok'`);
    const F = readFlow();
    const P = S.surfaces ? panel() : null;
    const B = S.surfaces ? await exportBook() : null;
    const exp = E[C.id][S.key];
    const tag = `${C.id} · ${S.key}${S.note ? ' (' + S.note + ')' : ''}`;
    const K = S.kind;
    // ownership is compared as a SET: flowCalc lists rows category by category, so its order is not a property of a row
    const byTtl = (a, b) => (a.ttl || a[0]) < (b.ttl || b[0]) ? -1 : (a.ttl || a[0]) > (b.ttl || b[0]) ? 1 : 0;
    const carriedRows = F.rows.filter(r => CARRIED_TITLES.includes(r.ttl)).sort(byTtl);
    const carriedPanel = P ? P.drillRows.filter(r => CARRIED_TITLES.includes(r[0])).sort(byTtl) : [];
    const carriedXlsx = B ? B.primeDetail.concat(B.ogcDetail).filter(r => CARRIED_TITLES.includes(r[0])).sort(byTtl) : [];
    const carriedAnywhereInPanel = P ? CARRIED_TITLES.filter(t => P.text.includes(t) || P.drillRows.some(r => r[0] === t)) : [];
    const carriedAnywhereInXlsx = B ? CARRIED_TITLES.filter(t => B.allCells.includes(t)) : [];
    // a disclosure is any statement of the uncounted carried amount (100,000,000 / 20,000,000 / their sum) on screen or in the file
    const carriedInScope = Object.entries(OWN).filter(([k]) => C.rows.includes(k) && (S.aps == null || S.aps.includes(OWN[k].ap)));
    const uncAmts = exp.uncounted ? carriedInScope.map(([, o]) => o.v).concat([exp.uncounted]).filter((a, i, A) => A.indexOf(a) === i) : [];
    const panelTexts = P ? [P.text].concat(P.titles) : [];
    const discPanel = mentionsAmount(panelTexts, uncAmts);
    const discXlsx = B ? mentionsAmount(B.allCells, uncAmts) : [];

    // ---- A/D: totals against literal arithmetic, surface by surface
    check(`${tag} · flowCalc total = literal ${exp.tot.toLocaleString('en-US')}`, F.tot, exp.tot, K);
    check(`${tag} · flowCalc executed + planned split = literal ${exp.exec.toLocaleString('en-US')} + ${exp.plan.toLocaleString('en-US')}`,
      [F.execV, F.planV], [exp.exec, exp.plan], K);
    check(`${tag} · flowCalc per-appropriation = literal`, F.appn, exp.appn, K);
    if (P) {
      check(`${tag} · panel "total funding" = literal ${exp.tot.toLocaleString('en-US')}`, P.total, exp.tot, K);
    }
    if (B) {
      check(`${tag} · export TOTAL FUNDING (summary and reconciliation) = literal`, B.totalFunding, [exp.tot, exp.tot], K);
      check(`${tag} · export US SERVICE FUNDING = literal`, B.usServiceFunding, [exp.tot], K);
      check(`${tag} · export US service appropriations (summary and reconciliation) = literal`, B.usServiceAppropriations, [exp.tot, exp.tot], K);
      const inScope = (S.aps || ['om','ff','sp','opn']);
      check(`${tag} · export per-appropriation lines = literal`,
        Object.fromEntries(inScope.map(a => [a, B.appnLines[a]])), Object.fromEntries(inScope.map(a => [a, [exp.appn[a]]])), K);
    }
    // ---- D: the surfaces agree with each other (on whatever number the board computes)
    if (P && B) {
      const sumAppn = (S.aps || ['om','ff','sp','opn']).reduce((t, a) => t + (B.appnLines[a][0] || 0), 0);
      check(`${tag} · surfaces agree: panel total = flowCalc grand = export TOTAL FUNDING = US SERVICE FUNDING = sum of appropriation lines = executed + planned`,
        [P.total, F.grand, B.totalFunding[0], B.totalFunding[1], B.usServiceFunding[0], sumAppn, F.execV + F.planV],
        Array(7).fill(F.grand), 'control');
    }
    // ---- B: ownership wherever the carried dollars are counted; presence where they are not
    const carriedExpected = carriedInScope;
    const ownExpectedRows = carriedExpected.map(([, o]) => ({ ap:o.ap, fy:exp.carriedFy, svc:o.svc, pmo:o.pmo, pmoFull:o.pmoFull, ttl:o.ttl, ev:o.ev, v:o.v, plan:o.plan, ob:o.ob })).sort(byTtl);
    const countsHere = exp.carriedFy && (S.fys == null || S.fys.includes(exp.carriedFy));
    if (countsHere) {
      check(`${tag} · B ownership · flowCalc carried rows keep appropriation, effective FY, service, office, requirement, amount`,
        carriedRows, ownExpectedRows, K);
      if (P) check(`${tag} · B ownership · panel drill lists each carried row with its own appropriation, PMO, service, amount`,
        carriedPanel, carriedExpected.map(([, o]) => o.panel).sort(byTtl), K);
      if (B) check(`${tag} · B ownership · export detail lists each carried row with its own appropriation, PMO, service, amount`,
        carriedXlsx, carriedExpected.map(([, o]) => o.xlsx).sort(byTtl), K);
    } else {
      // the carried rows belong to a year this scope does not select: they must not be here (R1)
      check(`${tag} · carried rows not counted in a scope without their effective year`, carriedRows, [], 'control');
    }
    if (exp.uncounted && K === 'defect') {
      check(`${tag} · the uncounted carried amount is disclosed on the panel (any of ${uncAmts.map(a => a.toLocaleString('en-US')).join(' / ')})`,
        discPanel.length > 0 || carriedRows.length === carriedExpected.length, true, 'defect');
      if (B) check(`${tag} · the uncounted carried amount is disclosed in the export`,
        discXlsx.length > 0 || carriedXlsx.length === carriedExpected.length, true, 'defect');
    }
    if (S.fys && S.fys.length) check(`${tag} · the explicit year selection is honoured (flowSelYears)`, F.selYears, S.fys,
      K === 'defect' ? 'defect' : 'control');

    scopes[S.key] = { fys: S.fys, aps: S.aps, kind: K, note: S.note || '', expected: exp,
      flow: { selYears: F.selYears, selAppns: F.selAppns, label: F.label, tot: F.tot, grand: F.grand, execV: F.execV, planV: F.planV,
              appn: F.appn, execYs: F.execYs, planYs: F.planYs, mixYs: F.mixYs, pseudo: F.pseudo, nRows: F.nRows, rows: F.rows },
      carried: { flowRows: carriedRows, panelDrill: carriedPanel, exportDetail: carriedXlsx,
                 titleOnPanel: carriedAnywhereInPanel, titleInExport: carriedAnywhereInXlsx,
                 amountDisclosedOnPanel: discPanel, amountDisclosedInExport: discXlsx },
      panel: P && { total: P.total, executedStated: P.executedStated, plannedStated: P.plannedStated, showing: P.showing,
                    boxes: P.boxes, allYearsChip: P.allYears, yearButtons: P.yearButtons, pseudoChip: P.pseudoChip,
                    drillRows: P.drillRows, text: P.text },
      export: B && { sheets: B.sheets, scope: B.scope, notes: B.notes, totalFunding: B.totalFunding, usServiceFunding: B.usServiceFunding,
                     usServiceAppropriations: B.usServiceAppropriations, appnLines: B.appnLines,
                     primeDetail: B.primeDetail, ogcDetail: B.ogcDetail, fundsFlowSheet: B.book['Funds Flow'] } };
  }
  // every offered year alone: where do the carried dollars land, and do the single years add up to ALL YEARS?
  const sweep = get(`(function(){ var o=[]; flowYears().forEach(function(y){ flowCfg().fys=[y]; flowCfg().aps=null; var F=flowCalc(), rows=F.prime.LM.rows.concat(F.prime.PW.rows);
      F.ext.keys.forEach(function(k){ rows=rows.concat(F.ext.by[k].rows); });
      o.push({fy:y, tot:F.tot, execV:F.execV, planV:F.planV, carried:rows.filter(function(r){ return ${JSON.stringify(CARRIED_TITLES)}.indexOf(r.ttl)>=0; }).map(function(r){ return [r.ap,r.fy,r.v]; })}); });
    flowCfg().fys=null; return o; })()`);
  const allTot = get(`(function(){ flowCfg().fys=null; flowCfg().aps=null; return flowCalc().tot; })()`);
  check(`${C.id} · the offered years one at a time add up to the ALL YEARS total`, sweep.reduce((t, s) => t + s.tot, 0), allTot, 'control');
  const carriedSum = sweep.reduce((t, s) => t + s.carried.reduce((u, c) => u + c[2], 0), 0);
  const carriedExpectedSum = C.rows.filter(k => OWN[k]).reduce((t, k) => t + OWN[k].v, 0);
  check(`${C.id} · across the offered years, every carried dollar is counted exactly once (literal ${carriedExpectedSum.toLocaleString('en-US')})`,
    carriedSum, carriedExpectedSum, C.kind);
  // the internal single-year entry (flowCalc(fy), what the checks and older callers pass) for the carry target
  const internal26 = get(`(function(){ var F=flowCalc(2026); return {tot:F.tot, execV:F.execV, planV:F.planV, appn:F.appn, label:F.label}; })()`);
  check(`${C.id} · source rows untouched by the reads and the export`, get('EXDB.all'), rawBefore, 'control');
  check(`${C.id} · no jsdom script errors`, X.errors, [], 'control');
  bootRelease(0);
  return { id: C.id, kind: C.kind, what: C.what, base: C.base, rule: C.on, rows: C.rows.map(k => ({ key: k, ...ROWS[k] })),
    env, planRecs, scopes, perOfferedYear: sweep, internalFlowCalc2026: internal26, ms: Date.now() - t0 };
}

const t0 = Date.now();
const cases = [];
for (const C of CASES) cases.push(await runCase(C));
const timings = cases.map(c => ({ id: c.id, ms: c.ms }));
cases.forEach(c => delete c.ms);              // results are timing-free so two runs compare byte for byte
const summary = {
  board: boardLabel, boardPath, boardBlob, bootBlob, shimBlob, probeBlob,
  evidenceKind: 'fresh whole-board jsdom synthetic runtime, one board per case',
  runtimeStubs: ['Node TextEncoder/Decoder installed into jsdom windows (runtime-encoding-shim.mjs)',
    'boot.mjs standard alert/confirm/prompt/download stubs; download Blob captured as the money probe does'],
  independentExpected: 'literal whole-dollar fixture sums written in the probe; no ORBIT helper used for expectations',
  fixture: { planItem: PLAN_ITEM, rows: ROWS, ownership: OWN, expected: E, offered: OFFER },
  cases, results,
  passed: results.filter(r => r.status === 'passed').length,
  failed: results.filter(r => r.status === 'failed').length,
  failedByKind: ['defect','control','fixture'].reduce((o, k) => (o[k] = results.filter(r => r.kind === k && r.status === 'failed').length, o), {}),
  passedByKind: ['defect','control','fixture'].reduce((o, k) => (o[k] = results.filter(r => r.kind === k && r.status === 'passed').length, o), {}),
};
writeFileSync(outPath, JSON.stringify(summary, null, 2) + '\n');
results.filter(r => r.status === 'failed').forEach(r => console.log('FAIL', r.kind, '|', r.name, '| expected', JSON.stringify(r.expected), '| actual', JSON.stringify(r.actual)));
console.log(JSON.stringify({ board: boardLabel, boardBlob, passed: summary.passed, failed: summary.failed,
  failedByKind: summary.failedByKind, passedByKind: summary.passedByKind, timings, totalMs: Date.now() - t0 }));
bootRelease(0);
// exit 0 = the probe ran to the end; the defect checks are expected to fail on a board with the omission.
// exit 3 = a CONTROL or FIXTURE check failed (the reproduction itself is not trustworthy).
process.exit(summary.failedByKind.control || summary.failedByKind.fixture ? 3 : 0);
