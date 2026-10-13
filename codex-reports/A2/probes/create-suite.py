from pathlib import Path
root=Path('/workspace/orbit-codex-batches-20261013-1205ET/A2')
block=(root/'suite-block.mjs').read_text()
p=root/'fix/tools/export-audit/audit-recon.mjs';s=p.read_text();marker="\n{\n  const src = _selfRead(_selfPath(import.meta.url), 'utf8');";assert s.count(marker)==1;p.write_text(s.replace(marker,'\n'+block+marker))
header="""import { boot, seed } from './boot.mjs';
const failures=[];
const chk=(scenario,where,what,got,want)=>{if(String(got)!==String(want))failures.push({scenario,where,what,got,want});};
const it=(id,grp,ask)=>({id,grp,team:grp,sect:'',custom:false,title:'Req '+id,event:'Ev '+id,ccar:'',fy26:ask.map(()=>0),ask,alloc:null});
"""
ending="""\nconsole.log(JSON.stringify({failures},null,2)); console.log(failures.length?failures.length+' FAILING CHECK(S)':'ALL CHECKS PASSED'); process.exit(failures.length?1:0);\n"""
for k in ['base','fix']:(root/k/'tools/export-audit/focus-u37.mjs').write_text(header+block+ending)
