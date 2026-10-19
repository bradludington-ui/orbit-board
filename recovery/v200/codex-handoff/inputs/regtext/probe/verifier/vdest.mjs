// vdest.mjs <copyRoot> [variantBoard] : U40's consequence, run (the builder had it "by code, not run", for a pre-v1.86 list).
// Two destinations TYPED with names the board's own rule calls the same ("Alpha Depot" / "ALPHA DEPOT"), each with its own
// requirement. The file is opened (a) in a fresh browser, (b) in a browser whose own destination list is newer -- the
// ordinary case of a second person opening the file. Synthetic data only; literals for what is expected.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = resolve(process.argv[2]);
if (process.argv[3]) process.env.BOARD = resolve(process.argv[3]); else delete process.env.BOARD;
await import(pathToFileURL(root + '/runtime-encoding-shim.mjs').href);
const { boot, seed, BOARD } = await import(pathToFileURL(root + '/tools/export-audit/boot.mjs').href);
console.log('BOARD', BOARD);
const J = JSON.stringify;
const out = (k, v, want) => console.log(k.padEnd(60) + ' got ' + (typeof v === 'string' ? v : J(v)) + (want !== undefined ? '   want ' + J(want) + (J(v) === J(want) ? '  OK' : '  DIFFERS') : ''));
const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Req ' + id, event: 'Ev ' + id, ccar: 'CC' + id, fy26: ask.map(() => 0), ask, alloc: null });
const SC = { services: ['USAF', 'ANG', 'AFRC'], items: [it('R1', 'AV', [900, 0, 0]), it('R2', 'AV', [300, 0, 0])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['R1', 'R2'] };
const view = W => JSON.parse(W.ev(`JSON.stringify((function(){
  var ents=flowEnts().filter(function(e){ return /alpha/i.test(e.n); });
  return { ents: ents.map(function(e){ return [e.n, flowEntUse(e.k)]; }),
           R1: ((S.dest||{}).R1||{}).to ? (flowEnt(S.dest.R1.to)||{n:'(no entry)'}).n : '',
           R2: ((S.dest||{}).R2||{}).to ? (flowEnt(S.dest.R2.to)||{n:'(no entry)'}).n : '',
           sameKey: !!((S.dest||{}).R1 && (S.dest||{}).R2 && S.dest.R1.to===S.dest.R2.to) }; })())`));

// X types two destinations and points R1 at the first, R2 at the second
const X = boot();
seed(X.ev, SC);
X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`);
X.ev(`(function(){ flowAddEnt(); var i=flowEnts().length-1; flowSetEnt(i,'n','Alpha Depot'); var a=flowEnts()[i].k;
  flowAddEnt(); var j=flowEnts().length-1; flowSetEnt(j,'n','ALPHA DEPOT'); var b=flowEnts()[j].k;
  if(!S.dest) S.dest={}; S.dest.R1={to:a, end:''}; S.dest.R2={to:b, end:''}; save(); return 'ok'; })()`);
out('X: as typed', view(X), { ents: [['Alpha Depot', 1], ['ALPHA DEPOT', 1]], R1: 'Alpha Depot', R2: 'ALPHA DEPOT', sameKey: false });
const html = X.ev('buildSavedHtml()');

// (a) the file opened in a fresh browser
const A = boot({ html });
out('(a) opened in a fresh browser', view(A), { ents: [['Alpha Depot', 1], ['ALPHA DEPOT', 1]], R1: 'Alpha Depot', R2: 'ALPHA DEPOT', sameKey: false });

// (b) the file opened in a browser whose own destination list was changed after X's (Y added a destination of its own)
const Y = boot();
seed(Y.ev, SC);
await new Promise(r => setTimeout(r, 30));
Y.ev(`(function(){ flowAddEnt(); var i=flowEnts().length-1; flowSetEnt(i,'n','Bravo Yard'); return 'ok'; })()`);
const ydb = Y.ev(`localStorage.getItem(DEST_KEY)`);
const xts = JSON.parse(X.ev(`localStorage.getItem(DEST_KEY)`)).ts, yts = JSON.parse(ydb).ts;
out('Y list newer than X file list', yts > xts, true);
const B = boot({ html, ls: { [JSON.parse(Y.ev(`JSON.stringify(DEST_KEY)`))]: ydb } });
out('(b) opened where the browser list is newer', view(B), { ents: [['Alpha Depot', 1], ['ALPHA DEPOT', 1]], R1: 'Alpha Depot', R2: 'ALPHA DEPOT', sameKey: false });
out('(b) status / report on opening', B.ev(`document.getElementById('shareStat').textContent.slice(0,300)`));
const B2 = boot({ html: B.ev('buildSavedHtml()') });
out('(b) then saved there and reopened fresh', view(B2), { ents: [['Alpha Depot', 1], ['ALPHA DEPOT', 1]], R1: 'Alpha Depot', R2: 'ALPHA DEPOT', sameKey: false });
console.log('done');
