from pathlib import Path
r=Path('/workspace/orbit-codex-batches-20261013-1205ET');a=r/'A4'
bl=(a/'blocks.mjs.txt').read_text().replace('preflight().filter','preflight().find.filter')
bl=bl.replace("var z=zipRead(cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength));\n        var wb=new TextDecoder().decode(z['xl/workbook.xml']);", """var u=cap instanceof Uint8Array?cap:new Uint8Array(cap),i=0,wb='',dec=new TextDecoder();
        while(i+30<=u.length && u[i]===80 && u[i+1]===75 && u[i+2]===3 && u[i+3]===4){
          var dv=new DataView(u.buffer,u.byteOffset+i),sz=dv.getUint32(18,true),nl=dv.getUint16(26,true),xl=dv.getUint16(28,true);
          var fn=dec.decode(u.subarray(i+30,i+30+nl));
          if(fn==='xl/workbook.xml'){if(dv.getUint16(8,true)!==0)throw Error('unexpected ZIP compression');wb=dec.decode(u.subarray(i+30+nl+xl,i+30+nl+xl+sz));}
          i+=30+nl+xl+sz;
        } if(!wb)throw Error('missing workbook.xml');""")
(a/'blocks.mjs.txt').write_text(bl)
s=(r/'base/tools/export-audit/audit-recon.mjs').read_text();mark=s.rfind('\n{\n',0,s.index('  named.forEach(n'))
(a/'fix/tools/export-audit/audit-recon.mjs').write_text(s[:mark]+'\n'+bl+s[mark:])
prefix="""import {boot,seed} from './fix/tools/export-audit/boot.mjs';
const failures=[]; let count=0; const checks=[];
const chk=(scenario,where,what,got,want)=>{count++;const ok=String(got)===String(want);checks.push({scenario,where,what,got,want,ok});if(!ok)failures.push({scenario,where,what,got,want});};
const it=(id,grp,ask)=>({id,grp,team:grp,sect:'',custom:false,title:'Req '+id,event:'Ev '+id,ccar:'CC'+id,fy26:ask.map(()=>0),ask,alloc:null});
"""
(a/'focused.mjs').write_text(prefix+bl.replace("import('./boot.mjs')","import('./fix/tools/export-audit/boot.mjs')")+"\nconsole.log(JSON.stringify({checks:count,checksDetail:checks,failures},null,2));process.exit(failures.length?1:0);\n")
