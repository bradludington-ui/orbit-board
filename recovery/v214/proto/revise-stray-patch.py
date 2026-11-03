import sys
src=open(sys.argv[1],encoding='utf-8').read()
mode=sys.argv[3] if len(sys.argv)>3 else 'fix'
def rep(a,b,n=1):
    global src
    c=src.count(a)
    assert c==n, (a[:80], c)
    src=src.replace(a,b)
# C6 (W2)
rep("    W.push([_SLUGMAP[k].key, JSON.stringify(next), _SLUGMAP[k].t+' board data', 'the '+_SLUGMAP[k].t+' plan']);\n",
    "    W.push([_SLUGMAP[k].key, JSON.stringify(next), _SLUGMAP[k].t+' board data', 'the '+_SLUGMAP[k].t+' plan']);\n"
    "    W.push([_SLUGMAP[k].key+'.base', JSON.stringify({file:0, folder:{}, dirty:true}), 'This browser’s record of the '+_SLUGMAP[k].t+' plan', 'the record of the '+_SLUGMAP[k].t+' plan']);\n")
# slot S10 + W1's body
rep("let FH=null;   // in-place file handle (File System Access API)\n",
    "let FH=null;   // in-place file handle (File System Access API)\n"
    "function pageBlankNow(){ try{ return _pageBlank===true && !(+LASTKNOWN||0); }catch(e){ return false; } }\n")
# W4 baseMarkDirty with blank (no folder term in the proto)
rep("function loadCounted(){ _saveGen++; DIRTY=true; try{ if(!_baseDirty){ _baseDirty=true; baseSet({dirty:true}); } }catch(e){} }\n",
    "function baseMarkDirty(){ _baseDirty=true; try{ const b=baseGet(), bl="+("pageBlankNow()" if mode!='noblank' else "false")+"; if(!b.dirty || (+b.file||0)!==(+LASTKNOWN||0) || (b.blank===true)!==bl){ baseSet({file:+LASTKNOWN||0, dirty:true, blank:bl}); } }catch(e){} }\n"
    "function loadCounted(){ _saveGen++; DIRTY=true; baseMarkDirty(); }\n")
rep("  DIRTY=true; _dlOnly=false;\n  try{ if(!_baseDirty){ _baseDirty=true; baseSet({dirty:true}); } }catch(e){}\n",
    "  DIRTY=true; _dlOnly=false;\n  baseMarkDirty();\n")
rep("let _bootRestoreErr='';", "var _pageBlank=false;\nlet _bootRestoreErr='';")
# W1 boot: _bootFile, case 3, stray rule
stray = "_bootOwnRead && _bootBase.dirty===true && !(+_bootBase.file)"
if mode!='anyrecord': stray += " && _bootBase.blank===true"
if mode!='nopack': stray += " && !(function(){ try{ const ms=JSON.parse(localStorage.getItem(_AP.key)||'null'); return _hasData(ms&&ms.dataPack); }catch(e){ return true; } })()"
rep("if(PUB && (PUB.years||Array.isArray(PUB.order))){\n  const fileTs=+(PUB.ts||0), ours=+(MS.ts||0);\n  if(fileTs > ours){",
    "let _bootFile=false;\nconst _bootStray="+stray+";\nif(PUB && (PUB.years||Array.isArray(PUB.order))){\n  const fileTs=+(PUB.ts||0), ours=+(MS.ts||0);\n  if(fileTs > ours || (_bootStray && fileTs < ours)){")
rep("      LASTKNOWN=PUB_FILE_TS;\n      if(held){", "      LASTKNOWN=PUB_FILE_TS; _bootFile=true;\n      if(held){")
rep("    LASTKNOWN=PUB_FILE_TS; _baseDirty=false; baseSet({file:LASTKNOWN, dirty:false});\n  } else if(LASTKNOWN && PUB_FILE_TS!==LASTKNOWN) _bootMoved=PUB_FILE_TS;   // saved by someone since\n}\n",
    "    LASTKNOWN=PUB_FILE_TS; _bootFile=true; _baseDirty=false; baseSet({file:LASTKNOWN, dirty:false});\n  } else if(LASTKNOWN && PUB_FILE_TS!==LASTKNOWN) _bootMoved=PUB_FILE_TS;   // saved by someone since\n}\n"
    "if(!_bootOwnRead && !_bootFile){ LASTKNOWN=0; _baseDirty=false; _pageBlank=true; }\nelse if(_bootOwnRead && !_bootFile && _bootBase.blank===true) _pageBlank=true;\n")
open(sys.argv[2],'w',encoding='utf-8').write(src)
print('ok', mode)
