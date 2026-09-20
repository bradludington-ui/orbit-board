// VALIDATE-MATH — the whole arithmetic gate, in one run, for the nightly job.
//
// Runs every stage even when an earlier one fails, because a nightly report that stops at the first
// red tells you one thing and hides five. Exits non-zero if ANY stage fails.
//
// WHY THE SWEEPS ARE PART OF THIS AND NOT OPTIONAL: green suites prove nothing on their own. A check
// that cannot run reads exactly like a passing one, and this codebase has produced five of those --
// a column read by index that silently re-pointed, an exclusion list that promoted a new row to a
// data row, a "differs under the toggle" comparison satisfied by its own marker, a money column
// padded in a subtotal, and a value matched "somewhere on the row" that found itself next door. The
// mutation sweep is what proves the checks still bite. NOT APPLIED fails the run for the same
// reason: a stale search string is a check that no longer runs.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const GRID = join(ROOT, 'prioritization-board-grid.html');
const started = new Date();

const run = (label, cmd, args, env = {}) => new Promise(res => {
  const t0 = Date.now();
  const p = spawn(cmd, args, { cwd: ROOT, env: { ...process.env, ...env } });
  let out = '';
  p.stdout.on('data', d => out += d);
  p.stderr.on('data', d => out += d);
  p.on('close', code => res({ label, code, out, ms: Date.now() - t0 }));
  p.on('error', e => res({ label, code: -1, out: String(e), ms: Date.now() - t0 }));
});

const N = (s, re) => { const m = re.exec(s); return m ? Number(m[1]) : null; };

// Read a sweep's own summary line rather than counting lines: the summary is what the tool asserts.
function sweepFacts(out) {
  const caught = /caught (\d+)\/(\d+)/.exec(out);
  return {
    caught: caught ? Number(caught[1]) : null,
    of: caught ? Number(caught[2]) : null,
    survived: (out.match(/^\s+SURVIVED/gm) || []).length,
    notApplied: (out.match(/^\s+NOT APPLIED/gm) || []).length,
    crashed: (out.match(/^\s+CRASHED/gm) || []).length,
    equivalent: N(out, /\((\d+) equivalent/),
  };
}

const stages = [];
const note = s => { stages.push(s); return s; };

console.log(`SPMT MATH VALIDATION — ${started.toISOString()}`);
console.log('='.repeat(96));

// ---- 0. the defect register: is every defect this board has ALREADY shipped still guarded? ------
// Cheapest stage and the first one, because it answers a different question from all the others.
// They ask whether the board is right TODAY. This asks whether the specific ways it has been wrong
// BEFORE are still pinned down -- every entry names the mutations that prove its check bites, and
// this fails if one of them has gone. A defect that ships twice is the one that costs trust.
{
  const r = await run('defect register', 'node', [join(HERE, 'math-defects.mjs')], {});
  const known = N(r.out, /(\d+) known defect\(s\)/);
  const muts = N(r.out, /guarded by (\d+) mutation\(s\)/);
  const unguarded = N(r.out, /, (\d+) unguarded/);
  note({ ...r, ok: r.code === 0, detail: r.code === 0
    ? `${known ?? '?'} known defect(s) still guarded by ${muts ?? '?'} mutation(s)`
      + (unguarded ? `, ${unguarded} not yet pinned down` : '')
    : 'A GUARD IS MISSING — a defect this board has already shipped can ship again' });
  console.log(`  ${r.code === 0 ? 'ok  ' : 'FAIL'}  defect register`);
}

// ---- 1. coverage: is there anything whose money nothing is checking? ----------------------------
for (const [lbl, env] of [['coverage (card)', {}], ['coverage (grid)', { BOARD: GRID }]]) {
  const r = await run(lbl, 'node', [join(HERE, 'money-coverage.mjs')], env);
  const gaps = N(r.out, /(\d+) recorded gap\(s\) outstanding/);
  note({ ...r, ok: r.code === 0, detail: r.code === 0
    ? `${(/holds — (\d+\/\d+)/.exec(r.out) || [, '?'])[1]} surfaces covered, ${gaps ?? '?'} recorded gap(s)`
    : 'COVERAGE FAILURE — a money surface has nothing aimed at it, or the registry is stale' });
  console.log(`  ${r.code === 0 ? 'ok  ' : 'FAIL'}  ${lbl}`);
}

// ---- 2. the trace matrix: does every surface stating a quantity state the SAME one? --------------
// Coverage asks whether anything is checking a figure. This asks whether the figures AGREE: the same
// dollars travel from the requirement math to a tile, a panel, a sheet, a subtotal and a slide, and
// a reader can only trust any of them if they match. One broken link names itself here -- quantity,
// surface, got, want -- instead of being found by someone comparing a deck to a workbook in a
// meeting.
for (const [lbl, env] of [['trace matrix (card)', {}], ['trace matrix (grid)', { BOARD: GRID }]]) {
  const r = await run(lbl, 'node', [join(HERE, 'trace-matrix.mjs')], env);
  const cells = N(r.out, /(\d+) populated cells/);
  const broken = N(r.out, /(\d+) BROKEN LINK/);
  note({ ...r, ok: r.code === 0, detail: r.code === 0
    ? `${cells ?? '?'} populated cells, every link holds`
    : `${broken ?? '?'} BROKEN LINK(S) — a surface states a figure the rest of the board does not` });
  console.log(`  ${r.code === 0 ? 'ok  ' : 'FAIL'}  ${lbl}  (${cells ?? '?'} cells)`);
}

// ---- 3. the suites, on both builds --------------------------------------------------------------
// THE GATE IS THE EXIT CODE, not a count of banner lines. audit:suites chains SEVEN suites but only
// SIX print "ALL CHECKS PASSED" -- audit:legacy closes with its own sentence ("every legacy Force
// setting computes exactly as before"), which is why the healthy total across both builds has always
// been 12 and not 14. A gate written against 7 fails every night on a board that is perfectly fine,
// and a nightly job that cries wolf is one nobody reads. The chain already exits non-zero if any
// suite fails; the banner count is reported as a fact, and the legacy marker is asserted separately
// so that suite cannot go quiet unnoticed.
for (const [lbl, env] of [['suites (card)', {}], ['suites (grid)', { BOARD: GRID }]]) {
  const r = await run(lbl, 'npm', ['run', 'audit:suites', '--silent'], env);
  const passed = (r.out.match(/ALL CHECKS PASSED/g) || []).length;
  const legacy = /every legacy Force setting computes exactly as before/.test(r.out);
  const ok = r.code === 0 && legacy && passed >= 6;
  note({ ...r, ok, detail: ok ? `all 7 suites clean (${passed} banners + the legacy line)`
    : `exit ${r.code}, ${passed} banner(s), legacy line ${legacy ? 'present' : 'MISSING'}` });
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${lbl}  (${passed} banners${legacy ? ' + legacy' : ', LEGACY LINE MISSING'})`);
}

// ---- 4. the two builds must not diverge ----------------------------------------------------------
{
  const r = await run('parity', 'npm', ['run', 'parity', '--silent']);
  note({ ...r, ok: r.code === 0, detail: r.code === 0 ? 'the two builds share their logic'
    : 'UNDECLARED DIVERGENCE between the card and grid builds' });
  console.log(`  ${r.code === 0 ? 'ok  ' : 'FAIL'}  parity`);
}

// ---- 5. what only a browser can see --------------------------------------------------------------
// jsdom cannot see a clipped figure or a panel that does not open. A number that is right and
// unreadable is still a number nobody can brief.
{
  const r = await run('browser checks', 'npm', ['run', 'verify:grid', '--silent']);
  note({ ...r, ok: r.code === 0, detail: r.code === 0
    ? 'controls, inspector, toolbar, editors, colours, menus and panels all clean'
    : 'a rendered surface failed — clipped value, unopened panel, or a width that scrolls' });
  console.log(`  ${r.code === 0 ? 'ok  ' : 'FAIL'}  browser checks`);
}

// ---- 5b. the other can't-fail ---------------------------------------------------------------------
// Data loss. A random seed every night, printed so a failure is replayable; the fuzz fills every
// container the board writes -- it reads the set from the board's source and fails if one is left
// empty -- and drives save/reopen, the second save, the year copy and the PMO round trip.
for (const [lbl, env] of [['fuzz (card)', {}], ['fuzz (grid)', { BOARD: GRID }]]) {
  const r = await run(lbl, 'node', [join(HERE, 'roundtrip-fuzz.mjs')], env);
  const seed = (/seed (\d+)/.exec(r.out || '') || [])[1] || '?';
  note({ ...r, ok: r.code === 0, detail: r.code === 0
    ? `nothing lost across 3 randomized boards, seed ${seed}`
    : `a value did not survive a trip — replay with --seed ${seed}` });
  console.log(`  ${r.code === 0 ? 'ok  ' : 'FAIL'}  ${lbl}`);
}

// ---- 5c. the file verifier's own proof ----------------------------------------------------------
// The one tool that runs on the board people brief from (tools/verify-file.mjs). A verifier that
// cannot fail is a rumour, so every night it certifies a synthetic saved file, then plants a ghost
// in the priority order and truncates the saved state, and must notice both.
{
  const r = await run('verify-file (self-test)', 'node', [join(HERE, 'verify-file.mjs'), '--selftest'], {});
  const ok = r.code === 0 && /VERIFIER SELF-TEST PASSED/.test(r.out || '');
  note({ ...r, ok, detail: ok
    ? 'a clean synthetic saved file holds; a planted ghost and a truncated state are both noticed'
    : 'the verifier did not hold a clean file, or did not notice a planted loss' });
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  verify-file (self-test)`);
}

// ---- 6. the sweeps, in parallel -------------------------------------------------------------------
console.log('  ..    mutation sweeps (both builds, in parallel) — this is the long one');
const [cardSweep, gridSweep] = await Promise.all([
  run('sweep (card)', 'node', [join(HERE, 'export-audit', 'mutate.mjs')]),
  run('sweep (grid)', 'node', [join(HERE, 'export-audit', 'mutate.mjs')], { BOARD: GRID }),
]);
for (const r of [cardSweep, gridSweep]) {
  const f = sweepFacts(r.out);
  const ok = r.code === 0 && f.survived === 0 && f.notApplied === 0 && f.crashed === 0;
  note({ ...r, ok, facts: f, detail: `${f.caught}/${f.of} caught · ${f.survived} survived · `
    + `${f.notApplied} not applied · ${f.crashed} crashed · ${f.equivalent} equivalent` });
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${r.label}  ${f.caught}/${f.of} caught, `
    + `${f.survived} survived, ${f.notApplied} NOT APPLIED, ${f.crashed} CRASHED`);
}

// ---- report ---------------------------------------------------------------------------------------
const failed = stages.filter(s => !s.ok);
const mins = t => (t / 60000).toFixed(1) + 'm';
console.log('\n' + '='.repeat(96));
for (const s of stages) console.log(`  ${s.ok ? 'ok  ' : 'FAIL'}  ${s.label.padEnd(18)} ${String(mins(s.ms)).padStart(6)}   ${s.detail}`);

const dir = join(ROOT, '.math-reports');
try { mkdirSync(dir, { recursive: true }); } catch {}
const stamp = started.toISOString().slice(0, 19).replace(/[:T]/g, '-');
const reportPath = join(dir, `math-${stamp}.json`);
writeFileSync(reportPath, JSON.stringify({
  started: started.toISOString(), finishedAt: new Date().toISOString(),
  ok: failed.length === 0,
  stages: stages.map(s => ({ label: s.label, ok: s.ok, exit: s.code, ms: s.ms,
    detail: s.detail, facts: s.facts || null,
    // only failing stages keep their output, so a green report stays small
    output: s.ok ? null : s.out.slice(-20000) })),
}, null, 2));

console.log('\n' + '='.repeat(96));
if (!failed.length) {
  console.log(`MATH VALIDATION PASSED — every stage clean in ${mins(Date.now() - started)}`);
  console.log(`report: ${reportPath}`);
  process.exit(0);
}
console.log(`MATH VALIDATION FAILED — ${failed.length} stage(s):`);
failed.forEach(s => {
  console.log(`\n--- ${s.label} (exit ${s.code}) — ${s.detail}`);
  console.log(s.out.split('\n').slice(-40).map(l => '    ' + l).join('\n'));
});
console.log(`\nreport: ${reportPath}`);
process.exit(1);
