> **Fix round (13 Oct):** the verdict on the fix round (`7a71245` → `dd15956`) is in `r2/VERDICT.md`, and its record in `r2/README.md`. This file is the first round's (12 Oct, 19:38 ET), kept as written.

# ORBIT v2.00 UI chunk 3, part 2 (S1–S5): verifier's verdict

Written 12 Oct 2026, 19:38 ET. Reviewed: `claude/v200-ui` in `/home/user/orbit-ui`, base `670c467`, HEAD `7a712455885c87c40db8b225e26f22208057198b`. The final board blob is `5e9e5a5e383e0553342f822050b36da7d23e9eab`, the same from `8325909` to `7a71245`. Every run below was made from scratch copies in this directory. Nothing in `/home/user/orbit-ui` or `/home/user/orbit-board` was edited, staged or committed. The record of what I ran (each run, PID, blob and script) is in `README.md`.

## Verdict: sound, with issues. One must-fix, in the tools, not the product.

### What the product change does

**The product change is right and minimal.** S1 (CSS), S2 (`uiLastEdit`), S3 (a comment), S5 (`uiMenuFit` and the `fitMenus` wrap) and S4 (`uiImpOpen(from)`) each do what Brad asked. Nothing beyond the five items is applied.

- **No money, save, import or persistence code changed.**
  - `pmoTake`, `fitMenus`, `destPkgIn`, `persistDest`, `save`, `tiers`, `importState`, `subOpenReview`, `jrnlSync`, `jrnlAdd`, `jrnlCapture`, `svcSaveList`, `switchYear` and `buildSavedHtml` are byte-identical to base.
  - From `670c467` to the final board, the only functions that changed are `uiLastEdit`, `uiImpOpen` and `uiGo`. `uiMenuFit` is new. Against base the board diff is still insertions only: 1,056 added, 0 removed.
- **The saved payload and the writes at opening are unchanged.**
  - The saved payload is byte-identical to base (`savedPayloadSame: true`).
  - Opening makes the same writes to browser storage, in the same order.
  - The chunk 2 reviewer's probe gives 130 PASS, 0 FAIL. On `2916f0a`, before S2, it gives 129/1, and the one failure is S2's case.
- **The other suites pass.** audit-other, audit and audit-recon print ALL CHECKS PASSED, and boot-same prints "same" in all 4 cases.
- **Mutation entries.**
  - Each of the 1,340 entries matches the final board exactly once (counted as text).
  - The 35 `v200-ui3-*` entries are absent from base, as the builder reported.
  - The 9 new entries sit at the end of the `v200-ui3` group, as the UI track's own rule requires (`rec/L3/wf/ui.js`, `UIX`).
- **The board is still the empty template.** `npm run check` reports "pubState is null" and "APPNS is empty", and the synthetic strings occur 0 times.

### Every reported run, re-run

Every number below matches the builder's report.

- **audit-ui:** 604 checks, all pass.
  - On `670c467`'s board and on `2916f0a`'s, 8 fail, all of them S2's board-wide cases.
  - On `f95fee2`'s board, 278 fail: 254 in M1's sections, 8 in S2's and 16 in S3's.
- **The 35 `v200-ui3` mutants:** all 35 are caught, with exactly the builder's failing-check counts. All 604 checks ran each time, and no block threw.
  - `dry-marks-unsaved` fails only S3's three dry-run cases, so it passes every M1 check.
- **verify:grid**, each tool run on its own:
  - Final commit: 11 tools pass. row-controls, toolbar-fits (1152) and layout-fits D×4 fail.
  - Base: only layout-fits J×6 fails.
  - Chunk 2: 9 tools fail.
  - With timings masked, the unchanged tools print the same output on chunk 2 and on the final commit.
- **Sweeps:**
  - posture: 0 widths with a problem.
  - reports: 0 problems in 479 menus per setting. Five years & PPBE runs 72–676px at 760, and 240–844px at 1000 with the sidebar open.
- **Import box:** the keyboard returns to the opener in 16 of 16 cases (dialogs-keyboard). On `8f331a8`, before the fix, 8 of 16 fail.
- **`npm run check`:** the same 10 `jsa()` values fail as at `670c467`, compared as text. None is added. My copy also fails the two "tracked by git" checks, only because a `git archive` copy is not a repository.

**Screenshots.** All 37 were retaken at board `5e9e5a5e`:

- 30 are pixel-identical to the committed PNGs. 7 differ by 2–32 pixels, from anti-aliasing and the drawer's edge.
- `shots.json` measures the same in all 37.
- The committed PNGs are byte-identical to the builder's `p2/shots/`. The builder's shot board hashes to `5e9e5a5e`.

**My own mutants**, beyond the builder's 35:

- **Caught:**
  - S1 wrap removed: sweep3 posture reports 111 widths, the same distribution as on chunk 2.
  - S3 (6 mutants), each caught by S3's own section. They make the dry run save, move `_saveGen`, stamp `DESTDB`, write a note into the plan, remove a storage key, or leave `PMOSUBS` as the copy.
  - S4, opener focus removed in whole, from the sidebar only, and from the toolbar only: 8, 4 and 4 dialogs-keyboard problems.
  - S5, wrap removed, or the menu stopped 40px short of the sidebar's edge: dropdowns-visible gives 100 and 64 problems, and sweep3 reports gives 439.
  - The docked setting ignored: inspector-agrees, editors-reachable and keyboard-reach D all fail.
- **Escaped**, the same-year rules in S2 (see should-fix 1):
  - `vS2-removed-ignored`
  - `vS2-empty-path-ignored`

## mustFix

1. **S4: docked coverage is not kept in layout-fits (C and I) or in dropdowns-visible's row menus.**
   - **What Brad asked.** S4: "update tools for … the slide-over default, **retaining docked coverage**." At 6:00 AM: "Update layout tests for the slide-over default **while retaining checks for optional docking**."
   - **What the builder says.** The README says docked passes were added "where a tool's assertions depended on the panel docked". It names only layout-fits F and row-controls as not given one.
   - **What base actually checked.** On base, layout-fits C ran with the RECORD panel docked at every width from 1401 to 1920 (my `layout-fits-where@4a6f7c7` run: "sticky … grid 16–1318" at 1920, "grid 16–982" at 1440). That is the layout v1.89 broke ("the ⋯ menu on every row between about 1401 and 1745px").
     - The same holds for layout-fits I (lane-short figures whole in the panel at 1920 and 1440) and for dropdowns-visible's row ⋯ menus at 1536 and 1920.
   - **What the final commit checks.** The same assertions run only with the slide-over drawer closed and the grid at full width. The docked layout beside the sidebar is the narrowest the board has (grid 248–982 at 1440), and no tool in the gate checks it any more.
   - **No product fault today.** My docked variants pass at the final board: C, I and J in layout-fits, and all 408 drop-downs in dropdowns-visible. So the fix is cheap: add a docked pass, with `prio27uiDock='1'` set as View › Record panel sets it, to layout-fits C and I and to dropdowns-visible. Then correct the README and CHUNK3.md statement.

## shouldFix

1. **S2's tests do not hold the same-year rules that the S2 commit rewrote.**
   - **The claim.** `uiLastEdit` now reads `if(!e.p.length || k==='removed') return null;` after the year filter. CHUNK3.md says a whole year and removed requirements "stay tied to their own year".
   - **What the tests cover.** Only the other-year half: removed in FY28 does not suppress FY27.
   - **What escapes.** With `k==='removed'` dropped (`vS2-removed-ignored`) or the empty-path test dropped (`vS2-empty-path-ignored`), all 604 checks pass. A requirement removed in the year on screen after a note would then leave "Last recorded edit … note" standing, the misleading line Brad asked to suppress.
   - **The fix.** Add same-year controls: S05 removed in FY27 after S03's note gives no line.
2. **toolbar-fits' new check calls a partly covered control "whole".**
   - **What it tests.** Only the point at a control's centre (`elementFromPoint`), plus clipping ancestors and the window.
   - **What it misses.** With the context bar shifted 60px under the sidebar, `#uiCycBtn` sits 31px under the sidebar at 1152 (left 201, sidebar edge 232). It is still reported in "22 controls all on screen, whole and clickable". At 120px the centre is covered and the check does catch it.
   - **The posture strip is never checked.** The tool runs on the empty template, where the posture strip is `:empty` and hidden, so "the posture strip" in its header comment is never exercised. sweep3 does cover the strip.
   - **The fix.** Test the control's edges against the sidebar, as sweep3's `STRIP` does, or drop "whole" from the message.
3. **keyboard-reach D2's and L's docked passes do not check where the panel is.** Only D does. With the docked setting ignored, D2 and L (docked) still pass, and the fault is caught only through D. A one-line placement check in each would make them stand alone.

## Minor

- **CHUNK3.md's line on S3's failures is incomplete.** It says S3's 16 failures on `f95fee2` are because "whose literal messages are M1's". In fact, the two would-ask cases also fail on storage, MS, DESTDB, the review and the save state. Chunk 2 loaded, asked, and left the Cancel's effects: the M1 defect itself.
- **keyboard-reach A is now near-tautological.** It starts its Tab from the control just before `#statBtn` in DOM order (`#b_pmo`, 1 Tab). Base started from `#q` (2 Tabs). The meaningful assertion is kept: the Message button is in the tab order and reached with Tab.
- **The toolbar-fits summary blames the wrong cause.** When a width fails only for an unusable control, the summary still says "width(s) wrap or overflow".
- **The chunk 2 row-controls count differs.** The README says "3 unrecorded RECORD controls", but there are 5 controls in 3 entries (`uiDTab` ×3).
- **Three PID entries have no command line**, in the builder's `pids.txt` and in mine: the `chrome --selftest` run ends before its command line is read. The log carries the command.
- **Not every command was bounded**, by the builder or by me. Python text helpers, git, sed and grep ran directly. Both READMEs disclose it.

## The rules

- **No `mutate.mjs` execution.** No log, command or harness of the builder's runs or imports it. `mcount` and `mkmut` read it as text, and I did the same.
- **Bounded runs.** Every node and Chromium run (the builder's 167, my 137) went through `setsid -w timeout -k 10 <cap>`, with PIDs recorded. Nothing was killed.
- **The lock.** It was checked before every run and was never present.
- **orbit-board.** Untouched by the builder or by me.
  - Its log shows `0dfaac2` at 18:03 ET, "UI branch backup, claude/v200-ui at 83c589f". It is a recovery commit on `claude/v200-fixes-wip`, not a change to the board, and nothing in the builder's record made it.
- **Times.** Every time in the builder's README and CHUNK3.md is earlier than the file it is in. The last commit is at 18:34:51 ET; the README was saved at 18:38:23 ET.
- **Not pushed.** `claude/v200-ui` has no remote branch.
