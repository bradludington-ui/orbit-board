# Review group C: figures, words and what a reader is told

Notes for the lead to fold into CONTRACT.md and README.md. Every check is in `test/review-c.test.mjs`; each was run with
its fix undone and failed, then passed with it.

## I78 The Charts scoreboard's share (§26)
- `SP.chartsOf`: every requirement whose block has an OSD goal is in the office's share, whatever the sign of its plan.
  The share is Σawarded / Σplanned of those requirements, so a deobligation (a plan below zero) counts, as on By PMO and
  My PMO. Before, `r.planned > 0` left it out (Training Systems read 14.97% where its own columns give 13.41%).
- The goal is still each block's goal weighted by the requirement's plan, now by its plan above zero only (a negative
  weight would bend the goal).
- §26's rule stands: a requirement whose block has no goal counts in Plan and the count, not in the share or the goal. The
  card note now says so: "A requirement in a year with no OSD goal counts in Plan but not in the share."
- §26 needs one sentence: "A requirement whose plan is below zero (a deobligation) is in the share like any other."

## I81 The lane switch and §45's Mandatory lines (§37, §45)
- `SP.ufrView`: with the Filter's Mandatory lane off, the Mandatory lines are left out of the list, the tiles, both charts
  and the total. The tracker's lines have no lane and stay as they are (§37). Ranks are given before this, so a hidden
  line keeps its number. `tiles.mand.hidden` counts the lines the switch took off.
- With the switch hiding every Mandatory line, the fifth tile reads *Hidden* "by the Filter's Mandatory lane switch: N
  plan events". With no line left at all, the empty-page sentence says how many the switch hides.
- The page note reads "The Filter above (its services; its lanes for the Mandatory lines only)".
- The Discretionary lane switch changes nothing here.

## I79 The Mandatory card says it is the whole pull (§45)
- With the switch on (the keeper's card and a view-only copy's), the card says "in the whole CCaR pull ($X)" and adds
  "the Mandatory, not received tile counts those the Filter and the pickers show". The figure stays the whole pull's (the
  card is outside the part Find redraws, so it cannot follow the filters). The Off wording is unchanged.
- `test/ufr-mandatory.test.mjs`: the view-only card's expected wording was updated to match.

## I83 "Requirements" counts, split where they differ (§33, §37, §45)
- PDF break page section line: "48 requirements (10 unfunded only, no plan event) | Required …" when a section holds CCaR
  records on the unfunded list only. `SP.publishData`'s section carries `ufrOnly` (how many). The owner's definition of a
  requirement (one CCaR record) is unchanged.
- Unfunded page, with Mandatory lines listed: the Total unfunded tile reads "6 lines (2 requirements on the tracker, 4
  Mandatory plan events), 2 appropriations", and Exec ready "2 of 6 lines". With no Mandatory line shown, the words are
  as before. `test/ufr-mandatory.test.mjs`'s expected tile words were updated.

## I82 The PDFs' header is the data's date (§30, §33.4)
- Every page's header line was "Data as of: <print day> | Data through Oct-2026". It is now
  "Data uploaded 21 Nov 2026  |  Data through Oct-2026  |  Printed 12 Dec 2026": the day of the OLDEST CCaR pull's import
  (§30, a figure is only as fresh as the oldest pull), then the month, then the day the PDF was made. With no pull, the
  print day alone.
- `ui_pubCtx` gives `dataDay` (`SP.uploadAge`'s `oldest`); the stoplight page's upload note also says the oldest pull
  where pulls came in on different days.
- `test/publish.test.mjs`: the three checks that quoted "Data as of:" were updated (approved wording change).

## I84 The burn-up says what its line leaves off (§26)
- The key reads "Actual through Oct-2026" (was "Obligated to date").
- The card note no longer says the line is the Obligation % "as its slide block prints it" (the slide's Total counts more);
  it says "month by month, as its slide block's months print it".
- Under a block whose Actual Execution includes rows dated after the Data through month, or with no date (§4.5: counted
  as Obligated), one sentence after the gap: "Plus $X ($M) of Actual Execution dated after Oct-2026, which is not on this
  line: the slide block's Total, which counts it, is 7.27%." (`ui_chOff`, from the block's `execAfterAsOf` and
  `execNoDate` and `SP.slideOf`). No figure changes.

## I15 "CCaR plan" where a BAE report is loaded (P4-2 extended; §14, §33, §36)
- With a BAE report loaded: the PDF section line reads "Approved (CCaR plan) $…"; the Unfunded page's opened line reads
  "CCaR plan $…" where it said Approved. The PDF column headings and §36's heading are unchanged.
- Under each appropriation page's Unobligated Requirements bar, with a report loaded: "These add to $X ($M), the CCaR plan
  less Obligated; Unobligated in the table above is the BAE report's Approved less Obligated."
- With no report nothing is worded differently.

## I02 An appropriation's Unobligated lists are folded (§5, §31, §36)
- On O&M, Full Fund, Initial Spares and OPN each block's list is one native fold (`details.nafold`), closed. Its bar is the
  heading as before ("Unobligated Requirements — O&M FY2027"), with "450 items, $X ($M). Press to open the list." beside it.
- Every item stays in the page (§5: no cap); the browser's find opens the fold at a match. Opened, a fold stays open for
  the visit (`UI_NA_OPEN`), never in the file. Printing opens every fold first and closes them after.
- Slide blocks and By PMO are as they were.
- `SP.NA_FOLD` (10-util.js) is false in the harness's older-build line, so the "drawn as before §14" comparison in
  `screens-bae.test.mjs` still compares like with like.

## I36 Show everything, and a switch left off said on opening (§10, §11, §20.3)
- Whenever a switch is off, a **Show everything** button sits in the Filter beside the shown line; it turns every switch on
  (this browser's view, as any switch) and puts the keyboard on the Filter button.
- Opening a page whose remembered switches are not all on adds one sentence to the opening message, by what is OFF:
  "This browser keeps the Filter's switches from an earlier visit: Mandatory is not counted, and ANG is left out. Show
  everything, in the Filter, counts it all again." (warn colour). `model.shown.text` is unchanged everywhere.

## I06 The boot note's late line (§11)
- `src/shell.html` and `ST_BOOT_NOTE`: inside the one boot-note paragraph, a second line shown by the stylesheet after 4
  seconds, with no script: "If this stays, download the file and open it in Edge, Chrome or Safari." The screens replace
  the note when they draw, as before; a saved file carries the same note.

## I10 A view-only copy says when it was published (§30, §35)
- In a view-only copy, the Data through line reads "Data through Oct-2026 · First FY 2026 · Published 21 Nov 2026" (from the
  copy's `savedAt`, stamped when it is made). The View only mark is unchanged.
- Its browser tab reads "CUI - APEX · data through Oct-2026 · published 21 Nov 2026".
- Its upload pill's tooltip, past a week, says "ask whoever keeps this plan for a newer copy" (the keeper's still says to
  import a newer pull). No "newest copy is at" field, no "next update", no "published by".

## I58 The tab title (§9)
- `src/shell.html`'s title is "CUI - APEX". No file-name or handling change (owner: leave as is). Pictures stay unmarked
  (§41). `ui.test.mjs` and `overview.test.mjs` expected "APEX"; updated.

## I39 An older pull imported by mistake (§11, §30)
- `SP.applyImport`: a new pull whose Obligated (rows CCaR marks Actual Execution) for a fiscal year falls by more than
  $5M AND more than 5% from the pull it replaces is asked about with the import's existing question (§11), naming both
  pulls' files, the import day, both figures and the fall, and "Import anyway?". Cancel changes nothing and the message
  says why. A smaller fall (an ordinary deobligation) asks nothing. A pull already asked about for shrinking is not asked
  twice. (`ST_OBL_FALL`.)
- The upload pill's tooltip names each pull's files beside its import. No note for readers.
- The threshold was first $1M and 1%; the e2e fixture's legitimate second pull fell $3.32M (3%) and was asked about, so it
  was raised to $5M and 5%.

## I22 Menu, Filter and Manage data draw only the bars (§20.2, §38)
- `ui_renderBars()`: the Menu button, the Filter button and Manage data redraw the top bar, the menu and the Filter, then
  measure the top and put the keyboard back; the view under them is not rebuilt. A full redraw already waiting is done
  instead. The tree half (redrawing one block's table) was not built: it needs the per-block control registry reworked.

## Proof that each check bites
`test/review-c.test.mjs` (56 checks) was run on a copy of the sources with each item's fix undone (a script in the
builder's scratch folder, not committed). With every fix in place: all pass. With one undone, that item's checks fail and
nothing else does: I78 2, I81 2, I79 2, I83 3, I82 2, I84 2, I15 1, I02 1, I36 1, I06 4, I10 2, I58 2, I39 3, I22 3.

## Existing tests whose expected words changed (approved wording changes)
- `publish.test.mjs`: the header line (I82; its ctx now passes `dataDay`) and the section line's "(2 unfunded only, no
  plan event)" (I83).
- `ufr-mandatory.test.mjs`: the total tile's words (I83) and the view-only card's "whole CCaR pull" (I79).
- `view-only.test.mjs`: the Data through line ends "· Published <day>" (I10).
- `overview.test.mjs`, `ui.test.mjs`: the tab title is "CUI - APEX" (I58).
- `harness.mjs`: the older-build line also sets `SP.NA_FOLD = false` (I02), on a line of its own.
