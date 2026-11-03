// THE IMPORTING PAGE LIVES ON. After the file-first import the importing page reloads as what it is -- here the empty program. An
// edit made there is saved to browser storage with a fresh clock, newer than the imported file. What does the imported file show
// when it is opened next, and what does Save do? (route B's e-v212 file; jsdom; shipped readers)
import { boot, bootMark, bootRelease, settleBoards } from './myboot.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const D = new URL('.', import.meta.url).pathname;
const PROG = readFileSync(process.argv[2] || D + 'proto.html', 'utf8');
const fileB = readFileSync(D + 'run/e-v212.B.html', 'utf8');
const dump = ev => JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
let m = bootMark();
const sh = boot({ html: PROG, ls: {} });
sh.ev(`setBaseYear=setBaseYear; MS.base=MS.base; save(); 'ok'`);      // any edit: one save() of the empty board
const ls = dump(sh.ev);
bootRelease(m); await settleBoards(2);
m = bootMark();
const b = boot({ html: fileB, ls });
const r = JSON.parse(b.ev(`JSON.stringify({order:S.order.length, items:DATA.items.length, msTs:MS.ts, fileTs:PUB_FILE_TS, lastknown:LASTKNOWN, moved:_bootMoved,
  stat:(document.getElementById('shareStat')||{}).textContent})`));
bootRelease(m);
console.log(JSON.stringify({ shellStored: Object.fromEntries(Object.entries(ls).map(([k, v]) => [k, v.length])), opened: r }, null, 1));
