import { boot } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
const lsOf=ev=>JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k);} return JSON.stringify(o); })()`));
const P=boot({ls:{prio27appn:'O&M'}});
P.ev(`(function(){ S.notes=S.notes||{}; S.notes.Z='one'; save(); return 'ok'; })()`);
const a=lsOf(P.ev)['prio27om.base'];
const P2=boot({ls:lsOf(P.ev)});
P2.ev(`(function(){ S.notes.Z='two'; save(); return 'ok'; })()`);
const b=lsOf(P2.ev)['prio27om.base'];
// the page writes a file (as a Save in place does): LASTKNOWN becomes that save; the next edit is no longer blank work
P2.ev(`(function(){ LASTKNOWN=12345; baseSet({file:LASTKNOWN, dirty:false}); _baseDirty=false; S.notes.Z='three'; save(); return 'ok'; })()`);
const c=lsOf(P2.ev)['prio27om.base'];
console.log(JSON.stringify({board:process.env.BOARD.split('/').pop(), a, b, c}));
process.exit(0);
