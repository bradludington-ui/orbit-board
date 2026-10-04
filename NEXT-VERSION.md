# Next version — queued changes

Changes are logged here as they come up and built together as ONE version when Brad says **go**.
Nothing on this list touches the board until then. On go: build every open item, run the full
math gate once, bump the version once, push once, and move the items to *Shipped* with the version.

Current version: **v1.95**. Next: **v1.96**.

## Open

#### 61. Reconcile the pre-launch review's own report and evidence
- **Logged:** 3 Oct 2026, from Codex's scope review. The review's report and its attachments never reached the
  session that built v1.95; every finding was reproduced from the handoff's description. Before any finding is
  called closed, obtain the report and the attachments and reconcile them against items 47–60.

#### 62. The money map's nine open cells (deferred by Brad, 3 Oct 2026)
- Two Spend Plans × service, requirement and lane; the ATR/BTR log × appropriation, year and service; Funds Flow ×
  appropriation and year; the ACE tie-out × year. Each is listed in `tools/money-map.md` until it is built.

#### 63. Found while building v1.95, not built
- *(The repaired-award test gap is now item 64.)*
- **Two people sharing different cost estimates under one name at the same instant** can both write: a file share has
  no atomic create. The re-read after the replace question narrows it; it does not close it.
- **A cost estimate kept in the folder's history** is not offered in ↶ Earlier copies; putting one back is a rename in
  the folder.
- **An office's month in a shared requirement** can sit about a dollar from its exact share (the office's total and
  the requirement's months are exact) -- the price of whole dollars that add up both ways.

#### 64. The browser checks reach the repaired-award controls
- **Logged:** 4 Oct 2026. Brad: "Log the repaired-award test gap for v1.96". It was the first point of item 63.
- **Why:** v1.95 added two controls that appear only when an award was repaired on opening: **✓ Checked** in the
  award block, and the **🔧 awards repaired on opening** list under Needs attention. The board the keyboard and
  standards checks load (`buildPopulated` in `tools/ia-fixture.mjs`) holds only awards that read cleanly, so
  neither control is ever on screen there: nothing checks that the keyboard reaches them, that they have a name,
  or that they meet contrast and target size. The jsdom suites test what they do, not how they are reached.
- **What:** give that fixture awards repaired on opening -- one SPLIT INFERRED, one NEEDS REPAIR -- so both controls
  are drawn, and have the keyboard and standards checks require them by name, so the checks fail if a later change
  stops drawing them. Proven by the checks failing to find the controls on v1.95's fixture. The board is not
  expected to change; anything the checks find in the controls is fixed under this item.

#### 65. Shorter menus, grouped by the job, with groups that open in place
- **Logged:** 4 Oct 2026. Brad: "Review our drop down menus. The list of selectable items is long. I need them grouped
  together in a meaningful way. I also open to having dropdowns within dropdowns"; then, on the mock-up, "Go with your
  recommendations, log it as item 65". Mock-up: https://claude.ai/artifact/FGpvyfLAV9CZ3vfbzC7eaK (private).
- **Why:** measured on v1.95 by `npm run ia:census`: 103 items in 9 menus. Reports & exports shows 25 at once, Setup 19,
  📁 File 15 and Filter 13. Reports & exports is grouped by file type, so one subject is split: CR Cash Needs is a
  "view" and its 1A9A return a "data export"; Reprogramming Actions is a view and the ATR/BTR log an export. Set base
  year and Reset FY27 are on two menus each; Funding realignment and WBS from execution data sit under Setup ›
  Maintenance, away from the year and the data they work on.
- **Decided (Brad, 4 Oct):**
  1. A group opens **in place**, under its heading, pushing the rest of the menu down. No side fly-outs; two levels
     at most.
  2. **One group open at a time.** A menu reopens on the group used last, remembered in this browser only, like the
     colours, never in the file.
  3. **One home for each action:** Set base year, Reset FYxx to blank and Funding realignment live on the year menu
     only; WBS from execution data moves to Data.
  4. **A Find box** at the top of Reports & exports narrows every group at once as you type.
  5. **The group names** are the mock-up's.
- **The menus** (rows on screen when a menu opens, today → proposed):
  - **Reports & exports** (25 → 7, plus Find): ✈ Pre-flight check… on top, then folded: *Spend plan & cash — FYxx*
    (Spend Plan Forecast, Two Spend Plans, CR Cash Needs, CR Cash Return (1A9A)) · *Briefing* (Excel Workbook — full
    breakouts, PowerPoint deck, Executive Decision, Exec Synopsis (CSV), Priority Drill by Band) · *Five years & PPBE*
    (Five-year spend plan, FYDP Spend Plan (Excel), PPBE Budget Positions, Cycle Comparison (Excel), Spruills) ·
    *Execution & reprogramming* (Active Year Execution, Reprogramming Actions, ATR/BTR Log (Excel), Funds Flow) ·
    *CCaR & accounting files* (Spend Plan Source (Excel), IDS Batch Import, Chart of Accounts (Excel), ACE Tie-Out
    (Excel)) · *Companion tools* (the linked tool and Change the linked tool).
  - **Setup** (19 → 3): folded *Who and where* (Services, PMOs, Destinations) · *Codes and structure* (Bands, Chart of
    Accounts, RCN / EEIC, Special Interest codes) · *Appearance — yours only* (the five colour themes and three
    densities; its heading shows the theme and density in use).
  - **📁 File** (15 → 6): 💾 Save and ⬇ Save a copy… on top, then folded *Program offices* (Publish PMO copy, Review
    submittals) · *Writer and team* (Take the pen, My editor name, Live view, Change journal, Save history) · *Boards
    and appropriations* (Import a full board, Export one appropriation, Import one appropriation, Import several
    boards at once, Appropriation packages); 🩺 Save diagnostics… at the foot.
  - **Filter** (13 → 3): ☰ By-service detail on every row on top, then folded *Funding* (Fully discretionary only,
    Spilling into mandatory, Any unfunded portion, Set higher than it draws, Mission Critical only) · *Service —
    funded requirements only* (Any service, then each service by name from the board's own list; the six labels lose
    their "— funded requirements only", which the heading now says once). A group holding a filter that is on opens
    by itself.
  - **The year menu** (8 → 9, not folded): the five years, then *Across the years*: Roll requirements forward, Funding
    realignment, Set base year, Reset FYxx to blank.
  - **Data** (8 → 9, not folded): *Execution — CCaR* gains WBS from execution data.
  - **Unchanged:** the All offices picker, Spend plan basis, Review tools and a row's ⋯ menu.
- **Rules for any menu, now and later:** more than about ten items folds into groups; ten or fewer stays one list with
  headings; a list of choices (the offices) never folds. Each folded heading shows how many items it holds and, where
  it is a choice, what is chosen. Items are grouped by the job they serve, with an on-screen view beside its export.
- **Keyboard and screen reader:** a group heading is a button carrying `aria-expanded`; Tab reaches it, Enter or Space
  opens it, Tab goes on into its items, Esc closes the menu and leaves you on its button. Every menu still opens
  whole on screen (v1.93, item 43).
- **What it touches:** the shared menu builder; the Help guide's menu paths gain their group (for example
  `Reports & exports ▾ › Spend plan & cash › 📅 Spend Plan Forecast…`); the checks that open every menu
  (`keys`, `dropdowns`, `standards`, `menus`, `ia:census`) open every group and fail if any item cannot be reached;
  mutations that aim at menu markup are retargeted; the Field Guide, its PDF and the deck after merge. No figure,
  export or saved file changes.
- **Proven by:** every one of the 101 items reached through its group by the keyboard; the rows on opening as above;
  Find listing matches from every group; Set base year and Reset FYxx each reachable from one menu only; the menu
  paths in the Help guide all resolving. 103 items become 101 because the two duplicates go.

## Later

Logged and kept, but not in the next version. Each needs Brad's go again when its time comes.

#### 19. One way to tell the user something
- **Logged:** 29 Sep 2026, same source. **Deferred by Brad, 29 Sep 2026:** not in v1.88.
- **Why:** the board speaks in three ways -- 243 status-line messages, 77 pop-up alerts and 73 confirm
  prompts -- and in v1.86 an import's report was overwritten by a later message before anyone could
  read it.
- **What:** one helper for status-line messages that keeps an important one (an import's result, a
  refusal, a warning) until it is read, instead of letting the next message replace it; import and
  export failures also written to the change journal. **Confirm prompts stay exactly as they are** --
  they are the data-loss guards and must keep stopping the user.

#### 20. One place for each field's name and label
- **Logged:** 29 Sep 2026, same source. **Deferred by Brad, 29 Sep 2026:** not in v1.88.
- **Why:** v1.86's renames (Impact statement, Description & note, Requirement edit) had to be made in
  pop-up titles, row chips, menus, the field list, the proposal gate and messages separately, and a test
  went hollow when one name changed in one place and not another.
- **What (first slice):** the requirement's own fields -- the written fields and the Requirement edit
  fields -- get one registry of name and label that the panel, pop-ups, submittal review, proposal gate,
  messages and the in-file guide all read. A test fails if any of them spells a field's label itself.
  Later versions extend it as fields are touched, never as a big-bang rewrite.

#### Considered and not recommended
- **Rewriting the board into separate modules**, and **making the money engine take its inputs as
  arguments**: worthwhile later, once there is one file, as a version of its own.
- **Drawing only the visible rows (virtualization):** a board of ~115 requirements redraws fine; it
  would add risk to keyboard use, screen readers, drag-to-reorder and the exports. Only if lag is seen,
  and measured first.
- **A formal data model and rewrite** (the engineering review's #4): no. It would put the data and the
  math at risk with nothing visible to show for it. The change journal, stable ids and separate state
  for the live board, copies and submittals already cover what it asks for.
- **Failure-safe storage and money tests** (the review's #3 and #5): already in place, and more
  thoroughly than asked -- storage failures are reported and the file is the record; money is whole
  dollars, every printed total is reconciled against its rows, and 485 planted mistakes must be caught.

#### From the 29 Sep technical review: not built, and why (Brad's answers, 30 Sep)
- **Faster redraw for very large boards** (a quicker requirement lookup, redrawing fewer rows): not
  needed. Brad: an appropriation's fiscal year holds at most 200 requirements. Measured in the browser,
  500 redraw in about half a second after an edit; 5,000 would take 5-7 seconds, which is where this
  would matter. Revisit only if that limit changes.
- **The first save named "unknown" in the packaged desktop app:** not built. Brad: nobody uses the
  desktop app, only the HTML file, and in a browser the name is asked before the first save is stamped.
- **Card-era rendering still in the grid:** the review called it retired code; it is the grid's only
  row template, trimmed after drawing, and costs about 2% of a large redraw. It stays the separate
  clean-up version already noted in CLAUDE.md.
- **The moment between checking the file and writing it:** real, but milliseconds long, and the browser
  offers no way to close it. Item 23 covers the case that loses work.
- **Replacing all 106 empty error handlers:** no. Items 23 and 26 fix the ones that could hide lost work
  or wrong figures; the rest guard cosmetic steps.
- **Very large boards refused by the import check:** not an issue. The board's own save of 5,000
  requirements is 4.4 MB, and the check takes files up to 64 MB.

## Withdrawn

### 1. PIDs show up in the CCaR column of the Excel workbook
- **Withdrawn 23 Sep 2026 by Brad:** the PID is in the right column now. No change.
- What testing had shown, kept for the record: the export places the CCaR number and the PID in
  their own columns on every sheet, including a requirement with a PID and no CCaR number.

## Shipped

### v1.95 — 3 Oct 2026: items 47–60, the pre-launch review, built on Brad's "go"

**Saving is exact, one at a time, and one person's.** A save records exactly what it wrote: an edit made while it
writes stays unsaved until the next Save. Saves never overlap, in one tab or several, and a save waiting behind another
never moves to a different year's copy. Each board file records its writer; anyone else's Save is refused and names
the writer, and ✍ Take the pen… hands it over. The guarantee is the folder's permissions -- give the shared file to
its writer alone.

**Nothing is lost on the way in.** A full import is all or nothing; if browser storage refuses part of it and the
rest cannot be put back, the board says which lists hold what, offers both boards as files, and refuses to save over
the board file until you say so. Sharing a cost estimate never writes over a different one, or one it could not read.
Work kept aside is never replaced without asking, and can be saved as a file. An award arriving in a file is checked
at the door; a saved board you open is never refused and never loses an award -- a damaged one is repaired, listed in
Needs attention, and its original kept. An office's submittal lands each award on the right service by name, and
applies only to the year it was written for.

**The math, by year and to the dollar.** The PMO drill reads each year through the board's own allocation, under the
PMO that year assigns -- and so do the five-year plan and the cycle comparison (Brad: "leave the PMO assigned by
year"). The journal keeps years apart. Every workbook stores exact figures. The Spend Plan Source dates each increment
on its own day, a prime's CLIN lines are whole dollars, and a requirement shared between offices counts at each
office's share in whole dollars that add up. A money map records, for every figure on screen and in every export,
which of seven dimensions are proven to the dollar; nine cells are open by Brad's decision (item 62).

**What moves on boards in use today.** Workbook figures change only where they were wrong: office shares of a
requirement split between offices (now whole dollars), a prime's CLIN lines (whole dollars), incremental awards on the
Spend Plan Source (a line per increment), the five-year plan and the cycle comparison for a requirement that changed
PMO between years (each year under its own PMO), and the PMO drill (the board's own allocation). Every total is
unchanged. An award a file holds that cannot be read is now listed as needing repair, its cash UNSCHEDULED, where v1.94
placed or zeroed it silently.

**The final check** passed on the final tree, 3 Oct 8:06–10:24 pm Eastern: **137.9 minutes**, every stage clean — the defect register (13 defects, 43 mutations), money coverage (26 of 26 surfaces), the new money map (329 cells: 114 proven, 206 not applicable, 9 open by Brad's decision), the trace matrix (92 cells), all eight suites, every browser check, the fuzz (seed 819798525) and the file verifier — and **all 849 planted mistakes caught** (11 more change nothing by design, as before): v1.94's 728 plus 132 new, 30 retargeted. It took three runs. The first (9:33 am – 12:49 pm) caught 840 of 841: `excel-unf-vec` survived because F4 moved the PMO tabs onto `pmoPartsOf`, leaving the line it changes read by nothing. The dead vector was removed and the mutation retargeted to the live split (presweep 1 of 1). The second (12:54–3:19 pm, 145.1 minutes) passed, 841 of 841. An independent review before merge then found four ways round the new save and import rules ("Found by the review before merge" under items 48, 50 and 58); with them fixed and 8 more mutations, the third run is the one that counts. Each is the same single `npm run validate:math`, run past the two-hour limit on background jobs with Brad's agreement.

**Pre-launch review, 3 Oct 2026.** Brad commissioned an outside review of the whole program before
launch (Codex), on two priorities: no silent data loss, and correct math on screen and in every export. It
reported twelve findings (R01–R12) and one launch issue, and recommended holding publication. Every one was
reproduced on v1.94 (main `2fe4801`, the reviewed build), most of them wider than reported. The
reproductions are in the session scratchpad (`v195r/`); on go each becomes a regression test that fails on
v1.94. Items 47–59 below are the fixes, in the order of the review's priorities: saving and recovery
first, then identity and history, then math and validation.

**Brad's decisions, 3 Oct 2026:**
- **Q1, two people saving at once:** "go with recommendation". One writer per board file, enforced by the
  folder's permissions and by ORBIT (item 58).
- **Q2, the PMO by year:** "PMOs can change under reorganizations, leave the PMO assigned by year, as it's
  reported as that PMO in that year" (item 55).
- **R09's default, kept:** refused with a reason at the import doors; repaired and reported on opening a
  saved board, never zeroed (item 53).

**Codex's scope review, 3 Oct 2026** (forwarded by Brad with "proceed with the focused build after
incorporating these points"):
- The scope is sound, with corrections now written into items 47, 48, 50, 53 and 58.
- The money reconciliation the handoff asks for is a launch blocker until Brad narrows it explicitly
  (item 59).
- The review's own report and evidence files never reached this session. Before every review finding is
  called closed, they must be obtained and reconciled against these items.

#### 47. Saving acknowledges exactly what it wrote, one save at a time (review R01)
- **Logged:** 3 Oct 2026, from the outside pre-launch review Brad commissioned (Codex, R01). Reproduced
  on v1.94 (`scratchpad/v195r/A/r01.mjs`).
- **Found:** both Saves build the copy, wait for the disk, then mark *whatever is on screen by then* as
  saved.
  - **Saving to the file** (💾 Save): an edit typed while the file is being written is not in the file. The
    header still says Saved, and nothing marks the edit as unsaved. The next Save then wrongly warns
    "HOLD ON — Brad saved this file". If a colleague's newer file is opened later, the edit is replaced
    with nothing kept aside.
  - **Saving to the shared folder** behaves the same way. It also happens on the folder's own autosave
    while someone is typing. Afterwards the board wrongly reports "⛔ Brad saved …" and refuses further
    saves until the user picks a side.
  - **The worst case: a year switch while a folder save is running** wrote the FY27 plan into the
    **FY28** file. That file had not been read or checked, and no history copy was kept. A colleague's
    FY28 work then existed nowhere: not in the folder, its history, or their browser.
  - Two saves can run at once (the Save button during an autosave). If the earlier one finishes last,
    the file holds the older state while the board says Saved.
  - On a file holding several appropriations, Save remembers the wrong time and warns falsely after a
    colleague with a fast clock saved another appropriation.
- **What will be built:**
  - Every save fixes its appropriation, year, file name and contents before it waits for anything. When
    the write finishes, it records the time of *that* copy.
  - It marks the board saved only if nothing changed while it was writing. An edit made during the write
    stays unsaved and is saved next time.
  - One save runs at a time, whichever way it starts (the button, the autosave, "Save yours over theirs").
    A second press waits for the first.
  - **When a queued save starts** (Codex): before its first wait it captures its own target and bytes. It
    also re-checks writer authority and the collision check.
  - A queued folder save keeps the year it was asked for; a year switch never moves it silently to
    another year's file.
  - A failed write leaves everything marked unsaved, as it does today.
- **What does not change:** what is saved, the collision checks, the history copies and every figure.
- **Checks:** an edit, a year switch, a new year and a second Save each made *during* the write, on both
  paths. Each must:
  - reopen the actual written bytes;
  - check the unsaved marker, the next Save (no false warning) and a colleague's later save (the edit kept
    aside);
  - leave the FY28 file untouched when FY27 is being saved.

  Fails on v1.94; mutations for each guard.
- **As built:** a save captures the board's generation (`_saveGen`) and its bytes before it waits, and marks the board saved only if nothing changed while it wrote; one save runs at a time (`saveSerial`, and a browser lock across tabs); each save keeps the year it was asked for, and a folder save refuses rather than move to another year. Checks: `audit-import.mjs` "v1.95 — Save acknowledges exactly what it wrote" (the file, the shared folder).

#### 48. A full import is all or nothing (review R02)
- **Logged:** 3 Oct 2026, review R02. Reproduced on v1.94 (`v195r/B/r02-fullimport-quota.mjs`).
- **Found:** ⬅ Import a full board makes 10 writes to browser storage: each appropriation's plan, its
  locked cycles, BAE, execution, cost estimates, the reprogramming log and destinations. It never checks
  whether any of them worked. When the browser refuses one (storage full), it still says "Full board
  imported" and reopens. What the board then holds is one of:
  - the old board untouched;
  - the new plan on the old locked cycles, or the old plan on the new cycles;
  - one list (BAE, execution, cost estimates, reprogramming, destinations) still at the old version, or
    destinations holding old and new mixed.

  The next Save writes that mix into the file, and nothing on screen or in Save diagnostics says so.
- **What will be built:**
  - Everything is prepared and checked first.
  - What each key held before is kept, and every write's result is checked.
  - If any write is refused, every key goes back to exactly what it held, nothing reopens, and the board
    says: *Nothing was imported — browser storage refused <which>; this board is exactly as it was.*
  - **Two outcomes, kept separate (Codex):**
    - **Rollback succeeded:** every key is restored exactly.
    - **Rollback failed** (storage keeps refusing): the board says precisely which list is in which state
      and does not reopen. It keeps both the pre-import board and the incoming import recoverable, each
      offered as a file to save.
  - Also found: the cost-estimate and reprogramming lists save past the shared write helper, so their
    refusals never reach Save diagnostics. They go through it like every other list.
- **Checks:** the write at each of the 10 positions is refused once, and from there on. Every key must be
  byte-identical to before, nothing reopens, and the reopened board is the old one. Fails on v1.94;
  mutations.
- **As built:** `lsAll` writes the ten lists all or nothing, putting back newest first; memory changes only after every write lands. Put back: "Nothing was imported". Not put back: the board names which lists hold which, reopens nothing, and offers the board as it was and the file imported. **Added in integration:** while that mix stands, 💾 Save and the shared-folder save are refused -- a reload included -- until "allow saving again…"; ⬇ Save a copy never is. Before this, the next Save wrote the mix over the board file.
- **Found by the review before merge, fixed:** the ordinary ⬅ Import of a board file (`consTakeApply`) wrote one appropriation at a time and never looked at a write. It now records its writes and commits them through `lsAll`, all or nothing, with memory put back on a refusal; a refusal is reported as a full import's is. And an import that lands whole lifts the hold a stopped one set, once every list it left mixed has been written again.

#### 49. Sharing a cost estimate never writes over one it could not read, or a different one (review R06)
- **Logged:** 3 Oct 2026, review R06. Reproduced, and wider than reported (`v195r/B/r06-ace-push.mjs`).
- **Found:** Cost estimate · **share mine** writes every estimate to the shared folder. It treats a
  folder copy it could not read (locked by sync, no permission, half-synced) as no copy at all. It
  writes over a readable copy of a **different** approved estimate under the same name too, even after
  "check the folder" has just reported the clash. No history copy is kept, and the message is an ordinary
  "shared".
- **What will be built:**
  - Write only when the folder genuinely has no copy, or the copy is identical.
  - A copy that cannot be read is reported and left alone.
  - A different estimate is reported as a clash and left alone.
  - Replacing one is a separate, explicit choice that names whose copy it is, and keeps it in the folder's
    history first.
  - The message says which estimates were shared and which were not.
  - Also found: "check the folder" takes a folder estimate without checking its fingerprint, and says
    nothing when a file can't be read. It will check both and say so.
- **Checks:** absent, identical, different, unreadable (three ways), half-synced and refused copies. The
  folder file must be byte-identical whenever nothing should be written. Fails on v1.94; mutations.
- **As built:** share mine writes only where the folder has no copy; an identical one writes nothing; a different or unreadable one is named and left alone, with a separate "replace the folder's … with mine…" that asks by name, re-reads, and keeps theirs in the folder's history first. Check the folder verifies each estimate's fingerprint and names what it could not read.

#### 50. Work kept aside is never replaced without asking (review R07)
- **Logged:** 3 Oct 2026, review R07. Reproduced (`v195r/A/r07.mjs`).
- **Found:** the board keeps one copy of work it set aside ("kept aside, not lost"). The next time it
  sets work aside — opening a newer file, the folder's refresh, or "Load theirs" — it replaces that copy.
  The first work is then gone with no question asked. When storage is full, the board correctly refuses
  to load the newer copy; that part is fine.
- **What will be built:** if earlier kept-aside work has not been put back or discarded, the board does not
  load the newer copy over new work. It says so, naming the earlier kept work, and offers **Put it back**,
  **Save it as a file** or **Discard it** first.
  - On all three paths, both the existing kept copy and the current local work are preserved.
  - Kept work is removed only by an explicit Put back or Discard. Saving it as a file never removes it
    (Codex).
- **Checks:** the three paths with earlier kept work present. The earlier work must still be retrievable,
  or the newer copy not loaded and the message naming it. Storage-full refusals stay as they are. Fails on
  v1.94; mutations.
- **As built:** a second, different set of kept work is never written over (`'occupied'`); put back swaps what is on screen into its place; 📁 File › ⬇ Save work kept aside as a file… keeps the kept copy.
- **Found by the review before merge, fixed:** ↶ Earlier copies › Put this back replaced unsaved work unasked. It now keeps it aside first, as loading the folder's newer copy does, and puts nothing back when it cannot.

#### 51. A PMO submittal's awards are matched to services by name (review R03)
- **Logged:** 3 Oct 2026, review R03. Reproduced with a real copy → submittal → apply
  (`v195r/C/r03.mjs`).
- **Found:** when the copy lists its services in a different order from the board, taking its
  submittal reorders the requirement values by service name but **not the awards**:
  - Award cash lands on the wrong service and in the wrong CR half-month. Part of the funded money
    shows as UNSCHEDULED.
    - Observed: USN's $2,000,000 on 5 Oct showed as $1,000,000 for USAF in 1–15 Oct.
    - CR Cash Needs, the spend plan, the forecast and the deck are all wrong.
  - Proposed new requirements had the same problem.
  - The unchanged baseline wasn't reordered either, so the review warned of an overwrite that never
    happened.
  - The review shows an award change only as "incremental — 2 awards", so nobody could catch it.
  - A package carrying only awards gets no warning when it has no service list.
  - Award lists of the wrong width were accepted, then zeroed.
- **What will be built:**
  - Every service-width list in a package (values, WBS, awards, baseline and new requirements) is
    reordered through the same routine the board's other imports already use.
  - A package without a service list is refused if it carries any service-width figures.
  - Lists of the wrong width are refused and named.
  - The review and change report show each award's date and dollars by service, before and after.
- **Checks:** the two-board flow must store the right services and put each service's cash in the right
  half-month, with nothing UNSCHEDULED, and raise no false conflict. Proposed requirements must be
  reordered. Wrong widths must be refused. A walk over the held package must find every service-width
  list reordered. Fails on v1.94; mutations.
- **As built:** every service-width list in a package -- values, WBS lines, every award's dollars, in its requirements, baseline and new requirements -- is placed by service name; a package with figures and no service list, or a baseline of the wrong width, is refused by name. The review shows each award's date and dollars by service.

#### 52. Held proposals apply only to the year they were written for (review R04)
- **Logged:** 3 Oct 2026, review R04. Reproduced with real packages (`v195r/C/r04.mjs`).
- **Found:** the only year check runs when the package is taken, and only if the board already holds
  that year.
  - An FY28 package taken on a board without FY28 applied to **FY27** without a word.
  - An FY27 package held through a switch to FY28 applied to **FY28**.
  - Two offices' packages for different years both landed in whichever year was on screen.
  - The apply prompt never names a year, and award dates outside that year become UNSCHEDULED.
- **What will be built:**
  - On taking a package, its year is checked and kept with it.
  - If that year isn't on screen, the board says so, naming both years. If the year doesn't exist on
    the board, it says that too.
  - Apply goes ahead only into the year the reviewer accepted. Otherwise it stops and names each
    office's target year.
  - Applying to a different year is possible only through an explicit choice that names it.
- **Checks:** the three cases above, plus a package with no year. Nothing may be written to a year the
  reviewer didn't confirm. Fails on v1.94; mutations.
- **As built:** a package's year is read at take; another year is asked about, naming both; Apply refuses while any ticked package is held for another year and names each office's year; the confirm names the year.

#### 53. Incoming awards are checked and made whole at every door (review R09)
- **Logged:** 3 Oct 2026, review R09. Reproduced at all six doors: opening a saved board, full import,
  one appropriation, a submittal, a proposed requirement and an appropriation package
  (`v195r/C/r09.mjs`).
- **Found:** no door checks an award's figures, dates or shape.
  - **Text figures:** "1,234" or "abc" pass unchanged, and the award's cash becomes UNSCHEDULED. A
    figure as text ("1000000") is scheduled but shows a total of $10,000,002,000,000.
  - **Bad figures:** negative, fractional and "Infinity" figures pass.
  - **Bad dates:** "2027-13" or "abc" pass.
  - **Wrong width:** a list of the wrong width is silently **zeroed**, which destroys the dollars.
  - **Not a list:** an award list that isn't a list **stops the board opening**. Through a submittal or
    package, the bad record is written before the error, so the saved file then won't open.
  - **One bad figure spreads:** a bad figure in a later award unschedules that service's good awards too.
- **What will be built:** one award check that every door and every opening passes through.
  - Mode must be single or incremental, the list a list, dates real months, days 1–31.
  - Every figure becomes whole dollars, zero or more.
  - Plain figures written as text in a legacy file ("1000000") are converted and reported.
  - Anything else is refused and named at the import doors.
  - **On opening a saved board (Brad kept this default, 3 Oct 2026), nothing is zeroed:** a wrong-width award keeps its total, spread over the
    requirement's values the way the board spreads any total, and the board says which awards it
    repaired.
  - **Codex's conditions, adopted:**
    - The original award record is kept unchanged beside the repair.
    - The report names each affected award and the split used. A repaired award is marked as an inferred
      split, never shown as the historical one.
    - Where no repair is possible (every requirement value is zero, or a figure is unreadable), the award
      is flagged **needs repair** in Needs attention and its original data is kept. Its cash shows as
      UNSCHEDULED with that flag, so nothing is discarded.
  - A malformed award never stops the board opening.
- **Checks:** every variant at all six doors. No stored award figure may be anything but a whole number.
  A valid award must leave nothing UNSCHEDULED, and nothing may throw. Fails on v1.94; mutations.
- **As built:** `awdNorm` at every door (refuse with the award's path and fault, or convert text and cents and say so) and on every opening (repair and report, never refuse, never zero; the record as found kept in `aw.fix`). Needs attention lists "🔧 awards repaired on opening"; "✓ Checked" clears a mark and keeps the original. **Added in integration:** accepting an office's award keeps a repaired award's original, and the review compares awards on their dates and dollars only.

#### 54. The journal keeps fiscal years apart (review R08)
- **Logged:** 3 Oct 2026, review R08. Reproduced, with two more defects in the same line
  (`v195r/D/r08-journal.mjs`).
- **Found:** the change journal joins a person's edits to the same field within a minute. It never checks
  the year:
  - An FY27 note edit followed by the same note in FY28 became **one FY27 line holding FY28's text**.
  - "↶ Put back" on that line undid FY27's edit and kept FY28's. The FY27 text then existed nowhere.
    Putting that back wrote FY28's text into FY27.
  - Edits in two years that cancel out left no line at all.
  - An edit made just after a put-back merged into the put-back line.
  - A clock set back still counted as "within the minute".
  - Separately, a new year's line reads "undefined".
- **What will be built:**
  - Join two edits only when they are the same person, year and field, the earlier line is not a forced
    one (a put-back, a load), and the time moved forward by less than a minute.
  - "(load)" lines are forced.
  - The new-year line gets its name.
- **Checks:** the real editors across two years, then Put back. Each year must keep its own history and
  its own text. Also: cancelling edits are both recorded; a put-back line stays as written; a negative
  time does not join. Fails on v1.94; a mutation that drops the year test is caught.
- **As built:** a journal line joins the one before it only in the same year; opening and new-year lines are labelled.

#### 55. The PMO drill uses the board's own allocation (review R05)
- **Logged:** 3 Oct 2026, review R05. Reproduced, and wider than reported (`v195r/D/r05*.mjs`).
- **Found:** Spruills → By PMO → one PMO → **in detail**, on Board budgets, works out each requirement's
  allocation with its own rule rather than the board's:
  - **Directed splits are ignored.** A [60M, 20M] split read as the full ask, [100M, 100M].
  - **Odd dollars are spread by division.** $101 became [50.5, 50.5] rather than [51, 50].
  - **Forced unfunded rows count as allocated.**
  - As a result, PMO AV's Controls read **$258.00M** where the board says **$138.00M**. A PMO that is
    $170M short showed a $0.00M delta, 100% funded.
  - Other years are read with the on-screen year's PMO assignments, so a requirement moved to another
    PMO in FY28 stays under the old PMO.
  - An added requirement is counted **twice** in the Spruills totals; a $10M add raised Total Requirements
    by $20M.
  - Another year falls back to the on-screen year's edited ask.
  - The PRIMES→PSM title rule applies on Board budgets but not on a locked cycle. The same plan therefore
    shows a $24M PSM delta that isn't real.
  - No export reads this drill; the FYDP workbook is unaffected. The drill isn't registered with the
    money-coverage or trace checks, which is why none of this was caught.
- **What will be built:**
  - The drill reads each year's allocation through the board's one shared rule, for that year's own
    state: its PMO, its asks and its added requirements, each counted once.
  - Board budgets and a cycle locked from the same plan must print the same Controls.
  - The drill is registered in money coverage and the trace matrix.
- **Checks:** directed split, odd dollars, unequal and zero asks, overrides, forced unfunded, a PMO moved
  in one year, and an added requirement. Every figure must be whole dollars and equal the year's
  projection by PMO. Fails on v1.94; mutations.
- **The PMO by year (Brad, 3 Oct 2026, Q2):** "PMOs can change under reorganizations, leave the PMO assigned
  by year, as it's reported as that PMO in that year."
  - Today the FYDP workbook files a requirement under its *latest* year's PMO for every year. So FY27 money
    for a requirement moved in FY28 shows under the FY28 PMO, which disagrees with the FY27 lock.
  - The workbook's By PMO sheet and PMO tabs, and the drill, will file each year's money under the PMO
    that year assigns.
  - A requirement that changes PMO appears under each PMO for the years that PMO held it.
  - Check: each PMO's figures for each year equal that year's projection, and a locked cycle's PMO
    roll-up, to the dollar.
- **As built:** the drill reads each year through the board's own allocation (`spOwnYear`, the figures a lock takes) under that year's PMO; another appropriation's Controls show "—" and are never added in as nothing. Brad's Q2 is applied to the five-year plan (`fydpRows`) and, after review, to ⇄ Compare two cycles: a requirement that moved is listed under each office for its own years. Totals unchanged.

#### 56. The award-order check catches the sorts it missed (review R10)
- **Logged:** 3 Oct 2026, review R10. Reproduced (`v195r/me/r10.txt`).
- **Found:** v1.94's `check.mjs` rule passes an unsafe award sort written after a `.filter(function(){…})`,
  because it stops reading at the callback's `}`. It also passes `awdCmp(a,b)||1`, which breaks ties. It
  can't see an unsafe comparator held in a variable. None of these exists in the board today; the check
  just wouldn't catch one.
- **What will be built:**
  - The rule reads the whole chained expression, not up to the first `}`.
  - It accepts only `awdCmp` itself, or `awdCmp(...) || <a tie-break that compares two values>`.
  - It also requires every comparator applied to awards to be a known one.
  - The checker gets its own tests: the three bypasses fail, the valid forms pass.
- **Checks:** the checker's own test file; check passes on the corrected board.
- **As built:** the award-order rule refuses 21 unsafe forms and passes 12 valid ones in its own self-test; it fails v1.93 on six sorts and the review's probes.

#### 57. Menus and editor labels fit with Windows' font (review R11–R12)
- **Logged:** 3 Oct 2026, review R11–R12 (Windows Edge, measured by Codex).
- **Found:** reproduced here by giving 'Segoe UI' its real height and +3% width (`v195r/me/font-sweep.txt`).
  The editor buttons' labels are cut off at 1440×900. The Reports menu runs past the left edge at 761 px
  (−13 px; Edge measured −3 px). At the width this machine's font has, both pass — there is no margin.
- **What will be built:**
  - The menu is kept inside the window by measuring where it lands, not by assuming a width.
  - Editor labels wrap or shrink rather than cut off.
  - `dropdowns-visible` and `editors-reachable` also run with a Segoe-like stand-in at +6%, so the margin
    is tested.
- **Checks:** both browser checks at both font settings.
- **As built:** toolbar menus are clamped by measured width; the RECORD panel's action labels wrap; the drop-down and editor checks run a second pass with a Segoe UI stand-in (+6%).

#### 58. Two people saving the same board at once (review: the concurrent-writer issue)
- **Logged:** 3 Oct 2026, from the review. Reproduced (`v195r/me/race.mjs`).
- **Found:** Alice and Bob both pressed Save on the shared folder. Both read the folder copy before either
  wrote, both were told "✅ Saved", and the folder holds only Bob's edit. Alice's is not in the folder or
  its history.
  - The editing lock is advisory: Save never consults it.
  - A file share or a synced Teams folder offers no atomic compare-and-swap, and neither does the
    browser's file access. No amount of re-reading closes the gap.
- **Decided (Brad, 3 Oct 2026, Q1: "go with recommendation"): one writer per board file.**
  - **The folder:** only the board's owner has write access to the shared board file or folder (set in
    Teams / SharePoint).
  - **Everyone else** opens it read-only. Appropriation managers work through 🔁 Appropriation packages;
    offices work through PMO copies. ORBIT does not replace that permission; it adds the rest.
- **What will be built:**
  - **The file records its writer:** a name, and a key this browser holds; the file keeps only a
    fingerprint of the key.
    - Save to the file or the shared folder is refused from any other browser, and says who holds the pen.
    - That browser can still open, read, export, publish PMO copies and ⬇ Save a copy.
  - **📁 File › Take the pen** is the only way to change writer.
    - It asks first, naming the current writer and when they last saved, and is recorded in the journal
      and the file.
    - The previous writer's next Save is refused with who took it and when, and offers ⬇ Save a copy.
      Nothing of theirs is written over.
  - **A file or folder the user may not write to** gets a plain message ("This board is read-only for you —
    <writer> holds it"), not a failure.
  - **Two tabs of the writer's own browser** cannot save at the same moment: the second waits, or says a
    save is under way.
  - **Unchanged:** the existing collision check, the history copies and the kept-aside work.
  - **A board saved before v1.95** has no writer. The first v1.95 Save asks to take the pen, and records it.
  - **The Field Guide** (portfolio team part) gains a short section on the operating model: one owner per
    board file, how hand-over works, and the folder permission to set.
- **The guarantee is the permissions (Codex):**
  - A single writer is guaranteed only where the folder's permissions let one person write.
  - ORBIT's recorded writer, Take the pen and the read-before-write check are **cooperative enforcement**.
    Where two people both have write access, the race remains, and the guide and Take the pen say so.
  - **A proper hand-over** is the owner changing the folder's permissions (removing the previous writer's
    write access, granting the new one's), then the new writer pressing Take the pen. Take the pen asks
    whether that has been done.
  - The guard against two tabs of one browser works across tabs, not just inside one.
  - Recovery is the folder's history copies and Teams version history.
- **Checks:**
  - With two browsers, only the writer saves, and the other is refused, naming them.
  - Take the pen, then the old writer's Save is refused and nothing is lost.
  - A read-only file gives the plain message.
  - Two tabs never save together.
  - The race reproduction (`v195r/me/race.mjs`) ends with one Save refused and both edits retrievable.
  - Fails on v1.94; mutations.
- **Testing that only Brad's environment can do:** real Teams / SharePoint permissions, sync conflicts and
  a disconnect mid-save. Claude will supply a step-by-step checklist with the build.
- **As built:** each file records its writer; another person's Save is refused and names the writer; ✍ Take the pen… hands over after a question naming the writer it replaces; an autosave never claims a file. The Help guide says the guarantee is the folder's permissions and that two writers with access are cooperative only.
- **Found by the review before merge, fixed:** ⬆ Publish now (Live view) wrote the shared folder's copy with none of the folder save's checks -- not the writer's, not whether anyone saved since, no earlier copy kept, the writer record dropped. In the shared folder it now is that save, and someone only watching the folder is not offered it.

#### 59. A money reconciliation coverage map (Codex's acceptance condition)
- **Logged:** 3 Oct 2026, from Codex's scope review. It is a launch blocker until Brad narrows it explicitly.
- **Asked for:** integer-dollar reconciliation of every visual and export by appropriation, fiscal year,
  service, requirement, month, CR half and funding lane.
- **What will be built:**
  - A map of every money surface on screen and in an export (today 24 surfaces in money coverage, and 15
    in the trace matrix) against those seven dimensions.
  - Each cell is marked:
    - **proven:** the check that proves it, by name;
    - **not applicable:** the surface does not carry that dimension;
    - **open.**
  - Open cells that existing tools can close cheaply are closed in v1.95. The map is generated by a tool,
    so it cannot drift.
  - The remaining open cells go to Brad to build or explicitly defer. None is treated as satisfied
    silently.
- **Built so far:** 308 cells are mapped: 101 proven, 188 not applicable and 19 open. 37 cells were closed
  by new test-only checks.
- **Brad, 3 Oct 2026:** "Go with your recommendations". The open cells tied to F1–F5 are closed in v1.95
  (item 60). These are **deferred, by name**, to a later version:
  - Two Spend Plans × service, requirement and lane;
  - the ATR/BTR log across appropriations, years and services;
  - Funds Flow × appropriation and year;
  - the ACE tie-out × year.

  The map lists each one as open until it is built.
- **Checks:** the map tool fails if a registered surface or a dimension is missing from it.
- **As built:** `tools/money-map.mjs` → `money-map.md`; the gate runs it (stage "money map"). **329 cells: 114 proven, 206 not applicable, 9 open** -- the nine are Brad's deferrals by name (item 62). Integration confirmed W4's surfaces and added a check for the Spruills table by service, by year and for another appropriation.

#### 60. Export defects the reconciliation map found (F1–F5)
- **Logged:** 3 Oct 2026, from building item 59. The map's checks read the exported files back, and five
  defects came to light that the review had not named.
- **Brad, 3 Oct 2026:** "Go with your recommendations, F2 option (a)".
- **Found and decided:**
  - **F1, rounded values in the $M and $K files.** `buildXlsx` stores every non-integer rounded to two
    decimals: the Two-Plan Forecast writes $85,069 as 0.09 ($M), the ATR/BTR log writes a typed 1.2345 as
    1.23, and the 1A9A writes $124,458 as 124.46 ($K). Sums made from those cells drift.
    **Fix:** store the exact figure and keep the two-decimal display, so the sheets look the same and add up
    to the dollar.
  - **F2, Spend Plan Source dates for incremental awards.** An award with several increments goes out as
    one line, dated the 1st of its first stored increment.
    - Increments stored March then November put the whole line in March. The forecast puts most of it in
      November.
    - v1.94 fixed this rule for the 1A9A but not here.
    - **Fix, option (a):** one line per increment, each with its own date and amount. The lines of an award
      add up to its line today.
  - **F3, the Executive Synopsis year.** With FY28 on screen, the synopsis's first line and file name still
    say FY27. **Fix:** the year on screen.
  - **F4, an office split of a requirement.** A $100 draw split 1:2 between offices prints $66.67 and
    $33.33 in the PMO Matrix, the PMO tabs and the forecast. **Fix:** whole dollars by the board's one
    spreading rule, $67 and $33.
  - **F5, the CR footnote.** It still says "flip to 16–EOM", which has not applied since v1.94. **Fix:**
    the wording.
- **Checks:** each fix closes its open cells in the map (item 59), proven to the dollar against the
  exported file's bytes. Each fails on v1.94; mutations.
- **As built:** F1–F5 as decided (F4 through `pmoPartsOf`; F2 dates each increment the day the landing rule places it, the rest on 31 August). **Found and fixed in integration:** F6, a prime's CLIN lines on the Spend Plan Source and the RCN/EEIC monthly tab were fractions of a dollar ($100 across CLINs asking 1 and 2 went out as $33.333… and $66.666…) -- now whole dollars that add up; and a single award dated past its month's end (the 31st of November) is dated the 30th on the Spend Plan Source, where it had rolled into December.

### v1.94 — 2 Oct 2026: items 45 and 46, built on Brad's "go"

**The CR view places each award's dollars in the half-month of its own date.** CR Cash Needs (By Service and By
PMO), the workbook's CR Cash Needs sheet and the 1A9A CR Cash Return now put each award's amount in the half of the
month its own date falls in — the 1st to the 15th, or the 16th to the end — for a single award date and for each
incremental funding date alike. Nothing switches a half by hand: to move cash, change the award's date. An award
saved with a month and no day counts as the 1st. Switching an award to or from Incremental funding keeps its day,
and the 1A9A OBL DATE is the earliest award's own date.

**Awards on the same date keep a defined order:** the order they arrived on that date. An award whose date is
changed goes to the bottom of its new date's group. No dollar moves either way; it decides which row of the award
block shows the discretionary / mandatory split, and which row ↵ put on last fills.

**What moves on boards in use today.** Cash moves between halves only where v1.93 had it wrong or where a half was
set by hand: two awards in one month on opposite sides of the 15th, an award moved out of or deleted from a month
that still holds another, a half clicked in the CR panel, and older month-only awards carrying a second-half mark —
those now count as the 1st. Every award an old second-half mark had in 16–EOM that its date puts in 1–15 is listed
at the top of CR Cash Needs and in Pre-flight (Worth knowing), with Go to it; "The dates are right — clear the old
marks" removes those marks, journalled, and moves no figure. Month totals, CR window totals, allocations, spend
plans, the forecast, the PMO tabs, the deck and the IDS file do not change.

**The final check** passed on the final tree overnight 2–3 Oct (9:58 pm – 12:01 am Eastern): **122.3 minutes**,
every stage clean — the defect register, money coverage (24 of 24 surfaces), the trace matrix, all eight suites, every
browser check, the fuzz, the file verifier — and **all 717 planted mistakes caught** (11 more change nothing by
design, as before): v1.93's 704 plus the 24 new, with the 6 retargeted among them. It took five starts. The first
(4:26–5:59 pm) failed on two mutations whose search text no longer matched (`awd-dates-counted`,
`awd-dates-unsorted`), which were retargeted and presweept 2 of 2. Two were lost when the container restarted. One was
stopped at the session's two-hour limit on background jobs, 705 of 728 mutations in: on this container the gate takes
about two hours, against 93 minutes for the afternoon run. Brad agreed to run it outside that limit; the run that passed
is the same single `npm run validate:math`, unchanged.

#### 45. CR half-month windows follow each award's own date and amount
- **As built:** each placement from `landSvc` carries its award's day (`awdDay`: 1 to 31, or 1 for a month-only
  award); `crBuckets` takes the half from it alone. The date setters write no half-month mark; `_crHalfSet` and the
  click toggle `crToggle` are gone, and the CR panel's cells are plain figures. The old marks stay in the file, are
  still copied with a requirement to another year, and still travel in a PMO copy; a submittal that carries one shows
  "an old CR mark, no longer used: the award dates decide". `crMovedList` is their only reader.
- **Different from the plan:** "a line goes when its date is confirmed" is built as one action in the CR box — **✓ The
  dates are right — clear the old marks** — because Pre-flight is read-only by design ("Nothing here changes
  anything"). Pre-flight lists the awards and says where to clear them. The list cannot name a late award v1.93 had
  shown early because a later edit had removed the mark — that is the defect itself, and leaves nothing to point at.
- **Checks:** `audit-board.mjs` "v1.94 — CR half-months follow each award’s own date" (ten requirements through
  the board's own setters, the 15th and the 16th among them; the panel, the workbook sheet and the 1A9A to the dollar; OBL DATE; no toggle; the
  Incremental switch; Pre-flight and the CR note; clear; save → reopen; copy to the next year) and "… by PMO, a
  requirement shared between offices". 29 of their checks fail on v1.93 (35 with the revised v1.93 block). The v1.93 block "CR cash needs — the
  half-month placement" now expects its month-only December award, carrying an old 16–EOM mark, in 1–15.

#### 46. Awards on the same date keep a defined order
- **As built:** `awdCmp` (equal dates compare equal; the stable sort keeps stored order) in every award sort —
  `landSvc`, `addAwd`, `setAwdIncDate`, `awdDateLbl`, `toggleAwdInc`, `crObl`. `setAwdIncDate` moves a re-dated
  award to the end before sorting. `setAwdIncMonth`, which nothing called, is gone. `npm run check` "award order"
  refuses any other comparator on awards; it fails on v1.93 naming all five of its sorts.
- **Checks:** `audit-board.mjs` "v1.94 — awards on one date keep a defined order" (add two on one date, edit a third
  onto it, the split, put on last, away and back, a fourth, save → reopen, copy to the next year); fails on v1.93.

#### Mutations
24 new, each presweept with `npm run mutate -- <ids>` and caught: the CR half from the date (`cr-old-mark-decides`,
`cr-half-reversed`, `cr-half-boundary`, `land-day-dropped`, `land-single-day-dropped`, `land-index-dropped`,
`awd-monthonly-late`, `awd-date-writes-mark`), the Incremental switch (`toggle-drops-day`, `toggle-single-drops-day`), the
OBL DATE (`crobl-first-of-month`, `crobl-unclamped`, `crobl-latest-award`), the list of moved awards and its clearing
(`crmoved-agreeing-listed`, `crmoved-unmarked-listed`, `crclear-clears-all`, `pf-crmoved-dropped`, `cr-note-dropped`,
`crgo-box-left-open`), and the order (`awd-tie-reversed`, `awd-cmp-ties-flipped`, `awd-edit-keeps-place`,
`awd-add-front`, `awd-putlast-first-equal`). Retargeted to the line that now carries the same defect:
`fc-mand-not-carried`, `cr-half-ignored`, `awd-seed-disc-only`, `land-typed-order`, and — found by the first gate run,
which failed on them as NOT APPLIED (715/715 caught otherwise) — `awd-dates-counted` and `awd-dates-unsorted`, whose
target in `awdDateLbl` now sorts with `awdCmp`. Both were presweept and caught before the gate was run again.

In the presweep three first SURVIVED and showed three gaps in the new tests — no award on the 15th or 16th, no
requirement with a mark in one month and an unmarked early award in another, no listed requirement with a second mark
to keep — and one more check was found passing vacuously (a `\b` inside a template literal is a backspace, so its
pattern could never match). That check was also hiding a real bug: Go to it from the CR box left the box on screen.
All four were fixed, and every one of the 28 is caught.

**Not mutated, and why:** a comparator returning 1 for equal dates (what v1.93's setters used) sorts exactly as
`awdCmp` does in V8, so no suite run in Chromium or jsdom can tell; `npm run check`'s "award order" rule holds it.

### v1.93 — 1 Oct 2026: items 39–44, built on Brad's "go"

**Mandatory awards last, in every spend plan.** An award is the whole award — discretionary and mandatory
together — and a requirement's awards are taken in date order, per service. Discretionary fills them forward
from the first; mandatory fills them backward from the last. Brad's example is the rule: a $300 requirement
awarded $100 in each of January, February and March, with $250 discretionary and $50 mandatory, places
discretionary $100, $100 and $50, and the $50 mandatory in March. Funded dollars the awards do not cover are
UNSCHEDULED, in either lane. The Spend Plan Forecast, the month sheets and the workbook's months, the PMO tabs,
Two Spend Plans, CR Cash Needs, the CR Cash Return (1A9A) and the deck's chart all place by this one rule and
agree month by month and lane by lane. The award block schedules both lanes: its balance counts down the
funded amount, each award shows how it splits (*$50 disc + $50 mand*), and ↵ put on last puts the whole
remaining balance on the latest award.

**The Spend Plan Forecast by PMO and by service.** A small *Show* picker in the box's title line chooses the
whole portfolio, one PMO or one service; the roll-up is drawn for that view in its usual format, with the
breakdown beneath it the other way. **⬇ Export this view** saves exactly what is on screen.

**Needs attention: every entry opens its list,** in priority order, with **Go to it** beside each line —
impact statements missing, no CCaR record, and two new entries: requirements with no obligation date, and
awards short of their funding.

**Every drop-down shows all of its items,** and **every box takes the keyboard**: focus in, Tab kept inside,
Esc closes, focus back to what opened it — and typing not yet saved asks *Discard what you typed?* first.

**The IDS box gives Req. Approved by lane,** discretionary and mandatory, on its summary and in its
reconciliation. The file itself is unchanged.

The guide inside the file (📖 Help) says each of these: the spend-plan rule and the forecast's *Show* and export
under *The spend plan*, the lists under *Allocating, and what does not draw*, the boxes and menus under *The
board, its menus and its file*, and the split under *The IDS batch*.

**What changes on boards in use today.** Mandatory moves later: wherever a requirement's awards were typed for
the discretionary only, as the award block asked until now, its mandatory is now UNSCHEDULED until an award
covers it, and **◔ awards short of their funding** under Needs attention lists every one, with Go to it to the
award block, where ↵ put on last covers it. Nothing is lost: the dollars are still funded, every total is
unchanged, and every spend plan says so in its UNSCHEDULED column. Mandatory moving later can also move dollars
out of the CR window (Oct–Mar) into later months.

**The final check** passed on the shipping tree on 1 Oct (4:36–6:15 pm Eastern): **99.3 minutes**, every stage
clean — the defect register, money coverage (24 of 24 surfaces, the new forecast export among them), the trace
matrix, all eight suites, every browser check (the new box and drop-down checks included), the fuzz, the file
verifier — and **all 693 planted mistakes caught** (11 more change nothing by design, as before): v1.92's 662,
less the 4 retired, plus 46 new.

#### 40. Mandatory awards last, in every spend plan
- **Logged:** 1 Oct 2026, Brad: "all mandatory allocations should award last … The award could be a mix of
  discretionary and mandatory, but mandatory always awards last"; "mandatory works backwards, while
  discretionary should work forward as the first award"; his worked example; and "Let's update the award block
  to include mandatory." Then, on the unscheduled note: "We would need to work to correct those to ensure that
  the award time frame and increments aligned to the funded position for both discretionary and mandatory."
- **Found (v1.92):** an increment was discretionary dollars, and mandatory was spread across every award date
  in the increments' proportions — so Brad's example placed $83.33 discretionary + $16.67 mandatory in each
  month: the same month totals, the wrong lanes.
- **What was built:** `landSvc(aw, i, dsv, msv, literal, f)` — the one landing rule, used by `monSpreadOf`,
  `forecast`, `spendPlanByMonth` and `crBuckets` — sorts the awards by date (`awdKey`), fills discretionary
  forward from the first and mandatory backward from the last, never past an award's amount, and returns what
  is left as UNSCHEDULED per lane. The award block (`awardBlockHtml`, `awdSplitOf`) schedules discretionary +
  mandatory; *Incremental funding* seeds the first increment with both lanes; ↵ put on last (`fillLastAwd`)
  puts the whole balance on the latest award by date, not the last one typed.
- **An office's share is placed as a share of the whole.** The fill is not proportional (a smaller amount fills
  fewer awards), so a requirement shared between offices is placed whole and each office takes its share of
  every month — in the forecast by PMO, CR Cash Needs by PMO and the PMO tabs.
- **Different from the plan:** the plan said a service with no increment of its own would use the
  requirement's awards. As built it is **UNSCHEDULED**, by the later decision that funded dollars the awards do
  not cover are UNSCHEDULED in either lane: an award is typed per service, so a service with none has no award
  covering it. The Needs attention entry reads **◔ N awards short of their funding** (planned as 📅). In Two
  Spend Plans' modelled plan, where the increments are only a shape, the shape is scaled to the funded amount
  and the two lanes fill it forward and backward in the same way.
- **The IDS batch has no date column; nothing in it moves.**
- **Checks:** `audit-board.mjs` "v1.93 — mandatory awards last": eight requirements written from the scenario —
  Brad's example; the same with its awards typed for the discretionary only (its $50 mandatory UNSCHEDULED
  until put on last); partly funded; mandatory only; awards stored out of date order; one award date; a
  service with no award of its own; awards more than the funding — and the same table demanded of `landSvc`,
  the forecast, the deck's chart by lane and the CR windows; the award block's split and balance; put on last;
  the seed; a requirement shared between offices. The incremental-funding, forecast and CR blocks were
  rewritten for the rule, and `audit-import.mjs`'s v1.86 expectations re-derived for it.

#### 41. The Spend Plan Forecast by PMO and by service, and an export of the view
- **Logged:** 1 Oct 2026, Brad: view the forecast by PMO and by service "in the same format as the top Roll Up
  section", export the filtered view, and "do not create a large clunky section for filtering".
- **What was built:** *Show* (a select in the box's title line): Whole portfolio, then each PMO, then each
  service. The roll-up is drawn for the view; the table beneath breaks it down the other way (the portfolio by
  PMO, a PMO by service, a service by PMO). **⬇ Export this view** writes one sheet named for the view
  (*FY27 Spend Plan Forecast - AV.xlsx*): the title row names the view and the date, every TOTAL is the sum of
  the printed cells above it. The box opens on the whole portfolio every time. The by-PMO table now lists every
  office that has requirements (`pmoKeys`), not only the configured list, so a requirement on a derived prime or
  a removed office is not dropped.
- **Checks:** `audit-board.mjs` "v1.93 — the forecast by PMO and by service, and its export": every PMO and
  every service view written from the scenario, the PMO views and the service views each summing to the
  portfolio month by month, a requirement shared between offices split by its shares, the picker, and the
  export's cells and totals read back. `money-coverage.mjs` registers the export as a money surface (via
  `fcViewData`, `forecast`, `landSvc`).

#### 42. Needs attention: every entry opens its list
- **Logged:** 1 Oct 2026, Brad: a pop-up for each entry "like it does with the Not Drawn statement",
  requirements without a CCaR record, and "any requirements that are missing obligation dates".
- **What was built:** every entry is a button that opens a list in the fix list's style — rank, title, PMO and
  the dollars — with **Go to it**: ⚠ impact statements missing (opens the Impact statement editor), ○ without
  a CCaR record (asks for the record), 📅 without an obligation date (funded first, each with what it leaves
  UNSCHEDULED; selects the requirement at its award date) and ◔ awards short of their funding (the dollars
  short in each lane; selects the requirement at its award block). A requirement fixed from a list leaves it and
  the count at once. ▲ not drawn keeps its fix list. Each entry is a 24px-high target (WCAG 2.5.8), so with
  three or four entries the strip is two lines of them (about 63px instead of 50); below 640px wide they stack
  in one column (1.4.10 at 320px).
- **Checks:** `audit-other.mjs` "v1.93 — Needs attention: every entry opens its list" (each list written from
  the scenario, Go to it for each kind, a fix leaving the list and the count); `npm run panels` opens the list
  box; `npm run standards` holds its empty baseline (it first found the entries 13px high, and 19px of sideways
  scroll at 320px, both fixed).

#### 43. Every drop-down menu shows all of its items
- **Logged:** 1 Oct 2026, Brad, with photos of a row's ⋯ menu cut off and Reports & exports running off the
  screen.
- **What was built:** `fitMenus()`, after every draw and on resize and scroll: a menu inside the list, the
  RECORD panel, a box or Needs attention is drawn above it, fixed to the window beside its button — below when
  it fits, above when there is more room there; any menu taller than its room scrolls inside itself.
- **Checks:** `npm run dropdowns` (new, in `verify:grid`) opens every toolbar menu and a row's ⋯ menu on the
  first and last row of a long and a short list, at 761, 1024, 1536 and 1920px wide by 730 and 960px high, and
  fails if any item is outside the window or under something else. It passes (92 menus opened) and fails on
  v1.92.

#### 39. Every box takes the keyboard
- **Logged:** 1 Oct 2026, at Brad's request: the dialog keyboard handling v1.92 deferred. Typing guard: Claude's
  recommendation; Brad: "go with your recommendation".
- **What was built:** one controller (`dlgSync` and its helpers) for all 44 boxes, the new Needs attention
  list included. When a box opens it is named as a dialog from its heading, the board behind it is made inert,
  and the keyboard goes to its first field (or first control); Tab and Shift+Tab go round it; Esc closes the
  box on top by pressing its own ✕ Close; when it closes the keyboard goes back to the control that opened it
  — found again if a redraw replaced it — and where one box opened another, back into the one below. Help and
  Save diagnostics lost their own Esc handlers to it.
- **The typing guard:** a box holding typing it has not saved asks *Discard what you typed?* before Esc, ✕ Close
  or a click outside closes it; Cancel keeps the box and the text. Typing counts as not saved while a field has
  been typed in and not committed (no change event yet), or — for a field the box saves only with its own
  button (the written-field editors, the IDS prompt) — while it differs from what it held when the box opened.
  A press on the backdrop, or on ✕ Close with typing in the box, no longer takes the keyboard out of the field,
  so a half-typed figure is not committed on the way out.
- **As built, beyond the plan:** five older boxes (Change journal, Submittal review, Live view, Budget list, IDS
  batch) show themselves by an inline style rather than the `open` class; the controller reads both. A field
  that applies as it is typed (the journal's filter) has nothing to lose and never asks. A box's own *Cancel*
  button discards without asking, as its name says.
- **Checks:** `npm run dialogs` (new, in `verify:grid`) opens every box the way a person does — 34 of 43 from
  their own menu or button by keyboard, 9 (opened only from a state the example board lacks) by their switch;
  the in-app prompt is skipped — and checks focus in, a named dialog, the board inert and unreachable, twice as
  many Tab and Shift+Tab presses as the box has controls, Esc, focus back to the opener, and in the 8 boxes with
  a text field the guard on Esc, ✕ Close (clicked) and a click on the backdrop. It passes, and finds 291
  problems on v1.92. `audit-other.mjs` "v1.93 — every box: named, inert behind, Esc closes, typing guarded".
  `npm run check` fails on a box the controller cannot drive (not a direct child of the page, no id, no
  `.modal`, no name or no close control).

#### 44. The IDS batch: Approved by lane on the summary and in the reconciliation
- **Logged:** 1 Oct 2026, Brad: mandatory budgets and allocations like discretionary, and a mandatory summary
  total on the main screen.
- **Found:** v1.92 already wrote mandatory lines on their mandatory budgets; its summary gave *Req. Approved* as
  one figure.
- **What was built:** the summary reads *Req. Approved $X (discretionary $D · mandatory $M)*, and the
  reconciliation gains *of which discretionary* and *of which mandatory*, each summed from the contributions
  (a row on a lane-less budget can hold both). The arithmetic check (`idsCheck`) holds both lanes as well as the
  total, and the printed split against them. **The file is unchanged.**
- **Checks:** `audit-other.mjs`'s IDS block: the two figures written from the scenario, a lane-less row split by
  its contributions, mandatory on a retired budget listed and still counted.

#### Mutations
54 new or retargeted, each presweept with `npm run mutate -- <ids>`: the landing rule (forward and backward,
date order, an award's cap, no award, an office's share placed alone, in the forecast, the CR windows and the PMO
tabs), the award block, the IDS lanes, the Needs attention lists, the forecast views and export, and fifteen on
the box controller. Retargeted to the new rule, the same defect each: `fc-weights-not-dollars`,
`fc-drops-unscheduled`, `fc-mand-not-carried`, `inc-residual-netted`, `inc-residual-basis`, `cr-inc-equal-split`,
`cr-zero-weight-lost`, `cr-back-to-weights`. **Retired as obsolete** (the behaviour they guarded is now wrong,
not merely moved): `fc-mand-only-unscheduled`, `fc-mand-rides-evenly`, `awd-seed-disc-mand`, and
`help-esc-ignored` (the guide's own Esc listener is gone; the controller's mutations break Esc instead).
The presweep (1 Oct, on the shipping tree but for the two accessibility fixes, which are CSS only): **54 of 54
caught**. Before it, two of the fifteen box-controller mutations — a committed field still asking, and the
journal's filter asking — first SURVIVED: the real fields redraw themselves when they commit, which hid the rule.
A test on a field that does not redraw now holds each, and both are caught.

### v1.92 — 30 Sep 2026, revised before merge 1 Oct 2026: items 18, 36 and 37, built on Brad's "go"

**The IDS Batch Import is one row per budget and control number, every dollar reconciled, and nothing about
an export is recorded.** Reports & exports › 📤 IDS Batch Import opens a preview of the file worked out from
the plan on screen: one row per Budget FY, Budget Name and Req Control No, with everything that lands there —
two services, both lanes on a lane-less budget, two requirements sharing a control number — consolidated into
that row, and a row holding several requirements listed for review. A mandatory line's Amount and Approved are
its mandatory draw; a discretionary line carries the discretionary draw plus every unfunded dollar on that
service; a requirement with no money goes at Approved 0 on a discretionary budget. Anything that cannot be
uploaded correctly is kept off the upload sheet and listed, with its dollars and every reason, on a second
sheet, **Missing data and anomalies**, which reconciles every dollar of the plan. Before the file is made the
box asks for the reason (written on every row), Add or Update for the whole file, the file ID (a candidate:
today's date and the time of day) and the ORG — and the person confirms the ID has not been used and the ORG
applies to every row. ORBIT keeps the ORG and nothing else.

**One authority on a line's budget.** A chosen BAE budget that can no longer be used — retired, not in the
list, another office's, another service's, the other lane's, another appropriation's, or legacy — is shown
for what it is in the RECORD panel, is never quietly replaced by the rule's answer, stops the Spend Plan
Source, and is listed (not uploaded) by the IDS export. The panel, both exports and the pre-flight all read
the same answer.

**The keyboard reaches everything the mouse can, through real buttons.** Every menu item, chip, link and
table toggle is a native `<button>` (the browser's own Enter and Space); the only exception is the SVG funds-flow
node, which SVG gives no button for and which now names itself and draws the gold focus ring. Pressing one no
longer throws the keyboard back to the top of the page, and typing a figure in a row and pressing Tab moves
on to the next field.

**📁 File › 🩺 Save diagnostics…** makes a small text file for support instead of sending the board, with no
dollar figure, title, name, CCaR record, PID or budget name in it.

**A CSV cell a spreadsheet would run is written as text.** Both CSV exports put an apostrophe in front of a
cell that starts with = + - @, a tab, a carriage return or a line feed (spaces before one included); a true
number, or a figure ORBIT formatted, is left as it was.

#### Revised before merge (1 Oct 2026): Brad's CCaR answers and decisions

PR #3 was held after review. Brad answered the IDS questions (item 38, now closed) and approved a revised scope
on 1 Oct; it was built on the same branch before merging. What changed from the 30 Sep build:

- **No record of exports.** Removed: the record of batches (`issued` / `sent`), *Forget*, the automatic
  file-ID sequence, Add/Update worked out from history, and the PMO-copy stripping that went with them. A
  board that holds any of it keeps it untouched; nothing reads it. *The 30 Sep build made the next export of
  the same plan an Update, and a locked view or a PMO copy could export and record its own batch.*
- **The Req. Amount rule (Brad, A1).** Mandatory = the mandatory draw; discretionary = the discretionary draw
  plus all of the service's unfunded; no money = the requirement at Approved 0, on a discretionary or
  lane-less budget; never unfunded dollars on a mandatory budget. *Two defects in the 30 Sep build against it:
  a mandatory-only service that was short put its unfunded dollars on the mandatory row (30/20 instead of
  20/20 plus 10/0 on discretionary), and a requirement with no money could go on a mandatory budget chosen
  for its "not funded yet" line.* A fully mandatory-funded service gets no $0/$0 discretionary row.
- **One row per FY + budget + control (Brad's IDS rule)**, contributions from every service, lane and
  requirement consolidated into it, each one kept as provenance; a control number on several budgets is a
  row on each; several requirements on a row, and one control used by several requirements across budgets,
  are listed for review.
- **Missing data never stops the file (B7).** It is listed on *Missing data and anomalies* with every reason
  (not only the first) and how to fix each; the sheet carries the file's details, the reconciliation of
  Amount and Approved, the consolidated rows, the shared controls, the Approved-0 rows and, on an Update file,
  the Authorized-allocation warning. With no uploadable row the file is still made, its Requirement v1 sheet
  holds no numbered row, the other sheet starts **NO UPLOADABLE IDS ROWS**, and the message never calls it
  ready to upload.
- **Three things do stop it**, inside `exportIdsReq()` and before anything is asked, built, downloaded or
  written: a locked cycle on screen, a PMO copy, and ORBIT's own arithmetic failing a check. The check is
  worked out again from the requirements and the lane walk: every row's Amount and Approved are its sources';
  Amount ≥ Approved ≥ 0; uploaded + not uploaded = every requirement (Amount) and every dollar drawn
  (Approved); every contribution exactly once; whole dollars; one row per key; and for each requirement and
  service, Amount = its requirement and Approved = its two draws. A failure names the check, the expected and
  found figures, and the contributions and requirements involved.
- **The prompt (B1, B4, B6, B8).** The reason is required, written identically on every row as text (never a
  formula), and refused rather than cut if a spreadsheet cannot hold it. Add is preselected; Update is one
  choice for the whole file, and brings up the Authorized-allocation warning in the box and on the sheet;
  ORBIT never writes Delete. The file ID is an editable candidate, yyyyMMdd-HHmm, checked for its shape and a
  real date, and must be confirmed as unused — the box says the four digits are the time, not a sequence,
  and that ORBIT cannot guarantee the ID is unique across exports, saved copies, machines or earlier CCaR
  submissions. The ORG is one number per appropriation, confirmed for every row and service; a missing or
  non-numeric ORG refuses the file. The ORG is kept only once a file is made.
- **Control numbers are numeric and exact (C1).** Written as number cells, as the template's Example Sheet
  does; one with a leading zero, a letter or more than 15 digits is listed, never altered. *The 30 Sep build
  wrote "01004" as 1004.*
- **The RECORD panel names every budget the file uses.** A mandatory-only service that is still short gets an
  *unfunded part* line, resolved as discretionary. The *not funded yet* picker offers discretionary and
  lane-less budgets only; a mandatory budget chosen while the line was funded in mandatory is kept, shown
  ("kept for mandatory money"), not used for unfunded dollars, and used again once mandatory money returns.
- **The menu label** no longer works out the whole IDS batch on every redraw; the preview is worked out when
  the box opens.
- **Keyboard (36), revised:** the 36 `role="button"` spots PR #3 added are native buttons now — inside the
  cell for the three table toggles, never on the `<td>` itself — and `npm run check` refuses `role="button"`
  anywhere but an SVG group with a label. **Not done, as agreed:** a box (dialog) does not yet take focus, keep
  Tab inside it or close on Esc; that controller is deferred, and v1.92 does not claim it.
- **CSV:** one cell writer, `csvCell()`, for the Proposed 1–N order and the Executive Synopsis.
- **Diagnostics (18):** unchanged, with a test that a board holding IDS-shaped state (an ORG, a comment, file
  IDs, budgets, control numbers, dollars) puts none of it in the file.
- **Pre-flight:** an unusable chosen budget is a block; a budget kept for later that would be refused is a
  fix; requirements sharing a control number are listed for review, never blocked.

**Still to confirm on the first real upload** (nothing to build unless the answer differs): that CCaR reads
"Requirement v1" and ignores the second sheet; whether it limits the length of Req. Change Comments; and that
one ORG covers every row an appropriation's file holds. ORBIT does not check rule 12 (total Approved within the
budget's available) because the Budget Extract carries no available amount.

**The final check** passed on the revised tree on 1 Oct (10:20–11:54 am Eastern): **94.7 minutes**, every stage
clean, all 651 planted mistakes caught (11 more change nothing by design, as before) — the 604 of the 30 Sep build,
less the 8 retired with the record of batches, plus 66 new. The run before it, on the same tree but for a CSS-only
change to the IDS box's tables and the flow node's focus ring, also passed (8:40–10:11 am, 91.1 minutes). In their
trial run two of the new planted mistakes got through and showed two weak tests — an export writing a record of
itself, and an ORG kept from a refused prompt; both tests were tightened before the final check.

#### 37. The IDS Batch Import: one row per budget and control number, reconciled, nothing recorded
- **Logged:** 30 Sep 2026, from Brad's IDS Batch Import Req template, walked through column by column.
  Approved 30 Sep with a record of batches and automatic file IDs; **revised before merge on Brad's decisions
  of 1 Oct 2026**, which replaced both (see *Revised before merge* above for every decision).
- **Found (v1.91):** only discretionary money went (the $80 drawn from mandatory was in no line on a test
  board funding $230); a mandatory-only service was held back with nothing to pick; every line was Add; the
  file ID's sequence was typed by hand; and `money-coverage` excused the file as having "no dollar columns".
- **Found (30 Sep build, before merge):** unfunded dollars on a mandatory row for a mandatory-only service that
  was short; a "not funded yet" choice could be a mandatory budget; a locked view and a PMO copy could export
  and record a batch; two saved copies offered the same next file ID; a retired, missing or other-office choice
  was printed; Approved could carry cents; a leading-zero control number lost its zero.
- **What was built:** the pipeline `idsSources()` → `budResolve()` + `idsCtlOf()` → excluded with every reason
  → grouped by `idsKey(FY, budget, control)` → summed → `idsCheck()` → `idsSheets()`; the box (`idsBody`) is
  the preview and the prompt; `exportIdsReq(opts)` refuses, in order, a locked view, a PMO copy, a failed check
  and an incomplete prompt before it builds anything.
- **Checks:** `audit-other.mjs` "v1.92 — the IDS export: consolidated, reconciled, nothing recorded" and "…
  one budget and control across two services"; `audit-import.mjs` "an older board's IDS settings cross a full
  import untouched, and only the ORG is used"; the mutations listed under *Mutations* below.

#### 36. The keyboard reaches every menu item and the last mouse-only controls
- **Logged:** 30 Sep 2026, at Brad's request: the keyboard debt v1.91 recorded, and what checking it found.
- **Found (v1.91):** menu items were mouse-only (Tab skipped the 13 items of 📁 File and went on to the mode
  buttons; the same for Reports & exports, Data, Setup and a row's ⋯), the four Funding detail headers and the
  fit chips were click-only, and the markup held 49 clickable spots that were not controls.
- **What was built:** menu items and the eight Funding detail headers are `<button>`s; **revised before merge,
  every other clickable spot is a native `<button>` too** (chips, links in messages, the pre-flight and
  divergence toggles, the CLIN cells' editors, the execution and CR expanders — a button inside the cell);
  the SVG funds-flow nodes keep `role="button"` with an `aria-label` and the gold focus ring. Esc closes a
  toolbar menu, a row's ⋯ menu or a chip list and returns focus to its button; a redraw keeps the keyboard's
  place; a row figure left with Tab moves on to the next field.
- **Not built (agreed 1 Oct):** dialog focus — a box taking focus, keeping Tab inside and closing on Esc —
  stays for a later version with one controller for every box.
- **Checks:** `npm run check` refuses a click handler on anything but a native control or a labelled SVG
  `role="button"` group, and `role="button"` on anything else (71 findings on the 30 Sep build, 47 on v1.91);
  `npm run keys`, `npm run panels` and `npm run standards` (baseline 0) as in the 30 Sep build.

#### 18. A diagnostics file for support — build before the road show
- **Logged:** 29 Sep 2026, from the maintainability review Brad shared; moved to Open for v1.92 on 30 Sep.
- **What was built:** 📁 File ▾ › Support › 🩺 Save diagnostics…, on the live board and in a PMO copy: the box
  shows exactly the text Save writes (version, kind of file, browser and window, how it was opened, storage and
  refused writes, counts only, and the last 50 warnings and script errors); Cancel and Esc write nothing;
  nothing is sent. Each entry is cleaned as it is kept and again when the file is made — every string the board
  holds, every quoted value, every figure (→ #) and every word the program never uses are taken out. The
  "RECORD panel could not be drawn" message points here. Revised before merge: the count of IDS batches is gone
  (nothing is recorded), and a test drives IDS-shaped state through it.
- **Checks:** `audit-other.mjs` "v1.92 — Save diagnostics holds no figure, title or name" (now with an ORG, a
  comment made only of the program's own words, file IDs, control numbers and dollars under `MS.ids`).

### v1.91 — 30 Sep 2026: items 28–35, built on Brad's "go"

**Everything the mouse can do in these places, the keyboard now can.** The status message beside the save
state has a real **Message** button: Tab reaches it, Enter or Space opens a long message whole, Esc closes
it, and it brings back a message hidden with ✕. A screen reader still hears a hidden message. In the
RECORD panel the CCaR record, the PID and the ✎ plan-event name are buttons, so they can be changed from
the keyboard for the first time. The five workspace modes are buttons that say which one is on.

**The "lane short" figure is whole again**, on two lines, and **the board fits between 761 and 1023 pixels
wide** in every mode: nothing runs off a row and the page no longer scrolls sideways. Below 760 pixels (a
phone) the board is for reading and checking a requirement; rank and fund on a wider screen. Brief's label
now says what it means: *Presentation view — requirements can’t be edited here*.

**A requirement's BAE budget is set in the RECORD panel**, under By service, and only there: one line for
each service and lane the requirement draws on, and a line marked *not funded yet* for a service with no
money yet, so its budget is already chosen when money arrives. Each line says how its budget was settled
(chosen, automatic by rule, from CCaR, not set, or a legacy budget to pick again) and shows the exact name
the Spend Plan Source will print. *Budget for every line* sets them all at once; *clear* puts one line
back to the rule; *Clear all* removes every choice on the requirement, including ones on lines no longer
shown. No figure, budget rule or export changed; every Spend Plan Source line was checked against the
panel after every step.

What shipped differs from what was logged in these places, all stated here:
- **The lane-walk "pin these figures" chip in the RECORD panel is a button too (29)**. It was click-only
  like the three fields, and not on the list.
- **The button reads *Message*, or *More* / *Less* when a long message is on its line (29)**, and ✕ now
  sits after it, so Tab reaches them in reading order.
- **On a phone the save-state group wraps (29).** The new button pushed the header 29 pixels sideways at
  320 wide.
- **The accessibility check's new keyboard test found 12 kinds of older click-only spot, in 70 places
  (29)**, where the log said ~41: it counts by what a spot does, and leaves out the backdrops that close a
  box. All 12 are recorded as known debt. The check also now shows a long message and opens Funding
  detail before it measures, because v1.90's folded panels had hidden them from it.
- **Brief's rows also ran off their edge at 761–936 pixels (31)** and were fixed with Rank's and Fund's;
  the task bar wraps below 1100 pixels. The "below 760 pixels" sentence is in the in-board guide as well
  as `CLAUDE.md`.
- **The controls check also loads a budget list and one budget choice (32)**, so the new budget controls
  are counted: 56 controls, the six new ones all in the RECORD panel, none lost.
- **Money in the other lane (35).** The log said a budget chosen for one lane leaves the other lane's
  line *not set*, named by the pre-flight. The board does what it did before, because the budget rule
  was not to change: the chosen name is never used on the other lane, which takes the rule's automatic
  answer. The line reads *not set* only where the rule has no single answer, and then the Spend Plan
  Source names it before it writes the file.
- **The panel shows the rule's budget in full (35)**, the name exactly as the file prints it; the old
  picker showed a shortened form. A line's picker also offers *back to the rule*, which does what the
  line's *clear* does, and once a family is chosen *Budget for every line* offers *none*, which is
  *Clear all*.
- **Esc closes the open message only while you are on it (29)**: pressed in a box or the drawer, Esc is
  theirs, and focus stays where it was.
- **The IDS message about a missing budget now points to the RECORD panel (35)**; it named Classify
  requirements.

**The final check** passed on 30 Sep (11:41 am–12:54 pm Eastern), on its first run: **73 minutes**, every
stage clean, all 565 planted mistakes caught, 12 of them new in this version (11 more in the list change
nothing by design, as before).

#### 28. The RECORD panel's "lane short" figure is cut off
- **Logged:** 30 Sep 2026, at Brad's request. Found while building item 27, and left alone there because
  that change was layout-only. **Approved by Brad, 30 Sep: two lines** (Claude's recommendation).
- **Found (measured on v1.90; v1.89 is the same):** in the RECORD panel's *By service* table, when a
  service was allocated money no lane could pay, a small red note under its UFR figure reads *lane short
  $…*. The UFR column is pinned at 78px and its cells hide what overflows, and the note is 8px bold on
  one line, so the end of the figure is cut off with no ellipsis. On the example board, **115 of the 121
  notes are cut** (92 of 97 in the service rows, 23 of 24 in the TOTAL row), by up to 12px, the same at
  every width from 1024 to 1920 and in every density. *lane short $150,000* shows as *$150,00*, and
  *$1,168,856* as *$1,168,8*. The number underneath is right, and nothing saved or exported is
  affected, but the figure you read on screen is wrong. It is money, so treat it as one.
- **What will be built:** the note on two lines, *lane short* and then the figure on a
  line of its own, at 9.5px (the panel's label size since v1.90), with the whole sentence in its
  tooltip. A nine-digit figure ($123,456,789) then fits the 78px column, and the Req, Disc and Mand
  boxes keep their widths. A row with a note gets about 11px taller.
  - *Not chosen:* widening the UFR column to about 92px and keeping one line. That took about 14px from
    the three money boxes, and a nine-digit figure would still not fit.
- **What does not change:** the figure itself and how it is worked out, every other cell of the table,
  and every export.
- **Checks:** every note under the By service table fits its cell, for every requirement on the
  populated example board plus one planted with a $123,456,789 shortfall, at every width from 1024 to
  1920 and in all three densities. A planted one-line note must fail that check.

#### 29. Keyboard and screen-reader access: the status message and the RECORD panel's record fields
- **Logged:** 30 Sep 2026, from the post-v1.90 review Brad shared, checked on the v1.90 board.
  **Approved by Brad, 30 Sep: Claude's recommendations.**
- **Found (v1.90; the RECORD part predates v1.89):** the status message beside the save state is a
  clickable `div` and the save state a clickable `span`, so expanding a cut-off message, or bringing back
  one that was hidden with ✕, works only with a mouse (Tab reaches ✕ and never either of them). Once
  hidden, or for the quiet start-up line, the `role=status` region is `display:none` and leaves the
  accessibility tree, so screen readers hear nothing. In the RECORD panel the CCaR record, the PID and the
  ✎ plan-event name are click-only too, and nothing else edits them, so they cannot be changed from the
  keyboard at all. `npm run standards` has no 2.1.1 Keyboard test, so it reported 0. WCAG 2.1.1 and
  4.1.2, Level A (Section 508).
- **What will be built:** one real **message** button beside the save state (`aria-expanded`): Tab,
  Enter or Space opens the full text, Esc closes it and focus returns to the button, and after ✕ focus
  goes to it. The save state becomes plain text; ✕ stays. The message region stays in the accessibility
  tree when hidden (visually hidden, not `display:none`). The CCaR record, PID and ✎ plan-event name
  become real buttons. `npm run standards` gains a 2.1.1 criterion (a visible clickable element that is
  not a control and takes no focus); the ~41 older click-only spots it will find are recorded in the
  baseline as known debt, fixed over time.
- **What does not change:** any message's wording or how long it stays (item 19 stays deferred),
  figures, the saved file, and the ids `#shareStat`, `#saveState` and `#statWrap` the suites read.
- **Checks:** a long warning is cut off on screen, then reached, opened and closed from the keyboard
  alone, with focus put back; after ✕ the region is still in the accessibility tree; the three RECORD
  fields are edited from the keyboard alone; the new criterion fails on the v1.90 board first.

#### 30. The workspace mode buttons say what they are
- **Logged:** 30 Sep 2026, same review. **Approved by Brad, 30 Sep: Claude's recommendation (option B).**
- **Found (v1.90):** Review, Rank, Fund, Compare and Brief are marked up as ARIA tabs, which promises
  arrow keys and tab panels they do not have. They are one workspace shown five ways, not five panels.
- **What will be built:** native buttons in a group labelled *Workspace*, the selected one
  `aria-pressed="true"`; the styling keys off that instead of `aria-selected`.
- **What does not change:** what each mode shows, the `spmtMode` key and the fallback to Review.
- **Checks:** no tab roles remain and exactly one button is pressed; a reload keeps the mode and a bad
  stored value opens Review; changing mode changes no data (layout G).

#### 31. Rows and the top fit between 761 and 1023px wide
- **Logged:** 30 Sep 2026, same review. **Approved by Brad, 30 Sep: Claude's recommendation.**
- **Found (v1.90, measured one pixel at a time):** in Fund the allocation box runs past the row's edge
  at 761-884px, and in Rank the ★ does at 761-804px (new: the modes are new). The page scrolls sideways at
  761-808px depending on the mode (v1.89 did at 761-821px). No check looked at rows below 1024px:
  `layout-fits` C and D stop at 1024, `toolbar-fits` at 820, and the standards reflow check is 320.
- **What will be built:** the row column widths in that range fixed for every mode, and the top bars held
  to the window. Stated in `CLAUDE.md`: below 760px the board is for reviewing and inspecting only (the
  money columns and the allocation box are hidden there, as they are today).
- **What does not change:** anything at 1024px and wider, or at 760px and narrower.
- **Checks:** at every width from 761 to 1023, in all five modes, in Harbor and Parchment, no sideways
  scroll and no row control past its row; the drawer's three editors on screen at 900 and 768px; a
  390px smoke check. A planted overflow in Fund's column widths must fail.

#### 32. Say what the row may edit
- **Logged:** 30 Sep 2026, same review. **Approved by Brad, 30 Sep: Claude's recommendation.**
- **Found:** `AGENTS.md` (written in v1.90) says "Do not put an editor on a requirement's row", while the
  approved v1.90 design puts the total allocation box on the row in Fund, the row's comment calls it
  "Triage, not editing", and the older row rule in `CLAUDE.md` does not mention the box. The box stays:
  the RECORD panel has no total-allocation editor, so it is the only way to set one on a requirement not
  on a Split. `tools/row-controls.json` records every requirement control but not which surface it is on,
  and its fixture never opens the CLIN drill, which draws inside the row.
- **What will be built:** `AGENTS.md`, `CLAUDE.md` and the row's comment say: "The row is for triage.
  Its direct decisions are rank (the rank box, ▲▼ in Rank, the ⠿ handle), ★ Mission Critical and, in Fund
  only, the total allocation for a requirement not on a Split. Lifecycle actions are in its ⋯ menu. The
  CLIN drill opens inside the row for a CLIN requirement. Everything else, per-service funding included,
  is edited in the RECORD panel. A mode or density changes only what is shown, never a figure."
  `row-controls` records which surface each control is on, and its fixture includes a CLIN requirement.
- **Checks:** a new editor added to the row, or one moved there from the RECORD panel, fails
  `npm run controls`.

#### 33. Brief's label says what is read-only
- **Logged:** 30 Sep 2026, same review. **Approved by Brad, 30 Sep: Claude's recommendation.**
- **Found:** Brief's label reads "Read-only — nothing here edits", while File, Data, Setup and Save still
  work there (on purpose: locking them would hide saving and recovery).
- **What will be built:** "Presentation view — requirements can't be edited here", and the guide's
  "(read-only, for the room)" to match.

#### 34. The browser checks find Chromium without a hard-coded version (tests only)
- **Logged:** 30 Sep 2026, same review. **Approved by Brad, 30 Sep: Claude's recommendation.**
- **Found:** 14 tools hard-code `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` and only
  `shoot.mjs` reads `CHROME_BIN`, so a machine with another Chromium version cannot run any browser check
  (the reviewer's could not). Chromium is at that path here, and the gate fails rather than passes when it
  is missing.
- **What will be built:** one lookup the 14 tools share, in order: `CHROME_BIN`, then
  `/opt/pw-browsers/chromium`, then the newest `/opt/pw-browsers/chromium-*/chrome-linux/chrome`, else a
  clear error naming what was tried. Never `playwright install`.

#### 35. Assign, change or remove a requirement's BAE budget in the RECORD panel
- **Logged:** 30 Sep 2026, at Brad's request. **Approved by Brad, 30 Sep: budgets can be assigned to
  unfunded requirements too, and the RECORD panel is the only place to set one (Claude's
  recommendation).**
- **Found (v1.90):** the budget picker is inside 📋 Requirement edit, and shows only when a BAE list is
  loaded and a service line is drawing money this year (`budRecFields` → `budPairs`), so a requirement
  not yet funded cannot be given a budget. Clearing the whole requirement (`setBudFam` with none) clears
  only its funded lines: a choice on a line that is no longer funded stays in `S.budgetAsg`, unseen, and
  comes back if that line is funded again.
- **What will be built:** a **BAE budget** section in the RECORD panel, below By service.
  - **One line per service with a requirement value, funded or not.** A funded line is named by its lane
    and shows how its budget was settled: chosen, automatic by rule, from CCaR, not set, or legacy —
    pick again. A service with no money yet shows one line marked *not funded yet*; the budget chosen
    there carries its own lane (a discretionary budget is used when that service draws discretionary,
    one with no lane for either), and if money arrives in the other lane the line reads *not set* and the
    pre-flight names it, as today.
  - **Assign or change:** one "budget for every line" picker (unfunded lines included), and a picker on
    each line.
  - **Remove:** *clear* on a line puts it back to the rule's answer; *clear all* removes every choice on
    the requirement, the unseen ones included, and says how many it removed.
  - **No BAE list loaded:** the section says so and points to Data › 💰 Import Budget Extract (BAE)….
  - **One editor:** the picker leaves 📋 Requirement edit, whose "N of M not set" count stops counting it.
    The pickers are ordinary keyboard controls (item 29).
- **What does not change:** the budget rule itself; the Spend Plan Source still writes funded lines only
  and prints the same for any line nobody touches; assignments already saved on boards; the field still
  travels in a PMO copy's submittal.
- **Checks:** assign, change one line, clear one line and clear all, and after each step every Spend
  Plan Source line's Budget cell equals what the panel shows; a budget chosen while a requirement is
  unfunded is on its Spend Plan Source line once money is allocated in that lane, and money in the other
  lane leaves the line *not set* and named by the pre-flight; *clear all* clears an unseen choice on an
  unfunded line; all of it survives save and reopen, and a PMO copy's submittal carries it; Requirement
  edit no longer offers the picker; a mutation that makes *clear* leave a line set is caught.

### v1.90 — 30 Sep 2026: item 27, built on Brad's "go"

**The board opens on the requirements.** One strip across the top holds the appropriation, fiscal year,
office, search, filters, Save, Help and File. Under it, five tabs set what you are doing (Review, Rank,
Fund, Compare, Brief) and show that job's tools, beside three menus (Reports & exports, Data, Setup) that
hold everything the old Active year, Budget year, FYDP, Tools and Export menus did. One line of funding
figures, the scorecards' own to the dollar, sits under the tabs; *Funding detail* opens the scorecards,
chart and tables, unchanged.

**A row is one line of title and one of identifiers**, with its warnings where they cannot be cut off
and ★ and ⋯ always in view (at 1440 and 1600 wide, ⋯ had been out of sight on every row). Compact,
Comfortable and Presentation set how much fits; they, the tab and row detail are yours only, never
saved in the file. Drag from ⠿. Selection and keyboard focus look different. No figure, saved field,
import or export changed.

What shipped differs from the approved prototype in these places, all stated here:
- **Search reads the PID too (27)**, because the approved search box says it does.
- **"Funded" on the Whole budget line is the funded amount (27).** The prototype printed the total budget
  authority, the same figure only on its seeded board.
- **The bars fit by measuring themselves (27)**, not only below 1100px: a bar that would run past the edge
  drops its labels first, then folds the tab's tools into one menu.
- **Menu items keep their icons (27)**, as every menu has today.
- **Set base year and Reset are in Setup and still in the Fiscal year menu (27).**
- **A status message shows beside the save state until the next one (27)**; the prototype showed a board
  at rest, with no message.

**The final check** passed on 30 Sep (7:07–8:19 am Eastern), on its first run: **73 minutes**, every
stage clean, all 553 planted mistakes caught, 4 of them new in this version and 4 moved to the new
layout (11 more in the list change nothing by design, as before). The same check had passed on the
branch before the PR, in 71 minutes.

#### 27. The board's layout: context bar, workspace modes, a denser, clearer row
- **Logged:** 30 Sep 2026. **Approved by Brad, 30 Sep, exactly as prototyped** ("A") after a Stage 1
  review with rendered before/after screenshots (Harbor, Parchment; 1440, 1366, 900 wide).
- **Found (measured on v1.89):** at 1440×1000 the first requirement starts 1,370px down the page, below
  the header, the toolbar, a status line, four scorecards, the fit strip and two chart panels -- no
  requirement is on screen when the board opens (1,467px at 1366×768). Rows run 64-110px tall because
  they carry editors as well as triage controls. **And a defect:** between about 1401 and 1745px wide,
  with the RECORD panel docked, each row's allocation and ⋯ column overflows and is clipped -- at 1440
  and 1600 the ⋯ menu (rename the record name, reset the allocation, move or copy to a year, remove) is
  out of sight on every row.
- **What will be built:**
  - **One sticky top area.** A context bar -- appropriation, fiscal year, PMO, search, Filter with the
    active filters as removable chips, saved/unsaved state, Save, Help, File. A task bar -- five
    workspace modes (Review, Rank, Fund, Compare, Brief), the chosen mode's tools, and three grouped
    menus (Reports & exports, Data, Setup) that between them hold every item the Active year, Budget
    year, FYDP, Tools and Export menus hold today. A funding posture strip -- the four scorecards'
    headline figures, unfunded by service and what needs attention -- with *Funding detail* opening the
    scorecards, the fit strip and the funding panels, unchanged.
  - **The row:** rank, PMO, title with one quiet line under it (CCaR, PID, award, cost element) and its
    exceptions pinned where they cannot be cut off, decision band, requirement, cumulative, lane (word
    and meter), ★, ⋯. Two densities and a third for presenting: Compact, Comfortable, Presentation.
  - **Modes change emphasis, never the data.** Rank adds ▲▼ and the office's own rank. Fund shows
    Discretionary, Mandatory and Unfunded and the allocation box. Compare gathers the cycle tools.
    Brief is read-only, for the room. Mode and density are this browser's own settings, like the
    colours, never saved into the file.
  - **One grammar:** buttons act, boxes edit, a chip is a status or a removable filter, clicking a row
    selects it, drag only from ⠿. The row's cost element, prime/OGC tag and record name stop being
    editors (each is edited where it already is: Requirement edit, the ⋯ menu); the ▲ not-drawn flag
    becomes a status and the fix list opens from *Needs attention*; ★ is a 24px toggle that says whether
    it is on. Selection is a gold bar and a tint; keyboard focus is its own ring.
  - **The RECORD panel keeps its content and order**, with a legible type scale (labels 9.5px, not 8)
    and CCaR / PID boxes that say "✎ Change".
  - The guide inside the board, and every message that names a menu path, re-pointed.
- **What does not change:** every calculation, lane walk, cutline and figure; the saved file and every
  import, export, package, PMO copy, submittal, cycle and snapshot; the themes and the browser keys.
- **Checks:** the posture strip prints exactly the scorecards' figures (compared on every audit board);
  every item of the old menus is reachable in the new ones; no row control is clipped at any width from
  1024 to 1920; the first requirement is on screen when the board opens; Brief carries no editing
  control; the fund columns agree with the RECORD panel; standards stay at 0 findings in every theme,
  density and mode.
- **Built on branch `claude/orbit-ui-modernization` (30 Sep), PR #1, shipped as v1.90 on go.** A full
  gate ran on the branch before the PR (passed, 70.9 min, 553/553 caught, first run) and again on the
  version that shipped. Where the build differs from the approved prototype, all small:
  - **The search reads the PID too.** The approved box says "Search title, event, CCaR, PID…"; the search
    did not read PIDs, so it does now, rather than the box promising something it does not do.
  - **"Funded" on the Whole budget line is the funded amount.** The prototype printed the total budget
    authority there; on the seeded board the two were the same figure, on a board with money left they
    are not. The strip reads the card's own funded figure.
  - **The bars fit by measuring, not only at 1100px.** Fund's tools and two active filters can overfill
    a 1366 or 1152 window; a bar that would run past the edge drops its labels first, then folds the
    mode's tools into one menu -- the same menu the prototype showed below 1100px.
  - **Menu items keep their icons** (📅, ⚖, 📊 …), as they are in every menu today; the prototype's
    menus were drawn without them.
  - **Set base year and Reset to blank are in Setup and still in the Fiscal year menu**, where people
    look for them today.
  - **A status message shows beside the save state until the next one**, with the full text in the
    tooltip; only the ordinary "opened" line waits quietly in the tooltip. The prototype showed the board
    at rest, where there is no message.
  - **Drag starts only from ⠿**, as the approved interaction rules say; the whole row used to start one.

### v1.89 — 30 Sep 2026: items 22–26, built on Brad's "go"

**Whole dollars when a requirement is added by its total.** The total is spread so the services add up
to exactly what was typed, the dollars left over going to the first services in the list. A new check
reads every figure of all nine workbooks: one shown as whole dollars must be one.

**Saving never silently overwrites somebody's work.** Save asks whenever the file is any save other
than the one the work on screen came from. Work held only in this browser is kept aside, never thrown
away, when a newer saved copy opens, and one click puts it back. A file that cannot be read, or is not
a board, is never written over. A download says it is not on the shared file yet. The shared folder is
held to the same rules.

**An added requirement never inherits a deleted one's data**, and **Restore brings back what Remove
took**. **The change journal says when it could not record everything**, and a RECORD panel that fails to
draw is emptied rather than left showing old figures.

What shipped differs from the log in these places, all stated here:
- **Save compares by which save it is, not by which is later (23).** The log said Save would ask when
  the file "changed underneath you", checked by time. Building the clock-difference test showed a
  "later than" check still lets a colleague whose clock is an hour slow be written over. Save now asks
  whenever the file is a different save, earlier or later.
- **"Unsaved work" is something this browser records, not a comparison of times (23)**, for the same
  reason: two computers' clocks disagree. The record of which saved copy the work came from is kept in
  this browser beside the board, never inside it, like the save file's handle.
- **The shared folder had the same flaw (23), found while building this.** Reopened, it treated the
  folder's current copy as the one the work came from, so a colleague's save was written over; and its
  old refusal said "Reload to take their copy", which then wrote over them. Now Save stops with a
  choice: load theirs (yours kept aside) or save yours over theirs (theirs kept in the folder's history
  first). A folder copy that cannot be read is never written over.
- **Two more folder defects, found while building this (23).** Putting an earlier copy back and then
  saving was refused every time; it now saves. And two history copies kept in the same second shared a
  name, so the second replaced the first; names never repeat now.
- **The journal still records a deletion (24).** The log said neither the saved file nor the export
  holds any deleted text. The plan and every workbook hold none; the change journal still records the
  deletion, which is its job, and a locked cycle keeps what it locked.
- **Moving an added requirement to another year (24)** now takes all its data with it; it left all of
  it behind, allocation and MC star included.

**The final check** passed on 29 Sep (9:19–10:25 pm Eastern), on its first run: **66 minutes**, every
stage clean, all 549 planted mistakes caught, 33 of them new in this version (11 more in the list change
nothing by design, as in v1.88).

#### 22. Adding a requirement by its total spreads whole dollars
- **Logged:** 30 Sep 2026. **Approved by Brad, 30 Sep.** Money: a can't-fail.
- **Found (reproduced on v1.88):** *Add requirement* with one total instead of per-service values
  divides the total by the number of services and never rounds it (`addReq`). The rule every other
  spread follows -- through `apportion()`, whole dollars that add up exactly -- was missed here.
  - Before the board is reopened, the workbook prints figures like 999,999.9999999999 and an unfunded
    row of $1.000000000000007, and two sheets disagree about the same requirement.
  - On reopen each service is rounded by itself, so the requirement changes: $1,000,000 typed across
    six services becomes $1,000,002; $100 across three becomes $99.
  - Nothing else is affected: per-service entry, a PMO-proposed requirement and every other spread
    already give whole dollars.
- **What would be built:** the total is spread with `apportion()`, whole dollars adding up to exactly
  what was typed. A requirement whose values are not whole dollars is refused with a message.
- **Brad's decisions (30 Sep):**
  - The dollars left over go to the first services in the list: $100 across three is 34 / 33 / 33.
  - Boards already saved open as they do now, each service rounded to the nearest dollar, up or down.
    Nothing is re-spread.
- **Can't-fail checks:**
  - Add by total for 3 services / $100, 6 / $1,000,000, 3 / $1,000,000, 1 / $7 and 6 / $5: every
    value a whole dollar, the sum exactly the typed total, unchanged after save and reopen.
  - A new check across every export: every money cell is a whole dollar, so the next path that
    misses the rule is caught too.
  - Planted mistakes that must be caught: the old division; rounding each share instead of
    `apportion()`; the refusal removed.

#### 23. Saving never silently overwrites somebody's work
- **Logged:** 30 Sep 2026. **Approved by Brad, 30 Sep: Claude's recommendation.** Data loss: a
  can't-fail. The most serious item from the review.
- **Found (reproduced on v1.88):**
  - On opening, the board shows whichever is newer, the shared file or this browser's own copy, and
    then treats the file's time as the point it loaded from, whichever it showed.
    - A colleague saves the shared file; this browser holds edits made after it was last opened and
      never saved to the file. The board shows the browser's copy without the colleague's changes,
      and the next 💾 Save overwrites their work with no warning: the "someone saved after you
      loaded" check does not fire. No difference between the two computers' clocks is needed.
    - If the file is the newer one, edits held only in this browser are replaced with no message.
    - In the first case the opening message says "No saved state in this copy", which is wrong.
  - The "someone saved after you loaded" check skips itself if the file cannot be read (for example
    while Teams or OneDrive is syncing it) and saves anyway.
  - The shared-folder save treats a copy it cannot read as no copy at all and writes over it without
    keeping a history copy; a history copy that fails to write is never reported.
  - When saving in place fails and a copy is downloaded instead, the header stops saying "unsaved
    changes" although the shared file was not updated.
- **What would be built:**
  - The board records which saved file its state came from, and Save checks against that: it asks
    whenever the file changed underneath you.
  - Work held only in this browser is never thrown away by a newer file. It is kept as a backup, the
    board says so, and one click puts it back.
  - A file that cannot be read is never written over: Save refuses and offers *Save a copy*. The
    shared folder writes over a copy only when there genuinely is none, and says so if its history
    copy could not be kept.
  - After a download, the header says the change is downloaded but not yet on the shared file.
  - The opening message says which copy it opened and why.
- **Compatibility:** a board opened on v1.89 for the first time, whose browser copy is newer than the
  file, has no record of where it came from, so its first save asks once. The import check accepts the
  new record. Nothing else about saved boards, PMO copies or packages changes.
- **Can't-fail checks:**
  - With a stand-in for the file in the tests: reopen with and without a clock difference, a file
    that cannot be read, a file with no saved state. Each one asks or refuses; none writes.
  - Browser-only work displaced by a newer file comes back with one click, whole.
  - Planted mistakes that must be caught: the old loaded-from time; the check that skips itself on an
    error; the shared-folder read that treats any error as no copy; the backup not kept.

#### 24. An added requirement never inherits a deleted one's data
- **Logged:** 30 Sep 2026. **Approved by Brad, 30 Sep.** Wrong figures and text on exports: a can't-fail.
- **Found (reproduced on v1.88):**
  - A new added requirement is numbered one past the highest *remaining* one, so deleting the newest
    (NEW-3) and adding another makes a new NEW-3. Accepting a PMO-proposed requirement numbers it the
    same way.
  - Delete clears 9 of the ~34 kinds of data a requirement carries, so the new one inherits the rest:
    20 fields, among them the decision band, award dates, destination, PID, CCaR number, record name,
    impact statement and WBS, and the UPL mark. It survives save and reopen; the deleted text printed
    in 23 cells of the workbook, on the Decision Bands, Funded – Discretionary, Unfunded Requirements
    and RCN-EEIC by Month sheets among others.
  - Moving an added requirement to another year leaves all of its data behind -- allocation and MC
    star included -- for the next one added in that year.
  - Comparing against a locked cycle reports the new requirement as a change to the deleted one
    instead of one removed and one added (the totals still add up).
- **What would be built:**
  - A number is never used twice in a year: the next is above every number the year has ever held, in
    any of its lists, and the highest is saved with the board.
  - One list of a requirement's kinds of data, shared by delete, move-to-year and copy-to-year, so a
    kind added later cannot be missed.
  - Deleting an added requirement removes all of its data from the file.
- **Brad's decision (30 Sep):** deleted added requirements are purged from now on. Leftovers already in
  saved boards are left where they are; they can no longer be inherited.
- **Can't-fail checks:**
  - Every kind of data filled in on the newest added requirement, with the round-trip fuzz's own
    filler so kinds added later are covered automatically. Delete then add, accept a proposal, move
    to another year: the new number differs, it carries nothing of the old one, and neither the saved
    file nor the export holds any of the deleted text.
  - A board already holding leftovers numbers past them.
  - The completeness check fails if a kind of data is missing from the shared list.
  - Planted mistakes that must be caught: numbering from the remaining requirements only; the highest
    number not saved; one kind missing from the list; delete skipping the purge.

#### 25. Restore brings back what Remove took
- **Logged:** 30 Sep 2026. Found during Claude's check; not in the review. **Approved by Brad, 30 Sep.**
  Data loss: a can't-fail.
- **Found (reproduced on v1.88):** removing a requirement that came with the board's data (not one
  added at the drill) erases its allocation, MC star, note, renamed title, CLIN breakdown and cost
  element -- while the confirmation says "Restore any time from the Removed list". Restore brings the
  requirement back without them: with no allocation, so unfunded. Moving it to another year keeps
  them; only Remove erases. Each can be put back one at a time from the change journal, if you know to.
- **What would be built:** Remove keeps them, and Restore returns the requirement exactly as it was.
- **Brad's decision (30 Sep):** *"Keep them so restore brings it back."*
- **Can't-fail checks:** remove, restore, save, reopen: allocation, MC star, note, title, CLIN
  breakdown and cost element as before. While removed, it counts in no total and appears on no export.
  Planted mistake that must be caught: Remove erasing them again.

#### 26. The change journal says when it could not record everything
- **Logged:** 30 Sep 2026. **Approved by Brad, 30 Sep: a summary entry.**
- **Found (reproduced on v1.88):**
  - One save records at most 200 changes and drops the rest without a mark: 240 edits in one save
    left 200 entries. A PMO apply of more than 200 fields still says "Each one is recorded in the
    change journal, so it can be found and undone later", and the journal says "Every field that
    changed".
  - If recording fails partway, every entry for that save is dropped, silently.
  - If the RECORD panel's redraw fails, the error is swallowed and the panel can keep showing the
    previous figures.
- **What would be built:**
  - Past 200, one summary entry: how many more changes that save made, by whom, and that they cannot
    be undone one at a time. The PMO apply message and the journal's own wording say the same.
  - A recording failure writes one entry saying so.
  - A failed RECORD panel redraw empties the panel and says so on the status line, never old figures.
- **Can't-fail checks:** 240 edits in one save give 200 entries plus one summary with the right
  count; a PMO apply of more than 200 fields gives the same; a package import still warns about the
  changes made here since. Planted mistakes that must be caught: no summary; a recording failure
  dropped silently; the RECORD panel error swallowed.

### v1.88 — 29 Sep 2026: items 17 and 21, built on Brad's "go"

**One board file.** The card build is gone from the repository (the last one stays in the history). The
grid file keeps its name, and every tool, script and the final check now run once, on it. A board saved by
the card build still opens in the grid: the tests import one written by the last card build, and one
written by the v1.87 grid, and every plan, cycle, list and figure comes across unchanged.

**A file from someone else is data, never code.** Every way a file comes in -- a full board, one
appropriation, several boards at once, a package, a submittal, a band ladder, and the shared folder -- now
reads the whole file first and refuses it, all of it, with one message saying what and where, if it
carries what no board writes. Separately, the board now draws any text as text: a test board with
script-shaped text planted in 109 places, opened on every screen, runs none of it. On the v1.87 board the
same test finds 65 places where planted text became markup or code.

What shipped differs from the log in these places, all stated here:
- **Fields the board does not know are kept, not dropped.** The log said "dropped, not refused". Building
  it showed that dropping has a data-loss cost the log did not weigh: a field written by a NEWER version
  would be lost when the file went back to it. Nothing reads an unknown field, so keeping it is safe. The
  one exception is three names that can reach inside the program (`__proto__`, `constructor`,
  `prototype`); no board writes them, and a file carrying one is refused.
- **Click handlers still name the requirement, through one encoder, instead of reading it from the page.**
  The log said handlers would "no longer carry a requirement id inside their code". The encoder (`jsa`)
  gives the same guarantee -- whatever a value holds, it reaches the handler as one piece of text -- and it
  covers every value in a handler, not only ids: office and service names, CLIN keys, cycle keys. About
  190 handlers were converted, and a check now fails if one is ever written the old way.
- **More than the log listed was fixed.** The test board found about 40 further places that wrote a
  service name, an office name, an id, a cost-estimate name or a band colour onto the screen unescaped.
  Each is fixed.
- **The shared folder is a way in too.** Not in the log's list; its copies are written by other people's
  boards, so they go through the same check.
- **Not covered by the check:** the Excel workbook imports (execution data, cost estimates, the BAE list,
  CCaR records). They are read cell by cell, not as board files, and their amounts already go through the
  board's number reader. Their text is drawn through the same escaping, and the test board plants text in
  the stores they fill.
- **The final check** passed on 29 Sep (4:11–5:03 pm Eastern): **52 minutes**, every stage clean, all 516
  planted mistakes caught (v1.87's took 1 hour 38 minutes, across two builds). The run before it failed
  on two of the older planted mistakes, whose search text the new encoding had changed; they were
  re-aimed, both caught, and the board did not change between the two runs.
- **The limits, measured against a real board:** files up to 64 MB (a populated board is 3.3 MB), text up
  to 200,000 characters in one field (the longest measured was 74), nesting to 64 levels (8 measured).

#### 17. One board file: retire the card build, keep the grid
- **Logged:** 29 Sep 2026, Brad: *"I also want to get rid of the duplication of files. The grid file is
  the only one I use now. No need to maintain two files."* Decided.

##### What there is today (read 29 Sep, v1.87)
- Two complete copies of the program: `prioritization-board.html` (card layout, ~25,100 lines) and
  `prioritization-board-grid.html` (grid layout, ~25,500 lines). Every change is made twice; a parity
  check keeps their shared logic identical, with 4 declared differences.
- 21 of the 33 test tools name the card file, and every check runs on both builds -- the final math
  gate runs its whole mutation sweep twice. Two tools exist only to keep the copies in step: the parity
  check and the card-versus-grid controls comparison.
- The README and CLAUDE.md describe two builds; the card file is the tools' default.

##### What would be built
- The card file is deleted from the repository (it stays in the project's history). The grid file is
  the one program, and every tool, script and document points at it.
- Checks that only existed to compare the two are retired or re-aimed: parity goes; the controls check
  compares the grid against its own recorded list of controls, so a control can still never vanish
  unnoticed.
- The grid file keeps a few card-only code paths that are now unreachable. They are left alone in this
  version (removing them is risk for no visible gain) and noted for later.
- The final check runs once instead of twice: expected well under an hour on this machine.

##### Can't-fail checks for the build
- Every test that ran on the grid build still runs, with the same result; nothing that checked the grid
  is lost with the card file.
- A board saved by the card build opens in the grid build with everything in it (same saved format):
  proved by importing one.
- The full math gate.

##### Brad's decision (29 Sep 2026)
- **The file keeps its name:** `prioritization-board-grid.html`. Nothing anyone has saved or linked
  changes.

#### 21. Imported files treated as untrusted: checked at every way in, and nothing in them can run
- **Logged:** 29 Sep 2026, from the engineering review Brad shared (its #1 and #2). Brad: *"Should we
  make these updates? Offer your real opinion not what you think I want"*; Claude recommended this,
  narrowed; Brad: *"Yes, update the log that way."* **Approved for v1.88.**
- **Why it matters here:** not because an attack is likely, but because of the can't-fail on the math.
  A deliberately crafted file could run code inside the board that quietly changes figures that are
  then briefed. The everyday benefit is accidental bad files -- truncated or hand-edited -- getting a
  clear refusal instead of a partial import.

##### What the board does today (read 29 Sep, v1.87)
- **Already in place:** a full import refuses files older than v1.80; a state written for a different
  set of services is refused; every import is previewed and asks before discarding work; nothing a
  submittal proposes is applied until it is ticked; amounts are checked as finite numbers in places.
- **The gaps:** the escaping helper `esc()` covers `&`, `<` and `"` but not the single quote; ten click
  handlers build their code by inserting a requirement id directly; ids that arrive in an imported
  board or a submittal are not checked; there is no file-size limit.

##### What would be built
- **One check at every way a file comes in** -- a full board, one appropriation, several boards at once,
  an appropriation package, a submittal: requirement ids must be made of safe characters; amounts must
  be real, finite numbers within range; text has a length limit and files a size limit. **Fields the
  board does not know are dropped, not refused** -- refusing them would reject genuine files written by
  older and newer versions, which the full import is built to accept (v1.80 onward). Anything refused
  gets one clear message saying what and why; nothing is imported partly and silently.
- **Nothing in a file can run:** the escaping covers the single quote, and click handlers no longer carry
  a requirement id inside their code.
- **The format written down:** the checks are, in effect, a description of the saved file; it is
  recorded in CLAUDE.md so later versions change it deliberately.

##### Can't-fail checks for the build
- **A hostile file does nothing:** a test plants script-shaped text and hostile ids in every field of
  every file type and proves nothing runs, nothing is stored that should not be, and every figure is
  unchanged.
- **Every genuine file still imports exactly as before:** the existing tests of files written by v1.80,
  v1.83, v1.85 and v1.86 pass unchanged, figure for figure; a board with no hostile content opens,
  saves and exports identically.
- Mutations for each check; the full math gate.

### v1.87 — 27 Sep 2026: items 15 and 16, built on Brad's "go" — the math gate, shortened

The board is unchanged apart from its version: this is the testing side only.

What shipped differs from the log in these places, all stated here:
- **The import suite (16) was slow because of a bug, not because of its size.** Measured: 26 of its 65
  seconds went to a helper added in v1.86 that, after every test block, turned a whole saved board file
  (3.2 MB of text) into a list of 3.2 million single characters and threw it away. Fixed: 65 s → 38 s,
  and half the memory. Sharing boards between blocks, as logged, was not needed, so it was not built.
  Proof: all 1,030 of the suite's checks, on both builds, run in the same order with the same results.
- **The early stop (15)** was built as logged. Twelve planted mistakes, two from each test suite that
  catches them, were each caught by the same suite as in the v1.86 check, in about 8 seconds each
  instead of ~86.
- **The result:** the full check that passed v1.87 took **1 hour 38 minutes** -- v1.86's took 5 hours 57,
  and the run before that 9 hours 42. Every planted mistake was caught on both builds (474 of 474),
  each by the same test as in v1.86. Nothing about what is checked changed.

#### 15. The math gate: stop a test run at its first failed check during the mutation sweep
- **Logged:** 27 Sep 2026, Brad: *"Once we're done let's figure out how we can shorten the processing
  time. I'm not sure if it's something I can fix on my end or if it's on your end"*; *"Yes"* to logging
  this for v1.87. It is on the testing side; nothing on Brad's end changes. Tests only: the board is
  not touched.

##### What the gate does today (measured 27 Sep, v1.86)
- The mutation sweep plants each of 485 deliberate mistakes in the board, on both builds, and runs the
  test suites until one catches it. A mistake counts as caught as soon as **one** check fails -- but
  each suite still runs **every** check to its end before reporting.
- Suite times on the clean card board: import 67 s, board 13 s, recon 5.5 s, the other three 8 s
  together. Most mistakes reach the import suite.
- The v1.86 gate took 5.9 hours (the sweeps 332 and 351 minutes). The next one also has the catch
  record from v1.86 (each mistake tries the suite that caught it last time first), expected ~4–4½ hours.

##### What would be built
- When the sweep runs a suite, the suite stops at its first failed check and reports it as caught.
  Every other run -- `npm run audit`, the gate's own suite stage, a run by hand -- still reports every
  failure, as now.
- Estimated saving: another 20–30% of the gate.

##### Can't-fail checks for the build
- **The verdict for every mistake is identical** with and without the early stop: the full sweep run
  both ways once, on both builds, compared mistake by mistake (caught, survived, crashed, equivalent).
- The early stop can never switch on outside the sweep; a block that throws still counts as caught.
- The full math gate.

#### 16. The math gate: slim the import suite
- **Logged:** 27 Sep 2026, with item 15 (same request, same *"Yes"*). Tests only: the board is not
  touched.

##### What the suite does today (measured 27 Sep, v1.86)
- 67 of the 94 seconds all suites take together; about 105 boards opened, across 52 test blocks of
  1–8 seconds each (the longest: the destination lists merging, 8 s; every appropriation read by its own
  board, 6 s; the PMO copy's own storage, 6 s). Opening boards is most of it.
- The full-import test rebuilds boards saved by v1.80, v1.83 and v1.85 from the project's history.

##### What would be built
- Blocks that only read a board share one; each older version's saved file is built once per run, not
  once per block. Every check keeps its name, its wording and what it proves.
- Estimated: 67 s → about 35 s. With item 15, the gate on this machine lands around 2–3 hours.

##### Can't-fail checks for the build
- **Every check still runs and still means the same thing:** the list of checks and their verdicts on
  the clean boards, before and after, compared one by one.
- **A shared board cannot carry one block's changes into another:** a guard fails the suite if a block
  that shares a board changes it.
- **The sweep catches exactly the same mistakes** as before; peak memory stays under the sweep's cap.
- The full math gate.

### v1.86 — 26 Sep 2026: items 9–14, built on Brad's "go"

What shipped differs from the log in these places, all stated here:
- **Destinations (11).** Where two appropriations spelled one place differently ("Raytheon", "RAYTHEON"),
  the first spelling the board read is the one kept. An unnamed "New destination" nobody used is not
  carried over. A destination a **locked cycle** names cannot be removed (a lock is a fixed point), and
  the panel says where each one is used. A new destination reads first in the panel, ready to name.
- **The requirement panel (12).** The quiet line under the title also shows the cost element, and
  ▲ not drawn when there is one. On the card build, 📄 Description & note opens the same pop-up (it used
  to open under the row), and the row chip reads ⚠ Impact statement · not written.
- **Mandatory in the spend plans (10).** An increment stays **discretionary dollars**, so the award
  block's *Balance to schedule* is discretionary's, with a *Mandatory — rides these dates* row beside it
  showing where mandatory lands; switching a requirement to increments now seeds discretionary only.
  On the CR views a date outside the fiscal year counts as No date (as the forecast already did), and
  By PMO's TOTAL IN WINDOW now counts only the windows (it was counting every funded dollar). The fit
  chart's table follows the ◨ switch with the chart.
- **The 1A9A movement, measured before shipping** on the populated test board (six services, 36
  requirements, single dates and two-increment schedules, some discretionary left undated): the return's
  in-window total moved from **$7,171,260 to $7,151,178 (−$20,082)**, one requirement more appears (a
  mandatory-only service that now lands in a window), and the 1–15 windows moved Oct +$18,877,
  Nov −$67,928, Dec +$187,500, Jan −$233,531, Feb +$75,000. Across all six services the CR panel's
  No date fell from $13.8M to $10.7M: mandatory that had nowhere to land now has a month.
- **Not drawn (13).** The fix list also says how much of the portfolio shortfall each fix moves (none
  where a figure was typed above the requirement value — that was never payable), and the confirmation
  for set all to drawn states it. The counter reads the funded plan even under ◨. A PMO copy shows the
  list but offers no fix. The filter is also under 🔍 Filter ▾.
- **Import and export (14).** A file older than v1.80 is refused, saying why. An appropriation or a list
  the file does not carry is **kept**, not cleared, and the report says so. *Import a previous board*
  is now **⬅ Import one appropriation…** (the same checks); submittal files load from ✉ Review
  submittals, which is now always in 📁 File ▾. **Two data-loss bugs fixed on the way:** taking one
  appropriation's file replaced the board's execution data for all four with that one's; and an
  appropriation taken back arrived without the cycles locked on it.
- **The guide (9)** is 3,812 words in 22 sections (office part 12, portfolio part 10), about 26 KB of the
  file; all of v1.86 together adds 85 KB to a 3.1 MB board (2.7%). The web guide and the Teams PDF are
  now made from it, so the three always say the same thing. On a phone-width window the header button
  shows 📖 alone so the header does not scroll sideways.
- **Found while testing, fixed before shipping:** the not-drawn fix list ran long requirement names into
  the Service column (it now sizes its columns to what they hold); and the new RECORD-panel buttons' edges
  were too faint to meet the contrast standard in every theme (they now use the board's control edge).
- **The testing got faster on the way.** The final check before a version (every planted mistake
  must be caught, on both builds) had grown to ~10 hours. The test harness now loads a board ~5x
  faster, with the board it sees proven identical either way, and remembers which test caught each
  planted mistake. The v1.86 check took 5.9 hours, and later ones should be shorter. No change to
  what is checked or to the board.
- **A check fixed, not the board:** since v1.85, `npm run check` flagged the board for "an external script
  or stylesheet is linked" when none is: its pattern ran 9,000 characters across the board's own code.
  It now reads one tag at a time, and still catches a real one.

#### 9. The help guide inside the tool, in every board and every PMO copy
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

#### 10. Mandatory back in every consolidated spend plan: forecasts, charts, exports
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

#### 11. Destinations: one list for every appropriation, in alphabetical order
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

#### 12. The requirement panel: its editors at the top, without clutter
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

#### 13. Find, in the main view, where a typed allocation is more than it draws — and fix it
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

#### 14. Importing and exporting boards: a full import for new versions, one appropriation in or out, and the PMO copy under File
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

