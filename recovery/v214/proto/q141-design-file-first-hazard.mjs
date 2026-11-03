// THE OTHER HALF OF "THE FILE IS THE RECORD": a board FILE that is newer than what this browser stores under the same keys
// must open as itself. Measured: the imported board (route B's file from e-v212) opened in a browser that holds ANOTHER, OLDER
// board under the same keys (c-v213's storage, which also stands for the old board's leftovers when the import is downloaded
// rather than written and checked). Shipped program vs the program with the reader fixes (patch.mjs --readers).
// usage: node --max-old-space-size=8192 hazard.mjs
import { boot, bootMark, bootRelease, settleBoards } from './myboot.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const D = new URL('.', import.meta.url).pathname;
const fileB = readFileSync(D + 'run/e-v212.B.html', 'utf8');
const pubOf = h => h.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/)[1];
const withProg = prog => readFileSync(prog, 'utf8').replace(/(<script type="application\/json" id="pubState">)[\s\S]*?(<\/script>)/, (m, a, b) => a + pubOf(fileB) + b);
const stale = JSON.parse(readFileSync(D + '../sizes/out/c-v213.ls.json', 'utf8'));
// the stale board is older than the file: force its clocks back a day, so nothing here depends on when each was built
for (const k of Object.keys(stale)) { try { const o = JSON.parse(stale[k]); if (o && typeof o === 'object' && 'ts' in o) { o.ts = 1700000000000; stale[k] = JSON.stringify(o); } } catch {} }
const Q = `(function(){
  var r={appn:APPN, dataItems:DATA.items.length, order:S.order.length, msTs:MS.ts, pubTs:(PUBS[_AP.slug]||{}).ts};
  ['ff','sp'].forEach(function(k){ var p=pkgStoreOf(k), f=fydpStoreLocal(k).st, pb=PUBS[k];
    r[k]={pkgStoreOf:{ts:p&&p.ts, n:p&&p.years&&p.years[p.cur]&&p.years[p.cur].order.length},
          fydpStoreLocal:{ts:f&&f.ts, n:f&&f.years&&f.years[f.cur]&&f.years[f.cur].order.length},
          fileSlot:{ts:pb&&pb.ts, n:pb&&pb.years&&pb.years[pb.cur]&&pb.years[pb.cur].order.length}}; });
  try{ var d=spDefs(); r.spDefs=d.map(function(x){ return [x.name, x.ms? (x.ms.ts||0) : null, x.ms&&x.ms.years&&x.ms.years[x.ms.cur]? x.ms.years[x.ms.cur].order.length : null]; }); }catch(e){ r.spDefs='threw '+e.message; }
  try{ r.bandPeers=bandPeers().map(function(p){ return [p.slug, p.seen]; }); }catch(e){ r.bandPeers='threw '+e.message; }
  r.T=(function(){ var t=tierTotals(tiers()); return [t.dUsed, t.mUsed, t.u1Amt, t.u2Amt]; })();
  return JSON.stringify(r); })()`;
const out = {};
for (const [lab, prog] of [['shipped', D + 'proto.html'], ['readers', D + 'proto-readers.html']]) {
  const html = withProg(prog);
  for (const [lab2, ls] of [['empty browser', {}], ['older other board stored', stale]]) {
    const m = bootMark();
    const b = boot({ html, ls: Object.assign({}, ls) });
    let r; try { r = JSON.parse(b.ev(Q)); } catch (e) { r = { err: e.message }; }
    r.errors = b.errors.filter(e => !/Not implemented/.test(e)).slice(0, 3);
    out[lab + ' / ' + lab2] = r;
    bootRelease(m); await settleBoards(2);
  }
}
writeFileSync(D + 'run/hazard.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
