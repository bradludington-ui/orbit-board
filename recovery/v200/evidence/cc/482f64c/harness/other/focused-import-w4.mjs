// FOCUSED harness (reuse review): VERBATIM from the suite given -- imports, failure list, keepBoards, SEEN/chk, the
// v2.00 (U2) block(s) '// ==== v1.95 W4: journal by year, PMO drill and PMO by year (items 54, 55) ====' .. '// ==== end W4 ====', the top-level helpers they reference (closure: it), the guard. Not the full suite.
import { boot, seed, BOARD, capture, cv, bootMark, bootRelease, settleBoards, stopAtFirstFailure } from './boot.mjs';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { JSDOM, VirtualConsole } from 'jsdom';
let failures = [];
stopAtFirstFailure(failures);   // in the mutation sweep only: see boot.mjs
// The boards a later block reuses: V185W, V186L and V14 are built once and read by the blocks after.
// Each is read through a guard -- a block above its `let` line runs while it is still uninitialised.
const keepBoards = () => [() => V185W, () => V186L, () => V14]
  .map(f => { try { return f(); } catch { return null; } })
  .flatMap(v => (!v || typeof v !== 'object') ? [] : [v, ...Object.values(v)])   // never a string: V186L is a whole board file, and spreading one made 3.2 million entries a block
  .filter(x => x && typeof x === 'object' && x.w).map(x => x.w);
// EVERY NAMED SCENARIO MUST RUN. A block appended after process.exit() never executes and reads as
// a pass -- the proposal scenario in audit-import.mjs sat there for a whole verification round and
// five mutations aimed at it survived. chk() records every scenario it hears from; at the summary,
// any `const name = '...'` in this file it never heard from is a failure, not a pass.
import { readFileSync as _selfRead } from 'node:fs';
import { fileURLToPath as _selfPath } from 'node:url';
const SEEN = new Set();
// SUITE_CHECKS=<file> records EVERY check -- name, place, claim, verdict, and what was read -- so a
// change to the suite itself can be proved to have kept every check and its verdict (v1.87).
import { appendFileSync as _ckAppend } from 'node:fs';
const CHECKS = process.env.SUITE_CHECKS || '';
const chk = (scenario, where, what, got, want) => {
  SEEN.add(scenario);
  const ok = (typeof got === 'number' && typeof want === 'number')
    ? Math.abs(got - want) <= 0.005 : String(got) === String(want);
  if (CHECKS) _ckAppend(CHECKS, JSON.stringify([scenario, where, what, ok, String(got).slice(0, 400)]) + '\n');
  if (!ok) failures.push({ scenario, where, what, got, want });
};
const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: id,
  event: id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });

// ==== v1.95 W4: journal by year, PMO drill and PMO by year (items 54, 55) ====
// v1.95, ITEM 54 (review R08): THE JOURNAL KEEPS FISCAL YEARS APART.
// The journal joined a person's edits to one field inside a minute and never asked which YEAR. An FY27
// note edit and the same note in FY28 became one FY27 line holding FY28's text; Put back on it undid
// FY27 and kept FY28, and FY27's text then existed nowhere. Edits in two years that cancelled left no
// line at all; an edit just after a put-back rewrote the put-back line; a clock set back still counted
// as inside the minute; two loads inside a minute became one; and a new year's line read "undefined".
// Driven through the real editors: the Description & note box (openFld → fldSave), switchYear, and the
// journal's own Put back (jrnlUndo). The clock is held still and moved by hand, so "inside a minute"
// is a fact of the test rather than of how quickly the machine ran it.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.95 — the journal keeps fiscal years apart';
  try {
  const J = JSON.stringify;
  const mkJ = () => {
    const B = boot({ ls: { prio27who: 'alice' } });
    seed(B.ev, { services: ['USAF', 'ANG'], items: [it('A', 'AV', [10, 10]), it('B', 'AV', [5, 5])],
      disc: [100, 100], mand: [100, 100], order: ['A', 'B'] });
    B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); MS.years[MS.cur]=S; save();
      globalThis.__T=Date.now(); Date.now=function(){ return globalThis.__T; }; 'ok'`);
    B.later = ms => B.ev(`globalThis.__T+=${ms}; 'ok'`);
    B.note = (id, v) => B.ev(`openFld(${J(id)},'dn'); document.getElementById('fld-note').value=${J(v)}; fldSave(); 'ok'`);
    B.year = y => B.ev(`switchYear(${y}); 'ok'`);
    B.n = () => +B.ev('(MS.jrnl||[]).length');
    B.lines = from => JSON.parse(B.ev(`JSON.stringify((MS.jrnl||[]).slice(${from}).map(function(e){ return [e.fy, (e.p||[]).join('.'), e.a, e.b, e.f? 1 : 0]; }))`));
    B.undo = i => B.ev(`jrnlUndo(${i}); 'ok'`);
    B.notes = id => JSON.parse(B.ev(`JSON.stringify(Object.keys(MS.years).sort().map(function(y){ var v=(MS.years[y].notes||{})[${J(id)}]; return v===undefined? null : v; }))`));
    return B;
  };
  // ── 1. an edit in each of two years, then Put back, each year in turn ──
  const B = mkJ();
  const cur = +B.ev('MS.cur');
  B.note('A', 'orig');
  B.year(cur + 1); B.year(cur);                 // FY+1 rolled forward from this year: both read 'orig'
  const yl = B.ev(`(function(){ var e=(MS.jrnl||[]).filter(function(x){ return Array.isArray(x.p) && !x.p.length; })[0];
      return e? String(jrnlLabel(e)).replace(/<[^>]+>/g,'') : '(no line)'; })()`);
  chk(name, 'a new year', 'the line a new year writes names the year', yl, 'the FY' + ((cur + 1) % 100) + ' plan — created');
  B.ev(`jrnlOpen=true; jrnlBody(); 'ok'`);
  chk(name, 'a new year', 'and nothing in the journal panel reads "undefined"', /undefined/.test(B.ev(`document.getElementById('jrnlBody').textContent`)), false);
  B.ev(`jrnlOpen=false; jrnlBody(); 'ok'`);
  B.later(120000);
  const n0 = B.n();
  B.note('A', 'FY27 edit'); B.year(cur + 1); B.note('A', 'FY28 edit');     // the same person, the same note, the same second
  chk(name, 'two years', 'an edit in each year is a line for each year, each with its own text',
    J(B.lines(n0)), J([[cur, 'notes.A', 'orig', 'FY27 edit', 0], [cur + 1, 'notes.A', 'orig', 'FY28 edit', 0]]));
  B.undo(n0 + 1);
  chk(name, 'put back', 'putting back the FY+1 line puts back FY+1 and leaves this year as edited', J(B.notes('A')), J(['FY27 edit', 'orig']));
  B.undo(n0);
  chk(name, 'put back', 'putting back this year’s line, from FY+1, puts back this year alone', J(B.notes('A')), J(['orig', 'orig']));
  const byYear = y => B.lines(n0).filter(l => l[0] === y).map(l => [l[2], l[3], l[4]]);
  chk(name, 'history', 'each year keeps its own history: its edit and its put-back',
    J([byYear(cur), byYear(cur + 1)]), J([[['orig', 'FY27 edit', 0], ['FY27 edit', 'orig', 1]], [['orig', 'FY28 edit', 0], ['FY28 edit', 'orig', 1]]]));
  B.undo(B.n() - 1);                            // the newest line: this year's put-back
  chk(name, 'put back', 'putting back the put-back brings this year’s own text back, and FY+1 is untouched', J(B.notes('A')), J(['FY27 edit', 'orig']));
  // ── 2. edits in two years that cancel: both recorded ──
  const C = mkJ();
  C.note('A', 'alpha'); C.year(cur + 1); C.note('A', 'beta'); C.year(cur);
  C.later(120000);
  const m0 = C.n();
  C.note('A', 'beta'); C.year(cur + 1); C.note('A', 'alpha');                // alpha→beta here, beta→alpha there
  chk(name, 'cancelling edits', 'this year alpha → beta and FY+1 beta → alpha are both recorded',
    J(C.lines(m0)), J([[cur, 'notes.A', 'alpha', 'beta', 0], [cur + 1, 'notes.A', 'beta', 'alpha', 0]]));
  // ── 3. a put-back line stays as written ──
  C.year(cur); C.later(120000);
  const k0 = C.n();
  C.note('B', 'v1'); C.later(120000);
  C.undo(C.n() - 1);                            // put back: v1 → not set
  C.later(5000); C.note('B', 'v2');             // five seconds later, the same note
  chk(name, 'a put-back line', 'stays as written, and the edit just after it is a line of its own',
    J(C.lines(k0)), J([[cur, 'notes.B', null, 'v1', 0], [cur, 'notes.B', 'v1', null, 1], [cur, 'notes.B', null, 'v2', 0]]));
  // ── 4. a clock set back never joins ──
  C.later(120000);
  const q0 = C.n();
  C.note('A', 'morning'); C.later(-3 * 3600 * 1000); C.note('A', 'afternoon');
  chk(name, 'a clock set back', 'an edit stamped before the line above it is a line of its own',
    J(C.lines(q0).map(l => [l[2], l[3]])), J([['beta', 'morning'], ['morning', 'afternoon']]));
  // ── 5. a load stands on its own line ──
  const l0 = C.n();
  C.ev(`jrnlSync('restored the copy from one'); jrnlSync('restored the copy from two'); 'ok'`);
  chk(name, 'loads', 'two loads inside a minute are two forced lines, each as written',
    J(C.lines(l0).map(l => [l[1], l[3], l[4]])), J([['(load)', 'restored the copy from one', 1], ['(load)', 'restored the copy from two', 1]]));
  // CONTROL (passes on v1.94 too): one field, one year, inside the minute is still one line
  C.later(120000);
  const c0 = C.n();
  C.note('A', 'one'); C.later(10000); C.note('A', 'two');
  chk(name, 'control', 'CONTROL — two edits to one note in one year inside a minute are still one line (passes on v1.94)',
    J(C.lines(c0).map(l => [l[2], l[3]])), J([['afternoon', 'two']]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end W4 ====
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const src = _selfRead(_selfPath(import.meta.url), 'utf8');
  const named = [...src.matchAll(/^  const name = '([^']+)'/gm)].map(m => m[1]);   // a scenario's own line, never this one
  // A name built by concatenation ('convert to split — ' + label) is heard only in its finished
  // forms, so a literal that any heard scenario STARTS WITH has run. A dead block's literal has none.
  named.forEach(n => { if (![...SEEN].some(s => s === n || s.startsWith(n))) failures.push({ scenario: n, where: 'harness',
    what: 'this scenario never ran — is its block after process.exit()?', got: 'never ran', want: 'ran' }); });
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
console.log('\n' + '='.repeat(96));
if (!failures.length) { console.log('ALL CHECKS PASSED'); process.exit(0); }
const by = {};
failures.forEach(f => { const k = f.scenario + ' | ' + f.where; (by[k] ||= []).push(f); });
console.log(`${failures.length} FAILING CHECK(S)\n`);
for (const [k, fs] of Object.entries(by)) {
  console.log(`--- ${k}`);
  fs.forEach(f => {
    const g = String(f.got), w = String(f.want);
    if (g.length < 160 && w.length < 160) { console.log(`    ${f.what}\n        got ${g}   want ${w}`); return; }
    // Two multi-kilobyte stores tell you nothing side by side. Point at the first difference.
    let i = 0; while (i < g.length && i < w.length && g[i] === w[i]) i++;
    const cut = Math.max(0, i - 60);
    console.log(`    ${f.what}\n        first differs at char ${i} of ${g.length}/${w.length}`
      + `\n          got  \u2026${g.slice(cut, i + 90)}\u2026`
      + `\n          want \u2026${w.slice(cut, i + 90)}\u2026`);
  });
}
process.exit(1);
