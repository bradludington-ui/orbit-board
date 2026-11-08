# v2.15 W4 — the small fixes (items 131, 135; the handoff's decisions 18 a, 19, 20; v2.12's question 1; item 146's journal and edit-box findings)

Builder W4, branch `v215-w4`, from the slot commit `8c24ea2`. Contract: `recovery/v215/contract.md` §1.4 and §2.

## What was built

**Item 131 — the folder reads.**
- `fydpGather` passes `strict` to `fydpStoreFolder` (the handoff's decision 16): a Full Fund copy in the folder that is mid-sync, cut
  short or not a board refuses that appropriation's block of the five-year workbook and names why; this browser's older copy no longer
  stands in for it. `fydpStoreFolder`'s comment now says every caller passes strict.
- `apFoldRead(then)` / `apFoldOf(k, st)` / `apFoldOn()` (new, before `spDefs`): another appropriation's shared folder copy read as its
  own board opens it, strictly, for the Spruills, the PMO drill, the chart of accounts (all through `spDefs`) and Locks by appropriation
  (`cycOverview`). Read when the panel opens (`toggleSp`, `toggleBl` reset it; `spBody` and `blBody` start it), held while it stays
  open, read again at the next opening. Until the folder answers, nothing is stated for the other appropriations: the Spruills says
  "Reading the shared folder for …" and draws no table (FYDP Disconnects' A-3 rule); Locks by appropriation's working-plan cell says
  "reading the shared folder…". A copy that cannot be read is named: the Spruills block prints — with "⚠ FULL FUND is not read here: …
  Its figures are missing, not zero; this browser's older copy is not used in its place."; Locks by appropriation shows it in the cell,
  neither behind nor counted. The folder carries no locks, so the locked-cycle columns stay this browser's and the file's.
- `spDefs`: a def whose folder copy could not be read, or has not answered, carries `foldWhy` / `foldWait` and no plan (`ms:null`), so
  the Spruills prints — and the PMO drill reads no board figure for it. `spGather` carries both onto the block.
- `exportCoa` reads the folder first when the folder is the store (`apFoldRead(coaExportNow)`), and `coaExportNow` (the old body)
  writes the workbook; `coaRows` leaves out an appropriation it could not read and the first tab and the status line name it
  ("FULL FUND is not on this chart: …"). With the folder not the store (every harness, every board not on the folder) it is
  synchronous, as before.
- `cycPlanOf(st)` (new): what a plan says of its cycle — `held`, `counts`, `tag`, `pos` — read once for `cycOtherOf` (this browser's
  copy) and `cycOverview` (the folder's, when newer). `cycOtherOf`'s body now calls it (see For the integration).

**Item 131 — the house style's indents.** `_houseBase`'s title band (style 7) and `_housePlan`'s subtitle are `{h:'left', v:'center',
indent:1}`; column B's text is `{h:'left', v:'center', indent:1}`; a centred heading no longer carries an indent (Excel never drew it).
Every dressed workbook's `xl/styles.xml` changes; no value, number format or cell moves (v2.04 (item 113)'s "the values written dressed
are the values written plain" holds, unchanged). Grepped every suite for an alignment byte check of the house style: there is none
besides FYDP Disconnects' own (v2.10 WB-1, not house) and its writer CONTROL, which still passes.

**Item 135 — the four gaps.**
1. `execWbsScan`: a row for a prime that names none of its CLINs goes to `scan.primeNoClin` and is never proposed or written (a prime's
   WBS is its CLINs', `wbsStateOf`). The panel lists them (`.exw-prime`, pointing to the 🧾 CLIN drill), the summary strip counts them,
   and `exwApply`'s status line says how many were not written.
2. `clinAskTot` reads each figure with `+v||0`, as `clinVec` and `clinSplit` do: `['5','7']` is 12, not '057'.
3. A re-import's fingerprint: **decided, not changed** (see Decided). `aceClashWhy(a, b)` names the reason in both places a
   disagreement is said (`driveAcePull`'s folder read, `importStores`' file import) when one copy was imported before v2.12 (no `cols`).
4. Another appropriation's stored budget cache: **decided, said, not read live** (see Decided). `spPosTag(d)` marks another
   appropriation's Spruills block whose plan is tagged with a position under its tag; under Board budgets the block says its Available
   Funding is the budget its own board last worked out from that position, and that a position changed since without that board open
   (an appropriation package) reaches these figures once it opens.

**v2.12's question 1 — a CLIN request that is not a list, reported on opening.** `clinAskBadOf()` finds every request in the board data's
CLINs, every year's edited CLINs (`clinMeta`) and every year's added CLINs (`clinNew`) that is present and not a list; `clinAskSay()`
says it once at the end of opening, after everything opening had to say (as `aceHealSay`), kept unread (`statKeep`), naming each
requirement and CLIN with its year and how it is held, at most eight and "and N more". Nothing is changed. Not in a five-year frame.

**The handoff's decision 19 — the guide's five-year text.** `o-export`'s paragraph and `t-fydp`'s first paragraph describe the v2.04
workbook: a Summary (with a chart), a tab for each appropriation, service and PMO, 1-N under the CCaR record printed once, Requirement and
Funded per year in $M, — for a year not held, the service and PMO tabs adding up to the appropriation tab. The office section's first
paragraph no longer offers "the slides" (removed in v2.05). Measured in a booted board as audit-import reads it (`helpDoc.innerHTML`):
71,160 on the slot commit, **71,487** after, under the suite's 72,000 budget (v2.13 raised it from 70,000; the contract's 70,000 is the
v2.12 figure: the guide was already over it on the slot commit).

**The handoff's decision 20 — the Priority Drill's narrow columns.** The Summary's FUNDED BY PMO AND BAND table runs a column per band,
then unbanded and TOTAL, past the BY BAND table's ten widths: with the eight standard bands, unbanded sat in % Fund's 8 and TOTAL had no
width. Every column that table puts dollars in (1 … bands + 1) is now at least 16. Widths only.

**The handoff's decision 18 a — Funded.** The five-year workbook's heading rows (every tab), its Summary's portfolio table, the chart
(title and series) and the panel's table and note say Funded where they said Allocated; the figure is the lane draw (d + m) it always
was. Comments in `fydpBook*` and the money map's three descriptions, and `trace-lib.mjs`'s note, say Funded. The cycle comparison's
Allocated (the allocation, a different figure) is unchanged.

**Item 146.**
- The edit box offers "— follows the PMO and prime rules —" whenever the stored value is one of the five or "none" (`raw===undefined`),
  not only where nothing is stored; picked, `reqApply` deletes the stored value (setSi's rule).
- `jrnlCustomCount(e)` (new) counts the added requirements a by-id line names; `jrnlCustomHere` reads it. Put back of a line whose id
  the year now holds more than once says "FY27 holds 2 added requirements under the id NEW-2, so it could land on the wrong one", not
  "no longer in FY27". `jrnlPlaceTitle(e)` gives a line filed by place in a year whose added ids repeat its own title
  (`JRNL_NOT_PLACE_REP`); elsewhere `JRNL_NOT_PLACE` as before.
- `ccarSameWork(a, b)` (new): two CCaR records are the same work when equal, or one side has none. `yrCopySame` and `yearHas`'s
  whole-year twin clause read it, so a whole-year copy given its record afterwards in either year is still the same work to Roll
  forward and to the duplicate walk (`pmoPriorHere`).

## Decided in the build

- **`aceFingerprint` is not changed to read whole dollars.** Two reasons. The two imports are different figures: v2.12 reads every
  figure as a whole dollar at the door and leaves out, each with its reason, rows the older import kept, so "different" is true of
  them. And every estimate already stored carries the fingerprint it was stamped with, which `aceIntact` checks on every draw: a new
  formula would mark every stored estimate FIGURES CHANGED SINCE IMPORT. What was missing was the reason, so `aceClashWhy` says it
  wherever the disagreement is said, when exactly one of the two was imported before v2.12 (no `cols`). Brad can reverse it.
- **Another appropriation's budget cache is said, not read live.** `baOf` reads this board's service list (`SVC`) and positions are
  kept by service name, so another appropriation's budget worked out on this page would be a second engine (the v1.85 rule), and
  wrong where its services differ (Full Fund's four). The Spruills is the only surface that prints another appropriation's stored budget
  (`livePeerSum`'s `disc` is computed and never drawn), so the note goes under that block, and only where its plan is tagged with a
  position under the tag (`spPosTag`) and the budget source is Board budgets. Brad can reverse it.
- **The Spruills and Locks by appropriation state nothing for the other appropriations until the folder has answered**, as FYDP
  Disconnects does (its A-3 rule), and a copy that cannot be read prints — and is named, never this browser's copy in its place. The
  chart of accounts waits for the same answer before it writes, and leaves an unread appropriation off the chart, naming it.
- **The folder read is shared** by the Spruills, the chart of accounts and PPBE cycles (one `_apFold`), read afresh at each opening of
  either panel and at each chart of accounts export.
- **"— follows the PMO and prime rules —" is offered beside a stored code chosen by hand too**, not only beside a stored "none": the
  item says "where a 'no SI code' is stored"; the same option takes a hand-chosen code back to the rules by the same setter rule, and
  leaving it out there would be the same gap one value along.
- **`ccarSameWork` reaches `yearHas` as well as `yrCopySame`.** The finding names `yrCopySame` and says it mirrors v2.07's rule; with
  only one changed, Roll forward and the duplicate walk would disagree about the same requirement. `yearHas` is no workstream's (§2).
  The trade-off, named: two different box-made requirements added after a copy, one on each side, with the same id, plan event, blank
  title and office, one with a CCaR record and one without, now read as one. Before, one without a record and one with were always two.
- **The CLIN request message reads "and are not read (an edited one reads as the CLIN's request in the board data, an added or
  board-data one as none)"**: an edited request that is not a list falls back to the base CLIN's (`clinList`), not to nothing.
- **The guide's office paragraph lost "the slides"** (removed in v2.05): it sits in the five-year section the handoff's decision 19 names.
- **A centred heading cell carries no indent** in the house style. Excel never drew an indent under centre alignment, so no byte a reader
  sees changes; the rule "an indent always has left, right or distributed beside it" then holds for every dressed style.

Nothing here moves a figure or changes what a person sees beyond what the items describe. No question for Brad.

## Checks

New, each failing on the slot commit unless it says CONTROL (each run on `slot.html` = `git show 8c24ea2:prioritization-board-grid.html`):

- audit-other "v2.15 W4 — the Spruills, the chart of accounts, Locks by appropriation and the five-year plan read the shared folder
  strictly (item 131, item 135)": 12 checks fail on the slot commit (Spruills reading, answered, opened again, its budget note; chart of
  accounts, read afresh for the export; Locks reading and answered; the unreadable copy on the Spruills, the chart and Locks ×2; the
  five-year plan). CONTROLs: the fixture; Initial Spares with no copy anywhere; the five-year plan with the copy readable. Strengthened
  after the first proof run, where `v215-w4-coa-lists-unread` and `v215-w4-coa-no-folder` SURVIVED (each a fixture that could not reach
  its line): the unreadable board now also carries Full Fund as a consolidated payload (the shape where an unread appropriation would be
  listed as delivered), and the folder is saved again between the panel's read and the export (only a fresh read gets $110M).
- audit-other "v2.15 W4 — every dressed workbook draws its indents: an indent always has its horizontal alignment beside it (item 131)":
  4 fail (the board workbook, the Priority Drill, the five-year plan, the chart of accounts); 4 CONTROLs (each carries indents to judge).
- audit-other "v2.15 W4 — the Priority Drill gives every dollar figure a column wide enough to print it (the handoff’s decision 20)":
  1 fails; 1 CONTROL (the fixture puts $1.7B in the tenth column or later).
- audit-other "v2.15 W4 — the five-year spend plan calls the lane draw Funded, in the workbook and on its panel (the handoff’s decision
  18 a)": 3 fail.
- audit-other "v2.15 W4 — the guide describes the five-year workbook the board writes (the handoff’s decision 19)": 4 fail; 1 CONTROL
  (the size budget).
- audit-other "v2.15 W4 — a cost estimate imported again since v2.12 says why it disagrees with the copy imported before (item 135)":
  2 fail; the both-since-v2.12 half is a CONTROL.
- audit-other "v2.15 W4 — the edit box takes a stored SI code, or a stored none, back to the PMO and prime rules (item 146)": 4 fail;
  2 CONTROLs (the fixture; nothing stored).
- audit-board "v2.15 W4 — WBS from execution data never proposes a prime’s own paragraph, and a CLIN request of text figures sums as
  figures (item 135)": 4 fail; 2 CONTROLs.
- audit-board "v2.15 W4 — a CLIN request that is not a list is said on opening, once, naming the requirement and the CLIN (v2.12’s
  question 1)": 3 fail; the "kept as saved" check and the list board are CONTROLs.
- audit-board "v2.15 W4 — Put back of a line by id in a year whose added ids came to repeat says so, never “no longer in FY…” (item
  146)": 2 fail; 3 CONTROLs.
- audit-board "v2.15 W4 — a whole-year copy whose CCaR record is set afterwards is still the same work to Roll forward and the
  duplicate walk (item 146)": 3 fail; 3 CONTROLs (the fixture ×2; two different records are two requirements — taken before anything is
  rolled, since a copy Roll forward made on the slot board would link them).

Existing checks changed on purpose:
- audit-other "v2.04 (item 113) — the house style…", the FYDP chart check: the series is named Funded (`// v2.15 W4:` comment).

## Mutations

43 new (`v215-w4-*`, the W4 slot of `mutate.mjs`), 7 retargeted in place to the line that now carries the same defect, each with a
`// v2.15 W4: retargeted` comment: `v204-113-chart-series-swapped` (the series is Funded), `v207-rv2-yearhas-copied-year`,
`v207-rv2-yearhas-same-number`, `v207-rv3-copy-rule-other-office` (`ccarSameWork`), `v208-rv-si-follows-gone` (the option's new
condition), `v213-136-other-tag-unread`, `v213-136-empty-other-mixed` (`cycPlanOf`). None retired. mcount: every target matches once
(3,650 entries). Proofs: `recovery/v215/proofs-W4.json` → `proved-W4.jsonl`, **50 of 50 CAUGHT** by a failing check (on the finished
board, `prove.py`, JOBS=1, under heavy.sh; `v213-136-other-tag-unread` caught by 11 failing checks, its block also throwing). The first
run (`proved-W4-first.jsonl`) had 48 caught and the two survivors above; the strengthened check caught both, and every folder-block id
was proved again against it.

## Results on the finished board

- Every suite whole (HEAP 8 GB, heavy.sh): boot-same identical; audit, audit-other, audit-board, audit-recon, audit-import,
  audit-hostile, audit-inject, audit-ui ALL CHECKS PASSED; legacy-fsrc "every legacy Force setting computes exactly as before".
  audit-other run whole again after the check was strengthened: ALL CHECKS PASSED.
- `npm run check`: all checks passed. `npm run coverage:money`: 27/27. `npm run money-map` then `--check`: 322 cells, 119 proven,
  202 n/a, 1 open (v2.04's), the report current. `npm run trace`: 15 surfaces, 77 cells, every link holds.
- Browser: panels, menus pass; standards 0 findings, nothing new; layout only the carried D ×8.
- mcount: 3,650 entries, every one matching once.

## For the integration

- **`cycOtherOf`'s body now calls `cycPlanOf(st)`** (four lines moved into the new function, same rule). `cycOtherOf` is read by W1's
  context bar (`cycAll`); if W1 edits `cycOtherOf`, take theirs and keep the one `Object.assign(r, cycPlanOf(st))` line, and the two
  retargeted `v213-136-*` finds now sit in `cycPlanOf`.
- **`yearHas`** (no workstream's) now reads `ccarSameWork` in its whole-year twin clause.
- **`fdcFolderRead`** (W2's box) and `apFoldRead` are two readers of the same strict folder read; the lead may want one. Not merged here:
  `fdcFolderRead` is W2's to change, and its redraw rule (`fdcSync`) differs.
- **W2's general `storage` listener** may want to drop `_apFold` too (another tab's save does not reach the folder, so it is not needed
  for correctness; the folder is read again at each opening).
- `money-coverage.mjs`: `exportCoa`'s `via` gains `coaExportNow`.

## npm script to add

None.

## Known gaps

- The PMO drill (inside the Spruills) never read another appropriation's board allocation (it prints Controls "—" there, v1.95); with
  the folder copy it still does not. Its estimate side reads the cost estimate, which is not in the folder copy.
- `apFoldRead` runs only in folder mode, which no harness board reaches except through the stand-in folder of the new check; the browser
  checks (panels, standards) open the Spruills and PPBE cycles with the folder off.
- The CLIN message names a requirement by the year on screen's title; a requirement the year on screen does not hold is named by its id.
- The five-year workbook's own note line "Allocated" in older recovery files and NEXT-VERSION.md's shipped sections still says
  Allocated: they are the record of what shipped then.
