import {boot,seed,bootMark,bootRelease,settleBoards} from './refusal/tools/export-audit/boot.mjs';
import fs from 'node:fs';
const J=JSON.stringify, mark=bootMark(), X=boot({html:fs.readFileSync('./refusal/prioritization-board-grid.html','utf8')});
seed(X.ev,{services:['USAF','ANG','AFRC'],items:[{id:'R1',grp:'AV',team:'AV',sect:'',custom:false,title:'Req R1',event:'Ev R1',ccar:'',fy26:[0,0,0],ask:[900,200,0],alloc:null}],disc:[5000,5000,5000],mand:[0,0,0],order:['R1']});
X.ev(`BASE_ITEMS.length=0;DATA.items.forEach(function(i){BASE_ITEMS.push(i);BASE_ASK[i.id]=i.ask.slice();});S.awards={R1:{mode:'single',d:FYMON[2][0],day:3}};MS.rcn=[{k:'K1',rcn:'11111',eeic:'AAAAA',t:'bad\u0001char\u000Bvt',svc:['USAF','ANG','AFRC']}];S.rcnAsg={R1:'K1'};S.titles={R1:'Title\u000B'};applyState(S);save();flowAddEnt();var ix=flowEnts().length-1;flowSetEnt(ix,'n','Ctl\u000B');flowSetAxis('dest');flowHtml();'ok'`);
const results=[];
for(const fn of ['exportExcel','exportCSV','exportSrc','exportFlow']){
 const got=JSON.parse(X.ev(`(function(){var originalBlob=window.Blob,originalZip=_zipStore,originalClick=HTMLAnchorElement.prototype.click,originalSet=Storage.prototype.setItem,originalRemove=Storage.prototype.removeItem,originalClear=Storage.prototype.clear;var writes=[],blobs=0,zips=0,clicks=0,msg='';
 function snapshot(){var ls={};Object.keys(localStorage).sort().forEach(function(k){ls[k]=localStorage.getItem(k)});return JSON.stringify({MS:MS,S:S,dirty:DIRTY,generation:_saveGen,baseDirty:_baseDirty,ls:ls});}
 var before=snapshot();alert=function(m){msg=String(m)};window.Blob=function(p,o){blobs++;return new originalBlob(p,o)};_zipStore=function(p){zips++;return originalZip(p)};HTMLAnchorElement.prototype.click=function(){clicks++};Storage.prototype.setItem=function(k,v){writes.push(['set',k]);return originalSet.call(this,k,v)};Storage.prototype.removeItem=function(k){writes.push(['remove',k]);return originalRemove.call(this,k)};Storage.prototype.clear=function(){writes.push(['clear']);return originalClear.call(this)};
 var threw=null;try{${fn}();}catch(e){threw=String(e)}finally{window.Blob=originalBlob;_zipStore=originalZip;HTMLAnchorElement.prototype.click=originalClick;Storage.prototype.setItem=originalSet;Storage.prototype.removeItem=originalRemove;Storage.prototype.clear=originalClear;}
 return JSON.stringify({zips,blobs,clicks,writes,msg,same:snapshot()===before,threw});})()`));
 const expected=[0,0,0,0,true,null]; const actual=[got.zips,got.blobs,got.clicks,got.writes.length,got.same,got.threw];
 const named=got.msg.includes('Excel workbook not exported: sheet')&&/cell [A-Z]+[0-9]+|name/.test(got.msg)&&/U\+000[1B]/.test(got.msg)&&got.msg.includes('No workbook was created');
 results.push({fn,actual,expected,named,ok:J(actual)===J(expected)&&named,message:got.msg});
}
await settleBoards(2);const result={results,pageErrors:X.errors};fs.writeFileSync('operated-refusal-results.json',J(result));console.log(J(result));bootRelease(mark,[]);await settleBoards();console.log('FINAL_ERRORS',J(X.errors));process.exitCode=results.some(x=>!x.ok)||X.errors.length?1:0;
