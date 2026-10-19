// texts.mjs <pass> <scenario> <step...> : prints the status line and header of named steps (reader only)
import { readFileSync } from 'node:fs';
const [pass, sc, ...steps] = process.argv.slice(2);
const O = JSON.parse(readFileSync(new URL(`../out/${pass}-${sc}.json`, import.meta.url), 'utf8'));
for (const s of steps) { const v = s.includes('.') ? s.split('.').reduce((o, k) => o && o[k], O.steps) : O.steps[s];
  console.log(`[${sc} ${s}] header=${JSON.stringify(v && v.header)}\n  status=${JSON.stringify(v && v.status)}${v && v.asked ? '\n  asked=' + JSON.stringify(v.asked) : ''}`); }
