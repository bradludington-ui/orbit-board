# v2.09 second review -- clin fixes (notes for the ship notes)

One finding from the second independent review of v2.09 (frozen at `ba3c294`, the same board as the branch head `bc3a0f6`),
area clin, CONFIRMED by a skeptic: `fund-svc-commit-focus-jumps-to-next-svc-row`. It is older than v2.09 (v1.92's
`focusMark`; the same on `9bc5496` and v2.08 `ebe702e`), and it is a write landing on the wrong requirement. Fixed on branch
`v209-rv2-clin` from `bc3a0f6`. BUILD not bumped. The first review's clin fixes (`notes-RV-clin.md`) stand: none of them is
touched.

## What was wrong

After a commit redraws the rows, `focusMark` / `focusRestore` (v1.92) put the keyboard back on "the control standing in its
place", found by its tag and FIRST class, counted in each enclosing element with an id: the row first, then the whole list.
Fund's allocation box on a per-service allocation (`{m:'s'}`, what ↑ Apply grid to row writes) is `class="svcmode"`; a total
typed into it is stored as `{m:'t'}`, so the box drawn again has no class. Nothing in its row matched, and the count across
`#list` took the k-th `input.svcmode` of the whole list -- the NEXT per-service requirement's box:

- Enter left the keyboard on that box (often off screen: `preventScroll`), and the next figure typed and Entered replaced
  THAT requirement's per-service allocation with a total, re-spread by its ask.
- Tab left the keyboard on that requirement's ★; Space then cleared its Mission Critical.
- With no later per-service requirement, the keyboard fell to the page.

Measured in Chromium on `ba3c294` (`npm run pointer G`, real keys and `page.mouse`, at 1366 and 1920, sliding and docked):
the second prime's allocation `{m:'s',[300000,40000,…]}` became `{m:'t', v:520000}`, the figure typed for the first.

**The same rule had two more faces, found while writing the checks** (both older than v2.09, same cause):
- **A control removed handed the keyboard to the one moved into its place.** ✕ on CLIN 0001 from the keyboard removed it and
  left the keyboard on CLIN 0002's ✕ (the next `button.qb` by count), so the next Enter removed that one too (Chromium, every
  layout, on `ba3c294`).
- **A commit that takes the row off the list** (Mission Critical only, ★ cleared from the keyboard) left the keyboard on the
  NEXT starred requirement's ★ -- Space there cleared it.
- **The RECORD panel kept its place in nothing.** `focusRestore` ran between the rows and the panel (`gridAfterRender`), so
  every Enter or Tab that committed a figure in the panel left the keyboard on the page (v1.92 onwards; the first review noted
  it as not caused by the fixes).

## What was fixed

`focusMark` / `focusRestore`, beside the render wrapper:
- **A control with a handler is found again by that handler**, which names the requirement (and the CLIN and the service) --
  the rule W1's press already uses. The handler is read in one place, `ctlH(el)` (new, beside `PTR`), and `ptrSig`,
  `ptrFind`, `focusMark` and `focusRestore` all call it; `focusRestore` finds by `ptrFind` itself. Never by a class its own
  state can change.
- **A control belongs to its requirement's row, or to the RECORD panel while the panel shows that requirement**
  (`focusScope`), and is looked for there and nowhere else: the chain of boxes stops at the row or the panel, the control
  found must be inside it, and the row gone -- or the panel drawn for another requirement (`m.cur`), or the panel a closed
  sliding drawer -- sends the keyboard nowhere. The control after it (Tab, Shift+Tab) may be in the next row, as Tab would
  go; the control found again never is.
- **The place fallback, for a control whose handler says its own state** (the fit chips' `svcFilter=2;render()` becomes
  `svcFilter=-1;render()` once pressed -- v1.92's first example, held by `npm run keys` H) **and for a control with no
  handler**: its place among the controls of its kind, only where its box is drawn again with exactly as many of them. So
  the fit chip keeps the keyboard, and a CLIN's ✕ removed does not hand it to the next ✕.
- **`focusRestore` runs once the rows AND the RECORD panel are drawn** (after `gridAfterRender`, before `ptrAfterRender`), so
  the panel's boxes keep their place: Enter stays, Tab goes on to the box after it.
- `kind` no longer throws where `CSS.escape` is missing (jsdom): a plain escape for the class name instead.

## Decided in the fix (not in the findings)

- **The RECORD panel's boxes now keep the keyboard after a commit**, by the same rule (same control of the same requirement,
  or nowhere). The task asked that they "still keep their place"; measured, they kept nothing on `ba3c294` (Enter and Tab both
  left the keyboard on the page). A one-call move of `focusRestore` after `gridAfterRender`, with three refusals that keep it
  inside the rule: the panel drawn for another requirement, a closed sliding drawer, and the control found outside the panel.
  Checked with the mouse too (`probe2`, scratchpad): typing in the panel then clicking the search box or the left menu ends
  where it did on `ba3c294`.
- **The place fallback stays, narrowed** (exactly as many controls of the kind in the box), rather than going: without it the
  fit chip loses the keyboard after Enter, which `npm run keys` H holds (v1.92). With it unguarded, the CLIN ✕ case above.
- **The row's bound is recorded as an equivalent mutation, not removed.** Every control drawn in a row carries a handler that
  names its requirement (measured in Chromium in Review, Rank and Fund, docked and sliding, the drill and a ⋯ menu open; and
  asserted in jsdom, part 9 of the block below), so a control found again by its handler can only be its own row's, bounded
  or not -- the bound is what keeps the rule ("never another requirement's row") the day a row grows a control with no handler,
  or one naming no requirement, and part 9 fails first that day. `v209-rv2-clin-row-unbounded` carries that receipt.

## Checks

- `audit-board.mjs` "v2.09 second review — clin: after a commit the keyboard goes back to the same requirement’s control, or
  nowhere" (W1 slot), parts: Fund per service, Enter (keyboard stays on Q's box; the next figure is Q's and Q2 keeps
  `{m:'s'}`); Fund per service, Tab (the box found again is Q's); one per-service row, and the last; the row gone (Mission
  Critical only); the rest -- CONTROLs: a total, the rank box at its new place, a CLIN request (Enter) and allocation (Tab);
  the RECORD panel, Enter and Tab; the panel drawn for another requirement (its ✕ Close, whose handler names no requirement:
  nowhere); a closed drawer (never back into it); a control removed (CLIN 0001's ✕: nowhere, not CLIN 0002's ✕); a fit chip
  (CONTROL: keeps the keyboard though its handler now says `svcFilter=-1`); every row control names its requirement (Fund,
  Review, Rank, the drill and a ⋯ menu open). The fixture gives jsdom the browser's `CSS.escape`, which it lacks, so the
  frozen board's count by class behaves there as it does in Chromium. On `ba3c294`: 9 failing checks, every non-CONTROL.
- `tools/pointer-edit.mjs` section G (`--only G`), Chromium, real keys and `page.mouse`, 1366 and 1920, sliding and docked:
  two primes put on per-service allocations by ↑ Apply grid to row pressed with the mouse; in Fund, Enter keeps the keyboard
  on the first one's box and the next figure is the first one's, the second's allocation and everything else unmoved; Tab
  lands on the first one's ★ and Space toggles that one only; the rank box (Enter stays where the row moved to; Tab goes on
  within the requirement); a CLIN's boxes (Enter stays; Tab goes to the next service's box of the same CLIN); the RECORD
  panel's value by service (Enter stays; Tab goes to the next box of the same requirement's panel); ✕ on CLIN 0001 from the
  keyboard (nowhere, not CLIN 0002's ✕). 40 ok here; on `ba3c294` 24 FAIL (the two Fund pairs, the panel, the ✕, every layout).

- Run and clean: `npm run check`; audit-board, audit-other, audit.mjs, audit-hostile, audit-inject, audit-ui whole;
  audit-import slimmed to the blocks that type into a row, the RECORD panel or a box and read the keyboard (v2.00 U40, v1.84
  the copy sends every field, v1.91 copy BAE, the three v2.08 copy blocks); audit-recon slimmed to v2.00 U41 (the one other
  block reading `document.activeElement`). Browser: pointer (all, 277 ok), keys (0 FAIL, H's fit chip keeps focus), dialogs,
  controls, inspector, dropdowns, leftmenu, editors, panels, standards (nothing new), layout (only the 8 carried D).

## Mutations (2,607 targets, each matching once)

- New, 7 (`v209-rv2-clin-*`, W1 slot): `found-by-class`, `restore-before-panel`, `panel-other-requirement`,
  `into-closed-drawer`, `no-place-fallback`, `place-moved` -- each CAUGHT by the block above (`proved-RV2-clin.jsonl`) --
  and `row-unbounded`, declared `equivalent:` with the receipt above (SURVIVED, as an equivalent does).
- Re-proved, unchanged find strings in the render wrapper and beside `PTR`, whose code around them changed:
  `v209-w1-press-keyboard-lost`, `-press-not-delivered`, `-press-delivered-twice`, `-press-back-to-left`,
  `-press-overrides-box`, `-press-not-after-render`, `-row-hold-gone`, `-row-hold-commits`, `-click-opens-panel`,
  `v209-rv-clin-drill-scroll-reset`, `-drill-scroll-one` -- all CAUGHT by their own blocks.
- None retargeted, none retired.

## Known gaps

- jsdom has no layout, so the step Tab takes from the control found again (`tabbables()` reads `getClientRects`) is
  Chromium's: pointer G holds it; the jsdom block holds which control is found again.
- The place fallback is a guess by position; it is bounded (same box, same count, same requirement's row or panel) but a box
  that loses one control of a kind and gains another of the same kind in the same redraw would pass it. Nothing found does.
- Outside a row and the RECORD panel (the Classify grid, a review table, the boxes) nothing bounds the search to one
  requirement: a control is found by its handler (which names its requirement there too) or, failing that, by the place
  fallback, now only where its box holds exactly as many controls of its kind. Not measured there: a commit that takes a
  Classify row off its list should change that count and send the keyboard nowhere, as the ✕ case does; no check holds it.
