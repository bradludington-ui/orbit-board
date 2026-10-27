// Two tabs of one browser: Tab 1 holds Ann's unsaved work; in Tab 2 she opens Pat's newer PSM file (her work is kept aside, the
// record goes clean). Back in Tab 1 she types more. Later Pat saves again and she opens PSM's file once more.
import { J, pause, makeBoard, makeCopy, disk, open, saveTo, lsDump, lsLoad, stat, BOARD } from './lib.mjs';
console.log(BOARD.slice(-22));
const { boardHtml } = makeBoard(); const COPY = makeCopy(boardHtml);
const sA = new Map(), sP = new Map();
const T1 = await open(COPY, 'Ann', null, sA);
T1.ev(`pmoMineSet('AV'); setDesc('C','Ann AV v1'); 'ok'`);
await pause(30);
const P = await open(COPY, 'Pat', null, sP);
P.ev(`pmoMineSet('PSM'); setDesc('A','Pat 1'); 'ok'`);
const FP = disk('psm.html'); await saveTo(P, FP);
const T2 = await open(FP.content, 'Ann', lsDump(T1), sA);          // tab 2: PSM's file
console.log('[1] tab 2 opened PSM file: kept C', T2.ev(`(function(){ var k=keptCopy(); if(!k) return 'none'; var s=JSON.parse(k.raw); return String(((s.years[s.cur]||{}).desc||{}).C); })()`), '| base', T2.ev('JSON.stringify(baseGet())'));
lsLoad(T1, lsDump(T2));                                            // the browser's one storage, as tab 2 left it
await pause(30);
T1.ev(`setDesc('D','Ann AV v2 typed in tab 1 afterwards'); 'ok'`); // tab 1 goes on working
const ls1 = lsDump(T1); const key = T1.ev('_AP.key');
const st1 = JSON.parse(ls1[key]); const T = st1.years[st1.cur];
console.log('[2] tab 1 typed: storage D', J((T.desc||{}).D), '| base', ls1[key+'.base']);
await pause(30);
P.ev(`setDesc('A','Pat 2'); 'ok'`); await saveTo(P, FP);           // Pat saves again, later
const T3 = await open(FP.content, 'Ann', ls1, sA);                 // she opens PSM's file again
const ls3 = lsDump(T3); const st3 = JSON.parse(ls3[key]);
const kept = ls3[key+'.kept'] ? JSON.parse(ls3[key+'.kept'].slice(ls3[key+'.kept'].indexOf('\n')+1)) : null;
console.log('[3] PSM file again: on screen D', J(T3.ev('String((S.desc||{}).D)')), '| storage D', J(((st3.years[st3.cur]||{}).desc||{}).D), '| kept D', J(kept? ((kept.years[kept.cur]||{}).desc||{}).D : null), '| kept C', J(kept? ((kept.years[kept.cur]||{}).desc||{}).C : null));
console.log('    status', stat(T3).slice(0,200));
// and the copy as published opened next (an older file): what is left of tab 1's work
const T4 = await open(COPY, 'Ann', ls3, sA);
console.log('[4] copy as published: D', J(T4.ev('String((S.desc||{}).D)')), '| C', J(T4.ev('String((S.desc||{}).C)')));
process.exit(0);
