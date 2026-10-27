// The board itself, two tabs: Ann's unsaved work in tab 1; Kim saves the shared board file; Ann opens it in tab 2 (her work kept
// aside, the record clean); back in tab 1 she types more; Kim saves again; Ann opens the board file once more.
import { J, pause, makeBoard, lsDump, lsLoad, stat, BOARD, HTML } from './lib.mjs';
import { boot } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
console.log(BOARD.slice(-22));
const { b0, boardHtml: F1 } = makeBoard();
const wire = (X, who) => X.ev(`window.__q=[]; window.confirm=function(m){ __q.push(String(m)); return true; }; window.alert=function(){}; try{ localStorage.setItem('prio27who', ${J(who)}); }catch(e){} 'ok'`);
const T1 = boot({ html: F1 }); await pause(40); wire(T1, 'Ann'); T1.ev(`setDesc('C','Ann v1'); 'ok'`);
await pause(20);
const K = boot({ html: F1 }); await pause(40); wire(K, 'Kim'); K.ev(`setDesc('A','Kim 1'); 'ok'`); const F2 = K.ev('buildSavedHtml()');
const T2 = boot({ html: F2, ls: lsDump(T1) }); await pause(40); wire(T2, 'Ann');
const key = T1.ev('_AP.key');
console.log('[1] tab 2 opened the newer file: kept', T2.ev('!!keptCopy()'), '| base', T2.ev('JSON.stringify(baseGet())'));
lsLoad(T1, lsDump(T2)); await pause(20);
T1.ev(`setDesc('D','Ann v2, typed in tab 1 afterwards'); 'ok'`);
const ls1 = lsDump(T1); const s1 = JSON.parse(ls1[key]);
console.log('[2] tab 1 typed: storage D', J((s1.years[s1.cur].desc||{}).D), '| base', ls1[key + '.base']);
await pause(20);
K.ev(`setDesc('A','Kim 2'); 'ok'`); const F3 = K.ev('buildSavedHtml()');
const T3 = boot({ html: F3, ls: ls1 }); await pause(40); wire(T3, 'Ann');
const ls3 = lsDump(T3), s3 = JSON.parse(ls3[key]);
const kr = ls3[key + '.kept'], ks = kr ? JSON.parse(kr.slice(kr.indexOf('\n') + 1)) : null;
console.log('[3] the board file again: screen D', J(T3.ev('String((S.desc||{}).D)')), '| storage D', J((s3.years[s3.cur].desc||{}).D), '| kept D', J(ks ? (ks.years[ks.cur].desc||{}).D : null), '| kept C', J(ks ? (ks.years[ks.cur].desc||{}).C : null));
console.log('    status', stat(T3).slice(0, 160));
process.exit(0);
