# SFCB Spend Plan

CUI//REL TO US DoW applies to any copy that holds data.

## What it is

The SFCB Spend Plan replaces the *SFCB FY26 Spend Plan Workbook v12*. You import the CCaR pull. The tool draws every
product the workbook made: the Summary, the slide blocks, the four appropriation tabs, the PMO tabs and the Not Allocated
lists. **Export Excel** writes them all as a workbook of values.

It is one file: `sfcb-spend-plan.html`. It is separate from ORBIT. It needs no install, no network and no add-ins. The file
is also its own database: **Save** writes your data and settings into the file itself.

## Opening it

1. Put `sfcb-spend-plan.html` on the shared drive.
2. Open it in Edge or Chrome (double-click, or drag it onto the browser).
3. The first time, it says *No data yet*. Import a pull.

Save it under any name you like. Keep one copy per team or per purpose. Each copy holds its own data.

## Importing a CCaR pull

Press **Import CCaR pull…** and pick one or more files.

- **What to import.** Each file is a CCaR export laid out like v12's Raw Data tabs. An `.xlsx` or a `.csv` works.
  - Import one file per appropriation, or one file holding all four. The old v12 workbook itself also imports: its four
    Raw Data tabs are read and its report tabs are skipped.
  - Columns are found by their header names, in any order. The header row may be anywhere in the first 15 rows.
  - Columns the tool does not know are kept, and appear in the raw data sheets of the export.
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
  when each was imported (the day it came into the page, which is not always the day CCaR made the pull).
- **A pull kept from before Data through ended.** Data through is one month for every appropriation. An appropriation whose
  pull was imported before that month ended (one kept from an earlier import) cannot hold all of it: its Obligation % lines
  say *actual through the 2026-10-05 import* instead of *actual through Oct*, on the screen, in the workbook and on the
  pictures, and the Summary's notes name it. Its goal and status are still read at Data through. Import a newer pull of it
  to bring it up to date. The same pull imported again changes nothing What changed compares: What changed still shows the
  change the earlier pull brought, and says the newest import changed nothing.
- **Rows whose appropriation is not identified** stay on screen while any pull from the same import is on screen. Once
  every pull that import brought has been replaced, they go. The message line says which.
- **The message line** says what was imported, and also any file that was refused, rows that could not be read, and rows
  whose Date could not be read (they sit in the **No date** column). It shows as a warning when a file was refused, when
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
  same file given twice. The message names each sheet and how many rows it holds, so a misfiled row is easy to find.

## Reading the views

The view buttons sit under the top bar.

- **Summary.** One row per appropriation and FY. Approved, Authorized, Obligated, Unobligated, Obl %, OSD Goal %, Delta and
  Status. Then the TOTAL, the legend and the notes. The notes name anything left out of the figures. The TOTAL's Authorized
  carries each mark its rows carry (†, ‡), and a line under the table says what each mark means, as the workbook does.
- **Slide blocks.** Each appropriation and FY as a slide block. It shows the PMO rows by month, then Monthly Totals,
  Cumulative Totals, Obligation %, OSD Goal % and OSD Status. Under each block is its Not Allocated list. Each block has
  **Copy picture** and **Save picture**.
- **O&M, Full Fund, Initial Spares, OPN.** The FY table, then each FY's tree: PMO, Title, Plan Event and CCaR. Press a row
  to open or close it. **Expand to** opens a whole block to one level. The CCaR row shows its number.
- **PMOs.** Pick a PMO. It shows that PMO in every appropriation and FY, with its own Not Allocated list.
- **Not Allocated.** Every item in one table. You can filter it by appropriation, FY and PMO. Filtered by a PMO, it shows
  that PMO's own items, the ones its PMO tab lists: where other PMOs share a plan event, only that PMO's rows count.
- **Import report.** What the last import read, used, skipped and could not read; then any data on screen from earlier
  imports, with the rows in it that count nowhere.
- **What changed.** The last pull against the one before it, for each appropriation imported twice: Approved and
  Obligated by FY, CCaRs new and gone, CCaRs that moved PMO, and every changed line, largest first. If the newest import
  of an appropriation was the same as the pull before it, row for row, the view says so, and shows the change the earlier
  pull brought.
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
  an appropriation and FY as a whole (marked ‡ while a switch is off), and the Summary's notes on rows not counted.
- When not everything is shown, each view, sheet and picture says what it shows. An export's file name ends in
  `[filtered]`.
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

## Settings

Settings are saved in the file. Changing one marks the file unsaved.

- **Goals.** The OSD goal curves, one row per kind of money, Prior Yr then Oct to Sep. **Reset to v12's curves** puts back
  v12's values.
- **Authorized.** Type a figure in $M for any appropriation and FY. A blank box means *not entered*. Then Approved is shown
  in its place, marked †. A total that adds one in is marked † too.
- **Special CCaRs.** In the Not Allocated lists, a special CCaR is one item, named by its title. The defaults are
  `PP 2000` and `JSF6654`.
- **Budgets.** Every budget name, with its rows, dollars, service and lane. You can override the service or the lane of
  any budget.

## Export Excel

**Export Excel** downloads a workbook named `SFCB Spend Plan FY2027 - data through Oct-2026 - 2026-11-09.xlsx`, for
example. Your browser puts it in its downloads folder, or asks where to save it, as it does the pictures.

- It holds the Summary, Slide Snapshots, a sheet per appropriation, a tab per PMO, Not Allocated, the raw data sheets,
  the Import Report and Settings.
- It holds values only, no formulas. Money is in $M.
- It uses v12's look. Every sheet is marked CUI at the top and the bottom, and prints on letter, landscape. The report
  sheets print one page wide. The raw data sheets print at full size across pages, as v12's did (fitted to one page
  wide, their 36 columns would print at about a quarter size); print them only when you need them.
- On **Slide Snapshots**, each block after the first starts a new printed page, so no block is cut in two.
- Every sheet that marks a figure † or ‡ says, under its table, what the mark means.
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
  adds a number (`sfcb-spend-plan (1).html`): put the newest download in place, not the older one.
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
- **"Not saved: … is not an SFCB Spend Plan file"** (or *holds data saved by another tool*, or *could not be read*): you
  picked the wrong file. Nothing was written. Save again and pick this page's own file.
- **"Not saved: no file was picked."** The file window was closed. Save again.
- **A file whose saved data cannot be read opens empty** and says why. Saving over it asks first, and OK replaces the data it
  could not read with this page's plan. A *different* file whose data cannot be read is never written over.
- **A file that holds the plan you took** (by importing a saved plan's `.html`), or a copy you saved from this page, is this
  page's own work: Save writes over it without calling it someone else's.

## The rules

- **Approved** is every counted row, planned and executed.
- **Obligated** is every row whose CCaR status (Alloc) says *Actual Execution*, whatever its date.
  - Executed rows dated after Data through still count. The Summary's notes name them.
- **Unobligated** = Approved − Obligated. **Obl %** = Obligated ÷ Approved.
- **Authorized** is what you enter in Settings. Otherwise it is Approved, marked †. An entered figure is for the
  appropriation and FY as a whole; while a switch is off it is marked ‡, because it still counts every service and lane.
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
  First FY, and the switches show its service and lane.
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

The data is CUI//REL TO US DoW. The marking is at the top and bottom of every screen, on every sheet of the export (header
and footer, and above and below each Slide Snapshots block), and on every picture. A copy of this file that holds data is CUI. Keep it, and everything exported from it,
where CUI may be kept.

## For maintainers

The page is built from `src/` by `node spend-plan/build.mjs`; `--check` fails when the file is not what the sources build.
`docs/CONTRACT.md` is the one statement of what the tool does. The tests are `node spend-plan/test/run-all.mjs`. They use
synthetic data only: never put real data in the repository.
