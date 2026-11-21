# Review group B: phone, print and accessibility (notes for the lead)

Built from the review of 21 Nov 2026 (brief B), the small version each item's checkers and the ranker recommended. Nothing
here changes a figure, a saved file, the workbook or a picture. Every check is in `apex/test/review-b.test.mjs`; run with
`REVIEW_B_HTML=<the built apex.html of d940cbb>` it fails on every item (39 of 56 checks fail there; all 59 pass on the
sources). The lead folds these into CONTRACT and README.

## I13 My PMO, Unfunded and SRRB scrolled sideways on a phone (§38, restores it)
Phone-only CSS, written for `#uiMain .findbar` so it reaches the light-sheet pages (Unfunded, SRRB) as well as `main.ov`:
a picker's label may wrap (`white-space:normal; flex-wrap:wrap; min-width:0; max-width:100%`) and the picker is no wider
than its card. Measured on the invented view-only copy: My PMO was 28/58/98 px over at 390/360/320, Unfunded and SRRB 27 px
at 320; now 0 on every page at 390, 360 and 320. The test uses a 32-character office name and measures 320 px too.

## I28 Wide lists lose the row's name on a phone (§38's pattern, extended)
Phone-only CSS, no column moved (§20.2 and §37 fix the column order; moving columns on a phone would be a different page).
The requirement is pinned while scrolled sideways on Requirements, My PMO, SRRB and Unfunded (Unfunded's Rank scrolls away
under it), filled, at most 10em wide. The Summary pins its Appropriation (a fixed 88 px) and the FY beside it. A pinned
cell sits a pixel or two over its neighbour and draws its edge inside itself: a collapsed border and an outside shadow are
painted under the cells scrolling past, which showed a sliver of their figures at the seam. The "answer column a second
time under the name" half of the proposal was not built (it changes the row markup group A is working on; the ranker
named pinning only). For CONTRACT §38: "A wide table keeps its first column ..." now also names the lists and the Summary.

## I31 An opened Unfunded line had to be dragged sideways to read (§37's words unchanged)
The opened line's words are wrapped in `<div class="udet">` (the text is unchanged, so the tests that read it still pass).
On a phone that box is held to the list's visible width and pinned at its left (`position:sticky`), and the empty rank cell
before it is not drawn, so the sentence wraps on screen. One figure to a line and moving or folding the charts were not
built (§37's order stays, as the ranker said).

## I61 The keyboard's place could not be seen on the menu (§25 left the ring navy on the navy menu by accident)
`nav.views :focus-visible` draws the ring in the menu's light ink (`--onAcc`, 10.3:1 on the navy); the phone's Menu button
draws it inside its edge (`outline-offset:-4px`), since outside it would sit on the light page at about 1.4:1. The stale
"orange clears 3:1" comment is corrected. The test measures the ring's colour against what is behind it (3:1), at 1366 px
on a menu item and at 390/360 on the Menu button.

## I67 Picker and text-box edges under 3:1 (follows §25's control edge)
`main select` and `main input[type=text]` take `--sedge` (#627185, §25's control edge) in place of `--grid`. `--grid` is
unchanged, so the tables' lines still match the workbook (§18). A picker's edge on the sheet: 2.26:1 before, above 3:1 now.

## I34 Printing cut the Summary's Status column and faded it
- `@page{size:letter landscape}` (a separate rule; §46's print rules and the CUI margin boxes untouched). Chromium's print
  window then offers no portrait; Publish PDFs were already landscape (§33.4).
- In print, `print-color-adjust:exact` on the sheets' title bars, header rows, TOTAL rows, closed months, status fills, the
  late/awarded chips, the Unfunded group rows and swatches, the calendar's headings and the charts, as §18.2 already does for
  the Overview. Colours are kept, never turned into "dark words on white" (that would reverse §18.2).
- The printed line (`#uiPrintHead`, §18.1 SCR2-2) now ends with what the view's own pickers and Find box narrowed it to:
  "… · Picked on this page: Choose your PMO Air Vehicle (AV) · Find “Engine”". Read off the pickers as drawn
  (`ui_printPicks`, `UI_PRINT_PICKS`), on each draw, each Find/Unfunded/SRRB redraw, and on `beforeprint`. A picker on All
  says nothing. The Summary printed on Letter landscape fits on one page with its colours.

## I35 Column headings scrolled away on the long lists (as §25 does for the Calendar)
`ui_layout` marks a list's box (`.fsheet.tw`: Requirements, My PMO, Unfunded, SRRB) `.fit` when the table fits it and the
top is pinned; at 641 px and wider such a box shows its overflow and its headings stick under `--topH`. A list wider than
its box keeps its sideways box, and a phone is exactly as before (§38). `--theadH` counts the stuck headings, so the
keyboard's place is not hidden under them (WCAG 2.4.11, SCR2-1). `ui_ufrRedraw` and `ui_srrbRedraw` now run `ui_layout`
after redrawing, as `ui_findRedraw` already did. Printed, the headings are not sticky.

## I64 No skip link; the title never changed
- "Skip to the page" (`a.skip`, `data-act=skip`) is the first Tab stop, off screen until it has the keyboard; pressed, the
  view itself (`#uiMain`, already tabindex -1) takes the keyboard. Not printed.
- Once there is data, `document.title` names the view: "Calendar - APEX FY2027", and "(view only)" in a copy. With no data it
  is "APEX", as §19 names the page (the two tests that read "APEX" on a fresh page still pass). This goes a step beyond §19's
  "titled APEX": the lead should say so in §19 or §20. The keyboard is not moved automatically when a view is chosen (the
  page puts it back on the control it was on, on purpose).

## I09 The view-only copy's first phone screen (only the notice)
In a view-only copy the plain opening notice ("Opened the plan saved …") is not said; a warning or a refusal from opening is
said as ever, and a keeper's page still says it. About 43 px back on a phone, and the copy's top already says when the data
was uploaded (§30). "First FY" is NOT removed (§35 says it; owner's question). The per-page "All services, both lanes" line
and the place of Export Excel and Help are unchanged.

## I26 Awards by month needed a mouse; late leaned on colour (§26's own rule)
- Under the chart, a table of the same figures (`#uiChMonths`, `table.cht.chmonths`): one row a column of the chart with
  Awarded, Not awarded past its date, Projected and Total, and a Total row. The figures are `SP.chartsOf`'s own columns; the
  Total row is `chartsOf`'s new `sum` (the columns added in the engine, so the screen adds up no dollar of its own). It is a
  real table, so a keyboard, a finger, a screen reader and paper all reach it; on a phone it scrolls in its own box.
- A late part of a bar is hatched over its red (`rect.chhatch`, an SVG pattern), and so is its key. The red stays (§25).
- Not built: the scoreboard (§38 lets it scroll), a headline figure in a chart's name, the burn-up and the Overview.

## I62 PDFs carry no language or display title
The catalog now carries `/Lang (en-US)` and `/DisplayDocTitle true` inside the one `/ViewerPreferences` it had. No
`/MarkInfo` is written: that would claim the pages are tagged, which they are not. The same input still gives the same
bytes (§33.5). Tagging the PDFs, or recording that the view-only copy is the accessible version, is the owner's (and the
508 office's) decision, and the line naming the view-only copy as accessible was not added.

## I08 Help in a view-only copy was the keeper's manual
One guide, filtered (never a second text, so the rules of §15, §17, §23 and §24 are the same sentences in both): in a
view-only copy `ui_vHelp` draws the whole guide and `ui_helpReader` then
- leaves out Importing, Publishing a view-only copy, Moving to a new version of APEX, Manage data and Unobligated
  Requirements (the Data checks' lists, which a copy does not have);
- puts The figures, Finding a requirement, My PMO and the Award calendar, The unfunded list, The Overview and Which rows
  count first, the rest after in their own order (a section added later is kept, last);
- adds a numbered list of the sections under the copy's opening note, each a link that gives its heading the keyboard.
The keeper's Help is exactly as it was (no list). The copy's note (`#uiVoHelp`) stays first; its sentence "the parts of
this Help about those are for the person who keeps the plan" is still true of the few keeper sentences left inside kept
sections (Publishing spend plans' import lines, What this is). 3,126 words in the copy before, about 2,600 now (the page around it included).

## For the lead to reconcile
- Group A changes Requirements, My PMO and Find: I added one call (`ui_printPicks()`) to `ui_findRedraw`, and pinned
  `table.findt th.lab` on a phone. If A changes the list's markup (classes `findt`, `th.lab`, `.fsheet.tw`), the pin, the
  sticky headings and the print picks follow those classes.
- Group C changes the boot note: my only boot change is the one line that skips the plain opening notice in a view-only copy
  (`ui_boot`, after `ui_render()`), plus a `beforeprint` listener there.
- CSS was added inside existing blocks (the phone block, the print block, beside the tree's sticky rule, beside the focus
  rule); the I67 edit changes two existing lines.
- No older-build comparison test was affected, so no switch was added to `10-util.js`.
