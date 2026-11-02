# v2.12 RV6 -- the second review of item 134 (W3's and RV3's code, FYDP Disconnects' reading of a position)

Branch `v212-fix6`, from `c81e995` (v212-int: W1, W2, W3, RV1-RV3 and the lead's R37 change merged). The findings are
`recovery/v212/review-round2.json`'s kept list, S00-S21 in order; mine: S04, S05, S06, S07, S08, S09, S14, S17, S18, S19
(S04, S05, S14 and S17 are one defect seen four ways). Each finding was read with both skeptics' votes, and their corrected text is
what was fixed where it sharpened or narrowed the finding.

Every check is in the v2.12 W3 slot (`// ==== v2.12 W3 ...`), after what was there: six blocks in audit-board (`v2.12 RV6 — …`)
and one in audit-other. Every mutation is in mutate.mjs's W3 slot, after RV3's, ids `v212-rv6-*`. **Every RV6 block but two fails on
c81e995** (its board, `git show c81e995:prioritization-board-grid.html`, as `BOARD=`: 24 failing checks in five blocks), each for the
finding's reason; the two that pass there are named below with why (S19 and the split-position proof), and every part labelled
CONTROL passes there by design.

## The one rule: S04, S05, S14, S17 (and S18's fixture)

- **What was wrong.** Brad's R37 decision (28 Oct, "Keep my lane split": a position logged one figure per line sets each service's
  total for the year; the board's own base for that service and year splits it, whole dollars; all discretionary where that base is
  $0) was written into `baOf` alone. The position's two other readers kept the reading Brad rejected:
  - **Take from a PPBE position** (`bmPpVec` → `bmSeedFromPp`) offered "disc 1,000 → 1,800 | mand 200 → 0" and wrote the board's own
    mandatory base to $0, so a later tag divided 1,800 by 1,800 / 0 and read 1,800 / 0 -- the same position and tag giving two lane
    splits by history, and a Split's directed mandatory going unfunded.
  - **FYDP Disconnects** (`fdcModel`'s `pos()`) printed the whole figure as Discretionary and $0 Mandatory, on the Summary, every
    service sheet and in the workbook, beside a Budget Management that divided it 1,500 / 300.
- **What changed.**
  - `ppLanesOf(Q, sv, fy, od, om)` (beside `ppSvcFy`): the one statement of how a position's figure for one service and year divides
    between the lanes, `{d, m, t, how}`, whole dollars at the door. `split`: as logged. `own`: a one-figure total divided by
    `apportion(t, [od, om])`. `disc`: no own base ($0 in both lanes), the figure discretionary. `nobase`: the own base could not be
    read (`od` or `om` null) -- `d` and `m` null, never guessed. `ppLanesSaid(L)` is whether a reading is one the board says.
  - `baOf` reads it (its behaviour unchanged: the R37 lines moved into the function).
  - **Take**: `bmPpVec(key, fy, own)` reads each service through it, dividing by the base as it stands before the take (`S.bm`)
    unless told another, and returns `one` (fitOneSay's `{sv, how}`). `bmSeedFromPp`'s question and status line say how each
    one-figure service was divided (`fitOneSay`), and it writes the lanes as read (already whole). `bmPpState` reads the position
    "now" divided by the figures the take wrote (`pp.disc`, `pp.mand`), so the same total divides back to exactly what was taken: a
    base edited after the take is "edited here", never a position that "has changed since". A later tag then reads what the take
    wrote: the own base the take wrote divides the same total back to itself.
  - **FYDP Disconnects**: `fdcStores` carries each appropriation's store and its services (`fdcSvcsOf`: the consolidated payload's
    list, else the store's own data pack, else `MS.svc`), and `fdcModel` divides a one-figure position by THAT appropriation's own
    base for the year: `fdcOwnBase(s, y)` reads the year from the store its own board opens (this board's `S` for the year on
    screen, `MS.years[y]` otherwise; another appropriation's `st.years[y]`) through `bmOwnOf(Y, n)` -- its Budget Management base,
    else the budget it holds (applyState's rule for a year with no components), read by the opening rules (`stMoney`, `stBmTot`)
    against that appropriation's own service list, by name. A year the store holds no plan for, a service list that cannot be read,
    a budget that is not a list of that width, or a service that appropriation does not carry is `nobase`: that year's
    Discretionary and Mandatory are null (—) and its Controls are the figure (the Controls are each year's total, `lane(p, 't')`,
    no longer `plus(d, m)`, and the totals `T.c` / `tc` add them). `fdcOneSay` says, per appropriation, which services were divided,
    which read as Discretionary (with the years) and which could not be divided (with the years and why); it is joined to v2.11's
    note in `M.note`, so the box and the workbook say it from one string.
  - **A split position is read exactly as before**, to the byte: `ppLanesOf`'s split branch is `D$(c.d)` / `D$(c.m)`, what
    `pos()` added, and `lane(p, 't')` is `plus(d, m)` whenever both lanes are known. Proved against c81e995 (below).
  - The PPBE box's one-figure hint names every reader ("Wherever it is read — a working plan’s budget, Take from a PPBE position,
    FYDP Disconnects — …").
- **Checks.**
  - audit-board "v2.12 RV6 — a one-figure position is read by one rule: the live budget, Take from a PPBE position and FYDP
    Disconnects divide it alike (S04, S05, S14, S17, S18)". The fixture makes the alternatives disagree: USAF 1,800 over 1,000 / 200
    (1,500 / 300, against the old 1,800 / 0), ANG 21 over 10 / 10 and USN 1,801 over 500 / 500 -- half-dollar ties, so apportion
    (11 / 10, 901 / 900) is told from rounding each lane (a dollar invented) and flooring each (a dollar dropped) -- and AFRC 50 with
    no own base (discretionary). Full Fund's store holds its own base in its own service order (USN first), FY27 with a Budget
    Management base whose cache is a different figure, FY29 with no components (its cache is its base), FY28 not held. Parts: the
    live budget (CONTROL on c81e995: baOf already divided) with every lane a whole dollar adding to the figure; Take through Budget
    Management's own select -- the question's four lines, its sentence, the base written, the status line, not edited / not moved, an
    edit after the take "edited" and not "moved", and a later tag reading the same lanes; FYDP Disconnects -- the Summary (O&M by
    O&M's base, Full Fund by Full Fund's, FY28 — with its Controls 400, FY29 from the cache 50 / 150), the USAF and USN CV sheets, the
    note in the model, the box and every sheet of the workbook read from its bytes. **Fails on c81e995**: Take (5 checks: all
    discretionary, no sentence, the base written, the status line, the later tag) and FYDP Disconnects (8: all discretionary, Full Fund by its own base, FY28 —, FY29 from its cache, the sheets, no note in the model, the box or the workbook).
  - audit-other "v2.12 RV6 — FYDP Disconnects reads a split position exactly as before: the model, the sheets and the box, against the
    board before the one rule (S05, S14)": the v2.10/v2.11 shapes (three appropriations, split positions with cents in both lanes, a
    year not logged, services no group takes, other stores holding their own bases) -- `fdcModel`, `fdcSheets` and the box's text
    identical to c81e995's, read from git. **Passes on c81e995 by construction** (it is the board compared against); it is the proof
    that the rewrite moved nothing for a split position, and `v212-rv6-split-read-as-total` proves it bites.
- **Existing checks changed on purpose** (each with a `// v2.12 RV6:` comment):
  - audit-board "v2.02 (D5c …)": the position is entered split -- the check is about a fraction rounded at the door, and a one-figure
    {1000.6, 250.4} is now a total divided by the board's own base.
  - audit-other "v2.10 review — … (A-3)": `posOf` builds split positions -- the block is about which copy is read; its unsplit d and
    m were never a split to divide.
- **Mutations.** New: `v212-rv6-split-read-as-total`, `-one-figure-rounded`, `-one-figure-floored`, `-one-figure-unrounded`,
  `-nobase-guessed`, `-take-all-disc`, `-take-unsaid`, `-take-status-unsaid`, `-state-moved-by-edit`, `-fdc-all-disc`,
  `-fdc-board-base`, `-fdc-svc-by-position`, `-fdc-year-guessed`, `-own-base-reads-cache`, `-own-base-no-cache`,
  `-fdc-ctl-from-lanes`, `-fdc-unsaid`, `-fdc-nobase-unsaid`, `-fdc-note-not-written`. Retargeted (each with a
  `// v2.12 RV6: retargeted -- why` comment): `v202-d5c-unrounded` (to `ppLanesOf`'s split mandatory), `v210-a-pos-unrounded`
  (its split discretionary), `v210-a-intl-req-not-added`, `v210-a-own-from-storage`, `v212-w3-ba-k-divided`,
  `v212-rv3-one-figure-keeps-own-mand`, `v212-r37-one-figure-all-disc`, `v212-r37-one-figure-no-own-split`.
  `v212-rv6-one-figure-unrounded` is caught only through FYDP Disconnects (Full Fund's USN 40.4): `apportion` rounds its total and
  `baOf` rounds its result, so in the live budget an unrounded total is equivalent -- the Controls are where it would show.

## S06 -- a lock taken before v2.12 read "The plan is untagged"
- **What was wrong.** In a locked view, a lock with no `pos` (taken before v2.12) gives `baPos()` null, so `fitSrcSay` said "The plan
  is untagged: every base is the board’s own, from Budget Management." on every year, under a hint saying it was locked before v2.12,
  of a plan the lock records as tagged (`from`).
- **What changed.** `fitSrcSay`, in a view with no key: "This lock was taken before v2.12, the plan tagged BES28, and kept no position:
  every base is the board’s own, as locked." The tag is the lock's own record: `from` (the tag the plan carried), else the lock's key
  (which a build before v2.12 gave an untagged plan as the lock was taken -- `MS.cycle=key` right after it projected).
- **Check.** audit-board "v2.12 RV6 — a lock taken before v2.12 is said as a lock of a tagged plan, never as an untagged plan (S06)":
  a plan tagged BES28 locked as PB27, `pos` deleted (CONTROL: `from` is BES|2028); `from` emptied (names PB27); CONTROL: off the view an
  untagged plan is still said as untagged. **Fails on c81e995** (2 checks).
- **Mutations.** `v212-rv6-old-lock-untagged`, `-old-lock-tag-ignored`.

## S07 -- withheld funding was "plus added funding" in Needs attention, and the floor went unsaid
- **What was wrong.** `fitYearNow` counted any non-zero source as added funding (`Math.abs(add)>0.5`), so a lane whose sources come to
  less than nothing made Needs attention say "over BES28 plus added funding" beside the box's "less withheld funding". And `fitVs`
  printed "($100 − $150)" where the budget authority is floored at $0.
- **What changed.** `fitYearNow` counts added (`a>0.5`) and withheld (`a<-0.5`) apart (`overPosLess`, `overOwnLess`, summed by
  `fitModel`); `fitOverLbl` says "plus added funding", "less withheld funding", or, where overs' lanes carry each, "with funding added
  and withheld". `fitVs` adds ", floored at $0" inside the parentheses wherever base plus sources is below zero.
- **Check.** audit-board "v2.12 RV6 — withheld funding is "less withheld funding" in Needs attention too, and an over states the floored
  budget authority (S07)": tagged, USAF's Cong add turned into a Withhold of 150 ("🏛 1 over BES28 less withheld funding"); BES28 cut to
  100 (", floored at $0", the over the whole 1,100; CONTROL: BA $0); untagged with one added and one withheld lane over ("with funding
  added and withheld"); withheld alone ("less withheld funding"). **Fails on c81e995** (4 checks).
- **Mutations.** `v212-rv6-withheld-counted-added`, `-att-mix-said-added`, `-att-less-unsaid`, `-floor-unsaid`; retargeted
  `v212-rv3-withheld-said-added`, `v212-rv3-att-names-tag`, `v212-rv3-att-all-pos`.

## S08 -- a v1-shape figure written as words was $0 budget authority, in silence
- **What was wrong.** `ppNorm`'s v1 branch stored `ppNum(x)||0`: words became 0 before `ppCell` could mark the cell bad.
- **What changed.** Both v1 branches (flat and by cost element) keep the figure as the file wrote it (the votes' form, not NaN: a NaN
  put into `MS.ppbe` by `ppPos` would save as null, a silent blank). `ppCell`, `ppSvcFigs` and `ppOutside` read every cell through
  `ppNum`, so text the board reads as an amount is that amount and words are bad: the board's own base stands, and why is said.
- **The door** already held the v1 shape to the v2 rule (`inPosWhy`: every v1 year-cell through `inAmtWhy`, words refused, text
  taken): no change there; the check pins it as CONTROLs.
- **Check.** audit-board "v2.12 RV6 — a position in the older (v1) shape whose figure is words keeps the board’s own base and says why,
  as the v2 shape does (S08)": the door refuses words and takes "1,800" (CONTROLs, flat and by cost element); the board's own file with
  `{USAF: {2027: 'abc', 2028: 5000}}` opens with FY27 USAF on its own base (1,150 / 200), why recorded and said in the fit box, FY28
  still BES28's (5,000 divided as FY28's own 1,100 / 210 divides it, + 75); the same by cost element. **Fails on c81e995** (3 checks).
- **Mutations.** `v212-rv6-v1-words-zero`, `-v1-ce-words-zero`.

## S09 -- the guide never stated the one-figure rule
- **What changed.** t-ppbe's first paragraph: "each service the position names takes that year’s figures as its base" and a sentence
  in Brad's terms: "A position logged one figure per line sets each service’s total for the year, split between discretionary and
  mandatory as the board’s own base for that service and year splits it (all discretionary where that base is $0); Take from a PPBE
  position and FYDP Disconnects read it so too." Paid for in part by tightening the next sentence ("A service it does not name … keeps
  the board’s own base, and says so").
- **The guide's size:** 69,888 characters (69,662 at c81e995; the budget is 70,000): +226. Not raised. RV5 may add to it too: if the two
  together pass 70,000 at integration, tighten my sentence first.
- **Check.** audit-board "v2.12 RV6 — the guide states the one-figure rule in Brad’s terms (S09)". **Fails on c81e995.**
- **Mutation.** `v212-rv6-guide-one-figure-gone`.

## S18 -- the R37 check could not tell apportion from per-lane rounding (a coverage gap)
- The RV6 one-rule block's fixture carries two half-dollar ties (above), and asserts every lane `Number.isInteger` with the lanes adding
  to the figure typed. Its live-budget part **passes on c81e995** (baOf was right; the gap was the check), and
  `v212-rv6-one-figure-rounded` (rounding each lane: a dollar invented) and `-floored` (a dollar dropped) prove it bites; Take and
  FYDP Disconnects carry the same ties.

## S19 -- the lock question's "; and N more" was never reached (a coverage gap)
- **Check.** audit-board "v2.12 RV6 — a lock that moves more figures than it lists says how many more (S19)": BES28 logs FY29 for USAF
  too, so the lock's tag moves twelve figures (CONTROL); the question lists the first eight and ends "; and 4 more. What the lanes fund
  moves with it."; the status counts 12; FY29 moved. RV3's word-for-word eight-move check stays as it was. **Passes on c81e995** (the
  code was right); `v212-rv6-lock-moves-more-dropped` proves it bites.

## Findings not fixed

None. S17's first vote refuted it as a scope question for Brad (his R37 answer was asked about baOf); the lead's instruction for RV6
settles it -- one rule, every reader -- and the second vote and S04/S05/S14's votes uphold it.

## Mutations

29 new (`v212-rv6-*`), 11 retargeted (each with a comment), none retired. `mcount`: 3,101 entries (3,072 at c81e995 + 29), every one
once. Proofs: `recovery/v212/proofs-RV6.json`, `recovery/v212/proved-RV6.jsonl`
(`JOBS=1 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py recovery/v212/proofs-RV6.json recovery/v212/proved-RV6.jsonl`).

**40 proved, 40 CAUGHT** (29 new, 11 retargeted), none survived, none crashed, none caught by a throw: every check passed on the
clean board first. The one-rule block catches 18 of the new ids; the split-position proof in audit-other catches
`v212-rv6-split-read-as-total` (5 checks); each retargeted id is caught by the block that caught it before (`v202-d5c-unrounded` by
D5c, the three `v210-a-*` by the v2.10 A block, `v212-w3-ba-k-divided` by W3's live block, the three `v212-rv3-*` by RV3's over block,
the three one-figure ids by RV3's R36/R37 block).

## Money map and coverage
- `tools/money-map.json` gains `rv6.lanes` (the one-rule block), cited on `applyBudget` (service, lane) and `exportFdc`
  (appropriation, lane); `tools/money-map.md` regenerated (322 cells: 119 proven, 202 n/a, 1 open -- v2.04's, unchanged).
- `tools/money-coverage.mjs`: `ppLanesOf`, `bmPpVec`, `bmPpState`, `bmSeedFromPp` under `applyBudget`; `ppLanesOf`, `fdcOwnBase`,
  `fdcSvcsOf`, `fdcOneSay`, `bmOwnOf` under `exportFdc`. 27/27 surfaces.

## Runs (on the final tree)
- `npm run check`: all checks passed. `mcount`: 3,101 / 3,101 once.
- jsdom, whole, one at a time: audit-board (8 GB, 312 s), audit-other (4 GB), audit-import (8 GB, 1,107 s), audit-recon (8 GB,
  1,090 s), audit-inject, audit-hostile, audit (excel), audit-ui -- ALL CHECKS PASSED; legacy-fsrc and boot-same passed. The one
  audit-other check the change first broke was A-3's (its unsplit fixture; moved, above).
- On c81e995 (its board as `BOARD=`, the six audit-board RV6 blocks): 24 failing checks in five blocks, each for the finding's reason;
  the S19 block and the CONTROLs pass there (above).
- Stages: defects 13/13 guarded by 43 mutations; coverage:money 27/27; money map holds (322 cells: 119 proven, 202 n/a, 1 open);
  trace every link holds; fuzz nothing lost (seed 69011041).
- Browser: panels, dialogs, menus, keys, leftmenu, hostile, controls (62 / 62), dropdowns, standards (0 findings, nothing new) --
  all passed; layout: only the carried D ×8 (tops 323 / 420 px, as recorded). Not run: editors, pmosave, pointer (nothing they
  measure moved).

## For the integration
- **Expected conflicts.** None with RV5's slots (mine are all inside the W3 slot). The guide: my t-ppbe edit is W3's section; RV5's
  guide text, if any, is elsewhere, but the guide's size budget is shared (69,888 of 70,000 here). mutate.mjs: RV6 appends inside the
  W3 slot only. money-map.json / .md and money-coverage.mjs: regenerate the .md after merging if RV5 also cites checks.
- **The other appropriations' stores in FDC now matter for one-figure positions**: a year they do not hold, or a store with no
  service list, prints — under Discretionary and Mandatory for a one-figure position (and says so). For a split position nothing changed.

## For Brad
- **A one-figure position now reads one way everywhere.** Take from a PPBE position offers and writes "disc 1,000 → 1,500 | mand
  200 → 300" for a one-figure 1,800 over an own base of 1,000 / 200 (it wrote 1,800 / $0), and FYDP Disconnects prints 1,500 / 300
  under BES28's Discretionary and Mandatory (it printed 1,800 / $0). Both say so. This extends your R37 answer ("Keep my lane split")
  from the live budget to the position's other two readers, as the lead directed; a reviewer asked whether you meant it to reach them.
- **FYDP Disconnects and a year an appropriation holds no plan for.** A one-figure position for such a year cannot be divided (there is
  no own base to divide by): its Controls print the figure and its Discretionary and Mandatory print —, said in the box and the
  workbook. Entering a cycle split avoids that.
