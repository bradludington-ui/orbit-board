# v2.14 W2 — a full import too big for browser storage goes into a new file (item 141 A, B, C, E; the room check; the `.base` records)

Builder W2, worktree `/home/user/orbit-wt/v214-w2`, branch `v214-w2`, from the slot commit `ea412ca`. The contract (§6) decides;
the map's `file-route` area is the design. **Stage 1 (build) status:** the board, all eight audit-import blocks and the audit-inject
block written and passing on this branch; every block fails on the slot commit; 51 mutations and 9 retargets written, each find
matching once (mcount 3271/3271), every mutant parses; audit-import whole passes; audit-inject whole passes; `boot-same` passes;
`tools/import-file.mjs` passes A–F in Chromium (D's leave prompt said as INT until W3) and fails on the slot board; `--gtk` run by
hand under Xvfb and passes; audit-recon, audit-board and audit-other whole pass. **Stage 2 (prove and finish) status, 3 Nov
2026:** every one of the 60 mutations and retargets PROVED, CAUGHT against its own check on the final board and suites
(`proved-W2.jsonl`, 60 lines, 60 CAUGHT); two suite fixes the proofs called for (a write a mutant starts is let finish before its
board is closed); one retarget re-aimed at the blocks that state its defect directly; the browser checks run, with one fix each to
`dialogs` (the box had no way in) and to the board's CSS (1.4.11 on the box's rescue buttons); everything under **Stage 2 runs**.

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
- **Stage 2, one CSS rule** (after the v1.77 1.4.11 rule): `#impFileBody button.nb{border-color:var(--edge)}`. The box offers its two
  rescues through `impFileRescueBtns()`, the same `.nb.lnk` buttons the message line draws, and `.nb` dresses them with a `--line`
  edge (1.32–1.58:1 against 3:1): `npm run standards` reported five NEW 1.4.11 findings, one per theme, "seen 2x" (the two rescue
  buttons), and none once the rule was in. Scoped to the box, as `table.clingrid button.nb` is to the CLIN grid; no mutation find
  is on that line.

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
- **Stage 2: the rescue buttons keep the message line's markup** (one `impFileRescueBtns()` for the box and the message, so
  neither can lose a copy) **and take the controls' edge in the box only** (the CSS rule above) -- rather than a second markup for
  the box, which would have moved `v214-w2-rescue-missing`'s find.
- **Stage 2: `tools/dialogs-keyboard.mjs` opens the box by its switch** (`window.__impFileGo()`, stood up by `PRE`), because the
  box has no backdrop click to name its switch and no menu item opens it -- only a refused full import does. It is not on §6's
  "may touch" list; see For the integration.
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
- **E1's expectations (C15):** none needed moving -- audit-import and audit-recon pass whole with E1 in place (every existing
  `importState` caller boots a populated board, imports something other than a whole board file, or into a browser that holds one).

**Whole suites (stage 1):** audit-import whole, 8 GB: **ALL CHECKS PASSED** (the moved v1.95 W2 blocks and every E1 caller
included). audit-recon whole, 8 GB: **ALL CHECKS PASSED** (E1's `importState` callers among them: none needed moving).
audit-board whole, 8 GB, and audit-other whole, 4 GB: **ALL CHECKS PASSED**. audit-inject whole: all clear across 45 findings
(W2-1 among them). `node tools/export-audit/boot-same.mjs`: every page, source, save and error list identical either way.
`npm run check`: all checks passed (52 boxes, `#impFilePanel` among them).

**`tools/import-file.mjs`, stage 1:** A–F all pass on this branch (`ALL CHECKS PASSED`; D's "closing the tab asks" said as `INT`:
this board has no `memOnlyLeave` until W3); on the slot board A fails ("Brad's alert no longer appears" -- the alert is there; no
Write offered) and B then times out. **`--gtk`, by hand, 3 Nov 2026:** headed Chromium under `/usr/bin/Xvfb :97` (1280×900),
the real GTK save dialog; the moves measured on 2 Nov (proto `q141-verify-fix-0`): `Control_L+a`, the source's full path typed,
`Escape` (the completion list), a click on the dialog's Save at 1074,798 (screenshots kept with `--shots DIR`); `createWritable`
wrapped from page code to reject after the real pick. All six pass: the window was asked for with user activation; the source on
disk is 0 bytes after the pick (8,533,805 → 0: Chromium emptied it, the CONTROL); storage byte-identical, no note; no reopening;
"💾 the file you imported" downloads the source sha256 for sha256; "💾 the imported board (new version)" passes the import check
and carries its stamp. No "replace?" question appeared (the Return fallback did not run).

**Changed in stage 2** (all on this branch, none an expectation moved):
- audit-import, W2 slot: `W214.quiet()` and `W214.rel()`, every W2 block's `bootRelease` through `rel`, and a wait at the end of
  check 2's (g) "changed since" part (see Mutations: two proofs CRASHED without them). Clean board: every W2 block still passes
  alone and the suite passes whole.
- `tools/dialogs-keyboard.mjs` (`// v2.14 W2 (item 141)`, two places): the box is opened by its switch, a refused full import stood up
  by `PRE` with something unsaved so step 1 shows. Fails without it on this board: "impFilePanel: no way to open it found" (both
  passes); with it, the box is named, inert behind, keeps Tab, and Esc closes it to ✕ like every other box.
- The board: the 1.4.11 CSS rule (What was built). `npm run standards` without it: 5 NEW findings (exit 1); with it: none (exit 0).

**Stage 2 runs** (3 Nov 2026, UTC, on `/home/user/orbit-wt/v214-w2`; W1's and W3's builders ran their own suites beside these):

| Command | Started (about) | Took | Exit | Result |
|---|---|---|---|---|
| mkmut + `node tools/check.mjs <mutant>`, all 60 | 08:05 | 2 min 57 s | 0 | every mutant "main script parses" |
| `JOBS=1 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py recovery/v214/proofs-W2.json recovery/v214/proved-W2.jsonl` (run 1) | 08:08 | 14 min | 0 | 57 CAUGHT, 2 CRASHED, 1 NOT CLEAN (Mutations) |
| `node tools/panels-render.mjs` | 08:10 | 17 s | 0 | every panel opens; impFilePanel opens, no escaped entity, clips nothing, every control reached |
| `node tools/dialogs-keyboard.mjs` (before the fix) | 08:11 | 244 s | 1 | 2 problems: "impFilePanel: no way to open it found" (sliding over and docked) |
| `node tools/dialogs-keyboard.mjs` (after) | 08:17 | 245 s | 0 | every box takes the keyboard, keeps it, gives it back… -- 51 boxes, impFilePanel by its switch |
| prove.py run 2 (same command) | 08:24 | 15 min | 0 | 60 of 60 CAUGHT |
| `node tools/left-menu.mjs` | 08:25 | 48 s | 0 | Every action has one home on the left menu… |
| `node tools/menu-paths.mjs` | 08:26 | 5 s | 0 | Every menu path a message names is really in that menu |
| `node tools/keyboard-reach.mjs` | 08:26 | 92 s | 0 | The keyboard reaches … every one works |
| `node tools/pmo-save.mjs` | 08:28 | 45 s | 0 | A PMO copy saves its office’s own file… |
| `node tools/import-file.mjs` | 08:29 | 45 s | 0 | ALL CHECKS PASSED (D's leave prompt INT) |
| `node tools/standards-check.mjs` (before the CSS rule) | 08:30 | 70 s | 1 | 5 NEW 1.4.11 findings, `button.nb` in the box, one per theme |
| `node tools/standards-check.mjs` (after) | 08:38 | 62 s | 0 | CONFORMANCE HOLDS AGAINST THE BASELINE -- 0 findings, nothing new; "the run measured what it must" |
| `npm run check` | 08:39 | 3 s | 0 | all checks passed |
| prove.py run 3 (same command) | 08:39 | 17 min | 0 | 60 of 60 CAUGHT |
| `node tools/export-audit/boot-same.mjs` (4 GB) | 08:41 | 15 s | 0 | every page, source, save and error list is identical either way |
| `python3 -I -B recovery/v200/bin/mcount.py tools/export-audit/mutate.mjs prioritization-board-grid.html` | 08:40 | 5 s | 0 | `{"entries": 3271, "once": 3271, "missing": [], "multiple": [], "unparsed": []}` |
| prove.py, `cycle-file-drops-store` alone, re-aimed at audit-board | 08:57 | under 1 min | 0 | CAUGHT, 12 failing checks, no throw |
| `node tools/export-audit/audit-import.mjs` whole (8 GB) | 08:58 | 21 min | 0 | ALL CHECKS PASSED |
| `node tools/panels-render.mjs` (final board) | 09:05 | 19 s | 0 | as above |
| `node tools/import-file.mjs` (final board) | 09:05 | 50 s | 0 | ALL CHECKS PASSED, A–F (D's leave prompt INT) |
| `node tools/dialogs-keyboard.mjs` (final board) | 09:06 | 251 s | 0 | as above, 51 boxes |
| `node tools/export-audit/audit-inject.mjs` whole (4 GB) | 09:19 | 12 s | 0 | ALL CHECKS PASSED; all clear across 45 findings and 4 text-fidelity guards (W2-1 among them) |

Not re-run in stage 2: audit-recon, audit-board and audit-other whole (untouched since stage 1's whole passes; the board changed by
one CSS rule since, which no jsdom check reads), and `--gtk` (stage 1, by hand). D's "closing the tab asks" stays INT until W3's
`memOnlyLeave` is merged.

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

`recovery/v214/proofs-W2.json` (60 entries) names the block each is caught by; `recovery/v214/proved-W2.jsonl` holds the verdicts.
**All 60 PROVED: CAUGHT, each against its own block, on the final board and suites** (stage 2, 3 Nov 2026). How:

- **Every mutant built and parsed first** (`mkmut.py`, then `node tools/check.mjs <mutant>`): all 60 "main script parses" (2 min 57 s).
- **Run 1** (`JOBS=1 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py recovery/v214/proofs-W2.json recovery/v214/proved-W2.jsonl`,
  08:08–08:22 UTC): 57 CAUGHT, 2 CRASHED, 1 no verdict.
  - `cycle-file-drops-store` NOT CLEAN: its named block (`v1.85 — a save keeps the other appropriations’ locked cycles`) reads
    `V185W`, which another block writes. Re-aimed (below).
  - `v214-w2-click-unchecked` and `v214-w2-as-it-was-skipped` CRASHED, no banner. Reproduced by hand: each mutant starts a write the
    clean board refuses, the block's checks fail as they should, and the write's continuation (`impFileRaced` → `statKeep` →
    `document`) then ran after `bootRelease` had closed its board -- an unhandled rejection outside every block, which ends the suite
    before its banner. **Not a weak check: a check whose failure the suite could not report.** Fixed in the W2 slot (no expectation
    changed): `W214.picker()` records every board it gives a save window (`WROTE`); `W214.quiet()` waits until each open one is idle
    (`!_impFile.busy && !_impFile.wasBusy`, at most 2,000 turns) and `W214.rel(mk, keep)` is `bootRelease` after it; all 23
    `bootRelease` calls in the W2 slot are `await W214.rel(...)`; and (g)'s "changed since" part waits for a write before its board
    goes. With the fix, `click-unchecked` fails 1 check ("(g) changed since": picks 2, the box open, `_impFile` kept) and
    `as-it-was-skipped` 2 ("(g) step 1": nothing named, Write enabled, a save window opened) and then its block throws.
- **Run 2** (08:24–08:39 UTC), every id again on the fixed suite, the retarget re-aimed at its writer block too: **60 of 60 CAUGHT**.
- **The board then changed** (the 1.4.11 CSS rule, stage 2), so **run 3** (08:39–08:56 UTC), every id again: **60 of 60 CAUGHT**.
  Its `cycle-file-drops-store` was caught only by its writer block's `frames` check, with the named block throwing on the null
  `V185W`; so it was **re-aimed at audit-board**, at the blocks that state the defect directly, and proved again alone (08:57 UTC):
  CAUGHT, 12 failing checks, no throw -- `PPBE cycles — the lock is the window, frozen` ("the locked cycles come back from a saved
  file, byte for byte") and `PPBE cycles — a PMO copy carries the reference projection only` ("the copy packs one appropriation’s
  cycle store"). Both pass on the clean board.
- **Catches that also threw** (prove.py marks them): `not-offered` (3 checks of (a) fail, then the block throws pressing a button the
  mutant never drew), `as-it-was-skipped` (2, then no checkbox to tick), `as-it-was-not-blocking` (3 of (g) step 1), `download-unmarked`
  (2 of "no save window"), `rescue-close-unasked` (2 of (e)). Each was caught by a check before its block threw.
- `proved-W2.jsonl` is run 3 with `cycle-file-drops-store`'s re-aimed proof in place of its first; runs 1 and 2 are kept in the
  session's scratchpad only (`proved-W2.run1.jsonl`, `proved-W2.run2.jsonl`).

The retargets' blocks as proved: `=handoff — out` (×3), `=save → reopen`, `the BAE list — one list, every appropriation`, `v1.86 — the
four lists become one`, `v1.95 — one writer per board file`, `v1.95 — an import that lands whole lifts the hold` (audit-import), and
`cycle-file-drops-store` on audit-board as above.

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
- **`tools/dialogs-keyboard.mjs` was changed (stage 2), outside §6's "may touch" list:** two lines and a `PRE` entry so it can open
  `#impFilePanel` by its switch (`window.__impFileGo()`); without them it fails "impFilePanel: no way to open it found" (measured,
  both passes). Any other workstream adding a box with no backdrop click needs the same; merge the `PRE` objects by hand.
- **`#impFileBody button.nb{border-color:var(--edge)}`** (stage 2, beside the v1.77 1.4.11 rule). **Not fixed, and not W2's:** every
  other `.nb.lnk` button in the message line (`lift the hold…`, `put it back`, `⬇ Save a copy`, `✍ Take the pen…`, the v1.95 full
  import rescues) is dressed by the same `.nb` rule with a `--line` edge; `npm run standards` reports none of them, so its drive does
  not appear to measure a message carrying one (not verified further). Either give `:where(button.nb.lnk)` the edge (or no edge) for the whole board, or have the standards drive draw such a message.
- **`cycle-file-drops-store` is proved on audit-board**, not on the v1.85 import block C27's list implies: that block reads `V185W`,
  which its writer block builds through the very saved file the mutation strips, so on the mutant the writer throws and the named
  block only throws after it. §11.5's merged proof should use `board / PPBE cycles — the lock is the window, frozen; PPBE cycles —
  a PMO copy carries the reference projection only`.
- **`W214.quiet()` / `W214.rel()` in the W2 slot**: every W2 block lets a write it began finish before closing its boards. A later
  slot that installs `W214.picker()` on a board and closes it with a plain `bootRelease` loses that, and a mutant that writes where the
  board refuses can end the suite before its banner (CRASHED). INT-5, INT-6 and INT-10 should close their boards with `W214.rel`.

## npm script to add

`fileimport`: `node tools/import-file.mjs`; `fileimport:gtk`: `node tools/import-file.mjs --gtk` (by hand). `verify:grid` gains
`fileimport` after `pmosave` (contract §11.2).

## Known gaps

- The five catches that also threw (above): each is a check failing first; a reviewer who wants every W2 block to fail without
  throwing on every mutant would guard the presses that assume a button the clean board draws.
- `import-file.mjs` C gives the adopted handle its stand-in methods back after the reload (a structured clone keeps only `name`);
  the real handle's methods are not in question there, only that the page took it.
- A page latched by the `storage` event says nothing until it next writes (the message is said on the first held write, and on
  every opening); it does not interrupt.
- `impUnsavedList`'s "the board file's copy" is the file this page opened (`SRC0`): after a file Save in this page, a list storage
  holds that equals the page's copy reads as saved only while `sideUnsaved()` is false.
