// runner-ff.mjs (fix round 2): bin/runner.mjs with MUT_FIRST_FAIL=1, for the re-check of entries already caught in fix round 1
// runner.mjs (copied from rec/L2/u2impl/runner.mjs, unchanged) <copyRoot> <harness.mjs> [variantBoard] -- boots a FOCUSED harness the way carry-probe.mjs boots: the copy's
// runtime-encoding-shim.mjs imported first, then the copy's own tools/export-audit/boot.mjs with BOARD unset (asserted to be
// the copy's own board) -- or, for a variant run, BOARD set explicitly to <variantBoard> (asserted, and recorded).
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = resolve(process.argv[2]), harness = resolve(process.argv[3]), variant = process.argv[4] ? resolve(process.argv[4]) : '';
process.env.MUT_FIRST_FAIL = '1';   // fix round 2, re-checking the build's entries: stop at the first failing check (boot.mjs stopAtFirstFailure)
if (variant) process.env.BOARD = variant; else delete process.env.BOARD;
await import(pathToFileURL(root + '/runtime-encoding-shim.mjs').href);
const { BOARD } = await import(pathToFileURL(root + '/tools/export-audit/boot.mjs').href);
const want = variant || (root + '/prioritization-board-grid.html');
if (resolve(BOARD) !== want) { console.log(`BOARD is ${BOARD}, not ${want}`); process.exit(3); }
const blob = p => { const b = readFileSync(p); return createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex'); };
const et = () => new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET';
console.log('IDS ' + JSON.stringify({ BOARD: resolve(BOARD), BOARD_set: !!variant, board: blob(BOARD), harness, harnessBlob: blob(harness),
  bootMjs: blob(root + '/tools/export-audit/boot.mjs'), shim: blob(root + '/runtime-encoding-shim.mjs'), runner: blob(new URL(import.meta.url)), started: et() }));
process.on('exit', c => console.log(`# exit ${c} at ${et()}`));
await import(pathToFileURL(harness).href);
