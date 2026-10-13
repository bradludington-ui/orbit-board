from pathlib import Path
import shutil, json, difflib
root=Path('/workspace/orbit-codex-batches-20261013-1205ET'); out=root/'A2'
for k in ['base','fix']:
 p=out/k
 if not p.exists(): shutil.copytree(root/'base',p)
(p:=out/'fix'/'prioritization-board-grid.html')
s=p.read_text()
f="    .replace(/&amp;/g,'&');\n}"
r="    .replace(/&amp;/g,'&')\n    // SpreadsheetML escapes are decoded ONCE: _x005F_x000B_ is literal _x000B_, not a vertical tab.\n    .replace(/_x([0-9A-Fa-f]{4})_/g,function(_,h){ return String.fromCharCode(parseInt(h,16)); });\n}"
assert s.count(f)==1;s=s.replace(f,r)
needle="function _colL(n)"
helper=r'''// SpreadsheetML text: preserve literal escape spellings before encoding UTF-16 units XML cannot carry.
// Keep this separate from _xesc: PowerPoint uses ordinary XML text, not SpreadsheetML's _xHHHH_ grammar.
function _xlEsc(s){
  const t=String(s).replace(/_(?=x[0-9A-Fa-f]{4}_)/g,'_x005F_');
  return _xesc(t.replace(/[\u0000-\u001F\uFFFE\uFFFF\uD800-\uDFFF]/g,function(c,i,v){
    const n=c.charCodeAt(0), before=v.charCodeAt(i-1), after=v.charCodeAt(i+1);
    if((n>=0xD800 && n<=0xDBFF && after>=0xDC00 && after<=0xDFFF)
      || (n>=0xDC00 && n<=0xDFFF && before>=0xD800 && before<=0xDBFF)) return c;
    return '_x'+n.toString(16).toUpperCase().padStart(4,'0')+'_';
  }));
}
'''
assert s.count(needle)==1;s=s.replace(needle,helper+needle)
for f,r in [("_xesc(e.fmt)","_xlEsc(e.fmt)"),("_xesc(s.name.slice(0,31))","_xlEsc(s.name.slice(0,31))"),("_xesc(v)+'</t></is></c>'","_xlEsc(v)+'</t></is></c>'")]:
 assert s.count(f)==1;s=s.replace(f,r)
p.write_text(s)
(out/'writer-helper.txt').write_text(helper)
