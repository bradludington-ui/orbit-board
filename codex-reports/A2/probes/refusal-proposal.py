from pathlib import Path
import re, shutil
r=Path('/workspace/orbit-codex-batches-20261013-1205ET/A2')
(r/'superseded-encoding').mkdir(exist_ok=True)
for f in ['prioritization-board-grid.html','tools/export-audit/audit-recon.mjs','tools/export-audit/mutate.mjs']:
 p=r/'superseded-encoding'/f;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes((r/'fix'/f).read_bytes());(r/'fix'/f).write_bytes((r/'base'/f).read_bytes())
p=r/'fix/prioritization-board-grid.html';s=p.read_text()
helper=r'''// A workbook is refused before any bytes exist, never cleaned or repaired. A literal _xHHHH_ is ambiguous
// in SpreadsheetML too: Office interprets it as a character while this board's legacy reader preserves it.
// Keeping the existing reader avoids changing text in workbooks ORBIT already exported.
function _xlsxRefused(sheets, extra){
  const badText=(value,where)=>{
    const text=String(value), bad=/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.exec(text);
    const token=/_x[0-9A-Fa-f]{4}_/.exec(text);
    if(!bad && !token) return false;
    const why=bad? 'character U+'+bad[0].charCodeAt(0).toString(16).toUpperCase().padStart(4,'0')+' cannot be stored in XML 1.0'
      : 'literal '+token[0]+' would be read as an OOXML escape by a spreadsheet';
    alert('Excel workbook not exported: '+where+' holds a '+why+'. Nothing was changed. Edit that text and try again.');
    setStat('⛔ Excel workbook not exported: '+esc(where)+' — '+esc(why)+'. Nothing was changed.');
    return true;
  };
  for(let i=0;i<sheets.length;i++){
    const sh=sheets[i], label='sheet '+(i+1)+' ('+JSON.stringify(String(sh.name))+')';
    if(badText(sh.name,label+' name')) return true;
    for(let ri=0;ri<(sh.rows||[]).length;ri++){
      const row=sh.rows[ri]||[];
      for(let ci=0;ci<row.length;ci++){
        const c=row[ci], v=c && typeof c==='object'? c.v : c;
        if(v!==null && v!==undefined && typeof v!=='number' && badText(v,label+' cell '+_colL(ci)+(ri+1))) return true;
      }
    }
  }
  for(let i=0;i<(extra||[]).length;i++) if(extra[i].fmt && badText(extra[i].fmt,'number format '+(i+1))) return true;
  return false;
}
'''
needle='function buildXlsx(sheets, extra){\n';assert s.count(needle)==1;s=s.replace(needle,helper+needle+'  if(_xlsxRefused(sheets, extra)) return null;\n')
# All16 consumers are declarations of stored ZIP bytes. Stop each operated export BEFORE Blob/download/status success.
ms=list(re.finditer(r'\bconst (\w+)=buildXlsx\(',s));assert len(ms)==16,len(ms)
for m in reversed(ms):
 at=m.end()-1;dep=0;quote=None;esc=False;j=at
 while j<len(s):
  c=s[j]
  if quote:
   if esc:esc=False
   elif c=='\\':esc=True
   elif c==quote:quote=None
  elif c in "\"'`":quote=c
  elif c=='(':dep+=1
  elif c==')':
   dep-=1
   if dep==0:break
  j+=1
 assert s[j:j+2]==');',(m.group(1),s[j:j+20])
 linestart=s.rfind('\n',0,m.start())+1;indent=s[linestart:m.start()]
 s=s[:j+2]+'\n'+indent+'if(!'+m.group(1)+') return;'+s[j+2:]
p.write_text(s)
(r/'refusal-helper.txt').write_text(helper)
print('Patched 16 caller guards; reader and _xesc unchanged')
