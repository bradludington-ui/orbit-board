// expsame.mjs : READ-ONLY. The literals (rec.expected) of the trial runs (xt-, x-probe 2a3c6014, before the resume) against the
// final runs (x-, x-probe c47a43b6) of the same scenario: unchanged?
import { readFileSync, readdirSync } from 'node:fs';
const C = '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17-check';
for (const n of readdirSync(C + '/out').filter(n => /^xt-/.test(n))) {
  const t = JSON.parse(readFileSync(C + '/out/' + n, 'utf8'));
  for (const b of ['b63', 'c137']) {
    const f = JSON.parse(readFileSync(C + '/out/' + n.replace(/^xt-b63/, 'x-' + b), 'utf8'));
    console.log(n + ' vs ' + n.replace(/^xt-b63/, 'x-' + b) + ': expected literals ' + (JSON.stringify(t.expected) === JSON.stringify(f.expected) ? 'IDENTICAL' : 'DIFFER ' + JSON.stringify(t.expected) + ' / ' + JSON.stringify(f.expected)));
  }
}
