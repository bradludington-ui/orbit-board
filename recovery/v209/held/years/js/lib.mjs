import { boot, seed } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
import { readFileSync } from 'node:fs';
export { boot, seed };
export const BOARDF = process.env.BOARD;
export const HTML = readFileSync(BOARDF, 'utf8');
export const J = JSON.stringify;
export const AR_FILL = `globalThis.__arSays=function(){ var $=function(id){ return document.getElementById(id); };
  return {open:!!($('addPanel') && $('addPanel').classList.contains('open')), btn:($('arAddBtn')||{}).textContent||'',
    ready:($('arReadyN')||{}).textContent||'', msg:($('arMsg')||{}).textContent||'', who:($('arWho')||{}).textContent||''}; };
globalThis.__arFill=function(o){
  var $=function(id){ return document.getElementById(id); };
  var put=function(id, v, evn){ var e=$(id); if(!e) throw new Error('the box has no #'+id);
    e.value=String(v); if(e.value!==String(v)) throw new Error('#'+id+' does not offer '+v); e.dispatchEvent(new Event(evn||'input')); };
  if(o.event!==undefined) put('arEvent', o.event);
  if(o.pt) $(o.pt==='OGC'? 'arPtO' : 'arPtP').click();
  if(o.ccar!==undefined) put('arCcar', o.ccar);
  if(o.pid!==undefined) put('arPid', o.pid);
  (o.v||[]).forEach(function(v,i){ put('arV'+i, v); });
  Object.keys(o.bud||{}).forEach(function(s){ put('arB'+SVC.indexOf(s), o.bud[s], 'change'); });
  if(o.ob!==undefined) put('arOb', o.ob, 'change');
  if(o.wbs!==undefined) put('arWbs', o.wbs);
  if(o.to!==undefined) put('arTo', o.to, 'change');
  if(o.end!==undefined) put('arEnd', o.end, 'change');
  if(o.mipr!==undefined) put('arMipr', o.mipr, 'change');
  if(o.desc!==undefined) put('arDesc', o.desc);
  if(o.cons!==undefined) put('arCons', o.cons);
  if(o.note!==undefined) put('arNote', o.note);
  return JSON.stringify(__arSays());
};
'ok'`;
export const v184Publish = (ev) => ev(`(function(){ let cap=null; const _B=window.Blob;
  window.Blob=function(pt,o){ if(!cap && o && o.type==='text/html') cap=String(pt[0]); return new _B(pt,o); };
  window.confirm=function(){ return true; }; try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
  try{ publishPmoCopy(); }catch(e){} window.Blob=_B; return cap||''; })()`);
export const v184Submit = (P, pmo, who='J. Smith') => JSON.parse(P.ev(`(function(){
  try{ ${who===null? "localStorage.removeItem('prio27who');" : "localStorage.setItem('prio27who','"+who+"');"} localStorage.setItem('prio27pmo','${pmo}'); }catch(e){}
  let cap=null; const _B=window.Blob;
  window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
  globalThis.__al=[]; const _a=window.alert; window.alert=function(m){ globalThis.__al.push(String(m)); };
  const _p=window.prompt; window.prompt=function(m){ globalThis.__al.push('PROMPT '+String(m)); return null; };
  try{ pmoSubmit(); }catch(e){ globalThis.__al.push('THREW '+e.message); } window.Blob=_B; window.alert=_a; window.prompt=_p;
  return JSON.stringify({pkg: cap? JSON.parse(cap) : null, alerts: globalThis.__al, stat:(document.getElementById('shareStat')||{}).textContent||''}); })()`));
export const w3file = (sc, extra = '') => { const b = boot({ html: HTML }); seed(b.ev, sc);
  b.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    applyState(S); ${extra}; save(); 'ok'`);
  return b.ev('buildSavedHtml()'); };
export const w3dlg = (ev, ans = []) => ev(`window.__dlg=[]; window.__ans=${JSON.stringify(ans)};
  window.alert=function(m){ window.__dlg.push(['alert', String(m)]); };
  window.confirm=function(m){ var a=window.__ans.length? window.__ans.shift() : true; window.__dlg.push(['confirm', String(m), a]); return a; };
  window.prompt=function(){ return '1'; }; 'ok'`);
export const w3said = (ev) => JSON.parse(ev(`JSON.stringify(window.__dlg.splice(0))`));
export const w209it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Rec ' + id, event: 'EV-' + id, ccar: '',
  fy26: ask.map(() => 0), ask, alloc: null });
export const W209_SC = { services: ['USAF', 'ANG', 'AFRC'],
  items: [w209it('A', 'PSM', [900, 200, 100]), w209it('B', 'PSM', [300, 80, 40]), w209it('C', 'AV', [500, 0, 0]), w209it('D', 'AV', [200, 0, 0])],
  disc: [3000, 600, 300], mand: [500, 100, 50], order: ['A', 'B', 'C', 'D'] };
export const w209add = (P, ev, v) => JSON.parse(P.ev(`(function(){ var n0=S.custom.length; toggleAdd(); var open=arOn();
  if(!open) return JSON.stringify({opened:false, btn:'', id:'', still:false});
  var f=JSON.parse(__arFill({event:${JSON.stringify(ev)}, pt:'PRIME',
  v:${JSON.stringify(v)}, ob:OB_CATS[0], to:'lm', desc:'Proposed: '+${JSON.stringify(ev)}, cons:'Stops without it.'}));
  document.getElementById('arAddBtn').click(); var n=(S.custom.length>n0)? (S.custom[S.custom.length-1]||{}).id||'' : '';
  return JSON.stringify({opened:open, btn:f.btn, id:n, still:arOn()}); })()`));
export const w209ev = (b, js) => { try { return b.ev(js); } catch (e) { return 'THREW ' + String((e && e.message) || e).slice(0, 120); } };
export const w209years = (ev) => JSON.parse(ev(`JSON.stringify(Object.keys(MS.years).map(Number).sort())`));
export const w209rvCopy = (html) => { const P = boot({ html }); P.ev(AR_FILL);
  P.ev(`window.alert=function(){}; window.confirm=function(){ return true; }; try{ localStorage.setItem('prio27who','PSM Lead'); localStorage.setItem('prio27pmo','PSM'); }catch(e){} render(); 'ok'`);
  return P; };
export const w209rvRows = (B) => JSON.parse(w209ev(B, `JSON.stringify(pmoRows().map(function(r){ return [r.fy, r.id, r.key, r.taken||null, r.takenElse||null]; }))`) || '[]');
export const w209rvFields = `['A','B','C','D'].forEach(function(id){ (S.ptype=S.ptype||{})[id]='PRIME'; (S.obCat=S.obCat||{})[id]=OB_CATS[0];
    (S.dest=S.dest||{})[id]={to:'lm', end:''}; S.desc[id]='Described '+id; S.cons[id]='Stops without '+id; });`;
export const w209rvBoard32 = () => w3file(W209_SC, `window.confirm=function(){ return true; }; window.alert=function(){};
  MS.years[2028]=JSON.parse(JSON.stringify(S)); delete MS.years[2027]; MS.base=2028; MS.cur=2028; FYMON=fyMonths(2028);
  applyState(MS.years[2028]); MS.years[2028]=S; ${w209rvFields} save();
  [2029,2030,2031].forEach(function(y){ switchYear(2028); switchYear(y); }); switchYear(2028); save()`);
export const w209rv2From = (P, y, src) => JSON.parse(w209ev(P, `(function(){ toggleAdd(); naFromPick(${y}); naFromTick(${JSON.stringify(src)}, true); naFromAdd();
    var c=S.custom[S.custom.length-1]||{}, o=arOn(); if(o) arHide(); return JSON.stringify({id:c.id||'', prior:c.prior||null}); })()`) || '{}');
export const w209rv2Cust = (B, y) => JSON.parse(w209ev(B, `JSON.stringify(((MS.years[${y}]||{}).custom||[]).map(function(c){ return {id:c.id, ev:c.event, prior:c.prior||null,
    from:c.from? {nid:c.from.nid, pub:+c.from.pub||0} : null}; }))`) || '[]');
export const w209rv2Plan = (B, src, id, y) => JSON.parse(w209ev(B, `(function(){ var keep=MS.cur; switchYear(${src}); rollPick={}; rollPick[${JSON.stringify(id)}]=1; rollYrs={}; rollYrs[${y}]=1;
    var p=rollPlan().per.map(function(x){ return [x.y, x.create, x.exists]; }); rollPick={}; rollYrs={}; switchYear(keep); return JSON.stringify(p); })()`) || '[]');
export const w209rv2Tick = (B, pred, ans = []) => { w3dlg(B.ev, ans); w209ev(B, `PMOPICK={}; pmoRows().forEach(function(r){ if((${pred})(r)) PMOPICK[pickKey(r)]=true; }); pmoApply(); 'ok'`); return w3said(B.ev); };
export const take = (B, pkg, fn) => { w3dlg(B.ev); w209ev(B, `PMOSUBS=[]; PMOPICK={}; pmoTake(${J(pkg)}, ${J(fn)}); 'ok'`); return w3said(B.ev); };
export const takeKeep = (B, pkg, fn) => { w3dlg(B.ev); w209ev(B, `pmoTake(${J(pkg)}, ${J(fn)}); 'ok'`); return w3said(B.ev); };
