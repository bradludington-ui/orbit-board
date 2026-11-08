# v2.14 — the integration (the lead's record)

Contract §11. Each workstream's own record is `notes-W1.md` … `notes-W4.md`, the integration checks' `notes-INTA.md` and
`notes-INTB.md`. This file is what the lead did between them, and what was run on the integrated tree.

## Merges (3 Nov 2026)

- Order W3, W4, W1, W2 (§11.1). W3 and W4 merged clean (`efe7676`, `c0452ba`); their blocks, slimmed, and audit-inject whole passed
  on the merged board (audit-other 2 s, audit-board 20 s, audit-import 72 s).
- W1 merged clean (`5de31d7`). W2 (`3a8c51e`) had one conflict, at `impFileHolds` and the head of `lsSet`: W2's body of
  `impFileHolds` and its `storage` listener, then W3's comment and `lsSet(key, val, what, o)`. mcount 3384, all once; `npm run check`.
- INT-B (`afe7a7f`) and INT-A (`9948e7b`) were written by two agents in worktrees off `5d5383c`, each in its own half of the
  integration slots, and merged clean. mcount 3385, all once.

## The lead's fixes (`93b9cf7`, `5d5383c`)

- **cycApplyAll no longer erases a refusal the page held before the call** (W3's measured finding, notes-W3 › For the integration):
  `if(res.back){ _sideGen=g0; W.forEach(… delete _lsRefused[w[0]] …) }` → `if(res.back) _sideGen=g0;`. lsAll's put-back has already
  restored every mark (`lsMarksBack`); the delete removed a refusal recorded before the call, so a package storage had refused stayed
  on screen only and leaving the page stopped asking. INT-11 holds it; `v214-int-cyc-erases-refusal` puts the delete back.
- Two v2.13 mutations retired as obsolete, with a comment where each stood: `v213-rv-refused-reads-unsaved` (its line is gone) and
  `v213-136-refusal-reads-unsaved` (its line now only resets `_sideGen`, which `lsMarksBack` restored first: removing it changes
  nothing). The defect both guarded is held by `v214-w3-marks-side-kept` through W3's check 5.
- package.json: `savetarget`, `fileimport`, `fileimport:gtk`, `storagefull`; `verify:grid` runs `savetarget` and `fileimport`
  after `pmosave`, and `storagefull` last.
- tools/import-file.mjs: D's leave prompt is a check (W3's `memOnlyLeave` is in), and Write checks that a refused import leaves
  no step 1 for nothing (W3's `lsMarksBack` is in) -- both were W2's stand-ins until the merge.
- `W214.settle` (audit-import's W2 slot) waits by the clock, 8 s, polling every millisecond: 400 `setImmediate` turns can pass
  inside one millisecond, and the IndexedDB stand-in answers through timer hops, so under load a wait for the handle store could
  give up before it answered (INT-A saw it under three unrelated mutants). W2's eight blocks: 62 s, all pass.
- W2's "the file route gives what the storage route gives" now also imports files saved by **v2.12** (`fe0c83d`; Brad, 3 Nov: "My
  current Live version is 2.12") and **v2.13** (`c863dc2`): 28 checks each, all pass (215 in the block).

## C16: the older blocks that save over a stand-in file

The lead's sweep (contract C16): audit-import whole on a board whose (b) question always answers Cancel. Every block that fails
there meets the question. Apart from W1's own (item 140 b and D), four older parts meet it:

| Block, part | What the question names |
|---|---|
| v1.95 — after an import that cannot be put back … / allow saving again and 💾 Save writes the board file | Locked PPBE cycles: O&M POM27, Full Fund POM27 |
| v2.00 (U3) — a Save asked for during the mixed-import hold … (three parts: the board file's Save, 💾 Save, Take the pen, each "asked for again now saving is allowed, Save writes") | Locked PPBE cycle: Full Fund POM27 |

Each is a Save after an import that could not be put back: the board on screen is the mix, and the file still holds the locked
cycles the mix does not carry. The question is right there -- it names what that Save would remove -- and the harness's
`confirm` answers OK, so each part goes on to write as it asserts. **No fixture was changed**: changing them would test less.
(The four "never ran" lines in that run came from merging INT-B into the suite while it ran; the self-check reads its own source at
the end.)

## Runs on the integrated tree (`d53a72f`, board identical to `5d5383c`)

| Run | Result |
|---|---|
| browser checks, one by one (on `5d5383c`) | all pass but layout's carried D ×8; savetarget E runs and passes; standards: 0 findings, nothing new |
| boot-same | identical either way |
| audit, audit-inject, legacy-fsrc, audit-other, audit-hostile, audit-ui | ALL CHECKS PASSED (7, 10, 2, 133, 54, 68 s) |
| audit-board, audit-recon, audit-import (8 GB) | ALL CHECKS PASSED (343, 970, 1379 s) |
| coverage:money | 27/27 surfaces, 0 gaps |
| money-map --check | 322 cells: 119 proven, 202 n/a, 1 open (v2.04's); current |
| defects | 15 known, guarded by 47 mutations |
| trace | every link holds |
| fuzz | seeds 494226001 and 829989031: nothing lost |
| verify:file --selftest | passed |
