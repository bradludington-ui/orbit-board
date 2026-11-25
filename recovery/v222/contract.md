# v2.22: the contract between the three builders (item 155, the new look; items 154 and 149.18–149.53 folded in)

Brad, 25 Nov 2026, on the concept canvas (https://claude.ai/artifact/72NE2hE19eSaH3rFcjEygq, screens *Requirements, modernized*,
*Funding, modernized*, *Ctrl K search and commands*): *"I like it all ... Let's go"*, and his answers: three versions (v2.22 =
item 155 with items 154 and 149.18–149.53 folded in; v2.23 = item 156; v2.24 = item 157), the RECORD card stays with an
*Open full page* (v2.23), Rank by band view only (v2.23). **Items 156 and 157 are not built here.**

Read whole before starting: `CLAUDE.md` (v2.13–v2.21 above all, and "The row is triage"), `AGENTS.md`, `NEXT-VERSION.md` ›
Open › items 155, 154 and 149 (149.18–149.53 word for word, with every **Answer** under them: those are Brad's decisions).
The pictures of the concept are `recovery/v222/concept/Main.png`, `Funding.png` and `Search.png`, with the mock-up source
beside each (`*.dc.html`). **The pictures are the target look; the figures in them are invented.**

**This file decides.** Where it leaves a choice open, the builder decides, writes it under **Decided in the build** in its notes,
and the ship notes say Brad can reverse it. A choice that moves a figure, or takes a control or an action away, is not the
builder's: stop, write the question in the notes, and build the rest.

Base: the slot commit (the commit that adds this file). Each builder works in its own worktree on its own branch from it.
Nobody bumps `BUILD`, pushes, merges, or edits another workstream's slot or the functions it owns (§2).

## 0. The rules every builder keeps

- **Data loss and math are the can't-fails.** No figure moves. Every figure the new look prints is one the board already works
  out (`tiers()`, `unfSvcOf`/`unfTotOf`, `discUnfSvcOf`, `mcCalc`, `mcShortSvcOf`, `tierTotals`, `attLists`, the posture
  `scoreboard()` prints, `fitModel`); a new surface reads them, never recomputes them. The words: **Requirement, Funded,
  Unfunded** on the Requirements and Funding pages (149.41); "beyond both lanes" stays its own name where it is printed.
- One self-contained file, `file://`, no dependency, no network, the CSP unchanged, no icons on left-menu items (v2.05).
- Every rule in `AGENTS.md` › Do not: storage writes through `lsSet`/`lsAll`; a PMO copy and a locked view refuse writes as
  today; a box is a `body > .modal-bg` with an `<h3>` and a close control (`npm run check`); a click handler only on a native
  control; `esc()` for text into HTML, `jsa()` for a value into a handler; a menu path names its group; **no second home for
  an action** (the Ctrl K palette is a search over the left menu and runs the left-menu item itself, §1.2).
- **Section 508 as today:** `npm run standards` reports nothing new (1.4.3 text 4.5:1, 1.4.11 control edges 3:1, 2.5.8 24×24,
  2.1.1 keyboard, 1.4.10 reflow at 320px). APEX's status colours keep their words; colour is never alone.
- **No control loses its call.** `npm run controls` (`tools/row-controls.json`) may change only where an item says so, re-recorded
  with `--record` and the reason in the notes. `npm run leftmenu` keeps every call reached from the left menu exactly once.
- **A check that cannot fail is not a check.** Each new check fails on the slot commit unless labelled CONTROL; a check that
  defends a rule, an order or a choice has a fixture where the alternatives disagree. jsdom has no layout: what is about width,
  fit or a pointer goes in a browser check (`tools/layout-fits.mjs`, `keyboard-reach.mjs`, `pointer-edit.mjs` or a new one),
  and Chromium fires `change` where jsdom does not (CLAUDE.md, v2.08).
- **Mutations are text only** (`tools/export-audit/mutate.mjs`; never import it, never `npm run mutate` or `validate:math`).
  Each new mutation and each retarget is proved against its own check with `recovery/v208/bin/prove.py` on the builder's own
  finished board. After the last change `python3 -I -B recovery/v200/bin/mcount.py tools/export-audit/mutate.mjs
  prioritization-board-grid.html` reports every target matching once. **v2.21's `v221-152-*` mutations and the v2.21 jsdom
  block aim at the lane cell, the band and the CUI lines:** W1 owns them and retargets what it rewrites, with proof.
- **Run every suite whole once on the finished board**, and every browser check (`keys`, `dropdowns`, `dialogs`, `leftmenu`,
  `menus`, `panels`, `toolbar`, `editors`, `pointer`, `layout`, `controls`, `standards`, `colours`, `pmosave`). A change of
  wording is a change to every suite and tool that quotes it: grep `tools/` for the old words first.
- **Resources: three builders share one 15 GB, 4-core container.** Every whole suite, every `prove.py` run and every browser
  check goes through `recovery/v222/bin/heavy.sh` (two at a time, machine-wide); `prove.py` with `JOBS=1` under it. An exit 137
  is the container: run it again. Never two proof runs in one worktree at once. `git fetch --unshallow` once if a suite reads
  old builds from git. audit-board, audit-import and audit-recon need the 6 GB heap `heavy.sh` gives.
- Never commit a populated board. Never push. Commit on your branch; report the SHA.

## 1. Who builds what

| | Scope | Slots | Mutation ids |
|---|---|---|---|
| **W1** | the page and the Funding page: header layout, menu groups, heading line, tiles, **the money bar**, the rows, Funding (154) | `v2.22 W1`, `<style id="v222w1">` | `v222-w1-*` |
| **W2** | **Ctrl K**, the list's search and Filter, the empty program, new years, the Add box | `v2.22 W2`, `<style id="v222w2">` | `v222-w2-*` |
| **W3** | **the RECORD card** and the edit box | `v2.22 W3`, `<style id="v222w3">` | `v222-w3-*` |

Every new suite block's name starts `v2.22 Wn — `, sits in that builder's slot (audit-board, -other, -import, -inject, -recon all
have one), new board code goes in the board's `// ==== v2.22 Wn ====` slot at the end of the main script where it can (edits to
an owned function stay in place), and new CSS goes in that builder's `<style id="v222wn">` (it loads after `uiApexCss`, so it
wins at equal specificity). Each builder writes `recovery/v222/notes-Wn.md` (What was built · Decided in the build · Checks —
each new check "fails on the slot commit", or CONTROL; each existing check changed on purpose with its `// v2.22 Wn:` comment ·
Mutations — new, retargeted, retired, with proofs · For the integration · npm script to add · Known gaps),
`recovery/v222/proofs-Wn.json` and `proved-Wn.jsonl` (`git add -f`: `*.json` is ignored), and a screenshot of its screens at
1440 and 1024 in Harbor (`npm run shoot` or its own Playwright) in `recovery/v222/shots-Wn/`.

### 1.1 W1 — the page and the Funding page
- **The header** (the concept's top bar): ORBIT, a **find box** that opens W2's palette (W2 owns the box and its behaviour; W1
  places a `<button id="cmdOpen">` styled as a search box reading "Find or run anything" with a Ctrl K tag), the four pickers
  (`#appnSel`, `#b_fy`, `#b_cyc`, `#b_pmo`) as pills, the message strip, the save group and Help as v2.21 has them. `fitTop()`'s
  steps still hold it to one line at every width above 760 (layout S, toolbar-fits); the find box takes a step of its own
  (a 36px icon button) before any wrap.
- **The left menu** keeps every entry and call; its groups read **PLAN** (Requirements … Brief) and **BOARD** (Reports &
  exports … Setup) as headings, as the concept shows.
- **The heading line (149.36, 149.52, 149.35):** "Requirements" and one line saying what the page shows that the pickers cannot:
  "Showing 8 of 36 requirements" (all of them: "36 requirements"); the mode as a segmented control (Review, Rank, Fund, Compare;
  Brief stays where it is today); **one** Add requirement in the main-button look (the second goes); the four tiles marked
  "whole board" when the list is narrowed.
- **Tiles (149.39 and the concept):** Total requirement, Discretionary, Mandatory, Unfunded, each with a meter of what is used
  (discretionary and mandatory: drawn of BA; unfunded: of the requirement) and the line under it; no round marks; the Editable
  chip only when the board is not editable.
- **Where the money runs out** (new, under the tiles): one bar across the WHOLE board in priority order (never the filtered
  list; it says so), one block per requirement sized by its requirement value: **red** where `unfTotOf(it)>0`, else **green**
  where `laneOf` is disc, **yellow** for both lanes or mandatory; a run of one colour carries its words and range ("Discretionary
  #1–6"); beneath it the cutline sentences, read from the **one** function the row cutlines (the bands between rows) also read —
  W1 factors that computation out of `render()` so the bar and the bands cannot disagree. Each block is a button (its name and
  figures as its accessible name) that selects that requirement. Hidden in Brief and below 760px.
- **Rows (the concept's table; "The row is triage" holds):** Review columns: rank · office chip · requirement (name and ONE quiet
  line) · band · Requirement · **Funded** (figure and a meter of funded/requirement) · **status pill** (the lane word in APEX's
  colours; "unfunded $X" under it when not zero, 149.45) · ★ · ⋯. Cumulative leaves Review and stays in Rank (and in Columns).
  Fund and Rank keep today's columns, restyled. The table carries a title band and **filter chips** (All lanes, ★ Mission
  Critical, Needs attention N, Incomplete N) that set the filters the Filter menu already sets (`laneFilter`, `mcOnly`, …); a
  filter set either way shows on both. The row's second line: 149.37 (record name only when it adds words; no old name, no
  pencil), 149.38 ("continues FY27" or "new" for ADDED; no gear), 149.44 ("5 to complete" from `reqNeeds`, the count beside
  the tiles, the Incomplete chip), 149.51 (the hand over rows), 149.28 ("needs repair" for a damaged award date on the row),
  149.9 stays (the hover is the record's Unfunded). The lane hover and every figure keep their reading.
- **Columns (149.28):** below the width where a column cannot show, its tick box is greyed and says why.
- **The Funding page (item 154 and the concept):** the four tiles (Discretionary BA with drawn and left; Mandatory the same;
  ★ Mission Critical with unfunded of the must-pay total; Whole budget unfunded of asked, funded), **Unfunded by service** as
  a bar chart (per service, never netted; the figures the posture prints today), **Needs attention** as buttons with counts that
  open the same lists (`attShow`), and one bar of discretionary, mandatory and unfunded against the requirement. Funding
  detail ▾ stays. **149.46:** a Needs attention button on the Requirements page too (a second way into the same lists, as
  Brad answered).
- W1 owns the v2.21 jsdom block and the `v221-152-*` mutations it rewrites (the lane cell becomes a pill).

### 1.2 W2 — Ctrl K, search, Filter, empty program, new years, the Add box
- **The palette** (`#cmdPanel`, a `body > .modal-bg`, the concept's *Ctrl K search and commands*): opened by Ctrl K (and ⌘K),
  by W1's `#cmdOpen`, and closed by Esc. One input; results in groups: **Requirements** (title, event, CCaR, PID, record name,
  note, rank number; each row with its rank, office, value and status pill; Enter selects the requirement, scrolls to it and
  opens its RECORD), **CCaR records** (when a CCaR records list is loaded), **Actions** (every left-menu item, by its own words
  and group: read from the lists `syncBtns()` writes; Enter clicks **that item**, so the call runs from its one home and
  `npm run leftmenu` is unchanged). `>` first lists actions only. Arrow keys move, Enter opens, the keyboard stays in the box,
  focus returns where it was. Nothing it runs can do what its menu item could not (a PMO copy, a locked view as today).
- **The list's search box (149.25):** a clear button; Esc clears; it reads the record name, the note and the rank number too; a
  search that matches nothing says "No requirements match" with a way to clear; while a search is on and the box has scrolled
  away, the title band says so. W2 owns the predicate: factor it out of `render()` into one function in W2's slot that
  `render()` calls (W1 edits the rest of `render()`; the line that calls the predicate is W2's).
- **Filter (149.26):** the Funding group open the first time; the stray divider gone.
- **The empty program (149.29):** one **Start here** block: open your saved board, connect the shared folder, start a new board;
  the shared-folder banner and the cut-off message folded into it.
- **New years (149.30, with Brad's 21 Nov answer):** a blank year's first offer opens Add requirement › From another year; the
  Removed list says what Restore does not bring; From another year gets a tick-all.
- **The Add box:** 149.22 (**Add and start another**, keeping the office and clearing the form; after Add the list scrolls to
  the new row and the message shows), 149.24 (b) (pre-pick the only budget name, still changeable; the required list unchanged).

### 1.3 W3 — the RECORD card and the edit box
- **The card:** where the window is wide enough to dock (today's docked widths) the RECORD is a card beside the table, the
  concept's look; narrower it slides as today. 149.18 (a click on another row moves the record to it; J and K are real previous /
  next buttons), 149.19 (one pinned bar: position, previous, next, Close; the name on one line under it; a record opened by a
  click starts at the top), 149.20 (a ★ switch in the record, the same `toggleMC` call; the edit box's sentence corrected;
  `row-controls.json` re-recorded for the new record control), 149.21 (Save and next; "Save and go to the value and budgets";
  what is still needed listed by name under the three buttons, each opening the box at its field), 149.23 (Down arrow to the
  same column on the next service), 149.27 (a refused figure's sentence inside the record, cleared when a figure is taken),
  149.28 (the docked first click kept after typing; Tab kept inside the open record; PMO › Reassign names the requirement),
  149.31 (one line in place of the six boxes: Requirement, Funded, Unfunded, and MC shortage only when starred and short),
  149.32 (Lifecycle line gone), 149.33 (the strip's three jumps land and the highlight follows), 149.34 (the budget block: once
  per line, the name whole), 149.24 (c) ("by rule — not picked" where nobody picked), 149.40 (plain words in the edit box),
  149.42, 149.43 (one block per award, stacked; the column headed Date; a repaired award as a sentence), 149.47 (one line of
  obligation category, WBS and Goes to), 149.48 (the prime's CLIN line), 149.49 (read only in a locked view, with Leave the
  view), 149.50 (the requirement's value in each year of the window, each a button to that year — the link rule v2.16 set:
  `fydpSameIn`, never the id).
- `layout-fits` K (every requirement's panel, nothing clipped) and N (the edit box) still pass, docked and sliding.

### 1.4 Everyone: 149.53
Each fix arrives with a check that fails without it, and the checks 149.53 names (the four tiles, the row's MC flag, the lane
hover, the record's Funded box, a date typed with the keyboard) exist when the three are merged.

## 2. Who owns which function (no builder edits another's)

- **W1:** `render()` (all of it but the search predicate's call line), the row template, `fitTop`, `syncSticky`, `uiSync`,
  `uiKpiCard`, `uiCols`, `scoreboard()` and the posture, the left menu's group headings, the cutline computation it factors out,
  the money bar, `#uiPage`'s heading and tools row, `uiApexCss` (W2 and W3 add their own blocks; W1 may move rules out of it).
- **W2:** the palette and its key handler, the search predicate, `#q` and its box, the Filter menu group (`syncBtns`'s view
  group only), `driveBarHtml` and the empty program's block, the Removed list's words, `naFrom*`, `ar*` (the Add box).
- **W3:** `inspectorBody`, `inspSplitFit`, `drawer*`, `setCur`, `gridAfterRender`'s RECORD part, `er*` (the edit box),
  `openEdit`, `awardBlockHtml`, `budRecordHtml`, `priorHtml`, the record's keyboard.
- A function two builders must change: the one that does not own it writes the change under **For the integration** and the
  lead makes it. `syncBtns()` beyond the Filter group is W1's.

## 3. Integration (the lead)

Merge W1, W2, W3 in that order; fix what the merge shows (`v2.22 integration` slots, `v222-int-*`); mcount; every suite whole;
every browser check; prove every v2.22 mutation and retarget together on the merged board; review with skeptics; fix; bump
`BUILD` once; the ship notes (`CLAUDE.md`, `NEXT-VERSION.md` › Shipped › v2.22); push; a draft PR. Merge on Brad's word.
