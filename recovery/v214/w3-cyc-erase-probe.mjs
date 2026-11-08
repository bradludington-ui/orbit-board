// v2.14 W3 stage 2 (for the lead): does cycApplyAll's own `delete _lsRefused[w[0]]` on a put-back-whole run erase a refusal
// the page had BEFORE the call? A package for Full Fund that browser storage refused sits in PUBS alone (on screen only,
// memOnlyNow true); then "put every appropriation on PB28" is refused at OPN and put back whole. lsMarksBack puts the Full Fund
// refusal back; cycApplyAll's v2.13 line then deletes it, and leaving the page no longer asks.
//   node recovery/v214/w3-cyc-erase-probe.mjs <board.html>      (run from the repository root; jsdom, no browser)
// Measured 3 Nov 2026 on the W3 board: after, memOnly false, refused [], leaving asks false (the package is lost on close).
// On the v213-rv-refused-reads-unsaved mutant (that delete removed): memOnly true, refused ["prio27ff"], leaving asks true.
// On the slot board it throws (memOnlyNow does not exist there).
import { readFileSync } from 'node:fs';
const { boot, seed } = await import(new URL('../../tools/export-audit/boot.mjs', import.meta.url));
const html = readFileSync(process.argv[2], 'utf8');
const J = JSON.stringify;
const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: id + ' title', event: id + ' event', ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
const T1 = 1790100000000, T0 = 1790000000000;
const year = (bm) => ({ order: [], alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [], bm });
const ffStore = { svc: ['USAF', 'ANG'], ts: T1, base: 2027, cur: 2027, cycle: 'BES|2028', by: 'F Lead',
  ppbe: { 'BES|2028': { v: 2, split: true, lines: {}, val: { USAF: { _all: { 2027: { d: 800, m: 80 } } } } } },
  years: { 2027: year({ disc: [100, 40], mand: [10, 0], adds: [] }) } };
const spStore = { svc: ['USAF', 'ANG'], ts: T1, base: 2027, cur: 2027, cycle: 'PB|2027', by: 'S Lead', cycleRef: 'PB|2027',
  ppbe: {}, years: { 2027: year({ disc: [100, 40], mand: [10, 0], adds: [] }) } };
const opnLegacy = { order: ['Z'], alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [], ts: T0 };
const LS = { prio27ff: J(ffStore), prio27sp: J(spStore), prio27opn: J(opnLegacy) };
const X = boot({ html, ls: LS });
seed(X.ev, { services: ['USAF', 'ANG'], items: [it('A', 'PSM', [100, 50]), it('B', 'AV', [80, 40])], disc: [150, 60], mand: [20, 10], order: ['A', 'B'] });
X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); MS.svc=SVC.slice(); MS.cycle='PB|2027'; save(); render();
  window.confirm=function(){ return true; }; window.alert=function(){}; 'ok'`);
// 1. A package for Full Fund (another appropriation) arrives and browser storage refuses it: pkgApply's own writer, lsSet, then PUBS.
const next = Object.assign({}, ffStore, { ts: Date.now() + 5000, by: 'Pkg', years: { 2027: Object.assign(year({ disc: [100, 40], mand: [10, 0], adds: [] }), { notes: { P: 'from the package -- only on screen' } }) } });
X.ev(`window.__setI=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(k==='prio27ff') throw new DOMException('full','QuotaExceededError'); return window.__setI.call(this,k,v); };
  lsSet('prio27ff', ${J(J(next))}, 'Full Fund board data'); PUBS.ff=${J(next)}; Storage.prototype.setItem=window.__setI; 'ok'`);
const before = X.ev(`JSON.stringify({memOnly:memOnlyNow(), refused:Object.keys(_lsRefused), unsaved:unsavedNow()})`);
// 2. The PPBE cycle for every appropriation: refused on OPN, put back whole.
X.ev(`Storage.prototype.setItem=function(k,v){ if(k==='prio27opn') throw new DOMException('full','QuotaExceededError'); return window.__setI.call(this,k,v); };
  window.__r=cycApplyAll('PB|2028'); Storage.prototype.setItem=window.__setI; 'ok'`);
const after = X.ev(`JSON.stringify({ret:String(window.__r), memOnly:memOnlyNow(), refused:Object.keys(_lsRefused), unsaved:unsavedNow(),
  storedFF:(JSON.parse(localStorage.getItem('prio27ff'))||{}).by, pubsFF:(PUBS.ff||{}).by,
  stat:document.getElementById('shareStat').textContent.slice(0,120)})`);
console.log('before cycApplyAll:', before);
console.log('after  cycApplyAll:', after);
X.ev(`var e=new window.Event('beforeunload',{cancelable:true}); window.dispatchEvent(e); window.__leaveAsked=e.defaultPrevented; 'ok'`);
console.log('leaving the page asks:', X.ev('String(window.__leaveAsked)'));
process.exit(0);
