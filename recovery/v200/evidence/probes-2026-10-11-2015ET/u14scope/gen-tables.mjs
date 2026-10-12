// gen-tables.mjs <before.json> <after.json> -- the README's matrix rows, printed from OBSERVED values in the probe outputs
import { readFileSync } from 'node:fs';
const [b, a] = process.argv.slice(2).map(p => JSON.parse(readFileSync(p, 'utf8')));
const M = 1e6, yy = ys => ys.map(y => y % 100).join(' ');
const rowName = { n: 'none', c: 'IS FY25 Mandatory 100 (carried)', f: 'IS filed FY26 7' };
const miss = (k, o) => { if (!o.missing) return '0'; const [base, rule, plan, row] = k.split('|'); const parts = [];
  if (plan === 'P' && !o.yearSets.offered.includes(2026)) parts.push('own FY26 plan 300');
  if (row === 'c' && rule === 'on' && !o.yearSets.offered.includes(2026)) parts.push('carried IS 100');
  return `**${o.missing}** (${parts.join(' + ')})`; };
const all = o => `${o.all.tot / M} = ${o.all.exec / M} ex + ${o.all.plan / M} pl`;
const chip = o => o.chip26 ? (/read from their import$/.test(o.chip26.title) ? 'FY26 · plan (T1)' : 'FY26 · plan (T0)') : 'none';
const sel = o => o.sel26.clicked ? `${o.sel26.tot / M} (${o.sel26.exec / M} ex + ${o.sel26.plan / M} pl)` : 'cannot select';
console.log('| # | base | rule | own FY26 plan | row counted in FY26? | workbook (filed) yrs | counted yrs | every $ on board | offered BEFORE | offered AFTER | ALL YEARS BEFORE | ALL YEARS AFTER | in no offered year BEFORE | AFTER | FY26 chip B / A | FY26 selected B / A | flowCalc(2026) direct |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
let i = 0;
for (const k of Object.keys(b.matrix)) { i++;
  const B = b.matrix[k], A = a.matrix[k]; const [base, rule, plan, row] = k.split('|');
  const counted26 = (row === 'f') || (row === 'c' && rule === 'on');
  const every = B.missing * M + B.all.tot;
  console.log(`| ${i} | ${base} | ${rule.toUpperCase()} | ${plan === 'P' ? '300' : 'none'} | ${rowName[row]}${counted26 ? ' — yes' : (row === 'c' ? ' — no (counts FY25)' : ' — no')} | ${yy(B.yearSets.workbook)} | ${yy(B.yearSets.counted)} | ${every / M} | ${yy(B.yearSets.offered)} | ${yy(A.yearSets.offered)} | ${all(B)} | ${all(A)} | ${miss(k, B)} | ${miss(k, A)} | ${chip(B)} / ${chip(A)} | ${sel(B)} / ${sel(A)} | ${B.direct26.map(v => v / M).join(' / ')} |`);
}
