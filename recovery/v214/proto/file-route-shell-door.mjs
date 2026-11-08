// THROWAWAY (outside the tree): on v2.13, (E) Import one appropriation on an EMPTY board lands part of a board while saying it
// took all of it; (D) Save into a remembered program file (pubState null) downloads instead of writing in place.
import { boot, seed } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
import { readFileSync } from 'node:fs';
const PROG = readFileSync(process.argv[2] || '/home/user/orbit-board/prioritization-board-grid.html', 'utf8');
const J = JSON.stringify;
const SVC = ['USAF', 'ANG', 'AFRC'];
const mk = (id, ask) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Req ' + id, event: 'E' + id, ccar: '', fy26: [0, 0, 0], ask, alloc: null });
const lsOf = ev => JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
// a consolidated board with O&M and Full Fund, each seeded on its own board, saved from O&M
const ap = (html, appn, ids) => { const B = boot({ html, appn }); seed(B.ev, { services: SVC, items: ids.map((x, i) => mk(x, [900 + i, 200, 100])), disc: [2000, 600, 300], mand: [500, 150, 80], order: ids });
  B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`); return B; };
const F = ap(PROG, 'FULL FUND', ['F1', 'F2']);
const O = ap(PROG, 'O&M', ['A', 'B']);
O.ev(`localStorage.setItem('prio27ff', ${J(lsOf(F.ev).prio27ff)}); 'ok'`);
const board = O.ev('buildSavedHtml()');
const R = {};
// E: the shell takes it through ⬅ Import one appropriation (importState), browser storage refusing the Full Fund plan
{
  const T = boot({ html: PROG, ls: {} });
  R.E_shell = T.ev('IS_SHELL');
  T.ev(`window.confirm=function(){ return true; }; globalThis.__si=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){ if(k==='prio27ff') throw new DOMException('The quota has been exceeded.','QuotaExceededError'); return globalThis.__si.call(this,k,v); }; 'ok'`);
  T.w.__f = new T.w.File([board], 'ORBIT Live.html', { type: 'text/html' });
  T.ev(`importState({files:[globalThis.__f], value:''}); 'ok'`);
  await new Promise(r => setTimeout(r, 400));
  const after = lsOf(T.ev);
  R.E_status = T.ev(`(document.getElementById('shareStat')||{}).textContent||''`).slice(0, 200);
  R.E_reloaded = T.errors.some(e => /navigation/i.test(e));
  R.E_om_stored = 'prio27om' in after; R.E_ff_stored = 'prio27ff' in after;
  R.E_defect = R.E_reloaded && /Loaded O&M, Full Fund/.test(R.E_status) && !R.E_ff_stored;
}
// D: Save into the program file it runs in, remembered (pubState null)
{
  const T = boot({ html: PROG, ls: {} });
  const f = { content: PROG, writes: 0 };
  T.w.__disk = { name: 'ORBIT v2.13.html', requestPermission: async () => 'granted', getFile: async () => ({ text: async () => f.content }),
    createWritable: async () => { let b = ''; return { write: async x => { b += String(x); }, close: async () => { f.content = b; f.writes++; } }; } };
  T.ev(`localStorage.setItem('prio27who','Brad'); window.confirm=function(){ return true; }; globalThis.__dl=0; URL.createObjectURL=function(){ globalThis.__dl++; return 'blob:x'; };
    FH=globalThis.__disk; window.showSaveFilePicker=function(){ throw new Error('the picker was opened'); }; 'ok'`);
  await T.ev('saveInPlaceFile()');
  await new Promise(r => setTimeout(r, 50));
  R.D_writes = f.writes; R.D_downloads = T.ev('globalThis.__dl');
  R.D_status = T.ev(`(document.getElementById('shareStat')||{}).textContent||''`).slice(0, 160);
  R.D_defect = f.writes === 0 && R.D_downloads > 0;
}
console.log(J(R, null, 1));
