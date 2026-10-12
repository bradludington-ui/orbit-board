// Chunk-2 bounded checks in jsdom: KPI guard (forced throw, probe only), Add / PMO Import permissions, the PMO batch
// (all or nothing), genuine metadata, the Cycle control. Synthetic data at run time only.
import { boot, seed } from '/home/user/orbit-ui/tools/export-audit/boot.mjs';
import { readFileSync } from 'node:fs';
const NEW = readFileSync('/home/user/orbit-ui/prioritization-board-grid.html', 'utf8');
const BASE = readFileSync('/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk1/rv-base.html', 'utf8');
const R = {}; const fails = [];
const chk = (ok, label, extra) => { R[label] = ok ? 'PASS' : ('FAIL ' + (extra !== undefined ? JSON.stringify(extra).slice(0, 500) : '')); if (!ok) fails.push(label); return ok; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const MINE = ['USAF', 'ANG', 'AFRC'];
const PM = ['PSM', 'ATL', 'TSS', 'AV', 'MxS', 'LOG'];
const NAMES = ['Depot pod overhaul', 'Engine spares pool', 'Training system refresh', 'Avionics software drop', 'Maintenance data link', 'Logistics IT sustainment', 'Support equipment buy', 'Simulator concurrency', 'Field service reps', 'Repair network stand-up', 'Tech data update', 'Obsolescence redesign', 'Test equipment recal', 'Packaging & shipping'];
const items = NAMES.map((n, i) => ({ id: 'S' + String(i + 1).padStart(2, '0'), grp: PM[i % PM.length], team: PM[i % PM.length], sect: '', custom: false, title: 'Synthetic — ' + n, event: n, ccar: 'SYN-' + (100 + i), fy26: [0, 0, 0], ask: [(9 + (i * 7) % 23) * 1e6, (2 + (i * 3) % 7) * 1e6, (1 + (i * 5) % 4) * 1e6], alloc: null }));
const sc = { services: MINE, items, disc: [180e6, 40e6, 22e6], mand: [25e6, 6e6, 3e6], order: items.map(i => i.id) };
const mk = (html = NEW) => { const B = boot({ html }); B.ev('Date.now=function(){return 1790000000000;}; 1'); seed(B.ev, sc);
  B.ev('BASE_ITEMS.length=0; DATA.items.forEach(i=>{ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); S.bm={disc:S.discSvc,mand:S.mandSvc,adds:[]}; render(); 1'); return B; };
const payload = s => { const m = s.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/); return m ? m[1] : null; };
const ls = w => { const o = {}; for (let i = 0; i < w.localStorage.length; i++) { const k = w.localStorage.key(i); o[k] = w.localStorage.getItem(k); } return o; };

// ── 2. KPI guard ─────────────────────────────────────────────────────────────────────────────────────────────
await (async () => {
  const B = mk(), T = mk();
  const cards = X => JSON.parse(X.ev(`JSON.stringify([...document.querySelectorAll('#uiKpis .k .v')].map(e=>e.textContent))`));
  const before = cards(B);
  chk(before.join('|') === '$383,000,000|$242,000,000|$34,000,000|$107,000,000', 'kpi: seeded cards', before);
  // forced throw INSIDE card drawing (probe-only monkeypatch, nothing shipped)
  B.ev(`window.__keepCard=uiKpiCard; uiKpiCard=function(){ throw new Error('forced card failure (probe)'); }; 1`);
  B.ev(`S.discSvc=[150e6,40e6,22e6]; S.bm={disc:S.discSvc,mand:S.mandSvc,adds:[]}; render(); 1`);
  T.ev(`S.discSvc=[150e6,40e6,22e6]; S.bm={disc:S.discSvc,mand:S.mandSvc,adds:[]}; render(); 1`);
  const na = cards(B);
  chk(na.length === 4 && na.every(v => v === 'unavailable'), 'kpi: forced card error -> all four say unavailable', na);
  chk(!B.ev(`document.getElementById('uiKpis').textContent`).includes('$'), 'kpi: no dollar figure (stale or new) left on the cards');
  chk(B.errors.length === 0, 'kpi: no page error from the forced throw', B.errors);
  const rows = B.ev(`document.querySelectorAll('#list .row').length`);
  chk(rows === 14, 'kpi: render completed, 14 rows drawn', rows);
  const post = B.ev(`(document.querySelector('#posture').textContent.match(/Whole budget · \\$[\\d,]+ asked/)||[''])[0]`);
  chk(post === 'Whole budget · $383,000,000 asked', 'kpi: posture strip still drawn with the board figure', post);
  // editing still works: an allocation through the existing row editor path, then render
  B.ev(`uiSetMode('fund'); S.mc=S.mc||{}; S.mc['S03']=true; S.discSvc=[120e6,40e6,22e6]; S.bm={disc:S.discSvc,mand:S.mandSvc,adds:[]}; save(); render(); 1`);
  T.ev(`uiSetMode('fund'); S.mc=S.mc||{}; S.mc['S03']=true; S.discSvc=[120e6,40e6,22e6]; S.bm={disc:S.discSvc,mand:S.mandSvc,adds:[]}; save(); render(); 1`);
  const postB = B.ev(`document.querySelector('#posture').textContent`), postT = T.ev(`document.querySelector('#posture').textContent`);
  chk(postB === postT, 'kpi: posture after an edit equals the twin board without the forced error');
  const sB = payload(B.ev('buildSavedHtml()')), sT = payload(T.ev('buildSavedHtml()'));
  chk(sB && sB === sT, 'kpi: saved payload with the forced error == twin without it');
  const lB = ls(B.w), lT = ls(T.w);
  chk(JSON.stringify(Object.keys(lB).sort()) === JSON.stringify(Object.keys(lT).sort()), 'kpi: save() wrote the same storage keys as the twin', [Object.keys(lB), Object.keys(lT)]);
  // the throw escaping uiKpis entirely: scoreboard's guard
  B.ev(`uiKpiCard=window.__keepCard; window.__keepK=uiKpis; uiKpis=function(){ throw new Error('forced uiKpis failure (probe)'); }; render(); 1`);
  const na2 = cards(B);
  chk(na2.length === 4 && na2.every(v => v === 'unavailable'), 'kpi: throw escaping uiKpis -> scoreboard guard -> unavailable', na2);
  chk(B.ev(`document.querySelectorAll('#list .row').length`) === 14 && B.errors.length === 0, 'kpi: render completes with uiKpis throwing');
  B.ev(`uiKpis=window.__keepK; render(); 1`);
  const back = cards(B);
  chk(back.every(v => /^\$\d{1,3}(,\d{3})*$/.test(v)) && back[0] === '$383,000,000', 'kpi: cards come back with the board figures once drawing works', back);
  R.kpiForced = { na, na2, back, kpiErr: B.ev('UI2.kpiErr') };
})();

// ── 4. permissions: Add requirement, PMO Import ─────────────────────────────────────────────────────────────
await (async () => {
  const B = mk(), Bb = mk(BASE);
  const res = {};
  for (const m of ['review', 'rank', 'fund', 'compare', 'brief']) {
    B.ev(`uiSetMode('${m}'); document.getElementById('addPanel').style.display='none'; 1`);
    const r = B.ev(`uiAddReq()`); const open = B.ev(`document.getElementById('addPanel').style.display==='block'`);
    // the base board's own offer in this mode: the folded Review tools list and the #toolAdd host
    Bb.ev(`uiSetMode('${m}'); 1`);
    const baseOffer = Bb.ev(`document.getElementById('dd_modetools').innerHTML.indexOf('toggleAdd')>=0`);
    res[m] = { handler: r, opened: open, baseOffersInFoldedMenu: baseOffer };
    chk(r === (m === 'review') && open === (m === 'review') && baseOffer === (m === 'review'), 'perm: Add in ' + m + ' follows Review-only', res[m]);
  }
  B.ev(`uiSetMode('review'); document.getElementById('addPanel').style.display='none'; 1`);
  R.permAdd = res;
  // PMO Import in the working board: offered, routes to the review
  const routes = B.ev(`(function(){ const log=[]; ['fullFile','stateFile','uiSubMulti'].forEach(function(id){ const e=document.getElementById(id); e.click=function(){ log.push(id); }; });
    subOpen=false; UI2.imp='pmo'; UI2.pmoHow='all'; uiImpGo(); return log.join(',')+'|'+subOpen; })()`);
  chk(routes === 'uiSubMulti|true', 'perm: PMO Import offered on the working board', routes);
  chk(B.ev(`document.getElementById('dd_share')? 1 : 0`) === 1, 'perm: dd_share exists');
  B.ev(`subOpen=false; subBody(); toggleMenu('share'); 1`);
  chk(B.ev(`document.getElementById('dd_share').innerHTML.indexOf('Program offices')>=0`), 'perm: File menu offers Program offices on the working board');
  B.ev(`toggleMenu('share'); 1`);
  // a PMO copy
  const copy = B.ev(`pmoCopyHtml({ sandbox: true, by: 'T', ts: 1790000000000, fy: MS.cur, ap: APPN, base: pmoBaseline(), pv: PMO_PV, ord: {} })`);
  const C = boot({ html: copy }); C.ev('render(); 1');
  chk(C.ev('SANDBOX') === true, 'perm: copy is a SANDBOX');
  C.ev(`toggleMenu('share'); 1`);
  chk(!C.ev(`document.getElementById('dd_share').innerHTML.indexOf('Program offices')>=0`), 'perm: base rule -- File menu hides Program offices in a PMO copy');
  C.ev(`toggleMenu('share'); 1`);
  chk(C.ev(`document.documentElement.classList.contains('ui-sandbox')`), 'perm: html.ui-sandbox set in a PMO copy (hides the PMO card)');
  const r2 = C.ev(`(function(){ const log=[]; ['fullFile','stateFile','uiSubMulti'].forEach(function(id){ const e=document.getElementById(id); e.click=function(){ log.push(id); }; });
    UI2.imp='full'; uiImpPick('pmo'); const picked=UI2.imp; UI2.imp='pmo'; UI2.pmoHow='all'; subOpen=false; uiImpGo(); const a=log.join(',')+'|'+subOpen;
    UI2.pmoHow='one'; uiImpGo(); return JSON.stringify({picked:picked, all:a, one:log.join(',')+'|'+subOpen}); })()`);
  const rr = JSON.parse(r2);
  chk(rr.picked === 'full' && rr.all === '|false' && rr.one === '|false', 'perm: PMO card choice and uiImpGo refuse in a PMO copy', rr);
  C.ev(`window.__F=[new File(['{}'],'x.json',{type:'application/json'})]; window.__r=null; uiSubMany({files:window.__F, value:''}).then(function(o){ window.__r=o; }); 1`);
  await wait(200);
  const sb = JSON.parse(C.ev(`JSON.stringify({r:window.__r, subs:PMOSUBS.length})`));
  chk(sb.r && sb.r.ok === false && /PMO copy/.test(sb.r.why) && sb.subs === 0, 'perm: uiSubMany refuses in a PMO copy', sb);
  chk(C.ev(`uiSetMode('review'); uiAddReq()`) === true, 'perm: Add in a PMO copy, Review (base offers #toolAdd there too)');
  chk(C.errors.length === 0, 'perm: no errors in the PMO copy', C.errors);
})();

// ── 5. PMO batch: all or nothing ────────────────────────────────────────────────────────────────────────────
const pk = (pmo, id, asks, base, cons, extra = {}) => JSON.stringify(Object.assign({ spmtPkg: 1, dir: 'submit', ap: '', fy: 2027, ts: 1790000000000, by: 'PMO ' + pmo, pmo, svc: MINE, fromTs: 1,
  items: { [id]: { asks, cons } }, base: { [id]: { asks: base, cons: null } } }, extra));
const it = id => items.find(i => i.id === id);
// S04 is AV, S01 PSM, S03 TSS
const F = {
  AV: ['AV.json', pk('AV', 'S04', [it('S04').ask[0] + 500000, it('S04').ask[1], it('S04').ask[2]], it('S04').ask, 'AV says')],
  PSM: ['PSM.json', pk('PSM', 'S01', [it('S01').ask[0] + 100000, it('S01').ask[1], it('S01').ask[2]], it('S01').ask, 'PSM says')],
  TSS: ['TSS.json', pk('TSS', 'S03', [it('S03').ask[0], it('S03').ask[1] + 200000, it('S03').ask[2]], it('S03').ask, 'TSS says')],
  TSS2: ['TSS-second.json', pk('TSS', 'S03', [it('S03').ask[0] + 1, it('S03').ask[1], it('S03').ask[2]], it('S03').ask, 'TSS second')],
  AV2: ['AV-again.json', pk('AV', 'S04', [it('S04').ask[0] + 900000, it('S04').ask[1], it('S04').ask[2]], it('S04').ask, 'AV second, different')],
  BADJSON: ['broken.json', '{"spmtPkg":1,"dir":"submit","pmo":"PSM",'],
  BADW: ['PSM-wrong-width.json', pk('PSM', 'S01', [1, 2], it('S01').ask, 'two figures')],
  NOFY: ['PSM-no-year.json', pk('PSM', 'S01', [it('S01').ask[0] + 7, it('S01').ask[1], it('S01').ask[2]], it('S01').ask, 'no year', { fy: undefined })],
};
const files = (B, list) => B.ev(`window.__f=${JSON.stringify(list)}.map(function(p){ return new File([p[1]], p[0], {type:'application/json'}); }); 1`);
const state = B => B.ev(`JSON.stringify({subs:PMOSUBS.map(function(p){ return {pmo:p.pmo, items:p.items, forFy:p.forFy}; }), pick:PMOPICK, open:subOpen, rows:pmoRows().map(function(r){ return r.src+'|'+r.id+'|'+r.key; })})`);
const board = B => payload(B.ev('buildSavedHtml()'));
async function batch(B, list, before) {
  files(B, list);
  B.ev(`window.__alerts=[]; window.alert=function(m){ window.__alerts.push(String(m)); }; window.__r=null; uiSubMany({files:window.__f, value:''}).then(function(o){ window.__r=o; }); 1`);
  for (let i = 0; i < 400 && B.ev('window.__r===null'); i++) await wait(25);
  return JSON.parse(B.ev(`JSON.stringify({r:window.__r, alerts:window.__alerts})`));
}
const prep = async () => { // a review holding TSS with one field ticked, before every batch
  const B = mk(); B.ev(`window.confirm=function(){ return true; }; window.alert=function(){}; 1`);
  files(B, [F.TSS]); B.ev(`subOpenReview(); importState({files:[window.__f[0]], value:''}); 1`); for (let i = 0; i < 200 && B.ev('PMOSUBS.length') < 1; i++) await wait(25);
  B.ev(`const r=pmoRows()[0]; subPick(r.src, r.id, r.key, true); 1`);
  return B;
};
await (async () => {
  const cases = [
    ['a: valid then malformed JSON', [F.AV, F.BADJSON]],
    ['a: valid then wrong-width submittal (refused by pmoTake in the dry run)', [F.AV, F.BADW]],
    ['b: same office twice, differing content', [F.AV, F.AV2]],
    ['b: same office twice, identical content', [F.AV, F.AV]],
  ];
  for (const [label, list] of cases) {
    const B = await prep();
    const s0 = state(B), b0 = board(B), l0 = JSON.stringify(ls(B.w));
    const o = await batch(B, list);
    chk(o.r && o.r.ok === false, 'batch ' + label + ': refused', o.r);
    chk(state(B) === s0, 'batch ' + label + ': review state preserved exactly (subs, ticks, rows, open)');
    chk(board(B) === b0, 'batch ' + label + ': nothing applied to the board (payload identical)');
    chk(JSON.stringify(ls(B.w)) === l0, 'batch ' + label + ': storage unchanged');
    B.ev('subClose(); subOpenReview(); 1');
    const txt = B.ev(`document.getElementById('subBody').textContent`);
    chk(state(B).includes('"pmo":"TSS"') && /TSS/.test(txt) && !/AV says/.test(txt), 'batch ' + label + ': reopening the review shows the pre-batch state', txt.slice(0, 160));
    chk(B.errors.length === 0, 'batch ' + label + ': no errors', B.errors);
    R['batch msg ' + label] = (o.alerts[0] || '').slice(0, 220);
  }
  // the person cancels a question pmoTake asks in the real run (a submittal naming no year): rolled back
  { const B = await prep(); const s0 = state(B), b0 = board(B);
    B.ev(`window.confirm=function(){ return false; }; 1`);
    const o = await batch(B, [F.AV, F.NOFY]);
    chk(o.r && o.r.ok === false && /taken back out/.test(o.r.why), 'batch c0: cancel in the real run -> earlier files taken back out', o.r);
    chk(state(B) === s0 && board(B) === b0, 'batch c0: review and board exactly as before'); }
  // storage refusing every write during the batch
  for (const [label, list, expectOk] of [['c: storage throws, valid batch', [F.AV, F.PSM], true], ['c: storage throws, valid then malformed', [F.AV, F.BADJSON], false]]) {
    const B = await prep(), T = await prep();
    const s0 = state(B), b0 = board(B), l0 = JSON.stringify(ls(B.w));
    B.ev(`window.__set=Storage.prototype.setItem; Storage.prototype.setItem=function(){ const e=new Error('QuotaExceededError (probe)'); e.name='QuotaExceededError'; throw e; }; 1`);
    const o = await batch(B, list);
    B.ev(`Storage.prototype.setItem=window.__set; 1`);
    const ot = await batch(T, list);
    chk(!!o.r && o.r.ok === expectOk, 'batch ' + label + ': outcome ' + (expectOk ? 'loaded' : 'refused'), o.r);
    chk(state(B) === state(T), 'batch ' + label + ': review identical to the same batch with storage working');
    if (!expectOk) chk(state(B) === s0, 'batch ' + label + ': review preserved exactly');
    chk(board(B) === b0, 'batch ' + label + ': board payload unchanged');
    chk(JSON.stringify(ls(B.w)) === l0, 'batch ' + label + ': storage unchanged (nothing half-written)');
    B.ev('subClose(); subOpenReview(); 1');
    chk(B.ev(`document.getElementById('subBody').textContent`).includes(expectOk ? 'AV' : 'TSS'), 'batch ' + label + ': reopening shows the state');
    chk(B.errors.length === 0, 'batch ' + label + ': no errors', B.errors);
  }
  // success: same as loading one by one, in pick order, including an office already held (TSS2 replaces TSS)
  for (const order of [[F.AV, F.PSM, F.TSS2], [F.PSM, F.TSS2, F.AV]]) {
    const B = await prep(), S1 = await prep();
    const b0 = board(B);
    const o = await batch(B, order);
    files(S1, order);
    for (let i = 0; i < order.length; i++) { const n0 = S1.ev('JSON.stringify(PMOSUBS.map(function(p){ return p.pmo; }))'); S1.ev(`importState({files:[window.__f[${i}]], value:''}); 1`); for (let k = 0; k < 200 && S1.ev('JSON.stringify(PMOSUBS.map(function(p){ return p.pmo; }))') === n0; k++) await wait(25); }
    const lbl = order.map(x => x[0]).join(',');
    chk(o.r && o.r.ok === true && o.r.taken === 3, 'batch ok ' + lbl + ': loaded', o.r);
    chk(state(B) === state(S1), 'batch ok ' + lbl + ': identical to loading one by one');
    const pmos = JSON.parse(B.ev(`JSON.stringify(PMOSUBS.map(function(p){ return p.pmo; }))`));
    chk(JSON.stringify(pmos) === JSON.stringify(order.map(x => JSON.parse(x[1]).pmo)), 'batch ok ' + lbl + ': held in pick order', pmos);
    chk(board(B) === b0, 'batch ok ' + lbl + ': nothing applied to the board');
    chk(B.ev(`Object.keys(PMOPICK).length`) === 0, 'batch ok ' + lbl + ': nothing ticked (as a load does)');
  }
})();

// ── 6. genuine metadata ─────────────────────────────────────────────────────────────────────────────────────
await (async () => {
  const B = mk();
  const ov = id => B.ev(`curRow=${JSON.stringify(id)}; inspectorBody(); uiDrawerTabs(); (document.querySelector('#inspector .uiDOv')||{textContent:'(none)'}).textContent`);
  const o0 = ov('S03');
  chk(/Lifecycle pending/.test(o0), 'meta: lifecycle shown as pending', o0);
  chk(!/Last recorded edit/.test(o0), 'meta: no journal line for S03 -> no last-edit line', o0);
  B.ev(`S.notes=S.notes||{}; S.notes['S03']='a note'; save(); render(); 1`);
  const j = JSON.parse(B.ev(`JSON.stringify(MS.jrnl.slice(-2))`));
  const o1 = ov('S03');
  chk(/Last recorded edit/.test(o1) && /note/.test(o1), 'meta: after an edit to S03, its own journal line is shown', { o1, j });
  const o2 = ov('S04');
  chk(!/Last recorded edit/.test(o2), 'meta: S04 (not edited) shows no last-edit line -- never the board-wide time', o2);
  chk(!B.ev(`document.querySelector('#inspector').textContent`).includes('Last change'), 'meta: no "Last change" board-wide label anywhere');
  B.ev(`jrnlSync('probe load'); 1`);
  const o3 = ov('S03');
  chk(!/Last recorded edit/.test(o3), 'meta: a later board-wide (load) line -> the journal cannot answer -> omitted', o3);
  R.metaSamples = { o1, j };
})();

// ── 7. Cycle control ────────────────────────────────────────────────────────────────────────────────────────
await (async () => {
  const B = mk();
  B.ev(`window.confirm=function(){ return true; }; window.alert=function(){}; window.prompt=function(){ return ''; }; blCyc='PB'; blYr=MS.cur; cycLock(); 1`);
  const keys = JSON.parse(B.ev(`JSON.stringify(uiCycKeys())`));
  chk(keys.length >= 1, 'cyc: a locked cycle exists for the probe', keys);
  B.ev(`uiPop('uiCycPop', document.getElementById('uiCycBtn')); 1`);
  const t = B.ev(`document.getElementById('uiCycPop').textContent`);
  chk(/Working plan/.test(t) && /View a locked cycle \(read only\)/.test(t) && /locked/.test(t) && /not a separate plan/.test(t), 'cyc: menu offers working plan + locked cycles to view, read only', t.slice(0, 300));
  B.ev(`uiCycGo(${JSON.stringify(keys[0])}); 1`);
  chk(B.ev('CYCVIEW') === keys[0], 'cyc: choosing a locked cycle calls cycView (CYCVIEW set)');
  const lbl = B.ev(`document.getElementById('uiCycBtn').textContent`), chip = B.ev(`document.getElementById('uiEdChip').textContent`);
  chk(/locked, read only/.test(lbl) && /Read only/.test(chip), 'cyc: button and chip say read only', [lbl, chip]);
  B.ev(`uiCycGo(''); 1`);
  chk(B.ev('CYCVIEW') === '', 'cyc: Working plan calls cycLeave');
  B.ev(`uiCycGo('NOPE|2027'); 1`);
  chk(B.ev('CYCVIEW') === '', 'cyc: a key that is not a held locked cycle is ignored');
  chk(B.errors.length === 0, 'cyc: no errors', B.errors);
})();

// ── chips: Editable honest about the pen ────────────────────────────────────────────────────────────────────
await (async () => {
  const B = mk();
  const t0 = B.ev(`uiSync(); document.getElementById('uiEdChip').textContent`);
  B.ev(`WRITER={by:'Pat Writer', fp:'0123', t:1}; uiSync(); 1`);
  const t1 = B.ev(`document.getElementById('uiEdChip').textContent`);
  const keyWritten = B.ev(`localStorage.getItem('prio27writerKey')`);
  chk(t0 === '✎ Editable' && /Pat Writer holds the pen/.test(t1), 'chip: says who holds the pen when it is not this browser', [t0, t1]);
  chk(keyWritten === null, 'chip: reading the pen wrote no writer key', keyWritten);
})();
console.log(JSON.stringify({ fails, R }, null, 1));
process.exit(fails.length ? 1 : 0);
