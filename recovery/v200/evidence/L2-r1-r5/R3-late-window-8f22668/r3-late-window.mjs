// Lead's bounded probe of R3's LATER timing window (not one of the received probes; observation, not a test): a locked
// cycle put on screen AFTER a folder save has built its bytes, while the main copy's write is still closing. Records what
// the folder captured, the status message, the unsaved flags on screen, after leaving the view, and after a later edit and
// Save. Synthetic board, simulated folder handle (shape of races-probe.mjs's folder()). Usage: node r3-late-window.mjs <copy root>
const T = process.argv[2];
await import(T + '/runtime-encoding-shim.mjs');
const { boot, seed, bootRelease, settleBoards } = await import(T + '/tools/export-audit/boot.mjs');
const J = JSON.stringify;
const gate = () => { let resolve; const p = new Promise(r => resolve = r); return { p, resolve }; };
const wait = async pred => { const end = Date.now() + 5000; while (Date.now() < end) { if (pred()) return; await new Promise(r => setTimeout(r, 1)); } throw new Error('stage not reached'); };
const B = boot();
seed(B.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [{ id: 'A', grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Synthetic A', event: 'A', ccar: '',
  fy26: [0, 0, 0], ask: [900, 200, 100], alloc: null }], disc: [1200, 300, 150], mand: [100, 20, 10], order: ['A'] });
B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(i=>{BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice();}); applyState(S);
  localStorage.setItem('prio27who','Synthetic reviewer'); localStorage.setItem('prio27writerKey','a0000000000000000000000000000002'); setNote('A','START'); 'ok'`);
const HOLD = process.argv[3] || 'main';   // where the save is held: the main copy's close, a history copy's close, or another root file's close (lock/heartbeat)
const root = { files: {}, dirs: {} }, F = { writes: [], holdClose: null, closing: false, order: [] };
const nf = () => Object.assign(new Error('synthetic absent'), { name: 'NotFoundError' });
const dir = st => ({ kind: 'directory', name: 'synthetic', queryPermission: async () => 'granted', requestPermission: async () => 'granted',
  getFileHandle: async (n, o) => { if (!(n in st.files)) { if (o?.create) st.files[n] = ''; else throw nf(); }
    return { kind: 'file', name: n, getFile: async () => { const text = st.files[n]; return { text: async () => text }; },
      createWritable: async () => { let bytes = ''; return { write: async x => { bytes += String(x); }, close: async () => {
        F.order.push((st === root ? '' : 'history/') + n);
        const at = HOLD === 'main' ? (st === root && n === 'spmt-2027-om.json') : HOLD === 'history' ? (st !== root) : (st === root && n !== 'spmt-2027-om.json');
        if (at && F.holdClose) { const g = F.holdClose; F.holdClose = null; F.closing = (st === root ? '' : 'history/') + n; await g.p; }
        st.files[n] = bytes; F.writes.push({ history: st !== root, name: n }); } }; } }; },
  getDirectoryHandle: async (n, o) => { if (!st.dirs[n]) { if (o?.create) st.dirs[n] = { files: {}, dirs: {} }; else throw nf(); } return dir(st.dirs[n]); },
  removeEntry: async n => { delete st.files[n]; },
  values: async function* () { for (const n of Object.keys(st.files)) yield { kind: 'file', name: n, getFile: async () => ({ text: async () => st.files[n] }) }; } });
if (process.argv[5] === 'wait80') await new Promise(r => setTimeout(r, 80));   // let the opening's own timers run first (DIRTY reset at 0 ms, folder auto-connect at 60 ms), as the suite's R5 fixture does
B.w.__folder = dir(root);
B.ev(`_liveCfg=Object.assign(liveCfg(),{store:true,mode:'drive',on:false}); _driveDir=globalThis.__folder; 'ok'`);
const st = () => JSON.parse(B.ev(`JSON.stringify({view:CYCVIEW, note:S.notes.A, DIRTY:DIRTY, baseDirty:_baseDirty, record:(function(){ try{ return !!(baseGet()||{}).dirty; }catch(e){ return 'n/a'; } })(), gen:_saveGen})`));
const stat = () => B.ev(`(document.getElementById('shareStat')||{}).textContent||''`);
const folderNote = () => { const t = root.files['spmt-2027-om.json']; return t ? JSON.parse(t).store.years['2027'].notes.A : null; };
const hist = () => Object.keys((root.dirs.history || { files: {} }).files).length;
const out = {};
B.ev(`setNote('A','LOCKED'); blCyc='PB'; blYr=2027; cycLock(); setNote('A','WORKING'); 'ok'`);
out.firstSave = { ret: await B.ev('driveStorePush(false)'), folder: folderNote(), state: st() };
if (process.argv[4] !== 'clean') B.ev(`setNote('A','WORKING2'); 'ok'`);   // 'clean': the save runs on a board with nothing new (Publish now / Save again)
out.beforeHeldSave = st();
F.order = []; const g = gate(); F.holdClose = g; F.closing = false;
const p = B.ev('driveStorePush(false)');
await wait(() => F.closing);                                    // bytes built (WORKING2), main copy's close held
out.atHold = { heldAt: F.closing, folderBeforeClose: folderNote(), state: st() };
B.ev(`cycView('PB|2027'); 'ok'`);                               // the later window: locked cycle put on screen now
out.inView = { state: st(), status: stat() };
g.resolve(); out.heldSaveReturned = await p; await settleBoards();
out.afterSaveLanded = { writesInOrder: F.order.slice(), folder: folderNote(), history: hist(), state: st(), status: stat() };
B.ev(`cycLeave(); 'ok'`);
out.afterLeave = { state: st(), status: stat(), folder: folderNote() };
B.ev(`setNote('A','AFTER'); 'ok'`);
out.afterLaterEdit = { state: st(), folder: folderNote() };
out.nextSave = { ret: await B.ev('driveStorePush(false)'), folder: folderNote(), history: hist(), state: st(), status: stat() };
out.errors = B.errors;
out.hold = HOLD; out.variant = process.argv[4] || 'edited'; out.opening = process.argv[5] || 'connect at once'; console.log(J(out, null, 1));
bootRelease(0); process.exit(0);
