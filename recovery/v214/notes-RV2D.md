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
