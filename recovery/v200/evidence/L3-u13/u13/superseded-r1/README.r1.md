# U13 built: a refresh during a save loads nothing (safety track, one commit's worth)

Built Monday 12 Oct 2026, 06:13–06:50 ET, on Brad's 6:00 AM ET selection: "implement U13's refusal to adopt another copy
while saving, as a separate commit. Re-check immediately before adoption after any waits. Test preserved copies, unchanged
flags on refusal, and successful retry after saving finishes." His other instruction, "Keep the separate reopening/adoption
findings open", is followed: none of U15–U20 is touched, and the new findings below are listed, not fixed.

**Nothing was edited, staged, committed or pushed in `/home/user/orbit-board`** (its `git status` is clean; its HEAD moved
to `bbc0e05` during this work, records only: the board, audit-import and mutate.mjs there are still `1375b72b`, `ed9a3437`
and `9f9168fa`, so the diffs below apply as they stand). The lead commits.

## Result
- **The fix** (`after/prioritization-board-grid.html`, blob `a88a1e5b932b94225a29cdcfec0678f828847ddd`, from `1375b72b`):
  two guards in `driveStorePull`, both after its last wait, so a save that started while the folder was being read is
  seen. One immediately before adoption (before `ownUnsaved`/`keepAside`, `applyStore`, `driveBaseSet`, `persist`); one on
  the not-newer branch's base record (`if(!base) driveBaseSet(...)`). A refused pull changes nothing. No entry check.
- **The test** (audit-import, block "v2.00 (U13) — a refresh during a save loads nothing", 58 checks, placed right after
  `// ==== end v2.00 (U2) put back waits ====`): **34 fail on the board before the fix; all 58 pass after** (three runs).
  The controls pass on both.
- **Mutations** (three, in the mutate.mjs TEXT copy): each caught; all 1,310 entries match the after board exactly once.
- **Re-check after waits**: the entry-check-only board (the earlier one-line proposal) fails (3a) and (3b) on state —
  it loads REMOTE — as required.
- **U2's two blocks** still pass on the after board (16/16 and 41/41).

## The change, and why there
`driveStorePull`'s waits are `driveDir(false,'read')` and `driveStoreRead(...)`. Everything after the read is synchronous,
so a check placed after the read sees the state at the moment of adoption. The state changes it can make after that read:
`driveBaseSet` on the not-newer branch (nothing recorded), and on the adoption path `keepAside`, `applyStore`,
`driveBaseSet(..., true)`, `persist` (and on the template shell a reload). Both guards come before every one of them.
`LIVEDB`: the pull itself writes only `LIVEDB.err`, on failures (folder not connected, copy unreadable, a newer format);
it records no success. The success fields are written by `livePoll` after `drivePoll` returns, whatever the pull did —
that is outside `driveStorePull` and is listed as finding N3.

**Why two guards, not one.** The DIRTY guard ("…you have unsaved changes. Nothing was replaced…", control Cb) must keep
its message, and it sits after the not-newer branch. One check before the not-newer branch would silence Cb (the earlier
entry-only proposal did: Codex's `var-refuse-busy` failed `Cb.pull` on its message, and so does the entry-only variant
here). One check before adoption alone would leave the not-newer branch recording a base during a save. So: the adoption
guard sits after the DIRTY and no-requirement-data refusals (they change nothing) and immediately before adoption; the
base-record guard sits at that one statement.

**Why no entry check.** It would add nothing the after-wait checks miss (whatever is true at entry is re-read at the
check), it would come before the DIRTY guard and silence Cb, and a mutation removing it could not be seen by any test.

**What a refused pull says, and why.**
- **Quiet (the Live timer, through `liveTick` → `livePoll(true)` → `drivePoll` → `driveStorePull(true)`): nothing.** The
  timer says nothing when there is nothing newer either, and tries again at its next tick. Saying something here would
  also change `_statN` under an autosave in flight, so the tick that started it would no longer say "Saved
  automatically" (the R08 rule). A quiet refusal is still recorded nowhere as a load (but see N3 about `LIVEDB.last`).
- **Not quiet (the bar's Connect `driveConnectNow`, the opening's own connect `driveAutoConnect`): said plainly.**
  "⏳ **Nothing was loaded** from the shared folder: a save was under way. Nothing was changed: what is on screen is as it
  was. The folder’s copy is checked again on the next refresh once the save has finished (📡 Live view → ↻ Refresh now, or
  on its own while Live view is on)." Past tense, and a condition, so it stays true once the save has landed. In practice
  it is replaced: this refusal is only reached with nothing unsaved this session (otherwise the DIRTY guard answers), and
  every save that can run then is a non-quiet one that says its own outcome (observed: O1, "✅ Saved O&M FY27 …").
- The not-newer branch's base guard says nothing, as that branch never did.

## Exact board diff (`diffs/board.diff`, blob `6c10f1e04d25f148d8fbef50d9e88a807847b364`)
```diff
--- a/prioritization-board-grid.html
+++ b/prioritization-board-grid.html
@@ -26704,7 +26704,9 @@
     // saved after it, and what is on screen does not have their changes (v1.89). Said now, and Save
     // will not write over it without a choice. With nothing recorded (a board last opened before
     // v1.89) there is no telling, and the folder's copy is taken as the base, as it always was.
-    if(!base) driveBaseSet(mySlug(), theirs);
+    // v2.00 (U13): BUT NOT WHILE A SAVE IS UNDER WAY. A save still to read the folder would find this copy recorded as the one
+    // the work came from, and write over it without asking; a save past its read records the copy it writes, once it lands.
+    if(!base){ if(!_saveBusy) driveBaseSet(mySlug(), theirs); }
     else if(theirs!==base){ driveClashSay(j, false); render(); }
     return false;
   }
@@ -26729,6 +26731,19 @@
       +' It needs to be saved once from a board that holds the requirements.');
     render(); return false;
   }
+  // v2.00 (U13, Brad 12 Oct): NOT WHILE A SAVE IS UNDER WAY -- checked here, after the last wait and before anything is
+  // changed, so a save that started while the folder was being read is seen too. A save that lands records the copy IT
+  // wrote as the one the work on screen came from, and marks the board saved: a copy loaded while it was writing stayed on
+  // screen recorded as saved, with the save's copy in the folder, and the next refresh and a reopen said nothing. Now
+  // nothing is changed -- what is on screen, the work kept aside and this browser's record stay exactly as they were -- and
+  // the next refresh once the save has finished decides afresh. A quiet refresh (the Live timer) says nothing, as it does
+  // when there is nothing newer; a Connect says so, in words that stay true once the save has landed.
+  if(_saveBusy){
+    if(!quiet) setStat('⏳ <b>Nothing was loaded</b> from the shared folder: a save was under way. Nothing was changed: what is on '
+      +'screen is as it was. The folder’s copy is checked again on the next refresh once the save has finished '
+      +'(📡 Live view → ↻ Refresh now, or on its own while Live view is on).');
+    render(); return false;
+  }
   // WORK THIS BROWSER HOLDS THAT NO SAVED COPY HAS is kept aside before the newer copy replaces it
   // (v1.89). DIRTY knows only this session: after a reopen it was false, and the work went unasked.
   const own=ownUnsaved(MS, j.store, baseGet());
```
The board is still the empty template (only code changed). `check.mjs` on both boards: identical results except the
line counts; both fail the same two `git check-ignore` checks only because the copies are not git repositories.
The TPL_PARTS line is untouched.

## The test block (audit-import; `diffs/audit-import.diff`, blob `b318236ccf86fe2fcdf4faedaede09286b696f52`)
290 lines added, none changed or removed; after-file blob `a4b6970fca8c0aaba0a5ff246e22d9c08574f77d` (from `ed9a3437`).
The block text alone is `src/u13-block.mjs.txt` (`18dafceb…`, identical to the inserted lines). It follows the U2 blocks:
`await (async () => { … })();`, `bootMark()`/`bootRelease(__bm, keepBoards())`/`settleBoards()`, the two-space
`  const name = 'v2.00 (U13) — a refresh during a save loads nothing';`, `// ==== … ====` markers, before the guard.
It uses the W1H helpers and the U2 patterns: `fold.hold.main = gate()`, `fold.failNext.main`, `fold.hits`, the
`holdRead` `getFileHandle` gate, plus `holdAsk` (the same gate on `queryPermission`, the pull's first wait).

**Fixture (literal, synthetic, at run time only).** F1 = W1H `baseFile('Brad', …)`. REMOTE (note REMOTE, $650) is written
**through the product** (`setNote`, `setAlloc`, 💾 `saveInPlace`) by a board whose own window's `Date.now` runs one hour
ahead; its bytes seed each case's own folder. Brad's board opens with REMOTE in the folder; its opening's connect loads it;
he types WORKING ($700) and closes it unsaved. Each case reopens from that browser storage.
"Byte for byte unchanged" compares one string: `JSON.stringify(MS)`, `DIRTY`, `_baseDirty`, `_driveBase`, the stored
record (`_AP.key+'.base'`), `_saveGen`, the kept slot (`.kept`) and browser storage (`_AP.key`).

| case | what runs | what is asserted (expected values literal) |
|---|---|---|
| (1) no second writer, ×2 reopen routes (harness; folder edit permission not kept → the opening stops at one click, 💾 Save asks for it) | 💾 Save held at the close of its write; during the hold, in turn: `driveStorePull(true)`, `driveConnectNow()`, `driveAutoConnect()`, `liveTick()`; release | each refresh: returned value, a save under way, nothing changed byte for byte, no write to the folder's copy or history, quiet ones said nothing / Connects said "Nothing was loaded… a save was under way… checked again on the next refresh once the save has finished". Landed: WORKING on screen, in storage and the folder's copy, saved and recorded against it, REMOTE in the folder's history, nothing kept aside. Then a refresh (pull and tick) changes nothing; a reopen (opening's connect, then a refresh) shows WORKING = folder copy, saved against it |
| (2) second writer | Brad saves BRAD-1 ($700); Bob loads it, types BOB-2 ($650); Brad's 💾 Save (nothing unsaved) held; Bob ✍ takes the pen and saves BOB-2; Brad's pull, Connect, tick; release | refreshes as (1); landed: BRAD-1 on screen, storage, folder copy, saved against it; later refresh and reopen agree; Bob's own board still holds BOB-2 on screen and in its storage. Bob's copy in the folder is **not** asserted (see "The other writer's copy") |
| (3a) re-check after the read | `driveStorePull(false)` started with no save under way, held at its read; 💾 Save starts, held at its write; the read released | the refresh returns false, nothing changed, said; landed as (1). **Fails on an entry-only board** |
| (3b) re-check after the first wait | `driveStorePull(true)` held at `queryPermission`; save starts and is held; released | returns false, nothing changed, nothing said; landed as (1). **Fails on an entry-only board** |
| (3c) nothing recorded for the folder | Brad's other browser saved X ($600); a fresh browser types MINE ($720); 💾 Save waits at its read; the opening's own connect runs | the connect changes nothing (no base recorded); the save then asks: nothing written, X still the folder copy, MINE on screen unsaved, "Save yours over theirs" offered |
| (4a) retry after **saved** | held save; tick refused; lands; Brad's other browser saves NEWER ($750) over WORKING | next `driveStorePull(true)` loads NEWER: on screen and in storage, saved against the folder copy, nothing kept (WORKING is saved, in history) |
| (4b) retry after **failed** (write throws) | held save; pull refused; `fold.failNext.main` set before release | "Could not save to the shared folder" said, REMOTE still the copy, WORKING unsaved, `_saveBusy` 0; next pull loads REMOTE, saved against it, WORKING kept aside |
| (4c) retry after **refused** (clash) | NEWER saved before; save held at its read; tick refused; released | "Nothing was written", NEWER still the copy, WORKING unsaved, `_saveBusy` 0; next tick loads NEWER, saved against it, WORKING kept aside |
| (4d) retry after **canceled** | the folder copy without a writer (REMOTE as a pre-v1.95 board wrote it, `writer` removed); save held at its read; Connect refused; Cancel answered | asked once, "Save canceled — nothing written", REMOTE still the copy, WORKING unsaved, `_saveBusy` 0; next pull loads REMOTE, saved against it, WORKING kept aside |
| (5) Cc | no save under way | the pull loads REMOTE as before, WORKING kept aside, "kept aside" said |
| (5) Cb | work typed this session (DIRTY), held save, pull | unchanged unsaved-changes message ("…and you have unsaved changes. Nothing was replaced. Save yours, or reload to take theirs."), not U13's line; nothing changed; lands WORKING |
| (5) Ca | REMOTE written at real time (not ahead) | not later than the save's copy; the pull loads nothing; lands WORKING with REMOTE in history |

**Expectations tied to today's adoption (please note).** Cc, (4b) and (4d) expect what an ordinary pull does today when a
folder copy stamped ahead is also the copy the work came from: it is loaded and the unsaved work is kept aside. That is
U16's behaviour (open). The task requires Cc "as before"; if U16 is later changed to compare with the base, these three
expectations are the ones to revisit. Nothing is lost in any of them (the kept slot holds WORKING).

**Existing checks.** No existing check, fixture or expected value was changed (the diff only adds). By reading,
no other audit-import block runs a pull while a save is under way (its other `driveStorePull`/`liveTick` calls, at
L3610–3642, L3934, L4048–4050, L4124 and L6635–6647, run with no save in flight or after the push resolves); no other
suite (audit, audit-other, audit-recon, audit-board) calls a pull path. So none encodes the rejected behaviour as far as
I can see; the full audit-import was **not** run (the lead runs it alone).

## Mutations (the mutate.mjs TEXT copy; `diffs/mutate.diff`, blob `5bf2624b6f01ca27e04e994def5f6bef4cfd328e`)
Inserted before `  // v2.00 (R3, Brad 11 Oct): a save that lands under a locked view says it saved the working plan.`;
after-text blob `60d70a54f972b5cf8405732229ff832468af4ff3` (from `9f9168fa`). Written by `src/mkentries.py` from the
board's own text. mutate.mjs was never imported or run; counts are mcount.py (text only).

| id | what it removes | find on the after board | caught by (final runs) |
|---|---|---|---|
| `v200-u13-pull-while-saving` | the re-check before adoption (`if(_saveBusy){` → `if(false){`) | 1 | 32 checks: (1) both routes, (2), **(3a), (3b)**, (4a)–(4d) |
| `v200-u13-base-while-saving` | the base-record guard | 1 | 2 checks: (3c) |
| `v200-u13-pull-unchecked` | every new check (one find spanning both guards, 33 lines) | 1 | 34 checks: as the first plus (3c) |

- mcount: base text on the before and after boards: 1,307/1,307 once each. After text on the after board: **1,310/1,310
  once**, no missing, no multiple, none unparsed. On the before board the three new finds match 0 (as they should).
- No entry-check mutation exists because there is no entry check. The long find of `v200-u13-pull-unchecked` spans the
  DIRTY guard and the no-requirement-data refusal; an edit there will report it NOT APPLIED, never caught.
- **Sensitivity variant (not a mutation):** `mut/var-entry-only--on-before.html` (`1eeb45a6`), the before board with
  `if(!driveStoreOn() || _saveBusy) return false;` at entry. 11 checks fail: (3a) and (3b) on state (it loads REMOTE and
  the save lands falsely clean), the Connect messages in (1), (2), (4d) (it refuses silently), and Cb's message.

## Runs (all bounded `setsid -w timeout -k 10 600`; one at a time; lock checked first; none timed out; none skipped)
Final set: harness `h/focused-u13.mjs` blob `bb7958ab8995bbcee65a55ad35d46d50d6de0c5f`, built by `mkfocused-u13.py`
(adapted from `rec/L2/u2impl/mkfocused-u2.py`: header lines only) from the after audit-import; runner `runner.mjs`
(`e835140a`, from `rec/L2/u2impl/runner.mjs`, first comment line only); boot.mjs `9c4f49ad` and shim `6e2ce2e6` in both
copies. Each run's `IDS` line records the board blob it booted.

| label | start (ET) | exit | wall s | board | result | log |
|---|---|---|---|---|---|---|
| fin-u13-on-before | 06:43:55 | 1 | 21.4 | `1375b72b` | 34 of 58 fail (all defect cases; controls pass) | logs/fin-u13-on-before.log |
| fin-u13-on-after | 06:44:16 | 0 | 22.7 | `a88a1e5b` | ALL CHECKS PASSED (58) | logs/fin-u13-on-after.log |
| fin-M-v200-u13-pull-while-saving | 06:44:39 | 1 | 22.5 | `270b7833` | 32 fail | logs/fin-M-v200-u13-pull-while-saving.log |
| fin-M-v200-u13-base-while-saving | 06:45:01 | 1 | 23.8 | `ebfcf7d0` | 2 fail ((3c)) | logs/fin-M-v200-u13-base-while-saving.log |
| fin-M-v200-u13-pull-unchecked | 06:45:25 | 1 | 21.5 | `328c1c3d` | 34 fail | logs/fin-M-v200-u13-pull-unchecked.log |
| fin-var-entry-only | 06:45:47 | 1 | 19.2 | `1eeb45a6` | 11 fail (incl. (3a), (3b) state) | logs/fin-var-entry-only.log |
| fin-u2-block1-on-after (harness `8d02189b`) | 06:46:06 | 0 | 10.9 | `a88a1e5b` | ALL CHECKS PASSED (16) | logs/fin-u2-block1-on-after.log |
| fin-u2-block2-on-after (harness `7771c3ba`) | 06:46:17 | 0 | 22.9 | `a88a1e5b` | ALL CHECKS PASSED (41) | logs/fin-u2-block2-on-after.log |
| fin-u13-on-after-rep2 | 06:46:57 | 0 | 24.3 | `a88a1e5b` | ALL CHECKS PASSED | logs/fin-u13-on-after-rep2.log |
| fin-u13-on-after-rep3 | 06:47:21 | 0 | 33.3 | `a88a1e5b` | ALL CHECKS PASSED | logs/fin-u13-on-after-rep3.log |

Every check, verdict and observed value per run: `out/<label>.checks.jsonl`; the verdict matrix of the six U13 runs:
`out/matrix.txt` (`./show.sh <label>` prints one run).

Earlier runs (superseded by the final set; same verdicts, check for check, for every U13 run): `dev1-*` 06:34:51–06:38:29
(harness `331b6802`, before a 5 ms pause was added ahead of Bob's save in (2) so his copy is always stamped after Brad's;
no verdict changed). Other runs:

| label | start (ET) | exit | wall s | what |
|---|---|---|---|---|
| dev1-u13-on-after / -on-before | 06:34:51 / 06:35:15 | 0 / 1 | 20.4 / 21.9 | 58 pass / 34 fail |
| dev1-M-… (3) / dev1-var-entry-only | 06:36:47–06:37:46 | 1 each | 17.9–20.5 | 32 / 2 / 34 / 11 fail |
| dev1-u2-block1 / block2 on after | 06:38:18 / 06:38:29 | 0 / 0 | 11.4 / 23.8 | pass |
| obs1-on-after, obs2-on-after, obs2-on-before (probe `h/u13-observe.mjs` `efe38eb8`, then `cf57f05c`; observations only, no checks) | 06:39:40, 06:40:48, 06:41:01 | 0 | 10.0, 12.8, 11.4 | below |
| check-before / check-after (`node tools/check.mjs`) | 06:41:50 / 06:41:52 | 1 / 1 | 2.5 / 2.9 | same two git-only failures on both |
| bootsame-after (`boot-same.mjs`) | 06:42:19 | 0 | 8.4 | identical either way |
| other-after (`audit-other.mjs`) | 06:42:28 | 0 | 30.0 | ALL CHECKS PASSED |
| node --check ×3, mkfocused ×7, mcount ×4, mkmut ×3, mkentries, mkvar | 06:34–06:43 | 0 | < 3.1 | text tools and syntax checks |

`logs/runs.txt` has every run in order. `pids.txt` (88 lines) has each timeout PID and its child with the command.
**Two node invocations were NOT bounded and not recorded in pids.txt** (both recorded in runs.txt): `node --check` of the
after audit-import at about 06:34 ET (exit 0), and `node --version` at about 06:42 ET (printed v22.22.0). For both, the lock
was not checked immediately before (it was absent before and after each). Nothing was killed by me.

## Every path that puts another copy into MS, and whether a save can be under way (2: findings only, not fixed)
| path | can it run while a save is under way? | covered? |
|---|---|---|
| `driveStorePull` from `drivePoll` (Live tick `liveTick`→`livePoll(true)`; ↻ Refresh now `livePoll(false)`) | yes | **U13** (quiet; see N2 for ↻ Refresh now's words) |
| `driveStorePull(false)` from `driveAutoConnect` (opening, also re-run) and `driveConnectNow` (the bar) | yes | **U13** (said) |
| `driveStorePull`'s template-shell branch (applyStore + persist + reload) | yes | **U13** (the guard precedes it) |
| `_driveResolveRun` (Load theirs) | not in this tab: it runs inside `saveSerial` | serialized; another tab's lock wait is **U20** |
| `keptPutBack` (↶ Put back) | yes | refused while a save is under way (**U2**) |
| `driveRestore` (Put this back) | yes | counted, not refused (**R5**): the save lands unsaved |
| `importState` (full import), `pkgApply` | yes (a click) | counted through `save()`; the save lands unsaved |
| `sharedArrived` (the sidecar answer, async; opt-in on file://) and `adoptShared` (its link) | yes | **not covered** (N4): applyStore + persist, no count, no `_saveBusy` |
| `bootTakeFile` (open the file's version) | yes (a click) | **not covered** (N4): applyStore + record clean + persist + DIRTY false |
| `importBoards` (consolidated batch import) and its undo `impBoardBack` | yes | **not covered** (N4): applyStore + persist, no count |
| `cycView` / `cycLeave` (locked view) | yes | **R3** (a landing under a view says it saved the working plan) |
| the opening's top-level adoption of the file | no: it runs before any save can start | — |
| routed import / appropriation switch (storage then `location.reload()`) | the reload abandons a save in flight | not the U13 shape; not examined |
| `driveExecPull` / `driveAcePull` / `driveRpPull` | yes | independent stores (EXDB, ACEDB, RPDB), not MS; not examined |
| `takePen` | it is a save (through `saveInPlace`) | not an adoption |
N4's rows are by code reading only; none was run.

## The other writer's copy (case 2; observed, O3, after board)
During Brad's held save, Bob's take-the-pen save makes BOB-2 the folder's copy (writer Bob) and keeps Brad's BRAD-1 in the
history (a `-recent` copy). Brad's refresh loads nothing. Brad's save then writes BRAD-1 over BOB-2, writer **Brad**
again, and its pruning removes the `-recent` copy. **BOB-2 is in no copy in the folder, head or history.** It is still on
Bob's screen and in his browser storage; Bob's next refresh says "⛔ Brad saved O&M FY27 to the shared folder just now,
after the copy you are working from. What is on screen does not have their changes. Load theirs (your work is kept aside…)
· Save yours over theirs (theirs is kept in the folder’s history)." That is U18 (open), not changed here; the block
asserts only Brad's consistent record and that Bob's own board still holds BOB-2.

## Findings (new or sharpened by this build; not fixed; Brad's decision)
- **N1 (P2 by the ledger's scale): a refresh in a save's last window raises a false clash about the board's own copy.**
  After a folder save has written its copy but before it records it (its history pruning and lock heartbeat come first), a
  refresh reads that copy, finds it differs from the record not yet moved, and says "⛔ Brad saved … after the copy you are
  working from. What is on screen does not have their changes. Load theirs · Save yours over theirs." After 💾 Save, "✅
  Saved" replaces it; after the Live autosave (quiet) it **stays on screen while the board is saved and consistent** (O5b;
  also seen in O4 via the tick `liveStart` fires). Measured on both boards (pre-existing). Either button converges; nothing
  is lost. A one-condition option (`else if(theirs!==base && !_saveBusy)`) is NOT built.
- **N2 (P2/P3): ↻ Refresh now does not say that nothing was loaded.** `livePoll(false)` pulls quietly through `drivePoll`
  and then says "↻ Live view refreshed — 0 other appropriations." (O2). The same line already overwrote the
  unsaved-changes warning before U13.
- **N3 (P2): Live view's "Loaded …" time moves on a refresh that loaded nothing.** `livePoll` rebuilds `LIVEDB` (`last` =
  now, `err` = '') after `drivePoll`, whatever the pull did: refused for a save (O2: "just now"), refused for unsaved
  work, not newer, or unreadable (that last also wipes the `LIVEDB.err` the pull set, by code).
- **N4 (by code, not run; P1 by shape): four other adoption paths neither refuse during a save nor count a change**:
  `sharedArrived`/`adoptShared`, `bootTakeFile`, `importBoards`. A save landing after one of them would mark the board
  saved against its own copy while the screen shows the adopted one — U13's shape on those routes.
- **Related, unchanged:** U16 (the comparison with the screen's stamp, not the base; Cc/(4b)/(4d) above), U17 (should no
  longer be reachable on the measured routes; to be re-measured), U18 (above), U20 (another tab's lock wait is not
  counted, so U13's refusal cannot see it either). A Connect during an **autosave** (work typed this session) gets the
  unchanged unsaved-changes warning, which is false once the autosave lands (O4; pre-existing, Cb's line kept as asked).

## Observations (probe `h/u13-observe.mjs`, `cf57f05c`; prints only, no expected values)
`logs/obs2-on-after.log` and `logs/obs2-on-before.log`, lines `OBS`. O1 Connect during a save: the refusal line as above;
once the save landed, "✅ Saved O&M FY27 to the shared folder — 5 KB. Everyone sees it on their next refresh.", screen and
folder copy WORKING. O2 the tick and ↻ Refresh now during a save (N2, N3). O3 the second writer (above). O4 a Connect
during an autosave. O5 a refresh held at the save's heartbeat (N1). Caveat: O1, O2 and O4 set `_liveCfg.on=true`, so the
Connect started `liveStart()`, whose immediate (un-awaited) tick also ran during the hold.

## Not done (plainly)
- Nothing in orbit-board edited, staged, committed or pushed; NEXT-VERSION and the ledger are drafts below.
- The full audit-import and audit-board were not run (the lead's); mutate.mjs was never imported, executed or run.
- No Chromium, playwright or screenshots (no layout change; the message is the status line). No playwright install.
- N1–N4 are not fixed; no other path than `driveStorePull` was changed.
- No independent review of this build was done by me.
- The harness files in `before/`/`after/tools/export-audit/` (`focused-*.mjs`, `u13-observe.mjs`) are scaffolding, not
  part of the commit. The commit is: the board, audit-import, mutate.mjs (as `diffs/*.diff`).

## Drafts for the lead (nothing written in orbit-board)

### NEXT-VERSION.md entry (after the two U2 entries, before "Unresolved after R1–R5")
- **U13 — a refresh during a save loads nothing** (Brad, 12 Oct, 6:00 AM ET: "implement U13's refusal to adopt another
  copy while saving, as a separate commit. Re-check immediately before adoption after any waits."). The folder's refresh
  (the Live timer, the bar's Connect, the opening's own connect) used to load a newer folder copy while a save was still
  writing. The save, landing, found nothing changed and marked the board saved against the copy it wrote, while the screen
  showed the copy loaded; the next refresh and a reopen said nothing. No second writer was needed: a copy already in the
  folder, stamped ahead of this machine's clock, was enough. Now the refresh checks for a save under way after its last
  wait, just before it would change anything, and while one is under way it loads nothing and changes nothing: what is on
  screen, browser storage, this browser's record, the change count and the work kept aside stay exactly as they were. With
  nothing recorded for the folder, it also no longer records the folder's copy as the one the work came from during a
  save (a save still to read the folder would then have written over that copy without asking).
  - **What users may see:** a Connect during a save says "⏳ Nothing was loaded from the shared folder: a save was under
    way. Nothing was changed … checked again on the next refresh once the save has finished", until the save says how it
    ended. The Live timer says nothing and tries again at its next tick. The unsaved-changes warning is unchanged.
  - **Test:** audit-import "v2.00 (U13) — a refresh during a save loads nothing" (58 checks): the copy stamped an hour
    ahead, reopened two ways, with every refresh during a held save; a second writer saving during the save; refreshes
    held at their read or their first wait while a save starts; nothing recorded for the folder; the next refresh after
    a save that went in, failed, was refused or was canceled, including a newer copy loaded after it; and three controls.
    34 checks fail on the board before the change; the controls pass on both.
  - **Mutations:** `v200-u13-pull-while-saving`, `v200-u13-base-while-saving`, `v200-u13-pull-unchecked`; each caught.
  - **Not covered:** a copy another writer saves during the save is still written over and kept nowhere in the folder
    (U18); a save waiting for another tab's Web Lock is not counted (U20); the other adoption paths in the ledger (N4).

### Replacement for the U13 line in NEXT-VERSION's "Unresolved after R1–R5" list
  - **U13: built as its own commit** (selected by Brad, 12 Oct, 6:00 AM ET): a refresh during a save loads nothing,
    checked after its last wait (above). Its separate reopening and adoption findings stay open in the ledger (U16, U17,
    U18, U20), with the new ones found while building it (a false clash in a save's last window; ↻ Refresh now's words;
    the Live view's "Loaded" time; four other adoption paths that do not wait for a save).

### Ledger (`recovery/v200/UNRESOLVED-LEDGER.md`)
- U13 row, Status column, append: "**Built** (12 Oct, 6:13–6:50 AM ET; `rec/L3/u13/README.md`): `driveStorePull`
  re-checks `_saveBusy` after its last wait — immediately before adoption, and at the not-newer branch's base record — and,
  refused, changes nothing (MS, DIRTY, `_baseDirty`, the record, `_saveGen`, the kept slot and browser storage byte for
  byte). Board `a88a1e5b` (from `1375b72b`), audit-import `a4b6970f`, mutate `60d70a54`. Focused block: 34/58 fail before,
  58/58 pass after (three runs); its three mutations caught; the entry-only variant fails the after-wait cases; U2's
  blocks pass. Awaiting the lead's audit-import run alone and integration; Bob's overwritten copy stays U18."
- U17 row, Status: "U13's refusal is built (`rec/L3/u13`); not yet re-measured."
- New rows (numbers for the lead to assign): N1 false clash in a save's last window (P2; measured on `1375b72b` and
  `a88a1e5b`, O5); N2 ↻ Refresh now's words (P2/P3; measured on `a88a1e5b`, O2); N3 Live view's "Loaded" time and the
  cleared error (P2; measured O2 / by code); N4 `sharedArrived`/`adoptShared`, `bootTakeFile`, `importBoards` do not wait
  for or count against a save (P1 by shape; by code only).

## Files
`before/`, `after/` (cp -r of `rec/L3/base`, node_modules symlink kept, mutate.mjs removed; text copies
`mutate.before.mjs.txt`, `mutate.after.mjs.txt`), `diffs/`, `src/` (block, entry and variant writers, probe body),
`h/` (harnesses and probe), `mut/` (three mutants, one variant), `logs/`, `out/`, `run.sh` (`86030be1`), `brun.sh`
(`db088291`), `runner.mjs`, `show.sh`, `mkfocused-u13.py` (`e50f2a92`), `pids.txt`.

## Appendix: the other two exact diffs

### mutate.mjs (`diffs/mutate.diff`)
```diff
--- a/tools/export-audit/mutate.mjs
+++ b/tools/export-audit/mutate.mjs
@@ -4216,6 +4216,16 @@
   { id: "v200-u2-putback-while-saving", area: "keptPutBack", what: "↶ Put back runs while a save is under way: the save, landing, records its own copy as the one the work put back came from, so the next Save or the folder's autosave writes over that copy without asking",
     find: "  if(_saveBusy){ setStat('⏳ <b>Not put back</b>: a save was under way. Nothing was changed: the kept work is still kept, and what is on screen is unchanged. Put it back once the save has finished (\\u21b6 work kept aside, in the top bar).'); render(); return; }\n",
     repl: "" },
+  // v2.00 (U13, Brad 12 Oct): a refresh during a save loads nothing.
+  { id: "v200-u13-pull-while-saving", area: "driveStorePull", what: "the folder's refresh no longer checks, after its last wait, for a save under way: a newer copy -- one already in the folder stamped ahead of this clock, or another writer's -- is loaded while a save writes, and the save, landing, records the board saved against its own copy while the screen shows the copy loaded; a refresh that began before the save started loads it too",
+    find: "  if(_saveBusy){\n    if(!quiet) setStat('⏳ <b>Nothing was loaded</b> from the shared folder",
+    repl: "  if(false){\n    if(!quiet) setStat('⏳ <b>Nothing was loaded</b> from the shared folder" },
+  { id: "v200-u13-base-while-saving", area: "driveStorePull", what: "with nothing recorded for the folder, a refresh during a save records the folder's copy as the one the work came from, so a save still to read the folder writes over that copy without asking",
+    find: "    if(!base){ if(!_saveBusy) driveBaseSet(mySlug(), theirs); }\n",
+    repl: "    if(!base) driveBaseSet(mySlug(), theirs);\n" },
+  { id: "v200-u13-pull-unchecked", area: "driveStorePull", what: "every v2.00 (U13) check removed: the refresh loads a newer copy while a save writes (and records a copy as the base) as before U13, and the save lands recording the board saved against its own copy while the screen shows the copy loaded",
+    find: "    if(!base){ if(!_saveBusy) driveBaseSet(mySlug(), theirs); }\n    else if(theirs!==base){ driveClashSay(j, false); render(); }\n    return false;\n  }\n  if(DIRTY){\n    // UNSAVED WORK BEATS A NEWER FOLDER COPY. Adopting here would look exactly like the board\n    // losing what somebody had just typed.\n    setStat('⚠ <b>'+esc(j.by||'someone')+'</b> saved '+esc(APPN_LBL[mySlug()]||mySlug())\n      +' to the shared folder '+esc(liveAge(theirs))+', and you have unsaved changes. '\n      +'Nothing was replaced. Save yours, or reload to take theirs.');\n    render(); return false;\n  }\n  // THE EMPTY TEMPLATE HAS NO REQUIREMENTS UNTIL IT REOPENS. `DATA` is a const resolved at boot,\n  // so on the SHELL the folder's copy is persisted and the page reopened once - the same thing the\n  // routed import does. Only when the copy carries requirement data, or this would loop.\n  // A COPY WITH NO REQUIREMENT DATA IS NEVER ADOPTED, by any board. An empty template that saved\n  // before it had loaded anything would otherwise hand every full board a \"newer\" copy with nothing\n  // in it, and a board with no years cannot even draw itself. Nothing is changed here.\n  if(!_hasPack(j.store)){\n    setStat('⚠ The shared folder’s copy of '+esc(APPN_LBL[mySlug()]||mySlug())\n      +' carries no requirement data, so it was not loaded'\n      +(IS_SHELL? ', and this empty template cannot open it.' : ' — this board keeps its own.')\n      +' It needs to be saved once from a board that holds the requirements.');\n    render(); return false;\n  }\n  // v2.00 (U13, Brad 12 Oct): NOT WHILE A SAVE IS UNDER WAY -- checked here, after the last wait and before anything is\n  // changed, so a save that started while the folder was being read is seen too. A save that lands records the copy IT\n  // wrote as the one the work on screen came from, and marks the board saved: a copy loaded while it was writing stayed on\n  // screen recorded as saved, with the save's copy in the folder, and the next refresh and a reopen said nothing. Now\n  // nothing is changed -- what is on screen, the work kept aside and this browser's record stay exactly as they were -- and\n  // the next refresh once the save has finished decides afresh. A quiet refresh (the Live timer) says nothing, as it does\n  // when there is nothing newer; a Connect says so, in words that stay true once the save has landed.\n  if(_saveBusy){\n    if(!quiet) setStat('⏳ <b>Nothing was loaded</b> from the shared folder",
+    repl: "    if(!base) driveBaseSet(mySlug(), theirs);\n    else if(theirs!==base){ driveClashSay(j, false); render(); }\n    return false;\n  }\n  if(DIRTY){\n    // UNSAVED WORK BEATS A NEWER FOLDER COPY. Adopting here would look exactly like the board\n    // losing what somebody had just typed.\n    setStat('⚠ <b>'+esc(j.by||'someone')+'</b> saved '+esc(APPN_LBL[mySlug()]||mySlug())\n      +' to the shared folder '+esc(liveAge(theirs))+', and you have unsaved changes. '\n      +'Nothing was replaced. Save yours, or reload to take theirs.');\n    render(); return false;\n  }\n  // THE EMPTY TEMPLATE HAS NO REQUIREMENTS UNTIL IT REOPENS. `DATA` is a const resolved at boot,\n  // so on the SHELL the folder's copy is persisted and the page reopened once - the same thing the\n  // routed import does. Only when the copy carries requirement data, or this would loop.\n  // A COPY WITH NO REQUIREMENT DATA IS NEVER ADOPTED, by any board. An empty template that saved\n  // before it had loaded anything would otherwise hand every full board a \"newer\" copy with nothing\n  // in it, and a board with no years cannot even draw itself. Nothing is changed here.\n  if(!_hasPack(j.store)){\n    setStat('⚠ The shared folder’s copy of '+esc(APPN_LBL[mySlug()]||mySlug())\n      +' carries no requirement data, so it was not loaded'\n      +(IS_SHELL? ', and this empty template cannot open it.' : ' — this board keeps its own.')\n      +' It needs to be saved once from a board that holds the requirements.');\n    render(); return false;\n  }\n  // v2.00 (U13, Brad 12 Oct): NOT WHILE A SAVE IS UNDER WAY -- checked here, after the last wait and before anything is\n  // changed, so a save that started while the folder was being read is seen too. A save that lands records the copy IT\n  // wrote as the one the work on screen came from, and marks the board saved: a copy loaded while it was writing stayed on\n  // screen recorded as saved, with the save's copy in the folder, and the next refresh and a reopen said nothing. Now\n  // nothing is changed -- what is on screen, the work kept aside and this browser's record stay exactly as they were -- and\n  // the next refresh once the save has finished decides afresh. A quiet refresh (the Live timer) says nothing, as it does\n  // when there is nothing newer; a Connect says so, in words that stay true once the save has landed.\n  if(false){\n    if(!quiet) setStat('⏳ <b>Nothing was loaded</b> from the shared folder" },
   // v2.00 (R3, Brad 11 Oct): a save that lands under a locked view says it saved the working plan.
   { id: "v200-r3-landed-view-unsaid", area: "_driveStorePushRun", what: "a folder save that lands while a locked view is on screen says “🔒 Not kept — PB27 is a locked view. ✅ Saved …” again, naming no plan (or, quiet, leaves persist's refusal on screen)",
     find: "  if(CYCVIEW){ _cycRefusedAt=0; setStat('✅ <b>Saved the working plan</b> of '+esc(APPN_LBL[ap]||ap)+' FY'+(fy%100)+' to the shared folder — '\n    +Math.round(body.length/1024)+' KB, built before '+blLbl(CYCVIEW)+' was put on screen. '+blLbl(CYCVIEW)+' is a locked view: nothing in it '\n    +'is saved. Everyone sees the working plan on their next refresh.'+penNote+lateNote); render(); return true; }\n",
```

### audit-import.mjs (`diffs/audit-import.diff`; the added lines are exactly `src/u13-block.mjs.txt`)
```diff
--- a/tools/export-audit/audit-import.mjs
+++ b/tools/export-audit/audit-import.mjs
@@ -7458,6 +7458,296 @@
   await settleBoards();
 })();
 // ==== end v2.00 (U2) put back waits ====
+// ==== v2.00 (U13): a refresh during a save loads nothing ====
+// The folder's refresh -- the Live timer's, the bar's Connect, the opening's own connect -- loaded a newer folder copy while
+// a save was still writing. The save, landing, found nothing changed while it wrote, marked the board saved and recorded
+// the copy IT wrote as the one the work on screen came from: the copy loaded stayed on screen recorded as saved, the save's
+// copy was in the folder, and the next refresh and a reopen said nothing. No second writer is needed: a copy already in the
+// folder, stamped ahead of this machine's clock (Brad's other machine, its clock an hour fast), is "newer" than the save's
+// own copy. Now the refresh loads nothing while a save is under way -- checked after its last wait, just before it would
+// change anything -- and changes nothing: what is on screen and in browser storage, the record, the change count and the
+// work kept aside stay byte for byte as they were. A Connect says so; the Live timer says nothing. Once the save has
+// finished -- saved, failed, refused or canceled -- the next refresh is an ordinary one again.
+await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
+  const __bm = bootMark();
+  const name = 'v2.00 (U13) — a refresh during a save loads nothing';
+  try {
+  const { J, wire, KEY, status, qs, baseFile, folder, connect, gate, until, pause, lsOf } = W1H;
+  const F1 = baseFile('Brad', KEY.brad);
+  const NM = 'spmt-2027-om.json', HOUR = 3600000;
+  // Requirement A -- its note and its allocation, in dollars -- on screen, in a copy's text, in browser storage, kept aside.
+  const scr = ev => JSON.parse(ev(`JSON.stringify([String(S.notes.A||''), (S.alloc.A&&typeof S.alloc.A==='object')? S.alloc.A.v : (S.alloc.A==null? null : S.alloc.A)])`));
+  const inCopy = txt => { try { const j = JSON.parse(txt), st = j.store || j, y = (st.years || {})[st.cur] || {}, a = (y.alloc || {}).A;
+    return [String((y.notes || {}).A || ''), (a && typeof a === 'object') ? a.v : (a == null ? null : a)]; } catch (e) { return ['(unreadable)', null]; } };
+  const stored = ev => inCopy(ev('localStorage.getItem(_AP.key)'));
+  const kept = ev => { const s = ev(`localStorage.getItem(_AP.key+'.kept')`); return s == null ? null : inCopy(s.slice(s.indexOf('\n') + 1)); };
+  // The folder's copy, its time, and its history.
+  const head = fold => fold.raw(2027) == null ? ['(no copy)', null] : inCopy(fold.raw(2027));
+  const headTs = fold => { const j = fold.copy(2027); return j ? +((j.store && j.store.ts) || j.ts || 0) : 0; };
+  const inHist = (fold, c) => Object.values((fold.root.dirs.history || { files: {} }).files).some(t => J(inCopy(t)) === J(c));
+  // Saved, by all three -- this session (DIRTY), _baseDirty and this browser's record -- and the record names the folder's copy.
+  const saved = ev => JSON.parse(ev('JSON.stringify([DIRTY, _baseDirty, !!baseGet().dirty])')).every(x => !x);
+  const onHead = (ev, fold) => headTs(fold) > 0 && +ev('driveBaseOf(mySlug())') === headTs(fold);
+  // EVERYTHING A REFUSED REFRESH LEAVES AS IT WAS, byte for byte: what is on screen (MS), DIRTY, _baseDirty, the folder's time
+  // the work came from and this browser's record of it, the change count every save checks (_saveGen), the work kept aside,
+  // and what browser storage holds.
+  const state = ev => ev(`JSON.stringify([JSON.stringify(MS), DIRTY, _baseDirty, JSON.stringify(_driveBase), localStorage.getItem(_AP.key+'.base'), _saveGen, localStorage.getItem(_AP.key+'.kept'), localStorage.getItem(_AP.key)])`);
+  const writes = fold => fold.log.filter(x => /^(main|hist):/.test(x)).length;   // the folder's copy and its history (not the lock)
+  const live = ev => ev(`_liveCfg.on=true; _liveCfg.auto=true; _driveLive=true; 'ok'`);   // working out of the folder turns these on
+  const said = st => /Nothing was loaded/.test(st) && /a save was under way/.test(st) && /Nothing was changed/.test(st)
+    && /checked again on the next refresh once the save has finished/.test(st);
+  // REMOTE: requirement A's note REMOTE, $650, saved into an empty folder through the product by Brad's other machine, whose
+  // clock runs `ahead` (its own window's Date.now). Its bytes are what each case's own folder starts with.
+  const writeRemote = async ahead => {
+    const f0 = folder(), R = boot({ html: F1 }); await pause(80); wire(R.ev, 'Brad', KEY.brad); connect(R.ev, R.w, f0);
+    if (ahead) R.ev(`(function(){ var real=Date.now; Date.now=function(){ return real.call(Date)+${ahead}; }; return 'ok'; })()`);
+    R.ev(`setNote('A','REMOTE'); setAlloc('A','650'); 'ok'`); await R.ev('saveInPlace()'); await pause(5);
+    return f0.raw(2027);
+  };
+  const withCopy = txt => { const fold = folder(); fold.root.files[NM] = txt; return fold; };
+  const tsOf = txt => { const j = JSON.parse(txt); return +((j.store && j.store.ts) || j.ts || 0); };
+  const REMOTE = await writeRemote(HOUR);
+  chk(name, 'the fixture', 'REMOTE is the folder’s copy: REMOTE, $650, saved by Brad, stamped more than 59 minutes ahead of this clock (a CONTROL)',
+    J([...inCopy(REMOTE), JSON.parse(REMOTE).by, tsOf(REMOTE) - Date.now() > 59 * 60000]), J(['REMOTE', 650, 'Brad', true]));
+  // BRAD opens the board with REMOTE in the folder, and his opening loads it. He types WORKING, $700, and closes it unsaved.
+  const brad = async txt => {
+    const fold = withCopy(txt), A = boot({ html: F1 }); await pause(80); wire(A.ev, 'Brad', KEY.brad); connect(A.ev, A.w, fold);
+    await A.ev('driveAutoConnect()'); await pause(5);
+    const v = [...scr(A.ev), saved(A.ev), onHead(A.ev, fold)];
+    A.ev(`setNote('A','WORKING'); setAlloc('A','700'); 'ok'`); await pause(5);
+    return { v, LS: lsOf(A.ev), A, fold };
+  };
+  const b1 = await brad(REMOTE);
+  chk(name, 'the fixture', 'Brad’s opening loads REMOTE: on screen, saved, recorded against the folder’s copy (a CONTROL)', J(b1.v), J(['REMOTE', 650, true, true]));
+  // BRAD REOPENS the board: his browser (WORKING unsaved in it, recorded against REMOTE) and a folder holding REMOTE, connected
+  // by the harness (no opening pull) -- or, `perm`, with the folder's edit permission not kept: the opening's own connect
+  // stops at one click, and 💾 Save asks for the permission itself.
+  const reopen = async (fold, perm, ls) => {
+    const B = boot({ html: F1, ls: { ...(ls || b1.LS) } }); await pause(80); wire(B.ev, 'Brad', KEY.brad);
+    if (perm) { fold.perm = 'prompt'; fold.dir.queryPermission = async () => fold.perm; fold.dir.requestPermission = async () => (fold.perm = 'granted'); }
+    connect(B.ev, B.w, fold); B.ev(`_liveCfg.folder='shared'; 'ok'`);   // the folder's name, as its pick stored it (a Connect needs it)
+    const c = perm ? await B.ev('driveAutoConnect()') : null; await pause(5);
+    return { B, c };
+  };
+  // 💾 Save, held at the close of its write of the folder's copy: by then it has read the folder, kept the copy it replaces
+  // in the history and built its bytes.
+  const held = async (B, fold) => {
+    const n0 = fold.hits.main || 0; fold.hold.main = gate(); const g = fold.hold.main;
+    const p = B.ev('saveInPlace()'); const ok = await until(() => (fold.hits.main || 0) > n0);
+    return { g, p, ok };
+  };
+  // The save, or a refresh, held at its read of the folder's copy (the first read after this), or at its first wait -- the
+  // folder asked what this page may do (the first ask after this).
+  const holdRead = fold => { const gh = fold.dir.getFileHandle, g = gate(); let hit = 0;
+    fold.dir.getFileHandle = async (n, o) => { if (!hit && n === NM && !(o && o.create)) { hit = 1; await g.p; } return gh(n, o); };
+    return { g, hit: () => hit }; };
+  const holdAsk = fold => { const q = fold.dir.queryPermission, g = gate(); let hit = 0;
+    fold.dir.queryPermission = async m => { if (!hit) { hit = 1; await g.p; } return q(m); };
+    return { g, hit: () => hit }; };
+  // ONE REFRESH WHILE A SAVE IS UNDER WAY: what it returned, that a save was under way, that nothing changed (against `s0`,
+  // read once the save was held), what it wrote to the folder's copy or its history, and what it said -- a quiet refresh
+  // nothing, a Connect that nothing was loaded and why.
+  const REFRESH = { pull: 'driveStorePull(true)', connect: 'driveConnectNow()', auto: 'driveAutoConnect()', tick: 'liveTick()' };
+  const refresh = async (B, fold, how, s0) => {
+    if (how === 'tick') live(B.ev);
+    const st0 = status(B.ev), w0 = writes(fold);
+    const r = await B.ev(REFRESH[how]); await pause(5);
+    const st = status(B.ev), quiet = how === 'pull' || how === 'tick';
+    return [r === undefined ? '(nothing)' : r, B.ev('_saveBusy') > 0, state(B.ev) === s0, writes(fold) - w0, quiet ? st === st0 : said(st)];
+  };
+  const RQ = ': loads nothing -- [returned, a save under way, nothing changed byte for byte, writes to the folder’s copy or history, said]';
+  const EXPECT = { pull: [false, true, true, 0, true], connect: [true, true, true, 0, true], auto: [true, true, true, 0, true], tick: ['(nothing)', true, true, 0, true] };
+  // ONCE THE SAVE HAS LANDED: a later refresh changes nothing, and a reopen (this browser, the same folder, the opening's own
+  // connect, then a refresh) opens `want`, which the folder's copy holds, saved and recorded against it.
+  const landedThen = async (B, fold, sc, want) => {
+    const s1 = state(B.ev); const pulled = await B.ev('driveStorePull(true)'); live(B.ev); await B.ev('liveTick()'); await pause(5);
+    chk(name, sc, 'then a refresh (driveStorePull, the Live tick): nothing loaded, nothing changed', J([pulled, state(B.ev) === s1]), J([false, true]));
+    const C = boot({ html: F1, ls: lsOf(B.ev) }); await pause(80); wire(C.ev, 'Brad', KEY.brad); connect(C.ev, C.w, fold);
+    await C.ev('driveAutoConnect()'); const again = await C.ev('driveStorePull(true)'); await pause(5);
+    chk(name, sc, 'then reopened (the opening’s connect, then a refresh): on screen, in the folder’s copy, saved and recorded against it; nothing kept aside',
+      J([again, ...scr(C.ev), ...head(fold), saved(C.ev), onHead(C.ev, fold), kept(C.ev)]), J([false, ...want, ...want, true, true, null]));
+  };
+  // (1) NO SECOND WRITER. Brad reopens with WORKING unsaved; 💾 Save is held at its write; while it is held every refresh runs
+  // in turn -- driveStorePull(true), the bar's Connect, the opening's own connect, the Live timer's tick -- and each loads
+  // nothing. The save then lands. Reopened by the harness, and with the folder's edit permission not kept.
+  for (const perm of [false, true]) {
+    const sc = '(1) no second writer; reopened ' + (perm ? 'with the folder’s edit permission not kept' : 'by the harness');
+    const fold = withCopy(REMOTE); const { B, c } = await reopen(fold, perm);
+    chk(name, sc, 'WORKING on screen, unsaved by this browser’s record (not this session), recorded against REMOTE, nothing kept aside; REMOTE the folder’s copy'
+      + (perm ? '; the opening stopped at one click' : '') + ' (a CONTROL)',
+      J([...scr(B.ev), B.ev('DIRTY'), !!B.ev('baseGet().dirty'), +B.ev('driveBaseOf(mySlug())') === tsOf(REMOTE), kept(B.ev), ...head(fold), ...(perm ? [c, B.ev('_driveNeed')] : [])]),
+      J(['WORKING', 700, false, true, true, null, 'REMOTE', 650, ...(perm ? [false, 'click'] : [])]));
+    const h = await held(B, fold); const s0 = state(B.ev);
+    chk(name, sc, 'the save is held at its write; REMOTE is still the folder’s copy, stamped after the save’s own (a CONTROL)',
+      J([h.ok, B.ev('_saveBusy'), ...head(fold), headTs(fold) > +B.ev('MS.ts')]), J([true, 1, 'REMOTE', 650, true]));
+    for (const how of ['pull', 'connect', 'auto', 'tick'])
+      chk(name, sc, 'while the save is held, ' + REFRESH[how] + RQ, J(await refresh(B, fold, how, s0)), J(EXPECT[how]));
+    h.g.open(); await h.p; await pause(5);
+    chk(name, sc, 'once the save lands: WORKING on screen, in browser storage and the folder’s copy; saved, recorded against it; REMOTE in the folder’s history; nothing kept aside',
+      J([...scr(B.ev), ...stored(B.ev), ...head(fold), saved(B.ev), onHead(B.ev, fold), inHist(fold, ['REMOTE', 650]), kept(B.ev)]),
+      J(['WORKING', 700, 'WORKING', 700, 'WORKING', 700, true, true, true, null]));
+    await landedThen(B, fold, sc, ['WORKING', 700]);
+  }
+  // (2) A SECOND WRITER SAVES DURING BRAD'S SAVE. Brad has saved BRAD-1, $700; Bob loads it and types BOB-2, $650. Brad presses
+  // 💾 Save with nothing unsaved and it is held at its write; Bob takes the pen, which saves BOB-2 into the folder at once.
+  // Brad's refresh loads nothing, and his save lands. It writes BRAD-1 over BOB-2, which is then in no copy in the folder
+  // (U18, open; not this block's) -- Bob's own board still holds it.
+  { const sc = '(2) a second writer saves during the save';
+    const fold = folder(), A = boot({ html: F1 }); await pause(80); wire(A.ev, 'Brad', KEY.brad); connect(A.ev, A.w, fold);
+    A.ev(`_liveCfg.folder='shared'; setNote('A','BRAD-1'); setAlloc('A','700'); 'ok'`); await A.ev('saveInPlace()'); await pause(5);
+    const Bb = boot({ html: F1 }); await pause(80); wire(Bb.ev, 'Bob', KEY.bob); connect(Bb.ev, Bb.w, fold);
+    await Bb.ev('driveStorePull(false)'); Bb.ev(`setNote('A','BOB-2'); setAlloc('A','650'); 'ok'`); await pause(5);
+    chk(name, sc, 'Brad: BRAD-1 saved, the folder’s copy; Bob loaded it and typed BOB-2 (a CONTROL)',
+      J([...scr(A.ev), saved(A.ev), ...head(fold), ...scr(Bb.ev)]), J(['BRAD-1', 700, true, 'BRAD-1', 700, 'BOB-2', 650]));
+    const h = await held(A, fold); const s0 = state(A.ev); await pause(5);   // Bob's copy is stamped after Brad's
+    await Bb.ev('takePen()'); await pause(5);
+    chk(name, sc, 'while Brad’s save is held, Bob takes the pen: BOB-2 is the folder’s copy, saved by Bob, stamped after Brad’s save built its own (a CONTROL)',
+      J([h.ok, ...head(fold), fold.copy(2027).by, headTs(fold) > +A.ev('MS.ts')]), J([true, 'BOB-2', 650, 'Bob', true]));
+    for (const how of ['pull', 'connect', 'tick'])
+      chk(name, sc, 'while the save is held, ' + REFRESH[how] + RQ, J(await refresh(A, fold, how, s0)), J(EXPECT[how]));
+    h.g.open(); await h.p; await pause(5);
+    chk(name, sc, 'once Brad’s save lands: BRAD-1 on screen, in browser storage and the folder’s copy; saved, recorded against it; nothing kept aside',
+      J([...scr(A.ev), ...stored(A.ev), ...head(fold), saved(A.ev), onHead(A.ev, fold), kept(A.ev)]), J(['BRAD-1', 700, 'BRAD-1', 700, 'BRAD-1', 700, true, true, null]));
+    await landedThen(A, fold, sc, ['BRAD-1', 700]);
+    chk(name, sc, 'Bob’s own board still holds BOB-2, on screen and in its browser storage', J([...scr(Bb.ev), ...stored(Bb.ev)]), J(['BOB-2', 650, 'BOB-2', 650]));
+  }
+  // (3) THE CHECK IS MADE AFTER THE REFRESH'S WAITS. The refresh starts with no save under way and is held -- (a) at its read
+  // of the folder's copy, (b) at its first wait, the folder asked what this page may do; 💾 Save starts meanwhile and is held
+  // at its write; then the refresh is let go. A refresh that checked only when it started would load REMOTE here.
+  for (const [k, how, holdOf, at] of [['a', 'driveStorePull(false)', holdRead, 'its read of the folder’s copy'], ['b', 'driveStorePull(true)', holdAsk, 'its first wait (the folder’s permission)']]) {
+    const sc = '(3' + k + ') the refresh held at ' + at + '; a save starts meanwhile';
+    const fold = withCopy(REMOTE); const { B } = await reopen(fold, false);
+    const busy0 = B.ev('_saveBusy'), st0 = status(B.ev), hr = holdOf(fold);
+    const pr = B.ev(how); const reached = await until(() => hr.hit());
+    const h = await held(B, fold); const s0 = state(B.ev);
+    hr.g.open(); const r = await pr; await pause(5);
+    chk(name, sc, 'no save under way when the refresh started; it waited; the save started and is held at its write (a CONTROL)',
+      J([busy0, reached, h.ok, B.ev('_saveBusy')]), J([0, true, true, 1]));
+    chk(name, sc, 'the refresh, let go, loads nothing -- [returned, nothing changed byte for byte, ' + (k === 'a' ? 'said' : 'nothing said') + ']',
+      J([r, state(B.ev) === s0, k === 'a' ? said(status(B.ev)) : status(B.ev) === st0]), J([false, true, true]));
+    h.g.open(); await h.p; await pause(5);
+    chk(name, sc, 'once the save lands: WORKING on screen and the folder’s copy, saved, recorded against it; REMOTE in the folder’s history; nothing kept aside',
+      J([...scr(B.ev), ...head(fold), saved(B.ev), onHead(B.ev, fold), inHist(fold, ['REMOTE', 650]), kept(B.ev)]), J(['WORKING', 700, 'WORKING', 700, true, true, true, null]));
+  }
+  // (3c) NOTHING RECORDED FOR THE FOLDER (a browser that has not loaded from it): a refresh takes a copy that is not newer
+  // than the screen as the one the work came from -- but not while a save is under way, or a save still to read the folder
+  // finds it recorded and writes over it without asking. Brad's other browser has saved X, $600; this browser types MINE,
+  // $720; 💾 Save waits at its read of the folder while the opening's own connect runs. The save then asks, as it does when
+  // nothing is recorded.
+  { const sc = '(3c) nothing recorded for the folder; the opening’s connect while a save waits at its read';
+    const fold = folder(), X = boot({ html: F1 }); await pause(80); wire(X.ev, 'Brad', KEY.brad); connect(X.ev, X.w, fold);
+    X.ev(`setNote('A','X'); setAlloc('A','600'); 'ok'`); await X.ev('saveInPlace()'); await pause(5);
+    const C = boot({ html: F1 }); await pause(80); wire(C.ev, 'Brad', KEY.brad); connect(C.ev, C.w, fold);
+    C.ev(`setNote('A','MINE'); setAlloc('A','720'); 'ok'`); await pause(5);
+    chk(name, sc, 'nothing recorded for the folder; MINE on screen, unsaved; X the folder’s copy, stamped before MINE was typed (a CONTROL)',
+      J([+C.ev('driveBaseOf(mySlug())'), ...scr(C.ev), C.ev('DIRTY'), ...head(fold), headTs(fold) < +C.ev('MS.ts')]), J([0, 'MINE', 720, true, 'X', 600, true]));
+    const hr = holdRead(fold); const p = C.ev('saveInPlace()'); const reached = await until(() => hr.hit());
+    const s0 = state(C.ev); await C.ev('driveAutoConnect()'); await pause(5);
+    chk(name, sc, 'the opening’s connect while the save waits at its read -- [the save waits, a save under way, nothing changed byte for byte: nothing recorded]',
+      J([reached, C.ev('_saveBusy'), state(C.ev) === s0]), J([true, 1, true]));
+    hr.g.open(); await p; await pause(5);
+    chk(name, sc, 'then the save, finding nothing recorded, asks: nothing written, X still the folder’s copy, MINE on screen and unsaved, the choice offered',
+      J([...head(fold), ...scr(C.ev), C.ev('DIRTY'), /Nothing was written/.test(status(C.ev)), /Save yours over theirs/.test(status(C.ev))]), J(['X', 600, 'MINE', 720, true, true, true]));
+  }
+  // (4) ONCE THE SAVE HAS FINISHED, THE NEXT REFRESH IS AN ORDINARY ONE. A refresh loads nothing while the save runs; the save
+  // then (a) lands, and Brad's other browser saves NEWER, $750, after it; (b) fails, the folder refusing its write; (c) is
+  // refused, NEWER having been saved before it read the folder; (d) is canceled, the folder's copy having no writer recorded.
+  // The next refresh loads the newer copy, keeping aside work no saved copy has, and the record names what is on screen.
+  const other = async (fold, note, amt) => {   // Brad's other browser: loads the folder's copy, types, saves
+    const N = boot({ html: F1 }); await pause(80); wire(N.ev, 'Brad', KEY.brad); connect(N.ev, N.w, fold);
+    await N.ev('driveStorePull(false)'); N.ev(`setNote('A',${J(note)}); setAlloc('A',${J(String(amt))}); 'ok'`); await N.ev('saveInPlace()'); await pause(5);
+  };
+  { const sc = '(4a) the save lands; a newer copy is saved after it';
+    const fold = withCopy(REMOTE); const { B } = await reopen(fold, false);
+    const h = await held(B, fold); const s0 = state(B.ev);
+    chk(name, sc, 'while the save is held, ' + REFRESH.tick + RQ, J(await refresh(B, fold, 'tick', s0)), J(EXPECT.tick));
+    h.g.open(); await h.p; await pause(5);
+    await other(fold, 'NEWER', 750);
+    chk(name, sc, 'the save landed (WORKING, saved); then Brad’s other browser loaded WORKING and saved NEWER over it (a CONTROL)',
+      J([...scr(B.ev), saved(B.ev), B.ev('_saveBusy'), ...head(fold), inHist(fold, ['WORKING', 700])]), J(['WORKING', 700, true, 0, 'NEWER', 750, true]));
+    const r = await B.ev('driveStorePull(true)'); await pause(5);
+    chk(name, sc, 'the next refresh loads NEWER: on screen and in browser storage, saved, recorded against the folder’s copy; nothing kept aside (WORKING is saved, in the history)',
+      J([r, ...scr(B.ev), ...stored(B.ev), saved(B.ev), onHead(B.ev, fold), kept(B.ev)]), J([true, 'NEWER', 750, 'NEWER', 750, true, true, null]));
+  }
+  { const sc = '(4b) the save fails: the folder refuses its write';
+    const fold = withCopy(REMOTE); const { B } = await reopen(fold, false);
+    const h = await held(B, fold); const s0 = state(B.ev);
+    chk(name, sc, 'while the save is held, ' + REFRESH.pull + RQ, J(await refresh(B, fold, 'pull', s0)), J(EXPECT.pull));
+    fold.failNext.main = new Error('The shared folder is read-only'); h.g.open(); await h.p; await pause(5);
+    chk(name, sc, 'the save failed and says so: REMOTE still the folder’s copy; WORKING on screen, unsaved; no save under way (read from _saveBusy) (a CONTROL)',
+      J([/Could not save to the shared folder/.test(status(B.ev)), ...head(fold), ...scr(B.ev), saved(B.ev), B.ev('_saveBusy')]), J([true, 'REMOTE', 650, 'WORKING', 700, false, 0]));
+    const r = await B.ev('driveStorePull(true)'); await pause(5);
+    chk(name, sc, 'the next refresh is an ordinary one: REMOTE, later than what is on screen, is loaded, saved and recorded against the folder’s copy; WORKING, in no saved copy, kept aside',
+      J([r, ...scr(B.ev), saved(B.ev), onHead(B.ev, fold), kept(B.ev)]), J([true, 'REMOTE', 650, true, true, ['WORKING', 700]]));
+  }
+  { const sc = '(4c) the save is refused: a newer copy was saved before it read the folder';
+    const fold = withCopy(REMOTE); const { B } = await reopen(fold, false);
+    await other(fold, 'NEWER', 750);
+    chk(name, sc, 'Brad’s other browser loaded REMOTE and saved NEWER over it; REMOTE in the folder’s history (a CONTROL)',
+      J([...head(fold), inHist(fold, ['REMOTE', 650])]), J(['NEWER', 750, true]));
+    const hr = holdRead(fold); const p = B.ev('saveInPlace()'); await until(() => hr.hit()); const s0 = state(B.ev);
+    chk(name, sc, 'while the save waits at its read, ' + REFRESH.tick + RQ, J(await refresh(B, fold, 'tick', s0)), J(EXPECT.tick));
+    hr.g.open(); await p; await pause(5);
+    chk(name, sc, 'the save is refused and says so: nothing written, NEWER still the folder’s copy; WORKING on screen, unsaved; no save under way (a CONTROL)',
+      J([/Nothing was written/.test(status(B.ev)), ...head(fold), ...scr(B.ev), saved(B.ev), B.ev('_saveBusy')]), J([true, 'NEWER', 750, 'WORKING', 700, false, 0]));
+    await B.ev('liveTick()'); await pause(5);
+    chk(name, sc, 'the next refresh (the Live tick) is an ordinary one: NEWER is loaded, saved and recorded against the folder’s copy; WORKING, in no saved copy, kept aside',
+      J([...scr(B.ev), saved(B.ev), onHead(B.ev, fold), kept(B.ev)]), J(['NEWER', 750, true, true, ['WORKING', 700]]));
+  }
+  { const sc = '(4d) the save is canceled: the folder’s copy has no writer recorded, and Brad answers Cancel';
+    const j = JSON.parse(REMOTE); delete j.writer;   // REMOTE as a board before v1.95 wrote it: no writer recorded
+    const fold = withCopy(JSON.stringify(j)); const { B } = await reopen(fold, false);
+    const hr = holdRead(fold); const p = B.ev('globalThis.__yes=false; saveInPlace()'); await until(() => hr.hit()); const s0 = state(B.ev);
+    chk(name, sc, 'while the save waits at its read, ' + REFRESH.connect + RQ, J(await refresh(B, fold, 'connect', s0)), J(EXPECT.connect));
+    const q0 = qs(B.ev).length; hr.g.open(); await p; await pause(5);
+    chk(name, sc, 'the save asked once and was canceled: nothing written, REMOTE still the folder’s copy; WORKING on screen, unsaved; no save under way (a CONTROL)',
+      J([qs(B.ev).length - q0, /Save canceled — nothing written/.test(status(B.ev)), ...head(fold), ...scr(B.ev), saved(B.ev), B.ev('_saveBusy')]),
+      J([1, true, 'REMOTE', 650, 'WORKING', 700, false, 0]));
+    B.ev(`globalThis.__yes=true; 'ok'`); const r = await B.ev('driveStorePull(true)'); await pause(5);
+    chk(name, sc, 'the next refresh is an ordinary one: REMOTE, later than what is on screen, is loaded, saved and recorded against the folder’s copy; WORKING, in no saved copy, kept aside',
+      J([r, ...scr(B.ev), saved(B.ev), onHead(B.ev, fold), kept(B.ev)]), J([true, 'REMOTE', 650, true, true, ['WORKING', 700]]));
+  }
+  // (5) CONTROLS. (Cc) No save under way: the refresh loads REMOTE as it always has, keeping WORKING aside. (Cb) Work typed in
+  // this session: the refresh during the save gives the unsaved-changes message as it always has. (Ca) REMOTE not stamped
+  // ahead: nothing to load, during the save or after.
+  { const sc = '(5) Cc: no save under way';
+    const fold = withCopy(REMOTE); const { B } = await reopen(fold, false);
+    const r = await B.ev('driveStorePull(true)'); await pause(5);
+    chk(name, sc, 'the refresh loads REMOTE as before: on screen and in browser storage, saved, recorded against the folder’s copy; WORKING kept aside, and said',
+      J([r, B.ev('_saveBusy'), ...scr(B.ev), ...stored(B.ev), saved(B.ev), onHead(B.ev, fold), kept(B.ev), /kept aside/.test(status(B.ev))]),
+      J([true, 0, 'REMOTE', 650, 'REMOTE', 650, true, true, ['WORKING', 700], true]));
+  }
+  { const sc = '(5) Cb: work typed in this session; a refresh during the save';
+    const { A, fold } = b1; A.ev(`_liveCfg.folder='shared'; 'ok'`);
+    chk(name, sc, 'WORKING typed in this session, unsaved (DIRTY) (a CONTROL)', J([...scr(A.ev), A.ev('DIRTY')]), J(['WORKING', 700, true]));
+    const h = await held(A, fold); const s0 = state(A.ev);
+    const r = await A.ev('driveStorePull(true)'); await pause(5); const st = status(A.ev);
+    chk(name, sc, 'while the save is held, the refresh gives the unsaved-changes message as before, and changes nothing',
+      J([r, state(A.ev) === s0, /and you have unsaved changes\. Nothing was replaced\. Save yours, or reload to take theirs\./.test(st), /Nothing was loaded/.test(st)]),
+      J([false, true, true, false]));
+    h.g.open(); await h.p; await pause(5);
+    chk(name, sc, 'once the save lands: WORKING on screen and the folder’s copy, saved, recorded against it',
+      J([...scr(A.ev), ...head(fold), saved(A.ev), onHead(A.ev, fold)]), J(['WORKING', 700, 'WORKING', 700, true, true]));
+  }
+  { const sc = '(5) Ca: REMOTE not stamped ahead';
+    const REMOTE0 = await writeRemote(0), b0 = await brad(REMOTE0);
+    const fold = withCopy(REMOTE0); const { B } = await reopen(fold, false, b0.LS);
+    chk(name, sc, 'Brad’s opening loaded REMOTE (saved, recorded against it); reopened with WORKING unsaved (a CONTROL)',
+      J([...b0.v, ...scr(B.ev), !!B.ev('baseGet().dirty')]), J(['REMOTE', 650, true, true, 'WORKING', 700, true]));
+    const h = await held(B, fold); const s0 = state(B.ev);
+    chk(name, sc, 'while the save is held, REMOTE is not later than the save’s own copy, and the refresh loads nothing, as before',
+      J([headTs(fold) < +B.ev('MS.ts'), await B.ev('driveStorePull(true)'), state(B.ev) === s0]), J([true, false, true]));
+    h.g.open(); await h.p; await pause(5);
+    chk(name, sc, 'once the save lands: WORKING on screen and the folder’s copy, saved, recorded against it; REMOTE in the folder’s history; nothing kept aside',
+      J([...scr(B.ev), ...head(fold), saved(B.ev), onHead(B.ev, fold), inHist(fold, ['REMOTE', 650]), kept(B.ev)]), J(['WORKING', 700, 'WORKING', 700, true, true, true, null]));
+  }
+  } catch (e) {
+    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.stack) || e).slice(0, 300), got: 'threw', want: 'ran' });
+  }
+  bootRelease(__bm, keepBoards());
+  await settleBoards();
+})();
+// ==== end v2.00 (U13) ====
 
 await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
   const __bm = bootMark();
```
