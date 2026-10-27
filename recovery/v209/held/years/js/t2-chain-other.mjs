import * as L from './lib.mjs';
const { J, boot } = L;
const B = boot({ html: L.w209rvBoard32() });
B.ev(`window.confirm=function(){ return true; }; window.alert=function(){}; 'ok'`);
const hA = L.v184Publish(B.ev);
B.ev(`(function(){ var t=Date.now(); while(Date.now()<=t+2){} return 'ok'; })()`);
const hB = L.v184Publish(B.ev);
const PA = L.w209rvCopy(hA), PB = L.w209rvCopy(hB);
const alpha = L.w209add(PA, 'Alpha, from copy A', [300, 0, 0]);
L.w209ev(PA, `switchYear(2029); 'ok'`); const a29 = L.w209rv2From(PA, 2028, alpha.id); L.w209ev(PA, `switchYear(2028); 'ok'`);
const bravo = L.w209add(PB, 'Bravo, from copy B', [500, 0, 0]);
L.w209ev(PB, `switchYear(2029); 'ok'`); const b29 = L.w209rv2From(PB, 2028, bravo.id);
L.w209ev(PB, `switchYear(2030); 'ok'`); const b30 = L.w209rv2From(PB, 2029, b29.id); L.w209ev(PB, `switchYear(2028); 'ok'`);
console.log('A', alpha.id, J(a29), 'B', bravo.id, J(b29), J(b30));
const pkgA = L.v184Submit(PA, 'PSM').pkg || {}, pkgB = L.v184Submit(PB, 'PSM').pkg || {};
// board accepts A's FY29 Alpha only; the team rolls it on into FY30
L.take(B, pkgA, 'a.json'); L.w209rv2Tick(B, `function(r){ return r.key==='__new' && r.fy===2029; }`);
const a29b = (L.w209rv2Cust(B, 2029).filter(c => c.ev === 'Alpha, from copy A')[0] || {}).id;
L.w3dlg(B.ev); L.w209ev(B, `switchYear(2029); rollPick={}; rollPick[${J(a29b)}]=1; rollYrs={}; rollYrs[2030]=1; rollApply(); switchYear(2028); save(); 'ok'`); L.w3said(B.ev);
console.log('FY30 custom', J(L.w209rv2Cust(B, 2030)));
// board takes B; review rows
L.take(B, pkgB, 'b.json');
const rolls = JSON.parse(L.w209ev(B, `(function(){ subOpen=true; subBody(); return JSON.stringify([].slice.call(document.querySelectorAll('#subBody tr')).filter(function(t){ return /Bravo/.test(t.textContent); }).map(function(t){ var h=t.querySelector('.subhere, .subroll'); return [t.textContent.slice(0,60), h? h.textContent : '']; })); })()`) || '[]');
console.log('review rows', J(rolls));
// Apply both of B's rows FY29 and FY30: answer the duplicate question Cancel
L.w3dlg(B.ev, [true, false, false, false]);
L.w209ev(B, `PMOPICK={}; pmoRows().forEach(function(r){ if(r.key==='__new' && (r.fy===2029 || r.fy===2030)) PMOPICK[pickKey(r)]=true; }); pmoApply(); 'ok'`);
const said = L.w3said(B.ev);
console.log('said', J(said.map(x => [x[0], x[1].slice(0, 500), x[2]])));
console.log('FY30 custom after', J(L.w209rv2Cust(B, 2030).map(c => [c.id, c.ev])));
console.log('stat', B.ev(`document.getElementById('shareStat').textContent`).slice(0,300));
console.log('errors', B.errors.length, PA.errors.length, PB.errors.length);
