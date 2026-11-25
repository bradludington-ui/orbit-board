# v2.23: the contract between the three builders (items 156, 158, 159)

Brad, 25 Nov 2026: *"Go on v2.23"*, after v2.22 merged (PR #81), with his answers to the four questions left open
(`NEXT-VERSION.md` › Open › items 158 and 159, under **Answered**): FY27, the year before the base, **editable**; **four lines
per service**; Fill across **never** offers Disc/Mand; Present is **the same screen, switched**; mock-up B's **move panel joins
One lane** as an aside. Earlier, on the v2.22 canvas: the requirement page **keeps the RECORD card** (a row click still opens
the quick record; *Open full page* goes to the page); **Rank by band is view only** (a band is still changed only in the RECORD
panel).

Read whole before starting: `CLAUDE.md` (v2.06, v2.09, v2.13–v2.22 above all; "The row is triage"; the funding model),
`AGENTS.md`, `NEXT-VERSION.md` › Open › items 156, 158 and 159 word for word. The pictures are in `recovery/v223/concept/`
(`156-Record`, `156-Rank`, `156-FYDP`; `158-*`; `159-*`), each with its mock-up source (`*.dc.html`). **The pictures are the
target; their figures are invented; where a picture and this file disagree, this file decides** (`156-Rank` shows a drag to
reclassify: it is view only).

**This file decides.** Where it leaves a choice open, the builder decides, writes it under **Decided in the build** in its notes,
and the ship notes say Brad can reverse it. A choice that moves a figure, or takes a control or an action away, is not the
builder's: stop, write the question in the notes, and build the rest.

Base: the slot commit (the commit that adds this file). Each builder works in its own worktree on its own branch from it.
Nobody bumps `BUILD`, pushes, merges, or edits another workstream's slot or the functions it owns (§2).

## 0. The rules every builder keeps

- **Data loss and math are the can't-fails.** Every figure a new surface prints is one the board already works out (`tiers()`,
  `svcAlloc`, `basisSvcOf`, `unfSvcOf`/`unfTotOf`, `discUnfSvcOf`, `mcCalc`, `tierTotals`, `fydpData`/`fydpBookModel`,
  `landSvc`/`awdSplitOf`, `cutlinesOf`, `laneOf`); it reads them, never recomputes them. The one rule this version adds to the
  engine is W3's (§1.3, mandatory off), stated as a RULE and checked.
- **Every write goes through the setter that writes that field today** (`applyAskVec`/`setAsk`, `setFsrcSvc`/`seedSplit`,
  `reqCreate`, `pmoYearStart`), so the journal, the clamp, the whole-dollar rule and the PMO-copy and locked-view refusals hold.
  A write into a year not on screen runs inside `aceWithYear(y, fn)` the way `pmoEachYear` does, and the year on screen is put
  back (`applyState(MS.years[MS.cur])`). A held draft (W3's sheet) writes nothing until Save, then writes through the setters
  and calls `save()` once.
- **Years are joined by the WORK, never by the id** (v2.16: `fydpLineKeys` / `fydpSameIn`; an added requirement's id is its own
  year's number).
- **A PMO copy:** the allocation is locked (`allocLocked()`); the requirement values are an office's to edit. **A locked view:**
  read only (`cycBlock`). Both as today.
- One self-contained file, `file://`, no dependency, no network, the CSP unchanged; no icons on left-menu items (v2.05); a box is
  a `body > .modal-bg` with an `<h3>` and a close control; a click handler only on a native control; `esc()` for text into HTML,
  `jsa()` for a value into a handler; storage writes through `lsSet`/`lsAll` (a key starting `prio27` or `spmt`); a menu path
  names its group; **no second home for an action** (`npm run leftmenu`).
- **Section 508 as today:** `npm run standards` reports nothing new. Colour is never alone (APEX's status colours keep their words).
- **No control loses its call.** `npm run controls` (`tools/row-controls.json`) changes only where an item says so, re-recorded
  with `--record` and the reason in the notes.
- **A check that cannot fail is not a check.** Each new check fails on the slot commit unless labelled CONTROL; a check that
  defends a rule, an order or a choice has a fixture where the alternatives disagree (a requirement in a year not on screen; a
  lane that cannot pay what was typed; an added requirement whose id differs across years; mandatory money on a requirement the
  lane walk funds by itself). jsdom has no layout and fires no per-keystroke `change`: width, fit, pointer and keyboard go in a
  browser check.
- **Mutations are text only** (`tools/export-audit/mutate.mjs`; never import it, never `npm run mutate` or `validate:math`).
  Each new mutation and retarget is proved against its own check with `recovery/v208/bin/prove.py` on the builder's finished
  board. After the last change `python3 -I -B recovery/v200/bin/mcount.py tools/export-audit/mutate.mjs
  prioritization-board-grid.html` reports every target matching once. Ids are single-quoted.
- **Run every suite whole once on the finished board**, and every browser check (`look`, `palette`, `record`, `keys`,
  `dropdowns`, `dialogs`, `leftmenu`, `menus`, `panels`, `toolbar`, `editors`, `pointer`, `layout` (its D ×8 is carried),
  `controls`, `standards`, `colours`, `pmosave`, `pmoyears`). A change of wording is a change to every suite and tool that
  quotes it: grep `tools/` for the old words first.
- **Resources: three builders share one 15 GB, 4-core container.** Every whole suite, every `prove.py` run and every browser
  check goes through `recovery/v223/bin/heavy.sh` (two at a time, machine-wide); `prove.py` with `JOBS=1` under it. An exit 137
  is the container: run it again. `git fetch --unshallow` once if a suite reads old builds from git.
- Never commit a populated board. Never push. Commit on your branch; report the SHA.

## 1. Who builds what

| | Scope | Slots | Mutation ids |
|---|---|---|---|
| **W1** | item 156: **the requirement page** (shell, Overview, Funding by service, Awards, History), **Rank by band**, **the five-year chart** | `v2.23 W1`, `<style id="v223w1">` | `v223-w1-*` |
| **W2** | item 158: **Across the FYDP** (the page's fourth tab), Add to a year, Fill across, the RECORD card's year strip | `v2.23 W2`, `<style id="v223w2">` | `v223-w2-*` |
| **W3** | item 159: **the allocation view** (Sheet, One lane, the move aside, Present), **mandatory on or off per year** | `v2.23 W3`, `<style id="v223w3">` | `v223-w3-*` |

**The seams are in the slot commit** (`// ==== v2.23 seams ====`, before the W1 slot): `V223_AFTER` and `v223After()` (called by
the render wrapper after the rows and the RECORD panel are drawn: push a drawing function from your slot); `mandOn(St)` (W3's;
`true` until W3 builds it; **every surface that prints a mandatory figure for a year asks it**); `REQPG_TABS` (W1's tab
registry, `{k, label, order, html(id), after(id)}`); `reqPageOpen(id, k)` (W1's; replace its body in place). The containers
`#reqPage` (W1, W2's tab inside it) and `#allocView` (W3) sit before `.gridsplit`, `hidden`.

Every new suite block's name starts `v2.23 Wn — ` and sits in that builder's slot (audit-board, -other, -import, -inject, -recon);
new board code in the board's `// ==== v2.23 Wn ====` slot (edits to an owned function stay in place); new CSS in that builder's
`<style id="v223wn">`. Each builder writes `recovery/v223/notes-Wn.md` (What was built · Decided in the build · Questions for Brad ·
Checks — each new check "fails on the slot commit", or CONTROL; each existing check changed on purpose with its `// v2.23 Wn:`
comment · Mutations — new, retargeted, retired, with proofs · For the integration · npm script to add · Known gaps),
`recovery/v223/proofs-Wn.json` and `proved-Wn.jsonl` (`git add -f`), and screenshots of its screens at 1440 and 1024 (and 1920
for W3's Present) in Harbor in `recovery/v223/shots-Wn/`.

### 1.1 W1 — item 156: the requirement page, Rank by band, the five-year chart

- **The requirement page** (`156-Record`): `reqPageOpen(id, k)` shows `#reqPage` in place of the tiles, money bar, table and
  RECORD card (a class on `<html>`, e.g. `ui-reqpage`; the left menu, header and context bar stay), for requirement `id` of the
  year on screen, at tab `k` (Overview when left out). State is the session's (`REQPG = {id, k}`), never saved; a reload opens the
  list. **‹ Back to Requirements** (and Esc when no box is open) closes it and puts the keyboard and the selection back on that
  row. **Previous / Next** by rank (the list as shown, `gridIds()`; the rank number on each). Header: rank of N · office · FY and
  appropriation, the title, chips (lane status in APEX's words and colours, CCaR, PID, Prime/OGC and MIPR, band), **★ Mark
  Mission Critical** (the same `toggleMC` call) and **Edit record** (`openEdit(id)`). A requirement the year does not hold (the
  year switched, it was removed) says so with Back; a locked view is read only with the view's line; a PMO copy as the RECORD card
  allows.
- **Tabs** (buttons with `aria-pressed`, or real tabs with arrow keys — not a half of each): **Overview** (10), **Funding by
  service** (20), **Awards** (30), W2's **Across the FYDP** (40, item 158 replaces the concept's *Five years*), **History · N**
  (50). Draw them from `REQPG_TABS` by `order`; a tab whose `html` throws shows its own failure, not a blank page.
  - **Overview:** the four figures (Requirement, Discretionary, Mandatory, Unfunded — `tiers()` and `unfTotOf`; Mandatory
    hidden where `!mandOn()`); **When the money obligates**: a month-by-month chart Oct–Sep plus Unscheduled from the award block's
    own rule (`landSvc` through `awdSplitOf`), discretionary and mandatory stacked, its figures as text beside it (no colour
    alone), and the one sentence of what is scheduled and unscheduled; the impact statement (or the "not written" box with
    **Write impact statement** → `openEdit(id, 'cons')`); the record fields (plan event, obligation category, cost element, WBS,
    Goes to, RCN / EEIC, BAE budget) with what is missing flagged by `reqNeeds()`; **Recent changes** from the journal
    (`jrnlFor(id)`'s entries, this year's, newest first, five, with who and when, and "all N" to the History tab).
  - **Funding by service:** per service Requirement, Discretionary, Mandatory, Unfunded, and the `drewLine` reading where a
    directed figure is not drawn; read only here, with **Edit in the RECORD card** (the one-year editor stays the RECORD card;
    the multi-year editor is W2's tab). Mandatory hidden where `!mandOn()`.
  - **Awards:** each award as a block (date, dollars by service, its split into discretionary and mandatory from `awdSplitOf`),
    Unscheduled, and **Edit awards** to the RECORD card's award block (the editor stays there).
  - **History:** every journal entry for this requirement in this year (`jrnlFor`), with the field named (`jrnlFieldName`), was
    → now, who and when; Put back stays in the change journal.
- **The way in:** the RECORD card gains **Open full page** (`reqPageOpen(id)`); W1 does not edit `inspectorBody` (W3's): write
  the button and where it goes under **For the integration**, and drive `reqPageOpen` directly in your checks. Ctrl K's
  requirement results gain nothing (W2 of v2.22 owns the palette; leave it).
- **Rank by band** (`156-Rank`, view only): in Rank mode a **List / Board by band** switch (`aria-pressed`; this browser's,
  `spmtRankView`, never in the board). Board: a column per decision band in `BANDS_LIST()` order and **No band yet** last, each
  with its count and requirement total; cards in priority order: rank, title, requirement, office, the lane status pill, ★; the
  cutline sentences from `cutlinesOf` **in the band they fall in**, above the first card past them. A card is a button that
  selects the requirement and opens the RECORD card (`setCur`). **Nothing on the board changes a band or the order** (no drag, no
  ⠿); its line says so and points at the RECORD panel's Decision band. The list's filters and search apply. Draw it into its own
  container from `V223_AFTER` (W1 may add one inside `#uiPage`'s flow via its CSS, or use `#list`'s place with the list hidden):
  do not edit `render()`.
- **The five-year chart** (`156-FYDP`): in the five-year spend plan panel (`fydpBody`, W1's), above today's table, from
  `fydpBookModel` (the one model the panel and the workbook share): **Requirement against funded, by year** (bars, the gap
  printed in figures above each year, legend with words), and **By appropriation · funded of requirement** (a cell per
  appropriation per year with "$F / $R" and a meter; the FYDP total; a year not held prints —, never 0). The workbook is
  unchanged (a check proves it byte for byte against the slot commit's).

### 1.2 W2 — item 158: one requirement across the FYDP, by service

- **The tab** (`158-requirement-across-fydp`): registered in `REQPG_TABS` as `{k:'fydp', label:'Across the FYDP', order:40}`.
  Test its `html(id)` directly into a container in your worktree (W1's page is not there); the integration drives it on the page.
- **The years:** from the year before the base to base + 4 (base = the board's base year; with base FY28: FY27–FY32), each
  **editable** (Brad), plus the **FYDP total** (base to base + 4). The requirement in each year is found by the work
  (`fydpSameIn` / `fydpLineKeys`), never the id. Each year's heading carries that year's rank and lane status, read only.
- **One block per service, all four lines** (Brad): Requirement, Discretionary, Mandatory, Unfunded. Requirement, Discretionary
  and Mandatory are boxes; Unfunded is read. A figure typed into any year is written into **that year's plan** by the setter
  that writes it there (`applyAskVec` for the requirement; `setFsrcSvc` for a directed figure, which seeds the split), inside
  `aceWithYear`; nothing switches the year on screen; one `save()` per commit; the journal records the line with its year (prove
  it: a Put back of a line written into FY30 from FY28 puts back FY30's figure). Where a lane cannot pay what was typed, the box
  keeps the typed figure and the `drewLine` reading says what it drew. Mandatory line hidden for a year where
  `!mandOn(that year's state)`.
- **A five-year chart** above the grid: per year the requirement, funded green, unfunded red, its figures as text.
- **A year the requirement is not in:** **Add to FY32…** (`158-add-to-year`): a box; a new requirement in that year through
  `reqCreate`, linked to the nearest year's as the same work (`prior`, v2.06), starting from its requirement by service (an
  optional growth %, whole dollars per service), office, CCaR, PID and record fields; **not** carried: Disc/Mand, the star,
  award dates; last in that year's priority order. In a PMO copy as `reqCreate` allows there.
- **A year nobody has started:** asked once — roll forward or start blank — through `pmoYearStart`, as v2.09's five-year
  submittals ask; Cancel starts nothing.
- **Fill across…** (`158-fill-across`): the requirement from one year into the later years held, copied or grown N% a year,
  previewed as was → becomes per service and year; **requirement only, never Disc/Mand** (Brad); whole dollars per service; a year
  without the requirement is listed as not filled, with Add to its year.
- **The RECORD card** keeps its one-year view; its other-years line (`recYearsOf`, `recYearsFill`, W2's) becomes a **year strip**
  (each year's requirement and lane status, the year on screen marked) and **Manage across the FYDP** → `reqPageOpen(id, 'fydp')`.
- **A PMO copy:** requirement values only (the Disc/Mand boxes read only, `allocLocked`); **a locked view:** read only.

### 1.3 W3 — item 159: allocate every requirement in one year; mandatory on or off

- **The allocation view:** a workspace mode `alloc` (`UI_MODES`, `uiSetMode`), reached from the left menu's Views as
  **Allocate** (between Funding and FYDP; `uiGo('alloc')`, one home, `npm run leftmenu`'s map updated), shown in `#allocView` in
  place of the table (the tiles and money bar may stay). A **Sheet / One lane** switch over the same data; an **Edit / Present**
  switch (Present: read only, larger type, sized for a projector at 1920).
- **The draft:** both views hold the changes until **Save**: a changed cell outlined, a count of changes, **Review changes**
  (a list: requirement, service, lane, was → now), **Save** writes every change through `setFsrcSvc` (each requirement seeded by
  it the first time, as typing in the RECORD card does) and calls `save()` once; **Discard**. A lane given more than its budget
  authority holds is shown in red and **not refused**; Save says so first. Leaving the view, switching year or appropriation, or
  closing the page with a draft asks first. A figure is whole dollars (`parseAmt`/`amtRead`; a refusal keeps the typing and says
  why). Nothing writes while drawing.
- **The Sheet** (`159-sheet-mandatory-on`, A2): every requirement in priority order (the list's filters apply; the pinned lines
  are the whole board's and say so when the list is narrowed); per service the **requirement** (the goal, shaded; underlined green
  where that service's need is met, red where short), Discretionary and Mandatory boxes; per row total requirement, funded,
  unfunded, funded %; pinned lines Requirement, Budget authority, Allocated (with the share of the requirement met), Left in the
  lane, Still unfunded; goal tiles Requirement, Funded, Unfunded, Budget authority, Left to give. Arrow keys move between boxes;
  **paste from Excel** (tab- and line-separated) fills from the box pasted into, refusing a cell that is not a figure by name.
- **One lane** (`159-one-service`, C2): service tabs with "asked, % met"; the service's requirement as the goal with a bar of
  discretionary, mandatory and unfunded and a line at all that service's budget authority; per requirement its requirement for
  that service, Disc and Mand boxes, a Met bar, Unfunded, **Left after** counting the lane down row by row in priority order; the
  cutline where the lane is gone; select rows to **fund to the requirement**, **cut by %**, or **set to $0**; **Full** and **$0**
  per row; a pinned total line; and **the move aside** (Brad): take an amount from one requirement's lane, give it to another's,
  in this service, into the draft.
- **Mandatory on or off, per year** (`159-sheet-mandatory-off`, `159-mandatory-off-box`): `S.mandOff` on the year's state
  (saved in the board, travelling in every file and copy as a year's field does; the round-trip fuzz fills it); `mandOn(St)`
  reads it. **The RULE:** in a year with mandatory off, `tiers()` draws no mandatory (every mandatory lane empty for that year,
  as `{noMand:true}` does) — stated in a comment at the line, asserted in audit-board under a `RULE` label, and distinct from the
  ◨ discretionary-only what-if (`scenView`), which is a view and saves nothing. **The switch** in the view's header (and wherever
  W3 judges it belongs once — one home): turning it off in a year whose lane walk draws no mandatory asks nothing; in one that
  does, a box lists what is there (the requirements, mandatory drawn, unfunded after) and offers **Clear them** (each directed
  mandatory dollar to $0 through `setFsrcSvc`, journalled, each can be put back) or **Move what discretionary can cover** (to
  each requirement's discretionary lane where its service has room, walking the priority order; the rest cleared), for **this
  year only** or **this year and every later year held**; Cancel changes nothing. Mandatory budget authority stays in Budget
  Management and the PPBE position. On again brings the columns back, empty. **Hidden where off:** both views, the RECORD card's
  Mand box (`inspectorBody`'s split table), the Funding page's tiles (`scoreboard`), the Requirements tiles (`uiKpis`), the money
  bar's yellow, Fund mode's Mand column; W1's and W2's surfaces ask `mandOn` themselves. **Exports keep their Mandatory columns
  ($0)**, so every year's files keep one layout. In a PMO copy the switch is refused; in a locked view, read only. Decide (and
  note) whether a year rolled forward carries its source's setting.
- **A PMO copy:** the view is read only (`allocLocked`), and says so. **A locked view:** read only.

## 2. Who owns which function (no builder edits another's)

- **W1:** `reqPageOpen` and everything `reqPage*`, `REQPG` state, the four tabs it registers, the Rank board and its switch,
  `fydpBody` (the chart part; the workbook functions unchanged), `#reqPage`'s markup.
- **W2:** the Across the FYDP tab and everything it calls, Add to a year, Fill across, `recYearsOf`, `recYearsFill`.
- **W3:** `UI_MODES`, `uiGo`, `uiSetMode`, the left menu's Views markup, the allocation view, `mandOn`, the mandatory-off line
  in `tiers()`, the switch and its box, and **for hiding mandatory only**: `inspectorBody`'s split table, `scoreboard`, `uiKpis`,
  `moneyBarHtml`, `render()`'s Fund-mode Mand cell.
- A function two builders must change: the one that does not own it writes the change under **For the integration** and the
  lead makes it (W1's **Open full page** button in `inspectorBody` is the known one).

## 3. Integration (the lead)

Merge W1, W2, W3 in that order; fix what the merge shows (`v2.23 integration` slots, `v223-int-*`); add W1's Open full page;
prove the retarget the slot commit made (`v209-rv2-clin-restore-before-panel`, aimed through the new render hook); mcount; every
suite whole; every browser check; prove every v2.23 mutation and retarget together on the merged board; review with skeptics;
fix; bump `BUILD` once; the ship notes (`CLAUDE.md`, `NEXT-VERSION.md` › Shipped › v2.23); push; a draft PR. Merge on Brad's word.
