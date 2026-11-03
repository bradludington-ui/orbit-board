// Throwaway: (D) 💾 Save over an ORBIT program with no board (pubState null) on v2.13.
import { boot, seed } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
import { readFileSync } from 'node:fs';
const PROG = readFileSync('/home/user/orbit-board/prioritization-board-grid.html', 'utf8');
const it = (id, grp, ask) => ({ id, title: id, grp, ask, event: 'E' + id });
const B = boot(); seed(B.ev, { services: ['USAF','ANG','AFRC'], items: [it('A','PSM',[900,200,100])], disc:[1000,200,100], mand:[200,50,40], order:['A'] });
B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`);
const f = { content: PROG, writes: 0 };
B.w.__disk = { name: 'ORBIT v2.13.html', requestPermission: async () => 'granted', getFile: async () => ({ text: async () => f.content }),
  createWritable: async () => { let b=''; return { write: async x => { b += String(x); }, close: async () => { f.content = b; f.writes++; } }; } };
B.ev(`FH=globalThis.__disk; window.showSaveFilePicker=function(){ throw new Error('the picker was opened'); }; window.__q=[]; window.confirm=function(m){ __q.push(String(m).slice(0,100)); return true; }; window.__dl=0; var __p0=publishState; publishState=function(){ __dl++; }; 'ok'`);
await B.ev('saveInPlace()'); await new Promise(r => setTimeout(r, 300));
console.log(JSON.stringify({ writes: f.writes, downloads: B.ev('__dl'), q: B.ev('JSON.stringify(__q)'), stat: B.ev(`document.getElementById('shareStat').textContent.slice(0,200)`),
  extract: B.ev(`JSON.stringify(extractPacks(${JSON.stringify(PROG)}))`) }, null, 1));
