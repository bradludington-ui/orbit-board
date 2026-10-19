// Lead's independent R4b cross-check (not one of the received probes): with the mixed-import hold already on, Save to the
// board file is refused at once, before ANY file access (permission, read, open all 0), says so, and clearing the hold
// afterwards does not resume it (still 0, file bytes unchanged). Simulated file handle; synthetic board.
const T = process.argv[2];
await import(T + '/runtime-encoding-shim.mjs');
const { boot, seed, bootRelease, settleBoards } = await import(T + '/tools/export-audit/boot.mjs');
const X = boot(); const { w, ev } = X;
seed(ev, { services:['USAF','ANG'], items:[{ id:'A', grp:'AV', team:'AV', sect:'', custom:false, title:'Synthetic A', event:'A', ccar:'',
  fy26:[0,0], ask:[900,200], alloc:null }], disc:[1200,300], mand:[100,20], order:['A'] });
ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S);
  localStorage.setItem('prio27who','Synthetic reviewer'); setNote('A','START'); 'ok'`);
const html0 = ev('buildSavedHtml()');
const f = { html: html0, perm: 0, reads: 0, opens: 0 };
w.__disk = { name: 'synthetic.html', requestPermission: async () => { f.perm++; return 'granted'; },
  getFile: async () => { f.reads++; return { text: async () => f.html }; },
  createWritable: async () => { f.opens++; let b = ''; return { write: async x => { b = String(x); }, close: async () => { f.html = b; } }; } };
w.showSaveFilePicker = async () => w.__disk; ev('FH=globalThis.__disk; 0');
ev(`localStorage.setItem(IMP_MIXED_KEY, JSON.stringify({t:1, file:'synthetic-partial.html'})); setNote('A','AFTER'); 'ok'`);
const results = []; const chk = (n, got, want) => results.push([JSON.stringify(got) === JSON.stringify(want) ? 'ok  ' : 'FAIL', n, got, want]);
chk('the hold is on before Save is asked for', ev('impMixedOn()'), true);
await ev('saveInPlaceFile()'); await settleBoards();
const stat1 = ev(`(document.getElementById('shareStat')||{}).textContent||''`);
chk('refused before any file access: perm · read · open', [f.perm, f.reads, f.opens], [0, 0, 0]);
chk('the board says Save to the board file is refused', /Saving to the board file is refused/.test(stat1), true);
ev(`window.confirm=function(){ return true; }; impMixedClear(); 'ok'`);
for (let i = 0; i < 20; i++) await new Promise(r => setTimeout(r, 5)); await settleBoards();
chk('the hold is off after Allow Save again', ev('impMixedOn()'), false);
chk('clearing the hold does not resume the refused Save: perm · read · open', [f.perm, f.reads, f.opens], [0, 0, 0]);
chk('the board file keeps its bytes', f.html === html0, true);
chk('no script errors', X.errors, []);
let bad = 0; for (const [s, n, g, wnt] of results) { if (s !== 'ok  ') bad++; console.log(`${s} ${n}: got ${JSON.stringify(g)} want ${JSON.stringify(wnt)}`); }
console.log(bad ? `${bad} FAILING` : 'ALL OK'); bootRelease(0); process.exit(bad ? 1 : 0);
