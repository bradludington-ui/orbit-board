// helpers copied from audit-import.mjs's W1H (read only), so a throwaway repro can run outside the tree
import { boot, seed } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
export { boot, seed };
export const SVC = ['USAF', 'ANG', 'AFRC'];
export const J = JSON.stringify;
export const mk = (id, ask) => ({ id, grp: 'AV', team: 'AV', sect: '', custom: false, title: 'Req ' + id, event: 'E' + id, ccar: '', fy26: [0, 0, 0], ask, alloc: null });
const tick = () => new Promise(r => setImmediate(r));
export const until = async (cond, max = 6000) => { for (let i = 0; i < max; i++) { if (cond()) return true; await tick(); } return false; };
export const lsOf = ev => JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
export const KEY = { alice: 'a0000000000000000000000000000002', bob: 'c0000000000000000000000000000003' };
export const wire = (ev, name, key) => ev(`localStorage.setItem('prio27who', ${J(name)}); localStorage.setItem('prio27writerKey', ${J(key)});
  globalThis.__q=[]; globalThis.__yes=true; globalThis.__dl=0;
  window.confirm=function(q){ globalThis.__q.push(String(q)); return globalThis.__yes; }; window.alert=function(){};
  URL.createObjectURL=function(){ globalThis.__dl++; return 'blob:x'; }; URL.revokeObjectURL=function(){}; 'ok'`);
export const qs = ev => JSON.parse(ev('JSON.stringify(globalThis.__q)'));
export const status = ev => ev(`(document.getElementById('shareStat')||{}).textContent||''`);
export const pubOf = html => { const m = html.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/); return m ? JSON.parse(m[1]) : null; };
export const fileStore = html => pubOf(html).appns.om;
export const fileNote = (html, id, yr) => { const st = fileStore(html); return String((((st.years || {})[yr || st.cur] || {}).notes || {})[id] || ''); };
export const baseFile = (by, key, html) => {
  const A = boot({ html }); seed(A.ev, { services: SVC, items: [mk('A', [900, 200, 100]), mk('B', [400, 100, 50])], disc: [2000, 600, 300], mand: [500, 150, 80], order: ['A', 'B'] });
  A.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`);
  A.ev(`localStorage.setItem('prio27writerKey', ${J(key)}); if(typeof writerFp==='function') WRITER={by:${J(by)}, fp:writerFp(), t:1}; 'ok'`);
  return A.ev('buildSavedHtml()');
};
export const disk = (w, content) => {
  const f = { content, writes: 0 };
  w.__disk = { name: 'Board.html', requestPermission: async () => 'granted',
    getFile: async () => { const c = f.content; return { text: async () => c }; },
    createWritable: async () => { let buf = ''; return { write: async x => { buf += String(x); }, close: async () => { f.content = buf; f.writes++; } }; } };
  w.eval(`FH=globalThis.__disk; window.showSaveFilePicker=function(){ throw new Error('the picker was opened'); }; 'ok'`);
  return f;
};
export const folder = () => {
  const root = { files: {}, dirs: {} };
  const fold = { root };
  const dirOf = st => ({ kind: 'directory', name: 'shared', queryPermission: async () => 'granted', requestPermission: async () => 'granted',
    getFileHandle: async (n, o) => { if (!(n in st.files)) { if (o && o.create) st.files[n] = ''; else { const e = new Error('not found'); e.name = 'NotFoundError'; throw e; } }
      return { kind: 'file', name: n, getFile: async () => { const c = st.files[n]; return { text: async () => c }; },
        createWritable: async () => { let buf = ''; return { write: async x => { buf += String(x); }, close: async () => { st.files[n] = buf; } }; } }; },
    getDirectoryHandle: async (n, o) => { if (!st.dirs[n]) { if (o && o.create) st.dirs[n] = { files: {}, dirs: {} }; else { const e = new Error('not found'); e.name = 'NotFoundError'; throw e; } } return dirOf(st.dirs[n]); },
    removeEntry: async n => { delete st.files[n]; },
    values: async function* () { for (const n of Object.keys(st.files)) yield { kind: 'file', name: n, getFile: async () => ({ text: async () => st.files[n] }) }; } });
  fold.dir = dirOf(root);
  fold.copy = fy => { const t = root.files['spmt-' + fy + '-om.json']; return t ? JSON.parse(t) : null; };
  fold.note = (fy, id) => { const j = fold.copy(fy); if (!j) return '(no copy)'; const st = j.store; return String((((st.years || {})[fy] || {}).notes || {})[id] || ''); };
  return fold;
};
export const connect = (ev, w, fold, store = true) => { w.__fold = fold.dir; ev(`_liveCfg=Object.assign(liveCfg(), {store:${store}, mode:'drive', on:false}); _driveDir=globalThis.__fold; 'ok'`); };
export const flags = ev => JSON.parse(ev(`JSON.stringify({DIRTY:DIRTY, LASTKNOWN:LASTKNOWN, base:baseGet(), cur:MS.cur, driveBase:(typeof _driveBase!=='undefined'? _driveBase : null), kept: !!localStorage.getItem(_AP.key+'.kept')})`));
export const pause = ms => new Promise(r => setTimeout(r, ms));
export const keptNote = ev => { const s = ev(`localStorage.getItem(_AP.key+'.kept')`); if (s == null) return null; const st = JSON.parse(s.slice(s.indexOf('\n') + 1)); const m = JSON.parse(s.slice(0, s.indexOf('\n'))); return [String(((st.years || {})[st.cur] || {notes:{}}).notes.A || ''), m.why]; };
export const anywhere = (ev, f, fold, m) => Object.values(lsOf(ev)).some(v => String(v).includes(m)) || f.content.includes(m) || JSON.stringify(fold.root).includes(m);
