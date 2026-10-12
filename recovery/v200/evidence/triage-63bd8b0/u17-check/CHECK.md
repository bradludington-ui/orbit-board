# U17 probe: independent adversarial check

**Checked:** the U17 re-measurement on the U13 commit, in `rec/L4/u17`. Its verdict was REPRODUCED.
**Checker's directory:** `rec/L4/u17-check`. The runs, identities and PIDs are in `README.md`; the proposal, which was not applied, is in `PROPOSAL.md`.
**When:** Monday 12 Oct 2026, ET.
- The first part ran from 11:48 to 11:57, when it was cut by the usage limit.
- The check resumed at 15:08.
- This file was written at 15:21 ET (last edited 15:22 ET).

## Verdict on the builder's result

**Two parts of the builder's result are right:**
- **REPRODUCED.** U17's falsely clean state, and its unasked overwrite, are still reachable on 63bd8b0.
- **The 10 measured routes are closed.** U25mid is also closed.

**Its explanation of why is wrong for SHd, SHdk and FSHd.** The builder says these outcomes "are caused by the save". They are not. The same falsely clean record, and the same overwrite with no question, occur with **no save under way**, whenever the board is clean when "load the shared one" is pressed (XSHn, XFSHn and two order controls). In file mode this leaves the earlier file content in no copy the board can reach. P1 does not close it.

**FBT's attribution to the save holds.** I reproduced FBT through the board's actual offer of the link.

## What was checked, and what was found

### 1. Re-running the builder's runs

The builder's final matrix was re-run on my own copies of both boards, with its probe copied byte-for-byte (`6b65ff65`):
- 160 runs: 10 measured routes, 9 controls, 14 adoption-family routes and 4 file-family routes, with each `next` value, on 63bd8b0 and on 1375b72b.
- **All 160 re-runs are identical to the builder's `f-*` runs** (`cmp.mjs`, `logs/cmp2.log`).
  - Identical: every check's id, kind, pass/fail, observed tuple and expected literal; the K1 tuple; and the identities (board, boot.mjs, shim, probe).
  - Totals are the same as the builder's: fixture 868/0, predict 462/0, contract 404 pass / 166 fail, harness 0/0, plus 12 U18 checks.

### 2. Whether the expected values are literal

**Yes, they are hand-written literals.**
- `EXP0` holds per-board literal tuples. The fixture names are literal note/$ pairs.
- The contract alternatives are "every named content, clean against itself" or "unclean". The unclean alternative is built from the observed tuple, which is correct for a "not falsely clean" property.

**Three changes were made after results were seen. All are disclosed and none hides an effect:**
- U25mid's write count was changed from 0 to 2.
- L20's fixture window was changed.
- `CONSISTENT` was widened after the `m-*` runs (`edit4.py`), because BTC and FBTC failed on `[BRAD-1, clean, BRAD-1]`, which really is consistent.

**My own routes follow the same rule.**
- My earlier routes' literals were written before their trial runs. They are identical between the trial (`xt-*`) and final (`x-*`) runs (`expsame.mjs`).
- XFSHn and XFSHdL were written at the resume, after the folder results for XSHn and XSHdL had been seen.

### 3. Whether the controls are healthy and separate the trigger from the harness

**The measured routes: yes.**
- 1375b72b reproduces all 10 routes, so it is a working positive control.
- Ca, Cb and C3 show that the hold alone does not create the effect.
- Cc and C1 adopt as ordinary adoptions.

**SHd, SHdk and FSHd: no.**
- The no-save controls SHdC, SHdkC and FSHdC start **dirty** (BRAD-2 typed, unsaved) and stay dirty. They change two conditions at once: whether a save is under way, and whether the board is clean when it settles.
- `adoptShared` counts nothing (`applyStore` and `persist` only). So any clean board stays recorded clean against the copy it came from while it shows SHARED.
- My routes separate the two conditions. Every literal passed on both boards:

| route | save under way at the click? | board clean at the click? | K1 [screen, clean, base] | next 💾 Save |
|---|---|---|---|---|
| XSHdL (folder; the save landed first; `adoptShared()` called directly) | no | yes | [SHARED, true, BRAD-2] **falsely clean** | writes SHARED over BRAD-2, 0 questions |
| XSHn (folder; reopened; the older shared state file offers the link; clicked in the DOM) | **no save at all** | yes | [SHARED, true, BRAD-2] **falsely clean** | the same; BRAD-2 only in `-recent` history |
| XFSHdL (file; the save landed first) | no | yes | [SHARED, true, BRAD-2] **falsely clean** | writes SHARED over BRAD-2 in the file, 0 questions; **BRAD-2 in no reachable copy** |
| XFSHn (file; reopened from the file; link offered; clicked in the DOM) | **no save at all** | yes | [SHARED, true, BRAD-2] **falsely clean** | the same; **BRAD-2 in no reachable copy**; put-back: "Nothing is kept aside" |
| builder's SHdC / FSHdC (re-run) | no | no (dirty) | [SHARED, false, BRAD-1] unclean | – |

**What the save under way actually does here:**
- It is **one way** for the board to end clean. It is not the cause of the false record.
- The cause is that the load is not counted (U24's "without counting a change"), together with a board that is clean at the end.
- In each of my routes, the record was consistent before the load (fixture `[BRAD-2, true, BRAD-2]`). So the false state starts at the load, not in the harness.

**FBT: the attribution holds.**
- XFBTC (no save; the link clicked at opening) is consistent.
- XFBTL (the save landed first; `bootTakeFile()` then called directly) is consistent, and the next Save **asks** HOLD ON.
- Only when the click falls inside the save's write (XFBT) is the record falsely clean with no question asked.

### 4. Whether the routes are product paths

**Builder's shortcuts, and what testing them showed:**

| builder's shortcut | could it create or hide the effect? | tested by | result |
|---|---|---|---|
| `adoptShared()` called directly in SHd | could create it if the link is not really on screen during the save | XSHd: a DOM click on `#shareStat button[onclick="adoptShared()"]`, the button present during the held save | identical outcome |
| SHd's sidecar answer arrives after typing | an unusual order | XSHe: board clean, the older shared state file offers the link at once; type; Save; click during the write | identical outcome |
| FBT: `bootTakeFile()` called directly, in a session that had already saved, with no offer of the link | **could create it.** `PUB` is set only while the board loads (b63 L2050, L2082, L2516; `PUB_FILE_TS` is a `const`, L2091), so FBT loads the stale opening state F1, not the file. The link is offered only at opening (L31480 / L31489) | XFBT: the real offer (file newer at opening, kept slot occupied, `_bootHeld.occupied`, link on the status line); Save (HOLD ON answered OK) held; DOM click | **reproduced**: [X-2, clean, BRAD-3]; the next Save writes X-2 over BRAD-3 with 0 questions; BRAD-3 is in an earlier file version only |
| the hold at the write's close | could create a window that does not exist | it is not needed for SHd's effect (XSHn has no hold); it is needed for FBT's (XFBTL is consistent) | – |

**Not changed by me:** the sidecar's arrival is `sharedArrived(st)` (the fetch is not modelled), and `confirm` always answers OK. These are the same as the builder's.

**An observation by code plus a measurement.** In the occupied case, the board's own words say "open the file's version **once yours is saved**". The link leaves the status line once a save lands (XFBTL `linkAfterLanding` = false). So after 💾 Save is pressed, the only time the link can still be pressed is while that save is writing, which is FBT's window.

### 5. Whether the verdict follows from the evidence

**REPRODUCED follows**, and more strongly than stated: it does not need a save race at all (XSHn, XFSHn). These statements in the builder's result do not follow:
1. **"Each has a no-save control (SHdC, SHdkC, FSHdC, FBTC) that stays healthy, so these outcomes are caused by the save."** This is true for FBT and false for SHd, SHdk and FSHd (see 3).
2. **"U17 is still reachable on 63bd8b0, but only by U24 paths."** U24 is "during a save". `adoptShared` on a clean board, with no save, is not that.
   - The builder classes SHaC and BTC as "falsely clean with no save, so not save-attributable".
   - By the same rule, SHd, SHdk and FSHd should be classed with them. The builder's P2 table also omits `adoptShared` on a clean board.
3. **P1 ("refuse these three loads while a save is under way") as the correction.** By code, P1's `if(_saveBusy)` does not apply in XSHn, XFSHn, XSHdL or XFSHdL, so those stay open. I did not run P1. `PROPOSAL.md` P3, which counts the load as a change, is drafted (not applied or run), and its risks are listed there.
4. **FSHd's "false put-back question; SHARED then ends in no copy of the board".** This depends on how the question's words are read.
   - The question says "still in **the saved file** it came from". For a copy kept because of the shared state file (`why:'sidecar'`), `keptWhere` says "the saved file", and SHARED is still in the shared state file.
   - The builder's own folder-mode SHd run counts the same `in-file` words as not false (its V4 contract counts only `in-folder` claims).
   - The builder's own note says that SHARED stays in the shared state file.
   - The overwrite of BRAD-2 (V3) in FSHd is not affected by this.
5. **Severity, for Brad's judgement.** In XFSHn, a person clicks a link that promises "(yours is kept aside first)". Nothing is kept, because BRAD-2 is saved in the file. The header then reads saved. The next Save leaves BRAD-2 in no copy the board can reach.
   - This meets the triage's P1 definition, with no save involved. However, the person chose to load the shared copy.
   - The builder's own reach contract, applied as a contract to FBT and FSHd, would fail here.

### 6. Whether any proposal was applied

**No.** Every board copy used (the base, b63, c137, the builder's copies and the orbit-board working file) hashes to `98eed7e8` or `1375b72b`, and none contains the proposal marker.
- Only `rec/L4/u17/prop/prioritization-board-grid.proposed.html` (`f2e47609`) contains it.
- `proposal-P1.diff` equals `diff(98eed7e8, proposed copy)`.
- Every run's `ids.board` (builder 160 and mine 191) is one of the two blobs.
- My own P3 copy (`82d39ead`) was never booted or run.

## Process notes

**The builder's disclosed deviations:**
- One unbounded `python3` heredoc and one `sed -i`.
- Read-only `git status` in orbit-board, twice, and in orbit-ui, once. `git status` can refresh an index.

None of these touches the result.

**Mine:**
- Read-only inspections ran directly: `cat`, `grep`, `sed -n`, `diff`, `cmp`, `git hash-object`, `git rev-parse` and `ps -p`.
- These file edits in my own directory ran directly:
  - the Edit tool on `src/x-body.mjs`;
  - heredoc writes of scripts;
  - two `sed -i` text edits, on `cmp.mjs` and on `prop/mkP3.py`;
  - `chmod`.
- Every node and python run was bounded and recorded.

**The HEAD of orbit-board moved during the day** (239fc7e at 11:48 ET, a386223 at about 15:13 ET). This was not my doing; its board blob stayed `98eed7e8`.
