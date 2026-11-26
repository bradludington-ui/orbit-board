# Next version — queued changes

Changes are logged here as they come up and built together as ONE version when Brad says **go**.
Nothing on this list touches the board until then. On go: build every open item, run the full
math gate once, bump the version once, push once, and move the items to *Shipped* with the version.

Current version: **v2.23** (items 156, 158, 159; merged 26 Nov 2026, PR #85); **v2.24** (items 160–164: Allocate's Present in $K, the mandatory box's wording, Budget Year with no CCaR pull taken in, its screens restyled, dead code removed) is built, to merge when its gate passes; items 165–170 (the outside critique, 26 Nov) are logged; items 100 and 107 are withdrawn (no hosting: ORBIT runs locally); v2.22 (item 155, with 154 and 149.18–149.53) merged 25 Nov 2026 (PR #81); v2.19 (item 150, the scope-down) merged 24 Nov 2026 (PR #78). **v2.20** (item 151, copy one PPBE cycle's controls into another) merged 24 Nov 2026 (PR #79). **v2.21** (items 152 and 153, ORBIT in APEX's look and cleaner code) merged 25 Nov 2026 (PR #80). Then v2.22 (item 155, the new look, with items 154 and 149.18–149.53 folded in), v2.23 (item 156) and v2.24 (item 157): Brad's go of 25 Nov. Item 133 is withdrawn.

## Open

#### Brad's go of 3 Nov 2026: everything open, in three versions
Brad, 3 Nov 2026: *"Let's push all of these. Ask questions to clarify."* His answers:
- **Order: three versions, data loss first.** v2.14: items 140 and 141, item 129's four findings, item 124, and the ledger's U63,
  U64 and U35. v2.15: items 137-139 and the small fixes (item 131's strict folder read and the Spruills and Locks by
  appropriation; item 135's gaps; v2.12's question 1, a CLIN request that is not a list reported on opening; the guide's
  five-year text; the Priority Drill's narrow columns; the five-year workbook's "Allocated" renamed Funded). v2.16: item 133.
  Each version merges on his word.
  **v2.14 shipped** (items 140, 141, 129, 124; ledger U63, U64, U35; see Shipped); v2.15 gained items 142 to 146, found while
  building and reviewing it. **v2.15 shipped** (merged 9 Nov 2026, `e3804cf`). **v2.16 is item 148** (Brad's "Go", 19 Nov 2026:
  the five-year spend plan's wrong names, reported from the real board), so **item 133 is v2.17**, the last of the three.
- **The handoff's 40 decisions** (`recovery/v213/HANDOFF.md`, section 8): *"Accept all recommendations"*, v2.12's eight
  questions among them. What only Brad can do (credentials, the security team, the evidence package) comes back to him as a list.
- **Save on his work computer writes into the file**, so item 141's main path is writing the imported board into a new file.
- **E1's hardening list:** *"Not needed this week."*
- **Item 133:** build now; writing the contract number to the Spend Plan Source waits until CCaR names its column.
- **Item 138:** a consolidated file's locked cycles are taken as today.
- **The older "your call" behaviours stay as built:** a kept PPBE cycle freezes its services; the ACE alignment breakout shows the
  allocation; the RCN-EEIC tab prorates a split prime's ask by the CLIN allocation; FYDP Disconnects' workbook prints — without
  saying why.
- **Items 100 and 107 (Azure):** left until hosting is chosen. *(26 Nov 2026: both withdrawn, Brad: "I have no plans to host on SharePoint or azure. I will run locally and own all data and information.")*

#### Brad's go of 25 Nov 2026: ORBIT, modernized, in three versions (items 155-157)
Brad, 25 Nov 2026, on the concept canvas (https://claude.ai/artifact/72NE2hE19eSaH3rFcjEygq, eight screens, invented figures):
*"I like it all from your previous screenshots and I like the new items. Let's go"*, and his answers:
- **Three versions, each gated and merged on his word:** v2.22 = item 155 (and items 154 and 149.18-149.53 folded in);
  v2.23 = item 156; v2.24 = item 157. *(25 Nov: items 158 and 159 join v2.23, on Brad's "Log it for v2.23". 26 Nov: Brad's "Print
  Present in $K and fix the wording" became v2.24 (items 160, 161), so item 157 is v2.25.)*
- **Item 149.18-149.53 is folded into v2.22**: its findings touch the same rows, record and menus the new look redraws.
- **The requirement page keeps the RECORD card:** a row click still opens the quick record; *Open full page* goes to the page.
- **Rank by band is view only:** it groups requirements by band; a band is still changed only in the RECORD panel.

#### 157. The change bridge (v2.25)
**v2.25's scope (Brad, 26 Nov 2026):** this item's change bridge, with items 168, 171 and 172. The one-page leadership brief is
dropped from v2.25 ("Leadership brief can be removed"; asked, he answered *drop it from v2.25 only*): the Brief view as it is stays.
- ~~**One-page leadership brief** (the Brief view): the bottom line in one sentence, four figures, the money bar, funded against
  requirement by office, the Mission Critical shortfalls; Print / save as PDF and Present full screen.~~ Dropped, 26 Nov.
- **What changed since a locked cycle:** before-and-after tiles, a bridge of why unfunded moved (added, values changed, rank
  moves, removed) whose steps add exactly to the change, and the change list with who and when, from cycCmpData and the
  journal.

#### Brad's word of 26 Nov 2026: the outside critique, logged (items 165-170)
Brad, 26 Nov 2026, asked for a critique of ORBIT from the outside, then: *"Log all of these as items except #5. I have no plans to
host on SharePoint or azure. I will run locally and own all data and information."* So **the local file is the product**: it is
not a pilot waiting for a hosted build. Items 100 and 107 are withdrawn (see Withdrawn), and item 106 is the file's own
hardening, no longer a stopgap. Each item below waits for his go, as every item does.

#### 165. The project notes cut to what is true now (no board change)
- **Why:** `CLAUDE.md` is 470 KB and `NEXT-VERSION.md` 1.1 MB (26 Nov 2026). Every session reads `CLAUDE.md` whole before it
  starts, so the history of why each rule exists now competes with the rules for attention, and every change pays for it.
- **What:** `CLAUDE.md` becomes the current rulebook, about 15 pages: the funding model and its identities, how the file
  saves, the data-loss rules, the checks to run and the house style, each rule stated once as it is now. The version sections
  move to `HISTORY.md`, which nothing loads automatically, and each rule in the rulebook names the history section that
  explains it. `NEXT-VERSION.md` keeps Open, Later and Withdrawn; Shipped moves to `SHIPPED.md`.
- **Also:** every rule that rests on the Azure build is restated for a local-only tool (see Withdrawn, items 100 and 107).
- **Proof:** no rule is lost: a list of every rule in today's `CLAUDE.md`, each marked kept (where), merged (into which) or
  history only (why), given to Brad with the change. Nothing in the board or the tools changes; no tool reads these files.

#### 166. A release check sized to the change (tooling only)
- **Why:** every version runs the same check, about an hour of suites and browser checks before any mutation proof, whether
  it changes a word or the lane engine. Small requests wait half a day for it.
- **What:** three tiers, chosen by what the change touches, and the tier named in the commit and the notes:
  1. **Wording or look:** `npm run check`, the blocks nearest the change, and the browser checks.
  2. **A screen's behaviour:** tier 1, plus every suite that covers that screen, run whole.
  3. **Money or saving data:** the full gate, as today.
  A tool (`npm run tier`) reads the diff and says the least tier it allows: anything touching `tiers()`, the money helpers, an
  export, `buildSavedHtml`, an import door or storage is tier 3, and a change cannot claim a lower tier than the tool says.
- **Proof:** the tool's classification is checked against the last ten versions' diffs, each of which had a known kind.

#### 167. One mutation sweep, scheduled (tooling only; runs only on Brad's named go)
- **Why:** about 2,500 planted mistakes added since v2.00 have each been proven against their own check, never as a set. Until
  they are swept together, "every check bites" is a claim measured one at a time.
- **What:** one full sweep after v2.24 merges, on a committed tree, in saved batches that survive a container restart
  (`sweep-shards.mjs`), nothing else running; it reports and changes nothing. A survivor is a gap: logged as an item with
  the check it needs. After that, a sweep of just the new mutations before each money or data-loss release (tier 3).
- **Needs:** Brad's named go for the run itself (the rule of 20 Oct 2026 stands).

#### 168. Certify this board, from inside the board
- **Why:** the strongest check of a real board (`npm run verify:file`: it loads, it saves and reopens whole, every lane
  identity holds, every printed total adds up) runs only from a developer's command line. The person briefing a board, or
  leadership asking whether a figure can be trusted, has no way to run it.
- **What:** **Certify this board** under Reports & exports: runs the same checks in the page on the board on screen and writes
  a one-page, dated certificate (a workbook tab and a printable page) naming the file, the build, the appropriations and years
  checked, and each check with its result: the file reopens with every value, every requirement's lanes add to its value per
  service, no lane is drawn past its budget, every export's totals add to their rows and agree with the screen. A failure
  names the requirement and the figure. Nothing is changed by running it.
- **One implementation:** the checks move out of `verify-file.mjs` into the board, and `verify:file` calls the board's, so the
  command line and the button cannot disagree.
- **Fits with item 157** (the leadership brief): the brief can carry the certificate's date and result.

#### 169. Watch it used, and count what is used (the count stays on this computer)
- **Why:** the Help guide is at its 70,000-character limit and many screens carry warnings and questions: signs the tool may be
  harder to learn than it needs to be. Nothing today says which actions anyone uses.
- **What:** (a) Brad watches one programme office fill in and submit a PMO copy, and one leader read the Funding page, for 30
  minutes each, and notes where each hesitates; what he sees becomes items. (b) An optional count of how often each left-menu
  item and each box is opened, kept in this browser only (`spmtUsage`, never in the file, never sent), shown under Setup with
  a Clear button, and reported by Save diagnostics only if he chooses. It counts actions, never figures or names.
- **Use:** after a month of real use, anything opened rarely or never is a candidate to retire, as item 150 did.

#### 170. A second person can run ORBIT (a runbook, no code)
- **Why:** today ORBIT depends on Brad and these sessions. Nobody else could publish the PMO copies, take the submittals, lock a
  cycle or roll the year if he were away.
- **What:** a two-page runbook for a named second person, in plain steps with the menu paths as the board shows them: open and
  save the board, certify it (item 168), publish and take PMO copies, lock and retag a cycle, roll the year, import the BAE
  extract and the CCaR records list, and what to do when Save refuses or a file will not open. It goes inside the Help guide
  (or beside it, if the guide's size limit is the obstacle), and `npm run menus` checks every path it names.
- **Proof:** the second person does each step once from the runbook alone, with Brad watching.

#### 171. Help stops promising a hosted version (found logging items 165-170)
- **Why:** the guide's PPBE cycles section says *"The Azure version will enforce the role."* With no hosted build (items 100
  and 107 withdrawn) that is no longer true, and a reader would wait for something that is not coming.
- **What:** the sentence says what is true: who can lock is not checked by the file; the guard is who can write to the
  board's folder. Two code comments that name the Azure build (the Content-Security-Policy's, and the removed transports')
  say the same. Wording only; any small version can carry it.

#### 172. The Spend Plan Source's active year is decided by the base year alone (Brad, 26 Nov 2026: "Budget Year/Base Year is the source for the spend plan source file")
- **Why:** `srcActiveFy` (it sets the Spend Plan Source's allocation-text column) counts a year as active when it is before the
  base (budget) year *or* a carried CCaR pull holds data for it. ORBIT takes no pull in since v2.24, so the second test reads a
  store nothing can update, and a board carrying an old pull answers differently from one that carries none.
- **What:** the year alone: a year before the base year is active (*Forecast allocated to a Plan Event*); the base year and the
  FYDP years are *Not Allocated*. The carried pull is still carried, byte for byte; it decides nothing. Its comment says so.
- **Check:** the same board with and without a carried pull holding the base year prints the same column; the mutation puts
  the pull's test back.

#### 149. The Requirements page and the RECORD panel: the review of 21 Nov 2026 (Brad, 21 Nov 2026: "Go with recommendations")
- **149.18–149.53 were built in v2.22** (folded into item 155 on Brad's go of 25 Nov); see Shipped › v2.22.
- **Asked:** Brad, 21 Nov 2026: *"review the front landing page where my requirements are listed to include the pop up window after clicking a requirement ... for redundant clicks and information ... simplicity but usefulness."*
- **How it was found:** six reviewers measured v2.16 in Chromium on a synthetic 36-requirement board (1920, ~1500, 1366 wide); twelve checkers re-measured every claim with a real pointer and keyboard (55 confirmed, 6 in part, 1 refuted: the folded menu already marks unsaved work); a completeness critic added seven. The report Brad read: https://claude.ai/artifact/6ZTkCPLox7EPAk5pCtXrnr . Scratch evidence (not in the repo): the session scratchpad `review/`.
- **Answer:** *"Go with recommendations."* Order, as recommended: **v2.17 = 149.1–149.6** (they can put a wrong value in the board; data loss first, the 3 Nov rule), **v2.18 = 149.7–149.17** (labels that print the wrong thing), **v2.19 = 149.18–149.53** (clicks, repeats, additions). *(24 Nov: these move to v2.20; item 150, the scope-down, is v2.19, and may make some of them moot.)* **Item 133 moves to v2.20.** Each version merges on Brad's word.
- **Nothing here changes how a figure is worked out.** 149.7 and 149.8 change which existing figure a label prints, to the one the stated rules name.

- **v2.17 as built, from the checkers' notes (`review/verify/all.json`, D1, D2, R1, critic-2, critic-4, critic-5):**
  - 149.1: the three `type="date"` boxes in `awardBlockHtml` store only when left or on Enter, never per keystroke, and nothing
    redraws under a date box holding the keyboard (D1, extra-1, extra-4: arrows on the day part, and the change fired inside a
    redraw). A change with no keystroke (a calendar pick) is taken at once; a box left empty or half typed keeps the stored date;
    a date outside the fiscal year is refused, naming it. An award already dated outside its fiscal year is listed under Needs
    attention (📅 awards dated outside the year), and the Spend Plan Source sends it on 31 August, never 1902 (extra-2); the
    export itself does not name it. "+ add date" takes Enter and refuses a date outside the year.
  - 149.2: on close the keyboard goes to the selected row (it can take focus) and the closed drawer is `inert`; Esc puts a
    half-typed figure back (Brad's answer). Tab no longer walks out of the open sliding record into the page behind (critic-7).
  - 149.3: Restore all asks first, naming the count and the year, and Cancel restores nothing; the linked-requirements question
    follows as today. A Removed-list line in the change journal is no longer offered to Put back (it is filed by place, and
    putting one back could bring back a different requirement; R1 extra-1). Filing the list by requirement was the larger fix and
    was not needed to close the fault.
  - 149.4: a year not started asks in the board's own box: copy, start empty, or stay; stay and Esc create nothing.
  - 149.5: Reset to the full requirement is on the row menu only on the Funding page and only where it changes something, and says
    what it did.
  - 149.6: Reset priority order names the year on screen, says it replaces the master order for every office and cannot be put back,
    is refused (with a message) while one office is showing, and confirms on the message line; the two messages that promised it
    undoes a published order are corrected.

- **v2.18 as built (149.7–149.17):** see Shipped › v2.18. 149.11 fixes the stale office only; the line's new job is 149.36 (v2.19).

*Can put a wrong value in the board:*
- **149.1 A date typed into the Award date box is stored wrong** (v2.17). Typing a date with the keyboard stores a date at every keystroke. 01/15/2027 was stored as 15 January of the year 2. Retyping only the month of 9 April 2027 left 9 January 2027, which moved $3.09M into January and into the CR window on the test board, with no message. It has been this way since the first version. The calendar picker and the “+ add date” box store the right date. *Brad's board:* Until this is fixed, use the calendar icon or “+ add date”, and check any row whose award year reads 2. It was measured in the same browser engine Edge uses, not on Edge itself. **Change:** Take the date only when you leave the box or press Enter. List any award dated outside the fiscal year under Needs attention, so one already stored is found. Today such a date goes out on the Spend Plan Source as a 1902 date.
- **149.2 After Esc, the keyboard is still inside the closed record** (v2.17). Esc slides the record away, but the keyboard stays in the box you were in, off screen. The next key can change that requirement with nothing to show it: one arrow key changed a decision band, and a digit followed by Tab changed a value from $2,306,185 to $5. A figure half typed before Esc is applied on your next click. The Close button and a click on the dimmed list are safe. **Change:** When the record closes, the keyboard leaves it, and a closed record cannot be typed into. **Answer (recommendation taken):** put the old figure back on Esc.
- **149.3 “Restore all” puts every removed requirement back in one click** (v2.17). No question is asked. Where a question does appear (some are already linked into the year), Cancel still restores all the others. Taking them out again is one at a time, with a question each. *Brad's board:* Your FY28 board shows “Removed 155” beside three requirements. One stray click would put about 155 back among them. **Change:** Ask first, with the count and the year, and let Cancel leave everything as it was. Fix alongside it: Put back in the change journal on a “removed requirements” line can bring back a different requirement.
- **149.4 Choosing a fiscal year that is not started: Cancel starts it empty** (v2.17). Clicking a year marked “not started” asks one question: OK copies the current year into it, Cancel starts it blank. No answer backs out. Cancel or Esc created the year empty and marked the board unsaved, and the program has no way to take a started year back. A year started this way prints $0 in the five-year plan where a year not started prints a dash, and the next lock would freeze it as an empty plan. *Brad's board:* Your FY28 looks like a year started blank (“Removed 155” beside three added rows). If that was your choice, nothing is wrong with it. **Change:** Add a third answer: stay where I am.
- **149.5 “Reset to the full requirement” on a row’s menu changes money without asking** (v2.17). In Review, one click raised a trimmed allocation to the full requirement with no question and no message. On the test board the Mission Critical shortfall moved by $1.19M. It can be put back from the change journal. *Brad's board:* On your three rows it does nothing except mark the board unsaved. **Change:** Show it only on a row it can change, and say what it did. **Answer (recommendation taken):** keep it on the Funding page only; on the row menu elsewhere it goes.
- **149.6 “Reset priority order” re-sorts the whole board and cannot be put back** (v2.17). With one office showing, the bar says the master list is untouched, and the button beside it re-sorts the master order for every office. No message follows, and rank moves are not in the change journal. Its question says FY27 on any year. Two other messages promise that this button undoes a published proposed order; it does not. *Brad's board:* Added requirements are not sorted by size at all, and every FY28 requirement of yours is an added one. **Change:** Say what it does and that it cannot be undone, read the year from the board, hide it while one office is showing, and correct the two messages.

*Shows the wrong thing:*
- **149.7 A starred row’s “MC short” is not your Mission Critical figure** (v2.18). The row prints the requirement less discretionary less mandatory. Your rule, the record and the banner in the list all use the requirement less discretionary only. On the test board three of seven starred rows disagree with their own record (row $1,348,062, record $1,438,062), and the rows no longer add up to the banner above them. *Brad's board:* They agree on your board today only because mandatory is $0. **Change:** The row prints the same figure as the record.
- **149.8 The unfunded count and the unfunded filter miss requirements that were never allocated** (v2.18). The Total UFR tile’s dollars cover every requirement that is short (29 on the test board). The count under it, and Filter › Any unfunded portion, count only dollars that were allocated and then could not be paid (21). *Brad's board:* On your FY28 board this reads about $2.56B over “0 requirements short”, and the filter lists nothing. **Answer (recommendation taken):** the count and the filter follow the dollars (ask less discretionary less mandatory).
- **149.9 Hovering a row’s lane says “Unfunded $0” on rows that are short** (v2.18). The hover counts only allocated dollars that no lane could pay. On 12 of 36 test rows it differs from the Unfunded figure in that requirement’s own record. *Brad's board:* Your first row would hover “Unfunded $0” while flagged short $2.56B. **Change:** The hover prints the record’s Unfunded figure.
- **149.10 “Go to FY27” opens a different requirement** (v2.18). The button changes the year but leaves the record open on that year’s first requirement, or on an unrelated added requirement that happens to carry the same number. The requirement the line names is not selected or scrolled to, and nothing leads back. *Brad's board:* All three of your records carry this line (“Continues FY27 PSM-39 … Go to FY27”). **Change:** Open the requirement it names, and give one click back to where you came from.
- **149.11 The grey line beside “Requirements” names the office you chose before** (v2.18). After choosing PSM it still says All offices. After going back it says PSM above the whole list. Year, appropriation and cycle in that line are right. **Change:** Fix it together with item 36, which gives the line a real job.
- **149.12 The record’s “Allocated” box shows what was funded** (v2.18). It adds discretionary and mandatory actually paid. The two differ whenever a lane runs out: on the test board it reads $2,591,300 for a requirement allocated $3,013,156. The five-year workbook was renamed to Funded in v2.15 for the same reason. **Change:** Rename it Funded. No number changes.
- **149.13 “Cumulative” is not the running total of the column beside it** (v2.18). It is the running total of what has been allocated, not of the requirement column. Nothing on the page says so, and its last value appears nowhere else. *Brad's board:* On your board it would end at $3,818,284 beside $2.56B of requirements. **Change:** Name it for what it is and add a one-line hover.
- **149.14 In the edit box, “next” walks into requirements that are not on your list** (v2.18). With the list narrowed to one office or by a search, “next” opens requirements outside it. After Save, the record behind the box is a different requirement from the one just saved. **Change:** The box follows the list as it is shown, and the record behind follows the box.
- **149.15 The budget block says “every line follows the rule” when some lines have no budget** (v2.18). On 28 of 36 test records that sentence sits under lines marked “not set”, whose export line goes out with a blank budget. **Change:** Say how many lines have no budget, or say nothing.
- **149.16 History cannot show the last change on any of your records** (v2.18). The record’s History leaves out requirements that were added on the board, although the change journal has their lines. That is a leftover from before v2.14. Where a last change is shown, it prints internal names such as “recNames”. The journal’s own search box types letters in reverse, and a line about one year’s added requirement can appear under another year’s requirement that has the same number. *Brad's board:* Every requirement on your FY28 board was added there, so this is all of them. **Change:** Show the last change for added requirements in plain field names, open the journal already narrowed to this requirement, and fix the search box and the naming.
- **149.17 Help describes the page as it was before v2.00** (v2.18). It says the record sits beside the list and slides over only on laptops, that search and Filter stay at the top as you scroll, and it never mentions View › Record panel. Three messages also send you to Needs attention “at the top” of a page that does not show it. **Change:** Reword. Help is at its size limit, so the rewrite has to come out shorter than what it replaces.

*Extra clicks:*
- **149.18 With a record open, everything else takes two clicks** (v2.19). The record slides over the list and the rest of the page is dimmed. The first click on another requirement, on Filter, Save or the left menu only closes the record. The record also covers that row’s money, band, star and menu, and the Total UFR tile. J and K move between records, but the J and K drawn in the header are not buttons. *Brad's board:* This is the state in your photo: three tiles showing, the fourth under the record. **Change:** A click on another requirement moves the record to it. J and K become real previous and next buttons. **Answer (recommendation taken):** keep the record sliding by default; a click on another row moves it there; J and K become real previous / next buttons.
- **149.19 Scroll the record and its Close button stops working** (v2.19). The Overview / Funding / History strip slides over the Close button, and the requirement’s name leaves the screen. A record opened after another one opens part-way down, wherever the last was scrolled. Stepping with J or K lands the table in a different place each time. The header also says RECORD twice and gives the position twice. **Change:** One pinned bar with the position, previous, next and Close, and the name on one line under it. A record opened by a click starts at the top.
- **149.20 Mission Critical cannot be set for the record you are reading** (v2.19). The star is only on the row, which the open record covers: Close, star, reopen. The edit box says the star is set in the record panel, which is not so. **Change:** Correct that sentence. **Answer (recommendation taken):** a star switch in the record (amends the v1.91 row rule: the row and the record both set ★).
- **149.21 Completing records one after another** (v2.19). Each record costs: open the box, fill it, Save, J, open the box again. The box’s button to the value and budgets asks you to throw away what you typed. The Requirement edit button says “6 of 9 still needed” but not which six. *Brad's board:* Your three records read “all 11 set”, so you will meet this on rolled-forward and older records. **Change:** Add “Save and next”. Make the button “Save and go to the value and budgets”. List what is still needed by name under the three buttons, each name opening the box at that field.
- **149.22 Adding several requirements in a row** (v2.19). After Add the box closes. With All offices showing it asks for the office again each time, so every requirement after the first costs three clicks before any typing. The new row lands at the bottom, off screen, and at laptop width the confirmation message has no room to show. *Brad's board:* Works today: choose the office in the PMO menu at the top first, and the box stops asking. **Change:** An “Add and start another” button that keeps the office and clears the form. Scroll to the new row after Add.
- **149.23 Typing a column of values in the record** (v2.19). Tab runs across (Requirement, Disc, Mand), so six values down one column is 15 Tab presses. **Change:** The Down arrow moves to the same column on the next service. Tab and Enter stay as they are.
- **149.24 A budget must be picked by hand even when there is only one to pick** (v2.19). In the Add box each service starts on “choose” even when the office has exactly one budget for it, and Add refuses until each is picked. On records already on the board, the record says “automatic by rule” while the required list says “Budget still needed” for the same lines. **Answer (recommendation taken):** (b) pre-pick the only name in the Add box, still changeable, and (c) the record stops saying "automatic" for a line nobody picked ("by rule — not picked"). The required list is unchanged.
- **149.25 Search** (v2.19). There is no clear button, Esc does not clear it, and once you scroll nothing shows that a search is on. It cannot find a word you can read on the row’s second line (EDI found 0 of 18 rows), a note, or a requirement’s number. A search that matches nothing can leave only the three banners, with no “No requirements match”. **Change:** Add a clear button, let Esc clear, and let search read the record name, the note and the number.
- **149.26 Filter** (v2.19). First use is three clicks because both groups open folded. A stray divider sits at the top of the menu. The folding itself is your 4 October rule for long menus. **Change:** Open the Funding group the first time. Remove the stray line.
- **149.27 When the board refuses a figure, the reason is behind the record** (v2.19). Type “12x” in a value box: the old figure comes back and the reason is on the top line, which is dimmed and partly under the record. After a refusal, a good entry leaves the refusal standing. **Change:** Show the same sentence inside the record, and clear it when a figure is taken.
- **149.28 Smaller snags** (v2.19). In a window about 1,330 px wide or narrower, the Columns tick boxes change and the list does not. With the record docked, the first click on another requirement is lost after typing a figure. Tab walks out of the dimmed record and works controls behind it: it opened another requirement’s menu on top of the open record. PMO › Reassign a requirement… opens the edit box for whichever requirement is marked without naming it. A row with a damaged award date shows the bare word “Award”. **Change:** Grey out the tick boxes and say why; keep the click; keep Tab inside the record; name the requirement in the menu line; say “needs repair” on the row.
- **149.29 The empty program shows three different first steps** (v2.19). A new version opens with a cut-off message, a shared-folder banner and an Add requirement button. The one step you take (Imports & exports, then Import a full board) is the one hidden behind More. Add requirement there can never be finished, and does not say so. **Change:** One “Start here” block: open your saved board, connect the shared folder, or start a new board.
- **149.30 Bringing last year’s requirements into a new year** (v2.19). A blank year offers two ways in. Restoring from the Removed list brings the bare built-in line, without the PID, dates, notes or description the earlier year holds. Add requirement › From another year makes a new linked requirement, one office and one year at a time, with no tick-all, and each must pass the full form. The way that copies everything, Roll requirements forward, sits in the earlier year’s Fiscal year menu: 8 clicks for 36 requirements across four years on the test board. *Brad's board:* Your FY28 shows the mix: 155 in Removed and three added by hand, all reading “No PID”. **Change:** Say on the Removed list what restore does not bring. Add a tick-all to From another year. **Answer (recommendation taken):** Brad, 21 Nov 2026: *"Linked one by one."* A new year leads with Add requirement › From another year (linked, one requirement at a time, as v2.06 designed it); the empty year's first offer opens it. Roll forward stays where it is. The wording fixes and the tick-all go ahead.

*Said twice, or says nothing:*
- **149.31 The six money boxes in the record repeat the TOTAL line under them** (v2.19). Requirement, Discretionary, Mandatory and Unfunded are the same four numbers as the TOTAL line of the By service table on the same screen. On a laptop the boxes push that TOTAL line off the bottom. *Brad's board:* In your photo $58,580 is printed five times, and two boxes hold only a dash. **Change:** One line in their place: Requirement, Funded, Unfunded, and MC shortage only when the requirement is starred and short. About 100 px back.
- **149.32 “Lifecycle pending — the board has no lifecycle field for a requirement yet”** (v2.19). Fixed text on every record. It stands in for a Lifecycle item from your concept images that the board has nothing to fill. **Change:** Remove it. A real status (draft, submitted, approved) would be a feature of its own.
- **149.33 Overview / Funding / History are not tabs** (v2.19). They scroll one long page. Funding lands with the table’s own headings hidden. Overview does nothing once you have scrolled. The highlight does not follow where you are. **Change:** Make the three jumps land correctly. **Answer (recommendation taken):** keep the strip, with the three jumps landing correctly.
- **149.34 The budget block is a quarter to a third of the record** (v2.19). One picker per service line, each saying the rule decided twice, plus a closing sentence. The longest Air Force names are cut off at the end, where the office is. It pushes the award dates off the first screen. **Change:** Say it once per line and print the name whole. **Answer (recommendation taken):** do not fold; say it once per line and print the name whole (follows item 24).
- **149.35 Two Add requirement buttons on one page** (v2.19). One in the top bar and a blue one beside the search row. They open the same box. The blue one scrolls away and sits under an open record. **Change:** Keep the one in the top bar and give it the main-button look.
- **149.36 The grey line beside “Requirements” repeats the four selectors above it** (v2.19). Fiscal year, appropriation, office and cycle are all in the bar directly above. Meanwhile nothing on the page says how many requirements are listed, and the four tiles stay on the whole appropriation when you narrow the list. **Change:** Use the line for what the selectors cannot say: “Showing 8 of 36”. Mark the tiles “whole board” when the list is narrowed.
- **149.37 The row’s second line repeats its name** (v2.19). The CCaR record name is printed whenever it differs from the row’s name by a single character. After a rename the old name is printed too. The small pencil after it looks like the rename button in the record, and is not a button. *Brad's board:* Your first row states its name three times. **Change:** Print the record name only when it adds words. Drop the old name and the pencil.
- **149.38 ADDED and the gear are on every one of your rows** (v2.19). ADDED marks any requirement added on the board, which is every row of an out-year board. It does not tell a requirement continued from last year from a new one. The gear marks funding set by hand, which is also every row. **Change:** Replace ADDED with “continues FY27” or “new”. Drop the gear from the row.
- **149.39 Tile icons and the Editable chip look pressable and do nothing** (v2.19). The round marks on the four tiles have no action (the Total UFR one is the usual menu sign). The Editable chip always says the normal thing and takes room from the message line, which gets 30 px on a laptop. **Answer (recommendation taken):** remove the round marks; show the Editable chip only when the board is not editable.
- **149.40 The edit box speaks in builder’s words** (v2.19). “PSM (from the file)” on a record somebody typed in, “typed before v2.08, kept”, “follows the PMO and prime rules”, and the year stated three times. **Change:** Plain rewrites. No behavior changes.
- **149.41 One thing, several words** (v2.19). The dollars are Ask, Requirement and Req. The shortfall is UFR, Unfunded and short. Money paid is Allocated in one box and Funded everywhere else. **Answer (recommendation taken):** Requirement, Funded and Unfunded on these two screens; "Requirement edit" keeps its name.
- **149.42 A sideways scroll bar at the foot of the record** (v2.19). A one-pixel slip in the Close bar. It takes about 15 px of height on every record. *Brad's board:* It is visible in your photo, under the TOTAL row. **Change:** A one-line fix.
- **149.43 With incremental awards, half the award block is off the edge** (v2.19). Three of six services, the totals and both buttons sit to the right of the record’s edge. The column headed Month holds a full date. An award repaired on opening is shown as code. **Change:** One block per award, stacked, so everything fits. Head the column Date. Write the saved award as a sentence.

*Worth adding:*
- **149.44 Say on each row whether its record is complete** (v2.19). The checklist the record already uses finds something missing on every test record, yet a row flags only “No PID”, which is not on the required list. The count is seen only after opening the record. **Change:** “5 to complete” on the row, a count under the tiles, and a filter for incomplete records, all from the one checklist. Build after item 24 is decided, so the count means the same everywhere.
- **149.45 Show the shortfall on Review rows** (v2.19). On the test board 22 of 29 short rows show no figure, only a lane word and a part-filled bar. The Funding page has it as a column. **Change:** Print “unfunded $X” under the lane word when it is not zero.
- **149.46 Reach Needs attention from the Requirements page** (v2.19). The to-do list (missing impact statements, dates, WBS) shows only on the Funding page. **Answer (recommendation taken):** a Needs attention button on the Requirements task bar (a second way in to the same lists).
- **149.47 Read what a requirement is without opening the editor** (v2.19). The record says “written” or “not written” but shows none of the description or impact statement. Obligation category, WBS and Goes to appear nowhere on the row or the record. **Change:** One line of the three record fields. **Answer (recommendation taken):** one line of the three record fields now; the description and impact statement preview waits (whole text or a "show all" control is still Brad's).
- **149.48 A prime contract’s record should mention its CLINs** (v2.19). The record for a prime contract reads exactly like any other: no CLIN count and no way to the CLIN breakdown. The breakdown’s button is on the row, under the dimmed layer. The breakdown itself needs 1,406 px in a 1,186 px space in a 1,500-wide window, so it scrolls sideways and cuts the CLIN numbers. Adding a CLIN is three browser prompt boxes. *Brad's board:* Your first row, $2.56B of your $2.564B, is a prime contract. **Change:** One line in the record: “Prime contract, 3 CLINs, requested $X. Open the CLIN breakdown.” The breakdown’s width, Tab order and prompts are a bigger job to plan on its own.
- **149.49 In a locked cycle view, the record should say it is read only** (v2.19). The page is well marked, but the record’s 56 boxes and buttons all look live. Type a figure and the old one quietly comes back; the reason shows only on the dimmed top line. **Change:** A read-only sentence at the top of the record, with Leave the view.
- **149.50 The same requirement’s other years, in the record** (v2.19). Checking a requirement’s five yearly values means four year switches. **Change:** One line with its value in each year, each a button to that year. Worth having once FY29 to FY32 are filled in. It needs care to build safely.
- **149.51 A hand pointer over rows** (v2.19). A row opens its record wherever you click, but the pointer stays an arrow. **Change:** Show the hand over rows.
- **149.52 More requirements on screen** (v2.19). 323 px of bars and tiles sit above the first row. Trimming the heading line would also clear the one layout check that has failed since v2.00. *Brad's board:* About 10 rows fit in your window. View › Compact shows about 15 today, with no change to the board. **Change:** Trim the heading line (item 36 does it).
- **149.53 Checks for what this review found** (v2.19). No automatic check reads the four tiles, the row’s MC flag, the lane hover or the record’s Allocated box, and none types a date with the keyboard. That is how the wrong dates and the wrong labels above went unseen. **Change:** Each fix arrives with a check that fails without it.

#### 63. Found while building v1.95, not built
- *(The repaired-award test gap is now item 64.)*
- **Two people sharing different cost estimates under one name at the same instant** can both write: a file share has
  no atomic create. The re-read after the replace question narrows it; it does not close it.
- **A cost estimate kept in the folder's history** is not offered in ↶ Earlier copies; putting one back is a rename in
  the folder. *(Item 96, v1.99: ↶ Cost estimates kept, in the Live view.)*
- **An office's month in a shared requirement** can sit about a dollar from its exact share (the office's total and
  the requirement's months are exact) -- the price of whole dollars that add up both ways.
- **Brad, 6 Oct 2026 (for v2.00):** the shared-name race (above) stays as it is, with the fingerprint protection kept. The
  office-by-month cells stay for a design review: state whether the bound is at most $1, prove the counterexample (office
  weights 2:2:2:3:3 over months of $4 and $6 have no cell rounding with largest-remainder office totals), keep both
  margins exact, and never call approximate cells exact.

#### 71. Found while building v1.96, not built
- **Logged:** 4 Oct 2026, while building v1.96.
- **The conformance run opens one box, the 🔧 list, and no other.** It found that every box's ✕ Close was too faint and
  too small (fixed in v1.96, item 64, for all 49); what else the other 48 boxes hold is measured by nothing.
- **Shared side lists still have a read-merge-write window.** Two people sharing the reprogramming log (or execution, or a
  cost estimate) at the same moment can each write; the folder's permissions are the guarantee (the review's NR03 note).
  The 5 Oct review (R11) restates it: only one writer per shared file, enforced across machines, or a store that
  checks revisions atomically, closes it. Not reproduced with two real machines.
- **The legacy shared state file opened by the Windows launcher** (`spmtSidecar=1`, XHR) answers into the same function the
  HTTPS path does, and is covered by the same checks; it was not run with a real launcher.
- **6 Oct review of v1.98:** restates the shared-writer window as still open; a browser lock or another timestamp read does
  not close it. Still no test with two real machines.
- **Brad, 6 Oct 2026 (for v2.00):** review per-writer files first (each browser writes only its own log, execution and
  estimate file; everyone reads and merges all of them), and pursue SharePoint/Graph writes with eTags (If-Match, refused
  on change) if they are available. Per-writer files reduce contention but do not by themselves guarantee no lost edit: the
  design must cover several tabs and devices, identity collisions, conflicting updates, tombstones, duplicates, and how an
  execution or estimate replacement is decided -- and keep conflicting versions rather than silently choosing a winner.


#### 82. Found while building v1.97, not built
- **Logged:** 5 Oct 2026, from the six workstreams' reports and the integration.
- **⬇ Export funds flow writes the last fiscal year on screen, across every appropriation**, not what the panel shows (the
  panel showed FY25 + FY26 for O&M, 3,000; the export held FY26 for all appropriations, 2,000). Its Scope line says so.
  Changing it changes what the export is for: Brad's call. *(Item 92, v1.99.)*
- **A year with execution imported for any appropriation counts as executed for all of them**: Full Fund FY27 execution
  made O&M's planned FY27 print $0, with no warning. The rule is "execution wins per year"; per appropriation is a design
  change. *(Item 93, v1.99.)*
- **An office with an estimate line but no requirement in a year** is left off that year's ACE "Reconciliation by PMO"
  block and its total (it is still listed under Lines Nothing Claims). *(Item 94, v1.99.)*
- **The ACE alignment breakout carries the allocation, not what the lanes fund.** Its note now says so; whether it should
  carry funded dollars instead is Brad's call.
- **A kept PPBE cycle fixes the services it holds** (item 80's choice): they cannot be moved, renamed or removed while it
  is kept. Re-reading a cycle by name instead would allow it -- Brad's call.
- **Journal entries from before a service-list change** that carry a place or a list can no longer be put back; the
  figure is typed again.
- **The side lists' unsaved state lasts one session**, like `DIRTY`: list edits waiting in browser storage read as saved
  after a reload. Some list changes never reach the counter: an execution import that throws part-way, a log share that
  merges and then fails to write, the destination list's default seed. *(Item 95, v1.99.)*
- **A reprogramming row written by v1.96 carries only a place**, which v1.96's picker took from the board on screen. It
  is read against its own appropriation's list and marked "(by position)" until someone picks.
- **PPBE values copied into the budget base** (`bmSeedFromPp`) are not apportioned; whole dollars when typed, so this
  matters only for a fraction arriving in a file.
- **Items 77–79 were run in jsdom against stand-in folders and file readers**, not with real File System Access in
  Chromium. A history folder that exists but cannot be opened now also stops the log and cost-estimate shares (stricter
  than before). Boards older than v1.97 neither see nor thin the new `…-recent.json` history copies.
- **6 Oct review of v1.98:** restates the side-list, funds-flow and ACE bullets above. On the side lists: a change should
  count before any write that can fail, and survive a reopen. On the funds flow and ACE: it asks for a worked example by
  appropriation and year, and Brad's rule, before those totals are called certified.

#### 84. Found while building v1.98, not built
- **Logged:** 5 Oct 2026, while building v1.98.
- **A version older than v1.98 opening a v1.98 file** does not know a CLIN's service choices: there, that service's
  money on the CLIN reads as the CLIN's standard. Nothing is lost -- the choices stay in the file -- but an older board
  reports it on the standard until it is opened in v1.98 again.
- **A kept PPBE cycle** keeps its CLINs' pointers when a combination is removed from the list (a cycle is a fixed
  point, as before for the requirements' own); in that cycle's view, that money reads as not assigned. *(Item 88, v1.99: a cycle locked from v1.99 keeps its own list; one locked earlier reads today’s and says so.)*
- **The Classify grid's RCN / EEIC column** sets the requirement's own combination, the default a CLIN with none of its
  own uses. A CLIN's choices are made in its CLIN drill. *(Item 97, v1.99: the grid says so; the setter is unchanged.)*
- **On the RCN-EEIC tab, a prime split across combinations** shows each combination's share of its ask prorated by the
  CLIN grid's allocation (the same split as its money), not each CLIN's own request.
- **6 Oct review of v1.98:** an older version's reading of a v1.98 file should be tested editing and saving, not only
  opening. Windows and Edge with real SharePoint or OneDrive and their permissions, and the exports opened in Excel,
  PowerPoint and CCaR, are still unchecked.
- **Brad, 6 Oct 2026 (for v2.00):** the older-version reading stays for a compatibility review -- a partial version marker
  on folder copies cannot certify older readers as safe. The RCN-EEIC tab's ask for a split prime stays for review, because
  showing each CLIN's own request changes what the ask column means.

#### 131. Found while building v2.10, not built
Each was raised by a skeptic re-checking a fix to item 130 and reproduced; none is a regression of v2.10's.
- ~~A service in no group reaches the Summary only, and the workbook does not say so~~ -- **built in v2.11** (Brad, 27 Oct:
  "add the workbook note line"): every sheet says so under its table. Services are still grouped by exact name.
- **Built in v2.15** and taken off this list (see Shipped › v2.15 › Item 131): the open box following another tab's save and
  Export refusing figures that moved; the five-year plan's strict folder read; the Spruills and Locks by appropriation reading the
  folder's copy; the house style's indents.
- **The workbook does not say why an appropriation's lines print —** (not built; Brad chose the note line for the ungrouped
  service alone). When an appropriation's copy could not be read, or it logs no position under the cycle, its lines print —
  in the workbook and only the box says why.

#### 135. Found while building v2.12, not built
Each was found by a builder or a reviewer of v2.12 and left as found. Brad's eight questions on what v2.12 built wait for his
answers under Shipped › v2.12 › *Questions for Brad*.
- **The four gaps were taken up in v2.15** (see Shipped › v2.15 › Item 135's four gaps): WBS from execution data and a prime's
  own paragraph, and a CLIN request of text figures, are fixed; a re-import's fingerprint (`aceClashWhy` says why, the fingerprint
  is not changed) and another appropriation's stored budget (said under the Spruills block, not read live) are decided, and Brad
  can reverse either.
- **Brad's call** (each raised in the second review and refuted as a defect, its skeptic calling it a change for Brad to
  decide): a way to forget a remembered answer in the mapping box (a mistaken "this file has no such column" for US/PTN/FMS is
  remembered for the layout, and only a change to the file's header row reads it again); in one-figure mode, the PPBE box's field
  showing the total, where it shows the discretionary slot and, under it, any mandatory left from an earlier split; an own lane
  split that can be set while the plan is tagged; and a prime's CLIN lines on the Spend Plan Source carrying what each CLIN
  asks (older than v2.12: twelve $25 increments over three $100 CLINs go out $108 / $96 / $96, while each paragraph's total
  across the prime is what was typed), which would change the CLIN amounts of v2.02's E5 (Brad, 13 Oct 2026: label both,
  reconcile them, move no dollar).

#### 146. Found while building and reviewing v2.14, not built
Each was found by a builder, the integration or a review-round-1 fixer, and left as found. None loses a figure the board holds
unless it says so. The paths are where the evidence is.

**Built in v2.15 and taken off this list** (see Shipped › v2.15 › Item 146): the held ladder lost at its board's opening and its
refusal's wording; `impHandMsg` and its siblings throwing on a note's fields; `strayOther` and `_bootStray` as one rule; E2's
own-appropriation line; a by-id journal line in a year whose added ids repeat, and `JRNL_NOT_PLACE`'s title; the tie rule's and
`cycCarrySaved`'s guard mutations; `save-target.mjs` E and the storage seam; both new Save actions on the left menu; the message
line's `.nb.lnk` edge; the latched page that said nothing; `writerKey` / `whoAmI` captured into an import; the `_dlOnly`
question's claim after a cancelled download; the edit box and a stored "no SI code"; Save as a new file claiming the pen;
`_fhPut(null)` on `_fhMem`; the untrue wordings ("(v2.9)", `JRNL_NOT_WHOLE`; `writerMay`'s "before v1.95" and E2's refusal for
room did not reproduce, already fixed in v2.14); the false HOLD ON for an appropriation the file holds no plan for; the file route
and `fhLegacyRelease`; a pubState that is a JSON array; the five test gaps; the dead `_sideGen=g0` line; `driveStorePull`'s
unreachable term; the folder-mode S2 refusal; `impFileBuild`'s writer key; Save diagnostics' two prefixes; `importState`'s
`prio27appn` write; `impFileFailed` on this board's own file; a whole-year roll whose CCaR is set afterwards. A Save stopped
while storage was full is built in part (below).

*Handed to the lead by the review round 1 fixers:*
- **`apStoreOf` does not know the stray rule** (the lead's (d)).
  - What happens: `pkgApply`, `consTakeApply`, `apMineSince` and the boot's destination fold (`_destOthers`) read another
    appropriation's stray blank work when it is newer than the file's copy.
  - RV1-C left `pkgStoreOf`'s import callers on purpose. Reading the file's copy there would replace the blank work in storage
    without the question `pkgMineSince` asks of it today. Changing `_destOthers` would change what opening a board writes.
  - Evidence: `notes-RV1C.md` › Finishing round A, "Left, and why"; `notes-RV1B.md` (`apStoreOf`).
- **The cycle for every appropriation can tag a copy another tab left in front of the import's file** (critic gap 6).
  - What happens: it tags the old board's copy, which `fydpStoreLocal` takes as newer, and stamps it newer than any later file
    save. Full Fund then opens that old plan as unsaved work, tagged.
  - Since RV1-A, Save asks before it writes a left copy into the import's own file (`impLeftAsk`). Not measured again after that.
  - Evidence: `notes-RV1B.md` › "Critic gap 6"; `scratchpad/v214rev/rv1-B/r1a-critic/gap6.mjs`.
- **RV1-A's left-copy question is a design choice for the lead or Brad.**
  - As built: a list changed after the write is left in front of the import's file, and Save asks before it writes it in.
  - The other design: the page reads and saves the file's own copy of a left plan, and that plan's own board takes the left copy
    up.
  - Evidence: `notes-RV1A.md` › Finishing round 2, "Decided".
- **A Save stopped while storage was full can still leave the claim's pen line** where a later `save()` of this page landed
  while the save waited (storage then holds a newer copy with the line, not the one the save wrote). v2.15 W3 puts storage back
  where it still holds exactly that save's own write; another tab reloaded during the wait keeps the line in its own work.
  Evidence: `notes-RV1C.md` › Finishing B, "Left, and why"; `recovery/v215/notes-W3.md` › Known gaps.
- **An ORBIT older than v1.95 wrote its Put back unforced.** Such a line reads as a genuine edit, because D28's recognition needs
  the force mark. No version that old can open a v2.14 board's storage in practice. Evidence: `notes-RV1D.md` › d28, "Not
  covered".
- **The other doors still refuse a list of added requirements an older ORBIT damaged** (v1.95 R09): Import one appropriation,
  Import several boards, the folder's copy and packages. A full import is the route for a whole board. Evidence: `notes-RV1D.md` ›
  the also-noticed damaged board, "Left".
- **A carried plan whose record write is refused for room after Save.** That board's opening keeps the older copy aside, or with no
  room holds the file back with its message and "Open the file anyway". Nothing is lost. Evidence: `notes-RV1B.md` › Finishing
  round, "What I left" (`x5b` at 20 characters free); v2.15 W2's item 143 check 3 holds it.

*From the build (W1–W4 and the integration):*
- **`driveStorePull`'s shell branch reopens whether or not `persist()` landed** (C10, D22, W4). Nothing is lost, because the folder
  keeps its copy. Evidence: `notes-W4.md` › Known gaps.
- **Carried from item 129** (Brad's; handoff decision 12: "Not now"). The office files of one published copy share that copy's plan
  key in a browser. Sealing the plan key per office file would change where every copy's work is kept. Evidence: item 129 as
  logged; `recovery/v209/notes-RV2-save.md`.

*From review round 1's also-noticed lists, not taken up in the fixers' notes.* Each is to be reproduced on the current map before
it is built. Each is in `scratchpad/v214rev/r1a-result.json` or `r1b-result.json`, by area. Most were "read, not reproduced".
- **A shape no version writes:** a plan whose data pack sits only inside a year (oldfiles 4).
- **A held page that reloads after the import's file has opened is no longer held** (C21 lasts one page life), so its next edit can
  shadow the import (fileroute 4).
- **`impShellEmpty` reads browser storage only, not the program file's own lists** (math 2).
- **`boardPubOf` takes this page's plan without a `save()`**, so its data pack is not refreshed; no case was found where it matters
  (math 3).
- **Messages that name no way forward:**
  - the held importing tab follows another tab's cycle on an empty program (journeys 2);
  - a fresh program tab opened after the new file opens writes a partial board into the program in place, by item 141 D's design
    (journeys 3);
  - a PMO copy's first Save still uses the Save window, so picking the board file there empties it (v2.09 behaviour; journeys 6).

#### 147. Found while building and reviewing v2.15, not built
Each was found by a v2.15 builder or review fixer and left as found, or is a check that has no mutation yet. None loses a figure
the board holds. The paths are where the evidence is (`recovery/v215/`).

*The opening and two tabs (W2, RV-A):*
- **R1's same ids in another appropriation.** Item 142 follows the file's list for the appropriation that opens. For the others,
  `pubsFor` still takes another board's newer copy from storage (the plan's rule, and what that board's own opening does). Save
  asks (C24) when that drops requirements; the same ids with other content are written without a question, as in v2.14.
  Evidence: `notes-W2.md` › Known gaps.
- **A file plan refused by `applyStore` while the opening follows it** (services that disagree with its own pack) leaves the
  default board on screen; storage's work is kept aside or left. Nothing lost, nothing mixed. Evidence: `notes-W2.md` › Known gaps.
- **A copy kept aside by v2.14** (the normalised plan) and the same work read raw by `_bootPre` read as different work, so the file
  is held back as `'occupied'`. Nothing lost. Evidence: `notes-W2.md` › Known gaps.
- **Two tabs: only a copy storage refused is protected.** A copy another tab wrote before this page made its own is no clash; a
  plan this page wrote successfully and another tab then overwrote is last-writer-wins, as before; the shared folder's save is not
  asked about. The general overwrite of another tab's copy by an ordinary `save()` predates v2.15 (RV-A, A2's skeptic). Evidence:
  `notes-W2.md` › Known gaps; `notes-RV-A.md` › A2.
- **FYDP Disconnects reads the shared folder once per opening of the box.** `fdcFolderRead` (W2's box) and `apFoldRead` (W4's) are
  two readers of the same strict folder read; the general `storage` listener does not drop `_apFold` (another tab's save does not
  reach the folder). Evidence: `notes-W2.md` › Known gaps; `notes-W4.md` › For the integration.
- **`_impOpen`'s `keepLeft` and `apPut`'s record are direct writes** outside item 144's list (to `<key>.kept` and `<key>.base`).
  Evidence: `notes-W3.md` › For the integration 3, 4.

*The PPBE cycle (W1, RV-B, RV-C):*
- **`consTakeApply`'s result line is lost with the reopen**; its preview carries the sentence. Evidence: `notes-W1.md` › Known gaps.
- **The context bar's fourth step was measured with the plain edit chip.** A PMO copy's or another pen-holder's chip is longer;
  with one, the bar can still wrap at the narrowest widths. Evidence: `notes-W1.md` › Decided 4, Known gaps.
- **No check drives a package's conflict list with a cycle difference** (it now reads the plan as it will be taken). Evidence:
  `notes-W1.md` › Known gaps.
- **A plan marked `baStale` is read so by the Spruills alone.** The PMO drill, the chart of accounts and the live view still read
  the stored figure, which for a marked year is the package's. Evidence: `notes-RV-B.md` › B2, "Decision a person could reverse".
- **No mutation on `holds`' tag term** (`cycAll` already counts a tagged appropriation, so removing it is the identity) **or on
  `cycRetagLbl`'s branch for one moving appropriation that is not the board on screen** (no caller reaches it). Evidence:
  `notes-RV-B.md` › Mutations; `notes-RV-C.md` › Decisions 5.

*Save, the file route and storage (W3):*
- **`SIDE_OPEN_KEY`'s refusal has no check**: the harness cannot refuse it without refusing the opening's other writes.
- **`importState`'s "reopen only when the plan landed" on a populated board** cannot be reached from the harness (`IS_SHELL`).
- **`.nb.lnk`'s edge is checked in Chromium only** (`npm run standards`); no jsdom mutation aims at the CSS.
- **No mutation bites on a refused stopped-import mark's `lose:true`** (a refused import already makes leaving ask) **or on
  `impFileRescued`'s `own` term**.
Evidence for each: `notes-W3.md` › Known gaps.

*The small fixes (W4, RV-D):*
- **The PMO drill never reads another appropriation's board allocation** (Controls print —, since v1.95); with the folder copy it
  still does not.
- **`apFoldRead` runs only in folder mode**, which no harness board reaches but through the new check's stand-in folder; the browser
  checks open the Spruills and PPBE cycles with the folder off.
- **The CLIN request message names a requirement by the year on screen's title**; one the year on screen does not hold is named by
  its id.
Evidence for each: `notes-W4.md` › Known gaps.
- **`clinFig`'s reads in `clinSvcTot` and `clinSplit` have no mutation**: they are backstops behind `clinVec`, which stores numbers,
  so a mutation would be equivalent. A list walked by place because an element has no id is not stamped `rep` (`customMend` repairs
  those on opening). Evidence: `notes-RV-D.md` › Mutations, D2.

## Later

Logged and kept, but not in the next version. Each needs Brad's go again when its time comes.

#### 106. Harden the file while the pilot runs on it (Brad, 21 Oct 2026: "Provide a plan to get us to compliance")
- **Why:** the pilot keeps running the single file on a shared drive until the Azure build (item 107) replaces it, and
  the security requirements apply to it in the meantime. Each change closes or narrows a gap found in the code itself.
- **What:** a Content-Security-Policy in the page, allowing no outside connection; SHA-256 (the browser's own crypto) in
  place of the non-cryptographic package and writer fingerprints -- it catches damage, not deliberate tampering, which
  needs keys only the platform can hold; a change journal in which each entry carries the hash of the one before, so a
  change inside the file shows; **Clear this computer**, one action removing everything ORBIT keeps in the browser
  (storage, the save-file handle, work kept aside), with a written list of what ORBIT leaves on a machine; CUI markings on
  screen, on every export and on the PMO copy, in the wording the security team gives (the export-name and title
  choke points make that one change); and an independent static-analysis scan of the board and the tools, every
  finding fixed or written down, plus `npm audit` for the test tooling.
- **Proof:** each change ships with a check that fails without it, as every version does.
- **Brad, 26 Nov 2026:** no hosted build follows (items 100 and 107 withdrawn), so this is the file's own hardening, not a stopgap. Built since: the Content-Security-Policy and Clear this computer (v2.04), the CUI line (v2.21). Still open: SHA-256 fingerprints, the hash-chained journal, CUI marks on every export, the static-analysis scan.
- **Moved to Later (Brad, 21 Oct 2026):** the desktop file does not have to meet these requirements; they are for the
  Azure web build (item 107). Kept here as optional hardening for the pilot, if ever wanted; it needs Brad's go again.

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

### 100. DoD security standards for the IL5 Azure environment (withdrawn 26 Nov 2026)
*Withdrawn 26 Nov 2026, Brad: "I have no plans to host on SharePoint or azure. I will run locally and own all data and information."* ORBIT stays one local file; no hosted build follows, so the IL5 and Zero Trust requirements below, which applied only to the hosted build, have no system to apply to. What the local file needs is item 106. Kept as logged, for the record:

- The traceability table (NIST SP 800-53 Rev. 5, DISA ASD STIG, DoDI 8500.01, NIST SP 800-88 Rev. 1, CWE, MITRE ATT&CK),
  CUI markings on exports, and the control mapping depend on the security team's answers to the 15 deployment questions.
  Not in the v2.00 code build; it follows once they answer.
- **Brad, 21 Oct 2026 (answers that move this item):** hosting is **Azure, web-based**; the data is **unclassified CUI**; the
  interim pilot restrictions stand for now; and on how strictly to read the requirements, **"err on the side of
  caution"** -- so every control is treated as applying unless the security team rules it out, a partial is recorded
  as a gap, and the hosted design aims at the stricter cloud level the security team names (the handoff says IL5) rather
  than the least that might pass. The plan that follows from these is items 106 and 107; the traceability table itself
  stays outside git (CUI).
- **The security team's request (9 Oct 2026, shown by Brad on 21 Oct):** apply the standards above "to ensure this is
  compatible in the DoD IL5 Azure environment and meets or exceed the DoD Zero Trust requirements". So the level is
  **IL5** (not IL4), and **DoD Zero Trust** is a requirement in its own right. A file that is its own database, opened
  from a shared drive and mailed as a PMO copy, cannot meet Zero Trust: there is no identity on each request, no device
  check, and the data travels whole outside any control. Zero Trust is therefore met by the Azure build (item 107).
- **Brad, 21 Oct 2026:** *"For the desktop platform we currently have we do not need to meet these requirements. These
  requirements are for the eventual web based azure hosted application."* The file keeps running as the pilot under the
  interim restrictions; the standards above, IL5 and Zero Trust apply to item 107 only. Item 106 moved to Later.

### 107. The Azure web build (withdrawn 26 Nov 2026)
*Withdrawn 26 Nov 2026, Brad: "I have no plans to host on SharePoint or azure. I will run locally and own all data and information."* ORBIT stays one local file; no hosted build follows, so the IL5 and Zero Trust requirements below, which applied only to the hosted build, have no system to apply to. What the local file needs is item 106. Kept as logged, for the record:

- **Why:** sign-in, access by role, a central audit log, encryption at rest and in transit, backups and media
  sanitization cannot be built into a file on a shared drive. On Azure they come from the platform -- if the design
  uses them.
- **What (design first, for Brad and the security team to approve before any build):** sign-in through enterprise
  identity (CAC), with roles for viewer, office editor and portfolio team; every change written to the enclave's central
  log; data held server-side, encrypted, backed up; the provider's sanitization for storage. The money engine, the
  exports and every check carry over: the suites, the trace matrix, the money map and the fuzz become the rebuild's
  regression net. "The file is its own database" ends here; the saved-file format stays readable so every board people
  hold today can be brought in.
- **Zero Trust, pillar by pillar (the security team's 9 Oct request):** every request signed in and authorized, never
  trusted for being inside the network (user); only managed, compliant devices (device); the app reachable only through
  the enclave, no public endpoint (network); the data labelled CUI, encrypted under keys the program controls, and every
  export marked and logged (data); every access and change sent to the enclave's monitoring (visibility); and the
  deployment and its checks automated (automation). **The PMO copy changes most:** in place of a whole-portfolio file
  mailed to each office, an office signs in and sees and edits only what its role allows, and its submittal is a change
  held for review on the server.
- **Depends on:** the controls the IL5 environment provides (what is inherited), the security team's Zero Trust target
  for this system, and the hosting milestones.
- **Brad, 21 Oct 2026:** *"Let's start working a plan and drafting it so that when we're ready to execute it we're
  ready."* Design and execution plan, draft 1, written that day and given to Brad as a file. It is kept OUTSIDE git (it
  describes the security design of a CUI system). Its shape, for the record: re-host the current interface first, then
  move the money engine and the import checks to the server; Zero Trust by pillar; planned 800-53 traceability (every
  line planned or inherited until there is code to point to); phases relative to the day hosting is available (D to
  D+180, then cutover after authorization); eight questions for the security team.
- **Brad, 2 Nov 2026 (v2.13's question 4):** nobody works out of the shared folder today; on Azure everyone works in one hosted
  environment. A PPBE cycle chosen there moves every appropriation for everyone at once, which the shared folder cannot do
  (each folder copy is saved only by its own board).
- **Brad, 22 Oct 2026 (with items 110-111):** the file's outside connections were removed "for now"; "once we build the azure
  update we'll want to be able to connect". The Azure build carries the connections (the shared state, GenAI.mil for item 109)
  server-side under the user's sign-in, with a policy that allows exactly those services.

### 133. The Service share workbook (withdrawn 24 Nov 2026, Brad: item 150 removes the cost estimate it was built on)
*As logged (Brad, 28 Oct 2026):*
- **Asked:** the product in item 132's ask, for the joint PRR with the Services in about two months (late December 2026).
  One product for everyone -- *"It's no secret"* -- in Excel, so it can be manipulated; it ends up on slides.
- **What is there today** (the same mapped read): no report puts the five on one line. The Excel workbook's Decision Bands
  detail has the requirement, each Service's funded dollars, CCaR and PID; the Funds Flow follows CCaR rows by title; the
  ACE Tie-Out ties requirements to the ACE by WBS, for the open appropriation only. There is no contract number anywhere.
  The CCaR pull's rows carry no requirement id: they match by record title (97.3% of O&M dollars by the code's own
  measurement), and 108 of 155 O&M requirements share a title. ORBIT's "obligated" is a CCaR row whose Alloc column does
  not say *Not Allocated*; there is no expenditure figure. No cost-share rule exists: each Service's dollars are typed per
  requirement. The ACE import keeps US services only.
- **Brad's decisions (28 Oct 2026):**
  1. **By the ACE's WBS tree** (item 132).
  2. **Execution:** obligations now; expenditures later, as they become more prioritized.
  3. **Contract** means the contract number, one per requirement. It is a new addition in both CCaR and ORBIT. A MIPR
     number does not go in it.
  4. **Cost share** is each Service's percentage of what is funded. *"In the Excel format it should include a box that we
     can type in a partner total which would adjust percentages for that line"* -- a box on every line, and a header adds
     the boxes beneath it. ORBIT does not keep the partner figures; they live in the workbook.
  5. **Years:** the budget year onward is planned, from ORBIT's funded figures. The active year is actuals and planned,
     and its data lives only in CCaR; Brad's team is adding the WBS paragraph number to every CCaR plan event.
  6. **Services:** three -- Air Force (USAF, ANG, AFRC), Marine Corps (USMC STOVL, USMC CV) and Navy (USN CV) -- with the
     six lines kept on the data tab (proposed 28 Oct; Brad did not object).
- **The mock-up** (invented figures, contract and CCaR numbers; placeholder WBS names): `recovery/item133-mockup/`. `sh
  make.sh` builds it (`model.py`, `xlsx.py`), saves it once through LibreOffice so the file carries computed values (a phone
  or mail preview shows figures, not blanks; the formulas stay live), and runs `check.py`. Tabs: *How to read*, *FY27
  (active)*, *FY27 by month*, *FY28* (budget year), *FY29*, *Data*; renders in `xlsx-*.png`.
  - **The Data tab is the one source.** One row per figure, a column per measure -- Requirement and Funded (ORBIT), CCaR
    plan, Obligated and Planned to obligate (CCaR), ACE estimate -- never two measures in one column. The active year's
    CCaR figures and ORBIT's figures are named apart: they come from two systems and do not line up row by row (the
    workbook says so). Months are dates; the WBS levels are columns, named.
  - **Every other figure is a SUMIFS over Data**, keyed by the row's own hidden keys (year, appropriation, WBS level,
    paragraph, line) -- never a range of rows -- so sorting, filtering, collapsing or inserting rows cannot move a total.
    A plan line is keyed by the ORBIT requirement's id, never its CCaR record or contract (a CCaR record is shared and a
    contract number starts blank); a CCaR line by record, title and contract. Every WBS key carries a `W|` prefix, so Excel
    never reads a key such as 1.1 as a number and matches 1.10 with it.
    The partner box (yellow, on every row) takes **$M** and has data validation; a header adds every partner figure on its
    own row and beneath it, keyed the same way.
  - **What the fixture carries, because real data will:** Full Fund's USMC-B (counted as Marine Corps), a letter-suffixed
    paragraph (1.1.1.1E, beside 1.1.1.1), an ACE line no requirement claims (1.1.1.3: its own row, in every ACE total), a
    requirement on a parent that has children (1.2.2), a requirement with no WBS paragraph ("No WBS paragraph yet", inside
    its appropriation's totals), one on a paragraph the ACE lacks (1.4, flagged red -- decided by the estimate's own lines
    for that appropriation and year, not by the names list), one in the ACE with no name linked (1.3.1), 1.10 beside 1.1,
    two requirements sharing a CCaR record with no contract number (MIPRs), one CCaR record carrying two contracts, a plan
    event that slipped and one obligated early, a procurement plan event dated past September (an *After* column on the
    month tab), a CCaR row whose budget name names no Service (*Service not identified*, in every total), Initial Spares
    and OPN, and FY26 procurement money obligating in FY27 (on the active-year tab, marked *FY26 money*; the Data tab keeps
    its own FY beside *Shown on*). The top line names the appropriations it covers. Every sheet carries the marking in its page header and
    footer, and the Data tab above its table.
  - **`check.py`** recalculates the saved file in LibreOffice and holds all 259 rows of the four tree tabs to figures worked
    out from `model.py` with the Service groups written out by hand (never the builder's own list), every line's shares to
    100%, the month tab's totals to the active tab's, the Data tab's measures, no formula pointing at another row, every
    key's prefix, the marking, and partner figures typed in $M on a line, a WBS header, an appropriation and the active
    tab. Eleven planted mistakes each fail it: the USMC-B alias dropped (246), the partner box not converted from $M (12),
    the unclaimed ACE line pruned (1), the "No WBS paragraph yet" block dropped (1), requirement and funded in one Data
    column (1,183), plan lines keyed by CCaR record and contract (345), the unidentified Service left out of the US total
    (29), plan events after September dropped (13), the ACE flag taken from the names list (1), the key prefix dropped (5),
    earlier years' money dropped from the active tab (194).
  - **Rebuilt after an independent review (28 Oct):** three reviewers (Brad's decisions, the Excel under real use, what
    ORBIT can deliver), each finding reproduced in LibreOffice. The first cut summed requirement and funded in one Data
    column (a pivot doubled the plan years), took the partner box in dollars under a $M label (2.5 did nothing), lost a row
    inserted at a block's edge and scrambled totals on a sort (positional ranges), dropped money with no paragraph and ACE
    lines with no requirement, carried no unit on a copied cell, and stored no computed values. The third review (what
    ORBIT can deliver) found the rebuild keying a plan line by CCaR record and contract, so two MIPRs sharing a record each
    printed the other's money; the ACE flag decided by the names list; keys Excel could read as numbers; an unidentified
    Service and procurement dated past September falling out of the totals; the active year's CCaR figures filed as
    "Funded" beside ORBIT's; and no marking on the Data tab. Each is fixed above.
- **Proposed build (after item 132):**
  - A read-only export under Reports & exports, laid out as the mock-up. Plan years from `tiers()` (funded = d + m per
    service), each appropriation read as its own board opens it; the active year from the CCaR pull, each row placed by its
    plan event's WBS paragraph, its Service read from its budget name. Nothing recomputed, nothing written to the board.
    Services join by name through `SVC_ALIAS` (Full Fund's USMC-B is Marine Corps); WBS paragraphs sort naturally; which header a
    line rolls up to is item 132's tree (one rule for both, so an *E* line rolls up as item 132 decides).
  - **The contract number** as a new requirement field (the record, the Add and edit boxes, PMO copies, year copies, the
    import door), printed in this workbook, and written to the Spend Plan Source once CCaR has a column for it.
  - **Formulas in ORBIT's Excel writer**, opt in: a cell may carry `{f, v}`, written as `<f>` with `<v>` = ORBIT's own
    figure, so the file shows figures before it is recalculated and the board's read-back checks can compare them. Every
    workbook that does not ask stays byte-for-byte as it is.
  - **Ask CCaR to carry ORBIT's requirement id** beside the contract number, so CCaR rows match requirements exactly (Brad's
    "yes", 28 Oct, read as covering this).
  - **Obligated** is CCaR's allocation status (`isAlloc`). The Spend Plan Source writes *Forecast allocated to a Plan Event*
    for an active year, and `isAlloc` would read that text, coming back unchanged, as obligated: the build counts obligated
    only on a positive allocated value, and states blank, forecast and unknown Alloc text apart, with their dollars.
  - **The CCaR pull is read by position** (`SRC_NCOL` = 32, `QPE_READS` by index): a contract-number column CCaR *inserts*
    re-points every read after it, and one it *appends* is dropped. Agree the slot with CCaR (an existing column such as
    30, *Contract Mod*, or a re-measure of `SRC_HDR` and the Spend Plan Source together). The contract field joins the full
    field plumbing (`REQ_FIELD`, `recFields`, `REQ_MAPS`, `PMO_FIELDS`, `NA_FROM_CARRY`, the import door, `codeTake`).
  - **Primes:** the WBS and the CCaR number are per CLIN (`S.clinWbs`; the Spend Plan Source sends each CLIN's own CCaR
    number), funded spread over CLIN x WBS by the CLIN grid (`aceAlignRows`). The build's fixture needs a prime with two
    CLINs on different paragraphs; which contract number its line prints is to decide (one per requirement, Brad, 28 Oct).
  - **The ACE column is a filtered subset of the ACE file** (first sheet, JPO-managed, the seven ACE PMOs, US services;
    stored x1e6 without `D$`): print the estimate's name and its skip counts on each tab and round at the door. The names
    tab Brad finds needs a read of its own; CCaR's column 23 descriptions are a second source of names.
  - **WBS codes are normalised once, from all three sources** (case and spaces; the letters are kept -- `P6` is not
    `6`, and `….1E` is not `….1`) before they become keys; the level
    count comes from the data, not a constant. CCaR amounts keep cents and read *(1,234)* as positive today: round at the
    door and read parentheses as negative. The *pull through* date comes from `repYmOf`, not `asOf` or today.
  - **A requirement line's label repeats on real data** (108 of 155 O&M requirements share a record name; OPN shares one plan
    event): print the plan event, the record name and the PID beside each other, as Decision Bands does.
- **Answered (Brad, 28 Oct 2026):**
  1. **A requirement on two paragraphs:** what the office types per paragraph is **the allocation** -- as ORBIT's WBS lines
     already split it (`wbsResolve`). So per paragraph: the allocation as typed; funded spread over the paragraphs by
     allocation (as `aceAlignRows` spreads it); the requirement value apportioned by the same weights (`apportion`); and any
     allocation the typed lines do not cover on a line of its own, "not assigned to a paragraph". (The mock-up, splitting
     requirement and funded by one fraction, shows the same result where the allocation follows that fraction.)
  2. **OPN is in:** *"It's a smaller appropriation but we still need to be in balance."*
  3. **Earlier years' procurement money obligating this year goes on the active-year tab:** *"Yes, but let's revisit if it
     doesn't view as planned."* CCaR files those rows under their own FY; the tab shows the ones dated inside the active
     year, marked with their year, in every total. The ACE beside the active year is that year's estimate, which earlier
     years' money is outside, and the tab says so.
  4. **What CCaR's Alloc column says for a plan event not yet obligated:** *"Not allocated. Everything in ORBIT is planned
     for the future. CCaR is for active year obligations when we have the authority to obligate."* So obligated is read from
     CCaR's own allocation status, as `isAlloc` reads it, and ORBIT's figures are never obligations.
  5. **ORBIT's WBS goes into the Spend Plan Source's WBS column**, line by line: item 132, decision 4.
  6. **The out-years' basis:** *"All years should reference the PPBE Budget assigned. As we go through the PPBE process we
     need to be able to adjust funded positions on each requirement to fit within our new PPBE position."* Item 134. Built
     on it, this workbook's plan years are funded within the PPBE position.
  7. **The marking** *CUI//REL TO US DoW*: *"Yes."*
- **Open:** which CCaR column will carry the contract number. **Brad, 3 Nov 2026:** build now; the Spend Plan Source write waits
  for CCaR's column.


### 1. PIDs show up in the CCaR column of the Excel workbook
- **Withdrawn 23 Sep 2026 by Brad:** the PID is in the right column now. No change.
- What testing had shown, kept for the record: the export places the CCaR number and the PID in
  their own columns on every sheet, including a requirement with a PID and no CCaR number.

## Shipped

Moved to `SHIPPED.md` (item 165, 26 Nov 2026): every shipped version's record, verbatim.
