// scan.mjs : read-only; every failing contract K check whose observed tuple is CONSISTENT ([s, true, s]) -- a harness gap
import { readFileSync, readdirSync } from 'node:fs';
const U = '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17';
const pre = process.argv[2] || 'm-';
for (const f of readdirSync(U + '/out').filter(f => f.startsWith(pre)).sort()) {
  const r = JSON.parse(readFileSync(U + '/out/' + f, 'utf8'));
  for (const c of r.checks) if (!c.pass && /\.K\d$/.test(c.id) && Array.isArray(c.observed) && c.observed[1] === true && c.observed[0] === c.observed[2])
    console.log(f, c.id, JSON.stringify(c.observed));
}
