import {boot,seed,bootMark,bootRelease,settleBoards} from './base/tools/export-audit/boot.mjs';
let failures=[],checks=[];const keepBoards=()=>[];const it=(id,grp,ask)=>({id,grp,team:grp,sect:'',custom:false,title:'Req '+id,event:'Ev '+id,ccar:'CC'+id,fy26:ask.map(()=>0),ask,alloc:null});
const chk=(scenario,where,what,got,want)=>{const ok=String(got)===String(want);checks.push({scenario,where,what,got,want,ok});if(!ok)failures.push({scenario,where,what,got,want});};
// ==== v2.00 (U40): destination identities survive matching names ====
await (async () => {
  const __bm = bootMark();
  const name = 'v2.00 (U40) — matching destination names never silently move a requirement';
  try {
    const sc={services:['USAF','ANG','AFRC'], items:[it('R1','AV',[900,0,0]),it('R2','AV',[300,0,0])],
      disc:[5000,5000,5000],mand:[0,0,0],order:['R1','R2']};
    const make=()=>{ const W=boot(); seed(W.ev,sc); W.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`); return W; };
    const lists=()=>[{k:'U40-A',n:'Alpha Depot',kind:'other',t:''},{k:'U40-B',n:'ALPHA DEPOT',kind:'other',t:''}];
    const storage=W=>JSON.parse(W.ev(`JSON.stringify((function(){var o={}; for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);o[k]=localStorage.getItem(k);} return o;})())`));
    const state=W=>JSON.parse(W.ev(`JSON.stringify({ents:DESTDB.ents, dest:S.dest, gen:_saveGen, side:_sideGen, dirty:DIRTY, base:_baseDirty})`));
    const typed=make(); typed.ev(`DESTDB.ents=${JSON.stringify([{k:'U40-A',n:'Alpha Depot',kind:'other',t:''},{k:'U40-B',n:'Bravo Yard',kind:'other',t:''}])}; flowCfg().ents=DESTDB.ents;flowCfg().dv=1; S.dest={R1:{to:'U40-A',end:''},R2:{to:'U40-B',end:''}}; persistDest();save();flowEnts();'ok'`);
    for(const raw of ['ALPHA DEPOT','  alpha   depot  ']){
      const before=JSON.stringify(state(typed)), ls=JSON.stringify(storage(typed));
      typed.ev(`flowSetEnt(1,'n',${JSON.stringify(raw)});'ok'`);
      chk(name,'typing '+raw,'duplicate name is refused',typed.ev(`DESTDB.ents[1].n`),'Bravo Yard');
      chk(name,'typing '+raw,'requirements, counters and flags are untouched',JSON.stringify(state(typed)),before);
      chk(name,'typing '+raw,'no storage writes',JSON.stringify(storage(typed)),ls);
      chk(name,'typing '+raw,'refusal is explained',/Destination name not changed/.test(typed.ev(`document.getElementById('shareStat').textContent`)),true);
    }
    // Controls: own-name normalization and Kind/Match terms remain editable; unnamed additions remain possible.
    typed.ev(`flowSetEnt(0,'n',' ALPHA   DEPOT ');flowSetEnt(1,'kind','gov');flowSetEnt(1,'t','BRAVO');flowAddEnt();'ok'`);
    chk(name,'typing controls','an entry may retain its own normalized name',typed.ev(`DESTDB.ents[0].n`),' ALPHA   DEPOT ');
    chk(name,'typing controls','Kind and Match terms still save',typed.ev(`DESTDB.ents[1].kind+'|'+DESTDB.ents[1].t`),'gov|BRAVO');
    chk(name,'typing controls','an unnamed placeholder may still be added',typed.ev(`DESTDB.ents[DESTDB.ents.length-1].n`),'New destination');
    const X=make(); X.ev(`DESTDB.ents=${JSON.stringify(lists())};flowCfg().ents=DESTDB.ents;flowCfg().dv=1;flowCfg().axis='dest';flowCfg().fys=[2027];flowCfg().aps=['om'];S.dest={R1:{to:'U40-A',end:''},R2:{to:'U40-B',end:''}};MS.years[2028]=JSON.parse(JSON.stringify(S));CYCDB.dv=1;CYCDB.ents=DESTDB.ents;CYCDB.cycles['PB|2027']={cur:2027,base:2027,years:{2027:JSON.parse(JSON.stringify(S))}};persistDest();save();'ok'`);
    const html=X.ev('buildSavedHtml()');
    const checkSaved=async(W,where)=>{
      chk(name,where,'both names survive',W.ev(`JSON.stringify(flowEnts().filter(function(e){return e.k==='U40-A'||e.k==='U40-B';}).map(function(e){return e.n;}))`),'["Alpha Depot","ALPHA DEPOT"]');
      chk(name,where,'current year keeps both destination identities',W.ev(`S.dest.R1.to+'|'+S.dest.R2.to`),'U40-A|U40-B');
      chk(name,where,'another saved year keeps both identities',W.ev(`MS.years[2028].dest.R1.to+'|'+MS.years[2028].dest.R2.to`),'U40-A|U40-B');
      chk(name,where,'locked cycle keeps both identities',W.ev(`CYCDB.cycles['PB|2027'].years[2027].dest.R1.to+'|'+CYCDB.cycles['PB|2027'].years[2027].dest.R2.to`),'U40-A|U40-B');
      chk(name,where,'preserved duplicate names are disclosed',/matching names were kept separate/.test(W.ev('flowEntEditor()')),true);
      const f=JSON.parse(W.ev(`JSON.stringify(flowCalc())`));
      chk(name,where,'R1 owns its literal $900',f.ext.by['U40-A']?.v,900);
      chk(name,where,'R2 owns its literal $300',f.ext.by['U40-B']?.v,300);
      chk(name,where,'literal $1200 total is unchanged',f.tot,1200);
      const raw=await W.w.eval(`(async function(){var cap=null,_B=window.Blob;window.Blob=function(p,o){if(p&&p[0]&&p[0].byteLength) cap=p[0];return new _B(p,o);};try{exportFlow();}finally{window.Blob=_B;}if(!cap) throw Error('no workbook emitted');return JSON.stringify(await xlsxRead(cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength)));})()`);
      const book=JSON.parse(raw), sheets=Object.entries(book).filter(([n])=>/^alpha depot(?: \d+)?$/i.test(n)), a=sheets.find(([,r])=>r.some(v=>v[0]==='Req R1')&&!r.some(v=>v[0]==='Req R2')), b=sheets.find(([,r])=>r.some(v=>v[0]==='Req R2')&&!r.some(v=>v[0]==='Req R1'));
      chk(name,where,'actual XLSX has separate destination sheets',!!a&&!!b,true);
      chk(name,where,'actual XLSX R1 belongs only to Alpha Depot',JSON.stringify((a?.[1]||[]).filter(r=>r[0]==='Req R1').map(r=>r[5])),'[900]');
      chk(name,where,'actual XLSX R2 belongs only to ALPHA DEPOT',JSON.stringify((b?.[1]||[]).filter(r=>r[0]==='Req R2').map(r=>r[5])),'[300]');
      chk(name,where,'actual XLSX never puts R2 under the first destination',(a?.[1]||[]).filter(r=>r[0]==='Req R2').length,0);
    };
    const fresh=boot({html});await checkSaved(fresh,'fresh file');
    // A newer second-person list that contains neither key; also a same-name local entry must not steal either incoming key.
    for(const local of [[{k:'U40-C',n:'Bravo Yard',kind:'other',t:''}], [{k:'U40-C',n:'Alpha Depot',kind:'other',t:''}]]){
      const db={ts:Date.now()+10000,ents:local,lmap:{},lsig:{},conflicts:[],gone:[]};
      const B=boot({html,ls:{prio27destdb:JSON.stringify(db)}});
      chk(name,'newer '+local[0].n,'opening names the preserved duplicates',/matching names were kept separate/.test(B.ev(`document.getElementById('shareStat').textContent`)),true);
      await checkSaved(B,'newer '+local[0].n);
      const reopened=boot({html:B.ev('buildSavedHtml()')});await checkSaved(reopened,'saved after '+local[0].n);
    }
    // A same-file key is authoritative even if the newer local list renamed it. A name match must not consume it.
    const K=make();K.ev(`DESTDB.ents=[{k:'U40-B',n:'Alpha Depot',kind:'other',t:''}]; var L=[{k:'U40-A',n:'Alpha Depot',kind:'other',t:''},{k:'U40-B',n:'Bravo Yard',kind:'other',t:''}]; var al=destFold(L,'om',true,{'U40-A':1,'U40-B':1}); globalThis.__u40map=JSON.stringify(al);'ok'`);
    chk(name,'same list key','a different incoming key cannot claim its neighbor by name',K.ev('__u40map'),'{}');
    chk(name,'same list key','both incoming identities remain',K.ev(`JSON.stringify(DESTDB.ents.map(function(e){return e.k;}).sort())`),'["U40-A","U40-B"]');
    const A=make();A.ev(`DESTDB.ents=${JSON.stringify(lists())};var al=destFold([{k:'U40-C',n:'alpha depot',kind:'other',t:''}],'ff',true,{'U40-C':1});globalThis.__u40map=JSON.stringify(al);'ok'`);
    chk(name,'ambiguous local name','a first name match is not selected from an ambiguous local list',A.ev('__u40map'),'{}');
    chk(name,'ambiguous local name','the incoming distinct destination is kept',A.ev(`!!destHas('U40-C')`),true);
    // Ordinary unambiguous legacy merge is still by name, and every actual remap is listed.
    const L=make();L.ev(`DESTDB.ents=[{k:'U40-A',n:'Alpha Depot',kind:'other',t:'OLD'}];var q=[{k:'x1',n:'ALPHA  DEPOT',kind:'other',t:'NEW'}];var a=destFold(q,'ff',false,{x1:1});var b=destFold(q,'ff',false,{x1:1});globalThis.__u40maps=JSON.stringify([a,b]);'ok'`);
    chk(name,'legacy control','an unambiguous name still maps consistently',L.ev('__u40maps'),'[{"x1":"U40-A"},{"x1":"U40-A"}]');
    chk(name,'legacy control','only one destination remains',L.ev('DESTDB.ents.length'),1);
    chk(name,'legacy control','terms from both entries are retained',L.ev('DESTDB.ents[0].t'),'OLD, NEW');
    chk(name,'legacy merge notice','the actual merge names both keys and both names',/x1.*U40-A/.test(L.ev('flowEntEditor()')),true);
  } catch(e) { failures.push({scenario:name,where:'harness',what:'the block threw: '+String(e?.message||e),got:'threw',want:'ran'}); }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (U40): destination identities survive matching names ====
console.log(JSON.stringify({checks:checks.length,passed:checks.filter(x=>x.ok).length,failed:failures.length,failures,all:checks},null,2));process.exit(failures.length?1:0);
