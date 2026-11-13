# APEX

Appropriation Planning & Execution. In November 2026 this tool was first called the SFCB Spend Plan, then SCOPE.
Its logo is in ORBIT's style, a ring and a satellite, with a T-Rex inside the ring; `assets/apex-logo.svg`,
`assets/apex-wordmark.svg` and `assets/apex-mark.svg` are for slides and documents.

CUI//REL TO US DoW applies to any copy that holds data.

## What it is

APEX replaces the *SFCB FY26 Spend Plan Workbook v12*. You import the CCaR pull. The tool draws every
product the workbook made: the Summary, the slide blocks, the four appropriation tabs, the PMO tabs and the Not Allocated
lists. **Export Excel** writes them all as a workbook of values.

It is one file: `apex.html` (`sfcb-spend-plan.html`, then `scope.html`, before the renames; a copy saved under the old name still opens and
saves, and its plan can be brought into the new file with **Import CCaR pull…**). It is separate from ORBIT. It needs no install, no network and no add-ins. The file
is also its own database: **Save** writes your data and settings into the file itself.

## Opening it

1. Put `apex.html` on the shared drive.
2. Open it in Edge or Chrome (double-click, or drag it onto the browser).
3. The first time, it says *No data yet*, and the **Manage data** bar is open. Import a pull.
4. A file that already holds a plan opens on **Find a requirement**, with Manage data closed. Click **Manage data**, top
   right, for Data through, First FY, Import and Save.

Save it under any name you like. Keep one copy per team or per purpose. Each copy holds its own data.

## Importing a CCaR pull

Press **Import CCaR pull…** and pick one or more files.

- **What to import.** Each file is a CCaR export laid out like v12's Raw Data tabs. An `.xlsx` or a `.csv` works.
  - A `.csv` may be UTF-8, Windows-1252 (Excel's plain CSV) or UTF-16 (Excel's *Unicode Text*, a reporting server's
    *CSV (Unicode)*), and must be separated by commas. One separated by tabs or semicolons is refused, saying so: save it
    from Excel as *CSV (Comma delimited)* or as an Excel Workbook (`.xlsx`). The tool does not guess a separator, because a
    file separated by semicolons may write `1.234,56` for `1,234.56`.
  - A file that is not a workbook or a CSV is named for what it is, with what to do: an old `.xls`, an **encrypted** workbook
    (a password, or a sensitivity label that encrypts: saving it again keeps the encryption, so import a copy that is not
    encrypted), a web page or web archive saved as `.xls`, a ZIP file holding a CSV, a workbook named `.csv`.
  - Import one file per appropriation, or one file holding all four. The old v12 workbook itself also imports: its four
    Raw Data tabs are read and its report tabs are skipped.
  - Columns are found by their header names, in any order. The header row may be anywhere in the first 15 rows.
  - Columns the tool does not know are kept, and appear in the raw data sheets of the export.
  - The export's raw data sheets import again. Their last *Service*, *Lane*, *Status* and *Counted* columns are the tool's
    own and are worked out again; a pull's own column of one of those names (CCaR's own *Status*, say) comes back with its
    values.
- **Where rows go.** Each row is placed in O&M, Full Fund, Initial Spares or OPN by its **Budget** name. If the budget
  does not say, the sheet name decides.
- **Before an import replaces an appropriation's data, the page may ask.** It asks when:
  - every row of one appropriation sits on a sheet named for another (say, the only Full Fund row is on the O&M tab, or
    in a file named `O&M.csv`): such a row is most likely misfiled. A name that also names the rows' own appropriation,
    such as `FF and OPN pull` for OPN rows, is not asked about;
  - or the new data has fewer than half the readable rows of the data on screen. A whole CCaR pull does not halve from one
    week to the next. One that does is a misfiled row (whatever its sheet is called), a file cut short, a pull filtered in
    CCaR, or a workbook whose Amounts are formulas saved without their results.

  **Cancel** changes nothing. For a misfiled row, correct its Budget, or take it out of the file and import again: its
  own appropriation's pull is imported whole, from its own file. Giving it a tab of its own in this file does not help:
  it would still replace that appropriation's whole pull. **OK** imports, and the message line says what to check.
- **What an import replaces.** Each appropriation in the import replaces that appropriation's data. The data it replaces
  is kept, so **What changed** can compare the two. Appropriations not in the import keep their data, and the top bar says
  when each was imported (the day it came into the page, which is not always the day CCaR made the pull; to the minute when
  two came in on one day, so you can tell the older from the newer).
- **A pull kept from before Data through ended.** Data through is one month for every appropriation. An appropriation whose
  pull was imported before that month ended (one kept from an earlier import) cannot hold all of it: its Obligation % lines
  say *actual through the 2026-10-05 import* instead of *actual through Oct*, on the screen, in the workbook and on the
  pictures, and the Summary's notes name it. Its goal and status are still read at Data through. Import a newer pull of it
  to bring it up to date. The same pull imported again changes nothing What changed compares: What changed still shows the
  change the earlier pull brought, and says the newest import changed nothing.
- **Rows whose appropriation is not identified** stay on screen while any pull from the same import is on screen. Once
  every pull that import brought has been replaced, they go. The message line says which.
- **The message line** says what was imported, and also any file that was refused, rows that could not be read, and rows
  whose Date could not be read (they sit in the **No date** column). A Month that cannot be read moves nothing: a row is
  placed by its Date, and the Import report lists the two apart. It shows as a warning when a file was refused, when
  the page asked before importing, or when rows count nowhere (rows that could not be read, or rows whose appropriation
  is not identified).
- **Data through** is reset to the last full month before the import, and the message line says so. Change it if you
  need to. An import that places no row in any appropriation leaves it alone.
- **Nothing is dropped quietly.** A row whose FY or Amount cannot be read is kept, counted in no figure, and listed in the
  **Import report**. So are text amounts (`$0.00`), amounts in parentheses, blank amounts, and trimmed spaces. An Amount
  that is a formula saved without its result (a workbook some program wrote and never calculated) cannot be read: open the
  file in Excel, save it, and import it again.
- **Moving a plan into a new copy of the tool.** Import the saved plan's `.html` file on its own. The page takes its pulls,
  the earlier pulls, the import history and the settings (Authorized, special CCaRs, goals, budget overrides), and works
  every figure out again by its own rules. **Save** to keep it.
- **When an import is refused, nothing changes.** For example, one appropriation's rows in two different sheets, or the
  same file given twice. The message names each sheet and how many rows it holds, so a misfiled row is easy to find, and
  names a hidden sheet as hidden (Excel does not show it: right-click a sheet tab and choose Unhide). Where one sheet holds
  only a few of an appropriation's rows, they are most likely misfiled: move them, or correct their Budget. Where two each
  hold a whole pull (last month's and this month's export, an old copy kept on a hidden sheet, one pull as `.xlsx` and as
  `.csv`), leave all but the newest out of the import: moving rows across would count them twice.

## The BAE report of budgets

The BAE report (*Report__BAE_ALL_Services_USAF_and_DoN_<date>.xlsx*) gives each budget's Approved and Authorized amount by
FY. Import it beside the CCaR pull to fill the stoplight tables with the budgets' figures.

- **Importing it.** Press **Import CCaR pull…** and pick the report, on its own or together with pull files. It is known by
  its column headings (*Budget Name*, *Budget FY Numeric*, *Budget Approved Amount*, *Budget Authorized Amount*), never by
  its name.
  - Its amounts are dollars (the report only shows them as $M).
  - A new report replaces the one on screen whole. The one it replaces is kept for **What changed**.
  - Importing a report never touches a pull, and a report imported on its own leaves **Data through** where it was.
  - The top bar names the report and its date (from the end of its file name, `…_2026-01-31_120000.xlsx`). A report whose
    name carries no date is known by the day you imported it.
  - The page asks first when the new report has fewer than half the readable rows of the one on screen.
  - The message says how many of the report's rows count (its sustainment budgets of the First FY or later, in the services
    and lanes shown, FY2025 O&M OBBBA funding left out) and why the others do not.
  - Imported before any pull, the report waits for one, and *No data yet* shows its import report: the rows that could not
    be read and the check against its own total row.
  - A workbook this tool exported can be imported again: its *BAE Report* sheet is read as the report, and the five columns
    the tool adds there (Appropriation, Service, Lane, PMO, Counted) are set aside and worked out again.
- **What it changes.**
  - **Approved** and **Authorized** in the Summary, the appropriation tables and the PMO tables are the report's, wherever
    it has figures for that appropriation and FY. Line 2 of the Summary says so, and each appropriation's title names the
    report beside the pull.
  - **Obl %**, **Unobligated** and **Status** are measured against that Approved.
  - The report's figures add up its **sustainment budgets**: every budget whose name places it in O&M, Full Fund, Initial
    Spares or OPN, except Full Fund **Flyaway** (aircraft production). Advance Procurement, Modifications, RDT&E and squadron
    budgets name no appropriation and are left out. The switches reach the report's budgets as they reach the pull's rows,
    and a service or lane you set for a budget in **Settings** moves its report rows too.
  - **A PMO's row is built from its plan events** (Brad, 11 Nov 2026): the rows whose PMO column names it, exactly the PMOs
    its block's tree shows; **(no PMO)** is the plan events with no PMO. Its Approved and Authorized are the report's figures
    for the budgets its plan events are assigned to, and its Obligated counts its plan events' executed rows, as the tree does.
    A budget's name no longer decides a PMO.
  - **A budget several PMOs use is split** among them by each one's CCaR plan on it in that block, in whole cents, so the
    shares add up to the report's figure exactly (the odd cents go to the largest remainders; a tie to the PMO listed first).
    A PMO whose plan on a budget is zero or below takes no share of it.
  - **Report money no plan event uses** (a budget no counted row names in that block, or one whose plan is not above zero
    for any PMO) is in the Summary's Approved and Authorized and on no PMO table. The Summary's notes say how much of each
    block's Approved and of its Authorized it is, so the PMO tables add up to the Summary less it; an Authorized you type is
    for its block as a whole and never shared among the PMOs, so there the note says the PMO tables' Authorized need not add
    up to the Summary's. Each PMO table says how much of the Approved on its blocks is on no PMO table. The Import report
    lists each such budget, with its Approved and Authorized, and why, and each
    budget split among PMOs with every PMO's plan and share. The workbook's *BAE Report* sheet says, in its PMO column, which
    PMOs share each counted row's budget and each one's share of the plan (`Air Vehicle (AV) 62.5%; …`), or *No plan event
    uses it*. The detail under each PMO table still lists its rows.
  - **Money the report can never hold.** The CCaR plan and Obligated count every row of the pull, while the report's Approved
    counts only its sustainment budgets. A row on a Flyaway budget, on a budget whose name places it in no appropriation (put
    in a block by the sheet it came on), or with no Budget at all is therefore counted on one side of Obl % only. Nothing is
    moved, but every such block is named in the Summary's notes, each budget in the Import report, and each PMO whose
    Obligated holds some says how much under its table.
- **What it does not change.** The slide blocks, the pictures and the totals band under every tree still measure the CCaR
  plan by month. Where the report covers a block, their Obligation % row says *CCaR plan* beside the plan's figure, so it is
  not mistaken for the Summary's Approved; the Slide blocks view and the workbook's Slide Snapshots sheet say so in the same
  words. A report never adds a block: the blocks are the pull's.
- **The marks.**
  - **§** on Approved: the report has no figure for this block, so its Approved is the CCaR plan.
  - **†** on Authorized: Authorized was neither entered nor in the report, so Approved stands in.
  - **‡** on Authorized: a figure you typed, used in place of the report's. It is marked whatever the switches show, and it
    covers every service and lane.
  - A total carries each mark its rows carry, and every table says under it what each of its marks means. The strip over
    each block of a PMO table prints that block's row with the same marks, on screen and in the workbook.
- **Authorized you type wins.** In **Settings**, the Authorized table reads *Block, Typed, BAE report, Used*. A figure typed
  for a block is used in place of the report's. Clear the box to go back to the report's figure (or to Approved where the
  report has none). The message names the block. A typed figure is for the appropriation and FY as a whole: a PMO row keeps
  the report's figure, and the PMO table says so. *Used* carries the mark every table prints beside it (‡ typed, † Approved
  standing in), on the Settings view and on the workbook's Settings sheet.
- **What the Summary's notes flag.** The report itself (its date, the budgets counted and those left out by kind, and
  whether its own total row agrees with its rows), each block the report has no figure for (§), each block whose CCaR plan
  is under half the report's Approved (flagged, never hidden; a plan just under half is said to be *under 50%*, never 50%),
  each block whose plan and Obligated count money the report's Approved leaves out (above), the report money no plan event
  uses (its Approved and its Authorized, on no PMO table, so the PMO tables add up to the Summary less it, a typed
  Authorized excepted), and any year the report holds money for that the pull has no rows for.
- **The Import report** says what the file held (rows read and skipped, conversions, rows that could not be read, the total
  row check), then how the figures read it: its rows by scope, its sustainment budgets' Approved and Authorized by
  appropriation and FY, the budgets the pull counts that the report has no row for, the report's budgets with money that
  no pull row names, the budgets a block the report covers counts that its Approved leaves out (Flyaway, naming no
  appropriation, or no Budget), each with its plan and its obligations, and last how the PMO tables share the report: the
  budgets split among PMOs by their plan events (each PMO's plan and its share of Approved and Authorized, largest first),
  and the report money no plan event uses, which is on no PMO table (each budget, its figures, and why: no plan event
  uses it in that block, or its plan events' plan is not above zero). Five of those lists are worked out on the blocks as
  the switches leave them (the flagged blocks, the pull's budgets with no report row, the money an Approved leaves out, and
  the two on the PMO tables): with a switch off, each says so, on screen and in the workbook, and a switch can flag a block
  or take its flag away.
- **What changed** compares a report with the one it replaced: Approved and Authorized before and after by appropriation and
  FY, then the budgets new, gone and changed, largest change first. A budget with a row that could not be read is listed apart,
  with how many such rows each report holds, so a row that stopped reading never shows as money cut to $0.
  Each pull's own section on that view compares the two pulls, so its figure is the CCaR plan, and with a report loaded it is
  named so (*CCaR plan before*, *CCaR plan after*), never Approved, which on the other views is the report's figure wherever the report has one.
- **The workbook** carries the same figures and marks, and a *BAE Report* sheet lists every row of the report with how it was
  read.
- **With no BAE report loaded, nothing changes**: every view, figure and sheet is as described in the rest of this guide.

## Reading the views

The views are in the menu down the left side (a row across the top in a narrow window), grouped: **Requirements**, **My PMO** and **Calendar** (the Award calendar); *Browse*
(By PMO and each appropriation); *Briefing* (Overview, Summary, Slide blocks); *Data checks* (Not Allocated, Import report,
What changed); *Set up* (Settings). The **Filter** button above a view says which services and lanes are shown; click it
for the switches.

- **Find a requirement** (Requirements) is where the page opens. Type part of a title, a CCaR number or a plan event, or
  pick a PMO, an appropriation or an FY. Each requirement shows Planned (its CCaR plan), Awarded (what CCaR marks Actual
  Execution), Still to award, and its **Projected award**: the earliest plan event date not yet awarded. *Was Aug 2026*
  means that month has closed and it is not awarded. Click a name to list its plan events by month.
- **My PMO** is one office: its Planned, Awarded and Still to award, what is projected to award in the three months after
  the Data through month, what is past its projected date and not awarded, then every requirement. The office you pick is
  remembered in your browser, not in the file.
- **Award calendar** lays the execution year out by month, by office. Each requirement's money sits in the month it is
  projected to award: awarded, projected, or not awarded and past its date. The Total row is the plan by month.

  A CCaR number listed under Settings, **Special CCaRs**, is one line at the top, with every fiscal year, appropriation and
  title it has added together; to roll another number up, add it there.
- **Overview** works out nothing of its own. Its tiles are the Summary's Approved, Authorized, Obligated and Unobligated
  for the fiscal year you pick at its top right (or **All**), added up as the Summary's TOTAL is, with the same marks.
  Its status counts are the Summary's rows. Each small chart is one slide block's Obligation % and OSD goal by month: an
  actual through the Data through month, the plan after. The charts are lined up: a row for each
  appropriation, a column for each fiscal year. A chart's name opens that appropriation.
- A row with no status is counted one of two ways: **with no Obligation %** (its Approved is zero for what is shown, so
  there is nothing to hold against its OSD goal) or **with no OSD goal** (its money is for a later year). A chart with
  nothing in Oct to Sep says so, and names the slide block's column its plan is in.
- With a BAE report loaded, the tiles and the status counts measure the report's Approved, as the Summary does, and each
  chart measures the CCaR plan, as its slide block does. One block can then show two Obligation % on the page; the chart
  card says so, and Approved by appropriation marks § where a figure is the CCaR plan.
- Printed, the Overview is dark ink on white with each chart's name, its colour keys and its status colours.
- The Overview is drawn in APEX's dark colours. Every other view is on a light sheet in v12's colours, so the screen
  matches the workbook and the slide pictures.

- **Summary.** One row per appropriation and FY. Approved, Authorized, Obligated, Unobligated, Obl %, OSD Goal %, Delta and
  Status. Then the TOTAL, the legend and the notes. The notes name anything left out of the figures. The TOTAL carries each
  mark its rows carry (†, ‡, and § with a BAE report loaded), and a line under the table says what each mark means, as the
  workbook does.
- **Slide blocks.** Each appropriation and FY as a slide block. It shows the PMO rows by month, then Monthly Totals,
  Cumulative Totals, Obligation %, OSD Goal % and OSD Status. Under each block is its Not Allocated list. Each block has
  **Copy picture** and **Save picture**.
- **O&M, Full Fund, Initial Spares, OPN.** The FY table, then each FY's tree: PMO, Title, Plan Event and CCaR. Press a row
  to open or close it. **Expand to** opens a whole block to one level. The CCaR row shows its number.
- **PMOs.** Pick a PMO. It shows that PMO in every appropriation and FY, with its own Not Allocated list.
- **Not Allocated.** Every item in one table. You can filter it by appropriation, FY and PMO. Filtered by a PMO, it shows
  that PMO's own items, the ones its PMO tab lists: where other PMOs share a plan event, only that PMO's rows count. A
  filter stays chosen when the switches leave it nothing to show (it says so, and its list comes back when they show it);
  **Clear filters** takes it off. The PMO picked on **PMOs** stays picked the same way.
- **Import report.** What the last import read, used, skipped and could not read; then any data on screen from earlier
  imports, with the rows in it that count nowhere. After a refused import, the refusal comes first, and the report below it
  is headed as the last import *taken*, before the one refused.
- **What changed.** The last pull against the one before it, for each appropriation imported twice: Approved and
  Obligated by FY (with a BAE report loaded, that Approved is named the CCaR plan: it is the pull's, not the report's), CCaRs
  new and gone, CCaRs that moved PMO, and every changed line, largest first. If the newest import
  of an appropriation was the same as the pull before it, row for row, the view says so, and shows the change the earlier
  pull brought.
  - A **line** is every row of one FY, PMO, Title, Plan Event and CCaR, added together. A row added to a line, or taken from
    one that stays, changes that line; it is not a new or gone line. So the counts are lines, not rows of the pull.
  - A line changes when its amount changes, when its money becomes obligated (Actual Execution) or stops being, or when its
    money moves to another month. Each changed line says which: for example *obligated 0.00 → 2.34*, or *1.88 moved from
    Jun-2026 to Sep-2026*.
  - A row that could not be read counts in no figure, but it is still in its pull: its CCaR and its line are never called
    new or gone because of it. The view says how many such rows each pull holds, and lists their lines apart.
  - A CCaR's PMO is the PMO most of its rows carry. Where two PMOs carry as many rows, it is the one that comes first in
    the PMO order (Air Vehicle, Business Operations, … Training Systems, then any other PMO by name, *(no PMO)* last),
    never the one whose row the pull happens to list first. So a pull that lists the same rows in another order moves no
    CCaR. A CCaR with rows under more than one PMO is said to have moved when a row added or taken away changes which
    PMO carries most of them.
- **Settings.** See below.
- **Help.** A short guide inside the page.

### The columns

Every block has the same columns:

- **Prior Yr:** money dated before the execution year.
- **Oct to Sep:** the execution year, month by month.
- **The next-year column** (for example **FY27+**): money dated after the execution year.
- **No date:** rows with no date. It shows only when there are some.
- **Total:** all of them added up.

Months up to **Data through** are actual. They have a light grey fill. Later months are the plan.

## The switches

The filter bar has a box for each service and one for each lane (Discretionary and Mandatory).

- **One set of switches drives everything:** every figure, every list, every view, the export and the pictures. Two
  things cover every service and lane whatever the switches show, and say so: an entered Authorized, which is typed for
  an appropriation and FY as a whole (marked ‡ while a switch is off, and always with a BAE report loaded), and the Summary's
  notes on rows not counted.
- When not everything is shown, each view, sheet and picture says what it shows. An export's file name ends in
  `[filtered]`. The Import report and What changed show every row whatever the switches, and say so.
- The switches belong to this browser, not to the file. Changing them does not mark the file unsaved.
- *Service not identified* appears only when a budget name matches no service rule. The **Settings** budget table lets you
  set its service. Once no row needs it, its box goes, and it no longer counts as a switch: nothing says *filtered*
  because of it. Rows with no service that count nowhere for another reason (before First FY, or unreadable) do not
  bring the box back; the workbook's Settings sheet counts them by reason, as the raw data sheets list them.

## Data through and First FY

- **Data through** is the last month whose data counts as actual. The execution year is the FY of that month. For
  example, Data through Oct-2026 makes the execution year FY2027.
  - It takes a month from January 1990 to December 2100. While you type a year, nothing changes until the year is whole.
    If you leave the box with a year not finished, or empty, it goes back to the month in use and the message line says so.
- **First FY** is the oldest money year shown. It starts at FY2025. Money for earlier years is counted nowhere, and the
  Summary's notes say how much there is.
- **A plan event of $0.00 is left out** (Brad, 13 Nov 2026): a CCaR pull row whose Amount is exactly zero is a placeholder.
  It is in no list, count, calendar or sheet, and no dollar figure moves. The Import report says how many there are.
- **O&M FY2025 is left out entirely** (Brad, 13 Nov 2026): none of its CCaR pull rows and none of the BAE report's rows
  for it is shown or counted on any view, in the workbook or in a picture. The files and the saved plan still hold them;
  the Import report says how many rows were left out, and nothing else names it. FY2025 of every other appropriation is
  unchanged. This covers the rule below, which now has no O&M FY2025 row left to act on.
- **FY2025 O&M OBBBA funding is left out** of every figure, block, list and picture, whatever the switches show (Brad, 11
  Nov 2026: *"Just leave FY25 OBBBA funding out. Although it's active technically, it's not a reporting year."*, and then
  *"Yes, leave out OBBBA funding for O&M but leave it in for Spares."*). A row is FY2025 O&M OBBBA funding when its
  appropriation is O&M, its FY is 2025, and it is marked OBBBA: the word OBBBA, in any case, is in its Budget (a BAE report
  row's Budget Name), or
  - for a BAE report row, in its *Budget Flex 02* column (found by its heading; the report marks most of its OBBBA money
    there). Budget Flex 01 and 03 are not read for it, and a report with no Budget Flex 02 column is read by its names alone.
  - for a CCaR pull row, while a BAE report is loaded, in the Budget Flex 02 of a report row of the same budget whose FY is
    2025 and whose appropriation is O&M, so the plan and the report leave out the same money. With no report loaded a pull
    row is judged by its own Budget alone.
  - It is a fixed rule, not a setting. OBBBA funding of every other appropriation (Initial Spares, Full Fund, OPN) counts
    like any other money. An OBBBA budget of any other FY counts like any row, and so does a name where OBBBA is only part
    of a longer word. The Import report lists the FY2025 OBBBA money outside O&M that counts (while First FY is 2025 or
    earlier): the CCaR pull's rows whose Budget holds the word, and the BAE report's rows whose Budget Name or Budget
    Flex 02 holds it. OBBBA money of any other FY is not listed.
  - It is treated as money before First FY is: an appropriation and FY whose only rows it is has no block, and under a
    First FY after 2025 such rows are before the First FY instead. An appropriation's view whose only rows from First FY on
    are this funding says so, rather than that the pull holds none.
  - When such rows are loaded, the Summary's notes say how much is left out, Settings states the rule under First FY, and
    the Import report lists each budget with its rows, plan and obligated dollars (naming those left out because the BAE
    report marks them), and the BAE report's rows of it, named OBBBA and marked in Budget Flex 02 only. The raw data sheets
    and the *BAE Report* sheet list every such row, with *FY2025 O&M OBBBA funding (not a reporting year)* as the reason it
    is not counted, adding *marked in Budget Flex 02* (a report row) or *marked in the BAE report's Budget Flex 02* (a pull
    row) where the row's own name does not hold the word. **What changed** compares the pulls row for row, these included,
    and says so when the pulls it compares hold any; it leaves them out of the BAE report's comparison as it leaves
    Flyaway out.

## Settings

Settings are saved in the file. Changing one marks the file unsaved. Changing it back to what the file holds (retyping the
month Data through already shows, say), with nothing but settings changed since you opened or saved, leaves it saved, and
the message line says nothing is unsaved.

- **Goals.** The OSD goal curves, one row per kind of money, Prior Yr then Oct to Sep. **Reset to v12's curves** puts back
  v12's values.
- **Authorized.** Type a figure in $M for any appropriation and FY. A blank box means *not entered*. Then Approved is shown
  in its place, marked †. A total that adds one in is marked † too. With a BAE report loaded, a blank box uses the report's
  figure instead, where it has one (see *The BAE report of budgets*).
- **The BAE report.** With one loaded, Settings names its file, its date and when it was imported.
- **Special CCaRs.** In the Not Allocated lists, a special CCaR is one item, named by its title. The defaults are
  `PP 2000` and `JSF6654`.
- **Budgets.** Every budget name, with its rows, dollars, service and lane. You can override the service or the lane of
  any budget.

## Export Excel

**Export Excel** downloads a workbook named `APEX FY2027 - data through Oct-2026 - 2026-11-09.xlsx`, for
example. Your browser puts it in its downloads folder, or asks where to save it, as it does the pictures.

- It holds the Summary, Slide Snapshots, a sheet per appropriation, a tab per PMO, Not Allocated, the raw data sheets,
  the Import Report and Settings.
- It holds values only, no formulas. Money is in $M.
- It uses v12's look. Every sheet is marked CUI at the top and the bottom, and prints on letter, landscape. The report
  sheets print one page wide. The raw data sheets print at full size across pages, as v12's did (fitted to one page
  wide, their 36 columns would print at about a quarter size); print them only when you need them.
- On **Slide Snapshots**, each block after the first starts a new printed page, so no block is cut in two.
- Every sheet that marks a figure †, ‡ or § says, under its table, what the mark means.
- On the appropriation sheets and PMO tabs, the four outline buttons at the left open the rows level by level, as in
  v12: 1 PMO, 2 Title, 3 Plan Event, 4 CCaR. The sheets open showing PMO and Title rows.

## Pictures for slides

- **Copy picture** puts one block on the clipboard. Paste it into PowerPoint. If the browser does not allow it, the
  message says so; use **Save picture**. If a pasted picture comes in larger than the slide region, set its width to
  13.33 in (a browser may drop the picture's resolution on the clipboard).
- **Save picture** saves one block as a PNG.
- **Save all pictures (.zip)** saves every block, one PNG each.

Each picture is 2000 × 675 pixels: 13.33 × 4.5 inches at 150 dpi, the slide region. A saved picture says 150 dpi, so
PowerPoint places it at that size. It runs from the block's title through
OSD Status, and is marked CUI at the top and the bottom.

The workbook's Slide Snapshots sheet has the same blocks. To copy one from there with Copy as Picture, select it from the
CUI line above its title through the CUI line under OSD Status: a picture of a cell range does not carry the sheet's
header and footer, so the marking (and, in a filtered workbook, what is shown) is inside the block. A block copied that
way is wider for its height than the slide region; size it by its width.

## Saving

- **Save** writes the data and settings into this file.
  - **The first Save asks you to pick this file.** A file window opens. Pick the file you opened, the one named in the
    message line. The tool reads it and checks it before it writes anything. After that, Save does not ask you to pick
    again while the page is open.
  - If you pick a different file, Save says so and asks first, naming both files, before it writes anything.
  - Save reads the file again just before it writes, after any question and after the browser's own *Save changes?*
    prompt. If someone saved it meanwhile, Save asks again, saying so.
  - The top bar says **Saved** or **Unsaved changes**. The browser asks before you close a page with unsaved changes.
- **Save a copy…** writes a new file under a name you choose. This page keeps saving to its own file. A copy you give this
  page's own file name, before the first Save, may or may not be that file: the page cannot tell, so it still counts the
  work as unsaved until you Save.
- **Where the browser cannot write files** (for example Firefox), Save downloads the file instead. The shared copy is not
  updated until you put the download in its place. Until then the top bar says **Downloaded, not in the file yet**, and the
  browser still asks before you close the page. If your downloads folder already holds a file of that name, the browser
  adds a number (`scope (1).html`): put the newest download in place, not the older one.
- **Where writing is refused** (a setting or policy that blocks editing files), Save and Save a copy… offer to download
  the plan instead, so the work is not lost.

### When Save asks a question, or refuses

- **"… holds a plan saved …, after this page last opened or saved its plan … — by someone else, or in another window.
  Write over it?"** Someone saved this file after you opened it.
  - **OK** writes your work over theirs, and their changes are lost.
  - **Cancel** writes nothing. To keep both, use **Save a copy…**, then open their file and compare.
- **"… before the plan this page opened or last saved …: it is not the file this page last saved, but an older copy of it,
  or another plan saved under this name, perhaps in another folder."** You may have picked a copy of the same name in
  another folder (a Downloads folder, say). **Cancel**, then Save again and pick this page's own file.
- **"… holds no saved plan, but this page opened the plan saved …"**: you picked a file of the same name that holds no plan,
  so it is not the file this page was opened from (perhaps a copy of the tool in your Downloads folder). **Cancel**, then
  Save again and pick this page's own file. **OK** writes there instead, and the file you opened does not get the work.
- **"… was saved again while you were answering."** Someone saved the file while a question, or the browser's prompt, was
  open. Read the new question: it is about their latest save.
- **"You picked …, not …, the file this page was opened from."**: you picked another file. **Cancel**, then Save again and
  pick this page's own file. **OK** writes there instead, and this page goes on saving there until it is closed.
- **"Not saved: … is not a APEX file"** (or *holds data saved by another tool*, or *could not be read*): you
  picked the wrong file. Nothing was written. Save again and pick this page's own file.
- **"Not saved: no file was picked."** The file window was closed. Save again.
- **A file whose saved data cannot be read opens empty** and says why. Saving over it asks first, and OK replaces the data it
  could not read with this page's plan. A *different* file whose data cannot be read is never written over.
- **A file that holds the plan you took** (by importing a saved plan's `.html`), or a copy you saved from this page, is this
  page's own work: Save writes over it without calling it someone else's.

## The rules

- **Approved** is every counted row, planned and executed. With a BAE report loaded, it is the report's Approved wherever the
  report has figures for the block (see *The BAE report of budgets*).
- **Obligated** is every row whose CCaR status (Alloc) says *Actual Execution*, whatever its date.
  - Executed rows dated after Data through still count. The Summary's notes name them.
- **Unobligated** = Approved − Obligated. **Obl %** = Obligated ÷ Approved.
- **Authorized** is what you enter in Settings. Otherwise it is the BAE report's, where one is loaded and has a figure for
  the block; otherwise Approved, marked †. An entered figure is for the appropriation and FY as a whole; while a switch is
  off it is marked ‡, because it still counts every service and lane. With a BAE report loaded it is marked ‡ always,
  because it stands in place of the report's figure.
- **The OSD goal** comes from the curve for the money's year of availability, read at the Data through month.
  - O&M uses its first-year curve in its first year. In its second year and later it is expired, so the goal is 100%.
  - Procurement uses its first-, second-, third- or fourth-year curve.
  - Money for a later year has no goal.
- **Delta** = Obl % − the goal. A delta that rounds to zero keeps its sign, as Excel shows it: `-0.00%` is just below the
  goal (so Within 10, not On track), `+0.00%` just above it, and `0.00%` exactly on it.
- **Status** always shows its word beside its colour:
  - **On track** (green): at or above the OSD goal.
  - **Within 10** (yellow): within 10 points of it.
  - **Behind** (red): more than 10 points behind.
  - In the month columns after Data through, the status is the plan's, shown in italic.
- **Which rows count:** a row counts when its FY and Amount can be read, its appropriation is known, its FY is at least
  First FY, it is not FY2025 O&M OBBBA funding (see *Data through and First FY*), and the switches show its service and
  lane.
- **Not Allocated** lists every counted row that is not *Actual Execution*.
  - Items are grouped by column, status and plan event. Each item shows its dollars, largest first within each month.
  - Unprogrammed, Forecast and other statuses are tagged.
  - Items of $0 are left out. There is no limit on the number of items.

## Where it differs from v12, on purpose

1. **The detail is built from the data, so nothing falls out.** v12's fixed row lists missed money. They cut plan events
   at 80 characters, missed a title with a leading space, and counted twice names that differ only in capitals.
2. **Every PMO row is a sum over the raw data.** In v12 the first PMO in each block was the sum of its titles, so money in
   no title was missing from it.
3. **Obligated follows CCaR's status, not the date.** v12 used "dated before 1 May".
4. **Prior Yr, the next-year column and No date show on every block, O&M included.** v12 hid the FY27+ column on the
   slides.
5. **Services follow the budget name.** A name that matches no rule is *Service not identified*, not USAF. OPN and the
   Navy APN CONG lines go to USN.
6. **One set of switches drives everything.** v12 applied its filter in some places and not others. The lane switches are
   new.
7. **Status is worked out every time, with words.** v12's status fills were painted by hand.
8. **Not Allocated:** no cap, no $0 items, largest first, statuses tagged, Prior, next year and No date listed, filtered by
   the switches, and a list for every PMO. v12 listed only Not Allocated rows in the year, stopped at 60 items a month
   (12 on PMO PSM), and gave a list to PMO PSM only.
9. **There are no row limits.**
10. **Goals come from Settings.** O&M in its second year uses the expired curve (100%). v12's −93.33% typing error on PMO
    MxS is gone.
11. **Each slide block lists every PMO with money,** not a typed list.
12. **The CCaR row shows its number.**
13. **Authorized can be entered.**
14. **The CUI marking is on every screen, sheet and picture.**

Two smaller differences, from the same rules:

- **The Total column of each block's totals band** shows the block's headline: Obl % to date, the goal at Data through, and
  the status, the same as the Summary row. v12 showed the year-end plan there (100%, and the September goal).
- **Figures are kept in whole cents.** Where v12's sums came to 99.999…% against a goal of 100%, v12 showed yellow. The tool
  shows On track.

## CUI

The data is CUI//REL TO US DoW. The marking is at the top and bottom of every screen, of every printed page of a view (Ctrl+P;
a printed view also says Data through and the import dates, which the top bar says on screen), on every sheet of the export
(header and footer, and above and below each Slide Snapshots block), and on every picture. A copy of this file that holds data is CUI. Keep it, and everything exported from it,
where CUI may be kept.

## For maintainers

The page is built from `src/` by `node apex/build.mjs`; `--check` fails when the file is not what the sources build.
`docs/CONTRACT.md` is the one statement of what the tool does. The tests are `node apex/test/run-all.mjs`. They use
synthetic data only: never put real data in the repository.
