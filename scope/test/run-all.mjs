#!/usr/bin/env node
// Runs every scope/test/*.test.mjs, one process each, in file-name order, and fails if any fails.
//   node scope/test/run-all.mjs            all of them
//   node scope/test/run-all.mjs engine     only the files whose name contains "engine"
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const filter = process.argv.slice(2);
const files = readdirSync(HERE).filter(f => f.endsWith('.test.mjs')).sort()
  .filter(f => !filter.length || filter.some(x => f.includes(x)));
let bad = 0;
for (const f of files) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['--max-old-space-size=4096', join(HERE, f)], { stdio: 'inherit' });
  const s = ((Date.now() - t0) / 1000).toFixed(1);
  if (r.status !== 0) { bad++; console.log('✗ ' + f + ' failed (exit ' + r.status + ', ' + s + ' s)'); }
  else console.log('✓ ' + f + ' (' + s + ' s)');
}
if (!files.length) { console.log('no test files matched'); process.exit(1); }
console.log(bad ? bad + ' of ' + files.length + ' test files FAILED' : 'all ' + files.length + ' test files passed');
process.exit(bad ? 1 : 0);
