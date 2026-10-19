const fs=require('fs'),path=require('path'); const dir=process.argv[2];
const rows=[];
for(const f of fs.readdirSync(dir).filter(x=>x.endsWith('.json'))){
  const r=JSON.parse(fs.readFileSync(path.join(dir,f)));
  const rm=r.steps.find(s=>s.step==='remote'); const held=r.steps.find(s=>s.step==='held');
  rows.push({f, ca:/Ca/.test(f), d1:rm.tsMinusRealAfter, d1p:rm.payloadTsMinusRealAfter, d2: held? rm.head.ts-held.brad.screen.ts : null, start:r.startedET, end:r.endedET});
}
const rng=(a)=>a.length?[Math.min(...a),Math.max(...a)]:null;
const ahead=rows.filter(x=>!x.ca), ca=rows.filter(x=>x.ca);
console.log('ahead n',ahead.length,'ts-realAfter',rng(ahead.map(x=>x.d1)),'payload',rng(ahead.map(x=>x.d1p)),'remote-heldMS',rng(ahead.filter(x=>x.d2!=null).map(x=>x.d2)), 'n held', ahead.filter(x=>x.d2!=null).length);
console.log('Ca n',ca.length,'ts-realAfter',rng(ca.map(x=>x.d1)),'remote-heldMS',rng(ca.map(x=>x.d2)));
console.log('time range', rows.map(x=>x.start).sort()[0], rows.map(x=>x.end).sort().slice(-1)[0]);
