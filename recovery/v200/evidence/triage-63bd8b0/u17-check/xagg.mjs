// xagg.mjs : READ-ONLY. One line per checker run (out/x-*.json): board, scenario, next, check totals by kind, and the observed
// K1 / adopt / V3next / V4putback / reach tuples with whether each equals its hand-written literal.
import { readFileSync, readdirSync } from 'node:fs';
const C = '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17-check';
const J = JSON.stringify;
const tot = {};
for (const n of readdirSync(C + '/out').filter(n => /^x-/.test(n)).sort()) {
  const r = JSON.parse(readFileSync(C + '/out/' + n, 'utf8'));
  const by = k => { const c = r.checks.filter(x => x.kind === k); tot[k] = tot[k] || [0, 0]; tot[k][0] += c.filter(x => x.pass).length; tot[k][1] += c.filter(x => !x.pass).length; return c.filter(x => x.pass).length + '/' + c.length; };
  const g = suf => { const c = r.checks.find(x => x.id.endsWith(suf)); return c ? (c.pass ? '=' : '≠') + J(c.observed) : '-'; };
  console.log([n.replace(/\.json$/, ''), 'probe ' + r.ids.probe.slice(0, 8), 'board ' + r.ids.board.slice(0, 8),
    'fixture ' + by('fixture'), 'predict ' + by('predict'), 'contract ' + by('contract'), 'harness ' + by('harness'),
    'adopt ' + g('.adopt'), 'K1 ' + g('.K1'), 'V3 ' + g('.V3next'), 'V4 ' + g('.V4putback'),
    'reach ' + (r.checks.filter(x => /\.reach/.test(x.id)).map(x => x.id.split('.').pop() + (x.pass ? '=' : '≠') + J(x.observed)).join(',') || '-'),
    'started ' + r.startedET].join(' | '));
}
console.log('TOTAL ' + J(tot));
