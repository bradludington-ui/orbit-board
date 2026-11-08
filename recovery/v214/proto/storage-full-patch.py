# Throwaway: applies the map's proposed storage-full survival changes to a scratch copy of v2.13 (never the tracked file).
import sys
src, dst = sys.argv[1], sys.argv[2]
t = open(src, encoding='utf-8').read()
def rep(a, b, n=1):
    global t
    c = t.count(a)
    if c != n: raise SystemExit('find %r matched %d times' % (a[:80], c))
    t = t.replace(a, b)

# lsSet: a 4th argument; quiet = counted, the caller says what it means
rep("function lsSet(key, val, what){", "function lsSet(key, val, what, o){")
rep("""    try{ DIAG.refused.push({t:Date.now(), what:diagClean(what, false), why:String((e&&e.name)||'error').replace(/[^A-Za-z]/g,'')}); }catch(e2){}
    // v1.97 (item 76): working out of the shared folder""",
"""    try{ DIAG.refused.push({t:Date.now(), what:diagClean(what, false), why:String((e&&e.name)||'error').replace(/[^A-Za-z]/g,'')}); }catch(e2){}
    if(o && o.quiet) return false;
    // v1.97 (item 76): working out of the shared folder""")
# the side generation at the end of opening
rep("let _sideGen=0, _sideSaved=0, _lsRefused={};", "let _sideGen=0, _sideSaved=0, _lsRefused={};\nvar _sideBootGen=Infinity;")
rep("try{ _sideSaved=_sideGen; }catch(e){}\n", "try{ _sideSaved=_sideGen; }catch(e){}\ntry{ _sideBootGen=_sideGen; }catch(e){}\n")
# persist counts its refusal, and says what follows
rep("""    _persistFail=true;
    // v2.09 (item 127)""",
"""    _persistFail=true;
    try{ DIAG.refused.push({t:Date.now(), what:diagClean(_AP.t+' board data', false), why:String((e&&e.name)||'error').replace(/[^A-Za-z]/g,'')}); }catch(e2){}
    // v2.09 (item 127)""")
rep("""      +'💾 <b>Save</b> now to '+(SANDBOX? 'keep it in your office’s own file' : 'write it into the file')+', which does not use browser storage.'); }catch(e2){}""",
"""      +'💾 <b>Save</b> now to '+(SANDBOX? 'keep it in your office’s own file' : 'write it into the file')+', which does not use browser storage.'
      +' Until it is saved, closing or reloading this page asks first'+(SANDBOX? '.' : ', and switching appropriation waits.')); }catch(e2){}""")
# memOnlyNow / memOnlyBlock beside unsavedNow
rep("function unsavedNow(){ return !!DIRTY || sideUnsaved(); }",
"""function unsavedNow(){ return !!DIRTY || sideUnsaved(); }
function memOnlyNow(){
  try{
    if(DIRTY && _persistFail) return true;
    for(const k in _lsRefused) if(_lsRefused[k]>_sideBootGen) return true;
  }catch(e){}
  return false;
}
function memOnlyBlock(head, act){
  if(!memOnlyNow()) return false;
  const sb=(typeof SANDBOX!=='undefined' && SANDBOX), tgt=sb? 'your office’s own file' : 'the board file';
  if(_dlOnly){
    if(confirm('Your latest changes are in the copy you downloaded, but not in '+tgt+', and browser storage could not keep them.\\n\\n'
      +act.charAt(0).toUpperCase()+act.slice(1)+': afterwards only the downloaded copy holds them.\\n\\nOK — go on.\\nCancel — stay here.')) return false;
    setStat(esc(head)+' — nothing changed.'); return true;
  }
  setStat('⛔ <b>'+esc(head)+'.</b> Your latest changes are on screen only: browser storage refused them, so no saved copy holds them, and '
    +esc(act)+', which would lose them. 💾 <b>Save</b> '+(sb? 'keeps them in your office’s own file' : 'writes them into the board file')+', then try again.'
    +(impMixedOn()? ' 💾 Save is held while the stopped import is sorted out: ⬇ <b>Save a copy</b> (▾ beside 💾 Save → ⬇ Save a copy…) keeps them in a new file.' : ''));
  return true;
}""")
# beforeunload, _leaving, reopenPage
rep("try{ window.addEventListener('beforeunload', liveLeaving); }catch(e){}",
"""try{ window.addEventListener('beforeunload', liveLeaving); }catch(e){}
var _leaving=false;
function memOnlyLeave(ev){
  try{ if(_leaving || !memOnlyNow()) return; ev.preventDefault(); ev.returnValue=''; return ''; }catch(e){}
}
try{ window.addEventListener('beforeunload', memOnlyLeave); }catch(e){}
function reopenPage(){ _leaving=true; try{ location.reload(); }catch(e){} }""")
# switchAppn
rep("""  if(a&&a!==APPN&&APPNS[a]){ try{liveLeaving();}catch(e){} try{localStorage.setItem("prio27appn",a);}catch(e){} location.reload(); } }""",
"""  if(!(a&&a!==APPN&&APPNS[a])) return false;
  const back=function(){ try{ const _as=document.getElementById('appnSel'); if(_as) _as.value=APPN; }catch(e){} try{ render(); }catch(e){} };
  if(!asked && memOnlyBlock('Not switched', 'switching appropriation reopens the page')){ back(); return false; }
  if(!lsSet('prio27appn', a, 'Which appropriation this browser opens', {quiet:true})){
    back();
    setStat('⛔ <b>Not switched.</b> Browser storage is full, so this browser cannot note which appropriation to open, and the page would reopen on '
      +esc(_AP.t)+' again. Nothing changed. Setup › Save diagnostics… shows what fills it; Setup › Clear this computer… frees what ORBIT keeps there, after asking (the board file is not touched).');
    return false;
  }
  try{ liveLeaving(); }catch(e){}
  reopenPage(); return true; }""")
rep("function switchAppn(a){", "function switchAppn(a, asked){")
rep("""    try{ render(); }catch(e){}
    return; }
  if(!(a&&a!==APPN""", """    try{ render(); }catch(e){}
    return false; }
  if(!(a&&a!==APPN""")
# cycGoAppn
rep("""  try{ localStorage.setItem(CYC_GO_KEY, k); }catch(e){}
  switchAppn(APPN_LBL[k]);""",
"""  if(memOnlyBlock('Not opened', 'opening '+_SLUGMAP[k].t+' reopens the page')){ try{ render(); }catch(e){} return; }
  lsSet(CYC_GO_KEY, k, 'Which board opens PPBE cycles next', {quiet:true});
  if(!switchAppn(APPN_LBL[k], true)){ try{ localStorage.removeItem(CYC_GO_KEY); }catch(e){} }""")
# writerKey
rep("""function writerKey(){
  let k=''; try{ k=localStorage.getItem('prio27writerKey')||''; }catch(e){}
  if(!/^[0-9a-f]{32}$/.test(k)){""",
"""var _wkMem='';
function writerKeyHeld(){ if(_wkMem) return _wkMem; let k=''; try{ k=localStorage.getItem('prio27writerKey')||''; }catch(e){} return /^[0-9a-f]{32}$/.test(k)? k : ''; }
function writerKey(){
  let k=writerKeyHeld();
  if(!k){""")
rep("""    try{ localStorage.setItem('prio27writerKey', k); }catch(e){}
  }
  return k;""", """    if(!lsSet('prio27writerKey', k, 'This browser’s writer key', {quiet:true})) _wkMem=k;
  }
  return k;""")
rep("""    let k=''; try{ k=localStorage.getItem('prio27writerKey')||''; }catch(e){}
    if(/^[0-9a-f]{32}$/.test(k) && writerIsMe(WRITER)) return '';""",
"""    const k=writerKeyHeld();
    if(k && writerIsMe(WRITER)) return '';""")
# whoIs / whoAmI
rep("function whoIs(){ try{ return localStorage.getItem('prio27who')||''; }catch(e){ return ''; } }",
"var _whoMem='';\nfunction whoIs(){ let w=''; try{ w=localStorage.getItem('prio27who')||''; }catch(e){} return _whoMem||w; }")
rep("""  let w=null;
  try{ w=localStorage.getItem('prio27who'); }catch(e){}
  if(!w||force){""", """  let w=whoIs()||null;
  if(!w||force){""")
rep("""      try{ localStorage.setItem('prio27who', nv); }catch(e){}
      setStat('\\u{1F464} Editor name set to <b>'+esc(nv)+'</b> — stamped on future saves.');
    });
    try{ w=localStorage.getItem('prio27who'); }catch(e){}""",
"""      const kept=lsSet('prio27who', nv, 'Your editor name', {quiet:true});
      _whoMem=kept? '' : nv;
      setStat('\\u{1F464} Editor name set to <b>'+esc(nv)+'</b> — stamped on future saves.'
        +(kept? '' : ' Browser storage would not keep it, so this page remembers it until it is closed, and asks again next time.'));
    });
    w=whoIs()||null;""")
# clearComputer
rep("""  try{ location.reload(); }catch(e){}
  return R;""", """  reopenPage();
  return R;""")
# Save diagnostics: by kind
rep("""  add('  Writes refused:     '+(DIAG.refused.length?""",
"""  if(keys>=0) try{ const LK=diagLsKinds();
    add('  Storage by kind:    characters, keys and values together, as browser storage counts them');
    LK.rows.forEach(function(r){ add('    '+(r.label+':').padEnd(18)+(r.n? r.n+' entr'+(r.n===1?'y':'ies')+', '+r.c+' characters' : 'none')
      +((r.k==='copy' && r.n)? ' ('+LK.stamps+' publish date'+(LK.stamps===1?'':'s')+')' : '')); }); }catch(e){ add('  Storage by kind:    could not be read'); }
  add('  Writes refused:     '+(DIAG.refused.length?""")
rep("function diagStoreOf(k){", """function diagLsKinds(){
  const K=[['board','Boards'],['cyc','Locked cycles'],['list','Lists'],['kept','Work kept aside'],['base','Save records'],['copy','PMO copies'],['set','Settings'],['other','Not ORBIT']];
  const R={}, stamps={}; K.forEach(function(x){ R[x[0]]={n:0, c:0}; });
  const ap='('+APPN_SLUGS.join('|')+')', reB=new RegExp('^prio27'+ap+'$'), reC=new RegExp('^prio27'+ap+'-cyc$'), reL=/^prio27(execdb|acedb|buddb|reprog|destdb)$/;
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i); if(k===null) continue;
    const c=k.length+(localStorage.getItem(k)||'').length; let f='set', m;
    if(!CLR_PREFIX.test(k)) f='other';
    else if((m=k.match(/-pmo(\\d+)/))){ f='copy'; stamps[m[1]]=1; }
    else if(/\\.kept$/.test(k)) f='kept';
    else if(/\\.base$/.test(k)) f='base';
    else if(reC.test(k)) f='cyc';
    else if(reB.test(k)) f='board';
    else if(reL.test(k)) f='list';
    R[f].n++; R[f].c+=c;
  }
  return {rows:K.map(function(x){ return {k:x[0], label:x[1], n:R[x[0]].n, c:R[x[0]].c}; }), stamps:Object.keys(stamps).length};
}
function diagStoreOf(k){""")
open(dst, 'w', encoding='utf-8').write(t)
print('ok', len(t))
