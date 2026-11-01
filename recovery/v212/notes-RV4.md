# v2.12 RV4 -- the second review's findings on the cost estimate import (S00, S01, S02, S03, S21)

Branch `v212-fix4`, from `c81e995` (`v212-int`: W1, W2, W3, RV1, RV2, RV3 and the lead's R37 change merged). The findings are the
second review's kept list, `recovery/v212/review-round2.json` (S00-S21 = its "kept", in order); each was read with both skeptics'
votes, and where a vote narrowed or sharpened it the fix follows the vote (said below). RV4's are S00, S01, S02, S03 and S21 -- all
in W1's and RV1's code: the file key (`importAce`), `aceParse`'s step 1, `aceTree`, `aceFindHeader`'s duplicate-title branch, the
report box (`aceRepBody`, `aceRepOf`) and the guide's `t-ace`.

Every new check is a block in the v2.12 W1 slot of `audit-other.mjs`, after RV1's (names start `v2.12 RV4 —`); every new mutation is
in the v2.12 W1 slot of `mutate.mjs`, after RV1's, ids `v212-rv4-*`. **Every RV4 block fails on c81e995** (its board, `git show
c81e995:prioritization-board-grid.html`, as `BOARD=`): **17 failing checks across the five blocks** (S00 2, S01 5, S02 7, S03 2, S21 1), each for the reason the finding
names, except the parts labelled CONTROL and S21's guide parts that RV1 had already made true (those are there for their mutations;
the part that fails is the S02 rule, which c81e995's guide does not state).

## Per finding

### S00 -- the file key took the first year in the name, not the year nearest ACE (minor)
- **What was wrong.** RV1's pattern `/(?:^|\D)(20\d\d)(?!\d)(?:.*?[^A-Za-z])?ACE(?![A-Za-z])/i` lets any text, another year
  included, sit between the year it takes and ACE, and a match starts as far left as it can. So "PB2027 2026 SUST ACE COMPLETE
  Detail File" was keyed 2027ACE and met the LOCKED 2027ACE's replace question (an OK put 2026's figures in place of the approved
  2027 estimate); "BES2028 from 2026 ACE" (2026ACE in v2.11) was filed silently as a new 2028ACE; "2025-11-03 2026 SUST ACE …" as
  2025ACE -- each a second estimate of 2026, with spAce moved to it. RV1's check used only names whose one year sits right before
  ACE, so it could not see it.
- **What changed.** The votes' pattern, a greedy start: `/^.*(?:^|\D)(20\d\d)(?!\d)(?:.*?[^A-Za-z])?ACE(?![A-Za-z])/i` -- the last
  year that ACE still follows. Every name RV1's check holds keeps its key (2026ACE_final, 2026ACE (1), FY2026ACE, 2026 ACE_final,
  2026_ACE, 2026ACE Detail File → 2026; 2026 Workspace, 2026 TRACE, 2026 ACEs → their own names), and so do "2026-27 ACE",
  "2026 SUST ACE 2027 update" and "2026 ACE for BES2028". The one edge the votes named: a name with two "year … ACE" pairs ("2026
  ACE vs 2027 ACE") takes the later year.
- **Check.** "v2.12 RV4 — the file key takes the year nearest ACE …": 2026ACE and the approved 2027ACE held, both locked; the three
  names above each meet 2026ACE's locked-replace question and no other, and Cancel leaves the two estimates with their own figures;
  CONTROL, six names RV1's and the votes' list keep on 2026ACE. On c81e995 (2 failing): one question, 2027ACE's, and 2025ACE and
  2028ACE filed.
- **Mutation.** `v212-rv4-key-first-year` (RV1's pattern back). Retargeted: `v212-rv1-key-word-boundary` and
  `v212-rv1-key-ace-in-word` (their find was RV1's pattern; the same defects on the new one, the greedy start kept), both re-proved
  against RV1's file-key block.

### S01 -- a row with no WBS whose year cells hold figures written as text was filed as formatting (minor)
- **What was wrong.** Since RV1 `aceMoney` reads "1.5*" as nothing, so a real line that lost its WBS and footnoted its figures had
  no WBS and no dollar, and step 1 (`if(!code && !any)`) filed it as formatting before `odd` (its text cells) was looked at: out of
  the sheet's rows and totals, named nowhere, while the status line said "No row left out … Every dollar of the sheet is kept or in
  a reason". Before RV1 it was kept and named "No WBS". (The votes: it was counted in the box's formatting line, never with its row
  number or its text.)
- **What changed.**
  - Step 1 asks for no text in the year cells too: `if(!code && !any && !odd.length)`. Such a row is data: counted in the sheet's
    rows, put through the reasons, and kept it is named twice -- "No WBS" and "A year cell holds text that is not a figure", with the
    cells as the file wrote them. This is the finding's first fix; the second vote's alternative (name it but leave it out of the
    totals) would list a row under "Kept, and named" that was not kept.
  - `kept.zero` counts only a row with a WBS: the box calls each one "a paragraph with no dollar, in the tree", and a row with no WBS
    is in no tree.
  - The status line says it: "⚠ N kept row(s) hold a year cell of text that is not a figure, read as nothing: named in the report."
    -- "No row left out" and "every dollar is kept" are true of the dollars read, and a figure written as text was not one.
  - A sheet whose rows are all kept with no dollar read (only such lines, or paragraphs of text) is refused, as before, but the
    refusal says so -- "no row carries a dollar ORBIT can read: 2 rows were kept with none, and rows 4, 5 hold a year cell of text
    that is not a figure" -- where it said "every row was left out —" and named no reason (reachable since RV1 for a paragraph of
    text, and since this fix for a line with no WBS). A sheet with every row left out reads as before.
- **Decided here (see "For Brad").** A row under the titles with no WBS, no figure and text in a year cell, and nothing else filled
  -- a "($M)" units row -- is now data too: it is left out as "Another dollar type" ($ Type blank), $0, where before it was
  formatting. No ACE layout seen has one; it is said, not hidden.
- **Check.** "v2.12 RV4 — a row with no WBS whose year cells are figures written as text …": a line with every field filled, no WBS,
  FY27 "1.5*" and FY28 "2.0 (a)"; 1.3 with only "0.7*" (RV1's case); 1.1 with a figure; a blank row (CONTROL: still formatting).
  The sheet has 3 rows, 1 formatting, 3 kept, 1 line; only 1.3 is a zero paragraph, and the tree holds 1, 1.1, 1.3; the named rows
  are ["nowbs", 5], ["text", 5, FY2027 “1.5*” · FY2028 “2.0 (a)”], ["text", 6, 1.3]; the status line and the report box say it;
  every dollar still ties; and a sheet of only those two rows is refused with the sentence above, nothing stored. On c81e995 (5
  failing): 2 rows and 2 formatting, 1.3 alone named, nothing said, and the refusal "every row was left out —".
- **Mutations.** `v212-rv4-textrow-formatting`, `-textrow-zero-in-tree`, `-text-unsaid`, `-norows-left-out-said`,
  `-norows-text-unsaid`. Retargeted: `v212-w1-formatting-counted`
  and `v212-w1-zero-row-lined` (their finds were the two lines changed; the same defects), both re-proved against W1's block.

### S02 -- a heading two rows place under different parents was settled silently by row order (minor)
- **What was wrong.** Whether a suffixed line breaks out at a level is decided by that line's own CES names, so two rows can disagree
  about where a heading sits: P6.2.2.1E's own row (CES3 "Propulsion") puts it under P6.2.2; its child P6.2.2.1.3E (CES3 "ECU
  Propulsion") under the breakout P6.2.2E. `aceTree`'s `put()` kept the first row's parent and compared only names, so the same file
  gave the ECU lines to AV (PSM $0) or to PSM ($450,000) depending on which row came first, and the report named no conflict. Brad's
  rule (item 132): a disagreement is flagged, never silently picked.
- **What changed -- the rule, stated in the code, the report box and the guide.** Every parent each row gives a heading is kept
  (`upBy`, with the rows that gave it), and the rule is applied once all are in: **the breakout wins** -- a parent other than the
  heading's own plain one (its code's first segments) is taken whenever any row gives it; among two such (only oddly lettered codes
  give two), the first in code order. Why the breakout: RV1 made a breakout a whole branch (once a heading on a line takes the suffix,
  every heading below it does), the breakout heading exists only because a row named it, and the other choice leaves it holding
  nothing -- the R26 symptom RV1 fixed. A parent is always the level above, so the rule cannot make a loop. It is order-independent
  by construction: the set of parents each heading is given does not depend on row order (each suffixed line is compared only with
  the plain lines' names, read first), and the choice is a fixed order over that set.
  - Each disagreement is named: `rep.ups = [{ap, code, up (taken), by:[{up, rows}]}]`, listed in code order (so one file reads the
    same in any row order); `aceRepOf` reads it (a report before RV4 has none); the report box draws "A heading two rows place under
    different parents — N: it goes under the breakout heading (the one carrying the letter), whatever order the rows are in", each
    heading with the parent taken and every parent given, by row, named from the tree; the status line counts them among the rows
    named for a look; the guide's `t-ace` says the rule in one clause.
  - Name conflicts are unchanged (the first name in the file is kept, named).
  - The AV + PSM split reads the tree (`aceLineUp`/`aceWbsUp`), so it follows with no change of its own.
- **Check.** "v2.12 RV4 — a heading two rows place under different parents …": two such headings on O&S (1.2.2.1E and 1.3.2.1E,
  each with its own row and a child disagreeing), imported in one order and in the reverse: the same tree (each E heading under its
  breakout), the same path, the same split (AV $1,200,000, PSM $670,000, nothing shared, of $1,870,000), both named in code order
  with every parent and its row, no name conflict invented, the box and the status line saying it; CONTROL, the same lines with the
  rows agreeing name nothing and give the same tree and split. On c81e995 (7 failing): nothing named, and with the parent rows first
  PSM $0, AV $1,870,000.
- **Mutations.** `v212-rv4-up-first-row` (the first row's parent kept), `-up-plain-wins` (the other rule), `-ups-unsorted`,
  `-ups-unnamed`, `-ups-rows-dropped`, `-repof-ups-dropped`, `-ups-box-missing`, `-ups-box-no-rule`, `-ups-not-counted`, and
  `-ups-box-unescaped` (hostile: the hostile board plants a heading, a parent taken and a parent given in the 2026 estimate's report,
  `aceupcode`, `aceuptake`, `aceupgiven`, all three in `MUST_SHOW`).
- **Not given a mutation, on purpose:** "among two breakout parents, the first in code order" -- only a code with a letter in a
  middle segment as well as at its end can give a heading two breakout parents; no fixture here builds one, and a mutation of that
  tiebreak would survive. It is stated so the rule is total, not because a file has been seen to need it.

### S03 -- a title the file carries twice, answered with another title's column or "no such column", was asked again on every import (minor)
- **What was wrong.** `aceFindHeader`'s duplicate branch read a remembered answer only when its title was the field's own
  (`(m===n)? memCol(F, n) : -1`), and never read `memNone`. So with two "Rollup Value?" columns (A, J) and the flags in H ("Rollup
  Flag"), the answer H was stored as `{map:{roll:'Rollup Flag'}, at:{roll:7}}` and the box asked again on every import -- while saying
  "The answer is remembered for files laid out the same way". The same for an optional field titled twice and answered "no such
  column". The money was right every time.
- **What changed.** The votes' fix: the duplicate branch reads a remembered answer of another title too (`(m===n)? memCol(F, n) :
  (m? memCol(F, m) : -1)` -- `memCol` still refuses a title that now heads several columns the answer cannot tell apart), then, for an
  optional field, a remembered "no such column", before asking. A layout's signature is its titles in order, so a remembered title
  heads the same column every time.
- **Check.** "v2.12 RV4 — a title the file carries twice, answered with another title’s column …": (a) A and J "Rollup Value?",
  answered H "Rollup Flag": $3,000,000 (a $3M subtotal over $1M + $2M: reading A or J keeps $6M), then two more imports read H, not
  asked, "remembered"; (b) CCAR Description on two columns answered "no such column": two more imports not asked, still answered so;
  CONTROL (c), RV1's case (an answer naming one of the two same-titled columns) still read. On c81e995 (2 failing): asked every time.
- **Mutations.** `v212-rv4-dup-other-title-asked`, `v212-rv4-dup-none-asked`. Retargeted: `v212-rv1-none-not-read` (its find, the
  memNone line, now also occurs in the duplicate branch; the find carries the line above it so it matches once), re-proved against
  RV1's header block.

### S21 -- RV1's corrected t-ace guide text had no check and no mutation (minor)
- **What was wrong.** RV1 rewrote `t-ace` (first review R31) and nothing pinned it: putting back "every named row", or dropping the
  optional-column sentence, would pass every suite (both votes proved it on mutated boards).
- **What changed.** Nothing in the old text; the S02 rule was added (above).
- **Check.** "v2.12 RV4 — the guide’s cost estimate section …", reading `t-ace` from `#helpDoc` as RV3 reads `t-ppbe`: a box asks
  when a title is missing or heads two columns; about a missing US/PTN/FMS, CCAR Element or CESk, answerable "no such column"; the
  report's named rows are "(N of each kind on screen)" with N read from the board's own `ACE_REP_CAP`, so the guide and the code
  cannot disagree; a report not in ORBIT's shape "is said to be unreadable"; "every named row" and "If a title has changed" are gone;
  and the S02 rule. On c81e995 (1 failing): the S02 rule; the rest passes there, as it should (RV1's text was right).
- **Mutations.** `v212-rv4-guide-every-named-row`, `-guide-optional-dropped`, `-guide-dup-title-dropped`,
  `-guide-unreadable-dropped`, `-guide-parent-rule-dropped`, and `-cap-guide-disagree` (the box's cap moves to 50, the guide says 40).

## Changed on purpose in existing checks

None. Five existing mutations were retargeted (above), each with a `// v2.12 RV4:` comment.

## Mutations

24 new (`v212-rv4-*`), 5 retargeted (`v212-rv1-key-word-boundary`, `v212-rv1-key-ace-in-word`, `v212-rv1-none-not-read`,
`v212-w1-zero-row-lined`, `v212-w1-formatting-counted`), none retired. `mcount`: 3,096 targets, every one once (3,072 at c81e995 +
24). Proofs: `recovery/v212/proofs-RV4.json` (29 entries: the 24 and the 5 retargeted), results in `recovery/v212/proved-RV4.jsonl`
-- see the end of this file.

## For the integration

- **The guide's budget.** RV4 adds 92 characters to `t-ace`; the guide is 69,754 of audit-import's 70,000. RV6 (S09) also edits the
  guide in this round; check the total after merging and trim on purpose if it passes 70,000.
- **The report's shape** gains `ups` (the headings two rows place under different parents). A report stored before RV4 has none and
  reads as before.
- **Expected conflicts:** the board's ACE import region is RV1's and mine only (RV5's S11 is `aceWbsOf`, which this change does not
  touch; I did not edit `aceWbsOf`, `aceLineUp` or `aceGroupSplit`). `hostile.mjs`: one small plant after RV1's 2025ACE plant and one
  `MUST_SHOW` line. The suites' and `mutate.mjs`'s W1 slots are mine in this round; the guide template (different section from RV6's).

## For Brad

1. **A heading two rows place under different parents goes under the breakout heading** (the one carrying the letter), and the report
   names it with the rows that gave each parent. The other rule -- the plain heading wins -- would leave the breakout heading the file
   names holding nothing, which is what the first review called a defect (R26). Either way the split no longer depends on row order.
2. **A row under the titles with no WBS and text in a year cell is data.** A real line that lost its WBS and footnoted its figures is
   kept and named twice; a units row such as "($M)" under the titles, with nothing else filled, would now be left out as "Another
   dollar type" ($0) rather than counted as formatting. No layout seen has one.
3. **A file name with two "year … ACE" pairs** ("2026 ACE vs 2027 ACE") is keyed by the later year.

## Proof results

`JOBS=1 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py recovery/v212/proofs-RV4.json recovery/v212/proved-RV4.jsonl`: **29/29
CAUGHT** (the 24 new and the 5 retargeted), 0 survived, 0 not applied, 0 crashed, none caught only by a throw. Every check was first
run clean on the unmutated board (six audit-other slims; audit-hostile whole for `v212-rv4-ups-box-unescaped`). `mcount`: 3,096
entries, 3,096 once.

## What was run, on the final tree

- `npm run check`: all checks passed. `mcount`: 3,096 / 3,096 once (no `__pycache__` left). `node tools/money-map.mjs --check`: holds
  (322 cells, 119 proven, 202 n/a, 1 open; the report is current -- no cited check moved, so the .md was not regenerated).
  `npm run coverage:money`: holds (27/27). `npm run defects`: holds (13, guarded by 43).
- The guide: 69,754 characters of audit-import's 70,000 (69,662 at c81e995; RV4 adds 92).
- Every suite whole, one at a time, on the final tree: audit-other (4 GB, 140 s), audit-hostile (60 s), audit-board (8 GB, 242 s),
  audit-inject, audit (export), audit-ui, boot-same ("identical either way"), legacy-fsrc (its own line) -- ALL CHECKS PASSED each.
  audit-recon and audit-import (8 GB) passed whole on the tree one step earlier: recon while `nm()`'s string guard in the report
  box's parent section went in, import after it and before the refusal sentence of S01. Neither later edit is reachable from
  either suite (no fixture there carries a parent disagreement, and no check reads the no-line refusal's text: grep), so they were
  not run a third time.
- Browser: `menus`, `panels`, `dialogs`, `leftmenu`, `keys`, `standards` (0 findings, nothing new), `layout` (only the carried
  D ×8 fail), and `hostile` (Chromium: "Nothing a file can carry runs when the board draws it") -- `hostile` again on the final tree.
  Not run (nothing this change reaches): `controls`, `editors`, `dropdowns`, `pmosave`, `pointer`, `pmoyears`, `csp`, `toolbar`.
- On c81e995's board: the five RV4 blocks fail 17 checks (S00 2, S01 5, S02 7, S03 2, S21 1).
