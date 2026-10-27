// Skeptic repro: a proposal continuing a BOARD-ADDED requirement, into a year Apply starts by rolling forward.
// Own fixture: two services, base FY27, years FY27-FY29 started, FY29 holds the board-added NEW-1; FY30 not started.
import { boot, seed } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
import { readFileSync } from 'node:fs';
const BOARDF = process.argv[2];
const MODE = process.argv[3] || 'apply';        // apply | handroll | control-A | other-new1
const HTML = readFileSync(BOARDF, 'utf8');
const J = JSON.stringify;
const safe = (b, js) => { try { return b.ev(js); } catch (e) { return 'THREW ' + String(e && e.message || e).slice(0, 200); } };

const it = (id, g, ask) => ({ id, grp: g, team: g, sect: '', custom: false, title: 'Title ' + id, event: 'Event ' + id, ccar: '',
  fy26: ask.map(() => 0), ask, alloc: null });
const SC = { services: ['USAF', 'ANG'], items: [it('A', 'PSM', [700, 50]), it('B', 'AV', [300, 0])],
  disc: [5000, 500], mand: [400, 40], order: ['A', 'B'] };
const fill = `['A','B'].forEach(function(id){ (S.ptype=S.ptype||{})[id]='PRIME'; (S.obCat=S.obCat||{})[id]=OB_CATS[0];
  (S.dest=S.dest||{})[id]={to:'lm', end:''}; S.desc[id]='Desc '+id; S.cons[id]='Cons '+id; });`;
const mk = (ev, ask) => `reqCreate('PSM', {title:'', event:${J(ev)}, ask:${J(ask)}}, null,
  {event:${J(ev)}, ptype:'PRIME', obCat:OB_CATS[0], to:'lm', end:'', desc:'D '+${J(ev)}, cons:'C '+${J(ev)}})`;

// --- build the board file
const b0 = boot({ html: HTML }); seed(b0.ev, SC);
b0.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
  applyState(S); ${fill} save();
  window.confirm=function(){ return true; }; window.alert=function(){};
  switchYear(2028); switchYear(2027); switchYear(2029);   // FY28 and FY29 rolled forward from FY27
  ${MODE === 'other-new1' ? `switchYear(2027); window.__o=${mk('Other FY27 thing', [111, 0])}; save(); switchYear(2029);` : ''}
  window.__n=${mk('Gamma board-added', [400, 0])}; save(); switchYear(2027); save(); 'ok'`);
const fileHtml = b0.ev('buildSavedHtml()');
const B = boot({ html: fileHtml });
B.ev(`window.confirm=function(){ return true; }; window.alert=function(){}; try{ localStorage.setItem('prio27who','Lead'); }catch(e){} 'ok'`);
console.log('years', B.ev(`JSON.stringify(Object.keys(MS.years))`), 'base', B.ev('MS.base'), 'cur', B.ev('MS.cur'));
console.log('FY29 custom', B.ev(`JSON.stringify((MS.years[2029].custom||[]).map(function(c){ return [c.id,c.event,c.prior||null]; }))`));
console.log('FY27 custom', B.ev(`JSON.stringify((MS.years[2027].custom||[]).map(function(c){ return [c.id,c.event,c.prior||null]; }))`));

// --- publish a copy
const copyHtml = B.ev(`(function(){ let cap=null; const _B=window.Blob;
  window.Blob=function(pt,o){ if(!cap && o && o.type==='text/html') cap=String(pt[0]); return new _B(pt,o); };
  try{ publishPmoCopy(); }catch(e){ return 'THREW '+e.message; } window.Blob=_B; return cap||''; })()`);
if (!copyHtml || copyHtml.startsWith('THREW')) { console.log('no copy', copyHtml.slice(0, 200)); process.exit(1); }
const P = boot({ html: copyHtml });
P.ev(`window.alert=function(){}; window.confirm=function(){ return true; }; try{ localStorage.setItem('prio27who','PSM person'); localStorage.setItem('prio27pmo','PSM'); }catch(e){} render(); 'ok'`);
console.log('copy SANDBOX', P.ev('String(SANDBOX)'), 'yn', P.ev('JSON.stringify(PMODE.yn||null)'));
// --- in the copy: FY30 (not started on the board), bring in from FY29 the requirement the source names
const srcId = MODE === 'control-A' ? 'A' : 'NEW-1';
console.log('switch FY30', safe(P, `switchYear(2030); MS.cur`));
const brought = safe(P, `(function(){ toggleAdd(); naFromPick(2029); var rows=naFromRows(2029,'PSM').map(function(r){ return [r.id, !!r.here, r.need.length]; });
  naFromTick(${J(srcId)}, true); naFromAdd(); var c=S.custom[S.custom.length-1]||{}; if(arOn()) arHide();
  return JSON.stringify({rows:rows, id:c.id, prior:c.prior||null, ev:c.event}); })()`);
console.log('copy brought in', brought);
safe(P, `switchYear(2027); 'ok'`);
const sub = JSON.parse(P.ev(`(function(){ let cap=null; const _B=window.Blob; const al=[];
  window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
  window.alert=function(m){ al.push(String(m)); }; window.prompt=function(){ return null; };
  try{ pmoSubmit(); }catch(e){ al.push('THREW '+e.message); } window.Blob=_B; return JSON.stringify({pkg:cap? JSON.parse(cap) : null, al:al}); })()`));
console.log('submitted', !!sub.pkg, 'alerts', J(sub.al).slice(0, 300));
if (!sub.pkg) process.exit(1);

// --- at the board: take it
B.ev(`window.__q=[]; window.__a=[]; window.alert=function(m){ window.__q.push(['alert',String(m)]); };
  window.confirm=function(m){ var a=window.__a.length? window.__a.shift() : true; window.__q.push(['confirm',String(m),a]); return a; }; 'ok'`);
safe(B, `PMOSUBS=[]; PMOPICK={}; pmoTake(${J(sub.pkg)}, 'psm-sub.json'); 'ok'`);
const took = JSON.parse(B.ev('JSON.stringify(window.__q.splice(0))'));
console.log('take said', J(took.map(x => x[1].slice(0, 160))));
safe(B, `switchYear(2029); 'ok'`);
if (MODE === 'handroll') {
  // the team starts FY30 by hand (switchYear's ROLL FORWARD), then reviews
  B.ev(`window.__a=[true]; 'ok'`);
  safe(B, `switchYear(2030); switchYear(2029); 'ok'`);
  B.ev('window.__q.splice(0); "ok"');
  console.log('FY30 started by hand', B.ev(`JSON.stringify((MS.years[2030].custom||[]).map(function(c){ return [c.id,c.event,c.prior||null]; }))`));
}
const rows = JSON.parse(safe(B, `JSON.stringify(pmoRows().map(function(r){ return [r.fy, r.id, r.key]; }))`));
console.log('rows', J(rows));
const review = safe(B, `(function(){ subOpen=true; subBody(); return JSON.stringify([].slice.call(document.querySelectorAll('#subBody .subroll, #subBody .subhere')).map(function(e){ return e.className+': '+e.textContent; })); })()`);
console.log('review warnings', review);
const priorHereNow = safe(B, `(function(){ var r=pmoRows().filter(function(r){ return r.key==='__new'; })[0]; if(!r) return 'no row';
  return JSON.stringify({onScreen:pmoPriorHere(r.prop.prior, r.fy, pmoRowFrom(r), S), started:pmoPriorHere(r.prop.prior, r.fy, pmoRowFrom(r))}); })()`);
console.log('pmoPriorHere', priorHereNow);
// --- Apply, roll forward chosen; any duplicate question answered OK (accept)
B.ev(`window.__a=[true, true, true]; 'ok'`);
safe(B, `PMOPICK={}; pmoRows().forEach(function(r){ if(r.key==='__new') PMOPICK[pickKey(r)]=true; }); pmoApply(); 'ok'`);
const said = JSON.parse(B.ev('JSON.stringify(window.__q.splice(0))'));
said.forEach(x => console.log('  ASKED', x[0], J(x[1].slice(0, 700)), '->', x[2]));
console.log('FY30 custom', B.ev(`JSON.stringify(((MS.years[2030]||{}).custom||[]).map(function(c){ return [c.id,c.event,c.prior||null,c.from? c.from.nid : null, c.ask]; }))`));
console.log('FY30 order', B.ev(`JSON.stringify((MS.years[2030]||{}).order||null)`));
console.log('board rule (on FY29): yearHas NEW-1 in FY30 =', safe(B, `String(yearHas('NEW-1', 2030))`), '; yearLinkOf =', safe(B, `yearLinkOf('NEW-1', 2030)`));
// value counted in FY30
safe(B, `switchYear(2030); 'ok'`);
console.log('FY30 asks of the two', safe(B, `JSON.stringify(S.order.map(function(id){ var i=itemById(id); return [id, i && i.event, i && i.ask]; }))`));
console.log('FY30 total requirement', safe(B, `String(S.order.reduce(function(a,id){ var i=itemById(id); return a+(i? i.ask.reduce(function(x,y){return x+y;},0):0); },0))`));
console.log('errors', B.errors.length, P.errors.length, J(B.errors.slice(0, 3)).slice(0, 300));
