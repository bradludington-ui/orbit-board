# ORBIT v2.00 UI chunk 2: adversarial review

Branch `claude/v200-ui`, local only. Reviewed commits: `5ea7d15`, `f95fee2` (the board commit) and `e70636b` (screenshots, checks, CHUNK2.md), against base `4a6f7c7` and chunk 1 (`acc8489`).

Board blob: base `4d273c06…` → chunk 1 `863f226c…` → reviewed **`9f61d32b28035d4b996842b0fde49d09ff71f57e`**. This matches the builder's report, and `e70636b` (HEAD) carries the same blob.

## Verdict: preserved, with issues. Integration stays pending.

**Money, save and persistence behave exactly as in base.** This was checked by running the code (section 5):

- The saved payload is byte-identical to base on the same seed and clock. It stays identical after driving the new controls: the docked setting, the Cycle control (lock, view, edit while viewing, leave), a refused Add, the Import box and a refused batch.
- Opening makes exactly the same storage writes as base, in the same order.
- The KPI cards equal the board's own totals, in whole dollars.
- All four suites pass at this blob.

**Base import behaviour is unchanged.** The only import change is the new "All submissions at once" path. It works in every case Brad listed, with one exception (M1):

- If the person answers **Cancel** to a question during the load, after an earlier file in the batch has already been taken, that earlier file's destination-list entries stay on the board.
- The alert then says "nothing on the board was changed". That is not true in this case.

**Layout.** Brad's width matrix is clean for rows, money cells and the RECORD panel's money inputs. Two things are not:

- **S1.** In Funding at 1440 with the sidebar open, the end of the posture strip is cut off at the right edge, including the **Funding detail** button.
- **S5.** At 760 and 1000, folded Reports menu items lie under the sidebar.

**The repo's browser gate (`verify:grid`) fails at this commit (S4).** Most of the failures are test drift from the new default and from chunk 1.

| Brad's item | Status |
|---|---|
| 1. Slide-over by default; docking optional; widths 1000 / 1050 / 1440 / narrow | **Done.** One editor (the board's drawer). The docked setting is per browser and written only on the person's click. The matrix and the 700–1900 sweep show no row, cell or money-input clipping. See S1 (posture strip), S5 (Reports menu under the sidebar at 760 and 1000) and m1 (390px Brief). |
| 2. Guarded card rendering, forced error | **Done.** Proven three ways: the hand-over unreadable, the third card failing after two had drawn, and both `uiKpis` and `uiKpisNa` throwing. The board stays usable, and the cards say "unavailable" rather than showing stale figures. |
| 3. Brief posture strip | **Done.** Enlarged, as in base. See m1 for 390px. |
| 4. Add / PMO Import permissions, handlers included | **Done for the new surfaces and their handlers.** The rules match base in every mode, under a locked view, and in a PMO copy. Existing handlers are left as base has them (m3). |
| 5. PMO batch: malformed second file, duplicates and conflicts, failing storage | **Done except M1.** No partial application, the review state is preserved exactly, and reopening is correct in every refused case except Cancel mid-run. |
| 6. Genuine metadata | **Done, with S2.** Lifecycle shows "pending". The last-edit line names only per-requirement journal entries. It is not suppressed by a board-wide line recorded under another year. |
| 7. Cycle control | **Done.** It offers exactly base's choices (`cycLeave`, plus `cycView` over `blList()` filtered by `cycHeld`). The read-only wording is clear. |
| Chunk-1 leftovers: S1 docked inputs, header labels, Editable chip, batch order | **All fixed and verified.** |
| Screenshots at the exact commit | **Verified** (section 6). |

## 1. Every board hunk of `git diff 4a6f7c7 f95fee2 -- prioritization-board-grid.html`, classified

The diff is **insertions only**: 832 added, 0 removed. Against chunk 1 it is 376 added and 79 removed, all of it inside chunk-1 code.

| # | Hunk | What it is | Class |
|---|---|---|---|
| 1 | `@@ -1277 +1277,214` | `<style id="uiV2css">`. Every rule is gated by `html.ui-on`, a `ui-*` class or a new id. Chunk 2 adds four things here. First, the base `max-width:1400px` drawer rules, applied under `html.ui-on:not(.ui-dock)`; they carry the same declarations as the base rules. Second, the room classes `ui-e1400/1100/940/760/640`. Third, `#uiAddBtn` limited to Review and `.ui-sandbox` hiding the PMO card. Fourth, the Brief posture rule and the KPI "unavailable" style. | Presentation |
| 2 | `@@ -1306 +1514,28` | `<nav id="uiSide">`, `#uiFly` | Presentation (markup) |
| 3 | `@@ -1390 +1620,21` | `#uiPage`: heading, `#uiKpis`, toolbar. Add now calls `uiAddReq()`. | Presentation, plus a new guarded handler |
| 4 | `@@ -1960 +2205,28` | The Import box and `#uiSubMulti` | A new import entry point that calls the existing loaders. It is not an edit inside an import function. |
| 5 | `@@ -22227 +22494,10`, **inside `scoreboard()`** | `window.UI_KPI={…}` and a `try{ uiKpis() }catch(e){ uiKpisNa(e) }` hand-off | A change inside a money function, but **the one Brad's item 2 asks for**. It only reads: the payload is identical, recon passes, and the cards equal `tierTotals`. **Accepted.** |
| 6 | `@@ -30635 +30906,8`, inside `drawerNarrow()` | `if(uiSlides()) return true;` before the base `matchMedia` line | Drawer machinery (presentation), which item 1 asks to reuse. Its only callers are `drawerOpen`, `drawerSync` and the Esc listener. When docked, the answer is base's. **Accepted.** |
| 7 | `@@ -31581 +31854,565` | The `ui*` functions and `uiBoot()`. This includes the new batch logic `uiSubMany` / `uiTakeDry`. | New code. The batch logic is import orchestration and was reviewed as such: see M1 and S3. |

No other existing function was edited. Hunks 5 and 6 are the only edits inside existing functions, and only hunk 5 touches a money function. Everything else is new code that calls existing functions.

## 2. Ids and functions

- **Base → chunk 2:** 0 element ids removed and 0 functions removed.
- **Chunk 1 → chunk 2:** 0 element ids removed and 0 functions removed.
- **New functions:** `uiAddReq`, `uiCycGo`, `uiCycKeys`, `uiDockSet`, `uiFileText`, `uiKpiCard`, `uiKpisNa`, `uiLastEdit`, `uiLastEditHtml`, `uiNarrow`, `uiPeekClose`, `uiPenOther`, `uiRailApply`, `uiRoom`, `uiSandbox`, `uiSlides`, `uiTakeDry`. None of these names occurs in base.
- **New id:** `uiCycPop`, created at run time.
- **`SRC0`.** Once the six static blocks are removed, `SRC0` is the same as base's, and it carries no run-time UI. This comes from the chunk-1 reviewer's `rv-smoke.mjs`, re-run at this blob with 0 fails.

## 3. Storage

- **At opening.** Every `setItem` / `removeItem` call made while the board opens was logged, for both builds, in a plain jsdom parse:

  - base: `remove prio27bands_om`, `set prio27destdb`
  - chunk 2: `remove prio27bands_om`, `set prio27destdb`

  They are **identical, in the same order**. No `prio27ui*` key is written at opening.
- **On the person's action only.** The preferences are `prio27uiDock`, `prio27uiRail` and `prio27uiCols`.
  - They are written by `uiPrefWrite`, a plain `try{localStorage.setItem}catch` that never calls `lsSet`.
  - They are written only from `uiDockSet`, `uiRailToggle` and `uiColSet`.
  - Docked → reopen → still docked; no key → slide-over.
  - None of them appears in a saved payload.
- **Same calls, same storage.** After the same existing calls, storage outside `prio27ui*` is identical to base, keys and values, including after the Cycle round trip.
- **Writer key.** `uiPenOther` reads `prio27writerKey` and never creates it. `writerIsMe` is asked only when a valid key already exists. Checked: no key is written, and the chip reads "Pat Writer holds the pen", "✎ Editable" (me), or "Someone holds the pen" correctly.

## 4. Brad's list, item by item

**1. Slide-over by default.**

- `drawerNarrow()` is true unless docked. The drawer CSS is base's own. The drawer keeps its Esc, scrim and Close.
- View › Record panel › **Docked** gives base's own docked layout at `clamp(420px,30vw,600px)`, which is 432px at 1440, as in base.
- Chromium matrix (`rv2/sweep-matrix.json`). Every case was set the way a person sets it: the sidebar's own ‹ button, View › Docked, and a click on a row.
  - Widths 760, 900, 901, 1000, 1050 and 1440, with the sidebar open (over the page at 900 and below) and collapsed.
  - The record panel closed, then opened by a click on a row, then closed with Esc.
  - The docked setting at 1000 (it falls back to the drawer there) and at 1440, in all five modes.
  - Result: **0 rows overflowing, 0 cells outside the row, 0 cut money cells, 0 sideways page scroll.**
  - In the RECORD panel, 13 inputs, **0 money inputs cut, and every input could be scrolled into view inside the panel and the window.**
  - The one exception is the posture strip (S1).
- 700–1900 sweep, step 20, all five modes, with a nine-digit requirement and allocation seeded (`rv2/sweep-{base,open,rail,dock,dockrail}.json`):
  - **Base:** nine-digit figures cut at 780–940 (Rank, Fund, Brief) and at 960–1100 (Brief). Brief rows overflow at 1120–1320.
  - **Chunk 2, in all four configurations:** **no row overflow, no cut figure, no cell outside the row, and no sideways page scroll anywhere.**
  - So there is no row regression against base, and base's own Brief and nine-digit faults are gone.

**2. Guarded cards.**

The forced errors are probes only; nothing is shipped.

- **Way 1: the figures hand-over cannot be read.** `UI_KPI` was made an accessor that throws, and a budget change was made at the same time.
  - The twin board's Discretionary card moved from $242,000,000 to $212,000,000, so a stale figure would have shown.
  - All four cards read "unavailable", with no `$` on them.
  - `render()` completed: 14 rows. The posture strip is identical to the twin's.
  - The RECORD panel drew. A note, a Fund allocation and `save()` gave a **payload and storage identical to the twin without the error**.
  - The cards came back with the board's figures once the hand-over worked again.
- **Way 2: the third card fails after two have drawn.** All four read "unavailable"; none is half-drawn.
- **Way 3: `uiKpis` and `uiKpisNa` both throw.** `render()` still completes, with no page error.

**3. Brief posture strip.** `html.ui-on:not([data-mode="fund"]):not([data-mode="brief"]) #posture{display:none}`. Brief shows base's enlarged strip (screenshot `b-1440…`).

**4. Permissions.** The base rules, read from the code:

| Control | Base rule |
|---|---|
| Add requirement | Review only: `#toolAdd` sits in `#t_review` (`.modetools` shows only the mode's own tools); the folded menu is `T.review = I.add+I.mat`. It is **not** gated by `CYCVIEW` or `SANDBOX`, and the PMO-copy guide tells offices to use ＋ Add requirement. |
| PMO Import | File ▾ leaves out the Program offices group under `SANDBOX` (`_SB? '' : grp('share','offices',…)`). It is not gated by mode or by `CYCVIEW`. `importState` has no `cycBlock`. |

The new UI against those rules:

| Case | Checked | Result |
|---|---|---|
| Add, by mode | `uiAddReq()` against base's folded menu, in jsdom | Review only, in all five modes. The handler refuses elsewhere. |
| Add, locked view in Review | | Offered, as in base |
| PMO copy | | `html.ui-sandbox` is set; the File menu has no Program offices; `uiImpPick('pmo')` is ignored; `uiImpGo` (PMO) opens no picker and no review; `uiSubMany` refuses |
| Visibility | The builder's `permvis` (Chromium) | Agrees |

**5. The PMO batch.** The fixtures carry a destination list, which the builder's fixtures did not. Before each case the review held TSS with one row ticked.

| Case | Result |
|---|---|
| Valid, then malformed JSON | Refused, nothing taken |
| Valid, then wrong width (refused only by the `pmoTake` dry run) | Refused, nothing taken |
| Valid, then a state file (not a submittal) | Refused, nothing taken |
| The same office twice, differing | Refused, nothing taken |
| The same office twice, identical | Refused, nothing taken |

Every refused case above was checked for all of these:

- The review is exactly as before: `PMOSUBS`, `PMOPICK` including the tick, `subOpen` and the rows.
- `MS`, `DESTDB` and the saved payload are unchanged.
- **No storage write at all** during the batch.
- Reopening the review gives exactly the HTML it had before.
- After the dry run, `setStat`, `subOpenReview`, `destPkgIn`, `alert` and `confirm` are the board's own functions again, by identity.

Storage throwing `QuotaExceededError` on every write:

- **Valid batch:** loaded. The review is identical to the same batch with storage working. The one write attempted (`prio27destdb`) was refused and storage is unchanged.
- **Valid then wrong width:** refused, the review exactly as before.
- **Valid then malformed:** refused, the review exactly as before.

Success, picked as PSM, AV, TSS and as AV, TSS, PSM:

- The review, the plan data and the saved payload are identical to loading the same files one by one in that order.
- Files are held in pick order, and nothing is ticked.

**Cancel mid-run fails (M1).**

**6. Metadata.**

- "Lifecycle pending — the board has no lifecycle field for a requirement yet." The board has no such field: "lifecycle" in base means the row's ⋯ actions.
- A note on S03 shows "Last recorded edit … note (change journal; ranking moves are not journalled)". S04 shows none.
- No "Last change" label appears anywhere. A later `(load)` line in the same year suppresses the line.
- **Fails across years (S2).**

**7. Cycle control.**

- `uiCycKeys()` equals base's own Compare 👁 View list, `blList().filter(cycHeld)` (`["PB|2027"]`).
- Every item calls `uiCycGo` (→ `cycView` / `cycLeave`), or "Cycles & compare…". An unknown key is ignored.
- The wording names "View a locked cycle (read only)" and says "The board has one working plan. A locked cycle is a read-only record of it, not a separate plan to edit."
- While viewing, the button reads "PB27 (locked, read only)" and the chip "🔒 Read only — locked cycle".
- An edit made while viewing is refused by the board itself, and after leaving the view the payload equals base's for the same calls.

## 5. Checks run

Every command was bounded with `setsid -w timeout -k 10 600` (300 for small ones), with BOARD unset. PIDs are in scratchpad `uichunk2/pids.txt`. Scripts and outputs are in scratchpad `uichunk2/rv2/`. The lock (`AUDIT_IMPORT_RUNNING`) was checked before every suite and repo tool. It was held several times during this review. Each suite and tool run waited until it cleared, except the two short `inspector-agrees` variants noted in section 5b.

| Check | Result |
|---|---|
| `node tools/export-audit/audit-recon.mjs` | **ALL CHECKS PASSED**. It waited 180 s for the lock. |
| `node tools/export-audit/audit-other.mjs` | **ALL CHECKS PASSED** |
| `node tools/export-audit/audit.mjs` | **ALL CHECKS PASSED** |
| `node tools/export-audit/boot-same.mjs` | **same** in all four cases: as shipped, seeded, reopened from its save, and a PMO copy |
| Not run (as instructed) | `audit-import.mjs`, `audit-board.mjs` |
| Chunk-1 reviewer smoke (`uichunk1/rv-smoke.mjs`) at this blob | **0 fails**: payload identical to base, saved file unchanged by the UI, `SRC0` clean, KPI 383/242/34/107 equal to the totals, import routes unchanged |
| Reviewer probe (`rv2/probe.mjs`, jsdom) | **122 of 125 pass.** The 3 failures are M1 (2) and S2 (1); details above. |
| Storage writes at opening (`rv2/openwrites.mjs`) | Identical to base |
| Docked setting kept per browser (`rv2/persist.mjs`) | Kept; read without writing |
| Editable chip (`rv2/pen.mjs`) | Correct in all four cases; no writer key created |
| Service-list change across years (`rv2/svcline.mjs`) | S2 reproduced |
| Header (`rv2/hdr.mjs`) | `fitTop` drops the labels again. One line (44px) at 1300 and 1440, against 77px in chunk 1. Two lines at 1200 and below, as base has at 1100 and below. |
| Width matrix and 700–1900 sweeps (`rv2/sweep.mjs`, Chromium) | Section 4, item 1 |
| Toolbar menus at 760 / 761 / 900 / 1000 (`rv2/menus.mjs`) | S5 |
| 390px phone (`rv2/phone.mjs`) | m1 |
| verify:grid browser tools on base, chunk 1 and chunk 2 (`rv2/run-tools.sh`, `run-tools-c1.sh`; scratch copies of the unchanged `tools/`) | See section 5b. The gate fails (S4). |

## 5b. verify:grid browser tools: base, chunk 1 and chunk 2

The repo's own browser gate was never run on chunk 1 or chunk 2, so it was run here on all three boards. Each ran from a scratch copy of the unchanged `tools/` (`rv2/run-tools.sh` and `run-tools-c1.sh`; outputs in `rv2/tools-out*/`), with the lock checked before every run. One exception: the two short `inspector-agrees` variants were started while a lock taken at 03:33 was present. They are single-page Chromium checks, not suites.

| Tool | Base `4a6f7c7` | Chunk 1 `863f226c` | Chunk 2 `9f61d32b` | Cause in chunk 2 |
|---|---|---|---|---|
| `inspector-agrees` | pass | pass | **fail**: at 1700px the scrim of row A's drawer intercepts the click on row B | **Chunk 2** (slide-over default). The tool assumes a docked panel. Two variants (`newcopy/tools/rv-inspector-agrees-{docked,slideover}.mjs`) found **"the inspector agrees with the lane engine on every row"**, both with `prio27uiDock=1` and in slide-over with Esc between rows. So this one is pure test drift. |
| `editors-reachable` | pass | pass | **fail** at 1440, 1600 and 1920: "the RECORD panel is drawer, not beside the rows" | **Chunk 2**. Every editor is still reached (REQ editor 7, impact 1, dead chips 0, overflow 0). The tool asserts the docked layout above 1400px. |
| `keyboard-reach` | pass | 9 fail | 10 fail | The same 9 as chunk 1, plus **D**: a second row click is blocked by the scrim (**chunk 2**). Chunk 1's 9: A×5 (the message button is no longer reached with Tab from `#q`, which moved to the toolbar), F (the mode tabs are hidden in favour of the sidebar), L×3 (the posture strip is hidden outside Funding and Brief). |
| `dropdowns-visible` | pass | crashed early (a row's ⋯ is covered: chunk 1's M2) | **fail** (60): Reports › FYDP and CCaR group items are covered by `#uiSide` at 761px | Present at this blob (S5). Most likely from chunk 1's sidebar; chunk 1 crashed before reaching it. |
| `dialogs-keyboard` | pass | 1 problem | 1 problem: "uiImpPanel: did not open" | Chunk 1. The tool derives a box's opener from its backdrop's close call, and `uiImpClose` maps to no opener. Test drift. |
| `toolbar-fits` | pass | fail at 8 widths (1152–1440 wrap) | fail at 2 widths (1152 wraps; the room is 920px beside the sidebar) | Improved by chunk 2; nothing is clipped |
| `layout-fits` | 6 fail (J Rank/Fund/Brief, both themes) | not run here | 4 fail (D: the first row starts at 323px at 1920/1440/1366, and 453px at 1024) | Matches the builder's report. D comes from chunk 1's heading and cards. |

**`npm run verify:grid` therefore fails at this commit (S4).**

- Some of the failures are test drift: the tools assume a docked panel at 1400px and above, the mode tabs in the task bar, and `#q` in the header.
- Two are real: S5, and the header wrap at 1152 (m6).
- Updating the tools changes what the gate asserts, so it needs Brad's agreement.

## 6. Screenshots (`ui-concept/preview-chunk2/`)

**They were taken at this exact blob.** The builder's `shoot-chunk2.mjs` was re-run against the extracted `9f61d32b` board:

- **15 of 26 PNGs are byte-identical.**
- 10 differ by 2–71 pixels: anti-aliasing at the drawer's edge and focus rings.
- One, `c-1440-viewing-locked-cycle-read-only`, differs by 4,024 pixels in the status line. The cycle is locked at run time with the live clock.

`p-1440-pmo-copy-import-box-no-pmo-card.png` comes from the builder's `permvis.mjs`, not from the shoot script.

What I saw in the screenshots:

- **The width matrix** shows the drawer at 460px over the table, and the sidebar over the page at 760.
- **Docked at 1440** shows the panel at 432px with whole inputs.
- **Brief** has the enlarged strip.
- **The forced card error** shows four "unavailable" cards above working rows.
- **The Cycle control** offers Working plan / PB27 — locked, with the read-only wording.
- **The Import box** shows PMO Import with All submissions at once. In a PMO copy it has no PMO card.
- **`f-1440-fund-no-add-button.png` shows S1.** The strip's "📅 14 without an obligatio…" is cut at the window edge and the Funding detail button is out of view.

The board file is still an empty template: "Synthetic", "SYN-" and the probe's destination occur 0 times in it.

## 7. Issues

### Must-fix

**M1. "All submissions at once" is not all-or-nothing when the person answers Cancel during the load. The message then says something false.**

- **What happens.** The dry run answers OK to every question `pmoTake` asks (its `confirm` stub returns true). The real run then asks the person.
- If a later file's question (no fiscal year, a different year, or no office) is answered Cancel, `uiSubMany` puts `PMOSUBS` and `PMOPICK` back.
- But an earlier file in the batch has already been through `pmoTake` → `destPkgIn` → `destFold` → `persistDest()`. Its destinations are now in `DESTDB`, which is saved in the board file as `destDb`, and in `prio27destdb`. They stay.
- **Reproduced** (`rv2/probe.mjs`, "D cancel mid-run"). The batch was AV, whose copy added a destination "Probe Depot Zulu", then PSM with no year, answered Cancel.
  - The review is exactly as before.
  - The **saved payload changed and contains "Probe Depot Zulu"**, and `prio27destdb` changed.
  - The alert reads: "None of the 2 submittal files was loaded … and **nothing on the board was changed**."
- This breaks Brad's "no partial application … validated before anything is loaded". It also contradicts CHUNK2.md's row "Cancel during the real run: Review and board exactly as before". The builder's fixtures carry no destination list; CHUNK2.md's Unfinished section half-admits the effect.
- **Fix, without touching `pmoTake`:**
  - In `uiTakeDry`, keep the questions the `confirm` stub sees (it already pushes them into `msgs`).
  - If any file in the batch would ask a question, do not load anything. Either refuse the batch and name the file to load on its own, or ask those questions first and only then start the real run.
  - Only say "nothing on the board was changed" when that is true.
  - Re-run the case above with a file that carries a destination list.

### Should-fix

**S1. The posture strip's last items are cut off at Brad's 1440 width in Funding, and in Brief at wider windows.**

- **Where.** With the sidebar open, Funding at 1340–1640 (1440 included) and Brief at 1640–1720. As the rail: Funding at 1180–1480 and Brief at 1480–1560. Docked: Funding at 1340–1400.
- **What is cut.** The "Needs attention" entry ("📅 14 without an obligation date") and the **Funding detail** button. Both sit beyond the right edge, inside the strip's `overflow-x:auto` scroller. They can still be scrolled to, but they are hidden. The builder's own `f-1440-fund-no-add-button.png` shows it.
- **Base.** Base has the same at windows of 1120–1420 (a room of the same width). At 1440, base shows everything.
- **Cause.** The wrap rule covers only `ui-e1100` (every mode) and `ui-e1400` in Brief. Brief's enlarged strip needs about 1,500px.
- **Fix.** Wrap the strip at `ui-e1400` in Funding too, and in Brief up to a room of about 1,500px. Add the strip to the sweep.

**S2. The last-edit line is not suppressed by a board-wide line recorded while another year was on screen.**

- **Cause.** `uiLastEdit` runs `if(+e.fy!==+MS.cur) continue;` **before** its board-wide check. A `(services)` or `(load)` line is recorded under the year on screen at the time, but it changes every year.
- **Reproduced with a real service-list change** (`rv2/svcline.mjs`):
  - add a note to S03 in FY27;
  - switch to FY28;
  - `svcSaveList(['USAF','ANG'])`;
  - switch back to FY27.
- **Result.** S03's FY27 requirement value went from `[5,000,000, 2,000,000, 1,000,000]` to `[5,000,000, 2,000,000]`, but the RECORD panel still shows "Last recorded edit … note".
- This breaks the builder's own stated rule and Brad's "only if the journal can answer it per requirement".
- **Fix.** Test `wide[e.p[0]]` (and an empty path) before the year filter.

**S3. The dry run depends on what `pmoTake` does today.**

- **Today it is sound:**
  - no storage write;
  - all five globals put back by identity;
  - `MS`, `DESTDB` and the payload unchanged in every refused case;
  - no `await` between the dry run and the real run.
- **The risk.** It is correct only because `pmoTake`'s side effects are exactly `alert`, `confirm`, `setStat`, `subOpenReview`, `destPkgIn`, `PMOSUBS` and `PMOPICK`. A future `pmoTake` change that adds a journal line, an `lsSet` or a counter would leak through the dry run without anything failing.
- **Fix.** Add a suite check that a refused batch leaves storage, `MS` and `DESTDB` untouched, using the probe's D(a) case. Also add a one-line note at `pmoTake` that `uiTakeDry` relies on this list.

**S4. The repo's browser gate (`npm run verify:grid`) fails at this commit** (section 5b).

- **Caused by chunk 2's slide-over default:** `inspector-agrees`, `editors-reachable` and keyboard-reach D.
- **Inherited from chunk 1:** keyboard-reach A, F and L, `dialogs-keyboard`, and the 1152 header wrap.
- **The chunk-2 failures are test drift.** `editors-reachable` still reaches every editor, and `inspector-agrees` passes on every row once docked, or with Esc between rows.
- **Fix.** Update the tools for the new default, with Brad's agreement:
  - close the drawer between rows, or set `prio27uiDock=1` for a docked pass and add a slide-over pass;
  - find `#q` and the mode switch where they now live;
  - map `uiImpClose` → `uiImpOpen(`.
- Then fix the real faults (S5, and the 1152 wrap, m6) and re-run the gate before integration.

**S5. Report menu items are hidden under the sidebar at Brad's 760 and 1000 widths.**

- **What happens.** Open **Reports ▾** and unfold *Five years & PPBE* or *CCaR & accounting files*. The menu is right-aligned and wider than the room, so its left part lies under the fixed `#uiSide`:
  - 12 items at 760 and 761 (the menu's left edge is at 8px);
  - 7 items at 1000 (left edge at 191px).
- The covered items include **✈ Pre-flight check**, which the house rule says to run before every export (`rv2/menus.mjs`).
- **Base:** none, at every width tested.
- **Fix.** Keep a dropdown's left edge at or beyond `var(--uiSideW)`, or put open menus above the sidebar.

### Minor

- **m1.** At a 390px phone, Brief scrolls sideways by 21px (base: 0). The restored posture strip's `<small>` "unfunded · $276,000,000 funded" ends at 411px beside the 64px rail. Brad's 760 narrow layout is clean.
- **m2.** After a successful batch, the final status line replaces `pmoTake`'s own line. So when a batch file replaces a submittal already held from that office (base rule), the person is not told. The summary should name the replacements.
- **m3. Existing handlers are left as base has them.** This was disclosed and is consistent with base. It falls short of a literal reading of "including the underlying handlers".
  - `toggleAdd` / `addReq` are not guarded. The add panel stays open across a mode change, as in base, so `addReq` still works in Fund or Brief once opened in Review.
  - In a PMO copy, a submittal can still enter the review through the Import box's **One appropriation** card (`importState` → `pmoTake`), exactly as base's "⬅ Import one appropriation" allows.
  - In a PMO copy, the Import box opens on **Full board**, which the board then refuses (`sandboxBlock`), as File ▾ does.
- **m4.** CHUNK2.md's batch rows overstate:
  - "Cancel … board exactly as before" (see M1).
  - "Storage failing, valid batch: Board unchanged". True only because those fixtures carry no destination list. With one, `DESTDB` changes in memory, exactly as a single load does.
- **m5.** If `scoreboard()` itself threw before the hand-off, the cards would keep the last figures. `render()` would already be broken in that case, as in base. Noted, not a chunk-2 fault.
- **m6.** `toolbar-fits`: at 1152 the context bar wraps to two lines beside the sidebar (base: one line). Nothing is clipped.
- **m7.** Disclosed and still open:
  - the subtitle lower-cases the cycle label;
  - layout-fits D (the first row starts below 320px) is Brad's call on the look;
  - pre-existing in base: the RECORD By-service TOTAL is ellipsized, and the strip still prints compact `$75.0M`.

## 8. What must happen before integration

1. **Fix M1** and re-run the cancel case with a destination list.
2. **Fix S1, S2 and S5.** Add S3's suite check.
3. **Make `npm run verify:grid` pass (S4).** Agree with Brad which assertions change for the slide-over default.
4. **Re-run** the four suites (honouring the lock), the probe and the width matrix, and re-shoot `f-1440` and `b-1440`.
