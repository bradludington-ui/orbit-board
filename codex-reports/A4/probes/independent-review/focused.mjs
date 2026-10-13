import {boot,seed} from './fix/tools/export-audit/boot.mjs';
const failures=[]; let count=0; const checks=[];
const chk=(scenario,where,what,got,want)=>{count++;const ok=String(got)===String(want);checks.push({scenario,where,what,got,want,ok});if(!ok)failures.push({scenario,where,what,got,want});};
const it=(id,grp,ask)=>({id,grp,team:grp,sect:'',custom:false,title:'Req '+id,event:'Ev '+id,ccar:'CC'+id,fy26:ask.map(()=>0),ask,alloc:null});
// ==== v2.00 (U41): an unknown SI code in a file is kept, listed and never guessed ====
await (async () => {
  const name = 'v2.00 (U41): an unknown SI code in a file is kept, listed and never guessed';
  const { bootMark, bootRelease, settleBoards } = await import('./fix/tools/export-audit/boot.mjs');
  const __bm = bootMark();
  const keepBoards = () => [];
  try {
    const J = JSON.stringify;
    const X = boot();
    seed(X.ev, { services:['STOVL','USMC-C','USN'], items:[it('R1','AV',[0,200,900]),it('R2','AV',[0,100,300]),
      it('R3','AV',[0,0,50]),it('R4','AV',[0,0,60]),it('R5','AV',[0,0,70]),it('R6','AV',[0,0,80]),
      it('R7','AV',[0,90,0]),it('R8','PP',[0,0,40])], disc:[5000,5000,5000], mand:[0,0,0],
      order:['R1','R2','R3','R4','R5','R6','R7','R8'] });
    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      flowCfg().rules.lm='Req R1'; S.ptype={R1:'PRIME'}; applyState(S); save(); 'ok'`);
    // A saved file carries the raw entry. No applyState is called after putting it in the file.
    X.ev(`S.si={R1:'at',R2:'EN',R3:'LA',R4:'OT',R5:'FL',R6:'AT',R7:''}; MS.years[MS.cur]=S; 'ok'`);
    const html = X.ev('buildSavedHtml()');
    const R = boot({html});
    const Q = boot({html:R.ev('buildSavedHtml()')});
    for (const [where,B] of [['opened',R],['saved and reopened',Q]]) {
      chk(name,where,'unknown raw code is kept exactly, alongside all five valid codes and blank',
        B.ev('JSON.stringify(S.si)'),J({R1:'at',R2:'EN',R3:'LA',R4:'OT',R5:'FL',R6:'AT',R7:''}));
      chk(name,where,'CONTROL — normal LA/EN/OT/FL/AT, blank, and derived Propulsion are unchanged',
        B.ev(`JSON.stringify(['R2','R3','R4','R5','R6','R7','R8'].map(function(id){ return siOf(itemById(id)); }))`),
        J(['EN','LA','OT','FL','AT','','EN']));
      chk(name,where,'unknown at is not uppercased or replaced by the otherwise-derived LA', B.ev(`siOf(itemById('R1'))`),'');
      chk(name,where,'the exact raw code is listed with its requirement, with no invented normalization',
        B.ev(`JSON.stringify((attLists().si||[]).map(function(r){ return [r.id,r.n[0]]; }))`),
        J([['R1','SI “at” is not one of LA, EN, OT, FL or AT. Kept as saved; its money is shown under no SI code until corrected.']]));
      chk(name,where,'Pre-flight lists the same raw value',
        B.ev(`JSON.stringify(preflight().find.filter(function(f){ return f.k==='si'; }).map(function(f){ return f.rows.map(function(r){ return [r.id,r.sub]; }); }))`),
        J([[['R1','SI “at” is not one of LA, EN, OT, FL or AT. Kept as saved; its money is shown under no SI code until corrected.']]]));
      B.ev(`render(); attShow('si'); 'ok'`);
      chk(name,where,'the visible correction list names at and never claims it was dropped',
        B.ev(`document.getElementById('attBody').textContent.includes('SI “at”')`),true);
      chk(name,where,'CONTROL — service, requirement, office and amount ownership stay exact',
        B.ev(`JSON.stringify(['R1','R2'].map(function(id){ var p=tiers()[id]; return [id,grpOf(itemById(id)),p.d,p.m]; }))`),
        J([['R1','AV',[0,200,900],[0,0,0]],['R2','AV',[0,100,300],[0,0,0]]]));
      B.ev(`siShown=true; siOpen=true; siMatrix(); 'ok'`);
      chk(name,where,'SI screen shows no-code money, never an invisible or derived unknown bucket',
        B.ev(`JSON.stringify(Array.from(document.querySelectorAll('#siBody tr')).filter(function(r){return r.cells.length && r.cells[0].textContent.includes('no code set');}).map(function(r){return r.cells[r.cells.length-1].textContent;}))`),J(['63.0%']));
      chk(name,where,'CONTROL — valid EN, OT, FL and AT screen shares agree with 440, 60, 70, 80 of 1,890',
        B.ev(`JSON.stringify(Array.from(document.querySelectorAll('#siBody tr')).filter(function(r){return r.cells.length && /^(EN|OT|FL|AT) /.test(r.cells[0].textContent);}).map(function(r){return r.cells[r.cells.length-1].textContent;}))`),J(['23.3%','3.2%','3.7%','4.2%']));
      const bk=JSON.parse(await B.w.eval(`(async function(){ var cap=null,old=window.Blob;
        window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new old(p,o); };
        try{ exportExcel(); }finally{ window.Blob=old; }
        if(!cap) throw Error('no XLSX'); return JSON.stringify(await xlsxRead(cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength))); })()`));
      const si=bk['SI Codes by Month']||[];
      chk(name,where,'CONTROL — actual XLSX reconciles 1,500 Navy + 390 Marines = 1,890 dollars',
        J(si.filter(r=>['USN TOTAL','USMC CV TOTAL','ALL SERVICES — TOTAL BY MONTH'].includes(String(r[0]||''))).map(r=>[r[0],r[14]])),
        J([['USMC CV TOTAL',390],['USN TOTAL',1500],['ALL SERVICES — TOTAL BY MONTH',1890]]));
      chk(name,where,'all valid SI codes including LA keep only their assigned literal dollars in actual XLSX',
        J(si.filter(r=>/^(LA|EN|OT|FL|AT)  /.test(String(r[0]||''))).map(r=>[r[0],r[14]])),
        J([['EN  Engine',100],['LA  Airframe',50],['EN  Engine',340],['OT  Other Government Costs',60],['FL  Fuel',70],['AT  Audit',80]]));
      chk(name,where,'unrecognized code money is in no-code, not the derived LA bucket, on actual XLSX',
        J(si.filter(r=>String(r[0]||'')==='— no SI code set —').map(r=>r[14])),J([290,900]));
    }
    // These are distinct raw file values: do not trim, change case, or reinterpret them as object keys.
    for (const raw of ['LA ','la','ZZ','__proto__']) {
      X.ev(`S.si.R1=${J(raw)}; MS.years[MS.cur]=S; 'ok'`);
      const V=boot({html:X.ev('buildSavedHtml()')});
      chk(name,'raw '+J(raw),'raw file code stays byte-for-byte',V.ev('JSON.stringify(S.si.R1)'),J(raw));
      chk(name,'raw '+J(raw),'raw unsupported code has its own repair item',(JSON.parse(V.ev('JSON.stringify(attLists().si||[])')).filter(r=>r.id==='R1')).length,1);
    }
  } catch(e) { failures.push({scenario:name,where:'harness',what:'the block threw: '+String(e&&e.message||e),got:'threw',want:'ran'}); }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (U41) ====

// ==== v2.00 (U42): funds-flow tab names keep whole characters and safe apostrophe edges ====
await (async () => {
  const name = 'v2.00 (U42): funds-flow tab names keep whole characters and safe apostrophe edges';
  const { bootMark, bootRelease, settleBoards } = await import('./fix/tools/export-audit/boot.mjs');
  const __bm = bootMark();
  const keepBoards = () => [];
  try {
    const J=JSON.stringify, X=boot();
    seed(X.ev,{services:['USAF','ANG','AFRC'],items:[it('R1','AV',[900,200,0])],disc:[5000,5000,5000],mand:[0,0,0],order:['R1']});
    const names=['DDDDDDDDDDDDDDDDDDDDDDDDDDD😀tail',"'Quoted depot'",'EEEEEEEEEEEEEEEEEEEEEEEEE😀A-one',
      'EEEEEEEEEEEEEEEEEEEEEEEEE😀A-two',"FFFFFFFFFFFFFFFFFFFFFFFFFFF'tail","O'Brien",'Plain depot'];
    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      applyState(S); save(); ${J(names)}.forEach(function(n){ flowAddEnt(); flowSetEnt(flowEnts().length-1,'n',n); });
      S.dest={R1:{to:flowEnts()[flowEnts().length-1].k,end:''}}; flowSetAxis('dest'); 'ok'`);
    const html=X.ev('buildSavedHtml()');
    for(const [where,B] of [['working',X],['saved and reopened',boot({html})]]){
      const got=JSON.parse(await B.w.eval(`(async function(){var cap=null,old=window.Blob;
        window.Blob=function(p,o){if(p&&p[0]&&p[0].byteLength)cap=p[0];return new old(p,o);};
        try{exportFlow();}finally{window.Blob=old;} if(!cap)throw Error('no XLSX');
        var u=cap instanceof Uint8Array?cap:new Uint8Array(cap),i=0,wb='',dec=new TextDecoder();
        while(i+30<=u.length && u[i]===80 && u[i+1]===75 && u[i+2]===3 && u[i+3]===4){
          var dv=new DataView(u.buffer,u.byteOffset+i),sz=dv.getUint32(18,true),nl=dv.getUint16(26,true),xl=dv.getUint16(28,true);
          var fn=dec.decode(u.subarray(i+30,i+30+nl));
          if(fn==='xl/workbook.xml'){if(dv.getUint16(8,true)!==0)throw Error('unexpected ZIP compression');wb=dec.decode(u.subarray(i+30+nl+xl,i+30+nl+xl+sz));}
          i+=30+nl+xl+sz;
        } if(!wb)throw Error('missing workbook.xml');
        var doc=new DOMParser().parseFromString(wb,'application/xml');
        var book=await xlsxRead(cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength));
        return JSON.stringify({names:Array.from(doc.getElementsByTagName('sheet')).map(function(x){return x.getAttribute('name');}),
          replacement:wb.includes('\\uFFFD'),xmlErrors:doc.getElementsByTagName('parsererror').length,book:book});})()`));
      chk(name,where,'a cut before the emoji drops its whole character, never writes U+FFFD',got.names.includes('DDDDDDDDDDDDDDDDDDDDDDDDDDD'),true);
      chk(name,where,'no replacement character occurs in the actual workbook part',got.replacement,false);
      chk(name,where,'leading and trailing apostrophes are removed',got.names.includes('Quoted depot'),true);
      chk(name,where,'an apostrophe exposed at the first cut is removed',got.names.includes('FFFFFFFFFFFFFFFFFFFFFFFFFFF'),true);
      chk(name,where,'the repeat cut also never leaves half an emoji',got.names.includes('EEEEEEEEEEEEEEEEEEEEEEEEE 2'),true);
      chk(name,where,'CONTROL — an emoji that fits and an interior apostrophe stay exactly',
        J(got.names.filter(n=>n==='EEEEEEEEEEEEEEEEEEEEEEEEE😀A'||n==="O'Brien")),J(['EEEEEEEEEEEEEEEEEEEEEEEEE😀A',"O'Brien"]));
      chk(name,where,'CONTROL — names are unique, no longer than 31 UTF-16 units and XML parses',
        got.xmlErrors===0 && new Set(got.names.map(n=>n.toLowerCase())).size===got.names.length && got.names.every(n=>n.length<=31),true);
      const flow=got.book['Funds Flow']||[],plain=got.book['Plain depot']||[];
      chk(name,where,'CONTROL — actual funds-flow workbook total stays 900 + 200 = 1,100',
        J(flow.filter(r=>r[0]==='TOTAL FUNDING'&&typeof r[1]==='number').slice(-1).map(r=>r[1])),J([1100]));
      chk(name,where,'CONTROL — destination detail still owns those literal service amounts',
        J(plain.slice(1).filter(r=>r[0]==='Req R1').map(r=>[r[2],r[3],r[4],r[5]])),
        J([['O&M','AV','USAF',900],['O&M','AV','ANG',200]]));
      chk(name,where,'CONTROL — full destination names in saved data are never cut',
        B.ev('JSON.stringify(flowEnts().slice(-7).map(function(e){return e.n;}))'),J(names));
    }
  }catch(e){failures.push({scenario:name,where:'harness',what:'the block threw: '+String(e&&e.message||e),got:'threw',want:'ran'});}
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (U42) ====

console.log(JSON.stringify({checks:count,checksDetail:checks,failures},null,2));process.exit(failures.length?1:0);
