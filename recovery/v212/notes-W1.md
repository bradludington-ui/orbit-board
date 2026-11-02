# v2.12 W1 -- item 132's import: the cost estimate read by its header titles, the import report, the WBS tree, PSM inside AV

Branch `v212-w1`, from the slot commit `d732259`. Built on Brad's "Go on v2.12" (28 Oct 2026), to `recovery/v212/contract.md`
(W1) and `NEXT-VERSION.md` item 132.

## What was built

**The import finds its header and every column by title, on any sheet** (`aceTitleN`, `ACE_FIELDS`, `aceHdrScore`,
`aceFindHeader`, `aceParse(rows, label, H)`, `importAce` → `aceImportGo`).
- Every sheet `xlsxRead` returns is searched in the workbook's own order (`XLSX_LAST.names`: an object would put a sheet named
  "2026" first), each up to `ACE_HDR_SCAN` (500) rows. The header is the row carrying the most of ORBIT's titles (one more for a
  fiscal-year column); ties go to the first sheet, then the first row. A row with fewer than `ACE_HDR_MIN` (4) titles is no header.
- Titles are compared lower-cased with everything not a letter or digit taken out. Fields and which are required are the
  contract's. Fiscal years: every header that is a year 1991-2099. Optional fields absent name nothing (`rep.absent`).
- The import says which sheet and row it read (the status line and the report). `xlsxRead` now records each row's own sheet row
  number (`XLSX_LAST.rowNo[sheet]`, from the cells' references), because Excel leaves empty rows out of the file and the i-th row
  read is not row i+1; its result is an object with no prototype (a sheet named `__proto__` is a sheet).
- The file's key: the year, then the word ACE anywhere after it (`/(20\d\d)\b.*?\bACE\b/i`), so "2026 SUST ACE COMPLETE Detail
  File.xlsx" is `2026ACE` (the old pattern, the year right before ACE, filed it under its whole name).

**The mapping box** (`#aceColPanel`, `aceColAsk`, `aceColDraw`, `aceColSync`, `aceColApply`, `aceColCancel`; state `ACECOL`,
`aceColOpen` beside `let aceOpen`). A required field the file does not title is asked once, listing the file's own headers as
"column letter · title"; each picker is `data-held` (Esc asks before a choice is lost). Import reads the file with the answers;
Cancel imports nothing and says so; a field still unanswered refuses the file and names it. The answers are kept in
`ACEDB.cols[<signature>] = {map:{field: title as in the file}, ts, by, file}` when the import succeeds (a refused import writes
nothing), the signature being the header row's normalised titles joined by `|`; a file with the same signature is read with them
without asking (`how: 'remembered'`). The set records what it was read with: `set.cols = {sheet, row (0-based sheet row), sig, map}`.

**Each row, in the contract's order** (`ACE_WHY`, `ACE_NOTE`): not data (no WBS and no dollar; counted as `notData`, in no total),
other dollar type, rollup, blank Support Line Category (named, every one), MILPERS, partner/FMS, not JPO managed, Service Mgd, an
unknown PMO (named), a category not in the map (named), PALS/O&S disagreeing (named), an unreadable service (named); then kept,
and named-but-kept: the P check, the Level check, a Depot Activation row the rules do not settle, a kept row with no WBS. Each
reason is counted in `set.rep.reasons[code] = {rows, v:{year: $}, by:[[text, rows]...]}`; every named row is in `rep.named`
whole (`{k, row, wbs, what, v}`); `rep.kept`, `rep.total`, `rep.ties` (kept + every reason = the sheet, every year, to the dollar).
`set.skip` stays (`{code: rows}`).

**The category map** `ACE_SLC` (replaces `ACE_APPN` and the old cost element column; `ACE_COL` is gone with them) and
`aceDepotCe` (CES2 Software Depot Standup, then PMO Propulsion, then PMO Air Vehicle, else '' and named, dollars kept).

**Dollars:** `aceMoney` -- the year cells are $M, `(1.5)` is −1.5, and each figure is `D$(x*1e6)`, a whole dollar at the door.

**The tree** `set.wbs[ap][CODE] = {n, lv, up}` (`aceTree`, `aceSuffixOf`, `aceNameSame`): from kept rows (a kept row with no dollar
is in the tree and carries no line, `rep.kept.zero`). Unsuffixed lines first, then suffixed ones; a suffixed line's heading takes
the suffix only where its own CES name for that level differs from the name an unsuffixed line gave the heading. A conflict
(a paragraph two kept rows name differently, compared case- and space-insensitively) keeps the first name and is listed in
`rep.conflicts` (`{ap, code, n, also:[{n, rows}]}`). `rep.tree` counts the paragraphs per appropriation.

**The lines**: `{ap, pmo, svc, wbs (aceNormWbs form), lv, ce (a COST_ELEMS name or ''), slc, ccar, cdesc, sub:'', v}`.

**The import report** (`#aceRepPanel`, `aceRepBody`, `aceRepShow`, `aceRepClose`, `aceRepPick`, `aceRepYrSet`, `aceRepNewest`;
state `aceRepOpen`, `aceRepK`, `aceRepYr`): the estimate (a picker), the sheet and row read, the columns read and how each was
found, every reason with rows, the chosen year's dollars and all years', the sheet's total and whether it ties, the tree's size,
every named row (40 a kind on screen, all in the record), the conflicts. It opens after an import (the Spruills no longer does);
the status line points to it (`statKeep`); the Data card's Annual Cost Estimate has **Import report…** (`I.acer`, the newest
estimate's). An estimate imported before v2.12 shows its row counts and says to import it again for the rest.

**Refusals:** an `.xlsb` by name, before it is read (`aceXlsbSay`); a binary workbook named `.xlsx` by its contents
(`xlsxRead`: a zip holding `xl/workbook.bin`, for every importer); a file with no then-year row (naming its types); a workbook
with no sheet carrying the titles (naming them); every row left out (naming the reasons).

**The Spruills' stale button** opens the real import (`document.getElementById('aceFile').click()`).

**PSM inside Air Vehicle** (`aceAlignDefault()` = `{PSM:'AV'}`, for every estimate; `ACE_PMO_ALIGN_DEFAULT` is gone). A stored
alignment of exactly `{}` for a 2026 or later key is replaced in `applyStore` (`aceAlignHeal`, every load) and said once
(`aceHealSay`: at the end of opening, after the other opening lines; directly on a later load). Opening writes nothing else (no
`save()`): the file keeps `{}` until the next save, so a file opened twice without saving says it twice.

**The AV + PSM split** (`aceLineUp`, `aceGroupSplit`; `aceScan` rows carry `claims: aceWbsOf(id)`, read in that row's own year):
under a group of several board offices, the panel (`tr.acesplit[data-g]`, `tr.acesplit-shared`) and the workbook's Reconciliation
by PMO (rows "↳ AV: the lines only its requirements claim", "↳ shared: …") print each present office's part -- the lines only its
requirements claim, a requirement claiming a line when one of its paragraphs is the line's paragraph or a heading above it, up the
estimate's own tree (`aceWbsUp`) -- and the shared line (claimed by more than one office, or none). The parts and the shared line
add to the group's estimate; the year's TOTAL adds the group rows, never the parts. The workbook's "How to read this" says so.

**Ordinary import** (`importStores`): `ACEDB.cols` layouts not held are taken; a held one keeps its answer.

**The guide**: a section "Importing the cost estimate" (`t-ace`, 2,716 characters) in the team part, before the funds flow.

## Decided in the build

- **The header threshold:** a row carrying fewer than 4 of ORBIT's titles is never a header, whatever the others carry; each sheet
  is searched to row 500. A workbook with no such row is refused naming the titles (the box is not offered for a file that is
  not an estimate at all).
- **The import says which sheet and row it read** -- in the status line and at the top of the report; the row is the sheet's own
  number, read from the file's cell references.
- **The remembered answers are stored only when the import lands** (a refused or cancelled import writes nothing, as every
  other door), and they travel with the board in `ACEDB` (Save, a PMO copy, a full import) and come across with an ordinary
  import for layouts this board has not answered for.
- **US/PTN/FMS blank reads as US** (the column present, the cell empty): only a value that is not US is a partner or FMS line.
- **A blank Support Line Category at step 4 is always named** -- step 3 has already left out every Rollup Value? Yes row, so every
  blank row that reaches step 4 is one whose Rollup Value? is not Yes.
- **A kept row with no dollar** puts its paragraph in the tree and carries no line (`rep.kept.zero`): a line holding nothing would
  have appeared in the tie-out's "estimate lines nothing claims" and its counts.
- **A kept row with no WBS** is a line (its dollars are the estimate's) and is named: no requirement can claim it.
- **A line's level is its paragraph's count of segments**, not the file's Level column (which is checked against it and named
  when it differs): the tree has to be consistent with the codes.
- **Names are compared case- and space-insensitively** for conflicts and for the suffix rule ("Unit-Level Maintenance" and
  "unit-level  maintenance" are one name).
- **A suffixed heading's parent is the line's own heading one level up.** That is "the unsuffixed heading's parent" wherever only
  one level of a breakout differs -- every case in Brad's screenshot -- and keeps each name its own heading where two consecutive
  levels differ (`P6.2E` above `P6.2.2E`, rather than `P6.2.2E` under `P6.2` with `P6.2E` beside it holding nothing).
- **The split under a group is shown wherever the group has more than one board office** (`bs.length>1`), with a line for each
  office present and the shared line, even when only one of them has requirements in scope. An estimate imported before v2.12
  has no tree: there a requirement claims only the paragraph it names (`aceLineUp` falls back to the code itself).
- **The file key** reads the year and the word ACE anywhere after it (above).
- **The counts by value** (`rep.types`, each reason's `by`) are lists of `[text, rows]`, never objects keyed by the file's text:
  a cell reading `constructor` or `__proto__` is counted as the text it is, and the saved board still passes the import check
  (which refuses those names as keys). Found while building it: the first cut keyed them, which would have made a board with
  such an estimate refuse its own file.
- **A column title spelled like a name every object answers to** (`constructor`, `toString`...) is read by, never remembered:
  `set.cols.map` and `ACEDB.cols` leave that field out (`IN_KEY_BAD`), because the import check refuses such a value under a field
  named `pmo` or `svc`, and the board would refuse its own saved file. Such a layout is asked about again next time.
- **The report's figures are whole dollars**, with a year picker (the year on screen by default) and an all-years column; the
  report does not print every year side by side (the estimate states dozens).
- **The mapping box's and the report's cells wrap** (`#aceRepBody .fctab td{white-space:normal;overflow-wrap:anywhere}`): a file's
  own words run long, and layout-fits P holds both boxes whole down to 800 wide.

## Checks

Each fails on `d732259` unless labelled CONTROL.
- **audit-other "v2.12 W1 — the cost estimate is read by its header titles on any sheet: every row kept or left out with its
  reason and dollars, the WBS tree, the mapping box, the report"** (the W1 slot). A 2026-shaped workbook built by the board's own
  writer: a Cover sheet first, the titles on row 3 of PMO Database Output in the 2026 order, extra and inserted columns, three
  titles spelled as a person might ('PALS / O&S', 'Rollup Value', 'JPO-managed'), a Notes sheet with five titles that must lose,
  a row of every kind left out with dollars, the E breakouts (one before its twin; one whose CES3 differs, one whose does not;
  a level-3 pair), Depot Activation of every kind, a Level mismatch, both P mismatches, a name conflict, a row with no dollar, a
  row with no WBS, a formatting row. Asserts, from the fixture alone: the key, the sheet and row read, every column's letter and
  how it was found, the years, every line (appropriation, office, service, paragraph, level, cost element, category, CCaR fields,
  whole dollars, (0.25) as −250,000), the whole tree, the readers walking it, the conflict, each reason's rows and dollars by
  year, the types and the values by reason, every named row by its row number, the kept counts, **conservation** (the sheet's
  dollars added up in the test = the record's total = kept + every reason, every year, to the dollar), the aggregates, the
  report opening (not the Spruills) and its message, the report box's cells as drawn, the Data card item and its line, the
  Spruills button. Then the mapping box (two renamed titles: asked, Cancel, an unanswered field refused, answered and read
  exactly as the titled file, remembered, the same layout read without asking, another layout asked again); the refusals (.xlsb
  by name and by contents, no then-year row, no titles); a hand-written workbook with empty rows left out (the row numbers are the
  sheet's own); values that are built-in names (counted as text; the saved board passes the door); remembered layouts across an
  ordinary import; a PMO column titled "constructor" answered in the box (read by, not remembered, the saved board passes the
  import check); PSM inside AV (a 2026 `{}` replaced on opening, a real choice and an older estimate's kept, said once, every
  year's default). The two fixture checks are CONTROLs. On `d732259` it fails 15 checks and then throws (every import there is
  "nothing matched the expected columns").
- **audit-recon "v2.12 W1 — PSM is inside Air Vehicle, and each office’s part of the estimate is the lines only its requirements
  claim, up the WBS tree"** (the W1 slot). Two AV requirements (one on the heading 1.2, one on P6.2.2), two PSM requirements (one
  on 1.2.1.2 and 1.3, one on the breakout heading P6.2.2E), a TSS one; a 2027 estimate with a tree, every line under AV but TSS's;
  two years, the second with PSM's claim on 1.2.1.2 dropped. The workbook read back from its bytes and the panel as drawn: the
  group row, each office's part, the shared line, each year; parts + shared = the group; nothing under a PSM estimate office. The
  fixture's own check, "the workbook builds" and "the TOTAL is the group and TSS once" are CONTROLs (on `d732259` there are no
  parts to add). On `d732259` it fails 6.
- **Existing checks moved, each with a `// v2.12 W1:` comment:**
  - audit-recon prelude `dress2` (used by "the ACE tie-out"): the PSM line is filed under AV.
  - audit-recon "v1.97 W6 — the ACE tie-out…": PSM's line under AV, and the Reconciliation by PMO expectation is the "PSM + AV"
    row with its two parts and the shared line (the fixture already had both offices over two years, so it now holds the split
    year by year too).
  - audit-recon "v1.99 item 94 …": PSM's $900 under AV.
  - The four positional `__aceRows` fixtures (audit-import V197W2; audit-recon U10 ×3) are titled sheets in the 2026 layout, the
    same one line each always held (the old cost element text rides in CCAR Description).
  - audit-board "v1.96 — a long menu folds…": the Data box shows 8 items (the import report), was 7.
  - `tools/verify-file.mjs` self-test: its 2026 line is filed under AV.
- **audit-hostile**: `hostile.mjs` plants a 2026 estimate with hostile text in the lines' new fields, the tree's names, the report
  (file, editor, sheet, a column title, a reason's value, a named row's WBS and text, a conflict's code and names) and a remembered
  layout; `SPECIAL` opens the report and the mapping box (a hostile file name, sheet and header); the sweep opens the tie-out's
  "lines nothing claims". `MUST_SHOW` gains the 14 that are drawn (acefile, aceby, acesheet, acecoltitle, acebyval, acenamedwbs,
  acenamedwhat, aceconfcode, aceconfname, aceconfalso, acece, acecolfile, acecolsheet, acecolhdr). The tree names, a line's
  category and CCaR fields are planted for W2's pickers and not yet required to be seen (W1 draws none of them).
- **Browser:** `tools/ace-seed.mjs` (new) holds one state for every browser check: `ACE_REP_SEED` (a report with every reason,
  38 named rows, conflicts, long text, billions) and `ACE_COL_ASK`/`ACE_COL_CTX` (the mapping box for a 2026 header with two
  renamed titles).
  - `npm run panels`: both boxes in `SPECIAL` with reached-checks; `aceRepOpen`, `aceColOpen` in `FALSE`.
  - `npm run dialogs`: `KNOWN` maps `aceRepClose` → `aceRepShow(` (opened from the Data box by keyboard) and `aceColCancel` →
    `aceColAsk(window.__aceColCtx)` (opened by its switch); `PRE` seeds both.
  - `npm run leftmenu`: `WANT` gains `aceRepShow: 1` (70 calls).
  - `npm run standards`: a drive measures both boxes with their content (and records `coverage` if either is missing).
  - `npm run layout` **P** (new): both boxes, 1920/1440/1366/1024/800, Harbor and Midnight, this font and the Segoe stand-in, 40
    states: no sideways scroll, nothing past the box, no cell cut, no picker cut. It first failed at 800 (the report's long cells),
    fixed by letting the boxes' cells wrap.
  - `npm run keys` **S** (new): a real file picked (`setInputFiles`) with two renamed titles → the mapping box with the keyboard
    on the first field; each column chosen by its letter; Tab to Import, Enter → the report with the keyboard inside; Esc; Data →
    Import report… by Enter; the year picker moved by an arrow key keeps the keyboard; the same layout read without asking; Esc on
    another layout's box imports nothing.
  - `npm run menus`: the guide's two `data-m="data"` paths and the messages' "Data › Import report…" resolve.

## Mutations

59 new (`v212-w1-*`), in the W1 slot of `mutate.mjs`; none retargeted, none retired (`mcount`: 2,858 targets, every one once --
2,799 at the slot commit plus 59). Proved with `recovery/v208/bin/prove.py recovery/v212/proofs-W1.json
recovery/v212/proved-W1.jsonl` (JOBS=1, HEAP=8192): **59/59 CAUGHT**, 0 survived, 0 not applied, 0 crashed. Three of them
(`v212-w1-header-first-sheet`, `v212-w1-header-last-wins`, `v212-w1-title-punctuation`) also made the block throw after its
failed checks (the import finds no header, or the wrong one, and a later step reads a set that is not there); each was caught by
a failed check first. The last two, `v212-w1-builtin-title-remembered` and `v212-w1-report-year-ignored`, were added after the
first proof run, with the fix for a column titled like a built-in name and a check of the report's year column.

Two existing finds this build first broke and then restored by writing the lines back exactly (`v200-fname-ace-raw`,
`v200-ace-key-open`: the editor had turned their `\u` escapes into characters), and one this build first matched twice
(`v197w6-ace-stray-year`: the split's own line is spelled `+((…)||0)` so it does not repeat the find).

## For the integration

- **The board:** §08 (tie-out, `aceBody`, the split, `ACE_PMO_ALIGN_DEFAULT` → `aceAlignDefault`, the heal), the import block
  where `ACE_APPN`/`ACE_COL`/`aceParse` were, `importAce` and the two boxes beside it, `xlsxRead` (sheets with no prototype, row
  numbers, the .xlsb message), `importStores` (layouts), `applyStore` (one line, `aceAlignHeal()`), the end of the boot script
  (`ACE_BOOTED`, `aceHealSay`), `syncBtns` (`I.acer`, the Data card), the render list (`aceRepBody(); aceColSync();` after
  `aceBody();`), the box markup after `#acePanel`, one CSS rule after `.fctab tr.tot td`, the Spruills header button, the
  tie-out workbook's How to read text, and the guide (`t-ace`). W2 reads `set.wbs` through the slot commit's readers, unchanged;
  `aceWbsUp`'s callers now include the split (`aceLineUp`).
- **Expected conflicts:** W2 also edits the guide, `hostile.mjs` (`MUST_SHOW`), `syncBtns` (Classify? Needs attention), and
  possibly `aceBody`/`aceScan` if it shows paths; W3 the guide, `applyStore` (its own re-apply) and the end of the boot script
  (its "once at the end of opening"). Both my `applyStore` line and the boot lines are one-line insertions, beside
  `cycMigrateLegacy()` and after the cycle-retag `try{…}catch(e){}`. The browser tools' maps (`panels-render` `SPECIAL`/`FALSE`,
  `dialogs-keyboard` `KNOWN`/`PRE`, `left-menu` `WANT` and its count -- now 70; W2/W3 adding items move it again) will conflict
  by line, not by meaning. audit-board's Data count (now 8) moves if W2/W3 add Data items.
- **npm scripts:** none added; layout P and keys S run inside `npm run layout` and `npm run keys`.
- **Registries:** none changed. `money-coverage.mjs` already lists `exportAceTieout` (money) and has no entry for the import (not
  an export); `money-map.json`'s tie-out checks still anchor (their names did not change). Consider citing the new recon block in
  the money map's `exportAceTieout` cells (appropriation / requirement) at integration.
- `recovery/v212/proofs-W1.json`, `proved-W1.jsonl` are added with `-f`.

## Known gaps

- The ties flag (`rep.ties`) holds by construction; no mutation can make it lie without breaking a reason's sum first, so it has
  no mutation of its own (the conservation check computes it independently from the fixture).
- The import is not refused in a PMO copy (it was not before; a copy writes its own sealed estimate store).
- `aceFingerprint` still covers only the aggregates and the line count: a re-import of the same file under the new parser can
  change the aggregates (whole dollars at the door; rows the old parser kept and the new leaves out), and so the fingerprint, and
  an older copy of that set elsewhere (the folder, another board) then reads as "disagrees".
- The report's year picker shows the years that carry dollars; an estimate with dozens of years makes a long list.
