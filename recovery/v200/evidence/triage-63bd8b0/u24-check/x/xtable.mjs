// xtable.mjs <xchecks.json> : a markdown table of expected (literal, from xcheck.mjs) vs observed, read-only.
import { readFileSync } from 'node:fs';
const { pass, rows } = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const J = JSON.stringify, cell = v => J(v).replace(/\|/g, '\\|');
console.log(`| scenario | kind | check | expected (literal) | observed (${pass}) |`);
console.log('|---|---|---|---|---|');
for (const r of rows) if (r.kind !== 'RUN') console.log(`| ${r.sc} | ${r.kind} | ${r.what.replace(/\|/g, '/')} | ${cell(r.want)} | ${r.ok ? '= ' : '**≠** '}${cell(r.got)} |`);
