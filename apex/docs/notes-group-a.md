# Review group A: finding things (notes for the lead to fold into CONTRACT and README)

Built from the review's brief A, in the small version the ranker and the two skeptics recommended. Every check is in
`test/review-a.test.mjs` (63 checks). Each item's check was shown to fail with the mistake planted back in (the fix undone
in `src/90-ui.js`, one at a time) and to pass with the fix; the planted runs are listed at the end. No figure, sheet, PDF,
picture or saved file changes. People's names (PM/TPOC, contracting POC, material lead) stay in the file and the workbook as
before and are never read onto a screen or into a search.

## I01 One office for My PMO and By PMO (touches §21.1; §21.2, §26, §37, §44 unchanged)

- My PMO and By PMO share one office: both start on the office remembered in this browser (`localStorage` `sfcbsp.pmo`, as
  My PMO already did), and a pick on either, or an office pressed on the Charts' scoreboard, is the other's too and is
  remembered (`ui_pmoRemember`, `ui_pmoRemembered`). By PMO no longer opens on the first office when one is remembered.
- A link each way: My PMO's bar has **See its spend plan on By PMO**; By PMO's picker has **See its requirements on My PMO**.
- Not changed: Requirements, Calendar, Charts, Unfunded and SRRB still start on All, so a portfolio page is never quietly
  narrowed to one office (§21.2, §26, §37, §44); a jump to Find still clears its PMO picker (§21). Labels not changed.
- `SP.PMO_LINKS` (10-util.js) turns the By PMO half off for the older-build comparisons (set false in harness.mjs's older-build
  line, beside `ORDER_DRAG`).

## I03 A requirement pressed on a narrow screen (touches §20.2, §38)

- At 1,100 px and narrower the detail is still drawn under the list (§20.2's "beside it" stands for wide windows), but a
  press, Enter in the search box, or a jump from another page now scrolls the detail into view and puts the keyboard on its
  heading (`ui_findShow`, `ui_narrow` reads `matchMedia('(max-width: 1100px)')`).
- Wide windows: the side panel has a height limit (the window less the pinned top) and scrolls inside itself, so its last
  plan events and the Open button can always be reached. Measured in Chromium on the invented view-only copy: 1093 px, the
  detail lands in view with the keyboard on its heading; 1366 px, the panel is 657 px tall in a 768 px window and scrolls;
  390 px, in view, no sideways scroll.

## I04 Plan events before budgets (reverses §20.2's order of the panel)

- The detail is: money, PMO (and Sub-PMO), appropriation (and PID), then plan events, then budgets. More than three budgets
  fold behind their count ("8 budgets"), opened when the words searched matched one of them; three or fewer show as before.

## I12 Projected award picker and an Order picker on Requirements (touches §20.2; §43, §46 unchanged)

- **Projected award** picker, All first: Past its projected date, In the next month, In the next 2 months, In the next 3
  months, More than 3 months out, No date, Awarded. It filters on the Projected award column (the earliest month not yet
  awarded, §20.1); "next N months" are the N after the Data through month, as My PMO counts them. The count line totals
  whatever is picked, so "what is late" and "what awards soon" are answered with their Still to award.
- **Order** picker: Appropriation, FY, title (the default, unchanged); Still to award, largest first; Planned, largest first;
  Projected award, earliest first; Title, A to Z. A chosen order runs across the whole list before it is cut, and the count
  line says "in order of …, on this screen only". No export, PDF or picture follows it.
- Not touched: Unfunded keeps its rank order (§43); the spend plan trees' drag order (§46). Find's state is now one object
  (`ui_findNew`) so a jump never carries an old order or filter.
- find.test.mjs's "All is offered first in each picker" now lists the two new pickers.

## I14 Jumps land on the requirement (touches §37, §44; §21 unchanged)

- An Unfunded line with no plan event ("Not in the spend plan") no longer offers **Open this requirement**: it landed on
  "No requirement matches". ufr-view.test.mjs now checks the button is gone there and uses a line in the plan for the jump.
- A jump from an Unfunded or SRRB line still searches as §37 and §44 say (CCaR number, plan event), with the Appropriation and
  FY pickers set to the line's own block; when one requirement is left it is opened.
- After any jump (Unfunded, SRRB, My PMO, Calendar, Charts) the search box is never given the keyboard (a phone raised its
  keyboard over the answer): it goes to the opened requirement's row (wide) or its detail (narrow, I03), else to the count
  line. My PMO's and the Calendar's Special CCaR lines still list every part with nothing narrowing (§21, §28).

## I17 Two ways in above a view-only copy's Summary (keeps §29, §35)

- In a view-only copy only, above the Summary: **Find a requirement** and **My PMO** (named "My PMO: <office>" once this
  browser remembers one). The keeper's own file is as it was; the menu's names are not changed; the buttons are not printed.

## I32 My PMO's first list: how far ahead, and its total (touches §21.1)

- A **Coming up** picker on My PMO's bar: Next month, Next 2, 3 (the default, as before) or 6 months. The first list's heading
  says which, and a line under it gives how many plan events and their money ($M) and the months covered. The tiles and the
  second list are unchanged. Unobligated stays out of a view-only copy (§35).

## I33 Title and CCaR matches first (touches §20.2: order of hits only)

- With words typed and no order picked, requirements whose title or CCaR number holds every word come first, then the rest in
  the list's own order under a quiet heading, "Also matched a plan event, description, PID, budget or PMO" (drawn only when
  both groups have lines). What matches is unchanged. Enter in the search box opens the first requirement listed.

## I37 Unfunded: how many lines, and whose ranks (no section reversed; §43 unchanged)

- Each group heading adds the whole group's count and whose ranks they are: "O&M FY2027 · 42 lines, in the UFR tracker's
  ranks", or "… ranked 1 to 42 across every PMO" (with "by the file's keeper" in a view-only copy) where the keeper ranked it;
  "(N shown)" when a picker narrows it. The note under the list says a rank runs across every PMO, so a PMO picked shows gaps.
  Ranks stay visible to readers. ufr-view.test.mjs and ufr-rank.test.mjs pin the new heading text.

## I51 Every requirement listed (reverses §20.2's "at most 200")

- `UI_FIND_MAX` is 500: the real pull's 233 all list, Initial Spares and OPN included. The cap and its sentence stay as a guard
  for a much larger pull. The Calendar's 300 is unchanged.

## I52 Description, PID and Sub-PMO (touches §20.1, §20.2)

- `SP.deriveRow` keeps the row's Event Description, PMT PID# and Sub-PMO as text on a non-enumerable `more` (as the SRRB cell),
  so a derived row as JSON is unchanged. `SP.requirementsOf` gives each requirement `pid` and `sub` (distinct texts) and each
  plan event `desc`.
- Find's detail shows Sub-PMO and PID(s) when there are any, and each plan event's description under it; the search reads
  all three. The search box's words say so. Not shown, not searched: PM/TPOC, Contracting POC, Material Lead, OPR (people's
  names stay in the file, as before). The top-bar search was not built (§20.3).

## Planted mistakes (each undone after its run; `scratchpad/work-a/plant.py`)

| planted | failing checks |
|---|---|
| I01 By PMO ignores the remembered office | 1 |
| I03 never narrow | 2 |
| I04 budgets never fold | 3 |
| I12 Projected award picker ignored | 7 |
| I12 Order ignored | 2 |
| I14 Unfunded button on a line with no plan event | 1 |
| I14 SRRB jump without its block | 1 |
| I14 jump gives the search box the keyboard | 1 |
| I17 no links on the copy's Summary | 1 (the test stops there) |
| I32 window fixed at three months | 2 |
| I33 no title-first grouping | 2 |
| I37 heading counts the narrowed list | 1 |
| I51 cap back at 200 | 1 |
| I52 search does not read the three | 3 |
| I52 detail does not show them | 1 |
