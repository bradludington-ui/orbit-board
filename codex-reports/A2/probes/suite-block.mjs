// ==== v2.00 (U37): XML-unsafe workbooks are refused without losing text ====
await (async () => {
  const name = 'v2.00 (U37): XML-unsafe workbooks are refused without losing text';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm=bootMark();
  const keepBoards=()=>[];
  try {
    const X=boot(), J=JSON.stringify; let checked=0;
    const check=(where,what,got,want)=>{checked++;chk(name,where,what,J(got),J(want));};
    const readBytes = async bytes => JSON.parse(await X.w.eval(`(async function(){
      var u=new Uint8Array(${J(Array.from(bytes))}), dv=new DataView(u.buffer), at=0, td=new TextDecoder(), parts={}, bad=[], methods=[],parsed=0;
      while(at+30<=u.length && dv.getUint32(at,true)===0x04034b50){
        var n=dv.getUint16(at+26,true), x=dv.getUint16(at+28,true), size=dv.getUint32(at+18,true), method=dv.getUint16(at+8,true);
        var key=td.decode(u.subarray(at+30,at+30+n)), text=td.decode(u.subarray(at+30+n+x,at+30+n+x+size));
        methods.push(method); parts[key]=text;
        if(key.endsWith('.xml') || key.endsWith('.rels')){
          parsed++; var doc=new DOMParser().parseFromString(text,'application/xml');
          if(doc.getElementsByTagName('parsererror').length) bad.push(key);
        }
        at+=30+n+x+size;
      }
      var sheets=await xlsxRead(u.buffer);
      return JSON.stringify({parts:parts, bad:bad, parsed:parsed, methods:methods, sheets:sheets});
    })()`));
    const build = (rows, tab='U37', extra=[]) => JSON.parse(X.ev(`(function(){
      var msg='', Z=_zipStore, count=0; window.alert=function(m){msg+=String(m);};
      _zipStore=function(p){count++;return Z(p);};
      var before=JSON.stringify([MS,S,DIRTY,_saveGen,_sideGen,_baseDirty,Object.keys(localStorage).sort().map(function(k){return [k,localStorage.getItem(k)];})]), bytes;
      try{ bytes=buildXlsx([{name:${J(tab)},rows:${J(rows)}}],${J(extra)}); }finally{_zipStore=Z;}
      return JSON.stringify({bytes:bytes?Array.from(bytes):[],msg:msg,count:count,same:JSON.stringify([MS,S,DIRTY,_saveGen,_sideGen,_baseDirty,Object.keys(localStorage).sort().map(function(k){return [k,localStorage.getItem(k)];})])===before});
    })()`));
    const forbidden = [
      ['0000','\u0000'],['0001','\u0001'],['0002','\u0002'],['0003','\u0003'],['0004','\u0004'],
      ['0005','\u0005'],['0006','\u0006'],['0007','\u0007'],['0008','\u0008'],['000B','\u000B'],['000C','\u000C'],
      ['000E','\u000E'],['000F','\u000F'],['0010','\u0010'],['0011','\u0011'],['0012','\u0012'],['0013','\u0013'],
      ['0014','\u0014'],['0015','\u0015'],['0016','\u0016'],['0017','\u0017'],['0018','\u0018'],['0019','\u0019'],
      ['001A','\u001A'],['001B','\u001B'],['001C','\u001C'],['001D','\u001D'],['001E','\u001E'],['001F','\u001F'],
      ['FFFE','\uFFFE'],['FFFF','\uFFFF'],['D800','\uD800'],['DBFF','\uDBFF'],['DC00','\uDC00'],['DFFF','\uDFFF']
    ];
    for(const [hex,value] of forbidden){
      const b=build([[900,200,value]]);
      check('cell U+'+hex,'no ZIP built; no bytes; named cell C1 and offending unit; raw state unchanged',
        [b.count,b.bytes.length,b.msg.includes('cell C1'),b.msg.includes('U+'+hex),b.same], [0,0,true,true,true]);
    }
    for(const value of ['_x000B_','_x0041_','_x005F_','_x00ab_','_x0001_x0002_','_x005F_x0001_']){
      const b=build([[value]]);
      check('literal '+value,'literal OOXML escape is refused and named, with text still in state and no bytes',
        [b.count,b.bytes.length,b.msg.includes('cell A1'),b.msg.includes('OOXML escape'),b.same], [0,0,true,true,true]);
    }
    for(const [where,rows,tab,extra,notice] of [
      ['sheet name',[['exact']],'Ctl\u000B',[],'name'],
      ['format',[[1]],'U37',[{fill:false,fmt:'"bad\u000B"0'}],'number format 1']
    ]){
      const b=build(rows,tab,extra);
      check(where,'metadata refused before ZIP; precise field named; state unchanged',
        [b.count,b.bytes.length,b.msg.includes(notice),b.msg.includes('U+000B'),b.same], [0,0,true,true,true]);
    }
    // Legal XML whitespace remains exact in a standards XML parser AND in the unchanged board reader.
    const plain='O&M < > " \' &lt; &amp; =1+1 😀 _X000B_ _x00ZZ_';
    const good=build([[plain,900,200,1100]]), g=await readBytes(good.bytes);
    check('ordinary control','actual accepted package: every part parses; exact text and literal $900/$200/$1100; no formula',
      [good.count,good.same,g.bad.length,g.parsed,g.sheets.U37[0],/<f[ >]/.test(g.parts['xl/worksheets/sheet1.xml'])], [1,true,0,6,[plain,900,200,1100],false]);
    for(const [value,encoded] of [['a\tb','a&#9;b'],['a\nb','a&#10;b'],['a\rb','a&#13;b']]){
      const raw=build([[value]],value,[{fill:false,fmt:value}]), b=await readBytes(raw.bytes);
      const parsed=JSON.parse(X.ev(`(function(){var P=new DOMParser(), cell=P.parseFromString(${J(b.parts['xl/worksheets/sheet1.xml'])},'application/xml'),
        wb=P.parseFromString(${J(b.parts['xl/workbook.xml'])},'application/xml'), st=P.parseFromString(${J(b.parts['xl/styles.xml'])},'application/xml');
        var formats=[].map.call(st.getElementsByTagName('numFmt'),function(e){return e.getAttribute('formatCode');});
        return JSON.stringify([cell.getElementsByTagName('t')[0].textContent,wb.getElementsByTagName('sheet')[0].getAttribute('name'),formats[formats.length-1]]);})()`));
      check('whitespace '+encoded,'writer uses character references: native XML cell/name/format and board read exact',
        [b.bad.length,b.parts['xl/worksheets/sheet1.xml'].includes(encoded),parsed,b.sheets[value][0][0]], [0,true,[value,value,value],value]);
    }
    // ACTUAL OPERATED EXPORTS: every guard must stop before Blob/download when its central writer refuses.
    seed(X.ev,{services:['USAF','ANG','AFRC'],items:[it('R1','AV',[900,200,0])],disc:[5000,5000,5000],mand:[0,0,0],order:['R1']});
    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){BASE_ITEMS.push(i);BASE_ASK[i.id]=i.ask.slice();});
      S.awards={R1:{mode:'single',d:FYMON[2][0],day:3}};
      MS.rcn=[{k:'K1',rcn:'11111',eeic:'AAAAA',t:'bad\\u0001char\\u000Bvt',svc:['USAF','ANG','AFRC']}];
      S.rcnAsg={R1:'K1'}; S.titles={R1:'Title\\u000B'};applyState(S);save();'ok'`);
    const exportIt = fn=>JSON.parse(X.ev(`(function(){
      var B=window.Blob,Z=_zipStore, cap=null, blobs=0, zips=0,msg=''; window.alert=function(m){msg+=String(m);};window.confirm=function(){return true;};
      window.Blob=function(p,o){blobs++;if(p&&p[0]&&p[0].byteLength)cap=p[0];return new B(p,o);};_zipStore=function(p){zips++;return Z(p);};
      var before=JSON.stringify([MS,S,DIRTY,_saveGen,_sideGen,_baseDirty,Object.keys(localStorage).sort().map(function(k){return [k,localStorage.getItem(k)];})]);try{${fn}();}finally{window.Blob=B;_zipStore=Z;}
      return JSON.stringify({bytes:cap?Array.from(cap):[],blobs:blobs,zips:zips,msg:msg,same:JSON.stringify([MS,S,DIRTY,_saveGen,_sideGen,_baseDirty,Object.keys(localStorage).sort().map(function(k){return [k,localStorage.getItem(k)];})])===before,before:before,after:JSON.stringify([MS,S,DIRTY,_saveGen,_sideGen,_baseDirty,Object.keys(localStorage).sort().map(function(k){return [k,localStorage.getItem(k)];})])});})()`));
    for(const fn of ['exportExcel','exportCSV','exportSrc']){
      const b=exportIt(fn);
      check(fn,'operated export refuses before ZIP/Blob/download, names sheet/cell, leaves all model state unchanged',
        [b.zips,b.blobs,b.bytes.length,/sheet .*cell [A-Z]+[0-9]+/.test(b.msg),/U\+000[1B]/.test(b.msg),b.same], [0,0,0,true,true,true]);
    }
    X.ev(`flowAddEnt();var ix=flowEnts().length-1;flowSetEnt(ix,'n','Ctl\\u000B');flowSetAxis('dest');'ok'`);
    const cold=exportIt('exportFlow'), cb=JSON.parse(cold.before), ca=JSON.parse(cold.after);
    const added=Object.keys(ca[0].flow).filter(k=>!Object.hasOwn(cb[0].flow,k)).sort();
    const onlyDefaults=JSON.parse(cold.after); delete onlyDefaults[0].flow.pseudo; delete onlyDefaults[0].flow.subs;
    check('cold exportFlow','existing lazy pseudo/subs defaults are disclosed; no ZIP/Blob/file, all entered state unchanged',
      [cold.zips,cold.blobs,cold.bytes.length,cold.msg.includes('U+000B'),added,J(onlyDefaults)===cold.before],
      [0,0,0,true,['pseudo','subs'],true]);
    // A person using the displayed funds-flow panel has already initialized those display defaults.
    X.ev('flowHtml(); \'ok\'');
    const flow=exportIt('exportFlow');

    check('exportFlow','operated destination export refuses safely before ZIP/Blob/download, field named, data unchanged',
      [flow.zips,flow.blobs,flow.bytes.length,flow.msg.includes('U+000B'),flow.same], [0,0,0,true,true]);
    check('boot control','no page error during refusals or actual exports',X.errors.length,0);
    console.log('U37 CHECKS',checked);
  } catch(e) { failures.push({scenario:name,where:'harness',what:'block threw: '+String(e&&e.message||e),got:'threw',want:'ran'}); }
  bootRelease(__bm,keepBoards()); await settleBoards();
})();
// ==== end v2.00 (U37): XML-unsafe workbooks are refused without losing text ====
