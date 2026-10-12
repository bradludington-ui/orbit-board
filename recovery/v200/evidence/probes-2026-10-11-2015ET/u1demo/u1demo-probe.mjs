// u1demo-probe.mjs -- bounded, synthetic DEMONSTRATION of U1 on the ORBIT funds flow (read-only on the product).
//
//   usage: node u1demo-probe.mjs <copyRoot> <outJson> <boardLabel>
//
// <copyRoot> is a copy of a board tree (prioritization-board-grid.html, tools/, package.json, node_modules symlink,
// runtime-encoding-shim.mjs). BOARD is unset; boot.mjs must resolve to <copyRoot>/prioritization-board-grid.html (asserted).
//
// Brad: "genuine own FY26 plan $300 plus other-appropriation carried execution $100 gives $400 when both are selected;
// own-only gives $300; other-only gives $100. Removing the genuine own plan must leave only $100, without a cloned budget
// appearing. Preserve saved FY25-only selections."
//
// EVERY EXPECTED VALUE BELOW IS LITERAL ARITHMETIC OF THE FIXTURE AMOUNTS, WRITTEN BY HAND. No ORBIT helper computes an
// expectation; board helpers are only READ for observed values.
//
// The fixture is run at K=1 (the literal whole-dollar amounts: $500, $300, $100, $40) and at K=1,000,000 (the same fixture in
// millions) because the panel prints money as $M to two decimals (fM2), so at K=1 every panel figure reads "$0.00M" and
// cannot be checked; the panel checks are made at K=1,000,000 and only RECORDED at K=1.
// The genuine own FY26 plan is built two ways and both are run: PRODUCT (switchYear(2026) with window.confirm answering
// false -> freshYearState(), restoreReq('F1') from the Removed list, bmSetBase('disc',0,'<300>'), switchYear(2027)) and
// STATE (audit-recon R1's block: a JSON copy of S with st.bm={disc:[300],mand:[0],adds:[]}, st.discSvc=[300]).
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(process.argv[2] || '.');
const outPath = resolve(process.argv[3] || 'u1demo-results.json');
const boardLabel = process.argv[4] || '';
delete process.env.BOARD;
delete process.env.MUT_FIRST_FAIL;
await import(pathToFileURL(root + '/runtime-encoding-shim.mjs').href);
const { boot, seed, bootRelease, BOARD } = await import(pathToFileURL(root + '/tools/export-audit/boot.mjs').href);

const blobOf = buf => createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
const boardPath = root + '/prioritization-board-grid.html';
if (resolve(BOARD) !== boardPath) throw new Error(`boot.mjs BOARD is ${BOARD}, not ${boardPath}`);
const ident = {
  boardLabel, boardPath, bootBOARD: BOARD,
  boardBlob: blobOf(readFileSync(boardPath)),
  bootBlob: blobOf(readFileSync(root + '/tools/export-audit/boot.mjs')),
  shimBlob: blobOf(readFileSync(root + '/runtime-encoding-shim.mjs')),
  probeBlob: blobOf(readFileSync(new URL(import.meta.url))),
};

const J = JSON.stringify;
const TITLE_SP = 'Synthetic carried spares requirement';
const TITLE_OM = 'Synthetic ordinary FY25 O&M requirement';
// ---------------------------------------------------------------------------------------------- the fixture (literal)
// One service USAF; one O&M requirement F1 asking 1000 (more than any pot). Plan window FY27-FY31 (MS.base 2027, MS.cur 2027).
// FY27 pot 500. Genuine own FY26 plan pot 300. Workbook: Initial Spares FY2025 'USAF Spares Initial Mandatory PSM' 100 (the
// default OBBBA rule, token 'OBBBA, Mandatory', FY2025 -> FY2026, col 4, counts it in FY26); O&M FY2025 'USAF O&M
// Discretionary' 40 (ordinary, counts in FY25). No row is filed under FY2026. The carryover rule is on.
const fixture = K => {
  const item = { id: 'F1', grp: 'PSM', team: 'PSM', sect: '', custom: false, title: 'Synthetic planned requirement',
    event: 'Synthetic planned event', ccar: 'SYN-F1', fy26: [0], ask: [1000 * K], alloc: null };
  const row = (fy, title, budget, amt, office) => { const r = Array(32).fill(''); r[0] = fy; r[1] = fy + '-03'; r[2] = 'SYN-EXEC';
    r[3] = title; r[4] = budget; r[7] = 'Event ' + title; r[9] = amt; r[10] = 'Allocated'; r[18] = office; return r; };
  const ALL = {
    sp: { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: [row(2025, TITLE_SP, 'USAF Spares Initial Mandatory PSM', 100 * K, 'Program (ATL)')] } },
    om: { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: [row(2025, TITLE_OM, 'USAF O&M Discretionary', 40 * K, 'Program (TSS)')] } },
  };
  return { K, item, ALL, pot27: 500 * K, plan26: 300 * K };
};
// ---------------------------------------------------------------------------------------------- expected (hand-written)
const z4 = { om: 0, ff: 0, sp: 0, opn: 0 };
const EXP = K => ({
  offered: [2025, 2026, 2027, 2028, 2029, 2030, 2031],         // FY25 (workbook), FY26 (a row counts in it), FY27-FY31 (window)
  // with the genuine own FY26 plan
  c1: { fys: [2026], aps: ['om', 'sp'], tot: (300 + 100) * K, exec: 100 * K, plan: 300 * K, appn: { ...z4, om: 300 * K, sp: 100 * K },
        panelTotal: K === 1e6 ? '400.00' : null, mixBox: true, note: true,
        xl: { tot: [(300 + 100) * K, (300 + 100) * K], us: [(300 + 100) * K], om: [300 * K], sp: [100 * K] } },
  c2: { fys: [2026], aps: ['om'], tot: 300 * K, exec: 0, plan: 300 * K, appn: { ...z4, om: 300 * K },
        panelTotal: K === 1e6 ? '300.00' : null, mixBox: false, note: false, xl: { tot: [300 * K, 300 * K], us: [300 * K], om: [300 * K] } },
  c3: { fys: [2026], aps: ['sp'], tot: 100 * K, exec: 100 * K, plan: 0, appn: { ...z4, sp: 100 * K },
        panelTotal: K === 1e6 ? '100.00' : null, mixBox: false, note: false, xl: { tot: [100 * K, 100 * K], us: [100 * K], sp: [100 * K] } },
  // the genuine own FY26 plan removed
  c4a: { fys: [2026], aps: ['om', 'sp'], tot: 100 * K, exec: 100 * K, plan: 0, appn: { ...z4, sp: 100 * K },
         panelTotal: K === 1e6 ? '100.00' : null, mixBox: false, note: false, xl: { tot: [100 * K, 100 * K], us: [100 * K], om: [0], sp: [100 * K] } },
  c4b: { fys: [2026], aps: ['om'], tot: 0, exec: 0, plan: 0, appn: { ...z4 },
         panelTotal: K === 1e6 ? '0.00' : null, mixBox: false, note: false, xl: { tot: [0, 0], us: [0], om: [0] } },
  c4c: { fys: [2026], aps: ['sp'], tot: 100 * K, exec: 100 * K, plan: 0, appn: { ...z4, sp: 100 * K },
         panelTotal: K === 1e6 ? '100.00' : null, mixBox: false, note: false, xl: { tot: [100 * K, 100 * K], us: [100 * K], sp: [100 * K] } },
  c5: { saved: [2025], sel: [2025], tot: 40 * K, exec: 40 * K, plan: 0, label: 'FY25 · all appropriations',
        chipsOn: ['FY25 [on]'], scope: 'Scope: FY25 · all appropriations', xlTot: [40 * K, 40 * K] },
  c6with: { tot: (40 + 100 + 300 + 500) * K, exec: (40 + 100) * K, plan: (300 + 500) * K },
  c6without: { tot: (40 + 100 + 500) * K, exec: (40 + 100) * K, plan: 500 * K },
  pot27: 500 * K,
});
const APPN_LABEL = { om: 'O&M', ff: 'FULL FUND', sp: 'INITIAL SPARES', opn: 'OPN' };

// ---------------------------------------------------------------------------------------------- recorders
const results = [];
const check = (scn, id, name, actual, expected, kind) => {
  const ok = J(actual) === J(expected);
  results.push({ scenario: scn, id, name, kind, expected, actual, status: ok ? 'passed' : 'failed' });
  return ok;
};
const note = (scn, id, name, actual) => results.push({ scenario: scn, id, name, kind: 'recorded', actual, status: 'recorded' });

const label = v => String(v && typeof v === 'object' ? v.v : v ?? '');
const val = v => (v && typeof v === 'object' && 'v' in v) ? v.v : v;

// a counting confirm installed in a board window; `ans` is what it answers
const installConfirm = (w, ans) => { w.__cc = 0; w.__ccMsgs = []; w.__ccAns = ans;
  w.confirm = function (m) { w.__cc++; w.__ccMsgs.push(String(m).slice(0, 120)); return w.__ccAns; }; };
const ccOf = w => ({ n: w.__cc, msgs: w.__ccMsgs.slice() });

const getter = X => expr => JSON.parse(X.ev(`JSON.stringify(${expr})`));
const yrsState = X => getter(X)(`(function(){ var o={}; Object.keys(MS.years).forEach(function(y){ var st=MS.years[y];
  o[y]=st? {disc:(st.bm&&st.bm.disc)||null, discSvc:st.discSvc||null, order:st.order||null, removed:st.removed||null,
            same27:(st===MS.years[2027]&&+y!==2027)} : st; }); return {cur:MS.cur, base:MS.base, keys:Object.keys(MS.years).map(Number), y:o,
  has2026:(2026 in MS.years), v2026:(MS.years[2026]===undefined? 'undefined' : 'defined')}; })()`);
const planRecs = (X, fy) => getter(X)(`flowPlanRecs(${fy},'om').map(function(r){ return [r.svc, r.v, r.ttl, r.fy]; })`);

const readFlow = (X, fys, aps) => getter(X)(`(function(){ flowCfg().fys=${J(fys)}; flowCfg().aps=${J(aps)}; flowSel=''; var F=flowCalc(),
    rows=F.prime.LM.rows.concat(F.prime.PW.rows); F.ext.keys.forEach(function(k){ rows=rows.concat(F.ext.by[k].rows); });
    return {selYears:flowSelYears(), selAppns:flowSelAppns(), label:F.label, tot:F.tot, grand:F.grand, us:F.us, execV:F.execV, planV:F.planV,
      appn:F.appn, execYs:F.execYs, planYs:F.planYs, mixYs:F.mixYs,
      rows:rows.map(function(r){ return [r.ttl, r.ap, r.fy, r.svc, r.v, !!r.plan]; }).sort()}; })()`);

const readPanel = X => {
  X.ev(`flowOpen=true; flowSel=''; flowBody(); 'ok'`);
  const body = X.w.document.getElementById('flowBody');
  const text = body.textContent;
  const buttons = [...body.querySelectorAll('button')].map(b => ({ text: b.textContent, title: b.getAttribute('title') || '',
    on: b.classList.contains('on'), onclick: b.getAttribute('onclick') || '' }));
  const yearChips = buttons.filter(b => /^flowToggleYear\(\d+\)$/.test(b.onclick))
    .map(b => ({ fy: +/\d+/.exec(b.onclick)[0], text: b.text, title: b.title, on: b.on }));
  const allYears = buttons.filter(b => b.onclick === 'flowAllYears()').map(b => ({ text: b.text, on: b.on }))[0] || null;
  const tf = /total funding \$([\d,]+\.\d\d)M/.exec(text);
  const mix = body.querySelector('.flowmix');
  const boxes = [...body.querySelectorAll('div')].filter(d => /PLANNED, not executed|Planned and executed money in one total|This total holds/.test(d.textContent)
    && !d.querySelector('div')).map(d => d.textContent);
  const showing = (/Showing [^\n]*?total funding \$[\d,]+\.\d\dM/.exec(text) || [''])[0];
  const moneyM = [...text.matchAll(/\$([\d,]+\.\d\d)M/g)].map(m => m[1]);
  return { total: tf ? tf[1] : null, mix: mix ? mix.textContent : null, boxes, showing, yearChips, allYears,
    chipsOn: yearChips.filter(c => c.on).map(c => c.text + ' [on]'), moneyM, text };
};

const readExport = async X => {
  const book = JSON.parse(await X.w.eval(`(async function(){ var cap=null, orig=window.Blob;
    window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new orig(p,o); };
    try { exportFlow(); } finally { window.Blob=orig; }
    if(!cap) throw Error('no workbook emitted');
    var ab=cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength);
    return JSON.stringify(await xlsxRead(ab)); })()`));
  const ff = book['Funds Flow'] || [];
  const by = l => ff.filter(r => label(r[0]) === l).map(r => val(r[1])).filter(v => typeof v === 'number');
  const nums = Object.keys(book).flatMap(s => book[s].flatMap(r => r.map(val).filter(v => typeof v === 'number')));
  const detail = name => (book[name] || []).slice(1).map(r => r.map(val));
  return { sheets: Object.keys(book), scope: ff.map(r => label(r[0])).filter(s => /^Scope: /.test(s)),
    notes: ff.map(r => label(r[0])).filter(s => /^NOTE: /.test(s)),
    tot: by('TOTAL FUNDING'), us: by('US SERVICE FUNDING'),
    lines: Object.fromEntries(Object.entries(APPN_LABEL).map(([k, l]) => [k, by(l)])),
    detail: detail('Prime Detail').concat(detail('OGC Detail')), nums, fundsFlow: ff.map(r => r.map(val)) };
};

// ---------------------------------------------------------------------------------------------- one scenario
async function scenario(path, K) {
  const scn = `${boardLabel}|${path}|K=${K}`;
  const Fx = fixture(K), E = EXP(K);
  const out = { scenario: scn, path, K, steps: {}, reads: {} };
  const X = boot();
  const get = getter(X);
  seed(X.ev, { services: ['USAF'], items: [Fx.item], disc: [Fx.pot27], mand: [0], order: ['F1'] });
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.bm={disc:[${Fx.pot27}], mand:[0], adds:[]}; MS.base=2027; MS.cur=2027; FYMON=fyMonths(2027); MS.years={2027:S};
    applyState(S); MS.years[2027]=S;
    EXDB.all=${J(Fx.ALL)}; EXDB.ts=1;
    var C=flowCfg(); C.pseudo={on:true, label:'OBBBA', token:'OBBBA, Mandatory', from:2025, to:2026, col:4}; C.other={}; C.fys=null; C.aps=null;
    save(); 'ok'`);
  // ---- build the genuine own FY26 plan
  if (path === 'product') {
    installConfirm(X.w, false);                                  // the switchYear question answered Cancel -> BLANK year
    X.ev(`switchYear(2026); 'ok'`);
    out.steps.afterSwitch2026 = { ms: yrsState(X), confirm: ccOf(X.w), curBm: get('S.bm'), curOrder: get('S.order'), curRemoved: get('S.removed') };
    if (out.steps.afterSwitch2026.curRemoved.indexOf('F1') >= 0) X.ev(`restoreReq('F1'); 'ok'`);
    out.steps.afterRestore = { order: get('S.order'), removed: get('S.removed') };
    X.ev(`bmSetBase('disc', 0, ${J(String(Fx.plan26))}); 'ok'`);
    out.steps.afterBudget = { bm: get('S.bm'), discSvc: get('S.discSvc'), cur: get('MS.cur') };
    X.ev(`switchYear(2027); 'ok'`);
    out.steps.afterSwitch2027 = { ms: yrsState(X), confirm: ccOf(X.w) };
    check(scn, 'fixture', 'product path: switchYear asked window.confirm exactly once (FY26 has no data yet) and was answered Cancel',
      [out.steps.afterSwitch2027.confirm.n, /^FY26 has no data yet/.test(out.steps.afterSwitch2027.confirm.msgs[0] || '')], [1, true], 'fixture');
  } else {
    X.ev(`var st=JSON.parse(JSON.stringify(S)); st.bm={disc:[${Fx.plan26}], mand:[0], adds:[]}; st.discSvc=[${Fx.plan26}]; MS.years[2026]=st;
      applyState(MS.years[2027]); MS.years[2027]=S; save(); 'ok'`);
  }
  // ---- fixture checks (all literal)
  const env = get(`{slug:mySlug(), base:MS.base, cur:MS.cur, d27:MS.years[2027].bm.disc, d26:MS.years[2026].bm.disc, s26:MS.years[2026].discSvc,
    distinct:MS.years[2026]!==MS.years[2027], ord26:MS.years[2026].order, ps:[flowPseudo().on, flowPseudo().token, flowPseudo().from, flowPseudo().to, flowPseudo().col]}`);
  out.env = env;
  check(scn, 'fixture', 'O&M board, plan window from FY27, FY27 pot 500, FY26 pot 300 in its own year object, F1 on FY26, rule on FY2025->FY2026 col 4',
    env, { slug: 'om', base: 2027, cur: 2027, d27: [500 * K], d26: [300 * K], s26: [300 * K], distinct: true, ord26: ['F1'],
      ps: [true, 'OBBBA, Mandatory', 2025, 2026, 4] }, 'fixture');
  check(scn, 'fixture', 'flowPlanRecs(2026,"om") is USAF 300 on F1 (the genuine own plan); flowPlanRecs(2027,"om") is USAF 500',
    [planRecs(X, 2026), planRecs(X, 2027)],
    [[['USAF', 300 * K, 'Synthetic planned requirement', 2026]], [['USAF', 500 * K, 'Synthetic planned requirement', 2027]]], 'fixture');
  check(scn, 'fixture', 'no workbook row is filed under FY2026; the workbook years are FY2025 only',
    get('flowExecYears(null, true)'), [2025], 'fixture');
  // reads from here on: window.confirm answers OK (boot's default -- the ROLL-FORWARD COPY, the worst case) and is counted
  installConfirm(X.w, true);
  const rawJ = J(Fx.ALL);
  check(scn, 'c7', 'EXDB.all is the fixture as built (before any read)', X.ev('JSON.stringify(EXDB.all)') === rawJ, true, 'control');

  // ---- check 1-3: the genuine own FY26 plan present
  check(scn, 'c1', 'flowYears() offers FY25, FY26 and the window FY27-FY31', get('flowYears()'), E.offered, 'contract');
  const fy26Kinds = async (key) => {
    const e = E[key];
    const F = readFlow(X, e.fys, e.aps);
    const P = readPanel(X);
    const B = await readExport(X);
    const ms26 = yrsState(X).v2026;
    out.reads[key] = { flow: F, panel: { total: P.total, mix: P.mix, boxes: P.boxes, showing: P.showing, chipsOn: P.chipsOn, yearChips: P.yearChips,
      moneyM: P.moneyM }, export: { scope: B.scope, notes: B.notes, tot: B.tot, us: B.us, lines: B.lines, detail: B.detail, fundsFlow: B.fundsFlow },
      ms2026After: ms26 };
    check(scn, key, `selection honoured: years ${J(e.fys)} x appropriations ${J(e.aps)}`, [F.selYears, F.selAppns], [e.fys, e.aps], 'contract');
    check(scn, key, `flowCalc total ${e.tot} (executed ${e.exec}, planned ${e.plan})`, [F.tot, F.execV, F.planV], [e.tot, e.exec, e.plan], 'contract');
    check(scn, key, 'flowCalc per appropriation', F.appn, e.appn, 'contract');
    if (e.panelTotal != null) check(scn, key, `panel total funding $${e.panelTotal}M`, P.total, e.panelTotal, 'contract');
    else note(scn, key, 'panel total funding (K=1: the panel prints $M to 2 decimals, so not checkable)', P.total);
    check(scn, key, `planned-and-executed box (.flowmix) ${e.mixBox ? 'present' : 'absent'}`, P.mix != null, e.mixBox, 'contract');
    if (e.mixBox && K === 1e6) check(scn, key, 'the box states $100.00M executed, $300.00M planned', /\$100\.00M executed, \$300\.00M planned\.$/.test(P.mix || ''), true, 'contract');
    check(scn, key, `export TOTAL FUNDING twice = ${e.xl.tot[0]}; US SERVICE FUNDING = ${e.xl.us[0]}`, [B.tot, B.us], [e.xl.tot, e.xl.us], 'contract');
    const lines = {}; Object.keys(e.xl).filter(k => APPN_LABEL[k]).forEach(k => { lines[k] = B.lines[k]; });
    const wantL = {}; Object.keys(e.xl).filter(k => APPN_LABEL[k]).forEach(k => { wantL[k] = e.xl[k]; });
    check(scn, key, 'export appropriation lines', lines, wantL, 'contract');
    check(scn, key, `export NOTE "planned and executed money in one total" ${e.note ? 'present' : 'absent'}`,
      B.notes.some(t => t.startsWith('NOTE: planned and executed money in one total')), e.note, 'contract');
    note(scn, key, 'scope label (flowCalc) / export Scope row', [F.label, B.scope]);
    note(scn, key, 'panel boxes text', P.boxes);
    return { F, P, B };
  };
  await fy26Kinds('c1'); await fy26Kinds('c2'); await fy26Kinds('c3');
  check(scn, 'c1-3', 'the reads left the genuine FY26 plan as it was (pot 300, its own object) and FY27 at 500',
    get(`[MS.years[2026].bm.disc, MS.years[2027].bm.disc, MS.years[2026]!==MS.years[2027]]`), [[300 * K], [500 * K], true], 'control');

  // ---- check 6 (with the plan): ALL YEARS
  const A1 = readFlow(X, null, null);
  const A1x = await readExport(X);
  out.reads.c6with = { flow: A1, exportTot: A1x.tot, scope: A1x.scope,
    perYear: get(`(function(){ var o=[]; flowYears().forEach(function(y){ flowCfg().fys=[y]; flowCfg().aps=null; var F=flowCalc(); o.push([y, F.tot, F.execV, F.planV]); }); flowCfg().fys=null; return o; })()`) };
  check(scn, 'c6', `ALL YEARS with the FY26 plan = 40 + 100 + 300 + 500 = ${E.c6with.tot} (executed ${E.c6with.exec}, planned ${E.c6with.plan}); export TOTAL FUNDING twice`,
    [A1.tot, A1.execV, A1.planV, A1x.tot], [E.c6with.tot, E.c6with.exec, E.c6with.plan, [E.c6with.tot, E.c6with.tot]], 'contract');

  // ---- check 5 (with the plan): saved FY25 only, reopened
  const savedFY25 = async (tag) => {
    X.ev(`flowCfg().fys=[2025]; flowCfg().aps=null; flowSel=''; save(); 'ok'`);
    const R = boot({ html: X.ev('buildSavedHtml()') });
    installConfirm(R.w, true);
    const g = getter(R);
    const saved = g(`flowCfg().fys`);
    const F = g(`(function(){ var F=flowCalc(), rows=F.prime.LM.rows.concat(F.prime.PW.rows); F.ext.keys.forEach(function(k){ rows=rows.concat(F.ext.by[k].rows); });
      return {sel:flowSelYears(), tot:F.tot, execV:F.execV, planV:F.planV, label:F.label, rows:rows.map(function(r){ return [r.ttl, r.ap, r.fy, r.v]; })}; })()`);
    const P = readPanel(R);
    const B = await readExport(R);
    const ms = yrsState(R);
    const raw = R.ev('JSON.stringify(EXDB.all)') === rawJ;
    out.reads[tag] = { saved, flow: F, panel: { total: P.total, chipsOn: P.chipsOn, yearChips: P.yearChips }, export: { scope: B.scope, tot: B.tot, notes: B.notes }, ms, confirm: ccOf(R.w), errors: R.errors.slice() };
    check(scn, 'c5', `${tag}: saved [2025], selection [2025], total 40 (the O&M ordinary row), label "FY25 · all appropriations"`,
      [saved, F.sel, F.tot, F.execV, F.planV, F.label], [E.c5.saved, E.c5.sel, E.c5.tot, E.c5.exec, E.c5.plan, E.c5.label], 'control');
    check(scn, 'c5', `${tag}: the carried 100 is not in it (no ${TITLE_SP} row)`, F.rows.filter(r => r[0] === TITLE_SP), [], 'control');
    check(scn, 'c5', `${tag}: only the FY25 chip is on; export scope FY25, TOTAL FUNDING 40 twice`, [P.chipsOn, B.scope, B.tot], [E.c5.chipsOn, [E.c5.scope], E.c5.xlTot], 'control');
    check(scn, 'c7', `${tag}: reopened copy EXDB.all byte-identical, no jsdom errors, window.confirm not called`, [raw, R.errors, R.w.__cc], [true, [], 0], 'control');
    bootRelease(0, [X.w]);   // close the reopened copy only
    return { ms };
  };
  const s5a = await savedFY25('c5-with-plan');
  check(scn, 'c5', 'c5-with-plan: the reopened copy still holds the genuine FY26 plan (pot 300)', s5a.ms.y['2026'] && s5a.ms.y['2026'].disc, [300 * K], 'control');

  // ---- check 4: REMOVE the genuine own FY26 plan
  X.ev(`delete MS.years[2026]; flowCfg().fys=null; flowCfg().aps=null; save(); 'ok'`);
  X.w.__cc = 0; X.w.__ccMsgs = [];
  check(scn, 'c4', 'after delete MS.years[2026] + save(): MS.years[2026] undefined', yrsState(X).v2026, 'undefined', 'fixture');
  const noClone = async (B, tagBase) => {
    const g = getter(B);
    const seq = [];
    const rec = {};
    for (const key of ['c4a', 'c4b', 'c4c']) {
      const e = E[key];
      const F = readFlow(B, e.fys, e.aps); seq.push(['flowCalc ' + key, yrsState(B).v2026]);
      const P = readPanel(B); seq.push(['panel ' + key, yrsState(B).v2026]);
      const Bx = await readExport(B); seq.push(['exportFlow ' + key, yrsState(B).v2026]);
      const tag = `${tagBase}:${key}`;
      rec[key] = { flow: F, panel: { total: P.total, mix: P.mix, boxes: P.boxes, showing: P.showing, chipsOn: P.chipsOn, yearChips: P.yearChips, moneyM: P.moneyM },
        export: { scope: Bx.scope, notes: Bx.notes, tot: Bx.tot, us: Bx.us, lines: Bx.lines, detail: Bx.detail, fundsFlow: Bx.fundsFlow } };
      check(scn, key, `${tag}: selection honoured ${J(e.fys)} x ${J(e.aps)}`, [F.selYears, F.selAppns], [e.fys, e.aps], 'contract');
      check(scn, key, `${tag}: flowCalc total ${e.tot} (executed ${e.exec}, planned ${e.plan})`, [F.tot, F.execV, F.planV], [e.tot, e.exec, e.plan], 'contract');
      check(scn, key, `${tag}: flowCalc per appropriation`, F.appn, e.appn, 'contract');
      if (e.panelTotal != null) check(scn, key, `${tag}: panel total funding $${e.panelTotal}M`, P.total, e.panelTotal, 'contract');
      else note(scn, key, `${tag}: panel total funding (K=1, not checkable)`, P.total);
      check(scn, key, `${tag}: planned-and-executed box absent; NOTE absent`, [P.mix != null, Bx.notes.some(t => t.startsWith('NOTE: planned and executed money in one total'))], [false, false], 'contract');
      check(scn, key, `${tag}: export TOTAL FUNDING twice / US SERVICE FUNDING`, [Bx.tot, Bx.us], [e.xl.tot, e.xl.us], 'contract');
      const lines = {}, wantL = {}; Object.keys(e.xl).filter(k => APPN_LABEL[k]).forEach(k => { lines[k] = Bx.lines[k]; wantL[k] = e.xl[k]; });
      check(scn, key, `${tag}: export appropriation lines`, lines, wantL, 'contract');
      // NO FY26 FIGURE EQUALS FY27'S POT (500): the calculation's figures, every number in the export, the panel's $M figures
      const calcNums = [F.tot, F.grand, F.us, F.execV, F.planV].concat(Object.values(F.appn)).concat(F.rows.map(r => r[4]));
      const panel500 = K === 1e6 ? P.moneyM.filter(m => m === '500.00') : [];
      check(scn, key, `${tag}: no FY26 figure equals ${E.pot27} (FY27's pot) -- flowCalc, export cells${K === 1e6 ? ', panel $M figures' : ''}`,
        [calcNums.filter(v => v === E.pot27), Bx.nums.filter(v => v === E.pot27), panel500], [[], [], []], 'contract');
      check(scn, key, `${tag}: no FY26 plan row (no row with plan=true)`, F.rows.filter(r => r[5]), [], 'contract');
      note(scn, key, `${tag}: scope label / export Scope row`, [F.label, Bx.scope]);
      note(scn, key, `${tag}: panel boxes text`, P.boxes);
    }
    check(scn, 'c4', `${tagBase}: MS.years[2026] stays undefined after flowCalc, the panel render and exportFlow (each step)`,
      seq.map(s => s[1]), seq.map(() => 'undefined'), 'contract');
    check(scn, 'c4', `${tagBase}: flowPlanRecs(2026,"om") is empty, and MS.years[2026] still undefined after asking`, [planRecs(B, 2026), yrsState(B).v2026], [[], 'undefined'], 'contract');
    check(scn, 'c4', `${tagBase}: window.confirm never called by these reads`, B.w.__cc, 0, 'contract');
    // the FY26 chip after removal
    B.ev(`flowCfg().fys=null; flowCfg().aps=null; 'ok'`);
    const Pc = readPanel(B);
    const chip26 = Pc.yearChips.filter(c => c.fy === 2026)[0] || null;
    note(scn, 'c4', `${tagBase}: FY26 chip text and tooltip after removal`, chip26);
    rec.chip26 = chip26; rec.seq = seq; rec.yearChips = Pc.yearChips;
    return rec;
  };
  out.reads.c4 = await noClone(X, 'c4-board');
  // ---- check 6 (without the plan): ALL YEARS
  const A2 = readFlow(X, null, null);
  const A2x = await readExport(X);
  out.reads.c6without = { flow: A2, exportTot: A2x.tot, scope: A2x.scope, ms2026: yrsState(X).v2026,
    perYear: get(`(function(){ var o=[]; flowYears().forEach(function(y){ flowCfg().fys=[y]; flowCfg().aps=null; var F=flowCalc(); o.push([y, F.tot, F.execV, F.planV]); }); flowCfg().fys=null; return o; })()`) };
  check(scn, 'c6', `ALL YEARS without the FY26 plan = 40 + 100 + 500 = ${E.c6without.tot} (executed ${E.c6without.exec}, planned ${E.c6without.plan}); export TOTAL FUNDING twice; MS.years[2026] still undefined`,
    [A2.tot, A2.execV, A2.planV, A2x.tot, yrsState(X).v2026], [E.c6without.tot, E.c6without.exec, E.c6without.plan, [E.c6without.tot, E.c6without.tot], 'undefined'], 'contract');
  // ---- check 4 on a copy REOPENED from buildSavedHtml() after the removal
  X.ev(`flowCfg().fys=null; flowCfg().aps=null; save(); 'ok'`);
  const R4 = boot({ html: X.ev('buildSavedHtml()') });
  installConfirm(R4.w, true);
  check(scn, 'c4', 'reopened after removal: MS.years[2026] undefined on open', yrsState(R4).v2026, 'undefined', 'contract');
  out.reads.c4reopen = await noClone(R4, 'c4-reopened');
  check(scn, 'c7', 'c4-reopened: EXDB.all byte-identical; no jsdom errors', [R4.ev('JSON.stringify(EXDB.all)') === rawJ, R4.errors], [true, []], 'control');
  out.reads.c4reopenAllYears = readFlow(R4, null, null);
  check(scn, 'c6', 'c4-reopened: ALL YEARS = 40 + 100 + 500', [out.reads.c4reopenAllYears.tot, yrsState(R4).v2026], [E.c6without.tot, 'undefined'], 'contract');
  bootRelease(0, [X.w]);
  // ---- check 5 (after removal): saved FY25 only, reopened
  const s5b = await savedFY25('c5-after-removal');
  check(scn, 'c5', 'c5-after-removal: the reopened copy holds no FY26 year', s5b.ms.v2026, 'undefined', 'control');
  // ---- check 7 on the board itself
  check(scn, 'c7', 'board: EXDB.all byte-identical after every read; no jsdom errors; confirm not called since the fixture was built',
    [X.ev('JSON.stringify(EXDB.all)') === rawJ, X.errors, X.w.__cc], [true, [], 0], 'control');
  out.finalMs = yrsState(X);
  // ---- DETECTOR CONTROL: a cloned budget, when one IS made, is caught by the same detectors. switchYear(2026) answered OK
  // (the roll-forward copy of FY27) and back to FY27: FY26 is defined again and holds FY27's pot of 500.
  X.w.__cc = 0; X.w.__ccAns = true;
  X.ev(`switchYear(2026); switchYear(2027); 'ok'`);
  const cl = readFlow(X, [2026], ['om']);
  const clDet = { v2026: yrsState(X).v2026, d26: get('MS.years[2026] && MS.years[2026].bm.disc'), tot: cl.tot, planV: cl.planV,
    hits500: [cl.tot, cl.planV].filter(v => v === E.pot27).length, confirm: X.w.__cc };
  out.detectorControl = clDet;
  check(scn, 'detector', 'DETECTOR CONTROL — a roll-forward clone made on purpose IS seen by the state detectors: MS.years[2026] defined, its pot 500, confirm asked once',
    [clDet.v2026, clDet.d26, clDet.confirm], ['defined', [500 * K], 1], 'control');
  check(scn, 'detector', 'DETECTOR CONTROL (needs FY26 offered) — the clone shows in the money: FY26 x O&M = 500 planned, two figures equal 500',
    [clDet.tot, clDet.planV, clDet.hits500], [500 * K, 500 * K, 2], 'contract');
  bootRelease(0);
  return out;
}

const t0 = Date.now();
const scenarios = [];
for (const path of ['product', 'state']) for (const K of [1, 1e6]) {
  try { scenarios.push(await scenario(path, K)); }
  catch (e) { results.push({ scenario: `${boardLabel}|${path}|K=${K}`, id: 'harness', name: 'scenario threw', kind: 'control',
    expected: 'ran', actual: String((e && e.stack) || e).slice(0, 600), status: 'failed' }); bootRelease(0); }
}
// PRODUCT and STATE agree: the same observed figures (flowCalc, panel, export) for every read, at each K
const agree = [];
for (const K of [1, 1e6]) {
  const P = scenarios.find(s => s.path === 'product' && s.K === K), S = scenarios.find(s => s.path === 'state' && s.K === K);
  if (!P || !S) continue;
  const pick = o => o && { tot: o.flow && o.flow.tot, execV: o.flow && o.flow.execV, planV: o.flow && o.flow.planV, appn: o.flow && o.flow.appn,
    label: o.flow && o.flow.label, panel: o.panel && o.panel.total, mix: o.panel && o.panel.mix, xl: o.export && [o.export.tot, o.export.us, o.export.lines, o.export.notes, o.export.scope] };
  const keys = ['c1', 'c2', 'c3'];
  const pv = keys.map(k => pick(P.reads[k])).concat(['c4a', 'c4b', 'c4c'].map(k => pick(P.reads.c4[k])), ['c4a', 'c4b', 'c4c'].map(k => pick(P.reads.c4reopen[k])),
    [P.reads.c6with.flow.tot, P.reads.c6without.flow.tot]);
  const sv = keys.map(k => pick(S.reads[k])).concat(['c4a', 'c4b', 'c4c'].map(k => pick(S.reads.c4[k])), ['c4a', 'c4b', 'c4c'].map(k => pick(S.reads.c4reopen[k])),
    [S.reads.c6with.flow.tot, S.reads.c6without.flow.tot]);
  const ok = J(pv) === J(sv);
  agree.push({ K, ok });
  results.push({ scenario: `${boardLabel}|product=state|K=${K}`, id: 'agree', name: 'the product-built and state-built FY26 plans give identical observed figures on every read (flowCalc, panel, export) for checks 1-4 and 6',
    kind: 'control', expected: true, actual: ok, status: ok ? 'passed' : 'failed' });
}
const summary = {
  ...ident, evidenceKind: 'fresh whole-board jsdom synthetic runtime; one board per scenario plus reopened copies from buildSavedHtml()',
  independentExpected: 'literal whole-dollar fixture arithmetic written in this probe; no ORBIT helper used for expectations',
  expected: { K1: EXP(1), K1e6: EXP(1e6) }, scenarios, results, agree,
  passed: results.filter(r => r.status === 'passed').length, failed: results.filter(r => r.status === 'failed').length,
  recorded: results.filter(r => r.status === 'recorded').length,
  failedByKind: ['contract', 'control', 'fixture'].reduce((o, k) => (o[k] = results.filter(r => r.kind === k && r.status === 'failed').length, o), {}),
  passedByKind: ['contract', 'control', 'fixture'].reduce((o, k) => (o[k] = results.filter(r => r.kind === k && r.status === 'passed').length, o), {}),
};
writeFileSync(outPath, JSON.stringify(summary, null, 2) + '\n');
results.filter(r => r.status === 'failed').forEach(r => console.log('FAIL', r.kind, '|', r.scenario, '|', r.id, '|', r.name, '| expected', J(r.expected), '| actual', J(r.actual).slice(0, 400)));
console.log(J({ board: boardLabel, boardBlob: ident.boardBlob, passed: summary.passed, failed: summary.failed, recorded: summary.recorded,
  failedByKind: summary.failedByKind, passedByKind: summary.passedByKind, agree, totalMs: Date.now() - t0 }));
// exit 0 = ran to the end with every control and fixture check passing (contract checks may fail on a board without U1)
// exit 3 = a control or fixture check failed
process.exit(summary.failedByKind.control || summary.failedByKind.fixture ? 3 : 0);
