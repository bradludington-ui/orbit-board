// U10 reproduction probe -- a refused edit changes a locked cycle's exported RCN/EEIC codes (synthetic, whole-board jsdom).
// argv: <copy root> <results json> <tree label>
// Reproduce and measure only. Every board is booted in memory; nothing is written to the board's files.
//
// The record's steps, through the board's own functions: an O&M FY27 board with USAF, ANG and AFRC; requirement A asks
// and is funded USAF $900, ANG $200 (discretionary), and carries one RCN/EEIC combination. The codes are typed into the
// real Setup > Codes and structure > RCN / EEIC panel (toggleRcn(), the function that menu item runs) as 11111 / AAAAA:
// each field's own change handler (rcnSet(i, field, this.value, this)) is fired on the rendered <input>. PB27 is locked
// (cycLock). The working codes are then typed as 99999 / ZZZZZ; the board is saved (buildSavedHtml) and reopened from
// that file (boot({html})). On the reopened board PB27 is viewed (cycView), the panel opened, 77777 typed into the
// enabled RCN field, and the Excel workbook exported (exportExcel, captured from its bytes and read back with xlsxRead).
// EXPECTED values are literal: USAF $900 and ANG $200 stay under "11111 / AAAAA" (the label rcnLabel prints for a
// combination with no title is "<rcn> / <eeic>").
import { pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const outFile = process.argv[3];
const tree = process.argv[4] || '?';
const t0 = Date.now();
await import(pathToFileURL(path.join(root, 'runtime-encoding-shim.mjs')).href);
const { boot, seed, bootRelease, BOARD } = await import(pathToFileURL(path.join(root, 'tools/export-audit/boot.mjs')).href);

const boardPath = path.join(root, 'prioritization-board-grid.html');
const html0 = readFileSync(boardPath);
const blob = createHash('sha1').update(`blob ${html0.length}\0`).update(html0).digest('hex');
const bootSelects = realpathSync(BOARD) === realpathSync(boardPath);

const results = [];
const check = (step, name, actual, expected, kind) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ step, name, kind, expected, actual, status: ok ? 'passed' : 'failed' });
  return ok;
};
const cv = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c;
const num = c => { const v = cv(c); if (typeof v === 'number') return v; const n = parseFloat(String(v ?? '').replace(/[$,\s]/g, '')); return isFinite(n) ? n : null; };
const lbl = c => String(cv(c) ?? '').trim();

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

// The rendered RCN / EEIC panel's field for entry 0, typed into and its own change handler fired.
const TYPE = `window.__typeCode=function(field, value){
  if(!rcnOpen) toggleRcn();
  var el=[].slice.call(document.querySelectorAll('#rcnBody input')).filter(function(e){
    return /^rcnSet\\(0,"/.test(e.getAttribute('onchange')||'') && (e.getAttribute('onchange')||'').indexOf('"'+field+'"')>0; })[0];
  if(!el) return {found:false};
  var o={found:true, disabled:!!el.disabled, readOnly:!!el.readOnly, shown:el.value, handler:el.getAttribute('onchange')};
  el.value=value; el.dispatchEvent(new Event('change', {bubbles:true}));
  o.statusAfter=(document.getElementById('shareStat')||{}).textContent||'';
  var el2=[].slice.call(document.querySelectorAll('#rcnBody input')).filter(function(e){
    return /^rcnSet\\(0,"/.test(e.getAttribute('onchange')||'') && (e.getAttribute('onchange')||'').indexOf('"'+field+'"')>0; })[0];
  o.fieldAfterRedraw=el2? el2.value : null;
  return o; }; 'ok'`;
const typeCode = (ev, field, value) => JSON.parse(ev(`JSON.stringify(__typeCode(${JSON.stringify(field)}, ${JSON.stringify(value)}))`));
const codes = (ev, expr) => JSON.parse(ev(`JSON.stringify((${expr}||[]).map(function(e){ return [e.rcn, e.eeic]; }))`));

// The RCN-EEIC by Month rollup, service by service: [label, NO DATE, TOTAL] for every combination row.
function rcnRollup(bk) {
  const rows = (bk['RCN-EEIC by Month'] || []).map(r => (r || []));
  const out = { present: rows.length > 0, title: lbl((rows[0] || [])[0]), svc: {}, anyCellWith77777: [], anyCellWith99999: [] };
  ['USAF', 'ANG', 'AFRC'].forEach(sv => {
    const s = rows.findIndex(r => lbl(r[0]) === sv);
    if (s < 0) { out.svc[sv] = null; return; }
    const hdr = rows[s + 1].map(lbl), cT = hdr.indexOf('TOTAL'), cN = hdr.indexOf('NO DATE');
    const lines = [];
    for (let j = s + 2; j < rows.length && lbl(rows[j][0]) !== sv + ' TOTAL'; j++) lines.push([lbl(rows[j][0]), num(rows[j][cN]), num(rows[j][cT])]);
    const tot = rows.find((r, j) => j > s && lbl(r[0]) === sv + ' TOTAL');
    out.svc[sv] = { lines, total: tot ? num(tot[cT]) : null };
  });
  rows.forEach((r, j) => r.forEach(c => { const t = lbl(c); if (/77777/.test(t)) out.anyCellWith77777.push([j, t]); if (/99999/.test(t)) out.anyCellWith99999.push([j, t]); }));
  return out;
}
const WANT = { USAF: [['11111 / AAAAA', 900]], ANG: [['11111 / AAAAA', 200]], AFRC: [] };
const brief = R => R && R.svc ? Object.fromEntries(['USAF', 'ANG', 'AFRC'].map(sv => [sv, R.svc[sv] ? R.svc[sv].lines.map(l => [l[0], l[2]]) : null])) : null;
// The Spend Plan Source's RCN / EEIC columns on A's lines (an observation, not asserted).
const srcCodes = bk => { const sh = Object.keys(bk).filter(k => !k.startsWith('__')).map(k => bk[k]).find(rs => (rs || []).length > 1) || [];
  const h = (sh[0] || []).map(lbl), cA = h.indexOf('Amount'), cR = h.indexOf('RCN'), cE = h.indexOf('AF EEIC');
  return { err: bk.__err || null, lines: sh.slice(1).map(r => [lbl(r[cR]), lbl(r[cE]), num(r[cA])]) }; };

const obs = {};
// ---- board A: the working plan, the lock, the working codes moved on, the file ------------------------------------
const A = boot();
seed(A.ev, { services: ['USAF', 'ANG', 'AFRC'],
  items: [{ id: 'A', grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Synthetic requirement A', event: 'Synthetic event A',
    ccar: '', fy26: [0, 0, 0], ask: [900, 200, 0], alloc: null }],
  disc: [900, 200, 0], mand: [0, 0, 0], order: ['A'] });
A.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
  MS.years[MS.cur]=S; applyState(S); save(); 'ok'`);
A.ev(TYPE);
obs.boardA = JSON.parse(A.ev(`(function(){ rcnAdd(); return JSON.stringify({slug:mySlug(), fy:FYL(), cur:MS.cur, rcnApplies:rcnApplies(), svc:SVC.slice(), n:rcnReg().length}); })()`));
obs.typedA = { rcn: typeCode(A.ev, 'rcn', '11111'), eeic: typeCode(A.ev, 'eeic', 'AAAAA') };
const K = A.ev(`rcnReg()[0].k`);
A.ev(`if(rcnOpen) toggleRcn(); setRcnAsg('A', ${JSON.stringify(K)}); 'ok'`);
const T0 = JSON.parse(A.ev(`(function(){ var T=tiers().A; return JSON.stringify({d:T.d, m:T.m, asg:rcnAsgOf('A','USAF')+'|'+rcnAsgOf('A','ANG')}); })()`));
check('fixture', 'O&M FY27 with USAF, ANG and AFRC; RCN/EEIC applies', [obs.boardA.slug, obs.boardA.fy, obs.boardA.svc, obs.boardA.rcnApplies], ['om', 'FY27', ['USAF', 'ANG', 'AFRC'], true], 'control');
check('fixture', 'A draws USAF $900 and ANG $200 discretionary, under the one combination on both services', [T0.d, T0.m, T0.asg], [[900, 200, 0], [0, 0, 0], K + '|' + K], 'control');
check('fixture', 'the codes typed into the panel are kept: 11111 / AAAAA', codes(A.ev, 'rcnReg()'), [['11111', 'AAAAA']], 'control');
A.ev(`blCyc='PB'; blYr=MS.cur; cycLock(); 'ok'`);
const KEY = 'PB|2027';
check('lock', 'PB27 is locked and keeps the list it was locked with: 11111 / AAAAA',
  [A.ev(`!!(blGet(${JSON.stringify(KEY)})||{}).locked`), A.ev(`(typeof blLblTxt==='function'? blLblTxt : blLbl)(${JSON.stringify(KEY)})`), codes(A.ev, `(blGet(${JSON.stringify(KEY)})||{}).rcn`)],
  [true, 'PB27', [['11111', 'AAAAA']]], 'control');
obs.typedWorking = { rcn: typeCode(A.ev, 'rcn', '99999'), eeic: typeCode(A.ev, 'eeic', 'ZZZZZ') };
A.ev(`if(rcnOpen) toggleRcn(); 'ok'`);
check('working', 'the working codes are now 99999 / ZZZZZ; the lock still holds 11111 / AAAAA',
  [codes(A.ev, 'rcnReg()'), codes(A.ev, `(blGet(${JSON.stringify(KEY)})||{}).rcn`)], [[['99999', 'ZZZZZ']], [['11111', 'AAAAA']]], 'control');
const saved = A.ev('buildSavedHtml()');
const cycA = A.ev('JSON.stringify(CYCDB)');
check('harness', 'board A: whole-board boot has no jsdom script errors', A.errors, [], 'control');

// ---- CONTROL: the file reopened, PB27 viewed, nothing typed, the workbook exported ------------------------------
const C = boot({ html: saved });
C.ev(`cycView(${JSON.stringify(KEY)}); 'ok'`);
const ctlBook = await book(C.w, 'exportExcel');
const ctl = rcnRollup(ctlBook);
check('control (no edit in the view)', 'reopened and viewing PB27', C.ev('CYCVIEW'), KEY, 'control');
check('control (no edit in the view)', 'RCN-EEIC by Month: USAF $900 and ANG $200 under 11111 / AAAAA, AFRC nothing', brief(ctl), WANT, 'control');
check('control (no edit in the view)', 'the sheet is labelled LOCKED VIEW and names no other code', [/LOCKED VIEW/.test(ctl.title), ctl.anyCellWith77777, ctl.anyCellWith99999], [true, [], []], 'control');
check('harness', 'control board: no jsdom script errors; workbook built', [C.errors, ctlBook.__err || 'ok'], [[], 'ok'], 'control');

// ---- THE RECORD'S STEPS on a second reopen of the same file ------------------------------------------------------
const R = boot({ html: saved });
R.ev(TYPE);
check('reopen', 'the reopened board: working codes 99999 / ZZZZZ, PB27 holds 11111 / AAAAA, the cycle store came back whole',
  [codes(R.ev, 'rcnReg()'), codes(R.ev, `(blGet(${JSON.stringify(KEY)})||{}).rcn`), R.ev('JSON.stringify(CYCDB)') === cycA, R.ev(`rcnAsgOf('A','USAF')`)],
  [[['99999', 'ZZZZZ']], [['11111', 'AAAAA']], true, K], 'control');
R.ev(`cycView(${JSON.stringify(KEY)}); 'ok'`);
check('view', 'viewing PB27 shows the codes it was locked with', [R.ev('CYCVIEW'), codes(R.ev, 'rcnReg()'), /LOCKED VIEW/.test(R.ev('document.title'))], [KEY, [['11111', 'AAAAA']], true], 'control');
const preBook = await book(R.w, 'exportExcel');
const pre = rcnRollup(preBook);
check('view', 'before anything is typed, the export holds USAF $900 / ANG $200 under 11111 / AAAAA', brief(pre), WANT, 'control');
const cycBefore = R.ev('JSON.stringify(CYCDB)'), lsBefore = R.ev(`localStorage.getItem(_AP.key)`);
const typed = typeCode(R.ev, 'rcn', '77777');
obs.typedInView = typed;
check('edit', 'the RCN field in the open panel is there and enabled, showing 11111', [typed.found, typed.disabled, typed.readOnly, typed.shown], [true, false, false, '11111'], 'control');
check('edit', 'the status says the change was not kept', /the change was not kept/.test(typed.statusAfter), true, 'control');
check('edit', 'after the refusal the view still carries the locked codes 11111 / AAAAA', codes(R.ev, 'rcnReg()'), [['11111', 'AAAAA']], 'defect');
const postBook = await book(R.w, 'exportExcel');
const post = rcnRollup(postBook);
check('export after the refused edit', 'RCN-EEIC by Month: USAF $900 under 11111 / AAAAA', post.svc.USAF ? post.svc.USAF.lines.map(l => [l[0], l[2]]) : null, WANT.USAF, 'defect');
check('export after the refused edit', 'RCN-EEIC by Month: ANG $200 under 11111 / AAAAA', post.svc.ANG ? post.svc.ANG.lines.map(l => [l[0], l[2]]) : null, WANT.ANG, 'defect');
check('export after the refused edit', 'no cell anywhere on the sheet names 77777', post.anyCellWith77777, [], 'defect');
check('export after the refused edit', 'service totals are unchanged: USAF $900, ANG $200, AFRC $0',
  ['USAF', 'ANG', 'AFRC'].map(sv => post.svc[sv] ? post.svc[sv].total : null), [900, 200, 0], 'control');
check('export after the refused edit', 'the sheet is labelled LOCKED VIEW', /LOCKED VIEW/.test(post.title), true, 'control');
obs.srcInViewAfterEdit = srcCodes(await book(R.w, 'exportSrc'));
check('stored', 'the stored PB27 cycle still holds 11111 / AAAAA, and the cycle store is byte for byte as it was',
  [codes(R.ev, `(blGet(${JSON.stringify(KEY)})||{}).rcn`), R.ev('JSON.stringify(CYCDB)') === cycBefore], [[['11111', 'AAAAA']], true], 'control');
check('stored', 'browser storage of the working plan is untouched by the refused edit', R.ev(`localStorage.getItem(_AP.key)`) === lsBefore, true, 'control');
R.ev(`if(rcnOpen) toggleRcn(); cycLeave(); 'ok'`);
check('leave', 'leaving the view: the working codes are 99999 / ZZZZZ', [R.ev('CYCVIEW'), codes(R.ev, 'rcnReg()')], ['', [['99999', 'ZZZZZ']]], 'control');
R.ev(`cycView(${JSON.stringify(KEY)}); 'ok'`);
obs.reViewCodes = codes(R.ev, 'rcnReg()');
const reBook = await book(R.w, 'exportExcel');
obs.reViewExport = brief(rcnRollup(reBook));
R.ev(`cycLeave(); 'ok'`);
check('leave', 'viewing PB27 again after leaving: 11111 / AAAAA again', obs.reViewCodes, [['11111', 'AAAAA']], 'control');
check('harness', 'reopened board: no jsdom script errors; workbooks built', [R.errors, preBook.__err || 'ok', postBook.__err || 'ok'], [[], 'ok', 'ok'], 'control');

const passed = results.filter(r => r.status === 'passed').length, failed = results.length - passed;
const summary = { finding: 'U10', tree, root, board: boardPath, boardBlob: blob, bootSelectsThisBoard: bootSelects,
  evidenceKind: 'fresh whole-board jsdom synthetic runtime (boot.mjs standard stubs + TextEncoder/Decoder shim); codes typed into the rendered RCN / EEIC panel fields and their own change handlers fired',
  expected: WANT, cycleKey: KEY, comboKey: K,
  sheets: { control: ctl, viewBeforeEdit: pre, viewAfterRefusedEdit: post }, observations: obs,
  results, passed, failed,
  failedByKind: { defect: results.filter(r => r.status === 'failed' && r.kind === 'defect').length, control: results.filter(r => r.status === 'failed' && r.kind === 'control').length },
  seconds: (Date.now() - t0) / 1000 };
if (outFile) writeFileSync(outFile, JSON.stringify(summary, null, 2) + '\n');
results.forEach(r => console.log(JSON.stringify([r.status, r.kind, r.step, r.name, r.actual, r.expected])));
console.log(JSON.stringify({ tree, blob, bootSelects, passed, failed, failedByKind: summary.failedByKind, seconds: summary.seconds }));
bootRelease(0);
process.exit(failed ? 1 : 0);
