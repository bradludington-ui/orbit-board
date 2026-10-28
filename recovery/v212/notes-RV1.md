# v2.12 RV1 -- the review of W1's import: the stored report, the header, the file key, the figures, the tree, and the checks

Branch `v212-fix1`, from `c23e8a0` (`v212-int`: W1, W2 and W3 merged). The findings are the review's kept lists:
`recovery/v212/review-W1W3.json` (R00-R37, its "kept" in order) and `recovery/v212/review-W2int.json` (K00-K17). RV1's are R00-R11,
R25, R26, R30, R33, R35, K08, K12, and R31's import parts (the `t-ace` guide section). Each was read with both skeptics' votes; where a
vote corrected the finding, the fix follows the vote (noted below). Every new check is in the v2.12 W1 slot of `audit-other.mjs`
(after W1's own block), and every mutation in the v2.12 W1 slot of `mutate.mjs`, ids `v212-rv1-*`.

Each check below FAILS ON `c23e8a0` unless it is labelled coverage or CONTROL; run on `git show c23e8a0:prioritization-board-grid.html`
with `BOARD=` set: the four new fix blocks fail 40 checks there, the coverage block passes (as it should: the code was right), and
`audit-hostile` fails 2 (the planted count drawn as code on the Data card, and the new planted row count never seen).

## Per finding

**R08 (BLOCKING), R01, R02 -- text in a stored import report drawn as markup.** The Data card's *Import report…* line summed each
reason's `rows` (0 + text is text) and printed the sum raw, on every redraw, with no click; the report box printed `rep.years` raw in
its "dollars in FY…" line and its year picker. *Changed:* `aceRepOf(set)` (beside `aceRepNewest`) is the one reader of a stored report:
every count a whole number, every figure a finite number under a year key, every list a list, every year a year 1991-2099 -- else
`{state:'bad', why}`, and both the Data card and the box say the report cannot be read (never zeros in its place: a report of zeros is
a plausible default hiding the damage). Text is copied as text and escaped where drawn; every count, year and length the box prints is
`esc()`'d as well (belt and braces: after `aceRepOf` they are numbers). *Check:* "v2.12 RV1 — a stored import report is read, never
trusted …" -- a board file whose estimates carry a text count, a text year, a text figure, a year that is not a year, a list given as
text and a report with no totals, saved with the board's own `buildSavedHtml()` (it passes `inboundCheck`), opened as a teammate's file
is (booted from its bytes) and taken by an ordinary import (`importStores`): no `<img>` from the file on the page, the Data card says
"its import report cannot be read", each report box says so, nothing throws. The hostile sweep (`hostile.mjs`) now plants a 2025ACE,
the newest, whose report carries hostile text in a reason's rows, the kept lines and a year, and hostile row counts in `skip`; the sweep
opens its report box; `aceskipv` joins `MUST_SHOW`. *Mutations:* `v212-rv1-card-trusts-report`, `-box-trusts-report`,
`-repof-counts-any`, `-repof-figures-any`, `-repof-years-any`, `-repof-lists-quiet`, `-card-unescaped-sum` (hostile).

**R07, R10, R30, K12 -- a report missing its totals, or with a list given as text, throws inside render().** *Changed:* the same
`aceRepOf`: such a report is `bad`, the box says so (and names the row counts the estimate recorded, `set.skip`), and render() goes on.
*Check:* the same block -- each unreadable report opened and the board redrawn twice with nothing thrown, and with one open a redraw
still reaches what comes after the box (the Data card's item ticked as open). *Mutations:* `v212-rv1-repof-core-unchecked`,
`-box-bad-unsaid`, `-box-bad-no-counts`. (Per the votes: a cut-short file cannot produce this -- it would not parse -- so only a
hand-edited or crafted file reaches it; the box is modal, so the visible symptom was an empty box and a board that stopped redrawing.)
Also: **the box works `ties` out again** from the figures it prints (`aceRepTies`, one statement shared with `aceParse`), so a stored
`ties:true` beside figures that do not add up is shown as not adding up (`v212-rv1-box-trusts-ties`).

**R00 -- a title the header carries twice read from its first column; a remembered answer re-read by title.** *Changed:*
`aceFindHeader` keeps every column a normalised title heads (`at[n]` is a list). A field whose title, or remembered title, heads more
than one column is asked about in the mapping box, which names the columns ("This file titles 2 columns alike: A, H. Pick the one that
holds it."). A remembered answer is kept as its title (`ACEDB.cols[sig].map`, as before) with the column it was given for beside it
(`ACEDB.cols[sig].at`); it resolves only to a column whose normalised title is the remembered one, and the index only tells apart two
columns that title shares (`memCol`) -- never a position read on its own. An answer remembered by title alone (no `at`, as a board
before this one, or another board's) with two columns carrying the title is asked again. *Check:* "v2.12 RV1 — the header …" parts "a
title twice" and "remembered by title" ($3M subtotal over $1M + $2M: the wrong rollup column keeps $6M). *Mutations:*
`v212-rv1-dup-title-first`, `-remembered-first-of-two`, `-remembered-at-not-kept`, `-dup-unexplained`; retargeted
`v212-w1-remembered-ignored` and `v212-w1-remembered-not-kept` (their finds were rewritten), both re-proved against W1's block.

**R06 -- a second column headed by the same year never read, while the report said every dollar tied.** *Changed:* a fiscal year
heading more than one column refuses the file, naming the year and every column letter, in either order (the votes: placed first, the
copy was the one read). *Check:* the header block, part "a year twice". *Mutation:* `v212-rv1-year-twice-read`.

**R25 -- a renamed optional column never asked about.** *Changed (decided here -- see "For Brad"):* `ACE_FIELDS` says for each optional
field whether it is asked about when no column carries its title: **US/PTN/FMS always** (it decides which lines are partner or FMS);
**CCAR Element always** (each line's CCaR record, which puts a paragraph first in a requirement's WBS picker); **CESk only when the
file has a paragraph at least k levels deep** (read off the WBS column, else the Level column, else every CES is asked), because a
shallow estimate has no CES8 and a CES column beyond the deepest paragraph names nothing; **CCAR Description never** (nothing reads it).
For an optional field the box offers "— this file has no such column —" (and starts on "— choose —": nothing is taken as absent that
nobody said was); the answer is remembered (`ACEDB.cols[sig].none`) and recorded in the report (`rep.none`); left unanswered the file
is refused, naming it. With no US/PTN/FMS column the status line says every row was read as US, and the report's "Not in this file"
line says what each absent column means (`ACE_FIELDS[].no`). *Check:* the header block, parts "an optional column renamed", "no such
column", "CES by depth" (with a CONTROL: a two-level file with no CES3-CES8 is not asked) and "CCAR Element". *Mutations:*
`v212-rv1-optional-not-asked`, `-ces-depth-ignored`, `-none-not-remembered`, `-none-not-read`, `-unanswered-optional-taken`,
`-no-usptn-unsaid`, `-optional-no-none`.

**R05, R11 -- the file key no longer kept the year right before ACE.** *Changed:* `/(?:^|\D)(20\d\d)(?!\d)(?:.*?[^A-Za-z])?ACE(?![A-Za-z])/i`
-- the year four digits not inside a longer number, ACE right after it or after anything ending in a non-letter, no letter after ACE.
That is the R05 skeptic's corrected pattern: the finding's own (`…(?!\d).*?ACE(?![A-Za-z])`) filed "2026 Workspace" and "2026 TRACE" as
2026ACE, which both votes showed. *Check:* "v2.12 RV1 — the file key …": a locked 2026ACE, then six names with 2026 right before ACE
each meet the locked-replace question (Cancel leaves one estimate), and "2026 Workspace", "2026 TRACE", "2026 ACEs" are their own keys.
*Mutations:* `v212-rv1-key-word-boundary` (c23e8a0's pattern), `-key-ace-in-word` (the finding's own pattern).

**R04 -- `aceMoney` read figures out of words and lost signs.** *Changed:* a cell is a figure only when the whole of it is one after
its dollar sign and spaces (`aceIsFig`: digits, commas only between groups of three, one point, an exponent, a sign or accounting
parentheses); the U+2212 minus is a minus; the dollar sign comes off before the parentheses test, so `$(1.5)` is -1.5. Anything else
reads as nothing, and a kept row holding such a cell is named (`ACE_NOTE` `text`: "A year cell holds text that is not a figure: read
as nothing", the cell quoted); a blank cell or a bare dash is the file saying nothing and is not named. *Check:* the file-key block,
part "figures" (lines, named cells, the zero-dollar paragraph, and `aceMoney` on thirteen cells). *Mutations:* `v212-rv1-money-scrape`,
`-money-unicode-minus`, `-money-dollar-paren`, `-money-commas-loose`, `-text-cell-unnamed`, `-dash-named`. The two W1 mutations on
`aceMoney` (`v212-w1-paren-positive`, `-cents-kept`) still match once and were not changed.

**R03, R09, R26, K08 -- an E breakout folded back under its twin's heading.** *Changed:* in `aceTree`'s walk, once a heading on a
suffixed line takes the suffix, every heading below it on that line does too (`on`). Brad's shapes are unchanged (P6.2.2.1E under
P6.2.2E; P6.5.1.2E under Government); a level-5 line whose level-3 name differs, and a breakout from level 2, are now whole branches; and
where the carried heading is itself a line named otherwise, the two names are a conflict, named (the votes' caveat, now a check). The
AV + PSM split reads the tree through `aceLineUp`/`aceWbsUp`, so it follows with no change of its own. *Check:* "v2.12 RV1 — an E
breakout is a whole branch …" (the tree, the paths, the conflict, and `aceGroupSplit`: PSM $810,000 / AV $1,430,000 / shared $0; on
c23e8a0 PSM $10,000). *Mutation:* `v212-rv1-suffix-no-carry`; retargeted `v212-w1-suffix-plain` and `-suffix-always` to the new line.

**R33, R35 -- coverage (the code was right).** *Check:* "v2.12 RV1 — every Support Line Category …": one kept row per map entry (all 14
categories, Depot Activation three ways) with dollars no other row uses, its appropriation, cost element and totals; a later sheet with
the same titles and ten times the dollars (the tie goes to the first sheet); a kept row with a blank US/PTN/FMS cell. It passes on
c23e8a0, as coverage does; it is there for its mutations: `v212-rv1-slc-airframe-dropped`, `-avionics-`, `-engine-`, `-fixedjpo-`,
`-jre-dropped`, `-slc-same-ce`, `-slc-pecte-opn`, `-slc-pecte-ce`, `-slc-fms-sims-ce`, `-slc-pes-sp`, `-slc-pubs-ce`, `-slc-spares-ap`,
`-slc-opn-ap`, `-header-tie-last`, `-blank-us-partner` (the last two are the R35 votes' exact mutations: `n>=best.n`, `u!=='us'`).

**R31 (import parts) -- the `t-ace` guide section.** *Changed:* it now says exactly what is asked (a title missing or heading two
columns; a missing US/PTN/FMS or CCAR Element; CESk where paragraphs reach level k; "no such column" for those; no US/PTN/FMS means every
row is US; an unanswered field or a year heading two columns refuses the file), that a year cell of text reads as nothing and a kept
row holding one is named, that a breakout's headings below the first suffixed one carry the letter too, that the report shows 40 named
rows of each kind on screen, and that a report not in ORBIT's shape is said to be unreadable. (R31's t-ppbe part is RV3's.)

## Changed on purpose in existing checks

- audit-other "v2.12 W1 — …" part 3b (the hand-written workbook): its titles gain `US/PTN/FMS` and `CCAR Element`, cells blank, with a
  `// v2.12 RV1:` comment -- without them the mapping box now asks about both, and that check is about row numbers.

## Mutations

47 new (`v212-rv1-*`), 4 retargeted (`v212-w1-remembered-ignored`, `-remembered-not-kept`, `-suffix-plain`, `-suffix-always`), none
retired. `mcount`: 3,002 targets, every one once (2,955 at c23e8a0 + 47). Proofs: `recovery/v212/proofs-RV1.json` (51 entries: the 47
and the 4 retargeted), results in `recovery/v212/proved-RV1.jsonl` -- see the end of this file.

Not added, as equivalent by construction: removing `esc()` around a count, a year or a length in the report box or the Data card --
after `aceRepOf` they are numbers, so the escape is belt and braces and no mutation of it can be caught.

## For the integration

- **The guide's budget.** `t-ace` grew 441 characters net; the guide is 69,431 characters of audit-import's 70,000 (`v1.86 … size`).
  RV3 edits `t-ppbe` in the same template; together they may pass 70,000 -- check it after merging, and trim (or raise the budget, as
  v2.12 did) on purpose.
- **Shape of `ACEDB.cols[sig]`**: `{map:{field: title}, at:{field: column index}, none:[field], ts, by, file}` -- `at` and `none` are
  new (the contract's `map` is unchanged). A layout remembered before this (map only) is still read; where its title now heads two
  columns it is asked again.
- **The report's shape** gains `none` (the optional fields answered "no such column") and a named-row kind `text`.
- Expected conflicts with RV3: the guide template (different sections; the size budget above), `hostile.mjs` if RV3 plants there
  (mine: one estimate set after W1's plants, one `MUST_SHOW` entry, one sweep step after the tie-out), the suites' and `mutate.mjs`'s
  slots are separate (W1 vs W3).

## For Brad

1. **Which optional columns are asked about** when a file has no column titled so (decided here, from item 132's list and what each
   column decides): US/PTN/FMS and CCAR Element always; CESk only where the file's paragraphs reach level k; CCAR Description never
   (nothing reads it). Each optional question can be answered "this file has no such column", remembered for the layout.
2. **A fiscal year heading two columns refuses the file** (rather than asking which to read): no ACE layout seen has one, and the
   message names the year and the columns.
3. **A year cell of text** (TBD, a date, "see note 3") reads as nothing and its row is named in the report; a bare dash is silent.
4. **A stored report not in ORBIT's shape** is said to be unreadable as a whole, never partly shown.

## Proof results

`JOBS=1 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py recovery/v212/proofs-RV1.json recovery/v212/proved-RV1.jsonl`:
**51/51 CAUGHT** (the 47 new and the 4 retargeted), 0 survived, 0 not applied, 0 crashed, none caught only by a throw. Every check was
first run clean on the unmutated board (6 audit-other slims, audit-hostile whole). `mcount`: 3,002 entries, 3,002 once.

## What was run, on the final tree

- `npm run check`: all checks passed. `mcount`: 3,002 / 3,002 once. `node tools/money-map.mjs --check`: holds (322 cells, 119 proven,
  202 n/a, 1 open; the report is current -- no cited check moved, so the .md was not regenerated). `npm run coverage:money`: holds
  (27/27). `npm run defects`: holds.
- Every suite whole, one at a time (audit-import and audit-recon at 8 GB, the rest at 4 GB): boot-same, audit (export), audit-other,
  audit-board, audit-import, audit-recon, audit-hostile, audit-inject, audit-ui -- ALL CHECKS PASSED each; legacy-fsrc its own line.
- Browser: `menus`, `panels`, `dialogs`, `leftmenu`, `keys` (S included), `standards` (0 findings, nothing new), `hostile` (Chromium:
  "Nothing a file can carry runs when the board draws it"), `layout` (P passes; only the carried D ×8 fail).
- Not run (nothing this change reaches): `controls`, `editors`, `dropdowns`, `pmosave`, `pointer`, `pmoyears`, `csp`, `toolbar`.
- On `c23e8a0`'s board: the four RV1 fix blocks fail 40 checks; the coverage block passes; audit-hostile fails 2.
