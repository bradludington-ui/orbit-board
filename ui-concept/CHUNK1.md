# ORBIT v2.00 UI — chunk 1

Branch `claude/v200-ui` (local only, not pushed). Base: `4a6f7c7` (board blob `4d273c06…`).
Board blob after this chunk: **`863f226cc2218e1ff519520d1e044abf3a9c3607`**.

## What was built (presentation only)

All of it is switched on by `html.ui-on`. That class is set by `uiBoot()`, which is the last thing the program runs, well after `SRC0` (the page source a save writes) is taken. A saved board therefore carries none of the runtime changes: the moved search box, the added chips, the classes and the inline column widths. This was checked: `SRC0` still has the search box in the header and an empty toolbar slot.

1. **Navy sidebar** (`#uiSide`). It has the logo, "Portfolio Funding Board", and a ‹ / › control that collapses it to a 64 px icon rail. In the rail each item shows a tooltip on hover and on keyboard focus.
   - Requirements → `uiSetMode('review')`. The task bar keeps a **Review / Rank** switch, so Requirements carries the Review and Rank tools.
   - Funding → `uiSetMode('fund')`. The Fund tools appear, and the funding posture strip shows here.
   - Cycles & compare → `uiSetMode('compare')`. Brief → `uiSetMode('brief')`.
   - FYDP opens a flyout with Five-year spend plan, Spruills, PPBE Budget Positions, Funds Flow, FYDP Spend Plan (Excel) and Reports & exports ▾. Each item runs `mRun(<the menu item's own function>)`.
   - Execution opens a flyout with Active Year Execution, Reprogramming Actions, Spend Plan Forecast, CR Cash Needs, Import CCaR QPE, QPE coverage, ORBIT vs CCaR and Data ▾.
   - Imports opens the Import box.
   - History & recovery opens a flyout with the change journal (`toggleJrnl`), save history (`showLog`) and earlier copies (`toggleLive`, where Live view keeps them). It also lists the three work-kept-aside items (`keptPutBack`, `keptSaveFile`, `keptDiscard`); when nothing is kept aside, a disabled line says so.
   - Setup → `toggleMenu('setup')`.
2. **Context bar.** This is the existing header restyled; its logo moved to the sidebar.
   - Added a **Cycle** button. It reads "Working plan" or "<cycle> (locked)" from `CYCVIEW` and goes to Cycles & compare.
   - Added an **Editable** chip. It reads "🔒 Read only — locked cycle" under `CYCVIEW`, "Presentation view" in Brief, and adds "· PMO copy" under `SANDBOX`.
   - The existing `#saveState` is styled as the file chip.
   - Appropriation, Fiscal year, PMO, Save, Help and File keep their ids and handlers.
3. **Page heading + four KPI cards** (`#uiKpis`):
   - Total Ask, Discretionary (of BA), Mandatory (of BA) and Total UFR, in **whole dollars** via the board's own `fM()`.
   - The figures are the ones `scoreboard()` already works out for the posture strip, handed over in `window.UI_KPI`. Nothing is computed twice.
   - Seeded board: **Ask $383,000,000 = Discretionary $242,000,000 + Mandatory $34,000,000 + UFR $107,000,000**. This matches the posture strip ("Whole budget · $383,000,000 asked"), both in jsdom and in Chromium.
4. **Toolbar.**
   - The search box (`#q`) and the Filter menu (`#m_view`, `#fchips`) are moved here and keep their ids.
   - **Columns** shows or hides PMO, Decision band, Cumulative and Lane. It takes the track out of `--rowcols` and the cell out of every row. It applies only where the row draws its full set of cells, which is windows wider than 1100 px.
   - **Density** offers Comfortable and Compact through the board's existing `uiSetDensity()`.
   - Import opens the Import box. Add requirement calls `toggleAdd()`.
5. **Import box** (`#uiImpPanel`, a `.modal-bg`, so the existing dialog controller gives it Esc, focus trapping and inert handling). It has three cards and a sub-panel for the chosen card, then Cancel / **Continue to review**.
   - Full board → `document.getElementById('fullFile').click()`.
   - One appropriation → `document.getElementById('stateFile').click()`.
   - **PMO Import** → `subOpenReview()`, then one of:
     - **One submission**: `stateFile.click()`, the same as ⬅ Load a submittal file… in the review.
     - **All submissions at once**: a new multi-select `.json` picker, `#uiSubMulti`. Each picked file goes, in order, through `importState({files:[f]})`, which is exactly what that loader does with one file. There is no new merge or apply logic: each submittal lands in the review unticked.
   - **⇊ Import several boards at once…** is still in File ▾, and it is also linked in the box's footer, along with "Data imports ▾".
6. **RECORD panel tabs** (Overview / Funding / History). They are added to every RECORD panel the board draws, through a MutationObserver on `#inspector`; `inspectorBody()` is unchanged.
   - The tabs **scroll to** their part of the record and never hide anything. A field that another control sends the keyboard to (a row chip, Go to it) is therefore always reachable.
   - History links the change journal and save history.
   - The docked / slide-over behaviour is unchanged: docked at 1400 px and wider, a drawer below that. With the sidebar open at 1400–1760 px, the row columns and the docked panel are sized to the room left.

## Unfinished

- **Item 4 (recommended mappings) is not done.** The Overview does not show a lifecycle field in place of a "Status", and there is no "Last change" line. No single per-requirement lifecycle field turned up in the RECORD panel's code, and nothing was found that answers "last change for this requirement" from the journal without new code. The tabs are a restyle that scrolls; they do not split the record.
- **Cycle is a button, not a selector.** It reads the current cycle and goes to Cycles & compare, where the existing cycle tools are. No new cycle-switching logic was added.
- **The funding posture strip shows only in Funding.** The KPI cards replace its four headline figures elsewhere, but its "Needs attention" list and the Funding detail button are reached from Funding only.
- **The header still wraps to two lines while the board's status message is showing.** This is the existing `#shareStat` area. The mockup's one-line bar needs that message moved; that is not done.
- **Colours.** The sidebar is navy. The rest uses the board's own theme tokens (Harbor by default) rather than the mockup's light palette, so every theme keeps working.
- **Columns at 1100 px and narrower.** Below 1100 px the row already drops cells by width, so Columns leaves those windows as they are.
- **Possible test drift.** No audit or layout suite was run (as instructed). Any check that expects the following needs a look:
  - the five mode tabs visible,
  - `#q` / `#m_view` inside `.hdr`,
  - the posture strip visible outside Funding,
  - `body` with no left padding.

## Commits (claude/v200-ui, local only)

- `89384e6` v2.00 UI chunk 1: navy sidebar, context bar, KPI cards, toolbar (Columns, Density), Import box
- `c85d0e3` v2.00 UI chunk 1: RECORD panel Overview / Funding / History tabs; control sizing fixes
- (this commit) screenshots + this note

## Smoke

`tools/export-audit/boot.mjs`, with BOARD unset and run under a timeout:

- **X.errors = []**.
- Storage keys after opening: `["prio27destdb"]`, the same as the base board. Opening writes nothing new.
- `SRC0` has no runtime UI changes in it.
- On the synthetic seed, the KPI cards read `$383,000,000 / $242,000,000 / $34,000,000 / $107,000,000`.
- The Chromium screenshot run had no page errors.

## Existing functions touched

- **`scoreboard()`**: 3 lines added at the end of the posture block. They hand the figures it has just printed (`ask, dUsed, mUsed, u2Amt, dBA, mBA, uN, S.order.length`) to `window.UI_KPI` and call `uiKpis()` if it exists. Nothing in it changed or was removed.
- No other existing function was edited. The diff against `4a6f7c7` is **insertions only**: the CSS block, the sidebar, page and Import markup, and the new `ui*` functions at the end of the program.
- **New functions:** `uiPrefRead, uiPrefWrite, uiBoot, uiPmoLabel, uiCycLabel, uiSync, uiKpis, uiTracks, uiCols, uiColSet, uiPopsClose, uiPopFill, uiPop, uiRailToggle, uiMenuSoon, uiGo, uiFlyItems, uiFlyOpen, uiFlyClose, uiDocClick, uiKey, uiDrawerTabs, uiDTab, uiImpOpen, uiImpClose, uiImpPick, uiImpDraw, uiImpGo, uiSubMany`.
- **Preferences.**
  - `prio27uiRail` (sidebar as a rail) and `prio27uiCols` (hidden columns) are read at opening and written only from the person's own click, through `lsSet`.
  - Density uses the board's existing `spmtDensity` through `uiSetDensity()`.
  - Section changes use the existing `spmtMode` through `uiSetMode()`.

## Screenshots (actual board, synthetic data seeded at runtime only)

`ui-concept/preview-chunk1/` (script: `shoot-chunk1.mjs`, the same seed as `uimock/mock.mjs`):

| File | Size | What it shows |
|---|---|---|
| `1-sidebar-requirements-record.png` | 1440×900 | Sidebar open on Requirements, row 3 selected, RECORD panel docked |
| `2-sidebar-rail.png`, `2b-rail-tooltip.png` | 1440×900 | Collapsed to the rail; tooltip on hover |
| `3-import-pmo.png` | 1440×900 | Import box, PMO Import chosen, One / All sub-choice |
| `4-columns-density.png` | 1440×900 | Decision band and Cumulative hidden, Compact density, Columns menu open |
| `5-drawer-1280.png`, `5b-drawer-1280-funding-tab.png` | 1280×800 | RECORD slide-over drawer with the tabs |
| `6-history-flyout.png` | 1440×900 | History & recovery flyout |

The board file stays an empty template: no synthetic data is committed.
