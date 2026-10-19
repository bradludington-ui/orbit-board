// A board saved with a Force setting must still compute exactly as before, even though the option
// can no longer be chosen. Removing a menu entry must not silently restate anyone's funding.
import { boot, seed } from './boot.mjs';
const it=(id,grp,ask)=>({id,grp,team:grp,sect:'',custom:false,title:id,event:id,ccar:'',fy26:ask.map(()=>0),ask,alloc:null});
const sum=a=>a.reduce((x,y)=>x+y,0);
let bad=0;
for (const [mode, expect] of [['mand','all mandatory'],['disc','all discretionary'],['ufr','all unfunded']]) {
  const { ev } = boot();
  seed(ev, { services:['STOVL','CV','CTOL'], items:[it('A','ATL',[30,20,10])],
             disc:[100,50,25], mand:[80,40,20], order:['A'], fsrc:{ A:{ m:mode } } });
  const T = JSON.parse(ev('JSON.stringify(tiers())'));
  const d=sum(T.A.d), m=sum(T.A.m), u=sum(T.A.u), ask=60;
  const got = d>0.005&&m<=0.005&&u<=0.005 ? 'all discretionary'
            : m>0.005&&d<=0.005&&u<=0.005 ? 'all mandatory'
            : u>0.005&&d<=0.005&&m<=0.005 ? 'all unfunded' : `mixed d${d} m${m} u${u}`;
  const ok = got===expect && Math.abs(d+m+u-ask)<=0.005;
  if(!ok) bad++;
  console.log(`  ${ok?'ok  ':'FAIL'} legacy fsrc '${mode}' still honoured — ${got} (d ${d} · m ${m} · u ${u})`);
}
console.log(bad? `\n  ${bad} legacy mode(s) changed behaviour\n` : '\n  every legacy Force setting computes exactly as before\n');
process.exit(bad?1:0);
