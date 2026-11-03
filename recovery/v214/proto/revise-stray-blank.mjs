// The stray rule's own case, and R1's guard. (1) A blank program page (no board, nothing in storage) makes a change; then an
// older board file opens in that browser. (2) The same, but the storage plan carries a data pack with another requirement list.
import { boot, seed } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
const MINE=['USAF','ANG','AFRC'];
const it=(id,grp,ask)=>({id, title:id, event:'E'+id, grp, ask, fy26:[0,0,0]});
const SC={services:MINE, items:[it('A','AV',[900,200,100]), it('B','PSM',[400,100,50]), it('C','PSM',[300,10,5])], disc:[1200,300,150], mand:[100,20,10], order:['A','B','C']};
const lsOf=ev=>JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k);} return JSON.stringify(o); })()`));
const B0=boot({appn:'O&M'}); seed(B0.ev, SC);
B0.ev(`(function(){ BASE_ITEMS.length=0; ${JSON.stringify(SC.items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); S.notes=S.notes||{}; S.notes.A='FILE note'; MS.years[MS.cur]=S; save(); return 'ok'; })()`);
const FILE=B0.ev('buildSavedHtml()');
await new Promise(r=>setTimeout(r,20));
// (1) the blank program page: the board's own program with no board in it, nothing in storage
const P=boot({ls:{prio27appn:'O&M'}});
P.ev(`(function(){ S.notes=S.notes||{}; S.notes.Z='BLANK note'; save(); return 'ok'; })()`);
const after=lsOf(P.ev);
const R=boot({html:FILE, ls:after});
const v=JSON.parse(R.ev(`JSON.stringify({ids:(DATA.items||[]).map(function(i){return i.id;}), notes:S.notes, kept:!!localStorage.getItem(_AP.key+'.kept'), LASTKNOWN:LASTKNOWN===PUB_FILE_TS})`));
// (2) a blank-marked record over a plan carrying another board's data pack (one requirement)
const st=JSON.parse(after.prio27om);
st.dataPack={services:MINE, items:[it('X','AV',[5,5,5])], budget:[]}; st.years[st.cur].order=['X']; st.ts=Date.now()+5000;
const ls2=Object.assign({}, after, {prio27om:JSON.stringify(st)});
const R2=boot({html:FILE, ls:ls2});
const v2=JSON.parse(R2.ev(`JSON.stringify({ids:(DATA.items||[]).map(function(i){return i.id;}), order:S.order, notes:S.notes, kept:!!localStorage.getItem(_AP.key+'.kept')})`));
const J=JSON.parse(R2.ev('buildSavedHtml()').match(/id="pubState">([\s\S]*?)<\/script>/)[1]);
const om=J.appns? J.appns.om : J;
console.log(JSON.stringify({board:process.env.BOARD.split('/').pop(), blankRecord:after['prio27om.base'], case1:v,
  case2:Object.assign(v2, {savedPack:((om&&om.dataPack&&om.dataPack.items)||[]).map(function(i){return i.id;}), savedNotes:om&&om.years&&om.years[om.cur].notes})}));
process.exit(0);
