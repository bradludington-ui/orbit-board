// Throwaway: (c) a refused full import leaves the board reading unsaved (v2.13). jsdom, the repo's boot.mjs, read only.
import { boot, seed } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
const it = (id, grp, ask) => ({ id, title: id, grp, ask, event: 'E' + id });
const SC = { services: ['USAF','ANG','AFRC'], items: [it('A','PSM',[900,200,100]), it('B','AV',[300,80,40])], disc:[1000,200,100], mand:[200,50,40], order:['A','B'] };
const A = boot(); seed(A.ev, SC);
const html = A.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save();
  ACEDB={ts:1700000000100, sets:{'ACE1':{fp:'f', locked:false, appn:{}, lines:[]}}}; persistAce();
  BUDDB={ts:1700000000100, rows:[{ap:'om', svc:'USAF', name:'X', amt:1}], files:['b.xlsx']}; persistBud();
  buildSavedHtml()`);
const B = boot();   // the program with no board, in an empty browser
const look = () => JSON.parse(B.ev(`JSON.stringify({DIRTY, unsaved:unsavedNow(), baseDirty:_baseDirty, sideGen:_sideGen, sideSaved:_sideSaved, refused:Object.keys(_lsRefused), dl:_dlOnly, saveState:(document.getElementById('saveState')||{}).textContent})`));
const before = look();
const r = B.ev(`(function(){ window.confirm=function(){ return true; }; const al=[]; window.alert=function(m){ al.push(String(m).slice(0,120)); };
  const _si=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(k==='prio27acedb') throw new DOMException('q','QuotaExceededError'); return _si.call(this,k,v); };
  let ret; try{ ret=fullImportText(${JSON.stringify(html)}, 'old.html'); } finally { Storage.prototype.setItem=_si; }
  return JSON.stringify({ret, al}); })()`);
console.log(JSON.stringify({ before, import: JSON.parse(r), after: look(), log: JSON.parse(B.ev(`JSON.stringify(STAT_LOG.map(function(e){ return [e.keep, e.read, String(e.html||e.text||JSON.stringify(e)).replace(/<[^>]+>/g,"").slice(0,200)]; }))`)) }, null, 1));
