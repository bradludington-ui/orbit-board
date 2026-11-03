import { readFileSync } from 'node:fs';
import { boot, seed } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
const HTML = readFileSync(process.env.BOARD, 'utf8'); const J = JSON.stringify;
const it = (id, g, ask) => ({ id, grp: g, team: g, sect: '', custom: false, title: 'Rec ' + id, event: 'EV-' + id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
const b0 = boot({ html: HTML });
seed(b0.ev, { services: ['USAF', 'USN'], items: [it('A', 'PP', [100, 200]), it('B', 'PP', [50, 60])], disc: [1000, 1000], mand: [100, 100], order: ['A', 'B'] });
b0.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); S.si.B=''; save(); 'ok'`);
const F = b0.ev('buildSavedHtml()');
const B = boot({ html: F });
B.ev(`window.confirm=function(){ return true; }; window.alert=function(){}; try{ localStorage.setItem('prio27who','Lead'); }catch(e){} 'ok'`);
console.log('board: siOf A', B.ev(`siOf(itemById('A'))`), '| S.si', B.ev('JSON.stringify(S.si)'));
const pub = B.ev(`(function(){ let cap=null; const _B=window.Blob; window.Blob=function(pt,o){ if(!cap && o && o.type==='text/html') cap=String(pt[0]); return new _B(pt,o); }; try{ publishPmoCopy(); }catch(e){} window.Blob=_B; return cap||''; })()`);
const P = boot({ html: pub });
P.ev(`window.alert=function(){}; window.confirm=function(){ return true; }; try{ localStorage.setItem('prio27who','PP Lead'); localStorage.setItem('prio27pmo','PP'); }catch(e){} render(); 'ok'`);
// in the copy: A gets "none" by hand; B (none on the board) goes back to the rules
P.ev(`setSi('A',''); delete S.si.B; save(); 'ok'`);
console.log('copy: S.si', P.ev('JSON.stringify(S.si)'), '| siOf A', J(P.ev(`siOf(itemById('A'))`)), 'B', J(P.ev(`siOf(itemById('B'))`)));
const sub = JSON.parse(P.ev(`(function(){ let cap=null; const _B=window.Blob; window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); }; globalThis.__al=[]; window.alert=function(m){ __al.push(String(m)); }; try{ pmoSubmit(); }catch(e){ __al.push('THREW '+e.message); } window.Blob=_B; return JSON.stringify({pkg: cap? JSON.parse(cap) : null, al:__al}); })()`));
console.log('package items', J(sub.pkg && sub.pkg.items), '| alerts', J(sub.al.map(a => a.slice(0, 100))));
if (sub.pkg) {
  B.ev(`PMOSUBS=[]; PMOPICK={}; pmoTake(${J(sub.pkg)}, 'pp.json'); 'ok'`);
  console.log('board rows', B.ev(`JSON.stringify(pmoRows().map(function(r){ return [r.id, r.key, r.now, r.prop]; }))`));
}
process.exit(0);
