// W1 repro (throwaway, outside the tree): item 140 (a), (b), D, case 3 and the stray rule, in jsdom, on BOARD.
import { boot, seed } from '../../../tools/export-audit/boot.mjs';
import { readFileSync } from 'node:fs';
const BOARD = process.env.BOARD;
const PROG = readFileSync(BOARD, 'utf8');
const it = (id, grp, ask) => ({ id, title: id, grp, ask, event: 'E' + id, fy26: [0, 0, 0] });
const SC = { services: ['USAF', 'ANG', 'AFRC'], items: [it('A', 'PSM', [900, 200, 100]), it('B', 'PSM', [400, 100, 50]), it('C', 'AV', [300, 10, 5])],
  disc: [1200, 300, 150], mand: [100, 20, 10], order: ['A', 'B', 'C'] };
const pause = ms => new Promise(r => setTimeout(r, ms));
const disk = (name, content = '') => { const f = { name, content, writes: 0 };
  f.h = { name, requestPermission: async () => 'granted', queryPermission: async () => 'granted', isSameEntry: async o => o === f.h,
    getFile: async () => ({ text: async () => f.content }),
    createWritable: async () => { let b = ''; return { write: async x => { b += String(x); }, close: async () => { f.content = b; f.writes++; } }; } };
  return f; };
const lsOf = ev => JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k);} return JSON.stringify(o); })()`));
const wire = (ev) => ev(`window.__q=[]; window.confirm=function(m){ __q.push(String(m).slice(0,160)); return false; }; window.__dl=0; publishState=function(){ __dl++; }; 'ok'`);
const stat = ev => ev(`(document.getElementById('shareStat')||{}).textContent.slice(0,220)`);
const out = { board: BOARD.split('/').pop() };
const store = new Map(), log = [];
// (a) X: a board at old.html saves in place once (jsdom: no Open window)
const X = boot({ url: 'https://example.invalid/old.html', idb: { store, log } }); seed(X.ev, SC);
X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`);
wire(X.ev);
const dA = disk('old.html'); X.w.showSaveFilePicker = async o => { out.xPick = o && o.suggestedName; return dA.h; };
await X.ev('saveInPlaceFile()'); await pause(60);
out.a_X = { writes: dA.writes, keys: [...store.keys()], log: log.slice() };
// Y: the program with no board at new.html, same store
const Y = boot({ url: 'https://example.invalid/new.html', idb: { store, log }, ls: lsOf(X.ev) }); await pause(40); wire(Y.ev);
const n0 = log.length, aBytes = dA.content;
Y.w.showSaveFilePicker = async o => { out.yPick = o && o.suggestedName; const e = new Error('cancelled'); e.name = 'AbortError'; throw e; };
await Y.ev('saveInPlaceFile()'); await pause(60);
out.a_Y = { dAwrites: dA.writes, dAchanged: dA.content !== aBytes, picks: out.yPick || null, q: Y.ev('JSON.stringify(__q)'), log: log.slice(n0), stat: stat(Y.ev) };
// (b) a program page holding only NEW-like O&M plan in storage; FH = a file holding O&M + Full Fund (a consolidated save)
const F = boot({ appn: 'FULL FUND' }); seed(F.ev, SC);
F.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); blCyc='PB'; blYr=MS.cur; cycLock(); save(); 'ok'`);
const O = boot({ html: F.ev('buildSavedHtml()'), appn: 'O&M' }); seed(O.ev, SC);
O.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save();
  BUDDB={ts:Date.now(), rows:[{ap:'om', svc:'USAF', name:'BAE row', amt:1}], files:['b.xlsx']}; persistBud(); 'ok'`);
const NEWhtml = O.ev('buildSavedHtml()');
const lsO = lsOf(O.ev); const lsB = { prio27appn: 'O&M', prio27om: lsO.prio27om };
const Pb = boot({ ls: lsB }); await pause(30); wire(Pb.ev); Pb.ev(`window.confirm=function(m){ __q.push(String(m).slice(0,160)); return /^No writer/.test(m); }; 'ok'`);
const dN = disk('NEW.html', NEWhtml); Pb.w.__d = dN.h; Pb.ev(`FH=window.__d; window.showSaveFilePicker=function(){ throw new Error('picker'); }; LASTKNOWN=fileTsOf(${NEWhtml.match(/id="pubState">([\s\S]*?)<\/script>/)[1]}); 'ok'`);
await Pb.ev('saveInPlaceFile()'); await pause(60);
const after = JSON.parse(dN.content.match(/id="pubState">([\s\S]*?)<\/script>/)[1]);
out.b = { writes: dN.writes, q: Pb.ev('JSON.stringify(__q)'), appnsAfter: Object.keys(after.appns || {}), ffAfter: !!(after.appns && after.appns.ff), budRows: ((after.budDb || {}).rows || []).length, stat: stat(Pb.ev) };
// D: Save into the program text (pubState null)
const D = boot(); seed(D.ev, SC); D.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`); wire(D.ev);
const dP = disk('ORBIT v2.13.html', PROG); D.w.__d = dP.h; D.ev(`FH=window.__d; window.showSaveFilePicker=function(){ throw new Error('picker'); }; 'ok'`);
await D.ev('saveInPlaceFile()'); await pause(60);
out.D = { writes: dP.writes, downloads: D.ev('__dl'), stat: stat(D.ev) };
// case 3: a program page booted with a record another page wrote and no plan
const C3 = boot({ ls: { prio27appn: 'O&M', 'prio27om.base': JSON.stringify({ file: 1700000000123, dirty: false }) } });
out.case3 = { LASTKNOWN: C3.ev('LASTKNOWN'), baseDirty: C3.ev('_baseDirty') };
C3.ev(`switchYear(MS.cur+1); 'ok'`);
out.case3.recordAfterChange = lsOf(C3.ev)['prio27om.base'];
// stray: a blank page's change, then an older board file in that browser
const B0 = boot({ appn: 'O&M' }); seed(B0.ev, SC);
B0.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); S.notes=S.notes||{}; S.notes.A='FILE note'; MS.years[MS.cur]=S; save(); 'ok'`);
const FILE = B0.ev('buildSavedHtml()'); await pause(20);
const P = boot({ ls: { prio27appn: 'O&M' } });
P.ev(`(function(){ S.notes=S.notes||{}; S.notes.Z='BLANK note'; save(); return 'ok'; })()`);
const aft = lsOf(P.ev);
const R = boot({ html: FILE, ls: aft });
out.stray = { blankRecord: aft['prio27om.base'], view: JSON.parse(R.ev(`JSON.stringify({ids:(DATA.items||[]).map(function(i){return i.id;}), order:S.order, notes:S.notes, kept:!!localStorage.getItem(_AP.key+'.kept'), lastknownIsFile:LASTKNOWN===PUB_FILE_TS})`)) };
console.log(JSON.stringify(out, null, 1));
process.exit(0);
