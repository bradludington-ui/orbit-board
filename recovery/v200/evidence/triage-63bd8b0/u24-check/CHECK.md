# U24 check: an independent, adversarial check of the probe in `rec/L4/u24`

Checked on Mon 12 Oct 2026, from 3:23 PM ET; this file was finalised at 3:47 PM ET (both by `TZ=America/New_York date`). The board under test is `98eed7e8`, the empty
template at orbit-board `63bd8b0`. All evidence is jsdom 27.4.0 on node v22.22.0. Nothing in the product was changed. The run
log, PIDs and identities are in `README.md`.

## Verdict

**I agree with the builder's verdict on every path.** The problems I found concern the size of one consequence, conditions on
reaching path A, and bookkeeping. None of them changes a REPRODUCED, NOT REPRODUCED or INCONCLUSIVE.

| path and mode | builder | this check |
|---|---|---|
| `adoptShared`, folder and file | REPRODUCED | **Agree.** Re-run identical. My harness controls (Wedit, Wread) and a second hold point (Whist) attribute it to the link, not the harness. |
| `sharedArrived`, folder | REPRODUCED, persistent | **Agree.** Re-run identical. It also reproduces **with no clock skew** (my SHa-fold-Wlate). |
| `sharedArrived`, file | NOT REPRODUCED | **Agree.** By code, `buildSavedHtml()` calls `save()`, so DIRTY is set for the whole window after the bytes. |
| `bootTakeFile`, file | REPRODUCED | **Agree.** The builder's leaf choice understates the consequence at the reopen (problem 1). |
| `bootTakeFile`, folder | INCONCLUSIVE | **Agree.** The no-save control is itself falsely clean (O1). |
| `importBoards`, both modes | NOT REPRODUCED (counted) | **Agree.** IB-fold-Wclean's loss at the reopen is O2, not the save: my two no-save variants lose IMPORT the same way. |

## 1. The builder's runs, re-run

- I made a fresh copy of the base (`cp -a rec/L4/base`). I ran the builder's probe **unchanged** (blob `6d3a0eb2`) on all 38
  scenarios, each bounded, as two halves in parallel, the way r2 and r3 were run (pass **x1**, 15:28 to 15:32 ET). All 38 exited 0.
- The builder's own `check.mjs` (blob `aee14603`) over x1 gives **560 checks and 25 failures, all CONTRACT**. No RUN, FIX, HOLD or
  PRED check failed.
- Row by row, x1 is **identical to r2 and to r3 on all 560 rows**: the verdict, the observed value and the expected value
  (`cmp.mjs`).
- The builder's r1 matches r2 on the 469 rows they share: 0 differ, 6 rows only in r1 (absent outputs), 91 only in r2.

## 2. Are the expected values literal?

- **Yes for CONTRACT, HOLD, PRED and FIX.** `check.mjs` holds them as hand-written arrays (`E`, `LEAVES`). Observed values come only
  from the probe's JSON. The CONTRACT expectation is a fixed `false` (never falsely clean) or all-`true` (REACH), so it cannot be
  fitted to observations.
- **Provenance of the PRED literals cannot be verified.** No copy of `check.mjs` older than the dev pass exists. The first check
  output (`out/checks-dev.json`, 11:31:37) postdates the dev runs (11:19 to 11:27). The README's "written from the code before the
  runs" is therefore not checkable. The verdicts do not depend on it: they rest on the CONTRACT rows.
- **Support for the builder's code reading:** I predicted 10 new scenarios from the code, wrote the literals before running them
  (`x/xcheck.mjs`, 15:32 to 15:41 ET), and all **113 checks held** at the first run.
- The two post-dev corrections the builder recorded (BT C3, and the leaves of IB C1/C2) are legitimate. C3's button really is gone
  after the save lands. In IB C1, the import's own question says it replaces the data. In IB C2, IMPORT is never imported.

## 3. Are the controls healthy, and do they separate the trigger from the harness?

The builder's C1 (the action, no save) and C2 (the save, no action) controls are healthy wherever it says so. The unhealthy ones
are reported as unhealthy (BT-fold-C1, the four C1clean, IB-*-C1clean at K3), and those paths are not attributed. That is
correct. C1 and C2 do not show, though, that **the hold mechanism itself** cannot make a board falsely clean. I added controls for
that:

| added scenario | what it isolates | result (pass y4) |
|---|---|---|
| **SHc-fold-Wedit, SHc-file-Wedit** | The same held save. Instead of the link, an **ordinary edit** to the same content, through the row's own `onchange` handlers. | **Unsaved and consistent** at the end, at the reopen and at the refresh. The hold does not hide the board's counter, so a falsely-clean W end is the link's doing. |
| **SHc-fold-Wread, SHc-file-Wread** | The same link, with the save held at its **read**, before its bytes are built. | **Consistent.** SHARED is written and recorded. The trigger is the action landing after the bytes are built. |
| **SHc-fold-Whist** | The folder save held at the close of its **history copy** instead of the head. The bytes are already built. | **Falsely clean**, as SHc-fold-W. The effect does not depend on the one hold point the builder chose. |

## 4. Are the routes product paths? Where could a shortcut create or hide the effect?

The paths under test are reached through the page's own controls: the real `#shareStat` buttons, the File menu item, the
`#multiFile` change event, and the page's own request for the state file. The shortcuts, and what I did about each:

| shortcut | could it create or hide the effect? | tested |
|---|---|---|
| A save made slow by a held gate | It could create a false-clean if the hold itself broke counting. | Wedit (no), Wread (timing), Whist (another point). |
| The page served at `https://example.invalid` | **It creates path A's reachability.** On `file://`, the team's way of opening the board per its own comment at L31530-31534, the state file is requested only when `localStorage.spmtSidecar==='1'`. | Not testable in jsdom: a `file://` page has no localStorage (`SecurityError … opaque origins`, measured). Neither the builder nor I ran the `file://` XHR route. |
| `fetch` stubbed and answered late | It is the transport only. The same callback, `sharedArrived`, runs. | Checked by code. |
| An hour-fast clock on Carol's state file (SHa) | It could make the route look contrived. | **SHa-fold-Wlate:** a state file written at real time after the save started reproduces it, persistent through the refresh and the reopen. |
| Typing via `setNote`/`setAlloc` | None: they are the inputs' own `onchange` handlers (for example L25566). | Checked by code. |
| The folder connected by assigning `_driveDir`/`_liveCfg`, then `driveAutoConnect()` | This is W1H's standing mock. It is the same function the opening calls. | Checked by code. |
| K2 as a direct `driveStorePull(true)` | None: Live view's poll calls the same thing (L26585). | Checked by code. |
| Carol's copies built with `buildSavedHtml()` | None: `publishState()` downloads the same bytes. | Checked by code. |
| No `navigator.locks` in jsdom | No effect on U24's paths, which never read `_saveBusy`. It matters to P1 (U20). | Checked by code. |
| Only 💾 Save as the held save | It could hide a route. | **SHc-fold-Wauto:** the Live autosave as the held save. The board is falsely clean between the landing and the same tick's refresh. The refresh then quietly loads BRAD-2 back over SHARED, while the status line still reads "Shared state loaded (published …)". So 💾 Save is the route that leaves a lasting false state. By code, SHa cannot use the autosave: `liveTick` saves only while DIRTY, and DIRTY makes `sharedArrived` refuse. |

## 5. Does the verdict follow from the evidence?

Yes, for every row of the table at the top. The problems:

1. **BT-file-W: the consequence at the reopen is understated and attributed to the wrong cause (moderate).**
   - The REACH leaves for BT-file-W leave out CAROL-F. The README says CAROL-F's disappearance at the reopen happens "the same way
     in the healthy control BT-file-C2", where the person answered HOLD ON "overwrite anyway", and so is "not attributed".
   - Re-run x1 shows that after the reopen and one edit, CAROL-F is in no board copy, only `outside:versionHistory`. CAROL-F is
     the copy the person chose last ("open the file's version"), and the board then said "💾 Saved in place".
   - **My counterfactual BT-file-Wcf** is BT-file-W exactly, except that after K1 the harness marks the record unsaved, as an
     honest board would. This is not a product path. The same reopen then holds the file back (kept slot occupied by KEPT-0).
     CAROL-F stays on screen and in storage after the edit.
   - So the loss is caused by the falsely-clean record, which is U24's effect. The HOLD ON consent is not the cause: in C2 the
     person never asked for CAROL-F again.
   - "At K1 nothing is lost" stays true. For BT-file-W, though, the K3 consequence is a P1-shaped loss of a board copy. The
     severity reasoning should say so.
2. **Path A is reachable only on http(s), or on `file://` with the opt-in (scope).**
   - The verdict table's REPRODUCED cells do not carry this condition; it appears only in the "How a person reaches" section and
     in the summary.
   - The `file://` XHR route was not run, and jsdom cannot host it.
   - Path A's real-world reach depends on how the board is deployed. This should be in the verdict cell, not only in prose.
3. **SHa's prerequisite is broader than its fixture (minor).**
   - The README lists "a clock an hour fast on the machine that wrote the state file" as SHa's real-world counterpart. A state
     file written while the request is pending, answered during the save, does the same with correct clocks (SHa-fold-Wlate).
   - The builder's general statement ("stamped at or after the save's stamp") is right.
4. **The autosave route was not tried (gap, now measured).** See SHc-fold-Wauto above. It shows a second, smaller defect: a false
   status line ("Shared state loaded") while BRAD-2 is on screen, and SHARED quietly replaced. Not U13's shape, and nothing is
   lost (BRAD-2 is kept, and SHARED stays in the state file).
5. **PRED provenance is unverifiable (process).** See section 2.
6. **Bookkeeping (trivial).** README Appendix D says "379 PID lines"; `pids.txt` has 381, as the summary says. The README explains
   that later commands were added after the table.

## 6. Was the PROPOSAL applied? No.

- The board blob is `98eed7e8` in all of these: `rec/L4/base`, the builder's `b63`, my `b63`, orbit-board's working tree,
  `HEAD:` and `63bd8b0:`. I checked at 15:24 and again at 15:42.
- orbit-board's `git status --short` is empty. HEAD moved during this check (`a386223` to `9ef4f28`, records-only commits by
  other sessions between 15:37 and 15:39 ET), and the board blob did not change.
- The patched copies (`bffdc809`, `4dd1b42a`, `486edfaf`, `fd7f916d`) and the diffs (`8adfbcbd`, `4881b89e`, `6b268336`,
  `cbb505cc`) match PROPOSAL.md. All 144 output JSONs in the builder's `out/` record board `98eed7e8`, so no patched copy was
  booted by the probe.
- The builder's `pids.txt` names a patched copy only in `mkpatch.py`, `git diff --no-index` and `git hash-object` lines. It has no
  `mutate`, `audit-import`, `audit-board`, `playwright` or `chromium` run.

## 7. Notes on the PROPOSAL (amendments, no product diff; also in `PROPOSAL.md` here)

- **P1's tests** should add:
  - SHc-fold-Whist (another hold point), SHa-fold-Wlate (no skew), and the Wedit controls (an ordinary edit during the save must
    stay counted, unchanged).
  - BT-file-W's REACH with CAROL-F as a leaf, at the reopen and after the edit.
- **P1 is a behaviour change on more scenarios than listed.** SHc-fold-Wread and SHc-file-Wread are consistent today (measured
  here) and would become refusals. The PROPOSAL names only SHa-file-Wread.
- **P3's tests** should add IB-fold-C1oldclean and IB-fold-C3clean.
  - They show O2's loss with **no save during the import at all**: an imported board older than the folder copy, from a clean
    record, is dropped at the next reopen with nothing kept aside.
  - The board has no unsaved-changes prompt on closing; `beforeunload` only releases the Live lock (L12688-12696). So this
    single-user route gives no warning. It is outside U24.
- **The autosave's false "Shared state loaded" line** (SHc-fold-Wauto) is not addressed by P1–P4. P1's refusal would prevent it,
  because the link is refused while the autosave is under way.

## 8. What I did not do

- I edited, staged, committed and pushed nothing in `/home/user/orbit-board` or `/home/user/orbit-ui`; both were only read.
  orbit-ui shows a ` M ui-concept/CHUNK3.md` from another session; I did not touch it.
- `mutate.mjs` was never read, imported or run. The full `audit-import.mjs` and `audit-board.mjs` were not run, and no suite was
  run. No Chromium, no Playwright, no `playwright install`.
- I applied no fix and wrote no product diff.
- Not tried:
  - the `file://` XHR sidecar route (needs Chromium; jsdom cannot);
  - two tabs or Web Locks (U20);
  - the next 💾 Save from the falsely-clean states (U17's measurement);
  - BT's "no room" offer.
- I did not re-run the builder's dev, dev2 or r1 passes separately. x1 covers the final probe's 38 scenarios.
