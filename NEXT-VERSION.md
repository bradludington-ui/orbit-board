# Next version — queued changes

Changes are logged here as they come up and built together as ONE version when Brad says **go**.
Nothing on this list touches the board until then. On go: build every open item, run the full
math gate once, bump the version once, push once, and move the items to *Shipped* with the version.

Current version: **v1.92**. Next: **v1.93**.

## Open

#### 38. The IDS batch: four questions waiting on Brad (from item 37)
- **Logged:** 30 Sep 2026, when item 37 shipped in v1.92. Nothing is built for these until Brad answers;
  the file keeps today's behaviour meanwhile.
  - **ORG:** the real ORG number, and whether it is one for every JSF budget or changes by appropriation,
    service or office (if it changes, one file per ORG). Today: typed once per appropriation, 1 by default.
  - **Unfunded requirements and the budget ceiling:** whether a requirement with nothing allocated is sent
    with Approved 0 (it is), and whether the Budget Extract carries each budget's approved amount, so the
    template's rule 12 (total Approved within the budget's available) can be checked before the file goes.
  - **The other tabs:** whether the file should also carry the template's Instructions and Action-list tabs
    (never the Example tab), and whether CCaR's import accepts the extra *Not exported* sheet.
  - **For the CCaR administrators:** the template's Action list says Update adds a line CCaR does not have;
    its rule 10 says Update needs the line to exist. If the second, *Forget* in the IDS box is the way back
    for a batch exported and never uploaded.

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

### v1.92 — 30 Sep 2026: items 18, 36 and 37, built on Brad's "go"

**The IDS Batch Import carries every dollar the board funds.** Each requirement gets a line per service per
lane, the same lines as the RECORD panel's BAE budget section and on the same budgets: the discretionary
money on the discretionary budget, the mandatory draw on the mandatory budget, and a requirement with no
money yet on the budget its *not funded yet* line names, with nothing approved. Each line says **Add** or
**Update**: the board keeps a record of every batch it exported, and a line it has sent before goes as an
Update. The file ID fills itself in — the date and the next number not yet issued on this board — and a
number once used is never offered again.

**The keyboard reaches everything the mouse can.** Every menu item (File, Reports & exports, Data, Setup,
Filter, FY, PMO, the Fund tools and a row's ⋯) is reached with Tab and run with Enter; Esc closes the menu
and leaves you on its button. The Funding detail headers, the service and lane chips and every other
clickable spot work from the keyboard and say whether they are on or open. Pressing one no longer throws
the keyboard back to the top of the page, and **typing a figure in a row and pressing Tab now moves on to
the next field** (it went to the top of the page before, in v1.91 too).

**📁 File › 🩺 Save diagnostics…** makes a small text file for support instead of sending the board: the
version, what kind of file it is, the browser, counts, and the last 50 warnings and script errors, with
**no dollar figure, title, name, CCaR record, PID or budget name** in it. The box shows exactly what will be
saved; nothing is sent anywhere.

What shipped differs from what was logged in these places, all stated here:
- **The RECORD panel's *not funded yet* line names the budget the IDS batch will use (37).** It showed an
  empty picker when nothing was chosen; it now shows the rule's budget ("no money yet · automatic by rule",
  first choice "— the rule: *name* —"), so the panel and the file always name the same budget. A chosen
  budget that is no longer in the BAE list holds the line back, in the panel and in the file.
- **Most of the clickable chips are keyboard controls, not new `<button>` elements (36)**, so none of them
  moved or changed look; `npm run check` holds every one to it. Menu items and the Funding detail headers
  are real buttons, as logged.
- **The boxes are checked by the panels check, not the accessibility run (36).** The accessibility run opens
  every menu and every Funding detail panel; `npm run panels`, which already opens every box, now fails on
  any control inside one that the keyboard cannot reach.
- **Two keyboard faults the new checks found, fixed though not logged (36):** pressing a chip, Funding
  detail, a row's ⋯ or a menu item that redraws the board lost the keyboard's place; and a figure typed in a
  row and left with Tab lost it too. Both now keep it. After a mouse click nothing is moved, so typing can
  never land in a field just left.
- **Three contrast faults the fuller measurement found, fixed (36):** the pickers' and menus' borders, and a
  selected row's input boxes in Fund.
- **A warning is a message with a warning sign or that says something could not be done (18).** The board
  has about 270 messages; the ordinary ones ("Saved", "Exported") are not kept.
- **The file also drops any word the board's own program never uses (18)**, which takes out a file name or
  the name of somebody who saved a copy elsewhere, on top of the logged cleaning. It also says what is on
  screen, where Save writes, whether Live view is on, and counts journal entries and IDS batches.
- **📁 File has a fifth group, *Support* (18).** Esc in the box is Cancel. The status line of the "RECORD
  panel could not be drawn" message points to Save diagnostics too, not only the panel.

**The final check** passed on 30 Sep (6:10–7:20 pm Eastern): **70 minutes**, every stage clean, all 593
planted mistakes caught, 28 of them new in this version (11 more in the list change nothing by design, as
before). **Its first run did not pass** (4:14–5:31 pm): one planted mistake got through — two copies in the
shared folder's history saved in the same second sharing a name. The board handles that correctly; the
test that should have caught the mistake only looked when the two copies really did land in the same
second, and on a busy machine they did not. The test now holds the clock still, so it catches it every
time. (A second run was cut short when the session's machine restarted.)

#### 37. The IDS Batch Import carries both lanes, and knows what it has sent before
- **Logged:** 30 Sep 2026, from Brad's IDS Batch Import Req template, walked through column by column.
  **Approved by Brad, 30 Sep: Claude's recommendations on both lanes, Add/Update from a record of what
  was sent, and automatic file IDs.** Three questions are still open (below).
- **Found (v1.91):** Reports & exports › 📤 IDS Batch Import already writes the template's own sheet —
  the A1 file ID, the eight headings, the column widths, the freeze — and a *Not exported* sheet naming
  every line held back and why. What it puts in the columns falls short:
  - **Only discretionary money goes.** Every line is filed under the service's discretionary budget, and
    Req. Approved is the discretionary draw alone. On a test board $230 was allocated and the file carried
    $150: the $80 drawn from mandatory was in no line, and no mandatory budget was named.
  - **A service funded only from mandatory is held back** with "pick one under BAE budget in the RECORD
    panel", but the panel draws no discretionary line for that service, so there is nothing to pick.
  - **Every line is "Add"**, one action for the file. IDS skips an Add whose control number is already on
    that budget and year, so a changed amount sent again changes nothing, and says nothing.
  - **The file ID's sequence is typed by hand**, and a second export on the same day repeats the first
    one's ID unless someone remembers to raise it; IDS refuses an ID it has seen.
  - **Its figures are checked by nothing.** `tools/money-coverage.mjs` excuses it as having "no dollar
    columns"; it has two.
- **What will be built:**
  - **A line per service per lane, as the Spend Plan Source does, and every line is one the RECORD panel's
    BAE budget section shows,** on the budget that section names:
    - a service drawing discretionary: a **discretionary** line — Approved is the discretionary draw, and
      Amount carries the rest of the requirement, the unfunded part included; and, if it also draws
      mandatory, a **mandatory** line whose Amount and Approved are both the mandatory draw;
    - a service drawing only mandatory: one **mandatory** line, whose Amount carries the whole requirement;
    - a service with no money: one line, Approved 0, on the budget its *not funded yet* line names.
    For every requirement and service, the Amounts add up to the requirement exactly, and no Amount is
    below its Approved. Lines that land on the same budget and control number are still added into one
    (IDS allows a control number once per budget and year).
  - **A record of every batch exported**, kept in the saved board: the file ID, the date, who, and each
    line (year, budget, control number, amounts). A line is **Add** the first time it goes and **Update**
    after that, with the template's own comments — *New Requirement* / *Updated requirement*. The one
    Action picker goes. A line sent before and missing now (a requirement removed, a budget changed) is
    listed on the *Not exported* sheet as sent before and not in this batch — **Delete stays by hand in
    CCaR.** A batch that was exported but never uploaded can be forgotten from the IDS panel, and its lines
    go back to Add.
  - **The file ID moves on by itself:** the next unused sequence for the day, from every ID this board has
    issued; still editable, and an ID it has already issued is refused.
  - The IDS panel says *Approved* (both lanes), and its hint names the RECORD panel's BAE budget as well as
    Classify requirements.
- **What does not change:** the sheet's layout and headings, the ORG and Budget FY columns, the control
  number lookup (from the CCaR records file, never guessed), the *Not exported* sheet, pre-flight's use of
  the same reasoning, and every other export. PMO copies do not carry the record of batches.
- **Checks:** a test board with discretionary-only, mandatory-only, both-lane, partly unfunded and unfunded
  services, two requirements sharing a control number, and a lane-less budget serving both lanes: every
  line's budget is the one the RECORD panel names; each requirement's Amounts add to its requirement; each
  Approved is its lane's draw; the file's Approved plus what was held back equals what the board funds;
  Ref No runs 1..N with one ORG and one year. The batch record: a first export is all Add, the same lines
  again are Update, a new requirement is Add, a vanished line is listed, a forgotten batch returns its
  lines to Add, and the record survives save, reopen and a full import. Two exports on one day get -0001
  and -0002. `money-coverage` counts the IDS file as a money export, and mutations on each rule are caught.
- **Still open (the build keeps today's behaviour for these until Brad answers):**
  - **ORG:** the real ORG number, and whether it is one for every JSF budget or changes by appropriation,
    service or office (if it changes, one file per ORG).
  - **Unfunded requirements and the budget ceiling:** whether a requirement with nothing allocated is sent
    with Approved 0 (today it is); and whether the Budget Extract carries each budget's approved amount, so
    rule 12 (total Approved within the budget's available) can be checked before the file is written.
  - **The other tabs:** whether the file should also carry the template's Instructions and Action-list tabs
    (never the Example tab), and whether CCaR's import accepts the extra *Not exported* sheet or it should
    be a separate file.
  - **For the CCaR admins:** the template contradicts itself on Update — its Action list says Update adds a
    line CCaR does not have, rule 10 says Update needs the line to exist. If Update adds, a batch exported
    but never uploaded does no harm; if not, *forget this batch* is the way back.

#### 36. The keyboard reaches every menu item and the last mouse-only controls
- **Logged:** 30 Sep 2026, at Brad's request: the keyboard debt v1.91 recorded, and what checking it found.
- **Found (v1.91, checked in the browser):**
  - **Menu items are mouse-only.** Enter opens 📁 File, but Tab skips its 13 items and goes on to the mode
    buttons; the same for Reports & exports (25 items), Data (8), Setup (19) and a row's ⋯ menu. So every
    export, import and setup action needs a mouse. v1.91's keyboard check did not see it: it measures with
    the menus closed.
  - **The 12 findings v1.91 recorded as debt** (70 places): the four panel headers under Funding detail
    (Budget authority & posture, Funding by service, Unspent discretionary, PMO funding), which open and
    close their panels, and the discretionary-fit chips that filter the list (by service, by lane, ▲ not
    drawn, 🔧 fix list).
  - **A scan of the board's markup** finds 49 clickable spots that are not controls, besides the 41
    backdrops that close a box (each box also has its own ✕ Close button). The ones not above sit in panels
    and boxes the check never opens.
- **What will be built:**
  - **Menu items become real buttons.** Tab and Shift+Tab move through an open menu, Enter or Space runs
    an item, and Esc closes the menu with focus back on its button. The same for a row's ⋯ menu. No ARIA
    menu roles, so nothing promises arrow keys it does not have (the same choice as the mode buttons).
  - The four Funding detail headers become buttons that say whether their panel is open, and the fit chips
    buttons that say whether their filter is on.
  - Every other clickable spot the scan finds becomes a button or a link, backdrops excepted.
- **What does not change:** what any item does, the menus' contents and order, and every figure.
- **Checks:** `npm run standards` opens every menu, every Funding detail panel and every box before it
  measures, and its baseline goes back to **0**; `npm run check` fails on any new clickable element in the
  board's markup that the keyboard cannot reach, backdrops excepted; the keyboard check adds Tab through
  every item of every menu, Enter to run one and Esc to close, and the Funding detail headers and fit chips
  with Enter. Each new check fails on the v1.91 board first.

#### 18. A diagnostics file for support — build before the road show
- **Logged:** 29 Sep 2026, from the maintainability review Brad shared; Claude's recommendation. Deferred
  from v1.88; **moved to Open for v1.92 on 30 Sep 2026, at Brad's request.**
- **Found (v1.91):** when something goes wrong on someone's machine there is no way to learn what without
  their board. The one message that asks for a report ("the RECORD panel could not be drawn … Save a copy
  and report it") asks for *Save a copy*, which carries every dollar and title on the board. The board
  keeps no record of what went wrong: its warning messages (about 80 of them) each replace the one before, an unexpected
  script error is caught by nothing, and what was lost at start-up is said once and not kept.
- **What will be built:**
  - **📁 File ▾ → 🩺 Save diagnostics…**, on the live board and in a PMO copy. It opens a box showing
    exactly the text that will be saved; *Save* writes it as a small plain-text file (*ORBIT diagnostics -
    2026-10-01.txt*) and *Cancel* writes nothing. Nothing is sent anywhere: the person sends the file.
  - **What it holds:** the board version; whether it is the live board, a PMO copy (with its publish date
    and office) or a one-appropriation file; the browser and window size; how the file was opened (from
    disk, a shared folder, Live view); browser storage in use, and any write the browser refused this
    session; **counts only** — requirements per appropriation and fiscal year, locked cycles, snapshots,
    submittals held, BAE rows, CCaR records, months of execution data; and the last 50 warnings and script
    errors this session, each with its time.
  - **The board starts keeping that short list when it opens:** every warning it shows, anything lost at
    start-up, and any unexpected script error. It lives in memory only, never in the saved file or in
    browser storage.
  - **Never a dollar figure, a requirement title, a person's name, a CCaR record, a PID or a budget name.**
    Each warning is kept with its figures replaced by # and every title, name and quoted value taken out.
    The office code (AV, PSM) is kept, because it says whose copy it is (Claude's recommendation; say if it
    should go too).
  - The "RECORD panel could not be drawn" message points to *Save diagnostics* instead of *Save a copy*.
- **What does not change:** anything the board saves, exports or calculates; the board still uses no
  network at all; messages and confirm prompts stay as they are (item 19 stays in Later).
- **Checks:** a board filled with recognisable values (figures, titles, names, CCaR records, PIDs, budget
  names) is driven through the warnings that name them and a planted script error, and none of those values
  appears in the file, while the version and the counts do; the file is exactly what the box showed;
  *Cancel* writes nothing; it works in a PMO copy and on a board whose RECORD panel failed to draw;
  mutations that let a figure or a title through are caught.

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

