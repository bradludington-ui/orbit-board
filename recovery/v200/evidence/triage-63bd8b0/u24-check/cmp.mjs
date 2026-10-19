// cmp.mjs <a.json> <b.json> : compares two check outputs (out/checks-<pass>.json) row by row on (scenario, kind, what):
// verdict (ok) and the OBSERVED value (got). Read-only on both files. Prints the differences and a count.
import { readFileSync } from 'node:fs';
const [a, b] = process.argv.slice(2).map(p => JSON.parse(readFileSync(p, 'utf8')));
const key = r => r.sc + ' | ' + r.kind + ' | ' + r.what;
const J = JSON.stringify;
const mb = new Map(b.rows.map(r => [key(r), r]));
let same = 0, diff = 0, onlyA = 0;
for (const r of a.rows) {
  const s = mb.get(key(r));
  if (!s) { onlyA++; console.log('ONLY IN A:', key(r)); continue; }
  mb.delete(key(r));
  if (r.ok === s.ok && J(r.got) === J(s.got) && J(r.want) === J(s.want)) same++;
  else { diff++; console.log('DIFF:', key(r), '\n   A ok=' + r.ok + ' got ' + J(r.got) + ' want ' + J(r.want), '\n   B ok=' + s.ok + ' got ' + J(s.got) + ' want ' + J(s.want)); }
}
for (const k of mb.keys()) console.log('ONLY IN B:', k);
console.log(`rows A=${a.rows.length} B=${b.rows.length} identical=${same} differ=${diff} onlyA=${onlyA} onlyB=${mb.size}`);
