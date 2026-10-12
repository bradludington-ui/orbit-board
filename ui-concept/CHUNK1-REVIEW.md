# ORBIT v2.00 UI chunk 1: adversarial review

Branch `claude/v200-ui`, local only. Reviewed commits: `89384e6`, `c85d0e3`, `6bfa965`, against base `4a6f7c7`.
Board blob: base `4d273c06…` → reviewed `863f226cc2218e1ff519520d1e044abf3a9c3607`, which matches the builder's report.

## Verdict: preserved, with issues

**Money, import, save and persistence behave exactly as in base.** This was checked by running the code, not by reading it alone (evidence below):

- The saved file's payload is byte-identical to base on the same seed and clock.
- Driving every new control changes nothing in the saved file.
- Opening writes the same storage as base.
- The KPI cards equal the board's own totals, in whole dollars.
- "All submissions at once" produces exactly the same review as loading the same files one at a time.
- All four suites pass.

**The issues are mostly layout.** The new sidebar and its column overrides push money columns, and Fund's allocation box, out of the row at many common window widths. Base fits at every one of those widths. Two must-fix items are listed below.

## 1. Every hunk of `git diff 4a6f7c7 -- prioritization-board-grid.html`, classified

The diff is **insertions only**: 535 lines added, 0 removed.

| # | Hunk | What it is | Class |
|---|---|---|---|
| 1 | `@@ -1277 +1277,153` | New `<style id="uiV2css">`. Every rule is gated by `html.ui-on` or by new ids. | CSS (presentation). Several specificity overrides cause the layout issues below. |
| 2 | `@@ -1306 +1453,28` | `<nav id="uiSide">` (sidebar) and `<div id="uiFly">` (flyout container). | Markup (presentation) |
| 3 | `@@ -1390 +1559,21` | `<div id="uiPage">`: heading, `#uiKpis` and the toolbar (Columns, Density, Import, Add requirement). | Markup (presentation) |
| 4 | `@@ -1960 +2144,28` | `<div class="modal-bg" id="uiImpPanel">` (the Import box) and `<input type="file" id="uiSubMulti" multiple>`. | Markup. A new import **entry point** that calls only the existing loaders (`fullFile`, `stateFile`, `importState`). It is not a change inside an import function; it was verified equivalent (section 4). |
| 5 | `@@ -22227 +22433,9` inside **`scoreboard()`** | 3 lines: `window.UI_KPI={ask,dUsed,mUsed,u2Amt,dBA,mBA,uN,n}` and `if(typeof uiKpis==='function') uiKpis();` | **A change inside a money function. Must-fix by the review rule** (item M1). It only reads; no figure changes (verified). |
| 6 | `@@ -31581 +31790,332` | 29 new `ui*` functions and `uiBoot()` at the end of the program. | New presentation functions. `uiImpGo` and `uiSubMany` call the existing import functions. `uiPrefWrite` calls the existing `lsSet` for two new browser-only keys, on click only. |

No existing money, import, save, persist, journal, export or file-format function was edited except `scoreboard()` (hunk 5).

## 2. Ids and functions

- **Element ids.** 0 removed. 35 added in markup: `uiV2css`, `uiSide`, `uiCollapse`, `uiNav_*`×9, `uiFly`, `uiFootT`, `uiLogoO`, `uiPage`, `uiTitle`, `uiSubT`, `uiKpis`, `uiTools`, `uiToolsMoved`, `uiColsBtn/Pop`, `uiDensBtn/Pop`, `uiImpBtn`, `uiAddBtn`, `uiImpPanel`, `uiImpC_*`×3, `uiImpSub`, `uiImpGo`, `uiSubMulti`. Three more are created at run time: `uiCycBtn`, `uiEdChip`, `uiColsCss`. None of these strings occurs in base.
- **Moved elements.** `.hdr .srch` (with `#q`), `#m_view` and `#fchips` move into the toolbar at run time, by the same ids. Every lookup in base is by id. No base code tests `.hdr` containment.
- **Lost CSS on a moved element.** One base rule stops applying: `.hdr .ctx .mdd,.hdr #m_view .mdd{left:0;right:auto}`. In Chromium the Filter dropdown then opens at x=328–691, clear of the 232px sidebar, so this is harmless.
- **Functions.** 0 removed or renamed. 29 added. None of the new names, nor `UI2`, `UI_SEC`, `UI_TTL`, `UI_NAV`, `UI_COLS`, `UI_COLIX`, `UI_DTAB` or `UI_KPI`, occurs anywhere in base.
- **Existing functions the new code calls.** All exist with the signatures used: `uiSetMode`, `uiSetDensity`, `uiMode`, `uiDensity`, `toggleMenu`, `openMenu`, `mRun`, `subOpenReview`, `importState`, `lsSet`, `fM`, `apLabel`, `blLbl`, `CYCVIEW`, `SANDBOX`, `_keptMeta`, `PMOSUBS`, `fitTop`, `syncSticky`, `toggleAdd`, `BUILD`.
- **Flyout items.** Each is the same call as its menu item: `mRun(toggleFydp|toggleSp|toggleP2|toggleFlow|exportFydpPlan|toggleEx|toggleRp|toggleFc|toggleCr|toggleQpe|toggleDiv|toggleJrnl|showLog|toggleLive|keptPutBack|keptSaveFile|keptDiscard)`. Import CCaR QPE is `srcFile.click()` inside `mRun`, as in the menu.
- **Dialog controller.** `#uiImpPanel` is a direct `body > .modal-bg[id]` and appears in `dlgBoxes()`, so the existing controller gives it Esc, focus and inert handling.

## 3. Storage

- **At opening.** Both builds write only `["prio27destdb"]`. Nothing new is written at opening.
- **Same existing calls, both builds.** Seed, `uiSetMode('fund')`, `uiSetMode('review')`, then open a record: both builds write the same keys (`prio27destdb`, `spmtMode`) with **identical values**.
- **New keys.** `prio27uiCols` and `prio27uiRail` are written only by `uiColSet` and `uiRailToggle` (the person's click). This was checked call by call; no other new function writes storage.
- **No side effect on the board file.** `fileKeyOf('prio27ui*')` is `''`, so these writes never set `DIRTY`, never bump `_sideGen` and never touch the save state.
- **Not in saved files.** Neither key appears in a saved file.

## 4. Checks run (all bounded with `setsid -w timeout -k 10 600`, BOARD unset, PIDs in scratchpad `uichunk1/review-pids.txt`)

| Check | Result |
|---|---|
| jsdom smoke boot (`boot.mjs`), new board | `X.errors = []`; `html.ui-on` set |
| SRC0 of the new board | Carries no run-time UI: no `ui-on` or `ui-rail` class, no `uiCycBtn`, `uiEdChip`, `uiColsCss` or drawer tabs, no inline `--rowcols`. `#q`, `#m_view` and `#fchips` are still in `.hdr`. The toolbar slot is empty and the KPI box is empty. **SRC0(new) equals SRC0(base) once the six new static blocks are removed** (script text and comments set aside). |
| Saved file, seeded, same clock | `pubState` payload is **byte-identical to base**. The saved file is exactly SRC0 plus the payload. |
| Saved file after driving the UI | Driven: Columns, rail, Funding, FYDP and History flyouts, the Import box with PMO/All, Review, Columns pop and a RECORD panel with tabs. The saved file is **identical** to the one taken before, and none of the run-time markup appears in it. |
| KPI vs totals | Seeded: Ask **$383,000,000** = Disc **$242,000,000** + Mand **$34,000,000** + UFR **$107,000,000**. These equal `tierTotals(tiers(null,scenOpt()))` and the posture's "Whole budget · $383,000,000 asked". With fractional inputs (1,234,567.89) the cards and posture agree, whole dollars, e.g. $372,234,569. The cards follow a budget change on the next render, so they are never stale (`scoreboard()` runs on every `render()` with no early return before the posture block). |
| Import box routes | Full board → `fullFile`. One appropriation → `stateFile`. PMO one → `subOpenReview` + `stateFile`. PMO all → `subOpenReview` + `uiSubMulti`. These match File ▾ and ⬅ Load a submittal file… |
| All submissions at once vs one by one | Three offices, and the same office twice: `PMOSUBS`, `pmoRows()`, `PMOPICK` and the board are **identical** between `uiSubMany` and sequential `importState` calls. Nothing is ticked and the board is untouched. `pmoTake` is synchronous, so concurrent readers serialize like separate loads. |
| `node tools/export-audit/audit-recon.mjs` | **ALL CHECKS PASSED** |
| `node tools/export-audit/audit-other.mjs` | **ALL CHECKS PASSED** |
| `node tools/export-audit/audit.mjs` | **ALL CHECKS PASSED** |
| `node tools/export-audit/boot-same.mjs` | **same** for all four (as shipped, seeded, reopened from its save, PMO copy) |
| Chromium layout sweep, base vs new, 700–1900px step 20, all five modes (playwright-core from orbit-ui, `/opt/pw-browsers/chromium`, synthetic seed at run time only) | See M2 and S1 |
| Not run (as instructed) | `audit-import.mjs`, `audit-board.mjs`. `tools/layout-fits.mjs` was not run either; it should be run after the M2 fix. |

## 5. Money in the screenshots (`ui-concept/preview-chunk1/`)

1, 2, 2b, 3, 4 and 6 (1440) and 5 (1280) show **Total Ask $383,000,000 · Discretionary $242,000,000 (of $242,000,000 BA) · Mandatory $34,000,000 (of $34,000,000 BA) · Total UFR $107,000,000**: whole dollars, and 242 + 34 + 107 = 383. Row figures are whole dollars.

Screenshots 1 and 4 also show the clipping described in S1: the RECORD panel's per-service inputs read "23,000,00…".

The board file is still an empty template ("Synthetic" and "SYN-1" occur 0 times).

## 6. Issues

### Must-fix

**M1. `scoreboard()` was edited (hunk 5): a change inside a money function.**

- It only reads, and every figure was verified unchanged (recon, audit and identical payload).
- What remains is the risk. `uiKpis()` → `uiSync()` → `uiCols()` now runs inside `render()`, before the rows are drawn. Any future throw there would abort `render()` and blank the board.
- **Fix (one line):** `try{ if(typeof uiKpis==='function') uiKpis(); }catch(e){}`. Keep the hand-over read-only, as it is now.

**M2. Rows overflow at common widths: money columns, and Fund's allocation box, leave the row.**

Base fits at every width from 700 to 1900 in Review, Rank, Fund and Compare. Its only overflow is a pre-existing one in Brief at 1120–1340.

The new build overflows here:

- **Brief:** at 780–1280 and 1400–1740 the Mandatory, Unfunded or Cumulative money columns are cut. At 1050 "MANDATOR…" shows and Unfunded is gone. At 1600 Cumulative is gone.
- **Fund:** at 960–1040 the **allocation input** (the row's one money editor), ★ and ⋯ are cut; ★ and ⋯ are also cut at 780–800, 920–940, 1060–1140 and 1400–1460.
- **Review and Compare:** ⋯ (and ★ at 1120) is cut at 780, 920–960, 1120–1160 and 1400–1420.
- **Rank:** ★ and ⋯ are cut at 960–1020 (Lane too at 960), 1120–1160 and 1400–1440.
- **At 700px:** the page scrolls sideways by 20px in every mode.

Causes, and the fix for each:

- (a) `html.ui-on:not(.ui-rail) .gridsplit{… clamp(360px,26vw,600px)}` (0,3,1) outranks base's `html[data-mode="brief"] .gridsplit{minmax(0,1fr)}` (0,2,1). At 1400–1760, Brief therefore gets an empty phantom panel column. **Fix:** add `:not([data-mode="brief"])`.
- (b) The new `@media (max-width:1760px)` Brief `--rowcols` (9 tracks, 0,3,1) outranks base's narrower Brief lists: 8 tracks at ≤1100 and ≤940, 3 tracks at ≤760. **Fix:** limit it to `(min-width:1101px)`.
- (c) Between 901 and 1399px nothing budgets for the 232px sidebar. At 1400–1460 the narrowed tracks are still too wide beside the docked panel. **Fix:** either fall back to the 64px rail below about 1400px (as is already done at ≤900), or size the tracks for that range.

Then run `tools/layout-fits.mjs`. Its J check, "holds every width, 761 to 1023", is the guard for exactly this.

### Should-fix

**S1. The docked RECORD panel was narrowed from `clamp(420px,30vw,600px)` to `clamp(360px,26vw,600px)` (1400–1760, sidebar open).**

- At 1440 it is 374px against 432px in base. That clips the per-service money inputs ("23,000,00…", visible in the builder's own screenshots 1 and 4) and the TOTAL "$34,000,000".
- Base at 1440, and both builds at 1280, clip nothing.
- **Fix:** keep the base clamp and narrow the grid tracks instead, or collapse to the rail.

**S2. Brief (the presentation view) no longer shows the posture strip.**

- `html.ui-on:not([data-mode="fund"]) #posture{display:none}` hides Mission critical (must-pay unfunded), Unfunded by service, the funded total and Needs attention.
- Base Brief shows these enlarged (`html[data-mode="brief"] .pp .v{font-size:22px}`).
- The KPI cards carry four of those figures; Mission critical is not among them.
- **Fix:** also keep `#posture` visible in Brief, or put this to Brad. The builder's write-up mentions only Needs attention and Funding detail.

**S3. Add requirement (and Import) show in every mode, Brief included.**

- In Brief the task bar says "Presentation view — requirements can't be edited here", while the new toolbar right below offers "+ Add requirement".
- Base offers Add only in Review (`#toolAdd` lives in `#t_review`, and the folded menu is `review:I.add+I.mat`).
- Data is safe either way: `save()` refuses under `CYCVIEW`.
- **Fix:** show `#uiAddBtn` in Review only, matching base. Consider hiding Import in Brief.

**S4. The Import box offers PMO Import inside a PMO copy (`SANDBOX`).**

- File ▾ deliberately leaves out the Program offices group there (`_SB? '' : grp(…'offices'…)`).
- This is not a new data path: `stateFile` → `importState` → `pmoTake` → `subOpenReview` is already reachable in a PMO copy through Import one appropriation.
- The new surface still contradicts the menu. **Fix:** hide or disable the PMO card when `SANDBOX`.

**S5. Brad's item 4 ("Use Recommended") is not implemented.**

- Missing: a lifecycle field in place of Status, and Last change. The builder disclosed this; it is still open against the request.

### Minor

- **Header labels.** `html.ui-on .hdr .ctx .tlbl{display:inline}` (0,4,1) beats `.hdr.tight1 .ctx .tlbl{display:none}` (0,4,0) and the ≤1100 rule. `fitTop()` can no longer drop the labels to fit, so the header wraps.
- **Cycle button.** "Working plan ▾" carries a dropdown caret but goes to Cycles & compare; it is not a selector.
- **File order in "All submissions at once".** Files go to `importState` in pick order, but FileReader completion order is not guaranteed. With two files from the same office, the later-finishing one replaces the other. That is the same rule as loading them one by one, just not under the person's control. A non-submittal `.json` picked here follows `importState`'s normal routes, the same as the single loader.
- **Misleading storage message.** If browser storage refuses `prio27uiRail` or `prio27uiCols`, `lsSet`'s message says "Use 💾 Save to write it into the file". These preferences never go into the file. A plain `try{ localStorage.setItem(…) }catch(e){}` is more honest for a browser-only preference.
- **Editable chip.** It reads "✎ Editable" for someone who does not hold the pen (`WRITER`), so cannot Save in place.
- **Screenshot script path.** `ui-concept/preview-chunk1/shoot-chunk1.mjs` imports `playwright-core` from `/home/user/orbit-board/node_modules`. orbit-ui has its own copy; point it there.
- **Brad's item 6** ("show me the difference"). Docked (shot 1, 1440) and slide-over (shot 5, 1280) both exist, but CHUNK1.md does not put them side by side with an explanation.
- **Pre-existing, not introduced.** The posture strip's Unfunded by service still prints compact `$75.0M` (`fMc`). Everything new is whole dollars.
