// Two builds of one app. The card build and the grid build differ ONLY in presentation; every
// number, every export, every rule about lanes and Mission Critical has to stay identical or the
// two will quietly disagree and someone will brief the wrong figure.
//
// Nothing enforces that but this. It extracts every top-level function from both files and diffs
// them by name. Anything that differs must be named in parity-allow.json with a reason -- so
// divergence becomes a deliberate, reviewed act rather than something discovered months later.
//
//   node tools/parity.mjs            report and fail on unexpected drift
//   node tools/parity.mjs --list     print the allowed list and what each is for
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const HERE = new URL('.', import.meta.url).pathname;
const A = { name: 'card', path: HERE + '../prioritization-board.html' };
const B = { name: 'grid', path: HERE + '../prioritization-board-grid.html' };
const ALLOW_PATH = HERE + 'parity-allow.json';

// Top-level declarations only: `function name(` at column 0, closing at the first `\n}`. The board
// is written that way throughout (930 of them, no duplicate names), so this is exact rather than
// heuristic -- and if that ever stops being true, the counts below stop matching and you find out.
function functionsOf(src) {
  const out = new Map();
  for (const m of src.matchAll(/^function ([A-Za-z0-9_$]+)\s*\(/gm)) {
    const end = src.indexOf('\n}', m.index);
    if (end < 0) continue;
    out.set(m[1], src.slice(m.index, end + 2));
  }
  return out;
}
const norm = s => s.replace(/\r\n/g, '\n').trimEnd();
const hash = s => createHash('sha1').update(norm(s)).digest('hex').slice(0, 12);

for (const f of [A, B]) {
  if (!existsSync(f.path)) { console.error(`missing build: ${f.path}`); process.exit(2); }
  f.src = readFileSync(f.path, 'utf8');
  f.fns = functionsOf(f.src);
}

const allow = existsSync(ALLOW_PATH) ? JSON.parse(readFileSync(ALLOW_PATH, 'utf8')) : { functions: {}, notes: '' };
const allowed = allow.functions || {};

if (process.argv.includes('--list')) {
  const ks = Object.keys(allowed);
  console.log(`\n${ks.length} function(s) allowed to differ between the builds:\n`);
  for (const k of ks) console.log(`  ${k.padEnd(22)} ${allowed[k]}`);
  process.exit(0);
}

const onlyA = [...A.fns.keys()].filter(k => !B.fns.has(k));
const onlyB = [...B.fns.keys()].filter(k => !A.fns.has(k));
const differ = [...A.fns.keys()].filter(k => B.fns.has(k) && hash(A.fns.get(k)) !== hash(B.fns.get(k)));

const unexpected = {
  onlyA: onlyA.filter(k => !(k in allowed)),
  onlyB: onlyB.filter(k => !(k in allowed)),
  differ: differ.filter(k => !(k in allowed)),
};
const expected = [...onlyA, ...onlyB, ...differ].filter(k => k in allowed);

console.log(`\nbuild parity — card vs grid`);
console.log(`  card build   ${A.fns.size} top-level functions`);
console.log(`  grid build   ${B.fns.size} top-level functions`);
console.log(`  identical    ${[...A.fns.keys()].filter(k => B.fns.has(k) && hash(A.fns.get(k)) === hash(B.fns.get(k))).length}`);

if (expected.length) {
  console.log(`\n  allowed to differ (${expected.length}) —`);
  for (const k of expected) console.log(`    ok    ${k.padEnd(22)} ${allowed[k]}`);
}

const bad = unexpected.onlyA.length + unexpected.onlyB.length + unexpected.differ.length;
if (bad) {
  console.log(`\n  UNEXPECTED DIVERGENCE (${bad}) —`);
  for (const k of unexpected.differ) console.log(`    FAIL  ${k.padEnd(22)} body differs between the builds`);
  for (const k of unexpected.onlyA)  console.log(`    FAIL  ${k.padEnd(22)} only in the card build`);
  for (const k of unexpected.onlyB)  console.log(`    FAIL  ${k.padEnd(22)} only in the grid build`);
  console.log(`\n  Either port the change to the other build, or — if the difference is deliberate —`);
  console.log(`  add the name to tools/parity-allow.json with a reason.\n`);
  process.exit(1);
}
console.log(`\n  no unexpected divergence — the two builds share their logic\n`);
