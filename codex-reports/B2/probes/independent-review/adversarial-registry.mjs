import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {TextEncoder,TextDecoder} from 'node:util';
import {boot,seed,bootMark,bootRelease,settleBoards,BOARD} from '../../B2/snapshot/tools/export-audit/boot.mjs';
const J=JSON.stringify, out=new URL('../logs/',import.meta.url), checks=[],books=[],started=new Date().toISOString();
const sv=['USAF','ANG','AFRC'], entry=(k,rcn,eeic)=>({k,rcn,eeic,t:'',svc:sv.slice()}), E1=entry('K1','11111','AAAAA'),E2=entry('K2','22222','BBBBB');
const cases=[
{name:'different-label-same-key',L:[E1,entry('K1','22222','BBBBB'),entry('K1','33333','CCCCC')],a:{USAF:'K1',ANG:'K1'},locked:true,want:['11111 / AAAAA','11111 / AAAAA']},
{name:'reserved-assigned',L:[entry('__none__','22222','BBBBB')],a:{USAF:'__none__',ANG:'__none__'},locked:true,want:['22222 / BBBBB','22222 / BBBBB']},
{name:'reserved-unassigned',L:[entry('__none__','22222','BBBBB')],a:{},locked:true,want:['— no RCN/EEIC assigned —','— no RCN/EEIC assigned —']},
{name:'private-name-collision-control',L:[entry('e0','11111','AAAAA'),entry('e1','22222','BBBBB')],a:{USAF:'e0',ANG:'e1'},locked:true,want:['11111 / AAAAA','22222 / BBBBB']},
{name:'numeric-and-text-working',L:[entry(1,'11111','AAAAA'),entry('1','22222','BBBBB')],a:{USAF:1,ANG:'1'},locked:false,want:['11111 / AAAAA','22222 / BBBBB']},
{name:'numeric-and-text-locked-legacy-filter',L:[entry(1,'11111','AAAAA'),entry('1','22222','BBBBB')],a:{USAF:1,ANG:'1'},locked:true,want:['— no RCN/EEIC assigned —','22222 / BBBBB']},
{name:'ordinary-service-ownership-control',L:[E1,E2],a:{USAF:'K1',ANG:'K2'},locked:true,want:['11111 / AAAAA','22222 / BBBBB']}
];
function ck(c,route,name,got,want){const ok=J(got)===J(want);checks.push({case:c,route,name,got,want,ok});if(!ok)console.log(J(checks.at(-1)));}
async function readBook(B,C,route){B.w.TextEncoder=TextEncoder;B.w.TextDecoder=TextDecoder;if(C.locked)B.ev("cycView('PB|2027')");
const decoded=JSON.parse(await B.ev(`(async()=>{let bytes;const old=window.Blob;window.Blob=function(p,o){if(p?.[0]?.byteLength)bytes=p[0];return new old(p,o)};try{exportExcel()}finally{window.Blob=old}if(!bytes)throw Error('no workbook emitted');window.__reviewBook=bytes;return JSON.stringify(await xlsxRead(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)))})()`));
const sheet=decoded['RCN-EEIC by Month'],v=x=>x&&typeof x==='object'?x.v:x,rows=[];let service='';for(const r of sheet){const label=String(v(r[0])??'');if(label==='WHICH REQUIREMENTS SIT UNDER EACH COMBINATION')break;if(sv.includes(label)){service=label;continue;}if(typeof v(r[14])==='number')rows.push([label.endsWith('TOTAL BY MONTH')?'ALL':service,label,v(r[3]),v(r[13]),v(r[14])]);}
const want=[['USAF',C.want[0],900,0,900],['USAF','USAF TOTAL',900,0,900],['ANG',C.want[1],200,0,200],['ANG','ANG TOTAL',200,0,200],['AFRC','AFRC TOTAL',0,0,0],['ALL','ALL SERVICES — TOTAL BY MONTH',1100,0,1100]];
ck(C.name,route,'actual workbook service, combination, December and totals',rows,want);
const totals=sv.map(s=>sheet.filter(r=>String(v(r[0]))===s+' TOTAL').map(r=>v(r[14])));ck(C.name,route,'both summary and requirement-breakout service totals',totals,[[900,900],[200,200],[0,0]]);
books.push({case:C.name,route,sha256:createHash('sha256').update(Buffer.from(B.w.__reviewBook)).digest('hex'),rows,totals});if(C.locked)B.ev('cycLeave()');}
for(const C of cases){const mark=bootMark();try{const B=boot();seed(B.ev,{services:sv,items:[{id:'R1',grp:'AV',team:'AV',sect:'',custom:false,title:'Literal ownership control',event:'B2-review',ccar:'',fy26:[0,0,0],ask:[900,200,0],alloc:null}],disc:[5000,5000,5000],mand:[0,0,0],order:['R1']});B.ev(`BASE_ITEMS.length=0;DATA.items.forEach(i=>{BASE_ITEMS.push(i);BASE_ASK[i.id]=i.ask.slice()});MS.dataPack=dataPackOf();S.awards={R1:{mode:'single',d:FYMON[2][0],day:3}};MS.rcn=${J(C.L)};S.rcnSvc={R1:${J(C.a)}};applyState(S);save();`);if(C.locked)B.ev("blCyc='PB';blYr=2027;cycLock()");await readBook(B,C,'live');const html=B.ev('buildSavedHtml()'),R=boot({html});await readBook(R,C,'saved-file-reopen');ck(C.name,'saved-file-reopen','registry retained in saved payload',JSON.parse(html.match(/id="pubState">([\s\S]*?)<\/script>/)[1]).appns.om.rcn,C.L);}catch(e){checks.push({case:C.name,ok:false,incomplete:true,error:String(e.stack||e)});console.log(String(e.stack||e));}finally{bootRelease(mark,[]);await settleBoards();}}
const summary={checks:checks.length,pass:checks.filter(c=>c.ok).length,fail:checks.filter(c=>!c.ok&&!c.incomplete).length,incomplete:checks.filter(c=>c.incomplete).length};const data={startedUTC:started,finishedUTC:new Date().toISOString(),board:BOARD,boardBlob:createHash('sha1').update(Buffer.from('blob '+readFileSync(BOARD).length+'\0')).update(readFileSync(BOARD)).digest('hex'),node:process.version,summary,checks,books};writeFileSync(new URL('adversarial-results.json',out),J(data,null,2)+'\n');console.log(J(summary));process.exitCode=summary.fail||summary.incomplete?1:0;
