// TRACE MATRIX — one quantity, every surface that states it, cross-footed.
//
// The board says a number. The panel repeats it. A sheet prints it, a slide quotes it, the drill
// subtotals it. They are the SAME DOLLARS, and the only way a reader can trust any of them is if
// they agree. This builds the matrix: rows are quantities, columns are surfaces, and every populated
// cell is compared against a truth computed HERE, from the fixture's own numbers -- never read back
// out of the board, because an oracle that asks the code under test will agree with it.
//
// A cell can be one of three things, and the difference matters:
//   ok       the surface states this quantity and it agrees
//   MISMATCH the surface states it and it does NOT agree  -> the run fails, and this is the report
//   --       the surface does not state this quantity at all. Not an error. A slide that never
//            mentions trim is not wrong; it is silent, and silence is recorded rather than scored.
//
// EVERY CELL IS LOCATED BY NAME -- a column header, a row label -- and never by index. That is not
// style. Adding one column to Funding Streams once moved four checks one column left, and they went
// on passing against the wrong figure. A lookup that silently re-points is the failure mode this
// whole file exists to catch, so it must not be the failure mode of the file itself.
import { readFileSync } from 'node:fs';
import { boot, seed } from './export-audit/boot.mjs';
import { harvest, ORDER, LABEL, FORMULA } from './trace-lib.mjs';

const BOARD = process.env.BOARD || null;
const SVC = ['USAF', 'ANG', 'AFRC'];
const sum = a => a.reduce((x, y) => x + y, 0);

// ---- THE FIXTURE -------------------------------------------------------------------------------
// Deliberately awkward. Lanes BIND and run dry partway; one requirement is TRIMMED so ask and
// allocation differ; one is starred; per-service asks are uneven so anything that averages across
// services instead of weighting by them shows up as a mismatch rather than as a rounding smudge.
const mk = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false,
  title: id + ' title', event: id + ' event', ccar: 'JSF' + id, fy26: ask.map(() => 0), ask, alloc: null });
const FIX = {
  services: SVC,
  items: [mk('A', 'PSM', [12000000, 1500000, 900000]),
          mk('B', 'AV',  [ 6000000, 2200000, 400000]),
          mk('C', 'MxS', [ 5000000,  800000, 300000]),
          mk('D', 'TSS', [ 3000000,  600000, 250000])],
  disc: [14000000, 2000000, 1000000],
  mand: [ 4000000,  900000,  300000],
  order: ['A', 'B', 'C', 'D'],
  mc: { B: true },
  alloc: { C: { m: 's', v: [3000000, 500000, 200000] } },   // trimmed: asks 6.1M, allocated 3.7M
};

// ---- THE TRUTH, from the fixture alone -----------------------------------------------------------
const basisOf = id => {
  const it = FIX.items.find(x => x.id === id), a = FIX.alloc[id];
  if (!a) return it.ask.slice();
  if (a.m === 's') return a.v.slice();
  const at = sum(it.ask);
  return at > 0 ? it.ask.map(x => a.v * x / at) : SVC.map(() => a.v / SVC.length);
};
const dRem = FIX.disc.slice(), mRem = FIX.mand.slice(), P = {};
for (const id of FIX.order) {
  const basis = basisOf(id), d = [], m = [], u = [];
  basis.forEach((v, i) => {
    const dd = Math.min(v, Math.max(0, dRem[i])); dRem[i] -= dd;
    const mm = Math.min(v - dd, Math.max(0, mRem[i])); mRem[i] -= mm;
    d[i] = dd; m[i] = mm; u[i] = v - dd - mm;
  });
  P[id] = { d, m, u };
}
const askOf = id => FIX.items.find(x => x.id === id).ask;
const perSvc = f => SVC.map((s, i) => sum(FIX.order.map(id => f(id, i))));
const T = {
  ask:    sum(FIX.order.map(id => sum(askOf(id)))),
  discBA: sum(FIX.disc),
  mandBA: sum(FIX.mand),
  disc:   sum(FIX.order.map(id => sum(P[id].d))),
  mand:   sum(FIX.order.map(id => sum(P[id].m))),
  ufr1:   sum(perSvc((id, i) => Math.max(0, askOf(id)[i] - P[id].d[i]))),
  ufr2:   sum(perSvc((id, i) => Math.max(0, askOf(id)[i] - P[id].d[i] - P[id].m[i]))),
  trim:   sum(perSvc((id, i) => Math.max(0, askOf(id)[i] - basisOf(id)[i]))),
  beyond: sum(perSvc((id, i) => Math.max(0, Math.min(askOf(id)[i], basisOf(id)[i]) - P[id].d[i] - P[id].m[i]))),
  mcTotal:  sum(FIX.order.filter(id => FIX.mc[id]).map(id => sum(askOf(id)))),
  mcShort:  sum(FIX.order.filter(id => FIX.mc[id])
    .map(id => sum(SVC.map((s, i) => Math.max(0, askOf(id)[i] - P[id].d[i]))))),
};
T.funded = T.disc + T.mand;

// ---- harvest -------------------------------------------------------------------------------------
const { ev } = boot(BOARD ? { html: (await import('node:fs')).readFileSync(BOARD, 'utf8') } : {});
seed(ev, FIX);
// seed() pushes the fixture in AFTER boot's applyState, so the baseline the board rebuilds from on
// every applyState is still empty -- the same harness artefact every suite corrects. The locked
// view (1c) applies state, and without this it would rebuild an empty board for every surface after it.
ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); 'ok'`);
ev(`S.awards['A']={mode:'single',d:FYMON[1][0],day:1};
    S.awards['B']={mode:'single',d:FYMON[2][0],day:1}; save(); render(); 'ok'`);

const surfaces = harvest(ev);

// --emit prints the populated-cell map and nothing else, so it can be piped straight to
// trace-stated.json. It must run before ANY report output or the file gets the banner too.
if (process.argv.includes('--emit')) {
  const out = {};
  for (const k of ORDER) out[k] = surfaces.filter(s => s.cells[k] !== undefined).map(s => s.name);
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

// ---- the matrix ----------------------------------------------------------------------------------
const fm = v => v === undefined ? '--' : '$' + Math.round(v).toLocaleString();
const W = 30;
console.log('TRACE MATRIX — every surface that states a quantity, cross-footed against the fixture');
console.log('='.repeat(120));
console.log('truth is computed in this file from the fixture\'s own numbers, never read from the board\n');
console.log('THE FORMULAS EVERY SURFACE IS HELD TO — one definition, applied per service, then summed.');
console.log('A surface may be SILENT about a quantity. If it states one, it states THIS one.');
console.log('-'.repeat(120));
for (const k of ORDER) console.log(`  ${LABEL[k].padEnd(32)} ${FORMULA[k]}`);
console.log('-'.repeat(120));
console.log('  identity, per service:  d + m + u == basis        portfolio:  beyond + trim == TOTAL unfunded');
console.log('-'.repeat(120) + '\n');

// WHICH SURFACE STATES WHICH QUANTITY, recorded. A cell that has ALWAYS been silent is fine -- a
// slide that never mentions trim is not wrong. But a cell that used to carry a figure and now says
// '--' is a surface that quietly STOPPED REPORTING, and silence scores as silence, not as a
// mismatch: the matrix would go on saying every link holds while a figure vanished off a briefing
// product. So the populated set is pinned here and gated on.
//   node tools/trace-matrix.mjs --emit   print this map from the current run, to paste back
// Add a name when a surface legitimately starts stating a quantity; remove one only deliberately,
// and say why in the commit.
const STATED = JSON.parse(readFileSync(new URL('./trace-stated.json', import.meta.url), 'utf8'));

const fails = [], wentSilent = [];
for (const k of ORDER) {
  for (const name of (STATED[k] || [])) {
    const s = surfaces.find(x => x.name === name);
    if (!s) { wentSilent.push({ label: LABEL[k], surface: name, why: 'that surface is gone' }); continue; }
    if (s.cells[k] === undefined) wentSilent.push({ label: LABEL[k], surface: name, why: 'it no longer states this quantity' });
  }
}
for (const k of ORDER) {
  console.log(`${LABEL[k]}`);
  console.log(`  ${''.padEnd(W)} ${''.padStart(16)}   ${FORMULA[k]}`);
  console.log(`  ${'TRUTH'.padEnd(W)} ${fm(T[k]).padStart(16)}`);
  for (const s of surfaces) {
    const v = s.cells[k];
    if (v === undefined) { console.log(`  ${(s.name + ' ').padEnd(W, '.')} ${'--'.padStart(16)}   (does not state it)`); continue; }
    const ok = Math.abs(v - T[k]) <= s.tol;
    if (!ok) fails.push({ q: k, label: LABEL[k], surface: s.name, kind: s.kind, got: v, want: T[k] });
    console.log(`  ${(s.name + ' ').padEnd(W, '.')} ${fm(v).padStart(16)}   ${ok ? 'ok' : '<<< MISMATCH  off by ' + fm(v - T[k])}`);
  }
  console.log('');
}

const stated = surfaces.reduce((a, s) => a + ORDER.filter(k => s.cells[k] !== undefined).length, 0);
console.log('='.repeat(120));
console.log(`${surfaces.length} surfaces · ${ORDER.length} quantities · ${stated} populated cells`);
if (wentSilent.length) {
  console.log(`\n${wentSilent.length} SURFACE(S) STOPPED STATING A FIGURE THEY USED TO STATE:\n`);
  wentSilent.forEach(w => console.log(`  ${w.label}\n      ${w.surface} — ${w.why}\n`));
  console.log('A figure that disappears scores as silence, not as a mismatch, so nothing else in');
  console.log('this matrix would have noticed. If the removal was deliberate, strike the surface');
  console.log('off trace-stated.json in the same commit and say why.');
  process.exit(1);
}
if (!fails.length) {
  console.log('\nEVERY LINK HOLDS — every surface that states a quantity states the same one');
  process.exit(0);
}
console.log(`\n${fails.length} BROKEN LINK(S) — a surface states a figure the rest of the board does not agree with:\n`);
for (const f of fails)
  console.log(`  ${f.label}\n      ${f.kind}: ${f.surface}\n      says ${fm(f.got)}, the board says ${fm(f.want)}  (off by ${fm(f.got - f.want)})\n`);
process.exit(1);
