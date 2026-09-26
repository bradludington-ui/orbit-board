# Next version — queued changes

Changes are logged here as they come up and built together as ONE version when Brad says **go**.
Nothing on this list touches the board until then. On go: build every open item, run the full
math gate once, bump the version once, push once, and move the items to *Shipped* with the version.

Current version: **v1.85**. Next: **v1.86**.

## Open

### 9. The help guide inside the tool, in every board and every PMO copy
- **Logged:** 25 Sep 2026, Brad: *"Can we add the help file to the tool itself so that when we push
  it out, everyone has access to it?"*
- **What Brad needs:** the PMO copy guide travels inside the board file, so everyone who opens a
  board or a PMO copy has it, with no link to share and no PDF to send alongside.

##### What the tool does today (read 25 Sep, v1.85)
- **No help panel.** The only help in the tool is typing `help` in the command bar, which lists
  example commands.
- The guide is a **private web page** (shared from its Share menu) plus a **PDF for Teams**, both kept
  by hand beside the board. They can drift from the board between versions.
- A PMO copy's top bar carries **🏢 set your office** and **✉ Submit input**, and nothing that says how
  the copy works.

##### How it would work (proposed; say if any of it is wrong)
- **📖 Help** in the header of both builds opens the guide in a panel over the board.
- **In a PMO copy**, the bar across the top also gets **📖 How this copy works**. The guide **never
  opens by itself** (Brad, 25 Sep: *"I don't want it to automatically pop up but I want it to be
  available"*); it opens only from those buttons.
- **Size** (measured 25 Sep): the office guide is about 2,850 words in 11 sections, ~22 KB of text,
  11 pages as the Teams PDF. With a portfolio-team part of similar length the whole guide adds roughly
  40–50 KB to a board file of ~3.1 MB, about 1.5%. The panel opens on a contents list so a reader
  jumps straight to the section they need.
- **It works offline, like the rest of the board:** the board's own fonts and colours, light and dark,
  nothing loaded from the internet.
- **Two parts, both included** (Brad, 25 Sep: *"Include both"*): *For programme offices* (the PMO
  copy guide as published today, plus the five-year plan by office) and *For the portfolio team*
  (publishing a copy, taking submittals, the consolidated take, the five-year plan by PMO). A PMO
  copy opens on the first part.
- **The version on the guide is the board's own**, so it can never say a different version from the
  board it is in.
- **One source:** the web page and the Teams PDF are produced from the guide inside the board, so all
  three say the same thing.

##### Can't-fail checks for the build
- **Every menu path and button the guide names exists** in that build and does what the guide says
  (checked by machine against the board's own menus, both builds). A guide that describes a control
  the board does not have is the error this item exists to prevent.
- **It opens everywhere:** portfolio board and PMO copy, grid and card, both themes, laptop width,
  nothing clipped; it never opens unless someone presses a 📖 button.
- **Nothing moves:** opening, reading or closing help changes nothing stored and no figure.
- **No network:** the panel loads nothing from outside the file.
- The accessibility baseline holds (keyboard, focus, contrast), and the full math gate.

### 10. Mandatory back in every consolidated spend plan: forecasts, charts, exports
- **Logged:** 25 Sep 2026, Brad: *"Let's add mandatory allocations back into all spend plan forecasts,
  exported charts/graphs, and any other place where we're looking at a consolidated spend plan and not
  solely focused on reviewing the two distinct pots of funding."*
- **What Brad needs:** wherever the board shows WHEN money lands (a consolidated spend plan), the
  mandatory allocation is in it and lands in the months, like discretionary. Only the views whose job
  is to compare the two pots stay discretionary-only: Two Spend Plans, the Two-Plan Forecast's Plan A,
  the DISCRETIONARY FIT strip, and the Mission Critical measure against discretionary.

##### What testing showed (read and measured 25 Sep, v1.85)
1. **No spend-plan view leaves mandatory out of its TOTALS, but mandatory often never reaches a
   MONTH.** An award schedule's increments are discretionary dollars; mandatory "rides the same
   dates" only in a service that also has a discretionary increment. A service paid only from
   mandatory (its discretionary used up) has no increment to ride, so all of its mandatory lands in
   **UNSCHEDULED** ("No date" on the CR views). Measured: one requirement, $900 discretionary (USAF)
   and $300 mandatory (ANG, no discretionary), increments $500 Nov + $400 Feb: the forecast puts **$900
   in the months and $300 in UNSCHEDULED**. The same happens on the RCN-EEIC and SI by Month sheets,
   the Excel PMO tabs' spend plan block, CR Cash Needs and the CR panel.
2. **There is nowhere to schedule mandatory.** The award block's *Balance to schedule* and *put on
   last* count discretionary only.
3. **The award block contradicts itself.** Switching a requirement to increments seeds them with
   discretionary + mandatory, while the balance counts discretionary only — so a split requirement shows
   over-scheduled by its mandatory the moment it is switched, and correcting it to match drops a
   mandatory-only service into UNSCHEDULED.
4. **Two rules for when a dollar lands.** The CR views spread the whole funded amount by the
   increments' proportions, so discretionary not yet on a date is inflated into the CR windows; the
   forecast and month sheets leave it in UNSCHEDULED.
5. **The ◨ Discretionary only switch** (🎯 Budget year ▾ → Spend plan basis; off every time the board
   opens) is not followed everywhere: the CR panel's *By PMO* ignores it while *By Service* follows it;
   the Excel PMO-tab spend plan ignores it inside a workbook stamped `[DISC-ONLY]`; the fit chart
   ignores it.
6. **Already both pots:** the Spend Plan Source (a line per lane since v1.83), the funds flow, the
   five-year plan, the PowerPoint tables. The PowerPoint deck has **no charts** at all today.

##### How it would work (proposed; say if any of it is wrong)
- **Mandatory lands on the requirement's own dates.** In a service with no increment of its own, its
  mandatory follows the requirement's increment dates in the same proportions as the requirement's
  increments overall. Nothing new to type. A requirement with no date at all stays in UNSCHEDULED.
- **The award block schedules the whole funded amount:** Balance to schedule and put on last cover
  discretionary + mandatory per service, with the two shown separately; seeding and balance agree.
- **One rule for when a dollar lands**, shared by the forecast tab, the month sheets, the PMO-tab spend
  plan and the CR views. The CR figures will move where discretionary was not yet on a date (it stops
  being spread into the windows and shows as No date) — this reaches the **1A9A CR Cash Return**.
- **The ◨ switch moves every spend-plan view together**, or none; the CR panel By PMO, the PMO-tab
  spend plan and the fit chart follow it.

##### Brad's answers (26 Sep)
1. **Mandatory rides the requirement's own dates** — no separate mandatory increments to type. *Yes.*
2. **Keep the ◨ Discretionary only switch** as a what-if, fixed so every spend-plan view obeys it. *Yes.*
3. **The 1A9A CR Cash Return adopts the same rule**: discretionary not yet on a date shows as No date,
   not spread into the windows. *Yes.* Its figures will move where that was happening; the build
   states by how much on a real-shaped board before it ships.
4. **Add a spend-plan chart to the PowerPoint deck.** *Yes.* Proposed: one slide, a column per month
   (Oct–Sep) stacked discretionary and mandatory, UNSCHEDULED as its own column at the end, with the
   month figures printed beneath so every bar's value is stated. Drawn from the same forecast the
   board's forecast tab shows, and marked ◨ DISCRETIONARY ONLY when the switch is on.

##### Can't-fail checks for the build
- **Every funded dollar, discretionary and mandatory, is in exactly one month or in UNSCHEDULED** on
  every spend-plan surface, and the surfaces agree to the dollar month by month (forecast tab, month
  sheets, PMO-tab spend plan, CR windows for Oct–Mar).
- **UNSCHEDULED holds only money with no date**: a requirement with no date, or discretionary not yet
  on one. A mandatory-only service on a dated requirement is never in it.
- **The pot-comparison views do not move** (Two Spend Plans, Plan A, the fit strip, Mission Critical).
- **The ◨ switch moves every spend-plan surface together** and the [DISC-ONLY] marker with them.
- **The deck's chart ties to the dollar** to the forecast tab: every month, each pot, UNSCHEDULED and
  the total; it opens in PowerPoint without a repair prompt.
- Mutations for each, the full math gate, and help/training updated (the award block wording, the
  deck's spend-plan slides).

### 11. Destinations: one list for every appropriation, in alphabetical order
- **Logged:** 26 Sep 2026, Brad: *"When I create destinations, I need it to span all appropriations not
  just the one I'm building on. I also need it to be in alphabetical order to make it easier to look
  them up. In the main file, I've added about 30 destinations and it's making it hard to search."*
- **What Brad needs:** a destination added once (🛠 Tools ▾ → 📍 Destinations…) is there on O&M, Full
  Fund, Initial Spares and OPN; every list of destinations reads A to Z.

##### What the code does today (read 26 Sep, v1.85)
- The list lives **inside each appropriation's own saved plan** (`MS.flow.ents`), so a destination
  added on O&M does not exist on Full Fund. Switching appropriation reloads the board with that
  appropriation's own list.
- It is kept **in the order added**: the eight seeded ones (Lockheed Martin, Pratt & Whitney, the Navy
  activities, DLA, OC-ALC), then each new one at the bottom. Every picker shows that order: the
  Destinations panel, **Goes to** and **Which awards to** in 📋 Record, and the row's destination
  selectors.
- A requirement stores its destination by an internal key (`x1`, `x2`, …) numbered **per
  appropriation**, so `x1` on O&M and `x1` on Full Fund can be two different places.

##### How it would work (proposed; say if any of it is wrong)
- **One list for the whole board**, kept in the saved file beside the BAE list (the v1.83 pattern),
  so every appropriation and every PMO copy reads the same destinations.
- **The four lists are merged once**, the first time v1.86 opens the file. Same name (ignoring case
  and extra spaces) = one destination; different names stay separate. Where the two appropriations
  hold the same name with different details (kind, or match terms), the match terms are combined and
  the difference is named for you to settle.
- **Keys become unique across the board.** Each appropriation's requirements are re-pointed to the
  merged keys the first time that appropriation opens on v1.86, so no requirement loses or changes
  its destination.
- **A to Z everywhere a destination is picked or listed** (the panel, Goes to, Which awards to, the
  row selectors), ignoring case, with "Not yet assigned" and "Split between destinations" kept at the
  end where they are today. The funds flow chart keeps its own order.

##### Can't-fail checks for the build
- **No requirement in any appropriation or year loses or changes its destination** through the merge
  and re-keying (checked destination by destination, before and after), and the funds flow prints the
  same dollars to the same destinations.
- **Two different destinations are never merged**; only exact name matches (ignoring case and
  spacing) are, and each merge is listed.
- **Added once, seen everywhere:** a destination added on one appropriation is on the others after a
  switch, after save and reopen, and in a PMO copy.
- **Every destination list is A to Z** (checked on every picker, both builds).
- The data-loss fuzz covers the new store; mutations; the full math gate; help and training updated.

### 12. The requirement panel: its editors at the top, without clutter
- **Logged:** 26 Sep 2026, Brad: *"On the requirement pop up, most of the editable selection material
  is at the bottom of the pop up. I need to bring those to the top so that they're not as hidden.
  Let's move them to the top but let's make sure it doesn't look cluttered at the top."*

##### What the panel does today (grid build, RECORD panel, read and photographed 26 Sep, v1.85)
From the top: the title (✎ rename) · a row of status chips (☆ MC, PMO) · a second row echoing the
row's chips (band, funding) · the ⚙ *from the lane walk* chip · six money boxes (requirement,
allocated, discretionary, mandatory, unfunded, MC shortage) · CCaR record and PID · Decision band ·
the By service table · Planning (minimum useful increment, shortfall absorber) · the award / obligation
schedule · and last, under *Open on the row*, the four editors: **📝 Note, 📄 Description, 📋 Record,
⚠ Impact**. On a laptop the panel shows about 610 px of its ~820 px (more with an award schedule), so
the editors are below the fold on every requirement, including ⚠ Impact, the field the PMO workflow
exists to collect.

##### How it would work (proposed; say if any of it is wrong)
- **Straight under the title, one row of three equal buttons**, each saying its state in the button
  itself; they leave the bottom of the panel (Brad, 26 Sep, after seeing the mock-up):
  - **⚠ Impact statement** (renamed from *Impact*) — *written* / *not written*, amber when missing.
  - **📄 Description & note** — Description and Note combined: one pop-up with the **description
    area first and the note area underneath**, one Save. Each is still kept, submitted by a PMO copy,
    reviewed and exported as its own field; a Save only writes the one(s) that changed.
  - **📋 Requirement edit** (renamed from *Record*) — says how many of its fields are still to fill
    (e.g. *6 of 7 not set*), amber while any are.
- **One name everywhere:** the pop-up titles, the board's messages that say "📋 Record" or name the
  Impact field, the card build's chips (which open the same combined Description & note pop-up), the
  guide and the deck all use *Impact statement*, *Description & note* and *Requirement edit*.
- **Less at the top, not more:** the two chip rows become one quiet line (★ MC · PMO); the band echo
  goes, because the Decision band field below already shows and sets it; the ⚙ *from the lane walk*
  note moves down beside the money it describes.
- **Then, in order:** the money boxes · CCaR record, PID and Decision band together · By service ·
  Planning · the award schedule. Nothing is removed from the panel and nothing changes what it does.
- **The card build** keeps its row layout; this is the grid build's RECORD panel.
- **Help and training** follow (the guide and deck say the editors are "at the bottom").

##### Can't-fail checks for the build
- **Every control still there and still working:** the panel's controls before and after reach the
  same editors and write the same fields (the editors-reachable and row-controls checks), both themes.
- **The combined pop-up loses nothing:** description and note are saved, journalled, submitted from a
  PMO copy and exported exactly as two separate fields; saving one never blanks or re-stamps the other;
  an old name ("📋 Record", "Impact —") is left nowhere on screen.
- **Above the fold on a laptop:** the four editors are visible without scrolling at 1366×768 and
  1440×900, for a requirement with and without an award schedule; nothing clipped; the toolbar-fit and
  accessibility checks hold (keyboard order follows the new layout).
- **Nothing moves:** opening the panel changes no figure; the inspector still agrees with the engine.

### 13. Find, in the main view, where a typed allocation is more than it draws — and fix it
- **Logged:** 26 Sep 2026, Brad: *"I need a better way to quickly identify where we've over allocated
  funding ... there's a requirement that shows that we've allocated an amount but then it tells us that
  only x amount has been drawn from it. I need a quicker way within the dashboard main view to identify
  quickly and easily where those issues are happening so that we can adjust and make corrections."*
  Options talked through and mocked up 26 Sep; Brad chose **A, B and C**, **mandatory as well as
  discretionary**, and **set to drawn** as the fix.

##### What the board does today (read 26 Sep, v1.85)
- A typed Disc or Mand figure is paid only as far as (1) that service's lane still holds money at the
  requirement's rank and (2) the requirement value for that service allows. The rest is unfunded.
- The only place it shows is the **"drew $…" line under the figure in the requirement's By service
  table** (card build: the row expander), one requirement at a time. There is no count, no filter and
  nothing on the list.

##### What will be built
- **A · The counter.** A fourth chip in the DISCRETIONARY FIT strip, beside *fits in disc / spills to
  mand / unfunded*: **▲ not drawn N · $X** — how many requirements are set higher than they draw, and
  the total not drawn, discretionary and mandatory together. One click filters the list to just those
  (again, or ✕ clear, to come back). **🔧 fix list** sits beside it.
- **B · The flag on the row.** Every affected requirement carries **▲ $… not drawn** in the list (both
  builds; the RECORD panel echoes it). Hovering it names each service and lane, what was typed, what was
  drawn and why.
- **C · The fix list.** One line per service and lane on each affected requirement, in priority order:
  typed, drawn, not drawn, and **why** — *"USAF discretionary ran out above this rank"*, *"USAF mandatory
  ran out above this rank"*, or *"the USN requirement value stops at $X"* (typed above the requirement).
  Per line: **set to drawn** and **open**; at the foot, **set all to drawn**, which first says how many
  lines and how much it will change.
- **What "set to drawn" changes, measured 26 Sep:** it lowers the typed figure to what was paid. **No
  funded dollar moves, and neither unfunded total moves** (TOTAL and vs DISC, per requirement and
  overall). What changes is the *explanation* of the unfunded money: it stops counting as "allocated but
  no lane could pay it" — the **portfolio shortfall** in the fit strip and the **lane short** line in the
  By service table — and counts as never allocated. Example: a requirement typed at $4.0M USAF and $1.0M
  ANG that drew nothing; after set to drawn, its UFR stays $5.0M, and the board's shortfall fell from
  $6.0M to $2.0M (USAF) and $2.0M to $1.0M (ANG). The panel says this in one line; each fix is journalled
  and the typed figure can be retyped.

##### Can't-fail checks for the build
- **The counter, the flags and the list agree** with each other and with the By service table's "drew"
  lines, to the dollar, for every requirement, service and lane; nothing is flagged that drew in full;
  a requirement on the lane walk (nothing typed) is never flagged.
- **Set to drawn / set all to drawn moves no funded dollar and neither unfunded total**, on every
  requirement and every total (checked before and after, both builds); the typed figure equals what was
  drawn afterwards; the flag and the line disappear; the shortfall moves by exactly the amount set.
- **The filter** shows exactly the flagged requirements and composes with the other filters.
- Mutations; the full math gate; help and training (the guide's portfolio-team part and the deck).

### 14. Importing and exporting boards: a full import for new versions, one appropriation in or out, and the PMO copy under File
- **Logged:** 26 Sep 2026, Brad: *"I need first to be able to import a full dashboard from a previous file
  that way when the new version comes out it's seamless. I also need the ability to import or export
  appropriation specific dashboards. The pmo copy export is in a random drop-down and needs to be moved
  over to the file drop-down."*

##### What the board does today (read 26 Sep, v1.85)
- **📁 File ▾ → Bring work in** holds ⬅ *Import a previous board…*, 🔁 *Appropriation packages…* and ⇊
  *Import several boards at once…*. A consolidated file imported with ⬅ asks which appropriations to take
  (numbers, or ALL), with a confirmation for each.
- **A full import (ALL) is not complete.** It takes the four appropriations, execution data, cost
  estimates and the reprogramming log, but **leaves behind the BAE list and the locked cycles of every
  appropriation except the one open** (read in `importStores`: it takes `cycDb.byAp` for the open
  appropriation only, and never reads `budDb`). On a new version opened on another machine, those would
  be missing.
- **There is no "export one appropriation".** The only one-appropriation files are packages (a hand-out
  and return with a ledger) and PMO copies (a sandbox). Importing one appropriation works from a
  consolidated file (v1.84) or a single-appropriation file.
- **📤 Publish PMO copy…** and **✉ Review submittals…** live under 🎯 Budget year ▾ → Programme offices.

##### How it would work (proposed; say if any of it is wrong)
- **⬅ Import a full board (new version)** in 📁 File ▾: pick the previous file; one confirmation that
  lists what comes across; then **everything** in it — all four appropriations, every locked cycle for
  every appropriation, the BAE list, execution data, cost estimates, the reprogramming log, PPBE positions,
  destinations (item 11) — lands on the new board, and a report says what arrived, appropriation by
  appropriation and store by store. Built for opening a new version and carrying on where the old one
  left off; a file saved by any earlier version back to v1.80 is accepted.
- **⬇ Export one appropriation…** — pick O&M, Full Fund, Initial Spares or OPN: a working board file
  holding only that appropriation (its plan, its locked cycles, and the board-wide lists it needs), which
  opens and saves like any board — for an appropriation lead.
- **⬅ Import one appropriation…** — take one appropriation from any board file (consolidated or
  single), with the conflict check and preview v1.84 already has; nothing else on the board changes.
- **📁 File ▾ gains the PMO copy:** 📤 *Publish PMO copy…* and ✉ *Review submittals…* move there from
  🎯 Budget year ▾; in a PMO copy, ✉ *Submit input…* moves there too (the bar button stays).
- **The File menu, grouped:** *Save* (💾 Save · ⬇ Save a copy) · *Import* (full board · one
  appropriation · several boards · appropriation packages) · *Export* (one appropriation · PMO copy ·
  review submittals) · *Team* (as today).

##### Brad's answers (26 Sep): yes to all three
1. A full import **replaces** whatever the new board holds, after one confirmation that says so; a board
   with work of its own gets the per-appropriation conflict check first.
2. **Export one appropriation** makes a full working board (editable, saveable), not a package or a PMO
   copy.
3. **Appropriation packages** and **Import several boards at once** stay, under Import.

##### Can't-fail checks for the build
- **Nothing is lost in a full import:** every container in the previous file arrives unchanged —
  each appropriation's plan (every year), every locked cycle of every appropriation, the BAE list,
  execution data, cost estimates, the reprogramming log, PPBE positions, destinations — checked store by
  store with the file verifier, from files saved by earlier versions (v1.80 onward, built from the
  project's own history) into the new one; the figures every export prints are the same before and after.
- **One appropriation out and back in** changes that appropriation only, and round-trips unchanged.
- **The moved menu items** open the same actions (menu-path check); no old path is left pointing at
  nothing; help and training updated.

## Withdrawn

### 1. PIDs show up in the CCaR column of the Excel workbook
- **Withdrawn 23 Sep 2026 by Brad:** the PID is in the right column now. No change.
- What testing had shown, kept for the record: the export places the CCaR number and the PID in
  their own columns on every sheet, including a requirement with a PID and no CCaR number.

## Shipped

### v1.85 — 24 Sep 2026: item 8, built on Brad's "go"

What shipped differs from the log in these places, all stated here:
- **The five years are the report's span:** the base year plus four, and — only in the weeks after the
  base rolls forward — the year on screen as well, exactly as on the three sheets before the tabs. So
  every PMO tab ties to By PMO to the dollar, including the far-right totals.
- **The other appropriations are read, not recomputed.** Each is opened as its own board, read-only,
  in a sealed frame the browser keeps away from storage, the file and the folder, from the newest copy
  its own board would open. The export waits a few seconds for them and the status line says which
  are being opened. A Full Fund block is therefore Full Fund's own report.
- **An appropriation that cannot be read is named on every tab** with the reason ("its figures are
  missing here, not zero"): no lock under the chosen cycle, a copy written by a newer board, a shared
  folder that cannot be read, or a board that opened a different copy than the newest one here.
- **A working plan tagged under a different cycle** than the board you export from is flagged on its
  block (e.g. "⚠ its working plan is tagged PB27, this one BES28").
- **CCaR records are matched however they are typed:** " jsf5594 " and "JSF5594" are one record.
- **A PMO copy prints its own appropriation only.**
- **Also fixed on the way — a data-loss bug:** a consolidated file opened on one appropriation in a
  browser that had never opened another, then saved, dropped the other appropriation's **locked
  cycles** from the file. Saves now keep them (the newer of this browser's copy and the file's).
- **Also fixed:** a five-year workbook exported from a PMO copy was stamped in its file name but not
  on its sheets; every sheet now carries the "◨ PMO COPY (snapshot of …, NOT the current plan)" banner.

#### 8. Five-year spend plan: a tab per PMO, every appropriation, records with their requirements
- **Logged:** 24 Sep 2026, Brad: *"I need that report to pull by pmo so I need a pmo specific tab for
  each pmo that has requirements ... underneath that I need a list of their records so for instance
  jsf5594 then underneath that record I need to see the individual requirements listed that roll up
  ... the requirement for each fiscal year and the allocation right next to it ... 5 years which
  includes the base year plus four ... summary totals for each row at the far right ... summaries for
  each column at the bottom. It also needs to reference the ppbe cycle ... Within each pmo's tab I want
  to see all appropriations ... grouped by appropriation ... so that that's not one large listing."*
- **What Brad needs:**
  1. **One tab per PMO** that has requirements in any appropriation (tab name = the PMO, e.g. TSS).
  2. **Inside each tab, one table per appropriation** the PMO has requirements in — O&M, Full Fund,
     Initial Spares, OPN — each its own block with its own heading, never one long list.
  3. **Rows, in each block:** each **CCaR record** (e.g. JSF5594) as a roll-up line, with **the
     requirements filed under it** listed beneath it.
  4. **Columns:** for each of the five years (base year plus four), **Requirement** and **Allocation**
     side by side; at the far right, the **five-year totals** of each; at the bottom of each block,
     the **column totals**.
  5. **The PPBE cycle** the figures come from, named at the top of the tab and on each block.
  6. Every appropriation, every time the report is pulled.

##### What the code does today (read 24 Sep, v1.84)
- 📚 FYDP ▾ → 📊 Five-year spend plan… and ⬇ Export ▾ → 📊 FYDP Spend Plan (Excel) print **the open
  appropriation only**, from one source (the working plan, or a locked PPBE cycle), in three sheets:
  By Requirement (PMO groups, CCaR as a column), By PMO, By Service. Per year: Requirement,
  Allocated, Funded, Unfunded (and the ACE estimate when one is chosen).
- There is **no per-PMO tab** and **no grouping by CCaR record**.
- **Locked cycles** are stored for all four appropriations, so a locked cycle can be read for every
  appropriation. **The working plan** is computed only for the appropriation on screen; the other
  three would have to be computed without switching the board.

##### How it would work (proposed; say if any of it is wrong)
- **Added to the existing workbook**, after By Requirement / By PMO / By Service, which stay as they
  are: one sheet per PMO, in the board's PMO order.
- **Allocation** is the board's *Allocated* figure for that year — what the RECORD panel shows as
  ALLOCATED (discretionary + mandatory for a requirement on Split). Funded and Unfunded stay on the
  existing sheets.
- **Source:** whatever is chosen in 📊 Five-year spend plan — the working plan (with its PPBE tag, and
  the reference cycle if one is set) or a locked cycle. With a locked cycle chosen, an appropriation
  that has no lock under that cycle says so in its block rather than quietly printing the working plan.
- **A requirement with no CCaR record** is listed under *No CCaR record* at the end of its block.
- **A year the source does not hold** prints an em dash, never 0, and stays out of the totals (the
  existing report's rule).
- **No grand total across appropriations** on a PMO tab: the money in the four blocks is not the same
  kind of money. Say if you want one.

##### Can't-fail checks for the build
- **Ties to the dollar:** for every PMO and appropriation, each year's Requirement and Allocation
  totals on the PMO tab equal that PMO's subtotal on the appropriation's own By PMO sheet; each
  record line equals the sum of the requirements under it; each row's five-year total equals its
  years; each block's bottom line equals its rows.
- **Nothing moves:** computing the other appropriations never changes any appropriation's stored
  plan, the one on screen, or anything the board saves (byte-for-byte before and after).
- **Every requirement appears exactly once**, under its own PMO, appropriation and record.
- Mutations for each of the above, and the full math gate.
- **Help and training:** a slide for the portfolio team (Session B, the products) and a line in the
  road-show notes.

### v1.84 — 24 Sep 2026: items 4, 5, 6 and 7, built together on Brad's "go"

What shipped differs from the log in two places, both stated here:
- **The UPL mark stays with the portfolio team.** It turned out to be the funding realignment's own
  marker, keyed by funding pool rather than by requirement, so it is not a field of the requirement.
- **The minimum useful increment now travels** (it was deliberately held back before v1.84), because
  the owner asked for every field except the allocation.
- **Also fixed on the way:** an appropriation package's preview could say "nothing changed" when it
  would replace notes, descriptions or record fields; it now names every container that differs.

#### 4. A PMO copy still offers Save and says "unsaved changes"
- **Logged:** 23 Sep 2026, found while checking the PMO guide against a v1.83 grid copy; Brad
  asked for it to be logged.
- **What an office sees:** the header of a PMO copy shows `💾 Save` and "• unsaved changes" as soon
  as anything is edited, and the line under the toolbar says "Make changes and 💾 Save to pass it
  on". Pressing Save (or File ▸ Save a copy…) is refused with "Saving to the shared file is turned
  off here". The refusal is right; the invitation to press it is wrong, on the one copy whose only
  way out is ✉ Submit input.
- **What is needed:** on a PMO copy, the header and the status line point to ✉ Submit input (and
  say the work is kept in this browser), never to Save. The portfolio board is unchanged.
- **Until then:** the PMO guide tells offices to expect the Save button and ignore it.

#### 5. A refused appropriation switch leaves the box showing the other appropriation
- **Logged:** 23 Sep 2026, same check; Brad asked for it to be logged.
- **What an office sees:** on a PMO copy, picking another appropriation in the Appropriation box is
  refused ("This PMO copy holds the O&M portfolio only …"), as it should be, but the box keeps
  showing the name picked (say FULL FUND) while the board underneath is still O&M.
- **What is needed:** after the refusal the box shows the copy's own appropriation again.
- **Until then:** the PMO guide says to refresh the page if the box shows the wrong name.

#### 6. The PMO copy does the legwork: every field but the allocation, the office's own ranking, new requirements
- **Logged:** 24 Sep 2026, Brad: *"For the sandbox, I need them to be able to add requirements for the
  PMO, prioritize within their PMO, and be able to edit all available items within the requirement
  except for the discretionary and mandatory allocations. I need them to be able to send me completely
  updated requirements. We can always update in the master live file but I need them to do most of
  the legwork."* Help files and training are updated in the same version.
- **Decided 24 Sep (Brad):** the decision band and ★ Mission Critical travel like any other field.
  An accepted office ranking is **stored as that office's own ranking** on the live board; the
  master list changes only when the portfolio team moves rows by hand.

##### What the code does today (measured 24 Sep on a v1.83 grid PMO copy)
- A submittal carries **8 fields**: description, impact if not funded, note, requirement value by
  service, CCaR record, PID, CCaR record name, MIPR type. Everything else an office edits in its copy
  is kept in the copy and not sent (the PMO guide says so).
- **Adding a requirement** already works: it travels whole as a proposal once its mandatory fields
  are filled (v1.7x, backlog #1).
- **The office's own ranking** can be changed in the copy (🏢 PMO ▾ → your office, then drag) and is
  never sent.
- **DISC and MAND** can be typed in the copy and are not sent, so an office can believe it edited an
  allocation it did not.
- **A promise the board does not keep:** in office view the hint says "⇪ Apply PMO Ranks syncs it
  when you choose". There is no such control in either build, nor anywhere in the repository's
  history. With "store it only" decided, the hint is simply wrong and is reworded.

##### What travels in v1.84
| Field | Store | Today | v1.84 |
|---|---|---|---|
| Description, impact, note, requirement value, CCaR record, PID, record name, MIPR type | desc, cons, notes, asks, ccar, pid, recNames, mipr | sent | sent |
| Title / plan event | titles | kept in the copy | **sent** |
| PMO (reassigning a requirement) | grp | kept | **sent** (scope by the office that owned it when the copy was published, so a hand-over is not dropped as "another office's") |
| Prime contract / OGC | ptype | kept | **sent** |
| Obligation category | obCat | kept | **sent** |
| WBS | wbs, clinWbs | kept | **sent** |
| RCN / EEIC | rcnAsg, rcnSvc | kept | **sent** |
| Navy SI code | si | kept | **sent** |
| Goes to / which awards to | dest | kept | **sent** |
| Cost element (Full Fund) | costElem | kept | **sent** |
| BAE budget, per service and lane | budgetAsg | kept | **sent** |
| Award / obligation date, CR half-month | awards, crHalf | kept | **sent** |
| Minimum useful increment | minInc | kept | **sent** |
| UPL mark | upl | kept | **sent** |
| Decision band | band | kept | **sent** (decided 24 Sep) |
| ★ Mission Critical | mc | kept | **sent** (decided 24 Sep) |
| The office's own ranking | pmoOrder[office] | kept | **sent**; applied as that office's ranking only |
| **Discretionary and mandatory allocation** | alloc, fsrc | kept | **locked in the copy, never sent** |
| Prime CLIN drill (allocation to CLINs) | clinAlloc, clinMeta, clinNew, clinRm | kept | not sent: allocation, and the CLIN grid feeds nothing |
| Shortfall absorber, ACE mapping | absorber, aceMap | kept | not sent: funding mechanics and the portfolio's reconciliation |

##### How it works, end to end
1. **In the copy**, every field above is editable on the office's own requirements, and on new ones.
   DISC and MAND show read-only, labelled as the portfolio team's allocation.
2. **The submittal** carries each changed field with the value it had when the copy was published
   (so a conflict can be seen), plus the office's ranking when it changed, plus new requirements whole
   with every field.
3. **Submittal review** shows each field beside the board's current value, ticked field by field as
   today. The ranking is one row: the office's order before and after, applied as a whole.
4. **✔ Apply** writes only the ticked fields. The allocation stores are never written by a submittal.

##### Can't-fail checks for the build
- Round trip: every field above, set in a copy, arrives in review with the right before and after
  values and lands exactly on apply, on both builds; a conflict is flagged for each.
- A maximal submittal (every field, every requirement, a new ranking, a proposal) never changes a
  single allocation value (alloc, fsrc), and applying the ranking never moves the master order.
- An untouched copy still submits nothing ("Nothing to send yet").
- New mutations for each new field and for the allocation lock; the full math gate as always.

##### Help and training, same version
- PMO copy guide (web page and PDF): steps 4 and 5, "What travels", troubleshooting.
- Road-show deck: Session A slides on what you send back, the Lead Financial Manager checklist,
  "What travels"; Session B slides on review, and ranking.

#### 7. Take one appropriation back from a consolidated file
- **Logged:** 24 Sep 2026, Brad: *"I sent my O&M Lead the consolidated file and he is updating the
  O&M section. I need to be able to import only the O&M data when he's done."*
- **What the code does today (tested 24 Sep, v1.83 grid, example data):** ⬅ Import a previous board…
  on a consolidated `.html` seeds **all four** appropriations from that file. Measured: a Full Fund
  change made on the owner's board after the file went out was **replaced by the Lead's copy** of
  Full Fund. The only warning is the general "This REPLACES everything on this board" confirm.
  Execution data, cost estimates, the reprogramming log and locked cycles follow their own merge
  rules and were not the problem.
- **Works today, no change needed (tested the same way):** the Lead, in his consolidated copy,
  uses 📁 File ▾ → 🔁 Appropriation packages… → ⬆ Issue on the O&M row, and sends the `.json` it
  saves. Importing that on the owner's board replaced **O&M only**, after a preview of every change;
  Full Fund kept the owner's later edit, and execution, cost estimates and the reprogramming log
  were untouched. Caveat: it takes the Lead's O&M whole, so O&M edits the owner made meanwhile are
  replaced (the preview lists them). The button is named for the other direction ("Issue"), which
  is why this needs doing properly.
- **What is needed:**
  1. Importing a consolidated `.html` asks **which appropriations to take**, one tick box each, with
     the same per-appropriation preview a package gets; nothing ticked by default, and appropriations
     not ticked are left exactly as they are.
  2. The Lead's side gets a clearly named **⬆ Send this appropriation back…** in a consolidated
     copy, carrying what the appropriation looked like when the file was sent, so the owner's board
     can say which of its own changes would be replaced (the check a return package already has).
  3. Tests: a whole-file import with one box ticked changes only that appropriation, byte for byte;
     the other three, the BAE list, execution, cost estimates, reprogramming and cycles are
     unchanged; a conflict is flagged when the owner changed the same appropriation meanwhile.
- **Help and training:** add the hand-off to the road-show deck (Session B) and a short note in the
  help for appropriation leads.


### v1.83 — 23 Sep 2026: items 2 and 3, built together on Brad's "go"

#### 2. Spend Plan Source: full, verbatim BAE budget names, assigned automatically
- **Logged:** 23 Sep 2026, Brad. Photos of a Spend Plan Source export and of BAE names (USAF O&M,
  Marine Corps Full Fund, Spares, Modifications and O&M) are **examples only**: the logic must work
  from the structure of the names in whatever BAE file is imported, all 697 of them.
- **What Brad sees:** the Budget column says `USAF O&M`, `ANG O&M`, `USMC STOVL O&M`, `USN O&M`.
  CCaR rejects anything that is not the budget's name exactly as the BAE file spells it.
- **What Brad needs:**
  1. The full BAE name, verbatim, on every Spend Plan Source line, for O&M, Full Fund, Spares and OPN.
  2. Assigned automatically from the requirement's **service**, **lane** (discretionary dollars to a
     Discretionary budget, mandatory to a Mandatory one) and **PMO**.
  3. A requirement funded from both lanes gets **two lines per service**, one per lane.
  4. **Import the BAE once.** The list stays in the saved board and is there on every appropriation.
  5. **No BAE loaded: Budget left blank, with a warning** (decided 23 Sep), never a made-up name.
  6. **CONG and BOS only by hand** (decided 23 Sep); everything else automatic where it can be.

##### What the code does today (read and measured 23 Sep)
- **The BAE list is not kept across appropriations.** The import keeps every appropriation's names,
  but stores them in the open appropriation's own store. Switching appropriation reloads the board
  with a different store, so a list imported on O&M is absent on Full Fund, Spares and OPN, and the
  export falls back to made-up names. That is the reloading Brad has been doing. Nothing in the
  round-trip fuzz or the suites checks that the list survives a save.
- With no BAE loaded, the export makes a name up per service (`USAF O&M`).
- With a BAE loaded, a name is filled in only when exactly one fits. Rollup headings count as fits,
  CONG / BOS count as fits, and the lane only narrows when a requirement is wholly one lane — so it
  almost never gets to one: 3 or 4 fits in every O&M case tried, 6 to 10 on Full Fund.
- It misreads `USAF O&M NON AFRC NON ANG` as an ANG budget ("NON ANG" contains ANG).
- A requirement drawing both lanes gets one line per service, not one per lane.
- The BAE spelling is not uniform, so names are copied, never built: `O&M - ` / `O&M- ` / `O&M -1A9A`,
  `MxS` / `MXS`, `Full Mission Sims Discretionary TSS` on STOVL beside `Full Mission Sims TSS` on CV.

##### The rule (structural, no list of names in the program)
Every name reads as *service + appropriation + funding line + [Discretionary | Mandatory] + PMO*.
1. **No PMO in the name = a legacy budget, never usable** (decided by Brad, 23 Sep). It is never
   offered, never auto-assigned, and never taken over from last year's choice or from the CCaR pull:
   a requirement that arrives pointing at one is flagged for a fresh pick. Examples:
   `USAF O&M - ANG CAM`, `USAF O&M- BOS`, `USMC STOVL APN Spares Initial`, `USMC STOVL O&M -1A9A`,
   `USN APN Full Fund SUPT PES USN CV`. The PMO is read as the last word of the name
   (AV, MxS, PP, PSM, TSS, CDS, BOP, ATL, any case).
2. **Hand-pick-only lines:** CONG, BOS, OCO, Withhold and Spares **TrngDev** (all decided by
   Brad, 23 Sep). Never
   chosen automatically, never taken over from last year or the CCaR pull; offered only when
   Brad picks by hand.
   **Out of scope entirely:** Modifications, RDT&E and Flyaway budgets (decided 23 Sep). They are
   never offered, as today.
   **Spares TrngDev is part of the Spares board** (decided 23 Sep): a separate, low-dollar pot.
   Today the board ignores those names; they must be read as Spares budgets
   (`USMC STOVL APN Spares TrngDev AV`, `... TrngDev PP`, `... TrngDev TSS`) and offered by hand,
   so an ordinary Spares requirement still goes to its *Spares Initial* name automatically.
3. **Service, PMO, then lane exactly;** where the office's names carry no lane, its one lane-less
   name takes both lanes; where no name fits, the line is flagged, never guessed.
4. **The funding line.** O&M: CAM (hand-pick lines aside). **Full Fund: the requirement's cost
   element, one to one** (decided by Brad, 23 Sep). The board already holds a cost element per Full
   Fund requirement and carries it forward each year; a fixed table ties each of its cost elements
   to the words the BAE names use (all rows confirmed by Brad, 23 Sep):

   | Cost element on the board | Funding line in the BAE name |
   |---|---|
   | Airframe PGSE | Airframe PGSE |
   | Engine PGSE | ENGINE PGSE |
   | Avionics PGSE | Avionics PGSE |
   | Peculiar Training Equip | PEC TRNG |
   | Full Mission Simulators | Full Mission Sims |
   | Pubs/Tech Data | PUBS/TECH DATA |
   | Other ILS Production | OTHER ILS |
   | Fixed JPO Support | FIXED JPO SUPT POA |
   | Depot Standup Software | Depot Software |
   | Depot Standup Air Vehicle | Depot Standup (the PMO picks AV, PP or PSM) |
   | Depot Standup Propulsion | Depot Standup (the PMO picks AV, PP or PSM) |
   | JRE | the BAE line that names JRE, once one exists (CDS JRE requirements start next year); until then a JRE requirement is flagged for a hand pick |
   | **Production Engineering Support** *(new, #8 in the list)* | PES |

   Matching ignores case and spacing. A Full Fund requirement with **no cost element** is flagged to
   have one set, not guessed. Anywhere a line is still open after this (a new appropriation's
   pattern, say), the fallback is the line CCaR already files the record under, then last year's
   choice, then a one-time pick from only the lines that exist for that service and PMO.

**Measured on every example name sent (20 cases, the legacy rule applied):** 16 resolve to exactly one name with nothing
chosen — all USAF O&M, all Marine Corps O&M, Spares, and Full Fund BOP. For example:
ANG discretionary AV → `USAF O&M - ANG CAM Discretionary AV`; ANG CDS → `USAF O&M - ANG CAM CDS`;
STOVL O&M PSM → `USMC STOVL O&M -1A9A AT ATF Discretionary PSM`; STOVL Spares PP →
`USMC STOVL APN Spares Initial Discretionary PP`. With the cost element added (rule 4), **all 56 service + PMO +
cost element combinations in the Full Fund examples resolve to exactly one name**, e.g. STOVL PSM
on Other ILS Production → `USMC STOVL APN Full Fund SUPT OTHER ILS Discretionary PSM`, CV TSS on
Full Mission Simulators → `USN APN Full Fund SUPT USMC CV Full Mission Sims TSS`, STOVL BOP on Fixed
JPO Support → `USMC STOVL APN Full Fund SUPT FIXED JPO SUPT POA Discretionary BOP`. One (CV Spares PP) found none because the photo shows only its CONG
name; with the whole file it will find the ordinary one, or flag it.

##### Proposed fix
1. **Keep the BAE list once, for the whole board:** stored beside the appropriations rather than
   inside one, written into the saved file, read by every appropriation. A board saved with the old
   layout is moved over when it opens, so a list already imported is not lost.
2. Apply the rule above; read `NON AFRC NON ANG` as the active Air Force. Add **Production
   Engineering Support** to the board's cost elements as **#8, right before Fixed JPO Support**
   (Brad, 23 Sep; the name confirmed as *Production*, not Program), matched to `PES`. The list becomes: 1 Airframe PGSE, 2 Engine PGSE,
   3 Avionics PGSE, 4 Peculiar Training Equip, 5 Full Mission Simulators, 6 Pubs/Tech Data,
   7 Other ILS Production, **8 Production Engineering Support**, 9 Fixed JPO Support, 10 Depot Standup
   Software, 11 Depot Standup Air Vehicle, 12 Depot Standup Propulsion, 13 JRE. A requirement's cost
   element is saved by name, not number, so no existing choice moves; only a number typed into the
   cost element prompt follows the new order (checked 23 Sep: that prompt is the one place the
   board reads the list by position). A board saved before this loads unchanged.
3. Split each service's line by lane in the Spend Plan Source, each with its own budget, keeping the
   dollars whole — the lines still add to the funded total, held by the trace matrix and a mutation.
4. Print the name exactly as the BAE cell holds it (the leading indent trimmed, nothing else).
5. No BAE loaded: Budget blank, and a warning before the export.
6. Before export, list every line still without a budget, so nothing reaches CCaR blank by accident.
7. Tests: the round-trip fuzz fills the BAE list and proves it survives save, reopen and a switch of
   appropriation; the audits check the rule's picks and the lane split; mutations prove each check bites.

##### Needed before building — nothing; every question answered 23 Sep
1. ~~OCO and Withhold~~ — answered 23 Sep: by hand only.
2. ~~Modifications, RDT&E, Flyaway~~ — answered 23 Sep: stay out.
3. ~~Spares TrngDev~~ — answered 23 Sep: part of the Spares board, a low-dollar pot, by hand only.
4. ~~Full Fund default~~ — answered 23 Sep: the budget follows the cost element, one to one.
5. ~~Cost element table~~ — answered 23 Sep: Depot Standup Software → Depot Software; both Depot
   Standup cost elements → Depot Standup, with the PMO choosing AV, PP or PSM; PES is **Production
   Engineering Support**, a cost element the board is missing and gains in this version; JRE
   requirements (CDS) start next year, so JRE follows the BAE line that names it once one exists.

#### 3. Two Spend Plans: list every requirement, including the ones neither plan funds
- **Logged:** 23 Sep 2026, Brad, with a photo of requirement #98 of 151: FY27 requirement $50,000,000
  (USMC-B $21M, USMC-C $4M, USN $25M), allocated $0, unfunded $50,000,000, MC shortage, band 7.
- **What Brad sees:** #98 does not appear in the Two Spend Plans list or its export. It looks as if
  requirements are being skipped.
- **What the code does (read and tested 23 Sep):** the list keeps a requirement only if at least one
  plan funds some of it. A requirement funded under neither plan is dropped from the on-screen
  panel, both plan sheets and the A-vs-B sheet, with no line naming it. On a test board with three
  requirements, one of them wholly unfunded, both sheets list two, and the TOTAL line reads
  "2 of 3 requirements (1 ask for nothing and are in neither plan)". **That label is wrong:** the
  dropped requirement asks for money; it just gets none. No column shows a requirement's full value
  or its unfunded amount, so the list cannot show what is left unfunded. Its "Not covered" figure
  counts only allocated dollars a plan ran out before reaching.
- **Proposed fix:**
  1. List **every requirement**, in the board's priority order, on the screen panel and on all three
     sheets. One funded by neither plan is marked **NOT FUNDED — either plan**.
  2. Add **FY27 Requirement** and **Unfunded** (requirement minus what that plan funds) to every row,
     and an **UNFUNDED** line in each sheet's summary that ties to the board's own unfunded total.
  3. The TOTAL line counts all of them ("151 of 151 requirements") and names the unfunded ones
     correctly.
  4. A **Not funded** filter in the panel, beside the existing moved / cut / partial ones.
  5. Tests: an audit check that every requirement on the board appears on each sheet, a trace-matrix
     link for the new unfunded figure, and mutations that drop a row or restore the old label, so a
     skipped requirement can never pass silently again.
- **Needed before building:** nothing. Unfunded requirements stay **in rank order**, as on the board
  (decided by Brad, 23 Sep).

