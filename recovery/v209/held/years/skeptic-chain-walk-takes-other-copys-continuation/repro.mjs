// Skeptic's own reproduction: two PSM copies out at once; does pmoPriorHere name the OTHER copy's work as a duplicate?
// usage: BOARD=<board.html> MODE=unstarted|existing node repro.mjs
import { boot, seed } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
import { readFileSync } from 'node:fs';
const HTML = readFileSync(process.env.BOARD, 'utf8');
const MODE = process.env.MODE || 'unstarted';
const J = JSON.stringify;
const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Board req ' + id, event: 'EVT ' + id, ccar: '',
  fy26: ask.map(() => 0), ask, alloc: null });
const SC = { services: ['USAF', 'ANG'], items: [it('R1', 'PSM', [700, 100]), it('R2', 'AV', [400, 50])],
  disc: [2000, 300], mand: [400, 60], order: ['R1', 'R2'] };
const tryEv = (b, js) => { try { return b.ev(js); } catch (e) { return 'THREW ' + String(e && e.message || e).slice(0, 200); } };

// ---- the board: base FY28, FY29 started; FY30 started too in MODE=existing
const B0 = boot({ html: HTML }); seed(B0.ev, SC);
const lastYr = MODE === 'existing' ? 2030 : 2029;
B0.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
  applyState(S); window.confirm=function(){ return true; }; window.alert=function(){};
  MS.years[2028]=JSON.parse(JSON.stringify(S)); delete MS.years[2027]; MS.base=2028; MS.cur=2028; FYMON=fyMonths(2028);
  applyState(MS.years[2028]); MS.years[2028]=S;
  ['R1','R2'].forEach(function(id){ (S.ptype=S.ptype||{})[id]='PRIME'; (S.obCat=S.obCat||{})[id]=OB_CATS[0];
    (S.dest=S.dest||{})[id]={to:'lm', end:''}; S.desc[id]='Desc '+id; S.cons[id]='Cons '+id; }); save();
  for(var y=2029;y<=${lastYr};y++){ switchYear(y-1); switchYear(y); } switchYear(2028); save(); 'ok'`);
const boardHtml = B0.ev('buildSavedHtml()');
const B = boot({ html: boardHtml });
B.ev(`window.confirm=function(){ return true; }; window.alert=function(){}; try{ localStorage.setItem('prio27who','Portfolio'); }catch(e){} 'ok'`);
const publish = () => B.ev(`(function(){ var cap=null, _B=window.Blob;
  window.Blob=function(pt,o){ if(!cap && o && o.type==='text/html') cap=String(pt[0]); return new _B(pt,o); };
  try{ publishPmoCopy(); }catch(e){} window.Blob=_B; return cap||''; })()`);
const hA = publish();
B.ev(`(function(){ var t=Date.now(); while(Date.now()<t+5){} return 1; })()`);
const hB = publish();
console.log('published', hA.length > 0, hB.length > 0);

const copy = (html) => { const P = boot({ html });
  P.ev(`window.alert=function(){}; window.confirm=function(){ return true; };
    try{ localStorage.setItem('prio27who','PSM lead'); localStorage.setItem('prio27pmo','PSM'); }catch(e){} render(); 'ok'`); return P; };
const addBox = (P, evt, v) => tryEv(P, `(function(){ var n0=S.custom.length; toggleAdd(); if(!arOn()) return 'box did not open';
    var $=function(i){ return document.getElementById(i); };
    var put=function(i,val,e){ var x=$(i); x.value=String(val); x.dispatchEvent(new Event(e||'input')); };
    put('arEvent', ${J(evt)}); $('arPtP').click();
    ${J(v)}.forEach(function(x,i){ put('arV'+i, x); });
    put('arOb', OB_CATS[0], 'change'); put('arTo', 'lm', 'change'); put('arDesc', 'Desc of '+${J(evt)}); put('arCons', 'Stops: '+${J(evt)});
    $('arAddBtn').click(); var c=S.custom[S.custom.length-1]; return S.custom.length>n0? c.id : ('not added: '+$('arAddBtn').textContent); })()`);
const bring = (P, y, from, src) => tryEv(P, `(function(){ switchYear(${y}); toggleAdd(); naFromPick(${from}); naFromTick(${J(src)}, true); naFromAdd();
    if(arOn()) arHide(); var c=S.custom[S.custom.length-1]||{}; var r=JSON.stringify({fy:MS.cur, id:c.id, ev:c.event, prior:c.prior}); switchYear(2028); return r; })()`);
const submit = (P) => JSON.parse(P.ev(`(function(){ var cap=null, _B=window.Blob;
  window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
  window.prompt=function(){ return null; }; try{ pmoSubmit(); }catch(e){} window.Blob=_B; return cap||'null'; })()`));

const PA = copy(hA), PB = copy(hB);
const a28 = addBox(PA, 'ALPHA (copy A)', [111, 0]);
const a29 = bring(PA, 2029, 2028, a28);
const b28 = addBox(PB, 'BRAVO (copy B)', [222, 0]);
const b29 = bring(PB, 2029, 2028, b28);
const b30 = bring(PB, 2030, 2029, JSON.parse(b29).id);
console.log('copy A', a28, a29);
console.log('copy B', b28, b29, b30);
const pkA = submit(PA), pkB = submit(PB);
console.log('pkg A fromTs', pkA && pkA.fromTs, 'added', J((pkA.added || []).map(a => [a.fy, a.nid, a.event, a.prior])));
console.log('pkg B fromTs', pkB && pkB.fromTs, 'added', J((pkB.added || []).map(a => [a.fy, a.nid, a.event, a.prior])));

// ---- at the board: take A, accept Alpha's FY29 only
const dlg = (ans) => B.ev(`window.__d=[]; window.__a=${J(ans)};
  window.confirm=function(m){ var a=window.__a.length? window.__a.shift() : true; window.__d.push(['confirm', String(m), a]); return a; };
  window.alert=function(m){ window.__d.push(['alert', String(m)]); }; 'ok'`);
const said = () => JSON.parse(B.ev(`JSON.stringify(window.__d.splice(0))`));
dlg([]); tryEv(B, `PMOSUBS=[]; PMOPICK={}; pmoTake(${J(pkA)}, 'pmo-PSM-A.json'); 'ok'`); said();
dlg([]); tryEv(B, `PMOPICK={}; pmoRows().forEach(function(r){ if(r.key==='__new' && r.fy===2029) PMOPICK[pickKey(r)]=true; }); pmoApply(); 'ok'`);
console.log('apply A said', J(said().map(x => x[1].slice(0, 120))));
const yrCust = (y) => JSON.parse(B.ev(`JSON.stringify(((MS.years[${y}]||{}).custom||[]).map(function(c){ return [c.id, c.event, c.prior||null, c.from||null]; }))`));
console.log('board FY29 custom', J(yrCust(2029)));
if (MODE === 'existing') {
  // the team rolls Alpha's FY29 requirement on into FY30 by hand
  const aid = yrCust(2029).filter(c => /ALPHA/.test(c[1]))[0][0];
  dlg([]); tryEv(B, `switchYear(2029); rollPick={}; rollPick[${J(aid)}]=1; rollYrs={}; rollYrs[2030]=1; rollApply(); switchYear(2028); save(); 'ok'`); said();
  console.log('board FY30 custom', J(yrCust(2030)));
}
// ---- take B
const VIEW = +(process.env.VIEW || 2028);
dlg([]); tryEv(B, `PMOSUBS=[]; PMOPICK={}; pmoTake(${J(pkB)}, 'pmo-PSM-B.json'); switchYear(${VIEW}); 'ok'`); if (process.env.ACC29) { dlg([]); tryEv(B, `PMOPICK={}; pmoRows().forEach(function(r){ if(r.key==='__new' && r.fy===2029) PMOPICK[pickKey(r)]=true; }); pmoApply(); 'ok'`);
  console.log('accepted Bravo FY29 first', J(said().map(x => x[1].slice(0, 100))), J(yrCust(2029).map(c => [c[0], c[1], c[2]]))); }
console.log('viewing', B.ev('MS.cur')); console.log('take B said', J(said().map(x => x[1].slice(0, 160))));
const rows = JSON.parse(B.ev(`JSON.stringify(pmoRows().filter(function(r){ return r.key==='__new'; }).map(function(r){
  var from=pmoRowFrom(r), here=r.prop.prior? pmoPriorHere(r.prop.prior, r.fy, from) : '',
      roll=(r.prop.prior && !(MS.years||{})[r.fy])? pmoPriorHere(r.prop.prior, r.fy, from, S) : '';
  // whose copy is the requirement named? (its link's stamp or its own provenance)
  var T=(MS.years||{})[r.fy]||S, nm=here||roll, hit=nm? ((T.custom||[]).concat(S.custom||[]).filter(function(c){ return c.id===nm; })[0]||null) : null;
  return {fy:r.fy, ev:r.prop.event, nid:r.prop.nid, prior:r.prop.prior, from:from, here:here, rollWouldHold:roll,
          namedIs: hit? [hit.event, (typeof pmoLinkStamp==='function')? pmoLinkStamp(hit) : (hit.from? {pmo:hit.from.pmo, pub:hit.from.pub} : null)] : null}; }))`));
rows.forEach(r => console.log('ROW', J(r)));
// the review as drawn
const drawn = JSON.parse(tryEv(B, `(function(){ subOpen=true; subBody(); return JSON.stringify([].slice.call(document.querySelectorAll('#subBody .subhere, #subBody .subroll')).map(function(e){ return e.textContent; })); })()`) || '[]');
console.log('review flags drawn', J(drawn));
// ---- tick Bravo's FY30 row only and apply; answer: OK apply, OK roll (if asked), Cancel the duplicate question
dlg([true, true, false]);
tryEv(B, `PMOPICK={}; pmoRows().forEach(function(r){ if(r.key==='__new' && r.fy===2030) PMOPICK[pickKey(r)]=true; }); pmoApply(); 'ok'`);
said().forEach(x => console.log('SAID', x[0], J(x[1].slice(0, 700)), x[2]));
console.log('board FY30 custom after', J(yrCust(2030).map(c => [c[0], c[1]])));
console.log('stat', B.ev(`(document.getElementById('shareStat')||{}).textContent||''`).slice(0, 300));
const still = JSON.parse(B.ev(`JSON.stringify(pmoRows().filter(function(r){ return r.key==='__new'; }).map(function(r){ return [r.fy, r.prop.event, !!r.taken]; }))`));
console.log('still held', J(still));
console.log('errors', B.errors.length, PA.errors.length, PB.errors.length, J(B.errors.slice(0, 3)));
