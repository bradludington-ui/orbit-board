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
- **What an import replaces.** Each appropriation in the import replaces that appropriation's data. The data it replaces
  is kept, so **What changed** can compare the two. Appropriations not in the import keep their data, and the top bar says
  when each was imported.
- **Data through** is reset to the last full month before the import, and the message line says so. Change it if you
  need to.
- **Nothing is dropped quietly.** A row whose FY or Amount cannot be read is kept, counted in no figure, and listed in the
  **Import report**. So are text amounts (`$0.00`), amounts in parentheses, and trimmed spaces.
- **When an import is refused, nothing changes.** For example, one appropriation's rows in two different sheets, or the
  same file given twice. The message names each sheet and how many rows it holds, so a misfiled row is easy to find.

## Reading the views

The view buttons sit under the top bar.

- **Summary.** One row per appropriation and FY. Approved, Authorized, Obligated, Unobligated, Obl %, OSD Goal %, Delta and
  Status. Then the TOTAL, the legend and the notes. The notes name anything left out of the figures.
- **Slide blocks.** Each appropriation and FY as a slide block. It shows the PMO rows by month, then Monthly Totals,
  Cumulative Totals, Obligation %, OSD Goal % and OSD Status. Under each block is its Not Allocated list. Each block has
  **Copy picture** and **Save picture**.
- **O&M, Full Fund, Initial Spares, OPN.** The FY table, then each FY's tree: PMO, Title, Plan Event and CCaR. Press a row
  to open or close it. **Expand to** opens a whole block to one level. The CCaR row shows its number.
- **PMOs.** Pick a PMO. It shows that PMO in every appropriation and FY, with its own Not Allocated list.
- **Not Allocated.** Every item in one table. You can filter it by appropriation, FY and PMO. Filtered by a PMO, it shows
  that PMO's own items, the ones its PMO tab lists: where other PMOs share a plan event, only that PMO's rows count.
- **Import report.** What the last import read, used, skipped and could not read.
- **What changed.** The last pull against the one before it, for each appropriation imported twice: Approved and
  Obligated by FY, CCaRs new and gone, CCaRs that moved PMO, and every changed line, largest first.
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
  set its service.

## Data through and First FY

- **Data through** is the last month whose data counts as actual. The execution year is the FY of that month. For
  example, Data through Oct-2026 makes the execution year FY2027.
- **First FY** is the oldest money year shown. It starts at FY2025. Money for earlier years is counted nowhere, and the
  Summary's notes say how much there is.

## Settings

Settings are saved in the file. Changing one marks the file unsaved.

- **Goals.** The OSD goal curves, one row per kind of money, Prior Yr then Oct to Sep. **Reset to v12's curves** puts back
  v12's values.
- **Authorized.** Type a figure in $M for any appropriation and FY. A blank box means *not entered*. Then Approved is shown
  in its place, marked †.
- **Special CCaRs.** In the Not Allocated lists, a special CCaR is one item, named by its title. The defaults are
  `PP 2000` and `JSF6654`.
- **Budgets.** Every budget name, with its rows, dollars, service and lane. You can override the service or the lane of
  any budget.

## Export Excel

**Export Excel** downloads a workbook named `SFCB Spend Plan FY2027 - data through Oct-2026 - 2026-11-09.xlsx`, for
example.

- It holds the Summary, Slide Snapshots, a sheet per appropriation, a tab per PMO, Not Allocated, the raw data sheets,
  the Import Report and Settings.
- It holds values only, no formulas. Money is in $M.
- It uses v12's look. Every sheet is marked CUI at the top and the bottom, and prints on letter, landscape, one page wide.
- On the appropriation sheets and PMO tabs, the outline buttons at the left open the rows level by level. The sheets
  open showing PMO and Title rows.

## Pictures for slides

- **Copy picture** puts one block on the clipboard. Paste it into PowerPoint. If the browser does not allow it, the
  message says so; use **Save picture**.
- **Save picture** saves one block as a PNG.
- **Save all pictures (.zip)** saves every block, one PNG each.

Each picture is 2000 × 675 pixels: 13.33 × 4.5 inches at 150 dpi, the slide region. It runs from the block's title through
OSD Status, and is marked CUI at the top and the bottom.

## Saving

- **Save** writes the data and settings into this file.
  - **The first Save asks you to pick this file.** A file window opens. Pick the file you opened, the one named in the
    message line. The tool reads it and checks it before it writes anything. After that, Save does not ask you to pick
    again while the page is open.
  - The top bar says **Saved** or **Unsaved changes**. The browser asks before you close a page with unsaved changes.
- **Save a copy…** writes a new file under a name you choose. This page keeps saving to its own file.
- **Where the browser cannot write files** (for example Firefox), Save downloads the file instead. The shared copy is not
  updated until you put the download in its place.

### When Save asks a question, or refuses

- **"… was saved … by someone else, or in another window. Write over it?"** Someone saved this file after you opened it.
  - **OK** writes your work over theirs, and their changes are lost.
  - **Cancel** writes nothing. To keep both, use **Save a copy…**, then open their file and compare.
- **"Not saved: … is not an SFCB Spend Plan file"** (or *holds data saved by another tool*, or *could not be read*): you
  picked the wrong file. Nothing was written. Save again and pick this page's own file.
- **"Not saved: no file was picked."** The file window was closed. Save again.
- **A file whose saved data cannot be read opens empty** and says why. Saving over it asks first.

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
- **Delta** = Obl % − the goal.
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
and footer), and on every picture. A copy of this file that holds data is CUI. Keep it, and everything exported from it,
where CUI may be kept.

## For maintainers

The page is built from `src/` by `node spend-plan/build.mjs`; `--check` fails when the file is not what the sources build.
`docs/CONTRACT.md` is the one statement of what the tool does. The tests are `node spend-plan/test/run-all.mjs`. They use
synthetic data only: never put real data in the repository.
