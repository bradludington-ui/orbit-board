// EQUIVALENCE: does a board opened from the FILE the prototype builds hold exactly what a board reopened from BROWSER STORAGE
// after the shipped full import holds -- every appropriation, every figure, every list?
// One shell boot computes W once (the shipped code), and from that same W: route A = the shipped lsAll commit (the storage the
// reload reads), route B = the prototype's file (and the shell's storage with W's keys removed, as the prototype leaves it).
// Then each of the four appropriations is opened both ways and compared: the lane engine per requirement, the totals, and the
// whole saved state (buildSavedHtml's pubState, clocks zeroed by name), plus the opening's losses and script errors.
// usage: node --max-old-space-size=8192 equiv.mjs <source board.html> <label> [--prog proto.html] [--stale <ls.json>]
//   --stale seeds the shell's browser with another (older) copy of the board first -- "the same browser that ran the old one".
import { boot, bootMark, bootRelease, settleBoards } from './myboot.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const D = new URL('.', import.meta.url).pathname;
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const SRCF = process.argv[2], LABEL = process.argv[3] || 'x';
const PROG = readFileSync(arg('prog', D + 'proto.html'), 'utf8');
const STALE = arg('stale', null);
const srcTxt = readFileSync(SRCF, 'utf8');
const lsDump = ev => JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
const out = { label: LABEL, src: SRCF.split('/').pop(), srcChars: srcTxt.length };

// ---- the shell, the import, both routes from one W ----
let m = bootMark();
const lsStart = STALE ? JSON.parse(readFileSync(STALE, 'utf8')) : {};
const sh = boot({ html: PROG, ls: lsStart });
sh.w.__SRC = srcTxt;
sh.ev(`window.__fiTap=function(W, rep, txt, fname){
  window.__W=W.map(function(w){ return [w[0], w[1].length]; });
  window.__pre=(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return o; })();
  window.__html=savedHtmlFrom(fullImportPubOf(W));
  window.__keys=W.map(function(w){ return w[0]; });
  return undefined;   // and the shipped commit runs on
}; 'ok'`);
const t0 = Date.now();
const r = sh.ev(`(function(){ try{ return String(fullImportText(window.__SRC, 'ORBIT Live.html')); }catch(e){ return 'THREW '+e.message; } })()`);
out.importMs = Date.now() - t0;
out.importReturned = r;
out.W = sh.w.__W;
const htmlB = sh.w.__html, keys = sh.w.__keys;
const pre = JSON.parse(JSON.stringify(sh.w.__pre));
const lsA = lsDump(sh.ev);
out.shellErrors = sh.errors.filter(e => !/Not implemented/.test(e)).slice(0, 5);
const lsB = Object.assign({}, pre); keys.forEach(k => { if (k !== 'prio27impRep') delete lsB[k]; });
out.lsAChars = Object.entries(lsA).reduce((a, [k, v]) => a + k.length + v.length, 0);
out.lsBChars = Object.entries(lsB).reduce((a, [k, v]) => a + k.length + v.length, 0);
out.fileBChars = htmlB.length;
writeFileSync(D + 'run/' + LABEL + '.B.html', htmlB);
bootRelease(m); await settleBoards(2);

// ---- the figures one opened board states ----
const FIG = `(function(){
  var T=tiers(), z=function(o){ return JSON.parse(JSON.stringify(o, function(k, v){ return (k==='ts')? 0 : v; })); };
  var per=S.order.map(function(id){ var p=T[id]; return p? [id, p.d, p.m, p.u, p.cum, p.tier] : [id, null]; });
  var html=buildSavedHtml(); var mm=html.match(/<script type="application\\/json" id="pubState">([\\s\\S]*?)<\\/script>/);
  var pub=z(JSON.parse(mm[1]));
  Object.keys(pub.appns||{}).forEach(function(k){ var a=pub.appns[k]; if(a){ (a.jrnl||[]).forEach(function(e){ e.t=0; }); (a.log||[]).forEach(function(e){ e.ts=0; }); a.by=''; } });
  return JSON.stringify({appn:APPN, shell:IS_SHELL, items:DATA.items.length, svc:SVC.slice(), cur:MS.cur, years:Object.keys(MS.years),
    order:S.order.length, per:per, tot:tierTotals(T), lost:_bootLost.slice(), cyc:Object.keys(CYCDB.cycles||{}),
    ace:Object.keys(ACEDB.sets||{}), ex:Object.keys(EXDB.all||{}), bud:(BUDDB.rows||[]).length, dest:(DESTDB.ents||[]).length,
    pubState:pkgCanon(pub)});
})()`;
const APPNS = ['O&M', 'FULL FUND', 'INITIAL SPARES', 'OPN'];
const PROGRAM = readFileSync(arg('prog', D + 'proto.html'), 'utf8');   // the program as it reloads: no saved state
out.compare = [];
for (const ap of APPNS) {
  m = bootMark();
  const a = boot({ html: PROGRAM, ls: Object.assign({}, lsA), appn: ap });
  let fa; try { fa = JSON.parse(a.ev(FIG)); } catch (e) { fa = { err: e.message }; }
  const aErr = a.errors.filter(e => !/Not implemented/.test(e)).slice(0, 5);
  bootRelease(m); await settleBoards(2);
  m = bootMark();
  const b = boot({ html: htmlB, ls: Object.assign({}, lsB), appn: ap });
  let fb; try { fb = JSON.parse(b.ev(FIG)); } catch (e) { fb = { err: e.message }; }
  const bErr = b.errors.filter(e => !/Not implemented/.test(e)).slice(0, 5);
  bootRelease(m); await settleBoards(2);
  const diff = [];
  for (const k of new Set([...Object.keys(fa), ...Object.keys(fb)])) if (JSON.stringify(fa[k]) !== JSON.stringify(fb[k])) diff.push(k);
  let firstDiff = '';
  if (diff.includes('pubState')) { const x = fa.pubState || '', y = fb.pubState || ''; let i = 0; while (i < x.length && x[i] === y[i]) i++; firstDiff = 'pubState differs at ' + i + ': A=' + x.slice(Math.max(0, i - 120), i + 120) + ' || B=' + y.slice(Math.max(0, i - 120), i + 120); }
  out.compare.push({ appn: ap, sameAll: diff.length === 0, diff, firstDiff,
    A: { order: fa.order, items: fa.items, shell: fa.shell, years: fa.years, cyc: fa.cyc, ace: fa.ace, lost: fa.lost, tot: fa.tot && { dUsed: fa.tot.dUsed, mUsed: fa.tot.mUsed, u1Amt: fa.tot.u1Amt, u2Amt: fa.tot.u2Amt }, pubChars: (fa.pubState || '').length, errors: aErr, err: fa.err },
    B: { order: fb.order, items: fb.items, shell: fb.shell, lost: fb.lost, pubChars: (fb.pubState || '').length, errors: bErr, err: fb.err } });
  console.log(ap, diff.length === 0 ? 'SAME' : 'DIFF ' + diff.join(','));
}
writeFileSync(D + 'run/' + LABEL + '.equiv.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify({ label: out.label, importReturned: out.importReturned, lsAChars: out.lsAChars, lsBChars: out.lsBChars, fileBChars: out.fileBChars, shellErrors: out.shellErrors, cmp: out.compare.map(c => [c.appn, c.sameAll, c.A.order, c.A.items, c.A.tot, c.A.errors, c.B.errors, c.firstDiff.slice(0, 400)]) }, null, 1));
