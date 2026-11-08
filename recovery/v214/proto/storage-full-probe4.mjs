import { boot, seed } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: id + ' title', event: id + ' event', ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
const FIX = { services: ['USAF', 'ANG'], items: [it('A', 'AV', [100, 20]), it('B', 'PSM', [50, 10])], disc: [120, 20], mand: [30, 10], order: ['A', 'B'] };
const fresh = () => { const B = boot(); seed(B.ev, FIX); B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); }); save(); render(); 'ok'`); return B; };
const C = fresh(); C.ev(`S.notes.B='from the other file'; save(); 'ok'`); const html = C.ev('buildSavedHtml()');
const B = fresh(); B.ev(`DIRTY=false; _persistFail=false; window.__q=[]; window.confirm=function(q){ window.__q.push(String(q).slice(0,60)); return true; }; window.alert=function(){}; 'ok'`);
B.ev(`(function(){ const size=function(){ let t=0; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); t+=k.length+localStorage.getItem(k).length; } return t; };
  const LIM=size()+40; window.__si=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k, v){ v=String(v); const was=localStorage.getItem(k);
    if(size()-(was===null? 0 : k.length+was.length)+k.length+v.length>LIM) throw new DOMException('q', 'QuotaExceededError'); return window.__si.call(this, k, v); }; })(); 'ok'`);
B.ev(`S.notes.A='typed while full, never stored'; save(); Storage.prototype.setItem=window.__si; 'ok'`);   // then another page frees room
const n0 = B.errors.filter(e => /navigation/i.test(e)).length;
const ret = B.ev(`String(fullImportText(${JSON.stringify(html)}, 'other.html'))`);
console.log(JSON.stringify({ persistFailBefore: true, ret, questions: JSON.parse(B.ev('JSON.stringify(window.__q)')), reloaded: B.errors.filter(e => /navigation/i.test(e)).length > n0,
  storedNoteA: B.ev(`(JSON.parse(localStorage.getItem('prio27om')).years['2027'].notes||{}).A||null`) }, null, 1));
