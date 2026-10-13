import { boot, bootMark, bootRelease, settleBoards } from './refusal/tools/export-audit/boot.mjs';
import fs from 'node:fs';
const mark=bootMark(), X=boot({html:fs.readFileSync('./refusal/prioritization-board-grid.html','utf8')}), J=JSON.stringify;
const vals=[['spaces','  a  '],['mixed whitespace',' \t\r\n x \r\n\t '],['supplementary extremes','😀𐀀􏿿'],['entity looking','&lt; &#65; &#x41; &amp; <"\'>&'],['C1 and PUA','\u007F\u0085\u009F\uE000'],['ordinary non escapes','_X0041_ _x00ZZ_'],['money','900 / 200 / 1100']];
const bad=[['NUL','\u0000','U+0000'],['FFFE','\uFFFE','U+FFFE'],['FFFF','\uFFFF','U+FFFF'],['lone high','\uD800','U+D800'],['lone low','\uDFFF','U+DFFF'],['pair followed by lone','😀\uD800','U+D800'],['literal','_x0041_','OOXML escape'],['overlap','_x0001_x0041_','OOXML escape']];
const packages=[],results=[];
const build=(value,tab='Review')=>JSON.parse(X.ev(`(function(){var msg='',Z=_zipStore,n=0;alert=function(m){msg=String(m);};_zipStore=function(p){n++;return Z(p);};var a=JSON.stringify([MS,S]),b;try{b=buildXlsx([{name:${J(tab)},rows:[[${J(value)},900,200,1100]]}],[{fill:false,fmt:${J(value)}}]);}finally{_zipStore=Z;}return JSON.stringify({bytes:b?Array.from(b):[],zips:n,msg,same:a===JSON.stringify([MS,S])});})()`));
for(const [label,value] of vals){
 const pack=build(value); const got=JSON.parse(await X.w.eval(`(async function(){var u=new Uint8Array(${J(pack.bytes)});return JSON.stringify(await xlsxRead(u.buffer));})()`));
 results.push({label,ok:J(got.Review[0])===J([value,900,200,1100])&&pack.zips===1&&pack.same,msg:pack.msg});packages.push({label,value,sheetName:'Review',bytes:pack.bytes});
}
for(const [label,value,reason] of bad){const pack=build(value);results.push({label,ok:pack.bytes.length===0&&pack.zips===0&&pack.same&&pack.msg.includes('cell A1')&&pack.msg.includes(reason),got:pack,want:{bytes:0,zips:0,same:true,cell:'A1',reason}});}
for(const [label,value] of [['TAB','a\tb'],['LF','a\nb'],['CR','a\rb']]){const pack=build(value,value);packages.push({label,value,sheetName:value,bytes:pack.bytes});results.push({label,ok:pack.zips===1&&pack.same});}
const prior=boot({html:fs.readFileSync('./base/prioritization-board-grid.html','utf8')});
const oldbytes=JSON.parse(prior.ev("JSON.stringify(Array.from(buildXlsx([{name:'Legacy',rows:[['_x0041_',900,200]]}])))"));
const reread=JSON.parse(await X.w.eval(`(async function(){var u=new Uint8Array(${J(oldbytes)});return JSON.stringify(await xlsxRead(u.buffer));})()`));
results.push({label:'old writer literal compatibility',ok:J(reread.Legacy[0])===J(['_x0041_',900,200]),got:reread.Legacy[0],want:['_x0041_',900,200]});
fs.writeFileSync('refusal-packages.json',J(packages));fs.writeFileSync('refusal-review-results.json',J({results,errors:[...X.errors,...prior.errors]}));console.log(J({checks:results.length,failures:results.filter(x=>!x.ok),errors:[...X.errors,...prior.errors]}));bootRelease(mark,[]);await settleBoards();process.exitCode=results.some(x=>!x.ok)||X.errors.length||prior.errors.length?1:0;
