import {boot,bootMark,bootRelease,settleBoards} from './fix/tools/export-audit/boot.mjs';
const mark=bootMark(),X=boot();
const got=JSON.parse(await X.w.eval(`(async function(){
 var b=buildXlsx([{name:'U37',rows:[['seed']]}]),u=new Uint8Array(b),d=new DataView(u.buffer),i=0,p={},td=new TextDecoder();
 while(i+30<=u.length&&d.getUint32(i,true)===0x04034b50){var n=d.getUint16(i+26,true),x=d.getUint16(i+28,true),s=d.getUint32(i+18,true);p[td.decode(u.subarray(i+30,i+30+n))]=td.decode(u.subarray(i+30+n+x,i+30+n+x+s));i+=30+n+x+s;}
 p['xl/worksheets/sheet1.xml']=p['xl/worksheets/sheet1.xml'].replace(/<c r="A1"[\\s\\S]*?<\\/c>/,'<c r="A1" t="s"><v>0</v></c>');
 p['xl/sharedStrings.xml']='<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><r><t>literal _x00</t></r><r><t>41_ bad_x0001_</t></r></si></sst>';
 var z=_zipStore(Object.entries(p).map(function(v){return [v[0],_utf8(v[1])];}));return JSON.stringify((await xlsxRead(z.buffer)).U37[0][0]);
})()`));
const want='literal _x0041_ bad\u0001';console.log(JSON.stringify({got,want,pass:got===want}));bootRelease(mark,[]);await settleBoards();process.exit(got===want?0:1);
