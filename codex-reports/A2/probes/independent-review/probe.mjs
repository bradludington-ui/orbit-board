import { boot, bootMark, bootRelease, settleBoards } from './fix/tools/export-audit/boot.mjs';
import fs from 'node:fs';
const mark=bootMark(); const X=boot(); const J=JSON.stringify;
const values = [
 ['empty',''],['spaces','  a  '],['mixed whitespace',' \t\r\n x \r\n\t '],
 ['supplementary extremes','😀𐀀􏿿'],['valid and lone surrogates','\uD800😀\uDC00\uDBFF\uDFFF\uD800\uD800\uDC00\uDC00'],
 ['adjacent literal','_x0001__x0041_'],['shared underscore literal','_x0001_x0041_x005F_'],
 ['literal plus control','_x0001_\u0001_x005F_x000A_'],['entity looking','&lt; &#65; &#x41; &amp;_x0041_ <"\'>&'],
 ['embedded NUL and CR','a\u0000b\rc'],['allowed C1 and PUA','\u007F\u0085\u009F\uE000'],
 ['literal lowercase hex','_x00af__x00Af__xABCD__X0041_'],['replacement','�'],
 ['numeric label','900 / 200 / 1100']
];
const results=[], packages=[];
for(const [label,value] of values){
 const rows=[[value,900,200,1100]];
 const bytes=JSON.parse(X.ev(`JSON.stringify(Array.from(buildXlsx([{name:'Round',rows:${J(rows)}}],[{fill:false,fmt:${J('"'+value+'"0')}}])))`));
 const got=JSON.parse(await X.w.eval(`(async function(){var u=new Uint8Array(${J(bytes)});var s=await xlsxRead(u.buffer);return JSON.stringify(s.Round);})()`));
 const want=[value,900,200,1100];
 const ok=J(got[0])===J(want);
 results.push({label,want,got:got[0],ok});packages.push({label,bytes});
}
const [label,value]=['all forbidden concatenated','\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u000B\u000C\u000E\u000F\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001A\u001B\u001C\u001D\u001E\u001F\uFFFE\uFFFF'];
const bytes=JSON.parse(X.ev(`JSON.stringify(Array.from(buildXlsx([{name:'Round',rows:[[${J(value)},900,200,1100]]}])))`));
const got=JSON.parse(await X.w.eval(`(async function(){var u=new Uint8Array(${J(bytes)});var s=await xlsxRead(u.buffer);return JSON.stringify(s.Round);})()`));
results.push({label,want:[value,900,200,1100],got:got[0],ok:J(got[0])===J([value,900,200,1100])});packages.push({label,bytes});
fs.writeFileSync('packages.json',J(packages));
fs.writeFileSync('review-results.json',J({results,errors:X.errors}));
console.log(J({checks:results.length,failures:results.filter(x=>!x.ok),errors:X.errors}));
bootRelease(mark,[]); await settleBoards();
process.exitCode=results.some(x=>!x.ok)||X.errors.length?1:0;
