import { readFileSync } from 'node:fs';
import { boot, seed } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
const HTML = readFileSync(process.env.BOARD, 'utf8'); const J = JSON.stringify;
const mk = (id, ask) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Req ' + id, event: 'E' + id, ccar: '', fy26: [0, 0, 0], ask, alloc: null });
const B = boot({ html: HTML });
seed(B.ev, { services: ['USAF','ANG','AFRC'], items: [mk('A', [900, 200, 100])], disc: [2000, 600, 300], mand: [500, 150, 80], order: ['A'] });
B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); window.confirm=function(){ return true; }; window.alert=function(){}; 'ok'`);
B.ev(`reqCreate('AV', {title:'X', event:'EX', ask:[100,0,0]}); save(); 'ok'`);
const i = +B.ev(`String((MS.jrnl||[]).map(function(e){ return JSON.stringify(e.p); }).lastIndexOf('["custom",0]'))`);
console.log('added line', i, B.ev(`String(jrnlUndoable(MS.jrnl[${i}]))`));
try { B.ev(`jrnlUndo(${i}); 'ok'`); console.log('undo ok: custom', B.ev('JSON.stringify(S.custom)'), 'order', B.ev('JSON.stringify(S.order)')); } catch (e) { console.log('undo threw', String(e.message).slice(0, 120), '| custom', B.ev('JSON.stringify(MS.years[MS.cur].custom)')); }
process.exit(0);
