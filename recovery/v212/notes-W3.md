# v2.12, builder W3 (item 134): every year's budget is the PPBE position, live; over and under; UPL; locks keep their position

Built on Brad's "Go on v2.12" (28 Oct 2026), on the slot commit `d732259` (branch `v212-w3`), to `recovery/v212/contract.md`
§ W3. Item 134 in `NEXT-VERSION.md` is the requirement.

## What was built

**The budget, read live (§34 beside `applyBudget`).**
- `baPos()` -- the position the plan works in: the working plan's tag (`MS.cycle`) and this appropriation's position under it
  (`{key, P}`, `P` null when the tag logs nothing here; null when untagged). In a locked view it is the lock's own copy
  (`c.pos`), or null for a lock without one.
- `baOf(st, fy, pos)` -- PURE. A year's budget authority and where each base came from: for a year the position logs (any cell
  in that year, `fdcPosHeld`), each service the position names (`baNamed`) takes `ppSvcFy(P, sv, fy)` d and m, `D$`; every
  other service, a year it does not log, and an untagged plan keep the board's own `S.bm.disc/mand`, which is never written.
  Added sources on top by pool, the sum floored at 0, as `applyBudget` always did. Returns `{fy, key, lock, has, logged, from[],
  baseD, baseM, addD, addM, disc, mand, outside}`.
- `applyBudget()` writes the year on screen's cache from `baOf` and records it in `BA_SRC[fy]` (module-level, beside `let MS`,
  never saved).
- `baApplyTo(st, fy)` -- another year's cache made live without opening the year: only `discSvc`/`mandSvc`, only where they
  moved; a year whose budget is not this board's width is left for `applyState`; a year with no `bm` takes it as `applyState`
  would, and only when the position speaks for it.
- `baLiveAll()` -- every year in `MS.years`. Called by every writer of a position or the tag: `ppSetV`, `ppSplitSet`,
  `ppLineAdd`, `ppLineSet`, `ppLineDel`, `ppDel`, `ppUnitSet` (both branches), `ppUnitUndo`, `cycSetWorking` (and so
  `cycRetagNext`), `cycLock`'s tag; by `applyStore` (every import and load lands there); by `cycView`, `cycLeave`, `cycReapply`;
  and once at the end of opening, before `jrnlSync()`. It calls no `save()` and marks nothing unsaved. A service rename goes
  through `svcSaveList`, which already applies every year (`applyState` with `MS.cur` set), so it is live through `applyBudget`.
- `baPosHas(key)` -- for the lock's question.

**Locks keep the position (`cycLock`).** The tag is taken before the projection: an untagged plan takes the lock's key, every
year is made live, then each window year is projected (`aceWithYear(y, cycProjOf)`) and copied. The lock stores
`pos: {key, P: copy of ppNorm(P)}` or `null`. `from` still records the tag the plan carried before the lock (`fromTag`). The
question says when an untagged plan will take the tag and read that position from then on. A view reads `c.pos` (`baPos`).

**The fit (`fitYearNow`, `fitModel`, `fitReadYear`).** Per held year of the FYDP window (`fydpWindow()` filtered to
`MS.years`), per service and lane: `ba` (the year's `discSvc`/`mandSvc`), `base`, `add`, `held` (`fsDirVec(it)` or the lane
walk's draw), `drawn`, `over = max(0, held − BA)`, `un = max(0, BA − held)`, `upl = min(max(0, add), un)`, and `rows` -- every
requirement holding money there, in priority order, `{id, rank, title, held, drawn, short:drewGap(held, drawn)}`. Bare `tiers()`
always. `fitModel()` caches `{years, held, key, lock, over}` in `_fitCache` (keyed on `CYCVIEW` and `MS.cur`), cleared by
`save()`, `baLiveAll()`, and so by every load and view change. It is worked out at the TOP of `render()` (try/catch), before
anything draws. Another year is read on a COPY (`fitReadYear`: the stored year is put back untouched) -- see Decided.

**`cycProjOf()`** carries `upl:{d:[],m:[]}` from `fitYearNow(T)`, so a lock freezes it and another appropriation's board supplies
its own to the five-year workbook.

**Where it shows.**
- **The box** `#fitPanel` (*Fit to the PPBE position*, `toggleFit` / `fitShow` / `fitBody`, a `.modal-bg` under the box
  controller, `fitOpen` beside `let MS`): a line saying which position the plan reads (the working tag, a lock's copy, a lock
  before v2.12, or untagged); per held year its source line (`fitSrcSay`) and a table by service and lane -- base (position or
  own, named), added, budget authority, held, drawn, over, unallocated, UPL -- with a TOTAL; each over said as Brad worded it
  ("▲ FY27 O&M, USAF discretionary: requirements hold $50 more than BES28 — reduce a requirement"; "more than its budget
  authority" where the base is the board's own) with every requirement holding money there, the ones the lane cannot pay
  marked, and **Go to it** (`fitGo(fy, id)`: closes, switches year if needed, selects). Opened from the left menu FYDP ▸ (after
  PPBE Budget Positions), from Budget Management (a button at its foot), from the PPBE Budget Positions box (a line naming
  whether this is the position the plan is tagged as, with the button), and from Needs attention.
- **Needs attention**: `🏛 N over BES28` (or "over budget authority" untagged) while any held year has an over; N counts year ×
  service × lane cells. It is the first entry and opens the box.
- **Budget Management**: for a tagged plan, `bmLiveRow(R)` replaces "Take the base from a PPBE position" (which stays for an
  untagged plan only); each service the position speaks for shows the position's figure read-only (`td.bmpos`, named, the board's
  own figure in its title), a service it does not name keeps its box. Totals are the base shown.
- **UPL, the last line** (`UPL_LBL`, `uplParts`), wherever it is not zero, after the requirements and after their TOTAL:
  - the board's list: `div.uplline` after the last row (not a row: no rank, no handle, nothing to select), from the current
    year's fit (the funded plan);
  - Excel, Funding Streams: after TOTAL, a section line then `UPL · <service>` per service with UPL, the figure under Disc
    Remaining / Mand Remaining;
  - Priority Drill, 1-N by Band: after `ALL BANDS`, a line per lane with UPL, the lane total under Discretionary or Mandatory
    and each service's under its `<SVC> funded` column;
  - FYDP Spend Plan, each appropriation tab: after the block's TOTAL (`fydpUplRows`), a line per lane, each held year's UPL in
    its Allocated column, — for a year not held, the FYDP total at the right. Read from each projection's `upl`
    (`fydpBookApp` keeps `M.upl[y] = {d, m}`).
- **The guide**: a section *Budget authority from the PPBE position* (`t-ppbe`, 2,388 characters) after the five-year plan's;
  the `.cyc-keeps` paragraph and the PPBE cycles hint say a lock from v2.12 keeps the position.
- CSS: `.uplline`, `.fctab.fittab/.fitrows` (auto layout: fixed cut nine-figure dollars), `.fitwrap` (each table scrolls inside
  its own frame).

## Decided in the build

- **The fit is computed per held year of the window and cached until the next `save()`, position or tag change, load, or view
  in or out** (as the contract decided), and it is worked out at the top of `render()`, before anything draws, because reading
  another year rebuilds `DATA.items`.
- **Another year's fit is read on a copy of the year** (`fitReadYear`), not through `aceWithYear`. `aceWithYear` runs the stored
  year through `applyState`, which normalises it (containers a newer build added, seeding flags); doing that from `render()`
  would make opening and saving a board write a different file than it opened (a year nobody opened, saved by an older build).
  The copy gives the same figures and leaves the stored year as it was read.
- **The refresh writes only the caches**, not a whole `applyState` per year (`baApplyTo`), for the same reason: "opening and
  refreshing write nothing on their own". A file saved by this build reopens to its own bytes (checked); a file saved with a
  stale cache opens live, unsaved-mark untouched (checked).
- **A service the position "names" is one it holds a figure for, in some year** (`baNamed`), not merely one with a key in
  `P.lines`/`P.val` (`ppSvcsOf`). An RCN line added and never filled, or a line whose figures were all removed, would otherwise
  zero that service's budget silently -- Brad's "never a silent zero". A named service in a year the position logs (for any
  service) but with nothing of its own in that year reads the position's $0 for it: a zero is not stored as a cell
  (`ppSetV` deletes it), so a blank and a typed 0 cannot be told apart, and the contract's rule is kept.
- **Over and the Needs attention entry apply to an untagged plan too** (against the board's own base): "over budget authority".
  The box always opens; it names the source per year.
- **N in "🏛 N over BES28"** counts year × service × lane cells that are over.
- **Funding Streams** carries the UPL by service under each lane's *Remaining* column (UPL is part of what remains, never more:
  held ≥ drawn), labelled `UPL · <service>` under a section line, so no row after TOTAL is mistaken for a service row.
- **The 1-N tab and the FYDP tab** carry one line per lane (discretionary, mandatory) rather than one line, so the figure is by
  service AND lane.
- `c.from` still records the tag the plan carried before the lock (it would otherwise always equal the lock's key now).
- `D$` at the position's read is the door; the final `Math.max(0, D$(v))` is `applyBudget`'s own and stays. With both, a
  mutation removing either one alone is equivalent, so neither has one (the whole-dollar check holds both together).
- The end-of-opening `baLiveAll()` is redundant with `applyStore`'s (every boot path lands there), kept as the contract asks and
  as a belt for paths that might not; no mutation on it (it would be equivalent).

## Checks

All three new blocks are in `tools/export-audit/audit-board.mjs`'s W3 slot, on one fixture (`w3Board()`: three years, three
services, the board's own base, adds in both lanes, a BES28 position with a $K service, a service and a year it does not log,
FY27 Splits over-holding USAF discretionary by $50 and AFRC mandatory by $100, FY28/FY29 on the lane walk). Every expectation is
a literal worked out by hand from the fixture. **Each fails on `d732259`** (run there with `BOARD=` the slot commit's board: 10
failing checks, every block failing or throwing; the untagged CONTROL alone passes):
- `v2.12 W3 — every year’s budget authority is read from the PPBE position, live (item 134)` -- untagged (CONTROL), tagged
  through `cycSetWorking`, each year's stored cache, the own base never overwritten, `BA_SRC`, the lane walk, the Spruills,
  `ppSetV` on another year and on the year on screen, split/unit toggles (CONTROL), whole dollars and the 0 floor, the $K
  conversion and its undo, a load (`applyStore`), retag, untag, a line removed, a placeholder line, the position deleted, Budget
  Management tagged and untagged, save → reopen (same years), save → reopen → save (the same state, clocks aside), a file with a
  stale FY28 cache (live on opening, nothing marked unsaved), a year saved by an older build saved back exactly as read.
- `v2.12 W3 — the fit to the position: over, unallocated and UPL per year, service and lane (item 134)` -- BA, held, drawn,
  over, unallocated, UPL for FY27 and FY28 both lanes, the years and the over count, both over lists with their marks, nothing
  reduced, the ◨ switch, the box's sentences and year lines and UPL column, Go to it, Needs attention (and gone once reduced),
  the board's UPL line (after the last row, not a row), Funding Streams / 1-N / FYDP Spend Plan read from the workbook bytes
  (`xlsxRead`) with every TOTAL still the sum of its rows, and a board with no added funding carrying no UPL line (CONTROL).
- `v2.12 W3 — a lock keeps the position it read; only the working plan reads live (item 134)` -- tag first, the projection
  under the tag, `from`, the lock's copy, its FY27 UPL, the position moved after the lock (working plan moves, lock does not),
  the view every year, the fit box in the view, leaving, a lock before v2.12 (no `c.pos`) reading its own bases in its view.

Existing checks changed on purpose (each with a `// v2.12 W3:` comment):
- `audit-other.mjs` v2.10 A, 'the left menu': the FYDP flyout's calls now include `toggleFit` after `toggleP2`.
- `audit-board.mjs` v2.00 menu block, 'contents': the same list.
- `audit-recon.mjs` 'v2.00 (U10) …': its plan is tagged PB27 and its position logs USAF FY27 $1,000, so USAF's budget is that
  figure: R is funded $227 (was $630), AV $1,327 (was $1,730), the deltas 427 / 994 (were 830 / 1,397).

Browser checks (each names W3's item 134 in a comment):
- `tools/panels-render.mjs`: `fitOpen` in `FALSE`; `SPECIAL.fitPanel` opens it with an over drawn (FDC_SEED's BES28, $1 for the
  first service, a Split).
- `tools/left-menu.mjs`: `toggleFit: 1` in `WANT`, the count 70.
- `tools/standards-check.mjs`: a drive measuring the fit box with an over and its Go to, with a `coverage` record.
- `tools/layout-fits.mjs` **R**: the box and the UPL line read whole, 1920 to 800, Harbor and Midnight, both fonts.
- `tools/keyboard-reach.mjs` **U**: Needs attention's 🏛 entry by Tab and Enter, Esc back on it; FYDP ▸ then the item by
  Enter; Tab to Go to it, Enter closes and selects.
- `tools/dialogs-keyboard.mjs` and `tools/menu-paths.mjs` take the box and its menu path from the page (the backdrop's
  `toggleFit()`, the flyout) with no change.

## Mutations

45 new in the W3 slot (`v212-w3-*`); 4 retargeted (`cycle-lock-no-reference`, `v199-cyc-no-list`,
`v202-89-lock-keeps-nothing`, `v210-a-not-in-render`), each with a `// v2.12 (item 134): retargeted …` comment; none retired.
`mcount`: 2,844 entries, every one matching once. Proofs: `recovery/v212/proofs-W3.json`, `recovery/v212/proved-W3.jsonl`
(results below).

**49 proved, 49 CAUGHT** (`JOBS=1 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py recovery/v212/proofs-W3.json
recovery/v212/proved-W3.jsonl`; every check passed on the clean board first). The first run had **3 SURVIVED** --
`v212-w3-refresh-linedel`, `v212-w3-refresh-unit`, `v212-w3-refresh-unit-undo` -- because their checks read only the year on
screen, and the year on screen is applied again whenever the board draws (`fitReadYear` puts it back through `applyState`), so a
writer that forgot `baLiveAll()` still looked live there. The checks now also read FY28's stored budget (ANG $7 typed into FY28
for the $K pair, removed after; FY28 ANG back to the board's own 410 / 110 when its line goes), and all three are CAUGHT.
`v212-w3-fit-screen-year-only` was first caught only by a throw (`F.years[2028]` undefined inside the check's argument); the
check's helper now returns "FY28 is not in the fit" and it is caught by 4 failing checks, no throw. Four more are caught by
failing checks with a throw beside them (`v212-w3-lock-tag-dropped` 5, `v212-w3-lock-no-pos` 2, `v212-w3-held-is-drawn` 8,
`cycle-lock-no-reference` 3) -- each has at least one real mismatch before the throw.

## Runs (on the final tree unless said)

- jsdom, one at a time, whole: audit-board (8 GB) ALL CHECKS PASSED (and again after the last check edits); audit-other (4 GB) passed; audit-import (8 GB) passed; audit-recon (8 GB) passed (the first whole run failed 4 checks,
  all U10, moved as above); audit (excel), legacy-fsrc, audit-hostile, audit-ui, boot-same passed; audit-inject passed after one
  fix -- its K5 source pin `const reqs=Object.create(null), order=[];` (fydpBookApp) had been rewritten by W3's `upl` map, which
  is now declared on its own line so the pin reads as before.
- On `d732259` (`BOARD=` the slot board): the three W3 blocks fail (10 failing checks; the untagged CONTROL passes).
- Stages: `npm run check` all passed (49 boxes); defects 13/13 guarded; coverage:money 27/27; money-map holds (322 cells, 119
  proven, 202 n/a, 1 open, v2.04's); trace every link holds (15 surfaces, 77 cells); fuzz nothing lost (seed 42168622);
  verify:file --selftest passed; mcount 2,844 / 2,844 once.
- Browser: chrome, csp, controls, inspector, toolbar, editors, colours, menus, panels (fitPanel opens with an over), frames,
  hostile, keys (U passes), dropdowns, dialogs (48 boxes opened), leftmenu (70), standards (0 findings), pmosave, pmoyears,
  pointer -- all passed; layout: only the carried D ×8 (the same tops as recorded: 323 / 420 px), R passes.

## For the integration

- **Slots.** Only W3's slots in `audit-board.mjs` and `mutate.mjs`; outside them: the two flyout expectations (audit-other
  v2.10 A, audit-board v2.00 menu) and the U10 recon block's figures.
- **render() list**: `fitBody();` between `ppBody();` and `fdcSync();` -- `v210-a-not-in-render` retargeted to that list. If W1
  or W2 add a body there, retarget again.
- **Needs attention**: W2 adds kinds to `attLists`/`ATT_KIND`/the posture line. The 🏛 entry is a separate `fitE` prefixed to
  `att`, so the `att=` line is the only shared one (W3 changed its first line to `const att=fitE+(N.n? …`).
- **The guide's Needs attention list** (t-alloc) is W2's to update; W3 did not touch it (the 🏛 entry is in W3's own section).
- **layout-fits** R and **keyboard-reach** U are appended after O and R; W1/W2 append P/Q and S/T at the same place: expect a
  textual conflict, both kept.
- **left-menu** count: 70 with W3 alone; add W1/W2's own.
- **money-coverage / money-map**: `applyBudget` and `fitModel` registered; `money-map.json` gains checks `w3.live`, `w3.fit`,
  `w3.lock` and two surfaces; `tools/money-map.md` regenerated (322 cells: 119 proven, 202 n/a, 1 open -- the open one is v2.04's).
- **W2's FYDP STOVL join** touches `fydpBookVal`; W3 adds `upl` to `fydpBookApp`'s return and `fydpUplRows` in
  `fydpBookSheets` (after the appropriation block only). They should not overlap.
- **Fixtures that tag a position**: with W3 the budget reads it. audit-other's FDC blocks and keyboard-reach/layout-fits/
  panels-render pass as they were; fydp-frames passed. audit-recon's U10 block was the one fixture whose figures moved.
- **audit-inject's K5 pins** read lines W3 sits beside: `fydpBookApp`'s `const reqs=Object.create(null), order=[];` must stay
  whole (W3's `upl` map is on the next line). Run `audit-inject` after merging, and check its source pins against any line a
  workstream rewrote.
- **The year on screen hides a missing refresh**: every render re-applies it (`fitReadYear`'s `finally`). A check that a writer
  refreshes the budget must read a year NOT on screen, as the W3 block now does.

## Known gaps

- Another appropriation's stored caches (read by this board's Spruills and the live view) are as that appropriation's board
  last saved them. A position written into another appropriation's storage from here (an appropriation package) is live there
  only once that board opens.
- A PMO copy reads its positions live too; positions edited in a copy do not travel back (as before).
- The live view's peers and `svcHeldBy` read stored caches, which are now live for this board's years; nothing else changed there.
