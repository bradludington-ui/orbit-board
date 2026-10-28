# v2.12 RV3 -- the review's fixes to item 134 (W3's code)

Branch `v212-fix3`, from `c23e8a0` (v212-int: W1, W2 and W3 merged). The findings are the kept lists of
`recovery/v212/review-W1W3.json` (R00-R37) and `review-W2int.json` (K00-K17); each finding's skeptics' votes were read with it,
and their corrected text is what was fixed where it sharpened or narrowed the finding. Mine: R12-R24, R27-R29, R31 (the t-ppbe
part), R32, R34, R36, R37, K10, K11, K13.

Every check below is in audit-board's W3 slot (`// ==== v2.12 W3 ...`), after W3's three blocks; every mutation in mutate.mjs's
W3 slot, after W3's, ids `v212-rv3-*`. **Every RV3 block fails on c23e8a0** (its board, `git show c23e8a0:…`, as `BOARD=`: 38
failing checks across the ten blocks and the three W3 checks whose expectations moved -- `recovery/v212/` has no copy; the run is
reproducible with `slim.py … "v2.12 RV3 —" "v2.12 W3 —"` on that board), each for the reason the finding names, except where a part
is labelled CONTROL, and except R32's three checks and R34's Go to it, which guard code that was already right (see each).

## Per finding

### R12, R24 -- a position that cannot be read stopped the board opening, and an import of one half-landed (major)
- **What was wrong.** `ppKeysOf` read `(lines[sv]||[]).forEach(l=>…l.k)`. A line list that was text, a number or an object, or one
  holding a null, threw -- and since v2.12 `applyState` reads the tagged position (`applyBudget` → `baOf` → `ppSvcFy`), so the
  top-level `applyStore(PUB)` threw and no row was drawn; through `importState` the store had already replaced `MS` when it threw
  ("Could not read that file.", the file's order on screen, the journal left paused). The door never looked inside a position.
- **What changed.**
  - `ppLineList(P, sv)`: a service's lines as a list of lines, whatever a file put there; `ppKeysOf` and the PPBE box (`ppBody`)
    read it, so neither can throw on such a list.
  - `ppSvcBad(P, sv, fy)`: why a position cannot be read for that service and year (its line list is not a list, a line is not a
    line, its figures are not held by line, one of that year's figures is not a figure), or ''. `baOf` keeps the board's own base
    for such a service and year and records why (`bad[i]`); `fitSrcSay` says it ("· the board's own for USAF (its line list is
    not a list), where BES28 cannot be read"), and Budget Management reads the same sentence.
  - The door: `inPosWhy(P, at)`, called from `inShapeWhy` for a store's `ppbe` (every position) and for a lock's copy
    (`…cycles.<key>.pos.P`), refuses a line list that is not a list, a line that is not a line, figures not held by service, line
    and year, and a figure that is not an amount (`inAmtWhy`: words refused, text figures taken), naming the place. Both shapes
    the board reads are checked (v2 `{lines, val}`; v1 `{service: {year: figure}}`).
- **Check.** "v2.12 RV3 — a PPBE position that cannot be read never stops the board opening, and the door refuses it (R12, R23,
  R24)": a saved board tagged BES28 with `lines.USAF` = "x" and = [null] opens with its three rows and no error, FY27 USAF on the
  board's own base (1,150 / 200), the reason recorded and said in the fit box, the PPBE box opening on both; the door refuses both,
  naming the path; a store carrying the null line loaded through `applyStore` lands whole (tag, order, position) without a throw;
  a lock's copy with a line list that is a number is refused. On c23e8a0: 0 rows drawn, a TypeError, the door passes.
- **Mutations.** `v212-rv3-lines-not-a-list`, `-lines-null-kept`, `-bad-read-anyway`, `-bad-line-list-passes`,
  `-door-pos-unchecked`, `-door-lock-pos-unchecked`, `-door-line-null`, `-door-cell-words`.

### R23 -- a position figure written as text passed the door and became $0 budget authority
- **What was wrong.** `ppCell` read `+c.d||0`: "1,000" is NaN, so 0 -- since v2.12 the year's budget authority, in silence. Every
  other amount the board takes reads such text as the figure.
- **What changed.** `ppNum(x)`: a position figure read as the door reads an amount -- a number, or text with `$ , spaces` taken out;
  anything else NaN. `ppCell` reads through it and marks a cell it cannot read (`bad`, counted as 0 as before, which `ppSvcBad`
  turns into "the board's own base, said"); `ppSvcFigs` (so `baNamed` -- the vote's second case: a service whose only figure was
  text was not named, and silently kept its own base), `ppOutside` and `ppNorm`'s v1 reading use it too. The door checks every cell
  with `inAmtWhy` (R12's `inPosWhy`): text figures are taken, words refused.
- **Check.** The same block: "1,000" for USAF FY27 reads 1,000 (+ the 150 add) from BES28, and AFRC's only figure "1,400" names
  AFRC (1,430 from the position); the door takes the text; "abc" is refused at the door by path, and the board's own file carrying
  it opens with FY27 USAF on its own base, said, FY28 still BES28's. On c23e8a0: 150 and 0 from "pos".
- **Mutations.** `v212-rv3-cell-text-zero`, `-cell-words-zero`, `-figs-text-unnamed`.

### R18 -- opening rewrote another year's stored budget from its raw parts
- **What was wrong.** `baOf` read a year's `bm.disc` / `bm.mand` / `adds[].vec` raw: on a year nobody had opened, text parts
  concatenated ("1,100" + 75 = $0, "410" + "0" = $4,100) and fractions were rounded service by service, and opening a board
  wrote that cache into the next save. applyState, opening the same year, reads $1,175 / 410 / 310.
- **What changed.** The three rules applyState reads a year's figures by (`money`, `fit`, `bmTot`) are function declarations now
  -- `stMoney`, `stFit`, `stBmTot` -- with `bmNormOf(bm)` giving a year's components as opening that year reads them, without
  writing them back. applyState uses them (`const fit=stFit, bmTot=stBmTot;`), so there is one statement of the rules, and `baOf`
  reads through `bmNormOf`. `baApplyTo` still writes a year's cache only where it differs from the stored one.
- **Check.** "v2.12 RV3 — opening reads another year's budget as opening that year does, and a board saved twice is the same
  (R18)": FY28's base and add as text and FY29's base with fractions, each cache the figure the year opens to; opened, both caches
  are left as saved; opened and saved without an edit the board writes the state it opened (clocks aside), and saved a second time
  the same again; the years opened read those figures (CONTROL oracles); a stale cache over text parts opens at the healed figure;
  tagged, FY28 reads 5,000 + the text 75. On c23e8a0: [0, 4100, 3100], [333, 333, 333], saves differ, tagged 500075 / 3100.
- **Mutations.** `v212-rv3-ba-raw-parts`, `-ba-fractions-rounded`, `-ba-adds-raw`; `v212-w3-ba-aliases-own` retargeted.

### R13, R27 -- Copy to year and Roll forward started a year at $0 budget and Save wrote it
- **What changed.** `yearCopy` makes a year it starts live at once: `baApplyTo(MS.years[y], y)` right after `freshYearState()`
  (Copy to year, Move to year and Roll forward all start years there). `baApplyTo` gives such a year its `bm` from the blank
  caches before it writes the position's figure, so the board's own base stays the blank year's $0.
- **Check.** "v2.12 RV3 — a year started by Copy to year or Roll forward has its live budget at once (R13, R27)": FY30 by Copy to
  year (`xferYear('A','c2030')`, the row menu's "FY30 (new)") is USAF 777 / 70 at once, its own base $0, and the saved file carries
  it; FY31 by Roll forward 555 / 50; untagged, both back to $0. On c23e8a0: [[0,0,0],[0,0,0]].
- **Mutation.** `v212-rv3-new-year-not-live`.

### R17 -- the fit said money a requirement draws was held by nobody
- **What changed.** `fitYearNow`: held is never less than drawn, per service and lane (`h=max(drawn, directed)`: the vote's
  corrected form). A Split's mandatory is read against its basis less the Disc it DIRECTS (`fsDirVec`), the lane walk's against
  the basis less the Disc it DREW, so a Split typed past its value on a short discretionary lane drew mandatory money the fit called
  unallocated and UPL. The box's sentence on Held says so.
- **Check.** "v2.12 RV3 — what a requirement draws it holds, and a Split is held as far as its basis allows (R17, R32)": USAF
  discretionary 60, mandatory 0 + a 40 add; 100 typed into A's Disc (`setFsrcSvc`) gives the Split 100 / 40, drawing 60 / 40;
  mandatory holds 40, nothing unallocated, no UPL, no UPL line on the board or in Funding Streams; B's Mand 30 into the spent lane
  makes it over by 30 with A (40 / 40) and B (30 / 0, marked) listed. On c23e8a0: held 0, unallocated and UPL 40.
- **Mutation.** `v212-rv3-held-below-drawn`.

### R32 -- no check could tell a Split's typed figure from the clamped one (a coverage gap; the board was right)
- **Check.** The same block: A's Split 600 on a 600 value against 550 (over 50); A's value lowered to 500 with `setAsk`, the Split
  untouched: held 500, drawn 500, nothing over, 50 unallocated, no Needs attention entry. **These pass on c23e8a0**: the code was
  right; the check exists so a fit reading the raw Split fails, which `v212-rv3-held-unclamped` proves. The money map's `w3.fit`
  claim ("held (Splits' typed figures clamped to the basis …)") is now backed: `fitModel`'s service, requirement and lane cells
  cite `rv3.held`.
- **Mutation.** `v212-rv3-held-unclamped` (the fit reads `S.fsrc` dv / mv raw).

### R34 -- no fixture had an over outside the year on screen (a coverage gap; the board was right)
- **Check.** "v2.12 RV3 — an over in a year not on screen is counted, and Go to it puts that year on screen (R34)": with FY27 on
  screen, FY28 ANG 100 typed into C's Split (`setFsrcSvc('C','d',1,'100')`, the votes' corrected fixture: one over, not two): the
  model counts FY28's over beside FY27's two, Needs attention says 3, the box says FY28's sentence, and Go to it on FY28's row
  closes the box, puts FY28 on screen and selects C. On c23e8a0 the count and Go to it were already right; the block fails there
  only on the entry's wording (K10).
- **Mutations.** `v212-rv3-over-screen-year`, `v212-rv3-fitgo-no-switch`.

### R15 -- "$50 more than BES28" for an over measured against BES28 plus added funding
- One vote refuted this as the contract's wording; the lead's instruction for RV3 is to name what the over is against, so it is fixed.
- **What changed.** `fitVs(X, r, i, key)`: the position where that service's base is read from it, "the board's own budget" where
  it is not, and, where the lane carries added funding, "plus added funding ($900 + $150)" -- or "less withheld funding ($900 −
  $150)" for a negative source, where the old sentence was plainly false. The box's over sentence reads it.
- **Check.** "v2.12 RV3 — an over names what it is measured against, and so does Needs attention (R15, R20, K10)" (below) and W3's
  box sentence, moved with a `// v2.12 RV3 (R15):` comment.
- **Mutations.** `v212-rv3-over-vs-position-alone`, `-withheld-said-added`; `v212-w3-box-blames-position` retargeted to `fitVs`.

### R20, K10 -- Needs attention said "over BES28" for overs against the board's own base
- **What changed.** `fitYearNow` counts the overs against the position (`from[i]==='pos'`) and whether their lanes carry added
  funding (`overPos`, `overPosAdd`, `overOwnAdd`; summed by `fitModel`); `fitOverLbl(FM)` words the entry: "over BES28" (plus added
  funding) only when every over is against it, "over the board's own budget" (plus added funding) when none is -- an untagged plan,
  a deleted position, a year or service it does not log -- and "over budget authority (M against BES28)" for a mix.
- **Check.** The block above: untagged, "🏛 2 over the board's own budget" with both sentences; tagged with only USAF's over left,
  "🏛 1 over BES28 plus added funding"; BES28 deleted and still tagged, "🏛 1 over the board's own budget plus added funding"; a
  withheld source. W3's "🏛 2 over BES28" moved to "🏛 2 over budget authority (1 against BES28)" with a `// v2.12 RV3:` comment
  (one of its overs is AFRC's own base); keyboard-reach U's pattern too.
- **Mutations.** `v212-rv3-att-names-tag`, `-att-all-pos`.

### R14, R21, R28 -- a v2.12 lock whose tag logged no position read as "locked before v2.12" and "untagged"
- **What changed.** `cycLock` keeps the tag it read even where it logs no position here: `pos:{key, P:null}` (the votes' accurate
  fix -- `pos:null` lost which tag was read: a plan tagged BES28 locked as PB27 read BES28). `baPos` in a view returns
  `{key, P:null, lock}` for it, and for a lock an earlier v2.12 build stored as `pos:null` (the tag the plan carried, `from`, else
  the lock's own); only a lock with no `pos` at all is from before v2.12. The fit box's hint ("when it was locked, the plan's tag
  (PB27) logged no position for O&M, so its years' bases are the board's own, as locked") and `fitSrcSay`'s year line ("This lock
  kept no PB27 position for O&M: every base is the board's own, as locked.") -- W3's own unreachable branch, now reached.
- **Check.** "v2.12 RV3 — a lock that read no position says so in its view, and a lock before v2.12 still reads as one (R14, R21,
  R28)": an untagged plan locked as PB27 keeps `{key:'PB|2027', P:null}`; its view's hint and year line as above; the same lock
  stored as `pos:null` reads the same; CONTROL, `pos` deleted, "locked before v2.12".
- **Mutations.** `v212-rv3-lock-drops-tag`, `-view-pnull-old`, `-view-null-pos-old`, `-view-hint-reads-pos`, `-lock-year-untagged`;
  `v212-w3-lock-no-pos`, `v212-w3-lock-pos-shared`, `v212-w3-view-old-lock-reads-live` retargeted.

### R16, R19, R29, K11 -- the lock that tags the plan ended "The working board is not changed."
- **What changed.** `cycTagMoves(key)`: every figure the lock's tag moves, year by year and service by service, worked out by
  `baOf` with and without the position. On an untagged plan whose lock key logs a position, the question names them ("The working
  plan's budget authority moves to BES28's now: FY27 USAF discretionary $1,150 → $1,050; … What the lanes fund moves with it.",
  eight at most then "and N more"), and ends "Nothing else on the working board changes."; every other lock ends as it always did
  (recon's lock-question checks hold). The PPBE cycles box's hint under the Lock button says the same instead of "The working board
  is not changed by a lock."; after the lock the status says the plan is "now tagged BES28 (N budget figures now read from its
  position)", not "still tagged".
- **Check.** "v2.12 RV3 — a lock that tags the plan says which figures move, and never that the board is not changed (R16, R19,
  R29, K11)": the hint, the question's last two paragraphs word for word (eight moves across FY27 and FY28), the figures it moved,
  the status; CONTROL, a lock on the now tagged plan ends "The working board is not changed."
- **Mutations.** `v212-rv3-lock-says-unchanged`, `-lock-moves-unsaid`, `-moves-screen-year`, `-lock-hint-unchanged`,
  `-lock-status-still`.

### R36 -- Budget Management said "The base is read from BES28, live" over a year BES28 does not log
- **What changed.** `bmLiveRow` stays for every tagged plan (the votes: Take from a PPBE position is the untagged plan's only, by the
  contract) and words its heading and hint from what the year reads: "The base is read from BES28, live" only where a service's
  base is the position's; otherwise "The plan is tagged BES28 — it logs nothing for FY29: the base is the board's own", or "— O&M
  logs no BES28 position: …", with "Untag the plan to type every base here again" only where something is read.
- **Check.** "v2.12 RV3 — Budget Management says what the year reads; a one-figure position is read as discretionary, and said
  (R36, R37)": FY29 (logged by nobody): that heading, six boxes, no position cell, Take not offered, no "Untag…"; CONTROL FY27; and
  the position deleted, still tagged.
- **Mutation.** `v212-rv3-bm-heading-fixed`.

### R37 -- a one-figure position is read as discretionary, mandatory $0 (a question for Brad: kept, made visible, pinned)
- **What changed.** Today's reading is kept: the one field is the discretionary slot. `baOf` records each service a one-figure
  (not split) position gives a discretionary figure and no mandatory (`one`), and `fitSrcSay` -- the fit box's year line and
  Budget Management's hint -- says "BES28 gives one figure per line: USAF read as discretionary, mandatory $0." The reading is the
  one line `d[i]=D$(c.d); m[i]=D$(c.m);` in `baOf`; another reading is a change there.
- **Check.** The same block: a board whose own mandatory is 200; "+ add an RCN / EEIC line" and $1,200 typed into the box's one
  field (its own change event, `ppSetV(…'d'…)`), the position not split; tagged, USAF reads 1,200 / $0 (its own 200 gives way), ANG
  its own; the fit box and Budget Management say the sentence.
- **Mutations.** `v212-rv3-one-figure-keeps-own-mand` (the vote's alternative reading: own mandatory kept beside a one-figure
  cell), `-one-figure-unsaid`.

### R22 -- the FYDP Spend Plan's UPL added the services together
- **What changed.** `fydpBookApp` keeps each held year's UPL by service (folded with `fydpSvcFold`, as the service tabs name them)
  and lane; `fydpUplRows` writes one line per service and lane after the appropriation tab's TOTAL ("UPL — added funding no
  requirement holds · USAF (discretionary)"), discretionary first. The service tabs still partition the requirement lines only.
- **Check.** W3's FYDP Spend Plan check moved (with a `// v2.12 RV3 (R22):` comment): USAF discretionary 0 / 75 / 0 (75), AFRC
  discretionary 30, ANG mandatory 40, after the TOTAL, — for years not held. On c23e8a0: one line per lane, 105 and 40.
- **Mutations.** `v212-rv3-fydp-upl-summed`; `v212-w3-fydp-upl-lanes` retargeted.

### R31 (the t-ppbe part; t-ace is RV1's), K13 -- the guide
- t-ppbe: "no report states more than the budget authority (the position plus added funding)", and the 🏛 entry named for a plan
  with no position ("over the board's own budget"). The same sentence in the fit box's own hint.
- K13: the 🏛 entry is added only where the votes asked -- not into the list of entries that open a list (it opens the fit box), and
  on the line before it, which RV2's WBS entries do not touch: "The first entry, 🏛 N over BES28, opens the fit to the PPBE position
  instead (see Budget authority from the PPBE position)."
- **Check.** "v2.12 RV3 — the guide names the 🏛 entry and states the budget authority as the position plus added funding (K13,
  R31)".
- **Mutations.** `v212-rv3-guide-no-fit-entry`, `-guide-position-only`.
- The guide is 69,272 characters raw (was 69,029; the budget is 70,000): RV1 and RV2 add to it too.

## Findings not fixed

None of mine. R15's refuting vote is noted above (the lead's instruction settles it).

## Mutations

39 new (`v212-rv3-*`), 6 retargeted, each with a `// v2.12 RV3: retargeted -- why` comment (`v212-w3-ba-aliases-own`,
`-lock-no-pos`, `-lock-pos-shared`, `-view-old-lock-reads-live`, `-box-blames-position`, `-fydp-upl-lanes`); none retired.
`mcount`: 2,994 entries (2,955 at c23e8a0 + 39), every one once. Proofs: `recovery/v212/proofs-RV3.json`,
`recovery/v212/proved-RV3.jsonl` (results below).

**45 proved, 45 CAUGHT** (39 new, 6 retargeted; `JOBS=1 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py
recovery/v212/proofs-RV3.json recovery/v212/proved-RV3.jsonl`; every check passed on the clean board first). None survived. Two were
first caught with a throw beside a real mismatch: `v212-w3-lock-no-pos` (W3's own, as W3 recorded) and `v212-rv3-new-year-not-live`
(its check read `MS.years[2030].bm.disc`, absent under the mutant); that check now reads "no own base" instead, and the re-proof is
CAUGHT by 4 failing checks with no throw.

## Existing checks changed on purpose (each with a `// v2.12 RV3:` comment)
- audit-board W3 "the fit to the position": the box's over sentences (R15), the Needs attention entry (R20, K10), the FYDP Spend
  Plan's UPL lines by service (R22).
- tools/keyboard-reach.mjs U: the 🏛 entry's pattern takes the mixed wording ("over budget authority (1 against POM99)").

## Money map
`tools/money-map.json` gains checks `rv3.read`, `rv3.newyear`, `rv3.held`, `rv3.outyear`, cited on `applyBudget` (fiscal year,
service, lane) and `fitModel` (fiscal year, service, requirement, lane); `tools/money-map.md` regenerated (322 cells: 119 proven,
202 n/a, 1 open -- v2.04's, unchanged).

## Runs (on the final tree unless said)
- `npm run check`: all checks passed (51 boxes).
- jsdom, whole, one at a time: audit-board (8 GB) ALL CHECKS PASSED (twice: before and after the last board edit, `ppSvcFy`
  keeping its `{d, m, t}` shape unless a figure is bad); audit-recon (8 GB), audit-import (8 GB), audit-inject, audit-hostile,
  audit (excel), audit-ui ALL CHECKS PASSED; legacy-fsrc and boot-same passed. audit-other first failed one check -- the v2.10
  review's A-3 CONTROL compares `ppSvcFy`'s JSON, which then carried `bad:false` -- and passed whole once `ppSvcFy` returns `bad`
  only where a figure is bad.
- On c23e8a0 (its board as `BOARD=`, final blocks): 38 failing checks -- every one of the ten RV3 blocks, and the three moved W3
  checks -- each for the finding's reason (R12's block by a TypeError on opening: 0 rows drawn).
- Stages: defects 13/13 guarded by 43 mutations; coverage:money 27/27; money map holds (322 cells: 119 proven, 202 n/a, 1 open,
  v2.04's); trace every link holds (15 surfaces, 77 cells); fuzz nothing lost (seed 613182484); verify:file --selftest passed;
  mcount 2,994 / 2,994 once.
- Browser: keys (U failed on the 🏛 entry's new wording, pattern moved, then passed), panels, dialogs, leftmenu, menus, standards
  (0 findings, nothing new), controls, editors, dropdowns, hostile, pmosave, pointer, frames -- all passed; layout: only the carried
  D ×8 (tops 323 / 420 px, as recorded).

## For the integration
- **Expected conflicts.** The guide's t-alloc: my 🏛 sentence is on the paragraph before the Needs attention list (RV2's), one line
  above it; git may still mark the two adjacent lines. t-ppbe is W3's section (RV1 edits t-ace). `inShapeWhy` gains two lines before
  the band check; `money-map.json`/`.md` (RV1 may add checks: regenerate the .md after merging both). mutate.mjs: RV3 appends inside
  the W3 slot only.
- **The door now refuses a position it cannot read**, at every door including a full import of the user's own board
  (`inboundCheckOwn` runs the same `inShapeWhy`). No ORBIT build writes such a shape (the votes checked every writer); a board's
  own file is not checked on opening and degrades as above.
- **`ppCell` returns `{d, m}` and sometimes `bad:true`**; every reader takes only `d` and `m`.

## For Brad
- **R37**: a position typed in the PPBE box's default "One figure per line" mode is read as discretionary, mandatory $0 (the box's
  one field is the discretionary slot, as Take from a PPBE position always read it). The board now says so where the base is shown.
  If one figure should instead be a total split by the board's own lanes, or leave the board's own mandatory standing, that is the
  one line in `baOf` named above.
- **R15**: the over sentence now names the budget authority's parts when the lane carries added funding ("$50 more than BES28 plus
  added funding ($900 + $150)"); Brad's own example sentence ("$X more than BES28") reads exactly so wherever the lane has none.
