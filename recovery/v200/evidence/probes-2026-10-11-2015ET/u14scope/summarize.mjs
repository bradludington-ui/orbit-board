// summarize.mjs <before.json> <after.json> -- prints the matrix and selection results from the probe outputs (observed values only)
import { readFileSync } from 'node:fs';
const [b, a] = process.argv.slice(2).map(p => JSON.parse(readFileSync(p, 'utf8')));
const M = 1e6, fy = ys => ys.length ? ys.map(y => 'FY' + (y % 100)).join(',') : '-';
const rng = ys => { const s = ys.map(y => y % 100); return s.join(' '); };
console.log('blobs', b.boardBlob, a.boardBlob, b.probeBlob, a.probeBlob, 'passed/failed/recorded', b.passed, b.failed, b.recorded, '|', a.passed, a.failed, a.recorded);
for (const k of Object.keys(b.matrix)) {
  const B = b.matrix[k], A = a.matrix[k];
  const f = (o) => `off[${rng(o.yearSets.offered)}] ALL ${o.all.tot / M}=${o.all.exec / M}e+${o.all.plan / M}p miss ${o.missing} | c26 ${o.chip26 ? 'Y' : '-'} sel26 ${o.sel26.clicked ? (o.sel26.tot / M) : '-'}`;
  console.log(k.padEnd(14), '| B', f(B), '|| A', f(A), '| direct26', B.direct26.map(v => v / M).join('/'), '| wb', rng(B.yearSets.workbook), 'cnt B', rng(B.yearSets.counted), 'ms', rng(B.yearSets.msYears));
}
