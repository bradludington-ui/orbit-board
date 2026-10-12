const fs=require('fs'); const [,,A,B]=process.argv;
const a=JSON.parse(fs.readFileSync(A)), b=JSON.parse(fs.readFileSync(B));
const k=c=>JSON.stringify([c.id,c.kind,c.expected,c.observed,c.pass]);
const ka=a.checks.map(k), kb=b.checks.map(k);
const same=ka.length===kb.length && ka.every((x,i)=>x===kb[i]);
console.log((same?'SAME':'DIFF')+' '+A.split('/').pop()+' vs '+B.split('/').slice(-3).join('/')+' n='+ka.length+'/'+kb.length);
if(!same){ for(let i=0;i<Math.max(ka.length,kb.length);i++) if(ka[i]!==kb[i]) console.log('  A '+ka[i]+'\n  B '+kb[i]); }
