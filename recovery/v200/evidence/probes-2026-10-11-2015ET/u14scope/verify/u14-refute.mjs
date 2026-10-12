// u14-refute.mjs -- VERIFIER's independent refutation probe for U14 (read-only on the product; synthetic; bounded by vrun.sh).
//   usage: node u14-refute.mjs <copyRoot> <outJson> <before|after>
// Question: is U14 an artifact of the builder's construction order (FY27 first, FY26 created afterwards, base moved 2026->2027
// around it)? Here the board is built in the NATURAL chronology: an FY26 board (base 2026, cur 2026, own FY26 pot 300M) rolls
// forward into FY27 (switchYear(2027), confirm OK = the product's ROLL FORWARD copy), FY27's pot is set to 500M, and only then
// the base is moved to 2027 with the 🗓 "Set base year" handler. jsdom errors are checked on EVERY copy (the builder checked
// them only in the matrix and in S1). The export is also read for an FY26 selection (the builder did not).
// EVERY EXPECTED VALUE IS A HAND-WRITTEN LITERAL. Board helpers are read only for observed values.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(process.argv[2]); const outPath = resolve(process.argv[3]); const label = process.argv[4];
if (!['before', 'after'].includes(label)) throw new Error('label must be before|after');
delete process.env.BOARD; delete process.env.MUT_FIRST_FAIL;
await import(pathToFileURL(root + '/runtime-encoding-shim.mjs').href);
const { boot, seed, bootRelease, BOARD } = await import(pathToFileURL(root + '/tools/export-audit/boot.mjs').href);
const boardPath = root + '/prioritization-board-grid.html';
if (resolve(BOARD) !== boardPath) throw new Error(`boot.mjs BOARD is ${BOARD}, not ${boardPath}`);
const blobOf = buf => createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
const ident = { label, boardPath, boardBlob: blobOf(readFileSync(boardPath)), probeBlob: blobOf(readFileSync(new URL(import.meta.url))) };
const J = JSON.stringify, M = 1000000, results = [];
const check = (s, name, actual, expected) => { const ok = J(actual) === J(expected); results.push({ s, name, expected, actual, status: ok ? 'passed' : 'failed' }); };
const note = (s, name, actual) => results.push({ s, name, actual, status: 'recorded' });
const getter = X => e => JSON.parse(X.ev(`JSON.stringify(${e})`));
const conf = (w, ans) => { w.__cc = 0; w.__m = []; w.confirm = m => { w.__cc++; w.__m.push(String(m).slice(0, 90)); return ans; }; };
const row = (fy, title, budget, amt, office) => { const r = Array(32).fill(''); r[0] = fy; r[1] = fy + '-03'; r[2] = 'SYN-EXEC';
  r[3] = title; r[4] = budget; r[7] = 'Event ' + title; r[9] = amt; r[10] = 'Allocated'; r[18] = office; return r; };
const ITEM = { id: 'F1', grp: 'PSM', team: 'PSM', sect: '', custom: false, title: 'Synthetic planned requirement',
  event: 'Synthetic planned event', ccar: 'SYN-F1', fy26: [0], ask: [1000 * M], alloc: null };
// the ledger's U14 workbook: O&M FY25 40 (ordinary) + Initial Spares FY25 'Mandatory' 100 (carried only when the rule is on)
const WB = { om: { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: [row(2025, 'Synthetic ordinary FY25 O&M requirement', 'USAF O&M Discretionary', 40 * M, 'Program (TSS)')] } },
  sp: { asOf: '2026-09', hdr: [], read: 1, noFy: 0, rows: { 2025: [row(2025, 'Synthetic carried spares requirement', 'USAF Spares Initial Mandatory PSM', 100 * M, 'Program (ATL)')] } } };
const O27 = [2025, 2027, 2028, 2029, 2030, 2031], O27w = [2025, 2026, 2027, 2028, 2029, 2030, 2031], O26 = [2025, 2026, 2027, 2028, 2029, 2030];
const LBL27 = 'FY25–FY31 · all years · all appropriations · FY27, FY28, FY29, FY30, FY31 planned, the rest executed';

const panel = X => { X.ev(`flowOpen=true; flowSel=''; flowBody(); 'ok'`); const t = X.w.document.getElementById('flowBody').textContent;
  const m = /total funding \$([\d,]+\.\d\d)M/.exec(t); return { total: m ? m[1] : null, fy26: (t.match(/FY ?26|FY2026|2026/g) || []).length }; };
const click = (X, oc) => { X.ev(`flowOpen=true; flowBody(); 'ok'`); const b = [...X.w.document.querySelectorAll('#flowBody button')].find(x => x.getAttribute('onclick') === oc);
  if (!b) return false; b.click(); X.ev(`flowBody(); 'ok'`); return true; };
const exp = async X => { const book = JSON.parse(await X.w.eval(`(async function(){ var cap=null, orig=window.Blob;
    window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new orig(p,o); };
    try { exportFlow(); } finally { window.Blob=orig; } if(!cap) throw Error('no workbook emitted');
    var ab=cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength); return JSON.stringify(await xlsxRead(ab)); })()`));
  const v = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c; const ff = book['Funds Flow'] || [];
  return { tot: ff.filter(r => String(v(r[0])) === 'TOTAL FUNDING').map(r => v(r[1])).filter(x => typeof x === 'number'),
    scope: ff.map(r => String(v(r[0]) ?? '')).filter(s => /^Scope: /.test(s)) }; };
const now = X => getter(X)(`(function(){ var F=flowCalc(); return {stored:flowCfg().fys, sel:flowSelYears(), offered:flowYears(), tot:F.tot, exec:F.execV, plan:F.planV, label:F.label, base:MS.base, cur:MS.cur, years:Object.keys(MS.years).map(Number)}; })()`);
const setBase = (X, y) => { X.w.prompt = () => String(y); X.ev(`setBaseYear(); 'ok'`); X.w.prompt = () => null; };
const reopen = X => { X.ev(`save(); 'ok'`); const R = boot({ html: X.ev('buildSavedHtml()') }); conf(R.w, true); return R; };

// the natural chronology, up to the moment before the base move
const fy26Board = (s) => {
  const X = boot(); const g = getter(X);
  seed(X.ev, { services: ['USAF'], items: [ITEM], disc: [300 * M], mand: [0], order: ['F1'] });
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.bm={disc:[${300 * M}], mand:[0], adds:[]}; MS.base=2026; MS.cur=2026; FYMON=fyMonths(2026); MS.years={2026:S};
    applyState(S); MS.years[2026]=S; EXDB.all=${J(WB)}; EXDB.ts=1;
    var C=flowCfg(); delete C.pseudo; C.other={}; C.fys=null; C.aps=null; save(); 'ok'`);
  conf(X.w, true);
  const a0 = now(X);
  check(s, 'FY26 board (base 2026, cur 2026): offered FY25-FY30; ALL YEARS 40+100 executed + 300 planned = 440', [a0.base, a0.cur, a0.years, a0.offered, a0.tot, a0.exec, a0.plan], [2026, 2026, [2026], O26, 440 * M, 140 * M, 300 * M]);
  X.ev(`switchYear(2027); 'ok'`);   // product path: FY27 has no data -> confirm OK = ROLL FORWARD (copy of FY26)
  const cc = [X.w.__cc, X.w.__m.slice()];
  note(s, 'switchYear(2027) confirms (answered OK = roll forward)', cc);
  note(s, 'FY27 discSvc right after the roll forward', g('MS.years[2027] ? MS.years[2027].discSvc : null'));
  X.ev(`bmSetBase('disc', 0, ${J(String(500 * M))}); 'ok'`);
  const a1 = now(X);
  check(s, 'rolled into FY27, pot 500, base still 2026: FY26 300 + FY27 500 planned + 140 executed = 940', [a1.base, a1.cur, a1.years, a1.offered, a1.tot, a1.exec, a1.plan, g('MS.years[2026].discSvc'), g('MS.years[2027].discSvc')],
    [2026, 2027, [2026, 2027], O26, 940 * M, 140 * M, 800 * M, [300 * M], [500 * M]]);
  return X;
};

const out = { ...ident };
// R1: ALL YEARS after the natural roll-forward + base move
{ const s = `${label}|R1-natural-rollforward-then-base27`; const X = fy26Board(s); const g = getter(X);
  conf(X.w, true); setBase(X, 2027);
  const a = now(X), p = panel(X), x = await exp(X), d26 = g('flowCalc(2026).tot');
  check(s, 'base moved to 2027: offered FY25, FY27-31; ALL YEARS 640 = 140 ex + 500 pl; the own FY26 300 in no year; FY26 asked directly 300',
    [a.base, a.cur, a.offered, a.tot, a.exec, a.plan, d26], [2027, 2027, O27, 640 * M, 140 * M, 500 * M, 300 * M]);
  check(s, 'label, panel $M, panel mentions of FY26, export TOTAL x2 and Scope', [a.label, p.total, p.fy26, x.tot, x.scope], [LBL27, '640.00', 0, [640 * M, 640 * M], ['Scope: ' + LBL27]]);
  const R = reopen(X); const r = now(R);
  check(s, 'reopened: the same 640, FY26 not offered', [r.offered, r.tot], [O27, 640 * M]);
  check(s, 'no jsdom errors on the board or the reopened copy; no confirm during reads', [X.errors, R.errors, R.w.__cc], [[], [], 0]);
  // rule chip clicked ON (the product's own button)
  const ok = click(R, 'flowSetPseudo("on",true)'); const rr = now(R);
  check(s, 'rule chip clicked ON on the reopened copy: before board 540 (FY26 not offered); after board 940 (FY26 offered, 100 carried + 300 plan)',
    [ok, rr.offered, rr.tot], label === 'before' ? [true, O27, 540 * M] : [true, O27w, 940 * M]);
  check(s, 'no jsdom errors after the rule click', R.errors, []);
  out.R1 = { a, p, x, d26, reopened: r, ruleOn: rr }; bootRelease(0); }

// R2: an FY26 selection made in the natural chronology, then the base move (S4b, with errors checked and the FY26 export read)
{ const s = `${label}|R2-FY26-selected-then-base27`; const X = fy26Board(s);
  const ok = click(X, 'flowOneYear(2026)'); const b0 = now(X); const x0 = await exp(X);
  check(s, 'FY26 only: stored [2026], 300 planned; export TOTAL x2 = 300', [ok, b0.stored, b0.sel, b0.tot, b0.exec, b0.plan, x0.tot], [true, [2026], [2026], 300 * M, 0, 300 * M, [300 * M, 300 * M]]);
  note(s, 'FY26-only export Scope', x0.scope);
  conf(X.w, true); setBase(X, 2027);
  const b1 = now(X), p1 = panel(X);
  check(s, 'base moved to 2027: stored [2026] kept, selection = every offered year (ALL YEARS), 640; panel says nothing of FY26',
    [b1.stored, b1.sel, b1.tot, p1.total, p1.fy26], [[2026], O27, 640 * M, '640.00', 0]);
  const R = reopen(X); const r = now(R), x = await exp(R);
  check(s, 'reopened: stored [2026], ALL YEARS 640, export 640 x2', [r.stored, r.sel, r.tot, x.tot], [[2026], O27, 640 * M, [640 * M, 640 * M]]);
  check(s, 'no jsdom errors on the board or the reopened copy', [X.errors, R.errors], [[], []]);
  out.R2 = { b0, x0, b1, p1, reopened: r, x }; bootRelease(0); }

out.results = results;
out.passed = results.filter(r => r.status === 'passed').length; out.failed = results.filter(r => r.status === 'failed').length;
writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
results.filter(r => r.status !== 'passed').forEach(r => console.log(r.status.toUpperCase(), '|', r.s, '|', r.name, '| expected', J(r.expected), '| actual', J(r.actual).slice(0, 600)));
console.log(J({ label, boardBlob: ident.boardBlob, probeBlob: ident.probeBlob, passed: out.passed, failed: out.failed }));
