// u17-probe.mjs -- U17 RE-MEASURED ON THE U13 COMMIT (63bd8b0, board 98eed7e8) against the board before it (a8891e1, 1375b72b).
// READ-ONLY reproduction and measurement; nothing is fixed. Built from rec/L2/u13codex/verify/u13codex-refute.mjs (the U13
// routes S1harness, S1tick, S1perm, S1open, S1pen and the verifier's V1same, V1sameperm, V2live, V3next, V4putback),
// rec/L2/u13probe/u13-probe.mjs (the second-writer route), plus the routes searched for here: U25's save-during-read
// boundary (U25ws, U25wf, U25mid), U20's save waiting for another tab's lock (L20, navigator.locks mocked), and U24's
// adoption paths (adoptShared SHd, sharedArrived SHa, bootTakeFile BT, importBoards IB), each with a no-save control.
//
//   usage: node u17-probe.mjs <copyRoot> <outJson> <scenario> <next>     (the board's blob selects the literal expectations)
//   next: none | save (V3next: the next 💾 Save) | putback (V4putback: ↶ put it back, then 💾 Save)
//
// <copyRoot> holds a `git archive` copy of a commit plus the shim and a node_modules symlink. BOARD is unset before
// boot.mjs is imported, and asserted to resolve to the copy's own board.
//
// EVERY EXPECTED VALUE IS A HAND-WRITTEN LITERAL (the fixture's note strings and whole-dollar allocations, and per-scenario
// literal tuples in CFG below). Timestamps are compared only as identities read from the raw folder bytes. Board helpers
// (baseGet, driveBaseOf, the kept slot's storage key ...) are only READ, for observed values.
//
// The W1H block below is copied verbatim from tools/export-audit/audit-import.mjs (L3745-3813 in both copies; identical
// to rec/L2/u13codex/w1h-block.txt, blob e771578d); the probe body follows it.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(process.argv[2] || '.');
const outPath = resolve(process.argv[3] || 'u17-out.json');
const SCN = process.argv[4] || 'S1harness';
const NEXT = process.argv[5] || 'none';
delete process.env.BOARD;                       // boot.mjs must take the copy's own board
delete process.env.MUT_FIRST_FAIL;
await import(pathToFileURL(root + '/runtime-encoding-shim.mjs').href);
const { boot, seed, bootMark, bootRelease, settleBoards, BOARD } = await import(pathToFileURL(root + '/tools/export-audit/boot.mjs').href);
const blobOf = buf => createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
const boardPath = root + '/prioritization-board-grid.html';
if (resolve(BOARD) !== boardPath) throw new Error(`boot.mjs BOARD is ${BOARD}, not ${boardPath}`);
const IDS = {
  board: blobOf(readFileSync(boardPath)),
  bootMjs: blobOf(readFileSync(root + '/tools/export-audit/boot.mjs')),
  shim: blobOf(readFileSync(root + '/runtime-encoding-shim.mjs')),
  probe: blobOf(readFileSync(new URL(import.meta.url))),
  BOARD: resolve(BOARD),
};
