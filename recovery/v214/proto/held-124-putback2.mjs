import { readFileSync } from 'node:fs';
import { boot, seed } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
const HTML = readFileSync(process.env.BOARD, 'utf8'); const J = JSON.stringify;
const mk = (id, ask) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Req ' + id, event: 'E' + id, ccar: '', fy26: [0, 0, 0], ask, alloc: null });
const B = boot({ html: HTML });
seed(B.ev, { services: ['USAF','ANG','AFRC'], items: [mk('A', [900, 200, 100])], disc: [2000, 600, 300], mand: [500, 150, 80], order: ['A'] });
B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); window.confirm=function(){ return true; }; window.alert=function(){}; 'ok'`);
const ids = JSON.parse(B.ev(`(function(){ var a=reqCreate('AV', {title:'X', event:'EX', ask:[100,0,0]}); var b=reqCreate('AV', {title:'Y', event:'EY', ask:[200,0,0]}); var c=reqCreate('AV', {title:'Z', event:'EZ', ask:[300,0,0]}); save(); jrnlSync(); return JSON.stringify([a,b,c]); })()`));
console.log('ids', J(ids));
// change Y's value for USAF (a minute later, another person, to get its own line)
B.ev(`(function(){ var real=Date.now; Date.now=function(){ return real.call(Date)+61000; }; return 'ok'; })()`);
B.ev(`setAsk(${J(ids[1])}, 0, '250'); 'ok'`);
const e = JSON.parse(B.ev(`JSON.stringify((MS.jrnl||[]).map(function(e,i){ return [i, e.p, e.a, e.b]; }).filter(function(x){ return x[1][0]==='custom'; }))`));
console.log('custom entries', J(e));
const yi = e.filter(x => J(x[1].slice(2)) === J(['ask', 0]) && x[3] === 250).map(x => x[0]).pop();
// delete X, above Y
B.ev(`(function(){ var real=Date.now; Date.now=function(){ return real.call(Date)+122000; }; return 'ok'; })()`);
B.ev(`removeReq(${J(ids[0])}); 'ok'`);
console.log('after delete: custom', B.ev(`JSON.stringify(S.custom.map(function(c){ return [c.id, c.ask[0]]; }))`), '| journal lines', B.ev('(MS.jrnl||[]).length'));
B.ev(`jrnlUndo(${yi}); 'ok'`);
console.log('after Put back of Y.ask[0]=200:', B.ev(`JSON.stringify(S.custom.map(function(c){ return [c.id, c.ask[0]]; }))`), '| stat', B.ev(`(document.getElementById('shareStat')||{}).textContent`).slice(0,160), '| errors', B.errors.length);
// Put back after the requirement itself is gone
const zi = JSON.parse(B.ev(`(function(){ var real=Date.now; Date.now=function(){ return real.call(Date)+183000; }; setAsk(${J(ids[2])}, 0, '333'); var L=MS.jrnl, i=L.length-1; return JSON.stringify([i, L[i].p]); })()`));
B.ev(`(function(){ var real=Date.now; Date.now=function(){ return real.call(Date)+244000; }; return 'ok'; })()`);
B.ev(`removeReq(${J(ids[2])}); 'ok'`);
try{ B.ev(`jrnlUndo(${zi[0]}); "ok"`); }catch(e){ console.log("jrnlUndo threw:", String(e.message).slice(0,120)); }
console.log('Z deleted, Put back of its value', J(zi[1]), '->', B.ev(`JSON.stringify(S.custom.map(function(c){ return [c.id||null, (c.ask||[])[0]]; }))`), '| stat', B.ev(`(document.getElementById('shareStat')||{}).textContent`).slice(0,160), '| errors', B.errors.length, B.errors.slice(0,2).map(String).join(' / ').slice(0,200));
console.log('custom now', B.ev(`JSON.stringify(MS.years[MS.cur].custom)`).slice(0,300));
try{ B.ev(`setNote('A','after'); 'ok'`); console.log('an edit after: saved'); }catch(e){ console.log('edit threw', String(e.message).slice(0,100)); }
const ls = JSON.parse(B.ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
const C = boot({ html: HTML, ls });
console.log('reopened: errors', C.errors.length, String(C.errors[0]||'').slice(0,160), '| rows', C.ev('String((DATA.items||[]).length)'));
process.exit(0);
