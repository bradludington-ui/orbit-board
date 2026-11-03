# v2.14 INT-A — the lead's integration checks INT-1 to INT-6 (contract §11.3)

Written in the worktree `/home/user/orbit-wt/v214-inta`, branch `v214-inta`, from `5d5383c` (W1–W4 merged, the lead's fixes).
Checks only: no line of the board changed. Every expectation is a literal from the fixture or worked out in the block from it.

## The checks

audit-import, INT-A sub-slot (helpers in `INTA`: the save marks, `memOnlyNow` read as text, the leave prompt, this browser's
record, lsSet's warning count, a generation reader, and `until`, a wait by the clock). audit-board, INT-A sub-slot (INT-4, with
W3's `w3s*` helpers). Each block fails on the slot commit `ea412ca` (`git show ea412ca:prioritization-board-grid.html`), slimmed
to the INT blocks; counts are failing checks, a block that throws counting one:

| Check | Slot board | What fails there |
|---|---|---|
| INT-1 `v2.14 INT — after a full import that lands, the board reads unsaved, takes no other file’s save as its own, and its first Save writes the program it ran in without a question (items 140, 141)` | 7 | opening takes the other file's save (`LASTKNOWN` 1700000000123); the import leaves the old records; reopened, `LASTKNOWN` is the other file's; the edit records it; the Save goes through the Save window into another file |
| INT-2 `v2.14 INT — a refused full import leaves the board as saved as it was and offers the new file (items 140 c, 141)` | 5 | an alert; the board reads "Unsaved changes", `prio27acedb` refused; no box (then the block throws: no `impUnsavedList`) |
| INT-3 `v2.14 INT — a page with no saved board records its work as blank, so an older board asks before writing it over its file and a v2.14 board file keeps it aside (item 140)` | 9 | (a) takes the v2.13 file's save, not blank; the record names that file; (b) the same; (c) the program not written; (d) the v2.13 board writes over its file with no HOLD ON; (e) the blank work opens over the v2.14 file |
| INT-4 (audit-board) `v2.14 INT — a tab held by the hand-over has its change on screen only, and leaving it asks (item 141 C, F)` | 8 | the edit goes into browser storage, nothing on screen only, leaving asks nothing (a)–(d); then the block throws (no `impHandClear`) |
| INT-5 `v2.14 INT — a full import is refused while a change is on screen only, before the file route is offered (item 141)` | 6 | the change is not on screen only; the import runs (13 writes), is refused by storage and alerts; no box after Save |
| INT-6 `v2.14 INT — the import’s new file saves in place twice, asking nothing (items 140, 141)` | 3 | no file route (two checks), then the block throws (nothing written to open) |

Every CONTROL part passes on both boards: INT-1's setup, INT-2's fixture ("reads Saved"), INT-3's setup (opening the v2.13 file
records its save and stores no plan), INT-3 (a)'s storage line and (d)'s "v2.13 opens the newer copy", INT-4's "no note".

What each holds together:
- **INT-1**: the program, in a browser whose records name another file's save and hold no plan (case 3: `LASTKNOWN` 0); a full
  import that lands (`w2Import`, `fullImportText`) records each plan `{file:0, folder:{}, dirty:true}`, and a plan it did not write
  keeps its record (CONTROL); reopened on storage it shows the import, reads "Unsaved changes", `LASTKNOWN` 0; an edit is recorded in
  no saved file and **not** as blank work (`pageBlankNow()` false: the board came from a file, so a board file opened later must not
  keep it aside as stray work); the first 💾 Save opens the Open window, the program's own file is read, checked, then
  `query`/`request`, written once, no question (every question answered Cancel, so one asked would also have stopped the write), no
  download; the file holds the import in O&M and Full Fund and the edit, this browser as writer; Saved, the record names the file
  clean, the page remembers it under `page|…`.
- **INT-2**: OLD's board saved in place (reads Saved), the full import refused at the cost estimates (write 7) with **no** stand-in
  for W3's restore (W2's `W214.refuse()` puts the marks back by hand; this does not): every key back, the message line's exact
  text, the marks, record and save state equal to before, nothing on screen only, leaving asks nothing, no new "could not be kept in
  browser storage" in `STAT_LOG`; the box open with nothing named unsaved, no step 1, Write enabled; Write opens the save window
  inside the click (cancelled here).
- **INT-3**: the browser opened a **v2.13 board file** (built by `c863dc2`'s program, its writer this browser): v2.13's opening
  records `{file:F13, dirty:false}` and stores no plan (v2.09's third review) — the realistic origin of "a record and no plan". (a) a
  v2.14 program page there: `LASTKNOWN` 0, `pageBlankNow()` true; `switchYear` records `{file:0, dirty:true, blank:true}`; the blank
  plan is newer than both files and has no data pack (CONTROL). (b) reopened: storage's blank work on screen, still blank; an edit
  keeps the mark. (c) its first Save writes the program it ran in through the Open window, asking nothing; an edit then records the
  written file, `blank:false`. (d) the v2.13 board on (a)'s storage opens storage's newer work (CONTROL) and its Save asks HOLD ON
  before writing over its own file; Cancel writes nothing. (e) a v2.14 board file, older than the blank work, on (a)'s storage:
  opens its own requirements and note, keeps the blank work (its new year) aside, `LASTKNOWN===PUB_FILE_TS`, recorded clean.
- **INT-4**: a note another tab's file route wrote, stated from W2_KEYS' nine lists and W2_SAY's names. (a) a tab opened while it
  stands: an edit stays on screen, not in storage, counted as `HandOverHold`; `memOnlyNow()` true and `beforeunload` cancelled; the
  message line names the file and says the page stays held; `#appnSel` driven to FULL FUND reads O&M again and says why. (b) 💾 Save
  into its own file ends it. (c) the execution data written after: held, on screen only again. (d) the note removed (the file
  opened elsewhere): the next edit still held (the latch). (e) lifting the hold (asked, OK): the list and the next edit go into
  storage, nothing on screen only. (f) a tab open before the note: held from the `storage` event.
- **INT-5**: a change storage refuses (only this appropriation's plan key refused): on screen only, leaving asks; the full import
  (storage would refuse the cost estimates) is refused by the guard **before any write is even tried** (`writes` 0), nothing
  alerted or reopened, storage byte for byte, the exact sentence naming Save, no box, no save window. Then 💾 Save into the file ends
  "on screen only", and the same import is offered the new file — so it was the guard that stopped it.
- **INT-6**: the file route run end to end with the importing page's handle store (S7 `idb`): (1) the written file opened where the
  import ran adopts the handle (`page|…`, the `import|n` entry gone), shows the import, and two Saves write it with no window and no
  question; the file holds the import, the edit, no `impFile` stamp; Saved, recorded clean. (2) a copy opened at another address
  takes no handle (a planted `import|n` is let go), the first Save goes through the Open window (read, query, request, write), the
  second writes with no window, no question either time, and the page remembers that file.

## Mutants each check catches (built with `mkmut.py`, each parsing; run on the INT blocks, slimmed)

| Mutant | Caught by (failing checks) |
|---|---|
| `v214-w2-import-base-unrecorded` | INT-1 (3) |
| `v214-w1-boot-lastknown-inherited` | INT-1, INT-3 (8) |
| `v214-w1-null-writer-throws` | INT-1, INT-3 (7) |
| `v214-w1-program-not-fresh` | INT-1, INT-3 (7) |
| `v214-w1-save-window-first` | INT-1, INT-3, INT-6 (7) |
| `v214-w3-marks-not-restored` | INT-2, INT-6 (7) |
| `v214-w3-marks-dirty-kept` | INT-2, INT-6 (6) |
| `v214-w3-import-says-save` | INT-2 (1) |
| `v214-w2-not-offered` | INT-2, INT-5, INT-6 (6) |
| `v214-w1-blank-never` | INT-3 (6) |
| `v214-w1-blank-not-carried` | INT-3 (2) |
| `v214-w1-blank-after-save` | INT-3 (1) |
| `v214-w4-base-blank-sticky` | INT-3 (6) |
| `v214-w4-base-blank-ignored` | INT-3 (5) |
| `v214-w1-stray-opens` | INT-3 (2) |
| `v214-w3-import-full-unguarded` | INT-5 (3) |
| `v214-w3-memonly-persist-ignored` | INT-5 (4); INT-4 (5) |
| `v214-w2-writer-unclaimed` | INT-6 (6) |
| `v214-w2-adopt-any-page` | INT-6 (3) |
| `v214-w2-unstamped` | INT-6 (6) |
| `v214-w2-hold-persist-off` | INT-4 (6) |
| `v214-w3-beforeunload-off` | INT-4 (4) |
| `v214-w2-hold-lsset-off` | INT-4 (1) |
| `v214-w3-memonly-side-ignored` | INT-4 (1) |
| `v214-w2-hold-unlatched` | INT-4 (2) |
| `v214-w2-hold-no-storage-event` | INT-4 (1) |
| `v214-w3-switch-unguarded` | INT-4 (3) |

W1's `blank-*` and W4's `base-blank-*` (§11.5's "re-proved here") are all caught by INT-3.

## Mutations

**One new**, in `mutate.mjs`'s INT-A sub-slot: `v214-int-blank-any-copy` — the opening's second blank clause keeps the clause and
drops its condition (`_bootOwnRead && !_bootFile) _pageBlank=true;`): a board reopened over any copy in browser storage reads as
blank work. A landed full import reopened in the program then records its first edit `blank:true`, and a board file opened later
keeps the import aside as stray work (C17 from the other side). `v214-w1-blank-not-carried` reaches the same line but removes the
whole clause; nothing tested that its condition is needed. Run on W1's five blocks, W2's check 7 and W4's two-tabs block: ALL CHECKS
PASSED (none catches it). INT-1 does ("an edit": `blank:true`, `pageBlankNow()` true). The mutant parses; mcount
`{"entries": 3383, "once": 3383}` (3382 + 1). `recovery/v214/proofs-INTA.json`, proved with
`JOBS=1 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py recovery/v214/proofs-INTA.json recovery/v214/proved-INTA.jsonl`: the
block clean first, then **CAUGHT**, 1 failing check, `threw` 0.

## savetarget E

`npm run savetarget` on this board (E runs by itself: it finds `baseMarkDirty`), 34 s, exit 0, every section passing:

```
E · (INT) a blank tab’s change, then the old board’s Save in the same browser: asked, and not written when cancelled
  ok   E · the old board asks (HOLD ON) before writing over its file
  ok   E · cancelled, nothing is written
all save-target checks passed
```

On the slot board with `--int`: `FAIL E · the old board asks (HOLD ON) …` (the v2.12 board asked only "No writer is recorded…")
and `FAIL E · cancelled, nothing is written   written: 2946378 characters`; 14 failing checks in all, as W1 recorded.

## Decided here

- **Waits by the clock, not by loop turns.** `W214.settle()` waits at most 400 `setImmediate` turns. With S7's `idb` installed on
  the importing page, the file route's reopen waits for the handle store's stand-in, which answers through several `setTimeout(0)`
  hops; on this loaded box INT-6's "the page went to reopen" then failed under three unrelated mutants (`stray-opens`,
  `base-blank-sticky`, `null-writer-throws`) and passed on the clean board — a timing verdict, not a catch. INT-A waits with
  `INTA.until` (polls every 10 ms, up to 8 s) for everything that crosses the handle store; re-run, those three no longer touch INT-6.
  W2's own blocks give the importing page no `idb`, so their reopen is immediate; W2 check 1 (d) does wait on the stand-in
  (`settle(B1, () => !store.has('import|'+n))`) with the tick count and has passed every run — **for the lead**: it is the same
  shape, should it ever flake.
- **INT-3's "record and no plan" is made by opening a board file**, not planted: v2.13's opening of a board file writes the record
  and no plan (asserted as a CONTROL), which is exactly what case 3 meets. The v2.13 file is built by `c863dc2`'s own program.
- **INT-3 (d)'s CONTROL reads the year and the file's note**, not `S.order`: on v2.13, storage's newer blank plan opens over the
  file's data pack (storage's plan carries none), so `S.order` reads the file's requirements under storage's plan — R1's mix in the
  other direction. v2.14's stray rule keeps such work aside instead (INT-3 (e)); the HOLD ON in (d) is what stops v2.13 writing it.
- **INT-4's CONTROL reads "not on screen only" as `memOnlyNow() !== 'true'`**, so it passes on the slot board (which has no
  `memOnlyNow`); every other INT-4 part fails there.
- **INT-4's status-line check reads either form of the hold's message.** In the suite the line held the opening's form (no
  "… is held." prefix); in a lone script the first held write's form replaced it. Both name the file and say the page stays held.
- **INT-5's after-Save part is not a CONTROL**: it asserts W3's end of "on screen only" and W2's box, and fails on the slot board.
- **INT-1 and INT-2/5/6 import through `fullImportText`** (`w2Import`), as W2's and W3's blocks do, not through the file input.

## Runs (3 Nov 2026, this worktree, one heavy run at a time; another agent's worktree on the same 4 cores)

| Command | Time | Exit | Result |
|---|---|---|---|
| the five INT-A import blocks, slimmed, this board | 14 s | 0 | ALL CHECKS PASSED |
| the same, `BOARD=` slot board | ~15 s | 1 | 30 FAILING CHECK(S) (7, 5, 9, 6, 3) |
| INT-4, slimmed, this board / slot board | ~10 s each | 0 / 1 | ALL CHECKS PASSED / 8 FAILING CHECK(S) |
| 27 mutants above, on the INT blocks | ~8 min | 1 each | every one caught (table) |
| `prove.py` on `v214-int-blank-any-copy` | 11 s | 0 | clean, then CAUGHT |
| `mcount` | <1 s | 0 | 3383 entries, 3383 once |
| `npm run check` | 3 s | 0 | all checks passed |
| `node tools/export-audit/boot-same.mjs` | 9 s | 0 | identical either way |
| `npm run savetarget` | 34 s | 0 | all save-target checks passed, E included |
| `node tools/save-target.mjs --board <slot> --int` | ~30 s | 1 | 14 FAILING CHECK(S), E among them |
| `node tools/export-audit/audit-board.mjs` whole, 8 GB | 361 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-import.mjs` whole, 8 GB | 1318 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-inject.mjs` whole, 4 GB | 10 s | 0 | ALL CHECKS PASSED (45 findings, 4 text-fidelity guards) |
| `mcount`, after the last edit | <1 s | 0 | 3383 entries, 3383 once |

Not run here (the lead's §11.4–11.6): the other jsdom suites whole (other, recon, audit, hostile, ui, legacy: no line of them or of
the board changed), the browser checks other than `savetarget`, `validate:nightly`. No sweep, `npm run mutate` or `validate:math`.
