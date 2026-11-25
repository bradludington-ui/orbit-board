# v2.23 W3 — item 159: Allocate, and mandatory funding on or off per year

Builder W3, branch `v223-w3`, from the slot commit `9f82139`. Built to `recovery/v223/contract.md` §1.3.

## What was built

**Mandatory funding on or off, per year** (`S.mandOff`).
- `mandOn(St)` (in the seams block, replaced in place): off is `St.mandOff===true` on that year's own state (S when left out);
  anything else is on. It reads only its argument, so it is safe while the board is opening.
- **The RULE**, stated at its line in `tiers()`: `const noMand=!!(scen&&scen.noMand) || !mandOn(S);` -- in a year with mandatory
  off every mandatory lane is empty for the walk, exactly as `{noMand:true}` empties them, so a dollar that would have spilled into
  mandatory (directed there or not) is unfunded. Distinct from the ◨ view (`scenView`), which stays a view and saves nothing.
- `applyState` keeps `mandOff` only as `true` (anything else is deleted: on). `inShapeWhy` refuses a year whose `mandOff` is not
  `true` or `false`, naming the field ("mandatory funding on or off at …mandOff is “"yes"”, not true or false").
- `setFsrcSvc(id, kind, i, val, o)`: a fifth argument `o.quiet` writes the figure and nothing else (no save, render or message)
  and answers true/false; and a mandatory figure above $0 is refused in a year with mandatory off (nothing would draw it).
- **The switch** (`mandSwitch`), its one home in Allocate's header (`role="switch"`). On → off in a year whose walk draws no
  mandatory and directs none: off at once, nothing asked. Otherwise **the box** (`#avMandPanel`, `mandBoxDraw`): what is there
  (each requirement, its mandatory drawn, its unfunded after), **Clear them** or **Move what discretionary can cover**, for **this
  year only** or **this year and every later year held**; Keep mandatory on / ✕ / Esc change nothing. `mandOffApply` takes each year
  oldest first inside `aceWithYear`: every listed requirement not on a split is seeded from that year's walk (`seedSplit`, one walk),
  the year is turned off, each mandatory figure goes to $0 through `setFsrcSvc` (quiet) and, for Move, the discretionary takes what
  the plan gave it; then ONE `save()` -- one journal capture, a line per figure with its year, each one Put back-able.
  - `mandOffPlan(T, how)`: Move gives each requirement, in PRIORITY order, the discretionary its service's lane still holds at the
    END of the walk (`T.__rem.dRem`): money left after every requirement has drawn is money no requirement below needs, so giving it
    moves no other requirement's draw (argued in the code and held by the fixture).
  - Off → on: `delete S.mandOff`, one save; the columns come back empty (Clear converted every listed requirement, lane walk
    included, to a split holding no mandatory, so nothing refills).
  - Refused in a PMO copy and on a locked view; refused while Allocate holds unsaved changes (save or discard first).
- **Hidden where off:** the RECORD card's Mand box and column (`inspectorBody`'s split table), the Funding page's Mandatory tile
  (replaced by a line saying it is off) and its bar's mandatory part and the old scorecards' card (`scoreboard`), the Requirements
  tiles' Mandatory tile (`uiKpis`, three tiles, class `n3`), Fund mode's Mandatory column (`render()` marks its head and cells
  `.mandc`; `html.ui-mandoff` hides them; `uiCols` is wrapped so the row template loses that track), the money bar (no block can be
  yellow -- the engine; its line says mandatory is off). **Exports keep their Mandatory columns, at $0.**

**Allocate** (mode `alloc`, left menu › Allocate between Funding and FYDP, `uiGo('alloc')`), drawn in `#allocView` from
`V223_AFTER` (`avDraw`).
- **A held draft** (`AV.draft`, keyed `id|d|i` / `id|m|i`, with `AV.was`): a box writes the draft, never the board. The figures
  beside the boxes are the lane engine's on the board with the draft laid over its directed splits (`avTiers`: `tiers()` pointed for
  one synchronous call at a shallow copy of S whose fsrc carries each drafted split as Save would write it) -- never a second engine,
  nothing written while drawing. A changed box is outlined; a count; **Review changes** (`#avRevPanel`: requirement, service, lane,
  was → now); **Discard**; **Save** (`avSave`): refused while a box holds a figure that could not be read; asks first when a lane is
  given more than it holds (shown red, never refused); seeds every drafted requirement not on a split from ONE walk of the board as
  saved (`seedSplit`), writes every change through `setFsrcSvc` (quiet), then `save()` once.
- Leaving with a draft asks (`avLeave`): `uiSetMode`, `switchYear`, `switchAppn`, `cycView`, and closing the page (`beforeunload`).
- **The Sheet** (A2): every requirement in priority order (the list's filters and search apply; the pinned lines are the whole
  board's and say so when narrowed); per service the requirement (shaded, underlined green where met, red where short), Disc and
  Mand boxes; per row requirement, funded, unfunded (`unfSvcOf`), funded % with a meter; pinned lines Requirement, Budget authority,
  Allocated (share met), Left in the lane ("over $X" in red), Still unfunded; goal tiles Requirement, Funded, Unfunded, Budget
  authority, Left to give. Arrow keys between boxes (Up/Down always, Left/Right at the figure's edge, Enter down); paste from Excel
  (`avPaste` → `avPasteGrid`, tab- and line-separated, filling right and down along the boxes drawn).
- **One lane** (C2): service tabs (asked, % met, a meter); the goal with a bar of discretionary, mandatory and unfunded and a line at
  all the service's budget authority; per requirement its requirement for the service, Disc and Mand boxes, a Met bar, Unfunded,
  **Left after** (the edited lane's BA less what is directed, down the WHOLE priority order); the cutline after the row where the
  lane is gone; select rows → Fund to the requirement / Cut by %… / Set to $0; Full and $0 per row; a pinned total line; **the move
  aside** (`avMove`: amount, lane, from, to, in this service, into the draft; never more than the source is directed).
- **Edit / Present**: Present is the same screen, read only (figures as text), larger type.
- Read only in a PMO copy (and says the portfolio team sets the allocation) and on a locked view.

## Decided in the build (Brad can reverse any of these)
1. **A year rolled forward carries its source's setting** (the roll copies the year's state whole, `pmoYearStart`); a blank year
   starts on. Held by audit-board "mandatory off travels".
2. **The switch's one home is Allocate's header.** Nowhere else turns it on or off.
3. **The switch is refused while Allocate holds unsaved changes** (they were typed against the figures it would change).
4. **Move moves what is DRAWN as mandatory**, against the discretionary left at the end of the walk, in priority order. Mandatory
   directed but never drawn (the lane could not pay it) is not funding anything and is cleared.
5. **Clear converts every requirement it lists to a split holding no mandatory** -- lane-walk ones included -- so turning mandatory
   on again brings the columns back empty. A requirement on the lane walk that drew no mandatory is left on the lane walk.
6. **In a year with mandatory off, `setFsrcSvc` refuses a mandatory figure above $0** (the RECORD card has no box for it; this stops
   any other route). Put back from the journal still puts a cleared figure back (it is directed, not drawn, while off).
7. **A drafted requirement's starting point is the walk as SAVED** (what Save will seed from); a requirement on the lane walk that
   is not in the draft shows what it would draw with the draft laid over the others, since that is what it draws once saved.
8. **Allocated and Left in the lane count what is DIRECTED** (so a lane given more than it holds shows over); Funded, Unfunded and
   share met count what is DRAWN.
9. **A blank box is $0; a blank cell in a pasted block leaves its box as it is; a cell that is not a figure is named and the rest
   still go in.** A box holding unreadable typing blocks Save until it is corrected or discarded.
10. **Rows in master priority order** whichever office is showing (the rank printed is the master rank).
11. **Whole dollars on screen** (the mock-ups print $K): every figure the board holds is a whole dollar, and the boxes take what
    `amtRead` takes. See the question below on Present.
12. The two boxes (`#avRevPanel`, `#avMandPanel`) are made the first time they are used (a `body > .modal-bg` with an `<h3>` and a
    close control, watched for `dlgSync` like the others), so they are never part of a saved file.
13. Brief mode's Mandatory column is NOT hidden when off (the contract's list does not name Brief): it reads $0.

## Questions for Brad
1. **Present at 1920 with six services and mandatory on** scrolls sideways inside its own frame (whole-dollar figures, 18 money
   columns); the page itself never scrolls. In $K (the mock-ups) it would fit. Keep whole dollars, or print Present in $K?
2. **Brief** still shows a Mandatory column ($0) in a year with mandatory off. Hide it there too?
3. **Move what discretionary can cover** uses the discretionary left after every requirement has drawn, so it never moves another
   requirement's draw. A lane that is already dry gives nothing. Is that what you meant, or should Move also take discretionary from
   requirements further down the list?

## Checks
Each fails on the slot commit `9f82139` unless labelled CONTROL (shown run on `9f82139`: audit-board's W3 blocks 19 failing checks,
6 of the 6 blocks; audit-inject's W3 block fails).
- audit-board (`// ==== v2.23 W3 ====`), six blocks:
  - "v2.23 W3 — mandatory funding off: the RULE in tiers(), the ◨ view still a view, the exports keep their layout" -- the RULE
    against a lane walk restated from the fixture (a requirement on the lane walk spilling into mandatory by itself, a split
    directing mandatory), under the `RULE` label; ◨ saves nothing; normalisation; the setter's refusal; hidden where off (RECORD card,
    Requirements tiles, Funding page, Fund mode's column) and back when on; the workbook keeps every sheet and column, Mand Funded $0.
  - "v2.23 W3 — mandatory funding on: no figure moves, on any sheet of the workbook" -- every cell of exportExcel against the slot
    commit's own board on the same fixture (CONTROL; read from git: unshallow first), and FY28's workbook unchanged when FY27 is off.
  - "v2.23 W3 — the mandatory-off box: Clear, Move by priority, …" -- a fixture where size order and priority order disagree (A
    draws $40 of mandatory, B $60, the lane has $50 left: by priority A 40 / B 10, by size B 50); the box's list and unfunded after;
    Cancel changes nothing; Move; C (lane walk) converted, so on again is empty; Clear for FY27 and every later year, FY26 untouched;
    each figure a journal line with its year, put back from the journal; no box where nothing is mandatory; a PMO copy and a locked
    view refuse.
  - "v2.23 W3 — mandatory off travels: save and reopen, a year rolled forward, a PMO copy, the import door".
  - "v2.23 W3 — Allocate: the held draft, …" -- every expected figure worked out by hand from the fixture: the draft moves the
    figures beside it (A cut to $60 frees $40 that B on the lane walk draws), nothing written while drawing, over shown and not
    refused, refusal keeps typing, rounding said, Review changes, leaving asks, Save seeds every drafted requirement from ONE walk
    before writing (C keeps the $0/$20 it drew as saved) and saves once, the board then reads as the view showed, over-lane confirm,
    paste, Discard, Present.
  - "v2.23 W3 — One lane: …" -- Left after down the priority order, the cutline, Full and $0, select and Cut by %, the move aside
    (refused past what is directed), mandatory off (no Mand anywhere in either view), a PMO copy and a locked view read only.
- audit-inject (`// ==== v2.23 W3 ====`): "v2.23 W3 — Allocate and the mandatory-off box draw a requirement’s name as text" (the
  Sheet, One lane, Review changes, the box).
- tools/alloc-view.mjs (new, Chromium): A the Sheet and One lane at 1920, 1440 and 1024 (no page scroll, inside the window, no box
  or tile cut, heads and pinned lines stay in view, the name stays left); B Present at 1920; C arrow keys and digits typed with the
  real keyboard (not taken per keystroke; Tab takes them and lands on the next box); D paste through the real clipboard (falls back
  to a paste event if the clipboard is not offered, and says which); E the switch with a real pointer, the box (keyboard inside,
  inside the window, Esc changes nothing), Move and turn off, no Mand in either view, Fund mode's column gone with every cell aligned
  to its head, three tiles; F leaving with a draft asks. All pass on the finished board.
- `npm run standards` measures Allocate (the Sheet with a changed and a refused box, One lane with a row selected and the move aside,
  Present, Review changes, the box) and records a coverage finding if any was not on screen.
- Changed on purpose, each with its `// v2.23 W3` comment: audit-board v2.22 W1's left-menu sequence (Allocate between Funding and
  FYDP); tools/left-menu.mjs E (the entries in order, Tab walks 14) and F (Allocate's task bar repeats nothing); tools/roundtrip-fuzz.mjs
  fills `S.mandOff` (the fuzz reads `S.mandOff=` from the board and demands it).

## Mutations
35 new (`v223-w3-*`), 2 retargeted to `setFsrcSvc`'s new shape (`alloc-lock-no-fsrcsvc`, `v197w1-guard-setFsrcSvc`), none retired.
`mcount`: 3,441 entries, each matching once. Proofs: `recovery/v223/proofs-W3.json` → `recovery/v223/proved-W3.jsonl` (see the
report for the verdicts).
Browser-only, proved by hand (not in mutate.mjs: the sweep runs jsdom suites, where they could only survive): the row template's
Mandatory track left in (`avMandCols` returning before it drops the track) fails alloc-view E ("every cell still lines up").

## For the integration
- `mandOn(St)` is built: W1 and W2 pass that year's state (`mandOn(MS.years[y])`) for a year not on screen.
- `setFsrcSvc(id, kind, i, val, o)` has a fifth argument (`{quiet:true}`) and answers true/false; W2's one-save-per-commit calls are
  unaffected. It refuses a mandatory figure above $0 in a year with mandatory off: W2's Across the FYDP should hide that year's
  Mandatory line (the contract says so) rather than meet the refusal.
- Lines added at the top of `uiSetMode`, `switchYear`, `switchAppn` and `cycView` (`avLeave`); `cmdActions`' VIEWS gained `alloc`;
  `uiCols` is wrapped in the W3 slot; one line each in `applyState` and `inShapeWhy`; `render()`'s Fund-mode Mandatory head and cell.
- W1's Open full page button in `inspectorBody` (W3-owned for the split table only) is the lead's, as the contract says.
- Brief mode's Mandatory column (question 2).

## npm script to add
`"alloc": "node tools/alloc-view.mjs"`, and `npm run alloc --silent` in `verify:grid` before `layout` (whose carried D stops the
chain). `node tools/alloc-view.mjs --shots DIR` writes the screens.

## Known gaps
- Present at 1920 scrolls sideways within its frame for six services with mandatory on (question 1).
- A draft dropped by a load that replaced the board under it (not a leave the view asks about) is said on the status line and gone.
- A requirement on the lane walk that is not in the draft shows what it would draw with the draft over the others; once one of its
  figures is typed its other services start from the walk as saved (what Save seeds), so its row can shift when it enters the draft.
- `npm run panels` and `npm run dialogs` do not open the two W3 boxes (they are made on first use); alloc-view E and standards cover them.
