import { readFileSync } from 'node:fs';
import * as H from './h.mjs';
const HTML = readFileSync(process.env.BOARD, 'utf8'); const { J } = H;
const F1 = H.baseFile('Alice', H.KEY.alice, HTML);
const fold = H.folder();
// Bob saves F0 then F1 to the folder: F0 lands in the history
const B = H.boot({ html: F1 }); await H.pause(60); H.wire(B.ev, 'Bob', H.KEY.alice); H.connect(B.ev, B.w, fold);
B.ev(`setNote('A','U64-F0'); 'ok'`); await H.pause(5); await B.ev('driveStorePush(false)'); await H.pause(5);
B.ev(`setNote('A','U64-F1'); 'ok'`); await H.pause(5); await B.ev('driveStorePush(false)'); await H.pause(5);
// Alice: S1 saved into the board file, Live view watching (store off)
const A = H.boot({ html: F1 }); await H.pause(60); H.wire(A.ev, 'Alice', H.KEY.alice); const f = H.disk(A.w, F1);
A.ev(`setNote('A','U64-S1-SAVED'); 'ok'`); await H.pause(5); await A.ev('saveInPlaceFile()'); await H.pause(10);
H.connect(A.ev, A.w, fold, false);
await A.ev('driveHistShow()'); await H.pause(5);
console.log('[1] history', A.ev('JSON.stringify(_driveHist.map(function(x){return x.name;}))'));
const q0 = H.qs(A.ev).length; await A.ev('driveRestore(0)'); await H.pause(10);
console.log('[2] after Put this back: screen', A.ev('String(S.notes.A)'), '| kept', J(H.keptNote(A.ev)), '| asked', J(H.qs(A.ev).slice(q0).map(x=>x.slice(0,90))), '|', J(H.flags(A.ev)));
console.log('    status', H.status(A.ev).slice(0,260), '| driveStoreOn', A.ev('driveStoreOn()'));
const q1 = H.qs(A.ev).length; await A.ev('saveInPlace()'); await H.pause(20);
console.log('[3] Save: asked', J(H.qs(A.ev).slice(q1).map(x=>x.slice(0,70))), '| file A', H.fileNote(f.content,'A'), '| S1 anywhere', H.anywhere(A.ev, f, fold, 'U64-S1-SAVED'));
console.log('errors', A.errors.length);
process.exit(0);
