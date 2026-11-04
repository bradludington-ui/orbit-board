# v2.14 review round 2, fixer RV2-D: held typing, older files' mend, other appropriations' Spruills figures

Branch `v214-rv2d`, from `99f754a` (`74a6aec` plus the lead's Windows-kit fix and one wording change). Probes were copied
into the scratch folder `scratchpad/v214rev2/rv2-D/probes/` and pointed at this worktree's board. "The board before" is
`74a6aec` (`git show 74a6aec:… > pre.html`). Each check was run slimmed on `pre.html` and on the fixed board, then whole.

## The findings, most severe first

### spruills-other-appn-base-requirements-zero (wrong figure): reproduced, fixed

- **Reproduced** with the math reviewer's `pF-spruills-vs-fydp.mjs`, on the Windows-check big board saved by v2.12 and opened
  on O&M. The program's `APPNS` is empty, and Full Fund's plan holds 30 requirements ($209,844,000).
  - Spruills read FULL FUND as Total Requirements 0 and Delta +87,600,000, and INITIAL SPARES as 0.
  - The PMO drill read PSM in Full Fund as 0.
  - The chart of accounts listed `{O&M: 60}` and nothing from the other appropriations.
  - The five-year plan workbook printed 209.844.
- **Fixed**, in spDefs' `data:` for the other appropriations: `_hasData(APPNS[a])? APPNS[a] : ((st && _hasPack(st))? st.dataPack : APPNS[a])`.
  This is the reviewer's line, and the rule pkgPackOf already follows. RV2-B's change (which stored copy is read) is on the
  line above, so the two merge cleanly. The fix reads `st` whichever copy is chosen.
- **Found while writing the check (also a wrong figure, also pre-existing): the chart of accounts listed every added
  requirement of the appropriation on screen twice.** On a board with no consolidated payload:
  - spDefs gave the board's own appropriation `DATA`. `DATA.items` is the year on screen's list, with its added
    requirements already in it (`applyState`: `itemsOf(BASE_ITEMS, S)`).
  - coaRows reads a def's items through `itemsOf()`, which puts that year's added requirements on top again.
  - So "Where we stand" read O&M as 5 requirements and $2,200 for a year holding 3 and $1,700.
  - Fixed in the same function's `data:` for the board's own line: `Object.assign({}, DATA, {items:BASE_ITEMS})`.
  - coaRows is the only reader of the own def's items. Spruills and the PMO drill read the board's own appropriation
    through spOwnYear, so they are unchanged. The rest of DATA (services, cost elements) rides along.
- **Check:** audit-board `v2.14 RV2-D — the Spruills, the PMO drill and the chart of accounts read another appropriation from
  its own plan’s data pack, and this board’s added requirements once`.
  - The fixture is the v1.95 block's own scenario and oracle, except that `APPNS` is left empty and FF1 and FF2 are in Full
    Fund's plan's `dataPack`. The plan is the same in this browser's storage and in `PUBS`, so the check holds whichever
    copy is read. A fixture check asserts this shape.
  - It asserts, against literals: Full Fund's Total Requirements, Available Funding and Delta for two years; its rows by
    service and by PMO; PSM in Full Fund in the PMO drill by service and year; the chart of accounts' rows for both
    appropriations, the board's added requirement N once; and `coaSummary` ("Where we stand").
  - It fails 6 checks on `74a6aec` and passes now.
- **An existing check corrected** (`// v2.14 RV2-D:`): audit-import RV1-D oldfiles part (d) pinned Spruills reading O&M from
  Full Fund as $200. That is NEW-2 alone, the wrong figure. The truth is $1,400, A plus NEW-2, as skeptic 1 predicted. All
  three (d) expectations are now $1,400.
- **Money map:** catalogue entry `bo.rv2dPack` is cited in the appropriation cells of `spGather`, `pmoDetail` and
  `exportCoa`, and `money-map.md` is regenerated: 322 cells, 119 proven, 202 n/a, 1 open, as before.
- **Defect register:** two entries, `spruills-read-another-appropriation-as-zero-on-a-program-file` and
  `chart-of-accounts-listed-the-boards-own-added-requirements-twice`.
- **Mutations:**
  - `v214-rv2-d-spdefs-other-pack` puts `data:APPNS[a]` back.
  - `v214-rv2-d-spdefs-own-doubled` puts `DATA` back on the board's own line.
  - `spdefs-no-fallback` is retargeted in place to the own line as it now reads.

### spruills-checks-cannot-reach-a-real-board (test gap): closed by the check above

- The two cited v1.95 blocks are unchanged. They prove the consolidated-slot route.
- The new block proves the data-pack route every program file takes.
- The money map now cites both, and the mutation the finding asked for (`data:APPNS[a]` put back) is caught by the new block.

### rcn-twin-typing-moves-to-the-other-row (regression, typing saved on the wrong row): reproduced, fixed

- **Reproduced** with `pA2-rcn-twins.mjs` and `pA-rcn.mjs` on this board.
  - With K1 twins, typing 99999 in row 1, then a load that retitles row 1: the keyboard and the typing go to row 2, and
    leaving the field stores `[["K1","Depot repair","11111"],["K1","Depot","99999"]]`. A still reads 11111, and nothing is said.
  - Keyless twins (case 1): 12345 is saved on row 2.
  - Typing in the second twin while a load fills the first (case 3): the typing is dropped, and the message says the row
    "has no key of its own, and the list as loaded no longer holds that row as it was", which is untrue.
- **Superseded at the finish (below):** the total-count signature dropped the typing in cases 74a6aec handled right. The rows are
  now followed from draw to draw (`rcnCarry`). What follows is the first cut, kept as the record.
- **Fixed** in rcnRowSig: the signature now carries how many rows hold exactly the same in all (`'#'+sig+'#'+n+'/'+all`). A load
  that changes, adds or removes any twin therefore matches no row, and the typing is put on no row.
  - rcnBody gives such a loss its own words, through `rcnSigTwin` (a held signature whose total is above one): "the row it
    was in was exactly like another row on the list, and once the list was loaded the two could not be told apart. Nothing
    was changed." It never says "has no key of its own" or "no longer on the list" there.
  - A plain redraw keeps the totals, so RV1-D's part (e) is unchanged.
- **Decided:** in the mirror case (typing in the lower twin, a load changes the upper one), 44aa984 kept the typing on row 2,
  and this fix drops it with words.
  - Among identical rows nothing tells which twin a load changed: an upper twin renamed and a lower twin renamed then moved
    up look the same.
  - Putting the typing on no row and saying so is RV1-D's own rule ("a row changed or gone takes it with it").
- **Check:** audit-board `v2.14 RV2-D — typing in one of two identical RCN / EEIC rows is never moved onto the other by a load
  that changes one of them`, with parts:
  - (a) K1 twins, typing in row 1, the load renames row 1;
  - (b) typing in row 2, the load renames row 1 (the words);
  - (c) keyless twins;
  - (d) and (e) CONTROLS: a plain redraw, and a load that changes a third row, which both keep the typing on row 1.

  It fails 6 checks on `74a6aec` and passes now.
- **Browser:** keyboard-reach section W gains a twins case in Chromium (`W · two identical rows, row 1 renamed by a load …`),
  with real keys and Tab, seeded from page code.
- **Mutations:**
  - `v214-rv2-d-rcn-twin-total` drops the total;
  - `v214-rv2-d-rcn-twin-words` drops the twin wording;
  - `v214-rv1-d-rcn-sig-no-count` is retargeted in place to the line that now carries the count.

### byband-counts-a-requirement-the-mend-took-out (minor, a count): reproduced, fixed

- **Reproduced** with `pA-mend.mjs`: "FROM FULL FUND: 1910 figures clean, 1910 mended; 1 differ — exportCSV ▸ Summary ▸ O&M ▸
  unbanded clean 4 mended 5".
- **Fixed** in exportCSV's by-band block, in the counting of `yr.order` only. An id counts only when it is on that year's
  list: `itemsOf(base, yr)`, where `base` is the consolidated payload, else the plan's own data pack, else this board's own
  `BASE_ITEMS`. Where no master list is known the order is counted as it stands, as before. RV2-B's change to which stored
  copy is read is on the lines above.
- **Check:** audit-board `v2.14 RV2-D — the Priority Drill’s count by band across every appropriation counts only the
  requirements on each year’s list`, run from Full Fund, with O&M's damaged plan identical in storage and in `PUBS`.
  - O&M counts 4.
  - CONTROL: Full Fund counts its own 2.

  It fails 1 check on `74a6aec` and passes now.
- **Register:** `priority-drill-by-band-counted-an-id-with-no-requirement`.
- **Mutation:** `v214-rv2-d-byband-ghost`.

### fuzz-cannot-see-customAside (test gap): reproduced, fixed in the tool

- **Reproduced:** the fuzz's scan listed 54 containers, without customAside.
- **Fixed** in `tools/roundtrip-fuzz.mjs`.
  - The scan also reads what each function applyStore hands a year to (`fn(MS.years[…]`, applyState excepted) writes through
    its own name for that year: `P.<key> =` and `P.<key>.push(`. Reads through a bracket are not counted. So customMend's
    `T.customAside` is a container (55 now), and a future mend written the same way will be as well.
  - populate() fills `S.customAside` with an entry in the shape v2.13's Put back leaves.
- **Proof, by hand on scratch copies:**
  - A board whose applyStore drops customAside: the fuzz reports `years.2027.customAside saved [...] read undefined` at
    save → reopen.
  - The fuzz without the populate line fails at populate ("never filled").
  - The real board, seed 424242: NOTHING WAS LOST.

### verify-file-fails-every-file-saved-over-ten-minutes-ago (untrue message): reproduced, fixed in the tool

- **Reproduced** with the reviewer's `small-saved-11min-ago.html`: `FAIL save → reopen returns every value log.1: undefined →
  {"by":"unknown","ts":0}`, NOT CERTIFIED.
- **Fixed** in `tools/verify-file.mjs` by `settledLog(file, now, by)`, applied to the reopened and the second-saved states.
  - It takes an entry off only when that entry is exactly the verifier's own: the last entry, under the name this check
    saved as (`MS.by` after its save), after a log that is otherwise the file's own. The head that the board's 60-entry cap
    drops is allowed for.
  - A log that lost or changed one of the file's entries still differs, and still fails.
  - Deleting `m.log` outright (the reviewer's alternative) would have hidden a lost entry, as skeptic 1 noted.
- **The self-test** now also certifies the same file with its last save an hour ago and every log entry under another
  editor's name ("Pat Colleague").
  - On the old reading (a scratch copy with `settledLog` returning `now`), that step FAILS and the self-test fails.
  - Now it passes, and the 11-minutes-ago file is CERTIFIED.

## The also-noticed items

### An older ORBIT's Put back can leave one added requirement twice: reproduced (a wrong figure), fixed

- **Reproduced** with `pE-dup-ids.mjs`, using v2.13's own Put back (put back the delete of NEW-3, remove NEW-1, put the same
  delete back). This build kept `[NEW-2, NEW-3, NEW-3]`, and DATA.items held NEW-3 twice.
- A harvest of eight exports (`pDup2.mjs`) found the chart of accounts listing NEW-3 twice: "Where we stand" read 7 and
  $2,800 against 5 and $2,200 clean, which the own-appropriation doubling above inflates further. The engine, the tiles and
  every other export were equal.
- **Fixed** in customMend:
  - The first entry for an id stays: it is the one every setter and reader finds.
  - A second entry for an id already on the list is set aside, as found (`{i, v}`), in customAside, and counted as `twice`.
  - customMendWords says "N second entry/entries for a requirement already on the list set aside in the file, where nothing
    counts it", on opening and in the full import's question and report.
  - Ids are kept in a map with no prototype.
- **Outside my list, the smallest change, named:** itemsOf leaves out a repeated id when it reads another appropriation's raw
  store, as it already leaves out what the mend sets aside. Without this, Spruills from Full Fund added NEW-3's $300 twice.
- **Check:** audit-import `v2.14 RV2-D — an added requirement an older ORBIT left twice in the list is kept once …`. The damage
  is v2.13's own (`git show c863dc2`).
  - (a) opened from storage: once, the repeat set aside, and said;
  - (b) the chart of accounts: 3 requirements, $1,700;
  - (c) from Full Fund: Spruills $1,700, and the chart of accounts once;
  - (d) the full import's question, and the reopened board;
  - (e) the saved file.

  It fails 7 checks on `74a6aec` and passes now.
- **Register:** `an-added-requirement-an-older-orbit-left-twice-was-counted-twice`.
- **Mutations:** `v214-rv2-d-mend-keeps-twice`, `v214-rv2-d-itemsof-twice`, `v214-rv2-d-mend-twice-unsaid`.
- Retargeted in place, because itemsOf's line changed: `v214-rv1-d-other-appn-unread` and
  `v214-rv1-d-other-appn-counts-aside`.

### Roll forward copied customAside into the new year: reproduced, fixed

- **Fixed:** switchYear's roll forward deletes `customAside` from the seed. What the mend set aside is that year's record of the
  file as it was found, never part of the plan.
- **Check:** part (c) of the audit-import block below. FY28 holds nothing set aside, FY27 keeps its 1, and the saved file
  agrees. (d) is a CONTROL: the rolled year still carries NEW-1's value.
- **Mutation:** `v214-rv2-d-roll-copies-aside`.

### customMendSay was said only at the end of opening: fixed

- **Fixed:** applyStore notes how many mends there were before mending. Once the board is open (`ACE_BOOTED`, the
  `aceHealSay` precedent), it says what this load mended, kept unread (`statKeep`), with `_statQuiet` cleared, in the same
  words but "as it was loaded". customMendSay takes the list and how. While opening, the end of the boot still says it once.
- **Check:** audit-import `v2.14 RV2-D — a list mended by a load once the board is open is said as it lands, and Roll forward
  does not copy what a mend set aside`.
  - (a) A clean open board, then an applyStore of a damaged store: mended, and said unread.
  - (b) CONTROL: a clean load says nothing of a mend.

  The block fails 3 checks on `74a6aec`: (a)'s words, and (c) twice.
- **Mutation:** `v214-rv2-d-mend-later-unsaid`.

## Mutations and proofs

- 10 new mutations in the RV2-D slot, and 4 retargeted in place: `spdefs-no-fallback`, `v214-rv1-d-rcn-sig-no-count`,
  `v214-rv1-d-other-appn-unread` and `v214-rv1-d-other-appn-counts-aside`.
- `mcount` reports 3,519 entries, each matching once.
- Every mutant parses (`node tools/check.mjs` on each).
- `recovery/v214/proofs-RV2D.json` lists all 14. `JOBS=1 HEAP=8192 prove.py` → `recovery/v214/proved-RV2D.jsonl`: **14 of 14
  CAUGHT**, each by a failed check, none by a throw.

## The finish: what the check of this fix found, and what changed

The independent check of the first cut (`8028c1b`) re-ran every probe and found three new defects: x1, x2 and x4. It confirmed
the other fixes held. Its probes were copied into `scratchpad/v214rev2/rv2-D/p3/` and run on this worktree's board. "The first
cut" is `8028c1b` (`cut1.html`). "The board before" is still `74a6aec` (`pre.html`).

### x1: the total-count signature dropped typing it should have kept, in untrue words (regression against 74a6aec)

- **Reproduced** with `x1-rcn-edges.mjs` on the first cut. All three cases dropped the typing; 74a6aec kept each on row 1, and
  that was right.
  - (i) K1 twins, typing in row 1, a load renames row 2: dropped, in the twin's words.
  - (ii) two K1 rows that differ, typing in row 1, a load makes row 2 identical to row 1: dropped; the board said the row "has no
    key of its own, and the list as loaded no longer holds that row as it was", which is untrue.
  - (iii) K1 on one row, typing in it, a load adds an identical row: dropped, in the same untrue words.
  - The check also noted that `pA-rcn` case 2 (twins, typing in the first, a load removes the first) was now dropped, where
    74a6aec kept the typing on the surviving twin.
- **Why the total cannot work.** A count tells twins apart only while no twin changes. With the total in it, any change to any
  twin, elsewhere on the list or not, broke every twin's signature. Without the total (74a6aec), a change to the upper twin
  shifted the lower twin onto the upper one's signature. What decides which twin a typed row continues is WHERE the load left
  it. A count cannot say that.
- **Fixed** by following rows from one draw to the next (`rcnCarry(prev, S)`, called by rcnDraw, `rcnDrawn` holding the last
  draw):
  - Every drawn row carries a mark of its own (`data-rs`, `'#r'+n`).
  - A row of the new list takes the mark of the row it continues. inspHeldSame is unchanged: it finds the held field by
    `data-rk` or `data-rs`.
  - A row whose content no other row of either list holds continues the one row holding it, wherever it moved. That is
    RV1-D's rule, and it is why case (c) and the reordered keyed rows still follow.
  - Among rows exactly alike, the load is read as the fewest rows changed, added and removed that turn the old list into the
    new one. This is an edit distance with substitution; forward and backward tables give every optimal reading at once.
    - A row continues the row every such reading leaves it on.
    - Where the readings differ, it continues the row at its own place among the rows alike, if a reading leaves it there
      (74a6aec's count, now only a tie-break among readings that are all right).
    - Otherwise it continues none.
  - Nothing moved (a plain redraw): every row keeps its mark at once.
  - A list over 4,000,000 cells of table puts rows alike on no row rather than guess.
- **The words** (rcnBody, from `rcnDrawn.fate`):
  - `twin`: the readings differ and none leaves the row at its place. Message: "the row it was in was exactly like another row
    on the list, and once the list was loaded the two could not be told apart".
  - `left`: every reading changes or removes the row typed in, while a row exactly as it was stays. Message: "the load changed
    or removed the row it was in; another row on the list is exactly as that row was, but it is not the row the typing was in".
    This is the original finding's case (a). The first cut used the twin words there, which was untrue: the two can be told
    apart, and it is the upper one that changed.
  - Otherwise, as before.
- **What each case now does** (`x1-rcn-edges.mjs`, `pA-rcn.mjs`, `pA2-rcn-twins.mjs`, `pX-twins-more.mjs`, this board):
  - (i), (ii) and (iii): kept on row 1, and A reads 99999.
  - pA case 2: kept on the surviving twin.
  - The original finding (typing in the upper twin, the load renames it): put on no row, said in the `left` words.
  - The mirror (typing in the lower twin, the upper renamed): kept on row 2, as 44aa984 did.
    - This reverses the first cut's "Decided" above. The fewest-changes reading does tell the two apart here: the upper row
      changed and the lower one did not.
  - Typing in the lower twin while one twin is removed: put on no row, in the twin's words. Either twin may have gone, and the one
    left is the row requirement A reads.
- **A property test, by hand** (`scratchpad/v214rev2/rv2-D/prop/prop.mjs`, rcnCarry lifted from the board), over 60,000 random
  lists of up to six rows drawn from three contents, each with one edit:
  - no mark is ever on two rows;
  - a mark only ever passes to a row with the same content;
  - a renamed row never passes on its mark, and a rename moves no other row's mark;
  - an inserted row costs no old row its mark;
  - removing a row costs no row unlike it its mark;
  - a removed row with no twin is never followed.

  0 violations. Timing: 1,500 rows, all twinned, one renamed: 133 ms; 100 rows: 19 ms. It runs only when the list changed
  while the box is open.
- **Check:** the audit-board block `v2.14 RV2-D — typing in one of two identical RCN / EEIC rows …` was rewritten. Its parts:
  - (a) the original finding, now in the `left` words;
  - (b) the mirror, kept on row 2;
  - (c) keyless twins, `left`;
  - (d) and (e) CONTROLS;
  - (f), (g) and (h): x1's three cases;
  - (i) a twin removed, typing in the first: kept;
  - (j) a twin removed, typing in the repeat: dropped in the twin's words;
  - (k) a keyless row that only moved past two others: followed.

  It fails 8 checks on `74a6aec` ((a) ×3, (b) ×2, (c) ×2, (j)) and 14 on the first cut ((a)'s and (c)'s words, (b) ×2, (f) ×3,
  (g) ×2, (h) ×3, (i) ×2). It passes now.
  The RV1-D block passes unchanged.
- **Browser:** keyboard-reach W's twins section now expects the `left` words. It adds the case (i) mirror in Chromium (row 2
  renamed while row 1 is typed into: Tab saves 99999 on row 1, and nothing says it was lost).
- **Mutations:**
  - Retargeted in place to rcnCarry and its words: `v214-rv2-d-rcn-twin-total` (`j=jo`, 74a6aec's rule) and
    `v214-rv2-d-rcn-twin-words`.
  - Retargeted in place: `v214-rv1-d-rcn-sig-no-count` (a mark from content, so twins share one) and
    `v214-rv1-d-rcn-place-again` (the line now reads `RC.tok[i]`).
  - New: `v214-rv2-d-rcn-ambiguous-drops` (the first cut's over-dropping), `v214-rv2-d-rcn-unique-by-alignment` (a unique row
    followed only by the fewest-changes reading, which loses a row that only moved), `v214-rv2-d-rcn-left-words`.

### x2: PMO Apply's roll forward still copied what a mend set aside

- **Reproduced** with `x2-roll-routes.mjs`: `pmoYearStart(FY+1, true)`, which PMO Apply uses to start a year a five-year copy's
  package goes into, returned a year holding `customAside` (1 entry). The year switch's roll forward was fixed.
- **Fixed:** pmoYearStart is now the one roll forward. switchYear calls it, and the deletion is there once. Two copies of one
  rule is how the first fix reached one route and not the other.
- **Check:** the audit-import roll block gains part (e): pmoYearStart from the mended year returns NEW-1 and nothing set aside,
  and the year on screen keeps its own. It fails on `74a6aec` (4 checks in the block) and on the first cut (1: (e)). It passes now.
- **Mutations:** `v214-rv2-d-roll-copies-aside` now sits in pmoYearStart and is caught by (c) and (e). The new
  `v214-rv2-d-roll-own-copy` gives switchYear its own copy back.

### x4: the chart of accounts listed a year another appropriation has not started, "as delivered"

- **Reproduced** with `x4-coa-year-not-held.mjs` and `x4b.mjs` on the big board saved by v2.12, opened on O&M and rolled forward
  to FY28. Full Fund and Initial Spares hold FY27 only.
  - Where we stand listed FULL FUND (as delivered), 30 requirements, $209,844,000 "FY28 Requirement", and INITIAL SPARES
    $106,128,000, under the flag "this board has not been opened in this file".
  - The Spruills on the same page read no data for either in FY28.
  - On 74a6aec neither was listed, because APPNS was empty.
- **The cause** is older than this fix. coaRows called an appropriation "as delivered" whenever its plan held no state for the
  year. A consolidated file with an opened appropriation that had not started the year did the same. Reading every
  appropriation from its own pack made it the common case.
- **Fixed** (`coaYearNotHeld`):
  - An appropriation whose plan holds other years but not this one is left off the chart for that year.
  - exportCoa names it under Where we stand ("FULL FUND, INITIAL SPARES hold no plan for FY28: their boards have not started that
    year, so they are not on this chart, and the Spruills reads no data for them there either."), and so does the status line.
  - "As delivered" stays for an appropriation with no plan at all, only a shipped payload.
- **And one guard with it:** spDefs reads a plan's pack only where it reads the plan as one (`st.years`). A store in no year's
  shape carries its edits at the top, where nothing here reads them, so its pack would have been printed "as delivered" at the
  shipped figures. Before RV2-D such a store was not read for its pack at all, and it still is not.
- **Check:** the audit-board Spruills block gains:
  - (y) the board moves to a year Full Fund's plan has not started: no Full Fund rows or summary row; the workbook's Where we
    stand has no Full Fund row and carries the sentence; the Spruills reads no data there.
  - (z) CONTROL: Initial Spares with only a shipped payload is still listed as delivered.
  - (x) a store for OPN in no year's shape is not listed.

  The block fails 2 checks on the first cut ((y) ×2) and 7 on `74a6aec` (the six of the original finding, plus (y)'s sentence).
  It passes now. The x4 probes on this board: Where we stand lists O&M alone for FY28, and FY27 is unchanged (pF: Full Fund
  209,844,000, Initial Spares 106,128,000).
- **Register:** `chart-of-accounts-listed-a-year-another-appropriation-has-not-started`.
- **Mutations:**
  - New: `v214-rv2-d-coa-year-not-held`, `v214-rv2-d-coa-not-held-unsaid`, `v214-rv2-d-spdefs-flat-pack`.
  - Retargeted in place, for the guard: `v214-rv2-d-spdefs-other-pack`.

### The other findings the check confirmed

- `spruills-checks-cannot-reach-a-real-board`, `byband-…`, `fuzz-cannot-see-customAside`, `verify-file-…`, the twice-listed
  requirement and customMendSay: the check found each holding. Nothing changed for them, beyond the Spruills block's new parts
  above.

## Left, and why

- **Reset year** still erases a year's customAside with the rest of the year. Its question says everything in the year is
  erased, and the person confirms it. Whether "set aside in the file" should survive a deliberate reset, as `newSeq` does,
  is the lead's to decide.
- The critic's NOT RUN items about the W2 file route and the shared folder were not asked of me and were not run.
- `tools/verify-file.mjs` may also be touched by the fixer of `verify-file-calls-the-mend-a-loss`, so the two changes will need
  merging there.
- `tools/money-map.md` is generated, so the lead should regenerate it after merging if another fixer also changed
  `money-map.json`.

## Runs (on the final tree)

These runs were on the committed tree (`592b6f2`) with the notes completed after them. Each block's count of failing checks on `74a6aec` is read from its `SUITE_CHECKS` record, run slimmed on `pre.html`. Every heavy run was alone, or beside other
fixers' runs only once memory allowed.

- **Static checks:**
  - `npm run check`: all checks passed.
  - `boot-same`: identical either way.
  - `audit-inject`: ALL CHECKS PASSED.
- **The suites, whole, at 8 GB:** audit-board, audit-import, audit-recon and audit-other each printed ALL CHECKS PASSED.
  - The first whole audit-import run was killed with exit 137. Two other fixers' recon and import were holding 9.5 GB at the
    time. It passed on the rerun.
- **The tools:**
  - `roundtrip-fuzz`, seed 745364162 (3 rounds): 55 containers, NOTHING WAS LOST. Seed 424242 also ran clean.
  - `verify-file --selftest`: PASSED, with the new step.
  - `money-coverage`: 27/27.
  - `money-map --check`: current; 119 proven, 202 n/a, 1 open.
  - `math-defects`: 19 defects, all guarded.
- **The browser checks:**
  - `npm run keys` passes, the new twins case of section W with it.
  - The same check with `--board pre.html` fails exactly that case: `stored [["Depot repair","11111"],["Depot","99999"]]`,
    nothing said.
  - `npm run panels`, `dialogs` and `standards` (0 findings) all pass.
  - Not run: `fileimport`, `savetarget` and `storagefull`. Nothing in this change touches the file route, the save target or
    storage refusal.
