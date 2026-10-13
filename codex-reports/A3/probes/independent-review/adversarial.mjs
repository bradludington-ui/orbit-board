import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const root=resolve(process.argv[2]);
await import(pathToFileURL(root+'/runtime-encoding-shim.mjs').href);
const {boot,seed,bootMark,bootRelease,settleBoards}=await import(pathToFileURL(root+'/tools/export-audit/boot.mjs').href);
const marker=bootMark();const rows=[];
const ck=(where,what,got,want)=>rows.push({where,what,got,want,ok:JSON.stringify(got)===JSON.stringify(want)});
const it=(id,ask)=>({id,grp:'AV',team:'AV',sect:'',custom:false,title:'Req '+id,event:'Ev '+id,ccar:'CC'+id,fy26:[0,0,0],ask:[ask,0,0],alloc:null});
const make=()=>{const w=boot();seed(w.ev,{services:['USAF','ANG','AFRC'],items:[it('R1',900),it('R2',300)],disc:[5000,5000,5000],mand:[0,0,0],order:['R1','R2']});w.ev(`BASE_ITEMS.length=0;DATA.items.forEach(function(i){BASE_ITEMS.push(i);BASE_ASK[i.id]=i.ask.slice();});applyState(S);save();'ok'`);return w;};
// A browser cache produced by the old release may map both distinct old-list keys to one destination.
const w=make();w.ev(`DESTDB.ents=[{k:'A',n:'Alpha Depot',kind:'other',t:''}];var list=[{k:'x1',n:'Alpha Depot',kind:'other',t:''},{k:'x2',n:'ALPHA DEPOT',kind:'other',t:''}];var sg=destSig(list);DESTDB.lmap[sg]={x1:'A',x2:'A'};DESTDB.lsig.om=sg;globalThis.oldlist=list;var a=destFold(list,'om',false,{x1:1,x2:1});globalThis.a1=JSON.stringify(a);S.dest={R1:{to:'x1',end:''},R2:{to:'x2',end:''}};destRemap([S],a);flowCfg().axis='dest';flowCfg().fys=[2027];flowCfg().aps=['om'];globalThis.q=JSON.stringify({map:a,keys:S.dest,ents:DESTDB.ents,notice:(typeof destNotice==='function'?destNotice():''),money:flowCalc()});'ok'`);
const cached=JSON.parse(w.ev('q'));console.log('CACHED-DUPLICATE-MAP',JSON.stringify(cached));
ck('cached duplicate','distinct incoming requirements keep separate destinations',cached.keys.R1.to===cached.keys.R2.to,false);
ck('cached duplicate','both entry records survive',cached.ents.filter(e=>/alpha/i.test(e.n)).length,2);
ck('cached duplicate','preserved duplicates disclosed',/matching names were kept separate/.test(cached.notice),true);
// The same legacy map through real file opening, save and reopen; no direct destRemap call.
const file=make();file.ev(`var own=JSON.parse(JSON.stringify(MS));own.flow={axis:'dest',fys:[2027],aps:['om'],dv:0,ents:[{k:'x1',n:'Alpha Depot',kind:'other',t:''},{k:'x2',n:'ALPHA DEPOT',kind:'other',t:''}]};own.years[2027].dest={R1:{to:'x1',end:''},R2:{to:'x2',end:''}};globalThis.oldhtml=savedHtmlOf({om:own},{ts:0,byAp:{}});globalThis.cache={ts:Date.now()+10000,ents:[{k:'A',n:'Alpha Depot',kind:'other',t:''}],lmap:{},lsig:{},gone:[],conflicts:[]};cache.lmap[destSig(own.flow.ents)]={x1:'A',x2:'A'};'ok'`);
const opened=boot({html:file.ev('oldhtml'),ls:{prio27destdb:file.ev('JSON.stringify(cache)')}});
const observed=W=>JSON.parse(W.ev(`JSON.stringify({to1:S.dest.R1.to,to2:S.dest.R2.to,names:flowEnts().filter(function(e){return /alpha/i.test(e.n);}).map(function(e){return e.n;}),total:flowCalc().tot,by:flowCalc().ext.by,status:document.getElementById('shareStat').textContent})`));
for(const [label,v] of [['cached file opening',opened],['saved cached file reopened',boot({html:opened.ev('buildSavedHtml()')})]]){const x=observed(v);console.log(label,JSON.stringify(x));ck(label,'literal $1200 total stays',x.total,1200);ck(label,'R2 retains destination distinct from R1',x.to1===x.to2,false);ck(label,'two named destinations survive',x.names.length,2);}
// Ordinary v1.86 copies with distinct identity keys and a unique shared name should merge consistently.
const c=make();c.ev(`DESTDB.ents=[{k:'A',n:'Alpha Depot',kind:'other',t:'OLD'}];var list=[{k:'B',n:'alpha  depot',kind:'other',t:'NEW'}];var a=destFold(list,'ff',true,{B:1});var b=destFold(list,'ff',true,{B:1});globalThis.maps=JSON.stringify([a,b]);globalThis.names=JSON.stringify(DESTDB.ents);'ok'`);
ck('same-name cross-copy control','stable maps on repeated fold',JSON.parse(c.ev('maps')),[{B:'A'},{B:'A'}]);ck('same-name cross-copy control','one entry retained',JSON.parse(c.ev('names')).length,1);
// Correct same-list duplicate handling without an existing cache, then repeat its fold.
const d=make();d.ev(`DESTDB.ents=[];var list=[{k:'x1',n:'Alpha Depot',kind:'other',t:''},{k:'x2',n:'ALPHA DEPOT',kind:'other',t:''}];var a=destFold(list,'om',false,{x1:1,x2:1});var b=destFold(list,'om',false,{x1:1,x2:1});globalThis.unique=JSON.stringify({a:a,b:b,ents:DESTDB.ents});'ok'`);
const both=JSON.parse(d.ev('unique'));ck('uncached legacy duplicate','two records retained',both.ents.length,2);ck('uncached legacy duplicate','keys mapped separately',both.a.x1===both.a.x2,false);ck('uncached legacy duplicate','repeat mapping stable',both.a,both.b);
// Disclosure should remain in actual visible status after an ordinary export overwrites status.
const e=make();e.ev(`DESTDB.ents=[{k:'A',n:'Alpha Depot',kind:'other',t:''},{k:'B',n:'ALPHA DEPOT',kind:'other',t:''}];flowCfg().ents=DESTDB.ents;flowCfg().dv=1;S.dest={R1:{to:'A',end:''},R2:{to:'B',end:''}};persistDest();save();'ok'`);const f=boot({html:e.ev('buildSavedHtml()')});
ck('duplicate disclosure','opening status includes duplicate warning',/matching names were kept separate/.test(f.ev("document.getElementById('shareStat').textContent")),true);
f.ev(`exportFlow();'ok'`);console.log('POST-EXPORT-STATUS',f.ev("document.getElementById('shareStat').textContent"));
ck('duplicate disclosure','editor retains notice after export',/matching names were kept separate/.test(f.ev('flowEntEditor()')),true);
// Exercise the actual generated destination input's onchange, rather than calling the setter directly.
const typed=make();typed.ev(`DESTDB.ents=[{k:'A',n:'Alpha Depot',kind:'other',t:''},{k:'B',n:'Bravo Yard',kind:'other',t:''}];flowCfg().ents=DESTDB.ents;flowCfg().dv=1;var box=document.createElement('div');box.id='u40-actual-editor';box.innerHTML=flowEntEditor();document.body.appendChild(box);var input=box.querySelector('input[onchange^="flowSetEnt(1,"]');input.value='ALPHA DEPOT';input.dispatchEvent(new Event('change',{bubbles:true}));globalThis.typedView=JSON.stringify({input:input.value,stored:DESTDB.ents[1].n,status:document.getElementById('shareStat').textContent});'ok'`);
console.log('ACTUAL-TYPED-CONTROL',typed.ev('typedView'));
// The patch promises no silent merge even when another matching list arrives later in this session.
const late=make();late.ev(`DESTDB.ents=[{k:'A',n:'Alpha Depot',kind:'other',t:''}];setStat('Before incoming');var a=destFold([{k:'B',n:'Alpha Depot',kind:'other',t:''}],'ff',true,{B:1});globalThis.visible=document.getElementById('shareStat').textContent;globalThis.available=flowEntEditor();'ok'`);
console.log('LATE-MERGE-STATUS',late.ev('visible'));ck('late merge','editor makes remap disclosure available',/B.*A/.test(late.ev('available')),true);
bootRelease(marker,[]);await settleBoards();console.log(JSON.stringify({checks:rows.length,failed:rows.filter(r=>!r.ok).length,rows},null,2));process.exit(rows.some(r=>!r.ok)?1:0);
