// UI-C1 copy of uichunk1/rv-smoke.mjs, pointed at the ui-c1 worktree: base 4a6f7c7 vs the board named in argv[2]
// (default: the worktree's board), same seed, same clock. jsdom only. Only the paths below changed.
import { boot, seed } from '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/ui-c1-wt/tools/export-audit/boot.mjs';
import { readFileSync } from 'node:fs';
import { JSDOM } from '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/ui-c1-wt/node_modules/jsdom/lib/api.js';
const SP = '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/boards';
const BASE = readFileSync(SP + '/base-4a6f7c7.html', 'utf8');
const NEW = readFileSync(process.argv[2] || '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/ui-c1-wt/prioritization-board-grid.html', 'utf8');
const out = {};
const fails = [];
const chk = (ok, label, extra) => { if (!ok) fails.push(label + (extra !== undefined ? ' :: ' + JSON.stringify(extra).slice(0, 400) : '')); return ok; };
const lsDump = w => { const o = {}; for (let i = 0; i < w.localStorage.length; i++) { const k = w.localStorage.key(i); o[k] = w.localStorage.getItem(k); } return o; };

// the synthetic seed (same as the builder's / uimock)
const PM = ['PSM', 'ATL', 'TSS', 'AV', 'MxS', 'LOG'];
const NAMES = ['Depot pod overhaul', 'Engine spares pool', 'Training system refresh', 'Avionics software drop', 'Maintenance data link', 'Logistics IT sustainment', 'Support equipment buy', 'Simulator concurrency', 'Field service reps', 'Repair network stand-up', 'Tech data update', 'Obsolescence redesign', 'Test equipment recal', 'Packaging & shipping'];
const items = NAMES.map((n, i) => ({ id: 'S' + String(i + 1).padStart(2, '0'), grp: PM[i % PM.length], team: PM[i % PM.length], sect: '', custom: false, title: 'Synthetic — ' + n, event: n, ccar: 'SYN-' + (100 + i), fy26: [0, 0, 0], ask: [(9 + (i * 7) % 23) * 1e6, (2 + (i * 3) % 7) * 1e6, (1 + (i * 5) % 4) * 1e6], alloc: null }));
const sc = { services: ['USAF', 'ANG', 'AFRC'], items, disc: [180e6, 40e6, 22e6], mand: [25e6, 6e6, 3e6], order: items.map(i => i.id) };

// ---------- 1. opening: errors, storage written at opening ----------
const Bb = boot({ html: BASE }); const Bn = boot({ html: NEW });
out.openErrorsBase = Bb.errors.slice(); out.openErrorsNew = Bn.errors.slice();
chk(Bn.errors.length === 0, 'X.errors after opening the new board', Bn.errors);
const lsB = lsDump(Bb.w), lsN = lsDump(Bn.w);
out.lsKeysBase = Object.keys(lsB).sort(); out.lsKeysNew = Object.keys(lsN).sort();
chk(JSON.stringify(out.lsKeysBase) === JSON.stringify(out.lsKeysNew), 'storage keys after opening differ', [out.lsKeysBase, out.lsKeysNew]);
chk(!Object.keys(lsN).some(k => /^prio27ui/.test(k)), 'a prio27ui* key was written at opening');
out.uiOn = Bn.ev('document.documentElement.classList.contains("ui-on")');
// SRC0 must carry no runtime UI state
const src0 = Bn.ev('SRC0');
const rtState = (html) => { const d = new JSDOM(html).window.document; return {
  htmlClassUiOn: d.documentElement.classList.contains('ui-on') || d.documentElement.classList.contains('ui-rail'), uiCycBtn: !!d.getElementById('uiCycBtn'), uiEdChip: !!d.getElementById('uiEdChip'),
  uiColsCss: !!d.getElementById('uiColsCss'), uiDTabs: !!d.querySelector('.uiDTabs,.uiDHist'), rowcolsInline: (d.documentElement.getAttribute('style') || '').includes('--rowcols'),
  qInHdr: !!d.querySelector('.hdr #q'), mviewInHdr: !!d.querySelector('.hdr #m_view'), fchipsInHdr: !!d.querySelector('.hdr #fchips'), toolsMovedEmpty: (d.getElementById('uiToolsMoved') || {}).childElementCount === 0,
  impOpen: !!d.querySelector('#uiImpPanel.open'), flyOpen: !!d.querySelector('#uiFly.open'), kpisEmpty: (d.getElementById('uiKpis') || {}).innerHTML === '' }; };
out.src0 = rtState(src0);
const d0 = new JSDOM(src0).window.document;
out.src0.qInHdr = !!d0.querySelector('.hdr #q'); out.src0.mviewInHdr = !!d0.querySelector('.hdr #m_view'); out.src0.toolsMovedEmpty = (d0.getElementById('uiToolsMoved') || {}).childElementCount === 0;
const clean = r => !r.htmlClassUiOn && !r.uiCycBtn && !r.uiEdChip && !r.uiColsCss && !r.uiDTabs && !r.rowcolsInline && r.qInHdr && r.mviewInHdr && r.fchipsInHdr && r.toolsMovedEmpty && !r.impOpen && !r.flyOpen && r.kpisEmpty;
chk(clean(out.src0), 'SRC0 carries runtime UI state', out.src0);

// SRC0(new) vs SRC0(base): with script text blanked and the six new static blocks removed, the documents are identical
const norm = (s, isNew) => { const d = new JSDOM(s).window.document;
  d.querySelectorAll('script').forEach(x => { x.textContent = ''; });
  const tw = d.createTreeWalker(d, 128); const cm = []; while (tw.nextNode()) cm.push(tw.currentNode); cm.forEach(c => c.remove());
  if (isNew) ['uiV2css', 'uiSide', 'uiFly', 'uiPage', 'uiImpPanel', 'uiSubMulti'].forEach(id => { const e = d.getElementById(id); if (e) e.remove(); });
  return d.documentElement.outerHTML.replace(/\n\s*\n/g, '\n').replace(/>\s+</g, '><'); };
const nB = norm(Bb.ev('SRC0'), false), nN = norm(src0, true);
out.src0SameApartFromStaticBlocks = nB === nN;
if (nB !== nN) { let i = 0; while (i < nB.length && nB[i] === nN[i]) i++; out.src0FirstDiff = { at: i, base: nB.slice(i - 80, i + 120), neu: nN.slice(i - 80, i + 120) }; }
chk(out.src0SameApartFromStaticBlocks, 'SRC0 differs from base beyond the static new blocks', out.src0FirstDiff);

// ---------- 2. seeded: money, the saved file's payload ----------
const run = (B) => { B.ev('Date.now = function(){ return 1790000000000; }; 1'); seed(B.ev, sc);
  B.ev('BASE_ITEMS.length=0; DATA.items.forEach(i=>{ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); S.bm={disc:S.discSvc,mand:S.mandSvc,adds:[]}; render(); 1'); };
run(Bb); run(Bn);
const payload = s => { const m = s.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/); return m ? m[1] : null; };
const savedB0 = Bb.ev('buildSavedHtml()'), savedN0 = Bn.ev('buildSavedHtml()');
chk(payload(savedB0) !== null && payload(savedB0) === payload(savedN0), 'saved-file pubState payload differs from base (seeded, same clock)');
out.savedPayloadSame = payload(savedB0) === payload(savedN0);
// the saved file of the new board = its own SRC0 with the payload
chk(savedN0 === src0.replace(/(<script type="application\/json" id="pubState">)[\s\S]*?(<\/script>)/, (m, a, b) => a + payload(savedN0) + b), 'saved file is not SRC0 + payload');

// KPI cards vs the posture strip and the board's own totals
const kpi = JSON.parse(Bn.ev(`JSON.stringify([...document.querySelectorAll('#uiKpis .k')].map(k=>({cls:k.className, v:k.querySelector('.v').textContent, dv:+k.querySelector('.v').getAttribute('data-v'), x:k.querySelector('.x').textContent})))`));
const tt = JSON.parse(Bn.ev(`(function(){ const T=tiers(null, scenOpt()); const t=tierTotals(T); let ask=0; S.order.forEach(id=>{ const it=itemById(id); if(it) ask+=askTot(it); }); return JSON.stringify({ask, dUsed:t.dUsed, mUsed:t.mUsed, u2Amt:t.u2Amt, dBA:discTot(), mBA:mandTot()}); })()`));
const post = Bn.ev(`document.querySelector('#posture').textContent`);
out.kpi = kpi; out.totals = tt; out.postureWhole = (post.match(/Whole budget · \$[\d,]+ asked/) || [''])[0];
const fM = v => '$' + Math.round(v).toLocaleString('en-US');
chk(kpi.length === 4, 'four KPI cards');
chk(kpi[0].v === fM(tt.ask) && kpi[1].v === fM(tt.dUsed) && kpi[2].v === fM(tt.mUsed) && kpi[3].v === fM(tt.u2Amt), 'KPI figures != the board totals', { kpi, tt });
chk(kpi[0].v === '$383,000,000' && kpi[1].v === '$242,000,000' && kpi[2].v === '$34,000,000' && kpi[3].v === '$107,000,000', 'seeded KPI != 383/242/34/107', kpi.map(k => k.v));
chk(Math.round(tt.ask) === Math.round(tt.dUsed) + Math.round(tt.mUsed) + Math.round(tt.u2Amt), 'ask != disc + mand + ufr on the seed');
chk(out.postureWhole === 'Whole budget · ' + kpi[0].v + ' asked', 'posture "asked" figure != KPI Total Ask', out.postureWhole);
chk(kpi.every(k => /^\$\d{1,3}(,\d{3})*$/.test(k.v)), 'a KPI value is not whole dollars', kpi.map(k => k.v));
chk(/^of \$\d{1,3}(,\d{3})*(\.\d+)? BA$/.test(kpi[1].x) && !/\./.test(kpi[1].x) && !/\./.test(kpi[2].x), 'a KPI subline is not whole dollars', [kpi[1].x, kpi[2].x]);

// whole dollars when the inputs carry cents: allocation-free fractional ask
Bn.ev(`DATA.items[0].ask=[1234567.89, 0.4, 0.3]; BASE_ASK[DATA.items[0].id]=DATA.items[0].ask.slice(); render(); 1`);
Bb.ev(`DATA.items[0].ask=[1234567.89, 0.4, 0.3]; BASE_ASK[DATA.items[0].id]=DATA.items[0].ask.slice(); render(); 1`);
const kpiC = JSON.parse(Bn.ev(`JSON.stringify([...document.querySelectorAll('#uiKpis .k .v')].map(e=>e.textContent))`));
const postC = Bn.ev(`(document.querySelector('#posture').textContent.match(/Whole budget · \\$[\\d,]+ asked/)||[''])[0]`);
const postCb = Bb.ev(`(document.querySelector('#posture').textContent.match(/Whole budget · \\$[\\d,]+ asked/)||[''])[0]`);
out.kpiCents = kpiC; out.postureCents = [postC, postCb];
chk(kpiC.every(v => /^\$\d{1,3}(,\d{3})*$/.test(v)), 'KPI not whole dollars with fractional inputs', kpiC);
chk(postC === postCb && postC === 'Whole budget · ' + kpiC[0] + ' asked', 'KPI ask vs posture (fractional inputs)', [postC, postCb, kpiC[0]]);

// KPI follows filters/scenario exactly as the posture does (never stale)
const states = [['pmo AV', `filter='AV'`], ['svc 0', `filter='ALL'; svcFilter=0`], ['disc only', `svcFilter=-1; try{ S.scen=S.scen||{}; }catch(e){}`]];
out.kpiStates = {};
for (const [lbl, code] of states) {
  Bn.ev(code + '; render(); 1');
  const k = JSON.parse(Bn.ev(`JSON.stringify([...document.querySelectorAll('#uiKpis .k .v')].map(e=>e.textContent))`));
  const p = Bn.ev(`(document.querySelector('#posture').textContent.match(/Whole budget · \\$[\\d,]+ asked/)||[''])[0]`);
  const u = Bn.ev(`document.querySelector('#posture .pp:nth-child(3) .v').getAttribute('data-v')`);
  out.kpiStates[lbl] = { k, p, u };
  chk(p === 'Whole budget · ' + k[0] + ' asked' && Math.round(+u) === +k[3].replace(/[$,]/g, ''), 'KPI vs posture in state ' + lbl, { k, p, u });
}
Bn.ev(`filter='ALL'; svcFilter=-1; render(); 1`);
// change a budget: the cards follow on the next render
Bn.ev(`S.discSvc=[100e6,40e6,22e6]; S.bm={disc:S.discSvc,mand:S.mandSvc,adds:[]}; render(); 1`);
const kAfter = JSON.parse(Bn.ev(`JSON.stringify([...document.querySelectorAll('#uiKpis .k .v')].map(e=>e.textContent))`));
const ttA = JSON.parse(Bn.ev(`(function(){ const t=tierTotals(tiers(null, scenOpt())); return JSON.stringify([t.dUsed,t.u2Amt]); })()`));
chk(kAfter[1] === fM(ttA[0]) && kAfter[3] === fM(ttA[1]), 'KPI stale after a budget change', { kAfter, ttA });

// ---------- 3. runtime UI state never reaches a saved file ----------
// re-seed both identically, take the saved file, then drive every new control and take it again
run(Bb); run(Bn);
const sB = Bb.ev('buildSavedHtml()'), sN1 = Bn.ev('buildSavedHtml()');
chk(payload(sB) === payload(sN1), 'payload differs after re-seed');
Bn.ev(`uiColSet('band', true); uiColSet('lane', true); uiRailToggle(); uiGo('fund'); uiGo('fydp', document.getElementById('uiNav_fydp')); uiGo('hist', document.getElementById('uiNav_hist')); uiImpOpen(); uiImpPick('pmo'); UI2.pmoHow='all'; uiImpDraw(); uiImpClose(); uiSetMode('review'); uiPop('uiColsPop', document.getElementById('uiColsBtn')); 1`);
try { Bn.ev(`curRow=S.order[2]; inspectorBody(); 1`); } catch (e) { out.inspErr = String(e); }
await new Promise(r => setTimeout(r, 30));
out.drawerTabs = Bn.ev(`!!document.querySelector('#inspector .uiDTabs')`);
const sN2 = Bn.ev('buildSavedHtml()');
out.savedUnchangedByUi = sN1 === sN2;
chk(sN1 === sN2, 'saved file changed after driving the new UI', { len1: sN1.length, len2: sN2.length });
out.savedState = rtState(sN2);
chk(clean(out.savedState), 'saved markup carries runtime UI', out.savedState);
chk(!/prio27uiCols|prio27uiRail/.test(payload(sN2)), 'saved payload carries the UI prefs');
out.lsAfterClicks = Object.keys(lsDump(Bn.w)).sort();
out.uiPrefValues = { rail: Bn.w.localStorage.getItem('prio27uiRail'), cols: Bn.w.localStorage.getItem('prio27uiCols') };
out.colsCss = Bn.ev(`document.getElementById('uiColsCss').textContent`);
out.rowcolsInline = Bn.ev(`document.documentElement.style.getPropertyValue('--rowcols')`);
out.errorsAfterDrive = Bn.errors.slice();
chk(Bn.errors.length === 0, 'errors after driving the UI', Bn.errors);

// storage written by the same existing calls on both builds (prio27ui* excluded)
const drive = `uiSetMode('fund'); uiSetMode('review'); curRow=S.order[2]; inspectorBody(); 1`;
const Cb = boot({ html: BASE }), Cn = boot({ html: NEW }); run(Cb); run(Cn);
Cb.ev(drive); Cn.ev(drive); await new Promise(r => setTimeout(r, 30));
const strip = o => { const r = {}; Object.keys(o).sort().forEach(k => { if (!/^prio27ui/.test(k)) r[k] = o[k]; }); return r; };
const lb = strip(lsDump(Cb.w)), ln = strip(lsDump(Cn.w));
out.lsSameCallsKeys = [Object.keys(lb), Object.keys(ln)];
chk(JSON.stringify(Object.keys(lb)) === JSON.stringify(Object.keys(ln)), 'storage keys differ for the same existing calls', out.lsSameCallsKeys);
out.lsSameCallsValuesEqual = Object.keys(lb).filter(k => lb[k] !== ln[k]);
chk(out.lsSameCallsValuesEqual.length === 0, 'storage values differ for the same existing calls', out.lsSameCallsValuesEqual);
// ---------- 4. Import box routes ----------
const clicks = Bn.ev(`(function(){ const log=[]; ['fullFile','stateFile','multiFile','uiSubMulti'].forEach(function(id){ const e=document.getElementById(id); e.click=function(){ log.push(id); }; });
  const r={};
  subOpen=false; UI2.imp='full'; uiImpGo(); r.full=log.splice(0).join(',')+'|sub='+subOpen;
  subOpen=false; UI2.imp='one'; uiImpGo(); r.one=log.splice(0).join(',')+'|sub='+subOpen;
  subOpen=false; UI2.imp='pmo'; UI2.pmoHow='one'; uiImpGo(); r.pmoOne=log.splice(0).join(',')+'|sub='+subOpen;
  subOpen=false; UI2.imp='pmo'; UI2.pmoHow='all'; uiImpGo(); r.pmoAll=log.splice(0).join(',')+'|sub='+subOpen;
  subOpen=false; return JSON.stringify(r); })()`);
out.importRoutes = JSON.parse(clicks);
chk(out.importRoutes.full === 'fullFile|sub=false' && out.importRoutes.one === 'stateFile|sub=false' && out.importRoutes.pmoOne === 'stateFile|sub=true' && out.importRoutes.pmoAll === 'uiSubMulti|sub=true', 'Import box routes', out.importRoutes);
Bn.errors.length = 0; Bb.errors.length = 0;
Bn.ev('1');
console.log(JSON.stringify({ fails, out }, null, 1));
process.exit(fails.length ? 1 : 0);
