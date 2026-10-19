// cmp-passes.mjs <passA> <passB> : every check present in both passes -- same verdict and same observed value? (reader only)
import { readFileSync } from 'node:fs';
const [a, b] = process.argv.slice(2);
const L = p => JSON.parse(readFileSync(new URL(`../out/checks-${p}.json`, import.meta.url), 'utf8')).rows;
const k = r => r.sc + '|' + r.kind + '|' + r.what; const B = new Map(L(b).map(r => [k(r), r]));
let both = 0, same = 0; const diff = [];
for (const r of L(a)) { const s = B.get(k(r)); if (!s) continue; both++; if (r.ok === s.ok && JSON.stringify(r.got) === JSON.stringify(s.got)) same++; else diff.push([k(r), r.got, s.got]); }
console.log(`${a} vs ${b}: ${both} checks in both, ${same} identical (verdict and observed value), ${diff.length} differ`);
for (const d of diff) console.log('DIFF', JSON.stringify(d));
