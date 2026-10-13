from pathlib import Path
import json
root=Path('/workspace/orbit-codex-batches-20261013-1205ET/A2');p=root/'fix/tools/export-audit/mutate.mjs';s=p.read_text();board=(root/'fix/prioritization-board-grid.html').read_text()
entries=[
('v200-u37-cell-raw','buildXlsx','cell text bypasses OOXML codec',"_xlEsc(v)+'</t></is></c>'","_xesc(v)+'</t></is></c>'"),
('v200-u37-tab-raw','buildXlsx','sheet names bypass OOXML codec',"_xlEsc(s.name.slice(0,31))","_xesc(s.name.slice(0,31))"),
('v200-u37-format-raw','_stylesXml','number formats bypass OOXML codec',"_xlEsc(e.fmt)","_xesc(e.fmt)"),
('v200-u37-literal-unprotected','_xlEsc','literal escape spellings become control characters on a reader roundtrip',"  const t=String(s).replace(/_(?=x[0-9A-Fa-f]{4}_)/g,'_x005F_');","  const t=String(s);"),
('v200-u37-overlap-unprotected','_xlEsc','overlapping literal escape spellings are not all protected',"  const t=String(s).replace(/_(?=x[0-9A-Fa-f]{4}_)/g,'_x005F_');","  const t=String(s).replace(/_x[0-9A-Fa-f]{4}_/g,function(m){return '_x005F_'+m.slice(1);});"),
('v200-u37-controls-raw','_xlEsc','XML-forbidden C0 controls enter workbook parts raw',r"  return _xesc(t.replace(/[\u0000-\u001F\uFFFE\uFFFF\uD800-\uDFFF]/g,function(c,i,v){",r"  return _xesc(t.replace(/[\uFFFE\uFFFF\uD800-\uDFFF]/g,function(c,i,v){"),
('v200-u37-lone-surrogates-raw','_xlEsc','lone UTF-16 surrogates are replaced in UTF-8 output instead of preserved',"    const n=c.charCodeAt(0), before=v.charCodeAt(i-1), after=v.charCodeAt(i+1);","    const n=c.charCodeAt(0), before=v.charCodeAt(i-1), after=v.charCodeAt(i+1); if(n>=0xD800 && n<=0xDFFF) return c;"),
('v200-u37-reader-unescaped','_xunesc','board reader retains OOXML escape spellings instead of the original text',"    .replace(/_x([0-9A-Fa-f]{4})_/g,function(_,h){ return String.fromCharCode(parseInt(h,16)); });","    ;"),
('v200-u37-reader-double-decoded','_xunesc','board reader decodes twice and turns protected literal escape spellings into characters',"    .replace(/_x([0-9A-Fa-f]{4})_/g,function(_,h){ return String.fromCharCode(parseInt(h,16)); });","    .replace(/_x([0-9A-Fa-f]{4})_/g,function(_,h){ return String.fromCharCode(parseInt(h,16)); })\n    .replace(/_x([0-9A-Fa-f]{4})_/g,function(_,h){ return String.fromCharCode(parseInt(h,16)); });")]
entries.append(('v200-u37-shared-run-boundary','xlsxRead','shared string decoding after concatenation corrupts a literal escape split across rich-text runs',"t+=_xunesc(tm[1]); sst.push(t);","t+=tm[1]; sst.push(_xunesc(t));"))
text='  // v2.00 (U37, Codex proposal): XML-safe workbooks preserve text and literal OOXML escapes exactly.\n'
for mid,area,what,find,repl in entries:
 assert board.count(find)==1,(mid,board.count(find))
 text+='  { id: '+repr(mid)+', area: '+repr(area)+', what: '+repr(what)+',\n    find: '+json.dumps(find)+',\n    repl: '+json.dumps(repl)+' },\n'
marker='  // v2.00 (R3, Brad 11 Oct): a save that lands under a locked view says it saved the working plan.'
assert s.count(marker)==1;s=s.replace(marker,text+'\n'+marker);p.write_text(s)
(root/'mutation-entries.txt').write_text(text)
(root/'mutation-ids.json').write_text(json.dumps([e[0] for e in entries],indent=2)+'\n')
