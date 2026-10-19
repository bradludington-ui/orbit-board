// THE REGISTER OF MATH DEFECTS THIS BOARD HAS SHIPPED — and proof that each one is still guarded.
//
// A defect register written in prose rots: the entries stay, the checks that caught them get
// refactored away, and a year later the file is a changelog nobody can act on. This one is
// EXECUTABLE. Every entry names the mutations that prove its check still bites, and this tool
// fails the moment one of those mutation ids disappears from mutate.mjs.
//
// That is the only property worth having. "We fixed the phantom UFR" is a claim; "the mutation
// that reintroduces it is still in the sweep and the sweep still catches it" is a measurement.
//
// It deliberately does NOT re-run the mutations — the sweep does that, and doing it twice would
// double a two-hour run. This asserts the guards EXIST and are wired in; the sweep proves they
// bite. Together they mean a fixed defect cannot come back unnoticed.
//
//   node tools/math-defects.mjs            check the register and print it
//   node tools/math-defects.mjs --brief    one line per defect
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const brief = process.argv.includes('--brief');
const reg = JSON.parse(readFileSync(join(ROOT, 'math-defects.json'), 'utf8'));

// Every tool source, so a check can be named without also naming the file it lives in — the check
// is the thing that must survive, not its current address.
const SRC = {};
for (const dir of ['tools', 'tools/export-audit']) {
  for (const f of readdirSync(join(ROOT, dir))) {
    if (f.endsWith('.mjs')) SRC[join(dir, f)] = readFileSync(join(ROOT, dir, f), 'utf8');
  }
}
const MUT = SRC['tools/export-audit/mutate.mjs'];
const findsCheck = phrase => Object.keys(SRC).filter(f => f !== 'tools/math-defects.mjs'
  && SRC[f].includes(phrase));
const hasMutation = id => MUT.includes(`id: '${id}'`);

const problems = [], unguarded = [];
const seen = new Set();

console.log('\nMATH DEFECT REGISTER — every defect this board has shipped, and its guard');
console.log('='.repeat(104));

for (const d of reg.defects) {
  if (seen.has(d.id)) problems.push(`duplicate defect id: ${d.id}`);
  seen.add(d.id);

  const missingMut = (d.mutations || []).filter(m => !hasMutation(m));
  const missingChk = (d.checks || []).filter(c => !findsCheck(c).length);

  if (d.guarded === false) {
    unguarded.push(d);
  } else {
    if (!(d.mutations || []).length)
      problems.push(`${d.id}: marked guarded but names no mutation`);
    if (!(d.checks || []).length)
      problems.push(`${d.id}: marked guarded but names no check`);
    missingMut.forEach(m => problems.push(
      `${d.id}: the mutation that proves this defect stays fixed is GONE from mutate.mjs — '${m}'`));
    missingChk.forEach(c => problems.push(
      `${d.id}: no suite contains the check named here — "${c}"`));
  }

  const state = d.guarded === false ? 'UNGUARDED'
    : (missingMut.length || missingChk.length) ? 'GUARD MISSING' : 'guarded';
  if (brief) {
    console.log(`  ${state.padEnd(14)} ${d.found}  ${d.id}`);
    continue;
  }
  console.log(`\n  ${d.id}   [${state}]`);
  console.log(`    found      ${d.found} by ${d.foundBy} · fixed in ${d.build}`);
  console.log(`    surface    ${d.surface}`);
  console.log(`    symptom    ${wrap(d.symptom, 15)}`);
  console.log(`    cause      ${wrap(d.cause, 15)}`);
  console.log(`    fix        ${wrap(d.fix, 15)}`);
  if ((d.checks || []).length) console.log(`    check      ${d.checks.map(c =>
    `"${c}"  (${findsCheck(c).map(f => f.replace('tools/', '')).join(', ') || 'NOT FOUND'})`).join('\n               ')}`);
  if ((d.mutations || []).length) console.log(`    mutations  ${d.mutations.map(m =>
    m + (hasMutation(m) ? '' : '  <-- GONE')).join('\n               ')}`);
}

function wrap(s, indent) {
  const w = 104 - indent, out = []; let line = '';
  for (const word of String(s || '').split(' ')) {
    if ((line + ' ' + word).trim().length > w) { out.push(line.trim()); line = word; }
    else line += ' ' + word;
  }
  if (line.trim()) out.push(line.trim());
  return out.join('\n' + ' '.repeat(indent));
}

if (unguarded.length) {
  console.log('\n' + '-'.repeat(104));
  console.log(`  ${unguarded.length} defect(s) fixed but NOT pinned down by a mutation — outstanding debt:`);
  unguarded.forEach(d => console.log(`    ${d.id}  (${d.found}) — ${d.surface}`));
  console.log('  These do not fail the run. They are reported every night so they get paid down:');
  console.log('  a defect with no mutation is one nothing would notice coming back.');
}

console.log('\n' + '='.repeat(104));
if (problems.length) {
  console.log(`${problems.length} PROBLEM(S) WITH THE REGISTER\n`);
  problems.forEach(p => console.log('  ' + p));
  console.log('\nA guard named here and missing from the code means a defect this board HAS ALREADY');
  console.log('SHIPPED can now ship again with nothing to stop it. Restore the mutation, or, if the');
  console.log('code it aimed at is genuinely gone, re-aim it and say so in the register.');
  process.exit(1);
}
const g = reg.defects.filter(d => d.guarded !== false).length;
const m = reg.defects.reduce((a, d) => a + (d.mutations || []).length, 0);
console.log(`REGISTER HOLDS — ${reg.defects.length} known defect(s), ${g} guarded by ${m} mutation(s)`
  + (unguarded.length ? `, ${unguarded.length} unguarded` : ''));
process.exit(0);
