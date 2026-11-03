import { readFileSync } from 'node:fs';
import * as H from './h.mjs';
const HTML = readFileSync(process.env.BOARD, 'utf8'); const { J } = H;
const F1 = H.baseFile('Alice', H.KEY.alice, HTML);
// ---- U63: S1 saved into the board file; the folder (Bob) holds a newer copy F; Live view working out of the folder: refresh
const fold = H.folder();
// Bob seeds the folder: F0 then F
const B = H.boot({ html: F1 }); await H.pause(60); H.wire(B.ev, 'Bob', H.KEY.alice); H.connect(B.ev, B.w, fold);
B.ev(`setNote('A','U63-F0'); 'ok'`); await H.pause(5); await B.ev('driveStorePush(false)'); await H.pause(5);
// Alice: opens the board file, types S1, saves it into the file (Live view just watching)
const A = H.boot({ html: F1 }); await H.pause(60); H.wire(A.ev, 'Alice', H.KEY.alice); const f = H.disk(A.w, F1);
await H.pause(5); A.ev(`setNote('A','U63-S1-SAVED'); 'ok'`); await H.pause(5); await A.ev('saveInPlaceFile()'); await H.pause(10);
console.log('[1] S1 in file', H.fileNote(f.content,'A'), J(H.flags(A.ev)));
// Bob saves F (newer than S1) to the folder
await H.pause(5); B.ev(`setNote('A','U63-F-BOB'); 'ok'`); await H.pause(5); await B.ev('driveStorePush(false)'); await H.pause(5);
console.log('[2] folder', H.fold?1:0, fold.note(2027,'A'));
// Alice turns on working out of the folder; a refresh loads Bob's copy
H.connect(A.ev, A.w, fold, true);
const q0 = H.qs(A.ev).length; await A.ev('driveStorePull(true)'); await H.pause(10);
console.log('[3] after pull: screen', A.ev('String(S.notes.A)'), '| kept', J(H.keptNote(A.ev)), '| asked', H.qs(A.ev).length-q0, '|', J(H.flags(A.ev)));
console.log('    status', H.status(A.ev).slice(0,240));
// Live view back to just watching; Save
A.ev(`_liveCfg=Object.assign(liveCfg(), {store:false}); 'ok'`);
const q1 = H.qs(A.ev).length; await A.ev('saveInPlace()'); await H.pause(20);
console.log('[4] Save to file: asked', J(H.qs(A.ev).slice(q1).map(x=>x.slice(0,70))), '| file A', H.fileNote(f.content,'A'), '| S1 anywhere', H.anywhere(A.ev, f, fold, 'U63-S1-SAVED'));
console.log('errors', A.errors.length, B.errors.length);
process.exit(0);
