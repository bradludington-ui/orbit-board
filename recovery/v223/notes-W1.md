# v2.23 W1 — item 156: the requirement page, Rank by band, the five-year chart (contract §1.1)

Branch `v223-w1`, from the slot commit `9f82139`. Everything new in the board is in the `// ==== v2.23 W1 ====` slot and
`<style id="v223w1">`; two edits in place: the seam `reqPageOpen` (its body now calls `reqPgOpen`, the page's opener in the W1 slot)
and `fydpBody` (W1's, one line: the chart above the table, in a `try` that says so if it cannot be drawn). Nothing of `render()`,
`inspectorBody` or any other builder's function was touched.

## What was built

- **The requirement page** (`156-Record`): `reqPageOpen(id, k)` shows `#reqPage` in place of the tiles, the money bar, the table
  and the RECORD card (`html.ui-reqpage`; the left menu, the header and the context bar stay), for requirement `id` of the year on
  screen, at tab `k` (Overview when left out). State is `REQPG = {id, k, fy, mode}`, this session's, never saved: a reload opens the
  list. It is drawn after every render from the `V223_AFTER` hook (`reqPgDraw`), and its markup is replaced only when it changed
  (`REQPG_LAST`), so a redraw that changes nothing leaves the keyboard where it is; a field typed into and not committed keeps its
  typing across a redraw (`reqPgHeld`, the RECORD panel's F2 rule, for W2's boxes).
  - **‹ Back to Requirements** and **Esc** (when no box, menu, popover, flyout or the message has it; a field holding uncommitted
    typing is put back first, as the RECORD panel's Esc does) close it: the list, the requirement selected (quietly), the keyboard
    on its row.
  - **↑ #n / #n ↓**: Previous and Next by the list as shown (`gridIds()`, the RECORD card's own step), each naming the rank of the
    requirement it goes to; the keyboard stays on the button pressed; the selection follows behind the page.
  - **Header**: `#rank of N · office · FY2027 O&M` (the 1–N order as the rows and the cutlines count it), the title (and the CCaR
    record name when it adds words, the row's rule), chips: the lane in APEX's words and colours (`laneOf`, `laneWord`), CCaR, PID,
    Prime contract / OGC and the MIPR type, the band with its swatch. **★ Mark Mission Critical** is the row's own call, character
    for character (`S.mc[id]=!S.mc[id];save();render()`; there is no `toggleMC` in the board); **Edit record** is `openEdit(id)`.
  - A locked view shows the RECORD card's read-only line (`recRoHtml`); a PMO copy is as the RECORD card allows (the page itself
    edits nothing: ★ and the edit box refuse or allow by their own rules).
  - **A requirement the year does not hold** says so with Back: removed or deleted, or the year switched under it (the page keeps
    the year it was opened on and never shows another year's requirement of the same id -- an added requirement's id is its own
    year's number; back on that year it is the page again).
  - **Another view leaves it**: a mode chosen by anything but the page (the left menu's Funding, Cycles & compare, Brief, W3's
    Allocate) closes it, and so does a click on any left-menu view entry (`#uiSide button.uiNi:not([aria-haspopup])`, so
    Requirements does too); a flyout's box (FYDP ▸, Execution ▸) opens over it.
- **Tabs** (buttons with `aria-pressed`, not ARIA tabs), drawn from `REQPG_TABS` by `order`; a tab's `label` may be a function; a tab
  whose `html` throws shows its own failure under the header and the other tabs; `after(id)` runs each time its markup is put in.
  Each tab's `html` is called `html(id, ctx)` with `ctx = {id, it, T, t}` (the lane walk the header used) -- W2's `html(id)` may ignore it.
  - **Overview (10)**: the four figures (Requirement `askTot`, Discretionary `t.dT`, Mandatory `t.mT`, Unfunded `unfTotOf` -- the
    requirement's own shortfall, never beyond; Mandatory left out where `!mandOn(S)`); **When the money obligates**: Oct–Sep and
    Unscheduled, discretionary and mandatory stacked, from `awdSplitOf` (the award block's own landing: `landSvc` per service),
    each award's dollars under its own month, an award dated outside the year and what no award covers in Unscheduled (as
    `monSpreadOf` files them); each bar's figure above it, every month's figures as text under it (whole dollars, by lane), and the
    one line: N awards · $ scheduled · $ unscheduled; the impact statement, or "Not written yet" and **Write impact statement**
    (`openEdit(id, 'cons')`); **Record**: plan event, obligation category, cost element, WBS, Goes to (with the second hop and the MIPR
    type), RCN / EEIC (and how many services are set apart), BAE budget (the names `budResolve` makes effective on the requirement's
    lines) -- what `reqNeeds()` finds missing flagged "not set — still needed"; **Recent changes**: the journal's lines for this
    requirement in this year (`jrnlReqHas`'s own rule, read with `jrnlReq` put in place for the reading and put back after), newest
    first, five, field (`jrnlFieldName`), was → now (`jrnlShow`), who and when, and **All N in History**.
  - **Funding by service (20)**: per service Requirement, Discretionary, Mandatory, Unfunded (`unfSvcOf`); a cell is what was
    directed with the `drewLine` reading under it where it was not drawn (against `basisSvcOf`; mandatory against what the basis has
    left), and the totals the draw with `directedLine` -- the RECORD card's cells, read only. **Edit in the RECORD card** closes the
    page and opens the record at its Requirement box. Mandatory column left out where `!mandOn(S)`.
  - **Awards (30)**: each award a block (date, its dollars by service, its total `incTot`, its split from `awdSplitOf`), an award
    outside the year said so, Unscheduled (`ud + um`), and **Edit awards** (the record at its award block, its first date box).
  - **History · N (50)**: every line for it in this year; **Open in the change journal** is `jrnlFor(id)` (Put back stays there).
- **Rank by band** (`156-Rank`, view only): in Rank a **List / Board by band** switch (`#rkViewSw`, `aria-pressed`, put in the table's
  tools row beside View by script; this browser's, `spmtRankView` through `lsSet(..., {own:true})`, never in the board). The board
  (`#rkBoard`, put after `#list` by script; `html.ui-rkboard` hides the list and its header) is the list as shown (`gridIds()`: its
  filters and its search apply), a column per band in `BANDS_LIST()` order and **No band yet** last, each with its count and
  requirement total; a requirement's column is the band the row's band cell names (`BAND_OF`, `BAND_DEF`); cards in the list's
  order: `#rank` title, requirement, office, the lane pill in its word, `★ MC`. The cutlines are `cutlinesOf`'s, drawn where the rows
  draw them (no office, service filter or rank entry), each in the band of the requirement it falls at, above the first card at or
  past it; the discretionary line carries Mission Critical's shortage as the rows' does; a **Today** line says all three for the
  whole board. A card is a button that selects its requirement and opens its record (`setCur`); nothing on the board changes a band
  or the order, and its line says where a band is set.
- **The five-year chart** (`156-FYDP`), in the five-year spend plan box above its table, from the box's own `fydpBookModel` (the
  model the workbook reads): **Requirement against funded, by year** (bars, the gap in words above each year, the figures under it,
  a legend in words) and **By appropriation · funded of requirement** (a cell per appropriation per year, "$F / $R" in $M with a
  meter, the FYDP total; a year not held prints —, never 0). The workbook is unchanged (proved byte for byte against the slot's).

## Decided in the build (Brad can reverse any of these)

1. Tabs are buttons with `aria-pressed` (the board's mode tabs' pattern), not ARIA tabs with arrow keys.
2. The page follows the record's view of the money: `tiers(null, scenOpt())`, so under ◨ (discretionary only) it reads as the RECORD
   card does.
3. The rank everywhere on the page and the board is the 1–N order's (the master order, as the rows and the cutlines count it), also
   when one office is showing; Previous / Next follow the list as shown.
4. A year switched under the page does not move the page to that year's same work: the page says which year's requirement it is
   and offers Back (W2's Across the FYDP tab is the multi-year view).
5. Any other mode, or a left-menu view entry, leaves the page. Esc leaves it only when nothing else has the key. **J and K step the
   page** as Previous and Next do (taken before the list's J / K, which moved the selection behind the page and opened the record the
   page hides); a field, a box or a modifier keeps them, as for the list.
6. The journal's values are printed as the change journal prints them (`jrnlShow`): an award or a split reads as its stored text,
   cut at 120 characters -- the page states no second reading of a journal line.
7. Rank by band: columns wrap onto further rows (`auto-fill`, 270px) rather than scroll sideways, so nothing on the page scrolls
   sideways at any width; every band of the ladder is a column, an empty one saying so; ★ is shown on a card as `★ MC` (a card is one
   button, so it carries no second control).
8. The switch sits in the table's tools row (beside Columns and View), shown in Rank only.
9. The five-year box's chart shows what the box's model holds: this appropriation (the box has always read only its own); the box
   says the workbook reads the others from their own boards. The chart prints $M to one decimal.

## Questions for Brad

1. **The five-year box's chart, all four appropriations?** The box's model is this appropriation's alone, so its "By appropriation"
   table has one row and a sentence naming the others. Reading every appropriation in the box means opening each as its own board
   (the workbook's sealed frames, asynchronous). Worth doing for the box, or is the workbook the place for all four?
2. **Recent changes in words** (the concept: "Award date set to 9 Dec 26"): the page prints a line as the change journal does
   (`jrnlShow`), which for an award or a funding split is its stored text. A plainer reading per field would be a second statement of
   the journal; it belongs in the journal (both would then read it), if wanted.
3. **The page across a year switch**: should switching the year move the page to that year's same requirement (by the work,
   `fydpSameIn`), rather than saying it is the other year's?

## Checks

- `audit-board.mjs` **"v2.23 W1 — the requirement page: the header, the four figures, when the money obligates, the record, recent
  changes, the tabs, Back and Esc"** -- fails on the slot commit (no page: the block throws). A fixture where the alternatives
  disagree, every figure by hand: discretionary forward / mandatory backward land in different months, an award dated in FY28 and
  ANG dollars no award covers make Unscheduled from both causes, B is trimmed (own shortfall 60 ≠ beyond 30), F directs $50 a dry
  lane cannot pay, the journal holds A's seven lines plus FY28's A and B's. Also: mandatory off (W3's `mandOn` stood in), a tab that
  throws, the tab order with a tab registered later, Previous/Next, Back, Esc with and without a menu open, a mode and a left-menu
  entry leaving, the year switched under it, nothing in the saved state, the change journal's narrowing left as it was.
- `audit-board.mjs` **"v2.23 W1 — Rank by band: …"** -- fails on the slot commit. Columns in the ladder's order and No band yet last;
  the discretionary line in PDM between P and A (rank 2), the full-budget line in Safety above B (rank 3); counts and totals; MC's
  shortage on the line; the Today line; a card is a button that opens the record; every control on the board is a card; Mission
  Critical only and one office apply, and no cutline with one office; the switch kept in `spmtRankView`, never in the saved state;
  hidden outside Rank.
- `audit-other.mjs` **"v2.23 W1 — the five-year chart: …"** -- fails on the slot commit. Two held years that differ, worked by hand
  ($350M/$290M and $410M/$290M), three not held: the bars' words, the gaps, the heights, the figures, the appropriation row with its
  meters and FYDP total, — for a year not held, the chart equal to the table's TOTAL row; and the workbook from this board and from
  the slot commit's (read from git: `git fetch --unshallow` in a shallow clone) the same bytes.
- **`tools/req-page.mjs`** (new; `npm run reqpage`): A the page at 1920, 1440, 1366, 1024 in Harbor and at 1440, 1024 in Midnight,
  three requirements, every tab -- no sideways scroll, nothing past the page's edge, no figure cut, targets at least 24px, the
  chart's words inside their columns; B the keyboard (Tab order, Enter on a tab, Esc back to the row); C real clicks (Next, a tab,
  Back); D Rank by band at 1440 and 1024 (the switch by a click, columns and cards inside the board, a click and Enter on a card
  open the record); E the five-year chart inside its box. Fails on the slot commit (8 failing checks) and on a board with the
  page's figure type planted too large (it scrolls sideways at 1024).
- `tools/standards-check.mjs` (changed on purpose, `// v2.23 W1` comment): the run now measures the requirement page (every tab),
  the board by band and the five-year chart on screen, and records a coverage finding if any was not drawn. Its first run found the
  five-year box's existing **Export the workbook** button 21px tall (2.5.8, in every theme); it is 24px now (`fydpBody`, W1's).
  Standards then holds: 0 findings, nothing new.
- No other existing check was changed.

## Mutations

50 new (`v223-w1-*`, single-quoted, in the `// ==== v2.23 W1 ====` slot of `mutate.mjs`), none retargeted or retired.
`mcount`: every target in the file matches once (four older targets matched twice after the first cut -- `att-go-no-field`,
`v207-121-jk-behind-box`, `v222-w3-star-sets-only`, `v222-w3-fields-wbs-dropped` -- because the page wrote the same text; the page's
text was changed, the ★ handler kept identical as an attribute). Proofs: `recovery/v223/proofs-W1.json`, results
`recovery/v223/proved-W1.jsonl` (see below).

**50 of 50 CAUGHT by a failing check** (none by a block that threw), each against its own block with `prove.py` on the
finished board (JOBS=1 under `heavy.sh`). `v223-w1-tab-fails-whole-page` was first caught only by the block throwing; its check now
reads the page's parts without throwing, and the re-proof catches it by two failing checks. `v223-w1-jk-behind-page` was added with
the J / K fix and proved with it.

| area | mutations |
|---|---|
| when the money obligates (`reqPgMonths`, `reqPgChart`) | `months-outyear-dropped`, `months-mand-as-disc`, `months-unsched-not-landsvc`, `months-wrong-award`, `chart-sched-counts-unsched` |
| the figures and Funding by service | `fig-unf-beyond`, `fig-mand-always`, `svc-unf-beyond`, `svc-drew-dropped`, `svc-directed-as-drawn`, `mand-col-always` |
| the journal | `jrnl-every-line`, `jrnl-oldest-first`, `jrnl-narrowing-left`, `recent-six` |
| the header, the steps, leaving | `rank-off-by-one`, `prev-is-next`, `step-not-selected`, `back-no-keyboard`, `esc-over-menu`, `esc-dead`, `mode-keeps-page`, `nav-keeps-page`, `other-year-by-id`, `jk-behind-page`, `pill-not-lane`, `impact-not-at-field` |
| the tabs and the record | `tab-fails-whole-page`, `tabs-unordered`, `record-miss-unflagged` |
| Awards | `awd-split-reversed`, `awd-outyear-silent`, `awd-unsched-zero` |
| Rank by band | `rk-cut-at-top`, `rk-cut-after`, `rk-cut-first-column`, `rk-no-band-first`, `rk-total-counts`, `rk-unfiltered`, `rk-lines-in-office`, `rk-mc-not-said`, `rk-pick-no-record`, `rk-view-unkept`, `rk-every-mode` |
| the five-year chart | `fy-bars-swapped`, `fy-gap-reversed`, `fy-max-funded`, `fy-notheld-zero`, `fy-meter-full`, `fy-fydp-first-year` |

(each id prefixed `v223-w1-`)

## For the integration

1. **Open full page in the RECORD card** (`inspectorBody`, W3's): a button calling `reqPageOpen(id)`, e.g. in the pinned bar beside
   ‹ Previous / Next › (`recBarHtml`) or under the figures line: `'<button type="button" class="qb" onclick="reqPageOpen('+jsa(id)+')"
   title="This requirement as a page of its own: overview, funding by service, awards, history">Open full page</button>'`. Then
   `npm run controls --record` (a new RECORD control) and say so; `npm run keys` and `npm run record` should be run after.
2. **W2's tab**: register `{k:'fydp', label:'Across the FYDP', order:40, html(id, ctx), after(id)}`; the page calls `html` on every
   redraw and puts the markup in only when it changed; boxes typed into and not committed keep their typing across a redraw (by id,
   or by their `onchange`/`oninput`). W2's tab can open the page at it with `reqPageOpen(id, 'fydp')`.
3. **W3**: the page asks `mandOn(S)` itself; `html.ui-reqpage #allocView{display:none}` is in `<style id="v223w1">`; choosing the
   alloc mode closes the page (it follows `uiMode`); W3's Allocate entry, with no `aria-haspopup`, closes the page by the left-menu
   rule. If W3 hides Fund's Mand cell or tiles by a class on `<html>`, nothing here conflicts.
4. Add `npm run reqpage` to `verify:grid` (before `layout`, whose carried D ×8 stops the chain).
5. The guide (Help) does not mention the page or the board by band: Help is at its size limit (v2.18); the lead decides what gives.

## npm script to add

`"reqpage": "node tools/req-page.mjs"` (and into `verify:grid`).

## Known gaps

- The page opens only from `reqPageOpen` until the integration adds **Open full page** to the RECORD card (item 1 above); Ctrl K's
  requirement results open the RECORD card as before (the contract leaves the palette alone).
- The five-year box's chart shows this appropriation only (Question 1).
- Recent changes and History print a journal line as the journal does (Question 2).

## What was run on the finished board

- `npm run check`: all checks passed. `mcount`: 3,456 entries, every one matching once.
- Suites, each whole through `heavy.sh`: boot-same, audit, audit-other, audit-import, audit-recon, legacy-fsrc, audit-hostile,
  audit-inject, audit-ui -- all pass. **audit-board died out of heap at heavy.sh's 6 GB** on its first whole run (exit 134; my two
  blocks did not then free their boards). The blocks now release them (`bootMark`/`bootRelease`/`settleBoards`, as the others do),
  and audit-board passes whole at `HEAP=8192` (CLAUDE.md: board, import and recon need 8 GB here). It was not re-run at 6 GB.
- Browser: reqpage (new), look, palette, record, keys, dropdowns, dialogs, leftmenu, menus, panels, toolbar, editors, pointer,
  controls, standards, colours, pmosave, pmoyears -- all pass; layout fails only on its carried D ×8.
- Not run: `npm run money-map` / coverage beyond the check (`money-coverage` 19/19 and `money-map --check` held before the J / K and
  standards changes, which move no money).
