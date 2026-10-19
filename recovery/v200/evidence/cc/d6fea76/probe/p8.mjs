// p8.mjs <copyRoot> <case L|U|Q> [variantBoard] -- CYCREG verify-money round 8 (18 Oct 2026), on fix round 7. Synthetic data in
// memory only; the board file is never written. Expected values are hand-written literals; board helpers (xlsxRead, buildSavedHtml,
// inboundCheck ...) only OBSERVE. Helpers copied from verify-money-r7/probe/p7c.mjs and p-own6.mjs (unchanged in substance).
// Hand-worked money: R1 asks USAF 900 / ANG 200 / AFRC 0, funded in full from 5,000 pots, one award in December; so each service's
// row and total read USAF 900, ANG 200, AFRC 0, and all services 900 + 200 + 0 = 1,100.
// L: the THIRD WAY (round 7 MF1): the own board takes its file whole, its working plan listing K1 twice (PB27 [K1]); 🔒 Lock POM27
//    answered yes; then every file it writes -- saved, one-appropriation, package, PMO copy, the office's submittal -- through every
//    door its kind has, on a FRESH board and on the SAME board, before and after ✕ on row 2; and each opened itself.
// U: an UNLOCKED cycle: the own board holding PB27 [K1, K1] (taken whole) unlocks PB27; its saved file's refusal; then on that board
//    PB27 deleted, or replaced by 🔒 Lock PB27 -- and the saved file is taken. Tests the words "and no board changes it".
// Q: the lock's question for K1 three times, for "__none__" (R1 on it), and its money.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = resolve(process.argv[2]), CASE = process.argv[3] || 'L';
process.env.BOARD = process.argv[4] ? resolve(process.argv[4]) : root + '/prioritization-board-grid.html'; delete process.env.MUT_FIRST_FAIL;
await import(pathToFileURL(root + '/runtime-encoding-shim.mjs').href);
const { boot, seed, bootMark, bootRelease, settleBoards, BOARD } = await import(pathToFileURL(root + '/tools/export-audit/boot.mjs').href);
const blob = p => { const b = readFileSync(p); return createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex'); };
const et = () => new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET';
console.log('IDS ' + JSON.stringify({ BOARD: resolve(BOARD), board: blob(BOARD), probe: blob(new URL(import.meta.url)), started: et(), CASE }));
const J = JSON.stringify, SV = ['USAF', 'ANG', 'AFRC'];
let fails = 0, n = 0;
const chk = (label, got, want) => { n++; const ok = J(got) === J(want); if (!ok) fails++;
  console.log((ok ? 'PASS ' : 'FAIL ') + label + (ok ? '' : '\n     got  ' + J(got) + '\n     want ' + J(want))); };
const obs = (label, v) => console.log('OBS  ' + label + ' = ' + J(v));
const E = (k, rcn, eeic) => ({ k, rcn, eeic, t: '', svc: SV.slice() });
const K1 = E('K1', '11111', 'AAAAA'), NN = E('__none__', '22222', 'BBBBB'), NA = '— no RCN/EEIC assigned —';
const it = { id: 'R1', grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Req R1', event: 'Ev R1', ccar: 'CCR1', fy26: [0, 0, 0], ask: [900, 200, 0], alloc: null };
const lsOf = ev => JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
const moved = (a, b) => Object.keys(Object.assign({}, a, b)).filter(k => a[k] !== b[k]).sort();
const sheet = async (B, view) => {
  const on = view ? B.ev(`cycView('${view}'); CYCVIEW||'not on screen'`) : 'WP';
  const r = JSON.parse(await B.ev(`(async function(){ var cap=null,_B=window.Blob; window.alert=function(){}; window.confirm=function(){ return true; };
    window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
    try{ exportExcel(); }catch(e){ window.Blob=_B; return JSON.stringify({err:'threw '+e.message}); } window.Blob=_B;
    if(!cap) return JSON.stringify({err:'no file'});
    var bk=await xlsxRead(cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength)), rc=bk['RCN-EEIC by Month']||[], rows=[], sv='';
    var lbl=function(r){ return String((r||[])[0]==null?'':r[0]).trim(); };
    for(var j=0;j<rc.length;j++){ var L=lbl(rc[j]); if(L==='WHICH REQUIREMENTS SIT UNDER EACH COMBINATION') break;
      if(['USAF','ANG','AFRC'].indexOf(L)>=0){ sv=L; continue; } var t=(rc[j]||[])[14]; if(typeof t==='number') rows.push([/TOTAL BY MONTH$/.test(L)?'ALL':sv, L, rc[j][3], t]); }
    var tot=['USAF','ANG','AFRC'].map(function(s){ return rc.filter(function(r){ return lbl(r)===s+' TOTAL'; }).map(function(r){ return r[14]; }); });
    return JSON.stringify({rows:rows, tot:tot}); })()`));
  if (view) B.ev(`cycLeave(); 'ok'`);
  return Object.assign({ on }, r);
};
const WANT = (on, lab) => ({ on, rows: [['USAF', lab, 900, 900], ['USAF', 'USAF TOTAL', 900, 900], ['ANG', lab, 200, 200], ['ANG', 'ANG TOTAL', 200, 200],
  ['AFRC', 'AFRC TOTAL', 0, 0], ['ALL', 'ALL SERVICES — TOTAL BY MONTH', 1100, 1100]], tot: [[900, 900], [200, 200], [0, 0]] });
const viaInput = (ev, fn, file, fname) => ev(`new Promise(function(res){ var al=[], qs=[]; window.alert=function(m){ al.push(String(m)); };
  window.confirm=function(q){ qs.push(String(q)); return true; }; window.prompt=function(){ return '1'; };
  var inp={files:[new File([${J(file)}], ${J(fname)})], value:'x'};
  try{ ${fn}(inp); }catch(e){ al.push('THREW '+e.message); }
  (function wait(n){ if(inp.value==='' || n>600) return res(JSON.stringify({al:al, qs:qs.map(function(q){ return q.split('\\n')[0]; })})); setTimeout(function(){ wait(n+1); }, 5); })(0); })`);
const fullOf = (ev, file, fname) => JSON.parse(ev(`(function(){ var qs=[], al=[]; window.confirm=function(q){ qs.push(String(q)); return true; };
  window.alert=function(m){ al.push(String(m)); };
  var ret, threw=''; try{ ret=fullImportText(${J(file)}, ${J(fname)}); }catch(e){ threw=String((e&&e.message)||e); }
  return JSON.stringify({ret:ret, threw:threw, al:al, nq:qs.length}); })()`));
const capFile = (ev, code, type) => ev(`(function(){ var cap=null, _B=window.Blob;
  window.Blob=function(pt,o){ if(!cap && o && o.type===${J(type)}) cap=String(pt[0]); return new _B(pt,o); };
  window.confirm=function(){ return true; }; window.alert=function(){};
  try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
  try{ ${code} }catch(e){ cap='THREW '+e.message; } window.Blob=_B; return cap||''; })()`);
const del = (ev, i) => JSON.parse(ev(`(function(){ var qs=[]; window.confirm=function(q){ qs.push(String(q)); return true; }; rcnDel(${i});
  return JSON.stringify({qs:qs, list:rcnReg().map(function(e){ return (e && typeof e==='object')? [e.k, e.rcn] : e; }), r1:rcnAsgOf('R1')}); })()`));
const make = (wp, cy, asg) => {
  const X = boot();
  seed(X.ev, { services: SV, items: [it], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['R1'] });
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.awards={R1:{mode:'single', d:FYMON[2][0], day:3}}; MS.rcn=${J([K1])}; S.rcnAsg=${J(asg === '' ? {} : { R1: asg })};
    applyState(S); save(); window.confirm=function(){ return true; }; MS.base=MS.cur; blCyc='PB'; blYr=MS.cur; cycLock(); 'ok'`);
  const own = X.ev('buildSavedHtml()');
  X.ev(`MS.rcn=${J(wp)}; save(); blGet('PB|2027').rcn=${J(cy)}; persistCyc(); 'ok'`);
  return { own, file: X.ev('buildSavedHtml()') };
};
const takeWhole = (F, fname) => { const T = boot({ html: F.own }); const r = fullOf(T.ev, F.file, fname); const R = boot({ html: F.own, ls: lsOf(T.ev) }); return { r, R }; };
const lock = (ev, cyc, ans) => JSON.parse(ev(`(function(){ var qs=[]; window.confirm=function(q){ qs.push(String(q)); return ${ans}; };
  blCyc=${J(cyc)}; blYr=2027; cycLock(); var c=blGet(${J(cyc + '|2027')}); return JSON.stringify({qs:qs, made:!!c, locked:!!(c&&c.locked), rcn:c? c.rcn : null}); })()`));
const refused = al => al.some(m => /was not imported/.test(m));
// hand-written: the board's refusal sentences, read off the change and checked here word for word
const RULE = 'An RCN / EEIC list names each combination once, by a text key of its own.';
const NOW = 'This file says ORBIT v2.00 saved it, from a board that held such a list.';
const PLAN = 'A list that is not a locked cycle’s can be put right on a board of this version, in 🗂 RCN / EEIC, where ✕ on a row marked ⚠ repeats removes that row alone, and the file written again.';
const CYCLE = 'A locked cycle’s list stays as it was locked, and no board changes it, so ⬅ Import one appropriation and ⇊ Import several boards refuse every file that carries that cycle.';
const TOO = 'This file also carries a locked cycle whose RCN / EEIC list a file handed over is refused for.';
const OPENS = 'The file itself opens as a board.';
const FULL = 'A whole board of your own comes across with its lists as they are by 📁 File → ⬅ Import a full board, which says first what they hold. That replaces this board’s whole BAE list and execution data with the file’s, when it carries them, so it is not the way to take one appropriation.';
const END = ' Nothing on this board was changed.';
const Q = 'Lock the FYDP window as POM27?\n\nFY27 — every requirement, its value, allocation and funding by service, the PMO roll-up and the budget authority of each year — are copied whole and LOCKED.\n\nFY28, FY29, FY30, FY31 hold no plan yet and will be recorded as such.';
const QEND = '\n\nThe working board is not changed.';
const QL = what => '\n\nThe RCN / EEIC list it keeps ' + what + '. A locked cycle’s list stays as it was locked, so ⬅ Import one appropriation and ⇊ Import several boards will refuse every file that carries this cycle, on every board of this version.';
const WP2 = 'the RCN / EEIC list at the saved state.appns.om.rcn holds the key “K1” twice (rcn[0] and rcn[1]); a key names one combination';
const POM2 = 'the RCN / EEIC list at the saved state.cycDb.byAp.om.cycles.POM|2027.rcn holds the key “K1” twice (rcn[0] and rcn[1]); a key names one combination';
const PB2 = 'the RCN / EEIC list at the saved state.cycDb.byAp.om.cycles.PB|2027.rcn holds the key “K1” twice (rcn[0] and rcn[1]); a key names one combination';
const msg = (f, why, tail) => '“' + f + '” was not imported: ' + why + '.\n\n' + tail + END;

const mk0 = bootMark();
if (CASE === 'L') {
  const F = make([K1, K1], [K1], 'K1');
  const { r, R } = takeWhole(F, 'my board.html');
  chk('L · the own board takes its file whole (no alert)', [r.ret, r.al, r.threw], [true, [], '']);
  const c = lock(R.ev, 'POM', 'true');
  chk('L · 🔒 Lock POM27: asked once, word for word; locked; POM27 keeps [K1, K1] as asked', [c.qs, c.made, c.locked, c.rcn],
    [[Q + QL('holds the key “K1” twice (rcn[0] and rcn[1]); a key names one combination') + QEND], true, true, [K1, K1]]);
  chk('L · POM27 (bytes)', await sheet(R, 'POM|2027'), WANT('POM|2027', '11111 / AAAAA'));
  chk('L · PB27 (bytes)', await sheet(R, 'PB|2027'), WANT('PB|2027', '11111 / AAAAA'));
  chk('L · the working plan (bytes)', await sheet(R, ''), WANT('WP', '11111 / AAAAA'));
  const lsR = () => lsOf(R.ev);
  const sends = async (tag, why, tail) => {
    const files = { 'saved file': ['my board (saved).html', R.ev('buildSavedHtml()')], 'one-appropriation file': ['ORBIT — O&M only.html', R.ev(`oneAppnHtml(mySlug())||''`)] };
    const ls0 = lsR();
    for (const [what, [fname, txt]] of Object.entries(files)) {
      for (const [where, mkB] of [['FRESH', () => boot()], ['SAME', () => boot({ html: F.own, ls: ls0 })]]) {
        for (const fn of ['importState', 'importBoards']) { const mk = bootMark();
          const B = mkB(), held = lsOf(B.ev), x = JSON.parse(await viaInput(B.ev, fn, txt, fname));
          chk(`L ${tag} · ${what} → ${where} · ${fn}: the whole alert, storage unchanged`, [x.al, moved(held, lsOf(B.ev))], [[msg(fname, why[what], tail)], []]);
          bootRelease(mk, []); await settleBoards(); }
        { const mk = bootMark(); const B = mkB(), f = fullOf(B.ev, txt, fname);
          const B2 = where === 'FRESH' ? boot({ ls: lsOf(B.ev) }) : boot({ html: F.own, ls: lsOf(B.ev) });
          chk(`L ${tag} · ${what} → ${where} · ⬅ Import a full board: taken; reopened POM27 keeps [K1, K1]; POM27 money (bytes)`,
            [f.ret, f.al, JSON.parse(B2.ev(`JSON.stringify((blGet('POM|2027')||{}).rcn||null)`)), await sheet(B2, 'POM|2027')], [true, [], [K1, K1], WANT('POM|2027', '11111 / AAAAA')]);
          bootRelease(mk, []); await settleBoards(); }
      }
      { const mk = bootMark(); const O = boot({ html: txt });
        chk(`L ${tag} · ${what} opened itself: POM27 and the working plan (bytes)`, [await sheet(O, 'POM|2027'), await sheet(O, '')], [WANT('POM|2027', '11111 / AAAAA'), WANT('WP', '11111 / AAAAA')]);
        bootRelease(mk, []); await settleBoards(); }
    }
    return ls0;
  };
  // before ✕: the working plan's list is the first the door meets; the file carries POM27's as well
  await sends('before ✕', { 'saved file': WP2, 'one-appropriation file': 'the RCN / EEIC list at the saved state.appns.om.rcn holds the key “K1” twice (rcn[0] and rcn[1]); a key names one combination' },
    RULE + ' ' + NOW + ' ' + TOO + ' ' + CYCLE + ' ' + OPENS + ' ' + FULL);
  const pkg0 = capFile(R.ev, 'pkgIssue(mySlug(), true);', 'application/json'), pmo0 = capFile(R.ev, 'publishPmoCopy();', 'text/html');
  obs('L before ✕ · the door on its package and its PMO copy', [R.ev(`inboundCheck(${J(pkg0)})`), R.ev(`inboundCheck(${J(pmo0)})`)]);
  for (const [what, fname, txt] of [['package', 'ORBIT PACKAGE - O&M - issue 1.json', pkg0], ['PMO copy', 'PMO COPY.html', pmo0]]) {
    const mk = bootMark(); const B = boot(), held = lsOf(B.ev), x = JSON.parse(await viaInput(B.ev, 'importState', txt, fname));
    obs(`L before ✕ · ${what} → FRESH · File → Import`, x.al);
    chk(`L before ✕ · ${what} → FRESH · refused, storage unchanged`, [refused(x.al), moved(held, lsOf(B.ev))], [true, []]);
    bootRelease(mk, []); await settleBoards(); }
  const d = del(R.ev, 1);
  chk('L · ✕ on row 2: asked as a repeat; the list after; R1 still on K1', [d.qs, d.list, d.r1],
    [['Remove RCN 11111 / EEIC AAAAA?\n\nIt has the same key as row 1 (11111 / AAAAA), and every assignment to that key reads row 1, which stays. No assignment is changed.'], [['K1', '11111']], 'K1']);
  // after ✕: the files that carry POM27 are refused for POM27's list, as the lock said
  const lsAfter = await sends('after ✕', { 'saved file': POM2, 'one-appropriation file': POM2 }, RULE + ' ' + NOW + ' ' + CYCLE + ' ' + OPENS + ' ' + FULL);
  const pkg = capFile(R.ev, 'pkgIssue(mySlug(), true);', 'application/json'), pmo = capFile(R.ev, 'publishPmoCopy();', 'text/html');
  chk('L after ✕ · the door passes its package and its PMO copy', [R.ev(`inboundCheck(${J(pkg)})`), R.ev(`inboundCheck(${J(pmo)})`)], ['', '']);
  for (const [where, mkB, reB] of [['FRESH', () => boot(), B => boot({ ls: lsOf(B.ev) })], ['SAME', () => boot({ html: F.own, ls: lsAfter }), B => boot({ html: F.own, ls: lsOf(B.ev) })]]) {
    { const mk = bootMark(); const B = mkB(), held = lsOf(B.ev), x = JSON.parse(await viaInput(B.ev, 'importState', pkg, 'ORBIT PACKAGE - O&M - issue 1.json'));
      chk(`L after ✕ · package → ${where}: no alert, the plan written; reopened money (bytes)`, [x.al, moved(held, lsOf(B.ev)).indexOf('prio27om') >= 0, await sheet(reB(B), '')], [[], true, WANT('WP', '11111 / AAAAA')]);
      bootRelease(mk, []); await settleBoards(); }
    { const mk = bootMark(); const B = mkB(), x = JSON.parse(await viaInput(B.ev, 'importState', pmo, 'PMO COPY.html'));
      chk(`L after ✕ · PMO copy → ${where}: no alert; reopened money (bytes)`, [x.al, await sheet(reB(B), '')], [[], WANT('WP', '11111 / AAAAA')]);
      bootRelease(mk, []); await settleBoards(); }
  }
  { const mk = bootMark(); const PC = boot({ html: pmo });
    chk('L after ✕ · the PMO copy opened: the working plan (bytes)', await sheet(PC, ''), WANT('WP', '11111 / AAAAA'));
    const sub = PC.ev(`(function(){ var cap=null, _B=window.Blob;
      try{ localStorage.setItem('prio27who','J. Smith'); localStorage.setItem('prio27pmo','AV'); }catch(e){}
      window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
      window.alert=function(){}; window.confirm=function(){ return true; };
      try{ if(!S.titles) S.titles={}; S.titles.R1='Renamed by the office'; save(); pmoSubmit(); }catch(e){ cap='THREW '+e.message; } window.Blob=_B; return cap||''; })()`);
    chk('L after ✕ · the office’s submittal carries no RCN / EEIC list; the door passes it', [sub.length > 0, /"rcn"/.test(sub), R.ev(`inboundCheck(${J(sub)})`)], [true, false, '']);
    for (const [where, mkB] of [['FRESH', () => boot()], ['SAME', () => boot({ html: F.own, ls: lsAfter })]]) {
      const B = mkB(), held = lsOf(B.ev), x = JSON.parse(await viaInput(B.ev, 'importState', sub, 'ORBIT SUBMITTAL - AV - J Smith.json'));
      chk(`L after ✕ · submittal → ${where} · File → Import: no alert, storage unchanged (held for review)`, [x.al, moved(held, lsOf(B.ev))], [[], []]); }
    bootRelease(mk, []); await settleBoards(); }
}
if (CASE === 'U') {
  // the own board holding PB27 [K1, K1], taken whole; PB27 then UNLOCKED on it
  for (const route of ['delete', 'relock']) {
    const mk = bootMark();
    const F = make([K1], [K1, K1], 'K1');
    const { r, R } = takeWhole(F, 'my board.html');
    chk(`U ${route} · the own board takes its file whole (no alert)`, [r.ret, r.al], [true, []]);
    const uq = JSON.parse(R.ev(`(function(){ var qs=[]; window.confirm=function(q){ qs.push(String(q)); return true; }; blLock('PB|2027', false);
      return JSON.stringify({qs:qs, locked:blGet('PB|2027').locked}); })()`));
    chk(`U ${route} · 🔓 Unlock PB27: its question says unlocking lets it be overwritten or deleted; unlocked`, uq,
      { qs: ['Unlock PB27?\n\nA locked cycle is meant to be a fixed point in time. Unlocking lets it be overwritten or deleted. The unlock is stamped with your name.'], locked: false });
    const sv = R.ev('buildSavedHtml()');
    chk(`U ${route} · the saved file's PB27 is unlocked and holds [K1, K1]`, (c => [c.locked, c.rcn])(JSON.parse(sv.match(/id="pubState">([\s\S]*?)<\/script>/)[1]).cycDb.byAp.om.cycles['PB|2027']), [false, [K1, K1]]);
    { const B = boot(), held = lsOf(B.ev), x = JSON.parse(await viaInput(B.ev, 'importState', sv, 'my board (saved).html'));
      chk(`U ${route} · its saved file → FRESH · Import one appropriation: the whole alert, storage unchanged`, [x.al, moved(held, lsOf(B.ev))],
        [[msg('my board (saved).html', PB2, RULE + ' ' + NOW + ' ' + CYCLE + ' ' + OPENS + ' ' + FULL)], []]); }
    // what the board itself then lets the person do with that unlocked cycle
    if (route === 'delete') {
      const dq = JSON.parse(R.ev(`(function(){ var qs=[]; window.confirm=function(q){ qs.push(String(q)); return true; }; blDelete('PB|2027');
        return JSON.stringify({qs:qs, gone:!blGet('PB|2027')}); })()`));
      chk('U delete · 🗑 Delete PB27 on that board: asked; gone', dq, { qs: ['Delete the PB27 cycle?\n\nIt cannot be recovered.'], gone: true });
    } else {
      const c = JSON.parse(R.ev(`(function(){ var qs=[]; window.confirm=function(q){ qs.push(String(q)); return true; };
        blCyc='PB'; blYr=2027; cycLock(); var c=blGet('PB|2027'); return JSON.stringify({qs:qs, locked:c.locked, rcn:c.rcn}); })()`));
      obs('U relock · 🔒 Lock PB27 over the unlocked one: the question', c.qs);
      chk('U relock · 🔒 Lock PB27 over the unlocked one: replaced, locked, its list now [K1]', [c.qs.length, /This replaces the existing PB27 cycle\./.test(c.qs[0] || ''), c.locked, c.rcn], [1, true, true, [K1]]);
      chk('U relock · PB27 replaced (bytes)', await sheet(R, 'PB|2027'), WANT('PB|2027', '11111 / AAAAA'));
    }
    const sv2 = R.ev('buildSavedHtml()');
    { const B = boot(), held = lsOf(B.ev), x = JSON.parse(await viaInput(B.ev, 'importState', sv2, 'my board (saved).html'));
      obs(`U ${route} · its saved file written again → FRESH · Import one appropriation: alerts / storage moved`, { al: x.al, qs: x.qs, moved: moved(held, lsOf(B.ev)) });
      chk(`U ${route} · its saved file written again is TAKEN by Import one appropriation (the cycle the refusal said no board changes was ${route === 'delete' ? 'deleted' : 'replaced'} on the board)`, refused(x.al), false); }
    bootRelease(mk, []); await settleBoards();
  }
}
if (CASE === 'Q') {
  for (const [tag, wp, asg, what, lab] of [
    ['K1×3', [K1, K1, K1], 'K1', 'holds the key “K1” 3 times (rcn[0], rcn[1] and rcn[2]); a key names one combination', '11111 / AAAAA'],
    ['__none__, R1 on it', [K1, NN], '__none__', 'holds the key “__none__” (rcn[1]); a key beginning with two underscores is one the board keeps for its own bookkeeping', '22222 / BBBBB'],
    ['__none__, R1 on none', [K1, NN], '', 'holds the key “__none__” (rcn[1]); a key beginning with two underscores is one the board keeps for its own bookkeeping', NA]]) {
    const mk = bootMark();
    const F = make(wp, [K1], asg);
    const { r, R } = takeWhole(F, 'my board.html');
    const held = lsOf(R.ev), c0 = lock(R.ev, 'POM', 'false');
    chk(`Q ${tag} · taken whole; 🔒 Lock POM27 answered Cancel: the question word for word; nothing locked; storage unchanged`, [r.ret, c0.qs, c0.made, moved(held, lsOf(R.ev))], [true, [Q + QL(what) + QEND], false, []]);
    const c1 = lock(R.ev, 'POM', 'true');
    chk(`Q ${tag} · answered yes: POM27 keeps the list as asked`, [c1.made, c1.rcn], [true, wp]);
    chk(`Q ${tag} · POM27 (bytes)`, await sheet(R, 'POM|2027'), WANT('POM|2027', lab));
    chk(`Q ${tag} · the working plan (bytes)`, await sheet(R, ''), WANT('WP', lab));
    bootRelease(mk, []); await settleBoards();
  }
}
bootRelease(mk0, []); await settleBoards();
console.log(`\n${fails ? fails + ' FAILING of ' + n : 'ALL ' + n + ' PASSED'} (p8 ${CASE}) at ${et()}`);
process.exitCode = fails ? 1 : 0;
