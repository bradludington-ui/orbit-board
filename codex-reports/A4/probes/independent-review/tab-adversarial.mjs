import {boot,seed,bootMark,bootRelease,settleBoards} from './fix/tools/export-audit/boot.mjs';
const __bm=bootMark(),X=boot(),J=JSON.stringify,checks=[],failures=[];
const chk=(name,got,want)=>{const ok=J(got)===J(want);checks.push({name,got,want,ok});if(!ok)failures.push({name,got,want});};
seed(X.ev,{services:['USAF','ANG','AFRC'],items:[{id:'R1',grp:'AV',team:'AV',sect:'',custom:false,title:'Req R1',event:'Ev',ccar:'C',fy26:[0,0,0],ask:[900,200,0],alloc:null}],disc:[5000,5000,5000],mand:[0,0,0],order:['R1']});
const names=["GGGGGGGGGGGGGGGGGGGGGGGGG'AB-one","GGGGGGGGGGGGGGGGGGGGGGGGG'AB-two","GGGGGGGGGGGGGGGGGGGGGGGGG'AB-three","''","'😀'","O'Brien"];
X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){BASE_ITEMS.push(i);BASE_ASK[i.id]=i.ask.slice();});applyState(S); save();${J(names)}.forEach(function(n){flowAddEnt();flowSetEnt(flowEnts().length-1,'n',n);});S.dest={R1:{to:flowEnts().slice(-1)[0].k,end:''}};flowSetAxis('dest');'ok'`);
for(const [where,B] of [['working',X],['reopened',boot({html:X.ev('buildSavedHtml()')})]]){
 const got=JSON.parse(await B.w.eval(`(async function(){var cap=null,old=window.Blob;window.Blob=function(p,o){if(p&&p[0]&&p[0].byteLength)cap=p[0];return new old(p,o);};try{exportFlow();}finally{window.Blob=old;}if(!cap)throw Error('no XLSX');var u=new Uint8Array(cap.buffer,cap.byteOffset,cap.byteLength),i=0,wb='',d=new TextDecoder();while(i+30<=u.length&&u[i]===80&&u[i+1]===75&&u[i+2]===3&&u[i+3]===4){var v=new DataView(u.buffer,u.byteOffset+i),s=v.getUint32(18,true),n=v.getUint16(26,true),x=v.getUint16(28,true);if(d.decode(u.subarray(i+30,i+30+n))==='xl/workbook.xml')wb=d.decode(u.subarray(i+30+n+x,i+30+n+x+s));i+=30+n+x+s;}var doc=new DOMParser().parseFromString(wb,'application/xml');return JSON.stringify({names:Array.from(doc.getElementsByTagName('sheet')).map(s=>s.getAttribute('name')),errors:doc.getElementsByTagName('parsererror').length,book:await xlsxRead(cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength))});})()`));
 chk(where+' repeat-cut reveals quote and removes it before suffix',got.names.filter(n=>/^GGG/.test(n)),["GGGGGGGGGGGGGGGGGGGGGGGGG'AB",'GGGGGGGGGGGGGGGGGGGGGGGGG 2','GGGGGGGGGGGGGGGGGGGGGGGGG 3']);
 chk(where+' quotation-only name uses fallback and whole emoji survives edge trimming',got.names.includes('😀'),true);
 chk(where+' no empty name, edge apostrophe, split pair or replacement',got.names.every(n=>n.length>0&&n.length<=31&&!/^'|'$/.test(n)&&!/[\uD800-\uDBFF]$|^[\uDC00-\uDFFF]|\uFFFD/.test(n))&&got.errors===0,true);
 chk(where+' ordinary interior apostrophe stays',got.names.includes("O'Brien"),true);
 chk(where+' case-insensitive names remain unique',new Set(got.names.map(n=>n.toLowerCase())).size,got.names.length);
 chk(where+' actual worksheet money remains 900/200',got.book["O'Brien"].slice(1).filter(r=>r[0]==='Req R1').map(r=>[r[4],r[5]]),[['USAF',900],['ANG',200]]);
}
console.log(J({checks,failures}));bootRelease(__bm,[]);await settleBoards();process.exit(failures.length?1:0);
