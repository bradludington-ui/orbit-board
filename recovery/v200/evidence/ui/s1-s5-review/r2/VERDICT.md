# ORBIT v2.00 UI chunk 3, part 2 (S1–S5), fix round: the verifier's verdict

Written 13 Oct 2026, 05:07 ET. I reviewed `claude/v200-ui` in `/home/user/orbit-ui`: nine commits from `7a71245` to `dd1595666b54f9a646385cacc650da1477ffcb6b`. The board blob is `5e9e5a5e383e0553342f822050b36da7d23e9eab` at every commit, so the board is unchanged.

Every run below was made from scratch copies in this folder, and every one is in `README.md` with its start time, exit code, wall time, log and PIDs. Nothing in `/home/user/orbit-ui` or `/home/user/orbit-board` was edited, staged or committed by me. Nothing was pushed.

A usage limit stopped this check part-way at 00:53 ET. The machine then restarted. I resumed at 04:13 ET and re-ran every run that had not finished.

## Verdict: sound. No must-fix and no should-fix. A few minor points.

The fix round does what the first round's verdict asked, and does nothing outside Brad's S1–S5 instruction.

### The must-fix is met

The must-fix was S4's docked coverage: "retaining docked coverage"; at 6:00 AM, "while retaining checks for optional docking".

- **Every tool that ran beside the docked panel on base now has a docked pass at the same sizes.**
  - layout-fits C, D, E, F and I
  - dropdowns-visible at 1536 and 1920 (base's docked sizes; its 8 sizes are unchanged)
  - dialogs-keyboard at 1600
- **Each pass checks where the panel is**, so a docked pass that silently ran sliding over fails by name.
- **The docked passes catch what only they can.** Each of these passed the gate at `7a71245`. All were run through the final tools:

  | My mutant | What it changes | What catches it |
  |---|---|---|
  | `vR-room-no-dock` | rows sized as if the docked panel took no room (the v1.89 kind) | layout-fits C, docked only: 38–57 controls past the grid. dropdowns-visible crashes in its docked pass: the panel takes the ⋯ click |
  | `vR-dock-focus-lost` | docked only: a closed box keeps the keyboard | dialogs-keyboard: 31 problems, all "docked:" |
  | `vR-dock-narrowed-1600` | a silent narrowing: docked only above 1600px | placement fails in layout-fits C, D, F and I; dropdowns-visible at 1536; keyboard-reach D, D2 and L |

- **The builder's mutants give the builder's results.**
  - `fx-dock-ignored` fails in layout-fits, dropdowns-visible (8), dialogs-keyboard (1) and keyboard-reach (D2, L).
  - `fx-docked-rows-wide` fails C docked ×3.
  - `fx-docked-note-cut` fails I docked.
  - `fx-docked-rowmenu-clipped` gives 96 problems, every one docked.
  - The row-menu probe shows `fitMenus()` taking up a shift, at the builder's numbers.
- **A person's View click reaches the same layout as the tools' pre-set key.** I checked at 1366–1920 (`dockclick`, twice).
  - After a reload, the setting was kept in 6 of 7 reloads at 1366 and in all 13 at the other widths. The other widths are 1401–1920 in `dockclick`, 1401 in `dockreload` and 1440 in `dockreload2`.
  - The one loss was in `dockclick@final`, under heavy load at 00:45, with the reload made at once.
  - It was never reproduced, and no hooked run shows the board removing the key.

### The three should-fixes are met

- **S2's same-year half.**
  - 12 new checks, all with literal expected values and a control. They use the board's own `removeReq`.
  - The whole-year line is placed in the journal and carried through a saved file and a reopen. The comment says plainly why no board call can write one, and the board bears it out: `jrnlCapture` writes an empty path only when a year appears in or leaves `MS.years`, and no call removes a year.
  - My `vS2-removed-ignored` and `vS2-empty-path-ignored` are now entries, with byte-identical boards. Each fails 2 checks, the two of its own case.
  - My three further variants are all caught, 2 checks each: `vS2b-created-only`, `vS2b-removed-same-id` and `vS2b-removed-len1`.
  - The section passes on `670c467` and on `f95fee2`.
- **toolbar-fits "whole".**
  - The 60px mutant fails 14 of 20 pairs. At 1440 and wider the shifted button sits at 243px, still clear of 232, so passing there is right.
  - My `vR-save-right-covered` covers Save's right edge with Help. It fails 20 of 20 pairs with the final tool. `7a71245`'s tool passes it: "all on screen, whole and clickable".
- **keyboard-reach D2 and L placement.** With the docked setting ignored, D2 and L fail on their own.

### No assertion was weakened

- **The browser tools.** I read every removed non-comment line of `git diff 4a6f7c7 dd15956 -- tools/*.mjs`. Each changed assertion is listed in `README.md`, old and new. Every condition is kept as it was or made stricter. The only start that moved is keyboard-reach A's, from the derived `#b_pmo` to `#uiCycBtn`, written out.
- **The test files.** `audit-ui.mjs` (+59, −0) and `mutate.mjs` (+8, −0) only gained lines. Every existing fixture, assertion and expected value is kept.
- **The mutation entries.**
  - The two new entries close the contiguous `v200-ui3-` group at the end of `MUTATIONS`, as the UI track's rule (UIX) requires.
  - mcount, as text, counts 1,342 entries, each matching the final board exactly once.
  - The other boards give 1,335 once on `670c467`, 1,309 on `f95fee2` and 1,305 on base.

### Every reported run, re-run, gives the builder's result

- **audit-ui.** All 616 checks pass. Counted, that is 510 + 56 + 50. On `670c467` 8 fail; on `f95fee2` 278 fail.
- **The 37 `v200-ui3-*` mutants.** All are caught. Each runs all 616 checks, no block throws, and **every failing count is identical to the builder's**.
- **verify:grid at `dd15956`.**
  - Every tool exits as the builder's did.
  - With times masked, each tool's output is identical to the builder's.
  - row-controls, toolbar-fits at 1152 and layout-fits D ×4 per pass fail, all known and outside this round.
- **Other suites.** boot-same, audit-other, audit and audit-recon pass.
- **`check`.** In a clone, only the same 10 `jsa()` values fail, word for word. It reports "pubState is null" and "APPNS is empty".
- **Preservation.**
  - `fails: []` and `savedPayloadSame: true`.
  - 130 PASS and 0 FAIL.
  - The batch is refused before anything loads.
  - `IDENTICAL WRITE LISTS: true`.
- **Money, saving, import and storage.** They cannot have changed, because the board blob is the same at every commit. The preservation probes confirm it.
- **The screenshots** are unchanged since `83c589f` and were taken at board `5e9e5a5e`, which is still the board. I viewed two of them again.

## mustFix

None.

## shouldFix

None.

## Minor

1. **CHUNK3.md, the `dd15956` message and the builder's README count "seven minors"; the first round's verdict lists six.** The seventh in the builder's table is the remark that `check` fails its two git checks in a `git archive` copy. That remark came from the runs section, not the Minor list. The `dd15956` message also says the must-fix named dialogs-keyboard. It did not: the builder rightly carried the fix there.
2. **CHUNK3.md's table "Each docked pass catches what only it can" reads "Sliding-over pass: passes" for the layout-fits mutants.** In fact D fails ×4 in that pass on every board, the final one included (m7). The builder's README notes "(+ D ×8, m7)". The table could say "as on the final board".
3. **Two gaps from before S1–S5 that my mutants found.** Neither is a regression, and neither is in this round's scope; each is Brad's call for a later round.
   - **(a) Menus that cannot be scrolled.** `vR-dock-menu-cut` cuts the toolbar's drop-downs to `max-height:90px; overflow:hidden`. It passes dropdowns-visible, because `judge()` calls `scrollIntoView()` on every item, which scrolls even a box a person cannot scroll. `judge()` is unchanged since base.
   - **(b) Row menus at the narrowest docked widths.** `vR-docked-rowmenu-clipped-narrow` cuts the row ⋯ menu in half, docked at 1401–1535px only. It passes, because dropdowns-visible runs docked only at 1536 and 1920, as base did. layout-fits C checks the ⋯ button at those widths, not the open menu.
   - **Fixes for both:**
     - have `judge()` check that a menu taller than its box can scroll (`overflow-y` auto or scroll);
     - add a docked size such as 1440×900.
4. **Bounding, the same disclosure as the first round, now improved.**
   - The builder's lanes ran under caps of 2400–3600 s, and its first attempt's lane scripts were not bounded at all.
   - `pres.sh dd15956` ran under a plain `timeout 590`, though each run inside it went through `run.sh`.
   - My lanes ran under caps of 3600–7000 s.
   - Every node, Chromium and python run that produced a result was bounded at 600 s or less, with PIDs recorded.
5. **Commit messages that cannot be amended.**
   - `f2fa0ff` says 13 checks; it is 12. The builder discloses this.
   - `e950efe` calls 248–982px at 1440 the narrowest grid; the narrowest is 248–955px at 1401. CHUNK3.md has both figures right.

## The rules

- **`mutate.mjs`** was never imported or run, by me or by the builder. Both read it as text only: `mkmut.py`, `mcount.py` and a `re.findall` of ids.
- **Bounded runs, the lock and PIDs.**
  - Every run went through `setsid -w timeout -k 10 <cap>`, with PIDs recorded. Item 4 above covers the lanes.
  - The lock was checked before every run and was never present.
  - Nothing was killed. One of my PIDs, from a finished run, was later reused by another session's process, and I left it alone.
- **Never ran:** `playwright install`, the full `audit-import.mjs` and `audit-board.mjs`.
- **orbit-board** is untouched, and its working tree is clean. Its only new commits are the lead's recovery records. The UI commits show in its `git log --all` because `orbit-ui` is a worktree of the same repository.
- **The board** stays the empty template, at the same blob.
- **Times** are Eastern, and none is later than the file it is in. The builder's README section was saved at 00:22:01 and its latest time is 00:21:21.
- **`claude/v200-ui`** has no upstream.
