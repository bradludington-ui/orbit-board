// Skeptic's own jsdom repro. One browser's storage, two tabs: modelled by handing the WHOLE storage from one window to the
// other at every switch (the tabs act one after another, so that is what a shared localStorage holds).
// Variant A: the finding (Kim saves again; Ann opens the newer file).  Variant B: the shared record's `file` is also tab 2's:
// Ann reopens the SAME file (Kim-1, unchanged) and presses Save -- is the HOLD ON asked?
import { readFileSync } from 'node:fs';
import { boot, seed } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
const W = '/tmp/claude-0/-home-user/792dafeb-d944-5a2a-8cfa-66d1840065b4/scratchpad/v209/';
const BOARDS = { fix: W + 'rev/board-d3ce17d.html', pre: W + 'rev/board-ba3c294.html', v208: W + 'board-ebe702e.html' };
const WHICH = process.env.WHICH || 'fix', HTML = readFileSync(BOARDS[WHICH], 'utf8');
const J = JSON.stringify, sleep = ms => new Promise(r => setTimeout(r, ms));
const dump = X => JSON.parse(X.ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
const load = (X, o) => X.ev(`(function(o){ localStorage.clear(); Object.keys(o).forEach(function(k){ localStorage.setItem(k,o[k]); }); return 1; })(${J(o)})`);
const wire = (X, who) => X.ev(`window.__q=[]; window.confirm=function(m){ __q.push(String(m)); return true; }; window.alert=function(){}; try{ localStorage.setItem('prio27who', ${J(who)}); }catch(e){} 1`);
const SVC = ['USAF', 'ANG'];
const items = ['R1', 'R2', 'R3'].map((id, i) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Req ' + id, event: 'E-' + id, ccar: '', fy26: [0, 0], ask: [400000 * (i + 1), 50000], alloc: null }));
const b0 = boot({ html: HTML });
seed(b0.ev, { services: SVC, items, disc: [1500000, 60000], mand: [500000, 0], order: items.map(x => x.id) });
b0.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 1`);
const F0 = b0.ev('buildSavedHtml()');
const key = b0.ev('_AP.key');
const kim = boot({ html: F0 }); wire(kim, 'Kim');
const T1 = boot({ html: F0 }); await sleep(30); wire(T1, 'Ann'); T1.ev(`setDesc('R1','ANN-1'); 1`);
await sleep(30); kim.ev(`setDesc('R3','KIM-1'); 1`); const F1 = kim.ev('buildSavedHtml()');
const T2 = boot({ html: F1, ls: dump(T1) }); await sleep(30);
const d2 = dump(T2);
load(T1, d2);                                         // tab 1 sees the shared storage tab 2 left
T1.ev(`setDesc('R2','ANN-2'); 1`);
const d3 = dump(T1);
const st3 = JSON.parse(d3[key]);
console.log(WHICH, 'after tab 1 typed: storage R2', J(st3.years[st3.cur].desc.R2), '| record', d3[key + '.base'], '| tab 1 LASTKNOWN', T1.ev('LASTKNOWN'), 'F0', b0.ev('fileTsOf({appns:PUBS})'));
// ---- Variant A
{
  await sleep(30); const k2 = boot({ html: F1 }); wire(k2, 'Kim'); k2.ev(`setDesc('R3','KIM-2'); 1`); const F2 = k2.ev('buildSavedHtml()');
  const T3 = boot({ html: F2, ls: d3 }); await sleep(30);
  const d = dump(T3), st = JSON.parse(d[key]), kr = d[key + '.kept'], ks = kr ? JSON.parse(kr.slice(kr.indexOf('\n') + 1)) : null;
  const holds = Object.keys(d).filter(k => (d[k] || '').includes('ANN-2'));
  console.log(WHICH, 'A: screen R2', J(T3.ev('(S.desc||{}).R2||null')), '| storage R2', J((st.years[st.cur].desc || {}).R2 || null), '| kept R1/R2', J(ks && ks.years[ks.cur].desc), '| keys holding ANN-2', J(holds));
  console.log(WHICH, 'A: line', J(T3.ev(`(document.getElementById('shareStat')||{}).textContent||''`).slice(0, 140)));
}
// ---- Variant B: the same file (Kim-1) reopened, then Save in place
{
  const T4 = boot({ html: F1, ls: d3 }); await sleep(30); wire(T4, 'Ann');
  const disk = { content: F1, writes: 0 };
  T4.w.__h = { name: 'board.html', requestPermission: async () => 'granted', getFile: async () => ({ text: async () => disk.content }),
    createWritable: async () => { let b = ''; return { write: async x => { b += String(x); }, close: async () => { disk.content = b; disk.writes++; } }; } };
  T4.w.showSaveFilePicker = async () => T4.w.__h;
  T4.ev('FH=window.__h; 1');
  console.log(WHICH, 'B: opened: screen R1/R2/R3', J(T4.ev('[ (S.desc||{}).R1||null, (S.desc||{}).R2||null, (S.desc||{}).R3||null ]')), '| LASTKNOWN', T4.ev('LASTKNOWN'), '| file ts', kim.ev('fileTsOf({appns:PUBS})'), '| _bootMoved', T4.ev('_bootMoved'));
  console.log(WHICH, 'B: line', J(T4.ev(`(document.getElementById('shareStat')||{}).textContent||''`).slice(0, 160)));
  await T4.ev('saveInPlaceFile()'); await sleep(200);
  const m = disk.content.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/);
  const p = JSON.parse(m[1]); const pp = p.appns ? p.appns[Object.keys(p.appns)[0]] : p;
  const y = pp.years[pp.cur];
  console.log(WHICH, 'B: asked', J(T4.ev('__q.map(function(q){return q.slice(0,60);})')), '| writes', disk.writes, '| file now R3', J((y.desc || {}).R3 || null), 'R2', J((y.desc || {}).R2 || null));
  // control: the same Save pressed in tab 1 itself (its own LASTKNOWN is F0's)
  const disk1 = { content: F1, writes: 0 };
  T1.w.__h = { name: 'board.html', requestPermission: async () => 'granted', getFile: async () => ({ text: async () => disk1.content }),
    createWritable: async () => { let b = ''; return { write: async x => { b += String(x); }, close: async () => { disk1.content = b; disk1.writes++; } }; } };
  T1.w.showSaveFilePicker = async () => T1.w.__h; T1.ev('FH=window.__h; __q=[]; 1');
  await T1.ev('saveInPlaceFile()'); await sleep(200);
  console.log(WHICH, 'B control (tab 1 Save): asked', J(T1.ev('__q.map(function(q){return q.slice(0,60);})')));
}
process.exit(0);
