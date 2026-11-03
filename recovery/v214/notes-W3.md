# v2.14 W3 — browser storage refused or full (item 141 F, G; item 140 c)

Builder W3, worktree `/home/user/orbit-wt/v214-w3`, branch `v214-w3`, from the slot commit
`ea412ca296e2d66b1bbbbc0780f336e8dd8d1691`. Contract §7 decides; map.md › storage-full and save-target (c).
Commits: `60915c5` (board, checks, mutations, proofs list), `b9f8bd1` (`tools/storage-full.mjs`), `5e742e8` (notes),
`837f1ae` (S3's string split for `npm run menus`), and the notes and proofs commit after.

## Reproduced on the slot commit (v2.13 behaviour), before any build

The map's probes (`recovery/v214/proto/storage-full-probe*.mjs`, `save-target-c-refused-import.mjs`), copied to the scratch
folder with their `boot.mjs` import pointed at this worktree, run with `BOARD=<slot board>` (the slot's board is
`git show ea412ca:prioritization-board-grid.html`). jsdom, a counted quota stand-in.

- **probe (A, B, B2, B3, W, G):**
  - A — an edit storage refuses: `_persistFail` true, `DIRTY` true, `DIAG.refused` **`[]`**, `memOnlyNow` undefined, Save
    diagnostics "Writes refused: none this session"; a cancelable `beforeunload` is **not** prevented.
  - B — `switchAppn('FULL FUND')` with that edit on screen only: **navigated** (the edit gone on reopen); `cycGoAppn('ff')`:
    **navigated** too.
  - B3 — room for `prio27appn` but not the edit: navigated, `prio27appn` written "FULL FUND".
  - B2 — a clean board, storage refusing `prio27appn`: **navigated**, the refusal **uncounted** (`DIAG.refused.length` 0).
  - W — writer key and editor name with storage refusing them: `writerKey()` differs call to call, `writerFp()` differs; the
    name asked **6 times** for 3 edits, stamped **"unknown"**.
  - G — Save diagnostics: only "Browser storage: 4 entries…" and "Writes refused"; no by-kind lines.
- **probe2 (item 140 c's shape):** a refused, fully put-back `lsAll` → `back:true` yet `unsavedNow()` **true**,
  `_lsRefused` names `prio27acedb`, `_sideGen` moved.
- **probe3 (two Saves, storage full):** the first writes ("Saved in place by unknown"); the second is **refused** "⛔ Not
  saved. unknown holds the pen for this board file"; `uiPenOther()` → **"unknown"** (this browser's own pen).
- **probe6:** `_sideBootGen`/`memOnlyNow` undefined (throws); Clear this computer's question reads the ordinary "UNSAVED
  CHANGES" text; after a downloaded copy, `switchAppn` **asks nothing** and navigates on Cancel and on OK; Save diagnostics
  has no "Storage by kind" block.
- **save-target-c-refused-import (item 140 c):** before the refused full import `DIRTY` false, "not saved to a file yet";
  after it `DIRTY` **true**, `_sideGen` 1→5, `_lsRefused` `['prio27acedb']`, save state **"Unsaved changes"**, and
  STAT_LOG holds an UNREAD "⚠ The cost estimates could not be kept in browser storage … Use 💾 Save to write it into the
  file" beside the "⛔ Nothing was imported" line.
- **Chromium** (`tools/storage-full.mjs --board <slot board>`, which re-expresses `storage-full-hazards*.mjs` A/B and
  `switchloss.mjs`): 16 failing checks — A no beforeunload dialog and the page closed; B a load within 5 s, the box on
  FULL FUND, the note gone; B2 the page reloaded on O&M and the refusal uncounted; W the second Save refused "unknown holds the
  pen", the name asked 9 times.

The same probes on this branch's board: every one reads as the design says (A counted "O&M board data — QuotaExceededError",
beforeunload prevented, no navigation on switch or Go to, writer key stable, the name asked once and stamped BL, the
put-back `lsAll` leaves nothing unsaved, the refused import leaves "not saved to a file yet" and no "could not be kept" line).

## What was built

All in `prioritization-board-grid.html`, each with a `// v2.14 W3` comment saying what was measured and why.

- **`lsSet(key, val, what, o)`** — `o.quiet`: `if(o && o.quiet) return false;` directly after the `DIAG.refused.push` line
  (the push, `fileMark` and `setItem` lines untouched); lsSet's warning `setStat` only `if(!_lsAllRun)`.
- **`lsMarks()` / `lsMarksBack(m)`** (new, beside lsAll) — `{gen:_saveGen, dirty:DIRTY, dl:_dlOnly, side:_sideGen,
  ref:copy of _lsRefused}`, null before those lets exist; put back each, `_lsRefused` restored in place, `_cycAllMemo=null`,
  `saveStateShow()`.
- **`lsAll`** — `const mk=lsMarks();` after the read of `held`; `_lsAllRun++` and `try{ return lsAllWrite(W, held, mk); }
  finally{ _lsAllRun--; }`; **`lsAllWrite`** (new) holds lsAll's writes and put-back, the lines as they stood, and just before
  the final `return {ok:false, …}` (unchanged): `if(now.every(function(s){ return s==='was'; })) lsMarksBack(mk);`.
- **`lsPutBack`** — `_lsAllRun++` / `try{ … }finally{ _lsAllRun--; }` around its writes, the loop's lines unchanged.
- **importBoards' late refusal** — `const mk=lsMarks();` before its lsAll; `lsMarksBack(mk)` in the all-`'was'` branch before
  `none(…)`.
- **`var _sideBootGen=Infinity;`** beside `_sideGen`; `try{ _sideBootGen=_sideGen; }catch(e){}` at the end of opening, right
  after the unchanged `try{ _sideSaved=_sideGen; }catch(e){}`.
- **`persist`** — counts its refusal in `DIAG.refused` as `'<appropriation> board data'`; its message gains *"Until it is saved,
  closing or reloading this page asks first, and switching appropriation waits."* (in a copy: *"…asks first."*). Still a
  direct write (D15).
- **`memOnlyNow()`** (new, after `unsavedNow`) — `DIRTY && _persistFail`, or a list in `_lsRefused` refused after
  `_sideBootGen`.
- **`memOnlyBlock(head, act)`** (the slot's stub, body filled) — S2 refusal; S2 confirm after a downloaded copy (`_dlOnly`)
  with "{head} — nothing changed." on Cancel; the copy's wording; the stopped-import sentence when `impMixedOn()`.
- **`memOnlyLeave(ev)`** and its `beforeunload` listener (new, after the slot's `reopenPage`) — asks when
  `!_leaving && (memOnlyNow() || impFileHolds())`.
- **`switchAppn(a, asked)`** — returns true only when it reopens; the copy's branch returns false; `memOnlyBlock` first
  (unless `asked`); `prio27appn` through `lsSet(…, {quiet:true})`, refused → the box put back, S3 said, false; `liveLeaving()`
  only after the write; `reopenPage(); return true;`.
- **`cycGoAppn(k)`** — the guard, then the mark (quiet), then `switchAppn(…, true)`; the mark removed when no switch happens.
- **`writerKeyHeld()`** (new), **`writerKey()`** — kept for the page in the slot's `_wkMem` when storage refuses it (one
  refusal per page; storage read first while `_wkMem` is '').
- **`uiPenOther()`** — reads `writerKeyHeld()`.
- **`_whoMem`, `whoIs()`, `whoAmI()`** — the name kept for the page when storage refuses it; S6's extra sentence.
- **`clearComputer()`** — S7 when `memOnlyNow()` holds (the old unsaved sentence otherwise).
- **`diagLsKinds()`** (new, before `diagStoreOf`) and **`diagReport`**'s "Storage by kind" block after "Browser storage:".
- **`_driveStorePushRun`'s `penNote`** — `+wkMemSay(may)`.

## Decided in the build

1. **lsAll's body moved into `lsAllWrite`**, its lines byte for byte, so `_lsAllRun++` sits in a try/finally without
   re-indenting the lines eleven existing mutations find (`fullimp-*`, `v199-batch-*` and others). `lsPutBack`'s try/finally
   wraps its loop with the loop's lines unchanged.
2. **`writerKey`'s `lsSet` is inside a try** (`let kept=false; try{ kept=lsSet(…); }catch(e){} if(!kept) _wkMem=k;`): a
   write that threw would count as refused, never stop the board. Nothing calls it while the board opens today.
3. **`memOnlyBlock` reads `SANDBOX` and `_dlOnly` in a try** (into `sb`, `dl`), never through `typeof`, so the mutation
   `dl-no-question` finds `if(dl){` and its confirm line.
4. **Check 1's room is 60, not the map's 40, with this browser's writer key stored first:** a file save writes
   `prio27om.base` (about 22) and, with no key stored, the writer key (47); at 40, part (f)'s switch after the save was then
   — correctly — refused as storage full. At 60 the choice (19), the mark (13) and the record fit; the edit (about 280) does not.
5. **Check 2 (d2) types "Roberta" over a stored "Ann"**: a name of the same length replaces the stored one in place even in a
   full browser, so "Bob" over "Ann" was kept by storage and proved nothing.
6. **Check 5's "saved" board is saved into a stand-in file first:** w2Fx's OLD board opens reading "Unsaved changes" (this
   browser holds a locked-cycle store its file does not: `sideBootNote.keys` `['prio27om-cyc']`), so "as saved" is made by a
   file save. The fixture's edits are followed by `render()`, so the save state is read as the screen shows it. Both windows
   are stood in (C14).
7. **`tools/storage-full.mjs` fills browser storage from the board's own tab** (page code, after load), not from a second
   blank tab: measured, a filler written from a second file:// tab was not seen by the board's tab in one run (61 characters in
   use beside a full seed page) and was in the next. The room is then measured in the board's tab (`room` characters of a
   probe fit, one more does not), and the seed page's name is read back in the board's tab, failing as "harness" if not.
8. **Check 1 reads `memOnlyNow()` through `w3sMem`** (`'none'` on a board with no such function), so on the slot board each
   part fails on its own rather than the block throwing at the first read.
9. **The five save-target (c) mutations** had names only in the map; their finds are written here: `marks-not-restored`
   (lsAllWrite's lsMarksBack line), `marks-dirty-kept` (lsMarksBack's `_saveGen`/`DIRTY` lines), `marks-side-kept`
   (lsMarksBack's `_sideGen`/`_lsRefused` lines), `import-says-save` (`if(!_lsAllRun)` removed), `batch-marks`
   (importBoards' `lsMarksBack(mk)` removed).
10. **S3 names each menu path at the end of its own string piece** (`'… Setup \u203a Save diagnostics\u2026'+' shows what fills
   it; Setup \u203a Clear this computer\u2026'+' frees …'`): `npm run menus` reads a path in the source up to the next quote,
   and took the two paths in one sentence as one path with a group ("the menu has no group …"). The words on screen are as the
   map gives them, character for character.

## Checks

Each fails on the slot commit unless labelled CONTROL (run with `BOARD=<slot board>`, slimmed to the W3 blocks).

1. audit-board `v2.14 W3 — storage full: a change browser storage refuses is counted, and nothing reopens the page over it
   unasked (item 141 F)` — parts (a)–(g2), (i), (k1)–(k3), (l): counted; on screen only and the message's tail; leaving asks
   (CONTROL first: a clean board does not); `#appnSel` driven as a person does (value, then `change`) and reading O&M again;
   Go to leaves no mark; a full import, Import one appropriation and a **JSON state file** through `importState` (C30b) each
   refused before their own question, storage byte-identical; after a downloaded copy one question, Cancel keeps the page, OK
   (a fresh board) reopens; a file save ends it and the switch then reopens; a list refused while opening is not on screen
   only, one refused after it is; Clear this computer's question says ON SCREEN ONLY and its reopening does not meet the
   browser's question; `impFileHolds` stood in as true asks with nothing on screen only, `_leaving` does not (CONTROL: back to
   false, nothing asks). On the slot: 31 failing checks across the three blocks (first failing parts: `DIAG.refused` `[]`,
   leave not prevented, switch navigates with the box on FULL FUND, every import asks, the download path asks nothing; then the
   block throws at `_sideBootGen`).
2. audit-board `v2.14 W3 — storage full: the writer key and the editor name are kept for the page (item 141 F)` — ten calls one
   key, refused once and counted; two Saves both written, the second "by BL", `uiPenOther()===''`; the first Save's S8
   sentence and not the second's; three edits ask the name once, counted; "Roberta" over "Ann"; CONTROL: storage accepting
   stores both keys and says nothing. On the slot: 10 keys, `[]` refused, 1 write and "unknown", the name asked 6 times.
3. audit-board `v2.14 W3 — storage full: switching appropriation never reopens the page after a refused write (item 141 F)` —
   a clean board, room 0: no reopening, the box on O&M, S3, the refusal counted; room 15 (the mark fits, the choice not): Go to
   leaves no mark; CONTROL: O&M to OPN replaces in place and reopens. On the slot: navigates, box FULL FUND, uncounted, mark left.
4. audit-other `v2.14 W3 — Save diagnostics counts browser storage by kind and names no key that is not ORBIT’s (item 141 G)` —
   the planted keys of the map's check 4; each kind's line equal to the harness's own sums (rule restated in the suite, never
   read from `diagLsKinds`); the kinds add to the "Browser storage" entries; "(2 publish dates)"; a copy's `.base` is a PMO
   copy; no foreign key, value or `<img`, and no ORBIT key name, in the report; the box shows the same lines; CONTROL: the
   fixture sorts as the rule says. On the slot: no heading, no lines.
5. audit-import `v2.14 W3 — a refused import leaves the board as saved as it was, and never says to Save (item 140 c)` — a
   full import refused once at each of the ten writes on boards read as saved, unsaved and downloaded only (30 runs): the marks,
   `_baseDirty`, the record and the save state as they were; no new "could not be kept in browser storage" in STAT_LOG; "⛔
   Nothing was imported" on the line and kept unread; Import one appropriation (consTakeApply) refused at its first write; Import
   several boards refused after the write (the late refusal; CONTROL: it was written, refused and put back); storage-full's
   A(h): an lsAll refused at room 200 and put back leaves nothing on screen only or unsaved; CONTROL: a stuck run keeps the
   mixed hold. Asserts the status line and STAT_LOG, never the alert; closes any open box by its ✕. On the slot: 61 failing
   checks.

- **Existing check moved:** audit-board v2.05 item 116 "go to" (~5315): the `switchAppn` stand-in returns true, with a
  `// v2.14 W3:` comment (cycGoAppn takes its mark back when the switch did not happen).
- **`tools/storage-full.mjs`** (no npm script yet): A, B, B2, W, each failing on the slot board (16 failing checks), all passing
  on this branch. Chromium 153.0.8010.12 here.
- `npm run check` passes; `node tools/export-audit/boot-same.mjs` passes ("every page, source, save and error list is identical
  either way").

## Mutations

34 new, in `mutate.mjs`'s W3 slot, ids single-quoted, plus the retarget `v205-116-go-no-mark` in place (find
`  lsSet(CYC_GO_KEY, k, 'Which board opens PPBE cycles next', {quiet:true});\n`, repl ''). mcount after the last edit:
`{"entries": 3254, "once": 3254}` (3220 + 34). Every mutant built with `mkmut.py` and run through `node tools/check.mjs
<mutant>`: all 35 parse. `recovery/v214/proofs-W3.json` names each one's block:

| block | mutations |
|---|---|
| board check 1 | `persist-uncounted`, `memonly-persist-ignored`, `memonly-counts-opening`, `memonly-side-ignored`, `boot-gen-unset`, `beforeunload-off`, `leaving-ignored`, `reopen-not-leaving`, `leave-ignores-file`, `switch-unguarded`, `dl-no-question`, `cycgo-mark-first`, `import-full-unguarded`, `import-take-unguarded`, `import-state-unguarded`, `clear-onscreen-unsaid` |
| board check 2 | `writerkey-remade`, `writerkey-retries`, `pen-reads-storage`, `name-not-kept`, `name-storage-first` |
| board check 3 | `switch-reloads-refused`, `switch-box-stays`, `quiet-uncounted`, `cycgo-mark-left` |
| other check 4 | `diag-foreign-as-orbit`, `diag-copy-precedence`, `diag-stamps-uncounted`, `diag-kinds-missing` |
| import check 5 | `marks-not-restored`, `marks-dirty-kept`, `marks-side-kept`, `import-says-save`, `batch-marks` |
| board v2.05 "go to" | `v205-116-go-no-mark` (retarget) |

**Proof run** (`recovery/v214/proved-W3.jsonl`, `JOBS=1 HEAP=8192 prove.py`, each against its own block, every block run
clean first): **35 of 35 CAUGHT**, none by a throw. All on the committed board `837f1ae`: the first run's first 12 were built
before S3's split (`837f1ae`, display-identical), so those 12 and `quiet-uncounted` were dropped and proved again on it.

## For the integration

- **`v213-rv-refused-reads-unsaved` is now redundant with `lsMarksBack`** and may come back SURVIVED from a sweep or the
  integrated proof run: cycApplyAll's own `_sideGen=g0; delete _lsRefused[…]` (left in place, contract §7) runs after lsAll
  has already put both back. The mutation differs only when a list in W was already refused before the call. The defect it
  guards is now held by `v214-w3-marks-side-kept` (check 5). The lead decides: mark it `equivalent:` with that receipt, or
  give F20 in the v2.13 block a list refused before the call.
- **W1:** check 1 (f), check 2 and `storage-full.mjs` W set `FH` to a stand-in handle directly and stand in both windows; if
  W1's first Save of a file goes through the Open window even when `FH` is set in memory, those parts must take W1's route
  (C16's sweep of stand-in Save blocks). The file save's S8 tail is the slot's line (`wkMemSay(may)`); check 2 reads it.
- **W2:** `memOnlyLeave` reads `impFileHolds()` (check 1 (l) stands it in). Check 5 never reads the alert, and closes any open
  `body > .modal-bg.open` by its `h3 button.x` (confirm stubbed true), so W2's box does not change its verdicts. INT-2 holds
  W3's restore with W2's box; INT-4 holds W2's hold with W3's prompt (a held `persist` sets `_persistFail`, so `memOnlyNow()`
  reads it).
- **W4:** nothing shared; `persist` and `save()` are untouched by W3 but for persist's catch branch.
- **npm script to add:** `"storagefull": "node tools/storage-full.mjs"`, and `storagefull` appended to `verify:grid`.
- **The guide:** W3 added no sentence (C11's +150 unused).

## Known gaps

- `writerKey` and `whoAmI` now write through `lsSet`: while an import is being prepared (`_lsCapture` set) a key or name made
  then would be captured into the import's set rather than written. Nothing makes either during a capture today.
- The other direct storage writes (D17) are unchanged; persist stays direct (D15).
- A download the person cancels in the browser's Save As window is invisible to the page: the `_dlOnly` question says the
  downloaded copy holds the changes; it cannot know the copy was not kept.
- `liveLeaving` still runs on `beforeunload` when the person chooses to stay (pre-existing; the folder lock's 3-minute expiry
  re-arms it).
- In a locked view, `DIRTY` is the working plan's, so work on screen only there is the working plan's (by design).
- **Run in this stage, on `837f1ae`, one at a time:** audit-other whole (ALL CHECKS PASSED, 2 min 26 s), audit-board whole at
  8 GB (ALL CHECKS PASSED, 5 min 23 s), audit-import whole at 8 GB (ALL CHECKS PASSED), audit-recon whole at 8 GB (ALL CHECKS
  PASSED), audit-inject whole (ALL CHECKS PASSED); `npm run menus` (every path there; it caught S3, fixed), `npm run panels`
  (every panel and menu opens), `node tools/storage-full.mjs` (all pass), `npm run check`, `boot-same`; mcount 3254, all once.
- **Not run in this stage (stage 2's):** audit, legacy and hostile whole; the browser checks but `menus`, `panels` and
  `storage-full.mjs` (keys, dialogs, leftmenu, standards, layout and the rest: W3 adds no control and no box, only messages and
  diagnostics lines, so none is expected to move).
