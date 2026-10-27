// Skeptic's own repro: two PSM copies out at once, each proposes in FY28 and continues it into FY29;
// the board accepts only the FY29 continuations, then rolls both forward.
import { boot, seed } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
import { readFileSync } from 'node:fs';
const BOARD = process.env.BOARD; const HTML = readFileSync(BOARD, 'utf8');
const J = JSON.stringify;
const out = (...a) => console.log(...a);
const tryEv = (b, js) => { try { return b.ev(js); } catch (e) { return 'THREW ' + String(e && e.message || e).slice(0, 200); } };

const it = (id, ask) => ({ id, grp: 'PSM', team: 'PSM', sect: '', custom: false, title: 'Rec ' + id, event: 'EV-' + id, ccar: '',
  fy26: ask.map(() => 0), ask, alloc: null });
const SC = { services: ['USAF', 'ANG', 'AFRC'], items: [it('A', [900, 200, 100]), it('B', [300, 80, 40])],
  disc: [3000, 600, 300], mand: [500, 100, 50], order: ['A', 'B'] };

// 1. a board based on FY28, FY29-FY31 started by roll forward
const b0 = boot({ html: HTML }); seed(b0.ev, SC);
b0.ev(`window.confirm=function(){ return true; }; window.alert=function(){};
  BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S);
  MS.years[2028]=JSON.parse(JSON.stringify(S)); delete MS.years[2027]; MS.base=2028; MS.cur=2028; FYMON=fyMonths(2028);
  applyState(MS.years[2028]); MS.years[2028]=S;
  ['A','B'].forEach(function(id){ (S.ptype=S.ptype||{})[id]='PRIME'; (S.obCat=S.obCat||{})[id]=OB_CATS[0];
    (S.dest=S.dest||{})[id]={to:'lm', end:''}; S.desc[id]='D '+id; S.cons[id]='C '+id; });
  save(); [2029,2030,2031].forEach(function(y){ switchYear(2028); switchYear(y); }); switchYear(2028); save(); 'ok'`);
const boardHtml = b0.ev('buildSavedHtml()');
const B = boot({ html: boardHtml });
B.ev(`window.confirm=function(){ return true; }; window.alert=function(){}; 'ok'`);
out('board years', B.ev(`JSON.stringify(Object.keys(MS.years))`), 'cur', B.ev('MS.cur'));

const publish = () => B.ev(`(function(){ var cap=null, _B=window.Blob;
  window.Blob=function(pt,o){ if(!cap && o && o.type==='text/html') cap=String(pt[0]); return new _B(pt,o); };
  try{ localStorage.setItem('prio27who','Lead'); }catch(e){}
  try{ publishPmoCopy(); }catch(e){ cap='THREW '+e.message; } window.Blob=_B; return cap||''; })()`);
const hA = publish();
B.ev(`(function(){ var t=Date.now(); while(Date.now()<=t+3){} return 'ok'; })()`);
const hB = publish();
out('copies', hA.length, hB.length);

const openCopy = (h) => { const P = boot({ html: h });
  P.ev(`window.alert=function(){}; window.confirm=function(){ return true; };
    try{ localStorage.setItem('prio27who','PSM Lead'); localStorage.setItem('prio27pmo','PSM'); }catch(e){} render(); 'ok'`); return P; };
const PA = openCopy(hA), PB = openCopy(hB);
out('copy A pub', PA.ev('PMODE.ts||PMODE.pub||JSON.stringify(Object.keys(PMODE))'), 'years', PA.ev('JSON.stringify(PMODE.yb? Object.keys(PMODE.yb):null)'));

// Add box, filled through its controls
const addNew = (P, ev, v) => JSON.parse(tryEv(P, `(function(){ var n0=S.custom.length; toggleAdd(); if(!arOn()) return JSON.stringify({err:'not open'});
  var $=function(i){ return document.getElementById(i); };
  var put=function(i,val,e){ var x=$(i); x.value=String(val); x.dispatchEvent(new Event(e||'input')); };
  put('arEvent', ${J(ev)}); $('arPtP').click();
  ${J(v)}.forEach(function(x,i){ put('arV'+i, x); });
  put('arOb', OB_CATS[0], 'change'); put('arTo', 'lm', 'change'); put('arDesc', 'Desc '+${J(ev)}); put('arCons', 'Impact '+${J(ev)});
  $('arAddBtn').click(); var c=S.custom.length>n0? S.custom[S.custom.length-1] : null;
  return JSON.stringify({id:c&&c.id, still:arOn(), btn:$('arAddBtn')? $('arAddBtn').textContent : ''}); })()`));
const fromYear = (P, y, src) => JSON.parse(tryEv(P, `(function(){ toggleAdd(); naFromPick(${y}); naFromTick(${J(src)}, true); naFromAdd();
  var c=S.custom[S.custom.length-1]||{}; if(arOn()) arHide(); return JSON.stringify({id:c.id, prior:c.prior||null, ev:c.event}); })()`));

const a28 = addNew(PA, 'Alpha (copy A)', [300, 0, 0]);
const b28 = addNew(PB, 'Bravo (copy B)', [500, 0, 0]);
out('FY28 adds', J(a28), J(b28));
tryEv(PA, `switchYear(2029); 'ok'`); const a29 = fromYear(PA, 2028, a28.id); tryEv(PA, `switchYear(2028); 'ok'`);
tryEv(PB, `switchYear(2029); 'ok'`); const b29 = fromYear(PB, 2028, b28.id); tryEv(PB, `switchYear(2028); 'ok'`);
out('FY29 continuations', J(a29), J(b29));

const submit = (P) => JSON.parse(tryEv(P, `(function(){ var cap=null, _B=window.Blob, al=[];
  window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
  var _a=window.alert; window.alert=function(m){ al.push(String(m)); };
  try{ pmoSubmit(); }catch(e){ al.push('THREW '+e.message); } window.Blob=_B; window.alert=_a;
  return JSON.stringify({pkg:cap? JSON.parse(cap):null, al:al}); })()`));
const sA = submit(PA), sB = submit(PB);
out('pkg A added', J((sA.pkg && sA.pkg.added || []).map(a => [a.nid, a.fy, a.prior])), 'alerts', J(sA.al).slice(0, 200));
out('pkg B added', J((sB.pkg && sB.pkg.added || []).map(a => [a.nid, a.fy, a.prior])));

const dlg = () => B.ev(`window.__d=[]; window.alert=function(m){ window.__d.push(['alert',String(m)]); };
  window.confirm=function(m){ window.__d.push(['confirm',String(m)]); return true; }; 'ok'`);
const said = () => JSON.parse(B.ev(`JSON.stringify(window.__d.splice(0))`));
const takeApply = (pkg, fn) => { dlg(); tryEv(B, `PMOSUBS=[]; PMOPICK={}; pmoTake(${J(pkg)}, ${J(fn)}); 'ok'`);
  const rows = JSON.parse(tryEv(B, `JSON.stringify(pmoRows().map(function(r){ return [r.fy, r.id, r.key, r.taken||null]; }))`));
  const html = tryEv(B, `(function(){ var e=document.getElementById('subBody')||document.getElementById('subPanel'); return e? e.textContent : ''; })()`);
  const here = tryEv(B, `JSON.stringify(pmoRows().filter(function(r){ return r.key==='__new'; }).map(function(r){ return [r.fy, r.prop && r.prop.event, r.prop && r.prop.prior, pmoPriorHere(r.prop.prior, r.fy, pmoRowFrom(r))]; }))`);
  tryEv(B, `PMOPICK={}; pmoRows().forEach(function(r){ if(r.key==='__new' && r.fy===2029) PMOPICK[pickKey(r)]=true; }); pmoApply(); 'ok'`);
  return { rows, here, said: said() }; };

const subText = () => tryEv(B, `(function(){ subOpenReview(); var e=document.getElementById('subBody'); return e? e.textContent : ''; })()`);
const cust = (y) => JSON.parse(tryEv(B, `JSON.stringify(((MS.years[${y}]||{}).custom||[]).map(function(c){ return {id:c.id, ev:c.event, prior:c.prior||null, from:c.from? {nid:c.from.nid, pub:c.from.pub}:null}; }))`));
const rollOne = (id) => { dlg(); const r = tryEv(B, `(function(){ var k=MS.cur; switchYear(2029); rollPick={}; rollPick[${J(id)}]=1; rollYrs={}; rollYrs[2030]=1;
  var plan=rollPlan(); rollApply(); var st=document.getElementById('shareStat').textContent; switchYear(k); return JSON.stringify({create:plan.create, exists:plan.exists, st:st}); })()`); said(); return r; };
// variant: B's FY29 continuation accepted first, the team rolls it into FY30 (stamped B); then A's FY29 continuation is
// accepted, and the team rolls it into FY30
const take = (pkg, fn) => { dlg(); tryEv(B, `PMOSUBS=[]; PMOPICK={}; pmoTake(${J(pkg)}, ${J(fn)}); 'ok'`); said(); };
const tickApply = () => { dlg(); tryEv(B, `PMOPICK={}; pmoRows().forEach(function(r){ if(r.key==='__new' && r.fy===2029) PMOPICK[pickKey(r)]=true; }); pmoApply(); 'ok'`); return said(); };
take(sB.pkg, 'b.json'); tickApply();
const bravo29 = cust(2029)[0]; out('FY29 after B', J(cust(2029)));
out('roll Bravo', rollOne(bravo29.id)); out('FY30', J(cust(2030)));
take(sA.pkg, 'a.json');
const t = subText(); const m = t.match(/FY29 ALREADY HOLDS[^—]*—[^A-Z]*/); out('review of A shows', m ? m[0] : '(no ALREADY HOLDS)');
tickApply(); out('FY29 after A', J(cust(2029)));
const alpha29 = cust(2029).find(c => /Alpha/.test(c.ev));
out('yearHas(Alpha,2030)', tryEv(B, `(function(){ var k=MS.cur; switchYear(2029); var r=yearHas(${J(alpha29.id)}, 2030)+' link '+yearLinkOf(${J(alpha29.id)}, 2030); switchYear(k); return r; })()`));
out('roll Alpha', rollOne(alpha29.id)); out('FY30 final', J(cust(2030)));
// RECORD panel line of FY30's Bravo (priorLink) -- does it name the right work?
out('priorTxt FY30', tryEv(B, `(function(){ var k=MS.cur; switchYear(2030); var r=S.custom.map(function(c){ return c.id+': '+(typeof priorTxt==='function'? priorTxt(c) : ''); }).join(' | '); switchYear(k); return r; })()`));
out('errors', B.errors.length, J(B.errors.slice(0, 2)));
