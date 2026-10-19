// Lists EVERY hit of tools/check.mjs's "handler values" rule (the checker prints only the first 8).
// The four patterns and their exemptions are copied verbatim from tools/check.mjs lines 210-218 (read only;
// the checker is not changed and not imported). Usage: node rule-list.mjs <board.html>
import { readFileSync } from 'node:fs';
const src = readFileSync(process.argv[2], 'utf8');
const lines = src.split('\n');
const bad = [];
const at = i => src.slice(0, i).split('\n').length;
const comment = i => /^\s*(\/\/|\*|\/\*)/.test(lines[at(i) - 1] || '');
const prevChar = i => { let j = i - 1; while (j >= 0 && /\s/.test(src[j])) j--; return src[j]; };
for (const m of src.matchAll(/(\\'|&quot;)'\s*\+/g)) if (!comment(m.index)) bad.push([at(m.index), 'after-open', m.index]);
for (const m of src.matchAll(/\+\s*'(\\'|&quot;)/g))
  if (!comment(m.index) && !/['"`]/.test(prevChar(m.index))) bad.push([at(m.index), 'before-close', m.index]);
for (const m of src.matchAll(/\('"\s*\+/g))
  if (!comment(m.index) && !/_api\/web\//.test(lines[at(m.index) - 1])) bad.push([at(m.index), 'quoted-arg', m.index]);
lines.forEach((l, i) => { if (/\bon[a-z]+="[^"]*'\$\{/.test(l) && !/^\s*\/\//.test(l)) bad.push([i + 1, 'template', -1]); });
console.log('hits: ' + bad.length);
for (const [n, w, ix] of bad) {
  const ls = src.lastIndexOf('\n', ix) + 1;
  console.log(String(n).padStart(6) + '  ' + w.padEnd(13) + ' col ' + (ix - ls + 1) + '  ' + JSON.stringify(src.slice(Math.max(ls, ix - 40), ix + 25)));
}
