# U24 on 63bd8b0: other adoption paths during a held save (bounded reproductions with healthy controls)

Brad, 7:04 AM ET, 12 Oct: keep U24 unverified with severity provisional, add bounded reproductions with healthy controls, and
propose fixes separately rather than widening U13. This is that work, on the committed head `63bd8b0` (board `98eed7e8`, the
empty template). Every run was bounded.

**Final passes.** r2 and r3 ran 38 scenarios each on probe blob `6d3a0eb2`, in parallel, from 11:37:56 AM ET.
- Each pass gave 560 checks with 25 failures, and **all 25 are CONTRACT failures where one was predicted.** No FIX, HOLD or PRED
  check failed.
- r2 and r3 agree on all 560 checks, in verdict and in observed value (`src/cmp-passes.mjs`).

An earlier pass, r1, ran the first 32 scenarios on probe blob `035db96c`, from 11:32:03 AM ET. The two blobs differ only by the
six clean-start scenarios added after it.
- r1 gave 475 checks with 20 failures: 6 are the six later scenarios, absent from r1; 14 are CONTRACT failures.
- On the 469 checks r1 shares with r2, the two passes are identical.

Checks: `logs/check-r1.log`, `logs/check-r2.log`, `logs/check-r3.log`, and `out/checks-<pass>.json`.

## Verdict: REPRODUCED on three of the four entry points, in the modes and under the conditions below. NOT REPRODUCED for `importBoards`. INCONCLUSIVE for `bootTakeFile` in folder mode.

| path (how a person reaches it) | held **folder** save | held **board-file** save |
|---|---|---|
| `adoptShared`: the link "load the shared one" in the status line | **REPRODUCED** (SHc-fold-W). The controls are healthy. | **REPRODUCED** (SHc-file-W). The controls are healthy. |
| `sharedArrived`: the page's own answer from the shared state file arriving | **REPRODUCED, and it persists** through a refresh and a reopen (SHa-fold-W). Its prerequisites are the state file stamped at or after the save's stamp, and the answer arriving during the save. The controls are healthy, including Wnow, a file stamped before the save, which is not adopted. | **NOT REPRODUCED.** The file save's own `save()` sets `DIRTY` before the bytes are built, so the DIRTY guard refuses (SHa-file-W). Held at the save's read, the answer is adopted before the bytes are built and is written consistently (SHa-file-Wread). |
| `bootTakeFile`: the button "open the file's version" in the status line, offered when an opening holds the file back | **INCONCLUSIVE for U24.** The W end state is falsely clean, but so is the no-save control (BT-fold-C1): in folder mode `bootTakeFile` itself records the file's copy and leaves the folder record clean (O1). | **REPRODUCED** (BT-file-W). The controls are healthy. The button disappears as soon as the save lands (BT-file-C3), so the offer's own advice, "open the file's version once yours is saved", can only be followed **during** the save. |
| `importBoards`: 📁 File › Boards and appropriations › ⇊ Import several boards at once… | **NOT REPRODUCED.** It **is** counted: `lsAll` → `lsSet` → `fileMark('board')` → `_saveGen++`, `DIRTY=true` (L2246–2250, L2261–2268). The save lands with "A change made while it was saving is not in the folder yet" (IB-fold-W, IB-fold-Wclean). | **NOT REPRODUCED**, for the same reason (IB-file-W, IB-file-Wclean). |

**Scope of path A's reproduction.** It holds when the record is dirty before the save starts. That is the ordinary reason to
press 💾 Save: work typed this session, or unsaved work carried over from the last one. From a **clean** record the sidecar's
loads are falsely clean **with no save at all** (SHc-fold-C1clean, SHc-file-C1clean, SHa-fold-C1clean, SHa-file-C1clean). Those
controls are unhealthy, so the clean-start W variants (SHc-fold-Wclean, SHa-fold-Wclean) are not attributed to the save. This is
observation O4, pre-existing.

**What "falsely clean" means here.** It is U13's contract, measured at three points:
- K1, the end state; K2, after a quiet refresh (folder mode); K3, after a reopen from the end state.
- The board is falsely clean when `DIRTY`, `_baseDirty` and the record's `dirty` are all false while the screen's content differs
  from the copy the record names as base. In folder mode that copy is the folder copy (head or history) whose time is
  `driveBaseOf(om)`. In file mode it is the file content whose `fileTs` is the record's `file`.
- **REACH** asks that each leaf content stays in a copy the board holds or fetches, at the end, after the reopen, and after one
  ordinary edit following it.

**Severity: stays provisional.** At K1 nothing is lost in any reproduced route: every leaf is in a copy the board can reach.
Below, per route:
- **SHc-*-W.** BRAD-2 is in the kept slot and in the folder or file. SHARED is on screen, in storage, and in the state file.
- **BT-file-W.** BRAD-2 is in the file and KEPT-0 is in the kept slot. CAROL-F is on screen and in storage.
  - A reopen silently opens the file's BRAD-2 and does not keep CAROL-F aside. After one edit, CAROL-F remains only in the file's
    earlier versions (Teams version history, outside the board).
  - CAROL-F leaves the board's copies the same way in the healthy control BT-file-C2. There, the person answered HOLD ON with
    "overwrite anyway". So that loss is **not** attributed to the trigger.
- **SHa-fold-W** is the persistent case. The record stays falsely clean through a refresh and a reopen, like U13's no-second-writer
  case.
- **What could follow.** By the shape U17 describes, the next 💾 Save from such a state writes the screen's copy over a different
  copy without asking. That **was not measured here**. Its measurement on shortcut routes (calling the functions directly) is in
  `rec/L4/u17` (another session; see "Other evidence").

## How each path is reached (code at 98eed7e8; line numbers in `b63/prioritization-board-grid.html`)

**`sharedArrived`: called once per opening, never again.**
- The page's last line, `loadShared(sharedArrived)` (L31609), asks for the shared state file `prio-state-om.json` (`STATEFILE`,
  L2636).
- **Over http(s)** it asks with `fetch(STATEFILE,{cache:'no-store'})`. **On file://** it asks only when `localStorage.spmtSidecar
  === '1'` (an opt-in, L31535–31545), through an XHR.
- The answer is asynchronous. The code expects it "after somebody has typed" (comment at L31591). So a save is under way when it
  arrives if the person pressed 💾 Save before the answer came (a slow server or share).
- **What it does with the answer:**
  - `DIRTY` set: it replaces nothing and offers the link (L31594).
  - The answer is stamped at or after `MS.ts`: it **loads it** (L31600–31605). `sharedKeepMine` keeps unsaved work aside first.
  - Otherwise: it offers the link, "Your local changes are newer…".
- **In the probe** the page's `fetch` is a stub installed before the page parses (`bootX`), and its answer is released by the
  probe. Each run records the request it made: one call, `prio-state-om.json`, `no-store`.

**`adoptShared`: only the two status-line links that `sharedArrived` writes** (L31596, L31606), nothing else.
- The link stays on the status line during a save. Neither save writes the status line before its write when nothing is asked.
- The probe clicks the real `<button onclick="adoptShared()">` in `#shareStat`.

**`bootTakeFile`: only the two status-line buttons the opening writes** (L31480, L31489).
- They are written when the board file is newer than this browser's copy, this browser holds work no saved copy has, and that work
  cannot be kept aside: either other work is already kept (`_bootHeld.occupied`, used here) or there is no room.
- They are gone as soon as anything else is said on the status line. A landing save's "Saved" line is one such thing (measured:
  BT-file-C3, BT-fold-C3 → `BUTTONS:0`).
- **The probe builds the occupied state by ordinary use**, over three openings:
  1. Brad saves BRAD-1, types KEPT-0 and closes.
  2. Carol's copy CAROL-1 reaches the board file. Her browser cannot save in place, so she downloads it and copies it over the
     shared file; it keeps writer Brad. Brad's next opening keeps KEPT-0 aside and opens CAROL-1. He types BRAD-2 and closes.
  3. Carol's CAROL-F reaches the file the same way. Brad's third opening holds the file back and offers the button.
- The probe presses 💾 Save, answering OK to HOLD ON in file mode, then clicks the real button and answers its question OK.

**`importBoards`: the File menu's "⇊ Import several boards at once…"** (L26208).
- The item exists only on a consolidated board (`typeof APPNS!=='undefined'`); the template is one (L2402). It runs
  `#multiFile.click()`, and the input's `onchange="importBoards(this)"` (L1385) reads the files.
- The probe opens the File menu, opens the group, and clicks the item. The click on the file input is a no-op in jsdom. The probe
  then sets the picker's answer on the real `#multiFile` element and dispatches its `change` event.

**`impBoardBack`** is not a user path: `importBoards` calls it only to undo its own refused batch (L8552).

## Scenarios (the fixture: requirement A's note and allocation; literal)
BRAD-1/$700 is Brad's saved copy and BRAD-2/$720 his unsaved edit. SHARED/$600 is Carol's shared state file (what "download the
.json state file" writes). KEPT-0/$500 is earlier work kept aside. CAROL-1/$640 and CAROL-F/$650 are Carol's copies of the board
file. IMPORT/$610 is the board file Carol sends Brad. F0 is the seeded file `baseFile('Brad')`: writer Brad, nothing typed.
- **W**: the path's action while 💾 Save is held at the close of its **main write**. The bytes are built and `gen` taken;
  nothing is recorded yet. In folder mode the history copy is already kept.
- **C1**: the same action with no save. **C2**: the same save with no action, which lands. **C3**: the save lands, then the action.
- **Wnow / Wread / Wclean / C1clean**: boundary variants, named in the tables.
- After each run: a reopen (a new board on this browser's storage and the current file; in folder mode, the opening's own connect)
  and one ordinary edit. In folder mode, also a quiet refresh on the original board.

## Results (pass r2 = pass r3; the full expected-vs-observed table is in Appendix D)
Tuples: end = [screen, recorded clean, base copy, the save target's content, FALSELY CLEAN]; reopen = [screen, recorded clean,
base copy, FALSELY CLEAN]; refresh = [screen, recorded clean, FALSELY CLEAN].

| scenario | end (K1) | refresh (K2) | reopen (K3) | reading |
|---|---|---|---|---|
| **SHc-fold-W** | SHARED, clean, base BRAD-2, head BRAD-2, **FALSELY CLEAN** | BRAD-2 (silently loaded back), consistent | BRAD-2 ("⬇ Loaded … saved by Brad just now"), SHARED not kept aside | **REPRODUCED** |
| SHc-fold-C1 | SHARED, **unsaved**, BRAD-2 kept: consistent | consistent | consistent | healthy |
| SHc-fold-C2 | BRAD-2 = head, clean | consistent | consistent | healthy |
| **SHc-file-W** | SHARED, clean, base BRAD-2 = file, **FALSELY CLEAN**; status "💾 Saved in place by **Carol**" (O3) | n/a | BRAD-2 opened from the file, SHARED not kept aside | **REPRODUCED** |
| SHc-file-C1 / C2 | consistent / consistent | n/a | consistent | healthy |
| SHc-fold-Wclean, SHc-fold-C1clean, SHc-file-C1clean | SHARED, clean, base BRAD-1: falsely clean **with or without a save** | (folder) BRAD-1 silently loaded back: consistent | BRAD-1 loaded/opened, SHARED not kept aside: consistent | control unhealthy → not attributed (O4) |
| **SHa-fold-W** (state file an hour ahead) | SHARED, clean, base BRAD-2, **FALSELY CLEAN** | **still falsely clean** | **still falsely clean** | **REPRODUCED (persistent)** |
| SHa-fold-Wnow (stamped before the save) | not adopted ("Your local changes are newer…"), consistent | consistent | consistent | healthy: the stamp is a prerequisite |
| SHa-fold-C1 / C2 | SHARED adopted, BRAD-2 kept, **unsaved** / BRAD-2 saved | consistent | consistent | healthy |
| SHa-file-W | refused by DIRTY ("arrived after you started working, so nothing was replaced"); BRAD-2 saved | n/a | consistent | NOT REPRODUCED |
| SHa-file-Wread (held at its read) | SHARED adopted before the bytes, written: consistent | n/a | consistent | not U13's shape |
| SHa-file-C1 / C2 | consistent | n/a | consistent | healthy |
| SHa-fold-Wclean, SHa-fold-C1clean, SHa-file-C1clean | SHARED, clean, base BRAD-1: falsely clean with or without a save | falsely clean | falsely clean | control unhealthy → not attributed (O4) |
| **BT-file-W** | CAROL-F, clean, base BRAD-2 = file, **FALSELY CLEAN**; "💾 Saved in place by **Carol**" | n/a | BRAD-2 opened from the file, CAROL-F not kept aside | **REPRODUCED** |
| BT-file-C1 | CAROL-F = file, clean: consistent. BRAD-2 dropped as its question said ("NOT kept") | n/a | consistent | healthy |
| BT-file-C2 | BRAD-2 = file, clean: consistent; CAROL-F overwritten by the HOLD ON consent | n/a | consistent | healthy |
| BT-file-C3 | **the button is gone** once the save's line replaces it (`BUTTONS:0`) | n/a | consistent | reachability: only during the save |
| BT-fold-W | CAROL-F, clean, base BRAD-2, **falsely clean** | BRAD-2 reloaded, consistent | BRAD-2, consistent | **INCONCLUSIVE**: see C1 |
| BT-fold-C1 | CAROL-F, clean, base BRAD-1: **falsely clean with no save** | still falsely clean | still falsely clean | **control unhealthy** (O1) |
| BT-fold-C2 / C3 | consistent / button gone, consistent | consistent | consistent | healthy |
| IB-fold-W, IB-file-W | IMPORT, **unsaved** ("A change made while it was saving is not in the … yet"): consistent | consistent | BRAD-2, IMPORT kept aside | NOT REPRODUCED (counted) |
| IB-fold-C1, IB-file-C1 | IMPORT, unsaved: consistent (BRAD-2 replaced, as the import's question said) | consistent | consistent | healthy |
| IB-fold-C2, IB-file-C2 | consistent | consistent | consistent | healthy |
| IB-fold-Wclean | IMPORT, unsaved, consistent | consistent | **BRAD-1 loaded, IMPORT not kept: in no board copy** (only the person's file) | REACH fails at reopen; not U24's mechanism (O2) |
| IB-file-Wclean | consistent | n/a | BRAD-1, IMPORT kept aside (the file save marked the record) | consistent |
| IB-fold-C1clean, IB-file-C1clean | IMPORT, unsaved in this session | consistent | **falsely clean** (no save) | control unhealthy at K3 (O2) |

## Observations outside U24 (not fixed; proposals in PROPOSAL.md)
- **O1 (P2 by the ledger's scale; nothing lost here). `bootTakeFile` in folder mode records only the file's copy.**
  - It sets `LASTKNOWN`, the record's `file`, and `dirty:false`. The folder record stays as it was.
  - With no save, the board then reads "Saved" against the folder copy BRAD-1 while showing CAROL-F, through a refresh and a reopen
    (BT-fold-C1).
  - By code, the next folder Save writes CAROL-F over BRAD-1 without asking; BRAD-1 goes to the history. Proposal P2.
- **O2 (P1 by shape where it loses; measured). `importBoards` counts the change in the session but never marks the record.**
  - Its change is counted (`DIRTY`, `_saveGen`), but the record's `dirty` is never set. A reopen in a new session therefore takes
    the imported board as saved: falsely clean (IB-fold-C1clean, IB-file-C1clean).
  - When the folder copy is newer, the reopen loads that copy and keeps nothing aside. Here the copy was restamped by a save during
    the import (IB-fold-Wclean). IMPORT is then in no copy the board holds; only the person's own file has it.
  - Proposal P3.
- **O3 (P2, wording). In file mode the landing save names the author of whatever is on screen when it lands.**
  - It says "💾 Saved in place by **Carol**" when Brad's bytes were written (SHc-file-W, BT-file-W, IB-file-W).
  - IB-file-W is otherwise correct and counted. Proposal P4.
- **O4 (pre-existing; P2 by shape). The shared state file's loads never mark the record.**
  - From a clean record, "load the shared one" and the automatic load leave the board recorded clean against the file or folder
    copy while it shows SHARED.
  - Measured with no save: SHc-fold-C1clean, SHc-file-C1clean, SHa-fold-C1clean, SHa-file-C1clean. In SHa-fold-C1clean it is
    still falsely clean after a refresh and a reopen.
  - In folder mode, with a newer folder copy, a quiet refresh loads that copy back over SHARED and says nothing (SHc-fold-W K2,
    SHc-fold-C1clean).
  - An alternative to P1 for path A, counting and marking on load, would also close O4. It is described in PROPOSAL.md under P1's
    rationale only; no diff is given.
- **O5 (UX). The two `bootTakeFile` offers cannot be followed as written.**
  - "…open the file's version **once yours is saved**" (occupied): the button disappears when the save lands (BT-*-C3).
  - "⬇ Save a copy of yours first, then open the file's version" (no room): by code, `publishState` writes its own status line
    too (L8429), so the button is gone after that as well. Not run.
  - Already in the ledger: the reopen headers read "Saved" while the record is dirty (U15), and a folder-mode reopen says Save
    writes "into the file" (U26).

## What was and was not done
- **Reproduction and measurement only.**
  - Nothing in `/home/user/orbit-board` or `/home/user/orbit-ui` was edited, staged, committed or pushed. orbit-board was only
    read: `git status --short` (clean), `git log -1` (HEAD `239fc7e`, records only), and the board blob at HEAD, at `63bd8b0`
    and in the working tree: `98eed7e8`, the empty template.
  - orbit-ui was not touched at all.
- **Not run:**
  - `mutate.mjs` was never imported, executed, run or read.
  - Neither the full `audit-import.mjs` nor `audit-board.mjs` was run; no suite was run.
  - Chromium and Playwright were not used, and `playwright install` was not run. All evidence is jsdom 27.4.0.
- **Proposals P1–P4 were written, never applied or run.** Patched copies exist only to make the diffs exact.
- **Not tried:**
  - The sidecar over `file://` (XHR, opt-in): same callback, not run.
  - The "no room" variant of `bootTakeFile`'s offer: same function, not run.
  - The Live autosave as the held save (only 💾 Save was held).
  - A second tab or Web Locks (U20).
  - The next 💾 Save or ↶ Put back from the falsely-clean end states (U17's measurement).
  - At the reopens, the shared state file was **not** answered again: the reopen uses `boot()`, whose page finds no `fetch`.
- **The timing route is constructed.** jsdom cannot be slow, so the probe holds the write. The real-world counterparts are:
  - a slow write: a Teams- or OneDrive-synced file or folder;
  - a slow answer for the state file;
  - a clock an hour fast on the machine that wrote the state file (SHa).

  How often these happen was not measured; U24 is not called rare or common.
- **`bootX`** is a copy of `boot.mjs`'s `boot()`, with the same page split and the same jsdom options, plus a hook before the page
  parses. It is used only for path A's boards under test. Everything else uses `boot.mjs` itself (blob `9c4f49ad`).
- **Expected values.** They were written from the code before the runs, and confirmed or corrected against the dev pass (11:19–11:28
  AM ET). The corrections, each recorded in `check.mjs` with its time:
  - BT C3: I had predicted the click works after the save lands. It cannot: the button is gone.
  - REACH leaves for IB C1/C2: BRAD-2 is replaced in C1 by the import's own question; IMPORT is never imported in C2.
  - The clean-start path A variants were added at 11:36 AM ET, after reading `rec/L4/u17`'s observation 2.

## Other evidence (read, not reused as evidence here)
`rec/L4/u17` is another session's probe. It calls `adoptShared()`, `sharedArrived(st)`, `bootTakeFile()` and `importBoards()`
directly (not through the page's buttons, request and menu), and reaches the same K1 outcomes:
- SHd, FSHd, FBT and BT: falsely clean.
- IB: counted.
- Its SHaC / BTC: falsely clean without a save. That is O4 and O1 here.

It also measures the next Save from those states, which this probe does not. Its numbers were not re-run here.

## Identities (git hash-object)
| item | blob |
|---|---|
| board under test `b63/prioritization-board-grid.html` (`cp -a ../base`) = `../base/…` = orbit-board `63bd8b0:` = `HEAD:` = working tree | `98eed7e801af20270f755eadffb2fa72355c30e5` |
| `b63/tools/export-audit/boot.mjs` / `b63/runtime-encoding-shim.mjs` / `b63/package.json` | `9c4f49ad8cec537097bdf485458cfd2a09b06594` / `6e2ce2e6beda9e7526527530500f254d877d0320` / `7cf8186faa9b2dc26fbc3a95fd2b6296e867b384` |
| `u24probe.mjs`, final (r2, r3; dev2) | `6d3a0eb2ad20d0d262d472dca4834cac172cdd62` |
| `src/u24probe.r1-035db96c.mjs.txt`, the probe as run in r1 | `035db96cc1f741020de96c8d749478cd0bf7896f` |
| `src/u24probe.dev-b5c75307.mjs.txt`, the probe as run in the dev pass | `b5c7530798b28a09c8b6cc0a8b2c340c9f1c1ace` |
| `check.mjs` (final) | see Appendix E |
| `src/check.r1-89fdae3f.mjs.txt`, check.mjs before the clean-start variants | `89fdae3ffabdb3d5eae033835ffcef2992a7bb22` |
| `run.sh` / `q.sh` / `matrix.sh` (adapted from rec/L4/u20) | see Appendix E |
| readers `src/show.mjs`, `src/texts.mjs`, `src/runs-table.mjs`, `src/evo-table.mjs`; text edits `src/edit-*.py` | see Appendix E |
| `PROPOSAL.md`, `proposal/mkpatch.py`, `proposal/P1–P4.diff`, patched copies (never run) | see Appendix E and PROPOSAL.md |
| jsdom (through `b63/node_modules` → `/home/user/orbit-board/node_modules`) / node | 27.4.0 / v22.22.0 |

## Deviations (also in `logs/deviations.txt`)
- **Two Python invocations ran unbounded, outside q.sh**, so no PID was recorded and the lock was not checked:
  - At about 11:11–11:12 AM ET: a `python3 -I` one-liner that read four JSON files in `rec/L4/u17/out`. Exit 0.
  - At about 11:29 AM ET: an empty `python3 -` with no code. Exit 0.
- **The dev-pass loops of `matrix.sh` (a bash `for` loop) did not run through q.sh.**
  - With no outer bound: the loops started at 11:20:13 (SHc), 11:21:26 (SHa) and 11:23:27 AM ET (BT). The BT loop was moved to
    the background by the tool's 2-minute limit and finished on its own.
  - Under a plain `timeout 110` or `timeout 115`: the loops started at 11:25:56 (IB, part 1), 11:27:03 (IB, part 2) and 11:36:43
    AM ET (dev2).
  - Every node process inside these loops ran through `run.sh` (bounded, PIDs recorded).
  - The r1, r2 and r3 loops ran through q.sh: `matrix-r1`, `matrix-r2`, `matrix-r3`, with their PIDs in `pids.txt`.
- **Small shell utilities ran directly**, not through q.sh: `ls`, `grep`, `sed`, `cat`, `cp`, `perl -pi`/`sed -i` text edits to
  my own files, `git hash-object`, `date`. Every node and Python run, and every `git -C /home/user/orbit-board` read, went through
  `run.sh` or `q.sh`, except the two Python invocations above.
- **The first dev run** (`dev-SHc-fold-W` at 11:19:40 AM ET, exit 1) was a harness mistake: it was called with an extra `node`.
  It ran nothing; its log is `logs/dev-SHc-fold-W.badcall.log`.
- **Times.** Work ran from 11:03 AM ET (by `TZ=America/New_York date`), and this README was finalised at the time in Appendix E.
  The status lines quoted above come from runs. The SHa fixtures' state file is deliberately stamped one hour ahead, so some
  status lines in `out/` show a time an hour later than the run. Those are the fixture's clock, not this report's.

## Appendix D. Expected (hand-written literals in check.mjs) vs observed, passes r2 and r3 (HOLD, PRED, CONTRACT rows; FIX rows in out/checks-<pass>.json)
"=" = as expected; "**≠**" = differs. Every ≠ below is a CONTRACT row, that is a reproduction, or a control that is not healthy;
the README's tables above say which.

| scenario | check | expected (literal) | observed r2 | observed r3 |
|---|---|---|---|---|
| SHc-fold-W | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] |
| SHc-fold-W | PRED: the action during the held save | ["SHARED",1,false,true,true,"BRAD-2","shared-loaded"] | = ["SHARED",1,false,true,true,"BRAD-2","shared-loaded"] | = ["SHARED",1,false,true,true,"BRAD-2","shared-loaded"] |
| SHc-fold-W | PRED: the end state | ["SHARED",true,"BRAD-2","BRAD-2",true] | = ["SHARED",true,"BRAD-2","BRAD-2",true] | = ["SHARED",true,"BRAD-2","BRAD-2",true] |
| SHc-fold-W | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| SHc-fold-W | PRED: a quiet refresh from the end state | ["BRAD-2",true,false] | = ["BRAD-2",true,false] | = ["BRAD-2",true,false] |
| SHc-fold-W | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| SHc-fold-W | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| SHc-fold-W | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHc-fold-W | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-W | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-W | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-C1 | PRED: the action with no save under way | ["SHARED",0,false,true,true,"BRAD-2","shared-loaded"] | = ["SHARED",0,false,true,true,"BRAD-2","shared-loaded"] | = ["SHARED",0,false,true,true,"BRAD-2","shared-loaded"] |
| SHc-fold-C1 | PRED: the end state | ["SHARED",false,"BRAD-1","BRAD-1",false] | = ["SHARED",false,"BRAD-1","BRAD-1",false] | = ["SHARED",false,"BRAD-1","BRAD-1",false] |
| SHc-fold-C1 | PRED: reopened from the end state | ["SHARED",false,"BRAD-1",false] | = ["SHARED",false,"BRAD-1",false] | = ["SHARED",false,"BRAD-1",false] |
| SHc-fold-C1 | PRED: a quiet refresh from the end state | ["SHARED",false,false] | = ["SHARED",false,false] | = ["SHARED",false,false] |
| SHc-fold-C1 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHc-fold-C1 | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| SHc-fold-C1 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHc-fold-C1 | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-C1 | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-C1 | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-C2 | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| SHc-fold-C2 | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| SHc-fold-C2 | PRED: a quiet refresh from the end state | ["BRAD-2",true,false] | = ["BRAD-2",true,false] | = ["BRAD-2",true,false] |
| SHc-fold-C2 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHc-fold-C2 | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| SHc-fold-C2 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHc-fold-C2 | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-C2 | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-C2 | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-W | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] |
| SHc-file-W | PRED: the action during the held save | ["SHARED",1,false,true,true,"BRAD-2","shared-loaded"] | = ["SHARED",1,false,true,true,"BRAD-2","shared-loaded"] | = ["SHARED",1,false,true,true,"BRAD-2","shared-loaded"] |
| SHc-file-W | PRED: the end state | ["SHARED",true,"BRAD-2","BRAD-2",true] | = ["SHARED",true,"BRAD-2","BRAD-2",true] | = ["SHARED",true,"BRAD-2","BRAD-2",true] |
| SHc-file-W | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| SHc-file-W | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| SHc-file-W | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHc-file-W | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-W | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-W | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-C1 | PRED: the action with no save under way | ["SHARED",0,false,true,true,"BRAD-2","shared-loaded"] | = ["SHARED",0,false,true,true,"BRAD-2","shared-loaded"] | = ["SHARED",0,false,true,true,"BRAD-2","shared-loaded"] |
| SHc-file-C1 | PRED: the end state | ["SHARED",false,"BRAD-1","BRAD-1",false] | = ["SHARED",false,"BRAD-1","BRAD-1",false] | = ["SHARED",false,"BRAD-1","BRAD-1",false] |
| SHc-file-C1 | PRED: reopened from the end state | ["SHARED",false,"BRAD-1",false] | = ["SHARED",false,"BRAD-1",false] | = ["SHARED",false,"BRAD-1",false] |
| SHc-file-C1 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHc-file-C1 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHc-file-C1 | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-C1 | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-C1 | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-C2 | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| SHc-file-C2 | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| SHc-file-C2 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHc-file-C2 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHc-file-C2 | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-C2 | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-C2 | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-Wclean | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] |
| SHc-fold-Wclean | PRED: the action during the held save | ["SHARED",1,false,false,false,null,"shared-loaded"] | = ["SHARED",1,false,false,false,null,"shared-loaded"] | = ["SHARED",1,false,false,false,null,"shared-loaded"] |
| SHc-fold-Wclean | PRED: the end state | ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] |
| SHc-fold-Wclean | PRED: reopened from the end state | ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] |
| SHc-fold-Wclean | PRED: a quiet refresh from the end state | ["BRAD-1",true,false] | = ["BRAD-1",true,false] | = ["BRAD-1",true,false] |
| SHc-fold-Wclean | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| SHc-fold-Wclean | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| SHc-fold-Wclean | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHc-fold-Wclean | CONTRACT: REACH (end): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-Wclean | CONTRACT: REACH (reopened): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-Wclean | CONTRACT: REACH (reopened + one edit): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-C1clean | PRED: the action with no save under way | ["SHARED",0,false,false,false,null,"shared-loaded"] | = ["SHARED",0,false,false,false,null,"shared-loaded"] | = ["SHARED",0,false,false,false,null,"shared-loaded"] |
| SHc-fold-C1clean | PRED: the end state | ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] |
| SHc-fold-C1clean | PRED: reopened from the end state | ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] |
| SHc-fold-C1clean | PRED: a quiet refresh from the end state | ["BRAD-1",true,false] | = ["BRAD-1",true,false] | = ["BRAD-1",true,false] |
| SHc-fold-C1clean | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| SHc-fold-C1clean | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| SHc-fold-C1clean | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHc-fold-C1clean | CONTRACT: REACH (end): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-C1clean | CONTRACT: REACH (reopened): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-C1clean | CONTRACT: REACH (reopened + one edit): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-C1clean | PRED: the action with no save under way | ["SHARED",0,false,false,false,null,"shared-loaded"] | = ["SHARED",0,false,false,false,null,"shared-loaded"] | = ["SHARED",0,false,false,false,null,"shared-loaded"] |
| SHc-file-C1clean | PRED: the end state | ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] |
| SHc-file-C1clean | PRED: reopened from the end state | ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] |
| SHc-file-C1clean | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| SHc-file-C1clean | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHc-file-C1clean | CONTRACT: REACH (end): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-C1clean | CONTRACT: REACH (reopened): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-C1clean | CONTRACT: REACH (reopened + one edit): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-Wclean | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] |
| SHa-fold-Wclean | PRED: the action during the held save | ["SHARED",1,false,false,false,null,"shared-auto"] | = ["SHARED",1,false,false,false,null,"shared-auto"] | = ["SHARED",1,false,false,false,null,"shared-auto"] |
| SHa-fold-Wclean | PRED: the end state | ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] |
| SHa-fold-Wclean | PRED: reopened from the end state | ["SHARED",true,"BRAD-1",true] | = ["SHARED",true,"BRAD-1",true] | = ["SHARED",true,"BRAD-1",true] |
| SHa-fold-Wclean | PRED: a quiet refresh from the end state | ["SHARED",true,true] | = ["SHARED",true,true] | = ["SHARED",true,true] |
| SHa-fold-Wclean | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| SHa-fold-Wclean | CONTRACT: K2: after a quiet refresh, not falsely clean | false | **≠** true | **≠** true |
| SHa-fold-Wclean | CONTRACT: K3: reopened, not falsely clean | false | **≠** true | **≠** true |
| SHa-fold-Wclean | CONTRACT: REACH (end): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-Wclean | CONTRACT: REACH (reopened): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-Wclean | CONTRACT: REACH (reopened + one edit): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-C1clean | PRED: the action with no save under way | ["SHARED",0,false,false,false,null,"shared-auto"] | = ["SHARED",0,false,false,false,null,"shared-auto"] | = ["SHARED",0,false,false,false,null,"shared-auto"] |
| SHa-fold-C1clean | PRED: the end state | ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] |
| SHa-fold-C1clean | PRED: reopened from the end state | ["SHARED",true,"BRAD-1",true] | = ["SHARED",true,"BRAD-1",true] | = ["SHARED",true,"BRAD-1",true] |
| SHa-fold-C1clean | PRED: a quiet refresh from the end state | ["SHARED",true,true] | = ["SHARED",true,true] | = ["SHARED",true,true] |
| SHa-fold-C1clean | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| SHa-fold-C1clean | CONTRACT: K2: after a quiet refresh, not falsely clean | false | **≠** true | **≠** true |
| SHa-fold-C1clean | CONTRACT: K3: reopened, not falsely clean | false | **≠** true | **≠** true |
| SHa-fold-C1clean | CONTRACT: REACH (end): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-C1clean | CONTRACT: REACH (reopened): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-C1clean | CONTRACT: REACH (reopened + one edit): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-C1clean | PRED: the action with no save under way | ["SHARED",0,false,false,false,null,"shared-auto"] | = ["SHARED",0,false,false,false,null,"shared-auto"] | = ["SHARED",0,false,false,false,null,"shared-auto"] |
| SHa-file-C1clean | PRED: the end state | ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] |
| SHa-file-C1clean | PRED: reopened from the end state | ["SHARED",true,"BRAD-1",true] | = ["SHARED",true,"BRAD-1",true] | = ["SHARED",true,"BRAD-1",true] |
| SHa-file-C1clean | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| SHa-file-C1clean | CONTRACT: K3: reopened, not falsely clean | false | **≠** true | **≠** true |
| SHa-file-C1clean | CONTRACT: REACH (end): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-C1clean | CONTRACT: REACH (reopened): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-C1clean | CONTRACT: REACH (reopened + one edit): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-W | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] |
| SHa-fold-W | PRED: the action during the held save | ["SHARED",1,false,false,true,"BRAD-2","shared-auto"] | = ["SHARED",1,false,false,true,"BRAD-2","shared-auto"] | = ["SHARED",1,false,false,true,"BRAD-2","shared-auto"] |
| SHa-fold-W | PRED: the end state | ["SHARED",true,"BRAD-2","BRAD-2",true] | = ["SHARED",true,"BRAD-2","BRAD-2",true] | = ["SHARED",true,"BRAD-2","BRAD-2",true] |
| SHa-fold-W | PRED: reopened from the end state | ["SHARED",true,"BRAD-2",true] | = ["SHARED",true,"BRAD-2",true] | = ["SHARED",true,"BRAD-2",true] |
| SHa-fold-W | PRED: a quiet refresh from the end state | ["SHARED",true,true] | = ["SHARED",true,true] | = ["SHARED",true,true] |
| SHa-fold-W | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| SHa-fold-W | CONTRACT: K2: after a quiet refresh, not falsely clean | false | **≠** true | **≠** true |
| SHa-fold-W | CONTRACT: K3: reopened, not falsely clean | false | **≠** true | **≠** true |
| SHa-fold-W | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-W | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-W | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-Wnow | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] |
| SHa-fold-Wnow | PRED: the action during the held save | ["BRAD-2",1,false,false,true,null,"shared-newer-local"] | = ["BRAD-2",1,false,false,true,null,"shared-newer-local"] | = ["BRAD-2",1,false,false,true,null,"shared-newer-local"] |
| SHa-fold-Wnow | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| SHa-fold-Wnow | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| SHa-fold-Wnow | PRED: a quiet refresh from the end state | ["BRAD-2",true,false] | = ["BRAD-2",true,false] | = ["BRAD-2",true,false] |
| SHa-fold-Wnow | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHa-fold-Wnow | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| SHa-fold-Wnow | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHa-fold-Wnow | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-Wnow | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-Wnow | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-C1 | PRED: the action with no save under way | ["SHARED",0,false,false,true,"BRAD-2","shared-auto"] | = ["SHARED",0,false,false,true,"BRAD-2","shared-auto"] | = ["SHARED",0,false,false,true,"BRAD-2","shared-auto"] |
| SHa-fold-C1 | PRED: the end state | ["SHARED",false,"BRAD-1","BRAD-1",false] | = ["SHARED",false,"BRAD-1","BRAD-1",false] | = ["SHARED",false,"BRAD-1","BRAD-1",false] |
| SHa-fold-C1 | PRED: reopened from the end state | ["SHARED",false,"BRAD-1",false] | = ["SHARED",false,"BRAD-1",false] | = ["SHARED",false,"BRAD-1",false] |
| SHa-fold-C1 | PRED: a quiet refresh from the end state | ["SHARED",false,false] | = ["SHARED",false,false] | = ["SHARED",false,false] |
| SHa-fold-C1 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHa-fold-C1 | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| SHa-fold-C1 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHa-fold-C1 | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-C1 | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-C1 | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-C2 | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| SHa-fold-C2 | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| SHa-fold-C2 | PRED: a quiet refresh from the end state | ["BRAD-2",true,false] | = ["BRAD-2",true,false] | = ["BRAD-2",true,false] |
| SHa-fold-C2 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHa-fold-C2 | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| SHa-fold-C2 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHa-fold-C2 | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-C2 | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-C2 | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-W | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] |
| SHa-file-W | PRED: the action during the held save | ["BRAD-2",1,false,true,true,null,"shared-refused"] | = ["BRAD-2",1,false,true,true,null,"shared-refused"] | = ["BRAD-2",1,false,true,true,null,"shared-refused"] |
| SHa-file-W | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| SHa-file-W | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| SHa-file-W | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHa-file-W | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHa-file-W | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-W | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-W | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-Wread | HOLD: the 💾 Save is held at its read of the file | [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] |
| SHa-file-Wread | PRED: the action during the held save | ["SHARED",1,false,false,true,"BRAD-2","shared-auto"] | = ["SHARED",1,false,false,true,"BRAD-2","shared-auto"] | = ["SHARED",1,false,false,true,"BRAD-2","shared-auto"] |
| SHa-file-Wread | PRED: the end state | ["SHARED",true,"SHARED","SHARED",false] | = ["SHARED",true,"SHARED","SHARED",false] | = ["SHARED",true,"SHARED","SHARED",false] |
| SHa-file-Wread | PRED: reopened from the end state | ["SHARED",true,"SHARED",false] | = ["SHARED",true,"SHARED",false] | = ["SHARED",true,"SHARED",false] |
| SHa-file-Wread | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHa-file-Wread | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHa-file-Wread | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-Wread | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-Wread | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-C1 | PRED: the action with no save under way | ["SHARED",0,false,false,true,"BRAD-2","shared-auto"] | = ["SHARED",0,false,false,true,"BRAD-2","shared-auto"] | = ["SHARED",0,false,false,true,"BRAD-2","shared-auto"] |
| SHa-file-C1 | PRED: the end state | ["SHARED",false,"BRAD-1","BRAD-1",false] | = ["SHARED",false,"BRAD-1","BRAD-1",false] | = ["SHARED",false,"BRAD-1","BRAD-1",false] |
| SHa-file-C1 | PRED: reopened from the end state | ["SHARED",false,"BRAD-1",false] | = ["SHARED",false,"BRAD-1",false] | = ["SHARED",false,"BRAD-1",false] |
| SHa-file-C1 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHa-file-C1 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHa-file-C1 | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-C1 | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-C1 | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-C2 | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| SHa-file-C2 | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| SHa-file-C2 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHa-file-C2 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHa-file-C2 | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-C2 | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-C2 | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-W | HOLD: the 💾 Save is held at the close of its main write | [true,1,"CAROL-F",true,1] | = [true,1,"CAROL-F",true,1] | = [true,1,"CAROL-F",true,1] |
| BT-file-W | HOLD: the question asked was HOLD ON (answered OK) | true | = true | = true |
| BT-file-W | PRED: the action during the held save | ["CAROL-F",1,false,false,false,"KEPT-0","file-version"] | = ["CAROL-F",1,false,false,false,"KEPT-0","file-version"] | = ["CAROL-F",1,false,false,false,"KEPT-0","file-version"] |
| BT-file-W | PRED: the end state | ["CAROL-F",true,"BRAD-2","BRAD-2",true] | = ["CAROL-F",true,"BRAD-2","BRAD-2",true] | = ["CAROL-F",true,"BRAD-2","BRAD-2",true] |
| BT-file-W | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| BT-file-W | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| BT-file-W | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| BT-file-W | CONTRACT: REACH (end): BRAD-2, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-W | CONTRACT: REACH (reopened): BRAD-2, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-W | CONTRACT: REACH (reopened + one edit): BRAD-2, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-C1 | PRED: the action with no save under way | ["CAROL-F",0,false,false,false,"KEPT-0","file-version"] | = ["CAROL-F",0,false,false,false,"KEPT-0","file-version"] | = ["CAROL-F",0,false,false,false,"KEPT-0","file-version"] |
| BT-file-C1 | PRED: the end state | ["CAROL-F",true,"CAROL-F","CAROL-F",false] | = ["CAROL-F",true,"CAROL-F","CAROL-F",false] | = ["CAROL-F",true,"CAROL-F","CAROL-F",false] |
| BT-file-C1 | PRED: reopened from the end state | ["CAROL-F",true,"CAROL-F",false] | = ["CAROL-F",true,"CAROL-F",false] | = ["CAROL-F",true,"CAROL-F",false] |
| BT-file-C1 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| BT-file-C1 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| BT-file-C1 | CONTRACT: REACH (end): CAROL-F, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-C1 | CONTRACT: REACH (reopened): CAROL-F, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-C1 | CONTRACT: REACH (reopened + one edit): CAROL-F, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-C2 | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| BT-file-C2 | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| BT-file-C2 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| BT-file-C2 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| BT-file-C2 | CONTRACT: REACH (end): BRAD-2, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-C2 | CONTRACT: REACH (reopened): BRAD-2, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-C2 | CONTRACT: REACH (reopened + one edit): BRAD-2, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-C3 | PRED: after the save landed, the status line no longer offers 'open the file’s version' | "BUTTONS:0" | = "BUTTONS:0" | = "BUTTONS:0" |
| BT-file-C3 | PRED: the action with no save under way | ["BRAD-2",0,false,false,false,"KEPT-0","saved-file"] | = ["BRAD-2",0,false,false,false,"KEPT-0","saved-file"] | = ["BRAD-2",0,false,false,false,"KEPT-0","saved-file"] |
| BT-file-C3 | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| BT-file-C3 | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| BT-file-C3 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| BT-file-C3 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| BT-file-C3 | CONTRACT: REACH (end): BRAD-2, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-C3 | CONTRACT: REACH (reopened): BRAD-2, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-C3 | CONTRACT: REACH (reopened + one edit): BRAD-2, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-fold-W | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] |
| BT-fold-W | PRED: the action during the held save | ["CAROL-F",1,false,false,false,"KEPT-0","file-version"] | = ["CAROL-F",1,false,false,false,"KEPT-0","file-version"] | = ["CAROL-F",1,false,false,false,"KEPT-0","file-version"] |
| BT-fold-W | PRED: the end state | ["CAROL-F",true,"BRAD-2","BRAD-2",true] | = ["CAROL-F",true,"BRAD-2","BRAD-2",true] | = ["CAROL-F",true,"BRAD-2","BRAD-2",true] |
| BT-fold-W | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| BT-fold-W | PRED: a quiet refresh from the end state | ["BRAD-2",true,false] | = ["BRAD-2",true,false] | = ["BRAD-2",true,false] |
| BT-fold-W | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| BT-fold-W | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| BT-fold-W | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| BT-fold-W | CONTRACT: REACH (end): BRAD-2, KEPT-0, CAROL-F each in a copy the board holds or fetches | [true,true,true] | = [true,true,true] | = [true,true,true] |
| BT-fold-W | CONTRACT: REACH (reopened): BRAD-2, KEPT-0, CAROL-F each in a copy the board holds or fetches | [true,true,true] | = [true,true,true] | = [true,true,true] |
| BT-fold-W | CONTRACT: REACH (reopened + one edit): BRAD-2, KEPT-0, CAROL-F each in a copy the board holds or fetches | [true,true,true] | = [true,true,true] | = [true,true,true] |
| BT-fold-C1 | PRED: the action with no save under way | ["CAROL-F",0,false,false,false,"KEPT-0","file-version"] | = ["CAROL-F",0,false,false,false,"KEPT-0","file-version"] | = ["CAROL-F",0,false,false,false,"KEPT-0","file-version"] |
| BT-fold-C1 | PRED: the end state | ["CAROL-F",true,"BRAD-1","BRAD-1",true] | = ["CAROL-F",true,"BRAD-1","BRAD-1",true] | = ["CAROL-F",true,"BRAD-1","BRAD-1",true] |
| BT-fold-C1 | PRED: reopened from the end state | ["CAROL-F",true,"BRAD-1",true] | = ["CAROL-F",true,"BRAD-1",true] | = ["CAROL-F",true,"BRAD-1",true] |
| BT-fold-C1 | PRED: a quiet refresh from the end state | ["CAROL-F",true,true] | = ["CAROL-F",true,true] | = ["CAROL-F",true,true] |
| BT-fold-C1 | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| BT-fold-C1 | CONTRACT: K2: after a quiet refresh, not falsely clean | false | **≠** true | **≠** true |
| BT-fold-C1 | CONTRACT: K3: reopened, not falsely clean | false | **≠** true | **≠** true |
| BT-fold-C1 | CONTRACT: REACH (end): CAROL-F, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-fold-C1 | CONTRACT: REACH (reopened): CAROL-F, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-fold-C1 | CONTRACT: REACH (reopened + one edit): CAROL-F, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-fold-C2 | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| BT-fold-C2 | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| BT-fold-C2 | PRED: a quiet refresh from the end state | ["BRAD-2",true,false] | = ["BRAD-2",true,false] | = ["BRAD-2",true,false] |
| BT-fold-C2 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| BT-fold-C2 | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| BT-fold-C2 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| BT-fold-C2 | CONTRACT: REACH (end): BRAD-2, KEPT-0, CAROL-F each in a copy the board holds or fetches | [true,true,true] | = [true,true,true] | = [true,true,true] |
| BT-fold-C2 | CONTRACT: REACH (reopened): BRAD-2, KEPT-0, CAROL-F each in a copy the board holds or fetches | [true,true,true] | = [true,true,true] | = [true,true,true] |
| BT-fold-C2 | CONTRACT: REACH (reopened + one edit): BRAD-2, KEPT-0, CAROL-F each in a copy the board holds or fetches | [true,true,true] | = [true,true,true] | = [true,true,true] |
| BT-fold-C3 | PRED: after the save landed, the status line no longer offers 'open the file’s version' | "BUTTONS:0" | = "BUTTONS:0" | = "BUTTONS:0" |
| BT-fold-C3 | PRED: the action with no save under way | ["BRAD-2",0,false,false,false,"KEPT-0","saved-folder"] | = ["BRAD-2",0,false,false,false,"KEPT-0","saved-folder"] | = ["BRAD-2",0,false,false,false,"KEPT-0","saved-folder"] |
| BT-fold-C3 | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| BT-fold-C3 | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| BT-fold-C3 | PRED: a quiet refresh from the end state | ["BRAD-2",true,false] | = ["BRAD-2",true,false] | = ["BRAD-2",true,false] |
| BT-fold-C3 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| BT-fold-C3 | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| BT-fold-C3 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| BT-fold-C3 | CONTRACT: REACH (end): BRAD-2, KEPT-0, CAROL-F each in a copy the board holds or fetches | [true,true,true] | = [true,true,true] | = [true,true,true] |
| BT-fold-C3 | CONTRACT: REACH (reopened): BRAD-2, KEPT-0, CAROL-F each in a copy the board holds or fetches | [true,true,true] | = [true,true,true] | = [true,true,true] |
| BT-fold-C3 | CONTRACT: REACH (reopened + one edit): BRAD-2, KEPT-0, CAROL-F each in a copy the board holds or fetches | [true,true,true] | = [true,true,true] | = [true,true,true] |
| IB-fold-W | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] |
| IB-fold-W | PRED: the action during the held save | ["IMPORT",1,true,true,true,null,"imported"] | = ["IMPORT",1,true,true,true,null,"imported"] | = ["IMPORT",1,true,true,true,null,"imported"] |
| IB-fold-W | PRED: the end state | ["IMPORT",false,"BRAD-2","BRAD-2",false] | = ["IMPORT",false,"BRAD-2","BRAD-2",false] | = ["IMPORT",false,"BRAD-2","BRAD-2",false] |
| IB-fold-W | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| IB-fold-W | PRED: a quiet refresh from the end state | ["IMPORT",false,false] | = ["IMPORT",false,false] | = ["IMPORT",false,false] |
| IB-fold-W | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| IB-fold-W | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| IB-fold-W | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| IB-fold-W | CONTRACT: REACH (end): BRAD-2, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-fold-W | CONTRACT: REACH (reopened): BRAD-2, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-fold-W | CONTRACT: REACH (reopened + one edit): BRAD-2, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-fold-C1 | PRED: the action with no save under way | ["IMPORT",0,true,true,true,null,"imported"] | = ["IMPORT",0,true,true,true,null,"imported"] | = ["IMPORT",0,true,true,true,null,"imported"] |
| IB-fold-C1 | PRED: the end state | ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] |
| IB-fold-C1 | PRED: reopened from the end state | ["IMPORT",false,"BRAD-1",false] | = ["IMPORT",false,"BRAD-1",false] | = ["IMPORT",false,"BRAD-1",false] |
| IB-fold-C1 | PRED: a quiet refresh from the end state | ["IMPORT",false,false] | = ["IMPORT",false,false] | = ["IMPORT",false,false] |
| IB-fold-C1 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| IB-fold-C1 | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| IB-fold-C1 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| IB-fold-C1 | CONTRACT: REACH (end): IMPORT each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-fold-C1 | CONTRACT: REACH (reopened): IMPORT each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-fold-C1 | CONTRACT: REACH (reopened + one edit): IMPORT each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-fold-C2 | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| IB-fold-C2 | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| IB-fold-C2 | PRED: a quiet refresh from the end state | ["BRAD-2",true,false] | = ["BRAD-2",true,false] | = ["BRAD-2",true,false] |
| IB-fold-C2 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| IB-fold-C2 | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| IB-fold-C2 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| IB-fold-C2 | CONTRACT: REACH (end): BRAD-2 each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-fold-C2 | CONTRACT: REACH (reopened): BRAD-2 each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-fold-C2 | CONTRACT: REACH (reopened + one edit): BRAD-2 each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-fold-Wclean | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] |
| IB-fold-Wclean | PRED: the action during the held save | ["IMPORT",1,true,true,false,null,"imported"] | = ["IMPORT",1,true,true,false,null,"imported"] | = ["IMPORT",1,true,true,false,null,"imported"] |
| IB-fold-Wclean | PRED: the end state | ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] |
| IB-fold-Wclean | PRED: reopened from the end state | ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] |
| IB-fold-Wclean | PRED: a quiet refresh from the end state | ["IMPORT",false,false] | = ["IMPORT",false,false] | = ["IMPORT",false,false] |
| IB-fold-Wclean | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| IB-fold-Wclean | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| IB-fold-Wclean | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| IB-fold-Wclean | CONTRACT: REACH (end): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-fold-Wclean | CONTRACT: REACH (reopened): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | **≠** [true,false] | **≠** [true,false] |
| IB-fold-Wclean | CONTRACT: REACH (reopened + one edit): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | **≠** [true,false] | **≠** [true,false] |
| IB-fold-C1clean | PRED: the action with no save under way | ["IMPORT",0,true,true,false,null,"imported"] | = ["IMPORT",0,true,true,false,null,"imported"] | = ["IMPORT",0,true,true,false,null,"imported"] |
| IB-fold-C1clean | PRED: the end state | ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] |
| IB-fold-C1clean | PRED: reopened from the end state | ["IMPORT",true,"BRAD-1",true] | = ["IMPORT",true,"BRAD-1",true] | = ["IMPORT",true,"BRAD-1",true] |
| IB-fold-C1clean | PRED: a quiet refresh from the end state | ["IMPORT",false,false] | = ["IMPORT",false,false] | = ["IMPORT",false,false] |
| IB-fold-C1clean | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| IB-fold-C1clean | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| IB-fold-C1clean | CONTRACT: K3: reopened, not falsely clean | false | **≠** true | **≠** true |
| IB-fold-C1clean | CONTRACT: REACH (end): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-fold-C1clean | CONTRACT: REACH (reopened): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-fold-C1clean | CONTRACT: REACH (reopened + one edit): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-file-W | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] |
| IB-file-W | PRED: the action during the held save | ["IMPORT",1,true,true,true,null,"imported"] | = ["IMPORT",1,true,true,true,null,"imported"] | = ["IMPORT",1,true,true,true,null,"imported"] |
| IB-file-W | PRED: the end state | ["IMPORT",false,"BRAD-2","BRAD-2",false] | = ["IMPORT",false,"BRAD-2","BRAD-2",false] | = ["IMPORT",false,"BRAD-2","BRAD-2",false] |
| IB-file-W | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| IB-file-W | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| IB-file-W | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| IB-file-W | CONTRACT: REACH (end): BRAD-2, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-file-W | CONTRACT: REACH (reopened): BRAD-2, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-file-W | CONTRACT: REACH (reopened + one edit): BRAD-2, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-file-C1 | PRED: the action with no save under way | ["IMPORT",0,true,true,true,null,"imported"] | = ["IMPORT",0,true,true,true,null,"imported"] | = ["IMPORT",0,true,true,true,null,"imported"] |
| IB-file-C1 | PRED: the end state | ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] |
| IB-file-C1 | PRED: reopened from the end state | ["IMPORT",false,"BRAD-1",false] | = ["IMPORT",false,"BRAD-1",false] | = ["IMPORT",false,"BRAD-1",false] |
| IB-file-C1 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| IB-file-C1 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| IB-file-C1 | CONTRACT: REACH (end): IMPORT each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-file-C1 | CONTRACT: REACH (reopened): IMPORT each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-file-C1 | CONTRACT: REACH (reopened + one edit): IMPORT each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-file-C2 | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| IB-file-C2 | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| IB-file-C2 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| IB-file-C2 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| IB-file-C2 | CONTRACT: REACH (end): BRAD-2 each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-file-C2 | CONTRACT: REACH (reopened): BRAD-2 each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-file-C2 | CONTRACT: REACH (reopened + one edit): BRAD-2 each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-file-Wclean | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] |
| IB-file-Wclean | PRED: the action during the held save | ["IMPORT",1,true,true,true,null,"imported"] | = ["IMPORT",1,true,true,true,null,"imported"] | = ["IMPORT",1,true,true,true,null,"imported"] |
| IB-file-Wclean | PRED: the end state | ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] |
| IB-file-Wclean | PRED: reopened from the end state | ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] |
| IB-file-Wclean | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| IB-file-Wclean | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| IB-file-Wclean | CONTRACT: REACH (end): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-file-Wclean | CONTRACT: REACH (reopened): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-file-Wclean | CONTRACT: REACH (reopened + one edit): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-file-C1clean | PRED: the action with no save under way | ["IMPORT",0,true,true,false,null,"imported"] | = ["IMPORT",0,true,true,false,null,"imported"] | = ["IMPORT",0,true,true,false,null,"imported"] |
| IB-file-C1clean | PRED: the end state | ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] |
| IB-file-C1clean | PRED: reopened from the end state | ["IMPORT",true,"BRAD-1",true] | = ["IMPORT",true,"BRAD-1",true] | = ["IMPORT",true,"BRAD-1",true] |
| IB-file-C1clean | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| IB-file-C1clean | CONTRACT: K3: reopened, not falsely clean | false | **≠** true | **≠** true |
| IB-file-C1clean | CONTRACT: REACH (end): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-file-C1clean | CONTRACT: REACH (reopened): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-file-C1clean | CONTRACT: REACH (reopened + one edit): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |

r2: 560 checks, 25 fail (25 CONTRACT, 0 other); r3: 560 checks, 25 fail (25 CONTRACT, 0 other)

## Appendix A–C. Every run and its PIDs

### A. Probe runs (`logs/runs.txt`, via run.sh; each `setsid -w timeout -k 10 600 node …`)

All times are ET (EDT) on Mon 12 Oct 2026. Output of each: `logs/<label>.log`, JSON `out/<label>.json`.

| label | start ET | exit | wall s |
|---|---|---|---|
| dev-SHc-fold-W | 11:19:40 | 1 | 0.1 |
| dev-SHc-fold-W | 11:19:49 | 0 | 11.8 |
| dev-SHc-fold-C1 | 11:20:13 | 0 | 12.8 |
| dev-SHc-fold-C2 | 11:20:26 | 0 | 13.5 |
| dev-SHc-file-W | 11:20:39 | 0 | 10.8 |
| dev-SHc-file-C1 | 11:20:50 | 0 | 10.0 |
| dev-SHc-file-C2 | 11:21:00 | 0 | 9.0 |
| dev-SHa-fold-W | 11:21:26 | 0 | 11.5 |
| dev-SHa-fold-Wnow | 11:21:37 | 0 | 10.9 |
| dev-SHa-fold-C1 | 11:21:48 | 0 | 11.1 |
| dev-SHa-fold-C2 | 11:21:59 | 0 | 15.3 |
| dev-SHa-file-W | 11:22:15 | 0 | 13.4 |
| dev-SHa-file-Wread | 11:22:28 | 0 | 14.3 |
| dev-SHa-file-C1 | 11:22:42 | 0 | 14.3 |
| dev-SHa-file-C2 | 11:22:57 | 0 | 12.5 |
| dev-BT-file-W | 11:23:27 | 0 | 14.8 |
| dev-BT-file-C1 | 11:23:42 | 0 | 14.6 |
| dev-BT-file-C2 | 11:23:57 | 0 | 16.6 |
| dev-BT-file-C3 | 11:24:13 | 0 | 14.5 |
| dev-BT-fold-W | 11:24:28 | 0 | 15.8 |
| dev-BT-fold-C1 | 11:24:44 | 0 | 14.6 |
| dev-BT-fold-C2 | 11:24:58 | 0 | 16.4 |
| dev-BT-fold-C3 | 11:25:15 | 0 | 18.0 |
| dev-IB-fold-W | 11:25:56 | 0 | 13.9 |
| dev-IB-fold-C1 | 11:26:10 | 0 | 11.9 |
| dev-IB-fold-C2 | 11:26:22 | 0 | 9.6 |
| dev-IB-fold-Wclean | 11:26:32 | 0 | 10.6 |
| dev-IB-fold-C1clean | 11:27:03 | 0 | 10.0 |
| dev-IB-file-W | 11:27:13 | 0 | 14.7 |
| dev-IB-file-C1 | 11:27:28 | 0 | 12.7 |
| dev-IB-file-C2 | 11:27:41 | 0 | 12.9 |
| r1-SHc-fold-W | 11:32:03 | 0 | 4.2 |
| r1-SHc-fold-C1 | 11:32:08 | 0 | 4.7 |
| r1-SHc-fold-C2 | 11:32:12 | 0 | 4.4 |
| r1-SHc-file-W | 11:32:17 | 0 | 4.4 |
| r1-SHc-file-C1 | 11:32:21 | 0 | 4.3 |
| r1-SHc-file-C2 | 11:32:25 | 0 | 4.1 |
| r1-SHa-fold-W | 11:32:30 | 0 | 5.3 |
| r1-SHa-fold-Wnow | 11:32:35 | 0 | 4.9 |
| r1-SHa-fold-C1 | 11:32:40 | 0 | 5.3 |
| r1-SHa-fold-C2 | 11:32:45 | 0 | 5.1 |
| r1-SHa-file-W | 11:32:50 | 0 | 4.8 |
| r1-SHa-file-Wread | 11:32:55 | 0 | 5.1 |
| r1-SHa-file-C1 | 11:33:00 | 0 | 3.9 |
| r1-SHa-file-C2 | 11:33:04 | 0 | 3.9 |
| r1-BT-file-W | 11:33:08 | 0 | 10.3 |
| r1-BT-file-C1 | 11:33:18 | 0 | 11.7 |
| r1-BT-file-C2 | 11:33:30 | 0 | 12.0 |
| r1-BT-file-C3 | 11:33:42 | 0 | 11.7 |
| r1-BT-fold-W | 11:33:54 | 0 | 14.5 |
| r1-BT-fold-C1 | 11:34:08 | 0 | 11.5 |
| r1-BT-fold-C2 | 11:34:20 | 0 | 10.6 |
| r1-BT-fold-C3 | 11:34:31 | 0 | 10.9 |
| r1-IB-fold-W | 11:34:42 | 0 | 12.3 |
| r1-IB-fold-C1 | 11:34:54 | 0 | 11.4 |
| r1-IB-fold-C2 | 11:35:05 | 0 | 9.3 |
| r1-IB-fold-Wclean | 11:35:15 | 0 | 10.7 |
| r1-IB-fold-C1clean | 11:35:26 | 0 | 9.7 |
| r1-IB-file-W | 11:35:35 | 0 | 8.6 |
| r1-IB-file-C1 | 11:35:44 | 0 | 6.9 |
| r1-IB-file-C2 | 11:35:51 | 0 | 8.6 |
| r1-IB-file-Wclean | 11:35:59 | 0 | 9.4 |
| r1-IB-file-C1clean | 11:36:09 | 0 | 10.2 |
| dev2-SHc-fold-Wclean | 11:36:43 | 0 | 10.2 |
| dev2-SHc-fold-C1clean | 11:36:54 | 0 | 9.0 |
| dev2-SHc-file-C1clean | 11:37:03 | 0 | 8.3 |
| dev2-SHa-fold-Wclean | 11:37:11 | 0 | 8.7 |
| dev2-SHa-fold-C1clean | 11:37:20 | 0 | 8.2 |
| dev2-SHa-file-C1clean | 11:37:28 | 0 | 8.9 |
| r2-SHc-fold-W | 11:37:56 | 0 | 9.8 |
| r3-SHc-fold-W | 11:37:56 | 0 | 11.1 |
| r2-SHc-fold-C1 | 11:38:06 | 0 | 10.6 |
| r3-SHc-fold-C1 | 11:38:08 | 0 | 12.0 |
| r2-SHc-fold-C2 | 11:38:17 | 0 | 9.4 |
| r3-SHc-fold-C2 | 11:38:20 | 0 | 11.5 |
| r2-SHc-file-W | 11:38:26 | 0 | 10.3 |
| r3-SHc-file-W | 11:38:31 | 0 | 11.1 |
| r2-SHc-file-C1 | 11:38:37 | 0 | 10.4 |
| r3-SHc-file-C1 | 11:38:42 | 0 | 8.5 |
| r2-SHc-file-C2 | 11:38:47 | 0 | 8.5 |
| r3-SHc-file-C2 | 11:38:51 | 0 | 9.8 |
| r2-SHc-fold-Wclean | 11:38:56 | 0 | 10.1 |
| r3-SHc-fold-Wclean | 11:39:01 | 0 | 10.4 |
| r2-SHc-fold-C1clean | 11:39:06 | 0 | 9.1 |
| r3-SHc-fold-C1clean | 11:39:11 | 0 | 8.4 |
| r2-SHc-file-C1clean | 11:39:15 | 0 | 7.5 |
| r3-SHc-file-C1clean | 11:39:19 | 0 | 6.9 |
| r2-SHa-fold-Wclean | 11:39:22 | 0 | 8.2 |
| r3-SHa-fold-Wclean | 11:39:26 | 0 | 7.4 |
| r2-SHa-fold-C1clean | 11:39:31 | 0 | 7.5 |
| r3-SHa-fold-C1clean | 11:39:34 | 0 | 7.5 |
| r2-SHa-file-C1clean | 11:39:38 | 0 | 8.6 |
| r3-SHa-file-C1clean | 11:39:41 | 0 | 8.6 |
| r2-SHa-fold-W | 11:39:47 | 0 | 10.3 |
| r3-SHa-fold-W | 11:39:50 | 0 | 10.7 |
| r2-SHa-fold-Wnow | 11:39:57 | 0 | 11.8 |
| r3-SHa-fold-Wnow | 11:40:01 | 0 | 12.2 |
| r2-SHa-fold-C1 | 11:40:09 | 0 | 9.4 |
| r3-SHa-fold-C1 | 11:40:13 | 0 | 10.4 |
| r2-SHa-fold-C2 | 11:40:18 | 0 | 9.4 |
| r3-SHa-fold-C2 | 11:40:23 | 0 | 9.3 |
| r2-SHa-file-W | 11:40:28 | 0 | 9.6 |
| r3-SHa-file-W | 11:40:33 | 0 | 9.1 |
| r2-SHa-file-Wread | 11:40:37 | 0 | 8.8 |
| r3-SHa-file-Wread | 11:40:42 | 0 | 9.7 |
| r2-SHa-file-C1 | 11:40:46 | 0 | 8.2 |
| r3-SHa-file-C1 | 11:40:52 | 0 | 10.0 |
| r2-SHa-file-C2 | 11:40:55 | 0 | 9.7 |
| r3-SHa-file-C2 | 11:41:02 | 0 | 9.0 |
| r2-BT-file-W | 11:41:04 | 0 | 10.8 |
| r3-BT-file-W | 11:41:11 | 0 | 11.0 |
| r2-BT-file-C1 | 11:41:15 | 0 | 10.0 |
| r3-BT-file-C1 | 11:41:22 | 0 | 12.5 |
| r2-BT-file-C2 | 11:41:25 | 0 | 10.7 |
| r3-BT-file-C2 | 11:41:34 | 0 | 12.8 |
| r2-BT-file-C3 | 11:41:36 | 0 | 11.5 |
| r3-BT-file-C3 | 11:41:47 | 0 | 11.0 |
| r2-BT-fold-W | 11:41:47 | 0 | 12.8 |
| r3-BT-fold-W | 11:41:58 | 0 | 13.0 |
| r2-BT-fold-C1 | 11:42:00 | 0 | 11.2 |
| r3-BT-fold-C1 | 11:42:11 | 0 | 11.5 |
| r2-BT-fold-C2 | 11:42:11 | 0 | 11.5 |
| r2-BT-fold-C3 | 11:42:23 | 0 | 11.8 |
| r3-BT-fold-C2 | 11:42:22 | 0 | 13.1 |
| r2-IB-fold-W | 11:42:35 | 0 | 12.5 |
| r3-BT-fold-C3 | 11:42:36 | 0 | 15.9 |
| r2-IB-fold-C1 | 11:42:47 | 0 | 13.5 |
| r3-IB-fold-W | 11:42:51 | 0 | 13.9 |
| r2-IB-fold-C2 | 11:43:01 | 0 | 10.3 |
| r3-IB-fold-C1 | 11:43:05 | 0 | 12.7 |
| r2-IB-fold-Wclean | 11:43:11 | 0 | 13.9 |
| r3-IB-fold-C2 | 11:43:18 | 0 | 12.5 |
| r2-IB-fold-C1clean | 11:43:25 | 0 | 12.9 |
| r3-IB-fold-Wclean | 11:43:31 | 0 | 12.1 |
| r2-IB-file-W | 11:43:38 | 0 | 12.2 |
| r3-IB-fold-C1clean | 11:43:43 | 0 | 11.3 |
| r2-IB-file-C1 | 11:43:50 | 0 | 12.8 |
| r3-IB-file-W | 11:43:54 | 0 | 12.9 |
| r2-IB-file-C2 | 11:44:03 | 0 | 11.2 |
| r3-IB-file-C1 | 11:44:07 | 0 | 13.8 |
| r2-IB-file-Wclean | 11:44:14 | 0 | 11.5 |
| r3-IB-file-C2 | 11:44:21 | 0 | 11.6 |
| r2-IB-file-C1clean | 11:44:26 | 0 | 11.6 |
| r3-IB-file-Wclean | 11:44:33 | 0 | 11.5 |
| r3-IB-file-C1clean | 11:44:44 | 0 | 8.1 |

### B. Small bounded commands (`logs/runs-small.txt`, via q.sh)

| label | start ET | exit | wall s |
|---|---|---|---|
| copy-base | 11:03:25 | 0 | 4.4 |
| ids | 11:03:30 | 0 | 0.1 |
| syntax | 11:19:26 | 0 | 0.2 |
| show | 11:19:40 | 1 | 0.2 |
| show | 11:20:01 | 0 | 0.3 |
| show | 11:21:14 | 0 | 0.2 |
| show | 11:23:14 | 0 | 0.3 |
| show | 11:23:22 | 0 | 0.2 |
| show | 11:25:32 | 0 | 0.2 |
| show | 11:25:44 | 0 | 0.2 |
| show | 11:26:51 | 0 | 0.2 |
| show | 11:27:58 | 0 | 0.2 |
| hash | 11:29:19 | 0 | 7.5 |
| syntax2 | 11:29:34 | 0 | 0.2 |
| check-dev | 11:31:37 | 0 | 0.1 |
| mkpatch | 11:33:46 | 0 | 0.7 |
| diff-P1 | 11:33:51 | 1 | 0.2 |
| diff-P2 | 11:33:52 | 1 | 0.2 |
| diff-P3 | 11:33:52 | 1 | 0.2 |
| diff-P4 | 11:33:52 | 1 | 0.2 |
| ids2 | 11:34:13 | 0 | 0.2 |
| edit-check | 11:36:17 | 0 | 0.2 |
| matrix-r1 | 11:32:03 | 0 | 255.8 |
| edit-probe | 11:36:37 | 0 | 0.2 |
| syntax3 | 11:36:37 | 0 | 0.1 |
| check-dev2 | 11:37:41 | 0 | 0.2 |
| check-r1 | 11:37:46 | 0 | 0.3 |
| texts | 11:38:05 | 0 | 0.2 |
| texts | 11:38:06 | 0 | 0.2 |
| texts | 11:38:06 | 0 | 0.2 |
| texts | 11:38:06 | 0 | 0.1 |
| texts | 11:38:06 | 0 | 0.2 |
| ob-status | 11:38:36 | 0 | 0.1 |
| ob-head | 11:38:37 | 0 | 8.2 |
| ob-board | 11:38:45 | 0 | 7.8 |
| ob-wt | 11:38:53 | 0 | 0.1 |
| edit-proposal | 11:41:37 | 0 | 0.2 |
| matrix-r2 | 11:37:56 | 0 | 401.3 |
| matrix-r3 | 11:37:56 | 0 | 416.0 |
| check-r2 | 11:45:00 | 0 | 0.3 |
| check-r3 | 11:45:00 | 0 | 0.2 |
| check-r1 | 11:45:10 | 0 | 0.3 |
| idcheck | 11:45:10 | 0 | 0.3 |
| cmp12 | 11:45:20 | 0 | 0.2 |
| cmp23 | 11:45:20 | 0 | 0.2 |
| evo | 11:45:33 | 0 | 0.3 |
| ids-final | 11:45:43 | 0 | 8.0 |

### C. PIDs (`pids.txt`: the timeout PID and its child, with the command; grouped here by label)

| label | PIDs (timeout, child; "gone" = exited before it was read) |
|---|---|
| copy-base | 1200(gone) |
| ids | 2463(timeout), 2466(gone) |
| syntax | 2101(gone), 2103(gone) |
| dev-SHc-fold-W | 3613(timeout), 3618(gone), 4195(timeout), 4197(node) |
| show | 3644(timeout), 3649(node), 4786(timeout), 4790(node), 10359(timeout), 10364(node), 17072(timeout), 17074(node), 17193(timeout), 17195(node), 19307(timeout), 19312(node), 21252(timeout), 21254(node), 25432(timeout), 25437(node), 29792(timeout), 29795(gone) |
| dev-SHc-fold-C1 | 6108(timeout), 6113(node) |
| dev-SHc-fold-C2 | 7576(timeout), 7578(node) |
| dev-SHc-file-W | 8366(timeout), 8371(node) |
| dev-SHc-file-C1 | 9038(timeout), 9043(node) |
| dev-SHc-file-C2 | 9636(timeout), 9638(node) |
| dev-SHa-fold-W | 10813(timeout), 10815(node) |
| dev-SHa-fold-Wnow | 11142(timeout), 11145(node) |
| dev-SHa-fold-C1 | 11673(timeout), 11678(node) |
| dev-SHa-fold-C2 | 12488(timeout), 12490(node) |
| dev-SHa-file-W | 13748(timeout), 13755(node) |
| dev-SHa-file-Wread | 14716(timeout), 14719(node) |
| dev-SHa-file-C1 | 15705(timeout), 15707(node) |
| dev-SHa-file-C2 | 16608(timeout), 16613(node) |
| dev-BT-file-W | 17276(timeout), 17279(node) |
| dev-BT-file-C1 | 17391(timeout), 17393(node) |
| dev-BT-file-C2 | 17729(timeout), 17731(node) |
| dev-BT-file-C3 | 17900(timeout), 17905(node) |
| dev-BT-fold-W | 18134(timeout), 18139(node) |
| dev-BT-fold-C1 | 18363(timeout), 18367(node) |
| dev-BT-fold-C2 | 18521(timeout), 18529(node) |
| dev-BT-fold-C3 | 18923(timeout), 18925(node) |
| dev-IB-fold-W | 22987(timeout), 22992(node) |
| dev-IB-fold-C1 | 24800(timeout), 24803(node) |
| dev-IB-fold-C2 | 25119(timeout), 25122(node) |
| dev-IB-fold-Wclean | 25258(timeout), 25260(node) |
| dev-IB-fold-C1clean | 25528(timeout), 25533(node) |
| dev-IB-file-W | 25982(timeout), 25987(node) |
| dev-IB-file-C1 | 27497(timeout), 27502(node) |
| dev-IB-file-C2 | 28338(timeout), 28340(node) |
| hash | 30494(gone) |
| syntax2 | 31823(timeout), 31825(gone) |
| check-dev | 397(timeout), 399(node) |
| matrix-r1 | 4306(timeout), 4313(matrix.sh) |
| r1-SHc-fold-W | 4324(timeout), 4328(node) |
| r1-SHc-fold-C1 | 4446(timeout), 4448(node) |
| r1-SHc-fold-C2 | 4893(timeout), 4898(node) |
| r1-SHc-file-W | 4937(timeout), 4942(node) |
| r1-SHc-file-C1 | 4990(timeout), 4995(node) |
| r1-SHc-file-C2 | 5021(timeout), 5026(node) |
| r1-SHa-fold-W | 5082(timeout), 5085(node) |
| r1-SHa-fold-Wnow | 5148(timeout), 5153(node) |
| r1-SHa-fold-C1 | 5179(timeout), 5184(node) |
| r1-SHa-fold-C2 | 5211(timeout), 5213(node) |
| r1-SHa-file-W | 5267(timeout), 5270(node) |
| r1-SHa-file-Wread | 6144(timeout), 6146(node) |
| r1-SHa-file-C1 | 7913(timeout), 7918(node) |
| r1-SHa-file-C2 | 7965(timeout), 7967(node) |
| r1-BT-file-W | 9234(timeout), 9240(node) |
| r1-BT-file-C1 | 10292(timeout), 10294(node) |
| r1-BT-file-C2 | 11275(timeout), 11278(node) |
| r1-BT-file-C3 | 11421(timeout), 11426(node) |
| mkpatch | 11605(timeout), 11607(python3) |
| diff-P1 | 12466(timeout), 12471(git) |
| diff-P2 | 12538(timeout), 12542(git) |
| diff-P3 | 12573(timeout), 12579(git) |
| diff-P4 | 12612(timeout), 12616(git) |
| r1-BT-fold-W | 12887(timeout), 12892(node) |
| r1-BT-fold-C1 | 13655(timeout), 13658(node) |
| ids2 | 13742(timeout), 13745(git) |
| r1-BT-fold-C2 | 13843(timeout), 13845(node) |
| r1-BT-fold-C3 | 13886(timeout), 13888(node) |
| r1-IB-fold-W | 14062(timeout), 14066(node) |
| r1-IB-fold-C1 | 15202(timeout), 15205(node) |
| r1-IB-fold-C2 | 15928(timeout), 15930(node) |
| r1-IB-fold-Wclean | 16100(timeout), 16102(node) |
| r1-IB-fold-C1clean | 17478(timeout), 17484(node) |
| r1-IB-file-W | 18197(timeout), 18202(node) |
| r1-IB-file-C1 | 18300(timeout), 18302(node) |
| r1-IB-file-C2 | 18346(timeout), 18349(node) |
| r1-IB-file-Wclean | 18448(timeout), 18453(node) |
| r1-IB-file-C1clean | 18501(timeout), 18505(node) |
| edit-check | 19598(gone), 19600(gone) |
| edit-probe | 20165(timeout), 20170(python3) |
| syntax3 | 20189(timeout), 20194(gone) |
| dev2-SHc-fold-Wclean | 20239(timeout), 20244(node) |
| dev2-SHc-fold-C1clean | 20285(timeout), 20290(node) |
| dev2-SHc-file-C1clean | 20351(timeout), 20354(node) |
| dev2-SHa-fold-Wclean | 20420(timeout), 20422(node) |
| dev2-SHa-fold-C1clean | 20522(timeout), 20527(node) |
| dev2-SHa-file-C1clean | 20575(timeout), 20580(node) |
| check-dev2 | 20629(timeout), 20634(node) |
| check-r1 | 20672(timeout), 20674(node), 8934(timeout), 8939(node) |
| matrix-r2 | 20869(timeout), 20871(matrix.sh) |
| matrix-r3 | 20887(timeout), 20901(matrix.sh) |
| r2-SHc-fold-W | 20878(timeout), 20886(node) |
| r3-SHc-fold-W | 20923(timeout), 20927(node) |
| texts | 20968(timeout), 20973(node), 20998(timeout), 21006(gone), 21031(timeout), 21033(node), 21061(timeout), 21066(node), 21111(timeout), 21115(node) |
| r2-SHc-fold-C1 | 21092(timeout), 21097(node) |
| r3-SHc-fold-C1 | 21193(timeout), 21195(node) |
| r2-SHc-fold-C2 | 21240(timeout), 21245(node) |
| r3-SHc-fold-C2 | 21271(timeout), 21274(node) |
| r2-SHc-file-W | 21465(timeout), 21470(node) |
| r3-SHc-file-W | 22194(timeout), 22198(node) |
| ob-status | 22609(gone), 22614(gone) |
| r2-SHc-file-C1 | 22656(timeout), 22664(node) |
| r3-SHc-file-C1 | 24009(timeout), 24013(node) |
| ob-head | 22641(gone) |
| r2-SHc-file-C2 | 25601(timeout), 25607(node) |
| r3-SHc-file-C2 | 26194(timeout), 26199(node) |
| ob-board | 24822(gone) |
| ob-wt | 26517(gone), 26522(gone) |
| r2-SHc-fold-Wclean | 26579(timeout), 26581(node) |
| r3-SHc-fold-Wclean | 26635(timeout), 26640(node) |
| r2-SHc-fold-C1clean | 26692(timeout), 26694(node) |
| r3-SHc-fold-C1clean | 26763(timeout), 26768(node) |
| r2-SHc-file-C1clean | 26929(timeout), 26934(node) |
| r3-SHc-file-C1clean | 26979(timeout), 26984(node) |
| r2-SHa-fold-Wclean | 27015(timeout), 27020(node) |
| r3-SHa-fold-Wclean | 27078(timeout), 27083(node) |
| r2-SHa-fold-C1clean | 27150(timeout), 27153(node) |
| r3-SHa-fold-C1clean | 27193(timeout), 27198(node) |
| r2-SHa-file-C1clean | 27227(timeout), 27229(node) |
| r3-SHa-file-C1clean | 27384(timeout), 27389(node) |
| r2-SHa-fold-W | 27442(timeout), 27444(node) |
| r3-SHa-fold-W | 27498(timeout), 27500(node) |
| r2-SHa-fold-Wnow | 27551(timeout), 27556(node) |
| r3-SHa-fold-Wnow | 27592(timeout), 27597(node) |
| r2-SHa-fold-C1 | 27656(timeout), 27661(node) |
| r3-SHa-fold-C1 | 27689(timeout), 27692(node) |
| r2-SHa-fold-C2 | 27728(timeout), 27733(node) |
| r3-SHa-fold-C2 | 27766(timeout), 27771(node) |
| r2-SHa-file-W | 27814(timeout), 27816(node) |
| r3-SHa-file-W | 27860(timeout), 27862(node) |
| r2-SHa-file-Wread | 27893(timeout), 27896(node) |
| r3-SHa-file-Wread | 27946(timeout), 27951(node) |
| r2-SHa-file-C1 | 27999(timeout), 28004(node) |
| r3-SHa-file-C1 | 28050(timeout), 28052(node) |
| r2-SHa-file-C2 | 28084(timeout), 28086(node) |
| r3-SHa-file-C2 | 28145(timeout), 28150(node) |
| r2-BT-file-W | 28236(timeout), 28238(node) |
| r3-BT-file-W | 28403(timeout), 28408(node) |
| r2-BT-file-C1 | 28442(timeout), 28445(node) |
| r3-BT-file-C1 | 28480(timeout), 28483(node) |
| r2-BT-file-C2 | 28987(timeout), 28992(node) |
| r3-BT-file-C2 | 30809(timeout), 30817(node) |
| r2-BT-file-C3 | 30928(timeout), 30933(node) |
| edit-proposal | 31068(gone), 31074(gone) |
| r3-BT-file-C3 | 31737(timeout), 31742(node) |
| r2-BT-fold-W | 31832(timeout), 31842(node) |
| r3-BT-fold-W | 774(timeout), 776(node) |
| r2-BT-fold-C1 | 987(timeout), 989(node) |
| r3-BT-fold-C1 | 2781(timeout), 2783(node) |
| r2-BT-fold-C2 | 2908(timeout), 2917(node) |
| r3-BT-fold-C2 | 3057(timeout), 3062(node) |
| r2-BT-fold-C3 | 3086(timeout), 3088(node) |
| r2-IB-fold-W | 3263(timeout), 3265(node) |
| r3-BT-fold-C3 | 3292(timeout), 3294(node) |
| r2-IB-fold-C1 | 3483(timeout), 3488(node) |
| r3-IB-fold-W | 3518(timeout), 3520(node) |
| r2-IB-fold-C2 | 3900(timeout), 3902(node) |
| r3-IB-fold-C1 | 4464(timeout), 4476(node) |
| r2-IB-fold-Wclean | 5323(timeout), 5331(node) |
| r3-IB-fold-C2 | 6258(timeout), 6266(node) |
| r2-IB-fold-C1clean | 7082(timeout), 7084(node) |
| r3-IB-fold-Wclean | 7684(timeout), 7687(node) |
| r2-IB-file-W | 7774(timeout), 7777(node) |
| r3-IB-fold-C1clean | 7868(timeout), 7871(node) |
| r2-IB-file-C1 | 7973(timeout), 7975(node) |
| r3-IB-file-W | 8031(timeout), 8033(node) |
| r2-IB-file-C2 | 8129(timeout), 8131(node) |
| r3-IB-file-C1 | 8163(timeout), 8168(node) |
| r2-IB-file-Wclean | 8279(timeout), 8284(node) |
| r3-IB-file-C2 | 8345(timeout), 8347(node) |
| r2-IB-file-C1clean | 8387(timeout), 8392(node) |
| r3-IB-file-Wclean | 8457(timeout), 8459(node) |
| r3-IB-file-C1clean | 8560(timeout), 8562(node) |
| check-r2 | 8785(timeout), 8790(node) |
| check-r3 | 8815(timeout), 8819(node) |
| idcheck | 8966(timeout), 8971(node) |
| cmp12 | 9139(timeout), 9144(node) |
| cmp23 | 9169(timeout), 9174(node) |
| evo | 9369(timeout), 9371(node) |
| ids-final | 9611(gone) |

379 PID lines in pids.txt. No process was killed by this probe.

(The commands that produced this appendix and Appendix E are recorded in `logs/runs-small.txt` and `pids.txt` after these
tables were generated: `runs-table`, and any later `q.sh` lines.)

## Appendix E. Identities of the final files (git hash-object), and when this README was finalised
| file | blob |
|---|---|
| `check.mjs` | `aee1460398d6c183e405566247bd364147c3ab32` |
| `run.sh` | `beee09206efe3b432380e1cc92e6c235c7ff8e33` |
| `q.sh` | `ea041def7bc5c738c73cedb7533878f6b4bd0d23` |
| `matrix.sh` | `1a783b7c8a0b46f5aab0b7de71937837953f8a62` |
| `src/show.mjs` | `c3de3f3da14ab75b857a326bd63c5da268d05f3b` |
| `src/texts.mjs` | `f9a153f61a95dfb29a0d42fd6b71b457ba212cb7` |
| `src/runs-table.mjs` | `7c1bb75c0ee56ace0896b5423ff1153cd2978fe3` |
| `src/evo-table.mjs` | `cc5e567767aefb1df7fa3b14d0c2aecdede29739` |
| `src/cmp-passes.mjs` | `3b9bfca0458b5bb546c0c444498ad4cf77c6e334` |
| `src/idcheck.mjs` | `9718809881127b241edcc517763dc9e25e3af946` |
| `src/edit-check-clean.py` | `cd40d2621cc01c60f063c56d366476a3ce7c9f09` |
| `src/edit-probe-clean.py` | `96d3947bb9afb34b10767bfd509bed5127eb86a7` |
| `src/edit-proposal.py` | `1237211982c5fdbe62893025080675d80ed40176` |
| `PROPOSAL.md` | `dda183ac411dc8a277ab62689945600e3bf144b3` |
| `proposal/mkpatch.py` | `343718131a7334015953e9a4f73378e184296f03` |
| `proposal/P1.diff` | `8adfbcbdbffea9bce4553ccd1fee337c75ed22cb` |
| `proposal/P2.diff` | `4881b89eb37de71672ef0116fdc6e7fbc40794c9` |
| `proposal/P3.diff` | `6b268336061baeb7ebef77ec41757ad436cde6e3` |
| `proposal/P4.diff` | `cbb505cc63256bf119d446f6576db498f3fb563b` |
| `u24probe.mjs` | `6d3a0eb2ad20d0d262d472dca4834cac172cdd62` |
| `proposal/patched-copies-NEVER-RUN/P1…P4/prioritization-board-grid.html` | `bffdc809…` / `4dd1b42a…` / `486edfaf…` / `fd7f916d…` |

`matrix.sh` above is the final version, which lists all 38 scenarios. r1 ran an earlier version that did not yet name the six
clean-start path A scenarios. `check.mjs` above is the version that produced `logs/check-r1.log`, `logs/check-r2.log` and
`logs/check-r3.log`. The six `r1` RUN failures in check-r1 are those six scenarios, absent from r1.

README finalised at 11:46 AM ET on Mon 12 Oct 2026 (by `TZ=America/New_York date`). Work in this directory ran from 11:03 AM ET. **No earlier U24
attempt existed:** there was no `u24` directory at 11:03 AM ET, so nothing was resumed, and every run here is new.
