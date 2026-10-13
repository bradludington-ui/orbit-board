import {boot,seed,bootRelease,settleBoards} from './base/tools/export-audit/boot.mjs';
import {writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const J=JSON.stringify,results=[],start=new Date().toLocaleString('en-US',{timeZone:'America/New_York'})+' ET';
const gate=()=>{let resolve;const p=new Promise(r=>resolve=r);return{p,resolve};};
const chk=(c,label,actual,expected)=>{const ok=J(actual)===J(expected);c.push({label,actual,expected,ok});if(!ok)console.log(J({failed:label,actual,expected}));};
async function wait(pred){const end=Date.now()+5000;while(Date.now()<end){if(pred())return;await new Promise(r=>setTimeout(r,1));}throw Error('fixture awaited stage not reached');}
function setup(){const B=boot();seed(B.ev,{services:['USAF','ANG','AFRC'],items:[{id:'A',grp:'AV',team:'AV',sect:'',custom:false,title:'Synthetic A',event:'A',ccar:'',fy26:[0,0,0],ask:[900,200,0],alloc:null}],disc:[1200,300,0],mand:[100,20,0],order:['A']});B.ev(`BASE_ITEMS.length=0;DATA.items.forEach(i=>{BASE_ITEMS.push(i);BASE_ASK[i.id]=i.ask.slice();});MS.dataPack=dataPackOf();MS.rcn=[{k:'K1',rcn:'11111',eeic:'AAAAA',t:'ORIGINAL TITLE',svc:['USAF','ANG']}];S.rcnAsg={A:'K1'};save();_liveCfg={mode:'json',url:'https://example.invalid/synthetic',store:false,auto:false,on:false,every:30};`);return B;}
function field(B,f){return [...B.w.document.querySelectorAll('#rcnBody input[onchange]')].find(e=>e.getAttribute('onchange').includes('"'+f+'"'));}
async function run(name,{f='rcn',reply='ok',commit=false,refresh=true}={}){const c=[];let r={name,checks:c};try{
 const B=setup(),g=gate(),calls=[],prompts=[];B.w.confirm=msg=>{prompts.push(msg);return false;};
 // jsdom lacks CSS.escape. This fixture uses only the ASCII selectors btn/rcnBody.
 if(!B.w.CSS)B.w.CSS={};if(!B.w.CSS.escape)B.w.CSS.escape=s=>String(s);
 B.w.spmtNet={request:async(url,opts)=>{calls.push({url,method:opts.method});await g.p;return{ok:reply==='ok',status:reply==='ok'?200:503,statusText:reply==='ok'?'OK':'Synthetic unavailable',text:reply==='ok'?J({items:[{ap:'ff',by:'Synthetic peer',ts:1,fy:2027,store:null}]}):''};}};
 const p=refresh?B.ev('liveTick()'):null;if(refresh)await wait(()=>calls.length===1);
 B.ev('toggleRcn()');await new Promise(q=>setTimeout(q,75));const e=field(B,f);if(!e)throw Error('real registry input missing '+f);e.focus();
 e.dispatchEvent(new B.w.KeyboardEvent('keydown',{key:'8',bubbles:true}));const typed=f==='rcn'?'88888':f==='eeic'?'QQQQQ':'HELD NEW TITLE';e.value=typed;e.dispatchEvent(new B.w.Event('input',{bubbles:true}));
 if(commit)e.dispatchEvent(new B.w.Event('change',{bubbles:true}));const current=field(B,f),before={value:current.value,pending:!!current.__dlgPend,connected:current.isConnected};
 chk(c,'actual DOM input reaches typed value before delayed reply',before.value,typed);
 chk(c,'input guard records uncommitted text',before.pending,!commit);
 const registryBefore=JSON.parse(B.ev('JSON.stringify(MS.rcn)'));g.resolve();if(p)await p;await new Promise(q=>setTimeout(q,0));const after=field(B,f);
 chk(c,'live refresh preserves focused entered text until the person commits or discards',after.value,typed);
 chk(c,'live refresh preserves pending flag for entered text',!!after.__dlgPend,!commit);
 chk(c,'live refresh preserves focus in the same registry field',B.w.document.activeElement===after,true);
 chk(c,'background refresh asks no discard question',prompts,[]);
 chk(c,'peer refresh does not change the registry model',JSON.parse(B.ev('JSON.stringify(MS.rcn)')),registryBefore);
 chk(c,'pending text never reports stored before commit',registryBefore[0][f],commit?typed:f==='rcn'?'11111':f==='eeic'?'AAAAA':'ORIGINAL TITLE');
 chk(c,'no original application script errors',B.errors,[]);
 r.actual={before,after:{value:after.value,pending:!!after.__dlgPend,active:B.w.document.activeElement===after,originalStillConnected:e.isConnected},calls,reply,registryBefore,peerCount:B.ev('Object.keys(LIVEDB.peers).length'),status:B.ev(`document.getElementById('shareStat').textContent`)};
 r.status=c.every(x=>x.ok)?'passed':'failed';
 }catch(e){r.status='incomplete';r.error=String(e.stack||e);}finally{bootRelease(0);await settleBoards();}results.push(r);console.log(J({name,status:r.status,failures:c.filter(x=>!x.ok).length,error:r.error}));}
await run('held RCN without refresh control',{refresh:false});
await run('committed RCN with successful refresh control',{commit:true});
for(const f of ['rcn','eeic','t'])await run('uncommitted '+f+' with successful peer refresh',{f});
await run('uncommitted RCN with failed peer refresh',{reply:'failed'});
writeFileSync(new URL('live-held-results.json',import.meta.url),J({provenance:{startedET:start,completedET:new Date().toLocaleString('en-US',{timeZone:'America/New_York'})+' ET',testedSHA:'7ee498a46507972f803cd48ce9f27d5d668acb63',boardBlob:'fce8a391bd8a248d5185e199d22190c1687eaea0',bootBlob:'9c4f49ad8cec537097bdf485458cfd2a09b06594',scriptSHA256:createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),node:process.version,jsdom:JSON.parse(readFileSync(new URL('../node_modules/jsdom/package.json',import.meta.url))).version,scope:'fresh whole-board jsdom real liveTick/livePoll/liveNet with held synthetic JSON bridge reply; original focused DOM input/input guard; no real network or native browser'},results},null,2)+'\n');process.exitCode=results.some(r=>r.status!=='passed')?1:0;
