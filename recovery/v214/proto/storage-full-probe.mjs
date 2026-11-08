// Throwaway probe (outside the tree): the storage-full survival set on a board, jsdom, a counted quota stand-in.
// usage: BOARD=<board.html> node probe.mjs
import { boot, seed } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: id + ' title', event: id + ' event', ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
const FIX = { services: ['USAF', 'ANG'], items: [it('A', 'AV', [100, 20]), it('B', 'PSM', [50, 10])], disc: [120, 20], mand: [30, 10], order: ['A', 'B'] };
const out = {};
// QUOTA(room): every setItem that would take storage past (used now + room) characters (keys + values) is refused, as Chromium does
const QUOTA = room => `(function(){ const size=function(){ let t=0; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); t+=k.length+localStorage.getItem(k).length; } return t; };
  const LIM=size()+${room}; window.__si=window.__si||Storage.prototype.setItem; const si=window.__si; window.__refusedKeys=[];
  Storage.prototype.setItem=function(k, v){ v=String(v); const was=localStorage.getItem(k);
    if(size()-(was===null? 0 : k.length+was.length)+k.length+v.length>LIM){ window.__refusedKeys.push(k); throw new DOMException('The quota has been exceeded.', 'QuotaExceededError'); }
    return si.call(this, k, v); }; return LIM; })()`;
const fresh = () => { const B = boot(); seed(B.ev, FIX); B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); }); save(); render(); setTimeout(function(){},0); 'ok'`); return B; };
const navs = B => B.errors.filter(e => /navigation/i.test(e)).length;
// A: an edit storage refuses
{ const B = fresh(); B.ev(`DIRTY=false; _persistFail=false; 'ok'`); B.ev(QUOTA(0));
  B.ev(`S.notes=S.notes||{}; S.notes.A='typed while full '+ 'x'.repeat(50); save(); 'ok'`);
  out.A = JSON.parse(B.ev(`JSON.stringify({persistFail:_persistFail, dirty:DIRTY, refused:DIAG.refused.map(function(r){ return r.what+' — '+r.why; }),
     memOnlyNow: typeof memOnlyNow, diagSays:(diagReport().match(/Writes refused:.*$/m)||[''])[0]})`));
  out.A.beforeunload = B.ev(`(function(){ const e=new Event('beforeunload', {cancelable:true}); window.dispatchEvent(e); return e.defaultPrevented; })()`);
  // B: switching appropriation while the edit is on screen only
  const n0 = navs(B); B.ev(`switchAppn('FULL FUND'); 'ok'`);
  out.B = { reloaded: navs(B) > n0, appnStored: B.ev(`String(window.__si? localStorage.getItem('prio27appn') : '')`), stat: B.ev(`document.getElementById('shareStat').textContent.slice(0,160)`) };
  // cycGoAppn while memory-only
  const n1 = navs(B); B.ev(`cycGoAppn('ff'); 'ok'`);
  out.B.cycGo = { reloaded: navs(B) > n1, markStored: B.ev(`localStorage.getItem('prio27cycGo')`) };
}
// B3: room for a small key, not for the edit (Brad's shape: the plan is not in storage and cannot fit, prio27appn can)
{ const B = fresh(); B.ev(`DIRTY=false; _persistFail=false; localStorage.removeItem('prio27appn'); 'ok'`); B.ev(QUOTA(40));
  B.ev(`S.notes=S.notes||{}; S.notes.A='typed while full '+ 'x'.repeat(80); save(); 'ok'`);
  const n0 = navs(B); B.ev(`switchAppn('FULL FUND'); 'ok'`);
  out.B3 = { persistFail: B.ev('_persistFail'), reloaded: navs(B) > n0, appnStored: B.ev(`localStorage.getItem('prio27appn')`) };
}
// B2: a clean board, storage refusing the appropriation choice
{ const B = fresh(); B.ev(`DIRTY=false; _persistFail=false; localStorage.removeItem('prio27appn'); 'ok'`); B.ev(QUOTA(0));
  const n0 = navs(B); B.ev(`switchAppn('FULL FUND'); 'ok'`);
  out.B2 = { reloaded: navs(B) > n0, appnStored: B.ev(`localStorage.getItem('prio27appn')`), refusedKeys: B.ev(`JSON.stringify(window.__refusedKeys)`), refusedCounted: B.ev(`DIAG.refused.length`) };
}
// W: the writer key and the editor name, with storage refusing them
{ const B = fresh(); B.ev(`localStorage.removeItem('prio27writerKey'); localStorage.removeItem('prio27who'); 'ok'`); B.ev(QUOTA(0));
  out.W = JSON.parse(B.ev(`JSON.stringify({k1:writerKey(), k2:writerKey(), fpSame: writerFp()===writerFp()})`));
  out.W.sameKey = out.W.k1 === out.W.k2; delete out.W.k1; delete out.W.k2;
  B.ev(`window.__asked=0; window.prompt=function(){ window.__asked++; return 'BL'; }; 'ok'`);
  B.ev(`for(var i=0;i<3;i++){ S.notes.B='n'+i; save(); } 'ok'`);
  out.W.nameAsked = +B.ev('window.__asked'); out.W.stamped = B.ev('MS.by');
}
// G: Save diagnostics' storage lines
{ const B = fresh(); B.ev(`localStorage.setItem('some-other-tool-key', 'z'.repeat(1000)); 'ok'`);
  const r = B.ev('diagReport()'); out.G = { lines: r.split('\n').filter(l => /Browser storage|Writes refused|kind|famil/i.test(l)), leaksForeignName: /some-other-tool-key/.test(r) };
}
console.log(JSON.stringify(out, null, 1));
