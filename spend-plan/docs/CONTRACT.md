# SFCB Spend Plan dashboard: the build contract

Brad asked on 9 Nov 2026 for the *SFCB FY26 Spend Plan Workbook v12* to become an active dashboard. He imports raw CCaR data,
and the dashboard produces all the same products. His answers, given that day:

- **A separate tool, not part of ORBIT.**
- **The data:** "The data in the four last tabs will be the exact type of data pulled in. The report looks just like that."
- **Years:** "FY25 is the first year."
- **The Excel export:** "Values are good enough."
- **OBBBA:** "Don't worry about OBBBA. I don't have any this year."
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

**`await SP.parseFiles(files)`**, where `files` is `[{name, data: ArrayBuffer | string}]`. A name ending `.csv` is read as CSV;
anything else as .xlsx. It returns `{pulls, report}`.

- **Header row.** In every sheet, find the header row: the first row, within the first 15, that holds every one of
  `SP.REQUIRED` by name. Names are compared with `normKey`, and `'PMT PID#'` matches `'pmt pid#'`.
  - A sheet with no such row is listed as *ignored*, with its name and why. The v12 workbook's 14 report tabs land here.
  - Columns are found **by header name**, never by position. A header the tool does not know is kept as an extra column under its
    own name.
  - `Svc (auto)` and `Inc (auto)` are v12's formula columns: they are ignored and noted.
  - A file with no usable sheet at all is refused by name. If no file in the import has a usable sheet, nothing changes.
- **Rows.** Every row below the header is a data row unless every one of the 32 known columns is blank. Those are skipped and
  counted; v12 fills formula rows to row 2600. Each data row is typed:
  - **FY**: a whole number 1990–2100, or text (`'2026'`, `'FY26'`, `'FY2026'`) read as the year. Anything else is *unreadable*.
  - **Month, Date**: an Excel serial (using `date1904`), a date cell, or text (`YYYY-MM-DD`, `M/D/YYYY`, `D Mon YYYY`, `Mon-YYYY`
    as the first of the month). The result is ISO or `''`. A Date that cannot be read is *unreadable*: the row keeps it as `''`
    and is placed in the No-date column (§4.2).
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
  holds, so a single misfiled row is easy to find. A file given twice (identical bytes) is refused the same way. A sheet holding
  rows of several appropriations, such as a combined export, is fine as long as no other sheet holds any of them.
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
3. `fy >= firstFY`; and
4. the switches show both its service and its lane.

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
- the PMO of a CCaR that changed;
- leaf keys (`ap|fy|pmo|title|pe|ccar` in `normKey`s) new, gone and changed, each with dollars, largest change first.

It uses every row, not the switches.

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

**The Authorized marks.** A figure is marked with a number format, so the cell is still the number: `†` when Authorized was
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

- **Title:** `F-35 Sustainment {Ap} - Spend Plan & FY Summary (from the CCaR pull imported {YYYY-MM-DD})`.
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
  day CCaR made it;
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
- **Import report**.
- **What changed** (`diffPulls`), or "Only one pull so far". Each appropriation's section is named by its two pulls; where the
  current pull repeats an earlier one row for row (`sameSince`), it is named by that earlier pull, and says the newest import
  changed nothing. Its list of imports names an import that placed no row as such, never as an empty line.
- **Settings**: the goal table (editable, with *Reset to v12's curves*), Authorized by block ($M, typed through `parseAmount`, and
  blank clears), the special CCaRs, and the budget table with service and lane override selects.

**Behaviour:**

- Every number is `fmtM` / `fmtPct`. Status shows its colour **and** its word.
- Every view states `model.shown.text` when not everything is shown.
- **All text from a pull is escaped** (`SP.esc`) wherever it reaches markup. A plan event may be `"><img src=x onerror=…>` or
  contain `</script>`. No inline handler ever carries a value from the data; use event delegation with `data-` attributes.
- A change to a switch, as-of, first FY or a setting rebuilds the model and redraws. Settings changes mark the file unsaved;
  switch changes do not, because they are this browser's view.
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
  - appropriations not in the import keep theirs and say from when;
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
