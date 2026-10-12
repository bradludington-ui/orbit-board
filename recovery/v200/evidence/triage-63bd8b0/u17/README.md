# U17 re-measured on the U13 commit (63bd8b0)

This re-measurement is read-only: no fix was applied anywhere. All runs took place on Monday 12 Oct 2026, from 10:04:33 to 11:08:06 ET; the probe matrices started their first run at 10:19:13 and their last at 11:01:10. Brad asked for it at 6:59 AM ET: "Re-measure U17 after U13".

## Verdict: REPRODUCED. U17 can still be reached on 63bd8b0, but not by any route that reached it before

**The measured routes are closed.** On 63bd8b0 (board `98eed7e8`), every route that reached U13's falsely clean end state before now ends consistent. V3next and V4putback from those end states behave correctly. That covers:
- the u13codex routes S1harness, S1tick, S1perm, S1open and S1pen;
- the verifier's V1same, V1sameperm and V2live;
- the u13probe second-writer route, W2pull and W2tick.

In detail:
- Brad's next 💾 Save writes the same content (WORKING, or BRAD-1) and asks nothing, which is correct.
- ↶ Put back says "Nothing is kept aside in this browser.", which is correct because nothing was kept.
- The refusal at the guard is silent on a quiet refresh. On a Connect (S1perm, S1open, V1sameperm) it says U13's committed words.

**The controls behave as they should.**
- On 1375b72b (`a8891e1`), the same 10 routes all still reach U17's state, `[adopted copy on screen, recorded clean, base = the save's copy]`. V3next writes over the head without asking on all 10.
- V4putback asks the false "still in the shared folder" question and keeps nothing aside on the 8 skew routes. On W2 nothing was kept, so no question is asked.
- The routes with no save under way, Cc and C1, adopt as an ordinary adoption on both boards. So do Ca, Cb and C3, which have nothing newer or DIRTY set.

**Still reachable on 63bd8b0, by routes U13 does not cover.** These are U24's adoption paths. Each was compared with the same steps and no save under way.

| route | what happens on 63bd8b0 (identical on 1375b72b) | no-save control |
|---|---|---|
| **SHd**: folder mode. "load the shared one" (`adoptShared`) is pressed while a 💾 Save is writing. The link stays on the status line during the write. | The board ends recorded clean against BRAD-2, the save's copy, with SHARED on screen. **V3next:** Save writes SHARED over BRAD-2 and asks nothing. BRAD-2 survives in the kept slot and as a `-recent` history copy. A later quiet refresh silently loads BRAD-2 back over SHARED, because the folder copy is newer. | **SHdC:** the record stays unclean, which is correct. |
| **SHdk**: SHd, with the shared state file stamped an hour ahead (the skew fixture) | The same U17 state **persists through a later refresh and a reopen** (K1, K2 and K3 fail): exactly U13's old end-state shape. V3next writes over without asking. | **SHdkC:** unclean, which is correct. |
| **FSHd**: the file-mode analogue (save into the board file) of SHd | Falsely clean. **V3next** writes SHARED over BRAD-2 in the file without asking; BRAD-2 survives only in the kept slot. **V4putback asks a false question:** "What is on screen now is still in the saved file it came from". The file holds BRAD-2, and SHARED is in no copy of the board after the put-back. | **FSHdC:** unclean, which is correct. |
| **FBT**: file mode. "open the file's version" (`bootTakeFile`, its confirm answered OK) is pressed while a 💾 Save into the file is writing. | Falsely clean against the file's BRAD-2, with F1 on screen. **V3next** writes F1 over BRAD-2 with no "HOLD ON" question. **BRAD-2 then exists in no copy this board can reach**: not the file, the screen, browser storage or the kept slot. Only an earlier file version holds it, which is Teams version history, outside the board. **This is data loss.** | **FBTC:** consistent. The next Save **asks** "HOLD ON". |

So the U17 behaviour is attributable to a save under way on SHd, SHdk, FSHd and FBT: Save writes the adopted copy over the save's copy without asking, and in FSHd Put back asks a false question and keeps nothing aside.

The U13 commit does not change these paths. The two boards differ only by U13's two guards in `driveStorePull`, and every one of these runs is identical on both boards.

**Not reproduced, and not U17:**

| route | result on both boards |
|---|---|
| U25ws (U25's save-during-read boundary) | consistent, against REMOTE. The next refresh and Save say the clash. |
| U25wf | consistent |
| U20, a save waiting for another tab's Web Lock (mocked) | consistent: the waiting save writes the adopted copy |
| `importBoards` | **counted** (`lsAll` → `lsSet` → `fileMark('board')`), so the save lands unsaved |

U25mid, where the save starts during the refresh's read and is still under way at the guard, is refused on 63bd8b0 and reaches U17 on 1375b72b. It is a new route, and the commit closes it.

**Falsely clean with no save involved**, measured identically on both boards. This is not U17's mechanism and is not caused by any save:

| route | how it ends |
|---|---|
| SHaC, the shared state file's automatic load | leaves the folder record clean against BRAD-1 while showing SHARED |
| BTC, `bootTakeFile` in folder mode | leaves the folder record clean against BRAD-1 while showing F1 |

In both, the next Save writes the screen copy over the head without asking. Nothing is lost; the head goes to history. Their save-held versions, SHa and BT, are therefore **not** counted as save-attributable U17 routes.

**Prerequisites and likelihood, not measured.**
- **SHd, SHdk and FSHd** need the legacy shared state file (the "sidecar"). On file:// it is opt-in (`localStorage spmtSidecar=1`); on http(s) it is fetched. They also need its answer to arrive after Brad has typed, and Brad to press the link while the save is writing. SHdk also needs that file stamped later than the save.
- **FBT** needs "open the file's version". That link is offered at opening only when the saved file is newer and this browser's work could not be kept aside. It must then be pressed while a file save is writing.

The harness calls these functions directly; see the caveats. How often any of this happens was not measured.

A correction, P1, is drafted in `PROPOSAL.md`: refuse these three loads while a save is under way. It has not been applied or run.

## Identities

| what | blob / value |
|---|---|
| **b63**: `cp -a` of `rec/L4/base` (git archive of orbit-board `63bd8b0`) | board `98eed7e801af20270f755eadffb2fa72355c30e5`; audit-import `4aba2506`; boot.mjs `9c4f49ad`; package.json `7cf8186f` (all equal to `git rev-parse 63bd8b0:<path>`) |
| **c137**: `git archive a8891e1` (board, tools, package.json) + the base's shim + `node_modules` symlink | board `1375b72b6707faa57c50d528e01ce9611f194998`; audit-import `ed9a3437`; boot.mjs `9c4f49ad`; package.json `7cf8186f` (all equal to `git rev-parse a8891e1:<path>`) |
| shim (both) / `node_modules` | `6e2ce2e6` / symlink to `/home/user/orbit-board/node_modules` |
| board diff c137 → b63 | `board-1375-to-98eed.diff` (`39cfe69e`, 36 lines). It has two hunks, both in `driveStorePull` (L26704, L26729). Its changed lines are identical to `rec/L3/u13/diffs/board.diff`. |
| W1H block | `src/w1h.mjs` = b63 audit-import L3745–3813 = c137 L3745–3813 = `rec/L2/u13codex/w1h-block.txt` (`e771578d`), all compared with `cmp` |
| **probe, final** (the `f-*` runs) | `u17-probe.mjs` `6b65ff659b6f2f374b29b2707cf1ce049a5eecf2` = `src/head.mjs` `403725b1` + `src/w1h.mjs` `e771578d` + `src/body.mjs` `08d74d0c` (`build.sh` `5e5bbbbf`). `src/runfile.mjs` `67bb5243` is spliced into the body by `edit2.py`. |
| probe, superseded (the `m-*` runs) | folder: `superseded/u17-probe-m-folder-92f62853.mjs` (body `88c8e0ba`). File: `superseded/u17-probe-m-file-441e3468.mjs` (body `e09dedd`). Why they were replaced is under "Runs". |
| runners | `q.sh` `48c98d71`, `r.sh` `3826b084`, `matrix.sh` `2d55e0f3` (final; the `m-*` chunks ran before its `P=` prefix and F chunks were added) |
| read-only tools | `mk.sh` `93b56b46`, `idcheck.sh` `782c0f6c`, `callers.sh` `43678ed3`, `agg.mjs` `a60ef178`, `scan.mjs` `e16a67de`, `detail.mjs` `ceb3bf29`, `table.mjs` `c8603aa5`, `table2.mjs` `999a0c91` |
| text edits of the probe source | `edit1.py` `5a8152fb`, `edit2.py` `19e15221`, `edit3.py` `34b22b80` (matrix.sh), `edit4.py` `5ead5ea9` |
| proposal (text only, never run) | `prop/mkprop.py` `4c756b37`, `prop/proposal-P1.diff` `60e00bee`, `prop/prioritization-board-grid.proposed.html` `f2e47609` |

In every run, `BOARD` and `MUT_FIRST_FAIL` were unset. The probe asserts that boot.mjs's `BOARD` is the copy's own board, and it records the board blob in each `out/*.json` (`ids`). The literal expectations are selected by that blob, and a run on any other blob throws.

**Continuation.** This session's first attempt hit the usage limit before running any probe. Its directory was renamed to `rec/L4/u17-aborted-at-usage-limit/`:
- It ran three text-only bash runs, all exit 0: mk-copies at 09:01:56 ET, idcheck at 09:02:10 and callers at 09:03:57. Their PIDs are in its own `pids.txt`.
- It left a draft probe (`src/`), which was never run.

The draft, `q.sh`, `mk.sh`, `idcheck.sh` and `callers.sh` were copied here. `mk.sh`, `idcheck.sh` and `callers.sh` were run again here, with the same results. The draft was then revised: per-board literal expectations, a contract tuple by content name, and the new routes.

## What each route is

All routes use the W1H mocks. The folder mock holds a write at the close of the main copy; the disk mock holds a write at close.

| route | origin | steps |
|---|---|---|
| S1harness, S1tick, S1perm, S1open, S1pen | u13codex | REMOTE/$650 is already in the folder, stamped one hour ahead. Brad adopts it and edits WORKING/$700 (unsaved). He reopens with the harness connect only. A 💾 Save is held at its write. A refresh runs during the hold: `driveStorePull(true)` / `liveTick()` / Connect with permission not kept / the opening's `driveAutoConnect` / Save via ✍ Take the pen, with REMOTE by Bob. Then the save lands, a later refresh runs, and the board is reopened (opening connect + refresh). |
| V1same, V1sameperm, V2live | u13codex verifier | V1same and V1sameperm: one browser profile (REMOTE written from Brad's own storage). V2live: the opening's own connect with Live on; both reads fail; the real Live `setInterval` tick pulls during the save. |
| W2pull, W2tick | u13probe | Brad saves BRAD-1/$700. His 2nd Save is held. Bob takes the pen and saves BOB-2/$650. Brad refreshes. |
| Ca / Cb / Cc / C1 / C3 | controls | Ca: REMOTE not ahead. Cb: no reopen (DIRTY true). Cc: **no save**, refresh adopts. C1: **no save**, Bob's copy adopted. C3: held save, no Bob. |
| U25ws / U25wf / U25mid | searched (U25) | The S1harness state; the refresh is held at its read. ws: its bytes (REMOTE) are already taken, and a **whole** save lands meanwhile. wf: held before its bytes are taken, and a whole save lands. mid: bytes taken, and a save **starts** and is held at its write. |
| L20 | searched (U20) | The S1harness state. `navigator.locks` is mocked in that window, with another tab holding `orbit-save`. 💾 Save waits for it; it is not counted in `_saveBusy`. A refresh runs, then the lock is released. |
| SHd / SHdC | searched (U24) | Brad saves BRAD-1 and types BRAD-2/$720. Carol's shared state file (SHARED/$600) arrives, and the board offers "load the shared one". A 💾 Save is held (SHd) or not (SHdC). `adoptShared()` is called. |
| SHdk / SHdkC | searched (U24) | SHd / SHdC with the shared state file stamped one hour ahead (Carol's clock fast) |
| SHa / SHaC | searched (U24) | Brad is clean (BRAD-1). A newer shared state file arrives, through `sharedArrived(st)`, during a held Save (SHa) or with no save (SHaC). |
| BT / BTC | searched (U24) | Brad saves BRAD-1 and types BRAD-2. `bootTakeFile()` is called (confirm OK) during a held Save (BT) or with no save (BTC). |
| IB / IBC | searched (U24) | Brad saves BRAD-1 and types BRAD-2. `importBoards()` runs on Carol's board file (IMPORT/$610) during a held Save (IB) or with no save (IBC). |
| FBT / FBTC / FSHd / FSHdC | searched (file analogue, the U2b-retry pattern) | As BT/BTC and SHd/SHdC, with 💾 Save writing into the board file (`disk()`, held at `close`) and no folder |

Each route ran with `next = save` (V3next: Brad's next 💾 Save from where the route ended) and `next = putback` (V4putback: ↶ put it back, then 💾 Save). The adoption and file families also ran with `none`, for the later refresh and reopen.
- For the skew and pen families, "where the route ended" is the reopened board, after a later refresh and a reopen (the verifier's shape).
- For the adoption and file families, it is the board right after the save landed, before any refresh.

## Expected vs observed

**Kinds of check.**
- **fixture:** a route's preconditions.
- **predict:** a literal written per board from reading its code before the run.
- **contract:** the property itself.
  - **K1/K2/K3:** a record that says saved names a copy that holds what is on screen.
  - **reach:** each content remains in some reachable copy.
  - **U17.V3:** from a falsely clean record, Save writes over a different head without asking.
  - **U17.V4:** from a falsely clean record, the put-back question claims "still in the shared folder" (or "in the saved file" for the file analogue) while the head holds other content, and the screen copy is then kept nowhere.

**Totals over the 160 final runs (`f-*`):**

| kind | pass | fail |
|---|---|---|
| fixture | 868 | 0 |
| predict | 462 | 0 |
| contract | 404 | 166 |

Every contract failure is on 1375b72b's measured routes, or on the U24/file routes on both boards. `logs/agg-final.log` lists them per run, and `logs/table-final.log` has the full expected and observed tuples. On 63bd8b0, every contract check on the 10 measured routes and the 9 controls/boundaries passes.

**Two literals were corrected after trial runs. Both were harness accounting; the product's behaviour was unchanged.**
1. U25mid's "folder writes during the refresh" was changed from 0 to 2. The save starts inside the refresh's window, so its history copy and its held main write fall within it.
2. L20's fixture now counts folder writes from the moment Save is pressed, not from the start. It had been counting REMOTE's own earlier write.

**One contract gap was found and fixed before the final runs.** The first matrix (`m-*`, superseded) listed only each route's two contents as the consistent alternatives. BTC's K2/K3 and FBTC's K3 then failed on `[BRAD-1, clean, BRAD-1]`, which is consistent. `edit4.py` made the alternatives every named content (`CONSISTENT`). The whole matrix was then re-run as `f-*`. The `m-*` results otherwise match `f-*`: every fixture and predict check passed there too (784 + 396 folder; file runs as `f-*`).

**The literal tuples** are written in `src/body.mjs` (`EXP0`, per board). They are:

| check | tuple |
|---|---|
| refresh | [returned, `_saveBusy`, screen, record dirty, `_saveGen` unchanged, kept slot, folder copy read, folder writes other than the lock, U13 words said] |
| adoption | [screen, `_saveBusy`, `_saveGen` unchanged, kept slot, its own words said] |
| V3next | [questions asked, screen before, head/file before, head/file after, status, clean after, record names head] |
| V4putback | [kept before, question's claim, screen before, head/file before, put-back status, kept after, screen after, head/file after Save, Save status (, Save asked)] |

### Condensed: one row per route and board (final runs; generated by `table2.mjs`, `logs/table2-final.log`)

`U17 state` is K1's prediction (expected / observed), with the observed tuple `[screen, recorded clean, base copy]`. **U17** marks a contract failure.

| route | board | U17 state: expected / observed [screen, clean, base copy] | K2 later refresh / K3 reopen | V3next: U17? (overwritten copy now in) | V4putback: U17? [falsely clean, claim, claim false, screen copy kept nowhere] | fixture+predict checks (all 3 runs) |
|---|---|---|---|---|---|---|
| S1harness | 63bd8b0 | false / false [WORKING,true,WORKING] | ok [WORKING,true,WORKING] / ok [WORKING,true,WORKING] | no (WORKING: folderHead, history (-recent), screen, storage) | no [false,none,false,false] | 20/20 |
| S1harness | 1375b72b | true / true [REMOTE,true,WORKING] | FAIL [REMOTE,true,WORKING] / FAIL [REMOTE,true,WORKING] | **U17** (WORKING: history (-recent), keptSlot) | **U17** [true,in-folder,true,true] | 20/20 |
| S1tick | 63bd8b0 | false / false [WORKING,true,WORKING] | ok / ok | no (WORKING: folderHead, history (-recent), screen, storage) | no [false,none,false,false] | 20/20 |
| S1tick | 1375b72b | true / true [REMOTE,true,WORKING] | FAIL / FAIL [REMOTE,true,WORKING] | **U17** (WORKING: history (-recent), keptSlot) | **U17** [true,in-folder,true,true] | 20/20 |
| S1perm | 63bd8b0 | false / false [WORKING,true,WORKING] | ok / ok | no (WORKING: folderHead, history (-recent), screen, storage) | no [false,none,false,false] | 20/20 |
| S1perm | 1375b72b | true / true [REMOTE,true,WORKING] | FAIL / FAIL [REMOTE,true,WORKING] | **U17** (WORKING: history (-recent), keptSlot) | **U17** [true,in-folder,true,true] | 20/20 |
| S1open | 63bd8b0 | false / false [WORKING,true,WORKING] | ok / ok | no (WORKING: folderHead, history (-recent), screen, storage) | no [false,none,false,false] | 20/20 |
| S1open | 1375b72b | true / true [REMOTE,true,WORKING] | FAIL / FAIL [REMOTE,true,WORKING] | **U17** (WORKING: history (-recent), keptSlot) | **U17** [true,in-folder,true,true] | 20/20 |
| S1pen | 63bd8b0 | false / false [WORKING,true,WORKING] | ok / ok | no (WORKING: folderHead, history (-recent), screen, storage) | no [false,none,false,false] | 20/20 |
| S1pen | 1375b72b | true / true [REMOTE,true,WORKING] | FAIL / FAIL [REMOTE,true,WORKING] | **U17** (WORKING: history (-recent), keptSlot) | **U17** [true,in-folder,true,true] | 20/20 |
| V1same | 63bd8b0 | false / false [WORKING,true,WORKING] | ok / ok | no (WORKING: folderHead, history (-recent), screen, storage) | no [false,none,false,false] | 20/20 |
| V1same | 1375b72b | true / true [REMOTE,true,WORKING] | FAIL / FAIL [REMOTE,true,WORKING] | **U17** (WORKING: history (-recent), keptSlot) | **U17** [true,in-folder,true,true] | 20/20 |
| V1sameperm | 63bd8b0 | false / false [WORKING,true,WORKING] | ok / ok | no (WORKING: folderHead, history (-recent), screen, storage) | no [false,none,false,false] | 20/20 |
| V1sameperm | 1375b72b | true / true [REMOTE,true,WORKING] | FAIL / FAIL [REMOTE,true,WORKING] | **U17** (WORKING: history (-recent), keptSlot) | **U17** [true,in-folder,true,true] | 20/20 |
| V2live | 63bd8b0 | false / false [WORKING,true,WORKING] | ok / ok | no (WORKING: folderHead, history (-recent), screen, storage) | no [false,none,false,false] | 20/20 |
| V2live | 1375b72b | true / true [REMOTE,true,WORKING] | FAIL / FAIL [REMOTE,true,WORKING] | **U17** (WORKING: history (-recent), keptSlot) | **U17** [true,in-folder,true,true] | 20/20 |
| W2pull | 63bd8b0 | false / false [BRAD-1,true,BRAD-1] | ok / ok | no (BRAD-1: folderHead, history (-recent), screen, storage) | no [false,none,false,false] | 20/20 |
| W2pull | 1375b72b | true / true [BOB-2,true,BRAD-1] | FAIL / FAIL [BOB-2,true,BRAD-1] | **U17** (BRAD-1: history (-recent)) | no [true,none,false,false] | 20/20 |
| W2tick | 63bd8b0 | false / false [BRAD-1,true,BRAD-1] | ok / ok | no (BRAD-1: folderHead, history (-recent), screen, storage) | no [false,none,false,false] | 20/20 |
| W2tick | 1375b72b | true / true [BOB-2,true,BRAD-1] | FAIL / FAIL [BOB-2,true,BRAD-1] | **U17** (BRAD-1: history (-recent)) | no [true,none,false,false] | 20/20 |
| Ca | 63bd8b0 / 1375b72b | false / false [WORKING,true,WORKING] (both) | ok / ok | no | no [false,none,false,false] | 20/20 each |
| Cb | 63bd8b0 / 1375b72b | false / false [WORKING,true,WORKING] (both) | ok / ok | no | no [false,none,false,false] | 20/20 each |
| Cc (no save) | 63bd8b0 / 1375b72b | false / false [REMOTE,true,REMOTE] (both) | ok / ok | no | no [false,in-folder,false,true] | 16/16 each |
| C1 (no save) | 63bd8b0 / 1375b72b | false / false [BOB-2,true,BOB-2] (both) | ok / ok | no | no [false,none,false,false] | 14/14 each |
| C3 | 63bd8b0 / 1375b72b | false / false [BRAD-1,true,BRAD-1] (both) | ok / ok | no | no [false,none,false,false] | 16/16 each |
| U25ws | 63bd8b0 / 1375b72b | false / false [REMOTE,true,REMOTE] (both) | ok (said) / ok (said) | no (WORKING: folderHead) | no [false,none,false,false] | 20/20 each |
| U25wf | 63bd8b0 / 1375b72b | false / false [WORKING,true,WORKING] (both) | ok / ok | no | no [false,none,false,false] | 20/20 each |
| U25mid | 63bd8b0 | false / false [WORKING,true,WORKING] | ok / ok | no | no [false,none,false,false] | 20/20 |
| U25mid | 1375b72b | true / true [REMOTE,true,WORKING] | FAIL / FAIL [REMOTE,true,WORKING] | **U17** (WORKING: history (-recent), keptSlot) | **U17** [true,in-folder,true,true] | 20/20 |
| L20 | 63bd8b0 / 1375b72b | false / false [REMOTE,true,REMOTE] (both) | ok / ok | no | no [false,in-folder,false,false] | 20/20 each |
| **SHd** | 63bd8b0 / 1375b72b | **true / true [SHARED,true,BRAD-2]** (both) | ok [BRAD-2,true,BRAD-2] / ok (healed by the quiet refresh) | **U17** (BRAD-2: history (-recent), keptSlot) | no [true,in-file,false,true] | 29/29 each |
| SHdC (no save) | 63bd8b0 / 1375b72b | false / false [SHARED,false,BRAD-1] (both) | ok / ok | no | no [false,in-place,false,false] | 23/23 each |
| **SHdk** | 63bd8b0 / 1375b72b | **true / true [SHARED,true,BRAD-2]** (both) | **FAIL / FAIL [SHARED,true,BRAD-2]** | **U17** (BRAD-2: history (-recent), keptSlot) | no [true,in-file,false,true] | 29/29 each |
| SHdkC (no save) | 63bd8b0 / 1375b72b | false / false [SHARED,false,BRAD-1] (both) | ok / ok | no | no [false,in-place,false,false] | 23/23 each |
| SHa | 63bd8b0 / 1375b72b | true / true [SHARED,true,BRAD-1] (both) | FAIL / FAIL | **U17** (BRAD-1: history (-recent)) | no [true,none,false,false] | 23/23 each |
| SHaC (no save) | 63bd8b0 / 1375b72b | **true / true [SHARED,true,BRAD-1]** (both) | FAIL / FAIL | **U17** (BRAD-1: history) | no [true,none,false,false] | 17/17 each |
| BT | 63bd8b0 / 1375b72b | true / true [F1,true,BRAD-2] (both) | ok / ok (healed) | **U17** (BRAD-2: history (-recent) only) | no [true,none,false,false] | 23/23 each |
| BTC (no save) | 63bd8b0 / 1375b72b | **true / true [F1,true,BRAD-1]** (both) | ok / ok (healed) | **U17** (BRAD-1: history) | no [true,none,false,false] | 17/17 each |
| IB | 63bd8b0 / 1375b72b | false / false [IMPORT,false,BRAD-2] (both) | ok / ok | no | no [false,none,false,false] | 23/23 each |
| IBC (no save) | 63bd8b0 / 1375b72b | false / false [IMPORT,false,BRAD-1] (both) | ok / ok | no | no [false,none,false,false] | 17/17 each |
| **FBT** | 63bd8b0 / 1375b72b | **true / true [F1,true,BRAD-2]** (both) | – / ok (reopen opens the newer file) | **U17** (BRAD-2: **earlier file version only**: in no copy the board can reach) | no [true,none,false,false] | 20/20 each |
| FBTC (no save) | 63bd8b0 / 1375b72b | false / false [F1,true,F1] (both) | – / ok | no (asked "HOLD ON") | no [false,none,false,false] | 15/15 each |
| **FSHd** | 63bd8b0 / 1375b72b | **true / true [SHARED,true,BRAD-2]** (both) | – / ok | **U17** (BRAD-2: keptSlot, earlier file version) | **U17** [true,in-file,true,true] | 23/23 each |
| FSHdC (no save) | 63bd8b0 / 1375b72b | false / false [SHARED,false,BRAD-1] (both) | – / ok | no | no [false,in-place,false,false] | 17/17 each |

The rows marked "(both)" were checked as identical on the two boards; `logs/table2-final.log` has one row per board.

**V3next / V4putback literal tuples, final runs.** Every observed tuple equals the expected one; the full list is in `logs/table-final.log`, sections B and C.

| route | board | V3next: expected = observed | V4putback: expected = observed |
|---|---|---|---|
| S1harness (all 8 skew routes the same) | 63bd8b0 | [0, WORKING, WORKING, WORKING, saved, true, true] | [null, none, WORKING, WORKING, nothing kept, null, WORKING, WORKING, saved] |
| S1harness (all 8 skew routes the same) | 1375b72b | [0, REMOTE, WORKING, REMOTE, saved, true, true] | [WORKING, in-folder, REMOTE, WORKING, put back, null, WORKING, WORKING, clash] |
| W2pull, W2tick | 63bd8b0 | [0, BRAD-1, BRAD-1, BRAD-1, saved, true, true] | [null, none, BRAD-1, BRAD-1, nothing kept, null, BRAD-1, BRAD-1, saved] |
| W2pull, W2tick | 1375b72b | [0, BOB-2, BRAD-1, BOB-2, saved, true, true] | [null, none, BOB-2, BRAD-1, nothing kept, null, BOB-2, BOB-2, saved] |
| SHd, SHdk | both | [0, SHARED, BRAD-2, SHARED, saved, true, true] | [BRAD-2, in-file, SHARED, BRAD-2, put back, null, BRAD-2, BRAD-2, clash] |
| FBT | both | [0, F1, BRAD-2, F1, saved-file, true, true] | [null, none, F1, BRAD-2, nothing kept, null, F1, F1, saved-file, 0] |
| FBTC | both | [**1**, F1, BRAD-1, F1, saved-file, true, true] (asks HOLD ON) | [null, none, F1, BRAD-1, nothing kept, null, F1, F1, saved-file, 1] |
| FSHd | both | [0, SHARED, BRAD-2, SHARED, saved-file, true, true] | [BRAD-2, in-file, SHARED, BRAD-2, put back, null, BRAD-2, BRAD-2, saved-file, 1] |

**The words, as observed.** Board times are shown as `<time>`: the jsdom board prints the container's UTC clock, and SHdk's shared state file is stamped an hour ahead by design.
- **63bd8b0, a Connect during the held save (S1perm, S1open, V1sameperm)**, U13's committed words exactly: "⏳ The shared folder’s copy of O&M FY27 was not loaded: a save or Load theirs was under way, so this board kept its own copy of O&M FY27. The folder’s copy is checked again on the next refresh once that has finished (📡 Live view → ↻ Refresh now, or on its own while Live view is on)."
- **SHd/SHdk, during the held save (the link Brad presses):** "⚠ The shared state file (<time>) arrived after you started working, so nothing was replaced. 💾 Save yours, or load the shared one (what you have is kept aside first)."
  - After the click: "Shared state loaded (published <time>)."
  - After the landing: "✅ Saved O&M FY27 to the shared folder — 5 KB. Everyone sees it on their next refresh.", with the header "Saved <time> · ↶ work kept aside".
- **FBT:**
  - The confirm answered OK: "Open the saved file’s version and replace what is on screen? This browser’s own work is NOT kept — only in a copy you saved yourself."
  - The landing: "💾 Saved in place by Brad — "Board.html" now carries this state."
  - The next Save asked nothing.
- **FSHd, the put-back question:** "Put back the work this browser kept aside on <time>? What is on screen now is replaced by it. What is on screen now is still in the saved file it came from, and 💾 Save will ask before writing over that." The file held BRAD-2; SHARED was then in no copy of the board.

## Other observations (not U17; nothing lost unless said)

**1. U24's `importBoards` row ("no count") is not true for the open appropriation.**
- `lsAll` writes this board's key through `lsSet` → `fileMark('board')` → `_saveGen++`, `DIRTY=true` (b63 L2246–2250, L2261–2268).
- A save under way therefore lands unsaved ("A change made while it was saving is not in the folder yet"). This is IB/IBC, measured on both boards.

**2. Sidecar auto-load and `bootTakeFile` in folder mode give a falsely clean record without any save** (SHaC, BTC). See `PROPOSAL.md` P2.
- In BT, BTC and SHd, a later quiet refresh **silently** replaces the loaded copy with the newer folder copy (K2 "ok"), and no message is shown.
- In SHdk, where the shared state file is stamped ahead, it does not.

**3. U25 (U25ws), measured on both boards.**
- The refresh adopts the REMOTE copy it had already read, consistent against REMOTE. The folder head is the save's WORKING.
- The later refresh and the reopen say "after the copy you are working from".
- Save is refused with the clash, and nothing is lost.
- This agrees with the ledger's U25 row; its follow-up message is now measured.

**4. U20 (L20, navigator.locks mocked; jsdom has none), on both boards.**
- The waiting save is not counted; the refresh adopts REMOTE and keeps WORKING aside. The save then writes REMOTE, consistent.
- In V4putback, put-back WORKING (whose base is REMOTE's original time) meets a head that is Brad's own re-save of REMOTE, with a new time. Save is refused with "Brad saved … after the copy you are working from".
- That is a false clash about the board's own copy. Nothing is lost.

**5. Cc on both boards: the put-back question's promise "💾 Save will ask before writing over that" was not kept.**
- The kept WORKING's base was REMOTE itself, so Save wrote WORKING over REMOTE without asking.
- REMOTE stays in the folder history.

**6. U18 is unchanged on 63bd8b0.** In W2pull and W2tick, BOB-2 is in neither the folder head nor its history; it is only on Bob's own board.

## Runs, PIDs, locks

**Every command here was bounded and recorded** through `q.sh` (`setsid -w timeout -k 10 600 …`). That covers every node run, every python edit after the first, every bash script and each chunk wrapper. The runs are:

| group | count | what |
|---|---|---|
| tools | 25 | mk-copies, idcheck, callers, build1–5, edit1/edit2/edit2b/edit3/edit4, agg×2, scan×2, detail×4, table×2, mkprop, appendruns |
| trials | 12 | `trial-*`, `trial2-*`, `trial3-*` |
| superseded matrix | 160 | `m-*` (10 chunk wrappers) |
| final matrix | 160 | `f-*` (10 chunk wrappers, `fchunk-*`) |

- **Exit codes:** every run exited 0; none timed out.
- **Wall time:** the longest probe run was 30.3 s (V2live on 63bd8b0, which waits 15 s for an adoption that is refused). The longest chunk was 248.6 s.
- **PIDs:** `pids.txt` (754 lines, 377 runs) holds each run's `timeout` PID and its child, with the command. At 11:04 ET none of the recorded PIDs was alive. Nothing was killed, by PID or otherwise.
- **The lock:** `AUDIT_IMPORT_RUNNING` was checked before every node run and was never present (0 lock waits).
- **Logs:** `logs/runs.txt` lists every run (label, start ET, exit, wall s) and is reproduced at the end of this file.
  - Per-run output is in `logs/<label>.log`.
  - Per-run observed values for every step are in `out/<label>.json`.

**Disclosures:**
- **Unbounded commands.**
  - One `python3` heredoc (about 10:15 ET, just before `build1`; a text edit of `src/body.mjs` and `src/head.mjs`, under 1 s) was **not** bounded and is not in `pids.txt`.
  - One `sed -i` edit of `agg.mjs` (about 11:01 ET) and many read-only `cat`/`grep`/`sed -n`/`ls`/`diff`/`git hash-object` inspections were run directly.
- **`git status` in the repositories.** Read-only `git status --short` ran:
  - in `/home/user/orbit-board`, in `mk.sh` at 10:04 ET and again at about 11:04 ET;
  - in `/home/user/orbit-ui`, once, at about 11:04 ET.

  `git status` can refresh an index's stat cache. Nothing was edited, staged, committed or pushed in either repository.
- **Repository state.** orbit-board showed 0 changed paths each time. Its HEAD moved during the session (5318e1e → 6b20c16 → 97ce86e), through other work, not mine. orbit-ui showed one changed path, also not mine.
- **The base.** `rec/L4/base` was only copied (`cp -a`); its board still hashes to `98eed7e8`.

## Caveats (shortcuts, and whether they create the effect)

**Link presses are direct function calls.** `adoptShared()`, `bootTakeFile()` and `importBoards()` are called directly. The sidecar's arrival is `sharedArrived(st)` with Carol's `MS`; the fetch/XHR is not modelled.
- In SHd/SHdk the link was on the status line during the held save, so pressing it is the board's own call to action.
- `bootTakeFile`'s link is offered only by the opening, when the file is newer and this browser's work could not be kept aside. That condition was not reproduced; the function was called directly with its confirm answered OK.

**The SHa/SHaC and BT/BTC orders are forced.** SHa needs the sidecar's answer to arrive after a save has started; its answer comes once, at opening.

**The no-save controls decide attribution.**
- SHdC, SHdkC, FSHdC and FBTC stay unclean or ask. So SHd, SHdk, FSHd and FBT are attributable to the save under way.
- SHaC and BTC are falsely clean by themselves, so SHa and BT are not counted as save-attributable.

**Holds and mocks.**
- A hold at the close stands in for File System Access writes landing at close, as in u13codex. Ca, Cb, C3, U25wf and IB show the hold alone does not create the effect.
- `navigator.locks` (L20) is a mock with one other "tab" holding the lock.

**The contract tuple uses names for literal note/$ pairs**, for example `BRAD-2` = note "BRAD-2" and allocation $720. The "F1" content is the board file's own state: an empty note and no allocation.

## Not done

- Nothing was fixed or applied. P1 in `PROPOSAL.md` was produced on a scratch copy and was **never run**. No mutation was written.
- `mutate.mjs` was never imported, executed or run. The full audit-import and audit-board were not run.
- No Chromium or playwright was used, and there was no `playwright install`.
- Nothing in `/home/user/orbit-board` or `/home/user/orbit-ui` was edited, staged, committed or pushed. The ledger was not edited; the rows that would change are in the verdict and observations above.
- **Not run:**
  - a second save after V3next, which would show `snapPrune` removing the `-recent` copy (by code only);
  - two real browser tabs (U20 was mocked);
  - the file-mode sidecar automatic load;
  - `driveRestore`, `pkgApply` and `importState`, which are counted, by code;
  - cycle views.
- How likely any route is was not measured.

## Run list (logs/runs.txt)

```
mk-copies start=2026-10-12T10:04:33EDT exit=0 wall_s=2.2 
idcheck start=2026-10-12T10:04:35EDT exit=0 wall_s=0.3 
callers start=2026-10-12T10:04:35EDT exit=0 wall_s=0.0 
build1 start=2026-10-12T10:15:33EDT exit=0 wall_s=0.2 
trial-b63-S1harness-save start=2026-10-12T10:15:42EDT exit=0 wall_s=10.3 
trial-c137-S1harness-putback start=2026-10-12T10:15:57EDT exit=0 wall_s=10.5 
trial-b63-BT-none start=2026-10-12T10:16:13EDT exit=0 wall_s=8.6 
trial-b63-IB-none start=2026-10-12T10:16:21EDT exit=0 wall_s=8.9 
trial-b63-L20-none start=2026-10-12T10:16:30EDT exit=0 wall_s=9.8 
trial-b63-U25mid-none start=2026-10-12T10:16:40EDT exit=0 wall_s=10.2 
trial-b63-SHd-none start=2026-10-12T10:16:50EDT exit=0 wall_s=6.5 
edit1 start=2026-10-12T10:17:54EDT exit=0 wall_s=9.4 
build2 start=2026-10-12T10:18:03EDT exit=0 wall_s=0.2 
trial2-b63-L20-none start=2026-10-12T10:18:10EDT exit=0 wall_s=10.5 
trial2-b63-U25mid-none start=2026-10-12T10:18:21EDT exit=0 wall_s=11.9 
trial2-b63-SHdk-none start=2026-10-12T10:18:33EDT exit=0 wall_s=12.0 
m-b63-S1harness-save start=2026-10-12T10:19:13EDT exit=0 wall_s=11.0 
m-b63-S1harness-putback start=2026-10-12T10:19:24EDT exit=0 wall_s=9.9 
m-b63-S1tick-save start=2026-10-12T10:19:34EDT exit=0 wall_s=10.3 
m-b63-S1tick-putback start=2026-10-12T10:19:44EDT exit=0 wall_s=11.4 
m-b63-S1perm-save start=2026-10-12T10:19:56EDT exit=0 wall_s=13.0 
m-b63-S1perm-putback start=2026-10-12T10:20:09EDT exit=0 wall_s=12.2 
m-b63-S1open-save start=2026-10-12T10:20:21EDT exit=0 wall_s=10.9 
m-b63-S1open-putback start=2026-10-12T10:20:32EDT exit=0 wall_s=11.4 
m-b63-S1pen-save start=2026-10-12T10:20:44EDT exit=0 wall_s=10.7 
m-b63-S1pen-putback start=2026-10-12T10:20:55EDT exit=0 wall_s=10.8 
m-b63-V1same-save start=2026-10-12T10:21:05EDT exit=0 wall_s=9.2 
m-b63-V1same-putback start=2026-10-12T10:21:15EDT exit=0 wall_s=9.3 
m-b63-V1sameperm-save start=2026-10-12T10:21:24EDT exit=0 wall_s=8.7 
m-b63-V1sameperm-putback start=2026-10-12T10:21:33EDT exit=0 wall_s=12.4 
m-b63-V2live-save start=2026-10-12T10:21:45EDT exit=0 wall_s=27.3 
m-b63-V2live-putback start=2026-10-12T10:22:13EDT exit=0 wall_s=30.3 
m-b63-W2pull-save start=2026-10-12T10:22:43EDT exit=0 wall_s=9.0 
m-b63-W2pull-putback start=2026-10-12T10:22:52EDT exit=0 wall_s=8.6 
m-b63-W2tick-save start=2026-10-12T10:23:01EDT exit=0 wall_s=9.9 
m-b63-W2tick-putback start=2026-10-12T10:23:11EDT exit=0 wall_s=11.1 
chunk-M63 start=2026-10-12T10:19:13EDT exit=0 wall_s=248.6 
m-c137-S1harness-save start=2026-10-12T10:23:26EDT exit=0 wall_s=12.5 
m-c137-S1harness-putback start=2026-10-12T10:23:39EDT exit=0 wall_s=10.7 
m-c137-S1tick-save start=2026-10-12T10:23:49EDT exit=0 wall_s=9.1 
m-c137-S1tick-putback start=2026-10-12T10:23:59EDT exit=0 wall_s=10.7 
m-c137-S1perm-save start=2026-10-12T10:24:09EDT exit=0 wall_s=9.7 
m-c137-S1perm-putback start=2026-10-12T10:24:19EDT exit=0 wall_s=7.6 
m-c137-S1open-save start=2026-10-12T10:24:27EDT exit=0 wall_s=6.6 
m-c137-S1open-putback start=2026-10-12T10:24:33EDT exit=0 wall_s=9.6 
m-c137-S1pen-save start=2026-10-12T10:24:43EDT exit=0 wall_s=11.7 
m-c137-S1pen-putback start=2026-10-12T10:24:55EDT exit=0 wall_s=8.1 
m-c137-V1same-save start=2026-10-12T10:25:03EDT exit=0 wall_s=4.8 
m-c137-V1same-putback start=2026-10-12T10:25:08EDT exit=0 wall_s=4.9 
m-c137-V1sameperm-save start=2026-10-12T10:25:12EDT exit=0 wall_s=5.5 
m-c137-V1sameperm-putback start=2026-10-12T10:25:18EDT exit=0 wall_s=5.3 
m-c137-V2live-save start=2026-10-12T10:25:23EDT exit=0 wall_s=15.4 
m-c137-V2live-putback start=2026-10-12T10:25:39EDT exit=0 wall_s=15.3 
m-c137-W2pull-save start=2026-10-12T10:25:54EDT exit=0 wall_s=3.9 
m-c137-W2pull-putback start=2026-10-12T10:25:58EDT exit=0 wall_s=4.2 
m-c137-W2tick-save start=2026-10-12T10:26:02EDT exit=0 wall_s=4.4 
m-c137-W2tick-putback start=2026-10-12T10:26:07EDT exit=0 wall_s=5.0 
chunk-M137 start=2026-10-12T10:23:26EDT exit=0 wall_s=165.6 
m-b63-Ca-save start=2026-10-12T10:26:17EDT exit=0 wall_s=4.4 
m-b63-Ca-putback start=2026-10-12T10:26:22EDT exit=0 wall_s=4.2 
m-b63-Cb-save start=2026-10-12T10:26:26EDT exit=0 wall_s=3.9 
m-b63-Cb-putback start=2026-10-12T10:26:30EDT exit=0 wall_s=4.5 
m-b63-Cc-save start=2026-10-12T10:26:34EDT exit=0 wall_s=4.5 
m-b63-Cc-putback start=2026-10-12T10:26:39EDT exit=0 wall_s=3.8 
m-b63-C1-save start=2026-10-12T10:26:43EDT exit=0 wall_s=3.4 
m-b63-C1-putback start=2026-10-12T10:26:46EDT exit=0 wall_s=3.4 
m-b63-C3-save start=2026-10-12T10:26:49EDT exit=0 wall_s=3.5 
m-b63-C3-putback start=2026-10-12T10:26:53EDT exit=0 wall_s=3.7 
m-b63-U25ws-save start=2026-10-12T10:26:57EDT exit=0 wall_s=4.8 
m-b63-U25ws-putback start=2026-10-12T10:27:01EDT exit=0 wall_s=4.5 
m-b63-U25wf-save start=2026-10-12T10:27:06EDT exit=0 wall_s=4.3 
m-b63-U25wf-putback start=2026-10-12T10:27:10EDT exit=0 wall_s=4.3 
m-b63-U25mid-save start=2026-10-12T10:27:15EDT exit=0 wall_s=4.2 
m-b63-U25mid-putback start=2026-10-12T10:27:19EDT exit=0 wall_s=4.7 
m-b63-L20-save start=2026-10-12T10:27:24EDT exit=0 wall_s=4.1 
m-b63-L20-putback start=2026-10-12T10:27:28EDT exit=0 wall_s=4.1 
chunk-K63 start=2026-10-12T10:26:17EDT exit=0 wall_s=74.7 
m-c137-Ca-save start=2026-10-12T10:27:37EDT exit=0 wall_s=4.1 
m-c137-Ca-putback start=2026-10-12T10:27:41EDT exit=0 wall_s=4.6 
m-c137-Cb-save start=2026-10-12T10:27:45EDT exit=0 wall_s=3.9 
m-c137-Cb-putback start=2026-10-12T10:27:49EDT exit=0 wall_s=3.9 
m-c137-Cc-save start=2026-10-12T10:27:53EDT exit=0 wall_s=3.7 
m-c137-Cc-putback start=2026-10-12T10:27:57EDT exit=0 wall_s=3.9 
m-c137-C1-save start=2026-10-12T10:28:01EDT exit=0 wall_s=3.6 
m-c137-C1-putback start=2026-10-12T10:28:04EDT exit=0 wall_s=3.5 
m-c137-C3-save start=2026-10-12T10:28:08EDT exit=0 wall_s=3.3 
m-c137-C3-putback start=2026-10-12T10:28:11EDT exit=0 wall_s=3.5 
m-c137-U25ws-save start=2026-10-12T10:28:15EDT exit=0 wall_s=4.4 
m-c137-U25ws-putback start=2026-10-12T10:28:19EDT exit=0 wall_s=4.2 
m-c137-U25wf-save start=2026-10-12T10:28:23EDT exit=0 wall_s=3.8 
m-c137-U25wf-putback start=2026-10-12T10:28:27EDT exit=0 wall_s=3.9 
m-c137-U25mid-save start=2026-10-12T10:28:31EDT exit=0 wall_s=4.2 
m-c137-U25mid-putback start=2026-10-12T10:28:35EDT exit=0 wall_s=4.3 
m-c137-L20-save start=2026-10-12T10:28:40EDT exit=0 wall_s=4.3 
m-c137-L20-putback start=2026-10-12T10:28:44EDT exit=0 wall_s=4.1 
chunk-K137 start=2026-10-12T10:27:36EDT exit=0 wall_s=71.5 
m-b63-SHd-none start=2026-10-12T10:28:53EDT exit=0 wall_s=4.0 
m-b63-SHd-save start=2026-10-12T10:28:56EDT exit=0 wall_s=3.8 
m-b63-SHd-putback start=2026-10-12T10:29:00EDT exit=0 wall_s=3.8 
m-b63-SHdC-none start=2026-10-12T10:29:04EDT exit=0 wall_s=3.1 
m-b63-SHdC-save start=2026-10-12T10:29:07EDT exit=0 wall_s=3.2 
m-b63-SHdC-putback start=2026-10-12T10:29:11EDT exit=0 wall_s=3.4 
m-b63-SHdk-none start=2026-10-12T10:29:14EDT exit=0 wall_s=4.2 
m-b63-SHdk-save start=2026-10-12T10:29:18EDT exit=0 wall_s=3.9 
m-b63-SHdk-putback start=2026-10-12T10:29:22EDT exit=0 wall_s=3.8 
m-b63-SHdkC-none start=2026-10-12T10:29:26EDT exit=0 wall_s=3.8 
m-b63-SHdkC-save start=2026-10-12T10:29:30EDT exit=0 wall_s=3.5 
m-b63-SHdkC-putback start=2026-10-12T10:29:33EDT exit=0 wall_s=3.3 
m-b63-SHa-none start=2026-10-12T10:29:37EDT exit=0 wall_s=3.7 
m-b63-SHa-save start=2026-10-12T10:29:40EDT exit=0 wall_s=3.8 
m-b63-SHa-putback start=2026-10-12T10:29:44EDT exit=0 wall_s=3.4 
chunk-A63a start=2026-10-12T10:28:53EDT exit=0 wall_s=55.1 
m-b63-SHaC-none start=2026-10-12T10:29:48EDT exit=0 wall_s=3.4 
m-b63-SHaC-save start=2026-10-12T10:29:51EDT exit=0 wall_s=3.0 
m-b63-SHaC-putback start=2026-10-12T10:29:54EDT exit=0 wall_s=3.3 
m-b63-BT-none start=2026-10-12T10:29:57EDT exit=0 wall_s=3.6 
m-b63-BT-save start=2026-10-12T10:30:01EDT exit=0 wall_s=3.0 
m-b63-BT-putback start=2026-10-12T10:30:04EDT exit=0 wall_s=3.1 
m-b63-BTC-none start=2026-10-12T10:30:07EDT exit=0 wall_s=3.2 
m-b63-BTC-save start=2026-10-12T10:30:10EDT exit=0 wall_s=3.0 
m-b63-BTC-putback start=2026-10-12T10:30:13EDT exit=0 wall_s=2.9 
m-b63-IB-none start=2026-10-12T10:30:16EDT exit=0 wall_s=3.6 
m-b63-IB-save start=2026-10-12T10:30:20EDT exit=0 wall_s=3.7 
m-b63-IB-putback start=2026-10-12T10:30:23EDT exit=0 wall_s=3.7 
m-b63-IBC-none start=2026-10-12T10:30:27EDT exit=0 wall_s=3.5 
m-b63-IBC-save start=2026-10-12T10:30:31EDT exit=0 wall_s=3.8 
m-b63-IBC-putback start=2026-10-12T10:30:34EDT exit=0 wall_s=3.6 
chunk-A63b start=2026-10-12T10:29:48EDT exit=0 wall_s=50.4 
m-c137-SHd-none start=2026-10-12T10:30:43EDT exit=0 wall_s=4.0 
m-c137-SHd-save start=2026-10-12T10:30:47EDT exit=0 wall_s=3.5 
m-c137-SHd-putback start=2026-10-12T10:30:50EDT exit=0 wall_s=4.7 
m-c137-SHdC-none start=2026-10-12T10:30:55EDT exit=0 wall_s=4.2 
m-c137-SHdC-save start=2026-10-12T10:30:59EDT exit=0 wall_s=3.7 
m-c137-SHdC-putback start=2026-10-12T10:31:03EDT exit=0 wall_s=3.2 
m-c137-SHdk-none start=2026-10-12T10:31:06EDT exit=0 wall_s=4.0 
m-c137-SHdk-save start=2026-10-12T10:31:10EDT exit=0 wall_s=4.0 
m-c137-SHdk-putback start=2026-10-12T10:31:14EDT exit=0 wall_s=3.8 
m-c137-SHdkC-none start=2026-10-12T10:31:18EDT exit=0 wall_s=3.5 
m-c137-SHdkC-save start=2026-10-12T10:31:22EDT exit=0 wall_s=3.3 
m-c137-SHdkC-putback start=2026-10-12T10:31:25EDT exit=0 wall_s=3.1 
m-c137-SHa-none start=2026-10-12T10:31:28EDT exit=0 wall_s=3.7 
m-c137-SHa-save start=2026-10-12T10:31:32EDT exit=0 wall_s=3.3 
m-c137-SHa-putback start=2026-10-12T10:31:35EDT exit=0 wall_s=3.1 
chunk-A137a start=2026-10-12T10:30:43EDT exit=0 wall_s=55.3 
m-c137-SHaC-none start=2026-10-12T10:31:38EDT exit=0 wall_s=2.9 
m-c137-SHaC-save start=2026-10-12T10:31:41EDT exit=0 wall_s=3.1 
m-c137-SHaC-putback start=2026-10-12T10:31:44EDT exit=0 wall_s=3.3 
m-c137-BT-none start=2026-10-12T10:31:48EDT exit=0 wall_s=3.1 
m-c137-BT-save start=2026-10-12T10:31:51EDT exit=0 wall_s=2.7 
m-c137-BT-putback start=2026-10-12T10:31:54EDT exit=0 wall_s=2.8 
m-c137-BTC-none start=2026-10-12T10:31:56EDT exit=0 wall_s=2.9 
m-c137-BTC-save start=2026-10-12T10:31:59EDT exit=0 wall_s=2.7 
m-c137-BTC-putback start=2026-10-12T10:32:02EDT exit=0 wall_s=2.5 
m-c137-IB-none start=2026-10-12T10:32:05EDT exit=0 wall_s=3.6 
m-c137-IB-save start=2026-10-12T10:32:08EDT exit=0 wall_s=3.4 
m-c137-IB-putback start=2026-10-12T10:32:12EDT exit=0 wall_s=3.6 
m-c137-IBC-none start=2026-10-12T10:32:15EDT exit=0 wall_s=3.3 
m-c137-IBC-save start=2026-10-12T10:32:19EDT exit=0 wall_s=3.1 
m-c137-IBC-putback start=2026-10-12T10:32:22EDT exit=0 wall_s=3.5 
chunk-A137b start=2026-10-12T10:31:38EDT exit=0 wall_s=47.0 
agg1 start=2026-10-12T10:32:49EDT exit=0 wall_s=0.1 
detail-SHdk start=2026-10-12T10:33:10EDT exit=0 wall_s=0.1 
detail-BT-SHd start=2026-10-12T10:33:20EDT exit=0 wall_s=0.2 
edit2 start=2026-10-12T10:35:39EDT exit=0 wall_s=0.0 
build3 start=2026-10-12T10:35:39EDT exit=0 wall_s=0.1 
trial3-b63-FBT-save start=2026-10-12T10:35:45EDT exit=0 wall_s=2.6 
trial3-b63-FBTC-save start=2026-10-12T10:35:48EDT exit=0 wall_s=2.5 
edit2b start=2026-10-12T10:36:07EDT exit=0 wall_s=0.0 
build4 start=2026-10-12T10:36:07EDT exit=0 wall_s=0.1 
edit3 start=2026-10-12T10:36:15EDT exit=0 wall_s=0.0 
m-b63-FBT-none start=2026-10-12T10:36:15EDT exit=0 wall_s=3.2 
m-b63-FBT-save start=2026-10-12T10:36:18EDT exit=0 wall_s=3.1 
m-b63-FBT-putback start=2026-10-12T10:36:22EDT exit=0 wall_s=3.4 
m-b63-FBTC-none start=2026-10-12T10:36:25EDT exit=0 wall_s=3.3 
m-b63-FBTC-save start=2026-10-12T10:36:28EDT exit=0 wall_s=2.8 
m-b63-FBTC-putback start=2026-10-12T10:36:31EDT exit=0 wall_s=3.1 
m-b63-FSHd-none start=2026-10-12T10:36:34EDT exit=0 wall_s=4.3 
m-b63-FSHd-save start=2026-10-12T10:36:39EDT exit=0 wall_s=3.8 
m-b63-FSHd-putback start=2026-10-12T10:36:42EDT exit=0 wall_s=3.6 
m-b63-FSHdC-none start=2026-10-12T10:36:46EDT exit=0 wall_s=3.2 
m-b63-FSHdC-save start=2026-10-12T10:36:49EDT exit=0 wall_s=3.0 
m-b63-FSHdC-putback start=2026-10-12T10:36:52EDT exit=0 wall_s=3.4 
chunk-F63 start=2026-10-12T10:36:15EDT exit=0 wall_s=40.4 
m-c137-FBT-none start=2026-10-12T10:36:56EDT exit=0 wall_s=3.2 
m-c137-FBT-save start=2026-10-12T10:36:59EDT exit=0 wall_s=3.4 
m-c137-FBT-putback start=2026-10-12T10:37:02EDT exit=0 wall_s=3.5 
m-c137-FBTC-none start=2026-10-12T10:37:06EDT exit=0 wall_s=3.1 
m-c137-FBTC-save start=2026-10-12T10:37:09EDT exit=0 wall_s=4.0 
m-c137-FBTC-putback start=2026-10-12T10:37:13EDT exit=0 wall_s=3.7 
m-c137-FSHd-none start=2026-10-12T10:37:17EDT exit=0 wall_s=8.3 
m-c137-FSHd-save start=2026-10-12T10:37:25EDT exit=0 wall_s=3.9 
m-c137-FSHd-putback start=2026-10-12T10:37:29EDT exit=0 wall_s=4.7 
m-c137-FSHdC-none start=2026-10-12T10:37:34EDT exit=0 wall_s=4.5 
m-c137-FSHdC-save start=2026-10-12T10:37:38EDT exit=0 wall_s=4.1 
m-c137-FSHdC-putback start=2026-10-12T10:37:42EDT exit=0 wall_s=3.9 
chunk-F137 start=2026-10-12T10:36:56EDT exit=0 wall_s=50.6 
detail-F start=2026-10-12T10:37:52EDT exit=0 wall_s=0.1 
scan1 start=2026-10-12T10:38:17EDT exit=0 wall_s=0.1 
edit4 start=2026-10-12T10:38:35EDT exit=0 wall_s=3.5 
build5 start=2026-10-12T10:38:38EDT exit=0 wall_s=0.1 
f-b63-S1harness-save start=2026-10-12T10:39:00EDT exit=0 wall_s=8.4 
f-b63-S1harness-putback start=2026-10-12T10:39:08EDT exit=0 wall_s=7.5 
f-b63-S1tick-save start=2026-10-12T10:39:16EDT exit=0 wall_s=9.8 
f-b63-S1tick-putback start=2026-10-12T10:39:26EDT exit=0 wall_s=14.9 
f-b63-S1perm-save start=2026-10-12T10:39:41EDT exit=0 wall_s=6.2 
f-b63-S1perm-putback start=2026-10-12T10:39:47EDT exit=0 wall_s=4.6 
f-b63-S1open-save start=2026-10-12T10:39:52EDT exit=0 wall_s=4.6 
f-b63-S1open-putback start=2026-10-12T10:39:56EDT exit=0 wall_s=4.6 
f-b63-S1pen-save start=2026-10-12T10:40:01EDT exit=0 wall_s=4.3 
f-b63-S1pen-putback start=2026-10-12T10:40:05EDT exit=0 wall_s=4.0 
f-b63-V1same-save start=2026-10-12T10:40:09EDT exit=0 wall_s=4.1 
f-b63-V1same-putback start=2026-10-12T10:40:13EDT exit=0 wall_s=4.1 
f-b63-V1sameperm-save start=2026-10-12T10:40:17EDT exit=0 wall_s=4.3 
f-b63-V1sameperm-putback start=2026-10-12T10:40:22EDT exit=0 wall_s=4.5 
f-b63-V2live-save start=2026-10-12T10:40:26EDT exit=0 wall_s=20.2 
f-b63-V2live-putback start=2026-10-12T10:40:46EDT exit=0 wall_s=20.2 
f-b63-W2pull-save start=2026-10-12T10:41:07EDT exit=0 wall_s=4.7 
f-b63-W2pull-putback start=2026-10-12T10:41:11EDT exit=0 wall_s=5.3 
f-b63-W2tick-save start=2026-10-12T10:41:17EDT exit=0 wall_s=4.0 
f-b63-W2tick-putback start=2026-10-12T10:41:21EDT exit=0 wall_s=4.7 
fchunk-M63 start=2026-10-12T10:39:00EDT exit=0 wall_s=145.4 
f-c137-S1harness-save start=2026-10-12T10:41:25EDT exit=0 wall_s=4.1 
f-c137-S1harness-putback start=2026-10-12T10:41:30EDT exit=0 wall_s=6.4 
f-c137-S1tick-save start=2026-10-12T10:41:36EDT exit=0 wall_s=8.6 
f-c137-S1tick-putback start=2026-10-12T10:41:45EDT exit=0 wall_s=7.9 
f-c137-S1perm-save start=2026-10-12T10:41:52EDT exit=0 wall_s=8.1 
f-c137-S1perm-putback start=2026-10-12T10:42:01EDT exit=0 wall_s=8.3 
f-c137-S1open-save start=2026-10-12T10:42:09EDT exit=0 wall_s=7.9 
f-c137-S1open-putback start=2026-10-12T10:42:17EDT exit=0 wall_s=8.6 
f-c137-S1pen-save start=2026-10-12T10:42:26EDT exit=0 wall_s=8.3 
f-c137-S1pen-putback start=2026-10-12T10:42:34EDT exit=0 wall_s=9.1 
f-c137-V1same-save start=2026-10-12T10:42:43EDT exit=0 wall_s=8.9 
f-c137-V1same-putback start=2026-10-12T10:42:52EDT exit=0 wall_s=8.6 
f-c137-V1sameperm-save start=2026-10-12T10:43:01EDT exit=0 wall_s=8.4 
f-c137-V1sameperm-putback start=2026-10-12T10:43:09EDT exit=0 wall_s=8.2 
f-c137-V2live-save start=2026-10-12T10:43:17EDT exit=0 wall_s=19.1 
f-c137-V2live-putback start=2026-10-12T10:43:36EDT exit=0 wall_s=22.0 
f-c137-W2pull-save start=2026-10-12T10:43:58EDT exit=0 wall_s=9.0 
f-c137-W2pull-putback start=2026-10-12T10:44:08EDT exit=0 wall_s=9.1 
f-c137-W2tick-save start=2026-10-12T10:44:17EDT exit=0 wall_s=9.8 
f-c137-W2tick-putback start=2026-10-12T10:44:27EDT exit=0 wall_s=10.8 
fchunk-M137 start=2026-10-12T10:41:25EDT exit=0 wall_s=191.9 
f-b63-Ca-save start=2026-10-12T10:44:44EDT exit=0 wall_s=10.4 
f-b63-Ca-putback start=2026-10-12T10:44:54EDT exit=0 wall_s=11.4 
f-b63-Cb-save start=2026-10-12T10:45:06EDT exit=0 wall_s=8.9 
f-b63-Cb-putback start=2026-10-12T10:45:14EDT exit=0 wall_s=7.5 
f-b63-Cc-save start=2026-10-12T10:45:22EDT exit=0 wall_s=11.6 
f-b63-Cc-putback start=2026-10-12T10:45:34EDT exit=0 wall_s=9.7 
f-b63-C1-save start=2026-10-12T10:45:43EDT exit=0 wall_s=7.6 
f-b63-C1-putback start=2026-10-12T10:45:51EDT exit=0 wall_s=6.9 
f-b63-C3-save start=2026-10-12T10:45:58EDT exit=0 wall_s=8.4 
f-b63-C3-putback start=2026-10-12T10:46:06EDT exit=0 wall_s=9.6 
f-b63-U25ws-save start=2026-10-12T10:46:16EDT exit=0 wall_s=9.9 
f-b63-U25ws-putback start=2026-10-12T10:46:26EDT exit=0 wall_s=10.8 
f-b63-U25wf-save start=2026-10-12T10:46:37EDT exit=0 wall_s=10.1 
f-b63-U25wf-putback start=2026-10-12T10:46:47EDT exit=0 wall_s=8.4 
f-b63-U25mid-save start=2026-10-12T10:46:55EDT exit=0 wall_s=10.3 
f-b63-U25mid-putback start=2026-10-12T10:47:06EDT exit=0 wall_s=7.7 
f-b63-L20-save start=2026-10-12T10:47:13EDT exit=0 wall_s=8.1 
f-b63-L20-putback start=2026-10-12T10:47:22EDT exit=0 wall_s=6.9 
fchunk-K63 start=2026-10-12T10:44:44EDT exit=0 wall_s=164.8 
f-c137-Ca-save start=2026-10-12T10:47:29EDT exit=0 wall_s=7.0 
f-c137-Ca-putback start=2026-10-12T10:47:36EDT exit=0 wall_s=5.7 
f-c137-Cb-save start=2026-10-12T10:47:41EDT exit=0 wall_s=4.9 
f-c137-Cb-putback start=2026-10-12T10:47:46EDT exit=0 wall_s=4.8 
f-c137-Cc-save start=2026-10-12T10:47:51EDT exit=0 wall_s=5.0 
f-c137-Cc-putback start=2026-10-12T10:47:56EDT exit=0 wall_s=4.7 
f-c137-C1-save start=2026-10-12T10:48:01EDT exit=0 wall_s=4.5 
f-c137-C1-putback start=2026-10-12T10:48:05EDT exit=0 wall_s=4.8 
f-c137-C3-save start=2026-10-12T10:48:10EDT exit=0 wall_s=4.3 
f-c137-C3-putback start=2026-10-12T10:48:14EDT exit=0 wall_s=4.7 
f-c137-U25ws-save start=2026-10-12T10:48:19EDT exit=0 wall_s=5.2 
f-c137-U25ws-putback start=2026-10-12T10:48:24EDT exit=0 wall_s=5.2 
f-c137-U25wf-save start=2026-10-12T10:48:30EDT exit=0 wall_s=10.7 
f-c137-U25wf-putback start=2026-10-12T10:48:40EDT exit=0 wall_s=10.3 
f-c137-U25mid-save start=2026-10-12T10:48:51EDT exit=0 wall_s=13.5 
f-c137-U25mid-putback start=2026-10-12T10:49:04EDT exit=0 wall_s=11.6 
f-c137-L20-save start=2026-10-12T10:49:16EDT exit=0 wall_s=13.9 
f-c137-L20-putback start=2026-10-12T10:49:30EDT exit=0 wall_s=10.3 
fchunk-K137 start=2026-10-12T10:47:29EDT exit=0 wall_s=131.7 
f-b63-SHd-none start=2026-10-12T10:49:40EDT exit=0 wall_s=10.3 
f-b63-SHd-save start=2026-10-12T10:49:51EDT exit=0 wall_s=7.2 
f-b63-SHd-putback start=2026-10-12T10:49:58EDT exit=0 wall_s=7.1 
f-b63-SHdC-none start=2026-10-12T10:50:05EDT exit=0 wall_s=9.2 
f-b63-SHdC-save start=2026-10-12T10:50:14EDT exit=0 wall_s=8.0 
f-b63-SHdC-putback start=2026-10-12T10:50:22EDT exit=0 wall_s=6.8 
f-b63-SHdk-none start=2026-10-12T10:50:29EDT exit=0 wall_s=9.8 
f-b63-SHdk-save start=2026-10-12T10:50:39EDT exit=0 wall_s=8.5 
f-b63-SHdk-putback start=2026-10-12T10:50:48EDT exit=0 wall_s=8.7 
f-b63-SHdkC-none start=2026-10-12T10:50:56EDT exit=0 wall_s=11.3 
f-b63-SHdkC-save start=2026-10-12T10:51:08EDT exit=0 wall_s=9.3 
f-b63-SHdkC-putback start=2026-10-12T10:51:17EDT exit=0 wall_s=8.8 
f-b63-SHa-none start=2026-10-12T10:51:26EDT exit=0 wall_s=10.9 
f-b63-SHa-save start=2026-10-12T10:51:37EDT exit=0 wall_s=8.7 
f-b63-SHa-putback start=2026-10-12T10:51:46EDT exit=0 wall_s=9.8 
fchunk-A63a start=2026-10-12T10:49:40EDT exit=0 wall_s=135.1 
f-b63-SHaC-none start=2026-10-12T10:51:55EDT exit=0 wall_s=9.3 
f-b63-SHaC-save start=2026-10-12T10:52:05EDT exit=0 wall_s=8.6 
f-b63-SHaC-putback start=2026-10-12T10:52:13EDT exit=0 wall_s=9.3 
f-b63-BT-none start=2026-10-12T10:52:23EDT exit=0 wall_s=8.8 
f-b63-BT-save start=2026-10-12T10:52:32EDT exit=0 wall_s=7.4 
f-b63-BT-putback start=2026-10-12T10:52:39EDT exit=0 wall_s=6.4 
f-b63-BTC-none start=2026-10-12T10:52:46EDT exit=0 wall_s=11.3 
f-b63-BTC-save start=2026-10-12T10:52:57EDT exit=0 wall_s=7.0 
f-b63-BTC-putback start=2026-10-12T10:53:04EDT exit=0 wall_s=8.2 
f-b63-IB-none start=2026-10-12T10:53:12EDT exit=0 wall_s=10.2 
f-b63-IB-save start=2026-10-12T10:53:23EDT exit=0 wall_s=8.5 
f-b63-IB-putback start=2026-10-12T10:53:31EDT exit=0 wall_s=10.2 
f-b63-IBC-none start=2026-10-12T10:53:41EDT exit=0 wall_s=7.9 
f-b63-IBC-save start=2026-10-12T10:53:49EDT exit=0 wall_s=6.5 
f-b63-IBC-putback start=2026-10-12T10:53:56EDT exit=0 wall_s=6.8 
fchunk-A63b start=2026-10-12T10:51:55EDT exit=0 wall_s=127.5 
f-c137-SHd-none start=2026-10-12T10:54:08EDT exit=0 wall_s=8.4 
f-c137-SHd-save start=2026-10-12T10:54:17EDT exit=0 wall_s=7.9 
f-c137-SHd-putback start=2026-10-12T10:54:25EDT exit=0 wall_s=9.4 
f-c137-SHdC-none start=2026-10-12T10:54:34EDT exit=0 wall_s=4.1 
f-c137-SHdC-save start=2026-10-12T10:54:38EDT exit=0 wall_s=4.4 
f-c137-SHdC-putback start=2026-10-12T10:54:43EDT exit=0 wall_s=9.0 
f-c137-SHdk-none start=2026-10-12T10:54:52EDT exit=0 wall_s=11.9 
f-c137-SHdk-save start=2026-10-12T10:55:04EDT exit=0 wall_s=8.3 
f-c137-SHdk-putback start=2026-10-12T10:55:12EDT exit=0 wall_s=9.0 
f-c137-SHdkC-none start=2026-10-12T10:55:21EDT exit=0 wall_s=10.1 
f-c137-SHdkC-save start=2026-10-12T10:55:31EDT exit=0 wall_s=7.9 
f-c137-SHdkC-putback start=2026-10-12T10:55:39EDT exit=0 wall_s=8.6 
f-c137-SHa-none start=2026-10-12T10:55:48EDT exit=0 wall_s=9.3 
f-c137-SHa-save start=2026-10-12T10:55:57EDT exit=0 wall_s=9.8 
f-c137-SHa-putback start=2026-10-12T10:56:07EDT exit=0 wall_s=14.3 
fchunk-A137a start=2026-10-12T10:54:08EDT exit=0 wall_s=133.0 
f-c137-SHaC-none start=2026-10-12T10:56:21EDT exit=0 wall_s=18.4 
f-c137-SHaC-save start=2026-10-12T10:56:40EDT exit=0 wall_s=8.0 
f-c137-SHaC-putback start=2026-10-12T10:56:48EDT exit=0 wall_s=7.6 
f-c137-BT-none start=2026-10-12T10:56:56EDT exit=0 wall_s=8.4 
f-c137-BT-save start=2026-10-12T10:57:04EDT exit=0 wall_s=9.4 
f-c137-BT-putback start=2026-10-12T10:57:14EDT exit=0 wall_s=10.7 
f-c137-BTC-none start=2026-10-12T10:57:24EDT exit=0 wall_s=9.0 
f-c137-BTC-save start=2026-10-12T10:57:33EDT exit=0 wall_s=7.0 
f-c137-BTC-putback start=2026-10-12T10:57:40EDT exit=0 wall_s=7.2 
f-c137-IB-none start=2026-10-12T10:57:48EDT exit=0 wall_s=9.7 
f-c137-IB-save start=2026-10-12T10:57:57EDT exit=0 wall_s=8.5 
f-c137-IB-putback start=2026-10-12T10:58:06EDT exit=0 wall_s=8.9 
f-c137-IBC-none start=2026-10-12T10:58:15EDT exit=0 wall_s=8.5 
f-c137-IBC-save start=2026-10-12T10:58:23EDT exit=0 wall_s=8.2 
f-c137-IBC-putback start=2026-10-12T10:58:32EDT exit=0 wall_s=8.7 
fchunk-A137b start=2026-10-12T10:56:21EDT exit=0 wall_s=138.9 
f-b63-FBT-none start=2026-10-12T10:58:47EDT exit=0 wall_s=7.3 
f-b63-FBT-save start=2026-10-12T10:58:55EDT exit=0 wall_s=6.1 
f-b63-FBT-putback start=2026-10-12T10:59:01EDT exit=0 wall_s=7.3 
f-b63-FBTC-none start=2026-10-12T10:59:08EDT exit=0 wall_s=7.4 
f-b63-FBTC-save start=2026-10-12T10:59:15EDT exit=0 wall_s=6.1 
f-b63-FBTC-putback start=2026-10-12T10:59:22EDT exit=0 wall_s=5.7 
f-b63-FSHd-none start=2026-10-12T10:59:27EDT exit=0 wall_s=9.1 
f-b63-FSHd-save start=2026-10-12T10:59:37EDT exit=0 wall_s=9.1 
f-b63-FSHd-putback start=2026-10-12T10:59:46EDT exit=0 wall_s=8.5 
f-b63-FSHdC-none start=2026-10-12T10:59:54EDT exit=0 wall_s=8.7 
f-b63-FSHdC-save start=2026-10-12T11:00:03EDT exit=0 wall_s=7.5 
f-b63-FSHdC-putback start=2026-10-12T11:00:11EDT exit=0 wall_s=7.3 
fchunk-F63 start=2026-10-12T10:58:47EDT exit=0 wall_s=90.7 
f-c137-FBT-none start=2026-10-12T11:00:18EDT exit=0 wall_s=7.7 
f-c137-FBT-save start=2026-10-12T11:00:26EDT exit=0 wall_s=7.8 
f-c137-FBT-putback start=2026-10-12T11:00:34EDT exit=0 wall_s=5.7 
f-c137-FBTC-none start=2026-10-12T11:00:39EDT exit=0 wall_s=4.8 
f-c137-FBTC-save start=2026-10-12T11:00:44EDT exit=0 wall_s=3.0 
f-c137-FBTC-putback start=2026-10-12T11:00:47EDT exit=0 wall_s=3.4 
f-c137-FSHd-none start=2026-10-12T11:00:51EDT exit=0 wall_s=4.5 
f-c137-FSHd-save start=2026-10-12T11:00:55EDT exit=0 wall_s=4.4 
f-c137-FSHd-putback start=2026-10-12T11:01:00EDT exit=0 wall_s=4.2 
f-c137-FSHdC-none start=2026-10-12T11:01:04EDT exit=0 wall_s=3.4 
f-c137-FSHdC-save start=2026-10-12T11:01:07EDT exit=0 wall_s=3.2 
f-c137-FSHdC-putback start=2026-10-12T11:01:10EDT exit=0 wall_s=3.5 
fchunk-F137 start=2026-10-12T11:00:18EDT exit=0 wall_s=56.0 
agg-final start=2026-10-12T11:01:21EDT exit=0 wall_s=0.1 
scan-final start=2026-10-12T11:01:21EDT exit=0 wall_s=0.1 
table-final start=2026-10-12T11:01:47EDT exit=0 wall_s=0.2 
mkprop start=2026-10-12T11:03:31EDT exit=0 wall_s=0.2 
table2-final start=2026-10-12T11:04:33EDT exit=0 wall_s=0.1 
detail-check start=2026-10-12T11:07:53EDT exit=0 wall_s=0.3 
(this list was appended by appendruns.sh, itself the run 'appendruns' that starts 2026-10-12T11:08:06EDT; its own line is in logs/runs.txt)
```
