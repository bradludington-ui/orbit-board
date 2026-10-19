// u13codex-probe.mjs -- U13, Codex's earlier case with NO concurrent writer: a bounded, READ-ONLY reproduction (no fix).
// The folder already holds REMOTE (a valid copy whose store/payload ts is ONE HOUR AHEAD of this machine's clock: it was
// written through the product by a board whose Date.now() returns real time + 3,600,000 ms -- Brad's own writer key,
// another machine with a fast clock). Brad's board adopts it, edits WORKING (unsaved), is reopened from the same browser
// storage, starts a 💾 Save of WORKING held at the close of its folder write, a refresh runs while it is held (the folder
// head is still the pre-existing REMOTE -- NOBODY writes the folder during the save), then the close is released.
//
//   usage: node u13codex-probe.mjs <copyRoot> <outJson> <scenario>
//   scenario: S1auto | S1harness | S1tick | S1perm | S1open | S1pen | Ca | Cb | Cc   (see the README for each)
//
// <copyRoot> holds a `git archive` copy of a commit (prioritization-board-grid.html, tools/, package.json) plus the shim
// and a node_modules symlink. BOARD is unset before boot.mjs is imported, and asserted to resolve to the copy's board.
//
// EVERY EXPECTED VALUE IS LITERAL: the fixture's note strings and whole-dollar allocations written by hand below;
// timestamps are compared only as identities READ from the raw folder bytes (JSON.parse of the file text, no ORBIT helper).
// Board helpers (baseGet, driveBaseOf, the kept slot's storage key ...) are only READ for observed values.
//
// The W1H block below is copied verbatim from /home/user/orbit-board/tools/export-audit/audit-import.mjs (blob fc3117a0,
// lines 3745-3813), the same block rec/L2/u13probe used; the probe body follows it.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(process.argv[2] || '.');
const outPath = resolve(process.argv[3] || 'u13codex-out.json');
const SCN = process.argv[4] || 'S1harness';
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
