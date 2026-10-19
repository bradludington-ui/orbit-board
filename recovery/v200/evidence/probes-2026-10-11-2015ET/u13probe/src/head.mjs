// u13-probe.mjs -- U13: a bounded, READ-ONLY reproduction (no fix) of the shared-folder pull adopting a newer copy while a
// folder save is held at its write, and what that save then records. It changes nothing in the board or its tools.
//
//   usage: node u13-probe.mjs <copyRoot> <outJson> <scenario>     scenario: S1pull | S1tick | C1 | C2 | C3
//
// <copyRoot> is a cp -r copy of rec/L2/u1fix/before (board blob 4d273c06...). The board booted is
// <copyRoot>/prioritization-board-grid.html: BOARD is unset before boot.mjs is imported, and asserted after.
//
// EVERY EXPECTED VALUE IS LITERAL: the fixture's note strings and whole-dollar allocations, written by hand below, and
// timestamps compared only as identities READ from the raw folder bytes (JSON.parse of the file text, no ORBIT helper).
// Board helpers (baseGet, driveBaseOf, keptCopy's storage key ...) are only READ for observed values.
//
// The W1H block below is copied verbatim from /home/user/orbit-board/tools/export-audit/audit-import.mjs (blob fc3117a0,
// lines 3745-3813: boot/seed/wire/folder()/gate()/connect()/flags()/baseFile()); the probe body follows it.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(process.argv[2] || '.');
const outPath = resolve(process.argv[3] || 'u13-out.json');
const SCN = process.argv[4] || 'S1pull';
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
