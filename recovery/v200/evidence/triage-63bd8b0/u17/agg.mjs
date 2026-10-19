// agg.mjs : read-only summary of out/m-*.json (the matrix runs). Prints one line per run and the totals by check kind.
import { readFileSync, readdirSync } from 'node:fs';
const U = '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17';
const J = JSON.stringify;
const PFX = process.argv[2] || 'm-';
const files = readdirSync(U + '/out').filter(f => f.startsWith(PFX)).sort();
const tot = {};
const rows = [];
for (const f of files) {
  const r = JSON.parse(readFileSync(U + '/out/' + f, 'utf8'));
  const by = k => r.checks.filter(c => c.kind === k);
  for (const c of r.checks) { tot[c.kind] = tot[c.kind] || { pass: 0, fail: 0, failIds: [] }; if (c.pass) tot[c.kind].pass++; else { tot[c.kind].fail++; tot[c.kind].failIds.push(f + ':' + c.id); } }
  const cf = by('contract').filter(c => !c.pass).map(c => c.id.replace(r.scenario + '.', ''));
  rows.push([r.board, r.scenario, r.next, `fix ${by('fixture').filter(c => c.pass).length}/${by('fixture').length}`, `pred ${by('predict').filter(c => c.pass).length}/${by('predict').length}`,
    `contract-fail [${cf.join(',')}]`, 'K1 ' + J(r.u17state && r.u17state.tuple), r.v3parts ? 'V3 ' + J([r.v3parts.falselyClean, r.v3parts.wroteOver]) : '', r.v4parts ? 'V4 ' + J([r.v4parts.falselyClean, r.v4parts.claim, r.v4parts.falseClaim, r.v4parts.notKept]) : ''].join(' | '));
}
rows.forEach(x => console.log(x));
console.log('runs ' + files.length);
for (const k of Object.keys(tot)) console.log(`kind ${k}: ${tot[k].pass} pass, ${tot[k].fail} fail` + (k !== 'contract' && tot[k].fail ? ' ' + J(tot[k].failIds) : ''));
