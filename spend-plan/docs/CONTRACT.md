# SFCB Spend Plan dashboard: the build contract

Brad asked on 9 Nov 2026 for the *SFCB FY26 Spend Plan Workbook v12* to become an active dashboard. He imports raw CCaR data,
and the dashboard produces all the same products. His answers, given that day:

- **A separate tool, not part of ORBIT.**
- **The data:** "The data in the four last tabs will be the exact type of data pulled in. The report looks just like that."
- **Years:** "FY25 is the first year."
- **The Excel export:** "Values are good enough."
- **OBBBA:** "Don't worry about OBBBA. I don't have any this year."
  - Replaced on 11 Nov 2026 (§15): *"Just leave FY25 OBBBA funding out. Although it's active technically, it's not a
    reporting year."*
- **Everything else:** he accepted the stated defaults.

This file is the one statement of what the tool does. Every builder works to it, and every check is written from it. Where it is
silent, ask the lead; do not invent a rule.

**No real data in the repository, ever.** The real workbook is outside the repo, at
`/tmp/claude-0/-home-user/b811ed9c-8dc4-55a9-9818-6ddf3724fb6e/scratchpad/wb/src/wb.xlsx`. Its analysis is in
`.../scratchpad/wb/FINDINGS.md`, and CSV copies of its raw tabs are in `.../scratchpad/wb/dump/raw_*.csv`.

- Read them to learn the shape and the look.
- **Never copy a real name, figure, CCaR number or plan event into a committed file.**
- Fixtures are synthetic and generated at test time into a temporary directory.

There are two exceptions. The default special-CCaR list (`PP 2000`, `JSF6654`) is configuration Brad kept on purpose. The seven
PMO names are the office names.

## 1. Where it lives and how it is built

```
spend-plan/
  build.mjs            node spend-plan/build.mjs  -> spend-plan/sfcb-spend-plan.html (the one file Brad copies to the share)
                       --check fails if the committed file is not exactly what src builds
  src/shell.html       the page: CSP, the CUI banners, <script id="spState"> (null in the repo), /*@CSS@*/ and /*@JS@*/
  src/style.css
  src/10-util.js       §2 constants and helpers           (builder A1)
  src/20-xlsx-read.js  §3 the .xlsx and .csv readers      (builder A1)
  src/30-import.js     §3 import, typing, classification  (builder A1)
  src/40-engine.js     §4–§6 the model                    (builder B1)
  src/50-xlsx-write.js §7 the .xlsx writer and zip        (builder B2)
  src/60-export.js     §8 the Excel workbook              (builder C1)
  src/70-pictures.js   §10 slide pictures                 (builder C3)
  src/80-store.js      §11 state, save, open, prefs       (builder C3)
  src/90-ui.js         §9 the screens                     (builder C2)
  test/harness.mjs     loadTool({modules, state}) boots the tool from the SOURCES in jsdom
  test/run-all.mjs     runs every test/*.test.mjs
  docs/CONTRACT.md     this file
  README.md            for Brad: what it is and how to use it (written at integration)
```

**Modules.** The modules are plain scripts, concatenated in file-name order into one `<script>`, so they share one global scope.
`10-util.js` declares `const SP = (window.SP = window.SP || {})`. Each module:

- adds its public functions to `SP` (`SP.buildModel = buildModel;`);
- may also declare top-level helpers, which must not collide across modules: prefix private helpers with the module's short
  name (`imp_`, `eng_`, `xw_`, `ex_`, `pic_`, `st_`, `ui_`);
- reads only earlier modules **at load time**, and may call later ones only from inside functions;
- has no top-level code that touches the DOM, except `90-ui.js`'s boot. That keeps `loadTool({modules:['util','xlsx-read','import','engine']})`
  working with no UI.

**No dependencies, no network.** Nothing is loaded from anywhere, and the CSP in `shell.html` stays as it is. The program must
never contain a literal closing script tag: write `'<\/script'` (build.mjs refuses it). Use the browser's own
`DecompressionStream` and `CompressionStream` for zip data.

**Browser storage keys** are prefixed `sfcbsp.`. Never use ORBIT's `prio27*` or `spmt*`: the tool runs from `file://` beside
ORBIT and shares its storage. Browser storage holds preferences only, never data (§11).

## 2. Constants and helpers (`10-util.js`)

```js
SP.APS = [   // order everywhere a list of appropriations is printed, except PMO tabs (§8.6)
  {id:'om',  label:'O&M',            type:'om',   rawSheet:'O&M Raw Data'},
  {id:'ff',  label:'Full Fund',      type:'proc', rawSheet:'FF Raw Data'},
  {id:'sp',  label:'Initial Spares', type:'proc', rawSheet:'Spares Raw Data'},
  {id:'opn', label:'OPN',            type:'proc', rawSheet:'OPN Raw Data'} ];
SP.SERVICES = ['USAF','USAF ANG','USAF AFRC','USMC B (STOVL)','USMC C (USMC CV)','USN (USN CV)'];
SP.SVC_UNKNOWN = 'Service not identified';
SP.PMO_ORDER = ['Air Vehicle (AV)','Business Operations (BOP)','Combat Data Systems (CDS)','Maintenance Systems (MxS)',
                'Product Support Management (PSM)','Propulsion (PP)','Training Systems (TSS)'];
SP.RAW_HEADERS = ['FY','Month','CCaR No','Title','Budget','C/L','SB','Plan Event','Date','Amount','Alloc','Event Description',
  'OPR','PMT PID#','Contracting POC','Material Lead','PM/TPOC','Obligation Category','PMO','Sub-PMO','Category','Navy SI Code',
  'IPT','Spares WBS','Quantity','CLINs','AF EEIC','RCN','PSR','CSR','Contract Mod','Cost Element'];   // the 32, in this order
SP.REQUIRED = ['FY','CCaR No','Title','Budget','Plan Event','Date','Amount','Alloc','PMO'];
SP.SPECIAL_CCARS_DEFAULT = ['PP 2000','JSF6654'];
SP.MONTHS = ['Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'];
SP.CUI = 'CUI//REL TO US DoW';
SP.GOALS_DEFAULT = {   // [Prior, Oct..Sep]: 13 values each, exactly as v12 typed them
  om1: [0, .0833,.1667,.25,.3333,.4167,.5,.5833,.6667,.75,.8333,.9167,1],
  om2: [1, 1,1,1,1,1,1,1,1,1,1,1,1],                 // O&M in its second year or later (expired): fully obligated
  p1:  [0, .0667,.1333,.2,.2667,.3333,.4,.4667,.5333,.6,.6667,.7333,.8],
  p2:  [.8, .8083,.8167,.825,.8333,.8417,.85,.8583,.8667,.875,.8833,.8917,.9],
  p3:  [.9, .9083,.9167,.925,.9333,.9417,.95,.9583,.9667,.975,.9833,.9917,1],
  p4:  [1, 1,1,1,1,1,1,1,1,1,1,1,1] };              // procurement in its fourth year or later
```

Helpers, each on `SP`:

- **`esc(s)`** escapes `& < > " '` for HTML.
- **`normKey(s)`** returns `String(s??'')`, trimmed, with every run of whitespace (including non-breaking spaces) made one space,
  lower-cased. It is the grouping key for names (§4.4).
- **`parseAmount(v)`** returns `{cents, how}`. `cents` is a whole number, or `null` when the value cannot be read. `how` is one of:
  `'number'`, `'blank'`, `'text'` (a number written as text), `'dollar'` (has a `$`), `'paren'` (written `(1,234.56)`, read as
  negative), `'bad'`, or `'subcent'` (a number with more than two decimals: it is rounded half away from zero, and the rounding
  is reported).
  - It reads `'$0.00'`, `'1,234.50'`, `' -1234 '`, `'(1,234.56)'`, `'-$1,234.56'` and `'$(1,234.56)'`.
  - Commas count only between groups of three digits.
  - A blank value is 0 cents with `how:'blank'`.
- **`fmtM(cents)`** shows $M to two decimals with thousands separators: `1234567` becomes `'0.01'`, and a negative is
  `'(1,234.57)'`.
  - Zero is `'-'`.
  - A non-zero amount under $5,000 is `'<0.01'`, or `'(<0.01)'` when negative, so nothing non-zero reads as zero.
- **`fmtPct(x)`** gives `'12.34%'`, or `'—'` for `null`. **`fmtDelta(x)`** gives `'+20.90%'` or `'-15.03%'`.
  - A delta that rounds to zero keeps its sign, `'-0.00%'` or `'+0.00%'`, as the workbook's `+0.00%;-0.00%;0.00%` shows it
    (Excel and LibreOffice choose the section by the unrounded value). Only a delta within `SP.DELTA_ZERO` (`1e-12`,
    `statusOf`'s tolerance) of zero is `'0.00%'`, and the workbook writes such a delta as 0 (`SP.deltaShown`), so a
    `'-'` never stands beside *On track* and the screen and the workbook agree (review M5).
- **`SP.DOWNLOAD_WHERE`** is the one sentence every download's message ends with: where a download lands is the browser's
  choice, its downloads folder unless it asks.
- **Dates** are ISO `'YYYY-MM-DD'` strings everywhere inside the tool. The helpers are `ymOf(date)`, `fyOf(date)` (Oct–Dec belong
  to the next FY) and `excelSerialToIso(n, date1904)`.

## 3. Import (`20-xlsx-read.js`, `30-import.js`)

**Readers.**

- **`await SP.readXlsx(arrayBuffer)`** returns `{sheets:[{name, rows: any[][], rowNo:[]}], date1904}`. Port ORBIT's `xlsxRead`
  (`prioritization-board-grid.html`, function `xlsxRead` and its `_xunesc`, `_xdecode`, `XML_BADCH`):
  - Keep its bounded reads and its plain error messages ("That file is not a readable .xlsx — …").
  - Also report `date1904` from `workbook.xml`.
  - Read `t="b"` as a boolean, `t="e"` as an error string, `t="d"` as an ISO date, and a number as a number.
  - Keep ORBIT's credit in a comment.
- **`SP.readCsv(text)`** reads RFC 4180 text: quoted fields, doubled quotes, and newlines inside quotes (the FF tab has 5 such
  fields). It strips a leading byte-order mark.
- **A CSV's bytes** are read as UTF-16 (little- or big-endian) when they say so with a byte-order mark, or when, with none,
  every other byte of the text is zero (`SP.utf16Of`): Excel's *Unicode Text* and a reporting server's *CSV (Unicode)* are
  UTF-16. Otherwise they are UTF-8, or Windows-1252 (Excel's CSV) when they are not UTF-8: a UTF-8 byte-order mark, or more
  well-formed UTF-8 sequences than stray bytes, says UTF-8. The report says when it read UTF-16 or Windows-1252 (review F2).
- **A file that is not what its name says is refused, named for what it is**, with what to do (review IMP-10, F3):
  - an OLE2 file is an Excel 97–2003 workbook (`.xls`), or, when it holds an `EncryptedPackage` stream, an **encrypted** file
    (a password, or a sensitivity label that encrypts): saving it again keeps the encryption, so the advice is a copy that
    is not encrypted;
  - a web page (HTML, also after an XML declaration or a comment), a web archive (a Single File Web Page, MHTML), an Excel
    2003 XML Spreadsheet, a saved SFCB Spend Plan, or plain text (UTF-16 too) named `.xlsx` or `.xls`;
  - a ZIP file with nothing under `xl/` is named by what it holds: an OpenDocument spreadsheet, a Word document, or the files
    it holds (a zipped CSV: take it out of the ZIP file). One that starts like a zip and has lost its end is cut short; one
    with parts under `xl/` but no `xl/workbook.xml` is damaged;
  - a ZIP or OLE2 file named `.csv` is not CSV text (`SP.notCsvWhy`), and is said to be that, never read as Windows-1252.

**`await SP.parseFiles(files)`**, where `files` is `[{name, data: ArrayBuffer | string}]`. A name ending `.csv` is read as CSV;
anything else as .xlsx. It returns `{pulls, report}`.

- **Header row.** In every sheet, find the header row: the first row, within the first 15, that holds every one of
  `SP.REQUIRED` by name. Names are compared with `normKey`, and `'PMT PID#'` matches `'pmt pid#'`.
  - A sheet with no such row is listed as *ignored*, with its name and why. The v12 workbook's 14 report tabs land here.
  - Columns are found **by header name**, never by position. A header the tool does not know is kept as an extra column under its
    own name.
  - **A re-imported export.** This tool's raw data sheets end with its own *Service*, *Lane*, *Status* and *Counted* (§8.7),
    worked out again on every load. The **last** column of each of those names, when all four are there in that order, is
    read as nothing and noted; a pull's own column of one of those names, which the export writes before them, is an extra
    like any other, and comes back with its values (review F7, XP2-2). The four in another order are a pull's own, all kept.
  - **A CSV separated by tabs, semicolons or vertical bars**, whose headers are otherwise all there, is refused saying so:
    the tool reads comma-separated CSV only and never guesses a separator (a file separated by semicolons may write
    `1.234,56` for `1,234.56`). The advice is to save it as *CSV (Comma delimited)* or `.xlsx` (review F2).
  - `Svc (auto)` and `Inc (auto)` are v12's formula columns: they are ignored and noted.
  - A file with no usable sheet at all is refused by name. If no file in the import has a usable sheet, nothing changes.
- **Rows.** Every row below the header is a data row unless every one of the 32 known columns is blank. Those are skipped and
  counted; v12 fills formula rows to row 2600. Each data row is typed:
  - **FY**: a whole number 1990–2100, or text (`'2026'`, `'FY26'`, `'FY2026'`) read as the year. Anything else is *unreadable*.
  - **Month, Date**: an Excel serial (using `date1904`), a date cell, or text (`YYYY-MM-DD`, `M/D/YYYY`, `D Mon YYYY`, `Mon-YYYY`
    as the first of the month). The result is ISO or `''`. A Date that cannot be read is *unreadable*: the row keeps it as `''`
    and is placed in the No-date column (§4.2). A Month that cannot be read is kept as `''` too, and moves nothing: a row is
    placed by its Date, never its Month. The report lists the two under their own headings (review F11).
  - **Amount**: through `parseAmount`. An amount that cannot be read makes the row *unreadable*.
  - **Text**: trimmed at both ends and otherwise unchanged. The report counts values that had spaces trimmed.
- **Unreadable rows** (FY or Amount) are kept in the pull with `bad: [reasons]`. They are counted in no figure and listed in the
  import report with their file, sheet, row number, the raw text and the dollars where readable. Nothing is dropped silently.
- **Stored row.** `{c: [32 values in SP.RAW_HEADERS order], x: {extraHeader: value}, src: [fileIndex, sheetName, rowNo],
  bad?: [...]}`. FY is a number, Month and Date are ISO, Amount is cents (a number), and the rest are strings.
- **Appropriation** (`SP.apOfRow(row, sheetName)`), decided by the Budget text, case-insensitively, tested in this order:
  1. `/spares/` → `sp`
  2. `/full\s*fund/` → `ff`
  3. `/\bopn\b/` → `opn`
  4. `/o&m/` → `om`

  - If none of these matches, it is decided by the sheet name: `O&M Raw Data` → `om`; a name containing `FF` or `Full Fund` →
    `ff`; one containing `Spares` → `sp`; one containing `OPN` → `opn`.
  - If neither decides, the row is *appropriation not identified*: kept and reported, never counted.
  - If the budget and the sheet name disagree, the budget wins, and the report counts the disagreements per sheet.
- **`pulls`** is `{om|ff|sp|opn: {rows, headers, files:[{name, sheets:[...]}], importedAt}}`, plus `unidentified: {rows}`. Only the
  appropriations present in this import appear.
- **Row order** is files in the order given, sheets in workbook order, rows top to bottom. Labels (§4.4) and Not Allocated ties
  (§5) depend on it, so the oracle uses the same order.
- **One sheet per appropriation per import.** If one import's rows for an appropriation come from more than one sheet (or file),
  the whole import is refused and nothing changes. The message names each sheet and how many of that appropriation's rows it
  holds, so a single misfiled row is easy to find, and a hidden sheet as hidden (Excel does not show it). A file given twice
  (identical bytes) is refused the same way. A sheet holding rows of several appropriations, such as a combined export, is fine
  as long as no other sheet holds any of them. The advice follows the counts (review SCR2-4, F9):
  - a sheet holding a tenth of the largest's rows, or fewer, holds a few rows that are most likely misfiled: move each to the
    sheet of its own appropriation, or correct its Budget;
  - two sheets each holding more are two whole pulls, or most of one (two exports of one appropriation, a combined export with
    a one-appropriation export, one pull as `.xlsx` and `.csv`, an old copy on a hidden sheet): leave all but the newest out
    of the import. Moving rows from one into the other would count them twice, so that is never advised for them.
- **`report`** lists:
  - each file and each sheet, used or ignored and why;
  - rows read and skipped blank;
  - rows and dollars per appropriation;
  - every conversion by kind with counts (text amounts, `$` amounts, parentheses, sub-cent rounding, trimmed spaces);
  - unreadable rows in full;
  - budget/sheet disagreements;
  - the distinct Alloc texts with counts and dollars.

**Derived fields: `SP.deriveRow(row, settings)`**, recomputed on every load, so a rule fix applies to old pulls. It returns
`{ap, fy, ccar, title, budget, pe, date, cents, alloc, pmo, status, svc, lane, k:{pmo, title, pe, ccar}}`:

- **`status`** comes from Alloc, case-insensitively:
  - `/^actual execution/` → `'exec'`
  - `/^not allocated$/` → `'na'`
  - `/^unprogrammed/` → `'unprog'`
  - `/^forecast/` → `'fcst'`
  - blank → `'other'`, labelled `'(blank)'`
  - anything else → `'other'`, labelled with the text itself
- **`svc`**: a per-budget override, `settings.budgets[normKey(budget)].svc`, wins. Otherwise these rules apply in order, each
  case-insensitive:
  1. `/\bAFRC\b/` → USAF AFRC
  2. `/\bANG\b/` → USAF ANG
  3. `/STOVL/` → USMC B (STOVL)
  4. `/USMC\s+CV/` → USMC C (USMC CV)
  5. `/USN\s+CV/` → USN (USN CV)
  6. `/^\s*USN\b/` → USN (USN CV)
  7. `/^\s*USAF\b/` → USAF
  8. anything else → `SP.SVC_UNKNOWN`

  This deliberately changes v12, whose rule sent every unmatched name to USAF and so filed $93M of Navy money there.
- **`lane`**: the override, else `/\bmandatory\b/` → `'mand'`, else `'disc'`.
- **`k`**: the `normKey` of PMO, Title, Plan Event and CCaR No.

**`SP.budgetTable(pulls, settings)`** returns every distinct budget name, with its rows, dollars, the service and lane the rules
give, and any override. The UI shows it; a name whose service is `SVC_UNKNOWN` is flagged.

## 4. The model (`40-engine.js`)

### 4.1 Settings (saved in the file, §11)

```js
settings = { asOf:'2026-10', firstFY:2025, goals:{...SP.GOALS_DEFAULT}, authorized:{'om|2027': cents},
             special:['PP 2000','JSF6654'], budgets:{ [normKey]: {svc?, lane?} } }
view = { svc: {USAF:true, …, 'Service not identified':true}, lane: {disc:true, mand:true} }   // this browser's switches, §11
```

- **`asOf`** is the last month whose data counts as actual.
  - Its default at an import is the last full month before the import's date: imported 9 Nov 2026, it is `2026-10`. Each new
    import resets it to that default and says so. A person can change it.
- **Execution year `E`** is the FY of the `asOf` month. The window runs from `(E−1)-10-01` up to, but not including, `E-10-01`.
- **`firstFY`** is the oldest money year shown. Rows with `fy < firstFY` count nowhere and are named in the report and the Summary's
  notes (§8.1).

### 4.2 Columns

Every block has the same columns, in this order:

| id | label | which rows |
|---|---|---|
| `prior` | `Prior Yr` | dated before the window |
| `m1`–`m12` | `Oct` … `Sep` | dated in that month of the window |
| `next` | `FY{E+1}+` | dated on or after the window's end |
| `nodate` | `No date` | dated `''` |

- The No-date column is shown only when some shown row has no date. When it is hidden, it still exists in the model, with zero
  in every cell.
- **Total** = the sum of every column.
- The **as-of column** is the `m`-column of `asOf`. Columns at or before it are *closed* (actual); later ones are *plan*.

### 4.3 Which rows count

A row counts in every product only if:

1. it is readable;
2. its appropriation is identified;
3. `fy >= firstFY`;
4. it is not FY2025 OBBBA funding (§15, Brad, 11 Nov 2026); and
5. the switches show both its service and its lane.

There are no other filters. **One set of switches drives every figure and every list**, and each product states what it shows
when not everything is shown.

### 4.4 Names and the tree

A block is one `(ap, fy)` pair, built from the rows of that appropriation and money year. Within it the tree is
PMO → Title → Plan Event → CCaR No:

- **Grouping.** Rows group by `k.pmo`, `k.title`, `k.pe` and `k.ccar`, so names that differ only in capitals or spaces are one
  node.
- **Labels.** A node's label is the spelling most rows of that node use. Ties go to the first spelling met in row order. Blank
  labels are `'(no PMO)'`, `'(no title)'`, `'(no plan event)'` and `'(no CCaR)'`.
- **Leaf rule.** Every counted row lands in exactly one leaf. So, per column, the tree's PMO rows add to the block total and every
  node's children add to the node. That is an invariant, and a test asserts it on every block.
- **PMO order.** `SP.PMO_ORDER` first, matched by `normKey`. Any other PMO follows, sorted by label, with `(no PMO)` last.
- **Order below the PMO.** Titles, plan events and CCaRs are ordered by total, largest first; ties go by label.

### 4.5 A block's figures

All figures are cents, over the counted rows.

- **`approved`**: the sum of every row.
- **`unprog`**: the sum of the `unprog` rows.
- **`obligated`**: the sum of the `exec` rows, whatever their date.
  - This is Brad's 28 Oct rule (item 133): obligated means CCaR's status says Actual Execution. **v12 used "dated before 1
    May"; that rule is retired.**
  - `execAfterAsOf` is the sum of the `exec` rows dated after the as-of month's last day. It is reported, and is still counted.
- **`unobligated`** = `approved − obligated`.
- **`authorized`** = `settings.authorized['ap|fy']` if entered; otherwise `approved`, with `authorizedEntered:false`.
- **With a BAE report loaded, §14.3 replaces Approved, Authorized and what they feed.**
- **`oblPct`** = `obligated / approved`, or `null` when approved is 0.
- **Year of availability** `n = E − fy + 1`.
  - The curve is `om1` (`n=1`) or `om2` (`n≥2`) for O&M, and `p1`, `p2`, `p3` or `p4` (`n≥4`) for the others.
  - `n ≤ 0` (money for a later year) has no curve, and every goal for it is `null`.
- **`goal`** is the curve's value at the as-of column.
- **`delta`** = `oblPct − goal`, or `null` if either is null.
- **`status`** is decided by `SP.statusOf(pct, goal)`:
  - `null` if either is null;
  - `'green'` if `pct >= goal − 1e-12`;
  - `'yellow'` if `goal − pct <= 0.10 + 1e-12`;
  - otherwise `'red'`.

  Words always go beside the colour: green **On track**, yellow **Within 10**, red **Behind**. The legend reads: *Green — at or
  above the OSD goal; Yellow — within 10 points of it; Red — more than 10 points behind.*

**Per column `c`:**

- **`cols[c]`**: the sum of the rows in `c`.
- **`cum[c]`**: the running sum through `c`, over `prior`, `m1`…`m12`, `next`. `nodate` is not in the running sum.
- **`obl[c]`**: `{v, kind}`.
  - For `prior` and for `m`-columns up to the as-of column, `kind:'actual'`, and `v` is the `exec` rows dated before the column's
    end, divided by approved.
  - For later `m`-columns and `next`, `kind:'plan'`, and `v = cum[c] / approved`, as v12 drew it.
  - `nodate` has none.
  - Every `v` is null when approved is 0.
- **`goalC[c]`**: the curve value for `prior` and the months, and `null` for `next` and `nodate`.
- **`statusC[c]`**: `statusOf(obl[c].v, goalC[c])`, carrying `kind`.
- **The Total column** prints `oblPct`, `goal` and `status`: the block's headline, the same as the Summary row.
- **`pmoRows`**: one per PMO with any row in the block, in PMO order, with `cols` and total.
- **`na`**: §5.

### 4.6 The model object

```js
SP.buildModel(pulls, settings, view) -> {
  asOf, E, window:{start,end}, cols:[{id,label,closed}], asOfIndex, showNoDate,
  shown:{services:[...], lanes:[...], all:bool, text:'All services, both lanes' | 'Services shown: …; lanes shown: …'},
  blocks:[Block],        // every (ap, fy) with fy >= firstFY that has any row in the pull (switches do not remove a block)
  aps:[{ap, label, blocks:[Block], total:{approved, authorized, obligated, unobligated, oblPct}}],   // only aps that have blocks
  summary:{rows:[Block], total:{approved, authorized, obligated, unobligated, oblPct}, notes:[string]},
  pmos:[{pmo, label, code, rows:[{ap, fy, approved, authorized, obligated, unobligated, oblPct, goal, delta, status}],
         total:{...}, blocks:[PmoBlock]}],
  naAll:[Item & {ap, fy}],
  excluded:{beforeFirst:{cents, rows, byFy:{}}, unidentified:{cents, rows}, unreadable:{rows}},
  execAfterAsOf:{cents, rows},
  stale:[{ap, label, day}],   // appropriations shown whose pull was imported before the as-of month ended (review BP-3)
}
Block    = {ap, apLabel, fy, n, curve, approved, unprog, obligated, unobligated, authorized, authorizedEntered, oblPct, goal, delta,
            status, execAfterAsOf, cols:[], cum:[], obl:[{v,kind}], goalC:[], statusC:[], pmoRows:[{pmo,label,cols,total}],
            tree:[Node], na:[Item]}        // cols/cum/... are arrays aligned with model.cols
Node     = {level:1..4, kind:'pmo'|'title'|'pe'|'ccar', key, label, cols:[], total, children:[Node]}
PmoBlock = the Block shape over only that PMO's rows. authorized = approved (§8.6); tree starts at the PMO node; na is that PMO's.
```

- **`pmos[].rows` and `pmos[].blocks`** follow v12's PMO-tab order: Full Fund, Initial Spares, O&M, OPN, then FY ascending.
- **`code`** is the text in the PMO name's parentheses: `AV` for `Air Vehicle (AV)`. A PMO without parentheses uses its first 12
  characters.
- **Summary notes** state, each only when it is not zero:
  - the services and lanes shown;
  - Unprogrammed money by block;
  - Authorized not entered;
  - money before `firstFY`, by FY;
  - rows whose appropriation was not identified;
  - unreadable rows;
  - executed rows dated after the as-of month;
  - each appropriation in `stale`.
- **`stale`** holds each appropriation shown whose pull's import day (`importedAt`, in this computer's time) is before the
  first day of the month after `asOf`. Such a pull, typically kept from an earlier import while another appropriation's
  import moved `asOf` on, cannot hold the whole as-of month. Its blocks' Obligation % label says where its actuals stop
  (§8), and the Summary's note names it, its day, and that its goal and status are still read at `asOf`. A pull with no
  import time is not listed. This marks the products; it changes no figure.

**`SP.diffPulls(prevPulls, curPulls, settings)`** reports what changed for each appropriation present in both pulls:

- approved and obligated per `(ap, fy)`, before and after;
- CCaRs new and gone;
- the PMO of a CCaR that changed. **A CCaR's PMO** is the PMO most of its rows carry. Where two or more PMOs carry as many
  rows, it is the first of them in the PMO order of §4.4, by key: `SP.PMO_ORDER` first, then any other PMO by its
  `normKey` (code-unit order), `(no PMO)` last. It never depends on the order of the rows, so a pull that lists the same
  rows in another order moves no CCaR (review M3: settled by row order, a CCaR with one AV row and one PSM row "moved"
  from AV to PSM when its two rows were listed the other way round). It is labelled by the spelling most of those rows
  use (§4.4). A row added to or taken from a CCaR whose rows sit under more than one PMO can still change which PMO
  carries most of them, and that is reported as a move;
- **lines** (leaf keys, `ap|fy|pmo|title|pe|ccar` in `normKey`s) new, gone and changed, each with dollars, largest change first.

It uses every row, not the switches.

- **A line** is every row of one appropriation, FY, PMO, Title, Plan Event and CCaR, added together. A row added to a line
  that was there, or taken from one that stays, changes that line; it is not a new or gone line (review BP-6).
- **A line changes** when its amount changes, when its obligated dollars (rows marked Actual Execution) change, or when its
  dollars move between months (by the month of each row's Date; no date is a month of its own). Each line carries
  `obligated: [before, after]`, `moved: {cents, from:[{ym, cents}], to:[{ym, cents}]}` (the dollars that changed month:
  half of every month's change, less the change in the amount; `from` and `to` are empty when nothing moved) and `what`,
  the list of `'amount'`, `'obligated'`, `'dates'`, `'unread'` that changed. *Largest change first* is by the largest of
  the change in amount, in obligated and in dollars moved (review BP-2: a pull in which money was obligated and money
  slipped, with no amount changed, listed no line). A new or gone line moves nothing.
- **A row that cannot be read** (§3) counts in no dollar figure here, as everywhere, but it is in its pull: its CCaR is
  there, and so is its line when its FY reads. So it never makes a CCaR or a line new or gone (review M1: a CCaR whose one
  row's Amount turned unreadable was listed as gone, with its dollars). A CCaR's dollars and PMO come from its rows that
  read, and from the others only when none does; `ccarsNew` and `ccarsGone` carry `unread`, the rows of it that could
  not be read. A line with such a row on either side, and anything that changed, is listed apart in `leaves.unread`,
  with the dollars each side could read and `unread: [before, after]` row counts. `unread: [before, after]` on the
  appropriation counts every row that could not be read, so the view can say how many.

## 5. Not Allocated

A row joins the lists if it counts (§4.3) and its status is not `exec`. Within a block, rows group into items by:

- the **column bucket** (§4.2), so Prior, the months, Next and No date all appear;
- the **status group**: `na`, `unprog`, `fcst`, or `other:<label>`;
- the **item key**: `'CC:' + k.ccar` if the CCaR's `normKey` is in `settings.special` (normalised), otherwise `'PE:' + k.pe`.

Each item:

- **`label`** is the most common Title spelling for a special CCaR (as v12 did), otherwise the most common Plan Event spelling;
- **`cents`** is the sum;
- **`ccars`, `pmos`, `titles`** are the distinct labels.

An item whose sum is exactly 0 cents is hidden. Items are sorted by column order, then cents (largest first), then label.

**The one-line-per-month text** (`SP.naLines(items, cols)`):

- One line per column that has items, labelled `'Prior Yr:'`, `'Oct:'` … `'Sep:'`, `'FY28+:'` or `'No date:'`.
- Each item is `'label ($x.xxM)'`, using `fmtM` (so `'<0.01'`), joined by `'; '`.
- A status other than `na` adds a tag: `' [Unprogrammed]'`, `' [Forecast]'`, or `' [<alloc text>]'`.
- **No cap.** v12 stopped at 60 items a month, and at 12 on PMO PSM.

PMO blocks list only that PMO's items. **Every PMO gets a list**; v12 gave one to PSM only.

## 6. What v12 did that the tool deliberately does not (the intended differences)

The tool must reproduce v12 in everything this list does not name. The v12 proof in §13 checks that.

1. The detail rows are built from the data, so nothing falls out:
   - v12's fixed list missed $1,512M;
   - it cut plan events at 80 characters;
   - a leading space missed a row;
   - names that differ only in capitals are counted once, where v12 counted them twice.
2. Every PMO row is a sum over the raw data, never "the first PMO adds its titles".
3. Obligated is status-based (§4.5).
4. Prior Yr, FY{E+1}+ and No date are visible on every block, O&M included. Nothing is hidden.
5. Service rules per §3: OPN and Navy APN CONG go to USN.
6. One set of switches drives everything (v12 applied them in some places and not others). Lane switches are new.
7. Status is worked out every time, with words. v12's fills were painted by hand.
8. Not Allocated:
   - no cap;
   - $0 items hidden;
   - largest first;
   - Unprogrammed, Forecast and other statuses tagged;
   - Prior, Next and No date listed;
   - filtered by the switches;
   - a list for every PMO.
9. There are no row limits.
10. Goals:
    - from the settings table;
    - O&M in its second year uses `om2` (v12 used the one-year curve for O&M FY25);
    - v12's typo in PMO MxS (−93.33%) is gone.
11. Each slide block's PMO rows are every PMO with money, not a typed list.
12. The CCaR row shows its number.
13. Authorized can be entered.
14. The CUI marking is on every screen, sheet and picture.

## 7. The .xlsx writer (`50-xlsx-write.js`)

**`await SP.writeXlsx(spec)`** returns a `Uint8Array`, a valid .xlsx that Excel and LibreOffice open with no repair prompt.

```js
spec = { creator:'SFCB Spend Plan', sheets:[ {
  name, tabColor:'1F3A68'?, grid:false?, freeze:'A5'?, outlineAbove:true?,   // summary rows above their detail
  breaks:[row]?,                                     // a printed page starts at each of these rows (1-based, from 2)
  page:{orientation:'landscape', paper:'letter', fitWidth:1, fitHeight:0}?,
  header:'&C&"Calibri,Bold"CUI//REL TO US DoW'?, footer:'…'?,
  cols:[{w:12, hidden:false}],
  rows:[{cells:[Cell|null], ht?:15, level?:0..7, hidden?:false}],
  merges:['A1:Q1'] } ] }
Cell  = {v: string|number|boolean|{date:'YYYY-MM-DD'}, s?: Style}
Style = {font:{b,i,sz,color:'RRGGBB',name}, fill:'RRGGBB', fmt:'#,##0.00;(#,##0.00);-', border:{t,b,l,r:[style,'RRGGBB']},
         align:{h,v,wrap,indent}}
```

- **Styles.** Identical styles are written once. An indent always comes with a horizontal alignment (`left` unless given):
  Excel draws no indent without one.
- **Text.** Any character XML cannot carry (C0 controls except tab, line feed and carriage return; U+FFFE; U+FFFF; an unpaired
  surrogate) becomes U+FFFD and is counted in `SP.lastXlsxNotes`. A carriage return is written as `&#13;`. Text is inline or
  shared strings, the writer's choice.
- **Numbers** are written at full precision (`toPrecision(15)` for non-integers). A date is an Excel serial, with its format
  defaulting to `yyyy-mm-dd`.
- **Element order** follows the schema: `sheetPr` (`tabColor`, `outlinePr summaryBelow="0"` when `outlineAbove`,
  `pageSetUpPr fitToPage`), `sheetViews`, `sheetFormatPr`, `cols`, `sheetData`, `mergeCells`, `printOptions`, `pageMargins`,
  `pageSetup`, `headerFooter`, `rowBreaks`. Rows carry `outlineLevel` and `hidden`, and `sheetFormatPr outlineLevelRow` is the
  maximum used.
- **Page breaks** (`breaks`) are written as manual `rowBreaks` (`<brk id="r-1" man="1">`), each row once, in order. Excel and
  LibreOffice keep them under fit to one page wide when the height is automatic (`fitHeight:0`). A row that is not a whole
  number from 2, and more than Excel's 1,026 breaks a sheet, are refused.
- **Sheet names**: at most 31 characters, none of `[]:*?/\`, unique (made unique with ` (2)`), never blank.
- **The zip** is DEFLATE through `CompressionStream('deflate-raw')` where it exists, and stored otherwise.
- **`SP.zipFiles([{name, data: Uint8Array}])`** is exposed for the pictures (§10).
- **Tests** read every written file back with Python's openpyxl and with LibreOffice
  (`soffice --headless --convert-to csv`), never only with the tool's own reader.

## 8. The Excel workbook (`60-export.js`)

**`await SP.excelBytes(model, pulls, settings, meta)`** returns the bytes. **`SP.exportExcel()`** is the UI action: build,
download, and say what was written and where (`SP.DOWNLOAD_WHERE`, §2).

- The file name is `SFCB Spend Plan FY{E} - data through {Mon-YYYY} - {YYYY-MM-DD}.xlsx`, plus ` [filtered]` when not
  everything is shown.
- **Values only. No formulas.**
- Money cells hold **$M** (`cents / 1e8`) with format `#,##0.00;(#,##0.00);-`. Percentages use `0.00%`; Delta uses
  `+0.00%;-0.00%;0.00%`.
  - A non-zero amount under $5,000 keeps its number and takes the format `"<0.01";"(<0.01)";-` (marked as its column is), so
    nothing non-zero reads as zero (§2), as on the screens and in the pictures. `#,##0.00` showed it as 0.00.
- An FY is a number with the format `"FY"0`, so it shows `FY2025`, as v12 wrote it.
- **Every sheet:**
  - header `CUI//REL TO US DoW`, centred, bold;
  - footer `CUI//REL TO US DoW` centred, with `Page &P of &N` on the right;
  - letter, landscape; the report sheets fit to one page wide, and the raw data sheets print at full size across pages, as
    v12's had no fit (36 columns are about 44 in wide: fitted to one page they printed at 23%);
  - gridlines off on the report sheets.

**The look is v12's.** Read `### look` and `### summary-slides` in FINDINGS.md:

- Calibri 10–16;
- sheet titles 16 pt bold navy `1F3A68` text with no fill, centred (v12's style 58); subtitles 11 pt italic `707070`, centred;
- block bars, the TOTAL row and the Not Allocated bars white, bold, on navy `1F3A68`; the TOTAL label left-aligned on the
  Summary and centred (`Total - All FYs`, `Total - All`) on the appropriation sheets and PMO tabs;
- money cells and the outline's labels centred vertically; an appropriation sheet's FY cell 11 pt bold navy;
- PMO-tab block bars `305496`, and their strips `BDD7EE`;
- header rows `FFE699` with a medium `404040` box;
- data cells with thin `808080` borders;
- status fills green `00B050`, yellow `FFD700`, red `C00000`, with the word in the cell, white on red and green, black on yellow;
  a status cell with no status (no goal, No date) has no fill but a closed column's grey, on the screens and in the pictures
  too: v12's `FFE699` base fill there was a word-less near-yellow beside *Within 10*;
- outline styles: PMO 11 pt bold navy; Title 10 pt bold, indent 2; Plan Event 10 pt, indent 4; CCaR 9 pt, indent 6.

**Closed columns** (actual months up to the as-of month, and Prior) carry a light grey fill (`F2F2F2`) on their data cells.
**Plan cells** of the Obligation % row are italic and grey (`808080`). Plan cells of the OSD Status row keep their status fill
and ink (white on green and red, black on yellow) and are italic: grey on the red or green fill measured about 1.5 : 1 and
could not be read. The screens and the pictures draw them the same way. The Obligation % label reads
`Obligation %  (Approved 3,482.32M; actual through Oct, plan after)`, and for a block whose appropriation is in
`model.stale` (§4.6) `Obligation %  (Approved 9.39M; actual through the 2026-10-05 import, plan after)`: one wording
(`SP.oblLabel`) on the screens, every sheet and the pictures. In the workbook a label wider than its column wraps, in a row
as tall as its lines: right-aligned in the first column, its overflow has no cell to run into and would be cut.

**The Authorized marks** (and, with a BAE report loaded, the Approved mark `§`, §14.5). A figure is marked with a number format, so the cell is still the number: `†` when Authorized was
not entered (Approved stands in), `‡` when it was entered while some switch is off. A TOTAL carries each mark its rows
carry (`SP.authMarks`), `†‡` when both, on the screen as in the workbook (review SEAM-8). Every sheet and every view that
prints a mark says what it means under the table it marks (`SP.AUTH_MARK_TEXT`), in a row as tall as its words: Excel
never fits a row's height to a merged cell (review XP2-1, XP2-4).

### 8.1 Summary

- **Title:** `F-35 Sustainment Financial Execution - Top-Line Snapshot (FY{E%100}Q{q})`, where `q` is the as-of month's quarter
  of the FY.
- **Line 2:** `Data through {Mon}-{YYYY} | Approved = total planned ($M from the CCaR pull) | Authorized = entered, else Approved
  | Obligated = CCaR status "Actual Execution" | Unobligated = Approved - Obligated | Delta = Obl% - OSD%`.
- **Line 3:** `model.shown.text`.
- **Table:** headers *Appropriation, FY, Approved ($M), Authorized ($M), Obligated ($M), Unobligated ($M), Obl %, OSD Goal %,
  Delta (pp), Status*.
  - One row per block, the appropriation label merged down its rows.
  - Authorized carries a `†` when it was not entered, a `‡` when entered while a switch is off (§8, the Authorized marks).
  - **`TOTAL - Sustainment`**: the sums, with Obl % = obligated/approved, and no goal, delta or status. Its Authorized
    carries each mark its rows carry.
- **Below:** the legend (three coloured cells with their words and meanings), a line for each mark used, then the notes.
- Freeze below the header row.

### 8.2 Slide Snapshots

- **Title:** `Slide Snapshots - picture-ready blocks for PowerPoint`.
- **Line 2:** `The dashboard’s pictures fit a 13.33 in x 4.5 in slide region and are marked CUI: Slide blocks > Copy picture or
  Save pictures. To copy a block from this sheet instead, select it from the CUI line above its title through the CUI line under
  OSD Status and use Copy as Picture; it is wider for its height than that region, so size it by its width.`
  (v12's line said each block was sized for that region. It never was: a block here is about 19 x 3.4 in, 5.7 : 1, against the
  region's 2.96 : 1.)
- **Line 3:** `model.shown.text`.
- **Each block, in model order:**
  1. a line `CUI//REL TO US DoW`, bold, centred across the block;
  2. when not everything is shown, `model.shown.text`;
  3. bar `{Ap} FY{fy} - Spend Plan (PMO Summary, slide-ready)`;
  4. header `PMO | Total | Prior Yr | Oct … Sep | FY{E+1}+ | [No date] | Total`;
  5. the PMO rows;
  6. a blank row;
  7. Monthly Totals, Cumulative Totals, Obligation %, OSD Goal %, OSD Status;
  8. the line `CUI//REL TO US DoW` again;
  9. the bar `Not Allocated Requirements` and the §5 lines (label in A, text in B, merged across, wrapped);
  10. two blank rows.

  Printed, each block after the first starts a page (a manual page break at its first CUI line, item 1), so no block is cut
  across two pages; one block, fitted to the page's width, is about half a page at most (review XP2-6).

  Items 1–8 are the range line 2 names. A range picture carries only its cells, never the sheet's CUI header and footer or its
  line 3, so the marking (§6 item 14) and the filter statement (§4.3) are inside the range, as they are in the dashboard's
  pictures (§10).

### 8.3–8.5 O&M, Full Fund, Initial Spares, OPN (one sheet each, for every appropriation with a block)

- **Title:** `F-35 Sustainment {Ap} - Spend Plan & FY Summary (from the CCaR pull imported {YYYY-MM-DD})`. With a BAE report
  loaded it names the report too (§14.6).
- **Line 2:** the shown text.
- **Top table:** *FY, Approved, Authorized, Obligated, Unobligated, Obl %, OSD Goal %, Delta (pp), Status*, with a
  `Total - All FYs` row that has no goal, then a line for each Authorized mark the table uses (§8).
- **Then each FY block:**
  1. bar `FY{fy} - Spend Plan by PMO / Title / Plan Event / CCaR  (1/2/3/4 in left margin)`;
  2. the header;
  3. the tree: PMO at outline level 0, Title 1, Plan Event 2 (hidden), CCaR 3 (hidden), as v12 stored them and as the PMO tabs
     do (`outlineLevelRow` 3). Excel then draws the four outline buttons the bar names: 1 PMO, 2 Title, 3 Plan Event, 4 CCaR.
     (FINDINGS numbers the four levels 1–4 by their buttons; stored one higher, the sheet had five buttons and its button 4
     stopped at Plan Event.) The CCaR row's label is the CCaR number;
  4. the totals band (Monthly Totals = the sum of the PMO rows = the block total);
  5. the Not Allocated bar and lines.
- Summary rows sit above their detail (`outlineAbove`). The sheet opens showing PMO and Title rows.

### 8.6 PMO tabs: `PMO {code}`, one per PMO with money in any block

(With a BAE report loaded, the table is §14.4's.)

- **Tab order is v12's:** PMO AV, BOP, CDS, MxS, PP, PSM, TSS (Propulsion before Product Support, unlike the PMO rows inside a
  block, §4.4), then any other PMO in the model's order (by label, `(no PMO)` last).
- **Title:** `PMO: {label} - Sustainment Spend Plan (Cross-Appropriation Detail)`.
- **Line 2:** the shown text.
- **Table:** *Appropriation, FY, Approved, Authorized, Obligated, Unobligated, Obl %, OSD Goal %, Delta (pp), Status*.
  - One row per block in which the PMO has rows.
  - **Appropriations in v12's order here: Full Fund, Initial Spares, O&M, OPN.**
  - A `Total - All` row.
  - **Authorized = Approved**, with the note *Authorized is entered by appropriation and FY; a PMO row shows Approved.*
- **Then per block:**
  1. bar `{Ap} - FY{fy}` (fill `305496`);
  2. the header;
  3. the strip `{Ap} FY{fy} Summary  |  Approved X.XXM  |  Authorized X.XXM  |  Obligated X.XXM  |  Unobligated X.XXM` (fill
     `BDD7EE`);
  4. the PMO row, then Title (level 1), Plan Event (level 2, hidden), CCaR (level 3, hidden);
  5. the totals band;
  6. that PMO's Not Allocated lines.

### 8.7 Other sheets

- **`Not Allocated`**: every item of `model.naAll`, one row each. Columns: *Appropriation, FY, Column, Item, Status, CCaR(s), PMO(s),
  Title(s), $M*. Sorted as §5 within each block.
- **`O&M Raw Data`, `FF Raw Data`, `Spares Raw Data`, `OPN Raw Data`**: every row of that appropriation's pull, in pull order.
  - The 32 headers on row 1, then the extra columns, then *Service*, *Lane*, *Status*, *Counted* (*Yes*, or the reason it is
    not).
  - Amount in dollars as a number, with format `#,##0.00`; Month and Date as dates.
  - Freeze row 1. Only appropriations with a pull.
- **`Import Report`**: the report as text rows. An import's time is written in this computer's time, `YYYY-MM-DD HH:MM`, as
  the sheet titles' dates are. Every row whose appropriation is not identified is listed on its own line (where it was, its
  CCaR, Title, Budget, Plan Event, FY and dollars): those rows are on no raw sheet, and the Summary's note sends the reader
  here. The screen's Import report lists them too.
- **`Settings`**: as-of, execution year, first FY, the switches, the goal table, the Authorized entries, the special CCaRs, and
  the budget table (name, rows, $M, service, lane, override).
  - The seventh switch, *Service not identified*, reads *Shown* or *Hidden* when it exists (§9). When it does not, it reads
    *No such rows (no switch)* only when no row in the pulls has no service; otherwise it says there is no switch and counts
    the rows with no service by why each counts nowhere (before the first FY, could not be read, appropriation not
    identified), as the raw data sheets' Counted column gives it (review SEAM-9).

## 9. The screens (`90-ui.js`, `style.css`, `shell.html`)

One page, keyboard-usable, with the CUI banner top and bottom (already in `shell.html`).

**Top bar:**

- the title `SFCB Spend Plan` and the execution year;
- **Data through** (a month picker writing `settings.asOf`, from 1990-01 to 2100-12; a year still being typed is not taken,
  and a box left holding no month in that range goes back to the month in use, saying why) and **First FY** (a number input);
- each appropriation's import date (`OPN imported 2026-10-05`): the day the pull came into the page, which is not always the
  day CCaR made it. Where two pulls on screen came in on one day, each is named to the minute (`2026-11-09 09:05`), and to
  the second if need be, so the older can be told from the newer (review SCR2-11);
- buttons **Import CCaR pull…** (a file input, multiple, `.xlsx,.csv`), **Save**, **Save a copy…**, **Export Excel**,
  **Help**;
- the save state (*Saved* / *Unsaved changes*).

**Filter bar:**

- six service checkboxes, and a seventh, *Service not identified*, only when such rows exist. A switch with no box does not
  exist for that plan: `model.shown` is stated over the switches that exist, so the seventh, left off in this browser, makes
  nothing read as filtered on a plan with no such rows (review S2);
- *Discretionary* and *Mandatory* checkboxes;
- the line `model.shown.text`.

**Views** (buttons with `aria-pressed`, not ARIA tabs):

- **Summary** (§8.1 on screen), the TOTAL's Authorized marked as its rows are, and each mark explained under the table (§8).
- **Slide blocks**: each block as a table, with **Copy picture** and **Save picture**, and **Save all pictures (.zip)** at the
  top.
- **O&M**, **Full Fund**, **Initial Spares**, **OPN**: the top table, then each block's tree.
  - Expandable rows are buttons with `aria-expanded`.
  - **Expand to:** PMO / Title / Plan Event / CCaR.
  - The Not Allocated table for the block (§5 as a table: Column, Item, Status, CCaR(s), PMO(s), $M).
- **PMOs**: a picker, then §8.6 on screen.
- **Not Allocated**: the whole `naAll` table, with filters by appropriation, FY and PMO.
  - A choice (the PMO picked on PMOs too) is kept while the switches leave it nothing to show: it stays chosen, offered as
    *(no items shown)* (*(no money shown)* on PMOs), the view says it has nothing that counts with these switches, and it
    comes back when they show it. Only **Clear filters**, or another choice, takes it off (review SEAM-10).
  - The count reads `0 of 12 items, $0.00M` for nothing: never `$-M` (`fmtMText`).
- **Import report**. After a refused import, the refusal comes first, with what that import held; the report held below it is
  then headed as the last import **taken**, before the one refused, never as "the last import" (review F8).
- **What changed** (`diffPulls`), or "Only one pull so far". Each appropriation's section is named by its two pulls; where the
  current pull repeats an earlier one row for row (`sameSince`), it is named by that earlier pull, and says the newest import
  changed nothing. Its list of imports names an import that placed no row as such, never as an empty line, and names two
  imports on one day by their times. It counts **lines** and says what one is (§4.6); each line says what changed in it
  (the amount, its obligated dollars before and after, the money that moved from one month to another, rows that could not
  be read) beside its dollars before and after and its obligated dollars before and after. Where either pull holds rows
  that could not be read, the section says how many, and lists their lines apart.
- **Settings**: the goal table (editable, with *Reset to v12's curves*), Authorized by block ($M, typed through `parseAmount`, and
  blank clears), the special CCaRs, and the budget table with service and lane override selects.

**Behaviour:**

- Every number is `fmtM` / `fmtPct`. Status shows its colour **and** its word.
- Every view states `model.shown.text` when not everything is shown. The Import report and What changed, which show every
  row whatever the switches, head that notice *This view shows every row, whatever the switches*, never *Showing only part
  of the data* (review SCR2-7).
- A picker's accessible name starts with the words beside it: *Expand to (O&M FY2025)* (WCAG 2.5.3, review SCR2-10).
- A change that makes the sticky top taller (its message line, say) never leaves the control the keyboard is on under it:
  the control is scrolled back into view (WCAG 2.4.11, review SCR2-1).
- **Printed** (Ctrl+P), every page carries `SP.CUI` at its top and bottom (the page's own margin boxes; the page's two CUI
  lines are printed too, for a browser without them), and a line on paper only says the execution year, Data through, the
  import dates and what is shown, which the top bar, not printed, says on screen (review SCR2-2).
- The marks `†` and `‡` on a TOTAL row's navy are drawn in the header gold, which reads at 4.5:1 there (review SCR2-3).
- **All text from a pull is escaped** (`SP.esc`) wherever it reaches markup. A plan event may be `"><img src=x onerror=…>` or
  contain `</script>`. No inline handler ever carries a value from the data; use event delegation with `data-` attributes.
- A change to a switch, as-of, first FY or a setting rebuilds the model and redraws. Settings changes mark the file unsaved;
  switch changes do not, because they are this browser's view. A setting put back to what the file holds, with nothing but
  settings changed since the file was opened or saved, leaves the file saved (Data through retyped as the month it showed,
  say), and the message says nothing is unsaved (review SCR2-5).
- **No data yet** shows one panel: what to import and how ("Each file is a CCaR export laid out like v12's Raw Data tabs; import
  one file per appropriation, or one file holding all four. Rows are placed by their Budget name.").
- Errors are shown in a message line with the reason, never swallowed.
- A change says what changed: a goal names its curve, its column, the new goal and the old (`OSD goal for O&M, first year,
  Mar, set to 55% (was 50%).`), as an Authorized names its block. A download (the workbook, a picture, the pictures' zip)
  says it was downloaded and ends with `SP.DOWNLOAD_WHERE`.
- **Help** is a short in-page guide: the rules of §4–§5 in plain words, and the differences from v12 (§6).

## 10. Slide pictures (`70-pictures.js`)

- **`SP.blockCanvas(block, model)`** draws one slide block, from its title bar through OSD Status (v12's picture region), on a
  canvas of **2000 × 675** px (13.33 × 4.5 in at 150 dpi) with a white background.
  - It uses the same colours and words as §8, with `SP.CUI` in small bold text at the top and bottom.
  - The table is scaled to fit the region's width, and down further if it would not fit its height; it never overflows.
- **`await SP.blockPng(block, model)`** returns a PNG Blob carrying one `pHYs` chunk of 150 dpi (5906 px a metre), so Office
  places it at 13.33 × 4.5 in; without it Office reads 96 dpi and places it at 20.83 × 7.03 in. A browser may re-encode a
  clipboard picture without it, so Copy picture's message says how to size it.
- **`await SP.copyBlockPicture(...)`** writes it to the clipboard (`ClipboardItem`). Where that is refused, it says so and offers
  **Save picture** instead.
- **`await SP.allPicturesZip(model)`** uses `SP.zipFiles`. Each file is named `{Ap} FY{fy}.png`.

## 11. State, saving and opening (`80-store.js`)

**State.**

```js
SP.state = { v:1, tool:'sfcb-spend-plan', savedAt:'ISO'|null, settings, pulls:{current:{om?,ff?,sp?,opn?,unidentified?}, previous:{...}},
             history:[{importedAt, aps:[...], totals:{'om|2026':{approved, obligated}}}], lastImport:{report} }
// a current pull may also carry sameSince:'ISO' (it repeats that pull, row for row); the unidentified rows carry
// importedAt once they have been kept over a later import
```

- **Import** (`SP.applyImport(parsed)`):
  - each appropriation in the import replaces that appropriation's current pull;
  - the replaced pull becomes `previous[ap]`;
  - **a pull the same as the current one, row for row,** leaves `previous[ap]` as it is. The new pull is still current (with
    this import's `importedAt`), and records `sameSince`: the import time of the pull whose rows it repeats. What changed
    names that pull and says the newest import changed nothing;
  - appropriations not in the import keep theirs and say from when (to the minute when that was the same day as this
    import, and to the second when it was the same minute);
  - **the unidentified rows** are replaced by an import that brings some. An import that brings none leaves them while a pull
    the import they came with brought is still current (they then carry that import's `importedAt`), and moves them to
    `previous` once every such pull has been replaced. The message says which;
  - one history entry is added;
  - `asOf` resets to the new default and says so (an import that places no row in an appropriation leaves it);
  - the state is marked unsaved.
- **Before an import replaces anything, it asks** (`window.confirm`), naming the sheet, the rows and dollars, and the pull it
  would replace, when:
  - every row of an appropriation sits on one sheet whose name names other appropriations and not its own (the question reads
    a name as naming O&M by `O&M`, `O & M` or `OM` as a word, Full Fund by `FF` or `Full Fund`, Initial Spares by `Spares`,
    OPN by `OPN`; a name may name several, and one that names a row's own appropriation is never "named for another"; this
    is not the placement rule of §3, which is unchanged); or
  - the new pull has fewer than half the readable rows of the pull on screen it replaces (a misfiled row on a sheet with a
    neutral name, a file cut short, a filtered pull, Amounts saved as formulas without their results).

  Its advice is to correct the Budget, or to take a misfiled row out of the file (its own appropriation's pull is imported
  whole), never to give it a sheet of its own. Cancel changes nothing. OK imports, and the message says what to check.
- **The message line is a warning** (`warn:true`), never a plain success, when a file was refused, the import asked a
  question, or rows count nowhere (unreadable rows, rows whose appropriation is not identified).
- **The file is the database.** The state lives in `<script id="spState" type="application/json">`, written as `JSON.stringify`
  with **every `<` written as `<`**. Without that, a plan event containing `</script>` truncates the file.
  `SP.savedHtml()` = the page's own HTML with that tag replaced.
- **Capturing the page.**
  - Take `'<!DOCTYPE html>\n' + document.documentElement.outerHTML` at boot, **before** the UI draws.
  - The state tag must be restored to its loaded text.
  - The `#app` contents must be put back to the shell's boot note, so a saved file opens like a fresh one.
- **Save.**
  - Where the browser has `showOpenFilePicker`, the first Save in a page asks the person to pick **this** file (the dialog says
    so, naming the page's file name).
  - Before writing, it reads that file and checks three things:
    - it carries `<meta name="sfcb-spend-plan"`;
    - its saved state's `savedAt` is the one this page opened with, or null;
    - it is not a different tool.
  - If the file was saved by someone else since, it asks before writing over it, saying when, and whether that save came
    before or after the one this page opened with (or, with none, after the page was opened). A picked file whose name is not
    the page's own is said to be another file, naming both, and is written only after the person says so. The handle is
    remembered for the session in memory.
  - A page that opened a saved plan (or data it refused) is asked before its plan goes into a picked file that holds **no**
    plan: that is not the file it was opened from, but perhaps a copy of the tool of the same name in another folder.
  - A file holding a save **this page wrote** elsewhere (Save a copy…, a download) or **the plan this page took** (an
    imported .html) holds nothing this page lacks: it is not asked about as someone else's save.
  - The data this page could not read at all on opening (its saved JSON does not parse) is written over only after a
    question, and only when the file still holds exactly that data; any other unreadable data is refused.
  - **After a question, or the browser's own write prompt, the file is read again** before it is written. If it changed (a
    colleague saved meanwhile), the checks start again on what it now holds, saying it was saved again; after three changes
    Save stops and writes nothing.
  - **Where writing is refused** (the file window throws, write access is denied, the write fails), Save and Save a copy…
    offer a download instead, after a question. A download leaves the page unsaved (*Downloaded, not in the file yet*).
  - **Save a copy…** uses `showSaveFilePicker` (a new file). A copy given the page's own file name, before the first Save, cannot
    be told from a file of that name elsewhere: the message says so, and the page stays unsaved.
  - Without those APIs, Save downloads the file with its current name. It then says the shared copy is not updated until the
    download is put in its place. The page's own file still lacks the work, so the page stays unsaved (the top bar says it was
    downloaded) and leaving still asks.
  - A download's message names the name asked for, and allows for the browser adding a number when the downloads folder
    already holds it (`… (1).html`): the newest download is the one to put in place.
- **Opening.** The embedded state is loaded and checked: right tool, right `v`, the shapes it reads. A state that fails is not
  used; the page says why and opens empty.
- **Leaving.** `beforeunload` asks when there are unsaved changes.
- **Preferences** (`localStorage`, `sfcbsp.view`) hold only the switches. They are wrapped in try/catch, and the page works
  without them.

## 12. Tests (`test/*.test.mjs`, run by `node spend-plan/test/run-all.mjs`)

- **`test/fixture/make_fixture.py`** (builder A2, Python plus openpyxl, deterministic with `--seed`) writes into a directory it is
  given:
  - `pull-all.xlsx`: four sheets named like v12's raw tabs, each with v12's title row on row 1 and the header on row 2;
  - `pull-om.xlsx`: one sheet named `Report`, header on row 1, columns in a **different order** with one extra column;
  - `pull-ff.csv`.
- **The data is synthetic, about 600 rows.** Every value is invented, shaped like CCaR's, and covers every case this contract
  names:
  - cents and negatives;
  - `'$0.00'` text and `'(1,234.56)'` text;
  - leading and trailing spaces;
  - case variants of a title and a plan event;
  - plan events over 80 characters;
  - every status, including Unprogrammed, Forecast, blank and an unknown text;
  - budget names for every service, a Navy OPN line, a Navy APN CONG line, a Mandatory line and a name no rule knows;
  - rows in Prior, every month, Next and No date;
  - FY2024 rows, so they fall before `firstFY`;
  - FY `'FY26'` as text;
  - an unreadable amount;
  - a sheet with no header;
  - both special CCaRs;
  - a PMO not in the list, and a blank PMO;
  - an executed row dated after the as-of month;
  - a title holding `<b>&"'`, and a plan event holding `</script>` and `"><img src=x onerror=alert(1)>`.
- **`test/fixture/oracle.py`** (builder A2) computes, **from the fixture files alone and never from the tool's code**, everything
  §4–§5 define, for given settings and switches. It writes `expected.json`:

```json
{ "asOf":"2026-10", "E":2027, "firstFY":2025,
  "blocks": { "om|2026": { "approved":c, "unprog":c, "obligated":c, "authorized":c, "oblPct":x|null, "goal":x|null,
      "delta":x|null, "status":"green"|...|null, "execAfterAsOf":c,
      "cols":{"prior":c,"m1":c,…,"m12":c,"next":c,"nodate":c}, "cum":{…}, "obl":{"prior":[v,"actual"],…},
      "goalC":{…}, "statusC":{…},
      "pmos":{"<pmo label>":{"total":c,"cols":{…}}}, "titles":{"<pmo label>|<title label>":c},
      "na":[["m4","na","PE:<key>",c,"<label>"], …] } },
  "summary":{"approved":c,"obligated":c,"authorized":c},
  "pmoTabs":{"<pmo label>":{"om|2026":{"approved":c,"obligated":c}}},
  "excluded":{"beforeFirst":c,"unidentified":c,"unreadableRows":n},
  "rowsByAp":{"om":n,…} }
```

  Here `c` is integer cents, and `na` lists `[colId, statusGroup, itemKey, cents, label]` in §5 order.
- **Two generations.**
  - The fixture also writes `gen2/pull-om.xlsx` and `gen2/pull-ff.csv`: a later pull of O&M and Full Fund with changed amounts,
    a new CCaR, a plan event gone, a CCaR moved to another PMO, and a new budget name.
  - Importing `pull-all.xlsx`, then gen2, leaves O&M and Full Fund from gen2, and Initial Spares and OPN from the first import.
    The first import's O&M and Full Fund become `previous`.
  - Gen1's `pull-om.xlsx` and `pull-ff.csv` hold the **same rows** as `pull-all.xlsx`'s O&M and FF tabs, in other layouts. Imported
    with `pull-all.xlsx`'s Spares and OPN, they must give the same model as `pull-all.xlsx` alone: the layout-independence check.
- **Scenarios** the oracle runs:
  - `all` (every switch on, asOf `2026-10`, firstFY 2025);
  - `usaf-off`;
  - `mand-only`;
  - `asof-2026-03` (its E is 2026);
  - `first-2024`;
  - `gen2` (the state after both imports, every switch on, asOf `2026-10`). It adds `"diff"`: per appropriation in both pulls,
    `approved` and `obligated` before and after by `ap|fy`, `ccarsNew`, `ccarsGone` (normalised keys) and `pmoMoves`
    (`[ccarKey, fromPmoLabel, toPmoLabel]`).
- **Each module's builder writes the tests for that module.** The engine test compares `buildModel` to `expected.json` for every
  scenario, value for value. The export test compares the workbook, read back through openpyxl, to the same file.
- **A check must be able to fail.** For each test file, its builder shows one planted mistake failing it: change one line,
  run, see the failure, put it back, and say which in the final report.

## 13. The v12 proof (integration only; never committed: it uses the real workbook)

Import the real `wb.xlsx` into the tool with asOf `2026-04` and firstFY `2024`. Then:

1. **Against the oracle.** Run the oracle on the same raw tabs and compare every figure. They must agree exactly.
2. **Against v12's own cached values.** Compare every Summary, appropriation-tab, PMO-tab and slide figure. Every difference must
   be explained by an item of §6, with its dollars. One that is not is a defect, in the tool or in this contract.

Write the result to the scratchpad (`.../scratchpad/wb/v12-proof.md`).

## 14. The BAE report: Approved and Authorized from the budgets (Brad, 10 Nov 2026)

Brad asked on 10 Nov 2026 to pull in a second report beside the CCaR pull: the BAE report of budgets (*Report__BAE_ALL_Services_
USAF_and_DoN_<date>.xlsx*), which gives each budget's Approved and Authorized amount by FY. His answers, given that day:

1. **Scope.** A block's figures add up the report's **sustainment budgets by name**: every budget whose name places it in O&M,
   Full Fund, Initial Spares or OPN by the pull's own rule (§3, `SP.apOfBudget`), **except Full Fund Flyaway** (aircraft
   production). Advance Procurement, Modifications, RDT&E and squadron budgets name no appropriation and are out.
2. **Approved** in the stoplight tables is **the report's Approved**, not the CCaR plan total.
3. **Obl %, Unobligated and the status** are measured against **Approved** (now the report's), as v12 measured them.
4. **PMO rows** take Approved and Authorized from **the budgets whose name ends in that PMO** (`… Discretionary AV`).
5. **Partial years:** the report's Approved is used on every block it covers, and a block whose CCaR plan is under half of it
   is **flagged** (the Summary's notes, the Import report), never hidden.
6. **Slide blocks stay on the plan:** the slide blocks, and the totals band under every tree (§8.3–8.6), keep measuring the
   CCaR plan by month, as they do now.
7. **PMO Obligated** is counted **by the budget's PMO** too, so a PMO row's Approved, Authorized, Obligated and Obl % measure
   the same money.
8. **A typed Authorized wins** over the report for its block, marked as entered; clearing it goes back to the report's.

The rest of this section is the lead's reading of those answers. Where the sections above say "Approved", read this section
first: **with no BAE report loaded, nothing in §1–§13 changes**, and every existing check must still pass unchanged.

### 14.1 Reading the report (`30-import.js`)

- **It comes in through the same Import button**, alone or with pull files. A sheet is a **BAE report sheet** when a header row
  within its first 15 rows holds all of `Budget Name`, `Budget FY Numeric` (or `Budget FY`), `Budget Approved Amount` and
  `Budget Authorized Amount`, compared by `normKey` after a trailing unit in parentheses is taken off (`Budget Approved Amount
  ($M)` matches). A sheet that is neither a pull sheet nor a report sheet is ignored as now. A sheet that is both is a report
  sheet.
- **One report per import.** Two report sheets in one import (in one file or two) refuse the whole import, naming both, as two
  sheets of one appropriation do (§3). Nothing changes.
- **Every column is kept**, in the file's order, as the pull keeps its extras: the raw sheet (§14.6) writes them back.
- **A re-imported export** (review I4-1). This tool's `BAE Report` sheet (§14.6) ends with its own *Appropriation*, *Service*,
  *Lane*, *PMO* and *Counted*, worked out again on every load. As for a raw data sheet's four (§3), the **last** column of
  each of those names, when all five are there in that order, is read as nothing and noted (the sheet's line and the BAE
  section say so); the five in another order, or one alone, are the report's own and kept. Kept as the report's, they came
  back on the next export beside the fresh five, frozen at the old switches, and the report read as a different one.
- **Amounts are dollars.** The report's cells hold dollars and show them as $M through a number format (`$#,##0.000,,`), so the
  header's "($M)" describes the display, not the value. A number cell is read as dollars, to the cent (`Math.round(v*100)`).
  - A text amount that `parseAmount` reads as zero (`$0.000`, the report's own zero) is 0, and counted as a conversion.
  - Any other text amount makes the row **unreadable** (its unit cannot be known): kept, named in the report, counted nowhere.
  - **A report whose every non-zero amount is under $100,000** is refused: real budgets of that size would mean the figures were
    exported in $M, and reading them as dollars would understate every figure a millionfold. The message says so.
- **FY** is read as the pull's FY is (§3). A row whose FY or either amount cannot be read is unreadable.
- **The report's own total row** is a row with no Budget Name and no FY that holds amounts, after the last budget row. It is
  never counted. Its figures are checked against the sum of the readable rows (to within $1 each, since it is a sum of
  floating-point dollars) and the Import report says *agrees* or by how much it differs. Any other row with no Budget Name is
  unreadable. Rows blank in all four required columns are skipped and counted.
- **The report's date** is read from its file name when it ends `_YYYY-MM-DD_HHMMSS` (`…2026-01-31_120000.xlsx` →
  `2026-01-31 12:00`), else none; the import time is kept too.
- `SP.parseFiles` returns `{pulls, bae, report}`; `bae` is `null` or
  `{headers:[...], cols:[the four headers read], rows:[{c:[name, fy, approvedCents, authorizedCents], x:{header: value},
  src:[fileIndex, sheet, rowNo], bad?:[...]}], file, sheet, stamp:'YYYY-MM-DD HH:MM'|null, total:{approved, authorized,
  rowNo}|null}`. A stored report without `cols` (one saved by hand or another version) has its four found among its headers
  by the rule above, else by their names here (`SP.baeCols`), wherever a product reads them (review I4-7). The report's
  `bae` part lists the file and sheet, rows read and skipped, the conversions, the unreadable rows in full and the total check.
- **A report with no readable row** is refused by name; nothing changes.

### 14.2 What a budget row means (`40-engine.js`, `SP.baeDerive(row, settings)`)

Recomputed on every load, like `deriveRow`, so a rule fix applies to an old report:

- **`ap`** = `SP.apOfBudget(name)` (the §3 Budget rule; no sheet name is ever used for a report row).
- **`scope`**: `'flyaway'` when the name holds the word `Flyaway`; else `'noap'` when `ap` is null; else `'obbba'` when the row
  is FY2025 OBBBA funding (§15); else `'in'`.
- **`svc`** and **`lane`**: the budget table's override for that name (`settings.budgets[normKey(name)]`, §3), else
  `SP.svcRule(name)` and `SP.laneRule(name)`, exactly as for a pull row. So the switches reach the report's figures, and an
  override set for a budget moves its pull rows and its report row together.
- **`pmo`** (the **budget's PMO**, `SP.budgetPmo(name, model)`): the last word of the trimmed name, compared without case
  against each PMO's code (§4.6: the text in a PMO label's parentheses) of `SP.PMO_ORDER` and of every PMO in the pull. A match
  is that PMO; anything else (`CAM`, `SUPT`, `Initial`, `CV`, `Non-PMO`) is `(no PMO)`.
- **Counts** when it is readable, `scope:'in'`, `fy >= firstFY`, and the switches show its service and lane (§4.3).
- Every **pull row** also gets `bpmo`, the budget's PMO of its Budget by the same function, for rule 7.

### 14.3 A block's figures with a report loaded (`40-engine.js`)

`SP.buildModel(pulls, settings, view, bae)`: `bae` is the loaded report (`SP.state.bae.current`) or null/absent. With none,
the model is exactly §4's (every field below takes its no-report value).

- **Blocks are still the pull's** (§4.6): every `(ap, fy)`, `fy >= firstFY`, with a row in the pull. A report never adds a block.
- A block is **covered** when the report holds at least one readable `scope:'in'` row for its `ap` and `fy`, whatever the
  switches.
- **`planned`** (new) = the sum of the block's counted rows: what `approved` was in §4.5.
- **`approved`** = covered ? the sum of the block's counting report rows' Approved : `planned`. **`approvedSrc`** = `'report'`
  or `'plan'`.
- **`authorized`**: entered (`settings.authorized`) → that, `authorizedSrc:'entered'`; else covered → the sum of the counting
  report rows' Authorized, `'report'`; else `approved`, `'approved'`. `authorizedEntered` stays (true iff entered).
- **`obligated`** is unchanged (§4.5). **`unobligated`** = `approved − obligated`. **`oblPct`** = `obligated / approved` (null
  when approved is 0); `goal`, `delta`, `status` as §4.5, on that `oblPct`.
- **The slide figures stay on the plan** (rule 6). Every per-column figure is §4.5's with `planned` where it says approved:
  `obl[c].v` divides by `planned`; and `slide = {basis: planned, oblPct: obligated/planned|null, goal, delta, status}` is
  what a slide block's and a totals band's **Total column** prints (Obligation %, OSD Goal %, OSD Status). With no report,
  `slide.oblPct === oblPct` and nothing on a slide moves.
- **`planShort`** (new, rule 5) = covered and `approved > 0` and `planned < approved / 2`.
- **`offReport`** (review M4-6) = on a covered block, its counted pull rows whose Budget the report's Approved can never hold,
  since no report row of that name counts (§14.2): no Budget at all (`'blank'`), the word `Flyaway` (`'flyaway'`), or a name
  `SP.apOfBudget` places nowhere, the pull having placed the row by its sheet (`'noap'`). `{planned, obligated, budgets:[{key,
  name, kind, rows, planned, obligated}]}`: one entry per budget (`normKey`; every row with no Budget is one entry), first
  spelling, in row order, an entry with no money left out; `null` when there is none, and on a block the report does not
  cover (its Approved is its plan). Nothing moves: `planned` and `obligated` keep these rows (§4.5), Approved never holds them.
  They are named (§14.5), because otherwise Obl % reads, say, 280% *On track* with no word that its numerator holds production
  money its denominator leaves out.
- **Totals** (`aps[].total`, `summary.total`) add `approved`, `planned`, `authorized`, `obligated`, `unobligated`; `oblPct` =
  obligated / approved.

### 14.4 PMO rows with a report loaded (rules 4 and 7)

For a covered block, a PMO's stoplight row (`pmos[].rows`, the PMO tab's table) is **the budgets' figures for that PMO**:

- `approved` and `authorized` = the counting report rows of that block whose budget's PMO is this PMO;
- `obligated` = the block's counted `exec` rows whose **`bpmo`** is this PMO (not their PMO column); `offObligated` (review
  M4-6) = the part of it on budgets the report's Approved can never hold (§14.3 `offReport`), 0 when none or not covered;
- `unobligated`, `oblPct`, `goal`, `delta`, `status` as for a block; `basis:'budget'`.

For a block the report does not cover (or with no report), the row is §4.6's: Approved = that PMO's planned rows by their PMO
column, Obligated by the PMO column, Authorized = Approved (`†`); `basis:'row'`.

- A typed Authorized is for the appropriation and FY as a whole and is never split to PMOs: PMO rows of a covered block keep
  the report's figure, and the PMO tab says so under its table when any such block is shown.
- **Which PMOs have a row in a block:** every PMO with a pull row in it, and, for a covered block, every PMO with a counting
  report row or an `exec` row by `bpmo` in it. `(no PMO)` is a PMO like any other. A PMO tab exists for every PMO with a row.
- The PMO tab's detail below its table (each block's tree and totals band) is unchanged: rows by their PMO column, on the plan.
  Its strip (§8.6 item 3) prints the stoplight row's figures for that block, each with the mark that row carries (§14.5: §
  and † on a block the report does not cover), on the screen and in the workbook alike (`SP.pmoStrip`; review M4-5, P4-5: the
  screen printed the figures with no mark). With a report loaded, the tab says under its table:
  *Approved, Authorized and Obligated count the budgets whose name ends in this PMO's code ({code}); the detail below lists
  rows by their own PMO.* `(no PMO)` has no code (§4.6 would read `no PMO` out of its label, which no budget ends in), so it
  says instead what its row counts, §14.2's *anything else* (review M4-3): *Approved, Authorized and Obligated count the
  budgets whose name does not end in any PMO's code, which no other PMO's tab counts; the detail below lists rows by their
  own PMO.*
- Where a row on the budgets has `offObligated`, the tab also says, after that sentence: *Obligated includes money executed
  on budgets the BAE report's Approved leaves out (Flyaway (production), a budget that names no appropriation, or no Budget at
  all): {Appropriation FYyyyy $X.XXM; …}. Obl % there counts it against an Approved that does not.* (review M4-6)
- **One source for the lines under a PMO tab's table** (integration): `SP.pmoTabLines(pmo, model)` gives them, in order, to the
  screen and the workbook alike. With no report it is §8.6's one note. With one it is `SP.pmoTabNotes`' lines (the sentence
  above, and the typed-Authorized line), then §8.6's note narrowed to the rows it is still true of, *Authorized is entered by
  appropriation and FY; where the BAE report has no figure for a block, its PMO row shows Approved.*, only when the tab
  shows such a row.

### 14.5 Marks, labels and notes

- **`§` on Approved** (new): *Approved is the CCaR plan: the BAE report has no figure for this block.* Only with a report loaded,
  on a block (or a PMO row of a block) the report does not cover. A TOTAL carries it when a row does (`SP.authMarks` grows a
  third flag, `sect`).
- **`†`** now reads: *Authorized was neither entered nor in the BAE report; Approved is shown in its place (on a total, for the
  rows marked †).* (With no report loaded, the old words.) **`‡`** is only ever on an entered figure, and with a report
  loaded it is on **every** entered figure, whatever the switches (answer 8: *marked as entered*; review I4-4): line 2 says
  Authorized is the report's, so an entered figure left unmarked with every switch on read as the report's. Its words with a
  report: *Authorized as entered, for the appropriation and FY as a whole: it is used in place of the BAE report's figure,
  where the report has one, and covers every service and lane, whatever the switches show.* With no report, §8's rule and
  words. A report figure follows the switches exactly and is never marked.
- **The Summary's line 2** with a report loaded: `Data through {Mon}-{YYYY} | Approved, Authorized = BAE report of
  {stamp or import day} (sustainment budgets) | Obligated = CCaR status "Actual Execution" | Unobligated = Approved -
  Obligated | Delta = Obl% - OSD%`. With none, §8.1's.
- **`SP.oblLabel`** reads `Obligation %  (CCaR plan X; …)` on a covered block and `Obligation %  (Approved X; …)` otherwise, X
  being `planned` in both (a slide block measures the plan).
- **The Summary's notes** add, each only when it applies:
  - the report: its date, the budgets counted, and those left out by kind (Flyaway, naming no appropriation, unreadable), with
    the total-row check;
  - each `planShort` block: *O&M FY2025: the CCaR plan ($12.34M) is 4% of the BAE report's Approved ($345.67M); Obl % is
    measured against the report's figure.* The percent is rounded to a whole one, as the example rounds 3.57%, except that a
    block flagged as under half is never said to be 50% of it: a plan from 49.5% up to half reads *under 50%*
    (`SP.planShortPct`, used by the Import report's line for the block too; review P4-9);
  - each block with an `offReport` (review M4-6): *Full Fund FY2026: the CCaR plan counts $105.75M on 1 Flyaway (production)
    budget, 1 budget that names no appropriation and 2 rows with no Budget, which the BAE report's Approved leaves out;
    $102.70M of it is obligated, so Obligated and Obl % count money that Approved does not. See the Import report.* (with
    nothing obligated: *…leaves out, so the plan counts money that Approved does not. See the Import report.*);
  - each `(ap, fy)` with `firstFY <= fy <= E` the report holds counting money for and the pull has no block: named with its
    Approved and Authorized (no block is added: §14.3);
  - the blocks the report does not cover (`§`).
  - The note *Unprogrammed money is counted in Approved* reads *in the CCaR plan* on a covered block.
- `model.bae` (new): `{present, file, stamp, importedAt, rows:{in, flyaway, noap, bad}, cents:{approved, authorized} (in
  scope, every FY, no switches), total:{ok, diff}|null, uncovered:[{ap, fy}], noBlock:[{ap, fy, approved, authorized}],
  planShort:[{ap, fy, planned, approved}], pullOnly:[budget names counted in the pull, of an in-scope appropriation, with no
  report row], reportOnly:[in-scope budget names with non-zero money for firstFY..E and no pull row], offReport:[{ap, fy,
  planned, obligated, budgets}] (§14.3, each block that has one, in model order)}`, names compared by `normKey`.

### 14.6 The products

- **Summary, appropriation sheets, PMO tabs, the screens:** the figures of §14.3–14.4, the marks of §14.5, a line for each mark
  used. The slide blocks, the trees' totals bands and the pictures are on the plan (only the label word changes).
  - An appropriation's title (§8.3), on its view and its sheet alike (`SP.apTitle`), names the report beside the pull:
    `F-35 Sustainment {Ap} - Spend Plan & FY Summary (from the CCaR pull imported {YYYY-MM-DD} and the BAE report {of})`, `{of}`
    being `model.bae.of` (*of {stamp or import day}*). Its table is the report's figures, and "from the CCaR pull" alone sat
    over a table that disagreed with the pull's own Monthly Totals with nothing to say why (review BP4-1, P4-6). A view with
    no table (no block for that appropriation) names no report.
  - The Slide blocks view and the `Slide Snapshots` sheet (a line under line 3) say once, in the same words
    (`SP.SLIDES_PLAN_NOTE`), that the blocks measure the CCaR plan while the Summary's Approved is the report's (review P4-6).
- **`BAE Report` sheet** (new, after `OPN Raw Data`): every row of the report in file order, every column as the file has
  them, amounts in dollars (`#,##0.00`), then *Appropriation*, *Service*, *Lane*, *PMO* and *Counted* (*Yes*, or why not:
  *Flyaway (production)*, *Names no appropriation*, *Before the first FY*, *Could not be read*, *Switch off*). Freeze row 1.
- **`Import Report` sheet and view:** a BAE section: file, sheet, stamp, rows read and skipped, conversions, unreadable rows,
  the total check, rows by scope, in-scope Approved and Authorized by appropriation and FY, the budgets of the pull with no
  report row, the report's in-scope budgets with money and no pull row, and last (review M4-6) *Budgets the CCaR pull counts
  on a block the BAE report covers, which its Approved leaves out*: each `offReport` budget with its block, its kind
  (*Flyaway (production)*, *Names no appropriation*, *No Budget*), its plan and its obligations, or *none*.
  - Three of those take the switches (§14.8): the `planShort` blocks, the pull's budgets with no report row and the
    `offReport` budgets. When the switches hide something each says so where it is (review P4-4, §4.3): on the sheet its line
    reads *…, with the switches as they are ({shown text}): N.*; on the view a note under each list, the remark beside a
    flagged block in the table by appropriation and FY reads *(with the switches as they are, the CCaR plan is under half the
    block's Approved)*, and the heading of §9 adds *, except the BAE report's lists that say they are counted with the
    switches as they are*. Under that heading the view had said it covered every row while a switch moved its flags.
  - With no pull on screen (*No data yet*, §9) no view is drawn, yet the import's message sends the reader to the Import
    report: that panel then draws the report's own lines (file, rows, conversions, unreadable rows, the total check) under
    *Import report* (review I4-5, BP4-7).
- **`Settings` sheet and view:** the report (file, date, imported), and the Authorized table as *Block, Typed, BAE report,
  Used*: typing a figure sets the block's override; blank clears it back to the report's. *Used* carries the mark every
  table prints beside that Authorized (`SP.authMark`: ‡ typed, † Approved standing in; never §, the table has no Approved
  column), with a line for each mark used under the table, on the view and on the sheet (review P4-7: the sheet printed it
  plain under a note that promised marks). The sheet's switches heading adds, with a report, *and what the Summary's note and
  the Import Report say of the BAE report as a whole* to what covers every service and lane (review P4-8).
- **What changed:** when a report replaced another, a section *BAE report: {old} → {new}* with Approved and Authorized before
  and after per `(ap, fy)` (in scope, every row, no switches) and the budgets new, gone and changed, largest change first
  (`SP.diffBae(prev, cur, settings)`). A row that could not be read counts in no figure but keeps its budget in its report,
  so it never makes one new or gone; as a pull's lines are (§4.6, review M1), a budget with such a row on either side is in
  none of the three lists but **listed apart** (`budgetsUnread`, with `unread: [before, after]` row counts) when it is in one
  report only, its figures moved or its count of such rows did, and the section says how many in-scope rows each report
  could not read (`unread: [before, after]`). Listed as changed, a budget whose one Authorized cell turned to text read as cut
  to $0, its readable Approved included (review I4-3).
  - **A pull's own section** (§9) compares the pulls (`SP.diffPulls`: every row, no switches), so its figure is the CCaR plan.
    With a report loaded it is **named so**: the All FYs row reads *CCaR plan*, the FY columns *CCaR plan before* and *CCaR
    plan after*, and the view says once, above the sections: *A BAE report is loaded, so Approved on the other views is the BAE
    report’s (the CCaR plan only on a block the report has no figure for, marked §). Each pull’s section below compares the two
    pulls themselves, every row whatever the switches, so its figures are the CCaR plan, and are named so. What changed in the
    BAE report is in its own section at the end.* Headed *Approved*, O&M FY2026 read the plan (423.70) under the word the
    Summary and the BAE section print as the report's (520.28), one word for two figures (review P4-2). With no report the
    words are §9's, unchanged.

### 14.7 State and saving (`80-store.js`)

- `SP.state.bae = {current: Bae|null, previous: Bae|null}` (Bae = `parseFiles`' `bae` plus `importedAt`). A file saved before
  this section has none and opens as `{current:null, previous:null}`; the opening check reads its shape when present.
- **An import with a report** replaces the current report whole (it covers every appropriation); the replaced one becomes
  `previous`. One identical row for row keeps `previous` and records `sameSince`, as a pull does. It **asks first** when the new
  report has fewer than half the readable rows of the one on screen. It never touches a pull, and an import holding only a
  report leaves `asOf` alone. The history entry records it (`bae:{rows, approved, authorized}`), and What changed's list of
  imports names it (*BAE report*).
- The message line names the report, its date and **the rows counted**, and is a warning when rows could not be read: counted
  as §14.2 counts them, under the page's First FY (on a page with no settings yet, the one a first pull gives it) and the
  switches, by the model's own judgement of each row (`SP.baeTally`), then the rest by why (Flyaway, naming no appropriation,
  before the First FY, switched off, could not be read). It names no dollar figure: the readable rows' money over the whole
  report, Flyaway, RDT&E and years before First FY included, matched nothing a table shows (review I4-6).

### 14.8 Tests

- The fixture writes a synthetic `bae.xlsx` (and `gen2/bae.xlsx`) shaped like the real report (its 28 headers, amounts in dollars
  with the `$#,##0.000,,` format, `$0.000` text zeros, a total row), covering: budgets the fixture's pull uses; Flyaway rows;
  names that place no appropriation; a budget the pull does not use, with money; a pull budget the report lacks; every
  service and both lanes; a budget whose PMO code differs from its rows' PMO column; a budget with no PMO code; a block the
  report does not cover; an `(ap, fy)` with report money and no block; an unreadable amount; a planShort block.
- The oracle computes §14.2–14.5 from the fixture alone, for the scenarios `bae-all`, `bae-usaf-off`, `bae-mand-only`,
  `bae-entered` (a typed Authorized on a covered block, switches off on another run) and `bae-gen2` (with `diffBae`). Every
  existing scenario keeps its exact expected output.
- **The scenarios**, each importing `pull-all.xlsx` with `bae.xlsx` (a report is known by its headers, never its name), asOf
  `2026-10`, firstFY 2025, unless said: `bae-all`; `bae-usaf-off` (USAF off); `bae-mand-only`; `bae-entered` (Authorized typed
  for `om|2026`, covered, and `sp|2025`, not covered: `{"om|2026": 39876543210, "sp|2025": 8000000000}`); `bae-entered-off`
  (the same, with USN (USN CV) off); `bae-asof-2027-10` (E = 2028: every appropriation's pull ends at FY2027, so only here does
  the report hold money for an `(ap, fy)` with no block); `bae-gen2` (that import, then `gen2/pull-om.xlsx`, `gen2/pull-ff.csv`
  and `gen2/bae.xlsx`). `input.authorized` records the typed figures.
- **What a report adds to expected.json** (only when one is loaded; `c` integer cents, `x` a ratio). Every §12 key stays, and:

```json
{ "blocks": { "om|2026": { "planned":c, "approved":c, "approvedSrc":"report"|"plan", "covered":bool,
      "authorized":c, "authorizedSrc":"entered"|"report"|"approved", "authorizedEntered":bool,
      "unobligated":c, "oblPct":x|null, "delta":x|null, "status":…,          // on the report's Approved (§14.3)
      "slide":{"basis":c, "oblPct":x|null, "goal":x|null, "delta":x|null, "status":…},   // on the plan, as §12's were
      "planShort":bool, "marks":{"sect":bool, "dagger":bool, "ddagger":bool},
      "…": "cols, cum, obl, goalC, statusC, pmos, titles, pes, ccars and na are §12's, on the plan, unchanged" } },
  "pmoTabs": {"<PMO label>": {"om|2026": {"approved":c, "authorized":c, "obligated":c, "unobligated":c, "oblPct":x|null,
      "goal":x|null, "delta":x|null, "status":…, "basis":"budget"|"row", "sect":bool, "offObligated":c,
      "planned":c, "unprog":c, "execAfterAsOf":c, "cols":{…}, "na":[…]}}},     // the last five: the detail, by the PMO column
  "aps": {"om": {"approved":c, "planned":c, "authorized":c, "obligated":c, "unobligated":c, "oblPct":x|null, "marks":{…}}},
  "summary": {"…the same…", "unprog":c},
  "bae": { "present":true, "file", "sheet", "stamp":"YYYY-MM-DD HH:MM"|null, "headerRow":n,
      "rows":{"in":n, "flyaway":n, "noap":n, "bad":n}, "skipped":n, "conversions":{"approved":n, "authorized":n},
      "cents":{"approved":c, "authorized":c}, "byBlock":{"om|2026":{"approved":c, "authorized":c}},
      "total":{"ok":bool, "diff":{"approved":c, "authorized":c}}|null, "totalRow":{"approved":c, "authorized":c, "rowNo":n}|null,
      "uncovered":[{"ap","fy"}], "noBlock":[{"ap","fy","approved":c,"authorized":c}], "planShort":[{"ap","fy","planned":c,"approved":c}],
      "pullOnly":[normKey], "reportOnly":[normKey], "unreadable":[{"rowNo","name","bad":[…]}],
      "offReport":[{"ap","fy","planned":c,"obligated":c,"budgets":[{"key","name","kind","rows":n,"planned":c,"obligated":c}]}],
      "counted":[[rowNo, "Yes"|"<why not, §14.6>"]],
      "budgets":{"<normKey>":{"name","ap","scope","svc","lane","pmo":"<PMO label>"}}, "pullBudgetPmo":{"<normKey>":"<PMO label>"} },
  "diffBae": { "byBlock":{"om|2026":{"approved":[before, after], "authorized":[before, after]}},   // bae-gen2 only
      "unread":[before, after],
      "budgetsNew"|"budgetsGone"|"budgetsChanged":[{"key", "name", "size":c, "approved":[b, a], "authorized":[b, a],
      "byFy":{"2026":{"approved":[b, a], "authorized":[b, a]}}}],
      "budgetsUnread":[{"…the same…", "unread":[b, a]}] } }
```

  - `byBlock`, `cents`, `rows`, `reportOnly` and `diffBae` take no switches; `noBlock`, `planShort`, `pullOnly`, `offReport`
    and `counted` do.
  - `total.diff` is the total row less the readable rows. `rowNo` is the sheet's row. Lists keep model order: appropriations
    as `SP.APS`, then FY. `pullOnly` and `reportOnly` hold sorted `normKey`s. Each `diffBae` list is largest `size` first.
  - Where §14 leaves a choice, the oracle's reading is marked `READING:` in `oracle.py`.
- A check must be able to fail (§12), and every new check is shown failing on the code before it.

## 15. FY2025 OBBBA funding is left out (Brad, 11 Nov 2026)

Shown that O&M FY2025 read *Behind* at about 1.5% against the BAE report's Approved, because the real pull's O&M FY2025 holds
nothing but OBBBA budgets, Brad answered: *"Just leave FY25 OBBBA funding out. Although it's active technically, it's not a
reporting year."* This replaces his 9 Nov answer on OBBBA. It holds with or without a BAE report.

### 15.1 The rule

- A row is **FY2025 OBBBA funding** when its budget name (a pull row's `Budget`, a report row's `Budget Name`) holds the word
  `OBBBA` as a whole word, in any case (`/\bOBBBA\b/i`), **and** its FY is 2025 (`SP.OBBBA_FY = 2025`). One predicate,
  `SP.isObbba25(name, fy)`, used by every reader; nothing else spells the rule.
- An OBBBA budget of any other FY is an ordinary row. A name where `OBBBA` is part of a longer word (`NOBBBAX`) is ordinary.
- It is a **fixed rule, not a setting**. It is stated in Help and the README always, and in Settings (view and sheet), the
  Summary's notes and the Import report whenever a row it leaves out is loaded.
- **With no FY2025 OBBBA row loaded, nothing changes**: every model, view and sheet is byte-identical to the build before §15
  (Help and the README excepted, which state the rule). Every existing scenario keeps its exact expected output.

### 15.2 Pull rows

- **§4.3's condition 4.** It is checked after condition 3, so a row before First FY (First FY 2026, say) is *before the First
  FY*, not OBBBA: each row is set aside for the first condition it fails, in §4.3's order.
- **Treated as a row before First FY is.** It counts in no figure, block, tree, column, slide block, picture, Not Allocated
  item, PMO row or PMO tab, whatever the switches show. It **names no block**: an `(ap, fy)` whose only rows are FY2025 OBBBA
  funding has no block, as one before First FY has none. An unreadable row whose FY reads 2025 and whose Budget names OBBBA
  names no block either (§4.6 lets an unreadable row name its block; this one would be left out if it read). Wherever rows
  before First FY still appear, these appear too, unchanged: the raw data sheets (every row), and `SP.diffPulls`, which
  compares the pulls themselves.
- **The model** carries them as `M.excluded.obbba = {rows, cents, obligated, blocks:[{ap, fy, rows, cents, obligated}],
  budgets:[{key, name, ap, rows, cents, obligated}]}`, whatever the switches. `cents` is the sum of their amounts (the plan they
  would have added), `obligated` the part whose status is Actual Execution (§4.5's rule). `blocks` is in model order;
  `budgets` one per budget (`normKey`), first spelling, in row order. With none it is `{rows:0, cents:0, obligated:0, blocks:[],
  budgets:[]}`.
- They take no part in §14's lists: a budget whose only counted rows were FY2025 OBBBA funding is not in `pullOnly` and has no
  `offReport` entry.

### 15.3 Report rows

- `SP.baeDerive` gives such a row `scope:'obbba'` (§14.2): after `'flyaway'` and `'noap'`, before `'in'`. It never counts and
  never makes a block *covered*.
- Its reason (`eng_baeWhyKey`, `ENG_BAE_WHY`) comes after *Before the first FY* and before *Switch off*: `obbba:'FY2025 OBBBA
  funding (not a reporting year)'`. `model.bae.rows` and `SP.baeTally` gain `obbba`. `SP.diffBae` (in-scope rows) leaves these
  rows out, as it leaves Flyaway out.
- **`noBlock`.** An `(ap, fy)` the report holds counting money for, whose pull rows were **all** FY2025 OBBBA funding (so it
  would have had a block), carries `obbba:true`. Its money is still not shown. The words below say why.

### 15.4 Words, on screen and in the workbook alike

- **The Summary's notes** (after the note on money before First FY), when any pull row is left out: *FY2025 OBBBA funding is left
  out of every figure: it is not a reporting year. The CCaR pull holds {n rows} of it on {n budgets} ({Ap FY, …}), {$plan}
  planned, {$obligated} of it obligated. See the Import report.*, with the same closing sentence the note on money before
  First FY takes when a switch is off (it counts every service and lane).
- **A `noBlock` entry with `obbba`**, in place of the ordinary words: *O&M FY2025 has no block: its only CCaR pull rows are
  FY2025 OBBBA funding, which is left out. The BAE report's {$approved} Approved and {$authorized} Authorized for it are not
  shown.*
- **The report's own note** (§14.5, *those left out by kind*) and **the import message** (§14.7, *not counted: …*) add *{n}
  FY2025 OBBBA*.
- **The Import report** (view and sheet): a section *FY2025 OBBBA funding, left out (not a reporting year)*, shown when any is
  loaded: each pull budget with its appropriation, rows, plan and obligated, a total, and the report's rows of it (rows,
  Approved, Authorized). The BAE section's table by appropriation and FY says, for an `obbba` noBlock row: *FY2025 OBBBA funding
  is left out (not a reporting year), so no block is shown*. Its rows by scope count `FY2025 OBBBA`.
- **Counted columns.** A raw data sheet's row: *No: FY2025 OBBBA funding (not a reporting year)*. The `BAE Report` sheet:
  *FY2025 OBBBA funding (not a reporting year)*.
- **Settings** (view and sheet), when any is loaded, a line under First FY: *FY2025 OBBBA funding is left out of every figure: it
  is not a reporting year (Brad, 11 Nov 2026).*
- **Help and the README** state the rule where they state First FY.

### 15.5 Tests

- The fixture writes `obbba/` (its own random stream, after everything else is written, so not one existing byte moves):
  - `obbba/pull-om.xlsx`, O&M rows: FY2025 holding **only** OBBBA rows (the block must vanish), FY2026 with ordinary rows and one
    OBBBA FY2026 budget (it counts), an OBBBA FY2025 row with an unreadable amount, a name with `obbba` in lower case, and one
    with `OBBBA` inside a longer word;
  - `obbba/pull-ff.csv`, Full Fund FY2025 mixing ordinary and OBBBA rows (the block stays, less them), with exec and non-exec
    statuses and two services;
  - `obbba/bae.xlsx`, a report with OBBBA FY2025 rows, an OBBBA FY2026 row, ordinary O&M FY2025 rows (the `obbba` noBlock), and
    ordinary rows covering the blocks that remain;
  - every name and figure invented. Nothing from the real files, whose OBBBA budgets are the real names.
- Oracle scenarios, each asOf `2026-10`, firstFY 2025 unless said: `obbba` (the two pulls), `obbba-usaf-off`, `obbba-first-2026`
  (every OBBBA FY2025 row is before First FY instead), `bae-obbba` (the pulls with the report). Expected output adds
  `excluded.obbba`, `bae.rows.obbba`, `noBlock[].obbba` and the Counted reasons.
- Every product is checked against the oracle on those scenarios, and every existing scenario byte for byte. Each new check is
  shown failing on the code before it.
- The real-file proof (scratch only): with no report (asOf `2026-04`, firstFY 2024), every block equals the v12 proof's except
  O&M FY2025, which is gone, and the TOTAL is down by exactly that block's Approved and Obligated. With the report, O&M FY2025 is
  gone and named by the `obbba` noBlock note.
