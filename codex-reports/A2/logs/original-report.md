BATCH A2  |  base 7ee498a46507972f803cd48ce9f27d5d668acb63  |  started / finished first recorded clock 12:10:48 PM ET / 12:49:35 PM ET, 13 Oct 2026

FINDINGS:

U37 is reproduced from the empty base board (`fce8a391bd8a248d5185e199d22190c1687eaea0`), using synthetic state only at runtime. The pinned handoff inputs are from `bbe728556dc394c50d84ad9a09facc5fa163e42b`.

1. Build a one-sheet workbook whose C1 holds each literal XML-forbidden C0 unit (U+0000–U+0008, U+000B, U+000C, U+000E–U+001F), U+FFFE/U+FFFF, or an isolated surrogate. The base emits ZIP bytes instead of refusing. Expect no workbook, exact offending unit and `cell C1` in the refusal, original text/model/storage/flags retained. Actual base export operations emit ZIP/Blob files with those values, while the proposed writer refuses them.
2. Seed one requirement: USAF $900, ANG $200, total $1,100. Put `bad\u0001char\u000Bvt` in its RCN/EEIC title and `Title\u000B` in its requirement title. Run actual `exportExcel`, `exportCSV`, and `exportSrc`. Add a destination named `Ctl\u000B` and run actual `exportFlow`. Base produces files; fix produces zero ZIP/Blob/download bytes and names the affected sheet/cell or name. This is a fresh jsdom runtime reproduction; the Chromium paste log is inspected historical evidence, not a fresh native-browser test.
3. Literal `_x0041_` is ambiguous in OOXML. The first codec draft conformed to OOXML but changed an older ORBIT workbook's reader result from literal `_x0041_` to `A`. That is a material preservation issue. There is no existing reliable producer/version marker to disambiguate old literal text from standard escapes. The codec draft and all its passing logs are superseded; they are not acceptance evidence for this proposal.
4. Legal TAB/LF/CR text must also stay exact under a standards XML parser. Raw attribute whitespace normalizes, and raw CR text normalizes to LF. The workbook-only escaper writes decimal references, which the existing reader already understands. Hand-written expectations assert original cell text, sheet name, and custom format under DOMParser and xlsxRead.
5. Cold `exportFlow` already adds the lazy `MS.flow.pseudo` and `MS.flow.subs` defaults before its writer call on the base. The test explicitly records that exact two-key delta and proves all entered containers, DIRTY, generations, base-dirty flag and browser storage are otherwise unchanged. A separate displayed-panel setup (`flowHtml()`) then proves complete snapshot identity across the refused export. The notice makes the narrower true claim: no workbook was created and original text is kept.

PROPOSAL:

Choose **refusal**, rather than OOXML string escapes, to preserve the current reader and old ORBIT-generated text without inventing a stored protocol/version marker.

- Board: central `_xlsxRefused` checks every sheet name, string cell and custom format before any ZIP bytes exist, names its precise field/unit, and returns null on refusal.
- Board: all 16 existing `buildXlsx` callers return immediately on that sentinel, before Blob/download or success status. Four representative operated routes are runtime-tested; all 16 guard positions are source-reviewed.
- Board: refuse literal `_xHHHH_` spellings too. Merely writing them raw would let Office interpret literal text as a character; refusing is explicit and leaves original data intact.
- Board: `_xlXml` adds legal whitespace references at the three workbook string sites. `_xesc` and the entire existing `xlsxRead`/`_xunesc` region remain byte-identical, preserving PPT behavior and existing workbook-reader compatibility.
- Suite: append the wrapped 53-check U37 block, keeping every original audit-recon line byte-identical. It includes bootMark/release/settle, the two-space name marker, actual ZIP-byte parsing, explicit six-part XML count and board-reader checks.
- Catalog TEXT: append 11 focused entries at the exact README marker. No old entry needs retargeting; each original and proposed find matches exactly once. No mutate.mjs import or execution occurred.

Exact proposed blobs: board `aa8f441f6b8d1d91ff213a57a025fdf608969801`, audit-recon `7be8b6e5aa19000b547ed2aa4ab76e5f471e3300`, catalog TEXT `db7a7a28b98cfd758bdd7008a3369cdeb691b92d`.

Unified diff against the exact stated base (all three files; no populated HTML):

```diff
--- a/prioritization-board-grid.html
+++ b/prioritization-board-grid.html
@@ -4180,6 +4180,7 @@
   out.push([{v:'TOTAL', s:4},'','','','','',{v:tot, s:NB},'','','','']);
   const wb=buildXlsx([{name:'Funding plan',
                        cols:[10,16,11,8,46,40,15,11,34,10,30], rows:out}]);
+  if(!wb) return;
   const a=document.createElement('a');
   a.href=URL.createObjectURL(new Blob([wb],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
   a.download=expName('ORBIT Funding Plan \u2014 '+(rlgLabel||'new requirement').replace(/[^A-Za-z0-9 ]+/g,' ').trim()
@@ -7702,6 +7703,7 @@
     +'review, not the result. DECISION / NOTES is left blank on purpose: it is yours to fill in and '
     +'keep as the record of what was accepted and why.'}]);
   const blob=buildXlsx([sheet]);
+  if(!blob) return;
   const a=document.createElement('a');
   a.href=URL.createObjectURL(new Blob([blob],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
   a.download=expName('ORBIT SUBMITTAL REVIEW - '
@@ -11666,6 +11668,7 @@
   note[7]='Report here when you need to have cash-in-hand';
   out.push(note);
   const bytes=buildXlsx([{name:'O&M,N', cols:CR_COLW.slice(), freeze:6, rows:out}], SRC_XTRA);
+  if(!bytes) return;
   const a=document.createElement('a');
   a.href=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
   a.download=expName('FY'+fy+' CRA APN OMN Oct-Mar - '+new Date().toISOString().slice(0,10)+'.xlsx');
@@ -13457,6 +13460,7 @@
   // 4. THE FILE
   const when=new Date(), org=+String(f.org).trim();
   const bytes=buildXlsx(idsSheets(P, f, when), IDS_XTRA);
+  if(!bytes) return;
   // 5. THE ONE SETTING KEPT -- the ORG -- and only now, once the file exists
   if(!MS.ids) MS.ids={};
   if(MS.ids.org!==org){ MS.ids.org=org; save(); }
@@ -16826,6 +16830,7 @@
     rows:detail((F.ext.by[c.k]||{rows:[]}).rows)}));
   if(F.upl.rows.length) sheets.push({name:tabName('Unfunded (UPL)','UPL'), cols:CD, rows:detail(F.upl.rows)});
   const bytes=buildXlsx(sheets);
+  if(!bytes) return;
   const a=document.createElement('a');
   a.href=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
   a.download=expName('ORBIT Funds Flow - '+F.label.replace(/[^A-Za-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim()
@@ -17151,6 +17156,7 @@
     label=APPN_LBL[exA]+' FY'+(exFy%100)+(exSvc!=='ALL'?' '+exSvc:'');
   }
   const bytes=buildXlsx(sheets);
+  if(!bytes) return;
   const a=document.createElement('a');
   a.href=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
   a.download=expName('ORBIT Active Year Execution - '+label+' '+dstr+'.xlsx');
@@ -17335,6 +17341,7 @@
       +(blank.length===1?'':'s')+' without a Budget.'); return; }
   }
   const bytes=buildXlsx(sheets, SRC_XTRA);
+  if(!bytes) return;
   const a=document.createElement('a');
   a.href=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
   a.download=expName('Spend Plan Source - '+new Date().toISOString().slice(0,10)+'.xlsx');
@@ -18605,6 +18612,7 @@
     sheet('PLAN A \u2014 Discretionary only','a',R.aBud,R.aT,R.A.__cut,'DISCRETIONARY ONLY'),
     sheet('PLAN B \u2014 Disc + Mandatory','b',R.bBud,R.bT,R.B.__cut,'DISCRETIONARY + MANDATORY'),
     cmp]);
+  if(!bytes) return;
   const a=document.createElement('a');
   a.href=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
   a.download=expName(document.title.replace(/FY\d\d/,FYL())+' \u2014 Two Spend Plans '+new Date().toISOString().slice(0,10)+'.xlsx');
@@ -19382,6 +19390,7 @@
     const P=fydpPmoSheets(D, A, sheets.map(function(s){ return s.name; }));
     P.sheets.forEach(function(s){ sheets.push(s); });
     const bytes=buildXlsx(sheets);
+    if(!bytes) return;
     const a=document.createElement('a');
     a.href=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
     a.download=expName('ORBIT FYDP Spend Plan — '+(D.src==='working'? 'working plan' : blLblTxt(D.src))+' — '+span+' '+new Date().toISOString().slice(0,10)+'.xlsx');
@@ -19903,6 +19912,7 @@
     sheets.push({name:'By PMO', cols:[14,12].concat(D.years.map(()=>[14,14,14,14,14,14,14,14,14,14,14,14]).flat()), freeze:4, rows:rows});
   }
   const bytes=buildXlsx(sheets);
+  if(!bytes) return;
   const a=document.createElement('a');
   a.href=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
   a.download=expName('ORBIT Cycle Comparison — '+la+' vs '+lb+' — '+span+' '+new Date().toISOString().slice(0,10)+'.xlsx');
@@ -21642,6 +21652,7 @@
     sheet.rows.push([{v:'⚠ '+toChk.length+' entr'+(toChk.length===1?'y':'ies')+' to check (the Check column says why): '+part.join('; ')+'.',s:B}]);
   }
   const bytes=buildXlsx([sheet]);
+  if(!bytes) return;
   const a=document.createElement('a');
   a.href=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
   a.download=expName(FYL()+' ATR-BTR Log '+new Date().toISOString().slice(0,10)+'.xlsx');
@@ -21806,6 +21817,7 @@
   D.by.rows.forEach(r=>sheet.rows.push(line(r.label,r.b)));
   sheet.rows.push(line('TOTAL',totOf(D.by.rows.map(r=>r.b)),true));
   const blob=buildXlsx([sheet]);
+  if(!blob) return;
   const a=document.createElement('a');
   a.href=URL.createObjectURL(new Blob([blob],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
   a.download=expName(FYL()+' Spend Plan Forecast - '+String(vl).replace(/[^A-Za-z0-9 _-]/g,'')+'.xlsx');
@@ -24757,7 +24769,7 @@
   let nfmt=167, numfmts='';
   const fmtOf=extra.map(e=>{
     if(!e.fmt) return 0;
-    numfmts+='<numFmt numFmtId="'+nfmt+'" formatCode="'+_xesc(e.fmt)+'"/>';
+    numfmts+='<numFmt numFmtId="'+nfmt+'" formatCode="'+_xlXml(e.fmt)+'"/>';
     return nfmt++;
   });
   const xfs=extra.map((e,i)=>{
@@ -24789,7 +24801,37 @@
 // THE BUILT-IN STYLES WITH NO NUMBER FORMAT OF THEIR OWN (General), as _stylesXml entries -- what a two-decimal
 // twin of each is built from (buildXlsx, v1.95)
 const XF_GENERAL={0:{fill:false, font:0}, 1:{fill:false, font:1}, 2:{fill:'1B2A4A', font:2}, 6:{fill:'D9DDE5', font:1}, 7:{fill:false, font:4}};
+// A workbook is refused before any bytes exist, never cleaned or repaired. A literal _xHHHH_ is ambiguous
+// in SpreadsheetML too: Office interprets it as a character while this board's legacy reader preserves it.
+// Keeping the existing reader avoids changing text in workbooks ORBIT already exported.
+function _xlXml(s){ return _xesc(s).replace(/\t/g,'&#9;').replace(/\n/g,'&#10;').replace(/\r/g,'&#13;'); }
+function _xlsxRefused(sheets, extra){
+  const badText=(value,where)=>{
+    const text=String(value), bad=/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.exec(text);
+    const token=/_x[0-9A-Fa-f]{4}_/.exec(text);
+    if(!bad && !token) return false;
+    const why=bad? 'character U+'+bad[0].charCodeAt(0).toString(16).toUpperCase().padStart(4,'0')+' cannot be stored in XML 1.0'
+      : 'literal '+token[0]+' would be read as an OOXML escape by a spreadsheet';
+    alert('Excel workbook not exported: '+where+' holds a '+why+'. No workbook was created. Original text is kept. Edit that text and try again.');
+    setStat('⛔ Excel workbook not exported: '+esc(where)+' — '+esc(why)+'. No workbook was created; original text is kept.');
+    return true;
+  };
+  for(let i=0;i<sheets.length;i++){
+    const sh=sheets[i], label='sheet '+(i+1)+' ('+JSON.stringify(String(sh.name))+')';
+    if(badText(sh.name,label+' name')) return true;
+    for(let ri=0;ri<(sh.rows||[]).length;ri++){
+      const row=sh.rows[ri]||[];
+      for(let ci=0;ci<row.length;ci++){
+        const c=row[ci], v=c && typeof c==='object'? c.v : c;
+        if(v!==null && v!==undefined && typeof v!=='number' && badText(v,label+' cell '+_colL(ci)+(ri+1))) return true;
+      }
+    }
+  }
+  for(let i=0;i<(extra||[]).length;i++) if(extra[i].fmt && badText(extra[i].fmt,'number format '+(i+1))) return true;
+  return false;
+}
 function buildXlsx(sheets, extra){
+  if(_xlsxRefused(sheets, extra)) return null;
   const files=[];
   // A NUMBER GOES IN AS IT IS (v1.95, item 60, F1). Every non-integer was written rounded to two decimals, so a
   // sheet in $M or $K held the rounding, not the figure: the Two-Plan Forecast wrote $85,069 as 0.09 ($M), the
@@ -24819,7 +24861,7 @@
     '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')]);
   files.push(['xl/workbook.xml',_utf8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
     '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+
-    sheets.map((s,i)=>'<sheet name="'+_xesc(s.name.slice(0,31))+'" sheetId="'+(i+1)+'" r:id="rId'+(i+2)+'"/>').join('')+
+    sheets.map((s,i)=>'<sheet name="'+_xlXml(s.name.slice(0,31))+'" sheetId="'+(i+1)+'" r:id="rId'+(i+2)+'"/>').join('')+
     '</sheets></workbook>')]);
   files.push(['xl/_rels/workbook.xml.rels',_utf8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
     '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
@@ -24864,7 +24906,7 @@
           const x=Number.isInteger(v)? v : +v.toPrecision(15);
           return '<c r="'+ref+'" s="'+((Number.isInteger(x) || !isFinite(x))? st : xfTwo(st))+'"><v>'+x+'</v></c>';
         }
-        return '<c r="'+ref+'" s="'+st+'" t="inlineStr"><is><t xml:space="preserve">'+_xesc(v)+'</t></is></c>';
+        return '<c r="'+ref+'" s="'+st+'" t="inlineStr"><is><t xml:space="preserve">'+_xlXml(v)+'</t></is></c>';
       }).join('');
       return '<row r="'+(ri+1)+'">'+cells+'</row>';
     }).join('');
@@ -29177,6 +29219,7 @@
   });
 
   const bytes=buildXlsx(sheets, extra);
+  if(!bytes) return;
   const a=document.createElement('a');
   a.href=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
   a.download=expName((_AP.exp+' ')+new Date().toISOString().slice(0,10)+'.xlsx');
@@ -29576,6 +29619,7 @@
   }
 
   const bytes=buildXlsx(sheets);
+  if(!bytes) return;
   const a=document.createElement('a');
   a.href=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
   a.download=expName(document.title.replace(/FY\d\d/,FYL())+' \u2014 ACE Tie-Out '+k+' '+new Date().toISOString().slice(0,10)+'.xlsx');
@@ -30660,6 +30704,7 @@
     }
   });
   const bytes=buildXlsx(sheets, XTRA);
+  if(!bytes) return;
   const a=document.createElement('a');
   a.href=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
   a.download=expName(scenFile(document.title.replace(/FY\d\d/,FYL())+' — Breakouts')+' '+new Date().toISOString().slice(0,10)+'.xlsx');
@@ -31512,6 +31557,7 @@
   });
 
   const bytes=buildXlsx([s1,s2,s3]);
+  if(!bytes) return;
   const a=document.createElement('a');
   a.href=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
   a.download=expName('ORBIT Chart of Accounts '+FY+' '+new Date().toISOString().slice(0,10)+'.xlsx');
--- a/tools/export-audit/audit-recon.mjs
+++ b/tools/export-audit/audit-recon.mjs
@@ -5124,6 +5124,113 @@
 })();
 // ==== end v2.00 (U14) ====
 
+// ==== v2.00 (U37): XML-unsafe workbooks are refused without losing text ====
+await (async () => {
+  const name = 'v2.00 (U37): XML-unsafe workbooks are refused without losing text';
+  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
+  const __bm=bootMark();
+  const keepBoards=()=>[];
+  try {
+    const X=boot(), J=JSON.stringify; let checked=0;
+    const check=(where,what,got,want)=>{checked++;chk(name,where,what,J(got),J(want));};
+    const readBytes = async bytes => JSON.parse(await X.w.eval(`(async function(){
+      var u=new Uint8Array(${J(Array.from(bytes))}), dv=new DataView(u.buffer), at=0, td=new TextDecoder(), parts={}, bad=[], methods=[],parsed=0;
+      while(at+30<=u.length && dv.getUint32(at,true)===0x04034b50){
+        var n=dv.getUint16(at+26,true), x=dv.getUint16(at+28,true), size=dv.getUint32(at+18,true), method=dv.getUint16(at+8,true);
+        var key=td.decode(u.subarray(at+30,at+30+n)), text=td.decode(u.subarray(at+30+n+x,at+30+n+x+size));
+        methods.push(method); parts[key]=text;
+        if(key.endsWith('.xml') || key.endsWith('.rels')){
+          parsed++; var doc=new DOMParser().parseFromString(text,'application/xml');
+          if(doc.getElementsByTagName('parsererror').length) bad.push(key);
+        }
+        at+=30+n+x+size;
+      }
+      var sheets=await xlsxRead(u.buffer);
+      return JSON.stringify({parts:parts, bad:bad, parsed:parsed, methods:methods, sheets:sheets});
+    })()`));
+    const build = (rows, tab='U37', extra=[]) => JSON.parse(X.ev(`(function(){
+      var msg='', Z=_zipStore, count=0; window.alert=function(m){msg+=String(m);};
+      _zipStore=function(p){count++;return Z(p);};
+      var before=JSON.stringify([MS,S,DIRTY,_saveGen,_sideGen,_baseDirty,Object.keys(localStorage).sort().map(function(k){return [k,localStorage.getItem(k)];})]), bytes;
+      try{ bytes=buildXlsx([{name:${J(tab)},rows:${J(rows)}}],${J(extra)}); }finally{_zipStore=Z;}
+      return JSON.stringify({bytes:bytes?Array.from(bytes):[],msg:msg,count:count,same:JSON.stringify([MS,S,DIRTY,_saveGen,_sideGen,_baseDirty,Object.keys(localStorage).sort().map(function(k){return [k,localStorage.getItem(k)];})])===before});
+    })()`));
+    const forbidden = [
+      ['0000','\u0000'],['0001','\u0001'],['0002','\u0002'],['0003','\u0003'],['0004','\u0004'],
+      ['0005','\u0005'],['0006','\u0006'],['0007','\u0007'],['0008','\u0008'],['000B','\u000B'],['000C','\u000C'],
+      ['000E','\u000E'],['000F','\u000F'],['0010','\u0010'],['0011','\u0011'],['0012','\u0012'],['0013','\u0013'],
+      ['0014','\u0014'],['0015','\u0015'],['0016','\u0016'],['0017','\u0017'],['0018','\u0018'],['0019','\u0019'],
+      ['001A','\u001A'],['001B','\u001B'],['001C','\u001C'],['001D','\u001D'],['001E','\u001E'],['001F','\u001F'],
+      ['FFFE','\uFFFE'],['FFFF','\uFFFF'],['D800','\uD800'],['DBFF','\uDBFF'],['DC00','\uDC00'],['DFFF','\uDFFF']
+    ];
+    for(const [hex,value] of forbidden){
+      const b=build([[900,200,value]]);
+      check('cell U+'+hex,'no ZIP built; no bytes; named cell C1 and offending unit; raw state unchanged',
+        [b.count,b.bytes.length,b.msg.includes('cell C1'),b.msg.includes('U+'+hex),b.same], [0,0,true,true,true]);
+    }
+    for(const value of ['_x000B_','_x0041_','_x005F_','_x00ab_','_x0001_x0002_','_x005F_x0001_']){
+      const b=build([[value]]);
+      check('literal '+value,'literal OOXML escape is refused and named, with text still in state and no bytes',
+        [b.count,b.bytes.length,b.msg.includes('cell A1'),b.msg.includes('OOXML escape'),b.same], [0,0,true,true,true]);
+    }
+    for(const [where,rows,tab,extra,notice] of [
+      ['sheet name',[['exact']],'Ctl\u000B',[],'name'],
+      ['format',[[1]],'U37',[{fill:false,fmt:'"bad\u000B"0'}],'number format 1']
+    ]){
+      const b=build(rows,tab,extra);
+      check(where,'metadata refused before ZIP; precise field named; state unchanged',
+        [b.count,b.bytes.length,b.msg.includes(notice),b.msg.includes('U+000B'),b.same], [0,0,true,true,true]);
+    }
+    // Legal XML whitespace remains exact in a standards XML parser AND in the unchanged board reader.
+    const plain='O&M < > " \' &lt; &amp; =1+1 😀 _X000B_ _x00ZZ_';
+    const good=build([[plain,900,200,1100]]), g=await readBytes(good.bytes);
+    check('ordinary control','actual accepted package: every part parses; exact text and literal $900/$200/$1100; no formula',
+      [good.count,good.same,g.bad.length,g.parsed,g.sheets.U37[0],/<f[ >]/.test(g.parts['xl/worksheets/sheet1.xml'])], [1,true,0,6,[plain,900,200,1100],false]);
+    for(const [value,encoded] of [['a\tb','a&#9;b'],['a\nb','a&#10;b'],['a\rb','a&#13;b']]){
+      const raw=build([[value]],value,[{fill:false,fmt:value}]), b=await readBytes(raw.bytes);
+      const parsed=JSON.parse(X.ev(`(function(){var P=new DOMParser(), cell=P.parseFromString(${J(b.parts['xl/worksheets/sheet1.xml'])},'application/xml'),
+        wb=P.parseFromString(${J(b.parts['xl/workbook.xml'])},'application/xml'), st=P.parseFromString(${J(b.parts['xl/styles.xml'])},'application/xml');
+        var formats=[].map.call(st.getElementsByTagName('numFmt'),function(e){return e.getAttribute('formatCode');});
+        return JSON.stringify([cell.getElementsByTagName('t')[0].textContent,wb.getElementsByTagName('sheet')[0].getAttribute('name'),formats[formats.length-1]]);})()`));
+      check('whitespace '+encoded,'writer uses character references: native XML cell/name/format and board read exact',
+        [b.bad.length,b.parts['xl/worksheets/sheet1.xml'].includes(encoded),parsed,b.sheets[value][0][0]], [0,true,[value,value,value],value]);
+    }
+    // ACTUAL OPERATED EXPORTS: every guard must stop before Blob/download when its central writer refuses.
+    seed(X.ev,{services:['USAF','ANG','AFRC'],items:[it('R1','AV',[900,200,0])],disc:[5000,5000,5000],mand:[0,0,0],order:['R1']});
+    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){BASE_ITEMS.push(i);BASE_ASK[i.id]=i.ask.slice();});
+      S.awards={R1:{mode:'single',d:FYMON[2][0],day:3}};
+      MS.rcn=[{k:'K1',rcn:'11111',eeic:'AAAAA',t:'bad\\u0001char\\u000Bvt',svc:['USAF','ANG','AFRC']}];
+      S.rcnAsg={R1:'K1'}; S.titles={R1:'Title\\u000B'};applyState(S);save();'ok'`);
+    const exportIt = fn=>JSON.parse(X.ev(`(function(){
+      var B=window.Blob,Z=_zipStore, cap=null, blobs=0, zips=0,msg=''; window.alert=function(m){msg+=String(m);};window.confirm=function(){return true;};
+      window.Blob=function(p,o){blobs++;if(p&&p[0]&&p[0].byteLength)cap=p[0];return new B(p,o);};_zipStore=function(p){zips++;return Z(p);};
+      var before=JSON.stringify([MS,S,DIRTY,_saveGen,_sideGen,_baseDirty,Object.keys(localStorage).sort().map(function(k){return [k,localStorage.getItem(k)];})]);try{${fn}();}finally{window.Blob=B;_zipStore=Z;}
+      return JSON.stringify({bytes:cap?Array.from(cap):[],blobs:blobs,zips:zips,msg:msg,same:JSON.stringify([MS,S,DIRTY,_saveGen,_sideGen,_baseDirty,Object.keys(localStorage).sort().map(function(k){return [k,localStorage.getItem(k)];})])===before,before:before,after:JSON.stringify([MS,S,DIRTY,_saveGen,_sideGen,_baseDirty,Object.keys(localStorage).sort().map(function(k){return [k,localStorage.getItem(k)];})])});})()`));
+    for(const fn of ['exportExcel','exportCSV','exportSrc']){
+      const b=exportIt(fn);
+      check(fn,'operated export refuses before ZIP/Blob/download, names sheet/cell, leaves all model state unchanged',
+        [b.zips,b.blobs,b.bytes.length,/sheet .*cell [A-Z]+[0-9]+/.test(b.msg),/U\+000[1B]/.test(b.msg),b.same], [0,0,0,true,true,true]);
+    }
+    X.ev(`flowAddEnt();var ix=flowEnts().length-1;flowSetEnt(ix,'n','Ctl\\u000B');flowSetAxis('dest');'ok'`);
+    const cold=exportIt('exportFlow'), cb=JSON.parse(cold.before), ca=JSON.parse(cold.after);
+    const added=Object.keys(ca[0].flow).filter(k=>!Object.hasOwn(cb[0].flow,k)).sort();
+    const onlyDefaults=JSON.parse(cold.after); delete onlyDefaults[0].flow.pseudo; delete onlyDefaults[0].flow.subs;
+    check('cold exportFlow','existing lazy pseudo/subs defaults are disclosed; no ZIP/Blob/file, all entered state unchanged',
+      [cold.zips,cold.blobs,cold.bytes.length,cold.msg.includes('U+000B'),added,J(onlyDefaults)===cold.before],
+      [0,0,0,true,['pseudo','subs'],true]);
+    // A person using the displayed funds-flow panel has already initialized those display defaults.
+    X.ev('flowHtml(); \'ok\'');
+    const flow=exportIt('exportFlow');
+
+    check('exportFlow','operated destination export refuses safely before ZIP/Blob/download, field named, data unchanged',
+      [flow.zips,flow.blobs,flow.bytes.length,flow.msg.includes('U+000B'),flow.same], [0,0,0,true,true]);
+    check('boot control','no page error during refusals or actual exports',X.errors.length,0);
+    console.log('U37 CHECKS',checked);
+  } catch(e) { failures.push({scenario:name,where:'harness',what:'block threw: '+String(e&&e.message||e),got:'threw',want:'ran'}); }
+  bootRelease(__bm,keepBoards()); await settleBoards();
+})();
+// ==== end v2.00 (U37): XML-unsafe workbooks are refused without losing text ====
+
 {
   const src = _selfRead(_selfPath(import.meta.url), 'utf8');
   const named = [...src.matchAll(/^  const name = '([^']+)'/gm)].map(m => m[1]);   // a scenario's own line, never this one
--- a/tools/export-audit/mutate.mjs
+++ b/tools/export-audit/mutate.mjs
@@ -4285,6 +4285,41 @@
   { id: "v200-u14-notice-plural-it", area: "flowHtml", what: "the panel's notice says \"keeps it\" however many saved years the board cannot answer for: FY24 and FY26 \"stay in the saved selection\", and switching a year \"keeps it\"",
     find: "switching a year on or off keeps '+(F.unavail.length===1?'it':'them')+'.</div>'",
     repl: "switching a year on or off keeps it.</div>'" },
+  // v2.00 (U37, Codex proposal): refuse XML-unsafe or ambiguous workbook text without changing the legacy reader.
+  { id: 'v200-u37-refusal-gone', area: 'buildXlsx', what: 'XML unsafe workbook is emitted instead of refused',
+    find: "  if(_xlsxRefused(sheets, extra)) return null;\n",
+    repl: "" },
+  { id: 'v200-u37-invalid-char-unchecked', area: '_xlsxRefused', what: 'XML forbidden units and lone surrogates are not checked',
+    find: "    const text=String(value), bad=/[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\uFFFE\\uFFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|(?<![\\uD800-\\uDBFF])[\\uDC00-\\uDFFF]/.exec(text);",
+    repl: "    const text=String(value), bad=null;" },
+  { id: 'v200-u37-literal-unchecked', area: '_xlsxRefused', what: 'literal OOXML escapes are exported ambiguously',
+    find: "    const token=/_x[0-9A-Fa-f]{4}_/.exec(text);",
+    repl: "    const token=null;" },
+  { id: 'v200-u37-sheet-unchecked', area: '_xlsxRefused', what: 'sheet name bypasses refusal',
+    find: "    if(badText(sh.name,label+' name')) return true;\n",
+    repl: "" },
+  { id: 'v200-u37-format-unchecked', area: '_xlsxRefused', what: 'number format bypasses refusal',
+    find: "  for(let i=0;i<(extra||[]).length;i++) if(extra[i].fmt && badText(extra[i].fmt,'number format '+(i+1))) return true;\n",
+    repl: "" },
+  { id: 'v200-u37-cell-unchecked', area: '_xlsxRefused', what: 'cell text bypasses refusal',
+    find: "        if(v!==null && v!==undefined && typeof v!=='number' && badText(v,label+' cell '+_colL(ci)+(ri+1))) return true;\n",
+    repl: "" },
+  { id: 'v200-u37-whitespace-raw', area: '_xlXml', what: 'legal whitespace normalizes in XML attributes or text',
+    find: "function _xlXml(s){ return _xesc(s).replace(/\\t/g,'&#9;').replace(/\\n/g,'&#10;').replace(/\\r/g,'&#13;'); }",
+    repl: "function _xlXml(s){ return _xesc(s); }" },
+  { id: 'v200-u37-exportexcel-null-unchecked', area: 'exportExcel', what: 'refused writer result still creates a Blob/download',
+    find: "const bytes=buildXlsx(sheets, XTRA);\n  if(!bytes) return;",
+    repl: "const bytes=buildXlsx(sheets, XTRA);\n  /* refused result not checked */" },
+  { id: 'v200-u37-exportcsv-null-unchecked', area: 'exportCSV', what: 'refused writer result still creates a Blob/download',
+    find: "const bytes=buildXlsx(sheets, extra);\n  if(!bytes) return;",
+    repl: "const bytes=buildXlsx(sheets, extra);\n  /* refused result not checked */" },
+  { id: 'v200-u37-exportsrc-null-unchecked', area: 'exportSrc', what: 'refused writer result still creates a Blob/download',
+    find: "const bytes=buildXlsx(sheets, SRC_XTRA);\n  if(!bytes) return;",
+    repl: "const bytes=buildXlsx(sheets, SRC_XTRA);\n  /* refused result not checked */" },
+  { id: 'v200-u37-exportflow-null-unchecked', area: 'exportFlow', what: 'refused writer result still creates a Blob/download',
+    find: "const bytes=buildXlsx(sheets);\n  if(!bytes) return;\n  const a=document.createElement('a');\n  a.href=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));\n  a.download=expName('ORBIT Funds Flow - '+F.label.replace(/[^A-Za-z0-9 ]+/g,' ').replace(/\\s+/g,' ').trim()",
+    repl: "const bytes=buildXlsx(sheets);\n  /* refused result not checked */\n  const a=document.createElement('a');\n  a.href=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));\n  a.download=expName('ORBIT Funds Flow - '+F.label.replace(/[^A-Za-z0-9 ]+/g,' ').replace(/\\s+/g,' ').trim()" },
+
   // v2.00 (R3, Brad 11 Oct): a save that lands under a locked view says it saved the working plan.
   { id: "v200-r3-landed-view-unsaid", area: "_driveStorePushRun", what: "a folder save that lands while a locked view is on screen says “🔒 Not kept — PB27 is a locked view. ✅ Saved …” again, naming no plan (or, quiet, leaves persist's refusal on screen)",
     find: "  if(CYCVIEW){ _cycRefusedAt=0; setStat('✅ <b>Saved the working plan</b> of '+esc(APPN_LBL[ap]||ap)+' FY'+(fy%100)+' to the shared folder — '\n    +Math.round(body.length/1024)+' KB, built before '+blLbl(CYCVIEW)+' was put on screen. '+blLbl(CYCVIEW)+' is a locked view: nothing in it '\n    +'is saved. Everyone sees the working plan on their next refresh.'+penNote+lateNote); render(); return true; }\n",
```

RUNS:

Environment: Node v24.19.0, jsdom 27.0.0, playwright-core 1.63.0. The task-local encoding shim supplies TextEncoder/TextDecoder to jsdom; product and original boot/tool code are unchanged. Every command used the task-local supervised runner with the recorded cap, owned process group, termination cleanup, Eastern start/finish and exit metadata; no command timed out. All processes recorded by this batch have exited.

| Run | Command | Exit | Duration / cap | Result |
| --- | --- | --- | --- | --- |
| Base focused | `node --import ../../runtime-encoding-shim.mjs tools/export-audit/focus-u37.mjs` | 1 | 1.331 s / cap 60 | 51 named failures / 53 checks (2 controls pass) |
| Fixed focused | `node --import ../../runtime-encoding-shim.mjs tools/export-audit/focus-u37.mjs` | 0 | 1.848 s / cap 60 | 53/53, ALL CHECKS PASSED |
| Fixed full audit-recon | `node --import ../../runtime-encoding-shim.mjs tools/export-audit/audit-recon.mjs` | 0 | 110.357 s / cap 240 | ALL CHECKS PASSED |
| Fixed full audit-other | `node --import ../../runtime-encoding-shim.mjs tools/export-audit/audit-other.mjs` | 0 | 14.613 s / cap 180 | ALL CHECKS PASSED |
| Fixed full audit-ppt | `node --import ../../runtime-encoding-shim.mjs tools/export-audit/audit-ppt.mjs` | 0 | 1.781 s / cap 180 | ALL CHECKS PASSED |
| Fixed full audit (Excel) | `node --import ../../runtime-encoding-shim.mjs tools/export-audit/audit.mjs` | 0 | 3.540 s / cap 180 | ALL CHECKS PASSED |
| Original catalog mcount | `python3 -I helpers/mcount.py A2/base/tools/export-audit/mutate.mjs A2/base/prioritization-board-grid.html` | 0 | 1.824 s / cap 60 | 1,328 / 1,328 exactly once |
| Proposed catalog mcount | `python3 -I helpers/mcount.py A2/fix/tools/export-audit/mutate.mjs A2/fix/prioritization-board-grid.html` | 0 | 1.068 s / cap 60 | 1,339 / 1,339 exactly once |

Every one of the 51 new protection checks fails on the base and passes on the fix. The two explicitly labelled controls pass on both. The focused harness is the exact appended suite block, with only its boot/chk/fixture bindings and summary around it. Fresh full audit-recon at the final suite blob passes. The other three full suites ran earlier on this same final board/tool blobs; only audit-recon's later snapshot assertions changed, and those suites do not read that file.

Mutants were constructed ONLY with `python3 -I helpers/mkmut.py <catalog-TEXT> <empty-proposal-board> <id> <empty-mutant-board>`, each with a 60-second cap and one match. Then each used `BOARD=<mutant> node --import ../../runtime-encoding-shim.mjs tools/export-audit/focus-u37.mjs`, supervised with cap60. All use the final strengthened suite. No catch is a crash, timeout or scenario-never-ran.

| Proposed mutation | Exit | Duration | Result |
| --- | --- | --- | --- |
| v200-u37-refusal-gone | 1 | 3.416 s | 48 named failures |
| v200-u37-invalid-char-unchecked | 1 | 3.610 s | 42 named failures |
| v200-u37-literal-unchecked | 1 | 5.708 s | 6 named failures |
| v200-u37-sheet-unchecked | 1 | 4.961 s | 1 named failures |
| v200-u37-format-unchecked | 1 | 4.611 s | 1 named failures |
| v200-u37-cell-unchecked | 1 | 6.848 s | 46 named failures |
| v200-u37-whitespace-raw | 1 | 5.659 s | 3 named failures |
| v200-u37-exportexcel-null-unchecked | 1 | 7.963 s | 1 named failures |
| v200-u37-exportcsv-null-unchecked | 1 | 7.567 s | 1 named failures |
| v200-u37-exportsrc-null-unchecked | 1 | 7.100 s | 1 named failures |
| v200-u37-exportflow-null-unchecked | 1 | 6.037 s | 2 named failures |

Independent refusal review in `A2-review/`: 19 edge/preservation checks pass; Python zipfile/ElementTree independently parses 60 XML/rels parts in 10 accepted workbooks and checks exact cell/name/format values; four actual operated refusal routes record zero ZIP, Blob, anchor-click and storage-write counts. The old-writer literal `_x0041_` stays literal under the final reader. These are separate from the superseded codec review and its 90-part results. Native Office was not run.

Artifacts: this report, `PROPOSAL.patch`, `source-identities.json`, `mutation-ids.json`, `refusal-*-meta.json`, corresponding raw logs, and `A2-review/REVIEW.md`. Superseded encoder implementation and earlier diagnostic logs remain preserved separately. The preliminary refusal mutant-generator anchoring failure and the cold-flow harness mismatch are not counted as acceptance runs.

NOT DONE / LIMITS:

No branch/repository/editor checkout changes, commits, pushes, PRs or GitHub posts. No mutation sweep, full gate, full import suite, playwright install, populated-board return or real-budget/shared-folder access. B2/C1/C2/D1 were not started.

This is a sandbox proposal, not an integrated fix or release pass. XML well-formedness and exact board-reader/native XML parsing do not establish Excel/LibreOffice acceptance or real two-machine save behavior. The other 12 operated writer refusal routes were source-reviewed, not each dynamically driven with a bad string; all are reached through the same preflight and have immediate null guards. The new refusal deliberately blocks a workbook containing an OOXML-looking literal until that text is changed; nothing is silently normalized or discarded. Existing invalid older files are not repaired automatically. Other sheet-naming restrictions and truncation issues belong to A4/U42 and are not represented as fixed here.

QUESTIONS FOR BRAD:

None required to review this proposal. Adoption remains the lead's separate integration/review decision under the handoff rules.
