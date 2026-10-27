# v2.09 review -- clin-pointer fixes (notes for the ship notes)

Three findings from the independent review of v2.09 (frozen at `9bc5496`), area clin-pointer, each CONFIRMED by a skeptic.
Fixed on branch `v209-rv-clin` from `9bc5496`. BUILD not bumped. Item 125 is W1's (`notes-W1.md`); Brad's decisions there
are unchanged.

## What was fixed

1. **A redraw turned typing that was taken back into a write** (`heldcommit-commits-unchanged-figure`; new in v2.09, with an
   older variant). Measured in Chromium on `9bc5496`: Fund's box on a per-service allocation `{m:'s'}` (what ↑ Apply grid to
   row writes), End, a digit, Backspace, a redraw (a Live view tick), Tab -- `heldCommit` fired a change for a box holding
   exactly the board's figure, `setAlloc` stored it as a total, and `svcAlloc` re-spread it by the ask: USAF $1,000,000 became
   six services' shares and the lane draws moved with it. The same keys converted a lane-walk requirement to a Split through
   the RECORD panel's Disc box, and recorded a CLIN override equal to the board's data (the ✎ mark). The other way round --
   a redraw while the digit is there, then Backspace -- the browser fired the change itself, because the hold's `focus()`
   after setting the value makes the put-back figure its starting point; the Disc box did that in v2.08 too.
   **Fix:** one rule at a document capture `change` listener, beside `heldCommit`: a box the hold put back (`__wasHeld`, set
   in `inspHeldBack`) whose change leaves it holding the figure the board drew into it (`defaultValue` -- the hold sets
   `.value`, never the attribute) is not passed on. It answers both orders, since `heldCommit`'s own change goes through the
   same listener. `heldCommit` is unchanged, so a figure typed whole, redrawn, then left is still applied.
   *Why not the reviewer's one-line change in `heldCommit` as well:* with the listener in place it is redundant -- the
   mutation undoing it SURVIVED its check, correctly, because the listener stops the same change. Two guards for one rule,
   one of them unprovable, is what this project avoids; the listener alone is proved from both sides (below).
2. **The CLIN drill went back to its left edge on every redraw** (`drill-scroll-reset-loses-press`; older than v2.09). At 1366
   sliding and 1920 docked the drill (1316px on the fixture) is wider than its row (1052 / 1020), so ✕, WBS and RCN / EEIC
   are reached by scrolling it. A figure typed, the drill scrolled, a button pressed: the change redrew the rows on the
   mousedown, the new drill started at 0, the button came back ~200-300px right of the pointer, and the press was lost.
   **Fix:** the render wrapper reads each open drill's `.cscroll` `scrollLeft` by its row's id before the rows are drawn and
   puts it back on the new drill of the same row, in the `finally`, before `inspHeldBack`, `focusRestore`,
   `gridAfterRender` and `ptrAfterRender` -- so the control pressed is under the pointer again when it comes up and W1's
   delivery (`L.contains(on)`) clicks it. Keyed by the row element's own id (`getElementById`, no selector built from a
   name); a list of pairs, not an object keyed by a requirement id.
3. **Fund's allocation box on a per-service allocation was crushed by its SVC tag** (`fund-alloc-box-squeezed-by-svc-tag`;
   older than v2.09, same on v2.08). `.acts > *{width:100%}` gave the tag the whole 112px cell and `flex:none` kept it there:
   the box was 14px wide under ★, showed no figure, and a click on it turned Mission Critical on.
   **Fix:** the tag sits on the box's top edge (`position:absolute`, sized to its word, `pointer-events:none`, the box's own
   background behind it), so it takes no width from the box: the box is exactly the box every other Fund row has. Measured:
   a nine-digit figure (704,562,659) whole at every Fund width -- 112px (1366, 1920 sliding and docked), 88px (1600 docked,
   1000) -- and the click at its centre goes into it.

## Decided in the fix (not in the findings)

- **The SVC tag moved onto the box's top edge rather than staying beside it.** The reviewer's CSS (tag `width:auto`, input
  `flex:1`) was measured: it shows up to eight digits at 112px and cuts a nine-digit figure by 1px; at the 88px Fund column
  (1600 docked, 1000) it cuts even 300,000. Beside the box, no tag fits 88px with a nine-digit figure. On the edge, the box
  keeps its full width at every layout. It is a placement change of a 3-letter tag, nothing else on the row moves; in
  compact density the tag reaches ~3px into the row above (cosmetic, it lets clicks through). Brad may prefer it
  elsewhere; it changes no figure and no control.
- **One rule for both orders of the taken-back case** (see 1): the listener, not the `heldCommit` condition the reviewer
  proposed.

## Checks

- `audit-board.mjs` "v2.09 review — clin-pointer: a figure taken back writes nothing, the drill keeps its sideways scroll,
  Fund’s SVC box is whole" (W1 slot), four parts: *taken back, then redrawn* (Fund box Tab and Enter, the RECORD panel's Disc
  box, a CLIN request from the data; CONTROL a figure typed whole is applied); *redrawn, then taken back* (the change
  Chromium fires on leaving is fired here; CONTROL typed on to another figure goes through); *drill scroll* (two drills,
  each restored to its own, a press after typing keeps 201; CONTROLs the press delivered once, a reopened drill starts at
  0); *SVC tag* (the rule that applies to the tag: absolute, auto, none). On `9bc5496`: 9 failing checks, every non-CONTROL.
- `tools/pointer-edit.mjs` section F (`--only F`), Chromium, real keys, wheel and mouse: F1 the three boxes, both orders,
  Tab and Enter, CONTROL typed whole; F2 1366 sliding and 1920 docked, a figure typed, the drill wheeled to its end, ✕
  (declined) and a CLIN's WBS pressed; F3 five layouts, the prime after ↑ Apply grid to row pressed with the mouse and a
  nine-digit `{m:'s'}`. 43 ok here; on `9bc5496` 31 FAIL (every check but the CONTROLs and "nothing threw"). The whole tool:
  237 ok.
- Run and clean: `npm run check`; audit-board, audit-other, audit.mjs, audit-hostile, audit-inject, audit-ui whole;
  audit-import slimmed to the typing blocks (v1.84, v1.91 copy BAE, the three v2.08 copy blocks); browser: pointer (all),
  keys, controls (62 = 62), inspector, layout (only the 8 carried D), standards (nothing new; a first run during an edit
  showed one transient contrast finding on the parchment `Spend plan basis` button, not on `9bc5496` and gone on the rerun),
  editors, panels.

## Mutations (2,551 targets, each matching once)

- New, 8 (`v209-rv-clin-*`, W1 slot): `taken-back-passed`, `taken-back-any-figure`, `taken-back-drawn-is-held`,
  `held-not-marked`, `drill-scroll-reset`, `drill-scroll-one`, `svc-tag-beside`, `svc-tag-catches-click`. Each CAUGHT by
  the block above (`proved-RV-clin.jsonl`).
- Re-proved, unchanged find strings, the code around them touched: `v209-w1-held-left-silent`, `-held-not-noted`,
  `-held-enter-silent`, `-row-hold-gone`, `-row-hold-commits`, `-press-not-after-render` -- all CAUGHT by W1's block.
- None retargeted, none retired.

## Known gaps

- jsdom cannot see layout or fire a trusted change: the block stands in for Chromium's events where Chromium fires them,
  and reads the tag's CSS rule; the widths, the wheel and the clicks are pointer F's.
- The fixture of every other browser check (`tools/ia-fixture.mjs`) carries no per-service allocation, so layout and
  standards do not see the SVC tag; pointer F3 does, at five layouts.
- The hold can still keep typing over a figure a Live view pull changed underneath it (W1's and v2.08's design, not this
  finding): typing taken back to the OLD figure is then a real change against the new one and goes through.
