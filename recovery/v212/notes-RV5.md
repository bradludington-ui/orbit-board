# v2.12 RV5 -- the second review's W2 findings: a CLIN read as the board writes one, the one rule everywhere a paragraph is read

Branch `v212-fix5`, from `c81e995` (`v212-int`: W1, W2, W3, RV1, RV2, RV3 and the lead's R37 merged). Findings from
`recovery/v212/review-round2.json` (`S00`-`S21` = its `kept` list in order); mine: S10, S11, S12 (with S15, one defect), S13, S16,
S20. Each was read with both skeptics' votes and fixed as the votes narrowed it. `BUILD` not bumped, nothing pushed or merged,
CLAUDE.md untouched.

Every check is in audit-other's W2 slot (after RV2's blocks, before `// ==== end v2.12 W2 ====`); every mutation in
mutate.mjs's W2 slot, after RV2's, ids `v212-rv5-*`. Each block was run alone (`slim.py`) on this board and on `c81e995`'s
(`git show c81e995:prioritization-board-grid.html`, as `BOARD=`); the counts below are that run's.

## Per finding

### S10 (major) -- a board file whose CLIN request is not a list opened on v2.11 and opened blank on v2.12. Fixed.
- **What was wrong.** Every CLIN writer stores a request as a list; a hand edit or a damaged transfer can leave a number, text,
  `true` or an object (`S.clinNew[pid][i].ask`, a data pack's `clins[pid][i].ask`). Until v2.12 `clinList` was reached only when
  that prime's drill was opened; since v2.12 every draw reaches it (`render` → `scoreboard` → `attLists` → `wbsBlankOf` →
  `srcRowsOf` → `clinSplit` → `clinList`, and `attLists` → `wbsStateOf` → `wbsClinMoneyRO`), so `(c.ask||[]).slice` -- for text,
  `(v||[]).some` -- threw at the top-level `applyStore(PUB)`: no row, an empty posture, nothing said. The door (`inboundCheck`)
  had no rule for a CLIN and took the file. (A request in `clinMeta` was already guarded by `Array.isArray` in both readers.)
- **What changed.**
  - `clinAskIn(v)`: a request is read only where it is a list, otherwise as no request. `clinList` reads both the data pack's and
    an added CLIN's through it; `wbsClinMoneyRO` reads through it. The drill's lines (`clinVec`, `clinAskTot`) already treated an
    empty request as asking nothing; opening a year still fits a data-pack request to the services (`stFit`) on later passes, as
    before.
  - `clinsOf(L)`: a prime's CLINs read as a list of CLINs -- a CLIN that is null (or not an object) is no CLIN, CLINs that are not
    a list are none -- in `clinList` and `clinListRO`, keeping each base CLIN's index (its `b<i>` key). These two shapes are NOT a
    v2.12 regression (v2.11 could not open such a file either: measured, and a CONTROL in the check); they reach the same readers on
    the same draw path, so they are read the same way rather than left to kill the board.
  - The door: `inClinsWhy(m, at, edits)`, called from `inShapeWhy` for a data pack's `clins` and a plan's `clinNew` and `clinMeta`,
    refuses CLINs not held by requirement, a prime's CLINs that are not a list, a CLIN that is not a CLIN, and a request that is not
    a list of figures (`inAmtsWhy`: a number, or text the board reads as one) -- naming the CLIN (its number, else its key) and the
    place. So the door decides once: it refuses by name what the board would read as nothing; what it takes, the board draws.
  - **Not done, on purpose:** a try/catch around `srcRowsOf` in `wbsBlankOf` (the finding's part 2). The votes showed it would not
    cover the text case (which throws in `wbsStateOf`), and a catch there would draw Needs attention as "nothing without a WBS" --
    a wrong reading on screen -- where the readers now cannot throw on these shapes.
  - Pre-existing and left alone: a request that is a list holding text figures (`['5']`) is read by `clinVec`/`clinSplit` as the
    figure and summed by `clinAskTot` as text, as in v2.11; the door takes such text figures (as for every amount).
- **Check.** audit-other "v2.12 RV5 — a board file whose CLIN request is not a list opens and draws as v2.11 drew it, and the import
  check refuses it by name (S10)". File one (P's data-pack CLIN requests 5 -- planted in the saved JSON itself, since the board fits
  its own CLINs as it applies a year -- an edit's request `{}`, Q's added CLIN `"abc"`) and file two (adds null CLINs in the data
  pack and the added CLINs, and a prime whose CLINs are `{a:1}`). Both open with no script error, four rows and the posture; file
  one shows every row's figures, every requirement's lanes and cumulative and the totals that v2.11 (read from git, `bbb7ee9`)
  shows for it; each drill opens, a non-list request asking nothing; the door refuses each of eight shapes with its exact sentence,
  and takes the same file put right (a request in text figures too). CONTROLs: v2.11 opens file one and draws it; v2.11 could not
  open file two; the lanes. **On c81e995: 13 failing checks** (both files 0 rows and a TypeError; both drills throw; the door takes
  all eight). The lanes check passes there: the money was never at risk, only the draw.
- **Mutations.** `v212-rv5-clin-base-ask-unread`, `-clin-new-ask-unread`, `-clin-money-ask-unread`, `-clin-null-read`,
  `-clinro-null-read`, `-clins-not-list`, `-door-pack-clins`, `-door-plan-clins`, `-door-meta`, `-door-words`, `-door-null-clin`,
  `-door-not-list`. (`-clin-base-ask-unread` first SURVIVED: the fixture planted the number before `applyState`, which fitted it to
  zeros before the save -- a fixture that could not reach its target. Planted in the saved file, it is caught.)

### S11 (minor) -- the tie-out's AV + PSM split claimed paragraphs the one rule does not read. Fixed (both halves, as the lead set).
- **What was wrong.** `aceWbsOf` read a requirement's own lines and every CLIN's in `S.clinWbs`, whatever its type: a prime switched
  to an OGC still claimed its CLINs' paragraphs, an OGC switched to a prime its hidden requirement-level one, and a CLIN removed in
  the drill (its paragraph kept so it can be put back) the paragraph the Spend Plan Source no longer sends -- while the tie-out's own
  breakout (`aceAlignRows`), Needs attention, the export and the edit box said otherwise.
- **What changed.** `aceWbsOf(id)` is `wbsStateOf(id).lines` through `wbsCodeIn`, blanks and repeats dropped: one reader of the
  one rule (a prime: its listed CLINs; anything else: its own lines). Stored paragraphs are untouched, so switching back or putting
  the CLIN back brings the claim back. The suggestions (`aceSuggestFull`) follow too.
- **Check.** audit-other "v2.12 RV5 — the tie-out’s AV + PSM split claims only the paragraphs the one rule reads: a removed CLIN, a
  prime switched to an OGC and back (S11)": `aceWbsOf`, `aceGroupSplit`, the panel as drawn (`tr.acesplit`) and the suggestions.
  Removed CLIN: AV $1M / PSM $1M / shared $1M; switched (P → OGC via `reqApply`, O → prime): AV $1M / PSM $0 / shared $2M.
  CONTROLs: before, put back, switched back. **On c81e995: 2 failing checks** (PSM keeps both lines throughout).
- **Mutations.** `v212-rv5-acewbsof-every-clin` (the old reading), `-acewbsof-type-switch` (only the type half),
  `-acewbsof-removed-clin` (only the removed-CLIN half). Retargeted: `v212-rv2-acewbsof-whole-text` (the same defect, on the new line).

### S12 / S15 (minor / major; one defect) -- the PMO review showed no WBS for a proposed new requirement. Fixed.
- **What was wrong.** `pmoFmtVal('__new')` printed every field the Add box requires but the WBS; the proposal carries it and
  accepting it stores it, so a paragraph the board's estimate does not hold was accepted unseen and flagged only afterwards. Older
  than v2.12 (since v2.07); RV2's notes left it for the lead.
- **What changed.** The `__new` branch adds `WBS <each paragraph>` through `pmoFmtVal('wbs')` (`wbsReviewTxt`, K03's reading): named
  "1.2.2 — path", or "9.9 (not in the 2026ACE estimate for O&M)"; nothing when the proposal has none. The change report reads the
  same line.
- **Check.** audit-other "v2.12 RV5 — the PMO review and its change report show a proposed new requirement’s WBS, named, or flagged
  where the estimate does not hold it (S12, S15)": four proposals through `pmoTake` (1.2.2; 9.9; a split over 1.2.1 and 9.9; a prime
  with none), the review table as drawn and the change report read from its bytes; then applied (CONTROL: each lands as shown) and
  the flagged ones are exactly Needs attention's ≠ list. **On c81e995: 2 failing checks** (no WBS in the row or the report).
- **Mutations.** `v212-rv5-review-new-no-wbs`, `v212-rv5-review-new-bare`.

### S13 (minor) -- Without a WBS did not name the CLIN whose one WBS line has no paragraph. Fixed.
- **What changed.** `srcWbsParts`'s one-line case returns its reason like the others: a blank single line is `'clin'` on a CLIN
  ("CLIN 0001 has no paragraph"), `'none'` on a requirement's own record.
- **Check.** audit-other "v2.12 RV5 — Without a WBS names the CLIN whose one WBS line has no paragraph (S13)": ＋ Add WBS clicked as
  drawn on CLIN 0001, and a paragraph typed into that line and cleared; the list and the list as drawn. CONTROLs: no line at all;
  an OGC's one blank line still "no paragraph". **On c81e995: 3 failing checks.**
- **Mutations.** `v212-rv5-blank-line-unnamed`. Retargeted: `v212-w2-src-split-ignored` (the same defect, on the new line).

### S16 (minor) -- WBS from execution data bypassed the pick rule, and read ORBIT's own WBS split back as a conflict. Fixed.
- **What was wrong.** (a) `execWbsScan` took any paragraph shaped like one and `execWbsApply` wrote it: a code the estimate the
  pickers offer does not hold (which the edit box refuses) was written and only then flagged under ≠. (b) Since v2.12 the Spend
  Plan Source sends a split requirement a line per paragraph and "ORBIT reads the same column back" (item 132, decision 4): the
  round trip reported every split as "rows naming DIFFERENT paragraphs … set them by hand" on a requirement that already held exactly
  that split, and a requirement already on its one paragraph as "ready to write".
- **What changed.**
  - `srcWbsPara` reads the cell through `wbsCodeIn`, the one reader of a paragraph's code (the same result: the text before a
    spaced dash, upper case, no spaces), then the shape test as before.
  - Each requirement's (or CLIN's) rows are compared with what it carries (its stored lines through `wbsCodeIn`), as a set: the same
    set is **already set, as sent** (`scan.asSent`) -- neither a conflict nor a proposal. Then each paragraph goes through `wbsTake`
    against `wbsPick()` (the estimate the pickers offer): one it refuses puts the requirement under `scan.unlisted`, never written.
    Only then one paragraph is a proposal and several a conflict, as before. With no estimate naming the appropriation `wbsTake`
    takes a paragraph as typed, as before v2.12.
  - The panel says both ("already set, as sent", "not in the estimate", each with its list), names a proposed paragraph's path, and
    the status line after Write counts the ones not written. `exwApply` reads `scan.unlisted` defensively (audit-board's copy check
    stands in a scan without it).
- **Check.** audit-other "v2.12 RV5 — WBS from execution data reads the Spend Plan Source’s own WBS back as already set, and picks a
  paragraph from the estimate (S16)": the board's own `exportSrc` bytes through the real `importSrc`; B split over 1.3.1/1.3.2 and C
  on 1.2.1 already set, as sent; E (cut to 1.3.1 after the export) a real conflict (CONTROL); A's planted 9.9.9 listed apart and not
  written; D's 1.2.2 ready to write, named, written; the panel's sentences; the status line; with no estimate, 9.9.9 taken as before
  (CONTROL). **On c81e995: 4 failing checks.**
- **Mutations.** `v212-rv5-exw-split-conflict`, `-exw-overlap-as-sent`, `-exw-unlisted-written`, `-exw-unnamed`, `-exw-para-whole`.

### S20 (minor) -- the K01 "draw writes nothing" check could not fail. Fixed (check).
- **What was wrong.** It took its snapshot after the fixture had drawn the board many times, so whatever a draw writes had landed;
  under `v212-rv2-draw-writes` it passed and only R2's array-form CONTROL went red.
- **What changed** (`// v2.12 RV5 (S20):` in RV2's K01 block, an existing check changed on purpose): P's CLIN containers are taken
  away first (asserted: none left), then only what every draw runs for Needs attention -- `attLists()` and `scoreboard()` -- is run
  and compared. `render()` is no longer in it: the RECORD panel (`gridAfterRender`) makes a selected prime's containers on purpose,
  on this board and on v2.05 (the votes measured it), which is not what the check is about.
- **Proof.** On `v212-rv2-draw-writes` the block now fails on "the draw writes nothing" itself (beside the R2 CONTROL); it passes on
  this board and on c81e995 (the code was right there -- this is a check-strength finding). A new mutation the R2 CONTROL cannot see,
  `v212-rv5-draw-leaves-new-containers` (`clinReadOnly` leaves behind containers it made for a prime that had none; R2's existing
  array is still put back), is caught by this check alone.

## Not fixed, and why
None of my six. S10's part 2 (a catch in `wbsBlankOf`) is deliberately not built: see S10.

## Checks that fail on c81e995
24 failing checks over the five new blocks: S10 13, S11 2, S12/S15 2, S13 3, S16 4 -- every non-CONTROL check but S10's lanes check
(the lanes never read a CLIN). S20's change is a check-strength fix and passes on c81e995 by design; its proof is the two mutants.

## Mutations
24 new (`v212-rv5-*`), 2 retargeted with `// v2.12 RV5:` comments (`v212-w2-src-split-ignored`, `v212-rv2-acewbsof-whole-text`),
none retired. `mcount`: 3,096 targets (3,072 + 24), every one once.
Proved: `JOBS=1 HEAP=8192 prove.py recovery/v212/proofs-RV5.json recovery/v212/proved-RV5.jsonl` -- **27 of 27 CAUGHT** (the 24
new, the 2 retargeted, and `v212-rv2-draw-writes` against S20's strengthened check), none survived, none crashed. One threw after a
check had already failed (`-exw-para-whole`: the block's later reads met no scan rows); every other catch is by checks alone. On the
way `-clin-base-ask-unread` SURVIVED (see S10) and the fixture was corrected. `v212-rv2-draw-writes` now fails "the draw writes
nothing" itself (with the R2 CONTROL); `v212-rv5-draw-leaves-new-containers` fails that check alone (1 failing check, by name).

## Runs (on the final tree)
- `npm run check`: all checks passed. `mcount`: 3,096 / 3,096 once. Money map: `node tools/money-map.mjs --check` holds -- 322
  cells, 119 proven, 202 n/a, 1 open (v2.04's `aiExport`, as before); no cited check changed, so the report was not regenerated.
- Guide: not touched (no guide text in this change).
- jsdom, each WHOLE, one at a time: audit-other (4 GB), audit-board (8 GB), audit-import (8 GB), audit-recon (8 GB), audit-hostile,
  audit (export), audit-inject, audit-ui -- every one ALL CHECKS PASSED; legacy-fsrc and boot-same passed. Round-trip fuzz: nothing
  lost (seed 582934326).
- Browser: controls, panels, hostile (hostile-render), dialogs, standards (0 findings, nothing new), leftmenu, menus, keys, pointer,
  editors, dropdowns, pmoyears, pmosave -- all pass; layout -- only the 8 carried D results.

## For the integration
- **Expected conflicts with RV6.** None in the board's code that I know of: RV6 is in W3's (`baOf`, positions, FDC). The door:
  RV6 may also touch `inShapeWhy` (RV3 added `inPosWhy` there); my two lines are in the data-pack branch (after `budget`) and at the
  end of the plan branch (after the awards). mutate.mjs: mine are in the W2 slot only; audit-other: mine are in the W2 slot only.
- **The door now refuses a CLIN shape no ORBIT build writes**, at every door including a full import of the user's own board.
  The round-trip fuzz fills every CLIN container with lists, so its door trip is unaffected.
- **WBS from execution data's scan carries two new lists** (`asSent`, `unlisted`); a stub of `execWbsScan` without them still works.
- **Seen, not in my findings, left as it is:** a pull's row for a prime that names no CLIN the prime has is still proposed for the
  prime's requirement-level paragraph (`S.wbs`), which the one rule reads nowhere (RV2: kept as stored, sent nowhere). The Spend Plan
  Source sends a prime's money on no CLIN with the WBS blank, so ORBIT's own round trip never makes such a row; a CCaR-typed one could.

## For Brad
- A board file holding a CLIN request that is not a list (only a hand edit or a damaged transfer makes one) now opens and reads that
  request as nothing, saying nothing about it; the import check refuses it by name. If the board should also say so on opening (as
  repaired awards are reported), that is a short addition to Needs attention.
- WBS from execution data now writes only paragraphs the estimate holds (as every box does), and calls rows that name exactly what a
  requirement already carries "already set, as sent". A requirement whose rows name a paragraph it carries plus one it does not is
  still a conflict to set by hand.
