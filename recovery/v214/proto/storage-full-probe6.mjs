import { boot, seed } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: id + ' title', event: id + ' event', ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
const FIX = { services: ['USAF', 'ANG'], items: [it('A', 'AV', [100, 20]), it('B', 'PSM', [50, 10])], disc: [120, 20], mand: [30, 10], order: ['A', 'B'] };
const fresh = () => { const B = boot(); seed(B.ev, FIX); B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); }); save(); render(); DIRTY=false; _persistFail=false; 'ok'`); return B; };
const QUOTA = room => `(function(){ const size=function(){ let t=0; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); t+=k.length+localStorage.getItem(k).length; } return t; };
  const LIM=size()+${room}; window.__si=window.__si||Storage.prototype.setItem; const si=window.__si;
  Storage.prototype.setItem=function(k, v){ v=String(v); const was=localStorage.getItem(k);
    if(size()-(was===null? 0 : k.length+was.length)+k.length+v.length>LIM) throw new DOMException('q', 'QuotaExceededError'); return si.call(this, k, v); }; return LIM; })()`;
const navs = B => B.errors.filter(e => /navigation/i.test(e)).length;
const bu = B => B.ev(`(function(){ const e=new Event('beforeunload', {cancelable:true}); window.dispatchEvent(e); return e.defaultPrevented; })()`);
const out = {};
const safe = (f) => { try { return f(); } catch (e) { return 'THREW: ' + String(e.message).slice(0, 80); } };
// opening-time vs later side refusals
{ const B = fresh();
  out.side = safe(() => JSON.parse(B.ev(`(function(){ const r={};
    _lsRefused={}; _lsRefused[DEST_KEY]=_sideBootGen; r.openingArms=memOnlyNow();
    _lsRefused[DEST_KEY]=_sideBootGen+1; r.laterArms=memOnlyNow(); _lsRefused={}; return JSON.stringify(r); })()`)));
  B.ev(QUOTA(30)); B.ev(`ACEDB.sets=ACEDB.sets||{}; ACEDB.sets.X={lines:['${'y'.repeat(200)}']}; persistAce(); 'ok'`);
  out.sideReal = safe(() => ({ memOnly: B.ev('memOnlyNow()'), bu: bu(B) }));
  // clearComputer while a list is on screen only: it sets _leaving, so the browser does not ask a second time
  B.ev(`window.__q=[]; window.confirm=function(q){ window.__q.push(String(q)); return true; }; 'ok'`);
  safe(() => B.ev('clearComputer(); "ok"'));
  out.clear = safe(() => ({ q0: JSON.parse(B.ev('JSON.stringify(window.__q)'))[0].split('\n\n').slice(-1)[0].slice(0, 120), bu: bu(B), leaving: B.ev('String(typeof _leaving==="undefined"? "undeclared" : _leaving)') }));
}
// a refused all-or-nothing write that was put back (item 140(c)'s shape)
{ const B = fresh(); B.ev(QUOTA(200));
  B.ev(`lsAll([[DEST_KEY, JSON.stringify({ts:1, ents:[]}), 'The destination list'], [ACEDB_KEY, 'x'.repeat(5000), 'The cost estimates']]); 'ok'`);
  out.putBack = safe(() => ({ memOnly: B.ev('memOnlyNow()'), unsaved: B.ev('unsavedNow()') }));
}
// after a downloaded copy: one question
{ const B = fresh(); B.ev(QUOTA(40)); B.ev(`S.notes.A='x'.repeat(80); save(); 'ok'`);
  B.ev(`publishState(); window.__q=[]; window.confirm=function(q){ window.__q.push(String(q)); return false; }; 'ok'`);
  const n0 = navs(B); safe(() => B.ev(`switchAppn('FULL FUND'); 'ok'`));
  out.dl = { dlOnly: B.ev('_dlOnly'), asked: +B.ev('window.__q.length'), first: (JSON.parse(B.ev('JSON.stringify(window.__q)'))[0] || '').slice(0, 140), reloadedOnCancel: navs(B) > n0 };
  B.ev(`window.confirm=function(){ return true; }; 'ok'`); const n1 = navs(B); safe(() => B.ev(`switchAppn('FULL FUND'); 'ok'`)); out.dl.reloadedOnOk = navs(B) > n1;
}
// diagnostics by kind
{ const B = fresh();
  B.ev(`localStorage.setItem('prio27om-cyc', 'c'.repeat(100)); localStorage.setItem('prio27acedb', 'a'.repeat(50)); localStorage.setItem('prio27om.kept', 'k'.repeat(30));
    localStorage.setItem('prio27om-pmo1790000000000', 'p'.repeat(70)); localStorage.setItem('prio27om-pmo1790000000000.base', '{}'); localStorage.setItem('prio27execdb-pmo1791111111111', 'e'.repeat(10));
    localStorage.setItem('vellichor-<img src=x>', 's'.repeat(400)); localStorage.setItem('zanzibar-secret-token', 'Brunhilde Okonkwo'); 'ok'`);
  const r = B.ev('diagReport()'); const i = r.indexOf('Storage by kind');
  out.diag = { block: i >= 0 ? r.slice(i, r.indexOf('Writes refused')).split('\n').map(s => s.replace(/\r$/, '')) : 'missing', leaks: /vellichor|zanzibar|Brunhilde|<img/.test(r) };
}
console.log(JSON.stringify(out, null, 1));
