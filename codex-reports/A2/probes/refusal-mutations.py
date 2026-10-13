from pathlib import Path
import json,re
r=Path('/workspace/orbit-codex-batches-20261013-1205ET/A2');board=(r/'fix/prioritization-board-grid.html').read_text()
entries=[
('v200-u37-refusal-gone','buildXlsx','XML unsafe workbook is emitted instead of refused','  if(_xlsxRefused(sheets, extra)) return null;\n',''),
('v200-u37-invalid-char-unchecked','_xlsxRefused','XML forbidden units and lone surrogates are not checked',next(l for l in board.splitlines() if 'const text=String(value), bad=' in l),"    const text=String(value), bad=null;"),
('v200-u37-literal-unchecked','_xlsxRefused','literal OOXML escapes are exported ambiguously',"    const token=/_x[0-9A-Fa-f]{4}_/.exec(text);","    const token=null;"),
('v200-u37-sheet-unchecked','_xlsxRefused','sheet name bypasses refusal',"    if(badText(sh.name,label+' name')) return true;\n",''),
('v200-u37-format-unchecked','_xlsxRefused','number format bypasses refusal',"  for(let i=0;i<(extra||[]).length;i++) if(extra[i].fmt && badText(extra[i].fmt,'number format '+(i+1))) return true;\n",''),
('v200-u37-cell-unchecked','_xlsxRefused','cell text bypasses refusal',"        if(v!==null && v!==undefined && typeof v!=='number' && badText(v,label+' cell '+_colL(ci)+(ri+1))) return true;\n",''),
('v200-u37-whitespace-raw','_xlXml','legal whitespace normalizes in XML attributes or text',next(l for l in board.splitlines() if l.startswith('function _xlXml(')),"function _xlXml(s){ return _xesc(s); }")]
for fn in ['exportExcel','exportCSV','exportSrc','exportFlow']:
 st=board.index('function '+fn+'(');b=board.index('const bytes=buildXlsx(',st);e=board.index('if(!bytes) return;',b)+len('if(!bytes) return;')
 find=board[b:e]
 while board.count(find)>1:
  # Following statements anchor a repeated generic guard on its own export.
  e=board.index('\n',e+1);find=board[b:e]
 assert board.count(find)==1,(fn,board.count(find))
 entries.append(('v200-u37-'+fn.lower()+'-null-unchecked',fn,'refused writer result still creates a Blob/download',find,find.replace('if(!bytes) return;','/* refused result not checked */')))
text='  // v2.00 (U37, Codex proposal): refuse XML-unsafe or ambiguous workbook text without changing the legacy reader.\n'
for mid,area,what,find,repl in entries:
 assert board.count(find)==1,(mid,board.count(find));text+='  { id: '+repr(mid)+', area: '+repr(area)+', what: '+repr(what)+',\n    find: '+json.dumps(find)+',\n    repl: '+json.dumps(repl)+' },\n'
s=(r/'base/tools/export-audit/mutate.mjs').read_text();mark='  // v2.00 (R3, Brad 11 Oct): a save that lands under a locked view says it saved the working plan.';assert s.count(mark)==1;(r/'fix/tools/export-audit/mutate.mjs').write_text(s.replace(mark,text+'\n'+mark));(r/'mutation-entries.txt').write_text(text);(r/'mutation-ids.json').write_text(json.dumps([x[0] for x in entries],indent=2))
