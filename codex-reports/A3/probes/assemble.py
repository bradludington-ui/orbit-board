from pathlib import Path
r=Path('/workspace/orbit-codex-batches-20261013-1205ET/A3');block=(r/'block.txt').read_text();base=(r/'base/tools/export-audit/audit-import.mjs').read_text();token='await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs\n  const __bm = bootMark();\n  const src = _selfRead';assert base.count(token)==1
(r/'fix/tools/export-audit/audit-import.mjs').write_text(base.replace(token,block+'\n'+token))
head="import {boot,seed,bootMark,bootRelease,settleBoards} from './base/tools/export-audit/boot.mjs';\nlet failures=[],checks=[];const keepBoards=()=>[];const it=(id,grp,ask)=>({id,grp,team:grp,sect:'',custom:false,title:'Req '+id,event:'Ev '+id,ccar:'CC'+id,fy26:ask.map(()=>0),ask,alloc:null});\nconst chk=(scenario,where,what,got,want)=>{const ok=String(got)===String(want);checks.push({scenario,where,what,got,want,ok});if(!ok)failures.push({scenario,where,what,got,want});};\n"
end="console.log(JSON.stringify({checks:checks.length,passed:checks.filter(x=>x.ok).length,failed:failures.length,failures,all:checks},null,2));process.exit(failures.length?1:0);\n"
(r/'focused.mjs').write_text(head+block+end)
