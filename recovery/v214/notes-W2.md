# v2.14 W2 — a full import too big for browser storage goes into a new file (item 141 A, B, C, E; the room check; the `.base` records)

Builder W2, worktree `/home/user/orbit-wt/v214-w2`, branch `v214-w2`, from the slot commit `ea412ca`. The contract (§6) decides;
the map's `file-route` area is the design. **Stage 1 (build) status:** the board, all eight audit-import blocks and the audit-inject
block written and passing on this branch; every block fails on the slot commit; 51 mutations and 9 retargets written, each find
matching once (mcount 3271/3271), every mutant parses; audit-import whole passes; audit-inject whole passes; `boot-same` passes;
`tools/import-file.mjs` passes A–F in Chromium (D's leave prompt said as INT until W3) and fails on the slot board; `--gtk` run by
hand under Xvfb and passes. **Left for stage 2:** prove.py over `proofs-W2.json` (none proved yet); audit-recon, audit-board,
audit-other whole (recon was running at the end of stage 1, see Checks); the browser checks named under Checks.

## Reproduced on the slot commit (v2.13 behaviour), before building

Board: `git show ea412ca:prioritization-board-grid.html` (the slot is v2.13 plus inert seams).

- **Brad's alert, no file route** (`recovery/v214/proto/file-route-chromium.mjs`, paths pointed at this worktree, Chromium 153):
  a board built in 0.7 s (8,457,889 characters, a cost estimate padded past storage), imported into the program in 0.8 s:
  `alert: Nothing was imported from “ORBIT Live.html” — browser storage refused the cost estimates (QuotaExceededError).\n\nThis
  board is exactly as it was.` — Brad's exact text; storage byte-identical; `unsavedNow()` true after the refusal (item 140 c, W3's);
  **no "Write the imported board into a new file" offered — FAIL**.
- **E, the empty-board door** (`proto/file-route-shell-door.mjs`, jsdom): `IS_SHELL` true; Import one appropriation of a board
  holding O&M and Full Fund, storage refusing `prio27ff`: status `🧩 Loaded O&M, Full Fund — reopening…`, reloaded, `prio27om`
  stored, `prio27ff` absent — **the defect** (part of a board landed while saying it took all of it).
- **D** (same script; W1's, recorded only): Save into a remembered program file writes 0 times and downloads once ("💾 Saved —
  updated board downloaded…").

## What was built

All in `prioritization-board-grid.html`, as map.md › file-route › Functions and Design say, with the contract's C6, C12, C13,
C18–C23, C27–C30:

- **The note's key and the opening.** `var IMP_FILE_KEY='prio27impFile'+SIDE_SFX` right after `EXDB_KEY`. Above `let EXDB`:
  `var _impHand=null, _impHandSaid=false;` (C21: above `_impOpen`, which sets the latch) and `var _impOpen=(function(){…})()`:
  the import's own file (`PUB.impFile.n===m.n`) removes each marker key whose value still hashes (`sideHash`) to `m.h[key]`, and
  that key's `.base` (C19), names any that differ in `left`, removes the marker; any other page latches (`impHandLatch`). Reads
  nothing declared with let/const below it (`PUB` is a let above; `sideHash` is a function).
- **The hold (S2's bodies).** `impHandKey(key)` (the marker from storage at call time, else the latch; reading it latches, C21),
  `impHandRefuse(key, what)` (counted as not kept -- `fileMark` skipped for `_AP.key`, `fileStored(…, false)`; `DIAG.refused` why
  `'HandOverHold'`; `impHandMsg(what)` said once per page, never while `_lsAllRun`), `impHandOf`, `impHandLatch`, `impHandMsg`
  (design 11 verbatim, plus C21's sentence), `impHandClear` (design 11's confirm plus C22's paragraph; removes this browser's
  unchanged copies with their `.base`, names any changed, removes the marker and the latch). One `storage` listener latches on
  another tab's marker (C21).
- **`impFileHolds()` (S11's body):** true while `_impFile` is writing (`busy`), writing the as-it-was file (`wasBusy`), or holds a
  rescue not yet downloaded (both, or just the file imported when the build failed); never throws.
- **`savedHtmlOf(appns, cycDb, lists)`:** each of destDb, execDb, aceDb, rpDb, budDb and writer from `lists` when it has that own
  property, else the page's; `impFile` last, only when given. Check 9 holds every ordinary save to the slot commit's bytes.
- **fullImportText:** after each plan in W, its record `[key+'.base', '{"file":0,"folder":{},"dirty":true}', 'This browser’s record of
  the X plan', 'the record of the X plan']` (C6); `W.full={rep:rep}` just before `lsAll(W)` (the gate).
- **fullImportUndone:** in the back branch, first the hold's own refusal (`done.why==='HandOverHold'`: the alert, `impHandMsg`), then
  `if(W.full && done.at>=0) return impFileOffer(…)`. The not-back branch never offers it, and its mixed mark and its three lists
  leave every `.base` out (C19); `impMixedLift` ignores a `.base` key.
- **fullImportPreHtml(held, o):** `o.newest` takes storage's own plan when it is newer than the one on screen (the as-it-was file).
- **The file route** (after `fullImportRescue`, its own `// ==== v2.14 (item 141): THE FILE ROUTE` block): `_impFile`,
  `_impFileLast`, `impHref`, `impFileName`, `impFileId`, `impFileOwnKey`, `impFileMoved`, `impUnsavedList` (+ `impFileMem`,
  `impSrc0`), `impFileNeed`, `impFileOffer`, `impFileOpen`, `impFileShut`, `impFileRescued`, `impFileRescueBtns`, `impFileDraw`
  (+ `impFileDrawIn`), `impFileSkip`, `impFileClose`, `boardPubOf`, `impFileBuild`, `impFileMarkOf`, `impFileMarkWrite` (the marker
  and, where storage lacks it, the stamped writer key, through one `lsAll`, C13), `impFileClear`, `impFhPut`, `impFileWrite`,
  `impFileWriteTo`, `impFileNameStep`, `impFileCarryOn`, `impFileFinish`, `impFileRaced`, `impFileFailed`, `impFileRescue`,
  `impFileDownload`, `impFileSaveWas`, `impFileWasDl`, `impRoomSay`, `impPlanHasReqs`, `impShellEmpty`. Every sentence is the
  map's design text, verbatim; every name through `esc()`; every handler value through `jsa()`; the marker plain text only.
- **The marker is written straight after the verified read-back (C20)**, in `impFileWriteTo`, before the name-match pause and before
  any clear; `impFileWriteTo` re-checks storage and the counters after its last await (C29); `impFileCarryOn` re-checks both before
  Finish; Finish clears, retries the marker only if it was refused, then reopens when the handle put settles (or holds in memory,
  5(g), when the marker is refused twice).
- **importState E1/E2 (C18).** E1 after `fromBoard=true;`: `IS_SHELL && !(fullSt && fullSt.only) && impShellEmpty()` and a board
  from v1.80 on → `fullImportText`. E2: on the shell, everything from `importStores` to the shell branches' ends is captured
  (`_lsCapture=[]`, `impMemSnap`, `MS` kept); the shell branch's direct `setItem(_AP.key)` is now `lsSet`; each branch commits
  through `e2Commit` (one `lsAll`, each plan followed by its `.base` record, C6); refused → memory and MS put back, `syncSvc()`,
  `render()`, `fullImportUndone` (no `.full`: the alert), no reload; the "no requirement data" alerts put memory back too; a throw
  inside the read puts memory back and releases the capture (`let _e2` outside the try).
- **The box** `#impFilePanel` beside `#uiImpPanel`, no backdrop click (map Functions 18).
- **The opening chain:** `statKeep(_impRep+impRoomSay())`; `_impRep` returns the own-file report (`impOwnRep`) when storage holds
  no `prio27impRep`; after `destOwnSay`'s line, a held page says `impHandMsg('')` (kept unread); the own file reads `import|n` from
  `prio-fh`, adopts it as `FH` and `_fhPut(h)` only when `m.href===impHref()`, and deletes `import|n` in every case.
- **The guide:** `t-full`'s third paragraph replaced by design 18's text (+37 characters net; C11 allows +200).

## Decided in the build

- **"The board file's copy" of a list (step 1) is read from `SRC0`'s pubState, once** (`impSrc0`): `sideBootNote.file` is deleted
  by `sideBootCheck` as the opening ends, so the design's `sideBootNote.file[key].text` is not there to read after opening. For this
  page's own lists, a list storage holds is named when it differs from this page's copy (another tab's), or when `sideUnsaved()` and
  it differs from the file's copy. Another appropriation's cycles compare with `CYC_FILE[k]`, as designed.
- **C21's sentence ("This page stays held until it is closed…") is said in every held page**: every held page is latched, so it is
  true wherever the hold is.
- **The name-match pause offers the file imported as a rescue** (`R.rescue={inc}`): that file may now exist only in this page, so
  leaving asks until it is downloaded, and ✕ asks (the same confirm as a failure's).
- **With no save window, "💾 Save this board as it was…" downloads it** and says to tick Carry on once it is saved (a download
  cannot be read back).
- **`impFileDraw` and `impFileShut` never throw** (they run whenever the save window answers, a closed page included).
- **One more retarget than C27 counted:** `impmixed-lift-partial` -- C19 rewrote `impMixedLift`'s line to leave a `.base` out; the
  same defect, retargeted in place.
- **hostile.mjs is not changed:** the box's names are covered by audit-inject's W2-1 (every rendered state of the box, the hold's
  message and the own-file report, with planted markup), and nothing W2 adds is a field of the saved board but `impFile`, which
  `inboundCheck` leaves alone as an unknown field.

## Checks

Every block below is in audit-import's `v2.14 W2` slot unless named. **Each fails on the slot commit** (run with
`BOARD=<slot board>`: 15 failing checks across the eight audit-import blocks; W2-1 fails there with "impFileOffer is not defined").
On this branch every block passes alone (slim.py).

1. `v2.14 W2 — a full import browser storage cannot hold is written into a new file, read back whole, and opens as the import would
   have (item 141)` — (a)–(e), (i), (k) as the contract lists: the box in place of the alert, storage and memory byte-identical,
   Cancel, the pick inside the click (`inClickAt`), the cleared set from the fixture's literals with five byte-for-byte CONTROLS
   (C30e), the note (keys, says, hashes, no `<`, no record), the written file booted at the importing page's url and at another with
   one S7 `idb` store (C30g), its first Save asking nothing, seven failures after the pick (rescues byte for byte, `impFileHolds`,
   ✕ asks), the three refusals that must not offer it (importBoards, consTakeApply, the stuck case -- whose mark names no record and
   is lifted by a landing import), the name-match pause (the marker already stands; the tab closed there).
2. `v2.14 W2 — the file route keeps what browser storage held: …` — step 1 (named, Write disabled with its title, Carry on, the
   as-it-was file with another tab's newer O&M, its failure's download), changed since the refusal, the race in two parts (C29),
   the hold (h) in the importing page reopened as a board file and as the program, latched after the file opens (C21), an older tab
   latched by the `storage` event, a full import while held, a newer board over unsaved work while held, lifting by hand, the
   marker refused.
3. `v2.14 W2 — the file route where the browser cannot write a file: …` — another, older board's copies in this browser (a CONTROL
   shows R1 there); no save window and a policy refusal: one download equal to the window route's (clocks, writer and stamp aside),
   nothing cleared, the note; opened there, its own list, figures and data pack; the lift (C22).
4. `v2.14 W2 — the file route gives what the storage route gives, on files from v1.80, v1.83, v1.85, v1.87, v2.11 and a partial
   file (item 141)` — route A against route B for every appropriation: v14Figures, v14Plan, v14Cyc, v14Stores and the canonical
   saved state (159 checks). Reads `68b02e9`, `84dcaf9`, `77882d9`, `1589749`, `f76e327` from git (unshallow first).
5. `v2.14 W2 — on an empty board, Import one appropriation takes a board file whole or not at all (item 141 E)` — (a)–(e).
6. `v2.14 W2 — a full import that only just fits says browser storage is almost full (item 141)` — S7 `quota` (C30d), and a CONTROL.
7. `v2.14 W2 — after a full import that lands, the board reads unsaved, in no saved file (item 140)` — and a CONTROL record.
9. `v2.14 W2 — an ordinary save writes what the slot commit’s board writes, and carries no impFile (item 141)` — reads the slot's
   board by `ea412ca296e2d66b1bbbbc0780f336e8dd8d1691`.
8. audit-inject `W2-1 the file route’s box and note draw file names as text (impFileDraw, impHandMsg, impOwnRep)` (pushed to
   `INJ_EXPECT` first) — the box, the message line, the hold's message, the own-file report, the rescues, the pause and the busy
   state, each drawn and none live.

**Shared helpers** (top of the slot): `W214` — `fx()` (OLD's browser mirroring its file, with the five controls planted),
`refuse()` (one refused import; puts the save marks back as W3's `lsMarksBack` will, see below), `picker()` (both windows; the Save
window empties an existing file on pick, C14), `downloads()`, `press()`, `box()`, `marker()`, `routeA()`; and `w214Canon()`.

**`refuse()` stands in for W3's lsMarksBack** (contract C2, C9): on this branch alone a refused `lsAll` marks the page unsaved
(item 140 c), which would show step 1 for nothing; the helper puts `_saveGen`, `DIRTY`, `_sideGen`, `_dlOnly`, `_lsRefused` back as
lsMarksBack will. Once W3 is merged it changes nothing. `tools/import-file.mjs` ticks Carry on where step 1 shows, for the same
reason (`goWrite`).

**Existing checks moved, each with `// v2.14 W2:`** (audit-import):
- `w2Import`'s storage stand-in counts writes without the plans' records (`.base`), so a write's number names the same list it named
  before v2.14 (`'stuck', 8` is still the reprogramming log everywhere); in `'once'` a record is never the refused write. New mode
  `'stuckRecs'` (records refused with the lists).
- `v1.95 — a full import is all or nothing…`: the ten writes "each plan followed by its record"; the storage-full part finds the BAE
  list by key (`iB`).
- **E1's expectations (C15):** none moved yet -- every existing `importState` caller found boots a populated board or a held
  browser (audit-recon's run through `importState` is on boards with data). The whole-suite runs say for certain (below).

**Whole suites (stage 1):** audit-import whole, 8 GB: **ALL CHECKS PASSED** (the moved v1.95 W2 blocks and every E1 caller
included). audit-inject whole: all clear across 45 findings (W2-1 among them). `node tools/export-audit/boot-same.mjs`: every page,
source, save and error list identical either way. `npm run check`: all checks passed (52 boxes, `#impFilePanel` among them). Still to
run whole: audit-recon (E1's `importState` callers; a run was going when stage 1 ended), audit-board, audit-other.

**`tools/import-file.mjs`, stage 1:** A–F all pass on this branch (`ALL CHECKS PASSED`; D's "closing the tab asks" said as `INT`:
this board has no `memOnlyLeave` until W3); on the slot board A fails ("Brad's alert no longer appears" -- the alert is there; no
Write offered) and B then times out. **`--gtk`, by hand, 3 Nov 2026:** headed Chromium under `/usr/bin/Xvfb :97` (1280×900),
the real GTK save dialog; the moves measured on 2 Nov (proto `q141-verify-fix-0`): `Control_L+a`, the source's full path typed,
`Escape` (the completion list), a click on the dialog's Save at 1074,798 (screenshots kept with `--shots DIR`); `createWritable`
wrapped from page code to reject after the real pick. All six pass: the window was asked for with user activation; the source on
disk is 0 bytes after the pick (8,533,805 → 0: Chromium emptied it, the CONTROL); storage byte-identical, no note; no reopening;
"💾 the file you imported" downloads the source sha256 for sha256; "💾 the imported board (new version)" passes the import check
and carries its stamp. No "replace?" question appeared (the Return fallback did not run).

**Browser checks for stage 2:** `node tools/import-file.mjs` (A–F); `--gtk` by hand under Xvfb (`/usr/bin/Xvfb`); `npm run panels`
(impFilePanel added to SPECIAL), `npm run standards` (the box measured with step 1 and with both rescues; a `coverage` finding if
absent), `dialogs` (the box under the controller: named, inert behind, Esc to ✕), `leftmenu`, `menus`, `keys`. D's "leaving asks"
part is said as `INT` on a board without W3's `memOnlyLeave` and is a check once it is there.

## Mutations

51 new, `v214-w2-*`, in the slot of `tools/export-audit/mutate.mjs`, each find matching once, every mutant parsing
(`node tools/check.mjs <mutant>`: "main script parses", all 60): not-offered, ungated, mixed-offered, click-unchecked,
picker-after-await (C28: the picker called from a `.then`, no `await`), no-readback, readback-length, clear-before-write,
clears-others (removes every plan's `.base` and `.kept`), race-unchecked, reload-unmarked, rescue-missing, rescue-swapped,
lists-from-memory, drops-cycles, own-plan-dropped, unstamped, match-inverted, opens-clears-changed, opens-clears-nothing,
hold-lsset-off, hold-persist-off, hold-boot-off, hold-lift-unasked, hold-import-offers-file, as-it-was-skipped,
as-it-was-not-blocking, as-it-was-stale-screen, name-match-rushes, download-clears-now, download-unmarked, marker-raw (inject),
writer-unclaimed, adopt-any-page, shell-per-slot, shell-uncaptured, room-unsaid, import-base-unrecorded, hold-unlatched
(`impHandLatch` a no-op), hold-no-storage-event, marker-after-pause, lift-leaves-copies, holds-unsaid, rescue-close-unasked,
base-in-marker, mixed-marks-base, e1-takes-lists, e1-takes-one, e2-base-unrecorded, room-not-on-opening, race-page-unchecked.

**Retargets in place (9):** C27's eight on `savedHtmlOf`'s new line -- `handoff-copy-drops-store` (`rpDb:L('rpDb', RPDB), cycDb:cycDb,`),
`handoff-copy-drops-exec`, `handoff-copy-drops-ace`, `save-no-lt-escape` (the `impFile…}).replace(…)` tail), `cycle-file-drops-store`,
`bud-not-saved`, `dest-file-no-list`, `writer-not-in-file`; and `impmixed-lift-partial` (C19's `impMixedLift` line).

`recovery/v214/proofs-W2.json` (60 entries) names the block each should be caught by. **None proved yet** (stage 2). The nine
retargets' blocks are named from the suite (no earlier proof record names them): `handoff — out` (×3), `save → reopen`, `v1.85 — a
save keeps the other appropriations’ locked cycles`, `the BAE list — one list, every appropriation`, `v1.86 — the four lists become
one`, `v1.95 — one writer per board file`, `v1.95 — an import that lands whole lifts the hold`; a guess that SURVIVES there is
re-aimed at the block that does catch it (search the suites for the field), not dropped.

mcount after the last edit: `{"entries": 3271, "once": 3271}` (3220 + 51).

## For the integration

- **W1's `_fhPut` keyed by page:** check 1(d) reads the key `_fhPut` writes from the page (`fhPageKey()` when W1 is in, else
  `FNAME`), and asserts `'page|https://example.invalid/board.html'` whenever `fhPageKey` exists. W2 calls `_fhPut(h)` only.
- **W3's lsMarks/lsMarksBack:** `refuse()` in the W2 slot and `goWrite()` in `import-file.mjs` stand in until it is merged (above);
  INT-2 holds the merged behaviour. W3's `memOnlyLeave` reads `impFileHolds()` (S11) -- `import-file.mjs` D becomes a check then.
- **W4's `baseMarkDirty`:** the import's records are `{file:0, folder:{}, dirty:true}`, never with `blank` (C6, C17); a held page's
  own record write is not held (D17) -- check 2(h) asserts the note never names a record.
- **E1 and other suites:** run audit-recon whole after merging W2 (its `importState` callers); none needed moving here.
- **The guide:** +37 characters net in `t-full` (C11 allows +200).

## npm script to add

`fileimport`: `node tools/import-file.mjs`; `fileimport:gtk`: `node tools/import-file.mjs --gtk` (by hand). `verify:grid` gains
`fileimport` after `pmosave` (contract §11.2).

## Known gaps

- `import-file.mjs` C gives the adopted handle its stand-in methods back after the reload (a structured clone keeps only `name`);
  the real handle's methods are not in question there, only that the page took it.
- A page latched by the `storage` event says nothing until it next writes (the message is said on the first held write, and on
  every opening); it does not interrupt.
- `impUnsavedList`'s "the board file's copy" is the file this page opened (`SRC0`): after a file Save in this page, a list storage
  holds that equals the page's copy reads as saved only while `sideUnsaved()` is false.
