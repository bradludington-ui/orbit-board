// evo-table.mjs <passA> <passB> : expected vs observed, per scenario, from out/checks-<pass>.json (written by check.mjs). Reader only.
import { readFileSync } from 'node:fs';
const [a, b] = process.argv.slice(2);
const L = p => JSON.parse(readFileSync(new URL(`../out/checks-${p}.json`, import.meta.url), 'utf8'));
const A = L(a), B = L(b);
const J = JSON.stringify;
const key = r => r.sc + '|' + r.kind + '|' + r.what;
const mapB = new Map(B.rows.map(r => [key(r), r]));
const scs = [...new Set(A.rows.map(r => r.sc))];
const short = w => w.replace(/ \[[^\]]*\]$/, '');
console.log(`| scenario | check | expected (literal) | observed ${a} | observed ${b} |\n|---|---|---|---|---|`);
for (const sc of scs) for (const r of A.rows.filter(x => x.sc === sc && (x.kind === 'PRED' || x.kind === 'CONTRACT' || x.kind === 'HOLD'))) {
  const r2 = mapB.get(key(r));
  const o = x => x ? (x.ok ? '= ' : '**≠** ') + J(x.got) : '(missing)';
  console.log(`| ${sc} | ${r.kind}: ${short(r.what).replace(/\|/g, '/')} | ${J(r.want)} | ${o(r)} | ${o(r2)} |`);
}
const tot = p => { const f = p.rows.filter(r => !r.ok); return `${p.rows.length} checks, ${f.length} fail (${f.filter(r => r.kind === 'CONTRACT').length} CONTRACT, ${f.filter(r => r.kind !== 'CONTRACT').length} other)`; };
console.log(`\n${a}: ${tot(A)}; ${b}: ${tot(B)}`);
