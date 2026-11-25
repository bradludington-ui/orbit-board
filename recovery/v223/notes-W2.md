# v2.23 W2 — item 158: one requirement across the FYDP, by service

Built on branch `v223-w2` from the slot commit `9f82139`, to `recovery/v223/contract.md` §1.2.

## What was built

All board code is in the `// ==== v2.23 W2 ====` slot and `<style id="v223w2">`, except the RECORD card's other-years line
(`recYearsKey`, `recYearsOf`, `recYearsFill`, `recYearsHtml`, W2's by §2, edited in place in the v2.22 W3 slot) and the two boxes'
markup (`#xfAddPanel`, `#xfFillPanel`, direct children of `<body>`, placed before `#exPanel`).

- **The tab** is registered in `REQPG_TABS` as `{k:'fydp', label:'Across the FYDP', order:40, html, after}`.
  - `html(id)` is `xfTabHtml(id)`: a chart, a tool line (Fill across…) and the grid.
  - `after(id)` keeps the grid's sideways scroll across a redraw.
- **The years** (`xfWindow`) run from the year before the base to base + 4. The year on screen is added if it sits outside them.
  - The FYDP total covers base to base + 4. The year before the base is editable and outside the total.
  - Each year's heading shows that year's rank (`#r of n`, the place in that year's `S.order`) and its lane status in words (`laneWord`).
  - A year without the requirement says "not in FYxx's plan" or "not started", with **Add to FYxx…**.
- **The data** comes from `xfYears` → `xfYearNow`. Each held year is opened inside `aceWithYear` and read by `tiers()`, `unfSvcOf()`,
  `basisSvcOf()` and `laneOf()`; the directed split is read from `S.fsrc`.
  - The requirement in each year is the same work: `fydpSameIn` over `fydpLineKeys`, plus `xfRolledIn` (below).
  - The result is cached in the RECORD line's own cache (`_recYrC`, keyed by `recYearsKey`, which moves with `_saveGen`), so the tab
    and the strip share one reading. The strip works it out when the page is idle, as before; the tab works it out synchronously,
    because it is drawn after the rows and the RECORD panel (`v223After`).
- **One block per service, four lines** (Requirement, Discretionary, Mandatory, Unfunded), then footer lines Requirement, Funded and
  Unfunded.
  - Requirement, Disc and Mand are boxes. A box holds what was **directed** (the split), not what was drawn. Under a Disc or Mand box
    is `drewLine` (and `drewTip` in its title).
  - Unfunded is `unfSvcOf`, read only.
  - A year where `mandOn(that year's state)` is false shows — in its Mandatory cells. Where no year has mandatory on, the line is not
    drawn.
- **A typed figure** goes to `xfSet(y, yid, kind, i, val)`, which runs the field's own setter inside year y:
  `setAsk` (so `applyAskVec`) for the requirement, `setFsrcSvc` (seeded by `seedSplit` the first time) for Disc or Mand.
  - It runs through `xfIn(y, fn)`, which holds `save`, `render` and `flash` while the setter runs inside `aceWithYear`, then puts
    them back.
  - Then one `save()` and one `render()`. The journal files the line under year y, because `jrnlCapture` reads the year from the path.
  - Put back restores that year's figure (checked).
  - A figure the setter refuses saves nothing, and the box keeps what was typed.
- **Add to a year** (`xfAddOpen`, `xfAddDraw`, `xfAddSay`, `xfAddDo`):
  - A year nobody has started is asked about once first (`xfStartYear`): roll forward, else start blank, through `pmoYearStart`.
    Cancel to both starts nothing. A PMO copy is offered blank only.
  - The source is the nearest year holding the work, an earlier one first on a tie (`xfAddSrc`).
  - The box shows the source's requirement by service, office, CCaR and PID, an optional growth % (whole dollars per service,
    `D$`), and a per-service table of was and becomes.
  - It writes through `reqCreate(g, {title, event, ask}, {y, id})` inside `aceWithYear`, then deletes the carried award dates.
    `reqCreate` does not carry the star or Disc/Mand; the new requirement is seeded on a Split from that year's lanes, last in its order.
  - Everything is read again at the press (`xfAddDo`).
- **Fill across** (`xfFillOpen`, `xfFillDraw`, `xfFillPick`, `xfFillPrev`, `xfFillPlan`, `xfFillDo`, `xfFillToAdd`):
  - From a year holding the work, into the later years of the window, copied or grown N% a year. Growth compounds:
    `D$(a·(1+p)^(y−from))`.
  - The preview shows was → becomes per service and year. A year without the requirement is listed as not filled, with Add to its year.
  - It writes the **requirement only**, through `applyAskVec` inside each year, with one `save()`.
- **The RECORD card's line** becomes a year strip and a Manage button.
  - Each held year of the window shows its requirement and its lane word (`span.recyrlk`); the year on screen is marked.
  - **Manage across the FYDP ›** (`button.recyrman`) calls `reqPageOpen(id, 'fydp')`.
  - The strip now shows with a single year held, so Manage is always reachable; it needed two before.
  - The idle fill updates in place with `innerHTML` (it used `textContent`), so the lane span survives.
- **A PMO copy**: Disc and Mand are text, never boxes (`xfCan`), and `xfSet` asks `allocLocked()` first.
  - The requirement is a box only in the years the copy submits for (`pmoBaseOf`).
  - Add makes the copy's own proposal (`myPmo()`, a `NEW-<office>-n` id). It refuses another office's requirement, and a year the
    copy does not submit for.
- **A locked view**: no boxes, no Add, no Fill, and `xfSet` is refused by `cycBlock`.

## Decided in the build (Brad can reverse any of these)

1. **A year rolled forward from the year on screen is the same work** (`xfRolledIn`).
   - `fydpLineKeys` (v2.16) asks only the nearest earlier year holding an id, and stops there.
   - So when a year between them used the id for other work, or for this work added by Add to a year, a later year's rolled copy
     read as new work. The tab then offered Add to that year, and Add would have made the same work twice.
   - Where `fydpSameIn` finds nothing, the tab and the strip also accept the year's own copy of the on-screen requirement when
     `yrCopySame` (the same id, link, event, title, office and CCaR work) says so.
   - The shared `fydpLineKeys` is **not** changed, so the five-year workbook still prints such a rolled copy as a line of its own.
     See Questions.
2. **The growth in Add to a year is applied once**, not per year between the source and the target. The picture shows one figure
   ("Grow the requirement by 3%"). Fill across compounds per year, as asked.
3. **Add to a year carries everything `reqCreate` carries from another year** (item 117's `NA_FROM_CARRY`: record fields, CCaR,
   PID, the band, the BAE choices, the minimum increment), **except the award dates**, which are deleted.
   - The star and the Disc/Mand split are not carried by `reqCreate` anyway.
   - The band is carried, as From another year carries it.
4. **Add to a year in a year nobody has started asks the start question first**, then opens the box. Cancel on the box leaves the
   year started; the start is its own journal line. A roll forward that brings the requirement in adds nothing and says so.
5. **The tab reads the funded plan** (`tiers()` bare), not the ◨ discretionary-only what-if. It is an editor, like the RECORD card's
   split table.
6. **No Services or Lines selectors** (the picture's "Services: all 6 ▾" and "Lines ▾"). Brad's answer is four lines per service, all
   shown; a selector that hides some is a later choice.
7. **"Rank"** is the place in that year's master priority order (`S.order`), counting the requirements the year holds.
8. **The strip shows held years only**, as before; a year not started is not a chip. The tab shows every year of the window.

## Questions for Brad

1. **The five-year workbook's join stops at the nearest year holding an id** (`fydpLineKeys`, v2.16). A requirement rolled into a later
   year, behind a year that numbered other work (or this work, added there) with the same id, prints as two lines in the workbook.
   The tab and the strip read it as one (Decided 1). Should `fydpLineKeys` look past the nearest year to the first one whose copy is
   the same work? That changes which line a figure prints on in the workbook, so it is not mine to change.
2. **Add to a year's growth**: once (as built), or once per year between the source and the target?

## Checks

New, each failing on the slot commit (run there with `BOARD=<9f82139's board>`):

- `audit-board.mjs` "v2.23 W2 — Across the FYDP: the years by the work, a figure for another year written there through its setter
  and journalled with its year, what a lane drew, Add to a year, Fill across, the year strip". 40 checks, 4 of them CONTROLs.
  - On the slot commit it fails at the one-year strip (no Manage), then the block throws (`REQPG_TABS` holds no tab).
  - Its fixture: the year on screen is the year before the base; FY29 holds other work under FY27's added requirement's id, with
    FY27's work there as NEW-2, and its lanes are empty; a board-data requirement beside an added one; FY30 and FY32 not started;
    FY31 rolled forward.
- `audit-import.mjs` "v2.23 W2 — Across the FYDP in a PMO copy: requirement values only, in the years it submits for, its own
  proposals, sent by year; and a save -> reopen". On the slot commit the block throws.
- `tools/fydp-across.mjs` (new; `npm run across`, with its fixture `tools/fydp-across-fixture.mjs`), in Chromium, Harbor:
  - A, the fit at 1920, 1440 and 1024: no sideways page scroll, every box whole ($123,456,789), the chart inside.
  - B, the keyboard: type in FY29 and Tab, and the keyboard goes on to the next box in the redrawn tab; Enter commits.
  - C, a drew line.
  - D, Add to FY30 by a real click: keyboard in the box, Esc back to the button, Enter reopens it, grow 5%, Add.
  - E, Fill across: preview, Fill, never Disc/Mand.
  - F, the RECORD strip and Manage, by a real click.
  - It fails on the slot commit (no tab, no Manage).

Existing checks changed on purpose, each with a `// v2.23 W2:` comment:

- `audit-board.mjs` "v2.22 W3": the years line reads a year's figure from its first text node (a year now carries its lane word in a
  span).
- `audit-board.mjs` "v2.22 review": the line's year buttons are counted as `button.recyr` (Manage across the FYDP is a button of its
  own).
- `tools/panels-render.mjs`: `xfAddPanel` and `xfFillPanel` added to `SPECIAL`. The board's own fixture year before the base holds
  every board requirement (applyState re-seats the removed ones), so Add opens on the next year, started blank.
- `tools/dialogs-keyboard.mjs`: `xfAddClose` and `xfFillClose` added to `KNOWN`, opened by their switches; `PRE` starts the year to add to.
- `tools/standards-check.mjs`: Across the FYDP measured (the tab with boxes and an Add button, then each box open). A coverage finding
  if any is not on screen.
- `tools/export-audit/mutate.mjs` `v222-w3-years-by-id`: retargeted (its line now also asks `xfRolledIn`).

## Mutations

31 new (`v223-w2-*`) and 1 retarget (`v222-w3-years-by-id`). Each was proved against its own check with `prove.py`, `JOBS=1`, under
`heavy.sh` (`recovery/v223/proofs-W2.json` → `recovery/v223/proved-W2.jsonl`). Results are under Proofs below.

`mcount`: every target matches once (3,437 entries). Two of my lines first duplicated older targets (`fydp-window-drops-screen-year`,
`v216-148-proj-no-link`), so I reworded mine rather than the old ones.

## For the integration

- **The tab is reached only through `reqPageOpen(id, 'fydp')`** (W1). `tools/fydp-across.mjs` and the standards measure try
  `reqPageOpen` first. They use their own harness only when `#reqPage` holds no `#xfTab` after it, so they follow W1's page once it
  is merged.
- **After `reqPageOpen` shows the page, call `render()`** (W1 surely does). Measured in the harness: the header fits itself on a
  render (`fitTop`). With the table hidden and the page grown taller, the header was 14px past the window at 1024 until a render.
- **W1's page should draw this tab's `html(id)` again after every render** (from `V223_AFTER`), as the harness does. A figure typed and
  left with Tab is committed by the change event, which saves and renders. The keyboard then lands on the next box only if the tab
  is redrawn with the same handlers (`focusMark`/`focusRestore` find a box by its `onchange`, which names the year, the id, the line
  and the service).
- **`after(id)`** restores the grid's sideways scroll. Call it after the markup is in.
- **`npm run controls`**: the RECORD card gains Manage across the FYDP (`reqPageOpen`, record surface); see `npm run controls` below.
- **W3's `mandOn`**: the tab asks `mandOn(state)` inside each year (`xfYearNow` → `P.mand`). Nothing else is needed from W3.
- **Help**: the guide is at its size limit. Nothing was added; the integration may want a line for Across the FYDP.

## npm script to add

`"across": "node tools/fydp-across.mjs"`, and add it to `verify:grid` before `layout` (whose carried D ×8 stops the chain). I did not
edit `package.json`; the integration owns it.

## Known gaps

- The five-year workbook's join (Questions 1).
- jsdom cannot hold Tab between boxes; `tools/fydp-across.mjs` B holds it in Chromium.
- The tab has no Services or Lines selector (Decided 6).
- A year whose lanes cannot pay shows the drew line under the box; the chart shows only requirement, funded and unfunded.
