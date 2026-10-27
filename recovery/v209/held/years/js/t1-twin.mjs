import * as L from './lib.mjs';
const { J, boot } = L;
const B = boot({ html: L.w209rvBoard32() });
B.ev(`window.confirm=function(){ return true; }; window.alert=function(){}; 'ok'`);
const hA = L.v184Publish(B.ev);
B.ev(`(function(){ var t=Date.now(); while(Date.now()<=t+2){} return 'ok'; })()`);
const hB = L.v184Publish(B.ev);
const PA = L.w209rvCopy(hA), PB = L.w209rvCopy(hB);
const alpha = L.w209add(PA, 'Alpha, from copy A', [300, 0, 0]);
const bravo = L.w209add(PB, 'Bravo, from copy B', [500, 0, 0]);
L.w209ev(PA, `switchYear(2029); 'ok'`); const a29 = L.w209rv2From(PA, 2028, alpha.id); L.w209ev(PA, `switchYear(2028); 'ok'`);
L.w209ev(PB, `switchYear(2029); 'ok'`); const b29 = L.w209rv2From(PB, 2028, bravo.id); L.w209ev(PB, `switchYear(2028); 'ok'`);
console.log('ids', alpha.id, bravo.id, J(a29), J(b29));
const pkgA = L.v184Submit(PA, 'PSM').pkg || {}, pkgB = L.v184Submit(PB, 'PSM').pkg || {};
L.take(B, pkgA, 'a.json'); L.w209rv2Tick(B, `function(r){ return r.key==='__new' && r.fy===2029; }`);
L.take(B, pkgB, 'b.json'); L.w209rv2Tick(B, `function(r){ return r.key==='__new' && r.fy===2029; }`);
const c29 = L.w209rv2Cust(B, 2029);
console.log('FY29 custom', J(c29));
const ids = c29.map(c => c.id);
// Roll requirements forward FY29 -> FY30, both picked
console.log('plan a', J(L.w209rv2Plan(B, 2029, ids[0], 2030)), 'plan b', J(L.w209rv2Plan(B, 2029, ids[1], 2030)));
L.w3dlg(B.ev); L.w209ev(B, `switchYear(2029); rollPick={}; ${J(ids)}.forEach(function(i){ rollPick[i]=1; }); rollYrs={}; rollYrs[2030]=1; rollApply(); window.__rs=document.getElementById('shareStat').textContent; switchYear(2028); save(); 'ok'`);
console.log('roll stat', B.ev('window.__rs'));
console.log('said', J(L.w3said(B.ev)).slice(0,600));
console.log('FY30 custom', J(L.w209rv2Cust(B, 2030)));
console.log('stat', B.ev(`document.getElementById('shareStat').textContent`).slice(0,300));
// the From another year picker at the board's FY30: is Bravo29 'already here'?
console.log('naFromHere', L.w209ev(B, `(function(){ switchYear(2030); var r=JSON.stringify(naFromRows(2029, 'PSM').map(function(x){ return [x.id, x.it.event, x.here]; })); switchYear(2028); return r; })()`));
console.log('errors', B.errors.length, PA.errors.length, PB.errors.length);
