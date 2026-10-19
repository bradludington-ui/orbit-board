import {boot,seed,bootRelease,settleBoards} from '../copy/tools/export-audit/boot.mjs';
import {writeFileSync} from 'node:fs';
const OUT=new URL('./',import.meta.url).pathname,J=JSON.stringify,results=[],windows=[];
const gate=()=>{let resolve;const p=new Promise(r=>resolve=r);return{p,resolve};};
const wait=async pred=>{const end=Date.now()+5000;while(Date.now()<end){if(pred())return;await new Promise(r=>setTimeout(r,1));}throw new Error('fixture awaited stage not reached');};
const pub=html=>JSON.parse(html.match(/id="pubState">([\s\S]*?)<\/script>/)[1]);
const status=B=>B.ev("(document.getElementById('shareStat')||{}).textContent||''");
function board(){const B=boot();windows.push(B.w);seed(B.ev,{services:['USAF','ANG','AFRC'],items:[{id:'A',grp:'AV',team:'AV',sect:'',custom:false,title:'Synthetic A',event:'A',ccar:'',fy26:[0,0,0],ask:[900,200,100],alloc:null}],disc:[1200,300,150],mand:[100,20,10],order:['A']});B.ev(`BASE_ITEMS.length=0;DATA.items.forEach(i=>{BASE_ITEMS.push(i);BASE_ASK[i.id]=i.ask.slice();});applyState(S);localStorage.setItem('prio27who','Synthetic reviewer');localStorage.setItem('prio27writerKey','a0000000000000000000000000000002');setNote('A','START');`);return B;}
function folder(){
 const root={files:{},dirs:{}},F={root,reads:0,writes:[],holdRead:null,holdClose:null};
 const nf=()=>Object.assign(new Error('synthetic absent'),{name:'NotFoundError'});
 const dir=st=>({kind:'directory',name:'synthetic',queryPermission:async()=> 'granted',requestPermission:async()=> 'granted',getFileHandle:async(n,o)=>{if(!(n in st.files)){if(o?.create)st.files[n]='';else throw nf();}return{kind:'file',name:n,getFile:async()=>{const text=st.files[n];if(st===root&&n==='spmt-2027-om.json'){F.reads++;if(F.holdRead){const g=F.holdRead;F.holdRead=null;await g.p;}}return{text:async()=>text};},createWritable:async()=>{let bytes='';return{write:async x=>{bytes+=String(x);},close:async()=>{if(st===root&&n==='spmt-2027-om.json'&&F.holdClose){const g=F.holdClose;F.holdClose=null;F.closing=true;await g.p;}st.files[n]=bytes;F.writes.push({history:st!==root,name:n,bytes});}};}};},getDirectoryHandle:async(n,o)=>{if(!st.dirs[n]){if(o?.create)st.dirs[n]={files:{},dirs:{}};else throw nf();}return dir(st.dirs[n]);},removeEntry:async n=>{delete st.files[n];},values:async function*(){for(const n of Object.keys(st.files))yield{kind:'file',name:n,getFile:async()=>({text:async()=>st.files[n]})};}});
 F.dir=dir(root);return F;
}
function connect(B,F){B.w.__folder=F.dir;B.ev(`_liveCfg=Object.assign(liveCfg(),{store:true,mode:'drive',on:false});_driveDir=globalThis.__folder;`);}
function disk(B,html){const f={html,reads:0,writes:0,opens:0,holdRead:null};B.w.__disk={name:'synthetic.html',requestPermission:async()=> 'granted',getFile:async()=>{f.reads++;if(f.holdRead){const g=f.holdRead;f.holdRead=null;await g.p;}return{text:async()=>f.html};},createWritable:async()=>{f.opens++;let bytes='';return{write:async x=>{f.writes++;bytes=String(x);},close:async()=>{f.html=bytes;}};}};B.w.showSaveFilePicker=async()=>B.w.__disk;B.ev('FH=globalThis.__disk');return f;}
async function record(name,fn){try{const r=await fn();results.push({name,...r});console.log(J({name,...r}));}catch(e){const r={name,status:'incomplete',error:String(e.stack||e)};results.push(r);console.log(J(r));}}
try{
 for(const locked of [false,true])await record(locked?'R3 locked cycle entered during folder read':'R3 CONTROL normal delayed folder save',async()=>{
  const B=board(),F=folder();connect(B,F);
  B.ev("setNote('A','LOCKED');blCyc='PB';blYr=2027;cycLock();setNote('A','WORKING');");
  await B.ev('driveStorePush(false)');const before=F.writes.length,reads=F.reads;const g=gate();F.holdRead=g;
  const p=B.ev('driveStorePush(false)');await wait(()=>F.reads>reads);
  if(locked)B.ev("cycView('PB|2027')");
  const during=JSON.parse(B.ev(`JSON.stringify({view:CYCVIEW,note:S.notes.A,gen:_saveGen})`));g.resolve();const returned=await p;
  const delta=F.writes.slice(before),main=delta.filter(x=>!x.history&&x.name==='spmt-2027-om.json'),hist=delta.filter(x=>x.history),written=main.length?JSON.parse(main[0].bytes).store.years['2027'].notes.A:null;
  const actual={returned,during,mainWrites:main.length,historyWrites:hist.length,written,status:status(B)},expected=locked?{mainWrites:0,historyWrites:0}:{mainWrites:1,written:'WORKING'};
  return{status:(locked?main.length===0&&hist.length===0:main.length===1&&written==='WORKING')?'passed':'failed',expected,actual};
 });
 for(const mixed of [false,true])await record(mixed?'R4 failed import hold during file read':'R4 CONTROL normal delayed file save',async()=>{
  const B=board();B.ev(`MS.dataPack=dataPackOf();PUBS.ff=JSON.parse(JSON.stringify(MS));PUBS.ff.years['2027'].notes.A='OLD FF';localStorage.setItem('prio27ff',JSON.stringify(PUBS.ff));`);
  const html=B.ev('buildSavedHtml()'),P=pub(html),f=disk(B,html),g=gate();f.holdRead=g;
  const p=B.ev('saveInPlaceFile()');await wait(()=>f.reads===1);
  let importRet=null;
  if(mixed){const Q={appns:{ff:JSON.parse(J(P.appns.ff))},execDb:{ts:1,all:{om:{fy:2027,rows:[['JSF1',5000]]}}}};Q.appns.ff.years['2027'].notes.A='PARTIAL FF';const incoming=html.replace(/(<script type="application\/json" id="pubState">)[\s\S]*?(<\/script>)/,(m,a,b)=>a+J(Q)+b);B.w.__incoming=incoming;B.ev(`globalThis.__set=Storage.prototype.setItem;globalThis.__stuck=false;Storage.prototype.setItem=function(k,v){if(k==='prio27execdb')globalThis.__stuck=true;if(globalThis.__stuck)throw new DOMException('synthetic persistent refusal','QuotaExceededError');return globalThis.__set.call(this,k,v);};`);importRet=B.ev("fullImportText(globalThis.__incoming,'synthetic-partial.html')");}
  const hold=B.ev('impMixedOn()');g.resolve();await p;const saved=pub(f.html);
  const actual={importRet,hold,writes:f.writes,opens:f.opens,savedFF:saved.appns.ff.years['2027'].notes.A,status:status(B)},expected=mixed?{writes:0,savedFF:'OLD FF'}:{writes:1,savedFF:'OLD FF'};
  return{status:(f.writes===(mixed?0:1)&&actual.savedFF==='OLD FF')?'passed':'failed',expected,actual};
 });
 for(const restore of [false,true])await record(restore?'R5 actual history restore during earlier folder close':'R5 CONTROL delayed folder close without restore',async()=>{
  const B=board(),F=folder();connect(B,F);B.ev("setNote('A','RESTORED')");await B.ev('driveStorePush(false)');
  const prior=F.root.files['spmt-2027-om.json'];F.root.dirs.history={files:{'spmt-2027-om-20261011-100000.json':prior},dirs:{}};
  B.ev("setNote('A','WORKING')");const g=gate();F.holdClose=g;F.closing=false;const p=B.ev('driveStorePush(false)');await wait(()=>F.closing);
  const before=JSON.parse(B.ev('JSON.stringify({gen:_saveGen,note:S.notes.A,dirty:DIRTY,baseDirty:_baseDirty})'));
  if(restore){B.ev(`_driveHistFor='2027|om';_driveHist=[{name:'spmt-2027-om-20261011-100000.json',stamp:'20261011-100000'}];`);await B.ev('driveRestore(0)');}
  const afterRestore=JSON.parse(B.ev('JSON.stringify({gen:_saveGen,note:S.notes.A,dirty:DIRTY,baseDirty:_baseDirty})'));
  g.resolve();await p;const after=JSON.parse(B.ev('JSON.stringify({gen:_saveGen,note:S.notes.A,dirty:DIRTY,baseDirty:_baseDirty})'));
  const written=JSON.parse(F.root.files['spmt-2027-om.json']).store.years['2027'].notes.A;
  const actual={before,afterRestore,after,written,status:status(B)},expected=restore?{current:'RESTORED',written:'WORKING',dirty:true,baseDirty:true}:{current:'WORKING',written:'WORKING',dirty:false};
  return{status:(after.note===(restore?'RESTORED':'WORKING')&&written==='WORKING'&&after.dirty===restore&&(!restore||after.baseDirty))?'passed':'failed',expected,actual};
 });
 writeFileSync(OUT+'results.json',J(results,null,2)+'\n');process.exitCode=results.every(x=>x.status==='passed')?0:1;
}finally{for(const w of windows)try{w.close();}catch{}bootRelease(0);await settleBoards();}
