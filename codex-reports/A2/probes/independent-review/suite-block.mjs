// ==== v2.00 (U37): every workbook part is XML and text round-trips exactly ====
await (async () => {
  const name = 'v2.00 (U37): every workbook part is XML and text round-trips exactly';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  const keepBoards = () => [];
  try {
    const X = boot();
    const J = JSON.stringify;
    let checked = 0;
    const check = (where, what, got, want) => { checked++; chk(name, where, what, J(got), J(want)); };
    // Read actual ZIP bytes, never the sheet objects a writer was handed. Parse EVERY XML and relationship part.
    const readBytes = async bytes => JSON.parse(await X.w.eval(`(async function(){
      var u=new Uint8Array(${J(Array.from(bytes))}), dv=new DataView(u.buffer), at=0, td=new TextDecoder(), parts={}, bad=[], methods=[];
      while(at+30<=u.length && dv.getUint32(at,true)===0x04034b50){
        var n=dv.getUint16(at+26,true), x=dv.getUint16(at+28,true), size=dv.getUint32(at+18,true), method=dv.getUint16(at+8,true);
        var key=td.decode(u.subarray(at+30,at+30+n)), text=td.decode(u.subarray(at+30+n+x,at+30+n+x+size));
        methods.push(method); parts[key]=text;
        if(/\\.(xml|rels)$/.test(key)){
          var doc=new DOMParser().parseFromString(text,'application/xml');
          if(doc.getElementsByTagName('parsererror').length) bad.push(key);
        }
        at+=30+n+x+size;
      }
      var sheets=await xlsxRead(u.buffer);
      return JSON.stringify({parts:parts, bad:bad, methods:methods, sheets:sheets});
    })()`));
    const book = async (rows, tab='U37', styles=[]) => {
      const bytes = JSON.parse(X.ev(`JSON.stringify(Array.from(buildXlsx([{name:${J(tab)},rows:${J(rows)}}],${J(styles)})))`));
      return readBytes(bytes);
    };
    // Each literal below has a forbidden XML unit. Require BOTH a valid package and the exact original value.
    const forbidden = [
      ['0000','\u0000'],['0001','\u0001'],['0002','\u0002'],['0003','\u0003'],['0004','\u0004'],
      ['0005','\u0005'],['0006','\u0006'],['0007','\u0007'],['0008','\u0008'],['000B','\u000B'],['000C','\u000C'],
      ['000E','\u000E'],['000F','\u000F'],['0010','\u0010'],['0011','\u0011'],['0012','\u0012'],['0013','\u0013'],
      ['0014','\u0014'],['0015','\u0015'],['0016','\u0016'],['0017','\u0017'],['0018','\u0018'],['0019','\u0019'],
      ['001A','\u001A'],['001B','\u001B'],['001C','\u001C'],['001D','\u001D'],['001E','\u001E'],['001F','\u001F'],
      ['FFFE','\uFFFE'],['FFFF','\uFFFF'],['D800','\uD800'],['DBFF','\uDBFF'],['DC00','\uDC00'],['DFFF','\uDFFF']
    ];
    for(const [hex, value] of forbidden){
      const b=await book([[value,900,200]]), wire=b.parts['xl/worksheets/sheet1.xml'];
      check('cell U+'+hex,'every part parses, encoded unit is present, exact reader text and literal $900/$200',
        [b.bad.length, wire.includes('_x'+hex+'_'), b.sheets.U37[0]], [0,true,[value,900,200]]);
    }
    const literals = [
      ['_x000B_','_x005F_x000B_'],['_x0041_','_x005F_x0041_'],['_x005F_','_x005F_x005F_'],
      ['_x00ab_','_x005F_x00ab_'],['_x0001_x0002_','_x005F_x0001_x005F_x0002_'],
      ['_x005F_x0001_','_x005F_x005F_x005F_x0001_']
    ];
    for(const [value,encoded] of literals){
      const b=await book([[value]]);
      check('literal '+value,'OOXML escape spelling is protected and decoded once, never interpreted as its character',
        [b.bad.length,b.parts['xl/worksheets/sheet1.xml'].includes(encoded),b.sheets.U37[0][0]], [0,true,value]);
    }
    for(const [value,encoded] of [['a\tb','a_x0009_b'],['a\nb','a_x000A_b'],['a\rb','a_x000D_b']]){
      const b=await book([[value]]);
      check('legal whitespace '+encoded,'control is encoded, survives exact reader roundtrip, all parts parse',
        [b.bad.length,b.parts['xl/worksheets/sheet1.xml'].includes(encoded),b.sheets.U37[0][0]], [0,true,value]);
    }
    const tab='Ctl\u000B_x0041_';
    const t=await book([['exact']],tab);
    check('workbook tab','sheet name uses same codec, is XML and reads back exactly',
      [t.bad.length,t.parts['xl/workbook.xml'].includes('Ctl_x000B__x005F_x0041_'),Object.keys(t.sheets),t.sheets[tab] ? t.sheets[tab][0] : 'missing tab'],
      [0,true,[tab],['exact']]);
    const f=await book([[1]],'U37',[{fill:false,fmt:'"bad\u000B_x0041_"0'}]);
    check('number format','custom format uses same codec and produces valid XML',
      [f.bad.length,f.parts['xl/styles.xml'].includes('&quot;bad_x000B__x005F_x0041_&quot;0')], [0,true]);
    // A genuine shared-string workbook exercises the SAME reader, not only this board's inline-string writer.
    const source=await book([['seed']]);
    const shared=JSON.parse(X.ev(`(function(){ var parts=${J(source.parts)};
      parts['xl/worksheets/sheet1.xml']=parts['xl/worksheets/sheet1.xml'].replace(/<c r="A1"[\\s\\S]*?<\\/c>/,
        '<c r="A1" t="s"><v>0</v></c>');
      parts['xl/sharedStrings.xml']='<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><t>bad_x0001__x005F_x0041_</t></si></sst>';
      return JSON.stringify(Array.from(_zipStore(Object.entries(parts).map(function(p){ return [p[0],_utf8(p[1])]; })))); })()`));
    const sr=await readBytes(shared);
    check('shared string reader','external OOXML character and protected literal decode once, every part parses',
      [sr.bad.length,sr.sheets.U37[0][0]], [0,'bad\u0001_x0041_']);
    const ordinary='O&M < > " \' &lt; &amp; =1+1 😀 _X000B_ _x00ZZ_';
    const control=await book([[ordinary,900,200]]);
    check('ordinary text control','legal entities, supplementary emoji, formula-looking and non-escape text stay exact; no formula cells',
      [control.bad.length,control.methods.every(x=>x===0),control.sheets.U37[0],/<f[ >]/.test(control.parts['xl/worksheets/sheet1.xml'])],
      [0,true,[ordinary,900,200],false]);
    check('PowerPoint control','ordinary XML escaping does not apply SpreadsheetML escapes to PPT text',
      X.ev(`_xesc('literal _x0041_ < & 😀')`), 'literal _x0041_ &lt; &amp; 😀');
    // ACTUAL OPERATED EXPORTS: registry text and a requirement title, plus a funds-flow destination name.
    seed(X.ev,{services:['USAF','ANG','AFRC'],items:[it('R1','AV',[900,200,0])],disc:[5000,5000,5000],mand:[0,0,0],order:['R1']});
    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.awards={R1:{mode:'single',d:FYMON[2][0],day:3}};
      MS.rcn=[{k:'K1',rcn:'11111',eeic:'AAAAA',t:'bad\\u0001char\\u000Bvt _x0041_',svc:['USAF','ANG','AFRC']}];
      S.rcnAsg={R1:'K1'}; S.titles={R1:'Title\\u000B_x0041_'}; applyState(S); save(); 'ok'`);
    const before=X.ev('JSON.stringify([MS,S])');
    for(const fn of ['exportExcel','exportCSV','exportSrc']){
      const bytes=JSON.parse(X.ev(`(function(){var B=window.Blob,cap=null; window.Blob=function(p,o){if(p&&p[0]&&p[0].byteLength)cap=p[0]; return new B(p,o);};
        try{ ${fn}(); }finally{window.Blob=B;} return JSON.stringify(cap?Array.from(cap):[]);})()`));
      const b=await readBytes(bytes), cells=Object.values(b.sheets).flat(2).map(x=>String(x));
      const needle=fn==='exportExcel'?'11111 / AAAAA  bad\u0001char\u000Bvt _x0041_':'Title\u000B_x0041_';
      check(fn,'real emitted workbook is XML; the exact typed text returns through board reader; no state changes',
        [b.bad.length,cells.some(x=>x.includes(needle)),X.ev('JSON.stringify([MS,S])')===before], [0,true,true]);
    }
    X.ev(`flowAddEnt(); var ix=flowEnts().length-1; flowSetEnt(ix,'n','Ctl\\u000B_x0041_'); flowSetAxis('dest'); 'ok'`);
    const bytes=JSON.parse(X.ev(`(function(){var B=window.Blob,cap=null; window.Blob=function(p,o){if(p&&p[0]&&p[0].byteLength)cap=p[0]; return new B(p,o);};
      try{exportFlow();}finally{window.Blob=B;} return JSON.stringify(cap?Array.from(cap):[]);})()`));
    const flow=await readBytes(bytes);
    check('exportFlow','actual destination workbook: every part parses and the exact name returns, including its literal escape spelling',
      [flow.bad.length,Object.keys(flow.sheets).includes('Ctl\u000B_x0041_'),Object.values(flow.sheets).flat(2).includes('Ctl\u000B_x0041_')], [0,true,true]);
    check('boot control','no page errors in the seed, codec or operated exports',X.errors.length,0);
    console.log('U37 CHECKS',checked);
  } catch(e) {
    failures.push({scenario:name,where:'harness',what:'block threw: '+String(e&&e.message||e),got:'threw',want:'ran'});
  }
  bootRelease(__bm,keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (U37): every workbook part is XML and text round-trips exactly ====
